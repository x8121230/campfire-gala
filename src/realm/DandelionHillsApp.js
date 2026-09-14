import { buildResourceIcons, updateResourceIcons } from './RealmResourceHUD.js';
import { FootstepClock, safeCue } from './RealmSoundEffects.js';
import { DandelionHillsJourney, HILLS_SCALE, MOB_TYPES, addHillsCollisionMark, disableHillsObstaclesAt, eraseHillsCollisionMarks, getHillsCollisionPaint, setHillsCollisionPaint } from './DandelionHillsRules.js';
import { DandelionHillsWorld } from './DandelionHillsWorld.js';
import { ITEM_CATALOG, STARSPROUT_QUICK_ITEMS, loadStarsproutInventory, mergeStarsproutItems, saveStarsproutInventory } from './StarsproutInventory.js';
import { StarsproutInventoryPanel } from './StarsproutInventoryPanel.js';

const SAVE = 'forest_dawn_dandelion_hills_v1';
const COLLISION_SAVE = 'forest_dawn_dandelion_collision_v316'; // Old paint is preserved under its original key; coordinates belong to old terrain.
const ITEM_META = Object.freeze(Object.fromEntries(Object.entries(ITEM_CATALOG).map(([name, item]) => [name, [item.icon, item.description]])));
const QUICK_ITEMS = STARSPROUT_QUICK_ITEMS;

export class DandelionHillsApp {
  constructor(root, { onExit = () => {}, onTravel = () => {}, portalArrival = false, onSound = () => {} } = {}) {
    this.root = root;
    this.onExit = onExit;
    this.onTravel = onTravel;
    this.portalArrival = portalArrival;
    this.onSound = onSound;
    this.footsteps = new FootstepClock();
    this.abort = new AbortController();
    this.keys = new Set();
    this.axis = { x: 0, y: 0 };
    this.joyId = null;
    this.dead = false;
    this.paused = true;
    this.attacking = false;
    this.dodgeRequested = false;
    this.traveling = false;
    this.requireCampExit = true;
    this.collisionEditing = false;
    this.collisionMode = 'block';
    this.collisionRadius = 56 * HILLS_SCALE;
    this.collisionPointer = null;
    this.lastCollisionPoint = null;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch {}
    try { setHillsCollisionPaint(JSON.parse(localStorage.getItem(COLLISION_SAVE) || 'null') || {}); } catch { setHillsCollisionPaint({}); }
    this.journey = new DandelionHillsJourney(saved);
    this.inventoryState = mergeStarsproutItems(loadStarsproutInventory(), this.journey.inventory);
    this.inventoryState.unlockedBeadSlots = Math.max(this.inventoryState.unlockedBeadSlots, this.journey.questStage >= 2 ? 2 : 1);
    this.inventoryState = saveStarsproutInventory(this.inventoryState);
    this.buildUI();
  }

  el(tag, cls = '', text = '', parent = this.root) { const node = document.createElement(tag); node.className = cls; if (text) node.textContent = text; parent.append(node); return node; }
  on(node, type, fn) { node.addEventListener(type, fn, { signal: this.abort.signal }); }
  button(text, fn, parent, cls = '') { const button = this.el('button', cls, text, parent); button.type = 'button'; this.on(button, 'click', fn); return button; }

  buildUI() {
    this.root.classList.add('hills-app');
    const style = this.el('style');
    style.textContent = [
      '.hills-app{position:fixed;inset:0;z-index:10000;overflow:hidden;background:#bfe1d5;color:#fff5d8;font:600 16px "Microsoft JhengHei",sans-serif;touch-action:none;user-select:none;isolation:isolate}.hills-app *{box-sizing:border-box}.hills-app canvas{width:100%;height:100%;display:block}.hills-app button{font:inherit;color:inherit;cursor:pointer;border:1px solid #ffe6ae99;background:#28584fe8;border-radius:16px;min-height:46px;padding:9px 15px;touch-action:none}.hills-app button:active{transform:scale(.96)}',
      '.hills-app .top{position:absolute;top:max(11px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));right:max(14px,env(safe-area-inset-right));display:flex;justify-content:space-between;align-items:start;gap:10px;pointer-events:none}.hills-app .brand{background:#244e43e8;border:1px solid #f7dda877;border-radius:20px;padding:10px 16px;max-width:59%;box-shadow:0 7px 24px #163f3733}.hills-app .eyebrow{font-size:10px;letter-spacing:2px;color:#d7e8c6}.hills-app h1{font-size:23px;margin:2px 0 4px}.hills-app .objective{font-size:13px;color:#fff0bd}.hills-app .nav{display:flex;gap:7px;pointer-events:auto}.hills-app .nav button{font-size:13px;padding:8px 12px}',
      '.hills-app .joy{position:absolute;bottom:max(23px,env(safe-area-inset-bottom));left:max(27px,env(safe-area-inset-left));width:126px;height:126px;border-radius:50%;border:2px solid #fff4cf99;background:#28584f66;touch-action:none}.hills-app .knob{position:absolute;width:54px;height:54px;left:34px;top:34px;border-radius:50%;background:#e6edcfe8;border:2px solid #fff8dd;pointer-events:none}.hills-app .joylabel{position:absolute;bottom:-19px;width:100%;text-align:center;font-size:11px}.hills-app .actions{position:absolute;right:max(23px,env(safe-area-inset-right));bottom:max(22px,env(safe-area-inset-bottom));width:205px;height:178px}.hills-app .actions button{position:absolute;border-radius:50%;width:73px;height:73px;padding:5px;font-size:14px;line-height:1.25;box-shadow:0 5px 17px #183b3733}.hills-app .attack{right:0;bottom:0;width:104px!important;height:104px!important;background:#a77838ed!important;border:2px solid #ffe09a!important;font-size:17px!important}.hills-app .dodge{left:0;bottom:3px}.hills-app .interact{right:8px;top:0;background:#497769ed!important}',
      '.hills-app .vitals{position:absolute;left:50%;bottom:max(19px,env(safe-area-inset-bottom));transform:translateX(-50%);background:#244e43dc;border-radius:17px;padding:8px 17px;text-align:center;pointer-events:none;min-width:250px}.hills-app .hearts{font-size:20px;color:#ffb5bd;letter-spacing:2px}.hills-app .bag{font-size:12px;color:#ffe8aa;margin-top:3px}.hills-app .gather{height:7px;background:#183f37;border-radius:5px;margin-top:6px;overflow:hidden;display:none}.hills-app .gather span{display:block;height:100%;width:0;background:#ffe27c}.hills-app .context{position:absolute;left:50%;bottom:122px;transform:translateX(-50%);padding:8px 15px;background:#244e43e8;border:1px solid #ffe5a888;border-radius:13px;white-space:nowrap;pointer-events:none}.hills-app .toast{position:absolute;left:50%;top:21%;transform:translateX(-50%);padding:11px 20px;background:#244e43ef;border:1px solid #ffe2a6;border-radius:16px;text-align:center;max-width:68%;opacity:0;transition:opacity .15s;pointer-events:none;box-shadow:0 8px 28px #163f3744}',
      '.hills-app .quickbar{position:absolute;left:50%;bottom:max(101px,calc(env(safe-area-inset-bottom) + 82px));transform:translateX(-50%);display:flex;gap:6px;padding:7px;background:#1d463ee8;border:1px solid #f7d99a88;border-radius:17px;box-shadow:0 8px 24px #143a3444}.hills-app .quickslot{position:relative;width:55px;height:55px;min-height:55px!important;padding:3px!important;border-radius:12px!important;background:#fff5d821!important;color:#fff3c5!important}.hills-app .quickslot .icon{display:block;font-size:24px;line-height:28px}.hills-app .quickslot .count{position:absolute;right:5px;bottom:2px;font-size:12px;text-shadow:0 2px 3px #173c35}.hills-app .quickslot .key{position:absolute;left:5px;top:2px;font-size:9px;color:#d5e4c3}.hills-app .quickslot.empty{opacity:.42}',
      '.hills-app .collision-tools{position:absolute;z-index:6;left:50%;bottom:18px;transform:translateX(-50%);display:none;align-items:center;gap:7px;padding:9px;background:#173f38ef;border:2px solid #ffe2a6;border-radius:18px;box-shadow:0 8px 32px #102d2999}.hills-app .collision-tools.show{display:flex}.hills-app .collision-tools button{min-height:42px;padding:7px 11px;font-size:12px}.hills-app .collision-tools button.active{background:#b87937;color:#fff;border-color:#fff1bf}.hills-app .collision-note{font-size:11px;max-width:150px;line-height:1.3;color:#fff0bd}.hills-app.collision-mode .joy,.hills-app.collision-mode .actions,.hills-app.collision-mode .quickbar,.hills-app.collision-mode .vitals,.hills-app.collision-mode .context{display:none}',
      '.hills-app .modal{position:absolute;inset:0;background:#173c35a8;display:flex;justify-content:center;align-items:center;padding:18px;backdrop-filter:blur(4px);z-index:4}.hills-app .card{width:min(740px,94%);max-height:92%;overflow:auto;background:#fff7df;color:#315747;border:3px solid #caae6b;border-radius:28px;padding:25px 33px;box-shadow:0 20px 80px #17372f77}.hills-app h2{font-size:27px;margin:0 0 13px}.hills-app .body{font-size:18px;line-height:1.7;white-space:pre-line}.hills-app .choices{display:flex;flex-wrap:wrap;gap:11px;margin-top:18px}.hills-app .choices button{flex:1;color:#fff7d8;background:#3c6956;min-width:130px;min-height:52px}.hills-app .loading,.hills-app .rotate{position:absolute;inset:0;display:grid;place-items:center;background:#214d43;font-size:23px;padding:38px;text-align:center;z-index:7}.hills-app .rotate{display:none;white-space:pre-line}',
      '@media(max-height:520px){.hills-app .top{top:6px;left:9px;right:9px}.hills-app .brand{padding:7px 10px}.hills-app h1{font-size:18px;margin:1px 0}.hills-app .eyebrow{font-size:8px}.hills-app .objective{font-size:10px}.hills-app .nav button{font-size:11px;min-height:39px;padding:5px 9px}.hills-app .joy{width:100px;height:100px;bottom:18px;left:19px}.hills-app .knob{width:43px;height:43px;left:27px;top:27px}.hills-app .actions{width:170px;height:145px;right:15px;bottom:12px}.hills-app .actions button{width:60px;height:60px;font-size:11px}.hills-app .attack{width:82px!important;height:82px!important;font-size:14px!important}.hills-app .vitals{padding:5px 10px;bottom:11px;min-width:205px}.hills-app .hearts{font-size:16px}.hills-app .bag{font-size:10px}.hills-app .quickbar{bottom:78px;padding:4px;gap:3px}.hills-app .quickslot{width:44px;height:44px;min-height:44px!important}.hills-app .quickslot .icon{font-size:19px;line-height:22px}.hills-app .context{bottom:91px;font-size:12px}.hills-app .toast{font-size:13px;top:23%}.hills-app .card{padding:16px 22px}.hills-app h2{font-size:22px}.hills-app .body{font-size:15px;line-height:1.5}.hills-app .choices{margin-top:10px}.hills-app .choices button{min-height:42px;font-size:13px}.hills-app .collision-tools{left:8px;right:8px;bottom:7px;transform:none;justify-content:center;gap:4px;padding:5px}.hills-app .collision-tools button{font-size:10px;padding:5px 7px;min-height:36px}.hills-app .collision-note{display:none}}'
    ].join('');
    style.textContent += '\n.hills-app {font-family:"Arial Rounded MT Bold","Microsoft JhengHei",sans-serif}\n.hills-app .quickbar{left:auto;bottom:auto;right:max(16px,env(safe-area-inset-right));top:84px;transform:none;gap:8px;padding:9px;background:#fff3ddec;border:3px solid #cda46a;border-radius:23px}\n.hills-app .quickslot{width:68px;height:70px;min-height:70px!important;border:2px solid #c69c60!important;background:#fffaf0!important;color:#674b32!important;box-shadow:inset 0 -4px #eedbb8}\n.hills-app .quickslot .icon{font-size:32px;line-height:36px}.hills-app .quickslot .count{font-size:18px;color:#674b32;text-shadow:none}.hills-app .quickslot .key{font-size:14px;color:#796346}.hills-app .quickslot.empty{opacity:.75}\n.hills-app .nav button{font-size:16px;min-height:46px}.hills-app .objective{font-size:16px}.hills-app .eyebrow{font-size:14px;letter-spacing:1px}.hills-app .joylabel{font-size:15px}.hills-app .actions button{font-size:17px}.hills-app .toast{font-size:19px}.hills-app .context{font-size:17px;bottom:130px}.hills-app .bag{font-size:16px}\n.hills-app .vitals{min-width:0;width:340px;border:2px solid #d1b172;padding:10px 14px;border-radius:24px;background:#fff3e3f2;color:#674c38}.hills-app .vitals .bag{color:#674c38}.hills-app .vitals .bag:last-of-type{display:none}\n.hills-app .resource-row{display:flex;justify-content:space-between;gap:16px}.hills-app .resource-group{display:flex;gap:5px;align-items:center}.hills-app .resource-icon{width:38px;height:38px;filter:drop-shadow(0 2px 1px #88664444)}.hills-app .resource-icon.empty{opacity:.22;filter:grayscale(1)}\n@media(max-height:520px){.hills-app .quickbar{top:70px;padding:6px}.hills-app .quickslot{width:58px;height:62px;min-height:62px!important}.hills-app .nav button{padding:7px 9px;font-size:15px}.hills-app .brand{max-width:48%}.hills-app h1{font-size:20px}.hills-app .objective{font-size:14px}.hills-app .vitals{width:310px;padding:6px 10px}.hills-app .resource-icon{width:32px;height:32px}.hills-app .vitals .bag{font-size:14px}.hills-app .toast{font-size:17px}.hills-app .actions button{font-size:15px}.hills-app .attack{font-size:17px!important}}\n';
    style.textContent += '.hills-app.player-downed .top,.hills-app.player-downed .actions,.hills-app.player-downed .joy,.hills-app.player-downed .quickbar{pointer-events:none;opacity:.5}';
    this.canvas = this.el('canvas'); this.canvas.setAttribute('aria-label', '幻界・微光星芽谷・晨曦蒲公英丘陵');
    const top = this.el('div', 'top'), brand = this.el('div', 'brand', '', top);
    this.el('div', 'eyebrow', '幻界 · 微光星芽谷', brand); this.el('h1', '', '晨曦蒲公英丘陵', brand); this.objective = this.el('div', 'objective', '', brand);
    const nav = this.el('div', 'nav', '', top); this.button('手帳', () => this.journal(), nav); this.button('背包', () => this.backpack(), nav); this.button('碰撞', () => this.openCollisionEditor(), nav); this.mapButton = this.button('鳥瞰', () => { if (!this.world) return; this.world.overview = !this.world.overview; this.mapButton.textContent = this.world.overview ? '跟隨' : '鳥瞰'; }, nav); this.button('暫停', () => this.pause(), nav);
    this.joy = this.el('div', 'joy'); this.knob = this.el('div', 'knob', '', this.joy); this.el('div', 'joylabel', '拖曳移動', this.joy);
    const actions = this.el('div', 'actions'); this.dodgeButton = this.button('✧\n閃步', () => { this.dodgeRequested = true; }, actions, 'dodge'); this.interactButton = this.button('互動', () => this.interact(), actions, 'interact'); this.attackButton = this.button('✦\n魔法斬', () => {}, actions, 'attack');
    const vitals = this.el('div', 'vitals'); this.hearts = this.el('div', 'resource-row', '', vitals); this.resourceIcons = buildResourceIcons(this.hearts); this.shield = this.el('div', 'bag', '', vitals); this.bag = this.el('div', 'bag', '', vitals); this.bag.style.display = 'none'; this.gatherBar = this.el('div', 'gather', '', vitals); this.gatherFill = this.el('span', '', '', this.gatherBar);
    this.quickbar = this.el('div', 'quickbar');
    this.quickSlots = QUICK_ITEMS.map((name, index) => {
      const slot = this.button('', () => this.itemDetails(name), this.quickbar, 'quickslot');
      this.el('span', 'key', String(index + 1), slot); this.el('span', 'icon', ITEM_META[name]?.[0] || '🎒', slot); this.el('span', 'count', '0', slot);
      slot.title = name; return slot;
    });
    this.collisionTools = this.el('div', 'collision-tools');
    this.el('div', 'collision-note', '橙線＝既有阻擋\n橡皮擦可直接刪除橙線', this.collisionTools);
    this.collisionButtons = {};
    for (const [mode, label] of [['block', '紅色阻擋筆'], ['pass', '綠色通行筆'], ['erase', '橡皮擦']]) this.collisionButtons[mode] = this.button(label, () => this.setCollisionMode(mode), this.collisionTools);
    this.button('筆刷－', () => this.changeCollisionRadius(-16), this.collisionTools); this.collisionSize = this.el('span', 'collision-note', '', this.collisionTools); this.button('筆刷＋', () => this.changeCollisionRadius(16), this.collisionTools);
    this.button('匯出JSON', () => this.exportCollision(), this.collisionTools); this.button('全部還原', () => this.clearCollision(), this.collisionTools); this.button('完成／試走', () => this.closeCollisionEditor(), this.collisionTools);
    this.context = this.el('div', 'context'); this.toast = this.el('div', 'toast'); this.loading = this.el('div', 'loading', '正在讓晨曦吹過蒲公英丘陵…'); this.rotate = this.el('div', 'rotate', '請將手機橫放\n左手移動，右手戰鬥與互動。');
    this.bindInput(); this.hud();
  }

  bindInput() {
    this.on(this.canvas, 'pointerdown', (event) => {
      if (!this.collisionEditing) return;
      event.preventDefault(); this.collisionPointer = event.pointerId; this.canvas.setPointerCapture(event.pointerId); this.paintCollision(event, true);
    });
    this.on(this.canvas, 'pointermove', (event) => {
      if (!this.collisionEditing) return;
      const point = this.world?.screenToWorld(event.clientX, event.clientY);
      this.world?.setCollisionEditor({ cursor: point });
      if (event.pointerId === this.collisionPointer) this.paintCollision(event, false);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.on(this.canvas, type, (event) => {
      if (event.pointerId === this.collisionPointer) { this.collisionPointer = null; this.lastCollisionPoint = null; this.saveCollision(); }
    });
    this.on(this.joy, 'pointerdown', (event) => { if (this.paused || this.joyId !== null) return; event.preventDefault(); this.joyId = event.pointerId; this.joy.setPointerCapture(event.pointerId); this.joystick(event); });
    this.on(this.joy, 'pointermove', (event) => { if (event.pointerId === this.joyId) this.joystick(event); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.on(this.joy, type, (event) => { if (event.pointerId === this.joyId) this.resetJoystick(); });
    this.on(this.attackButton, 'pointerdown', (event) => { if (this.paused) return; event.preventDefault(); this.attackId = event.pointerId; this.attackButton.setPointerCapture(event.pointerId); this.attacking = true; });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.on(this.attackButton, type, (event) => { if (event.pointerId === this.attackId) { this.attacking = false; this.attackId = null; } });
    this.on(window, 'keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      if (this.journey.downed) return;
      if (event.code === 'Escape') { if (this.inventoryPanel) this.inventoryPanel.close(); else if (this.collisionEditing) this.closeCollisionEditor(); else if (this.modal) this.close(); else this.pause(); return; }
      if (event.code === 'KeyB' && !event.repeat && !this.collisionEditing) { this.backpack(); return; }
      if (event.code === 'KeyM' && !event.repeat && this.world && !this.collisionEditing) { this.world.overview = !this.world.overview; this.mapButton.textContent = this.world.overview ? '跟隨' : '鳥瞰'; return; }
      if (/^Digit[1-3]$/.test(event.code) && !this.collisionEditing) { this.itemDetails(QUICK_ITEMS[Number(event.code.slice(-1)) - 1]); return; }
      if (this.paused) return;
      this.keys.add(event.code);
      if (event.code === 'KeyE') this.interact();
      if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && !event.repeat) this.dodgeRequested = true;
    });
    this.on(window, 'keyup', (event) => this.keys.delete(event.code));
    this.on(window, 'blur', () => this.pause()); this.on(document, 'visibilitychange', () => { if (document.hidden) this.pause(); }); this.on(window, 'resize', () => this.resize());
  }

  joystick(event) { const rect = this.joy.getBoundingClientRect(), dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2, length = Math.hypot(dx, dy), max = rect.width * .34; this.axis = length < 6 ? { x: 0, y: 0 } : { x: dx / Math.max(max, length), y: dy / Math.max(max, length) }; this.knob.style.transform = `translate(${this.axis.x * max}px,${this.axis.y * max}px)`; }
  resetJoystick() { this.joyId = null; this.axis = { x: 0, y: 0 }; this.knob.style.transform = ''; }
  clearInput() { this.resetJoystick(); this.keys.clear(); this.attacking = false; this.attackId = null; this.dodgeRequested = false; }
  resize() { const rect = this.root.getBoundingClientRect(); this.world?.resize(rect.width, rect.height); const portrait = rect.height > rect.width; this.rotate.style.display = portrait ? 'grid' : 'none'; if (portrait) { this.paused = true; this.clearInput(); } }

  async start() {
    try {
      this.world = new DandelionHillsWorld(this.canvas); await this.world.load(); if (this.dead) return;
      this.loading.remove(); this.loading = null; this.resize();
      this.world.camera = { x: this.journey.player.x, y: this.journey.player.y - 70 };
      this.root.classList.toggle('player-downed', this.journey.downed);
    if (this.journey.downed) this.clearInput();
    this.world.render(this.journey, 0, { x: 0, y: 0 }, false);
      let welcomed = this.journey.mouseProgress > 0 || this.journey.tutorialLoot;
      try { welcomed ||= localStorage.getItem('forest_hills_welcomed_v1') === '1'; } catch {}
      if (!welcomed) this.dialog('晨曦蒲公英丘陵', '星光棒凝聚魔法劍，向前劈下時才會命中。斬擊完整結束前無法移動或防禦。\n\n不攻擊時，面向來襲方向會自動格擋；盾牌耐久歸零將原地暈眩2秒。\n\n波波鼠不會還手，先試著靠近牠練習吧。', [['開始試煉', () => {
        try { localStorage.setItem('forest_hills_welcomed_v1', '1'); } catch {}
        this.close();
      }]]);
      else if (!this.portalArrival) this.close();
      this.last = performance.now(); this.frame = requestAnimationFrame((time) => this.tick(time));
      return true;
    } catch (error) {
      console.error('Dandelion Hills load failed', error); this.loading?.remove(); this.loading = null;
      this.dialog('丘陵尚未成功載入', '請確認丘陵背景與五種怪物素材已完整安裝。', [['返回星芽營地', () => this.onTravel('camp')]]);
    }
  }

  tick(time) {
    if (this.dead) return;
    const dt = Math.min(.05, Math.max(0, (time - this.last) / 1000)); this.last = time;
    let axis = { x: 0, y: 0 }, moving = false;
    if (!this.paused) {
      axis = { x: this.axis.x + Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')), y: this.axis.y + Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) };
      if (this.world.overview && (Math.hypot(axis.x,axis.y)>.12 || this.attacking || this.keys.has('KeyJ') || this.keys.has('Space'))) {
        this.world.overview=false;this.mapButton.textContent='鳥瞰';
        this.world.camera={x:this.journey.player.x,y:this.journey.player.y-70};
      }
      moving = this.journey.update(dt, axis, this.attacking || this.keys.has('KeyJ') || this.keys.has('Space'), this.dodgeRequested); this.dodgeRequested = false;
      this.flush(); if (this.journey.dirty || time - (this.lastSave || 0) > 5000) { this.save(); this.journey.dirty = false; this.lastSave = time; } this.hud();
      const camp = this.journey.nearby();
      const campPortal = camp?.kind === 'portal' && camp.id === 'camp';
      if (this.requireCampExit && !campPortal) this.requireCampExit = false;
      if (!this.requireCampExit && !this.traveling && this.journey.attackWindow <= 0 && this.journey.stunned <= 0 && campPortal && axis.y > .12) {
        this.travelTo('camp');
        return;
      }
    }
    if (this.footsteps.update(this.journey.player, !this.paused && moving)) safeCue(this.onSound, 'stepGrass');
    this.root.classList.toggle('player-downed', this.journey.downed);
    if (this.journey.downed) this.clearInput();
    this.world.render(this.journey, this.paused ? 0 : dt, axis, moving);
    if (this.toastUntil && time > this.toastUntil) this.toast.style.opacity = '0';
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  flush() {
    for (const effect of this.journey.effects.splice(0)) {
      if (effect.kind === 'playerDownReady') {
        this.dialog('先趴一下，休息一下…', '阿晨晨累倒了，星芽微光會帶你回到門口。\n任務進度與背包物品都會保留。', [['✦ 回到門口', () => { if (this.journey.revive()) { this.requireCampExit = true; this.save(); this.close(); } }]]);
        continue;
      }
      if (effect.kind === 'sound') { safeCue(this.onSound, effect.name); continue; }
      if (effect.kind === 'hit') {
        const type = effect.type || this.journey.mobs.find(m => m.id === effect.target)?.type;
        safeCue(this.onSound, type === 'mouse' ? 'mouseHit' : type === 'mole' ? 'moleHit' : type === 'dew' ? 'dewHit' : 'creatureHit');
      }
      this.world.consumeEffect(effect);
    }
    for (const message of this.journey.messages.splice(0)) {
      if (message.sound) {
        try { this.onSound(message.sound); }
        catch (error) { console.warn('Dandelion Hills sound cue skipped:', message.sound, error); }
      }
      if (message.text.startsWith('MAIN_')) this.dialog(message.text.split('！')[0], message.text, [['繼續探索', () => this.close()]]);
      else this.notify(message.text);
    }
  }

  hud() {
    const j = this.journey; this.objective.textContent = j.objective(); updateResourceIcons(this.resourceIcons, j.hp, j.mana);
    this.shield.textContent = j.stunned > 0 ? `💥 破防暈眩 ${j.stunned.toFixed(1)}秒` : `🛡 盾牌耐久 ${Math.ceil(j.shieldDurability)}/${j.shieldMax}${j.attackWindow > 0 ? ' · 攻擊中無法防禦' : ''}`;
    this.bag.textContent = `橡果 ${j.itemCount('香脆橡果')} · 星芽膠 ${j.itemCount('純淨星芽膠')} · 靈珠 ${Object.keys(j.inventory).filter((key) => key.includes('珠')).reduce((sum, key) => sum + j.itemCount(key), 0)}`;
    this.dodgeButton.textContent = `✧\n閃步${j.dodgeCooldown > 0 ? ' ' + Math.ceil(j.dodgeCooldown) : ''}`;
    this.attackButton.textContent = `✦\n魔法斬${j.attackCooldown > 0 ? ' ' + j.attackCooldown.toFixed(1) : ''}`;
    this.attackButton.style.opacity = j.blind > 0 || j.stunned > 0 || j.attackCooldown > 0 ? '.45' : '1';
    const nearby = j.nearby(); this.context.style.display = nearby ? 'block' : 'none'; this.context.textContent = nearby ? `E／互動 · ${nearby.name}` : '';
    this.interactButton.textContent = nearby?.kind === 'gather' ? '採集' : nearby?.kind === 'portal' ? '前往' : '互動';
    this.gatherBar.style.display = j.gather ? 'block' : 'none'; this.gatherFill.style.width = j.gather ? `${Math.min(100, j.gather.elapsed / j.gather.duration * 100)}%` : '0';
    this.quickSlots?.forEach((slot, index) => {
      const count = j.itemCount(QUICK_ITEMS[index]); slot.querySelector('.count').textContent = String(count); slot.classList.toggle('empty', count <= 0);
    });
  }

  interact() {
    if (this.paused) return;
    if (this.journey.attackWindow > 0) { this.notify('斬擊結束後就能互動。'); return; }
    if (this.journey.stunned > 0) { this.notify('破防暈眩中，暫時無法互動。'); return; }
    const result = this.journey.interact();
    if (result.travel) this.dialog(result.title, result.message, [['確認返回', () => this.travelTo(result.travel)], ['留下探索', () => this.close()]]);
    else if (result.title) this.dialog(result.title, result.message, [['知道了', () => this.close()]]);
    else if (result.message) this.notify(result.message);
    this.hud();
  }

  openCollisionEditor() {
    if (this.loading || !this.world) return;
    this.modal?.remove(); this.modal = null; this.paused = true; this.clearInput(); this.collisionEditing = true;
    this.root.classList.add('collision-mode'); this.collisionTools.classList.add('show');
    this.world.setCollisionEditor({ enabled: true, mode: this.collisionMode, radius: this.collisionRadius, cursor: null });
    this.setCollisionMode(this.collisionMode);
    this.notify('直接在地圖拖曳標記；完成後按「完成／試走」。');
  }

  closeCollisionEditor() {
    if (!this.collisionEditing) return;
    this.saveCollision(); this.collisionEditing = false; this.collisionPointer = null; this.lastCollisionPoint = null;
    this.root.classList.remove('collision-mode'); this.collisionTools.classList.remove('show');
    this.world?.setCollisionEditor({ enabled: false, cursor: null });
    this.paused = false; this.last = performance.now(); this.notify('碰撞標記已保存，現在可立即試走。');
  }

  setCollisionMode(mode) {
    this.collisionMode = mode;
    for (const [key, button] of Object.entries(this.collisionButtons || {})) button.classList.toggle('active', key === mode);
    if (this.collisionSize) this.collisionSize.textContent = `${Math.round(this.collisionRadius / HILLS_SCALE)}`;
    this.world?.setCollisionEditor({ mode, radius: this.collisionRadius });
  }

  changeCollisionRadius(delta) {
    this.collisionRadius = Math.max(24 * HILLS_SCALE, Math.min(112 * HILLS_SCALE, this.collisionRadius + delta * HILLS_SCALE));
    this.setCollisionMode(this.collisionMode);
  }

  paintCollision(event, force = false) {
    const point = this.world?.screenToWorld(event.clientX, event.clientY);
    if (!point) return;
    this.world.setCollisionEditor({ cursor: point });
    if (!force && this.lastCollisionPoint && Math.hypot(point.x - this.lastCollisionPoint.x, point.y - this.lastCollisionPoint.y) < this.collisionRadius * .42) return;
    if (this.collisionMode === 'erase') {
      eraseHillsCollisionMarks(point.x, point.y, this.collisionRadius);
      disableHillsObstaclesAt(point.x, point.y, this.collisionRadius);
    }
    else addHillsCollisionMark(this.collisionMode, { x: point.x, y: point.y, r: this.collisionRadius });
    this.lastCollisionPoint = point;
  }

  saveCollision() {
    try { localStorage.setItem(COLLISION_SAVE, JSON.stringify({ v: 1, ...getHillsCollisionPaint() })); }
    catch { this.notify('瀏覽器無法保存碰撞標記，請先匯出 JSON。'); }
  }

  exportCollision() {
    const data = JSON.stringify({ v: 1, map: '晨曦蒲公英丘陵', ...getHillsCollisionPaint() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = '晨曦蒲公英丘陵_碰撞標記.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); this.notify('碰撞標記 JSON 已匯出。');
  }

  clearCollision() {
    if (!confirm('確定還原全部碰撞？紅、綠標記會清除，被擦除的橙色碰撞也會恢復。')) return;
    setHillsCollisionPaint({}); this.saveCollision(); this.notify('全部碰撞已還原成預設狀態。');
  }

  itemDetails(name) {
    if (!name || this.loading || this.collisionEditing) return;
    const count = this.journey.itemCount(name), [icon, description] = ITEM_META[name] || ['🎒', '在星芽谷旅途中取得的物品。'];
    this.dialog(`${icon} ${name} ×${count}`, count ? description : `${description}\n\n目前尚未取得。`, [['查看完整背包', () => this.backpack()], ['繼續冒險', () => this.close()]]);
  }

  save() { try { localStorage.setItem(SAVE, JSON.stringify(this.journey.export())); this.inventoryState = mergeStarsproutItems(this.inventoryState, this.journey.inventory); this.inventoryState.unlockedBeadSlots = Math.max(this.inventoryState.unlockedBeadSlots, this.journey.questStage >= 2 ? 2 : 1); this.inventoryState = saveStarsproutInventory(this.inventoryState); } catch { this.notify('目前無法保存進度，請先不要關閉頁面。'); } }
  travelTo(target) { if (this.journey.downed || this.traveling || this.journey.attackWindow > 0 || this.journey.stunned > 0) return; this.traveling = true; this.paused = true; this.clearInput(); this.save(); this.onTravel(target); }
  notify(text) { this.toast.textContent = text; this.toast.style.opacity = '1'; this.toastUntil = performance.now() + 3800; }
  dialog(title, text, choices) { this.paused = true; this.clearInput(); this.modal?.remove(); this.modal = this.el('div', 'modal'); const card = this.el('div', 'card', '', this.modal); this.el('h2', '', title, card); this.el('div', 'body', text, card); const buttons = this.el('div', 'choices', '', card); for (const choice of choices) this.button(choice[0], choice[1], buttons); return card; }
  close() { if (this.journey.downed) return; if (this.root.clientHeight > this.root.clientWidth) return; this.modal?.remove(); this.modal = null; this.clearInput(); this.paused = false; this.last = performance.now(); }
  pause() { if (this.dead || this.loading) return; if (this.modal) return; this.dialog('在蒲公英花田休息', this.journey.objective() + '\n目前進度已自動保存。', [['繼續', () => this.close()], ['返回星芽營地', () => this.travelTo('camp')], ['返回遊戲列表', () => this.onExit()]]); }
  backpack() {
    if (this.loading || this.collisionEditing || this.inventoryPanel) return;
    this.modal?.remove(); this.modal = null; this.paused = true; this.clearInput();
    this.inventoryState = mergeStarsproutItems(this.inventoryState, this.journey.inventory);
    this.inventoryPanel = new StarsproutInventoryPanel(this.root, {
      state: this.inventoryState,
      onChange: (state) => { this.inventoryState = saveStarsproutInventory(state); },
      onNotice: (message) => this.notify(message),
      onClose: (state) => { this.inventoryState = saveStarsproutInventory(state); this.inventoryPanel = null; this.paused = false; this.last = performance.now(); }
    });
  }
  journal() {
    if (this.loading) return;
    const j = this.journey, species = Object.entries(MOB_TYPES).map(([id, mob]) => `${mob.elite ? '★' : '•'} ${mob.name}｜${mob.level}`).join('\n');
    this.dialog('晨曦丘陵探險手帳', `${j.objective()}\n\n戰鬥\n魔法斬會朝面前劈下；斬擊完整結束前不能移動或防禦。不攻擊時面向敵方攻擊即可自動格擋，盾牌耐久歸零會破防並原地暈眩2秒。Shift／閃步可短暫避開攻擊。\n\n警戒圈\n黃色＝被動或尚未敵對；紅色＝正在攻擊你。\n\n掉落\n光團彈跳兩次後懸浮；靠近1.5格會自動磁吸。柔白＝普通、明黃＝任務、星藍＝稀有靈珠。\n\n生物\n${species}\n\n蒲公英大遷徙期間，晨曦蒲公英採集量加倍。`, [['回到探索', () => this.close()], ['重玩丘陵任務', () => this.dialog('重新開始丘陵進度？', '只重設丘陵任務與素材，不影響星芽營地。', [['取消', () => this.journal()], ['確認重玩', () => { this.journey = new DandelionHillsJourney(); this.save(); this.hud(); this.close(); }]])]]);
  }

  dispose() { this.dead = true; cancelAnimationFrame(this.frame); this.abort.abort(); this.clearInput(); if (this.inventoryPanel) { this.inventoryPanel.style.remove(); this.inventoryPanel.overlay.remove(); this.inventoryPanel = null; } this.world?.dispose(); this.root.remove(); }
}
