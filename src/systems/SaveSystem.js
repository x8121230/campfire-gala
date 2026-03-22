// src/systems/SaveSystem.js
import { SAVE_KEY, DEFAULT_SAVE_DATA, DEFAULT_STAGE_PROGRESS } from '../data/GameData.js';

export default class SaveSystem {
    /**
     * 讀取整份存檔
     */
    static load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);

            if (!raw) {
                return this.cloneDefaultData();
            }

            const parsed = JSON.parse(raw);

            return {
                ...this.cloneDefaultData(),
                ...parsed,
                owned_items: Array.isArray(parsed?.owned_items) ? parsed.owned_items : [...DEFAULT_SAVE_DATA.owned_items],
                placed_decorations: Array.isArray(parsed?.placed_decorations) ? parsed.placed_decorations : [...DEFAULT_SAVE_DATA.placed_decorations],

                minigame_stats: parsed?.minigame_stats ?? { ...DEFAULT_SAVE_DATA.minigame_stats },
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
            placed_decorations: Array.isArray(DEFAULT_SAVE_DATA.placed_decorations) ? [...DEFAULT_SAVE_DATA.placed_decorations] : [],
            minigame_stats: { ...(DEFAULT_SAVE_DATA.minigame_stats || {}) },
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

    /**
     * 將 Registry 內容存進 localStorage
     */
    static saveFromRegistry(registry) {
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
            placed_decorations: this.safeArrayValue(registry.get('placed_decorations'), oldData.placed_decorations),

            equipped_hat: this.safeValue(registry.get('equipped_hat'), oldData.equipped_hat ?? 'none'),
            equipped_cloth: this.safeValue(registry.get('equipped_cloth'), oldData.equipped_cloth ?? 'none'),
            equipped_fullset: this.safeValue(registry.get('equipped_fullset'), oldData.equipped_fullset ?? 'none'),

            minigame_stats: this.safeObjectValue(registry.get('minigame_stats'), oldData.minigame_stats || {}),
            bonus_play_counts: this.safeObjectValue(registry.get('bonus_play_counts'), oldData.bonus_play_counts || {}),
            bonus_reward_rates: this.safeObjectValue(registry.get('bonus_reward_rates'), oldData.bonus_reward_rates || {}),
            bonus_drop_rates: this.safeObjectValue(registry.get('bonus_drop_rates'), oldData.bonus_drop_rates || {}),
            stage_progress: this.mergeStageProgress(registry.get('stage_progress') || oldData.stage_progress || {})
                        
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
        registry.set('placed_decorations', Array.isArray(data.placed_decorations) ? data.placed_decorations : []);

        registry.set('equipped_hat', data.equipped_hat ?? 'none');
        registry.set('equipped_cloth', data.equipped_cloth ?? 'none');
        registry.set('equipped_fullset', data.equipped_fullset ?? 'none');

        registry.set('minigame_stats', data.minigame_stats ?? {});
        registry.set('bonus_play_counts', data.bonus_play_counts ?? {});
        registry.set('bonus_reward_rates', data.bonus_reward_rates ?? {});
        registry.set('bonus_drop_rates', data.bonus_drop_rates ?? {});
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
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
        localStorage.removeItem(SAVE_KEY);
        console.log('🗑️ 存檔已清除');
    }
}