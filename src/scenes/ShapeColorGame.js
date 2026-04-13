// src/scenes/ShapeColorGame.js
export default class ShapeColorGame extends Phaser.Scene {
    constructor() {
        super('ShapeColorGame');
    }

    init(data) {
        this.returnScene = data?.returnScene || 'Start';

        // 棋盤設定（先回固定版）
        this.boardSize = 13;
        this.visibleRows = 9; // 只顯示前 9 排，邏輯仍是 13x13
        this.viewRowStart = 0;
        this.boardStartX = 320;
        this.boardStartY = 110;
        this.cellSize = 56;

        // 手牌 / 牌袋
        this.handSize = 6;
        this.deck = [];
        this.playerHand = [];
        this.handSlots = [];

        // 棋盤資料
        this.board = [];
        this.boardCells = [];

        // 玩家 / 回合
        this.playerScore = 0;
        this.aiScore = 0;
        this.turnNumber = 1;
        this.currentTurn = 'player';
        this.aiHand = [];
        this.isAiThinking = false;
        this.aiMaxMovesPerTurn = 3;

        // 本回合暫存
        this.selectedHandIndex = null;
        this.turnPlacements = [];
        this.turnAxis = null;
        this.highlightedValidMoves = [];
        this.conflictFlashTimers = [];

        // 換牌模式
        this.exchangeMode = false;
        this.exchangeSelected = new Set();

        // 6色6形
        this.colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
        this.shapes = ['circle', 'square', 'diamond', 'star', 'clover', 'cross'];

        this.colorHexMap = {
            red: 0xe96b6b,
            orange: 0xf2a65a,
            yellow: 0xf4d35e,
            green: 0x6bcB77,
            blue: 0x68a7ff,
            purple: 0xb388eb
        };

        this.colorLabelMap = {
            red: '紅',
            orange: '橘',
            yellow: '黃',
            green: '綠',
            blue: '藍',
            purple: '紫'
        };

        this.shapeLabelMap = {
            circle: '圓',
            square: '方',
            diamond: '菱',
            star: '星',
            clover: '花',
            cross: '十'
        };
    }

    createBoardCoverMasks() {
        // 左側蓋板
        this.add.rectangle(180, 385, 240, 620, 0xece4d8, 1).setDepth(50);

        // 右側蓋板
        this.add.rectangle(1155, 385, 110, 620, 0xece4d8, 1).setDepth(50);

        // 上方蓋板
        this.add.rectangle(640, 70, 900, 70, 0xece4d8, 1).setDepth(50);

        // 下方蓋板（手牌上方那條）
        this.add.rectangle(640, 640, 900, 55, 0xece4d8, 1).setDepth(50);
    }

    create() {
        // 1. 森林風背景
        const g = this.add.graphics();
        g.fillGradientStyle(0xdff4d8, 0xdff4d8, 0xa9d18e, 0xa9d18e, 1);
        g.fillRect(0, 0, 1280, 720);

        this.add.rectangle(640, 360, 1210, 660, 0xfffbf2, 0.78)
            .setStrokeStyle(3, 0xb98a52, 0.8);

        this.add.rectangle(640, 88, 1160, 78, 0xf7e2b8, 0.98)
            .setStrokeStyle(3, 0xa06d39, 0.9);

        this.add.text(640, 64, '形色棋', {
            fontSize: '36px',
            color: '#4b341f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 108, '森林風益智小遊戲', {
            fontSize: '18px',
            color: '#6f5a3e'
        }).setOrigin(0.5);

        const backBg = this.add.rectangle(110, 88, 120, 50, 0x9b6a37, 1)
            .setStrokeStyle(2, 0xffffff, 0.18)
            .setInteractive({ useHandCursor: true });

        const backText = this.add.text(110, 88, '返回', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backBg.on('pointerdown', () => {
            this.scene.start(this.returnScene || 'MiniGameHub');
        });

        // 2. 接回你原本形色棋的初始化流程
        this.createDeck();
        this.shuffle(this.deck);
        this.createBoardData();
        this.drawOpeningHands();

        this.createHud();
        this.createBoardUI();
        this.drawAllPlacedTiles();
        this.createActionButtons();
        this.createBoardMoveButtons();
        this.renderHand();
        this.refreshHud();
        this.updateTurnPreview();
        this.setMessage('先選手牌，再點棋盤放置。');
    }

    /* =========================
     * 建立基礎
     * ========================= */
    createDeck() {
        this.deck = [];

        for (const color of this.colors) {
            for (const shape of this.shapes) {
                for (let i = 0; i < 3; i++) {
                    this.deck.push({
                        uid: `${color}_${shape}_${i}_${Math.random().toString(36).slice(2, 8)}`,
                        color,
                        shape
                    });
                }
            }
        }
    }

    createBoardData() {
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            this.boardCells[row] = [];

            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = null;
            }
        }
    }

    drawOpeningHands() {
        while (this.playerHand.length < this.handSize && this.deck.length > 0) {
            this.playerHand.push(this.drawTileFromDeck());
        }

        while (this.aiHand.length < this.handSize && this.deck.length > 0) {
            this.aiHand.push(this.drawTileFromDeck());
        }
    }

    drawBackground() {
        this.add.rectangle(640, 360, 1280, 720, 0xece4d8);

        // ===== 左側資訊卡 =====
        this.add.rectangle(145, 385, 220, 520, 0xf6f0e7, 0.96)
            .setStrokeStyle(3, 0xd4c5b4);

        // 左側標題條
        this.add.rectangle(145, 138, 180, 44, 0xe7dccd, 0.95)
            .setStrokeStyle(2, 0xcab9a3);

        // ===== 棋盤底板 =====
        this.add.rectangle(690, 385, 780, 575, 0xf7f2ea, 0.98)
            .setStrokeStyle(3, 0xd8c7b3);

        // 棋盤內框，讓中間更聚焦
        this.add.rectangle(690, 385, 742, 540, 0xf3ede3, 0.55)
            .setStrokeStyle(1, 0xe4d7c8);

        // ===== 右側操作區 =====
        this.add.rectangle(1145, 385, 230, 575, 0xf6f0e7, 0.96)
            .setStrokeStyle(3, 0xd4c5b4);

        // 右上提示框
        this.add.rectangle(1145, 190, 190, 145, 0xfffbf5, 0.98)
            .setStrokeStyle(2, 0xd8c7b3);

        // 右中預覽框
        this.add.rectangle(1145, 320, 190, 90, 0xfffbf5, 0.98)
            .setStrokeStyle(2, 0xd8c7b3);

        // ===== 下方手牌托盤 =====
        this.add.rectangle(690, 668, 800, 120, 0xf6f0e7, 0.96)
            .setStrokeStyle(3, 0xd4c5b4);

        // 手牌托盤內層
        this.add.rectangle(690, 668, 760, 88, 0xfffbf5, 0.75)
            .setStrokeStyle(1, 0xe0d2c2);

        // ===== 標題 =====
        this.add.text(640, 40, '森林形色棋 v2', {
            fontSize: '30px',
            color: '#5b4636',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 68, '玩家 vs AI', {
            fontSize: '15px',
            color: '#8a7663'
        }).setOrigin(0.5);

        // 標題下小裝飾線
        this.add.rectangle(640, 88, 220, 2, 0xcdbba7, 0.9);

        // 左側區塊名稱
        this.add.text(145, 138, '對戰資訊', {
            fontSize: '22px',
            color: '#5b4636',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 手牌區標題
        this.add.text(690, 610, '你的手牌', {
            fontSize: '20px',
            color: '#6a5848',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 規則說明
        this.add.text(640, 705, '規則：同色不同形 / 同形不同色 ｜ 可一次出多顆（同一行或同一列）', {
            fontSize: '18px',
            color: '#6a5848'
        }).setOrigin(0.5);
    }

    createHud() {
        // 左側分數
        this.scoreText = this.add.text(55, 182, '玩家：0', {
            fontSize: '30px',
            color: '#4b3c31',
            fontStyle: 'bold'
        });

        this.aiScoreText = this.add.text(55, 228, 'AI：0', {
            fontSize: '28px',
            color: '#6a5848'
        });

        // 左側資訊列
        this.turnText = this.add.text(55, 294, '回合數：1', {
            fontSize: '22px',
            color: '#4b3c31'
        });

        this.currentTurnText = this.add.text(55, 338, '目前回合：玩家', {
            fontSize: '22px',
            color: '#4b3c31',
            fontStyle: 'bold'
        });

        this.deckText = this.add.text(55, 382, '牌袋：108', {
            fontSize: '22px',
            color: '#4b3c31'
        });

        // 右側提示標題
        this.add.text(1050, 128, '操作提示', {
            fontSize: '18px',
            color: '#7a6654',
            fontStyle: 'bold'
        });

        this.messageText = this.add.text(1050, 155, '先選手牌，再點棋盤放置。', {
            fontSize: '17px',
            color: '#5f5146',
            wordWrap: { width: 170, useAdvancedWrap: true },
            lineSpacing: 6
        }).setOrigin(0, 0);

        // 右側預覽標題
        this.add.text(1050, 286, '本回合預覽', {
            fontSize: '18px',
            color: '#7a6654',
            fontStyle: 'bold'
        });

        this.previewText = this.add.text(1050, 314, '本回合尚未放牌', {
            fontSize: '17px',
            color: '#5f5146',
            wordWrap: { width: 170, useAdvancedWrap: true },
            lineSpacing: 6
        }).setOrigin(0, 0);
    }

    createBoardUI() {
        this.boardCells = [];

        for (let viewRow = 0; viewRow < this.visibleRows; viewRow++) {
            this.boardCells[viewRow] = [];

            for (let col = 0; col < this.boardSize; col++) {
                const x = this.boardStartX + col * this.cellSize;
                const y = this.boardStartY + viewRow * this.cellSize;

                const bg = this.add.rectangle(x, y, this.cellSize - 4, this.cellSize - 4, 0xfffbf5)
                    .setStrokeStyle(2, 0xbfae98)
                    .setInteractive({ useHandCursor: true });

                bg.on('pointerdown', () => {
                    const realRow = viewRow + this.viewRowStart;
                    this.handleBoardClick(realRow, col);
                });

                this.boardCells[viewRow][col] = {
                    bg,
                    tileContainer: null
                };
            }
        }
    }

    drawAllPlacedTiles() {
        for (let viewRow = 0; viewRow < this.visibleRows; viewRow++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.boardCells[viewRow]?.[col];
                if (!cell) continue;

                if (cell.tileContainer) {
                    cell.tileContainer.destroy();
                    cell.tileContainer = null;
                }

                const realRow = viewRow + this.viewRowStart;
                const tile = this.board[realRow]?.[col];

                if (tile) {
                    this.drawTileOnBoard(viewRow, col, tile);
                }
            }
        }
    }

    createActionButtons() {
        const makeBtn = (x, y, width, height, label, callback) => {
            const bg = this.add.rectangle(x, y, width, height, 0xffffff)
                .setStrokeStyle(3, 0x7b6857)
                .setInteractive({ useHandCursor: true });

            const text = this.add.text(x, y, label, {
                fontSize: '24px',
                color: '#4b3c31',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            bg.on('pointerover', () => bg.setFillStyle(0xf5f1ea));
            bg.on('pointerout', () => bg.setFillStyle(0xffffff));
            bg.on('pointerdown', callback);

            return { bg, text };
        };

        // 主按鈕：確認出牌
        this.confirmBtn = makeBtn(1145, 440, 210, 68, '確認出牌', () => {
            this.confirmTurn();
        });
        this.confirmBtn.bg.setFillStyle(0xf7f1e7);
        this.confirmBtn.bg.setStrokeStyle(4, 0x8d745f);
        this.confirmBtn.text.setStyle({
            fontSize: '28px',
            color: '#4b3c31',
            fontStyle: 'bold'
        });

        // 次按鈕：取消
        this.cancelBtn = makeBtn(1145, 522, 210, 62, '取消本回合', () => {
            this.cancelTurnPlacements();
        });

        // 功能按鈕：換牌模式
        this.exchangeBtn = makeBtn(1145, 600, 210, 58, '換牌模式', () => {
            this.toggleExchangeMode();
        });

        // 功能按鈕：確認換牌
        this.exchangeConfirmBtn = makeBtn(1145, 668, 210, 58, '確認換牌', () => {
            this.confirmExchange();
        });
        this.exchangeConfirmBtn.bg.setFillStyle(0xf3f7ff);
        this.exchangeConfirmBtn.bg.setStrokeStyle(3, 0x7a9cc6);
    }

    createBackButton() {
        const backBg = this.add.rectangle(105, 48, 150, 58, 0xffffff)
            .setStrokeStyle(3, 0x000000)
            .setInteractive({ useHandCursor: true });

        const backText = this.add.text(115, 46, '返回', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backBg.on('pointerdown', () => {
            this.scene.start(this.returnScene);
        });
    }

    refreshHud() {
        this.scoreText.setText(`玩家：${this.playerScore}`);
        this.aiScoreText.setText(`AI：${this.aiScore}`);
        this.turnText.setText(`回合數：${this.turnNumber}`);
        this.currentTurnText.setText(`目前回合：${this.currentTurn === 'player' ? '玩家' : 'AI'}`);
        this.deckText.setText(`牌袋：${this.deck.length}`);
    }

    setMessage(text) {
        this.messageText.setText(text);
    }

    updateTurnPreview() {
        if (this.exchangeMode) {
            this.previewText.setText(`換牌模式中：已選 ${this.exchangeSelected.size} 張`);
            return;
        }

        if (this.turnPlacements.length === 0) {
            this.previewText.setText('本回合尚未放牌');
            return;
        }

        const labels = this.turnPlacements.map(p => this.getTileLabel(p.tile));
        this.previewText.setText(`本回合已放 ${this.turnPlacements.length} 張：${labels.join('、')}`);
    }

    createBoardMoveButtons() {
        const arrowX = 255;
        const arrowY = 370;

        const result = this.createArrowButton(arrowX, arrowY, '↓', () => {
            const maxStart = this.boardSize - this.visibleRows;

            if (this.viewRowStart === 0) {
                this.viewRowStart = maxStart;
                this.setMessage('已切換到下半部棋盤');
            } else {
                this.viewRowStart = 0;
                this.setMessage('已切換到上半部棋盤');
            }

            this.refreshBoardViewport();
            this.updateBoardMoveButtonSymbol();
        });

        this.boardMoveBtnBg = result.bg;
        this.boardMoveBtnText = result.text;

        this.updateBoardMoveButtonSymbol();
    }

    refreshBoardViewport() {
        for (let viewRow = 0; viewRow < this.visibleRows; viewRow++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.boardCells[viewRow]?.[col];
                if (!cell) continue;

                if (cell.tileContainer) {
                    cell.tileContainer.destroy();
                    cell.tileContainer = null;
                }

                cell.bg.setStrokeStyle(2, 0xbfae98);
            }
        }

        this.drawAllPlacedTiles();
        this.clearBoardHighlights();

        if (this.selectedHandIndex !== null && !this.exchangeMode) {
            this.highlightValidMoves();
        }
    }

    createArrowButton(x, y, label, callback) {
        const bg = this.add.circle(x, y, 28, 0xffffff, 0.92)
            .setStrokeStyle(3, 0x333333)
            .setDepth(100)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y - 1, label, {
            fontSize: '30px',
            color: '#222222',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        bg.on('pointerover', () => bg.setFillStyle(0xf2f2f2));
        bg.on('pointerout', () => bg.setFillStyle(0xffffff));
        bg.on('pointerdown', callback);

        return { bg, text };
    }

    updateBoardMoveButtonSymbol() {
        if (!this.boardMoveBtnText) return;

        const maxStart = this.boardSize - this.visibleRows;

        if (this.viewRowStart === 0) {
            this.boardMoveBtnText.setText('↓');
        } else if (this.viewRowStart === maxStart) {
            this.boardMoveBtnText.setText('↑');
        }
    }

    /* =========================
    * 手牌
    * ========================= */
    renderHand() {
        this.handSlots.forEach(slot => {
            if (slot.container) slot.container.destroy();
        });
        this.handSlots = [];

        const startX = 370;
        const y = 655;
        const gap = 116;

        for (let i = 0; i < this.playerHand.length; i++) {
            const tile = this.playerHand[i];
            const x = startX + i * gap;

            const isSelected = this.selectedHandIndex === i;
            const isExchangeSelected = this.exchangeSelected.has(i);

            let borderColor = 0x9f8e7b;
            let borderWidth = 2;
            let targetScale = 1;
            let targetY = y;

            if (isSelected) {
                borderColor = 0xffc857;
                borderWidth = 5;
                targetScale = 1.12;
                targetY = y - 12;
            } else if (isExchangeSelected) {
                borderColor = 0x4dabf7;
                borderWidth = 5;
                targetScale = 1.06;
                targetY = y - 6;
            }

            const display = this.createTileDisplay(x, y, tile, {
                width: 92,
                height: 108,
                interactive: true
            });

            display.container.y = targetY;
            display.bg.setStrokeStyle(borderWidth, borderColor);
            display.container.setScale(targetScale);

            // hover 特效
            display.bg.on('pointerover', () => {
                if (this.currentTurn !== 'player') return;

                const hoverScale = isSelected ? 1.14 : (isExchangeSelected ? 1.08 : 1.04);

                this.tweens.add({
                    targets: display.container,
                    scale: hoverScale,
                    y: targetY - 4,
                    duration: 100
                });

                if (!isSelected && !isExchangeSelected) {
                    display.bg.setStrokeStyle(4, 0xd6b98c);
                }
            });

            display.bg.on('pointerout', () => {
                if (this.currentTurn !== 'player') return;

                this.tweens.add({
                    targets: display.container,
                    scale: targetScale,
                    y: targetY,
                    duration: 100
                });

                display.bg.setStrokeStyle(borderWidth, borderColor);
            });

            display.bg.on('pointerdown', () => {
                this.handleHandClick(i);
            });

            this.handSlots.push({
                container: display.container,
                bg: display.bg
            });
        }
    }

    handleHandClick(index) {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }
        if (!this.playerHand[index]) return;

        if (this.exchangeMode) {
            if (this.exchangeSelected.has(index)) {
                this.exchangeSelected.delete(index);
            } else {
                this.exchangeSelected.add(index);
            }
            this.renderHand();
            this.updateTurnPreview();
            return;
        }

        // 再點同一張＝取消選取
        if (this.selectedHandIndex === index) {
            this.selectedHandIndex = null;
            this.clearBoardHighlights();
            this.renderHand();
            this.setMessage('已取消選牌');
            return;
        }

        this.selectedHandIndex = index;
        this.renderHand();
        this.highlightValidMoves();
        this.setMessage(`已選擇：${this.getTileLabel(this.playerHand[index])}`);
    }

    toggleExchangeMode() {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }

        if (this.turnPlacements.length > 0) {
            this.setMessage('本回合已放牌，不能再切到換牌模式');
            return;
        }

        this.exchangeMode = !this.exchangeMode;
        this.exchangeSelected.clear();
        this.selectedHandIndex = null;
        this.clearBoardHighlights();
        this.renderHand();
        this.updateTurnPreview();

        if (this.exchangeMode) {
            this.setMessage('已進入換牌模式：點選手牌後按「確認換牌」');
        } else {
            this.setMessage('已離開換牌模式');
        }
    }

    confirmExchange() {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }

        if (!this.exchangeMode) {
            this.setMessage('請先進入換牌模式');
            return;
        }

        if (this.exchangeSelected.size === 0) {
            this.setMessage('請先選擇要換掉的牌');
            return;
        }

        if (this.deck.length < this.exchangeSelected.size) {
            this.setMessage('牌袋不夠，無法換這麼多牌');
            return;
        }

        const selectedIndexes = [...this.exchangeSelected].sort((a, b) => b - a);
        const returnedTiles = [];

        for (const idx of selectedIndexes) {
            if (this.playerHand[idx]) {
                returnedTiles.push(this.playerHand[idx]);
                this.playerHand.splice(idx, 1);
            }
        }

        this.deck.push(...returnedTiles);
        this.shuffle(this.deck);

        while (this.playerHand.length < this.handSize && this.deck.length > 0) {
            this.playerHand.push(this.drawTileFromDeck());
        }

        this.exchangeSelected.clear();
        this.exchangeMode = false;
        this.turnNumber += 1;
        this.clearBoardHighlights();

        this.renderHand();
        this.currentTurn = 'ai';
        this.refreshHud();
        this.updateTurnPreview();
        this.setMessage('玩家換牌完成，輪到 AI');

        if (this.isGameEnd()) {
            this.time.delayedCall(300, () => this.showGameEndPanel());
            return;
        }

        this.time.delayedCall(700, () => {
            this.runAiTurn();
        });
    }

    /* =========================
     * 棋盤互動
     * ========================= */
    handleBoardClick(row, col) {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }

        if (this.exchangeMode) {
            this.setMessage('換牌模式中，不能放牌');
            return;
        }

        if (this.selectedHandIndex === null) {
            this.setMessage('請先選擇一張手牌');
            return;
        }

        if (this.board[row][col]) {
            this.setMessage('這格已經有棋子');
            this.flashCell(row, col, 0xff6b6b);
            return;
        }

        if (this.turnPlacements.some(p => p.row === row && p.col === col)) {
            this.setMessage('這格本回合已放過預覽牌');
            return;
        }

        const tile = this.playerHand[this.selectedHandIndex];
        if (!tile) return;

        const result = this.canPlaceInCurrentTurn(row, col, tile);

        if (!result.valid) {

            // 🔥 新增：分析衝突線
            const analysis = this.analyzePlacementConflict(row, col, tile);

            // 🔥 橫線錯 → 紅整條
            if (!analysis.horizontal.valid) {
                this.flashConflictLineCells(analysis.horizontal.positions);
            }

            // 🔥 直線錯 → 紅整條
            if (!analysis.vertical.valid) {
                this.flashConflictLineCells(analysis.vertical.positions);
            }

            // 🔥 原本提示
            this.setMessage(this.buildDetailedInvalidMessage(result));

            // 🔥 原本單格紅（保留）
            this.flashCell(row, col, 0xff6b6b);

            return;
        }

        // 先放到棋盤預覽
        this.board[row][col] = tile;
        this.turnPlacements.push({
            row,
            col,
            tile,
            fromHandIndex: this.selectedHandIndex
        });

        // 決定本回合軸線
        if (this.turnPlacements.length >= 2 && !this.turnAxis) {
            const first = this.turnPlacements[0];
            const second = this.turnPlacements[1];
            if (first.row === second.row) this.turnAxis = 'row';
            if (first.col === second.col) this.turnAxis = 'col';
        }

        this.drawTileOnBoard(row, col, tile);
        this.flashCell(row, col, 0x7bd389);

        // 從手牌移除
        this.playerHand.splice(this.selectedHandIndex, 1);
        this.selectedHandIndex = null;

        this.renderHand();
        this.clearBoardHighlights();
        this.updateTurnPreview();
        this.setMessage(`已暫放：${this.getTileLabel(tile)}，可繼續放或按「確認出牌」`);
    }

    cancelTurnPlacements() {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }

        if (this.turnPlacements.length === 0) {
            this.setMessage('本回合沒有可取消的放牌');
            return;
        }

        // 還原手牌
        const restoreTiles = this.turnPlacements.map(p => p.tile);
        this.playerHand.push(...restoreTiles);

        // 清掉棋盤
        for (const p of this.turnPlacements) {
            this.board[p.row][p.col] = null;
            const cell = this.boardCells[p.row][p.col];
            if (cell.tileContainer) {
                cell.tileContainer.destroy();
                cell.tileContainer = null;
            }
        }

        this.turnPlacements = [];
        this.turnAxis = null;
        this.selectedHandIndex = null;
        this.clearBoardHighlights();

        this.renderHand();
        this.updateTurnPreview();
        this.setMessage('已取消本回合放牌');
    }

    confirmTurn() {
        if (this.currentTurn !== 'player') {
            this.setMessage('現在是 AI 回合');
            return;
        }

        if (this.turnPlacements.length === 0) {
            this.setMessage('本回合尚未放牌');
            return;
        }

        // 最終再驗一次整回合是否合法
        const validation = this.validateWholeTurn();
        if (!validation.valid) {
            this.setMessage(`本回合不合法：${validation.reason}`);
            return;
        }

        const turnScore = this.calculateTurnScore();

        this.playerScore += turnScore;

        // 補牌
        while (this.playerHand.length < this.handSize && this.deck.length > 0) {
            const tile = this.drawTileFromDeck();
            if (tile) this.playerHand.push(tile);
        }

        this.setMessage(`本回合得分：${turnScore}`);
        this.showTurnScore(turnScore);

        this.turnPlacements = [];
        this.turnAxis = null;
        this.selectedHandIndex = null;
        this.clearBoardHighlights();

        this.renderHand();
        this.currentTurn = 'ai';
        this.refreshHud();
        this.updateTurnPreview();

        if (this.isGameEnd()) {
            this.time.delayedCall(300, () => this.showGameEndPanel());
            return;
        }

        this.time.delayedCall(700, () => {
            this.runAiTurn();
        });
    }

    runAiTurn() {
        if (this.currentTurn !== 'ai') return;
        if (this.isAiThinking) return;

        this.isAiThinking = true;
        this.setMessage('AI 思考中...');

        const bestSequence = this.findBestAiTurnSequence();

        this.time.delayedCall(650, () => {
            if (bestSequence && bestSequence.length > 0) {
                this.executeAiSequence(bestSequence);
            } else {
                this.executeAiExchange();
            }

            this.isAiThinking = false;
        });
    }

    findBestAiSingleMove() {
        let bestMove = null;

        for (let handIndex = 0; handIndex < this.aiHand.length; handIndex++) {
            const tile = this.aiHand[handIndex];
            if (!tile) continue;

            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    if (this.board[row][col]) continue;

                    const result = this.canPlaceSingleForAi(row, col, tile);
                    if (!result.valid) continue;

                    // 模擬放下
                    this.board[row][col] = tile;
                    const score = this.calculateSinglePlacementScore(row, col);
                    this.board[row][col] = null;

                    const move = {
                        handIndex,
                        tile,
                        row,
                        col,
                        score
                    };

                    if (!bestMove || move.score > bestMove.score) {
                        bestMove = move;
                    }
                }
            }
        }

        return bestMove;
    }

    findBestAiTurnSequence() {
        const firstMove = this.findBestAiSingleMove();
        if (!firstMove) return null;

        // 先把第一顆暫時放上棋盤，之後測試 row / col 兩種延伸
        this.board[firstMove.row][firstMove.col] = firstMove.tile;

        const remainingHand = this.aiHand.filter((_, i) => i !== firstMove.handIndex);

        // 測試沿 row 延伸
        const rowExtras = this.buildAiAxisFollowupSequence('row', firstMove, remainingHand);
        this.clearTempPlacements(rowExtras);

        // 測試沿 col 延伸
        const colExtras = this.buildAiAxisFollowupSequence('col', firstMove, remainingHand);
        this.clearTempPlacements(colExtras);

        // 清掉第一顆暫放
        this.board[firstMove.row][firstMove.col] = null;

        const rowSequence = [firstMove, ...rowExtras];
        const colSequence = [firstMove, ...colExtras];

        const rowScore = this.scoreAiSequence(rowSequence);
        const colScore = this.scoreAiSequence(colSequence);

        if (rowScore >= colScore) {
            return rowSequence;
        }
        return colSequence;
    }

    buildAiAxisFollowupSequence(axis, firstMove, handPool) {
        const placements = [];
        const remaining = [...handPool];

        while (placements.length < this.aiMaxMovesPerTurn - 1) {
            let best = null;

            for (let poolIndex = 0; poolIndex < remaining.length; poolIndex++) {
                const tile = remaining[poolIndex];
                if (!tile) continue;

                for (let row = 0; row < this.boardSize; row++) {
                    for (let col = 0; col < this.boardSize; col++) {
                        if (this.board[row][col]) continue;

                        if (axis === 'row' && row !== firstMove.row) continue;
                        if (axis === 'col' && col !== firstMove.col) continue;

                        const result = this.canPlaceSingleForAi(row, col, tile);
                        if (!result.valid) continue;

                        // 模擬放下，估這一步的增量分數
                        this.board[row][col] = tile;
                        const score = this.calculateSinglePlacementScore(row, col);
                        this.board[row][col] = null;

                        const move = {
                            poolIndex,
                            tile,
                            row,
                            col,
                            score
                        };

                        if (!best || move.score > best.score) {
                            best = move;
                        }
                    }
                }
            }

            if (!best) break;

            // 把找到的最佳下一顆，暫時留在棋盤上，讓後面的顆數可以接著判
            this.board[best.row][best.col] = best.tile;
            placements.push({
                tile: best.tile,
                row: best.row,
                col: best.col
            });

            remaining.splice(best.poolIndex, 1);
        }

        return placements;
    }

    clearTempPlacements(placements) {
        for (const p of placements) {
            this.board[p.row][p.col] = null;
        }
    }

    scoreAiSequence(sequence) {
        if (!sequence || sequence.length === 0) return 0;

        // 暫時把整組放上去
        for (const p of sequence) {
            this.board[p.row][p.col] = p.tile;
        }

        const score = this.calculatePlacementsScore(sequence);

        // 清掉暫放
        for (const p of sequence) {
            this.board[p.row][p.col] = null;
        }

        return score;
    }

    calculatePlacementsScore(placements) {
        const scoredLines = new Set();
        let score = 0;

        for (const p of placements) {
            const h = this.getPlacedLine(p.row, p.col, 'horizontal');
            const v = this.getPlacedLine(p.row, p.col, 'vertical');

            if (h.length > 1) {
                const key = `H:${this.buildLineKey(h)}`;
                if (!scoredLines.has(key)) {
                    scoredLines.add(key);
                    score += h.length;
                    if (h.length === 6) score += 6;
                }
            }

            if (v.length > 1) {
                const key = `V:${this.buildLineKey(v)}`;
                if (!scoredLines.has(key)) {
                    scoredLines.add(key);
                    score += v.length;
                    if (v.length === 6) score += 6;
                }
            }
        }

        if (score === 0 && placements.length > 0) {
            score = placements.length;
        }

        return score;
    }

    canPlaceSingleForAi(row, col, tile) {
        if (this.board[row][col]) {
            return { valid: false, reason: '格子已有棋子' };
        }

        const permanentCount = this.countPermanentPlacedTiles();

        // 第一手允許任意放
        if (permanentCount === 0) {
            return { valid: true };
        }

        const neighbors = this.getOrthogonalNeighbors(row, col);
        const hasAdjacent = neighbors.some(pos => this.board[pos.row][pos.col]);
        if (!hasAdjacent) {
            return { valid: false, reason: '必須相鄰' };
        }

        const horizontal = this.getLineWithPlacement(row, col, tile, 'horizontal');
        const vertical = this.getLineWithPlacement(row, col, tile, 'vertical');

        if (horizontal.length > 1) {
            const hv = this.isValidLine(horizontal);
            if (!hv.valid) return { valid: false, reason: `橫線不合法：${hv.reason}` };
        }

        if (vertical.length > 1) {
            const vv = this.isValidLine(vertical);
            if (!vv.valid) return { valid: false, reason: `直線不合法：${vv.reason}` };
        }

        return { valid: true };
    }

    calculateSinglePlacementScore(row, col) {
        const h = this.getPlacedLine(row, col, 'horizontal');
        const v = this.getPlacedLine(row, col, 'vertical');

        let score = 0;

        if (h.length > 1) {
            score += h.length;
            if (h.length === 6) score += 6;
        }

        if (v.length > 1) {
            score += v.length;
            if (v.length === 6) score += 6;
        }

        if (score === 0) score = 1;

        return score;
    }

    executeAiSequence(sequence) {
        if (!sequence || sequence.length === 0) {
            this.executeAiExchange();
            return;
        }

        // 正式落子
        for (const p of sequence) {
            this.board[p.row][p.col] = p.tile;
            this.drawTileOnBoard(p.row, p.col, p.tile);
            this.flashCell(p.row, p.col, 0x4dabf7);
        }

        const totalScore = this.calculatePlacementsScore(sequence);

        // 從 AI 手牌移除這些牌（用 uid 比對，最穩）
        for (const p of sequence) {
            const idx = this.aiHand.findIndex(t => t.uid === p.tile.uid);
            if (idx !== -1) {
                this.aiHand.splice(idx, 1);
            }
        }

        while (this.aiHand.length < this.handSize && this.deck.length > 0) {
            this.aiHand.push(this.drawTileFromDeck());
        }

        this.aiScore += totalScore;
        this.turnNumber += 1;

        const labels = sequence.map(p => this.getTileLabel(p.tile)).join('、');
        this.setMessage(`AI 出牌 ${sequence.length} 張：${labels}（+${totalScore} 分）`);

        const last = sequence[sequence.length - 1];
        this.showAiTurnScore(totalScore, last.row, last.col);

        this.currentTurn = 'player';
        this.refreshHud();
        this.updateTurnPreview();

        if (this.isGameEnd()) {
            this.time.delayedCall(300, () => this.showGameEndPanel());
        }
    }

    executeAiExchange() {
        if (this.aiHand.length === 0 || this.deck.length === 0) {
            this.turnNumber += 1;
            this.currentTurn = 'player';
            this.refreshHud();
            this.setMessage('AI 無法出牌，也無法換牌，回到玩家回合');
            return;
        }

        const idx = Math.floor(Math.random() * this.aiHand.length);
        const oldTile = this.aiHand[idx];

        this.deck.push(oldTile);
        this.shuffle(this.deck);
        this.aiHand.splice(idx, 1);

        if (this.deck.length > 0) {
            this.aiHand.push(this.drawTileFromDeck());
        }

        this.turnNumber += 1;
        this.currentTurn = 'player';
        this.refreshHud();
        this.setMessage('AI 沒有合法步，已換 1 張牌');
    }

    canPlaceInCurrentTurn(row, col, tile) {
        // 第一手：允許任意位置
        const totalPlaced = this.countPermanentPlacedTiles() + this.turnPlacements.length;
        if (totalPlaced === 0) {
            return { valid: true };
        }

        // 必須與既有/本回合牌相連
        const neighbors = this.getOrthogonalNeighbors(row, col);
        const hasAdjacent = neighbors.some(pos => this.board[pos.row][pos.col]);
        if (!hasAdjacent) {
            return { valid: false, reason: '必須與棋盤上已有棋子相連' };
        }

        // 同回合只能同一行或同一列
        if (this.turnPlacements.length >= 1) {
            const first = this.turnPlacements[0];

            if (this.turnAxis === 'row' && row !== first.row) {
                return { valid: false, reason: '本回合必須都放在同一行' };
            }

            if (this.turnAxis === 'col' && col !== first.col) {
                return { valid: false, reason: '本回合必須都放在同一列' };
            }

            if (!this.turnAxis && this.turnPlacements.length === 1) {
                const sameRow = row === first.row;
                const sameCol = col === first.col;
                if (!sameRow && !sameCol) {
                    return { valid: false, reason: '第二顆要決定同一行或同一列' };
                }
            }
        }

        // 主線要合法
        const primaryLine = this.getPrimaryLineIfPlaced(row, col, tile);
        if (primaryLine.length > 1) {
            const lineValid = this.isValidLine(primaryLine);
            if (!lineValid.valid) {
                return { valid: false, reason: `主線不合法（${this.getTileLabel(tile)}）：${lineValid.reason}` };
            }
        }

        // 垂直/水平副線也要合法
        const horizontal = this.getLineWithPlacement(row, col, tile, 'horizontal');
        const vertical = this.getLineWithPlacement(row, col, tile, 'vertical');

        if (horizontal.length > 1) {
            const hv = this.isValidLine(horizontal);
            if (!hv.valid) {
                return { valid: false, reason: `橫線不合法：${hv.reason}` };
            }
        }

        if (vertical.length > 1) {
            const vv = this.isValidLine(vertical);
            if (!vv.valid) {
                return { valid: false, reason: `直線不合法：${vv.reason}` };
            }
        }

        return { valid: true };
    }

    validateWholeTurn() {
        // 單顆第一手合法
        if (this.turnPlacements.length === 1 && this.countPermanentPlacedTiles() === 1) {
            // 不特別攔
        }

        // 本回合多顆時，檢查都在同一行/列
        if (this.turnPlacements.length >= 2) {
            const sameRow = this.turnPlacements.every(p => p.row === this.turnPlacements[0].row);
            const sameCol = this.turnPlacements.every(p => p.col === this.turnPlacements[0].col);

            if (!sameRow && !sameCol) {
                return { valid: false, reason: '同回合放牌必須同一行或同一列' };
            }
        }

        // 主線檢查
        const mainLine = this.getMainLineFromTurnPlacements();
        if (mainLine.length > 1) {
            const mainValid = this.isValidLine(mainLine);
            if (!mainValid.valid) {
                return { valid: false, reason: `主線不合法：${mainValid.reason}` };
            }
        }

        // 每顆新牌的副線檢查
        for (const p of this.turnPlacements) {
            const h = this.getPlacedLine(p.row, p.col, 'horizontal');
            const v = this.getPlacedLine(p.row, p.col, 'vertical');

            if (h.length > 1) {
                const hv = this.isValidLine(h);
                if (!hv.valid) return { valid: false, reason: `橫線不合法：${hv.reason}` };
            }

            if (v.length > 1) {
                const vv = this.isValidLine(v);
                if (!vv.valid) return { valid: false, reason: `直線不合法：${vv.reason}` };
            }
        }

        return { valid: true };
    }

    /* =========================
     * 規則 / 線判定
     * ========================= */
    isValidLine(line) {
        if (!line || line.length <= 1) {
            return { valid: true };
        }

        if (line.length > 6) {
            return { valid: false, reason: '一條線最多 6 顆' };
        }

        const colors = line.map(t => t.color);
        const shapes = line.map(t => t.shape);
        const ids = line.map(t => `${t.color}_${t.shape}`);

        const uniqueColors = new Set(colors);
        const uniqueShapes = new Set(shapes);
        const uniqueIds = new Set(ids);

        if (uniqueIds.size !== ids.length) {
            return { valid: false, reason: '出現重複棋子' };
        }

        const sameColor = uniqueColors.size === 1;
        const sameShape = uniqueShapes.size === 1;

        if (sameColor && uniqueShapes.size === line.length) {
            return { valid: true, mode: 'sameColor' };
        }

        if (sameShape && uniqueColors.size === line.length) {
            return { valid: true, mode: 'sameShape' };
        }

        return { valid: false, reason: '必須同色不同形，或同形不同色' };
    }

    getLineWithPlacement(row, col, tile, direction) {
        const line = [];

        if (direction === 'horizontal') {
            let c = col;
            while (c - 1 >= 0 && this.board[row][c - 1]) c--;

            while (c < this.boardSize && (c === col || this.board[row][c])) {
                if (c === col) line.push(tile);
                else line.push(this.board[row][c]);
                c++;
            }
        }

        if (direction === 'vertical') {
            let r = row;
            while (r - 1 >= 0 && this.board[r - 1][col]) r--;

            while (r < this.boardSize && (r === row || this.board[r][col])) {
                if (r === row) line.push(tile);
                else line.push(this.board[r][col]);
                r++;
            }
        }

        return line;
    }

    getPlacedLine(row, col, direction) {
        const tile = this.board[row][col];
        if (!tile) return [];
        return this.getLineWithPlacement(row, col, tile, direction);
    }

    /* 👇👇👇 就貼在這裡 👇👇👇 */

    collectLinePositionsWithPreview(row, col, direction) {
        const positions = [];

        if (direction === 'horizontal') {
            let c = col;
            while (c - 1 >= 0 && this.board[row][c - 1]) c--;

            while (c < this.boardSize) {
                if (c === col) {
                    positions.push({ row, col: c });
                } else if (this.board[row][c]) {
                    positions.push({ row, col: c });
                } else {
                    break;
                }
                c++;
            }
        }

        if (direction === 'vertical') {
            let r = row;
            while (r - 1 >= 0 && this.board[r - 1][col]) r--;

            while (r < this.boardSize) {
                if (r === row) {
                    positions.push({ row: r, col });
                } else if (this.board[r][col]) {
                    positions.push({ row: r, col });
                } else {
                    break;
                }
                r++;
            }
        }

        return positions;
    }

    getPrimaryLineIfPlaced(row, col, tile) {
        if (this.turnPlacements.length === 0) {
            const horizontal = this.getLineWithPlacement(row, col, tile, 'horizontal');
            const vertical = this.getLineWithPlacement(row, col, tile, 'vertical');
            return horizontal.length >= vertical.length ? horizontal : vertical;
        }

        const first = this.turnPlacements[0];
        const sameRow = row === first.row;
        const sameCol = col === first.col;

        if (this.turnAxis === 'row' || (!this.turnAxis && sameRow)) {
            return this.getLineWithPlacement(row, col, tile, 'horizontal');
        }

        if (this.turnAxis === 'col' || (!this.turnAxis && sameCol)) {
            return this.getLineWithPlacement(row, col, tile, 'vertical');
        }

        const h = this.getLineWithPlacement(row, col, tile, 'horizontal');
        const v = this.getLineWithPlacement(row, col, tile, 'vertical');
        return h.length >= v.length ? h : v;
    }

    getMainLineFromTurnPlacements() {
        if (this.turnPlacements.length === 0) return [];

        const first = this.turnPlacements[0];

        if (this.turnPlacements.length === 1) {
            const h = this.getPlacedLine(first.row, first.col, 'horizontal');
            const v = this.getPlacedLine(first.row, first.col, 'vertical');
            return h.length >= v.length ? h : v;
        }

        const sameRow = this.turnPlacements.every(p => p.row === first.row);
        if (sameRow) {
            return this.getPlacedLine(first.row, first.col, 'horizontal');
        }

        return this.getPlacedLine(first.row, first.col, 'vertical');
    }

    getOrthogonalNeighbors(row, col) {
        const result = [];
        const dirs = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        for (const dir of dirs) {
            const nr = row + dir.dr;
            const nc = col + dir.dc;
            if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                result.push({ row: nr, col: nc });
            }
        }

        return result;
    }

    countPermanentPlacedTiles() {
        let count = 0;
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c]) count++;
            }
        }
        return count - this.turnPlacements.length;
    }

    /* =========================
     * 計分
     * ========================= */
    calculateTurnScore() {
        const scoredLines = new Set();
        let score = 0;

        for (const p of this.turnPlacements) {
            const h = this.getPlacedLine(p.row, p.col, 'horizontal');
            const v = this.getPlacedLine(p.row, p.col, 'vertical');

            if (h.length > 1) {
                const key = `H:${this.buildLineKey(h)}`;
                if (!scoredLines.has(key)) {
                    scoredLines.add(key);
                    score += h.length;
                    if (h.length === 6) score += 6;
                }
            }

            if (v.length > 1) {
                const key = `V:${this.buildLineKey(v)}`;
                if (!scoredLines.has(key)) {
                    scoredLines.add(key);
                    score += v.length;
                    if (v.length === 6) score += 6;
                }
            }
        }

        // 若只有第一手單張或沒形成雙向線時
        if (score === 0 && this.turnPlacements.length > 0) {
            score = this.turnPlacements.length;
        }

        return score;
    }

    buildLineKey(line) {
        return line.map(t => `${t.color}_${t.shape}`).sort().join('|');
    }

    /* =========================
     * 遊戲結束
     * ========================= */
    isGameEnd() {
        return this.deck.length === 0 && this.playerHand.length === 0;
    }

    showGameEndPanel() {
        const panel = this.add.rectangle(1010, 420, 300, 210, 0xffffff, 0.96)
            .setStrokeStyle(3, 0xbda78c);

        this.add.text(1010, 355, '本局結束', {
            fontSize: '30px',
            color: '#4b3c31',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(1010, 395, `玩家：${this.playerScore}`, {
            fontSize: '26px',
            color: '#4b3c31'
        }).setOrigin(0.5);

        this.add.text(1010, 432, `AI：${this.aiScore}`, {
            fontSize: '26px',
            color: '#4b3c31'
        }).setOrigin(0.5);

        this.add.text(1010, 468, `回合數：${this.turnNumber - 1}`, {
            fontSize: '22px',
            color: '#6a5848'
        }).setOrigin(0.5);

        const backBg = this.add.rectangle(1010, 525, 180, 56, 0xf9f4ea)
            .setStrokeStyle(3, 0x7b6857)
            .setInteractive({ useHandCursor: true });

        this.add.text(1010, 525, '返回選單', {
            fontSize: '24px',
            color: '#4b3c31',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backBg.on('pointerdown', () => {
            this.scene.start(this.returnScene, {
                shapeColorScore: this.playerScore
            });
        });
    }

    /* =========================
     * 棋子與顯示
     * ========================= */
    drawTileFromDeck() {
        if (this.deck.length <= 0) return null;
        return this.deck.pop();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    drawTileOnBoard(viewRow, col, tile) {
        const cell = this.boardCells[viewRow]?.[col];
        if (!cell) return;

        if (cell.tileContainer) {
            cell.tileContainer.destroy();
            cell.tileContainer = null;
        }

        const x = this.boardStartX + col * this.cellSize;
        const y = this.boardStartY + viewRow * this.cellSize;

        const display = this.createTileDisplay(x, y, tile, {
            width: this.cellSize - 10,
            height: this.cellSize - 10,
            interactive: false
        });

        cell.tileContainer = display.container;
    }

    createTileDisplay(x, y, tile, options = {}) {
        const width = options.width || 64;
        const height = options.height || 64;
        const interactive = options.interactive || false;

        const container = this.add.container(x, y);

        // 🎴 底牌
        const base = this.add.image(0, 0, 'tile_base');
        base.setDisplaySize(width, height);

        // 🖱️ 互動區（透明）
        const bg = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
            .setStrokeStyle(2, 0x8f7e6b);

        if (interactive) {
            bg.setInteractive({ useHandCursor: true });
        }

        // ⭐ 形狀 icon（放大版）
        const shapeIcon = this.add.image(0, 2, `shape_${tile.shape}`);
        shapeIcon.setDisplaySize(width * 0.6, width * 0.6); // 🔥 原本0.42 → 改大
        shapeIcon.setTint(this.colorHexMap[tile.color]);

        container.add([base, bg, shapeIcon]);

        return { container, bg };
    }

    getTileLabel(tile) {
        if (!tile) return '';
        return `${this.shapeLabelMap[tile.shape]}${this.colorLabelMap[tile.color]}`;
    }

    clearBoardHighlights() {
        this.highlightedValidMoves = [];

        for (let row = 0; row < this.visibleRows; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.boardCells[row]?.[col];
                if (!cell || !cell.bg) continue;

                if (!this.board[row][col]) {
                    cell.bg.setStrokeStyle(2, 0xbfae98);
                }
            }
        }
    }

    clearConflictHighlights() {
        if (this.conflictFlashTimers?.length) {
            for (const timer of this.conflictFlashTimers) {
                if (timer && !timer.hasDispatched) {
                    timer.remove(false);
                }
            }
        }
        this.conflictFlashTimers = [];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.boardCells[row]?.[col];
                if (!cell?.bg) continue;

                // 只重設空格提示框，不碰已有棋子格
                if (!this.board[row][col]) {
                    cell.bg.setStrokeStyle(2, 0xbfae98);
                }
            }
        }

        // 把可放綠框補回去
        if (this.selectedHandIndex !== null && !this.exchangeMode) {
            for (const pos of this.highlightedValidMoves) {
                const cell = this.boardCells[pos.row]?.[pos.col];
                if (cell?.bg && !this.board[pos.row][pos.col]) {
                    cell.bg.setStrokeStyle(4, 0x5bbf5b);
                }
            }
        }
    }

    flashConflictLineCells(positions, color = 0xff6b6b, duration = 650) {
        if (!positions || positions.length === 0) return;

        for (const pos of positions) {
            const cell = this.boardCells[pos.row]?.[pos.col];
            if (!cell?.bg) continue;
            cell.bg.setStrokeStyle(4, color);
        }

        const timer = this.time.delayedCall(duration, () => {
            this.clearConflictHighlights();
        });

        this.conflictFlashTimers.push(timer);
    }

    buildLinePositions(row, col, direction) {
        const positions = [];

        if (direction === 'horizontal') {
            let c = col;
            while (c - 1 >= 0 && this.board[row][c - 1]) c--;

            while (c < this.boardSize && this.board[row][c]) {
                positions.push({ row, col: c });
                c++;
            }
        }

        if (direction === 'vertical') {
            let r = row;
            while (r - 1 >= 0 && this.board[r - 1][col]) r--;

            while (r < this.boardSize && this.board[r][col]) {
                positions.push({ row: r, col });
                r++;
            }
        }

        return positions;
    }

    analyzePlacementConflict(row, col, tile) {
        const analysis = {
            horizontal: { valid: true, reason: '', positions: [] },
            vertical: { valid: true, reason: '', positions: [] }
        };

        const horizontalLine = this.getLineWithPlacement(row, col, tile, 'horizontal');
        const verticalLine = this.getLineWithPlacement(row, col, tile, 'vertical');

        if (horizontalLine.length > 1) {
            const result = this.isValidLine(horizontalLine);
            if (!result.valid) {
                analysis.horizontal.valid = false;
                analysis.horizontal.reason = result.reason;
                analysis.horizontal.positions = this.collectLinePositionsWithPreview(row, col, 'horizontal');
            }
        }

        if (verticalLine.length > 1) {
            const result = this.isValidLine(verticalLine);
            if (!result.valid) {
                analysis.vertical.valid = false;
                analysis.vertical.reason = result.reason;
                analysis.vertical.positions = this.collectLinePositionsWithPreview(row, col, 'vertical');
            }
        }

        return analysis;
    }

    highlightValidMoves() {
        this.clearBoardHighlights();

        if (this.selectedHandIndex === null) return;
        if (this.exchangeMode) return;

        const tile = this.playerHand[this.selectedHandIndex];
        if (!tile) return;

        for (let row = 0; row < this.visibleRows; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col]) continue;
                if (this.turnPlacements.some(p => p.row === row && p.col === col)) continue;

                const result = this.canPlaceInCurrentTurn(row, col, tile);
                if (result.valid) {
                    const cell = this.boardCells[row]?.[col];
                    if (cell?.bg) {
                        cell.bg.setStrokeStyle(4, 0x5bbf5b);
                        this.highlightedValidMoves.push({ row, col });
                    }
                }
            }
        }
    }

    buildDetailedInvalidMessage(result) {
        if (!result || result.valid) return '可以放置';

        if (result.reason) {
            return `不能放這裡：${result.reason}`;
        }

        return '不能放這裡';
    }

    flashCell(row, col, color) {
        if (row < 0 || row >= this.visibleRows) return;

        const cell = this.boardCells[row]?.[col];
        if (!cell || !cell.bg) return;

        const originalStroke = 0xbfae98;
        cell.bg.setStrokeStyle(4, color);

        this.time.delayedCall(220, () => {
            if (cell.bg) {
                cell.bg.setStrokeStyle(2, originalStroke);
            }
        });
    }

    showTurnScore(score) {
        const txt = this.add.text(1010, 265, `+${score}`, {
            fontSize: '34px',
            color: '#2e7d32',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: 230,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    showAiTurnScore(score, row, col) {
        const viewRow = row - this.viewRowStart;
        if (viewRow < 0 || viewRow >= this.visibleRows) return;

        const x = this.boardStartX + col * this.cellSize;
        const y = this.boardStartY + viewRow * this.cellSize - 18;

        const txt = this.add.text(x, y, `AI +${score}`, {
            fontSize: '24px',
            color: '#1d4ed8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 26,
            alpha: 0,
            duration: 850,
            onComplete: () => txt.destroy()
        });
    }
}