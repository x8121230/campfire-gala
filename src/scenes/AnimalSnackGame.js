import { SnackSession, SNACK_GUESTS, SNACK_CONFIG, snackSpeed } from '../data/AnimalSnackData.js';

const FONT = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const LANES = [476, 746, 1016];
const ASSETS = 'assets/animal-snack/';

// Self-contained trial scene. Does not grant items or mutate formal progress.
export default class AnimalSnackGame extends Phaser.Scene {
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
