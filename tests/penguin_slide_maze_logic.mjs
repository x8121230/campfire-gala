import assert from 'node:assert/strict';
import { PenguinSlideSession, PENGUIN_SLIDE_LEVELS, solveSlideMaze, slideFrom } from '../src/data/PenguinSlideMazeData.js';

const expectedLengths = [1, 2, 3, 4, 5];
PENGUIN_SLIDE_LEVELS.forEach((level, index) => {
    const solution = solveSlideMaze(level);
    assert.ok(solution, `level ${index + 1} should be solvable`);
    assert.equal(solution.length, expectedLengths[index]);
    let position = level.start;
    solution.forEach((direction, moveIndex) => {
        const result = slideFrom(level, position, direction);
        assert.equal(result.moved, true); position = result.position;
        if (moveIndex === solution.length - 1) assert.equal(result.reachedGoal, true);
    });
});

const session = new PenguinSlideSession(1);
const firstHint = session.hint(); assert.equal(firstHint, 'right');
assert.equal(session.move(firstHint).result, 'moved');
assert.equal(session.undo(), true); assert.deepEqual(session.position, session.level.start);
for (const direction of solveSlideMaze(session.level)) session.move(direction);
assert.equal(session.complete, true); assert.equal(session.advance(), true); assert.equal(session.levelIndex, 2);
console.log('penguin_slide_maze_logic: five solvable levels, slide, hint, undo and advance checks passed');
