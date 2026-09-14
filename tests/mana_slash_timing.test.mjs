import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DandelionHillsJourney, HILLS_COMBAT } from '../src/realm/DandelionHillsRules.js';
import { manaSlashPose } from '../src/realm/ManaSlashTiming.js';

function setup() {
  const j = new DandelionHillsJourney();
  const m = j.mobs[0];
  j.mobs.forEach((v) => { v.alive = v === m; });
  Object.assign(m, { x: j.player.x + 120, y: j.player.y, homeX: j.player.x + 120, homeY: j.player.y });
  return { j, m };
}
function advance(j, seconds, dt = .01) {
  for (let t = 0; t < seconds - 1e-9; t += dt) j.update(Math.min(dt, seconds - t));
}
test('傷害與劍刃接觸同時發生，後續收勢不重複傷害', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const { j, m } = setup();
    j.attack(); advance(j, .35, dt);
    assert.equal(m.hp, m.maxHp);
    assert(manaSlashPose(.35).swing < 1);
    advance(j, .02, dt);
    assert.equal(manaSlashPose(j.time).swing, 1);
    assert.equal(m.hp, m.maxHp - 1);
    advance(j, .6, dt);
    assert.equal(m.hp, m.maxHp - 1);
    assert.equal(j.activeSlash, null);
    assert(j.attackCooldown > 0, '動作已結束但冷卻仍保留');
    assert.equal(j.attack(), false);
    advance(j, .65, dt);
    assert.equal(j.attack(), true);
  }
});
test('以命中當下的位置判斷範圍，離開斬擊範圍可避開', () => {
  const { j, m } = setup(); j.attack();
  m.x = j.player.x + 350; m.homeX = m.x;
  advance(j, .4);
  assert.equal(m.hp, m.maxHp);
});
test('倒地回出生點會取消尚未發生的斬擊', () => {
  const { j, m } = setup(); j.attack(); j.hp = 1; j.invulnerable = 0;
  j.hurt(1, 'water', { x: j.player.x - 80, y: j.player.y });
  advance(j, .5);
  assert.equal(m.hp, m.maxHp); assert.equal(j.activeSlash, null);
});
test('收勢完成才恢復格擋，純視覺接觸停留不延長邏輯硬直', () => {
  const { j } = setup(); const source = { x: j.player.x + 100, y: j.player.y };
  j.attack(); advance(j, .89); assert.equal(j.canGuardFrom(source), false);
  advance(j, .02); assert.equal(j.canGuardFrom(source), true);
  assert.equal(manaSlashPose(HILLS_COMBAT.attackDuration).forward, 0);
  assert.equal(manaSlashPose(HILLS_COMBAT.attackDuration).tilt, 0);
});
test('範圍外的目標不強迫轉身，蓄力後面向快照保持固定', () => {
  const { j, m } = setup();
  m.x = j.player.x - 220; m.homeX = m.x; j.facing = { x: 1, y: 0 };
  j.attack(); assert.equal(j.activeSlash.dx, 1);
  j.facing = { x: -1, y: 0 }; advance(j, .4);
  assert.equal(m.hp, m.maxHp);
});
