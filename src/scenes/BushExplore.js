// src/scenes/BushExplore.js

import AudioSystem from '../systems/AudioSystem.js';
import { getStageData } from '../data/StageData.js';
import { BUSH_EXPLORE_LEVELS } from '../data/BushExploreData.js';

import BushMapSystem from '../systems/BushMapSystem.js';
import BushDangerSystem from '../systems/BushDangerSystem.js';
import BushBugSystem from '../systems/BushBugSystem.js';
import BushQuestionSystem from '../systems/BushQuestionSystem.js';
import BushRewardSystem from '../systems/BushRewardSystem.js';
import CollectibleSystem from '../systems/CollectibleSystem.js';
import CharacterManager from '../managers/CharacterManager.js';
import { ITEM_DB } from '../data/GameData.js';



export default class BushExplore extends Phaser.Scene {
    constructor() {
        super('BushExplore');
    }

    init(data) {
        this.stageId = data?.stageId || 'bush_01';
        this.returnScene = data?.returnScene || 'WorldMap';
        this.returnData = data?.returnData || {};
    }

    preload() {
        this.load.audio('whoosh', 'assets/whoosh.mp3');
        this.load.audio('tile_pop', 'assets/tile_pop.mp3');
    }

    hideMessage() {
        if (!this.messagePanel || !this.messagePanelShadow || !this.messageText) return;

        if (this.messageHideTimer) {
            this.messageHideTimer.remove();
            this.messageHideTimer = null;
        }

        this.tweens.killTweensOf([
            this.messagePanel,
            this.messagePanelShadow,
            this.messageText
        ]);

        this.tweens.add({
            targets: [this.messagePanel, this.messagePanelShadow, this.messageText],
            alpha: 0,
            duration: 180,
            ease: 'Sine.Out',
            onComplete: () => {
                this.messageShowing = false;
                this.messagePriority = 0;
            }
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.collectibleSkillUsed = false;

        this.equippedCollectible = this.registry.get('equipped_collectible') ?? 'none';

        const levelData = BUSH_EXPLORE_LEVELS[this.stageId] || BUSH_EXPLORE_LEVELS.bush_01;
        this.levelData = levelData;

        this.gameState = {
            phase: 'searching',

            levelId: levelData.id,
            stamina: levelData.startStamina,
            maxStamina: levelData.startStamina,

            digLimit: levelData.digLimit,
            digsUsed: 0,

            nextDigBlocked: false,

            gotGoldBush: false,
            questionAnswered: false,
            questionCorrect: false,

            mapTiles: [],
            currentQuestion: null,
            questionQueue: [],
            questionIndex: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            questionTimeLeft: 0,
            questionTimeLimit: 0,
            earlyObserveReady: false,
            usedEarlyObserve: false,

            combo: 0,
            highestCombo: 0,
            hintsShown: [],
            dangerousTilesTriggered: 0,
            bugsCollected: 0,

            flagLimit: 2,
            flagsUsed: 0,
            flagBonusDigGranted: 0,

            goldBonusCrystals: 0,
            goldBonusQuestionTime: 0,
            foundKingBug: false,
            gotLittleCrown: false,
            hasRainbowGrass: false,
            hasKingBug: false,
            resultGranted: false,

            randomEventTriggered: false,
            randomEventType: null,
            questionTimeMultiplier: 1,
            bonusCrystal: 0,
            bonusReputation: 0,
        };

        this.usedEarlyObserve = false;
        this.popupLock = false;
        this.activePopup = null;
        this.messageTween = null;
        this.messageShowing = false;
        this.messagePriority = 0;
        this.messageHideTimer = null;

        this.digCooldownMs = 1200;
        this.nextDigTime = 0;

        this.longPressMs = 400;
        this.longPressTimer = null;
        this.longPressTriggered = false;
        this.pressingTile = null;
        this.questionTimerEvent = null;

        this.answerButtons = [];
        this.answerBreathTween = null;
        this.boardFloatTween = null;
        this.boardGlowTween = null;
        this.tileHoverTweens = new Map();

        // UI v3.2
        this.boardScaleSearching = 1.14;
        this.boardScaleQuestion = 0.72;
        this.boardShiftYQuestion = 210;
        this.boardShiftXQuestion = 580;

        // BushExplore 專用 BGM
        if (this.cache.audio.exists('bush_bgm')) {
            AudioSystem.playBgm(this, 'bush_bgm', 0.28);
        } else if (this.cache.audio.exists('forest_music')) {
            AudioSystem.playBgm(this, 'forest_music', 0.28);
        }

        this.applyEquipmentBonus();
        this.gameState.mapTiles = BushMapSystem.createLevelMap(this.levelData);
        this.setupGoldBushTypes();

        this.createBackgroundDecor();
        this.createUI();
        this.createBoard();

        this.refreshHUD();

        this.equippedCollectibleId = this.registry.get('equipped_collectible') ?? 'none';
        this.equippedCollectibleData = ITEM_DB?.[this.equippedCollectibleId] || null;

        this.collectibleSkillUsed = false;

        // this.createPaperDollUI();

        this.characterManager = new CharacterManager(this);
        this.characterManager.createCharacter(1180, 395);

        this.createCollectibleSkillButton();
        this.updateCollectibleSkillButtonPosition();

        this.showMessage(`🍃 開始探索 ${levelData.name}！`, 1500);
        this.showTopBannerMessage(this.getRandomTopDangerHint(), 2000, 1);

        CollectibleSystem.unlock(this.registry, 'col_bug_leaf_01');
        console.log('目前收藏品 =', this.registry.get('owned_collectibles'));
        console.log('目前關卡進度 stage_progress =', this.getStageProgressData());

        // ✅ 最後統一跑進場演出
        this.startSceneEntranceSequence();

    }

    startSceneEntranceSequence() {
        // 先把棋盤隱藏，等進場後再出現
        if (this.boardContainer) {
            this.boardContainer.setAlpha(0);
        }

        // 整個畫面先蓋一層黑
        this.entranceBlack = this.add.rectangle(640, 360, 1280, 720, 0x000000, 1)
            .setDepth(9999);

        // 先播 whoosh
        if (this.cache.audio.exists('whoosh')) {
            this.sound.play('whoosh', { volume: 0.45 });
            console.log('✅ whoosh 已播放');
        } else {
            console.log('❌ whoosh 沒載入到');
        }

        // 停 1 秒後開始顯示棋盤 + 黑幕淡出
        this.time.delayedCall(1000, () => {
            if (this.boardContainer) {
                this.boardContainer.setAlpha(1);
            }

            this.playBoardEntranceAnimation();

            this.tweens.add({
                targets: this.entranceBlack,
                alpha: 0,
                duration: 900,
                ease: 'Sine.Out',
                onComplete: () => {
                    this.entranceBlack?.destroy();
                    this.entranceBlack = null;
                }
            });
        });
    }

    updateCollectibleSkillButtonPosition() {
        if (!this.skillBtnContainer) return;
        if (!this.characterManager?.container) return;

        const charX = this.characterManager.container.x;
        const charY = this.characterManager.container.y;

        this.skillBtnContainer.setPosition(
            charX - 0,   ///收藏品技能按鈕
            charY + 240
        );
    }

    pickRandomMessage(list = []) {
            if (!Array.isArray(list) || list.length === 0) return '';
            return Phaser.Utils.Array.GetRandom(list);
        }

        getRandomFruitFoundMessage() {
            return this.pickRandomMessage([
                '🍎 找到果實！',
                '🍎 挖到果實了！',
                '🍎 有收穫！',
                '🍎 發現果實！',
                '🍎 草叢裡有果實！'
            ]);
        }

        getRandomDangerHintMessage() {
            return this.pickRandomMessage([
                '⚠️ 附近怪怪的…',
                '⚠️ 草叢好像晃了一下…',
                '⚠️ 這附近不太安全…',
                '⚠️ 好像有東西躲著…',
                '⚠️ 空氣有點緊張…',
                '⚠️ 旁邊怪怪的！',
                '⚠️ 好像有危險靠近…'
            ]);
        }

        getRandomAnswerCorrectMessage() {
            return this.pickRandomMessage([
                '✅ 答對了！',
                '✅ 好棒！',
                '✅ 真厲害！',
                '✅ 答案正確！',
                '✅ 你看對了！'
            ]);
        }

        getRandomAnswerWrongMessage() {
            return this.pickRandomMessage([
                '❌ 答錯了！體力 -1',
                '❌ 再想想看！體力 -1',
                '❌ 差一點點！體力 -1',
                '❌ 這題沒答對！體力 -1'
            ]);
        }

        getRandomTopDangerHint() {
            return this.pickRandomMessage([
                '⚠️ 感知到附近有危險，長按格子可插旗標記',
                '⚠️ 附近不太安全，試著長按格子標記危險',
                '⚠️ 發現危險線索，可長按格子插旗'
            ]);
        }

        getRandomTopGoldHint() {
            return this.pickRandomMessage([
                '🌟 找到金草叢了！本局獎勵提升',
                '🌟 發現金草叢，這次收穫更值得期待',
                '🌟 金草叢出現了！繼續探索吧'
            ]);
        }

        getRandomBushEvent() {
            const pool = [
                {
                    type: 'forest_breeze',
                    weight: 25,
                    message: '🌬 森林微風吹過，發現一些線索',
                    topBanner: '🌬 森林微風帶來一些觀察線索',
                    apply: () => {
                        const revealCount = Phaser.Math.RND.pick([2, 3, 4]);
                        this.revealRandomTilesHint(revealCount);
                    }
                },
                {
                    
                    type: 'forest_blessing',
                    weight: 25,
                    message: '🌟 森林祝福降臨！',
                    topBanner: '🌟 森林祝福降臨',
                    apply: () => {
                        const oldStamina = this.gameState.stamina;

                        this.gameState.stamina = Math.min(
                            this.gameState.maxStamina,
                            this.gameState.stamina + 1
                        );

                        this.gameState.digLimit += 2;

                        const healed = this.gameState.stamina - oldStamina;

                        if (healed > 0) {
                            this.showMessage('🌟 森林祝福！體力 +1、挖掘 +2', 2400, 2);
                        } else {
                            this.showMessage('🌟 森林祝福！挖掘 +2', 2400, 2);
                        }
                    }
                },
                {
                    type: 'quick_thought',
                    weight: 25,
                    message: '✨ 靈感一閃！答題時間大幅增加',
                    topBanner: '✨ 靈感一閃，思路變清晰了',
                    apply: () => {
                        this.gameState.questionTimeMultiplier =
                            (this.gameState.questionTimeMultiplier || 1) * 1.5;
                    }
                },
                {
                    type: 'shiny_discovery',
                    weight: 25,
                    message: '💎 發現亮晶晶的寶物！結算獎勵提升',
                    topBanner: '💎 發現了閃閃發光的東西',
                    apply: () => {
                        this.gameState.bonusCrystal =
                            (this.gameState.bonusCrystal || 0) + 1;
                        this.gameState.bonusReputation =
                            (this.gameState.bonusReputation || 0) + 1;
                    }
                }
            ];

            const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * totalWeight;

            for (const event of pool) {
                roll -= event.weight;
                if (roll <= 0) {
                    return event;
                }
            }

            return pool[0];
        }

        tryTriggerRandomEvent(tile) {
            if (!tile) return false;

            // 只限普通草叢
            if (tile.tileType !== 'normal') return false;

            // 單局只觸發一次
            if (this.gameState.randomEventTriggered) return false;

            // 5% 機率
            const triggerChance = 0.05;
            if (Math.random() >= triggerChance) return false;

            const eventData = this.getRandomBushEvent();
            if (!eventData) return false;

            this.gameState.randomEventTriggered = true;
            this.gameState.randomEventType = eventData.type;

            if (typeof eventData.apply === 'function') {
                eventData.apply();
            }

            this.refreshHUD();
            this.showTopBannerMessage(eventData.topBanner, null, 2);

            return true;
        }

    createCollectibleSkillButton() {
        if (this.skillBtnContainer) {
            this.skillBtnContainer.destroy();
            this.skillBtnContainer = null;
        }

        const skillConfig = this.getCollectibleSkillConfig();
        if (!skillConfig) {
            return;
        }

        const btnBg = this.add.rectangle(0, 0, 170, 60, skillConfig.buttonColor || 0x00c2a8)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const btnIcon = this.add.text(-40, 0, skillConfig.icon || '✨', {
            fontSize: '28px'
        }).setOrigin(0.5);

        const btnText = this.add.text(20, 0, skillConfig.label || '技能', {
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.skillBtnBg = btnBg;
        this.skillBtnIcon = btnIcon;
        this.skillBtnText = btnText;
        this.skillBtnContainer = this.add.container(0, 0, [
            btnBg,
            btnIcon,
            btnText
        ]).setDepth(2100);


        btnBg.on('pointerdown', () => {
            if (this.collectibleSkillUsed) {
                this.showMessage('本局已使用過技能', 1000);
                return;
            }

            this.showCollectibleSkillConfirmPopup();
        });

        btnBg.on('pointerover', () => {
            if (this.collectibleSkillUsed) return;
            btnBg.setScale(1.04);
            btnIcon.setScale(1.04);
            btnText.setScale(1.04);
        });

        btnBg.on('pointerout', () => {
            btnBg.setScale(1);
            btnIcon.setScale(1);
            btnText.setScale(1);
        });

        btnText.setInteractive({ useHandCursor: true });
        btnIcon.setInteractive({ useHandCursor: true });

        btnText.on('pointerdown', () => btnBg.emit('pointerdown'));
        btnIcon.on('pointerdown', () => btnBg.emit('pointerdown'));

        btnText.on('pointerover', () => btnBg.emit('pointerover'));
        btnIcon.on('pointerover', () => btnBg.emit('pointerover'));

        btnText.on('pointerout', () => btnBg.emit('pointerout'));
        btnIcon.on('pointerout', () => btnBg.emit('pointerout'));

    }

        getCollectibleSkillConfig() {
        const collectibleId = this.registry.get('equipped_collectible') ?? 'none';
        const collectibleData = ITEM_DB?.[collectibleId];

        if (!collectibleData || collectibleData.type !== 'collectible') {
            return null;
        }

        const skillType = collectibleData.skill?.type;
        if (!skillType) {
            return null;
        }

        const configMap = {
            scout: {
                type: 'scout',
                icon: '🔍',
                label: '探索',
                confirmTitle: '🔍 發動探索？',
                confirmDesc: '會隨機查看一格是否有危險。\n每局只能使用一次。',
                buttonColor: 0x00c2a8
            }

            // 之後可以繼續往下加
            // extra_time: { ... }
            // peek_gold: { ... }
        };

        return configMap[skillType] || null;
    }

    handleCollectibleSkillUse() {
        const skillConfig = this.getCollectibleSkillConfig();
        if (!skillConfig) return;

        switch (skillConfig.type) {
            case 'scout':
                this.useScoutSkill();
                break;

            default:
                this.showMessage('這個技能還沒完成', 1000);
                break;
        }
    }

    showCollectibleSkillConfirmPopup() {
        const skillConfig = this.getCollectibleSkillConfig();
        if (!skillConfig) return;

        const { container } = this.createPopupBase(560, 300, {
            overlayAlpha: 0.30
        });

        const title = this.add.text(640, 248, skillConfig.confirmTitle || '發動技能？', {
            fontSize: '34px',
            color: '#4d7f34',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const message = this.add.text(
            640,
            320,
            skillConfig.confirmDesc || '要發動這個技能嗎？',
            {
                fontSize: '24px',
                color: '#314927',
                align: 'center',
                lineSpacing: 8
            }
        ).setOrigin(0.5);

        const cancelBtn = this.createPopupButton(
            530,
            425,
            160,
            58,
            '再想想',
            () => {
                this.closeActivePopup();
            },
            0x9a9a9a
        );

        const confirmBtn = this.createPopupButton(
            750,
            425,
            180,
            58,
            '發動技能',
            () => {
                this.closeActivePopup();

                this.time.delayedCall(120, () => {
                    this.handleCollectibleSkillUse();
                    this.markCollectibleSkillUsed();
                });
            },
            0x79ba63
        );

        container.add([
            title,
            message,
            ...cancelBtn,
            ...confirmBtn
        ]);
    }

    markCollectibleSkillUsed() {
        this.collectibleSkillUsed = true;

        if (this.skillBtnBg) {
            this.skillBtnBg.setFillStyle(0x666666, 0.85);
        }

        if (this.skillBtnText) {
            this.skillBtnText.setText('已使用');
        }
    }

    useScoutSkill() {
        const unrevealedTiles = this.gameState.mapTiles.filter(tile => !tile.isRevealed);

        if (!unrevealedTiles.length) {
            this.showMessage('沒有可探索的格子了', 1000);
            return;
        }

        const targetTile = Phaser.Utils.Array.GetRandom(unrevealedTiles);
        const isDanger = this.isDangerTileType(targetTile.tileType);

        const x = targetTile.view?.bg?.x ?? 0;
        const y = targetTile.view?.bg?.y ?? 0;

        const fillColor = isDanger ? 0xffc857 : 0x7be495;
        const strokeColor = isDanger ? 0xff6b6b : 0xffffff;

        const glow = this.add.rectangle(x, y, 92, 92, fillColor, 0.30)
            .setStrokeStyle(4, strokeColor, 0.95)
            .setDepth(220);

        this.boardContainer.add(glow);
        this.boardContainer.bringToTop(glow);

        this.tweens.add({
            targets: glow,
            alpha: 0,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 950,
            onComplete: () => glow.destroy()
        });

        if (isDanger) {
            this.showMessage('⚠️ 豬寶淚感覺這格有危險！', 1500);
        } else {
            this.showMessage('✅ 豬寶淚感覺這格沒有危險！', 1500);
        }
    }

    enterScoutMode() {

        if (this.isScoutMode) return;

        this.isScoutMode = true;

        this.showMessage('🔍 請選擇一格查看', 1200);

        // 畫面提示（微亮）
        this.boardContainer.setAlpha(0.95);
    }

    getStageProgressData() {
        const progress = this.registry.get('stage_progress') || {};
        return { ...progress };
    }


    onClickPaperDoll() {
        if (this.skillState === 'READY') {
            this.enterScoutMode();
            this.skillState = 'USED';
            this.updatePaperDollState();

        } else if (this.skillState === 'USED') {
            this.showMessage('本局已使用', 1000);

        } else {
            this.showMessage('尚未裝備技能', 1000);
        }
    }

    playSfxSafe(key, volume = 0.5) {
        try {
            if (this.cache.audio.exists(key)) {
                this.sound.play(key, { volume });
            }
        } catch (error) {
            console.warn(`[BushExplore] 播放音效失敗: ${key}`, error);
        }
    }

    speakQuestion(text = '') {
        if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.78;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }

    stopQuestionSpeech() {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
    }

    getChoiceDisplayText(question, choice) {
        const style = question?.answerStyle || 'number';

        if (style === 'fruitType' || style === 'fruitCompare') {
            const map = {
                '綠果': '🟢 綠果',
                '紅果': '🔴 紅果',
                '藍果': '🔵 藍果',
                '大果': '🍎 大果',
                '毒果': '☠️ 毒果',
                '果串': '🍇 果串',
                '一樣多': '⚪ 一樣多'
            };

            return map[String(choice)] || String(choice);
        }

        if (style === 'yesno') {
            const map = {
                '有': '✅ 有',
                '沒有': '❌ 沒有',
                '不知道': '❓ 不知道',
                '一半一半': '⚪ 一半一半'
            };

            return map[String(choice)] || String(choice);
        }

        return String(choice);
    }

    playP2DamageFeedback() {
        // 1) 鏡頭震動
        this.cameras.main.shake(180, 0.006);

        // 2) 紅色閃屏
        const flash = this.add.rectangle(640, 360, 1280, 720, 0xff4d4d, 0)
            .setDepth(9999);

        this.tweens.add({
            targets: flash,
            alpha: { from: 0.28, to: 0 },
            duration: 220,
            ease: 'Quad.Out',
            onComplete: () => {
                flash.destroy();
            }
        });

        // 3) 體力文字跳一下
        if (this.topStaminaText) {
            this.topStaminaText.setScale(1);

            this.tweens.add({
                targets: this.topStaminaText,
                scaleX: 1.22,
                scaleY: 1.22,
                duration: 90,
                yoyo: true,
                ease: 'Back.Out'
            });
        }
    }

    playP2FailFeedback() {
        // 1) 更強烈的鏡頭震動
        this.cameras.main.shake(320, 0.012);

        // 2) 更深的紅色閃屏
        const flash = this.add.rectangle(640, 360, 1280, 720, 0xff2a2a, 0)
            .setDepth(10000);

        this.tweens.add({
            targets: flash,
            alpha: { from: 0.42, to: 0 },
            duration: 320,
            ease: 'Quad.Out',
            onComplete: () => {
                flash.destroy();
            }
        });

        // 3) 體力文字縮放一下
        if (this.topStaminaText) {
            this.topStaminaText.setScale(1);

            this.tweens.add({
                targets: this.topStaminaText,
                scaleX: 1.35,
                scaleY: 1.35,
                duration: 120,
                yoyo: true,
                ease: 'Back.Out'
            });
        }
    }

    buildFinalResultData(reward, stageResult) {
        const flagResult = this.flagResultData || this.calculateFlagResult();

        return {
            stageId: this.stageId,
            cleared: !!this.gameState.questionCorrect,
            failed: this.gameState.phase === 'failed',

            stars: stageResult?.stars || 1,
            score: stageResult?.score || 0,

            gotGoldBush: !!this.gameState.gotGoldBush,
            goldType: reward?.goldType || null,
            goldEventType: reward?.goldEventType || null,

            hasRainbowGrass: !!this.gameState.hasRainbowGrass,
            hasKingBug: !!this.gameState.hasKingBug,

            crystals: reward?.crystals || 0,
            reputation: reward?.reputation || 0,

            stageChest: reward?.stageChest || 0,
            smallChest: reward?.chest || 0,
            bigChest: reward?.rareChest || 0,
            dreamChest: reward?.dreamChest || 0,

            itemDrops: [...(reward?.itemDrops || [])],
            chestLootLines: [...(reward?.chestLootLines || [])],

            dreamUpgraded: !!reward?.dreamUpgraded,
            extraRewards: [...(reward?.extraRewards || [])],

            flagResult
        };
    }

    playP2QuestionHitFeedback() {
        if (!this.questionHeaderPanel || !this.questionHeaderShadow) return;

        // 題目框閃紅
        const hitFlash = this.add.rectangle(922, 182, 520, 176, 0xff6b6b, 0)
            .setStrokeStyle(4, 0xffd0d0, 0.95)
            .setDepth(this.questionHeader.depth + 1);

        this.questionHeader.add(hitFlash);

        this.tweens.add({
            targets: hitFlash,
            alpha: { from: 0.42, to: 0 },
            duration: 220,
            ease: 'Quad.Out',
            onComplete: () => {
                hitFlash.destroy();
            }
        });

        // 題目框抖動
        this.tweens.add({
            targets: [this.questionHeaderPanel, this.questionHeaderShadow, this.questionPromptText],
            x: '+=10',
            duration: 42,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.InOut'
        });

        // 計時文字也跳一下
        if (this.questionTimerText) {
            this.questionTimerText.setScale(1);

            this.tweens.add({
                targets: this.questionTimerText,
                scaleX: 1.16,
                scaleY: 1.16,
                duration: 100,
                yoyo: true,
                ease: 'Back.Out'
            });
        }
    }


    updatePaperDollVisibility() {
        if (!this.paperDoll) return;

        if (this.gameState.phase === 'searching') {
            this.paperDoll.setVisible(true);   // P1 顯示
        } else {
            this.paperDoll.setVisible(false);  // P2 / P3 隱藏
        }
    }

    calculateStars() {
        if (this.gameState.phase === 'failed') return 1;
        if (!this.gameState.questionAnswered) return 1;

        const total = this.gameState.totalQuestions || 1;
        const correct = this.gameState.correctAnswers || 0;

        if (correct <= 0) return 1;
        if (correct < total) return 2;

        // 全對時，找到金草叢才 3 星，否則最多 2 星
        if (this.gameState.gotGoldBush) return 3;
        return 2;
    }

    calculateScore() {
        let score = 0;

        score += this.gameState.digsUsed * 10;
        score += this.gameState.bugsCollected * 20;
        score += this.gameState.highestCombo * 30;
        score += (this.gameState.correctAnswers || 0) * 100;

        if (this.gameState.gotGoldBush) {
            score += 80;
        }

        score += Math.max(0, this.gameState.stamina) * 25;

        const flagResult = this.calculateFlagResult();
        score += flagResult.scoreBonus;

        return Math.max(0, score);
    }

    isDangerTileType(tileType) {
        return ['snake', 'thorn', 'boar', 'spiderweb'].includes(tileType);
    }

        calculateFlagResult() {
        let placedFlags = 0;
        let correctFlags = 0;
        let wrongFlags = 0;

        for (const tile of this.gameState.mapTiles) {
            if (!tile.isFlagged) continue;

            placedFlags += 1;

            if (this.isDangerTileType(tile.tileType)) {
                correctFlags += 1;
            } else {
                wrongFlags += 1;
            }
        }

        const ratingDelta = (correctFlags * 1) + (wrongFlags * -2);
        const reputationBonus = correctFlags >= 2 && wrongFlags === 0 ? 1 : 0;
        const crystalBonus = correctFlags >= 2 && wrongFlags === 0 ? 1 : 0;
        const scoreBonus = correctFlags * 25 - wrongFlags * 20;

        return {
            placedFlags,
            correctFlags,
            wrongFlags,
            ratingDelta,
            reputationBonus,
            crystalBonus,
            scoreBonus
        };
    }

    applyFlagRewardToRewardData(reward) {
        const flagResult = this.calculateFlagResult();
        this.flagResultData = flagResult;

        reward.reputation = (reward.reputation || 0) + (flagResult.reputationBonus || 0);
        reward.crystals = (reward.crystals || 0) + (flagResult.crystalBonus || 0);

        return reward;
    }

    applyGoldBushTypeReward(reward) {
        if (!this.gameState.gotGoldBush) return reward;

        const goldTile = this.gameState.mapTiles.find(
            tile => tile.tileType === 'gold' && tile.isRevealed
        );

        if (!goldTile) return reward;

        reward.goldType = goldTile.goldType || 'goldenGrass';
        reward.goldEventType = goldTile.goldEventType || null;

        switch (goldTile.goldType) {
            case 'goldenGrass':
                // 黃金草：小幅加強收穫感，不額外直接塞寶箱
                reward.reputation = (reward.reputation || 0) + 1;
                break;

            case 'rainbowGrass':
                // 彩虹草：夢幻寶箱升級保證
                this.gameState.hasRainbowGrass = true;
                reward.rainbowBonus = true;
                break;

            case 'randomEvent':
                reward.eventBonus = true;
                reward.crystals = (reward.crystals || 0) + (this.gameState.goldBonusCrystals || 0);
                break;

            case 'kingBug':
                // 國王蟲額外掉落交給 BushRewardSystem.resolveChestLoot() 處理
                reward.kingBugFound = true;
                this.gameState.hasKingBug = true;
                break;

            default:
                break;
        }

        return reward;
    }

    applyStageResult() {
        const stageId = this.gameState.levelId;
        const progress = this.getStageProgressData();

        const oldStageData = progress[stageId] || {
            unlocked: true,
            cleared: false,
            stars: 0,
            bestScore: 0,
            firstClearRewardClaimed: false
        };

            const baseStars = this.calculateStars();
            const score = this.calculateScore();

            const flagResult = this.calculateFlagResult();
            this.flagResultData = flagResult;

            const stars = Phaser.Math.Clamp(
                    baseStars + (flagResult.ratingDelta || 0),
                    1,
                    3
            );

        const newStageData = {
            ...oldStageData,
            unlocked: true,
            cleared: oldStageData.cleared || this.gameState.questionCorrect,
            stars: Math.max(oldStageData.stars || 0, stars),
            bestScore: Math.max(oldStageData.bestScore || 0, score)
        };

        progress[stageId] = newStageData;

        const stageData = getStageData(stageId);
        if (stageData?.nextStage && newStageData.cleared) {
            const nextStageId = stageData.nextStage;

            if (!progress[nextStageId]) {
                progress[nextStageId] = {
                    unlocked: true,
                    cleared: false,
                    stars: 0,
                    bestScore: 0,
                    firstClearRewardClaimed: false
                };
            } else {
                progress[nextStageId].unlocked = true;
            }
        }

        this.registry.set('stage_progress', progress);

        return {
            stars,
            score,
            stageData: newStageData,
            wasFirstClear: !oldStageData.cleared && this.gameState.questionCorrect
        };
    }

    applyEquipmentBonus() {
        const bonusDig = this.registry.get('bonus_bush_dig') || 0;
        const bonusStamina = this.registry.get('bonus_bush_stamina') || 0;
        const bonusFlag = this.registry.get('bonus_bush_flag') || 0;

        this.gameState.digLimit += bonusDig;
        this.gameState.stamina += bonusStamina;
        this.gameState.maxStamina += bonusStamina;
        this.gameState.flagLimit += bonusFlag;
    }

    setupGoldBushTypes() {
        const goldTiles = this.gameState.mapTiles.filter(t => t.tileType === 'gold');

        const goldPool = [
            { type: 'goldenGrass', weight: 40 },
            { type: 'rainbowGrass', weight: 30 },
            { type: 'randomEvent', weight: 20 },
            { type: 'kingBug', weight: 10 }
        ];

        for (const tile of goldTiles) {
            const roll = Math.random() * 100;
            let acc = 0;

            for (const entry of goldPool) {
                acc += entry.weight;
                if (roll <= acc) {
                    tile.goldType = entry.type;
                    break;
                }
            }

            // fallback
            if (!tile.goldType) {
                tile.goldType = 'goldenGrass';
            }
        }
    }

    
    startFruitBreathing() {
        if (!this.gameState?.mapTiles) return;

        this.gameState.mapTiles.forEach(tile => {
            if (!tile?.view || !tile.view.bugSprite) return;

            const fruit = tile.view.bugSprite;

            if (!fruit.visible) return;

            // 避免重複加 Tween
            if (fruit._breathingTween) return;

            fruit._breathingTween = this.tweens.add({
                targets: fruit,
                scaleX: fruit.scaleX * 1.08,
                scaleY: fruit.scaleY * 1.08,
                duration: 900 + Math.random() * 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        });
    }

    setTileTexture(tile, textureKey) {
        if (!tile || !tile.view) return;
        if (!tile.view.grassTop) return;

        tile.view.grassTop.setTexture(textureKey);
    }

    getRandomBushTexture() {
        const candidates = [
            'icon_bush_1',
            'icon_bush_2',
            'icon_bush_3',
            'icon_bush_4'
        ].filter(key => this.textures.exists(key));

        if (candidates.length <= 0) {
            return 'icon_bush';
        }

        return Phaser.Utils.Array.GetRandom(candidates);
    }

    createBackgroundDecor() {
        // 最底：森林 JPG
        if (this.textures.exists('bg_bush_forest')) {
            this.add.image(640, 360, 'bg_bush_forest')
                .setDisplaySize(1280, 720)
                .setAlpha(0.72)
                .setDepth(-20);
        }

        // 中層：深綠遮罩，改淡一點
        this.add.rectangle(640, 360, 1280, 720, 0x0f2f1f, 0.04)
            .setDepth(-19);

        // 原本整面底色也改淡，避免把背景整個蓋掉
        this.add.rectangle(640, 360, 1280, 720, 0x214c33, 0.04)
            .setDepth(-18);

        // 柔和背景裝飾
        this.add.circle(110, 92, 88, 0x3f875a, 0.14);
        this.add.circle(1178, 98, 96, 0x3f875a, 0.12);
        this.add.circle(88, 640, 118, 0x3f875a, 0.10);
        this.add.circle(1178, 626, 128, 0x3f875a, 0.10);

    }

    createUI() {
        const startX = 64;
        const startY = 110;
        const gapY = 52;

        // ==========================
        // 左側極簡 HUD
        // ==========================
        this.hudHeart = this.add.text(startX, startY, '❤️ 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#28412e',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.hudDig = this.add.text(startX, startY + gapY, '⛏️ 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#28412e',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.hudFlag = this.add.text(startX, startY + gapY * 2, '🚩 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#28412e',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.hudCrystal = this.add.text(startX, startY + gapY * 3, '✨ 0', {
            fontSize: '28px',
            color: '#fff6cc',
            fontStyle: 'bold',
            stroke: '#23402d',
            strokeThickness: 5
        }).setOrigin(0, 0.5);

        // ==========================
        // 左側補充資訊
        // ==========================
        this.phaseText = this.add.text(64, 255, '', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setVisible(false);

        this.bugCountText = this.add.text(64, 300, '', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setVisible(false);

        this.goldBushText = this.add.text(64, 345, '', {
            fontSize: '22px',
            color: '#ffe88e',
            fontStyle: 'bold'
        }).setVisible(false);

        this.flagText = this.add.text(64, 390, '', {
            fontSize: '22px',
            color: '#ffd7a8',
            fontStyle: 'bold'
        }).setVisible(false);

        this.goalText = this.add.text(64, 440, '🏆 目標：插對危險格可拿加成，插錯會扣評價', {
            fontSize: '18px',
            color: '#d7f2ba',
            fontStyle: 'bold',
            wordWrap: { width: 170 }
        }).setVisible(false);

        // ==========================
        // 上方提示橫幅
        // ==========================
        this.topBannerShadow = this.add.rectangle(640, 44, 760, 52, 0x000000, 0.18)
            .setDepth(2500)
            .setVisible(false);

        this.topBannerBg = this.add.rectangle(640, 40, 760, 52, 0x10291a, 0.94)
            .setStrokeStyle(3, 0xd7f5c0, 0.85)
            .setDepth(2501)
            .setVisible(false);

        this.topBannerText = this.add.text(640, 40, '', {
            fontSize: '24px',
            color: '#f7fff2',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 700 }
        })
        .setOrigin(0.5)
        .setDepth(2502)
        .setVisible(false);

        this.topBannerTween = null;
        this.topBannerShowing = false;
        this.topBannerPriority = 0;

        // ==========================
        // P1 望遠鏡按鈕
        // ==========================
        this.observeBtnShadow = this.add.rectangle(238, 506, 230, 56, 0x000000, 0.20)
            .setVisible(true)
            .setDepth(2000);

        this.observeBtn = this.add.rectangle(234, 500, 230, 56, 0x89cc73, 0.98)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001);

        this.observeBtnIcon = this.add.text(168, 500, '🔍', {
            fontSize: '28px'
        }).setOrigin(0.5).setDepth(2002);

        this.observeBtnText = this.add.text(258, 500, '提前觀察', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2f4a25',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2002); 

        this.observeBtn.on('pointerover', () => {
            if (!this.canEnterQuestionPhase()) return;
            this.observeBtn.setScale(1.04);
            this.observeBtnIcon.setScale(1.04);
            this.observeBtnText.setScale(1.04);
        });

        this.observeBtn.on('pointerout', () => {
            this.observeBtn.setScale(1);
            this.observeBtnIcon.setScale(1);
            this.observeBtnText.setScale(1);
        });

        this.observeBtn.on('pointerdown', () => {
            if (this.gameState.phase !== 'searching') return;
            if (this.gameState.usedEarlyObserve) return;
            if ((this.gameState.digsUsed || 0) < 5) return;

            this.playSfxSafe('ui_click_sfx', 0.42);
            this.showQuestionConfirmPopup();
        });

        // ==========================
        // P2 題目區（置中）
        // ==========================
        this.questionHeader = this.add.container(0, 0);
        this.questionHeader.setVisible(false);
        this.questionHeader.setDepth(3000);

        this.questionHeaderShadow = this.add.rectangle(646, 148, 560, 170, 0x000000, 0.18);
        this.questionHeaderPanel = this.add.rectangle(640, 142, 560, 170, 0xf6ffe8, 0.98)
            .setStrokeStyle(4, 0x97c36f);

        this.questionProgressText = this.add.text(470, 92, '', {
            fontSize: '22px',
            color: '#5f714f',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.questionTimerText = this.add.text(810, 92, '', {
            fontSize: '22px',
            color: '#b45b3c',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);

        this.questionPromptText = this.add.text(640, 150, '', {
            fontSize: '34px',
            color: '#27421f',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 450 },
            lineSpacing: 10
        }).setOrigin(0.5);

        this.questionVoiceBtn = this.add.text(835, 150, '🔊', {
            fontSize: '30px'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        this.questionVoiceBtn.on('pointerdown', () => {
            if (!this.gameState?.currentQuestion) return;
            this.speakQuestion(
                this.gameState.currentQuestion.voiceText ||
                this.gameState.currentQuestion.text ||
                ''
            );
        });

        this.questionHeader.add([
            this.questionHeaderShadow,
            this.questionHeaderPanel,
            this.questionProgressText,
            this.questionTimerText,
            this.questionPromptText,
            this.questionVoiceBtn
        ]);

        // ==========================
        // P2 答案區
        // ==========================
        this.answerContainer = this.add.container(0, 0);
        this.answerContainer.setVisible(false);
        this.answerContainer.setDepth(3000);

        // ==========================
        // 左下提示條
        // ==========================
        this.messagePanelShadow = this.add.rectangle(240, 610, 430, 88, 0x000000, 0.18);

        this.messagePanel = this.add.rectangle(234, 604, 430, 88, 0x10291a, 0.97)
            .setStrokeStyle(3, 0xd7f5c0);


        this.messageText = this.add.text(80, 604, '', {
            fontSize: '25px',
            color: '#ffffff',
            wordWrap: { width: 300 },
            lineSpacing: 4
        }).setOrigin(0, 0.5);
    }

    createBoard() {
        const gridSize = this.levelData.gridSize;
        const tileSize = 92;
        const gap = 10;

        const boardWidth = gridSize * tileSize + (gridSize - 1) * gap;
        const boardHeight = gridSize * tileSize + (gridSize - 1) * gap;

        this.boardContainer = this.add.container(0, 0);
        


        this.boardContainer.setScale(this.boardScaleSearching);
        this.boardContainer.setPosition(0, 0);

        // P1 棋盤往左移
        const boardCenterX = 650; //BBBBB
        const boardCenterY = 350;

        const startX = boardCenterX - boardWidth / 2 + tileSize / 2;
        const startY = boardCenterY - boardHeight / 2 + tileSize / 2;

        // ===== 棋盤浮起來效果：底層陰影 + 外發光 =====/////////////////
        this.boardShadowFar = this.add.rectangle(
            boardCenterX + 18,
            boardCenterY + 24,
            boardWidth + 110,
            boardHeight + 110,
            0x000000,
            0.22
        );

        this.boardShadow = this.add.rectangle(
            boardCenterX + 8,
            boardCenterY + 12,
            boardWidth + 68,
            boardHeight + 68,
            0x08140d,
            0.42
        );

        this.boardGlow = this.add.rectangle(
            boardCenterX,
            boardCenterY,
            boardWidth + 94,
            boardHeight + 94,
            0xe5ffcf,
            0.16
        ).setStrokeStyle(5, 0xf3ffe5, 0.38);

        this.boardFrame = this.add.rectangle(
            boardCenterX,
            boardCenterY,
            boardWidth + 42,
            boardHeight + 42,
            0x2f6840,
            0.99
        ).setStrokeStyle(6, 0xf4ffe8, 1);

        this.boardInner = this.add.rectangle(
            boardCenterX,
            boardCenterY,
            boardWidth + 16,
            boardHeight + 16,
            0x214c33,
            0.42
        ).setStrokeStyle(2, 0xcfe8a9, 0.45);

        this.boardContainer.add([
            this.boardShadowFar,
            this.boardShadow,
            this.boardGlow,
            this.boardFrame,
            this.boardInner
        ]);

        for (const tile of this.gameState.mapTiles) {
            const x = startX + tile.col * (tileSize + gap);
            const y = startY + tile.row * (tileSize + gap);

            tile.isRevealed = !!tile.isRevealed;
            tile.isFlagged = !!tile.isFlagged;

            const hoverGlow = this.add.rectangle(x, y, tileSize + 12, tileSize + 12, 0xe7ffd2, 0.00)
                .setStrokeStyle(2, 0xf4ffe9, 0.0)
                .setOrigin(0.5);

            const shadow = this.add.rectangle(x + 4, y + 5, tileSize, tileSize, 0x000000, 0.20)
                .setOrigin(0.5);

            const bg = this.add.rectangle(x, y, tileSize, tileSize, 0x6b4f34)
                .setStrokeStyle(2, 0xd9ebc8, 0.85)
                .setInteractive({ useHandCursor: true });
                //console.log('tile revealed:', tile.tileType);

            const innerGlow = this.add.rectangle(x, y, tileSize - 10, tileSize - 10, 0x8a6a46, 0.16)
                .setStrokeStyle(1, 0xd9c3a1, 0.22);

            const bushScale = Phaser.Math.FloatBetween(0.56, 0.63);
            const bushAngle = Phaser.Math.FloatBetween(-2, 2);
            const bushOffsetX = Phaser.Math.Between(-3, 3);
            const bushOffsetY = Phaser.Math.Between(-4, 4);

            const bushShadow = this.add.ellipse(
                x + bushOffsetX,
                y + 18,
                54,
                18,
                0x1a2418,
                0.24
            ).setOrigin(0.5);

            const bushTexture = this.getRandomBushTexture();

            const grassTop = this.add.image(x + bushOffsetX, y - 2 + bushOffsetY, bushTexture)
            .setDisplaySize(66, 66)
            .setAngle(bushAngle);

            const label = this.add.text(x, y + 18, '', {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#2a4d2e',
                strokeThickness: 4
            }).setOrigin(0.5);

            const dangerText = this.add.text(x - 24, y - 26, '', {
                fontSize: '22px',
                color: '#fff6c7',
                fontStyle: 'bold',
                stroke: '#2a2a2a',
                strokeThickness: 4,
                backgroundColor: '#5b5b5b',
                padding: { left: 6, right: 6, top: 3, bottom: 3 }
            })
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(30);

            bg.on('pointerover', () => {
                if (this.popupLock) return;
                if (tile.isRevealed) return;
                if (this.gameState.phase !== 'searching') return;
                this.startTileHoverEffect(tile);
            });

            bg.on('pointerout', () => {
                this.stopTileHoverEffect(tile);
                this.cancelTilePress(tile);
            });

            bg.on('pointerdown', () => {
                this.playSfxSafe('ui_click_sfx', 0.42);
                this.startTilePress(tile);
            });

            bg.on('pointerup', () => {
                this.endTilePress(tile);
            });

            bg.on('pointerupoutside', () => {
                this.stopTileHoverEffect(tile);
                this.cancelTilePress(tile);
            });

            tile.view = {
                hoverGlow,
                shadow,
                bg,
                innerGlow,
                bushShadow,
                grassTop,
                label,
                dangerText,
                bushTexture,
                baseBushDisplayWidth: 66,
                baseBushDisplayHeight: 66,
                baseBushAngle: bushAngle,
                baseBushAngle: bushAngle,

                dirt: null,
                bugSprite: null,
                goldSprite: null,
                goldSparkle: null,
                flagSprite: null,
                dangerSprite: null
            };

            hoverGlow.setAlpha(0);
            shadow.setAlpha(0);
            bg.setAlpha(0);
            innerGlow.setAlpha(0);
            bushShadow.setAlpha(0);
            grassTop.setAlpha(0);
            label.setAlpha(0);
            dangerText.setAlpha(0);

            this.boardContainer.add([
                hoverGlow,
                shadow,
                bg,
                innerGlow,
                bushShadow,
                grassTop,
                label,
                dangerText
            ]);

            this.refreshTile(tile);
        }
        this.startBoardFloatEffect();

    }

    playBoardEntranceAnimation() {
        if (!this.gameState?.mapTiles) return;

        const tiles = [...this.gameState.mapTiles].sort((a, b) => {
            if (a.row === b.row) return a.col - b.col;
            return a.row - b.row;
        });

        tiles.forEach((tile, index) => {
        if (!tile?.view) return;

        const {
            hoverGlow,
            shadow,
            bg,
            innerGlow,
            bushShadow,
            grassTop,
            label,
            dangerText
        } = tile.view;

        const fadeTargets = [
            hoverGlow,
            shadow,
            bg,
            innerGlow,
            bushShadow,
            grassTop,
            label,
            dangerText
        ].filter(Boolean);

        const baseDelay = 1000;
        const delay = baseDelay + index * 45;

        // ✅ 👉 音效放這裡（每格只跑一次）
        this.time.delayedCall(delay, () => {
            if (this.cache.audio.exists('tile_pop')) {
                this.sound.play('tile_pop', { volume: 0.16 });
            }
        });

        // ===== 動畫 =====
        this.tweens.add({
            targets: fadeTargets,
            alpha: 1,
            duration: 180,
            delay,
            ease: 'Sine.Out'
        });

        if (bg) {
            bg.setScale(0.92);
            this.tweens.add({
                targets: bg,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                delay,
                ease: 'Back.Out'
            });
        }

        if (shadow) {
            shadow.setScale(0.92);
            this.tweens.add({
                targets: shadow,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                delay,
                ease: 'Back.Out'
            });
        }

        if (innerGlow) {
            innerGlow.setScale(0.92);
            this.tweens.add({
                targets: innerGlow,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                delay,
                ease: 'Back.Out'
            });
        }
    });
}
    startBoardFloatEffect() {
        if (this.boardFloatTween) {
            this.boardFloatTween.stop();
            this.boardFloatTween = null;
        }

        if (this.boardGlowTween) {
            this.boardGlowTween.stop();
            this.boardGlowTween = null;
        }

        if (this.boardShadowFar && this.boardShadow) {
            this.boardFloatTween = this.tweens.add({
                targets: [this.boardShadowFar, this.boardShadow],
                y: '+=2',
                duration: 2600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }

        if (this.boardGlow) {
            this.boardGlowTween = this.tweens.add({
                targets: this.boardGlow,
                alpha: { from: 0.14, to: 0.18 },
                scaleX: 1.012,
                scaleY: 1.012,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }

    startTileHoverEffect(tile) {
        if (!tile?.view) return;

        const { hoverGlow, shadow, bg, innerGlow, grassTop, label } = tile.view;

        this.stopTileHoverEffect(tile);

        hoverGlow.setFillStyle(0xe7ffd2, 0.12);
        hoverGlow.setStrokeStyle(2, 0xf4ffe9, 0.42);

        const tween = this.tweens.add({
            targets: [bg, innerGlow, hoverGlow, grassTop, label],
            scaleX: 1.035,
            scaleY: 1.035,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        const shadowTween = this.tweens.add({
            targets: shadow,
            scaleX: 1.05,
            scaleY: 1.05,
            alpha: 0.28,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        this.tileHoverTweens.set(tile.id ?? `${tile.row}_${tile.col}`, {
            tween,
            shadowTween
        });
    }

    stopTileHoverEffect(tile) {
        if (!tile?.view) return;

        const key = tile.id ?? `${tile.row}_${tile.col}`;
        const tweenData = this.tileHoverTweens.get(key);

        if (tweenData?.tween) tweenData.tween.stop();
        if (tweenData?.shadowTween) tweenData.shadowTween.stop();

        this.tileHoverTweens.delete(key);

        const { hoverGlow, shadow, bg, innerGlow, grassTop, label } = tile.view;

        hoverGlow.setScale(1);
        hoverGlow.setFillStyle(0xe7ffd2, 0.00);
        hoverGlow.setStrokeStyle(2, 0xf4ffe9, 0.0);

        shadow.setScale(1);
        shadow.setAlpha(0.20);

        bg.setScale(1);
        innerGlow.setScale(1);
        label.setScale(1);

        if (!tile.isFlagged && !tile.isRevealed) {
            grassTop.setScale(tile.view.baseBushScale || 0.6);
        }
    }

    showDamageFloat(tile, amount = 1) {
        if (!tile || !tile.view || !tile.view.bg || !this.boardContainer) return;

        const x = tile.view.bg.x;
        const y = tile.view.bg.y - 18;

        const damageText = this.add.text(x, y, `❤️ -${amount}`, {
            fontSize: '26px',
            color: '#ff4d4d',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 很重要：加到棋盤 container 裡
        this.boardContainer.add(damageText);

        this.tweens.add({
            targets: damageText,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.Out',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    refreshHUD() {
        // 舊資訊區（先保留）
        this.phaseText.setText(`📘 階段：${this.getPhaseLabel(this.gameState.phase)}`);
        this.bugCountText.setText(`🍎 果實：${this.gameState.bugsCollected}/10`);
        this.goldBushText.setText(`🌟 金草叢：${this.gameState.gotGoldBush ? '已找到' : '未找到'}`);
        this.flagText.setText(`🚩 旗子：${this.gameState.flagsUsed}/${this.gameState.flagLimit}`);

      
        // 新的極簡 HUD（只更新，不建立）
        if (this.hudHeart) {
            this.hudHeart.setText(`❤️ ${this.gameState.stamina}`);
            this.hudDig.setText(`⛏️ ${Math.max(0, this.gameState.digLimit - this.gameState.digsUsed)}`);
            this.hudFlag.setText(`🚩 ${Math.max(0, this.gameState.flagLimit - this.gameState.flagsUsed)}`);
            this.hudCrystal.setText(`✨ ${this.gameState.combo}`);
        

        const isQuestion = this.gameState.phase === 'question';

        if (this.stageSmallTitle) {
            this.stageSmallTitle.setAlpha(isQuestion ? 0.52 : 1);
        }

        if (this.phaseText) this.phaseText.setAlpha(isQuestion ? 0.45 : 1);
        if (this.bugCountText) this.bugCountText.setAlpha(isQuestion ? 0.45 : 1);
        if (this.goldBushText) this.goldBushText.setAlpha(isQuestion ? 0.45 : 1);
        if (this.flagText) this.flagText.setAlpha(isQuestion ? 0.45 : 1);
        if (this.goalText) this.goalText.setAlpha(isQuestion ? 0.25 : 1);
        }

        this.refreshObserveButton();

        ///豬寶淚技能~P1：顯示，P2：隱藏，P3：隱藏
        if (this.characterManager?.container) {
            this.characterManager.container.setVisible(this.gameState.phase === 'searching');
        }

        if (this.skillBtnContainer) {
            this.skillBtnContainer.setVisible(this.gameState.phase === 'searching');
        }
    }

    refreshObserveButton() {
        if (!this.observeBtn) return;

        const visible =
            this.gameState.phase === 'searching' &&
            !this.gameState.usedEarlyObserve;

        this.observeBtn.setVisible(visible);
        this.observeBtnIcon.setVisible(visible);
        this.observeBtnText.setVisible(visible);
        this.observeBtnShadow.setVisible(visible);

        if (!visible) return;

        const digs = this.gameState.digsUsed || 0;
        let label = '開始探索';
        let canUse = false;

        if (digs >= 5) {
            label = '觀察果實';
            canUse = true;
        } else if (digs >= 3) {
            label = '發現線索';
        } else if (digs >= 1) {
            label = '探索中';
        }

        this.observeBtnText.setText(label);

        if (canUse) {
            this.observeBtn.setFillStyle(0x89cc73, 0.98);
            this.observeBtn.setAlpha(1);
            this.observeBtnText.setAlpha(1);
            this.observeBtnIcon.setAlpha(1);

            // 呼吸動畫（只建立一次）
            if (!this.observeBtnTween) {
                this.observeBtnTween = this.tweens.add({
                    targets: [this.observeBtn, this.observeBtnText, this.observeBtnIcon],
                    scaleX: 1.06,
                    scaleY: 1.06,
                    duration: 520,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.InOut'
                });
            }

        } else {
            this.observeBtn.setFillStyle(0x5a5a5a, 0.82);
            this.observeBtn.setAlpha(0.78);
            this.observeBtnText.setAlpha(0.82);
            this.observeBtnIcon.setAlpha(0.82);

            // 關閉動畫
            if (this.observeBtnTween) {
                this.observeBtnTween.stop();
                this.observeBtnTween = null;
            }

            this.observeBtn.setScale(1);
            this.observeBtnText.setScale(1);
            this.observeBtnIcon.setScale(1);
        }
    }

    getPhaseLabel(phase) {
        const map = {
            searching: '探索中',
            question: '答題中',
            result: '結算',
            failed: '失敗'
        };
        return map[phase] || phase;
    }

    calculateCollectedFruitLv() {
        let totalLv = 0;

        for (const tile of this.gameState.mapTiles) {
            if (!tile.isRevealed) continue;
            if (!tile.bugId) continue;
            if (tile.isLv0Fruit) continue;

            if (tile.bugId === 'green') totalLv += 1;
            else if (tile.bugId === 'red') totalLv += 1;
            else if (tile.bugId === 'blue') totalLv += 1;
            else if (tile.bugId === 'big') totalLv += 2;
            else if (tile.bugId === 'poison') totalLv += 2;
            else if (tile.bugId === 'bunch') totalLv += 3;
        }

        return totalLv;
    }

    resetUndugNormalTilesForQuestionPhase() {
        for (const tile of this.gameState.mapTiles) {
            // 只處理「還沒翻開」的格子
            if (tile.isRevealed) continue;

            // 只處理普通草
            if (tile.tileType !== 'normal') continue;

            // 👉 關鍵：清掉原本預生成的正式果實
            tile.bugId = null;
            tile.isEmpty = true;
            tile.isLv0Fruit = false;
        }
    }

    calculateQuestionFruitLv() {
        let totalLv = 0;

        for (const tile of this.gameState.mapTiles) {
            if (!tile.isRevealed) continue;
            if (!tile.bugId) continue;

            if (tile.bugId === 'green') totalLv += 1;
            else if (tile.bugId === 'red') totalLv += 1;
            else if (tile.bugId === 'blue') totalLv += 1;
            else if (tile.bugId === 'big') totalLv += 2;
            else if (tile.bugId === 'poison') totalLv += 2;
            else if (tile.bugId === 'bunch') totalLv += 3;
        }

        return totalLv;
    }

    buildQuestionQueue() {
        const totalLv = this.calculateQuestionFruitLv();
        console.log('🧠 題目用 totalLv =', totalLv);

        let questionCount = 1;

        if (totalLv >= 9) {
            questionCount = 3;
        } else if (totalLv >= 5) {
            questionCount = 2;
        }

        const choiceCount = this.gameState.questionChoiceCount || 3;

        const queue = [];
        const usedQuestionTypes = new Set();
        let safety = 0;

        while (queue.length < questionCount && safety < 30) {
            safety +=1;
            const question = BushQuestionSystem.createQuestion(
                this.levelData,
                this.gameState.mapTiles,
                { choiceCount }
            );

            if (!question || !question.type) continue;

            if (usedQuestionTypes.has(question.type)) {
                continue;
            }

            usedQuestionTypes.add(question.type);
            queue.push(question);
        }

        while (queue.length < questionCount) {
            queue.push(
                BushQuestionSystem.createQuestion(
                    this.levelData,
                    this.gameState.mapTiles,
                    { choiceCount }
                )
            );
        }

        return queue;
    }

    showNextQuestion() {
        if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
            this.enterResultPhase(0);
            return;
        }

        this.gameState.currentQuestion = this.gameState.questionQueue[this.gameState.questionIndex];
        const baseTime = this.getQuestionTimeLimitByIndex(this.gameState.questionIndex);

        // 👉 提前探索（你原本的）
        const earlyMultiplier = this.usedEarlyObserve ? 0.5 : 1;

        // 👉 隨機事件（靈感一閃）
        const eventMultiplier = this.gameState.questionTimeMultiplier || 1;

        // 👉 最終倍率（疊加）
        const finalMultiplier = earlyMultiplier * eventMultiplier;

        this.gameState.questionTimeLimit = Math.floor(baseTime * finalMultiplier);
        this.gameState.questionTimeLeft = this.gameState.questionTimeLimit;

        console.log('🎯 [BushExplore] 真正顯示的題目', {
            index: this.gameState.questionIndex,
            totalQuestions: this.gameState.totalQuestions,
            question: this.gameState.currentQuestion
        });

        this.refreshHUD();
        this.showQuestionUI(this.gameState.currentQuestion);
        this.startQuestionTimer();
    }

    updateQuestionProgressText() {
        const question = this.gameState.currentQuestion;
        if (!question) return '';

        const currentIndex = (this.gameState.questionIndex || 0) + 1;

        let starLabel = '⭐';

        if (question.difficulty === 'hard') {
            starLabel = '⭐⭐⭐';
        } else if (question.difficulty === 'medium') {
            starLabel = '⭐⭐';
        } else {
            starLabel = '⭐';
        }

        return `${starLabel} 第 ${currentIndex} 題`;
    }

    getQuestionTimeLimitByIndex(index) {
        const totalQuestions = this.gameState.totalQuestions || 1;

        let baseTime = 30;

        if (totalQuestions >= 3) {
            baseTime = 60;   // 3題
        } else if (totalQuestions === 2) {
            baseTime = 45;   // 2題 
        } else {
            baseTime = 30;   // 1題
        }

        // 提前進入 P2：答題時間減半
        if (this.usedEarlyObserve) {
            baseTime = Math.floor(baseTime * 0.5);

            // 保底秒數
            if (totalQuestions >= 3) {
                baseTime = Math.max(baseTime, 30); // 60 -> 30
            } else if (totalQuestions === 2) {
                baseTime = Math.max(baseTime, 22); // 45 -> 22
            } else {
                baseTime = Math.max(baseTime, 15); // 30 -> 15
            }
        }

        return baseTime + (this.gameState.goldBonusQuestionTime || 0);
    }

    clearQuestionTimer() {
        if (this.questionTimerEvent) {
            this.questionTimerEvent.remove(false);
            this.questionTimerEvent = null;
        }
    }

    startQuestionTimer() {
        this.clearQuestionTimer();

        this.gameState.questionTimeLimit = this.getQuestionTimeLimitByIndex(this.gameState.questionIndex);
        this.gameState.questionTimeLeft = this.gameState.questionTimeLimit;

        this.questionTimerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameState.phase !== 'question') {
                    this.clearQuestionTimer();
                    return;
                }

                this.gameState.questionTimeLeft -= 1;

                if (this.questionHeader.visible) {
                    this.questionTimerText.setText(`⏰ ${this.gameState.questionTimeLeft} 秒`);
                }

                if (this.gameState.questionTimeLeft <= 0) {
                    this.clearQuestionTimer();
                    this.handleQuestionTimeout();
                }
            }
        });
    }

    handleQuestionTimeout() {
        if (this.gameState.phase !== 'question') return;

        this.playSfxSafe('answer_wrong_sfx', 0.45);

        // 超時 = 答錯，固定體力 -1
        this.gameState.stamina = Math.max(0, this.gameState.stamina - 1);

        // 受傷回饋
        this.playP2DamageFeedback();
        this.showMessage('⏰ 太慢了！體力 -1', 1500);

        this.refreshHUD();

        // 扣到 0 直接失敗
        if (this.gameState.stamina <= 0) {
            this.playP2FailFeedback();
            this.showMessage('💥 體力歸零！挑戰失敗！', 1700);

            this.gameState.questionAnswered = true;
            this.gameState.questionCorrect = false;
            this.hideQuestionUI();

            this.time.delayedCall(220, () => {
                this.enterFailPhase();
            });
            return;
        }

        this.hideQuestionUI();

        // 進下一題；如果已是最後一題，則以「存活通關」進結算
        this.gameState.questionIndex += 1;

        if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
            this.gameState.questionAnswered = true;
            this.gameState.questionCorrect = true;
            this.enterResultPhase(0);
            return;
        }

        this.time.delayedCall(180, () => {
            if (this.gameState.phase !== 'question') return;
            this.showNextQuestion();
        });
    }

    stopAnswerBreathing() {
        if (this.answerBreathTween) {
            this.answerBreathTween.stop();
            this.answerBreathTween = null;
        }

        if (this.answerButtons && this.answerButtons.length > 0) {
            this.answerButtons.forEach((obj) => {
                if (obj?.setScale) obj.setScale(1);
            });
        }
    }

    canEnterQuestionPhase() {
        if (this.popupLock) return false;
        if (this.gameState.phase !== 'searching') return false;

        const minDig = this.levelData?.minDigBeforeQuestion ?? 1;
        if (this.gameState.digsUsed < minDig) return false;

        return true;
    }

    animateBoardToSearchingMode() {
        if (!this.boardContainer) return;

        this.tweens.killTweensOf(this.boardContainer);

        this.tweens.add({
            targets: this.boardContainer,
            scaleX: this.boardScaleSearching,
            scaleY: this.boardScaleSearching,
            x: 0,
            y: 0,
            duration: 260,
            ease: 'Sine.Out'
        });
    }

    animateBoardToQuestionMode() {
        if (!this.boardContainer) return;

        this.tweens.killTweensOf(this.boardContainer);

        this.tweens.add({
            targets: this.boardContainer,
            scaleX: this.boardScaleQuestion,
            scaleY: this.boardScaleQuestion,
            x: this.boardShiftXQuestion,
            y: this.boardShiftYQuestion,
            duration: 320,
            ease: 'Cubic.Out'
        });
    }

    showQuestionUI(question) {
        this.questionProgressText.setText(this.updateQuestionProgressText());
        this.questionTimerText.setText(`⏰ ${this.gameState.questionTimeLeft} 秒`);
        this.questionPromptText.setText(question.text || '');

        this.questionHeader.setVisible(true);
        this.answerContainer.setVisible(true);

        this.clearAnswerButtons();

        const choices = question.choices || [];
        const choiceYs = [320, 430, 540, 650];

        choices.forEach((choice, index) => {
            const y = choiceYs[index] || 576;
            const displayText = this.getChoiceDisplayText(question, choice);

            const btn = this.createPopupButton(
                640,
                y,
                360,
                76,
                displayText,
                () => {
                    this.submitAnswer(choice);
                },
                0x8ccf74
            );

            // 先隱藏，等等依序出現
            btn.forEach(obj => {
                if (obj?.setAlpha) obj.setAlpha(0);
                if (obj?.setScale) obj.setScale(0.92);
            });

            this.answerButtons.push(...btn);
            this.answerContainer.add(btn);
        });

        // 題目框先放到上面一點，再滑下來
        this.questionHeader.setVisible(true);
        this.questionHeader.setAlpha(0);
        this.questionHeader.setY(-26);

        this.answerContainer.setVisible(true);
        this.answerContainer.setAlpha(1);

        this.tweens.add({
            targets: this.questionHeader,
            alpha: 1,
            y: 0,
            duration: 220,
            ease: 'Cubic.Out',
            onComplete: () => {
                this.speakQuestion(
                    question.voiceText || question.text || ''
                );
            }
        });

        // 答案按鈕一個一個出現
        const buttonPairs = [];
        for (let i = 0; i < this.answerButtons.length; i += 2) {
            const bg = this.answerButtons[i];
            const label = this.answerButtons[i + 1];
            if (bg && label) {
                buttonPairs.push([bg, label]);
            }
        }

        buttonPairs.forEach((pair, index) => {
            const delay = 120 + index * 90;

            this.tweens.add({
                targets: pair,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                delay,
                ease: 'Back.Out',
                onComplete: () => {
                    if (index === buttonPairs.length - 1) {
                        this.startAnswerBreathing();
                    }
                }
            });
        });
    }

    hideQuestionUI() {
        this.stopQuestionSpeech();
        this.stopAnswerBreathing();
        this.clearAnswerButtons();

        if (this.questionHeader) this.questionHeader.setVisible(false);
        if (this.answerContainer) this.answerContainer.setVisible(false);
    }

    clearAnswerButtons() {
        if (!this.answerButtons) {
            this.answerButtons = [];
            return;
        }

        this.answerButtons.forEach((obj) => {
            if (obj?.destroy) obj.destroy();
        });

        this.answerButtons = [];
    }

    startAnswerBreathing() {
        this.stopAnswerBreathing();

        if (!this.answerButtons || this.answerButtons.length <= 0) return;

        this.answerBreathTween = this.tweens.add({
            targets: this.answerButtons,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 780,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }

    playDamageFeedback(tile, damageType = 'thorn') {
        if (!tile?.view) return;

        const flashColorMap = {
            snake: 0xff8a8a,
            thorn: 0xffd37a,
            boar: 0xff6b6b,
            spiderweb: 0xd9d9d9
        };

        const shakeMap = {
            snake: { duration: 140, intensity: 0.006, zoom: 1.10 },
            thorn: { duration: 100, intensity: 0.004, zoom: 1.06 },
            boar: { duration: 220, intensity: 0.010, zoom: 1.18 },
            spiderweb: { duration: 90, intensity: 0.003, zoom: 1.04 }
        };

        const flashColor = flashColorMap[damageType] || 0xff8a8a;
        const shakeData = shakeMap[damageType] || shakeMap.thorn;

        // 1) 全畫面閃色
        const flash = this.add.rectangle(640, 360, 1280, 720, flashColor, 0)
            .setDepth(9999);

        this.tweens.add({
            targets: flash,
            alpha: { from: 0.26, to: 0 },
            duration: 220,
            ease: 'Quad.Out',
            onComplete: () => flash.destroy()
        });

        // 2) 鏡頭震動
        this.cameras.main.shake(shakeData.duration, shakeData.intensity);

        // 3) 危險物本體放大
        const dangerTarget = tile.view.dangerSprite || tile.view.bg;

        if (dangerTarget) {
            const baseScaleX = dangerTarget.scaleX || 1;
            const baseScaleY = dangerTarget.scaleY || 1;
            const baseX = dangerTarget.x;

            this.tweens.add({
                targets: dangerTarget,
                scaleX: baseScaleX * shakeData.zoom,
                scaleY: baseScaleY * shakeData.zoom,
                duration: 90,
                yoyo: true,
                repeat: 1,
                ease: 'Back.Out'
            });

            this.tweens.add({
                targets: dangerTarget,
                x: baseX + 8,
                duration: 45,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.InOut',
                onComplete: () => {
                    dangerTarget.x = baseX;
                }
            });
        }

        // 4) 左側體力 HUD 跳一下
        if (this.hudHeart) {
            this.hudHeart.setScale(1);

            this.tweens.add({
                targets: this.hudHeart,
                scaleX: 1.18,
                scaleY: 1.18,
                duration: 90,
                yoyo: true,
                ease: 'Back.Out'
            });
        }

        // 5) 野豬額外紅框感
        if (damageType === 'boar') {
            const frame = this.add.rectangle(640, 360, 1260, 700)
                .setStrokeStyle(12, 0xff4d4d, 0.95)
                .setFillStyle(0x000000, 0)
                .setDepth(10000)
                .setAlpha(0);

            this.tweens.add({
                targets: frame,
                alpha: { from: 1, to: 0 },
                duration: 260,
                ease: 'Quad.Out',
                onComplete: () => frame.destroy()
            });
        }
    }

    updateDangerHint(tile) {
        if (!tile?.view?.dangerText) return;

        const dangerCount = tile.nearbyDangerCount || 0;

        if (dangerCount > 0) {
            tile.view.dangerText
                .setText(`${dangerCount}⚠`)
                .setFontSize(22)
                .setVisible(true);
        } else {
            tile.view.dangerText.setText('');
            tile.view.dangerText.setVisible(false);
        }
    }


    updateFlagView(tile) {
        if (!tile?.view) return;

        const x = tile.view.bg.x;
        const y = tile.view.bg.y;

        if (tile.isFlagged) {
            if (!tile.view.flagSprite) {
                if (this.textures.exists('icon_flag_wood')) {
                    tile.view.flagSprite = this.add.image(x, y - 2, 'icon_flag_wood')
                        .setScale(0.62)
                        .setAngle(Phaser.Math.Between(-4, 4))
                        .setOrigin(0.5);
                } else {
                    // 沒有素材時的備用顯示
                    tile.view.flagSprite = this.add.text(x, y - 4, '🚩', {
                        fontSize: '30px'
                    }).setOrigin(0.5);
                }

                this.boardContainer.add(tile.view.flagSprite);

                // 插旗時小跳一下
                tile.view.flagSprite.setScale(0.4);

                this.tweens.add({
                    targets: tile.view.flagSprite,
                    scaleX: this.textures.exists('icon_flag_wood') ? 0.62 : 1,
                    scaleY: this.textures.exists('icon_flag_wood') ? 0.62 : 1,
                    duration: 160,
                    ease: 'Back.Out'
                });
            } else {
                tile.view.flagSprite.setVisible(true);

                tile.view.flagSprite.setScale(
                    this.textures.exists('icon_flag_wood') ? 0.62 : 1
                );
            }
        } else if (tile.view.flagSprite) {
            tile.view.flagSprite.setVisible(false);
        }
    }


    toggleFlag(tile) {
        if (!tile) return;
        if (this.popupLock) return;
        if (this.gameState.phase !== 'searching') return;
        if (tile.isRevealed) return;

        // 已插旗就不能拔
        if (tile.isFlagged) {
            this.showMessage('🚩 小旗子一旦插下去就不能拔掉喔！', 1100);
            return;
        }

        if (this.gameState.flagsUsed >= this.gameState.flagLimit) {
            this.showMessage('🚩 小旗子已經用完了！', 1000);
            return;
        }

        tile.isFlagged = true;
        this.gameState.flagsUsed += 1;

        // 每插 1 支旗 → 挖掘上限 +1
        this.gameState.flagBonusDigGranted += 1;
        this.gameState.digLimit += 1;

        this.refreshTile(tile);
        this.refreshHUD();
        this.showMessage('🚩 插上小旗子！挖掘次數 +1', 1200);
    }

    startTilePress(tile) {
        if (!tile) return;
        if (this.popupLock) return;
        if (this.gameState.phase !== 'searching') return;
        if (tile.isRevealed) return;

        this.cancelLongPressTimer();
        this.longPressTriggered = false;
        this.pressingTile = tile;

        this.longPressTimer = this.time.delayedCall(this.longPressMs, () => {
            if (this.pressingTile !== tile) return;
            this.longPressTriggered = true;
            this.toggleFlag(tile);
        });
    }

    endTilePress(tile) {
        if (!tile) return;

        this.cancelLongPressTimer();

        if (this.longPressTriggered) {
            this.longPressTriggered = false;
            this.pressingTile = null;
            return;
        }

        this.pressingTile = null;

        if (tile.isFlagged) {
            this.showMessage('🚩 這格已插旗，不能再挖喔！', 1000);
            return;
        }

        this.onClickTile(tile);
    }

    cancelTilePress(tile) {
        if (this.pressingTile !== tile) return;
        this.cancelLongPressTimer();
        this.longPressTriggered = false;
        this.pressingTile = null;
    }

    cancelLongPressTimer() {
        if (this.longPressTimer) {
            this.longPressTimer.remove(false);
            this.longPressTimer = null;
        }
    }

    hideTileVisualExtras(tile) {
        if (!tile?.view) return;

        const view = tile.view;

        if (view.dirt) view.dirt.setVisible(false);
        if (view.bugSprite) view.bugSprite.setVisible(false);
        if (view.goldSprite) view.goldSprite.setVisible(false);
        if (view.goldSparkle) view.goldSparkle.setVisible(false);
        if (view.dangerSprite) view.dangerSprite.setVisible(false);

        if (view.label) {
            view.label.setVisible(true);
            view.label.setText('');
            view.label.setAlpha(1);
            view.label.setScale(1);
        }
    }


    refreshTile(tile) {
        if (!tile?.view) return;

        if (tile.isRevealed || tile.isFlagged) {
            this.stopTileHoverEffect(tile);
        }

        this.updateFlagView(tile);

        const { bg, grassTop, label, dangerText } = tile.view;

        // 先把可重複殘留的顯示物件全部隱藏
        if (tile.view.dirt) tile.view.dirt.setVisible(false);
        if (tile.view.bugSprite) tile.view.bugSprite.setVisible(false);
        if (tile.view.goldSprite) tile.view.goldSprite.setVisible(false);
        if (tile.view.goldSparkle) tile.view.goldSparkle.setVisible(false);
        if (tile.view.dangerSprite) tile.view.dangerSprite.setVisible(false);

        if (dangerText) {
            dangerText.setText('');
            dangerText.setVisible(false);
            dangerText.setDepth(30);
        }

        // ===== 未翻開 =====
        if (!tile.isRevealed) {
            bg.setVisible(true);
            bg.setFillStyle(0x6b4f34);
            bg.setStrokeStyle(2, 0xe7d6b8, 0.90);

            if (tile.view.innerGlow) {
                tile.view.innerGlow.setVisible(true);
            }

            if (tile.view.bushShadow) {
                tile.view.bushShadow.setVisible(!tile.isFlagged);
            }

            if (tile.view.bushTexture) {
                grassTop.setTexture(tile.view.bushTexture);
            }

            grassTop
                .setVisible(!tile.isFlagged)
                .setScale(tile.view.baseBushScale || 0.6)
                .setAngle(tile.view.baseBushAngle || 0);

            label.setVisible(true);
            label.setText('');
            label.setColor('#ffffff');
            label.setAlpha(1);
            label.setScale(1);

            return;
        }

        // ===== 已翻開 =====
        grassTop.setVisible(false);

        if (tile.view.flagSprite) {
            tile.view.flagSprite.setVisible(false);
        }

        if (tile.view.bushShadow) {
            tile.view.bushShadow.setVisible(false);
        }

        if (tile.view.innerGlow) {
            tile.view.innerGlow.setVisible(false);
        }

        switch (tile.tileType) {
                        case 'normal':
                bg.setVisible(false);

                if (!tile.view.dirt) {
                    tile.view.dirt = this.add.image(bg.x, bg.y, 'icon_tile_dirt').setScale(0.88);
                    this.boardContainer.add(tile.view.dirt);
                } else {
                    tile.view.dirt
                        .setTexture('icon_tile_dirt')
                        .setVisible(true)
                        .setScale(0.88);
                }

                label.setText('');
                label.setColor('#ffffff');
                label.setVisible(true);

                if (tile.bugId) {
                    const textureKey = this.getFruitTextureKey(
                        tile.bugId,
                        this.gameState.phase === 'question' ? 'question' : 'searching'
                    );

                    const fruitAlpha = 1;
                    const fruitScale = 0.55;

                    if (textureKey && this.textures.exists(textureKey)) {
                        if (!tile.view.bugSprite) {
                            tile.view.bugSprite = this.add.image(bg.x, bg.y, textureKey)
                                .setScale(fruitScale)
                                .setAlpha(fruitAlpha);

                            this.boardContainer.add(tile.view.bugSprite);
                        } else {
                            tile.view.bugSprite
                                .setTexture(textureKey)
                                .setVisible(true)
                                .setScale(fruitScale)
                                .setAlpha(fruitAlpha);
                        }

                        label.setText('');
                    } else {
                        if (tile.view.bugSprite) {
                            tile.view.bugSprite.setVisible(false);
                        }

                        label
                            .setText(this.getBugEmoji(tile.bugId))
                            .setColor('#ffffff')
                            .setAlpha(1)
                            .setScale(1)
                            .setVisible(true);
                    }

                    if (tile.view.bugSprite) {
                        this.boardContainer.bringToTop(tile.view.bugSprite);
                    }
                } else {
                    if (tile.view.bugSprite) {
                        tile.view.bugSprite.setVisible(false);
                    }

                    label
                        .setText('')
                        .setColor('#ffffff')
                        .setAlpha(1)
                        .setScale(1)
                        .setVisible(true);
                }

                this.boardContainer.bringToTop(label);
                break;

            case 'gold':
                bg.setVisible(false);
                grassTop.setVisible(false);

                label.setText('');
                label.setVisible(false);

                let goldTexture = 'icon_gold_golden';

                if (tile.goldType === 'goldenGrass') {
                    goldTexture = 'icon_gold_golden';
                } else if (tile.goldType === 'rainbowGrass') {
                    goldTexture = 'icon_gold_rainbow';
                } else if (tile.goldType === 'randomEvent') {
                    goldTexture = 'icon_gold_mystery';
                } else if (tile.goldType === 'kingBug') {
                    goldTexture = 'icon_gold_kingbug';
                }

                if (!tile.view.goldSprite) {
                    tile.view.goldSprite = this.add.image(bg.x, bg.y, goldTexture).setScale(0.88);
                    this.boardContainer.add(tile.view.goldSprite);
                } else {
                    tile.view.goldSprite
                        .setTexture(goldTexture)
                        .setVisible(true)
                        .setScale(0.88);
                }

                // ✅ 關掉舊寶箱（sparkle）
                if (tile.view.goldSparkle) {
                    tile.view.goldSparkle.setVisible(false);
                }

                this.boardContainer.bringToTop(tile.view.goldSprite);

                break;

            case 'snake':
                bg.setVisible(false);

                if (!tile.view.dangerSprite) {
                    tile.view.dangerSprite = this.add.image(bg.x, bg.y, 'danger_snake')
                        .setScale(0.6);

                    this.boardContainer.add(tile.view.dangerSprite);
                } else {
                    tile.view.dangerSprite
                        .setTexture('danger_snake')
                        .setVisible(true)
                        .setScale(0.6);
                }

                label.setText('');
                break;

            case 'thorn':
                bg.setVisible(false);

                if (!tile.view.dangerSprite) {
                    tile.view.dangerSprite = this.add.image(bg.x, bg.y, 'danger_thorn')
                        .setScale(0.6);

                    this.boardContainer.add(tile.view.dangerSprite);
                } else {
                    tile.view.dangerSprite
                        .setTexture('danger_thorn')
                        .setVisible(true)
                        .setScale(0.6);
                }

                label.setText('');
                break;
            case 'boar':
                bg.setVisible(false);

                if (!tile.view.dangerSprite) {
                    tile.view.dangerSprite = this.add.image(bg.x, bg.y, 'danger_boar')
                        .setScale(0.6);

                    this.boardContainer.add(tile.view.dangerSprite);
                } else {
                    tile.view.dangerSprite
                        .setTexture('danger_boar')
                        .setVisible(true)
                        .setScale(0.6);
                }

                label.setText('');
                break;

            case 'spiderweb':
                bg.setVisible(false);

                if (!tile.view.dangerSprite) {
                    tile.view.dangerSprite = this.add.image(bg.x, bg.y, 'danger_web')
                        .setScale(0.6);

                    this.boardContainer.add(tile.view.dangerSprite);
                } else {
                    tile.view.dangerSprite
                        .setTexture('danger_web')
                        .setVisible(true)
                        .setScale(0.6);
                }

                label.setText('');
                break;

            case 'stone':
                bg.setVisible(false);

                if (!tile.view.dangerSprite) {
                    tile.view.dangerSprite = this.add.image(bg.x, bg.y, 'danger_stone')
                        .setScale(0.6);

                    this.boardContainer.add(tile.view.dangerSprite);
                } else {
                    tile.view.dangerSprite
                        .setTexture('danger_stone')
                        .setVisible(true)
                        .setScale(0.6);
                }

                label.setText('');
                break;

            default:
                bg.setVisible(true);
                bg.setFillStyle(0x8d6e63);
                bg.setStrokeStyle(3, 0xf0d9c6);
                label.setVisible(true);
                label.setText('?').setColor('#ffffff');
                break;
        }

        if (this.gameState.phase === 'searching') {
            this.updateDangerHint(tile);

            if (tile.view?.dangerText) {
                this.boardContainer.bringToTop(tile.view.dangerText);
            }
        } else {
            if (tile.view?.dangerText) {
                tile.view.dangerText.setText('');
                tile.view.dangerText.setVisible(false);
            }
        }
    }

    getBugEmoji(bugId) {
        const map = {
            green: '🟢',
            red: '🔴',
            blue: '🔵',
            big: '🍎',
            poison: '☠️',
            bunch: '🍇' // ⭐ 新增這一行（果串）
        };
        return map[bugId] || '❓';
    }

    getDangerEmoji(tileType) {
        const map = {
            snake: '🐍',
            thorn: '🌵',
            boar: '🐗',
            stone: '🪨',
            spiderweb: '🕸️'
        };

        return map[tileType] || '⚠️';
    }

    getGoldBushRevealText(tile) {
        if (!tile || tile.tileType !== 'gold') return '金草叢';

        const map = {
            goldenGrass: '黃金草',
            rainbowGrass: '夢幻草',
            randomEvent: '神祕草',
            kingBug: '國王蟲'
        };

        return map[tile.goldType] || '神祕草';
    }

    getRandomGoldEventType() {
        const eventPool = [
            'forestBlessing', // 體力 +1
            'bonusDig',       // 挖掘 +2
            'inspiration',    // 答題時間 +5 秒
            'bonusCrystal'    // 結算額外水晶 +1
        ];

        return Phaser.Utils.Array.GetRandom(eventPool);
    }

    applyGoldBushImmediateEffect(tile) {
        if (!tile || tile.tileType !== 'gold') return;

        const goldType = tile.goldType;

        // ===== 黃金草：穩定賺 =====
        if (goldType === 'goldenGrass') {
            this.gameState.stamina = Math.min(
                this.gameState.maxStamina,
                this.gameState.stamina + 1
            );

            this.refreshHUD();
            this.showMessage('✨ 黃金草祝福！體力 +1', 1800);
            return;
        }

        // ===== 夢幻草：本局夢幻升級保證 =====
        if (goldType === 'rainbowGrass') {
            this.gameState.hasRainbowGrass = true;
            this.refreshHUD();
            this.showMessage(this.getRandomRainbowGrassMessage(), 1800);
            return;
        }

        // ===== 神祕草：正面事件池 =====
        if (goldType === 'randomEvent') {
            const eventType = this.getRandomGoldEventType();
            tile.goldEventType = eventType;

            switch (eventType) {
                case 'forestBlessing':
                    this.gameState.stamina = Math.min(
                        this.gameState.maxStamina,
                        this.gameState.stamina + 1
                    );
                    this.refreshHUD();
                    this.showMessage('🍃 森林祝福！體力 +1', 1800);
                    break;

                case 'bonusDig':
                    this.gameState.digLimit += 2;
                    this.refreshHUD();
                    this.showMessage('🪓 靈感湧現！挖掘次數 +2', 1800);
                    break;

                case 'inspiration':
                    this.gameState.goldBonusQuestionTime =
                        (this.gameState.goldBonusQuestionTime || 0) + 5;
                    this.refreshHUD();
                    this.showMessage('💡 靈感一閃！答題時間 +5 秒', 1800);
                    break;

                case 'bonusCrystal':
                    this.gameState.goldBonusCrystals =
                        (this.gameState.goldBonusCrystals || 0) + 1;
                    this.showMessage('💎 亮晶晶發現！結算時額外水晶 +1', 1800);
                    break;

                default:
                    this.showMessage('🍀 神祕事件發生了！', 1800);
                    break;
            }

            return;
        }

        // ===== 國王蟲：稀有彩蛋 =====
        if (goldType === 'kingBug') {
            this.gameState.foundKingBug = true;
            this.gameState.hasKingBug = true;
            this.refreshHUD();
            this.showMessage(this.getRandomKingBugMessage(), 1800);
        }
    }        


/////////
    onClickTile(tile) {
        // ⭐ 技能模式
        if (this.isScoutMode) {
            this.isScoutMode = false;
            this.showScoutResult(tile);
            return;
        }

        const now = this.time.now;

        if (this.popupLock) return;
        if (now < this.nextDigTime) return;
        if (this.gameState.phase !== 'searching') return;
        if (!tile || tile.isRevealed) return;

        if (tile.isFlagged) {
            this.showMessage('🚩 這格已插旗，不能直接挖開！', 1000);
            return;
        }

        const remainBeforeDig = this.gameState.digLimit - this.gameState.digsUsed;
        if (remainBeforeDig <= 0) {
            this.enterQuestionPhase();
            return;
        }

        // ✅ 真正要挖開時，才進入 CD
        this.nextDigTime = now + this.digCooldownMs;

        tile.isRevealed = true;
        this.gameState.digsUsed += 1;

        let comboBroken = false;



        // ===== 普通草 =====
        if (tile.tileType === 'normal') {
            this.playTileReveal(tile);

            if (tile.isEmpty || !tile.bugId) {
                // 空草：不加、不斷 Combo
                this.showMessage('🍃 這格什麼都沒有', 1100);
            } else {
                // 正式果實（P1 挖出來的才算成果）
                this.gameState.combo += 1;
                this.gameState.highestCombo = Math.max(
                    this.gameState.highestCombo,
                    this.gameState.combo
                );

                // 只要是 P1 真正挖到的成果都算 bugsCollected
                if (!tile.isLv0Fruit) {
                    this.gameState.bugsCollected += 1;
                }

                this.showTileBug(tile);
            }

            this.refreshTile(tile);

            // ⭐ 普通草隨機事件（5%、單局一次）
            this.tryTriggerRandomEvent(tile);
        }

        // ===== 金草叢 =====
        else if (tile.tileType === 'gold') {
            this.popupLock = true;

            this.gameState.gotGoldBush = true;
            this.gameState.combo += 1;
            this.gameState.highestCombo = Math.max(
                this.gameState.highestCombo,
                this.gameState.combo
            );

            this.refreshTile(tile);
            this.playGoldReveal(tile);
            this.playSfxSafe?.('gold_reveal', 0.5);
            this.showTopBannerMessage(this.getRandomTopGoldHint(), null, 3);

            const goldText = this.getGoldBushRevealText(tile);

            if (tile.goldType === 'goldenGrass') {
                this.showMessage(`🌟 找到${goldText}！`, 2200);
            } else if (tile.goldType === 'rainbowGrass') {
                this.showMessage('🌈 夢幻草！夢幻寶箱UP', 2200);
            } else if (tile.goldType === 'randomEvent') {
                this.showMessage('🍀 神祕草！有好事發生', 2200);
            } else if (tile.goldType === 'kingBug') {
                this.showMessage('👑 發現國王蟲！', 2200);
            } else {
                this.showMessage(`🌟 找到${goldText}！`, 2200);
            }

            // ⭐ 上方高優先提示
            this.showGoldTopBanner('🌟 找到金草叢！');

            this.applyGoldBushImmediateEffect(tile);
            this.refreshHUD();

            this.time.delayedCall(2200, () => {
                this.popupLock = false;

                if (this.gameState.stamina <= 0) {
                    this.enterFailPhase();
                    return;
                }

                if (this.gameState.digsUsed >= this.gameState.digLimit) {
                    this.enterQuestionPhase();
                }
            });

            return;
        }

        // ===== 石頭 =====
        else if (tile.tileType === 'stone') {
            comboBroken = true;

            this.refreshTile(tile);
            this.playDangerReveal(tile);
            this.playTileShake(tile);
            this.showMessage('🪨 挖到石頭！Combo 中斷', 1400);
        }

        // ===== 蛇 =====
        if (tile.tileType === 'snake') {
            this.gameState.stamina = Math.max(0, this.gameState.stamina - 2);
            this.showDamageFloat(tile, 2);
            this.showMessage('🐍 被蛇攻擊！體力 -2', 1500, 3);
            this.refreshTile(tile);
            this.refreshHUD();
            return;
        }

        if (tile.tileType === 'thorn') {
            this.gameState.stamina = Math.max(0, this.gameState.stamina - 1);
            this.showDamageFloat(tile, 1);
            this.showMessage('🌵 被刺草劃傷！體力 -1', 1500, 3);
            this.refreshTile(tile);
            this.refreshHUD();
            return;
        }

        if (tile.tileType === 'boar') {
            this.gameState.stamina = Math.max(0, this.gameState.stamina - 3);
            this.showDamageFloat(tile, 3);
            this.showMessage('🐗 被野豬撞到了！體力 -3', 1500, 3);
            this.refreshTile(tile);
            this.refreshHUD();
            return;
        }

        // ===== 蜘蛛網 =====
        else if (tile.tileType === 'spiderweb') {
            comboBroken = true;

            const remainBeforeWebPenalty = Math.max(
                0,
                this.gameState.digLimit - this.gameState.digsUsed
            );

            const loss = Phaser.Math.Between(1, 2);
            const actualLoss = Math.min(remainBeforeWebPenalty, loss);

            this.gameState.digLimit = Math.max(
                this.gameState.digsUsed,
                this.gameState.digLimit - actualLoss
            );

            this.refreshTile(tile);
            this.playDangerReveal(tile);
            this.playDamageFeedback(tile, 'spiderweb');

            if (actualLoss > 0) {
                this.showMessage(`🕸️ 被蜘蛛網纏住！挖掘次數 -${actualLoss}`, 1600);
            } else {
                this.showMessage(`🕸️ 被纏住了！挖掘 -${actualLoss}`, 1600);
            }
        }

        // ===== 其他未知格 =====
        else {
            this.refreshTile(tile);
            this.playTileShake(tile);
            this.showMessage('❓ 發現奇怪的東西…', 1200);
        }

        // ===== Combo 處理 =====
        if (comboBroken) {
            this.gameState.combo = 0;
        }

        // ===== 周圍提示 =====
        if (tile.tileType !== 'gold') {
            this.showNearbyHint(tile);
        }

        // ===== 更新 HUD =====
        this.refreshHUD();

        // ===== 失敗判定 =====
        if (this.gameState.stamina <= 0) {
            this.enterFailPhase();
            return;
        }

        // ===== 搜索階段結束判定 =====
        if (this.gameState.digsUsed >= this.gameState.digLimit) {
            this.enterQuestionPhase();
        }
    }

    getRandomGoldenGrassMessage() {
        return this.pickRandomMessage([
            '🌟 黃金草！',
            '🌟 找到黃金草！',
            '🌟 黃金草發光了！',
            '🌟 是黃金草！'
        ]);
    }

    getRandomRainbowGrassMessage() {
        return this.pickRandomMessage([
            '🌈 夢幻草！寶箱UP',
            '🌈 夢幻草！好運UP',
            '🌈 夢幻草！獎勵UP',
            '🌈 夢幻草！發光中',
            '🌈 夢幻草！運氣來了'
        ]);
    }

    getRandomMysteryGrassMessage() {
            return this.pickRandomMessage([
                '🍀 神祕草！',
                '🍀 神祕事件！',
                '🍀 草叢有反應！',
                '🍀 觸發神祕草！'
            ]);
        }

    getRandomKingBugMessage() {
        return this.pickRandomMessage([
            '👑 發現國王蟲！',
            '👑 稀有國王蟲！',
            '👑 抓到國王蟲！',
            '👑 國王蟲出現！',
            '👑 是國王蟲！'
        ]);
    }

    showScoutResult(tile) {

        let text = '';

        switch (tile.tileType) {
            case 'gold':
                text = '這邊沒危險~';
                break;
            case 'snake':
                text = '有點奇怪!';
                break;
            case 'thorn':
                text = '有點奇怪!';
                break;
            case 'boar':
                text = '有點奇怪!';
                break;
            case 'spiderweb':
                text = '有點奇怪!';
                break;
            case 'stone':
                text = '有點奇怪!';
                break;
            case 'normal':
                text = tile.bugId ? '這邊沒危險~' : '這邊沒危險~';
                break;
            default:
                text = '❓ 未知';
        }

        this.showMessage(text, 1500);
    }

    playTileReveal(tile) {
        if (!tile?.view?.bg) return;

        this.spawnLeafBurst(tile);

        this.tweens.add({
            targets: [tile.view.bg, tile.view.label],
            scaleX: 1.10,
            scaleY: 1.10,
            duration: 110,
            yoyo: true
        });

        if (this.cache.audio.exists('dig_grass_sfx')) {
            this.playSfxSafe('dig_grass_sfx', 0.38);
        } else if (this.cache.audio.exists('dig_sfx')) {
            this.playSfxSafe('dig_sfx', 0.35);
        }
    }

    spawnLeafBurst(tile) {
        if (!tile?.view?.bg) return;

        const centerX = tile.view.bg.x;
        const centerY = tile.view.bg.y;

        for (let i = 0; i < 6; i++) {
            const leaf = this.add.image(centerX, centerY - 8, 'leaf_particle')
                .setScale(0.18 + Math.random() * 0.08)
                .setAlpha(0.95);

            this.boardContainer.add(leaf);

            const offsetX = Phaser.Math.Between(-42, 42);
            const offsetY = Phaser.Math.Between(-48, -10);
            const rotate = Phaser.Math.Between(-120, 120);

            this.tweens.add({
                targets: leaf,
                x: centerX + offsetX,
                y: centerY + offsetY,
                angle: rotate,
                alpha: 0,
                duration: 320,
                ease: 'Cubic.Out',
                onComplete: () => leaf.destroy()
            });
        }
    }

    playGoldReveal(tile) {
        if (!tile?.view?.bg) return;

        this.tweens.add({
            targets: [tile.view.bg, tile.view.label],
            angle: 8,
            scaleX: 1.12,
            scaleY: 1.12,
            duration: 140,
            yoyo: true,
            repeat: 1
        });
    }

    playDangerReveal(tile) {
        if (!tile?.view?.bg) return;

        this.tweens.add({
            targets: tile.view.bg,
            x: tile.view.bg.x + 6,
            duration: 45,
            yoyo: true,
            repeat: 3
        });
    }

    playTileShake(tile) {
        if (!tile?.view?.bg) return;

        this.tweens.add({
            targets: [tile.view.bg, tile.view.label],
            x: '+=5',
            duration: 40,
            yoyo: true,
            repeat: 3
        });
    }

    showTileBug(tile) {
        if (!tile.bugId) {
            this.showMessage('🍃 這格什麼都沒有', 1100);
            return;
        }

        this.showMessage(this.getRandomFruitFoundMessage(), 1300);
    }

    showNearbyHint(tile) {
        if (!tile.nearbyHints || tile.nearbyHints.length <= 0) return;

        const bottomHint = this.getRandomDangerHintMessage();
        this.gameState.hintsShown.push(bottomHint);

        this.time.delayedCall(350, () => {
            if (this.gameState.phase !== 'searching') return;

            // 左下即時提示
            this.showMessage(bottomHint, 1500);

            // 上方橫幅提示（低優先）
            this.showTopBannerMessage(this.getRandomTopDangerHint(), null, 1);
        });
    }

    checkSearchPhaseEnd() {
        if (this.gameState.stamina <= 0) {
            this.enterFailPhase();
            return;
        }

        if (this.gameState.digsUsed >= this.gameState.digLimit) {
            this.enterQuestionPhase();
        }
    }

    getFruitTextureKey(bugId, phase = 'searching') {
        // P1：全部果實先統一顯示
        if (phase === 'searching') {
            return 'fruit_generic';
        }

        // P2：恢復真實果實圖
        switch (bugId) {
            case 'green':
                return 'fruit_green';
            case 'red':
                return 'fruit_red';
            case 'blue':
                return 'fruit_blue';
            case 'big':
                return 'fruit_big';
            case 'poison':
                return 'fruit_poison';
            case 'bunch':
                return 'fruit_bunch';
            default:
                return 'fruit_generic';
        }
    }

    revealFruitSpritesForQuestionPhase() {
        if (!this.gameState?.mapTiles || !Array.isArray(this.gameState.mapTiles)) return;

        for (const tile of this.gameState.mapTiles) {
            if (!tile?.bugId) continue;
            if (!tile.view?.bugSprite) continue;

            const realTextureKey = this.getFruitTextureKey(tile.bugId, 'question');

            this.tweens.add({
                targets: tile.view.bugSprite,
                scaleX: tile.view.bugSprite.scaleX * 1.15,
                scaleY: tile.view.bugSprite.scaleY * 1.15,
                duration: 120,
                yoyo: true,
                onComplete: () => {
                    if (tile.view?.bugSprite && tile.view.bugSprite.active) {
                        tile.view.bugSprite.setTexture(realTextureKey);
                    }
                }
            });
        }
    }

    prepareBoardForQuestionMode() {
        for (const tile of this.gameState.mapTiles) {
            if (!tile?.view) continue;

            const view = tile.view; 

            // 先全部隱藏
            if (view.bg) view.bg.setVisible(false);
            if (view.shadow) view.shadow.setVisible(false);
            if (view.innerGlow) view.innerGlow.setVisible(false);
            if (view.bushShadow) view.bushShadow.setVisible(false);
            if (view.grassTop) view.grassTop.setVisible(false);
            if (view.label) view.label.setVisible(false);
            if (view.dangerText) view.dangerText.setVisible(false);
            if (view.dirt) view.dirt.setVisible(false);
            if (view.goldSprite) view.goldSprite.setVisible(false);
            if (view.goldSparkle) view.goldSparkle.setVisible(false);
            if (view.dangerSprite) view.dangerSprite.setVisible(false);
            if (view.flagSprite) view.flagSprite.setVisible(false);

            // 只保留果實
            if (tile.bugId && view.bugSprite) {
                view.bugSprite
                    .setVisible(true)
                    .setAlpha(1)
                    .setScale(0.55);
            }
        }
    }

        showQuestionConfirmPopup() {
            const { container } = this.createPopupBase(560, 300, {
                overlayAlpha: 0.30
            });

            const title = this.add.text(640, 248, '🔍 開始觀察？', {
                fontSize: '34px',
                color: '#4d7f34',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const message = this.add.text(
                640,
                320,
                '要結束探索，進入觀察答題嗎？\n進入後就不能再繼續挖草喔！\n⚠ 答題時間將減半！',
                {
                    fontSize: '24px',
                    color: '#314927',
                    align: 'center',
                    lineSpacing: 8
                }
            ).setOrigin(0.5);

            const cancelBtn = this.createPopupButton(
                530,
                425,
                160,
                58,
                '再看看',
                () => {
                    this.closeActivePopup();
                },
                0x9a9a9a
            );

            const confirmBtn = this.createPopupButton(
                750,
                425,
                180,
                58,
                '開始觀察',
                () => {
                    this.closeActivePopup();
                    this.usedEarlyObserve = true;
                    this.time.delayedCall(120, () => {
                        this.enterQuestionPhase();
                    });
                },
                0x79ba63
            );

            container.add([
                title,
                message,
                ...cancelBtn,
                ...confirmBtn
            ]);
        }

    spawnLv0FruitsFromUndugGrass() {
        const chance = this.levelData?.lv0FruitChanceFromUndugGrass ?? 0.10;
        const minSpawn = this.levelData?.lv0FruitMinSpawn ?? 1;
        const maxSpawn = this.levelData?.lv0FruitMaxSpawn ?? 3;

        const normalFruitPool = ['green', 'red', 'blue'];

        const candidates = this.gameState.mapTiles.filter(tile => {
            if (tile.isRevealed) return false;
            if (tile.tileType !== 'normal') return false;
            if (tile.bugId) return false;
            return true;
        });

        if (candidates.length <= 0) return;

        const shuffled = Phaser.Utils.Array.Shuffle([...candidates]);
        const pickedTiles = [];

        // 第一階段：依機率挑選
        for (const tile of shuffled) {
            if (pickedTiles.length >= maxSpawn) break;

            if (Math.random() < chance) {
                pickedTiles.push(tile);
            }
        }

        // 第二階段：保底
        while (pickedTiles.length < minSpawn && pickedTiles.length < shuffled.length && pickedTiles.length < maxSpawn) {
            const nextTile = shuffled[pickedTiles.length];
            if (!pickedTiles.includes(nextTile)) {
                pickedTiles.push(nextTile);
            } else {
                break;
            }
        }

        // 真正生成 Lv0 果實
        for (const tile of pickedTiles) {
            tile.bugId = Phaser.Utils.Array.GetRandom(normalFruitPool);
            tile.isLv0Fruit = true;
            tile.isEmpty = false;
        }

        console.log('🍎 Lv0 補果結果', {
            chance,
            minSpawn,
            maxSpawn,
            candidateCount: candidates.length,
            spawnedCount: pickedTiles.length
        });
    }

    applyP2PreQuestionEffects() {
        this.gameState.questionChoiceCount = 3;
        this.gameState.p2DebuffType = null;
        this.gameState.p2BuffType = null;

        // ===== 沒挖到金草：P2 debuff =====
        // 目前先做簡單版：沒挖到金草時，35% 機率變成 4 選項
        if (!this.gameState.gotGoldBush) {
            const debuffChance = this.levelData?.p2DebuffChanceWhenGoldMissed ?? 0.35;

            if (Math.random() < debuffChance) {
                this.gameState.questionChoiceCount = 4;
                this.gameState.p2DebuffType = 'extraChoice';
                this.showMessage('😵 沒找到金草叢！這次題目會更難一點！', 1800);
            }
        }

        // ===== 正向隨機事件（先做很溫和版）=====
        // 進 P2 時 12% 機率觸發，先只做正面事件
        const p2EventChance = this.levelData?.p2EventChance ?? 0.12;

        if (Math.random() < p2EventChance) {
            const eventPool = [
                'forestBlessing',
                'inspiration'
            ];

            const eventType = Phaser.Utils.Array.GetRandom(eventPool);
            this.gameState.p2BuffType = eventType;

            if (eventType === 'forestBlessing') {
                this.gameState.stamina = Math.min(
                    this.gameState.maxStamina,
                    this.gameState.stamina + 1
                );
                this.showMessage('✨ 森林祝福！體力 +1', 1800);
            } else if (eventType === 'inspiration') {
                this.gameState.goldBonusQuestionTime = (this.gameState.goldBonusQuestionTime || 0) + 5;
                this.showMessage('💡 靈感一閃！答題時間 +5 秒', 1800);
            }
        }

        this.refreshHUD();
    }

    enterQuestionPhase() {
        if (this.gameState.phase !== 'searching') return;

        this.gameState.phase = 'transition_to_question';

        this.showMessage('👀 開始觀察棋盤，準備回答問題', 1200);
        this.playSfxSafe('ui_click_sfx', 0.40);

        // 👉 防止玩家再點
        if (this.observeBtn) this.observeBtn.disableInteractive();

        // 👉 停止 hover 動畫（避免干擾）
        this.stopTileHoverAll?.();

        // ===== 第1段：稍微停一下（提示感）=====
        this.time.delayedCall(350, () => {

            if (!this.boardContainer) return;

            // 👉 棋盤先淡一下（進入觀察模式）
            this.tweens.add({
                targets: this.boardContainer,
                alpha: 0.78,
                duration: 200,
                ease: 'Sine.Out',
                onComplete: () => {

                    // ===== 第2段：正式進入 question =====
                    this.gameState.phase = 'question';
                    this.hideTopBannerMessage();

                    // ⭐ 先重置未挖草
                    this.resetUndugNormalTilesForQuestionPhase();

                    // ⭐ 再補 Lv0
                    this.spawnLv0FruitsFromUndugGrass();

                    this.applyP2PreQuestionEffects();

                    this.revealAllBugs();
                    this.revealFruitSpritesForQuestionPhase();
                    this.prepareBoardForQuestionMode();

                    // 👉 棋盤移動＋縮小（核心動畫）
                    this.tweens.add({
                        targets: this.boardContainer,
                        alpha: 1,
                        scaleX: this.boardScaleQuestion,
                        scaleY: this.boardScaleQuestion,
                        x: this.boardShiftXQuestion,
                        y: this.boardShiftYQuestion,
                        duration: 420,
                        ease: 'Cubic.Out',
                        onComplete: () => {

                            this.startFruitBreathing();

                            // ===== 第3段：建題 =====
                            this.gameState.questionQueue = this.buildQuestionQueue();
                            this.gameState.questionIndex = 0;
                            this.gameState.totalQuestions = this.gameState.questionQueue.length;
                            this.gameState.correctAnswers = 0;
                            this.gameState.currentQuestion = null;
                            this.gameState.questionAnswered = false;
                            this.gameState.questionCorrect = false;

                            this.refreshHUD();

                            // 👉 稍微延遲再出題（更順）
                            this.time.delayedCall(180, () => {
                                if (this.gameState.phase !== 'question') return;
                                this.showNextQuestion();
                            });
                        }
                    });
                }
            });
        });
    }

    revealAllBugs() {
        for (const tile of this.gameState.mapTiles) {
            if (tile.bugId) {
                tile.isRevealed = true;
                this.refreshTile(tile);
            }
        }
    }

    submitAnswer(playerAnswer) {
        if (this.gameState.phase !== 'question') return;

        this.clearQuestionTimer();
        this.stopAnswerBreathing();

        const currentQuestion = this.gameState.currentQuestion;
        const isCorrect = BushQuestionSystem.checkAnswer(currentQuestion, playerAnswer);

        // ===== 正確 =====
        if (isCorrect) {
            this.playSfxSafe('answer_correct_sfx', 0.48);
            this.playAnswerCorrectFeedback(playerAnswer);
            this.showMessage(this.getRandomAnswerCorrectMessage(), 900);

            this.gameState.correctAnswers += 1;
            this.gameState.questionIndex += 1;

            this.time.delayedCall(260, () => {
                this.hideQuestionUI();

                if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
                    this.gameState.questionAnswered = true;
                    this.gameState.questionCorrect = true;
                    this.enterResultPhase(0);
                    return;
                }

                this.time.delayedCall(220, () => {
                    if (this.gameState.phase !== 'question') return;
                    this.showNextQuestion();
                });
            });

            return;
        }

        // ===== 錯誤 =====
        this.playSfxSafe('answer_wrong_sfx', 0.45);
        this.playAnswerWrongFeedback(playerAnswer);
        this.playP2QuestionHitFeedback();
        this.playP2DamageFeedback();

        // 固定體力 -1
        this.gameState.stamina = Math.max(0, this.gameState.stamina - 1);
        this.refreshHUD();

        // 受傷回饋
        this.showMessage(this.getRandomAnswerWrongMessage(), 1500);

        // 扣到 0 直接失敗
        if (this.gameState.stamina <= 0) {
            this.playP2FailFeedback();
            this.showMessage('💥 體力歸零！挑戰失敗！', 1700);

            this.gameState.questionAnswered = true;
            this.gameState.questionCorrect = false;
            this.hideQuestionUI();

            this.time.delayedCall(220, () => {
                this.enterFailPhase();
            });
            return;
        }

        this.hideQuestionUI();

        // 答錯但還活著 → 繼續下一題
        this.gameState.questionIndex += 1;

        // 如果這已經是最後一題，則以「存活通關」進結算
        if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
            this.gameState.questionAnswered = true;
            this.gameState.questionCorrect = true;
            this.enterResultPhase(0);
            return;
        }

        this.time.delayedCall(180, () => {
            if (this.gameState.phase !== 'question') return;
            this.showNextQuestion();
        });
    }

    enterResultPhase(extraPenalty = 0) {
        this.clearQuestionTimer();
        this.hideQuestionUI();
        this.gameState.phase = 'result';

        let reward;

        if (this.gameState.questionCorrect) {
            reward = BushRewardSystem.buildClearReward(this.levelData, this.gameState);
        } else {
            reward = BushRewardSystem.buildFailReward(this.levelData, this.gameState);
        }

        reward = this.applyFlagRewardToRewardData(reward);
        reward = this.applyGoldBushTypeReward(reward);
        reward = BushRewardSystem.applyFruitLvChestBonus(reward, this.gameState, this);

        const stageResult = this.applyStageResult();
        this.finalResultData = this.buildFinalResultData(reward, stageResult);
        console.log('📦 finalResultData', this.finalResultData);

        this.stageResultData = stageResult;

        // 舊 pityChest 保留相容，但目前主規則先不主動發
        reward.pityChest = 0;

        // 最後才真正開寶箱
        reward = BushRewardSystem.resolveChestLoot(reward, 'bush', this.gameState);

        this.grantRewardOnce(reward);
        this.refreshHUD();
        this.saveGameData();

        console.log('📘 [BushExplore] 關卡結算結果', stageResult);
        console.log('🚩 [BushExplore] 旗子結算結果', this.flagResultData);
        console.log('🎁 [BushExplore] 成功獎勵', reward);

        this.showResultPopup(reward, extraPenalty);
        this.stopFruitBreathing();
    }

    enterFailPhase() {
        if (this.gameState.phase === 'failed') return;

        this.clearQuestionTimer();
        this.hideQuestionUI();
        this.gameState.phase = 'failed';

        let reward = BushRewardSystem.buildFailReward(this.levelData, this.gameState);

        // 失敗時如果有找到金草叢，保底給大寶箱
        if (this.gameState.gotGoldBush) {
            reward.rareChest = Math.max(reward.rareChest || 0, 1);
            reward.goldGuaranteedChest = true;
        }

        // 失敗時不給保底小寶箱
        reward.pityChest = 0;

        const stageResult = this.applyStageResult();
        this.finalResultData = this.buildFinalResultData(reward, stageResult);
        console.log('📦 finalResultData (fail)', this.finalResultData);
        this.stageResultData = stageResult;

        // 失敗時若有寶箱，也要真的開箱
        reward = BushRewardSystem.resolveChestLoot(reward, 'bush', this.gameState);

        this.grantRewardOnce(reward);
        this.refreshHUD();
        this.saveGameData();

        console.log('📘 [BushExplore] 失敗結算結果', stageResult);
        console.log('🎁 [BushExplore] 失敗獎勵', reward);
        this.stopFruitBreathing();
        this.showFailPopup(reward);
    }

    grantRewardOnce(reward) {
        if (this.gameState.resultGranted) return;
        this.gameState.resultGranted = true;
        this.grantReward(reward);
    }

    grantReward(reward) {
        const currentCrystals = this.registry.get('user_crystals') || 0;
        const currentReputation = this.registry.get('reputation') || 0;
        const ownedItems = [...(this.registry.get('owned_items') || [])];

        const baseCrystalGain = reward.crystals || 0;
        const baseReputationGain = reward.reputation || 0;

        let duplicateCrystalGain = 0;
        const newItems = [];
        const duplicateItems = [];

        // 先發基礎資源
        this.registry.set('user_crystals', currentCrystals + baseCrystalGain);
        this.registry.set('reputation', currentReputation + baseReputationGain);

        // 處理裝備掉落
        if (reward.itemDrops && reward.itemDrops.length > 0) {
            for (const itemId of reward.itemDrops) {
                const alreadyOwned = ownedItems.includes(itemId);

                if (alreadyOwned) {
                    // 重複裝備轉水晶
                    duplicateCrystalGain += 1;
                    duplicateItems.push(itemId);
                } else {
                    ownedItems.push(itemId);
                    newItems.push(itemId);
                }
            }

            this.registry.set('owned_items', ownedItems);
        }

        // 最後補上重複裝備轉換的水晶
        if (duplicateCrystalGain > 0) {
            this.registry.set(
                'user_crystals',
                (this.registry.get('user_crystals') || 0) + duplicateCrystalGain
            );
        }

        // 回寫到 reward，讓舊流程也能吃到
        reward.duplicateCrystalGain = duplicateCrystalGain;
        reward.newItems = newItems;
        reward.duplicateItems = duplicateItems;
        reward.finalCrystalGain = baseCrystalGain + duplicateCrystalGain;
        reward.finalReputationGain = baseReputationGain;

        // 回寫到 finalResultData，讓新流程統一吃這包
        if (!this.finalResultData) {
            this.finalResultData = {};
        }

        this.finalResultData.crystals = reward.finalCrystalGain;
        this.finalResultData.reputation = reward.finalReputationGain;
        this.finalResultData.itemDrops = [...(reward.itemDrops || [])];

        this.finalResultData.newItems = [...newItems];
        this.finalResultData.duplicateItems = [...duplicateItems];
        this.finalResultData.duplicateCrystalGain = duplicateCrystalGain;
        this.finalResultData.finalCrystalGain = reward.finalCrystalGain;
        this.finalResultData.finalReputationGain = reward.finalReputationGain;

        console.log('🎁 [BushExplore] grantReward 結果 =', {
            finalCrystalGain: reward.finalCrystalGain,
            finalReputationGain: reward.finalReputationGain,
            newItems,
            duplicateItems,
            duplicateCrystalGain
        });
    }

    stopFruitBreathing() {
        if (!this.gameState?.mapTiles) return;

        this.gameState.mapTiles.forEach(tile => {
            if (!tile?.view || !tile.view.bugSprite) return;

            const fruit = tile.view.bugSprite;

            if (fruit._breathingTween) {
                fruit._breathingTween.stop();
                fruit._breathingTween = null;

                // 回到正常大小
                fruit.setScale(0.55);
            }
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

            stage_progress: this.registry.get('stage_progress')
        };

        localStorage.setItem('forest_save_data', JSON.stringify(dataToSave));
        console.log('💾 [BushExplore] 關卡結果已存檔！');
    }

    showMessage(text, duration = 1500, priority = 1) {
        if (!this.messageText) return;        
        if (!text) return;

        const nowShowing = !!this.messageShowing;
        const currentPriority = this.messagePriority || 0;

        // 如果目前有訊息，且新訊息優先級比較低 → 不覆蓋
        if (nowShowing && priority < currentPriority) {
            return;
        }

        // 更新狀態
        this.messageShowing = true;
        this.messagePriority = priority;

        this.messageText.setText(text);

        // 清掉舊 timer
        if (this.messageHideTimer) {
            this.messageHideTimer.remove();
            this.messageHideTimer = null;
        }

        // 停掉舊 tween
        this.tweens.killTweensOf([this.messageText, this.messageIcon]);

        // 顯示
        this.messageText.setAlpha(1);

        // 淡入一點點（可有可無）
        this.tweens.add({
            targets: this.messageText,
            alpha: 1,
            duration: 120,
            ease: 'Sine.Out'
        });

        // 到時間後隱藏
        this.messageHideTimer = this.time.delayedCall(duration, () => {
            this.tweens.add({
                targets: this.messageText,
                alpha: 0,
                duration: 180,
                ease: 'Sine.Out',
                onComplete: () => {
                    this.messageShowing = false;
                    this.messagePriority = 0;
                }
            });
        });
    }

    hideTopBannerMessage() {
        if (!this.topBannerBg || !this.topBannerText || !this.topBannerShadow) return;

        if (this.topBannerTween) {
            this.topBannerTween.remove();
            this.topBannerTween = null;
        }

        this.tweens.killTweensOf([
            this.topBannerShadow,
            this.topBannerBg,
            this.topBannerText
        ]);

        this.tweens.add({
            targets: [this.topBannerShadow, this.topBannerBg, this.topBannerText],
            alpha: 0,
            duration: 220,
            ease: 'Sine.Out',
            onComplete: () => {
                this.topBannerShadow.setVisible(false);
                this.topBannerBg.setVisible(false);
                this.topBannerText.setVisible(false);

                this.topBannerShowing = false;
                this.topBannerPriority = 0;
                this.topBannerTween = null;
            }
        });
    }

    showTopBannerMessage(text, duration = null, priority = 1) {
        if (!this.topBannerBg || !this.topBannerText || !this.topBannerShadow) return;
        if (!text) return;

        const nowShowing = !!this.topBannerShowing;
        const currentPriority = this.topBannerPriority || 0;

        // 目前已有訊息，且新訊息優先級不夠高 → 不覆蓋
        if (nowShowing && priority < currentPriority) {
            return;
        }

        // 更新狀態
        this.topBannerShowing = true;
        this.topBannerPriority = priority;
        this.topBannerText.setText(text);

        // 清掉舊的自動隱藏計時器
        if (this.topBannerTween) {
            this.topBannerTween.remove();
            this.topBannerTween = null;
        }

        // 停掉目前橫幅 tween
        this.tweens.killTweensOf([
            this.topBannerShadow,
            this.topBannerBg,
            this.topBannerText
        ]);

        this.topBannerShadow.setVisible(true);
        this.topBannerBg.setVisible(true);
        this.topBannerText.setVisible(true);

        // 第一次顯示 → 淡入
        if (!nowShowing) {
            this.topBannerShadow.setAlpha(0);
            this.topBannerBg.setAlpha(0);
            this.topBannerText.setAlpha(0);

            this.tweens.add({
                targets: [this.topBannerShadow, this.topBannerBg, this.topBannerText],
                alpha: 1,
                duration: 180,
                ease: 'Sine.Out'
            });
        } else {
            // 已顯示中 → 保持可見，只更新文字
            this.topBannerShadow.setAlpha(1);
            this.topBannerBg.setAlpha(1);
            this.topBannerText.setAlpha(1);
        }

        // 只有 duration 有值時，才自動隱藏
        if (duration && duration > 0) {
            this.topBannerTween = this.time.delayedCall(duration, () => {
                this.hideTopBannerMessage();
            });
        }
    }

    showGoldTopBanner(text) {
        // 用最高優先權
        this.showTopBannerMessage(text, 0, 3);

        // ⭐ 顏色改金色
        this.topBannerBg.setFillStyle(0xffd54f, 0.95); // 金色背景
        this.topBannerText.setColor('#3b2f00');        // 深金文字

        // ⭐ 放大彈出感
        this.topBannerBg.setScale(0.92);
        this.topBannerText.setScale(0.92);

        this.tweens.add({
            targets: [this.topBannerBg, this.topBannerText],
            scaleX: 1,
            scaleY: 1,
            duration: 220,
            ease: 'Back.Out'
        });

        // ⭐ 發光效果（微呼吸）
        if (this.topBannerGlowTween) {
            this.topBannerGlowTween.remove();
        }

        this.topBannerGlowTween = this.tweens.add({
            targets: this.topBannerBg,
            alpha: 0.95,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: 'Sine.InOut'
        });
    }

    createPopupBase(width = 760, height = 420, options = {}) {
        const centerX = options.centerX ?? 640;
        const centerY = options.centerY ?? 360;
        const overlayAlpha = options.overlayAlpha ?? 0.40;
        const panelColor = options.panelColor ?? 0xf6ffe8;
        const strokeColor = options.strokeColor ?? 0x5b8f55;

        this.popupLock = true;

        const container = this.add.container(0, 0);

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, overlayAlpha)
            .setInteractive();

        const panelShadow = this.add.rectangle(centerX + 6, centerY + 6, width, height, 0x000000, 0.22);
        const panel = this.add.rectangle(centerX, centerY, width, height, panelColor, 1)
            .setStrokeStyle(5, strokeColor);

        container.add([overlay, panelShadow, panel]);

        container.setAlpha(0);
        container.setScale(0.94);

        this.tweens.add({
            targets: container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 160,
            ease: 'Back.Out'
        });

        this.activePopup = container;
        return { container, overlay, panel, centerX, centerY };
    }

    closeActivePopup() {
        if (!this.activePopup) {
            this.popupLock = false;
            return;
        }

        const popup = this.activePopup;
        this.activePopup = null;

        this.tweens.add({
            targets: popup,
            alpha: 0,
            scaleX: 0.94,
            scaleY: 0.94,
            duration: 120,
            onComplete: () => {
                popup.destroy(true);
            }
        });

        this.popupLock = false;
    }

    createPopupButton(x, y, width, height, text, onClick, fillColor = 0x7bbf65, textColor = '#ffffff') {
        const bg = this.add.rectangle(x, y, width, height, fillColor)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, text, {
            fontSize: width >= 300 ? '28px' : '24px',
            color: textColor,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 36 }
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setScale(1.04);
            label.setScale(1.04);
        });

        bg.on('pointerout', () => {
            bg.setScale(1);
            label.setScale(1);
        });

        bg.on('pointerdown', () => {
            this.playSfxSafe('ui_click_sfx', 0.42);
            onClick?.();
        });

        return [bg, label];
    }

    playAnswerWrongFeedback(selectedAnswer) {
        if (!this.answerContainer || !this.answerContainer.list) return;

        const targets = [];

        for (let i = 0; i < this.answerContainer.list.length; i += 2) {
            const bg = this.answerContainer.list[i];
            const label = this.answerContainer.list[i + 1];

            if (!bg || !label) continue;
            if (String(label.text) !== String(selectedAnswer)) continue;

            // 錯誤答案按鈕變紅
            if (bg.setFillStyle) {
                bg.setFillStyle(0xe85b5b, 0.98);
                bg.setStrokeStyle(3, 0xffffff);
            }

            if (label.setColor) {
                label.setColor('#ffffff');
            }

            targets.push(bg, label);
        }

        if (targets.length > 0) {
            this.tweens.add({
                targets,
                scaleX: 1.08,
                scaleY: 1.08,
                x: '+=8',
                duration: 70,
                yoyo: true,
                repeat: 2,
                ease: 'Sine.InOut'
            });
        }
    }

    

    playAnswerCorrectFeedback(selectedAnswer) {
        if (!this.answerContainer || !this.answerContainer.list) return;

        const targets = [];

        for (let i = 0; i < this.answerContainer.list.length; i += 2) {
            const bg = this.answerContainer.list[i];
            const label = this.answerContainer.list[i + 1];

            if (!bg || !label) continue;
            if (String(label.text) !== String(selectedAnswer)) continue;

            if (bg.setFillStyle) {
                bg.setFillStyle(0x5fcf7a, 0.98);
                bg.setStrokeStyle(4, 0xffffff);
            }

            if (label.setColor) {
                label.setColor('#ffffff');
            }

            targets.push(bg, label);
        }

        if (targets.length > 0) {
            this.tweens.add({
                targets,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 120,
                yoyo: true,
                ease: 'Back.Out'
            });
        }
    }

    getItemDisplayIcon(itemData, itemId = '') {
        const id = itemId || itemData?.id || '';
        const slot = itemData?.slot || '';

        if (id.includes('crown') || id.includes('tiara')) return '👑';
        if (id.includes('wand')) return '🪄';
        if (id.includes('leaf')) return '🍃';
        if (id.includes('fairy')) return '🧚';

        if (slot === 'hat' || id.includes('hat')) return '👒';
        if (slot === 'cloth' || id.includes('cloth') || id.includes('dress')) return '👗';
        if (slot === 'fullset' || id.includes('fullset') || id.includes('set')) return '🎀';

        return '✨';
    }

    showItemDropSequence(itemIds = [], onComplete = null) {
        const list = [...itemIds];

        if (list.length <= 0) {
            onComplete?.();
            return;
        }

        const showNext = () => {
            if (list.length <= 0) {
                onComplete?.();
                return;
            }

            const itemId = list.shift();
            this.showItemDropPopup(itemId, showNext);
        };

        showNext();
    }

    showItemDropPopup(itemId, onClose = null) {
        const itemData = ITEM_DB[itemId];

        if (!itemData) {
            console.warn('[BushExplore] 找不到裝備資料:', itemId);
            onClose?.();
            return;
        }

        const rarityMap = {
            common: {
                label: '普通',
                color: 0xb8b8b8,
                glow: 0xf3f3f3,
                accent: '#6f6f6f',
                panel: 0xfffbf8,
                particleCount: 2,
                pulseScale: 1.01
            },
            rare: {
                label: '稀有',
                color: 0x7eb6ff,
                glow: 0xe8f3ff,
                accent: '#4d7fd6',
                panel: 0xf8fbff,
                particleCount: 4,
                pulseScale: 1.03
            },
            epic: {
                label: '夢幻',
                color: 0xd69cff,
                glow: 0xf7eaff,
                accent: '#9a59c7',
                panel: 0xfff8ff,
                particleCount: 6,
                pulseScale: 1.05
            },
            legendary: {
                label: '傳說',
                color: 0xffc76b,
                glow: 0xfff1cf,
                accent: '#d68a1f',
                panel: 0xfffcf6,
                particleCount: 9,
                pulseScale: 1.08
            }
        };

        const rarityInfo = rarityMap[itemData.rarity] || rarityMap.common;

        const { container } = this.createPopupBase(720, 560, {
            panelColor: 0xfffafc,
            strokeColor: rarityInfo.color,
            overlayAlpha: 0.50
        });

        const centerX = 640;
        const centerY = 360;

        // ===== 大背景光 =====
        const backGlow = this.add.circle(centerX, centerY - 10, 150, rarityInfo.color, 0.18)
            .setAlpha(0)
            .setScale(0.6);

        const backGlow2 = this.add.circle(centerX, centerY - 10, 210, rarityInfo.color, 0.08)
            .setAlpha(0)
            .setScale(0.6);

        // ===== 卡片陰影 =====
        const cardShadow = this.add.rectangle(centerX + 10, centerY + 12, 360, 430, 0x000000, 0.28)
            .setOrigin(0.5)
            .setAlpha(0);

        // ===== 卡片外光 =====
        const cardGlow = this.add.rectangle(centerX, centerY, 372, 442, rarityInfo.glow, 0.36)
            .setStrokeStyle(5, rarityInfo.color, 0.45)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.72);

        // ===== 卡片本體 =====
        const card = this.add.rectangle(centerX, centerY, 348, 418, rarityInfo.panel, 1)
            .setStrokeStyle(6, rarityInfo.color, 1)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.72);

        const cardInner = this.add.rectangle(centerX, centerY + 6, 312, 378, 0xffffff, 0.72)
            .setStrokeStyle(2, rarityInfo.color, 0.35)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.72);

        // ===== 標題 =====
        const title = this.add.text(centerX, 108, '✨ 發現新裝備！', {
            fontSize: '40px',
            color: rarityInfo.accent,
            fontStyle: 'bold',
            stroke: '#fff7fb',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setScale(0.8);

        // ===== 稀有度標籤 =====
        const rarityBadge = this.add.rectangle(centerX, 176, 140, 42, rarityInfo.color, 0.95)
            .setStrokeStyle(3, 0xffffff, 0.9)
            .setAlpha(0)
            .setScale(0.75);

        const rarityText = this.add.text(centerX, 176, `✦ ${rarityInfo.label}`, {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setScale(0.75);

        // ===== icon 區 =====
        const iconHalo = this.add.circle(centerX, 264, 64, rarityInfo.color, 0.18)
            .setStrokeStyle(4, rarityInfo.color, 0.45)
            .setAlpha(0)
            .setScale(0.55);

        const iconPlate = this.add.circle(centerX, 264, 50, 0xffffff, 0.95)
            .setStrokeStyle(4, rarityInfo.color, 0.9)
            .setAlpha(0)
            .setScale(0.55);

        // 之後若正式裝備圖，可改成 image
        const itemIcon = this.getItemDisplayIcon(itemData, itemId);
        let iconFontSize = '62px';

        if (itemIcon === '👑') iconFontSize = '58px';
        else if (itemIcon === '🪄') iconFontSize = '56px';
        else if (itemIcon === '🎀') iconFontSize = '58px';
        else if (itemIcon === '✨') iconFontSize = '54px';

        const itemIconText = this.add.text(centerX, 264, itemIcon, {
            fontSize: iconFontSize
        }).setOrigin(0.5).setAlpha(0).setScale(0.35);

        // ===== 名稱 =====
        const itemNameText = this.add.text(centerX, 352, itemData.name || itemId, {
            fontSize: '30px',
            color: '#563f4e',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 270 }
        }).setOrigin(0.5).setAlpha(0).setScale(0.85);

        // ===== 祝福 / 描述 =====
        const descText = this.add.text(
            centerX,
            418,
            itemData.blessing || itemData.description || '得到了一件很特別的裝備！',
            {
                fontSize: '22px',
                color: '#6b5d67',
                align: 'center',
                wordWrap: { width: 280 },
                lineSpacing: 8
            }
        ).setOrigin(0.5).setAlpha(0);

        // ===== 提示 =====
        const tipText = this.add.text(centerX, 486, '收下這份閃亮的祝福吧！', {
            fontSize: '20px',
            color: rarityInfo.accent,
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const okBtn = this.createPopupButton(
            centerX,
            560,
            230,
            64,
            '收下裝備',
            () => {
                this.closeActivePopup();
                this.time.delayedCall(140, () => {
                    onClose?.();
                });
            },
            rarityInfo.color,
            '#ffffff'
        );

        container.add([
            backGlow,
            backGlow2,
            cardShadow,
            cardGlow,
            card,
            cardInner,
            title,
            rarityBadge,
            rarityText,
            iconHalo,
            iconPlate,
            itemIconText,
            itemNameText,
            descText,
            tipText,
            ...okBtn
        ]);

        // ===== 入場動畫 =====
        this.tweens.add({
            targets: [backGlow, backGlow2],
            alpha: { from: 0, to: 1 },
            scaleX: 1,
            scaleY: 1,
            duration: 320,
            ease: 'Sine.Out'
        });

        this.tweens.add({
            targets: [cardShadow, cardGlow, card, cardInner],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 360,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: title,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            y: 116,
            duration: 260,
            delay: 100,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: [rarityBadge, rarityText],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 220,
            delay: 220,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: [iconHalo, iconPlate],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 260,
            delay: 320,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: itemIconText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            angle: { from: -8, to: 0 },
            duration: 340,
            delay: 360,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: itemNameText,
            alpha: 1,
            y: 346,
            duration: 220,
            delay: 520,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: descText,
            alpha: 1,
            duration: 220,
            delay: 650
        });

        this.tweens.add({
            targets: tipText,
            alpha: 1,
            duration: 220,
            delay: 760
        });

        // ===== 持續浮動 =====
        this.tweens.add({
            targets: [cardGlow, iconHalo],
            scaleX: rarityInfo.pulseScale || 1.01,
            scaleY: rarityInfo.pulseScale || 1.01,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        this.tweens.add({
            targets: [iconPlate, itemIconText],
            y: '-=6',
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        this.tweens.add({
            targets: backGlow,
            alpha: 0.12,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        // ===== 閃光粒子 =====
        const sparkleCount = rarityInfo.particleCount || 2;

        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = this.add.text(
                centerX + Phaser.Math.Between(-130, 130),
                centerY + Phaser.Math.Between(-150, 120),
                Phaser.Math.Between(0, 1) === 0 ? '✨' : '✦',
                {
                    fontSize: `${Phaser.Math.Between(18, 30)}px`
                }
            ).setOrigin(0.5).setAlpha(0);

            container.add(sparkle);

            this.tweens.add({
                targets: sparkle,
                alpha: { from: 0, to: 1 },
                y: sparkle.y - Phaser.Math.Between(14, 34),
                x: sparkle.x + Phaser.Math.Between(-12, 12),
                duration: 420,
                delay: 180 + i * 55,
                yoyo: true,
                hold: 200,
                ease: 'Sine.Out',
                onComplete: () => sparkle.destroy()
            });
        }

        // ===== 稀有度額外強光 =====
        if (['epic', 'legendary'].includes(itemData.rarity)) {
            const flashRing = this.add.circle(centerX, 264, 86, rarityInfo.color, 0)
                .setStrokeStyle(5, rarityInfo.color, 0.8)
                .setScale(0.4);

            container.add(flashRing);

            this.tweens.add({
                targets: flashRing,
                alpha: { from: 0.9, to: 0 },
                scaleX: 1.45,
                scaleY: 1.45,
                duration: 600,
                ease: 'Cubic.Out',
                onComplete: () => flashRing.destroy()
            });
        }

        // ===== 音效 =====
        if (itemData.rarity === 'legendary' || itemData.rarity === 'epic') {
            this.playSfxSafe('reward_rare_sfx', 0.55);
        } else {
            this.playSfxSafe('reward_item_sfx', 0.5);
        }
    }

    playChestRewardShowcase(container, reward) {
        const centerX = 640;
        const chestY = 255;

        const normalChestCount = reward.chest || 0;
        const rareChestCount = reward.rareChest || 0;
        const hasItemDrop = Array.isArray(reward.itemDrops) && reward.itemDrops.length > 0;

        // ===== 稀有寶箱提示 =====
        if (rareChestCount > 0) {
            const rareGlow = this.add.circle(centerX, chestY, 72, 0xfff4a8, 0.22);
            const rareText = this.add.text(centerX, chestY, '🌈', {
                fontSize: '64px'
            }).setOrigin(0.5);

            const rareLabel = this.add.text(centerX, chestY + 62, '閃亮寶箱！', {
                fontSize: '28px',
                color: '#c97f00',
                fontStyle: 'bold',
                stroke: '#fff6d6',
                strokeThickness: 4
            }).setOrigin(0.5);

            container.add([rareGlow, rareText, rareLabel]);

            rareGlow.setScale(0.6);
            rareGlow.setAlpha(0);
            rareText.setScale(0.6);
            rareText.setAlpha(0);
            rareLabel.setScale(0.8);
            rareLabel.setAlpha(0);

            this.tweens.add({
                targets: [rareGlow, rareText, rareLabel],
                alpha: 1,
                duration: 220
            });

            this.tweens.add({
                targets: [rareGlow, rareText],
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 280,
                yoyo: true,
                ease: 'Back.Out'
            });

            this.tweens.add({
                targets: rareGlow,
                alpha: 0.12,
                scaleX: 1.14,
                scaleY: 1.14,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });

            this.playSfxSafe('reward_rare_sfx', 0.5);

            // 額外稀有提示字
            const rarePopup = this.add.text(centerX, chestY - 92, '✨ 稀有發現！', {
                fontSize: '30px',
                color: '#ffe066',
                fontStyle: 'bold',
                stroke: '#7a5200',
                strokeThickness: 5
            }).setOrigin(0.5);

            rarePopup.setAlpha(0);
            rarePopup.setScale(0.75);
            container.add(rarePopup);

            this.tweens.add({
                targets: rarePopup,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                y: chestY - 102,
                duration: 260,
                ease: 'Back.Out'
            });

            this.tweens.add({
                targets: rarePopup,
                alpha: 0,
                delay: 1100,
                duration: 380
            });
        }

        // ===== 普通寶箱提示 =====
        if (rareChestCount <= 0 && normalChestCount > 0) {
            const chestText = this.add.text(centerX, chestY, '🧰', {
                fontSize: '58px'
            }).setOrigin(0.5);

            const chestLabel = this.add.text(centerX, chestY + 58, '寶箱！', {
                fontSize: '26px',
                color: '#7a5a2f',
                fontStyle: 'bold',
                stroke: '#fff4d8',
                strokeThickness: 4
            }).setOrigin(0.5);

            container.add([chestText, chestLabel]);

            chestText.setScale(0.7);
            chestText.setAlpha(0);
            chestLabel.setAlpha(0);

            this.tweens.add({
                targets: [chestText, chestLabel],
                alpha: 1,
                duration: 180
            });

            this.tweens.add({
                targets: chestText,
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 260,
                yoyo: true,
                ease: 'Back.Out'
            });

            this.tweens.add({
                targets: chestText,
                y: chestY - 4,
                duration: 850,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });

            this.playSfxSafe('reward_chest_sfx', 0.42);
        }

        // ===== 裝備掉落提示 =====
        if (hasItemDrop) {
            const itemPopup = this.add.text(centerX, chestY + 118, '🎀 獲得新裝備！', {
                fontSize: '32px',
                color: '#ff6fa5',
                fontStyle: 'bold',
                stroke: '#fff0f6',
                strokeThickness: 5
            }).setOrigin(0.5);

            itemPopup.setAlpha(0);
            itemPopup.setScale(0.72);
            container.add(itemPopup);

            this.tweens.add({
                targets: itemPopup,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                y: chestY + 108,
                duration: 280,
                ease: 'Back.Out'
            });

            this.tweens.add({
                targets: itemPopup,
                alpha: 0,
                delay: 1300,
                duration: 420
            });

            // 小閃光粒子
            for (let i = 0; i < 6; i++) {
                const sparkle = this.add.text(
                    centerX + Phaser.Math.Between(-70, 70),
                    chestY + Phaser.Math.Between(-30, 60),
                    '✨',
                    { fontSize: '24px' }
                ).setOrigin(0.5);

                sparkle.setAlpha(0);
                container.add(sparkle);

                this.tweens.add({
                    targets: sparkle,
                    alpha: 1,
                    y: sparkle.y - Phaser.Math.Between(16, 36),
                    duration: 220,
                    yoyo: true,
                    ease: 'Sine.Out',
                    delay: i * 60,
                    onComplete: () => sparkle.destroy()
                });
            }

            this.playSfxSafe('reward_item_sfx', 0.5);
        }
    }

    showResultPopup(reward, extraPenalty = 0) {
        const result = this.finalResultData || {};

        const { container } = this.createPopupBase(760, 500);

        const starCount = result.stars || 0;
        const crystalValue = result.crystals || 0;
        const reputationValue = result.reputation || 0;

        const dreamChestCount = result.dreamChest || 0;
        const bigChestCount = result.bigChest || 0;
        const smallChestCount = result.smallChest || 0;
        const stageChestCount = result.stageChest || 0;

        const itemDrops = [...(result.itemDrops || [])];

        const title = this.add.text(640, 175, '挑戰成功！', {
            fontSize: '38px',
            color: '#4d7f34',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const starText = this.add.text(640, 255, '⭐'.repeat(starCount), {
            fontSize: '50px'
        }).setOrigin(0.5).setAlpha(0);

        const rewardText = this.add.text(
            640,
            325,
            `💎 +${crystalValue}    ⭐ +${reputationValue}`,
            {
                fontSize: '32px',
                color: '#314927',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setAlpha(0);

        let chestLabel = '';
        let chestColor = '#7a5a2f';

        if (dreamChestCount > 0) {
            chestLabel = '🌈 夢幻寶箱！';
            chestColor = '#c97f00';
        } else if (bigChestCount > 0) {
            chestLabel = '🟡 大寶箱！';
            chestColor = '#9a6a00';
        } else if (smallChestCount > 0) {
            chestLabel = '🧰 小寶箱！';
            chestColor = '#7a5a2f';
        } else if (stageChestCount > 0) {
            chestLabel = '🎁 關卡寶箱！';
            chestColor = '#5f7d35';
        } else {
            chestLabel = '🍃 本次沒有寶箱';
            chestColor = '#6f7b63';
        }

        const chestText = this.add.text(640, 390, chestLabel, {
            fontSize: '34px',
            color: chestColor,
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        let vibeTextStr = '';

        if (dreamChestCount > 0) {
            vibeTextStr = '今天超幸運！';
        } else if (bigChestCount > 0) {
            vibeTextStr = '這次收穫超棒！';
        } else if (smallChestCount > 0) {
            vibeTextStr = '這次收穫很不錯！';
        } else if (stageChestCount > 0) {
            vibeTextStr = '穩穩前進中！';
        } else if (starCount === 3) {
            vibeTextStr = '表現超棒！';
        } else if (starCount === 2) {
            vibeTextStr = '很不錯！';
        } else {
            vibeTextStr = '再試一次會更好！';
        }

        const vibeText = this.add.text(640, 450, vibeTextStr, {
            fontSize: '26px',
            color: '#556b2f'
        }).setOrigin(0.5).setAlpha(0);

        const lootLines = [];

        if ((result.chestLootLines || []).length > 0) {
            lootLines.push(...result.chestLootLines);
        } else {
            if ((reward.chestBonusCrystals || 0) > 0) {
                lootLines.push(`💎 +${reward.chestBonusCrystals}`);
            }

            if ((reward.chestBonusReputation || 0) > 0) {
                lootLines.push(`⭐ +${reward.chestBonusReputation}`);
            }

            if ((reward.chestBonusItems || 0) > 0) {
                lootLines.push(`🎀 +${reward.chestBonusItems}`);
            }
        }

        const lootTextStr = lootLines.length > 0
            ? lootLines.join('   ')
            : '🍃';

        const lootText = this.add.text(640, 505, lootTextStr, {
            fontSize: '30px',
            color: '#5b6b4e',
            align: 'center',
            wordWrap: { width: 620 }
        }).setOrigin(0.5).setAlpha(0);

        const okBtn = this.createPopupButton(
            640,
            620,
            220,
            62,
            '返回地圖',
            () => {
                this.closeActivePopup();

                this.time.delayedCall(140, () => {
                    this.showItemDropSequence(itemDrops, () => {
                        this.scene.start(this.returnScene, this.returnData);
                    });
                });
            },
            0x79ba63
        );

        container.add([
            title,
            starText,
            rewardText,
            chestText,
            vibeText,
            lootText,
            ...okBtn
        ]);

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 180
        });

        this.tweens.add({
            targets: starText,
            alpha: 1,
            scaleX: 1.12,
            scaleY: 1.12,
            duration: 260,
            delay: 120,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: rewardText,
            alpha: 1,
            y: 318,
            delay: 280,
            duration: 220,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: chestText,
            alpha: 1,
            y: 384,
            delay: 440,
            duration: 220,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: vibeText,
            alpha: 1,
            y: 444,
            delay: 620,
            duration: 220
        });

        this.tweens.add({
            targets: lootText,
            alpha: 1,
            y: 498,
            delay: 760,
            duration: 220
        });
    }


    showFailPopup(reward) {
        const result = this.finalResultData || {};

        const { container } = this.createPopupBase(760, 500, {
            panelColor: 0xfffbf6,
            strokeColor: 0xb9896f,
            overlayAlpha: 0.34
        });

        const hasGoldBush = !!result.gotGoldBush;
        const hasGoldChest = hasGoldBush || (reward.goldGuaranteedChest === true);
        const itemDrops = [...(result.itemDrops || [])];

        // 標題
        const title = this.add.text(640, 168, '探險失敗…', {
            fontSize: '40px',
            color: '#8b4a3c',
            fontStyle: 'bold',
            stroke: '#fff2eb',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        // 副標
        const subTitle = this.add.text(640, 214, '這次草叢有點危險，但你已經很努力了！', {
            fontSize: '24px',
            color: '#7a5a4d',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        // 中央表情
        const failFace = this.add.text(640, 292, '😵‍💫', {
            fontSize: '72px'
        }).setOrigin(0.5).setAlpha(0).setScale(0.8);

        // 失敗訊息框
        const msgBox = this.add.rectangle(640, 388, 590, hasGoldChest ? 132 : 102, 0xfff3ea)
            .setStrokeStyle(4, 0xe0b59d)
            .setAlpha(0);

        let mainText = '體力用完了，先回去休息一下吧。';
        if (this.gameState.phase === 'failed' || this.gameState.stamina <= 0) {
            mainText = '體力已經降到 0 了，先休息一下再挑戰吧。';
        }

        const msgText = this.add.text(640, hasGoldChest ? 368 : 388, mainText, {
            fontSize: '26px',
            color: '#5b3429',
            align: 'center',
            wordWrap: { width: 500 },
            lineSpacing: 8
        }).setOrigin(0.5).setAlpha(0);

        let goldChestText = null;
        let failButtonY = 560;

        if (hasGoldChest) {
            goldChestText = this.add.text(640, 418, '🎁 你有找到金草叢，獲得保底大寶箱！', {
                fontSize: '24px',
                color: '#9a6a00',
                fontStyle: 'bold',
                align: 'center',
                stroke: '#fff8df',
                strokeThickness: 4
            }).setOrigin(0.5).setAlpha(0);
        }

        const failLootParts = [];

        if ((result.crystals || 0) > 0) {
            failLootParts.push(`💎 +${result.crystals}`);
        }

        if ((result.reputation || 0) > 0) {
            failLootParts.push(`⭐ +${result.reputation}`);
        }

        if ((result.itemDrops || []).length > 0) {
            failLootParts.push(`🎀 +${result.itemDrops.length}`);
        }

        let failLootText = null;

        if (failLootParts.length > 0) {
            failButtonY = 610;

            failLootText = this.add.text(640, hasGoldChest ? 466 : 430, failLootParts.join('   '), {
                fontSize: '28px',
                color: '#6a5848',
                align: 'center'
            }).setOrigin(0.5).setAlpha(0);
        }

        // 返回按鈕
        const okBtn = this.createPopupButton(
            640,
            failButtonY,
            220,
            62,
            '返回地圖',
            () => {
                this.closeActivePopup();

                this.time.delayedCall(140, () => {
                    this.showItemDropSequence(itemDrops, () => {
                        this.scene.start(this.returnScene, this.returnData);
                    });
                });
            },
            0xc77e62
        );

        const addList = [
            title,
            subTitle,
            failFace,
            msgBox,
            msgText
        ];

        if (goldChestText) {
            addList.push(goldChestText);
        }

        if (failLootText) {
            addList.push(failLootText);
        }

        addList.push(...okBtn);

        container.add(addList);

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 180
        });

        this.tweens.add({
            targets: subTitle,
            alpha: 1,
            y: 220,
            delay: 100,
            duration: 180
        });

        this.tweens.add({
            targets: failFace,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            delay: 180,
            duration: 260,
            ease: 'Back.Out'
        });

        this.tweens.add({
            targets: msgBox,
            alpha: 1,
            delay: 280,
            duration: 180
        });

        this.tweens.add({
            targets: msgText,
            alpha: 1,
            y: hasGoldChest ? 362 : 382,
            delay: 360,
            duration: 220,
            ease: 'Back.Out'
        });

        if (goldChestText) {
            this.tweens.add({
                targets: goldChestText,
                alpha: 1,
                y: 412,
                delay: 500,
                duration: 220,
                ease: 'Back.Out'
            });
        }

        if (failLootText) {
            this.tweens.add({
                targets: failLootText,
                alpha: 1,
                y: hasGoldChest ? 460 : 424,
                delay: 620,
                duration: 220
            });
        }

        this.tweens.add({
            targets: failFace,
            y: 298,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        if (this.boardFrame) {
            this.boardFrame.setStrokeStyle(6, 0xeaffea, 0.6);
        }

        if (this.boardGlow) {
            this.boardGlow.setStrokeStyle(5, 0xeaffea, 0.35);
        }

    }
}