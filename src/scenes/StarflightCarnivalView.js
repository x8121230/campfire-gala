import {CARNIVAL_PLANS,carnivalPlan} from '../data/StarflightCarnival.js?v=continuous093';
export function registerCarnivalFrames(scene){
 const t=scene.textures.get('star_candy_enemies'),im=t.getSourceImage();
 // Explicit source rectangles keep loose watercolor flourishes in their own sprite.
 const rects=[[0,0,674,625],[680,0,600,625],[0,640,640,640],[648,640,632,640]];
 rects.forEach(([x,y,w,h],i)=>{if(!t.has('candy'+i))t.add('candy'+i,0,Math.round(x*im.width/1280),Math.round(y*im.height/1280),Math.round(w*im.width/1280),Math.round(h*im.height/1280));});
 const scenery=scene.textures.get('star_candy_scenery'),src=scenery.getSourceImage();
 [[0,0,780,770],[790,0,464,700],[0,790,810,464],[805,680,449,574]].forEach(([x,y,w,h],i)=>{
  if(!scenery.has('scenery'+i))scenery.add('scenery'+i,0,Math.round(x*src.width/1254),Math.round(y*src.height/1254),Math.round(w*src.width/1254),Math.round(h*src.height/1254));
 });
}
export function createCandyScenery(scene,mid,front){
 const make=(frame,x,y,w,speed,parent,alpha=1)=>{const v=scene.add.image(x,y,'star_candy_scenery','scenery'+frame).setDisplaySize(w,w*scene.textures.getFrame('star_candy_scenery','scenery'+frame).height/scene.textures.getFrame('star_candy_scenery','scenery'+frame).width).setAlpha(alpha);parent.add(v);return {v,x,speed,frame};};
 scene.candyParallax=[
  make(1,1120,112,190,21,mid,.72),make(3,570,105,155,31,mid,.77),
  make(0,1480,385,390,48,mid,.92),make(1,2250,365,260,42,mid,.86),
  make(2,620,505,430,82,front,.48),make(2,1750,515,520,90,front,.55)
 ];
}
export function updateCandyScenery(scene){
 const s=scene.session,alpha=Math.min(1,(scene.themeWeights?.carnival||0)*1.3);
 for(let i=0;i<(scene.candyParallax||[]).length;i++){
  const o=scene.candyParallax[i],span=o.frame===2?2250:2550,x=((o.x-s.time*o.speed)%span+span)%span-(o.frame===2?350:260);
  o.v.setX(x).setVisible(alpha>.002).setAlpha(alpha*(o.frame===2?(i%2?.55:.48):i<2?.72:.92));
  if(!scene.reducedFX&&o.frame===3)o.v.setY(105+Math.sin(s.time*.8)*7);
 }
}
export function drawCandyEnemy(scene,g,e,live){
 const id='candy-'+e.id;live.add(id);let v=scene.views.get(id);
 if(!v){v=scene.add.image(e.x,e.y,'star_candy_enemies','candy'+(e.kind-12));scene.entities.add(v);scene.views.set(id,v);}
 const width=[113,132,115,90][e.kind-12],pulse=scene.reducedFX?1:1+Math.sin(e.age*(e.kind===13?12:3))*(e.kind===14?.055:.025);
 v.setPosition(e.x,e.y).setDisplaySize(width*pulse,width*v.frame.height/v.frame.width/1.27*pulse).setRotation(scene.reducedFX?0:e.kind===13&&e.state==='dash'?.15:Math.sin(e.age*3)*.055);
 if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();
 if(e.kind===13&&e.state==='aim'){
  const pts=[];for(let i=0;i<=28;i++){const q=i/28;pts.push({x:e.from.x+(e.to.x-e.from.x)*q,y:Math.max(40,Math.min(440,e.from.y+(e.to.y-e.from.y)*q+Math.sin(q*Math.PI*2)*70))});}
  g.lineStyle(14,0x562846,.2).strokePoints(pts);g.lineStyle(3,0xa63767,.9).strokePoints(pts);
  g.lineStyle(3,0xa63767,.8).strokeCircle(e.to.x,e.to.y,23);g.lineStyle(4,0xffd96c).strokeCircle(e.x,e.y,52);
 }
 if(e.kind===14&&!e.bubblePopped){const q=e.bubbleCharge||0;g.lineStyle(3,0xf06fae,.38+q*.4).strokeCircle(e.x-47,e.y,20+q*15);}
 if(e.kind===14&&e.bubbleFlash>0)g.lineStyle(6,0xffc4df,e.bubbleFlash/.34).strokeCircle(e.x-47,e.y,30+(1-e.bubbleFlash/.34)*42);
 if(e.kind===15&&e.fireCD<.5&&e.fireCD>0)g.lineStyle(3,0xa24d31,.75).strokeCircle(e.x,e.y,33);
 if(e.bounceFlash>0)g.lineStyle(4,0xab69bd,.8).strokeCircle(e.x,e.y,62);
 if(e.maxHp>10){g.fillStyle(0x443044,.8).fillRoundedRect(e.x-30,e.y-52,60,5,2);g.fillStyle(0xffd797).fillRoundedRect(e.x-30,e.y-52,60*Math.max(0,e.hp/e.maxHp),5,2);}
}
export function drawCandyWorld(scene,g){
 const s=scene.session;
 updateCandyScenery(scene);
 if(s.currentMap?.type==='sky'){
  // Midground candy bunting, well away from the playable centre.
  for(let i=0;i<11;i++){
   const x=((i*145-s.time*56)%1595+1595)%1595-145,y=454+Math.sin(i)*5;
   g.lineStyle(2,0xa46a77,.4).lineBetween(x,y,x+145,y+4);
   for(let j=0;j<4;j++)g.fillStyle([0xefb7c5,0xb7d9c3,0xeed596][j%3],.6).fillTriangle(x+j*34,y,x+j*34+22,y+1,x+j*34+11,y+18);
  }
 }
 for(const h of s.hazards){
  if(!h.kind.startsWith('candy'))continue;
  const active=h.age>=h.warn;
  if(h.kind==='candyWind'){
   g.fillStyle(0x63a5ae,active?.13:.06).fillRect(h.x-h.r,0,h.r*2,480);
   g.lineStyle(2,0x286e80,.6).lineBetween(h.x-h.r,0,h.x-h.r,480).lineBetween(h.x+h.r,0,h.x+h.r,480);
   for(let i=0;i<5;i++){const y=((i*98+(scene.reducedFX?0:s.time*h.dir*60))%480+480)%480;
    g.lineStyle(3,0x286e80,active?.7:.35).lineBetween(h.x-15,y-h.dir*12,h.x,y).lineBetween(h.x,y,h.x+15,y-h.dir*12);}
  }else{
   const color=h.kind==='candySyrup'?0xa44e92:h.kind==='candyJam'?0xb03b5d:0x735197;
   g.fillStyle(color,active?.24:.09).fillCircle(h.x,h.y,h.r);
   g.lineStyle(active?3:2,color,.8).strokeCircle(h.x,h.y,h.r);
   if(!active){const q=Math.min(1,h.age/h.warn);g.lineStyle(4,0xf7d389,.95).beginPath().arc(h.x,h.y,h.r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*q,false).strokePath();}
   scene.star(g,h.x,h.y,9,color,.9);
  }
 }
}
export function carnivalCaption(s){
 if(s.currentMap?.type!=='sky'||s.inTransit)return '';
 const t=s.phaseInfo.elapsed,phase=t<9?'暖身巡遊':t<27?'機關挑戰':t<40?'菁英與獎勵':'終點加速';
 return CARNIVAL_PLANS[carnivalPlan(s.currentMap,s.seed)]+'　·　'+phase+'　'+Math.min(s.phaseInfo.end-s.phaseInfo.start,Math.floor(t))+' / '+(s.phaseInfo.end-s.phaseInfo.start)+' 秒';
}
