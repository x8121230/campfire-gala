import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_GAME_CONFIG } from '../src/data/GameConfig.js';
import { DEFAULT_SAVE_DATA } from '../src/data/GameData.js';
import ConfigManager from '../src/systems/ConfigManager.js';
import StageManager from '../src/systems/StageManager.js';
import {
    CONSTELLATION_PATTERNS,
    STAR_CODE_SIZES,
    buildConstellationChallenge,
    calculateConstellationScore,
    getConstellationRounds,
    isCorrectConstellationStep,
    shouldShowConstellationNumber
} from '../src/data/ConstellationData.js';

globalThis.Phaser = globalThis.Phaser || { Scene: class {} };
const { default: ConstellationGame } = await import('../src/scenes/ConstellationGame.js');
const { default: GMPanel } = await import('../src/scenes/GMPanel.js');

assert.equal(DEFAULT_GAME_CONFIG.version, 13);
assert.equal(new ConstellationGame() instanceof Phaser.Scene, true);
assert.equal(DEFAULT_GAME_CONFIG.worldMap.unlockAllStages, true);
assert.equal(CONSTELLATION_PATTERNS.length, 6);
assert.deepEqual(CONSTELLATION_PATTERNS.map((pattern) => pattern.pointVariants.map((points) => points.length)), [[3, 3, 3], [4, 4, 4], [5, 5, 5], [4, 4, 4], [5, 5, 5], [6, 6, 6]]);
assert.deepEqual(CONSTELLATION_PATTERNS.map((pattern) => pattern.decoyVariants.map((points) => points.length)), [[1, 1, 1], [2, 2, 2], [2, 2, 2], [2, 2, 2], [2, 2, 2], [2, 2, 2]]);
assert.deepEqual(getConstellationRounds(3, () => 0).map((round) => round.variantIndex), [0, 0, 0]);
assert.deepEqual(getConstellationRounds(3, () => 0.999).map((round) => round.variantIndex), [2, 2, 2]);
assert.deepEqual(getConstellationRounds(3, () => 0).map((round) => round.decoys.length), [1, 2, 2]);
assert.deepEqual(CONSTELLATION_PATTERNS.map((pattern) => pattern.puzzleKind), ['color', 'shape', 'color_shape', 'count', 'size', 'pattern']);
assert.deepEqual(STAR_CODE_SIZES.map((size) => size.scale), [0.45, 0.9, 1.55]);
assert.ok(STAR_CODE_SIZES[2].scale / STAR_CODE_SIZES[0].scale > 3);
assert.deepEqual(getConstellationRounds(3, () => 0).map((round) => round.id), ['little_fish', 'little_rabbit', 'little_owl']);
assert.deepEqual(getConstellationRounds(2, () => 0, {
    little_fish: { foundCount: 1 }
}).map((round) => round.id), ['little_rabbit', 'little_owl']);
const replayRounds = getConstellationRounds(3, () => 0, {
    little_fish: { foundCount: 1 },
    little_rabbit: { foundCount: 1 },
    little_owl: { foundCount: 1 }
});
assert.deepEqual(new Set(replayRounds.map((round) => round.id)), new Set(['little_bear', 'little_deer', 'little_squirrel']));
assert.ok(CONSTELLATION_PATTERNS.every((pattern) => pattern.friendTexture.startsWith('constellation_friend_')));
assert.ok(CONSTELLATION_PATTERNS.every((pattern) => pattern.friendMessage.includes('！')));
assert.ok(CONSTELLATION_PATTERNS.every((pattern) => existsSync(`assets/${pattern.friendTexture}.png`)));
assert.equal(DEFAULT_GAME_CONFIG.constellation.presentation.comboBurstEvery, 3);
assert.equal(DEFAULT_GAME_CONFIG.constellation.presentation.rainbowChancePercent, 20);
assert.equal(DEFAULT_GAME_CONFIG.constellation.presentation.interactionItemCount, 3);
assert.equal(DEFAULT_GAME_CONFIG.constellation.game.branchHintMistakes, 2);
assert.equal('branchFlowIntervalMs' in DEFAULT_GAME_CONFIG.constellation.game, false);
assert.equal(DEFAULT_SAVE_DATA.minigame_stats.constellation.bestCombo, 0);
assert.equal(shouldShowConstellationNumber(CONSTELLATION_PATTERNS[0], 0), true);
assert.equal(shouldShowConstellationNumber(CONSTELLATION_PATTERNS[0], 1), false);
assert.equal(shouldShowConstellationNumber(CONSTELLATION_PATTERNS[0], 2), false);
assert.equal(shouldShowConstellationNumber(CONSTELLATION_PATTERNS[1], 0), false);
const externalConfig = JSON.parse(readFileSync('assets/config/game_balance.json', 'utf8'));
assert.equal(externalConfig.version, DEFAULT_GAME_CONFIG.version);
assert.deepEqual(externalConfig.constellation.presentation, DEFAULT_GAME_CONFIG.constellation.presentation);
assert.equal(getConstellationRounds(2).length, 2);
assert.equal(getConstellationRounds(99).length, 3);
CONSTELLATION_PATTERNS.forEach((pattern, index) => {
    const challenge = buildConstellationChallenge(pattern, index + 1, () => 0);
    assert.equal(challenge.kind, pattern.puzzleKind);
    assert.equal(challenge.candidateTokens.length, pattern.branchDecoyCount + 1);
    assert.equal(new Set(challenge.candidateTokens.map((token) => JSON.stringify(token))).size, challenge.candidateTokens.length);
});

const scoreRules = DEFAULT_GAME_CONFIG.constellation.score;
assert.equal(calculateConstellationScore({}, scoreRules), 100);
assert.equal(calculateConstellationScore({ wrongTaps: 2, hintsUsed: 1 }, scoreRules), 80);
assert.equal(calculateConstellationScore({ wrongTaps: 100, hintsUsed: 100 }, scoreRules), 60);
assert.equal(isCorrectConstellationStep(2, 2), true);
assert.equal(isCorrectConstellationStep(1, 2), false);
assert.deepEqual(ConfigManager.validate(DEFAULT_GAME_CONFIG), []);

const registryValues = new Map([
    ['reputation', 0],
    ['hearts', 0],
    ['stage_progress', {}],
    ['equipped_fullset', 'none']
]);
const registry = {
    get: (key) => registryValues.get(key),
    set: (key, value) => registryValues.set(key, value)
};
ConfigManager.setBaseConfig(DEFAULT_GAME_CONFIG);
assert.equal(StageManager.hasUnlockAllStages(), true);
assert.equal(StageManager.isUnlocked(registry, 'constellation_01'), true);
assert.equal(StageManager.isUnlocked(registry, 'animals_01'), true);

const badConfig = structuredClone(DEFAULT_GAME_CONFIG);
badConfig.constellation.game.snapRadius = 20;
assert.ok(ConfigManager.validate(badConfig).some((error) => error.includes('星星吸附範圍')));

const badEventConfig = structuredClone(DEFAULT_GAME_CONFIG);
badEventConfig.constellation.presentation.rainbowChancePercent = 120;
assert.ok(ConfigManager.validate(badEventConfig).some((error) => error.includes('彩虹星')));

const badBranchHintConfig = structuredClone(DEFAULT_GAME_CONFIG);
badBranchHintConfig.constellation.game.branchHintMistakes = 5;
assert.ok(ConfigManager.validate(badBranchHintConfig).some((error) => error.includes('分岔自動提示')));

const constellationSceneSource = readFileSync('src/scenes/ConstellationGame.js', 'utf8');
assert.match(constellationSceneSource, /createDecoyStars/);
assert.match(constellationSceneSource, /refreshCandidateBranches/);
assert.match(constellationSceneSource, /drawDashedBranch/);
assert.match(constellationSceneSource, /showWrongBranch/);
assert.match(constellationSceneSource, /showCorrectBranchHint/);
assert.match(constellationSceneSource, /buildConstellationChallenge/);
assert.match(constellationSceneSource, /renderChallengePrompt/);
assert.match(constellationSceneSource, /星光任務/);
assert.match(constellationSceneSource, /這位朋友/);
assert.match(constellationSceneSource, /startCandidateBreathing/);
assert.match(constellationSceneSource, /showIdleClue/);
assert.doesNotMatch(constellationSceneSource, /startFlowingBranchGuide/);
assert.match(constellationSceneSource, /playHintSpark/);
assert.match(constellationSceneSource, /stopHintSpark/);

const friendRegistryValues = new Map([
    ['minigame_stats', { constellation: { friendEncyclopedia: {}, rainbowStarCount: 0 } }],
    ['stage_progress', {}]
]);
const friendScene = new ConstellationGame();
friendScene.registry = {
    get: (key) => friendRegistryValues.get(key),
    set: (key, value) => friendRegistryValues.set(key, value)
};
friendScene.currentRound = CONSTELLATION_PATTERNS[0];
friendScene.roundRainbowCollected = true;
friendScene.recordFriendDiscovery();
friendScene.recordFriendInteraction();
const friendStats = friendRegistryValues.get('minigame_stats').constellation;
assert.equal(friendStats.friendEncyclopedia.little_fish.foundCount, 1);
assert.equal(friendStats.friendEncyclopedia.little_fish.interactionComplete, true);
assert.equal(friendStats.friendEncyclopedia.little_fish.interactionCount, 1);
assert.equal(friendStats.rainbowStarCount, 1);

const gmRegistryValues = new Map([
    ['minigame_stats', {
        constellation: friendStats,
        fireflyCatch: { bestScore: 77 }
    }],
    ['stage_progress', {
        constellation_01: { cleared: true, bestScore: 100 },
        firefly_01: { cleared: true, bestScore: 77 }
    }]
]);
const gmPanel = new GMPanel();
gmPanel.registry = {
    get: (key) => gmRegistryValues.get(key),
    set: (key, value) => gmRegistryValues.set(key, value)
};
gmPanel.renderPage = () => {};
gmPanel.setStatus = () => {};
gmPanel.resetConstellationProgress();
assert.deepEqual(gmRegistryValues.get('minigame_stats').constellation.friendEncyclopedia, {});
assert.equal(gmRegistryValues.get('minigame_stats').constellation.rainbowStarCount, 0);
assert.equal(gmRegistryValues.get('minigame_stats').constellation.bestCombo, 0);
assert.equal(gmRegistryValues.get('minigame_stats').fireflyCatch.bestScore, 77);

console.log('constellation tests passed');
