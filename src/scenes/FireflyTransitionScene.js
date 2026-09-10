const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const TRANSITION_DURATION_MS = 1500;

export default class FireflyTransitionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FireflyTransitionOverlay', active: false });
    }

    init(data = {}) {
        this.transitionData = data;
        this.hasOpenedTarget = false;
        this.scheduledEvents = [];
        this.fireflies = [];
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

        this.createFireflies();
        this.playFireflyTransition();

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
            0x061a35,
            0.94
        )
            .setScrollFactor(0)
            .setDepth(10)
            .setInteractive();

        this.shield.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
        });

        this.centerGlow = this.add.circle(
            this.width / 2,
            this.height / 2,
            46,
            0xffef83,
            0
        )
            .setDepth(24)
            .setBlendMode(Phaser.BlendModes.ADD);
    }

    createFireflies() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const count = 18;

        for (let index = 0; index < count; index += 1) {
            const fromLeft = index % 2 === 0;
            const startX = fromLeft
                ? Phaser.Math.Between(-30, Math.round(this.width * 0.2))
                : Phaser.Math.Between(Math.round(this.width * 0.8), this.width + 30);
            const startY = Phaser.Math.Between(Math.round(this.height * 0.18), Math.round(this.height * 0.82));
            const angle = (Math.PI * 2 * index) / count;
            const radiusX = Phaser.Math.Between(90, 245);
            const radiusY = Phaser.Math.Between(45, 165);
            const targetX = centerX + Math.cos(angle) * radiusX;
            const targetY = centerY + Math.sin(angle) * radiusY;

            const halo = this.add.circle(0, 0, Phaser.Math.Between(15, 25), 0xffec72, 0.16)
                .setBlendMode(Phaser.BlendModes.ADD);
            const core = this.add.circle(0, 0, Phaser.Math.Between(4, 7), 0xfff7b0, 1)
                .setStrokeStyle(2, 0xffda3c, 0.9)
                .setBlendMode(Phaser.BlendModes.ADD);
            const firefly = this.add.container(startX, startY, [halo, core])
                .setDepth(30 + index)
                .setAlpha(0)
                .setScale(0.45);

            firefly.setData({ targetX, targetY, fromLeft });
            this.fireflies.push(firefly);
        }
    }

    playFireflyTransition() {
        this.playSound('ui_click_sfx', 1.12, 0.08);

        this.fireflies.forEach((firefly, index) => {
            const delay = this.ms(55 + index * 22);

            this.tweens.add({
                targets: firefly,
                x: firefly.getData('targetX'),
                y: firefly.getData('targetY'),
                alpha: 1,
                scale: 1,
                delay,
                duration: this.ms(430),
                ease: 'Sine.easeOut'
            });

            this.tweens.add({
                targets: firefly,
                angle: firefly.getData('fromLeft') ? 16 : -16,
                delay,
                duration: this.ms(210),
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut'
            });
        });

        this.schedule(520, () => {
            this.openTargetScene();
            this.playSound('answer_correct_sfx', 1.18, 0.1);
        });

        this.schedule(650, () => {
            this.tweens.add({
                targets: this.centerGlow,
                alpha: 0.5,
                scale: 7.2,
                duration: this.ms(520),
                ease: 'Cubic.easeOut'
            });

            this.fireflies.forEach((firefly, index) => {
                const direction = index % 2 === 0 ? -1 : 1;

                this.tweens.add({
                    targets: firefly,
                    x: firefly.x + direction * Phaser.Math.Between(35, 145),
                    y: firefly.y - Phaser.Math.Between(25, 120),
                    alpha: 0,
                    scale: 0.55,
                    delay: this.ms(index * 8),
                    duration: this.ms(560),
                    ease: 'Quad.easeOut'
                });
            });
        });

        this.tweens.add({
            targets: this.shield,
            alpha: 0,
            delay: this.ms(900),
            duration: this.ms(500),
            ease: 'Sine.easeIn'
        });

        this.tweens.add({
            targets: this.centerGlow,
            alpha: 0,
            delay: this.ms(1120),
            duration: this.ms(280),
            ease: 'Sine.easeIn'
        });

        this.schedule(TRANSITION_DURATION_MS, () => this.finishTransition());
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
            targetCamera.setZoom(1.035);
            targetCamera.setAlpha(0.86);

            this.tweens.add({
                targets: targetCamera,
                zoom: 1,
                alpha: 1,
                duration: this.ms(520),
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
        this.shield.setFillStyle(0x061a35, 0.72);
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
