// Star-wind turbulence: a short playable bridge between two full regions.
// Kept Phaser-free so timing, hazards and rewards can be unit-tested.
export const TRANSIT_ENEMY_KIND=40;
export const TRANSIT_ENEMIES=[
 {name:'星願寶箱鳥',hp:54,r:27,speed:148}
];

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const seeded=seed=>{let n=(seed^0x6d2b79f5)>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};

export function transitTimeline(index,start,seed){
 const random=seeded((seed^Math.imul(index+1,0x45d9f3b))>>>0);
 const firstDir=random()<.5?-1:1,firstY=firstDir>0?118:362;
 const secondDir=-firstDir,secondY=secondDir>0?135:345;
 return [
  {at:start+.45,type:'transitStory',beat:'warning',index},
  {at:start+1.15,type:'transitStory',beat:'gust',index,y:firstY,dir:firstDir},
  {at:start+3.35,type:'transitStory',beat:'courier',index,y:120+Math.floor(random()*240)},
  {at:start+5.25,type:'transitStory',beat:'gust',index,y:secondY,dir:secondDir},
  {at:start+7.65,type:'transitStory',beat:'starLane',index,y:95+Math.floor(random()*290)},
  {at:start+9.05,type:'transitStory',beat:'arrival',index}
 ];
}

export function transitEvent(s,event){
 if(!s.inTransit)return false;
 const {beat,index}=event;
 if(beat==='warning'){
  s.message('星風亂流展開 · 觀察發光箭頭調整高度');
  s.emit('transitWarning',640,240,{index});
 }
 if(beat==='gust'){
  s.hazards.push({id:++s.id,kind:'starGust',x:1320,y:event.y,dir:event.dir,age:0,life:3.05,warn:.65,r:116,hit:false});
  s.message(event.dir>0?'上升氣流靠近 · 順勢往上穿越':'下降氣流靠近 · 順勢往下穿越');
 }
 if(beat==='courier'){
  const e=s.spawn(TRANSIT_ENEMY_KIND,1350,event.y,'transitCourier',++s.id);e.transit=true;e.fireCD=99;e.escape=0;
  s.message('星願寶箱鳥出現！在牠飛走前擊破可獲得補給');
  s.emit('transitCourier',e.x,e.y);
 }
 if(beat==='starLane'){
  for(let i=0;i<8;i++)s.addPickup('gem',1280+i*52,clamp(event.y+Math.sin(i*.82)*82,55,425));
  s.message('星砂安全航道出現 · 跟著光點迎接下一區');
 }
 if(beat==='arrival'){
  const next=s.route[Math.min(index+1,s.route.length-1)];s.message('亂流出口穩定 · 前方 '+next.name);s.emit('transitExit',1120,240,{name:next.name});
 }
 return true;
}

export function transitHazard(s,h,dt){
 if(h.kind!=='starGust')return false;
 h.x-=210*dt;
 const active=h.age>=h.warn,nearX=Math.abs(s.player.x-h.x)<h.r+165,nearY=Math.abs(s.player.y-h.y)<108;
 if(active&&nearX&&nearY){s.transitDrift+=h.dir*105;s.environmentSlow=Math.min(s.environmentSlow,.88);}
 if(active&&!h.hit&&nearX&&nearY&&Math.abs(s.player.y-h.y)<28){h.hit=true;s.stats.transitRides=(s.stats.transitRides||0)+1;s.score+=3;s.gainEnergy(5);s.emit('transitRide',s.player.x,s.player.y,{dir:h.dir});s.message('乘上星風中心！獲得 3 分與大招能量');}
 return true;
}

export function transitEnemy(s,e,dt){
 if(e.kind!==TRANSIT_ENEMY_KIND)return false;
 const speed=s.tuning.enemySpeedScale;e.escape+=dt;e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*4.2)*72,55,425);
 if(e.escape>5.4)e.exit=true;
 if(s.bodyCircle(e.x,e.y,e.r))s.hit();
 return true;
}

export function transitDefeat(s,e){
 if(e.kind!==TRANSIT_ENEMY_KIND||e.transitRewarded)return false;e.transitRewarded=true;
 s.score+=4;s.stats.transitCouriers=(s.stats.transitCouriers||0)+1;
 const bellCount=2+Math.floor(s.random()*2);
 for(let i=0;i<bellCount;i++)s.addPickup('weapon',clamp(e.x+28+i*34,40,1170),clamp(e.y+(i-(bellCount-1)/2)*58,35,445));
 for(let i=0;i<5;i++)s.addPickup('gem',e.x-28+i*14,e.y-26+Math.abs(i-2)*10);
 s.message('星願寶箱打開！掉出星芽鈴與星砂');s.emit('transitPrize',e.x,e.y);
 return true;
}

