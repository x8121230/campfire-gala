import AnimalSnackGame from './AnimalSnackGame.js';
import { BubbleSession, BUBBLE_COLORS, BUBBLE_SHAPES, matchesBubble } from '../data/ColorBubbleData.js';

const X=[475,760,1045];
const MODE_TEXT={color:'找相同顏色',shape:'找相同圖形',both:'顏色、圖形都相同'};
const GUIDE={color:'先看顏色，再點泡泡。',shape:'先看形狀，再點泡泡。',both:'顏色和圖形都要一樣喔！'};

// Shares drawing/audio helpers only. Independent rules, state and input.
export default class ColorBubbleGame extends AnimalSnackGame {
    constructor(){super('ColorBubbleGame');}
    preload(){
        if(!this.textures.exists('bubble_forest_sky'))this.load.image('bubble_forest_sky','assets/color-bubble/forest-sky.png');
        if(!this.textures.exists('snack_airship'))this.load.image('snack_airship','assets/animal-snack/airship.png');
    }
    create(){
        this.sound.stopAll();this.session=new BubbleSession();this.mode='intro';
        this.soundOn=true;this.audioNodes=new Set();this.slow=false;this.elapsed=0;
        this.shot=null;this.waiting=0;this.overlay=null;this.hintRemaining=0;
        this.motionTime=0;this.targetViews=[];this.promptView=null;
        this.drawBubbleInterface();this.showRound();this.showWelcome();this.bindBubbleInput();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};
        this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);
        this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{
            document.removeEventListener('visibilitychange',this.visibilityHandler);
            this.game.events.off('blur',this.blurHandler);
            this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();
        });
    }
    drawBubbleInterface(){
        if(this.textures.exists('bubble_forest_sky'))this.add.image(640,360,'bubble_forest_sky').setDisplaySize(1280,720);
        else this.add.rectangle(640,360,1280,720,0xe3eeda);
        this.add.rectangle(640,360,1280,720,0xfffcf0,0.1);
        this.panel(640,45,1248,68,0xfffbef,0xf0efd9,20);
        this.button(102,45,155,44,'← 遊戲列表',()=>this.leave());
        this.text(423,43,'彩色泡泡隊',32);
        this.text(635,45,'森林天空 · 幼童試玩',17,'#6b8572');
        this.audioButton=this.button(936,45,118,44,'音效：開',()=>{
            this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();
            this.audioButton.label.setText(this.soundOn?'音效：開':'音效：關');
        },0xe4ecdc,'#31574b');
        this.button(1100,45,168,44,'暫停 / 說明',()=>this.pauseGame(),0xe4ecdc,'#31574b');
        this.panel(162,390,280,588,0xfffbef,0xc4d4ba);
        this.text(162,132,'今天的泡泡任務',25);
        this.progressText=this.text(162,184,'0 / 12',39);
        this.add.rectangle(55,221,214,9,0xe1e9d5).setOrigin(0,0.5);
        this.progressFill=this.add.rectangle(55,221,1,9,0x73a88a).setOrigin(0,0.5);
        this.stageText=this.text(162,260,'',21);
        this.modeLabel=this.text(162,302,'',20);
        this.panel(162,387,204,130,0xf0f3e4,0xd9e0cf,20);
        this.promptName=this.text(162,481,'',23);
        this.button(162,544,218,54,'小精靈提示',()=>this.revealHint(),0xe9d29a,'#675733');
        this.slowButton=this.button(162,610,218,47,'慢慢玩：關',()=>this.toggleSlow(),0xe4ecdc,'#31574b');
        this.text(162,656,'可以隨時停住泡泡想一想',15,'#788a77');
        this.panel(767,127,848,59,0xfffbef,0xe0e7d7,19);
        this.feedback=this.text(767,127,'',23);
        this.ship=this.sprite(760,588,'airship',174,142);
        this.text(767,677,'直接點泡泡，魔法光球會自動飛過去',22);
        this.text(767,705,'鍵盤 1／2／3 也可以選 · 送錯再試，不扣愛心',15,'#496b59');
    }
    drawToken(parent,x,y,choice,size){
        const color=choice.color<0?0x7b9085:BUBBLE_COLORS[choice.color].value;
        const g=this.add.graphics();g.fillStyle(color,1);g.lineStyle(3,0x385f54,0.8);
        if(choice.shape===0){g.fillCircle(x,y,size*0.43);g.strokeCircle(x,y,size*0.43);}
        else if(choice.shape===1){
            g.fillTriangle(x,y-size*.48,x+size*.48,y+size*.37,x-size*.48,y+size*.37);
            g.strokeTriangle(x,y-size*.48,x+size*.48,y+size*.37,x-size*.48,y+size*.37);
        }else{
            const pts=[];for(let i=0;i<10;i++){
                const a=-Math.PI/2+i*Math.PI/5,r=size*(i%2?0.23:0.50);
                pts.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r});
            }
            g.fillPoints(pts,true);g.strokePoints(pts,true);
        }
        parent.add(g);return g;
    }
    showRound(){
        const r=this.session.round;
        this.targetViews.forEach(v=>v.destroy());this.targetViews=[];
        this.promptView?.destroy();this.promptView=this.add.container(162,385);
        this.drawToken(this.promptView,0,0,r.target,88);
        this.modeLabel.setText(MODE_TEXT[r.mode]);
        this.stageText.setText(`第 ${Math.floor(this.session.index/4)+1} 段 · ${this.session.index%4+1} / 4`);
        this.promptName.setText(r.mode==='color'?BUBBLE_COLORS[r.target.color].name:
            r.mode==='shape'?BUBBLE_SHAPES[r.target.shape].name:
            `${BUBBLE_COLORS[r.target.color].name} ${BUBBLE_SHAPES[r.target.shape].name}`);
        this.feedback.setText(GUIDE[r.mode]);this.motionTime=0;this.hintRemaining=0;this.halo?.destroy();this.halo=null;
        r.choices.forEach((choice,index)=>{
            const c=this.add.container(X[index]+Math.sin(index)*22,315+Math.sin(index*.7)*68);
            c.add(this.add.circle(0,0,83,0xfffef9,0.83).setStrokeStyle(3,0x99bac2,1));
            c.add(this.add.ellipse(-33,-46,33,15,0xffffff,0.95).setAngle(-35));
            this.drawToken(c,0,0,choice,93);
            c.add(this.text(0,108,String(index+1),18,'#58766b'));
            c.setSize(172,172).setInteractive(new Phaser.Geom.Circle(86,86,86),Phaser.Geom.Circle.Contains);
            c.on('pointerdown',()=>this.choose(index));this.targetViews.push(c);
        });
        this.refreshProgress();
    }
    refreshProgress(){this.progressText.setText(`${this.session.correct} / 12`);this.progressFill.width=Math.max(1,214*this.session.correct/12);}
    bindBubbleInput(){
        this.keyHandler=e=>{
            if(e.repeat)return;
            if(e.code==='Escape'||e.code==='KeyP'){
                if(this.mode==='paused')this.resumeGame();else this.pauseGame();return;
            }
            if(/^Digit[123]$/.test(e.code))this.choose(Number(e.code.slice(-1))-1);
        };
        this.input.keyboard?.on('keydown',this.keyHandler);
    }
    toggleSlow(){
        if(this.mode!=='playing')return;
        this.slow=!this.slow;this.slowButton.label.setText(this.slow?'慢慢玩：開':'慢慢玩：關');
        this.feedback.setText(this.slow?'泡泡停好了，慢慢看～':GUIDE[this.session.round.mode]);
    }
    revealHint(){
        if(this.mode!=='playing'||this.shot||this.waiting>0)return;
        this.session.hint();this.hintRemaining=2.5;
        const r=this.session.round,index=r.choices.findIndex(c=>matchesBubble(r.target,c,r.mode));
        this.halo?.destroy();this.halo=this.add.circle(0,0,96,0xffdf72,0.12).setStrokeStyle(5,0xe6b849,1);
        this.haloIndex=index;this.updateHalo();
        this.feedback.setText('對照圖卡看看，金色圈圈是哪一顆？');this.tone('hint');
    }
    updateHalo(){if(this.halo){const v=this.targetViews[this.haloIndex];this.halo.setPosition(v.x,v.y);}}
    choose(index){
        if(this.mode!=='playing'||this.shot||this.waiting>0||this.session.solved)return;
        if(!Number.isInteger(index)||!this.targetViews[index]||this.session.retriedChoices.has(index))return;
        const view=this.add.container(this.ship.x,this.ship.y-55);
        view.add(this.add.circle(0,0,21,0xffedac,0.9).setStrokeStyle(3,0xffffff,1));
        this.shot={view,index,t:0,x:this.ship.x,y:this.ship.y-55};this.tone('send');
    }
    update(_time,delta){
        if(this.mode!=='playing')return;
        const dt=Math.max(0,Math.min(delta/1000,0.05));this.elapsed+=dt;
        if(this.hintRemaining>0){this.hintRemaining-=dt;if(this.hintRemaining<=0){this.halo?.destroy();this.halo=null;}}
        if(this.waiting>0){
            this.waiting-=dt;
            if(this.waiting<=0){
                if(this.session.done)this.finish();
                else{
                    const oldMode=this.session.round.mode;this.session.advance();this.showRound();
                    if(this.session.round.mode!==oldMode)this.showStage();
                }
            }
            return;
        }
        if(this.shot){
            const s=this.shot,v=this.targetViews[s.index];s.t=Math.min(1,s.t+dt/.6);
            const t=s.t*s.t*(3-2*s.t);
            s.view.setPosition(Phaser.Math.Linear(s.x,v.x,t),Phaser.Math.Linear(s.y,v.y,t)-Math.sin(t*Math.PI)*45);
            this.ship.x+=(v.x-this.ship.x)*Math.min(1,dt*8);
            if(s.t>=1){
                s.view.destroy();this.shot=null;
                const result=this.session.answer(s.index);
                if(result==='correct'){
                    this.feedback.setText('找到了！你觀察得真仔細。');this.tone('correct');this.sparkle(v.x,v.y);
                    v.setVisible(false);this.halo?.destroy();this.halo=null;this.refreshProgress();this.waiting=1;
                }else if(result==='wrong'){
                    v.setAlpha(.4);v.disableInteractive();this.tone('hint');
                    const r=this.session.round,c=r.choices[s.index];
                    this.feedback.setText(r.mode==='both'?(c.color!==r.target.color?'圖形一樣，顏色還不一樣喔～':'顏色一樣，圖形還不一樣喔～'):
                        r.mode==='color'?'再看圖卡的顏色，試試另一顆。':'再看圖卡的形狀，試試另一顆。');
                }
            }
            return;
        }
        // No fail deadline. Continuous gentle bobbing avoids teleporting out of reach.
        if(!this.slow&&this.hintRemaining<=0){
            this.motionTime+=dt;
            const t=this.motionTime,speed=[.32,.40,.48][Math.floor(this.session.index/4)];
            this.targetViews.forEach((v,i)=>v.setPosition(X[i]+Math.sin(t*.55+i)*22,
                315+Math.sin(t*speed+i*.7)*68));
        }
        this.updateHalo();
    }
    showWelcome(){
        this.mode='intro';
        const o=this.makeOverlay('出發，找一樣的泡泡！','看左邊的圖卡，再點選相同的泡泡。\n魔法光球會自動飛過去。\n點錯可以再試，沒有倒數失敗。');
        o.add(this.text(640,404,'① 顏色　 →　 ② 圖形　 →　 ③ 顏色＋圖形',23));
        o.add(this.text(640,450,'泡泡太會動？按「慢慢玩」就能讓它停住。',19,'#72836d'));
        o.add(this.button(640,529,280,59,'開始找泡泡',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();}));
    }
    showStage(){
        this.mode='stage';const r=this.session.round;
        const o=this.makeOverlay(r.mode==='shape'?'接下來，認識圖形！':'最後，一起看兩個條件！',
            r.mode==='shape'?'這次的顏色都相同。\n看看圖卡是圓形、三角形還是星形。':'有些泡泡只有顏色相同，\n有些泡泡只有圖形相同。\n找出兩個都一樣的那一顆！');
        const sample=this.add.container(640,405);this.drawToken(sample,0,0,r.target,70);o.add(sample);
        o.add(this.button(640,523,270,60,'我準備好了',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';}));
    }
    pauseGame(){
        if(this.mode!=='playing')return;
        this.mode='paused';this.tweens.pauseAll();this.stopTones();
        const o=this.makeOverlay('休息一下，泡泡等你','看左邊圖卡，點右邊相同的泡泡。\n按 1／2／3 也可以選擇。\n「慢慢玩」停住泡泡，「小精靈提示」顯示答案。');
        o.add(this.button(640,405,280,56,'繼續遊戲',()=>this.resumeGame()));
        o.add(this.button(502,501,226,53,'重新開始',()=>this.restart(),0xe9d29a,'#675733'));
        o.add(this.button(778,501,226,53,'返回遊戲列表',()=>this.leave(),0xe4ecdc,'#31574b'));
    }
    finish(){
        this.mode='finished';this.tone('finish');const s=this.session;
        const o=this.makeOverlay('12 個泡泡任務完成！',`顏色、圖形、雙條件，都找到了！\n未用提示且一次找對：${s.independent} 題\n再試一次：${s.wrong} 次 · 使用提示：${s.hints} 題`);
        o.add(this.text(640,394,'試玩紀錄不寫入正式成就，也不消耗愛心。',19,'#72836d'));
        o.add(this.button(500,493,230,60,'再玩一次',()=>this.restart()));
        o.add(this.button(780,493,230,60,'返回遊戲列表',()=>this.leave(),0xe9d29a,'#675733'));
    }
}
