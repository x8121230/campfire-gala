export const KIDS_ANIMAL_ROUND_COUNT = 6;

export const ANIMAL_FOOD_DB = [
    { id: 'brown_bear', name: '小熊', body: 'afm_brown_bear_body', food: 'afm_brown_bear_item', foodName: '蜂蜜', color: 0xc9905b },
    { id: 'cat', name: '小貓', body: 'afm_cat_body', food: 'afm_cat_item', foodName: '小魚', color: 0xf1ae72 },
    { id: 'hedgehog', name: '小刺蝟', body: 'afm_hedgehog_body', food: 'afm_hedgehog_item', foodName: '蘋果', color: 0xc59b72 },
    { id: 'panda', name: '熊貓', body: 'afm_panda_body', food: 'afm_panda_item', foodName: '竹子', color: 0x88b96d },
    { id: 'rabbit', name: '小兔子', body: 'afm_rabbit_body', food: 'afm_rabbit_item', foodName: '紅蘿蔔', color: 0xf4b6c2 },
    { id: 'monkey', name: '小猴子', body: 'afm_monkey_body', food: 'afm_monkey_item', foodName: '香蕉', color: 0xe2ad63 },
    { id: 'mouse', name: '小老鼠', body: 'afm_mouse_body', food: 'afm_mouse_item', foodName: '起司', color: 0x9db1c8 },
    { id: 'owl', name: '貓頭鷹', body: 'afm_owl_body', food: 'afm_owl_item', foodName: '野莓', color: 0xb38a69 },
    { id: 'squirrel', name: '小松鼠', body: 'afm_squirrel_body', food: 'afm_squirrel_item', foodName: '橡果', color: 0xd88a50 },
    { id: 'tiger', name: '小老虎', body: 'afm_tiger_body', food: 'afm_tiger_item', foodName: '肉肉', color: 0xf1a94e },
    { id: 'deer', name: '小鹿', body: 'afm_deer_body', food: 'afm_deer_item', foodName: '藍莓', color: 0xc58a5a }
];

export function getKidsChoiceCount(roundIndex) {
    return roundIndex < 2 ? 2 : 3;
}

export function calculateAnimalFoodScore({ wrongCount = 0, hintsUsed = 0 } = {}) {
    const rawScore = 100 - Number(wrongCount || 0) * 6 - Number(hintsUsed || 0) * 3;
    return Math.max(60, Math.min(100, Math.round(rawScore)));
}

export function calculateAnimalFoodAccuracy(correctCount, wrongCount = 0) {
    const correct = Math.max(0, Number(correctCount || 0));
    const wrong = Math.max(0, Number(wrongCount || 0));
    return Math.round((correct / Math.max(1, correct + wrong)) * 100);
}
