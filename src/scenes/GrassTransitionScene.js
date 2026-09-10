const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const HOLD_BEFORE_OPEN_MS = 500;
const TRANSITION_DURATION_MS = 2000;

export default class GrassTransitionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GrassTransitionOverlay', active: false });
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

        if (!this.createGrassCurtain(data.textureKeys || {})) {
            this.openTargetScene();
            this.finishTransition();
            return;
        }

        this.createGreenFog();
        this.playGrassPartTransition();

        this.failSafeTimer = this.time.delayedCall(4000, () => {
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
            0x062c22,
            0.2
        )
            .setScrollFactor(0)
            .setDepth(10)
            .setInteractive();

        this.shield.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
        });
    }

    createGrassCurtain(textureKeys) {
        const requiredKeys = [textureKeys.left, textureKeys.right, textureKeys.front];

        if (requiredKeys.some((key) => !key || !this.textures.exists(key))) {
            return false;
        }

        const sideWidth = Math.ceil(this.width * 0.86);
        const sideHeight = Math.ceil(this.height * 1.13);
        const bottomY = this.height + Math.ceil(this.height * 0.025);

        this.leftGrass = this.add.image(-8, bottomY, textureKeys.left)
            .setOrigin(0, 1)
            .setDisplaySize(sideWidth, sideHeight)
            .setDepth(30)
            .setAngle(-0.4);

        this.rightGrass = this.add.image(this.width + 8, bottomY, textureKeys.right)
            .setOrigin(1, 1)
            .setDisplaySize(sideWidth, sideHeight)
            .setDepth(31)
            .setAngle(0.4);

        this.frontGrass = this.add.image(
            this.width / 2,
            this.height + Math.ceil(this.height * 0.025),
            textureKeys.front
        )
            .setOrigin(0.5, 1)
            .setDisplaySize(Math.ceil(this.width * 1.08), Math.ceil(this.height * 0.42))
            .setDepth(38);

        return true;
    }

    createGreenFog() {
        const veil = this.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0x55945d,
            0.30
        );

        const wisps = [
            { x: 0.18, y: 0.32, w: 0.52, h: 0.30, alpha: 0.13 },
            { x: 0.72, y: 0.24, w: 0.58, h: 0.34, alpha: 0.12 },
            { x: 0.50, y: 0.68, w: 0.76, h: 0.38, alpha: 0.11 }
        ].map((fog) => this.add.ellipse(
            this.width * fog.x,
            this.height * fog.y,
            this.width * fog.w,
            this.height * fog.h,
            0xb8ddb0,
            fog.alpha
        ));

        this.greenFog = this.add.container(0, 0, [veil, ...wisps])
            .setScrollFactor(0)
            .setDepth(20);
    }

    playGrassPartTransition() {
        // 草幕完整出現後先停 0.5 秒，讓玩家看清楚再開始撥草。
        this.schedule(HOLD_BEFORE_OPEN_MS, () => {
            this.playRustleSound(1.18, 0.18);
            this.tweens.add({
                targets: this.rightGrass,
                angle: -1.8,
                x: this.rightGrass.x - this.width * 0.012,
                duration: this.ms(70),
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        });

        // 右側先向右撥開，同時開啟關卡並讓綠霧逐漸散去。
        this.schedule(600, () => {
            this.openTargetScene();
            this.createLeavesAndSparkles(this.width * 0.7, this.height * 0.52, 1, 7);

            this.tweens.add({
                targets: this.rightGrass,
                x: this.width * 1.68,
                angle: 14,
                alpha: 0.5,
                duration: this.ms(440),
                ease: 'Cubic.easeInOut'
            });

            if (this.greenFog) {
                this.tweens.add({
                    targets: this.greenFog,
                    alpha: 0,
                    duration: this.ms(1250),
                    ease: 'Sine.easeOut'
                });
            }
        });

        // 左側草後動，讓先右後左的順序一眼就能看懂。
        this.schedule(850, () => {
            this.playRustleSound(1.24, 0.16);

            this.tweens.add({
                targets: this.leftGrass,
                angle: 1.7,
                x: this.leftGrass.x + this.width * 0.012,
                duration: this.ms(55),
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        });

        this.schedule(950, () => {
            this.createLeavesAndSparkles(this.width * 0.3, this.height * 0.55, -1, 7);

            this.tweens.add({
                targets: this.leftGrass,
                x: -this.width * 0.68,
                angle: -14,
                alpha: 0.5,
                duration: this.ms(450),
                ease: 'Cubic.easeInOut'
            });
        });

        // 前景小草最後抖動，再向畫面下方壓開。
        this.schedule(1250, () => {
            this.playRustleSound(1.32, 0.11);

            this.tweens.add({
                targets: this.frontGrass,
                y: this.frontGrass.y - this.height * 0.018,
                angle: 0.7,
                duration: this.ms(65),
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        });

        this.schedule(1360, () => {
            this.createLeavesAndSparkles(this.width * 0.5, this.height * 0.8, 0, 5);

            this.tweens.add({
                targets: this.frontGrass,
                y: this.height * 1.4,
                scaleY: this.frontGrass.scaleY * 0.68,
                alpha: 0,
                duration: this.ms(440),
                ease: 'Cubic.easeIn'
            });
        });

        this.tweens.add({
            targets: this.shield,
            alpha: 0,
            delay: this.ms(600),
            duration: this.ms(1250),
            ease: 'Sine.easeOut'
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
            targetCamera.setZoom(0.965);
            targetCamera.setAlpha(0.82);

            this.tweens.add({
                targets: targetCamera,
                zoom: 1,
                alpha: 1,
                duration: this.ms(1150),
                ease: 'Sine.easeOut'
            });
        }
    }

    createLeavesAndSparkles(startX, startY, direction, leafCount) {
        const hasLeafTexture = this.textures.exists('leaf_particle');

        for (let index = 0; index < leafCount; index += 1) {
            const leaf = hasLeafTexture
                ? this.add.image(
                    startX + Phaser.Math.Between(-35, 35),
                    startY + Phaser.Math.Between(-90, 90),
                    'leaf_particle'
                )
                : this.add.circle(
                    startX + Phaser.Math.Between(-35, 35),
                    startY + Phaser.Math.Between(-90, 90),
                    Phaser.Math.Between(3, 7),
                    0xbfe66d,
                    0.92
                );

            leaf.setDepth(45);

            if (hasLeafTexture) {
                leaf.setScale(Phaser.Math.FloatBetween(0.11, 0.2));
                leaf.setTint(Phaser.Utils.Array.GetRandom([0xa9dc65, 0xd4ef8a, 0x75bd58]));
            }

            const leafDirection = direction || (index % 2 === 0 ? -1 : 1);

            this.tweens.add({
                targets: leaf,
                x: leaf.x + leafDirection * Phaser.Math.Between(75, 190),
                y: leaf.y + Phaser.Math.Between(-65, 110),
                angle: Phaser.Math.Between(-150, 150),
                alpha: 0,
                duration: this.ms(Phaser.Math.Between(330, 610)),
                ease: 'Quad.easeOut',
                onComplete: () => leaf.destroy()
            });
        }

        for (let index = 0; index < 3; index += 1) {
            const sparkle = this.add.circle(
                startX + Phaser.Math.Between(-22, 22),
                startY + Phaser.Math.Between(-70, 70),
                Phaser.Math.Between(2, 4),
                0xfff2a8,
                0.9
            )
                .setDepth(46)
                .setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
                targets: sparkle,
                scale: 2,
                alpha: 0,
                duration: this.ms(Phaser.Math.Between(260, 440)),
                ease: 'Sine.easeOut',
                onComplete: () => sparkle.destroy()
            });
        }
    }

    playRustleSound(rate = 1.2, volume = 0.16) {
        if (!this.cache.audio.exists('dig_grass_sfx')) return;
        this.sound.play('dig_grass_sfx', { rate, volume });
    }

    playReducedMotionTransition() {
        this.shield.setFillStyle(0x062c22, 0.7);
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
