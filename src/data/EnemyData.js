export const ENEMY_DB = {

    // =========================
    // 🐺 野狼 - 普通
    // =========================
    wolf_common: {
        id: 'wolf_common',
        name: '野狼',
        type: 'wolf',
        rarity: 'common',

        level: 1,

        hp: 1,              // ❤️ 題目數
        attack: 1,          // ❌ 答錯扣光能

        questionTypes: ['add', 'sub'],
        numberRange: 5,

        imageKey: 'enemy_wolf',

        dropGroup: 'common',

        color: '#b7c0c8'   // UI用（灰）
    },

    // =========================
    // 🐺 野狼 - 稀有
    // =========================
    wolf_rare: {
        id: 'wolf_rare',
        name: '野狼首領',
        type: 'wolf',
        rarity: 'rare',

        level: 1,

        hp: 2,
        attack: 2,

        questionTypes: ['add', 'sub', 'compare'],
        numberRange: 10,

        imageKey: 'enemy_wolf',

        dropGroup: 'rare',

        color: '#6bbcff'   // UI用（藍）
    },

    // =========================
    // 🐺 野狼 - 菁英
    // =========================
    wolf_elite: {
        id: 'wolf_elite',
        name: '月影狼王',
        type: 'wolf',
        rarity: 'elite',

        level: 1,

        hp: 3,
        attack: 3,

        questionTypes: ['add', 'sub', 'mul', 'div', 'compare'],
        numberRange: 20,

        imageKey: 'enemy_wolf',

        dropGroup: 'elite',

        color: '#ff7a7a'   // UI用（紅）
    }
};