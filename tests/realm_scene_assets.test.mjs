import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('src/realm/RealmWorld.js', root), 'utf8');
const oldTerms = ['榛果爺爺', '星芽水車', '夢藤齒輪', '葉 → 月 → 星', '引風扇'];

test('星芽營地渲染器不再包含舊水車原型', () => {
  for (const term of oldTerms) assert.equal(source.includes(term), false, term);
  assert.equal(source.includes('three.module.js'), false);
  assert.match(source, /starsprout-camp\/background\.png/);
});

test('背景與三位 NPC 圖檔完整存在', () => {
  for (const name of ['background.png', 'npc-alden.png', 'npc-bronc.png', 'npc-phoebe.png']) {
    const file = new URL('assets/phantom-realm/starsprout-camp/' + name, root);
    assert.equal(existsSync(file), true, name);
    assert(statSync(file).size > 100_000, name + ' 不應是空白佔位圖');
    assert.deepEqual([...readFileSync(file).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], name);
  }
});
