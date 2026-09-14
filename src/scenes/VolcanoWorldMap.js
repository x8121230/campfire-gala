import AnimalSnackGame from './AnimalSnackGame.js';

const STAGES=[
    {scene:'LavaStepGame',x:250,y:505,icon:'🪨',name:'熔岩踏石',color:0xb95736},
    {scene:'CoolingWorkshopGame',x:420,y:315,icon:'❄️',name:'冷卻工坊',color:0x4e9fbd},
    {scene:'LavaPipeGame',x:640,y:465,icon:'🚿',name:'水管接接樂',color:0xc76a37},
    {scene:'VolcanoEchoGame',x:850,y:285,icon:'🎵',name:'洞穴回聲',color:0x8d536f},
    {scene:'LavaBridgeGame',x:1050,y:505,icon:'🌉',name:'熔岩河搭橋',color:0xa86b3f}
];

export default class VolcanoWorldMap extends AnimalSnackGame {
    constructor(){super('VolcanoWorldMap');}
    create(){this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.drawMap();}
    drawMap(){const g=this.add.graphics();g.fillGradientStyle(0x392342,0x6a303d,0xe76531,0x2d2035,1).fillRect(0,0,1280,720);g.fillStyle(0x2c2430).fillTriangle(180,430,520,70,850,430).fillTriangle(670,430,980,105,1280,430);g.fillStyle(0xee6130).fillTriangle(445,150,520,70,595,150).fillTriangle(910,180,980,105,1050,180);g.fillStyle(0x422536).fillRect(0,430,1280,290);g.fillStyle(0xe74e28).fillRoundedRect(0,555,1280,165,60);g.fillStyle(0xffa441,.72).fillRoundedRect(0,602,1280,70,35);for(let i=0;i<42;i++)g.fillStyle(i%2?0xffc15d:0xff7b37,.55).fillCircle(20+(i*139)%1240,90+(i*91)%560,2+i%6);this.panel(640,48,1240,76,0xfff0d2,0xe3a65b,22).setDepth(50);this.button(105,48,160,46,'← 遊戲列表',()=>this.leave(),0x8f4230).setDepth(51);this.button(1110,48,190,46,'備選小島 →',()=>this.scene.start('VolcanoBonusMap',{returnScene:'VolcanoWorldMap'}),0xc05a3d).setDepth(51);this.text(610,42,'岩漿海・火山群島',34,'#6d3028').setDepth(51);this.text(610,76,'選一座火山島，開始幼童益智冒險',16,'#9a5b3e').setDepth(51);g.lineStyle(12,0xffcf6a,.42).beginPath().moveTo(250,505).lineTo(420,315).lineTo(640,465).lineTo(850,285).lineTo(1050,505).strokePath();STAGES.forEach((s,i)=>this.stageNode(s,i));this.text(640,675,'五款皆為獨立試玩｜右上角可前往第二組備選小島',16,'#ffe5ad').setDepth(51);}
    stageNode(stage,index){const c=this.add.container(stage.x,stage.y).setDepth(30),glow=this.add.circle(0,0,76,0xffcb63,.22),base=this.add.circle(0,0,66,stage.color,1).setStrokeStyle(5,0xffdda0),icon=this.text(0,-8,stage.icon,39,'#ffffff'),label=this.text(0,86,`${index+1}. ${stage.name}`,18,'#fff1ce');c.add([glow,base,icon,label]).setSize(160,165).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start(stage.scene,{returnScene:'VolcanoWorldMap'})).on('pointerover',()=>c.setScale(1.07)).on('pointerout',()=>c.setScale(1));this.tweens.add({targets:glow,scale:1.18,alpha:.08,duration:850+index*70,yoyo:true,repeat:-1});}
    leave(){this.scene.start(this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub');}
}
