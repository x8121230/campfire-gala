const level = (name, path, decoys) => Object.freeze({ name, path: Object.freeze(path), decoys: Object.freeze(decoys) });

export const ICE_TAP_LEVELS = Object.freeze([
    level('第一關・直直落下', [
        {id:'p0',x:650,y:238,w:230},{id:'p1',x:650,y:365,w:220},{id:'p2',x:650,y:492,w:210}
    ], [{id:'d0',x:430,y:365,w:120},{id:'d1',x:870,y:492,w:120}]),
    level('第二關・滑向左邊', [
        {id:'p0',x:650,y:220,w:230},{id:'p1',x:570,y:335,w:230,tilt:-5},{id:'p2',x:500,y:465,w:210}
    ], [{id:'d0',x:840,y:335,w:160},{id:'d1',x:790,y:465,w:170}]),
    level('第三關・左右冰橋', [
        {id:'p0',x:650,y:190,w:220},{id:'p1',x:750,y:290,w:230,tilt:5},{id:'p2',x:650,y:395,w:220,tilt:-5},{id:'p3',x:540,y:500,w:205}
    ], [{id:'d0',x:430,y:290,w:150},{id:'d1',x:875,y:395,w:125}]),
    level('第四關・長長階梯', [
        {id:'p0',x:600,y:185,w:205},{id:'p1',x:690,y:285,w:220,tilt:5},{id:'p2',x:770,y:385,w:205},{id:'p3',x:650,y:490,w:230,tilt:-5}
    ], [{id:'d0',x:405,y:285,w:130},{id:'d1',x:465,y:395,w:145},{id:'d2',x:925,y:490,w:120}]),
    level('第五關・冰晶塔', [
        {id:'p0',x:650,y:160,w:205},{id:'p1',x:535,y:245,w:210,tilt:-5},{id:'p2',x:650,y:330,w:220,tilt:5},{id:'p3',x:765,y:415,w:210,tilt:5},{id:'p4',x:650,y:505,w:230,tilt:-5}
    ], [{id:'d0',x:870,y:245,w:130},{id:'d1',x:415,y:330,w:125},{id:'d2',x:455,y:500,w:115}])
]);

export class IceTapRescueSession {
    constructor(levelIndex=0){this.load(levelIndex);}
    load(levelIndex){
        this.levelIndex=Math.max(0,Math.min(ICE_TAP_LEVELS.length-1,levelIndex));this.current=0;this.taps=0;this.wrong=0;this.funBreaks=0;this.hints=0;this.complete=false;
        this.broken=new Set();this.cracked=new Set();
    }
    get level(){return ICE_TAP_LEVELS[this.levelIndex];}
    get activeId(){return this.level.path[this.current]?.id??null;}
    tap(id){
        if(this.complete||!id)return {result:'ignored'};this.taps+=1;
        const pathIndex=this.level.path.findIndex(block=>block.id===id);
        if(pathIndex===this.current){this.broken.add(id);this.current+=1;if(this.current>=this.level.path.length)this.complete=true;return {result:'support',complete:this.complete,next:this.level.path[this.current]??null};}
        if(pathIndex>this.current){this.wrong+=1;this.cracked.add(id);return {result:'future'};}
        const decoy=this.level.decoys.some(block=>block.id===id);
        if(decoy&&!this.broken.has(id)){this.broken.add(id);this.funBreaks+=1;return {result:'decoy'};}
        return {result:'ignored'};
    }
    hint(){this.hints+=1;return this.activeId;}
}
