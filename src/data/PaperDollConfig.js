import { ITEM_DB } from './GameData.js';
import { FAIRY_ITEMS, FAIRY_FILES, FAIRY_BODIES } from './FairyWardrobeData.js';
Object.assign(ITEM_DB, FAIRY_ITEMS);

export const PAPER_DOLL_VERSION = 3;

export const PAPER_DOLL_TEXTURES = {
    ...FAIRY_BODIES,
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

export const PAPER_DOLL_FILES = {
    ...FAIRY_FILES,
    wardrobe_doll_daily_v50: 'assets/wardrobe_v50/doll_daily_v50.png',
    wardrobe_doll_pink_v50: 'assets/wardrobe_v50/doll_pink_home_v50_alpha.png',
    wardrobe_doll_fairy_v52: 'assets/wardrobe_v52/doll_fairy_v52.png',
    wardrobe_doll_explore_v52: 'assets/wardrobe_v52/doll_explore_v52.png',
    wardrobe_doll_explore_full_v52: 'assets/wardrobe_v52/doll_explore_full_v52.png',
    wardrobe_doll_firefly_v52: 'assets/wardrobe_v52/doll_firefly_v52.png',
    wardrobe_doll_forest_fairy_v52: 'assets/wardrobe_v52/doll_forest_fairy_v52.png',
    wardrobe_doll_campfire_v52: 'assets/wardrobe_v52/doll_campfire_v52.png',
    wardrobe_doll_chef_v52: 'assets/wardrobe_v52/doll_chef_v52.png',
    wardrobe_doll_constellation_v52: 'assets/wardrobe_v52/doll_constellation_v52.png',
    wardrobe_doll_astronaut_v52: 'assets/wardrobe_v52/doll_astronaut_v52.png',
    wardrobe_doll_explore_v53: 'assets/wardrobe_v53/doll_explore_v53.png',
    wardrobe_doll_explore_full_v53: 'assets/wardrobe_v53/doll_explore_full_nohat_v53.png',
    wardrobe_doll_firefly_v53: 'assets/wardrobe_v53/doll_firefly_v53.png',
    wardrobe_doll_forest_fairy_v53: 'assets/wardrobe_v53/doll_forest_fairy_nohat_v53.png',
    wardrobe_doll_campfire_v53: 'assets/wardrobe_v53/doll_campfire_v53.png',
    wardrobe_doll_constellation_v53: 'assets/wardrobe_v53/doll_constellation_v53.png',
    wardrobe_doll_mother_guard_v53: 'assets/wardrobe_v53/doll_mother_guard_v53.png',
    wardrobe_hat_crown_v53: 'assets/wardrobe_v53/hat_overlay_crown_v53.png',
    wardrobe_hat_explorer_v53: 'assets/wardrobe_v53/hat_overlay_explorer_v53.png',
    wardrobe_hat_firefly_v53: 'assets/wardrobe_v53/hat_overlay_firefly_v53.png',
    wardrobe_hat_chef_v53: 'assets/wardrobe_v53/hat_overlay_chef_v53.png',
    wardrobe_hat_star_magic_v53: 'assets/wardrobe_v53/hat_overlay_star_magic_v53.png',
    wardrobe_hat_forest_fairy_v53: 'assets/wardrobe_v53/hat_overlay_forest_fairy_v53.png',
    wardrobe_hat_icon_crown_v53: 'assets/wardrobe_v53/hat_icon_crown_v53.png',
    wardrobe_hat_icon_explorer_v53: 'assets/wardrobe_v53/hat_icon_explorer_v53.png',
    wardrobe_hat_icon_firefly_v53: 'assets/wardrobe_v53/hat_icon_firefly_v53.png',
    wardrobe_hat_icon_chef_v53: 'assets/wardrobe_v53/hat_icon_chef_v53.png',
    wardrobe_hat_icon_star_magic_v53: 'assets/wardrobe_v53/hat_icon_star_magic_v53.png',
    wardrobe_hat_icon_forest_fairy_v53: 'assets/wardrobe_v53/hat_icon_forest_fairy_v53.png'
};

export const PAPER_DOLL_LAYOUT = {
    wardrobe: {
        centerX: 225,
        centerY: 395,
        maxWidth: 284,
        maxHeight: 385,
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
    look.bodyTexture = PAPER_DOLL_TEXTURES[look.bodyId] || PAPER_DOLL_TEXTURES.item_cloth_daily_01;
    look.hatSuppressed = Boolean(ITEM_DB[look.bodyId]?.integratedHat);
    look.hatTexture = look.hatSuppressed ? null : textureForItem(look.hatId);
    look.collectibleTexture = textureForItem(look.collectibleId);
    return look;
}

export function fitImage(image, maxWidth, maxHeight) {
    if (!image?.width || !image?.height) return image;
    if (/^wardrobe_hat_.*_v55$/.test(image.texture?.key || '')) {
        const scale = Math.min(maxWidth / 1024, maxHeight / 1536);
        image.setScale(scale);
        image.y -= 132 * scale;
        return image;
    }
    image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height));
    return image;
}
