// src/scenes/TreasureHunt.js
import StageManager from '../systems/StageManager.js';
import BaseMiniGame from './BaseMiniGame.js';
import SaveSystem from '../systems/SaveSystem.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import RewardPopup from '../UI/RewardPopup.js';

export default class TreasureHunt extends BaseMiniGame {
    constructor() {
        super('TreasureHunt');
    }

    init(data) {
        super.init(data);

        this.stageId = data?.stageId || 'bush_01';
        this.stageData = data?.stageData || null;

        this.gameKey = 'treasure';
        this.levelLabel = this.stageData?.name || data?.label || '尋寶小遊戲';
        this.rewardBase = this.stageData?.rewardBase ?? data?.rewardBase ?? 20;

        this.extraRewardRate = 0;
        this.extraDropRate = 0;
        this.extraPlayCount = 0;

        this.hasOpenedTreasure = false;

        this.gridSize = this.stageData?.config?.gridSize ?? 5;
        this.digCount = this.stageData?.config?.digCount ?? 10;
        this.goldBushCount = this.stageData?.config?.goldBushCount ?? 1;
    }

    create() {
        this.cameras.main.setBackgroundColor('#134f5c');

        SaveSystem.applyToRegistry(this.registry);

        console.log('🎯 進入關卡', {
            stageId: this.stageId,
            stageData: this.stageData,
            rewardBase: this.rewardBase,
            gridSize: this.gridSize,
            digCount: this.digCount,
            goldBushCount: this.goldBushCount
        });

        // 先暫時不要呼叫不存在的 getMiniGameBonus
        this.extraRewardRate = 0;
        this.extraDropRate = 0;
        this.extraPlayCount = 0;

        // 如果這個函式存在就套用，不存在也不讓遊戲爆掉
        if (EquipmentSystem && typeof EquipmentSystem.applyBonusToRegistry === 'function') {
            EquipmentSystem.applyBonusToRegistry(this.registry);
        }

        const oldPlayCount = SaveSystem.getMiniGameStat(this.gameKey, 'playCount', 0);
        SaveSystem.updateMiniGameStat(this.gameKey, 'playCount', oldPlayCount + 1);

        this.createTitle(`💰 ${this.levelLabel}`);
        this.createBackButton();
        this.createInfoText('點寶箱獲得獎勵');

        this.createBonusText();
        this.createPlayCountText();
        this.createTreasureChest();
    }

    createBonusText() {
        const lines = [];

        if (this.extraRewardRate > 0) {
            lines.push(`水晶加成 +${Math.round(this.extraRewardRate * 100)}%`);
        }

        if (this.extraDropRate > 0) {
            lines.push(`掉寶加成 +${Math.round(this.extraDropRate * 100)}%`);
        }

        if (this.extraPlayCount > 0) {
            lines.push(`今日次數 +${this.extraPlayCount}`);
        }

        const text = lines.length > 0 ? lines.join('   ') : '目前沒有裝備加成';

        this.bonusText = this.add.text(640, 205, text, {
            fontSize: '22px',
            color: '#d9f7ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
    }

    createPlayCountText() {
        const currentCount = this.getTodayTreasurePlayCount();
        const maxCount = 1 + this.extraPlayCount;
        const remain = Math.max(0, maxCount - currentCount);

        this.playCountText = this.add.text(640, 245, `今日可玩次數：${remain} / ${maxCount}`, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createTreasureChest() {
        this.treasure = this.add.rectangle(640, 390, 220, 140, 0xffd966)
            .setStrokeStyle(5, 0x8f6b00)
            .setInteractive({ useHandCursor: true });

        this.treasureLid = this.add.rectangle(640, 330, 240, 40, 0xd4a017)
            .setStrokeStyle(4, 0x8f6b00);

        this.treasureLabel = this.add.text(640, 395, '寶箱', {
            fontSize: '34px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.treasure.on('pointerover', () => {
            if (this.hasOpenedTreasure) return;

            this.tweens.add({
                targets: [this.treasure, this.treasureLid],
                scaleX: 1.03,
                scaleY: 1.03,
                duration: 100
            });
        });

        this.treasure.on('pointerout', () => {
            this.tweens.add({
                targets: [this.treasure, this.treasureLid],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        this.treasure.on('pointerdown', () => {
            this.openTreasure();
        });
    }

    openTreasure() {
        if (this.hasOpenedTreasure) {
            this.infoText.setText('這個寶箱已經打開囉！');
            return;
        }

        const currentCount = this.getTodayTreasurePlayCount();
        const maxCount = 1 + this.extraPlayCount;

        if (currentCount >= maxCount) {
            this.infoText.setText('今天的尋寶次數已用完囉！');
            return;
        }

        this.hasOpenedTreasure = true;
        this.addTodayTreasurePlayCount();

        const rewardAmount = Math.floor(this.rewardBase * (1 + this.extraRewardRate));
        const currentCrystals = this.registry.get('user_crystals') || 0;
        this.registry.set('user_crystals', currentCrystals + rewardAmount);

        let rewardText = `你獲得了 ${rewardAmount} 水晶！`;
        const dropRoll = Math.random();
        const luckyThreshold = Math.min(0.95, 0.5 + this.extraDropRate);

        let itemKey = '';
        let itemName = '';

        if (dropRoll < luckyThreshold) {
            itemKey = 'item_hat_tiara';
            itemName = '小皇冠';
        } else {
            itemKey = 'item_cloth_fairy';
            itemName = '小仙子洋裝';
        }

        const itemResult = EquipmentSystem.giveItem(this.registry, itemKey);

        if (itemResult.type === 'item') {
            rewardText += `\n還撿到：${itemName}`;
        } else if (itemResult.type === 'crystal') {
            rewardText += `\n重複獲得 ${itemName}，自動轉成 +1 水晶`;
        } else {
            rewardText += `\n裝備掉落失敗：${itemKey}`;
        }

        this.playOpenAnimation();

        const oldClearCount = SaveSystem.getMiniGameStat(this.gameKey, 'clearCount', 0);
        SaveSystem.updateMiniGameStat(this.gameKey, 'clearCount', oldClearCount + 1);

        if (rewardAmount > SaveSystem.getMiniGameStat(this.gameKey, 'bestScore', 0)) {
            SaveSystem.updateMiniGameStat(this.gameKey, 'bestScore', rewardAmount);
        }

        const finalScore = rewardAmount;
        const stars = StageManager.calculateStars(this.stageData, finalScore);

        StageManager.completeStage(
            this.registry,
            this.stageId,
            finalScore,
            stars
        );

        console.log('✅ 關卡完成', {
            stageId: this.stageId,
            finalScore,
            stars
        });

        SaveSystem.saveFromRegistry(this.registry);

        this.infoText.setText(rewardText);
        this.updatePlayCountText();

        if (itemResult.type === 'item') {
            RewardPopup.showItem(this, itemKey, {
                title: '恭喜獲得新裝備！'
            });
        } else if (itemResult.type === 'crystal') {
            RewardPopup.showCrystal(this, itemResult.amount || 1, {
                title: '重複裝備已轉換',
                itemName: `水晶 +${itemResult.amount || 1}`,
                iconKey: 'icon_crystal',
                description: `你抽到重複的「${itemName}」，已自動轉換成 ${itemResult.amount || 1} 顆水晶。`
            });
        }
    }

    playOpenAnimation() {
        this.tweens.add({
            targets: this.treasureLid,
            y: 290,
            angle: -12,
            duration: 220,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: [this.treasure, this.treasureLabel],
            scaleX: 1.06,
            scaleY: 1.06,
            yoyo: true,
            duration: 120,
            repeat: 1
        });

        for (let i = 0; i < 8; i++) {
            const spark = this.add.circle(
                640 + Phaser.Math.Between(-30, 30),
                340 + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(5, 10),
                0xfff2a8
            );

            this.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-120, 120),
                y: spark.y + Phaser.Math.Between(-120, 60),
                alpha: 0,
                duration: 500,
                onComplete: () => spark.destroy()
            });
        }
    }

    updatePlayCountText() {
        const currentCount = this.getTodayTreasurePlayCount();
        const maxCount = 1 + this.extraPlayCount;
        const remain = Math.max(0, maxCount - currentCount);

        this.playCountText.setText(`今日可玩次數：${remain} / ${maxCount}`);
    }

    getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `treasure_play_count_${year}${month}${day}`;
    }

    getTodayTreasurePlayCount() {
        const key = this.getTodayKey();
        return Number(localStorage.getItem(key) || 0);
    }

    addTodayTreasurePlayCount() {
        const key = this.getTodayKey();
        const current = this.getTodayTreasurePlayCount();
        localStorage.setItem(key, String(current + 1));
    }
}