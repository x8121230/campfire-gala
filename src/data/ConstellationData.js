export const CONSTELLATION_PATTERNS = Object.freeze([
    Object.freeze({
        id: 'little_fish',
        name: '小魚星座',
        reveal: 'fish',
        theme: 'ocean',
        friendTexture: 'constellation_friend_fish',
        friendMessage: '小魚在星光海裡游回來了！',
        interactionHint: '點點小魚，看牠吹泡泡！',
        color: 0x67d7ef,
        puzzleKind: 'color',
        tutorialNumberCount: 1,
        branchDecoyCount: 1,
        interaction: Object.freeze({ kind: 'bubble', instruction: '戳破 3 顆泡泡！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 245, y: 330 }),
                Object.freeze({ x: 475, y: 210 }),
                Object.freeze({ x: 735, y: 330 })
            ]),
            Object.freeze([
                Object.freeze({ x: 220, y: 245 }),
                Object.freeze({ x: 480, y: 375 }),
                Object.freeze({ x: 735, y: 235 })
            ]),
            Object.freeze([
                Object.freeze({ x: 230, y: 390 }),
                Object.freeze({ x: 475, y: 205 }),
                Object.freeze({ x: 730, y: 370 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 470, y: 455 })]),
            Object.freeze([Object.freeze({ x: 470, y: 155 })]),
            Object.freeze([Object.freeze({ x: 475, y: 455 })])
        ])
    }),
    Object.freeze({
        id: 'little_rabbit',
        name: '小兔星座',
        reveal: 'rabbit',
        theme: 'moon_meadow',
        friendTexture: 'constellation_friend_rabbit',
        friendMessage: '小兔從月亮草原跳回來了！',
        interactionHint: '點點小兔，看牠跳一跳！',
        color: 0xf6b6de,
        puzzleKind: 'shape',
        tutorialNumberCount: 0,
        branchDecoyCount: 2,
        interaction: Object.freeze({ kind: 'jumping_star', instruction: '接住 3 顆跳跳星！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 285, y: 390 }),
                Object.freeze({ x: 390, y: 185 }),
                Object.freeze({ x: 535, y: 355 }),
                Object.freeze({ x: 710, y: 205 })
            ]),
            Object.freeze([
                Object.freeze({ x: 245, y: 230 }),
                Object.freeze({ x: 405, y: 390 }),
                Object.freeze({ x: 585, y: 205 }),
                Object.freeze({ x: 735, y: 390 })
            ]),
            Object.freeze([
                Object.freeze({ x: 250, y: 400 }),
                Object.freeze({ x: 420, y: 220 }),
                Object.freeze({ x: 610, y: 380 }),
                Object.freeze({ x: 760, y: 180 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 180, y: 150 }), Object.freeze({ x: 760, y: 470 })]),
            Object.freeze([Object.freeze({ x: 180, y: 480 }), Object.freeze({ x: 760, y: 120 })]),
            Object.freeze([Object.freeze({ x: 170, y: 150 }), Object.freeze({ x: 760, y: 500 })])
        ])
    }),
    Object.freeze({
        id: 'little_owl',
        name: '貓頭鷹星座',
        reveal: 'owl',
        theme: 'night_forest',
        friendTexture: 'constellation_friend_owl',
        friendMessage: '貓頭鷹從夜森林飛回來了！',
        interactionHint: '點點貓頭鷹，看牠拍拍翅膀！',
        color: 0xffd86a,
        puzzleKind: 'color_shape',
        tutorialNumberCount: 0,
        branchDecoyCount: 2,
        interaction: Object.freeze({ kind: 'firefly', instruction: '點亮 3 隻小螢火蟲！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 260, y: 230 }),
                Object.freeze({ x: 455, y: 165 }),
                Object.freeze({ x: 690, y: 245 }),
                Object.freeze({ x: 615, y: 440 }),
                Object.freeze({ x: 345, y: 430 })
            ]),
            Object.freeze([
                Object.freeze({ x: 240, y: 350 }),
                Object.freeze({ x: 350, y: 185 }),
                Object.freeze({ x: 505, y: 335 }),
                Object.freeze({ x: 665, y: 180 }),
                Object.freeze({ x: 745, y: 395 })
            ]),
            Object.freeze([
                Object.freeze({ x: 230, y: 420 }),
                Object.freeze({ x: 330, y: 210 }),
                Object.freeze({ x: 500, y: 390 }),
                Object.freeze({ x: 665, y: 190 }),
                Object.freeze({ x: 760, y: 430 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 180, y: 530 }), Object.freeze({ x: 820, y: 480 })]),
            Object.freeze([Object.freeze({ x: 430, y: 520 }), Object.freeze({ x: 810, y: 560 })]),
            Object.freeze([Object.freeze({ x: 145, y: 130 }), Object.freeze({ x: 430, y: 550 })])
        ])
    }),
    Object.freeze({
        id: 'little_bear',
        name: '小熊星座',
        reveal: 'bear',
        theme: 'golden_grove',
        friendTexture: 'constellation_friend_bear',
        friendMessage: '小熊抱著一袋星光回來了！',
        interactionHint: '點點小熊，和牠抱一下！',
        color: 0xffb95f,
        puzzleKind: 'count',
        tutorialNumberCount: 0,
        branchDecoyCount: 2,
        interaction: Object.freeze({ kind: 'jumping_star', instruction: '接住 3 顆抱抱星！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 250, y: 360 }),
                Object.freeze({ x: 390, y: 205 }),
                Object.freeze({ x: 560, y: 365 }),
                Object.freeze({ x: 735, y: 210 })
            ]),
            Object.freeze([
                Object.freeze({ x: 230, y: 220 }),
                Object.freeze({ x: 410, y: 390 }),
                Object.freeze({ x: 585, y: 200 }),
                Object.freeze({ x: 750, y: 390 })
            ]),
            Object.freeze([
                Object.freeze({ x: 250, y: 410 }),
                Object.freeze({ x: 420, y: 195 }),
                Object.freeze({ x: 600, y: 395 }),
                Object.freeze({ x: 745, y: 185 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 170, y: 150 }), Object.freeze({ x: 775, y: 485 })]),
            Object.freeze([Object.freeze({ x: 170, y: 490 }), Object.freeze({ x: 785, y: 125 })]),
            Object.freeze([Object.freeze({ x: 165, y: 145 }), Object.freeze({ x: 775, y: 505 })])
        ])
    }),
    Object.freeze({
        id: 'little_deer',
        name: '小鹿星座',
        reveal: 'deer',
        theme: 'aurora_hill',
        friendTexture: 'constellation_friend_deer',
        friendMessage: '小鹿沿著極光跑回來了！',
        interactionHint: '點點小鹿，看牠踏踏小蹄！',
        color: 0x9fe3b1,
        puzzleKind: 'size',
        tutorialNumberCount: 0,
        branchDecoyCount: 2,
        interaction: Object.freeze({ kind: 'firefly', instruction: '點亮 3 顆小鹿星！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 245, y: 370 }),
                Object.freeze({ x: 350, y: 185 }),
                Object.freeze({ x: 510, y: 330 }),
                Object.freeze({ x: 660, y: 180 }),
                Object.freeze({ x: 750, y: 400 })
            ]),
            Object.freeze([
                Object.freeze({ x: 230, y: 225 }),
                Object.freeze({ x: 370, y: 405 }),
                Object.freeze({ x: 520, y: 210 }),
                Object.freeze({ x: 655, y: 395 }),
                Object.freeze({ x: 765, y: 205 })
            ]),
            Object.freeze([
                Object.freeze({ x: 225, y: 410 }),
                Object.freeze({ x: 350, y: 210 }),
                Object.freeze({ x: 500, y: 390 }),
                Object.freeze({ x: 635, y: 190 }),
                Object.freeze({ x: 770, y: 375 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 165, y: 135 }), Object.freeze({ x: 810, y: 525 })]),
            Object.freeze([Object.freeze({ x: 160, y: 510 }), Object.freeze({ x: 815, y: 505 })]),
            Object.freeze([Object.freeze({ x: 155, y: 145 }), Object.freeze({ x: 805, y: 535 })])
        ])
    }),
    Object.freeze({
        id: 'little_squirrel',
        name: '松鼠星座',
        reveal: 'squirrel',
        theme: 'acorn_night',
        friendTexture: 'constellation_friend_squirrel',
        friendMessage: '小松鼠循著星光跳回來了！',
        interactionHint: '點點松鼠，看牠轉個圈！',
        color: 0xff9c66,
        puzzleKind: 'pattern',
        tutorialNumberCount: 0,
        branchDecoyCount: 2,
        interaction: Object.freeze({ kind: 'bubble', instruction: '找出 3 顆橡果泡泡！' }),
        pointVariants: Object.freeze([
            Object.freeze([
                Object.freeze({ x: 225, y: 355 }),
                Object.freeze({ x: 335, y: 185 }),
                Object.freeze({ x: 470, y: 340 }),
                Object.freeze({ x: 605, y: 180 }),
                Object.freeze({ x: 740, y: 345 }),
                Object.freeze({ x: 615, y: 465 })
            ]),
            Object.freeze([
                Object.freeze({ x: 220, y: 220 }),
                Object.freeze({ x: 345, y: 390 }),
                Object.freeze({ x: 480, y: 205 }),
                Object.freeze({ x: 615, y: 395 }),
                Object.freeze({ x: 750, y: 210 }),
                Object.freeze({ x: 755, y: 455 })
            ]),
            Object.freeze([
                Object.freeze({ x: 220, y: 420 }),
                Object.freeze({ x: 330, y: 205 }),
                Object.freeze({ x: 465, y: 380 }),
                Object.freeze({ x: 600, y: 190 }),
                Object.freeze({ x: 750, y: 390 }),
                Object.freeze({ x: 600, y: 500 })
            ])
        ]),
        decoyVariants: Object.freeze([
            Object.freeze([Object.freeze({ x: 150, y: 135 }), Object.freeze({ x: 815, y: 510 })]),
            Object.freeze([Object.freeze({ x: 155, y: 510 }), Object.freeze({ x: 815, y: 130 })]),
            Object.freeze([Object.freeze({ x: 150, y: 150 }), Object.freeze({ x: 815, y: 525 })])
        ])
    })
]);

export const STAR_CODE_COLORS = Object.freeze([
    Object.freeze({ id: 'red', name: '紅色', value: 0xff6f7d }),
    Object.freeze({ id: 'blue', name: '藍色', value: 0x65b9ff }),
    Object.freeze({ id: 'green', name: '綠色', value: 0x70d690 })
]);

export const STAR_CODE_SHAPES = Object.freeze([
    Object.freeze({ id: 'circle', name: '圓形', glyph: '●' }),
    Object.freeze({ id: 'triangle', name: '三角形', glyph: '▲' }),
    Object.freeze({ id: 'star', name: '星形', glyph: '★' })
]);

// 尺寸差距刻意拉大，讓幼童不需要精細比較也能辨識。
// 點擊範圍仍由 snapRadius 統一控制，小星星不會因為畫面較小而變難按。
export const STAR_CODE_SIZES = Object.freeze([
    Object.freeze({ id: 'small', name: '小星星', scale: 0.45 }),
    Object.freeze({ id: 'medium', name: '中星星', scale: 0.9 }),
    Object.freeze({ id: 'large', name: '大星星', scale: 1.55 })
]);

function safeRandomIndex(length, random = Math.random) {
    const randomValue = Math.max(0, Math.min(0.999999, Number(random()) || 0));
    return Math.floor(randomValue * Math.max(1, length));
}

function shuffledCopy(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = safeRandomIndex(index + 1, random);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

export function getConstellationRounds(roundCount = 3, random = Math.random, friendRecords = {}) {
    const safeCount = Math.max(1, Math.min(3, CONSTELLATION_PATTERNS.length, Number(roundCount) || 1));
    const discoveredIds = new Set(
        Object.entries(friendRecords || {})
            .filter(([, record]) => Number(record?.foundCount || 0) > 0)
            .map(([id]) => id)
    );
    const tutorialPatterns = CONSTELLATION_PATTERNS.slice(0, 3);
    const tutorialUndiscovered = tutorialPatterns.filter((pattern) => !discoveredIds.has(pattern.id));
    const selectedPatterns = tutorialUndiscovered.length > 0
        ? [
            ...tutorialUndiscovered,
            ...tutorialPatterns.filter((pattern) => discoveredIds.has(pattern.id))
        ].slice(0, safeCount)
        : [
            ...shuffledCopy(CONSTELLATION_PATTERNS.filter((pattern) => !discoveredIds.has(pattern.id)), random),
            ...shuffledCopy(CONSTELLATION_PATTERNS.filter((pattern) => discoveredIds.has(pattern.id)), random)
        ].slice(0, safeCount);

    return selectedPatterns.map((pattern) => {
        const variantCount = pattern.pointVariants.length;
        const variantIndex = safeRandomIndex(variantCount, random);
        return Object.freeze({
            ...pattern,
            variantIndex,
            points: pattern.pointVariants[variantIndex],
            decoys: pattern.decoyVariants[variantIndex]
        });
    });
}

function makeToken(shape, color, extra = {}) {
    return Object.freeze({ shape, color, ...extra });
}

function rotatedPool(items, startIndex) {
    return items.map((_, index) => items[(startIndex + index) % items.length]);
}

export function buildConstellationChallenge(round, stepIndex = 1, random = Math.random) {
    const kind = round?.puzzleKind || 'color';
    const decoyCount = Math.max(1, Math.min(2, Number(round?.branchDecoyCount || 1)));
    const colorIndex = (Number(stepIndex) + safeRandomIndex(STAR_CODE_COLORS.length, random)) % STAR_CODE_COLORS.length;
    const shapeIndex = (Number(stepIndex) + safeRandomIndex(STAR_CODE_SHAPES.length, random)) % STAR_CODE_SHAPES.length;
    const colors = rotatedPool(STAR_CODE_COLORS, colorIndex);
    const shapes = rotatedPool(STAR_CODE_SHAPES, shapeIndex);

    if (kind === 'shape') {
        return Object.freeze({
            kind,
            instruction: `找「${shapes[0].name}」`,
            targetTokens: Object.freeze([makeToken(shapes[0], STAR_CODE_COLORS[1])]),
            candidateTokens: Object.freeze(shapes.slice(0, decoyCount + 1).map((shape) => makeToken(shape, STAR_CODE_COLORS[1])))
        });
    }

    if (kind === 'color_shape') {
        return Object.freeze({
            kind,
            instruction: `找「${colors[0].name}${shapes[0].name}」`,
            targetTokens: Object.freeze([makeToken(shapes[0], colors[0])]),
            candidateTokens: Object.freeze([
                makeToken(shapes[0], colors[0]),
                makeToken(shapes[1], colors[0]),
                makeToken(shapes[0], colors[1])
            ].slice(0, decoyCount + 1))
        });
    }

    if (kind === 'count') {
        const correctCount = (Number(stepIndex) % 3) + 1;
        const counts = rotatedPool([correctCount, (correctCount % 3) + 1, ((correctCount + 1) % 3) + 1], 0);
        return Object.freeze({
            kind,
            instruction: `找「${correctCount} 顆星」`,
            targetTokens: Object.freeze([makeToken(STAR_CODE_SHAPES[2], STAR_CODE_COLORS[0], { count: correctCount })]),
            candidateTokens: Object.freeze(counts.slice(0, decoyCount + 1).map((count) => makeToken(STAR_CODE_SHAPES[2], STAR_CODE_COLORS[0], { count })))
        });
    }

    if (kind === 'size') {
        const sizeIndex = Number(stepIndex) % STAR_CODE_SIZES.length;
        const orderedSizes = rotatedPool(STAR_CODE_SIZES, sizeIndex);
        return Object.freeze({
            kind,
            instruction: `找「${orderedSizes[0].name}」`,
            targetTokens: Object.freeze([makeToken(STAR_CODE_SHAPES[2], STAR_CODE_COLORS[2], { size: orderedSizes[0] })]),
            candidateTokens: Object.freeze(orderedSizes.slice(0, decoyCount + 1).map((size) => makeToken(STAR_CODE_SHAPES[2], STAR_CODE_COLORS[2], { size })))
        });
    }

    if (kind === 'pattern') {
        const colorA = colors[0];
        const colorB = colors[1];
        return Object.freeze({
            kind,
            instruction: '接下一個顏色',
            targetTokens: Object.freeze([
                makeToken(STAR_CODE_SHAPES[0], colorA),
                makeToken(STAR_CODE_SHAPES[0], colorB),
                makeToken(STAR_CODE_SHAPES[0], colorA),
                Object.freeze({ question: true })
            ]),
            candidateTokens: Object.freeze([
                makeToken(STAR_CODE_SHAPES[0], colorB),
                makeToken(STAR_CODE_SHAPES[0], colorA),
                makeToken(STAR_CODE_SHAPES[0], colors[2])
            ].slice(0, decoyCount + 1))
        });
    }

    return Object.freeze({
        kind: 'color',
        instruction: `找「${colors[0].name}」`,
        targetTokens: Object.freeze([makeToken(STAR_CODE_SHAPES[0], colors[0])]),
        candidateTokens: Object.freeze(colors.slice(0, decoyCount + 1).map((color) => makeToken(STAR_CODE_SHAPES[0], color)))
    });
}

export function shouldShowConstellationNumber(round, pointIndex) {
    return Number(pointIndex) < Math.max(0, Number(round?.tutorialNumberCount || 0));
}

export function calculateConstellationScore(result = {}, rules = {}) {
    const maxScore = Math.max(1, Number(rules.maxScore || 100));
    const minScore = Math.max(0, Math.min(maxScore, Number(rules.minScore || 0)));
    const wrongPenalty = Math.min(
        Math.max(0, Number(result.wrongTaps || 0)) * Math.max(0, Number(rules.wrongPenalty || 0)),
        Math.max(0, Number(rules.maxWrongPenalty || 0))
    );
    const hintPenalty = Math.min(
        Math.max(0, Number(result.hintsUsed || 0)) * Math.max(0, Number(rules.hintPenalty || 0)),
        Math.max(0, Number(rules.maxHintPenalty || 0))
    );
    return Math.max(minScore, Math.min(maxScore, Math.round(maxScore - wrongPenalty - hintPenalty)));
}

export function isCorrectConstellationStep(selectedIndex, expectedIndex) {
    return Number(selectedIndex) === Number(expectedIndex);
}
