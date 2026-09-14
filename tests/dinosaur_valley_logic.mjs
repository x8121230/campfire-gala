import assert from 'node:assert/strict';
import {DinosaurValleySession,DINOSAUR_RUN_CONFIG,DINOSAUR_RUN_PHASES} from '../src/data/DinosaurValleyData.js';

assert.equal(DINOSAUR_RUN_CONFIG.targetFriends,10);
assert.equal(DINOSAUR_RUN_PHASES.length,3);
assert.deepEqual(DINOSAUR_RUN_PHASES.map(phase=>[phase.from,phase.to]),[[0,2],[3,6],[7,9]]);

const session=new DinosaurValleySession();
assert.equal(session.phaseIndex,0);assert.equal(session.jump(),true);assert.equal(session.jumps,1);
assert.equal(session.collectEgg(),true);assert.equal(session.eggs,1);
assert.equal(session.collectFootprint(),true);assert.equal(session.footprints,1);
assert.equal(session.bumpObstacle(),true);assert.equal(session.bumps,1);
assert.equal(session.missFriend(),true);assert.equal(session.missedFriends,1);
assert.equal(session.hint(),true);assert.equal(session.hints,1);
for(let i=0;i<3;i+=1)assert.equal(session.meetFriend(),'met');
assert.equal(session.phaseIndex,1);
for(let i=3;i<7;i+=1)assert.equal(session.meetFriend(),'met');
assert.equal(session.phaseIndex,2);
for(let i=7;i<9;i+=1)assert.equal(session.meetFriend(),'met');
assert.equal(session.meetFriend(),'complete');assert.equal(session.complete,true);assert.equal(session.friends,10);
assert.equal(session.meetFriend(),'ignored');assert.equal(session.bumpObstacle(),false);assert.equal(session.jump(),false);

console.log('dinosaur_valley_logic: three phases, gentle obstacles, collections and ten-friend completion passed');
