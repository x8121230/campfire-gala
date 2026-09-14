import test from 'node:test';
import assert from 'node:assert/strict';
import { HeroMovementAnimator } from '../src/realm/HeroMovementAnimator.js';

test('五張原始方向可鏡像覆蓋八方向', () => {
  const animator = new HeroMovementAnimator('down');
  const cases = [
    [{ x: 0, y: 1 }, 0, false],
    [{ x: 0, y: -1 }, 1, false],
    [{ x: 1, y: 0 }, 2, false],
    [{ x: -1, y: 0 }, 2, true],
    [{ x: 1, y: 1 }, 3, false],
    [{ x: -1, y: 1 }, 3, true],
    [{ x: 1, y: -1 }, 4, false],
    [{ x: -1, y: -1 }, 4, true]
  ];
  for (const [axis, row, flip] of cases) {
    const frame = animator.update(.01, axis, true);
    assert.equal(frame.row, row);
    assert.equal(frame.flip, flip);
    assert.ok(frame.column >= 0 && frame.column <= 5);
  }
});

test('停止後固定待機姿勢且走路維持六幀循環', () => {
  const animator = new HeroMovementAnimator('down');
  const walk = new Set();
  for (let i = 0; i < 90; i += 1) walk.add(animator.update(1 / 90, { x: 0, y: 1 }, true).column);
  assert.deepEqual([...walk].sort(), [0, 1, 2, 3, 4, 5]);
  const idle = new Set();
  for (let i = 0; i < 130; i += 1) idle.add(animator.update(1 / 60, { x: 0, y: 0 }, false).column);
  assert.deepEqual([...idle].sort(), [6]);
});
