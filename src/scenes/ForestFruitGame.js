import AnimalSnackGame from './AnimalSnackGame.js';
import {FruitSession,FRUIT_BOARD,FRUIT_COLORS,cellPosition,cellKey,traceFruitShot} from '../data/FruitRules.js';
import {FRUIT_LEVELS,FRUIT_CHAPTERS,dailyFruitLevel,localFruitDate} from '../data/FruitLevels.js';
const BX=376,BY=105,CHAPTER_COLORS=[0xe2efd4,0xf4e2cb,0xdceff0,0xe3e4f2,0xf2e2da];
export default class ForestFruitGame extends AnimalSnackGame{
 constructor(){super('ForestFruitGame');}
 preload(){
  if(!this.textures.exists('fruit_orchard'))this.load.image('fruit_orchard','assets/forest-fruit/orchard.png');
  if(!this.textures.exists('fruit_sprites'))this.load.spritesheet('fruit_sprites','assets/forest-fruit/sprites.png',{frameWidth:512,frameHeight:512});
 }
 art(x,y,frame,size=80){return this.add.image(x,y,'fruit_sprites',frame).setDisplaySize(size,size);}
 create(){
  this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.records=this.records||{};this.session=null;this.mode='select';this.overlay=null;this.held=new Set();this.aimPointer=null;this.effects=[];this.effectTime=0;
  if(!this.textures.exists('fruit_orchard')||!this.textures.exists('fruit_sprites')){this.dialog('素材還沒載入','請完整複製 assets/forest-fruit，\n再返回遊戲列表重試。').add(this.button(640,515,300,60,'返回遊戲列表',()=>this.leave()));return;}
  this.showSelection();if(!this.seenIntro)this.showHelp();
  this.onDown=(p,objects=[])=>{if(objects.length||this.aimPointer!==null||p.button>0||!this.canAim()||this.inputGrace>0||!this.inBoard(p))return;this.aimPointer=p.id;this.aimAt(p);};
  this.onMove=p=>{if(this.canAim()&&(this.aimPointer===null||this.aimPointer===p.id)&&this.inBoard(p))this.aimAt(p);};
  this.onUp=p=>{if(this.aimPointer!==p.id)return;this.aimPointer=null;if(this.inBoard(p))this.shoot();};this.onOutside=p=>{if(this.aimPointer===p.id)this.aimPointer=null;};
  this.input.on('pointerdown',this.onDown);this.input.on('pointermove',this.onMove);this.input.on('pointerup',this.onUp);this.input.on('pointerupoutside',this.onOutside);
  this.onKeyDown=e=>{if(e.repeat)return;if(['Escape','KeyP'].includes(e.code)){if(this.mode==='paused')this.resumeGame();else if(this.mode==='playing')this.pauseGame();return;}if(this.mode!=='playing')return;
   this.held.add(e.code);if(e.code==='Space'||e.code==='Enter')this.shoot();if(e.code==='KeyX')this.swap();if(e.code==='Tab')this.changeLauncher();};
  this.onKeyUp=e=>this.held.delete(e.code);this.input.keyboard?.on('keydown',this.onKeyDown);this.input.keyboard?.on('keyup',this.onKeyUp);this.input.keyboard?.addCapture?.(['LEFT','RIGHT','SPACE','TAB']);
  this.visibilityHandler=()=>{if(document.hidden)this.pauseGame();};this.blurHandler=()=>this.pauseGame();document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
  this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.onKeyDown);this.input.keyboard?.off('keyup',this.onKeyUp);this.input.keyboard?.removeCapture?.(['LEFT','RIGHT','SPACE','TAB']);
   for(const [name,handler]of [['pointerdown',this.onDown],['pointermove',this.onMove],['pointerup',this.onUp],['pointerupoutside',this.onOutside]])this.input.off(name,handler);this.clearInput();this.stopTones();this.session=null;this.effects=[];
  });
 }
 clearInput(){this.held?.clear();this.aimPointer=null;}
 clear(){this.clearInput();this.tweens.killAll();this.children.removeAll(true);this.overlay=null;this.effects=[];this.bubbleViews=new Map();this.effectTime=0;}
 backdrop(){this.add.image(640,360,'fruit_orchard').setDisplaySize(1280,720);}
 topbar(label){
  this.panel(640,33,1260,56,0xf8fff1,0xaac8a8,16);this.button(99,33,166,40,'← 遊戲列表',()=>this.leave());this.text(375,33,'森林果實彈射隊',27);this.text(704,33,label,18);
  this.soundButton=this.button(1032,33,112,40,this.soundOn?'音效：開':'音效：關',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0xe1ebd1,'#365c4d');
  this.button(1171,33,138,40,this.mode==='select'?'玩法說明':'暫停 / 說明',()=>this.mode==='select'?this.showHelp():this.pauseGame(),0xe1ebd1,'#365c4d');
 }
 showSelection(){
  if(this.session)this.session.paused=true;this.clear();this.mode='select';this.backdrop();this.topbar('15 關主線 + 每日挑戰');
  const total=Object.entries(this.records).filter(([k])=>!k.startsWith('daily')).reduce((n,[,r])=>n+r.stars,0);this.text(640,88,`瞄準、反彈、拆支點！　｜　本次主線 ★ ${total} / 45`,24);
  FRUIT_CHAPTERS.forEach((name,row)=>{const y=154+row*102;this.text(51,y-39,`${row+1}　${name}`,16,'#466654',0).setOrigin(0,.5);
   for(let col=0;col<3;col++){const index=row*3+col,l=FRUIT_LEVELS[index],rec=this.records[l.id],c=this.add.container(268+col*371,y+8);c.add([this.panel(0,0,344,73,CHAPTER_COLORS[row],0xa9bca2,18),this.text(-139,-4,String(l.id).padStart(2,'0'),27,'#648266'),this.text(21,-14,l.title,22),this.text(21,17,rec?'★'.repeat(rec.stars)+'☆'.repeat(3-rec.stars):l.focus,16,'#5e7567')]);
    c.setSize(344,73).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='select')this.startLevel(index);});
   }
  });
  const date=localFruitDate(),record=this.records[`daily-${date}`];this.button(352,655,463,66,`每日挑戰　${date}${record?'　'+'★'.repeat(record.stars):''}`,()=>{if(this.mode==='select')this.startLevel('daily');},0x527f70);
  this.text(910,643,'★ 完成目標　★ 節省球數　★ 大串連鎖',19);this.text(910,676,'可自由選關、重試；星星記在本次開啟中。',16,'#4e705e');
 }
 startLevel(index){
  if(index!=='daily'&&(!Number.isInteger(index)||!FRUIT_LEVELS[index]))return;this.index=index;this.currentLevel=index==='daily'?dailyFruitLevel():FRUIT_LEVELS[index];this.session=new FruitSession(this.currentLevel);this.angle=0;this.renderLevel();const p=this.sound.context?.resume?.();p?.catch?.(()=>{});
 }
 renderLevel(){
  this.clear();this.mode='playing';this.session.paused=false;this.inputGrace=.2;this.previewClock=0;this.backdrop();const s=this.session,l=s.level;
  this.topbar(l.date?`${l.date} 每日果園`:`${FRUIT_CHAPTERS[l.chapter]} · 第 ${l.id} 關`);
  this.panel(640,378,560,604,0xf7fff3,0x779e7f,25);this.add.rectangle(640,372,528,524,0xebf6e5,.8);
  this.rails=this.add.graphics();this.rails.lineStyle(5,0x9aab78,1).lineBetween(BX-3,BY+15,BX-3,BY+422).lineBetween(BX+531,BY+15,BX+531,BY+422);
  const warning=this.add.graphics();if(l.motion)warning.fillStyle(0xcf7c73,.09).fillRect(BX,BY+420-2*l.motion,528,2*l.motion);for(let x=BX;x<BX+528;x+=23)warning.lineStyle(3,0xcf7c73,.65).lineBetween(x,BY+420,Math.min(x+12,BX+528),BY+420);
  this.text(640,BY+439,l.motion?'最低位置不可碰到警戒線':'警戒線以上完成任務',15,'#ad655a');this.ceiling=this.add.graphics();this.aimGraphics=this.add.graphics();this.ghost=this.add.graphics();
  this.panel(185,344,326,532,0xf8ffed,0xb5c8aa);this.text(185,111,l.title,25);this.goalText=this.text(185,165,'',23).setWordWrapWidth(285,true);
  this.progressText=this.text(185,230,'',19).setWordWrapWidth(286,true);this.text(185,291,'本關三顆星',20);this.starText=this.text(185,358,'',20).setWordWrapWidth(283,true);
  this.text(185,441,'松鼠隊長的小提醒',20);this.hintText=this.text(185,517,l.hint,19).setWordWrapWidth(274,true);this.art(178,660,l.id===15?4:0,117);
  this.panel(1104,363,296,570,0xf9fff0,0xb5c8aa);this.text(1104,110,'準備下一次收成',23);this.ammoText=this.text(1104,151,'',23);
  this.text(1039,193,'這一球',17);this.text(1171,193,'下一球',17);this.currentView=null;this.nextView=null;
  this.swapButton=this.button(1104,291,236,45,'換球 · X',()=>this.swap(),0xdbbd7b,'#5f4b32');
  this.launchButton=this.button(1104,351,236,45,s.launchers.length>1?'換發射台 · Tab':'單發射台',()=>this.changeLauncher(),0xd6e6c9,'#365c4d').setAlpha(s.launchers.length>1?1:.6);
  this.windText=this.text(1104,403,'',20);this.pressureText=this.text(1104,440,'',18);this.angleText=this.text(1104,482,'',18);
  this.fireButton=this.button(1104,546,236,66,'發射！ 空白鍵',()=>this.shoot(),0x508b68);
  this.text(1104,603,'移動滑鼠瞄準，點一下發射\n觸控：按住瞄準，放開發射',16,'#58715d');
  this.noticeText=this.text(640,79,'',18,'#5d7259');this.bottomText=this.text(640,699,'← → 微調角度　X 換球　Tab 換台　P 暫停　｜　點選果陣上方瞄準',17,'#355b4a');
  this.cannon=this.art(BX+s.launchX,BY+490,1,95).setOrigin(.5,.25);this.loaded=this.bubble({color:s.current,kind:'fruit'},BX+s.launchX,BY+490);this.projectile=null;
  this.syncBoard();this.drawState();this.drawAim();
 }
 bubble(b,x,y){
  const c=this.add.container(x,y),g=this.add.graphics();c.add(g);const color=FRUIT_COLORS[b.color]?.hex||0xf1d9a0;
  if(b.kind==='bird'){g.fillStyle(0xd5f0f0,.93).fillCircle(0,0,23).lineStyle(2,0x7bb3bd,1).strokeCircle(0,0,23);c.add(this.art(0,0,2,57));}
  else if(b.kind==='bomb'){g.fillStyle(0xffe2a2,1).fillCircle(0,0,23).lineStyle(2,0xba8a4b,1).strokeCircle(0,0,23);c.add(this.art(0,-1,3,58));}
  else if(b.kind==='pollen'){for(let i=0;i<4;i++)g.fillStyle(FRUIT_COLORS[i].hex,1).fillCircle((i%2?1:-1)*8,(i<2?-1:1)*8,14);g.lineStyle(2,0xffffff,1).strokeCircle(0,0,23);c.add(this.text(0,-1,'✦',29,'#ffffff'));}
  else{g.fillStyle(color,1).fillCircle(0,0,23).lineStyle(2,0xffffff,.8).strokeCircle(0,0,22);c.add(this.art(0,-1,5,63).setTint(color));c.add(this.text(0,2,FRUIT_COLORS[b.color].symbol,22,'#ffffff'));
   if(b.kind==='vine'){g.lineStyle(5,0x4a875b,1).strokeCircle(0,0,22).lineStyle(3,0x80b368,1).lineBetween(-17,-14,17,14);c.add(this.text(15,-17,'藤',13,'#244f39'));}
   if(b.kind==='armor'){g.lineStyle(5,0x6b818d,1).strokeCircle(0,0,22);c.add(this.add.circle(14,14,11,0x586e7a));c.add(this.text(14,14,String(b.hp),15,'#ffffff'));}
  }return c;
 }
 syncBoard(){
  for(const v of this.bubbleViews.values())v.destroy();this.bubbleViews.clear();const s=this.session;
  for(const [k,b]of s.board){const p=cellPosition(b,s.offsetAt(s.time));this.bubbleViews.set(k,this.bubble(b,BX+p.x,BY+p.y));}
  this.currentView?.destroy();this.nextView?.destroy();this.currentView=this.bubble({kind:'fruit',color:s.current},1039,238);this.nextView=this.bubble({kind:'fruit',color:s.next},1171,238);
  this.loaded?.destroy();this.loaded=this.bubble({kind:'fruit',color:s.current},BX+s.launchX,BY+490);
 }
 canAim(){return this.mode==='playing'&&this.session?.phase==='ready'&&this.effectTime<=0;}
 inBoard(p){return p.x>=BX&&p.x<=BX+528&&p.y>=BY&&p.y<BY+458;}
 aimAt(p){if(!this.canAim())return;this.angle=Math.max(-72,Math.min(72,Math.atan2(p.x-BX-this.session.launchX,BY+490-p.y)*180/Math.PI));this.previewClock=0;this.drawAim();}
 shoot(){if(!this.canAim()||this.inputGrace>0)return false;this.clearInput();if(!this.session.fire(this.angle))return false;this.projectile?.destroy();this.projectile=this.bubble({kind:'fruit',color:this.session.flight.color},BX+this.session.launchX,BY+490);this.loaded.setVisible(false);this.aimGraphics.clear();this.ghost.clear();this.tone('send');return true;}
 swap(){if(!this.canAim()||!this.session.swap())return false;this.syncBoard();this.drawState();this.drawAim();this.tone('hint');return true;}
 changeLauncher(){if(!this.canAim()||!this.session.switchLauncher())return false;this.aimPointer=null;this.syncBoard();this.drawState();this.drawAim();return true;}
 drawAim(){
  this.aimGraphics.clear();this.ghost.clear();if(!this.canAim())return;const s=this.session,tr=traceFruitShot(s,this.angle);this.preview=tr;if(!tr)return;
  const color=FRUIT_COLORS[s.current].hex;for(const p of tr.points)this.aimGraphics.fillStyle(color,.8).fillCircle(BX+p.x,BY+p.y,2.7);
  if(tr.slot){const p=cellPosition(tr.slot,s.offsetAt(s.time+tr.duration));this.ghost.fillStyle(color,.18).fillCircle(BX+p.x,BY+p.y,23).lineStyle(3,color,.85).strokeCircle(BX+p.x,BY+p.y,23);}
  else{const p=tr.points.at(-1);this.ghost.lineStyle(4,0xc16661,1).lineBetween(BX+p.x-9,BY+p.y-9,BX+p.x+9,BY+p.y+9).lineBetween(BX+p.x+9,BY+p.y-9,BX+p.x-9,BY+p.y+9);}
 }
 drawState(){
  const s=this.session,l=s.level,off=s.offsetAt(s.time);this.ceiling.clear().lineStyle(7,0x93ad7c,1).lineBetween(BX+2,BY+off,BX+526,BY+off);
  for(const [k,v]of this.bubbleViews){const b=s.board.get(k);if(b){const p=cellPosition(b,off);v.x=BX+p.x;v.y=BY+p.y;}}
  this.cannon.x=BX+s.launchX;this.cannon.setAngle(this.angle);this.loaded.x=BX+s.launchX;this.loaded.setVisible(this.canAim());
  if(this.projectile&&s.flight){const p=s.projectilePosition();this.projectile.x=BX+p.x;this.projectile.y=BY+p.y;}
  const g=s.waveGoal,birds=[...s.board.values()].filter(b=>b.kind==='bird').length,targets=[...s.board.values()].filter(b=>b.color===g.color).length;
  this.goalText.setText(g.type==='rescue'?`救援小鳥\n還有 ${birds} 隻等你`:g.type==='color'?`採光${FRUIT_COLORS[g.color].name}\n還剩 ${targets} 顆`:`採光整片果陣\n還剩 ${s.board.size} 顆`);
  this.progressText.setText(`已救援 ${s.stats.rescued} 隻　收成 ${s.stats.removed} 顆\n最大連鎖 ${s.stats.maxBurst} 顆${l.waves?`　｜　第 ${s.wave+1} / 3 幕`:''}`);
  this.starText.setText(`☆ 完成本關目標\n${s.shots<=l.par?'☆':'○'} 用 ${l.par} 球以內完成\n${s.stats.maxBurst>=l.chain?'★':'☆'} 一球收成 ${l.chain} 顆以上`);
  this.ammoText.setText(`剩餘 ${s.remaining} / ${l.shots} 球`);
  const wind=s.flight?.wind??s.wind;this.windText.setText(wind===0?'風向：微風靜止':wind>0?'風向：向右 →':'風向：← 向左');
  this.pressureText.setText(l.descendEvery?`再 ${l.descendEvery-s.shots%l.descendEvery} 球，枝葉下降`:l.motion?'枝葉正在緩緩升降':'觀察不扣時間');
  this.angleText.setText(`${s.launchers.length>1?`發射台 ${s.launchIndex+1}　`:''}角度 ${Math.round(this.angle)}°`);
  this.fireButton.setAlpha(this.canAim()?1:.5);this.swapButton.setAlpha(this.canAim()?1:.5);
  if(this.effectTime<=0)this.noticeText.setText(l.waves?`古樹的果園　第 ${s.wave+1} / 3 幕`:l.focus);
 }
 showEffects(result){
  const off=this.session.offsetAt(this.session.time);for(const [items,fall]of [[result.removed,false],[result.fallen,true]])for(const b of items){const p=cellPosition(b,off),v=this.bubble(b,BX+p.x,BY+p.y);v.setDepth(20);this.effects.push({v,x:BX+p.x,y:BY+p.y,fall,bird:b.kind==='bird',age:0});}
  this.effectTime=result.burst?.75:.24;this.noticeText.setText(result.rescued?`救出 ${result.rescued} 隻小鳥！　整串收成 ${result.burst} 顆`:result.burst?`${result.bounces?'反彈成功！　':''}${result.explosions?'松果連爆！　':''}收成 ${result.burst} 顆${result.fallen.length?` · 掉落 ${result.fallen.length} 顆`:''}`:result.unlocked.length?'外層鬆開了，繼續找同色連消！':'先留下這顆，再找下一次連消。');
  if(result.burst)this.tone('correct');else if(result.unlocked.length)this.tone('hint');
 }
 update(_time,delta){
  if(this.mode!=='playing'||!this.session)return;const dt=Math.min(.1,Math.max(0,delta/1000));this.inputGrace=Math.max(0,this.inputGrace-dt);
  if(this.effectTime>0){this.effectTime=Math.max(0,this.effectTime-dt);for(const f of this.effects){f.age+=dt;const u=Math.min(1,f.age/.75);if(f.bird){f.v.x=f.x+(185-f.x)*u;f.v.y=f.y+(231-f.y)*u-Math.sin(u*Math.PI)*65;f.v.setAlpha(1-u*.4);}else if(f.fall){f.v.y=f.y+540*u*u;f.v.setAngle(u*120);f.v.setAlpha(1-u);}else{f.v.setAlpha(1-u);f.v.setScale(1+u*.6);}}
   if(this.effectTime===0){this.effects.forEach(f=>f.v.destroy());this.effects=[];this.drawAim();if(['won','lost'].includes(this.session.phase)){this.finishLevel();return;}}
  }else{
   if(this.canAim()){const direction=(this.held.has('ArrowRight')?1:0)-(this.held.has('ArrowLeft')?1:0);if(direction)this.angle=Math.max(-72,Math.min(72,this.angle+direction*57*dt));}
   this.session.advance(dt);
   for(const event of this.session.events.splice(0)){if(event.type==='resolve'){this.projectile?.destroy();this.projectile=null;this.syncBoard();this.showEffects(event.result);}if(event.type==='lost')this.lossReason=event.reason;}
  }
  this.previewClock-=dt;if(this.previewClock<=0){this.drawAim();this.previewClock=.09;}this.drawState();
 }
 dialog(title,body){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;o.add([this.add.rectangle(640,360,1280,720,0x204333,.83).setInteractive(),this.panel(640,358,1000,596,0xfcfff0,0xb5c8a7),this.text(640,112,title,31),this.text(640,189,body,22).setWordWrapWidth(903,true)]);return o;}
 showHelp(){
  if(!['select','playing'].includes(this.mode))return;if(this.mode==='playing'){this.pauseGame();return;}this.mode='intro';const o=this.dialog('瞄準一顆，收成一整串','相同顏色、圖案連成三顆以上就會消除。\n拆掉上方支點，下面所有顏色都會掉落；小鳥也能因此獲救。');
  const rules=[['三顆連消','♥ ● ◆ ✿','顏色和圖案一起看\nX 可交換這一球和下一球'],['特殊果實','藤  2  ✦','藤圈打一次、硬殼打兩次\n花粉會染色自己與鄰果'],['連鎖救援','松果與小鳥','打松果，炸掉周圍一圈\n小鳥靠掉落或爆炸獲救']];
  rules.forEach(([title,icon,body],i)=>{const x=334+i*306;o.add([this.panel(x,357,283,216,CHAPTER_COLORS[i],0xb8caaa),this.text(x,284,title,23),this.text(x,337,icon,28),this.text(x,411,body,18)]);});
  o.add(this.text(640,503,'滑鼠：移動瞄準、點一下發射　｜　觸控：按住瞄準、放開發射\n方向鍵微調、空白鍵發射。後段可用 Tab 切換發射台。',19));
  o.add(this.button(640,587,316,56,'前往果園選關',()=>{this.seenIntro=true;this.overlay.destroy();this.overlay=null;this.mode='select';}));
 }
 pauseGame(){
  if(this.mode!=='playing')return;this.mode='paused';this.session.paused=true;this.clearInput();this.stopTones();const l=this.session.level;
  const o=this.dialog('果園休息站','果陣與飛行都已暫停；回來後再繼續瞄準。\n三顆同色連消、拆支點整串掉落；小鳥靠掉落或爆炸獲救。');
  o.add(this.text(640,292,'藤圈：直接命中 1 次　硬殼：直接命中 2 次\n花粉：染色自己和鄰近普通果實　松果：引爆周圍一圈\n虛線預測風力、反彈和移動果陣；紅叉代表沒有可黏附空位。',21));
  o.add(this.text(640,403,l.hint,20).setWordWrapWidth(858,true));
  o.add(this.button(640,493,286,55,'繼續瞄準',()=>this.resumeGame()));o.add(this.button(463,572,286,55,'本關重新開始',()=>this.confirmRestart(),0xa59369));o.add(this.button(817,572,286,55,'返回選關',()=>this.showSelection(),0x7e9475));
 }
 resumeGame(){if(this.mode!=='paused')return;this.overlay.destroy();this.overlay=null;this.clearInput();this.session.paused=false;this.mode='playing';this.inputGrace=.2;this.drawAim();}
 confirmRestart(){if(this.mode!=='paused')return;this.mode='confirm';const o=this.dialog('重新整理這片果園？','這一局的果陣、發射次數與救援會重新開始。\n本次已得到的最佳星星會保留。');o.add(this.button(462,479,280,59,'繼續目前這一局',()=>{this.mode='paused';this.resumeGame();}));o.add(this.button(818,479,280,59,'重新開始',()=>this.restartLevel(),0xa59369));}
 restartLevel(){this.session=new FruitSession(this.currentLevel);this.angle=0;this.renderLevel();}
 finishLevel(){
  const s=this.session,won=s.phase==='won';this.mode='finished';this.clearInput();const medals=s.medals(),stars=medals.filter(Boolean).length;
  if(won){const old=this.records[s.level.id];this.records[s.level.id]={stars:Math.max(stars,old?.stars||0),shots:Math.min(s.shots,old?.shots??Infinity)};this.tone('finish');}
  const o=this.dialog(won?(s.level.waves?'古樹醒來了，謝謝果實彈射隊！':'滿滿一籃，任務完成！'):'再想一個收成方法',won?`${'★'.repeat(stars)}${'☆'.repeat(3-stars)}\n用了 ${s.shots} 球　｜　救出 ${s.stats.rescued} 隻　｜　最大連鎖 ${s.stats.maxBurst} 顆`:this.lossReason==='shots'?'這一局的果實用完了。\n試著交換下一球，或從側邊拆掉上方支點。':'果陣最低位置進入警戒區，或黏附空間用完了。\n先清理下方，再找能讓整串掉落的角度。');
  o.add(this.art(640,323,won?2:0,143));o.add(this.text(640,423,won?`${medals[1]?'✓':'○'} ${s.level.par} 球內完成　　${medals[2]?'✓':'○'} 一球收成 ${s.level.chain} 顆`:'果園沒有扣愛心，可以保留經驗重新挑戰。',22));
  o.add(this.button(347,531,250,62,'再挑戰一次',()=>this.restartLevel(),0xa59369));o.add(this.button(640,531,250,62,'返回選關',()=>this.showSelection(),0x7e9475));
  o.add(this.button(933,531,250,62,this.index==='daily'?'主線關卡':this.index<14?'下一關 →':'每日挑戰',()=>this.index==='daily'?this.showSelection():this.index<14?this.startLevel(this.index+1):this.startLevel('daily')));
  o.add(this.text(640,608,'星星只記在本次開啟中；所有關卡都能自由重玩。',18));
 }
 leave(){this.clearInput();this.stopTones();if(this.session)this.session.paused=true;if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
