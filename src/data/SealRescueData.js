export const SEAL_RESCUE_CONFIG = Object.freeze({
    sealsToFinish: 5,
    choiceX: Object.freeze([480, 700, 920]),
    choiceY: 335,
    playerY: 570,
    jumpSeconds: .72
});

export class SealRescueSession {
    constructor() {
        this.round = 0; this.seals = 0; this.crossings = 0; this.splashes = 0;
        this.hints = 0; this.finished = false; this.current = null;
    }
    nextRound(random = Math.random) {
        if (this.finished) return null;
        const crackedLane = this.round < 2 ? -1 : Math.floor(random() * 3);
        const sealLane = this.seals < 5 && (this.round < 2 || this.round % 2 === 0)
            ? (crackedLane === 1 ? 0 : 1)
            : -1;
        this.current = [0, 1, 2].map(lane => ({
            lane,
            cracked: lane === crackedLane,
            seal: lane === sealLane
        }));
        this.round += 1;
        return this.current;
    }
    choose(lane) {
        if (this.finished || !this.current || !Number.isInteger(lane) || lane < 0 || lane > 2) return null;
        const choice = this.current[lane]; this.current = null; this.crossings += 1;
        if (choice.cracked) { this.splashes += 1; return { result: 'splash', choice }; }
        if (choice.seal) {
            this.seals += 1;
            if (this.seals >= SEAL_RESCUE_CONFIG.sealsToFinish) this.finished = true;
            return { result: 'rescue', choice, finished: this.finished };
        }
        return { result: 'safe', choice };
    }
    hint() {
        this.hints += 1;
        if (!this.current) return -1;
        const seal = this.current.find(c => c.seal && !c.cracked);
        if (seal) return seal.lane;
        return this.current.find(c => !c.cracked)?.lane ?? -1;
    }
}
