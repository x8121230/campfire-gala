import assert from 'node:assert/strict';
import {CloudGlideSession,CLOUD_GLIDE_CONFIG,CLOUD_GLIDE_PHASES} from '../src/data/CloudGlideData.js';

assert.equal(CLOUD_GLIDE_CONFIG.targetRings,12);
assert.equal(CLOUD_GLIDE_PHASES.length,3);
assert.deepEqual(CLOUD_GLIDE_PHASES.map(phase=>[phase.from,phase.to]),[[0,3],[4,7],[8,11]]);

const session=new CloudGlideSession();
assert.equal(session.phaseIndex,0);assert.equal(session.phase.name,'認識順風圈');
assert.equal(session.missRing(),true);assert.equal(session.missed,1);assert.equal(session.rings,0);
assert.equal(session.bumpCloud(),true);assert.equal(session.cloudBumps,1);
assert.equal(session.hint(),true);assert.equal(session.hints,1);
for(let i=0;i<4;i+=1)assert.equal(session.passRing(),'passed');
assert.equal(session.phaseIndex,1);assert.equal(session.rings,4);assert.equal(session.stars,4);
for(let i=4;i<8;i+=1)session.passRing();
assert.equal(session.phaseIndex,2);
for(let i=8;i<11;i+=1)assert.equal(session.passRing(),'passed');
assert.equal(session.passRing(),'complete');assert.equal(session.complete,true);assert.equal(session.stars,12);
assert.equal(session.passRing(),'ignored');assert.equal(session.missRing(),false);

console.log('cloud_glide_logic: three phases, safe misses, cloud bumps, hints and twelve-ring completion passed');
