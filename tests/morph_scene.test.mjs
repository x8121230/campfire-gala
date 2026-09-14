// Phaser display/input simulation. Full browser rendering and physical touch are separate QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {MORPH_DT} from '../src/data/MorphRules.js';
import {MORPH_ROUTES,executeMorphRouteCommand} from './fixtures/morph_routes.mjs';
class Display extends EventEmitter{
    constructor(x=0,y=0,text=''){super();Object.assign(this,{x,y,text,list:[],width:512,height:512,visible:true});}
    add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
    setText(text){this.text=text;return this;}setAlpha(alpha){this.alpha=alpha;return this;}setVisible(visible){this.visible=visible;return this;}
    setDisplaySize(width,height){Object.assign(this,{width,height});return this;}setFrame(frame){this.frame=frame;return this;}
    setInteractive(){this.interactive=true;return this;}destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const m of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween','fillRect','clear','fillCircle','strokeCircle'])Display.prototype[m]=function(){return this;};
globalThis.Phaser={Scene:class{}};const doc=new EventEmitter();globalThis.document={hidden:false,addEventListener:(k,f)=>doc.on(k,f),removeEventListener:(k,f)=>doc.off(k,f)};
const {default:Scene}=await import('../src/scenes/ForestMorphGame.js');const active=new Set();
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
const tick=(s,n=1)=>{for(let i=0;i<n;i++)s.update(0,1000*MORPH_DT);};
function adapter(s){return new Proxy(s.session,{get(target,prop){
    if(prop==='setForm')return i=>s.changeForm(i);
    if(prop==='advance')return (dt,input={})=>{s.keysHeld.clear();for(const [key,code] of [['left','ArrowLeft'],['right','ArrowRight'],['jump','Space'],['dash','KeyX']])if(input[key])s.keysHeld.add(code);s.update(0,dt*1000);};
    return target[prop];
}});}

test('all 12 stages complete via scene update with input replay, badges and star records',()=>{
    const s=scene();assert.equal(s.mode,'intro');click(s,'選擇冒險關卡');
    let minHeroY=Infinity;const draw=s.drawState.bind(s);s.drawState=dt=>{draw(dt);minHeroY=Math.min(minHeroY,s.hero.y+s.world.y);};
    for(let i=0;i<12;i++){s.startLevel(i);tick(s,3);const a=adapter(s);for(const c of MORPH_ROUTES[i])executeMorphRouteCommand(a,c);assert.equal(s.mode,'finished',String(i+1));assert.equal(s.records[i].stars,3);}
    assert(minHeroY>120,'high mushroom jumps remain visible below the HUD');
    assert.equal(Object.keys(s.records).length,12);close(s);
});
test('two touch pointers can move and jump simultaneously; releasing one retains the other',()=>{
    const s=scene();s.startLevel(0);tick(s,3);s.rightButton.emit('pointerdown',{id:1});s.jumpButton.emit('pointerdown',{id:2});tick(s,15);
    assert(s.session.player.x>90);assert(s.session.player.y<540);s.input.emit('pointerup',{id:2});assert(s.controls().right);assert(!s.controls().jump);
    s.rightButton.emit('pointerout',{id:1});assert(!s.controls().right);assert.equal(s.touchHeld.size,0);close(s);
});
test('pointer release outside canvas clears held input and a new touch can change form while moving',()=>{
    const s=scene();s.startLevel(0);s.rightButton.emit('pointerdown',{id:4});s.formButtons[1].emit('pointerdown',{id:5});assert.equal(s.session.player.form,1);assert(s.controls().right);
    s.input.emit('pointerupoutside',{id:4});assert(!s.controls().right);close(s);
});
test('keyboard movement and jump release work and key repetition does not retrigger form or pause',()=>{
    const s=scene();s.startLevel(0);tick(s,3);s.input.keyboard.emit('keydown',{code:'KeyD'});s.input.keyboard.emit('keydown',{code:'Space'});tick(s,12);assert(s.session.player.vy<0);
    s.input.keyboard.emit('keyup',{code:'Space'});tick(s);assert(s.session.player.vy>=-260);
    s.input.keyboard.emit('keydown',{code:'Digit3',repeat:true});assert.equal(s.session.player.form,0);s.input.keyboard.emit('keydown',{code:'Digit3'});assert.equal(s.session.player.form,2);close(s);
});
test('blur pause freezes animation clocks and clears held controls; resume requires a new press',()=>{
    const s=scene();s.startLevel(5);s.rightButton.emit('pointerdown',{id:1});s.input.keyboard.emit('keydown',{code:'Space'});tick(s,10);s.game.events.emit('blur');assert.equal(s.mode,'paused');
    const before=JSON.stringify([s.session.player,s.session.time,s.session.gateTimes]);tick(s,120);assert.equal(JSON.stringify([s.session.player,s.session.time,s.session.gateTimes]),before);assert(!s.controls().right);assert(!s.controls().jump);
    document.hidden=false;doc.emit('visibilitychange');assert.equal(s.mode,'paused');click(s,'繼續冒險');assert.equal(s.mode,'playing');assert.equal(s.keysHeld.size,0);close(s);
});
test('touch and keyboard changes cannot affect paused or confirmation states',()=>{
    const s=scene();s.startLevel(0);s.pauseGame();s.formButtons[1].emit('pointerdown',{id:1});s.rightButton.emit('pointerdown',{id:2});s.input.keyboard.emit('keydown',{code:'Digit2'});assert.equal(s.session.player.form,0);assert.equal(s.touchHeld.size,0);
    click(s,'整關重新開始');assert.equal(s.mode,'confirm');s.changeForm(2);tick(s,20);assert.equal(s.session.player.form,0);close(s);
});
test('checkpoint action preserves badges and returns camera to player after fall',()=>{
    const s=scene();s.startLevel(11);s.session.checkpoint={x:1900,y:560,index:1};s.session.collected.add(0);s.session.player.x=2600;s.cameraX=1700;s.input.keyboard.emit('keydown',{code:'KeyR'});tick(s);
    assert.equal(s.session.player.x,1900);assert(s.session.collected.has(0));assert.equal(s.session.falls,1);assert(Math.abs(s.cameraX-1480)<1);close(s);
});
test('morph blocked by low ceiling leaves current sprite and physics shape consistent',()=>{
    const s=scene();s.startLevel(1);s.session.player.x=500;tick(s,3);s.changeForm(1);tick(s);assert.equal(s.session.player.form,0);assert.equal(s.hero.frame,0);assert.match(s.tipText.text,/空間不夠/);close(s);
});
test('selector resume retains running checkpoint; restart cancel preserves and restart confirms reset',()=>{
    const s=scene();s.startLevel(11);s.session.collected.add(0);s.session.player.x=1110;tick(s,3);const run=s.session;
    s.pauseGame();click(s,'返回選關');assert.equal(s.session,run);s.renderLevel();assert.equal(s.session.checkpoint.index,0);assert(s.session.collected.has(0));
    s.pauseGame();click(s,'整關重新開始');click(s,'繼續目前冒險');assert(s.session.collected.has(0));s.pauseGame();click(s,'整關重新開始');click(s,'重新開始');assert.equal(s.session.collected.size,0);assert.equal(s.session.checkpoint.index,-1);close(s);
});
test('full completion locks controls and replay keeps best stars',()=>{
    const s=scene();s.startLevel(0);tick(s,3);const a=adapter(s);for(const c of MORPH_ROUTES[0])executeMorphRouteCommand(a,c);const x=s.session.player.x;s.rightButton.emit('pointerdown',{id:1});tick(s,20);assert.equal(s.session.player.x,x);assert.equal(s.records[0].stars,3);
    click(s,'再探索一次');assert.equal(s.session.collected.size,0);assert.equal(s.records[0].stars,3);close(s);
});
test('leaving removes owned listeners, captures and inputs; reopening does not multiply touch pointers',()=>{
    const s=scene();s.startLevel(0);s.rightButton.emit('pointerdown',{id:2});s.leave();assert.equal(s.destination,'MiniGameHub');assert.equal(s.touchHeld.size,0);close(s);
    assert.equal(s.input.listenerCount('pointerup'),0);assert.equal(s.input.keyboard.listenerCount('keydown'),0);assert.equal(doc.listenerCount('visibilitychange'),0);assert.equal(s.captures.size,0);assert.equal(s.input.manager.pointersTotal,3);
    s.create();active.add(s);assert.equal(s.input.manager.pointersTotal,3);close(s);
});
test('missing artwork shows a recoverable return button',()=>{const s=scene(true);assert(s.overlay);click(s,'返回遊戲列表');assert.equal(s.destination,'MiniGameHub');close(s);});
