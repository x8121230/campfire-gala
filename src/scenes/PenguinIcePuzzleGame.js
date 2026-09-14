import AnimalSnackGame from './AnimalSnackGame.js';
import { PenguinPuzzleSession, ICE_PUZZLE_LEVELS, ICE_DIRECTIONS, findIcePuzzleHint } from '../data/PenguinIcePuzzleData.js';

const CELL = 78, BOARD_X = 377, BOARD_Y = 132;
const COLORS = { ice: 0xe9f8fb, iceAlt: 0xd9f2f7, line: 0x9fd4e0, wall: 0xa9ced8, dark: 0x28576c };

// Calm Sokoban-style trial. No timer, life loss, reward or formal save writes.
export default class PenguinIcePuzzleGame extends AnimalSnackGame {
    constructor() { super('PenguinIcePuzzleGame'); }

    create() {
        this.sound.stopAll(); this.soundOn = true; this.audioNodes = new Set(); this.overlay = null;
        this.session = new PenguinPuzzleSession(0); this.mode = 'intro'; this.completedLevels = 0;
        this.tileViews = []; this.hintDirection = null; this.hintLeft = 0;
        this.drawBackground(); this.drawHud(); this.renderBoard(); this.bindPuzzleInput(); this.showIntro();
        this.visibilityHandler = () => { if (document.hidden && this.mode === 'playing') this.pauseGame(); };
        this.blurHandler = () => { if (this.mode === 'playing') this.pauseGame(); };
        document.addEventListener('visibilitychange', this.visibilityHandler); this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler); this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler); this.stopTones();
        });
    }

    drawBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0xa8d8e9, 0xccebf2, 0xedfafc, 0xdff4f8, 1).fillRect(0, 0, 1280, 720);
        g.fillStyle(0xf8fdff, .9).fillEllipse(640, 670, 1420, 330);
        for (let i = 0; i < 16; i++) {
            const x = 35 + (i * 197) % 1210, y = 88 + (i * 113) % 565;
            g.fillStyle(0xffffff, .55).fillCircle(x, y, 3 + i % 4);
        }
    }

    drawHud() {
        this.panel(640, 43, 1248, 66, 0xf9fdff, 0xd6edf4, 19).setDepth(50);
        this.button(101, 43, 150, 43, '← 遊戲列表', () => this.leave(), 0x397fa0).setDepth(51);
        this.text(438, 41, '企鵝冰塊推推樂', 31, '#28576c').setDepth(51);
        this.levelText = this.text(680, 43, '', 17, '#648595').setDepth(51);
        this.soundButton = this.button(952, 43, 116, 43, '音效：開', () => {
            this.soundOn = !this.soundOn; if (!this.soundOn) this.stopTones();
            this.soundButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0xdceff4, '#28576c').setDepth(51);
        this.button(1103, 43, 154, 43, '暫停 / 說明', () => this.pauseGame(), 0xdceff4, '#28576c').setDepth(51);

        this.panel(172, 290, 280, 390, 0xf9fdff, 0xcde8f1, 24);
        this.text(172, 133, '冰塊任務', 25, '#28576c');
        this.text(172, 184, '把冰塊推到發光圓圈', 18, '#567989');
        this.progressText = this.text(172, 235, '第 1 / 5 關', 31, '#28576c');
        this.moveText = this.text(172, 284, '移動 0　推動 0', 17, '#648595');
        this.feedback = this.text(172, 342, '一次走一格，慢慢想～', 17, '#567989');
        this.button(172, 407, 210, 48, '提示下一步', () => this.showHint(), 0xf0d783, '#5d552e');
        this.button(112, 471, 102, 47, '復原', () => this.undo(), 0xdceff4, '#28576c');
        this.button(232, 471, 102, 47, '重來', () => this.resetLevel(), 0xdceff4, '#28576c');

        this.panel(1094, 311, 292, 430, 0xf9fdff, 0xcde8f1, 24);
        this.text(1094, 137, '方向控制', 24, '#28576c');
        this.directionButtons = {};
        this.directionButtons.up = this.button(1094, 213, 94, 64, '▲', () => this.move('up'), 0x4b94ad);
        this.directionButtons.left = this.button(1029, 290, 94, 64, '◀', () => this.move('left'), 0x4b94ad);
        this.directionButtons.down = this.button(1094, 290, 94, 64, '▼', () => this.move('down'), 0x4b94ad);
        this.directionButtons.right = this.button(1159, 290, 94, 64, '▶', () => this.move('right'), 0x4b94ad);
        this.text(1094, 378, '鍵盤方向鍵也可以操作\n點企鵝旁邊的冰格也能走', 17, '#567989');
        this.text(1094, 456, '推錯不用怕\n按「復原」回到上一步', 17, '#648595');
        this.text(640, 696, '五個小關卡｜沒有倒數、不扣愛心、隨時可以復原或重來', 16, '#4f7687').setDepth(51);
    }

    renderBoard() {
        this.tileViews.forEach(v => v.destroy()); this.tileViews = [];
        const s = this.session; this.levelText.setText(ICE_PUZZLE_LEVELS[s.levelIndex].name);
        this.progressText.setText(`第 ${s.levelIndex + 1} / ${ICE_PUZZLE_LEVELS.length} 關`);
        this.moveText.setText(`移動 ${s.moves}　推動 ${s.pushes}`);
        for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) {
            const px = BOARD_X + x * CELL, py = BOARD_Y + y * CELL, k = `${x},${y}`;
            if (s.walls.has(k)) { this.drawSnowWall(px, py); continue; }
            const tile = this.add.rectangle(px, py, CELL - 5, CELL - 5, (x + y) % 2 ? COLORS.ice : COLORS.iceAlt, .98)
                .setStrokeStyle(2, COLORS.line, 1).setInteractive({useHandCursor:true});
            tile.on('pointerdown', () => this.tapCell(x, y)); this.tileViews.push(tile);
            if (s.targets.has(k)) this.tileViews.push(this.drawTarget(px, py));
        }
        for (const box of s.boxes) {
            const [x, y] = box.split(',').map(Number); this.tileViews.push(this.drawIceBlock(BOARD_X + x * CELL, BOARD_Y + y * CELL, s.targets.has(box)));
        }
        this.penguinView = this.drawPenguin(BOARD_X + s.player.x * CELL, BOARD_Y + s.player.y * CELL); this.tileViews.push(this.penguinView);
    }

    drawSnowWall(x, y) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.fillStyle(COLORS.wall).fillRoundedRect(-CELL/2+2, -CELL/2+2, CELL-4, CELL-4, 15);
        g.fillStyle(0xf7fdff, .9).fillEllipse(-12, -19, 48, 19).fillEllipse(23, -10, 34, 15);
        c.add(g); this.tileViews.push(c); return c;
    }
    drawTarget(x, y) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.fillStyle(0x77d9ec, .24).fillCircle(0, 0, 28); g.lineStyle(4, 0x42b9d2, .9).strokeCircle(0, 0, 28);
        for (let i=0;i<6;i++){const a=i*Math.PI/3;g.fillStyle(0xffffff,.9).fillCircle(Math.cos(a)*21,Math.sin(a)*21,3);}
        c.add(g); return c;
    }
    drawIceBlock(x, y, onTarget) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.fillStyle(onTarget ? 0x60d5cb : 0x73d4ec, .98).fillRoundedRect(-29,-30,58,60,12);
        g.lineStyle(4, 0xffffff, .9).strokeRoundedRect(-29,-30,58,60,12);
        g.fillStyle(0xffffff,.55).fillRoundedRect(-18,-19,22,10,5);
        if(onTarget){g.fillStyle(0xffe083).fillStar(0,5,5,8,18);}
        c.add(g); return c;
    }
    drawPenguin(x, y) {
        const c = this.add.container(x, y), g = this.add.graphics();
        g.fillStyle(0x294d61).fillEllipse(0,5,55,66).fillCircle(0,-18,26);
        g.fillStyle(0xffffff).fillEllipse(0,10,35,46);
        g.fillStyle(0xffffff).fillCircle(-9,-22,7).fillCircle(9,-22,7);
        g.fillStyle(0x253b47).fillCircle(-8,-22,3).fillCircle(8,-22,3);
        g.fillStyle(0xf3a45d).fillTriangle(0,-14,17,-7,0,-3);
        g.fillStyle(0xf3a45d).fillEllipse(-16,36,23,9).fillEllipse(16,36,23,9);
        c.add(g); return c;
    }

    bindPuzzleInput() {
        this.keyHandler = e => {
            if (e.repeat) return;
            const map = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right'};
            if (map[e.code]) this.move(map[e.code]);
            else if (e.code === 'KeyZ' || e.code === 'Backspace') this.undo();
            else if (e.code === 'KeyR') this.resetLevel();
            else if (e.code === 'Escape' || e.code === 'KeyP') this.mode === 'paused' ? this.resumeGame() : this.pauseGame();
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
    }
    tapCell(x, y) {
        if (this.mode !== 'playing') return;
        const dx=x-this.session.player.x,dy=y-this.session.player.y;
        if(Math.abs(dx)+Math.abs(dy)!==1){this.feedback.setText('點企鵝旁邊的一格喔～');return;}
        this.move(dx===1?'right':dx===-1?'left':dy===1?'down':'up');
    }
    move(direction) {
        if (this.mode !== 'playing') return;
        const result = this.session.move(direction); this.clearHint();
        if (!result.moved) { this.feedback.setText('這邊被擋住了，換個方向看看！'); this.tone('hint'); return; }
        this.tone(result.pushed ? 'send' : 'send'); this.feedback.setText(result.pushed ? '冰塊推動了！看看發光圓圈在哪裡。' : '企鵝走一步～');
        this.renderBoard();
        if (result.complete) { this.mode = 'levelCompletePending'; this.time.delayedCall(350, () => this.finishLevel()); }
    }
    undo() {
        if (this.mode !== 'playing') return;
        if (!this.session.undo()) { this.feedback.setText('現在已經是這關的第一步囉！'); return; }
        this.clearHint(); this.feedback.setText('回到上一步，再想想看。'); this.renderBoard(); this.tone('hint');
    }
    resetLevel() {
        if (!['playing','paused'].includes(this.mode)) return;
        this.session.reset(); this.clearHint(); this.mode='playing'; this.overlay?.destroy(); this.overlay=null;
        this.feedback.setText('重新開始這一關，慢慢來！'); this.renderBoard();
    }
    showHint() {
        if (this.mode !== 'playing') return;
        const direction = findIcePuzzleHint(this.session); this.clearHint();
        if (!direction) { this.feedback.setText('這個位置卡住了，按復原或重來吧！'); return; }
        this.hintDirection = direction; this.hintLeft = 2.6;
        const button=this.directionButtons[direction]; button.setScale(1.13);
        this.feedback.setText(`小企鵝建議：下一步往「${ICE_DIRECTIONS[direction].label}」`); this.tone('hint');
    }
    clearHint() {
        if(this.hintDirection)this.directionButtons[this.hintDirection]?.setScale(1);
        this.hintDirection=null;this.hintLeft=0;
    }
    update(_time, delta) {
        if(this.mode!=='playing'||!this.hintDirection)return;
        this.hintLeft-=Math.min(delta/1000,.05); if(this.hintLeft<=0)this.clearHint();
    }

    showIntro() {
        const o=this.makeOverlay('幫企鵝修好冰橋！','走到藍色冰塊旁邊，把冰塊推到發光圓圈。\n企鵝只能推，不能把冰塊拉回來。\n推錯可以按「復原」，也可以請小企鵝提示下一步。');
        o.add(this.drawPenguin(520,414)); o.add(this.text(596,414,'推 →',24,'#567989')); o.add(this.drawIceBlock(690,414,false));
        o.add(this.text(640,482,'共有 5 個小關卡，沒有倒數，也不會扣愛心。',18,'#678493'));
        o.add(this.button(640,542,275,58,'開始推冰塊！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));
    }
    pauseGame() {
        if(this.mode!=='playing')return;this.mode='paused';this.stopTones();
        const o=this.makeOverlay('休息一下，冰塊不會跑掉','用方向鍵或右邊的大按鈕移動企鵝。\n走到冰塊旁邊，繼續往前走就能推動。\n推錯可按復原；不知道怎麼走可按提示。');
        o.add(this.button(640,405,270,55,'繼續推冰塊',()=>this.resumeGame(),0x397fa0));
        o.add(this.button(500,498,220,51,'本關重來',()=>this.resetLevel(),0xf0d783,'#5d552e'));
        o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));
    }
    finishLevel() {
        if(!['playing','levelCompletePending'].includes(this.mode))return;this.mode='levelComplete';this.tone('correct');
        const last=this.session.levelIndex===ICE_PUZZLE_LEVELS.length-1;
        const o=this.makeOverlay(last?'冰橋全部修好了！':'冰塊放好了！',last?'五個冰塊任務都完成了，企鵝朋友安全通過！':`${ICE_PUZZLE_LEVELS[this.session.levelIndex].name}完成！\n移動 ${this.session.moves} 步，推動 ${this.session.pushes} 次。`);
        o.add(this.text(640,397,last?'試玩紀錄不寫入正式存檔，也不消耗愛心。':'下一關會多一點轉彎，慢慢觀察就好。',18,'#678493'));
        if(last){
            o.add(this.button(500,492,230,59,'再玩一次',()=>{this.session.load(0);this.mode='playing';o.destroy();this.overlay=null;this.renderBoard();},0x397fa0));
            o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));
        }else o.add(this.button(640,492,260,59,'前往下一關',()=>{this.session.load(this.session.levelIndex+1);this.mode='playing';o.destroy();this.overlay=null;this.renderBoard();this.feedback.setText('先找發光圓圈，再想怎麼推！');},0x397fa0));
    }
}
