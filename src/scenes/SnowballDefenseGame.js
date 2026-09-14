import AnimalSnackGame from './AnimalSnackGame.js';
import { SnowballDefenseSession, SNOWBALL_CONFIG, SNOW_MONSTERS, snowballStage } from '../data/SnowballDefenseData.js';

export default class SnowballDefenseGame extends AnimalSnackGame {
    constructor() { super('SnowballDefenseGame'); }

    create() {
        this.sound.stopAll(); this.soundOn=true; this.audioNodes=new Set(); this.overlay=null;
        this.session=new SnowballDefenseSession(); this.mode='intro'; this.elapsed=0; this.spawnLeft=.8;
        this.enemies=[]; this.projectile=null; this.slow=false; this.hintEnemy=null; this.hintLeft=0;
        this.drawSnowField(); this.drawHud(); this.defender=this.drawDefender(212,382).setDepth(30);
        this.bindDefenseInput(); this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};
        this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{
            document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);
            this.input.keyboard?.off('keydown',this.keyHandler);this.stopTones();
        });
    }

    drawSnowField(){
        const g=this.add.graphics();
        g.fillGradientStyle(0x9bcfe3,0xcbeaf3,0xecf9fc,0xf9fdff,1).fillRect(0,0,1280,720);
        g.fillStyle(0xb7dce8,.75).fillTriangle(650,238,850,42,1045,238).fillTriangle(390,238,555,84,710,238);
        g.fillStyle(0xffffff,.94).fillTriangle(780,111,850,42,915,112).fillTriangle(500,136,555,84,610,136);
        g.fillStyle(0xf8fdff,1).fillRoundedRect(270,128,780,494,36);
        [303,460].forEach(y=>{g.lineStyle(4,0xd3ebf2,.9).lineBetween(280,y,1040,y);});
        g.fillStyle(0xd7edf3).fillRoundedRect(268,130,34,490,14);
        for(let i=0;i<18;i++){const x=25+(i*211)%1220,y=90+(i*83)%570;g.fillStyle(0xffffff,.58).fillCircle(x,y,3+i%4);}
        this.drawIgloo(103,382);
        this.snowbank=this.add.ellipse(286,382,67,470,0xffffff,.93).setStrokeStyle(4,0xc7e5ee,1).setDepth(18);
    }
    drawIgloo(x,y){
        const g=this.add.graphics();g.fillStyle(0xe6f5f8).fillCircle(x,y,92);g.fillRect(x-92,y,184,91);
        g.lineStyle(3,0xb4d9e4,.8);for(let i=0;i<4;i++)g.lineBetween(x-78,y-55+i*34,x+78,y-55+i*34);
        g.fillStyle(0x6aa7bd).fillRoundedRect(x+36,y+16,61,76,26);g.fillStyle(0x315b70,.75).fillRoundedRect(x+50,y+33,47,59,21);
        this.text(x,y+118,'冰晶小屋',17,'#4d7485');
    }

    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xd6edf4,19).setDepth(50);
        this.button(101,43,150,43,'← 遊戲列表',()=>this.leave(),0x397fa0).setDepth(51);
        this.text(430,41,'雪球防衛隊',31,'#28576c').setDepth(51);
        this.stageText=this.text(647,43,snowballStage(0).label,17,'#648595').setDepth(51);
        this.soundButton=this.button(952,43,116,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff4,'#28576c').setDepth(51);
        this.button(1103,43,154,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff4,'#28576c').setDepth(51);

        this.panel(1162,236,202,258,0xf9fdff,0xcde8f1,23);
        this.text(1162,137,'雪球任務',23,'#28576c');
        this.progressText=this.text(1162,183,'0 / 15',34,'#28576c');
        this.add.rectangle(1087,221,150,9,0xdbeef3).setOrigin(0,.5);
        this.progressFill=this.add.rectangle(1087,221,1,9,0x54b9d1).setOrigin(0,.5);
        this.comboText=this.text(1162,258,'連中 0',17,'#648595');
        this.slowButton=this.button(1162,319,158,44,'慢慢玩：關',()=>this.toggleSlow(),0xf0d783,'#5d552e');
        this.hintButton=this.button(1162,373,158,44,'幫我瞄準',()=>this.showHint(),0xdceff4,'#28576c');
        this.feedback=this.text(670,103,'點雪怪，自動丟雪球！',20,'#416b7d').setDepth(51);
        this.text(666,674,'直接點雪怪｜鍵盤 1／2／3 選上、中、下雪道｜每第 5 顆是大雪球',16,'#4f7687').setDepth(51);
    }

    drawDefender(x,y){
        const c=this.add.container(x,y),g=this.add.graphics();
        g.fillStyle(0xe89058).fillEllipse(0,10,83,103).fillCircle(0,-38,42);
        g.fillStyle(0xfff4df).fillEllipse(0,10,53,70).fillEllipse(0,-30,59,43);
        g.fillStyle(0xffffff).fillCircle(-14,-42,9).fillCircle(14,-42,9);
        g.fillStyle(0x334957).fillCircle(-13,-42,4).fillCircle(13,-42,4);
        g.fillStyle(0x334957).fillCircle(0,-28,6);g.lineStyle(3,0x8d5144).beginPath().arc(0,-20,13,.2,Math.PI-.2).strokePath();
        g.fillStyle(0x4e9eb9).fillRoundedRect(-47,-7,94,18,8);g.fillCircle(36,8,16);
        c.add(g);return c;
    }
    drawMonster(x,y,type){
        const c=this.add.container(x,y).setDepth(24),g=this.add.graphics();
        g.fillStyle(type.color).fillCircle(0,8,type.hp===2?48:42).fillCircle(0,-25,type.hp===2?34:31);
        g.lineStyle(3,0x78aab9,.85).strokeCircle(0,8,type.hp===2?48:42).strokeCircle(0,-25,type.hp===2?34:31);
        g.fillStyle(0x35586a).fillCircle(-11,-30,4).fillCircle(11,-30,4);
        g.fillStyle(0xf1a660).fillTriangle(0,-22,21,-15,0,-10);
        if(type.id==='blue'){g.fillStyle(0x5288b4).fillCircle(0,-48,29).fillRoundedRect(-34,-47,68,15,7);}
        if(type.id==='round'){g.fillStyle(0x9b6db2).fillRoundedRect(-45,-5,90,17,8);}
        c.add(g);c.setSize(104,112).setInteractive(new Phaser.Geom.Rectangle(-52,-56,104,112),Phaser.Geom.Rectangle.Contains);
        return c;
    }
    spawnEnemy(){
        const lane=Phaser.Math.Between(0,2);
        let index=0;if(this.session.defeated>=4&&Math.random()<.35)index=1;if(this.session.defeated>=8&&Math.random()<.28)index=2;
        const type=SNOW_MONSTERS[index],view=this.drawMonster(SNOWBALL_CONFIG.spawnX,SNOWBALL_CONFIG.lanes[lane],type);
        const enemy={view,lane,type,hp:type.hp,alive:true,returning:false};view.on('pointerdown',()=>this.shoot(enemy));
        this.enemies.push(enemy);
    }
    bindDefenseInput(){
        this.keyHandler=e=>{
            if(e.repeat)return;
            if(/^Digit[123]$/.test(e.code))this.shootLane(Number(e.code.slice(-1))-1);
            else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();
            else if(e.code==='KeyH')this.showHint();
        };this.input.keyboard?.on('keydown',this.keyHandler);
    }
    shootLane(lane){
        const targets=this.enemies.filter(e=>e.alive&&!e.returning&&e.lane===lane).sort((a,b)=>a.view.x-b.view.x);
        if(targets[0])this.shoot(targets[0]);else this.feedback.setText('這條雪道目前沒有雪怪喔～');
    }
    shoot(enemy){
        if(this.mode!=='playing'||this.projectile||!enemy?.alive||enemy.returning)return;
        this.clearHint();const kind=this.session.throwBall();
        const ball=this.add.circle(this.defender.x+45,this.defender.y-14,kind==='big'?25:17,kind==='big'?0x8ee8f2:0xffffff,1).setStrokeStyle(3,0x9fd4e0).setDepth(35);
        if(kind==='big')this.add.star(ball.x,ball.y,5,7,14,0xffdf78).setName('snowballStar').setDepth(36);
        this.projectile={view:ball,target:enemy,t:0,kind,startX:ball.x,startY:ball.y};this.tone('send');
        this.defender.y=SNOWBALL_CONFIG.lanes[enemy.lane];
        this.feedback.setText(kind==='big'?'亮晶晶大雪球出發！':'雪球出發！');
    }
    resolveHit(p){
        const e=p.target;if(!e.alive||e.returning){p.view.destroy();this.destroyBallStar();this.projectile=null;return;}
        const damage=p.kind==='big'?2:1;e.hp-=damage;this.session.hit(e.hp<=0);p.view.destroy();this.destroyBallStar();this.projectile=null;
        if(e.hp<=0){
            e.alive=false;e.view.disableInteractive();this.sparkle(e.view.x,e.view.y);this.tone('correct');
            this.tweens.add({targets:e.view,scale:1.4,alpha:0,duration:330,onComplete:()=>this.removeEnemy(e)});
            this.feedback.setText(`${e.type.name}變成雪花回家了！`);this.refreshProgress();
            if(this.session.finished){this.mode='finishing';this.time.delayedCall(550,()=>this.finishDefense());}
        }else{
            this.feedback.setText('圓滾雪怪還有一層厚厚的雪，再丟一次！');this.tone('hint');
            this.tweens.add({targets:e.view,x:e.view.x+45,duration:180,yoyo:true});this.refreshProgress();
        }
    }
    destroyBallStar(){const star=this.children.getByName('snowballStar');if(star)star.destroy();}
    removeEnemy(enemy){enemy.view?.destroy();const i=this.enemies.indexOf(enemy);if(i>=0)this.enemies.splice(i,1);}
    missEnemy(enemy){
        if(!enemy.alive||enemy.returning)return;enemy.returning=true;this.session.miss();this.refreshProgress();this.tone('hint');
        this.feedback.setText('雪堆把牠彈回去了，下一隻再瞄準！');
        this.tweens.add({targets:enemy.view,x:1090,angle:360,alpha:.15,duration:SNOWBALL_CONFIG.missReturnSeconds*1000,onComplete:()=>{enemy.alive=false;this.removeEnemy(enemy);}});
    }
    toggleSlow(){if(this.mode!=='playing')return;this.slow=!this.slow;this.slowButton.label.setText(this.slow?'慢慢玩：開':'慢慢玩：關');this.feedback.setText(this.slow?'雪怪走慢一點，慢慢瞄準～':'恢復原來速度，準備雪球！');}
    showHint(){
        if(this.mode!=='playing')return;this.clearHint();
        const enemy=this.enemies.filter(e=>e.alive&&!e.returning).sort((a,b)=>a.view.x-b.view.x)[0];
        if(!enemy){this.feedback.setText('雪怪還在路上，等一下就出現！');return;}
        this.hintEnemy=enemy;this.hintLeft=2.4;enemy.view.setScale(1.18);this.feedback.setText(`先點${['上','中','下'][enemy.lane]}雪道最靠近小屋的雪怪！`);this.tone('hint');
    }
    clearHint(){if(this.hintEnemy?.alive)this.hintEnemy.view.setScale(1);this.hintEnemy=null;this.hintLeft=0;}
    refreshProgress(){
        this.progressText.setText(`${this.session.defeated} / ${SNOWBALL_CONFIG.totalToFinish}`);
        this.progressFill.width=Math.max(1,150*this.session.defeated/SNOWBALL_CONFIG.totalToFinish);
        this.comboText.setText(`連中 ${this.session.combo}　漏接 ${this.session.missed}`);
        this.stageText.setText(snowballStage(this.session.defeated).label);
    }
    update(_time,delta){
        if(this.mode!=='playing')return;const dt=Math.max(0,Math.min(delta/1000,.05));this.elapsed+=dt;
        if(this.hintLeft>0){this.hintLeft-=dt;if(this.hintLeft<=0)this.clearHint();}
        const stage=snowballStage(this.session.defeated),scale=(this.slow?.64:1)*stage.speedScale;
        this.spawnLeft-=dt;if(this.spawnLeft<=0&&this.enemies.length<6){this.spawnEnemy();this.spawnLeft=stage.spawnSeconds*Phaser.Math.FloatBetween(.82,1.18);}
        this.enemies.forEach(e=>{if(e.alive&&!e.returning){e.view.x-=e.type.speed*scale*dt;e.view.y=SNOWBALL_CONFIG.lanes[e.lane]+Math.sin(this.elapsed*2+e.lane)*5;if(e.view.x<=SNOWBALL_CONFIG.defenseX)this.missEnemy(e);}});
        if(this.projectile){
            const p=this.projectile;if(!p.target.alive){p.view.destroy();this.destroyBallStar();this.projectile=null;return;}
            p.t=Math.min(1,p.t+dt/SNOWBALL_CONFIG.projectileSeconds);const t=p.t*p.t*(3-2*p.t);
            p.view.setPosition(Phaser.Math.Linear(p.startX,p.target.view.x,t),Phaser.Math.Linear(p.startY,p.target.view.y,t)-Math.sin(t*Math.PI)*38);
            const star=this.children.getByName('snowballStar');if(star)star.setPosition(p.view.x,p.view.y).setAngle(star.angle+dt*160);
            if(p.t>=1)this.resolveHit(p);
        }
    }
    showIntro(){
        const o=this.makeOverlay('雪球防衛隊集合！','雪怪想來冰晶小屋玩，點一下雪怪，狐狸就會自動丟雪球。\n每第 5 顆是亮晶晶大雪球，能打掉兩層厚雪。\n漏接也沒關係，門口雪堆會把雪怪安全彈回去。');
        o.add(this.drawDefender(510,421).setScale(.72));const sample=this.drawMonster(742,421,SNOW_MONSTERS[0]).setScale(.72);o.add(sample);
        o.add(this.text(640,490,'把 15 隻雪怪變回雪花，不限時間、不扣愛心。',18,'#678493'));
        o.add(this.button(640,548,275,58,'開始丟雪球！',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.sound.context?.resume?.();},0x397fa0));
    }
    pauseGame(){
        if(this.mode!=='playing')return;this.mode='paused';this.stopTones();
        const o=this.makeOverlay('休息一下，雪怪也停下來','直接點雪怪就會自動發射。\n鍵盤 1／2／3 分別選上、中、下雪道。\n「慢慢玩」降低速度，「幫我瞄準」標出最靠近小屋的雪怪。');
        o.add(this.button(640,405,270,55,'繼續防衛',()=>this.resumeGame(),0x397fa0));
        o.add(this.button(500,498,220,51,'重新開始',()=>this.restart(),0xf0d783,'#5d552e'));
        o.add(this.button(780,498,220,51,'返回遊戲列表',()=>this.leave(),0xdceff4,'#28576c'));
    }
    finishDefense(){
        if(this.mode==='finished')return;this.mode='finished';this.clearHint();this.enemies.forEach(e=>e.view.destroy());this.enemies=[];this.projectile?.view.destroy();this.projectile=null;this.destroyBallStar();this.tone('finish');
        const s=this.session,o=this.makeOverlay('雪球派對完成！',`15 隻雪怪都變回亮晶晶雪花了！\n丟出雪球：${s.throws} 顆　最高連中：${s.bestCombo}\n雪堆幫忙：${s.missed} 次`);
        o.add(this.text(640,397,'試玩紀錄不寫入正式存檔，也不消耗愛心。',18,'#678493'));
        o.add(this.button(500,492,230,59,'再玩一次',()=>this.restart(),0x397fa0));
        o.add(this.button(780,492,230,59,'返回遊戲列表',()=>this.leave(),0xf0d783,'#5d552e'));
    }
}
