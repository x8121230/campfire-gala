import { loadSkillResource, saveSkillResource, regenerateSkillResource } from './RealmSkillResource.js';
import { FootstepClock, safeCue } from './RealmSoundEffects.js';
import { RealmWorld } from './RealmWorld.js';
import { RealmJourney, SPOTS, WORLD_SCALE, addCampCollisionMark, collisionStrokePoints, disableCampObstaclesAt, eraseCampCollisionMarks, getCampCollisionPaint, setCampCollisionPaint } from './RealmRules.js';
import { appendItemArt, ITEM_CATALOG, STARSPROUT_QUICK_ITEMS, loadStarsproutInventory, mergeStarsproutItems, saveStarsproutInventory } from './StarsproutInventory.js';
import { StarsproutInventoryPanel } from './StarsproutInventoryPanel.js';

const SAVE = 'forest_starsprout_camp_v2';
const COLLISION_SAVE = 'forest_starsprout_camp_collision_v1';
const COLLISION_LAYOUT_VERSION = 2;

export class RealmApp {
  constructor(root, { onExit = () => {}, onTravel = () => {}, onSound = () => {}, entry = '', portalArrival = false } = {}) {
    this.root = root;
    this.onExit = onExit;
    this.onTravel = onTravel;
    this.portalArrival = portalArrival;
    this.entry = entry;
    this.onSound = onSound;
    this.footsteps = new FootstepClock();
    this.abort = new AbortController();
    this.keys = new Set();
    this.axis = { x: 0, y: 0 };
    this.joyId = null;
    this.dead = false;
    this.paused = true;
    this.traveling = false;
    this.requireGateExit = entry === 'northGate';
    this.gateDwell = 0;
    this.storageOK = true;
    this.collisionEditing = false; this.collisionMode = 'block'; this.collisionRadius = 56 * WORLD_SCALE; this.collisionPointer = null; this.lastCollisionPoint = null;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch {}
    this.journey = new RealmJourney(saved);
    try {
      const collisionSaved = JSON.parse(localStorage.getItem(COLLISION_SAVE) || 'null') || {};
      // v1 disabled indices refer to the old oversized workshop rectangle.
      // Preserve user-painted red/green marks, but remap fixed obstacles from
      // the corrected v2 geometry instead of disabling the wrong new shape.
      setCampCollisionPaint(collisionSaved.v === COLLISION_LAYOUT_VERSION ? collisionSaved : { ...collisionSaved, disabled: [] });
    } catch { setCampCollisionPaint({}); }
    this.skillResource = loadSkillResource();
    this.inventoryState = mergeStarsproutItems(loadStarsproutInventory(), { '甜蘋果': this.journey.apples, ...(this.journey.robe ? { '星芽旅行者套裝': 1 } : {}) });
    this.inventoryState = saveStarsproutInventory(this.inventoryState);
    if (entry === 'northGate') this.journey.player = { x: SPOTS.northGate.x, y: SPOTS.northGate.y + 96 };
    this.buildUI();
  }

  el(tag, cls = '', text = '', parent = this.root) {
    const element = document.createElement(tag);
    element.className = cls;
    if (text) element.textContent = text;
    parent.append(element);
    return element;
  }

  on(element, type, fn) {
    element.addEventListener(type, fn, { signal: this.abort.signal });
  }

  button(text, fn, parent, cls = '') {
    const button = this.el('button', cls, text, parent);
    button.type = 'button';
    this.on(button, 'click', fn);
    return button;
  }

  buildUI() {
    this.root.classList.add('realm-app', 'starsprout-camp');
    const style = this.el('style');
    style.textContent = [
      '.realm-app{position:fixed;inset:0;z-index:10000;overflow:hidden;background:#bfe1d5;color:#fff4d5;font:600 17px "Microsoft JhengHei",sans-serif;touch-action:none;user-select:none;isolation:isolate}',
      '.realm-app *{box-sizing:border-box}.realm-app canvas{width:100%;height:100%;display:block}.realm-app button{font:inherit;color:inherit;cursor:pointer;border:1px solid #f6dfaa88;background:#28584fe8;border-radius:16px;min-height:46px;padding:10px 18px;touch-action:none}.realm-app button:active{transform:scale(.96);background:#73936d}.realm-app button:disabled{opacity:.5}',
      '.realm-app .top{position:absolute;top:max(12px,env(safe-area-inset-top));left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));display:flex;align-items:start;justify-content:space-between;gap:10px;pointer-events:none}.realm-app .brand{background:#244e43e8;border:1px solid #f6dda977;border-radius:20px;padding:11px 17px;max-width:58%;box-shadow:0 7px 24px #163f3733}.realm-app .eyebrow{font-size:11px;letter-spacing:2px;color:#d7e8c6}.realm-app h1{margin:2px 0 5px;font-size:24px}.realm-app .objective{font-size:14px;color:#fff0bd}.realm-app .topnav{display:flex;gap:7px;pointer-events:auto}.realm-app .topnav button{font-size:14px;padding:9px 13px}',
      '.realm-app .bottom{position:absolute;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);background:#244e43d9;border-radius:17px;padding:8px 16px;text-align:center;font-size:12px;max-width:46%;pointer-events:none}.realm-app .inventory{color:#ffe3a0;margin-bottom:4px}.realm-app .toast{position:absolute;left:50%;top:22%;transform:translateX(-50%);padding:12px 22px;background:#244e43ef;border:1px solid #ffe2a6;border-radius:16px;text-align:center;max-width:70%;opacity:0;transition:opacity .15s;pointer-events:none;box-shadow:0 8px 28px #163f3744}',
      '.realm-app .joy{position:absolute;bottom:max(23px,env(safe-area-inset-bottom));left:max(27px,env(safe-area-inset-left));width:130px;height:130px;border-radius:50%;border:2px solid #fff4cf99;background:#28584f66;box-shadow:inset 0 0 30px #ffffff18;touch-action:none}.realm-app .knob{position:absolute;width:56px;height:56px;left:35px;top:35px;border-radius:50%;background:#e6edcfe8;border:2px solid #fff8dd;pointer-events:none}.realm-app .joylabel{position:absolute;bottom:-19px;width:100%;text-align:center;font-size:12px;opacity:.9;pointer-events:none}',
      '.realm-app .actions{position:absolute;right:max(25px,env(safe-area-inset-right));bottom:max(25px,env(safe-area-inset-bottom));display:flex;align-items:end;gap:13px}.realm-app .actions button{border-radius:50%;width:78px;height:78px;padding:8px;font-size:16px;box-shadow:0 5px 16px #183b3733}.realm-app .actions .interact{width:106px;height:106px;background:#a87538ed;border:2px solid #ffe09a;font-size:20px}.realm-app .context{position:absolute;bottom:25%;left:50%;transform:translateX(-50%);background:#244e43df;border:1px solid #fff0bc66;border-radius:13px;padding:8px 16px;pointer-events:none;font-size:15px;white-space:nowrap}',
      '.realm-app .quickbar{position:absolute;left:50%;bottom:max(79px,calc(env(safe-area-inset-bottom) + 66px));transform:translateX(-50%);display:flex;gap:6px;padding:7px;background:#1d463ee8;border:1px solid #f7d99a88;border-radius:17px}.realm-app .quickslot{position:relative;width:55px;height:55px;min-height:55px!important;padding:3px!important;border-radius:12px!important;background:#fff5d821!important}.realm-app .quickslot .icon{display:block;font-size:24px}.realm-app .quickslot .count{position:absolute;right:5px;bottom:2px;font-size:11px}.realm-app .quickslot .key{position:absolute;left:5px;top:2px;font-size:9px}.realm-app .quickslot.empty{opacity:.42}',
      '.realm-app .collision-tools{position:absolute;z-index:6;left:50%;bottom:18px;transform:translateX(-50%);display:none;align-items:center;gap:7px;padding:9px;background:#173f38ef;border:2px solid #ffe2a6;border-radius:18px}.realm-app .collision-tools.show{display:flex}.realm-app .collision-tools button{min-height:42px;padding:7px 11px;font-size:12px}.realm-app .collision-tools button.active{background:#b87937}.realm-app .collision-note{font-size:11px;max-width:150px;white-space:pre-line}.realm-app.collision-mode .joy,.realm-app.collision-mode .actions,.realm-app.collision-mode .quickbar,.realm-app.collision-mode .bottom,.realm-app.collision-mode .context{display:none}',
      '.realm-app .modal{position:absolute;inset:0;background:#173c35a8;display:flex;justify-content:center;align-items:center;padding:18px;backdrop-filter:blur(4px)}.realm-app .card{width:min(720px,94%);max-height:92%;overflow:auto;background:#fff7df;color:#315747;border:3px solid #caae6b;border-radius:28px;padding:25px 33px;box-shadow:0 20px 80px #17372f77}.realm-app h2{font-size:28px;margin:0 0 14px}.realm-app .body{font-size:19px;line-height:1.7;white-space:pre-line}.realm-app .choices{display:flex;flex-wrap:wrap;gap:12px;margin-top:19px}.realm-app .choices button{flex:1;color:#fff7d8;background:#3c6956;min-width:130px;min-height:55px}.realm-app .reward{margin-top:14px;padding:12px 15px;background:#f3e7bd;border-radius:15px;color:#795b25}.realm-app .loading{position:absolute;inset:0;display:grid;place-items:center;background:#214d43;font-size:24px}.realm-app .rotate{position:absolute;inset:0;z-index:5;background:#214d43f5;display:none;align-items:center;justify-content:center;text-align:center;padding:40px;font-size:23px;line-height:1.8}',
      '@media(max-height:500px){.realm-app{font-size:14px}.realm-app .top{top:7px;left:max(9px,env(safe-area-inset-left));right:max(9px,env(safe-area-inset-right))}.realm-app .brand{padding:7px 11px}.realm-app h1{font-size:18px;margin:1px 0 2px}.realm-app .eyebrow{font-size:9px}.realm-app .objective{font-size:11px}.realm-app .topnav button{font-size:12px;min-height:40px;padding:6px 10px}.realm-app .joy{width:104px;height:104px;bottom:20px;left:max(19px,env(safe-area-inset-left))}.realm-app .knob{width:45px;height:45px;left:27px;top:27px}.realm-app .actions{bottom:15px;right:max(17px,env(safe-area-inset-right));gap:9px}.realm-app .actions button{width:64px;height:64px;font-size:13px}.realm-app .actions .interact{width:84px;height:84px;font-size:17px}.realm-app .bottom{font-size:10px;padding:6px 10px;bottom:8px;max-width:42%}.realm-app .card{padding:17px 23px}.realm-app h2{font-size:22px;margin-bottom:7px}.realm-app .body{font-size:16px;line-height:1.52}.realm-app .choices{margin-top:11px}.realm-app .choices button{min-height:44px}.realm-app .context{font-size:12px;bottom:24%}.realm-app .toast{font-size:13px}}'
    ].join('');

    style.textContent += '\n.realm-app {font-family:"Arial Rounded MT Bold","Microsoft JhengHei",sans-serif}\n.realm-app .quickbar{left:auto;bottom:auto;right:max(16px,env(safe-area-inset-right));top:84px;transform:none;gap:8px;padding:9px;background:#fff3ddec;border:3px solid #cda46a;border-radius:23px}\n.realm-app .quickslot{width:68px;height:70px;min-height:70px!important;border:2px solid #c69c60!important;background:#fffaf0!important;color:#674b32!important;box-shadow:inset 0 -4px #eedbb8}\n.realm-app .quickslot .icon{font-size:32px;line-height:36px}.realm-app .quickslot .count{font-size:18px;color:#674b32;text-shadow:none}.realm-app .quickslot .key{font-size:14px;color:#796346}.realm-app .quickslot.empty{opacity:.75}\n.realm-app .nav button{font-size:16px;min-height:46px}.realm-app .objective{font-size:16px}.realm-app .eyebrow{font-size:14px;letter-spacing:1px}.realm-app .joylabel{font-size:15px}.realm-app .actions button{font-size:17px}.realm-app .toast{font-size:19px}.realm-app .context{font-size:17px;bottom:130px}.realm-app .bag{font-size:16px}\n.realm-app .vitals{min-width:0;width:340px;border:2px solid #d1b172;padding:10px 14px;border-radius:24px;background:#fff3e3f2;color:#674c38}.realm-app .vitals .bag{color:#674c38}.realm-app .vitals .bag:last-of-type{display:none}\n.realm-app .resource-row{display:flex;justify-content:space-between;gap:16px}.realm-app .resource-group{display:flex;gap:5px;align-items:center}.realm-app .resource-icon{width:38px;height:38px;filter:drop-shadow(0 2px 1px #88664444)}.realm-app .resource-icon.empty{opacity:.22;filter:grayscale(1)}\n@media(max-height:520px){.realm-app .quickbar{top:70px;padding:6px}.realm-app .quickslot{width:58px;height:62px;min-height:62px!important}.realm-app .nav button{padding:7px 9px;font-size:15px}.realm-app .brand{max-width:48%}.realm-app h1{font-size:20px}.realm-app .objective{font-size:14px}.realm-app .vitals{width:310px;padding:6px 10px}.realm-app .resource-icon{width:32px;height:32px}.realm-app .vitals .bag{font-size:14px}.realm-app .toast{font-size:17px}.realm-app .actions button{font-size:15px}.realm-app .attack{font-size:17px!important}}\n';
    this.canvas = this.el('canvas');
    this.canvas.setAttribute('aria-label', '幻界・微光星芽谷・星芽營地');
    const top = this.el('div', 'top');
    const brand = this.el('div', 'brand', '', top);
    this.el('div', 'eyebrow', '幻界 · 微光星芽谷', brand);
    this.el('h1', '', '星芽營地', brand);
    this.objective = this.el('div', 'objective', '', brand);
    const nav = this.el('div', 'topnav', '', top);
    this.button('手帳', () => this.journal(), nav);
    this.button('背包', () => this.backpack(), nav);
    this.button('碰撞', () => this.openCollisionEditor(), nav);
    this.mapButton = this.button('鳥瞰', () => {
      if (!this.world) return;
      this.world.overview = !this.world.overview;
      this.mapButton.textContent = this.world.overview ? '跟隨' : '鳥瞰';
    }, nav);
    this.hillsButton = this.button('前往丘陵', () => this.openHills(), nav);
    this.button('暫停', () => this.pause(), nav);

    const bottom = this.el('div', 'bottom');
    this.inventory = this.el('div', 'inventory', '', bottom);
    this.spStatus = this.el('div', 'sp-status', '', bottom);
    this.el('div', '', 'WASD／左搖桿移動 · E／互動 · Shift／快走', bottom);
    this.toast = this.el('div', 'toast');
    this.context = this.el('div', 'context');
    this.joy = this.el('div', 'joy');
    this.knob = this.el('div', 'knob', '', this.joy);
    this.el('div', 'joylabel', '拖曳移動', this.joy);
    const actions = this.el('div', 'actions');
    this.runButton = this.button('快走', () => {}, actions);
    this.interactButton = this.button('互動', () => this.interact(), actions, 'interact');
    style.textContent += '.quickslot img.icon{width:46px;height:46px;object-fit:contain;margin:auto;border-radius:8px}';
    this.quickbar = this.el('div', 'quickbar');
    this.quickSlots = STARSPROUT_QUICK_ITEMS.map((name, index) => { const slot = this.button('', () => this.itemDetails(name), this.quickbar, 'quickslot'); this.el('span', 'key', String(index + 1), slot); appendItemArt(slot, name, 'icon'); this.el('span', 'count', '0', slot); slot.title = name; return slot; });
    this.collisionTools = this.el('div', 'collision-tools'); this.el('div', 'collision-note', '橙線＝既有阻擋\n橡皮擦可刪除', this.collisionTools); this.collisionButtons = {};
    for (const [mode, label] of [['block', '紅色阻擋筆'], ['pass', '綠色通行筆'], ['erase', '橡皮擦']]) this.collisionButtons[mode] = this.button(label, () => this.setCollisionMode(mode), this.collisionTools);
    this.button('筆刷－', () => this.changeCollisionRadius(-16), this.collisionTools); this.collisionSize = this.el('span', 'collision-note', '', this.collisionTools); this.button('筆刷＋', () => this.changeCollisionRadius(16), this.collisionTools); this.button('匯出JSON', () => this.exportCollision(), this.collisionTools); this.button('全部還原', () => this.clearCollision(), this.collisionTools); this.button('完成／試走', () => this.closeCollisionEditor(), this.collisionTools);
    this.loading = this.el('div', 'loading', '正在打開星芽營地的繪本…');
    this.rotate = this.el('div', 'rotate', '請將手機橫放\n左手移動，右手互動。');
    this.rotate.style.whiteSpace = 'pre-line';
    this.bindInput();
    this.hud();
  }

  bindInput() {
    this.on(this.canvas, 'pointerdown', (event) => { if (!this.collisionEditing) return; event.preventDefault(); this.collisionPointer = event.pointerId; this.canvas.setPointerCapture(event.pointerId); this.paintCollision(event, true); });
    this.on(this.canvas, 'pointermove', (event) => { if (!this.collisionEditing) return; const point = this.world?.screenToWorld(event.clientX, event.clientY); this.world?.setCollisionEditor({ cursor: point }); if (event.pointerId === this.collisionPointer) this.paintCollision(event); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.on(this.canvas, type, (event) => { if (event.pointerId === this.collisionPointer) { this.collisionPointer = null; this.lastCollisionPoint = null; this.saveCollision(); } });
    this.on(this.joy, 'pointerdown', (event) => {
      if (this.paused || this.joyId !== null) return;
      event.preventDefault();
      this.joyId = event.pointerId;
      this.joy.setPointerCapture(event.pointerId);
      this.joystick(event);
    });
    this.on(this.joy, 'pointermove', (event) => {
      if (event.pointerId === this.joyId) this.joystick(event);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.on(this.joy, type, (event) => {
        if (event.pointerId === this.joyId) this.resetJoystick();
      });
    }
    this.on(this.runButton, 'pointerdown', (event) => {
      if (this.paused) return;
      this.runId = event.pointerId;
      this.runButton.setPointerCapture(event.pointerId);
      this.running = true;
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.on(this.runButton, type, () => { this.running = false; });
    }
    this.on(window, 'keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      if (event.repeat) return;
      if (event.code === 'Escape') {
        if (this.inventoryPanel) this.inventoryPanel.close(); else if (this.collisionEditing) this.closeCollisionEditor(); else if (this.modal) this.close(); else this.pause();
        return;
      }
      if (event.code === 'KeyB' && !event.repeat && !this.collisionEditing) { this.backpack(); return; }
      if (event.code === 'KeyM' && !event.repeat && this.world && !this.collisionEditing) { this.world.overview = !this.world.overview; this.mapButton.textContent = this.world.overview ? '跟隨' : '鳥瞰'; return; }
      if (/^Digit[1-3]$/.test(event.code) && !this.collisionEditing) { this.itemDetails(STARSPROUT_QUICK_ITEMS[Number(event.code.slice(-1)) - 1]); return; }
      if (this.paused) return;
      this.keys.add(event.code);
      if (event.code === 'KeyE' || event.code === 'Space') this.interact();
    });
    this.on(window, 'keyup', (event) => this.keys.delete(event.code));
    this.on(window, 'blur', () => this.pause());
    this.on(document, 'visibilitychange', () => { if (document.hidden) this.pause(); });
    this.on(window, 'resize', () => this.resize());
  }

  joystick(event) {
    const rect = this.joy.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(dx, dy);
    const max = rect.width * .34;
    this.axis = length < 6 ? { x: 0, y: 0 } : {
      x: dx / Math.max(max, length),
      y: dy / Math.max(max, length)
    };
    this.knob.style.transform = 'translate(' + (this.axis.x * max) + 'px,' + (this.axis.y * max) + 'px)';
  }

  resetJoystick() {
    this.joyId = null;
    this.axis = { x: 0, y: 0 };
    this.knob.style.transform = '';
  }

  clearInput() {
    this.resetJoystick();
    this.running = false;
    this.keys.clear();
  }

  resize() {
    const rect = this.root.getBoundingClientRect();
    if (this.world) this.world.resize(rect.width, rect.height);
    const portrait = rect.height > rect.width;
    this.rotate.style.display = portrait ? 'flex' : 'none';
    if (portrait) {
      this.paused = true;
      this.clearInput();
    }
  }

  async start() {
    try {
      this.world = new RealmWorld(this.canvas);
      await this.world.load();
      if (this.dead) return;
      this.loading.remove();
      this.loading = null;
      this.resize();
      this.world.camera = { x: this.journey.player.x, y: this.journey.player.y - 80 };
      this.world.render(this.journey, 0, { x: 0, y: 0 }, false);
      let welcomed = this.entry === 'northGate' || this.journey.stage > 0;
      try { welcomed ||= localStorage.getItem('forest_camp_welcomed_v1') === '1'; } catch {}
      if (!welcomed) {
        this.dialog('歡迎來到微光星芽谷', '你從幻界漩渦輕輕落在星芽營地。\n母樹的鐘聲響起，奧爾登長老正在廣場後方等你。\n\n完成序章後，北門花環會化成通往蒲公英丘陵的傳送門。', [['開始探索', () => {
          try { localStorage.setItem('forest_camp_welcomed_v1', '1'); } catch {}
          this.close();
        }]]);
      } else if (!this.portalArrival) this.close();
      this.last = performance.now();
      this.frame = requestAnimationFrame((time) => this.tick(time));
      return true;
    } catch (error) {
      if (this.dead) return;
      if (this.loading) this.loading.remove();
      this.loading = null;
      console.error('Starsprout Camp load failed', error);
      this.dialog(
        '星芽營地尚未成功載入',
        '請確認星芽營地背景與三位NPC素材已完整安裝。',
        [['返回遊戲列表', () => this.onExit()]]
      );
    }
  }

  tick(time) {
    if (this.dead) return;
    const dt = Math.min(.05, (time - this.last) / 1000);
    this.last = time;
    let axis = { x: 0, y: 0 };
    let moving = false;
    if (!this.paused) {
      if (regenerateSkillResource(this.skillResource, dt)) this.save();
      axis = {
        x: this.axis.x + (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0),
        y: this.axis.y + (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0)
      };
      moving = this.journey.move(dt, axis, this.running || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));
      this.hud();
      const gateDistance = Math.hypot(
        this.journey.player.x - SPOTS.northGate.x,
        this.journey.player.y - SPOTS.northGate.y
      );
      if (this.requireGateExit && gateDistance > SPOTS.northGate.radius + 100) {
        this.requireGateExit = false;
        this.gateDwell = 0;
      }
      const gateReady = !this.requireGateExit && !this.traveling &&
        this.journey.stage >= 3 && gateDistance < SPOTS.northGate.radius;
      this.gateDwell = gateReady ? this.gateDwell + dt : 0;
      if (this.gateDwell >= .25) {
        this.travelToHills();
        return;
      }
    }
    if (this.footsteps.update(this.journey.player, !this.paused && moving)) safeCue(this.onSound, 'stepStone');
    this.world.render(this.journey, this.paused ? 0 : dt, axis, moving);
    if (this.toastUntil && time > this.toastUntil) this.toast.style.opacity = '0';
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  hud() {
    const sp = this.skillResource;
    this.spStatus.textContent = `SP ${sp.mana}/3${sp.mana < 3 ? ' · ' + (5-sp.spRegenElapsed).toFixed(1) + ' 秒後回復' : ' · 魔力充足'}`;
    this.objective.textContent = this.journey.objective();
    this.inventory.textContent = (this.journey.robe ? '星芽旅行者套裝 ✓' : '星芽旅行者套裝 —') + ' · 甜蘋果 ' + this.journey.apples + '/10';
    const id = this.journey.nearby();
    this.context.textContent = id ? 'E／互動 · ' + SPOTS[id].name : '';
    this.context.style.display = id ? 'block' : 'none';
    this.interactButton.textContent = id === 'northGate'
      ? '前往丘陵'
      : id === 'alden' || id === 'bronc' || id === 'phoebe' ? '交談' : '互動';
    this.hillsButton.hidden = this.journey.stage < 3;
    this.quickSlots?.forEach((slot, index) => { const count = this.inventoryState?.items?.[STARSPROUT_QUICK_ITEMS[index]] || 0; slot.querySelector('.count').textContent = String(count); slot.classList.toggle('empty', count <= 0); });
  }

  notify(text) {
    this.toast.textContent = text;
    this.toast.style.opacity = '1';
    this.toastUntil = performance.now() + 4200;
  }

  save() {
    try {
      saveSkillResource(this.skillResource);
      localStorage.setItem(SAVE, JSON.stringify(this.journey.export()));
      this.inventoryState = mergeStarsproutItems(this.inventoryState, { '甜蘋果': this.journey.apples, ...(this.journey.robe ? { '星芽旅行者套裝': 1 } : {}) });
      this.inventoryState = saveStarsproutInventory(this.inventoryState);
      this.storageOK = true;
    } catch {
      this.storageOK = false;
      this.notify('目前無法保存進度；請先不要關閉此頁。');
    }
  }

  backpack() {
    if (this.loading || this.collisionEditing || this.inventoryPanel) return;
    this.modal?.remove(); this.modal = null; this.paused = true; this.clearInput();
    this.inventoryState = mergeStarsproutItems(this.inventoryState, { '甜蘋果': this.journey.apples, ...(this.journey.robe ? { '星芽旅行者套裝': 1 } : {}) });
    this.inventoryPanel = new StarsproutInventoryPanel(this.root, { state: this.inventoryState, onChange: (state) => { this.inventoryState = saveStarsproutInventory(state); }, onNotice: (message) => this.notify(message), onClose: (state) => { this.inventoryState = saveStarsproutInventory(state); this.inventoryPanel = null; this.paused = false; this.last = performance.now(); } });
  }

  itemDetails(name) {
    if (!name || this.loading || this.collisionEditing) return;
    const item = ITEM_CATALOG[name], count = this.inventoryState?.items?.[name] || 0;
    this.dialog(`${item?.icon || '🎒'} ${name} ×${count}`, count ? item?.description : `${item?.description || '星芽谷的冒險物品。'}\n\n目前尚未取得。`, [['查看完整背包', () => { this.close(); this.backpack(); }], ['繼續探索', () => this.close()]]);
  }

  openCollisionEditor() { if (this.loading || !this.world) return; this.modal?.remove(); this.modal = null; this.paused = true; this.clearInput(); this.collisionEditing = true; this.root.classList.add('collision-mode'); this.collisionTools.classList.add('show'); this.world.setCollisionEditor({ enabled: true, mode: this.collisionMode, radius: this.collisionRadius, cursor: null }); this.setCollisionMode(this.collisionMode); this.notify('直接在營地地圖拖曳標記碰撞。'); }
  closeCollisionEditor() { if (!this.collisionEditing) return; this.saveCollision(); this.collisionEditing = false; this.collisionPointer = null; this.lastCollisionPoint = null; this.root.classList.remove('collision-mode'); this.collisionTools.classList.remove('show'); this.world?.setCollisionEditor({ enabled: false, cursor: null }); this.paused = false; this.last = performance.now(); this.notify('營地碰撞已保存，可立即試走。'); }
  setCollisionMode(mode) { this.collisionMode = mode; for (const [key, button] of Object.entries(this.collisionButtons || {})) button.classList.toggle('active', key === mode); if (this.collisionSize) this.collisionSize.textContent = String(Math.round(this.collisionRadius / WORLD_SCALE)); this.world?.setCollisionEditor({ mode, radius: this.collisionRadius }); }
  changeCollisionRadius(delta) { this.collisionRadius = Math.max(24 * WORLD_SCALE, Math.min(112 * WORLD_SCALE, this.collisionRadius + delta * WORLD_SCALE)); this.setCollisionMode(this.collisionMode); }
  paintCollision(event, force = false) {
    const point = this.world?.screenToWorld(event.clientX, event.clientY); if (!point) return;
    this.world.setCollisionEditor({ cursor: point });
    const distance = this.lastCollisionPoint ? Math.hypot(point.x - this.lastCollisionPoint.x, point.y - this.lastCollisionPoint.y) : Infinity;
    if (!force && distance < this.collisionRadius * .2) return;
    const stamps = collisionStrokePoints(this.lastCollisionPoint, point, this.collisionRadius * .32);
    for (const stamp of stamps) {
      if (this.collisionMode === 'erase') {
        eraseCampCollisionMarks(stamp.x, stamp.y, this.collisionRadius);
        disableCampObstaclesAt(stamp.x, stamp.y, this.collisionRadius);
      } else addCampCollisionMark(this.collisionMode, { x: stamp.x, y: stamp.y, r: this.collisionRadius });
    }
    this.lastCollisionPoint = point;
  }
  saveCollision() { try { localStorage.setItem(COLLISION_SAVE, JSON.stringify({ v: COLLISION_LAYOUT_VERSION, ...getCampCollisionPaint() })); } catch { this.notify('瀏覽器無法保存碰撞標記，請先匯出 JSON。'); } }
  exportCollision() { const data = JSON.stringify({ v: COLLISION_LAYOUT_VERSION, map: '星芽營地', ...getCampCollisionPaint() }, null, 2), url = URL.createObjectURL(new Blob([data], { type: 'application/json' })), link = document.createElement('a'); link.href = url; link.download = '星芽營地_碰撞標記.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); this.notify('營地碰撞標記 JSON 已匯出。'); }
  clearCollision() { if (!confirm('確定還原全部營地碰撞？')) return; setCampCollisionPaint({}); this.saveCollision(); this.notify('營地碰撞已還原。'); }

  result(result) {
    if (result.changed) {
      this.save();
      this.onSound(result.win ? 'finish' : 'correct');
    }
    this.hud();
    if (result.title) {
      const choices = result.travel
        ? [['前往丘陵', () => this.travelToHills()], ['留在營地', () => this.close()]]
        : [['繼續探索', () => this.close()]];
      const card = this.dialog(result.title, result.message, choices);
      if (result.win) this.el('div', 'reward', '獎勵：星芽旅行者套裝 · 甜蘋果 ×10 · Base EXP', card);
    } else if (result.message) {
      this.notify(result.message);
    }
  }

  interact() {
    if (this.paused) return;
    const id = this.journey.nearby();
    if (!id) {
      this.notify('靠近居民、晨露池或地標，再按互動。');
      return;
    }
    this.result(this.journey.act(id));
  }

  openHills() {
    if (this.paused || this.journey.stage < 3) return;
    this.travelToHills();
  }

  travelToHills() {
    if (this.traveling || this.journey.stage < 3) return;
    this.traveling = true;
    this.paused = true;
    this.clearInput();
    this.save();
    this.onTravel('hills');
  }

  dialog(title, text, choices) {
    this.paused = true;
    this.clearInput();
    if (this.modal) this.modal.remove();
    this.modal = this.el('div', 'modal');
    const card = this.el('div', 'card', '', this.modal);
    this.el('h2', '', title, card);
    this.el('div', 'body', text, card);
    const buttons = this.el('div', 'choices', '', card);
    for (const choice of choices) this.button(choice[0], choice[1], buttons);
    return card;
  }

  close() {
    if (this.root.clientHeight > this.root.clientWidth) return;
    if (this.modal) this.modal.remove();
    this.modal = null;
    this.clearInput();
    this.paused = false;
    this.last = performance.now();
  }

  pause() {
    if (this.dead || this.loading) return;
    if (this.modal) {
      this.clearInput();
      return;
    }
    this.dialog(
      '在星芽營地休息',
      this.journey.objective() + '\n' + (this.storageOK ? '任務進度會自動保存。' : '目前無法保存，離開可能遺失進度。'),
      [['繼續', () => this.close()], ['返回遊戲列表', () => this.onExit()]]
    );
  }

  journal() {
    if (this.loading) return;
    this.dialog(
      '星芽探險手帳',
      '目前：' + this.journey.objective() + '\n\n① 與母樹前的奧爾登長老交談。\n② 到廣場左下方的晨露池清洗衣角。\n③ 拜訪左側裁縫鋪的布隆克。\n④ 取得星芽旅行者套裝與甜蘋果後，北門開放。\n\n菲比位於右側星核工房，之後會教你製作第一顆靈珠。',
      [
        ['回到探索', () => this.close()],
        ['重玩序章', () => this.dialog('重新開始序章？', '只重設微光星芽谷的星芽營地進度，不影響其他遊戲。', [
          ['取消', () => this.journal()],
          ['確認重玩', () => {
            this.journey = new RealmJourney();
            this.save();
            this.hud();
            this.close();
          }]
        ])]
      ]
    );
  }

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    this.abort.abort();
    this.clearInput();
    if (this.inventoryPanel) { this.inventoryPanel.style.remove(); this.inventoryPanel.overlay.remove(); this.inventoryPanel = null; }
    if (this.world) this.world.dispose();
    this.root.remove();
  }
}
