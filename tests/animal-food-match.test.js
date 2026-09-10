import assert from 'node:assert/strict';
import {
    ANIMAL_FOOD_DB,
    KIDS_ANIMAL_ROUND_COUNT,
    calculateAnimalFoodAccuracy,
    calculateAnimalFoodScore,
    getKidsChoiceCount
} from '../src/data/AnimalFoodMatchData.js';

assert.equal(KIDS_ANIMAL_ROUND_COUNT, 6);
assert.ok(ANIMAL_FOOD_DB.length >= KIDS_ANIMAL_ROUND_COUNT);
assert.equal(new Set(ANIMAL_FOOD_DB.map((animal) => animal.id)).size, ANIMAL_FOOD_DB.length);
assert.equal(new Set(ANIMAL_FOOD_DB.map((animal) => animal.food)).size, ANIMAL_FOOD_DB.length);

assert.equal(getKidsChoiceCount(0), 2);
assert.equal(getKidsChoiceCount(1), 2);
assert.equal(getKidsChoiceCount(2), 3);
assert.equal(getKidsChoiceCount(5), 3);

assert.equal(calculateAnimalFoodScore(), 100);
assert.equal(calculateAnimalFoodScore({ wrongCount: 1 }), 94);
assert.equal(calculateAnimalFoodScore({ hintsUsed: 1 }), 97);
assert.equal(calculateAnimalFoodScore({ wrongCount: 99, hintsUsed: 99 }), 60);
assert.equal(calculateAnimalFoodAccuracy(6, 0), 100);
assert.equal(calculateAnimalFoodAccuracy(6, 2), 75);

console.log('森林歷險幼童版測試通過：6 位動物、2→3 選項、幼兒保底分與圖鑑資料。');
