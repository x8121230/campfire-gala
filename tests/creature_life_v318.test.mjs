import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lifeFrame,updateSmallCreature,MOUSE_VISUAL_SCALE} from '../src/realm/CreatureLifeV318.js';
import {DandelionHillsJourney,hillsWalkable,HILLS_RESPAWN_SECONDS} from '../src/realm/DandelionHillsRules.js';
import {HillsDetailTiles,DETAIL_TILES} from '../src/realm/HillsDetailTilesV318.js';
import {DandelionHillsWorld} from '../src/realm/DandelionHillsWorld.js';
for(const type of ['mole','dew']) {
 test(type+' roams on valid ground, stops and cycles real frames',()=>{
 const j=new DandelionHillsJourney();j.random=()=>.37;j.mobs=j.mobs.filter(m=>m.type===type);const m=j.mobs[0];assert.ok(m);
 const start={x:m.x,y:m.y};let moved=false,idle=false;const frames=new Set();
 for(let i=0;i<2400;i++){j.updateMobs(1/60);moved ||= Math.hypot(m.x-start.x,m.y-start.y)>8;idle ||= m.moveSpeed===0;frames.add(JSON.stringify(lifeFrame(m)));assert.ok(hillsWalkable(m.x,m.y));assert.equal(m.aggro,false);assert.equal(m.cast,null);}
 assert.ok(moved);assert.ok(idle);assert.ok(frames.size>=8);
 });
 test(type+' approaches before casting and stops during cast',()=>{
 const m={id:1,type,x:0,y:0,homeX:0,homeY:0,alive:true,aggro:true,attack:0,walkDistance:0};
 const j={player:{x:300,y:0},effect(){},random:()=>.4,moveBody(m,x,y){m.x+=x;m.y+=y;}};
 for(let i=0;i<200&&!m.cast;i++)updateSmallCreature(j,m,1/60,()=>true);
 assert.ok(m.x>0);assert.ok(m.cast);assert.ok(m.attack>2);
 });
 test(type+' death completes safely and respawns once after existing CD',()=>{
 const j=new DandelionHillsJourney();const m=j.mobs.find(m=>m.type===type);j.mobs=[m];j.defeat(m);const drops=j.loot.length;j.defeat(m);assert.equal(j.loot.length,drops);
 for(let i=0;i<90;i++)j.updateMobs(1/60);assert.equal(m.alive,false);assert.deepEqual(lifeFrame(m),{row:2,frame:5});
 const ctx=new Proxy({},{get(o,k){if(k==='arc')return(x,y,r)=>assert.ok(r>=0);return()=>{}}});const w=new DandelionHillsWorld({getContext:()=>ctx});w.images[type+'Life']={width:1920,height:960};w.consumeEffect({kind:'poof',type,x:100,y:100,faceLeft:true});for(let i=0;i<120;i++)w.drawEffects(ctx,1/60,{});assert.equal(w.effects.length,0);
 j.updateMobs(HILLS_RESPAWN_SECONDS[type]);assert.equal(m.alive,true);assert.equal(m.deathTime,0);assert.equal(j.mobs.length,1);
 });
}
test('blocked movement keeps idle frame, mouse scale reduced 30%',()=>{
 const m={type:'mole',id:1,alive:true,x:0,y:0,homeX:0,homeY:0,roamTarget:{x:30,y:0}};
 updateSmallCreature({player:{x:1000,y:0},random:()=>.5,moveBody(){}},m,.1,()=>true);assert.equal(lifeFrame(m).row,0);assert.equal(MOUSE_VISUAL_SCALE,.7);
});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('detail map covers exact existing world and load failures never block drawing',async()=>{
 assert.equal(DETAIL_TILES.length,18);assert.equal(DETAIL_TILES.reduce((s,t)=>s+t.width*t.height,0),4728*2664);
 let calls=0;const tiles=new HillsDetailTiles(()=>{calls++;return Promise.reject(Error('offline'));});const ctx={save(){},restore(){},drawImage(){}};
 tiles.draw(ctx,{x:1700,y:900,scale:1},1200,800,.016);assert.equal(calls,2);assert.equal(tiles.pending.size,2);await flush();assert.equal(tiles.pending.size,0);assert.equal(tiles.failed.size,2);
 tiles.dispose();tiles.draw(ctx,{x:1700,y:900,scale:1},1200,800,.016);assert.equal(calls,2);
});
test('late HD loads cannot repopulate disposed scene',async()=>{
 let resolve;const tiles=new HillsDetailTiles(()=>new Promise(r=>resolve=r));tiles.draw({},{x:100,y:100,scale:1},10,10);tiles.dispose();resolve({});await flush();assert.equal(tiles.cache.size,0);
});
