export const SKY_FIELD={width:640,height:620,step:1/120};
export const SKY_WEAPONS=[{name:'青葉連射',short:'連射',color:0x9cfa96,tip:'集中火力，升級後增加並排彈道'},{name:'花瓣散彈',short:'散彈',color:0xffdc86,tip:'廣角覆蓋，適合攔截編隊'},{name:'陽光雷射',short:'雷射',color:0x91edff,tip:'高速穿透，適合前後排敵機'},{name:'追蹤種子',short:'追蹤',color:0xd1b7ff,tip:'自動轉向，移動救援也能攻擊'}];
export const SKY_DIFFICULTIES={rookie:{name:'見習',hp:6,shield:2,speed:.8,hpScale:.85},brave:{name:'勇敢',hp:4,shield:1,speed:1.12,hpScale:1.1}};
const DT=1/120,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function sweptSkyCircle(ax,ay,bx,by,cx,cy,r){const dx=bx-ax,dy=by-ay,ox=ax-cx,oy=ay-cy,a=dx*dx+dy*dy,b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-r*r;if(c<=0)return 0;if(a===0)return null;const d=b*b-4*a*c;if(d<0)return null;const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:null;}
export function skyRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export class SkySession{
 constructor(level,{difficulty='rookie',weapon=0}={}){
  if(!level||!Number.isFinite(level.duration)||level.duration<1||!level.kinds?.length||!['patrol','rescue','escort','defend','boss'].includes(level.type))throw Error('Invalid sky mission');
  this.level=structuredClone(level);this.difficulty=SKY_DIFFICULTIES[difficulty]?difficulty:'rookie';this.settings=SKY_DIFFICULTIES[this.difficulty];this.random=skyRandom(level.seed);this.time=0;this.accumulator=0;this.status='playing';this.paused=false;this.nextId=1;this.events=[];
  this.player={x:320,y:530,oldX:320,oldY:530,r:8,hp:this.settings.hp,shield:this.settings.shield,energy:70,power:level.power||0,weapon:clamp(Math.floor(weapon)||0,0,3),bombs:2,invuln:1.8,dash:0,dashCooldown:0,dashX:0,dashY:-1,charge:0,shotTimer:0,lastX:0,lastY:-1};
  this.enemies=[];this.shots=[];this.bullets=[];this.pickups=[];this.hazards=[];this.escort=level.type==='escort'?{x:320,y:548,r:28,hp:7,maxHp:7,invuln:0}:null;this.beacon=10;this.boss=null;this.bossSpawned=false;
  this.stats={kills:0,score:0,damage:0,rescued:0,missed:0,parts:0,bombs:0,dashes:0,charged:0,graze:0,maxCombo:0};this.combo=0;this.comboTime=0;this.nextWave=1.5;this.wave=0;this.nextRescue=5;this.rescueSpawned=0;this.nextWeather=8;this.lastCharge=false;this.lastDash=false;this.lastBomb=false;this.bombCooldown=0;
 }
 event(type,extra={}){this.events.push({type,...extra});if(this.events.length>120)this.events.shift();}
 get weaponLevel(){return 1+Math.min(2,Math.floor(this.player.power/2));}
 setWeapon(n){if(this.status!=='playing'||this.paused||!Number.isInteger(n)||n<0||n>3)return false;this.player.weapon=n;this.player.shotTimer=Math.max(this.player.shotTimer,.05);this.event('weapon');return true;}
 cancelCharge(){this.player.charge=0;this.lastCharge=false;this.lastDash=false;this.lastBomb=false;}
 setPaused(value){this.paused=Boolean(value);this.accumulator=0;this.cancelCharge();}
 spawnEnemy(kind,x,y=-35,extra={}){
  const stats={scout:[4,18,69],diver:[5,17,108],sniper:[9,23,39],carrier:[17,27,30],guard:[13,25,44]},v=stats[kind]||stats.scout;
  const e={id:this.nextId++,kind,x:clamp(x,38,602),y,oldX:x,oldY:y,baseX:clamp(x,45,595),hp:v[0]*this.settings.hpScale,maxHp:v[0]*this.settings.hpScale,r:v[1],speed:v[2],age:0,phase:this.random()*Math.PI*2,timer:.55+this.random()*.8,summon:4,aim:null,flash:0,...extra};this.enemies.push(e);return e;
 }
 spawnWave(){
  const l=this.level,index=this.wave++,kind=l.kinds[index%l.kinds.length],count=l.count+(this.difficulty==='brave'&&index%3===0?1:0);this.event('wave',{number:this.wave});
  for(let i=0;i<count;i++){const x=70+(500/Math.max(1,count-1))*i;this.spawnEnemy(kind,x,-38-Math.abs(i-(count-1)/2)*(index%3===0?32:12),{pattern:index%3});}
  if(index%3===1)this.spawnPickup('power',320,-20);if(index%4===2)this.spawnPickup('shield',index%2?140:500,-20);
 }
 spawnPickup(kind,x,y){const o={id:this.nextId++,kind,x,y,r:kind==='bird'?24:15,vy:kind==='bird'?34:54,age:0};this.pickups.push(o);return o;}
 spawnBoss(){
  const n=this.level.boss||0,hp=(480+n*90)*this.settings.hpScale,partHp=(62+n*14)*this.settings.hpScale;
  this.boss={id:this.nextId++,x:320,y:-120,oldX:320,oldY:-120,r:74,hp,maxHp:hp,age:0,phase:1,timer:2,cycle:0,flash:0,guard:0,parts:[{side:-1,hp:partHp,maxHp:partHp},{side:1,hp:partHp,maxHp:partHp}]};this.bossSpawned=true;this.bullets=[];this.hazards=[];this.player.invuln=Math.max(this.player.invuln,1.2);this.event('boss');
 }
 hostile(x,y,vx,vy,r=6,kind='orb'){
  if(this.bullets.length>=480)return;const mul=this.settings.speed;this.bullets.push({id:this.nextId++,x,y,oldX:x,oldY:y,vx:vx*mul,vy:vy*mul,r,kind,age:0,grazed:false});
 }
 fan(x,y,count,speed,width=.6,angle=Math.PI/2){for(let i=0;i<count;i++){const a=angle+(count===1?0:(i/(count-1)-.5)*width);this.hostile(x,y,Math.cos(a)*speed,Math.sin(a)*speed);}}
 aimed(e,speed=135,count=1){const target=this.escort&&e.kind==='sniper'?this.escort:this.player,a=Math.atan2(target.y-e.y,target.x-e.x);this.fan(e.x,e.y+15,count,speed,.3,a);}
 warning(x,width=50,duration=.85,kind='beam'){const h={id:this.nextId++,x:clamp(x,width/2,640-width/2),w:width,age:0,warn:duration,active:.38,kind};this.hazards.push(h);this.event('warning',{x:h.x});return h;}
 firePlayer(charged=false){
  const p=this.player,L=this.weaponLevel,w=p.weapon;if(this.shots.length>200)return;
  const shot=(dx,vx,vy,damage,r,kind,pierce=1)=>this.shots.push({id:this.nextId++,x:p.x+dx,y:p.y-22,oldX:p.x+dx,oldY:p.y-22,vx,vy,damage,r,kind,pierce,hit:new Set(),age:0});
  if(charged){const ratio=Math.min(1,p.charge/1.2);shot(0,0,-730,12+L*3+(10+L*2)*ratio,13+6*ratio,'charge',7);this.stats.charged++;this.event('charge');return;}
  if(w===0){const n=L;for(let i=0;i<n;i++)shot((i-(n-1)/2)*13,0,-720,2.1+L*.3,4,'leaf');p.shotTimer=.16;}
  if(w===1){const n=3+(L-1)*2;for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.14;shot(0,Math.sin(a)*590,-Math.cos(a)*590,1.55+L*.1,4,'petal');}p.shotTimer=.23;}
  if(w===2){shot(0,0,-1000,3.4+L*.8,5+L,'laser',3+L);p.shotTimer=.19;}
  if(w===3){for(let i=0;i<(L===1?1:2);i++)shot((i?1:-1)*10,(i?1:-1)*60,-420,1.8+L*.55,5,'seed');p.shotTimer=.24;}
 }
 useBomb(){
  if(this.status!=='playing'||this.paused||this.player.bombs<=0||this.bombCooldown>0)return false;this.player.bombs--;this.stats.bombs++;this.bombCooldown=.8;this.bullets=[];this.hazards=[];this.player.invuln=Math.max(this.player.invuln,1.1);
  for(const e of [...this.enemies])this.damageEnemy(e,30);if(this.boss){for(const part of this.boss.parts)if(part.hp>0)this.damagePart(part,14);this.damageBoss(22);}
  this.event('bomb');return true;
 }
 hitPlayer(){const p=this.player;if(p.invuln>0||this.status!=='playing')return false;if(p.shield>0)p.shield--;else p.hp--;this.stats.damage++;p.invuln=1.5;p.energy=Math.min(100,p.energy+8);this.combo=0;this.event('hurt');if(p.hp<=0)this.finish(false,'飛機裝甲用完了');return true;}
 damageEnemy(e,amount){if(e.hp<=0)return;e.hp-=amount;e.flash=.08;if(e.hp<=0){this.stats.kills++;this.combo=this.comboTime>0?Math.min(5,this.combo+1):1;this.comboTime=2.8;this.stats.maxCombo=Math.max(this.stats.maxCombo,this.combo);this.stats.score+=100+25*(this.combo-1);this.player.energy=Math.min(100,this.player.energy+5);this.event('kill',{x:e.x,y:e.y});if(this.stats.kills%5===0)this.spawnPickup('power',e.x,e.y);if(this.stats.kills%14===0)this.spawnPickup('bomb',e.x,e.y);}}
 damagePart(part,amount){if(part.hp<=0||this.boss?.y<100||this.boss?.guard>0)return;part.hp-=amount;if(part.hp<=0){this.stats.parts++;this.stats.score+=450;this.player.energy=Math.min(100,this.player.energy+15);this.event('part',{side:part.side});}}
 damageBoss(amount){const b=this.boss;if(!b||b.hp<=0||b.y<100||b.guard>0)return;const protectedCore=b.parts.some(p=>p.hp>0);b.hp-=amount*(protectedCore?.38:1);b.flash=.07;if(b.hp<=0){this.stats.score+=2000;this.event('bossDown',{x:b.x,y:b.y});this.finish(true);}}
 bossAttack(){
  const b=this.boss,n=this.level.boss,parts=b.parts.filter(p=>p.hp>0).length;b.cycle++;const c=b.cycle,phase=b.phase,speed=105+phase*17+n*4;
  if(n===0){this.fan(b.x,b.y+35,3+parts*2,speed,.7+phase*.14);if(phase>=2&&c%2===0)this.fan(b.x,b.y+42,3,150,.2,Math.atan2(this.player.y-b.y,this.player.x-b.x));}
  if(n===1){for(let i=0;i<7;i++)if(i%2===c%2)this.fan(60+i*85,b.y+35,1,speed);if(phase>=2&&c%3===0)this.warning(this.player.x,50,.95);if(parts)this.fan(b.x,b.y+25,parts*2+1,100,.8);}
  if(n===2){const count=10+phase*2+parts;for(let i=0;i<count;i++){if(i===c%count||i===(c+1)%count)continue;const a=(i/count)*Math.PI*2+c*.22;this.hostile(b.x,b.y,Math.cos(a)*speed,Math.sin(a)*speed);}if(phase>=2&&c%3===0)this.warning(this.player.x,55,1);}
  if(n===3){this.fan(b.x,b.y+30,5+parts*2,speed,1.5);if(c%2===0)this.warning(80+(c*113)%480,62,.95,'lava');if(phase>=2&&c%3===0){this.spawnEnemy('diver',100);this.spawnEnemy('diver',540);}}
  if(n===4){if(c%3===0){for(let i=0;i<15;i++){if(i%5===c%5)continue;const a=i*Math.PI*2/15+c*.3;this.hostile(b.x,b.y,Math.cos(a)*speed,Math.sin(a)*speed);}}else this.fan(b.x,b.y+35,5+parts*2,speed,1.1,Math.PI/2+Math.sin(c)*.3);if(phase>=2&&c%2===0)this.warning(this.player.x,phase===3?70:50,1);if(phase===3&&c%4===0){this.spawnEnemy('guard',120);this.spawnEnemy('guard',520);}}
  b.timer=Math.max(.8,1.85-phase*.23-n*.07)+(2-parts)*.12;
 }
 advance(seconds,input={}){if(this.paused||this.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return;this.accumulator+=Math.min(.1,seconds);while(this.accumulator+1e-9>=DT&&this.status==='playing'){this.accumulator-=DT;this.step(input);}}
 step(input){
  this.time+=DT;const p=this.player,l=this.level;this.bombCooldown=Math.max(0,this.bombCooldown-DT);p.invuln=Math.max(0,p.invuln-DT);p.dashCooldown=Math.max(0,p.dashCooldown-DT);p.shotTimer-=DT;p.energy=Math.min(100,p.energy+DT*1.4);this.comboTime-=DT;
  if(Number.isInteger(input.weapon)&&input.weapon!==p.weapon)this.setWeapon(input.weapon);
  let dx=clamp(Number(input.xAxis)||0,-1,1),dy=clamp(Number(input.yAxis)||0,-1,1);if(!dx&&!dy&&input.target&&Number.isFinite(input.target.x)&&Number.isFinite(input.target.y)){const tx=input.target.x-p.x,ty=input.target.y-p.y,d=Math.hypot(tx,ty);if(d>2){dx=tx/d;dy=ty/d;const limit=(input.focus||input.charge?170:340)*DT;if(d<limit){dx*=d/limit;dy*=d/limit;}}}
  const norm=Math.hypot(dx,dy);if(norm>1){dx/=norm;dy/=norm;}const directionLength=Math.hypot(dx,dy);if(directionLength>.1){p.lastX=dx/directionLength;p.lastY=dy/directionLength;}
  if(input.dash&&!this.lastDash&&p.dashCooldown<=0){p.dash=.17;p.dashCooldown=3.5;p.invuln=Math.max(p.invuln,.36);p.dashX=p.lastX;p.dashY=p.lastY;this.stats.dashes++;this.event('dash');}
  if(input.bomb&&!this.lastBomb)this.useBomb();this.lastDash=Boolean(input.dash);this.lastBomb=Boolean(input.bomb);
  p.oldX=p.x;p.oldY=p.y;let speed=input.focus||input.charge?170:340;if(p.dash>0){speed=1000;dx=p.dashX;dy=p.dashY;p.dash=Math.max(0,p.dash-DT);}
  const wind=(l.wind||0)*Math.sin(this.time*.55);p.x=clamp(p.x+(dx*speed+wind)*DT,22,618);p.y=clamp(p.y+dy*speed*DT,175,590);
  if(input.charge){p.charge=Math.min(1.2,p.charge+DT);}else if(this.lastCharge){if(p.charge>=.6&&p.energy>=35){p.energy-=35;this.firePlayer(true);p.shotTimer=.3;}p.charge=0;}
  this.lastCharge=Boolean(input.charge);if(!input.charge&&p.shotTimer<=0)this.firePlayer();
  const cutoff=l.type==='boss'?l.duration-5:l.duration-7;if(this.time>=this.nextWave&&this.time<cutoff){this.spawnWave();this.nextWave+=l.interval;}
  if(l.type==='boss'&&!this.bossSpawned&&this.time>=l.duration)this.spawnBoss();
  if(l.type==='rescue'&&this.rescueSpawned<l.rescueTotal&&this.time>=this.nextRescue){const i=this.rescueSpawned++;this.spawnPickup('bird',100+(i*173+Math.floor(this.random()*70))%440,-25);this.nextRescue=5+(this.rescueSpawned*(l.duration-19)/(l.rescueTotal-1));}
  if(l.weather&&this.time>=this.nextWeather){this.warning(70+(this.wave*127)%500,48,.95,l.theme===3?'lava':'beam');this.nextWeather+=l.weather;}
  if(this.escort){this.escort.x=320+Math.sin(this.time*.25)*135;this.escort.invuln=Math.max(0,this.escort.invuln-DT);}
  this.moveEnemies();this.moveShots();this.moveHostiles();this.movePickups();this.updateBoss();this.updateHazards();
  if(this.status!=='playing')return;
  if(l.type!=='boss'&&this.time>=l.duration+8){const ok=l.type==='rescue'?this.stats.rescued>=l.rescueGoal:l.type==='escort'?this.escort.hp>0:l.type==='defend'?this.beacon>0:this.stats.kills>=l.killGoal;this.finish(ok,ok?'':l.type==='rescue'?'救援數量還不夠':'擊退敵機數量還不夠');}
  if(l.type==='boss'&&this.time>l.duration+150)this.finish(false,'頭目突破了防線');
 }
 moveEnemies(){
  for(const e of this.enemies){if(e.hp<=0)continue;e.oldX=e.x;e.oldY=e.y;e.age+=DT;e.flash=Math.max(0,e.flash-DT);e.timer-=DT;
   if(e.kind==='diver'){e.x=clamp(e.baseX+Math.sin(e.age*2.2+e.phase)*70,24,616);e.y+=e.speed*DT*(e.age>2?1.45:1);}
   else{e.x=clamp(e.baseX+Math.sin(e.age*(e.pattern===1?2:1)+e.phase)*(e.pattern===2?85:30),25,615);e.y+=e.speed*DT;if(['sniper','carrier','guard'].includes(e.kind)&&e.y>110&&e.age<6)e.y-=e.speed*DT*.9;}
   if(e.kind==='carrier'){e.summon-=DT;if(e.summon<=0&&e.y>20&&e.y<350&&this.enemies.length<28){e.summon=4.5;this.spawnEnemy('scout',e.x-45,e.y+25);this.spawnEnemy('scout',e.x+45,e.y+25);}}
   if(e.aim){e.aim.time-=DT;if(e.aim.time<=0){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x);this.fan(e.x,e.y+18,1,220,0,a);e.aim=null;e.timer=2.8;}}
   else if(e.timer<=0&&e.y>15&&e.y<440){if(e.kind==='sniper'){const target=this.escort||this.player;e.aim={x:target.x,y:target.y,time:.85};}else{this.aimed(e,e.kind==='diver'?145:115,e.kind==='guard'?3:e.kind==='carrier'?5:1);e.timer=e.kind==='carrier'?2.6:2.1;}}
   if(Math.hypot(e.x-this.player.x,e.y-this.player.y)<e.r+this.player.r)this.hitPlayer();
   if(e.y>665){e.hp=0;this.stats.missed++;if(this.level.type==='defend'){this.beacon=Math.max(0,this.beacon-1);this.event('leak');if(this.beacon<=0)this.finish(false,'防線耐久用完了');}}
  }
  this.enemies=this.enemies.filter(e=>e.hp>0);
 }
 updateBoss(){const b=this.boss;if(!b||b.hp<=0||this.status!=='playing')return;b.oldX=b.x;b.oldY=b.y;b.age+=DT;b.guard=Math.max(0,b.guard-DT);b.flash=Math.max(0,b.flash-DT);b.y=Math.min(110,b.y+90*DT);b.x=320+Math.sin(b.age*.65)*(95+(this.level.boss||0)*7);
  const phase=b.hp>b.maxHp*.67?1:b.hp>b.maxHp*.34?2:3;if(phase!==b.phase){b.phase=phase;b.guard=1.15;this.bullets=[];this.player.invuln=Math.max(this.player.invuln,.7);this.event('phase',{phase});b.timer=1.4;}
  if(b.y>=100){b.timer-=DT;if(b.timer<=0)this.bossAttack();}if(Math.hypot(b.x-this.player.x,b.y-this.player.y)<b.r+this.player.r)this.hitPlayer();
 }
 targets(){const a=this.enemies.filter(e=>e.hp>0).map(e=>({key:`e${e.id}`,x:e.x,y:e.y,r:e.r,entity:e}));const b=this.boss;if(b&&b.hp>0&&b.y>0){for(const part of b.parts)if(part.hp>0)a.push({key:`p${part.side}`,x:b.x+part.side*65,y:b.y+18,r:23,part});a.push({key:'core',x:b.x,y:b.y,r:35,boss:true});}return a;}
 moveShots(){
  const targets=this.targets();for(const s of this.shots){s.oldX=s.x;s.oldY=s.y;s.age+=DT;if(s.kind==='seed'){const target=targets.filter(t=>t.y<s.y+25&&!s.hit.has(t.key)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];if(target){const a=Math.atan2(target.y-s.y,target.x-s.x),blend=Math.min(1,DT*5);s.vx+=(Math.cos(a)*470-s.vx)*blend;s.vy+=(Math.sin(a)*470-s.vy)*blend;}}
   s.x+=s.vx*DT;s.y+=s.vy*DT;const hits=[];for(const t of targets){if(s.hit.has(t.key)||t.entity?.hp<=0||t.part?.hp<=0)continue;const u=sweptSkyCircle(s.oldX,s.oldY,s.x,s.y,t.x,t.y,s.r+t.r);if(u!==null)hits.push({t,u});}hits.sort((a,b)=>a.u-b.u);
   for(const {t}of hits){if(s.pierce<=0)break;s.hit.add(t.key);s.pierce--;if(t.entity)this.damageEnemy(t.entity,s.damage);else if(t.part)this.damagePart(t.part,s.damage);else this.damageBoss(s.damage);}
  }
  this.shots=this.shots.filter(s=>s.pierce>0&&s.y>-100&&s.y<680&&s.x>-50&&s.x<690&&s.age<3);
 }
 moveHostiles(){const p=this.player;for(const b of this.bullets){b.oldX=b.x;b.oldY=b.y;b.x+=b.vx*DT;b.y+=b.vy*DT;b.age+=DT;
   if(sweptSkyCircle(b.oldX-p.oldX,b.oldY-p.oldY,b.x-p.x,b.y-p.y,0,0,b.r+p.r)!==null){b.dead=true;this.hitPlayer();}
   else if(!b.grazed&&Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r+15){b.grazed=true;this.stats.graze++;p.energy=Math.min(100,p.energy+1);}
   const e=this.escort;if(e&&!b.dead&&sweptSkyCircle(b.oldX,b.oldY,b.x,b.y,e.x,e.y,b.r+e.r)!==null){b.dead=true;if(e.invuln<=0){e.hp--;e.invuln=1;this.event('escortHurt');if(e.hp<=0)this.finish(false,'補給艇裝甲用完了');}}
  }this.bullets=this.bullets.filter(b=>!b.dead&&b.x>-30&&b.x<670&&b.y>-60&&b.y<660&&b.age<9);
 }
 movePickups(){const p=this.player;for(const o of this.pickups){o.age+=DT;o.y+=o.vy*DT;const d=Math.hypot(o.x-p.x,o.y-p.y);if(o.kind!=='bird'&&d<100){o.x+=(p.x-o.x)*DT*5;o.y+=(p.y-o.y)*DT*5;}
   if(d<o.r+18){o.dead=true;if(o.kind==='bird'){this.stats.rescued++;this.stats.score+=500;p.energy=Math.min(100,p.energy+12);this.event('rescue',{x:o.x,y:o.y});}else if(o.kind==='power'){p.power=Math.min(6,p.power+1);this.stats.score+=80;this.event('power');}else if(o.kind==='shield'){p.shield=Math.min(3,p.shield+1);if(this.escort)this.escort.hp=Math.min(this.escort.maxHp,this.escort.hp+1);this.event('shield');}else if(o.kind==='bomb'){p.bombs=Math.min(3,p.bombs+1);this.event('supply');}}
  }this.pickups=this.pickups.filter(o=>!o.dead&&o.y<675);
 }
 updateHazards(){const p=this.player;for(const h of this.hazards){h.age+=DT;if(h.age>=h.warn&&h.age<h.warn+h.active&&Math.abs(p.x-h.x)<h.w/2+p.r)this.hitPlayer();}this.hazards=this.hazards.filter(h=>h.age<h.warn+h.active);}
 challengeMet(){const c=this.level.challenge;return c.type==='kills'?this.stats.kills>=c.value:c.type==='rescue'?this.stats.rescued>=c.value:c.type==='parts'?this.stats.parts>=c.value:c.type==='escort'?(this.escort?.hp||0)>=c.value:this.beacon>=c.value;}
 medals(){const won=this.status==='won';return [won,won&&this.stats.damage<=this.level.damageStar,won&&this.challengeMet()];}
 finish(won,reason=''){if(this.status!=='playing')return;this.status=won?'won':'lost';this.reason=reason;this.cancelCharge();this.event(won?'won':'lost');}
}
