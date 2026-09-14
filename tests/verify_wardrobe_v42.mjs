import assert from 'node:assert/strict';
import Upgrade from '../src/systems/EquipmentUpgradeSystem.js';
import EquipmentSystem from '../src/systems/EquipmentSystem.js';
import SaveSystem from '../src/systems/SaveSystem.js';
import PlatformStorage from '../src/systems/PlatformStorage.js';
import { SAVE_KEY } from '../src/data/GameData.js';

class Registry {
    constructor(data = {}) { this.data = new Map(Object.entries(data)); }
    get(key) { return this.data.get(key); }
    set(key, value) { this.data.set(key, value); return this; }
}

const store = new Map();
PlatformStorage.useAdapter({ getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) });
const clip = 'item_hat_daily_01', daily = 'item_cloth_daily_01';
const pink = 'item_fullset_pink_home_01', secret = 'item_fullset_secret_guard';
const scout = 'item_collectible_scout_test_01';
const r = new Registry({ owned_items: [clip, daily, pink], owned_collectibles: [scout], user_crystals: 10,
    equipped_hat: 'none', equipped_cloth: daily, equipped_fullset: 'none', equipped_collectible: 'none' });

assert.equal(Upgrade.appearance(r, clip).label, '優良');
assert.equal(Upgrade.limit({ ...Upgrade, rarity: 'good', category: 'equipment' }), 1);
assert.equal(Upgrade.appearance(r, daily).label, '基礎造型');
assert.equal(Upgrade.limit((await import('../src/data/GameData.js')).ITEM_DB[daily]), 0);
let result = EquipmentSystem.giveItem(r, clip);
assert.equal(result.isUpgrade, true);
assert.equal(Upgrade.appearance(r, clip).label, '稀有');
assert.equal(Upgrade.appearance(r, clip).step, 1);
assert.equal(r.get('user_crystals'), 10);
result = EquipmentSystem.giveItem(r, clip);
assert.equal(result.type, 'crystal');
assert.equal(r.get('user_crystals'), 11);
assert.deepEqual(r.get('owned_items'), [clip, daily, pink]);
assert.equal(EquipmentSystem.giveItem(r, daily).type, 'crystal', '基礎造型不升階');
assert.equal(r.get('user_crystals'), 12);
assert.equal(EquipmentSystem.giveItem(r, secret).isNew, true);
assert.equal(EquipmentSystem.giveItem(r, secret).type, 'crystal');
assert.equal(Upgrade.step(r, secret), 0);
const beforeUnknown = JSON.stringify([...r.data]);
assert.equal(EquipmentSystem.giveItem(r, 'unknown').success, false);
assert.equal(JSON.stringify([...r.data]), beforeUnknown);

r.set('equipment_upgrades', { [clip]: 9, [pink]: -2 });
assert.equal(Upgrade.normalizeRegistry(r), true);
assert.equal(r.get('equipment_upgrades')[clip], 1);
assert.equal(r.get('equipment_upgrades')[pink], 0);
r.set('wardrobe_audio', { music: true, sfx: false });
r.set('secret_state', { motherGuardUnlocked: true });
SaveSystem.saveFromRegistry(r);
const fresh = new Registry();
SaveSystem.applyToRegistry(fresh);
assert.equal(Upgrade.step(fresh, clip), 1);
assert.equal(fresh.get('wardrobe_audio').music, true);
assert.equal(fresh.get('equipped_collectible'), 'none');
const saved = store.get(SAVE_KEY);
fresh.set('mini_test_mode_active', true); fresh.set('user_crystals', 999);
SaveSystem.saveFromRegistry(fresh);
assert.equal(store.get(SAVE_KEY), saved, '小遊戲測試模式不能寫入正式存檔');

globalThis.Phaser = { Scene: class {} };
const { default: Collection } = await import('../src/scenes/Collection.js');
const scene = new Collection();
scene.registry = r; scene.init({ mapID: '02' }); scene.render = () => {}; scene.save = () => {};
scene.audio = { effect: () => {} }; scene.openModal = () => null; scene.closeModal = () => {};
assert.equal(scene.equipItem(pink, false), true);
assert.equal(r.get('equipped_fullset'), pink);
assert.equal(r.get('equipped_cloth'), 'none');
assert.equal(scene.equipItem(pink, false), false, '再次點擊同一張卡不會脫下');
assert.equal(r.get('equipped_fullset'), pink);
scene.equipItem(clip, false);
assert.equal(r.get('equipped_hat'), clip);
scene.equipItem('__none_hat__', false);
assert.equal(r.get('equipped_hat'), 'none');
scene.equipItem(scout, false);
assert.equal(r.get('equipped_collectible'), scout);
scene.equipItem('__none_accessory__', false);
assert.equal(r.get('equipped_collectible'), 'none');
scene.selectItem(daily);
assert.equal(r.get('equipped_fullset'), pink, '第一次點擊只能預覽，不可改寫正式穿戴');
assert.equal(scene.previewId, daily);
scene.selectItem(daily);
assert.equal(r.get('equipped_cloth'), daily);
assert.equal(r.get('equipped_fullset'), 'none');
scene.selectedType = 'body'; assert(scene.filtered().includes(pink)); assert(!scene.filtered().includes(clip));
scene.selectedType = 'hat'; assert.equal(scene.filtered()[0], '__none_hat__');
scene.selectedType = 'accessory'; assert.equal(scene.filtered()[0], '__none_accessory__');

scene.equipItem(scout, false);
EquipmentSystem.applyBonusToRegistry(r);
assert.equal(EquipmentSystem.getEquippedItems(r).collectible, scout);
const crystalBefore = r.get('user_crystals');
r.set('secret_state', { motherGuardPendingReward: true, motherGuardUnlocked: false });
scene.checkMotherGuardReward();
assert.equal(r.get('secret_state').motherGuardUnlocked, true);
assert.equal(r.get('user_crystals'), crystalBefore, '已持有彩蛋不得重複轉水晶');
assert.equal(scene.grantItem(secret), null, '測試發放不可直接授予彩蛋');

console.log('PASS v5.0: green minimum, one upgrade, crystal overflow, base/secret rules, migration, save, preview-then-equip, explicit unequip, head/body separation and accessory slot.');
