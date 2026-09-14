import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/data/FairyWardrobeData.js', import.meta.url), 'utf8');
const root = new URL('../', import.meta.url);

const expected = [
  ['fox', 'hat'], ['mushroom', 'hat'], ['bunny', 'hat'], ['flower', 'hat'], ['antennae', 'hat'],
  ['bear', 'doll'], ['sister', 'doll'], ['squirrel', 'doll'], ['owl', 'doll'], ['rainbow', 'doll']
];

test('v5.6 declares all ten stable wardrobe slugs', () => {
  for (const [slug] of expected) assert.match(source, new RegExp(`\\['${slug}'`));
  assert.match(source, /FAIRY_V56_IDS/);
  assert.match(source, /effects:\{\},cosmeticOnly:true/);
});

test('v5.6 production art and hat icons exist', () => {
  for (const [slug, kind] of expected) {
    assert.ok(existsSync(new URL(`assets/wardrobe_v56/${kind}_${slug}.png`, root)), `${kind}_${slug}.png`);
    if (kind === 'hat') assert.ok(existsSync(new URL(`assets/wardrobe_v56/icon_${slug}.png`, root)), `icon_${slug}.png`);
  }
});
