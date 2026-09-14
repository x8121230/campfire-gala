const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const TRANSITION_DURATION_MS = 1500;

export default class CampfireTransitionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CampfireTransitionOverlay', active: false });
    }

    init(data = {}) {
        this.transitionData = data;
        this.hasOpenedTarget = false;
        this.scheduledEvents = [];
    }

    create() {
        const data = this.transitionData || {};
        const targetExists = Boolean(this.scene.manager.keys[data.targetSceneKey]);

        if (!data.targetSceneKey || !targetExists) {
            this.finishTransition();
            return;
        }

        this.width = this.scale.width || Number(this.game.config.width) || BASE_WIDTH;
        this.height = this.scale.height || Number(this.game.config.height) || BASE_HEIGHT;
        this.durationScale = Phaser.Math.Clamp(1 / (data.speed || 1), 0.5, 2);
        this.input.setTopOnly(true);
        this.createInputShield();

        if (data.reducedMotion) {
            this.playReducedMotionTransition();
            return;
        }

        this.createCampfire();
        this.playCampfireTransition();

        this.failSafeTimer = this.time.delayedCall(3200, () => {
            this.openTargetScene();
            this.finishTransition();
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.failSafeTimer?.remove(false);
            this.scheduledEvents.forEach((event) => event?.remove(false));
            this.scheduledEvents = [];
        });
    }

    createInputShield() {
        this.shield = this.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0x201527,
            0.92
        )
            .setScrollFactor(0)
            .setDepth(10)
            .setInteractive();

        this.shield.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
        });
    }

    createCampfire() {
        const centerX = this.width / 2;
        const centerY = this.height * 0.62;

        this.outerGlow = this.add.circle(centerX, centerY, 110, 0xff8a31, 0.12)
            .setDepth(20)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.18);

        this.innerGlow = this.add.circle(centerX, centerY, 58, 0xffd65a, 0.22)
            .setDepth(21)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.25);

        const leftLog = this.add.rectangle(-28, 52, 108, 22, 0x8f4b2d, 1)
            .setStrokeStyle(5, 0x5f301f)
            .setAngle(18);
        const rightLog = this.add.rectangle(28, 52, 108, 22, 0xa85b32, 1)
            .setStrokeStyle(5, 0x5f301f)
            .setAngle(-18);

        const outerFlame = this.add.polygon(0, 0, [
            0, -112,
            -24, -62,
            -55, -18,
            -47, 38,
            0, 72,
            47, 38,
            55, -18,
            26, -59
        ], 0xff7a22, 1);

        const middleFlame = this.add.polygon(0, 9, [
            0, -72,
            -18, -35,
            -31, 4,
            -25, 39,
            0, 58,
            25, 39,
            31, 4,
            17, -34
        ], 0xffc928, 1);

        const innerFlame = this.add.polygon(0, 23, [
            0, -40,
            -14, -10,
            -12, 23,
            0, 38,
            12, 23,
            14, -10
        ], 0xfff4a3, 1);

        this.fire = this.add.container(centerX, centerY, [
            leftLog,
            rightLog,
            outerFlame,
            middleFlame,
            innerFlame
        ])
            .setDepth(30)
            .setScale(0.18)
            .setAlpha(0.35);
    }

    playCampfireTransition() {
        this.playSound('ui_click_sfx', 0.72, 0.12);

        this.tweens.add({
            targets: this.fire,
            scale: 1,
            alpha: 1,
            duration: this.ms(390),
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: this.innerGlow,
            scale: 2.8,
            alpha: 0.42,
            duration: this.ms(650),
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.outerGlow,
            scale: 5.2,
            alpha: 0.34,
            duration: this.ms(930),
            ease: 'Cubic.easeOut'
        });

        this.schedule(260, () => {
            this.createSparkBurst(18);
            this.playSound('answer_correct_sfx', 0.9, 0.11);
        });

        this.schedule(500, () => this.openTargetScene());

        this.schedule(760, () => {
            this.tweens.add({
                targets: this.fire,
                scaleX: 1.08,
                scaleY: 0.94,
                duration: this.ms(150),
                yoyo: true,
                ease: 'Sine.easeInOut'
            });

            this.createSparkBurst(12);
        });

        this.tweens.add({
            targets: [this.shield, this.outerGlow, this.innerGlow, this.fire],
            alpha: 0,
            delay: this.ms(980),
            duration: this.ms(440),
            ease: 'Sine.easeIn'
        });

        this.schedule(TRANSITION_DURATION_MS, () => this.finishTransition());
    }

    createSparkBurst(count) {
        const centerX = this.width / 2;
        const centerY = this.height * 0.58;

        for (let index = 0; index < count; index += 1) {
            const radius = Phaser.Math.Between(3, 7);
            const color = Phaser.Utils.Array.GetRandom([0xfff1a2, 0xffcf45, 0xff8733]);
            const spark = this.add.circle(
                centerX + Phaser.Math.Between(-42, 42),
                centerY + Phaser.Math.Between(-8, 44),
                radius,
                color,
                0.96
            )
                .setDepth(45)
                .setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-150, 150),
                y: spark.y - Phaser.Math.Between(115, 330),
                scale: Phaser.Math.FloatBetween(0.15, 0.55),
                alpha: 0,
                duration: this.ms(Phaser.Math.Between(430, 760)),
                ease: 'Quad.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    }

    openTargetScene() {
        if (this.hasOpenedTarget) return;
        this.hasOpenedTarget = true;

        const { fromSceneKey, targetSceneKey, targetData = {} } = this.transitionData;

        if (fromSceneKey && fromSceneKey !== this.scene.key && this.scene.isActive(fromSceneKey)) {
            this.scene.stop(fromSceneKey);
        }

        if (!this.scene.isActive(targetSceneKey)) {
            this.scene.launch(targetSceneKey, targetData);
        }

        this.scene.bringToTop(this.scene.key);

        const targetScene = this.scene.get(targetSceneKey);
        const targetCamera = targetScene?.cameras?.main;

        if (targetCamera) {
            targetCamera.setZoom(0.97);
            targetCamera.setAlpha(0.88);

            this.tweens.add({
                targets: targetCamera,
                zoom: 1,
                alpha: 1,
                duration: this.ms(500),
                ease: 'Sine.easeOut'
            });
        }
    }

    playSound(key, rate, volume) {
        if (this.cache.audio.exists(key)) {
            this.sound.play(key, { rate, volume });
        }
    }

    playReducedMotionTransition() {
        this.shield.setFillStyle(0x2c1a2c, 0.72);
        this.openTargetScene();

        this.tweens.add({
            targets: this.shield,
            alpha: 0,
            duration: 150,
            ease: 'Linear',
            onComplete: () => this.finishTransition()
        });
    }

    ms(value) {
        return Math.max(1, Math.round(value * this.durationScale));
    }

    schedule(delay, callback) {
        const event = this.time.delayedCall(this.ms(delay), callback);
        this.scheduledEvents.push(event);
        return event;
    }

    finishTransition() {
        this.registry.set('transition_in_progress', false);

        if (this.scene.isActive(this.scene.key)) {
            this.scene.stop(this.scene.key);
        }
    }
}
