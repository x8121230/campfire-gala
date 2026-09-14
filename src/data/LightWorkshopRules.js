export const LIGHT_COLORS = Object.freeze({
    0: { name: '保持暗', short: '暗', color: 0x6f7895 },
    1: { name: '紅光', short: '紅', color: 0xff646f },
    2: { name: '綠光', short: '綠', color: 0x72ed9c },
    3: { name: '黃光', short: '黃', color: 0xffde6a },
    4: { name: '藍光', short: '藍', color: 0x6daeff },
    5: { name: '洋紅光', short: '洋紅', color: 0xf49eff },
    6: { name: '青光', short: '青', color: 0x6be9f0 },
    7: { name: '白光', short: '白', color: 0xf8fbff }
});
export const LIGHT_DIRS = Object.freeze([{ x: 1, y: 0, arrow: '→' }, { x: 0, y: 1, arrow: '↓' }, { x: -1, y: 0, arrow: '←' }, { x: 0, y: -1, arrow: '↑' }]);
export const FILTER_MASKS = Object.freeze([1, 2, 4]);
export const reflected = (direction, tilt) => (tilt === 0 ? [3, 2, 1, 0] : [1, 0, 3, 2])[direction];
export function compileLightLevel(spec) {
    const level = { ...spec, width: spec.width || 9, height: spec.height || 7, nodes: spec.nodes.map(n => ({ ...n })), controls: [], targets: [], sources: [], byCell: new Map() };
    const ids = new Set(); let combinations = 1;
    for (const node of level.nodes) {
        if (!['source','mirror','splitter','filter','target','wall'].includes(node.kind) || !Number.isInteger(node.x) || !Number.isInteger(node.y) || node.x < 0 || node.y < 0 || node.x >= level.width || node.y >= level.height || ids.has(node.id) || !node.id) throw new Error(`Invalid light node in level ${spec.id}`);
        const cell = node.y * level.width + node.x;
        if (level.byCell.has(cell)) throw new Error(`Overlapping light nodes in level ${spec.id}`);
        ids.add(node.id); level.byCell.set(cell, node);
        node.radix = node.kind === 'filter' ? 3 : 2;
        node.initial = node.initial ?? (node.kind === 'source' ? 1 : 0);
        node.control = -1;
        if (!Number.isInteger(node.initial) || node.initial < 0 || node.initial >= node.radix) throw new Error('Invalid initial control');
        if (['source','mirror','splitter','filter'].includes(node.kind) && !node.locked) {
            node.control = level.controls.length; level.controls.push(node); combinations *= node.radix;
        }
        if (node.kind === 'target') {
            if (!Number.isInteger(node.want) || !LIGHT_COLORS[node.want]) throw new Error('Invalid receiver color');
            level.targets.push(node);
        }
        if (node.kind === 'source') {
            if (!Number.isInteger(node.color) || node.color < 1 || node.color > 7 || !Number.isInteger(node.dir) || !LIGHT_DIRS[node.dir]) throw new Error('Invalid source');
            level.sources.push(node);
        }
    }
    if (!level.targets.some(t => t.want > 0) || !level.sources.length || combinations > 65536) throw new Error('Invalid puzzle size or missing goals');
    level.combinations = combinations; return level;
}
export const lightInitial = level => level.controls.map(n => n.initial);
export const nodeValue = (node, state) => node.control < 0 ? node.initial : state[node.control];
export function traceLight(level, state = lightInitial(level)) {
    if (state.length !== level.controls.length || state.some((v, i) => !Number.isInteger(v) || v < 0 || v >= level.controls[i].radix)) throw new Error('Invalid light state');
    const received = Object.fromEntries(level.targets.map(t => [t.id, 0])), rays = [], segments = new Map(), visited = new Set();
    let head = 0, activeSources = 0;
    const segment = (x1, y1, x2, y2, color) => {
        const a = `${x1},${y1}`, b = `${x2},${y2}`, key = a < b ? `${a}:${b}` : `${b}:${a}`;
        const existing = segments.get(key); if (existing) existing.color |= color;
        else segments.set(key, { x1, y1, x2, y2, color });
    };
    for (const source of level.sources) if (nodeValue(source, state)) {
        activeSources++; for (const bit of [1,2,4]) if (source.color & bit) rays.push({ x: source.x, y: source.y, dir: source.dir, color: bit });
    }
    while (head < rays.length) {
        const ray = rays[head++], d = LIGHT_DIRS[ray.dir], x = ray.x + d.x, y = ray.y + d.y;
        if (x < 0 || y < 0 || x >= level.width || y >= level.height) {
            segment(ray.x, ray.y, ray.x + d.x * .5, ray.y + d.y * .5, ray.color); continue;
        }
        segment(ray.x, ray.y, x, y, ray.color);
        const key = `${x},${y},${ray.dir},${ray.color}`; if (visited.has(key)) continue; visited.add(key);
        const node = level.byCell.get(y * level.width + x);
        if (node?.kind === 'target') { received[node.id] |= ray.color; continue; }
        if (node?.kind === 'wall' || node?.kind === 'source') continue;
        let dirs = [ray.dir];
        if (node?.kind === 'mirror') dirs = [reflected(ray.dir, nodeValue(node, state))];
        if (node?.kind === 'splitter') dirs.push(reflected(ray.dir, nodeValue(node, state)));
        if (node?.kind === 'filter' && !(FILTER_MASKS[nodeValue(node, state)] & ray.color)) continue;
        for (const dir of dirs) rays.push({ x, y, dir, color: ray.color });
    }
    const goals = level.targets.map(t => ({ id: t.id, want: t.want, got: received[t.id], ok: t.want === received[t.id] }));
    return { segments: [...segments.values()], received, goals, solved: goals.every(g => g.ok), visited: visited.size, activeSources };
}
export class LightSession {
    constructor(level) { this.level = level; this.state = lightInitial(level); this.moves = 0; this.history = []; this.hintsUsed = 0; this.tests = 0; this.finished = false; }
    turn(index) {
        if (this.finished || !Number.isInteger(index) || !this.level.controls[index]) return false;
        this.history.push([...this.state]); this.state = [...this.state]; this.state[index] = (this.state[index] + 1) % this.level.controls[index].radix; this.moves++; return true;
    }
    undo() { if (this.finished || !this.history.length) return false; this.state = this.history.pop(); this.moves--; return true; }
    evaluate() { return traceLight(this.level, this.state); }
    submit() { if (this.finished) return false; this.tests++; this.finished = this.evaluate().solved; return this.finished; }
    medals() { return [this.finished, this.finished && this.moves <= this.level.par, this.finished && this.hintsUsed === 0]; }
}
export function createLightSolver(level, current = lightInitial(level)) {
    let cursor = 0, status = 'searching', best = null, bestCost = Infinity;
    const start = [...current];
    return {
        get status() { return status; }, get best() { return best; }, get cost() { return bestCost; }, get checked() { return cursor; },
        tick(budget = 48) {
            if (status !== 'searching') return status;
            const end = Math.min(level.combinations, cursor + budget);
            while (cursor < end) {
                let encoded = cursor++, cost = 0;
                const state = level.controls.map((n, i) => { const v = encoded % n.radix; encoded = Math.floor(encoded / n.radix); cost += (v - start[i] + n.radix) % n.radix; return v; });
                if (cost >= bestCost) continue;
                if (traceLight(level, state).solved) { best = state; bestCost = cost; }
            }
            if (cursor === level.combinations) status = best ? 'solved' : 'no-solution';
            return status;
        }
    };
}
