export const MINI_GAME_CATEGORIES = Object.freeze([
    { id: 'all', label: '全部', icon: '🏡', color: 0x5f9860 },
    { id: 'observation', label: '觀察推理', icon: '🔎', color: 0x4f91a8 },
    { id: 'matching', label: '配對記憶', icon: '🧠', color: 0xb66d8e },
    { id: 'rhythm', label: '反應節奏', icon: '♫', color: 0xd88945 },
    { id: 'board', label: '棋盤策略', icon: '♟', color: 0x7c68ac }
]);

export const MINI_GAME_CATALOG = Object.freeze([
    {id:'forest_starflight',scene:'ForestStarflightGame',category:'rhythm',icon:'🌟',title:'森林星航瘋狂隊',subtitle:'橫向飛行 × 循環強化 × 城堡首領',description:'飛越糖果雲海、市集與積木拱門，救援星精靈、選擇六種強化。手機橫放。',status:'第一關開放',accent:0xc79b60,launchData:{}},
    {id:'phantom_realm',scene:'PhantomRealmGame',category:'observation',icon:'📖',title:'幻界・星芽谷｜繪本版',subtitle:'星之森 × 月亮湖 × 裝備與魔法',description:'靠近居民聽故事，探索荷葉路，用泡泡安撫動物。HP／MP、換裝與技能 A／B 已開放。',status:'繪本冒險・兩區開放',accent:0x8fc9cf,launchData:{}},
    {id:'forest_night_watch',scene:'ForestNightWatchGame',category:'rhythm',icon:'🌙',title:'森林守夜隊',subtitle:'左搖桿 × 淨化戰鬥 × 防線建設',description:'阿晨晨守護月光樹：探索補給、選擇祝福、守住三波夢霧。橫向操作。',status:'第一關開放',accent:0xc6b575,launchData:{}},
    {id:'starlight_detective',scene:'StarlightDetectiveGame',category:'observation',icon:'🔎',title:'星湖偵探社',subtitle:'三件委託與一封祕密邀請',description:'調查、追問、連結證據與重建現場。偵探案件會自動保存。',status:'已開放',accent:0xd5b477,launchData:{}},
    {
        id:'forest_kitchen', scene:'ForestKitchenGame', category:'rhythm', icon:'🍳',
        title:'森林餐車大亂鬥', subtitle:'6 座廚房 · 料理與隊員分工',
        description:'指揮三名動物主廚，同時備料開火，趕蜜蜂、解凍工作台，挑戰三幕宴會。',
        status:'新遊戲・玩法初版', accent:0x9b784b, launchData:{mode:'cooking'}
    },
    {
        id:'forest_assault', scene:'ForestAssaultGame', category:'rhythm', icon:'⚡',
        title:'森林突擊小隊', subtitle:'6 場戰役 · 跑跳射擊與載具',
        description:'組合武器與配置，駕駛甲蟲坦克、探索救援，挑戰六隻多階段頭目。',
        status:'新遊戲・玩法初版', accent:0x507b59, launchData:{mode:'action'}
    },
    {
        id:'forest_sky', scene:'ForestSkyGame', category:'rhythm', icon:'✈',
        title:'森林天空守衛隊', subtitle:'15 關 · 飛行射擊與頭目戰',
        description:'駕駛青葉戰機，升級四種武器，閃避彈幕、救援護送並迎戰五大頭目。',
        status:'新遊戲・小學生版', accent:0x4d948a, launchData:{mode:'school'}
    },
    {
        id:'forest_fruit', scene:'ForestFruitGame', category:'rhythm', icon:'🍒',
        title:'森林果實彈射隊', subtitle:'15 關＋每日挑戰 · 瞄準連鎖',
        description:'反彈射果、拆支點救小鳥，挑戰花粉染色、松果連爆與三幕樹靈。',
        status:'新遊戲・小學生版', accent:0x73965b, launchData:{mode:'school'}
    },
    {
        id:'forest_morph', scene:'ForestMorphGame', category:'rhythm', icon:'🍄',
        title:'森林變形大冒險', subtitle:'12 關 · 跑跳變形與探索',
        description:'化身三種精靈，鑽洞、破藤、開門，搭葉舟、踩彈跳菇找森林徽章。',
        status:'新遊戲・小學生版', accent:0x65aa8a, launchData:{mode:'school'}
    },
    {
        id:'forest_courier', scene:'ForestCourierGame', category:'board', icon:'📮',
        title:'森林快遞調度站', subtitle:'18 關＋12 委託 · 路線規劃',
        description:'安排裝貨與送貨順序，挑戰限重捷徑、開橋、前置委託和保鮮配送。',
        status:'新遊戲・小學生版', accent:0x9b8053, launchData:{mode:'school'}
    },
    {
        id:'light_workshop', scene:'LightWorkshopGame', category:'observation', icon:'🦉',
        title:'森林光路工坊', subtitle:'20 關 · 反射分光與混色',
        description:'轉動鏡子、安排分光與濾色，同時點亮水晶並避開暗晶。',
        status:'新遊戲・小學生版', accent:0x637cad, launchData:{mode:'school'}
    },
    {
        id: 'forest_mechanism', scene: 'ForestMechanismGame', category: 'board', icon: '🦊',
        title: '森林機關探險', subtitle: '18 關 · 推箱與機關冒險',
        description: '推箱壓底座、開門搭橋、跨區傳送，規劃路線挑戰三星。',
        status: '新遊戲・小學生版', accent: 0x667e4e, launchData: { mode: 'school' }
    },
    {
        id: 'ocean_cleanup', scene: 'OceanCleanupGame', category: 'observation', icon: '🐠',
        title: '海洋清理隊', subtitle: '辨認垃圾 → 分類 → 任務',
        description: '跟兔子船長收垃圾、保護海洋朋友，再練習分類與數量。',
        status: '新遊戲・幼童試玩', accent: 0x2785a0, launchData: { mode: 'kids' }
    },
    {
        id: 'color_bubble', scene: 'ColorBubbleGame', category: 'observation', icon: '🫧',
        title: '彩色泡泡隊', subtitle: '顏色 → 圖形 → 雙條件',
        description: '看圖卡找泡泡，先認顏色，再認圖形，最後一起比對。',
        status: '新遊戲・幼童試玩', accent: 0x719fc1, launchData: { mode: 'kids' }
    },
    {
        id: 'animal_snack',
        scene: 'AnimalSnackGame',
        category: 'rhythm',
        icon: '🥕',
        title: '動物點心隊',
        subtitle: '森林配送 · 幼童試玩',
        description: '看客人、選點心，自動送出！送錯不扣命，朋友會再來。',
        status: '新遊戲・幼童試玩',
        accent: 0x78a483,
        launchData: { mode: 'kids' }
    },
    {
        id: 'bush_minesweeper',
        scene: 'BushExplore',
        stageId: 'bush_01',
        category: 'observation',
        icon: '🌿',
        title: '草叢探險①',
        subtitle: '6×6 森林小偵探',
        description: '看懂周圍數字，找出所有安全草叢。',
        status: '幼童版完成',
        accent: 0x74a85d
    },
    {
        id: 'constellation',
        scene: 'ConstellationGame',
        stageId: 'constellation_01',
        category: 'observation',
        icon: '🌟',
        title: '星空連線①',
        subtitle: '星光密碼',
        description: '比對顏色、圖形、數量與大小，選出正確星路。',
        status: '幼童版完成',
        accent: 0x697ec3
    },
    {
        id: 'animal_food',
        scene: 'AnimalFoodMatch',
        stageId: 'animals_01',
        category: 'matching',
        icon: '🐻',
        title: '森林歷險①',
        subtitle: '動物點心時間',
        description: '幫每位森林朋友找到牠最喜歡的點心。',
        status: '幼童版完成',
        accent: 0xb56c55
    },
    {
        id: 'memory_match',
        scene: 'MemoryMatchGame',
        category: 'matching',
        icon: '🃏',
        title: '記憶翻牌',
        subtitle: '森林記憶挑戰',
        description: '翻開卡片、記住位置，找出相同的一對。',
        status: '基礎版可測',
        accent: 0xc1789c,
        launchData: {
            aiDifficulty: 'normal',
            matchMode: 'same'
        }
    },
    {
        id: 'firefly_rhythm',
        scene: 'FireflyCatchGame',
        stageId: 'firefly_01',
        category: 'rhythm',
        icon: '✨',
        title: '點點螢火①',
        subtitle: '螢火小舞曲',
        description: '看螢火蟲飛進同色花圈，跟著節拍點亮牠。',
        status: '幼童版完成',
        accent: 0x56a987
    },
    {
        id: 'campfire',
        scene: 'CampfireGame',
        stageId: 'campfire_01',
        category: 'rhythm',
        icon: '🔥',
        title: '營火晚會①',
        subtitle: '棉花糖烤烤樂',
        description: '看準往返火候，在金黃色區點下棉花糖。',
        status: '幼童版完成',
        accent: 0xd97a43,
        launchData: { mode: 'kids' }
    },
    {
        id: 'shape_color',
        scene: 'ShapeColorGame',
        category: 'board',
        icon: '🧩',
        title: '形色棋',
        subtitle: '顏色與形狀策略',
        description: '把同色或同形的牌排成線，思考最佳落點。',
        status: '基礎版可測',
        accent: 0x6f82c7
    },
    {
        id: 'bush_banqi',
        scene: 'BushBanqiMiniGame',
        stageId: 'banqi_01',
        category: 'board',
        icon: '♟',
        title: '象棋暗棋',
        subtitle: '森林翻棋對戰',
        description: '翻開棋子、判斷大小，和森林 AI 對戰。',
        status: 'AI 版可測',
        accent: 0x9a6650,
        launchData: { mode: 'ai' }
    }
]);

export function getMiniGamesByCategory(categoryId = 'all') {
    if (categoryId === 'all') return [...MINI_GAME_CATALOG];
    return MINI_GAME_CATALOG.filter((game) => game.category === categoryId);
}

export function getMiniGameCategory(categoryId) {
    return MINI_GAME_CATEGORIES.find((category) => category.id === categoryId)
        || MINI_GAME_CATEGORIES[0];
}
