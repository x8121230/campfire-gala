import {FOREST_PLANS,forestPlan} from '../data/StarflightForest.js';

const FRAMES={36:'forestSquirrel',37:'forestWoodpecker',38:'forestGrouse',39:'forestFox'};
const SIZES={36:110,37:132,38:156,39:184};
const bar=(g,e)=>{if(e.maxHp<=25)return;g.fillStyle(0x294235,.86).fillRoundedRect(e.x-45,e.y-75,90,6,3);g.fillStyle(e.kind===39?0xffcf79:0xa9d99a).fillRoundedRect(e.x-45,e.y-75,90*Math.max(0,e.hp/e.maxHp),6,3);};
export function registerForestFrames(scene){const t=scene.textures.get('star_forest_enemies'),im=t.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);[['forestSquirrel',0,0],['forestWoodpecker',1,0],['forestGrouse',0,1],['forestFox',1,1]].forEach(([name,col,row])=>{if(!t.has(name))t.add(name,0,col*w,row*h,w,h);});}
export function drawForestEnemy(scene,g,e,live){
 const id='forest-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star_forest_enemies',FRAMES[e.kind]||'forestSquirrel');scene.entities.add(v);scene.views.set(id,v);}live.add(id);
 const bob=scene.reducedFX?0:Math.sin(scene.session.time*(e.kind===37?6:3)+e.id)*3,pulse=scene.reducedFX?1:1+Math.sin(e.age*(e.kind===39?2:4))*.022,width=SIZES[e.kind]*pulse;v.setPosition(e.x,e.y+bob).setDisplaySize(width,width*v.frame.height/v.frame.width/1.27).setRotation(e.kind===37?Math.sin(e.age*5)*.055:e.kind===36?Math.sin(e.age*2.3)*.04:0);
 if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();
 if(e.kind===36){g.lineStyle(2,0xffd37d,.55).lineBetween(e.x-20,e.y+12,e.x-45,e.y+23);g.fillStyle(0xb97843,.78).fillCircle(e.x-50,e.y+26,6);}
 if(e.kind===37&&e.telegraph>0){const q=1-e.telegraph/.42;for(let i=-1;i<=1;i++)g.lineStyle(2,0xd9e7dd,.55+q*.35).lineBetween(e.x+i*14,e.y-55,e.x+i*8,e.y-120);g.lineStyle(4,0xffdc82,.6+q*.3).strokeCircle(e.x,e.y,24+q*28);}
 if(e.kind===38){const q=Math.max(0,Math.min(1,e.fireCD/2.7));g.lineStyle(4,0xe2b96d,.65).beginPath().arc(e.x-8,e.y+5,42,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-q),false).strokePath();}
 if(e.kind===39){const flash=e.phaseFlash||0;g.fillStyle(0xffcf6d,.11+flash*.3).fillCircle(e.x-17,e.y-4,45+flash*30);if(e.phaseShift>0)for(const side of [-1,1]){g.fillStyle(0xb94f3f,.12).fillEllipse(e.x+25,e.y+side*86,145,68);g.lineStyle(3,0xffbd6e,.28).strokeEllipse(e.x+25,e.y+side*86,145,68);}}
 bar(g,e);
}
export function drawForestWorld(scene,g){
 const s=scene.session;if(s.currentMap?.type==='forest'){for(let i=0;i<22;i++){const x=((i*79-s.time*(22+i%3*6))%1440+1440)%1440-80,y=30+(i*71)%410;g.fillStyle(i%3===0?0xffd777:i%2?0xc9ef91:0xffffff,.25+i%3*.08).fillCircle(x,y,2+i%3);}}
 for(const h of s.hazards){if(!h.kind.startsWith('forest'))continue;const active=h.age>=h.warn,q=Math.min(1,h.age/Math.max(.01,h.warn));
  if(h.kind==='forestBranch'){const top=h.gapY-h.gap/2,bottom=h.gapY+h.gap/2;g.fillStyle(0x405735,active?.74:.28).fillRoundedRect(h.x-h.r,0,h.r*2,top,22).fillRoundedRect(h.x-h.r,bottom,h.r*2,480-bottom,22);g.lineStyle(active?6:3,0x9cc06e,active?.82:.4).strokeRoundedRect(h.x-h.r,0,h.r*2,top,22).strokeRoundedRect(h.x-h.r,bottom,h.r*2,480-bottom,22);for(let y=20;y<470;y+=45)if(y<top-8||y>bottom+8)g.fillStyle(0xdcc172,.65).fillCircle(h.x+Math.sin(y)*18,y,4);if(!active)g.lineStyle(5,0xffdf88,.95).strokeCircle(h.x,h.gapY,28+q*24);}
  if(h.kind==='forestLeafWind'){g.fillStyle(0x86b86d,active?.11:.04).fillRoundedRect(h.x-h.r,20,h.r*2,425,55);g.lineStyle(3,0xc7ef94,.42).strokeRoundedRect(h.x-h.r,20,h.r*2,425,55);for(let i=0;i<8;i++){const y=45+i*53,x=h.x-65+((s.time*75+i*29)%130);g.fillStyle(i%3?0xb7d579:0xd98955,active?.7:.32).fillEllipse(x,y,16,8);}}
  if(h.kind==='forestEcho'){const pulse=1+Math.sin(s.time*5+(h.phase||0))*.05;g.fillStyle(0xc55242,active?.16:.07).fillEllipse(h.x,h.y,145*pulse,68*pulse);g.lineStyle(3,0xffbd73,active?.45:.22).strokeEllipse(h.x,h.y,145*pulse,68*pulse);for(let i=0;i<3;i++){const a=i*Math.PI*2/3+s.time;g.fillStyle(0xe27e4f,.5).fillEllipse(h.x+Math.cos(a)*48,h.y+Math.sin(a)*22,13,7);}}
 }
}
export function forestCaption(s){if(s.currentMap?.type!=='forest'||s.inTransit)return '';const t=s.phaseInfo.elapsed,phase=t<11?'落葉傘兵':t<26?'木偶與滴答':t<40?'三尾幻葉':'晨光出口';return FOREST_PLANS[forestPlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(48,Math.floor(t))+' / 48 秒';}
