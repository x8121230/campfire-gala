import test from 'node:test';
import assert from 'node:assert/strict';
import {StarflightSession,STAR_FIELD,STAR_REGION_SECONDS,STAR_ROUTE_LENGTH,STAR_TRANSIT_SECONDS,STAR_REGION_BOSSES,buildStarRoute,buildStarTimeline,resolveStarPhase,starRegionStart} from './src/data/StarflightRules.js';

test('first region is random and every three-region route has unique region types',()=>{
 const firstTypes=new Set();
 for(let seed=1;seed<=300;seed++){
  const route=buildStarRoute(seed),types=route.map(m=>m.type);firstTypes.add(types[0]);
  assert.equal(route.length,STAR_ROUTE_LENGTH);assert.equal(new Set(types).size,STAR_ROUTE_LENGTH);
 }
 assert.ok(firstTypes.size>=6);assert.ok(firstTypes.has('sky'));assert.ok(firstTypes.has('cave'));
});

test('continuous schedule is region, turbulence, region, turbulence, region, boss',()=>{
 assert.equal(STAR_REGION_SECONDS,48);assert.equal(STAR_TRANSIT_SECONDS,10);assert.equal(STAR_FIELD.bossAt,164);
 assert.deepEqual([0,1,2].map(starRegionStart),[0,58,116]);
 assert.equal(resolveStarPhase(47.99).kind,'region');assert.equal(resolveStarPhase(48).kind,'transit');
 assert.equal(resolveStarPhase(57.99).kind,'transit');assert.deepEqual(resolveStarPhase(58),{kind:'region',index:1,elapsed:0,start:58,end:106});
 assert.equal(resolveStarPhase(106).kind,'transit');assert.equal(resolveStarPhase(116).index,2);assert.equal(resolveStarPhase(164).kind,'boss');
});

test('timeline follows the new starts and does not show a route-selection branch',()=>{
 const route=buildStarRoute(90210),events=buildStarTimeline(route,90210),regions=events.filter(e=>e.type==='region');
 assert.deepEqual(regions.map(e=>e.at),[.05,58.05,116.05]);assert.equal(events.some(e=>e.type==='branch'),false);
 assert.equal(events.find(e=>e.type==='boss').at,164);assert.equal(events.find(e=>e.type==='warning').at,161);
});

test('turbulence preserves combat state and third region selects its own boss',()=>{
 const s=new StarflightSession({seed:5150,craftId:'owl'});s.player.hp=s.player.maxHp;s.ultimateEnergy=63;s.score=1234;s.weaponRanks.clover=2;s.time=47.99;s.eventIndex=s.timeline.length;
 s.advance(.05,{});
 assert.equal(s.inTransit,true);assert.equal(s.paused,false);assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.score,1234);assert.equal(s.weaponRanks.clover,2);
 s.time=57.99;s.advance(.05,{});
 assert.equal(s.inTransit,false);assert.equal(s.segment,1);assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.score,1234);assert.equal(s.weaponRanks.clover,2);
 s.time=STAR_FIELD.bossAt-.02;s.timeline=buildStarTimeline(s.route,s.seed);s.eventIndex=s.timeline.findIndex(e=>e.at>=s.time);s.advance(.05,{});
 assert.ok(s.boss);assert.equal(s.boss.regionType,s.route[2].type);assert.equal(s.boss.name,STAR_REGION_BOSSES[s.route[2].type].name);
});
