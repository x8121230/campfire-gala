import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import ConfigManager from '../systems/ConfigManager.js';

const GOLD_GRASS = {
    goldenGrass: {
        id: 'goldenGrass',
        name: '黃金草',
        texture: 'q_gold_golden',
        color: 0xf6c94a,
        description: '在陽光下閃閃發亮的金色草叢。'
    },
    rainbowGrass: {
        id: 'rainbowGrass',
        name: '彩虹草',
        texture: 'q_gold_rainbow',
        color: 0xe58be8,
        description: '露珠會映出七彩光芒的夢幻草叢。'
    },
    mysteryGrass: {
        id: 'mysteryGrass',
        name: '神祕草',
        texture: 'q_gold_mystery',
        color: 0x78b9e8,
        description: '葉片會隨著森林心情變色的稀有草叢。'
    }
};

const ACHIEVEMENTS = {
    bush_first_clear: '第一次尋寶',
    bush_three_clears: '旗幟小高手',
    bush_no_hint: '森林推理家',
    bush_perfect: '完美小偵探',
    bush_no_flag: '不用旗也知道',
    gold_grass_collector: '金草收藏家'
};

const BUSH_ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS);
const ALL_ACHIEVEMENT_DECORATION_ID = 'item_decoration_golden_bug_house_bush';
const ALL_ACHIEVEMENT_DECORATION_TEXTURE = 'q_golden_bug_house';

export default class BushMinesweeper extends Phaser.Scene {
    constructor() {
        super('BushExplore');
    }

    init(data = {}) {
        this.stageId = data.stageId || 'bush_01';
        this.stageData = data.stageData || {};
        this.returnScene = data.returnScene || 'WorldMap';
        this.mapID = data.mapID || data.mapId || '01';
        this.testMode = data.testMode === true;
    }

    create() {
        this.gameConfig = this.registry.get('game_config') || ConfigManager.getConfig();
        this.bushConfig = this.gameConfig.bushMinesweeper;
        this.migrateNoFlagAchievementRuleV32();

        const board = this.bushConfig.board;
        const maxBoardSize = 492;
        this.ROWS = board.rows;
        this.COLS = board.cols;
        this.MINE_COUNT = board.dangerCount;
        this.MISTAKE_LIMIT = board.mistakeLimit;
        this.HINT_LIMIT = board.hintCount;
        this.SOLVER_ATTEMPTS = board.solverAttempts;
        this.CELL_SIZE = Math.floor(Math.min(82, maxBoardSize / Math.max(this.ROWS, this.COLS)));
        this.BOARD_X = 75 + (maxBoardSize - this.COLS * this.CELL_SIZE) / 2;
        this.BOARD_Y = 145 + (maxBoardSize - this.ROWS * this.CELL_SIZE) / 2;

        this.mode = 'dig';
        this.boardReady = false;
        this.inputLocked = false;
        this.gameOver = false;
        this.mistakesLeft = this.MISTAKE_LIMIT;
        this.hintsLeft = this.HINT_LIMIT;
        this.hintsUsed = 0;
        this.dangersHit = 0;
        this.manualFlagPlacements = 0;
        this.clearedWithoutFlags = false;
        this.cells = [];

        this.createBackground();
        this.createHeader();
        this.createBoardFrame();
        this.createSidePanel();
        this.createBoard();
        this.startBgm();
        this.updateHUD();
        this.setGuideMessage('先用小鏟子挖一格，第一格一定安全！');
    }

    createBackground() {
        const bg = this.add.image(640, 360, 'bg_bush_forest');
        bg.setDisplaySize(1280, 720);
        bg.setTint(0xcce3c5);

        this.add.rectangle(640, 360, 1280, 720, 0x153e2d, 0.18);
        this.add.rectangle(640, 54, 1280, 108, 0x174b36, 0.94);
    }

    createHeader() {
        const returnLabel = this.returnScene === 'MiniGameHub' ? '← 樂園' : '← 地圖';
        this.makeSmallButton(65, 53, 96, 50, returnLabel, 0xf6e6b7, 0x6f532f, () => {
            if (this.gameOver && this.resultContainer) this.resultContainer.destroy();
            AudioSystem.stopBgm(this);
            this.scene.start(this.returnScene, { mapID: this.mapID });
        });

        this.add.text(640, 35, '草叢探險①　尋找金色草叢', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#fff7cf',
            stroke: '#20452e',
            strokeThickness: 6
        }).setOrigin(0.5);

        const dailyHeader = this.testMode
            ? '測試模式不會寫入正式進度！'
            : (this.isDailyGrassAvailable()
                ? '今日首次成功可發現金色草叢！'
                : '今日金草已領取，繼續挑戰高分！');
        this.add.text(640, 78, `看懂數字、找出所有安全草叢・旗子可自由選用・${dailyHeader}`, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '20px',
            color: '#e8f8dc'
        }).setOrigin(0.5);

        this.makeSmallButton(1058, 53, 142, 50, '🌿 圖鑑', 0xf3cf67, 0x765726, () => {
            this.playUiSound();
            this.showGoldEncyclopedia();
        });

        this.makeSmallButton(1190, 53, 100, 50, '？玩法', 0xa8dc72, 0x315f2b, () => {
            this.playUiSound();
            this.showHowToPlay();
        });
    }

    createBoardFrame() {
        const boardW = this.COLS * this.CELL_SIZE + 34;
        const boardH = this.ROWS * this.CELL_SIZE + 34;
        const centerX = this.BOARD_X + (this.COLS * this.CELL_SIZE) / 2;
        const centerY = this.BOARD_Y + (this.ROWS * this.CELL_SIZE) / 2;

        const shadow = this.add.graphics();
        shadow.fillStyle(0x071d14, 0.30);
        shadow.fillRoundedRect(
            centerX - boardW / 2 + 8,
            centerY - boardH / 2 + 10,
            boardW,
            boardH,
            28
        );

        const frame = this.add.graphics();
        frame.fillStyle(0x2f6941, 1);
        frame.lineStyle(6, 0xf2d984, 1);
        frame.fillRoundedRect(centerX - boardW / 2, centerY - boardH / 2, boardW, boardH, 28);
        frame.strokeRoundedRect(centerX - boardW / 2, centerY - boardH / 2, boardW, boardH, 28);

        frame.fillStyle(0x9ac767, 0.48);
        frame.fillRoundedRect(
            centerX - boardW / 2 + 13,
            centerY - boardH / 2 + 13,
            boardW - 26,
            boardH - 26,
            18
        );
    }

    createSidePanel() {
        const x = 914;
        const y = 396;
        const width = 510;
        const height = 522;

        const shadow = this.add.graphics();
        shadow.fillStyle(0x0b271b, 0.25);
        shadow.fillRoundedRect(x - width / 2 + 8, y - height / 2 + 10, width, height, 28);

        const panel = this.add.graphics();
        panel.fillStyle(0xfffbec, 0.97);
        panel.lineStyle(5, 0x6f9b4f, 1);
        panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, 28);
        panel.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 28);

        this.add.text(x, 164, '森林小偵探', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#31572c'
        }).setOrigin(0.5);

        this.add.text(x, 203, `${this.ROWS} × ${this.COLS} 草叢　藏著 ${this.MINE_COUNT} 個危險`, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '20px',
            color: '#6f745d'
        }).setOrigin(0.5);

        this.add.image(765, 260, 'q_danger').setDisplaySize(
            this.bushConfig.visuals.sideDangerSize,
            this.bushConfig.visuals.sideDangerSize
        );
        this.foundText = this.add.text(808, 260, '找到危險：0', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#325f48'
        }).setOrigin(0, 0.5);

        this.chanceText = this.add.text(765, 316, '', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#8c4945'
        }).setOrigin(0, 0.5);

        this.hintText = this.add.text(765, 360, '', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#7c6425'
        }).setOrigin(0, 0.5);

        this.digButton = this.makeModeButton(785, 432, 190, 72, '⛏', '挖草', 'dig');
        this.flagButton = this.makeModeButton(1039, 432, 190, 72, null, '插旗', 'flag', 'q_flag');

        this.hintButton = this.makeWideButton(914, 520, 420, 66, '✨ 請小精靈提示', () => {
            this.useHint();
        });

        const bubble = this.add.graphics();
        bubble.fillStyle(0xeaf4d8, 1);
        bubble.lineStyle(3, 0x9dbd73, 1);
        bubble.fillRoundedRect(712, 568, 404, 86, 18);
        bubble.strokeRoundedRect(712, 568, 404, 86, 18);

        this.guideText = this.add.text(914, 611, '', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '20px',
            color: '#40563a',
            align: 'center',
            wordWrap: { width: 370 },
            lineSpacing: 4
        }).setOrigin(0.5);

        this.add.text(914, 676, '每局都能重玩　・　不消耗體力　・　不計排名', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '17px',
            color: '#eaf7de',
            stroke: '#244e37',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createBoard() {
        for (let row = 0; row < this.ROWS; row += 1) {
            this.cells[row] = [];

            for (let col = 0; col < this.COLS; col += 1) {
                const x = this.BOARD_X + col * this.CELL_SIZE + this.CELL_SIZE / 2;
                const y = this.BOARD_Y + row * this.CELL_SIZE + this.CELL_SIZE / 2;
                const cell = {
                    row,
                    col,
                    x,
                    y,
                    mine: false,
                    number: 0,
                    revealed: false,
                    flagged: false,
                    hit: false,
                    view: {}
                };

                cell.view.bg = this.add.graphics();
                cell.view.bush = this.add.image(x, y + 2, 'q_bush');
                cell.view.flag = this.add.image(x, y - 1, 'q_flag').setVisible(false);
                cell.view.danger = this.add.image(x, y + 1, 'q_danger').setVisible(false);
                cell.view.bushScale = this.bushConfig.visuals.bushSize / cell.view.bush.width;
                cell.view.flagScale = this.bushConfig.visuals.flagSize / cell.view.flag.width;
                cell.view.dangerScale = this.bushConfig.visuals.dangerSize / cell.view.danger.width;
                cell.view.bush.setScale(cell.view.bushScale);
                cell.view.flag.setScale(cell.view.flagScale);
                cell.view.danger.setScale(cell.view.dangerScale);
                cell.view.number = this.add.text(x, y, '', {
                    fontFamily: 'Arial Rounded MT Bold, Microsoft JhengHei, Arial',
                    fontSize: '39px',
                    fontStyle: 'bold',
                    stroke: '#fff8dc',
                    strokeThickness: 5
                }).setOrigin(0.5).setVisible(false);

                cell.view.zone = this.add.zone(x, y, this.CELL_SIZE - 7, this.CELL_SIZE - 7)
                    .setInteractive({ useHandCursor: true });

                cell.view.zone.on('pointerdown', () => this.onCellPressed(cell));
                cell.view.zone.on('pointerover', () => this.onCellHover(cell, true));
                cell.view.zone.on('pointerout', () => this.onCellHover(cell, false));

                this.cells[row][col] = cell;
                this.renderCell(cell);
            }
        }
    }

    drawCellBackground(cell, fill, stroke, alpha = 1) {
        const size = this.CELL_SIZE - 8;
        const g = cell.view.bg;
        g.clear();
        g.fillStyle(fill, alpha);
        g.lineStyle(3, stroke, 1);
        g.fillRoundedRect(cell.x - size / 2, cell.y - size / 2, size, size, 14);
        g.strokeRoundedRect(cell.x - size / 2, cell.y - size / 2, size, size, 14);
    }

    renderCell(cell) {
        const { bush, flag, danger, number } = cell.view;

        if (!cell.revealed) {
            this.drawCellBackground(cell, cell.flagged ? 0xffedaa : 0xdff1aa, cell.flagged ? 0xc18a2e : 0x507a3b);
            bush.setVisible(!cell.flagged).setAlpha(1).setScale(cell.view.bushScale);
            flag.setVisible(cell.flagged).setAlpha(1).setScale(cell.view.flagScale);
            danger.setVisible(false);
            number.setVisible(false);
            return;
        }

        bush.setVisible(false);
        flag.setVisible(false);

        if (cell.mine) {
            this.drawCellBackground(cell, 0xffded2, 0xd0695d);
            danger.setVisible(true).setAlpha(1).setScale(cell.view.dangerScale);
            number.setVisible(false);
            return;
        }

        this.drawCellBackground(cell, 0xfff0c7, 0xb79255);
        danger.setVisible(false);

        if (cell.number > 0) {
            const colors = ['#496f43', '#2779c4', '#3c9a66', '#e07a2f', '#8b55b5', '#c44b66', '#277d82'];
            number.setText(String(cell.number));
            number.setColor(colors[cell.number] || '#684933');
            number.setVisible(true);
        } else {
            number.setVisible(false);
        }
    }

    onCellHover(cell, hovering) {
        if (this.inputLocked || this.gameOver || cell.revealed) return;
        const target = cell.flagged ? cell.view.flag : cell.view.bush;
        const baseScale = cell.flagged ? cell.view.flagScale : cell.view.bushScale;
        this.tweens.killTweensOf(target);
        this.tweens.add({
            targets: target,
            scale: hovering ? baseScale * 1.08 : baseScale,
            duration: 100,
            ease: 'Sine.Out'
        });
    }

    onCellPressed(cell) {
        if (this.inputLocked || this.gameOver) return;
        this.playUiSound();

        if (this.mode === 'flag') {
            this.toggleFlag(cell);
            return;
        }

        this.digCell(cell);
    }

    digCell(cell) {
        if (cell.flagged) {
            this.setGuideMessage('這格插著旗子，先切換插旗模式把旗子拔起來。');
            this.wiggle(cell.view.flag);
            return;
        }

        if (cell.revealed) return;

        if (!this.boardReady) {
            this.generateSolvableBoard(cell);
            this.boardReady = true;
        }

        if (cell.mine) {
            this.revealDanger(cell);
            return;
        }

        this.playDigSound();
        const revealList = this.collectFloodReveal(cell);
        this.animateRevealList(revealList);
    }

    toggleFlag(cell) {
        if (cell.revealed) {
            this.setGuideMessage('已挖開的格子不能插旗喔。');
            return;
        }

        if (!this.boardReady) {
            this.setGuideMessage('先挖第一格，再依照數字插旗。');
            this.wiggle(cell.view.bush);
            return;
        }

        if (!cell.flagged && this.getMarkedCount() >= this.MINE_COUNT) {
            this.setGuideMessage(`${this.MINE_COUNT} 個位置都標記了，拔掉一面旗再調整。`);
            return;
        }

        cell.flagged = !cell.flagged;
        this.renderCell(cell);

        if (cell.flagged) {
            this.manualFlagPlacements += 1;
            cell.view.flag.setScale(cell.view.flagScale * 0.2);
            this.tweens.add({
                targets: cell.view.flag,
                scale: cell.view.flagScale,
                duration: 260,
                ease: 'Back.Out'
            });
            this.setGuideMessage('旗子插好了！再看看周圍的數字。');
        } else {
            this.setGuideMessage('旗子收回來了，可以重新判斷。');
        }

        this.updateHUD();
        this.checkDangerGoal();
    }

    revealDanger(cell) {
        cell.revealed = true;
        cell.hit = true;
        this.mistakesLeft = Math.max(0, this.mistakesLeft - 1);
        this.dangersHit += 1;
        this.renderCell(cell);
        this.playWrongSound();

        cell.view.danger.setScale(cell.view.dangerScale * 0.25);
        this.tweens.add({
            targets: cell.view.danger,
            scale: cell.view.dangerScale,
            duration: 320,
            ease: 'Back.Out'
        });

        this.cameras.main.shake(180, 0.006);
        this.updateHUD();

        if (this.mistakesLeft <= 0) {
            this.gameOver = true;
            this.inputLocked = true;
            this.setGuideMessage('勇氣用完了！這一局挑戰失敗。');

            const failureText = this.add.text(640, 360, '挑戰失敗', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '54px',
                fontStyle: 'bold',
                color: '#fff8e8',
                stroke: '#a23f3f',
                strokeThickness: 10
            }).setOrigin(0.5).setDepth(19000).setScale(0.68).setAlpha(0);

            this.tweens.add({
                targets: failureText,
                alpha: 1,
                scale: 1,
                duration: 240,
                ease: 'Back.Out'
            });
            this.time.delayedCall(350, () => this.finishLose());
            return;
        }

        this.setGuideMessage(`發現一個刺刺球！還有 ${this.mistakesLeft} 次機會。`);
        this.checkDangerGoal();
    }

    collectFloodReveal(startCell) {
        const queue = [startCell];
        const seen = new Set();
        const result = [];

        while (queue.length > 0) {
            const cell = queue.shift();
            const key = this.keyOf(cell);
            if (seen.has(key) || cell.mine || cell.flagged || cell.revealed) continue;

            seen.add(key);
            result.push(cell);

            if (cell.number === 0) {
                this.getNeighbors(cell.row, cell.col).forEach((next) => {
                    if (!seen.has(this.keyOf(next)) && !next.mine && !next.flagged) queue.push(next);
                });
            }
        }

        return result;
    }

    animateRevealList(cells) {
        if (cells.length === 0) return;
        this.inputLocked = true;

        cells.forEach((cell, index) => {
            const delay = Math.min(index, 14) * 24;
            this.time.delayedCall(delay, () => {
                cell.revealed = true;
                this.renderCell(cell);
                cell.view.bg.setAlpha(0.35);
                cell.view.number.setScale(0.6);
                this.tweens.add({
                    targets: [cell.view.bg, cell.view.number],
                    alpha: 1,
                    scale: 1,
                    duration: 170,
                    ease: 'Back.Out'
                });
            });
        });

        const totalDelay = Math.min(cells.length - 1, 14) * 24 + 190;
        this.time.delayedCall(totalDelay, () => {
            this.inputLocked = false;
            const last = cells[cells.length - 1];
            if (last.number > 0) {
                this.setGuideMessage(`數字 ${last.number}：周圍有 ${last.number} 個危險。`);
            } else {
                this.setGuideMessage('這一帶很安全！空白格會一起打開。');
            }
            this.checkSafeBoardComplete();
        });
    }

    useHint() {
        if (this.inputLocked || this.gameOver) return;
        this.playUiSound();

        if (this.hintsLeft <= 0) {
            this.setGuideMessage('這局的小精靈已經幫忙過囉。');
            this.wiggle(this.hintButton.container);
            return;
        }

        if (!this.boardReady) {
            this.setGuideMessage('先挖第一格，小精靈才知道要往哪裡飛。');
            return;
        }

        const candidates = this.getAllCells().filter((cell) => !cell.mine && !cell.revealed && !cell.flagged);
        if (candidates.length === 0) return;

        candidates.sort((a, b) => a.number - b.number);
        const safePool = candidates.filter((cell) => cell.number === candidates[0].number);
        const picked = Phaser.Utils.Array.GetRandom(safePool);

        this.hintsLeft -= 1;
        this.hintsUsed += 1;
        this.updateHUD();
        this.setGuideMessage('小精靈找到一叢安全的草！');

        const sparkle = this.createSparkleStar(picked.x, picked.y, 30, 0xffdf4f).setAlpha(0);
        this.tweens.add({
            targets: sparkle,
            alpha: 1,
            scale: { from: 0.35, to: 1.2 },
            angle: 120,
            duration: 500,
            yoyo: true,
            onComplete: () => {
                sparkle.destroy();
                this.playDigSound();
                this.animateRevealList(this.collectFloodReveal(picked));
            }
        });
    }

    checkDangerGoal() {
        if (!this.boardReady || this.gameOver) return;
        if (this.getMarkedCount() < this.MINE_COUNT) return;

        const correct = this.getAllCells().every((cell) => {
            if (cell.mine) return cell.hit || cell.flagged;
            return !cell.flagged;
        });

        if (!correct) {
            this.setGuideMessage('有些旗子插錯位置了，再看看數字調整一下。');
            this.wiggle(this.flagButton.container);
            return;
        }

        const hiddenSafe = this.getAllCells().some((cell) => !cell.mine && !cell.revealed);
        if (hiddenSafe) {
            this.setGuideMessage('危險都標好了！把剩下的安全草叢挖開就能通關。');
            return;
        }

        this.finishWin();
    }

    checkSafeBoardComplete() {
        if (!this.boardReady || this.gameOver) return;
        const hiddenSafe = this.getAllCells().some((cell) => !cell.mine && !cell.revealed);
        if (!hiddenSafe) {
            this.finishWin();
        }
    }

    finishWin() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.inputLocked = true;
        // 「不用旗也知道」不只是沒插旗，也必須真的避開所有危險。
        this.clearedWithoutFlags = this.manualFlagPlacements === 0 && this.dangersHit === 0;
        this.playCorrectSound();
        this.setGuideMessage('所有安全草叢都找到了！危險位置正在亮相。');

        this.autoMarkRemainingDangers(() => this.completeWinRewards());
    }

    autoMarkRemainingDangers(onComplete) {
        const remaining = this.getAllCells().filter((cell) => cell.mine && !cell.hit && !cell.flagged);

        if (remaining.length === 0) {
            this.time.delayedCall(180, onComplete);
            return;
        }

        remaining.forEach((cell, index) => {
            this.time.delayedCall(index * 75, () => {
                cell.flagged = true;
                cell.autoMarked = true;
                this.renderCell(cell);
                cell.view.flag.setScale(cell.view.flagScale * 0.25);
                this.tweens.add({
                    targets: cell.view.flag,
                    scale: cell.view.flagScale,
                    duration: 260,
                    ease: 'Back.Out'
                });
            });
        });

        const revealDuration = (remaining.length - 1) * 75 + 360;
        this.time.delayedCall(revealDuration, () => {
            this.updateHUD();
            onComplete();
        });
    }

    completeWinRewards() {

        const previousStats = this.getBushStats();
        const dailyGrassAvailable = this.isDailyGrassAvailable(previousStats);
        const discovery = dailyGrassAvailable ? this.pickGoldGrassDiscovery() : null;
        const baseScore = this.calculateScore();
        const previouslyUnlocked = previousStats.goldenBugUnlocked || this.hasAllBushAchievements();
        const goldenBug = this.evaluateGoldenBugEncounter({
            baseScore,
            dailyGrassAvailable,
            unlocked: previouslyUnlocked,
            missStreak: previousStats.goldenBugMissStreak
        });
        const totalScore = baseScore + goldenBug.bonusScore;
        const progress = this.saveWinProgress({
            discovery,
            baseScore,
            totalScore,
            dailyGrassAvailable,
            goldenBug
        });

        const finishPresentation = () => {
            const showResult = () => this.showWinResult({
                discovery,
                baseScore,
                totalScore,
                goldenBug,
                progress
            });

            if (progress.newlyUnlocked.length > 0 || progress.fullRewardUnlocked) {
                this.showAchievementCelebration(progress, showResult);
            } else {
                showResult();
            }
        };

        if (discovery) {
            const hostCell = this.pickGoldHostCell();
            this.setGuideMessage(`${discovery.data.name}要出現了！`);
            this.playGoldGrowth(hostCell, discovery.data, finishPresentation);
        } else {
            this.setGuideMessage(goldenBug.triggered ? '金光一閃……是黃金蟲！' : '完成！來看看這次的分數。');
            this.time.delayedCall(360, finishPresentation);
        }
    }

    finishLose() {
        if (this.resultContainer) return;
        this.gameOver = true;

        const stats = this.getBushStats();
        stats.playCount += 1;
        this.setBushStats(stats);
        SaveSystem.saveFromRegistry(this.registry);

        this.showResultShell({
            success: false,
            title: '勇氣用完了！',
            subtitle: '本局失敗・未計分\n不會消耗今日金草機會\n看看數字，再挑戰一次吧！',
            accent: 0xe58a70,
            iconTexture: 'q_danger'
        });
    }

    pickGoldGrassDiscovery() {
        const owned = this.getGoldGrassCollection();
        const stats = this.getBushStats();
        const allIds = Object.keys(GOLD_GRASS);
        const missing = allIds.filter((grassId) => !owned.includes(grassId));
        const pityLimit = this.bushConfig.goldGrass.duplicatePity;
        const usedPity = missing.length > 0 && stats.duplicateStreak >= pityLimit;
        const id = this.rollWeightedGrass(usedPity ? missing : allIds);

        return {
            id,
            data: GOLD_GRASS[id],
            isNew: !owned.includes(id),
            usedPity
        };
    }

    isDailyGrassAvailable(stats = this.getBushStats()) {
        return stats.dailyGrassDate !== this.getTodayKey();
    }

    hasAllBushAchievements() {
        const achievements = this.registry.get('achievements') || [];
        return BUSH_ACHIEVEMENT_IDS.every((id) => achievements.includes(id));
    }

    evaluateGoldenBugEncounter({ baseScore, dailyGrassAvailable, unlocked, missStreak = 0 }) {
        const config = this.bushConfig.hiddenGoldenBug || {};
        const qualifying = config.enabled === true
            && unlocked === true
            && dailyGrassAvailable === false
            && baseScore >= this.bushConfig.score.maxScore;

        if (!qualifying) {
            return { qualifying: false, triggered: false, usedPity: false, bonusScore: 0 };
        }

        const usedPity = Number(missStreak) >= Number(config.pityMisses || 0);
        const triggered = usedPity || Math.random() * 100 < Number(config.chancePercent || 0);
        return {
            qualifying: true,
            triggered,
            usedPity,
            bonusScore: triggered ? Number(config.bonusScore || 0) : 0
        };
    }

    rollWeightedGrass(candidates) {
        const rates = this.bushConfig.goldGrass.rates;
        const total = candidates.reduce((sum, id) => sum + Number(rates[id] || 0), 0);
        if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)];

        let roll = Math.random() * total;
        for (const id of candidates) {
            roll -= Number(rates[id] || 0);
            if (roll < 0) return id;
        }
        return candidates[candidates.length - 1];
    }

    calculateScore() {
        const score = this.bushConfig.score;
        const dangerBonus = Math.max(
            0,
            score.noDangerBonus - this.dangersHit * score.dangerPenaltyPerHit
        );
        const noHintBonus = this.hintsUsed === 0 ? score.noHintBonus : 0;
        return Phaser.Math.Clamp(score.clearPoints + dangerBonus + noHintBonus, 0, score.maxScore);
    }

    saveWinProgress({ discovery, baseScore, totalScore, dailyGrassAvailable, goldenBug }) {
        const owned = this.getGoldGrassCollection();
        if (discovery && !owned.includes(discovery.id)) owned.push(discovery.id);
        this.registry.set('gold_grass_encyclopedia', owned);

        const stats = this.getBushStats();
        stats.playCount += 1;
        stats.clearCount += 1;
        stats.bestScore = Math.max(stats.bestScore, totalScore);
        stats.bestBaseScore = Math.max(stats.bestBaseScore, baseScore);
        if (discovery) stats.duplicateStreak = discovery.isNew ? 0 : stats.duplicateStreak + 1;
        if (dailyGrassAvailable) stats.dailyGrassDate = this.getTodayKey();
        if (this.hintsUsed === 0) stats.noHintClearCount += 1;
        if (baseScore >= this.bushConfig.score.maxScore) stats.perfectClearCount += 1;
        if (this.clearedWithoutFlags) stats.noFlagClearCount += 1;

        if (goldenBug.qualifying) {
            if (goldenBug.triggered) {
                stats.goldenBugFindCount += 1;
                stats.goldenBugMissStreak = 0;
                stats.goldenBugDiscovered = true;
            } else {
                stats.goldenBugMissStreak += 1;
            }
        }

        const today = this.getTodayKey();
        if (stats.dailyScoreDate !== today) {
            stats.dailyScoreDate = today;
            stats.dailyBestScore = 0;
        }
        stats.dailyBestScore = Math.max(stats.dailyBestScore, totalScore);

        const achievements = [...(this.registry.get('achievements') || [])];
        const newlyUnlocked = [];
        const unlock = (id) => {
            if (!achievements.includes(id)) {
                achievements.push(id);
                newlyUnlocked.push(ACHIEVEMENTS[id]);
            }
        };

        unlock('bush_first_clear');
        if (stats.clearCount >= this.bushConfig.achievements.clearCountTarget) unlock('bush_three_clears');
        if (stats.noHintClearCount >= this.bushConfig.achievements.noHintClearTarget) unlock('bush_no_hint');
        if (stats.perfectClearCount >= this.bushConfig.achievements.perfectClearTarget) unlock('bush_perfect');
        if (stats.noFlagClearCount >= 1) unlock('bush_no_flag');
        if (owned.length >= Object.keys(GOLD_GRASS).length) unlock('gold_grass_collector');
        this.registry.set('achievements', achievements);

        let fullRewardUnlocked = false;
        if (BUSH_ACHIEVEMENT_IDS.every((id) => achievements.includes(id))) {
            stats.goldenBugUnlocked = true;
            if (!stats.fullAchievementRewardClaimed) {
                stats.fullAchievementRewardClaimed = true;
                fullRewardUnlocked = true;
            }
            this.grantAllAchievementDecoration();
        }

        this.setBushStats(stats);
        StageManager.completeStage(this.registry, this.stageId, totalScore, 0);
        SaveSystem.saveFromRegistry(this.registry);
        return { newlyUnlocked, fullRewardUnlocked, stats };
    }

    grantAllAchievementDecoration() {
        const ownedItems = [...(this.registry.get('owned_items') || [])];
        if (!ownedItems.includes(ALL_ACHIEVEMENT_DECORATION_ID)) {
            ownedItems.push(ALL_ACHIEVEMENT_DECORATION_ID);
            this.registry.set('owned_items', ownedItems);

            const newItems = [...(this.registry.get('new_items') || [])];
            if (!newItems.includes(ALL_ACHIEVEMENT_DECORATION_ID)) {
                newItems.push(ALL_ACHIEVEMENT_DECORATION_ID);
                this.registry.set('new_items', newItems);
            }
        }

        const placed = [...(this.registry.get('placed_decorations') || [])];
        const alreadyPlaced = placed.some((item) => item.rewardId === ALL_ACHIEVEMENT_DECORATION_ID);
        if (!alreadyPlaced) {
            placed.push({
                key: ALL_ACHIEVEMENT_DECORATION_TEXTURE,
                rewardId: ALL_ACHIEVEMENT_DECORATION_ID,
                mapID: '01',
                x: 995,
                y: 285,
                scale: 0.30
            });
            this.registry.set('placed_decorations', placed);
        }
    }

    getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    wrapCjkText(text, charactersPerLine = 9) {
        const characters = Array.from(String(text));
        const lines = [];
        for (let index = 0; index < characters.length; index += charactersPerLine) {
            lines.push(characters.slice(index, index + charactersPerLine).join(''));
        }
        return lines.join('\n');
    }

    pickGoldHostCell() {
        const safeCells = this.getAllCells().filter((cell) => !cell.mine && !cell.flagged);
        const hiddenSafeCells = safeCells.filter((cell) => !cell.revealed);
        const candidates = hiddenSafeCells.length > 0 ? hiddenSafeCells : safeCells;
        return Phaser.Utils.Array.GetRandom(candidates) || this.cells[2][2];
    }

    playGoldGrowth(cell, goldData, onComplete) {
        cell.revealed = true;
        this.renderCell(cell);
        cell.view.number.setVisible(false);

        const glow = this.add.circle(cell.x, cell.y, 22, goldData.color, 0.32);
        const gold = this.add.image(cell.x, cell.y + 3, goldData.texture);
        const goldScale = this.bushConfig.visuals.goldBoardSize / Math.max(gold.width, gold.height);
        gold.setScale(goldScale * 0.05).setAlpha(0);

        this.tweens.add({
            targets: glow,
            radius: 68,
            alpha: 0,
            duration: 950,
            ease: 'Sine.Out'
        });

        this.tweens.add({
            targets: gold,
            alpha: 1,
            scale: goldScale,
            angle: { from: -7, to: 0 },
            duration: 720,
            ease: 'Back.Out',
            onStart: () => this.playGoldSound(),
            onComplete: () => {
                this.tweens.add({
                    targets: gold,
                    y: gold.y - 5,
                    duration: 520,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.InOut'
                });
                this.time.delayedCall(650, onComplete);
            }
        });

        for (let i = 0; i < 9; i += 1) {
            const sparkle = this.createSparkleStar(
                cell.x,
                cell.y,
                11,
                [0xffd84d, 0xfff7d6, 0xbde985][i % 3]
            ).setAlpha(0);
            const angle = (Math.PI * 2 * i) / 9;
            this.tweens.add({
                targets: sparkle,
                x: cell.x + Math.cos(angle) * 58,
                y: cell.y + Math.sin(angle) * 58,
                alpha: { from: 1, to: 0 },
                scale: { from: 0.35, to: 1 },
                duration: 680,
                delay: 120 + i * 32,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    showWinResult({ discovery, baseScore, totalScore, goldenBug, progress }) {
        const collectionCount = this.getGoldGrassCollection().length;
        const stats = progress.stats || this.getBushStats();
        const scoreLine = goldenBug.triggered
            ? `⭐ 超越滿分：${totalScore} / ${this.bushConfig.score.maxScore} 分`
            : `⭐ 本局 ${totalScore} / ${this.bushConfig.score.maxScore} 分`;
        const noFlagLine = this.clearedWithoutFlags ? '\n🧠 零插旗、零踩雷通關' : '';

        if (goldenBug.triggered) {
            this.showResultShell({
                success: true,
                title: '發現黃金蟲！',
                subtitle: `${scoreLine}${noFlagLine}\n✨ 神祕加分 +${goldenBug.bonusScore}\n📖 黃金蟲奇遇已記錄${goldenBug.usedPity ? '・保底出現' : ''}\n今日最高 ${stats.dailyBestScore} 分`,
                accent: 0xf3bd24,
                iconTexture: 'q_golden_bug',
                celebrate: true
            });
            return;
        }

        if (!discovery) {
            let replayHint = '完成 6 項成就後，可解鎖黃金蟲奇遇。';
            if (stats.goldenBugUnlocked) {
                replayHint = baseScore >= this.bushConfig.score.maxScore
                    ? '黃金蟲這次躲起來了，滿分再挑戰一次！'
                    : '達到 100 分，就有機會遇見黃金蟲。';
            }

            this.showResultShell({
                success: true,
                title: '探險完成！',
                subtitle: `${scoreLine}${noFlagLine}\n🌿 今日金草圖鑑機會已使用\n${replayHint}\n今日最高 ${stats.dailyBestScore} 分`,
                accent: 0x79ad56,
                iconTexture: 'q_bush'
            });
            return;
        }

        const pityLeft = Math.max(0, this.bushConfig.goldGrass.duplicatePity - stats.duplicateStreak);
        const duplicateLine = collectionCount >= Object.keys(GOLD_GRASS).length
            ? '📖 重複發現・金草圖鑑已完成'
            : `📖 重複發現・再 ${pityLeft} 次重複保底新圖鑑`;

        this.showResultShell({
            success: true,
            title: `找到${discovery.data.name}了！`,
            subtitle: discovery.isNew
                ? `${scoreLine}${noFlagLine}\n📖 新圖鑑：${discovery.data.name}（${collectionCount}/3）${discovery.usedPity ? '・保底發現' : ''}\n${discovery.data.description}\n🌿 今日圖鑑機會已領取`
                : `${scoreLine}${noFlagLine}\n${duplicateLine}\n🌿 今日圖鑑機會已領取\n今日最高 ${stats.dailyBestScore} 分`,
            accent: discovery.data.color,
            iconTexture: discovery.data.texture
        });
    }

    showAchievementCelebration(progress, onComplete) {
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x10291e, 0.78)
            .setInteractive()
            .setDepth(20400);
        const container = this.add.container(640, 360).setDepth(20401).setScale(0.78).setAlpha(0);
        this.achievementContainer = container;

        const panel = this.add.graphics();
        panel.fillStyle(0xfffdf1, 1);
        panel.lineStyle(7, progress.fullRewardUnlocked ? 0xf0b923 : 0xe1a937, 1);
        panel.fillRoundedRect(-350, -245, 700, 490, 32);
        panel.strokeRoundedRect(-350, -245, 700, 490, 32);

        const title = this.add.text(0, -193,
            progress.fullRewardUnlocked ? '草叢探險全成就完成！' : '成就達成！', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: progress.fullRewardUnlocked ? '34px' : '38px',
                fontStyle: 'bold',
                color: '#6d4b16',
                stroke: '#fff3b7',
                strokeThickness: 4
            }).setOrigin(0.5);

        const objects = [panel, title];
        if (progress.fullRewardUnlocked) {
            const bug = this.add.image(-125, -62, 'q_golden_bug').setDisplaySize(142, 142);
            const house = this.add.image(125, -62, 'q_golden_bug_house').setDisplaySize(142, 142);
            const rewardText = this.add.text(0, 42,
                '永久解鎖：黃金蟲奇遇\n滿分時有機會發現黃金蟲，獲得隱藏 110 分！\n獲得地圖裝飾：黃金蟲小屋', {
                    fontFamily: 'Microsoft JhengHei, Arial',
                    fontSize: '22px',
                    fontStyle: 'bold',
                    color: '#4f5b37',
                    align: 'center',
                    lineSpacing: 8,
                    wordWrap: { width: 610 }
                }).setOrigin(0.5, 0);
            objects.push(bug, house, rewardText);
        } else {
            const medal = this.add.text(0, -90, '🏅', { fontSize: '82px' }).setOrigin(0.5);
            const names = progress.newlyUnlocked.map((name) => `「${name}」`).join('、');
            const achievementText = this.add.text(0, 18, names, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '27px',
                fontStyle: 'bold',
                color: '#4f5b37',
                align: 'center',
                wordWrap: { width: 590 }
            }).setOrigin(0.5);
            objects.push(medal, achievementText);
        }

        const close = this.makeModalButton(0, 190, 230, 58, '繼續', 0xe7b542, () => {
            container.destroy();
            overlay.destroy();
            this.achievementContainer = null;
            onComplete();
        });
        objects.push(close);
        container.add(objects);

        this.emitStarBurst(container, 0, -42, 10, 285, 175);
        this.addTwinklingStars(container, [
            { x: -282, y: -174, size: 11, color: 0xffd84d },
            { x: 286, y: -112, size: 9, color: 0xfff7d6 },
            { x: 265, y: 128, size: 10, color: 0xbde985 }
        ]);

        this.playGoldSound();
        this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 320, ease: 'Back.Out' });
    }

    showResultShell({ success, title, subtitle, accent, iconTexture, celebrate = false }) {
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x10291e, 0.72)
            .setInteractive()
            .setDepth(20000);

        this.resultContainer = this.add.container(640, 360).setDepth(20001).setScale(0.85).setAlpha(0);

        const panel = this.add.graphics();
        panel.fillStyle(0xfffdf1, 1);
        panel.lineStyle(6, accent, 1);
        panel.fillRoundedRect(-320, -242, 640, 484, 30);
        panel.strokeRoundedRect(-320, -242, 640, 484, 30);

        const ribbon = this.add.graphics();
        ribbon.fillStyle(accent, 1);
        ribbon.fillRoundedRect(-235, -218, 470, 65, 24);

        const titleText = this.add.text(0, -182, title, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '35px',
            fontStyle: 'bold',
            color: '#fffdf4',
            stroke: '#554225',
            strokeThickness: 5
        }).setOrigin(0.5);

        const successIconSize = this.bushConfig?.visuals?.goldResultSize || 150;
        const iconSize = success ? successIconSize : Math.min(125, successIconSize);
        const icon = this.add.image(-190, -42, iconTexture).setDisplaySize(iconSize, iconSize);
        const subtitleText = this.add.text(78, -123, subtitle, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '20px',
            color: '#4c563e',
            align: 'center',
            lineSpacing: 9,
            wordWrap: { width: 370 }
        }).setOrigin(0.5, 0);

        const again = this.makeModalButton(-135, 175, 220, 58, '再玩一次', 0x87c851, () => {
            AudioSystem.stopBgm(this);
            this.scene.restart({
                stageId: this.stageId,
                stageData: this.stageData,
                returnScene: this.returnScene,
                mapID: this.mapID,
                testMode: this.testMode
            });
        });

        const returnText = this.returnScene === 'MiniGameHub' ? '回測試樂園' : '回到地圖';
        const map = this.makeModalButton(135, 175, 220, 58, returnText, 0xe7b542, () => {
            AudioSystem.stopBgm(this);
            this.scene.start(this.returnScene, { mapID: this.mapID });
        });

        this.resultContainer.add([panel, ribbon, titleText, icon, subtitleText, again, map]);
        if (celebrate) {
            this.emitStarBurst(this.resultContainer, -190, -42, 9, 112, 104);
            this.addTwinklingStars(this.resultContainer, [
                { x: -275, y: -118, size: 9, color: 0xffd84d },
                { x: -102, y: -105, size: 8, color: 0xfff7d6 },
                { x: -92, y: 20, size: 7, color: 0xbde985 }
            ]);
            this.playGoldSound();
        }
        this.tweens.add({
            targets: this.resultContainer,
            alpha: 1,
            scale: 1,
            duration: 260,
            ease: 'Back.Out'
        });

        overlay.on('pointerdown', () => {});
    }

    showHowToPlay() {
        if (this.helpContainer) return;
        this.inputLocked = true;

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x10291e, 0.72)
            .setInteractive()
            .setDepth(18000);
        const container = this.add.container(640, 360).setDepth(18001).setScale(0.9).setAlpha(0);

        const panel = this.add.graphics();
        panel.fillStyle(0xfffdf1, 1);
        panel.lineStyle(6, 0x79ad56, 1);
        panel.fillRoundedRect(-405, -260, 810, 520, 30);
        panel.strokeRoundedRect(-405, -260, 810, 520, 30);

        const title = this.add.text(0, -215, '森林小偵探的玩法', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '35px',
            fontStyle: 'bold',
            color: '#31572c'
        }).setOrigin(0.5);

        const cards = [
            { x: -255, icon: 'q_bush', title: '① 先挖一格', body: '第一格一定安全\n空白草地會一起打開' },
            { x: 0, icon: 'q_danger', title: '② 看懂數字', body: '數字代表周圍8格\n藏著幾個危險' },
            { x: 255, icon: 'q_flag', title: '③ 旗子可選用', body: '安全格全開就通關\n零插旗＋零踩雷有成就' }
        ];

        const cardObjects = [];
        cards.forEach((card) => {
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0xeff7da, 1);
            cardBg.lineStyle(3, 0xa8c47e, 1);
            cardBg.fillRoundedRect(card.x - 112, -145, 224, 250, 22);
            cardBg.strokeRoundedRect(card.x - 112, -145, 224, 250, 22);
            const icon = this.add.image(card.x, -70, card.icon).setDisplaySize(92, 92);
            const cardTitle = this.add.text(card.x, 8, card.title, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '23px',
                fontStyle: 'bold',
                color: '#355d35'
            }).setOrigin(0.5);
            const body = this.add.text(card.x, 65, card.body, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '17px',
                color: '#59654d',
                align: 'center',
                lineSpacing: 6
            }).setOrigin(0.5);
            cardObjects.push(cardBg, icon, cardTitle, body);
        });

        const close = this.makeModalButton(0, 202, 230, 58, '我會玩了！', 0x82c84f, () => {
            container.destroy();
            overlay.destroy();
            this.helpContainer = null;
            this.inputLocked = false;
        });

        container.add([panel, title, ...cardObjects, close]);
        this.helpContainer = container;
        this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    }

    showGoldEncyclopedia() {
        if (this.encyclopediaContainer) return;
        this.inputLocked = true;

        const owned = this.getGoldGrassCollection();
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x10291e, 0.72)
            .setInteractive()
            .setDepth(18500);
        const container = this.add.container(640, 360).setDepth(18501).setScale(0.9).setAlpha(0);

        const panel = this.add.graphics();
        panel.fillStyle(0xfffdf1, 1);
        panel.lineStyle(6, 0xe4b941, 1);
        panel.fillRoundedRect(-405, -260, 810, 520, 30);
        panel.strokeRoundedRect(-405, -260, 810, 520, 30);

        const title = this.add.text(0, -215, '金色草叢圖鑑', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '35px',
            fontStyle: 'bold',
            color: '#6f5420'
        }).setOrigin(0.5);

        const cardObjects = [];
        Object.values(GOLD_GRASS).forEach((grass, index) => {
            const x = -250 + index * 250;
            const unlocked = owned.includes(grass.id);
            const card = this.add.graphics();
            card.fillStyle(unlocked ? 0xfff4bd : 0xe8eadf, 1);
            card.lineStyle(3, unlocked ? grass.color : 0xa7ad9e, 1);
            card.fillRoundedRect(x - 105, -145, 210, 250, 22);
            card.strokeRoundedRect(x - 105, -145, 210, 250, 22);

            const icon = this.add.image(x, -67, unlocked ? grass.texture : 'q_bush')
                .setDisplaySize(94, 94);
            if (!unlocked) icon.setTint(0x778078).setAlpha(0.52);

            const name = this.add.text(x, 5, unlocked ? grass.name : '？？？', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '24px',
                fontStyle: 'bold',
                color: unlocked ? '#5d4c24' : '#757b72'
            }).setOrigin(0.5);

            const body = this.add.text(x, 62, unlocked ? this.wrapCjkText(grass.description, 8) : '每日首次成功時\n就有機會發現！', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '16px',
                color: '#626753',
                align: 'center',
                lineSpacing: 5,
                wordWrap: { width: 180 }
            }).setOrigin(0.5);

            cardObjects.push(card, icon, name, body);
        });

        const dailyText = this.isDailyGrassAvailable() ? '今日圖鑑：尚可領取' : '今日圖鑑：已領取，後續可刷分';
        const progress = this.add.text(0, 128, `已收集 ${owned.length}/3　・　${dailyText}\n連續重複 ${this.bushConfig.goldGrass.duplicatePity} 次後，下次保底新圖鑑`, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#5c6a45',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);

        const close = this.makeModalButton(0, 205, 230, 58, '關閉圖鑑', 0xd5a938, () => {
            container.destroy();
            overlay.destroy();
            this.encyclopediaContainer = null;
            this.inputLocked = false;
        });

        container.add([panel, title, ...cardObjects, progress, close]);
        this.encyclopediaContainer = container;
        this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    }

    generateSolvableBoard(firstCell) {
        const excluded = new Set(
            [firstCell, ...this.getNeighbors(firstCell.row, firstCell.col)].map((cell) => this.keyOf(cell))
        );
        const candidates = this.getAllCells().filter((cell) => !excluded.has(this.keyOf(cell)));

        let solved = false;
        for (let attempt = 0; attempt < this.SOLVER_ATTEMPTS && !solved; attempt += 1) {
            this.getAllCells().forEach((cell) => {
                cell.mine = false;
                cell.number = 0;
            });

            Phaser.Utils.Array.Shuffle([...candidates]).slice(0, this.MINE_COUNT).forEach((cell) => {
                cell.mine = true;
            });
            this.calculateNumbers();
            solved = this.isLogicallySolvable(firstCell);
        }

        if (!solved) {
            console.warn('未在嘗試次數內找到純邏輯盤面，保留最後一張安全盤面。');
        }
    }

    calculateNumbers() {
        this.getAllCells().forEach((cell) => {
            if (cell.mine) {
                cell.number = -1;
            } else {
                cell.number = this.getNeighbors(cell.row, cell.col).filter((next) => next.mine).length;
            }
        });
    }

    isLogicallySolvable(firstCell) {
        const revealed = new Set();
        const knownMines = new Set();
        const revealSafeArea = (seed) => {
            const queue = [seed];
            while (queue.length > 0) {
                const current = queue.shift();
                const key = this.keyOf(current);
                if (revealed.has(key) || current.mine) continue;
                revealed.add(key);
                if (current.number === 0) {
                    this.getNeighbors(current.row, current.col).forEach((next) => {
                        if (!next.mine && !revealed.has(this.keyOf(next))) queue.push(next);
                    });
                }
            }
        };

        revealSafeArea(firstCell);
        let changed = true;
        let rounds = 0;

        while (changed && rounds < 100) {
            changed = false;
            rounds += 1;

            for (const cell of this.getAllCells()) {
                if (!revealed.has(this.keyOf(cell)) || cell.number <= 0) continue;

                const around = this.getNeighbors(cell.row, cell.col);
                const markedAround = around.filter((next) => knownMines.has(this.keyOf(next))).length;
                const unknown = around.filter((next) => {
                    const key = this.keyOf(next);
                    return !revealed.has(key) && !knownMines.has(key);
                });

                if (unknown.length === 0) continue;

                if (cell.number - markedAround === unknown.length) {
                    unknown.forEach((next) => {
                        const key = this.keyOf(next);
                        if (!knownMines.has(key)) {
                            knownMines.add(key);
                            changed = true;
                        }
                    });
                } else if (cell.number === markedAround) {
                    unknown.forEach((next) => {
                        const before = revealed.size;
                        revealSafeArea(next);
                        if (revealed.size > before) changed = true;
                    });
                }
            }
        }

        return revealed.size === this.ROWS * this.COLS - this.MINE_COUNT || knownMines.size === this.MINE_COUNT;
    }

    getNeighbors(row, col) {
        const result = [];
        for (let dr = -1; dr <= 1; dr += 1) {
            for (let dc = -1; dc <= 1; dc += 1) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS) {
                    result.push(this.cells[nr][nc]);
                }
            }
        }
        return result;
    }

    getAllCells() {
        return this.cells.flat();
    }

    keyOf(cell) {
        return `${cell.row},${cell.col}`;
    }

    getMarkedCount() {
        return this.getAllCells().filter((cell) => cell.flagged || (cell.mine && cell.hit)).length;
    }

    getGoldGrassCollection() {
        const value = this.registry.get('gold_grass_encyclopedia');
        return Array.isArray(value) ? [...value] : [];
    }

    migrateNoFlagAchievementRuleV32() {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const treasure = { ...(allStats.treasure || {}) };

        if (Number(treasure.noFlagAchievementRuleVersion || 0) >= 2) return;

        treasure.noFlagClearCount = 0;
        treasure.noFlagAchievementRuleVersion = 2;
        allStats.treasure = treasure;
        this.registry.set('minigame_stats', allStats);

        const achievements = [...(this.registry.get('achievements') || [])]
            .filter((id) => id !== 'bush_no_flag');
        this.registry.set('achievements', achievements);
        SaveSystem.saveFromRegistry(this.registry);
    }

    getBushStats() {
        const stats = { ...(this.registry.get('minigame_stats') || {}) };
        stats.treasure = {
            ...(stats.treasure || {}),
            playCount: stats.treasure?.playCount || 0,
            clearCount: stats.treasure?.clearCount || 0,
            bestScore: stats.treasure?.bestScore || 0,
            bestBaseScore: stats.treasure?.bestBaseScore || 0,
            duplicateStreak: stats.treasure?.duplicateStreak || 0,
            noHintClearCount: stats.treasure?.noHintClearCount || 0,
            perfectClearCount: stats.treasure?.perfectClearCount || 0,
            noFlagClearCount: stats.treasure?.noFlagClearCount || 0,
            noFlagAchievementRuleVersion: stats.treasure?.noFlagAchievementRuleVersion || 2,
            dailyBestScore: stats.treasure?.dailyBestScore || 0,
            dailyScoreDate: stats.treasure?.dailyScoreDate || '',
            dailyGrassDate: stats.treasure?.dailyGrassDate || '',
            goldenBugUnlocked: stats.treasure?.goldenBugUnlocked === true,
            goldenBugDiscovered: stats.treasure?.goldenBugDiscovered === true,
            goldenBugFindCount: stats.treasure?.goldenBugFindCount || 0,
            goldenBugMissStreak: stats.treasure?.goldenBugMissStreak || 0,
            fullAchievementRewardClaimed: stats.treasure?.fullAchievementRewardClaimed === true
        };
        return stats.treasure;
    }

    setBushStats(bushStats) {
        const stats = { ...(this.registry.get('minigame_stats') || {}) };
        stats.treasure = bushStats;
        this.registry.set('minigame_stats', stats);
    }

    updateHUD() {
        this.foundText.setText(`找到危險：${this.getMarkedCount()}`);
        this.chanceText.setText(`勇氣：${'❤'.repeat(this.mistakesLeft)}${'♡'.repeat(this.MISTAKE_LIMIT - this.mistakesLeft)}`);
        this.hintText.setText(`小精靈提示：${this.hintsLeft > 0 ? `還有 ${this.hintsLeft} 次` : '使用完畢'}`);
        this.hintButton.setEnabled(this.hintsLeft > 0);
        this.updateModeButtons();
    }

    updateModeButtons() {
        this.digButton.setActive(this.mode === 'dig');
        this.flagButton.setActive(this.mode === 'flag');
    }

    setGuideMessage(text) {
        if (this.guideText) this.guideText.setText(text);
    }

    makeModeButton(x, y, width, height, emoji, label, mode, texture = null) {
        const button = this.makeButtonBase(x, y, width, height, () => {
            if (this.inputLocked || this.gameOver) return;
            this.mode = mode;
            this.playUiSound();
            this.updateModeButtons();
            this.setGuideMessage(mode === 'dig'
                ? '挖草模式：點草叢把它挖開。'
                : '插旗模式：點草叢標記危險。');
        });

        let icon;
        if (texture) {
            icon = this.add.image(-55, 0, texture).setDisplaySize(38, 38);
        } else {
            icon = this.add.text(-55, 0, emoji, { fontSize: '31px' }).setOrigin(0.5);
        }

        const text = this.add.text(18, 0, label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '27px',
            fontStyle: 'bold',
            color: '#3f4c32'
        }).setOrigin(0.5);

        button.container.add([icon, text]);
        button.setActive = (active) => {
            button.redraw(active ? 0xf4c958 : 0xe8ead9, active ? 0x9a6d20 : 0x889277, 1);
            text.setColor(active ? '#5b3c12' : '#495143');
        };
        return button;
    }

    makeWideButton(x, y, width, height, label, onClick) {
        const button = this.makeButtonBase(x, y, width, height, () => {
            if (!button.enabled) return;
            onClick();
        });
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '25px',
            fontStyle: 'bold',
            color: '#fffdf4'
        }).setOrigin(0.5);
        button.container.add(text);
        button.enabled = true;
        button.setEnabled = (enabled) => {
            button.enabled = enabled;
            button.redraw(enabled ? 0x8d6bd1 : 0xc8c1d4, enabled ? 0x593c9a : 0x938b9e, 1);
            button.container.setAlpha(enabled ? 1 : 0.66);
        };
        button.setEnabled(true);
        return button;
    }

    makeButtonBase(x, y, width, height, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
        container.add([bg, hit]);
        container.setSize(width, height);

        const redraw = (fill, stroke, alpha = 1) => {
            bg.clear();
            bg.fillStyle(fill, alpha);
            bg.lineStyle(3, stroke, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
        };
        redraw(0xe8ead9, 0x889277, 1);

        hit.on('pointerdown', onClick);
        hit.on('pointerover', () => {
            this.tweens.add({ targets: container, scale: 1.035, duration: 90 });
        });
        hit.on('pointerout', () => {
            this.tweens.add({ targets: container, scale: 1, duration: 90 });
        });

        return { container, bg, hit, redraw };
    }

    makeSmallButton(x, y, width, height, label, fill, stroke, onClick) {
        const button = this.makeButtonBase(x, y, width, height, onClick);
        button.redraw(fill, stroke, 1);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#3f4c32'
        }).setOrigin(0.5);
        button.container.add(text);
        return button;
    }

    makeModalButton(x, y, width, height, label, fill, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(fill, 1);
        bg.lineStyle(3, 0x6e643c, 0.72);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#fffdf4',
            stroke: '#4f4428',
            strokeThickness: 3
        }).setOrigin(0.5);
        const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            this.playUiSound();
            onClick();
        });
        hit.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.04, duration: 90 }));
        hit.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 90 }));
        container.add([bg, text, hit]);
        return container;
    }

    createSparkleStar(x, y, size = 10, color = 0xffd84d) {
        const points = Math.random() > 0.45 ? 4 : 5;
        return this.add.star(x, y, points, size * 0.34, size, color, 1)
            .setStrokeStyle(1.5, 0xfffbed, 0.92);
    }

    emitStarBurst(container, originX, originY, count = 9, radiusX = 120, radiusY = radiusX) {
        const colors = [0xffd84d, 0xfff7d6, 0xbde985];
        for (let index = 0; index < count; index += 1) {
            const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
            const size = 7 + (index % 4) * 1.6;
            const star = this.createSparkleStar(originX, originY, size, colors[index % colors.length])
                .setAlpha(0)
                .setScale(0.25);
            container.add(star);
            this.tweens.add({
                targets: star,
                x: originX + Math.cos(angle) * radiusX,
                y: originY + Math.sin(angle) * radiusY,
                alpha: { from: 1, to: 0 },
                scale: { from: 0.25, to: 1.05 },
                angle: 75 + index * 11,
                duration: 720,
                delay: index * 38,
                ease: 'Cubic.Out',
                onComplete: () => star.destroy()
            });
        }
    }

    addTwinklingStars(container, definitions) {
        definitions.forEach((definition, index) => {
            const star = this.createSparkleStar(
                definition.x,
                definition.y,
                definition.size,
                definition.color
            ).setAlpha(0.32);
            container.add(star);
            this.tweens.add({
                targets: star,
                alpha: 1,
                scale: { from: 0.72, to: 1.18 },
                angle: index % 2 === 0 ? 18 : -18,
                duration: 620 + index * 120,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        });
    }

    wiggle(target) {
        if (!target) return;
        this.tweens.add({
            targets: target,
            angle: { from: -4, to: 4 },
            duration: 70,
            yoyo: true,
            repeat: 2,
            onComplete: () => target.setAngle(0)
        });
    }

    startBgm() {
        if (this.cache.audio.exists('bush_bgm')) AudioSystem.playBgm(this, 'bush_bgm', 0.34);
    }

    playUiSound() {
        if (this.cache.audio.exists('ui_click_sfx')) this.sound.play('ui_click_sfx', { volume: 0.32 });
    }

    playDigSound() {
        const key = this.cache.audio.exists('dig_grass_sfx') ? 'dig_grass_sfx' : 'dig_sfx';
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.42 });
    }

    playWrongSound() {
        if (this.cache.audio.exists('answer_wrong_sfx')) this.sound.play('answer_wrong_sfx', { volume: 0.42 });
    }

    playCorrectSound() {
        if (this.cache.audio.exists('answer_correct_sfx')) this.sound.play('answer_correct_sfx', { volume: 0.42 });
    }

    playGoldSound() {
        if (this.cache.audio.exists('gold_sfx')) this.sound.play('gold_sfx', { volume: 0.48 });
    }
}
