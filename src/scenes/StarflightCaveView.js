import {CAVE_PLANS,cavePlan} from '../data/StarflightCave.js';

const CAVE_FRAMES={20:'caveHedgehog',21:'cavePangolin',22:'caveGargoyle',23:'caveSprite'};
const CAVE_SIZES={20:112,21:132,22:116,23:88};
const bar=(g,e)=>{if(e.maxHp<=14)return;g.fillStyle(0x221d35,.82).fillRoundedRect(e.x-38,e.y-58,76,6,3);g.fillStyle((e.supportUntil||0)>0?0xa9ffd0:0xcbb4ff).fillRoundedRect(e.x-38,e.y-58,76*Math.max(0,e.hp/e.maxHp),6,3);};

export function registerCaveFrames(scene){
 const t=scene.textures.get('star_cave_enemies'),im=t.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);
 [['caveHedgehog',0,0],['cavePangolin',1,0],['caveGargoyle',0,1],['caveSprite',1,1]].forEach(([name,col,row])=>{if(!t.has(name))t.add(name,0,col*w,row*h,w,h);});
}

export function drawCaveEnemy(scene,g,e,live){
 const id='cave-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star_cave_enemies',CAVE_FRAMES[e.kind]||'caveSprite');const scale=CAVE_SIZES[e.kind]/Math.max(v.width,v.height);v.setScale(scale,scale/1.27);scene.entities.add(v);scene.views.set(id,v);}
 live.add(id);const bob=Math.sin(scene.session.time*(e.kind===21?3:5)+e.id)*3;
 v.setPosition(e.x,e.y+bob).setAlpha(e.state==='closed'?.9:1).setRotation(e.kind===21?Math.sin(e.age*4)*.14:e.kind===22&&e.state==='closed'?.05*Math.sin(e.age*11):0);
 const base=CAVE_SIZES[e.kind]/Math.max(v.width,v.height),pulse=e.kind===23?1+Math.sin(e.age*7)*.045:1;v.setScale(base*pulse,base*pulse/1.27);
 if(e.flash>0)v.setTintFill(0xffffff);else if(e.kind===22&&e.state==='closed')v.setTint(0xbaaed2);else v.clearTint();
 if(e.kind===20){const glow=.35+.22*Math.sin(e.age*8);g.fillStyle(0xffe39a,glow).fillCircle(e.x+31,e.y+23,22);g.lineStyle(2,0xffefbc,.75).strokeCircle(e.x+31,e.y+23,12);}
 if(e.kind===21){g.fillStyle(0x8ef4ef,.16).fillCircle(e.x-5,e.y+8,e.r+17);g.lineStyle(3,0x9ff7ef,.65).strokeCircle(e.x-5,e.y+8,e.r+8);}
 if(e.kind===22&&e.state==='closed'){g.fillStyle(0xdacbff,.12).fillEllipse(e.x,e.y,88,104);g.lineStyle(5,0xe8d7ff,.62).strokeEllipse(e.x,e.y,82,98);for(let i=0;i<3;i++)g.lineStyle(2,0xffe6a8,.48).lineBetween(e.x-42,e.y-28+i*28,e.x+42,e.y-18+i*28);}
 const shielded=(e.supportUntil||0)>scene.session.time||e.shieldFlash>0;if(shielded){g.fillStyle(0x9fffd2,.1).fillCircle(e.x,e.y,e.r+17);g.lineStyle(5,0xa9ffd0,.55+(e.shieldFlash||0)*2).strokeCircle(e.x,e.y,e.r+13);}
 if(e.kind===23&&e.supportTarget){const target=scene.session.enemies.find(item=>item.id===e.supportTarget&&!item.dead);if(target){g.lineStyle(10,0x8dffd0,.12).lineBetween(e.x,e.y,target.x,target.y);g.lineStyle(3,0xe7ffbb,.8).lineBetween(e.x,e.y,target.x,target.y);for(let i=0;i<4;i++){const q=(scene.session.time*.8+i/4)%1,x=e.x+(target.x-e.x)*q,y=e.y+(target.y-e.y)*q;g.fillStyle(0xffefad,.85).fillCircle(x,y,4);}}}
 bar(g,e);
}

export function drawCaveWorld(scene,g){
 const s=scene.session,darkness=Math.min(.58,(s.caveDarkness||0)*.52);if(darkness>0){g.fillStyle(0x070817,darkness).fillRect(0,0,1280,480);const p=s.player;g.fillStyle(0xa9f6e0,.05).fillCircle(p.x,p.y,150);g.lineStyle(2,0xbaffeb,.16).strokeCircle(p.x,p.y,145);}
 for(const h of s.hazards){if(!h.kind.startsWith('cave'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='caveDark'){g.fillStyle(0x09091a,active?.34:.14).fillEllipse(h.x,h.y,h.r*2.2,h.r*1.45);g.lineStyle(3,0xb6ffe4,.35).strokeEllipse(h.x,h.y,h.r*2.05,h.r*1.3);for(let i=0;i<5;i++){const a=i*Math.PI*2/5+s.time;g.fillStyle(0xb8ffe5,.55).fillCircle(h.x+Math.cos(a)*h.r*.65,h.y+Math.sin(a)*h.r*.4,3);}}
  if(h.kind==='caveCrystal'){
   if(!active){scene.pickupArt('star123_warning',h.x,40,94).setAlpha(.7+.3*q);g.lineStyle(2,0xc5f5ff,.18).lineBetween(h.x,80,h.x,455);g.lineStyle(3,0xc5f5ff,.65).strokeEllipse(h.x,455,90,20);}
   else if(!h.shattered)scene.pickupArt('star124_icicle',h.x,h.y,100).setOrigin(.5,.5).setDisplaySize(213,129);
  }
  if(h.kind==='caveEcho'){const r=h.currentRadius||h.r,beat=.6+.25*Math.sin(s.time*9);g.fillStyle(0x9ce9e5,active?.055:.025).fillCircle(h.x,h.y,r);g.lineStyle(active?8:4,0x9ce9e5,active?beat:.32).strokeCircle(h.x,h.y,r);g.lineStyle(3,0xd9c7ff,.58).strokeCircle(h.x,h.y,r+17);g.lineStyle(2,0xffefb5,.36).strokeCircle(h.x,h.y,Math.max(4,r-17));if(!active)g.lineStyle(5,0xffe29b,.95).beginPath().arc(h.x,h.y,h.r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
 }
}

export function caveCaption(s){if(s.currentMap?.type!=='cave'||s.inTransit)return '';const t=s.phaseInfo.elapsed,phase=t<11?'提燈偵察':t<26?'書頁與石筍':t<40?'護盾共鳴':'星晶窄道';return CAVE_PLANS[cavePlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(s.segment===0?60:48,Math.floor(t))+' / '+(s.segment===0?60:48)+' 秒';}
