// One source of truth for warnings and hits. All positions are ground coordinates.
export const PUMPKIN_COMBAT=Object.freeze({rx:105,ry:65,windup:.7,leap:.55,recovery:.9,throwWindup:.65,throwRecovery:.65,shotSpeed:185,shotRange:420,shotRadius:28,playerRadius:12});
export function insideSlam(p,target){return ((p.x-target.x)/PUMPKIN_COMBAT.rx)**2+((p.y-target.y)/PUMPKIN_COMBAT.ry)**2<=1;}
function enter(b,phase){b.phase=phase;b.elapsed=0;}
function clearOwned(j,id){j.projectiles=j.projectiles.filter(s=>s.ownerBoss!==id);j.traps=(j.traps||[]).filter(s=>s.ownerBoss!==id);}
export function clearPumpkinAttacks(j,mob){clearOwned(j,mob.id);mob.boss=null;}
export function updatePumpkinBossV321(j,m,dt,walkable=()=>true){
 if(!m.alive)return;dt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
 const b=m.boss||(m.boss={phase:'idle',elapsed:0,cooldown:1.1,turn:0});
 const d=Math.hypot(j.player.x-m.x,j.player.y-m.y),home=Math.hypot(m.x-m.homeX,m.y-m.homeY);
 if(j.downed||!m.aggro||d>650||home>460){
  if(b.phase!=='idle')clearOwned(j,m.id);m.aggro=false;enter(b,'idle');b.cooldown=1.1;
  if(home>5&&!j.downed)j.moveBody(m,(m.homeX-m.x)/home*28*dt,(m.homeY-m.y)/home*28*dt);
  return;
 }
 m.faceLeft=j.player.x<m.x;b.elapsed+=dt;b.cooldown=Math.max(0,(b.cooldown||0)-dt);
 if(b.phase==='slamWindup'){if(b.elapsed>=PUMPKIN_COMBAT.windup)enter(b,'leap');return;}
 if(b.phase==='leap'){
  const p=Math.min(1,b.elapsed/PUMPKIN_COMBAT.leap);m.x=b.origin.x+(b.target.x-b.origin.x)*p;m.y=b.origin.y+(b.target.y-b.origin.y)*p;
  if(p>=1){
   // A newly edited collision region can invalidate a previously safe landing.
   if(!walkable(m.x,m.y,16)){m.x=b.origin.x;m.y=b.origin.y;enter(b,'recover');return;}
   j.effect('bossSlam',{x:m.x,y:m.y,ownerBoss:m.id,rx:PUMPKIN_COMBAT.rx,ry:PUMPKIN_COMBAT.ry});
   if(insideSlam(j.player,b.target))j.hurt(1,'pumpkinSlam',b.origin);
   enter(b,'recover');
  }return;
 }
 if(b.phase==='throwWindup'){
  if(b.elapsed>=PUMPKIN_COMBAT.throwWindup){const {dx,dy}=b.aim,life=PUMPKIN_COMBAT.shotRange/PUMPKIN_COMBAT.shotSpeed;
   j.projectiles.push({kind:'pumpkin',visual:'thrownPumpkin',ownerBoss:m.id,friendly:false,x:m.x+dx*30,y:m.y+dy*30,dx,dy,speed:PUMPKIN_COMBAT.shotSpeed,power:1,radius:PUMPKIN_COMBAT.shotRadius,life,maxLife:life});
   enter(b,'throwRecover');
  }return;
 }
 if(b.phase==='recover'||b.phase==='throwRecover'){
  if(b.elapsed>=(b.phase==='recover'?PUMPKIN_COMBAT.recovery:PUMPKIN_COMBAT.throwRecovery)){enter(b,'idle');b.cooldown=1.3;}return;
 }
 if(d>280){j.moveBody(m,(j.player.x-m.x)/(d||1)*44*dt,(j.player.y-m.y)/(d||1)*44*dt);return;}
 if(b.cooldown>0)return;
 const dx=(j.player.x-m.x)/(d||1),dy=(j.player.y-m.y)/(d||1);
 if((b.turn++%2)===0){
  const travel=Math.min(d,180),target={x:m.x+dx*travel,y:m.y+dy*travel};
  if(walkable(target.x,target.y,16)){b.origin={x:m.x,y:m.y};b.target=target;enter(b,'slamWindup');return;}
 }
 b.aim=d>0?{dx,dy}:{dx:1,dy:0};enter(b,'throwWindup');
}
export function advancePumpkinProjectile(j,shot,dt,walkable){
 const stepTime=Math.max(0,Math.min(dt,shot.life)),steps=Math.max(1,Math.ceil(shot.speed*stepTime/5));
 let reason='';
 for(let i=0;i<steps&&shot.life>0;i++){
  shot.x+=shot.dx*shot.speed*stepTime/steps;shot.y+=shot.dy*shot.speed*stepTime/steps;
  if(!walkable(shot.x,shot.y,shot.radius)){reason='wall';shot.life=0;break;}
  if(Math.hypot(shot.x-j.player.x,shot.y-j.player.y)<=shot.radius+PUMPKIN_COMBAT.playerRadius){j.hurt(shot.power,'pumpkin',shot);reason='hit';shot.life=0;break;}
 }
 if(shot.life>0){shot.life=Math.max(0,shot.life-dt);if(shot.life===0)reason='range';}
 if(reason&&!shot.ended){shot.ended=true;j.effect('pumpkinBurst',{x:shot.x,y:shot.y,ownerBoss:shot.ownerBoss});}
}
