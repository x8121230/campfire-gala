export const DEVELOPMENT_UNLOCK_ALL = true;

export const WORLD_REGIONS = [
    { id: 'forest', name: '森林', icon: '🌲', mechanic: '教學・探索・收集', x: 620, y: 325, haloWidth: 270, haloHeight: 190, unlockStars: 0 },
    { id: 'fairy', name: '妖精村落', icon: '🧚', mechanic: '委託・商店・培育', x: 875, y: 270, haloWidth: 205, haloHeight: 145, unlockStars: 12 },
    { id: 'ice', name: '冰原', icon: '❄️', mechanic: '滑行・風向・落冰', x: 520, y: 135, haloWidth: 285, haloHeight: 150, unlockStars: 24 },
    { id: 'volcano', name: '暖焰火山谷', icon: '🌋', mechanic: '溫度・節奏・鍛造', x: 1070, y: 365, haloWidth: 255, haloHeight: 195, unlockStars: 30 },
    { id: 'realm', name: '幻界・星芽谷', icon: '🌀', mechanic: '點擊星核漩渦・進入微光星芽谷', x: 1160, y: 145, haloWidth: 190, haloHeight: 178, unlockStars: 0, alwaysUnlocked: true, navigation: 'portal', targetScene: 'RealmWorldGame' },
    { id: 'water', name: '水世界', icon: '🌊', mechanic: '水流・泡泡・通道', x: 690, y: 480, haloWidth: 300, haloHeight: 155, unlockStars: 3, guideBackground: 'water_region_overview_v1' },
    { id: 'starlight', name: '星光湖畔', icon: '✨', mechanic: '霧氣・聲音・隱路', x: 675, y: 590, haloWidth: 225, haloHeight: 145, unlockStars: 18 },
    { id: 'dinosaur', name: '恐龍山谷', icon: '🦕', mechanic: '化石・追蹤・巨獸', x: 260, y: 315, haloWidth: 270, haloHeight: 185, unlockStars: 21 },
    { id: 'chess', name: '棋藝王國', icon: '♟️', mechanic: '格子・順序・策略', x: 170, y: 555, haloWidth: 190, haloHeight: 140, unlockStars: 42 },
    { id: 'cloud', name: '雲端島嶼', icon: '☁️', mechanic: '飛行・氣流・平台', x: 870, y: 105, haloWidth: 180, haloHeight: 125, unlockStars: 48 }
];

export const REGION_SUBMAPS = {
    forest: [
        {
            id: 'morning_camp', name: '晨光營地', icon: '🏕️',
            description: '初始地、教學、衣櫃與森林朋友', reward: '晨光探險帽',
            stageIds: ['bush_01', 'campfire_01'], slots: 4, background: 'forest_morning_camp_v2'
        },
        {
            id: 'emerald_woods', name: '翡翠樹海', icon: '🌳',
            description: '巨木、分岔道路、尋路與觀察', reward: '翡翠葉披風',
            stageIds: ['animals_01', 'firefly_01'], slots: 4, background: 'forest_emerald_woods_v2'
        },
        {
            id: 'mosslight_valley', name: '苔光溪谷', icon: '🫧',
            description: '溪流、木橋、水車與自然機關', reward: '苔光水車背包',
            stageIds: ['constellation_01'], slots: 3, background: 'forest_mosslight_valley_v2'
        }
    ],
    fairy: [
        {
            id: 'flower_crown_village', name: '花冠村莊', icon: '🌸',
            description: '妖精居民、委託與商店', reward: '花冠村民小斗篷',
            stageIds: [], slots: 3,
            background: 'fairy_flower_crown_village_storybook_v1', layout: 'storybook_map',
            subtitle: '沿著花瓣小徑，拜訪委託小屋、花冠廣場與花瓣商店',
            slotPlacements: [{ x: 245, y: 325 }, { x: 640, y: 235 }, { x: 1020, y: 330 }]
        },
        {
            id: 'dew_garden', name: '露珠花園', icon: '🌷',
            description: '巨型花草、顏色配對、培育與採集', reward: '晨露花瓣裙',
            stageIds: [], slots: 4,
            background: 'fairy_dew_garden_storybook_v1', layout: 'storybook_map',
            subtitle: '收集晶瑩晨露，替巨花調色並照顧新生花苗',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'moon_butterfly_market', name: '月蝶秘市', icon: '🦋',
            description: '黃昏商店、交換與稀有收藏', reward: '月蝶收藏披肩',
            stageIds: [], slots: 3,
            background: 'fairy_moon_butterfly_market_storybook_v1', layout: 'storybook_map',
            subtitle: '穿過月蝶拱門，在黃昏秘市尋找會發光的稀有收藏',
            slotPlacements: [{ x: 245, y: 325 }, { x: 640, y: 235 }, { x: 1020, y: 330 }]
        }
    ],
    ice: [
        {
            id: 'snowbell_field', name: '雪鈴原野', icon: '⛄',
            description: '雪堆、足跡追蹤、風向與入門探索', reward: '雪鈴暖耳帽',
            stageIds: [], slots: 4,
            background: 'ice_snowbell_field_storybook_v1', layout: 'storybook_map',
            subtitle: '循著雪地足跡，聽雪鈴聲找到溫暖的小屋',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'ice_mirror_lake', name: '冰鏡湖', icon: '⛸️',
            description: '鏡面反射、滑冰路線與稜鏡光線', reward: '冰鏡滑行披風',
            stageIds: [], slots: 4,
            background: 'ice_mirror_lake_storybook_v1', layout: 'storybook_map',
            subtitle: '沿著彩色冰紋滑行，讓稜鏡光芒照亮鏡面湖泊',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'aurora_palace', name: '極光冰宮', icon: '🏰',
            description: '冰柱機關、極光密碼與區域首領', reward: '極光冰晶王冠',
            stageIds: [], slots: 3,
            background: 'ice_aurora_palace_storybook_v1', layout: 'storybook_map',
            subtitle: '轉動冰晶柱，解開極光密碼並走向冰宮深處',
            slotPlacements: [{ x: 245, y: 325 }, { x: 640, y: 235 }, { x: 1020, y: 330 }]
        }
    ],
    volcano: [
        {
            id: 'warmflame_foothill', name: '暖焰山腳', icon: '♨️',
            description: '溫暖岩地、間歇噴氣與火山生物', reward: '暖焰探險靴',
            stageIds: [], slots: 4,
            background: 'volcano_warmflame_foothill_storybook_v1', layout: 'storybook_map',
            subtitle: '穿過暖暖的噴氣石群，拜訪會發光的火山山腳',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'molten_workshop', name: '熔火工坊', icon: '⚒️',
            description: '鍛造、形狀組合與溫度控制', reward: '熔火工匠圍裙',
            stageIds: [], slots: 4,
            background: 'volcano_molten_workshop_storybook_v1', layout: 'storybook_map',
            subtitle: '挑選形狀、調整溫度，在暖呼呼的工坊打造閃亮素材',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'starfire_summit', name: '星火山頂', icon: '🌋',
            description: '落石預警、熔岩路線與火山首領', reward: '星火守護披風',
            stageIds: [], slots: 3,
            background: 'volcano_starfire_summit_storybook_v1', layout: 'storybook_map',
            subtitle: '看懂星火預警，踏過熔岩平台抵達山頂星冠舞台',
            slotPlacements: [{ x: 245, y: 325 }, { x: 640, y: 235 }, { x: 1020, y: 330 }]
        }
    ],
    water: [
        {
            id: 'bubble_bay', name: '泡泡淺灣', icon: '🫧',
            description: '明亮淺海與幼兒友善泡泡機關', reward: '珍珠泡泡頭飾',
            stageIds: ['bubble_bay_bubbles', 'bubble_bay_cleanup'],
            slots: 4, background: 'water_bubble_bay_storybook_v1', layout: 'storybook_map',
            subtitle: '在珍珠、泡泡與溫柔水流間展開淺海冒險',
            stagePlacements: {
                bubble_bay_bubbles: { x: 255, y: 315 },
                bubble_bay_cleanup: { x: 650, y: 245 }
            },
            slotPlacements: [{ x: 255, y: 315 }, { x: 650, y: 245 }, { x: 1030, y: 330 }, { x: 1120, y: 575 }]
        },
        {
            id: 'coral_maze', name: '珊瑚迷宮', icon: '🪸',
            description: '水流、旋轉通道與海馬救援', reward: '珊瑚探路披風',
            stageIds: ['bubble_bay_waterflow'], slots: 4,
            background: 'water_coral_maze_storybook_v1', layout: 'storybook_map',
            subtitle: '轉動貝殼水門，沿著珊瑚岔路尋找出口',
            stagePlacements: { bubble_bay_waterflow: { x: 640, y: 245 } },
            slotPlacements: [{ x: 250, y: 320 }, { x: 640, y: 245 }, { x: 1020, y: 330 }, { x: 1110, y: 575 }]
        },
        {
            id: 'jellyfish_palace', name: '水母宮殿', icon: '🪼',
            description: '發光水母、節奏燈光與深海入口', reward: '月光水母小皇冠',
            stageIds: [], slots: 3,
            background: 'water_jellyfish_palace_storybook_v1', layout: 'storybook_map',
            subtitle: '沿著珍珠燈廊，拜訪會唱歌的發光水母',
            slotPlacements: [{ x: 245, y: 325 }, { x: 640, y: 235 }, { x: 1020, y: 330 }]
        }
    ],
    starlight: [
        {
            id: 'moonshadow_shore', name: '月影湖岸', icon: '🌙',
            description: '靜謐夜景、釣魚、腳印與湖畔任務', reward: '月影星光斗篷',
            stageIds: [], slots: 4,
            background: 'starlight_moonshadow_shore_storybook_v1', layout: 'storybook_map',
            subtitle: '沿著月光與神祕腳印，在寧靜湖岸尋找星光任務',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'glow_reeds', name: '螢光蘆葦蕩', icon: '🪷',
            description: '霧氣、聲音提示與隱藏荷葉道路', reward: '螢光蘆葦耳飾',
            stageIds: [], slots: 4,
            background: 'starlight_glow_reeds_storybook_v1', layout: 'storybook_map',
            subtitle: '聽著蘆葦鈴聲，穿過薄霧找到發光的荷葉道路',
            slotPlacements: [{ x: 245, y: 315 }, { x: 620, y: 235 }, { x: 1010, y: 315 }, { x: 1100, y: 565 }]
        },
        {
            id: 'star_sunken_heart', name: '星沉湖心', icon: '🦢',
            description: '星空倒影、月冠天鵝與湖心聖域', reward: '月冠天鵝髮飾',
            stageIds: [], slots: 3,
            background: 'starlight_star_sunken_heart_storybook_v1', layout: 'storybook_map',
            subtitle: '循著星空倒影，前往月冠天鵝守護的湖心聖域',
            slotPlacements: [{ x: 245, y: 315 }, { x: 640, y: 235 }, { x: 1030, y: 315 }]
        }
    ],
    dinosaur: [
        {
            id: 'fossil_wilds', name: '化石荒野', icon: '🦴',
            description: '挖掘化石、骨骼拼圖與足跡辨識', reward: '小小化石探險帽',
            stageIds: [], slots: 4,
            background: 'dinosaur_fossil_wilds_storybook_v1', layout: 'storybook_map',
            subtitle: '拿起小刷子，沿著巨大足跡尋找荒野裡的遠古祕密',
            slotPlacements: [{ x: 240, y: 345 }, { x: 560, y: 225 }, { x: 1080, y: 245 }, { x: 1040, y: 520 }]
        },
        {
            id: 'giant_fern_jungle', name: '巨蕨叢林', icon: '🥚',
            description: '高草探索、恐龍蛋照護與足跡追蹤', reward: '彩蛋照護小背包',
            stageIds: [], slots: 4,
            background: 'dinosaur_giant_fern_jungle_storybook_v1', layout: 'storybook_map',
            subtitle: '穿過巨大的蕨葉，照顧彩蛋並追尋泥地裡的小腳印',
            slotPlacements: [{ x: 220, y: 350 }, { x: 600, y: 215 }, { x: 1080, y: 205 }, { x: 1030, y: 505 }]
        },
        {
            id: 'ancient_nest_valley', name: '遠古巢谷', icon: '🦖',
            description: '大型草食恐龍、遠古蛋巢與落石預警', reward: '遠古守護披風',
            stageIds: [], slots: 3,
            background: 'dinosaur_ancient_nest_valley_storybook_v1', layout: 'storybook_map',
            subtitle: '走進壯闊巢谷，拜訪守護遠古蛋巢的溫柔長頸龍',
            slotPlacements: [{ x: 230, y: 350 }, { x: 640, y: 225 }, { x: 1070, y: 350 }]
        }
    ],
    chess: [
        {
            id: 'pawn_harbor', name: '兵卒港口', icon: '♟️',
            description: '兵卒移動、棋盤格路線與港口渡橋', reward: '小兵卒水手帽',
            stageIds: [], slots: 3,
            background: 'chess_pawn_harbor_storybook_v1', layout: 'storybook_map',
            subtitle: '搭上兵卒小船，沿著棋盤格渡橋進入策略王國',
            slotPlacements: [{ x: 235, y: 350 }, { x: 640, y: 235 }, { x: 1060, y: 320 }]
        },
        {
            id: 'knight_gallery', name: '騎士迴廊', icon: '♞',
            description: 'L 形移動、路線預測與城堡機關門', reward: '星紋騎士小披風',
            stageIds: [], slots: 4,
            background: 'chess_knight_gallery_storybook_v1', layout: 'storybook_map',
            subtitle: '跟著騎士的跳躍步伐，穿過閃亮長廊與魔法機關門',
            slotPlacements: [{ x: 225, y: 330 }, { x: 585, y: 225 }, { x: 1035, y: 255 }, { x: 1080, y: 520 }]
        },
        {
            id: 'crown_chess_city', name: '王冠棋城', icon: '♛',
            description: '棋子順序、綜合策略與王城挑戰', reward: '棋藝大師王冠',
            stageIds: [], slots: 3,
            background: 'chess_crown_city_storybook_v1', layout: 'storybook_map',
            subtitle: '登上閃耀的王冠棋城，拜訪棋塔書庫、王冠宮殿與策略花園',
            slotPlacements: [{ x: 235, y: 335 }, { x: 640, y: 220 }, { x: 1050, y: 340 }]
        }
    ],
    cloud: [
        {
            id: 'cloud_meadow', name: '雲朵牧場', icon: '🐑',
            description: '柔軟雲台、風向與飛行入門', reward: '彩虹飛行小披風',
            stageIds: [], slots: 4,
            background: 'cloud_meadow_storybook_v1', layout: 'storybook_map',
            subtitle: '踏上軟綿綿的雲台，拜訪綿羊牧場、彩虹風車與飛行碼頭',
            slotPlacements: [{ x: 230, y: 335 }, { x: 600, y: 205 }, { x: 1060, y: 260 }, { x: 1070, y: 525 }]
        },
        {
            id: 'windchime_isle', name: '風鈴浮島', icon: '🎐',
            description: '氣流升降、節奏風鈴與空中跳躍', reward: '水晶風鈴翅膀',
            stageIds: [], slots: 4,
            background: 'cloud_windchime_isle_storybook_v1', layout: 'storybook_map',
            subtitle: '聽著五彩風鈴的旋律，乘上柔和氣流拜訪漂浮小島',
            slotPlacements: [{ x: 225, y: 320 }, { x: 610, y: 205 }, { x: 1045, y: 260 }, { x: 1080, y: 515 }]
        },
        {
            id: 'sky_temple', name: '天空神殿', icon: '⚡',
            description: '升降平台、星雷水晶與天空神殿', reward: '星風守護羽冠',
            stageIds: [], slots: 3,
            background: 'cloud_sky_temple_storybook_v1', layout: 'storybook_map',
            subtitle: '穿過柔亮星雷庭院，登上金翼平台拜訪雲端最高神殿',
            slotPlacements: [{ x: 230, y: 335 }, { x: 640, y: 205 }, { x: 1060, y: 350 }]
        }
    ]
};

export function getRegion(id) {
    return WORLD_REGIONS.find((region) => region.id === id) || WORLD_REGIONS[0];
}

export function getSubmap(regionId, submapId) {
    return (REGION_SUBMAPS[regionId] || []).find((submap) => submap.id === submapId) || null;
}
