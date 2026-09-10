import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
globalThis.Phaser={Scene:class{}};
const {default:Celebration}=await import('../src/scenes/ChestRewardCelebration.js');
class Node extends EventEmitter {
 constructor(kind,args){super();this.kind=kind;this.args=args;this.x=args[0];this.y=args[1];this.text=args[2];this.list=[];}
 add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
 setText(text){this.text=text;return this;}
 destroy(){this.destroyed=true;return this;}
 disableInteractive(){this.disabled=true;return this;}
}
for(const method of ['setScale','setAlpha','setAngle','setOrigin','setDisplaySize','setInteractive','setSize','setFontSize','fillStyle','lineStyle','fillCircle','fillTriangle','strokeRoundedRect','fillRoundedRect','lineBetween'])Node.prototype[method]=function(...args){this[method+'Args']=args;return this;};
function fixture(game='bush_minesweeper',missing=false){
 const s=new Celebration(),objects=[],tweens=[],timers=[],calls=[];
 s.init({hostKey:'BushExplore',reward:{status:'chest',game,stars:3,reason:'daily'}});
 s.events=new EventEmitter();s.sound={mute:false,context:null};s.textures={exists:()=>!missing};s.load={spritesheet:(...a)=>calls.push(['load',...a])};
 s.registry={get:()=>5};
 s.add=Object.fromEntries(['container','graphics','rectangle','image','text'].map(kind=>[kind,(...args)=>{const n=new Node(kind,args);objects.push(n);return n;}]));
 s.tweens={add:t=>{tweens.push(t);return t;},killTweensOf:target=>calls.push(['kill',target])};s.time={delayedCall:(ms,fn)=>{timers.push(fn);}};
 let paused=true;s.scene={bringToTop:()=>calls.push(['top']),isPaused:()=>paused,resume:key=>{paused=false;calls.push(['resume',key]);},start:(...args)=>{calls.push(['start',...args]);s.events.emit('shutdown');},stop:()=>{calls.push(['stop']);s.events.emit('shutdown');}};
 s.create();return {s,objects,tweens,timers,calls};
}
test('five rewards display their own large chest frame and a phone-sized collect target',()=>{
 for(const [i,game]of ['bush_minesweeper','shape_color','bush_banqi','memory_match','animal_food'].entries()){
  const {s,objects}=fixture(game);assert.deepEqual(objects.find(n=>n.kind==='image').args,[0,0,'forest_chests',i]);
  assert.deepEqual(s.collectButton.setSizeArgs,[440,88]);assert.deepEqual(s.openButton.setSizeArgs,[440,88]);assert(objects.some(n=>n.text==='寶箱已保存，可立即開啟或先收起來'));
 }
});
test('arrival triggers star burst and floating chest after the bounce',()=>{const {s,tweens,objects}=fixture();const arrival=tweens.find(t=>t.targets===s.chestArt&&t.ease==='Bounce.Out');assert(arrival);arrival.onComplete();assert.equal(objects.filter(n=>['✦','✧'].includes(n.text)).length,18);assert(tweens.some(t=>t.targets===s.chestArt&&t.yoyo));});
test('early collect cancels arrival and resumes the original scene exactly once',()=>{
 const {s,tweens,calls}=fixture();s.collectButton.emit('pointerdown');s.collectButton.emit('pointerdown');assert(s.collectButton.disabled);
 const exits=tweens.filter(t=>t.x===1121);assert.equal(exits.length,1);exits[0].onComplete();s.events.emit('shutdown');
 assert.equal(calls.filter(c=>c[0]==='resume').length,1);assert.equal(calls.filter(c=>c[0]==='stop').length,1);
});
test('stopping the celebration externally resumes a paused host without modifying saved rewards',()=>{const {s,calls}=fixture();const reward=structuredClone(s.reward);s.events.emit('shutdown');assert.deepEqual(s.reward,reward);assert(calls.some(c=>c[0]==='resume'));});
test('missing bitmap still provides a visible fallback and usable collect action',()=>{const {s,objects,tweens,calls}=fixture('bush_minesweeper',true);s.preload();assert(calls.some(c=>c[0]==='load'));assert(!objects.some(n=>n.kind==='image'));assert(s.chestArt.list.some(n=>n.fillRoundedRectArgs));s.collect();tweens.find(t=>t.x===1121).onComplete();assert(calls.some(c=>c[0]==='resume'));});
test('sound mute and an early collect suppress the delayed celebratory sound',()=>{for(const early of [true,false]){const {s,timers}=fixture();let plays=0;s.tone=()=>plays++;if(early)s.collect();else s.sound.mute=true;timers.forEach(fn=>fn());assert.equal(plays,0);}});
test('instant open transfers paused-host ownership once without resuming gameplay',()=>{const {s,calls}=fixture();s.reward.chestId='chest-7';s.openNow();s.openNow();assert.equal(calls.filter(c=>c[0]==='start').length,1);assert.equal(calls.find(c=>c[0]==='start')[2].chestId,'chest-7');assert(!calls.some(c=>c[0]==='resume'));});
test('no hearts leaves the chest available to collect',()=>{const {s,calls}=fixture();s.registry.get=()=>0;s.openNow();assert.equal(s.openButton.label.text,'愛心不足，先收好');assert(!calls.some(c=>c[0]==='start'));s.collect();assert(s.closing);});
test('collect followed by instant-open click never starts a second flow',()=>{const {s,calls}=fixture();s.collect();s.openNow();assert(!calls.some(c=>c[0]==='start'));});
