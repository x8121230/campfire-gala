// Generated from the same v0.8.1 source as the integrated game.
(()=>{
const __storage=(function(){

const memoryFallback = new Map();

const browserAdapter = {
    getItem(key) {
        try {
            return globalThis.localStorage?.getItem(key) ?? memoryFallback.get(key) ?? null;
        } catch (error) {
            console.warn('無法讀取本機儲存，改用暫存記憶體。', error);
            return memoryFallback.get(key) ?? null;
        }
    },

    setItem(key, value) {
        const text = String(value);
        memoryFallback.set(key, text);
        try {
            globalThis.localStorage?.setItem(key, text);
        } catch (error) {
            console.warn('無法寫入本機儲存，本次僅保留在暫存記憶體。', error);
        }
    },

    removeItem(key) {
        memoryFallback.delete(key);
        try {
            globalThis.localStorage?.removeItem(key);
        } catch (error) {
            console.warn('無法清除本機儲存。', error);
        }
    }
};

class PlatformStorage {
    static adapter = browserAdapter;

    static useAdapter(adapter) {
        const valid = adapter
            && typeof adapter.getItem === 'function'
            && typeof adapter.setItem === 'function'
            && typeof adapter.removeItem === 'function';

        if (!valid) throw new Error('儲存轉接器必須提供 getItem、setItem 與 removeItem。');
        this.adapter = adapter;
    }

    static getItem(key) {
        return this.adapter.getItem(key);
    }

    static setItem(key, value) {
        this.adapter.setItem(key, value);
    }

    static removeItem(key) {
        this.adapter.removeItem(key);
    }
}


return {PlatformStorage};
})();
const __prefs=(function(){
const {PlatformStorage}=__storage;
const PREFERENCE_KEY='forest_preferences_v1';
function normalizePreferences(value={}){return {music:value.music!==false,sfx:value.sfx!==false,voice:value.voice!==false};}
function soundCategory(key,loop=false){return loop||/bgm|music/i.test(String(key))?'music':'sfx';}
const preferences={
 value:normalizePreferences(),
 load(){try{const raw=PlatformStorage.getItem(PREFERENCE_KEY);this.value=normalizePreferences(raw?JSON.parse(raw):JSON.parse(PlatformStorage.getItem('forest_save_data')||'{}').wardrobe_audio||{});}catch(e){this.value=normalizePreferences();}return this.value;},
 set(kind,value){if(!['music','sfx','voice'].includes(kind))throw Error('未知聲音設定');const next={...this.value,[kind]:!!value},text=JSON.stringify(next);
  if(typeof window!=='undefined'){if(!globalThis.localStorage)throw Error('裝置不允許保存設定');globalThis.localStorage.setItem(PREFERENCE_KEY,text);}
  PlatformStorage.setItem(PREFERENCE_KEY,text);this.value=next;return next;
 }
};
function applySoundPreferences(manager){for(const sound of manager.sounds||[])sound.setMute?.(!preferences.value[soundCategory(sound.key,sound.loop)]);}
function installSoundPreferences(manager){
 if(manager.adventurePreferencesInstalled)return;manager.adventurePreferencesInstalled=true;
 const add=manager.add;manager.add=function(...args){const sound=add.apply(this,args),play=sound.play; sound.play=function(...values){this.setMute?.(!preferences.value[soundCategory(this.key,this.loop)]);const result=play.apply(this,values);this.setMute?.(!preferences.value[soundCategory(this.key,this.loop)]);return result;};return sound;};
 applySoundPreferences(manager);
}

return {preferences};
})();
const __snack=(function(){

// Pure game rules: no Phaser, registry, rewards, or storage side effects.
const SNACK_GUESTS = Object.freeze([
    { id: 'rabbit', name: '小兔子', food: 'carrot', foodName: '紅蘿蔔', color: 0xf1b695 },
    { id: 'monkey', name: '小猴子', food: 'banana', foodName: '香蕉', color: 0xf4d479 },
    { id: 'panda', name: '熊貓', food: 'bamboo', foodName: '竹子', color: 0xa6cda4 }
]);
const SNACK_CONFIG = Object.freeze({ goal: 12, startY: 170, endY: 417, flightSeconds: 0.65 });
function makeSnackQueue(random = Math.random) {
    const queue = [0, 1, 2]; // Introduce all three guests before removing hints.
    for (let cycle = 0; cycle < 3; cycle++) {
        const group = [0, 1, 2];
        for (let i = 2; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [group[i], group[j]] = [group[j], group[i]];
        }
        if (group[0] === queue[queue.length - 1]) [group[0], group[1]] = [group[1], group[0]];
        queue.push(...group);
    }
    return queue.map((animal, id) => ({ id, animal, retries: 0 }));
}
function snackSpeed(served) { return served < 4 ? 22 : served < 8 ? 28 : 34; }
class SnackSession {
    constructor(random = Math.random) {
        this.queue = makeSnackQueue(random);
        this.current = null;
        this.served = 0;
        this.attempts = 0;
        this.wrong = 0;
        this.missed = 0;
        this.hints = 0;
        this.cleanDeliveries = 0;
        this.next();
    }
    get done() { return this.served === SNACK_CONFIG.goal; }
    get guest() { return this.current ? SNACK_GUESTS[this.current.animal] : null; }
    next() {
        this.current = this.queue.shift() || null;
        this.currentWrong = false;
        this.showHint = !!this.current && (this.current.id < 3 || this.current.retries > 0);
    }
    hint() {
        if (!this.current || this.showHint) return false;
        this.showHint = true;
        this.hints++;
        return true;
    }
    deliver(food) {
        if (!this.current || !SNACK_GUESTS.some(g => g.food === food)) return 'ignored';
        this.attempts++;
        if (food !== this.guest.food) {
            this.wrong++;
            this.currentWrong = true;
            this.showHint = true;
            return 'wrong';
        }
        if (!this.currentWrong && this.current.retries === 0) this.cleanDeliveries++;
        this.served++;
        this.current = null;
        return 'correct';
    }
    miss() {
        if (!this.current) return false;
        this.missed++;
        this.queue.push({ ...this.current, retries: this.current.retries + 1 });
        this.current = null;
        return true;
    }
}

return {SnackSession,SNACK_GUESTS,SNACK_CONFIG,snackSpeed};
})();
const __animal=(function(){
const {SnackSession,SNACK_GUESTS,SNACK_CONFIG,snackSpeed}=__snack;

const FONT = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const LANES = [476, 746, 1016];
const ASSETS = 'assets/animal-snack/';

// Self-contained trial scene. Does not grant items or mutate formal progress.
class AnimalSnackGame extends Phaser.Scene {
    constructor(key = 'AnimalSnackGame') { super(key); }
    init(data = {}) { this.returnScene = data.returnScene || 'MiniGameHub'; }
    preload() {
        ['rabbit', 'monkey', 'panda', 'carrot', 'banana', 'bamboo', 'airship'].forEach(id => {
            if (!this.textures.exists(`snack_${id}`)) this.load.image(`snack_${id}`, `${ASSETS}${id}.png`);
        });
    }
    create() {
        this.sound.stopAll();
        this.session = new SnackSession();
        this.mode = 'intro';
        this.elapsed = 0;
        this.selected = -1;
        this.shot = null;
        this.delay = 0;
        this.soundOn = true;
        this.lastDragLane = -1;
        this.audioNodes = new Set();
        this.overlay = null;
        this.drawBackground();
        this.drawInterface();
        this.bindInput();
        this.spawnGuest();
        this.showIntro();
        this.visibilityHandler = () => {
            if (document.hidden && this.mode === 'playing') this.pauseGame();
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.blurHandler = () => { if (this.mode === 'playing') this.pauseGame(); };
        this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler);
            this.stopTones();
            this.overlay = null;
        });
    }
    text(x, y, value, size = 22, color = '#31574b', origin = 0.5) {
        return this.add.text(x, y, value, { fontFamily: FONT, fontSize: `${size}px`,
            color, fontStyle: 'bold', align: 'center', lineSpacing: 7 }).setOrigin(origin);
    }
    panel(x, y, width, height, fill = 0xfffbef, border = 0xcbd8b7, radius = 22) {
        const g = this.add.graphics();
        g.fillStyle(fill, 1).fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
        g.lineStyle(2, border, 1).strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
        return g;
    }
    button(x, y, width, height, label, fn, fill = 0x477b64, color = '#fffbed') {
        const c = this.add.container(x, y);
        const g = this.panel(0, 0, width, height, fill, fill, 16);
        const t = this.text(0, 0, label, 21, color);
        c.add([g, t]).setSize(width, height).setInteractive({ useHandCursor: true });
        c.on('pointerdown', fn);
        c.label = t;
        return c;
    }
    sprite(x, y, id, width, height = width) {
        const key = `snack_${id}`;
        if (!this.textures.exists(key)) {
            return this.text(x, y, ({rabbit:'兔', monkey:'猴', panda:'熊貓',carrot:'紅蘿蔔',banana:'香蕉',bamboo:'竹子',airship:'點心船'})[id] || id, 22);
        }
        const img = this.add.image(x, y, key);
        img.setScale(Math.min(width / img.width, height / img.height));
        return img;
    }
    drawBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0xd7ebda, 0xeaf0d9, 0x94bda1, 0xb9d2ab, 1);
        g.fillRect(0, 0, 1280, 720);
        // Quiet center keeps moving guests legible; decorative foliage stays behind UI.
        for (let i = 0; i < 12; i++) {
            const x = i % 2 ? 1250 : 22, y = 70 + Math.floor(i / 2) * 128;
            this.add.ellipse(x, y, 180, 235, i % 3 ? 0x6b9c7e : 0x87ad85, 0.35).setAngle(i * 31);
        }
        this.panel(768, 326, 906, 466, 0xeaf3df, 0xb9cdb0, 30);
        this.add.ellipse(768, 470, 850, 130, 0xdcebcf, 0.5);
        this.drifters = [];
        for (let i = 0; i < 22; i++) {
            const dot = this.add.ellipse(341 + (i * 137) % 842, 115 + (i * 59) % 398,
                i % 2 ? 8 : 5, i % 2 ? 15 : 5, i % 2 ? 0x99b58a : 0xfffdf0, 0.48);
            dot.setAngle(i * 23);
            this.drifters.push(dot);
        }
    }
    drawInterface() {
        this.panel(640, 44, 1248, 68, 0xfffbef, 0xfffbef, 20);
        this.button(101, 44, 150, 44, '← 遊戲列表', () => this.leave());
        this.text(455, 42, '動物點心隊', 32);
        this.text(675, 45, '森林配送・幼童試玩', 17, '#738678');
        this.soundButton = this.button(963, 44, 116, 44, '音效：開', () => {
            this.soundOn = !this.soundOn;
            if (!this.soundOn) this.stopTones();
            this.soundButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xe6ead8, '#31574b');
        this.button(1107, 44, 130, 44, '暫停 / 說明', () => this.pauseGame(), 0xe6ead8, '#31574b');

        this.panel(163, 389, 278, 590);
        this.text(163, 128, '今天的小任務', 25);
        this.text(163, 167, '把點心送給 12 位朋友', 18, '#728476');
        this.progressText = this.text(163, 218, '0 / 12', 43);
        this.progressTrack = this.add.rectangle(58, 258, 208, 9, 0xe0e7d1).setOrigin(0, 0.5);
        this.progressFill = this.add.rectangle(58, 258, 1, 9, 0x73a987).setOrigin(0, 0.5);
        this.phaseText = this.text(163, 291, '第 1 段 · 認識點心', 18, '#657c6d');
        this.infoAnimal = this.sprite(163, 367, 'rabbit', 116, 116);
        this.guestNameText = this.text(163, 445, '', 24);
        this.hintText = this.text(163, 483, '', 18, '#657c6d');
        this.button(163, 546, 210, 52, '看看點心提示', () => this.revealHint(), 0xe8d29a, '#655531');
        this.text(163, 612, '送錯也沒關係\n朋友會等你再試一次', 17, '#768578');
        this.feedback = this.text(768, 123, '先看看今天的客人～', 22);

        this.ship = this.sprite(746, 500, 'airship', 141, 112);
        this.stations = [];
        SNACK_GUESTS.forEach((guest, index) => {
            const x = LANES[index];
            const bg = this.panel(x, 621, 251, 108, 0xfffbef, 0xc6d6b6, 22);
            const food = this.sprite(x - 72, 620, guest.food, 74, 72);
            const name = this.text(x + 34, 605, guest.foodName, 25);
            const hint = this.text(x + 34, 638, `點這裡送出 · ${index + 1}`, 14, '#839180');
            const hit = this.add.rectangle(x, 621, 251, 108, 0xffffff, 0.001)
                .setInteractive({useHandCursor:true}).on('pointerdown', () => this.choose(index));
            this.stations.push({ bg, food, name, hint, hit });
        });
        this.selection = this.add.graphics();
        this.text(775, 698, '點選點心就會自動送出｜也可在點心列左右拖曳｜不扣愛心、不影響正式進度', 15, '#4d705c');
    }
    bindInput() {
        this.input.on('pointermove', p => {
            if (!p.isDown || p.y < 567 || p.y > 675 || p.x < 350 || p.x > 1150) return;
            const lane = this.laneAt(p.x);
            if (lane !== this.lastDragLane) { this.lastDragLane = lane; this.choose(lane); }
        });
        this.input.on('pointerup', () => { this.lastDragLane = -1; });
        this.keyHandler = e => {
            if (e.repeat) return;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.mode === 'paused') this.resumeGame(); else this.pauseGame();
                return;
            }
            if (/^Digit[123]$/.test(e.code)) this.choose(Number(e.code.slice(-1)) - 1);
            else if (e.code === 'ArrowLeft') this.choose(Math.max(0, this.selected - 1));
            else if (e.code === 'ArrowRight') this.choose(Math.min(2, this.selected + 1));
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
    }
    laneAt(x) { return Math.max(0, Math.min(2, Math.round((x - LANES[0]) / 270))); }
    spawnGuest() {
        if (!this.session.current) this.session.next();
        if (!this.session.current) { this.finish(); return; }
        this.guestView?.destroy();
        const g = this.session.guest;
        this.guestX = LANES[Phaser.Math.Between(0, 2)];
        this.guestY = SNACK_CONFIG.startY + 55;
        this.guestView = this.add.container(this.guestX, this.guestY);
        const bubble = this.add.circle(0, 0, 75, 0xffffff, 0.6).setStrokeStyle(2, 0xffffff, 0.9);
        const animal = this.sprite(0, 0, g.id, 132, 132);
        const label = this.text(0, 90, g.name, 18);
        this.guestView.add([bubble, animal, label]);
        this.infoAnimal.destroy();
        this.infoAnimal = this.sprite(163, 367, g.id, 116, 116);
        this.guestNameText.setText(g.name);
        this.selected = -1;
        this.selection.clear();
        this.refreshInfo();
        this.feedback.setText(this.session.served < 3 ? '看客人，選牠的點心！' : '你記得牠的點心嗎？');
    }
    refreshInfo() {
        this.progressText.setText(`${this.session.served} / 12`);
        this.progressFill.width = Math.max(1, 208 * this.session.served / 12);
        const step = Math.min(2, Math.floor(this.session.served / 4));
        this.phaseText.setText(['第 1 段 · 認識點心', '第 2 段 · 自己想一想', '第 3 段 · 小小配送員'][step]);
        this.hintFood?.destroy(); this.hintFood = null;
        if (this.session.guest) {
            const visible = this.session.showHint;
            this.hintText.setPosition(visible ? 190 : 163, 487)
                .setText(visible ? this.session.guest.foodName : '想一想，再送出點心');
            if (visible) this.hintFood = this.sprite(90, 484, this.session.guest.food, 53, 53);
        }
    }
    revealHint() {
        if (this.mode !== 'playing' || !this.session.current) return;
        this.session.hint();
        this.refreshInfo();
        this.feedback.setText(`今天的點心是${this.session.guest.foodName}！`);
        this.tone('hint');
    }
    choose(index) {
        if (this.mode !== 'playing' || this.shot || this.delay > 0 || !this.session.current) return;
        if (!Number.isInteger(index) || index < 0 || index > 2) return;
        this.selected = index;
        this.selection.clear().lineStyle(4, 0x528d69, 1)
            .strokeRoundedRect(LANES[index] - 125, 567, 250, 108, 22);
        const food = SNACK_GUESTS[index].food;
        const view = this.add.container(this.ship.x, this.ship.y - 50);
        view.add([this.add.circle(0, 0, 34, 0xffffff, 0.8).setStrokeStyle(2, 0xb7d6ca),
            this.sprite(0, 0, food, 49, 49)]);
        this.shot = {view, food, t: 0, startX: this.ship.x, startY: this.ship.y - 50,
            guestId: this.session.current.id};
        this.tone('send');
    }
    update(_time, delta) {
        if (this.mode !== 'playing') return;
        const dt = Math.max(0, Math.min(delta / 1000, 0.05));
        this.elapsed += dt;
        this.drifters.forEach((d, i) => { d.y += dt * (10 + i % 5 * 3); if (d.y > 546) d.y = 100; });
        const targetX = this.selected < 0 ? 746 : LANES[this.selected];
        this.ship.x += (targetX - this.ship.x) * Math.min(1, dt * 12);
        if (this.delay > 0) {
            this.delay -= dt;
            if (this.delay <= 0) this.spawnGuest();
            return;
        }
        if (!this.session.current) return;
        if (this.shot) {
            const s = this.shot;
            s.t += dt / SNACK_CONFIG.flightSeconds;
            const t = Math.min(1, s.t), ease = t * t * (3 - 2 * t);
            s.view.setPosition(Phaser.Math.Linear(s.startX, this.guestView.x, ease),
                Phaser.Math.Linear(s.startY, this.guestY, ease) - Math.sin(t * Math.PI) * 45);
            if (t >= 1) {
                s.view.destroy(); this.shot = null;
                if (this.session.current?.id !== s.guestId) return;
                const guestName = this.session.guest.name;
                const result = this.session.deliver(s.food);
                if (result === 'correct') {
                    this.feedback.setText(`${guestName}：謝謝你，好好吃！`);
                    this.tone('correct');
                    this.sparkle(this.guestView.x, this.guestView.y);
                    this.guestView.setAlpha(0.45);
                    this.refreshInfo();
                    this.delay = 1.05;
                    if (this.session.done) { this.delay = 0; this.finish(); }
                } else {
                    this.feedback.setText(`再試一次～牠今天想吃${this.session.guest.foodName}`);
                    const bounce = this.sprite(this.guestView.x, this.guestY, s.food, 48, 48);
                    this.tweens.add({targets:bounce, x:this.guestView.x + 100, y:this.guestY + 45,
                        angle:35, alpha:0, duration:500, onComplete:()=>bounce.destroy()});
                    this.guestY = Math.max(225, this.guestY - 45);
                    this.refreshInfo(); this.tone('hint');
                }
            }
            return;
        }
        // No deadline in tutorial: time to learn. Later guests approach gently.
        const speed = this.session.current.id < 3 ? 0 : snackSpeed(this.session.served);
        this.guestY += speed * dt;
        this.guestView.setPosition(this.guestX + Math.sin(this.elapsed * 1.1) * 15, this.guestY);
        if (this.guestY > SNACK_CONFIG.endY) {
            this.session.miss();
            this.guestView.setVisible(false);
            this.feedback.setText('朋友先去繞一圈，等一下再來！');
            this.delay = 0.9;
        }
    }
    sparkle(x, y) {
        for (let i = 0; i < 10; i++) {
            const star = this.add.star(x, y, 5, 4, 10, i % 2 ? 0xf3c965 : 0x91c39b);
            const a = i / 10 * Math.PI * 2;
            this.tweens.add({ targets: star, x: x + Math.cos(a) * 95, y: y + Math.sin(a) * 75,
                alpha: 0, angle: 80, duration: 650, onComplete: () => star.destroy() });
        }
    }
    stopTones() {
        this.audioNodes?.forEach(node => { try { node.stop(); } catch (_) {} });
        this.audioNodes?.clear();
    }
    tone(kind) {
        const ctx = this.sound.context;
        if (!this.soundOn || this.sound.mute || !ctx || ctx.state !== 'running') return;
        const notes = ({send:[440], hint:[392, 440], correct:[523, 659, 784], finish:[523,659,784,1046]})[kind];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator(), gain = ctx.createGain(), at = ctx.currentTime + i * 0.12;
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(Math.max(0.001, 0.065 * this.sound.volume), at + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
            osc.connect(gain); gain.connect(ctx.destination);
            this.audioNodes.add(osc);
            osc.onended = () => { this.audioNodes.delete(osc); osc.disconnect(); gain.disconnect(); };
            osc.start(at); osc.stop(at + 0.2);
        });
    }
    makeOverlay(title, body) {
        this.overlay?.destroy();
        this.overlay = this.add.container(0, 0).setDepth(100);
        const shade = this.add.rectangle(640, 360, 1280, 720, 0x1c4437, 0.7).setInteractive();
        this.overlay.add([shade, this.panel(640, 353, 780, 480), this.text(640, 170, title, 34),
            this.text(640, 272, body, 23)]);
        return this.overlay;
    }
    showIntro() {
        const o = this.makeOverlay('歡迎加入動物點心隊！', '看看客人是誰，點選下方的點心。\n點心會自動飛過去，不用另外按發射。\n送錯不扣分，漏接的朋友會再回來。');
        SNACK_GUESTS.forEach((g, i) => {
            const x = 424 + i * 216;
            o.add([this.sprite(x - 33, 414, g.id, 83, 83), this.text(x + 17, 414, '→', 22), this.sprite(x + 67, 414, g.food, 58, 58)]);
        });
        o.add(this.text(640, 475, '前 3 位朋友不催你，慢慢認識點心。', 18, '#748672'));
        o.add(this.button(640, 535, 270, 57, '出發送點心！', () => {
            this.overlay.destroy(); this.overlay = null; this.mode = 'playing';
            this.sound.context?.resume?.();
        }));
    }
    pauseGame() {
        if (this.mode !== 'playing') return;
        this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.makeOverlay('休息一下，朋友會等你', '點選紅蘿蔔、香蕉或竹子，就會自動送出。\n看不出來時，可以按「看看點心提示」。\n鍵盤也可使用 1 / 2 / 3，P 暫停。');
        o.add(this.button(640, 411, 270, 55, '繼續配送', () => this.resumeGame()));
        o.add(this.button(500, 502, 220, 51, '重新開始', () => this.restart(), 0xe8d29a, '#655531'));
        o.add(this.button(780, 502, 220, 51, '返回遊戲列表', () => this.leave(), 0xe6ead8, '#31574b'));
    }
    resumeGame() {
        if (this.mode !== 'paused') return;
        this.overlay?.destroy(); this.overlay = null; this.mode = 'playing'; this.tweens.resumeAll();
    }
    finish() {
        this.mode = 'finished'; this.tone('finish');
        const s = this.session;
        const o = this.makeOverlay('今天的點心，全都送到了！', `照顧了 ${s.served} 位森林朋友\n第一次就送對：${s.cleanDeliveries} 位\n送錯後再試：${s.wrong} 次 · 客人重新排隊：${s.missed} 次`);
        o.add(this.text(640, 391, '這是試玩紀錄，不發放正式寶箱、愛心或成就。', 18, '#748672'));
        o.add(this.button(500, 476, 235, 60, '再送一次！', () => this.restart()));
        o.add(this.button(780, 476, 235, 60, '返回遊戲列表', () => this.leave(), 0xe8d29a, '#655531'));
    }
    restart() { this.tweens.resumeAll(); this.scene.restart({returnScene:this.returnScene}); }
    leave() {
        this.tweens.resumeAll();
        const target = this.scene.manager.keys[this.returnScene] ? this.returnScene : 'SnackDemoHome';
        if (this.scene.manager.keys[target]) this.scene.start(target);
    }
}

return {AnimalSnackGame};
})();
const __rules=(function(){
// Horizontal flight simulation. World units match the 1280 × 480 playfield.
const STAR_REGION_SECONDS=48;
const STAR_SEGMENT_SECONDS=STAR_REGION_SECONDS;
const STAR_ROUTE_LENGTH=3;
const STAR_FIELD={width:1280,height:480,step:1/120,bossAt:STAR_SEGMENT_SECONDS*STAR_ROUTE_LENGTH,hitRadius:5,scrollSpeed:155};
const STAR_ACTS=['晨光天空','月光湖','星晶洞穴','霜花冰原','螢光濕地','熔火岩漿海','古木樹海','月港首領'];
const STAR_WEAPONS=[
 {id:'clover',name:'幸運草連射',icon:'草',color:0x83ed99,tip:'雙向 → 三向 → 五向扇形連射',role:'廣角'},
 {id:'laser',name:'彩虹星露炮',icon:'光',color:0x7cdbff,tip:'穿透敵人，地形仍會阻擋光束',role:'貫穿'},
 {id:'homing',name:'蒲公英導彈',icon:'追',color:0xffd273,tip:'雙發 → 四發 → 六發追蹤爆破',role:'追蹤'}
];
const STAR_SPECIALS=[
 {id:'chargeLaser',name:'聚氣雷射',short:'雷射',cd:5,charge:2,color:0x7cdbff,tip:'點一下，自動集氣 2 秒後發射貫穿光束'},
 {id:'explosive',name:'炸裂彈',short:'炸裂',cd:4,charge:0,color:0xffc87b,tip:'直射種子彈，命中後爆開、安撫附近敵人'},
 {id:'shotgun',name:'幸運草散彈',short:'散彈',cd:3,charge:0,color:0x83ed99,tip:'七向扇形散射，適合靠近大型敵人使用'}
];
const STAR_PHASE1={version:'0.8.1',normalShotCooldown:.5,chargeSeconds:2,playerSpeed:122.5,visualScale:1.5,launchSeconds:3,guardianSeconds:3,branchAt:40,branchFlightX:760};
const STAR_TUNING=[
 {id:'playerSpeed',name:'玩家移動速度',default:122.5,min:70,max:220,step:12.5,digits:1,unit:''},
 {id:'shotCooldown',name:'普攻發射間隔',default:.5,min:.2,max:1,step:.1,digits:1,unit:'秒'},
 {id:'playerBulletSpeed',name:'玩家子彈速度',default:880,min:500,max:1300,step:100,digits:0,unit:''},
 {id:'enemySpeedScale',name:'敵人移動速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyBulletScale',name:'敵方子彈速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyHpScale',name:'敵人生命倍率',default:1,min:.5,max:2.5,step:.25,digits:2,unit:'×'},
 {id:'waveScale',name:'每波敵人數量',default:1,min:.5,max:2,step:.25,digits:2,unit:'×'}
];
const STAR_CONTROLS={joystick:{x:100,y:610,r:57},special:{x:1060,y:510,r:42},bomb:{x:1060,y:617,r:45},bay:{x:1180,y:474,r:43},trait:{x:1180,y:607,r:56}};

const STAR_REGIONS=[
 {id:'morning-sky',type:'sky',name:'晨光浮島天空',theme:'cloud',patterns:[0,3,5],hazard:'gust'},
 {id:'crystal-skyway',type:'sky',name:'浮晶彩帶航道',theme:'market',patterns:[0,2,5],hazard:'gust'},
 {id:'moonlight-lake',type:'lake',name:'靜謐月光湖',theme:'crystal',patterns:[0,1,6],hazard:'mist'},
 {id:'jelly-reeds',type:'lake',name:'水母蘆葦水域',theme:'crystal',patterns:[5,6,1],hazard:'mist'},
 {id:'star-crystal-cave',type:'cave',name:'星晶回音洞穴',theme:'harbor',patterns:[2,7,3],hazard:'rockfall'},
 {id:'moonstone-cave',type:'cave',name:'月石鐘乳洞',theme:'harbor',patterns:[0,7,2],hazard:'rockfall'},
 {id:'frost-petal-tundra',type:'ice',name:'霜花水晶冰原',theme:'crystal',patterns:[8,0,5],hazard:'icefall'},
 {id:'glowcap-wetland',type:'wetland',name:'螢光菇泡泡濕地',theme:'honey',patterns:[9,6,5],hazard:'marsh'},
 {id:'ember-magma-sea',type:'magma',name:'星火岩漿海',theme:'market',patterns:[10,3,1],hazard:'ember'},
 {id:'ancient-tree-sea',type:'forest',name:'古木樹冠迷航',theme:'cloud',patterns:[11,2,7],hazard:'canopy'}
];
const STAR_MAPS=STAR_REGIONS;

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const seeded=(seed)=>{let n=(seed^0x9e3779b9)>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
function starSweep(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+t*dx-x,ay+t*dy-y)<=r;}

const STAR_REGION_TYPES=['sky','lake','cave','ice','wetland','magma','forest'];
const regionVariants=type=>STAR_REGIONS.filter(r=>r.type===type);
const decorateRegion=(region,index,random)=>({...region,index,waveCount:3+Math.floor(random()*3)});
function buildStarBranchOptions(current,index,seed=98731){const random=seeded((seed^Math.imul(index+1,0x45d9f3b)^current.type.length*2654435761)>>>0),order=STAR_REGION_TYPES.filter(type=>type!==current.type);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const choices=order.slice(0,2).map(type=>{const pool=regionVariants(type);return {...pool[Math.floor(random()*pool.length)],index:index+1,waveCount:3+Math.floor(random()*3)};});
 if(random()<.5)choices.reverse();return {top:choices[0],bottom:choices[1]};}
function buildStarRoute(seed=98731){const random=seeded(seed),sky=regionVariants('sky'),route=[decorateRegion(sky[Math.floor(random()*sky.length)],0,random)];
 for(let index=0;index<STAR_ROUTE_LENGTH-1;index++){const options=buildStarBranchOptions(route[index],index,seed),side=random()<.5?'top':'bottom';route.push({...options[side],index:index+1});}return route;}


const STAR_SOCKET={safeTop:165,safeBottom:315};
const STAR_ENEMIES=[
 {name:'打嗝小烏雲',hp:1,r:19,speed:215},{name:'熱氣球胖胖豬',hp:95,r:43,speed:65},
 {name:'吐籽西瓜鳥',hp:24,r:23,speed:155},{name:'紙飛機鼯鼠',hp:5,r:22,speed:210},
 {name:'紅帽補給雲',hp:7,r:24,speed:125},{name:'搖擺蜜蜂',hp:3,r:18,speed:190},
 {name:'月泡水豚',hp:8,r:25,speed:125},{name:'回音小蝙蝠',hp:4,r:18,speed:185},
 {name:'冰羽小貓頭鷹',hp:6,r:21,speed:175},{name:'泥泡跳跳蛙',hp:5,r:19,speed:165},
 {name:'火種小蜥蜴',hp:9,r:22,speed:150},{name:'松果滑翔鳥',hp:6,r:20,speed:180}
];
function starColor(item){const phase=((item.age||0)/1.5)%3,index=Math.floor(phase);return {id:STAR_WEAPONS[index].id,index,remaining:(1-phase%1)*1.5};}
function buildStarTimeline(route,seed){
 const rng=seeded(seed^0x51fa),events=[];
 route.forEach((m,index)=>{const start=index*STAR_REGION_SECONDS,slots=[4,12,20,28,35];events.push({at:start+.05,type:'region',index});
  for(let i=0;i<m.waveCount;i++)events.push({at:start+slots[i],type:'wave',pattern:m.patterns[Math.floor(rng()*m.patterns.length)],index});
  if(m.type==='sky')events.push({at:start+16,type:'gust',index});
  if(m.type==='lake')for(const at of [10,24,34])events.push({at:start+at,type:'mist',index});
  if(m.type==='lake')for(const at of [17,31])events.push({at:start+at,type:'lakeJump',index});
  if(m.type==='cave'){events.push({at:start+18,type:'terrain',index});for(const at of [9,25,34])events.push({at:start+at,type:'rockfall',index});}
  if(m.type==='ice')for(const at of [9,23,35])events.push({at:start+at,type:'icefall',index});
  if(m.type==='wetland')for(const at of [10,24,35])events.push({at:start+at,type:'marsh',index});
  if(m.type==='magma')for(const at of [9,21,34])events.push({at:start+at,type:'ember',index});
  if(m.type==='forest'){events.push({at:start+15,type:'canopy',index},{at:start+31,type:'canopy',index});}
  events.push({at:start+8,type:'carrier',index});if(index===1)events.push({at:start+30,type:'option',index});
  if(index<STAR_ROUTE_LENGTH-1)events.push({at:start+STAR_PHASE1.branchAt,type:'branch',index});
 });
 events.push({at:STAR_FIELD.bossAt-3,type:'warning',index:STAR_ROUTE_LENGTH},{at:STAR_FIELD.bossAt,type:'boss',index:STAR_ROUTE_LENGTH});
 return events.sort((a,b)=>a.at-b.at);
}
class StarflightTouch{
 constructor(){this.reset();}
 reset(){this.owner=null;this.origin={...STAR_CONTROLS.joystick};this.axis={x:0,y:0};this.firing=new Set();this.requests={};}
 down(p){const {x,y,id}=p;for(const key of ['special','bomb','bay','trait']){const c=STAR_CONTROLS[key];if(Math.hypot(x-c.x,y-c.y)<=c.r){this.requests[key]=true;return;}}
  if(this.owner===null&&x<450&&y>110){this.owner=id;this.origin={x:clamp(x,62,390),y:clamp(y,140,645)};this.move(p);}}
 move(p){if(p.id!==this.owner)return;const x=p.x-this.origin.x,y=p.y-this.origin.y,n=Math.max(57,Math.hypot(x,y));this.axis=Math.hypot(x,y)<7?{x:0,y:0}:{x:x/n,y:y/n};}
 up(p){this.firing.delete(p.id);if(p.id===this.owner){this.owner=null;this.axis={x:0,y:0};}}
 read(){return {...this.axis,fire:this.firing.size>0,...this.requests};}
 consume(){this.requests={};}
}
class StarflightSession{
 constructor({difficulty='normal',seed=98731,checkpoint=null,guardianEnabled=false}={}){
  this.difficulty=difficulty;this.seed=checkpoint?.seed??seed;this.rng=checkpoint?.rng??this.seed;this.time=checkpoint?.time||0;
  this.route=checkpoint?.route?.map(m=>({...m}))||buildStarRoute(this.seed);this.segment=Math.min(STAR_ROUTE_LENGTH,Math.floor(this.time/STAR_REGION_SECONDS));this.stage=this.segment;
  this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>=this.time);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.status='playing';this.paused=false;this.accumulator=0;this.id=0;const hp=2;
  this.tuning=Object.fromEntries(STAR_TUNING.map(item=>[item.id,checkpoint?.tuning?.[item.id]??item.default]));this.gmUsed=checkpoint?.gmUsed??false;
  this.player={x:210,y:240,hp,maxHp:hp,invuln:2,dashCD:0,dashing:0,shotCD:0,traitCD:0,shield:0};
  this.weapon='clover';
  this.specialWeapon=checkpoint?.specialWeapon||'chargeLaser';this.specialCooldowns={chargeLaser:0,explosive:0,shotgun:0,...checkpoint?.specialCooldowns};
  this.charging=null;this.ultimateEnergy=checkpoint?.ultimateEnergy||0;this.energyBudget=0;this.phase='combat';this.phaseTime=0;this.laserVisual=null;this.bayOpen=false;this.suitActive=null;
  this.guardianEnabled=checkpoint?.guardianEnabled??!!guardianEnabled;this.guardianUsed=checkpoint?.guardianUsed??false;
  this.weaponRanks={clover:1,laser:1,homing:1,...checkpoint?.weaponRanks};this.options=checkpoint?.options||0;this.optionTrail=[];this.optionPositions=[];
  this.bombs=0;this.score=checkpoint?.score||0;this.chain=0;this.chainLife=0;
  this.stats={cleared:0,rescued:0,hits:0,bombs:0,weaponChoices:0,upgrades:0,graze:0,branches:0,gmChanges:0,...checkpoint?.stats};
  this.events=[];this.enemies=[];this.shots=[];this.bullets=[];this.pickups=[];this.gates=[];this.hazards=[];this.warnings=[];this.branchOffer=null;this.environmentSlow=1;this.boss=null;this.last={};this.pending={};
  this.notice='普攻每 0.5 秒一發 · 點一下雷射，自動集氣 2 秒！';this.noticeLife=4;this.nextBossGift=STAR_FIELD.bossAt+12;this.checkpoint=this.snapshot();
 }
 get currentMap(){return this.segment<STAR_ROUTE_LENGTH?this.route[this.segment]:null;}
 get dangerTier(){return Math.min(3,this.segment);}
 snapshot(){return {specialWeapon:this.specialWeapon,specialCooldowns:{...this.specialCooldowns},ultimateEnergy:this.ultimateEnergy,guardianEnabled:this.guardianEnabled,guardianUsed:this.guardianUsed,seed:this.seed,rng:this.rng,time:this.segment*STAR_REGION_SECONDS,route:this.route.map(m=>({...m})),weapon:this.weapon,weaponRanks:{...this.weaponRanks},options:this.options,score:this.score,stats:{...this.stats},bombs:this.bombs,tuning:{...this.tuning},gmUsed:this.gmUsed};}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});if(this.events.length>150)this.events.shift();}
 message(t){this.notice=t;this.noticeLife=3;}
 setPaused(v){this.paused=!!v;}
 setTuning(id,value){const rule=STAR_TUNING.find(item=>item.id===id);if(!rule||!Number.isFinite(value))return false;const old=this.tuning[id],next=Math.round(clamp(value,rule.min,rule.max)*1000)/1000;if(next===old)return false;
  this.tuning[id]=next;this.gmUsed=true;this.stats.gmChanges++;
  if(id==='playerBulletSpeed'&&old>0)for(const shot of this.shots){shot.vx*=next/old;shot.vy*=next/old;}
  if(id==='enemyBulletScale'&&old>0)for(const bullet of this.bullets){bullet.vx*=next/old;bullet.vy*=next/old;}
  if(id==='enemyHpScale'&&old>0){for(const enemy of this.enemies){enemy.hp*=next/old;enemy.maxHp*=next/old;}if(this.boss){this.boss.hp*=next/old;this.boss.maxHp*=next/old;}}
  this.message('GM 調校：'+rule.name+' → '+next.toFixed(rule.digits)+rule.unit);return true;
 }
 resetTuning(){for(const item of STAR_TUNING)this.setTuning(item.id,item.default);this.gmUsed=false;this.message('GM 調校已恢復正式預設值');return true;}
 forceRegion(type){if(this.segment>=STAR_ROUTE_LENGTH||!STAR_REGION_TYPES.includes(type))return false;const pool=regionVariants(type),region=pool[Math.floor(this.random()*pool.length)];if(!region)return false;
  this.route[this.segment]={...region,index:this.segment,waveCount:4};this.enemies=[];this.bullets=[];this.hazards=[];this.gates=[];this.branchOffer=null;this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>this.time+1e-7);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.gmUsed=true;this.stats.gmChanges++;this.emit('stage',0,0,{theme:region.theme});this.message('GM 地圖切換：'+region.name);return true;
 }
 hit(){const p=this.player;if(p.invuln>0||this.phase!=='combat'||this.status!=='playing')return false;p.invuln=1.7;this.chain=0;this.stats.hits++;if(p.shield>0)p.shield--;else p.hp--;this.emit('hurt');if(p.hp<=0){this.phase='falling';this.phaseTime=0;this.charging=null;this.emit('fall');}return true;}
 addPickup(kind,x,y){const item={id:++this.id,kind,x,y,age:0,r:kind==='weapon'?23:kind==='option'?20:12,life:18,locked:null};this.pickups.push(item);return item;}
 collectWeapon(){if(this.weaponRanks.clover<3){this.weaponRanks.clover++;this.stats.upgrades++;}else this.score+=750;
  this.stats.weaponChoices++;this.emit('weaponChosen');this.message('種子普攻 Lv.'+this.weaponRanks.clover+' · 特殊武器由武器艙選擇');return true;
 }
 openBay(){if(this.status!=='playing'||this.phase!=='combat'||this.paused)return false;this.bayOpen=true;this.paused=true;return true;}
 equipSpecial(id){if(!this.bayOpen||!STAR_SPECIALS.some(w=>w.id===id))return false;
  if(id!==this.specialWeapon){this.charging=null;this.specialWeapon=id;}return true;
 }
 closeBay(){if(!this.bayOpen)return false;this.bayOpen=false;this.paused=false;this.last={};this.pending={};return true;}
 openBranch(){if(this.segment>=STAR_ROUTE_LENGTH-1||this.branchOffer)return false;const options=buildStarBranchOptions(this.currentMap,this.segment,this.seed);this.branchOffer={...options,selected:null,source:null};this.message('航線分岔！飛入上／下通道，或點選路牌');this.emit('branchOpen',0,0,{top:options.top.name,bottom:options.bottom.name});return true;}
 chooseBranch(side,source='flight'){const offer=this.branchOffer;if(!offer||offer.selected||!['top','bottom'].includes(side))return false;const chosen={...offer[side],index:this.segment+1};this.route[this.segment+1]=chosen;
  if(this.segment+2<STAR_ROUTE_LENGTH){const next=buildStarBranchOptions(chosen,this.segment+1,this.seed),fallback=((this.seed>>>this.segment)&1)?'top':'bottom';this.route[this.segment+2]={...next[fallback],index:this.segment+2};}
  offer.selected=side;offer.source=source;offer.selectedId=chosen.id;this.stats.branches=(this.stats.branches||0)+1;this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>this.time+1e-7);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.message((side==='top'?'上方':'下方')+'航線確認：'+chosen.name);this.emit('branchChosen',0,0,{side,name:chosen.name,source});return true;}
 gainEnergy(amount){if(this.phase!=='combat')return;const earned=Math.min(amount,Math.max(0,8-this.energyBudget));this.energyBudget+=earned;this.ultimateEnergy=Math.min(100,this.ultimateEnergy+earned);}
 triggerSpecial(){if(this.phase!=='combat'||this.paused||this.charging||this.specialCooldowns[this.specialWeapon]>0)return false;
  const w=STAR_SPECIALS.find(w=>w.id===this.specialWeapon);
  if(w.charge){this.charging={id:w.id,elapsed:0};this.emit('charge');}else this.fireSpecial(w.id);return true;
 }
 fireSpecial(id){const p=this.player,w=STAR_SPECIALS.find(w=>w.id===id);this.specialCooldowns[id]=w.cd;this.stats.specials=(this.stats.specials||0)+1;
  if(id==='chargeLaser'){
   let end=1280;for(const g of this.gates)if(g.x>p.x&&(p.y<g.gapY-g.gap/2+13||p.y>g.gapY+g.gap/2-13))end=Math.min(end,g.x-g.w/2);
   this.laserVisual={x:p.x+28,y:p.y,end,life:.32};
   for(const e of this.enemies)if(!e.dead&&!e.exit&&e.x>=p.x+28&&e.x-e.r<end&&Math.abs(e.y-p.y)<=e.r+13){e.hp-=45;e.flash=.08;this.gainEnergy(2);if(e.hp<=0)this.defeat(e);}
   const b=this.boss;if(b&&b.age>2&&b.x-b.r<end&&b.x>p.x&&Math.abs(b.y-p.y)<=b.r+13){b.hp-=65;b.flash=.08;this.gainEnergy(3);}
   this.emit('laserFire');
  }else{
   const angles=id==='shotgun'?[-.45,-.30,-.15,0,.15,.30,.45]:[0];
   for(const a of angles){const velocity=this.tuning.playerBulletSpeed*.864;this.shots.push({id:++this.id,x:p.x+28,y:p.y,vx:velocity*Math.cos(a),vy:velocity*Math.sin(a),r:id==='explosive'?10:8,damage:id==='explosive'?22:7,life:1.6,pierce:1,hit:new Set(),kind:id==='explosive'?'explosive':'leaf',rank:2,special:true});}
   this.emit(id==='explosive'?'explosiveFire':'shotgunFire');
  }
 }
 triggerTrait(){const p=this.player;if(this.phase!=='combat'||this.paused||p.traitCD>0)return false;
  p.traitCD=4;this.stats.traits=(this.stats.traits||0)+1;
  this.shots.push({id:++this.id,x:p.x+34,y:p.y,vx:this.tuning.playerBulletSpeed*.693,vy:0,r:15,damage:18,life:2.2,pierce:4,hit:new Set(),kind:'traitLeaf',rank:3,special:true,spin:0});
  this.emit('traitFire');return true;
 }
 explode(shot,target){this.emit('burst',target.x,target.y);for(const e of this.enemies)if(e!==target&&!e.dead&&!e.exit&&distance(e,target)<105){e.hp-=16;e.flash=.06;this.gainEnergy(1);if(e.hp<=0)this.defeat(e);}}
 triggerUltimate(){if(this.paused||this.phase!=='combat'||this.ultimateEnergy<100)return false;
  this.ultimateEnergy=0;this.phase='ultimate';this.phaseTime=0;this.charging=null;this.stats.bombs++;this.emit('ultimateStart');return true;
 }
 finishUltimate(){this.bullets=[];for(const e of this.enemies){e.hp-=130;if(e.hp<=0)this.defeat(e);}if(this.boss?.age>2)this.boss.hp-=200;
  this.phase='combat';this.phaseTime=0;this.player.invuln=Math.max(this.player.invuln,1);this.last={};this.pending={};this.emit('bomb');}
 findSafeRespawn(){const x=155,candidates=[240,140,340,75,405];return candidates.map(y=>({x,y})).find(p=>this.gates.every(g=>Math.abs(p.x-g.x)>=g.w/2+40||(p.y>=g.gapY-g.gap/2+28&&p.y<=g.gapY+g.gap/2-28)))||null;}
 finishGuardian(){const spot=this.findSafeRespawn();if(!spot)return false;const p=this.player;p.x=spot.x;p.y=spot.y;p.hp=1;p.invuln=1;p.shotCD=.25;
  this.bullets=this.bullets.filter(b=>distance(b,p)>260);this.phase='combat';this.phaseTime=0;this.last={};this.pending={};this.emit('guardianRevive',p.x,p.y);this.message('母上的守護 · 回復 1 HP，短暫無敵！');return true;}

 spawn(kind,x,y,pattern='line',group=0){const d=STAR_ENEMIES[kind],hp=d.hp*(kind===0?1:1+this.dangerTier*.08)*this.tuning.enemyHpScale;const e={id:++this.id,kind,x,y,baseY:y,pattern,group,age:0,fireCD:1.7+this.random(),...d,hp,maxHp:hp,flash:0,exit:false,state:'enter',targetY:y,charge:0};this.enemies.push(e);return e;}
 wave(pattern){const group=++this.id,y=90+this.random()*300,count=base=>Math.max(1,Math.round(base*this.tuning.waveScale));
  if(pattern===0)for(let i=0,n=count(7);i<n;i++)this.spawn(0,1330+i*47,clamp(y+Math.abs(i-(n-1)/2)*20,45,435),'sine',group);
  if(pattern===1){this.spawn(1,1360,170,'float',group);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1370+i*65,340,'line',group);}
  if(pattern===2){this.addTerrain(1500,240,260,true);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1340+i*65,240,'line',group);}
  if(pattern===3){this.spawn(3,1350,100+this.random()*280,'charge',group);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1440+i*50,clamp(y,60,420),'line',group);}
  if(pattern===4){this.spawn(1,1360,clamp(y,100,380),'float',group);for(let i=0,n=count(3);i<n;i++)this.spawn(5,1520+i*100,90+(i%3)*140,'sine',group);}
  if(pattern===5)for(let i=0,n=count(6);i<n;i++)this.spawn(5,1330+i*70,clamp(y,90,390),'sine',group);
  if(pattern===6)for(let i=0,n=count(3);i<n;i++){const e=this.spawn(6,920+i*170,454,'lakeLeap',group);e.charge=.8+i*.34;}
  if(pattern===7)for(let i=0,n=count(6);i<n;i++)this.spawn(7,1330+i*64,i%2?420:60,'sine',group);
  if(pattern===8)for(let i=0,n=count(5);i<n;i++)this.spawn(8,1330+i*72,75+(i%3)*145,'sine',group);
  if(pattern===9)for(let i=0,n=count(5);i<n;i++)this.spawn(9,1330+i*78,390-(i%2)*85,'hop',group);
  if(pattern===10)for(let i=0,n=count(4);i<n;i++)this.spawn(10,1340+i*95,90+(i%3)*130,'float',group);
  if(pattern===11)for(let i=0,n=count(6);i<n;i++)this.spawn(11,1330+i*68,70+(i%4)*105,'sine',group);
 }
 addTerrain(x=1440,gapY=240,gap=250,turret=false){if(this.gates.some(g=>g.x>700))return null;const gate={id:++this.id,x,w:100,gapY,gap,scored:false};this.gates.push(gate);if(turret){const e=this.spawn(2,x-15,gapY-gap/2-19,'turret');e.gateId=gate.id;}return gate;}
 aimed(x,y,speed,offset=0){const a=Math.atan2(this.player.y-y,this.player.x-x)+offset,velocity=speed*this.tuning.enemyBulletScale;this.bullets.push({id:++this.id,x,y,vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,r:3,visualRadius:8,life:12,grazed:false});}
 shoot(){const p=this.player,rank=this.weaponRanks.clover,origins=[{x:p.x+23,y:p.y,factor:1},...this.optionPositions.map(o=>({...o,factor:.38}))];
  for(const o of origins)this.shots.push({id:++this.id,x:o.x,y:o.y,vx:this.tuning.playerBulletSpeed,vy:0,r:6,damage:(2+rank)*o.factor,life:1.7,pierce:1,hit:new Set(),kind:'leaf',rank,option:o.factor<1});
  p.shotCD=this.tuning.shotCooldown;this.emit('shot');
 }

 defeat(e){if(e.dead)return;e.dead=true;this.gainEnergy(e.kind===1?4:1.5);this.stats.cleared++;this.chain++;this.chainLife=3;this.score+=(e.kind===1?250:70)*(1+Math.min(3,Math.floor(this.chain/10)));this.emit(e.kind===1?'elite':'pop',e.x,e.y,{kind:e.kind});
  if(e.kind===4)this.addPickup('weapon',e.x,e.y);const count=e.kind===1?5:1;for(let i=0;i<count;i++)this.addPickup('gem',e.x+(i%3)*14,e.y+(i-2)*11);}
 advance(seconds,input={}){if(this.paused||this.status!=='playing')return 0;this.accumulator+=clamp(seconds,0,.1);let steps=0;
  for(const key of ['special','bomb','trait']){if(input[key]&&!this.last[key])this.pending[key]=true;this.last[key]=!!input[key];}
  const edge={special:false,bomb:false,trait:false,...this.pending};while(this.accumulator+1e-9>=STAR_FIELD.step){this.stepPhase(STAR_FIELD.step,{...input,...(steps===0?edge:{special:false,bomb:false,trait:false})});this.accumulator-=STAR_FIELD.step;this.pending={};steps++;if(this.status!=='playing'||this.paused){this.accumulator=0;break;}}return steps;}
 stepPhase(dt,input){if(this.phase==='ultimate'){this.phaseTime+=dt;if(this.phaseTime>=3)this.finishUltimate();return;}
  if(this.phase==='guardian'){this.phaseTime+=dt;if(this.phaseTime>=STAR_PHASE1.guardianSeconds)this.finishGuardian();return;}
  if(this.phase==='falling'){this.phaseTime+=dt;if(this.phaseTime>=1){if(this.guardianEnabled&&!this.guardianUsed){this.guardianUsed=true;this.phase='guardian';this.phaseTime=0;this.emit('guardianStart');}else{this.status='lost';this.emit('end');}}return;}
  if(input.bomb&&this.triggerUltimate())return;
  this.tick(dt,input);
 }

 enterSegment(index){this.segment=index;this.stage=index;this.branchOffer=null;this.hazards=[];this.checkpoint=this.snapshot();this.emit('stage',0,0,{theme:this.currentMap?.theme});this.message('進入 '+this.currentMap.name);}
 timelineEvent(e){
  if(e.type==='region')this.message('區域 '+(e.index+1)+'／'+STAR_ROUTE_LENGTH+' · '+this.route[e.index].name);
  if(e.type==='wave')this.wave(this.gates.length&&[3,4,5,7,8,9,10,11].includes(e.pattern)?0:e.pattern);if(e.type==='terrain')this.addTerrain(1440,240,260,true);
  if(e.type==='squirrel'&&!this.gates.some(g=>g.x>0))this.spawn(3,1340,100+this.random()*280,'charge');
  if(e.type==='carrier'){this.spawn(4,1310,240,'float');this.message('紅帽補給雲來了！擊破可取得普攻強化星星');}
  if(e.type==='option')this.addPickup('option',1300,240);if(e.type==='heart')this.addPickup('gem',1300,240);
  if(e.type==='gust'){this.message('前方風帶 · 順著風勢微調高度');this.emit('environment',0,0,{kind:'gust'});}
  if(e.type==='mist'){this.hazards.push({id:++this.id,kind:'mist',x:1380,y:90+this.random()*300,r:105,age:0,life:13});this.emit('environment',0,0,{kind:'mist'});}
  if(e.type==='lakeJump'){for(let i=0;i<2;i++){const enemy=this.spawn(6,890+i*250,454,'lakeLeap');enemy.charge=.85+i*.42;}this.message('湖面冒出泡泡 · 小心水豚躍起！');}
  if(e.type==='rockfall'){this.hazards.push({id:++this.id,kind:'rock',x:650+this.random()*500,y:-30,r:22,age:0,life:4.2,warn:1,vy:0,hit:false});this.message('洞頂星塵落下 · 留意落石預警！');}
  if(e.type==='icefall'){this.hazards.push({id:++this.id,kind:'icicle',x:560+this.random()*620,y:-35,r:18,age:0,life:4,warn:.9,vy:0,hit:false});this.message('冰晶發出亮光 · 冰柱即將掉落！');}
  if(e.type==='marsh'){this.hazards.push({id:++this.id,kind:'marsh',x:1380,y:100+this.random()*280,r:120,age:0,life:14});this.message('濕地泡泡霧 · 進入會稍微減速');}
  if(e.type==='ember'){this.hazards.push({id:++this.id,kind:'ember',x:720+this.random()*470,y:-35,r:20,age:0,life:4.5,warn:.75,vx:-75-this.random()*70,vy:0,hit:false});this.message('岩漿亮起紅圈 · 火山星石即將噴出！');}
  if(e.type==='canopy'){this.addTerrain(1440,150+this.random()*180,225,false);this.message('古木枝幹交錯 · 尋找發光缺口！');}
  if(e.type==='branch')this.openBranch();
  if(e.type==='warning'){this.message('前方大型反應！熊船長靠近了');this.emit('warning');}
  if(e.type==='boss')this.startBoss();
 }
 startBoss(){if(this.boss)return;this.segment=STAR_ROUTE_LENGTH;this.stage=STAR_ROUTE_LENGTH;this.branchOffer=null;this.hazards=[];this.bullets=[];this.warnings=[];for(const e of this.enemies){e.exit=true;this.emit('pop',e.x,e.y);}
  const hp=850*this.tuning.enemyHpScale;this.gates=[];this.boss={x:1460,y:240,r:82,hp,maxHp:hp,age:0,fireCD:2,phase:1,cycle:0,beam:-1,beamY:240,flash:0};this.checkpoint=this.snapshot();this.message('熊船長的飛行城堡現身！');this.emit('boss');}
 tick(dt,input){
  this.time+=dt;const p=this.player;this.noticeLife=Math.max(0,this.noticeLife-dt);this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;
  for(const k of ['invuln','dashCD','dashing','shotCD','traitCD'])p[k]=Math.max(0,p[k]-dt);
  const segment=Math.min(STAR_ROUTE_LENGTH,Math.floor(this.time/STAR_REGION_SECONDS));if(segment!==this.segment&&segment<STAR_ROUTE_LENGTH){if(this.branchOffer&&!this.branchOffer.selected)this.chooseBranch(this.random()<.5?'top':'bottom','random');this.enterSegment(segment);}
  this.energyBudget=Math.max(0,this.energyBudget-1.5*dt);
  for(const k of Object.keys(this.specialCooldowns))this.specialCooldowns[k]=Math.max(0,this.specialCooldowns[k]-dt);
  if(this.laserVisual){this.laserVisual.life-=dt;if(this.laserVisual.life<=0)this.laserVisual=null;}
  if(this.charging){this.charging.elapsed+=dt;if(this.charging.elapsed+1e-9>=STAR_PHASE1.chargeSeconds){const id=this.charging.id;this.charging=null;this.fireSpecial(id);}}
  if(input.special)this.triggerSpecial();
  if(input.trait)this.triggerTrait();
  this.environmentSlow=1;for(const h of this.hazards){h.age+=dt;h.life-=dt;if(h.kind==='mist'||h.kind==='marsh'){h.x-=(h.kind==='mist'?62:48)*dt;if(Math.hypot((h.x-p.x)*.72,h.y-p.y)<h.r)this.environmentSlow=Math.min(this.environmentSlow,h.kind==='mist'?.72:.82);}
   if((h.kind==='rock'||h.kind==='icicle')&&h.age>=h.warn){h.vy=Math.min(h.kind==='icicle'?430:360,h.vy+(h.kind==='icicle'?680:540)*dt);h.y+=h.vy*dt;if(!h.hit&&distance(h,p)<h.r+STAR_FIELD.hitRadius+5){h.hit=true;this.hit();}}
   if(h.kind==='ember'&&h.age>=h.warn){h.vy=Math.min(390,h.vy+620*dt);h.x+=h.vx*dt;h.y+=h.vy*dt;if(!h.hit&&distance(h,p)<h.r+STAR_FIELD.hitRadius+6){h.hit=true;this.hit();}}}
  this.hazards=this.hazards.filter(h=>h.life>0&&h.x>-160&&h.y<530);
  const x=input.x||0,y=input.y||0,n=Math.max(1,Math.hypot(x,y)),speed=this.tuning.playerSpeed*this.environmentSlow*(input.slow?.55:1)*(p.dashing>0?2.2:1);
  const drift=this.currentMap?.hazard==='gust'&&!this.gates.length?Math.sin(this.time*1.4)*18:0;
  p.x=clamp(p.x+x/n*speed*dt,30,1225);p.y=clamp(p.y+(y/n*speed+drift)*dt,22,458);
  if(this.branchOffer&&!this.branchOffer.selected&&p.x>=STAR_PHASE1.branchFlightX&&(p.y<190||p.y>290))this.chooseBranch(p.y<190?'top':'bottom','flight');
  this.optionTrail.push({x:p.x,y:p.y});if(this.optionTrail.length>85)this.optionTrail.shift();
  this.optionPositions=Array.from({length:this.options},(_,i)=>{const a=this.optionTrail[Math.max(0,this.optionTrail.length-1-25*(i+1))]||p;return {x:a.x-45*(i+1),y:a.y};});
  if(p.shotCD<=0)this.shoot();
  while(this.eventIndex<this.timeline.length&&this.time>=this.timeline[this.eventIndex].at)this.timelineEvent(this.timeline[this.eventIndex++]);
  if(this.boss)this.stepBoss(dt);
  for(const gate of this.gates){gate.x-=STAR_FIELD.scrollSpeed*dt;
   const overlap=Math.abs(p.x-gate.x)<gate.w/2+STAR_FIELD.hitRadius,outside=p.y<gate.gapY-gate.gap/2+5||p.y>gate.gapY+gate.gap/2-5;
   if(overlap&&outside){this.hit();p.y=clamp(p.y,gate.gapY-gate.gap/2+8,gate.gapY+gate.gap/2-8);}
   if(!gate.scored&&gate.x<p.x-70){gate.scored=true;this.score+=150;this.emit('gate');}}
  this.gates=this.gates.filter(g=>g.x>-120);
  for(const e of this.enemies){if(e.dead||e.exit)continue;e.age+=dt;e.flash=Math.max(0,e.flash-dt);
   if(e.kind===2){const gate=this.gates.find(g=>g.id===e.gateId);if(!gate){e.exit=true;continue;}e.x=gate.x-15;}
   else if(e.kind===6&&e.pattern==='lakeLeap'){if(e.state==='enter'){e.charge-=dt;if(e.charge<=0){e.state='leap';e.age=0;}}else{e.x-=125*this.tuning.enemySpeedScale*dt;e.y=454-Math.sin(Math.min(1,e.age/2.2)*Math.PI)*300;if(e.age>2.2)e.exit=true;}}
   else if(e.kind===3){if(e.state==='enter'){e.x-=210*this.tuning.enemySpeedScale*dt;if(e.x<=1050){e.state='aim';e.charge=1;e.targetY=p.y;}}
    else if(e.state==='aim'){e.charge-=dt;e.y+=(e.targetY-e.y)*Math.min(1,dt*8);if(e.charge<=0){e.state='dash';e.y=e.targetY;}}
    else e.x-=650*this.tuning.enemySpeedScale*dt;}
   else{e.x-=e.speed*this.tuning.enemySpeedScale*dt;if(e.pattern==='sine')e.y=clamp(e.baseY+Math.sin(e.age*(e.kind===5?3:2))*(e.kind===5?55:22),30,450);if(e.pattern==='float')e.y=e.baseY+Math.sin(e.age*2)*15;if(e.pattern==='hop')e.y=clamp(e.baseY-Math.abs(Math.sin(e.age*2.6))*95,40,450);}
   if(e.x<-100)e.exit=true;e.fireCD-=dt;
   if(e.x>340&&e.x<1200&&e.fireCD<=0){if(e.kind===2)for(const off of [-.26,0,.26])this.aimed(e.x-18,e.y,this.difficulty==='challenge'?205:155,off);if(e.kind===1)this.aimed(e.x-30,e.y,135);if(e.kind===10)for(const off of [-.16,.16])this.aimed(e.x-18,e.y,145,off);e.fireCD=e.kind===2?2.1:e.kind===10?2.5:3;}
   if(!(e.kind===6&&e.state==='enter')&&distance(e,p)<e.r+STAR_FIELD.hitRadius)this.hit();
  }
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;
   if(shot.kind==='homing'){if(!shot.target||shot.target.dead||shot.target.exit||shot.target.hp<=0)shot.target=this.enemies.filter(e=>!e.dead&&!e.exit&&e.x>shot.x-40).sort((a,b)=>distance(a,shot)-distance(b,shot))[0]||(this.boss?.age>2?this.boss:null);
    const target=shot.target;if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),velocity=this.tuning.playerBulletSpeed*.693;shot.vx+=(Math.cos(a)*velocity-shot.vx)*dt*5;shot.vy+=(Math.sin(a)*velocity-shot.vy)*dt*5;}}
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   for(const gate of this.gates)if(shot.x>gate.x-gate.w/2&&ox<gate.x+gate.w/2&&(shot.y<gate.gapY-gate.gap/2||shot.y>gate.gapY+gate.gap/2))shot.life=0;
   if(shot.life<=0)continue;
   for(const e of this.enemies)if(!e.dead&&!e.exit&&!shot.hit.has(e.id)&&starSweep(ox,oy,shot.x,shot.y,e.x,e.y,e.r+shot.r)){
    e.hp-=shot.damage;this.gainEnergy(shot.option?.15:.6);e.flash=.035;shot.hit.add(e.id);shot.pierce--;if(e.hp<=0)this.defeat(e);
    if(shot.kind==='explosive')this.explode(shot,e);
    if(shot.kind==='homing'&&shot.rank===3){this.emit('burst',e.x,e.y);for(const other of this.enemies)if(other!==e&&!other.dead&&distance(e,other)<65){other.hp-=shot.damage*.45;if(other.hp<=0)this.defeat(other);}}
    if(shot.pierce<=0){shot.life=0;break;}}
   const b=this.boss;if(shot.life>0&&b&&b.age>2&&!shot.hit.has('boss')&&starSweep(ox,oy,shot.x,shot.y,b.x,b.y,b.r+shot.r)){b.hp-=shot.damage;this.gainEnergy(shot.option?.15:.6);if(shot.kind==='explosive')this.explode(shot,b);b.flash=.035;shot.hit.add('boss');shot.life=0;this.emit('spark',shot.x,shot.y);}
  }
  for(const b of this.bullets){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
   if(starSweep(ox,oy,b.x,b.y,p.x,p.y,b.r+STAR_FIELD.hitRadius)){this.hit();b.life=0;}
   else if(!b.grazed&&p.invuln<=0&&starSweep(ox,oy,b.x,b.y,p.x,p.y,b.r+20)){b.grazed=true;this.stats.graze++;this.score+=20;this.emit('graze');}
   for(const gate of this.gates)if(Math.abs(b.x-gate.x)<gate.w/2&&(b.y<gate.gapY-gate.gap/2||b.y>gate.gapY+gate.gap/2))b.life=0;
  }
  for(const item of this.pickups){
   // Close approach locks the visible colour for 0.35 s once per item.
   if(item.kind==='weapon'&&!item.locked&&distance(item,p)<65)item.locked={id:starColor(item).id,until:item.age+.35};
   const captured=item.locked&&item.age<item.locked.until?item.locked.id:starColor(item).id;
   item.age+=dt;item.life-=dt;item.x-=(item.kind==='weapon'?84:105)*dt;
   if(item.kind!=='weapon'&&distance(item,p)<65){item.x+=(p.x-item.x)*dt*6;item.y+=(p.y-item.y)*dt*6;}
   if(this.status==='playing'&&this.phase==='combat'&&distance(item,p)<item.r+12){item.life=0;
    if(item.kind==='weapon')this.collectWeapon(captured);
    else if(item.kind==='option'){this.options=Math.min(2,this.options+1);this.stats.rescued++;this.score+=300;this.emit('rescue');this.message('妹妹精靈加入！同步輔助射擊');}
    else if(item.kind==='heart'){this.score+=100;this.emit('energy');}
    else{this.score+=100;this.emit('energy',item.x,item.y);}}
  }
  this.enemies=this.enemies.filter(e=>!e.dead&&!e.exit);this.shots=this.shots.filter(s=>s.life>0&&s.x<1450&&s.x>-80&&s.y>-70&&s.y<550);
  this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-70&&b.x<1350&&b.y>-70&&b.y<550);this.pickups=this.pickups.filter(i=>i.life>0&&i.x>-70);
  if(this.boss?.hp<=0&&this.status==='playing'&&this.phase==='combat'){this.status='won';this.score+=5000+p.hp*250;this.emit('end');}
 }
 stepBoss(dt){const b=this.boss;b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.x=Math.max(1070,b.x-125*this.tuning.enemySpeedScale*dt);b.y=240+Math.sin(b.age*.65*this.tuning.enemySpeedScale)*100;
  b.phase=b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.67?2:1;if(b.age<3)return;
  b.fireCD-=dt;if(b.fireCD<=0){b.cycle++;const speed=this.difficulty==='challenge'?215:170;for(let i=-b.phase;i<=b.phase;i++)this.aimed(b.x-80,b.y,speed,i*.19);
   b.fireCD=b.phase===3?1.2:1.8;if(b.phase>=2&&b.cycle%5===0){b.beam=2.5;b.beamY=this.player.y;this.message('星光炮蓄力：離開粉紅光帶！');}}
  if(b.beam>-1){b.beam-=dt;if(b.beam<.6&&b.beam>0&&Math.abs(this.player.y-b.beamY)<26&&this.player.x<b.x)this.hit();}
  if(distance(b,this.player)<b.r+STAR_FIELD.hitRadius)this.hit();
  if(this.time>=this.nextBossGift){this.addPickup('weapon',900,240);this.addPickup('gem',840,110+this.random()*260);this.nextBossGift+=18;}
 }
}

return {StarflightSession,StarflightTouch,STAR_CONTROLS,STAR_FIELD,STAR_WEAPONS,STAR_SPECIALS,STAR_PHASE1,STAR_TUNING,starColor};
})();
const __scene=(function(){
const {AnimalSnackGame}=__animal;const {preferences}=__prefs;const {StarflightSession,StarflightTouch,STAR_CONTROLS,STAR_FIELD,STAR_WEAPONS,STAR_SPECIALS,STAR_PHASE1,STAR_TUNING,starColor}=__rules;
const TOP=64,H=480,SCALE=1.27;
const FRAMES={hero:[0,174,348,456],fairy:[632,794,224,334],boss:[842,645,412,514]};
const SKY={cloud:'star_sky',market:'star_sky_market',honey:'star_sky_honey',crystal:'star_sky_crystal',harbor:'star_sky_harbor'};
const MAGIC=['clover','beam','dandelion','option','bubble'];
const MOTHER_GUARD='item_fullset_secret_guard';
const DOLL_BODIES={
 item_cloth_daily_01:['star_doll_daily','assets/wardrobe_v50/doll_daily_v50.png','日常休閒裝'],
 item_fullset_pink_home_01:['star_doll_pink','assets/wardrobe_v50/doll_pink_home_v50_alpha.png','粉色居家服'],
 item_cloth_fairy_01:['star_doll_fairy','assets/wardrobe_v52/doll_fairy_v52.png','森林精靈服'],
 item_cloth_explore_01:['star_doll_explore','assets/wardrobe_v53/doll_explore_v53.png','冒險衣'],
 item_fullset_explore_01:['star_doll_explore_full','assets/wardrobe_v53/doll_explore_full_nohat_v53.png','森林探險套裝'],
 item_cloth_firefly_01:['star_doll_firefly','assets/wardrobe_v53/doll_firefly_v53.png','螢火守望服'],
 item_fullset_firefly_01:['star_doll_forest_fairy','assets/wardrobe_v53/doll_forest_fairy_nohat_v53.png','森林精靈套裝'],
 item_cloth_campfire_01:['star_doll_campfire','assets/wardrobe_v53/doll_campfire_v53.png','營火工作服'],
 item_fullset_campfire_01:['star_doll_chef','assets/wardrobe_v52/doll_chef_v52.png','森林廚師套裝'],
 item_cloth_constellation_01:['star_doll_constellation','assets/wardrobe_v53/doll_constellation_v53.png','星座學徒服'],
 item_fullset_constellation_01:['star_doll_astronaut','assets/wardrobe_v52/doll_astronaut_v52.png','銀河特工套裝'],
 [MOTHER_GUARD]:['star_doll_mother','assets/wardrobe_v53/doll_mother_guard_v53.png','母上的守護'],
 item_cloth_fairytale_peach:['star_doll_peach','assets/wardrobe_v55/doll_peach.png','蜜桃精靈連身裝'],
 item_cloth_fairytale_dandelion:['star_doll_dandelion','assets/wardrobe_v55/doll_dandelion.png','蒲公英絨毛斗篷'],
 item_cloth_fairytale_acorn:['star_doll_acorn','assets/wardrobe_v55/doll_acorn.png','橡果工匠吊帶褲'],
 item_fullset_fairytale_raincoat:['star_doll_raincoat','assets/wardrobe_v55/doll_raincoat.png','大象水車雨衣'],
 item_cloth_fairytale_orbit:['star_doll_orbit','assets/wardrobe_v55/doll_orbit.png','夜空星軌法袍']
};
const DOLL_HATS={
 item_hat_fairytale_capybara:['star_hat_capybara','assets/wardrobe_v55/hat_capybara.png'],item_hat_fairytale_nightcap:['star_hat_nightcap','assets/wardrobe_v55/hat_nightcap.png'],
 item_hat_fairytale_lemon:['star_hat_lemon','assets/wardrobe_v55/hat_lemon.png'],item_hat_fairytale_pinecone:['star_hat_pinecone','assets/wardrobe_v55/hat_pinecone.png'],item_hat_fairytale_swan:['star_hat_swan','assets/wardrobe_v55/hat_swan.png'],
 item_hat_explore_01:['star_hat_explorer','assets/wardrobe_v53/hat_overlay_explorer_v53.png'],item_hat_firefly_01:['star_hat_firefly','assets/wardrobe_v53/hat_overlay_firefly_v53.png'],
 item_hat_campfire_01:['star_hat_chef','assets/wardrobe_v53/hat_overlay_chef_v53.png'],item_hat_constellation_01:['star_hat_star','assets/wardrobe_v53/hat_overlay_star_magic_v53.png'],
 item_hat_tiara_global:['star_hat_crown','assets/wardrobe_v53/hat_overlay_crown_v53.png'],item_hat_fairy_01:['star_hat_crown','assets/wardrobe_v53/hat_overlay_crown_v53.png'],item_hat_forest_fairy_01:['star_hat_forest_fairy','assets/wardrobe_v53/hat_overlay_forest_fairy_v53.png']
};
class ForestStarflightGame extends AnimalSnackGame{
 constructor(){super('ForestStarflightGame');}
 preload(){this.flightLook=this.readFlightLook();const files={crew:'crew.png',sky:'sky.png',sky_market:'sky-market-v02.png',sky_honey:'sky-honey-v02.png',sky_crystal:'sky-crystal-v02.png',sky_harbor:'sky-harbor-v02.png'};
  for(const [key,file]of Object.entries(files))if(!this.textures.exists('star_'+key))this.load.image('star_'+key,'assets/forest-starflight/'+file);
  for(const key of MAGIC)if(!this.textures.exists('stg04_'+key))this.load.image('stg04_'+key,'assets/forest-starflight/magic-v04/'+key+'.png');
  const assets=[DOLL_BODIES.item_cloth_daily_01,DOLL_BODIES[MOTHER_GUARD],this.flightLook.body,this.flightLook.hat].filter(Boolean);
  for(const [key,file]of assets)if(!this.textures.exists(key))this.load.image(key,file);}
 create(){
  this.mode='title';this.session=null;this.touch=new StarflightTouch();this.held=new Set();this.requests={};this.views=new Map();this.effects=[];this.audioNodes=new Set();this.flightLook=this.readFlightLook();
  this.soundOn=preferences.value.sfx;this.autoFire=true;this.selectedSpecial='chargeLaser';this.difficulty='normal';this.overlay=null;
  this.reducedFX=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  if(this.textures.exists('star_crew')){const t=this.textures.get('star_crew'),im=t.getSourceImage();for(const [k,[x,y,w,h]]of Object.entries(FRAMES))if(!t.has(k))t.add(k,0,Math.round(x*im.width/1254),Math.round(y*im.height/1254),Math.round(w*im.width/1254),Math.round(h*im.height/1254));}
  this.input.addPointer(Math.max(0,4-(this.input.manager.pointersTotal||1)));const canvas=this.game.canvas,old=canvas.style.touchAction;canvas.style.touchAction='none';
  this.down=p=>{this.sound.context?.resume?.()?.catch?.(()=>{});if(this.mode==='playing'&&!this.chooseBranchAt(p.x,p.y))this.touch.down(p);};
  this.move=p=>{if(this.mode==='playing')this.touch.move(p);};this.up=p=>this.touch.up(p);this.cancel=()=>this.clearInput();
  this.keydown=e=>{if(e.repeat)return;if(['Escape','KeyP'].includes(e.code)){this.mode==='gm'?this.closeGMPanel():this.mode==='bay'?this.closeWeaponBay():this.mode==='paused'?this.resumeGame():this.pauseGame();return;}if(e.code==='KeyG'&&this.mode==='playing'){this.openGMPanel();return;}if(this.mode!=='playing')return;
   this.held.add(e.code);if(e.code==='Space'||e.code==='KeyK')this.requests.bomb=true;if(e.code==='KeyJ')this.requests.special=true;if(e.code==='KeyI')this.requests.trait=true;if(e.code==='KeyL')this.requests.bay=true;};
  this.keyup=e=>this.held.delete(e.code);
  this.input.on('pointerdown',this.down);this.input.on('pointermove',this.move);this.input.on('pointerup',this.up);this.input.on('pointerupoutside',this.up);this.input.on('gameout',this.cancel);
  this.input.keyboard?.on('keydown',this.keydown);this.input.keyboard?.on('keyup',this.keyup);this.input.keyboard?.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  this.blur=()=>this.pauseGame();this.hidden=()=>{if(document.hidden)this.pauseGame();};this.resize=()=>{if(this.portrait())this.pauseGame();};
  this.game.events.on('blur',this.blur);document.addEventListener('visibilitychange',this.hidden);window.addEventListener('resize',this.resize);window.addEventListener('pointercancel',this.cancel);
  this.events.once('shutdown',()=>{canvas.style.touchAction=old;this.input.off('pointerdown',this.down);this.input.off('pointermove',this.move);this.input.off('pointerup',this.up);this.input.off('pointerupoutside',this.up);this.input.off('gameout',this.cancel);
   this.input.keyboard?.off('keydown',this.keydown);this.input.keyboard?.off('keyup',this.keyup);this.input.keyboard?.removeCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
   this.game.events.off('blur',this.blur);document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('resize',this.resize);window.removeEventListener('pointercancel',this.cancel);
   this.clearInput();this.stopTones();this.maskShape?.destroy();this.fieldMask?.destroy();});
  if(Object.values(SKY).some(k=>!this.textures.exists(k))||!this.textures.exists('star_crew')||MAGIC.some(k=>!this.textures.exists('stg04_'+k))){
   this.add.rectangle(640,360,1280,720,0x173f43);this.text(640,260,'星航素材尚未齊全\n請保留 v0.2 背景，並合併本包 assets 資料夾',30);this.b(640,450,340,80,'返回遊戲列表',()=>this.leave());return;}
  this.registerMagicFrames();
  this.showTitle();
 }
 text(x,y,t,size=24,color='#fff3d2',origin=.5){return super.text(x,y,t,size,color,origin);}
 b(x,y,w,h,t,fn,color=0x31686b){const c=super.button(x,y,w,h,t,fn,color,'#fff7df');c.label.setFontSize(25);return c;}
 portrait(){return window.innerHeight>window.innerWidth;}
 clearInput(){this.touch?.reset();this.held?.clear();this.requests={};if(this.session){this.session.last={};this.session.pending={};}}
 clear(){this.clearInput();this.tweens.killAll();this.fieldMask?.destroy();this.maskShape?.destroy();this.fieldMask=null;this.maskShape=null;for(const child of this.children.getChildren().slice())child.destroy();this.views.clear();this.effects=[];this.overlay=null;this.ultimateOverlay=null;this.guardianOverlay=null;this.launchOverlay=null;}
 art(x,y,frame,size,parent=null){const im=this.add.image(x,y,'star_crew',frame);im.setScale(size/Math.max(im.width,im.height));parent?.add(im);return im;}
 readFlightLook(){let saved={};try{saved=JSON.parse(globalThis.localStorage?.getItem('forest_save_data')||'{}');}catch{}const get=k=>{try{const value=this.registry?.get(k);if(value!==undefined&&value!==null&&value!=='')return value;}catch{}return saved[k]||'none';},fullsetId=get('equipped_fullset'),clothId=get('equipped_cloth'),hatId=get('equipped_hat');
  const bodyId=fullsetId!=='none'?fullsetId:clothId!=='none'?clothId:'item_cloth_daily_01',body=DOLL_BODIES[bodyId]||DOLL_BODIES.item_cloth_daily_01;
  return {bodyId,hatId,body,hat:bodyId==='item_fullset_fairytale_raincoat'?null:DOLL_HATS[hatId]||null,guardian:bodyId===MOTHER_GUARD};}
 doll(parent,x,y,maxW,maxH,alpha=1,tint=0xffffff){const look=this.flightLook||this.readFlightLook(),c=this.add.container(x,y);parent?.add(c);const bodyKey=this.textures.exists(look.body[0])?look.body[0]:DOLL_BODIES.item_cloth_daily_01[0];
  const body=this.add.image(0,0,bodyKey),scale=Math.min(maxW/body.width,maxH/body.height);body.setScale(scale).setAlpha(alpha).setTint(tint);c.add(body);
  if(look.hat&&this.textures.exists(look.hat[0])){const hat=this.add.image(0,0,look.hat[0]).setScale(scale).setAlpha(alpha).setTint(tint);if(look.hat[1].includes('wardrobe_v55'))hat.y-=132*scale;c.add(hat);}return c;}
 showTitle(){this.clear();this.flightLook=this.readFlightLook();this.mode='title';this.add.image(640,360,'star_sky_harbor').setDisplaySize(1280,854);this.add.rectangle(640,360,1280,720,0x102d35,.42);
  this.text(640,39,'森林飛行機艙',39,'#fff1c5');this.text(640,78,'選好飛行夥伴與裝備，再從樹冠彈射出擊　·　v'+STAR_PHASE1.version,19,'#d7ece1');
  this.panel(177,372,300,550,0xf2e4c7,0xc19a62,24);this.text(177,121,'本次穿戴',24,'#4d5947');this.doll(null,177,328,218,344);
  this.text(177,530,this.flightLook.body[2],21,'#4d5947');this.text(177,568,this.flightLook.guardian?'✓ 母上的守護\n致命時復活一次':'套裝能力：效果待開放',17,this.flightLook.guardian?'#8a6233':'#807c70');
  this.panel(520,348,340,500,0x193f4c,0xcab887,24);this.text(520,123,'飛行夥伴',24,'#ffe2a1');this.art(520,274,'hero',250);this.text(520,398,'森林芽翼 01　✓ 已選擇',23,'#dff5de');
  this.text(520,449,'普攻　種子直射\n特色　迴旋葉刃\n攻擊　●●○　移動　●●○\n回能　●●○　回撤　●●○',18,'#c9e3dc');this.text(520,540,'更多鳥類與隱藏機體將在後續開放',15,'#9fbab5');
  this.panel(972,324,530,452,0x173e4d,0xcab887,24);this.text(972,119,'特殊武器',24,'#ffe2a1');
  STAR_SPECIALS.forEach((w,i)=>{const y=184+i*82,b=this.b(972,y,460,64,(this.selectedSpecial===w.id?'✓ ':'')+w.name+'　CD '+w.cd+'秒',()=>{this.selectedSpecial=w.id;this.showTitle();},this.selectedSpecial===w.id?0x82702e:0x31686b);b.label.setFontSize(21);});
  this.text(972,443,'大招　妍妍的星光祝福\n生命　2／2　・　普攻 CD 0.5 秒',19,'#d9e7d7');
  this.diffButton=this.b(857,521,220,52,'難度：'+(this.difficulty==='normal'?'標準':'挑戰'),()=>{this.difficulty=this.difficulty==='normal'?'challenge':'normal';this.showTitle();});
  this.b(1087,521,220,52,this.reducedFX?'動態：柔和':'動態：標準',()=>{this.reducedFX=!this.reducedFX;this.showTitle();});
  this.text(972,574,'J 特殊　I 機體攻擊　K 大招　L 武器艙',16,'#d9d9ba');
  this.b(405,649,320,62,'← 遊戲列表',()=>this.leave());this.b(900,649,570,62,'確認裝備・前往彈射甲板',()=>this.start(),0xa87535);
 }

 start(checkpoint=null){if(this.portrait()){this.showMessage('請把手機橫放','左手移動；右手操作特殊武器、機體攻擊、大招與武器艙。',()=>{this.overlay?.destroy();this.overlay=null;},'知道了');return;}
  this.flightLook=this.readFlightLook();this.session=new StarflightSession({difficulty:this.difficulty,seed:checkpoint?.seed??((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0),checkpoint,guardianEnabled:this.flightLook.guardian});
  if(!checkpoint)this.session.specialWeapon=this.selectedSpecial;this.session.checkpoint=this.session.snapshot();
  this.renderGame();this.sound.context?.resume?.()?.catch?.(()=>{});this.showLaunchSequence(!!checkpoint);
 }
 renderGame(){this.clear();this.mode='playing';this.session.setPaused(false);this.soundCD=0;this.add.rectangle(640,360,1280,720,0x153d49);
  this.world=this.add.container(0,TOP).setScale(1,SCALE);
  this.maskShape=this.add.graphics().fillStyle(0xffffff).fillRect(0,TOP,1280,H*SCALE).setVisible(false);this.fieldMask=this.maskShape.createGeometryMask();this.world.setMask(this.fieldMask);
  this.background=[];this.themeWeights={};this.lastTheme=this.session.currentMap?.theme||'harbor';
  for(const [theme,texture]of Object.entries(SKY)){this.themeWeights[theme]=theme===this.lastTheme?1:0;for(let i=0;i<2;i++){const im=this.add.image(i*1280,-165,texture).setOrigin(0).setDisplaySize(1280,854);this.world.add(im);this.background.push({im,theme,index:i});}}
  this.scenery=this.add.graphics();this.world.add(this.scenery);this.entities=this.add.container(0,0);this.world.add(this.entities);
  this.magicLayer=this.add.container(0,0);this.world.add(this.magicLayer);this.magicPool=[];this.magicIndex=0;
  this.fx=this.add.graphics();this.world.add(this.fx);
  this.add.rectangle(640,31,1280,62,0x173e48,.85);this.hp=this.text(24,17,'',23,'#ffe1c3',0);this.meta=this.text(245,17,'',23,'#bcf4d1',0);
  this.scoreLabel=this.text(640,17,'',22,'#ffdf92',0);this.stageLabel=this.text(20,690,'',17,'#cce8e1',0);
  this.gmButton=this.b(1008,31,120,47,'GM 調校',()=>this.openGMPanel(),0x6b567c);this.gmButton.label.setFontSize(19);this.b(1175,31,190,47,'暫停 P',()=>this.pauseGame());this.noticeText=this.text(640,100,'',24,'#fff1b1').setStroke('#254a56',5);
  this.bossText=this.text(640,135,'',22,'#ffdaae').setStroke('#254a56',4);
  this.control=this.add.graphics();this.fireLabel=this.text(STAR_CONTROLS.special.x,STAR_CONTROLS.special.y,'',19);
  this.dashLabel=this.text(STAR_CONTROLS.bay.x,STAR_CONTROLS.bay.y,'武器艙',21);this.bombLabel=this.text(STAR_CONTROLS.bomb.x,STAR_CONTROLS.bomb.y,'',24);
  this.traitLabel=this.text(STAR_CONTROLS.trait.x,STAR_CONTROLS.trait.y,'',21);
  this.branchHint=this.text(830,118,'',20,'#fff1b1').setStroke('#254a56',5).setVisible(false);this.branchTop=this.text(850,184,'',21,'#e5fff2').setStroke('#254a56',5).setVisible(false);this.branchBottom=this.text(850,536,'',21,'#e5fff2').setStroke('#254a56',5).setVisible(false);
  this.drawState(0);
 }
 showLaunchSequence(fromCheckpoint=false){this.mode='launching';this.session.setPaused(true);this.launchTime=0;this.launchCue=-1;const o=this.add.container(0,0).setDepth(120);this.launchOverlay=o;
  o.add(this.add.rectangle(640,360,1280,720,0x071e27,.94).setInteractive());
  const cabin=this.add.graphics();cabin.fillStyle(0x233f37).fillRoundedRect(0,0,1280,720,22);cabin.fillStyle(0x8ebd83,.25).fillTriangle(0,0,510,0,0,720).fillTriangle(1280,0,770,0,1280,720);
  cabin.lineStyle(12,0x6b8d5f,.85).lineBetween(95,555,1160,555).lineBetween(105,590,1170,590);cabin.lineStyle(3,0xc5f1b5,.3).lineBetween(105,548,1160,548);o.add(cabin);
  this.launchGateL=this.add.rectangle(300,325,390,560,0x41674f,.96).setStrokeStyle(8,0xa8cb8d);this.launchGateR=this.add.rectangle(980,325,390,560,0x41674f,.96).setStrokeStyle(8,0xa8cb8d);o.add([this.launchGateL,this.launchGateR]);
  this.launchDoll=this.doll(o,226,353,240,400,.98);this.launchCraft=this.art(430,525,'hero',235,o);this.launchLines=this.add.graphics();o.add(this.launchLines);
  this.launchTitle=this.text(780,210,fromCheckpoint?'安全航點重新出擊':'森林芽翼 01・出擊準備',40,'#fff0b8');this.launchStatus=this.text(780,275,'飛行員與裝備確認中',25,'#d5f3de');this.launchCount=this.text(780,360,'3',78,'#ffe099');
  o.add([this.launchTitle,this.launchStatus,this.launchCount]);this.stepLaunch(0);
 }
 stepLaunch(dt){this.launchTime=Math.min(STAR_PHASE1.launchSeconds,this.launchTime+dt);const t=this.launchTime,p=t/STAR_PHASE1.launchSeconds,phase=t<.7?0:t<1.5?1:t<2.3?2:3;
  if(phase!==this.launchCue){this.launchCue=phase;this.tone(phase===3?'finish':phase===2?'correct':'send');}
  const gateOpen=Math.max(0,Math.min(1,(t-.55)/.9));this.launchGateL?.setX(300-gateOpen*330);this.launchGateR?.setX(980+gateOpen*330);
  const launch=Math.max(0,Math.min(1,(t-2.3)/.7));this.launchCraft?.setPosition(430+launch*970,525-launch*110).setScale((235/Math.max(this.launchCraft.width,this.launchCraft.height))*(1+launch*.25)).setAlpha(1-launch*.65);
  this.launchDoll?.setAlpha(Math.max(0,1-Math.max(0,(t-1.55)/.65)));this.launchLines?.clear();
  if(t>.7){const glow=.35+.3*Math.sin(t*12);this.launchLines.lineStyle(6,0xaaf6c1,glow).lineBetween(110,548,1170,548).lineBetween(110,590,1170,590);}
  if(t>2.3)for(let i=0;i<8;i++){const y=150+i*62,x=1280-((launch*1400+i*137)%1450);this.launchLines.lineStyle(4,0xe8fff2,.5).lineBetween(x,y,x-150-launch*220,y);}
  this.launchStatus?.setText(phase===0?'飛行員與裝備確認中':phase===1?'螢光藤蔓導軌充能':phase===2?'阿晨晨，準備出發！':'樹冠閘門開啟・彈射！');this.launchCount?.setText(phase<3?String(3-phase):'GO!').setAlpha(.78+.2*Math.sin(t*8));
  if(p>=1)this.finishLaunch();
 }
 finishLaunch(){this.launchOverlay?.destroy();this.launchOverlay=null;this.clearInput();this.session.setPaused(false);this.mode='playing';this.session.message('出擊！普攻每 0.5 秒一發');}
 controlState(){const t=this.touch.read(),k=this.held;return {...t,x:t.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),y:t.y+Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp')),special:t.special||this.requests.special,trait:t.trait||this.requests.trait,bay:t.bay||this.requests.bay,bomb:t.bomb||this.requests.bomb,slow:k.has('ShiftLeft')||k.has('ShiftRight')};}
 chooseBranchAt(x,y){if(!this.session?.branchOffer||this.session.branchOffer.selected||x<720||x>990||y<105||y>615)return false;const worldY=(y-TOP)/SCALE;return this.session.chooseBranch(worldY<240?'top':'bottom','tap');}
 update(t,delta){if(this.mode==='launching'){if(!this.portrait()&&!document.hidden)this.stepLaunch(Math.min(.1,delta/1000));return;}if(this.mode==='returning'){if(this.portrait()||document.hidden)return;this.resumeTime-=Math.min(.1,delta/1000);this.resumeLabel?.setText(this.resumeTime>.35?'準備好了嗎？':'出發！');if(this.resumeTime<=0){this.overlay?.destroy();this.overlay=null;this.clearInput();this.session.closeBay();this.session.setPaused(false);this.mode='playing';}return;}
  if(this.mode!=='playing'||!this.session)return;const dt=Math.min(.1,delta/1000),input=this.controlState();
  if(input.bay&&this.openWeaponBay())return;
  if(this.session.advance(dt,input)){this.requests={};this.touch.consume();}
  this.soundOn=preferences.value.sfx;this.soundCD-=dt;
  for(const e of this.session.events.splice(0)){if(!['shot','stage','ultimateStart','charge'].includes(e.type))this.effects.push({...e,age:0});
   if(['charge','laserFire','explosiveFire','shotgunFire','traitFire'].includes(e.type))this.weaponTone(e.type);
   else if(e.type==='guardianStart'||e.type==='guardianRevive'){this.tone(e.type==='guardianStart'?'finish':'correct');this.soundCD=.3;}
   else if(this.soundCD<=0&&e.type!=='stage'){this.tone(e.type==='shot'?'send':e.type==='hurt'?'hint':['end','boss','warning','ultimateStart'].includes(e.type)?'finish':'correct');this.soundCD=e.type==='shot'?.25:.13;}
   if(!this.reducedFX&&['bomb','hurt','elite','laserFire','guardianRevive'].includes(e.type))this.cameras.main.shake(e.type==='bomb'?180:90,e.type==='bomb'?.003:.0014);
  }
  if(this.session.phase==='combat')this.effects=this.effects.map(e=>({...e,age:e.age+dt})).filter(e=>e.age<.7).slice(-65);
  this.drawState(this.session.phase==='combat'?dt:0);this.drawUltimate();this.drawGuardian();if(this.session.status!=='playing')this.finish();
 }
 weaponTone(type){if(!this.soundOn)return;const ctx=this.sound.context;if(!ctx)return;
  try{const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime,d=type==='charge'?.5:.22;
   o.type=type==='explosiveFire'?'triangle':'sine';o.frequency.setValueAtTime(type==='charge'?260:type==='laserFire'?1000:480,now);o.frequency.exponentialRampToValueAtTime(type==='charge'?1050:150,now+d);
   g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+d);o.connect(g);g.connect(ctx.destination);this.audioNodes.add(o);o.onended=()=>{this.audioNodes.delete(o);o.disconnect();g.disconnect();};o.start(now);o.stop(now+d);
  }catch{}}
 drawUltimate(){const s=this.session;
  if(s.phase!=='ultimate'){this.ultimateOverlay?.destroy();this.ultimateOverlay=null;return;}
  if(!this.ultimateOverlay){const o=this.add.container(0,0).setDepth(80);this.ultimateOverlay=o;
   o.add(this.add.rectangle(640,360,1280,720,0x162742,.9));this.ultimatePortrait=this.doll(o,350,390,350,540,.98);this.ultimateFairy=this.art(570,315,'fairy',190,o);
   o.add(this.text(865,260,'妍妍的星光祝福',43,'#ffe8ab'));o.add(this.text(865,348,'讓大家恢復好心情！',28,'#d9f7ed'));this.ultimateBar=this.add.graphics();o.add(this.ultimateBar);}
  const t=s.phaseTime;this.ultimateOverlay.setVisible(true);this.ultimatePortrait.setPosition(325+Math.min(1,t/.5)*25,390+Math.sin(t*3)*7).setAlpha(Math.min(1,t*3));this.ultimateFairy.setPosition(560+Math.sin(t*4)*12,310+Math.cos(t*3)*8).setAlpha(Math.min(1,t*4));
  this.ultimateBar.clear().fillStyle(0xffe6a5).fillRoundedRect(665,440,400*Math.min(1,t/3),8,4);
 }
 drawGuardian(){const s=this.session;if(s.phase!=='guardian'){this.guardianOverlay?.destroy();this.guardianOverlay=null;return;}
  if(!this.guardianOverlay){const o=this.add.container(0,0).setDepth(90);this.guardianOverlay=o;o.add(this.add.rectangle(640,360,1280,720,0x392b48,.9));
   const rings=this.add.graphics();rings.lineStyle(7,0xffefb5,.6).strokeCircle(325,360,225).lineStyle(3,0xffffff,.8).strokeCircle(325,360,185);o.add(rings);
   const def=DOLL_BODIES[MOTHER_GUARD],im=this.add.image(325,370,def[0]),scale=Math.min(360/im.width,560/im.height);im.setScale(scale);im.setData('baseScale',scale);o.add(im);this.guardianPortrait=im;
   o.add(this.text(855,250,'母上的守護',48,'#ffe5a5'));o.add(this.text(855,342,'別怕，媽媽在這裡。',29,'#fff5dc'));o.add(this.text(855,394,'回復 1 點生命・短暫無敵',22,'#d9f7ed'));this.guardianBar=this.add.graphics();o.add(this.guardianBar);}
  const t=s.phaseTime,q=Math.min(1,t/STAR_PHASE1.guardianSeconds),scale=this.guardianPortrait.getData('baseScale');this.guardianPortrait.setAlpha(Math.min(1,t*3)).setScale(scale*(1+.018*Math.sin(t*5)));this.guardianBar.clear().fillStyle(0xffe6a5).fillRoundedRect(655,466,410*q,10,5);
 }
 openWeaponBay(){if(this.mode!=='playing'||!this.session.openBay())return false;this.mode='bay';this.clearInput();this.stopTones();this.renderWeaponBay();return true;}
 renderWeaponBay(){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;const s=this.session;
  o.add([this.add.rectangle(640,360,1280,720,0x102e3b,.80).setInteractive(),this.panel(640,348,1120,590,0x193f4c,0xc8bc8d,28),this.text(640,113,'武器艙',40),this.text(640,166,'航程暫停中 · 換裝保留各武器的冷卻時間',23,'#c6eadd')]);
  STAR_SPECIALS.forEach((w,i)=>{const x=280+i*360,selected=w.id===s.specialWeapon,cd=s.specialCooldowns[w.id];
   o.add(this.panel(x,330,330,230,selected?0x3b6760:0x244854,selected?0xffd98e:0x648788,20));
   o.add(this.text(x,248,w.name,28,selected?'#ffe0a4':'#e3f6ed'));o.add(this.text(x,300,w.id==='chargeLaser'?'2 秒自動集氣 · 貫穿':w.id==='explosive'?'命中爆開 · 範圍安撫':'七向扇形 · 近距離火力',20));
   o.add(this.text(x,342,'CD '+w.cd+' 秒'+(cd>0?' · 剩餘 '+cd.toFixed(1)+' 秒':''),20,'#c9e2dc'));
   const b=this.b(x,398,276,54,selected?'✓ 裝備中':'裝備',()=>{if(s.equipSpecial(w.id)){this.tone('correct');this.renderWeaponBay();}},selected?0x86723f:0x387984);o.add(b);
  });
  o.add(this.text(640,493,s.charging?'雷射集氣已暫停；換另一把武器會取消這次集氣。':'點一下特殊攻擊即可使用 · 集氣與 CD 都在戰鬥時推進',21,'#d9e7d7'));
  o.add(this.b(640,575,380,68,'返回飛行',()=>this.closeWeaponBay(),0xa87535));
 }
 closeWeaponBay(){if(this.mode!=='bay'||this.portrait())return;this.overlay?.destroy();this.clearInput();this.mode='returning';this.resumeTime=.8;const o=this.add.container(0,0).setDepth(100);this.overlay=o;
  o.add(this.add.rectangle(640,360,1280,720,0x102e3b,.18).setInteractive());this.resumeLabel=this.text(640,270,'準備好了嗎？',38).setStroke('#193f4c',6);o.add(this.resumeLabel);
 }

 openGMPanel(){if(this.mode!=='playing'||!this.session||this.session.phase!=='combat')return false;this.mode='gm';this.session.setPaused(true);this.clearInput();this.stopTones();this.renderGMPanel();return true;}
 renderGMPanel(){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(120),s=this.session;this.overlay=o;
  o.add([this.add.rectangle(640,360,1280,720,0x071c28,.88).setInteractive(),this.panel(640,360,1190,655,0x193f4c,0xc8bc8d,28),this.text(640,66,'GM 調校模式',38),this.text(640,103,'僅影響本次測試與安全航點，不寫入正式衣櫃／遊戲進度',18,'#c6eadd')]);
  const maps=[['sky','天空'],['lake','月湖'],['cave','洞穴'],['ice','冰原'],['wetland','濕地'],['magma','岩漿'],['forest','樹海']];
  maps.forEach(([type,name],i)=>{const selected=s.currentMap?.type===type,b=this.b(145+i*165,151,142,46,(selected?'✓ ':'')+name,()=>{if(s.forceRegion(type)){this.tone('correct');this.renderGMPanel();}},selected?0x8b733a:0x315f68);b.label.setFontSize(17);o.add(b);});
  o.add(this.text(92,191,'可調參數',18,'#ffe0a4',0));
  STAR_TUNING.forEach((item,i)=>{const y=226+i*51,value=s.tuning[item.id];o.add(this.text(190,y,item.name,20,'#e4f5ec',0));
   const minus=this.b(590,y,56,38,'−',()=>{if(s.setTuning(item.id,value-item.step))this.tone('send');this.renderGMPanel();},0x315f68),plus=this.b(865,y,56,38,'＋',()=>{if(s.setTuning(item.id,value+item.step))this.tone('send');this.renderGMPanel();},0x315f68);minus.label.setFontSize(24);plus.label.setFontSize(22);o.add([minus,plus]);
   o.add(this.panel(728,y,190,38,0x102e3b,0x668b89,10));o.add(this.text(728,y,value.toFixed(item.digits)+item.unit,20,'#ffe3a1'));o.add(this.text(930,y,'範圍 '+item.min+'～'+item.max,15,'#a9c7c2',0));
  });
  o.add(this.text(640,585,'改變子彈速度會同步調整畫面上現存子彈；敵人生命倍率也會保留目前血量比例。',16,'#bcd5d0'));
  o.add(this.b(335,635,310,54,'恢復正式預設值',()=>{s.resetTuning();this.tone('correct');this.renderGMPanel();},0x6d5c45));o.add(this.b(850,635,360,54,'套用並返回飛行',()=>this.closeGMPanel(),0xa87535));
 }
 closeGMPanel(){if(this.mode!=='gm'||this.portrait())return false;this.overlay?.destroy();this.overlay=null;this.clearInput();this.session.setPaused(false);this.mode='playing';this.session.message(this.session.gmUsed?'GM 測試參數已套用 · 本局不寫入正式存檔':'已使用正式預設值繼續飛行');return true;}

 entity(id,x,y,frame,size){let v=this.views.get(id);if(!v){v=this.art(x,y,frame,size,this.entities);this.views.set(id,v);}v.setPosition(x,y);return v;}
 registerMagicFrames(){
  // Trim transparent padding at load time. Original PNG alpha is not changed.
  for(const name of MAGIC){const t=this.textures.get('stg04_'+name);if(t.has('trim'))continue;
   const image=t.getSourceImage(),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let x0=canvas.width,y0=canvas.height,x1=0,y1=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>18){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   if(x1>=x0&&y1>=y0)t.add('trim',0,x0,y0,x1-x0+1,y1-y0+1);
  }
 }
 magic(name,x,y,width,height=null,rotation=0,alpha=1,tint=0xffffff,anchor=.5){
  let v=this.magicPool[this.magicIndex];if(!v){v=this.add.image(0,0,'stg04_'+name,'trim');this.magicLayer.add(v);this.magicPool.push(v);}this.magicIndex++;
  v.setTexture('stg04_'+name,'trim').setOrigin(anchor,.5).setPosition(x,y).setRotation(rotation).setAlpha(alpha).setTint(tint).setVisible(true);
  v.setDisplaySize(width,height??width*v.frame.height/v.frame.width);return v;
 }
 star(g,x,y,r,color,alpha=1){g.fillStyle(color,alpha);const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});}g.fillPoints(pts,true);}
 enemy(g,e){
  const sx=e.x,sy=e.y;g.save().translateCanvas(sx,sy).scaleCanvas(1.5,1.5);
  const x=0,y=0,white=e.flash>0,c=(color)=>white?0xffffff:color;
  g.lineStyle(2,c(0x51415d),1);
  if(e.kind===0||e.kind===4){
   const color=c(e.kind===4?0xed8497:0x8996b7);g.fillStyle(color).fillEllipse(x,y+3,52,30).fillCircle(x-15,y-6,14).fillCircle(x+4,y-12,17).fillCircle(x+20,y-4,12);
   if(e.kind===4){g.fillStyle(c(0xae3656)).fillTriangle(x-19,y-19,x+20,y-19,x+7,y-41);this.star(g,x+8,y-31,6,0xffeac1);}
  }
  if(e.kind===1){g.fillStyle(c(0xd578ad)).fillEllipse(x,y-21,90,89);g.fillStyle(c(0xf4b2c5)).fillEllipse(x,y-16,65,76);g.fillStyle(c(0xf8c5ba)).fillCircle(x,y+15,34);
   g.fillTriangle(x-28,y-6,x-35,y-30,x-6,y-14).fillTriangle(x+28,y-6,x+35,y-30,x+6,y-14);
   g.fillStyle(c(0xea93a7)).fillEllipse(x,y+22,27,17);g.fillStyle(c(0x87475f)).fillCircle(x-6,y+22,3).fillCircle(x+6,y+22,3);
   g.lineStyle(3,c(0x98643f)).lineBetween(x-28,y+37,x-23,y+57).lineBetween(x+28,y+37,x+23,y+57);g.fillStyle(c(0xdab071)).fillRoundedRect(x-28,y+52,56,18,5);
  }
  if(e.kind===2){g.fillStyle(c(0x72b994)).fillCircle(x,y,25);g.fillStyle(c(0xf5a3ad)).fillEllipse(x-5,y+3,31,35);g.fillStyle(c(0xffd67e)).fillTriangle(x-18,y-1,x-43,y+5,x-18,y+12);
   g.fillStyle(c(0x39765d)).fillTriangle(x+9,y-15,x+39,y-8,x+18,y+7);g.fillStyle(0x57464d).fillEllipse(x-6,y+10,3,6);}
  if(e.kind===3){g.fillStyle(c(0xffefcf)).fillTriangle(x-44,y+16,x+39,y-9,x+20,y+26);g.fillStyle(c(0xc39576)).fillCircle(x+2,y-4,21).fillCircle(x-15,y-22,10).fillCircle(x+17,y-22,10);
   g.fillStyle(c(0xf2d5b5)).fillEllipse(x,y+3,27,23);
   if(e.state==='aim'){const ty=(e.targetY-sy)/1.5;g.lineStyle(2,0xffb589,.85).lineBetween(-sx/1.5,ty,-35,ty);g.lineStyle(3,0xffe7b0).strokeCircle(0,0,37);}
  }
  if(e.kind===5){g.fillStyle(c(0xd5f6ff),.7).fillEllipse(x-8,y-19,18,29).fillEllipse(x+12,y-18,20,30);
   g.fillStyle(c(0xffd06d)).fillEllipse(x,y,48,31);g.fillStyle(c(0x805951)).fillRect(x-3,y-14,7,28).fillRect(x+13,y-10,6,20);
   g.lineStyle(2,c(0x805951)).lineBetween(x-15,y-10,x-24,y-25);}
  if(e.kind===6){if(e.state==='enter'){g.lineStyle(3,0x9eeeff,.8).strokeEllipse(x,y+8,58,13);for(let i=0;i<4;i++)g.fillStyle(0xd8fbff,.55).fillCircle(x-24+i*16,y-4-(i%2)*8,4+i%2*2);}
   else{g.fillStyle(c(0x9d775d)).fillEllipse(x,y,61,39).fillCircle(x+22,y-8,18);g.fillStyle(c(0xe9a34c)).fillCircle(x+11,y-28,10);g.fillStyle(c(0x60485a)).fillEllipse(x-12,y+14,12,7);}}
  if(e.kind===7){g.fillStyle(c(0x75619a)).fillEllipse(x,y,37,28).fillTriangle(x-12,y-5,x-39,y-25,x-31,y+9).fillTriangle(x+12,y-5,x+39,y-25,x+31,y+9);g.fillStyle(c(0xb9a7e5)).fillTriangle(x-3,y+11,x+3,y+11,x,y+24);}
  if(e.kind===8){g.fillStyle(c(0xd9f5ff)).fillEllipse(x,y,44,36).fillCircle(x,y-12,22);g.fillStyle(c(0x9ed9ef)).fillTriangle(x-15,y-2,x-38,y+13,x-13,y+16).fillTriangle(x+15,y-2,x+38,y+13,x+13,y+16);g.fillStyle(c(0x8ac5de)).fillTriangle(x,y+11,x-8,y+30,x+8,y+30);}
  if(e.kind===9){g.fillStyle(c(0x79b77c)).fillEllipse(x,y+3,48,31).fillCircle(x+12,y-11,19);g.fillStyle(c(0xa5d99c)).fillCircle(x+4,y-18,8).fillCircle(x+20,y-18,8);g.fillStyle(c(0x6a8d66)).fillEllipse(x-18,y+16,18,8).fillEllipse(x+16,y+18,20,8);}
  if(e.kind===10){g.fillStyle(c(0xe97452)).fillEllipse(x,y,53,25).fillCircle(x+24,y-5,14);g.fillStyle(c(0xffc05f)).fillTriangle(x-20,y-5,x-39,y-20,x-31,y+4).fillCircle(x+26,y-8,5);g.lineStyle(4,c(0xffdb72)).lineBetween(x-25,y+5,x-43,y+18);}
  if(e.kind===11){g.fillStyle(c(0x9c6d48)).fillEllipse(x,y,42,27).fillCircle(x+17,y-8,15);g.fillStyle(c(0x5c8f5f)).fillTriangle(x-13,y-5,x-40,y-24,x-31,y+9).fillTriangle(x+3,y-3,x+25,y-28,x+21,y+7);g.fillStyle(c(0xd8a55a)).fillCircle(x-13,y+4,7);}
  g.fillStyle(c(0x3c3546)).fillCircle(x-10,y-3,3).fillCircle(x+6,y-3,3);
  if(e.kind!==1)g.lineStyle(2,c(0x6a4b59)).lineBetween(x-5,y+9,x+2,y+9);
  if(e.hp<e.maxHp&&e.maxHp>5){g.fillStyle(0x203746,.65).fillRect(x-26,y-57,52,4);g.fillStyle(0xffdfa1).fillRect(x-26,y-57,52*Math.max(0,e.hp/e.maxHp),4);}
  g.restore();
 }
 drawState(dt){
  const s=this.session,p=s.player,g=this.scenery,f=this.fx,theme=s.boss?'harbor':s.currentMap?.theme||'cloud';g.clear();f.clear();this.lastTheme=theme;this.magicIndex=0;
  // Shared world time: no reset, no stage flash, no pause at socket boundaries.
  const offset=s.time*18,cycle=Math.floor(offset/1280),scroll=offset%1280;
  for(const key of Object.keys(SKY))this.themeWeights[key]+=(Number(key===theme)-this.themeWeights[key])*Math.min(1,dt*.9);
  // Alpha-composite normalized weights so transitions do not dim the scene.
  let covered=0;
  for(const key of Object.keys(SKY)){const weight=this.themeWeights[key];covered+=weight;for(const bg of this.background.filter(b=>b.theme===key)){
   bg.im.setPosition(bg.index*1280-scroll,-165).setFlipX((cycle+bg.index)%2===1).setAlpha(covered?weight/covered:0).setVisible(weight>.0005);}}
  for(let i=0;i<18;i++){const x=((i*91-s.time*10)%1400+1400)%1400-60;this.star(g,x,30+(i*47)%380,2,0xffffff,.45);}
  for(let i=0;i<9;i++){const x=((i*190-s.time*48)%1710+1710)%1710-180,y=410+(i%3)*25;
   g.fillStyle(0xfff4df,.5).fillEllipse(x,y,230,65).fillEllipse(x+60,y+16,210,66);}
  for(let i=0;i<7;i++){const x=((i*245-s.time*95)%1715+1715)%1715-160,y=i%2?472:4;
   g.fillStyle(0x597b81,.35).fillTriangle(x-70,y,x+90,y,x+10,y+(i%2?70:-70));g.fillStyle(0xb7d9c0,.4).fillEllipse(x+10,y,160,22);}
  const regionType=s.currentMap?.type;
  if(regionType==='lake')g.fillStyle(0x162968,.16).fillRect(0,0,1280,H);if(regionType==='cave')g.fillStyle(0x11162d,.28).fillRect(0,0,1280,H);
  if(regionType==='ice'){g.fillStyle(0xbdeaff,.22).fillRect(0,0,1280,H);for(let i=0;i<9;i++){const x=((i*175-s.time*70)%1500+1500)%1500-100,h=38+(i%3)*18;g.fillStyle(0xbff3ff,.55).fillTriangle(x,480,x+24,480-h,x+48,480).fillStyle(0xe9fcff,.38).fillTriangle(x+13,480,x+25,480-h+9,x+34,480);}}
  if(regionType==='wetland'){g.fillStyle(0x315d51,.25).fillRect(0,0,1280,H);g.fillStyle(0x6ca58b,.38).fillRect(0,424,1280,56);for(let i=0;i<11;i++){const x=((i*137-s.time*34)%1450+1450)%1450-80,y=430-(i%3)*13;g.lineStyle(3,0x8fd5a0,.7).lineBetween(x,480,x+5,y);g.fillStyle(0x9ad26f,.6).fillEllipse(x+5,y,25,9);}}
  if(regionType==='magma'){g.fillStyle(0x6e251f,.28).fillRect(0,0,1280,H);g.fillStyle(0xe05b2f,.58).fillRect(0,433,1280,47);for(let i=0;i<14;i++){const x=((i*103-s.time*60)%1430+1430)%1430-70,y=443+Math.sin(s.time*2+i)*8;g.fillStyle(i%2?0xffb247:0xff7135,.75).fillEllipse(x,y,70,18);}}
  if(regionType==='forest'){g.fillStyle(0x153f32,.23).fillRect(0,0,1280,H);for(let i=0;i<8;i++){const x=((i*225-s.time*82)%1730+1730)%1730-160,y=i%2?450:30;g.lineStyle(18,0x41623f,.5).lineBetween(x,y,x+150,y+(i%2?-95:95));g.fillStyle(0x6fa35e,.35).fillCircle(x+145,y+(i%2?-95:95),58);}}
  for(const h of s.hazards){if(h.kind==='mist'){g.fillStyle(0xbcecff,.16).fillEllipse(h.x,h.y,h.r*2.2,h.r*1.35).fillEllipse(h.x-55,h.y+18,h.r*1.5,h.r*.9);g.lineStyle(2,0xd9f7ff,.28).strokeEllipse(h.x,h.y,h.r*2.2,h.r*1.35);}
   if(h.kind==='marsh'){g.fillStyle(0xa8e2b0,.15).fillEllipse(h.x,h.y,h.r*2.1,h.r*1.25).fillCircle(h.x-45,h.y-12,38);g.lineStyle(2,0xc9f2ba,.3).strokeEllipse(h.x,h.y,h.r*2.1,h.r*1.25);for(let i=0;i<5;i++)g.fillStyle(0xc6f4cf,.35).fillCircle(h.x-70+i*34,h.y-24-(i%2)*19,5+i%3);}
   if(h.kind==='rock'||h.kind==='icicle'){if(h.age<h.warn){const q=h.age/h.warn,color=h.kind==='icicle'?0xa9efff:0xffd994;g.lineStyle(3,color,.35+q*.55).lineBetween(h.x,5,h.x,455);g.fillStyle(color,.2+q*.3).fillCircle(h.x,28,15+q*7);}else if(h.kind==='icicle'){g.fillStyle(0xc7f5ff,.85).fillTriangle(h.x-h.r,h.y-h.r,h.x+h.r,h.y-h.r,h.x,h.y+h.r*1.8);g.lineStyle(2,0xffffff,.8).lineBetween(h.x-5,h.y-h.r+4,h.x,h.y+h.r);}else{g.fillStyle(0x756680).fillCircle(h.x,h.y,h.r).fillStyle(0xc0acd0,.65).fillTriangle(h.x-12,h.y-5,h.x+5,h.y-15,h.x+15,h.y+8);}}
   if(h.kind==='ember'){if(h.age<h.warn){const q=h.age/h.warn;g.lineStyle(4,0xff6c3d,.4+q*.5).strokeCircle(h.x,440,22+q*11);g.fillStyle(0xffbb58,.2+q*.3).fillCircle(h.x,440,12+q*7);}else{g.fillStyle(0xffc052,.9).fillCircle(h.x,h.y,h.r).fillStyle(0xff6136,.8).fillCircle(h.x+5,h.y+4,h.r*.65);g.lineStyle(6,0xff9b45,.45).lineBetween(h.x-h.vx*.12,h.y-h.vy*.12,h.x,h.y);}}
  }
  const offer=s.branchOffer;if(offer){const chosen=offer.selected;g.fillStyle(0x142e3a,.72).fillRoundedRect(735,28,270,145,18).fillRoundedRect(735,307,270,145,18);g.lineStyle(4,chosen==='top'?0xffde83:0xbfead8,.9).strokeRoundedRect(735,28,270,145,18);g.lineStyle(4,chosen==='bottom'?0xffde83:0xbfead8,.9).strokeRoundedRect(735,307,270,145,18);g.fillStyle(0x597b65,.82).fillRoundedRect(710,215,330,48,18);}
  for(const gate of s.gates){const top=gate.gapY-gate.gap/2,bottom=gate.gapY+gate.gap/2,x=gate.x-gate.w/2;
   g.fillStyle(0x384b62,.4).fillRect(x+8,0,gate.w,top+7).fillRect(x+8,bottom+7,gate.w,H-bottom);
   g.fillStyle(0x916f78).fillRoundedRect(x,-20,gate.w,top+20,14).fillRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.lineStyle(3,0xffe4ae).strokeRoundedRect(x,-20,gate.w,top+20,14).strokeRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.fillStyle(0x8dc5a0).fillRoundedRect(x-4,top-15,gate.w+8,16,7).fillRoundedRect(x-4,bottom,gate.w+8,16,7);
   for(let j=0;j<4;j++){this.star(g,x+12+j*24,top-9,4,0xffe6ad);this.star(g,x+12+j*24,bottom+8,4,0xffe6ad);}
  }
  for(const e of s.enemies)this.enemy(g,e);
  const live=new Set(),hero=this.entity('hero',p.x,p.y,'hero',150);live.add('hero');
  const moving=this.controlState();hero.setRotation(s.phase==='falling'?s.phaseTime*2.4:moving.y*.06-moving.x*.07).setPosition(p.x,p.y+(s.phase==='falling'?s.phaseTime*130:Math.sin(s.time*3)*2)).setAlpha(s.phase==='falling'?1-s.phaseTime*.6:p.invuln>0?.58+Math.sin(s.time*24)*.2:1);
  const close=this.controlState().slow||s.bullets.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<75);
  f.fillStyle(0xffffff,close?1:.5).fillCircle(p.x,p.y,STAR_FIELD.hitRadius);f.lineStyle(1,0x25685e,close?1:.5).strokeCircle(p.x,p.y,6);
  if(p.dashing>0)f.lineStyle(10,0xffffff,.35).lineBetween(p.x-70,p.y,p.x-15,p.y);
  s.optionPositions.forEach((o,i)=>{this.magic('option',o.x,o.y+Math.sin(s.time*5+i)*2,36,null,Math.sin(s.time*3+i)*.07,.88);});
  for(const item of s.pickups){
   if(item.kind==='weapon'){this.magic('bubble',item.x,item.y,60,60,0,.9);this.star(f,item.x,item.y,17,0xffdf8f);
   }else if(item.kind==='option'){this.magic('option',item.x,item.y,49);f.lineStyle(2,0xffe9a4,.65).strokeCircle(item.x,item.y,30);}
   else if(item.kind==='heart'){f.fillStyle(0xffb7c5).fillCircle(item.x-5,item.y-3,7).fillCircle(item.x+5,item.y-3,7).fillTriangle(item.x-11,item.y,item.x+11,item.y,item.x,item.y+13);}
   else{this.star(f,item.x,item.y,10,0xffdc7b);f.fillStyle(0xffffff,.8).fillCircle(item.x-2,item.y-3,2);}
  }
  if(s.boss){const b=s.boss;const v=this.entity('boss',b.x,b.y,'boss',405);v.setTint(b.flash>0?0xffffff:0xfff0db);live.add('boss');
   g.fillStyle(0x233f50,.7).fillRoundedRect(415,28,450,9,4);g.fillStyle(0xf5b7d1).fillRoundedRect(415,28,450*Math.max(0,b.hp/b.maxHp),9,4);
   this.bossText.setText('熊船長 · '+b.phase+' 階段');
   if(b.beam>0){f.fillStyle(b.beam>.6?0xf094b9:0xfff1ce,b.beam>.6?.2:.85).fillRect(0,b.beamY-26,b.x,52);f.lineStyle(2,0xffc6e0).lineBetween(0,b.beamY-26,b.x,b.beamY-26).lineBetween(0,b.beamY+26,b.x,b.beamY+26);}
  }else this.bossText.setText('');
  for(const [id,v]of this.views)if(!live.has(id)){v.destroy();this.views.delete(id);}
  for(const a of s.shots){const alpha=a.option?.38:.87;
   if(a.kind==='explosive'){this.magic('clover',a.x,a.y,38,null,a.x*.03,alpha);f.lineStyle(2,0xffd78a,.9).strokeCircle(a.x,a.y,17);}
   else if(a.kind==='traitLeaf'){this.magic('clover',a.x,a.y,58,null,a.x*.045,alpha);f.lineStyle(3,0xc9ffd5,.7).strokeCircle(a.x,a.y,24);}
   else if(a.kind==='laser')this.magic('beam',a.x,a.y,85+a.rank*12,a.r*2-2,0,alpha,0xffffff,1);
   else if(a.kind==='homing'){const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xffedb0,alpha*.38).lineBetween(a.x-a.vx*.05,a.y-a.vy*.05,a.x,a.y);this.magic('dandelion',a.x,a.y,29,null,angle,alpha,0xffffff,.78);}
   else{const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xb7ffd2,alpha*.25).lineBetween(a.x-15*Math.cos(angle),a.y-15*Math.sin(angle),a.x,a.y);this.magic('clover',a.x,a.y,23+a.rank*2,null,angle,alpha,0xffffff,.78);}
  }
  if(s.charging){const q=Math.min(1,s.charging.elapsed/2);f.lineStyle(4,0xb2f6ff,.85).strokeCircle(p.x+38,p.y,34-q*18);f.lineStyle(2,0xffefad,.65).strokeCircle(p.x+38,p.y,15+q*20);f.fillStyle(0xffffff,.4+q*.4).fillCircle(p.x+38,p.y,5+q*10);}
  if(s.laserVisual){const l=s.laserVisual;this.magic('beam',l.x,l.y,Math.max(1,l.end-l.x),31,0,Math.min(1,l.life*7),0xffffff,0);}
  for(let i=this.magicIndex;i<this.magicPool.length;i++)this.magicPool[i].setVisible(false);
  for(const a of s.bullets){const radius=a.visualRadius||8;f.fillStyle(0x48364e).fillCircle(a.x,a.y,radius+2);f.fillStyle(0xff86b0).fillCircle(a.x,a.y,radius);f.fillStyle(0xfffbec).fillCircle(a.x-2,a.y-2,2);}
  for(const e of this.effects){const alpha=1-e.age/.7;
   if(e.type==='bomb'){if(!this.reducedFX)f.fillStyle(0xfff8c9,alpha*.16).fillRect(0,0,1280,H);f.lineStyle(9,0xffefbd,alpha).strokeCircle(e.x,e.y,40+e.age*1600);}
   else if(e.type==='pop'||e.type==='elite'){f.fillStyle(0xffffff,alpha*.8).fillEllipse(e.x,e.y-e.age*35,24+e.age*80,17+e.age*35).fillCircle(e.x-14,e.y-9-e.age*35,10+e.age*12);}
   else if(e.type==='graze')f.lineStyle(2,0xa7fff0,alpha).strokeCircle(e.x,e.y,12+e.age*30);
   else if(e.type!=='warning'&&e.type!=='boss'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;this.star(f,e.x+Math.cos(a)*e.age*100,e.y+Math.sin(a)*e.age*80,Math.max(1,7-e.age*8),e.type==='hurt'?0xff9fb7:0xffebaf,alpha);}}
  }
  const weapon=STAR_WEAPONS.find(w=>w.id===s.weapon);this.hp.setText('生命 '+p.hp+'/'+p.maxHp);this.meta.setText('種子普攻 Lv.'+s.weaponRanks.clover);
  this.scoreLabel.setText('分數 '+s.score.toLocaleString()+'  擦彈 '+s.stats.graze);this.stageLabel.setText((s.boss?'月港 · 熊船長':s.currentMap?.name||'')+'　｜　J 特殊 · I 機體攻擊 · K 大招 · L 武器艙 · G 調校');this.gmButton?.label?.setText(s.gmUsed?'GM＊':'GM 調校');
  this.noticeText.setText(s.noticeLife>0?s.notice:'');this.branchHint.setVisible(!!offer).setText(offer?(offer.selected?'已選擇 · 區域交接中':'飛入通道或直接點路牌'):'');this.branchTop.setVisible(!!offer).setText(offer?'上　'+offer.top.name:'');this.branchBottom.setVisible(!!offer).setText(offer?'下　'+offer.bottom.name:'');this.drawControls();
 }
 drawControls(){const s=this.session,g=this.control;g.clear();const j=this.touch.owner===null?STAR_CONTROLS.joystick:this.touch.origin;
  g.fillStyle(0x1c4654,.28).fillCircle(j.x,j.y,57).lineStyle(2,0xd3f2df,.55).strokeCircle(j.x,j.y,57).fillStyle(0xd1eddd,.55).fillCircle(j.x+this.touch.axis.x*36,j.y+this.touch.axis.y*36,23);
  for(const key of ['special','bomb','bay','trait']){const c=STAR_CONTROLS[key];g.fillStyle(key==='bomb'?0x74536c:key==='trait'?0x315f51:0x244c5b,.75).fillCircle(c.x,c.y,c.r).lineStyle(2,key==='bomb'&&s.ultimateEnergy>=100?0xffe18b:0xcde9dd,.9).strokeCircle(c.x,c.y,c.r);}
  const c=STAR_CONTROLS.bomb;g.lineStyle(5,0xffd784,.9).beginPath().arc(c.x,c.y,c.r-5,-Math.PI/2,-Math.PI/2+Math.PI*2*s.ultimateEnergy/100,false).strokePath();
  const w=STAR_SPECIALS.find(w=>w.id===s.specialWeapon),cd=s.specialCooldowns[w.id];this.fireLabel.setText(s.charging?'集氣 '+Math.round(s.charging.elapsed/2*100)+'%':cd>0?w.short+'\n'+cd.toFixed(1)+'s':w.short+'\n點擊集氣');
  this.dashLabel.setText('武器艙');this.bombLabel.setText(s.ultimateEnergy>=100?'大招\n就緒':'大招\n'+Math.floor(s.ultimateEnergy)+'%');this.traitLabel.setText(s.player.traitCD>0?'迴旋葉刃\n'+s.player.traitCD.toFixed(1)+'s':'迴旋葉刃\n點擊發射');
 }

 showMessage(title,body,fn,label='繼續飛行'){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
  o.add([this.add.rectangle(640,360,1280,720,0x102e3b,.78).setInteractive(),this.panel(640,350,960,570,0x193f4c,0xc8bc8d,28),this.text(640,133,title,38),this.text(640,296,body,25)]);
  o.add(this.b(640,534,390,72,label,fn,0x9c743c));return o;}
 pauseGame(help=false){if(this.mode!=='playing')return;this.mode='paused';this.session.setPaused(true);this.clearInput();this.stopTones();this.ultimateOverlay?.setVisible(false);
  const o=this.showMessage(help?'飛行員小抄':'暫停飛行',help?'搖桿／WASD 移動 · 普攻每 0.5 秒一發\nJ／紅圈鍵：點一下，自動集氣 2 秒後發射貫穿雷射\nI／最右下：森林芽翼特色攻擊「迴旋葉刃」\nK／空白：能量滿時發動星光祝福\nL／武器艙：暫停換特殊武器\nG／右上 GM：暫停並調整本局測試參數\n兩次有效受傷就墜落，注意地形與敵彈':'航程與所有道具已停止，準備好再繼續。\n失敗可以從附近安全航點重新出發。',()=>this.resumeGame());
  o.add(this.b(640,619,390,52,'返回遊戲列表',()=>this.leave(),0x315c65));}
 resumeGame(){if(this.mode!=='paused'||this.portrait())return;this.clearInput();this.overlay?.destroy();this.overlay=null;this.session.setPaused(false);this.mode='playing';}
 finish(){this.mode='finished';this.clearInput();this.tone('finish');const s=this.session,won=s.status==='won';
  const o=this.showMessage(won?'星光航線挑戰成功！':'先回補給站休息一下','分數 '+s.score.toLocaleString()+' · 擦彈 '+s.stats.graze+' 次\n淨化 '+s.stats.cleared+' 位對手 · 普攻強化 '+s.stats.weaponChoices+' 次\n'+(won?'熊船長送來滿天星光！':'從附近安全航點重試，保留當時武器。'),()=>this.start(won?null:s.checkpoint),won?'再飛一次':'安全航點重試');
  o.add(this.b(640,620,390,52,'返回遊戲列表',()=>this.leave()));}
 leave(){this.stopTones();this.clearInput();if(this.scene.manager.keys[this.returnScene]||this.scene.manager.keys.MiniGameHub)this.scene.start(this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub');else this.showTitle();}
}

return {ForestStarflightGame};
})();
__prefs.preferences.load();window.ForestStarflightPhase1=__scene.ForestStarflightGame;
})();
