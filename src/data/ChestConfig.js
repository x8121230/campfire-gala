// 正式規格：9 大區域寶箱＋1 個全域共用木雕寶箱。
export const CHEST_TYPES = Object.freeze([
 {id:'forest_moss',region:'forest',regionName:'森林',chest:'苔蘚寶箱',accent:0x6fa45e,art:'moss'},
 {id:'fairy_nectar',region:'fairy',regionName:'妖精村落',chest:'花蜜寶箱',accent:0xe797bc,art:'nectar'},
 {id:'ice_crystal',region:'ice',regionName:'極光冰原',chest:'冰晶寶箱',accent:0x8bd8ee,art:'ice'},
 {id:'volcano_ember',region:'volcano',regionName:'暖焰火山',chest:'熔光寶箱',accent:0xf08a45,art:'ember'},
 {id:'water_pearl',region:'water',regionName:'水世界',chest:'珍珠寶箱',accent:0x75cdd4,art:'pearl'},
 {id:'starlight_moon',region:'starlight',regionName:'星光湖畔',chest:'月光寶箱',accent:0x9d9ee7,art:'moon'},
 {id:'dinosaur_fossil',region:'dinosaur',regionName:'恐龍山谷',chest:'化石寶箱',accent:0xcba76e,art:'fossil'},
 {id:'chess_crown',region:'chess',regionName:'棋藝王國',chest:'王冠寶箱',accent:0xe1bb50,art:'crown'},
 {id:'sky_cloud_crystal',region:'sky',regionName:'雲端島嶼',chest:'雲晶寶箱',accent:0xa9d6ed,art:'cloud'},
 {id:'global_wood',region:'global',regionName:'全域共用',chest:'木雕寶箱',accent:0xb9824d,art:'wood'}
]);

export const CHEST_GAMES = Object.freeze([
 {id:'bush_minesweeper',name:'草叢探險',chest:'苔蘚寶箱',chestType:'forest_moss',source:'bush'},
 {id:'shape_color',name:'形色棋',chest:'花蜜寶箱',chestType:'fairy_nectar',source:'global'},
 {id:'bush_banqi',name:'象棋暗棋',chest:'王冠寶箱',chestType:'chess_crown',source:'bush'},
 {id:'memory_match',name:'記憶翻牌',chest:'月光寶箱',chestType:'starlight_moon',source:'constellation'},
 {id:'animal_food',name:'森林歷險',chest:'木雕寶箱',chestType:'global_wood',source:'campfire'}
]);

// v1.3 測試箱若尚未開啟，仍可安全轉入新版，不丟失既有 BOX。
const LEGACY_CHEST_TYPE = Object.freeze({
 fairy_color:'fairy_nectar',chess_wood:'chess_crown',sky_feather:'sky_cloud_crystal',
 picnic:'global_wood',phantom_sprout:'global_wood'
});

export function chestTypeFor(value){
 const normalized=LEGACY_CHEST_TYPE[value]||value,direct=CHEST_TYPES.find(type=>type.id===normalized);
 if(direct)return direct;
 const game=CHEST_GAMES.find(entry=>entry.id===value);
 return CHEST_TYPES.find(type=>type.id===game?.chestType)||CHEST_TYPES[0];
}

export const CHEST_RATES = [0,.2,.35,.5];
export const CHEST_STATE_KEY = 'chest_rewards_v1';
export function rewardStars(game,s,args){
 if(game==='bush_minesweeper')return s.hintsUsed===0&&s.mistakesLeft===s.MISTAKE_LIMIT?3:s.mistakesLeft>=2?2:1;
 if(game==='animal_food'){const n=args[0]?.score;return n>=90?3:n>=70?2:1;}
 if(game==='bush_banqi')return s.mode==='ai'&&s.playerColor&&args[0]===s.playerColor?2:0;
 if(game==='memory_match'||game==='shape_color')return s.playerScore>s.aiScore?(s.playerScore>=s.aiScore*1.5?3:2):0;
 return 0;
}
