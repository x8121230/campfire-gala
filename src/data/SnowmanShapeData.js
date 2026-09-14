const PARTS = Object.freeze({
    body: {id:'body',name:'大圓形身體',kind:'circleLarge',x:665,y:465,color:0xf7fdff},
    head: {id:'head',name:'小圓形頭',kind:'circleSmall',x:665,y:292,color:0xf7fdff},
    nose: {id:'nose',name:'三角形鼻子',kind:'triangle',x:695,y:297,color:0xf29a50},
    scarf: {id:'scarf',name:'長方形圍巾',kind:'scarf',x:665,y:355,color:0xe66f72},
    hat: {id:'hat',name:'長方形帽子',kind:'hat',x:665,y:205,color:0x557fa4},
    button: {id:'button',name:'圓形鈕扣',kind:'buttons',x:665,y:448,color:0x4a6878},
    star: {id:'star',name:'星星徽章',kind:'star',x:620,y:415,color:0xf2c95e}
});

const makeLevel=(name,ids)=>Object.freeze({name,pieces:Object.freeze(ids.map(id=>Object.freeze({...PARTS[id]})))});

export const SNOWMAN_LEVELS=Object.freeze([
    makeLevel('第一關・圓圓雪人',['body','head','nose']),
    makeLevel('第二關・紅圍巾',['body','head','nose','scarf']),
    makeLevel('第三關・藍帽朋友',['body','head','nose','scarf','hat']),
    makeLevel('第四關・鈕扣雪人',['body','head','nose','scarf','hat','button']),
    makeLevel('第五關・星星隊長',['body','head','nose','scarf','hat','button','star'])
]);

export class SnowmanShapeSession{
    constructor(levelIndex=0){this.load(levelIndex);}
    load(levelIndex){this.levelIndex=Math.max(0,Math.min(SNOWMAN_LEVELS.length-1,levelIndex));this.placed=new Set();this.attempts=0;this.mistakes=0;this.taps=0;this.drags=0;this.hints=0;this.complete=false;}
    get level(){return SNOWMAN_LEVELS[this.levelIndex];}
    place(id,method='drag'){
        if(this.complete||this.placed.has(id)||!this.level.pieces.some(p=>p.id===id))return false;
        this.attempts+=1;this.placed.add(id);if(method==='tap')this.taps+=1;else this.drags+=1;
        this.complete=this.placed.size===this.level.pieces.length;return true;
    }
    mistake(){if(!this.complete){this.attempts+=1;this.mistakes+=1;}}
    hint(){this.hints+=1;return this.level.pieces.find(piece=>!this.placed.has(piece.id))?.id??null;}
}
