import test from 'node:test';
import assert from 'node:assert/strict';
import { HeroMovementAnimator } from '../src/realm/HeroMovementAnimator.js';

test('五張原始方向可鏡像覆蓋八方向', () => {
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
    const animator = new HeroMovementAnimator('down');
    const frame = animator.update(.01, axis, true);
    assert.equal(frame.row, row);
    assert.equal(frame.flip, flip);
    assert.ok(frame.column >= 0 && frame.column <= 5);
  }
});

test('停止後先做80ms視覺收步再固定待機，走路使用完整六個影格', () => {
  const animator = new HeroMovementAnimator('down');
  const walk = new Set();
  for (let i = 0; i < 90; i += 1) walk.add(animator.update(1 / 90, { x: 0, y: 1 }, true).column);
  assert.deepEqual([...walk].sort(), [0, 1, 2, 3, 4, 5]);
  assert.equal(animator.update(1 / 60, { x: 0, y: 0 }, false).column, 7);
  for (let i = 0; i < 6; i += 1) animator.update(1 / 60, { x: 0, y: 0 }, false);
  assert.equal(animator.update(1 / 60, { x: 0, y: 0 }, false).column, 6);
});

test('六幀循環以10.5 FPS播放並隨速度連動，快走最高13 FPS', () => {
  const normal = new HeroMovementAnimator('right');
  normal.update(.05, { x: 1, y: 0 }, true, 260);
  assert.equal(normal.update(.04, { x: 1, y: 0 }, true, 260).column, 0);
  assert.equal(normal.update(.01, { x: 1, y: 0 }, true, 260).column, 1);
  const fast = new HeroMovementAnimator('right');
  fast.update(.05, { x: 1, y: 0 }, true, 400);
  assert.equal(fast.update(.03, { x: 1, y: 0 }, true, 400).column, 1);
});

test('相鄰方向需穩定80ms，超過120度的大角度掉頭立即生效', () => {
  const animator = new HeroMovementAnimator('right');
  animator.update(.01, { x: 1, y: 0 }, true);
  for (let i = 0; i < 7; i += 1) assert.equal(animator.update(.01, { x: 1, y: 1 }, true).face, 'right');
  assert.equal(animator.update(.01, { x: 1, y: 1 }, true).face, 'downRight');
  assert.equal(animator.update(.01, { x: -1, y: -1 }, true).face, 'upLeft');
});

test('腳底校平與身體起伏只輸出渲染偏移，不改世界座標', () => {
  const animator = new HeroMovementAnimator('right');
  const first = animator.update(.01, { x: 1, y: 0 }, true);
  assert.equal(first.column, 0);
  assert.equal(typeof first.renderOffsetYRatio, 'number');
  assert.equal(typeof first.renderTiltRadians, 'number');
  assert(first.renderOffsetYRatio > 0);
  const stopped = animator.update(.01, { x: 0, y: 0 }, false);
  assert.equal(stopped.settling, true);
  assert.equal(stopped.column, 7);
});

test('鏡像方向會同步反轉純視覺傾角', () => {
  const right = new HeroMovementAnimator('right').update(.01, { x: 1, y: 0 }, true);
  const left = new HeroMovementAnimator('left').update(.01, { x: -1, y: 0 }, true);
  assert.equal(left.renderTiltRadians, -right.renderTiltRadians);
});
