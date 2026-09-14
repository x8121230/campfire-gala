export const GEM_COLORS = Object.freeze({
    red: {label:'紅寶石',fill:0xf05a5f,dark:0xa73543,light:0xffa19a},
    yellow: {label:'黃寶石',fill:0xffc94f,dark:0xc38426,light:0xffef9b},
    blue: {label:'藍寶石',fill:0x54a9ea,dark:0x286da8,light:0xa7dcff}
});

export const GEM_CART_LEVELS = Object.freeze([
    {name:'紅寶石出發',active:['red'],order:['red','red','red'],guide:'先把紅寶石送進紅色桶子。'},
    {name:'紅黃好朋友',active:['red','yellow'],order:['red','yellow','red','yellow'],guide:'看看是紅色，還是黃色。'},
    {name:'藍寶石登場',active:['red','yellow','blue'],order:['blue','red','yellow','blue','red'],guide:'三種顏色都來坐礦車。'},
    {name:'彩色礦坑',active:['red','yellow','blue'],order:['yellow','blue','red','yellow','red','blue'],guide:'顏色交錯出現，慢慢看就會找到。'},
    {name:'火山寶石大豐收',active:['red','yellow','blue'],order:['red','blue','yellow','blue','red','yellow','blue'],guide:'完成最後一車閃亮亮的寶石。'}
]);

export class VolcanoGemCartSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalSorted=0;this.mistakes=0;this.returns=0;this.hints=0;this.load();}
    get level(){return GEM_CART_LEVELS[this.levelIndex]??null;}
    get currentColor(){return this.level?.order[this.index]??null;}
    load(){this.index=0;this.sorted=0;this.complete=false;}
    classify(color){
        if(this.complete||!this.currentColor)return'ignored';
        if(color!==this.currentColor){this.mistakes+=1;return'retry';}
        this.index+=1;this.sorted+=1;this.totalSorted+=1;
        if(this.index===this.level.order.length){this.complete=true;return'complete';}
        return'correct';
    }
    returnGem(){if(this.complete||!this.currentColor)return false;this.returns+=1;return true;}
    hint(){if(this.complete)return null;this.hints+=1;return this.currentColor;}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
