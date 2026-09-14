// All deformations are render-only. Feet, targeting rings and collisions stay in world space.
export function forestCreaturePose(mob, time) {
  const cast = mob.cast ? Math.min(1, mob.cast.elapsed / mob.cast.duration) : 0;
  const recoil = Math.min(1, (mob.recovery || 0) / .28);
  const hit = Math.min(1, (mob.hitFlash || 0) / .18);
  const dew = mob.type === 'dew';
  return {
    cast, recoil,
    lift: dew ? 5 + Math.sin(time * 2.7 + mob.x) * 3 : 0,
    bend: dew ? Math.sin(time * 3) * 2 : Math.sin(time * 1.8 + mob.x) * .7 + Math.sin(cast * Math.PI) * 12 - recoil * 8,
    squash: dew ? 1 + Math.sin(time * 3) * .025 - Math.sin(cast * Math.PI) * .12 - hit * .10 : 1 - Math.sin(cast * Math.PI) * .10 - hit * .045,
    widen: dew ? 1 + Math.sin(cast * Math.PI) * .12 + hit * .12 : 1 + hit * .05
  };
}
export function drawForestCreature(ctx, image, mob, time, width, height, player) {
  const pose = forestCreaturePose(mob, time), facing = player && player.x < mob.x ? -1 : 1;
  ctx.save();ctx.translate(mob.x, mob.y - pose.lift);ctx.scale(facing, 1);
  // Horizontal strips keep the lower body planted while shoulders lean into digging / spitting.
  const strips = 24;
  for (let i = 0; i < strips; i++) {
    const top = i / strips, bottom = (i + 1) / strips;
    const bend = pose.bend * (1 - top) ** 2;
    ctx.drawImage(image, 0, top * image.height, image.width, image.height / strips,
      -width * pose.widen / 2 + bend, (top - 1) * height * pose.squash,
      width * pose.widen, (bottom - top) * height * pose.squash + .3);
  }
  if (mob.cast) {
    if (mob.type === 'mole') {
      // Soil rises from the shovel's ground contact, then gathers for the throw.
      ctx.fillStyle = '#9c653c'; ctx.strokeStyle = '#603f2c';ctx.lineWidth=1.5;
      for(let i=0;i<6;i++) {
        const phase=(pose.cast*2+i*.13)%1;
        ctx.beginPath();ctx.ellipse(22+i*3, -3-Math.sin(phase*Math.PI)*18, 3.5, 2.5,phase*3,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      ctx.beginPath();ctx.ellipse(30, -12-pose.cast*22, 4+pose.cast*5, 4+pose.cast*4, -.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    } else {
      const r=3+pose.cast*9;ctx.fillStyle='#a4f5ff88';ctx.strokeStyle='#efffff';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(22,-height*.52,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(19,-height*.55,2,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}
