import AnimalSnackGame from './AnimalSnackGame.js';
import { MECHANISM_LEVELS, MECHANISM_CHAPTERS } from '../data/ForestMechanismLevels.js';
import { DIRECTIONS, parseLevel, MechanismSession, platesFilled, gemCount, adjacent, createSolver } from '../data/ForestMechanismRules.js';

const TILE = 68, BOARD_X = 330, BOARD_Y = 155;
const SPRITE = { fox: 0, crate: 1, wall: 2, exit: 3, key: 4, crystal: 5 };
const KEY_MOVES = { ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left' };

export default class ForestMechanismGame extends AnimalSnackGame {
    constructor() { super('ForestMechanismGame'); }
    preload() {
        if (!this.textures.exists('mechanism_forest')) this.load.image('mechanism_forest', 'assets/forest-mechanism/forest.png');
        if (!this.textures.exists('mechanism_sprites')) this.load.spritesheet('mechanism_sprites', 'assets/forest-mechanism/sprites.png', { frameWidth: 512, frameHeight: 512 });
    }
    text(x, y, value, size = 22, color = '#e9fff0', origin = .5) { return super.text(x, y, value, size, color, origin); }
    panel(x, y, w, h, fill = 0x153e36, border = 0x537d62, radius = 18) { return super.panel(x, y, w, h, fill, border, radius); }
    button(x, y, w, h, label, fn, fill = 0x26745f, color = '#f4fff1') { return super.button(x, y, w, h, label, fn, fill, color); }
    art(x, y, kind, size = 62) { return this.add.image(x, y, 'mechanism_sprites', SPRITE[kind]).setDisplaySize(size, size); }
    create() {
        this.sound.stopAll(); this.soundOn = true; this.audioNodes = new Set();
        this.records = this.records || {}; this.session = null; this.overlay = null; this.boardView = null;
        this.hintArrow = null; this.hintJob = null; this.busy = 0; this.levelIndex = 0; this.mode = 'select';
        if (!this.textures.exists('mechanism_forest') || !this.textures.exists('mechanism_sprites')) {
            const o = this.dialog('素材尚未載入', '請完整複製 assets/forest-mechanism，再返回列表重試。');
            o.add(this.button(640, 490, 280, 58, '返回遊戲列表', () => this.leave())); return;
        }
        this.showSelection(); if (!this.seenIntro) this.showRules(true);
        this.keyHandler = e => {
            if (KEY_MOVES[e.code]) { this.move(KEY_MOVES[e.code]); return; }
            if (e.repeat) return;
            if (e.code === 'KeyZ' || e.code === 'Backspace') this.undoMove();
            else if (e.code === 'KeyH') this.requestHint();
            else if (e.code === 'KeyR' && this.mode === 'playing') this.confirmRestart();
            else if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.mode === 'paused') this.resumeGame(); else this.pauseGame();
            }
        };
        this.input.keyboard?.on('keydown', this.keyHandler);
        this.input.keyboard?.addCapture?.(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'BACKSPACE']);
        this.visibilityHandler = () => { if (document.hidden) this.pauseGame(); };
        this.blurHandler = () => this.pauseGame();
        document.addEventListener('visibilitychange', this.visibilityHandler); this.game.events.on('blur', this.blurHandler);
        this.events.once('shutdown', () => {
            document.removeEventListener('visibilitychange', this.visibilityHandler); this.game.events.off('blur', this.blurHandler);
            this.input.keyboard?.off('keydown', this.keyHandler);
            this.input.keyboard?.removeCapture?.(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'BACKSPACE']);
            this.hintJob = null; this.stopTones(); this.session = null;
        });
    }
    clearSurface() {
        this.hintJob = null; this.hintArrow = null; this.hintRemaining = 0;
        this.tweens.killAll(); this.children.removeAll(true); this.overlay = null; this.boardView = null; this.busy = 0;
    }
    background() {
        this.add.image(640, 360, 'mechanism_forest').setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x0a2824, .33);
    }
    topBar(subtitle) {
        this.panel(640, 43, 1248, 68, 0x123b32, 0x638a61);
        this.button(110, 43, 168, 48, '← 遊戲列表', () => this.leave());
        this.text(427, 42, '森林機關探險', 31, '#ffe2a0');
        this.text(681, 44, subtitle, 18, '#c5e6cd');
        this.audioButton = this.button(958, 43, 120, 46, this.soundOn ? '音效：開' : '音效：關', () => {
            this.soundOn = !this.soundOn; if (!this.soundOn) this.stopTones();
            this.audioButton.label.setText(this.soundOn ? '音效：開' : '音效：關');
        }, 0x345b47);
        this.button(1130, 43, 174, 46, this.mode === 'select' ? '玩法說明' : '暫停 / 說明', () => {
            if (this.mode === 'select') this.showRules(false); else this.pauseGame();
        }, 0x345b47);
    }
    showSelection() {
        this.clearSurface(); this.mode = 'select'; this.background(); this.topBar('18 關 · 小學生挑戰');
        const completed = Object.keys(this.records).length, stars = Object.values(this.records).reduce((n, r) => n + r.stars, 0);
        this.text(640, 103, `自由選關，不用等待解鎖　｜　本次通關 ${completed} / 18　★ ${stars} / 54`, 22);
        MECHANISM_CHAPTERS.forEach((chapter, row) => {
            const y = 204 + row * 163;
            this.text(72, y - 66, `${String(row + 1).padStart(2, '0')}  ${chapter}`, 21, '#ffe2a0', 0).setOrigin(0, .5);
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col, level = MECHANISM_LEVELS[index], x = 150 + col * 196;
                const c = this.add.container(x, y);
                c.add([this.panel(0, 0, 178, 116, row === 2 ? 0x404635 : row === 1 ? 0x224945 : 0x1e4d36, 0x719377),
                    this.text(-64, -37, String(index + 1).padStart(2, '0'), 23, '#ffe2a0'),
                    this.text(0, 0, level.title, 18),
                    this.text(0, 34, this.records[index] ? '★'.repeat(this.records[index].stars) + '☆'.repeat(3 - this.records[index].stars) : level.focus, 16, '#c9e1c8')]);
                c.setSize(178, 116).setInteractive({ useHandCursor: true });
                c.on('pointerdown', () => {
                    if (this.mode !== 'select') return;
                    if (this.session && this.levelIndex === index && !this.session.won) this.renderLevel();
                    else this.startLevel(index);
                });
            }
        });
        this.text(640, 623, '入門：熟悉操作　　進階：新機關組合　　挑戰：安排順序與精簡路線', 21);
        this.text(640, 664, '★ 通關　★ 水晶收齊　★ 目標步數內、不用提示　｜　可隨時撤回，沒有倒數', 19, '#e7d4a2');
        this.text(640, 699, '星星只記在這次開啟的遊戲中；不影響正式愛心、收藏與成就。', 16, '#c7dfc9');
    }
    startLevel(index) {
        if (!Number.isInteger(index) || !MECHANISM_LEVELS[index]) return;
        this.levelIndex = index; this.session = new MechanismSession(parseLevel(MECHANISM_LEVELS[index]));
        this.renderLevel(); const resumed = this.sound.context?.resume?.(); resumed?.catch?.(() => {});
    }
    renderLevel() {
        this.clearSurface(); this.mode = 'playing'; this.background();
        const level = this.session.level;
        this.topBar(`${MECHANISM_CHAPTERS[Math.floor(this.levelIndex / 6)]} · 第 ${level.id} 關`);
        this.panel(640, 112, 624, 58); this.text(640, 111, `${String(level.id).padStart(2, '0')}　${level.title}`, 27, '#ffe2a0');
        this.panel(156, 387, 280, 592); this.text(156, 125, '冒險筆記', 26, '#ffe2a0');
        this.text(156, 171, level.focus, 23);
        this.text(156, 221, '點亮全部圓形底座\n再走進發光樹門', 20);
        this.plateText = this.text(156, 286, '', 22, '#d9efb0');
        this.art(79, 345, 'crystal', 52); this.gemText = this.text(178, 345, '', 21);
        this.art(79, 399, 'key', 52); this.keyText = this.text(178, 399, '', 20);
        this.text(156, 453, '目前步數', 19, '#b6d4bd'); this.moveText = this.text(156, 498, '', 44, '#ffe2a0');
        this.text(156, 546, `效率挑戰：${level.par} 步內`, 21);
        this.text(156, 605, '水晶是額外探索目標\n可以先通關，再挑戰三星', 18, '#c3dbbf');
        this.text(156, 658, '木箱只能推，不能拉', 18, '#ffe2a0');
        this.panel(1123, 387, 274, 592); this.text(1123, 125, '探險工具', 25, '#ffe2a0');
        this.undoButton = this.button(1123, 186, 232, 56, '↶ 撤回一步 · Z', () => this.undoMove());
        this.hintButton = this.button(1123, 252, 232, 56, '分段提示 · H', () => this.requestHint(), 0x856536, '#fff4c5');
        this.button(1123, 315, 232, 48, '重新挑戰 · R', () => this.confirmRestart(), 0x345b47);
        this.text(1123, 362, '方向鍵 / WASD / 點箭頭', 17, '#c3dbbf');
        this.button(1123, 416, 66, 62, '↑', () => this.move('up'));
        this.button(1051, 488, 66, 62, '←', () => this.move('left'));
        this.text(1123, 488, '移動', 18, '#c3dbbf');
        this.button(1195, 488, 66, 62, '→', () => this.move('right'));
        this.button(1123, 560, 66, 62, '↓', () => this.move('down'));
        this.button(1123, 643, 232, 52, '返回選關', () => { if (this.mode === 'playing') this.showSelection(); }, 0x345b47);
        this.panel(639, 675, 626, 65, 0x163d32, 0x52765a);
        this.feedback = this.text(639, 674, '先看看地圖，規劃好再出發。', 20).setWordWrapWidth(582);
        this.drawBoard(); this.refreshStats();
    }
    point(index) { return { x: BOARD_X + (index % this.session.level.width) * TILE + TILE / 2, y: BOARD_Y + Math.floor(index / this.session.level.width) * TILE + TILE / 2 }; }
    drawBoard(previous = null, events = []) {
        this.boardView?.destroy(); this.boardView = this.add.container(0, 0);
        const l = this.session.level, s = this.session.state, gateOpen = platesFilled(l, s);
        l.cells.forEach((tile, i) => {
            const { x, y } = this.point(i), c = this.add.container(x, y);
            c.add(this.add.rectangle(0, 0, TILE - 2, TILE - 2, (i + Math.floor(i / l.width)) % 2 ? 0xc2d4ab : 0xb6cba0).setStrokeStyle(1, 0x759277));
            if (tile === '#') c.add(this.art(0, 0, 'wall', 77));
            if (tile === 'p') {
                const filled = s.boxes.includes(i);
                c.add(this.add.circle(0, 0, 25, filled ? 0xffdc75 : 0x617b4d).setStrokeStyle(4, filled ? 0xfff2b4 : 0xd7eaae));
                c.add(this.text(0, 0, '●', 23, filled ? '#fff4b0' : '#bfd39d'));
            }
            if (tile === 'E') {
                c.add(this.art(0, -2, 'exit', 78).setAlpha(gateOpen ? 1 : .5));
                c.add(this.text(0, 25, gateOpen ? '出口' : '未開', 15, '#153e36'));
            }
            if (tile === 'K' && !s.key) c.add(this.art(0, 0, 'key', 57));
            const gem = l.gems.indexOf(i);
            if (gem >= 0 && !(s.gems & (1 << gem))) c.add(this.art(0, 0, 'crystal', 52));
            if (tile === 'D' || tile === 'G') {
                const open = tile === 'D' ? s.key : gateOpen, color = tile === 'D' ? 0x98703d : 0x376e45;
                c.add(this.add.rectangle(0, 0, 55, 57, color, open ? .23 : .96).setStrokeStyle(3, open ? 0xffec9e : 0x244731));
                if (!open) for (let n = -1; n <= 1; n++) c.add(this.add.rectangle(n * 15, 0, 5, 51, 0xe8d29c));
                c.add(this.text(0, 0, open ? '開' : tile === 'D' ? '鎖' : '閘', 21, open ? '#1d5535' : '#ffffff'));
            }
            if (tile === 'S') {
                c.add(this.add.rectangle(0, 0, 48, 48, s.bridge ? 0xfad169 : 0xb87539).setStrokeStyle(4, 0xffedbb));
                c.add(this.text(0, -8, '開關', 16, '#543b22')); c.add(this.text(0, 13, s.bridge ? 'ON' : 'OFF', 16, '#543b22'));
            }
            if (tile === 'B') {
                c.add(this.add.rectangle(0, 0, 64, 64, 0x347f92));
                if (s.bridge) for (let n = -2; n <= 2; n++) c.add(this.add.rectangle(n * 12, 0, 9, 45, 0xefcc85));
                c.add(this.text(0, 0, s.bridge ? '橋' : '斷橋', 18, s.bridge ? '#58411f' : '#e1fcff'));
            }
            if (tile === 'T') {
                c.add(this.add.circle(0, 0, 27, 0x785398).setStrokeStyle(4, 0xc6b2ff));
                c.add(this.add.circle(0, 0, 19, 0x4f3c70).setStrokeStyle(2, 0xe1c9ff));
                c.add(this.text(0, 0, '↔', 29, '#f4e8ff'));
            }
            c.setSize(TILE, TILE).setInteractive({ useHandCursor: tile !== '#' });
            c.on('pointerdown', () => this.tapTile(i)); this.boardView.add(c);
        });
        s.boxes.forEach(i => {
            const p = this.point(i), view = this.art(p.x, p.y, 'crate', 71); this.boardView.add(view);
            if (l.plates.includes(i)) this.boardView.add(this.add.circle(p.x + 21, p.y - 22, 7, 0xffdf79).setStrokeStyle(2, 0xfff1ae));
            if (previous && !previous.boxes.includes(i)) {
                const from = previous.boxes.find(j => !s.boxes.includes(j));
                if (from !== undefined) { const old = this.point(from); view.setPosition(old.x, old.y); this.tweens.add({ targets: view, x: p.x, y: p.y, duration: 110 }); }
            }
        });
        const p = this.point(s.player); this.hero = this.art(p.x, p.y - 5, 'fox', 74); this.boardView.add(this.hero);
        if (previous) {
            const old = this.point(previous.player);
            if (events.includes('portal')) { this.hero.setAlpha(.25); this.tweens.add({ targets: this.hero, alpha: 1, duration: 130 }); }
            else { this.hero.setPosition(old.x, old.y - 5); this.tweens.add({ targets: this.hero, x: p.x, y: p.y - 5, duration: 110 }); }
        }
    }
    tapTile(index) {
        if (this.mode !== 'playing') return;
        const direction = Object.keys(DIRECTIONS).find(d => adjacent(this.session.level, this.session.state.player, d) === index);
        if (direction) this.move(direction); else this.feedback.setText('點狐狸旁邊的一格，或用右邊箭頭移動。');
    }
    refreshStats() {
        const s = this.session, l = s.level;
        this.plateText.setText(l.plates.length ? `底座 ${l.plates.filter(i => s.state.boxes.includes(i)).length} / ${l.plates.length}` : '本關只要找到出口');
        this.gemText.setText(`水晶 ${gemCount(s.state)} / ${l.gems.length}`);
        this.keyText.setText(l.cells.includes('K') ? s.state.key ? '鑰匙到手' : '還沒拿到' : '本關不需要');
        this.moveText.setText(String(s.moves)); this.undoButton.setAlpha(s.history.length ? 1 : .48);
        this.hintButton.label.setText(s.hintsUsed >= 2 ? '下一步提示 · H' : s.hintsUsed === 1 ? '再想一想 · H' : '分段提示 · H');
    }
    cancelHint() { this.hintJob = null; this.hintArrow?.destroy(); this.hintArrow = null; this.hintRemaining = 0; }
    move(direction) {
        if (this.mode !== 'playing' || this.busy > 0 || !DIRECTIONS[direction]) return;
        const previous = this.session.state, result = this.session.move(direction);
        this.cancelHint();
        if (!result.ok) { this.feedback.setText(result.reason); return; }
        this.busy = .14; this.drawBoard(previous, result.events); this.refreshStats();
        const messages = { push: '推箱前，記得幫自己留一條繞路。', key: '鑰匙到手！金色鎖門已經打開。', gem: '找到水晶！也別忘了通往出口的路。',
            switch: this.session.state.bridge ? '橋接通了！再踩一次開關會關閉。' : '橋關閉了。需要時可以再踩開關。',
            portal: '傳送成功！離開圓環，再走進去就能回到另一邊。', 'exit-locked': '還有底座沒點亮，先幫木箱找到位置。',
            corner: '木箱卡進石牆角了。按「撤回一步」就能救回來！' };
        this.feedback.setText(result.events.map(e => messages[e]).filter(Boolean).at(-1) || '慢慢規劃，不用趕時間。');
        if (result.events.some(e => ['gem', 'key'].includes(e))) this.tone('correct');
        else if (result.events.includes('push')) this.tone('send');
        if (this.session.won) this.finishLevel();
    }
    undoMove() {
        if (this.mode !== 'playing' || this.busy > 0) return;
        this.cancelHint();
        if (!this.session.undo()) { this.feedback.setText('現在就是起點，還沒有可以撤回的步驟。'); return; }
        this.tweens.killAll(); this.drawBoard(); this.refreshStats(); this.feedback.setText('回到上一步了，試試另一條路。');
    }
    requestHint() {
        if (this.mode !== 'playing' || this.busy > 0 || this.hintJob) return;
        this.cancelHint(); const s = this.session; s.hintsUsed++; this.refreshStats();
        if (s.hintsUsed <= 2) { this.feedback.setText(s.level.hints[s.hintsUsed - 1]); return; }
        this.hintJob = createSolver(s.level, s.state); this.hintFallback = false;
        this.feedback.setText('正在找一條能收齊水晶的路……你仍可移動或撤回。');
    }
    update(_time, delta) {
        if (this.mode !== 'playing') return;
        const dt = Math.max(0, Math.min(delta / 1000, .05)); this.busy = Math.max(0, this.busy - dt);
        if (this.hintRemaining > 0) { this.hintRemaining -= dt; if (this.hintRemaining <= 0) this.cancelHint(); }
        if (!this.hintJob) return;
        const status = this.hintJob.tick(240);
        if (status === 'searching') return;
        if (status === 'no-solution' && !this.hintFallback) {
            this.hintFallback = true; this.hintJob = createSolver(this.session.level, this.session.state, { allGems: false }); return;
        }
        if (status === 'solved') {
            const direction = this.hintJob.path[0];
            if (direction) {
                const p = this.point(adjacent(this.session.level, this.session.state.player, direction));
                this.hintArrow = this.text(p.x, p.y, DIRECTIONS[direction].arrow, 45, '#ffde71').setStroke('#344b32', 6).setDepth(10);
                this.hintRemaining = 7;
                this.feedback.setText(this.hintFallback ? `這個局面可以先通關。下一步往${DIRECTIONS[direction].label}；想收齊水晶可撤回。` : `下一步往${DIRECTIONS[direction].label}，再想想為什麼。`);
            }
        } else if (status === 'no-solution') this.feedback.setText('這個局面已經走不通。撤回幾步，或重新挑戰。');
        else this.feedback.setText('這個局面還沒找到提示路線。可以先撤回幾步再試，沒有判定失敗。');
        this.hintJob = null;
    }
    dialog(title, body) {
        this.overlay?.destroy(); const o = this.add.container(0, 0).setDepth(100); this.overlay = o;
        o.add([this.add.rectangle(640, 360, 1280, 720, 0x081c19, .82).setInteractive(),
            this.panel(640, 354, 846, 536, 0x183c33, 0x9a9c65), this.text(640, 148, title, 32, '#ffe2a0'),
            this.text(640, 250, body, 23).setWordWrapWidth(766)]);
        return o;
    }
    showRules(first = false) {
        if (!['select', 'intro'].includes(this.mode)) return;
        this.mode = 'intro'; const o = this.dialog('用腦袋探險，用撤回放心嘗試', '方向鍵或右側箭頭移動，木箱只能推、不能拉。\n把箱子放上所有圓形底座，再走進發光樹門。');
        o.add([this.art(381, 371, 'fox', 86), this.art(502, 371, 'crate', 78), this.text(577, 371, '→', 34, '#ffe2a0'),
            this.add.circle(647, 371, 28, 0x9cad65).setStrokeStyle(5, 0xffdf91), this.art(810, 371, 'exit', 100)]);
        o.add(this.text(640, 454, '水晶與步數是額外挑戰；卡住可按 Z 撤回、H 看分段提示。', 20));
        o.add(this.button(640, 550, 340, 60, first ? '選一張地圖，出發！' : '回到關卡地圖', () => {
            this.seenIntro = true; this.overlay.destroy(); this.overlay = null; this.mode = 'select';
        }));
    }
    pauseGame() {
        if (this.mode !== 'playing') return;
        this.mode = 'paused'; this.tweens.pauseAll(); this.stopTones();
        const o = this.dialog('休息一下，地圖會等你', '圓形底座控制綠色閘門；鑰匙開啟金色鎖門。\n踩橘色開關切換橋；紫色圓環是成對傳送陣。\n木箱只能推上空地與底座，不能搭橋或傳送。');
        o.add(this.button(640, 407, 300, 58, '繼續探險', () => this.resumeGame()));
        o.add(this.button(490, 517, 240, 56, '返回選關', () => { this.tweens.resumeAll(); this.showSelection(); }, 0x345b47));
        o.add(this.button(785, 517, 240, 56, '返回遊戲列表', () => this.leave(), 0x345b47));
    }
    resumeGame() {
        if (this.mode !== 'paused') return;
        this.overlay?.destroy(); this.overlay = null; this.mode = 'playing'; this.tweens.resumeAll();
    }
    confirmRestart() {
        if (this.mode !== 'playing') return;
        this.mode = 'confirm'; this.tweens.pauseAll(); this.stopTones();
        const o = this.dialog('重新挑戰這一關？', '這一關會回到起點，步數和提示重新計算。\n已經獲得的本次星星會保留。');
        o.add(this.button(490, 450, 240, 60, '繼續原本的路', () => { this.mode = 'paused'; this.resumeGame(); }));
        o.add(this.button(790, 450, 240, 60, '重新挑戰', () => { this.tweens.resumeAll(); this.startLevel(this.levelIndex); }, 0x856536, '#fff4c5'));
    }
    finishLevel() {
        this.mode = 'finished'; this.cancelHint(); this.tone('finish');
        const s = this.session, medals = s.medals(), stars = medals.filter(Boolean).length, previous = this.records[this.levelIndex];
        this.records[this.levelIndex] = { stars: Math.max(previous?.stars || 0, stars), bestMoves: Math.min(previous?.bestMoves ?? Infinity, s.moves) };
        const o = this.dialog(this.levelIndex === 17 ? '森林守門人，挑戰成功！' : '路線解開了！', `${s.level.title}　｜　${s.moves} 步 · 推箱 ${s.pushes} 次\n${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
        o.add(this.text(640, 348, `${medals[0] ? '✓' : '○'} 成功通關　　 ${medals[1] ? '✓' : '○'} 水晶收齊`, 23));
        o.add(this.text(640, 394, `${medals[2] ? '✓' : '○'} ${s.level.par} 步內完成，且沒有使用提示`, 22));
        o.add(this.button(414, 514, 194, 60, '再挑戰一次', () => this.startLevel(this.levelIndex), 0x856536, '#fff4c5'));
        o.add(this.button(640, 514, 194, 60, '返回選關', () => this.showSelection(), 0x345b47));
        o.add(this.button(866, 514, 194, 60, this.levelIndex < 17 ? '下一關 →' : '看關卡星星', () => this.levelIndex < 17 ? this.startLevel(this.levelIndex + 1) : this.showSelection()));
        o.add(this.text(640, 579, '撤回不扣星，慢慢想也能完成；星星只記在本次遊玩。', 18, '#c3dbbf'));
    }
    leave() {
        this.hintJob = null; this.stopTones(); this.tweens.resumeAll();
        if (this.scene.manager.keys[this.returnScene]) this.scene.start(this.returnScene);
    }
}
