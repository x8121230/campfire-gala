import AudioSystem from '../systems/AudioSystem.js';
import ConfigManager from '../systems/ConfigManager.js';
import StageManager from '../systems/StageManager.js';
import {
    FIREFLY_LANES,
    FIREFLY_RHYTHM_SONG,
    getFireflySectionAtBeat,
    getNormalFireflyNotes
} from '../data/FireflyRhythmData.js';

// 保留舊匯出名稱，避免其他尚未更新的測試或工具讀不到三色資料。
export const FIREFLY_COLORS = FIREFLY_LANES;

const FONT = 'Microsoft JhengHei, Arial';
const LANE_X = Object.freeze({ red: 465, blue: 760, green: 1055 });

export default class FireflyCatchGame extends Phaser.Scene {
    constructor() {
        super('FireflyCatchGame');
    }

    init(data = {}) {
        this.stageId = data.stageId || 'firefly_01';
        this.stageData = data.stageData || {};
        this.returnScene = data.returnScene || 'WorldMap';
        this.mapID = data.mapID || data.mapId || '01';
        this.testMode = data.testMode === true;
    }

    create() {
        this.catchConfig = ConfigManager.getConfig().fireflyCatch;
        this.gameRules = this.catchConfig.game;
        this.rhythmRules = this.catchConfig.rhythm;
        this.scoreRules = this.catchConfig.score;
        this.songData = FIREFLY_RHYTHM_SONG;
        this.lanes = FIREFLY_LANES.slice(0, this.gameRules.colorCount);
        this.normalNoteTotal = getNormalFireflyNotes(this.songData).length;
        this.beatDurationMs = 60000 / this.rhythmRules.bpm;
        this.playbackRate = this.rhythmRules.bpm / this.songData.baseBpm;

        this.songStartedAt = 0;
        this.startedAt = this.time.now;
        this.songStarted = false;
        this.inputLocked = true;
        this.isFinished = false;
        this.nextNoteIndex = 0;
        this.activeNotes = new Set();
        this.perfectHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.mothTaps = 0;
        this.combo = 0;
        this.highestCombo = 0;
        this.lastBeatPulse = -1;
        this.currentSectionId = '';

        this.createBackground();
        this.createLanes();
        this.createHud();
        this.createResultLayer();
        this.bindControls();

        this.cameras.main.fadeIn(350, 9, 31, 38);
        this.time.delayedCall(550, () => this.startSong());
        this.events.once('shutdown', () => this.cleanup());
    }

    createBackground() {
        this.add.image(640, 360, 'mm_bg_forest').setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x071f26, 0.54);
        this.add.rectangle(175, 360, 300, 720, 0x102f2d, 0.9);
        this.add.rectangle(805, 360, 930, 720, 0x10292f, 0.5);

        for (let index = 0; index < 28; index += 1) {
            const star = this.add.circle(
                Phaser.Math.Between(320, 1260),
                Phaser.Math.Between(30, 680),
                Phaser.Math.Between(1, 3),
                index % 3 === 0 ? 0xffef8a : 0xa7f0cb,
                Phaser.Math.FloatBetween(0.18, 0.55)
            );
            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: Math.min(0.85, star.alpha + 0.3) },
                duration: Phaser.Math.Between(700, 1700),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 900)
            });
        }

        const returnLabel = this.returnScene === 'MiniGameHub' ? '← 樂園' : '← 地圖';
        this.createButton(1190, 43, 130, 46, returnLabel, 0xf7e7a9, 0x765a2d, () => {
            this.returnFromGame();
        }, 18).container.setDepth(80);
    }

    createLanes() {
        this.laneViews = new Map();
        this.lanes.forEach((lane) => {
            const x = LANE_X[lane.id];
            const laneZone = this.add.rectangle(x, 370, 250, 618, lane.color, 0.08)
                .setStrokeStyle(4, lane.color, 0.46)
                .setInteractive({ useHandCursor: true });
            laneZone.on('pointerover', () => laneZone.setFillStyle(lane.color, 0.14));
            laneZone.on('pointerout', () => laneZone.setFillStyle(lane.color, 0.08));
            laneZone.on('pointerdown', () => this.judgeLane(lane.id));

            for (let row = 0; row < 6; row += 1) {
                this.add.circle(x, 148 + row * 72, 3, lane.color, 0.38);
            }

            const judgeGlow = this.add.circle(x, 574, 88, lane.color, 0.13)
                .setStrokeStyle(8, lane.color, 0.9);
            const judgeFlower = this.add.circle(x, 574, 58, 0xfff8d8, 0.94)
                .setStrokeStyle(6, lane.softColor, 1);
            this.add.circle(x - 22, 552, 18, lane.softColor, 0.76);
            this.add.circle(x + 22, 552, 18, lane.softColor, 0.76);
            this.add.circle(x - 22, 596, 18, lane.softColor, 0.76);
            this.add.circle(x + 22, 596, 18, lane.softColor, 0.76);
            this.add.circle(x, 574, 25, lane.color, 0.9);

            const keyCap = this.add.rectangle(x, 666, 176, 52, lane.color, 0.94)
                .setStrokeStyle(4, 0xffffff, 0.68);
            const label = this.add.text(x, 666, `${lane.key}　${lane.name}`, {
                fontFamily: FONT,
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#24413a',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.laneViews.set(lane.id, { lane, laneZone, judgeGlow, judgeFlower, keyCap, label });
        });

        this.add.rectangle(760, 574, 850, 5, 0xfff3a1, 0.68);
        this.add.text(760, 622, '花圈亮起「現在！」時，點整條色道', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#fff8cf'
        }).setOrigin(0.5);
    }

    createHud() {
        this.add.text(170, 54, '點點螢火', {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#fff4bd',
            stroke: '#315136',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(170, 100, '♫ 螢火小舞曲', {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#bcefd0'
        }).setOrigin(0.5);

        this.add.rectangle(170, 185, 260, 112, 0x173f38, 0.88)
            .setStrokeStyle(3, 0x75b88b, 0.75);
        this.scoreText = this.add.text(170, 160, '目前分數　0', {
            fontFamily: FONT,
            fontSize: '27px',
            fontStyle: 'bold',
            color: '#ffe071'
        }).setOrigin(0.5);
        this.comboText = this.add.text(170, 207, '0 COMBO', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.judgementText = this.add.text(170, 295, '準備聽音樂', {
            fontFamily: FONT,
            fontSize: '29px',
            fontStyle: 'bold',
            color: '#fff3a2',
            align: 'center',
            wordWrap: { width: 270 }
        }).setOrigin(0.5);

        this.sectionText = this.add.text(170, 365, '暖身：跟著大拍點', {
            fontFamily: FONT,
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#bfe8cf',
            align: 'center',
            wordWrap: { width: 260 }
        }).setOrigin(0.5);

        this.statsText = this.add.text(170, 448, 'Perfect　0\nGood　　0\nMiss　　 0', {
            fontFamily: FONT,
            fontSize: '19px',
            color: '#eef8e4',
            lineSpacing: 9
        }).setOrigin(0.5);

        this.add.rectangle(170, 596, 268, 116, 0x1c3931, 0.82)
            .setStrokeStyle(3, 0x9dca79, 0.62);
        this.add.text(170, 596, '滑鼠：直接點整條色道\n鍵盤：A　S　D\n太早或按錯，可以再按一次', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#f1f6d9',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        this.add.rectangle(760, 53, 720, 13, 0x0e2427, 0.88)
            .setStrokeStyle(2, 0xa7d3a3, 0.5);
        this.progressBar = this.add.rectangle(402, 53, 0, 9, 0xffde69, 1)
            .setOrigin(0, 0.5);
        this.add.text(390, 52, '♪', { fontSize: '21px', color: '#fff1a0' }).setOrigin(1, 0.5);

        this.feedbackText = this.add.text(760, 92, '準備好，先看螢火蟲要去哪一條！', {
            fontFamily: FONT,
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#fff3a2',
            stroke: '#1b3a34',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(60);

        this.centerComboText = this.add.text(760, 340, '', {
            fontFamily: FONT,
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#fff4a8',
            stroke: '#315136',
            strokeThickness: 8
        }).setOrigin(0.5).setAlpha(0).setDepth(35);

        this.countdownText = this.add.text(760, 325, '準備', {
            fontFamily: FONT,
            fontSize: '68px',
            fontStyle: 'bold',
            color: '#fff2a6',
            stroke: '#315136',
            strokeThickness: 9
        }).setOrigin(0.5).setDepth(34);
    }

    createResultLayer() {
        this.resultContainer = null;
    }

    bindControls() {
        if (!this.input.keyboard) return;
        this.keyboardHandlers = [
            ['keydown-A', () => this.judgeLane('red')],
            ['keydown-S', () => this.judgeLane('blue')],
            ['keydown-D', () => this.judgeLane('green')]
        ];
        this.keyboardHandlers.forEach(([event, handler]) => this.input.keyboard.on(event, handler));
    }

    startSong() {
        if (this.isFinished || this.songStarted) return;
        AudioSystem.stopAllBgm(this);
        this.songStarted = true;
        this.inputLocked = false;
        this.songStartedAt = this.time.now;
        this.startedAt = this.songStartedAt;

        if (this.cache.audio.exists(this.songData.audioKey)) {
            this.rhythmSong = this.sound.add(this.songData.audioKey, {
                loop: false,
                volume: this.rhythmRules.musicVolumePercent / 100,
                rate: this.playbackRate
            });
            if (this.rhythmSong.setRate) this.rhythmSong.setRate(this.playbackRate);
            this.rhythmSong.play();
        }
    }

    update(time) {
        if (!this.songStarted || this.isFinished) return;
        const elapsedMs = time - this.songStartedAt;
        const currentBeat = elapsedMs / this.beatDurationMs;

        this.spawnDueNotes(elapsedMs);
        this.updateNotes(elapsedMs);
        this.updateBeatPulse(currentBeat);
        this.updateSection(currentBeat);
        this.updateCountdown(currentBeat);

        const progress = Phaser.Math.Clamp(currentBeat / this.songData.totalBeats, 0, 1);
        this.progressBar.displayWidth = 716 * progress;

        if (currentBeat >= this.songData.totalBeats && this.activeNotes.size === 0) {
            this.finishGame();
        }
    }

    spawnDueNotes(elapsedMs) {
        const travelMs = this.rhythmRules.travelBeats * this.beatDurationMs;
        while (this.nextNoteIndex < this.songData.notes.length) {
            const noteData = this.songData.notes[this.nextNoteIndex];
            const hitMs = noteData.beat * this.beatDurationMs;
            if (hitMs - travelMs > elapsedMs) break;
            this.nextNoteIndex += 1;
            this.spawnNote(noteData, hitMs, travelMs);
        }
    }

    spawnNote(noteData, hitMs, travelMs) {
        const lane = this.lanes.find((item) => item.id === noteData.lane);
        if (!lane) return;
        const x = LANE_X[lane.id];
        const isMoth = noteData.type === 'moth';
        const container = this.add.container(x, 118).setDepth(25);
        const glow = this.add.circle(0, 0, isMoth ? 39 : 44, isMoth ? 0xc6bad5 : lane.color, isMoth ? 0.2 : 0.32)
            .setStrokeStyle(isMoth ? 3 : 4, isMoth ? 0xb8a7ca : lane.color, 0.78);
        const actor = this.add.image(0, -2, isMoth ? 'mm_butterfly' : 'mm_bee')
            .setCrop(0, 0, 256, 190)
            .setDisplaySize(
                isMoth ? this.rhythmRules.fireflySize * 0.84 : this.rhythmRules.fireflySize,
                isMoth ? this.rhythmRules.fireflySize * 0.63 : this.rhythmRules.fireflySize * 0.72
            );
        if (isMoth) {
            actor.setTint(0x9c91a8).setAlpha(0.94);
        } else {
            actor.setTint(lane.color);
        }
        const symbol = this.add.text(0, 1, isMoth ? '×' : '●', {
            fontFamily: FONT,
            fontSize: isMoth ? '33px' : '16px',
            fontStyle: 'bold',
            color: isMoth ? '#fff4ff' : '#ffffff',
            stroke: isMoth ? '#594c66' : lane.textColor,
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(isMoth ? 1 : 0.82);
        const tail = this.add.circle(0, -49, isMoth ? 4 : 7, isMoth ? 0xbba9c9 : lane.color, 0.56);
        container.add([tail, glow, actor, symbol]);

        this.tweens.add({
            targets: glow,
            scale: { from: 0.88, to: 1.12 },
            alpha: { from: glow.alpha, to: Math.min(0.56, glow.alpha + 0.2) },
            duration: 360,
            yoyo: true,
            repeat: -1
        });

        this.activeNotes.add({
            data: noteData,
            lane,
            container,
            glow,
            hitMs,
            spawnMs: hitMs - travelMs,
            travelMs,
            cueShown: false,
            judged: false
        });
    }

    updateNotes(elapsedMs) {
        [...this.activeNotes].forEach((note) => {
            if (note.judged || !note.container.active) return;
            const progress = (elapsedMs - note.spawnMs) / note.travelMs;
            if (progress <= 1) {
                note.container.y = Phaser.Math.Linear(118, 574, Phaser.Math.Clamp(progress, 0, 1));
            } else {
                const lateProgress = (elapsedMs - note.hitMs) / this.rhythmRules.missWindowMs;
                note.container.y = Phaser.Math.Linear(574, 645, Phaser.Math.Clamp(lateProgress, 0, 1));
                note.container.setAlpha(1 - Phaser.Math.Clamp(lateProgress * 0.55, 0, 0.55));
            }

            if (
                note.data.type === 'normal'
                && !note.cueShown
                && elapsedMs >= note.hitMs - this.rhythmRules.goodWindowMs
            ) {
                this.showLaneCue(note);
            }

            if (elapsedMs - note.hitMs > this.rhythmRules.missWindowMs) {
                if (note.data.type === 'moth') {
                    this.dismissMoth(note);
                } else {
                    this.missNote(note, 'MISS');
                }
            }
        });
    }

    showLaneCue(note) {
        note.cueShown = true;
        const view = this.laneViews.get(note.data.lane);
        if (!view) return;

        this.tweens.killTweensOf(view.judgeGlow);
        this.tweens.killTweensOf(view.judgeFlower);
        view.label.setText('現在！');
        this.tweens.add({
            targets: [view.judgeGlow, view.judgeFlower],
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.72, to: 1 },
            duration: 210,
            yoyo: true,
            repeat: 1
        });
        this.tweens.add({
            targets: view.label,
            scale: { from: 1.18, to: 1 },
            duration: 230,
            ease: 'Back.Out'
        });
        this.time.delayedCall(Math.min(1000, this.rhythmRules.goodWindowMs * 1.35), () => {
            if (view.label.active && view.label.text === '現在！') {
                view.label.setText(`${view.lane.key}　${view.lane.name}`);
            }
        });
    }

    updateBeatPulse(currentBeat) {
        const beatIndex = Math.floor(currentBeat);
        if (beatIndex === this.lastBeatPulse) return;
        this.lastBeatPulse = beatIndex;
        this.laneViews.forEach((view) => {
            this.tweens.killTweensOf(view.judgeGlow);
            this.tweens.add({
                targets: view.judgeGlow,
                scale: { from: 1.13, to: 1 },
                alpha: { from: 0.5, to: 1 },
                duration: Math.min(260, this.beatDurationMs * 0.48)
            });
        });
    }

    updateSection(currentBeat) {
        const section = getFireflySectionAtBeat(currentBeat, this.songData);
        if (section.id === this.currentSectionId) return;
        this.currentSectionId = section.id;
        this.sectionText.setText(section.label);
        if (currentBeat >= this.songData.introBeats) {
            this.showFeedback(section.label, '#c9f7d3');
            this.tweens.add({
                targets: this.sectionText,
                scale: { from: 1.16, to: 1 },
                duration: 320,
                ease: 'Back.Out'
            });
        }
    }

    updateCountdown(currentBeat) {
        if (!this.countdownText?.active) return;
        if (currentBeat >= this.songData.introBeats) {
            this.tweens.add({
                targets: this.countdownText,
                alpha: 0,
                scale: 1.25,
                duration: 220,
                onComplete: () => this.countdownText.destroy()
            });
            return;
        }
        const remaining = Math.max(1, this.songData.introBeats - Math.floor(currentBeat));
        if (this.countdownText.text !== String(remaining)) {
            this.countdownText.setText(String(remaining)).setScale(1.18);
            this.tweens.add({ targets: this.countdownText, scale: 1, duration: 180 });
        }
    }

    judgeLane(laneId) {
        if (this.inputLocked || this.isFinished || !this.songStarted) return;
        const elapsedMs = this.time.now - this.songStartedAt;
        const candidates = [...this.activeNotes]
            .filter((note) => !note.judged && note.data.lane === laneId)
            .map((note) => ({
                note,
                delta: elapsedMs - note.hitMs,
                distance: Math.abs(elapsedMs - note.hitMs)
            }))
            .filter((item) => item.distance <= this.rhythmRules.missWindowMs)
            .sort((left, right) => left.distance - right.distance);

        const local = candidates[0];
        if (local?.note.data.type === 'moth') {
            this.tapMoth(local.note);
            return;
        }
        if (local?.note.data.type === 'normal') {
            const timing = FireflyCatchGame.getTimingJudgement(local.delta, this.rhythmRules);
            if (timing === 'perfect') {
                this.hitNote(local.note, 'perfect');
            } else if (timing === 'good') {
                this.hitNote(local.note, 'good');
            } else if (timing === 'early') {
                this.showFeedback('再等一下，花圈亮起再按！', '#fff1a8');
                this.judgementText.setText('快到了！').setColor('#fff1a8');
                this.flashLane(laneId, local.note.lane.color, 0.18);
            } else {
                this.missNote(local.note, '慢了一點');
            }
            return;
        }

        // 幼兒版按錯色道只提示，不消耗音符，仍可立刻補按正確顏色。
        const otherLaneNote = [...this.activeNotes]
            .filter((note) => !note.judged && note.data.type === 'normal')
            .map((note) => ({ note, distance: Math.abs(elapsedMs - note.hitMs) }))
            .filter((item) => item.distance <= this.rhythmRules.goodWindowMs)
            .sort((left, right) => left.distance - right.distance)[0];
        if (otherLaneNote) {
            this.showFeedback(`看看${otherLaneNote.note.lane.name}花圈，再按一次！`, '#ffd2a8');
            this.judgementText.setText('換一個顏色試試').setColor('#ffd2a8');
            this.flashLane(laneId, 0xffffff);
            return;
        }

        // 空拍誤按不扣分，讓第一次玩的孩子可以安心摸索。
        this.showFeedback('等螢火蟲飛進花圈再點', '#d7e8da');
        this.flashLane(laneId, 0xffffff, 0.18);
    }

    hitNote(note, judgement) {
        note.judged = true;
        if (judgement === 'perfect') this.perfectHits += 1;
        if (judgement === 'good') this.goodHits += 1;
        this.combo += 1;
        this.highestCombo = Math.max(this.highestCombo, this.combo);

        const isPerfect = judgement === 'perfect';
        this.showFeedback(isPerfect ? 'PERFECT！' : 'GOOD！', isPerfect ? '#ffe36e' : '#b9f2c1');
        this.judgementText.setText(isPerfect ? '閃亮拍點！' : '有跟上喔！')
            .setColor(isPerfect ? '#ffe36e' : '#b9f2c1');
        this.flashLane(note.data.lane, note.lane.color, 0.35);
        this.playSfx('mm_match', isPerfect ? 0.46 : 0.34, {
            rate: 0.92 + this.lanes.findIndex((lane) => lane.id === note.data.lane) * 0.12
        });

        this.emitNoteSparkles(note.container.x, note.container.y, note.lane.color, isPerfect ? 11 : 7);
        this.tweens.killTweensOf(note.container);
        this.tweens.add({
            targets: note.container,
            scale: isPerfect ? 1.45 : 1.25,
            alpha: 0,
            angle: isPerfect ? 18 : 8,
            duration: 230,
            ease: 'Back.In',
            onComplete: () => this.removeNote(note)
        });
        this.showComboBurst();
        this.updateHud();
    }

    missNote(note, label = 'MISS') {
        if (!note || note.judged) return;
        note.judged = true;
        this.misses += 1;
        this.combo = 0;
        this.showFeedback(label === 'MISS' ? 'MISS　下一隻再來！' : `${label}，下一隻再來！`, '#ffaaa5');
        this.judgementText.setText('沒關係，再跟上！').setColor('#ffb5af');
        this.playSfx('mm_wrong', 0.22);
        this.tweens.killTweensOf(note.container);
        this.tweens.add({
            targets: note.container,
            y: note.container.y + 38,
            alpha: 0,
            duration: 230,
            onComplete: () => this.removeNote(note)
        });
        this.updateHud();
    }

    tapMoth(note) {
        if (!note || note.judged) return;
        note.judged = true;
        this.mothTaps += 1;
        this.combo = 0;
        this.showFeedback('哎呀，是小飛蛾！', '#d9b9ed');
        this.judgementText.setText('讓飛蛾飛走就好').setColor('#e1c9ef');
        this.playSfx('mm_wrong', 0.2, { rate: 0.82 });
        this.tweens.killTweensOf(note.container);
        this.tweens.add({
            targets: note.container,
            x: note.container.x + Phaser.Math.Between(-90, 90),
            y: note.container.y - 80,
            angle: Phaser.Math.Between(-35, 35),
            alpha: 0,
            duration: 360,
            onComplete: () => this.removeNote(note)
        });
        this.updateHud();
    }

    dismissMoth(note) {
        note.judged = true;
        this.tweens.killTweensOf(note.container);
        this.tweens.add({
            targets: note.container,
            y: note.container.y + 35,
            alpha: 0,
            duration: 180,
            onComplete: () => this.removeNote(note)
        });
    }

    removeNote(note) {
        this.activeNotes.delete(note);
        if (note.container?.active) note.container.destroy();
    }

    updateHud() {
        const score = FireflyCatchGame.calculateRhythmScore({
            perfectHits: this.perfectHits,
            goodHits: this.goodHits,
            highestCombo: this.highestCombo,
            totalNotes: this.normalNoteTotal
        }, this.scoreRules);
        this.scoreText.setText(`目前分數　${score}`);
        this.comboText.setText(`${this.combo} COMBO`);
        this.statsText.setText(
            `Perfect　${this.perfectHits}\n` +
            `Good　　${this.goodHits}\n` +
            `Miss　　 ${this.misses}`
        );
    }

    showComboBurst() {
        if (this.combo < 3) return;
        this.centerComboText.setText(`${this.combo} COMBO`).setAlpha(0.84).setScale(0.82);
        this.tweens.killTweensOf(this.centerComboText);
        this.tweens.add({
            targets: this.centerComboText,
            scale: 1,
            alpha: 0,
            duration: 520,
            ease: 'Cubic.Out'
        });
    }

    flashLane(laneId, color, alpha = 0.3) {
        const view = this.laneViews.get(laneId);
        if (!view) return;
        const laneColor = this.lanes.find((lane) => lane.id === laneId)?.color || color;
        view.laneZone.setFillStyle(color, alpha);
        this.time.delayedCall(120, () => {
            if (view.laneZone.active) view.laneZone.setFillStyle(laneColor, 0.08);
        });
    }

    emitNoteSparkles(x, y, color, count, depth = 45) {
        for (let index = 0; index < count; index += 1) {
            const sparkle = this.add.star(x, y, 4, 3, Phaser.Math.Between(6, 11), index % 3 === 0 ? 0xffffff : color, 0.95)
                .setDepth(depth);
            const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
            const distance = Phaser.Math.Between(45, 105);
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                angle: Phaser.Math.Between(-120, 120),
                scale: { from: 0.5, to: 1.2 },
                alpha: 0,
                duration: Phaser.Math.Between(380, 620),
                onComplete: () => sparkle.destroy()
            });
        }
    }

    finishGame() {
        if (this.isFinished) return;
        this.isFinished = true;
        this.inputLocked = true;
        this.rhythmSong?.stop?.();
        this.playSfx('mm_win', 0.55);

        const score = FireflyCatchGame.calculateRhythmScore({
            perfectHits: this.perfectHits,
            goodHits: this.goodHits,
            highestCombo: this.highestCombo,
            totalNotes: this.normalNoteTotal
        }, this.scoreRules);
        const accuracy = Math.round(((this.perfectHits + this.goodHits) / Math.max(1, this.normalNoteTotal)) * 100);
        const elapsedSeconds = Math.max(1, Math.round((this.time.now - this.startedAt) / 1000));
        const saved = this.saveProgress({ score, accuracy, elapsedSeconds });
        this.showResult({ score, accuracy, elapsedSeconds, saved });
    }

    saveProgress({ score, accuracy, elapsedSeconds }) {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const oldStats = allStats.fireflyCatch || {};
        const fastestSeconds = Number(oldStats.fastestSeconds || 0);
        const nextStats = {
            playCount: Number(oldStats.playCount || 0) + 1,
            clearCount: Number(oldStats.clearCount || 0) + 1,
            bestScore: Math.max(Number(oldStats.bestScore || 0), score),
            lastScore: score,
            bestAccuracy: Math.max(Number(oldStats.bestAccuracy || 0), accuracy),
            bestCombo: Math.max(Number(oldStats.bestCombo || 0), this.highestCombo),
            fastestSeconds: fastestSeconds === 0 ? elapsedSeconds : Math.min(fastestSeconds, elapsedSeconds)
        };
        allStats.fireflyCatch = nextStats;
        this.registry.set('minigame_stats', allStats);
        const stageResult = StageManager.applyStageResult(this.registry, this.stageId, score);
        return { stats: nextStats, stageResult };
    }

    showResult({ score, accuracy, elapsedSeconds, saved }) {
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x081e21, 0.8).setInteractive();
        const shadow = this.add.rectangle(648, 370, 720, 540, 0x000000, 0.28);
        const panel = this.add.rectangle(640, 360, 720, 540, 0xfffdf2, 1)
            .setStrokeStyle(7, 0x89c979, 1);
        const header = this.add.rectangle(640, 155, 620, 78, 0x68b67a, 1)
            .setStrokeStyle(4, 0x3c7750, 1);
        const title = this.add.text(640, 155, '♫ 螢火小舞曲演奏完成！', {
            fontFamily: FONT,
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#376943',
            strokeThickness: 4
        }).setOrigin(0.5);

        const stars = '★'.repeat(saved.stageResult.stars) + '☆'.repeat(3 - saved.stageResult.stars);
        const scoreText = this.add.text(640, 235, `${stars}　${score} / 100 分`, {
            fontFamily: FONT,
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#5f501c'
        }).setOrigin(0.5);
        const detail = this.add.text(640, 350,
            `Perfect：${this.perfectHits}　　Good：${this.goodHits}　　Miss：${this.misses}\n` +
            `最高 Combo：${this.highestCombo}　　完成率：${accuracy}%\n` +
            `歌曲時間：${elapsedSeconds} 秒\n` +
            `歷史最高：${saved.stats.bestScore} 分`, {
                fontFamily: FONT,
                fontSize: '21px',
                color: '#4e5c45',
                align: 'center',
                lineSpacing: 15
            }).setOrigin(0.5);

        const encouragement = this.add.text(640, 455,
            score >= 85 ? '節拍閃閃發亮，太厲害了！' : score >= 60 ? '已經跟上森林的節奏囉！' : '慢慢聽、慢慢按，你做得很好！', {
                fontFamily: FONT,
                fontSize: '21px',
                fontStyle: 'bold',
                color: '#42704d'
            }).setOrigin(0.5);
        const replay = this.createButton(500, 555, 210, 62, '再演奏一次', 0x82ce55, 0x4f8534, () => {
            this.scene.restart({
                stageId: this.stageId,
                stageData: this.stageData,
                returnScene: this.returnScene,
                mapID: this.mapID,
                testMode: this.testMode
            });
        }, 22);
        const returnText = this.returnScene === 'MiniGameHub' ? '回測試樂園' : '回到地圖';
        const map = this.createButton(780, 555, 210, 62, returnText, 0xf2bf45, 0x9d741d, () => {
            this.returnFromGame();
        }, 22);

        this.resultContainer = this.add.container(0, 0).setDepth(500);
        this.resultContainer.add([
            overlay, shadow, panel, header, title, scoreText, detail, encouragement,
            replay.container, map.container
        ]);
        this.emitNoteSparkles(640, 190, 0xffdc64, 20, 550);
    }

    showFeedback(message, color) {
        this.feedbackText.setText(message).setColor(color).setAlpha(1).setScale(0.93);
        this.tweens.killTweensOf(this.feedbackText);
        this.tweens.add({
            targets: this.feedbackText,
            scale: 1.06,
            duration: 120,
            yoyo: true,
            hold: 40
        });
    }

    playSfx(key, volume, options = {}) {
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume, ...options });
    }

    createButton(x, y, width, height, text, fill, stroke, callback, fontSize = 20) {
        const container = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, width, height, fill, 1)
            .setStrokeStyle(4, stroke, 1)
            .setInteractive({ useHandCursor: true });
        const label = this.add.text(0, 0, text, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#554829',
            strokeThickness: 3
        }).setOrigin(0.5);
        background.on('pointerover', () => container.setScale(1.04));
        background.on('pointerout', () => container.setScale(1));
        background.on('pointerdown', callback);
        container.add([background, label]);
        return { container, background, label };
    }

    returnFromGame() {
        this.cleanup();
        if (this.returnScene === 'WorldMap') {
            this.scene.start('WorldMap', { mapID: this.mapID });
        } else {
            this.scene.start(this.returnScene);
        }
    }

    cleanup() {
        this.inputLocked = true;
        this.rhythmSong?.stop?.();
        this.rhythmSong?.destroy?.();
        this.rhythmSong = null;
        if (this.input?.keyboard && this.keyboardHandlers) {
            this.keyboardHandlers.forEach(([event, handler]) => this.input.keyboard.off(event, handler));
        }
        this.activeNotes?.forEach((note) => note.container?.destroy?.());
        this.activeNotes?.clear?.();
        AudioSystem.stopBgm(this);
    }

    static calculateRhythmScore(result, rules) {
        const totalNotes = Math.max(1, Number(result.totalNotes || 0));
        const perfectHits = Math.max(0, Number(result.perfectHits || 0));
        const goodHits = Math.max(0, Number(result.goodHits || 0));
        const highestCombo = Math.max(0, Number(result.highestCombo || 0));
        const judgementRatio = Phaser.Math.Clamp((perfectHits + goodHits * 0.8) / totalNotes, 0, 1);
        const comboRatio = Phaser.Math.Clamp(highestCombo / totalNotes, 0, 1);
        const score = judgementRatio * Number(rules.accuracyPoints || 0)
            + comboRatio * Number(rules.comboPoints || 0);
        return Phaser.Math.Clamp(Math.round(score), 0, Number(rules.maxScore || 100));
    }

    static getTimingJudgement(deltaMs, rules) {
        const distance = Math.abs(Number(deltaMs || 0));
        if (distance <= Number(rules.perfectWindowMs)) return 'perfect';
        if (distance <= Number(rules.goodWindowMs)) return 'good';
        if (Number(deltaMs) < 0) return 'early';
        return 'miss';
    }
}
