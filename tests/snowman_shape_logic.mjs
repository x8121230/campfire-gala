import assert from 'node:assert/strict';
import { SnowmanShapeSession, SNOWMAN_LEVELS } from '../src/data/SnowmanShapeData.js';

for(let level=0;level<SNOWMAN_LEVELS.length;level++){
    const session=new SnowmanShapeSession(level);
    session.level.pieces.forEach((piece,index)=>assert.equal(session.place(piece.id,index%2?'tap':'drag'),true));
    assert.equal(session.complete,true);
    assert.equal(session.placed.size,session.level.pieces.length);
}
const retry=new SnowmanShapeSession(0);retry.mistake();assert.equal(retry.mistakes,1);assert.ok(retry.hint());
console.log('snowman_shape_logic: five levels, tap, drag, retry and hint checks passed');
