import GrassTransitionScene from '../scenes/GrassTransitionScene.js';
import CampfireTransitionScene from '../scenes/CampfireTransitionScene.js';
import FireflyTransitionScene from '../scenes/FireflyTransitionScene.js';

const TRANSITIONS = {
    grassPart: {
        sceneKey: 'GrassTransitionOverlay',
        sceneClass: GrassTransitionScene
    },
    campfireGlow: {
        sceneKey: 'CampfireTransitionOverlay',
        sceneClass: CampfireTransitionScene
    },
    fireflyGlow: {
        sceneKey: 'FireflyTransitionOverlay',
        sceneClass: FireflyTransitionScene
    }
};

const GRASS_TEXTURES = {
    left: {
        key: 'transition_grass_left',
        path: 'assets/transitions/grass_left.png'
    },
    right: {
        key: 'transition_grass_right',
        path: 'assets/transitions/grass_right.png'
    },
    front: {
        key: 'transition_grass_front',
        path: 'assets/transitions/grass_front.png'
    }
};

export default class SceneTransitionManager {
    static isBusy(scene) {
        return Boolean(scene?.registry?.get('transition_in_progress'));
    }

    static play(scene, options = {}) {
        const targetSceneKey = options.targetSceneKey;
        const transition = TRANSITIONS[options.type];

        if (!scene?.scene || !targetSceneKey) {
            return false;
        }

        if (this.isBusy(scene)) {
            return false;
        }

        if (!transition || !this.isEnabled(scene, options.type)) {
            scene.scene.start(targetSceneKey, options.targetData || {});
            return true;
        }

        this.setBusy(scene, true);
        const loadingShield = this.createLoadingShield(scene, options.type);

        const fallback = () => {
            loadingShield?.destroy();
            this.setBusy(scene, false);
            scene.scene.start(targetSceneKey, options.targetData || {});
        };

        const begin = () => {
            loadingShield?.destroy();

            try {
                if (!scene.scene.manager.keys[transition.sceneKey]) {
                    scene.scene.manager.add(transition.sceneKey, transition.sceneClass, false);
                }

                scene.scene.launch(transition.sceneKey, {
                    fromSceneKey: scene.scene.key,
                    targetSceneKey,
                    targetData: options.targetData || {},
                    stageId: options.stageId || '',
                    speed: this.getSpeed(scene),
                    reducedMotion: this.prefersReducedMotion(scene),
                    textureKeys: options.type === 'grassPart'
                        ? {
                            left: GRASS_TEXTURES.left.key,
                            right: GRASS_TEXTURES.right.key,
                            front: GRASS_TEXTURES.front.key
                        }
                        : {}
                });
            } catch (error) {
                console.warn('[SceneTransition] 啟動轉場失敗，改為直接進入關卡。', error);
                fallback();
            }
        };

        if (options.type === 'grassPart') {
            this.ensureGrassTextures(scene, begin, fallback);
        } else {
            begin();
        }

        return true;
    }

    static isEnabled(scene, type) {
        if (scene.registry.get('gm_transition_enabled') === false) {
            return false;
        }

        const settingKey = {
            grassPart: 'gm_transition_grass_enabled',
            campfireGlow: 'gm_transition_campfire_enabled',
            fireflyGlow: 'gm_transition_firefly_enabled'
        }[type];

        return !settingKey || scene.registry.get(settingKey) !== false;
    }

    static getSpeed(scene) {
        const value = Number(scene.registry.get('gm_transition_speed'));
        return Phaser.Math.Clamp(Number.isFinite(value) && value > 0 ? value : 1, 0.5, 2);
    }

    static prefersReducedMotion(scene) {
        const gmSetting = scene.registry.get('gm_transition_reduce_motion');

        if (typeof gmSetting === 'boolean') {
            return gmSetting;
        }

        return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    }

    static setBusy(scene, value) {
        scene.registry.set('transition_in_progress', Boolean(value));
    }

    static createLoadingShield(scene, type) {
        const width = scene.scale.width || Number(scene.game.config.width) || 1280;
        const height = scene.scale.height || Number(scene.game.config.height) || 720;
        const shieldColor = type === 'campfireGlow'
            ? 0x271629
            : (type === 'grassPart' ? 0x356f45 : 0x071b35);

        const shield = scene.add.rectangle(width / 2, height / 2, width, height, shieldColor, 0.12)
            .setScrollFactor(0)
            .setDepth(999999)
            .setInteractive();

        shield.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
        });

        return shield;
    }

    static ensureGrassTextures(scene, onReady, onError) {
        const missingTextures = Object.values(GRASS_TEXTURES)
            .filter((asset) => !scene.textures.exists(asset.key));

        if (missingTextures.length === 0) {
            onReady();
            return;
        }

        let settled = false;
        const pendingKeys = new Set(missingTextures.map((asset) => asset.key));

        const finish = (callback) => {
            if (settled) return;
            settled = true;
            scene.load.off('loaderror', handleLoadError);
            callback();
        };

        const handleLoadError = (file) => {
            if (pendingKeys.has(file?.key)) {
                finish(onError);
            }
        };

        scene.load.on('loaderror', handleLoadError);

        missingTextures.forEach((asset) => {
            scene.load.once(`filecomplete-image-${asset.key}`, () => {
                if (settled) return;
                pendingKeys.delete(asset.key);

                if (pendingKeys.size === 0) {
                    finish(onReady);
                }
            });

            scene.load.image(asset.key, asset.path);
        });

        scene.load.start();
    }
}
