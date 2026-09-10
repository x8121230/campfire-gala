import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bush = await readFile(new URL('../src/scenes/BushMinesweeper.js', import.meta.url), 'utf8');
const transition = await readFile(new URL('../src/scenes/GrassTransitionScene.js', import.meta.url), 'utf8');
const worldMap = await readFile(new URL('../src/scenes/WorldMap.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(bush, /checkSafeBoardComplete\(\)[\s\S]*?if \(!hiddenSafe\) \{\s*this\.finishWin\(\);/);
assert.doesNotMatch(bush, /安全草叢都找到了！把剩下的位置插上旗子吧/);
assert.match(bush, /this\.manualFlagPlacements \+= 1/);
assert.match(bush, /this\.clearedWithoutFlags = this\.manualFlagPlacements === 0 && this\.dangersHit === 0/);
assert.match(bush, /bush_no_flag: '不用旗也知道'/);
assert.match(bush, /if \(stats\.noFlagClearCount >= 1\) unlock\('bush_no_flag'\)/);
assert.match(bush, /autoMarkRemainingDangers\(onComplete\)/);
assert.match(bush, /migrateNoFlagAchievementRuleV32\(\)/);
assert.match(bush, /filter\(\(id\) => id !== 'bush_no_flag'\)/);

assert.match(transition, /const HOLD_BEFORE_OPEN_MS = 500/);
assert.match(transition, /const TRANSITION_DURATION_MS = 2000/);
assert.match(transition, /createGreenFog\(\)/);
assert.match(transition, /this\.schedule\(HOLD_BEFORE_OPEN_MS/);
assert.match(transition, /this\.schedule\(600, \(\) => \{\s*this\.openTargetScene\(\)/);

assert.match(worldMap, /achievementTotal: 6/);
assert.match(worldMap, /return bushAchievementCount >= 6/);
assert.match(main, /import '\.\/patches\/GrassTransitionPatch\.js';/);

globalThis.Phaser = { Scene: class {} };
const { default: BushMinesweeper } = await import('../src/scenes/BushMinesweeper.js');

const createRuleScene = (cells) => {
    const scene = new BushMinesweeper();
    scene.boardReady = true;
    scene.gameOver = false;
    scene.getAllCells = () => cells;
    scene.finishCount = 0;
    scene.finishWin = () => { scene.finishCount += 1; };
    scene.setGuideMessage = (message) => { scene.lastGuideMessage = message; };
    scene.updateModeButtons = () => {};
    scene.wiggle = () => {};
    scene.flagButton = { container: {} };
    scene.MINE_COUNT = cells.filter((cell) => cell.mine).length;
    return scene;
};

const safeComplete = createRuleScene([
    { mine: false, revealed: true, flagged: false },
    { mine: false, revealed: true, flagged: false },
    { mine: true, revealed: false, flagged: false, hit: false }
]);
safeComplete.checkSafeBoardComplete();
assert.equal(safeComplete.finishCount, 1, '全部安全格翻開後必須立即通關');

const safeHidden = createRuleScene([
    { mine: false, revealed: true, flagged: false },
    { mine: false, revealed: false, flagged: false },
    { mine: true, revealed: false, flagged: true, hit: false }
]);
safeHidden.checkSafeBoardComplete();
assert.equal(safeHidden.finishCount, 0, '仍有安全格未翻開時不能通關');
safeHidden.getMarkedCount = () => 1;
safeHidden.checkDangerGoal();
assert.equal(safeHidden.finishCount, 0, '只標出全部危險仍不能跳過安全格');

const finishScene = new BushMinesweeper();
finishScene.gameOver = false;
finishScene.inputLocked = false;
finishScene.manualFlagPlacements = 0;
finishScene.dangersHit = 0;
finishScene.playCorrectSound = () => {};
finishScene.setGuideMessage = () => {};
finishScene.autoMarkRemainingDangers = (done) => done();
finishScene.completeWinRewards = () => { finishScene.rewardSequenceStarted = true; };
finishScene.finishWin();
assert.equal(finishScene.clearedWithoutFlags, true);
assert.equal(finishScene.rewardSequenceStarted, true);

const dangerHitScene = new BushMinesweeper();
dangerHitScene.gameOver = false;
dangerHitScene.inputLocked = false;
dangerHitScene.manualFlagPlacements = 0;
dangerHitScene.dangersHit = 1;
dangerHitScene.playCorrectSound = () => {};
dangerHitScene.setGuideMessage = () => {};
dangerHitScene.autoMarkRemainingDangers = (done) => done();
dangerHitScene.completeWinRewards = () => { dangerHitScene.rewardSequenceStarted = true; };
dangerHitScene.finishWin();
assert.equal(dangerHitScene.clearedWithoutFlags, false, '未插旗但踩到危險時不得取得成就');

const migrationScene = new BushMinesweeper();
const migrationRegistry = new Map([
    ['minigame_stats', { treasure: { noFlagClearCount: 1 } }],
    ['achievements', ['bush_first_clear', 'bush_no_flag']]
]);
migrationScene.registry = {
    get: (key) => migrationRegistry.get(key),
    set: (key, value) => migrationRegistry.set(key, value)
};
const originalSaveFromRegistry = (await import('../src/systems/SaveSystem.js')).default.saveFromRegistry;
(await import('../src/systems/SaveSystem.js')).default.saveFromRegistry = () => true;
migrationScene.migrateNoFlagAchievementRuleV32();
(await import('../src/systems/SaveSystem.js')).default.saveFromRegistry = originalSaveFromRegistry;
assert.equal(migrationRegistry.get('minigame_stats').treasure.noFlagClearCount, 0);
assert.equal(migrationRegistry.get('minigame_stats').treasure.noFlagAchievementRuleVersion, 2);
assert.equal(migrationRegistry.get('achievements').includes('bush_no_flag'), false);

console.log('Bush Minesweeper v3 patch verification passed (static + rule runtime).');
