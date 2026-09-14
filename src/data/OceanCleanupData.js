export const OCEAN_ITEMS = Object.freeze({
    bottle: { name: '塑膠瓶', category: 'plastic', frame: 1 },
    can: { name: '金屬罐', category: 'metal', frame: 2 },
    box: { name: '紙箱', category: 'paper', frame: 3 },
    fish: { name: '小魚', category: null, frame: 4 },
    turtle: { name: '海龜', category: null, frame: 5 }
});
export const OCEAN_BINS = Object.freeze([
    { id: 'plastic', name: '塑膠', sample: 'bottle', color: 0xd4f3fc },
    { id: 'metal', name: '金屬', sample: 'can', color: 0xe5e5ff },
    { id: 'paper', name: '紙類', sample: 'box', color: 0xffeac2 }
]);
export const OCEAN_DIFFICULTIES = Object.freeze({ kids: true, adult: false });
const trash = ['bottle', 'can', 'box'];
function shuffle(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
export function makeOceanRounds(random = Math.random) {
    const rounds = [];
    for (const stage of ['rescue', 'sort', 'mission']) {
        const order = shuffle(trash, random);
        for (let n = 0; n < 4; n++) {
            const target = order[n % 3];
            const count = stage === 'mission' && n > 0 ? 2 : 1;
            const items = stage === 'mission'
                ? [...Array(count).fill(target), trash.find(id => id !== target), n % 2 ? 'turtle' : 'fish']
                : [target, 'fish', 'turtle'];
            rounds.push({ stage, target, count, items: shuffle(items, random) });
        }
    }
    return rounds;
}
// All progress is session-local. No save, reward, heart or achievement calls.
export class OceanSession {
    constructor(random = Math.random) {
        this.rounds = makeOceanRounds(random); this.index = 0;
        this.completed = 0; this.collected = 0; this.wrong = 0; this.hints = 0;
        this.resetRound();
    }
    resetRound() {
        this.caught = new Set(); this.rejected = new Set(); this.wrongBins = new Set();
        this.pending = null; this.solved = false; this.hinted = false;
    }
    get round() { return this.rounds[this.index]; }
    get done() { return this.completed === this.rounds.length; }
    valid(index) { return Number.isInteger(index) && index >= 0 && index < this.round.items.length; }
    isTarget(index) {
        return this.valid(index) && !this.caught.has(index) &&
            !!OCEAN_ITEMS[this.round.items[index]].category &&
            (this.round.stage !== 'mission' || this.round.items[index] === this.round.target);
    }
    hint() {
        if (this.solved) return [];
        if (!this.hinted) { this.hinted = true; this.hints++; }
        return this.round.items.map((_, i) => i).filter(i => this.isTarget(i));
    }
    choose(index) {
        if (this.solved || this.pending !== null || !this.valid(index) || this.caught.has(index) || this.rejected.has(index)) return 'ignored';
        if (!this.isTarget(index)) {
            this.rejected.add(index); this.wrong++;
            return OCEAN_ITEMS[this.round.items[index]].category ? 'other-trash' : 'protected';
        }
        if (this.round.stage === 'sort') { this.pending = index; return 'sort'; }
        return this.collect(index);
    }
    sort(category) {
        if (this.solved || this.pending === null || !OCEAN_BINS.some(b => b.id === category) || this.wrongBins.has(category)) return 'ignored';
        const wanted = OCEAN_ITEMS[this.round.items[this.pending]].category;
        if (wanted !== category) { this.wrongBins.add(category); this.wrong++; return 'wrong-bin'; }
        const index = this.pending; this.pending = null;
        return this.collect(index);
    }
    collect(index) {
        this.caught.add(index); this.collected++;
        if (this.caught.size >= this.round.count) { this.solved = true; this.completed++; return 'complete'; }
        return 'collected';
    }
    advance() {
        if (!this.solved || this.done) return false;
        this.index++; this.resetRound(); return true;
    }
}
