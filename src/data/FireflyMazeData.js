export const FIREFLY_MAZES = {
    stage_1: {
        id: 'stage_1',
        name: '蘑菇小徑',
        hint: '沿著柔和的小路前進，先熟悉迷宮探索。',
        tileSize: 64,
        theme: 'mushroom',
        map: [
            [0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,0,1,1,0],
            [0,0,0,0,0,1,0,1,0,0],
            [0,1,1,1,0,1,1,1,0,0],
            [0,1,0,1,0,0,0,1,1,0],
            [0,1,0,1,1,1,0,0,1,0],
            [0,1,0,0,0,1,1,1,1,0],
            [0,1,1,1,0,0,0,0,1,0],
            [0,0,0,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0]
        ],

        randomZones: {
        // 🟡 4 個黃點（分佈在不同區域）
        yellowPoints: [
            { id: 'A', row: 1, col: 1 },
            { id: 'B', row: 1, col: 8 },
            { id: 'C', row: 8, col: 5 },
            { id: 'D', row: 6, col: 8 }
        ],

        // 🟡 合法起終點配對
        yellowPairs: [
            { start: 'A', goal: 'B' },
            { start: 'A', goal: 'C' },
            { start: 'A', goal: 'D' },
            { start: 'C', goal: 'B' },
            { start: 'C', goal: 'D' }
        ],

        // 🟢 主線寶箱
        chest_main: [
            { row: 3, col: 2, type: 'yellow' }
        ],

        // 🟢 支線寶箱
        chest_side: [
            { row: 5, col: 4, type: 'blue' },
            { row: 8, col: 8, type: 'green' }
        ],

        // 🔴 主線壓力
        danger_main: [
            {
                row: 3,
                col: 3,
                type: 'wolf',
                damage: 8,
                moveMode: 'static',
                aggroRange: 2,
                chaseTurns: 3
            },
            {
                row: 6,
                col: 6,
                type: 'wolf',
                damage: 8,
                moveMode: 'wander',
                patrolRadius: 2,
                aggroRange: 2,
                chaseTurns: 3
            }
        ],

        // 🔴 支線風險
        danger_side: [
            {
                row: 5,
                col: 5,
                type: 'wolf',
                damage: 8,
                moveMode: 'static',
                aggroRange: 2,
                chaseTurns: 2
            },
            {
                row: 8,
                col: 5,
                type: 'wolf',
                damage: 8,
                moveMode: 'wander',
                patrolRadius: 1,
                aggroRange: 2,
                chaseTurns: 2
            }
        ]
    },

        collectibles: [
            { row: 3, col: 2, type: 'yellow' },
            { row: 5, col: 4, type: 'blue' }
        ],

        hazards: [
            { row: 7, col: 2, type: 'wolf' }
        ],

        decorations: [
            { row: 1, col: 4, type: 'mushroom' },
            { row: 4, col: 8, type: 'flower' },
            { row: 8, col: 5, type: 'bush' }
        ],
    },

    stage_2: {
        id: 'stage_2',
        name: '花園岔路',
        hint: '分岔變多了，留意花叢與灌木附近的路線。',
        tileSize: 64,
        theme: 'garden',
        map: [
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,2,1,1,0,1,1,1,1,3,0],
            [0,0,0,1,0,1,0,0,1,0,0],
            [0,1,1,1,1,1,0,1,1,1,0],
            [0,1,0,0,0,0,0,1,0,1,0],
            [0,1,1,1,1,1,1,1,0,1,0],
            [0,0,0,0,1,0,0,1,0,1,0],
            [0,1,1,1,1,0,1,1,1,1,0],
            [0,1,0,0,0,0,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0]
        ],
        collectibles: [
            { row: 3, col: 3, type: 'green' },
            { row: 5, col: 6, type: 'yellow' },
            { row: 7, col: 8, type: 'red' }
        ],
        hazards: [
            { row: 9, col: 3, type: 'wolf' }
        ],
        decorations: [
            { row: 1, col: 7, type: 'flower' },
            { row: 5, col: 2, type: 'bush' },
            { row: 7, col: 1, type: 'flower' },
            { row: 9, col: 7, type: 'bush' }
        ]
    },

    stage_3: {
        id: 'stage_3',
        name: '星光繞行',
        hint: '路線更長了，先收集能量，再繞向終點。',
        tileSize: 64,
        theme: 'night_garden',
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,2,1,1,1,0,1,1,1,1,3,0],
            [0,0,0,0,1,0,1,0,0,1,0,0],
            [0,1,1,1,1,0,1,1,0,1,1,0],
            [0,1,0,0,0,0,0,1,0,0,1,0],
            [0,1,1,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,1,1,0,1,1,1,1,0,1,0],
            [0,1,0,1,0,0,0,0,1,0,1,0],
            [0,1,0,1,1,1,1,0,1,1,1,0],
            [0,1,1,1,0,0,1,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        collectibles: [
            { row: 3, col: 2, type: 'blue' },
            { row: 5, col: 4, type: 'yellow' },
            { row: 7, col: 7, type: 'green' },
            { row: 9, col: 9, type: 'red' }
        ],
        hazards: [
            { row: 5, col: 8, type: 'wolf' },
            { row: 10, col: 2, type: 'wolf' }
        ],
        decorations: [
            { row: 1, col: 8, type: 'flower' },
            { row: 3, col: 10, type: 'mushroom' },
            { row: 7, col: 3, type: 'bush' },
            { row: 9, col: 5, type: 'flower' }
        ]
    }
};