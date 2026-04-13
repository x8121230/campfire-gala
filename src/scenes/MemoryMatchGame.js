export default class MemoryMatchGame extends Phaser.Scene {
    constructor() {
        super('MemoryMatchGame');
    }

    create(data) {
        this.canFlip = true;
        this.firstCard = null;
        this.secondCard = null;
        this.openedCards = [];
        this.matchedPairs = 0;

        // 你如果有時間限制可用
        this.gameEnded = false;
        this.timeLeft = 60;

        // 🔥 關掉首頁音樂
        this.sound.stopAll();

        this.canFlip = true;
        this.firstCard = null;
        this.secondCard = null;

        // 音效初始化
        this.setupAudio();
        
        this.returnScene = data?.returnScene || 'MiniGameHub';

        // =========================
        // 設定
        // =========================
        this.aiDifficulty = data?.aiDifficulty || 'normal';   // easy / normal / hard
        this.matchMode = data?.matchMode || 'same';           // same / animalFood / animalShadow

        // =========================
        // 棋盤設定
        // =========================
        this.cols = 5;
        this.rows = 4;
        this.totalPairs = (this.cols * this.rows) / 2;

        this.cardSize = 122;

        this.gapX = 128;   // 比現在稍微緊一點
        this.gapY = 122;

        const boardWidth = (this.cols - 1) * this.gapX + this.cardSize;
        const boardHeight = (this.rows - 1) * this.gapY + this.cardSize;

        // ⭐ 關鍵（對齊背景亮區）
        const centerX = 730;   // 👉 再往右一點
        const centerY = 425;   // 👉 稍微往下

        this.startX = centerX - boardWidth / 2;
        this.startY = centerY - boardHeight / 2;

        this.firstCard = null;
        this.secondCard = null;
        this.lockBoard = false;
        this.gameEnded = false;

        this.playerScore = 0;
        this.aiScore = 0;
        this.turn = 'player';

        // AI 記憶：pairId -> Set(index)
        this.aiMemory = {};

        // 背景
        this.add.image(640, 360, 'mm_bg_forest')
            .setDisplaySize(1280, 720)
            .setDepth(-100);

        this.createUI();
        this.createCards();
    }

    setupAudio() {
        // BGM
        let bgm = this.sound.get('memory_bgm');

        if (!bgm) {
            bgm = this.sound.add('memory_bgm', {
                loop: true,
                volume: 0.38
            });
        }

        if (!bgm.isPlaying) {
            bgm.play();
        }

        this.memoryBgm = bgm;

        // 單次音效
        this.sfxFlip = this.sound.add('mm_flip', { volume: 0.45 });
        this.sfxMatch = this.sound.add('mm_match', { volume: 0.55 });
        this.sfxWrong = this.sound.add('mm_wrong', { volume: 0.5 });
        this.sfxWin = this.sound.add('mm_win', { volume: 0.65 });
        this.sfxLose = this.sound.add('mm_lose', { volume: 0.65 });

        // 場景結束時停止 BGM
        this.events.once('shutdown', () => {
            if (this.memoryBgm) {
                this.memoryBgm.stop();
            }
        });

        this.events.once('destroy', () => {
            if (this.memoryBgm) {
                this.memoryBgm.stop();
            }
        });
    }

    playFlipSound() {
        if (this.sfxFlip) this.sfxFlip.play();
    }

    playMatchSound() {
        if (this.sfxMatch) this.sfxMatch.play();
    }

    playWrongSound() {
        if (this.sfxWrong) this.sfxWrong.play();
    }

    playWinSound() {
        if (this.sfxWin) this.sfxWin.play();
    }

    playLoseSound() {
        if (this.sfxLose) this.sfxLose.play();
    }

    stopMemoryBgm() {
        if (this.memoryBgm && this.memoryBgm.isPlaying) {
            this.memoryBgm.stop();
        }
    }

    createUI() {
        this.titleText = this.add.text(40, 28, '記憶翻牌', {
            fontSize: '30px',
            color: '#f6f1e7',
            fontStyle: 'bold'
        });

        this.turnText = this.add.text(40, 95, `${this.turn === 'player' ? '玩家回合' : 'AI回合'}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.scoreText = this.add.text(40, 145, '玩家:0  AI:0', {
            fontSize: '22px',
            color: '#f0e6d2'
        });

        this.modeText = this.add.text(40, 195, `模式：${this.getModeLabel()}`, {
            fontSize: '18px',
            color: '#d6c7ab'
        });

        this.aiText = this.add.text(40, 232, `AI難度：${this.getAIDifficultyLabel()}`, {
            fontSize: '18px',
            color: '#d6c7ab'
        });

        this.tipText = this.add.text(40, 270, '規則：翻到一對可再翻一次', {
            fontSize: '18px',
            color: '#d6c7ab',
            wordWrap: { width: 260 }
        });

        this.backButton = this.add.rectangle(1110, 60, 220, 58, 0x7a8a99, 0.96)
            .setStrokeStyle(2, 0xffffff, 0.25)
            .setInteractive({ useHandCursor: true });

        this.backText = this.add.text(1110, 60, '返回樂園', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.backButton.on('pointerover', () => {
            this.tweens.add({
                targets: [this.backButton, this.backText],
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 120
            });
        });

        this.backButton.on('pointerout', () => {
            this.tweens.add({
                targets: [this.backButton, this.backText],
                scaleX: 1,
                scaleY: 1,
                duration: 120
            });
        });

        this.backButton.on('pointerdown', () => {
            this.scene.start(this.returnScene);
        });
    }

    getModeLabel() {
        if (this.matchMode === 'same') return '簡單（翻一樣的）';
        if (this.matchMode === 'animalFood') return '普通（動物配食物）';
        if (this.matchMode === 'animalShadow') return '困難（動物配剪影）';
        return '普通';
    }

    getAIDifficultyLabel() {
        if (this.aiDifficulty === 'easy') return '簡單';
        if (this.aiDifficulty === 'hard') return '困難';
        return '普通';
    }

    getAIMemoryChance() {
        if (this.aiDifficulty === 'easy') return 0.4;
        if (this.aiDifficulty === 'hard') return 1.0;
        return 0.7;
    }

    getAnimalPool() {
        return [
            { pairId: 'elephant', key: 'mm_elephant', label: '大象' },
            { pairId: 'sheep', key: 'mm_sheep', label: '小羊' },
            { pairId: 'dog', key: 'mm_dog', label: '小狗' },
            { pairId: 'raccoon', key: 'mm_raccoon', label: '小浣熊' },
            { pairId: 'deer', key: 'mm_deer', label: '小鹿' },
            { pairId: 'bear', key: 'mm_bear', label: '小熊' },
            { pairId: 'pig', key: 'mm_pig', label: '小豬' },
            { pairId: 'cat', key: 'mm_cat', label: '小貓' },
            { pairId: 'penguin', key: 'mm_penguin', label: '企鵝' },
            { pairId: 'tiger', key: 'mm_tiger', label: '老虎' },
            { pairId: 'cow', key: 'mm_cow', label: '乳牛' },
            { pairId: 'rabbit', key: 'mm_rabbit', label: '兔子' },
            { pairId: 'hedgehog', key: 'mm_hedgehog', label: '刺蝟' },
            { pairId: 'squirrel', key: 'mm_squirrel', label: '松鼠' },
            { pairId: 'hippo', key: 'mm_hippo', label: '河馬' },
            { pairId: 'fox', key: 'mm_fox', label: '狐狸' },
            { pairId: 'chipmunk', key: 'mm_chipmunk', label: '花栗鼠' },
            { pairId: 'giraffe', key: 'mm_giraffe', label: '長頸鹿' },
            { pairId: 'frog', key: 'mm_frog', label: '青蛙' },
            { pairId: 'zebra', key: 'mm_zebra', label: '斑馬' },
            { pairId: 'koala', key: 'mm_koala', label: '無尾熊' },
            { pairId: 'monkey', key: 'mm_monkey', label: '猴子' },
            { pairId: 'lion', key: 'mm_lion', label: '獅子' },
            { pairId: 'panda', key: 'mm_panda', label: '熊貓' },
            { pairId: 'bee', key: 'mm_bee', label: '蜜蜂' },
            { pairId: 'butterfly', key: 'mm_butterfly', label: '蝴蝶' },
            { pairId: 'owl', key: 'mm_owl', label: '貓頭鷹' },
            { pairId: 'whale', key: 'mm_whale', label: '小鯨魚' }
        ];
    }

    getPairPool() {
        // 目前有圖片素材的先做 same
        if (this.matchMode === 'same') {
            const animals = Phaser.Utils.Array.Shuffle([...this.getAnimalPool()]);
            return animals.slice(0, this.totalPairs).map(item => ({
                pairId: item.pairId,
                leftKey: item.key,
                rightKey: item.key,
                leftLabel: item.label,
                rightLabel: item.label,
                isImage: true
            }));
        }

        // 先保留文字版
        if (this.matchMode === 'animalFood') {
            return [
                { pairId: 'monkey', leftLabel: '猴子', rightLabel: '香蕉', isImage: false },
                { pairId: 'rabbit', leftLabel: '兔子', rightLabel: '紅蘿蔔', isImage: false },
                { pairId: 'panda', leftLabel: '熊貓', rightLabel: '竹子', isImage: false },
                { pairId: 'squirrel', leftLabel: '松鼠', rightLabel: '堅果', isImage: false },
                { pairId: 'frog', leftLabel: '青蛙', rightLabel: '昆蟲', isImage: false },
                { pairId: 'bee', leftLabel: '蜜蜂', rightLabel: '花朵', isImage: false },
                { pairId: 'penguin', leftLabel: '企鵝', rightLabel: '小魚', isImage: false },
                { pairId: 'cat', leftLabel: '小貓', rightLabel: '魚', isImage: false },
                { pairId: 'dog', leftLabel: '小狗', rightLabel: '骨頭', isImage: false },
                { pairId: 'koala', leftLabel: '無尾熊', rightLabel: '尤加利葉', isImage: false }
            ];
        }

        return [
            { pairId: 'monkey', leftLabel: '猴子', rightLabel: '猴子剪影', isImage: false },
            { pairId: 'rabbit', leftLabel: '兔子', rightLabel: '兔子剪影', isImage: false },
            { pairId: 'panda', leftLabel: '熊貓', rightLabel: '熊貓剪影', isImage: false },
            { pairId: 'squirrel', leftLabel: '松鼠', rightLabel: '松鼠剪影', isImage: false },
            { pairId: 'frog', leftLabel: '青蛙', rightLabel: '青蛙剪影', isImage: false },
            { pairId: 'bee', leftLabel: '蜜蜂', rightLabel: '蜜蜂剪影', isImage: false },
            { pairId: 'penguin', leftLabel: '企鵝', rightLabel: '企鵝剪影', isImage: false },
            { pairId: 'cat', leftLabel: '小貓', rightLabel: '小貓剪影', isImage: false },
            { pairId: 'dog', leftLabel: '小狗', rightLabel: '小狗剪影', isImage: false },
            { pairId: 'butterfly', leftLabel: '蝴蝶', rightLabel: '蝴蝶剪影', isImage: false }
        ];
    }

    createCards() {
        const pairPool = this.getPairPool();
        const cardDataList = [];

        for (let i = 0; i < this.totalPairs; i++) {
            const pair = pairPool[i];

            cardDataList.push({
                pairId: pair.pairId,
                faceKey: pair.leftKey || null,
                label: pair.leftLabel,
                isImage: pair.isImage
            });

            cardDataList.push({
                pairId: pair.pairId,
                faceKey: pair.rightKey || null,
                label: pair.rightLabel,
                isImage: pair.isImage
            });
        }

        Phaser.Utils.Array.Shuffle(cardDataList);

        this.cards = [];

        cardDataList.forEach((data, index) => {
            const x = this.startX + (index % this.cols) * this.gapX;
            const y = this.startY + Math.floor(index / this.cols) * this.gapY;

            const bg = this.add.image(x, y, 'mm_tile_base')
                .setDisplaySize(this.cardSize, this.cardSize);

            const cover = this.add.rectangle(x, y, this.cardSize - 8, this.cardSize - 8, 0xa7864f, 0.98)
                .setStrokeStyle(3, 0xf8f1df, 0.95);

            const faceImage = data.isImage && data.faceKey
                ? this.add.image(x, y, data.faceKey).setVisible(false)
                : null;

            if (faceImage) {
                faceImage.setDisplaySize(this.cardSize - 16, this.cardSize - 16);
            }

            const text = this.add.text(x, y, '?', {
                fontSize: '20px',
                color: '#fffaf0',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: this.cardSize - 18 }
            }).setOrigin(0.5);

            // 一定要在 text 建立之後才放這裡
            bg.baseScaleX = bg.scaleX;
            bg.baseScaleY = bg.scaleY;

            cover.baseScaleX = cover.scaleX;
            cover.baseScaleY = cover.scaleY;

            text.baseScaleX = text.scaleX;
            text.baseScaleY = text.scaleY;

            if (faceImage) {
                faceImage.baseScaleX = faceImage.scaleX;
                faceImage.baseScaleY = faceImage.scaleY;
            }

            const ownerBadgeBg = this.add.circle(x - this.cardSize * 0.34, y - this.cardSize * 0.34, 16, 0x000000, 0)
                .setVisible(false);

            const ownerBadgeText = this.add.text(x - this.cardSize * 0.34, y - this.cardSize * 0.34, '', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setVisible(false);

            const ownerFrame = this.add.rectangle(x, y, this.cardSize - 4, this.cardSize - 4)
                .setStrokeStyle(4, 0xffffff, 0)
                .setFillStyle(0xffffff, 0)
                .setVisible(false);

            const hitArea = this.add.rectangle(x, y, this.cardSize, this.cardSize, 0x000000, 0.001)
                .setInteractive({ useHandCursor: true })
                .setDepth(999);

            const card = {
                pairId: data.pairId,
                label: data.label,
                faceKey: data.faceKey,
                isImage: data.isImage,
                index,
                x,
                y,
                bg,
                cover,
                faceImage,
                text,
                ownerBadgeBg,
                ownerBadgeText,
                ownerFrame,
                owner: null,
                hitArea,
                revealed: false,
                matched: false
            };

            // 只保留點擊，不要 hover
            hitArea.on('pointerdown', () => {
                this.onCardClicked(card);
            });

            this.cards.push(card);
        });
    }

    onCardClicked(card) {
        if (this.gameEnded) return;
        if (this.lockBoard) return;
        if (this.turn !== 'player') return;
        if (card.revealed || card.matched) return;

        this.lockBoard = true;

        this.revealCard(card, () => {
            if (!this.firstCard) {
                this.firstCard = card;
                this.lockBoard = false;
                return;
            }

            this.secondCard = card;
            this.checkMatch();
        });
    }

    revealCard(card, onComplete = null) {
        if (!card || card.revealed) {
            if (onComplete) onComplete();
            return;
        }

        card.revealed = true;

        const targets = [card.bg, card.cover, card.text];
        if (card.faceImage) targets.push(card.faceImage);

        this.tweens.add({
            targets,
            scaleX: 0.08,
            duration: 110,
            ease: 'Sine.easeIn',
            onComplete: () => {
                card.cover.setVisible(false);

                if (card.isImage && card.faceImage) {
                    card.faceImage.setVisible(true);
                    card.text.setVisible(false);
                } else {
                    card.text.setText(card.label);
                    card.text.setVisible(true);
                }

                this.tweens.add({
                    targets: [card.bg],
                    scaleX: card.bg.baseScaleX,
                    duration: 130,
                    ease: 'Back.easeOut'
                });

                this.tweens.add({
                    targets: [card.cover],
                    scaleX: card.cover.baseScaleX,
                    duration: 130,
                    ease: 'Back.easeOut'
                });

                this.tweens.add({
                    targets: [card.text],
                    scaleX: card.text.baseScaleX,
                    duration: 130,
                    ease: 'Back.easeOut'
                });

                if (card.faceImage) {
                    this.tweens.add({
                        targets: [card.faceImage],
                        scaleX: card.faceImage.baseScaleX,
                        duration: 130,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            if (!this.aiMemory[card.pairId]) {
                                this.aiMemory[card.pairId] = new Set();
                            }
                            this.aiMemory[card.pairId].add(card.index);

                            if (onComplete) onComplete();
                        }
                    });
                } else {
                    if (!this.aiMemory[card.pairId]) {
                        this.aiMemory[card.pairId] = new Set();
                    }
                    this.aiMemory[card.pairId].add(card.index);

                    if (onComplete) onComplete();
                }
            }
        });
    }

    hideCard(card, onComplete = null) {
        if (!card || !card.revealed || card.matched) {
            if (onComplete) onComplete();
            return;
        }

        const targets = [card.bg, card.cover, card.text];
        if (card.faceImage) targets.push(card.faceImage);

        this.tweens.add({
            targets,
            scaleX: 0.08,
            duration: 100,
            ease: 'Sine.easeIn',
            onComplete: () => {
                card.revealed = false;
                card.cover.setVisible(true);

                if (card.faceImage) {
                    card.faceImage.setVisible(false);
                }

                card.text.setText('?');
                card.text.setVisible(true);

                this.tweens.add({
                    targets: [card.bg],
                    scaleX: card.bg.baseScaleX,
                    duration: 120,
                    ease: 'Back.easeOut'
                });

                this.tweens.add({
                    targets: [card.cover],
                    scaleX: card.cover.baseScaleX,
                    duration: 120,
                    ease: 'Back.easeOut'
                });

                this.tweens.add({
                    targets: [card.text],
                    scaleX: card.text.baseScaleX,
                    duration: 120,
                    ease: 'Back.easeOut'
                });

                if (card.faceImage) {
                    this.tweens.add({
                        targets: [card.faceImage],
                        scaleX: card.faceImage.baseScaleX,
                        duration: 120,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            if (onComplete) onComplete();
                        }
                    });
                } else {
                    if (onComplete) onComplete();
                }
            }
        });
    }

    applyMatchedOwnerStyle(card, owner) {
        if (!card) return;

        card.owner = owner;

        if (owner === 'player') {
            card.ownerBadgeBg.setFillStyle(0x4da3ff, 0.95);
            card.ownerBadgeBg.setVisible(true);

            card.ownerBadgeText.setText('⭐');
            card.ownerBadgeText.setStyle({
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            card.ownerBadgeText.setVisible(true);

            card.ownerFrame.setStrokeStyle(4, 0x7ec3ff, 0.95);
            card.ownerFrame.setVisible(true);
        } else {
            card.ownerBadgeBg.setFillStyle(0xff9a3d, 0.95);
            card.ownerBadgeBg.setVisible(true);

            card.ownerBadgeText.setText('AI');
            card.ownerBadgeText.setStyle({
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            card.ownerBadgeText.setVisible(true);

            card.ownerFrame.setStrokeStyle(4, 0xffb15c, 0.95);
            card.ownerFrame.setVisible(true);
        }

        this.tweens.add({
            targets: [card.ownerBadgeBg, card.ownerBadgeText, card.ownerFrame],
            scaleX: 1.12,
            scaleY: 1.12,
            duration: 120,
            yoyo: true
        });
    }

    clearMatchedOwnerStyle(card) {
        if (!card) return;

        card.owner = null;

        card.ownerBadgeBg.setVisible(false);
        card.ownerBadgeText.setVisible(false);
        card.ownerFrame.setVisible(false);

        card.ownerBadgeBg.setScale(1);
        card.ownerBadgeText.setScale(1);
        card.ownerFrame.setScale(1);
    }

    resetCardVisualState(card) {
        if (!card) return;

        card.revealed = false;
        card.matched = false;
        card.owner = null;

        card.cover.setVisible(true);

        if (card.faceImage) {
            card.faceImage.setVisible(false);
        }

        card.text.setText('?');
        card.text.setVisible(true);

        card.ownerBadgeBg.setVisible(false);
        card.ownerBadgeText.setVisible(false);
        card.ownerFrame.setVisible(false);

        card.ownerBadgeBg.setScale(1);
        card.ownerBadgeText.setScale(1);
        card.ownerFrame.setScale(1);

        card.bg.setScale(card.bg.baseScaleX, card.bg.baseScaleY);
        card.cover.setScale(card.cover.baseScaleX, card.cover.baseScaleY);
        card.text.setScale(card.text.baseScaleX, card.text.baseScaleY);

        if (card.faceImage) {
            card.faceImage.setScale(card.faceImage.baseScaleX, card.faceImage.baseScaleY);
        }
    }

    checkMatch() {
        this.lockBoard = true;

        if (!this.firstCard || !this.secondCard) {
            this.lockBoard = false;
            return;
        }

        const isMatch = this.firstCard.pairId === this.secondCard.pairId;

        if (isMatch) {
            this.time.delayedCall(260, () => {
                this.firstCard.matched = true;
                this.secondCard.matched = true;

                const owner = this.turn === 'player' ? 'player' : 'ai';

                this.applyMatchedOwnerStyle(this.firstCard, owner);
                this.applyMatchedOwnerStyle(this.secondCard, owner);

                if (this.turn === 'player') {
                    this.playerScore++;
                } else {
                    this.aiScore++;
                }

                this.updateScore();

                this.tweens.add({
                    targets: [
                        this.firstCard.bg,
                        this.secondCard.bg,
                        this.firstCard.faceImage,
                        this.secondCard.faceImage,
                        this.firstCard.text,
                        this.secondCard.text
                    ].filter(Boolean),
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    yoyo: true
                });

                this.resetTurn();
                this.lockBoard = false;

                if (this.checkGameOver()) return;

                if (this.turn === 'ai') {
                    this.time.delayedCall(650, () => this.aiTurn());
                }
            });
        } else {
            this.time.delayedCall(500, () => {
                this.hideCard(this.firstCard, () => {
                    this.hideCard(this.secondCard, () => {
                        this.switchTurn();
                        this.resetTurn();
                        this.lockBoard = false;

                        if (this.turn === 'ai') {
                            this.time.delayedCall(650, () => this.aiTurn());
                        }
                    });
                });
            });
        }
    }

    resetTurn() {
        this.firstCard = null;
        this.secondCard = null;
    }

    switchTurn() {
        this.turn = this.turn === 'player' ? 'ai' : 'player';
        this.turnText.setText(this.turn === 'player' ? '玩家回合' : 'AI回合');
    }

    updateScore() {
        this.scoreText.setText(`玩家:${this.playerScore}  AI:${this.aiScore}`);
    }

    checkGameOver() {
        const totalMatched = this.playerScore + this.aiScore;

        if (totalMatched < this.totalPairs) return false;

        this.gameEnded = true;
        this.lockBoard = true;

        this.cards.forEach(card => {
            if (card.hitArea) {
                card.hitArea.disableInteractive();
            }
        });

        let resultText = '平手！';
        if (this.playerScore > this.aiScore) resultText = '玩家獲勝！';
        if (this.aiScore > this.playerScore) resultText = 'AI 獲勝！';

        this.add.rectangle(640, 360, 540, 240, 0x000000, 0.72)
            .setStrokeStyle(3, 0xffffff, 0.2);

        this.add.text(640, 300, resultText, {
            fontSize: '42px',
            color: '#fff4d6',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 355, `最終比分　玩家 ${this.playerScore} : ${this.aiScore} AI`, {
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const againBtn = this.add.rectangle(540, 430, 180, 58, 0x8b5e34, 0.96)
            .setStrokeStyle(2, 0xffffff, 0.25)
            .setInteractive({ useHandCursor: true });

        this.add.text(540, 430, '再玩一次', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const backBtn = this.add.rectangle(740, 430, 180, 58, 0x7a8a99, 0.96)
            .setStrokeStyle(2, 0xffffff, 0.25)
            .setInteractive({ useHandCursor: true });

        this.add.text(740, 430, '返回樂園', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        againBtn.on('pointerdown', () => {
            this.scene.restart({
                returnScene: this.returnScene,
                aiDifficulty: this.aiDifficulty,
                matchMode: this.matchMode
            });
        });

        backBtn.on('pointerdown', () => {
            this.scene.start(this.returnScene);
        });

        return true;
    }

    aiTurn() {
        if (this.gameEnded) return;
        if (this.turn !== 'ai') return;
        if (this.lockBoard) return;

        const memoryChance = this.getAIMemoryChance();
        const useMemory = Math.random() < memoryChance;

        let choice = null;

        if (useMemory) {
            choice = this.findKnownPair();
        }

        if (!choice) {
            choice = this.getRandomPair();
        }

        if (!choice || !choice[0] || !choice[1]) return;

        this.aiFlip(choice[0], choice[1]);
    }

    findKnownPair() {
        for (const key in this.aiMemory) {
            const indexes = [...this.aiMemory[key]].filter(i => {
                const c = this.cards[i];
                return c && !c.matched && !c.revealed;
            });

            if (indexes.length >= 2) {
                return [this.cards[indexes[0]], this.cards[indexes[1]]];
            }
        }

        return null;
    }

    getRandomPair() {
        const available = this.cards.filter(c => !c.matched && !c.revealed);

        if (available.length < 2) return null;

        Phaser.Utils.Array.Shuffle(available);
        return [available[0], available[1]];
    }

    aiFlip(card1, card2) {
        this.lockBoard = true;
        this.turnText.setText('AI思考中...');

        this.time.delayedCall(450, () => {
            this.revealCard(card1, () => {
                this.firstCard = card1;

                this.time.delayedCall(420, () => {
                    this.revealCard(card2, () => {
                        this.secondCard = card2;
                        this.turnText.setText('AI回合');
                        this.checkMatch();
                    });
                });
            });
        });
    }
}