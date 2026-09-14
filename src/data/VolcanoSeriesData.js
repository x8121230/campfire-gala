export const LAVA_STEP_LEVELS = Object.freeze([
    {name:'暖暖石三步', order:[0,1,2]}, {name:'火光轉彎', order:[1,0,2,3]},
    {name:'岩漿小蛇', order:[2,0,3,1,4]}, {name:'火山之心', order:[1,3,0,4,2,5]}
]);

export class LavaStepSession {
    constructor(){this.levelIndex=0;this.totalTaps=0;this.misses=0;this.load();}
    get level(){return LAVA_STEP_LEVELS[this.levelIndex];}
    load(){this.step=0;this.complete=false;}
    tap(index){if(this.complete)return'ignored';this.totalTaps+=1;if(index!==this.level.order[this.step]){this.misses+=1;return'warm';}this.step+=1;if(this.step===this.level.order.length){this.complete=true;return'complete';}return'correct';}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}

export const COOLING_LEVELS = Object.freeze([
    {name:'小小蒸氣口',target:3,allowed:[1,2],guide:'先投入 1 或 2 顆，合起來要剛好 3 顆。',color:0xf29a3d},
    {name:'紅石降溫',target:4,allowed:[1,2],guide:'這次需要 4 顆，可以用相同的冰晶兩次。',color:0xed7837},
    {name:'岩漿池降溫',target:5,allowed:[1,2,3],guide:'大冰晶登場了！想想還差幾顆。',color:0xe75f31},
    {name:'火山門降溫',target:6,allowed:[1,2,3],guide:'用不同組合都可以，只要總數剛好。',color:0xd94b2d},
    {name:'火山之心降溫',target:7,allowed:[1,2,3],guide:'最後的火山之心，慢慢算到 7 顆。',color:0xc83b2c}
]);
export class CoolingSession {
    constructor(){this.levelIndex=0;this.totalCrystals=0;this.resets=0;this.hints=0;this.attempts=0;this.undos=0;this.load();}
    get level(){return COOLING_LEVELS[this.levelIndex];}
    load(){this.value=0;this.history=[];this.complete=false;}
    add(amount){if(this.complete||!this.level.allowed.includes(amount))return'ignored';this.attempts+=1;if(this.value+amount>this.level.target)return'too_much';this.history.push(amount);this.value+=amount;this.totalCrystals+=amount;if(this.value===this.level.target){this.complete=true;return'complete';}return'added';}
    undo(){const v=this.history.pop();if(!v)return false;this.value-=v;this.totalCrystals-=v;this.undos+=1;return true;}
    hint(){this.hints+=1;const remaining=this.level.target-this.value;return [...this.level.allowed].sort((a,b)=>b-a).find(v=>v<=remaining)??null;}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}

export const PIPE_LEVELS = Object.freeze([
    {name:'第一條冷卻水路',types:['straight','corner','straight'],target:[0,1,0],start:[1,3,1],guide:'先認識直管和彎管。'},
    {name:'繞過紅石',types:['corner','straight','corner','straight'],target:[1,0,3,0],start:[0,1,1,1],guide:'讓藍色水管貼住金色路線。'},
    {name:'三岔冷卻站',types:['straight','tee','corner','straight','corner'],target:[0,2,1,0,3],start:[1,0,3,1,2],guide:'三岔管也要轉到相同方向。'},
    {name:'岩漿河長水路',types:['corner','straight','tee','corner','straight','corner'],target:[1,0,2,3,0,2],start:[3,1,0,1,1,0],guide:'一格一格看，就能接起長水路。'},
    {name:'火山之心冷卻線',types:['straight','corner','tee','straight','corner','tee','straight'],target:[0,1,2,0,3,1,0],start:[1,3,0,1,1,3,1],guide:'最後七段水管，慢慢完成就好。'}
]);
export function isPipeAligned(type,current,target){return type==='straight'?current%2===target%2:type==='cross'||current%4===target%4;}
export class LavaPipeSession {
    constructor(){this.levelIndex=0;this.totalTurns=0;this.hints=0;this.resets=0;this.load();}
    get level(){return PIPE_LEVELS[this.levelIndex];}
    load(){this.rotations=[...this.level.start];this.complete=this.check();}
    check(){return this.rotations.every((v,i)=>isPipeAligned(this.level.types[i],v,this.level.target[i]));}
    rotate(index){if(this.complete||!Number.isInteger(index)||index<0||index>=this.rotations.length)return'ignored';this.rotations[index]=(this.rotations[index]+1)%4;this.totalTurns+=1;this.complete=this.check();return this.complete?'complete':'turned';}
    hint(){this.hints+=1;return this.rotations.findIndex((v,i)=>!isPipeAligned(this.level.types[i],v,this.level.target[i]));}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}

export const ECHO_SYMBOLS = Object.freeze(['flame','rock','gem','dragon']);
export const ECHO_LEVELS = Object.freeze([
    {name:'兩聲小回音',sequence:['flame','rock'],active:['flame','rock'],guide:'先記住兩個圖案。'},
    {name:'寶石三拍',sequence:['gem','flame','gem'],active:['flame','rock','gem'],guide:'寶石會出現兩次喔。'},
    {name:'小火龍醒來',sequence:['rock','dragon','flame','rock'],active:['flame','rock','gem','dragon'],guide:'四個回聲，慢慢看清楚。'},
    {name:'熔岩五聲歌',sequence:['flame','gem','dragon','rock','flame'],active:['flame','rock','gem','dragon'],guide:'記住開頭和最後是不是一樣。'},
    {name:'火山之心回聲',sequence:['dragon','rock','gem','flame','dragon','gem'],active:['flame','rock','gem','dragon'],guide:'最後六個回聲，隨時可以重播。'}
]);
export class VolcanoEchoSession {
    constructor(){this.levelIndex=0;this.mistakes=0;this.totalPresses=0;this.replays=0;this.load();}
    get level(){return ECHO_LEVELS[this.levelIndex];}
    get sequence(){return this.level?.sequence??null;}
    load(){this.progress=0;this.complete=false;}
    press(symbol){if(this.complete)return'ignored';this.totalPresses+=1;if(symbol!==this.sequence[this.progress]){this.mistakes+=1;this.progress=0;return'again';}this.progress+=1;if(this.progress===this.sequence.length){this.complete=true;return'complete';}return'correct';}
    replay(){if(this.complete)return false;this.progress=0;this.replays+=1;return true;}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.sequence)this.load();return true;}
}

export const BRIDGE_LEVELS = Object.freeze([
    {name:'小小裂縫',target:2,allowed:[1,2],guide:'先用一塊 2 格木板，或兩塊 1 格木板。'},
    {name:'岩漿小河',target:3,allowed:[1,2],guide:'把 1 格和 2 格組合成 3 格。'},
    {name:'火光河灣',target:4,allowed:[1,2,3],guide:'3 格長木板登場了，想想還差幾格。'},
    {name:'紅石峽谷',target:5,allowed:[1,2,3],guide:'不同木板可以排出一樣長的橋。'},
    {name:'火山之心大橋',target:6,allowed:[1,2,3],guide:'完成最後六格大橋，帶小火龍回家。'}
]);
export class LavaBridgeSession {
    constructor(){this.levelIndex=0;this.totalPieces=0;this.overshoots=0;this.hints=0;this.undos=0;this.resets=0;this.attempts=0;this.load();}
    get level(){return BRIDGE_LEVELS[this.levelIndex];}
    load(){this.length=0;this.history=[];this.complete=false;}
    add(length){if(this.complete||!this.level.allowed.includes(length))return'ignored';this.attempts+=1;if(this.length+length>this.level.target){this.overshoots+=1;return'too_long';}this.history.push(length);this.length+=length;this.totalPieces+=1;if(this.length===this.level.target){this.complete=true;return'complete';}return'added';}
    undo(){const v=this.history.pop();if(!v)return false;this.length-=v;this.totalPieces-=1;this.undos+=1;return true;}
    hint(){this.hints+=1;const remaining=this.level.target-this.length;return [...this.level.allowed].sort((a,b)=>b-a).find(v=>v<=remaining)??null;}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
