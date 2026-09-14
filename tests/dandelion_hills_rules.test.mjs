import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DandelionHillsJourney, GATHER_NODES, HILLS_COMBAT, HILLS_PORTALS, HILLS_SCALE, hillsWalkable } from '../src/realm/DandelionHillsRules.js';

function tick(journey, seconds, axis = { x: 0, y: 0 }, attacking = false) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) journey.update(1 / 60, axis, attacking);
}

function collectAll(journey) {
  for (const drop of journey.loot) {
    drop.settled = true;
    drop.groundX = journey.player.x;
    drop.groundY = journey.player.y;
  }
  tick(journey, .3);
}

test('玩家、怪物、採集點與傳送錨點都位於可行走區', () => {
  const journey = new DandelionHillsJourney();
  assert.equal(hillsWalkable(journey.player.x, journey.player.y), true);
  for (const mob of journey.mobs) assert.equal(hillsWalkable(mob.x, mob.y), true, mob.type + ':' + mob.id);
  for (const node of GATHER_NODES) assert.equal(hillsWalkable(node.x, node.y), true, node.id);
  for (const portal of Object.values(HILLS_PORTALS)) assert.equal(hillsWalkable(portal.x, portal.y), true, portal.name);
  assert.equal(hillsWalkable(10, 10), false);
  assert.equal(hillsWalkable(340 * HILLS_SCALE, 150 * HILLS_SCALE), false, '深水不可進入');
});

test('出生點能經由可行走區抵達所有怪物、採集點與傳送錨點', () => {
  const journey = new DandelionHillsJourney();
  const step = 36;
  const key = (x, y) => `${Math.round(x / step)},${Math.round(y / step)}`;
  const queue = [{ x: journey.player.x, y: journey.player.y }];
  const visited = new Set([key(queue[0].x, queue[0].y)]);
  for (let i = 0; i < queue.length; i += 1) {
    const point = queue[i];
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      const id = key(next.x, next.y);
      if (!visited.has(id) && hillsWalkable(next.x, next.y)) { visited.add(id); queue.push(next); }
    }
  }
  const targets = [...journey.mobs, ...GATHER_NODES, ...Object.values(HILLS_PORTALS)];
  for (const target of targets) {
    assert(queue.some((point) => Math.hypot(point.x - target.x, point.y - target.y) < 36), `無法抵達 ${target.name || target.type}`);
  }
});

test('魔法斬自動轉向近身目標並在前方造成傷害', () => {
  const journey = new DandelionHillsJourney();
  const mouse = journey.mobs.find((mob) => mob.type === 'mouse');
  journey.mobs.filter((mob) => mob.id !== mouse.id).forEach((mob) => { mob.alive = false; });
  journey.player.x = mouse.x + 150; journey.player.y = mouse.y;
  assert.equal(journey.attack(), true);
  assert.equal(mouse.hp, mouse.maxHp - 1);
  assert.equal(mouse.flee > 0, true);
  assert.equal(journey.projectiles.length, 0);
  assert.equal(journey.effects.some((effect) => effect.kind === 'slash'), true);
  assert.equal(journey.attackWindow, HILLS_COMBAT.attackDuration);
  assert.equal(journey.mouseProgress, 1);
});

test('魔法斬只命中距離與扇形內的怪物', () => {
  const journey = new DandelionHillsJourney();
  journey.player = { x: 1000, y: 1000 };
  journey.facing = { x: 1, y: 0 };
  const front = journey.mobs[0], behind = journey.mobs[1], far = journey.mobs[2];
  Object.assign(front, { x: 1150, y: 1000 });
  Object.assign(behind, { x: 850, y: 1000 });
  Object.assign(far, { x: 1300, y: 1000 });
  journey.mobs.slice(3).forEach((mob) => { mob.alive = false; });
  journey.attack();
  assert.equal(front.hp, front.maxHp - 1);
  assert.equal(behind.hp, behind.maxHp);
  assert.equal(far.hp, far.maxHp);
});

test('正面攻擊可自動格擋並扣盾牌耐久，背面攻擊直接扣血', () => {
  const journey = new DandelionHillsJourney();
  journey.facing = { x: 1, y: 0 };
  assert.equal(journey.hurt(1, 'water', { x: journey.player.x + 80, y: journey.player.y }), 'blocked');
  assert.equal(journey.shieldDurability, 75);
  assert.equal(journey.hp, journey.maxHp);
  journey.invulnerable = 0;
  assert.equal(journey.hurt(1, 'water', { x: journey.player.x - 80, y: journey.player.y }), true);
  assert.equal(journey.hp, journey.maxHp - 1);
});

test('攻擊狀態無法防禦', () => {
  const journey = new DandelionHillsJourney();
  journey.facing = { x: 1, y: 0 };
  journey.attack();
  journey.invulnerable = 0;
  journey.hurt(1, 'water', { x: journey.player.x + 80, y: journey.player.y });
  assert.equal(journey.hp, journey.maxHp - 1);
  assert.equal(journey.shieldDurability, journey.shieldMax);
});

test('盾牌歸零會原地破防暈眩2秒，結束後恢復25耐久與保護', () => {
  const journey = new DandelionHillsJourney();
  journey.facing = { x: 1, y: 0 };
  journey.shieldDurability = 25;
  const start = { ...journey.player };
  assert.equal(journey.hurt(1, 'water', { x: journey.player.x + 80, y: journey.player.y }), 'blocked');
  assert.equal(journey.stunned, 2);
  journey.update(.05, { x: 1, y: 0 }, true);
  assert.deepEqual(journey.player, start);
  assert.equal(journey.attackWindow, 0);
  tick(journey, 2.1, { x: 0, y: 0 });
  assert.equal(journey.stunned, 0);
  assert.equal(journey.shieldDurability, 25);
  assert(journey.invulnerable > 0);
  assert.equal(journey.effects.some((effect) => effect.kind === 'guardRecover'), true);
});

test('波波鼠受擊會彈起逃跑，撞到障礙後短暫暈眩', () => {
  const journey = new DandelionHillsJourney();
  const mouse = journey.mobs.find((mob) => mob.type === 'mouse');
  journey.hitMob(mouse, 1);
  assert(mouse.float > 0);
  assert(mouse.flee > 0);
  journey.moveBody = () => false;
  journey.update(.02);
  assert(mouse.dizzy > 0);
});

test('MAIN_02 需驅趕六隻波波鼠並拾取四顆香脆橡果', () => {
  const journey = new DandelionHillsJourney();
  for (const mouse of journey.mobs.filter((mob) => mob.type === 'mouse')) journey.hitMob(mouse, 99);
  assert.equal(journey.mouseProgress, 6);
  assert.equal(journey.questStage, 0, '尚未拾取光團前不可完成');
  collectAll(journey);
  assert(journey.itemCount('香脆橡果') >= 4);
  assert.equal(journey.questStage, 1);
});

test('光團拋出後彈跳兩次、懸浮並進入磁吸拾取', () => {
  const journey = new DandelionHillsJourney();
  journey.player = { x: 1300 * HILLS_SCALE, y: 700 * HILLS_SCALE };
  journey.spawnLoot(1120 * HILLS_SCALE, 700 * HILLS_SCALE, '蓬鬆絨毛');
  const drop = journey.loot[0];
  assert.equal(drop.privateUntil, 15);
  assert.equal(drop.lifetime, 60);
  assert.equal(drop.personal, false);
  tick(journey, 2.2);
  assert.equal(drop.bounces, 2);
  assert.equal(drop.settled, true);
  journey.player = { x: drop.groundX + 60, y: drop.groundY };
  tick(journey, .6);
  assert.equal(journey.itemCount('蓬鬆絨毛'), 1);
  assert.equal(journey.tutorialLoot, true);
});

test('橡果迅捷珠會擴大光團磁吸半徑', () => {
  const journey = new DandelionHillsJourney({ v: 1, inventory: { 橡果迅捷珠: 1 } });
  assert.equal(journey.magnetRadius(), 134);
  journey.spawnLoot(journey.player.x - 120, journey.player.y, '蓬鬆絨毛');
  const drop = journey.loot[0]; drop.settled = true; drop.lift = 0;
  tick(journey, .8);
  assert.equal(journey.itemCount('蓬鬆絨毛'), 1);
});

test('露珠精靈受擊後以慢速水泡反擊', () => {
  const journey = new DandelionHillsJourney();
  const dew = journey.mobs.find((mob) => mob.type === 'dew');
  journey.player = { x: dew.x + 120, y: dew.y };
  journey.hitMob(dew, 1);
  dew.attack = 0;
  journey.update(.02);
  assert.equal(dew.aggro, true);
  assert.equal(journey.projectiles.some((shot) => shot.kind === 'water' && !shot.friendly), true);
});

test('採集草藥會驚動附近園藝鼴鼠，移動會中斷讀條', () => {
  const journey = new DandelionHillsJourney();
  const node = journey.gathers.find((item) => item.type === '晨曦蒲公英');
  journey.player = { x: node.x, y: node.y };
  assert.match(journey.interact().message, /開始採集/);
  assert.equal(journey.mobs.some((mob) => mob.type === 'mole' && mob.aggro), true);
  journey.update(.1, { x: 1, y: 0 });
  assert.equal(journey.gather, null);
});

test('MAIN_03 的星芽膠使用明黃任務光團並可完成', () => {
  const journey = new DandelionHillsJourney({ v: 1, questStage: 1, mouseProgress: 6, inventory: { 香脆橡果: 4 } });
  for (let i = 0; i < 5; i += 1) journey.spawnLoot(journey.player.x, journey.player.y, '純淨星芽膠', 'quest');
  assert(journey.loot.every((drop) => drop.rarity === 'quest'));
  assert(journey.loot.every((drop) => drop.personal), '任務光團必須是玩家各自獨立掉落');
  collectAll(journey);
  assert.equal(journey.itemCount('純淨星芽膠'), 5);
  assert.equal(journey.questStage, 2);
});

test('南瓜兔受擊後會撒出南瓜籽陷阱', () => {
  const journey = new DandelionHillsJourney();
  const rabbit = journey.mobs.find((mob) => mob.type === 'rabbit');
  journey.player = { x: rabbit.x + 100, y: rabbit.y };
  journey.hitMob(rabbit, 1); rabbit.attack = 0;
  journey.update(.02);
  assert.equal(journey.traps.length, 5);
});

test('南瓜兔擊敗時會爆出星藍靈珠與大量柔白光團', () => {
  const journey = new DandelionHillsJourney();
  const rabbit = journey.mobs.find((mob) => mob.type === 'rabbit');
  journey.hitMob(rabbit, 99);
  assert(journey.loot.some((drop) => drop.name === '蜜糖貪食珠' && drop.rarity === 'rare'));
  assert(journey.loot.filter((drop) => drop.rarity === 'common').length >= 8);
});

test('南側花環錨點可返回營地，北側出口維持鎖定', () => {
  const journey = new DandelionHillsJourney();
  journey.player = { x: HILLS_PORTALS.camp.x, y: HILLS_PORTALS.camp.y };
  assert.equal(journey.interact().travel, 'camp');
  journey.player = { x: HILLS_PORTALS.forest.x, y: HILLS_PORTALS.forest.y };
  const locked = journey.interact();
  assert.equal(locked.travel, undefined);
  assert.match(locked.title, /尚未開放/);
});

test('存檔只接受 v1 並限制任務數值', () => {
  const journey = new DandelionHillsJourney({ v: 1, questStage: 99, mouseProgress: 99, inventory: { 香脆橡果: 8 }, tutorialLoot: 1, met: [1, 'bad'] });
  assert.equal(journey.questStage, 2);
  assert.equal(journey.mouseProgress, 6);
  assert.equal(journey.met.has('bad'), false);
  const legacy = new DandelionHillsJourney({ v: 2, questStage: 2 });
  assert.equal(legacy.questStage, 0);
});
