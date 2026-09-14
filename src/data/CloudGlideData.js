export const CLOUD_GLIDE_CONFIG = Object.freeze({
    targetRings:12,
    startY:360,
    minY:145,
    maxY:590,
    slowSpeed:170,
    normalSpeed:225,
    ringRadius:78
});

export const CLOUD_GLIDE_PHASES = Object.freeze([
    {name:'認識順風圈',from:0,to:3,guide:'大雲圈慢慢飛來，先練習升降。'},
    {name:'雲朵間滑翔',from:4,to:7,guide:'軟綿綿雲朵加入旅程。'},
    {name:'天空星光航線',from:8,to:11,guide:'順風圈會出現在更多高度。'}
]);

export class CloudGlideSession {
    constructor(){this.rings=0;this.stars=0;this.missed=0;this.cloudBumps=0;this.hints=0;this.complete=false;}
    get phaseIndex(){return Math.min(2,Math.floor(this.rings/4));}
    get phase(){return CLOUD_GLIDE_PHASES[this.phaseIndex];}
    passRing(hasStar=true){if(this.complete)return'ignored';this.rings+=1;if(hasStar)this.stars+=1;if(this.rings>=CLOUD_GLIDE_CONFIG.targetRings){this.complete=true;return'complete';}return'passed';}
    missRing(){if(this.complete)return false;this.missed+=1;return true;}
    bumpCloud(){if(this.complete)return false;this.cloudBumps+=1;return true;}
    hint(){if(this.complete)return false;this.hints+=1;return true;}
}
