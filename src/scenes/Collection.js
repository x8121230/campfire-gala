// src/scenes/Collection.js
import RewardPopup from '../UI/RewardPopup.js';
import AudioSystem from '../systems/AudioSystem.js';
import CharacterManager from '../managers/CharacterManager.js';
import SaveSystem from '../systems/SaveSystem.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import { ITEM_DB } from '../data/GameData.js';

export default class Collection extends Phaser.Scene {
    constructor() {
        super('Collection');
    }

    init(data) {
        this.mapID = data?.mapID || '01';
        this.selectedType = 'all';
    }

    create() {
        console.log('👗 進入 Collection', {
            equipped_hat: this.registry.get('equipped_hat'),
            equipped_cloth: this.registry.get('equipped_cloth'),
            equipped_fullset: this.registry.get('equipped_fullset'),
            equipped_collectible: this.registry.get('equipped_collectible'),
            owned_items: this.registry.get('owned_items'),
            owned_collectibles: this.registry.get('owned_collectibles')
        });

        const collectionBgmKey = this.cache.audio.exists('collection_bgm')
            ? 'collection_bgm'
            : 'home_bgm';

        AudioSystem.playBgm(this, collectionBgmKey, 0.32);

        this.createCollectionBackground();

        this.add.text(640, 48, '夢幻衣櫃', {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        if (this.textures.exists('btn_back')) {
            const backBtn = this.add.image(80, 60, 'btn_back')
                .setInteractive({ useHandCursor: true })
                .setScale(0.6)
                .setDepth(30);

            backBtn.on('pointerdown', () => {
                console.log('⬅️ 離開 Collection', {
                    equipped_hat: this.registry.get('equipped_hat'),
                    equipped_cloth: this.registry.get('equipped_cloth'),
                    equipped_fullset: this.registry.get('equipped_fullset'),
                    equipped_collectible: this.registry.get('equipped_collectible')
                });

                this.scene.start('WorldMap', { mapID: this.mapID });
            });
        }

        this.charManager = new CharacterManager(this);
        this.charManager.createCharacter(300, 450);

        if (this.charManager.container) {
            this.charManager.container.setDepth(10);
        }

        if (this.charManager.refreshLook) {
            this.charManager.refreshLook();
        }

        this.createCharacterGlow();
        this.createEquippedInfo();
        this.createFilterButtons();
        this.createBonusInfo();
        this.createItemInfoPanel();
        this.createItemGrid();
        this.createTestRewardButton();

        this.checkMotherGuardReward();
    }

    createCollectionBackground() {
        if (this.textures.exists('bg_collection_room')) {
            const bg = this.add.image(640, 360, 'bg_collection_room');
            bg.setDisplaySize(1280, 720);
            bg.setDepth(0);
        } else {
            this.cameras.main.setBackgroundColor('#f6d8e7');
            this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.14).setDepth(0);
        }

        this.add.rectangle(285, 455, 410, 540, 0xffffff, 0.10)
            .setStrokeStyle(6, 0xfaf7f2)
            .setDepth(1);

        this.add.rectangle(285, 455, 388, 518, 0xffffff, 0.08)
            .setStrokeStyle(2, 0xffffff, 0.6)
            .setDepth(2);

        this.add.ellipse(285, 610, 160, 36, 0x000000, 0.18).setDepth(3);

        this.add.rectangle(285, 80, 170, 42, 0x000000, 0.38)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(4);

        this.add.text(285, 80, '裝備祝福', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(5);

        this.add.rectangle(945, 445, 660, 530, 0x000000, 0.14)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(1);
    }

    createCharacterGlow() {
        this.characterGlow = this.add.ellipse(300, 470, 210, 340, 0xffffff, 0.08)
            .setDepth(6);

        this.characterGlow2 = this.add.ellipse(300, 470, 235, 365, 0xfff4c9, 0.06)
            .setDepth(5);

        this.tweens.add({
            targets: [this.characterGlow, this.characterGlow2],
            alpha: 0.16,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createEquippedInfo() {
        this.equippedHatText = this.add.text(285, 650, '', {
            fontSize: '24px',
            color: '#fff2a8',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        this.equippedClothText = this.add.text(285, 680, '', {
            fontSize: '24px',
            color: '#d9f7ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        this.equippedFullsetText = this.add.text(285, 710, '', {
            fontSize: '24px',
            color: '#ffd6ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        this.equippedCollectibleText = this.add.text(285, 740, '', {
            fontSize: '24px',
            color: '#b8fff1',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        this.updateEquippedInfo();
    }

    createFilterButtons() {
        console.log('✅ createFilterButtons 新版有執行');

        const filters = [
            { key: 'all', label: '全部', x: 690 },
            { key: 'hat', label: '帽子', x: 820 },
            { key: 'cloth', label: '衣服', x: 950 },
            { key: 'fullset', label: '全身裝', x: 1080 },
            { key: 'collectible', label: '收藏品', x: 1210 }
        ];

        this.filterButtons = [];

        filters.forEach(filter => {
            const btn = this.add.rectangle(filter.x, 122, 120, 48, 0x000000, 0.42)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true })
                .setDepth(10);

            const label = this.add.text(filter.x, 122, filter.label, {
                fontSize: '22px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(11);

            btn.on('pointerdown', () => {
                this.selectedType = filter.key;
                this.refreshItemGrid();
                this.refreshFilterButtons();
            });

            this.filterButtons.push({ key: filter.key, btn, label });
        });

        this.refreshFilterButtons();
    }

    refreshFilterButtons() {
        if (!this.filterButtons) return;

        this.filterButtons.forEach(item => {
            if (item.key === this.selectedType) {
                item.btn.setFillStyle(0x6aa8ff, 0.92);
            } else {
                item.btn.setFillStyle(0x000000, 0.42);
            }
        });
    }

    createBonusInfo() {
        console.log('✅ createBonusInfo 新版有執行');

        this.bonusLine0 = this.add.text(285, 116, '', {
            fontSize: '26px',
            color: '#fff2a8',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 250 }
        }).setOrigin(0.5, 0).setDepth(11);

        this.bonusLine1 = this.add.text(285, 150, '', {
            fontSize: '26px',
            color: '#ffe38a',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 250 }
        }).setOrigin(0.5, 0).setDepth(11);

        this.bonusLine2 = this.add.text(285, 184, '', {
            fontSize: '26px',
            color: '#ffd1dc',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 250 }
        }).setOrigin(0.5, 0).setDepth(11);

        this.bonusLine3 = this.add.text(285, 218, '', {
            fontSize: '26px',
            color: '#b8fff1',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 250 }
        }).setOrigin(0.5, 0).setDepth(11);

        this.updateBonusInfo();
    }

    createItemInfoPanel() {
        const panelX = 285;
        const panelY = 640;

        this.itemInfoBg = this.add.rectangle(panelX, panelY, 320, 210, 0x1a1a1a, 0.84)
            .setStrokeStyle(2, 0xffffff, 0.9)
            .setDepth(12)
            .setVisible(false);

        this.itemInfoTitle = this.add.text(panelX, panelY - 78, '', {
            fontSize: '24px',
            color: '#fff2a8',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 280 }
        }).setOrigin(0.5).setDepth(13).setVisible(false);

        this.itemInfoRarity = this.add.text(panelX, panelY - 40, '', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 280 }
        }).setOrigin(0.5).setDepth(13).setVisible(false);

        this.itemInfoEffect = this.add.text(panelX, panelY + 12, '', {
            fontSize: '18px',
            color: '#d9f7ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 280 },
            lineSpacing: 10
        }).setOrigin(0.5).setDepth(13).setVisible(false);

        this.itemInfoDesc = this.add.text(panelX, panelY + 82, '', {
            fontSize: '17px',
            color: '#ffdede',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 280 },
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(13).setVisible(false);
    }

    showItemInfo(itemData) {
        if (!itemData) return;

        const rarityMap = {
            common: '普通',
            rare: '稀有',
            epic: '夢幻',
            dream: '夢幻',
            legend: '傳說',
            legendary: '傳說',
            stage: '關卡'
        };

        const rarityColorMap = {
            common: '#ffffff',
            rare: '#ffd966',
            epic: '#d6a8ff',
            dream: '#d6a8ff',
            legend: '#ffb36b',
            legendary: '#ffb36b',
            stage: '#8fe3ff'
        };

        const rarityLabel = rarityMap[itemData.rarity] || '普通';
        const rarityColor = rarityColorMap[itemData.rarity] || '#ffffff';

        const effects = itemData.effects || {};
        const effectLines = [];

        if (effects.extraPlayCount > 0) {
            effectLines.push(`今天可以多玩 ${effects.extraPlayCount} 次`);
        }

        if (effects.rewardRate > 0) {
            effectLines.push(`寶箱獎勵變多（+${effects.rewardRate}%）`);
        }

        if (effects.dropRate > 0) {
            effectLines.push(`更容易找到好東西（+${effects.dropRate}%）`);
        }

        if (effects.revealHint > 0) {
            effectLines.push(`可以獲得提示 +${effects.revealHint}`);
        }

        if (effects.timeBonus > 0) {
            effectLines.push(`答題時間增加 ${effects.timeBonus} 秒`);
        }

        if (effects.extraMistake > 0) {
            effectLines.push(`可多容錯 ${effects.extraMistake} 次`);
        }

        if (effects.noHeartCost > 0) {
            effectLines.push('進入小遊戲不消耗體力');
        }

        if (effects.ignoreReputationLock > 0) {
            effectLines.push('進入關卡可無視聲望門檻');
        }

        if (itemData.skill?.type === 'scout') {
            effectLines.push(`每局可探索 ${itemData.skill.usesPerRun || 1} 格未挖開區域`);
        }

        this.itemInfoBg.setVisible(true);
        this.itemInfoTitle.setVisible(true);
        this.itemInfoRarity.setVisible(true);
        this.itemInfoEffect.setVisible(true);
        this.itemInfoDesc.setVisible(true);

        this.itemInfoTitle.setText(itemData.name || '未知裝備');
        this.itemInfoRarity.setText(`稀有度：${rarityLabel}`);
        this.itemInfoRarity.setColor(rarityColor);

        if (effectLines.length > 0) {
            this.itemInfoEffect.setText(effectLines.join('\n'));
        } else {
            this.itemInfoEffect.setText('目前沒有特殊加成');
        }

        this.itemInfoDesc.setText(itemData.desc || '');
    }

    clearItemInfo() {
        if (!this.itemInfoBg || !this.itemInfoTitle || !this.itemInfoRarity || !this.itemInfoEffect || !this.itemInfoDesc) return;

        this.itemInfoTitle.setText('');
        this.itemInfoRarity.setText('');
        this.itemInfoEffect.setText('');
        this.itemInfoDesc.setText('');

        this.itemInfoBg.setVisible(false);
        this.itemInfoTitle.setVisible(false);
        this.itemInfoRarity.setVisible(false);
        this.itemInfoEffect.setVisible(false);
        this.itemInfoDesc.setVisible(false);
    }

    checkMotherGuardReward() {
        const secretState = this.registry.get('secret_state') || {};
        if (!secretState.motherGuardPendingReward) return;
        if (secretState.motherGuardUnlocked) return;

        const rewardItemKey = 'item_fullset_secret_guard';
        const ownedRaw = this.registry.get('owned_items');
        const ownedItems = Array.isArray(ownedRaw) ? [...ownedRaw] : [];

        if (!ownedItems.includes(rewardItemKey)) {
            ownedItems.push(rewardItemKey);
            this.registry.set('owned_items', ownedItems);
        }

        let newItems = this.registry.get('new_items') || [];
        if (!Array.isArray(newItems)) newItems = [];
        if (!newItems.includes(rewardItemKey)) {
            newItems.push(rewardItemKey);
            this.registry.set('new_items', newItems);
        }

        this.registry.set('secret_state', {
            ...secretState,
            motherGuardUnlocked: true,
            motherGuardPendingReward: false,
            motherGuardSequence: [],
            motherGuardSequenceStartTime: 0
        });

        SaveSystem.saveFromRegistry(this.registry);

        this.refreshItemGrid();
        this.updateEquippedInfo();
        this.updateBonusInfo();

        this.time.delayedCall(120, () => {
            const itemName = ITEM_DB?.[rewardItemKey]?.name || '母上的守護';
            const itemIcon = ITEM_DB?.[rewardItemKey]?.icon || null;

            this.showRewardPopup(
                '隱藏彩蛋完成！',
                `獲得傳說裝備\n${itemName}`,
                '#ffcf7d',
                itemIcon
            );

            this.highlightItem(rewardItemKey);
        });
    }

    createTestRewardButton() {
        const testBtnBg = this.add.rectangle(1180, 60, 150, 44, 0x4a7dff, 0.9)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(20);

        this.add.text(1180, 60, '測試送裝備', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(21);

        testBtnBg.on('pointerdown', () => {
            const testItemKey = 'item_cloth_fairy_01';
            const reward = EquipmentSystem.giveItem(this.registry, testItemKey);

            console.log('🎁 測試送裝備結果：', reward);
            console.log('👜 目前 owned_items =', this.registry.get('owned_items'));
            console.log('📦 ITEM_DB[item_cloth_fairy_01] =', ITEM_DB?.[testItemKey]);

            if (reward.type === 'item') {
                const itemName = ITEM_DB?.[reward.itemKey]?.name || reward.itemKey;
                const itemIcon = ITEM_DB?.[reward.itemKey]?.icon || reward.itemKey;

                this.showRewardPopup(
                    '獲得獎勵',
                    `獲得新裝備\n${itemName}`,
                    '#fff2a8',
                    itemIcon
                );
            } else if (reward.type === 'crystal') {
                this.showRewardPopup(
                    '獲得獎勵',
                    `重複裝備\n轉為 ${reward.amount} 水晶`,
                    '#8fffd9',
                    'icon_crystal'
                );
            }

            this.refreshItemGrid();

            if (reward.type === 'item' && reward.isNew) {
                this.highlightItem(reward.itemKey);
            }

            SaveSystem.saveFromRegistry(this.registry);
        });
    }

    showRewardToast(message, color = '#fff2a8') {
        const bg = this.add.rectangle(640, 120, 420, 64, 0x000000, 0.72)
            .setStrokeStyle(3, 0xffffff)
            .setDepth(50)
            .setAlpha(0);

        const text = this.add.text(640, 120, message, {
            fontSize: '28px',
            color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(51).setAlpha(0);

        this.tweens.add({
            targets: [bg, text],
            alpha: 1,
            duration: 180,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.time.delayedCall(900, () => {
                    this.tweens.add({
                        targets: [bg, text],
                        alpha: 0,
                        y: '-=10',
                        duration: 220,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            bg.destroy();
                            text.destroy();
                        }
                    });
                });
            }
        });
    }

    showRewardPopup(title, content, color = '#fff2a8', iconKey = null) {
        if (this.rewardPopupElements) {
            this.rewardPopupElements.forEach(obj => obj.destroy());
            this.rewardPopupElements = null;
        }

        const centerX = 640;
        const centerY = 360;

        const overlay = this.add.rectangle(centerX, centerY, 1280, 720, 0x000000, 0.45)
            .setDepth(100)
            .setInteractive();

        const panel = this.add.rectangle(centerX, centerY, 460, 320, 0xffffff, 0.97)
            .setStrokeStyle(4, 0x5b4636)
            .setDepth(101);

        const titleText = this.add.text(centerX, centerY - 78, title, {
            fontSize: '34px',
            color: '#5b3b22',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(102);

        let rewardIcon = null;
        let contentY = centerY + 28;

        if (iconKey && this.textures.exists(iconKey)) {
            rewardIcon = this.add.image(centerX, centerY - 18, iconKey)
                .setDisplaySize(72, 72)
                .setDepth(102);

            contentY = centerY + 58;
        }

        const contentText = this.add.text(centerX, contentY, content, {
            fontSize: '28px',
            color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            wordWrap: { width: 320 },
            lineSpacing: 16
        }).setOrigin(0.5).setDepth(102);

        const okBtn = this.add.rectangle(centerX, centerY + 126, 140, 50, 0x6aa8ff, 1)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        const okText = this.add.text(centerX, centerY + 126, '確定', {
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(103);

        const closePopup = () => {
            if (this.rewardPopupElements) {
                this.rewardPopupElements.forEach(obj => obj.destroy());
                this.rewardPopupElements = null;
            }
        };

        okBtn.on('pointerdown', closePopup);
        overlay.on('pointerdown', closePopup);

        this.rewardPopupElements = [
            overlay, panel, titleText, contentText, okBtn, okText
        ];

        if (rewardIcon) {
            this.rewardPopupElements.push(rewardIcon);
        }
    }

    createItemGrid() {
        this.itemSlots = [];
        this.itemSlotMap = {};
        this.refreshItemGrid();

        this.input.keyboard.on('keydown-R', () => {
            const itemKey = 'item_cloth_fairy_01';
            const result = EquipmentSystem.giveItem(this.registry, itemKey);

            SaveSystem.saveFromRegistry(this.registry);
            this.refreshItemGrid();

            if (result.type === 'item') {
                RewardPopup.showItem(this, itemKey, {
                    title: '恭喜獲得新裝備！'
                });
            } else if (result.type === 'crystal') {
                RewardPopup.showCrystal(this, result.amount || 1, {
                    title: '重複裝備已轉換',
                    itemName: `水晶 +${result.amount || 1}`,
                    iconKey: 'icon_crystal',
                    description: `你抽到重複的「小仙子洋裝」，已自動轉換成 ${result.amount || 1} 顆水晶。`
                });
            } else {
                console.warn('R 測試送裝備失敗', result);
            }
        });
    }

    getRarityColor(rarity) {
        const rarityColors = {
            common: 0xffffff,
            rare: 0xffd966,
            epic: 0xc084ff,
            dream: 0xc084ff,
            legend: 0xff8c42,
            legendary: 0xff8c42,
            stage: 0x8fe3ff
        };

        return rarityColors[rarity] || 0xffffff;
    }

    applyRarityEffect(panel, rarity) {
        if (!panel) return;

        if (rarity === 'rare') {
            this.tweens.add({
                targets: panel,
                alpha: 0.75,
                duration: 700,
                yoyo: true,
                repeat: -1
            });
        }

        if (rarity === 'epic' || rarity === 'dream') {
            this.tweens.add({
                targets: panel,
                alpha: 0.68,
                duration: 520,
                yoyo: true,
                repeat: -1
            });
        }

        if (rarity === 'legend' || rarity === 'legendary') {
            this.tweens.add({
                targets: panel,
                alpha: 0.6,
                duration: 380,
                yoyo: true,
                repeat: -1
            });
        }
    }

    refreshItemGrid() {
        if (this.itemSlots) {
            this.itemSlots.forEach(obj => {
                if (obj && obj.destroy) obj.destroy();
            });
        }

        this.itemSlots = [];
        this.itemSlotMap = {};

        const ownedItemsRaw = this.registry.get('owned_items');
        const ownedItems = Array.isArray(ownedItemsRaw) ? ownedItemsRaw : [];

        const ownedCollectiblesRaw = this.registry.get('owned_collectibles');
        const ownedCollectibles = Array.isArray(ownedCollectiblesRaw) ? ownedCollectiblesRaw : [];

        const owned = [...ownedItems, ...ownedCollectibles];

        const newItemsRaw = this.registry.get('new_items');
        const newItems = Array.isArray(newItemsRaw) ? newItemsRaw : [];

        const equippedHat = this.registry.get('equipped_hat') ?? 'none';
        const equippedCloth = this.registry.get('equipped_cloth') ?? 'none';
        const equippedFullset = this.registry.get('equipped_fullset') ?? 'none';
        const equippedCollectible = this.registry.get('equipped_collectible') ?? 'none';

        const filteredItems = owned.filter(itemKey => {
            const itemData = ITEM_DB?.[itemKey];
            if (!itemData) return false;

            if (this.selectedType === 'all') return true;
            return itemData.type === this.selectedType;
        });

        if (filteredItems.length === 0) {
            const emptyText = this.add.text(945, 360, '這個分類還沒有收藏喔！', {
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(6);

            this.itemSlots.push(emptyText);
            return;
        }

        filteredItems.forEach((itemKey, index) => {
            const itemData = ITEM_DB?.[itemKey];
            if (!itemData) return;

            const isNew = newItems.includes(itemKey);
            const rarityColor = this.getRarityColor(itemData.rarity);

            const x = 710 + (index % 3) * 170;
            const y = 280 + Math.floor(index / 3) * 175;

            const panel = this.add.rectangle(x, y, 145, 145, 0x000000, 0.28)
                .setStrokeStyle(3, rarityColor)
                .setDepth(5);

            this.applyRarityEffect(panel, itemData.rarity);

            let isEquipped = false;
            if (itemData.type === 'hat' && equippedHat === itemKey) isEquipped = true;
            if (itemData.type === 'cloth' && equippedCloth === itemKey) isEquipped = true;
            if (itemData.type === 'fullset' && equippedFullset === itemKey) isEquipped = true;
            if (itemData.type === 'collectible' && equippedCollectible === itemKey) isEquipped = true;

            if (isEquipped) {
                panel.setStrokeStyle(5, 0x00ffcc);
                panel.setFillStyle(0x00ffd0, 0.16);

                this.tweens.add({
                    targets: panel,
                    alpha: 0.86,
                    duration: 650,
                    yoyo: true,
                    repeat: -1
                });
            }

            const iconKey = itemData.icon || itemKey;

            const rarityMap = {
                common: '普通',
                rare: '稀有',
                epic: '夢幻',
                dream: '夢幻',
                legend: '傳說',
                legendary: '傳說',
                stage: '關卡'
            };

            const rarityLabel = rarityMap[itemData.rarity] || '普通';

            const tagX = x - 34;
            const tagY = y - 52;

            const rarityTag = this.add.rectangle(tagX, tagY, 72, 28, rarityColor, 0.95)
                .setStrokeStyle(1, 0x000000, 0.25)
                .setDepth(6);

            const rarityText = this.add.text(x - 42, y - 58, rarityLabel, {
                fontSize: '22px',
                fontFamily: 'Microsoft JhengHei',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.3).setDepth(7);

            let newTag = null;
            let newText = null;

            if (isNew) {
                const newX = x + 36;
                const newY = y - 56;

                newTag = this.add.rectangle(newX, newY, 64, 26, 0xff3b3b, 0.95)
                    .setStrokeStyle(2, 0xffffff)
                    .setDepth(7);

                newText = this.add.text(newX, newY, 'NEW', {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(8);

                this.tweens.add({
                    targets: [newTag, newText],
                    alpha: 0.65,
                    duration: 450,
                    yoyo: true,
                    repeat: -1
                });
            }

            if (!this.textures.exists(iconKey)) {
                const missingText = this.add.text(x, y, '缺少圖片', {
                    fontSize: '18px',
                    color: '#ffaaaa'
                }).setOrigin(0.5).setDepth(6);

                const nameText = this.add.text(x, y + 68, itemData.name || itemKey, {
                    fontSize: '18px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                    align: 'center',
                    wordWrap: { width: 130 }
                }).setOrigin(0.5).setDepth(6);

                this.itemSlots.push(panel, rarityTag, rarityText, missingText, nameText);
                if (newTag) this.itemSlots.push(newTag);
                if (newText) this.itemSlots.push(newText);

                this.itemSlotMap[itemKey] = {
                    panel,
                    slot: null,
                    nameText,
                    rarityTag,
                    rarityText,
                    newTag,
                    newText
                };
                return;
            }

            const slot = this.add.image(x, y - 12, iconKey)
                .setScale(0.42)
                .setDepth(6)
                .setInteractive({ useHandCursor: true });

            const nameText = this.add.text(x, y + 64, itemData.name || itemKey, {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: 130 }
            }).setOrigin(0.5).setDepth(6);

            let equipTagBg = null;
            let equipTag = null;

            if (isEquipped) {
                const equipX = x + 34;
                const equipY = y - 56;

                equipTagBg = this.add.rectangle(equipX, equipY, 74, 30, 0x00d9b7, 0.95)
                    .setStrokeStyle(2, 0xffffff, 0.9)
                    .setDepth(7);

                equipTag = this.add.text(equipX, equipY, '已裝備', {
                    fontSize: '18px',
                    fontFamily: 'Microsoft JhengHei',
                    color: '#003a33',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(8);

                this.tweens.add({
                    targets: [equipTagBg, equipTag],
                    alpha: 0.88,
                    duration: 650,
                    yoyo: true,
                    repeat: -1
                });
            }

            slot.on('pointerover', () => {
                this.showItemInfo(itemData);

                this.tweens.add({
                    targets: slot,
                    scale: 0.47,
                    duration: 100
                });

                this.tweens.add({
                    targets: panel,
                    alpha: 0.5,
                    duration: 100
                });
            });

            slot.on('pointerout', () => {
                this.clearItemInfo();

                this.tweens.add({
                    targets: slot,
                    scale: 0.42,
                    duration: 100
                });

                this.tweens.add({
                    targets: panel,
                    alpha: 1,
                    duration: 100
                });
            });

            slot.on('pointerdown', () => {
                this.showItemInfo(itemData);

                if (
                    itemData.type === 'hat' ||
                    itemData.type === 'cloth' ||
                    itemData.type === 'fullset' ||
                    itemData.type === 'collectible'
                ) {
                    this.equipItem(itemKey, itemData.type);
                }
            });

            this.itemSlots.push(panel, rarityTag, rarityText, slot, nameText);
            if (equipTagBg) this.itemSlots.push(equipTagBg);
            if (equipTag) this.itemSlots.push(equipTag);
            if (newTag) this.itemSlots.push(newTag);
            if (newText) this.itemSlots.push(newText);

            this.itemSlotMap[itemKey] = {
                panel,
                slot,
                nameText,
                rarityTag,
                rarityText,
                newTag,
                newText
            };
        });
    }

    highlightItem(itemKey) {
        if (!this.itemSlotMap) return;

        const target = this.itemSlotMap[itemKey];
        if (!target) return;

        const { panel, slot, nameText, rarityTag, rarityText } = target;

        if (panel) {
            panel.setStrokeStyle(6, 0xfff27a);
            panel.setFillStyle(0xfff4a8, 0.18);

            this.tweens.add({
                targets: panel,
                alpha: 0.45,
                duration: 180,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    const itemData = ITEM_DB?.[itemKey];
                    const rarityColor = this.getRarityColor(itemData?.rarity);

                    const equippedHat = this.registry.get('equipped_hat') ?? 'none';
                    const equippedCloth = this.registry.get('equipped_cloth') ?? 'none';
                    const equippedFullset = this.registry.get('equipped_fullset') ?? 'none';
                    const equippedCollectible = this.registry.get('equipped_collectible') ?? 'none';

                    let isEquipped = false;
                    if (itemData?.type === 'hat' && equippedHat === itemKey) isEquipped = true;
                    if (itemData?.type === 'cloth' && equippedCloth === itemKey) isEquipped = true;
                    if (itemData?.type === 'fullset' && equippedFullset === itemKey) isEquipped = true;
                    if (itemData?.type === 'collectible' && equippedCollectible === itemKey) isEquipped = true;

                    if (isEquipped) {
                        panel.setStrokeStyle(5, 0x00ffcc);
                        panel.setFillStyle(0x00ffd0, 0.16);
                    } else {
                        panel.setStrokeStyle(3, rarityColor);
                        panel.setFillStyle(0x000000, 0.28);
                    }

                    panel.setAlpha(1);
                }
            });
        }

        if (slot) {
            const baseScale = slot.scale;

            this.tweens.add({
                targets: slot,
                scale: baseScale * 1.18,
                duration: 180,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut'
            });
        }

        if (nameText) {
            this.tweens.add({
                targets: nameText,
                alpha: 0.35,
                duration: 150,
                yoyo: true,
                repeat: 5
            });
        }

        if (rarityTag) {
            this.tweens.add({
                targets: [rarityTag, rarityText],
                alpha: 0.4,
                duration: 150,
                yoyo: true,
                repeat: 5
            });
        }
    }

    equipItem(itemKey, type) {
        const equippedHat = this.registry.get('equipped_hat') ?? 'none';
        const equippedCloth = this.registry.get('equipped_cloth') ?? 'none';
        const equippedFullset = this.registry.get('equipped_fullset') ?? 'none';
        const equippedCollectible = this.registry.get('equipped_collectible') ?? 'none';

        let newItems = this.registry.get('new_items') || [];
        if (!Array.isArray(newItems)) newItems = [];
        newItems = newItems.filter(i => i !== itemKey);
        this.registry.set('new_items', newItems);

        let equipSfxKey = 'click_sfx';

        if (type === 'hat' && this.cache.audio.exists('equip_hat_sfx')) {
            equipSfxKey = 'equip_hat_sfx';
        }
        if (type === 'cloth' && this.cache.audio.exists('equip_cloth_sfx')) {
            equipSfxKey = 'equip_cloth_sfx';
        }
        if (type === 'fullset' && this.cache.audio.exists('equip_fullset_sfx')) {
            equipSfxKey = 'equip_fullset_sfx';
        }
        if (type === 'collectible' && this.cache.audio.exists('equip_hat_sfx')) {
            equipSfxKey = 'equip_hat_sfx';
        }

        if (this.cache.audio.exists(equipSfxKey)) {
            this.sound.play(equipSfxKey, { volume: 0.55 });
        }

        if (type === 'hat') {
            if (equippedHat === itemKey) {
                this.registry.set('equipped_hat', 'none');
            } else {
                this.registry.set('equipped_hat', itemKey);
                this.registry.set('equipped_fullset', 'none');
            }
        } else if (type === 'cloth') {
            if (equippedCloth === itemKey) {
                this.registry.set('equipped_cloth', 'none');
            } else {
                this.registry.set('equipped_cloth', itemKey);
                this.registry.set('equipped_fullset', 'none');
            }
        } else if (type === 'fullset') {
            if (equippedFullset === itemKey) {
                this.registry.set('equipped_fullset', 'none');
            } else {
                this.registry.set('equipped_fullset', itemKey);
                this.registry.set('equipped_hat', 'none');
                this.registry.set('equipped_cloth', 'none');
            }
        } else if (type === 'collectible') {
            if (equippedCollectible === itemKey) {
                this.registry.set('equipped_collectible', 'none');
            } else {
                this.registry.set('equipped_collectible', itemKey);
            }
        }

        console.log('🎽 裝備變更後', {
            equipped_hat: this.registry.get('equipped_hat'),
            equipped_cloth: this.registry.get('equipped_cloth'),
            equipped_fullset: this.registry.get('equipped_fullset'),
            equipped_collectible: this.registry.get('equipped_collectible')
        });

        if (this.charManager && this.charManager.refreshLook) {
            this.charManager.refreshLook();
        }

        if (this.charManager?.container) {
            this.tweens.add({
                targets: this.charManager.container,
                scaleX: 0.84,
                scaleY: 0.84,
                duration: 120,
                yoyo: true,
                ease: 'Back.easeOut'
            });

            const flash = this.add.circle(300, 440, 120, 0xffffff, 0.4).setDepth(9);

            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 1.6,
                duration: 350,
                onComplete: () => flash.destroy()
            });
        }

        this.updateEquippedInfo();
        this.updateBonusInfo();
        this.refreshItemGrid();
        SaveSystem.saveFromRegistry(this.registry);
    }

    updateEquippedInfo() {
        const equippedHat = this.registry.get('equipped_hat') ?? 'none';
        const equippedCloth = this.registry.get('equipped_cloth') ?? 'none';
        const equippedFullset = this.registry.get('equipped_fullset') ?? 'none';
        const equippedCollectible = this.registry.get('equipped_collectible') ?? 'none';

        const lines = [];

        if (equippedHat !== 'none' && ITEM_DB?.[equippedHat]) {
            lines.push({
                target: this.equippedHatText,
                text: `帽子：${ITEM_DB[equippedHat].name}`
            });
        }

        if (equippedCloth !== 'none' && ITEM_DB?.[equippedCloth]) {
            lines.push({
                target: this.equippedClothText,
                text: `衣服：${ITEM_DB[equippedCloth].name}`
            });
        }

        if (equippedFullset !== 'none' && ITEM_DB?.[equippedFullset]) {
            lines.push({
                target: this.equippedFullsetText,
                text: `全身裝：${ITEM_DB[equippedFullset].name}`
            });
        }

        if (equippedCollectible !== 'none' && ITEM_DB?.[equippedCollectible]) {
            lines.push({
                target: this.equippedCollectibleText,
                text: `收藏品：${ITEM_DB[equippedCollectible].name}`
            });
        }

        const allTargets = [
            this.equippedHatText,
            this.equippedClothText,
            this.equippedFullsetText,
            this.equippedCollectibleText
        ];

        allTargets.forEach(t => {
            if (t) {
                t.setText('');
                t.setVisible(false);
            }
        });

        const startY = 650;
        const gapY = 30;

        lines.forEach((line, index) => {
            if (line.target) {
                line.target.setText(line.text);
                line.target.setY(startY + index * gapY);
                line.target.setVisible(true);
            }
        });
    }

    updateBonusInfo() {
        if (!this.bonusLine0 || !this.bonusLine1 || !this.bonusLine2 || !this.bonusLine3) return;

        const lines = EquipmentSystem.getBonusSummaryLines(this.registry);

        this.bonusLine0.setText(lines[0] || '');
        this.bonusLine1.setText(lines[1] || '');
        this.bonusLine2.setText(lines[2] || '');
        this.bonusLine3.setText(lines[3] || '');

        if (!lines.length) {
            this.bonusLine0.setText('目前沒有加成');
            this.bonusLine1.setText('');
            this.bonusLine2.setText('');
            this.bonusLine3.setText('');
        }
    }
}