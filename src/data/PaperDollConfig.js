import { HOMEWEAR_ITEMS, HOMEWEAR_BODIES } from './HomewearData.js';
import { ITEM_DB } from './GameData.js';
import { FAIRY_ITEMS, FAIRY_FILES, FAIRY_BODIES } from './FairyWardrobeData.js';
import { LAYER_FILES } from './PaperDollLayers.js';
import { BODY_LAYERS, HEAD_LAYERS, ICON_KEYS } from './WardrobeHeadData.js';
import { applyInventoryIcons } from './WardrobeIcons.js';
Object.assign(ITEM_DB, FAIRY_ITEMS, HOMEWEAR_ITEMS);
applyInventoryIcons(ITEM_DB);
for (const [id, icon] of Object.entries(ICON_KEYS)) if (ITEM_DB[id]) { ITEM_DB[id].icon=icon; ITEM_DB[id].iconKind='object'; }
for (const [id, texture] of Object.entries(HEAD_LAYERS)) if (ITEM_DB[id]) { ITEM_DB[id].texture=texture; }

// v6.3: split-layer combo files must be part of the preload manifest. Without
// this registration the resolver sees the new art as missing and deliberately
// falls back to the standalone outfit and legacy hat.
export const PAPER_DOLL_VERSION = 704;

export const PAPER_DOLL_TEXTURES = {
    ...FAIRY_BODIES,
    ...Object.fromEntries(Object.entries(HOMEWEAR_BODIES).map(([id,v])=>[id,v.outfitBody])),
    item_cloth_daily_01: 'wardrobe_doll_daily_v50',
    item_fullset_pink_home_01: 'wardrobe_doll_pink_v50',
    item_cloth_fairy_01: 'wardrobe_doll_fairy_v52',
    item_cloth_explore_01: 'wardrobe_doll_explore_v53',
    item_fullset_explore_01: 'wardrobe_doll_explore_full_v53',
    item_cloth_firefly_01: 'wardrobe_doll_firefly_v53',
    item_fullset_firefly_01: 'wardrobe_doll_forest_fairy_v53',
    item_cloth_campfire_01: 'wardrobe_doll_campfire_v53',
    item_fullset_campfire_01: 'wardrobe_doll_chef_v52',
    item_cloth_constellation_01: 'wardrobe_doll_constellation_v53',
    item_fullset_constellation_01: 'wardrobe_doll_astronaut_v52',
    item_fullset_secret_guard: 'wardrobe_doll_mother_guard_v53'
};

export const PAPER_DOLL_FILES = { ...LAYER_FILES };

export const PAPER_DOLL_LAYOUT = {
    wardrobe: {
        centerX: 225,
        centerY: 376,
        maxWidth: 284,
        maxHeight: 450,
        hatAnchorX: 0.67,
        hatAnchorY: 0.205,
        accessoryAnchorX: 0.77,
        accessoryAnchorY: 0.53
    },
    worldMap: {
        centerX: 350,
        centerY: 520,
        maxWidth: 168,
        maxHeight: 252,
        hatAnchorX: 0.67,
        hatAnchorY: 0.205,
        accessoryAnchorX: 0.77,
        accessoryAnchorY: 0.53
    }
};

export function textureForItem(itemId) {
    if (!itemId || itemId === 'none') return null;
    return PAPER_DOLL_TEXTURES[itemId] || ITEM_DB[itemId]?.texture || null;
}

export function currentLook(registry, previewId = null) {
    const look = {
        hatId: registry.get('equipped_hat') || 'none',
        clothId: registry.get('equipped_cloth') || 'none',
        fullsetId: registry.get('equipped_fullset') || 'none',
        collectibleId: registry.get('equipped_collectible') || 'none'
    };

    if (previewId === '__none_hat__') look.hatId = 'none';
    else if (previewId === '__none_accessory__') look.collectibleId = 'none';
    else if (ITEM_DB[previewId]) {
        const item = ITEM_DB[previewId];
        if (item.type === 'hat') look.hatId = previewId;
        if (item.type === 'collectible') look.collectibleId = previewId;
        if (item.type === 'cloth') {
            look.clothId = previewId;
            look.fullsetId = 'none';
        }
        if (item.type === 'fullset') {
            look.fullsetId = previewId;
            look.clothId = 'none';
        }
    }

    look.bodyId = look.fullsetId !== 'none'
        ? look.fullsetId
        : (look.clothId !== 'none' ? look.clothId : 'item_cloth_daily_01');
    // Only approved 1024x1536 masters may be used as a body. Legacy item art can
    // still be listed in the wardrobe, but falls back safely until it is redrawn.
    look.bodyIsConverted = Boolean(PAPER_DOLL_TEXTURES[look.bodyId]);
    look.bodyTexture = HOMEWEAR_BODIES[look.bodyId]?.outfitBody || BODY_LAYERS[look.bodyId]?.outfitBody || BODY_LAYERS.item_cloth_daily_01.outfitBody;
    look.hatSuppressed = false;
    look.hatHeadProfile = ITEM_DB[look.hatId]?.headProfile || 'neutral';
    look.hatTexture = look.hatSuppressed ? null : textureForItem(look.hatId);
    look.collectibleTexture = textureForItem(look.collectibleId);
    return look;
}

export function fitImage(image, maxWidth, maxHeight) {
    if (!image?.width || !image?.height) return image;
    // Recovered v59 hats are pre-aligned; keep the legacy correction for v55/v56 only.
    if (/^wardrobe_hat_.*_v(?:55|56)$/.test(image.texture?.key || '')) {
        const scale = Math.min(maxWidth / 1024, maxHeight / 1536);
        image.setScale(scale);
        image.y -= 132 * scale;
        return image;
    }
    image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height));
    return image;
}
