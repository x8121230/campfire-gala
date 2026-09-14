export const SNOW_HOUSE_ANIMALS = Object.freeze([
    { id: 'penguin', name: '小企鵝', color: 0x516c86 },
    { id: 'seal', name: '小海豹', color: 0x91b9c8 },
    { id: 'rabbit', name: '雪兔', color: 0xe7a5b4 },
    { id: 'walrus', name: '小海象', color: 0xb88769 }
]);

export const SNOW_HOUSE_LEVELS = Object.freeze([
    { name: '兩對新朋友', animals: ['penguin', 'seal'] },
    { name: '換一組找找看', animals: ['rabbit', 'walrus'] },
    { name: '三對雪地朋友', animals: ['penguin', 'seal', 'rabbit'] },
    { name: '記住六間雪屋', animals: ['walrus', 'rabbit', 'penguin'] },
    { name: '雪屋派對', animals: ['seal', 'walrus', 'rabbit'] }
]);

export function buildSnowHouseBoard(level, random = Math.random) {
    const animals = level.animals.flatMap((animal) => [animal, animal]);
    for (let i = animals.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [animals[i], animals[j]] = [animals[j], animals[i]];
    }
    return animals.map((animal, id) => ({ id, animal, matched: false, revealed: false }));
}

export class SnowHouseMemorySession {
    constructor(levelIndex = 0, random = Math.random) {
        this.levelIndex = levelIndex;
        this.random = random;
        this.totalAttempts = 0;
        this.totalMistakes = 0;
        this.hints = 0;
        this.resetLevel();
    }
    get level() { return SNOW_HOUSE_LEVELS[this.levelIndex] ?? null; }
    get complete() { return this.tiles.length > 0 && this.tiles.every((tile) => tile.matched); }
    resetLevel() {
        this.tiles = this.level ? buildSnowHouseBoard(this.level, this.random) : [];
        this.firstId = null;
        this.attempts = 0;
        this.mistakes = 0;
    }
    choose(id) {
        const tile = this.tiles[id];
        if (!tile || tile.matched || tile.revealed) return { result: 'ignored' };
        tile.revealed = true;
        if (this.firstId === null) {
            this.firstId = id;
            return { result: 'first', ids: [id] };
        }
        const first = this.tiles[this.firstId];
        const ids = [this.firstId, id];
        this.firstId = null;
        this.attempts += 1;
        this.totalAttempts += 1;
        if (first.animal === tile.animal) {
            first.matched = true;
            tile.matched = true;
            return { result: 'match', ids, animal: tile.animal, levelComplete: this.complete };
        }
        this.mistakes += 1;
        this.totalMistakes += 1;
        return { result: 'mismatch', ids };
    }
    close(ids) {
        ids.forEach((id) => {
            const tile = this.tiles[id];
            if (tile && !tile.matched) tile.revealed = false;
        });
    }
    peek() {
        this.hints += 1;
        return this.tiles.filter((tile) => !tile.matched).map((tile) => tile.id);
    }
    advance() {
        if (!this.complete) return false;
        this.levelIndex += 1;
        if (this.level) this.resetLevel();
        else this.tiles = [];
        return true;
    }
}
