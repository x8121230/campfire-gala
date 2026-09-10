export const CHEST_GAMES = [
 {id:'bush_minesweeper',name:'草叢探險',chest:'苔蘚寶箱',source:'bush'},
 {id:'shape_color',name:'形色棋',chest:'彩石寶箱',source:'global'},
 {id:'bush_banqi',name:'象棋暗棋',chest:'木雕寶箱',source:'bush'},
 {id:'memory_match',name:'記憶翻牌',chest:'月光寶箱',source:'constellation'},
 {id:'animal_food',name:'森林歷險',chest:'野餐寶箱',source:'campfire'}
];
export const CHEST_RATES = [0,.2,.35,.5];
export const CHEST_STATE_KEY = 'chest_rewards_v1';
export function rewardStars(game,s,args){
 if(game==='bush_minesweeper')return s.hintsUsed===0&&s.mistakesLeft===s.MISTAKE_LIMIT?3:s.mistakesLeft>=2?2:1;
 if(game==='animal_food'){const n=args[0]?.score;return n>=90?3:n>=70?2:1;}
 if(game==='bush_banqi')return s.mode==='ai'&&s.playerColor&&args[0]===s.playerColor?2:0;
 if(game==='memory_match'||game==='shape_color')return s.playerScore>s.aiScore?(s.playerScore>=s.aiScore*1.5?3:2):0;
 return 0;
}
