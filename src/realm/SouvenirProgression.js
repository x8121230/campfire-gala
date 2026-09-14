// Collection points are permanent. Acquisition sources will be designed separately.
export const SOUVENIR_POINTS = Object.freeze({common:1, rare:2});
export const LEVEL_REWARDS = Object.freeze(['damage','agility','maxHp','maxMana']);
export function normalizeSouvenirs(value={}) {
 const result={};for(const [id,rarity] of Object.entries(value||{}))if(/^[\w-]{1,100}$/.test(id)&&Object.hasOwn(SOUVENIR_POINTS,rarity))result[id]=rarity;return result;
}
export function souvenirProgress(value={}) {
 const souvenirs=normalizeSouvenirs(value);const points=Object.values(souvenirs).reduce((n,r)=>n+SOUVENIR_POINTS[r],0);
 let level=1,spent=0;while(points-spent>=level*5){spent+=level*5;level++;}
 const stats={damage:1,agility:0,maxHp:3,maxMana:3};for(let lv=2;lv<=level;lv++)stats[LEVEL_REWARDS[(lv-2)%4]]++;
 return {level,points,uniqueCount:Object.keys(souvenirs).length,intoLevel:points-spent,needed:level*5,...stats,moveMultiplier:1+stats.agility*.03};
}
export function registerSouvenir(state,id,rarity) {
 if(!/^[\w-]{1,100}$/.test(id)||!Object.hasOwn(SOUVENIR_POINTS,rarity))return false;
 state.souvenirs=normalizeSouvenirs(state.souvenirs);if(Object.hasOwn(state.souvenirs,id))return false;
 state.souvenirs[id]=rarity;return true;
}
