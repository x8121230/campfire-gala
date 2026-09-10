import {PaperForestWorld,project} from '../paper-forest/PaperForestWorld.js';
import {keyedCanvas} from '../paper-forest/PaperArt.js';
import {AREAS,ISLANDS,PADS,REEDS,FOREST_APPLES,MUD,ENEMIES,ICE,dist} from './AdventureData.js';
const BASE=47;
export class AdventureWorld extends PaperForestWorld{
 async load(){await super.load();if(this.dead)return;this.forestGround=this.ground;this.forestOrigin=this.origin;this.forestProps=this.props;const im=await new Promise((resolve,reject)=>{const a=new Image();a.onload=()=>resolve(a);a.onerror=reject;a.src=new URL('../../assets/moon-lake/moon-atlas.png',import.meta.url).href;});if(this.dead)return;
  const crops=[[0,0,365,362],[380,0,368,362],[753,0,334,360],[1090,0,358,362],[0,370,361,340],[365,370,355,340],[726,363,362,372],[1090,363,358,372],[0,718,361,368],[365,729,359,357],[728,751,355,311],[1090,736,358,350]];
  this.moonSprites=crops.map(r=>keyedCanvas(im,r));this.buildMoon();this.setArea('moon');
 }
 screen(x,z,y){if(this.area!=='moon')return super.screen(x,z,y);const p=project(x,z,y??0),c=project(this.target.x,this.target.z,0);return {x:this.width*.5+(p.x-c.x)*this.scale,y:this.height*.51+(p.y-c.y)*this.scale};}
 setArea(area){this.area=area;this.ground=area==='moon'?this.moonGround:this.forestGround;this.origin=area==='moon'?this.moonOrigin:this.forestOrigin;this.target.x=AREAS[area].spawn.x;this.target.z=AREAS[area].spawn.z;this.focusPoint=null;}
 buildMoon(){const c=document.createElement('canvas');c.width=3300;c.height=2400;this.moonGround=c;this.moonOrigin={x:1650,y:1200};const g=c.getContext('2d');g.translate(1650,1200);
  for(const a of ISLANDS){const pts=Array.from({length:129},(_,i)=>{const t=i/128*Math.PI*2;return project(a.x+a.rx*Math.cos(t),a.z+a.rz*Math.sin(t),0);});const poly=()=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();};
   g.save();g.translate(0,12);poly();g.fillStyle='#182e47';g.lineWidth=9;g.strokeStyle='#52818e';g.fill();g.stroke();g.restore();
   g.save();poly();g.clip();g.fillStyle='#397172';g.fillRect(-1650,-1200,3300,2400);
   for(let y=-1200;y<1200;y+=500)for(let x=-1650;x<1650;x+=500){g.globalAlpha=.65;g.drawImage(this.assets.grass,x,y,501,501);}g.globalAlpha=1;g.globalCompositeOperation='multiply';g.fillStyle='#48709b';g.fillRect(-1650,-1200,3300,2400);g.globalCompositeOperation='source-over';g.fillStyle='#21366a30';g.fillRect(-1650,-1200,3300,2400);
   const center=project(a.x,a.z,0),glow=g.createRadialGradient(center.x,center.y,10,center.x,center.y,650);glow.addColorStop(0,'#b4debc38');glow.addColorStop(1,'#141e5360');g.fillStyle=glow;g.fillRect(-1650,-1200,3300,2400);g.restore();poly();g.strokeStyle='#7ec5b17a';g.lineWidth=9;g.stroke();
   for(let i=0;i<330;i++){const t=i/330*Math.PI*2,inset=.2+(i%7)*.055,p=project(a.x+(a.rx-inset)*Math.cos(t),a.z+(a.rz-inset)*Math.sin(t),0);g.strokeStyle=i%3?'#477f83':'#8dbab1';g.lineWidth=2;g.beginPath();g.moveTo(p.x,p.y);g.quadraticCurveTo(p.x-8,p.y-9,p.x-3,p.y-8-i%10);g.moveTo(p.x+3,p.y);g.lineTo(p.x+9,p.y-6-i%7);g.stroke();}
  }
  const roads=[[[-19,10],[-17,3],[-13,0],[-8,-2],[-3,-2]],[[-13,0],[-12,-7]],[ [6,-2],[10,-3],[13,-3] ]];
  const curve=road=>{const points=road.map(([x,z])=>project(x,z,0));g.beginPath();g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length-1;i++){const a=points[i],b=points[i+1];g.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}g.lineTo(points.at(-1).x,points.at(-1).y);};
  for(const [width,color]of [[60,'#355c6644'],[53,'#687b8488'],[42,'#a4ad9b77'],[30,'#b8b7a033']])for(const road of roads){curve(road);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();}
  let seed=72;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(const a of ISLANDS)for(let i=0;i<300;i++){const x=a.x+(rand()-.5)*a.rx*1.8,z=a.z+(rand()-.5)*a.rz*1.8;if(((x-a.x)/a.rx)**2+((z-a.z)/a.rz)**2>.85)continue;const p=project(x,z,0);g.fillStyle=i%3?'#70a4ab38':'#b0d6c961';g.beginPath();g.ellipse(p.x,p.y,1.2+rand()*3,1+rand()*1.5,0,0,Math.PI*2);g.fill();}
 }
 moonTile(index,p,w,h,alpha=1){const old=this.sprites;this.sprites=this.moonSprites;this.tile(index,p,w,h,alpha);this.sprites=old;}
 render(j,dt,axis,moving){if(this.dead||!this.moonSprites)return;if(this.area!==j.area)this.setArea(j.area);this.t+=dt;const follow=1-Math.exp(-Math.max(dt,.001)*8),look=this.focusPoint?{x:(j.player.x+this.focusPoint.x)/2,z:(j.player.z+this.focusPoint.z)/2}:j.player;this.target.x+=(look.x-this.target.x)*follow;this.target.z+=(look.z-this.target.z)*follow;
  const g=this.ctx,s=this.scale,moon=j.area==='moon';g.setTransform(this.dpr,0,0,this.dpr,0,0);const bg=g.createLinearGradient(0,0,0,this.height);bg.addColorStop(0,moon?'#111c42':'#daece4');bg.addColorStop(1,moon?'#234d68':'#f5edda');g.fillStyle=bg;g.fillRect(0,0,this.width,this.height);
  if(moon){for(let i=0;i<85;i++){const x=(i*193.3+Math.sin(this.t*.12+i)*11)%(this.width+80)-40,y=(i*91.7+this.t*1.3)%(this.height+40)-20;g.globalAlpha=.22+.19*Math.sin(this.t*.5+i);g.fillStyle='#a8f2ef';g.beginPath();g.ellipse(x,y,1.2+i%2,.6+i%2*.35,0,0,Math.PI*2);g.fill();}g.globalAlpha=1;for(let i=0;i<12;i++){const p=this.screen(-25+(i*7)%50,-16+(i*11)%34);g.strokeStyle='#73b6da25';g.lineWidth=1.5;g.beginPath();g.ellipse(p.x,p.y,(40+Math.sin(this.t*.6+i)*10)*s,12*s,0,.2,2.8);g.stroke();}}
  const o=this.screen(0,0,0);g.drawImage(this.ground,o.x-this.origin.x*s,o.y-this.origin.y*s,this.ground.width*s,this.ground.height*s);
  if(moon){if(j.ice){g.beginPath();ICE.forEach((p,i)=>{const q=this.screen(p.x,p.z);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.strokeStyle='#a3e9f4b0';g.lineWidth=68*s;g.lineCap='round';g.stroke();g.strokeStyle='#eeffefa0';g.lineWidth=3*s;g.stroke();}
   for(const pad of PADS){const seen=!pad.hidden||j.revealed.includes(pad.id),p=this.screen(pad.x,pad.z);if(seen){this.worldCircle(pad,pad.r,'#6ef0da',.12,0);this.moonTile(10,{x:p.x,y:p.y+43*s},150*s,95*s);if(j.stepped.includes(pad.id))this.text('✦',{x:p.x,y:p.y},'#fff0b4',12,'#225f6266');}else{g.fillStyle='#b3eaf44d';g.font=`${17*s}px serif`;g.fillText('·  ·  ·',p.x,p.y);}}
  }
  for(const f of j.fields)this.worldCircle(f,f.r,f.kind==='honey'?'#ffc862':f.kind==='mud'?'#c89c9a':'#cdabc9',.35,0);if(this.aim){this.worldCircle(this.aim,1.7,'#ffecad',.6,3);const a=this.screen(j.player.x,j.player.z),b=this.screen(this.aim.x,this.aim.z);g.strokeStyle='#ffefb280';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.setLineDash([]);}
  for(const a of j.animals){if(!a.action)continue;const ac=a.action;if(['dash','hop','basic','fan'].includes(ac.kind)){const p=this.screen(a.x,a.z),q=this.screen(ac.target.x,ac.target.z);g.strokeStyle='#ffc190b0';g.lineWidth=(ac.kind==='dash'?38:12)*s;g.setLineDash([10*s,8*s]);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();g.setLineDash([]);}this.worldCircle(ac.kind==='mud'?ac.target:a,ac.kind==='tornado'?3:ac.kind==='mud'?1.8:1,'#ffb88b',.3+.3*(1-ac.left/ac.total),3);}
  const actors=moon?REEDS.map(p=>({...p,moon:8,w:2.4,h:2.9,kind:'reed'})):this.forestProps.filter(p=>!['owl','hedgehog','nest'].includes(p.id)).map(p=>({...p,kind:'prop'}));
  if(moon){[[-20,-7],[-18,-11],[-21,3],[-8,-11],[12,-11],[18,-7],[17,3]].forEach(([x,z],i)=>actors.push({x,z,moon:11,w:5,h:5.5,fade:true,kind:'prop'}));[[-22,9],[-4,9],[4,-7],[21,-1]].forEach(([x,z])=>actors.push({x,z,moon:9,w:1.6,h:2,kind:'jelly'}));}
  else{FOREST_APPLES.filter(p=>!j.apples.includes(p.id)).forEach(p=>actors.push({...p,type:10,w:1.15,h:1.4,kind:'apple'}));for(const p of MUD)if(!j.clean.includes(p.id)){this.worldCircle(p,.9,'#9a7180',.7,0);}j.ducks.forEach((p,i)=>actors.push({...j.ducksDone?{x:18.4-i*.6,z:10.8}:p,type:8,w:1,h:1.2,kind:'duck'}));actors.push({x:-25,z:9,type:7,w:2.1,h:2.4,kind:'friend',label:'刺蝟太太'});}
  if(!moon)actors.push({x:19,z:10,type:8,w:1.8,h:2,kind:'friend'});
  actors.push({...AREAS[j.area].npc,...moon?{moon:9}:{type:6},w:2.1,h:2.7,kind:'npc'});
  for(const a of j.animals){const indexes={capy:[0,1],otter:[2,3],frog:[4,5],swan:[6,7]},idx=indexes[a.type],sz=a.type==='swan'?3.8:a.type==='capy'?2.3:1.9;actors.push({...a,...idx?{moon:idx[a.hp>0?0:1]}:{type:a.type==='rabbit'?4:5},w:sz,h:sz*1.2,kind:'animal',animal:a});}
  if(j.event)actors.push({...j.event.rival,type:5,w:1.8,h:2.2,kind:'friend'});
  actors.push({...j.player,w:2.4,h:3.3,kind:'hero'});actors.sort((a,b)=>(a.x+a.z)-(b.x+b.z));const me=this.screen(j.player.x,j.player.z);
  for(const a of actors){const p=this.screen(a.x,a.z),w=a.w*BASE*s,h=a.h*BASE*s;if(p.x+w<0||p.x-w>this.width||p.y<0||p.y-h>this.height)continue;let alpha=a.fade&&a.x+a.z>j.player.x+j.player.z&&Math.abs(p.x-me.x)<w*.4&&me.y>p.y-h&&me.y<p.y+12?.3:1;const bob=Math.sin(this.t*2.4+a.x)*2*s;this.shadow(p,w*.25,.27*alpha);
   if(a.kind==='hero'){if(moving){if(Math.abs(axis.x)>Math.abs(axis.y))this.face=axis.x>0?1:3;else this.face=axis.y>0?0:2;}const im=this.assets.hero,sw=im.width/4,sh=im.height/2,frame=moving&&Math.floor(this.t*7)%2?1:0;g.save();g.globalAlpha=j.invulnerable>0?.65+Math.sin(this.t*20)*.25:1;g.drawImage(im,(this.face||0)*sw,frame*sh,sw,sh,p.x-w/2,p.y-h-(moving?Math.abs(Math.sin(this.t*9))*3*s:bob),w,h);g.restore();continue;}
   const pp={x:p.x,y:p.y-(['jelly','npc','animal','friend'].includes(a.kind)?bob:0)};
   if(a.moon!==undefined)this.moonTile(a.moon,pp,w,h,alpha);else this.tile(a.type,pp,w,h,alpha);
   if(a.kind==='reed'&&j.time-(j.reedAt[a.id]??-10)<2)this.worldCircle(a,1,'#b7ffe0',.2,0);
   if(a.kind==='animal'){const e=a.animal;if(e.type==='capy'){const im=this.moonSprites[a.moon],dh=im.height*Math.min(w/im.width,h/im.height),oy=p.y-dh*.85-6*s;g.fillStyle='#f6a143';g.strokeStyle='#8e5a36';g.lineWidth=1.5;g.beginPath();g.arc(p.x+16*s,oy,8*s,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#a6c884';g.beginPath();g.ellipse(p.x+21*s,oy-8*s,6*s,2.6*s,-.4,0,Math.PI*2);g.fill();if(e.hp>0){this.worldCircle(e,.8,'#ad90cc',.15,0);}}
    if(e.hp>0){const barw=Math.max(38,50*s),y=p.y-h-7*s;g.fillStyle='#382344bb';g.beginPath();g.roundRect(p.x-barw/2,y,barw,6,3);g.fill();g.fillStyle=e.root>0?'#ffd477':'#dfa0b6';g.beginPath();g.roundRect(p.x-barw/2,y,barw*e.hp/ENEMIES[e.type].hp,6,3);g.fill();if(dist(e,j.player)<6)this.text(ENEMIES[e.type].name,{x:p.x,y:y-14},'#ffe9e5',Math.max(10,12*s),'#293653db');}
    else if(e.type==='capy'){g.fillStyle='#cdf6ef';g.font=`${15*s}px serif`;g.fillText('z Z',p.x,p.y-h-5*s);}
   }
   if(a.kind==='npc')this.text(AREAS[j.area].npc.name,{x:p.x,y:p.y-h-12*s},'#fff0c5',Math.max(12,14*s),moon?'#233d62ee':'#355c4bee');
  }
  const portal=AREAS[j.area].portal,p=this.screen(portal.x,portal.z);this.worldCircle(portal,1.3,'#bcebd1',.35,2);this.text('↗ '+portal.name,{x:p.x,y:p.y-25*s},'#ffefc7',Math.max(11,13*s));
  for(const b of j.shots){const p=this.screen(b.x,b.z);p.y-=30*s;if(b.friend)this.bubble(p,11*s,.9);else{g.fillStyle='#a8deef';g.beginPath();g.arc(p.x,p.y,8*s,0,Math.PI*2);g.fill();}}
  if(!moon){const p=this.screen(-7,-8);this.text('✦ 金橡果風鈴',{x:p.x,y:p.y-35*s},'#fff1b2',Math.max(11,12*s));}
  if(j.event)for(const n of j.event.nuts){const age=30-j.event.left-n.at;if(n.taken||n.lost||age<0)continue;const p=this.screen(n.x,n.z);p.y-=Math.max(0,.6-age)*180*s;g.fillStyle='#efc96d';g.strokeStyle='#86623f';g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y,8*s,11*s,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#927041';g.fillRect(p.x-8*s,p.y-10*s,16*s,4*s);}
  for(const e of j.effects)this.effect(e,j);for(const f of j.fields)if(f.kind==='tornado'){const p=this.screen(f.x,f.z);g.strokeStyle='#e4c3d5aa';g.lineWidth=7*s;for(let i=0;i<4;i++){g.beginPath();g.ellipse(p.x+Math.sin(this.t*12+i)*7*s,p.y-i*20*s,(35+i*12)*s,10*s,0,0,Math.PI*2);g.stroke();}}
  this.drawGuide(j);
 }
 dispose(){super.dispose();for(const c of [this.moonGround,this.forestGround])if(c){c.width=1;c.height=1;}this.moonSprites=[];}
}
