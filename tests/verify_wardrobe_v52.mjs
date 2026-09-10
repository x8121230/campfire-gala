import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ITEM_DB } from '../src/data/GameData.js';
import { PAPER_DOLL_FILES, PAPER_DOLL_TEXTURES } from '../src/data/PaperDollConfig.js';
import { grantAllItemsForTesting } from '../src/systems/TestGrantSystem.js';

class Registry {
    constructor(data = {}) { this.data = new Map(Object.entries(data)); }
    get(key) { return this.data.get(key); }
    set(key, value) { this.data.set(key, value); }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
Object.entries(PAPER_DOLL_FILES).forEach(([key, relative]) => {
    assert(fs.existsSync(path.join(root, relative)), `missing paper-doll asset: ${key}`);
});

Object.values(PAPER_DOLL_FILES).filter(relative => relative.includes('/wardrobe_v52/')).forEach(relative => {
    const png = fs.readFileSync(path.join(root, relative));
    assert.equal(png.toString('ascii', 1, 4), 'PNG', `not a PNG: ${relative}`);
    assert.equal(png[25], 6, `asset must use RGBA transparency: ${relative}`);
});

[
    'item_cloth_fairy_01', 'item_cloth_explore_01', 'item_fullset_explore_01',
    'item_cloth_firefly_01', 'item_fullset_firefly_01', 'item_cloth_campfire_01',
    'item_fullset_campfire_01', 'item_cloth_constellation_01', 'item_fullset_constellation_01'
].forEach(id => assert(PAPER_DOLL_TEXTURES[id], `missing converted outfit mapping: ${id}`));

const registry = new Registry({
    owned_items: ['item_hat_daily_01'],
    owned_collectibles: [],
    new_items: ['item_hat_daily_01'],
    user_crystals: 77,
    equipment_upgrades: { item_hat_daily_01: 1 },
    equipped_hat: 'item_hat_daily_01'
});
const beforeUpgrade = JSON.stringify(registry.get('equipment_upgrades'));
const added = grantAllItemsForTesting(registry, ITEM_DB);
const granted = new Set([...registry.get('owned_items'), ...registry.get('owned_collectibles')]);
Object.keys(ITEM_DB).forEach(id => assert(granted.has(id), `test grant missed item: ${id}`));
assert.equal(added.length, Object.keys(ITEM_DB).length - 1);
assert.equal(registry.get('user_crystals'), 77, 'bulk test grant must not change crystals');
assert.equal(JSON.stringify(registry.get('equipment_upgrades')), beforeUpgrade, 'bulk test grant must not upgrade duplicates');
assert.equal(registry.get('equipped_hat'), 'item_hat_daily_01', 'bulk test grant must not change equipped items');
assert.equal(grantAllItemsForTesting(registry, ITEM_DB).length, 0, 'second bulk grant should be idempotent');

const collectionSource = fs.readFileSync(path.join(root, 'src/scenes/Collection.js'), 'utf8');
assert(collectionSource.includes('獲得全道具（測試用）'));
assert(collectionSource.includes("'grant-all-items'"));

console.log('PASS v5.2 wardrobe: all assets mapped, bulk test grant is complete, idempotent and save-safe.');
