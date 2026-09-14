import AnimalSnackGame from './AnimalSnackGame.js';
import {LavaStepSession,LAVA_STEP_LEVELS,CoolingSession,COOLING_LEVELS,LavaPipeSession,PIPE_LEVELS,VolcanoEchoSession,ECHO_LEVELS,ECHO_SYMBOLS,LavaBridgeSession,BRIDGE_LEVELS} from '../data/VolcanoSeriesData.js';

const THEMES={
    LavaStepGame:['熔岩踏石大冒險','看亮光・依序踏石'], CoolingWorkshopGame:['火山冷卻工坊','數一數・剛好降溫'],
    LavaPipeGame:['熔岩水管接接樂','轉一轉・接通水路'], VolcanoEchoGame:['火山洞穴回聲','看順序・跟著點'],
    LavaBridgeGame:['熔岩河搭橋隊','選長度・剛好搭橋']
};

class VolcanoMiniBase extends AnimalSnackGame {
    constructor(key){super(key);this.gameKey=key;}
    create(){this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;this.mode='intro';this.items=[];this.drawVolcano();this.drawCommonHud();this.setupGame();this.showIntro();this.bindCommon();}
    drawVolcano(){const g=this.add.graphics();g.fillGradientStyle(0x3c2347,0x592a38,0xd85a2c,0x381f35,1).fillRect(0,0,1280,720);g.fillStyle(0x2e2433).fillTriangle(0,420,270,95,535,420).fillTriangle(710,420,1005,70,1280,420);g.fillStyle(0xf06a32,.88).fillTriangle(202,178,270,95,337,178).fillTriangle(929,160,1005,70,1080,160);g.fillStyle(0x4a2837).fillRect(0,420,1280,300);g.fillStyle(0xe54d27,.95).fillRoundedRect(275,560,760,105,48);g.fillStyle(0xffa13d,.7).fillRoundedRect(305,584,700,47,23);for(let i=0;i<30;i++)g.fillStyle(i%3?0xffb14e:0xffe07a,.45).fillCircle(35+(i*157)%1210,90+(i*83)%520,2+i%5);}
    drawCommonHud(){const [title,sub]=THEMES[this.gameKey];this.panel(640,43,1248,66,0xfff3dc,0xf2b35f,19).setDepth(60);this.button(102,43,154,43,'← 火山地圖',()=>this.leave(),0x8f4230).setDepth(61);this.text(424,40,title,30,'#6c3028').setDepth(61);this.text(680,44,sub,17,'#9a5b3e').setDepth(61);this.soundButton=this.button(955,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xf5d7a7,'#6c3028').setDepth(61);this.button(1106,43,150,43,'暫停 / 說明',()=>this.pauseGame(),0xf5d7a7,'#6c3028').setDepth(61);this.feedback=this.text(640,110,'準備開始！',20,'#fff0c9').setDepth(61);}
    clearItems(){this.items.forEach(x=>{this.tweens.killTweensOf(x);x.destroy();});this.items=[];}
    addItem(x){this.items.push(x);return x;}
    bindCommon(){this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});}
    showIntro(){const [title]=THEMES[this.gameKey],o=this.makeOverlay(`${title}開始！`,this.instructions);o.add(this.text(640,410,'沒有倒數、不扣愛心，慢慢試就會成功。',19,'#7f5a43'));o.add(this.button(640,505,275,58,'開始玩！',()=>{o.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();this.onStart?.();},0xb95736));}
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.tweens.pauseAll();this.stopTones();const o=this.makeOverlay('火山暫停休息',this.instructions);o.add(this.button(640,420,260,55,'繼續玩',()=>this.resumeGame(),0xb95736));o.add(this.button(640,500,260,51,'返回火山地圖',()=>this.leave(),0xf0cf8d,'#6c3028'));}
    resumeGame(){if(this.mode!=='paused')return;this.overlay?.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}
    completeLevel(session,total,next){this.mode='levelComplete';this.tone('finish');const last=session.levelIndex===total-1,o=this.makeOverlay(last?'火山任務全部完成！':'這一關完成！',last?'五位火山朋友一起為你歡呼！':'做得很好，下一個地方也需要你。');if(last){o.add(this.button(500,490,225,58,'再玩一次',()=>this.restart(),0xb95736));o.add(this.button(780,490,225,58,'返回火山地圖',()=>this.leave(),0xf0cf8d,'#6c3028'));}else o.add(this.button(640,490,270,58,'前往下一關',()=>{o.destroy();this.overlay=null;session.advance();this.mode='playing';next();},0xb95736));}
    leave(){this.tweens.resumeAll();const target=this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub';this.scene.start(target);}
}

export class LavaStepGame extends VolcanoMiniBase {
    constructor(){super('LavaStepGame');}
    setupGame(){this.session=new LavaStepSession();this.instructions='觀察金色光圈亮在哪塊踏石，再依序點過去。\n點錯只會變暖並提示，不會掉進岩漿。';this.drawLevel();}
    drawLevel(){this.clearItems();const n=this.session.level.order.length;this.levelText=this.addItem(this.text(640,155,`${this.session.level.name}｜第 ${this.session.levelIndex+1}/${LAVA_STEP_LEVELS.length} 關`,23,'#ffe7b0'));for(let i=0;i<n;i++){const x=360+i*(570/Math.max(1,n-1)),y=390+(i%2?55:-35);const c=this.add.container(x,y).setDepth(25),g=this.add.graphics();g.fillStyle(0x4b4550).fillEllipse(0,0,105,70);g.lineStyle(5,0xffb64d,.25).strokeEllipse(0,0,112,77);c.add([g,this.text(0,0,String(i+1),25,'#fff0c9')]).setSize(120,90).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.tapStone(i));this.addItem(c);}this.hint=this.addItem(this.add.circle(0,0,62,0xffd15b,.24).setDepth(22));this.refreshHint();this.stat=this.addItem(this.text(640,660,'',17,'#ffdca2'));this.refresh();}
    refreshHint(){const idx=this.session.level.order[this.session.step];const c=this.items.find(x=>x.type==='Container'&&x.list?.length===2&&x.list[1]?.text===String(idx+1));if(c)this.hint.setPosition(c.x,c.y);}
    tapStone(i){if(this.mode!=='playing')return;const r=this.session.tap(i);this.refresh();if(r==='warm'){this.feedback.setText('這塊還太熱，看看金色光圈在哪裡～');this.tone('hint');return;}this.tone('correct');if(r==='complete'){this.feedback.setText('安全走過岩漿河！');this.time.delayedCall(350,()=>this.completeLevel(this.session,LAVA_STEP_LEVELS.length,()=>this.drawLevel()));}else{this.feedback.setText('踏對了！找下一個亮光。');this.refreshHint();}}
    refresh(){this.stat?.setText(`進度 ${this.session.step}/${this.session.level.order.length}　溫暖提示 ${this.session.misses} 次`);}
}

export class CoolingWorkshopGame extends VolcanoMiniBase {
    constructor(){super('CoolingWorkshopGame');}
    setupGame(){this.session=new CoolingSession();this.instructions='看左邊火山爐需要幾顆冰晶，再點 1、2、3 顆冰晶箱。\n合計數量剛剛好，火山就會安全降溫；太多也不會扣分。';this.busy=false;this.drawLevel();this.keyHandler=e=>{if(e.repeat)return;if(/^Digit[123]$/.test(e.code))this.add(Number(e.code.slice(-1)));else if(e.code==='KeyH')this.showCoolingHint();else if(e.code==='KeyZ'||e.code==='KeyU')this.undoCrystal();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);}
    drawLevel(){
        this.clearItems();this.busy=false;const level=this.session.level;
        this.addItem(this.text(640,145,`${level.name}｜第 ${this.session.levelIndex+1}/${COOLING_LEVELS.length} 關`,24,'#ffe7b0'));
        this.addItem(this.panel(240,378,290,430,0xffeed5,0xe2a85d,26).setDepth(18));
        this.addItem(this.text(240,205,'火山溫度爐',24,'#6c3028').setDepth(19));
        this.furnace=this.addItem(this.add.graphics().setDepth(20));this.drawFurnace();
        this.targetText=this.addItem(this.text(240,448,`需要 ${level.target} 顆`,30,'#7a352b').setDepth(21));
        this.remainingText=this.addItem(this.text(240,500,'',19,'#9a5b3e').setDepth(21));
        this.addItem(this.text(240,559,level.guide,16,'#9a6b4a').setDepth(21));

        this.addItem(this.panel(748,335,690,305,0x4b2c3b,0xbc7049,28).setDepth(18));
        this.addItem(this.text(748,210,'選一箱冰晶投入',25,'#ffe7b0').setDepth(21));
        this.crystalButtons=[];
        [1,2,3].forEach((value,index)=>{
            const enabled=level.allowed.includes(value),x=520+index*228;
            const c=this.add.container(x,335).setDepth(25),base=this.add.graphics();
            base.fillStyle(enabled?0x4c9fc2:0x625566,enabled?1:.65).fillRoundedRect(-88,-78,176,156,24);
            base.lineStyle(4,enabled?0xb8efff:0x817282,1).strokeRoundedRect(-88,-78,176,156,24);
            for(let n=0;n<value;n++){const ox=(n-(value-1)/2)*42;this.drawCrystal(base,ox,-12,enabled?0xc8f5ff:0x918995);}
            const label=this.text(0,50,`${value} 顆`,24,enabled?'#ffffff':'#bdb1bc');
            c.add([base,label]).setSize(190,170);if(enabled)c.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.add(value));
            this.crystalButtons[value]=c;this.addItem(c);
        });
        this.gauge=this.addItem(this.add.graphics().setDepth(20));
        this.stat=this.addItem(this.text(748,458,'',20,'#ffe7b0').setDepth(21));
        this.addItem(this.button(625,545,215,51,'↶ 拿回上一份',()=>this.undoCrystal(),0xf0cf8d,'#6c3028').setDepth(25));
        this.addItem(this.button(870,545,215,51,'🐲 小火龍提示',()=>this.showCoolingHint(),0x76b9cc,'#244e61').setDepth(25));
        this.addItem(this.text(748,618,'點冰晶箱｜鍵盤 1・2・3｜H 提示｜Z 拿回',16,'#ffdca2').setDepth(21));
        this.drawGauge();
    }
    drawCrystal(g,x,y,color=0xc8f5ff){g.fillStyle(color,1).fillTriangle(x,y-28,x+20,y,x,y+30).fillTriangle(x,y-28,x-20,y,x,y+30);g.lineStyle(2,0xffffff,.75).lineBetween(x,y-23,x,y+22);}
    drawFurnace(){const g=this.furnace,level=this.session.level;g.clear();g.fillStyle(0x5a3a3e).fillRoundedRect(145,248,190,155,34);g.lineStyle(7,0x8a5a49).strokeRoundedRect(145,248,190,155,34);g.fillStyle(0x291f2b).fillEllipse(240,326,135,102);const heat=Math.max(.18,1-this.session.value/level.target);g.fillStyle(level.color,1).fillTriangle(190,365,240,272,290,365);g.fillStyle(0xffd25c,.7+heat*.3).fillTriangle(212,365,243,304,270,365);g.fillStyle(0xd8f7ff,.85).fillCircle(240,386,10+this.session.value*2);}
    drawGauge(){const level=this.session.level,ratio=this.session.value/level.target;this.gauge.clear();this.gauge.fillStyle(0x2b202b).fillRoundedRect(455,420,585,24,12);this.gauge.fillStyle(0x67cce6).fillRoundedRect(459,424,577*ratio,16,8);for(let i=1;i<level.target;i++){const x=455+585*i/level.target;this.gauge.lineStyle(2,0xffffff,.42).lineBetween(x,420,x,444);}this.stat.setText(`目前 ${this.session.value} / ${level.target} 顆　｜　已投入 ${this.session.history.length} 份`);this.remainingText.setText(this.session.complete?'降溫完成！':`還差 ${level.target-this.session.value} 顆`);this.drawFurnace();}
    add(value){if(this.mode!=='playing'||this.busy)return;const result=this.session.add(value);if(result==='ignored')return;if(result==='too_much'){this.feedback.setText(`這箱太多了！現在只差 ${this.session.level.target-this.session.value} 顆。`);this.tone('hint');this.wiggleButton(value);return;}this.busy=true;this.animateCrystals(value,()=>{this.busy=false;this.drawGauge();this.tone('correct');if(result==='complete'){this.feedback.setText('數量剛剛好，火山安全降溫！');this.coolingCelebration();this.time.delayedCall(850,()=>this.completeLevel(this.session,COOLING_LEVELS.length,()=>this.drawLevel()));}else this.feedback.setText(`投入 ${value} 顆！再看看還差多少。`);});}
    animateCrystals(value,done){let finished=0;for(let i=0;i<value;i++){const start=this.crystalButtons[value],g=this.add.graphics().setDepth(50);this.drawCrystal(g,start.x+(i-(value-1)/2)*24,start.y-10,0xc8f5ff);this.tweens.add({targets:g,x:240-start.x,y:330-start.y,scale:.55,angle:180,duration:420+i*80,ease:'Sine.easeIn',onComplete:()=>{g.destroy();finished+=1;if(finished===value)done();}});}}
    wiggleButton(value){const b=this.crystalButtons[value];if(b)this.tweens.add({targets:b,x:b.x-8,duration:55,yoyo:true,repeat:3});}
    undoCrystal(){if(this.mode!=='playing'||this.busy)return;if(!this.session.undo()){this.feedback.setText('還沒有投入冰晶喔。');this.tone('hint');return;}this.drawGauge();this.feedback.setText('拿回上一份冰晶，再算一次。');this.tone('send');}
    showCoolingHint(){if(this.mode!=='playing'||this.busy)return;const value=this.session.hint(),button=this.crystalButtons[value];if(!button)return;this.feedback.setText(`小火龍提示：試試「${value} 顆」冰晶箱。`);this.tone('hint');this.tweens.add({targets:button,scale:1.12,duration:180,yoyo:true,repeat:3});}
    coolingCelebration(){for(let i=0;i<18;i++){const flake=this.add.star(240,330,6,3,8,i%2?0xc9f5ff:0xffffff).setDepth(48);const a=i/18*Math.PI*2;this.tweens.add({targets:flake,x:240+Math.cos(a)*(85+i%4*12),y:330+Math.sin(a)*(70+i%3*10),angle:160,alpha:0,duration:620,onComplete:()=>flake.destroy()});}}
}

export class LavaPipeGame extends VolcanoMiniBase {
    constructor(){super('LavaPipeGame');}
    setupGame(){this.session=new LavaPipeSession();this.instructions='點一下藍色水管，就會旋轉四分之一圈。\n把每段轉成金色影子的方向，讓左邊的冷卻水流到右邊火山。';this.flowDots=[];this.busy=false;this.drawLevel();this.keyHandler=e=>{if(e.repeat)return;if(/^Digit[1-7]$/.test(e.code))this.rotate(Number(e.code.slice(-1))-1);else if(e.code==='KeyH')this.showPipeHint();else if(e.code==='KeyR')this.resetPipes();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);}
    drawLevel(){
        this.clearFlow();this.clearItems();this.busy=false;const level=this.session.level,n=this.session.rotations.length;
        this.addItem(this.text(640,145,`${level.name}｜第 ${this.session.levelIndex+1}/${PIPE_LEVELS.length} 關`,24,'#ffe7b0'));
        this.addItem(this.panel(640,365,1020,330,0x472b3b,0xc56d45,30).setDepth(18));
        this.addItem(this.text(640,205,level.guide,18,'#ffdca2').setDepth(21));
        this.drawWaterTank(155,360);this.drawHotVolcano(1125,360);
        this.pipeViews=[];this.pipeContainers=[];this.pipePositions=[];
        const left=275,right=1005,spacing=(right-left)/Math.max(1,n-1);
        for(let i=0;i<n;i++){
            const x=left+i*spacing,y=360+(i%2?34:-34),type=level.types[i],target=level.target[i];
            const c=this.add.container(x,y).setDepth(27),tile=this.add.graphics();tile.fillStyle(0x372b39).fillRoundedRect(-54,-54,108,108,22);tile.lineStyle(3,0x855063,.9).strokeRoundedRect(-54,-54,108,108,22);
            const hint=this.pipeShape(type,target,0xffd36a,.27,28),pipe=this.pipeShape(type,this.session.rotations[i],0x79d7ee,1,20),number=this.text(0,72,String(i+1),15,'#d9a878');
            c.add([tile,hint,pipe,number]).setSize(116,125).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.rotate(i)).on('pointerover',()=>c.setScale(1.05)).on('pointerout',()=>c.setScale(1));
            this.pipeViews.push(pipe);this.pipeContainers.push(c);this.pipePositions.push({x,y});this.addItem(c);
        }
        this.progress=this.addItem(this.text(640,528,'',20,'#ffe7b0').setDepth(22));
        this.addItem(this.button(520,590,210,50,'↺ 本關重來',()=>this.resetPipes(),0xf0cf8d,'#6c3028').setDepth(25));
        this.addItem(this.button(760,590,210,50,'💧 水滴提示',()=>this.showPipeHint(),0x70b8cd,'#244e61').setDepth(25));
        this.addItem(this.text(640,652,'直接點水管｜鍵盤 1～7｜H 提示｜R 重來',16,'#ffdca2').setDepth(22));this.refreshPipeHud();
    }
    pipeShape(type,rotation,color,alpha,width){const g=this.add.graphics();g.lineStyle(width,color,alpha).beginPath();if(type==='straight')g.moveTo(-43,0).lineTo(43,0);else if(type==='tee')g.moveTo(-43,0).lineTo(43,0).moveTo(0,0).lineTo(0,-43);else if(type==='cross')g.moveTo(-43,0).lineTo(43,0).moveTo(0,-43).lineTo(0,43);else g.moveTo(-43,0).lineTo(0,0).lineTo(0,-43);g.strokePath();g.fillStyle(color,alpha).fillCircle(0,0,width*.55);g.setAngle(rotation*90);return g;}
    drawWaterTank(x,y){const c=this.add.container(x,y).setDepth(23),g=this.add.graphics();g.fillStyle(0xdaf7ff).fillRoundedRect(-58,-72,116,144,22);g.lineStyle(6,0x69b9d0).strokeRoundedRect(-58,-72,116,144,22);g.fillStyle(0x63c8e4,.85).fillRoundedRect(-48,-5,96,67,15);g.fillStyle(0xffffff,.65).fillCircle(-20,18,8).fillCircle(18,38,6);c.add([g,this.text(0,-98,'冷卻水',18,'#d7f7ff')]);this.addItem(c);}
    drawHotVolcano(x,y){const c=this.add.container(x,y).setDepth(23),g=this.add.graphics();g.fillStyle(0x372d36).fillTriangle(-75,70,0,-70,75,70);g.fillStyle(0xf05b30).fillTriangle(-22,-28,0,-70,24,-27);g.fillStyle(0xffbf54,.75).fillEllipse(0,-71,52,16);c.add([g,this.text(0,99,'等待降溫',18,'#ffd7a0')]);this.hotVolcano=c;this.addItem(c);}
    rotate(i){if(this.mode!=='playing'||this.busy||!this.pipeViews[i])return;const result=this.session.rotate(i);if(result==='ignored')return;this.tone('send');this.tweens.add({targets:this.pipeViews[i],angle:this.session.rotations[i]*90,duration:180,ease:'Back.easeOut'});this.refreshPipeHud();if(result==='complete'){this.busy=true;this.feedback.setText('全部接通，冷卻水出發！');this.time.delayedCall(230,()=>this.playWaterFlow());}else this.feedback.setText('喀噠！比對藍色水管和金色影子。');}
    refreshPipeHud(){const aligned=this.session.rotations.filter((v,i)=>{const t=this.session.level.types[i],goal=this.session.level.target[i];return t==='straight'?v%2===goal%2:t==='cross'||v%4===goal%4;}).length;this.progress?.setText(`接好 ${aligned} / ${this.session.rotations.length} 段　｜　共旋轉 ${this.session.totalTurns} 次　提示 ${this.session.hints} 次`);}
    showPipeHint(){if(this.mode!=='playing'||this.busy)return;const index=this.session.hint();this.refreshPipeHud();if(index<0){this.feedback.setText('所有水管都接好了！');return;}const c=this.pipeContainers[index];this.feedback.setText(`水滴提示：看看第 ${index+1} 段水管。`);this.tone('hint');this.tweens.add({targets:c,scale:1.13,duration:170,yoyo:true,repeat:4});}
    resetPipes(){if(this.mode!=='playing'||this.busy)return;this.session.reset();this.pipeViews.forEach((pipe,i)=>pipe.setAngle(this.session.rotations[i]*90));this.refreshPipeHud();this.feedback.setText('水管回到一開始，再慢慢比對。');this.tone('hint');}
    playWaterFlow(){this.clearFlow();const points=[{x:155,y:360},...this.pipePositions,{x:1125,y:360}];points.forEach((point,index)=>{const drop=this.add.circle(point.x,point.y,11,0xbff5ff,1).setDepth(48).setAlpha(index?0:1);this.flowDots.push(drop);if(index){drop.setPosition(points[index-1].x,points[index-1].y);this.tweens.add({targets:drop,x:point.x,y:point.y,alpha:1,duration:300,delay:(index-1)*220,ease:'Sine.easeInOut'});}});const total=(points.length-1)*220+430;this.time.delayedCall(total,()=>{this.hotVolcano?.setTint?.(0x9bdbea);this.feedback.setText('火山冒出涼涼的白煙，完成！');this.tone('finish');this.coolSteam();this.time.delayedCall(650,()=>this.completeLevel(this.session,PIPE_LEVELS.length,()=>this.drawLevel()));});}
    coolSteam(){for(let i=0;i<12;i++){const puff=this.add.circle(1125+(i%3-1)*15,285,14+i%3*5,0xe4faff,.75).setDepth(50);this.tweens.add({targets:puff,x:puff.x+(i%2?28:-28),y:180-i%4*12,scale:1.7,alpha:0,duration:700+i*35,onComplete:()=>puff.destroy()});}}
    clearFlow(){this.flowDots?.forEach(d=>d.destroy());this.flowDots=[];}
}

export class VolcanoEchoGame extends VolcanoMiniBase {
    constructor(){super('VolcanoEchoGame');}
    setupGame(){
        this.session=new VolcanoEchoSession();this.instructions='先看洞穴圖騰依序亮起，再照相同順序點一次。\n記錯會溫柔地重新播放；也能按「再聽一次」或開啟慢速。';
        this.labels={flame:'🔥',rock:'🪨',gem:'💎',dragon:'🐲'};this.names={flame:'火焰',rock:'紅石',gem:'寶石',dragon:'小火龍'};this.colors={flame:0xe96836,rock:0x9b5960,gem:0x7d72c8,dragon:0x69a67b};this.slowMode=true;this.echoTimers=[];this.drawLevel();this.onStart=()=>this.playSequence();
        this.keyHandler=e=>{if(e.repeat)return;const map={Digit1:'flame',Digit2:'rock',Digit3:'gem',Digit4:'dragon'};if(map[e.code])this.press(map[e.code]);else if(e.code==='Space'||e.code==='KeyH')this.replaySequence();else if(e.code==='KeyS')this.toggleSlow();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);
        this.events.once('shutdown',()=>this.clearEchoTimers());
    }
    drawLevel(){
        this.clearEchoTimers();this.clearItems();const level=this.session.level;
        this.addItem(this.text(640,145,`${level.name}｜第 ${this.session.levelIndex+1}/${ECHO_LEVELS.length} 關`,24,'#ffe7b0'));
        this.addItem(this.panel(640,347,910,390,0x302538,0x8d536f,34).setDepth(18));
        const cave=this.addItem(this.add.graphics().setDepth(19));cave.fillStyle(0x211d2b).fillRoundedRect(260,205,760,282,110);cave.lineStyle(8,0x5f3b50,.9).strokeRoundedRect(260,205,760,282,110);for(let i=0;i<18;i++)cave.fillStyle(i%2?0xd65a3c:0x8f5fab,.24).fillCircle(300+(i*131)%680,230+(i*67)%225,5+i%4);
        this.addItem(this.text(640,235,level.guide,18,'#d9b6cc').setDepth(22));
        this.buttons={};this.glows={};
        ECHO_SYMBOLS.forEach((id,index)=>{
            const x=385+index*170,y=365,enabled=level.active.includes(id),c=this.add.container(x,y).setDepth(28),glow=this.add.circle(0,0,70,0xffdc72,0),stone=this.add.graphics();
            stone.fillStyle(enabled?this.colors[id]:0x514956,enabled?1:.55).fillCircle(0,0,58);stone.lineStyle(5,enabled?0xe9b685:0x6f6570,1).strokeCircle(0,0,58);stone.fillStyle(0xffffff,.16).fillEllipse(-17,-18,42,20);
            const icon=this.text(0,-5,this.labels[id],42,'#ffffff'),name=this.text(0,78,`${index+1}. ${this.names[id]}`,16,enabled?'#ffe7b0':'#807582');c.add([glow,stone,icon,name]).setSize(132,150);
            if(enabled)c.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.press(id)).on('pointerover',()=>c.setScale(1.05)).on('pointerout',()=>c.setScale(1));
            this.buttons[id]=c;this.glows[id]=glow;this.addItem(c);
        });
        this.progressDots=[];for(let i=0;i<level.sequence.length;i++){const dot=this.add.circle(555+i*34,500,10,0x655467,1).setStrokeStyle(2,0xb793a9);this.progressDots.push(dot);this.addItem(dot);}
        this.stat=this.addItem(this.text(640,535,'準備聽回聲…',20,'#ffe7b0').setDepth(22));
        this.replayButton=this.addItem(this.button(515,590,220,52,'↻ 再聽一次',()=>this.replaySequence(),0xb65a47).setDepth(26));
        this.slowButton=this.addItem(this.button(765,590,220,52,this.slowMode?'🐢 慢速：開':'🐇 慢速：關',()=>this.toggleSlow(),0x80608f).setDepth(26));
        this.addItem(this.text(640,655,'點四個圖騰｜鍵盤 1～4｜空白鍵重播｜S 慢速',16,'#ffdca2').setDepth(22));this.refreshEchoHud();
    }
    playSequence(){
        if(!this.session.sequence)return;this.clearEchoTimers();this.mode='showing';this.session.progress=0;this.refreshEchoHud();this.stat.setText('小耳朵準備，仔細看亮起順序');this.feedback.setText('洞穴正在唱回聲…');
        const gap=this.slowMode?850:570,light=this.slowMode?520:340;
        this.session.sequence.forEach((id,index)=>{this.echoTimers.push(this.time.delayedCall(240+index*gap,()=>{this.flashSymbol(id,light);this.tone('send');}));});
        this.echoTimers.push(this.time.delayedCall(360+this.session.sequence.length*gap,()=>{this.mode='playing';this.stat.setText('換你照順序點圖騰');this.feedback.setText('從第一個回聲開始！');}));
    }
    flashSymbol(id,duration=330){const button=this.buttons[id],glow=this.glows[id];if(!button||!glow)return;glow.setAlpha(.75);this.tweens.add({targets:button,scale:1.2,duration:duration*.42,yoyo:true,ease:'Sine.easeOut'});this.tweens.add({targets:glow,scale:1.35,alpha:0,duration,onComplete:()=>glow.setScale(1)});for(let i=0;i<5;i++){const spark=this.add.star(button.x,button.y,5,3,8,0xffdd75,.9).setDepth(45),a=i/5*Math.PI*2;this.tweens.add({targets:spark,x:button.x+Math.cos(a)*85,y:button.y+Math.sin(a)*72,alpha:0,duration,onComplete:()=>spark.destroy()});}}
    press(id){
        if(this.mode!=='playing'||!this.session.level.active.includes(id))return;this.flashSymbol(id,260);const result=this.session.press(id);
        if(result==='again'){this.refreshEchoHud();this.feedback.setText(`這次是「${this.names[id]}」，沒關係，再聽一次～`);this.stat.setText('圖騰會重新唱一遍');this.tone('hint');this.mode='waiting';this.echoTimers.push(this.time.delayedCall(700,()=>this.playSequence()));return;}
        this.tone('correct');this.refreshEchoHud();if(result==='complete'){this.feedback.setText('完整回聲全部答對了！');this.stat.setText('洞穴亮起彩虹火光');this.echoCelebration();this.mode='waiting';this.echoTimers.push(this.time.delayedCall(850,()=>this.completeLevel(this.session,ECHO_LEVELS.length,()=>{this.drawLevel();this.playSequence();})));}else{this.feedback.setText('對了！繼續下一個回聲。');this.stat.setText(`已記對 ${this.session.progress} 個`);}
    }
    refreshEchoHud(){this.progressDots?.forEach((dot,index)=>dot.setFillStyle(index<this.session.progress?0xffd467:0x655467,1));}
    replaySequence(){if(!['playing','waiting'].includes(this.mode))return;if(!this.session.replay())return;this.feedback.setText('洞穴再唱一次，慢慢看。');this.playSequence();}
    toggleSlow(){if(this.mode==='levelComplete'||this.mode==='finished')return;this.slowMode=!this.slowMode;this.slowButton?.label.setText(this.slowMode?'🐢 慢速：開':'🐇 慢速：關');this.feedback.setText(this.slowMode?'已開啟慢速播放。':'已切換一般速度。');if(this.mode==='showing')this.playSequence();}
    clearEchoTimers(){this.echoTimers?.forEach(timer=>timer?.remove?.(false));this.echoTimers=[];}
    echoCelebration(){ECHO_SYMBOLS.forEach((id,index)=>this.echoTimers.push(this.time.delayedCall(index*120,()=>this.flashSymbol(id,520))));}
}

export class LavaBridgeGame extends VolcanoMiniBase {
    constructor(){super('LavaBridgeGame');}
    setupGame(){
        this.session=new LavaBridgeSession();this.instructions='看看岩漿裂縫需要幾格長的橋，再選 1、2、3 格木板。\n木板合起來剛剛好，小火龍就能安全走過去；太長不會掉下去。';this.busy=false;this.drawLevel();
        this.keyHandler=e=>{if(e.repeat)return;if(/^Digit[123]$/.test(e.code))this.add(Number(e.code.slice(-1)));else if(e.code==='KeyH')this.showBridgeHint();else if(e.code==='KeyZ'||e.code==='KeyU')this.undoPlank();else if(e.code==='KeyR')this.resetBridge();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);
    }
    drawLevel(){
        this.clearItems();this.busy=false;const level=this.session.level;
        this.addItem(this.text(640,145,`${level.name}｜第 ${this.session.levelIndex+1}/${BRIDGE_LEVELS.length} 關`,24,'#ffe7b0'));
        this.addItem(this.panel(640,350,1080,385,0x422c39,0xb86847,30).setDepth(18));
        this.addItem(this.text(640,195,level.guide,18,'#ffdca2').setDepth(22));
        this.canyon=this.addItem(this.add.graphics().setDepth(20));this.drawCanyon();
        this.bridge=this.addItem(this.add.graphics().setDepth(28));
        this.dragon=this.addItem(this.drawBridgeDragon(315,345).setDepth(35));
        this.finishFlag=this.addItem(this.drawFinishFlag(965,337).setDepth(30));
        this.stat=this.addItem(this.text(640,472,'',21,'#ffe7b0').setDepth(30));
        this.pieceButtons=[];
        [1,2,3].forEach((value,index)=>{const enabled=level.allowed.includes(value),x=420+index*220,c=this.add.container(x,555).setDepth(31),g=this.add.graphics();g.fillStyle(enabled?0xa96f3f:0x5d4e52,enabled?1:.65).fillRoundedRect(-88,-48,176,96,20);g.lineStyle(4,enabled?0xf0c47a:0x79696c,1).strokeRoundedRect(-88,-48,176,96,20);for(let n=0;n<value;n++){g.fillStyle(n%2?0xd59a58:0xe5b66e).fillRoundedRect(-56+n*42-(value-1)*21,-18,38,36,7);g.fillStyle(0x795035).fillCircle(-37+n*42-(value-1)*21,0,3);}const label=this.text(0,30,`${value} 格木板`,17,enabled?'#fff3d2':'#a99ca0');c.add([g,label]).setSize(190,108);if(enabled)c.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.add(value)).on('pointerover',()=>c.setScale(1.05)).on('pointerout',()=>c.setScale(1));this.pieceButtons[value]=c;this.addItem(c);});
        this.addItem(this.button(505,638,185,46,'↶ 拿回一塊',()=>this.undoPlank(),0xf0cf8d,'#6c3028').setDepth(31));
        this.addItem(this.button(705,638,185,46,'↺ 本關重來',()=>this.resetBridge(),0xc98d57,'#fff5dd').setDepth(31));
        this.addItem(this.button(905,638,185,46,'🐲 小火龍提示',()=>this.showBridgeHint(),0x78ad82,'#214b35').setDepth(31));
        this.drawBridge();
    }
    drawCanyon(){const g=this.canyon;g.clear();g.fillStyle(0x5a4141).fillRoundedRect(155,255,265,185,24).fillRoundedRect(860,255,265,185,24);g.fillStyle(0x72504a).fillRoundedRect(170,270,250,150,18).fillRoundedRect(860,270,250,150,18);g.fillStyle(0x241d29).fillRect(420,250,440,195);g.fillStyle(0xec512b).fillRoundedRect(425,300,430,135,38);g.fillStyle(0xffa43f,.78).fillRoundedRect(445,337,390,58,25);for(let i=0;i<12;i++)g.fillStyle(i%2?0xffd064:0xff7a36,.65).fillCircle(455+(i*73)%370,318+(i*41)%100,5+i%4);}
    drawBridge(){const g=this.bridge,target=this.session.level.target,unit=440/target;g.clear();for(let i=0;i<=target;i++){const x=420+i*unit;g.lineStyle(2,0xffd58a,.35).lineBetween(x,282,x,410);}let cursor=0;this.session.history.forEach((length,index)=>{const x=420+cursor*unit,w=length*unit;g.fillStyle(index%2?0xc98a4d:0xe0aa62).fillRoundedRect(x+3,318,w-6,62,8);g.lineStyle(3,0x744a33,.9).strokeRoundedRect(x+3,318,w-6,62,8);for(let n=1;n<length;n++)g.lineStyle(2,0x8c5a38,.75).lineBetween(x+n*unit,322,x+n*unit,376);cursor+=length;});const remaining=target-this.session.length;this.stat.setText(this.session.complete?`橋長 ${target} / ${target} 格｜剛剛好！`:`已搭 ${this.session.length} / ${target} 格｜還差 ${remaining} 格`);}
    drawBridgeDragon(x,y){const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0x68a56e).fillEllipse(0,8,68,55).fillCircle(25,-18,30);g.fillStyle(0x9bd27e).fillEllipse(7,12,37,31);g.fillStyle(0xffffff).fillCircle(33,-25,8);g.fillStyle(0x253f35).fillCircle(35,-25,4);g.fillStyle(0xf0bd69).fillTriangle(48,-14,68,-7,48,-3);g.fillStyle(0x5b895d).fillTriangle(-30,0,-58,-24,-48,14);g.fillStyle(0xf3d16e).fillTriangle(5,-27,15,-52,24,-27);g.lineStyle(7,0x4c7e54).beginPath().arc(-25,18,30,2.8,5.2).strokePath();c.add(g);return c;}
    drawFinishFlag(x,y){const c=this.add.container(x,y),g=this.add.graphics();g.lineStyle(7,0xf4d58b).lineBetween(0,-54,0,58);g.fillStyle(0xffe090).fillTriangle(2,-52,67,-30,2,-10);g.fillStyle(0xe86b3c).fillCircle(34,-31,9);c.add([g,this.text(25,78,'安全岩地',16,'#ffe7b0')]);return c;}
    add(value){if(this.mode!=='playing'||this.busy)return;const previous=this.session.length,result=this.session.add(value);if(result==='ignored')return;if(result==='too_long'){const remaining=this.session.level.target-this.session.length;this.feedback.setText(`這塊有 ${value} 格，但現在只差 ${remaining} 格～`);this.tone('hint');this.wigglePlank(value);return;}this.busy=true;this.animatePlank(value,previous,()=>{this.busy=false;this.drawBridge();this.tone('correct');if(result==='complete'){this.feedback.setText('橋長剛剛好，小火龍出發！');this.mode='crossing';this.busy=true;this.crossBridge();}else this.feedback.setText(`放上 ${value} 格木板，再看看還差幾格。`);});}
    animatePlank(value,previous,done){const target=this.session.level.target,unit=440/target,start=this.pieceButtons[value],w=value*unit,g=this.add.graphics().setDepth(48);g.fillStyle(0xe0aa62).fillRoundedRect(-w/2,-28,w,56,8);g.lineStyle(3,0x744a33).strokeRoundedRect(-w/2,-28,w,56,8);g.setPosition(start.x,start.y);this.tweens.add({targets:g,x:420+previous*unit+w/2,y:349,angle:360,duration:480,ease:'Back.easeOut',onComplete:()=>{g.destroy();done();}});}
    wigglePlank(value){const c=this.pieceButtons[value];if(c)this.tweens.add({targets:c,x:c.x-8,duration:55,yoyo:true,repeat:3});}
    undoPlank(){if(this.mode!=='playing'||this.busy)return;if(!this.session.undo()){this.feedback.setText('橋上還沒有木板喔。');this.tone('hint');return;}this.drawBridge();this.feedback.setText('拿回上一塊木板，再試一種組合。');this.tone('send');}
    resetBridge(){if(this.mode!=='playing'||this.busy)return;this.session.reset();this.drawBridge();this.feedback.setText('橋面清空了，重新選木板。');this.tone('hint');}
    showBridgeHint(){if(this.mode!=='playing'||this.busy)return;const value=this.session.hint(),button=this.pieceButtons[value];if(!button)return;this.feedback.setText(`小火龍提示：試試「${value} 格木板」。`);this.tone('hint');this.tweens.add({targets:button,scale:1.12,duration:170,yoyo:true,repeat:4});}
    crossBridge(){this.tone('finish');this.tweens.add({targets:this.dragon,x:965,duration:1550,ease:'Sine.easeInOut',onUpdate:tw=>this.dragon.setY(345-Math.sin(tw.progress*Math.PI)*18),onComplete:()=>{this.dragon.setY(345);this.busy=false;this.feedback.setText('小火龍安全走過熔岩河！');this.bridgeCelebration();this.time.delayedCall(650,()=>this.completeLevel(this.session,BRIDGE_LEVELS.length,()=>this.drawLevel()));}});}
    bridgeCelebration(){for(let i=0;i<16;i++){const star=this.add.star(965,320,5,3,9,i%2?0xffdc73:0x9be28c).setDepth(50),a=i/16*Math.PI*2;this.tweens.add({targets:star,x:965+Math.cos(a)*(95+i%3*15),y:320+Math.sin(a)*(75+i%4*9),angle:180,alpha:0,duration:650,onComplete:()=>star.destroy()});}}
}
