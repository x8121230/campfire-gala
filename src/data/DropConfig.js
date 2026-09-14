// src/data/DropConfig.js

export const DROP_CONFIG = {
    // ===== 基礎獎勵 =====
    base: {
        clear: {
            crystals: 0,
            reputation: 1
        },
        fail: {
            crystals: 0,
            reputation: 0
        },
        goldBonus: {
            crystals: 1,
            reputation: 1
        }
    },

    // ===== 小寶箱 =====
    // 定位：安慰獎 / 最低分過關保底
    smallChest: [
        { type: 'crystals', amount: 0, weight: 30 },
        { type: 'crystals', amount: 1, weight: 20 },
        { type: 'reputation', amount: 1, weight: 23 },
        { type: 'reputation', amount: 2, weight: 20 },
        { type: 'item', rarity: 'common', weight: 5 },
        { type: 'item', rarity: 'rare', weight: 2 }
    ],

    // ===== 大寶箱 =====
    // 定位：正常高價值獎勵 / 金草叢主獎
    bigChest: [
        { type: 'crystals', amount: 1, weight: 25 },
        { type: 'crystals', amount: 2, weight: 15 },
        { type: 'reputation', amount: 2, weight: 25 },
        { type: 'reputation', amount: 3, weight: 20 },
        { type: 'item', rarity: 'common', weight: 10 },
        { type: 'item', rarity: 'rare', weight: 5 }
    ],

    // ===== 關卡寶箱（通關固定給）=====
    // 固定：聲望 +1
    // 再抽附加內容
    stageChest: {
        guaranteed: {
            reputation: 1
        },
        table: [
            { type: 'reputation', amount: 1, weight: 80 },
            { type: 'item', rarity: 'common', weight: 5 },
            { type: 'item', rarity: 'rare', weight: 5 },
            { type: 'item', rarity: 'stage', weight: 10 }
        ]
    },

    // ===== 夢幻寶箱 =====
    // 先固定給一點夢幻保底，再抽主獎
    dreamChest: {
        guaranteed: {
            crystals: 1,
            reputation: 1
        },
        table: [
            { type: 'bundle', crystals: 2, reputation: 2, weight: 25 },
            { type: 'bundle', crystals: 3, reputation: 3, weight: 35 },
            { type: 'item', rarity: 'common', weight: 25 },
            { type: 'item', rarity: 'rare', weight: 13 },
            { type: 'item', rarity: 'dream', weight: 1.5 },
            { type: 'item', rarity: 'myth', weight: 0.5 }
        ]
    },

    // ===== 特殊事件 =====
    special: {
        kingBug: {
            crownChance: 0.35
        }
    }
};