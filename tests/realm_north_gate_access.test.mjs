import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RealmJourney, SPOTS, WORLD_SCALE, addCampCollisionMark, collisionStrokePoints, explainCampWalkability, isWalkable, setCampCollisionPaint } from '../src/realm/RealmRules.js';

test('北門中央通道不再被母樹與布告欄碰撞夾住', () => {
  for (let y = 800; y >= SPOTS.northGate.y; y -= 16) {
    assert.equal(isWalkable(1900, y), true, `北門通道 y=${y} 必須可走`);
  }
});

test('序章完成後必須進入花環傳送門的精準範圍', () => {
  const journey = new RealmJourney({ v: 2, stage: 3 });
  journey.player = { x: SPOTS.northGate.x, y: SPOTS.northGate.y + 96 };
  assert.equal(journey.nearby(), 'northGate');
  assert.equal(journey.act('northGate').travel, true);
});

test('營地自訂紅色阻擋可覆蓋北門保護通道', () => {
  setCampCollisionPaint({});
  addCampCollisionMark('block', { x: 1900, y: 600, r: 80 });
  assert.equal(isWalkable(1900, 600), false);
  setCampCollisionPaint({});
  assert.equal(isWalkable(1900, 600), true);
});

test('綠色通行筆可開放底層邊界之外的道路', () => {
  setCampCollisionPaint({});
  const point = { x: 1500 * WORLD_SCALE, y: 180 * WORLD_SCALE };
  assert.equal(isWalkable(point.x, point.y), false);
  addCampCollisionMark('pass', { ...point, r: 56 * WORLD_SCALE });
  assert.equal(isWalkable(point.x, point.y), true);
  setCampCollisionPaint({});
});

test('告示板橙框是實際阻擋，不再被北門保護通道穿透', () => {
  setCampCollisionPaint({});
  assert.equal(isWalkable(1080 * WORLD_SCALE, 330 * WORLD_SCALE), false);
});

test('碰撞優先級固定為紅色阻擋高於綠色開路，綠色高於橙框與OUTER', () => {
  const outside = { x: 1500 * WORLD_SCALE, y: 180 * WORLD_SCALE };
  setCampCollisionPaint({ pass: [{ ...outside, r: 80 }] });
  assert.deepEqual(explainCampWalkability(outside.x, outside.y).layer, 'paint-pass');
  addCampCollisionMark('block', { ...outside, r: 40 });
  assert.deepEqual(explainCampWalkability(outside.x, outside.y).layer, 'paint-block');

  const fountain = { x: 835 * WORLD_SCALE, y: 520 * WORLD_SCALE };
  setCampCollisionPaint({ pass: [{ ...fountain, r: 80 }] });
  assert.equal(explainCampWalkability(fountain.x, fountain.y).layer, 'paint-pass');
  setCampCollisionPaint({});
});

test('快速拖曳會沿線插值補點，不留下大於指定間距的空隙', () => {
  const points = collisionStrokePoints({ x: 0, y: 0 }, { x: 250, y: 0 }, 32);
  assert(points.length >= 8);
  let previous = { x: 0, y: 0 };
  for (const point of points) {
    assert(Math.hypot(point.x - previous.x, point.y - previous.y) <= 32);
    previous = point;
  }
  assert.deepEqual(points.at(-1), { x: 250, y: 0 });
});

test('實機標記的東側石板路座標不再被OUTER誤擋', () => {
  setCampCollisionPaint({});
  const result = explainCampWalkability(2442, 641);
  assert.equal(result.walkable, true);
  assert.equal(result.layer, 'east-road');
});
