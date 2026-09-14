import AnimalSnackGame from './AnimalSnackGame.js';
import { SnowmanShapeSession, SNOWMAN_LEVELS } from '../data/SnowmanShapeData.js';

const TRAY_POS=[[1000,165],[1150,165],[1000,275],[1150,275],[1000,385],[1150,385],[1075,500]];

export default class SnowmanShapeGame extends AnimalSnackGame{
    constructor(){super('SnowmanShapeGame');}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;this.mode='intro';this.session=new SnowmanShapeSession(0);
        this.pieceViews=new Map();this.targetViews=new Map();this.hintId=null;this.hintLeft=0;this.danceGroup=[];
        this.drawSnowPark();this.drawHud();this.drawLevel();this.bindShapeInput();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});
    }
    drawSnowPark(){
        const g=this.add.graphics();g.fillGradientStyle(0x9fd3e4,0xcdebf3,0xf1fafb,0xf9fdff,1).fillRect(0,0,1280,720);g.fillStyle(0xb4dce8,.7).fillTriangle(330,275,535,65,720,275).fillTriangle(650,275,865,35,1080,275);g.fillStyle(0xffffff,.9).fillTriangle(465,137,535,65,602,137).fillTriangle(789,120,865,35,942,120);g.fillStyle(0xf9fdff).fillEllipse(640,650,1430,280);
        for(let i=0;i<28;i++){g.fillStyle(0xffffff,.6).fillCircle(20+(i*181)%1250,85+(i*107)%565,2+i%4);}
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(60);this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(61);this.text(438,41,'形狀雪人拼拼樂',31,'#28576c').setDepth(61);this.levelText=this.text(675,43,'第一關',17,'#648595').setDepth(61);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(61);this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(61);
        this.panel(150,270,244,350,0xf9fdff,0xcde8f1,23).setDepth(45);this.text(150,128,'拼圖任務',23,'#28576c').setDepth(46);this.progressText=this.text(150,178,'0 / 3',34,'#28576c').setDepth(46);this.statText=this.text(150,226,'拖曳 0　點放 0',16,'#648595').setDepth(46);this.feedback=this.text(150,292,'把形狀放進雪人輪廓',17,'#567989').setDepth(46);this.button(150,369,194,49,'小雪花提示',()=>this.showHint(),0xf0d783,'#5d552e').setDepth(46);this.button(150,431,194,46,'本關重來',()=>this.resetLevel(),0xdceff4,'#28576c').setDepth(46);this.text(150,493,'可以拖曳\n也可以點一下自動放',16,'#648595').setDepth(46);
        this.panel(1075,352,340,530,0xf9fdff,0xcde8f1,25).setDepth(40);this.text(1075,105,'形狀零件',23,'#28576c').setDepth(46);this.text(670,692,'拖進中央輪廓，或直接點零件自動吸附｜放錯會回到原位、不扣分',16,'#4f7687').setDepth(61);
    }
    drawLevel(){
        this.clearLevel();const level=this.session.level;this.levelText.setText(level.name);this.progressText.setText(`0 / ${level.pieces.length}`);this.refreshStats();
        level.pieces.forEach((piece,index)=>{
            const target=this.drawShape(piece,piece.x,piece.y,true).setDepth(12);this.targetViews.set(piece.id,target);
            const [x,y]=TRAY_POS[index];const view=this.drawShape(piece,x,y,false).setDepth(50);view.homeX=x;view.homeY=y;view.homeScale=trayScale(piece.kind);view.setScale(view.homeScale);view.piece=piece;view.dragDistance=0;view.setSize(150,126).setInteractive({useHandCursor:true});this.input.setDraggable(view);
            view.on('dragstart',pointer=>{if(this.mode!=='playing')return;view.dragStartX=pointer.x;view.dragStartY=pointer.y;view.dragDistance=0;view.setDepth(58).setScale(view.homeScale*1.08);this.clearHint();});
            view.on('drag',(pointer,dragX,dragY)=>{if(this.mode!=='playing')return;view.x=dragX;view.y=dragY;view.dragDistance=Math.max(view.dragDistance,Phaser.Math.Distance.Between(view.dragStartX,view.dragStartY,pointer.x,pointer.y));});
            view.on('dragend',()=>{if(this.mode!=='playing'||this.session.placed.has(piece.id))return;view.setScale(view.homeScale);if(view.dragDistance>=12)this.tryPlace(piece.id,'drag');});
            view.on('pointerup',()=>{if(this.mode==='playing'&&!this.session.placed.has(piece.id)&&view.dragDistance<12)this.tryPlace(piece.id,'tap');});
            this.pieceViews.set(piece.id,view);
        });
    }
    clearLevel(){this.pieceViews.forEach(v=>v.destroy());this.targetViews.forEach(v=>v.destroy());this.pieceViews.clear();this.targetViews.clear();this.danceGroup=[];this.hintId=null;this.hintLeft=0;}
    drawShape(piece,x,y,target){
        const c=this.add.container(x,y),g=this.add.graphics(),fill=target?0xd7e8ec:piece.color,alpha=target ? 0.28 : 1;g.lineStyle(target?3:4,target?0x8fb8c3:0xffffff,target ? 0.8 : 0.92);
        if(piece.kind==='circleLarge'){g.fillStyle(fill,alpha).fillCircle(0,0,90);g.strokeCircle(0,0,90);}
        else if(piece.kind==='circleSmall'){g.fillStyle(fill,alpha).fillCircle(0,0,61);g.strokeCircle(0,0,61);}
        else if(piece.kind==='triangle'){g.fillStyle(fill,alpha).fillTriangle(-4,-13,54,0,-4,14);g.strokeTriangle(-4,-13,54,0,-4,14);}
        else if(piece.kind==='scarf'){g.fillStyle(fill,alpha).fillRoundedRect(-69,-14,138,28,10);g.strokeRoundedRect(-69,-14,138,28,10);g.fillStyle(fill,alpha).fillRoundedRect(35,7,27,69,8);}
        else if(piece.kind==='hat'){g.fillStyle(fill,alpha).fillRoundedRect(-46,-51,92,65,12);g.strokeRoundedRect(-46,-51,92,65,12);g.fillStyle(fill,alpha).fillRoundedRect(-72,5,144,23,9);}
        else if(piece.kind==='buttons'){[-25,18,60].forEach(oy=>{g.fillStyle(fill,alpha).fillCircle(0,oy,10);g.strokeCircle(0,oy,10);});}
        else{g.fillStyle(fill,alpha).fillStar(0,0,5,18,38);g.strokePoints(starPoints(0,0,5,18,38),true);}
        if(!target){g.fillStyle(0xffffff,.38).fillCircle(-14,-12,6);}c.add(g);return c;
    }
    tryPlace(id,method){
        const view=this.pieceViews.get(id),target=this.targetViews.get(id);if(!view||!target||this.mode!=='playing')return;this.clearHint();const distance=Phaser.Math.Distance.Between(view.x,view.y,target.x,target.y);
        if(method==='drag'&&distance>95){this.session.mistake();this.feedback.setText('這個輪廓不一樣，零件回到原位囉！');this.tone('hint');this.returnHome(view);this.refreshStats();return;}
        if(!this.session.place(id,method))return;view.disableInteractive();view.setDepth(24);this.tweens.add({targets:view,x:target.x,y:target.y,scale:1,angle:0,duration:260,ease:'Back.easeOut',onComplete:()=>{target.setVisible(false);this.sparkle(view.x,view.y);this.tone('correct');this.danceGroup.push(view);this.refreshStats();if(this.session.complete){this.mode='celebrating';this.time.delayedCall(450,()=>this.finishLevel());}else this.feedback.setText(method==='tap'?'吸到正確位置了！再點下一個。':'形狀放對了！小雪花拍拍手。');}});
    }
    returnHome(view){this.tweens.add({targets:view,x:view.homeX,y:view.homeY,scale:view.homeScale,duration:280,ease:'Back.easeOut',onComplete:()=>view.setDepth(50)});}
    refreshStats(){const count=this.session.placed.size,total=this.session.level.pieces.length;this.progressText.setText(`${count} / ${total}`);this.statText.setText(`拖曳 ${this.session.drags}　點放 ${this.session.taps}`);}
    showHint(){if(this.mode!=='playing')return;this.clearHint();const id=this.session.hint(),view=this.pieceViews.get(id),target=this.targetViews.get(id);if(!view||!target)return;this.hintId=id;this.hintLeft=2.8;view.setScale(view.homeScale*1.14);target.setAlpha(.8);this.feedback.setText(`找找看「${view.piece.name}」的輪廓！`);this.tone('hint');}
    clearHint(){if(!this.hintId)return;const view=this.pieceViews.get(this.hintId),target=this.targetViews.get(this.hintId);if(view&&!this.session.placed.has(this.hintId))view.setScale(view.homeScale);target?.setAlpha(1);this.hintId=null;this.hintLeft=0;}
    update(_time,delta){if(this.mode!=='playing'||!this.hintId)return;this.hintLeft-=Math.min(delta/1000,.05);const target=this.targetViews.get(this.hintId);if(target)target.setScale(1+Math.sin(this.hintLeft*7)*.07);if(this.hintLeft<=0){target?.setScale(1);this.clearHint();}}
    bindShapeInput(){this.keyHandler=e=>{if(e.repeat)return;if(e.code==='KeyH')this.showHint();else if(e.code==='KeyR')this.resetLevel();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);}
    resetLevel(){if(!['playing','paused'].includes(this.mode))return;this.overlay?.destroy();this.overlay=null;this.session.load(this.session.levelIndex);this.mode='playing';this.drawLevel();this.feedback.setText('雪人輪廓重新準備好了！');}
    snowCelebration(){for(let i=0;i<24;i++){const flake=this.add.star(665,300,6,3,8,i%3?0xffffff:0x87d9e8,.95).setDepth(55);const x=400+(i*83)%520,y=130+(i%4)*20;flake.setPosition(x,y);this.tweens.add({targets:flake,y:630,x:x+Math.sin(i)*45,angle:180,duration:900+i%5*130,onComplete:()=>flake.destroy()});}this.danceGroup.forEach((v,i)=>this.tweens.add({targets:v,y:v.y-14,angle:i%2?5:-5,duration:210,yoyo:true,repeat:3}));}
    showIntro(){const o=this.makeOverlay('一起拼出形狀雪人！','把右邊的形狀拖到中央相同的輪廓。\n小小孩也可以直接點一下零件，它會自動吸到正確位置。\n放錯會回到原位，不扣分，可以一直試。');const snow=this.drawShape({kind:'circleLarge',color:0xf7fdff},560,430,false).setScale(.55),nose=this.drawShape({kind:'triangle',color:0xf29a50},740,430,false).setScale(.9);o.add([snow,nose]);o.add(this.text(640,505,'完成五位雪人朋友，最後一位會戴上星星徽章。',18,'#678493'));o.add(this.button(640,562,275,58,'開始拼雪人！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));}
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.stopTones();const o=this.makeOverlay('休息一下，形狀會等你','拖曳零件到中央相同輪廓。\n也可以直接點零件自動放好。\n「小雪花提示」會亮出一個零件和它的位置。');o.add(this.button(640,405,270,55,'繼續拼雪人',()=>this.resumeGame(),0x397fa0));o.add(this.button(500,498,220,51,'本關重來',()=>this.resetLevel(),0xf0d783,'#5d552e'));o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));}
    finishLevel(){
        const last=this.session.levelIndex===SNOWMAN_LEVELS.length-1;this.mode='celebrating';this.snowCelebration();this.tone(last?'finish':'correct');this.time.delayedCall(950,()=>this.showLevelComplete(last));
    }
    showLevelComplete(last){
        this.mode='levelComplete';const o=this.makeOverlay(last?'星星雪人隊完成！':'雪人拼好了！',last?`五位雪人朋友全部完成！\n這關拖曳：${this.session.drags} 次　點一下自動放：${this.session.taps} 次`:`${this.session.level.name}完成！\n拖曳放好：${this.session.drags} 個　點一下放好：${this.session.taps} 個\n放錯再試：${this.session.mistakes} 次`);o.add(this.text(640,397,'雪人剛剛開心跳舞了！試玩不扣愛心，也不寫入正式存檔。',18,'#678493'));
        if(last){o.add(this.button(500,492,230,59,'再拼一次',()=>this.restart(),0x397fa0));o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));}else o.add(this.button(640,492,260,59,'認識下一位雪人',()=>{this.session.load(this.session.levelIndex+1);o.destroy();this.overlay=null;this.mode='playing';this.drawLevel();this.feedback.setText('新的形狀出現了，慢慢找輪廓！');},0x397fa0));
    }
}

function starPoints(x,y,points,inner,outer){const out=[];for(let i=0;i<points*2;i++){const a=-Math.PI/2+i*Math.PI/points,r=i%2?inner:outer;out.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r});}return out;}
function trayScale(kind){return ({circleLarge:.48,circleSmall:.65,triangle:.9,scarf:.68,hat:.62,buttons:.78,star:.72})[kind]||.7;}
