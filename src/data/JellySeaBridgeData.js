export const FLOAT_STONES = Object.freeze({
    giant:{name:'最大石',short:'最大',width:150,height:76,color:0x796276},
    large:{name:'大石頭',short:'大',width:132,height:68,color:0x8a7180},
    medium:{name:'中石頭',short:'中',width:112,height:59,color:0x9b8290},
    small:{name:'小石頭',short:'小',width:91,height:50,color:0xad929c},
    tiny:{name:'最小石',short:'最小',width:72,height:42,color:0xbfa6aa}
});

export const JELLY_BRIDGE_LEVELS = Object.freeze([
    {name:'大石和小石',sizes:['large','small'],guide:'先放大石，再放小石。'},
    {name:'三階浮石橋',sizes:['large','medium','small'],guide:'練習大、中、小。'},
    {name:'加入最大石',sizes:['giant','large','medium','small'],guide:'從最大開始，一階一階變小。'},
    {name:'五階果凍橋',sizes:['giant','large','medium','small','tiny'],guide:'一路排到最小石。'},
    {name:'火山群島大通行',sizes:['giant','large','medium','small','tiny'],guide:'完成最後一座大小階梯橋。'}
]);

export function buildStoneTray(level,random=Math.random){
    const tray=[...level.sizes];
    for(let i=tray.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[tray[i],tray[j]]=[tray[j],tray[i]];}
    return tray;
}

export class JellySeaBridgeSession {
    constructor(levelIndex=0,random=Math.random){this.levelIndex=levelIndex;this.random=random;this.totalPlaced=0;this.mistakes=0;this.hints=0;this.resets=0;this.load();}
    get level(){return JELLY_BRIDGE_LEVELS[this.levelIndex]??null;}
    get expected(){return this.level?.sizes[this.index]??null;}
    load(){this.index=0;this.placed=[];this.complete=false;this.tray=this.level?buildStoneTray(this.level,this.random):[];}
    place(size){
        if(this.complete||!this.expected||!this.tray.includes(size)||this.placed.includes(size))return'ignored';
        if(size!==this.expected){this.mistakes+=1;return'retry';}
        this.placed.push(size);this.index+=1;this.totalPlaced+=1;
        if(this.index===this.level.sizes.length){this.complete=true;return'complete';}
        return'placed';
    }
    hint(){if(this.complete)return null;this.hints+=1;return this.expected;}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
