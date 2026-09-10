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
    gold_grass_encyclopedia: [],
    achievements: [],
    tutorial_flags: {},

    placed_decorations: [],

    equipped_hat: 'none',
    equipped_cloth: 'none',
    equipped_fullset: 'none',
    equipped_collectible: 'none',
    minigame_stats: {
        treasure: {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            bestBaseScore: 0,
            dailyGrassDate: '',
            goldenBugUnlocked: false,
            goldenBugDiscovered: false,
            goldenBugFindCount: 0,
            goldenBugMissStreak: 0,
            noFlagClearCount: 0,
            noFlagAchievementRuleVersion: 2,
            fullAchievementRewardClaimed: false
        },
        firefly: { playCount: 0, clearCount: 0, bestScore: 0 },
        fireflyCatch: {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            lastScore: 0,
            bestAccuracy: 0,
            bestCombo: 0,
            fastestSeconds: 0
        },
        lanternMaze: { playCount: 0, clearCount: 0, bestScore: 0 },
        campfire: {
            mode: 'kids',
            kids: {
                playCount: 0,
                clearCount: 0,
                bestScore: 0,
                lastScore: 0,
                bestAccuracy: 0,
                bestCombo: 0,
                perfectClearCount: 0,
                totalPerfectCount: 0,
                rainbowPerfectCount: 0,
                timeoutCount: 0,
                fastestSeconds: 0,
                rainbowMarshmallowCount: 0,
                rainbowMarshmallowDiscovered: false
            },
            challenge: {},
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            rainbowMarshmallowCount: 0,
            rainbowPerfectCount: 0
        },
        constellation: {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            lastScore: 0,
            bestAccuracy: 0,
            bestCombo: 0,
            perfectClearCount: 0,
            fewestMistakes: null,
            fastestSeconds: 0,
            rainbowStarCount: 0,
            friendEncyclopedia: {}
        },
        animals: {
            mode: 'kids',
            kids: {
                playCount: 0,
                clearCount: 0,
                bestScore: 0,
                lastScore: 0,
                bestAccuracy: 0,
                bestCombo: 0,
                perfectClearCount: 0,
                fastestSeconds: 0,
                friendBook: []
            },
            challenge: {},
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            friendBook: []
        }
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
        rarity: 'good',
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
        rarity: 'base',
        texture: 'wardrobe_doll_daily_v50',
        icon: 'wardrobe_doll_daily_v50',
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
        rarity: 'good',
        texture: 'wardrobe_doll_pink_v50',
        icon: 'wardrobe_doll_pink_v50',
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
        texture: 'wardrobe_hat_crown_v53',
        icon: 'wardrobe_hat_icon_crown_v53',
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
        texture: 'wardrobe_doll_fairy_v52',
        icon: 'wardrobe_doll_fairy_v52',
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
        texture: 'wardrobe_hat_explorer_v53',
        icon: 'wardrobe_hat_icon_explorer_v53',
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
        texture: 'wardrobe_doll_explore_v53',
        icon: 'wardrobe_doll_explore_v53',
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
        texture: 'wardrobe_doll_explore_full_v53',
        icon: 'wardrobe_doll_explore_full_v53',
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
        texture: 'wardrobe_hat_firefly_v53',
        icon: 'wardrobe_hat_icon_firefly_v53',
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
        texture: 'wardrobe_doll_firefly_v53',
        icon: 'wardrobe_doll_firefly_v53',
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
        texture: 'wardrobe_doll_forest_fairy_v53',
        icon: 'wardrobe_doll_forest_fairy_v53',
        placeable: false,
        effects: {
            extraMistake: 1
        },
        desc: '帶有森林魔法的精靈服。',
        status: 'ready',
        notes: '螢火蟲關卡限定裝'
    },

    item_hat_forest_fairy_01: {
        id: 'item_hat_forest_fairy_01',
        name: '森林精靈冠',
        category: 'equipment',
        type: 'hat',
        source: 'firefly',
        rarity: 'stage',
        texture: 'wardrobe_hat_forest_fairy_v53',
        icon: 'wardrobe_hat_icon_forest_fairy_v53',
        placeable: false,
        effects: {},
        desc: '森林精靈服的獨立葉冠，也能搭配其他服裝。',
        status: 'ready',
        notes: '螢火蟲關卡限定頭飾；能力待平衡'
    },

    item_hat_campfire_01: {
        id: 'item_hat_campfire_01',
        name: '火焰廚師帽',
        category: 'equipment',
        type: 'hat',
        source: 'campfire',
        rarity: 'stage',
        texture: 'wardrobe_hat_chef_v53',
        icon: 'wardrobe_hat_icon_chef_v53',
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
        texture: 'wardrobe_doll_campfire_v53',
        icon: 'wardrobe_doll_campfire_v53',
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
        texture: 'wardrobe_doll_chef_v52',
        icon: 'wardrobe_doll_chef_v52',
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
        texture: 'wardrobe_hat_star_magic_v53',
        icon: 'wardrobe_hat_icon_star_magic_v53',
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
        texture: 'wardrobe_doll_constellation_v53',
        icon: 'wardrobe_doll_constellation_v53',
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
        texture: 'wardrobe_doll_astronaut_v52',
        icon: 'wardrobe_doll_astronaut_v52',
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
        texture: 'wardrobe_doll_mother_guard_v53',
        icon: 'icon_guard',
        placeable: false,
        effects: {
            noHeartCost: 1,
            ignoreReputationLock: 1
        },
        desc: '感受到了母親大人的愛意。\n進入關卡不消耗體力，並可無視聲望門檻。',
        status: 'ready',
        notes: '彩蛋裝備'
    },

    item_decoration_golden_bug_house_bush: {
        id: 'item_decoration_golden_bug_house_bush',
        name: '黃金蟲小屋',
        category: 'decoration',
        type: 'decoration',
        source: 'bush',
        rarity: 'legendary',
        texture: 'q_golden_bug_house',
        icon: 'q_golden_bug_house',
        collectionScale: 0.22,
        placeable: true,
        effects: {},
        desc: '完成草叢探險全部成就的紀念裝飾。已放在森林營地中。',
        status: 'ready',
        notes: '草叢探險全成就獎勵'
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
