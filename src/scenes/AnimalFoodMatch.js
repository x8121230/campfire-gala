import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import {
    ANIMAL_FOOD_DB as ANIMAL_DB,
    KIDS_ANIMAL_ROUND_COUNT as ROUND_COUNT,
    calculateAnimalFoodAccuracy,
    calculateAnimalFoodScore,
    getKidsChoiceCount
} from '../data/AnimalFoodMatchData.js';

const FONT = 'Microsoft JhengHei, Arial';

export default class AnimalFoodMatch extends Phaser.Scene {
    constructor() {
        super('AnimalFoodMatch');
    }

    init(data = {}) {
        this.stageId = data.stageId || 'animals_01';
        this.returnScene = data.returnScene || 'WorldMap';
        this.mapID = data.mapID || data.mapId || '01';
        this.gameMode = data.mode || 'kids';
        this.testMode = data.testMode === true;
    }

    create() {
        this.rounds = Phaser.Utils.Array.Shuffle([...ANIMAL_DB]).slice(0, ROUND_COUNT);
        this.roundIndex = 0;
        this.wrongCount = 0;
        this.hintsUsed = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.firstTry = true;
        this.inputLocked = false;
        this.finished = false;
        this.startedAt = this.time.now;
        this.choiceObjects = [];
        this.discoveredThisRun = [];

        this.createBackground();
        this.createHud();
        this.createPlayArea();
        this.startRound(0);

        if (this.cache.audio.exists('afm_bgm')) AudioSystem.playBgm(this, 'afm_bgm', 0.32);
        this.cameras.main.fadeIn(250, 56, 28, 12);
        this.events.once('shutdown', () => AudioSystem.stopBgm(this));
        this.events.once('destroy', () => AudioSystem.stopBgm(this));
    }

    createBackground() {
        this.add.image(640, 360, 'forest_match_bg').setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x2a160d, 0.16);
        this.add.rectangle(640, 42, 1280, 84, 0x294b31, 0.92);
        this.add.rectangle(640, 687, 1280, 66, 0x173921, 0.84);

        for (let i = 0; i < 18; i += 1) {
            const glow = this.add.circle(
                Phaser.Math.Between(20, 1260),
                Phaser.Math.Between(90, 650),
                Phaser.Math.Between(2, 5),
                0xffef8a,
                Phaser.Math.FloatBetween(0.18, 0.55)
            );
            this.tweens.add({
                targets: glow,
                alpha: 0.06,
                duration: Phaser.Math.Between(800, 1700),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 800)
            });
        }
    }

    createHud() {
        const returnLabel = this.returnScene === 'MiniGameHub' ? '← 樂園' : '← 地圖';
        this.makeButton(86, 42, 136, 54, returnLabel, 0xffe7a0, 0x86652a, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 22);

        this.add.text(640, 31, '🌲 森林歷險①', {
            fontFamily: FONT,
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#fff4b5',
            stroke: '#315238',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 61, '動物點心時間', {
            fontFamily: FONT,
            fontSize: '18px',
            color: '#dff4dc'
        }).setOrigin(0.5);

        this.progressText = this.add.text(1070, 42, '', {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    createPlayArea() {
        this.add.rectangle(360, 376, 610, 530, 0xfffbeb, 0.95)
            .setStrokeStyle(7, 0x80ad68, 1);
        this.add.rectangle(955, 376, 510, 530, 0xfff8e3, 0.96)
            .setStrokeStyle(7, 0xe9bd58, 1);

        this.add.text(360, 132, '今天是哪位動物朋友？', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#426b45'
        }).setOrigin(0.5);

        this.animalGlow = this.add.circle(360, 335, 148, 0xffdc76, 0.16);
        this.animalImage = this.add.image(360, 335, ANIMAL_DB[0].body).setDisplaySize(300, 300);
        this.animalNameText = this.add.text(360, 510, '', {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#5d422b'
        }).setOrigin(0.5);
        this.speechText = this.add.text(360, 558, '', {
            fontFamily: FONT,
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#6d7952',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(955, 130, '請選一份點心', {
            fontFamily: FONT,
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#79552c'
        }).setOrigin(0.5);

        this.feedbackText = this.add.text(955, 540, '', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#4f7d4f',
            align: 'center',
            wordWrap: { width: 440 }
        }).setOrigin(0.5);

        this.comboText = this.add.text(360, 620, '', {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#ffe98e',
            stroke: '#315238',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.hintButton = this.makeButton(955, 610, 260, 58, '✨ 小精靈提示', 0x9b78d1, 0x604091, () => {
            this.showHint(true);
        }, 21);

        this.add.text(640, 687, '可以直接點食物，也可以拖曳給動物・答錯不會失敗', {
            fontFamily: FONT,
            fontSize: '18px',
            color: '#efffe9'
        }).setOrigin(0.5);
    }

    startRound(index) {
        if (index >= this.rounds.length) {
            this.finishGame();
            return;
        }

        this.clearChoices();
        this.roundIndex = index;
        this.currentAnimal = this.rounds[index];
        this.firstTry = true;
        this.hintUsedThisRound = false;
        this.inputLocked = false;
        this.feedbackText.setText('哪一個才是牠喜歡的食物呢？').setColor('#6d7952');
        this.hintButton.setVisible(true);
        this.progressText.setText(`第 ${index + 1} / ${this.rounds.length} 位朋友`);
        this.comboText.setText(this.combo > 1 ? `✨ 連續答對 ${this.combo} 次` : '');

        this.animalImage.setTexture(this.currentAnimal.body).setDisplaySize(300, 300).setAlpha(0).setScale(0.72);
        this.animalNameText.setText(this.currentAnimal.name);
        this.speechText.setText('肚子咕嚕咕嚕～');
        this.animalGlow.setFillStyle(this.currentAnimal.color, 0.2);
        this.tweens.add({ targets: this.animalImage, alpha: 1, scale: 1, duration: 330, ease: 'Back.Out' });
        this.tweens.add({ targets: this.animalGlow, scale: 1.1, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });

        const choiceCount = getKidsChoiceCount(index);
        const distractors = Phaser.Utils.Array.Shuffle(
            ANIMAL_DB.filter((animal) => animal.id !== this.currentAnimal.id)
        ).slice(0, choiceCount - 1);
        const options = Phaser.Utils.Array.Shuffle([this.currentAnimal, ...distractors]);
        this.createChoices(options);
    }

    createChoices(options) {
        const positions = options.length === 2
            ? [{ x: 830, y: 320 }, { x: 1080, y: 320 }]
            : [{ x: 790, y: 320 }, { x: 955, y: 320 }, { x: 1120, y: 320 }];

        options.forEach((animal, index) => {
            const position = positions[index];
            const width = options.length === 2 ? 190 : 145;
            const imageSize = options.length === 2 ? 132 : 112;
            const bg = this.add.rectangle(0, 0, width, 190, 0xffffff, 0.95)
                .setStrokeStyle(5, 0xe1b35a, 1);
            const image = this.add.image(0, -18, animal.food).setDisplaySize(imageSize, imageSize);
            const label = this.add.text(0, 70, animal.foodName, {
                fontFamily: FONT,
                fontSize: options.length === 2 ? '23px' : '20px',
                fontStyle: 'bold',
                color: '#654527'
            }).setOrigin(0.5);
            const choice = this.add.container(position.x, position.y, [bg, image, label])
                .setSize(width, 190)
                .setInteractive({ useHandCursor: true });
            choice.setData('animal', animal);
            choice.setData('homeX', position.x);
            choice.setData('homeY', position.y);
            choice.setData('dragged', false);

            choice.on('pointerover', () => {
                if (!this.inputLocked) choice.setScale(1.05);
            });
            choice.on('pointerout', () => {
                if (!this.inputLocked && !choice.getData('dragged')) choice.setScale(1);
            });
            choice.on('pointerdown', () => {
                if (this.inputLocked) return;
                this.tweens.killTweensOf(choice);
                choice.setPosition(choice.getData('homeX'), choice.getData('homeY'));
                choice.setData('dragged', false);
            });
            choice.on('dragstart', () => {
                if (this.inputLocked) return;
                choice.setData('dragged', true);
                choice.setScale(1.08);
                this.children.bringToTop(choice);
            });
            choice.on('drag', (pointer, dragX, dragY) => {
                if (this.inputLocked) return;
                choice.x = dragX;
                choice.y = dragY;
            });
            choice.on('dragend', () => {
                if (this.inputLocked) return;
                const delivered = Phaser.Math.Distance.Between(choice.x, choice.y, this.animalImage.x, this.animalImage.y) < 235;
                if (delivered) this.chooseFood(choice);
                else this.returnChoice(choice);
            });
            choice.on('pointerup', () => {
                if (this.inputLocked || choice.getData('dragged')) return;
                this.chooseFood(choice);
            });

            this.input.setDraggable(choice);
            this.choiceObjects.push(choice);
            this.tweens.add({ targets: choice, y: position.y - 7, duration: 720, yoyo: true, repeat: -1, delay: index * 100 });
        });
    }

    chooseFood(choice) {
        if (this.inputLocked) return;
        const selected = choice.getData('animal');
        if (selected.food === this.currentAnimal.food) this.handleCorrect(choice);
        else this.handleWrong(choice);
    }

    handleCorrect(choice) {
        this.inputLocked = true;
        if (this.firstTry) {
            this.combo += 1;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
        }
        if (!this.discoveredThisRun.includes(this.currentAnimal.id)) this.discoveredThisRun.push(this.currentAnimal.id);

        this.feedbackText.setText(`答對了！${this.currentAnimal.name}最喜歡${this.currentAnimal.foodName}！`).setColor('#3f8a47');
        this.speechText.setText('好好吃，謝謝你！');
        this.hintButton.setVisible(false);
        this.playSfx('mm_match', 0.52);

        this.tweens.killTweensOf(choice);
        this.tweens.add({
            targets: choice,
            x: this.animalImage.x + 95,
            y: this.animalImage.y + 55,
            scale: 0.62,
            duration: 360,
            ease: 'Back.In'
        });
        this.tweens.add({ targets: this.animalImage, y: 319, duration: 160, yoyo: true, repeat: 2, ease: 'Sine.Out' });
        this.spawnCelebration(360, 310, this.currentAnimal.color);
        this.time.delayedCall(1250, () => this.startRound(this.roundIndex + 1));
    }

    handleWrong(choice) {
        this.firstTry = false;
        this.wrongCount += 1;
        this.combo = 0;
        choice.disableInteractive();
        this.comboText.setText('');
        this.feedbackText.setText('差一點點～換一份點心試試看！').setColor('#b36a51');
        this.speechText.setText('這個不是我的點心唷～');
        this.playSfx('mm_wrong', 0.35);

        this.tweens.killTweensOf(choice);
        const homeX = choice.getData('homeX');
        const homeY = choice.getData('homeY');
        this.tweens.add({
            targets: choice,
            x: homeX,
            y: homeY,
            scale: 1,
            duration: 180,
            ease: 'Back.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: choice,
                    x: homeX + 8,
                    angle: 5,
                    duration: 60,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        choice.setPosition(homeX, homeY).setAngle(0).setScale(1).setAlpha(0.45);
                    }
                });
            }
        });
    }

    returnChoice(choice) {
        this.tweens.add({
            targets: choice,
            x: choice.getData('homeX'),
            y: choice.getData('homeY'),
            scale: 1,
            duration: 180,
            ease: 'Back.Out'
        });
    }

    showHint(manual = false) {
        if (this.inputLocked) return;
        if (manual && !this.hintUsedThisRound) {
            this.hintUsedThisRound = true;
            this.hintsUsed += 1;
            this.firstTry = false;
            this.combo = 0;
            this.comboText.setText('');
        }
        const correctChoice = this.choiceObjects.find((choice) => choice.getData('animal').food === this.currentAnimal.food);
        if (!correctChoice) return;
        this.feedbackText.setText(`小精靈說：${this.currentAnimal.name}喜歡${this.currentAnimal.foodName}！`).setColor('#7956a6');
        this.tweens.add({
            targets: correctChoice,
            scale: 1.14,
            alpha: 0.55,
            duration: 260,
            yoyo: true,
            repeat: 3
        });
        this.playSfx('click_sfx', 0.22);
    }

    spawnCelebration(x, y, color) {
        for (let i = 0; i < 14; i += 1) {
            const particle = i % 3 === 0
                ? this.add.text(x, y, '★', { fontSize: '24px', color: '#fff3a4' }).setOrigin(0.5)
                : this.add.circle(x, y, Phaser.Math.Between(4, 8), i % 2 ? color : 0xffda64, 1);
            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-185, 185),
                y: y + Phaser.Math.Between(-150, 80),
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(650, 1050),
                ease: 'Quad.Out',
                onComplete: () => particle.destroy()
            });
        }
    }

    clearChoices() {
        this.choiceObjects.forEach((choice) => {
            this.tweens.killTweensOf(choice);
            choice.destroy();
        });
        this.choiceObjects = [];
        this.tweens.killTweensOf(this.animalGlow);
    }

    finishGame() {
        if (this.finished) return;
        this.finished = true;
        this.inputLocked = true;
        const elapsedSeconds = Math.max(1, Math.round((this.time.now - this.startedAt) / 1000));
        const score = calculateAnimalFoodScore({ wrongCount: this.wrongCount, hintsUsed: this.hintsUsed });
        const accuracy = calculateAnimalFoodAccuracy(ROUND_COUNT, this.wrongCount);
        const saved = this.saveProgress({ score, accuracy, elapsedSeconds });
        this.showResult({ score, accuracy, elapsedSeconds, saved });
    }

    saveProgress({ score, accuracy, elapsedSeconds }) {
        const allStats = { ...(this.registry.get('minigame_stats') || {}) };
        const oldStats = allStats.animals || {};
        const oldKidsStats = oldStats.kids || oldStats;
        const oldBook = Array.isArray(oldKidsStats.friendBook) ? oldKidsStats.friendBook : [];
        const friendBook = [...new Set([...oldBook, ...this.discoveredThisRun])];
        const fastestSeconds = Number(oldKidsStats.fastestSeconds || 0);
        const kids = {
            ...oldKidsStats,
            playCount: Number(oldKidsStats.playCount || 0) + 1,
            clearCount: Number(oldKidsStats.clearCount || 0) + 1,
            bestScore: Math.max(Number(oldKidsStats.bestScore || 0), score),
            lastScore: score,
            bestAccuracy: Math.max(Number(oldKidsStats.bestAccuracy || 0), accuracy),
            bestCombo: Math.max(Number(oldKidsStats.bestCombo || 0), this.bestCombo),
            perfectClearCount: Number(oldKidsStats.perfectClearCount || 0) + (this.wrongCount === 0 && this.hintsUsed === 0 ? 1 : 0),
            fastestSeconds: fastestSeconds === 0 ? elapsedSeconds : Math.min(fastestSeconds, elapsedSeconds),
            friendBook
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
            bestAccuracy: kids.bestAccuracy,
            bestCombo: kids.bestCombo,
            friendBook: kids.friendBook
        };
        allStats.animals = stats;
        this.registry.set('minigame_stats', allStats);
        const stageResult = StageManager.applyStageResult(this.registry, this.stageId, score);
        SaveSystem.saveFromRegistry(this.registry);
        return { stats, kids, stageResult };
    }

    showResult({ score, accuracy, elapsedSeconds, saved }) {
        this.clearChoices();
        this.add.rectangle(640, 360, 1280, 720, 0x17331f, 0.82).setInteractive().setDepth(80);
        this.add.rectangle(640, 360, 740, 560, 0xfffbeb, 1).setStrokeStyle(8, 0xe8bd59, 1).setDepth(81);
        this.add.rectangle(640, 145, 640, 86, 0x78b868, 1).setStrokeStyle(4, 0x477b42, 1).setDepth(82);
        this.add.text(640, 145, '🎉 動物朋友都吃飽了！', {
            fontFamily: FONT,
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#477b42',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(83);

        const stars = '★'.repeat(saved.stageResult.stars) + '☆'.repeat(3 - saved.stageResult.stars);
        this.add.text(640, 225, `${stars}　${score} / 100 分`, {
            fontFamily: FONT,
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#6a501e'
        }).setOrigin(0.5).setDepth(83);

        const shownAnimals = this.rounds.slice(0, ROUND_COUNT);
        const startX = 640 - ((shownAnimals.length - 1) * 102) / 2;
        shownAnimals.forEach((animal, index) => {
            this.add.circle(startX + index * 102, 324, 42, animal.color, 0.2).setDepth(82);
            this.add.image(startX + index * 102, 324, animal.body).setDisplaySize(82, 82).setDepth(83);
        });

        this.add.text(640, 425,
            `答題正確率：${accuracy}%　　試錯：${this.wrongCount} 次\n` +
            `最高連續答對：${this.bestCombo}　　完成時間：${elapsedSeconds} 秒\n` +
            `📖 動物朋友圖鑑：${saved.kids.friendBook.length}/${ANIMAL_DB.length}　　歷史最高：${saved.kids.bestScore} 分`, {
            fontFamily: FONT,
            fontSize: '21px',
            color: '#536454',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5).setDepth(83);

        const message = this.wrongCount === 0 && this.hintsUsed === 0
            ? '全部一次答對，你是森林點心小博士！'
            : '每位朋友都得到點心了，再玩一次會遇見不同動物！';
        this.add.text(640, 505, message, {
            fontFamily: FONT,
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#4d7b51'
        }).setOrigin(0.5).setDepth(83);

        this.makeButton(490, 590, 260, 68, '再玩一次', 0x82cf54, 0x4d842e, () => {
            this.scene.restart({
                stageId: this.stageId,
                returnScene: this.returnScene,
                mapID: this.mapID,
                mode: 'kids',
                testMode: this.testMode
            });
        }, 27).setDepth(83);
        const returnText = this.returnScene === 'MiniGameHub' ? '回測試樂園' : '回到地圖';
        this.makeButton(790, 590, 260, 68, returnText, 0xf3bd45, 0x98701d, () => {
            this.scene.start(this.returnScene, { mapID: this.mapID });
        }, 27).setDepth(83);
        this.spawnCelebration(640, 250, 0x7dbd68);
        this.playSfx('mm_win', 0.5);
    }

    makeButton(x, y, width, height, label, fill, stroke, onClick, fontSize = 24) {
        const bg = this.add.rectangle(0, 0, width, height, fill, 1).setStrokeStyle(4, stroke, 1);
        const text = this.add.text(0, 0, label, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4d432d',
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

    playSfx(key, volume = 0.4) {
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
    }
}
