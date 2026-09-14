import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { FAIRY_ITEMS } from '../src/data/FairyWardrobeData.js';

// Execute Collection methods with explicit service/Phaser doubles.
// This verifies method wiring, NOT a full browser or SaveSystem integration.
const source = readFileSync(new URL('../src/scenes/Collection.js', import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replace('export default class Collection', 'globalThis.Collection = class Collection');
function setup() {
    const state = { owned_items: Object.keys(FAIRY_ITEMS), equipped_hat: 'none',
        equipped_cloth: 'item_cloth_daily_01', equipped_fullset: 'none', new_items: [] };
    const metrics = { saves: 0, draws: 0, killed: [] };
    const context = vm.createContext({
        Phaser: { Scene: class {} }, console,
        ITEM_DB: { ...FAIRY_ITEMS, item_cloth_daily_01: { type: 'cloth', name: '日常休閒裝' } },
        EquipmentSystem: { applyBonusToRegistry() {} },
        SaveSystem: { saveFromRegistry() { metrics.saves++; } },
        PAPER_DOLL_LAYOUT: { wardrobe: {} },
        currentLook: () => ({ bodyId: state.equipped_cloth, bodyIsConverted: true }),
        renderPaperDoll: () => { metrics.draws++; return { hasBody: true, layered: false, usedFallback: false }; }
    });
    vm.runInContext(source, context);
    const scene = new context.Collection(); scene.init();
    scene.registry = { get: key => state[key], set: (key, value) => { state[key] = value; } };
    scene.audio = { unlock() {}, effect() {} };
    scene.render = () => {}; scene.playWardrobeEffect = () => {};
    scene.tweens = { killTweensOf: node => metrics.killed.push(node) };
    return { scene, state, metrics };
}
test('single-click equip/second-click unequip remains unchanged for all 60 fairy items', () => {
    for (const item of Object.values(FAIRY_ITEMS)) {
        const { scene, state, metrics } = setup();
        assert.equal(scene.selectItem(item.id), true);
        assert.equal(state[`equipped_${item.type}`], item.id);
        assert.equal(scene.selectItem(item.id), true);
        assert.equal(state.equipped_hat, 'none');
        assert.equal(state.equipped_fullset, 'none');
        assert.equal(state.equipped_cloth, 'item_cloth_daily_01');
        assert.equal(metrics.saves, 2);
    }
});
test('renderDoll destroys previous children and delegates without saving', () => {
    const { scene, metrics } = setup();
    let clears = 0;
    scene.mirror = { removeAll(destroy) { assert.equal(destroy, true); clears++; } };
    scene.txt = () => ({ setOrigin() {} });
    scene.renderDoll(); scene.renderDoll();
    assert.equal(clears, 2); assert.equal(metrics.draws, 2); assert.equal(metrics.saves, 0);
});
test('effect cleanup restores every layer scale and skips destroyed nodes', () => {
    const { scene, metrics } = setup();
    const nodes = ['outfitBack', 'outfitBody', 'headStyle', 'effectFront'].map(name => ({ name, active: true,
        setScale(x, y) { this.xScale = x; this.yScale = y; } }));
    nodes.push({ active: false, setScale() { throw new Error('destroyed node must not be changed'); } });
    scene.dollPulses = nodes.map(node => ({ node, x: .25, y: .25 }));
    scene.clearWardrobeEffects();
    assert.equal(metrics.killed.length, 5);
    for (const node of nodes.slice(0, 4)) assert.equal(node.xScale, .25);
    assert.equal(scene.dollPulses.length, 0);
});
