// src/systems/StageProgressSystem.js
import { getStageData } from '../data/StageData.js';

function getStageProgress(registry) {
    return registry.get('stage_progress') || {};
}

function setStageProgress(registry, progress) {
    registry.set('stage_progress', progress);
}

function calculateStars(stageData, score) {
    if (!stageData || !stageData.starConditions) return 0;

    let stars = 0;

    if (score >= stageData.starConditions.one) stars = 1;
    if (score >= stageData.starConditions.two) stars = 2;
    if (score >= stageData.starConditions.three) stars = 3;

    return stars;
}

export function applyStageResult(registry, { stageId, score }) {
    const stageData = getStageData(stageId);
    const progress = getStageProgress(registry);

    if (!progress[stageId]) {
        progress[stageId] = {
            unlocked: true,
            cleared: false,
            stars: 0,
            bestScore: 0,
            firstClearRewardClaimed: false
        };
    }

    const stageProgress = progress[stageId];
    const starsEarned = calculateStars(stageData, score);
    const oldBestScore = stageProgress.bestScore || 0;
    const oldStars = stageProgress.stars || 0;
    const isFirstClear = !stageProgress.cleared && score > 0;

    stageProgress.cleared = stageProgress.cleared || score > 0;
    stageProgress.bestScore = Math.max(oldBestScore, score);
    stageProgress.stars = Math.max(oldStars, starsEarned);

    const unlockedStages = [];

    if (stageData?.nextStageId) {
        if (!progress[stageData.nextStageId]) {
            progress[stageData.nextStageId] = {
                unlocked: true,
                cleared: false,
                stars: 0,
                bestScore: 0,
                firstClearRewardClaimed: false
            };
        } else {
            progress[stageData.nextStageId].unlocked = true;
        }

        unlockedStages.push(stageData.nextStageId);
    }

    setStageProgress(registry, progress);

    return {
        stageId,
        score,
        starsEarned,
        bestScore: stageProgress.bestScore,
        totalStars: stageProgress.stars,
        isFirstClear,
        unlockedStages
    };
}