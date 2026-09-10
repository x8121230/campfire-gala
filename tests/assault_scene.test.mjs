// Phaser display/input simulation; real browser and physical-device QA remain separate.
import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';
import fs from 'node:fs';
class Display extends EventEmitter{
    constructor(x=0,y=0,text=''){super();Object.assign(this,{x,y,text,list:[],width:512,height:512,visible:true});}
    add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
    setText(text){this.text=text;return this;}setAlpha(alpha){this.alpha=alpha;return this;}setVisible(visible){this.visible=visible;return this;}
    setDisplaySize(width,height){Object.assign(this,{width,height});return this;}setFrame(frame){this.frame=frame;return this;}
    setInteractive(){this.interactive=true;return this;}destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const m of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween','fillRect','clear','fillCircle','strokeCircle','setScale','setFlipX'])Display.prototype[m]=function(){return this;};
Display.prototype.createGeometryMask=function(){return {destroy(){this.destroyed=true;}};};
Display.prototype.setMask=function(mask){this.mask=mask;return this;};
globalThis.Phaser={Scene:class{}};const doc=new EventEmitter();globalThis.document={hidden:false,addEventListener:(k,f)=>doc.on(k,f),removeEventListener:(k,f)=>doc.off(k,f)};
const {default:Scene}=await import('../src/scenes/ForestAssaultGame.js');const active=new Set();
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
const routes=JSON.parse(fs.readFileSync(new URL('./fixtures/assault_routes.json',import.meta.url)));
function replay(s,route){
  const keys={};
  for(const [count,input]of route.frames)for(let n=0;n<count;n++){
    for(const [key,on]of Object.entries({KeyA:input.axis<0,KeyD:input.axis>0,KeyW:!!input.up,KeyS:!!input.down,KeyJ:!!input.fire}))if(keys[key]!==on){s.input.keyboard.emit(on?'keydown':'keyup',{code:key});keys[key]=on;}
    for(const [name,button]of [['jump','jumpButton'],['dash','dashButton'],['grenade','grenadeButton'],['interact','useButton']])if(input[name])s[button].emit('pointerdown',{id:3});
    if(Number.isInteger(input.weapon))s.weaponButtons[input.weapon].emit('pointerdown',{id:4});s.update(0,1000/30);
  }
}
test('all six battles run through scene input, camera and complete result flow',()=>{const s=scene();click(s,'選擇戰役與配置');for(const route of routes.filter(r=>r.difficulty==='standard'&&!r.tank)){s.startLevel(route.id-1);replay(s,route);assert.equal(s.mode,'finished',`battle ${route.id}`);assert.equal(s.session.status,'won');assert(s.cameraX>0);assert(s.records[`${route.id}:standard`].stars>=2);}close(s);});
test('selection offers six battles, three loadouts and three difficulty choices',()=>{const s=scene();click(s,'選擇戰役與配置');assert.equal(s.levelButtons.length,6);s.loadoutButtons[2].emit('pointerdown');assert.equal(s.loadout,2);s.difficultyButton.emit('pointerdown');assert.equal(s.difficulty,'assault');s.levelButtons[0].emit('pointerdown');assert.equal(s.session.player.hp,4);assert.equal(s.session.player.grenades,5);close(s);});
test('keyboard aiming, crouching and weapon switching reach the model',()=>{const s=scene();s.startLevel(0);s.input.keyboard.emit('keydown',{code:'KeyS'});tick(s);assert(s.session.player.crouch);s.input.keyboard.emit('keyup',{code:'KeyS'});s.input.keyboard.emit('keydown',{code:'Digit3'});assert.equal(s.session.player.weapon,2);s.input.keyboard.emit('keydown',{code:'KeyW'});s.input.keyboard.emit('keydown',{code:'KeyJ'});tick(s);assert(s.session.shots.some(q=>q.vy<0));s.input.keyboard.emit('keydown',{code:'KeyQ'});assert.equal(s.session.player.weapon,0);close(s);});
test('two fingers independently hold movement and shooting and release outside stops them',()=>{const s=scene();s.startLevel(0);s.moveButtons.right.emit('pointerdown',{id:1});s.fireButton.emit('pointerdown',{id:2});tick(s,2);assert(s.session.player.x>130);assert(s.session.shots.length>0);s.input.emit('pointerupoutside',{id:1});assert.equal(s.touch.size,1);assert.equal(s.controls().axis,0);assert(s.controls().fire);s.input.emit('pointerupoutside',{id:2});assert(!s.controls().fire);close(s);});
test('an unrelated pointer release does not cancel a held control',()=>{const s=scene();s.startLevel(0);s.fireButton.emit('pointerdown',{id:2});s.input.emit('pointerup',{id:3});assert(s.controls().fire);s.fireButton.emit('pointerout',{id:2});assert(!s.controls().fire);close(s);});
test('brief action requests survive display frames shorter than a physics step',()=>{const s=scene();s.startLevel(0);s.dashButton.emit('pointerdown');s.update(0,1);assert(s.requests.dash);assert.equal(s.session.stats.dashes,0);s.update(0,10);assert.equal(s.session.stats.dashes,1);assert(!s.requests.dash);close(s);});
test('automatic fire is optional and updates its visible toggle',()=>{const s=scene();s.startLevel(0);tick(s);assert.equal(s.session.shots.length,0);s.autoButton.emit('pointerdown');tick(s);assert(s.session.shots.length>0);assert.match(s.autoButton.label.text,/開/);s.autoButton.emit('pointerdown');assert(!s.autoFire);close(s);});
test('blur freezes combat and particles; resuming clears held buttons',()=>{const s=scene();s.startLevel(0);s.fireButton.emit('pointerdown',{id:1});tick(s);s.game.events.emit('blur');assert.equal(s.mode,'paused');const snapshot=JSON.stringify([s.session.time,s.session.player,s.session.shots,s.effects]);tick(s,20);assert.equal(JSON.stringify([s.session.time,s.session.player,s.session.shots,s.effects]),snapshot);click(s,'繼續突擊');assert.equal(s.touch.size,0);assert.equal(s.held.size,0);close(s);});
test('visibility return requires manual resume and paused inputs cannot mutate combat',()=>{const s=scene();s.startLevel(0);document.hidden=true;doc.emit('visibilitychange');assert.equal(s.mode,'paused');document.hidden=false;doc.emit('visibilitychange');s.grenadeButton.emit('pointerdown');s.weaponButtons[2].emit('pointerdown');tick(s);assert.equal(s.mode,'paused');assert.equal(s.session.player.weapon,0);assert.equal(s.session.stats.grenades,0);close(s);});
test('restart confirmation supports cancellation and a fresh battle',()=>{const s=scene();s.startLevel(0);tick(s,10);s.pauseGame();click(s,'重新開始本關');assert.equal(s.mode,'confirm');click(s,'繼續目前戰役');assert(Math.abs(s.session.time-1)<1e-8);s.pauseGame();click(s,'重新開始本關');click(s,'確認重新出發');assert.equal(s.session.time,0);assert.equal(s.session.player.hp,6);close(s);});
test('death returns to a checkpoint and keeps the scene playable',()=>{const s=scene();s.startLevel(0);s.session.die();tick(s,12);assert.equal(s.mode,'playing');assert.equal(s.session.stats.deaths,1);assert.equal(s.session.player.hp,6);assert.equal(s.session.respawnDelay,0);close(s);});
test('result navigation preserves records while restarting supplies',()=>{const s=scene();s.startLevel(0);replay(s,routes[0]);assert.equal(s.mode,'finished');const record=s.records['1:standard'];click(s,'下一場戰役 →');assert.equal(s.index,1);assert.equal(s.session.stats.score,0);assert.equal(s.session.player.grenades,3);s.pauseGame();click(s,'返回選關');assert.equal(s.mode,'select');assert.equal(s.records['1:standard'],record);close(s);});
test('leaving removes owned listeners and keyboard captures and destroys the field mask',()=>{const s=scene();s.startLevel(0);const mask=s.worldMask;s.leave();assert.equal(s.destination,'MiniGameHub');assert(s.session.paused);close(s);assert(mask.destroyed);assert.equal(s.input.keyboard.listenerCount('keydown'),0);assert.equal(s.input.listenerCount('pointerupoutside'),0);assert.equal(doc.listenerCount('visibilitychange'),0);assert.equal(s.captures.size,0);assert.equal(s.input.manager.pointersTotal,4);});
test('missing artwork gives a working return to the integrated hub',()=>{const s=scene(true);click(s,'返回遊戲列表');assert.equal(s.destination,'MiniGameHub');close(s);});
