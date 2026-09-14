// Moonlight Lake: readable, self-contained combat behaviours with no Phaser dependency.
export const LAKE_PLANS=['紙舟月巡','睡蓮伏擊','鏡潮折光'];
export const LAKE_ENEMIES=[
 {name:'摺紙小紙船',hp:9,r:18,speed:142},
 {name:'摺紙睡蓮青蛙',hp:24,r:23,speed:118},
 {name:'泡泡人魚海馬',hp:58,r:27,speed:92},
 {name:'彩繪瓷壺水精靈',hp:92,r:34,speed:72}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const lakePlan=(map,seed)=>Number.isInteger(map?.lakeScenario)&&map.lakeScenario>=0?map.lakeScenario%3:((seed>>>1)+(map?.index||0)*3)%3;
export function lakeTimeline(map,seed,index,start=index*58){
 const plan=lakePlan(map,seed),schedules=[
  [[3,'boats'],[9,'frogs'],[15,'current'],[21,'seahorse'],[28,'boats'],[34,'teapot'],[41,'finale']],
  [[3,'frogs'],[10,'boats'],[16,'current'],[22,'frogs'],[28,'seahorse'],[35,'teapot'],[41,'finale']],
  [[3,'boats'],[9,'seahorse'],[16,'current'],[22,'boats'],[28,'prism'],[34,'teapot'],[41,'finale']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'lakeStory',beat,plan,index}));
}
function lakeBullet(s,x,y,a,v=118,r=4){
 const speed=v*s.tuning.enemyBulletScale;
 s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,lake:true});
}
function addHazard(s,kind,x,y,extra={}){
 const cap=kind==='lakeOrb'?5:3;
 if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 const base={id:++s.id,kind,x,y,age:0,life:kind==='lakeCurrent'?8:kind==='lakeWhirlpool'?7:kind==='lakeOrb'?4.2:2.1,warn:kind==='lakeCurrent'?1:kind==='lakeWhirlpool'?1.15:kind==='lakeOrb'?.4:.7};
 const h={...base,...extra};s.hazards.push(h);return h;
}
export function lakeEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));
 s.stats.lakeWaves=(s.stats.lakeWaves||0)+1;
 if(beat==='boats'){
  for(let i=0,n=count(5);i<n;i++)s.spawn(16,1320+i*72,398+(i%2)*27,'lakeBoat',group);
  s.message('紙舟月巡 · 擊破蠟燭後，水滴會向上綻放');
 }
 if(beat==='frogs'){
  for(let i=0,n=count(3);i<n;i++){const e=s.spawn(17,900+i*185,447,'lakeFrog',group);e.state='hidden';e.charge=.75+i*.35;}
  s.message('睡蓮輕輕發亮 · 青蛙即將從水面躍起');s.emit('warning');
 }
 if(beat==='seahorse'){
  const e=s.spawn(18,1360,plan===2?145:235,'lakeSeahorse',group);e.state='enter';e.fireCD=1.4;
  s.message('泡泡人魚海馬 · 彩色泡泡到邊界會折射散開');
 }
 if(beat==='teapot'){
  const e=s.spawn(19,1390,155+plan*70,'lakeTeapot',group);e.state='enter';e.fireCD=2;
  s.message('菁英瓷壺水精靈！避開湖面漩渦，再攻擊壺心');s.emit('warning');
 }
 if(beat==='current'){
  addHazard(s,'lakeCurrent',1120,plan===1?155:330,{r:92,dir:plan===1?-1:1});
  for(let i=0;i<6;i++)s.addPickup('gem',1220+i*48,plan===1?340-i*28:145+i*28);
  s.message('月潮水道 · 順著發光水珠穿過斜向水流');
 }
 if(beat==='prism'){
  for(let i=0;i<3;i++)addHazard(s,'lakeOrb',1250+i*120,120+i*100,{r:26,vx:-72,phase:i*.9});
  s.message('折光泡泡列陣 · 先拉開距離，等待環形水珠散開');
 }
 if(beat==='finale'){
  for(let i=0;i<7;i++)s.addPickup('gem',1280+i*42,240+Math.sin(i*.9)*115);
  s.message('月湖航道即將完成 · 沿著星露航線加速！');
 }
}
export function lakeDefeat(s,e){
 if(e.kind<16||e.kind>19)return;
 if(e.kind===16)addHazard(s,'lakeSplash',e.x,e.y,{r:30});
 if(e.kind===18){s.addPickup('gem',e.x,e.y-18);s.addPickup('gem',e.x,e.y+18);}
 if(e.kind===19){s.score+=5;s.stats.lakeElites=(s.stats.lakeElites||0)+1;s.addPickup('gem',e.x,e.y);s.addPickup('weapon',e.x+46,e.y);s.message('瓷壺水精靈恢復清澈！接住結晶與星芽鈴');s.emit('elite',e.x,e.y);}
}
export function lakeHit(s,e){
 if(e.kind!==18||e.prismBroken||e.hp<=0)return;
 if(e.hp<e.maxHp*.58){e.prismBroken=true;s.emit('lakePrism',e.x,e.y);s.message('海馬的折光外膜破裂 · 現在是集中攻擊時機');}
}
export function lakeHazard(s,h,dt){
 if(!h.kind.startsWith('lake'))return;
 const p=s.player,active=h.age>=h.warn;
 if(h.kind==='lakeCurrent'){
  h.x-=70*dt;
  if(active&&Math.abs(p.x-h.x)<h.r+s.hitRadius&&Math.abs(p.y-h.y)<150)s.lakePull+=h.dir*58;
 }
 if(h.kind==='lakeWhirlpool'){
  h.x-=42*dt;
  if(active){const dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy);if(d<h.r+s.hitRadius){s.lakePull+=clamp((h.y-p.y)*1.25,-95,95);s.environmentSlow=Math.min(s.environmentSlow,.78);}}
 }
 if(h.kind==='lakeOrb'){
  h.x+=(h.vx||-68)*dt;h.y+=Math.sin(h.age*2.2+(h.phase||0))*15*dt;
  if(active&&h.life<.24&&!h.fired){h.fired=true;for(let i=0;i<8;i++)lakeBullet(s,h.x,h.y,i*Math.PI/4,88);s.emit('lakePrism',h.x,h.y);}
  if(active&&Math.hypot(p.x-h.x,p.y-h.y)<h.r+s.hitRadius){h.life=0;s.hit();}
 }
 if(h.kind==='lakeSplash'&&active&&!h.fired){h.fired=true;for(const off of [-.48,-.24,0,.24,.48])lakeBullet(s,h.x,h.y,-Math.PI/2+off,105);s.emit('lakeSplash',h.x,h.y);h.life=.12;}
}
export function lakeEnemy(s,e,dt){
 if(e.kind<16||e.kind>19)return false;
 const speed=s.tuning.enemySpeedScale,p=s.player;
 e.fireCD-=dt;e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);
 if(e.kind===16){
  e.x-=e.speed*speed*dt;e.y=e.baseY+Math.sin(e.age*2.5+e.id)*6;
 }else if(e.kind===17){
  if(e.state==='hidden'){e.charge-=dt;if(e.charge<=0){e.state='leap';e.age=0;s.emit('lakeSplash',e.x,e.y);}}
  else{e.x-=e.speed*speed*dt;e.y=447-Math.sin(Math.min(1,e.age/2.25)*Math.PI)*320;if(e.age>.92&&!e.apexShot){e.apexShot=true;e.attackAnim=.4;for(const off of [-.34,0,.34])lakeBullet(s,e.x,e.y,Math.PI/2+off,105);}if(e.age>2.25)e.exit=true;}
 }else if(e.kind===18){
  e.x=Math.max(1015,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.7)*72,70,390);
  if(e.x<1160&&e.fireCD<=0&&!e.windup){e.windup=0.5;}
  if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.windup=0;e.attackAnim=.5;addHazard(s,'lakeOrb',e.x-35,e.y,{r:28,vx:-78,phase:e.id});e.fireCD=e.prismBroken?2.9:2.25;}}
 }else{
  e.x=Math.max(1045,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.15)*38,85,365);
  if(e.x<1180&&e.fireCD<=0&&!e.windup){e.windup=0.65;}
  if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.windup=0;e.attackAnim=.5;addHazard(s,'lakeWhirlpool',e.x-170,420,{r:112});for(const off of [-.22,.22])lakeBullet(s,e.x-28,e.y,Math.atan2(p.y-e.y,p.x-e.x)+off,125,5);e.fireCD=3.8;}}
 }
 if(e.x<-110)e.exit=true;
 if(!(e.kind===17&&e.state==='hidden')&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+s.hitRadius)s.hit();
 return true;
}
