// src/systems/StageManager.js

import SaveSystem from './SaveSystem.js';
import { getStageData, STAGE_DATA } from '../data/StageData.js';
import { DEFAULT_STAGE_PROGRESS, getItemEffect } from '../data/GameData.js';

export default class StageManager {
    static applyToRegistry(registry) {
        let stageProgress = registry.get('stage_progress');

        if (!stageProgress) {
            stageProgress = {};
        }

        let changed = false;

        // 先補 GameData 預設關卡
        for (const stageId in DEFAULT_STAGE_PROGRESS) {
            if (!stageProgress[stageId]) {
                stageProgress[stageId] = { ...DEFAULT_STAGE_PROGRESS[stageId] };
                changed = true;
            }
        }

        // 再補 StageData 內有、但 stage_progress 還沒有的關卡
        for (const stageId in STAGE_DATA) {
            if (!stageProgress[stageId]) {
                stageProgress[stageId] = {
                    unlocked: false,
                    cleared: false,
                    stars: 0,
                    bestScore: 0,
                    firstClearRewardClaimed: false
                };
                changed = true;
            }
        }

        if (changed || !registry.get('stage_progress')) {
            registry.set('stage_progress', stageProgress);
        }
    }

    static ensureStageProgressExists(registry, stageId) {
        let stageProgress = registry.get('stage_progress') || {};

        if (!stageProgress[stageId]) {
            stageProgress[stageId] = {
                unlocked: false,
                cleared: false,
                stars: 0,
                bestScore: 0,
                firstClearRewardClaimed: false
            };
            registry.set('stage_progress', stageProgress);
        }

        return stageProgress[stageId];
    }

    static getEquippedFullsetId(registry) {
        return registry.get('equipped_fullset') || 'none';
    }

    static hasIgnoreReputationLock(registry) {
        const equippedFullset = this.getEquippedFullsetId(registry);
        if (!equippedFullset || equippedFullset === 'none') return false;

        return getItemEffect(equippedFullset, 'ignoreReputationLock') > 0;
    }

    static hasNoHeartCost(registry) {
        const equippedFullset = this.getEquippedFullsetId(registry);
        if (!equippedFullset || equippedFullset === 'none') return false;

        return getItemEffect(equippedFullset, 'noHeartCost') > 0;
    }

    static syncUnlockState(registry, stageId) {
        const stageData = getStageData(stageId);
        if (!stageData) return false;

        let stageProgress = registry.get('stage_progress') || {};
        const rep = registry.get('reputation') || 0;

        if (!stageProgress[stageId]) {
            stageProgress[stageId] = {
                unlocked: false,
                cleared: false,
                stars: 0,
                bestScore: 0,
                firstClearRewardClaimed: false
            };
        }

        const ignoreReputationLock = this.hasIgnoreReputationLock(registry);
        const shouldUnlock = ignoreReputationLock || rep >= (stageData.unlockReputation || 0);

        if (shouldUnlock) {
            stageProgress[stageId].unlocked = true;
        }

        registry.set('stage_progress', stageProgress);
        return stageProgress[stageId].unlocked;
    }

    static isUnlocked(registry, stageId) {
        return !!this.syncUnlockState(registry, stageId);
    }

    static isCleared(registry, stageId) {
        const stage = this.ensureStageProgressExists(registry, stageId);
        return !!stage.cleared;
    }

    static getStageStars(registry, stageId) {
        const stage = this.ensureStageProgressExists(registry, stageId);
        return stage.stars || 0;
    }

    static getStageBestScore(registry, stageId) {
        const stage = this.ensureStageProgressExists(registry, stageId);
        return stage.bestScore || 0;
    }

    static canEnterStage(registry, stageId) {
        const stageData = getStageData(stageId);
        if (!stageData) {
            return {
                ok: false,
                reason: 'stage_not_found',
                message: '找不到關卡資料'
            };
        }

        const ignoreReputationLock = this.hasIgnoreReputationLock(registry);
        const noHeartCost = this.hasNoHeartCost(registry);

        const rep = registry.get('reputation') || 0;
        const requiredRep = stageData.unlockReputation || 0;

        if (!ignoreReputationLock && rep < requiredRep) {
            return {
                ok: false,
                reason: 'locked',
                message: `需要聲望 ${requiredRep} 才能解鎖`
            };
        }

        const hearts = registry.get('hearts') || 0;
        const staminaCost = stageData.staminaCost || 0;

        if (!noHeartCost && hearts < staminaCost) {
            return {
                ok: false,
                reason: 'not_enough_hearts',
                message: '體力不足'
            };
        }

        return {
            ok: true,
            reason: 'ok',
            message: '可以進入關卡'
        };
    }

    static consumeStageCost(registry, stageId) {
        const stageData = getStageData(stageId);
        if (!stageData) return false;

        const noHeartCost = this.hasNoHeartCost(registry);
        if (noHeartCost) {
            SaveSystem.saveFromRegistry(registry);
            return true;
        }

        const staminaCost = stageData.staminaCost || 0;
        let hearts = registry.get('hearts') || 0;

        if (hearts < staminaCost) return false;

        hearts -= staminaCost;
        registry.set('hearts', hearts);

        SaveSystem.saveFromRegistry(registry);
        return true;
    }

    static enterStage(scene, stageId) {
        SaveSystem.applyToRegistry(scene.registry);
        this.applyToRegistry(scene.registry);

        const stageData = getStageData(stageId);
        if (!stageData) {
            console.warn('❌ 找不到關卡資料', stageId);
            return false;
        }

        const result = this.canEnterStage(scene.registry, stageId);

        if (!result.ok) {
            console.warn('❌ 無法進入關卡:', result.message);

            if (scene.showMessage) {
                scene.showMessage(result.message);
            } else {
                alert(result.message);
            }
            return false;
        }

        const success = this.consumeStageCost(scene.registry, stageId);
        if (!success) {
            console.warn('❌ 扣體力失敗');
            return false;
        }

        scene.scene.start(stageData.scene, {
            stageId: stageData.id,
            stageData
        });

        return true;
    }

    static completeStage(registry, stageId, score = 0, stars = 0) {
        let stageProgress = registry.get('stage_progress') || {};

        if (!stageProgress[stageId]) {
            stageProgress[stageId] = {
                unlocked: true,
                cleared: false,
                stars: 0,
                bestScore: 0,
                firstClearRewardClaimed: false
            };
        }

        const stage = stageProgress[stageId];
        const stageData = getStageData(stageId);

        stage.cleared = true;
        stage.unlocked = true;
        stage.bestScore = Math.max(stage.bestScore || 0, score);
        stage.stars = Math.max(stage.stars || 0, stars);

        // 解鎖下一關
        if (stageData?.nextStage) {
            if (!stageProgress[stageData.nextStage]) {
                stageProgress[stageData.nextStage] = {
                    unlocked: true,
                    cleared: false,
                    stars: 0,
                    bestScore: 0,
                    firstClearRewardClaimed: false
                };
            } else {
                stageProgress[stageData.nextStage].unlocked = true;
            }
        }

        registry.set('stage_progress', stageProgress);
        SaveSystem.saveFromRegistry(registry);
    }

    static calculateStars(stageData, score) {
        if (!stageData?.starConditions) return 0;

        let stars = 0;
        if (score >= stageData.starConditions.one) stars = 1;
        if (score >= stageData.starConditions.two) stars = 2;
        if (score >= stageData.starConditions.three) stars = 3;

        return stars;
    }

    static applyStageResult(registry, stageId, score = 0) {
        const stageData = getStageData(stageId);

        if (!stageData) {
            return {
                success: false,
                message: '找不到關卡資料',
                stageId,
                score: 0,
                stars: 0,
                unlockedNextStage: null
            };
        }

        const stars = this.calculateStars(stageData, score);

        let stageProgress = registry.get('stage_progress') || {};

        if (!stageProgress[stageId]) {
            stageProgress[stageId] = {
                unlocked: true,
                cleared: false,
                stars: 0,
                bestScore: 0,
                firstClearRewardClaimed: false
            };
        }

        const stage = stageProgress[stageId];
        const oldStars = stage.stars || 0;
        const oldBestScore = stage.bestScore || 0;

        stage.unlocked = true;
        stage.cleared = true;
        stage.bestScore = Math.max(oldBestScore, score);
        stage.stars = Math.max(oldStars, stars);

        let unlockedNextStage = null;

        if (stageData.nextStage) {
            unlockedNextStage = stageData.nextStage;

            if (!stageProgress[stageData.nextStage]) {
                stageProgress[stageData.nextStage] = {
                    unlocked: true,
                    cleared: false,
                    stars: 0,
                    bestScore: 0,
                    firstClearRewardClaimed: false
                };
            } else {
                stageProgress[stageData.nextStage].unlocked = true;
            }
        }

        registry.set('stage_progress', stageProgress);
        SaveSystem.saveFromRegistry(registry);

        return {
            success: true,
            message: '關卡完成',
            stageId,
            score,
            stars,
            bestScore: stage.bestScore,
            totalStars: stage.stars,
            isNewRecord: score > oldBestScore,
            isNewStarRecord: stars > oldStars,
            unlockedNextStage
        };
    }
}