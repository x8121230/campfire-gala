import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DandelionHillsJourney} from '../src/realm/DandelionHillsRules.js';
import {forestCreaturePose} from '../src/realm/ForestCreatureMotion.js';
import {STARSPROUT_QUICK_ITEMS} from '../src/realm/StarsproutInventory.js';
test('three hearts, three mana, three shared shortcuts',()=>{
 const j=new DandelionHillsJourney();assert.equal(j.hp,3);assert.equal(j.maxHp,3);assert.equal(j.mana,3);assert.equal(j.maxMana,3);assert.equal(STARSPROUT_QUICK_ITEMS.length,3);
});
for(const type of ['mole','dew']) test(type+' telegraphs, shoots once, and cancels on death',()=>{
 const j=new DandelionHillsJourney(),m=j.mobs.find(m=>m.type===type);
 j.player={x:m.x+150,y:m.y};m.aggro=true;m.attack=0;j.updateMobs(.01);
 assert.ok(m.cast);assert.equal(j.projectiles.length,0);
 const original={x:m.x,y:m.y};const a=forestCreaturePose(m,0);m.cast.elapsed=m.cast.duration*.5;
 const b=forestCreaturePose(m,.2);assert.notEqual(a.squash,b.squash);assert.deepEqual({x:m.x,y:m.y},original);
 j.updateMobs(.4);assert.equal(j.projectiles.length,1);assert.equal(m.cast,null);
 j.updateMobs(.01);assert.equal(j.projectiles.length,1);
 m.cast={elapsed:0,duration:.7};j.defeat(m);j.updateMobs(1);assert.equal(j.projectiles.length,1);
});
test('mud has finite 280px range, expired shots cannot damage player',()=>{
 const j=new DandelionHillsJourney(),m=j.mobs.find(m=>m.type==='mole');
 j.player={x:m.x+150,y:m.y};j.enemyShot(m,'mud',175,1);
 const shot=j.projectiles[0];assert.equal(shot.life*shot.speed,280);
 shot.x=j.player.x;shot.y=j.player.y;shot.life=.001;const hp=j.hp;
 j.updateProjectiles(.02);assert.equal(j.hp,hp);assert.equal(j.projectiles.length,0);assert.ok(j.effects.some(e=>e.kind==='projectileEnd'));
});
test('bird remains yellow until provoked, then retaliates with one seed shot',()=>{
 const j=new DandelionHillsJourney(),b=j.mobs.find(m=>m.type==='chick');
 assert.equal(b.aggro,false);j.player={x:b.x+100,y:b.y};j.hitMob(b,1);assert.equal(b.aggro,true);
 b.attack=0;j.updateMobs(.01);assert.ok(b.cast);assert.equal(j.projectiles.length,0);
 j.updateMobs(.46);assert.equal(j.projectiles[0].kind,'seed');
});
test('player falls in place, shows one revive prompt, and waits for explicit revive',()=>{
 const j=new DandelionHillsJourney();j.player={x:1700,y:990};const position={...j.player};
 j.hurt(99);assert.equal(j.hp,0);assert.equal(j.downed,true);assert.deepEqual(j.player,position);
 assert.equal(j.revive(),false);assert.equal(j.attack(),false);assert.equal(j.move(.05,{x:1,y:0}),false);
 for(let i=0;i<90;i++)j.update(1/60,{x:1,y:0},true,true);
 assert.deepEqual(j.player,position);assert.equal(j.effects.filter(e=>e.kind==='playerDownReady').length,1);
 assert.equal(j.revive(),true);assert.equal(j.hp,3);assert.equal(j.downed,false);assert.notDeepEqual(j.player,position);
});
