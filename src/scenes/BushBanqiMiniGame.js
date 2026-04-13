// src/scenes/BushBanqiMiniGame.js
// 森林益智樂園用：中國象棋暗棋小遊戲（Phaser Scene 版）
// 規則：AI 模式下，第一顆翻到哪方，玩家就操作哪方

export default class BushBanqiMiniGame extends Phaser.Scene {
    constructor() {
        super('BushBanqiMiniGame');
    }

    init(data = {}) {
        this.returnScene = data.returnScene || 'MiniGameHub';
        this.mode = data.mode || 'ai'; // 'ai' | 'pvp'
        this.onComplete = data.onComplete || null;
        this.stageId = data.stageId || 'banqi_01';
    }

    create() {
        this.initConstants();
        this.initState();
        this.createBackground();
        this.createTitleBar();
        this.createBoardArea();
        this.createSidePanel();
        this.startNewGame();
    }

    initConstants() {
        this.BOARD_ROWS = 4;
        this.BOARD_COLS = 8;
        this.CELL_SIZE = 88;
        this.BOARD_X = 80;
        this.BOARD_Y = 170;

        this.COLORS = {
            bgTop: 0xf6f1e8,
            bgBottom: 0xe6d7bb,
            boardFrame: 0xc79556,
            boardInner: 0xd8ae72,
            cell: 0xe9c98e,
            line: 0xa06d39,
            card: 0xfffbf4,
            cardLine: 0xd8c2a0,
            textDark: '#4a3420',
            textSoft: '#7c6547',
            red: 0xd85d53,
            black: 0x536273,
            gold: 0xf5d871,
            green: 0x8ecc9d,
            pink: 0xf0b5b5
        };

        this.PIECE_ORDER = {
            king: 7,
            advisor: 6,
            elephant: 5,
            rook: 4,
            knight: 3,
            cannon: 2,
            pawn: 1
        };

        this.PIECE_VALUE = {
            king: 700,
            advisor: 260,
            elephant: 260,
            rook: 420,
            knight: 320,
            cannon: 300,
            pawn: 120
        };

        this.PIECE_LABELS = {
            red: {
                king: '帥',
                advisor: '仕',
                elephant: '相',
                rook: '俥',
                knight: '傌',
                cannon: '炮',
                pawn: '兵'
            },
            black: {
                king: '將',
                advisor: '士',
                elephant: '象',
                rook: '車',
                knight: '馬',
                cannon: '包',
                pawn: '卒'
            }
        };

        this.PIECE_POOL = [
            ['king', 1],
            ['advisor', 2],
            ['elephant', 2],
            ['rook', 2],
            ['knight', 2],
            ['cannon', 2],
            ['pawn', 5]
        ];
    }

    initState() {
        this.board = [];
        this.turn = 'red';
        this.selectedIndex = null;
        this.firstReveal = true;
        this.gameOver = false;
        this.aiThinking = false;
        this.logs = [];
        this.winner = null;

        this.playerColor = null;
        this.aiColor = null;

        this.boardCells = [];
    }

    createBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(
            this.COLORS.bgTop,
            this.COLORS.bgTop,
            this.COLORS.bgBottom,
            this.COLORS.bgBottom,
            1
        );
        g.fillRect(0, 0, 1280, 720);

        this.add.rectangle(640, 360, 1210, 660, 0xffffff, 0.68)
            .setStrokeStyle(2, 0xcdb58f, 0.55);

        this.add.rectangle(640, 90, 1160, 78, 0xfffbf3, 0.96)
            .setStrokeStyle(2, 0xcdb58f, 0.75);

        this.boardTurnGlow = this.add.rectangle(467, 346, 995, 414, 0xf6da75, 0.08)
            .setStrokeStyle(4, 0xf6da75, 0.18);
    }

    createTitleBar() {
        this.add.text(165, 64, '象棋暗棋', {
            fontSize: '34px',
            color: this.COLORS.textDark,
            fontStyle: 'bold'
        });

        this.subTitleText = this.add.text(380, 70, 'AI 模式：第一顆翻到哪方，你就操作哪方。', {
            fontSize: '18px',
            color: this.COLORS.textSoft
        }).setOrigin(0, 0.5);

        // 返回鍵
        this.backBtn = this.createButton(110, 89, '返回', 120, 48, () => {
            this.scene.start(this.returnScene || 'MiniGameHub');
        });

        this.modeBtn = this.createButton(
            900,
            89,
            this.mode === 'ai' ? '模式：玩家 vs AI' : '模式：雙人對戰',
            240,
            48,
            () => {
                this.mode = this.mode === 'ai' ? 'pvp' : 'ai';
                this.modeBtn.label.setText(
                    this.mode === 'ai' ? '模式：玩家 vs AI' : '模式：雙人對戰'
                );
                this.startNewGame();
            }
        );

        this.restartBtn = this.createButton(1100, 89, '重新開局', 160, 48, () => {
            this.startNewGame();
        });
    }

    createBoardArea() {
        const boardW = this.BOARD_COLS * this.CELL_SIZE + 30;
        const boardH = this.BOARD_ROWS * this.CELL_SIZE + 30;
        const centerX = this.BOARD_X + boardW / 2;
        const centerY = this.BOARD_Y + boardH / 2;

        this.add.rectangle(centerX, centerY, boardW, boardH, this.COLORS.boardFrame, 1)
            .setStrokeStyle(4, this.COLORS.line, 0.88);

        this.add.rectangle(centerX, centerY, boardW - 14, boardH - 14, this.COLORS.boardInner, 0.28)
            .setStrokeStyle(2, 0xf8e6c8, 0.18);

        for (let r = 0; r < this.BOARD_ROWS; r++) {
            for (let c = 0; c < this.BOARD_COLS; c++) {
                const x = this.BOARD_X + 15 + c * this.CELL_SIZE + this.CELL_SIZE / 2;
                const y = this.BOARD_Y + 15 + r * this.CELL_SIZE + this.CELL_SIZE / 2;
                const index = r * this.BOARD_COLS + c;

                const cellBg = this.add.rectangle(
                    x,
                    y,
                    this.CELL_SIZE - 10,
                    this.CELL_SIZE - 10,
                    this.COLORS.cell,
                    1
                )
                    .setStrokeStyle(2, 0xb48349, 0.42)
                    .setInteractive({ useHandCursor: true });

                const pieceShadow = this.add.circle(x + 2, y + 4, 30, 0x000000, 0.08);
                const pieceCircle = this.add.circle(x, y, 29, 0xd8b27a)
                    .setStrokeStyle(4, 0xf1e4c6, 0.75);

                const pieceText = this.add.text(x, y, '暗', {
                    fontSize: '24px',
                    color: '#7b4c1e',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                cellBg.on('pointerover', () => {
                    if (this.gameOver || this.aiThinking) return;
                    this.tweens.add({
                        targets: [cellBg, pieceCircle, pieceShadow],
                        scale: 1.03,
                        duration: 100
                    });
                });

                cellBg.on('pointerout', () => {
                    this.tweens.add({
                        targets: [cellBg, pieceCircle, pieceShadow],
                        scale: 1,
                        duration: 100
                    });
                });

                cellBg.on('pointerdown', () => this.handleCellClick(index));

                this.boardCells[index] = {
                    cellBg,
                    pieceShadow,
                    pieceCircle,
                    pieceText
                };
            }
        }
    }

    createSidePanel() {
        this.addCard(1010, 230, 255, 185);
        this.add.text(885, 160, '目前狀態', {
            fontSize: '24px',
            color: this.COLORS.textDark,
            fontStyle: 'bold'
        });
        this.statusText = this.add.text(885, 205, '', {
            fontSize: '18px',
            color: this.COLORS.textDark,
            lineSpacing: 8,
            wordWrap: { width: 215 }
        });

        this.addCard(1010, 435, 255, 185);
        this.add.text(885, 365, '簡易規則', {
            fontSize: '24px',
            color: this.COLORS.textDark,
            fontStyle: 'bold'
        });
        this.add.text(885, 410,
            '翻棋算一步\n上下左右一格\n炮吃子需隔一枚棋\n兵/卒可吃將/帥\n吃光對方或無法行動即勝',
            {
                fontSize: '17px',
                color: this.COLORS.textDark,
                lineSpacing: 8,
                wordWrap: { width: 215 }
            }
        );

        this.addCard(1010, 620, 255, 155);
        this.add.text(885, 555, '操作紀錄', {
            fontSize: '24px',
            color: this.COLORS.textDark,
            fontStyle: 'bold'
        });
        this.logText = this.add.text(885, 598, '', {
            fontSize: '16px',
            color: this.COLORS.textDark,
            lineSpacing: 8,
            wordWrap: { width: 215 }
        });

        this.resultOverlay = this.add.container(640, 360).setDepth(999).setVisible(false);

        const resultMask = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.22);
        const resultBg = this.add.rectangle(0, 0, 460, 290, 0xfff8ea, 0.98)
            .setStrokeStyle(3, 0xd0b07d, 0.85);

        this.resultTitle = this.add.text(0, -80, '對局結束', {
            fontSize: '34px',
            color: this.COLORS.textDark,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.resultDesc = this.add.text(0, -10, '', {
            fontSize: '24px',
            color: this.COLORS.textDark,
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        const againBtn = this.createButton(0, 76, '再玩一次', 150, 50, () => {
            this.resultOverlay.setVisible(false);
            this.startNewGame();
        });

        const leaveBtn = this.createButton(0, 138, '返回選單', 150, 50, () => {
            console.log('返回選單 clicked');
            this.finishAndReturn();
        });

        this.resultOverlay.add([
            resultMask,
            resultBg,
            this.resultTitle,
            this.resultDesc,
            againBtn.container,
            leaveBtn.container
        ]);
        }
    addCard(x, y, w, h) {
        this.add.rectangle(x, y, w, h, 0xfffbf4, 0.94)
            .setStrokeStyle(2, this.COLORS.cardLine, 0.7);
    }

    createButton(x, y, label, w, h, onClick, parentContainer = null) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, w, h, 0x9b6a37, 1)
            .setStrokeStyle(2, 0xffffff, 0.14)
            .setInteractive({ useHandCursor: true });

        const shine = this.add.rectangle(0, -h * 0.12, w * 0.84, h * 0.22, 0xffffff, 0.08);

        const text = this.add.text(0, 0, label, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.03,
                duration: 110
            });
        });

        bg.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 110
            });
        });

        bg.on('pointerdown', onClick);

        container.add([bg, shine, text]);
        if (parentContainer) parentContainer.add(container);
        return { container, bg, label: text };
    }

    startNewGame() {
        this.board = this.createInitialPieces();
        this.turn = 'red';
        this.selectedIndex = null;
        this.firstReveal = true;
        this.gameOver = false;
        this.aiThinking = false;
        this.winner = null;
        this.playerColor = null;
        this.aiColor = null;

        this.logs = [
            this.mode === 'ai'
                ? 'AI 模式：第一顆翻到哪方，你就操作哪方。'
                : '雙人對戰開始。'
        ];

        this.resultOverlay.setVisible(false);
        this.subTitleText.setText(
            this.mode === 'ai'
                ? 'AI 模式：第一顆翻到哪方，你就操作哪方。'
                : '雙人輪流進行。'
        );

        this.refreshAll();
    }

    createInitialPieces() {
        const pieces = [];
        ['red', 'black'].forEach(color => {
            this.PIECE_POOL.forEach(([type, count]) => {
                for (let i = 0; i < count; i++) {
                    pieces.push({ color, type, revealed: false });
                }
            });
        });
        return Phaser.Utils.Array.Shuffle(pieces);
    }

    handleCellClick(index) {
        if (this.gameOver || this.aiThinking) return;

        if (this.mode === 'ai') {
            if (this.playerColor) {
                if (this.turn !== this.playerColor) return;
            }
        }

        const piece = this.board[index];

        if (piece && !piece.revealed) {
            this.revealPiece(index);
            return;
        }

        if (this.selectedIndex === null) {
            if (piece && piece.revealed && piece.color === this.turn) {
                this.selectedIndex = index;
                this.refreshBoard();
                this.refreshStatus();
            }
            return;
        }

        if (this.selectedIndex === index) {
            this.selectedIndex = null;
            this.refreshBoard();
            this.refreshStatus();
            return;
        }

        if (piece && piece.revealed && piece.color === this.turn) {
            this.selectedIndex = index;
            this.refreshBoard();
            this.refreshStatus();
            return;
        }

        const moved = this.tryMove(this.selectedIndex, index);
        if (!moved) {
            this.selectedIndex = null;
            this.refreshBoard();
            this.refreshStatus();
        }
    }

    revealPiece(index) {
        const piece = this.board[index];
        if (!piece || piece.revealed || this.gameOver) return;

        piece.revealed = true;

        if (this.firstReveal) {
            this.firstReveal = false;

            if (this.mode === 'ai') {
                this.playerColor = piece.color;
                this.aiColor = piece.color === 'red' ? 'black' : 'red';
                this.turn = this.aiColor;

                this.pushLog(`你翻開了${this.sideText(piece.color)}${this.pieceName(piece)}。你是${this.sideText(this.playerColor)}，AI 是${this.sideText(this.aiColor)}。`);
                this.refreshAll();
                this.maybeRunAI();
                return;
            }

            this.turn = piece.color;
            this.pushLog(`先翻到${this.sideText(piece.color)}${this.pieceName(piece)}，由該方先手。`);
            this.refreshAll();
            return;
        }

        this.pushLog(`${this.sideText(this.turn)}翻開了${this.sideText(piece.color)}${this.pieceName(piece)}。`);
        this.switchTurn();
    }

    tryMove(from, to) {
        if (!this.canMoveOrCapture(from, to) || this.gameOver) return false;

        const moving = this.board[from];
        const target = this.board[to];

        if (target) {
            this.pushLog(`${this.sideText(moving.color)}${this.pieceName(moving)}吃掉${this.sideText(target.color)}${this.pieceName(target)}。`);
        } else {
            this.pushLog(`${this.sideText(moving.color)}${this.pieceName(moving)}移動。`);
        }

        this.board[to] = moving;
        this.board[from] = null;
        this.switchTurn();
        return true;
    }

    switchTurn() {
        this.turn = this.turn === 'red' ? 'black' : 'red';
        this.selectedIndex = null;
        this.checkWinner();
        this.refreshAll();
        this.maybeRunAI();
    }

    maybeRunAI() {
        if (this.mode !== 'ai' || this.gameOver || this.aiThinking) return;
        if (!this.aiColor || this.turn !== this.aiColor) return;

        this.aiThinking = true;
        this.refreshStatus();

        this.time.delayedCall(520, () => {
            this.runAI();
            this.aiThinking = false;
            this.refreshAll();
        });
    }

    runAI() {
        if (!this.aiColor || this.turn !== this.aiColor || this.gameOver) return;

        const moves = this.getAllMovesFor(this.aiColor);
        const captures = moves.filter(m => !!m.target);

        if (captures.length > 0) {
            captures.sort((a, b) => this.evaluateMove(b) - this.evaluateMove(a));
            this.tryMove(captures[0].from, captures[0].to);
            return;
        }

        const hidden = this.getHiddenIndices();
        if (hidden.length > 0) {
            const choice = Phaser.Utils.Array.GetRandom(hidden);
            this.revealPiece(choice);
            return;
        }

        if (moves.length > 0) {
            moves.sort((a, b) => this.evaluateMove(b) - this.evaluateMove(a));
            this.tryMove(moves[0].from, moves[0].to);
            return;
        }

        const playerCanMove = this.sideHasActionablePiece(this.playerColor || 'red');
        if (!playerCanMove) {
            this.endGame(null, '平手');
        } else {
            this.pushLog(`${this.sideText(this.aiColor)}無法行動，略過回合。`);
            this.turn = this.playerColor;
            this.refreshAll();
        }
    }

    evaluateMove(move) {
        let score = 0;

        if (move.target) {
            score += (this.PIECE_VALUE[move.target.type] || 0) + 120;
            if (move.piece.type === 'cannon') score += 25;
        } else {
            score += this.isLikelySafeMove(move.piece.color, move.to) ? 18 : -20;
        }

        if (!this.isLikelySafeMove(move.piece.color, move.to)) {
            score -= (this.PIECE_VALUE[move.piece.type] || 0) * 0.45;
        }

        return score + Math.random() * 8;
    }

    isLikelySafeMove(color, toIndex) {
        const enemy = color === 'red' ? 'black' : 'red';
        const oldTurn = this.turn;
        this.turn = enemy;

        for (let i = 0; i < this.board.length; i++) {
            const piece = this.board[i];
            if (!piece || !piece.revealed || piece.color !== enemy) continue;
            const moves = this.getValidMoves(i);
            if (moves.includes(toIndex)) {
                this.turn = oldTurn;
                return false;
            }
        }

        this.turn = oldTurn;
        return true;
    }

    getAllMovesFor(color) {
        const result = [];
        const oldTurn = this.turn;
        this.turn = color;

        for (let i = 0; i < this.board.length; i++) {
            const piece = this.board[i];
            if (!piece || !piece.revealed || piece.color !== color) continue;
            const moves = this.getValidMoves(i);
            moves.forEach(to => {
                result.push({
                    from: i,
                    to,
                    piece,
                    target: this.board[to]
                });
            });
        }

        this.turn = oldTurn;
        return result;
    }

    getHiddenIndices() {
        const result = [];
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] && !this.board[i].revealed) result.push(i);
        }
        return result;
    }

    sideHasAnyPiece(color) {
        return this.board.some(p => p && p.color === color);
    }

    sideHasActionablePiece(color) {
        const oldTurn = this.turn;
        this.turn = color;

        for (let i = 0; i < this.board.length; i++) {
            const piece = this.board[i];
            if (!piece || !piece.revealed || piece.color !== color) continue;
            if (this.getValidMoves(i).length > 0) {
                this.turn = oldTurn;
                return true;
            }
        }

        this.turn = oldTurn;
        return false;
    }

    checkWinner() {
        const redExists = this.sideHasAnyPiece('red');
        const blackExists = this.sideHasAnyPiece('black');

        if (!redExists) {
            this.endGame('black', '黑方獲勝');
            return;
        }

        if (!blackExists) {
            this.endGame('red', '紅方獲勝');
            return;
        }

        const redCanMove = this.sideHasActionablePiece('red');
        const blackCanMove = this.sideHasActionablePiece('black');
        const hiddenLeft = this.getHiddenIndices().length > 0;

        if (!hiddenLeft && !redCanMove && !blackCanMove) {
            this.endGame(null, '平手');
            return;
        }

        if (!hiddenLeft) {
            if (!redCanMove && blackCanMove) {
                this.endGame('black', '黑方獲勝');
            } else if (!blackCanMove && redCanMove) {
                this.endGame('red', '紅方獲勝');
            }
        }
    }

    endGame(winnerColor, resultText) {
        if (this.gameOver) return;

        this.gameOver = true;
        this.winner = winnerColor;
        this.pushLog(`🏆 ${resultText}`);
        this.refreshAll();

        this.resultTitle.setText('對局結束');
        this.resultDesc.setText(`${resultText}\n${this.buildRewardText(winnerColor)}`);
        this.resultOverlay.setVisible(true);
    }

    buildRewardText(winnerColor) {
        if (winnerColor === 'red') return '獎勵：水晶 +1\n聲望 +1';
        if (winnerColor === 'black') return '再接再厲，下次一定贏。';
        return '平手：水晶 +0';
    }

    finishAndReturn() {
        const reward = this.buildResultPayload();

        if (typeof this.onComplete === 'function') {
            this.onComplete(reward);
        }

        this.scene.start(this.returnScene, {
            fromMiniGame: true,
            miniGameId: 'banqi',
            result: reward
        });
    }

    buildResultPayload() {
        const isWin = this.winner === 'red';
        const isDraw = this.winner === null;

        return {
            miniGameId: 'banqi',
            stageId: this.stageId,
            result: isWin ? 'win' : (isDraw ? 'draw' : 'lose'),
            winner: this.winner,
            crystals: isWin ? 1 : 0,
            reputation: isWin ? 1 : 0,
            bonusText: isWin ? '暗棋勝利' : (isDraw ? '暗棋平手' : '暗棋失敗')
        };
    }

    canMoveOrCapture(from, to) {
        const moving = this.board[from];
        const target = this.board[to];

        if (!moving || !moving.revealed || moving.color !== this.turn) return false;
        if (from === to) return false;

        if (moving.type === 'cannon') {
            if (!this.sameLine(from, to)) return false;
            const between = this.piecesBetween(from, to).filter(i => this.board[i] !== null);

            if (target === null) return this.isAdjacent(from, to);

            return target.revealed && target.color !== moving.color && between.length === 1;
        }

        if (!this.isAdjacent(from, to)) return false;
        if (target === null) return true;
        return this.canCapture(moving, target);
    }

    getValidMoves(index) {
        const piece = this.board[index];
        if (!piece || !piece.revealed || piece.color !== this.turn) return [];

        const result = [];
        for (let i = 0; i < this.board.length; i++) {
            if (this.canMoveOrCapture(index, i)) result.push(i);
        }
        return result;
    }

    canCapture(attacker, defender) {
        if (!attacker || !defender) return false;
        if (!attacker.revealed || !defender.revealed) return false;
        if (attacker.color === defender.color) return false;

        if (attacker.type === 'cannon') return true;
        if (attacker.type === 'pawn' && defender.type === 'king') return true;
        if (attacker.type === 'king' && defender.type === 'pawn') return false;

        return this.PIECE_ORDER[attacker.type] >= this.PIECE_ORDER[defender.type];
    }

    isAdjacent(a, b) {
        const p1 = this.posToRC(a);
        const p2 = this.posToRC(b);
        return Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c) === 1;
    }

    sameLine(a, b) {
        const p1 = this.posToRC(a);
        const p2 = this.posToRC(b);
        return p1.r === p2.r || p1.c === p2.c;
    }

    piecesBetween(a, b) {
        const p1 = this.posToRC(a);
        const p2 = this.posToRC(b);
        const result = [];

        if (p1.r === p2.r) {
            const start = Math.min(p1.c, p2.c);
            const end = Math.max(p1.c, p2.c);
            for (let c = start + 1; c < end; c++) {
                result.push(this.rcToPos(p1.r, c));
            }
        } else if (p1.c === p2.c) {
            const start = Math.min(p1.r, p2.r);
            const end = Math.max(p1.r, p2.r);
            for (let r = start + 1; r < end; r++) {
                result.push(this.rcToPos(r, p1.c));
            }
        }

        return result;
    }

    posToRC(index) {
        return {
            r: Math.floor(index / this.BOARD_COLS),
            c: index % this.BOARD_COLS
        };
    }

    rcToPos(r, c) {
        return r * this.BOARD_COLS + c;
    }

    pieceName(piece) {
        return this.PIECE_LABELS[piece.color][piece.type];
    }

    sideText(color) {
        return color === 'red' ? '紅方' : '黑方';
    }

    pushLog(text) {
        this.logs.unshift(text);
        this.logs = this.logs.slice(0, 6);
    }

    refreshAll() {
        this.refreshBoard();
        this.refreshStatus();
        this.refreshLog();
    }

    refreshBoard() {
        const validMoves = this.selectedIndex !== null ? this.getValidMoves(this.selectedIndex) : [];

        if (this.turn === 'red') {
            this.boardTurnGlow.setFillStyle(0xf0b5b5, 0.08);
            this.boardTurnGlow.setStrokeStyle(4, 0xf0b5b5, 0.20);
        } else {
            this.boardTurnGlow.setFillStyle(0xaec0d7, 0.08);
            this.boardTurnGlow.setStrokeStyle(4, 0xaec0d7, 0.20);
        }

        for (let i = 0; i < this.board.length; i++) {
            const piece = this.board[i];
            const ui = this.boardCells[i];
            if (!ui) continue;

            ui.cellBg.setFillStyle(this.COLORS.cell, 1);
            ui.cellBg.setScale(1);
            ui.pieceCircle.setScale(1);
            ui.pieceShadow.setScale(1);

            if (this.selectedIndex === i) {
                ui.cellBg.setStrokeStyle(4, this.COLORS.gold, 1);
                ui.cellBg.setScale(1.03);
                ui.pieceCircle.setScale(1.05);
                ui.pieceShadow.setScale(1.05);
            } else if (validMoves.includes(i)) {
                ui.cellBg.setStrokeStyle(4, piece ? this.COLORS.pink : this.COLORS.green, 1);
            } else {
                ui.cellBg.setStrokeStyle(2, 0xb48349, 0.42);
            }

            if (!piece) {
                ui.pieceShadow.setVisible(false);
                ui.pieceCircle.setVisible(false);
                ui.pieceText.setVisible(false);
                continue;
            }

            ui.pieceShadow.setVisible(true);
            ui.pieceCircle.setVisible(true);
            ui.pieceText.setVisible(true);

            if (!piece.revealed) {
                ui.pieceCircle.setFillStyle(0xd7b076, 1);
                ui.pieceCircle.setStrokeStyle(4, 0xf4e5c7, 0.82);
                ui.pieceText.setText('');
                ui.pieceText.setColor('#7b4c1e');
            } else {
                ui.pieceCircle.setFillStyle(
                    piece.color === 'red' ? this.COLORS.red : this.COLORS.black,
                    1
                );
                ui.pieceCircle.setStrokeStyle(4, 0xf8ecda, 0.9);
                ui.pieceText.setText(this.pieceName(piece));
                ui.pieceText.setColor('#ffffff');
            }
        }
    }

    refreshStatus() {
        const revealed = this.board.filter(p => p && p.revealed).length;
        const hidden = this.board.filter(p => p && !p.revealed).length;
        const selected = this.selectedIndex !== null && this.board[this.selectedIndex]
            ? this.pieceName(this.board[this.selectedIndex])
            : '無';

        let text = '';
        text += `模式：${this.mode === 'ai' ? '玩家 vs AI' : '雙人對戰'}\n`;

        if (this.mode === 'ai') {
            text += `你方：${this.playerColor ? this.sideText(this.playerColor) : '未決定'}\n`;
            text += `AI：${this.aiColor ? this.sideText(this.aiColor) : '未決定'}\n`;
        }

        text += `回合：${this.sideText(this.turn)}\n`;
        text += `已翻：${revealed} 枚\n`;
        text += `未翻：${hidden} 枚\n`;
        text += `選中：${selected}`;

        if (this.aiThinking) {
            text += `\nAI 思考中...`;
        }

        this.statusText.setText(text);
    }

    refreshLog() {
        this.logText.setText(this.logs.join('\n'));
    }
}