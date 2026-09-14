import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COURIER_LEVELS,COURIER_VARIANTS,makeCourierVariant} from '../src/data/CourierLevels.js';
import {compileCourierLevel,initialCourierState,cargoWeight,courierComplete,courierStep,CourierSession,createCourierSolver} from '../src/data/CourierRules.js';
import {MINI_GAME_CATALOG,getMiniGamesByCategory} from '../src/data/MiniGameCatalog.js';
const p=(from,to,weight=1,extra={})=>({name:'包裹',from,to,weight,...extra});
const tiny=(parcels,extra={})=>compileCourierLevel({id:'t',par:99,start:0,capacity:2,nodes:[0,1,2].map(i=>({name:`站${i}`,x:i*100,y:200})),edges:[{a:0,b:1,cost:1},{a:1,b:2,cost:1}],parcels,...extra});
const move=to=>({type:'move',to}),load=parcel=>({type:'load',parcel}),unload=parcel=>({type:'unload',parcel});
function solve(l,s=initialCourierState(l),limit){const j=createCourierSolver(l,s,limit);while(j.status==='searching')j.tick(100);return j;}

test('all 18 main missions and 12 variants are unique, solvable and can earn all three stars',()=>{
    assert.equal(COURIER_LEVELS.length,18);assert.equal(COURIER_VARIANTS.length,12);
    const unique=new Set();
    for(const spec of [...COURIER_LEVELS,...COURIER_VARIANTS]){
        const l=compileCourierLevel(spec),s=new CourierSession(l),j=solve(l);assert(!courierComplete(l,s.state));assert.equal(j.status,'solved',String(l.id));
        for(const a of j.solution){const r=s.act(a);assert(r.ok);assert(!s.state.failed);assert(cargoWeight(l,s.state)<=l.capacity);}
        assert.equal(s.state.distance,j.cost);assert(s.state.distance<=l.par,`${l.id} ${j.cost}/${l.par}`);assert.deepEqual(s.medals(),[true,true,true]);
        unique.add(JSON.stringify([l.start,l.edges,l.parcels]));
    }
    assert.equal(unique.size,30);assert.deepEqual(makeCourierVariant(7),makeCourierVariant(7));
});
test('arriving does not auto-pickup; only intended receiver accepts carried parcel',()=>{
    const s=new CourierSession(tiny([p(0,2)]));s.act(move(1));assert.deepEqual(s.state.parcels,[0]);assert(!s.act(load(0)).ok);
    s.act(move(0));s.act(load(0));s.act(move(1));assert.deepEqual(s.state.parcels,[1]);s.act(move(2));assert.deepEqual(s.state.parcels,[2]);assert.equal(cargoWeight(s.level,s.state),0);
});
test('capacity uses weight rather than item count, and delivery frees capacity',()=>{
    const s=new CourierSession(tiny([p(0,1,2),p(0,2)]));assert(s.act(load(0)).ok);const before=JSON.stringify(s.state);
    assert(!s.act(load(1)).ok);assert.equal(JSON.stringify(s.state),before);s.act(move(1));s.act(move(0));assert(s.act(load(1)).ok);
});
test('narrow path checks total carried weight; blocked road never consumes distance or freshness',()=>{
    const l=tiny([p(0,2,1,{fresh:4}),p(0,2)],{edges:[{a:0,b:1,cost:1,maxLoad:1},{a:1,b:2,cost:1}]});
    const s=new CourierSession(l);s.act(load(0));s.act(load(1));const before=JSON.stringify(s.state);assert(!s.act(move(1)).ok);assert.equal(JSON.stringify(s.state),before);
    s.act(unload(1));assert(s.act(move(1)).ok);assert.equal(s.state.age[0],1);
});
test('switch only works at its station and independently controls its own bridge',()=>{
    const l=tiny([p(0,2)],{gateCount:2,nodes:[{name:'站0',x:0,y:0,switch:0},{name:'站1',x:100,y:0,switch:1},{name:'站2',x:200,y:0}],edges:[{a:0,b:1,cost:1,gate:0},{a:1,b:2,cost:1,gate:1}]});
    const s=new CourierSession(l);s.act(load(0));assert(!s.act(move(1)).ok);s.act({type:'toggle'});assert.equal(s.state.gates,1);s.act(move(1));assert(!s.act(move(2)).ok);s.act({type:'toggle'});assert.equal(s.state.gates,3);s.act(move(2));assert(courierComplete(l,s.state));
});
test('delivered permit opens road; just carrying permit does not',()=>{
    const s=new CourierSession(tiny([p(0,1),p(0,2)],{edges:[{a:0,b:1,cost:1},{a:1,b:2,cost:1,permit:0}]}));
    s.act(load(1));s.act(move(1));assert(!s.act(move(2)).ok);s.act(move(0));s.act(load(0));assert.equal(s.state.parcels[0],1);s.act(move(1));assert(s.act(move(2)).ok);
});
test('every prerequisite must be delivered before dependent parcel can be collected',()=>{
    const s=new CourierSession(tiny([p(0,1),p(0,1),p(1,2,1,{requires:[0,1]})]));
    s.act(load(0));s.act(move(1));assert(!s.act(load(2)).ok);s.act(move(0));s.act(load(1));s.act(move(1));assert(s.act(load(2)).ok);
});
test('freshness counts weighted travel only and accepts arrival exactly at its limit',()=>{
    const l=tiny([p(0,2,1,{fresh:3})],{edges:[{a:0,b:1,cost:2},{a:1,b:2,cost:1}]});const s=new CourierSession(l);
    s.act(load(0));assert.equal(s.state.age[0],0);s.act(move(1));assert.equal(s.state.age[0],2);s.act(move(2));assert(!s.state.failed);assert(courierComplete(l,s.state));
});
test('expired delivery fails before handoff and can be undone without losing cargo',()=>{
    const s=new CourierSession(tiny([p(0,2,1,{fresh:1})]));s.act(load(0));s.act(move(1));s.act(move(2));assert(s.state.failed);assert.equal(s.state.parcels[0],1);assert(!s.act(move(1)).ok);
    assert(s.undo());assert(!s.state.failed);assert.equal(s.state.pos,1);assert.equal(s.state.age[0],1);
});
test('putting cargo back at pickup does not reset spent freshness; depot waiting does not age it',()=>{
    const s=new CourierSession(tiny([p(0,2,1,{fresh:5})]));s.act(load(0));s.act(move(1));assert(!s.act(unload(0)).ok);s.act(move(0));s.act(unload(0));assert.equal(s.state.age[0],2);
    s.act(move(1));s.act(move(0));assert.equal(s.state.age[0],2);s.act(load(0));assert.equal(s.state.age[0],2);
});
test('loading and bridge operations do not consume road distance or freshness',()=>{
    const l=tiny([p(0,2,1,{fresh:3})],{gateCount:1,nodes:[{name:'站0',x:0,y:0,switch:0},{name:'站1',x:100,y:0},{name:'站2',x:200,y:0}]});const s=new CourierSession(l);
    s.act(load(0));for(let i=0;i<8;i++)s.act({type:'toggle'});assert.equal(s.state.distance,0);assert.equal(s.state.age[0],0);
});
test('undo restores complete state including deliveries, ages and bridges; hints stay used',()=>{
    const l=compileCourierLevel(COURIER_LEVELS[17]),s=new CourierSession(l),original=JSON.stringify(s.state),j=solve(l);s.hintsUsed=3;
    j.solution.forEach(a=>s.act(a));assert(courierComplete(l,s.state));while(s.undo()){}assert.equal(JSON.stringify(s.state),original);assert.equal(s.hintsUsed,3);
});
test('return-home goal keeps task open after last delivery and prevents further actions after completion',()=>{
    const l=tiny([p(0,1)],{returnHome:true,start:0}),s=new CourierSession(l);s.act(load(0));s.act(move(1));assert(!courierComplete(l,s.state));s.act(move(0));assert(courierComplete(l,s.state));assert(!s.act(move(1)).ok);
});
test('Dijkstra chooses lower total road cost instead of fewer moves',()=>{
    const l=tiny([p(0,2)],{edges:[{a:0,b:2,cost:5},{a:0,b:1,cost:1},{a:1,b:2,cost:1}]}),j=solve(l);
    assert.equal(j.cost,2);assert.deepEqual(j.solution,[load(0),move(1),move(2)]);
});
test('incremental solver starts from current state, is read-only, and returns remaining cost',()=>{
    const l=compileCourierLevel(COURIER_LEVELS[17]),s=new CourierSession(l);s.act(load(1));s.act(move(5));const before=JSON.stringify(s.state),j=createCourierSolver(l,s.state);j.tick(1);assert.equal(j.checked,1);assert.equal(j.status,'searching');
    while(j.status==='searching')j.tick(8);assert.equal(j.status,'solved');assert.equal(JSON.stringify(s.state),before);const distance=s.state.distance;j.solution.forEach(a=>s.act(a));assert.equal(s.state.distance-distance,j.cost);assert(courierComplete(l,s.state));
});
test('unsolvable fresh cargo and search-budget limit have distinct results',()=>{
    assert.equal(solve(tiny([p(0,2,1,{fresh:1})])).status,'unsolvable');
    assert.equal(solve(compileCourierLevel(COURIER_LEVELS[17]),undefined,1).status,'limit');
});
test('stars require completion, optimal target and no hint independently',()=>{
    const l=tiny([p(0,2)],{par:2}),s=new CourierSession(l);assert.deepEqual(s.medals(),[false,false,false]);s.act(load(0));s.act(move(1));s.act(move(0));s.act(move(1));s.act(move(2));assert.deepEqual(s.medals(),[true,false,true]);s.hintsUsed=1;assert.deepEqual(s.medals(),[true,false,false]);
});
test('malformed routes, prerequisites and parcels are rejected without mutating source specs',()=>{
    const spec=JSON.parse(JSON.stringify(COURIER_LEVELS[0])),before=JSON.stringify(spec);compileCourierLevel(spec);assert.equal(JSON.stringify(spec),before);
    for(const mutate of [s=>s.capacity=0,s=>s.edges[0].cost=0,s=>s.edges.push({...s.edges[0]}),s=>s.parcels[0].fresh=0,s=>s.parcels[0].requires=[0],s=>s.edges[0].gate=8,s=>s.parcels[0].to=99]){const x=JSON.parse(before);mutate(x);assert.throws(()=>compileCourierLevel(x));}
    assert.throws(()=>tiny([p(0,1,1,{requires:[1]}),p(1,2,1,{requires:[0]})]));
});
test('main catalog has 23 unique entries and courier game is integrated without external progress writes',()=>{
    assert.equal(MINI_GAME_CATALOG.length,23);assert.equal(new Set(MINI_GAME_CATALOG.map(g=>g.id)).size,23);assert.equal(getMiniGamesByCategory('board').length,4);assert(MINI_GAME_CATALOG.some(g=>g.id==='forest_courier'));
    const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');assert.match(main,/import ForestCourierGame from/);assert.match(main,/\n        ForestCourierGame,/);
    for(const name of ['../src/data/CourierRules.js','../src/scenes/ForestCourierGame.js'])assert.doesNotMatch(readFileSync(new URL(name,import.meta.url),'utf8'),/localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|unlockAchievement|grantReward/);
});
