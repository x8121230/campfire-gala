// src/data/StageData.js

export const STAGE_DATA = {
    bush_01: {
        id: 'bush_01',
        name: '草叢尋寶 Lv.1',
        scene: 'BushExplore',
        type: 'explore',

        staminaCost: 1,
        unlockReputation: 0,
        rewardBase: 20,

        difficulty: 1,
        nextStage: 'bush_02',

        starConditions: {
            one: 1,
            two: 3,
            three: 5
        },

        config: {
            gridSize: 5,
            digCount: 10,
            goldBushCount: 1
        }
    },

    bush_02: {
        id: 'bush_02',
        name: '草叢尋寶 Lv.2',
        scene: 'BushExplore',
        type: 'explore',

        staminaCost: 1,
        unlockReputation: 10,
        rewardBase: 25,

        difficulty: 2,

        starConditions: {
            one: 2,
            two: 4,
            three: 6
        },

        config: {
            gridSize: 5,
            digCount: 10,
            goldBushCount: 1
        }
    },

    campfire_01: {
        id: 'campfire_01',
        name: '營火小學堂 Lv.1',
        scene: 'CampfireGame',
        type: 'quiz',

        staminaCost: 1,
        unlockReputation: 5,
        rewardBase: 20,

        difficulty: 1,

        starConditions: {
            one: 1,
            two: 2,
            three: 3
        },

        config: {}
    },

    firefly_01: {
        id: 'firefly_01',
        name: '螢火蟲記憶 Lv.1',
        scene: 'FireflyGame',
        type: 'memory',

        staminaCost: 1,
        unlockReputation: 8,
        rewardBase: 20,

        difficulty: 1,

        starConditions: {
            one: 1,
            two: 2,
            three: 3
        },

        config: {}
    },

    constellation_01: {
        id: 'constellation_01',
        name: '星空連線 Lv.1',
        scene: 'ConstellationGame',
        type: 'puzzle',

        staminaCost: 1,
        unlockReputation: 12,
        rewardBase: 20,

        difficulty: 1,

        starConditions: {
            one: 1,
            two: 2,
            three: 3
        },

        config: {}
    },

    animals_01: {
        id: 'animals_01',
        name: '森林歷險 Lv.1',
        scene: 'AnimalsGame',
        type: 'quiz',

        staminaCost: 1,
        unlockReputation: 15,
        rewardBase: 20,

        difficulty: 1,

        starConditions: {
            one: 1,
            two: 2,
            three: 3
        },

        config: {}
    }
};

export function getStageData(stageId) {
    return STAGE_DATA[stageId] || null;
}