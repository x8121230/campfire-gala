import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreatureAnimator, deformCreature, creatureAtlasRigs, drawCreatureFrame } from '../src/realm/CreatureAnimator.js';
import { readFileSync } from 'node:fs';
const mob = (type = 'mouse') => ({ id: 1, type, x: 100, y: 100, alive: true, hitFlash: 0, dizzy: 0, float: 0 });

test('待機不踩步、不改邏輯座標；移動後按路程推進步態並轉向', () => {
  const a = new CreatureAnimator(), m = mob(), before = { ...m };
  const s = a.update(m, .016), initial = s.phase;
  for (let i = 0; i < 120; i++) a.update(m, 1 / 60);
  assert.equal(s.phase, initial); assert.equal(s.lift, 0); assert.deepEqual(m, before);
  m.x -= 2; a.update(m, 1 / 60);
  assert.equal(s.flip, true); assert.equal(s.mode, 'run'); assert.notEqual(s.phase, initial);
  const stopped = s.phase; a.update(m, 1 / 60);
  assert.equal(s.phase, stopped); assert.equal(s.mode, 'idle');
});
test('相同移動距離的步態不受更新幀率影響', () => {
  const phases = [];
  for (const fps of [30, 60, 120]) {
    const a = new CreatureAnimator(), m = mob(); a.update(m, 0);
    for (let i = 0; i < fps; i++) { m.x += 100 / fps; a.update(m, 1 / fps); }
    phases.push(a.states.get(m.id).phase);
  }
  assert(Math.abs(phases[0] - phases[2]) < 1e-9);
});
test('浮空雀有持續拍翅、受擊平滑升空，暫停不推進动画', () => {
  const a = new CreatureAnimator(), m = mob('chick'); const s = a.update(m, .016);
  const phase = s.phase; a.update(m, .016); assert.notEqual(s.phase, phase);
  m.float = 1.15; const oldLift = s.lift; a.update(m, .016);
  assert(s.lift > oldLift); assert(s.lift - oldLift < 8);
  const snapshot = { ...s }; a.update(m, 0); assert.deepEqual(s, snapshot);
  m.float = 0; for (let i = 0; i < 180; i++) a.update(m, 1 / 60);
  assert(s.lift < 10);
});
test('死亡清除動畫狀態，復活不沿用逃跑方向與相位', () => {
  const a = new CreatureAnimator(), m = mob(); a.update(m, .016);
  m.alive = false; assert.equal(a.update(m, .016), null); assert.equal(a.states.size, 0);
  m.alive = true; assert.equal(a.update(m, .016).mode, 'idle');
});
test('呼吸、步態、拍翅循環首尾連續且所有頂點有限', () => {
  for (const kind of ['mouseIdle', 'mouseRun', 'chickFlight']) {
    for (let x = 0; x <= 1; x += .1) for (let y = 0; y <= 1; y += .1) {
      const a = deformCreature(kind, x, y, 0), b = deformCreature(kind, x, y, 1);
      assert(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9);
      for (let frame = 0; frame < 16; frame++) {
        const v = deformCreature(kind, x, y, frame / 16);
        assert(Number.isFinite(v.x) && Number.isFinite(v.y));
      }
    }
  }
});

test('三張正式圖集皆為16格透明PNG，循環採樣不超出邊界', () => {
  const images = {};
  for (const [key, filename, width] of [
    ['mouseIdleAtlas', 'mouseIdle-v311.png', 2048],
    ['mouseRunAtlas', 'mouseRun-v311.png', 2048],
    ['chickFlightAtlas', 'chickFlight-v311.png', 2560]
  ]) {
    const bytes = readFileSync(new URL('../assets/phantom-realm/dawn-dandelion-hills/' + filename, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), width);
    // The bird preserves the actual source image aspect ratio.
    const actualHeight = bytes.readUInt32BE(20);
    assert(actualHeight > 0 && actualHeight % 2 === 0);
    assert.equal(bytes[25], 6);
    images[key] = { width, height: actualHeight };
  }
  for (const rig of Object.values(creatureAtlasRigs(images))) for (const phase of [0, .1, .999, 1, 5.2]) {
    drawCreatureFrame({ drawImage(image, x, y, w, h) {
      assert(x >= 0 && y >= 0 && x + w <= image.width && y + h <= image.height);
    } }, rig, phase, 160, 160);
  }
});
