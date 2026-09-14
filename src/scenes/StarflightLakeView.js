import {drawStar125Enemy} from './StarflightSpriteFrames25.js?v=star0125';
import {LAKE_PLANS,lakePlan} from '../data/StarflightLake.js';
const hpBar=(g,e)=>{if(e.maxHp<=12)return;g.fillStyle(0x253a52,.75).fillRoundedRect(e.x-31,e.y-48,62,5,2);g.fillStyle(0xa9efff).fillRoundedRect(e.x-31,e.y-48,62*Math.max(0,e.hp/e.maxHp),5,2);};
export function drawLakeEnemy(scene,g,e,live){drawStar125Enemy(scene,e,live);hpBar(g,e);if(e.kind===18&&!e.prismBroken)g.lineStyle(2,0xc9f7ff,.35).strokeEllipse(e.x,e.y,65,90);if(e.kind===17&&e.state==='hidden')g.lineStyle(3,0xffe7a3,.65).strokeEllipse(e.x,e.y,65,15);}
export function drawLakeWorld(scene,g){
 const s=scene.session,alpha=Math.min(1,(scene.themeWeights?.crystal||0)*1.25);
 if(s.currentMap?.type==='lake'){
  g.fillStyle(0x315b86,.24*alpha).fillRect(0,300,1280,180);g.lineStyle(3,0xbdefff,.4*alpha).lineBetween(0,398,1280,398);
  for(let i=0;i<18;i++){const x=((i*91-s.time*73)%1460+1460)%1460-90,y=407+(i%4)*17;g.lineStyle(2,0xcff7ff,.18*alpha).lineBetween(x,y,x+45,y+Math.sin(i)*4);}
  for(let i=0;i<8;i++){const x=((i*205-s.time*42)%1740+1740)%1740-170,y=425+(i%3)*16;g.fillStyle(i%2?0x7fa676:0x6f9776,.48*alpha).fillEllipse(x,y,76,20);g.fillStyle(0xf0adc8,.55*alpha).fillCircle(x+8,y-9,7);}
  for(let i=0;i<9;i++){const x=((i*173-s.time*31)%1600+1600)%1600-130;g.lineStyle(4,0x527b68,.45*alpha).lineBetween(x,480,x+5,405-(i%3)*12);g.fillStyle(0x789e76,.5*alpha).fillEllipse(x-3,420-(i%3)*12,19,7);}
  const moonX=((1050-s.time*9)%1500+1500)%1500-110;g.fillStyle(0xfff4c9,.16*alpha).fillEllipse(moonX,352,125,20).fillEllipse(moonX,383,82,11);
 }
 for(const h of s.hazards){if(!h.kind.startsWith('lake'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='lakeCurrent'){g.fillStyle(0x79cae8,active?.13:.05).fillRoundedRect(h.x-h.r,25,h.r*2,420,45);for(let i=0;i<5;i++){const yy=70+i*82;g.lineStyle(3,0xa7eeff,active?.6:.28).lineBetween(h.x-45,yy,h.x+45,yy+h.dir*33);}}
  if(h.kind==='lakeWhirlpool'){for(let i=0;i<4;i++)g.lineStyle(3-i*.35,0x82d6e8,active?.62:.26).strokeEllipse(h.x,h.y,Math.max(18,h.r*2-i*38),Math.max(8,h.r*.6-i*9));if(!active)g.lineStyle(4,0xffe49d,.85).beginPath().arc(h.x,h.y,h.r*.72,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
  if(h.kind==='lakeOrb'){g.fillStyle(0xbbefff,active?.16:.08).fillCircle(h.x,h.y,h.r);g.lineStyle(3,0xf2bfe9,.75).strokeCircle(h.x,h.y,h.r);g.lineStyle(2,0xfff4c7,.6).strokeCircle(h.x-6,h.y-7,h.r*.45);}
  if(h.kind==='lakeSplash'){g.lineStyle(3,0x91def2,.65).strokeCircle(h.x,h.y,h.r*(.7+q*.45));for(let i=-2;i<=2;i++)g.lineStyle(2,0xcaf5ff,.55).lineBetween(h.x+i*9,h.y,h.x+i*13,h.y-18-q*20);}
 }
}
export function lakeCaption(s){
 if(s.currentMap?.type!=='lake'||s.inTransit)return '';
 const t=s.phaseInfo.elapsed,phase=t<11?'水面巡航':t<26?'伏擊與折光':t<40?'菁英漩渦':'月露終航';
 return LAKE_PLANS[lakePlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(48,Math.floor(t))+' / 48 秒';
}
