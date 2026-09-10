// src/data/StageData.js

export const STAGE_DATA = {
    bush_01: {
        id: 'bush_01',
        name: '草叢探險①　尋找金色草叢',
        scene: 'BushExplore',
        type: 'puzzle',

        staminaCost: 0,
        unlockReputation: 0,
        rewardBase: 0,
        freePlay: true,

        difficulty: 1,
        description: '兒童版森林踩地雷：看懂數字，找出所有安全草叢；旗子只是可選用的記憶工具。',
        howToPlay: '第一格一定安全；數字代表周圍 8 格的危險數量。挖開全部安全格就立即通關；整局未插旗且完全沒踩到危險，才可取得「不用旗也知道」成就。每日首次成功可抽金草圖鑑，之後仍可無限刷分。',

        config: {
            gridSize: 6,
            dangerCount: 6,
            mistakes: 2,
            hints: 1
        }
    },

    campfire_01: {
        id: 'campfire_01',
        name: '營火晚會①　棉花糖烤烤樂',
        scene: 'CampfireGame',
        type: 'timing',

        staminaCost: 0,
        unlockReputation: 0,
        rewardBase: 0,
        freePlay: true,
        freePlayKind: 'campfire',

        difficulty: 1,
        description: '火焰指標會左右來回移動；在金黃色區直接點棉花糖，邀請六位動物朋友參加晚會。',
        howToPlay: '每位客人都有倒數時間，直接點棉花糖即可。火焰會從左到右、再從右回到左，抵達兩端會停一下；六回合的速度與區域比例都不同。白色或火太旺時點錯不會出局，而且同一趟最多只扣一次分。黃色正中央 6% 是 Perfect，最正中央隱藏 1.5% 必定觸發彩虹 Perfect；連續四次第一次成功也保證出現彩虹棉花糖。',
        startButtonLabel: '開始烤棉花糖',
        freePlayEntryTitle: '遊玩方式',
        freePlayStatusTitle: '目前紀錄',

        starConditions: {
            one: 60,
            two: 80,
            three: 95
        },

        config: {
            mode: 'kids',
            challengeModeReserved: true
        }
    },

    firefly_01: {
        id: 'firefly_01',
        name: '點點螢火①　螢火小舞曲',
        scene: 'FireflyCatchGame',
        type: 'reaction',

        staminaCost: 0,
        unlockReputation: 0,
        rewardBase: 0,
        freePlay: true,
        freePlayKind: 'fireflyCatch',

        difficulty: 1,

        description: '跟著音樂，看螢火蟲飛進同色花圈；紅、藍、綠三條節拍道一眼就能看懂。',
        howToPlay: '螢火蟲靠近底部同色花圈、花圈顯示「現在！」時，點整條色道或按 A／S／D。幼兒版沒有飛蛾與半拍連點；太早或按錯顏色都能立刻補按，漏掉也能把整首歌玩完。',
        startButtonLabel: '開始演奏',
        freePlayEntryTitle: '遊玩方式',
        freePlayStatusTitle: '目前紀錄',

        starConditions: {
            one: 30,
            two: 60,
            three: 85
        },

        config: {}
    },

    constellation_01: {
        id: 'constellation_01',
        name: '星空連線①　星星小畫家',
        scene: 'ConstellationGame',
        type: 'puzzle',

        staminaCost: 0,
        unlockReputation: 12,
        rewardBase: 0,
        freePlay: true,
        freePlayKind: 'constellation',

        difficulty: 1,

        description: '觀察顏色、圖形、數量、大小與簡單規律，從星光分岔找回六位 Q 版星星朋友。',
        howToPlay: '先點亮第一顆星，再看右側的星光密碼，從分岔中選擇相同答案。錯路會化成星塵但不會失敗；停留太久只會放大密碼，按提示或連錯兩次才會顯示金色正確路線。每場遇見三位朋友，重玩會優先安排尚未收集的朋友。',
        startButtonLabel: '找回星星朋友',
        freePlayEntryTitle: '遊玩方式',
        freePlayStatusTitle: '目前紀錄',

        starConditions: {
            one: 60,
            two: 80,
            three: 95
        },

        config: {}
    },

    animals_01: {
        id: 'animals_01',
        name: '森林歷險①　動物點心時間',
        scene: 'AnimalFoodMatch',
        type: 'matching',

        staminaCost: 0,
        unlockReputation: 0,
        rewardBase: 0,
        freePlay: true,
        freePlayKind: 'animals',

        difficulty: 1,
        description: '幫森林裡的 Q 版動物找到牠最喜歡的點心，一隻一隻慢慢認識新朋友。',
        howToPlay: '每次只會出現一隻動物。直接點選食物，或把食物拖給動物；前兩題只有 2 個選項，後面才增加到 3 個。答錯不會失敗，錯誤食物會變淡，小精靈也能提示。',
        startButtonLabel: '幫動物送點心',
        freePlayEntryTitle: '遊玩方式',
        freePlayStatusTitle: '目前紀錄',

        starConditions: {
            one: 60,
            two: 80,
            three: 95
        },

        config: {
            mode: 'kids',
            challengeModeReserved: true
        }
    }
};

export function getStageData(stageId) {
    return STAGE_DATA[stageId] || null;
}
