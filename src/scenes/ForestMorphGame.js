import AnimalSnackGame from './AnimalSnackGame.js';
import {MorphSession,compileMorphLevel,MORPH_FORMS,moverAt,rockAt} from '../data/MorphRules.js';
import {MORPH_LEVELS,MORPH_CHAPTERS} from '../data/MorphLevels.js';

const THEMES=[{sky:0xffffff,soil:0x76654e,grass:0x6eac77},{sky:0xffe9e7,soil:0x776176,grass:0x96b38a},{sky:0xdaefff,soil:0x657781,grass:0x79bba6},{sky:0xe5deff,soil:0x676482,grass:0x8db39b}];
export default class ForestMorphGame extends AnimalSnackGame{
    constructor(){super('ForestMorphGame');}
    preload(){
        if(!this.textures.exists('morph_forest'))this.load.image('morph_forest','assets/forest-morph/forest.png');
        if(!this.textures.exists('morph_sprites'))this.load.spritesheet('morph_sprites','assets/forest-morph/sprites.png',{frameWidth:512,frameHeight:512});
    }
    art(x,y,frame,size=64){return this.add.image(x,y,'morph_sprites',frame).setDisplaySize(size,size);}
    text(x,y,t,size=22,color='#294f4d',origin=.5){return super.text(x,y,t,size,color,origin);}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.records=this.records||{};this.session=null;this.mode='select';this.overlay=null;
        this.keysHeld=new Set();this.touchHeld=new Map();this.cameraX=0;this.cameraY=0;this.roll=0;
        const extraPointers=Math.max(0,3-(this.input.manager?.pointersTotal??1));if(extraPointers)this.input.addPointer?.(extraPointers);
        if(!this.textures.exists('morph_forest')||!this.textures.exists('morph_sprites')){
            this.dialog('素材還沒載入','請完整複製 assets/forest-morph，再返回遊戲列表重試。').add(this.button(640,516,300,60,'返回遊戲列表',()=>this.leave()));return;
        }
        this.showSelection();if(!this.seenIntro)this.showIntro();
        this.keyDown=e=>{
            if(e.repeat)return;
            if(e.code==='Escape'||e.code==='KeyP'){if(this.mode==='paused')this.resumeGame();else this.pauseGame();return;}
            if(this.mode!=='playing')return;
            this.keysHeld.add(e.code);
            if(/^Digit[123]$/.test(e.code))this.changeForm(Number(e.code.slice(-1))-1);
            if(e.code==='KeyR')this.returnCheckpoint();
        };
        this.keyUp=e=>this.keysHeld.delete(e.code);this.pointerUp=p=>this.touchHeld.delete(p.id);
        this.input.keyboard?.on('keydown',this.keyDown);this.input.keyboard?.on('keyup',this.keyUp);
        this.input.keyboard?.addCapture?.(['UP','DOWN','LEFT','RIGHT','SPACE']);
        this.input.on('pointerup',this.pointerUp);this.input.on('pointerupoutside',this.pointerUp);
        this.visibilityHandler=()=>{if(document.hidden)this.pauseGame();};this.blurHandler=()=>this.pauseGame();
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{
            document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);
            this.input.keyboard?.off('keydown',this.keyDown);this.input.keyboard?.off('keyup',this.keyUp);
            this.input.keyboard?.removeCapture?.(['UP','DOWN','LEFT','RIGHT','SPACE']);
            this.input.off('pointerup',this.pointerUp);this.input.off('pointerupoutside',this.pointerUp);this.clearInput();this.stopTones();this.session=null;
        });
    }
    clearInput(){this.keysHeld?.clear();this.touchHeld?.clear();if(this.session){this.session.lastJump=false;this.session.lastDash=false;this.session.player.buffer=0;}}
    controls(){const k=this.keysHeld,t=new Set(this.touchHeld.values());return {left:k.has('ArrowLeft')||k.has('KeyA')||t.has('left'),right:k.has('ArrowRight')||k.has('KeyD')||t.has('right'),jump:k.has('Space')||k.has('ArrowUp')||k.has('KeyW')||t.has('jump'),dash:k.has('KeyX')||t.has('dash')};}
    clear(){this.clearInput();this.tweens.killAll();this.children.removeAll(true);this.overlay=null;this.world=null;}
    backdrop(theme=0){this.add.image(640,360,'morph_forest').setDisplaySize(1280,720).setTint(THEMES[theme].sky);}
    topbar(subtitle){
        this.panel(640,32,1260,56,0xf6fff0,0xafcbb4,16);
        this.button(100,32,168,40,'← 遊戲列表',()=>this.leave());this.text(376,32,'森林變形大冒險',27);this.text(630,32,subtitle,17);
        this.statText=this.text(875,32,'',18);
        this.soundButton=this.button(1038,32,110,40,this.soundOn?'音效：開':'音效：關',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xd7e8cd,'#31574b');
        this.button(1177,32,142,40,this.mode==='select'?'玩法說明':'暫停 / 說明',()=>this.mode==='select'?this.showIntro():this.pauseGame(),0xd7e8cd,'#31574b');
    }
    showSelection(){
        this.clear();this.mode='select';this.backdrop();this.topbar('12 關 · 即時跑跳冒險');
        this.statText.setText(`本次 ★ ${Object.values(this.records).reduce((n,r)=>n+r.stars,0)} / 36`);
        this.text(640,91,'自由選關　｜　徽章探索、三種變形、檢查點接續',24);
        MORPH_CHAPTERS.forEach((name,row)=>{
            const y=191+row*124;this.text(65,y-51,`${row+1}　${name}`,18,'#496d65',0).setOrigin(0,.5);
            for(let col=0;col<3;col++){
                const index=row*3+col,l=MORPH_LEVELS[index],r=this.records[index],c=this.add.container(269+col*370,y);
                c.add([this.panel(0,0,342,86,[0xe5efd4,0xf3e1da,0xdbeaf1,0xe4e1f1][row],0xa8bfae),this.art(-124,-2,col,62),
                    this.text(25,-18,`${String(index+1).padStart(2,'0')}　${l.title}`,22),this.text(25,19,r?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars):l.focus,17)]);
                c.setSize(342,86).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
                    if(this.mode!=='select')return;
                    if(this.session&&this.index===index&&!this.session.finished){this.session.paused=false;this.renderLevel();}else this.startLevel(index);
                });
            }
        });
        this.text(640,638,'★ 抵達終點　★ 找齊 3 枚徽章　★ 完成本關特別挑戰',22);
        this.text(640,686,'失足會回到最近燈籠；徽章保留。星星只記在本次開啟中。',18,'#48695c');
    }
    startLevel(index){if(!Number.isInteger(index)||!MORPH_LEVELS[index])return;this.index=index;this.session=new MorphSession(compileMorphLevel(MORPH_LEVELS[index]));this.cameraX=0;this.cameraY=0;this.renderLevel();const p=this.sound.context?.resume?.();p?.catch?.(()=>{});}
    renderLevel(){
        this.clear();this.mode='playing';this.session.paused=false;const l=this.session.level,t=THEMES[l.theme];this.backdrop(l.theme);
        this.world=this.add.container(0,0);const w=this.world;
        const terrain=this.add.graphics();w.add(terrain);
        l.platforms.forEach(r=>{
            terrain.fillStyle(r.oneWay?0x7d9f7f:t.soil,1).fillRoundedRect(r.x,r.y,r.w,r.h,r.oneWay?10:5);
            terrain.fillStyle(t.grass,1).fillRoundedRect(r.x,r.y,r.w,Math.min(11,r.h),4);
            if(!r.oneWay)for(let x=r.x+25;x<r.x+r.w;x+=62){terrain.fillStyle(0x453e43,.18).fillRect(x,r.y+30,23,4);}
        });
        this.windViews=l.winds.map(zone=>{const g=this.add.graphics();w.add(g);w.add(this.text(zone.x+zone.w/2,zone.y+27,zone.lift?'↑ 上升氣流':zone.force>0?'順風 →':'← 逆風',18,'#438b96'));return g;});
        this.vineViews=l.vines.map(r=>{
            const c=this.add.container(r.x,r.y),g=this.add.graphics();g.fillStyle(0x326e4e,1).fillRect(0,0,r.w,r.h);
            for(let y=5;y<r.h;y+=24)g.lineStyle(7,0x8cbf5a,1).lineBetween(0,y,r.w,y+18);
            c.add([g,this.text(r.w/2,-18,'△ X',18,'#a76b22')]);w.add(c);return c;
        });
        this.gateViews=l.gates.map(r=>{const c=this.add.container(r.x,r.y);c.add([this.panel(r.w/2,r.h/2,r.w,r.h,0x667a8a,0x475c6e,6),this.text(r.w/2,r.h/2,'□',26,'#ffffff')]);c.label=this.text(r.x+r.w/2,r.y-20,'石門',18,'#415c75');w.add([c,c.label]);return c;});
        this.plateViews=l.plates.map(r=>{const c=this.add.container(r.x,r.y),g=this.add.graphics();c.add(g);c.g=g;c.add(this.text(r.w/2,-31,'□ 壓住',17,'#47679b'));w.add(c);return c;});
        this.moverViews=l.movers.map(m=>{const c=this.add.container(m.x,m.y);c.add([this.panel(m.w/2,m.h/2,m.w,m.h,0x83bd8c,0x3f865d,11),this.text(m.w/2,m.h/2,'葉舟',14,'#234f43')]);w.add(c);return c;});
        l.springs.forEach(s=>w.add(this.art(s.x+s.w/2,s.y+3,3,s.w+8).setOrigin(.5,.55)));
        this.checkpointViews=l.checkpoints.map(cp=>{const a=this.art(cp.x,cp.y-25,4,86);w.add(a);return a;});
        w.add(this.art(l.exit.x,l.exit.y-50,5,142));w.add(this.text(l.exit.x,l.exit.y-120,'終點',20,'#6f7337'));
        this.badgeViews=l.badges.map(b=>{const c=this.add.container(b.x,b.y);c.add([this.add.circle(0,0,16,0xffcf59).setStrokeStyle(3,0xfff1af),this.text(0,0,'✦',21,'#99702d')]);w.add(c);return c;});
        l.hazards.forEach(r=>{const g=this.add.graphics();g.fillStyle(0xc06569,1).fillRect(r.x,r.y,r.w,r.h);w.add(g);});
        this.rockViews=l.rocks.map(r=>{const g=this.add.graphics();w.add(g);return g;});
        l.signs.forEach(s=>{const post=this.add.graphics();post.fillStyle(0x806a4f).fillRect(s.x-3,506,6,54);w.add([post,this.panel(s.x,501,45,32,0xf1ddb0,0x806a4f,7),this.text(s.x,501,'?',22)]);});
        this.trail=this.add.graphics();w.add(this.trail);this.hero=this.art(0,0,0,48);w.add(this.hero);
        this.topbar(`${MORPH_CHAPTERS[l.theme]} · 第 ${l.id} 關`);
        this.panel(640,85,1010,37,0xf4ffed,0xb9d3bc,12);this.tipText=this.text(640,85,'',18).setWordWrapWidth(982,true);
        this.panel(640,654,1260,122,0xeff8e4,0x9cbaa1,19);
        this.leftButton=this.holdButton(77,655,92,82,'←','left');this.rightButton=this.holdButton(185,655,92,82,'→','right');
        this.formButtons=MORPH_FORMS.map((f,i)=>this.button(356+i*161,655,149,83,`${['○','△','□'][i]} ${f.name} ${i+1}\n${['鑽洞・快跑','高跳・破藤','壓板・抗風'][i]}`,()=>this.changeForm(i),f.color,'#21484a'));
        this.jumpButton=this.holdButton(925,655,174,90,'跳躍\n空白鍵','jump',0x4f9f80);
        this.dashButton=this.holdButton(1132,655,187,90,'衝刺 · X\n三角形限定','dash',0xbe9143);
        this.challengeText=this.text(640,578,`挑戰：${l.challenge.label}`,17,'#254b48');
        this.drawState(0);this.cameraX=Math.max(0,Math.min(l.width-1280,this.session.player.x-420));this.cameraY=Math.max(0,230-this.session.player.y);this.world.x=-this.cameraX;this.world.y=this.cameraY;
    }
    holdButton(x,y,width,height,label,action,fill=0x477c69){
        const b=this.button(x,y,width,height,label,()=>{},fill);
        b.on('pointerdown',p=>{if(this.mode==='playing')this.touchHeld.set(p.id,action);});
        b.on('pointerup',p=>this.touchHeld.delete(p.id));b.on('pointerout',p=>{if(this.touchHeld.get(p.id)===action)this.touchHeld.delete(p.id);});return b;
    }
    changeForm(index){if(this.mode==='playing')this.session.setForm(index);}
    returnCheckpoint(){if(this.mode!=='playing')return;this.clearInput();this.session.respawn();}
    update(_time,delta){
        if(this.mode!=='playing'||!this.session)return;
        this.session.advance(delta/1000,this.controls());
        for(const event of this.session.events.splice(0)){
            if(event==='fall'){this.cameraX=Math.max(0,Math.min(this.session.level.width-1280,this.session.player.x-420));this.cameraY=Math.max(0,230-this.session.player.y);}
            if(event==='badge'||event==='checkpoint')this.tone('correct');
            else if(event==='form'||event==='cut'||event==='spring')this.tone('hint');
        }
        this.drawState(Math.min(.1,delta/1000));if(this.session.finished)this.finishLevel();
    }
    drawState(dt){
        const s=this.session,p=s.player,l=s.level,f=MORPH_FORMS[p.form];
        const target=Math.max(0,Math.min(l.width-1280,p.x-420));this.cameraX+=(target-this.cameraX)*(1-Math.exp(-dt*12));this.world.x=-this.cameraX;
        this.cameraY+=(Math.max(0,230-p.y)-this.cameraY)*(1-Math.exp(-dt*14));this.world.y=this.cameraY;
        this.hero.setFrame(p.form).setDisplaySize(p.form===0?48:60,p.form===0?48:60);this.hero.x=p.x;this.hero.y=p.y-f.h/2-4;
        this.roll+=p.vx*dt*2;this.hero.setAngle(p.form===0?this.roll:0).setAlpha(s.respawnDelay>0 ? .35 : 1);
        this.trail.clear();if(p.dash>0)this.trail.lineStyle(13,0xffd67d,.6).lineBetween(p.x,p.y-f.h/2,p.x-p.facing*65,p.y-f.h/2);
        this.moverViews.forEach((v,i)=>{const r=moverAt(l.movers[i],s.time);v.x=r.x;v.y=r.y;});
        this.vineViews.forEach((v,i)=>v.setVisible(!s.broken.has(i)));
        this.gateViews.forEach((v,i)=>{v.setAlpha(s.gateTimes[i]>0 ? .16 : 1);v.label.setText(s.gateTimes[i]>0?`開 ${Math.ceil(s.gateTimes[i])} 秒`:'石門');});
        this.plateViews.forEach((v,i)=>{const r=l.plates[i];v.g.clear().fillStyle(0x596f99,1).fillRect(0,-5,r.w,7).fillStyle(0xc8dd83,1).fillRect(0,-5,r.w*s.charge[i]/.45,7);});
        this.badgeViews.forEach((v,i)=>{v.setVisible(!s.collected.has(i));v.y=l.badges[i].y+Math.sin(s.time*3+i)*3;});
        this.checkpointViews.forEach((v,i)=>v.setAlpha(i<=s.checkpoint.index?1:.55));
        this.windViews.forEach((g,i)=>{const r=l.winds[i];g.clear().fillStyle(0x80cddd,.08).fillRect(r.x,r.y,r.w,r.h);for(let n=0;n<12;n++){
            const x=r.x+((n*97+s.time*(r.force>0?85:-85))%r.w+r.w)%r.w,y=r.y+70+(n%4)*64,dir=r.force>0?1:-1;
            g.lineStyle(2,0x58aabc,.5).lineBetween(x,y,x+dir*24,y).lineBetween(x+dir*24,y,x+dir*18,y-5);
        }});
        this.rockViews.forEach((g,i)=>{g.clear();const r=l.rocks[i],a=rockAt(r,s.time);if(!a)return;
            if(a.warning){for(let y=r.top;y<558;y+=24)g.lineStyle(2,0xc38b36,.6).lineBetween(r.x,y,r.x,y+11);g.fillStyle(0xf5b947,.6).fillCircle(r.x,552,25);g.lineStyle(4,0xb4742a,1).strokeCircle(r.x,r.top,20);}
            else{g.fillStyle(0x647581,1).fillCircle(a.x+16,a.y+16,16);g.lineStyle(3,0x96a3a6,1).lineBetween(a.x+7,a.y+10,a.x+22,a.y+21);}
        });
        this.formButtons.forEach((b,i)=>b.setAlpha(i===p.form?1:.58));
        this.dashButton.label.setText(p.form!==1?'衝刺 · X\n三角形限定':p.cooldown>0?`衝刺 · X\n冷卻 ${p.cooldown.toFixed(1)} 秒`:'衝刺 · X\n準備好了');
        this.statText.setText(`徽章 ${s.collected.size}/3　失足 ${s.falls}`);
        const nearest=l.signs.filter(sign=>Math.abs(sign.x-p.x)<175).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
        this.tipText.setText(s.messageTime>0?s.message:nearest?.text||'方向鍵 / A D 移動　空白鍵跳躍　1 2 3 變形　X 衝刺　R 回檢查點');
        this.challengeText.setText(`${s.challengeMet()?'✓':'○'} ${l.challenge.label}　｜　燈籠 ${s.checkpoint.index+1}/${l.checkpoints.length}`);
    }
    dialog(title,body){
        this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
        o.add([this.add.rectangle(640,360,1280,720,0x173d37,.8).setInteractive(),this.panel(640,357,950,572,0xf8ffed,0xc1cfac),this.text(640,131,title,32),this.text(640,217,body,23).setWordWrapWidth(862,true)]);return o;
    }
    showIntro(){
        if(this.mode!=='select')return;this.mode='intro';const o=this.dialog('三種精靈，一段真正跑跳的冒險','按住左右方向移動；按住跳躍飛得高，放開落得快。\n用不同形態穿過地形，探索高處的森林徽章。');
        MORPH_FORMS.forEach((f,i)=>{const x=377+i*263;o.add([this.art(x,351,i,126),this.text(x,442,[`1 圓形\n快跑、鑽低洞`,`2 三角形\n高跳，X 衝刺破藤`,`3 方形\n壓住機關、抵抗風`][i],21)]);});
        o.add(this.text(640,521,'跌落會回到燈籠，已找到的徽章不會掉。可同時按住移動與跳躍。',19));
        o.add(this.button(640,587,338,57,'選擇冒險關卡',()=>{this.seenIntro=true;this.overlay.destroy();this.overlay=null;this.mode='select';}));
    }
    pauseGame(){
        if(this.mode!=='playing')return;this.mode='paused';this.session.paused=true;this.session.accumulator=0;this.clearInput();this.stopTones();
        const o=this.dialog('休息一下，森林會等你','1 圓形：鑽低洞、快跑　2 三角形：高跳、X 衝刺破藤\n3 方形：在壓板站穩半秒開門，也更能抵抗風。\n金色直線是落石預警；綠色葉舟可以站上去搭乘。');
        o.add(this.text(640,355,`本關挑戰：${this.session.level.challenge.label}\n收集 3 枚徽章可多得一星；高處支線可自由探索。`,21));
        o.add(this.button(640,446,290,56,'繼續冒險',()=>this.resumeGame()));
        o.add(this.button(371,539,224,55,'回到檢查點',()=>{this.resumeGame();this.returnCheckpoint();},0xa49362));
        o.add(this.button(640,539,224,55,'整關重新開始',()=>this.confirmRestart(),0x8e9d79));
        o.add(this.button(909,539,224,55,'返回選關',()=>this.showSelection(),0x8e9d79));
    }
    resumeGame(){if(this.mode!=='paused')return;this.overlay.destroy();this.overlay=null;this.clearInput();this.session.paused=false;this.session.accumulator=0;this.mode='playing';}
    confirmRestart(){
        if(!['playing','paused'].includes(this.mode))return;this.mode='confirm';this.session.paused=true;this.clearInput();
        const o=this.dialog('整關重新挑戰？','本關徽章、燈籠與失足次數會重新計算。\n已獲得的本次星星仍會保留。');
        o.add(this.button(482,460,268,60,'繼續目前冒險',()=>{this.mode='paused';this.resumeGame();}));
        o.add(this.button(796,460,268,60,'重新開始',()=>this.startLevel(this.index),0xa49362));
    }
    finishLevel(){
        this.mode='finished';this.clearInput();this.tone('finish');const s=this.session,medals=s.medals(),stars=medals.filter(Boolean).length,old=this.records[this.index];
        this.records[this.index]={stars:Math.max(old?.stars||0,stars)};
        const o=this.dialog('穿過森林之門，冒險完成！',`${s.level.title}　｜　徽章 ${s.collected.size}/3　失足 ${s.falls} 次\n${'★'.repeat(stars)}${'☆'.repeat(3-stars)}`);
        o.add(this.text(640,351,`✓ 抵達終點　　${medals[1]?'✓':'○'} 找齊徽章　　${medals[2]?'✓':'○'} ${s.level.challenge.label}`,22));
        o.add(this.text(640,415,'可以回頭找高處支線，也可以繼續下一段冒險。',21));
        o.add(this.button(377,534,234,62,'再探索一次',()=>this.startLevel(this.index),0xa49362));
        o.add(this.button(640,534,234,62,'返回選關',()=>this.showSelection(),0x8e9d79));
        o.add(this.button(903,534,234,62,this.index<11?'下一關 →':'查看星星',()=>this.index<11?this.startLevel(this.index+1):this.showSelection()));
        o.add(this.text(640,606,'本次星星不影響正式進度，不扣主遊戲愛心。',18));
    }
    leave(){this.clearInput();this.stopTones();if(this.session)this.session.paused=true;if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
