import AnimalSnackGame from './AnimalSnackGame.js';
import { IceFishingSession, FISH_COLORS, FISHING_TASKS, FISHING_STAGE_NAMES, buildFishSchool } from '../data/IceFishingData.js';

const FISH_AREA={left:360,right:965,top:235,bottom:535};

export default class IceFishingGame extends AnimalSnackGame{
    constructor(){super('IceFishingGame');}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;this.mode='intro';this.session=new IceFishingSession();this.fish=[];this.busy=false;this.slow=false;this.elapsed=0;this.hintFish=null;this.hintLeft=0;
        this.drawFrozenLake();this.drawHud();this.bear=this.drawBear(188,500).setDepth(35);this.bucket=this.drawBucket(1090,542).setDepth(35);this.bindFishingInput();this.startTask();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();});
    }
    colorInfo(id){return FISH_COLORS.find(c=>c.id===id)||FISH_COLORS[0];}
    drawFrozenLake(){
        const g=this.add.graphics();g.fillGradientStyle(0x9fd3e4,0xccebf3,0xeef9fb,0xf9fdff,1).fillRect(0,0,1280,720);g.fillStyle(0xb4dce8,.7).fillTriangle(55,260,255,55,445,260).fillTriangle(835,260,1055,42,1250,260);g.fillStyle(0xffffff,.9).fillTriangle(188,124,255,55,321,124).fillTriangle(980,116,1055,42,1128,116);g.fillStyle(0xf8fdff).fillEllipse(665,430,930,520);
        g.fillStyle(0x4dabc5,.88).fillEllipse(665,399,685,365);g.lineStyle(12,0xd9f3f7,.95).strokeEllipse(665,399,685,365);g.lineStyle(4,0xffffff,.45).strokeEllipse(665,399,620,310);
        for(let i=0;i<17;i++){const x=330+(i*167)%690,y=225+(i*79)%335;g.fillStyle(0xd9f7fb,.35).fillCircle(x,y,4+i%3);}
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(60);this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(61);this.text(438,41,'冰窟釣魚對對碰',31,'#28576c').setDepth(61);this.stageText=this.text(675,43,'第 1 段',17,'#648595').setDepth(61);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(61);this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(61);
        this.panel(154,247,246,285,0xf9fdff,0xcde8f1,23).setDepth(45);this.text(154,128,'小熊想要',23,'#28576c').setDepth(46);this.promptPanel=this.panel(154,205,190,104,0xeaf7f9,0xb8dce5,20).setDepth(46);this.promptFish=null;this.promptText=this.text(154,265,'',19,'#4e7484').setDepth(48);this.progressText=this.text(154,318,'任務 1 / 9',23,'#28576c').setDepth(46);this.feedback=this.text(640,105,'看看小熊想要什麼顏色！',20,'#416b7d').setDepth(61);
        this.panel(1110,254,250,300,0xf9fdff,0xcde8f1,23).setDepth(45);this.text(1110,126,'釣魚工具',23,'#28576c').setDepth(46);this.slowButton=this.button(1110,190,194,48,'慢慢游：關',()=>this.toggleSlow(),0xf0d783,'#5d552e').setDepth(46);this.button(1110,253,194,48,'小水獺提示',()=>this.showHint(),0xdceff4,'#28576c').setDepth(46);this.statText=this.text(1110,315,'釣到 0　再試 0',16,'#648595').setDepth(46);this.text(1110,373,'直接點小魚\n鍵盤 1～6 也可以選',16,'#648595').setDepth(46);this.text(670,692,'魚會慢慢游｜點符合小熊泡泡中「顏色＋數量」的小魚｜點錯可以再試',16,'#4f7687').setDepth(61);
    }
    drawBear(x,y){const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0xf2eee3).fillEllipse(0,15,104,126).fillCircle(0,-50,57).fillCircle(-39,-92,20).fillCircle(39,-92,20);g.fillStyle(0xffffff).fillEllipse(0,-37,73,56);g.fillStyle(0x344d59).fillCircle(-20,-58,5).fillCircle(20,-58,5).fillCircle(0,-35,8);g.fillStyle(0x6ab0c7).fillRoundedRect(-57,-5,114,18,8);g.fillTriangle(35,4,70,34,45,-3);c.add(g);return c;}
    drawBucket(x,y){const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0xd68a61).fillRoundedRect(-50,-27,100,75,13);g.lineStyle(6,0x6e8793).beginPath().arc(0,-25,55,Math.PI,Math.PI*2).strokePath();g.fillStyle(0xf2bf73).fillRect(-50,-7,100,12);c.add(g);this.text(x,y+66,'小魚水桶',16,'#426c7d');return c;}
    drawFish(x,y,colorId,index){
        const info=this.colorInfo(colorId),c=this.add.container(x,y).setDepth(25),g=this.add.graphics();g.fillStyle(info.value).fillEllipse(0,0,82,45).fillTriangle(-37,0,-72,-30,-69,30);g.fillStyle(0xffffff,.42).fillEllipse(12,-10,27,10);g.fillStyle(0xffffff).fillCircle(25,-5,8);g.fillStyle(0x2d4b59).fillCircle(27,-5,4);g.lineStyle(3,0xffffff,.65).beginPath().arc(38,8,12,.5,2.2).strokePath();c.body=g;c.add(g);c.label=this.text(0,37,String(index+1),15,'#eafaff');c.add(c.label);c.setSize(154,82).setInteractive(new Phaser.Geom.Rectangle(-77,-41,154,82),Phaser.Geom.Rectangle.Contains);return c;
    }
    startTask(){
        this.clearFish();if(this.session.finished){this.finishFishing();return;}const task=this.session.task,colors=buildFishSchool(task);this.stageText.setText(FISHING_STAGE_NAMES[task.stage]);this.progressText.setText(`任務 ${this.session.index+1} / ${FISHING_TASKS.length}`);this.refreshPrompt();
        colors.forEach((colorId,index)=>{const x=FISH_AREA.left+(index%3)*250+Phaser.Math.Between(-30,30),y=FISH_AREA.top+Math.floor(index/3)*170+Phaser.Math.Between(-24,24);const view=this.drawFish(x,y,colorId,index);const fish={view,colorId,index,baseY:y,dir:index%2?1:-1,speed:24+(index%3)*8,hooked:false};view.body.scaleX=fish.dir;view.on('pointerdown',()=>this.catchFish(fish));this.fish.push(fish);});this.mode=this.mode==='intro'?'intro':'playing';this.feedback.setText(task.stage===1?`找一條${this.colorInfo(task.color).name}小魚！`:`要釣 ${task.count} 條${this.colorInfo(task.color).name}小魚。`);
    }
    clearFish(){this.clearHint();this.fish.forEach(f=>f.view.destroy());this.fish=[];}
    refreshPrompt(){const task=this.session.task;if(!task)return;this.promptFish?.destroy();this.promptFish=this.drawFish(126,194,task.color,0).setScale(.55).setDepth(49);this.promptFish.disableInteractive();this.promptFish.label.setVisible(false);this.promptText.setText(`${this.colorInfo(task.color).name} × ${task.count}\n已釣到 ${this.session.caught} / ${task.count}`);this.statText.setText(`釣到 ${this.session.totalCaught}　再試 ${this.session.wrong}`);}
    bindFishingInput(){this.keyHandler=e=>{if(e.repeat)return;if(/^Digit[1-6]$/.test(e.code)){const fish=this.fish[Number(e.code.slice(-1))-1];if(fish)this.catchFish(fish);}else if(e.code==='KeyH')this.showHint();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};this.input.keyboard?.on('keydown',this.keyHandler);}
    catchFish(fish){
        if(this.mode!=='playing'||this.busy||!fish||fish.hooked)return;this.clearHint();const result=this.session.answer(fish.colorId);this.refreshPrompt();
        if(result.result==='wrong'){this.feedback.setText(`這是${this.colorInfo(fish.colorId).name}，小熊想要${this.colorInfo(this.session.task.color).name}喔～`);this.tone('hint');this.tweens.add({targets:fish.view,x:fish.view.x+18,duration:70,yoyo:true,repeat:2});return;}
        fish.hooked=true;this.busy=true;fish.view.disableInteractive();this.tone('correct');this.feedback.setText(result.taskComplete?'數量剛剛好！':'釣到了，還要再找同顏色的小魚！');
        this.tweens.add({targets:fish.view,x:this.bucket.x,y:this.bucket.y-45,angle:360,scale:.55,duration:560,ease:'Sine.easeInOut',onComplete:()=>{this.sparkle(this.bucket.x,this.bucket.y-35);fish.view.destroy();this.fish=this.fish.filter(f=>f!==fish);this.busy=false;if(result.taskComplete){this.mode='waiting';this.time.delayedCall(650,()=>{const oldStage=this.session.task.stage;this.session.advance();if(this.session.finished)this.finishFishing();else{this.startTask();if(this.session.task.stage!==oldStage)this.showStageIntro();}});}else this.refreshPrompt();}});
    }
    toggleSlow(){if(this.mode!=='playing')return;this.slow=!this.slow;this.slowButton.label.setText(this.slow?'慢慢游：開':'慢慢游：關');this.feedback.setText(this.slow?'小魚游慢一點，仔細看顏色～':'恢復原來速度，準備釣魚！');}
    showHint(){if(this.mode!=='playing')return;this.clearHint();const color=this.session.hint(),fish=this.fish.find(f=>!f.hooked&&f.colorId===color);if(!fish)return;this.hintFish=fish;this.hintLeft=2.6;fish.view.setScale(1.18);this.feedback.setText(`金色亮光旁邊是${this.colorInfo(color).name}小魚！`);this.halo=this.add.ellipse(fish.view.x,fish.view.y,130,78,0xffdf72,.16).setStrokeStyle(5,0xffdf72,.95).setDepth(23);this.refreshPrompt();this.tone('hint');}
    clearHint(){if(this.hintFish?.view.active)this.hintFish.view.setScale(1);this.hintFish=null;this.hintLeft=0;this.halo?.destroy();this.halo=null;}
    update(_time,delta){
        if(this.mode!=='playing')return;const dt=Math.max(0,Math.min(delta/1000,.05));this.elapsed+=dt;const speedScale=this.slow ? .45 : 1;
        this.fish.forEach((f,i)=>{if(f.hooked)return;f.view.x+=f.dir*f.speed*speedScale*dt;if(f.view.x<FISH_AREA.left||f.view.x>FISH_AREA.right){f.dir*=-1;f.view.body.scaleX=f.dir;}f.view.y=f.baseY+Math.sin(this.elapsed*(.7+i%3*.15)+i)*13;});
        if(this.hintLeft>0){this.hintLeft-=dt;if(this.halo&&this.hintFish){this.halo.setPosition(this.hintFish.view.x,this.hintFish.view.y);this.halo.alpha=.45+Math.sin(this.hintLeft*8)*.3;}if(this.hintLeft<=0)this.clearHint();}
    }
    showStageIntro(){this.mode='stage';const task=this.session.task,o=this.makeOverlay(task.stage===2?'接著，釣兩條一樣的魚！':'最後，顏色和數量一起看！',task.stage===2?'先看顏色，再數一數：要連續找到兩條。\n每釣到一條，泡泡會告訴你還差幾條。':'有時一條、有時兩條或三條。\n先認顏色，再看泡泡裡的數字。');o.add(this.button(640,475,270,58,'我準備好了',()=>{o.destroy();this.overlay=null;this.mode='playing';},0x397fa0));}
    showIntro(){const o=this.makeOverlay('冰窟釣魚開始！','看看小熊泡泡裡想要什麼顏色、幾條魚。\n正確的小魚游過時直接點一下，就會自動釣起。\n點錯不扣分，小魚會搖一搖讓你再試。');const fish=this.drawFish(640,414,'red',0).setScale(.85);fish.disableInteractive();fish.label.setVisible(false);o.add(fish);o.add(this.text(640,493,'先認顏色，再加入兩條與一至三條的計數任務。',18,'#678493'));o.add(this.button(640,552,275,58,'開始釣魚！',()=>{o.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));}
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.tweens.pauseAll();this.stopTones();const o=this.makeOverlay('休息一下，小魚停下來','看左邊泡泡的魚色和數量，再點冰窟裡相同顏色的小魚。\n鍵盤 1～6 也能選擇。\n「慢慢游」降低速度，「小水獺提示」亮出答案。');o.add(this.button(640,405,270,55,'繼續釣魚',()=>this.resumeGame(),0x397fa0));o.add(this.button(500,498,220,51,'重新開始',()=>this.restart(),0xf0d783,'#5d552e'));o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));}
    finishFishing(){if(this.mode==='finished')return;this.mode='finished';this.clearFish();this.tone('finish');const s=this.session,o=this.makeOverlay('冰窟釣魚任務完成！',`九個顏色與數量任務都完成了！\n一共釣到：${s.totalCaught} 條\n點錯再試：${s.wrong} 次　使用提示：${s.hints} 次`);o.add(this.text(640,397,'小魚會回到冰湖裡，試玩不扣愛心，也不寫入正式存檔。',18,'#678493'));o.add(this.button(500,492,230,59,'再釣一次',()=>this.restart(),0x397fa0));o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));}
}
