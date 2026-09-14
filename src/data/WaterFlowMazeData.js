export const WATERWAY_TYPES = Object.freeze({
    straight:{name:'直水道',connections:[[0,2],[1,3]]},
    corner:{name:'彎水道',connections:[[3,0],[0,1],[1,2],[2,3]]}
});

export const WATER_FLOW_LEVELS = Object.freeze([
    {name:'兩條直直水道',guide:'轉好兩塊大水道，讓水直直流向花朵。',pieces:[{x:0,y:1,type:'straight',target:0},{x:1,y:1,type:'straight',target:0}]},
    {name:'瀑布轉彎',guide:'水會先向上，再轉向右邊的花朵。',pieces:[{x:0,y:1,type:'corner',target:3},{x:0,y:0,type:'corner',target:1}]},
    {name:'三格向上走',guide:'彎道、直道、彎道一起合作。',pieces:[{x:0,y:2,type:'corner',target:3},{x:0,y:1,type:'straight',target:1},{x:0,y:0,type:'corner',target:1}]},
    {name:'小小水路階梯',guide:'水先向下轉彎，再沿著右方流出去。',pieces:[{x:0,y:0,type:'corner',target:2},{x:0,y:1,type:'corner',target:0},{x:1,y:1,type:'straight',target:0}]},
    {name:'花朵水流迷宮',guide:'完成四塊大型水道，讓最後一朵花盛開。',pieces:[{x:0,y:2,type:'corner',target:3},{x:0,y:1,type:'straight',target:1},{x:0,y:0,type:'corner',target:1},{x:1,y:0,type:'straight',target:0}]}
]);

export function rotationMatches(type,rotation,target){
    const count=WATERWAY_TYPES[type].connections.length;
    return ((rotation%count)+count)%count===((target%count)+count)%count;
}

export class WaterFlowMazeSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalRotations=0;this.tests=0;this.hints=0;this.resets=0;this.load();}
    get level(){return WATER_FLOW_LEVELS[this.levelIndex]??null;}
    load(){this.rotations=this.level?.pieces.map((piece,index)=>(piece.target+1+index)%WATERWAY_TYPES[piece.type].connections.length)??[];this.complete=false;}
    isCorrect(index){const piece=this.level?.pieces[index];return Boolean(piece)&&rotationMatches(piece.type,this.rotations[index],piece.target);}
    rotate(index){const piece=this.level?.pieces[index];if(this.complete||!piece)return'ignored';this.rotations[index]=(this.rotations[index]+1)%WATERWAY_TYPES[piece.type].connections.length;this.totalRotations+=1;return this.isCorrect(index)?'aligned':'rotated';}
    firstWrong(){return this.level?.pieces.findIndex((_piece,index)=>!this.isCorrect(index))??-1;}
    flow(){if(this.complete)return{result:'ignored'};this.tests+=1;const leakIndex=this.firstWrong();if(leakIndex>=0)return{result:'retry',leakIndex};this.complete=true;return{result:'complete'};}
    hint(){if(this.complete)return-1;this.hints+=1;return this.firstWrong();}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
