import test from 'node:test';
import assert from 'node:assert/strict';
import {StarflightSession,buildStarRoute,buildStarTimeline,starRegionStart} from './src/data/StarflightRules.js';
import {CARNIVAL_PLANS,carnivalPlan,carnivalHit} from './src/data/StarflightCarnival.js';
import {STAR_CRAFTS} from './src/data/StarflightCrafts.js';
const seedWithSky=start=>{for(let seed=start;seed<start+10000;seed++)if(buildStarRoute(seed).some(m=>m.type==='sky'))return seed;throw new Error('no candy-cloud seed');};

test('three selectable carnival plans create distinct complete encounters',()=>{
 const signatures=[];
 for(let plan=0;plan<3;plan++){
  const s=new StarflightSession({seed:seedWithSky(700+plan*100),skyScenario:plan});
  const candy=s.route.find(m=>m.type==='sky');assert.ok(candy);assert.equal(carnivalPlan(candy,s.seed),plan);
  const events=buildStarTimeline(s.route,s.seed).filter(e=>e.index===candy.index&&e.type==='carnival');
  assert.equal(events.length,6);assert.ok(events.some(e=>e.beat==='elite'));assert.ok(events.some(e=>e.beat==='wind'));
  assert.ok(events.every(e=>e.at>=starRegionStart(candy.index)&&e.at<starRegionStart(candy.index)+48));
  signatures.push(events.map(e=>e.beat).join(','));
 }
 assert.equal(new Set(signatures).size,CARNIVAL_PLANS.length);
});

test('every plan can run its candy-cloud region at any route position',()=>{
 for(let plan=0;plan<3;plan++){
  const s=new StarflightSession({seed:seedWithSky(900+plan*100),skyScenario:plan,craftId:'ancient'});
  const candy=s.route.find(m=>m.type==='sky');s.time=starRegionStart(candy.index);s.segment=candy.index;s.travelPhase='region';s.timeline=buildStarTimeline(s.route,s.seed);s.eventIndex=s.timeline.findIndex(e=>e.at>=s.time);
  for(let i=0;i<48*30;i++){s.player.invuln=2;s.advance(1/30,{x:0,y:Math.sin(i/90)*.15});}
  assert.ok(Number.isFinite(s.player.x)&&Number.isFinite(s.player.y));
  assert.ok((s.stats.carnivalWaves||0)>=6);assert.ok(s.id>0);
  assert.ok(s.enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)));
  assert.ok(s.hazards.length<20);
 }
});

test('macaron dive has a telegraph before movement and candy hazards are bounded',()=>{
 const s=new StarflightSession({seed:44,skyScenario:0});
 const e=s.spawn(13,1030,125,'candyDash');
 s.advance(.1,{});assert.equal(e.state,'aim');const x=e.x,y=e.y;
 for(let i=0;i<10;i++)s.advance(.1,{});
 assert.equal(e.state,'aim');assert.equal(e.x,x);assert.equal(e.y,y);
 for(let i=0;i<8;i++)s.advance(.1,{});
 assert.ok(['dash','recover'].includes(e.state));
 assert.ok(s.hazards.filter(h=>h.kind==='candyJam').length<=3);
});

test('all four carnival enemy identities spawn and use body-only radii',()=>{
 const s=new StarflightSession({seed:3,skyScenario:2});
 for(const kind of [12,13,14,15]){
  const e=s.spawn(kind,900,200);assert.ok(e.name);assert.ok(e.r>=18&&e.r<=26);
 }
 assert.deepEqual(s.enemies.map(e=>e.name),['棉花雲綿羊','發條馬卡龍雀','泡泡糖氣球刺蝟','跳跳糖小丑魚']);
});

test('sheep redirects nearby hostile sweets and hedgehog pops only one syrup pool',()=>{
 const s=new StarflightSession({seed:12,skyScenario:1});s.player.invuln=0;
 const sheep=s.spawn(12,700,200),near={id:++s.id,x:710,y:205,vx:-100,vy:0,r:4,life:4,grazed:false};s.bullets.push(near);
 carnivalHit(s,sheep);assert.equal(near.bounced,true);assert.ok(near.vx>0);assert.ok(sheep.bounceFlash>0);
 const hedgehog=s.spawn(14,800,250);carnivalHit(s,hedgehog);carnivalHit(s,hedgehog);
 assert.equal(s.hazards.filter(h=>h.kind==='candySyrup').length,1);
 s.defeat(hedgehog);assert.equal(s.hazards.filter(h=>h.kind==='candySyrup').length,1);
});

test('five crafts and three plans complete a finite 48 second simulation matrix',()=>{
 for(const craft of STAR_CRAFTS)for(let plan=0;plan<3;plan++){
  const s=new StarflightSession({seed:seedWithSky(1200+plan*100),skyScenario:plan,craftId:craft.id});
  const candy=s.route.find(m=>m.type==='sky');s.time=starRegionStart(candy.index);s.segment=candy.index;s.travelPhase='region';s.timeline=buildStarTimeline(s.route,s.seed);s.eventIndex=s.timeline.findIndex(e=>e.at>=s.time);
  for(let i=0;i<48*30;i++)s.advance(1/30,{x:Math.sin(i/80)*.12,y:Math.sin(i/47)*.65,trait:i%180===0,dash:i%240===0});
  assert.ok(['playing','lost'].includes(s.status));assert.ok(Number.isFinite(s.score));
  assert.ok(s.enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)));
 }
});

test('region clear awards once and recovery heart restores one life',()=>{
 const s=new StarflightSession({seed:seedWithSky(81),skyScenario:0,craftId:'owl'}),candy=s.route.find(m=>m.type==='sky');s.player.hp=2;s.timelineEvent({type:'region',index:candy.index});
 s.timelineEvent({type:'carnivalClear',index:candy.index});assert.equal(s.stats.regionsCleared,1);assert.equal(s.score,900);
 const heart=s.pickups.find(x=>x.kind==='heart');heart.x=s.player.x;heart.y=s.player.y;s.player.invuln=0;s.advance(.1,{});
 assert.equal(s.player.hp,3);
});
