// Glowcap wetland: self-contained gameplay helpers without a Phaser dependency.
export const WETLAND_PLANS=['風鈴毒霧徑','月露折光池','提琴花粉夜'];
export const WETLAND_ENEMIES=[
 {name:'風鈴毒蕈菇',hp:18,r:22,speed:118},
 {name:'提琴提燈樹蛙',hp:72,r:31,speed:78},
 {name:'露珠瓢蟲',hp:34,r:24,speed:132},
 {name:'茶杯蓮蓬寄居蟹',hp:102,r:37,speed:66}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const wetlandPlan=(map,seed)=>Number.isInteger(map?.wetlandScenario)&&map.wetlandScenario>=0?map.wetlandScenario%3:((seed>>>4)+(map?.index||0)*11)%3;
export function wetlandTimeline(map,seed,index,start=index*58){
 const plan=wetlandPlan(map,seed),schedules=[
  [[3,'mushrooms'],[9,'dewbugs'],[15,'bogCurrent'],[21,'frog'],[28,'mushrooms'],[35,'hermit'],[41,'finale']],
  [[3,'dewbugs'],[10,'mushrooms'],[16,'pollen'],[22,'frog'],[29,'dewbugs'],[35,'hermit'],[41,'finale']],
  [[3,'mushrooms'],[9,'frog'],[16,'bogCurrent'],[22,'hermit'],[29,'pollen'],[35,'dewbugs'],[41,'finale']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'wetlandStory',beat,plan,index}));
}
function wetlandBullet(s,x,y,a,v=108,r=5){const speed=v*s.tuning.enemyBulletScale;s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,wetland:true});}
function addHazard(s,kind,x,y,extra={}){
 const cap=kind==='wetlandPoison'?6:kind==='wetlandPollen'?5:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 const life=kind==='wetlandPoison'?4.4:kind==='wetlandPollen'?5.6:kind==='wetlandSound'?2.4:6;
 let warn=.65;if(kind==='wetlandPoison')warn=1;else if(kind==='wetlandPollen')warn=.75;
 const h={id:++s.id,kind,x,y,age:0,life,warn,r:kind==='wetlandPoison'?46:kind==='wetlandPollen'?25:kind==='wetlandSound'?24:100,...extra};s.hazards.push(h);return h;
}

export function wetlandEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.wetlandWaves=(s.stats.wetlandWaves||0)+1;
 if(beat==='mushrooms'){for(let i=0,n=count(5);i<n;i++){const e=s.spawn(28,1330+i*86,68+(i%4)*108,'wetlandMushroom',group);e.floatPhase=i*.8;}s.message('風鈴毒蕈菇 · 擊破後一秒才形成毒霧，別停在原地');}
 if(beat==='frog'){const e=s.spawn(29,1390,145+plan*68,'wetlandFrog',group);e.fireCD=1.2;s.message('提琴樹蛙開始演奏 · 穿過同心聲波時操控會變鈍');}
 if(beat==='dewbugs'){for(let i=0,n=count(3);i<n;i++){const e=s.spawn(30,1350+i*118,105+(i%3)*125,'wetlandDewbug',group);e.prismCD=.5+i*.2;}s.message('露珠瓢蟲會折射正面光束 · 看見彩光時上下閃避');}
 if(beat==='hermit'){const e=s.spawn(31,1410,165+plan*62,'wetlandHermit',group);e.fireCD=1.35;s.message('菁英茶杯寄居蟹 · 花粉泡泡會漂移封路並在近身時爆開');s.emit('warning',e.x,e.y);}
 if(beat==='bogCurrent'){addHazard(s,'wetlandCurrent',1050,plan===2?315:155,{r:105,dir:plan===0?1:-1});for(let i=0;i<6;i++)s.addPickup('gem',1170+i*46,plan===2?350-i*38:130+i*38);s.message('沼澤氣流 · 順著露珠星砂調整高度');}
 if(beat==='pollen'){for(let i=0,n=count(4);i<n;i++)addHazard(s,'wetlandPollen',1320+i*105,95+(i%3)*130,{vx:-68-i*7,phase:i});s.message('花粉泡泡正在聚集 · 從上下空隙穿過');}
 if(beat==='finale'){for(let i=0;i<9;i++)s.addPickup('gem',1280+i*42,240+Math.sin(i*.75)*125);s.message('螢火出口亮起 · 沿露珠航線完成濕地巡航');}
}

export function wetlandHit(s,e,damage=0){
 if(e.kind<28||e.kind>31||damage<=0)return;
 if(e.kind===30&&e.prismCD<=0){const absorbed=Math.min(damage*.55,e.maxHp-e.hp);e.hp+=absorbed;e.prismCD=1.35;e.prismFlash=.28;const a=Math.atan2(s.player.y-e.y,s.player.x-e.x);wetlandBullet(s,e.x-12,e.y,a-.65,145,4);wetlandBullet(s,e.x-12,e.y,a+.65,145,4);s.emit('wetlandPrism',e.x,e.y);s.message('露珠折光！直射能量分成上下兩道彩光');}
}
export function wetlandDefeat(s,e){
 if(e.kind<28||e.kind>31)return;
 if(e.kind===28){addHazard(s,'wetlandPoison',e.x,e.y,{r:48});s.emit('wetlandSpore',e.x,e.y);}
 if(e.kind===29){s.stats.wetlandElites=(s.stats.wetlandElites||0)+1;s.addPickup('gem',e.x,e.y-14);s.addPickup('gem',e.x,e.y+14);}
 if(e.kind===31){s.score+=600;s.stats.wetlandElites=(s.stats.wetlandElites||0)+1;s.addPickup('heart',e.x,e.y);s.addPickup('weapon',e.x+48,e.y);s.message('寄居蟹躲回茶杯休息！接住愛心與強化星星');s.emit('elite',e.x,e.y);}
}
export function wetlandHazard(s,h,dt){
 if(!h.kind.startsWith('wetland'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='wetlandPoison'){h.x-=32*dt;h.r=Math.min(76,h.r+dt*13);if(active&&Math.hypot((p.x-h.x)*.82,p.y-h.y)<h.r+s.hitRadius)s.environmentSlow=Math.min(s.environmentSlow,.68);}
 if(h.kind==='wetlandCurrent'){h.x-=58*dt;if(active&&Math.abs(p.x-h.x)<h.r+s.hitRadius&&Math.abs(p.y-h.y)<160)s.wetlandDrift+=h.dir*58;}
 if(h.kind==='wetlandSound'){h.currentRadius=24+Math.min(1,h.age/Math.max(.01,h.life+h.age))*210;const d=Math.hypot(p.x-h.x,p.y-h.y);if(active&&!h.hit&&Math.abs(d-h.currentRadius)<12+s.hitRadius){h.hit=true;s.hit();s.environmentSlow=Math.min(s.environmentSlow,.6);s.emit('wetlandDazed',p.x,p.y);}}
 if(h.kind==='wetlandPollen'){h.x+=(h.vx||-75)*dt;h.y+=Math.sin(h.age*3+(h.phase||0))*14*dt;if(active&&!h.hit&&Math.hypot(p.x-h.x,p.y-h.y)<h.r+s.hitRadius+8){h.hit=true;s.hit();h.life=.12;s.emit('wetlandPollenPop',h.x,h.y);for(let i=0;i<6;i++)wetlandBullet(s,h.x,h.y,i*Math.PI/3,82,4);}}
}
export function wetlandEnemy(s,e,dt){
 if(e.kind<28||e.kind>31)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.prismCD=(e.prismCD||0)-dt;e.prismFlash=Math.max(0,(e.prismFlash||0)-dt);
 if(e.kind===28){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*2.1+(e.floatPhase||0))*28,48,432);}
 else if(e.kind===29){e.x=Math.max(1030,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.45)*55,75,395);if(e.x<1190&&e.fireCD<=0){addHazard(s,'wetlandSound',e.x-28,e.y,{r:24});e.fireCD=2.7;s.emit('wetlandNote',e.x,e.y);}}
 else if(e.kind===30){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*2.6+e.id)*46,55,425);if(e.x<1180&&e.fireCD<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);wetlandBullet(s,e.x,e.y,a,122,4);e.fireCD=2.2;}}
 else{e.x=Math.max(1045,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.15)*34,90,390);if(e.x<1190&&e.fireCD<=0){for(let i=-1;i<=1;i++)addHazard(s,'wetlandPollen',e.x-42-i*13,e.y+i*42,{vx:-82-i*8,phase:i});e.fireCD=3.6;s.emit('wetlandSteam',e.x,e.y);}}
 if(e.x<-120)e.exit=true;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+s.hitRadius)s.hit();return true;
}
