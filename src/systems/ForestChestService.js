import {SAVE_KEY,ITEM_DB} from '../data/GameData.js';
import SaveSystem from './SaveSystem.js';
import PlatformStorage from './PlatformStorage.js';
import Upgrade from './EquipmentUpgradeSystem.js';
import ChestLedger from './ChestLedger.js';
import MiniGameTestSession from './MiniGameTestSession.js';
export const chestService=new ChestLedger({items:ITEM_DB,receive:(r,id)=>Upgrade.receive(r,id),read:()=>{
 const raw=PlatformStorage.getItem(SAVE_KEY);return raw?JSON.parse(raw):SaveSystem.cloneDefaultData();
},write:data=>{
 const before=PlatformStorage.getItem(SAVE_KEY);
 // The legacy browser adapter silently falls back to RAM. Chest transactions
 // require durable browser storage before publishing the new in-memory value.
 const text=JSON.stringify(data);
 if(typeof window!=='undefined'){
  try{const storage=globalThis.localStorage;if(!storage)throw Error('missing');
   if(before&&!storage.getItem(`${SAVE_KEY}_before_chests_v1`))storage.setItem(`${SAVE_KEY}_before_chests_v1`,before);
   storage.setItem(SAVE_KEY,text);if(storage.getItem(SAVE_KEY)!==text)throw Error('verify');
  }catch(e){throw Error('裝置無法永久儲存，請開啟瀏覽器儲存空間後重試。');}
 }
 if(before&&!PlatformStorage.getItem(`${SAVE_KEY}_before_chests_v1`))PlatformStorage.setItem(`${SAVE_KEY}_before_chests_v1`,before);
 PlatformStorage.setItem(SAVE_KEY,text);if(PlatformStorage.getItem(SAVE_KEY)!==text)throw Error('儲存未完成，請保留畫面並重試。');
}});
export function syncChestInventory(registry){const d=chestService.load();for(const key of ['owned_items','owned_collectibles','equipment_upgrades','new_items','user_crystals'])if(d[key]!==undefined)registry.set(key,d[key]);return d;}
export function syncChestWallet(registry){const d=syncChestInventory(registry);for(const key of ['hearts','next_heart_time']){
 registry.set(key,d[key]);
 // A test-game snapshot must not undo an explicitly purchased opening.
 if(MiniGameTestSession.activeSession)MiniGameTestSession.activeSession.snapshot[key]=d[key];
}return d;}
export function openChestHere(registry,id){chestService.load();SaveSystem.saveFromRegistry(registry);const result=chestService.open(id);if(result.status==='opened')syncChestWallet(registry);return result;}
