// Scene-flow simulation. This does NOT replace a real Phaser/browser playtest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

class View extends EventEmitter {
    constructor(x=0,y=0) { super();this.x=x;this.y=y;this.width=200;this.height=200;this.children=[]; }
    setOrigin(){return this;} setScale(){return this;} setAlpha(a){this.alpha=a;return this;}
    setVisible(v){this.visible=v;return this;} setAngle(){return this;} setDepth(){return this;}
    setStrokeStyle(){return this;} setSize(){return this;} setInteractive(){return this;}
    setPosition(x,y){this.x=x;this.y=y;return this;} setText(t){this.text=t;return this;}
    add(items){this.children.push(...(Array.isArray(items)?items:[items]));return this;}
    fillStyle(){return this;} fillGradientStyle(){return this;} lineStyle(){return this;}
    fillRect(){return this;} fillRoundedRect(){return this;} strokeRoundedRect(){return this;}
    clear(){return this;} destroy(){this.destroyed=true;}
}
globalThis.Phaser={Scene:class{},Math:{Between:(a,b)=>Math.floor((a+b)/2),Linear:(a,b,t)=>a+(b-a)*t}};
const visibility=new EventEmitter();
globalThis.document={hidden:false,addEventListener:(n,f)=>visibility.on(n,f),removeEventListener:(n,f)=>visibility.off(n,f)};
const {default:AnimalSnackGame}=await import('../src/scenes/AnimalSnackGame.js');
function setup(){
    const s=new AnimalSnackGame();s.init({returnScene:'MiniGameHub'});
    s.add={};for(const n of ['graphics','rectangle','ellipse','circle','star','container','image','text'])s.add[n]=(x,y)=>new View(x,y);
    s.textures={exists:()=>true};s.sound={stopAll(){},volume:1,mute:false};
    s.input=new EventEmitter();s.input.keyboard=new EventEmitter();
    s.game={events:new EventEmitter()};s.events=new EventEmitter();
    s.tweens={add(){},pauseAll(){},resumeAll(){}};
    s.scene={manager:{keys:{MiniGameHub:{}}},start:k=>{s.destination=k;},restart:d=>{s.restarted=d;}};
    s.create();return s;
}
function begin(s){const b=s.overlay.children.find(x=>x.label);b.emit('pointerdown');}
function tick(s,n=50){for(let i=0;i<n;i++)s.update(0,50);}
function finishGuest(s){s.choose(s.session.current.animal);tick(s,40);}
function clean(s){s.events.emit('shutdown');}

test('intro does not advance; tutorial pauses approach; delivery advances once',()=>{
    const s=setup();tick(s,100);assert.equal(s.elapsed,0);assert.equal(s.mode,'intro');
    begin(s);const y=s.guestY;tick(s,200);assert.equal(s.guestY,y);
    s.choose(0);s.choose(0);tick(s,40);assert.equal(s.session.served,1);assert.equal(s.session.attempts,1);
    clean(s);
});
test('wrong snack does not remove guest; retry correct snack works',()=>{
    const s=setup();begin(s);s.choose(1);tick(s,20);
    assert.equal(s.session.wrong,1);assert.equal(s.session.served,0);assert.ok(s.session.current);
    assert.ok(s.hintFood);s.choose(0);tick(s,40);assert.equal(s.session.served,1);clean(s);
});
test('pause freezes projectile and game clock; explicit resume is required',()=>{
    const s=setup();begin(s);s.choose(0);tick(s,4);s.pauseGame();
    const time=s.elapsed,t=s.shot.t;tick(s,100);assert.equal(s.elapsed,time);assert.equal(s.shot.t,t);
    s.choose(1);assert.equal(s.shot.food,'carrot');s.resumeGame();tick(s,40);
    assert.equal(s.session.served,1);clean(s);
});
test('visibility and blur pause; shutdown removes external and keyboard listeners',()=>{
    const s=setup();begin(s);document.hidden=true;visibility.emit('visibilitychange');
    assert.equal(s.mode,'paused');document.hidden=false;visibility.emit('visibilitychange');
    assert.equal(s.mode,'paused');s.resumeGame();s.game.events.emit('blur');assert.equal(s.mode,'paused');
    clean(s);assert.equal(s.input.keyboard.listenerCount('keydown'),0);
    assert.equal(s.game.events.listenerCount('blur'),0);assert.equal(visibility.listenerCount('visibilitychange'),0);
});
test('missed guest returns to queue, later guests really move',()=>{
    const s=setup();begin(s);for(let i=0;i<3;i++)finishGuest(s);
    const id=s.session.current.id, y=s.guestY;tick(s,10);assert.ok(s.guestY>y);
    s.guestY=418;tick(s,1);assert.equal(s.session.missed,1);assert.equal(s.session.queue.at(-1).id,id);
    tick(s,20);assert.ok(s.session.current);clean(s);
});
test('complete route reaches results, restart and hub return route are intact',()=>{
    const s=setup();begin(s);for(let i=0;i<12;i++)finishGuest(s);
    assert.equal(s.mode,'finished');assert.equal(s.session.served,12);assert.ok(s.overlay);
    s.choose(0);assert.equal(s.session.served,12);s.restart();assert.equal(s.restarted.returnScene,'MiniGameHub');
    s.leave();assert.equal(s.destination,'MiniGameHub');clean(s);
});
