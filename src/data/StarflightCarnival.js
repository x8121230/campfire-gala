// Candy Cloud Carnival: pure simulation helpers, no Phaser dependency.
export const CARNIVAL_PLANS=['棉雲巡遊','逆風糖果道','發條追逐'];
export const CARNIVAL_ENEMIES=[
 {name:'棉花雲綿羊',hp:14,r:25,speed:95},
 {name:'發條馬卡龍雀',hp:70,r:26,speed:130},
 {name:'泡泡糖氣球刺蝟',hp:20,r:24,speed:80},
 {name:'跳跳糖小丑魚',hp:7,r:18,speed:145}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const carnivalPlan=(map,seed)=>Number.isInteger(map?.carnivalScenario)&&map.carnivalScenario>=0?map.carnivalScenario%3:((seed>>>0)+(map?.index||0))%3;
export function carnivalTimeline(map,seed,index,start=index*48){
 const plan=carnivalPlan(map,seed);
 const schedules=[
  [[3,'fish'],[10,'sheep'],[16,'wind'],[21,'hedgehog'],[28,'elite'],[34,'fish']],
  [[3,'sheep'],[10,'fish'],[15,'wind'],[20,'hedgehog'],[27,'elite'],[34,'reward']],
  [[3,'fish'],[9,'hedgehog'],[15,'sheep'],[21,'wind'],[27,'elite'],[34,'fish']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'carnival',beat,plan,index}));
}
export function carnivalEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));
 s.stats.carnivalWaves=(s.stats.carnivalWaves||0)+1;
 if(beat==='fish'){
  for(let i=0,n=count(4);i<n;i++)s.spawn(15,1320+i*80,plan===2?110+i%3*95:230,'candyWave',group);
  s.message('跳跳糖魚群 · 閃光後散射，從空隙穿過');
 }
 if(beat==='sheep'){
  for(let i=0,n=count(3);i<n;i++)s.spawn(12,1340+i*120,115+i%3*115,'candyFloat',group);
  s.message('棉雲綿羊 · 會彈開附近敵彈，淨化後留意糖霜圈');
 }
 if(beat==='hedgehog'){
  for(let i=0,n=count(2);i<n;i++)s.spawn(14,1340+i*210,145+i%2*190,'candyFloat',group);
  s.message('泡泡糖刺蝟 · 粉紅糖漿會減速，繞開再射擊');
 }
 if(beat==='elite'){
  s.spawn(13,1360,plan===1?350:125,'candyDash',group);
  s.message('菁英馬卡龍雀！瞄準線固定後，移開並準備反擊');s.emit('warning');
 }
 if(beat==='wind'){
  s.hazards.push({id:++s.id,kind:'candyWind',x:1120,y:240,r:95,age:0,life:8,warn:1.2,dir:plan===1?1:-1});
  for(let i=0;i<5;i++)s.addPickup('gem',1130+i*52,plan===1?310:150);
  s.message(plan===1?'下沉氣流 · 逆風保持高度，沿星星取獎勵':'上升氣流 · 風帶內可借力上升');
 }
 if(beat==='reward')for(let i=0;i<7;i++)s.addPickup('gem',1300+i*40,180+Math.sin(i*.65)*80);
}
function candyBullet(s,x,y,a,v=100){
 const speed=v*s.tuning.enemyBulletScale;
 s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4,visualRadius:8,life:8,grazed:false,candy:true});
}
export function candyTrap(s,kind,x,y){
 // Bounded hazards, all with visible warm-up; never leave a full-screen wall.
 if(s.hazards.filter(h=>h.kind===kind).length>=7)return;
 s.hazards.push({id:++s.id,kind,x,y,r:kind==='candySyrup'?58:32,age:0,life:kind==='candySyrup'?4.8:2.4,warn:kind==='candySyrup'?.8:1.1});
}
export function carnivalDefeat(s,e){
 if(e.kind<12||e.kind>15)return;
 // Ultimate purifies safely instead of generating new death hazards.
 if(s.phase==='combat'){
  if(e.kind===12)candyTrap(s,'candyFrost',e.x,e.y);
  if(e.kind===14&&!e.bubblePopped)candyTrap(s,'candySyrup',e.x,e.y);
 }
 if(e.kind===13){s.score+=400;s.stats.carnivalElites=(s.stats.carnivalElites||0)+1;s.addPickup('heart',e.x,e.y);s.addPickup('weapon',e.x+45,e.y);s.message('馬卡龍雀恢復平靜！接住愛心與強化星星');s.emit('elite',e.x,e.y);}
}
export function carnivalHit(s,e){
 if(s.phase!=='combat')return;
 if(e.kind===12&&(!e.bounceCD||e.bounceCD<=0)){
  // Being hit makes the wool spring outward and redirects nearby hostile sweets.
  e.bounceCD=.65;e.bounceFlash=.3;
  for(const b of s.bullets){
   if(b.life<=0||Math.hypot(b.x-e.x,b.y-e.y)>115)continue;
   const a=Math.atan2(b.y-e.y,b.x-e.x),speed=Math.max(90,Math.hypot(b.vx,b.vy));
   b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;b.bounced=true;
  }
  s.emit('candyBounce',e.x,e.y);
 }
 if(e.kind===14&&!e.bubblePopped){
  e.bubblePopped=true;e.bubbleFlash=.34;
  candyTrap(s,'candySyrup',e.x-45,e.y);
  // The harmless first pop is a readable warning; the sticky pool activates later.
  s.emit('bubblePop',e.x-45,e.y);
  s.message('泡泡糖啪！粉紅糖漿即將變黏，先離開圓圈');
 }
}
export function carnivalHazard(s,h,dt){
 if(h.kind==='candyWind'){
  h.x-=100*dt;
  if(h.age>=h.warn&&Math.abs(s.player.x-h.x)<h.r+s.hitRadius)s.carnivalWind+=h.dir*65;
 }
 if(['candySyrup','candyFrost','candyJam'].includes(h.kind)){
  h.x-=55*dt;
  if(h.age>=h.warn){
   if(h.kind==='candySyrup'&&Math.hypot(s.player.x-h.x,s.player.y-h.y)<h.r+s.hitRadius)s.environmentSlow=Math.min(s.environmentSlow,.7);
   if(h.kind!=='candySyrup'&&!h.fired){h.fired=true;for(let i=0,n=h.kind==='candyFrost'?6:4;i<n;i++)candyBullet(s,h.x,h.y,Math.PI*2*(i+.5)/n,h.kind==='candyFrost'?82:105);s.emit('burst',h.x,h.y);h.life=.16;}
  }
 }
}
export function carnivalEnemy(s,e,dt){
 if(e.kind<12||e.kind>15)return false;
 const speed=s.tuning.enemySpeedScale,p=s.player;
 e.fireCD-=dt;
 if(e.kind===13){
  e.phaseClock=(e.phaseClock||0)+dt;
  if(e.state==='enter'){
   e.x-=e.speed*speed*dt;
   if(e.x<=1030){e.state='aim';e.phaseClock=0;e.from={x:e.x,y:e.y};e.to={x:Math.max(90,p.x-80),y:clamp(p.y,65,415)};s.emit('warning',e.x,e.y);}
  }else if(e.state==='aim'){
   // Target freezes for the entire 1.25 second telegraph, including Z turn.
   if(e.phaseClock>=1.25){e.state='dash';e.phaseClock=0;e.jamCount=0;}
  }else if(e.state==='dash'){
   const q=Math.min(1,e.phaseClock/1.25),bend=Math.sin(q*Math.PI*2)*70;
   e.x=e.from.x+(e.to.x-e.from.x)*q;e.y=clamp(e.from.y+(e.to.y-e.from.y)*q+bend,40,440);
   if(q>(e.jamCount+1)*.27&&e.jamCount<3){candyTrap(s,'candyJam',e.x,e.y);e.jamCount++;}
   if(q>=1){e.state='recover';e.phaseClock=0;}
  }else {e.x-=65*speed*dt;e.y=clamp(e.y+Math.sin(e.age*2)*dt*16,40,440);}
 }else{
  e.x-=e.speed*speed*dt;
  e.y=clamp(e.baseY+Math.sin(e.age*(e.kind===15?2.4:1.6)+e.id)*(e.kind===15?48:20),40,440);
  if(e.kind===15&&e.x<1200&&e.x>180&&e.fireCD<=0){for(let i=0;i<4;i++)candyBullet(s,e.x,e.y,Math.PI/4+i*Math.PI/2,110);e.fireCD=2.3;}
  if(e.kind===12){
   e.bounceCD=Math.max(0,(e.bounceCD||0)-dt);
   if(e.bounceCD<=0){const b=s.bullets.find(b=>b.life>0&&!b.bounced&&Math.hypot(b.x-e.x,b.y-e.y)<65);
    if(b){const a=Math.atan2(b.y-e.y,b.x-e.x);b.vx=Math.cos(a)*105*s.tuning.enemyBulletScale;b.vy=Math.sin(a)*105*s.tuning.enemyBulletScale;b.bounced=true;e.bounceCD=.8;e.bounceFlash=.25;s.emit('graze',e.x,e.y);}}
   e.bounceFlash=Math.max(0,(e.bounceFlash||0)-dt);
  }
  if(e.kind===14){e.bubbleCharge=Math.min(1,(e.bubbleCharge||0)+dt*.34);e.bubbleFlash=Math.max(0,(e.bubbleFlash||0)-dt);}
 }
 if(e.x<-120)e.exit=true;
 if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+s.hitRadius)s.hit();
 return true;
}
