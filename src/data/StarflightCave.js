// Star Crystal Cave: deterministic combat helpers, independent from Phaser.
export const CAVE_PLANS=['提燈星徑','翻頁回廊','石筍共鳴'];
export const CAVE_ENEMIES=[
 {name:'提燈螢火刺蝟',hp:16,r:22,speed:112},
 {name:'水晶石筍穿山甲',hp:74,r:30,speed:122},
 {name:'翻頁書本小石像鬼',hp:34,r:24,speed:104},
 {name:'發光蘑菇小精靈',hp:11,r:17,speed:92}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const cavePlan=(map,seed)=>Number.isInteger(map?.caveScenario)&&map.caveScenario>=0?map.caveScenario%3:((seed>>>2)+(map?.index||0)*5)%3;
export function caveTimeline(map,seed,index,start=index*58){
 const plan=cavePlan(map,seed),schedules=[
  [[3,'lanterns'],[9,'books'],[15,'blackout'],[21,'pangolin'],[28,'support'],[35,'crystalRain'],[41,'tunnel']],
  [[3,'books'],[10,'lanterns'],[16,'echo'],[22,'support'],[29,'pangolin'],[35,'books'],[41,'tunnel']],
  [[3,'lanterns'],[9,'crystalRain'],[16,'pangolin'],[23,'echo'],[29,'support'],[35,'crystalRain'],[41,'tunnel']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'caveStory',beat,plan,index}));
}
function caveBullet(s,x,y,a,v=122,r=4){const speed=v*s.tuning.enemyBulletScale;s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,cave:true});}
function addHazard(s,kind,x,y,extra={}){
 const cap=kind==='caveCrystal'?5:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 const h={id:++s.id,kind,x,y,age:0,life:kind==='caveDark'?7:kind==='caveEcho'?3.2:kind==='caveCrystal'?4.3:3,warn:kind==='caveDark'?.7:kind==='caveEcho'?.8:1,r:kind==='caveEcho'?24:kind==='caveCrystal'?20:120,...extra};s.hazards.push(h);return h;
}
export function caveEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.caveWaves=(s.stats.caveWaves||0)+1;
 if(beat==='lanterns'){for(let i=0,n=count(4);i<n;i++){const e=s.spawn(20,1320+i*82,90+(i%3)*135,'caveLantern',group);e.fireCD=.9+i*.2;}s.message('提燈刺蝟 · 燈火變亮時會灑出扇形星芒');}
 if(beat==='books'){for(let i=0,n=count(3);i<n;i++){const e=s.spawn(22,1320+i*105,105+(i%3)*125,'caveBook',group);e.state='closed';e.stateTime=.85+i*.22;}s.message('書頁石像鬼 · 合頁時擋彈，翻開核心再集中攻擊');}
 if(beat==='pangolin'){const e=s.spawn(21,1370,plan===2?105:250,'caveRoll',group);e.state='roll';e.fireCD=1.2;s.message('晶甲穿山甲 · 上下彈跳會震落鐘乳晶柱');s.emit('warning');}
 if(beat==='support'){
  const elite=s.spawn(plan===1?22:21,1360,235,plan===1?'caveBook':'caveRoll',group);elite.state=plan===1?'closed':'roll';elite.stateTime=.8;
  for(let i=0,n=count(2);i<n;i++){const fairy=s.spawn(23,1425+i*75,170+i*120,'caveSupport',group);fairy.supportTarget=elite.id;}
  s.message('蘑菇小精靈正在替菁英怪補上微光護盾 · 優先擊破');
 }
 if(beat==='blackout'){addHazard(s,'caveDark',930,240,{r:240});s.message('提燈熄暗 · 跟著水晶亮點穿過黑暗區');}
 if(beat==='echo'){addHazard(s,'caveEcho',1120,240,{r:28});s.message('洞穴回音正在擴散 · 從聲波環中央或外側避開');s.emit('warning');}
 if(beat==='crystalRain'){
  for(let i=0,n=count(3);i<n;i++)addHazard(s,'caveCrystal',680+i*210+(plan%2)*55,-32,{r:18+(i%2)*3,warn:.85+i*.12,vy:0});
  s.message('鐘乳晶柱閃爍 · 一秒後落下，先看亮線再移動');
 }
 if(beat==='tunnel'){
  s.addTerrain?.(1430,plan===0?150:plan===1?330:240,205,false);for(let i=0;i<7;i++)s.addPickup('gem',1290+i*42,(plan===0?150:plan===1?330:240)+Math.sin(i*.8)*55);
  s.message('星晶窄道 · 穿過發光缺口，收集最後一列星砂');
 }
}
export function caveHit(s,e,damage=0){
 if(e.kind<20||e.kind>23||damage<=0)return;
 if(e.kind===22&&e.state==='closed'){e.hp=Math.min(e.maxHp,e.hp+damage);if(!e.blockCue||s.time-e.blockCue>.25){e.blockCue=s.time;s.emit('caveBlock',e.x,e.y);}return;}
 if((e.supportUntil||0)>s.time){e.hp=Math.min(e.maxHp,e.hp+damage*.65);e.shieldFlash=.18;}
 if(e.kind===21&&e.state==='roll')e.hp=Math.min(e.maxHp,e.hp+damage*.3);
}
export function caveDefeat(s,e){
 if(e.kind<20||e.kind>23)return;
 if(e.kind===20)addHazard(s,'caveDark',e.x,e.y,{r:92,life:2.4,warn:.3});
 if(e.kind===21){s.stats.caveElites=(s.stats.caveElites||0)+1;s.addPickup('gem',e.x,e.y-20);s.addPickup('gem',e.x,e.y+20);}
 if(e.kind===23)s.message('微光護盾消失了 · 現在可以攻擊被保護的敵人');
}
export function caveHazard(s,h,dt){
 if(!h.kind.startsWith('cave'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='caveDark'){h.x-=50*dt;if(active&&Math.abs(p.x-h.x)<h.r)s.caveDarkness=Math.max(s.caveDarkness,1-Math.abs(p.x-h.x)/h.r);}
 if(h.kind==='caveCrystal'){
  if(active){h.vy=Math.min(430,(h.vy||0)+700*dt);h.y+=h.vy*dt;if(!h.hit&&s.bodyCircle(h.x,h.y,h.r+5)){h.hit=true;s.hit();}if(h.y>455&&!h.shattered){h.shattered=true;h.life=.16;s.emit('caveImpact',h.x,445);for(const off of [-.34,0,.34])caveBullet(s,h.x,440,Math.PI+off,95);}}
 }
 if(h.kind==='caveEcho'){
  h.x-=34*dt;const radius=h.r+Math.max(0,h.age-h.warn)*92;h.currentRadius=radius;
  if(active&&!h.hit&&s.bodyRing(h.x,h.y,radius)){h.hit=true;s.hit();}
 }
}
export function caveEnemy(s,e,dt){
 if(e.kind<20||e.kind>23)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.shieldFlash=Math.max(0,(e.shieldFlash||0)-dt);
 if(e.kind===20){
  e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*2.1+e.id)*30,55,420);
  if(e.x<1160&&e.x>320&&e.fireCD<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);for(const off of [-.34,-.17,0,.17,.34])caveBullet(s,e.x-22,e.y,a+off,112);e.fireCD=2.55;}
 }else if(e.kind===21){
  e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*2.25)*155,48,432);
  if(e.fireCD<=0&&e.x<1180){addHazard(s,'caveCrystal',clamp(p.x+260,520,1120),-30,{r:22,warn:.9,vy:0});e.fireCD=2.7;s.emit('caveImpact',e.x,e.y);}
 }else if(e.kind===22){
  e.x=Math.max(1015,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.6+e.id)*46,65,410);e.stateTime=(e.stateTime||0)-dt;
  if(e.stateTime<=0){if(e.state==='closed'){e.state='open';e.stateTime=.85;e.fireCD=.28;}else{e.state='closed';e.stateTime=1.15;}}
  if(e.state==='open'&&e.fireCD<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);for(const off of [-.24,0,.24])caveBullet(s,e.x-25,e.y,a+off,138);e.fireCD=5;}
 }else{
  e.x-=e.speed*speed*dt;const target=s.enemies.find(o=>o.id===e.supportTarget&&!o.dead&&!o.exit)||s.enemies.filter(o=>[21,22].includes(o.kind)&&!o.dead&&!o.exit).sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y))[0];
  if(target){e.supportTarget=target.id;e.x+=(target.x+62-e.x)*Math.min(1,dt*2.2);e.y+=(target.y-45-e.y)*Math.min(1,dt*2.2);target.supportUntil=s.time+.18;}
  else e.y=clamp(e.baseY+Math.sin(e.age*2.7)*38,55,420);
 }
 if(e.x<-110)e.exit=true;if(s.bodyCircle(e.x,e.y,e.r))s.hit();return true;
}
