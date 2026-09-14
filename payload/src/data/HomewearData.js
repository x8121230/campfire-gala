export const HOMEWEAR_ITEMS = {
 item_cloth_home_ferris: {id:'item_cloth_home_ferris',name:'紫夢摩天輪居家服',type:'cloth',category:'equipment',source:'homewear',cosmeticOnly:true,rarity:'common',desc:'把遊樂園穿在身上，踩著草莓拖鞋，走進甜甜的居家時光。',effects:{},texture:'homewear_body_ferris',icon:'homewear_icon_ferris',iconKind:'object'},
 item_cloth_home_flowers: {id:'item_cloth_home_flowers',name:'小花暖暖居家服',type:'cloth',category:'equipment',source:'homewear',cosmeticOnly:true,rarity:'common',desc:'小花灑滿柔軟上衣，搭配奶油短褲與柑橘拖鞋，舒服地迎接每一天。',effects:{},texture:'homewear_body_flowers',icon:'homewear_icon_flowers',iconKind:'object'},
 item_hat_home_chestnut: {id:'item_hat_home_chestnut',name:'暖栗雙馬尾',type:'hat',category:'equipment',source:'homewear',cosmeticOnly:true,rarity:'common',desc:'栗色雙馬尾輕輕翹起，帶著圓圓笑臉，準備出發找朋友。',effects:{},texture:'homewear_head_chestnut',icon:'homewear_icon_chestnut',iconKind:'object'}
};
export const HOMEWEAR_BODIES = {item_cloth_home_ferris:{outfitBody:'homewear_body_ferris'},item_cloth_home_flowers:{outfitBody:'homewear_body_flowers'}};
export const HOMEWEAR_HEADS = {item_hat_home_chestnut:'homewear_head_chestnut'};
export const HOMEWEAR_FILES = Object.fromEntries(['body_ferris','body_flowers','head_chestnut','icon_ferris','icon_flowers','icon_chestnut'].map(n=>['homewear_'+n,'assets/wardrobe_v704/'+n+'.png']));
export function ensureHomewear(registry) {
 const owned=registry.get('owned_items');const items=Array.isArray(owned)?owned:[];
 const added=Object.keys(HOMEWEAR_ITEMS).filter(id=>!items.includes(id));
 if(!added.length)return false;
 const unread=registry.get('new_items');
 registry.set('owned_items',[...items,...added]);
 registry.set('new_items',[...new Set([...(Array.isArray(unread)?unread:[]),...added])]);return true;
}
