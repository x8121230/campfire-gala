// src/systems/BushDangerSystem.js

import { BUSH_DANGER_EFFECTS } from '../data/BushExploreData.js';

export default class BushDangerSystem {
    static applyDanger(scene, tile) {
        const effect = BUSH_DANGER_EFFECTS[tile.tileType];
        if (!effect) return null;

        if (typeof effect.staminaDelta === 'number') {
            scene.gameState.stamina += effect.staminaDelta;
        }

        // 蜘蛛網新版：隨機扣 1~2 次挖掘次數
        if (
            typeof effect.digLossMin === 'number' &&
            typeof effect.digLossMax === 'number'
        ) {
            const loss = Phaser.Math.Between(effect.digLossMin, effect.digLossMax);

            scene.gameState.digsUsed += loss;
            effect.actualDigLoss = loss;
        } else {
            effect.actualDigLoss = 0;
        }

        scene.gameState.dangerousTilesTriggered =
            (scene.gameState.dangerousTilesTriggered || 0) + 1;

        scene.gameState.combo = 0;

        return effect;
    }

    static isDangerTile(tile) {
        return !!BUSH_DANGER_EFFECTS[tile.tileType];
    }

    static checkFail(scene) {
        return scene.gameState.stamina <= 0;
    }
}