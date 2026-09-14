const SAVE = 'forest_realm_skill_resource_v1';
export function normalizeSkillResource(value = {}) {
 const maxMana=Math.max(3,Math.floor(Number(value.maxMana)||3)),maxHp=Math.max(3,Math.floor(Number(value.maxHp)||3));
 const mana=Number.isFinite(value.mana)?Math.max(0,Math.min(maxMana,Math.floor(value.mana))):maxMana;
 const hp=Number.isFinite(value.hp)?Math.max(0,Math.min(maxHp,value.hp)):maxHp;
 return {hp,maxHp,mana,maxMana,spRegenElapsed:mana===maxMana?0:Math.max(0,Math.min(4.999,Number(value.spRegenElapsed)||0))};
}
export function loadSkillResource(fallback = {}) {
 try {const saved=JSON.parse(localStorage.getItem(SAVE)||'null')||{};return normalizeSkillResource({...fallback,...saved,maxHp:fallback.maxHp||3,maxMana:fallback.maxMana||3});}
 catch{return normalizeSkillResource(fallback);}
}
export function saveSkillResource(state){localStorage.setItem(SAVE,JSON.stringify(normalizeSkillResource(state)));}
export function regenerateSkillResource(state,dt){
 if(state.downed||state.hp===0||!Number.isFinite(dt)||dt<=0)return false;
 const max=state.maxMana||3;if(state.mana>=max){state.spRegenElapsed=0;return false;}
 state.spRegenElapsed=(state.spRegenElapsed||0)+Math.min(.05,dt);if(state.spRegenElapsed<5-1e-9)return false;
 state.mana=Math.min(max,state.mana+1);state.spRegenElapsed=state.mana===max?0:Math.max(0,state.spRegenElapsed-5);return true;
}
