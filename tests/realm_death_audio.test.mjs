import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DandelionHillsWorld} from '../src/realm/DandelionHillsWorld.js';
import {DandelionHillsJourney} from '../src/realm/DandelionHillsRules.js';
import {FootstepClock,playRealmSound} from '../src/realm/RealmSoundEffects.js';
for(const type of ['mouse','chick','rabbit'])test(type+' death expiry does not submit negative Canvas radius',()=>{
 let depth=0,arcs=0,draws=0;
 const ctx=new Proxy({drawImage(){draws++},save(){depth++},restore(){depth--},arc(x,y,r){assert.ok(r>=0&&Number.isFinite(r));arcs++}},{get(o,k){return k in o?o[k]:()=>{}}});
 const w=new DandelionHillsWorld({getContext:()=>ctx});
 const rig={atlas:{width:2560,height:640},frames:16,columns:8,frameSize:320,foot:.8};
 w.creatureFrames={mouseIdle:rig,mouseRun:rig,chickFlight:rig};w.images[type]={width:320,height:320};w.images.bossFrames={width:1280,height:960};
 w.consumeEffect({kind:'poof',type,target:'test',x:100,y:100});
 for(let i=0;i<120;i++)w.drawEffects(ctx,1/60,{});
 assert.ok(type==='rabbit'?draws>0:arcs>0);assert.equal(depth,0);assert.equal(w.effects.length,0);
});
test('footsteps follow distance and ignore walls, pause and teleport',()=>{
 const c=new FootstepClock();c.update({x:0,y:0},false);
 assert.equal(c.update({x:40,y:0},true),false);assert.equal(c.update({x:75,y:0},true),true);
 assert.equal(c.update({x:75,y:0},true),false);assert.equal(c.update({x:75,y:0},false),false);assert.equal(c.update({x:900,y:0},true),false);
});
test('one swing sound after windup',()=>{
 const j=new DandelionHillsJourney();j.attack();assert.equal(j.effects.filter(e=>e.kind==='sound').length,0);
 for(let i=0;i<60;i++)j.update(1/60,{x:0,y:0},false);
 assert.equal(j.effects.filter(e=>e.kind==='sound'&&e.name==='manaSwing').length,1);
});
test('audio mute and source cleanup',()=>{
 let started=0;const ended=[];const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 const node=()=>({frequency:param,gain:param,connect(){},disconnect(){},start(){started++},stop(){ended.push(this)}});
 const ctx={state:'running',currentTime:0,sampleRate:8000,createOscillator:node,createBufferSource:node,createGain:node,createBiquadFilter:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};
 const s={soundOn:true,sound:{context:ctx,volume:1,mute:true},audioNodes:new Set()};
 playRealmSound(s,'mouseHit');assert.equal(started,0);s.sound.mute=false;
 for(const cue of ['mouseHit','manaSwing','stepGrass','stepStone','creatureHit','moleHit','dewHit','mudDig','mudThrow','dewGather','bubbleCast','chickChirp','playerDown','bossWarn','bossSlam','bossSeeds'])assert.equal(playRealmSound(s,cue),true);
 assert.ok(started>0);for(const n of ended)n.onended();assert.equal(s.audioNodes.size,0);assert.equal(playRealmSound(s,'correct'),false);
});
