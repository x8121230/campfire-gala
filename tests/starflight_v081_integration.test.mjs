import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MINI_GAME_CATALOG } from '../src/data/MiniGameCatalog.js';

test('v0.8.1 keeps the 48-game catalog and adds starflight exactly once', () => {
    const entries = MINI_GAME_CATALOG.filter((game) => game.id === 'forest_starflight');
    assert.equal(MINI_GAME_CATALOG.length, 49);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].scene, 'ForestStarflightGame');
    assert.equal(entries[0].category, 'rhythm');
});

test('main imports and registers ForestStarflightGame exactly once', () => {
    const source = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
    assert.equal((source.match(/import ForestStarflightGame from/g) || []).length, 1);
    assert.equal((source.match(/^\s*ForestStarflightGame,\s*$/gm) || []).length, 1);
});

test('integrated and standalone versions are both v0.8.1', () => {
    const rules = fs.readFileSync(new URL('../src/data/StarflightRules.js', import.meta.url), 'utf8');
    const standalone = fs.readFileSync(new URL('../assets/forest-starflight/phase1/standalone.js', import.meta.url), 'utf8');
    assert.match(rules, /version:'0\.8\.1'/);
    assert.match(standalone, /version:'0\.8\.1'/);
});
