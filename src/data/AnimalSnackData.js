// Pure game rules: no Phaser, registry, rewards, or storage side effects.
export const SNACK_GUESTS = Object.freeze([
    { id: 'rabbit', name: '小兔子', food: 'carrot', foodName: '紅蘿蔔', color: 0xf1b695 },
    { id: 'monkey', name: '小猴子', food: 'banana', foodName: '香蕉', color: 0xf4d479 },
    { id: 'panda', name: '熊貓', food: 'bamboo', foodName: '竹子', color: 0xa6cda4 }
]);
export const SNACK_CONFIG = Object.freeze({ goal: 12, startY: 170, endY: 417, flightSeconds: 0.65 });
export function makeSnackQueue(random = Math.random) {
    const queue = [0, 1, 2]; // Introduce all three guests before removing hints.
    for (let cycle = 0; cycle < 3; cycle++) {
        const group = [0, 1, 2];
        for (let i = 2; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [group[i], group[j]] = [group[j], group[i]];
        }
        if (group[0] === queue[queue.length - 1]) [group[0], group[1]] = [group[1], group[0]];
        queue.push(...group);
    }
    return queue.map((animal, id) => ({ id, animal, retries: 0 }));
}
export function snackSpeed(served) { return served < 4 ? 22 : served < 8 ? 28 : 34; }
export class SnackSession {
    constructor(random = Math.random) {
        this.queue = makeSnackQueue(random);
        this.current = null;
        this.served = 0;
        this.attempts = 0;
        this.wrong = 0;
        this.missed = 0;
        this.hints = 0;
        this.cleanDeliveries = 0;
        this.next();
    }
    get done() { return this.served === SNACK_CONFIG.goal; }
    get guest() { return this.current ? SNACK_GUESTS[this.current.animal] : null; }
    next() {
        this.current = this.queue.shift() || null;
        this.currentWrong = false;
        this.showHint = !!this.current && (this.current.id < 3 || this.current.retries > 0);
    }
    hint() {
        if (!this.current || this.showHint) return false;
        this.showHint = true;
        this.hints++;
        return true;
    }
    deliver(food) {
        if (!this.current || !SNACK_GUESTS.some(g => g.food === food)) return 'ignored';
        this.attempts++;
        if (food !== this.guest.food) {
            this.wrong++;
            this.currentWrong = true;
            this.showHint = true;
            return 'wrong';
        }
        if (!this.currentWrong && this.current.retries === 0) this.cleanDeliveries++;
        this.served++;
        this.current = null;
        return 'correct';
    }
    miss() {
        if (!this.current) return false;
        this.missed++;
        this.queue.push({ ...this.current, retries: this.current.retries + 1 });
        this.current = null;
        return true;
    }
}
