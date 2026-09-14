// src/systems/BushMapSystem.js

export default class BushMapSystem {
    static createLevelMap(levelData = {}) {
        const gridSize = levelData.gridSize || 5;
        const totalTiles = gridSize * gridSize;

        // ===== 關卡配置（可被 levelData 覆蓋）=====
        const config = {
            goldCount: levelData.goldCount ?? 1,
            stoneCount: levelData.stoneCount ?? 1,

            snakeCount: levelData.snakeCount ?? 1,
            thornCount: levelData.thornCount ?? 1,
            boarCount: levelData.boarCount ?? 1,
            spiderwebCount: levelData.spiderwebCount ?? 1,

            // 目標正式果實數（P1 真正可挖出的）
            targetFruitCount: levelData.targetFruitCount ?? 9,

            // 果實種類權重
            fruitWeights: levelData.fruitWeights ?? {
                green: 30,
                red: 22,
                blue: 22,
                big: 14,
                poison: 8,
                bunch: 4
            }
        };

        // ===== 1) 建立空白地圖 =====
        const tiles = [];

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                tiles.push({
                    id: `tile_${row}_${col}`,
                    row,
                    col,

                    // 類型
                    tileType: 'normal', // normal / gold / stone / snake / thorn / boar / spiderweb

                    // 揭露狀態
                    isRevealed: false,
                    isFlagged: false,

                    // 普通草內容
                    bugId: null,
                    isEmpty: false,
                    isLv0Fruit: false,

                    // 金草資訊
                    goldType: null,
                    goldEventType: null,

                    // 提示
                    nearbyDangerCount: 0,
                    nearbyHints: [],

                    // 預覽技能用
                    isPreviewed: false
                });
            }
        }

        // 可被特殊格佔用的位置池
        const availableIndices = [...Array(totalTiles).keys()];

        const takeRandomIndex = () => {
            if (availableIndices.length <= 0) return null;

            const pick = Phaser.Utils.Array.GetRandom(availableIndices);
            const idx = availableIndices.indexOf(pick);

            if (idx >= 0) {
                availableIndices.splice(idx, 1);
            }

            return pick;
        };

        // ===== 2) 先放特殊格 =====

        // 金草叢
        for (let i = 0; i < config.goldCount; i++) {
            const index = takeRandomIndex();
            if (index == null) break;
            tiles[index].tileType = 'gold';
        }

        // 石頭
        for (let i = 0; i < config.stoneCount; i++) {
            const index = takeRandomIndex();
            if (index == null) break;
            tiles[index].tileType = 'stone';
        }

        // 危險格
        this.placeTileType(tiles, availableIndices, 'snake', config.snakeCount);
        this.placeTileType(tiles, availableIndices, 'thorn', config.thornCount);
        this.placeTileType(tiles, availableIndices, 'boar', config.boarCount);
        this.placeTileType(tiles, availableIndices, 'spiderweb', config.spiderwebCount);

        // ===== 3) 普通草中決定哪些是正式果實、哪些是空草 =====
        const normalTiles = tiles.filter(tile => tile.tileType === 'normal');

        const fruitCount = Math.min(config.targetFruitCount, normalTiles.length);
        const normalShuffled = Phaser.Utils.Array.Shuffle([...normalTiles]);
        const fruitTiles = normalShuffled.slice(0, fruitCount);

        // 先全部設成空草
        for (const tile of normalTiles) {
            tile.bugId = null;
            tile.isEmpty = true;
            tile.isLv0Fruit = false;
        }

        // 再指定正式果實
        for (const tile of fruitTiles) {
            tile.bugId = this.rollFruitId(config.fruitWeights);
            tile.isEmpty = false;
            tile.isLv0Fruit = false;
        }

        // ===== 4) 危險提示 =====
        this.applyDangerHints(tiles, gridSize);

        return tiles;
    }

    static placeTileType(tiles, availableIndices, tileType, count) {
        for (let i = 0; i < count; i++) {
            if (availableIndices.length <= 0) return;

            const pick = Phaser.Utils.Array.GetRandom(availableIndices);
            const idx = availableIndices.indexOf(pick);

            if (idx >= 0) {
                availableIndices.splice(idx, 1);
            }

            tiles[pick].tileType = tileType;
        }
    }

    static rollFruitId(weights = {}) {
        const pool = [
            { id: 'green', weight: weights.green ?? 30 },
            { id: 'red', weight: weights.red ?? 22 },
            { id: 'blue', weight: weights.blue ?? 22 },
            { id: 'big', weight: weights.big ?? 14 },
            { id: 'poison', weight: weights.poison ?? 8 },
            { id: 'bunch', weight: weights.bunch ?? 4 }
        ];

        const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const entry of pool) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry.id;
            }
        }

        return 'green';
    }

    static applyDangerHints(tiles, gridSize) {
        for (const tile of tiles) {
            const neighbors = this.getNeighborTiles(tiles, gridSize, tile.row, tile.col);

            const dangerTiles = neighbors.filter(neighbor =>
                this.isDangerType(neighbor.tileType)
            );

            tile.nearbyDangerCount = dangerTiles.length;
            tile.nearbyHints = this.buildDangerHints(dangerTiles);
        }
    }

    static getNeighborTiles(tiles, gridSize, row, col) {
        const result = [];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nr = row + dy;
                const nc = col + dx;

                if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;

                const found = tiles.find(tile => tile.row === nr && tile.col === nc);
                if (found) result.push(found);
            }
        }

        return result;
    }

    static isDangerType(tileType) {
        return ['snake', 'thorn', 'boar', 'spiderweb'].includes(tileType);
    }

    static buildDangerHints(dangerTiles) {
        const hints = [];

        const hasSnake = dangerTiles.some(tile => tile.tileType === 'snake');
        const hasBoar = dangerTiles.some(tile => tile.tileType === 'boar');
        const hasThorn = dangerTiles.some(tile => tile.tileType === 'thorn');
        const hasWeb = dangerTiles.some(tile => tile.tileType === 'spiderweb');

        if (hasSnake) {
            hints.push('附近傳來嘶嘶聲…');
        }

        if (hasBoar) {
            hints.push('草叢好像晃了一下…');
        }

        if (hasThorn) {
            hints.push('這附近有刺刺的感覺…');
        }

        if (hasWeb) {
            hints.push('空氣黏黏的，好像有蜘蛛網…');
        }

        if (dangerTiles.length >= 2) {
            hints.push('這一帶感覺不太安全…');
        }

        return hints;
    }
}