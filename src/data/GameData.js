//// src/data/GameData.js
import { DROP_TABLES } from './DropTables.js';
export const SAVE_KEY = 'forest_save_data';

export const DEFAULT_STAGE_PROGRESS = {

    bush_01: {
        unlocked: true,
        cleared: false,
        stars: 0,
        bestScore: 0,
        firstClearRewardClaimed: false
    },

    campfire_01: {
        unlocked: false,
        cleared: false,
        stars: 0,
        bestScore: 0,
        firstClearRewardClaimed: false
    },

    firefly_01: {
        unlocked: false,
        cleared: false,
        stars: 0,
        bestScore: 0,
        firstClearRewardClaimed: false
    },

    constellation_01: {
        unlocked: false,
        cleared: false,
        stars: 0,
        bestScore: 0,
        firstClearRewardClaimed: false
    },

    animals_01: {
        unlocked: false,
        cleared: false,
        stars: 0,
        bestScore: 0,
        firstClearRewardClaimed: false
    }

};

export const DEFAULT_SAVE_DATA = {
    hearts: 5,
    max_hearts: 5,
    recovery_seconds: 7200,
    next_heart_time: null,

    user_crystals: 50,
    reputation: 0,

    owned_items: [
        'item_hat_daily_01',
        'item_cloth_daily_01',
        'item_fullset_pink_home_01'

    ],

    owned_collectibles: [],

    placed_decorations: [],

    equipped_hat: 'none',
    equipped_cloth: 'none',
    equipped_fullset: 'none',
    equipped_collectible: 'none',
    minigame_stats: {
        treasure: { playCount: 0, clearCount: 0, bestScore: 0 },
        firefly: { playCount: 0, clearCount: 0, bestScore: 0 },
        campfire: { playCount: 0, clearCount: 0, bestScore: 0 },
        constellation: { playCount: 0, clearCount: 0, bestScore: 0 },
        animals: { playCount: 0, clearCount: 0, bestScore: 0 }
    },

    bonus_play_counts: {},
    bonus_reward_rates: {},
    bonus_drop_rates: {},

    secret_state: {
        motherGuardUnlocked: false,
        motherGuardPendingReward: false,
        motherGuardSequence: [],
        motherGuardSequenceStartTime: 0
    },

    stage_progress: JSON.parse(JSON.stringify(DEFAULT_STAGE_PROGRESS))
};


export const ITEM_DB = {
    item_hat_daily_01: {
        id: 'item_hat_daily_01',
        name: '小髮夾',
        category: 'equipment',
        type: 'hat',
        source: 'starter',
        rarity: 'common',
        texture: 'item_hat_daily_01',
        icon: 'item_hat_daily_01',
        placeable: false,
        effects: {},
        desc: '簡單可愛的小髮夾。',
        status: 'ready',
        notes: '初始贈送'
    },

    item_cloth_daily_01: {
        id: 'item_cloth_daily_01',
        name: '休閒裝',
        category: 'equipment',
        type: 'cloth',
        source: 'starter',
        rarity: 'common',
        texture: 'item_cloth_daily_01',
        icon: 'item_cloth_daily_01',
        placeable: false,
        effects: {},
        desc: '舒服的日常穿搭。',
        status: 'ready',
        notes: '初始贈送'
    },

    item_fullset_pink_home_01: {
        id: 'item_fullset_pink_home_01',
        name: '粉色居家服',
        category: 'equipment',
        type: 'fullset',
        source: 'starter',
        rarity: 'common',
        texture: 'fullset_pink_home_01',
        icon: 'icon_fullset_pink_home_01',
        placeable: false,
        effects: {
            rewardRate: 10,
            dropRate: 5,
            extraPlayCount: 1
        },
        desc: '舒服又可愛的粉色居家服。',
        status: 'ready',
        notes: '初始贈送'
    },

    item_collectible_scout_test_01: {
        id: 'item_collectible_scout_test_01',
        name: '豬寶淚',
        category: 'equipment',
        type: 'collectible',
        source: 'bush',
        rarity: 'rare',
        texture: 'item_collectible_pigtear',
        icon: 'icon_collectible_pigtear',
        placeable: false,
        effects: {},
        desc: '每局可隨機探索一格未挖開區域。',
        skill: {
            type: 'scout',
            usesPerRun: 1
        },
        status: 'ready',
        notes: '測試收藏品'
    },

    item_hat_tiara_global: {
        id: 'item_hat_tiara_global',
        name: '小皇冠',
        category: 'equipment',
        type: 'hat',
        source: 'global',
        rarity: 'rare',
        texture: 'hat_tiara',
        icon: 'item_hat_tiara',
        placeable: false,
        effects: {
            rewardRate: 20
        },
        desc: '讓寶箱獎勵更豐富。',
        status: 'ready',
        notes: '全域稀有裝'
    },

    item_cloth_fairy_01: {
        id: 'item_cloth_fairy_01',
        name: '小仙子洋裝',
        category: 'equipment',
        type: 'cloth',
        source: 'firefly',
        rarity: 'stage',
        texture: 'cloth_fairy',
        icon: 'item_cloth_fairy',
        placeable: false,
        effects: {
            dropRate: 15
        },
        desc: '穿上後更容易找到好東西。',
        status: 'ready',
        notes: '螢火蟲關卡限定裝'
    },

    item_hat_explore_01: {
        id: 'item_hat_explore_01',
        name: '探險遮陽帽',
        category: 'equipment',
        type: 'hat',
        source: 'bush',
        rarity: 'stage',
        texture: 'hat_explorer',
        icon: 'icon_hat_explorer',
        placeable: false,
        effects: {
            extraPlayCount: 1
        },
        desc: '探險時能多一次嘗試機會。',
        status: 'ready',
        notes: '草叢尋寶限定裝'
    },

    item_cloth_explore_01: {
        id: 'item_cloth_explore_01',
        name: '多口袋背心',
        category: 'equipment',
        type: 'cloth',
        source: 'bush',
        rarity: 'stage',
        texture: 'cloth_explorer',
        icon: 'icon_cloth_explorer',
        placeable: false,
        effects: {
            dropRate: 10
        },
        desc: '身上掛滿各種探險口袋。',
        status: 'ready',
        notes: '草叢尋寶限定裝'
    },

    item_fullset_explore_01: {
        id: 'item_fullset_explore_01',
        name: '野外小偵查',
        category: 'equipment',
        type: 'fullset',
        source: 'bush',
        rarity: 'stage',
        texture: 'fullset_explorer',
        icon: 'icon_fullset_explorer',
        placeable: false,
        effects: {
            revealHint: 1
        },
        desc: '一件充滿探險味道的衣服。',
        status: 'ready',
        notes: '草叢尋寶限定裝'
    },

    item_hat_firefly_01: {
        id: 'item_hat_firefly_01',
        name: '螢光小帽',
        category: 'equipment',
        type: 'hat',
        source: 'firefly',
        rarity: 'stage',
        texture: 'hat_firefly',
        icon: 'icon_hat_firefly',
        placeable: false,
        effects: {
            timeBonus: 3
        },
        desc: '夜晚的螢光會停留得更久。',
        status: 'ready',
        notes: '螢火蟲關卡限定裝'
    },

    item_cloth_firefly_01: {
        id: 'item_cloth_firefly_01',
        name: '發光小背心',
        category: 'equipment',
        type: 'cloth',
        source: 'firefly',
        rarity: 'stage',
        texture: 'cloth_firefly',
        icon: 'icon_cloth_firefly',
        placeable: false,
        effects: {
            rewardRate: 15
        },
        desc: '微微發光的小背心。',
        status: 'ready',
        notes: '螢火蟲關卡限定裝'
    },

    item_fullset_firefly_01: {
        id: 'item_fullset_firefly_01',
        name: '森林精靈服',
        category: 'equipment',
        type: 'fullset',
        source: 'firefly',
        rarity: 'stage',
        texture: 'fullset_firefly',
        icon: 'icon_fullset_firefly',
        placeable: false,
        effects: {
            extraMistake: 1
        },
        desc: '帶有森林魔法的精靈服。',
        status: 'ready',
        notes: '螢火蟲關卡限定裝'
    },

    item_hat_campfire_01: {
        id: 'item_hat_campfire_01',
        name: '火焰廚師帽',
        category: 'equipment',
        type: 'hat',
        source: 'campfire',
        rarity: 'stage',
        texture: 'hat_cook',
        icon: 'icon_hat_cook',
        placeable: false,
        effects: {
            timeBonus: 3
        },
        desc: '營火料理專用廚師帽。',
        status: 'ready',
        notes: '營火關卡限定裝'
    },

    item_cloth_campfire_01: {
        id: 'item_cloth_campfire_01',
        name: '美味圍裙',
        category: 'equipment',
        type: 'cloth',
        source: 'campfire',
        rarity: 'stage',
        texture: 'cloth_cook',
        icon: 'icon_cloth_cook',
        placeable: false,
        effects: {
            rewardRate: 20
        },
        desc: '料理時的必備圍裙。',
        status: 'ready',
        notes: '營火關卡限定裝'
    },

    item_fullset_campfire_01: {
        id: 'item_fullset_campfire_01',
        name: '三星大廚袍',
        category: 'equipment',
        type: 'fullset',
        source: 'campfire',
        rarity: 'stage',
        texture: 'fullset_cook',
        icon: 'icon_fullset_cook',
        placeable: false,
        effects: {
            extraMistake: 1
        },
        desc: '穿上就像營火料理大師。',
        status: 'ready',
        notes: '營火關卡限定裝'
    },

    item_hat_constellation_01: {
        id: 'item_hat_constellation_01',
        name: '星辰魔法帽',
        category: 'equipment',
        type: 'hat',
        source: 'constellation',
        rarity: 'stage',
        texture: 'hat_constellation',
        icon: 'icon_hat_constellation',
        placeable: false,
        effects: {
            timeBonus: 3
        },
        desc: '尖尖的藍色帽子，布滿小星星。',
        status: 'ready',
        notes: '星座關卡限定裝'
    },

    item_cloth_constellation_01: {
        id: 'item_cloth_constellation_01',
        name: '銀河特工衣',
        category: 'equipment',
        type: 'cloth',
        source: 'constellation',
        rarity: 'stage',
        texture: 'cloth_constellation',
        icon: 'icon_cloth_constellation',
        placeable: false,
        effects: {
            rewardRate: 15
        },
        desc: '深藍色的衣服上有銀線星座圖。',
        status: 'ready',
        notes: '星座關卡限定裝'
    },

    item_fullset_constellation_01: {
        id: 'item_fullset_constellation_01',
        name: '小小太空人',
        category: 'equipment',
        type: 'fullset',
        source: 'constellation',
        rarity: 'stage',
        texture: 'fullset_constellation',
        icon: 'icon_fullset_constellation',
        placeable: false,
        effects: {
            revealHint: 1
        },
        desc: '全白的探險裝，背後有星星氣瓶。',
        status: 'ready',
        notes: '星座關卡限定裝'
    },

    item_fullset_secret_guard: {
        id: 'item_fullset_secret_guard',
        name: '母上的守護',
        category: 'equipment',
        type: 'fullset',
        source: 'secret',
        rarity: 'legendary',
        texture: 'fullset_guard', ///外觀
        icon: 'icon_guard',
        placeable: false,
        effects: {
            noHeartCost: 1,
            ignoreReputationLock: 1
        },
        desc: '感受到了母親大人的愛意。\n進入關卡不消耗體力，並可無視聲望門檻。',
        status: 'ready',
        notes: '彩蛋裝備'
    }
};

export const ITEM_LIST = Object.values(ITEM_DB);


export function getItemData(itemId) {
    return ITEM_DB[itemId] || null;
}

export function getItemEffect(itemId, effectKey) {
    const item = ITEM_DB[itemId];
    if (!item || !item.effects) return 0;
    return item.effects[effectKey] || 0;
}

export function getDropTable(stageId, chestType, rarity = null) {
    const stageTable = DROP_TABLES[stageId];
    if (!stageTable) return rarity ? [] : null;

    const chestTable = stageTable[chestType];
    if (!chestTable) return rarity ? [] : null;

    if (!rarity) return chestTable;

    return chestTable[rarity] || [];
}

export function isValidItemId(itemId) {
    return !!ITEM_DB[itemId];
}

export function getItemsByType(type) {
    return ITEM_LIST.filter(item => item.type === type);
}

export function getItemsBySource(source) {
    return ITEM_LIST.filter(item => item.source === source);
}

export function getItemsByRarity(rarity) {
    return ITEM_LIST.filter(item => item.rarity === rarity);
}

export function getOwnedItemDataList(ownedIds = []) {
    return ownedIds
        .map(id => ITEM_DB[id])
        .filter(Boolean);
}