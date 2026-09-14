import assert from 'node:assert/strict';
import {
    PAPER_DOLL_FILES,
    PAPER_DOLL_LAYOUT,
    currentLook,
    textureForItem
} from '../src/data/PaperDollConfig.js';

class Registry {
    constructor(data = {}) { this.data = new Map(Object.entries(data)); }
    get(key) { return this.data.get(key); }
}

const daily = 'item_cloth_daily_01';
const pink = 'item_fullset_pink_home_01';
const clip = 'item_hat_daily_01';
const scout = 'item_collectible_scout_test_01';
const registry = new Registry({
    equipped_hat: clip,
    equipped_cloth: daily,
    equipped_fullset: 'none',
    equipped_collectible: scout
});

assert.equal(PAPER_DOLL_FILES.wardrobe_doll_daily_v50, 'assets/wardrobe_v50/doll_daily_v50.png');
assert.equal(textureForItem(daily), 'wardrobe_doll_daily_v50');
assert.equal(textureForItem(pink), 'wardrobe_doll_pink_v50');
assert.equal(textureForItem('item_cloth_fairy_01'), 'wardrobe_doll_fairy_v52');
assert.equal(textureForItem('item_hat_constellation_01'), 'wardrobe_hat_star_magic_v53');
assert(PAPER_DOLL_LAYOUT.worldMap.maxHeight < PAPER_DOLL_LAYOUT.wardrobe.maxHeight);

let look = currentLook(registry);
assert.equal(look.bodyId, daily);
assert.equal(look.hatId, clip);
assert.equal(look.collectibleId, scout);

look = currentLook(registry, pink);
assert.equal(look.bodyId, pink);
assert.equal(look.bodyIsConverted, true);
assert.equal(look.clothId, 'none');
assert.equal(look.hatId, clip, '預覽身體造型時保留頭部裝備');

look = currentLook(registry, '__none_hat__');
assert.equal(look.hatId, 'none');
assert.equal(look.bodyId, daily);

look = currentLook(registry, 'item_fullset_secret_guard');
assert.equal(look.bodyIsConverted, true, '母上的守護應使用新版正式公仔');
assert.equal(look.bodyTexture, 'wardrobe_doll_mother_guard_v53');

look = currentLook(registry, 'item_fullset_explore_01');
assert.equal(look.bodyIsConverted, true);
assert.equal(look.hatSuppressed, false, '野外小偵查已移除內建帽子，應可另戴頭飾');

console.log('PASS v5.3 paper doll: converted outfits, master-aligned hats, hat-free fullsets and guardian look resolution.');
