export const DIRECTIONS = Object.freeze({
    up: { x: 0, y: -1, label: '上', arrow: '↑' },
    right: { x: 1, y: 0, label: '右', arrow: '→' },
    down: { x: 0, y: 1, label: '下', arrow: '↓' },
    left: { x: -1, y: 0, label: '左', arrow: '←' }
});
export function parseLevel(spec) {
    const rows = spec.map, width = rows[0]?.length;
    if (!width || rows.some(r => r.length !== width)) throw new Error(`關卡 ${spec.id} 地圖寬度不一致`);
    const level = { ...spec, width, height: rows.length, cells: [], boxes: [], plates: [], gems: [], portals: [], start: -1, exit: -1 };
    let starts = 0, exits = 0, keys = 0;
    rows.forEach((row, y) => [...row].forEach((tile, x) => {
        if (!'#.@$p*+EKDGSBTc'.includes(tile)) throw new Error(`未知地格 ${tile}`);
        const i = y * width + x;
        if ('@+'.includes(tile)) { level.start = i; starts++; }
        if ('$*'.includes(tile)) level.boxes.push(i);
        if ('p*+'.includes(tile)) level.plates.push(i);
        if (tile === 'c') level.gems.push(i);
        if (tile === 'T') level.portals.push(i);
        if (tile === 'E') { level.exit = i; exits++; }
        if (tile === 'K') keys++;
        level.cells.push(tile === '@' || tile === '$' ? '.' : '*+'.includes(tile) ? 'p' : tile);
    }));
    if (starts !== 1 || exits !== 1 || keys > 1 || level.boxes.length !== level.plates.length || ![0, 2].includes(level.portals.length) || level.gems.length > 15) throw new Error(`關卡 ${spec.id} 元件數量錯誤`);
    if (level.cells.includes('D') && keys !== 1) throw new Error('鑰匙門缺少鑰匙');
    if (level.cells.includes('B') && !level.cells.includes('S')) throw new Error('橋缺少開關');
    level.allGems = (1 << level.gems.length) - 1;
    return level;
}
export function initialState(level) { return { player: level.start, boxes: [...level.boxes].sort((a, b) => a - b), key: false, bridge: false, gems: 0 }; }
export function platesFilled(level, state) { return level.plates.every(i => state.boxes.includes(i)); }
export function isWin(level, state) { return state.player === level.exit && platesFilled(level, state); }
export function gemCount(state) { let n = state.gems, count = 0; while (n) { count += n & 1; n >>>= 1; } return count; }
export function adjacent(level, index, direction) {
    const d = DIRECTIONS[direction]; if (!d) return -1;
    const x = index % level.width + d.x, y = Math.floor(index / level.width) + d.y;
    return x < 0 || y < 0 || x >= level.width || y >= level.height ? -1 : y * level.width + x;
}
function blocked(level, state, i) {
    const tile = level.cells[i];
    if (i < 0 || !tile || tile === '#') return '那裡是石牆。';
    if (tile === 'D' && !state.key) return '先找到金色鑰匙，才能穿過鎖門。';
    if (tile === 'G' && !platesFilled(level, state)) return '把木箱推上每一個圓形底座，閘門才會開。';
    if (tile === 'B' && !state.bridge) return '橋還沒接通，踩一下橘色開關。';
    return '';
}
function boxFloor(level, state, i) {
    const tile = level.cells[i];
    if (tile === '.' || tile === 'p') return true;
    if (tile === 'K' && state.key) return true;
    if (tile === 'c') return !!(state.gems & (1 << level.gems.indexOf(i)));
    return false;
}
export function cornerBoxes(level, state) {
    return state.boxes.filter(i => !level.plates.includes(i) &&
        (level.cells[adjacent(level, i, 'up')] === '#' || adjacent(level, i, 'up') < 0 || level.cells[adjacent(level, i, 'down')] === '#' || adjacent(level, i, 'down') < 0) &&
        (level.cells[adjacent(level, i, 'left')] === '#' || adjacent(level, i, 'left') < 0 || level.cells[adjacent(level, i, 'right')] === '#' || adjacent(level, i, 'right') < 0));
}
// Pure, deterministic transition, shared by player input, tests and the hint solver.
export function transition(level, state, direction) {
    if (!DIRECTIONS[direction] || isWin(level, state)) return { ok: false, reason: '這一關已完成。' };
    let next = adjacent(level, state.player, direction);
    const reason = blocked(level, state, next); if (reason) return { ok: false, reason };
    const boxes = [...state.boxes], boxIndex = boxes.indexOf(next);
    let pushed = false;
    if (boxIndex >= 0) {
        const destination = adjacent(level, next, direction);
        if (boxes.includes(destination)) return { ok: false, reason: '一次只能推一個木箱。' };
        if (!boxFloor(level, state, destination)) return { ok: false, reason: '木箱只能推到空地或圓形底座；先收走路上的物品。' };
        boxes[boxIndex] = destination; boxes.sort((a, b) => a - b); pushed = true;
    }
    const result = { ...state, player: next, boxes };
    const events = [];
    if (pushed) events.push('push');
    if (level.cells[next] === 'K' && !result.key) { result.key = true; events.push('key'); }
    const gem = level.gems.indexOf(next);
    if (gem >= 0 && !(result.gems & (1 << gem))) { result.gems |= 1 << gem; events.push('gem'); }
    if (level.cells[next] === 'S') { result.bridge = !result.bridge; events.push('switch'); }
    if (level.cells[next] === 'T') {
        const destination = level.portals.find(i => i !== next);
        if (destination === undefined || boxes.includes(destination)) return { ok: false, reason: '另一個傳送陣被擋住了。' };
        result.player = destination; events.push('portal');
    }
    if (isWin(level, result)) events.push('win');
    else if (result.player === level.exit) events.push('exit-locked');
    if (pushed && cornerBoxes(level, result).length) events.push('corner');
    return { ok: true, state: result, events };
}
export class MechanismSession {
    constructor(level) { this.level = level; this.state = initialState(level); this.history = []; this.moves = 0; this.pushes = 0; this.hintsUsed = 0; this.undoCount = 0; }
    get won() { return isWin(this.level, this.state); }
    move(direction) {
        const step = transition(this.level, this.state, direction);
        if (!step.ok) return step;
        this.history.push({ state: this.state, moves: this.moves, pushes: this.pushes });
        this.state = step.state; this.moves++; if (step.events.includes('push')) this.pushes++;
        return step;
    }
    undo() {
        const past = this.history.pop(); if (!past) return false;
        this.state = past.state; this.moves = past.moves; this.pushes = past.pushes; this.undoCount++; return true;
    }
    medals() {
        const clear = this.won;
        return [clear, clear && this.state.gems === this.level.allGems, clear && this.moves <= this.level.par && this.hintsUsed === 0];
    }
}
const stateKey = s => `${s.player}|${s.boxes.join(',')}|${Number(s.key)}${Number(s.bridge)}|${s.gems}`;
// Incremental BFS: scene calls tick() in small chunks so hard hints never freeze input.
export function createSolver(level, start = initialState(level), { allGems = true, limit = 160000 } = {}) {
    const queue = [{ state: start, parent: -1, direction: null }], seen = new Set([stateKey(start)]);
    let head = 0, status = 'searching', path = null;
    const goal = s => isWin(level, s) && (!allGems || s.gems === level.allGems);
    const finish = index => {
        path = []; for (let i = index; queue[i].parent >= 0; i = queue[i].parent) path.push(queue[i].direction);
        path.reverse(); status = 'solved';
    };
    if (goal(start)) finish(0);
    return {
        get status() { return status; }, get path() { return path; }, get visited() { return seen.size; },
        tick(budget = 350) {
            if (status !== 'searching') return status;
            let processed = 0;
            while (head < queue.length && processed++ < budget) {
                const parent = head++, state = queue[parent].state;
                for (const direction of Object.keys(DIRECTIONS)) {
                    const step = transition(level, state, direction); if (!step.ok) continue;
                    if (cornerBoxes(level, step.state).length) continue;
                    const key = stateKey(step.state); if (seen.has(key)) continue;
                    seen.add(key); queue.push({ state: step.state, parent, direction });
                    if (goal(step.state)) { finish(queue.length - 1); return status; }
                    if (seen.size >= limit) { status = 'limit'; return status; }
                }
            }
            if (head === queue.length) status = 'no-solution';
            return status;
        }
    };
}
