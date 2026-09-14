// Phaser API simulation: lifecycle and scene state tests, not a browser/renderer test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { OceanSession, OCEAN_ITEMS } from '../src/data/OceanCleanupData.js';
class Display extends EventEmitter {
    constructor(x = 0, y = 0, text = '') { super(); Object.assign(this, { x, y, text, visible: true, alpha: 1, width: 512, height: 512, children: [] }); }
    add(items) { this.children.push(...(Array.isArray(items) ? items : [items])); return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setText(t) { this.text = t; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setVisible(v) { this.visible = v; return this; }
    setScale(s) { this.scale = s; return this; }
    setAngle(a) { this.angle = a; return this; }
    setDisplaySize(w, h) { this.width = w; this.height = h; return this; }
    setInteractive() { this.interactive = true; return this; }
    disableInteractive() { this.interactive = false; return this; }
    destroy() { this.destroyed = true; for (const c of this.children) c.destroy?.(); }
}
for (const m of ['setOrigin', 'setDepth', 'setSize', 'setStrokeStyle', 'fillStyle', 'lineStyle', 'fillRoundedRect', 'strokeRoundedRect']) Display.prototype[m] = function () { return this; };
const docEvents = new EventEmitter();
globalThis.document = { hidden: false, addEventListener: (k, f) => docEvents.on(k, f), removeEventListener: (k, f) => docEvents.off(k, f) };
globalThis.Phaser = { Scene: class {}, Math: { Linear: (a, b, t) => a + (b - a) * t } };
const { default: Scene } = await import('../src/scenes/OceanCleanupGame.js');
function scene() {
    const s = new Scene(); s.init({ returnScene: 'MiniGameHub' });
    s.textures = { exists: () => true }; s.events = new EventEmitter(); s.game = { events: new EventEmitter() };
    s.input = { keyboard: new EventEmitter() }; s.sound = { stopAll() {}, context: null };
    s.add = Object.fromEntries(['image', 'rectangle', 'circle', 'graphics', 'container', 'text', 'star'].map(m => [m, (x, y, t) => new Display(x, y, t)]));
    s.tweens = { paused: false, pauseAll() { this.paused = true; }, resumeAll() { this.paused = false; }, add() {} };
    s.scene = { manager: { keys: { MiniGameHub: {} } }, start: name => { s.destination = name; }, restart: data => { s.restartData = data; } };
    s.create(); s.overlay.destroy(); s.overlay = null; s.mode = 'playing'; return s;
}
const tick = (s, n = 24) => { for (let i = 0; i < n; i++) s.update(0, 50); };
function setTask(s, n) { s.session = new OceanSession(() => .3); s.session.index = n; s.session.completed = n; s.session.resetRound(); s.showRound(); }
test('scene creates, initial hint is hidden, pause freezes flight and requires resume', () => {
    const s = scene(); assert.equal(s.halos.length, 0);
    s.choose(s.session.round.items.findIndex((_, i) => s.session.isTarget(i)));
    const shot = s.shot; s.pauseGame(); tick(s); assert.equal(shot.t, 0); assert(s.tweens.paused);
    s.resumeGame(); tick(s, 12); assert.equal(s.shot, null); assert(s.waiting > 0); s.events.emit('shutdown');
});
test('rapid taps do not create extra shots or pickups', () => {
    const s = scene(), i = s.session.round.items.findIndex((_, i) => s.session.isTarget(i));
    s.choose(i); const shot = s.shot; for (let n = 0; n < 10; n++) s.choose(i);
    assert.equal(s.shot, shot); assert.equal(s.session.collected, 1); s.events.emit('shutdown');
});
test('slow mode freezes items without blocking answers; hints disappear after 2.5 active seconds', () => {
    const s = scene(); s.toggleSlow(); const positions = s.views.map(v => [v.x, v.y]);
    tick(s, 100); assert.deepEqual(s.views.map(v => [v.x, v.y]), positions);
    s.revealHint(); assert(s.halos.length); tick(s, 52); assert.equal(s.halos.length, 0);
    s.choose(s.session.round.items.findIndex((_, i) => s.session.isTarget(i))); assert(s.shot); s.events.emit('shutdown');
});
test('bin clicks during flight are ignored, wrong-bin retry stays active and correct bin completes', () => {
    const s = scene(); setTask(s, 4); const i = s.session.round.items.findIndex((_, i) => s.session.isTarget(i));
    const category = OCEAN_ITEMS[s.session.round.items[i]].category; s.choose(i); s.sortInto(category);
    assert.equal(s.session.completed, 4); tick(s, 12); assert(s.pendingRing);
    s.sortInto(category === 'plastic' ? 'metal' : 'plastic'); assert.equal(s.session.pending, i);
    s.sortInto(category); assert.equal(s.session.completed, 5); assert.equal(s.pendingRing, null); s.events.emit('shutdown');
});
test('background and blur pause; shutdown removes owned listeners', () => {
    const s = scene(); document.hidden = true; docEvents.emit('visibilitychange'); assert.equal(s.mode, 'paused');
    document.hidden = false; docEvents.emit('visibilitychange'); assert.equal(s.mode, 'paused');
    s.resumeGame(); s.game.events.emit('blur'); assert.equal(s.mode, 'paused');
    s.events.emit('shutdown'); assert.equal(s.input.keyboard.listenerCount('keydown'), 0); assert.equal(s.game.events.listenerCount('blur'), 0); assert.equal(docEvents.listenerCount('visibilitychange'), 0);
});
test('transition shows rule card and final task opens completion instead of another task', () => {
    const s = scene(); setTask(s, 3); s.choose(s.session.round.items.findIndex((_, i) => s.session.isTarget(i))); tick(s, 40);
    assert.equal(s.session.index, 4); assert.equal(s.mode, 'stage');
    s.overlay.destroy(); s.overlay = null; s.mode = 'playing'; setTask(s, 11);
    for (const i of s.session.hint()) { s.choose(i); tick(s, 12); }
    tick(s, 25); assert.equal(s.mode, 'finished'); assert(s.overlay); s.events.emit('shutdown');
});
test('return and restart keep the configured destination and release paused tweens', () => {
    const s = scene(); s.pauseGame(); s.restart(); assert.deepEqual(s.restartData, { returnScene: 'MiniGameHub' }); assert(!s.tweens.paused);
    s.leave(); assert.equal(s.destination, 'MiniGameHub'); s.events.emit('shutdown');
});
