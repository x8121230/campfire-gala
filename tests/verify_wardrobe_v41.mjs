import assert from 'node:assert/strict';
import Upgrade from '../src/systems/EquipmentUpgradeSystem.js';
import EquipmentSystem from '../src/systems/EquipmentSystem.js';
import SaveSystem from '../src/systems/SaveSystem.js';
import PlatformStorage from '../src/systems/PlatformStorage.js';
import { SAVE_KEY } from '../src/data/GameData.js';
class Registry {
 constructor(data={}){this.data=new Map(Object.entries(data))}
 get(k){return this.data.get(k)} set(k,v){this.data.set(k,v);return this}
}
const store=new Map();PlatformStorage.useAdapter({getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)});
const clip='item_hat_daily_01',secret='item_fullset_secret_guard',pink='item_fullset_pink_home_01';
const r=new Registry({owned_items:[clip],owned_collectibles:[],user_crystals:10});
assert.equal(Upgrade.step(r,clip),0,'舊存檔沒有升階欄位視為初始');
let result=EquipmentSystem.giveItem(r,clip);
assert.equal(result.isUpgrade,true);assert.equal(Upgrade.appearance(r,clip).label,'綠色');assert.equal(r.get('user_crystals'),10);
result=EquipmentSystem.giveItem(r,clip);
assert.equal(result.upgradeStep,2);assert.equal(Upgrade.appearance(r,clip).label,'藍色');assert.equal(r.get('user_crystals'),10);
result=EquipmentSystem.giveItem(r,clip);
assert.equal(result.type,'crystal');assert.equal(r.get('user_crystals'),11);assert.deepEqual(r.get('owned_items'),[clip]);
assert.equal(EquipmentSystem.giveItem(r,pink).isNew,true);assert.equal(Upgrade.step(r,pink),0);assert(r.get('new_items').includes(pink));
assert.equal(EquipmentSystem.giveItem(r,secret).isNew,true);
assert.equal(EquipmentSystem.giveItem(r,secret).type,'crystal');assert.equal(Upgrade.step(r,secret),0);
const state=JSON.stringify([...r.data]);assert.equal(EquipmentSystem.giveItem(r,'unknown').success,false);assert.equal(JSON.stringify([...r.data]),state);
r.set('wardrobe_audio',{music:true,sfx:false});r.set('secret_state',{motherGuardUnlocked:true});
r.set('equipped_hat',clip);r.set('equipped_fullset',pink);
const log=console.log;console.log=()=>{};
SaveSystem.saveFromRegistry(r);const fresh=new Registry();SaveSystem.applyToRegistry(fresh);
assert.equal(Upgrade.step(fresh,clip),2);assert.equal(fresh.get('user_crystals'),12);
assert.equal(fresh.get('equipped_fullset'),pink);assert.equal(fresh.get('equipped_hat'),clip);
assert.equal(fresh.get('wardrobe_audio').music,true);assert(fresh.get('new_items').includes(pink));
assert.equal(fresh.get('secret_state').motherGuardUnlocked,true);
const before=store.get(SAVE_KEY);fresh.set('mini_test_mode_active',true);fresh.set('user_crystals',999);
SaveSystem.saveFromRegistry(fresh);assert.equal(store.get(SAVE_KEY),before,'小遊戲測試模式不能寫入正式存檔');
const malformed=new Registry({owned_items:{bad:true},owned_collectibles:null,user_crystals:NaN,equipment_upgrades:{[clip]:-4}});
assert.equal(EquipmentSystem.giveItem(malformed,clip).isNew,true);assert.equal(Upgrade.step(malformed,clip),0);
assert.equal(EquipmentSystem.giveItem(malformed,clip).isUpgrade,true);
malformed.set('equipment_upgrades',{[clip]:99});assert.equal(Upgrade.step(malformed,clip),2);
// Scene-level state tests without a browser: these do not constitute visual QA.
globalThis.Phaser={Scene:class {}};
const {default:Collection}=await import('../src/scenes/Collection.js');
const s=new Collection();s.registry=r;s.init({mapID:'02'});s.render=()=>{};
s.audio={effect:()=>{}};s.openModal=()=>null;s.closeModal=()=>{};
s.equipItem(pink); // Toggle current pink off.
assert.equal(r.get('equipped_fullset'),'none');
s.equipItem(pink);assert.equal(r.get('equipped_fullset'),pink);
assert.equal(r.get('equipped_hat'),clip,'換身體不清除頭部');
s.equipItem('unknown');assert.equal(r.get('equipped_fullset'),pink);
s.selectItem(pink);assert(!r.get('new_items').includes(pink));
s.selectedType='body';assert(s.filtered().includes(pink));assert(!s.filtered().includes(clip));
s.selectedType='hat';assert(s.filtered().includes(clip));
const crystalBefore=r.get('user_crystals');
r.set('secret_state',{motherGuardPendingReward:true,motherGuardUnlocked:false});
s.checkMotherGuardReward();assert.equal(r.get('secret_state').motherGuardUnlocked,true);
assert.equal(r.get('secret_state').motherGuardPendingReward,false);
assert.equal(r.get('user_crystals'),crystalBefore,'已持有母上的守護不得重複轉水晶');
s.checkMotherGuardReward();assert.equal(r.get('user_crystals'),crystalBefore);
assert.equal(s.grantItem(secret),null,'測試發放不可直接授予彩蛋');
r.set('owned_items',r.get('owned_items').filter(id=>id!==secret));
r.set('secret_state',{motherGuardPendingReward:true});s.checkMotherGuardReward();
assert(s.owned().includes(secret));assert.equal(r.get('user_crystals'),crystalBefore);
console.log=log;console.log('PASS: upgrades, overflow, NEW, persistence, malformed input, save isolation, head/body equip, filters, secret first award and idempotency. Browser visual QA not included.');
