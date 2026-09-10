import AnimalSnackGame from './AnimalSnackGame.js';
import { OceanSession, OCEAN_ITEMS, OCEAN_BINS } from '../data/OceanCleanupData.js';

const INSTRUCTIONS = {
    rescue: '點垃圾，讓海洋朋友安心游泳！',
    sort: '先點垃圾，再送進相同圖示的回收桶。',
    mission: '看看任務圖卡，只收指定的物品。'
};
const STAGES = { rescue: '認識海洋朋友', sort: '垃圾分分類', mission: '小隊長任務' };

// Inherits visual/audio helpers only; rules, lifecycle, controls and rewards are independent.
export default class OceanCleanupGame extends AnimalSnackGame {
    constructor() { super('OceanCleanupGame'); }
    preload() {
        if (!this.textures.exists('ocean_background')) this.load.image('ocean_background', 'assets/ocean-cleanup/ocean.png');
        if (!this.textures.exists('ocean_sprites')) this.load.spritesheet('ocean_sprites', 'assets/ocean-cleanup/sprites.png', { frameWidth: 512, frameHeight: 512 });
    }
    create() {
        this.sound.stopAll(); this.session = new OceanSession(); this.mode = 'intro';
        this.soundOn = true; this.audioNodes = new Set(); this.slow = false;
        this.motionTime = 0; this.shot = null; this.waiting = 0;
        this.hintRemaining = 0; this.halos = []; this.views = []; this.bins = [];
        this.overlay = null; this.promptView = null;
        if (!this.textures.exists('ocean_background') || !this.textures.exists('ocean_sprites')) {
            this.makeOverlay('素材還沒載入完成', '請確認 assets/ocean-cleanup 已完整複製。\n返回列表後，再試一次。')
                .add(this.button(640, 480, 280, 60, '返回遊戲列表', () => this.leave()));
            return;
        }
        this.drawOceanUI(); this.showRound(); this.showStage(true); this.bindOceanInput();
        this.visibilityHandler = () => { if (document.hidden) this.pauseGame(); };
        this.blurHandler = () => this.pauseGame();
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler);
            this.stopTones(); this.overlay = null;
        });
    }
    item(x, y, id, size = 130) {
        return this.add.image(x, y, 'ocean_sprites', id === 'submarine' ? 0 : OCEAN_ITEMS[id].frame).setDisplaySize(size, size);
    }
    drawOceanUI() {
        this.add.image(640, 360, 'ocean_background').setDisplaySize(1280, 720);
        this.panel(640, 44, 1248, 68, 0xf1fcff, 0xbce4ef, 20);
        this.button(103, 44, 156, 46, '← 遊戲列表', () => this.leave(), 0x206c89);
        this.text(421, 42, '海洋清理隊', 33, '#15566e');
        this.text(649, 45, '兔子船長 · 幼童試玩', 17, '#3c7180');
        this.audioButton = this.button(951, 44, 126, 46, '音效：開', () => {
            this.soundOn = !this.soundOn; if (!this.soundOn) this.stopTones();
            this.audioButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xd8eff4, '#15566e');
        this.button(1121, 44, 164, 46, '暫停 / 說明', () => this.pauseGame(), 0xd8eff4, '#15566e');
        this.panel(160, 390, 278, 588, 0xf1fcff, 0xbce4ef);
        this.text(160, 128, '今天的清理任務', 24, '#15566e');
        this.progressText = this.text(160, 181, '0 / 12', 39, '#15566e');
        this.add.rectangle(55, 220, 210, 9, 0xd3eaf0).setOrigin(0, .5);
        this.progressFill = this.add.rectangle(55, 220, 1, 9, 0x2a96ad).setOrigin(0, .5);
        this.stageText = this.text(160, 256, '', 19, '#396b7c');
        this.taskText = this.text(160, 301, '', 23, '#15566e');
        this.panel(160, 385, 228, 124, 0xe0f3f9, 0xbce4ef, 20);
        this.countText = this.text(160, 475, '', 22, '#15566e');
        this.button(160, 542, 226, 58, '✦ 小精靈提示', () => this.revealHint(), 0xffd979, '#654b20');
        this.slowButton = this.button(160, 613, 226, 54, '慢慢玩：關', () => this.toggleSlow(), 0xd8eff4, '#15566e');
        this.text(160, 657, '慢慢看，不用趕時間', 17, '#4b7380');
        this.panel(785, 123, 872, 60, 0xf1fcff, 0xbce4ef, 19);
        this.feedback = this.text(785, 123, '', 23, '#15566e');
        this.ship = this.item(790, 517, 'submarine', 158);
        this.bottomText = this.text(785, 671, '', 21, '#124f65');
        this.text(785, 705, '點圖就能玩 · 鍵盤 1–4 選物品 · P 暫停 · H 提示 · S 慢慢玩', 16, '#124f65');
        OCEAN_BINS.forEach((bin, i) => {
            const x = 492 + i * 286;
            const c = this.add.container(x, 597);
            c.add([this.panel(0, 0, 254, 102, bin.color, 0x81b6c5, 19),
                this.item(-78, 0, bin.sample, 74), this.text(37, -16, bin.name, 27, '#15566e'),
                this.text(37, 22, ['A', 'B', 'C'][i] + ' · 點這個桶', 16, '#416b7b')]);
            c.setSize(254, 102).setInteractive({ useHandCursor: true });
            c.on('pointerdown', () => this.sortInto(bin.id)); this.bins.push(c);
        });
    }
    showRound() {
        this.clearHint(); this.views.forEach(v => v.destroy()); this.views = [];
        this.promptView?.destroy(); this.promptView = this.add.container(160, 385);
        const r = this.session.round; this.motionTime = 0;
        this.stageText.setText(`第 ${Math.floor(this.session.index / 4) + 1} 段 · ${STAGES[r.stage]}`);
        this.taskText.setText(r.stage === 'mission' ? `只收${OCEAN_ITEMS[r.target].name}` : r.stage === 'sort' ? '幫垃圾找對家' : '收垃圾，護朋友');
        if (r.stage === 'mission') {
            for (let i = 0; i < r.count; i++) this.promptView.add(this.item(r.count === 1 ? 0 : -52 + i * 104, 0, r.target, 100));
        } else {
            ['bottle', 'can', 'box'].forEach((id, i) => this.promptView.add(this.item((i - 1) * 74, 0, id, 76)));
        }
        this.feedback.setText(INSTRUCTIONS[r.stage]);
        const xs = r.items.length === 4 ? [427, 665, 903, 1141] : [485, 790, 1095];
        r.items.forEach((id, index) => {
            const c = this.add.container(xs[index], 330 + Math.sin(index * 1.4) * 30);
            c.baseX = xs[index];
            c.add([this.add.circle(0, 0, 79, 0xf2fcff, .78).setStrokeStyle(2, 0xc3f6ff),
                this.item(0, -2, id, 139), this.text(0, 99, `${index + 1} · ${OCEAN_ITEMS[id].name}`, 20, '#124f65')]);
            c.setSize(168, 168).setInteractive({ useHandCursor: true });
            c.on('pointerdown', () => this.choose(index)); this.views.push(c);
        });
        this.bins.forEach(c => c.setVisible(r.stage === 'sort').setAlpha(.48));
        this.ship.setPosition(r.stage === 'sort' ? 350 : 790, r.stage === 'sort' ? 490 : 534).setDisplaySize(r.stage === 'sort' ? 116 : 158, r.stage === 'sort' ? 116 : 158);
        this.bottomText.setText(r.stage === 'sort' ? '先抓到垃圾，回收桶就會亮起來。' : '點選物品，小潛艇會自動發射泡泡網。');
        this.refreshProgress();
    }
    refreshProgress() {
        this.progressText.setText(`${this.session.completed} / 12`);
        this.progressFill.width = Math.max(1, 210 * this.session.completed / 12);
        this.countText.setText(`已回收 ${this.session.caught.size} / ${this.session.round.count} 個`);
    }
    bindOceanInput() {
        this.keyHandler = e => {
            if (e.repeat) return;
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.mode === 'paused') this.resumeGame(); else this.pauseGame(); return;
            }
            if (e.code === 'KeyH') this.revealHint();
            else if (e.code === 'KeyS') this.toggleSlow();
            else if (/^Digit[1234]$/.test(e.code)) this.choose(Number(e.code.slice(-1)) - 1);
            else if (['KeyA', 'KeyB', 'KeyC'].includes(e.code)) this.sortInto(OCEAN_BINS[['KeyA', 'KeyB', 'KeyC'].indexOf(e.code)].id);
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
    }
    toggleSlow() {
        if (this.mode !== 'playing') return;
        this.slow = !this.slow; this.slowButton.label.setText(this.slow ? '慢慢玩：開' : '慢慢玩：關');
    }
    clearHint() { this.halos.forEach(h => h.circle.destroy()); this.halos = []; this.hintRemaining = 0; }
    revealHint() {
        if (this.mode !== 'playing' || this.shot || this.waiting > 0 || this.session.solved) return;
        this.clearHint(); const indices = this.session.hint();
        if (this.session.pending !== null) {
            const id = OCEAN_ITEMS[this.session.round.items[this.session.pending]].category;
            const c = this.bins[OCEAN_BINS.findIndex(b => b.id === id)];
            const outline = this.panel(c.x, c.y, 266, 114, 0xffd979, 0xf1b42e, 22).setAlpha(.4);
            this.halos.push({ circle: outline });
            this.feedback.setText('看看桶子上的物品，找一樣的圖示。');
        } else {
            indices.forEach(i => this.halos.push({ index: i,
                circle: this.add.circle(this.views[i].x, this.views[i].y, 86, 0xffd979, .1).setStrokeStyle(5, 0xffd15b) }));
            this.feedback.setText('看看金色圈圈，再對照任務圖卡。');
        }
        this.hintRemaining = 2.5; this.tone('hint');
    }
    choose(index) {
        if (this.mode !== 'playing' || this.shot || this.waiting > 0) return;
        const result = this.session.choose(index);
        if (result === 'ignored') return;
        this.clearHint(); const v = this.views[index];
        if (result === 'protected' || result === 'other-trash') {
            v.setAlpha(.55); v.disableInteractive(); this.tone('hint');
            this.feedback.setText(result === 'protected' ? '牠是海洋朋友，讓牠自由游泳吧！' : `這次先收${OCEAN_ITEMS[this.session.round.target].name}，其他留給下一隊。`);
            this.tweens.add({ targets: v, angle: 9, yoyo: true, repeat: 1, duration: 120, onComplete: () => v.setAngle(0) });
            return;
        }
        this.feedback.setText('泡泡網出發！'); this.tone('send');
        const bubble = this.add.circle(this.ship.x + 38, this.ship.y - 25, 22, 0xc2f6ff, .65).setStrokeStyle(3, 0xffffff);
        this.shot = { index, result, view: bubble, x: bubble.x, y: bubble.y, t: 0 };
    }
    landShot(s) {
        const v = this.views[s.index]; s.view.destroy(); this.shot = null;
        if (s.result === 'sort') {
            v.setPosition(790, 460).setScale(.75); v.disableInteractive();
            this.pendingRing = this.add.circle(790, 460, 67, 0xc2f6ff, .12).setStrokeStyle(4, 0xffffff);
            this.bins.forEach(c => c.setAlpha(1));
            this.feedback.setText('抓到了！點下面的桶，幫它找對家。');
            this.bottomText.setText('點回收桶 · 或按 A 塑膠／B 金屬／C 紙類');
        } else {
            v.setVisible(false); this.sparkle(v.x, v.y); this.tone('correct'); this.refreshProgress();
            this.feedback.setText(s.result === 'complete' ? '完成！海洋更乾淨了。' : `收到了！再找 ${this.session.round.count - this.session.caught.size} 個。`);
            if (s.result === 'complete') this.waiting = 1;
        }
    }
    sortInto(category) {
        if (this.mode !== 'playing' || this.shot || this.waiting > 0) return;
        const index = this.session.pending, result = this.session.sort(category);
        if (result === 'ignored') return;
        this.clearHint();
        if (result === 'wrong-bin') {
            this.bins[OCEAN_BINS.findIndex(b => b.id === category)].setAlpha(.4);
            this.feedback.setText('再看看桶上的圖示，它還在泡泡裡等你。'); this.tone('hint'); return;
        }
        this.pendingRing?.destroy(); this.pendingRing = null;
        const bin = this.bins[OCEAN_BINS.findIndex(b => b.id === category)];
        this.tweens.add({ targets: this.views[index], x: bin.x, y: bin.y, scale: .2, alpha: 0, duration: 500 });
        this.refreshProgress(); this.sparkle(bin.x, bin.y); this.tone('correct');
        this.feedback.setText('放對了！謝謝你幫垃圾找到家。'); this.waiting = 1;
    }
    update(_time, delta) {
        if (this.mode !== 'playing') return;
        const dt = Math.max(0, Math.min(delta / 1000, .05));
        if (this.hintRemaining > 0) { this.hintRemaining -= dt; if (this.hintRemaining <= 0) this.clearHint(); }
        if (this.waiting > 0) {
            this.waiting -= dt;
            if (this.waiting <= 0) {
                if (this.session.done) this.finish();
                else { const before = this.session.round.stage; this.session.advance(); this.showRound(); if (before !== this.session.round.stage) this.showStage(); }
            }
            return;
        }
        if (this.shot) {
            const s = this.shot, v = this.views[s.index]; s.t = Math.min(1, s.t + dt / .5);
            const t = s.t * s.t * (3 - 2 * s.t);
            s.view.setPosition(Phaser.Math.Linear(s.x, v.x, t), Phaser.Math.Linear(s.y, v.y, t));
            s.view.setScale(1 + t * 1.6);
            if (s.t >= 1) this.landShot(s);
            return;
        }
        if (this.session.pending !== null) return;
        if (!this.slow && this.hintRemaining <= 0) {
            this.motionTime += dt;
            this.views.forEach((v, i) => v.setPosition(v.baseX + Math.sin(this.motionTime * .36 + i) * 12,
                330 + Math.sin(this.motionTime * .45 + i * 1.4) * 30));
        }
        this.halos.forEach(h => { if (h.index !== undefined) h.circle.setPosition(this.views[h.index].x, this.views[h.index].y); });
    }
    showStage(first = false) {
        this.mode = first ? 'intro' : 'stage';
        const stage = this.session.round.stage;
        const body = { rescue: '點選垃圾，小潛艇會自動發射泡泡網。\n小魚、海龜是朋友，讓牠們自由游泳。',
            sort: '先點垃圾，把它裝進泡泡。\n再點下面有相同物品圖示的回收桶。',
            mission: '看左邊的圖卡，只收指定的物品。\n有兩個圖案，就要找到兩個喔！' }[stage];
        const o = this.makeOverlay(first ? '出發！海洋清理隊' : STAGES[stage], body);
        if (stage === 'rescue') {
            o.add([this.item(425, 398, 'bottle', 91), this.text(491, 398, '→', 30), this.text(565, 398, '回收', 25),
                this.item(743, 398, 'fish', 91), this.text(855, 398, '保護牠', 25)]);
        } else if (stage === 'sort') {
            OCEAN_BINS.forEach((b, i) => o.add([this.item(445 + i * 195, 390, b.sample, 90), this.text(445 + i * 195, 449, b.name, 22)]));
        } else {
            o.add([this.item(534, 399, this.session.round.target, 90), this.text(608, 399, '×', 30),
                this.text(663, 399, String(this.session.round.count), 40), this.text(799, 399, '看圖收集', 24)]);
        }
        if (stage !== 'sort') o.add(this.text(640, 462, '點錯可以再試，沒有倒數，也不扣愛心。', 20, '#537384'));
        o.add(this.button(640, 536, 284, 60, first ? '跟船長出發！' : '我準備好了', () => {
            this.overlay.destroy(); this.overlay = null; this.mode = 'playing';
            const resumed = this.sound.context?.resume?.(); resumed?.catch?.(() => {});
        }, 0x206c89));
    }
    pauseGame() {
        if (this.mode !== 'playing') return;
        this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.makeOverlay('休息一下，海洋朋友等你', `${INSTRUCTIONS[this.session.round.stage]}\n慢慢玩：停住物品，仍然可以作答。\n小精靈提示：用金色圈圈幫你找。`);
        o.add(this.button(640, 407, 280, 58, '繼續清理', () => this.resumeGame(), 0x206c89));
        o.add(this.button(501, 510, 242, 56, '重新開始', () => this.restart(), 0xffd979, '#654b20'));
        o.add(this.button(779, 510, 242, 56, '返回遊戲列表', () => this.leave(), 0xd8eff4, '#15566e'));
    }
    finish() {
        this.mode = 'finished'; this.clearHint(); this.tone('finish');
        const s = this.session;
        const o = this.makeOverlay('謝謝你，小小海洋守護員！', `完成 12 個任務，回收 ${s.collected} 個物品。\n海洋朋友可以安心游泳了！`);
        o.add([this.item(500, 397, 'fish', 114), this.item(770, 397, 'turtle', 126)]);
        o.add(this.button(500, 527, 242, 60, '再玩一次', () => this.restart(), 0x206c89));
        o.add(this.button(780, 527, 242, 60, '返回遊戲列表', () => this.leave(), 0xffd979, '#654b20'));
    }
    leave() {
        this.tweens.resumeAll(); this.stopTones();
        const target = this.scene.manager.keys[this.returnScene] ? this.returnScene : 'OceanDemoHome';
        if (this.scene.manager.keys[target]) this.scene.start(target);
    }
}
