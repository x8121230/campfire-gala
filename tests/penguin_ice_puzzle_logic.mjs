import assert from 'node:assert/strict';
import { PenguinPuzzleSession, ICE_PUZZLE_LEVELS, findIcePuzzleHint } from '../src/data/PenguinIcePuzzleData.js';

for (let level = 0; level < ICE_PUZZLE_LEVELS.length; level++) {
    const session = new PenguinPuzzleSession(level);
    let guard = 0;
    while (!session.complete() && guard++ < 100) {
        const direction = findIcePuzzleHint(session);
        assert.ok(direction, `level ${level + 1} must remain solvable`);
        assert.equal(session.move(direction).moved, true);
    }
    assert.equal(session.complete(), true, `level ${level + 1} should complete`);
}

const undoSession = new PenguinPuzzleSession(0);
const before = undoSession.snapshot();
undoSession.move('right');
assert.equal(undoSession.undo(), true);
assert.deepEqual(undoSession.snapshot(), before);
assert.equal(undoSession.undo(), false);

console.log('penguin_ice_puzzle_logic: 5 levels solved; undo/reset checks passed');
