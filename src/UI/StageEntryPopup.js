// src/UI/StageEntryPopup.js
export default class StageEntryPopup {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
    }

    show(config = {}) {
        if (this.isOpen) {
            this.close(true);
        }

        const {
            stageData = {},
            entryResult = {},
            onConfirm = null,
            onCancel = null
        } = config;

        const cam = this.scene.cameras.main;
        const centerX = cam.width / 2;
        const centerY = cam.height / 2;

        const title = stageData.title || '關卡';
        const description = stageData.description || '準備開始冒險';
        const howToPlay = stageData.howToPlay || '點擊後開始挑戰';

        const requiredReputation = entryResult.requiredReputation ?? stageData.requiredReputation ?? 0;
        const currentReputation = entryResult.currentReputation ?? (this.scene.registry.get('reputation') || 0);
        const heartCost = entryResult.heartCost ?? stageData.heartCost ?? 1;
        const currentHearts = entryResult.currentHearts ?? (this.scene.registry.get('hearts') || 0);

        const bypassReputation = entryResult.bypassReputation === true;
        const bypassHeart = entryResult.bypassHeart === true || entryResult.bypassHeartCost === true;

        this.isOpen = true;

        // ===== 最外層容器 =====
        this.container = this.scene.add.container(0, 0).setDepth(30000);

        // ===== 半透明遮罩 =====
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            cam.width,
            cam.height,
            0x000000,
            0.48
        )
            .setInteractive()
            .on('pointerdown', () => {
                // 吃掉事件，避免點到後面
            });

        // ===== 主卡片 =====
        const panelWidth = 760;
        const panelHeight = 540;
        const panelX = centerX;
        const panelY = centerY;

        const shadow = this.scene.add.rectangle(
            panelX + 8,
            panelY + 10,
            panelWidth,
            panelHeight,
            0x000000,
            0.18
        ).setOrigin(0.5);

        const panel = this.scene.add.rectangle(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            0xfff8ef,
            1
        )
            .setStrokeStyle(6, 0x8b6b4a)
            .setOrigin(0.5);

        const innerPanel = this.scene.add.rectangle(
            panelX,
            panelY,
            panelWidth - 26,
            panelHeight - 26,
            0xfffdf8,
            1
        )
            .setStrokeStyle(3, 0xe6cfb1)
            .setOrigin(0.5);

        // ===== 標題區 =====
        const titleBg = this.scene.add.rectangle(
            panelX,
            panelY - 215,
            300,
            54,
            0xf7d794,
            1
        )
            .setStrokeStyle(3, 0x8b6b4a)
            .setOrigin(0.5);

        const titleText = this.scene.add.text(
            panelX,
            panelY - 215,
            title,
            {
                fontSize: '30px',
                color: '#5b3b1f',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0.5);

        // ===== 說明文字 =====
        const descLabel = this.scene.add.text(
            panelX - 320,
            panelY - 175,
            '關卡介紹',
            {
                fontSize: '22px',
                color: '#8b5e34',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0.5);

        const descBox = this.scene.add.rectangle(
            panelX,
            panelY - 128,
            650,
            66,
            0xfaf1e4,
            1
        )
            .setStrokeStyle(2, 0xd7c2a3)
            .setOrigin(0.5);

        const descText = this.scene.add.text(
            panelX - 300,
            panelY - 145,
            description,
            {
                fontSize: '22px',
                color: '#4f3a25',
                wordWrap: { width: 600 },
                lineSpacing: 6,
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0);

        const howLabel = this.scene.add.text(
            panelX - 320,
            panelY - 78,
            '玩法提示',
            {
                fontSize: '22px',
                color: '#8b5e34',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0.5);

        const howBox = this.scene.add.rectangle(
            panelX,
            panelY - 15,
            650,
            102,
            0xfaf1e4,
            1
        )
            .setStrokeStyle(2, 0xd7c2a3)
            .setOrigin(0.5);

        const howText = this.scene.add.text(
            panelX - 300,
            panelY - 52,
            howToPlay,
            {
                fontSize: '21px',
                color: '#4f3a25',
                wordWrap: { width: 600 },
                lineSpacing: 6,
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0);

        // ===== 左右資訊區 =====
        const boxY = panelY + 108;
        const statusBoxW = 300;
        const statusBoxH = 132;

        const leftBox = this.scene.add.rectangle(
            panelX - 165,
            boxY,
            statusBoxW,
            statusBoxH,
            0xf3fbff,
            1
        )
            .setStrokeStyle(3, 0xa9d6e5)
            .setOrigin(0.5);

        const rightBox = this.scene.add.rectangle(
            panelX + 165,
            boxY,
            statusBoxW,
            statusBoxH,
            0xfff6f0,
            1
        )
            .setStrokeStyle(3, 0xf0b78d)
            .setOrigin(0.5);

        const reqTitle = this.scene.add.text(
            panelX - 165,
            boxY - 43,
            '進入條件',
            {
                fontSize: '22px',
                color: '#2c6e7f',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0.5);

        const currentTitle = this.scene.add.text(
            panelX + 165,
            boxY - 43,
            '目前狀態',
            {
                fontSize: '22px',
                color: '#9a5a2d',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0.5);

        // ===== 左側：進入條件 =====
        const needRepText = bypassReputation
            ? '聲望門檻：✨ 已被祝福忽略'
            : `聲望門檻：${requiredReputation}`;

        const needHeartText = bypassHeart
            ? '體力消耗：✨ 本次不消耗'
            : `體力消耗：${heartCost}`;

        const leftText = this.scene.add.text(
            panelX - 295,
            boxY - 32,
            `${needRepText}\n\n${needHeartText}`,
            {
                fontSize: '23px',
                color: '#2f4858',
                lineSpacing: 20,
                wordWrap: { width: 250 },
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0);

        // ===== 右側：目前狀態 =====
        const rightText = this.scene.add.text(
            panelX + 35,
            boxY - 32,
            `🏆 目前聲望：${currentReputation}\n\n❤️ 目前體力：${currentHearts}`,
            {
                fontSize: '22px',
                color: '#6b4226',
                lineSpacing: 20,
                wordWrap: { width: 250 },
                fontFamily: 'Microsoft JhengHei, Arial'
            }
        ).setOrigin(0, 0);

        // ===== 按鈕 =====
        const cancelButton = this.createButton({
            x: panelX - 120,
            y: panelY + 248,
            width: 170,
            height: 54,
            text: '先等等',
            fillColor: 0xd9d2c7,
            strokeColor: 0x8c7f70,
            textColor: '#4f463e',
            onClick: () => {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
                this.close();
            }
        });

        const confirmButton = this.createButton({
            x: panelX + 120,
            y: panelY + 248,
            width: 210,
            height: 54,
            text: '開始挑戰',
            fillColor: 0xf6b26b,
            strokeColor: 0x9a5a2d,
            textColor: '#ffffff',
            onClick: () => {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
                this.close();
            }
        });

        this.container.add([
            overlay,
            shadow,
            panel,
            innerPanel,
            titleBg,
            titleText,
            descLabel,
            descBox,
            descText,
            howLabel,
            howBox,
            howText,
            leftBox,
            rightBox,
            reqTitle,
            currentTitle,
            leftText,
            rightText,
            cancelButton.container,
            confirmButton.container
        ]);

        // ===== 開啟動畫 =====
        this.container.setAlpha(0);
        this.container.setScale(0.92);

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 160,
            ease: 'Back.Out'
        });
    }

    createButton(config) {
        const {
            x,
            y,
            width,
            height,
            text,
            fillColor,
            strokeColor,
            textColor,
            onClick
        } = config;

        const container = this.scene.add.container(x, y);

        const shadow = this.scene.add.rectangle(4, 5, width, height, 0x000000, 0.18)
            .setOrigin(0.5);

        const bg = this.scene.add.rectangle(0, 0, width, height, fillColor, 1)
            .setStrokeStyle(3, strokeColor)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const label = this.scene.add.text(0, 0, text, {
            fontSize: '24px',
            color: textColor,
            fontStyle: 'bold',
            fontFamily: 'Microsoft JhengHei, Arial'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setScale(1.03);
            label.setScale(1.03);
        });

        bg.on('pointerout', () => {
            bg.setScale(1);
            label.setScale(1);
        });

        bg.on('pointerdown', () => {
            bg.setScale(0.97);
            label.setScale(0.97);
        });

        bg.on('pointerup', () => {
            bg.setScale(1.03);
            label.setScale(1.03);
            if (typeof onClick === 'function') {
                onClick();
            }
        });

        container.add([shadow, bg, label]);

        return {
            container,
            bg,
            label
        };
    }

    close(force = false) {
        if (!this.container) return;

        const target = this.container;
        this.container = null;
        this.isOpen = false;

        if (force) {
            target.destroy(true);
            return;
        }

        this.scene.tweens.add({
            targets: target,
            alpha: 0,
            scaleX: 0.92,
            scaleY: 0.92,
            duration: 120,
            ease: 'Quad.In',
            onComplete: () => {
                if (target && target.scene) {
                    target.destroy(true);
                }
            }
        });
    }
}