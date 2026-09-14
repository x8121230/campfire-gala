export const SKI_CONFIG = Object.freeze({
    crystalsToFinish: 12,
    laneX: Object.freeze([455, 650, 845]),
    startLane: 1,
    playerY: 565,
    spawnY: 122,
    collectRadius: 58,
    hitRadius: 54,
    invincibleSeconds: 1.35,
    jumpSeconds: 0.82
});

export const SKI_STAGES = Object.freeze([
    { from: 0, label: '第 1 段・認識雪道', speed: 135, spawn: 1.22 },
    { from: 4, label: '第 2 段・冰晶山坡', speed: 170, spawn: 1.05 },
    { from: 8, label: '第 3 段・雪花終點', speed: 205, spawn: 0.90 }
]);

export function skiStage(crystals) {
    for (let i = SKI_STAGES.length - 1; i >= 0; i--) {
        if (crystals >= SKI_STAGES[i].from) return SKI_STAGES[i];
    }
    return SKI_STAGES[0];
}

export class SkiSession {
    constructor() {
        this.crystals = 0;
        this.bumped = 0;
        this.jumps = 0;
        this.changedLane = 0;
        this.slowMode = false;
        this.finished = false;
    }
    collect() {
        if (this.finished) return false;
        this.crystals += 1;
        if (this.crystals >= SKI_CONFIG.crystalsToFinish) this.finished = true;
        return true;
    }
    bump() { if (!this.finished) this.bumped += 1; }
    jump() { if (!this.finished) this.jumps += 1; }
    laneChange() { if (!this.finished) this.changedLane += 1; }
    toggleSlow() { this.slowMode = !this.slowMode; return this.slowMode; }
}
