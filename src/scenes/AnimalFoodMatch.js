export default class AnimalFoodMatch extends Phaser.Scene {
    constructor() {
        super('AnimalFoodMatch');
    }

    create() {
        this.revealed = false;
        this.score = 0;
        this.isRevealing = false;
        this.selectedChoice = null;

        // =========================
        // 背景
        // =========================
        this.add.image(640, 360, 'forest_match_bg')
            .setDisplaySize(1280, 720);

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.12);

        // =========================
        // 題庫
        // =========================
        this.animalDB = [
        { key: 'brown_bear', body: 'afm_brown_bear_body', item: 'afm_brown_bear_item' },
        { key: 'cat', body: 'afm_cat_body', item: 'afm_cat_item' },
        { key: 'dolphin', body: 'afm_dolphin_body', item: 'afm_dolphin_item' },
        { key: 'hedgehog', body: 'afm_hedgehog_body', item: 'afm_hedgehog_item' },
        { key: 'panda', body: 'afm_panda_body', item: 'afm_panda_item' },
        { key: 'rabbit', body: 'afm_rabbit_body', item: 'afm_rabbit_item' },
        { key: 'monkey', body: 'afm_monkey_body', item: 'afm_monkey_item' },
        { key: 'mouse', body: 'afm_mouse_body', item: 'afm_mouse_item' },
        { key: 'owl', body: 'afm_owl_body', item: 'afm_owl_item' },
        { key: 'squirrel', body: 'afm_squirrel_body', item: 'afm_squirrel_item' },
        { key: 'tiger', body: 'afm_tiger_body', item: 'afm_tiger_item' },
        { key: 'deer', body: 'afm_deer_body', item: 'afm_deer_item' },

        { key: 'seahorse', body: 'afm_seahorse_body', item: 'afm_seahorse_item' },
        { key: 'butterfly', body: 'afm_butterfly_body', item: 'afm_butterfly_item' }
    ];

    this.itemLabelMap = {
        afm_brown_bear_item: '蜂蜜',
        afm_cat_item: '魚',
        afm_dolphin_item: '沙丁魚',
        afm_hedgehog_item: '蘋果',
        afm_panda_item: '竹子',
        afm_rabbit_item: '紅蘿蔔',
        afm_monkey_item: '香蕉',
        afm_mouse_item: '起司',
        afm_owl_item: '野莓',
        afm_squirrel_item: '橡果',
        afm_tiger_item: '肉',
        afm_deer_item: '藍莓',

        afm_seahorse_item: '浮游生物',
        afm_butterfly_item: '花蜜'
    };

        // 抽 6 題
        const shuffled = Phaser.Utils.Array.Shuffle([...this.animalDB]);
        this.questions = shuffled.slice(0, 6);

        // 答案池（6 正解 + 1 干擾 = 7）
        const correct = this.questions.map(q => q.item);

        const distractors = this.animalDB
            .filter(a => !this.questions.includes(a))
            .map(a => a.item);

        Phaser.Utils.Array.Shuffle(distractors);

        this.choicePool = Phaser.Utils.Array.Shuffle([
            ...correct,
            distractors[0]
        ]);

        this.createTitle();
        this.createLeftPanel();
        this.createRightPanel();
        this.createQuestionSlots();
        this.createChoices();
        this.refreshInfo();
    }

    createTitle() {
        this.add.text(80, 50, '動物吃什麼？', {
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        });

        const backBtn = this.add.rectangle(92, 96, 120, 42, 0x6b4a2f, 0.95)
            .setStrokeStyle(2, 0xffffff, 0.25)
            .setInteractive({ useHandCursor: true });

        this.add.text(92, 96, '← 返回', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.start('MiniGameHub');
        });
    }

    createLeftPanel() {
        const x = 130;

        this.modeText = this.add.text(50, 260, '', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.progressText = this.add.text(50, 300, '', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.scoreText = this.add.text(50, 340, '', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.revealBtn = this.add.rectangle(x, 500, 150, 60, 0x7fb069)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, 500, '揭曉答案', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.revealBtn.on('pointerdown', () => this.reveal());

        const restartBtn = this.add.rectangle(x, 575, 150, 56, 0x7a8fa8)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, 575, '重新開始', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => this.scene.restart());
    }

    createRightPanel() {
        this.add.text(1080, 200, '紙娃娃區', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
    }

    // =========================
    // 題目區（動物）
    // =========================
    createQuestionSlots() {
        this.slots = [];

        const startX = 450;
        const startY = 260;
        const gapX = 200;
        const gapY = 160;

        this.questions.forEach((q, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);

            const x = startX + col * gapX;
            const y = startY + row * gapY;

            // 題目框比例微調：略高一些
            const bg = this.add.rectangle(x, y, 126, 132, 0xffffff, 0.08)
                .setStrokeStyle(4, 0xffffff);

            const animal = this.add.image(x, y , q.body)
                .setDisplaySize(104, 104);

            const divider = this.add.rectangle(x, y + 18, 92, 2, 0xffffff, 0.20);

            this.slots.push({
                x,
                y,
                animalKey: q.key,
                correct: q.item,
                current: null,
                bg,
                animal,
                divider
            });
        });
    }

    // =========================
    // 答案區（7 個）
    // =========================
    createChoices() {
        this.choices = [];

        // 下方食物區底板（加深、提高辨識度）

        const startX = 640 - 3 * 110;
        const y = 600;

        this.choicePool.forEach((key, i) => {
            const x = startX + i * 110;

            const bg = this.add.rectangle(x, y, 104, 112, 0xf7edd8, 0.9)
                .setStrokeStyle(2, 0xffffff, 0.5);

            const img = this.add.image(x, y - 8, key)
                .setDisplaySize(90, 90)
                .setInteractive({ draggable: true, useHandCursor: true });

            const label = this.add.text(x, y + 42, this.itemLabelMap[key] || '', {
                fontSize: '20px',
                color: '#3d2c1c',
                fontStyle: 'bold',
                stroke: '#ffffff',
                strokeThickness: 4
            }).setOrigin(0.5);

            const breatheTween = this.tweens.add({
                targets: bg,
                alpha: { from: 0.72, to: 1 },
                yoyo: true,
                repeat: -1,
                duration: 900,
                delay: i * 80
            });

            const obj = {
                key,
                img,
                bg,
                label,
                startX: x,
                startY: y,
                slot: null,
                isSelected: false,
                baseSize: 90,
                selectedSize: 99,
                breatheTween
            };

            this.input.setDraggable(img);

            img.on('pointerdown', () => {
                if (this.revealed || this.isRevealing) return;

                this.choices.forEach(choice => {
                    if (choice !== obj) {
                        choice.isSelected = false;
                        choice.img.setDisplaySize(choice.baseSize, choice.baseSize);
                        choice.bg.setSize(104, 112);
                        choice.bg.setStrokeStyle(2, 0xffffff, 0.5);
                    }
                });

                obj.isSelected = true;
                obj.img.setDisplaySize(obj.selectedSize, obj.selectedSize);
                obj.bg.setSize(112, 120);
                obj.bg.setStrokeStyle(3, 0xffe08a, 0.95);
            });

            img.on('dragstart', () => {
                if (this.revealed || this.isRevealing) return;

                if (obj.breatheTween) {
                    obj.breatheTween.pause();
                }

                obj.bg.setVisible(false);
                obj.label.setVisible(false);
                this.children.bringToTop(obj.img);
            });

            img.on('drag', (pointer, dragX, dragY) => {
                if (this.revealed || this.isRevealing) return;

                img.x = dragX;
                img.y = dragY;
            });

            img.on('dragend', () => {
                if (this.revealed || this.isRevealing) return;
                this.handleDrop(obj);
            });

            this.choices.push(obj);
        });
    }

    handleDrop(choice) {
        let placed = false;

        this.slots.forEach(slot => {
            const d = Phaser.Math.Distance.Between(
                choice.img.x,
                choice.img.y,
                slot.x,
                slot.y
            );

            if (d < 82 && !placed) {
                // 如果這個答案原本已經在別格，先清掉舊格
                if (choice.slot && choice.slot !== slot) {
                    choice.slot.current = null;
                }

                // 如果目標格已經有其他答案，退回原位
                if (slot.current && slot.current !== choice) {
                    this.reset(slot.current);
                }

                slot.current = choice;
                choice.slot = slot;
                choice.isSelected = false;

                if (choice.breatheTween) {
                    choice.breatheTween.pause();
                }

                choice.img.setDisplaySize(choice.baseSize, choice.baseSize);

                this.tweens.add({
                    targets: choice.img,
                    x: slot.x + 50,
                    y: slot.y - 50,
                    duration: 150,
                    ease: 'Quad.Out'
                });

                placed = true;

                this.tweens.add({
                    targets: slot.bg,
                    alpha: 0.18,
                    yoyo: true,
                    duration: 150
                });

                placed = true;
            }
        });

        if (!placed) {
            if (choice.slot) {
                choice.slot.current = null;
                choice.slot = null;
            }
            this.reset(choice);
        }

        this.refreshInfo();
    }

    reset(choice) {
        choice.slot = null;
        choice.isSelected = false;

        choice.img.setDisplaySize(choice.baseSize, choice.baseSize);
        choice.bg.setSize(104, 112);
        choice.bg.setStrokeStyle(2, 0xffffff, 0.5);
        choice.bg.setVisible(true);
        choice.label.setVisible(true);

        if (choice.breatheTween) {
            choice.breatheTween.resume();
        }

        this.tweens.add({
            targets: choice.img,
            x: choice.startX,
            y: choice.startY - 8,
            duration: 150,
            ease: 'Back.Out'
        });
    }

    // =========================
    // 揭曉（逐格）
    // =========================
    reveal() {
        if (this.revealed || this.isRevealing) return;

        this.revealed = true;
        this.isRevealing = true;
        this.score = 0;

        this.revealBtn.disableInteractive();

        const slotsInOrder = [...this.slots].sort((a, b) => {
            if (a.y === b.y) return a.x - b.x;
            return a.y - b.y;
        });

        slotsInOrder.forEach((slot, index) => {
            this.time.delayedCall(index * 220, () => {
                this.playRevealForSlot(slot, index === slotsInOrder.length - 1);
            });
        });
    }

    playRevealForSlot(slot, isLast) {
        const isCorrect = slot.current && slot.current.key === slot.correct;

        // 不再翻動物圖，只做框與答案位的結果特效
        this.tweens.add({
            targets: slot.bg,
            scaleX: 0.08,
            duration: 100,
            ease: 'Quad.In',
            onComplete: () => {
                if (isCorrect) {
                    // 對：金框
                    slot.bg.setStrokeStyle(5, 0xffd54a);
                    this.score += 1;
                } else {
                    // 錯或未作答：灰框
                    slot.bg.setStrokeStyle(4, 0x8f8f8f);
                }

                this.tweens.add({
                    targets: slot.bg,
                    scaleX: 1,
                    duration: 120,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        if (isCorrect) {
                            this.tweens.add({
                                targets: slot.bg,
                                alpha: 0.22,
                                yoyo: true,
                                duration: 180
                            });
                        } else {
                            this.tweens.add({
                                targets: slot.bg,
                                x: slot.x + 4,
                                yoyo: true,
                                repeat: 2,
                                duration: 45,
                                onComplete: () => {
                                    slot.bg.x = slot.x;
                                }
                            });
                        }

                        this.refreshInfo();

                        if (isLast) {
                            this.isRevealing = false;
                            this.showResultSummary();
                        }
                    }
                });
            }
        });
    }

    showResultSummary() {
        const passedAll = this.score === this.slots.length;

        this.add.rectangle(640, 120, 360, 64, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff, 0.35);

        this.add.text(
            640,
            120,
            passedAll ? '🎉 全部答對！' : `本次答對 ${this.score} / ${this.slots.length}`,
            {
                fontSize: '30px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
    }

    refreshInfo() {
        const filled = this.slots.filter(s => !!s.current).length;

        this.modeText.setText(`題型：食物`);
        this.progressText.setText(`已放置：${filled}/6`);
        this.scoreText.setText(`分數：${this.score}`);
    }
}