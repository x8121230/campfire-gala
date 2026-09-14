export const BUBBLE_COLORS = Object.freeze([
    {id:'red',name:'紅色',value:0xe76570},
    {id:'blue',name:'藍色',value:0x4d91cf},
    {id:'yellow',name:'黃色',value:0xe6bb40}
]);
export const BUBBLE_SHAPES = Object.freeze([
    {id:'circle',name:'圓形'}, {id:'triangle',name:'三角形'}, {id:'star',name:'星形'}
]);
export const BUBBLE_MODES = Object.freeze(['color','shape','both']);
export function matchesBubble(target, choice, mode) {
    if (!target || !choice || !BUBBLE_MODES.includes(mode)) return false;
    return (mode === 'shape' || target.color === choice.color) &&
        (mode === 'color' || target.shape === choice.shape);
}
function shuffle(list, random) {
    const result=[...list];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
}
export function makeBubbleRounds(random=Math.random) {
    const rounds=[];
    for(const mode of BUBBLE_MODES){
        const colors=shuffle([0,1,2],random),shapes=shuffle([0,1,2],random);
        for(let n=0;n<4;n++){
            const color=colors[n%3],shape=shapes[n%3];
            const target={color:mode==='shape'?-1:color,shape:mode==='color'?0:shape};
            let choices;
            if(mode==='color') choices=[0,1,2].map(c=>({color:c,shape:0}));
            else if(mode==='shape') choices=[0,1,2].map(s=>({color:-1,shape:s}));
            else choices=[{...target},{color,shape:(shape+1)%3},{color:(color+1)%3,shape}];
            rounds.push({id:rounds.length,mode,target,choices:shuffle(choices,random)});
        }
    }
    return rounds;
}
export class BubbleSession {
    constructor(random=Math.random){
        this.rounds=makeBubbleRounds(random);this.index=0;this.solved=false;
        this.correct=0;this.wrong=0;this.hints=0;this.independent=0;
        this.roundWrong=false;this.hinted=false;this.retriedChoices=new Set();
    }
    get round(){return this.rounds[this.index]||null;}
    get done(){return this.correct===this.rounds.length;}
    hint(){if(this.solved||this.hinted||!this.round)return false;this.hinted=true;this.hints++;return true;}
    answer(index){
        if(this.solved||!Number.isInteger(index)||!this.round?.choices[index]||this.retriedChoices.has(index))return 'ignored';
        if(!matchesBubble(this.round.target,this.round.choices[index],this.round.mode)){
            this.wrong++;this.roundWrong=true;this.retriedChoices.add(index);return 'wrong';
        }
        this.correct++;this.solved=true;if(!this.roundWrong&&!this.hinted)this.independent++;
        return 'correct';
    }
    advance(){
        if(!this.solved||this.done)return false;
        this.index++;this.solved=false;this.roundWrong=false;this.hinted=false;this.retriedChoices.clear();return true;
    }
}
