import assert from 'node:assert/strict';
import {PteroFossilSession,PTERO_FOSSIL_LEVELS,PTERO_PART_NAMES} from '../src/data/PteroFossilPuzzleData.js';

assert.equal(PTERO_FOSSIL_LEVELS.length,5);assert.deepEqual(PTERO_FOSSIL_LEVELS.map(l=>l.parts.length),[3,4,5,6,7]);assert.equal(PTERO_PART_NAMES.acorn,'硬果護甲');assert.equal(PTERO_PART_NAMES.rock,'岩石背甲');
const session=new PteroFossilSession();assert.equal(session.place('body','head'),'retry');assert.equal(session.mistakes,1);assert.equal(session.hint(),'body');assert.equal(session.place('body'),'placed');assert.equal(session.place('body'),'ignored');for(const id of session.level.parts.slice(1))session.place(id);assert.equal(session.complete,true);assert.equal(session.advance(),true);assert.equal(session.level.parts.length,4);session.reset();assert.equal(session.placed.size,0);assert.equal(session.resets,1);
console.log('ptero_fossil_puzzle_logic: five progressive walls, retry, hint, placement, advance and reset passed');
