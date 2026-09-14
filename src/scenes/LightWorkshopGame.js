import AnimalSnackGame from './AnimalSnackGame.js';
import { LIGHT_LEVELS, LIGHT_CHAPTERS } from '../data/LightWorkshopLevels.js';
import { LIGHT_COLORS, LIGHT_DIRS, FILTER_MASKS, compileLightLevel, LightSession, nodeValue, createLightSolver } from '../data/LightWorkshopRules.js';

const SIZE = 68, BX = 330, BY = 155;
const FRAMES = { owl:0, source:1, mirror:2, target:3, splitter:4, wall:5 };
const NAMES = { source:'光源', mirror:'鏡子', splitter:'分光片', filter:'濾光片', target:'水晶', wall:'石牆' };

export default class LightWorkshopGame extends AnimalSnackGame {
    constructor() { super('LightWorkshopGame'); }
    preload() {
        if (!this.textures.exists('light_workshop')) this.load.image('light_workshop','assets/light-workshop/workshop.png');
        if (!this.textures.exists('light_sprites')) this.load.spritesheet('light_sprites','assets/light-workshop/sprites.png',{frameWidth:512,frameHeight:512});
    }
    text(x,y,t,size=22,color='#e5f4ff',origin=.5) { return super.text(x,y,t,size,color,origin); }
    panel(x,y,w,h,fill=0x172e45,border=0x536987,radius=18) { return super.panel(x,y,w,h,fill,border,radius); }
    button(x,y,w,h,label,fn,fill=0x37687d,color='#f4fcff') { return super.button(x,y,w,h,label,fn,fill,color); }
    art(x,y,kind,size=64) { return this.add.image(x,y,'light_sprites',FRAMES[kind]).setDisplaySize(size,size); }
    create() {
        this.sound.stopAll(); this.soundOn=true; this.audioNodes=new Set(); this.records=this.records||{};
        this.session=null; this.mode='select'; this.overlay=null; this.board=null; this.hintJob=null; this.hintRing=null; this.selected=0;
        if (!this.textures.exists('light_workshop') || !this.textures.exists('light_sprites')) {
            this.dialog('素材還沒載入','請完整複製 assets/light-workshop，再返回列表重試。')
                .add(this.button(640,490,280,60,'返回遊戲列表',()=>this.leave())); return;
        }
        this.showSelection(); if(!this.seenIntro)this.showIntro();
        this.keyHandler=e=>{
            if(e.repeat)return;
            if(this.mode==='playing'){
                if(/^Digit[1-9]$/.test(e.code)){this.turn(Number(e.code.slice(-1))-1);return;}
                if(e.code==='Tab'){this.select((this.selected+(e.shiftKey?-1:1)+this.session.level.controls.length)%this.session.level.controls.length);return;}
                if(e.code==='Space'){this.turn(this.selected);return;}
                if(e.code==='Enter'){this.submitLight();return;}
                if(e.code==='KeyZ'||e.code==='Backspace'){this.undoTurn();return;}
                if(e.code==='KeyH'){this.requestHint();return;}
                if(e.code==='KeyR'){this.confirmRestart();return;}
            }
            if(e.code==='Escape'||e.code==='KeyP'){
                if(this.mode==='paused')this.resumeGame();else if(this.mode==='chart')this.closeChart();else this.pauseGame();
            }
        };
        this.input.keyboard?.on('keydown',this.keyHandler);
        this.input.keyboard?.addCapture?.(['TAB','SPACE','ENTER','BACKSPACE']);
        this.visibilityHandler=()=>{if(document.hidden)this.pauseGame();}; this.blurHandler=()=>this.pauseGame();
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{
            document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);
            this.input.keyboard?.off('keydown',this.keyHandler);this.input.keyboard?.removeCapture?.(['TAB','SPACE','ENTER','BACKSPACE']);
            this.hintJob=null;this.session=null;this.stopTones();
        });
    }
    clearSurface(){this.cancelHint();this.tweens.killAll();this.children.removeAll(true);this.overlay=null;this.board=null;}
    background(){this.add.image(640,360,'light_workshop').setDisplaySize(1280,720);this.add.rectangle(640,360,1280,720,0x071524,.27);}
    topBar(subtitle){
        this.panel(640,43,1248,68,0x152a40,0x8c825f);
        this.button(110,43,168,48,'← 遊戲列表',()=>this.leave());
        this.text(428,42,'森林光路工坊',31,'#ffdd95');this.text(680,44,subtitle,18,'#bfd6e9');
        this.audioButton=this.button(958,43,120,46,this.soundOn?'音效：開':'音效：關',()=>{
            this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.audioButton.label.setText(this.soundOn?'音效：開':'音效：關');
        },0x344c62);
        this.button(1130,43,174,46,this.mode==='select'?'玩法說明':'暫停 / 說明',()=>this.mode==='select'?this.showIntro():this.pauseGame(),0x344c62);
    }
    showSelection(){
        this.clearSurface();this.mode='select';this.background();this.topBar('20 關 · 光路與混色');
        const stars=Object.values(this.records).reduce((n,r)=>n+r.stars,0);
        this.text(640,103,`自由選關　｜　本次通關 ${Object.keys(this.records).length} / 20　★ ${stars} / 60`,22);
        LIGHT_CHAPTERS.forEach((chapter,row)=>{
            const y=196+row*128;
            this.text(61,y-45,`${row+1}　${chapter}`,18,'#ffdd95',0).setOrigin(0,.5);
            for(let col=0;col<5;col++){
                const index=row*5+col,l=LIGHT_LEVELS[index],c=this.add.container(155+col*242,y+9);
                c.add([this.panel(0,0,222,89,[0x244357,0x263d58,0x3b3557,0x4a3e3a][row],0x6a7c97),
                    this.text(-87,-22,String(index+1).padStart(2,'0'),21,'#ffdd95'),this.text(11,-12,l.title,20),
                    this.text(0,23,this.records[index]?'★'.repeat(this.records[index].stars)+'☆'.repeat(3-this.records[index].stars):l.focus,16,'#c6ddec')]);
                c.setSize(222,89).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
                    if(this.mode!=='select')return;
                    if(this.session&&!this.session.finished&&this.levelIndex===index)this.renderLevel();else this.startLevel(index);
                });
            }
        });
        this.text(640,658,'★ 完成光路　★ 目標調整次數內　★ 不用提示　｜　沒有倒數，可隨時撤回',19,'#f2dbac');
        this.text(640,697,'星星只記在本次開啟的遊戲中，不影響正式進度。',16,'#c6ddec');
    }
    startLevel(index){
        if(!Number.isInteger(index)||!LIGHT_LEVELS[index])return;
        this.levelIndex=index;this.session=new LightSession(compileLightLevel(LIGHT_LEVELS[index]));this.selected=0;
        this.renderLevel();const p=this.sound.context?.resume?.();p?.catch?.(()=>{});
    }
    renderLevel(){
        this.clearSurface();this.mode='playing';this.background();const l=this.session.level;
        this.topBar(`${LIGHT_CHAPTERS[Math.floor(this.levelIndex/5)]} · 第 ${l.id} 關`);
        this.panel(640,112,624,58);this.text(640,111,`${String(l.id).padStart(2,'0')}　${l.title}`,27,'#ffdd95');
        this.panel(156,388,280,594);this.text(156,125,'水晶任務',26,'#ffdd95');
        this.text(156,166,'顏色要相同，暗晶不能亮',18);
        this.goalLabels=[];
        l.targets.forEach((target,i)=>{
            const y=220+i*49;
            this.add.circle(53,y,13,LIGHT_COLORS[target.want].color).setStrokeStyle(2,0xe8f4ff);
            this.text(53,y,String.fromCharCode(65+i),15,'#11253b');
            const label=this.text(176,y,'',18);this.goalLabels.push(label);
        });
        this.text(156,484,'調整次數',19,'#b7cfe6');this.movesLabel=this.text(156,527,'0',43,'#ffdd95');
        this.text(156,578,`精準挑戰：${l.par} 次內`,21);this.text(156,610,'撤回不扣星，試光不扣分',17,'#bfd5e9');
        this.button(156,652,228,46,'查看混光配方',()=>this.showChart(),0x344c62);
        this.panel(1123,388,274,594);this.text(1123,124,'貓頭鷹的工具箱',23,'#ffdd95');this.art(1123,192,'owl',112);
        this.selectedLabel=this.text(1123,270,'',23,'#ffdd95');this.selectedDetail=this.text(1123,310,'',17).setWordWrapWidth(236);
        this.turnButton=this.button(1123,370,232,60,'旋轉',()=>this.turn(this.selected));
        this.undoButton=this.button(1123,437,232,48,'↶ 撤回一步 · Z',()=>this.undoTurn(),0x344c62);
        this.hintButton=this.button(1123,493,232,48,'分段提示 · H',()=>this.requestHint(),0x705a83);
        this.submitButton=this.button(1123,561,232,63,'啟動光路 · Enter',()=>this.submitLight(),0xc3984d,'#222b37');
        this.button(1062,641,110,48,'重來',()=>this.confirmRestart(),0x344c62);
        this.button(1184,641,110,48,'選關',()=>{if(this.mode==='playing')this.showSelection();},0x344c62);
        this.panel(639,675,626,65);this.feedback=this.text(639,674,'點機關直接調整，觀察光束會走到哪裡。',20).setWordWrapWidth(582);
        this.redraw();
    }
    point(x,y){return {x:BX+(x+.5)*SIZE,y:BY+(y+.5)*SIZE};}
    redraw(){
        this.board?.destroy();this.board=this.add.container(0,0);const l=this.session.level,s=this.session.state;this.trace=this.session.evaluate();
        for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++){
            const p=this.point(x,y);this.board.add(this.add.rectangle(p.x,p.y,SIZE-1,SIZE-1,(x+y)%2?0x213c52:0x1c3449).setStrokeStyle(1,0x456177));
        }
        const lines=this.add.graphics();this.board.add(lines);
        for(const segment of this.trace.segments){
            const a=this.point(segment.x1,segment.y1),b=this.point(segment.x2,segment.y2),color=LIGHT_COLORS[segment.color].color;
            lines.lineStyle(11,color,.14).lineBetween(a.x,a.y,b.x,b.y);lines.lineStyle(4,color,.96).lineBetween(a.x,a.y,b.x,b.y);
        }
        l.nodes.forEach(n=>{
            const p=this.point(n.x,n.y),c=this.add.container(p.x,p.y),v=nodeValue(n,s);
            if(n.kind==='source'){
                c.add(this.art(0,0,'source',67).setAngle(n.dir*90).setTint(LIGHT_COLORS[n.color].color).setAlpha(v?1:.42));
                c.add(this.text(0,22,`${LIGHT_COLORS[n.color].short}${LIGHT_DIRS[n.dir].arrow}`,15,'#ffffff'));
            }else if(n.kind==='mirror'||n.kind==='splitter'){
                c.add(this.art(0,0,n.kind,66));
                const g=this.add.graphics(),y=v? -22:22;
                g.lineStyle(8,0x152b40,1).lineBetween(-22,y,22,-y);g.lineStyle(4,n.kind==='splitter'?0xa4edff:0xf6fcff,1).lineBetween(-22,y,22,-y);c.add(g);
                if(n.kind==='splitter')c.add(this.text(20,22,'分',14,'#e3fbff'));
            }else if(n.kind==='filter'){
                const color=LIGHT_COLORS[FILTER_MASKS[v]];
                c.add(this.add.circle(0,0,25,color.color,.45).setStrokeStyle(4,color.color));c.add(this.text(0,0,`濾${color.short}`,19,'#ffffff'));
            }else if(n.kind==='target'){
                const index=l.targets.findIndex(t=>t.id===n.id),actual=this.trace.received[n.id];
                c.add(this.add.circle(0,0,29,LIGHT_COLORS[n.want].color,.15).setStrokeStyle(3,LIGHT_COLORS[n.want].color));
                c.add(this.art(0,-3,'target',57).setTint(LIGHT_COLORS[actual].color).setAlpha(actual ? .95 : .45));
                c.add(this.text(0,24,`${String.fromCharCode(65+index)}·${LIGHT_COLORS[n.want].short}`,15,'#ffffff'));
            }else c.add(this.art(0,0,'wall',72));
            if(n.control>=0){
                if(n.control===this.selected)c.add(this.add.rectangle(0,0,64,64,0xffdb7c,0).setStrokeStyle(2,0xffdb7c));
                c.add(this.add.circle(-23,-23,11,0xe8f1fa));c.add(this.text(-23,-23,String(n.control+1),15,'#152b40'));
                c.setSize(SIZE,SIZE).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.turn(n.control));
            }else if(n.locked)c.add(this.text(20,-24,'固',13,'#d1e1e9'));
            this.board.add(c);
        });
        this.refreshInfo();
    }
    refreshInfo(){
        const l=this.session.level,n=l.controls[this.selected],v=nodeValue(n,this.session.state);
        this.goalLabels.forEach((label,i)=>{
            const goal=this.trace.goals[i];label.setText(`要${LIGHT_COLORS[goal.want].short} · 現在${LIGHT_COLORS[goal.got].short} ${goal.ok?'✓':'○'}`);
        });
        this.movesLabel.setText(String(this.session.moves));this.undoButton.setAlpha(this.session.history.length?1:.45);
        this.selectedLabel.setText(`${this.selected+1} 號 · ${NAMES[n.kind]}`);
        const detail={source:`${LIGHT_COLORS[n.color]?.name||''} · ${v?'已開啟':'已關閉'}`,mirror:'反射轉彎 · 每次切換斜線',splitter:'一路直走，一路反射轉彎',filter:`只讓${LIGHT_COLORS[FILTER_MASKS[v]]?.name||''}通過\n紅 → 綠 → 藍 → 紅`};
        this.selectedDetail.setText(detail[n.kind]);
        this.turnButton.label.setText(n.kind==='source'?(v?'關閉光源':'開啟光源'):n.kind==='filter'?'切換濾光顏色':n.kind==='splitter'?'旋轉分光片':'旋轉這面鏡子');
        this.hintButton.label.setText(this.session.hintsUsed>=2?'下一步提示 · H':this.session.hintsUsed===1?'再想一想 · H':'分段提示 · H');
        this.submitButton.label.setText(this.trace.solved?'光路就緒 ✓ 啟動':'啟動光路 · Enter');
    }
    select(index){if(this.mode!=='playing'||!this.session.level.controls[index])return;this.selected=index;this.redraw();}
    turn(index){
        if(this.mode!=='playing'||!this.session.turn(index))return;
        this.cancelHint();this.selected=index;this.redraw();
        this.feedback.setText(this.trace.solved?'全部顏色都對齊了！按「啟動光路」完成。':'看看哪些光改變了方向，哪些水晶還需要調整。');
    }
    undoTurn(){
        if(this.mode!=='playing')return;this.cancelHint();
        if(!this.session.undo()){this.feedback.setText('現在就是起始配置，還沒有可以撤回的調整。');return;}
        this.redraw();this.feedback.setText('回到上一次配置了，換個方向想一想。');
    }
    submitLight(){
        if(this.mode!=='playing')return;
        if(this.session.submit()){this.finishLevel();return;}
        const bad=this.trace.goals.find(g=>!g.ok),index=this.session.level.targets.findIndex(t=>t.id===bad.id),letter=String.fromCharCode(65+index);
        this.feedback.setText(bad.want===0?`${letter} 水晶要保持暗，現在收到${LIGHT_COLORS[bad.got].name}。試著讓光繞開。`:`${letter} 水晶需要${LIGHT_COLORS[bad.want].name}，目前是${LIGHT_COLORS[bad.got].name}。再調整一下。`);this.tone('hint');
    }
    cancelHint(){this.hintJob=null;this.hintRing?.destroy();this.hintRing=null;this.hintTime=0;}
    requestHint(){
        if(this.mode!=='playing'||this.hintJob)return;this.cancelHint();this.session.hintsUsed++;this.refreshInfo();
        if(this.session.hintsUsed<=2){this.feedback.setText(this.session.level.hints[this.session.hintsUsed-1]);return;}
        this.hintJob=createLightSolver(this.session.level,this.session.state);this.feedback.setText('正在比較目前的光路，找下一個可以調整的機關……');
    }
    update(_time,delta){
        if(this.mode!=='playing')return;
        if(this.hintTime>0){this.hintTime-=Math.max(0,Math.min(delta/1000,.05));if(this.hintTime<=0)this.cancelHint();}
        if(!this.hintJob)return;const status=this.hintJob.tick(24);if(status==='searching')return;
        if(status==='solved'){
            const index=this.hintJob.best.findIndex((v,i)=>v!==this.session.state[i]);
            if(index<0)this.feedback.setText('目前配置已經正確，按「啟動光路」就能完成。');
            else{
                const node=this.session.level.controls[index],turns=(this.hintJob.best[index]-this.session.state[index]+node.radix)%node.radix;
                this.selected=index;this.redraw();const p=this.point(node.x,node.y);
                this.hintRing=this.add.circle(p.x,p.y,37,0xffdc7f,.12).setStrokeStyle(4,0xffdc7f).setDepth(10);this.hintTime=7;
                this.feedback.setText(`試著調整 ${index+1} 號${NAMES[node.kind]} ${turns} 次，再觀察光束變化。`);
            }
        }else this.feedback.setText('暫時沒有找到正確配置，請重新挑戰這一關。');
        this.hintJob=null;
    }
    dialog(title,body){
        this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
        o.add([this.add.rectangle(640,360,1280,720,0x091424,.84).setInteractive(),this.panel(640,354,846,536,0x192e46,0x9c885d),
            this.text(640,145,title,32,'#ffdd95'),this.text(640,245,body,23).setWordWrapWidth(764)]);return o;
    }
    showIntro(){
        if(this.mode!=='select')return;this.mode='intro';
        const o=this.dialog('歡迎來到貓頭鷹的光路工坊','點鏡子、分光片或濾片來調整，點光源開關。\n讓每顆水晶收到指定顏色；暗晶必須保持暗。');
        o.add([this.art(405,374,'source',84),this.text(488,374,'→',33,'#ffdd95'),this.art(572,374,'mirror',84),this.text(652,374,'→',33,'#ffdd95'),this.art(751,374,'target',94)]);
        o.add(this.text(640,458,'光束會即時預覽；準備好後按「啟動光路」。可撤回、無倒數。',20));
        o.add(this.button(640,551,334,60,'選一個光路任務',()=>{this.seenIntro=true;this.overlay.destroy();this.overlay=null;this.mode='select';}));
    }
    showChart(){
        if(this.mode!=='playing')return;this.mode='chart';this.tweens.pauseAll();this.stopTones();
        const o=this.dialog('混光配方','這裡混的是光，不是顏料。');
        [[1,2,3],[2,4,6],[1,4,5],[1,2,4,7]].forEach((colors,row)=>{
            const y=291+row*62,start=colors.length===4?469:526;
            colors.forEach((mask,i)=>{
                const x=start+i*114;o.add(this.add.circle(x,y,21,LIGHT_COLORS[mask].color));o.add(this.text(x,y,LIGHT_COLORS[mask].short,14,'#182a3e'));
                if(i<colors.length-1)o.add(this.text(x+57,y,i===colors.length-2?'=':'+',25));
            });
        });
        o.add(this.button(640,558,284,57,'回到光路',()=>this.closeChart()));
    }
    closeChart(){if(this.mode!=='chart')return;this.overlay.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}
    pauseGame(){
        if(this.mode!=='playing')return;this.mode='paused';this.tweens.pauseAll();this.stopTones();
        const o=this.dialog('休息一下，光路會等你','點機關直接調整；1–9 可調整對應編號。\nTab 選機關、空白鍵調整；Enter 啟動光路。\nZ 撤回、H 分段提示；光源上「固」表示不能更動。');
        o.add(this.button(640,405,302,58,'繼續設計',()=>this.resumeGame()));
        o.add(this.button(490,518,240,56,'返回選關',()=>{this.tweens.resumeAll();this.showSelection();},0x344c62));
        o.add(this.button(788,518,240,56,'返回遊戲列表',()=>this.leave(),0x344c62));
    }
    resumeGame(){if(this.mode!=='paused')return;this.overlay.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}
    confirmRestart(){
        if(this.mode!=='playing')return;this.mode='confirm';this.tweens.pauseAll();
        const o=this.dialog('重新設計這一關？','所有機關回到原本配置，調整次數與提示重新計算。\n已獲得的本次星星會保留。');
        o.add(this.button(490,450,240,60,'繼續原本設計',()=>{this.mode='paused';this.resumeGame();}));
        o.add(this.button(790,450,240,60,'重新挑戰',()=>{this.tweens.resumeAll();this.startLevel(this.levelIndex);},0xc3984d,'#222b37'));
    }
    finishLevel(){
        this.mode='finished';this.cancelHint();this.tone('finish');const s=this.session,medals=s.medals(),stars=medals.filter(Boolean).length;
        const old=this.records[this.levelIndex];this.records[this.levelIndex]={stars:Math.max(old?.stars||0,stars),bestMoves:Math.min(old?.bestMoves??Infinity,s.moves)};
        const o=this.dialog(this.levelIndex===19?'工坊總工程師，任務完成！':'光路接通，水晶回應了！',`${s.level.title}　｜　調整 ${s.moves} 次\n${'★'.repeat(stars)}${'☆'.repeat(3-stars)}`);
        o.add(this.text(640,349,`✓ 完成光路　　${medals[1]?'✓':'○'} ${s.level.par} 次調整內　　${medals[2]?'✓':'○'} 沒用提示`,22));
        o.add(this.text(640,409,'觀察每一條分支，就能解開更複雜的設計。',21));
        o.add(this.button(414,516,194,60,'再挑戰一次',()=>this.startLevel(this.levelIndex),0xc3984d,'#222b37'));
        o.add(this.button(640,516,194,60,'返回選關',()=>this.showSelection(),0x344c62));
        o.add(this.button(866,516,194,60,this.levelIndex<19?'下一關 →':'查看星星',()=>this.levelIndex<19?this.startLevel(this.levelIndex+1):this.showSelection()));
        o.add(this.text(640,579,'星星只存在本次遊玩；不扣愛心、不影響正式存檔。',18,'#c6ddec'));
    }
    leave(){this.hintJob=null;this.stopTones();this.tweens.resumeAll();if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
