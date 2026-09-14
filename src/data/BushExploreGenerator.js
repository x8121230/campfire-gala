// src/data/BushExploreGenerator.js

import {
    BUSH_CELL_TYPES,
    BUSH_EXPLORE_CONSTANTS,
    createEmptyBushCell,
    getBushExploreStageData,
    getBushDangerData,
    getBushBugData,
    getBushRewardData,
    getGoldBushRewardData,
    getNeighborPositions,
    bushPosToIndex,
    bushIndexToPos,
    pickWeightedRandom,
    buildBushQuestionSet
} from './BushExploreData.js';

/* =========================
 * 小工具：亂數整數
 * ========================= */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* =========================
 * 小工具：打散陣列
 * ========================= */
function shuffleArray(array = []) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

/* =========================
 * 建立空白格子陣列
 * ========================= */
export function createEmptyBushGrid(gridSize = BUSH_EXPLORE_CONSTANTS.GRID_SIZE) {
    const cells = [];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = bushPosToIndex(x, y, gridSize);
            cells.push(createEmptyBushCell(index, x, y));
        }
    }

    return cells;
}

/* =========================
 * 取得所有 index
 * ========================= */
export function getAllCellIndexes(gridSize = BUSH_EXPLORE_CONSTANTS.GRID_SIZE) {
    const total = gridSize * gridSize;
    return Array.from({ length: total }, (_, i) => i);
}

/* =========================
 * 從剩餘 index 中抽一格
 * ========================= */
function takeOneIndex(availableIndexes = []) {
    if (!availableIndexes.length) return null;

    const randomPos = randomInt(0,