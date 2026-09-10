import test from 'node:test';
import assert from 'node:assert/strict';
import {NightWatchSession,WatchTouch,WATCH_WORLD,WATCH_CONTROLS,WATCH_BUILDS,segmentHit} from '../src/data/NightWatchRules.js';
import {playWatch} from './fixtures/watch_pilot.mjs';
const tick=(s,n,input={})=>{for(let i=0;i<n;i++)s.advance(1/60,input);};
test('left joystick owns one pointer while another holds attack and a third uses a skill',()=>{
 const t=new WatchTouch();t.down({id:1,x:154,y:613});t.move({id:1,x:210,y:568});t.down({id:2,...WATCH_CONTROLS.attack});t.down({id:3,...WATCH_CONTROLS.skill});
 const a=t.read();assert(a.x>0&&a.y<0&&a.fire&&a.skill);assert(Math.hypot(a.x,a.y)<=1);
 t.down({id:4,x:100,y:550});assert.equal(t.owner,1);t.up({id:3});assert(t.read().fire);t.up({id:2});assert(!t.read().fire);assert(t.read().x>0);t.up({id:1});assert.equal(t.read().x,0);t.reset();assert(!t.read().skill);
});
test('pointer release outside and clearing input stop movement and firing; tiny drags have a dead zone',()=>{
 const t=new WatchTouch();t.down({id:5,x:154,y:613});t.move({id:5,x:159,y:613});assert.equal(t.read().x,0);t.move({id:5,x:600,y:100});assert(Math.hypot(t.read().x,t.read().y)<=1);
 t.down({id:6,...WATCH_CONTROLS.attack});t.up({id:5,x:-99,y:-99});assert.equal(t.read().x,0);t.reset();assert(!t.read().fire);
});
test('right controls are fully within the landscape canvas and separate from each other',()=>{
 for(const key of ['attack','dash','skill']){const a=WATCH_CONTROLS[key];assert(a.x-a.r>350&&a.x+a.r<1280&&a.y-a.r>84&&a.y+a.r<720);}
 const cs=['attack','dash','skill'].map(k=>WATCH_CONTROLS[k]);for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++)assert(Math.hypot(cs[i].x-cs[j].x,cs[i].y-cs[j].y)>cs[i].r+cs[j].r);
});
test('analog movement preserves speed; diagonal input cannot move faster; dash cannot tunnel through rocks',()=>{
 const a=new NightWatchSession(),b=new NightWatchSession();tick(a,20,{x:1});tick(b,20,{x:1,y:1});assert(Math.abs(Math.hypot(a.player.x-1024,a.player.y-700)-Math.hypot(b.player.x-1024,b.player.y-700))<.01);
 const r=WATCH_WORLD.rocks[0];a.player.x=r.x-r.r-28;a.player.y=r.y;a.advance(.1,{x:1,dash:true});assert(a.player.x<=r.x-r.r-a.player.r+.01);
});
test('paused and pending-choice states freeze all combat and cooldowns',()=>{
 const s=new NightWatchSession();s.player.dashCD=2;s.setPaused(true);const before=JSON.stringify(s);tick(s,50,{fire:true,dash:true});assert.equal(JSON.stringify(s),before);
 s.setPaused(false);s.pendingChoice=true;const t=s.time;tick(s,50,{fire:true});assert.equal(s.time,t);
});
test('fixed step replay agrees at 30 and 60 FPS and clamps a long inactive frame',()=>{
 const a=new NightWatchSession(),b=new NightWatchSession();for(let i=0;i<60;i++)a.advance(1/60,{x:.5,fire:true});for(let i=0;i<30;i++)b.advance(1/30,{x:.5,fire:true});assert.deepEqual(a,b);
 const before=a.time;a.advance(8);assert(a.time-before<=.101);
});
test('supplies are one-time, nearby interactions; night requires a supply and proximity to the tree',()=>{
 const s=new NightWatchSession();assert(!s.startNight());const c=s.caches[0];s.player.x=c.x;s.player.y=c.y;assert.equal(s.interact().type,'cache');assert.equal(s.wood,60);s.interact();assert.equal(s.wood,60);assert(!s.startNight());
 Object.assign(s.player,{x:s.tree.x,y:s.tree.y+120});assert(s.startNight());assert(!s.choose('missing'));assert(s.choose('scatter'));assert.equal(s.wave,1);assert(s.enemies.every(e=>!e.scout));assert(!s.choose('scatter'));
});
test('builds charge exact resources and do not charge on insufficient wood or distance',()=>{
 const s=new NightWatchSession(),p=s.slots[0];assert(!s.build(0,'acorn'));Object.assign(s.player,{x:p.x,y:p.y});assert(s.build(0,'acorn'));assert.equal(s.wood,5);assert(!s.build(0,'frost'));assert.equal(s.wood,5);assert.equal(s.slots[0].kind,'acorn');
 s.wood=20;p.hp=20;assert(s.repair(0));assert.equal(s.wood,5);assert.equal(p.hp,85);assert(!s.repair(0));
});
test('damaged structures can be destroyed, rebuilt and repaired without resurrecting a lost game',()=>{
 const s=new NightWatchSession();s.wood=100;const p=s.slots[0];Object.assign(s.player,{x:p.x,y:p.y});s.build(0,'frost');s.hurt(p,200);tick(s,1);assert.equal(p.kind,null);assert(s.build(0,'bloom'));s.status='lost';assert(!s.build(0,'acorn'));assert(!s.repair(0));
});
test('wolf and boar telegraph before charging; bear slam has an exposed recovery',()=>{
 for(const kind of ['wolf','boar','bear']){const s=new NightWatchSession();s.enemies=[];s.spawn(kind,s.player.x+110,s.player.y);const e=s.enemies[0];e.cooldown=0;tick(s,1);assert.equal(e.state,'warn');const hp=s.player.hp;tick(s,10);assert.equal(s.player.hp,hp);tick(s,70);
  assert(s.player.hp<hp);if(kind==='bear'){assert(e.vulnerable>0);const old=e.hp;s.damage(e,10);assert.equal(old-e.hp,13);}
 }
});
test('dashing grants temporary invulnerability with a cooldown; no permanent immunity',()=>{
 const s=new NightWatchSession();s.dash({x:1,y:0});s.hurt(s.player,30);assert.equal(s.player.hp,110);assert(!s.dash({x:1,y:0}));tick(s,50);s.hurt(s.player,30);assert.equal(s.player.hp,80);
});
test('purification affects multiple nearby animals, slows them, heals player and observes cooldown',()=>{
 const s=new NightWatchSession();s.enemies=[];s.player.hp=40;s.spawn('boar',s.player.x+100,s.player.y);s.spawn('boar',s.player.x-100,s.player.y);s.upgrades.renewal=1;assert(s.skill());assert.equal(s.player.hp,62);assert.equal(s.enemies[0].hp,73);assert.equal(s.enemies[1].slow,2);assert(!s.skill());assert.equal(s.stats.skills,1);
});
test('projectiles use swept collisions and respect rocks; piercing hits each animal once',()=>{
 assert(segmentHit(0,0,200,0,100,0,10));assert(!segmentHit(0,0,200,0,100,30,10));
 const s=new NightWatchSession();s.enemies=[];s.upgrades.pierce=1;s.spawn('boar',s.player.x+110,s.player.y);s.spawn('boar',s.player.x+190,s.player.y);s.shoot();tick(s,22);assert(s.enemies.every(e=>e.hp===95));
 const r=WATCH_WORLD.rocks[0],q=new NightWatchSession();q.enemies=[];Object.assign(q.player,{x:r.x-r.r-70,y:r.y});q.spawn('boar',r.x+r.r+70,r.y);assert.equal(q.aimTarget(q.player),undefined);
});
test('bear enters second phase once; population and effect queues stay bounded',()=>{
 const s=new NightWatchSession();s.enemies=[];s.spawn('bear',1000,350);const boss=s.enemies[0];boss.hp=400;tick(s,1);assert.equal(s.enemies.length,3);tick(s,30);assert.equal(s.enemies.length,3);
 for(let i=0;i<100;i++)s.spawn('wolf',200,200);assert.equal(s.enemies.length,45);for(let i=0;i<200;i++)s.emit('shot');assert(s.events.length<=120);
});
for(const [seed,upgrade]of [[17,'pierce'],[21,'scatter'],[32,'renewal']])test(`ordinary movement/build/combat route clears the single chapter: ${upgrade}`,()=>{
 const {s}=playWatch(seed,upgrade);assert.equal(s.status,'won');assert.equal(s.wave,3);assert.equal(s.stats.caches,3);assert(s.stats.cleansed>=30);assert(s.slots.some(p=>p.kind));assert(s.stars()>=2);assert(s.time<300);
});
test('neglecting defense can lose; terminal outcome stops the simulation',()=>{
 const s=new NightWatchSession();s.enemies=[];s.spawn('bear',s.tree.x,s.tree.y+120);s.player.x=200;s.player.y=200;tick(s,3000);assert.equal(s.status,'lost');assert.equal(s.tree.hp,0);const before=s.time;tick(s,30,{fire:true});assert.equal(s.time,before);
});
