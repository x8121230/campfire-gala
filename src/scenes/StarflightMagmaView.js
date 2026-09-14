import {MAGMA_PLANS,magmaPlan} from '../data/StarflightMagma.js?v=star0123';

const FRAMES={32:'magmaSlime',33:'magmaSalamander',34:'magmaTanuki',35:'magmaPopbird'};
const SIZES={32:112,33:176,34:190,35:94};
const bar=(g,e)=>{if(e.maxHp<=25)return;g.fillStyle(0x4b2d35,.86).fillRoundedRect(e.x-44,e.y-72,88,6,3);g.fillStyle(e.kind===33?0xffc77d:0xffe09c).fillRoundedRect(e.x-44,e.y-72,88*Math.max(0,e.hp/e.maxHp),6,3);};

export function registerMagmaFrames(scene){const t=scene.textures.get('star_magma_enemies'),im=t.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);[['magmaSlime',0,0],['magmaSalamander',1,0],['magmaTanuki',0,1],['magmaPopbird',1,1]].forEach(([name,col,row])=>{if(!t.has(name))t.add(name,0,col*w,row*h,w,h);});}

export function drawMagmaEnemy(scene,g,e,live){
 const id='magma-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,e.kind===34?'star123_tanuki':e.kind===35?'star123_popbird':'star_magma_enemies',e.kind>=34?0:FRAMES[e.kind]||'magmaSlime');scene.entities.add(v);scene.views.set(id,v);}live.add(id);
 if(e.kind===35){const frame=Math.floor(e.age*10)%4,anchors=[[.39,.65],[.40,.65],[.39,.59],[.39,.59]];v.setFrame(frame).setOrigin(...anchors[frame]);}if(e.kind===34)v.setFrame(e.attackAnim>.35?2:e.attackAnim>0?3:e.fireCD<.7?1:0);
 const bob=scene.reducedFX?0:Math.sin(scene.session.time*(e.kind===35?7:3)+e.id)*3,pulse=scene.reducedFX?1:1+Math.sin(e.age*(e.kind===32?7:2.5))*.028,width=SIZES[e.kind]*pulse;
 v.setPosition(e.x,e.y+bob).setDisplaySize(width,width*v.frame.height/v.frame.width/(e.kind>=34?1:1.27)).setRotation(e.kind===35?Math.sin(e.age*7)*.1:e.kind===32?Math.sin(e.age*4)*.05:0);
 if(e.flash>0)v.setTintFill(0xffffff);else if(e.kind===35&&!e.warmup&&Number.isFinite(e.heat)&&e.heat<.3)v.setTint(0xff7b55);else v.clearTint();
 if(e.kind===32){g.fillStyle(0xffd477,.16).fillCircle(e.x,e.y+12,42);for(let i=0;i<4;i++)g.fillStyle(i%2?0xffb34f:0xffe098,.62).fillCircle(e.x-30+i*19,e.y+31-(i%2)*8,4+i%2*2);}
 if(e.kind===33){const q=Math.max(0,e.inhale||0);if(q>0){g.lineStyle(4,0xffd190,.68).strokeEllipse(e.x-55,e.y,80+(1-q)*80,45+(1-q)*35);for(let i=0;i<4;i++){const x=e.x-70-i*35+q*24;g.lineStyle(3,0xffe5ba,.55).lineBetween(x,e.y-25+i*16,x+28,e.y-18+i*16);}}if((e.armor||0)>0)g.lineStyle(5,e.armorFlash>0?0xffffff:0xe4a25e,.62).strokeEllipse(e.x,e.y,150,92);}
 if(e.kind===34&&e.fireCD<.7&&e.fireCD>0){const q=1-e.fireCD/.7;g.lineStyle(4,0xff6d45,.5+q*.4).strokeCircle(e.x-8,e.y+50,18+q*25);}
 if(e.kind===35&&!e.warmup){const q=Math.max(0,Math.min(1,(e.heat||0)/.65));g.lineStyle(3,0xffe49c,.55).beginPath().arc(e.x,e.y,31,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-q),false).strokePath();}
 bar(g,e);
}

export function drawMagmaWorld(scene,g){
 const s=scene.session;if(s.currentMap?.type==='magma'){for(let i=0;i<20;i++){const x=((i*83-s.time*(42+i%4*8))%1420+1420)%1420-60,y=35+(i*67)%400;g.fillStyle(i%2?0xffd478:0xff8e62,.28+i%3*.08).fillCircle(x,y,2+i%3);}}
 for(const h of s.hazards){if(!h.kind.startsWith('magma'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='magmaCaramel'){g.fillStyle(0xff9a3c,active?.28:.1).fillEllipse(h.x,h.y,h.r*2.1,h.r*.95);g.lineStyle(active?4:2,0xffd17b,active?.78:.35).strokeEllipse(h.x,h.y,h.r*2,h.r*.9);for(let i=0;i<5;i++)g.fillStyle(0xffedb1,.48).fillCircle(h.x-36+i*18,h.y-10-(i%2)*8,3+i%2);if(!active)g.lineStyle(5,0xfff0b0,.95).beginPath().arc(h.x,h.y,h.r+8,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
  if(h.kind==='magmaGeyser'){g.fillStyle(0xff7542,.12+q*.18).fillEllipse(h.x,445,h.r*2.4,28);g.lineStyle(5,0xffd071,.5+q*.4).strokeEllipse(h.x,445,h.r*2.4,28);if(active){const height=h.height||0;g.fillStyle(0xff8a42,.48).fillRoundedRect(h.x-h.r,445-height,h.r*2,height,22);g.fillStyle(0xffe08c,.42).fillRoundedRect(h.x-h.r*.45,445-height,h.r*.9,height,18);}}
  if(h.kind==='magmaCoal'){if(!active){
   const width=104+Math.sin(h.age*8)*5;scene.pickupArt('star123_warning',h.x,43,width).setDisplaySize(width,width).setAlpha(.75+.25*q);
   g.lineStyle(2,0xffcf8b,.15+q*.2).lineBetween(h.x,76,h.x,455);
  }else if(!h.burst){
   // Rock occupies x=350..930, y=500..1080 in the 1254px source; anchor its solid body.
   const size=h.r*2/ .47;scene.pickupArt('star123_meteor',h.x,h.y,size).setOrigin(.51,.63).setDisplaySize(size,size);
  }}

  if(h.kind==='magmaFlame'){if(!active){g.fillStyle(0xff784e,.12+q*.2).fillRoundedRect(0,h.y-h.r,Math.max(0,h.x),h.r*2,18);g.lineStyle(4,0xffd080,.45+q*.4).lineBetween(0,h.y-h.r,h.x,h.y-h.r).lineBetween(0,h.y+h.r,h.x,h.y+h.r);}else{g.fillStyle(0xff7442,.48).fillRoundedRect(0,h.y-h.r,h.x,h.r*2,20);g.fillStyle(0xffd06b,.55).fillRoundedRect(0,h.y-h.r*.42,h.x,h.r*.84,16);for(let i=0;i<8;i++)g.fillStyle(0xffefb0,.55).fillCircle(h.x-i*120,h.y+Math.sin(i+s.time*8)*h.r*.45,5+i%3);}}
 }
}

export function magmaCaption(s){if(s.currentMap?.type!=='magma'||s.inTransit)return '';const t=s.phaseInfo.elapsed,duration=s.segment===0?60:48,phase=t<11?'爆米花航隊':t<26?'焦糖噴泉':t<40?'風箱火舌':'夕陽出口';return MAGMA_PLANS[magmaPlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(duration,Math.floor(t))+' / '+duration+' 秒';}
