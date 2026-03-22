// src/systems/AudioSystem.js
export default class AudioSystem {
    static BGM_KEYS = [
        'home_bgm',
        'forest_music',
        'lake_music',
        'campfire_music',
        'collection_bgm'
    ];

    static stopAllBgm(scene) {
        this.BGM_KEYS.forEach((key) => {
            if (scene.sound.stopByKey) {
                scene.sound.stopByKey(key);
            }

            if (scene.sound.getAll) {
                const sounds = scene.sound.getAll(key) || [];
                sounds.forEach((sound) => {
                    if (sound) {
                        sound.stop();
                        sound.destroy();
                    }
                });
            }
        });
    }

    static playBgm(scene, key, volume = 0.5) {
        this.stopAllBgm(scene);

        if (!scene.cache.audio.exists(key)) {
            console.warn(`⚠️ 找不到音樂：${key}`);
            return;
        }

        const bgm = scene.sound.add(key, {
            loop: true,
            volume
        });

        bgm.play();
    }
}