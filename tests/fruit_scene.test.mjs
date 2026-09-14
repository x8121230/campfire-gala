// Phaser display/input simulation; this does not claim browser pixel or device QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {FRUIT_ROUTES,DAILY_FRUIT_ROUTES} from './fixtures/fruit_routes.mjs';
import {FruitSession} from '../src/data/FruitRules.js';
import {dailyFruitLevel} from '../src/data/FruitLevels.js';
class Display extends EventEmitter{
    constructor(x=0,y=0,text=''){super();Object.assign(this,{x,y,text,list:[],width:512,height:512,visible:true});}
    add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
    setText(text){this.text=text;return this;}setAlpha(alpha){this.alpha=alpha;return this;}setVisible(visible){this.visible=visible;return this;}
    setDisplaySize(width,height){Object.assign(this,{width,height});return this;}setFrame(frame){this.frame=frame;return this;}
    setInteractive(){this.interactive=true;return this;}destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const m of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween','fillRect','clear','fillCircle','strokeCircle','setScale'])Display.prototype[m]=function(){return this;};
globalThis.Phaser={Scene:class{}};const doc=new EventEmitter();globalThis.document={hidden:false,addEventListener:(k,f)=>doc.on(k,f),removeEventListener:(k,f)=>doc.off(k,f)};
const {default:Scene}=await import('../src/scenes/ForestFruitGame.js');const active=new Set();
function scene(missing=false){
    const s=new Scene(),objects=[];s.init({returnScene:'MiniGameHub'});s.textures={exists:()=>!missing};s.events=new EventEmitter();s.game={events:new EventEmitter()};
    s.sound={stopAll(){},context:null};s.input=new EventEmitter();s.input.keyboard=new EventEmitter();s.input.manager={pointersTotal:1};s.input.addPointer=n=>s.input.manager.pointersTotal+=n;
    s.captures=new Set();s.input.keyboard.addCapture=k=>k.forEach(v=>s.captures.add(v));s.input.keyboard.removeCapture=k=>k.forEach(v=>s.captures.delete(v));
    s.add=Object.fromEntries(['image','rectangle','circle','graphics','container','text'].map(m=>[m,(x,y,t)=>{const o=new Display(x,y,t);objects.push(o);return o;}]));
    s.children={removeAll(){objects.forEach(o=>o.destroy());objects.length=0;}};s.tweens={killAll(){}};
    s.scene={manager:{keys:{MiniGameHub:{}}},start:name=>{s.destination=name;}};s.create();active.add(s);return s;
}

const close=s=>{s.events.emit('shutdown');active.delete(s);};test.afterEach(()=>{for(const s of active)close(s);document.hidden=false;});
const click=(s,label)=>{const b=s.overlay?.list.find(o=>o.label?.text===label);assert(b,label);b.emit('pointerdown');};
const tick=(s,n=1)=>{for(let i=0;i<n;i++)s.update(0,100);};
function ready(s){tick(s,2);assert.equal(s.inputGrace,0);}
function settle(s){for(let i=0;i<80&&(s.session.phase==='flying'||s.effectTime>0);i++)tick(s);assert.notEqual(s.session.phase,'flying');}
function replay(s,route){ready(s);for(const m of route){while(s.session.launchIndex!==m.launcher)assert(s.changeLauncher());if(m.swap)assert(s.swap());s.angle=m.angle;assert(s.shoot());settle(s);}}

test('15 complete story input routes pass through scene animation, wave changes and three-star result screens',()=>{
 const s=scene();assert.equal(s.mode,'intro');click(s,'前往果園選關');for(let i=0;i<15;i++){s.startLevel(i);replay(s,FRUIT_ROUTES[i]);assert.equal(s.mode,'finished',String(i+1));assert.equal(s.records[i+1].stars,3);}assert.equal(Object.keys(s.records).length,15);close(s);
});
test('a daily variant completes through the scene and records its date-specific best stars',()=>{
 const s=scene(),v=DAILY_FRUIT_ROUTES[0];s.index='daily';s.currentLevel=dailyFruitLevel(v.date);s.session=new FruitSession(s.currentLevel);s.angle=0;s.renderLevel();replay(s,v.route);assert.equal(s.mode,'finished');assert.equal(s.records[`daily-${v.date}`].stars,3);click(s,'主線關卡');assert.equal(s.mode,'select');close(s);
});
test('touch hold aims, release fires exactly one shot, and a second finger cannot steal or release it',()=>{
 const s=scene();s.startLevel(0);ready(s);s.input.emit('pointerdown',{id:1,x:610,y:300},[]);assert.equal(s.session.shots,0);assert.equal(s.aimPointer,1);s.input.emit('pointermove',{id:1,x:500,y:260});const angle=s.angle;assert(angle<0);
 s.input.emit('pointerdown',{id:2,x:800,y:260},[]);s.input.emit('pointerup',{id:2,x:800,y:260});assert.equal(s.aimPointer,1);assert.equal(s.session.shots,0);s.input.emit('pointerup',{id:1,x:500,y:260});assert.equal(s.session.shots,1);s.input.emit('pointerup',{id:1,x:500,y:260});assert.equal(s.session.shots,1);close(s);
});
test('release outside cancels aim, HUD clicks and stage-selection release do not fire a shot',()=>{
 const s=scene();s.startLevel(0);s.input.emit('pointerdown',{id:1,x:500,y:300},[{}]);s.input.emit('pointerup',{id:1,x:500,y:300});assert.equal(s.session.shots,0);ready(s);s.input.emit('pointerdown',{id:1,x:500,y:300},[]);s.input.emit('pointerupoutside',{id:1});s.input.emit('pointerup',{id:1,x:500,y:300});assert.equal(s.session.shots,0);
 s.input.emit('pointerdown',{id:1,x:1100,y:200},[]);s.input.emit('pointerup',{id:1,x:1100,y:200});assert.equal(s.session.shots,0);close(s);
});
test('keyboard fine aiming, swap and two launch stations update both model and visible cannon',()=>{
 const s=scene();s.startLevel(10);ready(s);s.input.keyboard.emit('keydown',{code:'ArrowRight'});tick(s,3);s.input.keyboard.emit('keyup',{code:'ArrowRight'});assert(s.angle>15);const x=s.session.launchX;s.input.keyboard.emit('keydown',{code:'Tab'});assert.notEqual(s.session.launchX,x);assert.equal(s.cannon.x,376+s.session.launchX);
 const old=s.session.current,next=s.session.next;s.input.keyboard.emit('keydown',{code:'KeyX'});assert.equal(s.session.current,next);assert.equal(s.session.next,old);s.input.keyboard.emit('keydown',{code:'Space'});assert.equal(s.session.shots,1);close(s);
});
test('flight disables touch, keyboard swap and repeated fire without consuming ammunition',()=>{
 const s=scene();s.startLevel(10);ready(s);s.shoot();const queue=[...s.session.queue],launcher=s.session.launchIndex;s.swapButton.emit('pointerdown');s.launchButton.emit('pointerdown');s.fireButton.emit('pointerdown');s.input.keyboard.emit('keydown',{code:'Space',repeat:true});assert.equal(s.session.shots,1);assert.deepEqual(s.session.queue,queue);assert.equal(s.session.launchIndex,launcher);close(s);
});
test('blur pauses mid-flight with no model or animation changes, and resume clears held input',()=>{
 const s=scene();s.startLevel(13);ready(s);s.angle=28;s.shoot();tick(s);s.input.keyboard.emit('keydown',{code:'ArrowLeft'});s.game.events.emit('blur');assert.equal(s.mode,'paused');const before=JSON.stringify([s.session.time,s.session.flight,s.projectile.x,s.projectile.y]);tick(s,20);assert.equal(JSON.stringify([s.session.time,s.session.flight,s.projectile.x,s.projectile.y]),before);assert.equal(s.held.size,0);click(s,'繼續瞄準');assert.equal(s.mode,'playing');assert(!s.held.size);settle(s);assert(s.session.lastResult);close(s);
});
test('visibility pause keeps falling fruit and rescued-bird effects frozen until manual resume',()=>{
 const s=scene();s.startLevel(0);ready(s);s.angle=FRUIT_ROUTES[0][0].angle;s.shoot();for(let i=0;i<40&&s.session.phase==='flying';i++)tick(s);assert(s.effectTime>0);tick(s);document.hidden=true;doc.emit('visibilitychange');const before=JSON.stringify([s.effectTime,s.effects.map(f=>[f.v.x,f.v.y,f.age])]);tick(s,10);assert.equal(JSON.stringify([s.effectTime,s.effects.map(f=>[f.v.x,f.v.y,f.age])]),before);document.hidden=false;doc.emit('visibilitychange');assert.equal(s.mode,'paused');click(s,'繼續瞄準');settle(s);assert.equal(s.effects.length,0);close(s);
});
test('pause and restart-confirmation overlays reject gameplay input; cancel keeps the current board',()=>{
 const s=scene();s.startLevel(10);ready(s);s.pauseGame();const before=JSON.stringify([...s.session.board]);s.swap();s.changeLauncher();s.shoot();s.input.emit('pointerdown',{id:1,x:600,y:300},[]);assert.equal(s.aimPointer,null);assert.equal(s.session.shots,0);click(s,'本關重新開始');assert.equal(s.mode,'confirm');s.shoot();tick(s,10);assert.equal(JSON.stringify([...s.session.board]),before);click(s,'繼續目前這一局');assert.equal(s.mode,'playing');assert.equal(s.session.shots,0);close(s);
});
test('confirmed restart resets the run but preserves stars from earlier completions',()=>{
 const s=scene();s.startLevel(0);replay(s,FRUIT_ROUTES[0]);assert.equal(s.records[1].stars,3);click(s,'再挑戰一次');ready(s);s.shoot();settle(s);assert(s.session.shots>0);s.pauseGame();click(s,'本關重新開始');click(s,'重新開始');assert.equal(s.session.shots,0);assert.equal(s.records[1].stars,3);close(s);
});
test('completed round locks input, next level and selection buttons remain usable',()=>{
 const s=scene();s.startLevel(0);replay(s,FRUIT_ROUTES[0]);const shots=s.session.shots;assert(!s.shoot());s.fireButton.emit('pointerdown');s.swapButton.emit('pointerdown');tick(s,5);assert.equal(s.session.shots,shots);click(s,'下一關 →');assert.equal(s.index,1);s.pauseGame();click(s,'返回選關');assert.equal(s.mode,'select');close(s);
});
test('loss screen explains ammunition exhaustion and retry creates a fresh run',()=>{
 const s=scene();s.startLevel(0);ready(s);s.session.level.shots=1;s.angle=0;s.shoot();settle(s);assert.equal(s.mode,'finished');assert.equal(s.session.phase,'lost');assert.equal(s.lossReason,'shots');click(s,'再挑戰一次');assert.equal(s.session.shots,0);assert.equal(s.session.remaining,8);close(s);
});
test('leaving cleans owned keyboard, pointer, blur and visibility listeners and stops the model',()=>{
 const s=scene();s.startLevel(0);ready(s);s.input.emit('pointerdown',{id:8,x:610,y:250},[]);s.leave();assert.equal(s.destination,'MiniGameHub');assert(s.session.paused);assert.equal(s.aimPointer,null);close(s);assert.equal(s.input.listenerCount('pointerdown'),0);assert.equal(s.input.listenerCount('pointermove'),0);assert.equal(s.input.listenerCount('pointerup'),0);assert.equal(s.input.keyboard.listenerCount('keydown'),0);assert.equal(doc.listenerCount('visibilitychange'),0);assert.equal(s.captures.size,0);
});
test('missing new artwork provides a recoverable route back to the integrated game hub',()=>{
 const s=scene(true);assert(s.overlay);click(s,'返回遊戲列表');assert.equal(s.destination,'MiniGameHub');close(s);
});
