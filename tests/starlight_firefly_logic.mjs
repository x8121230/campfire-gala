import assert from 'node:assert/strict';
import {FIREFLY_FRIENDS,STARLIGHT_FIREFLY_LEVELS,StarlightFireflySession} from '../src/data/StarlightFireflyData.js';

assert.equal(FIREFLY_FRIENDS.length,4);
assert.equal(STARLIGHT_FIREFLY_LEVELS.length,5);
assert.deepEqual(STARLIGHT_FIREFLY_LEVELS.map(level=>level.sequence.length),[2,3,3,4,5]);
assert.deepEqual(new StarlightFireflySession(2).answer,['gold','blue','mint']);

const session=new StarlightFireflySession();
assert.equal(session.nextId,'gold');
assert.equal(session.choose('blue').result,'retry');
assert.equal(session.step,0);assert.equal(session.mistakes,1);
assert.equal(session.hint(),'gold');assert.equal(session.hints,1);
assert.equal(session.choose('gold').result,'correct');
assert.equal(session.choose('mint').result,'complete');assert.equal(session.complete,true);
assert.equal(session.choose('mint').result,'ignored');
assert.equal(session.advance(),true);assert.equal(session.levelIndex,1);
assert.equal(session.replay(),true);assert.equal(session.replays,1);

for(let i=0;i<STARLIGHT_FIREFLY_LEVELS.length;i+=1){
    const run=new StarlightFireflySession(i);
    for(const id of run.answer)assert.ok(['correct','complete'].includes(run.choose(id).result));
    assert.equal(run.complete,true);
}

console.log('starlight_firefly_logic: forward/reverse sequences, retry, replay, hint and five-level completion passed');
