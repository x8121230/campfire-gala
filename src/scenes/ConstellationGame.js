import AudioSystem from '../systems/AudioSystem.js';
import ConfigManager from '../systems/ConfigManager.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import {
    CONSTELLATION_PATTERNS,
    buildConstellationChallenge,
    calculateConstellationScore,
    getConstellationRounds,
    isCorrectConstellationStep,
    shouldShowConstellationNumber
} from '../data/ConstellationData.js';

const FONT = 'Microsoft JhengHei, Arial';
const RAINBOW_COLORS = [0xff6b7a, 0xffb84d, 0xffe56b, 0x70df86, 0x63cfee, 0xb68cff];

export default class ConstellationGame extends Phaser.Scene {
    constructor() {
        super('ConstellationGame');
    }

    init(data = {}) {
        this.stageId = data.stageId || 'constellation_01';
        this.returnScene = data.returnScene || 'WorldMap';
        this.mapID = data.mapID || data.mapId || '01';
        this.testMode = data.testMode === true;
    }

    create() {
        this.gameConfig = ConfigManager.get('constellation.game', {});
        this.scoreRules = ConfigManager.get('constellation.score', {});
        this.presentationConfig = ConfigManager.get('constellation.presentation', {});
        this.rounds = getConstellationRounds(this.gameConfig.roundCount || 3, Math.random, this.getFriendRecords());
        this.roundIndex = 0;
        this.wrongTaps = 0;
        this.hintsUsed = 0;
        this.completedSteps = 0;
        this.starCombo = 0;
        this.bestStarCombo = 0;
        this.friendsFound = 0;
        this.rainbowStarsFound = 0;
        this.totalSteps = this.rounds.reduce((total, round) => total + round.points.length, 0);
        this.startedAt = this.time.now;
        this.lastActionAt = this.time.now;
        this.lastSelectionAt = -9999;
        this.inputLocked = false;
        this.finished = false;
        this.hintedSteps = new Set();

        this.createBackground();
        this.createHud();
        this.createGuidePanel();
        this.bindPointerInput();
        this.startRound(0);

        if (this.cache.audio.exists('forest_music')) {
            AudioSystem.playBgm(this, 'forest_music', 0.2);
        }

        this.cameras.main.fadeIn(280, 5, 16, 42);
        this.events.once('shutdown', () => this.cleanup());
        this.events.once('destroy', () => this.cleanup());
    }

    createBackground() {
        const colors = [0x07142f, 0x0a1a3e, 0x0c214b, 0x102857, 0x163063, 0x1d376b, 0x25416f, 0x2f4c73];
        colors.forEach((color, index) => {
            this.add.rectangle(640, index * 90 + 45, 1280, 92, color);
        });

        for (let index = 0; index < 65; index += 1) {
            const star = this.add.circle(
                Phaser.Math.Between(20, 1260),
                Phaser.Math.Between(65, 640),
                Phaser.Math.Between(1, 3),
                0xfff7c4,
                Phaser.Math.FloatBetween(0.3, 0.85)
            );
            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: 0.12 },
                duration: Phaser.Math.Between(900, 2100),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1000)
            });
        }

        this.add.circle(1120, 115, 52, 0xfff4b0, 0.92);
        this.add.circle(1145, 96, 51, 0x0b1e46, 1);
        this.add.ellipse(240, 720, 620, 190, 0x183f49, 1);
        this.add.ellipse(720, 735, 900, 230, 0x163945, 1);
        this.add.ellipse(1140, 710, 620, 175, 0x1a4146, 1);

        this.boardPanel = this.add.rectangle(490, 389, 860, 580, 0x071329, 0.64)
            .setStrokeStyle(5, 0x8ec9e8, 0.35);
    }

    createHud() {
        this.add.rectangle(640, 38, 1280, 76, 0x061b32, 0.92);
        const returnLabel = this.returnScene === 'MiniGameHub' ? '← 樂園' : '← 地圖';
        this.makeButton(84, 38, 130, 50, returnLabel, 0xffe9a9, 0x84652a, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 23);

        this.add.text(640, 29, '✨ 星空連線', {
            fontFamily: FONT,
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#fff6bd',
            stroke: '#27335e',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.roundText = this.add.text(640, 57, '', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#c8e9ff'
        }).setOrigin(0.5);

        this.encyclopediaButton = this.makeButton(1165, 38, 170, 50, `📖 圖鑑 0/${CONSTELLATION_PATTERNS.length}`, 0x826cc1, 0x4d3a82, () => {
            this.showEncyclopedia();
        }, 18);
        this.refreshEncyclopediaButton();
    }

    createGuidePanel() {
        this.add.rectangle(1092, 389, 320, 580, 0xfff9e8, 0.96)
            .setStrokeStyle(6, 0xf4ce67, 1);

        this.guidePanelTitle = this.add.text(1092, 118, '星光任務', {
            fontFamily: FONT,
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#5e4c23'
        }).setOrigin(0.5);

        const mascotGlow = this.add.circle(1015, 171, 37, 0xffdf68, 0.23);
        this.tweens.add({ targets: mascotGlow, scale: 1.13, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
        this.add.star(1015, 171, 5, 19, 35, 0xffdb59, 1).setStrokeStyle(3, 0xd89c2d, 1);
        this.add.circle(1005, 167, 3, 0x5c4930, 1);
        this.add.circle(1025, 167, 3, 0x5c4930, 1);
        const smile = this.add.graphics().lineStyle(3, 0x5c4930, 1);
        smile.beginPath();
        smile.arc(1015, 174, 9, 0.15, Math.PI - 0.15, false);
        smile.strokePath();

        this.guideText = this.add.text(1128, 171, '', {
            fontFamily: FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#3f5471',
            align: 'center',
            lineSpacing: 5,
            wordWrap: { width: 205 }
        }).setOrigin(0.5);

        this.friendCardBg = this.add.rectangle(1092, 320, 252, 224, 0xf2ecff, 0.9)
            .setStrokeStyle(4, 0xb49bdd, 0.9)
            .setDepth(10);

        this.challengeTitleText = this.add.text(1092, 236, '', {
            fontFamily: FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#654c85'
        }).setOrigin(0.5).setDepth(12);

        this.friendNameText = this.add.text(1092, 412, '', {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#5e467d'
        }).setOrigin(0.5).setDepth(12);

        this.targetText = this.add.text(1092, 399, '', {
            fontFamily: FONT,
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#8b5b13',
            align: 'center',
            wordWrap: { width: 224 }
        }).setOrigin(0.5).setDepth(12);

        this.targetTokenContainer = this.add.container(1092, 320).setVisible(false).setDepth(12);

        this.scoreText = this.add.text(1092, 466, '', {
            fontFamily: FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#435c5c',
            align: 'center'
        }).setOrigin(0.5);

        this.detailText = this.add.text(1092, 496, '', {
            fontFamily: FONT,
            fontSize: '16px',
            color: '#687879',
            align: 'center'
        }).setOrigin(0.5);

        this.hintButton = this.makeButton(1092, 558, 246, 58, '✨ 請小精靈提示', 0x9470d9, 0x573994, () => {
            this.showHint(true);
        }, 20);

        this.nextButton = this.makeButton(1092, 558, 246, 58, '下一個星座 →', 0x80cf57, 0x477f2a, () => {
            this.startRound(this.roundIndex + 1);
        }, 20).setVisible(false);

        this.footerHintText = this.add.text(1092, 625, '看星光密碼找路・點錯不會失敗', {
            fontFamily: FONT,
            fontSize: '14px',
            color: '#648086',
            align: 'center',
            wordWrap: { width: 278 }
        }).setOrigin(0.5);
    }

    makeButton(x, y, width, height, label, fill, stroke, onClick, fontSize = 24) {
        const bg = this.add.rectangle(0, 0, width, height, fill, 1)
            .setStrokeStyle(4, stroke, 1);
        const text = this.add.text(0, 0, label, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4a402d',
            strokeThickness: 3
        }).setOrigin(0.5);
        const button = this.add.container(x, y, [bg, text]).setSize(width, height).setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setScale(1.03));
        button.on('pointerout', () => button.setScale(1));
        button.on('pointerdown', () => button.setScale(0.97));
        button.on('pointerup', () => {
            button.setScale(1.03);
            onClick?.();
        });
        return button;
    }

    startRound(index) {
        if (this.finished || index >= this.rounds.length) {
            this.finishGame();
            return;
        }

        this.stopHintSpark();
        this.roundObjects?.forEach((object) => {
            this.tweens.killTweensOf(object);
            object?.destroy?.();
        });
        this.roundIndex = index;
        this.currentRound = this.rounds[index];
        this.currentStep = 0;
        this.currentChallenge = null;
        this.inputLocked = false;
        this.lastActionAt = this.time.now;
        this.nextButton.setVisible(false);
        this.hintButton.setVisible(true);
        this.roundObjects = [];
        this.starNodes = [];
        this.decoyNodes = [];
        this.activeDecoyNodes = [];
        this.roundWrongStreak = 0;
        this.hintSparkObjects = new Set();
        this.friendActionPlaying = false;
        this.boardFriendSprite = null;
        this.connectionSegments = [];
        this.roundRainbowCollected = false;
        this.rainbowMode = false;
        const rainbowChance = Phaser.Math.Clamp(Number(this.presentationConfig.rainbowChancePercent || 0), 0, 100);
        this.rainbowStepIndex = Math.random() * 100 < rainbowChance
            ? Phaser.Math.Between(0, this.currentRound.points.length - 1)
            : -1;

        this.createRoundTheme(this.currentRound.theme);
        this.branchGraphics = this.add.graphics().setDepth(2);
        this.lineGraphics = this.add.graphics().setDepth(3);
        this.previewGraphics = this.add.graphics().setDepth(3);
        this.roundObjects.push(this.branchGraphics, this.lineGraphics, this.previewGraphics);

        this.comboText = this.add.text(850, 130, '', {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#fff3a8',
            stroke: '#34436f',
            strokeThickness: 4
        }).setOrigin(1, 0.5).setDepth(5);
        this.roundObjects.push(this.comboText);

        this.friendSprite = this.add.image(1092, 314, this.currentRound.friendTexture)
            .setDisplaySize(178, 178)
            .setTint(0x58556f)
            .setAlpha(0.07)
            .setDepth(11);
        this.roundObjects.push(this.friendSprite);

        this.roundText.setText(`找回第 ${index + 1} / ${this.rounds.length} 位星星朋友`);
        this.guideText.setText(`幫我找回\n${this.currentRound.name.replace('星座', '')}朋友！`);
        this.challengeTitleText.setVisible(true).setText('🌟 找第一顆星');
        this.friendNameText.setVisible(false).setText('');
        this.targetText.setVisible(true);
        this.targetTokenContainer.removeAll(true).setVisible(false);
        this.footerHintText.setText('看星光密碼選路・提示才會顯示金色路線');
        this.friendCardBg.setFillStyle(this.getThemePalette(this.currentRound.theme).card, 0.92);
        this.friendCardBg.setStrokeStyle(4, this.currentRound.color, 0.85);
        this.createRoundStars();
        this.updateGuide();
        this.updateScorePreview();

        this.cameras.main.flash(180, 116, 174, 255, false);
    }

    getThemePalette(theme) {
        if (theme === 'ocean') return { sky: 0x062d50, accent: 0x58cce9, card: 0xe4f9ff };
        if (theme === 'moon_meadow') return { sky: 0x251a52, accent: 0xf1a8d7, card: 0xffeefa };
        if (theme === 'golden_grove') return { sky: 0x30213c, accent: 0xffbd67, card: 0xfff1dc };
        if (theme === 'aurora_hill') return { sky: 0x0b3a46, accent: 0x9fe3b1, card: 0xe9fff0 };
        if (theme === 'acorn_night') return { sky: 0x34203b, accent: 0xff9c66, card: 0xffeee7 };
        return { sky: 0x082a31, accent: 0xf4ce62, card: 0xfff5d8 };
    }

    createRoundTheme(theme) {
        const palette = this.getThemePalette(theme);
        const addRound = (object) => {
            this.roundObjects.push(object);
            return object;
        };

        addRound(this.add.rectangle(490, 389, 850, 570, palette.sky, 0.96)
            .setStrokeStyle(5, palette.accent, 0.45));

        if (theme === 'ocean') {
            addRound(this.add.circle(775, 188, 54, 0xd8f8ff, 0.18));
            [585, 620, 652].forEach((y, index) => {
                addRound(this.add.ellipse(490 + index * 28, y, 930, 105, index % 2 ? 0x1979a3 : 0x145d87, 0.4));
            });
            for (let index = 0; index < 13; index += 1) {
                const bubble = addRound(this.add.circle(
                    Phaser.Math.Between(95, 885),
                    Phaser.Math.Between(150, 610),
                    Phaser.Math.Between(3, 9),
                    0xc9f4ff,
                    Phaser.Math.FloatBetween(0.18, 0.48)
                ));
                this.tweens.add({
                    targets: bubble,
                    y: bubble.y - Phaser.Math.Between(14, 34),
                    alpha: { from: bubble.alpha, to: 0.08 },
                    duration: Phaser.Math.Between(1100, 2200),
                    yoyo: true,
                    repeat: -1
                });
            }
            const coral = addRound(this.add.graphics().lineStyle(11, 0x39a78d, 0.55));
            [130, 170, 830, 865].forEach((x, index) => {
                coral.beginPath();
                coral.moveTo(x, 660);
                coral.lineTo(x + (index < 2 ? 18 : -18), 590);
                coral.strokePath();
            });
        } else if (theme === 'moon_meadow') {
            addRound(this.add.circle(765, 192, 69, 0xffefaa, 0.82));
            addRound(this.add.circle(792, 175, 63, palette.sky, 0.96));
            [
                [210, 210, 150, 42],
                [690, 565, 180, 48],
                [350, 600, 220, 52]
            ].forEach(([x, y, width, height]) => {
                const cloud = addRound(this.add.ellipse(x, y, width, height, 0xf6eaff, 0.16));
                this.tweens.add({ targets: cloud, x: x + 20, duration: 2600, yoyo: true, repeat: -1 });
            });
            addRound(this.add.ellipse(490, 685, 930, 245, 0x315a48, 0.9));
            addRound(this.add.ellipse(490, 710, 940, 210, 0x224a3c, 1));
            for (let index = 0; index < 15; index += 1) {
                addRound(this.add.circle(
                    Phaser.Math.Between(90, 890),
                    Phaser.Math.Between(610, 655),
                    4,
                    index % 2 ? 0xf6b5d8 : 0xffe47c,
                    0.75
                ));
            }
        } else {
            addRound(this.add.circle(765, 188, 62, 0xffe993, 0.22));
            const forest = addRound(this.add.graphics());
            forest.fillStyle(0x173e3d, 0.92);
            [125, 185, 805, 860].forEach((x, index) => {
                forest.fillRoundedRect(x, 350 + (index % 2) * 30, 38, 315, 18);
                forest.fillCircle(x + 15, 325 + (index % 2) * 30, 90);
                forest.fillCircle(x + 55, 350 + (index % 2) * 30, 75);
            });
            forest.fillStyle(0x102e34, 1).fillEllipse(490, 690, 930, 230);
            for (let index = 0; index < 16; index += 1) {
                const firefly = addRound(this.add.circle(
                    Phaser.Math.Between(100, 885),
                    Phaser.Math.Between(170, 610),
                    Phaser.Math.Between(2, 5),
                    0xffe36d,
                    Phaser.Math.FloatBetween(0.25, 0.75)
                ));
                this.tweens.add({
                    targets: firefly,
                    alpha: 0.08,
                    scale: 1.7,
                    duration: Phaser.Math.Between(700, 1500),
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    createRoundStars() {
        this.currentRound.points.forEach((point, index) => {
            const group = this.add.container(point.x + 60, point.y + 60).setDepth(4);
            const glow = this.add.circle(0, 0, 48, this.currentRound.color, 0.14);
            const star = this.add.star(0, 0, 5, 17, 34, 0xfff2a6, 1)
                .setStrokeStyle(4, 0xe2a73c, 1);
            const number = this.add.text(0, 1, shouldShowConstellationNumber(this.currentRound, index) ? String(index + 1) : '', {
                fontFamily: FONT,
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#655022'
            }).setOrigin(0.5);
            const hit = this.add.circle(0, 0, this.gameConfig.snapRadius || 76, 0xffffff, 0.001)
                .setInteractive({ useHandCursor: true });
            const codeText = this.add.text(0, 1, '', {
                fontFamily: FONT,
                fontSize: '27px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#44385d',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);

            group.add([glow, star, number, hit, codeText]);
            group.glow = glow;
            group.star = star;
            group.number = number;
            group.codeText = codeText;
            group.completed = false;
            group.pointIndex = index;
            group.isRainbow = index === this.rainbowStepIndex;
            if (group.isRainbow) {
                const rainbowRing = this.add.circle(0, 0, 42, 0xffffff, 0)
                    .setStrokeStyle(6, RAINBOW_COLORS[0], 0.85);
                group.addAt(rainbowRing, 1);
                group.rainbowRing = rainbowRing;
                this.tweens.add({
                    targets: rainbowRing,
                    angle: 360,
                    scale: { from: 0.88, to: 1.18 },
                    alpha: { from: 0.4, to: 1 },
                    duration: 900,
                    yoyo: true,
                    repeat: -1
                });
            }
            hit.on('pointerdown', (pointer) => {
                pointer.event?.stopPropagation?.();
                this.trySelectStar(index);
            });
            hit.on('pointerover', () => {
                if (!group.completed) glow.setAlpha(0.3);
            });
            hit.on('pointerout', () => {
                if (!group.completed && index !== this.currentStep) glow.setAlpha(0.14);
            });

            this.starNodes.push(group);
            this.roundObjects.push(group);
        });
        this.createDecoyStars();
        this.refreshCandidateBranches();
        this.pulseExpectedStar();
    }

    createDecoyStars() {
        (this.currentRound.decoys || []).forEach((point, index) => {
            const group = this.add.container(point.x + 60, point.y + 60).setDepth(4);
            const glow = this.add.circle(0, 0, 46, this.currentRound.color, 0.1);
            const star = this.add.star(0, 0, 5, 17, 33, 0xfff2a6, 0.96)
                .setStrokeStyle(4, 0xd7a64b, 0.94);
            const hit = this.add.circle(0, 0, this.gameConfig.snapRadius || 76, 0xffffff, 0.001)
                .setInteractive({ useHandCursor: true });
            const codeText = this.add.text(0, 1, '', {
                fontFamily: FONT,
                fontSize: '27px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#44385d',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);

            group.add([glow, star, hit, codeText]);
            group.glow = glow;
            group.star = star;
            group.codeText = codeText;
            group.decoyIndex = index;
            group.isDecoy = true;
            group.setVisible(false);
            hit.on('pointerdown', (pointer) => {
                pointer.event?.stopPropagation?.();
                this.trySelectDecoy(group);
            });
            hit.on('pointerover', () => glow.setAlpha(0.27));
            hit.on('pointerout', () => glow.setAlpha(0.1));

            this.decoyNodes.push(group);
            this.roundObjects.push(group);
        });
    }

    bindPointerInput() {
        this.pointerMoveHandler = (pointer) => {
            if (!pointer.isDown || this.inputLocked || !this.currentRound) return;
            const expected = this.starNodes[this.currentStep];
            if (!expected) return;

            const start = this.currentStep > 0 ? this.starNodes[this.currentStep - 1] : null;
            if (start) {
                this.previewGraphics.clear().lineStyle(7, 0xffffff, 0.28);
                this.previewGraphics.lineBetween(start.x, start.y, pointer.worldX, pointer.worldY);
            }

            const candidates = [expected, ...this.activeDecoyNodes];
            const nearest = candidates
                .map((node) => ({
                    node,
                    distance: Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, node.x, node.y)
                }))
                .sort((a, b) => a.distance - b.distance)[0];
            if (!nearest || nearest.distance > (this.gameConfig.snapRadius || 76)) return;
            if (nearest.node.isDecoy) this.trySelectDecoy(nearest.node);
            else this.trySelectStar(this.currentStep);
        };
        this.pointerUpHandler = () => this.previewGraphics?.clear?.();
        this.input.on('pointermove', this.pointerMoveHandler);
        this.input.on('pointerup', this.pointerUpHandler);
    }

    trySelectStar(index) {
        if (this.inputLocked || !this.currentRound) return;
        if (this.time.now - this.lastSelectionAt < 240) return;
        this.lastSelectionAt = this.time.now;
        this.lastActionAt = this.time.now;

        if (!isCorrectConstellationStep(index, this.currentStep)) {
            const wrongNode = this.starNodes[index];
            if (wrongNode?.completed) return;
            this.handleWrongBranch(wrongNode);
            return;
        }

        const node = this.starNodes[index];
        const stepKey = `${this.roundIndex}:${this.currentStep}`;
        const usedHintForStep = this.hintedSteps.has(stepKey);
        node.completed = true;
        this.tweens.killTweensOf(node.glow);
        node.glow.setFillStyle(this.currentRound.color, 0.48);
        node.star.setAlpha(1).setFillStyle(0xffffff, 1);
        node.number.setColor('#7b5915');
        node.codeText?.setText('');
        this.tweens.killTweensOf(node.codeText);
        node.codeText?.setScale(1);
        this.tweens.add({ targets: node, scale: { from: 1.25, to: 1 }, duration: 230, ease: 'Back.easeOut' });
        this.addSparkles(node.x, node.y, this.currentRound.color);
        this.playSfx('mm_match', 0.36);

        this.currentStep += 1;
        this.completedSteps += 1;
        this.starCombo = usedHintForStep ? 0 : this.starCombo + 1;
        this.bestStarCombo = Math.max(this.bestStarCombo, this.starCombo);
        this.roundWrongStreak = 0;
        if (node.isRainbow) this.activateRainbowStar(node);
        this.previewGraphics.clear();
        this.branchGraphics.clear();
        this.activeDecoyNodes.forEach((decoy) => decoy.setVisible(false));
        this.activeDecoyNodes = [];
        this.animateLastConnection();
        this.playStarTone(this.starCombo - 1);
        if (usedHintForStep) this.comboText.setText('');
        else this.updateComboFeedback(node);

        if (this.currentStep >= this.currentRound.points.length) {
            this.completeRound();
        } else {
            this.guideText.setText('連得很好！\n看密碼找下一條路');
            this.refreshCandidateBranches();
            this.updateGuide();
            this.updateScorePreview();
        }
    }

    trySelectDecoy(node) {
        if (this.inputLocked || !node?.visible) return;
        if (this.time.now - this.lastSelectionAt < 240) return;
        this.lastSelectionAt = this.time.now;
        this.lastActionAt = this.time.now;
        this.handleWrongBranch(node);
    }

    handleWrongBranch(wrongNode) {
        if (!wrongNode) return;
        this.wrongTaps += 1;
        this.roundWrongStreak += 1;
        this.starCombo = 0;
        this.comboText.setText('');
        this.playSfx('mm_wrong', 0.28);
        this.showWrongBranch(wrongNode);
        this.shakeChallengePrompt();
        this.guideText.setText('這條路繞遠了～\n換一條星光路看看！');
        this.updateScorePreview();

        const hintAfter = Phaser.Math.Clamp(Number(this.gameConfig.branchHintMistakes || 2), 1, 4);
        if (this.roundWrongStreak >= hintAfter) {
            this.roundWrongStreak = 0;
            this.time.delayedCall(260, () => this.showHint(false));
        }
    }

    showWrongBranch(wrongNode) {
        const source = this.currentStep > 0 ? this.starNodes[this.currentStep - 1] : null;
        const wrongLine = this.add.graphics().setDepth(6);
        if (source) {
            wrongLine.lineStyle(8, 0xa99abf, 0.85);
            wrongLine.lineBetween(source.x, source.y, wrongNode.x, wrongNode.y);
        }
        this.tweens.add({
            targets: wrongLine,
            alpha: 0,
            duration: 520,
            onComplete: () => wrongLine.destroy()
        });
        this.tweens.add({ targets: wrongNode, x: wrongNode.x + 7, duration: 55, yoyo: true, repeat: 2 });
        this.addFadingStarDust(wrongNode.x, wrongNode.y);
    }

    addFadingStarDust(x, y) {
        for (let index = 0; index < 8; index += 1) {
            const dust = this.add.star(x, y, 4, 2, 6, 0xcbbce2, 0.82).setDepth(7);
            const angle = (Math.PI * 2 * index) / 8;
            this.tweens.add({
                targets: dust,
                x: x + Math.cos(angle) * Phaser.Math.Between(25, 58),
                y: y + Math.sin(angle) * Phaser.Math.Between(25, 58),
                alpha: 0,
                scale: 0.25,
                duration: 480,
                onComplete: () => dust.destroy()
            });
        }
    }

    refreshCandidateBranches() {
        this.branchGraphics.clear();
        [...this.starNodes, ...this.decoyNodes].forEach((node) => {
            this.tweens.killTweensOf(node.codeText);
            node.codeText?.setScale(1);
            node.codeText?.setText('');
            if (!node.completed) node.star?.setAlpha(1);
        });
        this.decoyNodes.forEach((node) => node.setVisible(false));
        this.activeDecoyNodes = [];
        this.currentChallenge = null;
        if (this.currentStep <= 0 || this.currentStep >= this.starNodes.length) {
            this.targetTokenContainer.removeAll(true).setVisible(false);
            return;
        }

        const source = this.starNodes[this.currentStep - 1];
        const expected = this.starNodes[this.currentStep];
        const decoyCount = Math.max(0, Number(this.currentRound.branchDecoyCount || 0));
        this.activeDecoyNodes = this.decoyNodes.slice(0, decoyCount);
        this.activeDecoyNodes.forEach((node) => node.setVisible(true).setAlpha(1));

        this.branchGraphics.lineStyle(5, 0xc9e6ff, 0.3);
        [expected, ...this.activeDecoyNodes].forEach((target) => {
            this.drawDashedBranch(this.branchGraphics, source.x, source.y, target.x, target.y);
        });
        this.currentChallenge = buildConstellationChallenge(this.currentRound, this.currentStep);
        const candidates = [expected, ...this.activeDecoyNodes];
        candidates.forEach((node, index) => this.applyChallengeToken(node, this.currentChallenge.candidateTokens[index]));
        this.startCandidateBreathing(candidates);
        this.renderChallengePrompt();
    }

    colorToCss(colorValue = 0xffffff) {
        return `#${Math.max(0, Number(colorValue) || 0).toString(16).padStart(6, '0').slice(-6)}`;
    }

    getTokenVisual(token = {}) {
        if (token.question) return { text: '?', color: '#7d6c91', fontSize: 28 };
        const count = Phaser.Math.Clamp(Number(token.count || 1), 1, 3);
        const text = String(token.shape?.glyph || '●').repeat(count);
        const sizeScale = Number(token.size?.scale || 1);
        const baseSize = count > 1 ? 17 : 29;
        return {
            text,
            color: this.colorToCss(token.color?.value),
            fontSize: Math.round(baseSize * sizeScale)
        };
    }

    applyChallengeToken(node, token) {
        if (!node?.codeText || !token) return;
        const visual = this.getTokenVisual(token);
        // 大小題的彩色星星就是答案本體；淡化固定大小的金色外框，避免視覺誤導。
        node.star.setAlpha(token.size ? 0.06 : 0.32);
        node.number?.setText('');
        node.codeText
            .setText(visual.text)
            .setColor(visual.color)
            .setFontSize(visual.fontSize)
            .setStroke('#44385d', Math.max(2, Math.round(visual.fontSize * 0.1)))
            .setScale(1)
            .setVisible(true);
    }

    getChallengeTitle(kind = '') {
        const titles = {
            color: '🎨 顏色密碼',
            shape: '🔷 圖形密碼',
            color_shape: '🎨🔷 雙重密碼',
            count: '🔢 數量密碼',
            size: '↕️ 大小密碼',
            pattern: '🔁 規律密碼'
        };
        return titles[kind] || '✨ 星光密碼';
    }

    renderFirstStarPrompt() {
        this.challengeTitleText.setVisible(true).setText('🌟 找第一顆星');
        this.friendNameText.setVisible(false);
        this.targetText.setVisible(true).setText('先找正在閃亮的星星');
        this.tweens.killTweensOf(this.targetTokenContainer);
        this.targetTokenContainer.setPosition(1092, 320).setScale(1).removeAll(true).setVisible(true);
        const glow = this.add.circle(0, 0, 43, 0xffdf68, 0.2);
        const star = this.add.star(0, 0, 5, 19, 38, 0xffffff, 1)
            .setStrokeStyle(4, 0xe2a73c, 1);
        this.targetTokenContainer.add([glow, star]);
    }

    renderChallengePrompt() {
        if (!this.currentChallenge) return;
        this.challengeTitleText.setVisible(true).setText(this.getChallengeTitle(this.currentChallenge.kind));
        this.friendNameText.setVisible(false);
        this.targetText.setVisible(true).setText(this.currentChallenge.instruction);
        this.tweens.killTweensOf(this.targetTokenContainer);
        this.targetTokenContainer.setPosition(1092, 320).setScale(1).removeAll(true).setVisible(true);
        const tokens = this.currentChallenge.targetTokens || [];
        const spacing = tokens.length > 1 ? 52 : 0;
        const startX = -((tokens.length - 1) * spacing) / 2;
        tokens.forEach((token, index) => {
            const visual = this.getTokenVisual(token);
            const compact = tokens.length > 1;
            const promptFontSize = Math.round(visual.fontSize * (compact ? 1.1 : 1.45));
            const tokenWidth = compact ? 44 : (Number(token.count || 1) > 1 ? 100 : 72);
            const tokenHeight = compact ? 44 : 72;
            const glow = this.add.rectangle(startX + index * spacing, 0, tokenWidth, tokenHeight, 0xffffff, 0.78)
                .setStrokeStyle(2, 0xd8c8ee, 0.9);
            const label = this.add.text(startX + index * spacing, 0, visual.text, {
                fontFamily: FONT,
                fontSize: `${promptFontSize}px`,
                fontStyle: 'bold',
                color: visual.color,
                stroke: '#ffffff',
                strokeThickness: Math.max(2, Math.round(promptFontSize * 0.08))
            }).setOrigin(0.5);
            this.targetTokenContainer.add([glow, label]);
        });
    }

    startCandidateBreathing(candidates = []) {
        candidates.forEach((node) => {
            if (!node?.codeText) return;
            this.tweens.killTweensOf(node.codeText);
            node.codeText.setScale(1);
            this.tweens.add({
                targets: node.codeText,
                scale: { from: 0.96, to: 1.08 },
                duration: 720,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    pulseChallengePrompt() {
        if (!this.targetTokenContainer?.visible) return;
        this.tweens.killTweensOf(this.targetTokenContainer);
        this.targetTokenContainer.setScale(1);
        this.tweens.add({
            targets: this.targetTokenContainer,
            scale: { from: 1, to: 1.18 },
            duration: 260,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
    }

    shakeChallengePrompt() {
        if (!this.targetTokenContainer?.visible || !this.currentRound) return;
        this.tweens.killTweensOf(this.targetTokenContainer);
        this.targetTokenContainer.setPosition(1092, 320).setScale(1);
        this.friendCardBg.setStrokeStyle(5, 0xe56778, 1);
        this.tweens.add({
            targets: this.targetTokenContainer,
            x: { from: 1085, to: 1099 },
            duration: 55,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.targetTokenContainer.setX(1092);
                if (this.currentRound) this.friendCardBg.setStrokeStyle(4, this.currentRound.color, 0.85);
            }
        });
    }

    drawDashedBranch(graphics, startX, startY, endX, endY) {
        const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const dashLength = 13;
        const gapLength = 9;
        const segmentLength = dashLength + gapLength;
        const dx = (endX - startX) / Math.max(1, distance);
        const dy = (endY - startY) / Math.max(1, distance);
        for (let offset = 0; offset < distance; offset += segmentLength) {
            const visibleEnd = Math.min(distance, offset + dashLength);
            graphics.lineBetween(
                startX + dx * offset,
                startY + dy * offset,
                startX + dx * visibleEnd,
                startY + dy * visibleEnd
            );
        }
    }

    playHintSpark(strong = false) {
        if (this.inputLocked || this.currentStep <= 0 || this.currentStep >= this.starNodes.length) return;
        const source = this.starNodes[this.currentStep - 1];
        const expected = this.starNodes[this.currentStep];
        if (!source?.active || !expected?.active || expected.completed) return;

        const glow = this.add.circle(0, 0, strong ? 19 : 14, 0xffec72, strong ? 0.55 : 0.34);
        const spark = this.add.star(0, 0, 5, strong ? 6 : 4, strong ? 13 : 10, 0xfff7ae, 1)
            .setStrokeStyle(strong ? 3 : 2, 0xf2b942, 1);
        const guide = this.add.container(source.x, source.y, [glow, spark]).setDepth(7);
        guide.setScale(strong ? 1.18 : 0.92);
        this.hintSparkObjects ??= new Set();
        this.hintSparkObjects.add(guide);

        this.tweens.add({
            targets: glow,
            scale: { from: 0.7, to: 1.35 },
            alpha: { from: glow.alpha, to: 0.12 },
            duration: 280,
            yoyo: true,
            repeat: -1
        });

        const durationMs = 660;
        const stepAtStart = this.currentStep;
        this.tweens.add({
            targets: guide,
            x: expected.x,
            y: expected.y,
            angle: 180,
            duration: strong ? Math.max(500, durationMs - 120) : durationMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.hintSparkObjects?.delete(guide);
                this.tweens.killTweensOf(glow);
                guide.destroy();
                if (this.inputLocked || this.currentStep !== stepAtStart || expected.completed) return;
                this.tweens.killTweensOf(expected.glow);
                this.tweens.add({
                    targets: expected.glow,
                    scale: { from: 0.9, to: strong ? 1.34 : 1.18 },
                    alpha: { from: strong ? 0.42 : 0.28, to: 0.12 },
                    duration: strong ? 420 : 300,
                    yoyo: true
                });
            }
        });
    }

    stopHintSpark() {
        this.hintSparkObjects?.forEach((object) => {
            this.tweens?.killTweensOf?.(object);
            object?.list?.forEach?.((child) => this.tweens?.killTweensOf?.(child));
            object?.destroy?.();
        });
        this.hintSparkObjects?.clear?.();
    }

    showCorrectBranchHint() {
        if (this.currentStep <= 0 || this.currentStep >= this.starNodes.length) return;
        const source = this.starNodes[this.currentStep - 1];
        const expected = this.starNodes[this.currentStep];
        const hintLine = this.add.graphics().setDepth(6);
        hintLine.lineStyle(9, 0xffed81, 0.88);
        this.drawDashedBranch(hintLine, source.x, source.y, expected.x, expected.y);
        this.playHintSpark(true);
        this.tweens.add({
            targets: hintLine,
            alpha: 0,
            delay: 450,
            duration: 550,
            onComplete: () => hintLine.destroy()
        });
    }

    animateLastConnection() {
        if (this.currentStep < 2) return;
        const previous = this.starNodes[this.currentStep - 2];
        const current = this.starNodes[this.currentStep - 1];
        const segment = this.add.graphics().setPosition(previous.x, previous.y).setDepth(3);
        segment.endDx = current.x - previous.x;
        segment.endDy = current.y - previous.y;
        segment.connectionIndex = this.connectionSegments.length;
        this.drawConnectionSegment(segment);
        segment.setScale(0.02, 1);
        this.roundObjects.push(segment);
        this.connectionSegments.push(segment);
        this.tweens.add({
            targets: segment,
            scaleX: 1,
            duration: 260,
            ease: 'Sine.easeOut'
        });
    }

    drawConnectionSegment(segment) {
        const color = this.rainbowMode
            ? RAINBOW_COLORS[segment.connectionIndex % RAINBOW_COLORS.length]
            : this.currentRound.color;
        segment.clear().lineStyle(9, color, 0.94);
        segment.lineBetween(0, 0, segment.endDx, segment.endDy);
    }

    activateRainbowStar(node) {
        if (this.roundRainbowCollected) return;
        this.roundRainbowCollected = true;
        this.rainbowMode = true;
        this.rainbowStarsFound += 1;
        node.star.setFillStyle(0xfff1a8, 1);
        node.rainbowRing?.setStrokeStyle?.(7, 0xff7cc7, 1);
        this.connectionSegments.forEach((segment) => this.drawConnectionSegment(segment));
        RAINBOW_COLORS.forEach((color, index) => {
            this.time.delayedCall(index * 45, () => this.addSparkles(node.x, node.y, color, 5));
        });
        const label = this.add.text(node.x, node.y - 66, '🌈 彩虹星！', {
            fontFamily: FONT,
            fontSize: '25px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#7f4c98',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(9);
        this.tweens.add({
            targets: label,
            y: label.y - 28,
            alpha: 0,
            duration: 1050,
            ease: 'Back.easeOut',
            onComplete: () => label.destroy()
        });
        this.playStarTone(this.starCombo + 4, true);
    }

    updateComboFeedback(node) {
        this.comboText.setText(`✨ 星光連擊 ${this.starCombo}`);
        this.tweens.killTweensOf(this.comboText);
        this.comboText.setScale(1.18);
        this.tweens.add({ targets: this.comboText, scale: 1, duration: 220, ease: 'Back.easeOut' });

        const burstEvery = Phaser.Math.Clamp(Number(this.presentationConfig.comboBurstEvery || 3), 2, 6);
        if (this.starCombo % burstEvery !== 0) return;

        this.addSparkles(node.x, node.y, 0xffef89, 16);
        const burst = this.add.text(490, 145, `亮晶晶！ × ${this.starCombo}`, {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#fff5a8',
            stroke: '#684e99',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(8).setScale(0.65);
        this.tweens.add({
            targets: burst,
            y: 122,
            scale: 1.12,
            alpha: { from: 1, to: 0 },
            duration: 850,
            ease: 'Back.easeOut',
            onComplete: () => burst.destroy()
        });
    }

    pulseExpectedStar() {
        const expected = this.starNodes[this.currentStep];
        if (!expected) return;
        expected.glow.setAlpha(0.34);
        this.tweens.killTweensOf(expected.glow);
        this.tweens.add({
            targets: expected.glow,
            scale: { from: 0.85, to: 1.3 },
            alpha: { from: 0.35, to: 0.12 },
            duration: 650,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                if (!expected.completed && expected === this.starNodes[this.currentStep]) expected.glow.setAlpha(0.34);
            }
        });
    }

    showHint(countUsage = false) {
        if (this.inputLocked || !this.currentRound) return;
        if (countUsage) this.hintsUsed += 1;
        this.hintedSteps.add(`${this.roundIndex}:${this.currentStep}`);
        this.lastActionAt = this.time.now;
        this.guideText.setText(this.currentStep === 0
            ? '看這裡～\n第一顆正在閃亮！'
            : '看金色星光～\n這條是正確路線！');
        this.pulseExpectedStar();
        this.showCorrectBranchHint();
        this.updateScorePreview();
        this.playSfx('click_sfx', 0.25);
    }

    updateGuide() {
        if (this.currentStep === 0) {
            this.renderFirstStarPrompt();
        } else if (this.currentChallenge) {
            this.renderChallengePrompt();
        } else {
            this.challengeTitleText.setVisible(true).setText('✨ 星光密碼');
            this.targetText.setVisible(true).setText('找下一顆星星');
        }
        this.scoreText.setText(`✨ 這位朋友 ${this.currentStep} / ${this.currentRound.points.length}`);
        this.detailText.setText(`星光連擊 ${this.starCombo}`);
    }

    showIdleClue() {
        if (this.inputLocked || !this.currentRound) return;
        this.lastActionAt = this.time.now;
        this.guideText.setText(this.currentStep === 0
            ? '第一顆星星\n正在輕輕發亮喔！'
            : '看看卡片裡的密碼～\n找一模一樣的圖案！');
        this.currentStep === 0 ? this.pulseExpectedStar() : this.pulseChallengePrompt();
    }

    updateScorePreview() {
        this.scoreText.setText(`✨ 這位朋友 ${this.currentStep} / ${this.currentRound.points.length}`);
        this.detailText.setText(`星光連擊 ${this.starCombo}`);
    }

    completeRound() {
        this.inputLocked = true;
        this.stopHintSpark();
        this.targetTokenContainer.removeAll(true).setVisible(false);
        this.friendsFound += 1;
        this.challengeTitleText.setVisible(true).setText('✨ 找到星星朋友！');
        this.targetText.setVisible(false);
        this.guideText.setText(`找到第 ${this.friendsFound} 位\n星星朋友！`);
        this.friendNameText.setVisible(true).setText(this.currentRound.name.replace('星座', '朋友'));
        this.scoreText.setText(`🌟 星星朋友 ${this.friendsFound} / ${this.rounds.length}`);
        this.detailText.setText(`星光連擊 ${this.starCombo}`);
        this.footerHintText.setText(this.currentRound.interactionHint);
        this.hintButton.setVisible(false);
        this.showAwakenedFriend();
        this.playSfx('mm_win', 0.42);
        [0, 1, 2].forEach((step) => this.time.delayedCall(step * 105, () => this.playStarTone(this.starCombo + step, true)));

        this.time.delayedCall(820, () => this.startFriendInteraction());
        this.time.delayedCall(1180, () => {
            if (this.roundIndex >= this.rounds.length - 1) {
                this.nextButton.setVisible(true);
                const label = this.nextButton.list?.[1];
                label?.setText?.('看看成績 ✨');
            } else {
                this.nextButton.setVisible(true);
                const label = this.nextButton.list?.[1];
                label?.setText?.('下一位朋友 →');
            }
        });

        this.recordFriendDiscovery();
    }

    showAwakenedFriend() {
        this.starNodes.forEach((node) => this.tweens.add({ targets: node, alpha: 0.38, duration: 360 }));

        this.friendSprite.clearTint().setAlpha(1).setInteractive({ useHandCursor: true });
        const cardScaleX = this.friendSprite.scaleX;
        const cardScaleY = this.friendSprite.scaleY;
        this.friendSprite.setScale(cardScaleX * 0.25, cardScaleY * 0.25);
        this.tweens.add({
            targets: this.friendSprite,
            scaleX: cardScaleX,
            scaleY: cardScaleY,
            duration: 600,
            ease: 'Back.easeOut'
        });

        this.boardFriendSprite = this.add.image(490, 390, this.currentRound.friendTexture)
            .setDisplaySize(310, 310)
            .setDepth(7)
            .setAlpha(0)
            .setInteractive({ useHandCursor: true });
        const boardScaleX = this.boardFriendSprite.scaleX;
        const boardScaleY = this.boardFriendSprite.scaleY;
        this.boardFriendSprite.setScale(boardScaleX * 0.2, boardScaleY * 0.2);
        this.roundObjects.push(this.boardFriendSprite);

        this.tweens.add({
            targets: this.boardFriendSprite,
            alpha: 1,
            scaleX: boardScaleX,
            scaleY: boardScaleY,
            angle: { from: -8, to: 0 },
            duration: 720,
            ease: 'Back.easeOut',
            onComplete: () => this.addSparkles(490, 390, this.currentRound.color, 20)
        });

        const playAction = () => this.playFriendAction(this.boardFriendSprite, this.currentRound.reveal);
        this.boardFriendSprite.on('pointerdown', playAction);
        this.friendSprite.on('pointerdown', playAction);
    }

    startFriendInteraction() {
        if (!this.currentRound || this.finished || !this.boardFriendSprite?.active) return;
        const interaction = this.currentRound.interaction;
        const itemCount = Phaser.Math.Clamp(Number(this.presentationConfig.interactionItemCount || 3), 2, 5);
        const positions = Phaser.Utils.Array.Shuffle([
            { x: 235, y: 260 },
            { x: 745, y: 270 },
            { x: 225, y: 520 },
            { x: 750, y: 515 },
            { x: 490, y: 575 }
        ]).slice(0, itemCount);

        this.interactionRemaining = itemCount;
        this.interactionTotal = itemCount;
        this.footerHintText.setText(`${interaction.instruction}（也可以直接前往下一位）`);
        positions.forEach((position, index) => this.createInteractionItem(interaction.kind, position, index));
    }

    createInteractionItem(kind, position, index) {
        const parts = [];
        if (kind === 'bubble') {
            parts.push(this.add.circle(0, 0, 31, 0x9eeaff, 0.3).setStrokeStyle(5, 0xd9f9ff, 0.9));
            parts.push(this.add.circle(-10, -11, 7, 0xffffff, 0.8));
        } else if (kind === 'jumping_star') {
            parts.push(this.add.circle(0, 0, 39, 0xffd9f0, 0.18));
            parts.push(this.add.star(0, 0, 5, 16, 31, 0xffeb73, 1).setStrokeStyle(4, 0xe7a63a, 1));
        } else {
            parts.push(this.add.circle(0, 0, 35, 0xffed72, 0.18));
            parts.push(this.add.ellipse(-18, 0, 24, 15, 0xdff8ff, 0.72));
            parts.push(this.add.ellipse(18, 0, 24, 15, 0xdff8ff, 0.72));
            parts.push(this.add.circle(0, 0, 12, 0xffe04e, 1).setStrokeStyle(3, 0x8d6b22, 1));
        }

        const item = this.add.container(position.x, position.y, parts)
            .setDepth(9)
            .setSize(86, 86)
            .setInteractive({ useHandCursor: true });
        item.collected = false;
        this.roundObjects.push(item);
        this.tweens.add({
            targets: item,
            y: position.y - (kind === 'jumping_star' ? 18 : 10),
            angle: kind === 'jumping_star' ? 12 : 0,
            scale: { from: 0.92, to: 1.08 },
            alpha: { from: 0.72, to: 1 },
            duration: 520 + index * 90,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        item.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            this.collectInteractionItem(item, kind);
        });
    }

    collectInteractionItem(item, kind) {
        if (item.collected) return;
        item.collected = true;
        item.disableInteractive();
        this.tweens.killTweensOf(item);
        this.interactionRemaining = Math.max(0, this.interactionRemaining - 1);
        const effectKind = kind === 'bubble' ? 'bubble' : (kind === 'firefly' ? 'feather' : 'star');
        this.spawnFriendEffect(effectKind, item);
        this.playStarTone(this.starCombo + this.interactionRemaining, true);
        this.tweens.add({
            targets: item,
            scale: 1.8,
            alpha: 0,
            duration: 260,
            onComplete: () => item.destroy()
        });

        if (this.interactionRemaining > 0) {
            this.footerHintText.setText(`做得好！還有 ${this.interactionRemaining} 個 ✨`);
        } else {
            this.completeFriendInteraction();
        }
    }

    completeFriendInteraction() {
        this.footerHintText.setText('💛 朋友好開心！專屬互動完成');
        this.addSparkles(490, 390, 0xffed79, 22);
        const message = this.add.text(490, 585, '互動完成！', {
            fontFamily: FONT,
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#fff4a4',
            stroke: '#6c4b87',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);
        this.tweens.add({
            targets: message,
            y: 555,
            alpha: 0,
            duration: 1100,
            onComplete: () => message.destroy()
        });
        this.recordFriendInteraction();
    }

    getConstellationStats() {
        return ((this.registry.get('minigame_stats') || {}).constellation || {});
    }

    getFriendRecords() {
        const records = this.getConstellationStats().friendEncyclopedia;
        return records && typeof records === 'object' && !Array.isArray(records) ? records : {};
    }

    updateFriendRecord(updater) {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const constellation = { ...(allStats.constellation || {}) };
        const friendEncyclopedia = { ...(constellation.friendEncyclopedia || {}) };
        updater(friendEncyclopedia, constellation);
        constellation.friendEncyclopedia = friendEncyclopedia;
        allStats.constellation = constellation;
        this.registry.set('minigame_stats', allStats);
        SaveSystem.saveFromRegistry(this.registry);
        this.refreshEncyclopediaButton();
    }

    recordFriendDiscovery() {
        this.updateFriendRecord((records, constellation) => {
            const oldRecord = records[this.currentRound.id] || {};
            records[this.currentRound.id] = {
                foundCount: Number(oldRecord.foundCount || 0) + 1,
                interactionCount: Number(oldRecord.interactionCount || 0),
                interactionComplete: oldRecord.interactionComplete === true,
                rainbowCount: Number(oldRecord.rainbowCount || 0) + (this.roundRainbowCollected ? 1 : 0)
            };
            constellation.rainbowStarCount = Number(constellation.rainbowStarCount || 0) + (this.roundRainbowCollected ? 1 : 0);
        });
    }

    recordFriendInteraction() {
        this.updateFriendRecord((records) => {
            const oldRecord = records[this.currentRound.id] || {};
            records[this.currentRound.id] = {
                foundCount: Math.max(1, Number(oldRecord.foundCount || 0)),
                interactionCount: Number(oldRecord.interactionCount || 0) + 1,
                interactionComplete: true,
                rainbowCount: Number(oldRecord.rainbowCount || 0)
            };
        });
    }

    refreshEncyclopediaButton() {
        const records = this.getFriendRecords?.() || {};
        const found = CONSTELLATION_PATTERNS.filter((friend) => Number(records[friend.id]?.foundCount || 0) > 0).length;
        this.encyclopediaButton?.list?.[1]?.setText?.(`📖 圖鑑 ${found}/${CONSTELLATION_PATTERNS.length}`);
    }

    playFriendAction(sprite, kind) {
        if (!sprite?.active || this.friendActionPlaying) return;
        this.friendActionPlaying = true;
        const startX = sprite.x;
        const startY = sprite.y;
        const startScaleX = sprite.scaleX;
        const startScaleY = sprite.scaleY;
        this.playStarTone(this.starCombo + 2, true);

        const finish = () => {
            if (sprite?.active) sprite.setPosition(startX, startY).setScale(startScaleX, startScaleY).setAngle(0);
            this.friendActionPlaying = false;
        };

        if (kind === 'fish') {
            this.spawnFriendEffect('bubble', sprite);
            this.tweens.add({
                targets: sprite,
                x: startX + 70,
                y: startY - 22,
                angle: 8,
                duration: 360,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: finish
            });
        } else if (kind === 'rabbit') {
            this.spawnFriendEffect('star', sprite);
            this.tweens.add({
                targets: sprite,
                y: startY - 68,
                scaleX: startScaleX * 0.93,
                scaleY: startScaleY * 1.08,
                duration: 250,
                yoyo: true,
                ease: 'Quad.easeOut',
                onComplete: finish
            });
        } else if (kind === 'bear') {
            this.spawnFriendEffect('star', sprite);
            this.tweens.add({
                targets: sprite,
                scaleX: startScaleX * 1.16,
                scaleY: startScaleY * 1.16,
                duration: 240,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: finish
            });
        } else if (kind === 'deer') {
            this.spawnFriendEffect('star', sprite);
            this.tweens.add({
                targets: sprite,
                y: startY - 52,
                x: startX + 28,
                angle: 6,
                duration: 260,
                yoyo: true,
                repeat: 1,
                ease: 'Quad.easeOut',
                onComplete: finish
            });
        } else if (kind === 'squirrel') {
            this.spawnFriendEffect('star', sprite);
            this.tweens.add({
                targets: sprite,
                angle: 360,
                scaleX: startScaleX * 1.08,
                scaleY: startScaleY * 1.08,
                duration: 560,
                ease: 'Back.easeInOut',
                onComplete: finish
            });
        } else {
            this.spawnFriendEffect('feather', sprite);
            this.tweens.add({
                targets: sprite,
                angle: { from: -7, to: 7 },
                scaleX: startScaleX * 1.08,
                scaleY: startScaleY * 0.92,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: finish
            });
        }
    }

    spawnFriendEffect(kind, sprite) {
        const color = kind === 'bubble' ? 0xbcefff : (kind === 'feather' ? 0xffdc79 : 0xfff1a0);
        for (let index = 0; index < 9; index += 1) {
            const particle = kind === 'bubble'
                ? this.add.circle(sprite.x, sprite.y, Phaser.Math.Between(4, 10), color, 0.72)
                : this.add.star(sprite.x, sprite.y, kind === 'feather' ? 3 : 5, 3, 9, color, 0.9);
            particle.setDepth(8);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(75, 155);
            this.tweens.add({
                targets: particle,
                x: sprite.x + Math.cos(angle) * distance,
                y: sprite.y + Math.sin(angle) * distance - (kind === 'bubble' ? 55 : 0),
                alpha: 0,
                scale: 1.5,
                duration: Phaser.Math.Between(520, 820),
                onComplete: () => particle.destroy()
            });
        }
    }

    addSparkles(x, y, color, count = 8) {
        for (let index = 0; index < count; index += 1) {
            const sparkle = this.add.star(x, y, 4, 3, 9, color, 0.95);
            sparkle.setDepth(8);
            const angle = (Math.PI * 2 * index) / count;
            const distance = Phaser.Math.Between(38, 78);
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                scale: { from: 0.5, to: 1.2 },
                alpha: 0,
                duration: 480,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    playStarTone(step = 0, emphasize = false) {
        const context = this.sound?.context;
        if (!context?.createOscillator || !context?.createGain) return;
        const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1174.66];
        const volume = Phaser.Math.Clamp(Number(this.presentationConfig.toneVolumePercent || 42), 0, 100) / 100;
        if (volume <= 0) return;

        try {
            context.resume?.().catch?.(() => {});
            const now = context.currentTime;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = emphasize ? 'triangle' : 'sine';
            oscillator.frequency.setValueAtTime(notes[Math.abs(step) % notes.length], now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * (emphasize ? 0.16 : 0.11)), now + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + (emphasize ? 0.34 : 0.24));
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(now);
            oscillator.stop(now + (emphasize ? 0.36 : 0.26));
        } catch (error) {
            // HTML5Audio 模式沒有 WebAudio 節點時，保留既有點擊音效即可。
        }
    }

    showEncyclopedia() {
        if (this.encyclopediaModalObjects?.length) return;
        this.inputLockedBeforeEncyclopedia = this.inputLocked;
        this.inputLocked = true;
        const records = this.getFriendRecords();
        const modalObjects = [];
        const addModal = (object, depth = 101) => {
            object.setDepth(depth);
            modalObjects.push(object);
            return object;
        };

        addModal(this.add.rectangle(640, 360, 1280, 720, 0x061020, 0.84).setInteractive(), 100);
        addModal(this.add.rectangle(640, 360, 1120, 680, 0xfffbea, 1).setStrokeStyle(8, 0xf0c85d, 1));
        addModal(this.add.text(640, 66, '📖 星星朋友圖鑑', {
            fontFamily: FONT,
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#65502b'
        }).setOrigin(0.5));
        addModal(this.add.text(640, 108, '每場遇見 3 位朋友・優先安排還沒收集的朋友', {
            fontFamily: FONT,
            fontSize: '18px',
            color: '#6c7d7b'
        }).setOrigin(0.5));

        const cardXs = [350, 640, 930];
        const cardYs = [260, 475];
        CONSTELLATION_PATTERNS.forEach((friend, index) => {
            const x = cardXs[index % 3];
            const y = cardYs[Math.floor(index / 3)];
            const record = records[friend.id] || {};
            const discovered = Number(record.foundCount || 0) > 0;
            addModal(this.add.rectangle(x, y, 250, 190, discovered ? 0xffffff : 0xe4e6e7, 1)
                .setStrokeStyle(4, discovered ? friend.color : 0xa8afb1, 0.95));
            const portrait = addModal(this.add.image(x, y - 30, friend.friendTexture).setDisplaySize(112, 112));
            if (!discovered) portrait.setTint(0x353945).setAlpha(0.22);
            addModal(this.add.text(x, y + 45, discovered ? friend.name.replace('星座', '朋友') : '神祕朋友？', {
                fontFamily: FONT,
                fontSize: '19px',
                fontStyle: 'bold',
                color: discovered ? '#5a4b68' : '#777f82'
            }).setOrigin(0.5));
            addModal(this.add.text(x, y + 76, discovered
                ? `遇見 ${record.foundCount || 0} 次・🌈 ${record.rainbowCount || 0}\n${record.interactionComplete ? '💛 專屬互動完成' : '☆ 等你一起玩'}`
                : '繼續連星星，就會遇見！', {
                fontFamily: FONT,
                fontSize: '14px',
                color: '#667373',
                align: 'center',
                lineSpacing: 4
            }).setOrigin(0.5));
        });

        const rainbowTotal = Number(this.getConstellationStats().rainbowStarCount || 0);
        addModal(this.add.text(640, 602, `🌈 已發現彩虹星：${rainbowTotal} 顆`, {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#8460a0'
        }).setOrigin(0.5));

        const closeButton = this.makeButton(640, 652, 230, 56, '關閉圖鑑', 0x80cb59, 0x4f842f, () => {
            this.closeEncyclopedia();
        }, 22).setDepth(102);
        modalObjects.push(closeButton);
        this.encyclopediaModalObjects = modalObjects;
        this.playSfx('click_sfx', 0.25);
    }

    closeEncyclopedia() {
        this.encyclopediaModalObjects?.forEach((object) => object?.destroy?.());
        this.encyclopediaModalObjects = null;
        this.inputLocked = this.inputLockedBeforeEncyclopedia === true;
        this.lastActionAt = this.time.now;
        this.playSfx('click_sfx', 0.22);
    }

    finishGame() {
        if (this.finished) return;
        this.finished = true;
        this.inputLocked = true;
        const elapsedSeconds = Math.max(1, Math.round((this.time.now - this.startedAt) / 1000));
        const score = calculateConstellationScore({ wrongTaps: this.wrongTaps, hintsUsed: this.hintsUsed }, this.scoreRules);
        const accuracy = Math.round((this.totalSteps / Math.max(1, this.totalSteps + this.wrongTaps)) * 100);
        const saved = this.saveProgress({ score, accuracy, elapsedSeconds });
        this.showResult({ score, accuracy, elapsedSeconds, saved });
    }

    saveProgress({ score, accuracy, elapsedSeconds }) {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const oldStats = allStats.constellation || {};
        const fastestSeconds = Number(oldStats.fastestSeconds || 0);
        const fewestMistakes = oldStats.fewestMistakes;
        const stats = {
            ...oldStats,
            playCount: Number(oldStats.playCount || 0) + 1,
            clearCount: Number(oldStats.clearCount || 0) + 1,
            bestScore: Math.max(Number(oldStats.bestScore || 0), score),
            lastScore: score,
            bestAccuracy: Math.max(Number(oldStats.bestAccuracy || 0), accuracy),
            bestCombo: Math.max(Number(oldStats.bestCombo || 0), this.bestStarCombo),
            perfectClearCount: Number(oldStats.perfectClearCount || 0) + (this.wrongTaps === 0 && this.hintsUsed === 0 ? 1 : 0),
            fewestMistakes: typeof fewestMistakes === 'number' ? Math.min(fewestMistakes, this.wrongTaps) : this.wrongTaps,
            fastestSeconds: fastestSeconds === 0 ? elapsedSeconds : Math.min(fastestSeconds, elapsedSeconds)
        };
        allStats.constellation = stats;
        this.registry.set('minigame_stats', allStats);
        const stageResult = StageManager.applyStageResult(this.registry, this.stageId, score);
        SaveSystem.saveFromRegistry(this.registry);
        return { stats, stageResult };
    }

    showResult({ score, accuracy, elapsedSeconds, saved }) {
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x061020, 0.82).setInteractive().setDepth(90);
        this.add.rectangle(648, 370, 720, 540, 0x000000, 0.3).setDepth(91);
        this.add.rectangle(640, 360, 720, 540, 0xfffbea, 1).setStrokeStyle(8, 0xf1c752, 1).setDepth(91);
        this.add.rectangle(640, 150, 620, 82, 0x745bb5, 1).setStrokeStyle(4, 0x4d3a84, 1).setDepth(91);
        this.add.text(640, 150, `✨ ${this.rounds.length} 位星星朋友都回來了！`, {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4d3a84',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(91);

        const stars = '★'.repeat(saved.stageResult.stars) + '☆'.repeat(3 - saved.stageResult.stars);
        this.add.text(640, 224, `${stars}　${score} / 100 分`, {
            fontFamily: FONT,
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#665018'
        }).setOrigin(0.5).setDepth(91);

        const friendSpacing = 138;
        const friendStartX = 640 - ((this.rounds.length - 1) * friendSpacing) / 2;
        this.rounds.forEach((round, index) => {
            this.add.circle(friendStartX + index * friendSpacing, 320, 58, round.color, 0.22).setDepth(91);
            this.add.image(friendStartX + index * friendSpacing, 320, round.friendTexture)
                .setDisplaySize(112, 112)
                .setDepth(92);
        });

        const collectedFriends = CONSTELLATION_PATTERNS.filter((friend) => (
            Number(saved.stats.friendEncyclopedia?.[friend.id]?.foundCount || 0) > 0
        )).length;
        this.add.text(640, 418,
            `連線正確率：${accuracy}%　　點錯：${this.wrongTaps} 次\n` +
            `最高連擊：${this.bestStarCombo}　　使用提示：${this.hintsUsed} 次　　完成時間：${elapsedSeconds} 秒\n` +
            `📖 圖鑑：${collectedFriends}/${CONSTELLATION_PATTERNS.length}　　🌈 彩虹星：${saved.stats.rainbowStarCount || 0} 顆\n` +
            `歷史最高：${saved.stats.bestScore} 分`, {
            fontFamily: FONT,
            fontSize: '21px',
            color: '#526361',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(91);

        const message = this.wrongTaps === 0 && this.hintsUsed === 0
            ? '太厲害了！你是閃亮亮的星空小博士！'
            : '每顆星星都找到了，再玩一次也會有不同的手感！';
        this.add.text(640, 508, message, {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#4e7a64',
            align: 'center'
        }).setOrigin(0.5).setDepth(91);

        this.makeButton(485, 584, 260, 68, '再連一次', 0x82cf54, 0x4d842e, () => {
            this.scene.restart({
                stageId: this.stageId,
                returnScene: this.returnScene,
                mapID: this.mapID,
                testMode: this.testMode
            });
        }, 27).setDepth(91);
        const returnText = this.returnScene === 'MiniGameHub' ? '回測試樂園' : '回到地圖';
        this.makeButton(795, 584, 260, 68, returnText, 0xf3bd45, 0x98701d, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 27).setDepth(91);
        this.playSfx('mm_win', 0.55);
    }

    playSfx(key, volume = 0.4) {
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
    }

    update(time) {
        if (this.inputLocked || this.finished || !this.currentRound) return;
        const idleMs = Math.max(3000, Number(this.gameConfig.idleHintSeconds || 5) * 1000);
        if (time - this.lastActionAt >= idleMs) this.showIdleClue();
    }

    cleanup() {
        this.stopHintSpark();
        this.input?.off?.('pointermove', this.pointerMoveHandler);
        this.input?.off?.('pointerup', this.pointerUpHandler);
        AudioSystem.stopBgm(this);
    }
}
