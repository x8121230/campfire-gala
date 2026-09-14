import AnimalSnackGame from './AnimalSnackGame.js';

const BONUS=[
    {scene:'LavaBubblePopGame',icon:'🫧',name:'啵啵彩色岩漿泡泡',subtitle:'已完成・寶寶點擊',color:0xe96c73},
    {scene:'PteroFossilPuzzleGame',icon:'🦴',name:'彈果翼龍化石拼圖',subtitle:'已完成・形狀拼圖',color:0xa97855},
    {scene:'VolcanoGemCartGame',icon:'💎',name:'火山寶石分類車',subtitle:'已完成・色彩分類',color:0xc56f45},
    {scene:'HotSpringCapybaraGame',icon:'♨️',name:'溫泉水豚躲貓貓',subtitle:'已完成・記憶專注',color:0x9a7180},
    {scene:'JellySeaBridgeGame',icon:'🪨',name:'造橋過果凍海',subtitle:'已完成・大小排序',color:0xb65b3d}
];

export default class VolcanoBonusMap extends AnimalSnackGame {
    constructor(){super('VolcanoBonusMap');}
    create(){this.sound.stopAll();this.drawMap();}
    drawMap(){const g=this.add.graphics();g.fillGradientStyle(0x5a3153,0x9d4d54,0xf39354,0x48293f,1).fillRect(0,0,1280,720);g.fillStyle(0x3c2d3e).fillTriangle(0,430,300,110,590,430).fillTriangle(700,430,1010,90,1280,430);g.fillStyle(0xff7b43).fillTriangle(240,174,300,110,362,174).fillTriangle(948,158,1010,90,1073,158);g.fillStyle(0xe85f3e).fillRoundedRect(-20,500,1320,230,80);g.fillStyle(0xffa955,.85).fillRoundedRect(20,565,1240,120,55);for(let i=0;i<36;i++)g.fillStyle(i%2?0xffe080:0xff8f6b,.55).fillCircle(25+(i*149)%1230,110+(i*71)%550,3+i%5);this.panel(640,48,1240,76,0xffefd8,0xe6ac68,22).setDepth(50);this.button(105,48,170,46,'← 火山主島',()=>this.scene.start('VolcanoWorldMap',{returnScene:'MiniGameHub'}),0xa14a39).setDepth(51);this.text(640,42,'火山備選小島',34,'#743329').setDepth(51);this.text(640,76,'第二組五款遊戲・全部完成',16,'#a35f45').setDepth(51);BONUS.forEach((item,index)=>this.node(item,index));this.text(640,680,'五座備選遊戲島已全部開放｜點亮島嶼開始挑戰',16,'#ffe2ae').setDepth(51);}
    node(item,index){const positions=[[300,300],[640,235],[980,300],[440,515],[840,515]],x=positions[index][0],y=positions[index][1],active=Boolean(item.scene),c=this.add.container(x,y).setDepth(28),glow=this.add.circle(0,0,82,active?0xffdf78:0x6c5967,active?.25:.1),base=this.add.circle(0,0,68,active?item.color:0x5c4c58,1).setStrokeStyle(5,active?0xffd991:0x766570),icon=this.text(0,-11,item.icon,40,active?'#ffffff':'#9d9098'),name=this.text(0,87,`${index+1}. ${item.name}`,18,active?'#fff0ca':'#b8a9af'),sub=this.text(0,113,item.subtitle,14,active?'#ffd993':'#9b8d94');c.add([glow,base,icon,name,sub]).setSize(250,190);if(active){c.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start(item.scene,{returnScene:'VolcanoBonusMap'})).on('pointerover',()=>c.setScale(1.06)).on('pointerout',()=>c.setScale(1));this.tweens.add({targets:glow,scale:1.2,alpha:.06,duration:780,yoyo:true,repeat:-1});}else c.setInteractive({useHandCursor:true}).on('pointerdown',()=>{sub.setText('還在準備中～');this.tweens.add({targets:c,angle:3,duration:65,yoyo:true,repeat:2});});}
}
