// Inventory artwork is independent of full-size paper-doll textures.
// v6.4 product icons use opaque cream tiles, not transparent character layers.
export const FAIRY_CLOTHING_ICON_SLUGS = [
    'peach', 'dandelion', 'acorn', 'raincoat', 'orbit',
    'bear', 'sister', 'squirrel', 'owl', 'rainbow',
    'lily_valley', 'pitcher_overalls', 'maple_cloak', 'moss_lantern', 'alice_poker',
    'crystal_rose_gown', 'pumpkin_mage', 'cloud_tutu', 'clockwork_overalls', 'aviator_jacket',
    'dynamo_coil', 'tin_woodman', 'chameleon', 'peacock', 'penguin_ice',
    'lion_vest', 'trex_stomp', 'stegosaurus', 'pterodactyl', 'triceratops', 'starlight_pillow'
];
export const inventoryIconKey = slug => `wardrobe_itemicon_${slug}_v64`;
export const WARDROBE_ICON_FILES = Object.fromEntries(
    [...FAIRY_CLOTHING_ICON_SLUGS, 'daily', 'pink_home'].map(slug => [
        inventoryIconKey(slug), `assets/wardrobe_v64_icons/icon_${slug}_v64.png`
    ])
);
export const LEGACY_ICON_OVERRIDES = {
    item_cloth_daily_01: inventoryIconKey('daily'),
    item_fullset_pink_home_01: inventoryIconKey('pink_home')
};
export function applyInventoryIcons(items) {
    for (const [id, icon] of Object.entries(LEGACY_ICON_OVERRIDES)) {
        if (items[id]) items[id].icon = icon;
    }
}
export function isPaperDollTexture(key) {
    return typeof key === 'string' && /(?:^|_)(?:doll|headstyle|outfit|effect)(?:_|$)/i.test(key);
}
// Explicit icon only. A missing thumbnail must never fall back to worn art.
export function resolveInventoryIcon(item, exists) {
    const key = item?.icon;
    if (!key || isPaperDollTexture(key) || !exists(key)) return null;
    if (['cloth', 'fullset'].includes(item.type) && key === item.texture && item.iconKind !== 'object') return null;
    return key;
}
export function inventoryIconScale(width, height, maxW, maxH) {
    if (![width, height, maxW, maxH].every(n => Number.isFinite(n) && n > 0)) return 0;
    return Math.min(maxW / width, maxH / height);
}
