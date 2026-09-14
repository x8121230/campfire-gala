import assert from 'node:assert/strict';
import fs from 'node:fs';

const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const start = fs.readFileSync(new URL('../src/scenes/Start.js', import.meta.url), 'utf8');
const guide = fs.readFileSync(new URL('../src/scenes/RegionGuide.js', import.meta.url), 'utf8');
const worldMap = fs.readFileSync(new URL('../src/scenes/WorldMap.js', import.meta.url), 'utf8');
const required = ['WorldAtlas', 'FogUnlock', 'RegionGuide', 'SubmapGames', 'FreeExplore', 'RealmPortalTransition', 'RealmWorldGame'];

required.forEach((key) => {
    assert.match(main, new RegExp(`import ${key} `), `main.js 必須匯入 ${key}`);
    assert.match(main, new RegExp(`\\n\\s*${key},`), `Phaser 場景清單必須註冊 ${key}`);
    assert.match(start, new RegExp(`\\['${key}', ${key}\\]`), `首頁必須能補註冊 ${key}`);
});

assert.match(start, /scene\.start\('WorldAtlas'\)/);
assert.doesNotMatch(guide, /drawPath\(/, '森林導覽頁不可再畫三區連接線');
assert.doesNotMatch(guide, /showSubmapCard\(/, '點擊子地圖不可再顯示模式選擇卡');
assert.match(guide, /scene\.start\('WorldMap',[\s\S]*submapId: submap\.id/, '森林圖標必須直達地圖選關畫面');
assert.match(worldMap, /filter\(\(level\) => \(this\.submap\?\.stageIds/, '地圖必須只顯示所屬子地圖的小遊戲');
console.log('✅ 世界地圖場景註冊測試通過，已防止 Scene key not found 黑屏。');
