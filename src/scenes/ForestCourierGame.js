import AnimalSnackGame from './AnimalSnackGame.js';
import {COURIER_LEVELS,COURIER_VARIANTS,COURIER_CHAPTERS} from '../data/CourierLevels.js';
import {compileCourierLevel,CourierSession,cargoWeight,courierComplete,edgeBlock,createCourierSolver,describeCourierAction} from '../data/CourierRules.js';

const INK='#314f48',MUTED='#61756a',GOLD=0xe6b65c;
export default class ForestCourierGame extends AnimalSnackGame{
    constructor(){super('ForestCourierGame');}
    preload(){
        if(!this.textures.exists('courier_map'))this.load.image('courier_map','assets/forest-courier/dispatch.png');
        if(!this.textures.exists('courier_art'))this.load.spritesheet('courier_art','assets/forest-courier/sprites.png',{frameWidth:512,frameHeight:512});
    }
    text(x,y,t,size=22,color=INK,origin=.5){return super.text(x,y,t,size,color,origin);}
    panel(x,y,w,h,fill=0xfffae9,border=0xb7c3a8,r=18){return super.panel(x,y,w,h,fill,border,r);}
    button(x,y,w,h,label,fn,fill=0x48796b,color='#fff9e9'){return super.button(x,y,w,h,label,fn,fill,color);}
    art(x,y,frame,size=80){return this.add.image(x,y,'courier_art',frame).setDisplaySize(size,size);}
    create(){
        this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.records=this.records||{};
        this.session=null;this.page='story';this.mode='select';this.overlay=null;this.surface=null;this.hintJob=null;this.hintRing=null;this.travel=null;
        if(!this.textures.exists('courier_map')||!this.textures.exists('courier_art')){
            this.dialog('素材還沒載入','請完整複製 assets/forest-courier，然後返回列表重試。')
                .add(this.button(640,500,280,60,'返回遊戲列表',()=>this.leave()));return;
        }
        this.showSelection();if(!this.seenIntro)this.showIntro();
        this.keyHandler=e=>{
            if(e.repeat)return;
            if(e.code==='Escape'||e.code==='KeyP'){if(this.mode==='paused')this.resumeGame();else if(this.mode==='help')this.closeHelp();else this.pauseGame();return;}
            if(this.mode!=='playing')return;
            if(/^Digit[1-9]$/.test(e.code))this.perform({type:'move',to:Number(e.code.slice(-1))-1});
            if(/^Key[ABCD]$/.test(e.code)){const i=e.code.charCodeAt(3)-65;if(this.session.level.parcels[i])this.perform({type:this.session.state.parcels[i]===1?'unload':'load',parcel:i});}
            if(e.code==='KeyT')this.perform({type:'toggle'});
            if(e.code==='KeyZ'||e.code==='Backspace')this.undoAction();
            if(e.code==='KeyH')this.requestHint();
            if(e.code==='KeyR')this.confirmRestart();
        };
        this.input.keyboard?.on('keydown',this.keyHandler);this.input.keyboard?.addCapture?.(['BACKSPACE']);
        this.visibilityHandler=()=>{if(document.hidden)this.pauseGame();};this.blurHandler=()=>this.pauseGame();
        document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
        this.events.once('shutdown',()=>{
            document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);
            this.input.keyboard?.off('keydown',this.keyHandler);this.input.keyboard?.removeCapture?.(['BACKSPACE']);
            this.cancelHint();this.tweens.killAll();this.travel=null;this.session=null;this.stopTones();
        });
    }
    cancelHint(){this.hintJob=null;this.hintRing?.destroy();this.hintRing=null;this.hintTime=0;}
    clear(){this.cancelHint();this.tweens.killAll();this.tweens.resumeAll();this.children.removeAll(true);this.overlay=null;this.surface=null;this.travel=null;}
    background(){this.add.image(640,360,'courier_map').setDisplaySize(1280,720);}
    topbar(subtitle){
        this.panel(640,44,1248,68,0xfffae9,0xcbb788);
        this.button(110,44,166,46,'← 遊戲列表',()=>this.leave());
        this.text(428,43,'森林快遞調度站',30);this.text(718,45,subtitle,17,MUTED);
        this.audioButton=this.button(963,44,116,46,this.soundOn?'音效：開':'音效：關',()=>{
            this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.audioButton.label.setText(this.soundOn?'音效：開':'音效：關');
        },0xe4e5c9,INK);
        this.button(1130,44,168,46,this.mode==='select'?'玩法說明':'暫停 / 說明',()=>this.mode==='select'?this.showIntro():this.pauseGame(),0xe4e5c9,INK);
    }
    list(){return this.page==='story'?COURIER_LEVELS:COURIER_VARIANTS;}
    key(page,index){return `${page}:${index}`;}
    showSelection(page=this.page){
        this.clear();this.page=page;this.mode='select';this.background();this.topbar('規劃路線 · 聰明送貨');
        const stars=Object.values(this.records).reduce((n,r)=>n+r.stars,0);
        this.button(435,114,266,49,'主線任務 · 18 關',()=>{if(this.mode==='select')this.showSelection('story');},page==='story'?0x48796b:0xa0ad8d);
        this.button(737,114,266,49,'變化委託 · 12 組',()=>{if(this.mode==='select')this.showSelection('bonus');},page==='bonus'?0x48796b:0xa0ad8d);
        this.text(1057,114,`本次 ★ ${stars} / 90`,21);
        const rows=page==='story'?3:2;
        for(let row=0;row<rows;row++){
            const y=(page==='story'?247:306)+row*(page==='story'?156:191);
            this.text(56,y-69,page==='story'?`${row+1}　${COURIER_CHAPTERS[row]}`:row===0?'改變取送地點、起點與道路路程':'再想一次，熟悉的路線也有新安排',20,INK,0).setOrigin(0,.5);
            for(let col=0;col<6;col++){
                const index=row*6+col,l=this.list()[index],record=this.records[this.key(page,index)],c=this.add.container(149+col*196,y);
                c.add([this.panel(0,0,182,110,page==='bonus'?0xf1e5ca:[0xe9efce,0xe4eedc,0xf1e2c4][row]),
                    this.text(-65,-35,String(index+1).padStart(2,'0'),18,'#967443'),this.text(0,-5,l.title,18),
                    this.text(0,32,record?'★'.repeat(record.stars)+'☆'.repeat(3-record.stars):l.focus,16,MUTED)]);
                c.setSize(182,110).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
                    if(this.mode!=='select')return;
                    if(this.session&&this.runKey===this.key(page,index)&&!courierComplete(this.session.level,this.session.state))this.renderLevel();else this.startLevel(index,page);
                });
            }
        }
        this.text(640,647,'★ 全部送達　★ 精準路程　★ 不用提示　｜　可自由選關、隨時撤回',21);
        this.text(640,690,'沒有現實倒數；鮮度只在走路時消耗。星星只記在本次開啟中。',18,MUTED);
    }
    startLevel(index,page=this.page){
        const list=page==='story'?COURIER_LEVELS:COURIER_VARIANTS;if(!Number.isInteger(index)||!list[index])return;
        this.page=page;this.index=index;this.runKey=this.key(page,index);this.session=new CourierSession(compileCourierLevel(list[index]));this.renderLevel();
        const p=this.sound.context?.resume?.();p?.catch?.(()=>{});
    }
    renderLevel(){
        this.clear();this.mode='playing';this.background();const l=this.session.level;
        this.topbar(`${this.page==='story'?'主線':'變化'} ${this.index+1} · ${l.focus}`);
        this.panel(146,391,270,602);this.text(146,125,'委託清單',25);
        this.panel(644,369,696,467,0xf2eed6,0xb4be9b);this.text(644,109,l.title,27);
        this.panel(1131,391,276,602);this.art(1131,184,0,126);
        this.text(644,599,'道路數字＝路程　限＝載重上限　橋＝扳手控制　先＝先送指定包裹',14,MUTED);
        this.button(413,637,205,47,'↶ 撤回 · Z',()=>this.undoAction(),0x6a8b75);
        this.button(643,637,205,47,'分段提示 · H',()=>this.requestHint(),0xa18554);
        this.button(873,637,205,47,'重新安排 · R',()=>this.confirmRestart(),0x7e8f79);
        this.feedback=this.text(644,684,'先看看取送地點，在取貨站裝好貨再出發。',19).setWordWrapWidth(664,true);
        this.button(1067,644,116,48,'規則',()=>this.showHelp(),0xe4e5c9,INK);
        this.button(1195,644,116,48,'選關',()=>{if(this.mode==='playing')this.showSelection();},0xe4e5c9,INK);
        this.redraw();
    }
    redraw(){
        this.surface?.destroy();this.surface=this.add.container(0,0);const c=this.surface,l=this.session.level,s=this.session.state;
        const road=this.add.graphics();c.add(road);
        l.edges.forEach(e=>{
            const a=l.nodes[e.a],b=l.nodes[e.b],blocked=edgeBlock(l,s,e),near=e.a===s.pos||e.b===s.pos;
            road.lineStyle(13,0xd4c79e,1).lineBetween(a.x,a.y,b.x,b.y);
            road.lineStyle(6,blocked?0xa78d79:near?0x6f9d73:0x9fab83,1).lineBetween(a.x,a.y,b.x,b.y);
            const label=`${e.cost}${e.maxLoad!==undefined?` · 限${e.maxLoad}`:''}${e.gate!==undefined?` · 橋${e.gate+1}${s.gates&(1<<e.gate)?'開':'關'}`:''}${e.permit!==undefined?` · 先${String.fromCharCode(65+e.permit)}`:''}`;
            const x=(a.x+b.x)/2,y=(a.y+b.y)/2,w=Math.max(36,label.length*14+12);
            c.add([this.panel(x,y,w,27,blocked?0xead8c7:0xfffae9,0xc8b48a,9),this.text(x,y,label,14,blocked?'#976346':INK)]);
        });
        l.nodes.forEach((n,i)=>{
            const here=i===s.pos,link=l.adj[s.pos].find(a=>a.to===i),open=link&&!edgeBlock(l,s,l.edges[link.edge]);
            const node=this.add.container(n.x,n.y);
            node.add([this.add.circle(0,0,43,here?GOLD:0xfffae9,here ? .7 : .6).setStrokeStyle(here?4:2,here?0xc5943d:open?0x6c9972:0xc1c8a2),this.art(0,-7,n.art,85),
                this.panel(0,48,132,27,here?0xf4dfad:0xfffae9,0xb7c3a8,9),this.text(0,48,`${i+1} ${n.name}`,16)]);
            if(n.switch!==undefined)node.add(this.text(-32,-44,`⚙${n.switch+1}`,20,'#7e592e'));
            if(i===l.start)node.add(this.text(34,-47,'起',17,'#815b27'));
            node.setSize(112,114).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.perform({type:'move',to:i}));c.add(node);
        });
        const pos=l.nodes[s.pos];this.courier=this.art(pos.x+27,pos.y-30,0,61);c.add(this.courier);
        l.parcels.forEach((p,i)=>{
            const y=207+i*113,status=s.parcels[i],ready=p.requires.every(r=>s.parcels[r]===2),failed=status===1&&p.fresh!==undefined&&s.age[i]>p.fresh;
            const stateText=status===2?'✓ 已送達':status===1?'已裝貨':ready?'等待取貨':`先送 ${p.requires.map(r=>String.fromCharCode(65+r)).join('、')} 才可領`;
            const freshness=p.fresh!==undefined?` · 鮮 ${Math.max(0,p.fresh-s.age[i])}/${p.fresh}`:'';
            c.add([this.panel(146,y,248,106,failed?0xf1d4bd:status===2?0xe1ebca:status===1?0xf4e7be:0xfffae9),
                this.text(146,y-33,`${String.fromCharCode(65+i)}　${p.name}`,20),
                this.text(146,y-7,`${l.nodes[p.from].name} → ${l.nodes[p.to].name}`,15,MUTED),
                this.text(146,y+16,`重量 ${p.weight} 格${freshness}`,17,failed?'#a24831':INK),this.text(146,y+38,stateText,16,status===2?'#527338':MUTED)]);
        });
        c.add(this.text(146,654,`完成 ${s.parcels.filter(v=>v===2).length}/${l.parcels.length} 件${l.returnHome?' · 須返站':''}`,20));
        c.add(this.text(1131,268,`目前：${l.nodes[s.pos].name}`,22));
        c.add(this.text(1131,302,`背包 ${cargoWeight(l,s)} / ${l.capacity} 格`,23,'#8b6736'));
        const local=l.parcels.map((p,i)=>({p,i})).filter(({p,i})=>p.from===s.pos&&s.parcels[i]!==2);
        if(!local.length)c.add(this.text(1131,367,'這站沒有待領包裹\n點相連站點繼續配送',18,MUTED));
        local.forEach(({p,i},row)=>{
            const loaded=s.parcels[i]===1,ready=p.requires.every(r=>s.parcels[r]===2),full=cargoWeight(l,s)+p.weight>l.capacity;
            const label=`${loaded?'放回':'裝'} ${String.fromCharCode(65+i)} · ${p.weight} 格${!loaded&&!ready?' · 等前置':!loaded&&full?' · 已滿':''}`;
            const b=this.button(1131,353+row*47,238,42,label,()=>this.perform({type:loaded?'unload':'load',parcel:i}),loaded?0xa18554:!ready||full?0x9ca794:0x48796b);c.add(b);
        });
        const sw=l.nodes[s.pos].switch;
        if(sw!==undefined)c.add(this.button(1131,504,238,44,`橋 ${sw+1}：${s.gates&(1<<sw)?'收起':'放下'} · T`,()=>this.perform({type:'toggle'}),0x987b51));
        c.add(this.text(1131,558,`已走 ${s.distance}　／　目標 ${l.par} 路程`,20));
        c.add(this.text(1131,594,`本次提示 ${this.session.hintsUsed} 次`,17,MUTED));
    }
    perform(action){
        if(this.mode!=='playing')return;const r=this.session.act(action);
        if(!r.ok){this.feedback.setText(r.reason);return;}
        this.cancelHint();
        if(action.type==='move'){
            this.mode='travelling';const n=this.session.level.nodes[this.session.state.pos];
            this.travel=this.tweens.add({targets:this.courier,x:n.x+27,y:n.y-30,duration:340,ease:'Sine.easeInOut',onComplete:()=>{
                this.travel=null;this.mode='playing';this.redraw();this.feedback.setText(r.reason);this.afterAction();
            }});
        }else{this.redraw();this.feedback.setText(r.reason);this.afterAction();}
    }
    afterAction(){if(courierComplete(this.session.level,this.session.state))this.finishLevel();}
    undoAction(){
        if(this.mode!=='playing')return;this.cancelHint();if(!this.session.undo()){this.feedback.setText('還沒有可以撤回的操作。');return;}
        this.redraw();this.feedback.setText('回到上一步了；載貨、送達、橋樑和鮮度一起還原。');
    }
    requestHint(){
        if(this.mode!=='playing'||this.hintJob)return;
        if(this.session.state.failed){this.feedback.setText('先按撤回，救回超過保鮮路程的包裹，再重新安排。');return;}
        this.cancelHint();this.session.hintsUsed++;this.redraw();
        if(this.session.hintsUsed<=2){this.feedback.setText(this.session.level.hints[this.session.hintsUsed-1]);return;}
        this.hintJob=createCourierSolver(this.session.level,this.session.state);this.feedback.setText('正在比較目前的配送安排，找下一步……');
    }
    update(_time,delta){
        if(this.mode!=='playing')return;
        if(this.hintTime>0){this.hintTime-=Math.max(0,Math.min(delta/1000,.05));if(this.hintTime<=0)this.cancelHint();}
        if(!this.hintJob)return;const status=this.hintJob.tick(48);if(status==='searching')return;
        if(status==='solved'){
            const a=this.hintJob.solution[0];this.feedback.setText(describeCourierAction(this.session.level,a));
            if(a?.type==='move'){const n=this.session.level.nodes[a.to];this.hintRing=this.add.circle(n.x,n.y,48,GOLD,.12).setStrokeStyle(4,GOLD).setDepth(10);this.hintTime=7;}
        }else this.feedback.setText(status==='limit'?'目前安排較複雜，試著撤回幾步再查看提示。':'目前配置沒有可完成的路線，先撤回到鮮貨裝貨之前再試。');
        this.hintJob=null;
    }
    dialog(title,body){
        this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
        o.add([this.add.rectangle(640,360,1280,720,0x233c32,.78).setInteractive(),this.panel(640,358,902,554,0xfffae9,0xc8a978),
            this.text(640,135,title,32),this.text(640,238,body,23).setWordWrapWidth(820,true)]);return o;
    }
    showIntro(){
        if(this.mode!=='select')return;this.mode='intro';const o=this.dialog('浣熊快遞員，今天由你調度！','看取貨站與收件站 → 裝貨 → 點相連站點出發\n送到指定地點會自動交件，規劃順路配送能少繞路。');
        o.add([this.art(410,385,0,145),this.text(753,367,'背包有容量，窄路有載重上限。\n後段加入開橋、前置委託與鮮貨。\n沒有現實倒數，停下思考不扣鮮度。',21),
            this.button(640,556,332,59,'開始選擇委託',()=>{this.seenIntro=true;this.overlay.destroy();this.overlay=null;this.mode='select';})]);
    }
    showHelp(){
        if(this.mode!=='playing')return;this.mode='help';this.tweens.pauseAll();
        const o=this.dialog('配送規則','裝貨：在原取貨站按裝貨，可在原站放回。\n道路數字是路程，鮮貨只有移動時消耗鮮度。\n到達收件站自動送貨；有「先送」條件要先完成前置。');
        o.add(this.text(640,393,'1–6 前往對應站點；A–D 裝上／放回對應包裹。\nT 操作目前站的橋，Z 撤回，H 提示，R 重來。\n精準星需在目標路程內完成；有返站標記時最後回起點。',21));
        o.add(this.button(640,559,300,59,'回到配送',()=>this.closeHelp()));
    }
    closeHelp(){if(this.mode!=='help')return;this.overlay.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}
    pauseGame(){
        if(!['playing','travelling'].includes(this.mode))return;this.pausedMode=this.mode;this.mode='paused';this.tweens.pauseAll();this.stopTones();
        const o=this.dialog('休息一下，包裹會等你','暫停時不會移動，也不會消耗鮮度。\n點相連站點移動；在右側裝貨；Z 撤回、H 提示。');
        o.add(this.button(640,393,308,60,'繼續配送',()=>this.resumeGame()));
        o.add(this.button(486,518,252,55,'返回選關',()=>{this.recordResult();this.showSelection();},0x8a9a78));
        o.add(this.button(794,518,252,55,'返回遊戲列表',()=>this.leave(),0x8a9a78));
    }
    resumeGame(){if(this.mode!=='paused')return;this.overlay.destroy();this.overlay=null;this.mode=this.pausedMode||'playing';this.tweens.resumeAll();}
    confirmRestart(){
        if(this.mode!=='playing')return;this.mode='confirm';this.tweens.pauseAll();
        const o=this.dialog('重新安排這份委託？','包裹、道路與鮮度回到起始狀態，路程與提示重新計算。\n已獲得的本次星星會保留。');
        o.add(this.button(485,460,262,60,'保留目前安排',()=>{this.overlay.destroy();this.overlay=null;this.mode='playing';this.tweens.resumeAll();}));
        o.add(this.button(795,460,262,60,'重新出發',()=>this.startLevel(this.index,this.page),0xa18554));
    }
    recordResult(){
        if(!this.session||!courierComplete(this.session.level,this.session.state))return;
        const stars=this.session.medals().filter(Boolean).length,s=this.session.state,old=this.records[this.runKey];
        this.records[this.runKey]={stars:Math.max(old?.stars||0,stars),bestDistance:Math.min(old?.bestDistance??Infinity,s.distance)};
    }
    finishLevel(){
        this.mode='finished';this.cancelHint();this.tone('finish');this.recordResult();const medals=this.session.medals(),stars=medals.filter(Boolean).length,s=this.session.state,l=this.session.level;
        const o=this.dialog('配送完成，森林朋友都收到了！',`${l.title}　｜　共走 ${s.distance} 路程\n${'★'.repeat(stars)}${'☆'.repeat(3-stars)}`);
        o.add(this.text(640,351,`✓ 全部送達　　${medals[1]?'✓':'○'} ${l.par} 路程內　　${medals[2]?'✓':'○'} 沒用提示`,22));
        o.add(this.text(640,414,'試著改變裝貨順序與路線，挑戰更精準的配送。',21));
        o.add(this.button(408,524,205,59,'再挑戰一次',()=>this.startLevel(this.index,this.page),0xa18554));
        o.add(this.button(640,524,205,59,'返回選關',()=>this.showSelection(),0x7e8f79));
        o.add(this.button(872,524,205,59,this.index<this.list().length-1?'下一份委託 →':'查看其他委託',()=>this.index<this.list().length-1?this.startLevel(this.index+1,this.page):this.showSelection(this.page==='story'?'bonus':'story')));
        o.add(this.text(640,594,'星星只保留在本次開啟中，不扣愛心、不寫正式存檔。',18,MUTED));
    }
    leave(){this.recordResult();this.cancelHint();this.tweens.killAll();this.travel=null;this.stopTones();this.tweens.resumeAll();if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
