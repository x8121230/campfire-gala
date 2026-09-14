export const ICE_PUZZLE_LEVELS = Object.freeze([
    {
        name: '第一關・向前推',
        map: ['#######', '#.....#', '#.....#', '#.PBT.#', '#.....#', '#######']
    },
    {
        name: '第二關・轉個彎',
        map: ['#######', '#...T.#', '#..B..#', '#.P...#', '#.....#', '#######']
    },
    {
        name: '第三關・兩塊冰',
        map: ['#######', '#.T.T.#', '#.B.B.#', '#..P..#', '#.....#', '#######']
    },
    {
        name: '第四關・繞過雪牆',
        map: ['#######', '#.T...#', '#.....#', '#..B#.#', '#...P.#', '#######']
    },
    {
        name: '第五關・冰晶小屋',
        map: ['#######', '#.T.T.#', '#.....#', '#.B.B.#', '#..P..#', '#######']
    }
]);

export const ICE_DIRECTIONS = Object.freeze({
    up: { x: 0, y: -1, label: '上' },
    down: { x: 0, y: 1, label: '下' },
    left: { x: -1, y: 0, label: '左' },
    right: { x: 1, y: 0, label: '右' }
});

const key = (x, y) => `${x},${y}`;

export function parseIceLevel(level) {
    const walls = new Set(), targets = new Set(), boxes = new Set();
    let player = { x: 1, y: 1 };
    level.map.forEach((row, y) => [...row].forEach((cell, x) => {
        if (cell === '#') walls.add(key(x, y));
        if (cell === 'T' || cell === '*') targets.add(key(x, y));
        if (cell === 'B' || cell === '*') boxes.add(key(x, y));
        if (cell === 'P') player = { x, y };
    }));
    return { width: level.map[0].length, height: level.map.length, walls, targets, boxes, player };
}

export class PenguinPuzzleSession {
    constructor(levelIndex = 0) { this.load(levelIndex); }
    load(levelIndex) {
        this.levelIndex = Math.max(0, Math.min(ICE_PUZZLE_LEVELS.length - 1, levelIndex));
        const parsed = parseIceLevel(ICE_PUZZLE_LEVELS[this.levelIndex]);
        Object.assign(this, parsed); this.moves = 0; this.pushes = 0; this.history = [];
    }
    snapshot() { return { player: { ...this.player }, boxes: [...this.boxes], moves: this.moves, pushes: this.pushes }; }
    restore(s) { this.player = { ...s.player }; this.boxes = new Set(s.boxes); this.moves = s.moves; this.pushes = s.pushes; }
    canStand(x, y) { const k = key(x, y); return !this.walls.has(k) && !this.boxes.has(k); }
    move(directionName) {
        const d = ICE_DIRECTIONS[directionName]; if (!d) return { moved: false, pushed: false };
        const nx = this.player.x + d.x, ny = this.player.y + d.y, nk = key(nx, ny);
        if (this.walls.has(nk)) return { moved: false, pushed: false };
        let pushed = false;
        if (this.boxes.has(nk)) {
            const bx = nx + d.x, by = ny + d.y, bk = key(bx, by);
            if (this.walls.has(bk) || this.boxes.has(bk)) return { moved: false, pushed: false };
            this.history.push(this.snapshot()); this.boxes.delete(nk); this.boxes.add(bk); pushed = true; this.pushes += 1;
        } else this.history.push(this.snapshot());
        this.player = { x: nx, y: ny }; this.moves += 1;
        return { moved: true, pushed, complete: this.complete() };
    }
    undo() { const previous = this.history.pop(); if (!previous) return false; this.restore(previous); return true; }
    reset() { this.load(this.levelIndex); }
    complete() { return [...this.targets].every(target => this.boxes.has(target)); }
}

export function findIcePuzzleHint(session, maxStates = 30000) {
    const targetKeys = [...session.targets].sort();
    const start = { player: { ...session.player }, boxes: [...session.boxes].sort(), first: null };
    const queue = [start], seen = new Set([encode(start)]);
    for (let cursor = 0; cursor < queue.length && seen.size <= maxStates; cursor++) {
        const state = queue[cursor];
        if (targetKeys.every(target => state.boxes.includes(target))) return state.first;
        for (const name of Object.keys(ICE_DIRECTIONS)) {
            const next = simulate(state, name, session.walls); if (!next) continue;
            next.first = state.first || name; const encoded = encode(next);
            if (!seen.has(encoded)) { seen.add(encoded); queue.push(next); }
        }
    }
    return null;
}

function simulate(state, directionName, walls) {
    const d = ICE_DIRECTIONS[directionName], boxes = new Set(state.boxes);
    const nx = state.player.x + d.x, ny = state.player.y + d.y, nk = key(nx, ny);
    if (walls.has(nk)) return null;
    if (boxes.has(nk)) {
        const bk = key(nx + d.x, ny + d.y);
        if (walls.has(bk) || boxes.has(bk)) return null;
        boxes.delete(nk); boxes.add(bk);
    }
    return { player: { x: nx, y: ny }, boxes: [...boxes].sort(), first: state.first };
}

function encode(state) { return `${state.player.x},${state.player.y}|${state.boxes.join(';')}`; }
