// src/systems/BushRewardSystem.js
import { ITEM_DB } from '../data/GameData.js';
import { DROP_CONFIG } from '../data/DropConfig.js';
import { rollTable } from '../utils/DropHelper.js';

export default class BushRewardSystem {
    static buildClearReward(levelData, gameState = {}) {
        const stars = this.getAdjustedStars(gameState);
        const gotGoldBush = !!gameState?.gotGoldBush;

        const baseClear = DROP_CONFIG?.base?.clear || { crystals: 0, reputation: 1 };
        const goldBonus = DROP_CONFIG?.base?.goldBonus || { crystals: 1, reputation: 1 };

        const reward = {
            crystals: baseClear.crystals || 0,
            reputation: baseClear.reputation || 0,

            // 舊欄位保留
            chest: 0,          // 小寶箱
            rareChest: 0,      // 大寶箱
            pityChest: 0,      // 目前停用
            stageChest: 1,     // 通關固定給

            // 新概念
            dreamChest: 0,
            gotGoldBush,
            fruitTotalLv: 0,
            rareChestChance: 0,
            stars,
            originalStars: gameState?.stars ?? stars,

            itemDrops: [],
            chestLootLines: [],
            chestBonusCrystals: 0,
            chestBonusReputation: 0,
            chestBonusItems: 0,

            extraRewards: [],
            dreamUpgraded: false,

            goldType: null,
            goldEventType: null,
            rainbowBonus: false,
            eventBonus: false,
            kingBugFound: false
        };

        // 找到金草叢追加
        if (gotGoldBush) {
            reward.crystals += goldBonus.crystals || 0;
            reward.reputation += goldBonus.reputation || 0;
        }

        // 主寶箱規則
        if (stars === 1) {
            reward.chest = 1;
        } else if (stars === 2) {
            reward.chest = 1;
        } else if (stars >= 3 && gotGoldBush) {
            reward.rareChest = 1;
        } else if (stars >= 3) {
            reward.chest = 1;
        }

        return reward;
    }

    static buildFailReward(levelData, gameState = {}) {
        const baseFail = DROP_CONFIG?.base?.fail || { crystals: 0, reputation: 0 };

        return {
            crystals: baseFail.crystals || 0,
            reputation: baseFail.reputation || 0,

            chest: 0,
            rareChest: 0,
            pityChest: 0,
            stageChest: 0,
            dreamChest: 0,

            gotGoldBush: false,
            fruitTotalLv: 0,
            rareChestChance: 0,
            stars: 0,
            originalStars: gameState?.stars ?? 0,

            itemDrops: [],
            chestLootLines: [],
            chestBonusCrystals: 0,
            chestBonusReputation: 0,
            chestBonusItems: 0,

            extraRewards: [],
            dreamUpgraded: false,

            goldType: null,
            goldEventType: null,
            rainbowBonus: false,
            eventBonus: false,
            kingBugFound: false
        };
    }

    static getAdjustedStars(gameState = {}) {
        const originalStars = gameState?.stars ?? 0;
        const gotGoldBush = !!gameState?.gotGoldBush;

        if (originalStars >= 3 && !gotGoldBush) {
            return 2;
        }

        return originalStars;
    }

    static rollConfigTable(table = []) {
        return rollTable(table);
    }

    static getDreamChestChance({ stars = 0, totalFruitLv = 0, hasRainbowGrass = false } = {}) {
        if (hasRainbowGrass) return 1;

        let chance = 0;

        if (stars <= 1) {
            chance = 0.05;
        } else if (stars === 2) {
            chance = 0.15;
        } else {
            chance = 0.25;
        }

        // fruitLv 小幅加成，最多 +10%
        chance += Math.min(totalFruitLv * 0.01, 0.10);

        return chance;
    }

    static applyFruitLvChestBonus(reward, gameState = {}, scene = null) {
        const totalFruitLv = scene?.calculateCollectedFruitLv
            ? scene.calculateCollectedFruitLv()
            : 0;

        const hasRainbowGrass = !!gameState?.hasRainbowGrass;
        const stars = reward?.stars ?? gameState?.stars ?? 0;

        const dreamChance = this.getDreamChestChance({
            stars,
            totalFruitLv,
            hasRainbowGrass
        });

        reward.fruitTotalLv = totalFruitLv;
        reward.rareChestChance = dreamChance;

        // 優先升級大寶箱
        if ((reward.rareChest || 0) > 0) {
            let upgraded = 0;
            let remainBig = 0;

            for (let i = 0; i < reward.rareChest; i++) {
                if (Math.random() < dreamChance) {
                    upgraded += 1;
                } else {
                    remainBig += 1;
                }
            }

            reward.rareChest = remainBig;
            reward.dreamChest = (reward.dreamChest || 0) + upgraded;
            if (upgraded > 0) reward.dreamUpgraded = true;

            return reward;
        }

        // 沒有大寶箱時，才升級小寶箱
        if ((reward.chest || 0) > 0) {
            let upgraded = 0;
            let remainSmall = 0;

            for (let i = 0; i < reward.chest; i++) {
                if (Math.random() < dreamChance) {
                    upgraded += 1;
                } else {
                    remainSmall += 1;
                }
            }

            reward.chest = remainSmall;
            reward.dreamChest = (reward.dreamChest || 0) + upgraded;
            if (upgraded > 0) reward.dreamUpgraded = true;
        }

        return reward;
    }

    static getItemPoolByGameKey(gameKey = 'bush', rarity = 'rare') {
        return Object.values(ITEM_DB)
            .filter(item => item.category === 'equipment')
            .filter(item => this.matchItemRarity(item, rarity))
            .filter(item => item.source !== 'secret')
            .filter(item => item.source !== 'starter')
            .filter(item => {
                if (rarity === 'stage') {
                    return item.source === gameKey;
                }

                if (item.source === 'global') return true;

                return item.source === gameKey;
            })
            .map(item => item.id);
    }

    static matchItemRarity(item, rarity) {
        if (!item) return false;
        return item.rarity === rarity;
    }

    static applyTableResult(reward, result, gameKey = 'bush') {
        if (!reward || !result) return reward;

        reward.itemDrops = reward.itemDrops || [];
        reward.chestLootLines = reward.chestLootLines || [];

        if (result.type === 'crystals') {
            reward.crystals = (reward.crystals || 0) + (result.amount || 0);
            reward.chestBonusCrystals = (reward.chestBonusCrystals || 0) + (result.amount || 0);

            if ((result.amount || 0) > 0) {
                reward.chestLootLines.push(`💎 +${result.amount}`);
            }

            return reward;
        }

        if (result.type === 'reputation') {
            reward.reputation = (reward.reputation || 0) + (result.amount || 0);
            reward.chestBonusReputation = (reward.chestBonusReputation || 0) + (result.amount || 0);

            if ((result.amount || 0) > 0) {
                reward.chestLootLines.push(`⭐ +${result.amount}`);
            }

            return reward;
        }

        if (result.type === 'bundle') {
            const crystalAmount = result.crystals || 0;
            const reputationAmount = result.reputation || 0;

            reward.crystals = (reward.crystals || 0) + crystalAmount;
            reward.reputation = (reward.reputation || 0) + reputationAmount;

            reward.chestBonusCrystals = (reward.chestBonusCrystals || 0) + crystalAmount;
            reward.chestBonusReputation = (reward.chestBonusReputation || 0) + reputationAmount;

            const parts = [];
            if (crystalAmount > 0) parts.push(`💎 +${crystalAmount}`);
            if (reputationAmount > 0) parts.push(`⭐ +${reputationAmount}`);

            if (parts.length > 0) {
                reward.chestLootLines.push(parts.join(' '));
            }

            return reward;
        }

        if (result.type === 'item') {
            const rarity = result.rarity || 'rare';
            const itemPool = this.getItemPoolByGameKey(gameKey, rarity);

            if (itemPool.length > 0) {
                const itemId = Phaser.Utils.Array.GetRandom(itemPool);
                reward.itemDrops.push(itemId);
                reward.chestBonusItems = (reward.chestBonusItems || 0) + 1;

                const icon = this.getLootIconByRarity(rarity);
                reward.chestLootLines.push(`${icon} +1`);
            } else {
                console.warn('[BushRewardSystem] 找不到可掉落裝備池', { gameKey, rarity });
            }

            return reward;
        }

        return reward;
    }

    static applyGuaranteedReward(reward, guaranteed = {}) {
        if (!reward || !guaranteed) return reward;

        const crystalAmount = guaranteed.crystals || 0;
        const reputationAmount = guaranteed.reputation || 0;

        if (crystalAmount > 0) {
            reward.crystals = (reward.crystals || 0) + crystalAmount;
            reward.chestBonusCrystals = (reward.chestBonusCrystals || 0) + crystalAmount;
            reward.chestLootLines.push(`💎 +${crystalAmount}`);
        }

        if (reputationAmount > 0) {
            reward.reputation = (reward.reputation || 0) + reputationAmount;
            reward.chestBonusReputation = (reward.chestBonusReputation || 0) + reputationAmount;
            reward.chestLootLines.push(`⭐ +${reputationAmount}`);
        }

        return reward;
    }

    static applyConfiguredChest(reward, configKey, gameKey = 'bush') {
        const chestConfig = DROP_CONFIG?.[configKey];
        if (!chestConfig) {
            console.warn('[BushRewardSystem] chest config 不存在:', configKey);
            return reward;
        }

        if (Array.isArray(chestConfig)) {
            const result = this.rollConfigTable(chestConfig);
            return this.applyTableResult(reward, result, gameKey);
        }

        if (chestConfig.guaranteed) {
            this.applyGuaranteedReward(reward, chestConfig.guaranteed);
        }

        if (Array.isArray(chestConfig.table)) {
            const result = this.rollConfigTable(chestConfig.table);
            return this.applyTableResult(reward, result, gameKey);
        }

        console.warn('[BushRewardSystem] chest config 格式錯誤:', configKey, chestConfig);
        return reward;
    }

    static resolveChestLoot(reward, gameKey = 'bush', gameState = {}) {
        reward.itemDrops = reward.itemDrops || [];
        reward.chestLootLines = reward.chestLootLines || [];
        reward.extraRewards = reward.extraRewards || [];

        const stageChestCount = reward.stageChest || 0;
        const smallChestCount = reward.chest || 0;
        const bigChestCount = reward.rareChest || 0;
        const pityChestCount = reward.pityChest || 0;
        const dreamChestCount = reward.dreamChest || 0;

        for (let i = 0; i < stageChestCount; i++) {
            this.applyConfiguredChest(reward, 'stageChest', gameKey);
        }

        for (let i = 0; i < smallChestCount; i++) {
            this.rollSmallChestLoot(reward, gameKey);
        }

        for (let i = 0; i < bigChestCount; i++) {
            this.rollBigChestLoot(reward, gameKey);
        }

        for (let i = 0; i < pityChestCount; i++) {
            this.rollPityChestLoot(reward, gameKey);
        }

        for (let i = 0; i < dreamChestCount; i++) {
            this.rollDreamChestLoot(reward, gameKey);
        }

        if (gameState?.hasKingBug) {
            this.rollKingBugBonus(reward);
        }

        return reward;
    }

    static rollSmallChestLoot(reward, gameKey = 'bush') {
        return this.applyConfiguredChest(reward, 'smallChest', gameKey);
    }

    static rollBigChestLoot(reward, gameKey = 'bush') {
        return this.applyConfiguredChest(reward, 'bigChest', gameKey);
    }

    static rollPityChestLoot(reward, gameKey = 'bush') {
        if (!DROP_CONFIG?.pityChest) return reward;
        return this.applyConfiguredChest(reward, 'pityChest', gameKey);
    }

    static rollDreamChestLoot(reward, gameKey = 'bush') {
        return this.applyConfiguredChest(reward, 'dreamChest', gameKey);
    }

    static rollKingBugBonus(reward) {
        const crownChance = DROP_CONFIG?.special?.kingBug?.crownChance ?? 0.35;
        const roll = Math.random();

        if (roll <= crownChance) {
            const crownId = 'item_hat_little_crown_special';

            if (ITEM_DB?.[crownId]) {
                reward.itemDrops.push(crownId);
                reward.chestBonusItems = (reward.chestBonusItems || 0) + 1;
                reward.extraRewards = reward.extraRewards || [];
                reward.extraRewards.push({
                    type: 'item',
                    itemId: crownId,
                    source: 'kingBugBonus'
                });
                reward.chestLootLines.push('👑 國王蟲的禮物');
            }
        }

        return reward;
    }

    static getLootIconByRarity(rarity) {
        if (rarity === 'common') return '🎀';
        if (rarity === 'rare') return '🎁';
        if (rarity === 'stage') return '🗺️';
        if (rarity === 'dream') return '🌈';
        if (rarity === 'myth') return '✨';
        if (rarity === 'legendary') return '👑';
        return '🎀';
    }
}