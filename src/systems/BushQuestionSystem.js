// src/systems/BushQuestionSystem.js

export default class BushQuestionSystem {
    static createQuestion(levelData, mapTiles, options = {}) {
        const counts = this.countBugs(mapTiles, {
            includeLv0: true
        });
        const choiceCount = options.choiceCount || 3;

        const questionPools = this.getAvailableQuestionTypes(levelData, counts);
        const pickedDifficulty = this.pickDifficultyByWeight(levelData?.id, questionPools);

        let availableQuestionTypes = questionPools[pickedDifficulty] || [];

        // fallback，避免該星級沒題
        if (availableQuestionTypes.length <= 0) {
            availableQuestionTypes = [
                ...questionPools.easy,
                ...questionPools.medium,
                ...questionPools.hard
            ];
        }

        const questionType = Phaser.Utils.Array.GetRandom(availableQuestionTypes);

        switch (questionType) {
            case 'total_count': {
                const question = this.buildCountQuestion(
                    'total_count',
                    '場上總共有幾個果實？',
                    '場上總共有幾個果實？',
                    counts.total,
                    0,
                    15,
                    choiceCount,
                    'easy'
                );
                return this.finalizeQuestion('total_count', question, counts, levelData, mapTiles);
            }

            case 'green_count': {
                const question = this.buildCountQuestion(
                    'green_count',
                    '🟢 綠果有幾個？',
                    '綠果有幾個？',
                    counts.green,
                    0,
                    10,
                    choiceCount,
                    'easy'
                );
                return this.finalizeQuestion('green_count', question, counts, levelData, mapTiles);
            }

            case 'red_count': {
                const question = this.buildCountQuestion(
                    'red_count',
                    '🔴 紅果有幾個？',
                    '紅果有幾個？',
                    counts.red,
                    0,
                    10,
                    choiceCount,
                    'easy'
                );
                return this.finalizeQuestion('red_count', question, counts, levelData, mapTiles);
            }

            case 'blue_count': {
                const question = this.buildCountQuestion(
                    'blue_count',
                    '🔵 藍果有幾個？',
                    '藍果有幾個？',
                    counts.blue,
                    0,
                    10,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('blue_count', question, counts, levelData, mapTiles);
            }

            case 'big_count': {
                const question = this.buildCountQuestion(
                    'big_count',
                    '🍎 大果有幾個？',
                    '大果有幾個？',
                    counts.big,
                    0,
                    8,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('big_count', question, counts, levelData, mapTiles);
            }

            case 'poison_count': {
                const question = this.buildCountQuestion(
                    'poison_count',
                    '☠️ 毒果有幾個？',
                    '毒果有幾個？',
                    counts.poison,
                    0,
                    8,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('poison_count', question, counts, levelData, mapTiles);
            }

            case 'green_plus_red': {
                const question = this.buildCountQuestion(
                    'green_plus_red',
                    '🟢綠果和🔴紅果加起來有幾個？',
                    '綠果和紅果加起來有幾個？',
                    counts.green + counts.red,
                    0,
                    15,
                    choiceCount,
                    'hard'
                );
                return this.finalizeQuestion('green_plus_red', question, counts, levelData, mapTiles);
            }

            case 'blue_plus_big': {
                const question = this.buildCountQuestion(
                    'blue_plus_big',
                    '🔵藍果和🍎大果加起來有幾個？',
                    '藍果和大果加起來有幾個？',
                    counts.blue + counts.big,
                    0,
                    15,
                    choiceCount,
                    'hard'
                );
                return this.finalizeQuestion('blue_plus_big', question, counts, levelData, mapTiles);
            }

            case 'has_green': {
                const question = this.buildExistQuestion(
                    'has_green',
                    '場上有沒有🟢綠果？',
                    '場上有沒有綠果？',
                    counts.green > 0,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('has_green', question, counts, levelData, mapTiles);
            }

            case 'has_red': {
                const question = this.buildExistQuestion(
                    'has_red',
                    '場上有沒有🔴紅果？',
                    '場上有沒有紅果？',
                    counts.red > 0,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('has_red', question, counts, levelData, mapTiles);
            }

            case 'has_blue': {
                const question = this.buildExistQuestion(
                    'has_blue',
                    '場上有沒有🔵藍果？',
                    '場上有沒有藍果？',
                    counts.blue > 0,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('has_blue', question, counts, levelData, mapTiles);
            }

            case 'has_big': {
                const question = this.buildExistQuestion(
                    'has_big',
                    '場上有沒有🍎大果？',
                    '場上有沒有大果？',
                    counts.big > 0,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('has_big', question, counts, levelData, mapTiles);
            }

            case 'has_poison': {
                const question = this.buildExistQuestion(
                    'has_poison',
                    '場上有沒有☠️毒果？',
                    '場上有沒有毒果？',
                    counts.poison > 0,
                    choiceCount,
                    'medium'
                );
                return this.finalizeQuestion('has_poison', question, counts, levelData, mapTiles);
            }

            default: {
                const question = this.buildCountQuestion(
                    'total_count',
                    '場上總共有幾個果實？',
                    '場上總共有幾個果實？',
                    counts.total,
                    0,
                    15,
                    choiceCount,
                    'easy'
                );
                return this.finalizeQuestion('default_total_count', question, counts, levelData, mapTiles);
            }
        }
    }

    static buildCountQuestion(type, text, voiceText, answer, minValue = 0, maxValue = 10, choiceCount = 3, difficulty = 'easy') {
        const wrongPool = [];

        for (let i = minValue; i <= maxValue; i++) {
            if (i !== answer) {
                wrongPool.push(i);
            }
        }

        const choices = this.buildChoiceOptions(answer, wrongPool, choiceCount);

        return {
            type,
            text,
            voiceText,
            answer,
            choices,
            difficulty,
            answerStyle: 'number'
        };
    }

    static buildExistQuestion(type, text, voiceText, exists, choiceCount = 3, difficulty = 'easy') {
        const answer = exists ? '有' : '沒有';

        let choices = ['有', '沒有'];

        if (choiceCount >= 3) {
            choices.push('不知道');
        }

        if (choiceCount >= 4) {
            choices.push('一半一半');
        }

        choices = this.shuffleChoices(choices);

        return {
            type,
            text,
            voiceText,
            answer,
            choices,
            difficulty,
            answerStyle: 'yesno'
        };
    }

    static buildCompareQuestion(type, text, voiceText, leftCount, rightCount, leftLabel, rightLabel, choiceCount = 3, difficulty = 'medium') {
        let answer = '一樣多';

        if (leftCount > rightCount) {
            answer = leftLabel;
        } else if (rightCount > leftCount) {
            answer = rightLabel;
        }

        const wrongPool = [leftLabel, rightLabel, '一樣多'].filter(v => v !== answer);
        const choices = this.buildChoiceOptions(answer, wrongPool, choiceCount);

        return {
            type,
            text,
            voiceText,
            answer,
            choices,
            difficulty,
            answerStyle: 'fruitCompare'
        };
    }

    static buildChoiceOptions(correctAnswer, wrongPool, totalCount = 3) {
        const uniqueWrongPool = [...new Set(wrongPool)];
        const shuffledWrong = Phaser.Utils.Array.Shuffle([...uniqueWrongPool]);
        const pickedWrong = shuffledWrong.slice(0, Math.max(0, totalCount - 1));

        const finalChoices = [correctAnswer, ...pickedWrong];

        while (finalChoices.length < totalCount) {
            if (typeof correctAnswer === 'number') {
                const fallback = correctAnswer + finalChoices.length;
                if (!finalChoices.includes(fallback)) {
                    finalChoices.push(fallback);
                } else {
                    finalChoices.push(correctAnswer + finalChoices.length + 1);
                }
            } else {
                const fallbackText = `選項${finalChoices.length + 1}`;
                if (!finalChoices.includes(fallbackText)) {
                    finalChoices.push(fallbackText);
                } else {
                    break;
                }
            }
        }

        Phaser.Utils.Array.Shuffle(finalChoices);
        return finalChoices;
    }

    static shuffleChoices(choices) {
        return Phaser.Utils.Array.Shuffle([...choices]);
    }

    static checkAnswer(question, playerAnswer) {
        if (!question) return false;

        if (typeof question.answer === 'number') {
            return Number(playerAnswer) === Number(question.answer);
        }

        return String(playerAnswer) === String(question.answer);
    }

    static applyWrongAnswerPenalty(scene, mapTiles) {
        const hasPoisonBug = mapTiles.some(tile => tile.bugId === 'poison');

        if (!hasPoisonBug) {
            return 0;
        }

        const currentStamina = scene.gameState.stamina || 0;
        scene.gameState.stamina = Math.max(0, currentStamina - 1);

        return -1;
    }

    static countBugs(mapTiles, options = {}) {
        const includeLv0 = options.includeLv0 ?? true;

        const counts = {
            total: 0,
            green: 0,
            red: 0,
            blue: 0,
            big: 0,
            poison: 0
        };

        for (const tile of mapTiles) {
            if (!tile.bugId) continue;
            if (!includeLv0 && tile.isLv0Fruit) continue;

            counts.total += 1;

            if (tile.bugId === 'green') counts.green += 1;
            else if (tile.bugId === 'red') counts.red += 1;
            else if (tile.bugId === 'blue') counts.blue += 1;
            else if (tile.bugId === 'big') counts.big += 1;
            else if (tile.bugId === 'poison') counts.poison += 1;
        }

        return counts;
    }

    static getAvailableQuestionTypes(levelData, counts) {
        const levelId = levelData?.id || '';
        const difficulty = levelData?.difficulty || 1;

        const easy = [];
        const medium = [];
        const hard = [];

        // ===== 基礎穩定題庫 =====
        easy.push('total_count');

        if (counts.green > 0) easy.push('green_count');
        if (counts.red > 0) easy.push('red_count');

        if (counts.blue > 0) medium.push('blue_count');
        if (counts.big > 0) medium.push('big_count');
        if (counts.poison > 0) medium.push('poison_count');

        if (counts.green > 0) medium.push('has_green');
        if (counts.red > 0) medium.push('has_red');
        if (counts.blue > 0) medium.push('has_blue');
        if (counts.big > 0) medium.push('has_big');
        if (counts.poison > 0) medium.push('has_poison');

        if (counts.green > 0 && counts.red > 0) hard.push('green_plus_red');
        if (counts.blue > 0 && counts.big > 0) hard.push('blue_plus_big');

        // ===== bush_01 先固定走穩定版 =====
        if (levelId === 'bush_01') {
            return {
                easy: [...new Set(easy)],
                medium: [...new Set(medium)],
                hard: [...new Set(hard)]
            };
        }

        // ===== 其他關卡先維持保守擴充 =====
        if (difficulty >= 2) {
            // 先保留
        }

        if (difficulty >= 3) {
            // 先保留
        }

        return {
            easy: [...new Set(easy)],
            medium: [...new Set(medium)],
            hard: [...new Set(hard)]
        };
    }

    static pickDifficultyByWeight(levelId, pools) {
        const hasEasy = pools.easy.length > 0;
        const hasMedium = pools.medium.length > 0;
        const hasHard = pools.hard.length > 0;

        // bush_01：1星60%、2星30%、3星10%
        if (levelId === 'bush_01') {
            const roll = Math.random() * 100;

            if (roll < 60 && hasEasy) return 'easy';
            if (roll < 90 && hasMedium) return 'medium';
            if (roll < 100 && hasHard) return 'hard';

            if (hasEasy) return 'easy';
            if (hasMedium) return 'medium';
            if (hasHard) return 'hard';
            return 'easy';
        }

        if (hasEasy) return 'easy';
        if (hasMedium) return 'medium';
        if (hasHard) return 'hard';

        return 'easy';
    }

    static canAskMostBugType(counts) {
        const values = [
            counts.green,
            counts.red,
            counts.blue,
            counts.big,
            counts.poison
        ];

        const positiveValues = values.filter(v => v > 0);
        if (positiveValues.length <= 0) return false;

        const maxValue = Math.max(...positiveValues);
        const maxCount = positiveValues.filter(v => v === maxValue).length;

        return maxCount === 1;
    }

    static canAskLeastBugType(counts) {
        const values = [
            counts.green,
            counts.red,
            counts.blue,
            counts.big,
            counts.poison
        ];

        const positiveValues = values.filter(v => v > 0);
        if (positiveValues.length <= 1) return false;

        const minValue = Math.min(...positiveValues);
        const minCount = positiveValues.filter(v => v === minValue).length;

        return minCount === 1;
    }

    static getMostBugType(counts) {
        const entries = [
            { bugId: 'green', count: counts.green },
            { bugId: 'red', count: counts.red },
            { bugId: 'blue', count: counts.blue },
            { bugId: 'big', count: counts.big },
            { bugId: 'poison', count: counts.poison }
        ];

        entries.sort((a, b) => b.count - a.count);

        if (entries[0].count <= 0) {
            return 'green';
        }

        return entries[0].bugId;
    }

    static getLeastBugType(counts) {
        const entries = [
            { bugId: 'green', count: counts.green },
            { bugId: 'red', count: counts.red },
            { bugId: 'blue', count: counts.blue },
            { bugId: 'big', count: counts.big },
            { bugId: 'poison', count: counts.poison }
        ].filter(entry => entry.count > 0);

        entries.sort((a, b) => a.count - b.count);

        if (entries.length <= 0) {
            return 'green';
        }

        return entries[0].bugId;
    }

    static getBugTypeLabel(bugId) {
        const map = {
            green: '綠果',
            red: '紅果',
            blue: '藍果',
            big: '大果',
            poison: '毒果'
        };

        return map[bugId] || '綠果';
    }

    static finalizeQuestion(questionType, question, counts, levelData, mapTiles = []) {
        return question;
    }

    static logQuestionDebug(questionType, question, counts, levelData, mapTiles = []) {
        const visibleCount = mapTiles.filter(tile => tile.bugId && !tile.isLv0Fruit).length;
        const virtualCount = mapTiles.filter(tile => tile.bugId && tile.isLv0Fruit).length;

        console.log('🧠 [BushQuestionSystem] 題目生成', {
            stageId: levelData?.id || 'unknown',
            difficulty: question?.difficulty || 'unknown',
            questionType,
            text: question?.text,
            answer: question?.answer,
            choices: question?.choices,
            counts,
            visibleCount,
            virtualCount
        });
    }
}