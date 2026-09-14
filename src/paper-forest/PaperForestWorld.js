import {SPOTS,APPLES,ANIMALS,TREES,MUSHROOMS,PATHS,terrainHeight,distance} from '../realm/StarForestRules.js';
import {prepareAtlas,prepareHero} from './PaperArt.js';
const BASE=47,ROOT=new URL('../../assets/paper-forest/',import.meta.url);
export const project=(x,z,y=terrainHeight(x,z))=>({x:(x-z)*Math.SQRT1_2*BASE,y:(x+z)*.5*BASE-y*BASE*.82});
const loadImage=name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`素材尚未載入：${name}`));im.src=new URL(name,ROOT).href;});
// A canvas scene with depth-sorted painted sprites, not polygonal 3D geometry.
export class PaperForestWorld {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas 2D unavailable');this.t=0;this.zoom=1;this.guideEnabled=true;this.focusPoint=null;this.target={x:-29,z:5,set:(x,y,z)=>{this.target.x=x;this.target.z=z;}};this.aimRing={visible:false};this.aim=null;this.overview=false;this.dead=false;this.width=1280;this.height=720;this.assets={};this.props=[];this.fade=new Map();}
 async load(){
  const [atlas,hero,grass]=await Promise.all([loadImage('storybook-atlas.png'),loadImage('hero-atlas.png'),loadImage('grass.png')]);
  if(this.dead)return;this.assets={atlas,hero:prepareHero(hero),grass};this.sprites=prepareAtlas(atlas);const sh=document.createElement('canvas');sh.width=128;sh.height=48;const sg=sh.getContext('2d'),grad=sg.createRadialGradient(64,24,0,64,24,62);grad.addColorStop(0,'#26321fd9');grad.addColorStop(.58,'#33402e73');grad.addColorStop(1,'#33402e00');sg.fillStyle=grad;sg.beginPath();sg.ellipse(64,24,62,15,0,0,Math.PI*2);sg.fill();this.shadowSprite=sh;this.buildGround();this.buildProps();this.hero=true;
 }
 resize(w,h){this.width=w;this.height=h;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.projection();}
 projection(){this.scale=(this.height<500?this.height/560:this.height/760)*this.zoom;}
 screen(x,z,y){const p=project(x,z,y),c=project(this.target.x,this.target.z);return {x:this.width*.5+(p.x-c.x)*this.scale,y:this.height*.51+(p.y-c.y)*this.scale};}
 showAim(p){this.aim=p;this.aimRing.visible=!!p;}
 buildGround(){
  const c=document.createElement('canvas');c.width=4700;c.height=3200;this.ground=c;this.origin={x:2350,y:1600};const g=c.getContext('2d');g.translate(this.origin.x,this.origin.y);
  const boundary=[];for(let x=-37;x<=37;x+=2)boundary.push(project(x,-27));for(let z=-27;z<=27;z+=2)boundary.push(project(37,z));for(let x=37;x>=-37;x-=2)boundary.push(project(x,27));for(let z=27;z>=-27;z-=2)boundary.push(project(-37,z));
  const polygon=()=>{g.beginPath();boundary.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();};
  g.save();g.translate(0,28);polygon();g.fillStyle='#806a42';g.strokeStyle='#a18a50';g.lineWidth=10;g.fill();g.stroke();g.restore();
  g.save();polygon();g.clip();g.fillStyle='#a4b669';g.fillRect(-2350,-1600,4700,3200);
  // One continuous island surface. Thickness belongs at the outer rim, never through the playfield.
  const texture=this.assets.grass,tile=640;for(let row=0,y=-1600;y<1600;y+=tile,row++)for(let col=0,x=-2350;x<2350;x+=tile,col++){g.save();g.translate(x+(col%2?tile:0),y+(row%2?tile:0));g.scale(col%2?-1:1,row%2?-1:1);g.drawImage(texture,0,0,tile+1,tile+1);g.restore();}
  const hill=project(25,-12),shade=g.createRadialGradient(hill.x,hill.y,50,hill.x,hill.y,700);shade.addColorStop(0,'#f4de9260');shade.addColorStop(1,'#ffeabc00');g.fillStyle=shade;g.fillRect(-2350,-1600,4700,3200);
  const pond=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;pond.push(project(12+8.5*Math.cos(a),19+6.4*Math.sin(a),-.1));}
  g.beginPath();pond.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.strokeStyle='#668c6388';g.lineWidth=34;g.stroke();g.strokeStyle='#d4d1a1';g.lineWidth=15;g.stroke();g.fillStyle='#78bcb9';g.fill();
  g.save();g.clip();const pc=project(12,19),water=g.createRadialGradient(pc.x,pc.y,10,pc.x,pc.y,370);water.addColorStop(0,'#b8e0c6');water.addColorStop(1,'#6cafa9');g.fillStyle=water;g.fillRect(pc.x-700,pc.y-400,1400,800);g.restore();
  const roadPaths=PATHS.map(pts=>{
   const points=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let k=0;k<n;k++)points.push(project(a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n));}points.push(project(...pts.at(-1)));return points;
  });
  // Paint all road underlays before the interiors, so intersections do not have seams.
  for(const [width,color]of [[68,'#71855155'],[61,'#b3a670'],[54,'#d1c28a'],[40,'#e0d19b66']])for(const points of roadPaths){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.lineJoin='round';g.lineCap='round';g.lineWidth=width;g.strokeStyle=color;g.stroke();}
  for(const points of roadPaths)points.forEach((p,i)=>{for(let k=0;k<5;k++){g.fillStyle=['#e8d9a43b','#b4a16a24','#ac9c6630'][k%3];const px=p.x+Math.sin(i*9+k*13)*28,py=p.y+Math.cos(i*7+k*2)*18;g.beginPath();g.ellipse(px,py,3+(i+k)%6,1.5+(k%3),i+k,0,Math.PI*2);g.fill();}});
  let seed=56;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  for(let i=0;i<600;i++){const x=rnd()*74-37,z=rnd()*54-27;if(((x-12)/9)**2+((z-19)/7)**2<1)continue;const p=project(x,z);g.strokeStyle=['#5f865642','#b7c87a60','#e7d9a840'][i%3];g.lineWidth=1.8;g.beginPath();g.moveTo(p.x-3,p.y);g.quadraticCurveTo(p.x-6,p.y-7,p.x-4,p.y-11);g.moveTo(p.x,p.y);g.quadraticCurveTo(p.x+6,p.y-5,p.x+5,p.y-9);g.stroke();}
  g.restore();
 }
 buildProps(){
  this.props=TREES.filter(([x,z])=>!(x===-32&&z===-4)).map(([x,z,s],i)=>({type:0,x,z,w:4.2*s,h:5.2*s,fade:true,id:'tree'+i}));
  for(let i=0;i<48;i++){const side=i%4,a=Math.floor(i/4),x=side<2?(side?36:-36):-34+a*6,z=side<2?-25+a*4.4:(side===2?26:-26);if(Math.abs(x)>37||Math.abs(z)>27)continue;this.props.push({type:0,x,z,w:5.8,h:7.2,fade:true,id:'edge'+i});}
  MUSHROOMS.forEach(([x,z,s],i)=>this.props.push({type:1,x,z,w:s*(i%3===0?1.85:1.4),h:s*(i%3===0?1.95:1.48),fade:true,id:'mush'+i}));
  this.props.push({type:2,x:-32,z:-5,w:6,h:6.6,fade:true,id:'house'},{type:3,x:-28,z:12,w:3.2,h:3.3,fade:true,id:'shop'},
   {type:6,...SPOTS.owl,w:2.3,h:2.8,id:'owl'},{type:7,...SPOTS.hedgehog,w:2.2,h:2.5,id:'hedgehog'},{type:8,...SPOTS.nest,w:2,h:2,id:'nest'});
 }
 tile(index,p,w,h,alpha=1,flip=false,lift=0){const im=this.sprites?.[index];if(!im)return;const fit=Math.min(w/im.width,h/im.height),dw=im.width*fit,dh=im.height*fit;this.ctx.save();this.ctx.globalAlpha=alpha;this.ctx.translate(p.x,p.y-lift);if(flip)this.ctx.scale(-1,1);this.ctx.drawImage(im,-dw/2,-dh,dw,dh);this.ctx.restore();}
 shadow(p,w,alpha=.18,lift=0){if(!this.shadowSprite)return;const squeeze=1-Math.max(0,lift)*.004;this.ctx.save();this.ctx.globalAlpha=alpha;this.ctx.drawImage(this.shadowSprite,p.x-w*squeeze,p.y-w*.25,w*2*squeeze,w*.5*squeeze);this.ctx.restore();}
 text(text,p,color='#fff5d6',size=14,bg='#365643e8'){const g=this.ctx;g.font=`600 ${size}px "Microsoft JhengHei","Noto Sans CJK TC",sans-serif`;g.textAlign='center';g.textBaseline='middle';const w=g.measureText(text).width+22;g.fillStyle=bg;g.beginPath();g.roundRect(p.x-w/2,p.y-size*.8,w,size*1.65,9);g.fill();g.fillStyle=color;g.fillText(text,p.x,p.y+.5);}
 worldCircle(p,r,color,alpha=.5,width=2){const g=this.ctx,xy=this.screen(p.x,p.z);g.save();g.globalAlpha=alpha;g.strokeStyle=color;g.fillStyle=color;g.lineWidth=width;g.beginPath();g.ellipse(xy.x,xy.y,r*BASE*this.scale,r*BASE*.7*this.scale,0,0,Math.PI*2);if(width)g.stroke();else g.fill();g.restore();}
 render(j,dt,axis,moving){
  if(this.dead||!this.assets.atlas)return;this.t+=dt;const follow=1-Math.exp(-Math.max(dt,.001)*9),look=this.focusPoint?{x:(j.player.x+this.focusPoint.x)/2,z:(j.player.z+this.focusPoint.z)/2}:j.player;this.target.x+=(look.x-this.target.x)*follow;this.target.z+=(look.z-this.target.z)*follow;
  const g=this.ctx,s=this.scale;g.setTransform(this.dpr,0,0,this.dpr,0,0);g.clearRect(0,0,this.width,this.height);const sky=g.createLinearGradient(0,0,0,this.height);sky.addColorStop(0,'#d9ece2');sky.addColorStop(1,'#f7eedb');g.fillStyle=sky;g.fillRect(0,0,this.width,this.height);
  const origin=this.screen(0,0,0);g.drawImage(this.ground,origin.x-this.origin.x*s,origin.y-this.origin.y*s,this.ground.width*s,this.ground.height*s);
  // Quiet drifting ripples and pollen bring the painted forest to life.
  for(let i=0;i<7;i++){const p=this.screen(9+(i%3)*2,17+Math.floor(i/3)*2,-.08);g.strokeStyle='#e3f2d866';g.lineWidth=1.5;g.beginPath();g.ellipse(p.x,p.y,(22+Math.sin(this.t+i)*6)*s,7*s,0,.2,2.8);g.stroke();}
  for(const f of j.fields)this.worldCircle(f,f.r,'#f3c465',.35,0);
  if(this.aim)this.worldCircle(this.aim,3.4,'#ffefb1',.9,3);
  const nearest=j.nearestEnemy();if(nearest&&j.accepted)this.worldCircle(nearest,.85,'#fff5cc',.8,2);
  for(const a of j.animals)if(a.windup>0)this.worldCircle(a,1.1,'#e3986b',.6,0);
  const hp=this.screen(j.player.x,j.player.z);this.worldCircle(j.player,.57,'#fff0b7',.7,2);
  const actors=this.props.map(p=>({...p,kind:'prop'}));
  APPLES.forEach((p,i)=>{if(!j.apples.includes(i))actors.push({...p,type:10,w:1.25,h:1.4,kind:'apple',i});});
  j.animals.forEach(a=>{if(a.anger>0||j.time-a.calmAt<2.5)actors.push({...a,type:a.type==='rabbit'?4:5,w:2.1,h:2.4,kind:'animal',animal:a});});
  j.ducks.forEach((p,i)=>actors.push({...j.escortDone?{x:18.4-i*.75,z:11.3}:p,type:8,w:1.15,h:1.25,kind:'duck',i}));
  if(j.event)actors.push({...j.rival,type:5,w:1.9,h:2.2,kind:'rival'});
  actors.push({...j.player,w:2.6,h:3.5,kind:'hero'});
  actors.sort((a,b)=>(a.x+a.z)-(b.x+b.z));
  for(const a of actors){
   const p=this.screen(a.x,a.z),w=a.w*BASE*s,h=a.h*BASE*s;
   if(p.x+w<0||p.x-w>this.width||p.y<0||p.y-h>this.height)continue;
   let alpha=1;
   if(a.fade&&a.x+a.z>j.player.x+j.player.z&&Math.abs(p.x-hp.x)<w*.43&&hp.y>p.y-h&&hp.y<p.y+15){alpha=.25;}
   const living=a.kind==='hero'||a.kind==='animal'||a.kind==='duck'||['owl','hedgehog','nest'].includes(a.id),idle=living&&!moving?Math.sin(this.t*2.4+(a.i||0))*1.6*s:0;
   this.shadow(p,w*(living ? .27 : .23),alpha*(living ? .22 : .13),Math.max(0,idle));
   if(a.kind==='hero'){
    const im=this.assets.hero;if(moving){if(Math.abs(axis.x)>Math.abs(axis.y))this.face=axis.x>0?1:3;else if(Math.hypot(axis.x,axis.y)>.1)this.face=axis.y>0?0:2;}
    const frame=moving&&Math.floor(this.t*7)%2?1:0,sw=im.width/4,sh=im.height/2;
    const hop=moving?Math.abs(Math.sin(this.t*9))*3*s:idle,breath=moving?1:1+Math.sin(this.t*2.4)*.012;
    g.save();g.globalAlpha=j.invulnerable>0?.7+.25*Math.sin(this.t*20):1;g.filter='drop-shadow(0 1px 0 #fff4c899) drop-shadow(0 2px 1px #493d2baa) drop-shadow(0 6px 6px #35452f55)';g.translate(p.x,p.y-hop);g.scale(1,breath);g.drawImage(im,(this.face||0)*sw,frame*sh,sw,sh,-w/2,-h,w,h);g.restore();
    g.fillStyle='#ffedb8';g.font=`${20*s}px serif`;g.textAlign='center';g.fillText('✦',p.x,p.y-h+8*s+Math.sin(this.t*3)*3);continue;
   }
   if(a.kind==='apple'){const bob=Math.sin(this.t*2+a.i)*4*s;this.tile(10,{x:p.x,y:p.y+bob},w,h);continue;}
   const bob=(a.kind==='animal'||a.kind==='duck')?Math.abs(Math.sin(this.t*5+(a.i||0)))*2*s:idle;
   this.tile(a.type,{x:p.x,y:p.y-bob},w,h,alpha);
   if(a.kind==='animal'&&a.animal.anger>0){const bary=p.y-h+7*s;g.textAlign='center';g.font=`${14*s}px "Arial Rounded MT Bold",sans-serif`;for(let i=0;i<3;i++){g.globalAlpha=i<a.animal.anger?1:.2;g.fillStyle=a.animal.root>0?'#e8bb58':'#d76f68';g.fillText(a.animal.root>0?'✿':'☁',p.x+(i-1)*15*s,bary);}g.globalAlpha=1;if(a.animal.root>0){g.fillStyle='#ffdc80';g.font=`${18*s}px serif`;g.fillText('❀',p.x,p.y-h*.5);}}
  }
  // NPC names are local and legible; no distant labels across the scene.
  for(const [id,name]of [['owl','貓頭鷹村長'],['hedgehog','刺蝟太太'],['nest','鴨媽媽']]){const npc=SPOTS[id];if(distance(npc,j.player)<12){const p=this.screen(npc.x,npc.z);p.y-=BASE*s*(id==='owl'?2.7:2.4);this.text(name,p,'#fff5d6',Math.max(11,13*s));}}
  for(const id of ['event','marsh','moon']){const spot=SPOTS[id],p=this.screen(spot.x,spot.z);if(distance(spot,j.player)<13){g.strokeStyle='#796441';g.lineWidth=5*s;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x,p.y-50*s);g.stroke();this.text(id==='event'?'✦ 金橡果風鈴':id==='marsh'?'泡泡泥沼 · 待開放':'月亮湖 · 待開放',{x:p.x,y:p.y-55*s},'#fff0bd',Math.max(11,12*s));}}
  if(j.event)j.event.nuts.forEach(n=>{const elapsed=30-j.event.left;if(n.taken||n.lost||elapsed<n.at)return;const p=this.screen(n.x,n.z);p.y-=Math.max(0,.8-(elapsed-n.at))*250*s;g.fillStyle='#e9b65a';g.strokeStyle='#87613a';g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y,8*s,11*s,-.3,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#806b42';g.fillRect(p.x-8*s,p.y-10*s,15*s,4*s);});
  for(const b of j.bubbles){const p=this.screen(b.x,b.z);p.y-=BASE*s;this.bubble(p,12*s,.8);}
  for(const e of j.effects)this.effect(e,j);
  for(let i=0;i<14;i++){const x=((i*181+this.t*(5+i%3))%(this.width+100))-50,y=((i*97+Math.sin(this.t*.3+i)*18)%(this.height));g.fillStyle=i%3?'#fff2be65':'#bee5c955';g.beginPath();g.arc(x,y,1.5+(i%2),0,Math.PI*2);g.fill();}
  if(this.guideEnabled)this.drawGuide(j);
 }
 bubble(p,r,alpha){const g=this.ctx;g.save();g.globalAlpha=alpha;const fill=g.createRadialGradient(p.x-r*.3,p.y-r*.4,r*.1,p.x,p.y,r);fill.addColorStop(0,'#f9fbe588');fill.addColorStop(.7,'#b9e5d34a');fill.addColorStop(1,'#a0dcdaa0');g.fillStyle=fill;g.strokeStyle='#efffe4';g.lineWidth=1.8;g.beginPath();g.arc(p.x,p.y,r,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#fffdeacc';g.beginPath();g.ellipse(p.x-r*.35,p.y-r*.4,r*.19,r*.1,-.5,0,Math.PI*2);g.fill();g.restore();}
 effect(e,j){const g=this.ctx,s=this.scale,a=1-e.life/e.max,p=this.screen(e.x,e.z);g.save();g.globalAlpha=Math.min(1,e.life*2);
  if(e.kind==='elephant'){
   const v=project(e.x+e.dir.x,e.z+e.dir.z,terrainHeight(e.x,e.z)),u=project(e.x,e.z),angle=Math.atan2(v.y-u.y,v.x-u.x);this.tile(11,p,BASE*s*4,BASE*s*4,.72,e.dir.x-e.dir.z<0);
   g.translate(p.x,p.y-BASE*s*1.6);g.rotate(angle);['#f0a1aa','#f4c77e','#f3e7a4','#a9d9ab','#92c9d9','#c0afd9'].forEach((color,i)=>{const spread=(i-2.5)*.19;g.strokeStyle=color;g.lineWidth=11*s;g.lineCap='round';g.beginPath();g.moveTo(35*s,0);g.quadraticCurveTo(150*s,-60*s+spread*100*s,360*s*Math.cos(spread),360*s*Math.sin(spread));g.stroke();});
  }else if(e.kind==='heart'){this.bubble({x:p.x,y:p.y-50*s},40*s,.5);g.fillStyle='#e896a2';g.font=`${32*s}px serif`;g.textAlign='center';g.fillText('♥',p.x,p.y-(100+a*35)*s);}
  else if(e.kind==='jar'){const d=this.screen(e.dest.x,e.dest.z);this.tile(9,{x:p.x+(d.x-p.x)*a,y:p.y+(d.y-p.y)*a-Math.sin(a*Math.PI)*110*s},50*s,60*s);}
  else if(e.kind==='music'){g.fillStyle=['#f1d29b','#b4deca','#debad9'][e.note||0];g.font=`${28*s}px serif`;g.textAlign='center';g.fillText('♪',p.x+Math.sin(a*3)*15*s,p.y-(90+a*45)*s);}
  else {for(let i=0;i<(e.kind==='celebrate'?24:9);i++){const angle=i*2.399,r=(12+a*40)*(1+i%3*.35)*s;g.fillStyle=e.kind==='bump'?'#e8aa83':e.kind==='dandelion'?'#fff6d3':'#f5db95';g.font=`${(e.kind==='celebrate'?18:12)*s}px serif`;g.textAlign='center';g.fillText(e.kind==='dandelion'?'✧':'✦',p.x+Math.cos(angle)*r,p.y-40*s+Math.sin(angle)*r-a*30*s);}}
  g.restore();
 }
 drawGuide(j){const goal=j.nextGoal?.();if(!goal)return;const p=this.screen(goal.x,goal.z),me=this.screen(j.player.x,j.player.z),dx=p.x-me.x,dy=p.y-me.y,d=Math.hypot(dx,dy);if(d<70)return;
  const length=Math.min(d-45,115*this.scale),x=me.x+dx/d*length,y=me.y+dy/d*length;const g=this.ctx;g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx));g.fillStyle='#fff0b9';g.strokeStyle='#867744';g.lineWidth=1.5;g.beginPath();g.moveTo(11,0);g.lineTo(-6,-7);g.lineTo(-3,0);g.lineTo(-6,7);g.closePath();g.fill();g.stroke();g.restore();
 }
 dispose(){this.dead=true;this.assets={};this.sprites=[];this.props=[];if(this.ground){this.ground.width=1;this.ground.height=1;this.ground=null;}this.canvas.width=1;this.canvas.height=1;}
}
