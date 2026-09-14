import assert from 'node:assert/strict';
import {LavaBubblePopSession,LAVA_BUBBLE_CONFIG,bubbleStage,isRainbowBubble} from '../src/data/LavaBubblePopData.js';

assert.equal(bubbleStage(0),0);assert.equal(bubbleStage(8),1);assert.equal(bubbleStage(16),2);assert.equal(isRainbowBubble(5),false);assert.equal(isRainbowBubble(6),true);
const session=new LavaBubblePopSession();let rainbowSeen=0;for(let i=0;i<LAVA_BUBBLE_CONFIG.goal;i++){const spec=session.spawn();if(spec.rainbow)rainbowSeen+=1;const result=session.pop(spec.rainbow);if(i<LAVA_BUBBLE_CONFIG.goal-1)assert.notEqual(result,'complete');}
assert.equal(session.complete,true);assert.equal(session.popped,24);assert.equal(session.rainbows,4);assert.equal(rainbowSeen,4);assert.equal(session.pop(false),'ignored');assert.equal(session.escape(),'return');assert.equal(session.escaped,1);
const empty=new LavaBubblePopSession();const born=empty.emptyTap();assert.equal(empty.emptyTaps,1);assert.equal(born.serial,1);
console.log('lava_bubble_pop_logic: stages, rainbow cadence, no-fail return, empty tap and completion passed');
