export const DINOSAUR_RUN_CONFIG = Object.freeze({
    targetFriends:10,
    groundY:555,
    slowSpeed:175,
    normalSpeed:230,
    slowedSpeed:95,
    jumpVelocity:-560,
    gravity:1180
});

export const DINOSAUR_RUN_PHASES = Object.freeze([
    {name:'草原初相遇',from:0,to:2,guide:'先練習跳躍，尋找三位恐龍朋友。'},
    {name:'化石林小徑',from:3,to:6,guide:'石頭和倒木加入山谷小徑。'},
    {name:'彩蛋火山谷',from:7,to:9,guide:'最後穿過泥地，完成恐龍朋友隊。'}
]);

export class DinosaurValleySession {
    constructor(){this.friends=0;this.eggs=0;this.footprints=0;this.bumps=0;this.missedFriends=0;this.jumps=0;this.hints=0;this.complete=false;}
    get phaseIndex(){return this.friends<3?0:this.friends<7?1:2;}
    get phase(){return DINOSAUR_RUN_PHASES[this.phaseIndex];}
    jump(){if(this.complete)return false;this.jumps+=1;return true;}
    meetFriend(){if(this.complete)return'ignored';this.friends+=1;if(this.friends>=DINOSAUR_RUN_CONFIG.targetFriends){this.complete=true;return'complete';}return'met';}
    collectEgg(){if(this.complete)return false;this.eggs+=1;return true;}
    collectFootprint(){if(this.complete)return false;this.footprints+=1;return true;}
    bumpObstacle(){if(this.complete)return false;this.bumps+=1;return true;}
    missFriend(){if(this.complete)return false;this.missedFriends+=1;return true;}
    hint(){if(this.complete)return false;this.hints+=1;return true;}
}
