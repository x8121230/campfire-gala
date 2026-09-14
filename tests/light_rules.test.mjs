import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIGHT_LEVELS } from '../src/data/LightWorkshopLevels.js';
import { compileLightLevel, lightInitial, traceLight, reflected, LightSession, createLightSolver } from '../src/data/LightWorkshopRules.js';
import { MINI_GAME_CATALOG, getMiniGamesByCategory } from '../src/data/MiniGameCatalog.js';
const puzzle = nodes => compileLightLevel({id:'test',par:99,nodes});
const source = (id,x,y,dir,color,initial=1,locked=true)=>({id,kind:'source',x,y,dir,color,initial,locked});
const target = (id,x,y,want)=>({id,kind:'target',x,y,want});
function solve(l,state=lightInitial(l)){const j=createLightSolver(l,state);while(j.status==='searching')j.tick(32);return j;}

test('20 distinct authored puzzles start unsolved and can earn three stars within adjustment targets',()=>{
    assert.equal(LIGHT_LEVELS.length,20);assert.equal(new Set(LIGHT_LEVELS.map(l=>JSON.stringify(l.nodes))).size,20);
    for(const spec of LIGHT_LEVELS){
        const l=compileLightLevel(spec),s=new LightSession(l),j=solve(l);assert(!s.evaluate().solved);assert.equal(j.status,'solved',String(spec.id));
        j.best.forEach((v,i)=>{while(s.state[i]!==v)assert(s.turn(i));});
        assert.equal(s.moves,j.cost);assert(s.moves<=l.par);assert(s.submit());assert.deepEqual(s.medals(),[true,true,true]);
    }
});
test('every shipped configuration terminates within finite ray-state bound and reports exact colors',()=>{
    let checked=0;
    for(const spec of LIGHT_LEVELS){const l=compileLightLevel(spec);
        for(let id=0;id<l.combinations;id++){let n=id;const values=l.controls.map(c=>{const v=n%c.radix;n=Math.floor(n/c.radix);return v;});const result=traceLight(l,values);
            assert(result.visited<=l.width*l.height*4*3);assert.equal(result.solved,result.goals.every(g=>g.got===g.want));
            for(const g of result.goals)assert(g.got>=0&&g.got<=7);checked++;
        }
    }
    assert(checked>600);
});
test('both mirror slopes implement all four expected reflection directions',()=>{
    assert.deepEqual([0,1,2,3].map(d=>reflected(d,0)),[3,2,1,0]);
    assert.deepEqual([0,1,2,3].map(d=>reflected(d,1)),[1,0,3,2]);
});
test('splitter sends a straight beam and a reflected beam to two independent receivers',()=>{
    const l=puzzle([source('s',0,3,0,1),{id:'p',kind:'splitter',x:3,y:3,initial:0},target('up',3,0,1),target('right',8,3,1)]);
    assert.deepEqual(traceLight(l).received,{up:1,right:1});assert(traceLight(l).solved);
});
test('dark receivers require zero; shutting every source off cannot satisfy a colored receiver',()=>{
    const l=compileLightLevel(LIGHT_LEVELS[4]),s=new LightSession(l);assert(!s.evaluate().solved);
    l.controls.forEach((n,i)=>{if(n.kind==='source')s.state[i]=0;});assert(!s.evaluate().solved);assert.equal(s.evaluate().activeSources,0);
});
test('RGB light combines only at receivers; unwanted extra color invalidates an exact target',()=>{
    for(const [a,b,want] of [[1,2,3],[2,4,6],[1,4,5]]){
        const l=puzzle([source('a',0,3,0,a),source('b',4,6,3,b),target('t',4,3,want)]);assert(traceLight(l).solved);
    }
    const l=puzzle([source('r',0,3,0,1),source('g',8,3,2,2),source('b',4,6,3,4),target('t',4,3,7)]);assert.equal(traceLight(l).received.t,7);assert(traceLight(l).solved);
    l.targets[0].want=3;assert(!traceLight(l).solved);
});
test('crossing rays do not transfer color to each other downstream',()=>{
    const l=puzzle([source('r',0,3,0,1),source('b',4,6,3,4),target('right',8,3,1),target('top',4,0,4)]);
    assert.deepEqual(traceLight(l).received,{right:1,top:4});
});
test('filters pass only selected RGB component from white light',()=>{
    const l=puzzle([source('s',0,3,0,7),{id:'f',kind:'filter',x:3,y:3},target('t',7,3,1)]);
    for(let v=0;v<3;v++)assert.equal(traceLight(l,[v]).received.t,[1,2,4][v]);
});
test('closed ray loop with a splitter terminates without losing the external branch',()=>{
    const l=puzzle([source('s',0,4,0,1),{id:'entry',kind:'mirror',x:3,y:4,initial:0,locked:true},
        {id:'p',kind:'splitter',x:3,y:3,initial:0,locked:true},
        {id:'a',kind:'mirror',x:3,y:1,initial:1,locked:true},{id:'b',kind:'mirror',x:1,y:1,initial:0,locked:true},
        {id:'c',kind:'mirror',x:1,y:3,initial:1,locked:true},target('t',8,3,1)]);
    const result=traceLight(l);assert(result.solved);assert(result.visited>15&&result.visited<100);
});
test('walls, opaque source housings and receiving crystals stop incoming beams',()=>{
    const a=puzzle([source('s',0,3,0,1),{id:'w',kind:'wall',x:3,y:3},target('t',8,3,1)]);assert.equal(traceLight(a).received.t,0);
    const b=puzzle([source('s',0,3,0,1),source('off',3,3,3,4,0),target('t',8,3,1)]);assert.equal(traceLight(b).received.t,0);
    const c=puzzle([source('s',0,3,0,1),target('first',3,3,1),target('last',8,3,1)]);assert.deepEqual(traceLight(c).received,{first:1,last:0});
});
test('turns cycle filters, reject invalid controls, and undo restores exact history without erasing hint use',()=>{
    const s=new LightSession(compileLightLevel(LIGHT_LEVELS[12])),before=[...s.state];
    for(const i of [-1,100,NaN,1.2,'0'])assert.equal(s.turn(i),false);assert.equal(s.moves,0);
    for(let n=0;n<3;n++)s.turn(0);assert.deepEqual(s.state,before);s.hintsUsed=1;
    for(let n=0;n<3;n++)assert(s.undo());assert.deepEqual(s.state,before);assert.equal(s.moves,0);assert.equal(s.hintsUsed,1);
});
test('hint solver minimizes forward-cycle adjustments from current state and never mutates it',()=>{
    const l=compileLightLevel(LIGHT_LEVELS[19]),s=new LightSession(l);s.turn(0);s.turn(2);s.turn(5);const before=[...s.state],j=solve(l,s.state);
    assert.deepEqual(s.state,before);assert.equal(j.status,'solved');assert(traceLight(l,j.best).solved);
    const cost=j.best.reduce((n,v,i)=>n+(v-before[i]+l.controls[i].radix)%l.controls[i].radix,0);assert.equal(j.cost,cost);
    assert.equal(solve(l,j.best).cost,0);
});
test('live correct preview still needs submit; failed checks do not change configuration or penalize stars',()=>{
    const s=new LightSession(compileLightLevel(LIGHT_LEVELS[0]));const before=[...s.state];assert.equal(s.submit(),false);assert.deepEqual(s.state,before);
    s.turn(0);assert(s.evaluate().solved);assert(!s.finished);assert(s.submit());assert(s.finished);assert.equal(s.turn(0),false);assert.equal(s.undo(),false);assert.equal(s.submit(),false);assert.deepEqual(s.medals(),[true,true,true]);
});
test('compiler rejects overlap, missing lit goal, unsupported states and excessive search space',()=>{
    assert.throws(()=>puzzle([source('s',0,3,0,1),target('t',0,3,1)]));
    assert.throws(()=>puzzle([source('s',0,3,0,1),target('t',3,3,0)]));
    assert.throws(()=>traceLight(compileLightLevel(LIGHT_LEVELS[0]),[2]));
    assert.throws(()=>compileLightLevel({id:'large',width:20,height:2,nodes:[source('s',0,0,0,1),...Array.from({length:17},(_,i)=>({id:'m'+i,kind:'mirror',x:i+1,y:0})),target('t',19,0,1)]}));
});
test('incremental solver pauses between chunks and distinguishes genuinely impossible optical layouts',()=>{
    const j=createLightSolver(compileLightLevel(LIGHT_LEVELS[19]));j.tick(1);assert.equal(j.checked,1);assert.equal(j.status,'searching');
    const l=puzzle([source('s',0,3,0,1),{id:'w',kind:'wall',x:3,y:3},target('t',8,3,1)]);assert.equal(solve(l).status,'no-solution');
});
test('catalog retains light workshop among 22 scenes; new logic has no formal progress or external writes',()=>{
    assert.equal(MINI_GAME_CATALOG.length,23);assert.equal(getMiniGamesByCategory('observation').length,7);assert(MINI_GAME_CATALOG.some(g=>g.id==='light_workshop'));
    const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');assert.match(main,/import LightWorkshopGame from/);assert.match(main,/\n        LightWorkshopGame,/);
    for(const name of ['../src/data/LightWorkshopRules.js','../src/scenes/LightWorkshopGame.js'])assert.doesNotMatch(readFileSync(new URL(name,import.meta.url),'utf8'),/localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|unlockAchievement|grantReward/);
});
