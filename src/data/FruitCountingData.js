export const COUNTING_FRUITS = Object.freeze([
    {id:'apple',name:'蘋果',color:0xe95b55,leaf:0x66a85d},
    {id:'orange',name:'橘子',color:0xf2a33d,leaf:0x5d9b58},
    {id:'pear',name:'水梨',color:0xa8ca58,leaf:0x4d8b55},
    {id:'strawberry',name:'草莓',color:0xe84c68,leaf:0x57a25f}
]);

export const FRUIT_COUNTING_LEVELS = Object.freeze([
    {name:'第一顆蘋果',fruit:'apple',target:1,distractors:['orange','pear'],guide:'找到 1 顆紅蘋果，放進小籃子。'},
    {name:'兩顆小橘子',fruit:'orange',target:2,distractors:['apple','pear'],guide:'找到 2 顆橘子，一顆一顆數。'},
    {name:'三顆綠水梨',fruit:'pear',target:3,distractors:['orange','strawberry'],guide:'找到 3 顆水梨，看看還差幾顆。'},
    {name:'四顆紅草莓',fruit:'strawberry',target:4,distractors:['apple','pear'],guide:'找到 4 顆草莓，跟著數字慢慢點。'},
    {name:'五顆蘋果派對',fruit:'apple',target:5,distractors:['orange','pear','strawberry'],guide:'最後找到 5 顆蘋果，裝滿派對果籃。'}
]);

export class FruitCountingSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalCollected=0;this.wrong=0;this.hints=0;this.load();}
    get level(){return FRUIT_COUNTING_LEVELS[this.levelIndex]??null;}
    get remaining(){return Math.max(0,(this.level?.target??0)-this.collected);}
    load(){this.collected=0;this.complete=false;this.taken=new Set();}
    choose(item){
        if(this.complete||!item||this.taken.has(item.id))return{result:'ignored'};
        if(item.fruit!==this.level.fruit){this.wrong+=1;return{result:'retry',wanted:this.level.fruit};}
        this.taken.add(item.id);this.collected+=1;this.totalCollected+=1;
        if(this.collected===this.level.target){this.complete=true;return{result:'complete',count:this.collected};}
        return{result:'correct',count:this.collected,remaining:this.remaining};
    }
    hint(items=[]){if(this.complete)return null;const found=items.find(item=>item.fruit===this.level.fruit&&!this.taken.has(item.id));if(found)this.hints+=1;return found?.id??null;}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}

export function buildFruitCountingItems(levelIndex=0){
    const level=FRUIT_COUNTING_LEVELS[levelIndex];if(!level)return[];
    const items=[];for(let i=0;i<level.target;i++)items.push({id:`target_${levelIndex}_${i}`,fruit:level.fruit});
    level.distractors.forEach((fruit,i)=>items.push({id:`other_${levelIndex}_${i}`,fruit}));
    return items;
}
