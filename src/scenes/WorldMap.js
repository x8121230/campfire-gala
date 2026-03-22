// src/scenes/WorldMap.js
import CharacterManager from '../managers/CharacterManager.js';
import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import { getStageData } from '../data/StageData.js';

import StageEntryPopup from '../UI/StageEntryPopup.js';

export default class WorldMap extends Phaser.Scene {
    constructor() {
        super('WorldMap');

        this.isEditMode = false;
        this.selectedItem = null;
        this.isPopupOpen = false;
    }

    init(data) {
        SaveSystem.applyToRegistry(this.registry);
        StageManager.applyToRegistry(this.registry);

        console.log('📂 [WorldMap] 存檔同步成功，角色穿著已就緒。');

        this.mapID = data?.mapID || '01';

        const mapNames = {
            '01': '森林營地',
            '02': '神祕湖泊',
            '03': '星空營火'
        };

        this.mapDisplayName = mapNames[this.mapID] || '未知地點';
    }

    preload() {
        this.load.image('current_map', `assets/WorldMap${this.mapID}.jpg`);

        if (!this.cache.audio.exists('forest_music')) {
            this.load.audio('forest_music', 'assets/forest_bgm.mp3');
        }

        if (!this.cache.audio.exists('lake_music')) {
            this.load.audio('lake_music', 'assets/lake_bgm.mp3');
        }

        if (!this.cache.audio.exists('campfire_music')) {
            this.load.audio('campfire_music', 'assets/campfire_bgm.mp3');
        }
    }

    create() {
        this.isPopupOpen = false;

        // 建立關卡進入彈窗
        this.stageEntryPopup = new StageEntryPopup(this);

        // 背景
        const bg = this.add.image(640, 360, 'current_map').setInteractive();
        bg.setDisplaySize(1280, 720).setDepth(0);

        // 地圖音樂
        this.playMapBgm();

        // UI
        this.createTopUI();
        this.setupMotherGuardSecret();

        // 裝飾品
        this.decorGroup = this.add.group();
        this.renderDecorations();

        // 角色
        this.charManager = new CharacterManager(this);
        this.charManager.createCharacter(400, 450);
        this.charManager.container.setDepth(5);

        const hitArea = new Phaser.Geom.Rectangle(-100, -200, 200, 400);
        this.charManager.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.charManager.container.on('pointerdown', () => {
            if (this.isEditMode || this.isPopupOpen) return;

            // 彩蛋第 4 步：進入換衣間
            this.onEnterCollectionForMotherGuardSecret();

            this.scene.start('Collection', {
                mapID: this.mapID
            });
        });

        // 關卡 icon
        this.createLevelIcons();

        // 返回首頁
        this.add.image(65, 115, 'btn_back')
            .setInteractive({ useHandCursor: true })
            .setScale(0.5)
            .setDepth(110)
            .on('pointerdown', () => {
                if (this.isPopupOpen) return;
                this.scene.start('Start');
            });

        // 編輯按鈕
        this.editBtn = this.add.image(1220, 120, 'btn_edit')
            .setInteractive({ useHandCursor: true })
            .setScale(0.6)
            .setDepth(110)
            .on('pointerdown', () => {
                if (this.isPopupOpen) return;
                this.toggleEditMode();
            });

        // 放置家具
        bg.on('pointerdown', (pointer) => {
            if (this.isEditMode && this.selectedItem && !this.isPopupOpen) {
                this.placeDecoration(pointer.x, pointer.y);
            }
        });
    }

    playMapBgm() {
        let bgmKey = 'forest_music';

        if (this.mapID === '01') {
            bgmKey = 'forest_music';
        } else if (this.mapID === '02') {
            bgmKey = 'lake_music';
        } else if (this.mapID === '03') {
            bgmKey = 'campfire_music';
        }

        AudioSystem.playBgm(this, bgmKey, 0.5);
    }

    createTopUI() {
        this.add.rectangle(640, 40, 1280, 80, 0x000000, 0.4).setDepth(100);

        const textStyle = {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        };

        this.heartText = this.add.text(50, 20, `❤️ ${this.registry.get('hearts') || 0}`, textStyle)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        this.crystalText = this.add.text(320, 20, `💎 ${this.registry.get('user_crystals') || 0}`, textStyle)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        this.repText = this.add.text(520, 20, `🏆 聲望: ${this.registry.get('reputation') || 0}`, textStyle)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        this.add.text(1260, 20, this.mapDisplayName, textStyle)
            .setOrigin(1, 0)
            .setDepth(101);

        // 彩蛋：前 3 步
        this.heartText.on('pointerdown', () => {
            this.handleMotherGuardStep('heart');
        });

        this.crystalText.on('pointerdown', () => {
            this.handleMotherGuardStep('crystal');
        });

        this.repText.on('pointerdown', () => {
            this.handleMotherGuardStep('reputation');
        });
    }

    updateTopUI() {
        if (this.heartText) {
            this.heartText.setText(`❤️ ${this.registry.get('hearts') || 0}`);
        }

        if (this.crystalText) {
            this.crystalText.setText(`💎 ${this.registry.get('user_crystals') || 0}`);
        }

        if (this.repText) {
            this.repText.setText(`🏆 聲望: ${this.registry.get('reputation') || 0}`);
        }
    }

    createLevelIcons() {
        const levels = [
            {
                x: 1150,
                y: 610,
                texture: 'icon_bush',
                label: '草叢尋寶',
                stageKey: 'bush_01'
            },
            {
                x: 755,
                y: 540,
                texture: 'icon_fire',
                label: '營火晚會',
                stageKey: 'campfire_01'
            },
            {
                x: 700,
                y: 300,
                texture: 'icon_firefly',
                label: '點點螢火',
                stageKey: 'firefly_01'
            },
            {
                x: 150,
                y: 330,
                texture: 'icon_tree',
                label: '星空連線',
                stageKey: 'constellation_01'
            },
            {
                x: 500,
                y: 200,
                texture: 'icon_animal',
                label: '森林歷險',
                stageKey: 'animals_01'
            }
        ];

        levels.forEach((level) => {
            const rawStageData = getStageData(level.stageKey);
            const unlocked = StageManager.isUnlocked(this.registry, level.stageKey);

            const stageProgress = this.registry.get('stage_progress') || {};
            const progress = stageProgress[level.stageKey] || {
                unlocked: false,
                cleared: false,
                stars: 0,
                bestScore: 0
            };

            const container = this.add.container(level.x, level.y).setDepth(10);

            const glow = this.add.circle(0, 0, 46, 0xffffff, 0.12);

            const icon = this.add.image(0, 0, level.texture)
                .setInteractive({ useHandCursor: true })
                .setScale(0.8);

            const labelBg = this.add.rectangle(0, 76, 160, 34, 0x000000, 0.35);

            const label = this.add.text(0, 75, level.label, {
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const lockOverlay = this.add.circle(0, 0, 42, 0x000000, unlocked ? 0 : 0.45);

            const lockText = this.add.text(0, -2, unlocked ? '' : '🔒', {
                fontSize: '34px'
            }).setOrigin(0.5);

            const clearText = this.add.text(0, -58, progress.cleared ? '已通關' : '', {
                fontSize: '20px',
                color: '#ffe082',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            const starCount = progress.stars || 0;
            const stars = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);

            const starText = this.add.text(0, 110, stars, {
                fontSize: '20px',
                color: unlocked ? '#ffd54f' : '#999999',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            container.add([
                glow,
                icon,
                lockOverlay,
                lockText,
                clearText,
                labelBg,
                label,
                starText
            ]);

            if (!unlocked) {
                icon.setTint(0x777777);
                glow.setAlpha(0.08);
            }

            this.tweens.add({
                targets: icon,
                scale: 0.84,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: glow,
                alpha: unlocked ? 0.25 : 0.10,
                scale: 1.18,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            icon.on('pointerover', () => {
                if (this.isEditMode || this.isPopupOpen) return;

                this.tweens.add({
                    targets: icon,
                    scale: 0.92,
                    duration: 120
                });

                this.tweens.add({
                    targets: glow,
                    alpha: unlocked ? 0.40 : 0.18,
                    scale: 1.35,
                    duration: 120
                });

                this.tweens.add({
                    targets: label,
                    scale: 1.06,
                    duration: 120
                });

                this.tweens.add({
                    targets: labelBg,
                    alpha: 0.58,
                    duration: 120
                });
            });

            icon.on('pointerout', () => {
                this.tweens.add({
                    targets: icon,
                    scale: 0.84,
                    duration: 120
                });

                this.tweens.add({
                    targets: glow,
                    alpha: unlocked ? 0.25 : 0.10,
                    scale: 1.18,
                    duration: 120
                });

                this.tweens.add({
                    targets: label,
                    scale: 1,
                    duration: 120
                });

                this.tweens.add({
                    targets: labelBg,
                    alpha: 0.35,
                    duration: 120
                });
            });

            icon.on('pointerdown', () => {
                if (this.isEditMode || this.isPopupOpen) return;

                if (!rawStageData) {
                    console.warn('❌ 找不到關卡資料:', level.stageKey);
                    return;
                }

                const checkResult = StageManager.canEnterStage(this.registry, level.stageKey);

                const ignoreReputationLock = StageManager.hasIgnoreReputationLock(this.registry);
                const noHeartCost = StageManager.hasNoHeartCost(this.registry);

                const popupStageData = {
                    ...rawStageData,
                    title: rawStageData.name,
                    sceneKey: rawStageData.scene,

                    // 顯示給 popup 用
                    requiredReputation: ignoreReputationLock
                        ? '已無視'
                        : (rawStageData.unlockReputation || 0),

                    heartCost: noHeartCost
                        ? 0
                        : (rawStageData.staminaCost || 0),

                    description: `${rawStageData.name} 即將開始，準備來挑戰吧！`,
                    howToPlay: `${rawStageData.name} 的玩法說明之後可再補上。`,

                    // 額外提供 popup 可用資訊
                    bypassReputation: ignoreReputationLock,
                    bypassHeartCost: noHeartCost
                };

                const popupEntryResult = {
                    success: checkResult.ok,
                    reason: checkResult.reason,
                    message: checkResult.message,
                    bypassReputation: ignoreReputationLock,
                    bypassHeartCost: noHeartCost
                };


                if (!checkResult.ok &&
                    checkResult.reason !== 'locked' &&
                    checkResult.reason !== 'not_enough_hearts') {
                    console.warn('❌ 無法進入關卡:', checkResult.message);
                    return;
                }

                this.isPopupOpen = true;

                this.stageEntryPopup.show({
                    stageData: popupStageData,
                    entryResult: popupEntryResult,

                    onConfirm: () => {
                        this.isPopupOpen = false;

                        const success = StageManager.enterStage(this, level.stageKey);
                        if (!success) return;

                        this.updateTopUI();
                        this.saveGameData();
                    },

                    onCancel: () => {
                        this.isPopupOpen = false;
                    }
                });
            });
        });
    }

    placeDecoration(x, y) {
        const item = this.add.image(x, y, this.selectedItem)
            .setScale(0.6)
            .setDepth(1);

        this.decorGroup.add(item);

        const placed = this.registry.get('placed_decorations') || [];
        placed.push({
            key: this.selectedItem,
            x,
            y
        });

        this.registry.set('placed_decorations', placed);
        this.saveGameData();
    }

    renderDecorations() {
        const placed = this.registry.get('placed_decorations') || [];

        placed.forEach((data) => {
            const item = this.add.image(data.x, data.y, data.key)
                .setScale(0.6)
                .setDepth(1);

            this.decorGroup.add(item);
        });
    }

    saveGameData() {
        const dataToSave = {
            hearts: this.registry.get('hearts'),
            max_hearts: this.registry.get('max_hearts'),
            recovery_seconds: this.registry.get('recovery_seconds'),
            next_heart_time: this.registry.get('next_heart_time'),

            user_crystals: this.registry.get('user_crystals'),
            reputation: this.registry.get('reputation'),

            owned_items: this.registry.get('owned_items'),
            placed_decorations: this.registry.get('placed_decorations'),

            equipped_hat: this.registry.get('equipped_hat'),
            equipped_cloth: this.registry.get('equipped_cloth'),
            equipped_fullset: this.registry.get('equipped_fullset'),

            minigame_stats: this.registry.get('minigame_stats'),
            bonus_play_counts: this.registry.get('bonus_play_counts'),
            bonus_reward_rates: this.registry.get('bonus_reward_rates'),
            bonus_drop_rates: this.registry.get('bonus_drop_rates'),

            secret_state: this.registry.get('secret_state'),
            stage_progress: this.registry.get('stage_progress')
        };

        localStorage.setItem('forest_save_data', JSON.stringify(dataToSave));
        console.log('💾 大地圖進度已存檔！');
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            this.editBtn.setTint(0x00ff00);
            console.log('🛠️ 進入編輯模式');
        } else {
            this.editBtn.clearTint();
            this.saveGameData();
            console.log('✅ 離開編輯模式，已存檔');
        }
    }

    showMessage(text) {
        const msg = this.add.text(640, 110, text, {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { left: 16, right: 16, top: 10, bottom: 10 }
        })
            .setOrigin(0.5)
            .setDepth(9999);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 1200,
            delay: 900,
            onComplete: () => msg.destroy()
        });
    }

    setupMotherGuardSecret() {
        const current = this.registry.get('secret_state') || {};

        const mergedState = {
            motherGuardUnlocked: current.motherGuardUnlocked || false,
            motherGuardPendingReward: current.motherGuardPendingReward || false,
            motherGuardSequence: Array.isArray(current.motherGuardSequence) ? current.motherGuardSequence : [],
            motherGuardSequenceStartTime: current.motherGuardSequenceStartTime || 0
        };

        this.registry.set('secret_state', mergedState);
    }

    handleMotherGuardStep(stepKey) {
        if (this.mapID !== '01') return;
        if (this.isPopupOpen) return;

        const secretState = this.registry.get('secret_state') || {};
        if (secretState.motherGuardUnlocked) return;
        if (secretState.motherGuardPendingReward) return;

        const expectedOrder = ['heart', 'crystal', 'reputation'];
        let sequence = Array.isArray(secretState.motherGuardSequence)
            ? [...secretState.motherGuardSequence]
            : [];

        const startTime = secretState.motherGuardSequenceStartTime || 0;
        const now = Date.now();

        if (sequence.length === 0) {
            if (stepKey !== 'heart') {
                this.resetMotherGuardSequence();
                return;
            }

            this.registry.set('secret_state', {
                ...secretState,
                motherGuardSequence: ['heart'],
                motherGuardSequenceStartTime: now
            });

            this.saveGameData();
            return;
        }

        if (now - startTime > 5000) {
            this.resetMotherGuardSequence();
            return;
        }

        const nextExpected = expectedOrder[sequence.length];

        if (stepKey !== nextExpected) {
            this.resetMotherGuardSequence();
            return;
        }

        sequence.push(stepKey);

        this.registry.set('secret_state', {
            ...secretState,
            motherGuardSequence: sequence,
            motherGuardSequenceStartTime: startTime
        });

        this.saveGameData();
    }

    onEnterCollectionForMotherGuardSecret() {
        if (this.mapID !== '01') return false;

        const secretState = this.registry.get('secret_state') || {};
        if (secretState.motherGuardUnlocked) return false;
        if (secretState.motherGuardPendingReward) return false;

        const sequence = Array.isArray(secretState.motherGuardSequence)
            ? secretState.motherGuardSequence
            : [];

        const now = Date.now();
        const startTime = secretState.motherGuardSequenceStartTime || 0;

        const isCorrectSequence =
            sequence.length === 3 &&
            sequence[0] === 'heart' &&
            sequence[1] === 'crystal' &&
            sequence[2] === 'reputation';

        const isWithinTime = startTime > 0 && (now - startTime <= 5000);

        if (!isCorrectSequence || !isWithinTime) {
            this.resetMotherGuardSequence();
            return false;
        }

        this.registry.set('secret_state', {
            ...secretState,
            motherGuardPendingReward: true,
            motherGuardSequence: [],
            motherGuardSequenceStartTime: 0
        });

        this.saveGameData();
        return true;
    }

    resetMotherGuardSequence() {
        const secretState = this.registry.get('secret_state') || {};

        this.registry.set('secret_state', {
            ...secretState,
            motherGuardSequence: [],
            motherGuardSequenceStartTime: 0
        });

        this.saveGameData();
    }
}