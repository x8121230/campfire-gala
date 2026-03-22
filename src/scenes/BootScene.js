// src/scenes/BootScene.js
import SaveSystem from '../systems/SaveSystem.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        console.log('🚀 BootScene 啟動：初始化資料');

        const savedData = SaveSystem.load() || {};

        const safeData = {
            hearts: savedData.hearts ?? 3,
            max_hearts: savedData.max_hearts ?? 3,
            recovery_seconds: savedData.recovery_seconds ?? 7200,
            next_heart_time: savedData.next_heart_time ?? null,

            user_crystals: savedData.user_crystals ?? 0,
            reputation: savedData.reputation ?? 0,

            owned_items: Array.isArray(savedData.owned_items) ? savedData.owned_items : [],
            owned_collectibles: Array.isArray(savedData.owned_collectibles) ? savedData.owned_collectibles : [],
            placed_decorations: Array.isArray(savedData.placed_decorations) ? savedData.placed_decorations : [],

            equipped_hat: savedData.equipped_hat ?? 'none',
            equipped_cloth: savedData.equipped_cloth ?? 'none',
            equipped_fullset: savedData.equipped_fullset ?? 'none',
            equipped_collectible: savedData.equipped_collectible ?? 'none',

            minigame_stats: savedData.minigame_stats ?? {},
            bonus_play_counts: savedData.bonus_play_counts ?? {},
            bonus_reward_rates: savedData.bonus_reward_rates ?? {},
            bonus_drop_rates: savedData.bonus_drop_rates ?? {},

            secret_state: savedData.secret_state ?? {
                motherGuardUnlocked: false,
                motherGuardPendingReward: false,
                motherGuardSequence: [],
                motherGuardSequenceStartTime: 0
            },

            stage_progress: savedData.stage_progress ?? {}
        };

        this.registry.set('saveData', safeData);

        this.registry.set('hearts', safeData.hearts);
        this.registry.set('max_hearts', safeData.max_hearts);
        this.registry.set('recovery_seconds', safeData.recovery_seconds);
        this.registry.set('next_heart_time', safeData.next_heart_time);

        this.registry.set('user_crystals', safeData.user_crystals);
        this.registry.set('reputation', safeData.reputation);

        this.registry.set('owned_items', safeData.owned_items);
        this.registry.set('owned_collectibles', safeData.owned_collectibles);
        this.registry.set('placed_decorations', safeData.placed_decorations);

        this.registry.set('equipped_hat', safeData.equipped_hat);
        this.registry.set('equipped_cloth', safeData.equipped_cloth);
        this.registry.set('equipped_fullset', safeData.equipped_fullset);
        this.registry.set('equipped_collectible', safeData.equipped_collectible);

        this.registry.set('minigame_stats', safeData.minigame_stats);
        this.registry.set('bonus_play_counts', safeData.bonus_play_counts);
        this.registry.set('bonus_reward_rates', safeData.bonus_reward_rates);
        this.registry.set('bonus_drop_rates', safeData.bonus_drop_rates);

        this.registry.set('secret_state', safeData.secret_state);
        this.registry.set('stage_progress', safeData.stage_progress);

        console.log('✅ 初始化完成', {
            owned_items: this.registry.get('owned_items'),
            owned_collectibles: this.registry.get('owned_collectibles'),
            equipped_hat: this.registry.get('equipped_hat'),
            equipped_cloth: this.registry.get('equipped_cloth'),
            equipped_fullset: this.registry.get('equipped_fullset'),
            equipped_collectible: this.registry.get('equipped_collectible')
        });

        this.scene.start('PreloadScene');
    }
}