import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

function pngInfo(relativePath) {
  const bytes = readFileSync(new URL(relativePath, root));
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25]
  };
}

test('勇者阿晨晨四方向素材使用相同尺寸與真透明通道', () => {
  for (const direction of ['down', 'up', 'left', 'right']) {
    const info = pngInfo(`assets/phantom-realm/hero-achenchen/hero-${direction}.png`);
    assert.deepEqual(info, { width: 420, height: 720, colorType: 6 }, direction);
  }
});

test('阿晨晨移動版包含五方向各六張走路與兩張待機透明素材', () => {
  const base = 'assets/phantom-realm/hero-achenchen/animation-v2/frames';
  for (const direction of ['down', 'up', 'right', 'down-right', 'up-right']) {
    for (const kind of ['walk-01', 'walk-02', 'walk-03', 'walk-04', 'walk-05', 'walk-06', 'idle-01', 'idle-02']) {
      const path = `${base}/${direction}/${kind}.png`;
      assert.ok(existsSync(new URL(path, root)), path);
      assert.deepEqual(pngInfo(path), { width: 512, height: 512, colorType: 6 }, path);
    }
  }
  assert.deepEqual(
    pngInfo('assets/phantom-realm/hero-achenchen/animation-v2/hero-movement-atlas-v2.png'),
    { width: 4096, height: 2560, colorType: 6 }
  );
});

test('營地與丘陵共用八方向動畫，不再以整張靜態人物上下漂浮', () => {
  const camp = readFileSync(new URL('src/realm/RealmWorld.js', root), 'utf8');
  const hills = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  for (const source of [camp, hills]) {
    assert.match(source, /HeroMovementAnimator/);
    assert.match(source, /heroMovement:\s*HERO_MOVEMENT_ATLAS/);
    assert.match(source, /frame\.column \* HERO_FRAME_SIZE/);
    assert.doesNotMatch(source, /const bob = moving/);
  }
  assert.match(hills, /beads[\s\S]*beadColors/);
  assert.match(hills, /grassStep[\s\S]*splash/);
});
