import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('星芽營地北門停留即自動前往丘陵並避免折返循環', async () => {
  const source = await read('src/realm/RealmApp.js');
  assert.match(source, /requireGateExit/);
  assert.match(source, /gateDistance\s*<\s*SPOTS\.northGate\.radius/);
  assert.match(source, /gateDwell\s*>=\s*\.12/);
  assert.match(source, /travelToHills\(\)/);
});

test('獨立預覽頁也接上營地與丘陵雙向連結', async () => {
  const [camp, hills] = await Promise.all([
    read('realm-preview.html'),
    read('dandelion-hills-preview.html')
  ]);
  assert.match(camp, /onTravel[\s\S]*dandelion-hills-preview\.html/);
  assert.match(hills, /onTravel[\s\S]*realm-preview\.html/);
});

test('蒲公英丘陵南側入口支援向南自動返回並避免出生點折返', async () => {
  const source = await read('src/realm/DandelionHillsApp.js');
  assert.match(source, /requireCampExit\s*=\s*true/);
  assert.match(source, /campPortal\s*&&\s*axis\.y\s*>\s*\.12/);
  assert.match(source, /travelTo\(target\)/);
});

test('載入器具有單檔逾時與整體保護機制', async () => {
  const [main, preload] = await Promise.all([
    read('src/main.js'),
    read('src/scenes/PreloadScene.js')
  ]);
  assert.match(main, /timeout:\s*12000/);
  assert.match(preload, /30000/);
  assert.match(preload, /this\.load\.stop\(\)/);
  assert.match(preload, /this\.scene\.start\('Start'\)/);
});
