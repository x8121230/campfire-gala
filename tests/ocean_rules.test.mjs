import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OceanSession, makeOceanRounds, OCEAN_ITEMS, OCEAN_BINS } from '../src/data/OceanCleanupData.js';
import { MINI_GAME_CATALOG, getMiniGamesByCategory } from '../src/data/MiniGameCatalog.js';
import { BubbleSession, matchesBubble } from '../src/data/ColorBubbleData.js';
import { SnackSession } from '../src/data/AnimalSnackData.js';

const seeded = n => () => ((n = Math.imul(n, 1664525) + 1013904223 >>> 0) / 4294967296);
function solve(s) {
    for (let i = 0; i < s.round.items.length; i++) {
        if (!s.isTarget(i)) continue;
        const result = s.choose(i);
        if (result === 'sort') s.sort(OCEAN_ITEMS[s.round.items[i]].category);
    }
}
function at(index) { const s = new OceanSession(seeded(7)); while (s.index < index) { solve(s); s.advance(); } return s; }

test('200 seeded sessions: 2400 tasks are solvable, balanced, protect creatures and require exactly 15 pickups', () => {
    for (let seed = 1; seed <= 200; seed++) {
        const s = new OceanSession(seeded(seed));
        assert.equal(s.rounds.length, 12);
        for (let n = 0; n < 12; n++) {
            const r = s.round;
            assert.equal(r.stage, ['rescue', 'sort', 'mission'][Math.floor(n / 4)]);
            assert.equal(r.items.filter((_, i) => s.isTarget(i)).length, r.count);
            assert(r.items.some(id => !OCEAN_ITEMS[id].category));
            if (r.stage === 'mission') assert.equal(r.items.filter(id => OCEAN_ITEMS[id].category && id !== r.target).length, 1);
            solve(s); assert(s.solved); s.advance();
        }
        assert(s.done); assert.equal(s.collected, 15); assert.equal(s.completed, 12);
        for (let start = 0; start < 12; start += 4) assert.equal(new Set(s.rounds.slice(start, start + 3).map(r => r.target)).size, 3);
    }
});
test('protected animals are never caught and repeated wrong taps count once', () => {
    const s = at(0), i = s.round.items.indexOf('fish');
    assert.equal(s.choose(i), 'protected'); assert.equal(s.choose(i), 'ignored');
    assert.equal(s.collected, 0); assert.equal(s.wrong, 1); solve(s); assert(s.solved);
});
test('invalid indices, bins and early advances cannot change progress', () => {
    const s = at(0);
    for (const i of [-1, 100, NaN, 1.5, '1', undefined]) assert.equal(s.choose(i), 'ignored');
    assert.equal(s.sort('plastic'), 'ignored'); assert.equal(s.advance(), false); assert.equal(s.index, 0);
});
test('sorting captures once, waits for bin, rejects wrong bin once then accepts correct bin', () => {
    const s = at(4), i = s.round.items.findIndex((_, i) => s.isTarget(i));
    const category = OCEAN_ITEMS[s.round.items[i]].category;
    assert.equal(s.choose(i), 'sort'); assert.equal(s.choose(i), 'ignored'); assert.equal(s.collected, 4);
    const wrong = OCEAN_BINS.find(b => b.id !== category).id;
    assert.equal(s.sort(wrong), 'wrong-bin'); assert.equal(s.sort(wrong), 'ignored');
    assert.equal(s.sort('unknown'), 'ignored'); assert.equal(s.pending, i);
    assert.equal(s.sort(category), 'complete'); assert.equal(s.sort(category), 'ignored'); assert.equal(s.collected, 5);
});
test('two-object missions reject other trash and cannot count one item twice', () => {
    const s = at(9), wrong = s.round.items.findIndex(id => OCEAN_ITEMS[id].category && id !== s.round.target);
    assert.equal(s.choose(wrong), 'other-trash'); assert.equal(s.collected, 9);
    const targets = s.round.items.map((_, i) => i).filter(i => s.isTarget(i));
    assert.equal(s.choose(targets[0]), 'collected'); assert.equal(s.choose(targets[0]), 'ignored');
    assert.equal(s.advance(), false); assert.equal(s.choose(targets[1]), 'complete'); assert.equal(s.collected, 11);
});
test('hint counts once per task and returns remaining targets only', () => {
    const s = at(9); const targets = s.hint(); assert.equal(targets.length, 2);
    s.choose(targets[0]); assert.deepEqual(s.hint(), [targets[1]]); assert.equal(s.hints, 1);
    s.choose(targets[1]); assert.deepEqual(s.hint(), []); s.advance(); s.hint(); assert.equal(s.hints, 2);
});
test('new task resets wrong choices, hints and pending state; completion cannot overflow', () => {
    const s = at(11); solve(s);
    for (let n = 0; n < 5; n++) { assert.equal(s.advance(), false); assert.equal(s.choose(0), 'ignored'); }
    assert.equal(s.completed, 12); assert.equal(s.index, 11);
    const t = at(1); assert.equal(t.rejected.size, 0); assert.equal(t.pending, null); assert.equal(t.hinted, false);
});
test('catalog includes ocean and mechanism games without duplicate entries', () => {
    assert.equal(MINI_GAME_CATALOG.length,23); assert.equal(new Set(MINI_GAME_CATALOG.map(g => g.id)).size,23);
    assert.equal(getMiniGamesByCategory('observation').length, 7);
    for (const id of ['animal_snack', 'color_bubble', 'ocean_cleanup']) assert(MINI_GAME_CATALOG.some(g => g.id === id));
    const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
    assert.match(main, /import OceanCleanupGame from/); assert.match(main, /\n        OceanCleanupGame,/);
});
test('new scene and rules contain no formal progress writes or external requests', () => {
    for (const path of ['../src/scenes/OceanCleanupGame.js', '../src/data/OceanCleanupData.js']) {
        const source = readFileSync(new URL(path, import.meta.url), 'utf8');
        assert.doesNotMatch(source, /localStorage|sessionStorage|registry\.set|SaveSystem|fetch\(|XMLHttpRequest|unlockAchievement|grantReward/);
    }
});
test('previous bubble rules: all 12 tasks still have exactly one answer for 80 seeds', () => {
    for (let seed = 0; seed < 80; seed++) {
        const s = new BubbleSession(seeded(seed));
        for (let i = 0; i < 12; i++) {
            const r = s.round, targets = r.choices.map((c, i) => matchesBubble(r.target, c, r.mode) ? i : -1).filter(i => i >= 0);
            assert.equal(targets.length, 1); assert.equal(s.answer(targets[0]), 'correct'); s.advance();
        }
        assert(s.done);
    }
});
test('previous snack rules: a missed guest returns and 12 correct deliveries finish the session', () => {
    const s = new SnackSession(seeded(11)); s.miss(); s.next();
    while (!s.done) { s.deliver(s.guest.food); s.next(); }
    assert.equal(s.served, 12); assert.equal(s.missed, 1);
});
