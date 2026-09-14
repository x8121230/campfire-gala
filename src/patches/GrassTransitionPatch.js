// 五遊戲主題進場轉場補丁 v3.1
// 目前啟用：草叢探險、營火晚會、點點螢火。
// 採攔截原本 scene.start 的方式，保留 StageManager 現有檢查、消耗與存檔規則。

import StageManager from '../systems/StageManager.js';
import SceneTransitionManager from '../systems/SceneTransitionManager.js';

const PATCH_FLAG = Symbol.for('forest.game.stage-transition.v3');

function getTransitionType(stageId, targetSceneKey = '') {
    const stage = String(stageId || '').toLowerCase();
    const target = String(targetSceneKey || '').toLowerCase();

    if (stage.startsWith('bush_') || target === 'bushexplore') {
        return 'grassPart';
    }

    if (stage.startsWith('campfire_') || target.includes('campfire')) {
        return 'campfireGlow';
    }

    if (stage.startsWith('firefly_') || target.includes('firefly')) {
        return 'fireflyGlow';
    }

    return null;
}

if (!StageManager[PATCH_FLAG]) {
    const originalEnterStage = StageManager.enterStage;

    StageManager.enterStage = function patchedEnterStage(scene, stageId, ...args) {
        const expectedType = getTransitionType(stageId);

        if (!scene?.scene || !expectedType) {
            return originalEnterStage.call(this, scene, stageId, ...args);
        }

        // 雙擊確認或連點地圖時，只接受第一次進場要求。
        if (SceneTransitionManager.isBusy(scene)) {
            return false;
        }

        const scenePlugin = scene.scene;
        const originalStart = scenePlugin.start;
        const hadOwnStart = Object.prototype.hasOwnProperty.call(scenePlugin, 'start');
        let capturedStart = null;

        scenePlugin.start = function captureThemedStageStart(targetSceneKey, data) {
            const transitionType = getTransitionType(stageId, targetSceneKey);

            if (!capturedStart && transitionType) {
                capturedStart = {
                    transitionType,
                    targetSceneKey,
                    targetData: data || {}
                };
                return scene;
            }

            return originalStart.call(this, targetSceneKey, data);
        };

        let result;

        try {
            // 原方法照常完成檢查、消耗與存檔，只暫緩最後的換場。
            result = originalEnterStage.call(this, scene, stageId, ...args);
        } finally {
            if (hadOwnStart) {
                scenePlugin.start = originalStart;
            } else {
                delete scenePlugin.start;
            }
        }

        if (result !== false && capturedStart) {
            SceneTransitionManager.play(scene, {
                type: capturedStart.transitionType,
                stageId,
                targetSceneKey: capturedStart.targetSceneKey,
                targetData: capturedStart.targetData
            });
        }

        return result;
    };

    StageManager[PATCH_FLAG] = true;
    console.info('[SceneTransition] 草叢、營火與螢火主題轉場 v3.1 已啟用');
}
