import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MorphSession,compileMorphLevel,MORPH_DT,playerBox,intersects,moverAt,rockAt} from '../src/data/MorphRules.js';
import {MORPH_LEVELS} from '../src/data/MorphLevels.js';
import {MORPH_ROUTES,executeMorphRouteCommand} from './fixtures/morph_routes.mjs';
import {MINI_GAME_CATALOG,getMiniGamesByCategory} from '../src/data/MiniGameCatalog.js';
const tick=(s,n=1,input={})=>{for(let i=0;i<n;i++)s.advance(MORPH_DT,input);};
const tiny=(extra={})=>compileMorphLevel({id:'unit',width:1600,spawn:{x:80,y:560},exit:{x:1510,y:560},platforms:[{x:0,y:560,w:1600,h:150}],badges:[{x:200,y:530},{x:800,y:530},{x:1300,y:530}],challenge:{type:'falls',value:2},...extra});

test('12 distinct stages finish by real movement/jump/form inputs with all badges and no falls',()=>{
    assert.equal(MORPH_LEVELS.length,12);assert.equal(new Set(MORPH_LEVELS.map(l=>JSON.stringify(l.platforms)+JSON.stringify(l.vines))).size,12);
    for(let i=0;i<12;i++){const s=new MorphSession(compileMorphLevel(MORPH_LEVELS[i]));tick(s,3);for(const c of MORPH_ROUTES[i])executeMorphRouteCommand(s,c);assert(s.finished,`stage ${i+1}`);assert.equal(s.falls,0);assert.deepEqual(s.medals(),[true,true,true]);}
});
test('fixed-step simulation gives same result with 30, 60 and 120 FPS frame grouping',()=>{
    const states=[30,60,120].map(fps=>{const s=new MorphSession(tiny());for(const input of [{right:true},{right:true,jump:true},{left:true},{}])for(let n=0;n<fps;n++)s.advance(1/fps,input);return s.player;});
    for(const s of states.slice(1)){assert(Math.abs(s.x-states[0].x)<1e-7);assert(Math.abs(s.y-states[0].y)<1e-7);assert(Math.abs(s.vx-states[0].vx)<1e-7);}
});
test('releasing jump early produces a lower jump; holding does not cause repeated jumps',()=>{
    const heights=[];for(const release of [8,120]){const s=new MorphSession(tiny());tick(s,3);let top=560;for(let n=0;n<120;n++){tick(s,1,{jump:n<release});top=Math.min(top,s.player.y);}heights.push(top);if(release===120)assert(s.player.grounded);}
    assert(heights[1]<heights[0]-50);
});
test('coyote time accepts a jump just after walking off a ledge, but expires',()=>{
    for(const [frames,canJump] of [[4,true],[18,false]]){const s=new MorphSession(tiny({platforms:[{x:0,y:560,w:600,h:150},{x:900,y:560,w:700,h:150}]}));Object.assign(s.player,{x:630,y:560,grounded:false,coyote:.1,vy:0});tick(s,frames);tick(s,1,{jump:true});assert.equal(s.player.vy<0,canJump);}
});
test('jump buffer launches on landing without requiring an extra press',()=>{
    const s=new MorphSession(tiny());Object.assign(s.player,{x:300,y:538,vy:280,grounded:false});tick(s,12,{jump:true});assert(s.player.vy<0);assert(s.player.y<560);
});
test('round form fits low passage and cannot expand through ceiling',()=>{
    const s=new MorphSession(tiny({platforms:[{x:0,y:560,w:1600,h:150},{x:400,y:385,w:220,h:143}]}));s.player.x=500;tick(s,2);assert.equal(s.falls,0);assert(!s.setForm(1));assert(!s.setForm(2));assert.equal(s.player.form,0);assert.match(s.message,/空間不夠/);
    s.player.x=700;assert(s.setForm(2));assert.equal(s.player.y,560);
});
test('triangle dash cuts vines; walking or dashing in another form does not',()=>{
    for(const [form,dash,cut] of [[0,true,false],[1,false,false],[1,true,true]]){
        const s=new MorphSession(tiny({vines:[{x:190,y:390,w:30,h:170}]}));s.player.x=145;s.setForm(form);tick(s,30,{right:true,dash});assert.equal(s.broken.has(0),cut);assert.equal(s.falls,0);
    }
});
test('dash stops at solid stone without tunneling and requires release plus cooldown to repeat',()=>{
    const s=new MorphSession(tiny({platforms:[{x:0,y:560,w:1600,h:150},{x:220,y:350,w:45,h:210}]}));s.player.x=150;s.setForm(1);tick(s,100,{right:true,dash:true});assert(s.player.x<=202.001);assert.equal(s.events.filter(e=>e==='dash').length,1);
    tick(s,1,{});tick(s,1,{dash:true});assert.equal(s.events.filter(e=>e==='dash').length,2);
});
test('square must stand on plate for its charge duration; opened door stays open after morphing',()=>{
    const l=tiny({plates:[{x:300,y:560,w:90,gate:0}],gates:[{x:600,y:350,w:40,h:210}]}),s=new MorphSession(l);s.player.x=340;tick(s,80);assert.equal(s.gateTimes[0],0);
    s.setForm(2);tick(s,30);assert.equal(s.gateTimes[0],0);tick(s,30);assert(s.gateTimes[0]>7);s.setForm(0);tick(s,10,{right:true});assert(s.gateTimes[0]>7);assert(s.usedPlates.has(0));
});
test('closing gate waits while occupied, then closes once player clears it',()=>{
    const s=new MorphSession(tiny({gates:[{x:600,y:350,w:40,h:210}]}));s.gateTimes[0]=.01;s.player.x=620;tick(s,30);assert.equal(s.falls,0);assert(s.gateTimes[0]>0);s.player.x=700;tick(s,30);assert.equal(s.gateTimes[0],0);
});
test('square resists wind drift and makes more progress against strong wind',()=>{
    const results=[];for(const form of [0,2]){const s=new MorphSession(tiny({winds:[{x:100,y:200,w:1300,h:370,force:-1500}]}));s.player.x=500;s.setForm(form);tick(s,120,{right:true});results.push(s.player.x);}assert(results[1]>results[0]+20);
    const drifts=[];for(const form of [0,2]){const s=new MorphSession(tiny({winds:[{x:100,y:200,w:1300,h:370,force:-1500}]}));s.player.x=500;s.setForm(form);tick(s,120);drifts.push(500-s.player.x);}assert(drifts[1]<drifts[0]/3);
});
test('rising air gives round form a higher jump',()=>{
    const heights=[];for(const lift of [false,true]){const s=new MorphSession(tiny({winds:[{x:0,y:100,w:1500,h:470,force:0,lift}]}));tick(s,3);let top=560;for(let i=0;i<130;i++){tick(s,1,{jump:true});top=Math.min(top,s.player.y);}heights.push(top);}assert(heights[1]<heights[0]-100);
});
test('spring activates from ground approach and can reach high optional platforms',()=>{
    const s=new MorphSession(tiny({springs:[{x:200,y:540,w:80}]}));s.player.x=180;tick(s,30,{right:true});assert(s.usedSprings.has(0));assert(s.player.vy<0);assert(s.player.y<500);
});
test('standing rider is carried by horizontal and vertical moving platforms',()=>{
    for(const [dx,dy] of [[200,0],[0,-150]]){const l=tiny({movers:[{x:400,y:510,w:180,h:20,dx,dy,period:4}]}),s=new MorphSession(l);Object.assign(s.player,{x:480,y:510,grounded:true,groundId:'m0'});tick(s,120);const m=moverAt(l.movers[0],s.time);assert(Math.abs(s.player.x-(m.x+80))<.01);assert(Math.abs(s.player.y-m.y)<.01);assert.equal(s.falls,0);}
});
test('upward platform cannot push player through solid ceiling',()=>{
    const s=new MorphSession(tiny({platforms:[{x:0,y:560,w:1600,h:150},{x:390,y:400,w:220,h:20}],movers:[{x:400,y:510,w:180,h:20,dx:0,dy:-140,period:3}]}));Object.assign(s.player,{x:480,y:510,grounded:true,groundId:'m0'});tick(s,150);assert.equal(s.falls,1);assert(s.player.x<200);
});
test('rock warning is harmless and visible before the finite falling phase',()=>{
    const rock={x:500,top:180,bottom:620,period:4,fall:.8};assert(rockAt(rock,.4).warning);assert(!rockAt(rock,1).warning);assert.equal(rockAt(rock,2),null);
    const s=new MorphSession(tiny({rocks:[rock]}));s.player.x=500;s.time=.3;tick(s,20);assert.equal(s.falls,0);s.time=.8+.8*(535-180)/(620-180);tick(s,1);assert.equal(s.falls,1);
});
test('checkpoint respawn retains badges and cleared vines but resets gate timers',()=>{
    const s=new MorphSession(tiny({checkpoints:[{x:800,y:560}],gates:[{x:1000,y:350,w:40,h:210}]}));s.player.x=800;tick(s,3);assert.equal(s.checkpoint.index,0);assert(s.collected.has(1));s.broken.add(0);s.gateTimes[0]=7;s.player.y=700;tick(s,1);
    assert.equal(s.player.x,800);assert.equal(s.falls,1);assert(s.collected.has(1));assert(s.broken.has(0));assert.equal(s.gateTimes[0],0);assert(s.respawnDelay>0);
});
test('pausing freezes physics, movers, gate countdown and checkpoint delay',()=>{
    const s=new MorphSession(compileMorphLevel(MORPH_LEVELS[11]));s.gateTimes[0]=5;s.paused=true;const before=JSON.stringify([s.player,s.gateTimes,s.time]);tick(s,100,{right:true,jump:true});assert.equal(JSON.stringify([s.player,s.gateTimes,s.time]),before);assert(!s.setForm(2));
});
test('stalled frames are capped; invalid or negative delta does not advance',()=>{
    const s=new MorphSession(tiny());s.advance(15,{right:true});assert(s.time<=.100001);const t=s.time;s.advance(NaN);s.advance(-2);assert.equal(s.time,t);
});
test('badges and special challenge are optional; completion locks movement and grades separately',()=>{
    const s=new MorphSession(tiny({challenge:{type:'forms',value:3}}));s.player.x=1510;tick(s,2);assert(s.finished);assert.deepEqual(s.medals(),[true,false,false]);const x=s.player.x;tick(s,120,{left:true});assert.equal(s.player.x,x);
});
test('level validation rejects unsafe endpoints, invalid gate references and malformed movers',()=>{
    assert.throws(()=>tiny({spawn:{x:80,y:400}}));assert.throws(()=>tiny({plates:[{x:100,y:560,w:50,gate:5}]}));assert.throws(()=>tiny({movers:[{x:400,y:500,w:180,h:20,dx:0,dy:-100,period:0}]}));assert.throws(()=>tiny({badges:[]}));
    const raw=JSON.stringify(MORPH_LEVELS[0]);compileMorphLevel(MORPH_LEVELS[0]);assert.equal(JSON.stringify(MORPH_LEVELS[0]),raw);
});
test('new action game remains integrated in the cumulative catalog with no formal progress writes',()=>{
    assert.equal(MINI_GAME_CATALOG.length,23);assert(MINI_GAME_CATALOG.some(g=>g.id==='forest_morph'));assert.equal(getMiniGamesByCategory('rhythm').length,10);
    const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');assert.match(main,/import ForestMorphGame from/);assert.match(main,/\n        ForestMorphGame,/);
    for(const path of ['../src/data/MorphRules.js','../src/scenes/ForestMorphGame.js'])assert.doesNotMatch(readFileSync(new URL(path,import.meta.url),'utf8'),/localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|unlockAchievement|grantReward/);
});
