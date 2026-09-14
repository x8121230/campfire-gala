export const COUNTING_FRUITS = Object.freeze([
    {id:'apple',name:'蘋果',color:0xe95650,leaf:0x58a55d,icon:'🍎'},
    {id:'orange',name:'橘子',color:0xf39b32,leaf:0x5b9d59,icon:'🍊'},
    {id:'pear',name:'水梨',color:0xa9c953,leaf:0x4f8d55,icon:'🍐'},
    {id:'strawberry',name:'草莓',color:0xe84b68,leaf:0x55a35f,icon:'🍓'},
    {id:'grape',name:'葡萄',color:0x8d63b8,leaf:0x4f945d,icon:'🍇'},
    {id:'lemon',name:'檸檬',color:0xf3d64e,leaf:0x65a251,icon:'🍋'}
]);

export const FRUIT_COUNTING_LEVELS = Object.freeze([
    {name:'晨光第一單',customer:'兔子甜點師',type:'count',requirements:{apple:2,strawberry:2},guide:'草莓和蘋果各要幾顆？先完成第一張混合訂單。',distractors:['orange','pear']},
    {name:'補滿果醬鍋',customer:'小熊廚師',type:'math',requirements:{orange:3},headline:'鍋裡已有 2 顆，總共要 5 顆',guide:'算出還需要幾顆橘子，再把它們放進鍋裡。',distractors:['apple','lemon','pear']},
    {name:'森林下午茶',customer:'狐狸商人',type:'count',requirements:{apple:2,pear:1,strawberry:2},guide:'同時處理三種水果，注意每一種的數量。',distractors:['orange','grape']},
    {name:'貓頭鷹的暗號',customer:'貓頭鷹學者',type:'sequence',sequence:['pear','apple','orange','strawberry'],memorySeconds:5,guide:'記住四個水果的順序；暗號很快就會蓋起來。',distractors:['grape','lemon']},
    {name:'松鼠來襲',customer:'松鼠收藏家',type:'count',requirements:{grape:2,orange:2,apple:1},timeLimit:38,squirrel:true,guide:'完成訂單，也要留意偷走水果的松鼠。',distractors:['pear','lemon']},
    {name:'成熟果實鑑定',customer:'花園精靈',type:'ripe',requirements:{pear:3},guide:'只採色澤明亮、帶金色光圈的成熟水梨。',distractors:['apple','orange'],unripeTarget:3},
    {name:'精準小果籃',customer:'刺蝟管家',type:'count',requirements:{apple:1,orange:2,grape:1},mistakeLimit:2,guide:'只容許兩次失誤。連續選對可累積高分連擊。',distractors:['pear','strawberry','lemon']},
    {name:'數量關係謎題',customer:'狐狸數學家',type:'count',requirements:{orange:2,strawberry:4},headline:'草莓要比橘子多 2 顆',guide:'先理解數量關係，再組成正確的水果訂單。',distractors:['apple','pear']},
    {name:'月夜快單',customer:'月光旅人',type:'count',requirements:{lemon:2,grape:3,pear:2},timeLimit:28,memorySeconds:6,guide:'訂單六秒後會隱藏，在月夜倒數結束前完成。',distractors:['apple','orange']},
    {name:'魔法豐收節',customer:'全森林的朋友',type:'count',requirements:{apple:2,orange:2,pear:2,strawberry:2,grape:2},timeLimit:42,rainbow:true,guide:'大型混合訂單！彩虹果可以代替任何一顆尚缺的水果。',distractors:['lemon']}
]);

const countNeeded = level => level.sequence?.length ?? Object.values(level.requirements || {}).reduce((a,b)=>a+b,0);

export class FruitCountingSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalCollected=0;this.totalScore=0;this.wrong=0;this.hints=0;this.load();}
    get level(){return FRUIT_COUNTING_LEVELS[this.levelIndex]??null;}
    get target(){return countNeeded(this.level);}
    get remaining(){return Math.max(0,this.target-this.collected);}
    get expected(){return this.level?.sequence?.[this.collected]??null;}
    load(){this.collected=0;this.complete=false;this.failed=false;this.taken=new Set();this.counts={};this.combo=0;this.levelScore=0;this.levelWrong=0;}
    needed(fruit){return Math.max(0,(this.level?.requirements?.[fruit]||0)-(this.counts[fruit]||0));}
    choose(item){
        if(this.complete||this.failed||!item||this.taken.has(item.id))return{result:'ignored'};
        let wanted=null;
        if(item.special==='rainbow') wanted=this.level.sequence?.[this.collected]||Object.keys(this.level.requirements||{}).find(f=>this.needed(f)>0);
        else if(this.level.type==='sequence') wanted=this.expected;
        else wanted=this.needed(item.fruit)>0?item.fruit:null;
        const ripeOk=this.level.type!=='ripe'||item.ripe===true;
        if(!wanted||!ripeOk||(this.level.type==='sequence'&&item.fruit!==wanted)){
            this.wrong++;this.levelWrong++;this.combo=0;
            if(this.level.mistakeLimit&&this.levelWrong>=this.level.mistakeLimit)this.failed=true;
            return{result:this.failed?'failed':'retry',reason:!ripeOk?'unripe':'wrong',wanted:this.expected};
        }
        this.taken.add(item.id);this.collected++;this.counts[wanted]=(this.counts[wanted]||0)+1;this.totalCollected++;this.combo++;
        const points=100+Math.min(5,this.combo-1)*25+(item.special==='rainbow'?150:0);
        this.levelScore+=points;this.totalScore+=points;
        if(this.collected===this.target){this.complete=true;return{result:'complete',count:this.collected,points,wanted};}
        return{result:'correct',count:this.collected,remaining:this.remaining,points,wanted};
    }
    hint(items=[]){if(this.complete||this.failed)return null;const wanted=this.expected||Object.keys(this.level.requirements||{}).find(f=>this.needed(f)>0);const found=items.find(i=>!this.taken.has(i.id)&&(i.special==='rainbow'||(i.fruit===wanted&&(this.level.type!=='ripe'||i.ripe))));if(found)this.hints++;return found?.id??null;}
    advance(){if(!this.complete)return false;this.levelIndex++;if(this.level)this.load();return true;}
}

export function buildFruitCountingItems(levelIndex=0){
    const level=FRUIT_COUNTING_LEVELS[levelIndex];if(!level)return[];
    const items=[];let n=0;
    const add=(fruit,extra={})=>items.push({id:`fruit_${levelIndex}_${n++}`,fruit,...extra});
    if(level.sequence) level.sequence.forEach(f=>add(f));
    else Object.entries(level.requirements||{}).forEach(([fruit,count])=>{for(let i=0;i<count;i++)add(fruit,{ripe:level.type==='ripe'});});
    for(let i=0;i<(level.unripeTarget||0);i++)add('pear',{ripe:false});
    (level.distractors||[]).forEach(f=>add(f,{ripe:false}));
    if(level.rainbow)add('apple',{special:'rainbow',ripe:true});
    const fillers=['apple','orange','pear','strawberry','grape','lemon'];let f=0;
    while(items.length<Math.min(12,Math.max(8,countNeeded(level)+3)))add(fillers[(levelIndex+f++)%fillers.length],{ripe:false});
    return items.slice(0,12);
}
