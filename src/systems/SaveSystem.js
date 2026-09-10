// src/systems/SaveSystem.js
import { SAVE_KEY, DEFAULT_SAVE_DATA, DEFAULT_STAGE_PROGRESS } from '../data/GameData.js';
import PlatformStorage from './PlatformStorage.js';

export default class SaveSystem {
    /**
     * 讀取整份存檔
     */
    static load() {
        try {
            const raw = PlatformStorage.getItem(SAVE_KEY);

            if (!raw) {
                return this.cloneDefaultData();
            }

            const parsed = JSON.parse(raw);

            return {
                ...this.cloneDefaultData(),
                ...parsed,
                owned_items: Array.isArray(parsed?.owned_items) ? parsed.owned_items : [...DEFAULT_SAVE_DATA.owned_items],
                owned_collectibles: Array.isArray(parsed?.owned_collectibles) ? parsed.owned_collectibles : [...DEFAULT_SAVE_DATA.owned_collectibles],
                gold_grass_encyclopedia: Array.isArray(parsed?.gold_grass_encyclopedia) ? parsed.gold_grass_encyclopedia : [],
                achievements: Array.isArray(parsed?.achievements) ? parsed.achievements : [],
                tutorial_flags: this.safeObjectValue(parsed?.tutorial_flags, {}),
                placed_decorations: Array.isArray(parsed?.placed_decorations) ? parsed.placed_decorations : [...DEFAULT_SAVE_DATA.placed_decorations],

                minigame_stats: this.mergeMiniGameStats(parsed?.minigame_stats),
                bonus_play_counts: parsed?.bonus_play_counts ?? { ...DEFAULT_SAVE_DATA.bonus_play_counts },
                bonus_reward_rates: parsed?.bonus_reward_rates ?? { ...DEFAULT_SAVE_DATA.bonus_reward_rates },
                bonus_drop_rates: parsed?.bonus_drop_rates ?? { ...DEFAULT_SAVE_DATA.bonus_drop_rates },

                stage_progress: this.mergeStageProgress(parsed?.stage_progress),

                equipped_hat: parsed?.equipped_hat ?? 'none',
                equipped_cloth: parsed?.equipped_cloth ?? 'none',
                equipped_fullset: parsed?.equipped_fullset ?? 'none'
            };
        } catch (error) {
            console.warn('讀取存檔失敗，改用預設資料：', error);
            return this.cloneDefaultData();
        }
    }

    /**
     * 建立預設資料副本，避免直接共用 DEFAULT_SAVE_DATA 參考
     */
    static cloneDefaultData() {
        return {
            ...DEFAULT_SAVE_DATA,
            owned_items: Array.isArray(DEFAULT_SAVE_DATA.owned_items) ? [...DEFAULT_SAVE_DATA.owned_items] : [],
            owned_collectibles: Array.isArray(DEFAULT_SAVE_DATA.owned_collectibles) ? [...DEFAULT_SAVE_DATA.owned_collectibles] : [],
            gold_grass_encyclopedia: Array.isArray(DEFAULT_SAVE_DATA.gold_grass_encyclopedia) ? [...DEFAULT_SAVE_DATA.gold_grass_encyclopedia] : [],
            achievements: Array.isArray(DEFAULT_SAVE_DATA.achievements) ? [...DEFAULT_SAVE_DATA.achievements] : [],
            tutorial_flags: { ...(DEFAULT_SAVE_DATA.tutorial_flags || {}) },
            placed_decorations: Array.isArray(DEFAULT_SAVE_DATA.placed_decorations) ? [...DEFAULT_SAVE_DATA.placed_decorations] : [],
            minigame_stats: this.mergeMiniGameStats(DEFAULT_SAVE_DATA.minigame_stats),
            bonus_play_counts: { ...(DEFAULT_SAVE_DATA.bonus_play_counts || {}) },
            bonus_reward_rates: { ...(DEFAULT_SAVE_DATA.bonus_reward_rates || {}) },
            bonus_drop_rates: { ...(DEFAULT_SAVE_DATA.bonus_drop_rates || {}) },
            stage_progress: this.mergeStageProgress(DEFAULT_STAGE_PROGRESS)
        };
    }

    static mergeStageProgress(savedStageProgress = {}) {
        const defaultStageProgress = JSON.parse(JSON.stringify(DEFAULT_STAGE_PROGRESS));
        const safeSaved = this.safeObjectValue(savedStageProgress, {});

        Object.keys(safeSaved).forEach((stageKey) => {
            if (defaultStageProgress[stageKey]) {
                defaultStageProgress[stageKey] = {
                    ...defaultStageProgress[stageKey],
                    ...safeSaved[stageKey]
                };
            } else {
                defaultStageProgress[stageKey] = safeSaved[stageKey];
            }
        });

        return defaultStageProgress;
    }

    static mergeMiniGameStats(savedStats = {}) {
        const defaults = this.safeObjectValue(DEFAULT_SAVE_DATA.minigame_stats, {});
        const saved = this.safeObjectValue(savedStats, {});
        const result = {};

        Object.keys({ ...defaults, ...saved }).forEach((gameKey) => {
            result[gameKey] = {
                ...this.safeObjectValue(defaults[gameKey], {}),
                ...this.safeObjectValue(saved[gameKey], {})
            };
        });

        return result;
    }

    /**
     * 將 Registry 內容交給平台儲存層
     */
    static saveFromRegistry(registry) {
        // 小遊戲測試樂園會暫存並還原 Registry；測試途中也禁止覆寫正式存檔。
        if (registry?.get?.('mini_test_mode_active') === true) {
            console.info('🧪 小遊戲測試模式：略過正式存檔');
            return false;
        }

        const oldData = this.load();

        const data = {
            ...oldData,

            hearts: this.safeValue(registry.get('hearts'), oldData.hearts),
            max_hearts: this.safeValue(registry.get('max_hearts'), oldData.max_hearts),
            recovery_seconds: this.safeValue(registry.get('recovery_seconds'), oldData.recovery_seconds),
            next_heart_time: this.safeValue(registry.get('next_heart_time'), oldData.next_heart_time),

            user_crystals: this.safeValue(registry.get('user_crystals'), oldData.user_crystals),
            reputation: this.safeValue(registry.get('reputation'), oldData.reputation),

            owned_items: this.safeArrayValue(registry.get('owned_items'), oldData.owned_items),
            equipment_upgrades: this.safeObjectValue(registry.get('equipment_upgrades'), oldData.equipment_upgrades || {}),
            new_items: this.safeArrayValue(registry.get('new_items'), oldData.new_items || []),
            wardrobe_audio: this.safeObjectValue(registry.get('wardrobe_audio'), oldData.wardrobe_audio || { music: false, sfx: true }),
            owned_collectibles: this.safeArrayValue(registry.get('owned_collectibles'), oldData.owned_collectibles),
            gold_grass_encyclopedia: this.safeArrayValue(registry.get('gold_grass_encyclopedia'), oldData.gold_grass_encyclopedia),
            achievements: this.safeArrayValue(registry.get('achievements'), oldData.achievements),
            tutorial_flags: this.safeObjectValue(registry.get('tutorial_flags'), oldData.tutorial_flags || {}),
            placed_decorations: this.safeArrayValue(registry.get('placed_decorations'), oldData.placed_decorations),

            equipped_hat: this.safeValue(registry.get('equipped_hat'), oldData.equipped_hat ?? 'none'),
            equipped_cloth: this.safeValue(registry.get('equipped_cloth'), oldData.equipped_cloth ?? 'none'),
            equipped_fullset: this.safeValue(registry.get('equipped_fullset'), oldData.equipped_fullset ?? 'none'),
            equipped_collectible: this.safeValue(registry.get('equipped_collectible'), oldData.equipped_collectible ?? 'none'),

            minigame_stats: this.safeObjectValue(registry.get('minigame_stats'), oldData.minigame_stats || {}),
            bonus_play_counts: this.safeObjectValue(registry.get('bonus_play_counts'), oldData.bonus_play_counts || {}),
            bonus_reward_rates: this.safeObjectValue(registry.get('bonus_reward_rates'), oldData.bonus_reward_rates || {}),
            bonus_drop_rates: this.safeObjectValue(registry.get('bonus_drop_rates'), oldData.bonus_drop_rates || {}),
            secret_state: this.safeObjectValue(registry.get('secret_state'), oldData.secret_state || {}),
            stage_progress: this.mergeStageProgress(registry.get('stage_progress') || oldData.stage_progress || {})
                        
        };

        PlatformStorage.setItem(SAVE_KEY, JSON.stringify(data));
        console.log('💾 存檔成功', data);
    }

    /**
     * 把存檔同步回 Registry
     */
    static applyToRegistry(registry) {
        const data = this.load();

        registry.set('hearts', data.hearts);
        registry.set('max_hearts', data.max_hearts);
        registry.set('recovery_seconds', data.recovery_seconds);
        registry.set('next_heart_time', data.next_heart_time);

        registry.set('user_crystals', data.user_crystals);
        registry.set('reputation', data.reputation);

        registry.set('owned_items', Array.isArray(data.owned_items) ? data.owned_items : []);
        registry.set('equipment_upgrades', this.safeObjectValue(data.equipment_upgrades, {}));
        registry.set('new_items', Array.isArray(data.new_items) ? data.new_items : []);
        registry.set('wardrobe_audio', this.safeObjectValue(data.wardrobe_audio, { music: false, sfx: true }));
        registry.set('owned_collectibles', Array.isArray(data.owned_collectibles) ? data.owned_collectibles : []);
        registry.set('gold_grass_encyclopedia', Array.isArray(data.gold_grass_encyclopedia) ? data.gold_grass_encyclopedia : []);
        registry.set('achievements', Array.isArray(data.achievements) ? data.achievements : []);
        registry.set('tutorial_flags', data.tutorial_flags ?? {});
        registry.set('placed_decorations', Array.isArray(data.placed_decorations) ? data.placed_decorations : []);

        registry.set('equipped_hat', data.equipped_hat ?? 'none');
        registry.set('equipped_cloth', data.equipped_cloth ?? 'none');
        registry.set('equipped_fullset', data.equipped_fullset ?? 'none');
        registry.set('equipped_collectible', data.equipped_collectible ?? 'none');

        registry.set('minigame_stats', data.minigame_stats ?? {});
        registry.set('bonus_play_counts', data.bonus_play_counts ?? {});
        registry.set('bonus_reward_rates', data.bonus_reward_rates ?? {});
        registry.set('bonus_drop_rates', data.bonus_drop_rates ?? {});
        registry.set('secret_state', data.secret_state ?? {});
        registry.set('stage_progress', data.stage_progress ?? {});
    }

    /**
     * 取得某個欄位
     */
    static getValue(key, fallback = null) {
        const data = this.load();
        return data[key] !== undefined ? data[key] : fallback;
    }

    /**
     * 寫入某個欄位
     */
    static setValue(key, value) {
        const data = this.load();
        data[key] = value;
        PlatformStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    /**
     * 更新小遊戲統計資料
     */
    static updateMiniGameStat(gameKey, statKey, value) {
        const data = this.load();

        if (!data.minigame_stats) {
            data.minigame_stats = {};
        }

        if (!data.minigame_stats[gameKey]) {
            data.minigame_stats[gameKey] = {};
        }

        data.minigame_stats[gameKey][statKey] = value;

        PlatformStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    /**
     * 讀取小遊戲統計資料
     */
    static getMiniGameStat(gameKey, statKey, fallback = 0) {
        const data = this.load();

        if (!data.minigame_stats) return fallback;
        if (!data.minigame_stats[gameKey]) return fallback;

        const value = data.minigame_stats[gameKey][statKey];
        return value !== undefined ? value : fallback;
    }

    /**
     * 安全值：如果是 undefined，就用備用值
     */
    static safeValue(value, fallback) {
        return value !== undefined ? value : fallback;
    }

    static safeArrayValue(value, fallback = []) {
        return Array.isArray(value) ? value : fallback;
    }

    static safeObjectValue(value, fallback = {}) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    }

    /**
     * 清除存檔
     */
    static reset() {
        PlatformStorage.removeItem(SAVE_KEY);
        console.log('🗑️ 存檔已清除');
    }
}
