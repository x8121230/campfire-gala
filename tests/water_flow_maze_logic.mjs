import assert from 'node:assert/strict';
import {WaterFlowMazeSession,WATER_FLOW_LEVELS,WATERWAY_TYPES,rotationMatches} from '../src/data/WaterFlowMazeData.js';

assert.equal(WATER_FLOW_LEVELS.length,5);
assert.deepEqual(WATER_FLOW_LEVELS.map(level=>level.pieces.length),[2,2,3,3,4]);
assert.equal(WATERWAY_TYPES.straight.connections.length,2);
assert.equal(WATERWAY_TYPES.corner.connections.length,4);
assert.equal(rotationMatches('straight',2,0),true);
assert.equal(rotationMatches('straight',1,0),false);
assert.equal(rotationMatches('corner',5,1),true);

const session=new WaterFlowMazeSession();
assert.equal(session.firstWrong(),0);
assert.equal(session.flow().result,'retry');assert.equal(session.tests,1);
assert.equal(session.hint(),0);assert.equal(session.hints,1);
assert.equal(session.rotate(0),'aligned');assert.equal(session.totalRotations,1);
assert.equal(session.flow().result,'complete');assert.equal(session.complete,true);
assert.equal(session.rotate(0),'ignored');assert.equal(session.advance(),true);
assert.equal(session.level.pieces.length,2);
session.reset();assert.equal(session.complete,false);assert.equal(session.resets,1);

for(let levelIndex=0;levelIndex<WATER_FLOW_LEVELS.length;levelIndex+=1){
    const run=new WaterFlowMazeSession(levelIndex);
    run.level.pieces.forEach((_piece,index)=>{let guard=0;while(!run.isCorrect(index)&&guard<4){run.rotate(index);guard+=1;}assert.ok(guard<4);});
    assert.equal(run.flow().result,'complete');
}

console.log('water_flow_maze_logic: five levels, symmetric rotations, retry, hint, reset and completion passed');
