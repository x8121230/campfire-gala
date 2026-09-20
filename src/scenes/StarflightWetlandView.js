import {mushroomPose27} from './StarflightOwlFrames27.js?v=star0127';
import {WETLAND_PLANS,wetlandPlan} from '../data/StarflightWetland.js';

const FRAMES={28:'wetMushroom',29:'wetFrog',30:'wetLadybug',31:'wetHermit'};
const SIZES={28:118,29:145,30:108,31:158};
const bar=(g,e)=>{if(e.maxHp<=20)return;g.fillStyle(0x203d38,.84).fillRoundedRect(e.x-41,e.y-65,82,6,3);g.fillStyle(e.kind===31?0xffd5a1:0xa9f2c3).fillRoundedRect(e.x-41,e.y-65,82*Math.max(0,e.hp/e.maxHp),6,3);};

export function registerWetlandFrames(scene){const t=scene.textures.get('star_wetland_enemies'),im=t.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);[['wetMushroom',0,0],['wetFrog',1,0],['wetLadybug',0,1],['wetHermit',1,1]].forEach(([name,col,row])=>{if(!t.has(name))t.add(name,0,col*w,row*h,w,h);});}

export function drawWetlandEnemy(scene,g,e,live){
 const id='wetland-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star_wetland_enemies',FRAMES[e.kind]||'wetMushroom');scene.entities.add(v);scene.views.set(id,v);}
 live.add(id);if(e.kind===28)v.setTexture('star127_mushroom',mushroomPose27(e));const bob=scene.reducedFX?0:Math.sin(scene.session.time*(e.kind===30?5:3)+e.id)*3,pulse=scene.reducedFX?1:1+Math.sin(e.age*(e.kind===28?6:2.5))*.025,width=SIZES[e.kind]*pulse;
 v.setPosition(e.x,e.y+bob).setDisplaySize(width,width*v.frame.height/v.frame.width/1.27).setRotation(e.kind===30?Math.sin(e.age*5)*.08:e.kind===28?Math.sin(e.age*3)*.035:0);
 if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();
 if(e.kind===28){for(let i=0;i<4;i++){const a=e.age*1.2+i*Math.PI/2;g.fillStyle(i%2?0xd8b8ff:0xb1f4d0,.45).fillCircle(e.x+Math.cos(a)*35,e.y+26+Math.sin(a)*13,4+i%2*2);}}
 if(e.kind===29&&e.fireCD<.75&&e.fireCD>0){const q=1-e.fireCD/.75;g.lineStyle(4,0xffe39a,.65+q*.3).strokeCircle(e.x-25,e.y+24,18+q*25);for(let i=0;i<3;i++){const a=i*Math.PI*2/3+e.age*3;g.fillStyle(0xd7ffca,.75).fillCircle(e.x+Math.cos(a)*(35+q*15),e.y+Math.sin(a)*(29+q*12),5);}}
 if(e.kind===30){const flash=e.prismFlash||0;g.fillStyle(0xb8fff0,.1+flash*.35).fillCircle(e.x+21,e.y-4,37+flash*35);g.lineStyle(4,flash>0?0xffef9d:0xc9fff2,.48+flash).strokeCircle(e.x+21,e.y-4,31+flash*25);if(flash>0)for(let i=0;i<6;i++){const a=i*Math.PI/3;g.lineStyle(3,[0xffa8cf,0x9cecff,0xffefa9][i%3],flash*3).lineBetween(e.x+21,e.y-4,e.x+21+Math.cos(a)*75,e.y-4+Math.sin(a)*75);}}
 if(e.kind===31&&e.fireCD<.8&&e.fireCD>0){const q=1-e.fireCD/.8;g.fillStyle(0xffe19a,.12+q*.15).fillEllipse(e.x+12,e.y-42,55+q*30,70+q*35);for(let i=0;i<5;i++)g.fillStyle(0xe8c6ff,.45).fillCircle(e.x-10+i*12,e.y-60-i%2*8,4+i%2);}
 bar(g,e);
}

export function drawWetlandWorld(scene,g){
 const s=scene.session;if(s.currentMap?.type==='wetland'){for(let i=0;i<18;i++){const x=((i*97-s.time*(18+i%3*7))%1450+1450)%1450-80,y=35+(i*79)%395;g.fillStyle(i%2?0xc4ffbf:0xffe395,.3+i%3*.1).fillCircle(x,y,2+i%3);}}
 for(const h of s.hazards){if(!h.kind.startsWith('wetland'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='wetlandPoison'){const wobble=Math.sin(s.time*5)*5;g.fillStyle(0x80569a,active?.18:.07).fillEllipse(h.x,h.y,h.r*2.1+wobble,h.r*1.45);g.fillStyle(0xb989cc,active?.13:.05).fillCircle(h.x-25,h.y-13,h.r*.55).fillCircle(h.x+27,h.y+8,h.r*.65);g.lineStyle(active?4:2,0xd6a8e4,active?.65:.3).strokeEllipse(h.x,h.y,h.r*2,h.r*1.35);for(let i=0;i<6;i++)g.fillStyle(0xe5c4ef,.45).fillCircle(h.x-45+i*18,h.y-22-(i%2)*13,3+i%3);if(!active)g.lineStyle(5,0xffe5a4,.95).beginPath().arc(h.x,h.y,h.r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
  if(h.kind==='wetlandCurrent'){g.fillStyle(0x68b897,active?.14:.06).fillRoundedRect(h.x-h.r,18,h.r*2,427,55);g.lineStyle(3,0xa8efbe,.45).strokeRoundedRect(h.x-h.r,18,h.r*2,427,55);for(let i=0;i<6;i++){const y=58+i*71,shift=Math.sin(s.time*4+i)*20;g.lineStyle(active?5:3,0xc6ffd3,active?.7:.3).beginPath().moveTo(h.x-55,y).lineTo(h.x+shift,y+h.dir*22).lineTo(h.x+55,y).strokePath();}}
  if(h.kind==='wetlandSound'){const r=h.currentRadius||h.r;g.fillStyle(0x9edfc2,.035).fillCircle(h.x,h.y,r);g.lineStyle(active?8:4,0xb8ffd4,active?.7:.3).strokeCircle(h.x,h.y,r);g.lineStyle(3,0xffe6a3,.55).strokeCircle(h.x,h.y,r+16);g.lineStyle(2,0xdfc2ff,.4).strokeCircle(h.x,h.y,Math.max(5,r-16));}
  if(h.kind==='wetlandPollen'){const pulse=1+Math.sin(s.time*6+(h.phase||0))*.08,r=h.r*pulse;g.fillStyle(0xe5b8f1,active?.22:.08).fillCircle(h.x,h.y,r+10);g.fillStyle(0xc8efab,active?.42:.18).fillCircle(h.x,h.y,r);g.lineStyle(3,0xffedb2,active?.72:.32).strokeCircle(h.x,h.y,r+4);for(let i=0;i<5;i++){const a=i*Math.PI*2/5+s.time;g.fillStyle(0xfff1b8,.65).fillCircle(h.x+Math.cos(a)*r*.58,h.y+Math.sin(a)*r*.58,3);}if(!active)g.lineStyle(4,0xffd89a,.9).beginPath().arc(h.x,h.y,r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
 }
}

export function wetlandCaption(s){if(s.currentMap?.type!=='wetland'||s.inTransit)return '';const t=s.phaseInfo.elapsed,phase=t<11?'風鈴孢子':t<26?'露珠與琴音':t<40?'花粉茶會':'螢火出口';return WETLAND_PLANS[wetlandPlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(48,Math.floor(t))+' / 48 秒';}
