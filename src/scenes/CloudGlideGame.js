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
    }
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.overlay=null;
        this.mode='intro';this.session=new CloudGlideSession();this.holding=false;this.diving=false;
        this.velocity=0;this.stamina=100;this.boost=0;this.boostTimer=0;this.spawnClock=0;
        this.spawnIndex=0;this.invincible=0;this.flyers=[];this.elapsed=0;this.shield=false;
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
        this.panel(128,298,208,368,0xf9fdff,0xc7e5eb,23).setDepth(65);this.text(128,132,'飛行儀表',20,'#28576b').setDepth(66);
        this.progressText=this.text(128,178,'0 / 25',34,'#28576b').setDepth(66);this.healthText=this.text(128,222,'♥ ♥ ♥',23,'#d95d64').setDepth(66);
        this.text(42,253,'耐力',14,'#60808e',0).setDepth(66);this.add.rectangle(42,277,172,14,0xdce8ea).setOrigin(0,.5).setDepth(66);
        this.staminaFill=this.add.rectangle(42,277,172,14,0x58b99e).setOrigin(0,.5).setDepth(67);
        this.text(42,306,'風能',14,'#60808e',0).setDepth(66);this.add.rectangle(42,330,172,14,0xdce8ea).setOrigin(0,.5).setDepth(66);
        this.boostFill=this.add.rectangle(42,330,1,14,0xa77ee6).setOrigin(0,.5).setDepth(67);
        this.boostButton=this.button(96,391,96,58,'⚡',()=>this.activateBoost(),0x9a75d3).setDepth(67);this.boostButton.label.setFontSize(32);
        this.hintButton=this.button(180,391,54,58,'✦',()=>this.showHint(),0xe4b957,'#58482a').setDepth(67);this.hintButton.label.setFontSize(28);
        this.text(128,443,'爆發　　提示',13,'#66818d').setDepth(66);
        this.feedback=this.text(752,104,'按住上升，放開滑翔，右下按住俯衝蓄能。',18,'#315f74').setDepth(81);
        const zone=this.add.container(1166,603).setDepth(72),zg=this.add.graphics();
        zg.fillStyle(0x235c75,.68).fillRoundedRect(-67,-43,134,86,25);zg.lineStyle(3,0xffffff,.5).strokeRoundedRect(-67,-43,134,86,25);
        const diveKey=this.text(0,27,'↓ / S',11,'#d9f2f7').setAlpha(.48);
        zone.add([zg,this.text(0,-12,'▼',34,'#fff9e9'),this.text(0,13,'俯衝',15,'#fff9e9'),diveKey]).setSize(134,86).setInteractive({useHandCursor:true});
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
        const c=this.add.container(x,y),aura=this.add.ellipse(-8,10,176,84,0xffffff,.15),hero=this.add.image(0,0,'cloud_glide_ahchen_0').setDisplaySize(208,156);
        c.add([aura,hero]);c.hero=hero;
        this.tweens.add({targets:hero,y:-3,duration:760,ease:'Sine.InOut',yoyo:true,repeat:-1});
        this.tweens.add({targets:aura,scaleX:1.1,alpha:.06,duration:900,ease:'Sine.InOut',yoyo:true,repeat:-1});return c;
    }
    ringType(){
        const p=this.session.phase.ring;
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
        this.flyers.push(ring);this.spawnIndex+=1;const n=this.session.phase.hazard;
        if(n&&this.spawnIndex%n===0)this.spawnHazard(y<350?510:210,this.session.phaseIndex>=3&&this.spawnIndex%2===0);
        if(this.spawnIndex%8===0)this.spawnShield();
    }
    spawnHazard(y,storm){const c=this.drawCloud(1515,y,.96,storm).setDepth(38).setScale(storm?1.06:1);Object.assign(c,{kind:storm?'storm':'cloud',resolved:false});this.flyers.push(c);}
    spawnShield(){const c=this.add.container(1430,RING_Y[(this.spawnIndex+2)%RING_Y.length]).setDepth(40),orb=this.add.circle(0,0,25,0x7be3da,.55).setStrokeStyle(4,0xffffff);c.add([orb,this.text(0,0,'♥',22,'#ffffff')]);Object.assign(c,{kind:'shield',resolved:false});this.flyers.push(c);this.tweens.add({targets:orb,scale:1.2,alpha:.25,duration:500,yoyo:true,repeat:-1});}
    bindInput(){
        this.input.on('pointerdown',p=>{if(this.mode!=='playing'||p.y<=86||p.x<270)return;if(p.x>1000&&p.y>530)this.diving=true;else this.holding=true;});
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
        if(this.spawnClock>Math.max(980,1510-this.session.phaseIndex*95)&&this.flyers.filter(v=>v.kind==='ring'&&v.active).length<2){this.spawnClock=0;this.spawnRing();}
        this.flyers.forEach(v=>{v.x-=speed*dt;v.age=(v.age||0)+dt;if(v.kind==='ring'){if(v.moveAmp)v.y=v.baseY+Math.sin(v.age*v.moveSpeed)*v.moveAmp;if(!v.resolved)this.animateRing(v);this.checkRing(v);}else this.checkHazard(v);});
        this.flyers=this.flyers.filter(v=>{if(v.x<-170){v.destroy();return false;}return v.active;});
        this.backClouds.forEach(c=>{c.x-=c.speed*dt;if(c.x<-130)c.x=1400;});this.updateGuide();this.refreshMeters();
    }
    updateHeroFrame(){
        const frame=this.boostTimer>0?3:this.diving?2:this.holding?1:0;
        if(this.heroFrame===frame)return;this.heroFrame=frame;this.player.hero.setTexture('cloud_glide_ahchen_'+frame).setDisplaySize(208,156);
    }
    animateRing(r){
        const perspective=Phaser.Math.Clamp(.6+(1360-r.x)/1010*.4,.6,1);
        r.setScale(perspective);const frame=Math.floor(r.age*7)%4;
        if(frame!==r.animFrame){r.animFrame=frame;r.icon.setTexture('cloud_glide_ring_'+r.ringFamily+'_'+frame).setDisplaySize(r.artSize,r.artSize);}
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
            this.sparkles(r.x,r.y,COLORS[r.ringType]);this.scoreFloat(r.x,r.y,result.points,perfect,rare);this.fadeOut(r);this.refresh();if(result.phaseChanged&&!this.session.complete)this.announcePhase();if(result.result==='complete'){this.mode='finishing';this.time.delayedCall(650,()=>this.finish());}
        }else if(r.x<this.player.x-78){r.resolved=true;this.session.missRing();this.feedback.setText('漏圈，連擊歸零；調整高度追下一個！');this.tone('wrong');this.refresh();}
    }
    checkHazard(v){
        if(v.resolved)return;const hitX=Math.abs(v.x-this.player.x)<(v.kind==='shield'?50:82),hitY=Math.abs(v.y-this.player.y)<(v.kind==='shield'?46:54);if(!hitX||!hitY)return;
        v.resolved=true;if(v.kind==='shield'){this.shield=true;this.feedback.setText('取得晴空護盾：可抵擋一次雷雲！');this.tone('correct');this.sparkles(v.x,v.y,0x70ddd0);this.fadeOut(v);this.refresh();return;}
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
    finish(){this.mode='finished';this.holding=false;this.diving=false;this.tone('finish');const s=this.session,rank=s.score>=5200?'S':s.score>=4000?'A':s.score>=3000?'B':'C';const o=this.makeOverlay('航線完成・評級 '+rank,'阿晨晨穿越了全部 25 個風圈！\n總分 '+s.score+'　星光 '+s.stars+'　最高連擊 '+s.bestCombo+'\n漏圈 '+s.missed+'　碰撞 '+(s.cloudBumps+s.hits)+'　使用提示 '+s.hints);o.add(this.text(640,402,rank==='S'?'零失速級的天空王牌！':'從圈心與連擊下手，下一次可以刷新評級。',19,'#66818d'));o.add(this.button(500,490,230,58,'再飛一次',()=>this.restart(),0x397f98));o.add(this.button(780,490,230,58,'返回遊戲列表',()=>this.leave(),0xe4b957,'#58482a'));}
    restart(){this.tweens.resumeAll();this.scene.restart({returnScene:this.returnScene});}
    leave(){this.tweens.resumeAll();const target=this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub';if(this.scene.manager.keys[target])this.scene.start(target);}
}
