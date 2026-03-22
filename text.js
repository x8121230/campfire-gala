// src/systems/BushQuestionSystem.js

export default class BushQuestionSystem {
    static createQuestion(levelData, mapTiles, options = {}) {
        const counts = this.countBugs(mapTiles, {
            includeVirtual: true
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
            case 'total_count':
                return this.buildCountQuestion(
                    'total_count',
                    '場上總共有幾個果實？',
                    '場上總共有幾個果實？',
                    counts.total,
                    0,
                    15,
                    choiceCount,
                    'easy'
                );

            case 'green_count':
                return this.buildCountQuestion(
                    'green_count',
                    '🟢 綠果有幾個？',
                    '綠果有幾個？',
                    counts.green,
                    0,
                    10,
                    choiceCount,
                    'easy'
                );

            case 'red_count':
                return this.buildCountQuestion(
                    'red_count',
                    '🔴 紅果有幾個？',
                    '紅果有幾個？',
                    counts.red,
                    0,
                    10,
                    choiceCount,
                    'easy'
                );

            case 'blue_count':
                return this.buildCountQuestion(
                    'blue_count',
                    '🔵 藍果有幾個？',
                    '藍果有幾個？',
                    counts.blue,
                    0,
                    10,
                    choiceCount,
                    'easy'
                );

            case 'big_count':
                return this.buildCountQuestion(
                    'big_count',
                    '🍎 大果有幾個？',
                    '大果有幾個？',
                    counts.big,
                    0,
                    8,
                    choiceCount,
                    'medium'
                );

            case 'poison_count':
                return this.buildCountQuestion(
                    'poison_count',
                    '☠️ 毒果有幾個？',
                    '毒果有幾個？',
                    counts.poison,
                    0,
                    8,
                    choiceCount,
                    'medium'
                );

            case 'bunch_count':
                return this.buildCountQuestion(
                    'bunch_count',
                    '🍇 果串有幾個？',
                    '果串有幾個？',
                    counts.bunch,
                    0,
                    6,
                    choiceCount,
                    'medium'
                );

            case 'most_bug_type': {
                const mostBugType = this.getMostBugType(counts);
                const correctLabel = this.getBugTypeLabel(mostBugType);

                const wrongPool = ['green', 'red', 'blue', 'big', 'poison', 'bunch']
                    .filter(id => id !== mostBugType)
                    .map(id => this.getBugTypeLabel(id));

                const choices = this.buildChoiceOptions(correctLabel, wrongPool, choiceCount);

                return {
                    type: 'most_bug_type',
                    text: '哪一種果實最多？',
                    voiceText: '哪一種果實最多？',
                    answer: correctLabel,
                    choices,
                    difficulty: 'hard',
                    answerStyle: 'fruitType',
                    extra: {
                        mostBugType
                    }
                };
            }

            case 'least_bug_type': {
                const leastBugType = this.getLeastBugType(counts);
                const correctLabel = this.getBugTypeLabel(leastBugType);

                const wrongPool = ['green', 'red', 'blue', 'big', 'poison', 'bunch']
                    .filter(id => id !== leastBugType)
                    .map(id => this.getBugTypeLabel(id));

                const choices = this.buildChoiceOptions(correctLabel, wrongPool, choiceCount);

                return {
                    type: 'least_bug_type',
                    text: '哪一種果實最少？',
                    voiceText: '哪一種果實最少？',
                    answer: correctLabel,
                    choices,
                    difficulty: 'hard',
                    answerStyle: 'fruitType',
                    extra: {
                        leastBugType
                    }
                };
            }

            case 'green_plus_red':
                return this.buildCountQuestion(
                    'green_plus_red',
                    '🟢綠果和🔴紅果加起來有幾個？',
                    '綠果和紅果加起來有幾個？',
                    counts.green + counts.red,
                    0,
                    15,
                    choiceCount,
                    'medium'
                );

            case 'blue_plus_big':
                return this.buildCountQuestion(
                    'blue_plus_big',
                    '🔵藍果和🍎大果加起來有幾個？',
                    '藍果和大果加起來有幾個？',
                    counts.blue + counts.big,
                    0,
                    15,
                    choiceCount,
                    'medium'
                );

            case 'big_plus_bunch':
                return this.buildCountQuestion(
                    'big_plus_bunch',
                    '🍎大果和🍇果串加起來有幾個？',
                    '大果和果串加起來有幾個？',
                    counts.big + counts.bunch,
                    0,
                    10,
                    choiceCount,
                    'medium'
                );

            case 'has_green':
                return this.buildExistQuestion('has_green', '場上有沒有🟢綠果？', '場上有沒有綠果？', counts.green > 0, choiceCount, 'easy');

            case 'has_red':
                return this.buildExistQuestion('has_red', '場上有沒有🔴紅果？', '場上有沒有紅果？', counts.red > 0, choiceCount, 'easy');

            case 'has_blue':
                return this.buildExistQuestion('has_blue', '場上有沒有🔵藍果？', '場上有沒有藍果？', counts.blue > 0, choiceCount, 'easy');

            case 'has_big':
                return this.buildExistQuestion('has_big', '場上有沒有🍎大果？', '場上有沒有大果？', counts.big > 0, choiceCount, 'easy');

            case 'has_poison':
                return this.buildExistQuestion('has_poison', '場上有沒有☠️毒果？', '場上有沒有毒果？', counts.poison > 0, choiceCount, 'medium');

            case 'has_bunch':
                return this.buildExistQuestion('has_bunch', '場上有沒有🍇果串？', '場上有沒有果串？', counts.bunch > 0, choiceCount, 'medium');

            case 'green_vs_red':
                return this.buildCompareQuestion(
                    'green_vs_red',
                    '🟢綠果和🔴紅果哪個比較多？',
                    '綠果和紅果哪個比較多？',
                    counts.green,
                    counts.red,
                    '綠果',
                    '紅果',
                    choiceCount,
                    'medium'
                );

            case 'red_vs_blue':
                return this.buildCompareQuestion(
                    'red_vs_blue',
                    '🔴紅果和🔵藍果哪個比較多？',
                    '紅果和藍果哪個比較多？',
                    counts.red,
                    counts.blue,
                    '紅果',
                    '藍果',
                    choiceCount,
                    'medium'
                );

            default:
                return this.buildCountQuestion(
                    'total_count',
                    '場上總共有幾個果實？',
                    '場上總共有幾個果實？',
                    counts.total,
                    0,
                    15,
                    choiceCount,
                    'easy'
                );
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
        const includeVirtual = options.includeVirtual ?? true;

        const counts = {
            total: 0,
            green: 0,
            red: 0,
            blue: 0,
            big: 0,
            poison: 0,
            bunch: 0
        };

        for (const tile of mapTiles) {
            if (!tile.bugId) continue;
            if (!includeVirtual && tile.isVirtualBug) continue;

            counts.total += 1;

            if (tile.bugId === 'green') counts.green += 1;
            else if (tile.bugId === 'red') counts.red += 1;
            else if (tile.bugId === 'blue') counts.blue += 1;
            else if (tile.bugId === 'big') counts.big += 1;
            else if (tile.bugId === 'poison') counts.poison += 1;
            else if (tile.bugId === 'bunch') counts.bunch += 1;
        }

        return counts;
    }

    static getAvailableQuestionTypes(levelData, counts) {
        const levelId = levelData?.id || '';
        const difficulty = levelData?.difficulty || 1;

        const easy = [];
        const medium = [];
        const hard = [];

        // ===== 1星題 =====
        easy.push('total_count');

        if (counts.green > 0) easy.push('green_count');
        if (counts.red > 0) easy.push('red_count');

        // ===== bush_01 特別配置 =====
        if (levelId === 'bush_01') {
            if (counts.blue > 0) medium.push('blue_count');
            if (counts.big > 0) medium.push('big_count');

            if (counts.green > 0) medium.push('has_green');
            if (counts.red > 0) medium.push('has_red');
            if (counts.blue > 0) medium.push('has_blue');
            if (counts.big > 0) medium.push('has_big');

            if (counts.green > 0 && counts.red > 0) medium.push('green_plus_red');
            if (counts.green > 0 && counts.red > 0) hard.push('green_vs_red');

            if (counts.red > 0 && counts.blue > 0) hard.push('red_vs_blue');

            if (counts.poison > 0) medium.push('poison_count');
            if (counts.bunch > 0) medium.push('bunch_count');

            if (counts.poison > 0) hard.push('has_poison');
            if (counts.bunch > 0) hard.push('has_bunch');

            if (counts.blue > 0 && counts.big > 0) hard.push('blue_plus_big');
            if (counts.big > 0 && counts.bunch > 0) hard.push('big_plus_bunch');

            if (this.canAskMostBugType(counts)) hard.push('most_bug_type');
            if (this.canAskLeastBugType(counts)) hard.push('least_bug_type');
        } else {
            // ===== 其他關卡先維持原本 difficulty 邏輯 =====
            if (difficulty >= 2) {
                if (counts.blue > 0) medium.push('blue_count');
                if (counts.big > 0) medium.push('big_count');

                if (counts.green > 0) medium.push('has_green');
                if (counts.red > 0) medium.push('has_red');
                if (counts.blue > 0) medium.push('has_blue');
                if (counts.big > 0) medium.push('has_big');

                if (counts.green > 0 && counts.red > 0) medium.push('green_plus_red');
                if (counts.green > 0 && counts.red > 0) medium.push('green_vs_red');

                if (counts.red > 0 && counts.blue > 0) medium.push('red_vs_blue');
            }

            if (difficulty >= 3) {
                if (counts.poison > 0) medium.push('poison_count');
                if (counts.bunch > 0) medium.push('bunch_count');

                hard.push('has_poison');
                hard.push('has_bunch');

                if (counts.blue > 0 && counts.big > 0) hard.push('blue_plus_big');
                if (counts.big > 0 && counts.bunch > 0) hard.push('big_plus_bunch');

                if (this.canAskMostBugType(counts)) hard.push('most_bug_type');
                if (this.canAskLeastBugType(counts)) hard.push('least_bug_type');
            }
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

            // fallback
            if (hasEasy) return 'easy';
            if (hasMedium) return 'medium';
            if (hasHard) return 'hard';
            return 'easy';
        }

        // 其他關卡先走保守 fallback
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
            counts.poison,
            counts.bunch
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
            counts.poison,
            counts.bunch
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
            { bugId: 'poison', count: counts.poison },
            { bugId: 'bunch', count: counts.bunch }
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
            { bugId: 'poison', count: counts.poison },
            { bugId: 'bunch', count: counts.bunch }
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
            poison: '毒果',
            bunch: '果串'
        };

        return map[bugId] || '綠果';
    }
}