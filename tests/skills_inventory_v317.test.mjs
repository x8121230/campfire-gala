import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DandelionHillsJourney, hillsWalkable } from '../src/realm/DandelionHillsRules.js';
import { defaultStarsproutInventory, normalizeStarsproutInventory, mergeStarsproutItems, sortedStarsproutItems, itemArtURL } from '../src/realm/StarsproutInventory.js';
import { existsSync } from 'node:fs';
function setup(){const j=new DandelionHillsJourney();j.mobs=[];j.facing={x:-1,y:0};return j;}
function advance(j,s){for(let t=0;t<s-1e-8;t+=.01)j.update(Math.min(.01,s-t));}
test('舊存檔換成單一魔法劍，保留素材、金幣、任務靈珠與容量',()=>{
 const s=normalizeStarsproutInventory({v:1,capacity:36,gold:128,items:{'星光吹泡泡棒':1,'橡果小木蓋':1,'草莓棉拖鞋':1,'香脆橡果':17,'微光星芽珠':1},beads:['微光星芽珠','',''],unlockedBeadSlots:2});
 assert.deepEqual(sortedStarsproutItems(s,'equipment').map(v=>v.name),['魔法劍']); assert.equal(s.items['香脆橡果'],17);assert.equal(s.gold,128);assert.equal(s.capacity,36);assert.equal(s.beads[0],'微光星芽珠');assert.equal(s.retiredEquipment['草莓棉拖鞋'],1);
 assert.deepEqual(normalizeStarsproutInventory(s),s);
 assert(!mergeStarsproutItems(s,{'星芽旅行者套裝':1}).items['星芽旅行者套裝']);
});
test('所有現有道具對應實際美術檔案',()=>{for(const i of sortedStarsproutItems(defaultStarsproutInventory()))assert(existsSync(new URL(itemArtURL(i.name))));for(const name of ['魔法箭','純淨星芽膠','蓬鬆絨毛','晨曦露水'])assert(existsSync(new URL(itemArtURL(name))));});
test('SP 0 可揮劍；魔法箭扣 1 SP 且共用 CD，禁止連射繞過 CD',()=>{
 const j=setup();j.mana=0;assert(j.attack());assert.equal(j.mana,0);advance(j,2);j.mana=3;assert(j.castMagicArrow());assert.equal(j.mana,2);assert.equal(j.projectiles.length,1);assert.equal(j.castMagicArrow(),false);assert.equal(j.attack(),false);assert.equal(j.mana,2);
});
test('SP 不足、暈眩及倒地不能施放，也不產生箭',()=>{
 for(const state of [{mana:0},{stunned:2},{downed:true}]){const j=setup();Object.assign(j,state);const sp=j.mana;assert.equal(j.castMagicArrow(),false);assert.equal(j.mana,sp);assert.equal(j.projectiles.length,0);}
});
test('每 5 秒回復 1 SP，上限 3；滿魔不預存回復時間',()=>{
 const j=setup();j.mana=0;advance(j,4.99);assert.equal(j.mana,0);advance(j,.01);assert.equal(j.mana,1);advance(j,10);assert.equal(j.mana,3);advance(j,10);assert.equal(j.spRegenElapsed,0);j.castMagicArrow();advance(j,4.9);assert.equal(j.mana,2);
});
test('倒地不回 SP；復活回滿且清除箭；保存讀取保留 SP',()=>{
 const j=setup();j.castMagicArrow();assert.equal(new DandelionHillsJourney(j.export()).mana,2);j.downed=true;advance(j,6);assert.equal(j.mana,2);assert(j.revive());assert.equal(j.mana,3);assert.equal(j.projectiles.length,0);
});
test('射箭硬直結束前不能移動或格擋',()=>{
 const j=setup(),p={...j.player};j.castMagicArrow();for(let i=0;i<40;i++)j.update(.01,{x:-1,y:0});assert.deepEqual(j.player,p);assert.equal(j.canGuardFrom({x:p.x-100,y:p.y}),false);advance(j,.06);assert.equal(j.canGuardFrom({x:p.x-100,y:p.y}),true);
});
test('箭沿面向飛行，僅命中第一個目標且不穿透；未命中到距離上限消散',()=>{
 const j=setup(),p=j.player;
 // Pick an open straight stretch near the arrival point.
 let direction;
 for(const d of [{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}])if(Array.from({length:30},(_,i)=>hillsWalkable(p.x+d.x*i*5,p.y+d.y*i*5,0)).every(Boolean)){direction=d;break;}
 assert(direction,'test fixture needs an open 150px ray');j.facing=direction;
 const a=j.makeMob(80,'mouse',p.x+direction.x*80,p.y+direction.y*80),b=j.makeMob(81,'mouse',p.x+direction.x*145,p.y+direction.y*145);j.mobs=[a,b];j.castMagicArrow();for(let i=0;i<30;i++)j.updateProjectiles(.01);assert.equal(a.hp,a.maxHp-1);assert.equal(b.hp,b.maxHp);assert.equal(j.projectiles.length,0);
 const empty=setup();empty.castMagicArrow();for(let i=0;i<150;i++)empty.updateProjectiles(.01);assert.equal(empty.projectiles.length,0);
});

test('营地與丘陵共用 SP 存取，跨場景延續回復進度', async()=>{
 const {loadSkillResource,saveSkillResource,regenerateSkillResource}=await import('../src/realm/RealmSkillResource.js');const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 saveSkillResource({mana:1,spRegenElapsed:4.95});const camp=loadSkillResource();assert(regenerateSkillResource(camp,.05));assert.equal(camp.mana,2);saveSkillResource(camp);const hills=loadSkillResource();assert.equal(hills.mana,2);assert.equal(hills.spRegenElapsed,0);delete globalThis.localStorage;
});
