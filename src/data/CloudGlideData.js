export const CLOUD_GLIDE_CONFIG = Object.freeze({
    targetRings:25,
    ringsPerPhase:5,
    startY:360,
    minY:125,
    maxY:625,
    baseSpeed:235,
    ringRadius:66,
    maxStamina:100,
    maxBoost:100,
    maxHealth:3
});

export const CLOUD_GLIDE_PHASES = Object.freeze([
    {name:'晨風試翼',speed:235,ring:'normal',hazard:0,guide:'掌握升降，從圈心切過可得完美評價。'},
    {name:'浮島變奏',speed:255,ring:'moving',hazard:3,guide:'風圈開始上下漂移，提前判讀它的路線。'},
    {name:'逆風峽谷',speed:275,ring:'precision',hazard:2,guide:'窄圈與逆風交錯；放開滑翔可恢復耐力。'},
    {name:'彩虹衝刺',speed:300,ring:'rainbow',hazard:2,guide:'俯衝蓄滿風能，爆發穿越稀有彩虹圈。'},
    {name:'風暴核心',speed:325,ring:'mixed',hazard:1,guide:'所有風況混合登場，守住連擊完成終點航線。'}
]);

export class CloudGlideSession {
    constructor(){this.reset();}
    reset(){
        this.rings=0;this.stars=0;this.score=0;this.combo=0;this.bestCombo=0;
        this.missed=0;this.cloudBumps=0;this.hits=0;this.hints=0;
        this.health=CLOUD_GLIDE_CONFIG.maxHealth;this.complete=false;
    }
    get phaseIndex(){return Math.min(CLOUD_GLIDE_PHASES.length-1,Math.floor(this.rings/CLOUD_GLIDE_CONFIG.ringsPerPhase));}
    get phase(){return CLOUD_GLIDE_PHASES[this.phaseIndex];}
    passRing({perfect=false,boost=false,rare=''}={}){
        if(this.complete)return {result:'ignored',points:0,phaseChanged:false};
        const before=this.phaseIndex;this.rings+=1;this.combo+=1;this.bestCombo=Math.max(this.bestCombo,this.combo);
        const multiplier=1+Math.floor((this.combo-1)/5)*.25;
        const rareBonus=rare==='gold'?150:rare==='rainbow'?300:0;
        const points=Math.round((100+(perfect?75:0)+(boost?100:0)+rareBonus)*multiplier);
        this.score+=points;this.stars+=(perfect?2:1)+(rare==='gold'?2:rare==='rainbow'?4:0);
        if(this.rings>=CLOUD_GLIDE_CONFIG.targetRings)this.complete=true;
        return {result:this.complete?'complete':'passed',points,phaseChanged:this.phaseIndex!==before};
    }
    missRing(){if(this.complete)return false;this.missed+=1;this.combo=0;return true;}
    bumpCloud(){if(this.complete)return false;this.cloudBumps+=1;this.combo=0;return true;}
    damage(){if(this.complete||this.health<=0)return false;this.hits+=1;this.combo=0;this.health=Math.max(0,this.health-1);return this.health;}
    repair(){if(this.health>=CLOUD_GLIDE_CONFIG.maxHealth)return false;this.health+=1;return true;}
    hint(){if(this.complete)return false;this.hints+=1;return true;}
}
