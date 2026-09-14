import AnimalSnackGame from './AnimalSnackGame.js';
import { PenguinSlideSession, PENGUIN_SLIDE_LEVELS, SLIDE_DIRECTIONS, slideFrom } from '../data/PenguinSlideMazeData.js';

const CELL = 82, BOARD_X = 353, BOARD_Y = 184;

export default class PenguinSlideMazeGame extends AnimalSnackGame {
    constructor() { super('PenguinSlideMazeGame'); }
    init(data = {}) { super.init(data); this.startLevelIndex = Number.isInteger(data.levelIndex) ? data.levelIndex : 0; }
    create() {
        this.sound.stopAll(); this.soundOn = true; this.audioNodes = new Set(); this.overlay = null;
        this.session = new PenguinSlideSession(this.startLevelIndex); this.mode = 'intro'; this.busy = false;
        this.boardObjects = []; this.hintGraphics = null; this.hintTimer = null; this.pointerStart = null;
        this.drawIceField(); this.drawHud(); this.bindMazeInput(); this.drawLevel(); this.showIntro();
        this.visibilityHandler = () => { if (document.hidden && this.mode === 'playing') this.pauseGame(); };
        this.blurHandler = () => { if (this.mode === 'playing') this.pauseGame(); };
        document.addEventListener('visibilitychange', this.visibilityHandler); this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler); this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler); this.stopTones();
        });
    }
    cellCenter([x, y]) { return [BOARD_X + x * CELL + CELL / 2, BOARD_Y + y * CELL + CELL / 2]; }
    drawIceField() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x6ba8c5, 0xa5d3e3, 0xe4f5fa, 0xf8fdff, 1).fillRect(0, 0, 1280, 720);
        g.fillStyle(0x9bcddd, .65).fillTriangle(15, 275, 210, 42, 405, 275).fillTriangle(850, 275, 1065, 35, 1275, 275);
        g.fillStyle(0xffffff, .9).fillTriangle(143, 122, 210, 42, 279, 122).fillTriangle(991, 118, 1065, 35, 1138, 118);
        g.fillStyle(0xf4fbfd).fillEllipse(640, 570, 1450, 410);
    }
    drawHud() {
        this.panel(640, 43, 1248, 66, 0xf9fdff, 0xd5edf4, 19).setDepth(60);
        this.button(101, 43, 150, 43, '← 遊戲列表', () => this.leave(), 0x397f9f).setDepth(61);
        this.text(426, 41, '企鵝滑冰迷宮', 31, '#28576c').setDepth(61);
        this.levelText = this.text(668, 43, '第 1 關', 18, '#648595').setDepth(61);
        this.soundButton = this.button(953, 43, 116, 43, '音效：開', () => {
            this.soundOn = !this.soundOn; if (!this.soundOn) this.stopTones();
            this.soundButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xdceff4, '#28576c').setDepth(61);
        this.button(1103, 43, 154, 43, '暫停 / 說明', () => this.pauseGame(), 0xdceff4, '#28576c').setDepth(61);

        this.panel(153, 333, 250, 478, 0xf9fdff, 0xcde8f1, 23).setDepth(45);
        this.text(153, 124, '滑冰任務', 23, '#28576c').setDepth(46);
        this.taskText = this.text(153, 190, '', 18, '#4e7484').setDepth(46);
        this.moveText = this.text(153, 278, '滑行 0 次', 25, '#28576c').setDepth(46);
        this.button(153, 356, 194, 49, '↶ 復原一步', () => this.undoMove(), 0xf0d783, '#5d552e').setDepth(46);
        this.button(153, 421, 194, 49, '↺ 本關重來', () => this.resetLevel(), 0xdceff4, '#28576c').setDepth(46);
        this.button(153, 486, 194, 49, '小海豹提示', () => this.showHint(), 0xbfe3eb, '#28576c').setDepth(46);
        this.statText = this.text(153, 559, '', 16, '#648595').setDepth(46);

        this.panel(1118, 333, 220, 478, 0xf9fdff, 0xcde8f1, 23).setDepth(45);
        this.text(1118, 123, '滑行方向', 23, '#28576c').setDepth(46);
        this.directionButtons = {
            up: this.button(1118, 205, 66, 58, '↑', () => this.tryMove('up'), 0x4e91ad),
            left: this.button(1077, 270, 66, 58, '←', () => this.tryMove('left'), 0x4e91ad),
            right: this.button(1159, 270, 66, 58, '→', () => this.tryMove('right'), 0x4e91ad),
            down: this.button(1118, 335, 66, 58, '↓', () => this.tryMove('down'), 0x4e91ad)
        };
        Object.values(this.directionButtons).forEach((button) => button.setDepth(46));
        this.text(1118, 423, '點方向按鈕\n方向鍵／WASD\n冰面滑動手勢', 16, '#648595').setDepth(46);
        this.feedback = this.text(640, 105, '看看營火在哪裡，再想滑行方向。', 20, '#416b7d').setDepth(61);
        this.text(640, 694, '企鵝會一直滑到湖邊或障礙物前｜途中碰到營火就完成', 16, '#4f7687').setDepth(61);
    }
    drawLevel() {
        this.clearBoard(); const level = this.session.level;
        const board = this.add.graphics().setDepth(20); board.fillStyle(0x80c8dc, .9).fillRoundedRect(BOARD_X - 10, BOARD_Y - 10, level.width * CELL + 20, level.height * CELL + 20, 24);
        board.lineStyle(3, 0xd9f6fa, .9).strokeRoundedRect(BOARD_X - 10, BOARD_Y - 10, level.width * CELL + 20, level.height * CELL + 20, 24);
        for (let y = 0; y < level.height; y += 1) for (let x = 0; x < level.width; x += 1) {
            const shade = (x + y) % 2 ? 0xbce8ef : 0xcceff4;
            board.fillStyle(shade, .72).fillRoundedRect(BOARD_X + x * CELL + 3, BOARD_Y + y * CELL + 3, CELL - 6, CELL - 6, 12);
            board.lineStyle(1, 0xe8fbfd, .75).strokeRoundedRect(BOARD_X + x * CELL + 3, BOARD_Y + y * CELL + 3, CELL - 6, CELL - 6, 12);
        }
        this.boardObjects.push(board);
        level.obstacles.forEach((point, index) => { const [x, y] = this.cellCenter(point); this.boardObjects.push(this.drawObstacle(x, y, index)); });
        { const [x, y] = this.cellCenter(level.goal); this.goalView = this.drawCampfire(x, y); this.boardObjects.push(this.goalView); }
        { const [x, y] = this.cellCenter(this.session.position); this.penguin = this.drawPenguin(x, y); this.boardObjects.push(this.penguin); }
        this.swipeZone = this.add.zone(BOARD_X, BOARD_Y, level.width * CELL, level.height * CELL).setOrigin(0).setInteractive().setDepth(39);
        this.swipeZone.on('pointerdown', (pointer) => { this.pointerStart = { x: pointer.x, y: pointer.y }; });
        this.swipeZone.on('pointerup', (pointer) => this.handleSwipe(pointer)); this.boardObjects.push(this.swipeZone);
        this.levelText.setText(`第 ${this.session.levelIndex + 1} 關 / ${PENGUIN_SLIDE_LEVELS.length}`);
        this.taskText.setText(`${level.name}\n${level.guide}`); this.refreshHud();
    }
    clearBoard() {
        this.clearHint();
        this.boardObjects.forEach((object) => {
            this.tweens.killTweensOf(object); if (object.list) object.list.forEach((child) => this.tweens.killTweensOf(child)); object.destroy();
        });
        this.boardObjects = [];
    }
    drawObstacle(x, y, index) {
        const c = this.add.container(x, y).setDepth(28), g = this.add.graphics();
        if (index % 2) {
            g.fillStyle(0x7895a2).fillEllipse(0, 15, 65, 43).fillCircle(-17, 1, 25).fillCircle(14, 0, 30);
            g.fillStyle(0xdff3f6, .65).fillEllipse(-8, -7, 37, 13);
        } else {
            g.fillStyle(0xf4fbfc).fillEllipse(0, 20, 74, 38).fillCircle(-21, 5, 25).fillCircle(12, -2, 33).fillCircle(31, 10, 20);
            g.lineStyle(3, 0xc0e2e9).strokeEllipse(0, 20, 74, 38);
        }
        c.add(g); return c;
    }
    drawCampfire(x, y) {
        const c = this.add.container(x, y).setDepth(27), g = this.add.graphics();
        g.fillStyle(0x744f39).fillRoundedRect(-34, 21, 68, 13, 6); g.fillRoundedRect(-7, -8, 14, 68, 6); g.setAngle?.(0);
        g.fillStyle(0xf29d43).fillTriangle(-27, 20, 0, -37, 27, 20); g.fillStyle(0xffdd6a).fillTriangle(-13, 18, 2, -19, 15, 18);
        const glow = this.add.circle(0, 2, 48, 0xffd665, .18); c.add([glow, g]);
        this.tweens.add({ targets: glow, scale: 1.15, alpha: .32, duration: 650, yoyo: true, repeat: -1 }); return c;
    }
    drawPenguin(x, y) {
        const c = this.add.container(x, y).setDepth(35), g = this.add.graphics();
        g.fillStyle(0x304b61).fillEllipse(0, 4, 54, 68).fillCircle(0, -25, 27);
        g.fillStyle(0xf7fbfc).fillEllipse(0, 8, 34, 47); g.fillStyle(0xffffff).fillCircle(-9, -29, 7).fillCircle(9, -29, 7);
        g.fillStyle(0x2c4654).fillCircle(-8, -29, 3).fillCircle(8, -29, 3);
        g.fillStyle(0xf0a74a).fillTriangle(-9, -19, 9, -19, 0, -10).fillEllipse(-17, 38, 22, 8).fillEllipse(17, 38, 22, 8);
        g.fillStyle(0xd85e61).fillRoundedRect(-29, -5, 58, 10, 5).fillTriangle(19, -1, 38, 17, 25, 1);
        c.add(g); return c;
    }
    handleSwipe(pointer) {
        if (!this.pointerStart) return; const dx = pointer.x - this.pointerStart.x, dy = pointer.y - this.pointerStart.y; this.pointerStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
        this.tryMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
    tryMove(direction) {
        if (this.mode !== 'playing' || this.busy) return; this.clearHint(); const result = this.session.move(direction);
        if (result.result === 'blocked') {
            this.feedback.setText(`${SLIDE_DIRECTIONS[direction].label}邊沒有滑行空間，換個方向試試～`); this.tone('hint');
            this.tweens.add({ targets: this.penguin, angle: 8, duration: 70, yoyo: true, repeat: 2 }); return;
        }
        if (!['moved', 'complete'].includes(result.result)) return; this.busy = true; this.refreshHud(); this.tone('send');
        const [x, y] = this.cellCenter(result.position); const duration = 145 + result.path.length * 95;
        this.feedback.setText(result.result === 'complete' ? '滑到溫暖的營火了！' : `向${SLIDE_DIRECTIONS[direction].label}滑，停在雪牆前。`);
        this.tweens.add({ targets: this.penguin, x, y, angle: direction === 'left' ? -8 : direction === 'right' ? 8 : 0, duration, ease: 'Sine.easeInOut', onComplete: () => {
            this.penguin.setAngle(0); this.busy = false;
            if (result.result === 'complete') { this.mode = 'waiting'; this.sparkle(x, y); this.tone('correct'); this.time.delayedCall(600, () => this.finishLevel()); }
        }});
    }
    undoMove() {
        if (this.mode !== 'playing' || this.busy) return; this.clearHint();
        if (!this.session.undo()) { this.feedback.setText('現在就在起點，還沒有上一步喔。'); this.tone('hint'); return; }
        const [x, y] = this.cellCenter(this.session.position); this.busy = true; this.refreshHud(); this.tone('hint');
        this.tweens.add({ targets: this.penguin, x, y, duration: 330, ease: 'Sine.easeInOut', onComplete: () => { this.busy = false; this.feedback.setText('回到上一步了，再想想方向！'); } });
    }
    resetLevel() {
        if (!['playing', 'paused'].includes(this.mode)) return; this.tweens.resumeAll(); this.session.resetLevel(); this.mode = 'playing'; this.busy = false;
        this.overlay?.destroy(); this.overlay = null; this.drawLevel(); this.feedback.setText('回到起點，重新規劃滑行路線！');
    }
    showHint() {
        if (this.mode !== 'playing' || this.busy) return; this.clearHint(); const direction = this.session.hint(); this.refreshHud();
        if (!direction) { this.feedback.setText('目前找不到路線，請復原一步或本關重來。'); return; }
        const result = slideFrom(this.session.level, this.session.position, direction), g = this.add.graphics().setDepth(38);
        g.lineStyle(9, 0xffd763, .8); const [sx, sy] = this.cellCenter(this.session.position); g.beginPath().moveTo(sx, sy);
        result.path.forEach((point) => { const [x, y] = this.cellCenter(point); g.lineTo(x, y); }); g.strokePath();
        const [ex, ey] = this.cellCenter(result.position); g.fillStyle(0xffd763, .95).fillCircle(ex, ey, 14);
        this.hintGraphics = g; this.directionButtons[direction].setScale(1.15); this.feedback.setText(`小海豹提示：下一步往「${SLIDE_DIRECTIONS[direction].label}」滑。`); this.tone('hint');
        this.hintTimer = this.time.delayedCall(2300, () => this.clearHint());
    }
    clearHint() {
        this.hintTimer?.remove(false); this.hintTimer = null;
        this.hintGraphics?.destroy(); this.hintGraphics = null;
        if (this.directionButtons) Object.values(this.directionButtons).forEach((button) => button.setScale(1));
    }
    refreshHud() { this.moveText.setText(`本關滑行 ${this.session.moves} 次`); this.statText.setText(`全部滑行 ${this.session.totalMoves} 次\n復原 ${this.session.totalUndos} 次\n提示 ${this.session.hints} 次`); }
    bindMazeInput() {
        const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
        this.keyHandler = (event) => {
            if (event.repeat) return; if (map[event.code]) this.tryMove(map[event.code]);
            else if (event.code === 'KeyH') this.showHint(); else if (event.code === 'KeyZ' || event.code === 'KeyU') this.undoMove();
            else if (event.code === 'KeyR') this.resetLevel(); else if (event.code === 'Escape' || event.code === 'KeyP') this.mode === 'paused' ? this.resumeGame() : this.pauseGame();
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
    }
    showIntro() {
        const o = this.makeOverlay('企鵝滑冰迷宮開始！', '冰面很滑，企鵝一出發就會一直滑到湖邊或障礙物前。\n規劃上下左右的順序，途中碰到溫暖營火就完成。\n走錯可以復原或重來，沒有倒數，也不會失敗。');
        o.add(this.text(640, 414, '第一關只滑一次，之後慢慢增加到五次滑行。', 19, '#678493'));
        o.add(this.button(640, 506, 280, 59, '開始滑冰！', () => { o.destroy(); this.overlay = null; this.mode = 'playing'; this.sound.context?.resume?.(); }, 0x397f9f));
    }
    pauseGame() {
        if (this.mode !== 'playing') return; this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.makeOverlay('休息一下，企鵝停在冰面上', '選擇上下左右後，企鵝會一直滑到湖邊或障礙物前。\n走錯可按「復原一步」；小海豹提示會畫出下一段路線。\n鍵盤可用方向鍵或 WASD，Z／U 復原，R 重來。');
        o.add(this.button(640, 407, 270, 55, '繼續滑冰', () => this.resumeGame(), 0x397f9f));
        o.add(this.button(500, 500, 220, 51, '本關重來', () => this.resetLevel(), 0xf0d783, '#5d552e'));
        o.add(this.button(780, 500, 220, 51, '返回遊戲列表', () => this.leave(), 0xdceff4, '#28576c'));
    }
    finishLevel() {
        if (!['playing', 'waiting'].includes(this.mode)) return; this.mode = 'levelComplete'; const last = this.session.levelIndex === PENGUIN_SLIDE_LEVELS.length - 1; this.tone('finish');
        const o = this.makeOverlay(last ? '企鵝抵達最後的營火！' : '企鵝找到營火了！', `${this.session.level.name}完成！\n本關滑行：${this.session.moves} 次　全部提示：${this.session.hints} 次`);
        o.add(this.text(640, 398, '走錯也願意再想一次，就是很棒的空間練習。', 18, '#678493'));
        if (last) {
            o.add(this.button(500, 490, 230, 59, '再玩一次', () => this.restart(), 0x397f9f));
            o.add(this.button(780, 490, 230, 59, '返回遊戲列表', () => this.leave(), 0xf0d783, '#5d552e'));
        } else {
            o.add(this.button(640, 490, 270, 59, '前往下一關', () => { o.destroy(); this.overlay = null; this.session.advance(); this.mode = 'playing'; this.drawLevel(); this.feedback.setText('新冰湖開始，先找營火和可以停下的位置！'); }, 0x397f9f));
        }
    }
}
