export function updatePumpkinBoss(j, mob, dt) {
  mob.boss ||= { phase:'idle', elapsed:0, turn:0 };
  const b=mob.boss, d=Math.hypot(j.player.x-mob.x,j.player.y-mob.y), home=Math.hypot(j.player.x-mob.homeX,j.player.y-mob.homeY);
  b.elapsed+=dt;b.enraged=mob.hp<=mob.maxHp/2;
  if (home>950 || j.downed) {mob.aggro=false;b.phase='return';}
  if (!mob.aggro) {
    const hd=Math.hypot(mob.homeX-mob.x,mob.homeY-mob.y);
    if(hd>8){j.moveBody(mob,(mob.homeX-mob.x)/hd*95*dt,(mob.homeY-mob.y)/hd*95*dt);b.phase='return';}
    else {if(b.phase==='return')mob.hp=mob.maxHp;b.phase='idle';}
    return;
  }
  const enter=(phase)=>{b.phase=phase;b.elapsed=0;};
  if (b.phase==='idle'||b.phase==='return')enter('chase');
  if (b.phase==='chase') {
    if(d>165){j.moveBody(mob,(j.player.x-mob.x)/d*(b.enraged?130:100)*dt,(j.player.y-mob.y)/d*(b.enraged?130:100)*dt);}
    if(d<320&&b.elapsed>.65){
      b.target={x:j.player.x,y:j.player.y};b.origin={x:mob.x,y:mob.y};
      enter(b.turn++%2===0?'slamWindup':'seedWindup');j.effect('sound',{name:'bossWarn'});
    }
  } else if(b.phase==='slamWindup'&&b.elapsed>(b.enraged?.65:.9))enter('leap');
  else if(b.phase==='leap') {
    const p=Math.min(1,b.elapsed/.55),x=b.origin.x+(b.target.x-b.origin.x)*p,y=b.origin.y+(b.target.y-b.origin.y)*p;
    j.moveBody(mob,x-mob.x,y-mob.y);
    if(p>=1){j.effect('bossSlam',{x:mob.x,y:mob.y});j.effect('sound',{name:'bossSlam'});if(Math.hypot(j.player.x-mob.x,j.player.y-mob.y)<105)j.hurt(1,'pumpkin',mob);enter('recover');}
  } else if(b.phase==='seedWindup'&&b.elapsed>.7){
    const angle=Math.atan2(j.player.y-mob.y,j.player.x-mob.x),n=b.enraged?7:5;
    for(let i=0;i<n;i++){const a=angle+(i-(n-1)/2)*.24;j.projectiles.push({kind:'seed',friendly:false,x:mob.x,y:mob.y,dx:Math.cos(a),dy:Math.sin(a),speed:190,power:1,life:2.7,maxLife:2.7});}
    j.effect('sound',{name:'bossSeeds'});enter('seedRecover');
  } else if((b.phase==='recover'||b.phase==='seedRecover')&&b.elapsed>(b.enraged?.65:1.0))enter('chase');
}
export function pumpkinBossFrame(mob) {
  if(!mob.alive)return 11;
  const b=mob.boss||{};
  if(b.phase==='slamWindup')return 4;
  if(b.phase==='leap')return b.elapsed<.27?5:6;
  if(b.phase==='recover')return b.elapsed<.3?7:10;
  if(b.phase==='seedWindup')return 8;
  if(b.phase==='seedRecover')return b.elapsed<.35?9:0;
  if(mob.hitFlash>0)return 3;
  if(b.phase==='chase'||b.phase==='return')return 1+(Math.floor((b.elapsed||0)*7)%2);
  return 0;
}
export function drawPumpkinBoss(ctx,atlas,mob,size=240){
  if(!atlas)return;
  const frame=pumpkinBossFrame(mob),b=mob.boss||{},lift=b.phase==='leap'?Math.sin(Math.min(1,b.elapsed/.55)*Math.PI)*95:0;
  ctx.drawImage(atlas,(frame%4)*320,Math.floor(frame/4)*320,320,320,mob.x-size/2,mob.y-size*300/320-lift,size,size);
}
