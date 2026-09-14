// Simulated Phaser lifecycle tests, not browser rendering or real-device touch QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createCourierSolver,courierComplete} from '../src/data/CourierRules.js';
class Display extends EventEmitter{
    constructor(x=0,y=0,text=''){super();Object.assign(this,{x,y,text,list:[],width:512,height:512});}
    add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
    setText(text){this.text=text;return this;}setAlpha(a){this.alpha=a;return this;}
    setDisplaySize(width,height){Object.assign(this,{width,height});return this;}
    setInteractive(){this.interactive=true;return this;}
    destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const m of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween'])Display.prototype[m]=function(){return this;};
globalThis.Phaser={Scene:class{}};const doc=new EventEmitter();
globalThis.document={hidden:false,addEventListener:(k,f)=>doc.on(k,f),removeEventListener:(k,f)=>doc.off(k,f)};
const {default:Scene}=await import('../src/scenes/ForestCourierGame.js');
function scene(missing=false){
    const s=new Scene(),objects=[];s.init({returnScene:'MiniGameHub'});s.textures={exists:()=>!missing};s.events=new EventEmitter();s.game={events:new EventEmitter()};
    s.sound={stopAll(){},context:null};s.input={keyboard:new EventEmitter()};s.captures=new Set();s.input.keyboard.addCapture=k=>k.forEach(v=>s.captures.add(v));s.input.keyboard.removeCapture=k=>k.forEach(v=>s.captures.delete(v));
    s.add=Object.fromEntries(['image','rectangle','circle','graphics','container','text'].map(m=>[m,(x,y,t)=>{const o=new Display(x,y,t);objects.push(o);return o;}]));
    s.children={removeAll(){objects.forEach(o=>o.destroy());objects.length=0;}};
    s.tweens={paused:false,jobs:[],add(job){this.jobs.push(job);return job;},killAll(){this.jobs=[];},pauseAll(){this.paused=true;},resumeAll(){this.paused=false;},flush(){if(this.paused)return;const jobs=this.jobs.splice(0);for(const j of jobs){j.targets.x=j.x;j.targets.y=j.y;j.onComplete();}}};
    s.scene={manager:{keys:{MiniGameHub:{}}},start:name=>{s.destination=name;}};s.create();return s;
}
const click=(s,label)=>{const b=s.overlay?.list.find(o=>o.label?.text===label);assert(b,label);b.emit('pointerdown');};
const act=(s,a)=>{s.perform(a);s.tweens.flush();};
const tick=(s,n=1)=>{for(let i=0;i<n;i++)s.update(0,50);};
const close=s=>s.events.emit('shutdown');
function route(s){const j=createCourierSolver(s.session.level,s.session.state);while(j.status==='searching')j.tick(200);assert.equal(j.status,'solved');return j.solution;}

test('30 missions complete through scene actions, movement animation and automatic delivery',()=>{
    const s=scene();assert.equal(s.mode,'intro');click(s,'開始選擇委託');assert.equal(s.mode,'select');
    for(const [page,count] of [['story',18],['bonus',12]])for(let i=0;i<count;i++){
        s.startLevel(i,page);for(const a of route(s))act(s,a);assert.equal(s.mode,'finished',`${page}:${i}`);assert.equal(s.records[`${page}:${i}`].stars,3);
    }
    assert.equal(Object.keys(s.records).length,30);close(s);
});
test('rapid taps and keyboard input during travel cannot enqueue extra moves or cargo actions',()=>{
    const s=scene();s.startLevel(1);s.perform({type:'load',parcel:0});s.perform({type:'move',to:1});assert.equal(s.mode,'travelling');const state=JSON.stringify(s.session.state);
    s.perform({type:'move',to:2});s.input.keyboard.emit('keydown',{code:'Digit3'});s.input.keyboard.emit('keydown',{code:'KeyB'});s.undoAction();assert.equal(JSON.stringify(s.session.state),state);
    s.tweens.flush();assert.equal(s.mode,'playing');assert.equal(s.session.state.distance,1);close(s);
});
test('A–D load buttons and numbered destination shortcuts honor locations and repeat guard',()=>{
    const s=scene();s.startLevel(1);s.input.keyboard.emit('keydown',{code:'KeyA',repeat:true});assert.equal(s.session.state.parcels[0],0);
    s.input.keyboard.emit('keydown',{code:'KeyA'});s.input.keyboard.emit('keydown',{code:'KeyB'});assert.deepEqual(s.session.state.parcels,[1,1]);
    s.input.keyboard.emit('keydown',{code:'Digit2'});s.tweens.flush();assert.equal(s.session.state.pos,1);assert.equal(s.session.state.parcels[0],2);close(s);
});
test('blocked move preserves history and explains route connection or load limit',()=>{
    const s=scene();s.startLevel(4);s.perform({type:'move',to:3});assert.match(s.feedback.text,/相連/);assert.equal(s.session.history.length,0);
    act(s,{type:'move',to:1});s.perform({type:'load',parcel:0});const before=JSON.stringify(s.session.state);s.perform({type:'move',to:5});assert.match(s.feedback.text,/限重/);assert.equal(JSON.stringify(s.session.state),before);close(s);
});
test('pause during movement freezes tween, ignores controls and requires manual resume after focus',()=>{
    const s=scene();s.startLevel(1);s.perform({type:'move',to:1});s.game.events.emit('blur');assert.equal(s.mode,'paused');assert(s.tweens.paused);
    const before=JSON.stringify(s.session.state);s.tweens.flush();tick(s,100);s.perform({type:'load',parcel:0});assert.equal(JSON.stringify(s.session.state),before);
    document.hidden=false;doc.emit('visibilitychange');assert.equal(s.mode,'paused');click(s,'繼續配送');assert.equal(s.mode,'travelling');s.tweens.flush();assert.equal(s.mode,'playing');close(s);
});
test('returning to selector during final travel records completed task and cancels stale animation',()=>{
    const s=scene();s.startLevel(0);s.perform({type:'load',parcel:0});s.perform({type:'move',to:1});s.pauseGame();click(s,'返回選關');
    assert.equal(s.mode,'select');assert.equal(s.records['story:0'].stars,3);s.tweens.flush();assert.equal(s.mode,'select');s.startLevel(1);assert.equal(s.session.state.pos,0);close(s);
});
test('freshness failure is recoverable with scene undo and idle time consumes no freshness',()=>{
    const s=scene();s.startLevel(12);act(s,{type:'move',to:1});act(s,{type:'move',to:2});s.perform({type:'load',parcel:0});tick(s,500);assert.equal(s.session.state.age[0],0);
    for(const to of [1,2,1,2])act(s,{type:'move',to});assert(s.session.state.failed);assert.match(s.feedback.text,/走太遠/);
    s.requestHint();assert.equal(s.session.hintsUsed,0);s.undoAction();assert(!s.session.state.failed);assert.equal(s.session.state.age[0],3);close(s);
});
test('third hint solves from current state without acting, pause suspends search',()=>{
    const s=scene();s.startLevel(17);act(s,{type:'move',to:5});const before=JSON.stringify(s.session.state);
    s.requestHint();s.requestHint();assert(!s.hintJob);s.requestHint();const j=s.hintJob;assert(j);document.hidden=true;doc.emit('visibilitychange');tick(s,20);assert.equal(j.checked,0);
    document.hidden=false;s.resumeGame();for(let i=0;i<100&&s.hintJob;i++)tick(s);assert.equal(j.status,'solved');assert.equal(JSON.stringify(s.session.state),before);assert.equal(s.session.hintsUsed,3);assert(!s.hintJob);close(s);
});
test('undo cancels hint computation and preserves used hints',()=>{
    const s=scene();s.startLevel(17);act(s,{type:'move',to:5});s.requestHint();s.requestHint();s.requestHint();assert(s.hintJob);s.undoAction();assert(!s.hintJob);assert.equal(s.session.state.pos,0);assert.equal(s.session.hintsUsed,3);close(s);
});
test('help and restart cancel preserve state; confirmed restart resets state and resumes tweens',()=>{
    const s=scene();s.startLevel(4);act(s,{type:'move',to:1});s.requestHint();const before=JSON.stringify(s.session.state);
    s.showHelp();s.perform({type:'load',parcel:0});assert.equal(JSON.stringify(s.session.state),before);click(s,'回到配送');
    s.confirmRestart();click(s,'保留目前安排');assert.equal(JSON.stringify(s.session.state),before);assert.equal(s.session.hintsUsed,1);
    s.confirmRestart();click(s,'重新出發');assert.equal(s.session.state.distance,0);assert.equal(s.session.hintsUsed,0);assert(!s.tweens.paused);close(s);
});
test('changing selector tabs does not erase running state or mix up main and bonus records',()=>{
    const s=scene();s.startLevel(0);for(const a of route(s))act(s,a);s.startLevel(0,'bonus');s.perform({type:'move',to:1});s.tweens.flush();const run=s.session;
    s.showSelection('story');s.showSelection('bonus');assert.equal(s.session,run);s.renderLevel();assert.equal(s.runKey,'bonus:0');assert.equal(s.records['story:0'].stars,3);assert(!s.records['bonus:0']);close(s);
});
test('completion waits for return to departure station and replay retains best earned stars',()=>{
    const s=scene();s.startLevel(9);const actions=route(s);for(const a of actions.slice(0,-1))act(s,a);assert(s.session.state.parcels.every(v=>v===2));assert.equal(s.mode,'playing');
    act(s,actions.at(-1));assert.equal(s.mode,'finished');assert(courierComplete(s.session.level,s.session.state));s.startLevel(9);s.requestHint();for(const a of route(s))act(s,a);assert.equal(s.records['story:9'].stars,3);close(s);
});
test('exit cleans listeners, keyboard capture, audio and tweens and returns to host hub',()=>{
    const s=scene();s.startLevel(17);s.requestHint();s.requestHint();s.requestHint();s.leave();assert.equal(s.destination,'MiniGameHub');assert(!s.hintJob);assert.equal(s.tweens.jobs.length,0);close(s);
    assert.equal(doc.listenerCount('visibilitychange'),0);assert.equal(s.game.events.listenerCount('blur'),0);assert.equal(s.input.keyboard.listenerCount('keydown'),0);assert.equal(s.captures.size,0);
});
test('missing artwork provides an exit instead of entering a broken game',()=>{
    const s=scene(true);assert(s.overlay);assert.equal(s.session,null);click(s,'返回遊戲列表');assert.equal(s.destination,'MiniGameHub');
});
