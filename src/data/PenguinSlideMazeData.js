export const SLIDE_DIRECTIONS = Object.freeze({
    up: { dx: 0, dy: -1, label: '上' },
    down: { dx: 0, dy: 1, label: '下' },
    left: { dx: -1, dy: 0, label: '左' },
    right: { dx: 1, dy: 0, label: '右' }
});

export const PENGUIN_SLIDE_LEVELS = Object.freeze([
    { name: '直直滑到營火', width: 7, height: 5, start: [1, 4], goal: [0, 4], obstacles: [], guide: '先試試看向左滑。' },
    { name: '雪牆前轉彎', width: 7, height: 5, start: [3, 4], goal: [6, 2], obstacles: [[1, 2], [6, 1], [2, 2], [4, 1]], guide: '先滑到右邊，再往上。' },
    { name: '冰湖三步曲', width: 7, height: 5, start: [4, 2], goal: [3, 3], obstacles: [[4, 1], [6, 3], [0, 4], [0, 0], [6, 1]], guide: '利用湖邊和雪堆停下來。' },
    { name: '繞過雪石', width: 7, height: 5, start: [5, 4], goal: [2, 2], obstacles: [[1, 2], [4, 1], [4, 3], [3, 4], [6, 3], [1, 4]], guide: '需要規劃四次滑行。' },
    { name: '極光滑冰迷宮', width: 7, height: 5, start: [6, 3], goal: [6, 0], obstacles: [[5, 4], [1, 2], [3, 0], [1, 3], [6, 1], [0, 2], [2, 3]], guide: '最後挑戰五次滑行！' }
]);

const pointKey = ([x, y]) => `${x},${y}`;

export function slideFrom(level, position, direction) {
    const vector = SLIDE_DIRECTIONS[direction];
    if (!vector) return { moved: false, position: [...position], path: [], reachedGoal: false };
    const blocked = new Set(level.obstacles.map(pointKey));
    let [x, y] = position; const path = [];
    while (true) {
        const nx = x + vector.dx, ny = y + vector.dy;
        if (nx < 0 || nx >= level.width || ny < 0 || ny >= level.height || blocked.has(`${nx},${ny}`)) break;
        x = nx; y = ny; path.push([x, y]);
        if (x === level.goal[0] && y === level.goal[1]) {
            return { moved: true, position: [x, y], path, reachedGoal: true };
        }
    }
    return { moved: path.length > 0, position: [x, y], path, reachedGoal: false };
}

export function solveSlideMaze(level, start = level.start) {
    const queue = [{ position: [...start], moves: [] }], visited = new Set([pointKey(start)]);
    while (queue.length) {
        const current = queue.shift();
        for (const direction of Object.keys(SLIDE_DIRECTIONS)) {
            const result = slideFrom(level, current.position, direction);
            if (!result.moved) continue;
            const moves = [...current.moves, direction];
            if (result.reachedGoal) return moves;
            const key = pointKey(result.position);
            if (!visited.has(key)) { visited.add(key); queue.push({ position: result.position, moves }); }
        }
    }
    return null;
}

export class PenguinSlideSession {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex; this.totalMoves = 0; this.totalUndos = 0; this.hints = 0; this.resetLevel();
    }
    get level() { return PENGUIN_SLIDE_LEVELS[this.levelIndex] ?? null; }
    resetLevel() { this.position = this.level ? [...this.level.start] : null; this.history = []; this.moves = 0; this.complete = false; }
    move(direction) {
        if (!this.level || this.complete) return { result: 'ignored' };
        const slide = slideFrom(this.level, this.position, direction);
        if (!slide.moved) return { result: 'blocked', direction };
        this.history.push([...this.position]); this.position = [...slide.position]; this.moves += 1; this.totalMoves += 1;
        if (slide.reachedGoal) this.complete = true;
        return { result: slide.reachedGoal ? 'complete' : 'moved', ...slide, direction };
    }
    undo() {
        const previous = this.history.pop(); if (!previous) return false;
        this.position = previous; this.complete = false; this.moves = Math.max(0, this.moves - 1); this.totalUndos += 1; return true;
    }
    hint() { this.hints += 1; return solveSlideMaze(this.level, this.position)?.[0] ?? null; }
    advance() { if (!this.complete) return false; this.levelIndex += 1; if (this.level) this.resetLevel(); else this.position = null; return true; }
}
