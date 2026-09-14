import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEM_DB } from '../src/data/GameData.js';
import { PAPER_DOLL_FILES, PAPER_DOLL_TEXTURES, PAPER_DOLL_VERSION } from '../src/data/PaperDollConfig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v53 = Object.entries(PAPER_DOLL_FILES).filter(([, relative]) => relative.includes('/wardrobe_v53/'));

assert.equal(PAPER_DOLL_VERSION, 3);
assert(v53.length >= 19, 'v5.3 should register revised bodies, aligned overlays and card icons');
v53.forEach(([key, relative]) => {
    const full = path.join(root, relative);
    assert(fs.existsSync(full), `missing v5.3 asset: ${key}`);
    const png = fs.readFileSync(full);
    assert.equal(png.toString('ascii', 1, 4), 'PNG', `not a PNG: ${relative}`);
    assert.equal(png[25], 6, `asset must be RGBA: ${relative}`);
});

[
    'item_cloth_explore_01', 'item_fullset_explore_01', 'item_cloth_firefly_01',
    'item_fullset_firefly_01', 'item_cloth_campfire_01', 'item_cloth_constellation_01',
    'item_fullset_secret_guard'
].forEach(id => assert(PAPER_DOLL_TEXTURES[id]?.includes('v53'), `missing revised v5.3 body mapping: ${id}`));

assert.equal(ITEM_DB.item_fullset_explore_01.integratedHat, undefined);
assert.equal(ITEM_DB.item_fullset_firefly_01.integratedHat, undefined);
assert.equal(ITEM_DB.item_hat_forest_fairy_01.type, 'hat');
assert.equal(ITEM_DB.item_fullset_secret_guard.icon, 'icon_guard', 'legacy memorial image remains the collection icon');
assert.equal(ITEM_DB.item_fullset_secret_guard.texture, 'wardrobe_doll_mother_guard_v53');

const collection = fs.readFileSync(path.join(root, 'src/scenes/Collection.js'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'src/managers/CharacterManager.js'), 'utf8');
assert(!collection.includes('hatLayoutFor'));
assert(!manager.includes('hatLayoutFor'));
assert(collection.includes('fitImage(hat, layout.maxWidth, layout.maxHeight)'));
assert(manager.includes('fitImage(this.hat, this.layout.maxWidth, this.layout.maxHeight)'));

console.log('PASS v5.3 wardrobe: revised shoes, separate headwear, aligned overlays and Mother\'s Guardian doll are registered.');
