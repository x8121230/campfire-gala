import AnimalSnackGame from './AnimalSnackGame.js';
import { SealRescueSession, SEAL_RESCUE_CONFIG } from '../data/SealRescueData.js';

export default class SealRescueGame extends AnimalSnackGame {
    constructor(){super('SealRescueGame');}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;
        this.session=new SealRescueSession();this.mode='intro';this.choiceViews=[];this.jumpState=null;
        this.hintLane=-1;this.hintLeft=0;this.bobTime=0;
        this.drawOcean();this.drawHud();this.homeFloe=this.drawFloe(700,584,190,86,false).setDepth(12);
        this.player=this.drawRescuer(700,535).setDepth(30);this.bindRescueInput();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};
        this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});
        this.prepareRound();
    }
    drawOcean(){
        const g=this.add.graphics();g.fillGradientStyle(0xa2d9ea,0xc8ebf3,0x5eb3cc,0x80c8db,1).fillRect(0,0,1280,720);
        g.fillStyle(0xd6eff5,.7).fillTriangle(60,230,255,52,430,230).fillTriangle(820,230,1035,36,1240,230);
        g.fillStyle(0xffffff,.92).fillTriangle(188,113,255,52,318,113).fillTriangle(960,103,1035,36,1108,103);
        for(let i=0;i<17;i++){const x=25+(i*229)%1240,y=110+(i*91)%545;g.lineStyle(3,0xd9f7fb,.45).beginPath().arc(x,y,28+i%4*8,0,Math.PI).strokePath();}
        this.add.ellipse(700,650,930,170,0x3d9fbd,.23);
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(50);
        this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(51);
        this.text(430,41,'小海豹冰河救援',31,'#28576c').setDepth(51);
        this.roundText=this.text(665,43,'選擇下一塊浮冰',17,'#648595').setDepth(51);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(51);
        this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(51);
        this.panel(157,266,258,330,0xf9fdff,0xcde8f1,23);
        this.text(157,134,'救援任務',24,'#28576c');this.progressText=this.text(157,183,'0 / 5',37,'#28576c');
        this.add.rectangle(65,222,184,9,0xdbeef3).setOrigin(0,.5);this.progressFill=this.add.rectangle(65,222,1,9,0x54b9d1).setOrigin(0,.5);
        this.crossingText=this.text(157,260,'跳躍 0　落水 0',16,'#648595');
        this.feedback=this.text(157,315,'找找看小海豹在哪裡！',17,'#567989');
        this.button(157,388,198,48,'小鯨魚提示',()=>this.showHint(),0xf0d783,'#5d552e');
        this.text(157,452,'白色浮冰可以站\n有裂痕也不用害怕',16,'#648595');
        this.text(700,691,'直接點浮冰｜鍵盤 1／2／3 選左、中、右｜落水時鯨魚會接住你',16,'#eafaff').setDepth(51);
    }
    drawFloe(x,y,w,h,cracked){
        const c=this.add.container(x,y),g=this.add.graphics();
        const points=[{x:-w*.48,y:-h*.05},{x:-w*.32,y:-h*.43},{x:w*.16,y:-h*.5},{x:w*.47,y:-h*.12},{x:w*.38,y:h*.35},{x:-w*.16,y:h*.48},{x:-w*.46,y:h*.22}];
        g.fillStyle(0xeaf9fc).fillPoints(points,true);g.lineStyle(4,0xb6e1ea).strokePoints(points,true);
        g.fillStyle(0xffffff,.62).fillEllipse(-w*.1,-h*.16,w*.46,h*.2);
        if(cracked){g.lineStyle(4,0x65a9bd,.9).lineBetween(0,-h*.34,-8,0).lineBetween(-8,0,-34,h*.21).lineBetween(-8,0,24,h*.25);}
        c.add(g);c.cracked=cracked;return c;
    }
    drawRescuer(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();
        g.fillStyle(0xf5f1e7).fillEllipse(0,8,60,77).fillCircle(0,-27,31);
        g.fillStyle(0xf5f1e7).fillTriangle(-23,-47,-37,-70,-8,-52).fillTriangle(23,-47,37,-70,8,-52);
        g.fillStyle(0xe6b8a8).fillTriangle(-25,-52,-34,-65,-15,-55).fillTriangle(25,-52,34,-65,15,-55);
        g.fillStyle(0x394f5c).fillCircle(-11,-31,4).fillCircle(11,-31,4);g.fillCircle(0,-20,5);
        g.fillStyle(0xe86767).fillRoundedRect(-37,-3,74,15,7);g.fillTriangle(22,5,48,26,28,1);
        g.fillStyle(0x70c9d8).fillEllipse(-17,44,28,11).fillEllipse(17,44,28,11);c.add(g);return c;
    }
    drawSeal(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0xc7dce3).fillEllipse(0,12,80,48).fillCircle(20,-8,28);
        g.fillStyle(0xf7fdff).fillEllipse(25,-3,33,22);g.fillStyle(0x334d5b).fillCircle(13,-14,4).fillCircle(31,-14,4).fillCircle(26,-4,5);
        g.lineStyle(2,0x6d8a97,.8).lineBetween(35,-3,55,-8).lineBetween(35,1,56,3);g.fillStyle(0xc7dce3).fillTriangle(-36,8,-59,-8,-48,21);c.add(g);return c;
    }
    drawWhale(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0x4b9fbd).fillEllipse(0,0,150,72).fillCircle(55,-5,38);
        g.fillStyle(0x86d2df).fillEllipse(12,15,97,32);g.fillStyle(0xffffff).fillCircle(64,-15,8);g.fillStyle(0x294c5d).fillCircle(66,-15,4);
        g.fillStyle(0x4b9fbd).fillTriangle(-65,-5,-102,-36,-88,8).fillTriangle(-65,5,-102,36,-88,-8);c.add(g);return c;
    }
    prepareRound(){
        if(this.session.finished)return;this.clearChoices();const round=this.session.nextRound();this.mode=this.mode==='intro'?'intro':'playing';
        round.forEach(choice=>{
            const x=SEAL_RESCUE_CONFIG.choiceX[choice.lane],y=SEAL_RESCUE_CONFIG.choiceY;
            const floe=this.drawFloe(x,y,174,78,choice.cracked).setDepth(15).setSize(186,108).setInteractive(new Phaser.Geom.Ellipse(0,0,186,108),Phaser.Geom.Ellipse.Contains);
            const seal=choice.seal?this.drawSeal(x,y-47).setDepth(18):null;floe.on('pointerdown',()=>this.choose(choice.lane));
            this.choiceViews.push({choice,floe,seal,baseY:y});
        });this.roundText.setText(`第 ${this.session.round} 次渡河`);this.feedback.setText(this.session.round<=2?'小海豹在等你，點牠的浮冰！':'選一塊浮冰跳過去～');
    }
    clearChoices(){this.choiceViews.forEach(v=>{v.floe.destroy();v.seal?.destroy();});this.choiceViews=[];this.clearHint();}
    bindRescueInput(){
        this.keyHandler=e=>{if(e.repeat)return;if(/^Digit[123]$/.test(e.code))this.choose(Number(e.code.slice(-1))-1);else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();else if(e.code==='KeyH')this.showHint();};
        this.input.keyboard?.on('keydown',this.keyHandler);
    }
    choose(lane){
        if(this.mode!=='playing'||this.jumpState)return;const view=this.choiceViews.find(v=>v.choice.lane===lane);if(!view)return;
        const outcome=this.session.choose(lane);this.mode='jumping';this.clearHint();this.tone('send');
        this.jumpState={view,outcome,t:0,startX:this.player.x,startY:this.player.y};this.feedback.setText('跳～到下一塊浮冰！');
    }
    showHint(){
        if(this.mode!=='playing')return;this.clearHint();const lane=this.session.hint(),view=this.choiceViews.find(v=>v.choice.lane===lane);if(!view)return;
        this.hintLane=lane;this.hintLeft=2.6;view.floe.setScale(1.12);view.seal?.setScale(1.12);
        this.feedback.setText(view.choice.seal?'小鯨魚說：海豹在這一塊！':'小鯨魚說：這塊浮冰很安全！');this.tone('hint');
    }
    clearHint(){if(this.hintLane>=0){const v=this.choiceViews.find(q=>q.choice.lane===this.hintLane);v?.floe.setScale(1);v?.seal?.setScale(1);}this.hintLane=-1;this.hintLeft=0;}
    update(_time,delta){
        if(!['playing','jumping'].includes(this.mode))return;const dt=Math.max(0,Math.min(delta/1000,.05));this.bobTime+=dt;
        this.choiceViews.forEach((v,i)=>{const bob=Math.sin(this.bobTime*1.25+i)*6;v.floe.y=v.baseY+bob;if(v.seal)v.seal.y=v.baseY-47+bob;});
        if(this.hintLeft>0){this.hintLeft-=dt;if(this.hintLeft<=0)this.clearHint();}
        if(!this.jumpState)return;const j=this.jumpState;j.t=Math.min(1,j.t+dt/SEAL_RESCUE_CONFIG.jumpSeconds);const ease=j.t*j.t*(3-2*j.t);
        this.player.setPosition(Phaser.Math.Linear(j.startX,j.view.floe.x,ease),Phaser.Math.Linear(j.startY,j.view.floe.y-48,ease)-Math.sin(j.t*Math.PI)*95);
        this.player.angle=Math.sin(j.t*Math.PI)*10*(j.view.floe.x<j.startX?-1:1);
        if(j.t>=1)this.resolveChoice(j);
    }
    resolveChoice(j){
        this.jumpState=null;const out=j.outcome;
        if(out.result==='splash'){this.splashRescue(j.view.floe.x);return;}
        if(out.result==='rescue'){j.view.seal?.destroy();j.view.seal=null;this.tone('correct');this.sparkle(j.view.floe.x,j.view.floe.y-35);this.feedback.setText('找到一隻小海豹！一起回冰晶小屋。');}
        else this.feedback.setText('安全抵達！再看看下一批浮冰。');
        this.refreshProgress();
        if(out.finished){this.mode='finishing';this.time.delayedCall(650,()=>this.finishRescue());}
        else{this.mode='waiting';this.time.delayedCall(620,()=>{this.player.setPosition(700,535).setAngle(0);this.prepareRound();});}
    }
    splashRescue(x){
        this.player.setVisible(false);this.tone('hint');for(let i=0;i<8;i++){const d=this.add.circle(x,390,5+i%3,0xdff8fc,.85);this.tweens.add({targets:d,x:x-65+i*18,y:340-Math.abs(i-4)*6,alpha:0,duration:520,onComplete:()=>d.destroy()});}
        const whale=this.drawWhale(x,432).setDepth(28).setScale(.15);this.tweens.add({targets:whale,scale:.72,y:405,duration:330,yoyo:true,hold:220,onComplete:()=>whale.destroy()});
        this.feedback.setText('噗通！小鯨魚接住你，送回安全浮冰。');this.refreshProgress();this.mode='waiting';
        this.time.delayedCall(850,()=>{this.player.setVisible(true).setPosition(700,535).setAngle(0);this.prepareRound();});
    }
    refreshProgress(){this.progressText.setText(`${this.session.seals} / ${SEAL_RESCUE_CONFIG.sealsToFinish}`);this.progressFill.width=Math.max(1,184*this.session.seals/SEAL_RESCUE_CONFIG.sealsToFinish);this.crossingText.setText(`跳躍 ${this.session.crossings}　落水 ${this.session.splashes}`);}
    showIntro(){
        const o=this.makeOverlay('小海豹在浮冰上等你！','點選前方的浮冰，小兔子會自動跳過去。\n看到小海豹就跳到牠那邊；有裂痕的浮冰可能會碎開。\n掉進水裡也沒關係，小鯨魚會把你送回安全位置。');
        o.add(this.drawRescuer(510,422).setScale(.78));o.add(this.drawSeal(744,425).setScale(.82));o.add(this.text(640,492,'找到 5 隻小海豹就完成救援，不限時間、不扣愛心。',18,'#678493'));
        o.add(this.button(640,549,275,58,'開始冰河救援！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));
    }
    pauseGame(){
        if(this.mode!=='playing')return;this.mode='paused';this.stopTones();
        const o=this.makeOverlay('休息一下，浮冰會等你','直接點左、中、右任一塊浮冰。\n鍵盤 1／2／3 也能選擇。\n「小鯨魚提示」會指出海豹或安全的浮冰。');
        o.add(this.button(640,405,270,55,'繼續救援',()=>this.resumeGame(),0x397fa0));o.add(this.button(500,498,220,51,'重新開始',()=>this.restart(),0xf0d783,'#5d552e'));o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));
    }
    finishRescue(){
        if(this.mode==='finished')return;this.mode='finished';this.clearChoices();this.player.setVisible(true).setPosition(700,535).setAngle(0);this.tone('finish');
        const s=this.session,o=this.makeOverlay('五隻小海豹都得救了！',`冰河救援完成！\n一共跳躍：${s.crossings} 次　小鯨魚幫忙：${s.splashes} 次\n使用提示：${s.hints} 次`);
        o.add(this.text(640,397,'試玩紀錄不寫入正式存檔，也不消耗愛心。',18,'#678493'));o.add(this.button(500,492,230,59,'再救一次',()=>this.restart(),0x397fa0));o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));
    }
}
