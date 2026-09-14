import AnimalSnackGame from './src/scenes/AnimalSnackGame.js';

class SnackDemoHome extends Phaser.Scene {
    constructor() { super('SnackDemoHome'); }
    create() {
        this.cameras.main.setBackgroundColor('#e6edda');
        const text = (x,y,t,size=24,color='#365d4a') => this.add.text(x,y,t,{fontFamily:'Microsoft JhengHei, sans-serif',fontSize:size,color,fontStyle:'bold',align:'center',lineSpacing:10}).setOrigin(0.5);
        text(640,100,'小遊戲試玩室',42);
        text(640,155,'動物點心隊 v0.1 · 獨立試玩，不讀寫正式存檔',21);
        this.add.rectangle(640,374,740,300,0xfffbef).setStrokeStyle(3,0xb8ccac);
        text(640,275,'反應節奏',18,'#85977b');
        text(640,333,'動物點心隊',36);
        text(640,391,'看客人、選點心，搭著葉子飛行器出發！\n三種點心 · 十二位朋友 · 送錯也能再試',22);
        const b=this.add.rectangle(640,478,290,61,0x4d7e62).setInteractive({useHandCursor:true});
        text(640,478,'開始幼童試玩',25,'#fffbed');
        b.on('pointerdown',()=>this.scene.start('AnimalSnackGame',{returnScene:'SnackDemoHome',testMode:true}));
        text(640,595,'正式系統請使用 UPDATE 資料夾。\n整合後：首頁 → 小遊戲列表 → 全部／反應節奏 → 動物點心隊',19);
    }
}
const game = new Phaser.Game({type:Phaser.AUTO,width:1280,height:720,parent:'game-container',
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    scene:[SnackDemoHome,AnimalSnackGame]});
// Local test harness only; not included in production main.js.
window.snackDemo = game;
