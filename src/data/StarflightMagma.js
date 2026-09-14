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
 const cap=kind==='magmaCoal'?7:kind==='magmaCaramel'?5:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;
 let life=4.4,warn=.75,r=24;if(kind==='magmaGeyser'){life=3.2;warn=1;r=34;}else if(kind==='magmaFlame'){life=2.2;warn=.85;r=27;}else if(kind==='magmaCaramel'){life=4.8;warn=.65;r=42;}
 const h={id:++s.id,kind,x,y,age:0,life,warn,r,...extra};s.hazards.push(h);return h;
}
export function magmaEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.magmaWaves=(s.stats.magmaWaves||0)+1;
 if(beat==='slimes'){for(let i=0,n=count(4);i<n;i++){const e=s.spawn(32,1340+i*105,395-(i%2)*70,'magmaSlime',group);e.jumpPhase=i*.55;}s.message('焦糖史萊姆會高高跳起 · 留意落下的黏性焦糖球');}
 if(beat==='salamander'){const e=s.spawn(33,1420,190+plan*42,'magmaSalamander',group);e.fireCD=1.4;s.message('風箱火蜥蜴正在吸氣 · 遠離發亮的橫向火舌');s.emit('warning',e.x,e.y);}
 if(beat==='tanuki'){const e=s.spawn(34,1390,78+plan*22,'magmaTanuki',group);e.fireCD=1.1;s.message('炭火熱氣球狸貓 · 紅圈亮起後木炭才會落下');}
 if(beat==='popbirds'){for(let i=0,n=count(6);i<n;i++){const e=s.spawn(35,1320+i*72,70+(i%4)*100,'magmaPopbird',group);e.heat=.65+i*.12;}s.message('爆米花火花鳥變紅後會啵一聲散成三顆玉米火花');}
 if(beat==='geyser'){for(let i=0;i<3;i++)addHazard(s,'magmaGeyser',660+i*235,447,{r:31+i%2*5,phase:i});for(let i=0;i<7;i++)s.addPickup('gem',720+i*72,plan===2?130+i%2*210:245+Math.sin(i)*100);s.message('岩漿海出現金色光圈 · 噴泉爆發前穿過安全縫隙');}
 if(beat==='emberRain'){for(let i=0;i<5;i++)addHazard(s,'magmaCoal',690+i*135,-25,{r:18+i%2*3,warn:.65+i*.1,vx:-35-i*8,vy:0});s.message('炭火雨預警 · 看清紅圈後再改變高度');}
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
 if(e.kind===33){s.score+=4;s.stats.magmaElites=(s.stats.magmaElites||0)+1;s.addPickup('weapon',e.x+50,e.y);s.message('風箱火蜥蜴熄火休息！接住變色星芽鈴');s.emit('elite',e.x,e.y);}
}
export function magmaHazard(s,h,dt){
 if(!h.kind.startsWith('magma'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='magmaCaramel'){h.x-=38*dt;h.r=Math.min(64,h.r+dt*9);if(active&&Math.hypot((p.x-h.x)*.82,p.y-h.y)<h.r+s.hitRadius)s.environmentSlow=Math.min(s.environmentSlow,.62);}
 if(h.kind==='magmaGeyser'&&active){h.height=Math.min(390,(h.height||0)+dt*640);if(!h.hit&&Math.abs(p.x-h.x)<h.r+s.hurtbox.rx&&p.y+s.hurtbox.ry>445-h.height){h.hit=true;s.hit();s.emit('magmaScorch',p.x,p.y);}}
 if(h.kind==='magmaCoal'&&active){h.vy=Math.min(430,(h.vy||0)+670*dt);h.x+=(h.vx||-45)*dt;h.y+=h.vy*dt;if(!h.hit&&s.bodyCircle(h.x,h.y,h.r+5)){h.hit=true;s.hit();}if(h.y>438&&!h.burst){h.burst=true;h.life=.18;s.emit('magmaCoalBurst',h.x,438);for(let i=-1;i<=1;i++)magmaBullet(s,h.x,435,Math.PI+i*.42,88,4);}}
 if(h.kind==='magmaFlame'&&active&&!h.hit&&p.x-s.hurtbox.rx<h.x&&Math.abs(p.y-h.y)<h.r+s.hitRadius){h.hit=true;s.hit();s.emit('magmaScorch',p.x,p.y);}
}
export function magmaEnemy(s,e,dt){
 if(e.kind<32||e.kind>35)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.armorFlash=Math.max(0,(e.armorFlash||0)-dt);
 if(e.kind===32){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY-Math.abs(Math.sin(e.age*2.2+(e.jumpPhase||0)))*180,70,425);if(e.x<1160&&e.fireCD<=0){for(const off of [-.28,0,.28])magmaBullet(s,e.x-16,e.y,Math.PI+off,104,5,{gravity:95});e.fireCD=2.4;}}
 else if(e.kind===33){e.armor??=42;e.x=Math.max(1030,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.1)*35,90,385);if(e.x<1185&&e.fireCD<=0){e.inhale=.8;e.fireCD=3.8;s.emit('magmaInhale',e.x,e.y);}if(e.inhale>0){e.inhale-=dt;p.x=clamp(p.x+42*dt,30,1225);if(e.inhale<=0)addHazard(s,'magmaFlame',e.x-45,e.y,{r:28});}}
 else if(e.kind===34){e.x=Math.max(1015,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.35)*40,55,215);if(e.x<1190&&e.fireCD<=0){addHazard(s,'magmaCoal',clamp(p.x+180,520,980),-20,{r:21,warn:.9,vx:-25,vy:0});e.fireCD=2.25;s.emit('magmaDrop',e.x,e.y);}}
 else{e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+Math.sin(e.age*3.4+e.id)*45,45,435);e.heat=(e.heat||0)-dt;if(e.heat<=0&&!e.popped){e.popped=true;e.exit=true;for(const off of [-.48,0,.48])magmaBullet(s,e.x,e.y,Math.PI+off,96,4);s.emit('magmaPopcorn',e.x,e.y);}}
 if(e.x<-120)e.exit=true;if(s.bodyCircle(e.x,e.y,e.r))s.hit();return true;
}
