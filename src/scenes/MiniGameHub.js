export default class MiniGameHub extends Phaser.Scene {
    constructor() {
        super('MiniGameHub');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0xf3ead7, 1);

        this.add.text(640, 90, '小遊戲樂園', {
            fontSize: '40px',
            color: '#3d2c1c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 140, '選擇想玩的遊戲', {
            fontSize: '22px',
            color: '#6b5236'
        }).setOrigin(0.5);

        const centerX = 640;
        const gapX = 180;
        const row1Y = 280;
        const row2Y = 390;
        const row3Y = 500;

        // =========================
        // 第一排
        // =========================
        this.createMenuButton(centerX - gapX, row1Y, '🧩 形色棋', () => {
            this.scene.start('ShapeColorGame', {
                returnScene: 'MiniGameHub'
            });
        });

        this.createMenuButton(centerX + gapX, row1Y, '♟ 象棋暗棋', () => {
            this.scene.start('BushBanqiMiniGame', {
                returnScene: 'MiniGameHub',
                mode: 'ai',
                stageId: 'banqi_01'
            });
        });

        // =========================
        // 第二排
        // =========================
        this.createMenuButton(centerX - gapX, row2Y, '🧠 記憶翻牌', () => {
            this.scene.start('MemoryMatchGame', {
                returnScene: 'MiniGameHub'
            });
        });

        this.createMenuButton(centerX + gapX, row2Y, '🐻 動物配對', () => {
            this.scene.start('AnimalFoodMatch');
        });

        // =========================
        // 第三排
        // =========================

        this.createMenuButton(centerX - gapX, row3Y, '✨ 點點螢火', () => {
            this.scene.start('FireflyExplore');
        });

        this.createMenuButton(centerX + gapX, row3Y, '🎮 遊戲F（預留）', () => {
            console.log('遊戲F 之後接');
        });

        // =========================
        // 底部返回
        // =========================
        this.createMenuButton(640, 620, '返回首頁', () => {
            this.scene.start('Start');
        }, 0x7a8a99);
    }

    createMenuButton(x, y, label, onClick, color = 0x8b5e34) {
        const bg = this.add.rectangle(x, y, 320, 72, color, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff, 0.2)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            this.tweens.add({
                targets: [bg, text],
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 120
            });
        });

        bg.on('pointerout', () => {
            this.tweens.add({
                targets: [bg, text],
                scaleX: 1,
                scaleY: 1,
                duration: 120
            });
        });

        bg.on('pointerdown', () => {
            if (onClick) onClick();
        });

        return { bg, text };
    }
}