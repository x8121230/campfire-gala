// src/systems/BushBugSystem.js

import { BUSH_TILE_TYPES, BUSH_BUG_TYPES } from '../data/BushExploreData.js';

export default class BushBugSystem {
    static rollBugByWeights(weightMap) {
        const entries = Object.entries(weightMap || {});
        if (entries.length <= 0) return 'green';

        const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
        if (totalWeight <= 0) return 'green';

        let roll = Math.random() * totalWeight;

        for (const [bugId, weight] of entries) {
            roll -= weight;
            if (roll <= 0) return bugId;
        }

        return entries[0][0] || 'green';
    }

    static assignBugToDugNormalTile(tile, levelData) {
        if (!tile || tile.tileType !== BUSH_TILE_TYPES.NORMAL) return null;

        const bugId = this.rollBugByWeights(levelData.bugWeights);
        tile.bugId = bugId;
        tile.spawnedFromUndug = false;

        return bugId;
    }

    static spawnSpecialBugsFromUndugGrass(tiles, levelData) {
        for (const tile of tiles) {
            if (tile.isDug) continue;
            if (tile.tileType !== BUSH_TILE_TYPES.NORMAL) continue;
            if (tile.bugId) continue;

            const roll = Math.random();
            if (roll <= levelData.specialBugChanceFromUndugGrass) {
                tile.bugId = this.rollSpecialBug();
                tile.spawnedFromUndug = true;
            }
        }
    }

    static rollSpecialBug() {
        const pool = ['big', 'big', 'poison'];
        return Phaser.Utils.Array.GetRandom(pool);
    }

    static spawnGuaranteedSpecialBugIfGoldMissed(tiles) {
        const undugNormalTiles = tiles.filter(t =>
            !t.isDug &&
            t.tileType === BUSH_TILE_TYPES.NORMAL &&
            !t.bugId
        );

        if (undugNormalTiles.length <= 0) return null;

        const target = Phaser.Utils.Array.GetRandom(undugNormalTiles);
        target.bugId = this.rollSpecialBug();
        target.spawnedFromUndug = true;

        return target;
    }

    static getBugSummary(tiles) {
        const summary = {
            green: 0,
            red: 0,
            blue: 0,
            big: 0,
            poison: 0,
            totalCountValue: 0,
            totalBugTiles: 0
        };

        for (const tile of tiles) {
            if (!tile.bugId) continue;

            summary[tile.bugId] += 1;
            summary.totalBugTiles += 1;
            summary.totalCountValue += BUSH_BUG_TYPES[tile.bugId].countValue;
        }

        return summary;
    }
}
