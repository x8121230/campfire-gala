import { MINI_GAME_CATALOG } from './MiniGameCatalog.js?v=continuous093';
import { WORLD_REGIONS, REGION_SUBMAPS } from './WorldRegionData.js';

export const HANDBOOK_VERSION = 2;

export const HANDBOOK_TABS = Object.freeze([
    { id: 'equipment', icon: '🎒', label: '裝備衣櫥', color: 0x9a724b },
    { id: 'ecology', icon: '🌿', label: '生態圖鑑', color: 0x4f875e },
    { id: 'puzzles', icon: '🧩', label: '世界拼圖', color: 0x5d79a7 },
    { id: 'milestones', icon: '🏆', label: '成長成就', color: 0xb9873f },
    { id: 'regions', icon: '🗺️', label: '區域手冊', color: 0x7a669d }
]);

export const EQUIPMENT_FILTERS = Object.freeze([
    { id: 'all', label: '全部' },
    { id: 'cloth', label: '👕 衣服／披風' },
    { id: 'hat', label: '👒 帽子／頭飾' },
    { id: 'fullset', label: '🧸 整套服裝' },
    { id: 'collectible', label: '🪄 冒險道具' }
]);

export const RARITY_VIEW = Object.freeze({
    legendary: { id: 'dream', label: '夢幻', color: 0xe59de8, icon: '✦' },
    epic: { id: 'legendary', label: '傳說', color: 0xe0aa47, icon: '★' },
    rare: { id: 'rare', label: '稀有', color: 0x6da5d9, icon: '✧' },
    stage: { id: 'limited', label: '限定', color: 0x6eaa73, icon: '❧' },
    good: { id: 'common', label: '普通', color: 0xc8bca5, icon: '•' },
    common: { id: 'common', label: '普通', color: 0xc8bca5, icon: '•' },
    base: { id: 'common', label: '普通', color: 0xc8bca5, icon: '•' }
});

export function equipmentRarity(item = {}) {
    if (item.source === 'secret') return RARITY_VIEW.legendary;
    return RARITY_VIEW[item.rarity] || RARITY_VIEW.good;
}

export const ECOLOGY_CATEGORIES = Object.freeze([
    { id: 'all', label: '全部' }, { id: 'animals', label: '🐾 動物朋友' },
    { id: 'dinosaurs', label: '🦖 遠古恐龍' }, { id: 'plants', label: '🌸 奇幻植物' },
    { id: 'water', label: '🌊 水域精靈' }
]);

export const ECOLOGY_ENTRIES = Object.freeze([
    { id:'squirrel', category:'animals', icon:'🐿️', name:'蓬鬆松鼠', region:'forest', submap:'morning_camp', fact:'松鼠會把最喜歡的橡果藏在好多不同地方。', story:'牠總會留一顆最圓的橡果，送給願意慢慢觀察的朋友。', sound:'啾啾' },
    { id:'sleepy_bear', category:'animals', icon:'🐻', name:'貪睡熊', region:'forest', submap:'emerald_woods', fact:'熊的嗅覺非常靈敏，隔著好遠也能聞到點心。', story:'牠醒來第一件事，就是確認朋友們都有吃飽。', sound:'呼嚕' },
    { id:'fox', category:'animals', icon:'🦊', name:'搗蛋狐狸', region:'forest', submap:'mosslight_valley', fact:'狐狸會用耳朵辨認草叢裡非常細小的聲音。', story:'看似愛惡作劇，其實總在暗中替大家帶路。', sound:'嗚嗚' },
    { id:'capybara', category:'animals', icon:'🦫', name:'溫泉水豚', region:'volcano', submap:'warmflame_foothill', fact:'水豚很擅長游泳，也喜歡悠閒地泡在溫水裡。', story:'牠把暖焰山腳最舒服的位置留給第一次來的客人。', sound:'噗噗' },
    { id:'penguin', category:'animals', icon:'🐧', name:'胖企鵝', region:'ice', submap:'ice_mirror_lake', fact:'企鵝會用肚子貼著冰面滑行，快速又省力。', story:'跌倒並不可怕，牠總能笑著滑到朋友身旁。', sound:'嘎嘎' },
    { id:'moon_swan', category:'animals', icon:'🦢', name:'月冠天鵝', region:'starlight', submap:'star_sunken_heart', fact:'天鵝的羽毛能留住空氣，幫助身體浮在水面。', story:'月光落下時，牠的羽冠會替迷路的人亮起。', sound:'悠——' },
    { id:'longneck', category:'dinosaurs', icon:'🦕', name:'長頸龍', region:'dinosaur', submap:'giant_fern_jungle', fact:'長頸龍最喜歡吃高高的蕨類嫩葉。', story:'牠低下長長的脖子，讓小朋友看見樹梢的秘密。', sound:'嗚——' },
    { id:'trex_baby', category:'dinosaurs', icon:'🦖', name:'暴龍寶寶', region:'dinosaur', submap:'ancient_nest_valley', fact:'暴龍擁有強壯的後腿，跑步時尾巴會幫忙平衡。', story:'牠努力練習小聲走路，怕吵醒巢裡的蛋。', sound:'吼嗚' },
    { id:'triceratops', category:'dinosaurs', icon:'🦏', name:'三角龍', region:'dinosaur', submap:'fossil_wilds', fact:'三角龍的頭盾可能用來保護自己，也能彼此辨認。', story:'三根圓角像盾牌，總把年幼的朋友護在中間。', sound:'哞昂' },
    { id:'stegosaurus', category:'dinosaurs', icon:'🦕', name:'劍龍', region:'dinosaur', submap:'ancient_nest_valley', fact:'劍龍背上的骨板大小不同，排列成漂亮的一列。', story:'夕陽照過骨板時，山谷就會出現一條彩色小路。', sound:'咚咚' },
    { id:'morning_dew', category:'plants', icon:'🌼', name:'晨露花', region:'fairy', submap:'dew_garden', fact:'清晨葉片上的小水珠，常由空氣中的水氣凝結而成。', story:'每一滴晨露，都收藏著妖精昨天沒說完的祝福。', sound:'叮鈴' },
    { id:'glow_pinecone', category:'plants', icon:'🌲', name:'螢光小松果', region:'forest', submap:'emerald_woods', fact:'松果能保護種子，等到合適的時候再張開。', story:'夜裡的微光，是它送給森林小路的路燈。', sound:'沙沙' },
    { id:'pitcher', category:'plants', icon:'🌱', name:'豬籠草', region:'fairy', submap:'dew_garden', fact:'豬籠草的瓶狀葉片能收集雨水。', story:'這株小豬籠只愛吃泥巴，還會把乾淨水滴還給花園。', sound:'啵啵' },
    { id:'glow_moss', category:'plants', icon:'🌿', name:'發光苔蘚', region:'forest', submap:'mosslight_valley', fact:'苔蘚沒有真正的根，喜歡住在潮濕陰涼的地方。', story:'它們聚在一起，為溪谷鋪出柔軟的星光地毯。', sound:'悉悉' },
    { id:'lily', category:'plants', icon:'🔔', name:'鈴蘭', region:'fairy', submap:'flower_crown_village', fact:'鈴蘭的小花像一串向下垂的白色鈴鐺。', story:'只有溫柔走過的人，才聽得到花朵的清脆鈴聲。', sound:'鈴鈴' },
    { id:'jellyfish', category:'water', icon:'🪼', name:'發光水母', region:'water', submap:'jellyfish_palace', fact:'水母大部分的身體都是水，會跟著海流緩緩漂動。', story:'牠們把宮殿照亮，邀請迷路的小魚回家。', sound:'咕嚕' },
    { id:'seahorse', category:'water', icon:'🐉', name:'彩虹海馬', region:'water', submap:'coral_maze', fact:'海馬游得不快，會用尾巴捲住海草休息。', story:'牠的七彩尾巴，是珊瑚迷宮最可靠的方向標。', sound:'啵嚕' },
    { id:'bubble_fish', category:'water', icon:'🐠', name:'泡泡小魚', region:'water', submap:'bubble_bay', fact:'魚會用鰓從水中取得氧氣。', story:'開心時吐出的泡泡，碰到陽光就變成小彩虹。', sound:'啵啵' },
    { id:'pearl_shell', category:'water', icon:'🐚', name:'珍珠貝', region:'water', submap:'coral_maze', fact:'有些貝類會用一層又一層的物質包住異物，慢慢形成珍珠。', story:'牠守著的不是寶石，而是朋友說過的每一句謝謝。', sound:'叮咚' }
]);

// 2026-09-13 世界地圖與地標定案；地標是未來的小遊戲入口，不另加一層選單。
export const SUBMAP_LANDMARKS = Object.freeze({
 morning_camp:['晨光教學木牌','森林朋友營火圈','衣櫃樹屋','森林星航機艙'],
 emerald_woods:['巨木瞭望台','翡翠岔路口','動物朋友草坪','螢火蟲樹洞'],
 mosslight_valley:['苔光木橋','森林水車坊','星影溪潭'],
 flower_crown_village:['妖精委託小屋','花冠中央廣場','花瓣商店'],
 dew_garden:['彩露調色花圃','巨花培育棚','晨露採集池','種子溫室'],
 moon_butterfly_market:['月蝶拱門','黃昏交換攤','星燈收藏館'],
 snowbell_field:['雪印追蹤坡','風鈴指向柱','雪球遊戲場','暖燈小屋'],
 ice_mirror_lake:['彩紋滑冰道','稜鏡光塔','薄冰觀察池','倒影拱門'],
 aurora_palace:['旋晶冰柱庭','極光密碼廳','冰冠守護殿'],
 warmflame_foothill:['暖氣噴泉石群','星火溫泉池','火山生物棲地','黑曜石瞭望台'],
 molten_workshop:['形狀鑄模桌','溫控熔爐','冷卻水輪台','閃亮素材庫'],
 starfire_summit:['落石預警塔','熔岩踏台橋','山頂星冠舞台'],
 bubble_bay:['彩虹泡泡花園','淺灣清潔站','貝殼泡泡機','珍珠淺礁'],
 coral_maze:['貝殼水門','珊瑚轉盤路','海馬救援站','潮流觀察貝塔'],
 jellyfish_palace:['發光水母花園','珍珠節奏燈廊','深海月光門'],
 moonshadow_shore:['月光釣魚碼頭','神祕腳印岸','湖畔任務小屋','星紋漣漪壇'],
 glow_reeds:['蘆葦風鈴叢','月霧觀察台','隱藏荷葉路','螢火蟲燈塔'],
 star_sunken_heart:['星空倒影台','月冠天鵝灣','湖心星月聖域'],
 fossil_wilds:['小小挖掘營地','骨骼拼圖棚','巨大足跡坡','岩層觀察崖'],
 giant_fern_jungle:['巨蕨迷蹤徑','彩蛋照護巢','泥地小足跡','雨露蕨葉台'],
 ancient_nest_valley:['長頸龍守望台','遠古蛋巢谷','落石回音徑'],
 pawn_harbor:['兵卒帆船碼頭','棋盤格渡橋','港灣守望塔'],
 knight_gallery:['騎士雕像練習庭','L 形階梯長廊','馬首魔法機關門','星象機械亭'],
 crown_chess_city:['棋塔書庫','王冠宮殿','皇家策略花園'],
 cloud_meadow:['綿羊雲牧場','彩虹風車','飛行碼頭','雲朵小屋'],
 windchime_isle:['五彩水晶風鈴','上升氣流花園','聽風塔','雲朵踏台'],
 sky_temple:['星雷水晶庭','天空神殿正殿','金翼升降平台']
});

const PUZZLE_REWARDS = {
    forest:'世界樹守護者套裝', fairy:'晨露花冠精靈裝', ice:'極光冰晶套裝', volcano:'星火鍛造師套裝',
    water:'彩虹海靈套裝', starlight:'月冠星夢套裝', dinosaur:'遠古飛翼守護裝', chess:'王冠棋士套裝',
    cloud:'金翼雲航套裝', realm:'星芽幻界守護裝'
};

export const WORLD_PUZZLES = Object.freeze(WORLD_REGIONS.map(region => ({
    id: region.id, name: `${region.name}繪本拼圖`, icon: region.icon, regionId: region.id,
    reward: PUZZLE_REWARDS[region.id], pieces: (REGION_SUBMAPS[region.id] || [
        {id:'starseed_camp',name:'星芽營地'}, {id:'dandelion_hills',name:'晨曦蒲公英丘陵'}, {id:'realm_vortex',name:'幻界漩渦'}
    ]).map((submap,index) => ({ id:`${region.id}_${submap.id}`, submapId:submap.id, name:submap.name, number:index+1 }))
})));

export function isEcologyUnlocked(entry, data = {}) {
    const state = data.handbook_v2 || {};
    if ((state.ecology || []).includes(entry.id)) return true;
    const world = data.world_progress || {};
    if ((world.stickers || []).includes(`sticker_${entry.submap}`)) return true;
    if ((world.participation || {})[entry.submap] > 0) return true;
    return (world.discoveredSubmaps || []).includes(entry.submap);
}

export function puzzleProgress(puzzle, data = {}) {
    const world = data.world_progress || {};
    const found = new Set((world.stickers || []).filter(id=>id.startsWith('sticker_')).map(id=>id.slice(8)));
    const manual = new Set(data.handbook_v2?.puzzlePieces || []);
    const unlocked = puzzle.pieces.filter(piece => manual.has(piece.id) || found.has(piece.submapId));
    return { count: unlocked.length, total: puzzle.pieces.length, complete: unlocked.length === puzzle.pieces.length, unlockedIds:new Set(unlocked.map(v=>v.id)) };
}

function walkNumbers(value, keys, result = 0) {
    if (!value || typeof value !== 'object') return result;
    for (const [key, child] of Object.entries(value)) {
        if (keys.includes(key)) result += Math.max(0, Number(child) || 0);
        else if (child && typeof child === 'object') result = walkNumbers(child, keys, result);
    }
    return result;
}

export function growthMilestones(data = {}) {
    const stats = data.minigame_stats || {};
    const playedKinds = Object.values(stats).filter(v => walkNumbers(v, ['playCount']) > 0).length;
    const rhythm = walkNumbers(stats, ['correctCount','perfectCount','rainbowPerfectCount','bestCombo']);
    const friends = new Set([
        ...(stats.animals?.friendBook || []), ...(stats.animals?.kids?.friendBook || []),
        ...(data.handbook_v2?.helpedFriends || [])
    ]).size;
    const looks = new Set([...(data.wardrobe_history_v1 || []), data.equipped_hat, data.equipped_cloth, data.equipped_fullset].filter(v => v && v !== 'none')).size;
    const retries = Math.max(Number(data.handbook_v2?.retryCount) || 0, walkNumbers(stats, ['wrong','mistakes','missCount','timeoutCount']));
    return [
        {id:'observer',icon:'🔎',name:'小小觀察家',description:'玩過 10 款不同的小遊戲',count:playedKinds,total:10,reward:'稱號：亮眼小偵探'},
        {id:'rhythm',icon:'🎵',name:'節奏小大師',description:'累積完成 50 次節奏互動',count:rhythm,total:50,reward:'星星徽章 × 1'},
        {id:'friends',icon:'🐾',name:'森林好朋友',description:'安撫或救助 20 位動物朋友',count:friends,total:20,reward:'稱號：暖心守護員'},
        {id:'stylist',icon:'👗',name:'百變造型師',description:'穿戴過 5 種不同造型',count:looks,total:5,reward:'星光幣 × 50'},
        {id:'courage',icon:'💛',name:'不畏挫折的勇氣',description:'遇到困難仍再試一次 10 次',count:retries,total:10,reward:'勇氣鼓勵獎章'}
    ].map(row => ({...row,count:Math.min(row.total,row.count),done:row.count>=row.total}));
}

export function handbookSummary(data = {}, equipmentItems = []) {
    const owned = new Set([...(data.owned_items || []), ...(data.owned_collectibles || [])]);
    const ecology = ECOLOGY_ENTRIES.filter(entry => isEcologyUnlocked(entry,data)).length;
    const puzzles = WORLD_PUZZLES.filter(puzzle => puzzleProgress(puzzle,data).complete).length;
    const milestones = growthMilestones(data).filter(row=>row.done).length;
    return { equipment:equipmentItems.filter(item=>owned.has(item.id)).length, equipmentTotal:equipmentItems.length,
        ecology, ecologyTotal:ECOLOGY_ENTRIES.length, puzzles, puzzlesTotal:WORLD_PUZZLES.length,
        milestones, milestonesTotal:5, gamesTotal:MINI_GAME_CATALOG.length };
}
