// src/systems/AudioSystem.js
export default class AudioSystem {
    static BGM_KEYS = [
        'home_bgm',
        'world_atlas_bgm',
        'region_forest_bgm',
        'region_fairy_bgm',
        'region_ice_bgm',
        'region_volcano_bgm',
        'region_realm_bgm',
        'region_water_bgm',
        'region_starlight_bgm',
        'region_dinosaur_bgm',
        'region_chess_bgm',
        'region_cloud_bgm',
        'forest_music',
        'lake_music',
        'campfire_music',
        'collection_bgm',
        'bush_bgm',
        'memory_bgm',
        'firefly_rhythm_bgm',
        'afm_bgm'
    ];

    static REGION_BGM = Object.freeze({
        forest: 'region_forest_bgm', fairy: 'region_fairy_bgm', ice: 'region_ice_bgm',
        volcano: 'region_volcano_bgm', realm: 'region_realm_bgm', water: 'region_water_bgm',
        starlight: 'region_starlight_bgm', dinosaur: 'region_dinosaur_bgm',
        chess: 'region_chess_bgm', cloud: 'region_cloud_bgm'
    });

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

    static playBgm(scene, key, volume = 0.5, fallbackKey = 'home_bgm') {
        const selectedKey = scene.cache.audio.exists(key)
            ? key
            : (fallbackKey && scene.cache.audio.exists(fallbackKey) ? fallbackKey : null);
        if (!selectedKey) {
            console.warn(`⚠️ 找不到音樂：${key}${fallbackKey ? `（備用：${fallbackKey}）` : ''}`);
            return;
        }

        const alreadyPlaying = scene.sound.getAll?.(selectedKey)?.find((sound) => sound?.isPlaying);
        if (alreadyPlaying) {
            alreadyPlaying.setVolume?.(volume);
            return alreadyPlaying;
        }

        this.stopAllBgm(scene);

        const bgm = scene.sound.add(selectedKey, {
            loop: true,
            volume
        });

        bgm.play();
        return bgm;
    }

    static playRegionBgm(scene, regionId, volume = 0.38) {
        const key = this.REGION_BGM[regionId] || 'world_atlas_bgm';
        const fallback = regionId === 'forest' ? 'forest_music' : 'home_bgm';
        return this.playBgm(scene, key, volume, fallback);
    }

    static stopBgm(scene) {
        if (!scene || !scene.sound) return;

        const sounds = scene.sound.sounds;

        sounds.forEach(s => {
            if (s && s.isPlaying && s.loop) {
                s.stop();
            }
        });
    }
}
