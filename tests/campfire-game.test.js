import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    CAMPFIRE_GUESTS,
    CAMPFIRE_JUDGEMENT_WINDOWS,
    CAMPFIRE_KIDS_ROUND_PROFILES,
    KIDS_CAMPFIRE_ROUND_COUNT,
    calculateCampfireAccuracy,
    calculateCampfireScore,
    getCampfireJudgement,
    getCampfireHeatState,
    getCampfireTimeLimit,
    getKidsCampfireRoundProfile,
    getOscillatingHeatPassIndex,
    getKidsRoastDuration,
    getOscillatingHeatProgress,
    shouldCreateRainbowMarshmallow
} from '../src/data/CampfireGameData.js';
import { DEFAULT_SAVE_DATA } from '../src/data/GameData.js';
import { STAGE_DATA } from '../src/data/StageData.js';

assert.equal(KIDS_CAMPFIRE_ROUND_COUNT, 6);
assert.ok(CAMPFIRE_GUESTS.length >= KIDS_CAMPFIRE_ROUND_COUNT);
assert.equal(new Set(CAMPFIRE_GUESTS.map((guest) => guest.id)).size, CAMPFIRE_GUESTS.length);

assert.equal(getCampfireHeatState(0), 'raw');
assert.equal(getCampfireHeatState(0.419), 'raw');
assert.equal(getCampfireHeatState(0.42), 'golden');
assert.equal(getCampfireHeatState(0.919), 'golden');
assert.equal(getCampfireHeatState(0.92), 'burnt');
assert.equal(getCampfireHeatState(1), 'burnt');

assert.equal(CAMPFIRE_KIDS_ROUND_PROFILES.length, 6);
assert.equal(CAMPFIRE_JUDGEMENT_WINDOWS.perfectWidth, 0.06);
assert.equal(CAMPFIRE_JUDGEMENT_WINDOWS.rainbowPerfectWidth, 0.015);
CAMPFIRE_KIDS_ROUND_PROFILES.forEach((profile) => {
    assert.ok(profile.zones.goldenEnd > profile.zones.rawEnd);
    assert.ok(1 - profile.zones.goldenEnd <= 0.12);
    assert.equal(profile.endpointPauseMs, 150);
});
assert.equal(getKidsCampfireRoundProfile(99), CAMPFIRE_KIDS_ROUND_PROFILES[5]);
assert.equal(getKidsRoastDuration(0), 3000);
assert.equal(getKidsRoastDuration(5), 2200);
assert.equal(getKidsRoastDuration(99), 2200);
assert.equal(getCampfireTimeLimit(0), 15000);
assert.equal(getCampfireTimeLimit(5), 10000);

assert.equal(getOscillatingHeatProgress(0, 2800), 0);
assert.equal(getOscillatingHeatProgress(1400, 2800), 0.5);
assert.equal(getOscillatingHeatProgress(2800, 2800), 1);
assert.equal(getOscillatingHeatProgress(2875, 2800), 1, '右端需停頓 150ms');
assert.equal(getOscillatingHeatProgress(4350, 2800), 0.5);
assert.equal(getOscillatingHeatProgress(5750, 2800), 0);
assert.equal(getOscillatingHeatProgress(5825, 2800), 0, '左端需停頓 150ms');
assert.equal(getOscillatingHeatPassIndex(2949, 2800), 0);
assert.equal(getOscillatingHeatPassIndex(2950, 2800), 1);

const firstZones = getKidsCampfireRoundProfile(0).zones;
const goldenCenter = (firstZones.rawEnd + firstZones.goldenEnd) / 2;
assert.equal(getCampfireJudgement(0.2, firstZones), 'raw');
assert.equal(getCampfireJudgement(goldenCenter, firstZones), 'rainbowPerfect');
assert.equal(getCampfireJudgement(goldenCenter + 0.0074, firstZones), 'rainbowPerfect');
assert.equal(getCampfireJudgement(goldenCenter + 0.0076, firstZones), 'perfect');
assert.equal(getCampfireJudgement(goldenCenter + 0.02, firstZones), 'perfect');
assert.equal(getCampfireJudgement(goldenCenter + 0.031, firstZones), 'golden');
assert.equal(getCampfireJudgement(0.95, firstZones), 'burnt');

assert.equal(calculateCampfireScore(), 100);
assert.equal(calculateCampfireScore({ earlyCount: 1 }), 97);
assert.equal(calculateCampfireScore({ burntCount: 1 }), 94);
assert.equal(calculateCampfireScore({ hotCount: 1 }), 94);
assert.equal(calculateCampfireScore({ timeoutCount: 1 }), 92);
assert.equal(calculateCampfireScore({ earlyCount: 99, burntCount: 99 }), 60);
assert.equal(calculateCampfireAccuracy({ completedCount: 6 }), 100);
assert.equal(calculateCampfireAccuracy({ completedCount: 6, earlyCount: 1, hotCount: 1, timeoutCount: 1 }), 67);

assert.equal(shouldCreateRainbowMarshmallow(3, false), false);
assert.equal(shouldCreateRainbowMarshmallow(4, false), true);
assert.equal(shouldCreateRainbowMarshmallow(5, true), false);

assert.equal(STAGE_DATA.campfire_01.scene, 'CampfireGame');
assert.equal(STAGE_DATA.campfire_01.freePlay, true);
assert.equal(STAGE_DATA.campfire_01.staminaCost, 0);
assert.equal(DEFAULT_SAVE_DATA.minigame_stats.campfire.mode, 'kids');
assert.deepEqual(DEFAULT_SAVE_DATA.minigame_stats.campfire.challenge, {});
assert.equal(DEFAULT_SAVE_DATA.minigame_stats.campfire.kids.rainbowPerfectCount, 0);
assert.equal(DEFAULT_SAVE_DATA.minigame_stats.campfire.kids.timeoutCount, 0);

const campfireSceneSource = fs.readFileSync(new URL('../src/scenes/CampfireGame.js', import.meta.url), 'utf8');
assert.match(campfireSceneSource, /const HEAT_BAR = Object\.freeze\(\{ left: 500, top: 154, width: 570, height: 52 \}\)/);
assert.match(campfireSceneSource, /marshmallowContainer\.on\('pointerup'/);
assert.match(campfireSceneSource, /setSize\(250, 190\)\.setInteractive/);
assert.match(campfireSceneSource, /getOscillatingHeatProgress/);
assert.match(campfireSceneSource, /heatZoneGraphics\.fillRect/);
assert.match(campfireSceneSource, /heatMarker.*'🔥'/s);
assert.match(campfireSceneSource, /registerHeatPenaltyForCurrentPass/);
assert.doesNotMatch(campfireSceneSource, /this\.rawHeatZone|this\.goldenHeatZone|this\.burntHeatZone/);
assert.match(campfireSceneSource, /handleTimeout/);
assert.match(campfireSceneSource, /rainbowPerfect/);
assert.doesNotMatch(campfireSceneSource, /marshmallowEye|marshmallowSmile|marshmallowCheek/);
assert.doesNotMatch(campfireSceneSource, /this\.roastButton/);

console.log('營火晚會幼童版測試通過：固定色塊、火焰游標、端點停頓、中央 1.5% 必定彩虹。');
