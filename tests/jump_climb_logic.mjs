import assert from 'node:assert/strict';
import {JumpClimbSession,JUMP_CLIMB_LEVELS} from '../src/data/JumpClimbData.js';

assert.equal(JUMP_CLIMB_LEVELS.length,5);
assert.deepEqual(JUMP_CLIMB_LEVELS.map(level=>level.powers.length),[2,3,3,4,4]);
assert.ok(JUMP_CLIMB_LEVELS[0].tolerance>JUMP_CLIMB_LEVELS[4].tolerance);

const session=new JumpClimbSession();
assert.ok(Math.abs(session.safeRange.min-.1)<1e-9);assert.equal(session.safeRange.max,.6);assert.equal(session.safeRange.center,.35);
assert.equal(session.jump(.05).result,'retry_low');
assert.equal(session.jump(.95).result,'retry_high');
assert.equal(session.rescues,2);assert.equal(session.step,0);
assert.equal(session.hint().center,.35);assert.equal(session.hints,1);
assert.equal(session.jump(.35).result,'landed');assert.equal(session.step,1);
assert.equal(session.jump(.45).result,'complete');assert.equal(session.complete,true);
assert.equal(session.jump(.45).result,'ignored');assert.equal(session.advance(),true);
assert.equal(session.level.powers.length,3);
session.reset();assert.equal(session.step,0);assert.equal(session.resets,1);

for(let levelIndex=0;levelIndex<JUMP_CLIMB_LEVELS.length;levelIndex+=1){
    const run=new JumpClimbSession(levelIndex);
    for(const power of run.level.powers)assert.ok(['landed','complete'].includes(run.jump(power).result));
    assert.equal(run.complete,true);
}

console.log('jump_climb_logic: five routes, widening progression, low/high rescue, hint, reset and completion passed');
