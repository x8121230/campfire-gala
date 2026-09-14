import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);

test('丘陵背景與五種透明怪物素材完整存在', () => {
  const files = ['background.png', 'mob-poppo-mouse.png', 'mob-floating-chick.png', 'mob-dew-spirit.png', 'mob-gardener-mole.png', 'elite-pumpkin-rabbit.png'];
  for (const name of files) {
    const file = new URL('assets/phantom-realm/dawn-dandelion-hills/' + name, root);
    assert.equal(existsSync(file), true, name);
    assert(statSync(file).size > 100_000, name + ' 不可使用空白佔位圖');
    assert.deepEqual([...readFileSync(file).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], name);
  }
});

test('星芽谷版波波鼠八格動作素材尺寸與透明通道一致', () => {
  for (let index = 1; index <= 8; index += 1) {
    const name = `mob-poppo-mouse-${String(index).padStart(2, '0')}.png`;
    const bytes = readFileSync(new URL('assets/phantom-realm/dawn-dandelion-hills/' + name, root));
    assert.equal(bytes.readUInt32BE(16), 512, name);
    assert.equal(bytes.readUInt32BE(20), 512, name);
    assert.equal(bytes[25], 6, name + ' 必須是 RGBA 真透明 PNG');
  }
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  for (const key of ['mouseIdle2', 'mouseRun1', 'mouseRun2', 'mouseHit', 'mouseDizzy', 'mousePoof']) assert.match(world, new RegExp(key));
});

test('丘陵場景、營地北門與 Phaser 註冊互相連接', () => {
  const main = readFileSync(new URL('src/main.js', root), 'utf8');
  const camp = readFileSync(new URL('src/scenes/RealmWorldGameV2.js', root), 'utf8');
  const hills = readFileSync(new URL('src/scenes/DawnDandelionHillsGame.js', root), 'utf8');
  assert.match(main, /import DawnDandelionHillsGame /);
  assert.match(main, /\n\s*DawnDandelionHillsGame,/);
  assert.match(camp, /onTravel:[\s\S]*DawnDandelionHillsGame/);
  assert.match(hills, /RealmWorldGame[\s\S]*entry: target === 'camp' \? 'northGate'/);
});

test('丘陵渲染器包含三色光團與戰鬥危險提示', () => {
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  assert.match(world, /drop\.rarity === 'rare'/);
  assert.match(world, /drop\.rarity === 'quest'/);
  assert.match(world, /journey\.projectiles/);
  assert.match(world, /journey\.traps/);
  assert.match(world, /ringColor = hostile \? '#ff5b52' : '#ffd65c'/);
  assert.match(world, /fx\.kind === 'slash'/);
  assert.match(world, /fx\.kind === 'guard'/);
  assert.match(world, /fx\.kind === 'guardBreak'/);
});
