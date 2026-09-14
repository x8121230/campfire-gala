// src/data/CollectibleData.js

/**
 * 收藏品系統（圖鑑 / 彩蛋 / 紀念物）
 * 
 * 與裝備分離，不影響戰鬥或掉落平衡
 */

export const COLLECTIBLE_DB = {

    col_bug_leaf_01: {
        id: 'col_bug_leaf_01',
        name: '小葉蟲',
        category: 'collectible',
        group: 'bush',
        rarity: 'common',
        icon: 'col_bug_leaf_01',
        desc: '躲在草叢裡的小蟲。',
    },

    col_bug_red_01: {
        id: 'col_bug_red_01',
        name: '紅色小蟲',
        category: 'collectible',
        group: 'bush',
        rarity: 'rare',
        icon: 'col_bug_red_01',
        desc: '顏色鮮豔的小蟲。',
    },

    col_bug_big_01: {
        id: 'col_bug_big_01',
        name: '大蟲',
        category: 'collectible',
        group: 'bush',
        rarity: 'epic',
        icon: 'col_bug_big_01',
        desc: '比較少見的大型蟲。',
    }

};

/**
 * 工具函式
 */

export function getCollectibleData(id) {
    return COLLECTIBLE_DB[id] || null;
}

export function getAllCollectibles() {
    return Object.values(COLLECTIBLE_DB);
}

export function getCollectiblesByGroup(group) {
    return Object.values(COLLECTIBLE_DB).filter(c => c.group === group);
}