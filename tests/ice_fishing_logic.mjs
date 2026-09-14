import assert from 'node:assert/strict';
import { IceFishingSession, FISHING_TASKS, buildFishSchool } from '../src/data/IceFishingData.js';

const session = new IceFishingSession();
assert.equal(session.answer('wrong-color').result, 'wrong');
assert.equal(session.wrong, 1);
assert.equal(session.hint(), FISHING_TASKS[0].color);
assert.equal(session.hints, 1);

for (const task of FISHING_TASKS) {
    assert.equal(session.task, task);
    const school = buildFishSchool(task, () => .25);
    assert.equal(school.length, 6);
    assert.ok(school.filter((color) => color === task.color).length >= task.count);
    for (let i = 0; i < task.count; i += 1) {
        const result = session.answer(task.color);
        assert.equal(result.result, 'correct');
        assert.equal(result.taskComplete, i === task.count - 1);
    }
    assert.equal(session.advance(), true);
}

assert.equal(session.finished, true);
assert.equal(session.totalCaught, FISHING_TASKS.reduce((sum, task) => sum + task.count, 0));
assert.equal(session.answer('red').result, 'ignored');

console.log('ice_fishing_logic: ok');
