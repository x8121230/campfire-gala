// src/systems/StageEntrySystem.js
import EquipmentSystem from './EquipmentSystem.js';

export default class StageEntrySystem {
    /**
     * 檢查是否可以進入關卡
     */
    static checkStageEntry(registry, stageData) {
        const reputation = registry.get('reputation') || 0;
        const hearts = registry.get('hearts') || 0;

        const requiredReputation = stageData.requiredReputation || 0;
        const heartCost = stageData.heartCost ?? 1;

        const bonus = EquipmentSystem.getTotalBonus(registry);

        const bypassReputation = !!bonus.freeStageEntry;
        const bypassHeart = !!bonus.freeMinigameEntry;

        const displayRequiredReputation = bypassReputation ? '已無視' : requiredReputation;
        const displayHeartCost = bypassHeart ? 0 : heartCost;

        // ===== 聲望檢查 =====
        if (!bypassReputation && reputation < requiredReputation) {
            return {
                success: false,
                reason: 'not_enough_reputation',

                requiredReputation,
                currentReputation: reputation,

                heartCost,
                currentHearts: hearts,

                bypassReputation,
                bypassHeart,

                displayRequiredReputation,
                displayHeartCost
            };
        }

        // ===== 體力檢查 =====
        if (!bypassHeart && hearts < heartCost) {
            return {
                success: false,
                reason: 'not_enough_hearts',

                requiredReputation,
                currentReputation: reputation,

                heartCost,
                currentHearts: hearts,

                bypassReputation,
                bypassHeart,

                displayRequiredReputation,
                displayHeartCost
            };
        }

        // ===== 可以進入 =====
        return {
            success: true,
            reason: 'ok',

            requiredReputation,
            currentReputation: reputation,

            heartCost,
            currentHearts: hearts,

            bypassReputation,
            bypassHeart,

            displayRequiredReputation,
            displayHeartCost
        };
    }

    /**
     * 玩家確認進入關卡時呼叫
     * 這時才真正扣體力
     */
    static consumeEntryCost(registry, stageData) {
        const heartCost = stageData.heartCost ?? 1;
        const bonus = EquipmentSystem.getTotalBonus(registry);

        if (bonus.freeMinigameEntry) {
            return {
                consumed: false,
                heartsLeft: registry.get('hearts') || 0,
                bypassHeart: true,
                displayHeartCost: 0
            };
        }

        let hearts = registry.get('hearts') || 0;

        hearts -= heartCost;

        if (hearts < 0) {
            hearts = 0;
        }

        registry.set('hearts', hearts);

        return {
            consumed: true,
            heartsLeft: hearts,
            bypassHeart: false,
            displayHeartCost: heartCost
        };
    }
}