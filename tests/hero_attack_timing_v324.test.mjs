import test from 'node:test';import assert from 'node:assert/strict';
import {MANA_SLASH,manaSlashPose,slashLocks} from '../src/realm/ManaSlashTiming.js';
import {HeroMovementAnimator} from '../src/realm/HeroMovementAnimator.js';
import {MOVEMENT_PROFILES,movementProfile,movementProfileId} from '../src/realm/RealmMovementProfilesV325.js';
test('斬擊命中、移動與防禦解鎖使用同一時間軸',()=>{
 assert.equal(MANA_SLASH.impact,.20);assert.equal(MANA_SLASH.moveUnlock,.32);assert.equal(MANA_SLASH.cooldown,.45);
 assert.deepEqual(slashLocks(.19),{movement:true,guard:true,attack:true});
 assert.deepEqual(slashLocks(.32),{movement:false,guard:true,attack:true});
 assert.deepEqual(slashLocks(.45),{movement:false,guard:false,attack:false});
});
test('四個攻擊影格依蓄力、下劈、觸地、收招排列',()=>{assert.deepEqual([.02,.14,.21,.36].map(t=>manaSlashPose(t).frame),[0,1,2,3]);assert.equal(manaSlashPose(.45),null)});
test('50ms命中停頓只凍結畫面姿勢',()=>{const a=manaSlashPose(.20),b=manaSlashPose(.24);assert(a.hitStop&&b.hitStop);assert.equal(a.swing,b.swing);assert.equal(a.forward,b.forward);assert.equal(manaSlashPose(.25).hitStop,false)});
test('收招刀光淡出且0.32秒後仍保留至0.45秒',()=>{const a=manaSlashPose(.32),b=manaSlashPose(.44);assert.equal(a.frame,3);assert(a.bladeAlpha>b.bladeAlpha);assert(b.bladeAlpha>0)});
test('小碎步以225移速對齊10FPS，悠閒漫步以210移速對齊9.5FPS',()=>{const sprout=new HeroMovementAnimator();for(let i=0;i<20;i++)sprout.update(.05,{x:1,y:0},true,225,MOVEMENT_PROFILES.sprout);assert(Math.abs(sprout.walkClock-10)<1e-9);const stroll=new HeroMovementAnimator();for(let i=0;i<20;i++)stroll.update(.05,{x:1,y:0},true,210,MOVEMENT_PROFILES.stroll);assert(Math.abs(stroll.walkClock-9.5)<1e-9);const fast=new HeroMovementAnimator();for(let i=0;i<20;i++)fast.update(.05,{x:1,y:0},true,999,MOVEMENT_PROFILES.stroll);assert(Math.abs(fast.walkClock-12)<1e-9)});
test('QM模式只接受已定義的兩種手感，未知值回到小碎步',()=>{assert.equal(movementProfileId('stroll'),'stroll');assert.equal(movementProfileId('anything'),'sprout');assert.equal(movementProfile('anything').walkSpeed,225)});
