export const SNOWBALL_CONFIG = Object.freeze({
    totalToFinish: 15,
    lanes: Object.freeze([225, 382, 539]),
    spawnX: 1010,
    defenseX: 292,
    projectileSeconds: 0.42,
    missReturnSeconds: 0.7
});

export const SNOW_MONSTERS = Object.freeze([
    { id: 'fluffy', name: '棉花雪怪', hp: 1, speed: 54, color: 0xe9f8fb },
    { id: 'blue', name: '藍帽雪怪', hp: 1, speed: 69, color: 0xc3e8f2 },
    { id: 'round', name: '圓滾雪怪', hp: 2, speed: 44, color: 0xf8fdff }
]);

export const SNOWBALL_STAGES = Object.freeze([
    { from: 0, label: '第 1 段・練習瞄準', spawnSeconds: 1.65, speedScale: .78 },
    { from: 5, label: '第 2 段・三條雪道', spawnSeconds: 1.38, speedScale: .94 },
    { from: 10, label: '第 3 段・雪球派對', spawnSeconds: 1.16, speedScale: 1.08 }
]);

export function snowballStage(defeated) {
    for (let i = SNOWBALL_STAGES.length - 1; i >= 0; i--) {
        if (defeated >= SNOWBALL_STAGES[i].from) return SNOWBALL_STAGES[i];
    }
    return SNOWBALL_STAGES[0];
}

export class SnowballDefenseSession {
    constructor() {
        this.defeated = 0; this.missed = 0; this.throws = 0; this.hits = 0;
        this.combo = 0; this.bestCombo = 0; this.finished = false;
    }
    throwBall() { this.throws += 1; return this.throws % 5 === 0 ? 'big' : 'normal'; }
    hit(defeated = false) {
        this.hits += 1; this.combo += 1; this.bestCombo = Math.max(this.bestCombo, this.combo);
        if (defeated) {
            this.defeated += 1;
            if (this.defeated >= SNOWBALL_CONFIG.totalToFinish) this.finished = true;
        }
    }
    miss() { if (!this.finished) { this.missed += 1; this.combo = 0; } }
}
