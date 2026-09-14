import assert from 'node:assert/strict';

globalThis.Phaser = globalThis.Phaser || {
    Scene: class {},
    Math: {
        Clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
    }
};

const { default: FireflyCatchGame, FIREFLY_COLORS } = await import('../src/scenes/FireflyCatchGame.js');
const {
    FIREFLY_RHYTHM_SONG,
    getFireflySectionAtBeat,
    getNormalFireflyNotes
} = await import('../src/data/FireflyRhythmData.js');
const { default: GMPanel } = await import('../src/scenes/GMPanel.js');
const { DEFAULT_GAME_CONFIG } = await import('../src/data/GameConfig.js');
const { DEFAULT_SAVE_DATA, SAVE_KEY } = await import('../src/data/GameData.js');
const { default: ConfigManager } = await import('../src/systems/ConfigManager.js');
const { default: PlatformStorage } = await import('../src/systems/PlatformStorage.js');
const { default: SaveSystem } = await import('../src/systems/SaveSystem.js');

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

assert.equal(DEFAULT_GAME_CONFIG.version, 13, '星光密碼版必須升級設定版本');
assert.deepEqual(FIREFLY_COLORS.map((item) => item.id), ['red', 'blue', 'green'], '固定色道不得使用黃色');
assert.deepEqual(FIREFLY_COLORS.map((item) => item.key), ['A', 'S', 'D'], '三條色道必須對應 A／S／D');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.game.colorCount, 3, '兒童節奏版固定使用三條色道');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.rhythm.bpm, 80, '原創小舞曲幼兒版預設為 80 BPM');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.rhythm.travelBeats, 5, '螢火蟲必須提前五拍出現');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.rhythm.perfectWindowMs, 300, 'Perfect 判定要放寬為前後 300ms');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.rhythm.goodWindowMs, 650, 'Good 判定要放寬為前後 650ms');
assert.equal(DEFAULT_GAME_CONFIG.fireflyCatch.rhythm.missWindowMs, 900, '過了 900ms 才算漏接');
assert.deepEqual(ConfigManager.validate(DEFAULT_GAME_CONFIG), []);

assert.equal(FIREFLY_RHYTHM_SONG.title, '螢火小舞曲', '譜面必須使用原創歌曲名稱');
const normalNotes = getNormalFireflyNotes();
assert.equal(normalNotes.length, 22, '四歲幼兒版只保留 22 顆可點音符');
assert.equal(FIREFLY_RHYTHM_SONG.notes.filter((note) => note.type === 'moth').length, 0, '幼兒版不得放入飛蛾干擾物');
assert.ok(normalNotes.every((note) => Number.isInteger(note.beat)), '幼兒版不得出現半拍音符');
normalNotes.slice(1).forEach((note, index) => {
    assert.ok(note.beat - normalNotes[index].beat >= 2, '每隻螢火蟲至少要間隔兩拍');
});
assert.equal(getFireflySectionAtBeat(4).id, 'warmup', '開頭為暖身段');
assert.equal(getFireflySectionAtBeat(24).id, 'groove', '中段為雙色合奏');
assert.equal(getFireflySectionAtBeat(40).id, 'finale', '後段為節奏高潮');

const rules = DEFAULT_GAME_CONFIG.fireflyCatch.score;
assert.equal(FireflyCatchGame.calculateRhythmScore({
    perfectHits: 22,
    goodHits: 0,
    highestCombo: 22,
    totalNotes: 22
}, rules), 100, '全 Perfect 且不中斷連擊必須取得 100 分');

assert.equal(FireflyCatchGame.calculateRhythmScore({
    perfectHits: 0,
    goodHits: 22,
    highestCombo: 22,
    totalNotes: 22
}, rules), 84, '全 Good 仍應得到鼓勵性的三星附近分數');

assert.equal(FireflyCatchGame.calculateRhythmScore({
    perfectHits: 11,
    goodHits: 0,
    highestCombo: 4,
    totalNotes: 22
}, rules), 44, '漏拍與 Combo 中斷必須明確反映在分數上');

assert.equal(FireflyCatchGame.getTimingJudgement(290, DEFAULT_GAME_CONFIG.fireflyCatch.rhythm), 'perfect');
assert.equal(FireflyCatchGame.getTimingJudgement(-600, DEFAULT_GAME_CONFIG.fireflyCatch.rhythm), 'good');
assert.equal(FireflyCatchGame.getTimingJudgement(-700, DEFAULT_GAME_CONFIG.fireflyCatch.rhythm), 'early');
assert.equal(FireflyCatchGame.getTimingJudgement(700, DEFAULT_GAME_CONFIG.fireflyCatch.rhythm), 'miss');

const invalidWindows = clone(DEFAULT_GAME_CONFIG);
invalidWindows.fireflyCatch.rhythm.perfectWindowMs = 700;
invalidWindows.fireflyCatch.rhythm.goodWindowMs = 650;
assert.ok(
    ConfigManager.validate(invalidWindows).some((message) => message.includes('Perfect 判定時間')),
    'GM 必須阻止 Perfect 範圍大於 Good 範圍'
);

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

const oldSave = clone(DEFAULT_SAVE_DATA);
delete oldSave.minigame_stats.fireflyCatch;
stored.set(SAVE_KEY, JSON.stringify(oldSave));
const migratedSave = SaveSystem.load();
assert.equal(migratedSave.minigame_stats.fireflyCatch.bestScore, 0, '舊存檔必須自動補上點點螢火獨立紀錄');

const gmPanel = new GMPanel();
gmPanel.registry = createRegistry({
    minigame_stats: {
        treasure: { clearCount: 9, bestScore: 110 },
        fireflyCatch: { playCount: 5, clearCount: 5, bestScore: 98, bestAccuracy: 92, bestCombo: 9 },
        lanternMaze: { clearCount: 2, bestScore: 80 }
    },
    stage_progress: {
        bush_01: { unlocked: true, cleared: true, bestScore: 110 },
        firefly_01: { unlocked: true, cleared: true, bestScore: 98 }
    }
});
gmPanel.renderPage = () => {};
gmPanel.setStatus = () => {};
gmPanel.resetFireflyCatchProgress();

assert.equal(gmPanel.registry.get('minigame_stats').fireflyCatch.bestScore, 0, 'GM 必須清除點點螢火最高分');
assert.equal(gmPanel.registry.get('minigame_stats').treasure.bestScore, 110, 'GM 不可清除草叢探險紀錄');
assert.equal(gmPanel.registry.get('minigame_stats').lanternMaze.bestScore, 80, 'GM 不可清除提燈迷森紀錄');
assert.equal(gmPanel.registry.get('stage_progress').bush_01.bestScore, 110, 'GM 不可清除其他關卡進度');

console.log('點點螢火幼兒節奏測試通過：80 BPM、22 隻螢火蟲、無飛蛾與半拍、寬鬆判定、計分與 GM 資料隔離。');
