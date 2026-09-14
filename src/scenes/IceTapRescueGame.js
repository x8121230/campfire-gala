import AnimalSnackGame from './AnimalSnackGame.js';
import { IceTapRescueSession, ICE_TAP_LEVELS } from '../data/IceTapRescueData.js';

export default class IceTapRescueGame extends AnimalSnackGame {
    constructor(){super('IceTapRescueGame');}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;this.mode='intro';
        this.session=new IceTapRescueSession(0);this.blockViews=new Map();this.selectedId=null;this.hintId=null;this.hintLeft=0;this.falling=false;
        this.drawIceCave();this.drawHud();this.drawLevel();this.bindTapInput();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});
    }
    drawIceCave(){
        const g=this.add.graphics();g.fillGradientStyle(0x7bbbd2,0xb8e2ed,0xe8f7fa,0xf9fdff,1).fillRect(0,0,1280,720);
        g.fillStyle(0x6cacc5,.48).fillTriangle(0,0,230,0,75,315).fillTriangle(1280,0,1045,0,1210,325);
        g.fillStyle(0xd8f2f7,.92).fillTriangle(235,0,305,0,270,130).fillTriangle(870,0,940,0,905,152).fillTriangle(1035,0,1110,0,1072,118);
        g.fillStyle(0xf8fdff).fillEllipse(650,622,790,148);g.fillStyle(0xd8edf3).fillEllipse(650,609,600,82);
        for(let i=0;i<24;i++){const x=35+(i*187)%1210,y=85+(i*73)%540;g.fillStyle(0xffffff,.54).fillCircle(x,y,2+i%4);}
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(50);this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(51);
        this.text(438,41,'敲冰塊救救橡果',31,'#28576c').setDepth(51);this.levelText=this.text(675,43,'第一關',17,'#648595').setDepth(51);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(51);
        this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(51);
        this.panel(155,258,250,330,0xf9fdff,0xcde8f1,23).setDepth(42);this.text(155,132,'救援進度',23,'#28576c').setDepth(43);
        this.progressText=this.text(155,180,'第 1 / 5 關',31,'#28576c').setDepth(43);this.tapText=this.text(155,225,'敲擊 0　提示 0',16,'#648595').setDepth(43);
        this.feedback=this.text(155,289,'找出橡果下面的冰塊！',17,'#567989').setDepth(43);this.button(155,363,198,49,'亮出支撐冰塊',()=>this.showHint(),0xf0d783,'#5d552e').setDepth(43);
        this.button(155,425,198,46,'本關重來',()=>this.resetLevel(),0xdceff4,'#28576c').setDepth(43);this.text(155,480,'敲別塊也會碎喔！\n不扣分，慢慢觀察',16,'#648595').setDepth(43);
        this.text(660,692,'直接點冰塊敲碎｜← → 選冰塊、空白鍵敲擊｜依序讓橡果落到雪堆',16,'#4f7687').setDepth(51);
    }
    drawLevel(){
        this.blockViews.forEach(v=>v.destroy());this.blockViews.clear();this.acorn?.destroy();this.selectedId=null;this.hintId=null;this.hintLeft=0;
        const level=this.session.level;this.levelText.setText(level.name);this.progressText.setText(`第 ${this.session.levelIndex+1} / ${ICE_TAP_LEVELS.length} 關`);this.refreshStats();
        [...level.path,...level.decoys].forEach((block,index)=>{const view=this.drawIceBlock(block,index>=level.path.length);view.on('pointerdown',()=>this.tapBlock(block.id));this.blockViews.set(block.id,view);});
        const top=level.path[0];this.acorn=this.drawAcorn(top.x,top.y-67).setDepth(30);
    }
    drawIceBlock(block,decoy=false){
        const c=this.add.container(block.x,block.y).setAngle(block.tilt||0).setDepth(18),g=this.add.graphics(),w=block.w,h=57;
        const pts=[{x:-w/2,y:-h*.32},{x:-w*.36,y:-h/2},{x:w*.39,y:-h*.44},{x:w/2,y:-h*.05},{x:w*.4,y:h*.46},{x:-w*.42,y:h*.5},{x:-w/2,y:h*.12}];
        g.fillStyle(decoy?0xc8ebf2:0x99dbea,.98).fillPoints(pts,true);g.lineStyle(4,0xeaffff,.95).strokePoints(pts,true);g.fillStyle(0xffffff,.45).fillEllipse(-w*.13,-10,w*.38,12);
        c.add(g);c.setSize(w+12,82).setInteractive(new Phaser.Geom.Rectangle(-w/2-6,-41,w+12,82),Phaser.Geom.Rectangle.Contains);c.blockData=block;c.decoy=decoy;return c;
    }
    drawAcorn(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0xa7683f).fillEllipse(0,8,53,61);g.fillStyle(0x74472f).fillEllipse(0,-12,55,24);g.lineStyle(3,0x5c3d2e).lineBetween(0,-24,9,-39);
        g.fillStyle(0xffffff).fillCircle(-10,3,6).fillCircle(10,3,6);g.fillStyle(0x364954).fillCircle(-10,3,3).fillCircle(10,3,3);g.lineStyle(3,0x704237).beginPath().arc(0,11,11,.2,Math.PI-.2).strokePath();c.add(g);return c;
    }
    bindTapInput(){
        this.keyHandler=e=>{if(e.repeat)return;if(e.code==='ArrowLeft')this.selectRelative(-1);else if(e.code==='ArrowRight')this.selectRelative(1);else if(e.code==='Space'||e.code==='Enter'){if(this.selectedId)this.tapBlock(this.selectedId);}else if(e.code==='KeyH')this.showHint();else if(e.code==='KeyR')this.resetLevel();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);
    }
    selectableIds(){return [...this.blockViews.entries()].filter(([,v])=>v.active&&v.visible).sort((a,b)=>a[1].y-b[1].y||a[1].x-b[1].x).map(([id])=>id);}
    selectRelative(offset){
        if(this.mode!=='playing')return;const ids=this.selectableIds();if(!ids.length)return;const previous=this.selectedId;this.clearSelection();let i=ids.indexOf(previous);if(i<0)i=offset>0?-1:0;i=(i+offset+ids.length)%ids.length;this.selectedId=ids[i];this.blockViews.get(this.selectedId)?.setScale(1.1);this.feedback.setText('按空白鍵敲選到的冰塊！');
    }
    clearSelection(){if(this.selectedId)this.blockViews.get(this.selectedId)?.setScale(1);this.selectedId=null;}
    tapBlock(id){
        if(this.mode!=='playing'||this.falling)return;const view=this.blockViews.get(id);if(!view||!view.active)return;this.clearHint();this.clearSelection();const result=this.session.tap(id);this.refreshStats();
        if(result.result==='decoy'){this.shatter(view);this.feedback.setText('喀啦！冰塊碎了，再找找橡果下面。');this.tone('send');return;}
        if(result.result==='future'){this.crack(view);this.feedback.setText('這塊還在下面支撐著，先從橡果腳下開始！');this.tone('hint');return;}
        if(result.result!=='support')return;this.shatter(view);this.falling=true;this.mode='falling';this.tone('correct');
        const target=result.next?{x:result.next.x,y:result.next.y-67}:{x:650,y:561};
        this.tweens.add({targets:this.acorn,x:target.x,y:target.y,angle:result.next?(result.next.x-this.acorn.x)*.35:360,duration:590,ease:'Bounce.easeOut',onComplete:()=>{this.acorn.setAngle(0);this.falling=false;if(result.complete)this.time.delayedCall(350,()=>this.finishLevel());else{this.mode='playing';this.feedback.setText('落到下一層了！再找它腳下的支撐冰塊。');}}});
    }
    shatter(view){
        const x=view.x,y=view.y;view.disableInteractive();view.setVisible(false);for(let i=0;i<12;i++){const shard=this.add.triangle(x,y,0,-8,7,7,-7,7,i%2?0xb3e7ef:0xe9fbfd,.95).setDepth(25).setAngle(i*31);const a=i/12*Math.PI*2;this.tweens.add({targets:shard,x:x+Math.cos(a)*(45+i%3*17),y:y+Math.sin(a)*38+35,angle:180,alpha:0,duration:430,onComplete:()=>shard.destroy()});}
    }
    crack(view){
        this.tweens.add({targets:view,x:view.x-8,duration:45,yoyo:true,repeat:3});const g=this.add.graphics().setDepth(24);g.lineStyle(4,0x5fa5b9,.9).lineBetween(view.x-12,view.y-18,view.x,view.y).lineBetween(view.x,view.y,view.x-20,view.y+18).lineBetween(view.x,view.y,view.x+23,view.y+16);this.time.delayedCall(650,()=>g.destroy());
    }
    showHint(){if(this.mode!=='playing')return;this.clearHint();const id=this.session.hint(),view=this.blockViews.get(id);if(!view)return;this.hintId=id;this.hintLeft=2.6;view.setScale(1.13);this.feedback.setText('亮起來的冰塊正在支撐橡果！');this.tone('hint');this.refreshStats();}
    clearHint(){if(this.hintId){const view=this.blockViews.get(this.hintId);view?.setScale(1);if(view)view.alpha=1;}this.hintId=null;this.hintLeft=0;}
    refreshStats(){this.tapText.setText(`敲擊 ${this.session.taps}　提示 ${this.session.hints}`);}
    update(_time,delta){if(this.mode!=='playing'||!this.hintId)return;this.hintLeft-=Math.min(delta/1000,.05);const v=this.blockViews.get(this.hintId);if(v)v.alpha=.72+Math.sin(this.hintLeft*9)*.28;if(this.hintLeft<=0){if(v)v.alpha=1;this.clearHint();}}
    resetLevel(){if(!['playing','paused'].includes(this.mode))return;this.overlay?.destroy();this.overlay=null;this.session.load(this.session.levelIndex);this.mode='playing';this.falling=false;this.drawLevel();this.feedback.setText('重新堆好了，從橡果腳下開始！');}
    showIntro(){
        const o=this.makeOverlay('喀啦喀啦，救出橡果！','點冰塊就會碎裂，橡果會受到重力往下掉。\n觀察橡果現在站在哪一塊冰上，從它腳下依序敲。\n敲到其他冰塊也有碎裂效果，不扣分、不會失敗。');
        o.add(this.drawAcorn(520,418).setScale(.84));const sample=this.drawIceBlock({id:'demo',x:720,y:430,w:190},false).setScale(.82);sample.disableInteractive();o.add(sample);o.add(this.text(640,506,'完成五座冰塔，讓五顆橡果安全落到雪堆。',18,'#678493'));
        o.add(this.button(640,562,275,58,'開始敲冰塊！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));
    }
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.stopTones();const o=this.makeOverlay('休息一下，冰塔不會倒','直接點冰塊敲擊。\n也可以按左右方向鍵選冰塊，再按空白鍵敲。\n找不到時按「亮出支撐冰塊」。');o.add(this.button(640,405,270,55,'繼續敲冰塊',()=>this.resumeGame(),0x397fa0));o.add(this.button(500,498,220,51,'本關重來',()=>this.resetLevel(),0xf0d783,'#5d552e'));o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));}
    finishLevel(){
        if(this.mode==='finished')return;const last=this.session.levelIndex===ICE_TAP_LEVELS.length-1;this.mode='levelComplete';this.tone(last?'finish':'correct');const o=this.makeOverlay(last?'五顆橡果安全得救！':'橡果落到雪堆了！',last?`五座冰塔全部完成！\n這一關敲擊：${this.session.taps} 次　提示：${this.session.hints} 次`:`${this.session.level.name}完成！\n敲碎裝飾冰塊：${this.session.funBreaks} 塊\n先敲到下層冰塊：${this.session.wrong} 次`);
        o.add(this.text(640,397,'冰塊可以放心敲，不扣愛心，也不寫入正式存檔。',18,'#678493'));
        if(last){o.add(this.button(500,492,230,59,'再玩一次',()=>this.restart(),0x397fa0));o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));}
        else o.add(this.button(640,492,260,59,'前往下一座冰塔',()=>{this.session.load(this.session.levelIndex+1);o.destroy();this.overlay=null;this.mode='playing';this.drawLevel();this.feedback.setText('新的冰塔，看看橡果站在哪裡！');},0x397fa0));
    }
}
