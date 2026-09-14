import assert from 'node:assert/strict';
import {VolcanoGemCartSession,GEM_CART_LEVELS,GEM_COLORS} from '../src/data/VolcanoGemCartData.js';

assert.equal(GEM_CART_LEVELS.length,5);
assert.deepEqual(Object.keys(GEM_COLORS),['red','yellow','blue']);
assert.deepEqual(GEM_CART_LEVELS.map(level=>level.order.length),[3,4,5,6,7]);
assert.deepEqual(GEM_CART_LEVELS.map(level=>level.active.length),[1,2,3,3,3]);

const session=new VolcanoGemCartSession();
assert.equal(session.currentColor,'red');
assert.equal(session.classify('blue'),'retry');
assert.equal(session.mistakes,1);
assert.equal(session.returnGem(),true);
assert.equal(session.returns,1);
assert.equal(session.hint(),'red');
assert.equal(session.hints,1);
assert.equal(session.index,0);
assert.equal(session.classify('red'),'correct');
assert.equal(session.classify('red'),'correct');
assert.equal(session.classify('red'),'complete');
assert.equal(session.complete,true);
assert.equal(session.classify('red'),'ignored');
assert.equal(session.advance(),true);
assert.equal(session.level.active.length,2);
assert.equal(session.sorted,0);

console.log('volcano_gem_cart_logic: five levels, color retry, safe return, hint, completion and advance passed');
