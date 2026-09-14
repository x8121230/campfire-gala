import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {ITEM_CATALOG,STARSPROUT_QUICK_ITEMS,defaultStarsproutInventory,normalizeStarsproutInventory,saveStarsproutInventory,loadStarsproutInventory} from '../src/realm/StarsproutInventory.js';
import {mentorReward,assignQuickItem,consumeItem,autoConsume} from '../src/realm/RealmQuickItemsV319.js';
import {RealmJourney,SPOTS} from '../src/realm/MentorCampRulesV319.js';
import {souvenirProgress,registerSouvenir} from '../src/realm/SouvenirProgression.js';
import {normalizeSkillResource,regenerateSkillResource,saveSkillResource,loadSkillResource} from '../src/realm/RealmSkillResource.js';
const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
test('fresh player has no skills; legacy automatic weapon is not a learned skill',()=>{assert.deepEqual(defaultStarsproutInventory().learnedSkills,[]);assert.deepEqual(normalizeStarsproutInventory({v:1,items:{'魔法劍':1,'魔法箭':1}}).items,{});});
test('mentor quest requires washing, awards slash and 3 apples once',()=>{
 const j=new RealmJourney();j.player={...SPOTS.bronc};assert(!j.act('bronc').win);j.player={...SPOTS.alden};j.act('alden');j.player={...SPOTS.washPool};j.act('washPool');j.player={...SPOTS.bronc};const result=j.act('bronc');assert.equal(result.reward,'mentorSlash');assert.equal(j.stage,3);assert.equal(j.robe,false);assert.equal(j.apples,0);assert(!j.act('bronc').win);
 let inv=mentorReward(defaultStarsproutInventory(),j.stage);assert.equal(inv.items['甜蘋果'],3);assert.deepEqual(inv.learnedSkills,['slash']);assert.equal(inv.quickSlots[0],'甜蘋果');inv=mentorReward(inv,3);assert.equal(inv.items['甜蘋果'],3);
});
test('old completed quest receives one migration grant without deleting existing materials',()=>{let s=mentorReward({v:1,items:{'香脆橡果':4,'甜蘋果':7},gold:25},3);assert.equal(s.items['甜蘋果'],10);s=mentorReward(normalizeStarsproutInventory(s),3);assert.equal(s.items['甜蘋果'],10);assert.equal(s.gold,25);assert.equal(s.items['香脆橡果'],4);});
test('apple requires a full missing HP, consumes exactly one and cannot revive',()=>{
 const s=mentorReward(defaultStarsproutInventory(),3),h={hp:3,maxHp:3};assert(!consumeItem(s,h,'甜蘋果').used);h.hp=2.5;assert(!consumeItem(s,h,'甜蘋果').used);h.hp=2;assert(consumeItem(s,h,'甜蘋果').used);assert.equal(h.hp,3);assert.equal(s.items['甜蘋果'],2);h.hp=0;assert(!consumeItem(s,h,'甜蘋果').used);h.hp=1;h.downed=true;assert(!consumeItem(s,h,'甜蘋果').used);
});
test('auto-use requires assigned slot, handles duplicate slots once, paces healing',()=>{
 const s=mentorReward(defaultStarsproutInventory(),3),h={hp:1,maxHp:3};s.quickSlots=['','','',''];assert(!autoConsume(s,h,.016));assert(assignQuickItem(s,3,'甜蘋果'));assert(assignQuickItem(s,0,'甜蘋果'));assert(autoConsume(s,h,.016));assert.equal(h.hp,2);assert.equal(s.items['甜蘋果'],2);assert(!autoConsume(s,h,.016));assert(autoConsume(s,h,.8));assert.equal(h.hp,3);assert.equal(s.items['甜蘋果'],1);assert(!autoConsume(s,h,1));
});
test('empty apple stack stays assigned and never reappears after save, reload or mentor visit',()=>{
 let s=mentorReward(defaultStarsproutInventory(),3);const h={hp:1,maxHp:3};for(let i=0;i<3;i++){h.hp=1;assert(consumeItem(s,h,'甜蘋果').used);}saveStarsproutInventory(s);s=mentorReward(loadStarsproutInventory(),3);assert.equal(s.items['甜蘋果'],undefined);assert.equal(s.quickSlots[0],'甜蘋果');assert(!consumeItem(s,h,'甜蘋果').used);
});
test('4 slots accept owned consumables only, remove without consuming',()=>{const s=mentorReward(defaultStarsproutInventory(),3);assert(!assignQuickItem(s,4,'甜蘋果'));assert(!assignQuickItem(s,0,'斬擊'));assert(assignQuickItem(s,0,''));assert.equal(s.items['甜蘋果'],3);assert.deepEqual(normalizeStarsproutInventory(s).quickSlots,['','','','']);});
test('five common equals two rare and one common; duplicate ID never scores twice',()=>{
 const a={souvenirs:{}},b={souvenirs:{}};for(let i=0;i<5;i++)registerSouvenir(a,'c'+i,'common');registerSouvenir(b,'r1','rare');registerSouvenir(b,'r2','rare');registerSouvenir(b,'c1','common');assert(!registerSouvenir(b,'r1','rare'));assert.equal(souvenirProgress(a.souvenirs).level,2);assert.equal(souvenirProgress(b.souvenirs).points,5);assert.equal(souvenirProgress(b.souvenirs).damage,2);assert.equal(souvenirProgress(b.souvenirs).needed,10);
});
test('cumulative thresholds 5/15/30/50/75 retain souvenirs and cycle four bonuses',()=>{
 const s={souvenirs:{}};const expected={5:[2,2,0,3,3],15:[3,2,1,3,3],30:[4,2,1,4,3],50:[5,2,1,4,4],75:[6,3,1,4,4]};for(let i=1;i<=75;i++){registerSouvenir(s,'souvenir_'+i,'common');if(expected[i]){const p=souvenirProgress(s.souvenirs);assert.deepEqual([p.level,p.damage,p.agility,p.maxHp,p.maxMana],expected[i]);}}assert.equal(Object.keys(s.souvenirs).length,75);
});
test('HP/SP survive map switch and SP regeneration respects increased maximum',()=>{const h=normalizeSkillResource({hp:2,maxHp:4,mana:3,maxMana:4});for(let i=0;i<100;i++)regenerateSkillResource(h,.05);assert.equal(h.mana,4);saveSkillResource(h);const loaded=loadSkillResource({maxHp:4,maxMana:4});assert.equal(loaded.hp,2);assert.equal(loaded.mana,4);});
test('actual combat methods gate unlearned slash and all arrow casting',()=>{
 const source=fs.readFileSync(new URL('../src/realm/DandelionHillsRules.js',import.meta.url),'utf8');const a=source.slice(source.indexOf('  attack() {'),source.indexOf('  resolveSlash()'));const Rules=new Function(`return class {${a}}`)();const r=new Rules();r.learnedSkills=[];assert.equal(r.attack(),false);r.mana=3;assert.equal(r.castMagicArrow(),false);assert.equal(r.mana,3);
});
test('actual camp and hills use/save methods share depleted inventory without restoring apples',()=>{
 const deps={ITEM_CATALOG,STARSPROUT_QUICK_ITEMS,mentorReward,consumeItem,saveSkillResource,saveStarsproutInventory};
 function appClass(name){let source=fs.readFileSync(new URL('../src/realm/'+name+'.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class');return new Function(...Object.keys(deps),source+'\nreturn '+name+';')(...Object.values(deps));}
 const Hill=appClass('DandelionHillsApp'),Camp=appClass('RealmApp');
 const inv=mentorReward(defaultStarsproutInventory(),3);const hills=Object.create(Hill.prototype);hills.inventoryState=inv;hills.journey={hp:2,maxHp:3,mana:3,maxMana:3,inventory:inv.items,questStage:0,export(){return {v:1,inventory:this.inventory};}};hills.notify=()=>{};hills.hud=()=>{};
 assert(hills.useInventoryItem('甜蘋果').used);assert.equal(hills.inventoryState.items['甜蘋果'],2);assert.equal(hills.journey.inventory,hills.inventoryState.items);
 const camp=Object.create(Camp.prototype);camp.inventoryState=loadStarsproutInventory();camp.skillResource=loadSkillResource();camp.journey={stage:3,export(){return {v:2,stage:3};}};camp.notify=()=>{};camp.hud=()=>{};camp.save();assert.equal(loadStarsproutInventory().items['甜蘋果'],2);camp.skillResource.hp=2;assert(camp.useInventoryItem('甜蘋果').used);assert.equal(loadStarsproutInventory().items['甜蘋果'],1);
});
