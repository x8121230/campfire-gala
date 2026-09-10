import AnimalSnackGame from './AnimalSnackGame.js';
import {KitchenSession} from '../data/KitchenRules.js';
import {KITCHEN_LEVELS} from '../data/KitchenLevels.js';
import {KITCHEN_CHEFS,KITCHEN_FOODS,KITCHEN_RECIPES,KITCHEN_DIFFICULTIES,KITCHEN_STATIONS,KITCHEN_TARGETS,kitchenRecipe,kitchenItemName} from '../data/KitchenConfig.js';

const STATION_NAMES=Object.fromEntries(KITCHEN_STATIONS.map(s=>[s.id,s.name]));
export default class ForestKitchenGame extends AnimalSnackGame {
  constructor(){super('ForestKitchenGame');}
  preload(){for(const n of ['chefs','ingredients','meals'])if(!this.textures.exists(`kitchen_${n}`))this.load.spritesheet(`kitchen_${n}`,`assets/forest-kitchen/${n}.png`,{frameWidth:512,frameHeight:512});}
  art(x,y,frame,size=104,key='chefs'){return this.add.image(x,y,`kitchen_${key}`,frame).setDisplaySize(size,size);}
  button(x,y,w,h,label,fn,fill=0x4f7966,color='#fff7df'){
    const b=super.button(x,y,w,h,label,()=>{if(!this.portraitOverlay)fn();},fill,color);b.label.setFontSize(28);return b;
  }
  create(){
    this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.records=this.records||{};this.difficulty=this.difficulty||'standard';this.mode='select';this.session=null;this.overlay=null;this.portraitOverlay=null;
    this.keyHandler=e=>{if(e.repeat||this.portraitOverlay)return;if(e.code==='Escape'||e.code==='KeyP'){if(this.mode==='playing')this.pauseGame();else if(['paused','recipe','cleanup'].includes(this.mode))this.resumeGame();return;}if(this.mode!=='playing')return;if(/^Digit[123]$/.test(e.code))this.session.select(Number(e.code.slice(-1))-1);if(e.code==='Space')this.session.skill();if(e.code==='KeyR')this.showRecipe();};
    this.input.keyboard?.on('keydown',this.keyHandler);this.input.keyboard?.addCapture?.(['SPACE']);
    this.visibilityHandler=()=>{if(typeof document!=='undefined'&&document.hidden)this.pauseGame();};this.blurHandler=()=>this.pauseGame();this.resizeHandler=()=>this.checkOrientation();
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.visibilityHandler);
    if(typeof window!=='undefined')window.addEventListener('resize',this.resizeHandler);
    this.game.events.on('blur',this.blurHandler);
    this.events.once('shutdown',()=>{if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.visibilityHandler);if(typeof window!=='undefined')window.removeEventListener('resize',this.resizeHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyHandler);this.input.keyboard?.removeCapture?.(['SPACE']);this.stopTones();this.session?.setPaused(true);this.session=null;this.portraitOverlay?.destroy();this.portraitOverlay=null;});
    if(['chefs','ingredients','meals'].some(n=>!this.textures.exists(`kitchen_${n}`))){this.mode='missing';this.dialog('素材還沒載入','請完整複製 assets/forest-kitchen 資料夾。').add(this.button(640,570,340,96,'返回遊戲列表',()=>this.leave()));return;}
    this.showSelection();this.checkOrientation();
  }
  clear(){this.tweens.killAll();this.children.removeAll(true);this.overlay=null;this.portraitOverlay=null;this.buttons={};}
  backdrop(color=0x5c7e67){
    this.add.rectangle(640,360,1280,720,0xf5eddb);
    this.add.rectangle(640,42,1280,84,color);
    for(let i=0;i<16;i++)this.add.rectangle(40+i*80,92,80,12,i%2?0xf1c57b:0xffedbf);
    // The kitchen is drawn in design coordinates, avoiding unreadable scene-detail textures.
    this.add.rectangle(460,420,900,398,0xdfd5b8);
    for(let x=10;x<910;x+=100)for(let y=220;y<610;y+=100)this.add.rectangle(x+48,y+48,96,96,(x/100+y/100)%2?0xe8dec6:0xe0d6bc,.65);
    this.panel(1096,419,348,390,0xd2dfc1,0xaabd9c,18);
  }
  header(){
    const make=(id,label,fn,fill)=>{const t=KITCHEN_TARGETS.find(v=>v.id===id);return this.button(t.x,t.y,t.w,t.h,label,fn,fill);};
    make('back','← 樂園',()=>this.session&&this.mode==='playing'?this.pauseGame():this.leave());
    this.text(405,42,'森林餐車大亂鬥',35,'#fff6df');this.timerText=this.text(835,42,'料理 × 分工',31,'#fff0c0');
    this.soundButton=make('sound',this.soundOn?'音效\n開':'音效\n關',()=>{this.soundOn=!this.soundOn;this.soundButton.label.setText(this.soundOn?'音效\n開':'音效\n關');if(!this.soundOn)this.stopTones();});
    make('pause',this.mode==='select'?'玩法':'暫停',()=>this.mode==='select'?this.showHelp():this.pauseGame());
  }
  showSelection(){
    this.session?.setPaused(true);this.session=null;this.clear();this.mode='select';this.backdrop();this.header();
    this.text(360,151,'三名隊員、六款料理、六座驚喜廚房',30);
    this.difficultyButton=this.button(1060,150,390,88,`難度：${KITCHEN_DIFFICULTIES[this.difficulty].name}　↻`,()=>{const keys=Object.keys(KITCHEN_DIFFICULTIES);this.difficulty=keys[(keys.indexOf(this.difficulty)+1)%keys.length];this.showSelection();},0x927344);
    this.levelButtons=KITCHEN_LEVELS.map((l,i)=>{
      const x=222+i%3*419,y=311+Math.floor(i/3)*208,c=this.add.container(x,y),r=this.records[`${l.id}:${this.difficulty}`];
      c.add([this.panel(0,0,397,190,0xfff9e9,l.color,20),this.art(-130,-15,i%3,104),this.text(54,-58,`${l.id} ${l.title}`,27),this.text(55,-13,l.tag,27,'#947044'),this.text(55,29,`目標 ${l.goal} 份 · ${Math.round(l.duration*KITCHEN_DIFFICULTIES[this.difficulty].time/60)} 分鐘`,24),this.text(0,70,r?`${'★'.repeat(r.stars)}${'☆'.repeat(3-r.stars)}　最佳 ${r.score} 分`:'點一下開張 →',25)]);
      c.setSize(397,190).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='select'&&!this.portraitOverlay)this.startLevel(i);});return c;
    });
    this.text(640,665,'手機請橫放 · 點工作台自動走路 · 點訂單放大食譜並暫停',28);
    this.checkOrientation();
  }
  startLevel(index){
    if(!KITCHEN_LEVELS[index]||this.portraitOverlay)return;this.index=index;this.session=new KitchenSession(KITCHEN_LEVELS[index],{difficulty:this.difficulty,seed:Date.now()});this.clear();this.mode='playing';this.backdrop(this.session.level.color);this.header();
    this.orderViews=[0,1,2].map(i=>{const t=KITCHEN_TARGETS.find(v=>v.id===`order${i}`),c=this.add.container(t.x,t.y);
      const icon=this.art(-140,0,0,114,'meals'),name=this.text(48,-30,'',29),status=this.text(48,13,'',26),small=this.text(48,46,'點我看食譜',23,'#816841');
      c.add([this.panel(0,0,t.w,t.h,0xfff9e9,0xc2ad7d,16),icon,name,status,small]);c.setSize(t.w,t.h).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='playing'&&!this.portraitOverlay&&this.session.orders[i])this.showRecipe(this.session.orders[i].recipe,this.session.orders[i].id);});return {c,icon,name,status,small};
    });
    this.stationViews={};
    for(const t of KITCHEN_STATIONS){
      const c=this.add.container(t.x,t.y),bg=this.panel(0,0,t.w,t.h,0xf9f0d9,0xb7976b,18),label=this.text(0,-47,t.name,28),state=this.text(0,47,'',25),icons=[0,1,2].map(i=>this.art((i-1)*76,0,0,83,'ingredients').setVisible(false)),mark=this.text(0,0,'',35,'#8b6739');
      const tool=this.art(-82,0,t.id==='pot'?4:3,94).setVisible(false),bee=this.art(104,-33,5,72).setVisible(false);
      c.add([bg,tool,label,...icons,mark,state,bee]);c.setSize(t.w,t.h).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.send(t.id));this.stationViews[t.id]={c,bg,label,state,icons,mark,tool,bee};this.buttons[t.id]=c;
    }
    this.foodViews=KITCHEN_FOODS.map((f,i)=>{const t=KITCHEN_TARGETS.find(v=>v.id===f.id),c=this.add.container(t.x,t.y);c.add([this.panel(0,0,t.w,t.h,0xfffae8,0xadc28b,16),this.art(0,-12,i,95,'ingredients'),this.text(0,39,f.name,26)]);c.setSize(t.w,t.h).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.send(f.id));this.buttons[f.id]=c;return c;});
    this.pathGraphics=this.add.graphics();
    this.chefViews=this.session.chefs.map((c,i)=>{const group=this.add.container(c.x,c.y);const ring=this.add.ellipse(0,35,88,22,0x779063,.6),body=this.art(0,-2,i,114),held=this.art(39,4,0,62,'ingredients').setVisible(false),tag=this.text(-39,23,String(i+1),26,'#315342');group.add([ring,body,held,tag]);return {group,ring,body,held,tag};});
    this.eventText=this.text(835,67,'',22,'#fff0c0').setDepth(4);this.noticeText=this.text(640,609,'',25,'#5d462b').setDepth(4);
    this.chefCards=KITCHEN_CHEFS.map((chef,i)=>{const t=KITCHEN_TARGETS.find(v=>v.id===`chef${i}`),c=this.add.container(t.x,t.y),border=this.panel(0,0,t.w,t.h,0xe7e8c9,0x71925f,17),portrait=this.art(-88,7,i,74),name=this.text(24,-25,`${i+1} ${chef.name}·${chef.role}`,24),held=this.art(85,10,0,65,'ingredients').setVisible(false),status=this.text(-4,19,'空手',24);c.add([border,portrait,name,status,held]);c.setSize(t.w,t.h).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='playing'&&!this.portraitOverlay)this.session.select(i);});return {c,border,name,status,held};});
    for(const [id,label,fn,fill] of [['skill','隊員絕招',()=>this.session.skill(),0x71834b],['trash','整理\n／清台',()=>this.showCleanup(),0x9d7755],['book','料理\n手冊',()=>this.showRecipe(),0x527c78]]){const t=KITCHEN_TARGETS.find(v=>v.id===id);this.buttons[id]=this.button(t.x,t.y,t.w,t.h,label,()=>{if(this.mode==='playing')fn();},fill);}
    this.lastServed=0;this.drawState();this.sound.context?.resume?.()?.catch?.(()=>{});this.pauseGame(true);this.checkOrientation();
  }
  send(id){if(this.mode==='playing'&&!this.portraitOverlay){this.session.command(id);this.drawState();}}
  itemArt(view,item){
    view.setVisible(!!item);if(!item)return;
    if(item.kind==='ingredient')view.setTexture('kitchen_ingredients',KITCHEN_FOODS.findIndex(f=>f.id===item.food));
    else view.setTexture('kitchen_meals',KITCHEN_RECIPES.findIndex(r=>r.id===item.recipe));
  }
  drawState(){
    const s=this.session;if(!s)return;
    this.timerText.setText(`${Math.ceil(s.remaining)} 秒 · ${s.stats.served}/${s.level.goal} 份`);
    this.orderViews.forEach((v,i)=>{const o=s.orders[i];v.c.setAlpha(o?1:.5);v.icon.setVisible(!!o);v.name.setText(o?kitchenRecipe(o.recipe).name:'客人快來了');v.status.setText(o?`${Math.ceil(o.left)} 秒${o.grace>0?' · 舊單可送':''}`:'先備料吧');v.status.setColor(o?.left<30?'#b03f34':'#45634e');v.small.setText(o?.change?`${Math.ceil(o.change.left)} 秒後改單 · 點查看`:o?'點我看食譜':'');if(o)v.icon.setFrame(KITCHEN_RECIPES.findIndex(r=>r.id===o.recipe));});
    for(const [id,v] of Object.entries(this.stationViews)){
      const st=s.stations[id],worker=st.worker!==null?s.chefs[st.worker]:null,bee=s.event?.kind==='bee'&&s.event.target===id;
      v.c.setAlpha(st.frozen?.68:1);v.icons.forEach((icon,i)=>this.itemArt(icon,st.state==='ready'&&i===0?{kind:'meal',recipe:st.recipe}:st.state==='ready'?null:st.items[i]));
      let mark='',status='';
      if(st.frozen){mark='❄ 結冰';status='點一下解凍';}
      else if(worker){mark='';status=`${{chop:'切菜',plate:'裝盤',clean:'清洗',thaw:'解凍'}[worker.job.kind]} ${Math.max(0,worker.job.left).toFixed(1)} 秒`;}
      else if(bee){mark='';status=`趕蜂！剩 ${Math.ceil(s.event.left)} 秒`;}
      else if(st.state==='cooking')status=`料理 ${Math.ceil(st.total-st.progress)} 秒`;
      else if(st.state==='ready')status=`起鍋！${Math.ceil(st.safe-st.ready)} 秒後焦`;
      else if(st.state==='burnt'){mark='焦鍋！';status='點一下清洗';}
      else if(id==='chop'){mark='切・切・切';status='拿生菜來切';}
      else if(id==='counter')status=`交接 ${st.items.length}/2 · 空手拿走`;
      else if(id==='serve'){mark=`連單 × ${s.combo}`;status=`${String(s.stats.score).padStart(4,'0')} 分 · 送裝盤成品`;}
      else if(st.items.length)status=id==='plate'?'空手點：裝盤':'空手點：開火';
      else {mark=id==='pan'?'煎 / 烤':id==='pot'?'咕嚕咕嚕':'組沙拉 / 裝盤';status=id==='plate'?'熟食放這裡':'食材放這裡';}
      const showTool=['pan','pot'].includes(id)&&!st.items.length&&st.state==='idle'&&!st.frozen;
      v.tool.setVisible(showTool);v.bee.setVisible(bee);v.mark.x=showTool?43:0;v.mark.setText(mark);v.state.setText(status).setColor(bee||st.state==='ready'?'#b35c2b':'#775c39');
      v.label.setText(`${bee?'蜂！':st.worker!==null?`${st.worker+1}號 `:''}${STATION_NAMES[id]}`);
    }
    this.pathGraphics.clear();
    s.chefs.forEach((c,i)=>{const v=this.chefViews[i];v.group.x=c.x+(i-1)*12;v.group.y=c.y+(i-1)*6;v.ring.setAlpha(s.selected===i?1:.2);v.body.setAngle(c.target?Math.sin(s.time*15)*4:0);this.itemArt(v.held,c.held);
      if(c.target){const target=KITCHEN_TARGETS.find(v=>v.id===c.target);this.pathGraphics.lineStyle(4,[0x609b55,0xc58b3d,0x5288a6][i],.45).lineBetween(c.x,c.y,...target.dock);}
      const card=this.chefCards[i];card.c.setAlpha(s.selected===i?1:.6);card.status.setText(c.job?{chop:'切菜中',plate:'裝盤中',clean:'洗鍋中',thaw:'解凍中'}[c.job.kind]:c.target?'移動中':c.held?c.held.kind==='dish'?'可出餐':c.held.kind==='meal'?'待裝盤':c.held.prepared?'備料完成':'待切菜':'空手');this.itemArt(card.held,c.held);
    });
    const chef=s.chefs[s.selected];this.buttons.skill.label.setText(chef.cooldown>0?`絕招\n${Math.ceil(chef.cooldown)} 秒`:KITCHEN_CHEFS[s.selected].skill.replace('全隊','全隊\n').replace('快刀','快刀\n').replace('暖心','暖心\n'));
    const e=s.event;this.eventText.setText(e?`${{flood:'河水慢行',power:'爐火停電',bee:'蜜蜂搗蛋',rush:'早餐尖峰'}[e.kind]} ${Math.ceil(e.left)} 秒`:s.buff.party>0?`森林派對 ${Math.ceil(s.buff.party)} 秒！`:s.level.waves?`宴會第 ${s.phase+1} 幕`:'');
    this.timerText.y=this.eventText.text?28:42;this.noticeText.setText(s.messageTime>0?s.message:`${s.level.title} · 點訂單看食譜 · ${KITCHEN_CHEFS[s.selected].name}：${kitchenItemName(chef.held)}`);
  }
  update(_,delta){if(this.mode!=='playing'||this.portraitOverlay||!this.session)return;this.session.tick(delta/1000);this.drawState();if(this.session.stats.served>this.lastServed){this.lastServed=this.session.stats.served;this.tone('correct');}if(this.session.status!=='playing')this.finishLevel();}
  dialog(title,body=''){
    this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
    o.add([this.add.rectangle(640,360,1280,720,0x173b2a,.86).setInteractive(),this.panel(640,360,1190,682,0xfff7e4,0x8aa27b,26),this.text(640,80,title,38),this.text(640,155,body,29).setWordWrapWidth(1090,true)]);return o;
  }
  pauseGame(intro=false){
    if(this.mode!=='playing')return;this.session.setPaused(true);this.stopTones();this.mode='paused';
    const s=this.session,o=this.dialog(intro?`${s.level.id}　${s.level.title}`:'廚房暫停中',s.level.tip);
    o.add(this.text(640,292,'① 點食材拿取 → 點切菜台處理蔬菜\n② 備料放鍋中 → 空手再點開火 → 空手起鍋\n③ 放裝盤台 → 空手再點裝盤 → 送出餐口',31));
    o.add(this.text(640,421,`目標 ${s.level.goal} 份 · 三名隊員可同時工作\n切換隊員不會中斷工作；點訂單看放大食譜。`,28));
    o.add(this.button(640,527,360,92,intro?'開張！':'繼續料理',()=>this.resumeGame()));
    o.add(this.button(248,638,340,88,'返回選關',()=>this.showSelection(),0x7e8c66));
    o.add(this.button(640,638,340,88,'重新開張',()=>this.confirmRestart(),0xa3824f));
    o.add(this.button(1032,638,340,88,'返回樂園',()=>this.leave(),0x6b8175));
  }
  resumeGame(){if(!['paused','recipe','cleanup','confirm'].includes(this.mode)||this.portraitOverlay)return;this.overlay?.destroy();this.overlay=null;this.mode='playing';this.session.setPaused(false);}
  confirmRestart(){this.mode='confirm';const o=this.dialog('重新開張這間廚房？','本輪的訂單、分數與備料會重新開始。');o.add(this.button(432,490,360,96,'取消，繼續料理',()=>this.resumeGame()));o.add(this.button(848,490,360,96,'確認重新開張',()=>this.startLevel(this.index),0xa3824f));}
  showRecipe(id,orderId){
    if(!['playing','recipe'].includes(this.mode))return;this.session.setPaused(true);this.mode='recipe';this.recipeIndex=id?KITCHEN_RECIPES.findIndex(r=>r.id===id):(this.recipeIndex||0);
    const r=KITCHEN_RECIPES[this.recipeIndex],o=this.dialog(r.name,'看食譜時完全暫停，不扣時間。');
    o.add(this.art(170,315,this.recipeIndex,198,'meals'));
    const all=[...r.foods,...(r.garnish?[r.garnish]:[])];
    all.forEach((id,i)=>{const food=KITCHEN_FOODS.find(f=>f.id===id),x=385+i*205;o.add([this.art(x,294,KITCHEN_FOODS.indexOf(food),124,'ingredients'),this.text(x,379,food.name,30),this.text(x,420,r.garnish===id?'最後淋上':food.chop?'先切菜':'直接使用',26,'#987338')]);});
    const steps=r.station==='plate'?'切好兩種菜 → 放裝盤台 → 空手裝盤 → 出餐':`備料放${STATION_NAMES[r.station]} → 空手開火（${r.time}秒）→ 空手起鍋\n放裝盤台${r.garnish?' → 加蜂蜜':''} → 空手裝盤 → 出餐`;
    o.add(this.text(640,477,steps,29));
    const order=this.session.orders.find(v=>v.id===orderId),changed=order?.change?.recipe||(order?.grace>0?order.old:null);
    if(changed)o.add(this.button(640,560,520,88,`查看${order.change?'預告':'舊單'}：${kitchenRecipe(changed).name}`,()=>this.showRecipe(changed,orderId),0x937445));
    o.add(this.button(239,653,340,88,'← 上一道',()=>this.showRecipe(KITCHEN_RECIPES[(this.recipeIndex+5)%6].id),0x6f8873));
    o.add(this.button(640,653,390,88,'懂了，繼續料理',()=>this.resumeGame()));
    o.add(this.button(1041,653,340,88,'下一道 →',()=>this.showRecipe(KITCHEN_RECIPES[(this.recipeIndex+1)%6].id),0x6f8873));
  }
  showCleanup(){
    if(this.mode!=='playing')return;this.mode='cleanup';this.session.setPaused(true);const o=this.dialog('整理廚房','清台會丟棄該台食物並中斷連單；切菜中的工作台不能清。');
    const options=[['held','丟棄手上物品'],['counter','清交接台'],['plate','清裝盤台'],['pan','清平底鍋'],['pot','清湯鍋']];
    options.forEach(([id,label],i)=>o.add(this.button(245+i%3*394,300+Math.floor(i/3)*140,360,104,label,()=>{this.resumeGame();id==='held'?this.session.trash():this.session.clearStation(id);this.drawState();},0x9c7957)));
    o.add(this.button(640,620,440,96,'不丟棄，繼續料理',()=>this.resumeGame()));
  }
  showHelp(){
    this.mode='help';const o=this.dialog('忙得開心，不用手忙腳亂','單人指揮三名隊員，點食材／工作台即可自動移動。');
    KITCHEN_CHEFS.forEach((c,i)=>{const x=257+i*384;o.add([this.art(x,291,i,144),this.text(x,395,`${c.name} · ${c.role}`,32),this.text(x,463,c.tip,28).setWordWrapWidth(336,true)]);});
    o.add(this.text(640,554,'3 份連單：全隊加速！★ 達標 ★ 少浪費 ★ 全程連單＋兩種菜',26));
    o.add(this.button(640,641,430,96,'選擇廚房',()=>this.showSelection()));
  }
  finishLevel(){
    const s=this.session;this.mode='finished';s.setPaused(true);this.stopTones();const stars=s.medals().filter(Boolean).length,key=`${s.level.id}:${this.difficulty}`,old=this.records[key];
    if(s.status==='won')this.records[key]={stars:Math.max(stars,old?.stars||0),score:Math.max(s.stats.score,old?.score||0)};
    this.tone(s.status==='won'?'finish':'hint');const o=this.dialog(s.status==='won'?'今日餐車，大成功！':'打烊啦！再調整一下分工',`${'★'.repeat(stars)}${'☆'.repeat(3-stars)}　${s.stats.score} 分`);
    [0,1,2].forEach((v,i)=>o.add(this.art(465+i*175,297,v,156)));
    o.add(this.text(640,425,`出餐 ${s.stats.served}/${s.level.goal}　最長連單 ${s.stats.bestCombo}\n離開客人 ${s.stats.expired}　浪費 ${s.stats.waste}　料理種類 ${s.stats.variety.length}`,30));
    o.add(this.text(640,528,'紀錄只保留於本次開啟，不影響樂園正式存檔。',26));
    o.add(this.button(247,627,350,104,'再開張一次',()=>this.startLevel(this.index),0xa3824f));
    o.add(this.button(640,627,350,104,'返回選關',()=>this.showSelection(),0x788d68));
    o.add(this.button(1033,627,350,104,this.index<5?'下一間廚房 →':'回到樂園',()=>this.index<5?this.startLevel(this.index+1):this.leave()));
  }
  checkOrientation(){
    if(typeof window==='undefined')return;const portrait=window.innerHeight>window.innerWidth;
    if(portrait){if(this.mode==='playing')this.pauseGame();if(!this.portraitOverlay){const o=this.add.container(0,0).setDepth(1000);o.add([this.add.rectangle(640,360,1280,720,0x214735,.98).setInteractive(),this.text(640,276,'請將手機橫放',76,'#fff1cb'),this.text(640,420,'大圖示更好點\n遊戲已暫停，橫放後再按繼續',43,'#e0ebce')]);this.portraitOverlay=o;}}
    else if(this.portraitOverlay){this.portraitOverlay.destroy();this.portraitOverlay=null;}
  }
  leave(){this.session?.setPaused(true);this.stopTones();if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
