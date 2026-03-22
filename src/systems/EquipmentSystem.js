// src/systems/EquipmentSystem.js
import { ITEM_DB } from '../data/GameData.js';

export default class EquipmentSystem {
    /**
     * 取得目前裝備
     */
    static getEquippedItems(registry) {
        return {
            hat: registry.get('equipped_hat') ?? 'none',
            cloth: registry.get('equipped_cloth') ?? 'none',
            fullset: registry.get('equipped_fullset') ?? 'none'
        };
    }

    /**
     * 取得道具資料
     */
    static getItemData(itemId) {
        if (!itemId || itemId === 'none') return null;
        return ITEM_DB[itemId] || null;
    }

    /**
     * 安全取得數值效果
     */
    static getNumberEffect(effects, key) {
        if (!effects) return 0;
        const value = effects[key];
        return typeof value === 'number' ? value : 0;
    }

    /**
     * 安全取得布林／開關效果
     * 兼容 1 / true
     */
    static getBooleanEffect(effects, key) {
        if (!effects) return false;
        return effects[key] === true || effects[key] === 1;
    }

    /**
     * 計算目前裝備提供的總加成
     */
    static getTotalBonus(registry) {
        const equipped = this.getEquippedItems(registry);
        const equippedIds = [equipped.hat, equipped.cloth, equipped.fullset];

        let rewardRate = 0;
        let dropRate = 0;
        let extraPlayCount = 0;
        let maxHearts = 0;

        let freeMinigameEntry = false;
        let freeStageEntry = false;
        let reviveOnce = false;

        let reviveCost = 0;
        let reviveHearts = 0;

        equippedIds.forEach((itemId) => {
            if (!itemId || itemId === 'none') return;

            const item = this.getItemData(itemId);
            if (!item || !item.effects) return;

            const effects = item.effects;

            rewardRate += this.getNumberEffect(effects, 'rewardRate');
            dropRate += this.getNumberEffect(effects, 'dropRate');
            extraPlayCount += this.getNumberEffect(effects, 'extraPlayCount');
            maxHearts += this.getNumberEffect(effects, 'maxHearts');

            // 舊版 / 新版都兼容
            if (
                this.getBooleanEffect(effects, 'freeMinigameEntry') ||
                this.getBooleanEffect(effects, 'noHeartCost')
            ) {
                freeMinigameEntry = true;
            }

            if (
                this.getBooleanEffect(effects, 'freeStageEntry') ||
                this.getBooleanEffect(effects, 'ignoreStageRequirement') ||
                this.getBooleanEffect(effects, 'ignoreReputationRequirement') ||
                this.getBooleanEffect(effects, 'ignoreReputationLock')
            ) {
                freeStageEntry = true;
            }

            if (this.getBooleanEffect(effects, 'reviveOnce')) {
                reviveOnce = true;
            }

            reviveCost = Math.max(
                reviveCost,
                this.getNumberEffect(effects, 'reviveCost')
            );

            reviveHearts = Math.max(
                reviveHearts,
                this.getNumberEffect(effects, 'reviveHearts')
            );
        });

        return {
            rewardRate,
            dropRate,
            extraPlayCount,
            maxHearts,
            freeMinigameEntry,
            freeStageEntry,
            reviveOnce,
            reviveCost,
            reviveHearts
        };
    }

    /**
     * 把加成結果寫回 registry
     * 只更新 bonus 欄位，不碰 equipped_* 欄位
     */
    static applyBonusToRegistry(registry) {
        const totalBonus = this.getTotalBonus(registry);

        registry.set('bonus_reward_rates', {
            equipment: totalBonus.rewardRate
        });

        registry.set('bonus_drop_rates', {
            equipment: totalBonus.dropRate
        });

        registry.set('bonus_play_counts', {
            equipment: totalBonus.extraPlayCount
        });

        registry.set('bonus_max_hearts', {
            equipment: totalBonus.maxHearts
        });

        registry.set('bonus_special_rules', {
            freeMinigameEntry: totalBonus.freeMinigameEntry,
            freeStageEntry: totalBonus.freeStageEntry,
            reviveOnce: totalBonus.reviveOnce,
            reviveCost: totalBonus.reviveCost,
            reviveHearts: totalBonus.reviveHearts
        });

        console.log('✨ 套用裝備加成', totalBonus);
    }

    /**
     * 給 UI 顯示的裝備效果摘要
     */
    static getBonusSummaryText(registry) {
        const totalBonus = this.getTotalBonus(registry);
        const lines = [];

        if (totalBonus.extraPlayCount > 0) {
            lines.push(`今天可以多玩 ${totalBonus.extraPlayCount} 次`);
        }

        if (totalBonus.rewardRate > 0) {
            const percent = Math.round(totalBonus.rewardRate);
            lines.push(`寶箱獎勵變多了（+${percent}%）`);
        }

        if (totalBonus.dropRate > 0) {
            const percent = Math.round(totalBonus.dropRate);
            lines.push(`更容易找到好東西（+${percent}%）`);
        }

        if (totalBonus.maxHearts > 0) {
            lines.push(`體力上限增加 ${totalBonus.maxHearts}`);
        }

        if (totalBonus.freeMinigameEntry) {
            lines.push('進入小遊戲不消耗體力');
        }

        if (totalBonus.freeStageEntry) {
            lines.push('進入關卡時無視聲望門檻');
        }

        if (totalBonus.reviveOnce) {
            const cost = totalBonus.reviveCost || 5;
            const hearts = totalBonus.reviveHearts || 3;
            lines.push(`本局可耍賴一次：消耗 ${cost} 聲望恢復 ${hearts} 體力`);
        }

        if (lines.length === 0) {
            return '目前沒有加成';
        }

        return lines.join('\n');
    }

    static getBonusSummaryLines(registry) {
        const totalBonus = this.getTotalBonus(registry);
        const lines = [];

        lines.push('收藏品');

        if (totalBonus.extraPlayCount > 0) {
            lines.push(`今天可以多玩 ${totalBonus.extraPlayCount} 次`);
        }

        if (totalBonus.rewardRate > 0) {
            const percent = Math.round(totalBonus.rewardRate);
            lines.push(`寶箱獎勵變多了（+${percent}%）`);
        }

        if (totalBonus.dropRate > 0) {
            const percent = Math.round(totalBonus.dropRate);
            lines.push(`更容易找到好東西（+${percent}%）`);
        }

        if (totalBonus.maxHearts > 0) {
            lines.push(`體力上限增加 ${totalBonus.maxHearts}`);
        }

        if (totalBonus.freeMinigameEntry) {
            lines.push('進入小遊戲不消耗體力');
        }

        if (totalBonus.freeStageEntry) {
            lines.push('進入關卡時無視聲望門檻');
        }

        if (totalBonus.reviveOnce) {
            const cost = totalBonus.reviveCost || 5;
            const hearts = totalBonus.reviveHearts || 3;
            lines.push(`可耍賴一次：-${cost} 聲望，+${hearts} 體力`);
        }

        if (lines.length === 1) {
            lines.push('目前沒有加成');
        }

        return lines;
    }

    /**
     * 發放道具
     * - 新裝備：加入 owned_items，並標記 new_items
     * - 重複裝備：不重複加入，改成 +1 水晶
     */
    static giveItem(registry, itemKey) {
        const itemData = ITEM_DB[itemKey];

        if (!itemData) {
            console.warn(`⚠️ giveItem 找不到道具資料：${itemKey}`);
            return {
                success: false,
                type: 'error',
                itemKey,
                itemData: null
            };
        }

        let owned = registry.get('owned_items');
        let crystals = registry.get('user_crystals');
        let newItems = registry.get('new_items');

        if (!Array.isArray(owned)) owned = [];
        if (typeof crystals !== 'number') crystals = 0;
        if (!Array.isArray(newItems)) newItems = [];

        const alreadyOwned = owned.includes(itemKey);

        if (alreadyOwned) {
            crystals += 1;
            registry.set('user_crystals', crystals);

            console.log(`💎 重複獲得 ${itemKey}，轉成 1 水晶，目前水晶：${crystals}`);

            return {
                success: true,
                type: 'crystal',
                amount: 1,
                itemKey,
                itemData,
                isDuplicate: true,
                isNew: false
            };
        }

        const newOwned = [...owned, itemKey];
        registry.set('owned_items', newOwned);

        if (!newItems.includes(itemKey)) {
            newItems.push(itemKey);
            registry.set('new_items', newItems);
        }

        console.log(`🎁 成功獲得新道具：${itemKey}`, newOwned);

        return {
            success: true,
            type: 'item',
            itemKey,
            itemData,
            amount: 0,
            isDuplicate: false,
            isNew: true
        };
    }

    /**
     * 是否擁有某個特殊效果
     */
    static hasEffect(registry, effectKey) {
        const totalBonus = this.getTotalBonus(registry);
        return totalBonus[effectKey] === true;
    }

    /**
     * 取得特殊規則資料
     */
    static getSpecialRules(registry) {
        const totalBonus = this.getTotalBonus(registry);
        return {
            freeMinigameEntry: totalBonus.freeMinigameEntry,
            freeStageEntry: totalBonus.freeStageEntry,
            reviveOnce: totalBonus.reviveOnce,
            reviveCost: totalBonus.reviveCost,
            reviveHearts: totalBonus.reviveHearts
        };
    }

    /**
     * 進入小遊戲前是否需要扣體力
     */
    static tryConsumeHeartForMinigame(registry, heartCost = 1) {
        const totalBonus = this.getTotalBonus(registry);
        let hearts = registry.get('hearts');

        if (typeof hearts !== 'number') hearts = 0;

        if (totalBonus.freeMinigameEntry) {
            return {
                success: true,
                consumed: false,
                reason: 'freeMinigameEntry',
                heartsLeft: hearts
            };
        }

        if (hearts < heartCost) {
            return {
                success: false,
                consumed: false,
                reason: 'not_enough_hearts',
                heartsLeft: hearts
            };
        }

        hearts -= heartCost;
        registry.set('hearts', hearts);

        return {
            success: true,
            consumed: true,
            reason: 'normal_cost',
            heartsLeft: hearts
        };
    }
}