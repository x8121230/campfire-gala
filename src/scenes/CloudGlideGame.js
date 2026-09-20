import AnimalSnackGame from './AnimalSnackGame.js';
import {CloudGlideSession,CLOUD_GLIDE_CONFIG,CLOUD_GLIDE_PHASES} from '../data/CloudGlideData.js';

const RING_Y=[215,405,535,290,470,175,375,555,245,445,145,340,520,235,425,185,490,305,570,255,445,160,365,535,280,470];
const ASSET='assets/cloud-glide/';
const COLORS={normal:0x9edaf1,moving:0x58cad0,precision:0x8ecded,gold:0xffcf55,rainbow:0xf48aac};

export default class CloudGlideGame extends AnimalSnackGame {
    constructor(){super('CloudGlideGame');}
    preload(){
        super.preload();
        if(!this.textures.exists('cloud_glide_sky'))this.load.image('cloud_glide_sky',ASSET+'sky-watercolor.jpg');
        ['glide-0','rise-1','dive-2','boost-3'].forEach((name,i)=>{const key='cloud_glide_ahchen_'+i;if(!this.textures.exists(key))this.load.image(key,ASSET+'ahchen-'+name+'.png');});
        ['cloud','gold','rainbow'].forEach(family=>{for(let i=0;i<4;i++){const key='cloud_glide_ring_'+family+'_'+i;if(!this.textures.exists(key))this.load.image(key,ASSET+family+'-ring-'+i+'.png');}});
        ['swift','sheep','whale','thick-cloud','storm-cloud','gust','shield'].forEach(family=>{for(let i=0;i<4;i++){const key='cloud_glide_art_'+family+'_'+i;if(!this.textures.exists(key))this.load.image(key,ASSET+family+'-'+i+'.png');}});
    }
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;
        this.mode='intro';this.session=new CloudGlideSession();this.holding=false;this.diving=false;
        this.velocity=0;this.stamina=100;this.boost=0;this.boostTimer=0;this.spawnClock=0;
        this.spawnIndex=0;this.invincible=0;this.flyers=[];this.elapsed=0;this.shield=false;
        this.route='';this.pendingBranch=false;this.spawnPaused=false;this.friendSpawned=new Set();this.boss=null;this.bossClock=0;
        this.drawSky();this.drawHud();this.player=this.drawAhChen(350,CLOUD_GLIDE_CONFIG.startY).setDepth(55);
        this.guideArrow=this.add.triangle(474,360,0,-14,29,0,0,14,0xffdc6e,.9).setDepth(54).setVisible(false);
        this.bindInput();this.showIntro();
        this.visibilityHandler=()=>{if(document.hidden&&this.mode==='playing')this.pauseGame();};
        this.blurHandler=()=>{if(this.mode==='playing')this.pauseGame();};
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyDownHandler);this.input.keyboard?.off('keyup',this.keyUpHandler);this.stopTones();});
    }
    drawSky(){
        this.add.image(640,360,'cloud_glide_sky').setDisplaySize(1280,720).setDepth(0);
        this.add.rectangle(640,360,1280,720,0xeefaff,.08).setDepth(1);
        this.backClouds=[];for(let i=0;i<7;i++){const c=this.drawCloud(80+i*205,145+(i%4)*135,.11).setDepth(4);c.speed=11+i%3*6;this.backClouds.push(c);}
    }
    drawHud(){
        this.panel(640,43,1248,66,0xf9fdff,0xc7e5eb,19).setDepth(80);
        this.button(96,43,142,43,'← 遊戲列表',()=>this.leave(),0x397f98).setDepth(81);
        this.text(365,40,'阿晨晨・雲端滑翔',29,'#28576b').setDepth(81);
        this.phaseText=this.text(665,43,'',16,'#658391').setDepth(81);
        this.soundButton=this.button(914,43,112,43,'音效：開',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xdceff2,'#28576b').setDepth(81);
        this.button(1081,43,162,43,'暫停 / 說明',()=>this.pauseGame(),0xdceff2,'#28576b').setDepth(81);
        this.panel(128,245,208,262,0xf9fdff,0xc7e5eb,23).setDepth(65);this.text(128,132,'飛行儀表',20,'#28576b').setDepth(66);
        this.progressText=this.text(128,178,'0 / 25',34,'#28576b').setDepth(66);this.healthText=this.text(128,222,'♥ ♥ ♥',23,'#d95d64').setDepth(66);
        this.text(42,253,'耐力',14,'#60808e',0).setDepth(66);this.add.rectangle(42,277,172,14,0xdce8ea).setOrigin(0,.5).setDepth(66);
        this.staminaFill=this.add.rectangle(42,277,172,14,0x58b99e).setOrigin(0,.5).setDepth(67);
        this.text(42,306,'風能',14,'#60808e',0).setDepth(66);this.add.rectangle(42,330,172,14,0xdce8ea).setOrigin(0,.5).setDepth(66);
        this.boostFill=this.add.rectangle(42,330,1,14,0xa77ee6).setOrigin(0,.5).setDepth(67);
        this.hintButton=this.button(212,347,48,42,'✦',()=>this.showHint(),0xe4b957,'#58482a').setDepth(67);this.hintButton.label.setFontSize(23);
        this.text(118,347,'航線提示',13,'#66818d').setDepth(66);
        this.feedback=this.text(752,104,'按住上升，放開滑翔，右下按住俯衝蓄能。',18,'#315f74').setDepth(81);
        this.boostButton=this.button(1032,613,126,86,'⚡',()=>this.activateBoost(),0x9a75d3).setDepth(72);this.boostButton.label.setFontSize(34);
        this.text(1032,652,'風能爆發',13,'#fff9e9').setDepth(73);this.text(1078,583,'X',10,'#eee7fa').setAlpha(.48).setDepth(73);
        const zone=this.add.container(1178,613).setDepth(72),zg=this.add.graphics();
        zg.fillStyle(0x235c75,.76).fillRoundedRect(-63,-43,126,86,25);zg.lineStyle(3,0xffffff,.5).strokeRoundedRect(-63,-43,126,86,25);
        const diveKey=this.text(0,27,'↓ / S',11,'#d9f2f7').setAlpha(.48);
        zone.add([zg,this.text(0,-12,'▼',34,'#fff9e9'),this.text(0,13,'俯衝',15,'#fff9e9'),diveKey]).setSize(126,86).setInteractive({useHandCursor:true});
        zone.on('pointerdown',()=>{if(this.mode==='playing')this.diving=true;});zone.on('pointerup',()=>this.diving=false).on('pointerout',()=>this.diving=false);this.diveZone=zone;
        this.refresh();
    }
    drawCloud(x,y,alpha=1,storm=false){
        const c=this.add.container(x,y),g=this.add.graphics(),base=storm?0x59627f:0xffffff,shade=storm?0x343a58:0xcce9ef;
        g.fillStyle(base,alpha).fillEllipse(0,10,145,65).fillCircle(-47,-7,35).fillCircle(0,-25,49).fillCircle(49,-5,37);
        g.fillStyle(shade,alpha*.72).fillEllipse(5,28,126,27);
        if(storm)g.fillStyle(0xffdb58,1).fillTriangle(-8,25,16,25,1,53).fillTriangle(1,47,22,47,-9,82);
        c.add(g);return c;
    }
    drawAhChen(x,y){
        const c=this.add.container(x,y),aura=this.add.ellipse(-8,10,158,76,0xffffff,.15),hero=this.add.image(0,0,'cloud_glide_ahchen_0').setDisplaySize(187,140);
        c.add([aura,hero]);c.hero=hero;
        this.tweens.add({targets:hero,y:-3,duration:760,ease:'Sine.InOut',yoyo:true,repeat:-1});
        this.tweens.add({targets:aura,scaleX:1.1,alpha:.06,duration:900,ease:'Sine.InOut',yoyo:true,repeat:-1});return c;
    }
    ringType(){
        const p=this.session.phase.ring;
        if(this.route==='high'&&this.spawnIndex%4===1)return 'gold';
        if(this.route==='rainbow'&&this.spawnIndex%4===2)return 'rainbow';
        if(p==='mixed')return ['moving','gold','rainbow','precision','normal'][this.spawnIndex%5];
        if(p==='rainbow')return this.spawnIndex%3===0?'rainbow':'precision';
        if(this.spawnIndex>2&&this.spawnIndex%7===5)return 'gold';
        return p;
    }
    drawRing(x,y,type){
        const radius=type==='precision'?49:CLOUD_GLIDE_CONFIG.ringRadius,color=COLORS[type]||COLORS.normal,c=this.add.container(x,y).setDepth(35);
        const family=type==='gold'?'gold':type==='rainbow'?'rainbow':'cloud',key='cloud_glide_ring_'+family+'_0';
        const glow=this.add.circle(0,0,radius+25,color,.17),ringArt=this.add.image(0,0,key).setDisplaySize(radius*3.75,radius*3.75);
        const label=(type==='gold'||type==='rainbow')?this.text(0,-radius-49,type==='gold'?'稀有金圈':'彩虹爆發圈',14,type==='gold'?'#8b661d':'#8a4b87'):null;
        c.add(label?[glow,ringArt,label]:[glow,ringArt]);Object.assign(c,{kind:'ring',ringType:type,ringFamily:family,radius,resolved:false,icon:ringArt,baseY:y,age:0,artSize:radius*3.75,animFrame:-1});
        c.setScale(.6);this.tweens.add({targets:glow,scale:1.16,alpha:.03,duration:680,yoyo:true,repeat:-1});return c;
    }
    spawnRing(){
        const y=RING_Y[this.spawnIndex%RING_Y.length],type=this.ringType(),ring=this.drawRing(1360,y,type);
        if(type==='moving'){ring.moveAmp=75;ring.moveSpeed=1.7+(this.spawnIndex%3)*.25;}
        this.flyers.push(ring);this.spawnIndex+=1;let n=this.session.phase.hazard;if(this.route==='safe'&&n)n+=2;if(this.route==='high'&&n)n=Math.max(1,n-1);
        if(n&&this.spawnIndex%n===0)this.spawnHazard(y<350?510:210,this.session.phaseIndex>=3&&this.spawnIndex%2===0);
        if(this.spawnIndex%8===0)this.spawnShield();
    }
    spriteArt(family,width,height){return this.add.image(0,0,'cloud_glide_art_'+family+'_0').setDisplaySize(width,height);}
    spawnHazard(y,storm){const family=storm?'storm-cloud':'thick-cloud',c=this.add.container(1515,y).setDepth(38),art=this.spriteArt(family,220,294);c.add(art);Object.assign(c,{kind:storm?'storm':'cloud',resolved:false,art,artFamily:family,artFrame:-1,artWidth:220,artHeight:294,age:0});this.flyers.push(c);}
    spawnShield(){const c=this.add.container(1430,RING_Y[(this.spawnIndex+2)%RING_Y.length]).setDepth(40),art=this.spriteArt('shield',112,149);c.add(art);Object.assign(c,{kind:'shield',resolved:false,art,artFamily:'shield',artFrame:-1,artWidth:112,artHeight:149,age:0});this.flyers.push(c);}
    bindInput(){
        this.input.on('pointerdown',p=>{if(this.mode!=='playing'||p.y<=86||p.x<270)return;if(p.x>955&&p.y>550)return;this.holding=true;});
        this.input.on('pointerup',()=>{this.holding=false;this.diving=false;});
        this.keyDownHandler=e=>{if(e.repeat)return;if(['Space','ArrowUp','KeyW'].includes(e.code)&&this.mode==='playing')this.holding=true;else if(['ArrowDown','KeyS'].includes(e.code)&&this.mode==='playing')this.diving=true;else if(e.code==='KeyX')this.activateBoost();else if(e.code==='KeyH')this.showHint();else if(e.code==='Escape'||e.code==='KeyP')this.mode==='paused'?this.resumeGame():this.pauseGame();};
        this.keyUpHandler=e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))this.holding=false;if(['ArrowDown','KeyS'].includes(e.code))this.diving=false;};
        this.input.keyboard?.on('keydown',this.keyDownHandler);this.input.keyboard?.on('keyup',this.keyUpHandler);
    }
    activateBoost(){
        if(this.mode!=='playing')return;if(this.boost<35){this.feedback.setText('風能至少 35 才能爆發；先俯衝蓄能！');this.tone('hint');return;}
        this.boost=Math.max(0,this.boost-35);this.boostTimer=1.35;this.invincible=Math.max(this.invincible,.35);
        this.feedback.setText('風能爆發！鎖定彩虹圈！');this.tone('correct');this.sparkles(this.player.x,this.player.y,0xf48aac);this.refresh();
    }
    update(_time,delta){
        if(this.mode!=='playing')return;const dt=Math.min(.04,delta/1000);this.elapsed+=dt;this.invincible=Math.max(0,this.invincible-dt);this.boostTimer=Math.max(0,this.boostTimer-dt);
        if(this.holding&&this.stamina>0){this.velocity-=570*dt;this.stamina=Math.max(0,this.stamina-27*dt);}else{this.velocity+=335*dt;this.stamina=Math.min(100,this.stamina+(this.diving?8:19)*dt);}
        if(this.diving){this.velocity+=440*dt;this.boost=Math.min(100,this.boost+25*dt);}if(this.stamina<=0&&this.holding){this.holding=false;this.feedback.setText('耐力耗盡！放開滑翔就會恢復。');}
        if(this.session.phaseIndex>=2)this.velocity+=Math.sin(this.elapsed*1.7)*34*dt;
        this.velocity=Phaser.Math.Clamp(this.velocity,-235,this.diving?295:210);this.player.y+=this.velocity*dt;this.assistToRing(dt);this.updateHeroFrame();
        if(this.player.y<CLOUD_GLIDE_CONFIG.minY){this.player.y=CLOUD_GLIDE_CONFIG.minY;this.velocity=75;this.breakCombo('擦過高空亂流，連擊中斷。');}
        if(this.player.y>CLOUD_GLIDE_CONFIG.maxY){this.player.y=CLOUD_GLIDE_CONFIG.maxY;this.velocity=-95;this.breakCombo('貼近地面太久，連擊中斷。');}
        this.player.angle=Phaser.Math.Clamp(this.velocity*.055,-13,16);this.player.setScale(this.boostTimer>0?1.06:1);
        const speed=this.session.phase.speed+(this.diving?55:0)+(this.boostTimer>0?175:0);this.spawnClock+=delta;
        if(this.pendingBranch&&!this.flyers.some(v=>v.active&&v.kind==='ring'&&!v.resolved)){this.pendingBranch=false;this.spawnBranchChoice();}
        if(!this.spawnPaused&&this.spawnClock>Math.max(980,1510-this.session.phaseIndex*95)&&this.flyers.filter(v=>v.kind==='ring'&&v.active).length<2){this.spawnClock=0;this.spawnRing();}
        this.flyers.forEach(v=>{v.x-=(v.ownSpeed||speed)*dt;v.age=(v.age||0)+dt;if(v.kind==='ring'){if(v.moveAmp)v.y=v.baseY+Math.sin(v.age*v.moveSpeed)*v.moveAmp;if(!v.resolved)this.animateRing(v);this.checkRing(v);}else if(v.kind==='branch')this.checkBranch(v);else if(v.kind==='friend'){this.animateArt(v);this.checkFriend(v);}else{this.animateArt(v);this.checkHazard(v);}});
        this.flyers=this.flyers.filter(v=>{if(v.x<-170){v.destroy();return false;}return v.active;});
        this.backClouds.forEach(c=>{c.x-=c.speed*dt;if(c.x<-130)c.x=1400;});this.updateBoss(dt);this.updateGuide();this.refreshMeters();
    }
    updateHeroFrame(){
        const frame=this.boostTimer>0?3:this.diving?2:this.holding?1:0;
        if(this.heroFrame===frame)return;this.heroFrame=frame;this.player.hero.setTexture('cloud_glide_ahchen_'+frame).setDisplaySize(187,140);
    }
    animateRing(r){
        const perspective=Phaser.Math.Clamp(.6+(1360-r.x)/1010*.4,.6,1);
        r.setScale(perspective);const frame=Math.floor(r.age*7)%4;
        if(frame!==r.animFrame){r.animFrame=frame;r.icon.setTexture('cloud_glide_ring_'+r.ringFamily+'_'+frame).setDisplaySize(r.artSize,r.artSize);}
    }
    animateArt(v,fps=6){
        if(!v?.art||!v.artFamily)return;const frame=Math.floor((v.age||0)*fps)%4;if(frame===v.artFrame)return;
        v.artFrame=frame;v.art.setTexture('cloud_glide_art_'+v.artFamily+'_'+frame).setDisplaySize(v.artWidth,v.artHeight);
    }
    assistToRing(dt){
        const r=this.flyers.filter(v=>v.active&&v.kind==='ring'&&!v.resolved&&v.x>this.player.x+25&&v.x<this.player.x+225).sort((a,b)=>a.x-b.x)[0];
        if(!r)return;const dy=r.y-this.player.y;if(Math.abs(dy)>r.radius+44)return;
        const pull=(1-(r.x-this.player.x-25)/200)*2.15;this.player.y+=dy*dt*Math.max(.35,pull);this.velocity+=dy*dt*.75;
        this.magnetFxClock=(this.magnetFxClock||0)+dt;if(this.magnetFxClock>.16){this.magnetFxClock=0;const w=this.add.ellipse(this.player.x+80,this.player.y+Phaser.Math.Between(-32,32),24,5,0xdff9ff,.55).setDepth(49);this.tweens.add({targets:w,x:this.player.x+20,alpha:0,duration:260,onComplete:()=>w.destroy()});}
    }
    checkRing(r){
        if(r.resolved)return;const dx=Math.abs(r.x-this.player.x),dy=Math.abs(r.y-this.player.y);
        if(dx<45&&dy<r.radius){
            r.resolved=true;if(r.ringType==='rainbow'&&this.boostTimer<=0){this.session.missRing();this.feedback.setText('彩虹圈需要先發動風能爆發！');this.tone('wrong');this.fadeOut(r);this.refresh();return;}
            const perfect=dy<r.radius*.34,rare=r.ringType==='gold'?'gold':r.ringType==='rainbow'?'rainbow':'',result=this.session.passRing({perfect,boost:r.ringType==='rainbow',rare});
            this.stamina=Math.min(100,this.stamina+(rare?35:perfect?22:12));this.boost=Math.min(100,this.boost+(r.ringType==='gold'?30:perfect?20:10));if(r.ringType==='rainbow')this.shield=true;
            r.icon.setVisible(false);this.tone('correct');this.feedback.setText((rare==='rainbow'?'彩虹護盾！':rare==='gold'?'稀有金圈！':perfect?'完美穿心！':'穿圈成功！')+' +'+result.points+'　連擊 ×'+this.session.combo);
            this.sparkles(r.x,r.y,COLORS[r.ringType]);this.scoreFloat(r.x,r.y,result.points,perfect,rare);this.fadeOut(r);this.refresh();this.maybeSpawnFriend();if(result.phaseChanged&&!this.session.complete){this.announcePhase();this.queueBranch();if(this.session.phaseIndex===4)this.spawnBoss();}if(result.result==='complete'){this.mode='finishing';this.time.delayedCall(650,()=>this.finish());}
        }else if(r.x<this.player.x-78){r.resolved=true;this.session.missRing();this.feedback.setText('漏圈，連擊歸零；調整高度追下一個！');this.tone('wrong');this.refresh();}
    }
    queueBranch(){
        if(![1,3].includes(this.session.phaseIndex))return;
        this.pendingBranch=true;this.spawnPaused=true;this.feedback.setText('前方航線分岔！選擇上方或下方的雲門。');
    }
    spawnBranchChoice(){
        const late=this.session.phaseIndex===3,defs=late?
            [{y:225,id:'high',name:'雷雲高空',sub:'金圈多・危險高',family:'gold'},{y:500,id:'rainbow',name:'彩虹低谷',sub:'彩虹圈・風能考驗',family:'rainbow'}]:
            [{y:225,id:'high',name:'星光捷徑',sub:'金圈多・節奏快',family:'gold'},{y:500,id:'safe',name:'柔雲航道',sub:'厚雲少・較安全',family:'cloud'}];
        this.branchGroup='branch_'+this.session.rings;
        defs.forEach(d=>{const c=this.add.container(1360,d.y).setDepth(42),art=this.add.image(0,0,'cloud_glide_ring_'+d.family+'_0').setDisplaySize(222,222),card=this.panel(0,0,154,64,0xfffdf1,0xb7d4d8,15).setAlpha(.9),title=this.text(0,-11,d.name,18,'#315f74'),sub=this.text(0,16,d.sub,12,'#6b8290');c.add([art,card,title,sub]);Object.assign(c,{kind:'branch',branchId:d.id,group:this.branchGroup,resolved:false,ownSpeed:190});this.flyers.push(c);this.tweens.add({targets:art,scale:1.06,duration:620,yoyo:true,repeat:-1});});
    }
    checkBranch(v){
        if(v.resolved)return;
        if(Math.abs(v.x-this.player.x)<52&&Math.abs(v.y-this.player.y)<100){this.chooseBranch(v);return;}
        if(v.x<this.player.x-55){const choices=this.flyers.filter(x=>x.active&&x.kind==='branch'&&!x.resolved&&x.group===v.group).sort((a,b)=>Math.abs(a.y-this.player.y)-Math.abs(b.y-this.player.y));if(choices[0])this.chooseBranch(choices[0]);}
    }
    chooseBranch(chosen){
        if(chosen.resolved)return;this.route=chosen.branchId;this.spawnPaused=false;this.spawnClock=0;
        const names={high:'星光捷徑',safe:'柔雲航道',rainbow:'彩虹低谷'};this.feedback.setText('進入「'+names[this.route]+'」！');
        this.flyers.filter(v=>v.kind==='branch'&&v.group===chosen.group).forEach(v=>{v.resolved=true;this.tweens.add({targets:v,alpha:0,scale:1.25,duration:350,onComplete:()=>v.destroy()});});
        this.tone('correct');this.sparkles(this.player.x+70,this.player.y,this.route==='rainbow'?0xf48aac:0xffcf55);
    }
    maybeSpawnFriend(){
        const map={8:'swift',13:'sheep',18:'swift'},type=map[this.session.rings];if(!type||this.friendSpawned.has(this.session.rings))return;
        this.friendSpawned.add(this.session.rings);this.time.delayedCall(650,()=>this.spawnSkyFriend(type));
    }
    drawFriend(x,y,type){
        const c=this.add.container(x,y).setDepth(44),art=this.spriteArt(type,168,224),label=this.text(0,65,type==='swift'?'小雨燕・航線提示':'雲朵綿羊・回滿耐力',13,'#315f74');
        c.add([art,label]);Object.assign(c,{art,artFamily:type,artFrame:-1,artWidth:168,artHeight:224,age:0});return c;
    }
    spawnSkyFriend(type){if(this.mode!=='playing')return;const y=Phaser.Math.Clamp(this.player.y+Phaser.Math.Between(-110,110),160,570),c=this.drawFriend(1430,y,type);Object.assign(c,{kind:'friend',friendType:type,resolved:false,ownSpeed:205});this.flyers.push(c);}
    checkFriend(v){
        if(v.resolved)return;if(Math.abs(v.x-this.player.x)<58&&Math.abs(v.y-this.player.y)<60){v.resolved=true;
            if(v.friendType==='swift'){this.guideUntil=this.elapsed+6;this.feedback.setText('小雨燕陪飛 6 秒，幫忙尋找下一個風圈！');this.addFollower('swift');}
            else{this.stamina=100;this.feedback.setText('雲朵綿羊送來柔風，耐力完全恢復！');this.addFollower('sheep');}
            this.tone('correct');this.sparkles(v.x,v.y,0x7bd3dd);this.fadeOut(v);
        }
    }
    addFollower(type){
        this.companion?.destroy();this.companion=this.drawFriend(this.player.x-92,this.player.y-67,type).setScale(.62).setDepth(54);this.companion.list[this.companion.list.length-1].setVisible(false);this.companionUntil=this.elapsed+6;this.companionLeaving=false;
    }
    spawnBoss(){
        if(this.boss)return;const c=this.add.container(1370,235).setDepth(18),art=this.spriteArt('whale',370,493),label=this.text(0,115,'暴風雲鯨・航線守護者',16,'#315f74');
        c.add([art,label]);Object.assign(c,{art,artFamily:'whale',artFrame:0,artWidth:370,artHeight:493,age:0});this.boss=c;this.tweens.add({targets:c,x:1085,duration:1500,ease:'Sine.Out'});this.feedback.setText('暴風雲鯨出現！觀察牠吹出的上下氣流。');
    }
    updateBoss(dt){
        if(this.companion){this.companion.age+=dt;this.animateArt(this.companion);if(this.elapsed>=this.companionUntil&&!this.companionLeaving){this.companionLeaving=true;const leaving=this.companion;this.tweens.add({targets:leaving,alpha:0,x:this.player.x-150,duration:350,onComplete:()=>{leaving.destroy();if(this.companion===leaving)this.companion=null;}});}else if(!this.companionLeaving){this.companion.x+=(this.player.x-92-this.companion.x)*dt*7;this.companion.y+=(this.player.y-67-this.companion.y)*dt*7;}}
        if(!this.boss||this.session.phaseIndex<4)return;this.boss.y=235+Math.sin(this.elapsed*1.15)*68;this.boss.age+=dt;
        const sinceBlow=this.elapsed-(this.bossBlowAt||-99),frame=sinceBlow<.34?2:sinceBlow<.75?3:Math.floor(this.boss.age*1.7)%2;if(frame!==this.boss.artFrame){this.boss.artFrame=frame;this.boss.art.setTexture('cloud_glide_art_whale_'+frame).setDisplaySize(this.boss.artWidth,this.boss.artHeight);}
        this.bossClock+=dt;if(this.bossClock>3.1){this.bossClock=0;this.spawnBossGust();}
    }
    spawnBossGust(){
        this.bossBlowAt=this.elapsed;const y=Phaser.Math.Clamp(this.boss.y+Phaser.Math.Between(-105,105),150,565),push=y<360?185:-185,c=this.add.container(1080,y).setDepth(39),art=this.spriteArt('gust',156,208),arrow=this.text(0,0,push>0?'↓':'↑',23,'#ffffff').setStroke('#4a8098',3);
        c.add([art,arrow]);Object.assign(c,{kind:'gust',resolved:false,ownSpeed:390,push,art,artFamily:'gust',artFrame:-1,artWidth:156,artHeight:208,age:0});this.flyers.push(c);
    }
    checkHazard(v){
        if(v.resolved)return;const hitX=Math.abs(v.x-this.player.x)<(v.kind==='shield'?50:82),hitY=Math.abs(v.y-this.player.y)<(v.kind==='shield'?46:54);if(!hitX||!hitY)return;
        v.resolved=true;if(v.kind==='shield'){this.shield=true;this.feedback.setText('取得晴空護盾：可抵擋一次雷雲！');this.tone('correct');this.sparkles(v.x,v.y,0x70ddd0);this.fadeOut(v);this.refresh();return;}
        if(v.kind==='gust'){this.velocity=v.push;this.invincible=.45;this.feedback.setText(v.push>0?'雲鯨下沉氣流：放開滑翔修正！':'雲鯨上升氣流：準備俯衝修正！');this.tone('hint');this.fadeOut(v);return;}
        if(this.invincible>0)return;this.invincible=1.25;this.velocity=v.y>this.player.y?-145:145;
        if(v.kind==='storm'){if(this.shield){this.shield=false;this.feedback.setText('護盾擋下雷雲！');}else{this.session.damage();this.feedback.setText('遭雷雲命中，損失一格機體！');this.tone('wrong');}}
        else{this.session.bumpCloud();this.feedback.setText('撞上厚雲減速，連擊中斷。');this.tone('hint');}
        this.tweens.add({targets:this.player,x:this.player.x-20,angle:-14,duration:110,yoyo:true,repeat:2});this.fadeOut(v);this.refresh();if(this.session.health<=0){this.mode='failed';this.time.delayedCall(450,()=>this.fail());}
    }
    breakCombo(message){if(this.session.combo>0){this.session.combo=0;this.feedback.setText(message);this.refresh();}}
    fadeOut(v){this.tweens.add({targets:v,scale:1.32,alpha:0,duration:360,onComplete:()=>v.destroy()});}
    updateGuide(){const r=this.flyers.filter(v=>v.active&&v.kind==='ring'&&!v.resolved&&v.x>this.player.x).sort((a,b)=>a.x-b.x)[0];if(!r||this.guideUntil<this.elapsed){this.guideArrow.setVisible(false);return;}this.guideArrow.setVisible(true).setPosition(474,this.player.y);this.guideArrow.rotation=Phaser.Math.Angle.Between(474,this.player.y,r.x,r.y);}
    showHint(){if(this.mode!=='playing'||!this.session.hint())return;this.guideUntil=this.elapsed+3;this.feedback.setText('金色箭頭會追蹤下一個風圈 3 秒。');this.tone('hint');this.refresh();}
    announcePhase(){this.feedback.setText('航線升級：'+this.session.phase.name+'！');const t=this.text(765,310,this.session.phase.name,38,'#fff9df').setDepth(90).setStroke('#28576b',6).setScale(.7);this.tweens.add({targets:t,scale:1.2,alpha:0,y:270,duration:1500,ease:'Back.Out',onComplete:()=>t.destroy()});}
    refreshMeters(){if(!this.staminaFill)return;this.staminaFill.width=Math.max(1,172*this.stamina/100);this.boostFill.width=Math.max(1,172*this.boost/100);this.boostButton?.setAlpha(this.boost>=35?1:.62);}
    refresh(){const s=this.session;this.progressText?.setText(s.rings+' / '+CLOUD_GLIDE_CONFIG.targetRings);this.scoreText?.setText('分數 '+s.score);this.comboText?.setText('COMBO × '+s.combo);this.healthText?.setText('♥ '.repeat(s.health)+'♡ '.repeat(3-s.health)+(this.shield?'  ◈':''));this.phaseText?.setText('第 '+(s.phaseIndex+1)+' / '+CLOUD_GLIDE_PHASES.length+' 段・'+s.phase.name);this.tipText?.setText(s.phase.guide+'\n\n漏圈 '+s.missed+'　碰撞 '+(s.cloudBumps+s.hits)+'\n最高連擊 '+s.bestCombo);this.refreshMeters();}
    sparkles(x,y,color=0xffd85d){for(let i=0;i<12;i++){const s=this.add.star(x,y,5,3,9,i%3?color:0xffffff).setDepth(75),a=i/12*Math.PI*2;this.tweens.add({targets:s,x:x+Math.cos(a)*100,y:y+Math.sin(a)*76,alpha:0,angle:170,duration:520,onComplete:()=>s.destroy()});}}
    scoreFloat(x,y,points,perfect,rare){
        const color=rare==='rainbow'?'#ef76bf':rare==='gold'?'#d99c18':perfect?'#338ba7':'#ffffff',t=this.text(x,y-18,'+'+points,perfect||rare?25:19,color).setDepth(92).setStroke('#ffffff',3);
        this.tweens.add({targets:t,y:y-92,scale:1.15,alpha:0,duration:850,ease:'Cubic.Out',onComplete:()=>t.destroy()});
        for(let i=0;i<7;i++){const b=this.add.circle(x,y,5+i%3,COLORS[rare||'normal'],.38).setDepth(74).setStrokeStyle(1,0xffffff,.55),a=i/7*Math.PI*2;this.tweens.add({targets:b,x:x+Math.cos(a)*70,y:y+Math.sin(a)*55,scale:1.8,alpha:0,duration:650,onComplete:()=>b.destroy()});}
    }
    showStartHints(){
        const c=this.add.container(720,345).setDepth(95);
        const items=[[-190,'☝','按住上升'],[0,'〰','放開滑翔'],[190,'▼','按住俯衝']];
        items.forEach(item=>{const bg=this.add.circle(item[0],0,53,0xffffff,.78).setStrokeStyle(3,0x8fc9d5,.7),icon=this.text(item[0],-7,item[1],34,'#32738b'),label=this.text(item[0],59,item[2],15,'#315f74');c.add([bg,icon,label]);this.tweens.add({targets:icon,y:-13,duration:460,yoyo:true,repeat:4});});
        this.time.delayedCall(2800,()=>this.tweens.add({targets:c,alpha:0,y:325,duration:500,onComplete:()=>c.destroy()}));
        this.time.delayedCall(3400,()=>{if(this.feedback.text==='按住上升，放開滑翔，右下按住俯衝蓄能。')this.feedback.setText('');});
    }
    showIntro(){const o=this.makeOverlay('阿晨晨的雲海冒險','穿越 25 個水彩雲圈，完成五段童話航線。\n偶爾出現的金圈可獲得高分與大量風能；彩虹圈則要先發動風能爆發，\n成功穿越會補滿耐力並獲得一次晴空護盾。');o.add(this.text(640,409,'按住上升、放開滑翔回耐力；右下俯衝蓄能，風能達 35 後即可爆發。',17,'#66818d'));o.add(this.button(640,493,290,60,'阿晨晨，飛進雲海！',()=>{o.destroy();this.overlay=null;this.mode='playing';this.guideUntil=-1;this.sound.context?.resume?.();this.showStartHints();this.time.delayedCall(450,()=>this.spawnRing());},0x397f98));}
    pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.holding=false;this.diving=false;this.tweens.pauseAll();this.stopTones();const o=this.makeOverlay('暫停：高空飛行手冊','按住畫面／空白鍵／↑：上升並消耗耐力\n放開：滑翔下降並恢復耐力　按住右下／↓／S：俯衝蓄風能\nX：風能爆發　H：航線提示　P／Esc：暫停');o.add(this.button(500,472,230,55,'繼續航線',()=>this.resumeGame(),0x397f98));o.add(this.button(780,472,230,55,'重新開始',()=>this.restart(),0xe4b957,'#58482a'));o.add(this.button(640,543,230,49,'返回遊戲列表',()=>this.leave(),0xdceff2,'#28576b'));}
    resumeGame(){if(this.mode!=='paused')return;this.overlay?.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}
    fail(){this.holding=false;this.diving=false;const o=this.makeOverlay('阿晨晨迫降休整','機體耐久耗盡，這次航線先在雲海平台降落。\n保留飛行技巧，再挑戰一次就能飛得更遠。');o.add(this.button(500,474,235,58,'重新挑戰',()=>this.restart(),0x397f98));o.add(this.button(780,474,235,58,'返回遊戲列表',()=>this.leave(),0xe4b957,'#58482a'));}
    finish(){this.mode='finished';this.holding=false;this.diving=false;this.tone('finish');if(this.boss)this.tweens.add({targets:this.boss,x:1390,alpha:0,duration:900});const s=this.session,rank=s.score>=5200?'S':s.score>=4000?'A':s.score>=3000?'B':'C';const o=this.makeOverlay('航線完成・評級 '+rank,'阿晨晨穿越了全部 25 個風圈！\n總分 '+s.score+'　星光 '+s.stars+'　最高連擊 '+s.bestCombo+'\n漏圈 '+s.missed+'　碰撞 '+(s.cloudBumps+s.hits)+'　使用提示 '+s.hints);o.add(this.text(640,402,rank==='S'?'零失速級的天空王牌！':'從圈心與連擊下手，下一次可以刷新評級。',19,'#66818d'));o.add(this.button(500,490,230,58,'再飛一次',()=>this.restart(),0x397f98));o.add(this.button(780,490,230,58,'返回遊戲列表',()=>this.leave(),0xe4b957,'#58482a'));}
    restart(){this.tweens.resumeAll();this.scene.restart({returnScene:this.returnScene});}
    leave(){this.tweens.resumeAll();const target=this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub';if(this.scene.manager.keys[target])this.scene.start(target);}
}
