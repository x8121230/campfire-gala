import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MECHANISM_LEVELS } from '../src/data/ForestMechanismLevels.js';
import { parseLevel, initialState, transition, MechanismSession, createSolver, gemCount, platesFilled, cornerBoxes } from '../src/data/ForestMechanismRules.js';
import { MINI_GAME_CATALOG, getMiniGamesByCategory } from '../src/data/MiniGameCatalog.js';

const tiny = map => parseLevel({ id: 'test', map, par: 99 });
function solve(level, state = initialState(level), options) {
    const solver = createSolver(level, state, options);
    while (solver.status === 'searching') solver.tick(1000);
    return solver;
}

test('18 distinct authored maps all reach exit with every crystal; target moves are attainable', () => {
    assert.equal(MECHANISM_LEVELS.length, 18); assert.equal(new Set(MECHANISM_LEVELS.map(l => l.map.join(''))).size, 18);
    for (const spec of MECHANISM_LEVELS) {
        const l = parseLevel(spec), solver = solve(l), session = new MechanismSession(l);
        assert.equal(solver.status, 'solved', `level ${spec.id}`); assert(solver.path.length <= l.par);
        const before = JSON.stringify(session.state);
        for (const d of solver.path) assert(session.move(d).ok, `${spec.id}: ${d}`);
        assert(session.won); assert.equal(session.state.gems, l.allGems); assert.deepEqual(session.medals(), [true, true, true]);
        assert.equal(session.move('left').ok, false, 'finished state must be terminal');
        for (let n = 0; n < solver.path.length; n++) assert(session.undo());
        assert.equal(JSON.stringify(session.state), before); assert.equal(session.moves, 0); assert.equal(session.pushes, 0);
    }
});
test('map validator rejects inconsistent sizes, missing spawn, unmatched crates and portal pairs', () => {
    for (const map of [['###','#@E#'],['#####','#..E#','#####'],['#####','#@$E#','#####'],['#####','#@TE#','#####']]) assert.throws(() => tiny(map));
});
test('walls, out-of-bounds and illegal pushes never mutate state or increment moves', () => {
    const s = new MechanismSession(tiny(['#######','#@$$pp#','#....E#','#######']));
    const before = JSON.stringify(s.state);
    assert.equal(s.move('up').ok, false); assert.equal(s.move('right').ok, false); assert.equal(s.move('wrong').ok, false);
    assert.equal(JSON.stringify(s.state), before); assert.equal(s.moves, 0); assert.equal(s.history.length, 0);
    const border = new MechanismSession(tiny(['@.E'])); assert.equal(border.move('left').ok, false);
});
test('crate reaches plate, opens gate and re-closes after an undo', () => {
    const s = new MechanismSession(tiny(['########','#@$pG.E#','#......#','########']));
    assert(!platesFilled(s.level, s.state)); assert(s.move('right').ok); assert(platesFilled(s.level, s.state));
    assert(s.undo()); assert(!platesFilled(s.level, s.state)); assert.equal(s.state.boxes[0], 10);
});
test('key is required, remains after passing door, and undo restores collection', () => {
    const s = new MechanismSession(tiny(['#######','#@KD.E#','#######']));
    const locked = { ...s.state, player: 9 }; assert.equal(transition(s.level, locked, 'right').ok, false);
    assert(s.move('right').ok); assert(s.state.key); assert(s.move('right').ok); assert(s.state.key);
    s.undo(); s.undo(); assert(!s.state.key);
});
test('stepping onto switch toggles bridge each time; undo restores both position and bridge', () => {
    const s = new MechanismSession(tiny(['#######','#@SB.E#','#.....#','#######']));
    assert(s.move('right').ok); assert(s.state.bridge); assert(s.move('right').ok);
    assert(s.move('left').ok); assert(!s.state.bridge); assert.equal(s.move('right').ok, false);
    s.undo(); assert(s.state.bridge); assert.equal(s.state.player, 10);
});
test('portals transfer once, count as one move, and reverse with undo', () => {
    const s = new MechanismSession(tiny(['#########','#@T#T..E#','#########']));
    assert(s.move('right').ok); assert.equal(s.state.player, 13); assert.equal(s.moves, 1);
    assert(s.move('right').ok); assert(s.move('left').ok); assert.equal(s.state.player, 11);
    s.undo(); s.undo(); s.undo(); assert.equal(s.state.player, s.level.start);
});
test('crystals are optional for exit but required for exploration star', () => {
    const s = new MechanismSession(tiny(['#######','#@.E.c#','#######']));
    s.move('right'); s.move('right'); assert(s.won); assert.equal(gemCount(s.state), 0); assert.deepEqual(s.medals(), [true, false, true]);
});
test('gem pickup is restored by undo and hint use cannot be undone for efficiency star', () => {
    const s = new MechanismSession(tiny(['######','#@c.E#','######']));
    s.move('right'); assert.equal(gemCount(s.state), 1); s.undo(); assert.equal(gemCount(s.state), 0);
    s.hintsUsed = 1; s.move('right'); s.move('right'); s.move('right'); assert.deepEqual(s.medals(), [true, true, false]);
});
test('corner crate reports a recoverable deadlock and can be undone', () => {
    const s = new MechanismSession(tiny(['#######','#..$@.#','#p...E#','#######']));
    s.move('left'); const step = s.move('left'); assert(step.events.includes('corner')); assert.equal(cornerBoxes(s.level, s.state).length, 1);
    assert.equal(solve(s.level, s.state).status, 'no-solution'); s.undo(); assert.equal(cornerBoxes(s.level, s.state).length, 0);
});
test('hint solver distinguishes exhausted search from a search budget limit', () => {
    const impossible = tiny(['#######','#@#..E#','#######']); assert.equal(solve(impossible).status, 'no-solution');
    const limited = solve(parseLevel(MECHANISM_LEVELS[14]), undefined, { limit: 2 }); assert.equal(limited.status, 'limit');
});
test('solver uses current state and does not change it; computed next step stays valid after detour', () => {
    const l = parseLevel(MECHANISM_LEVELS[13]), session = new MechanismSession(l), original = solve(l);
    for (const d of original.path.slice(0, 9)) session.move(d);
    session.undo(); const before = JSON.stringify(session.state), solver = solve(l, session.state);
    assert.equal(JSON.stringify(session.state), before); assert.equal(solver.status, 'solved');
    for (const d of solver.path) assert(session.move(d).ok); assert(session.won);
});
test('crate cannot cover uncollected items, bridges, portals or exits', () => {
    const maps = [
        ['########','#@$c.pE#','########'],
        ['########','#@$B.pE#','#..S...#','########'],
        ['########','#@$T.pE#','#..T...#','########'],
        ['########','#@$E.p.#','########']
    ];
    for (const map of maps) { const s = new MechanismSession(tiny(map)); assert.equal(s.move('right').ok, false); }
});
test('catalog lists 23 games and retains mechanism in the four-game strategy category', () => {
    assert.equal(MINI_GAME_CATALOG.length,23); assert.equal(getMiniGamesByCategory('board').length, 4);
    for (const id of ['animal_snack','color_bubble','ocean_cleanup','forest_mechanism']) assert(MINI_GAME_CATALOG.some(g => g.id === id));
    const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'); assert.match(main, /import ForestMechanismGame from/); assert.match(main, /\n        ForestMechanismGame,/);
});
test('mechanism scene and rules contain no formal saves, external calls or reward changes', () => {
    for (const path of ['../src/data/ForestMechanismRules.js','../src/scenes/ForestMechanismGame.js']) {
        assert.doesNotMatch(readFileSync(new URL(path, import.meta.url), 'utf8'), /localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|unlockAchievement|grantReward/);
    }
});
