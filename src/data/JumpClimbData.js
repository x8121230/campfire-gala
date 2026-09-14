export const JUMP_CLIMB_LEVELS = Object.freeze([
    {name:'寬寬練習坡',tolerance:.25,powers:[.35,.45],guide:'綠色範圍很寬，先練習按住再放開。'},
    {name:'三階花朵山',tolerance:.21,powers:[.34,.56,.42],guide:'每一階需要的力量不太一樣。'},
    {name:'左右岩台路',tolerance:.18,powers:[.56,.36,.66],guide:'看綠色力量區，跳上左右寬平台。'},
    {name:'雲霧登頂坡',tolerance:.16,powers:[.3,.55,.7,.43],guide:'四次跳躍，慢慢蓄力不用急。'},
    {name:'星光最高峰',tolerance:.14,powers:[.46,.7,.36,.78],guide:'完成最後四階，登上星光山頂。'}
]);

export class JumpClimbSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalLanded=0;this.attempts=0;this.rescues=0;this.hints=0;this.resets=0;this.load();}
    get level(){return JUMP_CLIMB_LEVELS[this.levelIndex]??null;}
    get targetPower(){return this.level?.powers[this.step]??null;}
    get safeRange(){const p=this.targetPower,t=this.level?.tolerance??0;return p===null?null:{min:Math.max(.08,p-t),max:Math.min(1,p+t),center:p};}
    load(){this.step=0;this.landed=0;this.complete=false;}
    jump(power){
        if(this.complete||this.targetPower===null)return{result:'ignored'};
        const value=Math.max(0,Math.min(1,Number(power)||0)),range=this.safeRange;this.attempts+=1;
        if(value<range.min){this.rescues+=1;return{result:'retry_low',power:value,range};}
        if(value>range.max){this.rescues+=1;return{result:'retry_high',power:value,range};}
        this.step+=1;this.landed+=1;this.totalLanded+=1;
        if(this.step===this.level.powers.length){this.complete=true;return{result:'complete',power:value,range};}
        return{result:'landed',power:value,range};
    }
    hint(){if(this.complete)return null;this.hints+=1;return this.safeRange;}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
