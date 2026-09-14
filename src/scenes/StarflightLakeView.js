import {LAKE_PLANS,lakePlan} from '../data/StarflightLake.js';
const hpBar=(g,e)=>{if(e.maxHp<=12)return;g.fillStyle(0x253a52,.75).fillRoundedRect(e.x-31,e.y-48,62,5,2);g.fillStyle(0xa9efff).fillRoundedRect(e.x-31,e.y-48,62*Math.max(0,e.hp/e.maxHp),5,2);};
export function drawLakeEnemy(scene,g,e){
 const x=e.x,y=e.y,white=e.flash>0,c=n=>white?0xffffff:n;g.save().translateCanvas(x,y);
 if(e.kind===16){
  g.fillStyle(c(0xffe7a1)).fillTriangle(-31,5,31,5,0,24).fillTriangle(-25,3,5,-18,27,3);g.lineStyle(2,c(0x856c76),.85).strokeTriangle(-31,5,31,5,0,24).lineBetween(4,-18,4,5);g.fillStyle(c(0xfff5ca)).fillCircle(5,-23,6);
 }else if(e.kind===17){
  const hidden=e.state==='hidden';g.fillStyle(c(0x729f7a),.95).fillEllipse(0,hidden?8:18,76,18);g.lineStyle(2,c(0xd995ad)).strokeEllipse(0,hidden?8:18,76,18);g.fillStyle(c(0xf3b7cf)).fillCircle(4,hidden?-2:-21,16);
  if(!hidden){g.fillStyle(c(0x668f76)).fillEllipse(0,0,45,34).fillCircle(-13,-15,13).fillCircle(13,-15,13);g.fillStyle(c(0xf6f1d2)).fillCircle(-13,-17,5).fillCircle(13,-17,5);g.fillStyle(c(0x334b55)).fillCircle(-13,-17,2).fillCircle(13,-17,2);}
 }else if(e.kind===18){
  g.fillStyle(c(0x8ddff0),.68).fillEllipse(0,0,45,73);g.lineStyle(3,c(0xf6c7ef),.9).strokeEllipse(0,0,48,76);g.fillStyle(c(0xffd7a8)).fillCircle(6,-27,15).fillTriangle(-4,28,18,22,5,44);g.fillStyle(c(0x5d667f)).fillCircle(11,-30,3);for(let i=0;i<4;i++)g.fillStyle(c(i%2?0x99e3ff:0xffc8ea),.8).fillCircle(-23-i*4,-18+i*15,8-i);
  if(!e.prismBroken)g.lineStyle(3,0xc9f7ff,.65).strokeCircle(0,0,42);
 }else{
  g.fillStyle(c(0xf8f1df)).fillEllipse(0,4,72,57);g.lineStyle(4,c(0x315e86),.9).strokeEllipse(0,4,72,57).lineBetween(25,-5,48,-14).strokeCircle(50,-14,9);g.fillStyle(c(0x7fd7ed),.75).fillCircle(-4,-4,19).fillCircle(-15,13,12);g.fillStyle(c(0xffd686)).fillCircle(-9,-5,5).fillCircle(8,8,4);g.lineStyle(3,c(0x9adff1),.7).lineBetween(-30,22,-42,38).lineBetween(-17,28,-24,45);
 }
 g.restore();hpBar(g,e);
 if(e.kind===17&&e.state==='hidden'){const q=Math.max(0,Math.min(1,1-e.charge/1.45));g.lineStyle(4,0xffe7a3,.4+q*.5).strokeCircle(e.x,e.y,32+q*14);}
 if(e.kind===19&&e.fireCD<.7&&e.fireCD>0)g.lineStyle(4,0x8feaff,.75).strokeCircle(e.x,e.y,48+(1-e.fireCD/.7)*20);
}
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
