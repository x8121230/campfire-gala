const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const harness = require('./dom-harness.cjs');
const root = path.join(__dirname,'..');

test('demo opens with outfit and hat, supports layer toggle, screenshot and report export', async t => {
  const h = await harness(root);t.after(h.cleanup);
  assert.equal(h.get('assetCount').textContent,'6 張圖片');
  assert.equal(h.context2d.draws.length,2);
  await h.get('removeHat').click();await h.flush();assert.equal(h.context2d.draws.length,1);
  await h.get('nextHat').click();await h.flush();assert.equal(h.context2d.draws.length,2);
  const layerRows=h.get('layerList').children;
  const bodyRow=layerRows.find(row=>row.children[1].textContent==='衣服本體');
  bodyRow.children[0].checked=false;bodyRow.children[0].onchange();await h.flush();assert.equal(h.context2d.draws.length,1);
  h.get('issueNote').value='帽子需要調整';await h.get('addIssue').click();assert.equal(h.get('issueCount').textContent,1);
  await h.get('reportButton').click();const exported=JSON.parse(await h.downloads.at(-1).blob.text());
  assert.equal(exported.issues[0].note,'帽子需要調整');assert.equal(exported.issues[0].source,'demo');
  await h.get('screenshotButton').click();await h.flush();assert.match(h.downloads.at(-1).name,/\.png$/);
});
test('character and monster tabs use different assets; frame playback and single stepping work',async t=>{
  const h=await harness(root);t.after(h.cleanup);
  await h.tab('characters');assert.equal(h.get('pageTitle').textContent,'公仔・控制者');
  assert.equal(h.get('infoName').textContent,'主角公仔');assert.equal(h.get('frameLabel').textContent,'影格 1 / 1');
  await h.tab('monsters');assert.equal(h.get('infoName').textContent,'首領圖集');assert.equal(h.get('frameLabel').textContent,'影格 1 / 6');
  await h.get('stepForward').click();await h.flush();assert.equal(h.get('frameLabel').textContent,'影格 2 / 6');
  await h.get('playButton').click();h.sandbox.raf(performance.now()+1000);await h.flush();assert.equal(h.get('frameLabel').textContent,'影格 3 / 6');
  await h.tab('games');assert.equal(h.get('gameList').children.length,23);assert.equal(h.get('assetWorkspace').hidden,true);
});
test('local import parses actual File objects, keeps source code inert, and rejects opaque data as code',async t=>{
  const h=await harness(root);t.after(h.cleanup);
  const body=Buffer.from(h.sandbox.FOREST_DEMO.assets[0].data.split(',')[1],'base64');
  const hat=Buffer.from(h.sandbox.FOREST_DEMO.assets[2].data.split(',')[1],'base64');
  const files=[
    h.file('doll_daily_v50.png',body,'my-game/assets/wardrobe_v50/doll_daily_v50.png'),
    h.file('hat_fox.png',hat,'my-game/assets/wardrobe_v56/hat_fox.png'),
    h.file('MiniGameCatalog.js',`window.MUST_NOT_RUN=true; export const MINI_GAME_CATALOG=Object.freeze([{id:'test',title:'測試森林',scene:'TestScene'}]);`,'my-game/src/data/MiniGameCatalog.js'),
    h.file('TestScene.js',`window.MUST_NOT_RUN=true; this.load.image('doll','assets/wardrobe_v50/doll_daily_v50.png');`,'my-game/src/scenes/TestScene.js')
  ];
  await h.get('folderInput').onchange({target:{files}});await h.flush();
  assert.equal(h.get('sourceLabel').textContent,'my-game');assert.equal(h.get('assetCount').textContent,'2 張圖片');assert.equal(h.sandbox.MUST_NOT_RUN,undefined);
  assert.equal(h.context2d.draws.length,2);await h.tab('games');assert.equal(h.get('gameList').children.length,1);
  const game=h.get('gameList').children[0];assert.match(game.children[4].textContent,/已找到场景檔|已找到場景檔/);
  assert.equal(game.children[5].disabled,false);await game.children[5].click();await h.flush();assert.equal(h.get('assetList').children.length,1);
  await h.get('reportButton').click();const report=JSON.parse(await h.downloads.at(-1).blob.text());assert.equal(report.current.source,'local-folder');assert.equal(report.assets.length,2);
});
