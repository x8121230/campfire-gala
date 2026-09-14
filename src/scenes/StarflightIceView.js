import {ICE_PLANS,icePlan} from '../data/StarflightIce.js';

const ICE_FRAMES={24:'iceRabbit',25:'iceSwan',26:'iceLeopard',27:'icePinecone'};
const ICE_SIZES={24:126,25:142,26:154,27:88};
const snowflake=(g,x,y,r,color=0xdaf8ff,alpha=.9,width=2)=>{g.lineStyle(width,color,alpha);for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*r,dy=Math.sin(a)*r;g.lineBetween(x-dx,y-dy,x+dx,y+dy);}};
const bar=(g,e)=>{if(e.maxHp<=14)return;g.fillStyle(0x28445b,.84).fillRoundedRect(e.x-40,e.y-63,80,6,3);g.fillStyle(0xbcefff).fillRoundedRect(e.x-40,e.y-63,80*Math.max(0,e.hp/e.maxHp),6,3);};

export function registerIceFrames(scene){
 const t=scene.textures.get('star_ice_enemies'),im=t.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);
 [['iceRabbit',0,0],['iceSwan',1,0],['iceLeopard',0,1],['icePinecone',1,1]].forEach(([name,col,row])=>{if(!t.has(name))t.add(name,0,col*w,row*h,w,h);});
}

export function drawIceEnemy(scene,g,e,live){
 const id='ice-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star_ice_enemies',ICE_FRAMES[e.kind]||'icePinecone');scene.entities.add(v);scene.views.set(id,v);}
 live.add(id);const bob=scene.reducedFX?0:Math.sin(scene.session.time*(e.kind===27?7:3)+e.id)*3,pulse=scene.reducedFX?1:1+Math.sin(e.age*(e.kind===25?5:3))*.025,width=ICE_SIZES[e.kind]*pulse;
 v.setPosition(e.x,e.y+bob).setDisplaySize(width,width*v.frame.height/v.frame.width/1.27).setRotation(e.kind===27?(e.rotation||0):e.kind===25?Math.sin(e.spin||0)*.04:0);
 if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();
 if(e.kind===24&&e.snowShield>0){const r=43+Math.min(26,e.snowShield*.7);g.fillStyle(0xd9faff,.1).fillCircle(e.x-20,e.y+19,r);g.lineStyle(5,0xd9faff,.58+(e.shieldFlash||0)*2).strokeCircle(e.x-20,e.y+19,r);for(let i=0;i<4;i++)snowflake(g,e.x-20+Math.cos(i*Math.PI/2)*r,e.y+19+Math.sin(i*Math.PI/2)*r,6,0xffffff,.78,2);}
 if(e.kind===25){const charge=e.fireCD<.65&&e.fireCD>0;if(charge){const q=1-e.fireCD/.65;snowflake(g,e.x,e.y,50+q*28,0xfff0b3,.75+q*.2,4);g.fillStyle(0xffefb0,.1+q*.15).fillCircle(e.x,e.y,42+q*18);}g.lineStyle(2,0xc9f6ff,.4).strokeEllipse(e.x,e.y+31,74,22);}
 if(e.kind===26&&e.fireCD<.7&&e.fireCD>0){g.lineStyle(5,0xffe7a9,.85).strokeCircle(e.x-47,e.y+28,24+(1-e.fireCD/.7)*16);for(let i=0;i<4;i++)g.fillStyle(0xb9eeff,.7).fillCircle(e.x-47+Math.cos(i*Math.PI/2)*31,e.y+28+Math.sin(i*Math.PI/2)*31,5);}
 if(e.kind===27){g.fillStyle(0xe8fbff,.12).fillCircle(e.x,e.y,31);g.lineStyle(2,0xdffcff,.65).strokeCircle(e.x,e.y,27);}
 bar(g,e);
}

export function drawIceWorld(scene,g){
 const s=scene.session;
 if(s.currentMap?.type==='ice')for(let i=0;i<24;i++){const x=((i*79-s.time*(40+i%4*13))%1430+1430)%1430-70,y=20+(i*71)%425,r=2+i%3;g.fillStyle(0xffffff,.38+i%2*.18).fillCircle(x,y,r);}
 for(const h of s.hazards){if(!h.kind.startsWith('ice'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='iceGust'){const glow=active?.18:.07;g.fillStyle(0xaeeaff,glow).fillRoundedRect(h.x-h.r,18,h.r*2,427,50);g.lineStyle(3,0x75ccec,.5).strokeRoundedRect(h.x-h.r,18,h.r*2,427,50);for(let i=0;i<6;i++){const y=55+i*72,shift=Math.sin(s.time*5+i)*25;g.lineStyle(active?6:3,0xeafbff,active?.78:.35).beginPath().moveTo(h.x-62,y).lineTo(h.x+shift,y+h.dir*20).lineTo(h.x+62,y).strokePath();}g.fillStyle(0xd5f8ff,.2).fillCircle(h.x,h.y,55);}
  if(h.kind==='iceYarn'){const end=h.x+(h.ropeLength||245),wave=active?Math.sin(s.time*12)*4:0;g.lineStyle(active?12:5,0x5e91b5,active?.18:.1).lineBetween(h.x,h.y,end,h.y+wave);g.lineStyle(active?7:3,0xa7e2ff,active?.9:.42).lineBetween(h.x,h.y,end,h.y+wave);g.fillStyle(0x91cde9,.95).fillCircle(h.x,h.y,h.r+3);for(let i=0;i<5;i++)g.lineStyle(2,i%2?0xffffff:0x6aa8cc,.7).strokeCircle(h.x,h.y,4+i*4);for(let i=1;i<4;i++){const x=h.x+(end-h.x)*i/4;g.fillStyle(0xffe3a2,.9).fillCircle(x,h.y+wave*i/4,6);g.lineStyle(2,0x9c7a42).strokeCircle(x,h.y+wave*i/4,7);}if(!active)g.lineStyle(5,0xffe5a4,.95).beginPath().arc(h.x,h.y,h.r+10,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
  if(h.kind==='iceShard'){
   if(!active){const tx=h.x+(h.drift||0)*1.2;g.fillStyle(0xffd66e,.1+q*.18).fillEllipse(tx,448,62+q*40,18+q*8);g.lineStyle(5,0xffe19d,.45+q*.5).lineBetween(h.x,0,tx,448);g.lineStyle(3,0xff8f8f,.75).strokeCircle(tx,442,22+q*15);snowflake(g,h.x,25,13+q*8,0xeaffff,.8,3);
   }else{const trail=Math.min(120,Math.abs(h.vy||350)*.18);g.fillStyle(0xbdeeff,.14).fillEllipse(h.x-(h.drift||0)*.05,h.y-trail*.4,h.r*1.8,trail);g.fillStyle(0xbdeeff,.96).fillTriangle(h.x-h.r,h.y-h.r,h.x+h.r,h.y-h.r,h.x,h.y+h.r*1.8);g.fillStyle(0xe9fdff,.58).fillTriangle(h.x-h.r*.35,h.y-h.r*.7,h.x+h.r*.2,h.y-h.r*.65,h.x,h.y+h.r*1.2);g.lineStyle(3,0xffffff,.9).lineBetween(h.x-5,h.y-h.r+4,h.x,h.y+h.r);}}
 }
}

export function iceCaption(s){if(s.currentMap?.type!=='ice'||s.inTransit)return '';const t=s.phaseInfo.elapsed,phase=t<11?'霜糖滑行':t<26?'雪球與八音盒':t<40?'毛線束縛':'極光終航';return ICE_PLANS[icePlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(48,Math.floor(t))+' / 48 秒';}
