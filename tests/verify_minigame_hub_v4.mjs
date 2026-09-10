import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    MINI_GAME_CATALOG,
    MINI_GAME_CATEGORIES,
    getMiniGamesByCategory
} from '../src/data/MiniGameCatalog.js';
import MiniGameTestSession from '../src/systems/MiniGameTestSession.js';

assert.equal(MINI_GAME_CATALOG.length, 8, '總表必須收錄 8 款現有遊戲');
assert.equal(MINI_GAME_CATEGORIES.length, 5, '必須有全部加四種遊戲分類');
assert.equal(new Set(MINI_GAME_CATALOG.map((game) => game.id)).size, 8, '遊戲 ID 不可重複');
assert.equal(new Set(MINI_GAME_CATALOG.map((game) => game.scene)).size, 8, '每張卡片必須對應唯一場景');
['observation', 'matching', 'rhythm', 'board'].forEach((categoryId) => {
    assert.equal(getMiniGamesByCategory(categoryId).length, 2, `${categoryId} 應收錄 2 款遊戲`);
});

class FakeRegistry {
    constructor(data = {}) {
        this.data = new Map(Object.entries(data));
    }

    get(key) {
        return this.data.get(key);
    }

    set(key, value) {
        this.data.set(key, value);
        return this;
    }

    remove(key) {
        this.data.delete(key);
        return this;
    }

    getAll() {
        return Object.fromEntries(this.data.entries());
    }
}

const registry = new FakeRegistry({
    hearts: 7,
    user_crystals: 50,
    stage_progress: { bush_01: { bestScore: 88, cleared: true } }
});
MiniGameTestSession.begin(registry, 'bush_minesweeper');
assert.equal(registry.get('mini_test_mode_active'), true);
registry.set('hearts', 0);
registry.set('temporary_reward', 'should disappear');
registry.get('stage_progress').bush_01.bestScore = 100;
const session = MiniGameTestSession.finish(registry);
assert.equal(session.gameId, 'bush_minesweeper');
assert.equal(registry.get('hearts'), 7, '測試後必須還原愛心');
assert.equal(registry.get('temporary_reward'), undefined, '測試產生的資料必須移除');
assert.equal(registry.get('stage_progress').bush_01.bestScore, 88, '測試後必須還原正式關卡紀錄');
assert.equal(registry.get('mini_test_mode_active'), undefined, '返回總表後必須離開測試模式');

const hub = await readFile(new URL('../src/scenes/MiniGameHub.js', import.meta.url), 'utf8');
const saveSystem = await readFile(new URL('../src/systems/SaveSystem.js', import.meta.url), 'utf8');
const start = await readFile(new URL('../src/scenes/Start.js', import.meta.url), 'utf8');
const bush = await readFile(new URL('../src/scenes/BushMinesweeper.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(hub, /const CARDS_PER_PAGE = 6/);
assert.match(hub, /testMode: true/);
assert.match(hub, /returnScene: 'MiniGameHub'/);
assert.match(hub, /MiniGameTestSession\.begin/);
assert.match(hub, /MiniGameTestSession\.finish/);
assert.doesNotMatch(hub, /遊戲F/);
assert.match(saveSystem, /mini_test_mode_active/);
assert.match(saveSystem, /略過正式存檔/);
assert.match(start, /小遊戲測試/);
assert.match(bush, /this\.returnScene = data\.returnScene \|\| 'WorldMap'/);
assert.match(bush, /this\.scene\.start\(this\.returnScene/);

MINI_GAME_CATALOG.forEach((game) => {
    assert.match(main, new RegExp(game.scene), `${game.scene} 必須在 main.js 註冊`);
});

console.log('Mini-game testing hub v4 verification passed (catalog + isolation + routing).');
