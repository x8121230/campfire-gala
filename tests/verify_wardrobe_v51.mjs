import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../PATCH/src/scenes/Collection.js', import.meta.url), 'utf8');

assert.match(source, /canUnequip\(id\)/, '缺少可脫下判定');
assert.match(source, /再點一次脫下/, '缺少脫下確認提示');
assert.match(source, /unequipItem\(id, render = true\)/, '缺少脫下流程');
assert.match(source, /equipped_fullset', 'none'/, '身體造型脫下後未清除全身裝');
assert.match(source, /equipped_cloth', 'item_cloth_daily_01'/, '身體造型脫下後未回到基礎服裝');
assert.match(source, /this\.isEquipped\(id\)[\s\S]*this\.unequipItem\(id, false\)[\s\S]*this\.equipItem\(id, false\)/, '第二次點擊未依穿戴狀態切換動作');

console.log('PASS v5.1 patch: preview/equip and preview/unequip branches are present.');
