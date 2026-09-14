import assert from 'node:assert/strict';
import { SnowballDefenseSession, SNOWBALL_CONFIG, snowballStage } from '../src/data/SnowballDefenseData.js';

const session = new SnowballDefenseSession();
assert.equal(snowballStage(0).from, 0);
assert.equal(snowballStage(5).from, 5);
assert.equal(snowballStage(10).from, 10);
for (let i = 1; i <= 5; i++) assert.equal(session.throwBall(), i === 5 ? 'big' : 'normal');
session.hit(true); session.hit(false); session.miss();
assert.deepEqual([session.defeated, session.hits, session.missed, session.combo], [1, 2, 1, 0]);
for (let i = 1; i < SNOWBALL_CONFIG.totalToFinish; i++) session.hit(true);
assert.equal(session.defeated, 15);
assert.equal(session.finished, true);
console.log('snowball_defense_logic: stage, big-ball, combo and finish checks passed');
