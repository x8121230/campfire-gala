import AnimalSnackGame from './AnimalSnackGame.js';
import { SnowHouseMemorySession, SNOW_HOUSE_LEVELS, SNOW_HOUSE_ANIMALS } from '../data/SnowHouseMemoryData.js';

export default class SnowHouseMemoryGame extends AnimalSnackGame {
    constructor() { super('SnowHouseMemoryGame'); }
    create() {
        this.sound.stopAll(); this.soundOn = true; this.audioNodes = new Set(); this.overlay = null;
        this.mode = 'intro'; this.session = new SnowHouseMemorySession(this.startLevelIndex || 0); this.houses = [];
        this.busy = false; this.helperMode = false; this.previewTimer = null; this.hintTimer = null;
        this.drawVillage(); this.drawHud(); this.bindMemoryInput(); this.drawLevel(); this.showIntro();
        this.visibilityHandler = () => { if (document.hidden && this.mode === 'playing') this.pauseGame(); };
        this.blurHandler = () => { if (this.mode === 'playing') this.pauseGame(); };
        document.addEventListener('visibilitychange', this.visibilityHandler); this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler); this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler); this.stopTones();
        });
    }
    animalInfo(id) { return SNOW_HOUSE_ANIMALS.find((animal) => animal.id === id) || SNOW_HOUSE_ANIMALS[0]; }
    drawVillage() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x79b5cc, 0xaed8e6, 0xe8f6fa, 0xf8fdff, 1).fillRect(0, 0, 1280, 720);
        g.fillStyle(0xb8dce7, .65).fillTriangle(20, 275, 210, 55, 405, 275).fillTriangle(820, 270, 1040, 35, 1265, 270);
        g.fillStyle(0xffffff, .92).fillTriangle(145, 130, 210, 55, 278, 130).fillTriangle(966, 114, 1040, 35, 1117, 114);
        g.fillStyle(0xf6fcfe).fillEllipse(640, 560, 1450, 470);
        for (let i = 0; i < 34; i += 1) {
            const x = (i * 149 + 31) % 1280, y = 95 + (i * 83) % 550;
            g.fillStyle(0xffffff, .72).fillCircle(x, y, 2 + i % 4);
        }
    }
    drawHud() {
        this.panel(640, 43, 1248, 66, 0xf9fdff, 0xd5edf4, 19).setDepth(60);
        this.button(101, 43, 150, 43, '← 遊戲列表', () => this.leave(), 0x477f99).setDepth(61);
        this.text(424, 41, '雪屋躲貓貓', 31, '#2b5c70').setDepth(61);
        this.levelText = this.text(650, 43, '第 1 關', 18, '#648595').setDepth(61);
        this.soundButton = this.button(953, 43, 116, 43, '音效：開', () => {
            this.soundOn = !this.soundOn; if (!this.soundOn) this.stopTones();
            this.soundButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xdceff4, '#28576c').setDepth(61);
        this.button(1103, 43, 154, 43, '暫停 / 說明', () => this.pauseGame(), 0xdceff4, '#28576c').setDepth(61);

        this.panel(153, 330, 250, 470, 0xf9fdff, 0xcde8f1, 23).setDepth(45);
        this.text(153, 124, '雪屋小任務', 23, '#28576c').setDepth(46);
        this.taskText = this.text(153, 181, '', 19, '#4e7484').setDepth(46);
        this.progressText = this.text(153, 260, '', 26, '#28576c').setDepth(46);
        this.helperButton = this.button(153, 337, 196, 50, '幫幫我：關', () => this.toggleHelper(), 0xf0d783, '#5d552e').setDepth(46);
        this.button(153, 405, 196, 50, '雪兔露臉提示', () => this.showHint(), 0xdceff4, '#28576c').setDepth(46);
        this.statText = this.text(153, 485, '', 16, '#648595').setDepth(46);
        this.text(153, 557, '點錯不扣分\n等等再找一次', 17, '#648595').setDepth(46);

        this.panel(1118, 327, 220, 464, 0xf9fdff, 0xcde8f1, 23).setDepth(45);
        this.text(1118, 124, '怎麼玩？', 23, '#28576c').setDepth(46);
        this.text(1118, 215, '先看動物露臉\n記住牠們的雪屋\n\n連續打開兩間\n找出一樣的朋友', 17, '#648595').setDepth(46);
        this.text(1118, 374, '直接點雪屋\n鍵盤 1～6 也可以', 16, '#648595').setDepth(46);
        this.feedback = this.text(640, 106, '先看看動物躲在哪裡～', 20, '#416b7d').setDepth(61);
        this.text(640, 694, '先露臉、再躲好｜連續打開兩間雪屋｜相同動物就配對成功', 16, '#4f7687').setDepth(61);
    }
    drawAnimal(id) {
        const c = this.add.container(0, -2), g = this.add.graphics();
        if (id === 'penguin') {
            g.fillStyle(0x334d62).fillEllipse(0, 5, 68, 86).fillCircle(0, -30, 34);
            g.fillStyle(0xf7fbfc).fillEllipse(0, 8, 42, 59);
            g.fillStyle(0xf4a74b).fillTriangle(-9, -25, 9, -25, 0, -13).fillEllipse(-20, 46, 27, 10).fillEllipse(20, 46, 27, 10);
        } else if (id === 'seal') {
            g.fillStyle(0x91b9c8).fillEllipse(0, 10, 78, 67).fillCircle(0, -22, 35).fillTriangle(-31, 24, -53, 46, -17, 39).fillTriangle(31, 24, 53, 46, 17, 39);
            g.fillStyle(0xeaf6f8).fillEllipse(0, -8, 38, 27);
        } else if (id === 'rabbit') {
            g.fillStyle(0xf7f8f4).fillEllipse(-17, -48, 19, 54).fillEllipse(17, -48, 19, 54).fillCircle(0, -15, 34).fillEllipse(0, 25, 58, 52);
            g.fillStyle(0xe7a5b4).fillEllipse(-17, -49, 7, 37).fillEllipse(17, -49, 7, 37);
        } else {
            g.fillStyle(0xb88769).fillEllipse(0, 12, 80, 68).fillCircle(0, -22, 37);
            g.fillStyle(0xe9c3a8).fillEllipse(0, -8, 45, 30);
            g.fillStyle(0xfff7df).fillTriangle(-19, 0, -9, 0, -14, 29).fillTriangle(19, 0, 9, 0, 14, 29);
        }
        g.fillStyle(0x304955).fillCircle(-12, -25, 4).fillCircle(12, -25, 4).fillCircle(0, -10, 5);
        c.add(g); return c;
    }
    drawHouse(tile, x, y, index) {
        const c = this.add.container(x, y).setDepth(25), shell = this.add.graphics();
        shell.fillStyle(0xeaf8fb).fillEllipse(0, 12, 188, 155).fillRect(-94, 12, 188, 58);
        shell.lineStyle(3, 0xb7dce7, .9).strokeEllipse(0, 12, 188, 155);
        for (let row = 0; row < 4; row += 1) {
            const yy = -42 + row * 30; shell.lineStyle(2, 0xc5e5ed, .8).lineBetween(-78 + row * 5, yy, 78 - row * 5, yy);
        }
        const animal = this.drawAnimal(tile.animal); animal.setVisible(false);
        const door = this.add.graphics(); door.fillStyle(0x76a9bd).fillRoundedRect(-48, -24, 96, 96, 42); door.lineStyle(5, 0xd7f0f5).strokeRoundedRect(-48, -24, 96, 96, 42);
        door.fillStyle(0xf5d784).fillCircle(28, 27, 6);
        const marker = this.add.circle(0, 78, 13, this.animalInfo(tile.animal).color, .9).setStrokeStyle(3, 0xffffff).setVisible(this.helperMode);
        const number = this.text(0, 101, String(index + 1), 16, '#527687');
        c.add([shell, animal, door, marker, number]); c.setSize(210, 190).setInteractive({ useHandCursor: true });
        const view = { c, shell, animal, door, marker, number, tileId: tile.id };
        c.on('pointerdown', () => this.chooseHouse(view)); return view;
    }
    drawLevel() {
        this.clearHouses(); const count = this.session.tiles.length;
        const positions = count === 4
            ? [[500, 290], [780, 290], [500, 515], [780, 515]]
            : [[420, 290], [640, 290], [860, 290], [420, 515], [640, 515], [860, 515]];
        this.session.tiles.forEach((tile, index) => this.houses.push(this.drawHouse(tile, positions[index][0], positions[index][1], index)));
        this.levelText.setText(`第 ${this.session.levelIndex + 1} 關 / ${SNOW_HOUSE_LEVELS.length}`);
        this.taskText.setText(`${this.session.level.name}\n找出 ${count / 2} 對朋友`); this.refreshHud();
    }
    clearHouses() { this.previewTimer?.remove(false); this.hintTimer?.remove(false); this.houses.forEach((house) => house.c.destroy()); this.houses = []; }
    refreshHud() {
        const matched = this.session.tiles.filter((tile) => tile.matched).length / 2;
        this.progressText.setText(`找到 ${matched} / ${this.session.tiles.length / 2} 對`);
        this.statText.setText(`翻兩間 ${this.session.totalAttempts} 次\n再試 ${this.session.totalMistakes} 次\n提示 ${this.session.hints} 次`);
    }
    setHouseOpen(view, open, matched = false) {
        view.door.setVisible(!open); view.animal.setVisible(open); view.marker.setVisible(this.helperMode && !matched);
        if (matched) { view.c.disableInteractive(); view.number.setText('配對成功 ✓').setFontSize(14).setColor('#4f9278'); }
    }
    startPreview() {
        this.mode = 'preview'; this.busy = true; this.feedback.setText('動物先露臉，記住牠們的雪屋喔！');
        this.houses.forEach((house) => this.setHouseOpen(house, true)); this.tone('hint');
        this.previewTimer = this.time.delayedCall(this.helperMode ? 3300 : 2400, () => {
            this.houses.forEach((house) => this.setHouseOpen(house, false)); this.busy = false; this.mode = 'playing';
            this.feedback.setText('動物躲好了！打開兩間雪屋找朋友。');
        });
    }
    chooseHouse(view) {
        if (this.mode !== 'playing' || this.busy) return;
        const result = this.session.choose(view.tileId); if (result.result === 'ignored') return;
        this.setHouseOpen(view, true); this.tone(result.result === 'match' ? 'correct' : 'hint');
        if (result.result === 'first') { this.feedback.setText(`找到${this.animalInfo(this.session.tiles[view.tileId].animal).name}，再找一間！`); return; }
        this.refreshHud();
        if (result.result === 'match') {
            this.busy = true; const name = this.animalInfo(result.animal).name; this.feedback.setText(`${name}找到好朋友了！`);
            result.ids.forEach((id) => { const house = this.houses[id]; this.setHouseOpen(house, true, true); this.sparkle(house.c.x, house.c.y - 25); });
            this.time.delayedCall(720, () => { this.busy = false; if (result.levelComplete) this.finishLevel(); });
            return;
        }
        this.busy = true; this.feedback.setText('兩位朋友不一樣，記住位置再試一次～');
        this.time.delayedCall(this.helperMode ? 1500 : 1050, () => {
            this.session.close(result.ids); result.ids.forEach((id) => this.setHouseOpen(this.houses[id], false));
            this.busy = false; this.feedback.setText('關好門了，再打開兩間看看！');
        });
    }
    toggleHelper() {
        if (!['playing', 'preview'].includes(this.mode)) return; this.helperMode = !this.helperMode;
        this.helperButton.label.setText(this.helperMode ? '幫幫我：開' : '幫幫我：關');
        this.houses.forEach((house) => { const tile = this.session.tiles[house.tileId]; house.marker.setVisible(this.helperMode && !tile.matched); });
        this.feedback.setText(this.helperMode ? '相同顏色會提示哪兩間是好朋友。' : '彩色提示收起來，自己記住位置！');
    }
    showHint() {
        if (this.mode !== 'playing' || this.busy) return; this.busy = true; const ids = this.session.peek(); this.refreshHud();
        this.feedback.setText('雪兔幫忙：還沒配對的朋友都露臉囉！'); this.tone('hint');
        ids.forEach((id) => this.setHouseOpen(this.houses[id], true));
        this.hintTimer = this.time.delayedCall(1900, () => {
            ids.forEach((id) => { const tile = this.session.tiles[id]; if (!tile.matched && this.session.firstId !== id) this.setHouseOpen(this.houses[id], false); });
            this.busy = false; this.feedback.setText('記好了嗎？繼續找一樣的朋友！');
        });
    }
    bindMemoryInput() {
        this.keyHandler = (event) => {
            if (event.repeat) return;
            if (/^Digit[1-6]$/.test(event.code)) { const house = this.houses[Number(event.code.slice(-1)) - 1]; if (house) this.chooseHouse(house); }
            else if (event.code === 'KeyH') this.showHint();
            else if (event.code === 'Escape' || event.code === 'KeyP') this.mode === 'paused' ? this.resumeGame() : this.pauseGame();
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
    }
    showIntro() {
        const o = this.makeOverlay('歡迎來到雪屋躲貓貓！', '動物會先在雪屋外露個臉，再鑽進去關上門。\n連續打開兩間雪屋，找出一樣的動物朋友。\n找錯不扣分，可以慢慢記、一直試。');
        o.add(this.text(640, 411, '前兩關只有 4 間雪屋，後三關才增加到 6 間。', 19, '#678493'));
        o.add(this.button(640, 505, 280, 59, '開始看動物！', () => { o.destroy(); this.overlay = null; this.startPreview(); this.sound.context?.resume?.(); }, 0x477f99));
    }
    pauseGame() {
        if (this.mode !== 'playing') return; this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.makeOverlay('休息一下，動物會等你', '連續打開兩間雪屋，找出一樣的動物。\n「幫幫我」會顯示成對的彩色提示。\n「雪兔露臉提示」會暫時打開還沒配對的雪屋。');
        o.add(this.button(640, 407, 270, 55, '繼續找朋友', () => this.resumeGame(), 0x477f99));
        o.add(this.button(500, 500, 220, 51, '本關重來', () => this.restartLevel(), 0xf0d783, '#5d552e'));
        o.add(this.button(780, 500, 220, 51, '返回遊戲列表', () => this.leave(), 0xdceff4, '#28576c'));
    }
    restartLevel() { this.tweens.resumeAll(); this.scene.restart({ returnScene: this.returnScene, levelIndex: this.session.levelIndex }); }
    init(data = {}) { super.init(data); this.startLevelIndex = Number.isInteger(data.levelIndex) ? data.levelIndex : 0; }
    finishLevel() {
        this.mode = 'levelComplete'; this.tone('finish'); const last = this.session.levelIndex === SNOW_HOUSE_LEVELS.length - 1;
        const o = this.makeOverlay(last ? '雪屋朋友全都找到了！' : '這一區配對完成！', `${this.session.level.name}完成！\n這關翻兩間：${this.session.attempts} 次　再試：${this.session.mistakes} 次`);
        o.add(this.text(640, 398, '每一次重新尋找，都是在練習記住位置。', 18, '#678493'));
        if (last) {
            o.add(this.button(500, 490, 230, 59, '再玩一次', () => this.restart(), 0x477f99));
            o.add(this.button(780, 490, 230, 59, '返回遊戲列表', () => this.leave(), 0xf0d783, '#5d552e'));
        } else {
            o.add(this.button(640, 490, 270, 59, '前往下一區', () => { o.destroy(); this.overlay = null; this.session.advance(); this.drawLevel(); this.startPreview(); }, 0x477f99));
        }
    }
}
