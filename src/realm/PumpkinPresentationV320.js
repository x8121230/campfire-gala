// Presentation only: retain the installed PumpkinBoss AI, collision and combat tuning.
export const PUMPKIN_ATLAS_V320 = '../../assets/phantom-realm/dawn-dandelion-hills/boss-v320/rabbit-carrot-atlas.png';
export const SLAM_VISUAL_SECONDS = 1.25;
const X = [0,384,768,1152,1536];
const IDLE_DURATIONS = [.28,.18,.19,.24,.19,.16,.22,.30];
export function idleFrameAt(time) {
 const period=IDLE_DURATIONS.reduce((a,b)=>a+b,0);
 let t=((Number.isFinite(time)?time:0)%period+period)%period;
 for(let i=0;i<8;i++){if(t<IDLE_DURATIONS[i])return i;t-=IDLE_DURATIONS[i];}
 return 0;
}
export function updatePumpkinPresentation(journey,mob,dt,updateOriginal) {
 const existing=new Set(journey.projectiles);
 updateOriginal(journey,mob,dt);
 // Tag only objects emitted during this rabbit's AI tick; never change projectile kind.
 for(const shot of journey.projectiles)if(!existing.has(shot)&&!shot.friendly){shot.visual='giantCarrot';shot.ownerBoss=mob.id;}
}
export function drawPumpkinIdle(ctx,atlas,mob) {
 if(!atlas?.width||!mob.alive||mob.hitFlash>0||mob.dizzy>0)return false;
 const phase=mob.boss?.phase;
 if(mob.aggro && phase && !['idle','chase','cooldown','rest','recover','throwWindup','throwRecover'].includes(phase))return false;
 const i=idleFrameAt((mob.animTime||0)+(mob.id||0)*.13),col=i%4,row=Math.floor(i/4);
 // Padded atlas cells share a fixed foot baseline; body and collider never move.
 const top=row*448,bottom=top+448,foot=top+416;
 const w=X[col+1]-X[col],h=bottom-top,k=.58;
 ctx.save();ctx.translate(mob.x,mob.y);
 if(mob.faceLeft===false)ctx.scale(-1,1);
 ctx.drawImage(atlas,X[col],top,w,h,-w*k/2,-(foot-top)*k,w*k,h*k);
 ctx.restore();return true;
}
export function drawGiantCarrot(ctx,atlas,shot,time) {
 if(!atlas?.width)return false;
 const i=Math.floor(Math.max(0,time)*10)%4,sx=X[i],sw=X[i+1]-sx;
 const fade=Math.min(1,Math.max(0,shot.life/.2));
 ctx.save();ctx.globalAlpha*=fade;
 ctx.fillStyle='#59402430';ctx.beginPath();ctx.ellipse(shot.x,shot.y,27,9,0,0,Math.PI*2);ctx.fill();
 ctx.translate(shot.x,shot.y-42);ctx.rotate(Math.atan2(shot.dy,shot.dx));
 const trail=ctx.createLinearGradient(-145,0,-14,0);trail.addColorStop(0,'#ffb64800');trail.addColorStop(1,'#ffdd9580');
 ctx.strokeStyle=trail;ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-140,0);ctx.lineTo(-16,0);ctx.stroke();
 // Root tip points along velocity; collision stays at the existing projectile centre.
 ctx.drawImage(atlas,sx,896,sw,448,-125,-84,150,175);
 ctx.restore();return true;
}
export function drawPumpkinGroundImpact(ctx,fx) {
 if(!(fx.life>0)||!(fx.maxLife>0))return;
 const age=fx.maxLife-fx.life,p=Math.min(1,Math.max(0,age/fx.maxLife));
 const growth=Math.min(1,age/.18),fade=1-Math.max(0,(p-.52)/.48);
 ctx.save();ctx.translate(fx.x,fx.y);ctx.scale(1,.62);ctx.globalAlpha*=fade;
 const halo=ctx.createRadialGradient(0,0,8,0,0,118);halo.addColorStop(0,'#ffe4a044');halo.addColorStop(1,'#e4b36e00');
 ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,118,0,Math.PI*2);ctx.fill();
 // Fixed deterministic branches: they grow outward without random per-frame flicker.
 ctx.lineJoin='round';ctx.lineCap='round';
 for(let n=0;n<9;n++){
  const a=n*Math.PI*2/9+.17;
  const bend=n%2?1:-1;
  const pts=[[Math.cos(a)*7,Math.sin(a)*7],...[[24,a+.19*bend],[43,a-.09*bend],[58,a+.11*bend],[76,a-.06*bend],[89+n%3*11,a+.08*bend]].map(([r,ang])=>[Math.cos(ang)*r,Math.sin(ang)*r])];
  for(const [color,width,offset] of [['#fce4a5',6,2],['#674331',3.2,0]]){
   ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*growth,y*growth+offset):ctx.moveTo(x,y+offset));ctx.stroke();
   ctx.beginPath();ctx.moveTo(pts[2][0]*growth,pts[2][1]*growth+offset);ctx.lineTo(Math.cos(a+.35)*84*growth,Math.sin(a+.35)*84*growth+offset);ctx.stroke();
  }
 }
 const burst=Math.min(1,age/.55);
 ctx.globalAlpha=fade*(1-burst)*.55;ctx.strokeStyle='#ffe4aa';ctx.lineWidth=12*(1-burst)+1;
 ctx.beginPath();ctx.arc(0,0,20+burst*125,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6+.13,r=24+burst*(75+i%3*12),x=Math.cos(a)*r,y=Math.sin(a)*r;
  ctx.globalAlpha=fade*(1-burst)*.8;ctx.fillStyle=i%2?'#c18d55':'#efd4a0';
  const lift=Math.sin(burst*Math.PI)*24;ctx.beginPath();ctx.moveTo(x-6,y-lift);ctx.lineTo(x-2,y-lift-6);ctx.lineTo(x+7,y-lift-3);ctx.lineTo(x+4,y-lift+4);ctx.closePath();ctx.fill();
  if(age<.48){const radius=10+burst*17,cloud=ctx.createRadialGradient(x,y,0,x,y,radius);cloud.addColorStop(0,'#f9e1b18c');cloud.addColorStop(1,'#d5b58400');ctx.fillStyle=cloud;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
}
