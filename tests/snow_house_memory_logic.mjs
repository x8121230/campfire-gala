import assert from 'node:assert/strict';
import { SnowHouseMemorySession, SNOW_HOUSE_LEVELS, buildSnowHouseBoard } from '../src/data/SnowHouseMemoryData.js';

for (const level of SNOW_HOUSE_LEVELS) {
    const board = buildSnowHouseBoard(level, () => .35);
    assert.equal(board.length, level.animals.length * 2);
    for (const animal of level.animals) assert.equal(board.filter((tile) => tile.animal === animal).length, 2);
}

const session = new SnowHouseMemorySession(0, () => .2);
const first = session.tiles[0];
assert.equal(session.choose(first.id).result, 'first');
assert.equal(session.choose(first.id).result, 'ignored');
const wrong = session.tiles.find((tile) => tile.animal !== first.animal);
const mismatch = session.choose(wrong.id);
assert.equal(mismatch.result, 'mismatch');
session.close(mismatch.ids);
assert.equal(session.mistakes, 1);
assert.ok(session.peek().length > 0);

while (!session.complete) {
    const open = session.tiles.filter((tile) => !tile.matched);
    const tile = open[0], mate = open.find((candidate) => candidate.id !== tile.id && candidate.animal === tile.animal);
    assert.equal(session.choose(tile.id).result, 'first');
    assert.equal(session.choose(mate.id).result, 'match');
}
assert.equal(session.advance(), true);
assert.equal(session.levelIndex, 1);
console.log('snow_house_memory_logic: boards, mismatch, hint, matching and advance checks passed');
