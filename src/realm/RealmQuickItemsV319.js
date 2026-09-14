import {normalizeStarsproutInventory,ITEM_CATALOG,appendItemArt} from './StarsproutInventory.js';
export function mentorReward(state,stage){
 const s=normalizeStarsproutInventory(state);if(stage>=3&&!s.rewardClaims.mentorSlash){s.rewardClaims.mentorSlash=true;s.learnedSkills=['slash'];s.items['斬擊']=1;s.equipped.weapon='斬擊';s.items['甜蘋果']=(s.items['甜蘋果']||0)+3;const i=s.quickSlots.indexOf('');if(!s.quickSlots.includes('甜蘋果')&&i>=0)s.quickSlots[i]='甜蘋果';}return s;
}
export function assignQuickItem(state,index,name){
 if(!Number.isInteger(index)||index<0||index>3)return false;
 if(name&&(ITEM_CATALOG[name]?.type!=='consumable'||!(state.items[name]>0)))return false;
 state.quickSlots[index]=name;return true;
}
export function consumeItem(state,health,name){
 if(name!=='甜蘋果')return{used:false,message:name?'這個道具目前沒有可使用的效果。':'先在背包放入快捷道具。'};
 if(health.downed||health.hp<=0)return{used:false,message:'倒地時不能使用蘋果。'};
 if(!(health.maxHp-health.hp>=1))return{used:false,message:'生命充足，先把蘋果留著吧！'};
 if(!(state.items[name]>0))return{used:false,message:'蘋果已經用完了。'};
 state.items[name]--;if(state.items[name]<=0)delete state.items[name];health.hp=Math.min(health.maxHp,health.hp+1);
 return{used:true,message:'甜蘋果 −1 · HP +1'};
}
export function autoConsume(state,health,dt){
 health.itemUseCooldown=Math.max(0,(health.itemUseCooldown||0)-Math.max(0,dt||0));
 if(health.itemUseCooldown>0||!state.quickSlots.includes('甜蘋果'))return false;
 const result=consumeItem(state,health,'甜蘋果');if(result.used)health.itemUseCooldown=.8;return result.used;
}
export function buildQuickSlots(app){return [0,1,2,3].map(index=>{const slot=app.button('',()=>app.useQuick(index),app.quickbar,'quickslot');app.el('span','key',String(index+1),slot);const image=appendItemArt(slot,'','icon');image.hidden=true;app.el('span','count','',slot);return slot;});}
export function renderQuickSlots(app){app.quickSlots?.forEach((slot,i)=>{const name=app.inventoryState.quickSlots[i],count=app.inventoryState.items[name]||0;const image=slot.querySelector('img');if(image.dataset.item!==name){image.dataset.item=name;const dummy=document.createElement('span');const fresh=appendItemArt(dummy,name||'');image.src=fresh.src;image.alt=name||'空快捷槽';}image.hidden=!name;slot.querySelector('.count').textContent=name?String(count):'＋';slot.title=name?`${name} ×${count}｜點擊使用`:'在背包設定快捷道具';slot.classList.toggle('empty',!name||!count);});}
