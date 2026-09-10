export const COLLECTION_SETS=[
 {id:'explorer',name:'森林探險家',title:'林間尋寶者',background:'晨光森林',color:0x456b48,items:['item_hat_explore_01','item_cloth_explore_01','item_fullset_explore_01']},
 {id:'firefly',name:'螢光精靈',title:'螢火守望者',background:'螢光秘境',color:0x244b52,items:['item_hat_firefly_01','item_cloth_firefly_01','item_fullset_firefly_01']},
 {id:'campfire',name:'森林料理家',title:'營火大廚',background:'暖暖營地',color:0x805333,items:['item_hat_campfire_01','item_cloth_campfire_01','item_fullset_campfire_01']},
 {id:'stars',name:'星空旅人',title:'銀河漫遊者',background:'星光花園',color:0x353963,items:['item_hat_constellation_01','item_cloth_constellation_01','item_fullset_constellation_01']}
];
export function ownedEquipment(data){return new Set([...(data.owned_items||[]),...(data.owned_collectibles||[])]);}
export function setProgress(data,set,items){const owned=ownedEquipment(data),count=set.items.filter(id=>items[id]&&owned.has(id)).length;return {count,total:set.items.length,complete:count===set.items.length};}
export function sourceHint(item,games){
 if(item.source==='starter'||item.rarity==='base')return '初始裝備，不由寶箱抽出';
 if(item.source==='secret')return '特殊事件解鎖，不由寶箱抽出';
 const preferred=games.filter(g=>g.source===item.source).map(g=>g.chest);
 return preferred.length?`推薦：${preferred.join('、')}\n其他寶箱也可能抽出`:'五種寶箱皆可能抽出';
}
export function refreshCollection(data,items){
 const next=JSON.parse(JSON.stringify(data));
 const old=next.collection_goals_v1;
 if(old&&(old.version!==1||!Array.isArray(old.unlocked)))throw Error('圖鑑版本不相容，停止更新');
 const state=next.collection_goals_v1=old||{version:1,unlocked:[],selected:null};
 const added=[];for(const set of COLLECTION_SETS)if(setProgress(next,set,items).complete&&!state.unlocked.includes(set.id)){state.unlocked.push(set.id);added.push(set.id);}
 return {data:next,added};
}
export function selectCollection(data,id){
 if(!COLLECTION_SETS.some(s=>s.id===id)||!data.collection_goals_v1?.unlocked.includes(id))throw Error('尚未解鎖這個展示主題');
 const next=JSON.parse(JSON.stringify(data));next.collection_goals_v1.selected=id;return next;
}
