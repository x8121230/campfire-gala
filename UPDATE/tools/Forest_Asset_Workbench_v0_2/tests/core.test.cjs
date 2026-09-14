const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('reads literal exported game catalog with comments, nested settings and escaped text', () => {
  const source = `export const MINI_GAME_CATALOG = Object.freeze([
    // first game
    {id:'one',scene:'ForestGame',title:'森林\\n探險',accent:0xffaa00,launchData:{mode:'kids'},ready:true},
  ]); globalThis.unwanted = true;`;
  const rows = C.namedLiteral(source, 'MINI_GAME_CATALOG');
  assert.equal(rows.length, 1); assert.equal(rows[0].title, '森林\n探險');
  assert.equal(rows[0].accent, 0xffaa00); assert.equal(rows[0].launchData.mode, 'kids');
  assert.equal(globalThis.unwanted, undefined);
});
test('does not execute dynamic settings or allow prototype pollution', () => {
  assert.equal(C.namedLiteral('const SETTINGS = makeSettings();', 'SETTINGS'), null);
  assert.equal(C.namedLiteral('const SETTINGS = [{name:globalThis.attack()}];', 'SETTINGS'), null);
  const value = C.namedLiteral(`const SETTINGS = {'__proto__':{polluted:true},body:'safe'};`, 'SETTINGS');
  assert.equal(value.body, 'safe'); assert.equal({}.polluted, undefined); assert.equal(value.__proto__, undefined);
});
test('reads FairyWardrobe definitions from different versions and derives readable names', () => {
  const source = `const v56Definitions=[['fox','狐狸耳罩','hat','毛茸茸','加速']]; const v59Definitions=[['radar','雷達帽','hat','導航','提示']];`;
  const defs = C.fairyDefinitions(source); assert.equal(defs.length, 2);
  assert.equal(C.assetName('assets/wardrobe_v56/hat_fox.png', defs), '狐狸耳罩');
  assert.equal(C.assetName('assets/wardrobe_v59/hat_radar_v59.png', defs), '雷達帽');
});
test('source texture mappings ignore template expressions', () => {
  const mappings = C.sourceMaps("const a={body:'assets/body.png', back:'assets/back.png', dynamic:`assets/${name}.png`};");
  assert.equal(mappings.body, 'assets/body.png'); assert.equal(mappings.dynamic, undefined);
});
test('path matching rejects ambiguous basenames', () => {
  const assets = [{path:'assets/a/body.png'}, {path:'assets/b/body.png'}];
  assert.equal(C.resolvePath('body.png', assets), null);
  assert.equal(C.resolvePath('assets/a/body.png', assets), assets[0]);
  assert.equal(C.resolvePath(undefined, assets), null);
});
test('classifies body, hats and shared creature sheets without treating icons as headwear', () => {
  assert.equal(C.classify('assets/wardrobe_v59/icon_lily.png').kind, 'icon');
  assert.equal(C.classify('assets/wardrobe_v59/hat_lily.png').kind, 'hat');
  assert.equal(C.classify('assets/wardrobe_v58/doll_peacock.png').kind, 'body');
  assert.equal(C.classify('assets/forest/units.png').character, true);
  assert.equal(C.classify('assets/forest/units.png').monster, true);
});
test('grid frames stay in image bounds and clamp invalid input', () => {
  const frames = C.gridFrames(1536, 1024, 3, 2, 1, 5);
  assert.equal(frames.length, 5); assert.deepEqual(frames[0], {name:'1',x:512,y:0,w:512,h:512,width:512,height:512,offsetX:0,offsetY:0});
  for (const f of C.gridFrames(17, 19, 3, 4)) { assert.ok(f.x + f.w <= 17); assert.ok(f.y + f.h <= 19); }
  assert.equal(C.gridFrames(20, 20, 0, -1).length, 1);
});
test('atlas keeps trim offsets and rejects rotated or outside-image frames', () => {
  const atlas = {frames:{'walk01':{frame:{x:0,y:0,w:20,h:30},sourceSize:{w:50,h:60},spriteSourceSize:{x:10,y:15}},
    'rotated':{rotated:true,frame:{x:0,y:0,w:20,h:30}},'outside':{frame:{x:100,y:0,w:20,h:30}}}};
  const parsed = C.parseAtlas(atlas, 100, 100); assert.equal(parsed.frames.length, 1); assert.equal(parsed.skipped.length, 2);
  assert.equal(parsed.frames[0].offsetX, 10); assert.equal(parsed.frames[0].width, 50);
});
test('legacy tall hats share body scale and retain a 132-pixel center offset', () => {
  const layer = {x:0,y:0,scale:100};
  const body = C.wardrobeRect({kind:'body',path:'assets/wardrobe_v58/doll.png',width:1024,height:1536},layer,820,850);
  const hat = C.wardrobeRect({kind:'hat',path:'assets/wardrobe_v59/hat.png',width:1024,height:1800},layer,820,850);
  assert.equal(body.w, hat.w);
  assert.ok(Math.abs((body.y + body.h / 2) - (hat.y + hat.h / 2) - 132 * body.w / 1024) < 1e-8);
});
