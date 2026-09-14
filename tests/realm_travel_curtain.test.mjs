import { test } from 'node:test';
import assert from 'node:assert/strict';
import { travelBetweenRealms, revealRealmArrival } from '../src/realm/RealmTravelCurtain.js';

test('轉場遮罩跨場景保留、阻擋重複傳送，目的地完成後清除', async () => {
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  const attached = [];
  const node = () => ({ style: {}, children: [], setAttribute() {}, append(...items) { this.children.push(...items); },
    remove() { attached.splice(attached.indexOf(this), 1); },
    animate(frames) { Object.assign(this.style, frames.at(-1)); return { finished: Promise.resolve() }; } });
  globalThis.document = { createElement: node, body: { append(el) { attached.push(el); } } };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    let calls = 0, payload;
    const scene = { scene: { start(target, data) {
      calls++; payload = data;
      assert.equal(target, 'RealmWorldGame');
      assert.equal(attached[0].children[0].style.opacity, 1, '換場前必須完全遮住');
    } } };
    await travelBetweenRealms(scene, 'RealmWorldGame', { entry: 'northGate' });
    assert.equal(calls, 1); assert.equal(payload.entry, 'northGate'); assert.equal(payload.portalArrival, true);
    assert.equal(attached.length, 1, '載入目的地期間保留遮罩');
    await travelBetweenRealms(scene, 'RealmWorldGame'); assert.equal(calls, 1);
    await revealRealmArrival(); assert.equal(attached.length, 0);
    await revealRealmArrival(); assert.equal(attached.length, 0, '重複清理也安全');
    await assert.rejects(travelBetweenRealms({ scene: { start() { throw new Error('load failure'); } } }, 'RealmWorldGame'), /load failure/);
    assert.equal(attached.length, 0, '啟動失敗也不留下遮罩');
  } finally { globalThis.document = oldDocument; globalThis.window = oldWindow; }
});
