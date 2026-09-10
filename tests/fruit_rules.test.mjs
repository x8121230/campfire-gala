import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FruitSession,FRUIT_BOARD,cellKey,cellPosition,neighbors,anchoredKeys,validateFruitLevel,readFruitRows,traceFruitShot,finishFruitShot} from '../src/data/FruitRules.js';
import {FRUIT_LEVELS,dailyFruitLevel,localFruitDate} from '../src/data/FruitLevels.js';
import {MINI_GAME_CATALOG,getMiniGamesByCategory} from '../src/data/MiniGameCatalog.js';
import {FRUIT_ROUTES,DAILY_FRUIT_ROUTES} from './fixtures/fruit_routes.mjs';
const level=(rows,extra={})=>({id:'test',rows,shots:15,par:12,chain:3,ammo:[0,1,2,3],goal:{type:'clear'},...extra});
const settle=s=>{for(let i=0;i<60&&s.phase==='flying';i++)s.advance(.1);assert.notEqual(s.phase,'flying');};
const aimHit=(s,key)=>{for(let a=-72;a<=72;a+=.5){const t=traceFruitShot(s,a);if(t?.hit===key&&t.slot)return a;}throw Error(`Cannot hit ${key}`);};
function play(s,route){s.advance(.1);s.advance(.1);for(const m of route){while(s.launchIndex!==m.launcher)assert(s.switchLauncher());if(m.swap)assert(s.swap());const preview=traceFruitShot(s,m.angle),before=s.remaining;assert(s.fire(m.angle));assert.deepEqual(s.flight.points,preview.points);assert.equal(s.remaining,before-1);settle(s);}return s;}

test('15 authored levels have valid anchored hex geometry and no overlapping fruit',()=>{
 assert.equal(FRUIT_LEVELS.length,15);assert.equal(new Set(FRUIT_LEVELS.map(l=>l.id)).size,15);
 for(const l of FRUIT_LEVELS){assert(validateFruitLevel(l));for(const w of l.waves||[l]){const cells=readFruitRows(w.rows);assert.equal(anchoredKeys(new Map(cells.map(c=>[cellKey(c.r,c.c),c]))).size,cells.length);for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const a=cellPosition(cells[i]),b=cellPosition(cells[j]);assert(Math.hypot(a.x-b.x,a.y-b.y)>47.99);}}}
});
test('all 15 story levels reach three stars using finite legal aim/swap/launcher input replays',()=>{
 for(let i=0;i<15;i++){const s=play(new FruitSession(FRUIT_LEVELS[i]),FRUIT_ROUTES[i]);assert.equal(s.phase,'won',`level ${i+1}`);assert.deepEqual(s.medals(),[true,true,true],`stars ${i+1}`);assert(s.shots<=s.level.par);}
});
test('all 32 daily combinations (4 templates × 4 palettes × mirror) have three-star input routes',()=>{
 assert.equal(DAILY_FRUIT_ROUTES.length,32);assert.equal(new Set(DAILY_FRUIT_ROUTES.map(v=>v.key)).size,32);
 for(const v of DAILY_FRUIT_ROUTES){const s=play(new FruitSession(dailyFruitLevel(v.date)),v.route);assert.equal(s.phase,'won',v.key);assert.deepEqual(s.medals(),[true,true,true],v.key);}
});
test('preview traces are pure and share the precise flight path under wind and moving ceilings',()=>{
 const s=new FruitSession(FRUIT_LEVELS[13]);s.advance(.1);const before=JSON.stringify([...s.board]);const t=s.time,queue=[...s.queue];
 for(const angle of [-72,-51,-13,0,17,54,72]){const p=traceFruitShot(s,angle);assert(p);for(const dot of p.points)assert(dot.x>=23.999&&dot.x<=504.001);if(p.slot){const pos=cellPosition(p.slot,s.offsetAt(s.time+p.duration));for(const b of s.board.values()){const q=cellPosition(b,s.offsetAt(s.time+p.duration));assert(Math.hypot(pos.x-q.x,pos.y-q.y)>47.9);}}}
 assert.equal(JSON.stringify([...s.board]),before);assert.equal(s.time,t);assert.deepEqual(s.queue,queue);
 const p=traceFruitShot(s,37);assert(s.fire(37));assert.deepEqual(s.flight.points,p.points);assert.equal(s.flight.duration,p.duration);
});
test('left and right wall ricochets remain inside walls and attach only adjacent to first contact',()=>{
 const s=new FruitSession(FRUIT_LEVELS[1]);for(const angle of [-72,72]){const tr=traceFruitShot(s,angle);assert(tr.bounces>0);assert(tr.slot);const b=s.board.get(tr.hit);assert(neighbors(b.r,b.c).some(([r,c])=>r===tr.slot.r&&c===tr.slot.c));const last=tr.points.at(-1),p=cellPosition(b,s.offsetAt(s.time+tr.duration));assert(Math.abs(Math.hypot(last.x-p.x,last.y-p.y)-47.98)<.02);}
});
test('wind curves real shots and reverses according to the visible shot cycle',()=>{
 const a=new FruitSession(level(['....RR.....'],{wind:[100,-100],ammo:[2]})),b=new FruitSession(level(['....RR.....'],{wind:[-100,100],ammo:[2]}));const pa=traceFruitShot(a,0),pb=traceFruitShot(b,0);assert(pa.points[10].x>pb.points[10].x);assert.equal(a.wind,100);assert(a.fire(0));settle(a);assert.equal(a.wind,-100);
});
test('two matching fruit remain; the third matching fruit clears the connected group',()=>{
 const s=new FruitSession(level(['....R......'],{ammo:[0]}));finishFruitShot(s,aimHit(s,'0,4'));assert.equal(s.board.size,2);assert.equal(s.stats.removed,0);const key=[...s.board.keys()][0];finishFruitShot(s,aimHit(s,key));assert.equal(s.phase,'won');assert.equal(s.stats.maxBurst,3);
});
test('removing a support detaches other colors and rescues the bird below it',()=>{
 const s=new FruitSession(level(['..RR.......','..B.......','..o........'],{ammo:[0],goal:{type:'rescue'}}));finishFruitShot(s,aimHit(s,'0,2'));assert.equal(s.phase,'won');assert.equal(s.lastResult.fallen.length,2);assert.equal(s.stats.rescued,1);assert.equal(s.stats.maxBurst,5);
});
test('vine must be hit to unlock; locked colors do not count in a same-color group',()=>{
 const s=new FruitSession(level(['..rr.......'],{ammo:[0]}));finishFruitShot(s,aimHit(s,'0,2'));assert.equal(s.board.get('0,2').kind,'fruit');assert.equal(s.board.get('0,3').kind,'vine');assert.equal(s.stats.removed,0);finishFruitShot(s,aimHit(s,'0,3'));assert.equal(s.phase,'won');
});
test('armored fruit needs two direct hits and becomes matchable only when its shell is gone',()=>{
 const s=new FruitSession(level(['....1......'],{ammo:[0]}));finishFruitShot(s,aimHit(s,'0,4'));assert.equal(s.board.get('0,4').hp,1);assert.equal(s.board.get('0,4').kind,'armor');finishFruitShot(s,aimHit(s,'0,4'));assert.equal(s.phase,'won');assert.equal(s.stats.unlocked,2);
});
test('pollen changes itself and neighboring ordinary fruit to the incoming color',()=>{
 const s=new FruitSession(level(['.R@B.......'],{ammo:[1]}));s.queue=[1,1,1];finishFruitShot(s,aimHit(s,'0,2'));assert.equal(s.phase,'won');assert.equal(s.lastResult.matched,4);assert(s.lastResult.removed.every(c=>c.color===1));
});
test('direct pinecone hit chains through a neighboring pinecone and rescues adjacent birds',()=>{
 const s=new FruitSession(level(['RR**B......','...o......'],{ammo:[1],goal:{type:'rescue'}}));finishFruitShot(s,aimHit(s,'0,2'));assert.equal(s.stats.blasts,2);assert.equal(s.stats.rescued,1);assert.equal(s.phase,'won');
});
test('a normal color match also ignites a pinecone touching the popped group',()=>{
 const s=new FruitSession(level(['..RR*......'],{ammo:[0]}));finishFruitShot(s,aimHit(s,'0,2'));assert.equal(s.stats.blasts,1);assert.equal(s.phase,'won');
});
test('color objective can finish while unrelated fruit remains attached',()=>{
 const s=new FruitSession(level(['RR.....BB..'],{ammo:[0],goal:{type:'color',color:0}}));finishFruitShot(s,aimHit(s,'0,0'));assert.equal(s.phase,'won');assert.equal(s.board.size,2);assert([...s.board.values()].every(c=>c.color===2));
});
test('ammo retires absent colors after a shot while swap cannot cycle through the whole queue',()=>{
 const s=new FruitSession(level(['RR.....BB..'],{ammo:[0,2,0]}));assert(s.swap());assert.equal(s.current,2);assert(s.swap());assert.equal(s.current,0);finishFruitShot(s,aimHit(s,'0,0'));assert(s.queue.every(c=>c===2));
});
test('flight blocks extra fire, swap and launch-position changes without consuming extra ammo',()=>{
 const s=new FruitSession(FRUIT_LEVELS[10]);assert(s.fire(0));const n=s.shots;assert(!s.fire(10));assert(!s.swap());assert(!s.switchLauncher());assert.equal(s.shots,n);
});
test('pause freezes both projectile and moving field; resuming continues the same flight',()=>{
 const s=new FruitSession(FRUIT_LEVELS[13]);s.fire(25);s.advance(.1);s.paused=true;const state=JSON.stringify([s.time,s.flight,s.board,s.queue]);for(let i=0;i<10;i++)s.advance(.1);assert.equal(JSON.stringify([s.time,s.flight,s.board,s.queue]),state);assert(!s.fire(0));s.paused=false;settle(s);assert(s.lastResult);
});
test('different display frame sizes produce the same shot resolution and final model time',()=>{
 const results=[];for(const dt of [1/120,1/30,.1]){const s=new FruitSession(FRUIT_LEVELS[13]);s.fire(-24);for(let i=0;i<500&&s.phase==='flying';i++)s.advance(dt);results.push({board:[...s.board],stats:s.stats,time:s.time});}assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});
test('last available shot can win; exhaustion on an incomplete goal loses and locks the model',()=>{
 const a=new FruitSession(level(['..RR.......'],{ammo:[0],shots:1}));finishFruitShot(a,aimHit(a,'0,2'));assert.equal(a.phase,'won');
 const b=new FruitSession(level(['RR.....BB..'],{ammo:[0],shots:1}));finishFruitShot(b,aimHit(b,'0,0'));assert.equal(b.phase,'lost');assert(!b.fire(0));const time=b.time;b.advance(.1);assert.equal(b.time,time);
});
test('turn-based descent reaches the warning line including the full moving-field envelope',()=>{
 const s=new FruitSession(level(['RR.....BB..'],{ammo:[3],descendEvery:1,descendBy:374,motion:11}));s.queue=[3,3,3];finishFruitShot(s,0);assert.equal(s.phase,'lost');assert.equal(s.descent,374);assert.equal(s.events.at(-1).type,'lost');
});
test('tree-spirit level advances three rescue waves with one shared ammunition budget',()=>{
 const s=play(new FruitSession(FRUIT_LEVELS[14]),FRUIT_ROUTES[14]);assert.equal(s.wave,2);assert.equal(s.phase,'won');assert.equal(s.events.filter(e=>e.type==='wave').length,2);assert.equal(s.shots,FRUIT_ROUTES[14].length);assert(s.stats.rescued>=6);
});
test('invalid shots and time deltas do not mutate state; authored rows reject bad cells and floating fruit',()=>{
 const s=new FruitSession(FRUIT_LEVELS[0]);for(const a of [NaN,Infinity,-Infinity])assert(!s.fire(a));for(const dt of [NaN,Infinity,-1,0])s.advance(dt);assert.equal(s.time,0);assert.equal(s.shots,0);
 assert.throws(()=>readFruitRows(['Z']));assert.throws(()=>readFruitRows(['RRRRRRRRRRRR']));assert.throws(()=>validateFruitLevel(level(['R..........','....R.....'])));
});
test('daily seed uses the local calendar and is stable without fetching data or storing scores',()=>{
 const d=new Date(2026,8,9,23,59);assert.equal(localFruitDate(d),'2026-09-09');assert.deepEqual(dailyFruitLevel('2026-09-09'),dailyFruitLevel('2026-09-09'));assert.notEqual(dailyFruitLevel('2026-09-09').daily.seed,dailyFruitLevel('2026-09-10').daily.seed);assert.throws(()=>dailyFruitLevel('today'));
});
test('new game is retained among the 23 integrated games and uses no formal progress or network writes',()=>{
 assert.equal(MINI_GAME_CATALOG.length,23);assert.equal(new Set(MINI_GAME_CATALOG.map(g=>g.id)).size,23);assert(MINI_GAME_CATALOG.some(g=>g.id==='forest_fruit'));assert.equal(getMiniGamesByCategory('rhythm').length,10);
 const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');assert.match(main,/import ForestFruitGame/);assert.match(main,/\n        ForestFruitGame,/);
 for(const file of ['scenes/ForestFruitGame.js','data/FruitRules.js','data/FruitLevels.js']){const source=fs.readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');assert(!/localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|XMLHttpRequest/.test(source),file);}
});
