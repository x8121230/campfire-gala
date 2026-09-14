export const SLED_CONFIG = Object.freeze({
    deliveriesToFinish: 5,
    deliveryMinX: 525,
    deliveryMaxX: 675,
    houseStartX: 1075,
    houseMissX: 275
});

export const SLED_SPEEDS = Object.freeze({
    slow: { label: '慢慢走', value: 72 },
    steady: { label: '穩穩走', value: 112 },
    fast: { label: '快快走', value: 162 }
});

export const DELIVERY_HOUSES = Object.freeze([
    { name: '企鵝郵局', color: 0x5aaac2 },
    { name: '海豹小屋', color: 0x8b79b6 },
    { name: '雪兔糖果屋', color: 0xd67c8e },
    { name: '狐狸暖爐屋', color: 0xd48a55 },
    { name: '冰晶圖書館', color: 0x5c91ba }
]);

export class SledDeliverySession {
    constructor() {
        this.delivered = 0; this.attempts = 0; this.early = 0; this.late = 0;
        this.cargoCatches = 0; this.speedChanges = 0; this.speed = 'steady'; this.finished = false;
    }
    setSpeed(mode) {
        if (!SLED_SPEEDS[mode]) return false;
        if (this.speed !== mode) this.speedChanges += 1;
        this.speed = mode; return true;
    }
    deliverAt(x) {
        if (this.finished) return { result: 'finished' };
        this.attempts += 1;
        if (x > SLED_CONFIG.deliveryMaxX) { this.early += 1; return { result: 'early' }; }
        if (x < SLED_CONFIG.deliveryMinX) { this.late += 1; return { result: 'late' }; }
        this.delivered += 1;
        if (this.delivered >= SLED_CONFIG.deliveriesToFinish) this.finished = true;
        return { result: 'success', finished: this.finished };
    }
    missHouse() { if (!this.finished) this.late += 1; }
    catchCargo() { if (!this.finished) this.cargoCatches += 1; }
}
