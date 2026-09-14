import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/data/FairyWardrobeData.js', import.meta.url), 'utf8');
const collection = readFileSync(new URL('../src/scenes/Collection.js', import.meta.url), 'utf8');

const v57 = [
  'lily_valley', 'pitcher_overalls', 'maple_cloak', 'moss_lantern', 'alice_poker',
  'crystal_rose_gown', 'pumpkin_mage', 'cloud_tutu', 'clockwork_overalls', 'aviator_jacket'
];

const v58 = [
  'dynamo_coil', 'tin_woodman', 'chameleon', 'peacock', 'penguin_ice',
  'lion_vest', 'trex_stomp', 'stegosaurus', 'pterodactyl', 'triceratops'
];

test('v5.7 and v5.8 declare twenty stable wardrobe slugs', () => {
  for (const slug of [...v57, ...v58]) assert.match(source, new RegExp(`\\['${slug}'`));
  assert.match(source, /FAIRY_V57_IDS/);
  assert.match(source, /FAIRY_V58_IDS/);
  assert.match(source, /recommendedMap/);
});

test('v5.7 and v5.8 production paper-doll paths stay registered', () => {
  assert.match(source, /assets\/wardrobe_v\$\{version\}\/doll_\$\{slug\}\$\{suffix\}\.png/);
  assert.match(source, /const suffix=version>=57\?`_v\$\{version\}`:''/);
});

test('wardrobe UI advertises the cumulative item count and shows planned abilities', () => {
  assert.match(collection, /v6\.1 · 童話新裝 60 件/);
  assert.match(collection, /能力預告：/);
});
