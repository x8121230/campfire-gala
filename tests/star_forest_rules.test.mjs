import test from 'node:test';
import assert from 'node:assert/strict';
import {StarJourney,HOME,SPOTS,APPLES,ANIMALS,BLOCKS,heightAt,terrainHeight,distance} from '../src/realm/StarForestRules.js';
const settle=(j,n=100,attack=false)=>{for(let i=0;i<n;i++)j.update(.05,{x:0,y:0},attack);};
const place=(j,p)=>{j.player={x:p.x,z:p.z,y:terrainHeight(p.x,p.z)};};
const accept=j=>{place(j,SPOTS.owl);j.interact();};
// A real walking route on a 0.5 m grid; no jumping or teleporting during the journey.
function route(from,to){
 const step=.5,start=[Math.round(from.x/step),Math.round(from.z/step)],target=[Math.round(to.x/step),Math.round(to.z/step)],key=(x,z)=>`${x},${z}`;
 const queue=[start],seen=new Map([[key(...start),null]]);let found;
 for(let n=0;n<queue.length;n++){
  const [x,z]=queue[n];if(Math.hypot(x-target[0],z-target[1])<2){found=[x,z];break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz),p={x:nx*step,z:nz*step};if(seen.has(k)||heightAt(p.x,p.z)===null||BLOCKS.some(b=>distance(p,b)<b.r+.5))continue;seen.set(k,[x,z]);queue.push([nx,nz]);}
 }
 assert.ok(found,`No walking route to ${JSON.stringify(to)}`);const path=[];while(found){path.push({x:found[0]*step,z:found[1]*step});found=seen.get(key(...found));}return path.reverse();
}
function walk(j,to,attack=true){
 for(const p of route(j.player,to)){let guard=0;while(distance(j.player,p)>.18){assert.ok(guard++<90,'walking got stuck');const dx=p.x-j.player.x,dz=p.z-j.player.z,d=Math.hypot(dx,dz),speed=Math.min(1,d/.255);j.update(.05,{x:(dx-dz)/d/Math.SQRT2*speed,y:(dx+dz)/d/Math.SQRT2*speed},attack);}}
}

test('main quest is completable by walking: owl, eight animals, five apples, owl',()=>{
 const j=new StarJourney();walk(j,SPOTS.owl);assert.match(j.interact().title,/星光/);
 for(const a of ANIMALS){walk(j,a);settle(j,130,true);}
 // Mop up moving animals through their current positions.
 for(const a of j.animals.filter(a=>a.anger>0)){walk(j,a);settle(j,160,true);}
 assert.equal(j.calm.length,8);
 for(const apple of APPLES){walk(j,apple);const nearby=j.nearby();assert.ok(nearby.id.startsWith('apple'));j.interact();}
 assert.equal(j.apples.length,5);walk(j,SPOTS.owl);j.interact();assert.equal(j.finished,true);
 const saved=new StarJourney(j.export());assert.equal(saved.finished,true);assert.equal(saved.animals.filter(a=>a.anger>0).length,0);
});
test('bubble needs quest, range and cooldown, tracks target, awards once',()=>{
 const j=new StarJourney();assert.equal(j.cast('bubble'),false);accept(j);place(j,{x:-15,z:1});assert.equal(j.cast('bubble'),true);assert.equal(j.cast('bubble'),false);settle(j,100,true);assert.ok(j.calm.includes(0));const n=j.calm.length;j.calmAnimal(j.animals[0],3);assert.equal(j.calm.length,n);
});
test('honey respects range, solid landing and three second root',()=>{
 const j=new StarJourney();accept(j);place(j,{x:-15,z:1});const a=j.animals[0];assert.equal(j.cast('honey',{x:a.x,z:a.z}),true);j.update(.05);assert.equal(a.root,3);const p={x:a.x,z:a.z};settle(j,50);assert.equal(distance(a,p),0);settle(j,20);assert.equal(a.root,0);
 j.cooldowns.honey=0;place(j,{x:12,z:10});assert.equal(j.cast('honey',{x:12,z:16}),false);assert.equal(j.cooldowns.honey,0);
});
test('dash cannot cross pond, map boundary or tree trunk',()=>{
 const j=new StarJourney();accept(j);place(j,{x:12,z:11.9});j.facing={x:0,z:1};j.cast('dash');settle(j,12);assert.ok(heightAt(j.player.x,j.player.z)!==null);assert.ok(j.player.z<13);
 place(j,{x:36.5,z:3});j.facing={x:1,z:0};j.cooldowns.dash=0;j.cast('dash');settle(j,12);assert.ok(j.player.x<=37);
 place(j,{x:-23,z:12});j.facing={x:0,z:1};j.cooldowns.dash=0;j.cast('dash');settle(j,12);assert.ok(j.player.z<14.1);
});
test('elephant cleans only front cone and has cooldown',()=>{
 const j=new StarJourney();accept(j);place(j,{x:0,z:0});j.facing={x:1,z:0};Object.assign(j.animals[0],{x:4,z:0});Object.assign(j.animals[1],{x:-4,z:0});j.cast('elephant');assert.equal(j.animals[0].anger,0);assert.equal(j.animals[1].anger,3);assert.equal(j.cast('elephant'),false);
});
test('safe village is not invaded; recovery preserves progress',()=>{
 const j=new StarJourney();accept(j);place(j,{x:-21,z:1});const a=j.animals[0];Object.assign(a,{x:-19,z:1});settle(j,100);assert.ok(a.x>-21);place(j,{x:-21.1,z:1});Object.assign(a,{x:-20.5,z:1,windup:.01});j.update(.05);assert.equal(j.energy,5);j.apples=[0,1];j.calmAnimal(j.animals[1],3);j.recover();assert.equal(j.energy,5);assert.equal(j.player.x,HOME.x);assert.deepEqual(j.apples,[0,1]);assert.ok(j.calm.includes(1));
});
test('duck escort can finish by following the south road after calming animals',()=>{
 const j=new StarJourney({v:1,accepted:true,appleQuest:true,calm:[0,1,2,3,4,5,6,7]});walk(j,SPOTS.ducks);j.interact();assert.equal(j.escort,true);
 for(const p of [{x:4,z:7},{x:9,z:8},{x:14,z:9},SPOTS.nest]){walk(j,p,false);settle(j,70);}
 settle(j,180);assert.equal(j.escortDone,true);assert.equal(new StarJourney(j.export()).escortDone,true);
});
test('acorn event has falling window, completes once and can restart',()=>{
 const j=new StarJourney();accept(j);place(j,SPOTS.event);j.interact();assert.ok(j.event);const nut=j.event.nuts[0];place(j,nut);settle(j,10);assert.equal(j.event.count,0);settle(j,15);assert.equal(j.event.count,1);settle(j,620);assert.equal(j.event,null);assert.ok(j.eventBest>=1);place(j,SPOTS.event);j.interact();assert.ok(j.event);
});
test('untrusted save values are bounded and legacy save never migrates',()=>{
 const j=new StarJourney({v:1,finished:true,calm:[0,0,-1,99,'1'],apples:[0,0,999],eventBest:999});assert.deepEqual(j.calm,[0]);assert.deepEqual(j.apples,[0]);assert.equal(j.finished,false);assert.equal(j.eventBest,12);
 const old=new StarJourney({v:1,stage:4,found:[0,1,2]});assert.equal(old.accepted,false);assert.equal(old.finished,false);
});

test('NPC approach triggers once, requires leaving the wider ring to rearm',()=>{
 const j=new StarJourney();assert.equal(j.autoTalk(),null);place(j,{x:-29,z:3.3});assert.match(j.autoTalk().title,/星光小魔仙/);assert.equal(j.accepted,true);
 for(let i=0;i<30;i++)assert.equal(j.autoTalk(),null);
 place(j,{x:-29,z:3.6});assert.equal(j.autoTalk(),null);place(j,{x:-29,z:3.2});assert.equal(j.autoTalk(),null);
 place(j,{x:-29,z:5.3});assert.equal(j.autoTalk(),null);place(j,{x:-29,z:3.2});assert.match(j.autoTalk().title,/貓頭鷹村長/);
});
test('all four NPC types support proximity dialogue; objective turn-in is automatic',()=>{
 const j=new StarJourney({v:1,accepted:true,appleQuest:true,calm:[0,1,2,3,4,5,6,7],apples:[0,1,2,3,4]});
 place(j,SPOTS.hedgehog);j.energy=2;assert.match(j.autoTalk().title,/刺蝟/);assert.equal(j.energy,5);
 place(j,SPOTS.ducks);assert.match(j.autoTalk().title,/跟著星光/);assert.equal(j.escort,true);assert.equal(j.autoTalk(),null);
 place(j,SPOTS.nest);assert.match(j.autoTalk().title,/鴨媽媽/);place(j,SPOTS.owl);assert.match(j.autoTalk().title,/第一章完成/);assert.equal(j.finished,true);
});
