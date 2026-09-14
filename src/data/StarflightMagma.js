// Caramel magma sea: gameplay helpers without a Phaser dependency.
export const MAGMA_PLANS=['焦糖噴泉道','風箱熔爐','火花熱氣球祭'];
export const MAGMA_ENEMIES=[
 {name:'焦糖熔岩史萊姆',hp:24,r:23,speed:112},
 {name:'鐵皮風箱火蜥蜴',hp:108,r:39,speed:62},
 {name:'炭火熱氣球狸貓',hp:82,r:34,speed:74},
 {name:'爆米花火花鳥',hp:15,r:18,speed:205}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const magmaPlan=(map,seed)=>Number.isInteger(map?.magmaScenario)&&map.magmaScenario>=0?map.magmaScenario%3:((seed>>>5)+(map?.index||0)*13)%3;
export function magmaTimeline(map,seed,index,start=index*58){
 const plan=magmaPlan(map,seed),schedules=[
  [[3,'popbirds'],[9,'slimes'],[15,'geyser'],[21,'tanuki'],[28,'slimes'],[35,'salamander'],[41,'finale']],
  [[3,'slimes'],[10,'popbirds'],[16,'emberRain'],[22,'salamander'],[29,'slimes'],[35,'tanuki'],[41,'finale']],
  [[3,'tanuki'],[9,'popbirds'],[16,'geyser'],[22,'slimes'],[29,'emberRain'],[35,'salamander'],[41,'finale']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'magmaStory',beat,plan,index}));
}
function magmaBullet(s,x,y,a,v=120,r=5,extra={}){const speed=v*s.tuning.enemyBulletScale;s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,magma:true,...extra});}
function addHazard(s,kind,x,y,extra={}){
 const cap=kind==='magmaCoal'?3:kind==='magmaCaramel'?5:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 let life=4.4,warn=.75,r=24;if(kind==='magmaGeyser'){life=3.2;warn=1;r=34;}else if(kind==='magmaFlame'){life=2.2;warn=.85;r=27;}else if(kind==='magmaCaramel'){life=4.8;warn=.65;r=42;}
 const h={id:++s.id,kind,x,y,age:0,life,warn,r,...extra};if(kind==='magmaCoal'){h.r=(extra.r||21)*3;h.warn=2;h.life=6;h.x=80+s.random()*1120;h.y=-h.r-10;h.vx=0;h.vy=0;h.meteor=true;}s.hazards.push(h);return h;
}
export const spawnMagmaMeteor=(s,r=21)=>addHazard(s,'magmaCoal',0,0,{r});
export function magmaEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.magmaWaves=(s.stats.magmaWaves||0)+1;
 if(beat==='slimes'){for(let i=0,n=count(4);i<n;i++){const e=s.spawn(32,1340+i*105,395-(i%2)*70,'magmaSlime',group);e.jumpPhase=i*.55;}s.message('焦糖史萊姆會高高跳起 · 留意落下的黏性焦糖球');}
 if(beat==='salamander'){const e=s.spawn(33,1420,420,'magmaSalamander',group);e.fireCD=1.4;s.message('風箱火蜥蜴正在吸氣 · 停下蓄火後會朝你噴出火球');s.emit('warning',e.x,e.y);}
 if(beat==='tanuki'){const e=s.spawn(34,1390,78+plan*22,'magmaTanuki',group);e.fireCD=1.1;s.message('炭火熱氣球狸貓 · 提起炸彈後會朝你拋射');}
 if(beat==='popbirds'){for(let i=0,n=count(6);i<n;i++){const e=s.spawn(35,1320+i*72,70+(i%4)*100,'magmaPopbird',group);e.heat=.65+i*.12;}s.message('爆米花火花鳥變紅後會啵一聲散成三顆玉米火花');}
 if(beat==='geyser'){addHazard(s,'magmaGeyser',s.player.x,455,{warn:2,life:3.5,r:32});s.message('腳下火柱 · 箭頭預警兩秒，立刻離開落點');}
 if(beat==='emberRain'){for(let i=0;i<5;i++)addHazard(s,'magmaCoal',690+i*135,-25,{r:18+i%2*3,warn:.65+i*.1,vx:-35-i*8,vy:0});s.message('炭火雨預警 · 離開上方箭頭對準的落點');}
 if(beat==='finale'){for(let i=0;i<9;i++)s.addPickup('gem',1280+i*42,240+Math.sin(i*.72)*128);s.message('火山夕陽出口亮起 · 沿金色星砂完成熔火巡航');}
}
export function magmaHit(s,e,damage=0){
 if(e.kind<32||e.kind>35||damage<=0)return;
 if(e.kind===33&&e.armor>0){const absorbed=Math.min(damage*.45,e.armor);e.armor-=absorbed;e.hp=Math.min(e.maxHp,e.hp+absorbed);e.armorFlash=.2;if(e.armor<=0){s.emit('magmaArmorBreak',e.x,e.y);s.message('風箱翼甲裂開了 · 火蜥蜴失去正面減傷');}}
 if(e.kind===35)e.heat=Math.max(.12,(e.heat||1)-damage*.012);
}
export function magmaDefeat(s,e){
 if(e.kind<32||e.kind>35)return;
 if(e.kind===32){addHazard(s,'magmaCaramel',e.x,e.y,{r:38});s.emit('magmaSplash',e.x,e.y);}
 if(e.kind===34){s.stats.magmaElites=(s.stats.magmaElites||0)+1;s.addPickup('gem',e.x,e.y-15);s.addPickup('gem',e.x,e.y+15);}
 if(e.kind===33){s.score+=5;s.stats.magmaElites=(s.stats.magmaElites||0)+1;s.addPickup('gem',e.x,e.y);s.addPickup('weapon',e.x+50,e.y);s.message('風箱火蜥蜴熄火休息！接住結晶與星芽鈴');s.emit('elite',e.x,e.y);}
}
export function magmaHazard(s,h,dt){
 if(!h.kind.startsWith('magma'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='magmaCaramel'){h.x-=38*dt;h.r=Math.min(64,h.r+dt*9);if(active&&Math.hypot((p.x-h.x)*.82,p.y-h.y)<h.r+s.hitRadius)s.environmentSlow=Math.min(s.environmentSlow,.62);}
 if(h.kind==='magmaGeyser'&&active){const t=h.age-h.warn;h.height=Math.min(390,t*1100);if(!h.erupted){h.erupted=true;s.emit('magmaScorch',h.x,455);}if(t<1.2&&!h.hit&&Math.abs(p.x-h.x)<h.r+s.hitRadius&&p.y>455-h.height){h.hit=true;s.hit();}}
 if(h.kind==='magmaCoal'&&active){h.vy=Math.min(430,(h.vy||0)+670*dt);h.x+=(h.vx??-45)*dt;h.y+=h.vy*dt;if(!h.hit&&s.bodyCircle(h.x,h.y,h.r)){h.hit=true;s.hit();}if(h.y>438&&!h.burst){h.burst=true;h.life=.18;s.emit('magmaCoalBurst',h.x,438);for(let i=-1;i<=1;i++)magmaBullet(s,h.x,435,Math.PI+i*.42,88,4);}}
 if(h.kind==='magmaFlame'&&active&&!h.hit&&p.x<h.x&&Math.abs(p.y-h.y)<h.r+s.hitRadius){h.hit=true;s.hit();s.emit('magmaScorch',p.x,p.y);}
}
export function magmaEnemy(s,e,dt){
 if(e.kind<32||e.kind>35)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.armorFlash=Math.max(0,(e.armorFlash||0)-dt);e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);
 if(e.kind===32){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY-Math.abs(Math.sin(e.age*2.2+(e.jumpPhase||0)))*180,70,425);if(e.x<1160&&e.fireCD<=0){for(const off of [-.28,0,.28])magmaBullet(s,e.x-16,e.y,Math.PI+off,104,5,{gravity:95});e.fireCD=2.4;}}
 else if(e.kind===33){e.armor??=42;e.y=420;
  if(e.windup>0){e.windup-=dt;if(e.windup<=0){const a=Math.atan2(p.y-(e.y-12),p.x-(e.x-55));magmaBullet(s,e.x-55,e.y-12,a,210,9,{magmaFireball:true});e.attackAnim=.4;s.emit('magmaDrop',e.x-55,e.y-12);}}
  else {e.x-=e.speed*speed*dt;if(e.x<220)e.exit=true;if(e.x<1160&&e.fireCD<=0){e.windup=.7;e.fireCD=3.1;}}
 }
 else if(e.kind===34){e.x=Math.max(980,e.x-e.speed*speed*dt);e.y=150+Math.sin(e.age*1.35)*22;
  if(e.throwWindup>0){e.throwWindup-=dt;if(e.throwWindup<=0){throwMagmaBomb(s,e.x-10,e.y+52);e.attackAnim=.55;s.emit('magmaDrop',e.x,e.y+52);}}
  else if(e.x<1190&&e.fireCD<=0){e.throwWindup=.6;e.fireCD=3.5;}
 }

 else{e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*3.4+e.id)*45,45,435);e.heat=(e.heat||0)-dt;if(e.heat<=0&&!e.popped){e.popped=true;e.exit=true;for(const off of [-.48,0,.48])magmaBullet(s,e.x,e.y,Math.PI+off,96,4);s.emit('magmaPopcorn',e.x,e.y);}}
 if(e.x<-120)e.exit=true;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+s.hitRadius)s.hit();return true;
}

export function throwMagmaBomb(s,x,y){const target={x:s.player.x,y:s.player.y},fuse=1.6,gravity=240;
 magmaBullet(s,x,y,0,0,12,{magmaBomb:true,age:0,fuse,gravity,vx:(target.x-x)/fuse,vy:(target.y-y-.5*gravity*fuse*fuse)/fuse,target,life:3});return s.bullets.at(-1);
}
export function stepMagmaBomb(s,b,dt){
 const ox=b.x,oy=b.y,t=Math.min(dt,Math.max(0,b.fuse-b.age));b.x+=b.vx*t;b.y+=b.vy*t+.5*b.gravity*t*t;b.vy+=b.gravity*t;b.age+=dt;b.life-=dt;
 if(s.blockOwlBullet(b,ox,oy))return;
 if(b.age>=b.fuse-1e-9||s.bodySweep(ox,oy,b.x,b.y,b.r)||b.y>=455){b.life=0;s.emit('magmaBombBurst',b.x,b.y);if(s.bodyCircle(b.x,b.y,60))s.hit();}
}
