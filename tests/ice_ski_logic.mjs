import assert from 'node:assert/strict';
import { SkiSession, SKI_CONFIG, skiStage } from '../src/data/IceSkiData.js';

const session = new SkiSession();
assert.equal(session.crystals, 0);
assert.equal(session.finished, false);
assert.equal(skiStage(0).label, '第 1 段・認識雪道');
assert.equal(skiStage(4).label, '第 2 段・冰晶山坡');
assert.equal(skiStage(8).label, '第 3 段・雪花終點');

session.laneChange();
session.jump();
session.bump();
assert.deepEqual([session.changedLane, session.jumps, session.bumped], [1, 1, 1]);
assert.equal(session.toggleSlow(), true);
assert.equal(session.toggleSlow(), false);

for (let i = 0; i < SKI_CONFIG.crystalsToFinish; i++) assert.equal(session.collect(), true);
assert.equal(session.crystals, 12);
assert.equal(session.finished, true);
assert.equal(session.collect(), false);
assert.equal(session.crystals, 12);

console.log('ice_ski_logic: 17 checks passed');
