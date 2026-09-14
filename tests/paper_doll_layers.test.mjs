import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { FAIRY_ITEMS, FAIRY_FILES, FAIRY_BODIES } from '../src/data/FairyWardrobeData.js';
import { resolveLayers, layerTransform, layerDescriptor, LAYER_ORDER,
    LAYER_FILES, OUTFIT_LAYERS, FINAL_ART_STATUS } from '../src/data/PaperDollLayers.js';
import { renderPaperDoll } from '../src/systems/PaperDollRenderer.js';

const layout = { centerX: 225, centerY: 395, maxWidth: 284, maxHeight: 385, hatAnchorX: .67 };
const look = { bodyId: 'peacock', bodyTexture: 'old', hatId: 'testHat', hatTexture: 'hat' };
const split = { peacock: { effectFront: 'fx', outfitBody: 'front', outfitBack: 'back' } };
const has = keys => key => keys.includes(key);

test('final contract has exactly four slots and all 30 existing outfits use outfitBody', () => {
    assert.deepEqual(LAYER_ORDER, ['outfitBack', 'outfitBody', 'headStyle', 'effectFront']);
    assert.equal(Object.keys(OUTFIT_LAYERS).length, 30);
    assert.equal(FINAL_ART_STATUS.compatibleOneLayer.length, 30);
    assert.equal(FINAL_ART_STATUS.finalReplaceableHead.length, 0);
    for (const [id, layers] of Object.entries(OUTFIT_LAYERS)) {
        assert.ok(FAIRY_ITEMS[id], id); assert.deepEqual(Object.keys(layers), ['outfitBody']);
        assert.equal(layers.outfitBody, FAIRY_ITEMS[id].texture);
    }
    assert.deepEqual(LAYER_FILES, {});
});
test('complete four-slot outfit draws rear, body, head style and effect in order', () => {
    const result = resolveLayers(look, has(['old', 'back', 'front', 'hat', 'fx']), split);
    assert.deepEqual(result.layers.map(x => x.texture), ['back', 'front', 'hat', 'fx']);
    assert.equal(result.layered, true); assert.equal(result.registered, true); assert.equal(result.usedFallback, false);
});
for (const absent of ['back', 'front', 'fx']) test(`missing ${absent} reverts the whole outfit atomically`, () => {
    const result = resolveLayers(look, key => key !== absent, split);
    assert.deepEqual(result.layers.map(x => x.texture), ['old', 'hat']); assert.equal(result.usedFallback, true);
});
test('missing original falls back to default outfit; no outfit means no floating head style', () => {
    assert.deepEqual(resolveLayers(look, has(['wardrobe_doll_daily_v50', 'hat']), split).layers.map(x => x.texture), ['wardrobe_doll_daily_v50', 'hat']);
    const result = resolveLayers(look, has(['hat']), split); assert.equal(result.hasBody, false); assert.deepEqual(result.layers, []);
});
test('missing head style does not remove outfit; integrated hood suppresses selected head style', () => {
    assert.deepEqual(resolveLayers(look, has(['old'])).layers.map(x => x.slot), ['outfitBody']);
    assert.deepEqual(resolveLayers({ ...look, hatSuppressed: true }, () => true, split).layers.map(x => x.slot), ['outfitBack', 'outfitBody', 'effectFront']);
});
test('invalid or forbidden outfit slots fall back safely without checking bad values', () => {
    for (const definition of [{ outfitBody: 'front', headStyle: 'hat' }, { outfitBody: 'front', outfitBack: null }, { outfitBody: 'front', typo: 'back' }, {}]) {
        const result = resolveLayers(look, key => { assert.equal(typeof key, 'string'); return true; }, { peacock: definition });
        assert.equal(result.usedFallback, true); assert.deepEqual(result.layers.map(x => x.texture), ['old', 'hat']);
    }
});
test('one-layer registered outfit is valid but is not falsely called split art', () => {
    const result = resolveLayers(look, () => true, { peacock: { outfitBody: 'front' } });
    assert.equal(result.registered, true); assert.equal(result.layered, false);
    assert.deepEqual(result.layers.map(x => x.slot), ['outfitBody', 'headStyle']);
});
test('new layers share one master scale; old tall head overlays keep their offset', () => {
    const body = layerTransform(layerDescriptor('outfitBody', 'front'), layout);
    const back = layerTransform(layerDescriptor('outfitBack', 'back'), layout, { width: 70, height: 70 }); assert.deepEqual(body, back);
    for (const version of [55, 56, 59]) {
        const hat = layerTransform(layerDescriptor('headStyle', `wardrobe_hat_test_v${version}`), layout);
        assert.equal(hat.scale, body.scale); assert.equal(hat.y, body.y - 132 * body.scale);
    }
    const legacy = layerTransform(layerDescriptor('headStyle', 'custom_old_hat', 'legacy'), layout, { width: 100, height: 200 });
    assert.equal(legacy.scale, Math.min(284 / 100, 385 / 200));
    assert.throws(() => layerTransform(layerDescriptor('outfitBody', 'b'), { ...layout, maxWidth: 0 }), RangeError);
});

function mockScene() {
    const parent = { list: [], add(node) { this.list.push(node); } };
    const scene = { textures: { exists: () => true }, add: { image(x, y, texture) {
        return { x, y, texture, width: 1024, height: 1536, type: 'Image', active: true,
            setPosition(x, y) { Object.assign(this, { x, y }); return this; }, setOrigin(value) { this.origin = value; return this; },
            setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; }, setName(name) { this.name = name; return this; } };
    } } }; return { scene, parent };
}
test('renderer adds direct Image children for existing pulse effects', () => {
    const { scene, parent } = mockScene(); const result = renderPaperDoll(scene, parent, look, layout, { outfits: split });
    assert.deepEqual(parent.list.map(x => x.name), ['paper-doll-outfitBack', 'paper-doll-outfitBody', 'paper-doll-headStyle', 'paper-doll-effectFront']);
    assert.deepEqual(result.nodes, parent.list); assert.equal(new Set(parent.list.map(x => x.scaleX)).size, 1);
});
test('procedural daily clip is drawn in head-style slot before front effect', () => {
    const { scene, parent } = mockScene();
    renderPaperDoll(scene, parent, { ...look, hatId: 'item_hat_daily_01' }, layout, { outfits: { peacock: { outfitBody: 'b', effectFront: 'front' } },
        drawClip(target, x, y, size) { assert.equal(target, parent); assert.equal(size, 33); parent.add({ name: 'clip' }); } });
    assert.deepEqual(parent.list.map(x => x.name), ['paper-doll-outfitBody', 'clip', 'paper-doll-effectFront']);
});

const configSource = readFileSync(new URL('../src/data/PaperDollConfig.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/\bexport /g, '');
const context = vm.createContext({ ITEM_DB: {}, FAIRY_ITEMS, FAIRY_FILES, FAIRY_BODIES, LAYER_FILES }); vm.runInContext(configSource, context);
test('all 900 fairy outfit/headwear combinations resolve without changing selections', () => {
    const bodies = Object.values(FAIRY_ITEMS).filter(x => x.type !== 'hat'), hats = Object.values(FAIRY_ITEMS).filter(x => x.type === 'hat');
    assert.equal(bodies.length, 30); assert.equal(hats.length, 30); let count = 0;
    for (const body of bodies) for (const hat of hats) {
        const state = { equipped_hat: hat.id, equipped_cloth: body.type === 'cloth' ? body.id : 'none', equipped_fullset: body.type === 'fullset' ? body.id : 'none', equipped_collectible: 'none' };
        const before = JSON.stringify(state), result = resolveLayers(context.currentLook({ get: key => state[key] }), () => true);
        assert.equal(result.layers[0].texture, body.texture); assert.equal(result.layers.length, body.integratedHat ? 1 : 2); assert.equal(JSON.stringify(state), before); count++;
    }
    assert.equal(count, 900);
});
test('no selection renders the default outfit and its built-in default head', () => {
    const current = context.currentLook({ get: () => null }); assert.equal(current.bodyTexture, 'wardrobe_doll_daily_v50');
    assert.deepEqual(resolveLayers(current, () => true).layers.map(x => x.texture), ['wardrobe_doll_daily_v50']);
});
test('preview is transient and every existing texture keeps its old transform', () => {
    const state = { equipped_hat: 'item_hat_fairytale_fox', equipped_cloth: 'item_cloth_fairytale_peacock' }, registry = { get: key => state[key] };
    assert.equal(context.currentLook(registry, '__none_hat__').hatId, 'none'); assert.equal(context.currentLook(registry).hatId, state.equipped_hat);
    for (const item of Object.values(FAIRY_ITEMS)) {
        // Earlier art packs are intentionally not duplicated in this small overwrite package.
        // Their published canvases are 1024x1536; v55/v56/v59 hats use the 1024x1800 tall canvas.
        const isTallHat = item.type === 'hat' && /_v(?:55|56|59)$/.test(item.texture);
        const image = { width: 1024, height: isTallHat ? 1800 : 1536, y: layout.centerY, texture: { key: item.texture }, setScale(value) { this.scale = value; } };
        context.fitImage(image, layout.maxWidth, layout.maxHeight);
        const current = { ...look, bodyId: item.id, bodyTexture: item.texture, hatTexture: item.type === 'hat' ? item.texture : null, hatId: item.id };
        const plan = resolveLayers(current, () => true), layer = plan.layers.find(x => x.slot === (item.type === 'hat' ? 'headStyle' : 'outfitBody'));
        const transform = layerTransform(layer, layout, image); assert.equal(transform.scale, image.scale, item.id); assert.equal(transform.y, image.y, item.id);
    }
});
