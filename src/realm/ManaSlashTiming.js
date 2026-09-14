// One timeline drives damage, blade motion and the render-only body pose.
export const MANA_SLASH = Object.freeze({ duration: .9, cooldown: 1.6, windup: .18, impact: .36, contactHold: .05, swingEnd: .48 });
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };

export function manaSlashPose(elapsed) {
  const t = Math.max(0, elapsed);
  const formation = smooth(t / MANA_SLASH.windup);
  // Reach the target at impact; a short visual contact hold never freezes physics.
  const swing = smooth((t - MANA_SLASH.windup) / (MANA_SLASH.impact - MANA_SLASH.windup));
  const settle = smooth((t - MANA_SLASH.swingEnd) / (MANA_SLASH.duration - MANA_SLASH.swingEnd));
  const body = (-2 * formation + 5 * swing) * (1 - settle);
  return {
    formation, swing,
    bladeAlpha: formation * (1 - smooth((t - MANA_SLASH.impact - MANA_SLASH.contactHold) / .22)),
    forward: (-2 * formation + 7 * swing) * (1 - settle),
    tilt: body * Math.PI / 180,
    wave: clamp((t - MANA_SLASH.impact) / .23)
  };
}
