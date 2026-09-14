// src/data/BushExploreData.js

export const BUSH_EXPLORE_LEVELS = {
    bush_01: {
        id: 'bush_01',
        name: '草叢尋寶 Lv.1',

        gridSize: 5,
        digLimit: 10,
        startStamina: 5,
        minDigBeforeQuestion: 5,
        lv0FruitChanceFromUndugGrass: 0.20,

        dangers: {
            snake: 1,
            thorn: 2,
            boar: 1,
            stone: 1,
            spiderweb: 1
        },

        goldBushCount: 1,

        bugWeights: {
            green: 40,
            red: 30,
            blue: 20,
            big: 8,
            poison: 2
        },

        specialBugChanceFromUndugGrass: 0.10,

        questionTypes: ['count_single'],

        rewards: {
            clearCrystal: 3,
            clearReputation: 1,
            failCrystal: 1,
            failReputation: 0
        }
    },

    bush_02: {
        id: 'bush_02',
        name: '草叢尋寶 Lv.2',

        gridSize: 5,
        digLimit: 10,
        startStamina: 3,
        minDigBeforeQuestion: 5,
        lv0FruitChanceFromUndugGrass: 0.20,

        dangers: {
            snake: 2,
            thorn: 2,
            boar: 1,
            stone: 2,
            spiderweb: 0
        },

        goldBushCount: 1,

        bugWeights: {
            green: 32,
            red: 28,
            blue: 22,
            big: 12,
            poison: 6
        },

        specialBugChanceFromUndugGrass: 0.20,

        questionTypes: ['count_single', 'count_sum_color'],

        rewards: {
            clearCrystal: 4,
            clearReputation: 1,
            failCrystal: 2,
            failReputation: 0
        }
    },

    bush_03: {
        id: 'bush_03',
        name: '草叢尋寶 Lv.3',

        gridSize: 5,
        digLimit: 10,
        startStamina: 4,
        minDigBeforeQuestion: 5,
        lv0FruitChanceFromUndugGrass: 0.20,

        dangers: {
            snake: 2,
            thorn: 3,
            boar: 1,
            stone: 2,
            spiderweb: 1
        },

        goldBushCount: 1,

        bugWeights: {
            green: 26,
            red: 24,
            blue: 22,
            big: 18,
            poison: 10
        },

        specialBugChanceFromUndugGrass: 0.30,

        questionTypes: ['count_single', 'count_sum_color', 'count_exclude_poison'],

        rewards: {
            clearCrystal: 5,
            clearReputation: 2,
            failCrystal: 2,
            failReputation: 0
        }
    }
};

export const BUSH_TILE_TYPES = {
    NORMAL: 'normal',
    GOLD: 'gold',
    SNAKE: 'snake',
    THORN: 'thorn',
    BOAR: 'boar',
    STONE: 'stone',
    SPIDERWEB: 'spiderweb'
};

export const BUSH_DANGER_EFFECTS = {
    snake: {
        staminaDelta: -2,
        label: '蛇',
        hint: '附近有嘶嘶聲...',
        resultText: '被蛇嚇到！體力 -2'
    },

    thorn: {
        staminaDelta: -1,
        label: '刺草',
        hint: '草看起來會割人...',
        resultText: '被刺草割傷！體力 -1'
    },

    boar: {
        staminaDelta: -3,
        label: '野豬',
        hint: '草叢在晃動...',
        resultText: '野豬衝出！體力 -3'
    },

    stone: {
        staminaDelta: 0,
        label: '石頭',
        hint: '地面感覺很硬...',
        resultText: '挖到石頭了。'
    },

    spiderweb: {
        staminaDelta: 0,
        label: '蜘蛛網',
        hint: '你看到細細的蜘蛛絲...',
        resultText: '被網纏住！挖掘次數減少。',
        digLossMin: 1,
        digLossMax: 2,
    }
};

export const BUSH_BUG_TYPES = {
    green: {
        id: 'green',
        name: '綠果',
        countValue: 1,
        isSpecial: false
    },

    red: {
        id: 'red',
        name: '紅果',
        countValue: 1,
        isSpecial: false
    },

    blue: {
        id: 'blue',
        name: '藍果',
        countValue: 1,
        isSpecial: false
    },

    big: {
        id: 'big',
        name: '大果',
        countValue: 2,
        isSpecial: true
    },

    poison: {
        id: 'poison',
        name: '毒果',
        countValue: 1,
        isSpecial: true,
        wrongAnswerPenalty: -1
    }
};

export const BUSH_QUESTION_TYPES = {
    COUNT_SINGLE: 'count_single',
    COUNT_SUM_COLOR: 'count_sum_color',
    COUNT_EXCLUDE_POISON: 'count_exclude_poison'
};