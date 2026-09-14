export function combatFrameIndex(mob) {
  if (mob.cast) return Math.min(3, Math.floor(mob.cast.elapsed / mob.cast.duration * 4));
  if (mob.recovery > 0) return mob.recovery > .18 ? 4 : 5;
  return 0;
}
export function drawCombatFrame(ctx, atlas, row, frame, size) {
  if (!atlas) return;
  ctx.drawImage(atlas, Math.max(0,Math.min(5,frame))*320, row*320, 320,320, -size/2,-size*300/320,size,size);
}
