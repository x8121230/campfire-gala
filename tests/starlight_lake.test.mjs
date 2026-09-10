import test from 'node:test';
import assert from 'node:assert/strict';
import {LAKE_KEY,LAKE_PLACES,LAKE_RIDDLES,MOON_PHASES,lakeState,updateLake,islandUnlocked,lakeLayout,moonNext} from '../src/data/StarlightLakeData.js';
test('湖畔新存檔獨立欄位，不改寶箱、衣櫃或錢包',()=>{
 const d={hearts:5,user_crystals:50,owned_items:['hat'],chest_rewards_v1:{queue:[{id:'old'}]}};
 const old=JSON.stringify(d),n=updateLake(d,'seal','meadow');assert.equal(JSON.stringify(d),old);
 assert.deepEqual(n.chest_rewards_v1,d.chest_rewards_v1);assert.equal(n.hearts,5);assert.equal(n.user_crystals,50);assert.deepEqual(n.owned_items,['hat']);
 assert.deepEqual(n[LAKE_KEY].seals,['meadow']);
});
test('三種星印缺一不可，重複解題不複製收藏',()=>{
 let d={};assert.throws(()=>updateLake(d,'moon'));
 for(const id of ['meadow','observatory','cave']){d=updateLake(d,'seal',id);d=updateLake(d,'seal',id);}
 assert.equal(lakeState(d).seals.length,3);assert(islandUnlocked(lakeState(d)));
 d=updateLake(updateLake(d,'moon'),'moon');assert.deepEqual(lakeState(d).collectibles,['moonstone']);assert.equal(lakeState(d).moonClears,2);
});
test('拜訪場所唯一且不等於完成謎題',()=>{
 let d={};for(const p of LAKE_PLACES){d=updateLake(updateLake(d,'visit',p.id),'visit',p.id);}
 assert.equal(lakeState(d).visited.length,6);assert.equal(lakeState(d).seals.length,0);assert(!islandUnlocked(lakeState(d)));
 assert.throws(()=>updateLake(d,'visit','invalid'));assert.throws(()=>updateLake(d,'seal','dock'));assert.throws(()=>updateLake(d,'delete'));
});
test('九題答案唯一且線索完整；月相涵蓋所有起點',()=>{
 for(const questions of Object.values(LAKE_RIDDLES)){assert.equal(questions.length,3);for(const q of questions){assert.equal(q.options.filter(o=>o===q.answer).length,1);assert(q.hint);}}
 for(let start=0;start<4;start++){const seq=[0,1,2].map(i=>MOON_PHASES[(start+i)%4]);assert.equal(moonNext(seq),MOON_PHASES[(start+3)%4]);}
});
for(const portrait of [false,true])test(`場所可點範圍無重疊、不越界（${portrait?'直向':'橫向'}）`,()=>{
 const l=lakeLayout(portrait);assert.equal(l.places.length,6);
 for(const a of l.places){assert(a.x-a.w/2>=0&&a.x+a.w/2<=l.width);assert(a.y-a.h/2>=88&&a.y+a.h/2<l.height-90);assert(a.h>=76);}
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=l.places[i],b=l.places[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2);}
});
test('存檔往返保持進度；拒絕不相容版本，不重設舊資料',()=>{
 let d=updateLake({},'seal','cave');assert.deepEqual(lakeState(JSON.parse(JSON.stringify(d))),lakeState(d));
 for(const bad of [null,[],{version:2},{version:1,seals:[]}])assert.throws(()=>lakeState({[LAKE_KEY]:bad}));
});
