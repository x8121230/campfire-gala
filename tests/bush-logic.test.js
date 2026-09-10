import assert from 'node:assert/strict';

globalThis.Phaser = {
    Scene: class {},
    Math: {
        Clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
    },
    Utils: {
        Array: {
            GetRandom(values) {
                return values[Math.floor(Math.random() * values.length)];
            },
            Shuffle(values) {
                for (let index = values.length - 1; index > 0; index -= 1) {
                    const picked = Math.floor(Math.random() * (index + 1));
                    [values[index], values[picked]] = [values[picked], values[index]];
                }
                return values;
            }
        }
    }
};

const { default: BushMinesweeper } = await import('../src/scenes/BushMinesweeper.js');
const { default: GMPanel } = await import('../src/scenes/GMPanel.js');
const { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } = await import('../src/data/GameConfig.js');
const { default: ConfigManager } = await import('../src/systems/ConfigManager.js');
const { default: PlatformStorage } = await import('../src/systems/PlatformStorage.js');
const { default: SaveSystem } = await import('../src/systems/SaveSystem.js');
const { SAVE_KEY } = await import('../src/data/GameData.js');

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createRegistry(seed = {}) {
    const values = new Map(Object.entries(seed));
    return {
        get(key) {
            return values.get(key);
        },
        set(key, value) {
            values.set(key, value);
        }
    };
}

function createLogicScene(rows = 6, cols = 6, dangerCount = 6) {
    const scene = new BushMinesweeper();
    scene.ROWS = rows;
    scene.COLS = cols;
    scene.MINE_COUNT = dangerCount;
    scene.SOLVER_ATTEMPTS = 600;
    scene.bushConfig = clone(DEFAULT_GAME_CONFIG.bushMinesweeper);
    scene.cells = Array.from({ length: rows }, (_, row) => (
        Array.from({ length: cols }, (_, col) => ({
            row,
            col,
            mine: false,
            number: 0,
            revealed: false,
            flagged: false,
            hit: false
        }))
    ));
    return scene;
}

assert.deepEqual(ConfigManager.validate(DEFAULT_GAME_CONFIG), []);
assert.equal(DEFAULT_GAME_CONFIG.bushMinesweeper.board.mistakeLimit, 2, '草叢預設必須是第二次踩錯即失敗');
const invalidRates = clone(DEFAULT_GAME_CONFIG);
invalidRates.bushMinesweeper.goldGrass.rates.goldenGrass = 55;
assert.ok(ConfigManager.validate(invalidRates).some((message) => message.includes('100％')));

const boardCases = [
    { rows: 5, cols: 5, dangers: 3 },
    { rows: 5, cols: 7, dangers: 6 },
    { rows: 6, cols: 6, dangers: 6 },
    { rows: 7, cols: 5, dangers: 7 },
    { rows: 7, cols: 7, dangers: 10 }
];
for (const boardCase of boardCases) {
    for (let run = 0; run < 40; run += 1) {
        const scene = createLogicScene(boardCase.rows, boardCase.cols, boardCase.dangers);
        const first = scene.cells[Math.floor(Math.random() * boardCase.rows)][Math.floor(Math.random() * boardCase.cols)];
        scene.generateSolvableBoard(first);
        assert.equal(first.mine, false, '第一格必須安全');
        assert.ok(scene.getNeighbors(first.row, first.col).every((cell) => !cell.mine), '第一格周圍必須安全');
        assert.equal(scene.getAllCells().filter((cell) => cell.mine).length, boardCase.dangers, '危險數量必須固定');
        assert.equal(scene.isLogicallySolvable(first), true, '盤面必須能以邏輯解出');
    }
}

const scoreScene = createLogicScene();
scoreScene.dangersHit = 0;
scoreScene.hintsUsed = 0;
assert.equal(scoreScene.calculateScore(), 100);
scoreScene.dangersHit = 1;
assert.equal(scoreScene.calculateScore(), 90);
scoreScene.hintsUsed = 1;
assert.equal(scoreScene.calculateScore(), 80);

const pityScene = createLogicScene();
pityScene.registry = createRegistry({
    gold_grass_encyclopedia: ['goldenGrass'],
    minigame_stats: { treasure: { duplicateStreak: 6 } }
});
const pityDiscovery = pityScene.pickGoldGrassDiscovery();
assert.equal(pityDiscovery.usedPity, true);
assert.equal(pityDiscovery.isNew, true);
assert.notEqual(pityDiscovery.id, 'goldenGrass');

const dailyScene = createLogicScene();
dailyScene.registry = createRegistry({ minigame_stats: { treasure: { dailyGrassDate: '' } } });
assert.equal(dailyScene.isDailyGrassAvailable(), true, '當天尚未成功時必須能取得金草圖鑑');
dailyScene.registry.set('minigame_stats', { treasure: { dailyGrassDate: dailyScene.getTodayKey() } });
assert.equal(dailyScene.isDailyGrassAvailable(), false, '同一天後續回合不可重複取得一般金草圖鑑');

const goldenBugScene = createLogicScene();
const pityBug = goldenBugScene.evaluateGoldenBugEncounter({
    baseScore: 100,
    dailyGrassAvailable: false,
    unlocked: true,
    missStreak: DEFAULT_GAME_CONFIG.bushMinesweeper.hiddenGoldenBug.pityMisses
});
assert.equal(pityBug.triggered, true, '黃金蟲連續未出現達保底後必須出現');
assert.equal(pityBug.bonusScore, 10, '黃金蟲必須提供隱藏 10 分');
const lockedBug = goldenBugScene.evaluateGoldenBugEncounter({
    baseScore: 100,
    dailyGrassAvailable: false,
    unlocked: false,
    missStreak: 99
});
assert.equal(lockedBug.triggered, false, '未完成全部成就不可遇見黃金蟲');
const dailyRewardBug = goldenBugScene.evaluateGoldenBugEncounter({
    baseScore: 100,
    dailyGrassAvailable: true,
    unlocked: true,
    missStreak: 99
});
assert.equal(dailyRewardBug.triggered, false, '每日圖鑑回合不可同時觸發黃金蟲 110 分');

const rateScene = createLogicScene();
const counts = { goldenGrass: 0, rainbowGrass: 0, mysteryGrass: 0 };
for (let run = 0; run < 30000; run += 1) counts[rateScene.rollWeightedGrass(Object.keys(counts))] += 1;
const percentages = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value / 300]));
assert.ok(percentages.goldenGrass > 57 && percentages.goldenGrass < 63);
assert.ok(percentages.rainbowGrass > 27 && percentages.rainbowGrass < 33);
assert.ok(percentages.mysteryGrass > 8 && percentages.mysteryGrass < 12);

const stored = new Map();
PlatformStorage.useAdapter({
    getItem(key) {
        return stored.get(key) ?? null;
    },
    setItem(key, value) {
        stored.set(key, String(value));
    },
    removeItem(key) {
        stored.delete(key);
    }
});
ConfigManager.setBaseConfig(DEFAULT_GAME_CONFIG);
const localConfig = clone(DEFAULT_GAME_CONFIG);
localConfig.bushMinesweeper.visuals.dangerSize = 94;
assert.equal(ConfigManager.saveConfig(localConfig).ok, true);
SaveSystem.saveFromRegistry(createRegistry({ hearts: 4 }));
assert.ok(stored.has(GAME_CONFIG_STORAGE_KEY), 'GM 設定必須有獨立儲存鍵');
assert.ok(stored.has(SAVE_KEY), '玩家進度必須有獨立儲存鍵');
ConfigManager.resetConfig();
assert.equal(stored.has(GAME_CONFIG_STORAGE_KEY), false, '恢復平衡預設只能清除 GM 設定');
assert.equal(stored.has(SAVE_KEY), true, '恢復平衡預設不可刪除玩家進度');

const obsoleteConfig = clone(DEFAULT_GAME_CONFIG);
obsoleteConfig.version = 1;
obsoleteConfig.bushMinesweeper.board.mistakeLimit = 3;
stored.set(GAME_CONFIG_STORAGE_KEY, JSON.stringify(obsoleteConfig));
ConfigManager.setBaseConfig(DEFAULT_GAME_CONFIG);
assert.equal(ConfigManager.getConfig().bushMinesweeper.board.mistakeLimit, 2, '舊版 GM 覆寫必須自動改用新版正式值');
assert.equal(stored.has(GAME_CONFIG_STORAGE_KEY), false, '過時的 GM 覆寫必須自動移除');
assert.equal(stored.has(SAVE_KEY), true, 'GM 版本升級不可影響玩家進度');

const rewardScene = createLogicScene();
rewardScene.stageId = 'bush_01';
rewardScene.hintsUsed = 0;
rewardScene.registry = createRegistry({
    achievements: [
        'bush_first_clear',
        'bush_three_clears',
        'bush_no_hint',
        'bush_perfect',
        'gold_grass_collector'
    ],
    owned_items: [],
    placed_decorations: [],
    minigame_stats: { treasure: {} },
    stage_progress: {}
});
const rewardProgress = rewardScene.saveWinProgress({
    discovery: null,
    baseScore: 100,
    totalScore: 100,
    dailyGrassAvailable: false,
    goldenBug: { qualifying: false, triggered: false, bonusScore: 0 }
});
assert.equal(rewardProgress.fullRewardUnlocked, true, '舊存檔已有五成就時必須補發全成就獎勵');
assert.equal(rewardScene.getBushStats().goldenBugUnlocked, true, '五成就必須永久解鎖黃金蟲奇遇');
assert.ok(
    rewardScene.registry.get('owned_items').includes('item_decoration_golden_bug_house_bush'),
    '五成就必須取得黃金蟲小屋'
);
assert.ok(
    rewardScene.registry.get('placed_decorations').some((item) => item.key === 'q_golden_bug_house'),
    '黃金蟲小屋必須自動放到森林營地'
);

const gmPanel = new GMPanel();
gmPanel.registry = createRegistry({
    gold_grass_encyclopedia: ['goldenGrass', 'rainbowGrass'],
    achievements: ['bush_first_clear', 'campfire_first_clear'],
    owned_items: ['item_hat_daily_01', 'item_decoration_golden_bug_house_bush'],
    new_items: ['item_decoration_golden_bug_house_bush'],
    placed_decorations: [
        { key: 'q_golden_bug_house', rewardId: 'item_decoration_golden_bug_house_bush' },
        { key: 'other_decoration', rewardId: 'other_reward' }
    ],
    minigame_stats: {
        treasure: { clearCount: 8, dailyGrassDate: 'today', dailyBestScore: 110 },
        firefly: { clearCount: 4, bestScore: 88 }
    },
    stage_progress: {
        bush_01: { unlocked: true, cleared: true, bestScore: 110 },
        firefly_01: { unlocked: true, cleared: true, bestScore: 88 }
    }
});
gmPanel.renderPage = () => {};
gmPanel.setStatus = () => {};
gmPanel.resetBushProgress();
assert.deepEqual(gmPanel.registry.get('gold_grass_encyclopedia'), [], 'GM 必須能清除草叢圖鑑');
assert.deepEqual(gmPanel.registry.get('achievements'), ['campfire_first_clear'], 'GM 不可清除其他遊戲成就');
assert.deepEqual(gmPanel.registry.get('owned_items'), ['item_hat_daily_01'], 'GM 只可移除草叢全成就裝飾');
assert.equal(gmPanel.registry.get('minigame_stats').firefly.bestScore, 88, 'GM 不可清除點點螢火紀錄');
assert.equal(gmPanel.registry.get('stage_progress').firefly_01.bestScore, 88, 'GM 不可清除其他關卡進度');
assert.equal(gmPanel.registry.get('minigame_stats').treasure.clearCount, 0, 'GM 必須重置草叢統計');

console.log('BushMinesweeper 邏輯測試通過：兩次容錯、200 張盤面、每日金草、黃金蟲 110 分、GM 分頁資料隔離。');
