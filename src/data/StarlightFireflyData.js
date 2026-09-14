export const FIREFLY_FRIENDS = Object.freeze([
    {id:'gold',name:'金金',color:0xffd85a,icon:'★'},
    {id:'mint',name:'綠綠',color:0x74df9d,icon:'●'},
    {id:'pink',name:'粉粉',color:0xff8eb5,icon:'♥'},
    {id:'blue',name:'藍藍',color:0x77c9ff,icon:'◆'}
]);

export const STARLIGHT_FIREFLY_LEVELS = Object.freeze([
    {name:'兩點星光',sequence:['gold','mint'],mode:'forward',guide:'看兩隻螢火蟲依序發亮，再照順序點一次。'},
    {name:'湖畔三閃',sequence:['pink','gold','blue'],mode:'forward',guide:'記住三次閃光；同一隻朋友也可能再出現。'},
    {name:'倒著找朋友',sequence:['mint','blue','gold'],mode:'reverse',guide:'這一關要從最後一隻開始，倒著點回去。'},
    {name:'月光四色曲',sequence:['gold','pink','mint','blue'],mode:'forward',guide:'四位朋友都會發亮，跟著星光排隊。'},
    {name:'星光湖大合奏',sequence:['blue','gold','pink','gold','mint'],mode:'reverse',guide:'最後挑戰要倒著點；慢慢記，不用趕時間。'}
]);

export class StarlightFireflySession {
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalCorrect=0;this.mistakes=0;this.replays=0;this.hints=0;this.load();}
    get level(){return STARLIGHT_FIREFLY_LEVELS[this.levelIndex]??null;}
    get answer(){if(!this.level)return[];return this.level.mode==='reverse'?[...this.level.sequence].reverse():[...this.level.sequence];}
    get nextId(){return this.answer[this.step]??null;}
    load(){this.step=0;this.complete=false;}
    choose(id){
        if(this.complete||!this.nextId)return{result:'ignored'};
        if(!FIREFLY_FRIENDS.some(friend=>friend.id===id))return{result:'ignored'};
        if(id!==this.nextId){this.mistakes+=1;this.step=0;return{result:'retry',expected:this.nextId};}
        this.step+=1;this.totalCorrect+=1;
        if(this.step===this.answer.length){this.complete=true;return{result:'complete'};}
        return{result:'correct',next:this.nextId};
    }
    replay(){if(this.complete)return false;this.replays+=1;this.step=0;return true;}
    hint(){if(this.complete)return null;this.hints+=1;return this.nextId;}
    advance(){if(!this.complete)return false;this.levelIndex+=1;if(this.level)this.load();return true;}
}
