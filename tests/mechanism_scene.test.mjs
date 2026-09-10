// Phaser API simulation. This file does not claim browser rendering or touch QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createSolver } from '../src/data/ForestMechanismRules.js';

class Display extends EventEmitter {
    constructor(x = 0, y = 0, text = '') { super(); Object.assign(this, { x, y, text, list: [], visible: true, alpha: 1, width: 512, height: 512 }); }
    add(items) { this.list.push(...(Array.isArray(items) ? items : [items])); return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setText(t) { this.text = t; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setVisible(v) { this.visible = v; return this; }
    setScale(s) { this.scale = s; return this; }
    setDisplaySize(w, h) { this.width = w; this.height = h; return this; }
    setInteractive() { this.interactive = true; return this; }
    destroy() { if (this.destroyed) return; this.destroyed = true; this.list.forEach(c => c.destroy?.()); }
}
for (const method of ['setOrigin','setDepth','setSize','setStrokeStyle','fillStyle','lineStyle','fillRoundedRect','strokeRoundedRect','setWordWrapWidth','setStroke']) Display.prototype[method] = function () { return this; };
globalThis.Phaser = { Scene: class {} };
const documentEvents = new EventEmitter();
globalThis.document = { hidden: false, addEventListener: (name, fn) => documentEvents.on(name, fn), removeEventListener: (name, fn) => documentEvents.off(name, fn) };
const { default: Scene } = await import('../src/scenes/ForestMechanismGame.js');
function makeScene() {
    const s = new Scene(), objects = []; s.init({ returnScene: 'MiniGameHub' });
    s.textures = { exists: () => true }; s.events = new EventEmitter(); s.game = { events: new EventEmitter() };
    s.input = { keyboard: new EventEmitter() }; const captures = new Set();
    s.input.keyboard.addCapture = keys => keys.forEach(k => captures.add(k));
    s.input.keyboard.removeCapture = keys => keys.forEach(k => captures.delete(k)); s.captures = captures;
    s.sound = { stopAll() {}, context: null };
    s.add = Object.fromEntries(['image','rectangle','circle','graphics','container','text'].map(type => [type, (x, y, text) => { const o = new Display(x, y, text); objects.push(o); return o; }]));
    s.children = { removeAll() { objects.forEach(o => o.destroy()); objects.length = 0; } };
    s.tweens = { paused: false, killAll() {}, add() {}, pauseAll() { this.paused = true; }, resumeAll() { this.paused = false; } };
    s.scene = { manager: { keys: { MiniGameHub: {} } }, start: name => { s.destination = name; } };
    s.create(); return s;
}
const tick = (s, n = 4) => { for (let i = 0; i < n; i++) s.update(0, 50); };
const clickOverlay = (s, label) => { const button = s.overlay.list.find(c => c.label?.text === label); assert(button, `button ${label}`); button.emit('pointerdown'); };
function route(s) { const job = createSolver(s.session.level, s.session.state); while (job.status === 'searching') job.tick(2000); assert.equal(job.status, 'solved'); return job.path; }

test('intro leads to 18-level selection; all 18 scenes complete through actual scene move handlers', () => {
    const s = makeScene(); assert.equal(s.mode, 'intro'); clickOverlay(s, '選一張地圖，出發！'); assert.equal(s.mode, 'select');
    for (let i = 0; i < 18; i++) {
        s.startLevel(i); assert.equal(s.mode, 'playing');
        for (const direction of route(s)) { s.move(direction); tick(s); }
        assert.equal(s.mode, 'finished', `level ${i + 1}`); assert.equal(s.records[i].stars, 3);
    }
    s.showSelection(); assert.equal(Object.keys(s.records).length, 18); s.events.emit('shutdown');
});
test('rapid held inputs are limited to one step per cooldown; blocked moves do not count', () => {
    const s = makeScene(); s.startLevel(0); const start = s.session.state.player;
    s.move('up'); assert.equal(s.session.moves, 0); s.move('right'); s.move('right');
    assert.equal(s.session.moves, 1); assert.equal(s.session.state.player, start + 1);
    tick(s); s.move('right'); assert.equal(s.session.moves, 2); s.events.emit('shutdown');
});
test('tile tapping only moves one adjacent square; undo cancels hints and restores actor state', () => {
    const s = makeScene(); s.startLevel(0); const start = s.session.state.player;
    s.tapTile(start + 2); assert.equal(s.session.moves, 0); s.tapTile(start + 1); tick(s); assert.equal(s.session.moves, 1);
    s.requestHint(); s.requestHint(); s.requestHint(); assert(s.hintJob); s.undoMove();
    assert.equal(s.session.state.player, start); assert.equal(s.hintJob, null); assert.equal(s.session.hintsUsed, 3); s.events.emit('shutdown');
});
test('three-stage hint only creates a route arrow on third request and expires on active time', () => {
    const s = makeScene(); s.startLevel(0); s.requestHint(); assert.equal(s.hintJob, null); assert.equal(s.hintArrow, null);
    s.requestHint(); assert.equal(s.hintArrow, null); s.requestHint(); tick(s, 2); assert(s.hintArrow);
    s.pauseGame(); tick(s, 200); assert(s.hintArrow); s.resumeGame(); tick(s, 145); assert.equal(s.hintArrow, null); s.events.emit('shutdown');
});
test('pausing freezes incremental solver, cooldown and input; return from background stays paused', () => {
    const s = makeScene(); s.startLevel(14); s.requestHint(); s.requestHint(); s.requestHint();
    const visited = s.hintJob.visited, before = s.session.state;
    document.hidden = true; documentEvents.emit('visibilitychange'); assert.equal(s.mode, 'paused');
    tick(s, 40); s.move('up'); assert.equal(s.hintJob.visited, visited); assert.equal(s.session.state, before);
    document.hidden = false; documentEvents.emit('visibilitychange'); assert.equal(s.mode, 'paused');
    s.resumeGame(); tick(s); assert(s.hintJob.visited > visited); s.events.emit('shutdown');
});
test('restart cancellation keeps progress; confirmed restart resets hints and moves', () => {
    const s = makeScene(); s.startLevel(0); s.move('right'); tick(s); s.requestHint(); const before = s.session.state;
    s.confirmRestart(); clickOverlay(s, '繼續原本的路'); assert.equal(s.mode, 'playing'); assert.equal(s.session.state, before);
    s.confirmRestart(); clickOverlay(s, '重新挑戰'); assert.equal(s.session.moves, 0); assert.equal(s.session.hintsUsed, 0); assert(!s.tweens.paused); s.events.emit('shutdown');
});
test('selection preserves the current run for resume; replay keeps best stars in memory', () => {
    const s = makeScene(); s.startLevel(0); s.move('right'); tick(s); const run = s.session;
    s.showSelection(); assert.equal(s.session, run); s.renderLevel(); assert.equal(s.session.moves, 1);
    for (const direction of route(s)) { s.move(direction); tick(s); }
    assert.equal(s.records[0].stars, 3); s.startLevel(0); assert.equal(s.records[0].stars, 3); assert.equal(s.session.moves, 0); s.events.emit('shutdown');
});
test('shutdown releases input capture, listeners and hint job; leaving uses configured hub', () => {
    const s = makeScene(); s.startLevel(14); s.requestHint(); s.requestHint(); s.requestHint(); s.game.events.emit('blur');
    assert.equal(s.mode, 'paused'); s.leave(); assert.equal(s.destination, 'MiniGameHub'); assert(!s.tweens.paused);
    s.events.emit('shutdown'); assert.equal(s.captures.size, 0); assert.equal(documentEvents.listenerCount('visibilitychange'), 0);
    assert.equal(s.game.events.listenerCount('blur'), 0); assert.equal(s.input.keyboard.listenerCount('keydown'), 0); assert.equal(s.hintJob, null);
});
