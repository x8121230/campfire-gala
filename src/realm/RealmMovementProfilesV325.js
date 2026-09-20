// A single persisted movement preference shared by 星芽營地 and 晨曦蒲公英丘陵.
// The animation clock uses the same base pair as movement, so a profile cannot
// silently reintroduce foot sliding.
export const MOVEMENT_PROFILE_SAVE = 'forest_realm_movement_profile_v325';

export const MOVEMENT_PROFILES = Object.freeze({
  sprout: Object.freeze({
    id: 'sprout',
    name: '小碎步',
    description: '較靈巧的探索步調。一般 225，快走 310。',
    walkSpeed: 225,
    runSpeed: 310,
    walkFps: 10.0,
    minFps: 8.8,
    maxFps: 12.4
  }),
  stroll: Object.freeze({
    id: 'stroll',
    name: '悠閒漫步',
    description: '最慢、最容易貼著小路轉向。一般 210，快走 300。',
    walkSpeed: 210,
    runSpeed: 300,
    walkFps: 9.5,
    minFps: 8.5,
    maxFps: 12.0
  })
});

export function movementProfileId(value) {
  return Object.hasOwn(MOVEMENT_PROFILES, value) ? value : 'sprout';
}

export function movementProfile(value) {
  return MOVEMENT_PROFILES[movementProfileId(value)];
}

export function loadMovementProfile() {
  try { return movementProfileId(globalThis.localStorage?.getItem(MOVEMENT_PROFILE_SAVE)); }
  catch { return 'sprout'; }
}

export function saveMovementProfile(value) {
  const id = movementProfileId(value);
  try { globalThis.localStorage?.setItem(MOVEMENT_PROFILE_SAVE, id); } catch {}
  return id;
}
