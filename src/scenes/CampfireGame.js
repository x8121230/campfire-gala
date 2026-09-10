import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import {
    CAMPFIRE_GUESTS,
    CAMPFIRE_JUDGEMENT_WINDOWS,
    KIDS_CAMPFIRE_ROUND_COUNT,
    calculateCampfireAccuracy,
    calculateCampfireScore,
    getCampfireJudgement,
    getCampfireHeatState,
    getKidsCampfireRoundProfile,
    getOscillatingHeatPassIndex,
    getOscillatingHeatProgress,
    shouldCreateRainbowMarshmallow
} from '../data/CampfireGameData.js';

const FONT = 'Microsoft JhengHei, Arial';
const HEAT_BAR = Object.freeze({ left: 500, top: 154, width: 570, height: 52 });
const MARSHMALLOW_POSITION = Object.freeze({ x: 785, y: 365 });

export default class CampfireGame extends Phaser.Scene {
    constructor() {
        super('CampfireGame');
    }

    init(data = {}) {
        this.stageId = data.stageId || 'campfire_01';
        this.returnScene = data.returnScene || 'WorldMap';
        this.mapID = data.mapID || data.mapId || '01';
        this.gameMode = data.mode || 'kids';
        this.testMode = data.testMode === true;
    }

    create() {
        this.guests = Phaser.Utils.Array.Shuffle([...CAMPFIRE_GUESTS]).slice(0, KIDS_CAMPFIRE_ROUND_COUNT);
        this.roundIndex = 0;
        this.completedCount = 0;
        this.earlyCount = 0;
        this.hotCount = 0;
        this.timeoutCount = 0;
        this.perfectCount = 0;
        this.rainbowPerfectCount = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.rainbowCount = 0;
        this.rainbowOffered = false;
        this.inputLocked = false;
        this.finished = false;
        this.heatProgress = 0;
        this.roundElapsed = 0;
        this.lastHeatState = '';
        this.heatPassIndex = 0;
        this.lastHeatPassIndex = 0;
        this.penalizedHeatPasses = new Set();
        this.lastTimerSecond = null;
        this.lastActionAt = -9999;
        this.startedAt = this.time.now;
        this.partyGuestObjects = [];

        this.createBackground();
        this.createHud();
        this.createGuestPanel();
        this.createRoastArea();
        this.createPartyStrip();
        this.startRound(0);

        if (this.cache.audio.exists('campfire_music')) AudioSystem.playBgm(this, 'campfire_music', 0.3);
        this.cameras.main.fadeIn(260, 38, 17, 32);
        this.events.once('shutdown', () => AudioSystem.stopBgm(this));
        this.events.once('destroy', () => AudioSystem.stopBgm(this));
    }

    createBackground() {
        const skyColors = [0x171936, 0x211c43, 0x2d234d, 0x3b2b53, 0x4a3453, 0x5a3d4d];
        skyColors.forEach((color, index) => {
            this.add.rectangle(640, index * 120 + 60, 1280, 122, color);
        });

        this.add.circle(1115, 125, 48, 0xffedaf, 0.9);
        this.add.circle(1136, 109, 47, 0x211c43, 1);
        for (let index = 0; index < 30; index += 1) {
            const star = this.add.circle(
                Phaser.Math.Between(15, 1265),
                Phaser.Math.Between(85, 455),
                Phaser.Math.Between(1, 3),
                0xffedb0,
                Phaser.Math.FloatBetween(0.25, 0.8)
            );
            this.tweens.add({
                targets: star,
                alpha: 0.08,
                duration: Phaser.Math.Between(900, 1900),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 900)
            });
        }

        this.add.ellipse(160, 655, 620, 310, 0x193e32, 1);
        this.add.ellipse(650, 690, 1000, 340, 0x173a2d, 1);
        this.add.ellipse(1160, 650, 620, 290, 0x1b4031, 1);

        [35, 120, 1200, 1260].forEach((x, index) => {
            this.add.rectangle(x, 340, 58, 430, 0x173022, 1);
            this.add.circle(x + (index % 2 ? 15 : -15), 205, 130, 0x214b32, 1);
            this.add.circle(x + (index % 2 ? -55 : 55), 260, 105, 0x27573a, 1);
        });

        this.add.rectangle(640, 42, 1280, 84, 0x17162d, 0.94);
    }

    createHud() {
        const returnLabel = this.returnScene === 'MiniGameHub' ? '← 樂園' : '← 地圖';
        this.makeButton(86, 42, 136, 54, returnLabel, 0xffe4a2, 0x8a6429, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 22);

        this.add.text(640, 30, '🔥 營火晚會①', {
            fontFamily: FONT,
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#fff0ae',
            stroke: '#6c3627',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.add.text(640, 61, '棉花糖烤烤樂', {
            fontFamily: FONT,
            fontSize: '18px',
            color: '#ffd9c1'
        }).setOrigin(0.5);

        this.progressText = this.add.text(1090, 30, '', {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.scoreText = this.add.text(1090, 59, '', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#ffe9a0'
        }).setOrigin(0.5);
    }

    createGuestPanel() {
        this.add.rectangle(205, 348, 330, 500, 0xfff7dc, 0.96)
            .setStrokeStyle(7, 0xf1b84d, 1);
        this.add.text(205, 128, '今晚的小客人', {
            fontFamily: FONT,
            fontSize: '25px',
            fontStyle: 'bold',
            color: '#765126'
        }).setOrigin(0.5);

        this.guestGlow = this.add.circle(205, 300, 116, 0xffd76c, 0.18);
        this.guestImage = this.add.image(205, 300, CAMPFIRE_GUESTS[0].texture).setDisplaySize(225, 225);
        this.guestNameText = this.add.text(205, 430, '', {
            fontFamily: FONT,
            fontSize: '29px',
            fontStyle: 'bold',
            color: '#5f4328'
        }).setOrigin(0.5);
        this.guestSpeechText = this.add.text(205, 495, '', {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#7c6041',
            align: 'center',
            lineSpacing: 5,
            wordWrap: { width: 275 }
        }).setOrigin(0.5);
    }

    createRoastArea() {
        this.add.rectangle(785, 350, 765, 500, 0x241c2d, 0.77)
            .setStrokeStyle(7, 0xefb755, 0.75);

        this.add.text(785, 116, '看火候，把棉花糖烤成金黃色！', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#fff3bf'
        }).setOrigin(0.5);

        const barCenterY = HEAT_BAR.top + HEAT_BAR.height / 2;

        this.heatBarFrame = this.add.rectangle(
            HEAT_BAR.left + HEAT_BAR.width / 2,
            barCenterY,
            HEAT_BAR.width + 8,
            HEAT_BAR.height + 8,
            0x3f302f,
            1
        )
            .setStrokeStyle(3, 0xf3d27a, 0.9);
        this.heatZoneGraphics = this.add.graphics();
        this.perfectZoneGlow = this.add.rectangle(
            0,
            barCenterY,
            HEAT_BAR.width * CAMPFIRE_JUDGEMENT_WINDOWS.perfectWidth,
            HEAT_BAR.height - 8,
            0xfff6b0,
            0.11
        )
            .setStrokeStyle(2, 0xffffff, 0.34);
        this.perfectStarLeft = this.add.text(0, barCenterY, '✦', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.55);
        this.perfectStarRight = this.add.text(0, barCenterY, '✦', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.55);
        this.rawHeatLabel = this.add.text(0, barCenterY, '火太小', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#6f675b' }).setOrigin(0.5);
        this.goldenHeatLabel = this.add.text(0, barCenterY, '✨ 現在！', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#704512' }).setOrigin(0.5);
        this.burntHeatLabel = this.add.text(0, barCenterY, '🔥 太旺', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#fff4e7' }).setOrigin(0.5);

        this.heatMarkerGlow = this.add.circle(HEAT_BAR.left, barCenterY, 24, 0xffe66d, 0.19);
        this.heatMarkerLine = this.add.rectangle(HEAT_BAR.left, barCenterY, 5, HEAT_BAR.height - 6, 0xffffff, 0.88)
            .setStrokeStyle(1, 0x9f5b2e, 0.8);
        this.heatMarker = this.add.text(HEAT_BAR.left, barCenterY - 1, '🔥', {
            fontFamily: FONT,
            fontSize: '25px'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: this.heatMarkerGlow,
            scale: 1.18,
            alpha: 0.08,
            duration: 380,
            yoyo: true,
            repeat: -1
        });
        this.heatStateText = this.add.text(785, 242, '', {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4c2c29',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.timerBadge = this.add.circle(1100, 235, 42, 0x314b4a, 0.95)
            .setStrokeStyle(4, 0xf6d37b, 1);
        this.timerText = this.add.text(1100, 229, '14', {
            fontFamily: FONT,
            fontSize: '27px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(1100, 257, '秒', {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffe9a0'
        }).setOrigin(0.5);

        this.marshmallowGlow = this.add.circle(MARSHMALLOW_POSITION.x, MARSHMALLOW_POSITION.y, 130, 0xffdb63, 0.08);
        this.skewerLine = this.add.graphics().lineStyle(12, 0xb88754, 1);
        this.skewerLine.beginPath();
        this.skewerLine.moveTo(515, 500);
        this.skewerLine.lineTo(975, 275);
        this.skewerLine.strokePath();

        this.marshmallowContainer = this.add.container(MARSHMALLOW_POSITION.x, MARSHMALLOW_POSITION.y);
        this.marshmallowCore = this.add.rectangle(0, 0, 128, 132, 0xfff8e7, 1);
        this.marshmallowLeft = this.add.ellipse(-64, 0, 68, 132, 0xfff8e7, 1);
        this.marshmallowRight = this.add.ellipse(64, 0, 68, 132, 0xfff8e7, 1);
        this.marshmallowEndCap = this.add.ellipse(66, 0, 43, 108, 0xf2e9d8, 0.72)
            .setStrokeStyle(3, 0xd7c9b5, 0.48);
        this.marshmallowTopHighlight = this.add.ellipse(-5, -46, 118, 20, 0xffffff, 0.62);
        this.marshmallowBottomShade = this.add.ellipse(-5, 47, 125, 24, 0xd19a65, 0.12);
        this.marshmallowWrinkleLeft = this.add.ellipse(-59, 0, 24, 102, 0xffffff, 0)
            .setStrokeStyle(3, 0xd9cdbb, 0.34);
        this.marshmallowWrinkleRight = this.add.ellipse(57, 0, 19, 100, 0xffffff, 0)
            .setStrokeStyle(2, 0xffffff, 0.28);
        this.toastPatchA = this.add.ellipse(-37, -18, 48, 24, 0xb9793e, 0);
        this.toastPatchB = this.add.ellipse(20, 26, 60, 28, 0xc88745, 0);
        this.toastPatchC = this.add.ellipse(22, -35, 38, 18, 0xa96836, 0);
        this.toastSpeckles = [
            this.add.circle(-11, 5, 4, 0x9d6336, 0),
            this.add.circle(43, 8, 3, 0x9d6336, 0),
            this.add.circle(-50, 30, 3, 0x9d6336, 0)
        ];
        const rainbowColors = [0xff6f7e, 0xffb84d, 0xffe568, 0x69d986, 0x63cfee, 0xb88af0];
        this.rainbowSugar = rainbowColors.map((color, index) => this.add.circle(-48 + index * 19, -2 + (index % 2) * 17, 6, color, 0));
        this.marshmallowContainer.add([
            this.marshmallowCore,
            this.marshmallowLeft,
            this.marshmallowRight,
            this.marshmallowEndCap,
            this.marshmallowTopHighlight,
            this.marshmallowBottomShade,
            this.marshmallowWrinkleLeft,
            this.marshmallowWrinkleRight,
            this.toastPatchA,
            this.toastPatchB,
            this.toastPatchC,
            ...this.toastSpeckles,
            ...this.rainbowSugar
        ]).setRotation(-0.45).setSize(250, 190).setInteractive({ useHandCursor: true });
        this.marshmallowContainer.on('pointerover', () => {
            if (!this.inputLocked && !this.finished) this.marshmallowContainer.setScale(1.05);
        });
        this.marshmallowContainer.on('pointerout', () => {
            if (!this.inputLocked && !this.finished) this.marshmallowContainer.setScale(1);
        });
        this.marshmallowContainer.on('pointerdown', () => {
            if (!this.inputLocked && !this.finished) this.marshmallowContainer.setScale(0.97);
        });
        this.marshmallowContainer.on('pointerup', () => {
            if (!this.inputLocked && !this.finished) {
                this.marshmallowContainer.setScale(1.05);
                this.tryCollectMarshmallow();
            }
        });

        this.smokeText = this.add.text(MARSHMALLOW_POSITION.x, 270, '☁', {
            fontSize: '58px',
            color: '#bcb7c3'
        }).setOrigin(0.5).setAlpha(0);

        this.createFire(MARSHMALLOW_POSITION.x, 525);

        this.feedbackText = this.add.text(1040, 340, '', {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff0bf',
            align: 'center',
            lineSpacing: 5,
            wordWrap: { width: 205 }
        }).setOrigin(0.5);

        this.clickHintText = this.add.text(1040, 455, '👆 直接點棉花糖\n把它拿起來！', {
            fontFamily: FONT,
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#d9f5b9',
            stroke: '#2d4a31',
            strokeThickness: 4,
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);
        this.tweens.add({
            targets: this.clickHintText,
            scale: 1.08,
            alpha: 0.72,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.comboText = this.add.text(1040, 535, '', {
            fontFamily: FONT,
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffe177',
            stroke: '#5c3427',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    applyHeatProfile(profile) {
        const zones = profile.zones;
        const rawWidth = HEAT_BAR.width * zones.rawEnd;
        const goldenWidth = HEAT_BAR.width * (zones.goldenEnd - zones.rawEnd);
        const burntWidth = HEAT_BAR.width - rawWidth - goldenWidth;
        const barCenterY = HEAT_BAR.top + HEAT_BAR.height / 2;
        const rawCenterX = HEAT_BAR.left + rawWidth / 2;
        const goldenCenterX = HEAT_BAR.left + rawWidth + goldenWidth / 2;
        const burntCenterX = HEAT_BAR.left + rawWidth + goldenWidth + burntWidth / 2;

        this.heatZoneGraphics.clear();
        this.heatZoneGraphics.fillStyle(0xf6f0df, 1);
        this.heatZoneGraphics.fillRect(HEAT_BAR.left, HEAT_BAR.top, rawWidth, HEAT_BAR.height);
        this.heatZoneGraphics.fillStyle(0xffcf4c, 1);
        this.heatZoneGraphics.fillRect(HEAT_BAR.left + rawWidth, HEAT_BAR.top, goldenWidth, HEAT_BAR.height);
        this.heatZoneGraphics.fillStyle(0x7b4b42, 1);
        this.heatZoneGraphics.fillRect(HEAT_BAR.left + rawWidth + goldenWidth, HEAT_BAR.top, burntWidth, HEAT_BAR.height);

        this.perfectZoneGlow.setPosition(goldenCenterX, barCenterY);
        this.perfectStarLeft.setPosition(goldenCenterX - 15, barCenterY);
        this.perfectStarRight.setPosition(goldenCenterX + 15, barCenterY);
        this.rawHeatLabel.setPosition(rawCenterX, barCenterY);
        this.goldenHeatLabel.setPosition(goldenCenterX, barCenterY);
        this.burntHeatLabel.setPosition(burntCenterX, barCenterY);

        this.burntHeatLabel.setFontSize(burntWidth < 60 ? '14px' : '16px');
        this.currentZones = zones;
    }

    createFire(x, y) {
        const logA = this.add.rectangle(x, y + 35, 150, 30, 0x8f4f2f, 1).setRotation(0.26).setStrokeStyle(4, 0x5c321f, 1);
        const logB = this.add.rectangle(x, y + 35, 150, 30, 0xa45a31, 1).setRotation(-0.26).setStrokeStyle(4, 0x5c321f, 1);
        this.fireGlow = this.add.circle(x, y, 92, 0xff9d32, 0.17);
        this.fireOuter = this.add.ellipse(x, y, 112, 150, 0xff7a28, 1);
        this.fireMiddle = this.add.ellipse(x, y + 15, 78, 112, 0xffc437, 1);
        this.fireInner = this.add.ellipse(x, y + 28, 42, 72, 0xfff3a1, 1);
        [this.fireGlow, this.fireOuter, this.fireMiddle, this.fireInner].forEach((object, index) => {
            this.tweens.add({
                targets: object,
                scaleX: index === 0 ? 1.16 : 0.9,
                scaleY: index === 0 ? 1.08 : 1.08,
                alpha: index === 0 ? 0.08 : 0.88,
                duration: 430 + index * 90,
                yoyo: true,
                repeat: -1
            });
        });
        this.children.bringToTop(logA);
        this.children.bringToTop(logB);
        this.children.bringToTop(this.fireOuter);
        this.children.bringToTop(this.fireMiddle);
        this.children.bringToTop(this.fireInner);
    }

    createPartyStrip() {
        this.add.rectangle(640, 655, 1040, 82, 0x102c23, 0.88).setStrokeStyle(3, 0xe6bd59, 0.6);
        this.add.text(125, 655, '晚會朋友', {
            fontFamily: FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#ffe59b'
        }).setOrigin(0.5);
        for (let index = 0; index < KIDS_CAMPFIRE_ROUND_COUNT; index += 1) {
            this.add.circle(260 + index * 125, 655, 31, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.18);
        }
        this.rainbowStatusText = this.add.text(1085, 655, '🌈 彩虹：0', {
            fontFamily: FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#f6d9ff'
        }).setOrigin(0.5);
    }

    startRound(index) {
        if (index >= this.guests.length) {
            this.finishGame();
            return;
        }

        this.roundIndex = index;
        this.currentGuest = this.guests[index];
        this.currentProfile = getKidsCampfireRoundProfile(index);
        this.applyHeatProfile(this.currentProfile);
        this.firstTry = true;
        this.isRainbowRound = shouldCreateRainbowMarshmallow(this.combo, this.rainbowOffered);
        if (this.isRainbowRound) this.rainbowOffered = true;

        this.guestImage.setTexture(this.currentGuest.texture).setDisplaySize(225, 225).setAlpha(0);
        const guestTargetScaleX = this.guestImage.scaleX;
        const guestTargetScaleY = this.guestImage.scaleY;
        this.guestImage.setScale(guestTargetScaleX * 0.72, guestTargetScaleY * 0.72);
        this.guestNameText.setText(this.currentGuest.name);
        this.guestSpeechText.setText(this.isRainbowRound
            ? '哇！是彩虹棉花糖！\n烤成金黃色吧！'
            : '我想吃金黃色的\n棉花糖！');
        this.guestGlow.setFillStyle(this.currentGuest.color, 0.2);
        this.tweens.add({
            targets: this.guestImage,
            alpha: 1,
            scaleX: guestTargetScaleX,
            scaleY: guestTargetScaleY,
            duration: 320,
            ease: 'Back.Out'
        });
        this.progressText.setText(`第 ${index + 1} / ${this.guests.length} 位客人`);
        this.startAttempt();
    }

    startAttempt() {
        this.heatProgress = 0;
        this.roundElapsed = 0;
        this.lastHeatState = '';
        this.heatPassIndex = 0;
        this.lastHeatPassIndex = 0;
        this.penalizedHeatPasses = new Set();
        this.lastTimerSecond = null;
        this.inputLocked = false;
        this.smokeText.setAlpha(0).setY(275);
        this.marshmallowContainer
            .setPosition(MARSHMALLOW_POSITION.x, MARSHMALLOW_POSITION.y)
            .setRotation(-0.45)
            .setScale(1)
            .setAlpha(1);
        this.resetMarshmallowAppearance();
        this.feedbackText.setText(this.isRainbowRound
            ? '🌈 特別的彩虹糖粉！\n等指標進入黃色區域'
            : (this.roundIndex === 0
                ? '先看火苗左右走～\n黃色時再點棉花糖！'
                : '火候會左右移動，\n等它進入黃色區域～'));
        this.clickHintText.setText('👆 直接點棉花糖\n把它拿起來！').setColor('#d9f5b9');
        this.comboText.setText(this.combo > 1 ? `✨ Combo ${this.combo}` : '');
        this.updateHeatVisual('raw');
        this.updateTimerVisual(true);
        this.refreshHud();
    }

    tryCollectMarshmallow() {
        if (this.inputLocked || this.finished) return;
        if (this.time.now - this.lastActionAt < 450) return;
        this.lastActionAt = this.time.now;

        const judgement = getCampfireJudgement(this.heatProgress, this.currentZones);
        if (['golden', 'perfect', 'rainbowPerfect'].includes(judgement)) {
            this.handleSuccess(judgement);
        } else if (judgement === 'burnt') {
            this.handleHotTap();
        } else {
            this.handleEarlyTap();
        }
    }

    handleEarlyTap() {
        if (!this.registerHeatPenaltyForCurrentPass()) {
            this.feedbackText.setText('這趟已經提醒過囉～\n等火苗折返再試！').setColor('#dcecff');
            return;
        }
        this.firstTry = false;
        this.earlyCount += 1;
        this.combo = 0;
        this.feedbackText.setText('火還太小～\n等指標走進黃色區！').setColor('#dcecff');
        this.guestSpeechText.setText('再等一下下，它會回來～');
        this.comboText.setText('');
        this.playSfx('mm_wrong', 0.22);
        this.tweens.add({
            targets: this.marshmallowContainer,
            x: MARSHMALLOW_POSITION.x + 8,
            duration: 55,
            yoyo: true,
            repeat: 3,
            onComplete: () => this.marshmallowContainer.setX(MARSHMALLOW_POSITION.x)
        });
        this.refreshHud();
    }

    handleHotTap() {
        if (!this.registerHeatPenaltyForCurrentPass()) {
            this.feedbackText.setText('這趟已經提醒過囉～\n等火苗折返再試！').setColor('#f1d5dc');
            return;
        }
        this.firstTry = false;
        this.hotCount += 1;
        this.combo = 0;
        this.heatStateText.setText('火太旺了！').setColor('#f0ced0');
        this.feedbackText.setText('先別點～\n等指標往回走！').setColor('#f1d5dc');
        this.guestSpeechText.setText('等火小一點再拿起來～');
        this.comboText.setText('');
        this.clickHintText.setText('↩ 等它回到黃色區').setColor('#f1d5dc');
        this.smokeText.setAlpha(0.65).setY(275);
        this.tweens.add({ targets: this.smokeText, y: 235, alpha: 0, duration: 750 });
        this.playSfx('mm_wrong', 0.25);
        this.refreshHud();
    }

    registerHeatPenaltyForCurrentPass() {
        if (this.penalizedHeatPasses.has(this.heatPassIndex)) return false;
        this.penalizedHeatPasses.add(this.heatPassIndex);
        return true;
    }

    handleSuccess(judgement = 'golden') {
        this.inputLocked = true;
        this.completedCount += 1;
        const isPerfect = judgement === 'perfect' || judgement === 'rainbowPerfect';
        const isRainbowPerfect = judgement === 'rainbowPerfect';
        const earnedRainbow = this.isRainbowRound || isRainbowPerfect;

        if (isPerfect) this.perfectCount += 1;
        if (isRainbowPerfect) this.rainbowPerfectCount += 1;
        if (this.firstTry) {
            this.combo += 1;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
        }
        if (earnedRainbow) {
            this.rainbowCount += 1;
            this.rainbowStatusText.setText(`🌈 彩虹：${this.rainbowCount}`);
        }

        const successTitle = isRainbowPerfect
            ? '🌈 彩虹完美！'
            : (isPerfect ? '⭐ Perfect！' : (this.isRainbowRound ? '🌈 彩虹成功！' : '✨ 烤得剛剛好！'));
        this.heatStateText.setText(successTitle).setColor('#fff2a3');
        this.feedbackText.setText(isRainbowPerfect
            ? 'Perfect 驚喜！\n彩虹糖粉閃亮亮！'
            : `${this.currentGuest.name}好開心！\n棉花糖香噴噴！`).setColor('#ffe49a');
        this.guestSpeechText.setText(isRainbowPerfect ? '哇！是秘密彩虹棉花糖！' : '好好吃，謝謝你！');
        this.comboText.setText(this.combo > 1 ? `✨ Combo ${this.combo}` : '');
        this.clickHintText.setText(isRainbowPerfect ? '🌈 隱藏判定！' : '✨ 成功！').setColor('#fff2a3');
        this.setFinishedMarshmallowLook(earnedRainbow, isPerfect);
        if (isRainbowPerfect) {
            this.playRainbowPerfectSfx();
            this.showRainbowPerfectEffect();
        } else {
            this.playSfx('mm_match', 0.48);
        }
        this.addPartyGuest(this.currentGuest, this.roundIndex, true);
        this.spawnCelebration(MARSHMALLOW_POSITION.x, 330, earnedRainbow || isPerfect);
        this.tweens.add({ targets: this.guestImage, y: 284, duration: 150, yoyo: true, repeat: 2 });
        this.tweens.add({ targets: this.marshmallowContainer, scale: 1.22, angle: 8, duration: 180, yoyo: true, repeat: 1 });
        this.refreshHud();

        this.time.delayedCall(isRainbowPerfect ? 1750 : 1350, () => {
            this.guestImage.setY(300);
            this.startRound(this.roundIndex + 1);
        });
    }

    handleTimeout() {
        if (this.inputLocked) return;
        this.inputLocked = true;
        this.firstTry = false;
        this.timeoutCount += 1;
        this.combo = 0;
        this.heatStateText.setText('時間到～').setColor('#e8dbe1');
        this.feedbackText.setText('沒關係！小精靈幫忙\n送上一顆棉花糖～').setColor('#f1d5dc');
        this.guestSpeechText.setText('謝謝小精靈，我們繼續玩！');
        this.comboText.setText('');
        this.clickHintText.setText('⏱ 下一位客人準備中').setColor('#f1d5dc');
        this.smokeText.setAlpha(0.75).setY(275);
        this.tweens.add({ targets: this.smokeText, y: 235, alpha: 0, duration: 900 });
        this.playSfx('mm_wrong', 0.28);
        this.addPartyGuest(this.currentGuest, this.roundIndex, false);
        this.refreshHud();
        this.time.delayedCall(1250, () => this.startRound(this.roundIndex + 1));
    }

    updateHeatVisual(forcedState = null) {
        const state = forcedState || getCampfireHeatState(this.heatProgress, this.currentZones);
        const markerX = HEAT_BAR.left + this.heatProgress * HEAT_BAR.width;
        this.heatMarker.setX(markerX);
        this.heatMarkerGlow.setX(markerX);
        this.heatMarkerLine.setX(markerX);

        const toastProgress = Math.min(1, this.roundElapsed / Math.max(1, this.currentProfile.timeLimit));
        const mixedColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xfff9ea),
            Phaser.Display.Color.ValueToColor(0xefd0a5),
            100,
            Math.round(toastProgress * 100)
        );
        const bodyColor = Phaser.Display.Color.GetColor(mixedColor.r, mixedColor.g, mixedColor.b);
        this.marshmallowCore.setFillStyle(bodyColor, 1);
        this.marshmallowLeft.setFillStyle(bodyColor, 1);
        this.marshmallowRight.setFillStyle(bodyColor, 1);
        this.marshmallowEndCap.setFillStyle(0xeee1ca, 0.72);
        this.toastPatchA.setAlpha(0.04 + toastProgress * 0.40);
        this.toastPatchB.setAlpha(0.02 + toastProgress * 0.32);
        this.toastPatchC.setAlpha(toastProgress * 0.28);
        this.toastSpeckles.forEach((speckle, index) => speckle.setAlpha(Math.max(0, toastProgress - 0.22 - index * 0.06) * 0.55));
        this.rainbowSugar.forEach((sugar) => sugar.setAlpha(this.isRainbowRound ? 0.78 : 0));
        this.marshmallowTopHighlight.setAlpha(state === 'burnt' ? 0.44 : 0.62);
        this.marshmallowBottomShade.setAlpha(state === 'burnt' ? 0.24 : 0.12 + toastProgress * 0.08);

        if (state !== this.lastHeatState) {
            this.lastHeatState = state;
            if (state === 'raw') {
                this.heatStateText.setText('火太小，再等等～').setColor('#edf4ff');
                this.clickHintText.setText('👆 直接點棉花糖\n把它拿起來！').setColor('#d9f5b9');
            } else if (state === 'golden') {
                this.heatStateText.setText('現在！').setColor('#fff179');
                this.feedbackText.setText('火候剛剛好！\n快點棉花糖！').setColor('#fff0a8');
                this.guestSpeechText.setText('就是現在！');
                this.clickHintText.setText('✨ 現在點它！').setColor('#fff179');
                this.tweens.add({ targets: this.marshmallowGlow, alpha: 0.36, scale: 1.2, duration: 260, yoyo: true, repeat: 2 });
                this.tweens.add({ targets: this.perfectZoneGlow, alpha: 0.34, duration: 220, yoyo: true, repeat: 3 });
                this.playSfx('click_sfx', 0.16);
            } else {
                this.heatStateText.setText('火太旺，先別點～').setColor('#f0ced0');
                this.feedbackText.setText('不用急～\n指標還會往回走！').setColor('#f0ced0');
                this.clickHintText.setText('↩ 等它回到黃色區').setColor('#f0ced0');
            }
        }
    }

    showHeatDirectionTurn() {
        this.tweens.killTweensOf([this.heatMarker, this.heatMarkerLine]);
        this.heatMarker.setScale(1);
        this.heatMarkerLine.setScale(1);
        this.tweens.add({
            targets: [this.heatMarker, this.heatMarkerLine],
            scaleY: 1.22,
            duration: 75,
            yoyo: true,
            ease: 'Quad.Out'
        });
    }

    resetMarshmallowAppearance() {
        [this.marshmallowCore, this.marshmallowLeft, this.marshmallowRight].forEach((shape) => shape.setFillStyle(0xfff9ea, 1));
        this.marshmallowEndCap.setFillStyle(0xf2e9d8, 0.72);
        this.marshmallowTopHighlight.setFillStyle(0xffffff, 0.62);
        this.marshmallowBottomShade.setFillStyle(0xd19a65, 0.12);
        [this.toastPatchA, this.toastPatchB, this.toastPatchC, ...this.toastSpeckles].forEach((shape) => shape.setAlpha(0));
        this.rainbowSugar.forEach((sugar) => sugar.setAlpha(this.isRainbowRound ? 0.78 : 0));
        this.marshmallowGlow.setScale(1).setAlpha(0.08).setFillStyle(0xffdb63, 0.08);
    }

    setFinishedMarshmallowLook(rainbow = false, perfect = false) {
        const finishColor = perfect ? 0xe7b66f : 0xedc589;
        [this.marshmallowCore, this.marshmallowLeft, this.marshmallowRight].forEach((shape) => shape.setFillStyle(finishColor, 1));
        this.marshmallowEndCap.setFillStyle(0xd9a766, 0.82);
        this.toastPatchA.setAlpha(0.62);
        this.toastPatchB.setAlpha(0.52);
        this.toastPatchC.setAlpha(0.46);
        this.toastSpeckles.forEach((speckle) => speckle.setAlpha(0.42));
        this.rainbowSugar.forEach((sugar) => sugar.setAlpha(rainbow ? 1 : 0));
    }

    updateTimerVisual(force = false) {
        const millisecondsLeft = Math.max(0, this.currentProfile.timeLimit - this.roundElapsed);
        const secondsLeft = Math.ceil(millisecondsLeft / 1000);
        if (!force && secondsLeft === this.lastTimerSecond) return;
        this.lastTimerSecond = secondsLeft;
        this.timerText.setText(String(secondsLeft));
        const urgent = secondsLeft <= 3;
        this.timerText.setColor(urgent ? '#fff0ef' : '#ffffff');
        this.timerBadge.setFillStyle(urgent ? 0xb84f49 : 0x314b4a, 0.95);
        if (urgent && secondsLeft > 0) {
            this.tweens.add({ targets: [this.timerBadge, this.timerText], scale: 1.12, duration: 130, yoyo: true });
        }
    }

    playRainbowPerfectSfx() {
        this.playSfx('mm_win', 0.34);
        const context = this.sound?.context;
        if (!context?.createOscillator) return;

        try {
            const startAt = context.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                const noteAt = startAt + index * 0.085;
                oscillator.type = index === 3 ? 'triangle' : 'sine';
                oscillator.frequency.setValueAtTime(frequency, noteAt);
                gain.gain.setValueAtTime(0.0001, noteAt);
                gain.gain.exponentialRampToValueAtTime(0.10, noteAt + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteAt + 0.22);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start(noteAt);
                oscillator.stop(noteAt + 0.24);
            });
        } catch (_error) {
            // 音訊尚未解鎖時，保留原有勝利音效即可。
        }
    }

    showRainbowPerfectEffect() {
        const colors = [0xff6f7e, 0xffb84d, 0xffe568, 0x69d986, 0x63cfee, 0xb88af0];
        const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0).setDepth(70);
        this.tweens.add({
            targets: flash,
            alpha: 0.23,
            duration: 100,
            yoyo: true,
            onComplete: () => flash.destroy()
        });

        const rainbow = this.add.graphics()
            .setPosition(MARSHMALLOW_POSITION.x, MARSHMALLOW_POSITION.y + 18)
            .setDepth(71);
        colors.forEach((color, index) => {
            rainbow.lineStyle(5, color, 0.95);
            rainbow.beginPath();
            rainbow.arc(
                0,
                0,
                105 + index * 8,
                Math.PI * 1.08,
                Math.PI * 1.92
            );
            rainbow.strokePath();
        });
        this.tweens.add({
            targets: rainbow,
            scale: 1.28,
            alpha: 0,
            duration: 1050,
            ease: 'Cubic.Out',
            onComplete: () => rainbow.destroy()
        });

        const secretText = this.add.text(785, 292, '🌈 Perfect 驚喜！', {
            fontFamily: FONT,
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#7b4eb3',
            strokeThickness: 7
        }).setOrigin(0.5).setDepth(72);
        this.tweens.add({
            targets: secretText,
            y: 245,
            scale: 1.12,
            alpha: 0,
            duration: 1250,
            ease: 'Cubic.Out',
            onComplete: () => secretText.destroy()
        });

        this.fireOuter.setFillStyle(0xff6f7e, 1);
        this.fireMiddle.setFillStyle(0x63cfee, 1);
        this.fireInner.setFillStyle(0xb88af0, 1);
        this.time.delayedCall(950, () => {
            this.fireOuter.setFillStyle(0xff7a28, 1);
            this.fireMiddle.setFillStyle(0xffc437, 1);
            this.fireInner.setFillStyle(0xfff3a1, 1);
        });
        this.spawnCelebration(MARSHMALLOW_POSITION.x, 350, true);
    }

    addPartyGuest(guest, index, success = true) {
        const image = this.add.image(260 + index * 125, 655, guest.texture).setDisplaySize(64, 64);
        const targetScaleX = image.scaleX;
        const targetScaleY = image.scaleY;
        image.setScale(targetScaleX * 0.2, targetScaleY * 0.2).setAlpha(success ? 1 : 0.58);
        this.partyGuestObjects.push(image);
        this.tweens.add({
            targets: image,
            scaleX: targetScaleX,
            scaleY: targetScaleY,
            duration: 420,
            ease: 'Back.Out'
        });
        if (!success) {
            this.add.text(282 + index * 125, 675, '⏱', { fontSize: '14px' }).setOrigin(0.5);
        }
    }

    refreshHud() {
        const score = calculateCampfireScore({
            earlyCount: this.earlyCount,
            hotCount: this.hotCount,
            timeoutCount: this.timeoutCount
        });
        this.scoreText.setText(`⭐ ${score} 分　✨ 最高 Combo ${this.bestCombo}`);
    }

    finishGame() {
        if (this.finished) return;
        this.finished = true;
        this.inputLocked = true;
        const elapsedSeconds = Math.max(1, Math.round((this.time.now - this.startedAt) / 1000));
        const score = calculateCampfireScore({
            earlyCount: this.earlyCount,
            hotCount: this.hotCount,
            timeoutCount: this.timeoutCount
        });
        const accuracy = calculateCampfireAccuracy({
            completedCount: this.completedCount,
            earlyCount: this.earlyCount,
            hotCount: this.hotCount,
            timeoutCount: this.timeoutCount
        });
        const saved = this.saveProgress({ score, accuracy, elapsedSeconds });
        this.showResult({ score, accuracy, elapsedSeconds, saved });
    }

    saveProgress({ score, accuracy, elapsedSeconds }) {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const oldStats = allStats.campfire || {};
        const oldKidsStats = oldStats.kids || oldStats;
        const fastestSeconds = Number(oldKidsStats.fastestSeconds || 0);
        const kids = {
            ...oldKidsStats,
            playCount: Number(oldKidsStats.playCount || 0) + 1,
            clearCount: Number(oldKidsStats.clearCount || 0) + 1,
            bestScore: Math.max(Number(oldKidsStats.bestScore || 0), score),
            lastScore: score,
            bestAccuracy: Math.max(Number(oldKidsStats.bestAccuracy || 0), accuracy),
            bestCombo: Math.max(Number(oldKidsStats.bestCombo || 0), this.bestCombo),
            perfectClearCount: Number(oldKidsStats.perfectClearCount || 0)
                + (this.earlyCount === 0 && this.hotCount === 0 && this.timeoutCount === 0 ? 1 : 0),
            fastestSeconds: fastestSeconds === 0 ? elapsedSeconds : Math.min(fastestSeconds, elapsedSeconds),
            totalPerfectCount: Number(oldKidsStats.totalPerfectCount || 0) + this.perfectCount,
            rainbowPerfectCount: Number(oldKidsStats.rainbowPerfectCount || 0) + this.rainbowPerfectCount,
            timeoutCount: Number(oldKidsStats.timeoutCount || 0) + this.timeoutCount,
            rainbowMarshmallowCount: Number(oldKidsStats.rainbowMarshmallowCount || 0) + this.rainbowCount,
            rainbowMarshmallowDiscovered: oldKidsStats.rainbowMarshmallowDiscovered === true || this.rainbowCount > 0
        };
        const stats = {
            ...oldStats,
            mode: 'kids',
            kids,
            challenge: oldStats.challenge || {},
            playCount: kids.playCount,
            clearCount: kids.clearCount,
            bestScore: kids.bestScore,
            lastScore: kids.lastScore,
            bestCombo: kids.bestCombo,
            rainbowMarshmallowCount: kids.rainbowMarshmallowCount,
            rainbowPerfectCount: kids.rainbowPerfectCount
        };
        allStats.campfire = stats;
        this.registry.set('minigame_stats', allStats);
        const stageResult = StageManager.applyStageResult(this.registry, this.stageId, score);
        SaveSystem.saveFromRegistry(this.registry);
        return { stats, kids, stageResult };
    }

    showResult({ score, accuracy, elapsedSeconds, saved }) {
        this.add.rectangle(640, 360, 1280, 720, 0x18111f, 0.86).setInteractive().setDepth(80);
        this.add.rectangle(640, 360, 760, 560, 0xfffae7, 1).setStrokeStyle(8, 0xf0b94c, 1).setDepth(81);
        this.add.rectangle(640, 145, 660, 86, 0xe38446, 1).setStrokeStyle(4, 0x9a4b2f, 1).setDepth(82);
        this.add.text(640, 145, '🔥 營火晚會開始囉！', {
            fontFamily: FONT,
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#8a452e',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(83);

        const stars = '★'.repeat(saved.stageResult.stars) + '☆'.repeat(3 - saved.stageResult.stars);
        this.add.text(640, 223, `${stars}　${score} / 100 分`, {
            fontFamily: FONT,
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#6d4e1b'
        }).setOrigin(0.5).setDepth(83);

        const startX = 640 - ((this.guests.length - 1) * 100) / 2;
        this.guests.forEach((guest, index) => {
            this.add.circle(startX + index * 100, 320, 40, guest.color, 0.18).setDepth(82);
            this.add.image(startX + index * 100, 320, guest.texture).setDisplaySize(76, 76).setDepth(83);
        });

        this.add.text(640, 418,
            `火候成功率：${accuracy}%　火太小 ${this.earlyCount}｜火太旺 ${this.hotCount}｜超時 ${this.timeoutCount}\n` +
            `Perfect ${this.perfectCount}｜隱藏彩虹 ${this.rainbowPerfectCount}　最高 Combo ${this.bestCombo}\n` +
            `完成時間：${elapsedSeconds} 秒\n` +
            `🌈 本局彩虹棉花糖：${this.rainbowCount}　　累積：${saved.kids.rainbowMarshmallowCount || 0}\n` +
            `歷史最高：${saved.kids.bestScore} 分`, {
            fontFamily: FONT,
            fontSize: '19px',
            color: '#59665b',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(83);

        const message = this.rainbowPerfectCount > 0
            ? 'Perfect 驚喜觸發！彩虹棉花糖閃亮登場！'
            : (this.rainbowCount > 0
                ? '找到彩虹棉花糖了！晚會變得閃亮亮！'
                : '朋友們都吃到棉花糖了，再挑戰更高 Combo 吧！');
        this.add.text(640, 516, message, {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#8a5b3b'
        }).setOrigin(0.5).setDepth(83);

        this.makeButton(490, 595, 260, 68, '再烤一次', 0x82cf54, 0x4d842e, () => {
            this.scene.restart({
                stageId: this.stageId,
                returnScene: this.returnScene,
                mapID: this.mapID,
                mode: 'kids',
                testMode: this.testMode
            });
        }, 27).setDepth(83);
        const returnText = this.returnScene === 'MiniGameHub' ? '回測試樂園' : '回到地圖';
        this.makeButton(790, 595, 260, 68, returnText, 0xf3bd45, 0x98701d, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 27).setDepth(83);
        this.spawnCelebration(640, 250, this.rainbowCount > 0);
        this.playSfx('mm_win', 0.5);
    }

    spawnCelebration(x, y, rainbow = false) {
        const colors = [0xff6b75, 0xffb64a, 0xffe86c, 0x77db83, 0x67cfea, 0xb786ed];
        for (let index = 0; index < 18; index += 1) {
            const color = rainbow ? colors[index % colors.length] : (index % 2 ? 0xffd95f : 0xff8a54);
            const particle = index % 3 === 0
                ? this.add.text(x, y, '★', { fontSize: '25px', color: `#${color.toString(16).padStart(6, '0')}` }).setOrigin(0.5)
                : this.add.circle(x, y, Phaser.Math.Between(4, 8), color, 1);
            particle.setDepth(90);
            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-250, 250),
                y: y + Phaser.Math.Between(-190, 100),
                alpha: 0,
                scale: 0.25,
                duration: Phaser.Math.Between(700, 1150),
                ease: 'Quad.Out',
                onComplete: () => particle.destroy()
            });
        }
    }

    makeButton(x, y, width, height, label, fill, stroke, onClick, fontSize = 24) {
        const bg = this.add.rectangle(0, 0, width, height, fill, 1).setStrokeStyle(4, stroke, 1);
        const text = this.add.text(0, 0, label, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4d382b',
            strokeThickness: 3
        }).setOrigin(0.5);
        const button = this.add.container(x, y, [bg, text]).setSize(width, height).setInteractive({ useHandCursor: true });
        button.background = bg;
        button.labelText = text;
        button.on('pointerover', () => button.setScale(1.03));
        button.on('pointerout', () => button.setScale(1));
        button.on('pointerdown', () => button.setScale(0.97));
        button.on('pointerup', () => {
            button.setScale(1.03);
            onClick?.();
        });
        return button;
    }

    playSfx(key, volume = 0.4) {
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
    }

    update(time, delta) {
        if (this.finished || this.inputLocked || !this.currentGuest) return;
        this.roundElapsed += delta;
        if (this.roundElapsed >= this.currentProfile.timeLimit) {
            this.roundElapsed = this.currentProfile.timeLimit;
            this.updateTimerVisual();
            this.handleTimeout();
            return;
        }
        this.heatPassIndex = getOscillatingHeatPassIndex(
            this.roundElapsed,
            this.currentProfile.oneWayDuration,
            this.currentProfile.endpointPauseMs
        );
        if (this.heatPassIndex !== this.lastHeatPassIndex) {
            this.lastHeatPassIndex = this.heatPassIndex;
            this.showHeatDirectionTurn();
        }
        this.heatProgress = getOscillatingHeatProgress(
            this.roundElapsed,
            this.currentProfile.oneWayDuration,
            this.currentProfile.endpointPauseMs
        );
        this.updateHeatVisual();
        this.updateTimerVisual();
    }
}
