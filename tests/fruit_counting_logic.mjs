import assert from 'node:assert/strict';
import {COUNTING_FRUITS,FRUIT_COUNTING_LEVELS,FruitCountingSession,buildFruitCountingItems} from '../src/data/FruitCountingData.js';

assert.equal(COUNTING_FRUITS.length,4);
assert.equal(FRUIT_COUNTING_LEVELS.length,5);
assert.deepEqual(FRUIT_COUNTING_LEVELS.map(level=>level.target),[1,2,3,4,5]);

const items=buildFruitCountingItems(1);
assert.equal(items.filter(item=>item.fruit==='orange').length,2);
const session=new FruitCountingSession(1);
assert.equal(session.remaining,2);
assert.equal(session.choose(items.find(item=>item.fruit!=='orange')).result,'retry');
assert.equal(session.wrong,1);assert.equal(session.collected,0);
const hint=session.hint(items);assert.ok(hint);assert.equal(session.hints,1);
assert.equal(session.choose(items.find(item=>item.id===hint)).result,'correct');
assert.equal(session.remaining,1);
assert.equal(session.choose(items.find(item=>item.id===hint)).result,'ignored');
assert.equal(session.choose(items.find(item=>item.fruit==='orange'&&item.id!==hint)).result,'complete');
assert.equal(session.complete,true);assert.equal(session.advance(),true);

for(let levelIndex=0;levelIndex<FRUIT_COUNTING_LEVELS.length;levelIndex+=1){
    const run=new FruitCountingSession(levelIndex),board=buildFruitCountingItems(levelIndex);
    for(const item of board.filter(item=>item.fruit===run.level.fruit))assert.ok(['correct','complete'].includes(run.choose(item).result));
    assert.equal(run.complete,true);assert.equal(run.collected,run.level.target);
}

console.log('fruit_counting_logic: targets one-to-five, distractor retry, hint, duplicate guard and completion passed');
