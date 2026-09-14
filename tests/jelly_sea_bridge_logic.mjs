import assert from 'node:assert/strict';
import {JellySeaBridgeSession,JELLY_BRIDGE_LEVELS,FLOAT_STONES,buildStoneTray} from '../src/data/JellySeaBridgeData.js';

assert.equal(JELLY_BRIDGE_LEVELS.length,5);
assert.deepEqual(JELLY_BRIDGE_LEVELS.map(level=>level.sizes.length),[2,3,4,5,5]);
assert.deepEqual(JELLY_BRIDGE_LEVELS[3].sizes,['giant','large','medium','small','tiny']);
assert.ok(FLOAT_STONES.giant.width>FLOAT_STONES.large.width);
assert.ok(FLOAT_STONES.large.width>FLOAT_STONES.medium.width);
assert.ok(FLOAT_STONES.medium.width>FLOAT_STONES.small.width);
assert.ok(FLOAT_STONES.small.width>FLOAT_STONES.tiny.width);

for(const level of JELLY_BRIDGE_LEVELS){
    const tray=buildStoneTray(level,()=>0.31);
    assert.deepEqual([...tray].sort(),[...level.sizes].sort());
}

const session=new JellySeaBridgeSession(1,()=>0.42);
assert.equal(session.expected,'large');
assert.equal(session.place('small'),'retry');assert.equal(session.mistakes,1);
assert.equal(session.hint(),'large');assert.equal(session.hints,1);
assert.equal(session.place('large'),'placed');assert.equal(session.expected,'medium');
assert.equal(session.place('large'),'ignored');
assert.equal(session.place('medium'),'placed');assert.equal(session.place('small'),'complete');
assert.equal(session.complete,true);assert.equal(session.advance(),true);assert.equal(session.level.sizes.length,4);
session.reset();assert.equal(session.placed.length,0);assert.equal(session.resets,1);

console.log('jelly_sea_bridge_logic: five levels, strict descending order, retry, hint, advance and reset passed');
