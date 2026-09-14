import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RealmJourney, SPOTS, isWalkable } from '../src/realm/RealmRules.js';

test('北門中央通道不再被母樹與布告欄碰撞夾住', () => {
  for (let y = 800; y >= SPOTS.northGate.y; y -= 16) {
    assert.equal(isWalkable(1900, y), true, `北門通道 y=${y} 必須可走`);
  }
});

test('序章完成後在北門前方較寬範圍即可進入丘陵', () => {
  const journey = new RealmJourney({ v: 2, stage: 3 });
  journey.player = { x: SPOTS.northGate.x, y: SPOTS.northGate.y + 128 };
  assert.equal(journey.nearby(), 'northGate');
  assert.equal(journey.act('northGate').travel, true);
});
