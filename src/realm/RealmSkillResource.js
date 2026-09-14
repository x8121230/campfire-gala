const SAVE = 'forest_realm_skill_resource_v1';
export function normalizeSkillResource(value = {}) {
  const mana = Number.isFinite(value.mana) ? Math.max(0, Math.min(3, Math.floor(value.mana))) : 3;
  return { mana, maxMana: 3, spRegenElapsed: mana === 3 ? 0 : Math.max(0, Math.min(4.999, Number(value.spRegenElapsed) || 0)) };
}
export function loadSkillResource(fallback = {}) {
  try { return normalizeSkillResource(JSON.parse(localStorage.getItem(SAVE) || 'null') || fallback); }
  catch { return normalizeSkillResource(fallback); }
}
export function saveSkillResource(state) { localStorage.setItem(SAVE, JSON.stringify(normalizeSkillResource(state))); }
export function regenerateSkillResource(state, dt) {
  if (state.downed || !Number.isFinite(dt) || dt <= 0) return false;
  if (state.mana >= 3) { state.spRegenElapsed = 0; return false; }
  state.spRegenElapsed += Math.min(.05, dt);
  if (state.spRegenElapsed < 5 - 1e-9) return false;
  state.mana = Math.min(3, state.mana + 1);
  state.spRegenElapsed = state.mana === 3 ? 0 : Math.max(0, state.spRegenElapsed - 5);
  return true;
}
