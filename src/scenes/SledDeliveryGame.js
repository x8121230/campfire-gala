import AnimalSnackGame from './AnimalSnackGame.js';
import { SledDeliverySession, SLED_CONFIG, SLED_SPEEDS, DELIVERY_HOUSES } from '../data/SledDeliveryData.js';

export default class SledDeliveryGame extends AnimalSnackGame {
    constructor(){super('SledDeliveryGame');}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;
        this.session=new SledDeliverySession();this.mode='intro';this.elapsed=0;this.house=null;this.gift=null;this.resetDelay=0;
        this.scenery=[];this.bumpTimer=3.2;this.deliveryPulse=0;
        this.drawRoute();this.drawHud();this.sled=this.drawSled(245,522).setDepth(30);this.cargo=this.drawCargo(204,463).setDepth(31);
        this.bindDeliveryInput();this.spawnHouse();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});
    }
    drawRoute(){
        const g=this.add.graphics();g.fillGradientStyle(0x9ed3e5,0xccebf3,0xebf8fa,0xf8fdff,1).fillRect(0,0,1280,720);
        g.fillStyle(0xb8dce7,.75).fillTriangle(520,260,735,43,940,260).fillTriangle(800,260,1025,75,1230,260);
        g.fillStyle(0xffffff,.92).fillTriangle(662,117,735,43,808,117).fillTriangle(950,137,1025,75,1097,137);
        g.fillStyle(0xf9fdff).fillRect(0,472,1280,248);g.lineStyle(4,0xc9e6ed).beginPath().moveTo(0,572).quadraticBezierTo(310,525,610,570).quadraticBezierTo(910,620,1280,553).strokePath();
        this.zone=this.add.rectangle(600,442,150,286,0x7be0cf,.13).setStrokeStyle(4,0x5dc9b7,.9).setDepth(10);
        this.zoneLabel=this.text(600,310,'配送區',20,'#317e77').setDepth(11);
        for(let i=0;i<10;i++){const pine=this.drawPine(90+i*145,445-(i%3)*14,.55+(i%2)*.12).setAlpha(.62);this.scenery.push(pine);}
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(50);this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(51);
        this.text(438,41,'北極熊雪橇快遞',31,'#28576c').setDepth(51);this.houseText=this.text(682,43,'前往企鵝郵局',17,'#648595').setDepth(51);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(51);
        this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(51);
        this.panel(146,241,236,270,0xf9fdff,0xcde8f1,23).setDepth(45);this.text(146,133,'快遞任務',23,'#28576c').setDepth(46);this.progressText=this.text(146,180,'0 / 5',35,'#28576c').setDepth(46);
        this.add.rectangle(62,218,168,9,0xdbeef3).setOrigin(0,.5).setDepth(46);this.progressFill=this.add.rectangle(62,218,1,9,0x54b9d1).setOrigin(0,.5).setDepth(47);
        this.statText=this.text(146,260,'嘗試 0　接住 0',16,'#648595').setDepth(46);this.feedback=this.text(640,103,'調整速度，等雪屋進入配送區！',20,'#416b7d').setDepth(51);
        this.panel(1097,213,296,214,0xf9fdff,0xcde8f1,23).setDepth(45);this.text(1097,133,'雪橇速度',22,'#28576c').setDepth(46);this.speedButtons={};
        this.speedButtons.slow=this.button(1003,195,82,48,'慢',()=>this.setSpeed('slow'),0x86bfd0).setDepth(46);
        this.speedButtons.steady=this.button(1097,195,82,48,'中',()=>this.setSpeed('steady'),0x397fa0).setDepth(46);
        this.speedButtons.fast=this.button(1191,195,82,48,'快',()=>this.setSpeed('fast'),0x86bfd0).setDepth(46);
        this.speedText=this.text(1097,253,'現在：穩穩走',16,'#648595').setDepth(46);
        this.deliverButton=this.button(1097,335,238,78,'送禮物！',()=>this.deliver(),0xe98c68,'#fffdf4').setDepth(55);
        this.text(640,691,'鍵盤 1／2／3 切換速度｜空白鍵送禮物｜送早或錯過都可以再試',16,'#4f7687').setDepth(51);
    }
    drawPine(x,y,s=1){const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0x785c47).fillRect(-7*s,15*s,14*s,35*s);g.fillStyle(0x3f8f98).fillTriangle(0,-52*s,37*s,16*s,-37*s,16*s).fillTriangle(0,-27*s,48*s,39*s,-48*s,39*s);g.fillStyle(0xffffff,.9).fillTriangle(0,-52*s,17*s,-20*s,-17*s,-20*s);c.add(g);return c;}
    drawSled(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();g.lineStyle(6,0x376c82).beginPath().moveTo(-93,45).quadraticBezierTo(-45,66,12,48).lineTo(96,48).strokePath();g.lineBetween(-65,25,-55,50).lineBetween(52,25,62,48);
        g.fillStyle(0xbb6b4f).fillRoundedRect(-88,-3,172,37,13);g.fillStyle(0xd79265).fillRoundedRect(-72,5,144,17,7);
        g.fillStyle(0xf3f0e5).fillEllipse(42,-45,78,94).fillCircle(44,-91,41);g.fillStyle(0xf3f0e5).fillCircle(15,-119,16).fillCircle(72,-119,16);
        g.fillStyle(0xffffff).fillEllipse(45,-80,58,46);g.fillStyle(0x344c59).fillCircle(30,-95,4).fillCircle(58,-95,4).fillCircle(45,-80,7);
        g.fillStyle(0x59a5be).fillRoundedRect(4,-60,83,16,7);g.fillTriangle(65,-52,91,-28,73,-58);c.add(g);return c;
    }
    drawCargo(x,y,count=5){
        const c=this.add.container(x,y);for(let i=0;i<count;i++){
            const g=this.add.graphics(),col=[0xe67f70,0x65afc4,0xf0bf62,0x8cb578,0xa582bc][i];
            const ox=(i%3)*34-34,oy=-Math.floor(i/3)*35;
            g.fillStyle(col).fillRoundedRect(ox-15,oy-14,30,28,5);g.fillStyle(0xffdf83).fillRect(ox-3,oy-14,6,28).fillRect(ox-15,oy-2,30,5);
            c.add(g);
        }return c;
    }
    drawHouse(x,y,info){
        const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(info.color).fillRoundedRect(-67,-72,134,119,16);g.fillStyle(0xf7fdff).fillTriangle(-82,-70,0,-132,82,-70);g.fillStyle(0xffffff,.85).fillTriangle(-82,-70,0,-132,0,-111);
        g.fillStyle(0x5a7180).fillRoundedRect(-22,-9,44,56,11);g.fillStyle(0xffdd82).fillRoundedRect(-53,-45,32,29,8).fillRoundedRect(22,-45,32,29,8);c.add(g);c.label=this.text(0,74,info.name,18,'#315b6e');c.add(c.label);return c;
    }
    spawnHouse(){if(this.session.finished)return;this.house?.view.destroy();const info=DELIVERY_HOUSES[this.session.delivered];const view=this.drawHouse(SLED_CONFIG.houseStartX,493,info).setDepth(22);this.house={view,info};this.houseText.setText(`前往${info.name}`);this.feedback.setText(this.session.delivered===0?'第一站慢慢來，等雪屋進入綠色配送區！':`下一站：${info.name}`);}
    bindDeliveryInput(){this.keyHandler=e=>{if(e.repeat)return;if(e.code==='Digit1')this.setSpeed('slow');else if(e.code==='Digit2')this.setSpeed('steady');else if(e.code==='Digit3')this.setSpeed('fast');else if(e.code==='Space'||e.code==='Enter')this.deliver();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);}
    setSpeed(mode){if(this.mode!=='playing'||!this.session.setSpeed(mode))return;Object.entries(this.speedButtons).forEach(([key,b])=>b.setScale(key===mode?1.12:1));this.speedText.setText(`現在：${SLED_SPEEDS[mode].label}`);this.feedback.setText(mode==='slow'?'慢慢靠近，最好瞄準。':mode==='fast'?'速度很快，禮物會晃喔！':'穩穩前進，準備配送！');this.tone('send');}
    deliver(){
        if(this.mode!=='playing'||this.gift||!this.house)return;const result=this.session.deliverAt(this.house.view.x);this.refreshProgress();
        if(result.result==='early'){this.feedback.setText('還太遠～等雪屋進入綠色配送區再送！');this.boomerangGift();this.tone('hint');return;}
        if(result.result==='late'){this.feedback.setText('已經經過配送區了，下一圈再試！');this.boomerangGift();this.tone('hint');return;}
        this.mode='delivering';this.feedback.setText(`送給${this.house.info.name}，配送成功！`);this.tone('correct');
        const gift=this.makeGift(this.cargo.x+30,this.cargo.y-25,1).setDepth(40);this.gift=gift;
        this.tweens.add({targets:gift,x:this.house.view.x,y:this.house.view.y-105,angle:360,duration:520,ease:'Sine.easeInOut',onComplete:()=>{this.sparkle(this.house.view.x,this.house.view.y-95);gift.destroy();this.gift=null;this.cargo.destroy();this.cargo=this.drawCargo(204,463,SLED_CONFIG.deliveriesToFinish-this.session.delivered).setDepth(31);this.refreshProgress();if(result.finished){this.time.delayedCall(450,()=>this.finishDelivery());}else{this.mode='waiting';this.time.delayedCall(700,()=>{this.spawnHouse();this.mode='playing';});}}});
    }
    makeGift(x,y,scale=1){const c=this.add.container(x,y).setScale(scale),g=this.add.graphics();g.fillStyle(0xe67f70).fillRoundedRect(-20,-18,40,36,6);g.fillStyle(0xffdf83).fillRect(-4,-18,8,36).fillRect(-20,-3,40,7);g.fillTriangle(-3,-18,-18,-31,0,-25).fillTriangle(3,-18,18,-31,0,-25);c.add(g);return c;}
    boomerangGift(){if(this.gift)return;const gift=this.makeGift(this.cargo.x+20,this.cargo.y-20,.85).setDepth(40);this.gift=gift;this.tweens.add({targets:gift,x:470,y:360,duration:230,yoyo:true,onComplete:()=>{gift.destroy();this.gift=null;}});}
    refreshProgress(){this.progressText.setText(`${this.session.delivered} / ${SLED_CONFIG.deliveriesToFinish}`);this.progressFill.width=Math.max(1,168*this.session.delivered/SLED_CONFIG.deliveriesToFinish);this.statText.setText(`嘗試 ${this.session.attempts}　接住 ${this.session.cargoCatches}`);}
    triggerBump(){if(this.session.speed!=='fast'||this.mode!=='playing')return;this.session.catchCargo();this.refreshProgress();this.feedback.setText('禮物跳起來了！北極熊穩穩接住，沒有掉喔。');this.tone('hint');this.tweens.add({targets:this.cargo,y:this.cargo.y-42,angle:10,duration:210,yoyo:true,onComplete:()=>this.cargo.setAngle(0)});}
    update(_time,delta){
        if(this.mode!=='playing')return;const dt=Math.max(0,Math.min(delta/1000,.05));this.elapsed+=dt;const speed=SLED_SPEEDS[this.session.speed].value;
        if(this.house){this.house.view.x-=speed*dt;if(this.house.view.x<SLED_CONFIG.houseMissX){this.session.missHouse();this.refreshProgress();this.feedback.setText('雪屋繞到前面去了，準備再試一次！');this.house.view.x=SLED_CONFIG.houseStartX;this.tone('hint');}}
        this.scenery.forEach((p,i)=>{p.x-=speed*dt*.28;if(p.x<-70)p.x=1320;p.y+=Math.sin(this.elapsed*1.2+i)*dt*2;});
        this.deliveryPulse+=dt;const glow=.12+(Math.sin(this.deliveryPulse*4)+1)*.055;this.zone.setFillStyle(0x7be0cf,glow);
        const wobble=this.session.speed==='fast'?Math.sin(this.elapsed*10)*5:this.session.speed==='steady'?Math.sin(this.elapsed*6)*2:0;this.cargo.angle=wobble;this.sled.y=522+Math.sin(this.elapsed*2.2)*2;
        this.bumpTimer-=dt;if(this.bumpTimer<=0){this.triggerBump();this.bumpTimer=Phaser.Math.FloatBetween(3.6,5.2);}
    }
    showIntro(){
        const o=this.makeOverlay('北極熊快遞出發！','用慢、中、快三段速度控制雪橇。\n等雪屋進入綠色配送區，再按「送禮物」。\n送太早或錯過都沒關係，雪屋會繞回來，禮物也不會遺失。');
        o.add(this.drawSled(520,448).setScale(.66));o.add(this.drawHouse(756,455,DELIVERY_HOUSES[0]).setScale(.62));o.add(this.text(640,511,'把五份禮物送到五間雪屋，不限時間、不扣愛心。',18,'#678493'));
        o.add(this.button(640,566,275,58,'開始送快遞！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();this.setSpeed('steady');},0x397fa0));
    }
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.stopTones();const o=this.makeOverlay('休息一下，雪橇先停好','按 1／2／3 或畫面按鈕切換慢、中、快速。\n雪屋進入綠色配送區時，按空白鍵或「送禮物」。\n送早、送晚都能再試，禮物不會消失。');o.add(this.button(640,405,270,55,'繼續配送',()=>this.resumeGame(),0x397fa0));o.add(this.button(500,498,220,51,'重新開始',()=>this.restart(),0xf0d783,'#5d552e'));o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));}
    finishDelivery(){
        if(this.mode==='finished')return;this.mode='finished';this.house?.view.destroy();this.house=null;this.tone('finish');const s=this.session,o=this.makeOverlay('五份禮物全部送達！',`北極熊快遞完成今天的冰原路線！\n配送嘗試：${s.attempts} 次　速度切換：${s.speedChanges} 次\n接住跳起的禮物：${s.cargoCatches} 次`);
        o.add(this.text(640,397,'試玩紀錄不寫入正式存檔，也不消耗愛心。',18,'#678493'));o.add(this.button(500,492,230,59,'再送一次',()=>this.restart(),0x397fa0));o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));
    }
}
