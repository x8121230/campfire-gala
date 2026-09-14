export const FISH_COLORS=Object.freeze([
    {id:'red',name:'紅色',value:0xe87670},
    {id:'blue',name:'藍色',value:0x5aaed0},
    {id:'yellow',name:'黃色',value:0xf1c85e}
]);

export const FISHING_TASKS=Object.freeze([
    {stage:1,color:'red',count:1},{stage:1,color:'blue',count:1},{stage:1,color:'yellow',count:1},
    {stage:2,color:'red',count:2},{stage:2,color:'blue',count:2},{stage:2,color:'yellow',count:2},
    {stage:3,color:'red',count:1},{stage:3,color:'blue',count:3},{stage:3,color:'yellow',count:2}
]);

export const FISHING_STAGE_NAMES=Object.freeze({1:'第 1 段・認識顏色',2:'第 2 段・釣兩條魚',3:'第 3 段・顏色加數量'});

export class IceFishingSession{
    constructor(){this.index=0;this.caught=0;this.totalCaught=0;this.wrong=0;this.hints=0;this.finished=false;}
    get task(){return FISHING_TASKS[this.index]??null;}
    answer(color){
        if(this.finished||!this.task)return {result:'ignored'};
        if(color!==this.task.color){this.wrong+=1;return {result:'wrong'};}
        this.caught+=1;this.totalCaught+=1;const taskComplete=this.caught>=this.task.count;return {result:'correct',taskComplete,remaining:Math.max(0,this.task.count-this.caught)};
    }
    advance(){if(!this.task||this.caught<this.task.count)return false;this.index+=1;this.caught=0;if(this.index>=FISHING_TASKS.length)this.finished=true;return true;}
    hint(){this.hints+=1;return this.task?.color??null;}
}

export function buildFishSchool(task,random=Math.random){
    const school=[];const wanted=Math.max(task.count,2);
    for(let i=0;i<wanted;i++)school.push(task.color);
    const others=FISH_COLORS.map(c=>c.id).filter(id=>id!==task.color);
    while(school.length<6)school.push(others[Math.floor(random()*others.length)]);
    for(let i=school.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[school[i],school[j]]=[school[j],school[i]];}
    return school;
}
