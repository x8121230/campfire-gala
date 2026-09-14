import assert from 'node:assert/strict';
import {HotSpringCapybaraSession,HOT_SPRING_LEVELS,CAPYBARA_STYLES,buildHotSpringBoard} from '../src/data/HotSpringCapybaraData.js';

assert.equal(HOT_SPRING_LEVELS.length,5);
assert.deepEqual(HOT_SPRING_LEVELS.map(level=>level.poolCount),[3,3,4,5,6]);
assert.deepEqual(HOT_SPRING_LEVELS.map(level=>level.capyCount),[1,2,3,4,5]);
assert.equal(Object.keys(CAPYBARA_STYLES).length,5);

for(const level of HOT_SPRING_LEVELS){
    for(const target of level.targets){
        const board=buildHotSpringBoard(level,target,()=>0.37);
        assert.equal(board.length,level.poolCount);
        assert.equal(board.filter(tile=>tile.style!==null).length,level.capyCount);
        assert.equal(board.filter(tile=>tile.style===target).length,1);
    }
}

const session=new HotSpringCapybaraSession(1,()=>0.42);
assert.equal(session.preview(),true);assert.equal(session.previews,1);
const answer=session.board.find(tile=>tile.style===session.target).id;
const wrong=session.board.find(tile=>tile.id!==answer).id;
assert.equal(session.choose(wrong).result,'retry');assert.equal(session.totalMistakes,1);
assert.equal(session.hint(),answer);assert.equal(session.hints,1);
assert.equal(session.choose(answer).result,'correct');assert.equal(session.nextRound(),true);
while(!session.complete){const id=session.board.find(tile=>tile.style===session.target).id;const result=session.choose(id);if(result.result==='correct')session.nextRound();}
assert.equal(session.totalCorrect,3);assert.equal(session.advance(),true);assert.equal(session.level.poolCount,4);

console.log('hot_spring_capybara_logic: five levels, unique targets, retry, hint, rounds and advance passed');
