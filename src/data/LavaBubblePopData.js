export const LAVA_BUBBLE_COLORS = Object.freeze([
    {id:'orange',fill:0xff8b43,shine:0xffd47b},
    {id:'pink',fill:0xf06d9a,shine:0xffc2db},
    {id:'yellow',fill:0xffc94d,shine:0xffef9b},
    {id:'purple',fill:0xa878d1,shine:0xdabdf1},
    {id:'mint',fill:0x65c7a2,shine:0xb7f0da}
]);

export const LAVA_BUBBLE_CONFIG = Object.freeze({goal:24,rainbowEvery:6,stageMarks:[0,8,16,24]});

export function bubbleStage(popped){return Math.min(2,Math.floor(Math.max(0,popped)/8));}
export function isRainbowBubble(serial){return serial>0&&serial%LAVA_BUBBLE_CONFIG.rainbowEvery===0;}

export class LavaBubblePopSession {
    constructor(){this.popped=0;this.rainbows=0;this.escaped=0;this.spawned=0;this.emptyTaps=0;this.complete=false;}
    spawn(){this.spawned+=1;return{serial:this.spawned,rainbow:isRainbowBubble(this.spawned),colorIndex:(this.spawned*3+1)%LAVA_BUBBLE_COLORS.length};}
    pop(rainbow=false){if(this.complete)return'ignored';this.popped+=1;if(rainbow)this.rainbows+=1;if(this.popped>=LAVA_BUBBLE_CONFIG.goal){this.complete=true;return'complete';}return rainbow?'rainbow':'popped';}
    escape(){this.escaped+=1;return'return';}
    emptyTap(){this.emptyTaps+=1;return this.spawn();}
    get stage(){return bubbleStage(this.popped);}
}
