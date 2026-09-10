export const KIDS_CAMPFIRE_ROUND_COUNT = 6;

export const CAMPFIRE_GUESTS = [
    { id: 'rabbit', name: '小兔子', texture: 'mm_rabbit', color: 0xf4a8bf },
    { id: 'bear', name: '小熊', texture: 'mm_bear', color: 0xc98c5a },
    { id: 'cat', name: '小貓', texture: 'mm_cat', color: 0xf2a36c },
    { id: 'owl', name: '貓頭鷹', texture: 'mm_owl', color: 0xb6815f },
    { id: 'squirrel', name: '小松鼠', texture: 'mm_squirrel', color: 0xd6874f },
    { id: 'monkey', name: '小猴子', texture: 'mm_monkey', color: 0xd29a64 },
    { id: 'fox', name: '小狐狸', texture: 'mm_fox', color: 0xef8853 },
    { id: 'panda', name: '熊貓', texture: 'mm_panda', color: 0x91b978 },
    { id: 'hedgehog', name: '小刺蝟', texture: 'mm_hedgehog', color: 0xb98b68 }
];

export const CAMPFIRE_KIDS_ROUND_PROFILES = Object.freeze([
    Object.freeze({ oneWayDuration: 3000, endpointPauseMs: 150, timeLimit: 15000, zones: Object.freeze({ rawEnd: 0.42, goldenEnd: 0.92 }) }),
    Object.freeze({ oneWayDuration: 2600, endpointPauseMs: 150, timeLimit: 13000, zones: Object.freeze({ rawEnd: 0.40, goldenEnd: 0.90 }) }),
    Object.freeze({ oneWayDuration: 2500, endpointPauseMs: 150, timeLimit: 12000, zones: Object.freeze({ rawEnd: 0.45, goldenEnd: 0.90 }) }),
    Object.freeze({ oneWayDuration: 2400, endpointPauseMs: 150, timeLimit: 12000, zones: Object.freeze({ rawEnd: 0.38, goldenEnd: 0.88 }) }),
    Object.freeze({ oneWayDuration: 2300, endpointPauseMs: 150, timeLimit: 11000, zones: Object.freeze({ rawEnd: 0.43, goldenEnd: 0.88 }) }),
    Object.freeze({ oneWayDuration: 2200, endpointPauseMs: 150, timeLimit: 10000, zones: Object.freeze({ rawEnd: 0.40, goldenEnd: 0.88 }) })
]);

export const CAMPFIRE_HEAT_ZONES = CAMPFIRE_KIDS_ROUND_PROFILES[0].zones;

export const CAMPFIRE_JUDGEMENT_WINDOWS = Object.freeze({
    perfectWidth: 0.06,
    // 未來技能可調整此參數，基礎版維持正中央 1.5%。
    rainbowPerfectWidth: 0.015
});

export function getKidsCampfireRoundProfile(roundIndex = 0) {
    const safeRound = Math.max(0, Math.min(CAMPFIRE_KIDS_ROUND_PROFILES.length - 1, Number(roundIndex || 0)));
    return CAMPFIRE_KIDS_ROUND_PROFILES[safeRound];
}

// 保留舊函式名稱，回傳火候指標由左走到右所需的時間。
export function getKidsRoastDuration(roundIndex = 0) {
    return getKidsCampfireRoundProfile(roundIndex).oneWayDuration;
}

export function getCampfireTimeLimit(roundIndex = 0) {
    return getKidsCampfireRoundProfile(roundIndex).timeLimit;
}

export function getOscillatingHeatPassIndex(elapsedMs = 0, oneWayDuration = 2800, endpointPauseMs = 150) {
    const duration = Math.max(1, Number(oneWayDuration || 1));
    const pause = Math.max(0, Number(endpointPauseMs || 0));
    return Math.floor(Math.max(0, Number(elapsedMs || 0)) / (duration + pause));
}

export function getOscillatingHeatProgress(elapsedMs = 0, oneWayDuration = 2800, endpointPauseMs = 150) {
    const duration = Math.max(1, Number(oneWayDuration || 1));
    const pause = Math.max(0, Number(endpointPauseMs || 0));
    const legDuration = duration + pause;
    const elapsed = Math.max(0, Number(elapsedMs || 0));
    const legIndex = Math.floor(elapsed / legDuration);
    const elapsedInLeg = elapsed % legDuration;
    const linearProgress = Math.min(1, elapsedInLeg / duration);
    return legIndex % 2 === 0 ? linearProgress : 1 - linearProgress;
}

export function getCampfireHeatState(progress, zones = CAMPFIRE_HEAT_ZONES) {
    const value = Math.max(0, Math.min(1, Number(progress || 0)));
    if (value < zones.rawEnd) return 'raw';
    if (value < zones.goldenEnd) return 'golden';
    return 'burnt';
}

export function getCampfireJudgement(
    progress,
    zones = CAMPFIRE_HEAT_ZONES,
    windows = CAMPFIRE_JUDGEMENT_WINDOWS
) {
    const state = getCampfireHeatState(progress, zones);
    if (state !== 'golden') return state;

    const value = Math.max(0, Math.min(1, Number(progress || 0)));
    const goldenCenter = (Number(zones.rawEnd) + Number(zones.goldenEnd)) / 2;
    const distance = Math.abs(value - goldenCenter);
    if (distance <= Number(windows.rainbowPerfectWidth || 0) / 2) return 'rainbowPerfect';
    if (distance <= Number(windows.perfectWidth || 0) / 2) return 'perfect';
    return 'golden';
}

export function calculateCampfireScore({ earlyCount = 0, burntCount = 0, hotCount = burntCount, timeoutCount = 0 } = {}) {
    const rawScore = 100
        - Number(earlyCount || 0) * 3
        - Number(hotCount || 0) * 6
        - Number(timeoutCount || 0) * 8;
    return Math.max(60, Math.min(100, Math.round(rawScore)));
}

export function calculateCampfireAccuracy({ completedCount = 0, earlyCount = 0, burntCount = 0, hotCount = burntCount, timeoutCount = 0 } = {}) {
    const completed = Math.max(0, Number(completedCount || 0));
    const mistakes = Math.max(0, Number(earlyCount || 0))
        + Math.max(0, Number(hotCount || 0))
        + Math.max(0, Number(timeoutCount || 0));
    return Math.round((completed / Math.max(1, completed + mistakes)) * 100);
}

export function shouldCreateRainbowMarshmallow(combo = 0, alreadyCreated = false) {
    return !alreadyCreated && Number(combo || 0) >= 4;
}
