import {EventEmitter} from 'node:events';
export class Display extends EventEmitter {
  constructor(x=0,y=0,text='',style={}){super();Object.assign(this,{x,y,text,style,list:[],width:512,height:512,visible:true,alpha:1});}
  add(items){this.list.push(...(Array.isArray(items)?items:[items]));return this;}
  setText(text){this.text=text;return this;}setFontSize(fontSize){this.style.fontSize=fontSize;return this;}setColor(color){this.style.color=color;return this;}
  setAlpha(alpha){this.alpha=alpha;return this;}setVisible(visible){this.visible=visible;return this;}
  setDisplaySize(width,height){Object.assign(this,{displayWidth:width,displayHeight:height});return this;}
  setSize(width,height){Object.assign(this,{width,height});return this;}
  setTexture(texture,frame){Object.assign(this,{texture,frame});return this;}setFrame(frame){this.frame=frame;return this;}
  setInteractive(){this.interactive=true;return this;}destroy(){if(this.destroyed)return;this.destroyed=true;this.list.forEach(o=>o.destroy?.());}
}
for(const m of ['setOrigin','setDepth','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setAngle','setTint','lineBetween','fillRect','clear','fillCircle','strokeCircle','setScale','setFlipX'])Display.prototype[m]=function(){return this;};
globalThis.Phaser={Scene:class{}};
export const doc=new EventEmitter(),win=new EventEmitter();
globalThis.document={hidden:false,addEventListener:(k,f)=>doc.on(k,f),removeEventListener:(k,f)=>doc.off(k,f)};
globalThis.window={innerWidth:844,innerHeight:390,addEventListener:(k,f)=>win.on(k,f),removeEventListener:(k,f)=>win.off(k,f)};
const {default:Scene}=await import('../../src/scenes/ForestKitchenGame.js');
export function makeKitchenScene(missing=false){
  const s=new Scene(),objects=[];s.init({returnScene:'MiniGameHub'});s.objects=objects;s.textures={exists:()=>!missing};s.events=new EventEmitter();s.game={events:new EventEmitter()};
  s.sound={stopAll(){},context:null};s.input=new EventEmitter();s.input.keyboard=new EventEmitter();s.captures=new Set();s.input.keyboard.addCapture=ks=>ks.forEach(k=>s.captures.add(k));s.input.keyboard.removeCapture=ks=>ks.forEach(k=>s.captures.delete(k));
  s.add=Object.fromEntries(['image','rectangle','ellipse','graphics','container','text'].map(m=>[m,(...args)=>{const [x,y,t,style]=args,o=new Display(x,y,t,typeof style==='object'?style:{});o.kind=m;o.args=args;objects.push(o);return o;}]));
  s.children={removeAll(){objects.forEach(o=>o.destroy());objects.length=0;}};s.tweens={killAll(){}};s.scene={manager:{keys:{MiniGameHub:{}}},start:name=>s.destination=name};s.create();return s;
}
export const closeKitchen=s=>s.events.emit('shutdown');
export const clickOverlay=(s,label)=>{const b=s.overlay?.list.find(o=>o.label?.text===label);if(!b)throw Error('missing button '+label);b.emit('pointerdown');};
