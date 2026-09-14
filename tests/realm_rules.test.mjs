import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RealmJourney, SPOTS, WORLD_SCALE, isWalkable } from '../src/realm/RealmRules.js';

function place(journey, id) {
  journey.player = { x: SPOTS[id].x, y: SPOTS[id].y };
}

test('星芽營地限制懸崖、建築、噴水池並保留主路', () => {
  assert.equal(isWalkable(10, 10), false);
  assert.equal(isWalkable(835 * WORLD_SCALE, 520 * WORLD_SCALE), false);
  assert.equal(isWalkable(400 * WORLD_SCALE, 300 * WORLD_SCALE), false);
  assert.equal(isWalkable(835 * WORLD_SCALE, 820 * WORLD_SCALE), true);
  assert.equal(isWalkable(700 * WORLD_SCALE, 620 * WORLD_SCALE), true);
  assert.equal(isWalkable(1017 * WORLD_SCALE, 100 * WORLD_SCALE), true);
});

test('MAIN_01 必須依照奧爾登、晨露池、布隆克順序完成', () => {
  const journey = new RealmJourney();
  place(journey, 'bronc');
  assert.equal(journey.act('bronc').changed, undefined);
  assert.equal(journey.stage, 0);
  place(journey, 'washPool');
  assert.equal(journey.act('washPool').changed, undefined);
  assert.equal(journey.stage, 0);
  place(journey, 'alden');
  assert.equal(journey.act('alden').changed, true);
  assert.equal(journey.stage, 1);
  place(journey, 'washPool');
  assert.equal(journey.act('washPool').changed, true);
  assert.equal(journey.stage, 2);
  place(journey, 'bronc');
  const reward = journey.act('bronc');
  assert.equal(reward.win, true);
  assert.equal(journey.stage, 3);
  assert.equal(journey.robe, true);
  assert.equal(journey.apples, 10);
});

test('任務標記隨進度移動且北門只在完成後開放', () => {
  const journey = new RealmJourney();
  assert.equal(journey.questMarker('alden'), '!');
  place(journey, 'northGate');
  assert.equal(journey.act('northGate').travel, undefined);
  place(journey, 'alden');
  journey.act('alden');
  assert.equal(journey.questMarker('washPool'), '!');
  place(journey, 'washPool');
  journey.act('washPool');
  assert.equal(journey.questMarker('bronc'), '?');
  place(journey, 'bronc');
  journey.act('bronc');
  assert.equal(journey.questMarker('northGate'), '', '北門完成後改由傳送門呈現，不再顯示驚嘆號');
  place(journey, 'northGate');
  assert.equal(journey.act('northGate').travel, true);
});

test('菲比對話可保存但不會跳過主線', () => {
  const journey = new RealmJourney();
  place(journey, 'phoebe');
  assert.equal(journey.act('phoebe').changed, true);
  assert.equal(journey.metPhoebe, true);
  assert.equal(journey.stage, 0);
  assert.equal(journey.act('phoebe').changed, false);
});

test('存檔結構限制範圍並正確恢復序章獎勵', () => {
  const journey = new RealmJourney({ v: 2, stage: 99, metPhoebe: 1 });
  assert.equal(journey.stage, 3);
  assert.equal(journey.robe, true);
  assert.equal(journey.apples, 10);
  assert.equal(journey.metPhoebe, true);
  assert.deepEqual(journey.export(), { v: 2, stage: 3, metPhoebe: true });
});

test('移動正規化、長幀限制及碰撞有效', () => {
  const a = new RealmJourney();
  const b = new RealmJourney();
  a.move(.05, { x: 1, y: 0 });
  b.move(9, { x: 1, y: 0 });
  assert.deepEqual(a.player, b.player);
  const before = { ...a.player };
  a.player = { x: 835 * WORLD_SCALE, y: 590 * WORLD_SCALE };
  for (let i = 0; i < 90; i += 1) a.move(1 / 60, { x: 0, y: -1 });
  assert(a.player.y > 560 * WORLD_SCALE);
  assert.notDeepEqual(before, a.player);
});

test('出生點與所有營地互動點位於同一個可行走連通區', () => {
  const step = 24;
  const queue = [{ x: 835 * WORLD_SCALE, y: 824 * WORLD_SCALE }];
  const seen = new Set(['0,0']);
  for (let i = 0; i < queue.length; i += 1) {
    const point = queue[i];
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      const key = Math.round((next.x - 835 * WORLD_SCALE) / step) + ',' + Math.round((next.y - 824 * WORLD_SCALE) / step);
      if (!seen.has(key) && isWalkable(next.x, next.y)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  for (const [id, spot] of Object.entries(SPOTS)) {
    const nearest = queue.reduce((best, point) => Math.min(best, Math.hypot(point.x - spot.x, point.y - spot.y)), Infinity);
    assert(nearest < (spot.radius || 92), id + ' 必須能從出生點走入互動範圍');
  }
});
