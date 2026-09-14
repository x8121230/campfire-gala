export const PTERO_PART_NAMES = Object.freeze({body:'身體骨',head:'頭骨',leftWing:'左翼骨',rightWing:'右翼骨',tail:'尾骨',acorn:'硬果護甲',rock:'岩石背甲'});

export const PTERO_FOSSIL_LEVELS = Object.freeze([
    {name:'三塊大化石',parts:['body','head','leftWing'],guide:'先認識身體、頭和大翅膀。'},
    {name:'左右翼展開',parts:['body','head','leftWing','rightWing'],guide:'看看左翼和右翼要放在哪一邊。'},
    {name:'長尾巴回來了',parts:['body','head','leftWing','rightWing','tail'],guide:'加入長長的尾骨。'},
    {name:'硬果護甲',parts:['body','head','leftWing','rightWing','tail','acorn'],guide:'彈果翼龍最重要的硬果裝飾登場。'},
    {name:'完整彈果翼龍',parts:['body','head','leftWing','rightWing','tail','acorn','rock'],guide:'最後裝上岩石背甲，讓翼龍完整復活。'}
]);

export class PteroFossilSession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalPlaced=0;this.mistakes=0;this.hints=0;this.resets=0;this.load();}
    get level(){return PTERO_FOSSIL_LEVELS[this.levelIndex]??null;}
    load(){this.placed=new Set();this.complete=false;}
    place(partId,targetId=partId){if(this.complete||!this.level?.parts.includes(partId)||this.placed.has(partId))return'ignored';if(partId!==targetId){this.mistakes+=1;return'retry';}this.placed.add(partId);this.totalPlaced+=1;if(this.placed.size===this.level.parts.length){this.complete=true;return'complete';}return'placed';}
    hint(){this.hints+=1;return this.level.parts.find(id=>!this.placed.has(id))??null;}
    reset(){this.resets+=1;this.load();}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
