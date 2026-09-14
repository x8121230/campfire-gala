import AnimalSnackGame from './AnimalSnackGame.js';
import { SkiSession, SKI_CONFIG, skiStage } from '../data/IceSkiData.js';

const OBSTACLES = ['tree', 'rock', 'hole', 'snowman'];

// Self-contained trial scene. It does not touch hearts, rewards, achievements or formal saves.
export default class IceSkiGame extends AnimalSnackGame {
    constructor() { super('IceSkiGame'); }

    create() {
        this.sound.stopAll();
        this.session = new SkiSession();
        this.mode = 'intro';
        this.soundOn = true;
        this.audioNodes = new Set();
        this.overlay = null;
        this.lane = SKI_CONFIG.startLane;
        this.targetLane = this.lane;
        this.jumpLeft = 0;
        this.invincibleLeft = 0;
        this.spawnLeft = 0.75;
        this.elapsed = 0;
        this.course = [];
        this.snow = [];
        this.drawWorld();
        this.drawHud();
        this.player = this.makeSkier(SKIE_X(this.lane), SKI_CONFIG.playerY).setDepth(30);
        this.bindSkiInput();
        this.showIntro();

        this.visibilityHandler = () => { if (document.hidden && this.mode === 'playing') this.pauseGame(); };
        this.blurHandler = () => { if (this.mode === 'playing') this.pauseGame(); };
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler);
            this.input.off('pointerdown', this.pointerDownHandler);
            this.input.off('pointerup', this.pointerUpHandler);
            this.stopTones();
        });
    }

    drawWorld() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xaad8ee, 0xcceaf4, 0xf7fcff, 0xeaf8fb, 1).fillRect(0, 0, 1280, 720);
        bg.fillStyle(0xc7e7f1, 1).fillTriangle(260, 250, 465, 44, 650, 250);
        bg.fillStyle(0xd9f1f7, 1).fillTriangle(515, 250, 755, 22, 965, 250);
        bg.fillStyle(0xffffff, .92).fillTriangle(389, 120, 465, 44, 530, 122);
        bg.fillStyle(0xffffff, .92).fillTriangle(666, 108, 755, 22, 835, 108);
        bg.fillStyle(0xf8fdff, 1).fillRoundedRect(318, 83, 640, 637, 44);
        bg.lineStyle(5, 0xd1ecf4, 1).strokeRoundedRect(318, 83, 640, 637, 44);
        bg.lineStyle(3, 0xdceff5, .9);
        bg.lineBetween(552, 95, 552, 720); bg.lineBetween(748, 95, 748, 720);

        for (let i = 0; i < 18; i++) {
            const x = i % 2 ? 1060 + (i % 3) * 44 : 110 + (i % 4) * 48;
            const y = 104 + Math.floor(i / 2) * 68;
            this.makePine(x, y, .55 + (i % 3) * .08).setAlpha(.78);
        }
        for (let i = 0; i < 32; i++) {
            const flake = this.add.circle((i * 173) % 1280, 78 + (i * 97) % 630, i % 3 + 2, 0xffffff, .72);
            this.snow.push(flake);
        }
    }

    drawHud() {
        this.panel(640, 43, 1248, 66, 0xf9fdff, 0xd6edf4, 19).setDepth(50);
        this.button(101, 43, 150, 43, '← 遊戲列表', () => this.leave(), 0x397fa0).setDepth(51);
        this.text(438, 41, '冰原滑雪大冒險', 31, '#28576c').setDepth(51);
        this.stageText = this.text(671, 43, skiStage(0).label, 17, '#648595').setDepth(51);
        this.soundButton = this.button(952, 43, 116, 43, '音效：開', () => {
            this.soundOn = !this.soundOn;
            if (!this.soundOn) this.stopTones();
            this.soundButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xdceff4, '#28576c').setDepth(51);
        this.button(1103, 43, 154, 43, '暫停 / 說明', () => this.pauseGame(), 0xdceff4, '#28576c').setDepth(51);

        this.panel(155, 230, 250, 240, 0xf9fdff, 0xcde8f1, 24);
        this.text(155, 135, '冰晶任務', 24, '#28576c');
        this.progressText = this.text(155, 183, '0 / 12', 39, '#28576c');
        this.add.rectangle(61, 222, 188, 10, 0xdbeef3).setOrigin(0, .5);
        this.progressFill = this.add.rectangle(61, 222, 1, 10, 0x54b9d1).setOrigin(0, .5);
        this.feedback = this.text(155, 276, '左右移動，收集冰晶！', 17, '#567989');
        this.slowButton = this.button(155, 330, 202, 47, '慢慢滑：關', () => this.toggleSlow(), 0xf0d783, '#5d552e');

        this.panel(1120, 221, 250, 220, 0xf9fdff, 0xcde8f1, 24);
        this.text(1120, 135, '操作方法', 23, '#28576c');
        this.text(1120, 188, '← →　左右滑行\n↑／空白鍵　跳躍\n也可以直接滑動', 17, '#567989');
        this.jumpButton = this.button(1120, 297, 202, 48, '跳起來！', () => this.jump(), 0xefac67, '#65462f');

        this.leftButton = this.button(109, 622, 130, 78, '◀', () => this.move(-1), 0x397fa0).setDepth(60);
        this.rightButton = this.button(1171, 622, 130, 78, '▶', () => this.move(1), 0x397fa0).setDepth(60);
        this.text(640, 698, '收集 12 顆冰晶抵達終點｜撞到障礙會拍拍雪繼續，不扣愛心', 16, '#4f7687').setDepth(51);
    }

    makePine(x, y, scale = 1) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.fillStyle(0x876a50).fillRoundedRect(-8 * scale, 24 * scale, 16 * scale, 35 * scale, 5);
        g.fillStyle(0x3e8991).fillTriangle(0, -48 * scale, 35 * scale, 21 * scale, -35 * scale, 21 * scale);
        g.fillStyle(0x58a7aa).fillTriangle(0, -25 * scale, 45 * scale, 42 * scale, -45 * scale, 42 * scale);
        g.fillStyle(0xffffff, .9).fillTriangle(0, -48 * scale, 15 * scale, -18 * scale, -15 * scale, -18 * scale);
        c.add(g); return c;
    }

    makeSkier(x, y) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.lineStyle(5, 0x29647a).lineBetween(-31, 44, 15, 51).lineBetween(-12, 49, 37, 56);
        g.fillStyle(0x4aa0be).fillRoundedRect(-29, -13, 58, 72, 23);
        g.fillStyle(0xf4c6a1).fillCircle(0, -37, 26);
        g.fillStyle(0x81539b).fillCircle(0, -54, 28).fillRoundedRect(-32, -52, 64, 17, 8);
        g.fillStyle(0xffffff).fillCircle(-9, -38, 4).fillCircle(9, -38, 4);
        g.fillStyle(0x315469).fillCircle(-9, -38, 2).fillCircle(9, -38, 2);
        g.lineStyle(3, 0x9a5a55).beginPath().arc(0, -31, 9, .25, Math.PI - .25).strokePath();
        g.lineStyle(5, 0x3f7891).lineBetween(-20, 4, -43, 33).lineBetween(20, 4, 43, 33);
        c.add(g); c.bodyArt = g; return c;
    }

    makeCourseItem(kind, lane) {
        const c = this.add.container(SKIE_X(lane), SKI_CONFIG.spawnY).setDepth(20);
        const g = this.add.graphics();
        if (kind === 'crystal') {
            g.fillStyle(0x74ddf4, .95).fillTriangle(0, -27, 25, -4, 0, 31).fillTriangle(0, -27, -25, -4, 0, 31);
            g.lineStyle(3, 0xffffff, .9).strokeTriangle(0, -27, 25, -4, 0, 31).strokeTriangle(0, -27, -25, -4, 0, 31);
        } else if (kind === 'tree') {
            g.fillStyle(0x72563f).fillRect(-7, 11, 14, 38);
            g.fillStyle(0x35858e).fillTriangle(0, -45, 40, 25, -40, 25).fillTriangle(0, -20, 48, 45, -48, 45);
            g.fillStyle(0xffffff, .9).fillTriangle(0, -45, 17, -16, -17, -16);
        } else if (kind === 'rock') {
            g.fillStyle(0x7792a0).fillRoundedRect(-39, -20, 78, 57, 18);
            g.fillStyle(0xbfd4dc, .8).fillEllipse(-12, -9, 28, 13);
        } else if (kind === 'hole') {
            g.fillStyle(0x4e9eb9, .65).fillEllipse(0, 15, 104, 46);
            g.lineStyle(4, 0xd9f8ff, 1).strokeEllipse(0, 15, 104, 46);
        } else {
            g.fillStyle(0xffffff).fillCircle(0, 12, 35).fillCircle(0, -31, 25);
            g.fillStyle(0xef8d51).fillTriangle(4, -30, 38, -22, 4, -18);
            g.fillStyle(0x385c6b).fillCircle(-8, -36, 3).fillCircle(8, -36, 3);
        }
        c.add(g); c.kind = kind; c.lane = lane; c.resolved = false;
        this.course.push(c); return c;
    }

    bindSkiInput() {
        this.keyHandler = e => {
            if (e.repeat) return;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.mode === 'paused') this.resumeGame(); else this.pauseGame(); return;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.move(-1);
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.move(1);
            if (e.code === 'ArrowUp' || e.code === 'Space') this.jump();
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
        this.pointerDownHandler = p => { this.dragStart = {x:p.x, y:p.y}; };
        this.pointerUpHandler = p => {
            if (!this.dragStart || this.mode !== 'playing') return;
            const dx = p.x - this.dragStart.x, dy = p.y - this.dragStart.y;
            if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1);
            else if (dy < -52) this.jump();
            this.dragStart = null;
        };
        this.input.on('pointerdown', this.pointerDownHandler);
        this.input.on('pointerup', this.pointerUpHandler);
    }

    move(direction) {
        if (this.mode !== 'playing') return;
        const next = Phaser.Math.Clamp(this.targetLane + direction, 0, 2);
        if (next !== this.targetLane) { this.targetLane = next; this.session.laneChange(); this.tone('send'); }
    }

    jump() {
        if (this.mode !== 'playing' || this.jumpLeft > 0) return;
        this.jumpLeft = SKI_CONFIG.jumpSeconds; this.session.jump(); this.tone('send');
    }

    toggleSlow() {
        if (this.mode !== 'playing') return;
        const slow = this.session.toggleSlow();
        this.slowButton.label.setText(slow ? '慢慢滑：開' : '慢慢滑：關');
        this.feedback.setText(slow ? '雪道變慢了，慢慢練習！' : '恢復原來速度，出發！');
    }

    spawnItem() {
        const crystalChance = this.session.crystals < 2 ? .72 : .47;
        const kind = Math.random() < crystalChance ? 'crystal' : OBSTACLES[Phaser.Math.Between(0, OBSTACLES.length - 1)];
        let lane = Phaser.Math.Between(0, 2);
        if (kind === 'crystal' && this.session.crystals < 2) lane = this.targetLane;
        this.makeCourseItem(kind, lane);
    }

    update(_time, delta) {
        if (this.mode !== 'playing') return;
        const dt = Math.max(0, Math.min(delta / 1000, .05));
        this.elapsed += dt;
        const stage = skiStage(this.session.crystals);
        const speed = stage.speed * (this.session.slowMode ? .62 : 1);
        this.snow.forEach((flake, i) => {
            flake.y += dt * (20 + i % 5 * 8) * (this.session.slowMode ? .55 : 1);
            flake.x += Math.sin(this.elapsed + i) * dt * 8;
            if (flake.y > 720) flake.y = 72;
        });

        const oldLane = this.lane;
        this.player.x += (SKIE_X(this.targetLane) - this.player.x) * Math.min(1, dt * 10);
        if (Math.abs(this.player.x - SKIE_X(this.targetLane)) < 3) this.lane = this.targetLane;
        this.player.angle += ((this.targetLane > oldLane ? 8 : this.targetLane < oldLane ? -8 : 0) - this.player.angle) * Math.min(1, dt * 9);

        if (this.jumpLeft > 0) {
            this.jumpLeft = Math.max(0, this.jumpLeft - dt);
            const progress = 1 - this.jumpLeft / SKI_CONFIG.jumpSeconds;
            this.player.y = SKI_CONFIG.playerY - Math.sin(progress * Math.PI) * 90;
            this.player.setScale(1 + Math.sin(progress * Math.PI) * .12);
        } else { this.player.y = SKI_CONFIG.playerY; this.player.setScale(1); }

        if (this.invincibleLeft > 0) {
            this.invincibleLeft = Math.max(0, this.invincibleLeft - dt);
            this.player.alpha = Math.floor(this.invincibleLeft * 12) % 2 ? .35 : 1;
        } else this.player.alpha = 1;

        this.spawnLeft -= dt;
        if (this.spawnLeft <= 0) {
            this.spawnItem(); this.spawnLeft = stage.spawn * Phaser.Math.FloatBetween(.82, 1.18);
        }

        for (const item of this.course) {
            item.y += speed * dt;
            item.setScale(.62 + Math.min(1, (item.y - 90) / 520) * .46);
            if (!item.resolved && Math.abs(item.y - this.player.y) < 49 && Math.abs(item.x - this.player.x) < 72) {
                item.resolved = true;
                if (item.kind === 'crystal') this.collectCrystal(item);
                else if (this.jumpLeft <= 0 && this.invincibleLeft <= 0) this.bump(item);
            }
        }
        this.course.filter(item => item.y > 780 || item.resolved && item.kind === 'crystal').forEach(item => {
            item.destroy(); this.course.splice(this.course.indexOf(item), 1);
        });
    }

    collectCrystal(item) {
        item.setVisible(false); this.session.collect(); this.tone('correct'); this.sparkle(item.x, item.y);
        this.progressText.setText(`${this.session.crystals} / ${SKI_CONFIG.crystalsToFinish}`);
        this.progressFill.width = Math.max(1, 188 * this.session.crystals / SKI_CONFIG.crystalsToFinish);
        this.stageText.setText(skiStage(this.session.crystals).label);
        this.feedback.setText(['亮晶晶，找到了！', '滑得好穩！', '冰晶在幫你帶路！'][this.session.crystals % 3]);
        if (this.session.finished) this.time.delayedCall(500, () => this.finishSki());
    }

    bump(item) {
        this.session.bump(); this.invincibleLeft = SKI_CONFIG.invincibleSeconds; this.tone('hint');
        this.feedback.setText(item.kind === 'hole' ? '踩到冰洞邊邊，跳一下就能過！' : '拍拍身上的雪，再繼續滑！');
        this.tweens.add({targets:this.player, angle:item.x < this.player.x ? 18 : -18, duration:120, yoyo:true, repeat:1});
    }

    showIntro() {
        const o = this.makeOverlay('穿上滑雪板，出發！', '左右移動，收集藍色冰晶。\n看到雪松、岩石和冰洞，可以換方向或跳過去。\n撞到也沒關係，拍拍雪就能繼續！');
        const crystal = this.makeCourseItem('crystal', 1).setPosition(530, 414).setDepth(101); this.course.pop(); o.add(crystal);
        const skier = this.makeSkier(730, 423).setScale(.82); o.add(skier);
        o.add(this.text(640, 481, '先收集 12 顆冰晶，不限時間、不扣愛心。', 18, '#678493'));
        o.add(this.button(640, 542, 275, 58, '開始滑雪！', () => {
            this.overlay.destroy(); this.overlay = null; this.mode = 'playing'; this.sound.context?.resume?.();
        }, 0x397fa0));
    }

    pauseGame() {
        if (this.mode !== 'playing') return;
        this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.makeOverlay('休息一下，雪道會等你', '按左右方向鍵或畫面兩側按鈕移動。\n按上、空白鍵或「跳起來」越過障礙。\n也可以在雪道上左右滑動、向上滑動。');
        o.add(this.button(640, 405, 270, 55, '繼續滑雪', () => this.resumeGame(), 0x397fa0));
        o.add(this.button(500, 498, 220, 51, '重新開始', () => this.restart(), 0xf0d783, '#5d552e'));
        o.add(this.button(780, 498, 220, 51, '返回遊戲列表', () => this.leave(), 0xdceff4, '#28576c'));
    }

    finishSki() {
        if (this.mode === 'finished') return;
        this.mode = 'finished'; this.course.forEach(item => item.destroy()); this.course = []; this.tone('finish');
        const o = this.makeOverlay('抵達冰晶雪村！', `12 顆冰晶全部找到了！\n換過雪道：${this.session.changedLane} 次　跳躍：${this.session.jumps} 次\n碰到障礙：${this.session.bumped} 次`);
        o.add(this.text(640, 394, '這是幼童試玩紀錄，不消耗愛心，也不寫入正式存檔。', 18, '#678493'));
        o.add(this.button(500, 490, 230, 59, '再滑一次', () => this.restart(), 0x397fa0));
        o.add(this.button(780, 490, 230, 59, '返回遊戲列表', () => this.leave(), 0xf0d783, '#5d552e'));
    }
}

function SKIE_X(lane) { return SKI_CONFIG.laneX[lane]; }
