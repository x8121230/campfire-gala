// src/systems/CollectibleSystem.js
import { COLLECTIBLE_DB } from '../data/CollectibleData.js';

export default class CollectibleSystem {
    static getOwnedCollectibles(registry) {
        return registry.get('owned_collectibles') || [];
    }

    static saveOwnedCollectibles(registry, list) {
        registry.set('owned_collectibles', list);
    }

    static hasCollectible(registry, collectibleId) {
        const owned = this.getOwnedCollectibles(registry);
        return owned.includes(collectibleId);
    }

    static unlock(registry, collectibleId) {
        if (!COLLECTIBLE_DB[collectibleId]) {
            console.warn('[CollectibleSystem] 找不到收藏品資料:', collectibleId);
            return false;
        }

        const owned = this.getOwnedCollectibles(registry);

        if (owned.includes(collectibleId)) {
            return false;
        }

        owned.push(collectibleId);
        this.saveOwnedCollectibles(registry, owned);

        console.log('[CollectibleSystem] 解鎖收藏品:', collectibleId);
        return true;
    }

    static getOwnedCollectibleDataList(registry) {
        const owned = this.getOwnedCollectibles(registry);
        return owned
            .map(id => COLLECTIBLE_DB[id])
            .filter(Boolean);
    }

    // ===== 裝備中的收藏品 =====
    static getEquippedCollectibleId(registry) {
        return registry.get('equipped_collectible') || 'none';
    }

    static getEquippedCollectibleData(registry) {
        const equippedId = this.getEquippedCollectibleId(registry);

        if (!equippedId || equippedId === 'none') {
            return null;
        }

        return COLLECTIBLE_DB[equippedId] || null;
    }

    static equip(registry, collectibleId) {
        if (!collectibleId || collectibleId === 'none') {
            registry.set('equipped_collectible', 'none');
            return true;
        }

        if (!COLLECTIBLE_DB[collectibleId]) {
            console.warn('[CollectibleSystem] 找不到收藏品資料:', collectibleId);
            return false;
        }

        if (!this.hasCollectible(registry, collectibleId)) {
            console.warn('[CollectibleSystem] 尚未擁有此收藏品，不能裝備:', collectibleId);
            return false;
        }

        // 同時間只能裝備一個，直接覆蓋
        registry.set('equipped_collectible', collectibleId);
        console.log('[CollectibleSystem] 已裝備收藏品:', collectibleId);
        return true;
    }

    static unequip(registry) {
        registry.set('equipped_collectible', 'none');
        console.log('[CollectibleSystem] 已卸下收藏品');
        return true;
    }

    static isEquipped(registry, collectibleId) {
        return this.getEquippedCollectibleId(registry) === collectibleId;
    }

    // ===== 目前啟用效果 =====
    static getActiveEffect(registry) {
        const collectible = this.getEquippedCollectibleData(registry);
        if (!collectible) return null;

        return collectible.effect || null;
    }

    static hasActiveSkill(registry, skillKey) {
        const effect = this.getActiveEffect(registry);
        if (!effect) return false;

        return effect.type === 'active_skill' && effect.skill === skillKey;
    }

    static getPassiveValue(registry, key, defaultValue = 0) {
        const effect = this.getActiveEffect(registry);
        if (!effect) return defaultValue;

        if (effect.type !== 'passive') return defaultValue;

        return effect[key] ?? defaultValue;
    }

    static isLazyRecoverEnabled(registry) {
        const effect = this.getActiveEffect(registry);
        if (!effect) return false;

        return effect.type === 'passive' && !!effect.lazyRecoverOnce;
    }

    // ===== 套用到場景 =====
    static applyToScene(scene) {
        if (!scene?.registry || !scene?.gameState) return null;

        const equipped = this.getEquippedCollectibleData(scene.registry);
        const effect = equipped?.effect || null;

        // 每局先重置
        scene.gameState.collectibleId = equipped?.id || 'none';
        scene.gameState.collectibleName = equipped?.name || '';
        scene.gameState.collectibleEffect = effect || null;

        scene.gameState.collectibleBonusDreamRate = 0;
        scene.gameState.collectibleBonusReputation = 0;
        scene.gameState.comboBufferLeft = 0;

        scene.gameState.lazyRecoverAvailable = false;
        scene.gameState.lazyRecoverCost = 5;
        scene.gameState.lazyRecoverAmount = 3;

        scene.gameState.collectibleSkillUses = {};
        scene.gameState.collectiblePreviewMode = false;

        if (!effect) {
            return null;
        }

        if (effect.type === 'passive') {
            scene.gameState.collectibleBonusDreamRate = effect.dreamChestBonus || 0;
            scene.gameState.collectibleBonusReputation = effect.bonusReputation || 0;
            scene.gameState.comboBufferLeft = effect.comboBuffer || 0;

            if (effect.lazyRecoverOnce) {
                scene.gameState.lazyRecoverAvailable = true;
                scene.gameState.lazyRecoverCost = effect.lazyRecoverCost || 5;
                scene.gameState.lazyRecoverAmount = effect.lazyRecoverAmount || 3;
            }
        }

        if (effect.type === 'active_skill' && effect.skill) {
            scene.gameState.collectibleSkillUses[effect.skill] = effect.uses || 1;
        }

        return effect;
    }

    static getSkillUsesLeft(scene, skillKey) {
        return scene?.gameState?.collectibleSkillUses?.[skillKey] || 0;
    }

    static canUseSkill(scene, skillKey) {
        return this.getSkillUsesLeft(scene, skillKey) > 0;
    }

    static consumeSkill(scene, skillKey) {
        const usesLeft = this.getSkillUsesLeft(scene, skillKey);
        if (usesLeft <= 0) return false;

        scene.gameState.collectibleSkillUses[skillKey] -= 1;
        return true;
    }
}