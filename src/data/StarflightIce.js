// Frost-petal tundra: gameplay simulation helpers without a Phaser dependency.
export const ICE_PLANS=['霜糖滑道','八音盒舞台','毛線雪徑'];
export const ICE_ENEMIES=[
 {name:'雪球滾滾兔',hp:30,r:25,speed:105},
 {name:'八音盒冰晶天鵝',hp:78,r:31,speed:76},
 {name:'毛線球小雪豹',hp:94,r:34,speed:82},
 {name:'霜糖松果小精靈',hp:12,r:18,speed:235}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const icePlan=(map,seed)=>Number.isInteger(map?.iceScenario)&&map.iceScenario>=0?map.iceScenario%3:((seed>>>3)+(map?.index||0)*7)%3;
export function iceTimeline(map,seed,index,start=index*58){
 const plan=icePlan(map,seed),schedules=[
  [[3,'pinecones'],[9,'rabbits'],[15,'gust'],[21,'swan'],[28,'pinecones'],[35,'leopard'],[41,'finale']],
  [[3,'swan'],[10,'pinecones'],[16,'snowfall'],[22,'rabbits'],[29,'swan'],[35,'leopard'],[41,'finale']],
  [[3,'rabbits'],[9,'pinecones'],[16,'gust'],[22,'leopard'],[29,'snowfall'],[35,'rabbits'],[41,'finale']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'iceStory',beat,plan,index}));
}
function iceBullet(s,x,y,a,v=118,r=4){const speed=v*s.tuning.enemyBulletScale;s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,ice:true});}
function addHazard(s,kind,x,y,extra={}){
 const cap=kind==='iceShard'?6:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 const h={id:++s.id,kind,x,y,age:0,life:kind==='iceGust'?7:kind==='iceYarn'?5.2:kind==='iceShard'?4.1:3,warn:kind==='iceGust'?1:kind==='iceYarn'?.85:.9,r:kind==='iceYarn'?18:kind==='iceShard'?16:105,...extra};s.hazards.push(h);return h;
}
export function iceEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.iceWaves=(s.stats.iceWaves||0)+1;
 if(beat==='pinecones'){
  for(let i=0,n=count(5);i<n;i++){const e=s.spawn(27,1330+i*78,70+(i%4)*102,'iceSlide',group);e.curve=(i%2?1:-1)*(35+plan*8);}
  s.message('霜糖松果滑行隊 · 看清弧線後從隊形縫隙穿過');
 }
 if(beat==='rabbits'){
  for(let i=0,n=count(3);i<n;i++){const e=s.spawn(24,1340+i*130,115+(i%3)*125,'snowRabbit',group);e.snowShield=22+plan*4;}
  s.message('雪球兔的雪球會吸收正面攻擊 · 先打碎再攻擊本體');
 }
 if(beat==='swan'){
  const e=s.spawn(25,1380,plan===1?210:135+plan*90,'iceSwan',group);e.fireCD=1.1;s.message('八音盒冰晶天鵝 · 旋轉前奏後灑出六角雪花彈幕');
 }
 if(beat==='leopard'){
  const e=s.spawn(26,1400,160+plan*70,'iceLeopard',group);e.fireCD=1.4;s.message('菁英毛線雪豹！跳過發光毛線，別被橫向束縛');s.emit('warning');
 }
 if(beat==='gust'){
  addHazard(s,'iceGust',1080,plan===2?310:165,{r:95,dir:plan===0?-1:1});for(let i=0;i<6;i++)s.addPickup('gem',1190+i*48,plan===2?345-i*35:135+i*35);s.message('霜風滑道 · 順著冰晶星砂調整高度');
 }
 if(beat==='snowfall'){
  for(let i=0,n=count(4);i<n;i++)addHazard(s,'iceShard',620+i*180,-30,{r:16+(i%2)*3,warn:.75+i*.14,vy:0,drift:(i%2?1:-1)*35});s.message('雪花光圈亮起 · 冰晶碎片即將斜落');
 }
 if(beat==='finale'){
  for(let i=0;i<8;i++)s.addPickup('gem',1280+i*40,240+Math.sin(i*.8)*120);s.message('極光出口就在前方 · 沿星砂航線完成冰原巡航');
 }
}
export function iceHit(s,e,damage=0){
 if(e.kind<24||e.kind>27||damage<=0)return;
 if(e.kind===24&&e.snowShield>0){const absorbed=Math.min(damage,e.snowShield);e.snowShield-=absorbed;e.hp=Math.min(e.maxHp,e.hp+absorbed);e.shieldFlash=.16;if(e.snowShield<=0){s.emit('iceBreak',e.x,e.y);s.message('雪球護盾碎開了 · 現在可以攻擊兔子本體');}}
}
export function iceDefeat(s,e){
 if(e.kind<24||e.kind>27)return;
 if(e.kind===24)for(let i=0;i<3;i++)s.addPickup('gem',e.x+i*13,e.y+(i-1)*12);
 if(e.kind===25){s.stats.iceElites=(s.stats.iceElites||0)+1;s.addPickup('gem',e.x,e.y-18);s.addPickup('gem',e.x,e.y+18);}
 if(e.kind===26){s.score+=550;s.stats.iceElites=(s.stats.iceElites||0)+1;s.addPickup('heart',e.x,e.y);s.addPickup('weapon',e.x+46,e.y);s.message('雪豹收起毛線玩具！接住愛心與強化星星');s.emit('elite',e.x,e.y);}
}
export function iceHazard(s,h,dt){
 if(!h.kind.startsWith('ice'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='iceGust'){h.x-=64*dt;if(active&&Math.abs(p.x-h.x)<h.r+s.hitRadius&&Math.abs(p.y-h.y)<155)s.iceDrift+=h.dir*65;}
 if(h.kind==='iceYarn'){
  h.x+=(h.vx||-105)*dt;const ropeEnd=h.x+(h.ropeLength||245),cross=p.x>=h.x-20&&p.x<=ropeEnd+20&&Math.abs(p.y-h.y)<11+s.hitRadius;
  if(active&&cross&&!h.hit){h.hit=true;s.hit();s.environmentSlow=Math.min(s.environmentSlow,.55);s.emit('iceTangle',p.x,p.y);}
 }
 if(h.kind==='iceShard'&&active){h.vy=Math.min(390,(h.vy||0)+610*dt);h.x+=(h.drift||0)*dt;h.y+=h.vy*dt;if(!h.hit&&Math.hypot(p.x-h.x,p.y-h.y)<h.r+s.hitRadius+5){h.hit=true;s.hit();}if(h.y>455&&!h.shattered){h.shattered=true;h.life=.14;s.emit('iceBreak',h.x,445);for(const off of [-.3,.3])iceBullet(s,h.x,440,Math.PI+off,88);}}
}
export function iceEnemy(s,e,dt){
 if(e.kind<24||e.kind>27)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.shieldFlash=Math.max(0,(e.shieldFlash||0)-dt);
 if(e.kind===24){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*1.8+e.id)*20,55,425);e.snowSize=30+Math.max(0,e.snowShield||0)*.65;}
 else if(e.kind===25){
  e.x=Math.max(1025,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.25)*55,70,400);e.spin=(e.spin||0)+dt*(e.fireCD<.65?7:2);
  if(e.x<1180&&e.fireCD<=0){for(let i=0;i<6;i++){const a=e.spin+i*Math.PI/3;iceBullet(s,e.x,e.y,a,105);}e.fireCD=2.15;s.emit('iceChime',e.x,e.y);}
 }else if(e.kind===26){
  e.x=Math.max(1040,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.5)*44,80,390);
  if(e.x<1180&&e.fireCD<=0){addHazard(s,'iceYarn',e.x-35,clamp(p.y,70,410),{r:19,vx:-118,ropeLength:255});for(const off of [-.2,.2])iceBullet(s,e.x-28,e.y,Math.atan2(p.y-e.y,p.x-e.x)+off,126);e.fireCD=3.45;s.emit('warning',e.x,e.y);}
 }else{
  e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*3.1+e.id)*(e.curve||45),38,442);e.rotation=(e.rotation||0)+dt*8;
 }
 if(e.x<-110)e.exit=true;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+s.hitRadius)s.hit();return true;
}
