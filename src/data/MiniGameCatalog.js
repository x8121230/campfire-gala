export const MINI_GAME_CATEGORIES = Object.freeze([
    { id: 'all', label: '全部', icon: '🏡', color: 0x5f9860 },
    { id: 'observation', label: '觀察推理', icon: '🔎', color: 0x4f91a8 },
    { id: 'matching', label: '配對記憶', icon: '🧠', color: 0xb66d8e },
    { id: 'rhythm', label: '反應節奏', icon: '♫', color: 0xd88945 },
    { id: 'board', label: '棋盤策略', icon: '♟', color: 0x7c68ac }
]);

export const MINI_GAME_CATALOG = Object.freeze([
    {
        id: 'forest_starflight', scene: 'ForestStarflightGame', category: 'rhythm', icon: '🌟',
        title: '森林星航瘋狂隊', subtitle: '4＋1 機體・七區怪物・可玩式亂流航線',
        description: '每局隨機抽出三個不重複區域，以可玩的星風亂流無縫接續。亂流具有上下氣流、星砂安全航道與限時星願寶箱鳥；生命、武器、能量與冷卻全程延續，第三區後迎戰專屬首領。手機請橫放。',
        status: 'v0.10.14・星芽鈴／子彈時間', accent: 0xc79b60, launchData: {}
    },
    {
        id: 'fruit_counting', scene: 'FruitCountingGame', category: 'observation', icon: '🍎',
        title: '魔法果園：訂單大作戰', subtitle: '10 關訂單・連擊・記憶・限時挑戰',
        description: '替森林客人完成混合數量、加減法、指定順序、成熟度與限時訂單；提防松鼠偷果，善用彩虹果並累積採收連擊。',
        status: 'v2.0・成年玩法原型', accent: 0x73a45f, launchData: { mode: 'challenge' }
    },
    {
        id: 'starlight_firefly', scene: 'StarlightFireflyGame', category: 'matching', icon: '✨',
        title: '星光湖畔', subtitle: '看閃光・照順序點',
        description: '觀察四隻螢火蟲的閃爍順序，再照順序或倒序點回去；點錯會溫柔重播。',
        status: '湖畔候選 v0.1・幼童試玩', accent: 0x597fb0, launchData: { mode: 'kids' }
    },
    {
        id: 'jump_climb_kids', scene: 'JumpClimbGame', category: 'rhythm', icon: '⛰️',
        title: '跳躍登頂', subtitle: '按住蓄力・放開跳躍',
        description: '控制蓄力時機跳上寬平台；力量太少或太多，都由彈力葉安全接回。',
        status: '登頂候選 v0.1・幼童試玩', accent: 0x628f7e, launchData: { mode: 'kids' }
    },
    {
        id: 'water_flow_maze', scene: 'WaterFlowMazeGame', category: 'board', icon: '💧',
        title: '水流迷宮', subtitle: '旋轉水道・澆灌花朵',
        description: '旋轉 2～4 塊大型水道，讓小水滴沿著正確方向流到等待盛開的花朵。',
        status: '水世界 v0.1・幼童試玩', accent: 0x4aa6b8, launchData: { mode: 'kids' }
    },
    {
        id: 'dinosaur_valley_kids', scene: 'DinosaurValleyGame', category: 'rhythm', icon: '🦕',
        title: '恐龍山谷跑酷', subtitle: '自動前進・單鍵跳躍',
        description: '跳過石頭、倒木與泥地，尋找十位恐龍朋友；碰撞只會短暫減速。',
        status: '恐龍山谷 v0.1・幼童試玩', accent: 0x6e9c58, launchData: { mode: 'kids' }
    },
    {
        id: 'cloud_glide_kids', scene: 'CloudGlideGame', category: 'rhythm', icon: '☁️',
        title: '阿晨晨・雲端滑翔', subtitle: '水彩雲圈・稀有金圈・彩虹爆發',
        description: '陪阿晨晨飛進童話水彩雲海，選擇分岔航線、結交天空朋友，穿越金圈與彩虹圈，最後迎戰暴風雲鯨。',
        status: '空中屬性 v1.4・水彩生物完成版', accent: 0x58a7c7, launchData: { mode: 'challenge' }
    },
    {
        id: 'lava_step', scene: 'LavaStepGame', category: 'rhythm', icon: '🪨',
        title: '熔岩踏石', subtitle: '看時機・安全踏石',
        description: '觀察熔岩與踏石節奏，在安全時機跨過火熱路面。',
        status: '火焰系列 v0.1', accent: 0xb95736, launchData: { mode: 'kids' }
    },
    {
        id: 'cooling_workshop', scene: 'CoolingWorkshopGame', category: 'observation', icon: '❄️',
        title: '冷卻工坊', subtitle: '觀察溫度・幫忙降溫',
        description: '依照溫度提示使用正確冷卻方法，讓火熱工坊恢復安全。',
        status: '火焰系列 v0.2', accent: 0x4e9fbd, launchData: { mode: 'kids' }
    },
    {
        id: 'lava_pipe', scene: 'LavaPipeGame', category: 'board', icon: '🚿',
        title: '水管接接樂', subtitle: '旋轉水管・接通冷水',
        description: '旋轉水管接出完整路線，把冷水送到需要降溫的地方。',
        status: '火焰系列 v0.3', accent: 0xc76a37, launchData: { mode: 'kids' }
    },
    {
        id: 'volcano_echo', scene: 'VolcanoEchoGame', category: 'matching', icon: '🎵',
        title: '洞穴回聲', subtitle: '聽聲音・照順序回應',
        description: '記住火山洞穴傳來的回聲順序，再依序敲出相同旋律。',
        status: '火焰系列 v0.4', accent: 0x8d536f, launchData: { mode: 'kids' }
    },
    {
        id: 'lava_bridge', scene: 'LavaBridgeGame', category: 'board', icon: '🌉',
        title: '熔岩河搭橋', subtitle: '排列橋板・跨越熔岩',
        description: '比較橋板長短並排出安全道路，幫小探險家越過熔岩河。',
        status: '火焰系列 v0.5', accent: 0xa86b3f, launchData: { mode: 'kids' }
    },
    {
        id: 'lava_bubble_pop', scene: 'LavaBubblePopGame', category: 'rhythm', icon: '🫧',
        title: '啵啵彩色岩漿泡泡', subtitle: '看提示・點對泡泡',
        description: '依照顏色提示點破正確的岩漿泡泡，避開不需要的顏色。',
        status: '火焰系列 v0.1', accent: 0xe96c73, launchData: { mode: 'kids' }
    },
    {
        id: 'ptero_fossil', scene: 'PteroFossilPuzzleGame', category: 'matching', icon: '🦴',
        title: '彈果翼龍化石拼圖', subtitle: '辨認形狀・拼回化石',
        description: '把散落的翼龍化石放回正確輪廓，完成可愛的古生物拼圖。',
        status: '火焰系列 v0.2', accent: 0xa97855, launchData: { mode: 'kids' }
    },
    {
        id: 'volcano_gem_cart', scene: 'VolcanoGemCartGame', category: 'observation', icon: '💎',
        title: '火山寶石分類車', subtitle: '看顏色・分寶石',
        description: '觀察寶石顏色與種類，把它們送進正確的礦車。',
        status: '火焰系列 v0.3', accent: 0xc56f45, launchData: { mode: 'kids' }
    },
    {
        id: 'hot_spring_capybara', scene: 'HotSpringCapybaraGame', category: 'matching', icon: '♨️',
        title: '溫泉水豚躲貓貓', subtitle: '記住位置・找到水豚',
        description: '記住水豚藏在哪座溫泉後，再從蒸氣中找出牠們。',
        status: '火焰系列 v0.4', accent: 0x9a7180, launchData: { mode: 'kids' }
    },
    {
        id: 'jelly_sea_bridge', scene: 'JellySeaBridgeGame', category: 'board', icon: '🪨',
        title: '造橋過果凍海', subtitle: '比較大小・依序搭橋',
        description: '依照大小順序排列踏板，搭出能安全通過果凍海的橋。',
        status: '火焰系列 v0.5', accent: 0xb65b3d, launchData: { mode: 'kids' }
    },
    {
        id: 'penguin_slide_maze', scene: 'PenguinSlideMazeGame', category: 'board', icon: '🐧',
        title: '企鵝滑冰迷宮', subtitle: '想方向・滑到營火',
        description: '規劃上下左右的順序，讓企鵝滑到障礙前停下，最後抵達營火。',
        status: '備用原型・幼童試玩', accent: 0x579eb9, launchData: { mode: 'kids' }
    },
    {
        id: 'snow_house_memory', scene: 'SnowHouseMemoryGame', category: 'matching', icon: '🏠',
        title: '雪屋躲貓貓', subtitle: '看位置・找一對',
        description: '先看動物躲進哪間雪屋，再打開兩間，找出相同的朋友。',
        status: '備用原型・幼童試玩', accent: 0x78b2c5, launchData: { mode: 'kids' }
    },
    {
        id: 'ice_fishing', scene: 'IceFishingGame', category: 'observation', icon: '🎣',
        title: '冰窟釣魚對對碰', subtitle: '認顏色・數一數',
        description: '看小熊需要的魚色與數量，點擊冰窟裡游過的正確小魚。',
        status: '備用原型・幼童試玩', accent: 0x58aac3, launchData: { mode: 'kids' }
    },
    {
        id: 'snowman_shape', scene: 'SnowmanShapeGame', category: 'matching', icon: '⛄',
        title: '形狀雪人拼拼樂', subtitle: '拖形狀・拼雪人',
        description: '把圓形、三角形和長方形放進輪廓；點一下也能自動吸附。',
        status: '備用原型・幼童試玩', accent: 0x73b8c9, launchData: { mode: 'kids' }
    },
    {
        id: 'ice_tap_rescue', scene: 'IceTapRescueGame', category: 'observation', icon: '🧊',
        title: '敲冰塊救救橡果', subtitle: '觀察支撐・敲碎冰塊',
        description: '觀察橡果腳下的支撐冰塊，依序敲碎，安全落到雪堆。',
        status: '備用原型・幼童試玩', accent: 0x66b7ca, launchData: { mode: 'kids' }
    },
    {
        id: 'sled_delivery', scene: 'SledDeliveryGame', category: 'rhythm', icon: '🎁',
        title: '北極熊雪橇快遞', subtitle: '調速度・送禮物',
        description: '控制雪橇快慢，等雪屋進入配送區，再把五份禮物送出去。',
        status: '新遊戲・幼童試玩', accent: 0x5b9db7, launchData: { mode: 'kids' }
    },
    {
        id: 'seal_rescue', scene: 'SealRescueGame', category: 'observation', icon: '🦭',
        title: '小海豹冰河救援', subtitle: '選浮冰・找海豹',
        description: '選擇浮冰自動跳躍，找到五隻小海豹；落水會由鯨魚接住。',
        status: '新遊戲・幼童試玩', accent: 0x5aaec5, launchData: { mode: 'kids' }
    },
    {
        id: 'snowball_defense', scene: 'SnowballDefenseGame', category: 'rhythm', icon: '❄️',
        title: '雪球防衛隊', subtitle: '點雪怪・自動發射',
        description: '守護冰晶小屋，點擊三條雪道上的雪怪，自動丟出雪球。',
        status: '新遊戲・幼童試玩', accent: 0x579db9, launchData: { mode: 'kids' }
    },
    {
        id: 'penguin_ice_puzzle', scene: 'PenguinIcePuzzleGame', category: 'board', icon: '🐧',
        title: '企鵝冰塊推推樂', subtitle: '推冰塊・修冰橋',
        description: '幫小企鵝把冰塊推到發光圓圈，五關都能復原與提示。',
        status: '新遊戲・幼童試玩', accent: 0x63b8ca, launchData: { mode: 'kids' }
    },
    {
        id: 'ice_ski', scene: 'IceSkiGame', category: 'rhythm', icon: '⛷️',
        title: '冰原滑雪大冒險', subtitle: '左右滑行・跳過障礙',
        description: '在雪道上左右滑行、跳過障礙，收集 12 顆藍色冰晶。',
        status: '新遊戲・幼童試玩', accent: 0x4aa8c2, launchData: { mode: 'kids' }
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
    },
    {
        id: 'standalone_cloud_glider', category: 'rhythm', icon: '☁️',
        title: '雲端滑翔隊', subtitle: '天空獨立玩法・控制升降',
        description: '控制小小滑翔員穿越雲海與風圈，避開障礙並收集天空星光。',
        status: '天空 DEMO v0.1', accent: 0x66a9cc, standaloneFolder: 'Cloud_Glider_v0_1'
    },
    {
        id: 'standalone_cloud_shapes', category: 'matching', icon: '☁️',
        title: '雲朵變變變', subtitle: '觀察輪廓・配對形狀',
        description: '觀察雲朵變成的可愛圖案，找出相同輪廓並完成配對。',
        status: '天空 DEMO v0.1', accent: 0x8eb9d2, standaloneFolder: 'Cloud_Shapes_v0_1'
    },
    {
        id: 'standalone_rainbow_bridge', category: 'board', icon: '🌈',
        title: '彩虹橋修理隊', subtitle: '安排橋片・接通道路',
        description: '旋轉與排列彩虹橋片，讓斷開的天空道路重新連接。',
        status: '天空 DEMO v0.1', accent: 0xb578bd, standaloneFolder: 'Rainbow_Bridge_v0_1'
    },
    {
        id: 'standalone_raindrop_home', category: 'board', icon: '💧',
        title: '小雨滴回家', subtitle: '規劃水路・送回雲朵',
        description: '安排安全路線，引導迷路的小雨滴避開障礙回到雲朵家。',
        status: '天空 DEMO v0.1', accent: 0x63aeca, standaloneFolder: 'Raindrop_Home_v0_1'
    },
    {
        id: 'standalone_sky_delivery', category: 'rhythm', icon: '📦',
        title: '天空快遞隊', subtitle: '控制飛行・準時配送',
        description: '在雲島間調整速度與高度，把包裹平安送到指定目的地。',
        status: '天空 DEMO v0.1', accent: 0x5f9fc2, standaloneFolder: 'Sky_Delivery_v0_1'
    },
    {
        id: 'standalone_rainbow_cloud_pop', category: 'rhythm', icon: '🫧',
        title: '啵啵彩虹雲朵', subtitle: '看顏色・點泡泡',
        description: '依提示點破正確顏色的彩虹雲泡泡，完成輕快的反應挑戰。',
        status: '天空 DEMO v0.1', accent: 0xb66fa8, standaloneFolder: 'Rainbow_Cloud_Pop_v0_1'
    },
    {
        id: 'standalone_star_constellation', category: 'observation', icon: '⭐',
        title: '星星連線魔法', subtitle: '觀察星點・完成星座',
        description: '依照提示順序連接天空星點，讓藏在雲海上的星座亮起來。',
        status: '天空 DEMO v0.1', accent: 0x7184c2, standaloneFolder: 'Star_Constellation_Magic_v0_1'
    },
    {
        id: 'standalone_owl_balloon', category: 'rhythm', icon: '🎈',
        title: '貓頭鷹的熱氣球', subtitle: '調整火力・穿越雲層',
        description: '幫貓頭鷹控制熱氣球升降，穿越風帶並抵達下一座雲島。',
        status: '天空 DEMO v0.1', accent: 0xa37863, standaloneFolder: 'Owl_Hot_Air_Balloon_v0_1'
    },
    {
        id: 'standalone_cloud_chime', category: 'rhythm', icon: '♫',
        title: '雲端風鈴音樂會', subtitle: '聽節奏・敲風鈴',
        description: '跟著雲端旋律依序敲響風鈴，完成一場柔和的天空音樂會。',
        status: '天空 DEMO v0.1', accent: 0x78aaa4, standaloneFolder: 'Cloud_Chime_Concert_v0_1'
    },
    {
        id: 'standalone_sun_moon', category: 'observation', icon: '🌙',
        title: '太陽與月亮捉迷藏', subtitle: '找線索・辨認天空',
        description: '根據光影與雲朵線索，找出躲起來的太陽或月亮。',
        status: '天空 DEMO v0.1', accent: 0xc69054, standaloneFolder: 'Sun_Moon_Hide_Seek_v0_1'
    },
    {
        id: 'standalone_forest_stair', category: 'rhythm', icon: '🌲',
        title: '森林階梯探險隊', subtitle: '控制步伐・安全下樓',
        description: '掌握移動節奏走過森林階梯，避開落差並平安抵達終點。',
        status: '森林 DEMO v0.1', accent: 0x6f9a61, standaloneFolder: 'Forest_Stair_Adventure_v0_1'
    },
    {
        id: 'standalone_volleyball', category: 'rhythm', icon: '🏐',
        title: '阿晨晨打排球', subtitle: '移動跳躍・接球回擊',
        description: '控制阿晨晨移動與跳躍，把排球接起並送回對方場地。',
        status: '獨立遊戲 v1.0', accent: 0xd68155, standaloneFolder: 'AhChen_Volleyball_v1'
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
