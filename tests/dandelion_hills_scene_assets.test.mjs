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
  const tiles = Array.from({length:9},(_,i)=>String(i));
  for(const tile of tiles){
    const bytes=readFileSync(new URL('assets/phantom-realm/dawn-dandelion-hills/map-v316/'+tile+'.png',root));
    assert.equal(bytes.readUInt32BE(16),1576);
    assert.equal(bytes.readUInt32BE(20),888);
  }
  const boss=readFileSync(new URL('assets/phantom-realm/dawn-dandelion-hills/pumpkin-boss-v315.png',root));
  assert.equal(boss.readUInt32BE(16),1280);assert.equal(boss.readUInt32BE(20),960);assert.equal(boss[25],6);
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

test('營地與丘陵兩端都使用花環傳送門而非北門驚嘆號', () => {
  const campRules = readFileSync(new URL('src/realm/RealmRules.js', root), 'utf8');
  const campWorld = readFileSync(new URL('src/realm/RealmWorld.js', root), 'utf8');
  const hillsWorld = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  assert.doesNotMatch(campRules, /northGate' && this\.stage === 3\) return '!'/);
  assert.match(campWorld, /drawNorthGatePortal/);
  assert.match(campWorld, /前往晨曦蒲公英丘陵/);
  assert.match(hillsWorld, /id === 'camp'/);
  assert.match(hillsWorld, /createRadialGradient/);
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
  assert.match(world, /Blue mana gathers/);
  assert.match(world, /actual mana sword/);
  assert.match(world, /forward blue pressure wave/);
});

test('丘陵加入可檢視所有素材與靈珠數量的冒險背包', () => {
  const app = readFileSync(new URL('src/realm/DandelionHillsApp.js', root), 'utf8');
  assert.match(app, /this\.button\('背包'/);
  assert.match(app, /backpack\(\)/);
  assert.match(app, /StarsproutInventoryPanel/);
  assert.match(app, /saveStarsproutInventory/);
  assert.match(app, /quickbar/);
  assert.match(app, /QUICK_ITEMS/);
  assert.match(app, /itemDetails/);
});

test('丘陵內建可視化碰撞筆刷並可保存與匯出JSON', () => {
  const rules = readFileSync(new URL('src/realm/DandelionHillsRules.js', root), 'utf8');
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  const app = readFileSync(new URL('src/realm/DandelionHillsApp.js', root), 'utf8');
  assert.match(rules, /addHillsCollisionMark/); assert.match(rules, /eraseHillsCollisionMarks/); assert.match(rules, /collisionPaint\.pass/);
  assert.match(world, /drawCollisionEditor/); assert.match(world, /screenToWorld/);
  assert.match(app, /紅色阻擋筆/); assert.match(app, /綠色通行筆/); assert.match(app, /匯出JSON/); assert.match(app, /COLLISION_SAVE/);
  assert.match(app, /disableHillsObstaclesAt/); assert.match(app, /全部還原/);
});

test('魔法劍由法杖尖端形成且左向維持頭頂往前斬', () => {
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  assert.match(world, /targetAngle -= Math\.PI \* 2/);
  assert.match(world, /const pivotX = fx\.x \+ dx \* 38/);
  assert.match(world, /const pivotY = fx\.y - 67/);
  assert.doesNotMatch(world, /const startAngle = targetAngle - Math\.PI \* \.58/);
});

test('魔法斬動畫生命週期與規則共用同一速度設定', () => {
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  assert.match(world, /slash: HILLS_COMBAT\.attackDuration/);
});

test('丘陵主角縮小百分之二十且維持腳底錨點', () => {
  const world = readFileSync(new URL('src/realm/DandelionHillsWorld.js', root), 'utf8');
  assert.match(world, /const height = 123\.2/);
  assert.match(world, /-height,/);
});

test('破防音效缺失或回呼錯誤都不會中斷動畫主循環', () => {
  const scene = readFileSync(new URL('src/scenes/AnimalSnackGame.js', root), 'utf8');
  const app = readFileSync(new URL('src/realm/DandelionHillsApp.js', root), 'utf8');
  assert.match(scene, /wrong:\s*\[/);
  assert.match(scene, /if \(!Array\.isArray\(notes\)\) return/);
  assert.match(app, /try \{ this\.onSound\(message\.sound\); \}/);
});
