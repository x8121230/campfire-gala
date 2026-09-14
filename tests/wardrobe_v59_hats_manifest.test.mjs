import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/data/FairyWardrobeData.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../src/data/PaperDollConfig.js', import.meta.url), 'utf8');
const collection = readFileSync(new URL('../src/scenes/Collection.js', import.meta.url), 'utf8');
const root = new URL('../', import.meta.url);

const hats = [
  'lily_bell', 'pitcher_hood', 'maple_parasol', 'moss_bamboo', 'alice_teacup',
  'crystal_rose_crown', 'pumpkin_carriage', 'dream_cloud', 'clockwork_gear', 'steam_train',
  'radar_propeller', 'retro_tv', 'chameleon_hood', 'peacock_crown', 'penguin_diving',
  'lion_sunflower', 'trex_plush', 'stegosaurus_explorer', 'pterodactyl_goggles', 'triceratops_helmet'
];

function pngHeader(relativePath) {
  const data = readFileSync(new URL(relativePath, root));
  assert.equal(data.toString('ascii', 1, 4), 'PNG');
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25]
  };
}

test('v5.9 declares twenty companion hats with stable slugs', () => {
  for (const slug of hats) assert.match(source, new RegExp(`\\['${slug}'`));
  assert.match(source, /FAIRY_V59_ITEMS/);
  assert.match(source, /FAIRY_V59_IDS/);
  assert.match(source, /filesFor\(v59Definitions, 59\)/);
});

test('v5.9 overlays and icons exist, and overlays use the master RGBA canvas', () => {
  for (const slug of hats) {
    const hat = `assets/wardrobe_v59/hat_${slug}_v59.png`;
    const icon = `assets/wardrobe_v59/icon_${slug}_v59.png`;
    assert.ok(existsSync(new URL(hat, root)), hat);
    assert.ok(existsSync(new URL(icon, root)), icon);
    assert.deepEqual(pngHeader(hat), { width: 1024, height: 1800, colorType: 6 });
    assert.equal(pngHeader(icon).colorType, 6, `${icon} must be RGBA`);
  }
});

test('paper-doll fitting recognizes v5.9 hats and wardrobe advertises sixty items', () => {
  assert.match(config, /55\|56\|59/);
  assert.match(collection, /v6\.1 · 童話新裝 60 件/);
});
