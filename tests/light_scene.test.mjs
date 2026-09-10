// Phaser API simulation for scene lifecycle; not browser rendering or real touch QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createLightSolver } from '../src/data/LightWorkshopRules.js';
class Display extends EventEmitter {
    constructor(x=0,y=0,text=''){super();Object.assign(this,{x,y,text,list:[],visible:true,alpha:1,width:512,height:512});}
    add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
    setText(text){this.text=text;return this;} setAlpha(alpha){this.alpha=alpha;return this;}
    setDisplaySize(width,height){this.width=width;this.height=height;return this;}
    setInteractive(){this.interactive=true;return this;}
    destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const method of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween'])Display.prototype[method]=function(){return this;};
globalThis.Phaser={Scene:class{}};
const docEvents=new EventEmitter();globalThis.document={hidden:false,addEventListener:(k,f)=>docEvents.on(k,f),removeEventListener:(k,f)=>docEvents.off(k,f)};
const {default:Scene}=await import('../src/scenes/LightWorkshopGame.js');
function scene(){
    const s=new Scene(),objects=[];s.init({returnScene:'MiniGameHub'});s.textures={exists:()=>true};s.events=new EventEmitter();s.game={events:new EventEmitter()};
    s.input={keyboard:new EventEmitter()};s.captures=new Set();s.input.keyboard.addCapture=keys=>keys.forEach(k=>s.captures.add(k));s.input.keyboard.removeCapture=keys=>keys.forEach(k=>s.captures.delete(k));
    s.sound={stopAll(){},context:null};s.add=Object.fromEntries(['image','rectangle','circle','graphics','container','text'].map(m=>[m,(x,y,t)=>{const o=new Display(x,y,t);objects.push(o);return o;}]));
    s.children={removeAll(){objects.forEach(o=>o.destroy());objects.length=0;}};
    s.tweens={paused:false,killAll(){},pauseAll(){this.paused=true;},resumeAll(){this.paused=false;}};
    s.scene={manager:{keys:{MiniGameHub:{}}},start:name=>{s.destination=name;}};s.create();return s;
}
const tick=(s,n=1)=>{for(let i=0;i<n;i++)s.update(0,50);};
const click=(s,label)=>{const b=s.overlay.list.find(o=>o.label?.text===label);assert(b,label);b.emit('pointerdown');};
function solveScene(s){const j=createLightSolver(s.session.level,s.session.state);while(j.status==='searching')j.tick(100);assert.equal(j.status,'solved');j.best.forEach((v,i)=>{while(s.session.state[i]!==v)s.turn(i);});}

test('all 20 game scenes finish through scene controls and explicit submit',()=>{
    const s=scene();assert.equal(s.mode,'intro');click(s,'選一個光路任務');assert.equal(s.mode,'select');
    for(let i=0;i<20;i++){s.startLevel(i);assert.equal(s.mode,'playing');solveScene(s);assert(s.trace.solved);assert.equal(s.mode,'playing');s.submitLight();assert.equal(s.mode,'finished');assert.equal(s.records[i].stars,3);}
    s.showSelection();assert.equal(Object.keys(s.records).length,20);s.events.emit('shutdown');
});
test('failed submit preserves configuration; repeated controls cycle; undo cancels current search',()=>{
    const s=scene();s.startLevel(19);const before=[...s.session.state];s.submitLight();assert.deepEqual(s.session.state,before);assert.equal(s.mode,'playing');
    s.turn(0);s.turn(0);assert.deepEqual(s.session.state,before);assert.equal(s.session.moves,2);
    s.requestHint();s.requestHint();s.requestHint();assert(s.hintJob);s.undoTurn();assert.equal(s.hintJob,null);assert.equal(s.session.moves,1);assert.equal(s.session.hintsUsed,3);s.events.emit('shutdown');
});
test('keyboard tab selects without moving state; space and number shortcuts adjust controls',()=>{
    const s=scene();s.startLevel(2);const before=[...s.session.state];s.input.keyboard.emit('keydown',{code:'Tab'});assert.equal(s.selected,1);assert.deepEqual(s.session.state,before);
    s.input.keyboard.emit('keydown',{code:'Space'});assert.equal(s.session.moves,1);s.input.keyboard.emit('keydown',{code:'Digit3'});assert.equal(s.selected,2);assert.equal(s.session.moves,2);
    s.input.keyboard.emit('keydown',{code:'Digit9'});assert.equal(s.session.moves,2);s.events.emit('shutdown');
});
test('hint reveals a machine only at third tier and does not auto-adjust the puzzle',()=>{
    const s=scene();s.startLevel(19);const before=[...s.session.state];s.requestHint();assert(!s.hintJob);s.requestHint();assert(!s.hintRing);s.requestHint();assert(s.hintJob);
    tick(s,20);assert(s.hintRing);assert.deepEqual(s.session.state,before);assert.equal(s.session.moves,0);
    s.pauseGame();tick(s,200);assert(s.hintRing);s.resumeGame();tick(s,145);assert.equal(s.hintRing,null);s.events.emit('shutdown');
});
test('visibility pauses solver and input; returning to foreground needs manual resume',()=>{
    const s=scene();s.startLevel(19);s.requestHint();s.requestHint();s.requestHint();const checked=s.hintJob.checked;
    document.hidden=true;docEvents.emit('visibilitychange');assert.equal(s.mode,'paused');tick(s,20);s.turn(0);assert.equal(s.session.moves,0);assert.equal(s.hintJob.checked,checked);
    document.hidden=false;docEvents.emit('visibilitychange');assert.equal(s.mode,'paused');s.resumeGame();tick(s);assert(s.hintJob.checked>checked);s.events.emit('shutdown');
});
test('mix chart preserves puzzle; reset cancel preserves history; confirmed restart clears hints and moves',()=>{
    const s=scene();s.startLevel(12);s.turn(0);const before=[...s.session.state];s.showChart();assert.equal(s.mode,'chart');s.turn(0);assert.deepEqual(s.session.state,before);s.closeChart();assert.equal(s.mode,'playing');
    s.requestHint();s.confirmRestart();click(s,'繼續原本設計');assert.deepEqual(s.session.state,before);assert.equal(s.session.hintsUsed,1);
    s.confirmRestart();click(s,'重新挑戰');assert.equal(s.session.moves,0);assert.equal(s.session.hintsUsed,0);assert(!s.tweens.paused);s.events.emit('shutdown');
});
test('selection retains current unsolved run and completed stars while replay starts fresh',()=>{
    const s=scene();s.startLevel(0);s.turn(0);const run=s.session;s.showSelection();assert.equal(s.session,run);s.renderLevel();assert(s.trace.solved);s.submitLight();assert.equal(s.records[0].stars,3);
    s.startLevel(0);assert.equal(s.session.moves,0);assert.equal(s.records[0].stars,3);s.events.emit('shutdown');
});
test('exit releases captures and listeners and returns to configured main game hub',()=>{
    const s=scene();s.startLevel(19);s.requestHint();s.requestHint();s.requestHint();s.game.events.emit('blur');assert.equal(s.mode,'paused');s.leave();assert.equal(s.destination,'MiniGameHub');assert(!s.tweens.paused);
    s.events.emit('shutdown');assert.equal(s.captures.size,0);assert.equal(docEvents.listenerCount('visibilitychange'),0);assert.equal(s.input.keyboard.listenerCount('keydown'),0);assert.equal(s.game.events.listenerCount('blur'),0);assert.equal(s.hintJob,null);
});
