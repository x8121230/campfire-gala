export const CAPYBARA_STYLES = Object.freeze({
    orange:{name:'頂著橘子的水豚',short:'橘子',color:0xf39b43},
    flower:{name:'戴小花的水豚',short:'小花',color:0xef7fa1},
    towel:{name:'頂著毛巾的水豚',short:'毛巾',color:0x80c9d6},
    leaf:{name:'戴葉子的水豚',short:'葉子',color:0x6faa67},
    plain:{name:'沒有戴東西的水豚',short:'沒戴東西',color:0xb78667}
});

export const HOT_SPRING_LEVELS = Object.freeze([
    {name:'第一聲你好',poolCount:3,capyCount:1,styles:['orange'],targets:['orange','orange'],guide:'三座溫泉，先記住一隻水豚。'},
    {name:'兩位溫泉朋友',poolCount:3,capyCount:2,styles:['orange','flower'],targets:['orange','flower','orange'],guide:'兩隻水豚會交換位置。'},
    {name:'三種小裝飾',poolCount:4,capyCount:3,styles:['orange','flower','towel'],targets:['towel','flower','orange'],guide:'加入藍色小毛巾。'},
    {name:'熱氣記憶挑戰',poolCount:5,capyCount:4,styles:['orange','flower','towel','leaf'],targets:['leaf','orange','towel','flower'],guide:'五座溫泉中記住四位朋友。'},
    {name:'水豚溫泉派對',poolCount:6,capyCount:5,styles:['orange','flower','towel','leaf','plain'],targets:['plain','orange','leaf','flower','towel'],guide:'最後找出五種不同模樣。'}
]);

export function buildHotSpringBoard(level,target,random=Math.random){
    const occupants=[target,...level.styles.filter(id=>id!==target)].slice(0,level.capyCount);
    while(occupants.length<level.poolCount)occupants.push(null);
    for(let i=occupants.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[occupants[i],occupants[j]]=[occupants[j],occupants[i]];}
    return occupants.map((style,id)=>({id,style}));
}

export class HotSpringCapybaraSession {
    constructor(levelIndex=0,random=Math.random){this.levelIndex=levelIndex;this.random=random;this.totalCorrect=0;this.totalMistakes=0;this.hints=0;this.previews=0;this.loadLevel();}
    get level(){return HOT_SPRING_LEVELS[this.levelIndex]??null;}
    get target(){return this.level?.targets[this.roundIndex]??null;}
    loadLevel(){this.roundIndex=0;this.correct=0;this.mistakes=0;this.complete=false;this.build();}
    build(){this.board=this.level?buildHotSpringBoard(this.level,this.target,this.random):[];}
    preview(){if(this.complete)return false;this.previews+=1;return true;}
    choose(poolId){
        if(this.complete||!this.board[poolId])return{result:'ignored'};
        const chosen=this.board[poolId];
        if(chosen.style!==this.target){this.mistakes+=1;this.totalMistakes+=1;return{result:'retry',chosen:chosen.style,target:this.target,poolId};}
        const style=this.target;this.correct+=1;this.totalCorrect+=1;this.roundIndex+=1;
        if(this.roundIndex===this.level.targets.length){this.complete=true;return{result:'complete',style,poolId};}
        return{result:'correct',style,poolId};
    }
    nextRound(){if(this.complete)return false;this.build();return true;}
    hint(){if(this.complete)return null;this.hints+=1;return this.board.find(tile=>tile.style===this.target)?.id??null;}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.loadLevel();return true;}
}
