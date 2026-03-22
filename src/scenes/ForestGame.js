// src/scenes/ForestGame.js
import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import InventorySystem from '../systems/InventorySystem.js';

export default class ForestGame extends Phaser.Scene {
    constructor() {
        super('ForestGame');
    }

    init(data) {
        this.mode = data?.mode || 'explore';
        this.levelLabel = data?.label || '';
        this.mapID = data?.mapID || '01';
    }

    create() {
        // 小遊戲先停掉所有 BGM
        AudioSystem.stopAllBgm(this);

        this.cameras.main.setBackgroundColor('#214c33');

        this.createCommonHeader();

        if (this.mode === 'treasure') {
            this.startTreasureMode();
        } else if (this.mode === 'explore') {
            this.startPlaceholderMode('森林探險模式', '這裡之後可以放角色移動、採集、對話事件');
        } else if (this.mode === 'campfire') {
            this.startPlaceholderMode('營火挑戰模式', '這裡之後可以做點火、加柴、烤棉花糖');
        } else if (this.mode === 'firefly') {
            this.startPlaceholderMode('捉螢火蟲模式', '這裡之後可以做捕捉螢火蟲與計時玩法');
        } else {
            this.startPlaceholderMode('未知模式', '這個模式尚未建立');
        }
    }

    createCommonHeader() {
        // 標題
        this.add.text(640, 46, this.levelLabel || '森林小遊戲', {
            fontSize: '34px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // 返回按鈕
        const backBtn = this.add.text(110, 48, '← 返回地圖', {
            fontSize: '24px',
            color: '#fff7cc',
            backgroundColor: '#000000',
            padding: { x: 10, y: 6 },
            stroke: '#000000',
            strokeThickness: 2
        })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);

        backBtn.on('pointerover', () => {
            this.tweens.add({
                targets: backBtn,
                scale: 1.05,
                duration: 100
            });
        });

        backBtn.on('pointerout', () => {
            this.tweens.add({
                targets: backBtn,
                scale: 1,
                duration: 100
            });
        });

        backBtn.on('pointerdown', () => {
            this.scene.start('WorldMap', { mapID: this.mapID });
        });
    }

    startPlaceholderMode(title, desc) {
        this.add.text(640, 220, title, {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(640, 320, desc, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5);
    }

    // =========================
    // 5x5 草叢尋寶完整版
    // =========================
    startTreasureMode() {
        this.gridSize = 5;
        const isMobile = this.scale.width < 900;
        this.tileGap = isMobile ? 95 : 110;
        this.startX = isMobile ? 300 : 430;
        this.startY = isMobile ? 180 : 165;

        this.digsLeft = 10;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalFound = 0;
        this.gameEnded = false;
        this.tilesLeft = this.gridSize * this.gridSize;
        this.specialGoldIndex = Phaser.Math.Between(0, 24);

        this.createTreasureUI();
        this.createTreasureGrid();
    }

    createTreasureUI() {
        this.add.rectangle(190, 165, 280, 220, 0x000000, 0.22)
            .setStrokeStyle(3, 0xffffff);

        this.add.text(190, 105, '草叢尋寶', {
            fontSize: '34px',
            color: '#ffe97a',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.infoText = this.add.text(190, 145, '點草叢挖寶！\n金色草叢藏有大獎', {
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            wordWrap: { width: 240 }
        }).setOrigin(0.5);

        this.digText = this.add.text(70, 205, `剩餘挖掘：${this.digsLeft}`, {
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.comboText = this.add.text(70, 240, `Combo：${this.combo}`, {
            fontSize: '26px',
            color: '#fff6b0',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.foundText = this.add.text(70, 275, `找到寶物：${this.totalFound}`, {
            fontSize: '26px',
            color: '#d9f7ff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.resourceText = this.add.text(70, 315, '', {
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.refreshResourceText();
    }

    refreshResourceText() {
        const crystals = this.registry.get('user_crystals') || 0;
        const reputation = this.registry.get('reputation') || 0;
        const hearts = this.registry.get('hearts') || 0;

        this.resourceText.setText(
            `💎 ${crystals}\n🏆 ${reputation}\n❤️ ${hearts}`
        );
    }

    createTreasureGrid() {
        this.tiles = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const x = this.startX + col * this.tileGap;
                const y = this.startY + row * this.tileGap;

                const tile = {
                    index,
                    x,
                    y,
                    dug: false,
                    isGold: index === this.specialGoldIndex
                };

                tile.shadow = this.add.ellipse(x, y + 24, 70, 18, 0x000000, 0.18);

                tile.glow = this.add.circle(x, y, 40, 0xfff0a0, tile.isGold ? 0.18 : 0.06);

                tile.icon = this.add.image(x, y, 'icon_bush')
                    .setInteractive({ useHandCursor: true })
                    .setScale(this.scale.width < 900 ? 0.72 : 0.82);

                if (tile.isGold) {

                tile.icon.setTint(0xffdf66);

                // 強化閃光
                const sparkle = this.add.image(tile.x, tile.y, 'icon_sparkle')
                .setScale(0.5)
                .setAlpha(0.4);

                this.tweens.add({
                targets: sparkle,
                angle: 360,
                duration: 4000,
                repeat: -1
                });

                this.tweens.add({
                targets: sparkle,
                scale: 0.7,
                alpha: 0.7,
                duration: 900,
                yoyo: true,
                repeat: -1
                });

                tile.sparkle = sparkle;
                }

                tile.icon.on('pointerover', () => {
                    if (tile.dug || this.gameEnded || this.digsLeft <= 0) return;

                    this.tweens.add({
                        targets: tile.icon,
                        scale: 0.9,
                        duration: 100
                    });

                    this.tweens.add({
                        targets: tile.glow,
                        alpha: tile.isGold ? 0.30 : 0.16,
                        scale: 1.15,
                        duration: 100
                    });
                });

                tile.icon.on('pointerout', () => {
                    if (tile.dug) return;

                    this.tweens.add({
                        targets: tile.icon,
                        scale: 0.82,
                        duration: 100
                    });

                    this.tweens.add({
                        targets: tile.glow,
                        alpha: tile.isGold ? 0.18 : 0.06,
                        scale: 1,
                        duration: 100
                    });
                });

                tile.icon.on('pointerdown', () => {
                    if (tile.dug || this.gameEnded || this.digsLeft <= 0) return;
                    this.digTile(tile);
                });

                // 平常呼吸感
                this.tweens.add({
                    targets: tile.glow,
                    alpha: tile.isGold ? 0.24 : 0.10,
                    scale: tile.isGold ? 1.12 : 1.05,
                    duration: 1200 + index * 10,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                this.tiles.push(tile);
            }
        }
    }

    digTile(tile) {
        tile.dug = true;
        this.digsLeft--;
        this.tilesLeft--;

        if (this.cache.audio.exists('dig_sfx')) {
        this.sound.play('dig_sfx', { volume: 0.6 });
        }

        if (this.cache.audio.exists('dig_sfx')) {
        this.sound.play('dig_sfx', { volume: 0.5 });
        } else {
        this.sound.play('click_sfx', { volume: 0.4 });
        }

        // 草叢抖動
        this.tweens.add({
    targets: tile.icon,
    angle: 15,
    duration: 60,
    yoyo: true,
    repeat: 3,
    onComplete: () => {

        this.spawnGrassParticles(tile.x, tile.y);

        this.revealTile(tile);
    }
});


        this.digText.setText(`剩餘挖掘：${this.digsLeft}`);
    }

    revealTile(tile) {
        if (tile.isGold && this.cache.audio.exists('gold_sfx')) {
        this.sound.play('gold_sfx', { volume: 0.6 });
        }
        this.tweens.add({
        targets: tile.icon,
        scale: 0.4,
        alpha: 0,
        duration: 200,
        onComplete: () => {

            tile.icon.destroy();

            tile.dirt = this.add.image(tile.x, tile.y, 'tile_dirt')
                .setScale(0.7);

            }
        });

        const reward = this.rollReward(tile.isGold);

        this.applyReward(reward);
        this.showReward(tile.x, tile.y, reward);

        // Combo 判定
        if (reward.isGood) {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // 2 連擊以上給額外水晶
            if (this.combo >= 2) {
                const comboBonus = Math.min(5, this.combo);
                const crystals = this.registry.get('user_crystals') || 0;
                this.registry.set('user_crystals', crystals + comboBonus);

                this.showFloatingText(tile.x, tile.y - 50, `✨ Combo +${comboBonus}`, '#fff48d');
                this.refreshResourceText();
            }
        } else {
            this.combo = 0;
        }

        if (reward.isTreasure) {
            this.totalFound++;
        }

        this.comboText.setText(`Combo：${this.combo}`);
        this.foundText.setText(`找到寶物：${this.totalFound}`);

        SaveSystem.saveFromRegistry(this.registry);

        if (this.digsLeft <= 0) {
            this.endTreasureGame();
        }
    }

    rollReward(isGold) {
        // 金草叢：大獎池
        if (isGold) {
            const goldRoll = Phaser.Math.Between(1, 100);

            if (goldRoll <= 35) {

            const hats = ['item_hat_tiara','item_hat_straw'];
            const item = Phaser.Utils.Array.GetRandom(hats);

            return {
            type:'equipment',
            label:'帽子裝備！',
            color:'#ffe58c',
            itemId:item,
            isGood:true,
            isTreasure:true
    };
}

        if (goldRoll <= 70) {

                const clothes = ['item_cloth_fairy','item_cloth_farmer'];
                const item = Phaser.Utils.Array.GetRandom(clothes);

                return {
                type:'equipment',
                label:'衣服裝備！',
                color:'#ffd6ff',
                itemId:item,
                isGood:true,
                isTreasure:true
                };
}

            return {
                type: 'crystal',
                label: '大寶箱 +20',
                color: '#8fe9ff',
                amount: 20,
                isGood: true,
                isTreasure: true,
                isChest: true
            };
        }

        // 一般草叢機率
        const roll = Phaser.Math.Between(1, 100);

        if (roll <= 22) {
            return {
                type: 'crystal',
                label: '💎 水晶 +5',
                color: '#8fe9ff',
                amount: 5,
                isGood: true,
                isTreasure: true
            };
        }

        if (roll <= 34) {
            return {
                type: 'reputation',
                label: '🏆 聲望 +1',
                color: '#ffd86b',
                amount: 1,
                isGood: true,
                isTreasure: true
            };
        }

        if (roll <= 44) {
            return {
                type: 'heart',
                label: '❤️ 愛心 +1',
                color: '#ff9fb1',
                amount: 1,
                isGood: true,
                isTreasure: true
            };
        }

        if (roll <= 56) {
            return {
                type: 'extraDig',
                label: '⛏️ 再挖一次',
                color: '#e0f7ff',
                amount: 1,
                isGood: true,
                isTreasure: true
            };
        }

        if (roll <= 66) {
            return {
                type: 'chest',
                label: '🎁 小寶箱',
                color: '#ffe58c',
                isGood: true,
                isTreasure: true,
                isChest: true
            };
        }

        if (roll <= 78) {
            return {
                type: 'bug',
                label: '🐛 蟲蟲！',
                color: '#bfe4a8',
                isGood: false,
                isTreasure: false
            };
        }

        return {
            type: 'empty',
            label: '🌿 空空的',
            color: '#ffffff',
            isGood: false,
            isTreasure: false
        };
    }

    applyReward(reward) {
        if (reward.type === 'crystal') {
            const crystals = this.registry.get('user_crystals') || 0;
            this.registry.set('user_crystals', crystals + (reward.amount || 0));
            this.infoText.setText(`找到寶物：${reward.label}`);
        }

        else if (reward.type === 'reputation') {
            const reputation = this.registry.get('reputation') || 0;
            this.registry.set('reputation', reputation + (reward.amount || 0));
            this.infoText.setText(`找到寶物：${reward.label}`);
        }

        else if (reward.type === 'heart') {
            const hearts = this.registry.get('hearts') || 0;
            this.registry.set('hearts', hearts + (reward.amount || 0));
            this.infoText.setText(`找到寶物：${reward.label}`);
        }

        else if (reward.type === 'extraDig') {
            this.digsLeft += reward.amount || 1;
            this.digText.setText(`剩餘挖掘：${this.digsLeft}`);
            this.infoText.setText(`幸運發現：${reward.label}`);
        }

        else if (reward.type === 'chest') {
            const chestRoll = Phaser.Math.Between(1, 100);

            if (chestRoll <= 50) {
                const crystals = this.registry.get('user_crystals') || 0;
                this.registry.set('user_crystals', crystals + 10);
                this.infoText.setText('小寶箱打開了！💎 水晶 +10');
            } else {
                const gotNew = InventorySystem.addItem(this.registry, 'item_hat_tiara');
                this.infoText.setText(gotNew ? '小寶箱開出：小皇冠！' : '小寶箱開出重複小皇冠');
            }
        }

        else if (reward.type === 'equipment') {
            const gotNew = InventorySystem.addItem(this.registry, reward.itemId);
            this.infoText.setText(gotNew ? `找到裝備：${reward.label}` : `找到重複裝備：${reward.label}`);
        }

        else if (reward.type === 'bug') {
            // 蟲蟲不額外扣次數，避免太挫折，只斷 Combo
            this.infoText.setText('啊呀！挖到小蟲蟲了');
        }

        else {
            this.infoText.setText('這格空空的，再試下一格！');
        }

        this.refreshResourceText();
    }

    showReward(x, y, reward) {
        if (reward.isTreasure) {

    for (let i=0;i<10;i++) {

        const spark = this.add.circle(
            x,
            y,
            Phaser.Math.Between(6,10),
            0xfff2a0
        );

        this.tweens.add({
            targets:spark,
            x:x + Phaser.Math.Between(-120,120),
            y:y + Phaser.Math.Between(-120,120),
            alpha:0,
            duration:500,
            onComplete:()=>spark.destroy()
        });

    }

}

        // 寶箱視覺
        if (reward.isChest) {
            if (this.textures.exists('icon_chest')) {
                const chest = this.add.image(x, y - 8, 'icon_chest').setScale(0.42);
                this.tweens.add({
                    targets: chest,
                    y: y - 42,
                    alpha: 0,
                    duration: 650,
                    onComplete: () => chest.destroy()
                });
            }
        }

        // 文字
        this.showFloatingText(x, y - 8, reward.label, reward.color);

        // 小粒子
        for (let i = 0; i < 6; i++) {
            const spark = this.add.circle(
                x + Phaser.Math.Between(-12, 12),
                y + Phaser.Math.Between(-12, 12),
                Phaser.Math.Between(4, 7),
                0xfff3a8
            );

            this.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-50, 50),
                y: spark.y + Phaser.Math.Between(-60, 10),
                alpha: 0,
                duration: 450,
                onComplete: () => spark.destroy()
            });
        }
    }

    showFloatingText(x, y, text, color = '#ffffff') {
        const rewardText = this.add.text(x, y, text, {
            fontSize: '24px',
            color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: rewardText,
            y: y - 40,
            alpha: 0,
            duration: 700,
            onComplete: () => rewardText.destroy()
        });
    }

    endTreasureGame() {
        if (this.gameEnded) return;
        this.gameEnded = true;

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setDepth(200);

        const panel = this.add.rectangle(640, 360, 520, 320, 0x1a2a1e, 0.95)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(201);

        const title = this.add.text(640, 250, '本局結束', {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(202);

        const resultText = this.add.text(640, 340,
            `找到寶物：${this.totalFound}\n最高 Combo：${this.maxCombo}\n剩餘草叢：${this.tilesLeft}`,
            {
                fontSize: '28px',
                color: '#fff4c4',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4,
                lineSpacing: 10
            }
        ).setOrigin(0.5).setDepth(202);

        const backBtn = this.add.text(640, 450, '返回地圖', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 14, y: 8 },
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('WorldMap', { mapID: this.mapID });
        });

        // 通關小獎
        const crystals = this.registry.get('user_crystals') || 0;
        this.registry.set('user_crystals', crystals + 3);
        SaveSystem.saveFromRegistry(this.registry);

        this.showFloatingText(640, 510, '🎉 完成獎勵：水晶 +3', '#8fe9ff');
    }
    spawnGrassParticles(x, y) {

    for (let i = 0; i < 8; i++) {

        const leaf = this.add.image(x, y, 'leaf_particle')
            .setScale(0.4);

        this.tweens.add({
            targets: leaf,
            x: x + Phaser.Math.Between(-90, 90),
            y: y + Phaser.Math.Between(-90, 30),
            angle: Phaser.Math.Between(-180, 180),
            alpha: 0,
            duration: 500,
            onComplete: () => leaf.destroy()
        });

    }

}
}