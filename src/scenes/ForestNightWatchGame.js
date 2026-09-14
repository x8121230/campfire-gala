import AnimalSnackGame from './AnimalSnackGame.js';
import {NightWatchSession,WatchTouch,WATCH_WORLD,WATCH_CONTROLS,WATCH_BUILDS,WATCH_UPGRADES} from '../data/NightWatchRules.js';
import {preferences} from '../systems/AdventurePreferences.js';
const VIEW={x:0,y:84,w:1280,h:500},CAPTURE=['UP','DOWN','LEFT','RIGHT','SPACE','SHIFT'];
export default class ForestNightWatchGame extends AnimalSnackGame{
 constructor(){super('ForestNightWatchGame');}
 preload(){for(const key of ['ground','hero','units','props'])if(!this.textures.exists('watch_'+key))this.load.image('watch_'+key,`assets/forest-night-watch/${key}.png`);}
 create(){
  this.soundOn=true;this.audioNodes=new Set();this.session=null;this.mode='title';this.overlay=null;this.touch=new WatchTouch();this.held=new Set();this.requests={};this.views=new Map();this.effects=[];this.best=0;
  const canvas=this.game.canvas,oldTouchAction=canvas?.style?.touchAction;if(canvas?.style)canvas.style.touchAction='none';this.events.once('shutdown',()=>{if(canvas?.style)canvas.style.touchAction=oldTouchAction||'';});
  const extra=Math.max(0,4-(this.input.manager?.pointersTotal??1));if(extra)this.input.addPointer(extra);
  for(const [key,frames] of [['units',[['wolf',0,0,640,526],['boar',640,0,640,550],['bear',0,526,660,754],['tree',660,550,620,730]]],['props',[['acorn',0,0,640,610],['frost',640,0,640,610],['bloom',0,610,640,670],['cache',640,610,640,670]]]]){
   if(!this.textures.exists('watch_'+key))continue;const t=this.textures.get('watch_'+key),im=t.getSourceImage();
   for(const [id,x,y,w,h]of frames)if(!t.has(id))t.add(id,0,Math.round(x*im.width/1280),Math.round(y*im.height/1280),Math.round(w*im.width/1280),Math.round(h*im.height/1280));
  }
  this.keyDown=e=>{if(e.repeat)return;if(['Escape','KeyP'].includes(e.code)){this.mode==='paused'?this.resumeGame():this.pauseGame();return;}if(this.mode!=='playing')return;this.held.add(e.code);if(['Space','ShiftLeft','ShiftRight'].includes(e.code))this.requests.dash=true;if(e.code==='KeyK')this.requests.skill=true;if(e.code==='KeyE')this.requests.interact=true;};
  this.keyUp=e=>this.held.delete(e.code);
  this.down=p=>{if(this.mode==='playing')this.touch.down(p);};this.move=p=>{if(this.mode==='playing')this.touch.move(p);};this.up=p=>this.touch.up(p);this.cancel=()=>this.clearInput();
  this.input.on('pointerdown',this.down);this.input.on('pointermove',this.move);this.input.on('pointerup',this.up);this.input.on('pointerupoutside',this.up);this.input.on('gameout',this.cancel);
  this.input.keyboard?.on('keydown',this.keyDown);this.input.keyboard?.on('keyup',this.keyUp);this.input.keyboard?.addCapture(CAPTURE);
  this.blur=()=>this.pauseGame();this.hidden=()=>{if(document.hidden)this.pauseGame();};this.resize=()=>{if(this.portrait()&&this.mode==='playing')this.pauseGame('請橫放手機再繼續');};
  this.game.events.on('blur',this.blur);document.addEventListener('visibilitychange',this.hidden);window.addEventListener('resize',this.resize);window.addEventListener('pointercancel',this.cancel);
  this.events.once('shutdown',()=>{this.input.off('pointerdown',this.down);this.input.off('pointermove',this.move);this.input.off('pointerup',this.up);this.input.off('pointerupoutside',this.up);this.input.off('gameout',this.cancel);this.input.keyboard?.off('keydown',this.keyDown);this.input.keyboard?.off('keyup',this.keyUp);this.input.keyboard?.removeCapture(CAPTURE);this.game.events.off('blur',this.blur);document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('resize',this.resize);window.removeEventListener('pointercancel',this.cancel);this.clearInput();this.stopTones();this.worldMask?.destroy();this.worldMask=null;});
  if(['ground','hero','units','props'].some(k=>!this.textures.exists('watch_'+k))){this.dialog('森林素材尚未載入','請完整覆蓋 assets/forest-night-watch 資料夾，\n返回遊戲列表後重新進入。',()=>this.leave(),'返回遊戲列表');return;}
  this.showTitle();
 }
 portrait(){return (globalThis.innerHeight||window.innerHeight)>(globalThis.innerWidth||window.innerWidth);}
 text(x,y,t,size=25,color='#fff0d3',origin=.5){return super.text(x,y,t,size,color,origin);}
 b(x,y,w,h,t,fn,color=0x386753){const v=super.button(x,y,w,h,t,fn,color,'#fff0d3');v.label.setFontSize(26).setWordWrapWidth(w-22,true);return v;}
 clearInput(){this.touch?.reset();this.held?.clear();this.requests={};}
 clear(){this.clearInput();this.tweens.killAll();this.worldMask?.destroy();this.worldMask=null;this.children.removeAll(true);this.overlay=null;this.views.clear();this.effects=[];}
 art(x,y,key,frame,size){const v=this.add.image(x,y,'watch_'+key,frame);v.setScale(size/Math.max(v.width,v.height));return v;}
 showTitle(){
  this.clear();this.mode='title';this.add.image(640,360,'watch_ground').setDisplaySize(1280,720).setAlpha(.5);
  this.panel(640,352,1200,650,0x173b35,0xb8b576,28);
  this.text(790,112,'森林守夜隊',51);this.text(790,174,'第一章 · 月光樹的守望',30,'#e4cf91');
  this.art(258,349,'hero',undefined,366);
  this.text(788,271,'阿晨晨，夢霧讓森林動物迷了路。\n找補給、搭建防線，用星光讓牠們恢復平靜。',28).setWordWrapWidth(740,true);
  this.text(788,391,'左手搖桿移動　右手按住攻擊\n閃避衝撞、施放淨化波，守住三波夢霧。',27,'#c4dbce');
  this.text(788,477,'3 種防禦設施 · 3 種成長路線 · 熊首領戰',24,'#efcd83');
  this.b(330,606,345,84,'← 返回遊戲列表',()=>this.leave());this.b(849,606,622,84,'進入月光林地',()=>this.start(),0x9c7942);
 }
 start(){
  if(this.portrait()){this.dialog('請把手機橫放','本關使用左搖桿與右側按鈕，\n橫放後點「返回」再開始。',()=>this.showTitle(),'返回');return;}
  this.session=new NightWatchSession();this.renderGame();this.sound.context?.resume?.()?.catch?.(()=>{});this.pauseGame('出發前的小提醒',true);
 }
 renderGame(){
  this.clear();this.mode='playing';this.session.setPaused(false);this.camera={x:0,y:0};
  this.add.rectangle(640,360,1280,720,0x142e2c);
  this.world=this.add.container(0,VIEW.y);const mask=this.add.graphics().fillStyle(0xffffff).fillRect(0,VIEW.y,VIEW.w,VIEW.h).setVisible(false);this.worldMask=mask.createGeometryMask();this.world.setMask(this.worldMask);
  this.ground=this.add.image(0,0,'watch_ground').setOrigin(0).setDisplaySize(WATCH_WORLD.width,WATCH_WORLD.height);this.world.add(this.ground);
  this.floor=this.add.graphics();this.world.add(this.floor);this.entities=this.add.container(0,0);this.world.add(this.entities);this.fx=this.add.graphics();this.world.add(this.fx);
  this.add.rectangle(640,41,1280,82,0x153a34);this.hp=this.text(137,27,'',25,'#f5d7b1');this.treeHP=this.text(394,27,'',25,'#cbe7b8');this.phaseText=this.text(715,27,'',27,'#f5d595');
  this.b(1004,40,170,65,'操作說明',()=>this.pauseGame('操作與戰術',true));this.b(1187,40,165,65,'暫停',()=>this.pauseGame());
  this.objective=this.text(449,65,'',21,'#c6dccc');this.notice=this.text(640,121,'',25,'#fff4c5').setDepth(20);
  this.panel(640,653,1256,130,0x183c34,0x54755a,23);
  this.controlGraphics=this.add.graphics();
  this.fireLabel=this.text(WATCH_CONTROLS.attack.x,WATCH_CONTROLS.attack.y,'按住\n攻擊',28);
  this.dashLabel=this.text(WATCH_CONTROLS.dash.x,WATCH_CONTROLS.dash.y,'閃避',25);
  this.skillLabel=this.text(WATCH_CONTROLS.skill.x,WATCH_CONTROLS.skill.y,'淨化波',24);
  this.useLabel=this.text(WATCH_CONTROLS.interact.x,WATCH_CONTROLS.interact.y,'靠近互動',24).setWordWrapWidth(155,true);
  this.woodLabel=this.text(443,617,'',25,'#f7dd9f');this.upgradeLabel=this.text(464,659,'',20,'#c3decb');
  this.text(432,703,'WASD 移動 · J 攻擊 · 空白 閃避 · K 淨化 · E 互動',17,'#abcbbb');
  this.hint=this.text(640,560,'',25,'#fff6d7').setDepth(30);this.soundCD=0;this.drawState(0);
 }
 controlState(){const t=this.touch.read(),k=this.held;return {...t,x:t.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),y:t.y+Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp')),fire:t.fire||k.has('KeyJ'),dash:t.dash||this.requests.dash,skill:t.skill||this.requests.skill,interact:t.interact||this.requests.interact};}
 update(_t,delta){
  if(this.mode!=='playing'||!this.session)return;const dt=Math.max(0,Math.min(.1,delta/1000)),input=this.controlState();
  if(input.interact){this.requests.interact=false;this.touch.requests.interact=false;this.interact();if(this.mode!=='playing')return;}
  const steps=this.session.advance(dt,input);if(steps){this.requests={};this.touch.consume();}
  this.soundCD=Math.max(0,this.soundCD-dt);
  for(const e of this.session.events.splice(0)){this.effects.push({...e,age:0});if(this.soundCD<=0){this.tone(e.type==='shot'?'send':e.type==='hurt'?'hint':['wave','end'].includes(e.type)?'finish':'correct');this.soundCD=e.type==='shot'?.18:.25;}}
  this.effects=this.effects.map(e=>({...e,age:e.age+dt})).filter(e=>e.age<(e.type==='cleanse'?1.1:.55)).slice(-90);
  this.drawState(dt);if(this.session.status!=='playing')this.finish();
 }
 entity(id,x,y,key,frame,size){let v=this.views.get(id);if(!v){v=this.art(0,0,key,frame,size).setOrigin(.5,.86);this.entities.add(v);this.views.set(id,v);}v.setPosition(x-this.camera.x,y-this.camera.y);v.setVisible(true);return v;}
 drawState(dt){
  const s=this.session,p=s.player;this.camera.x=Math.max(0,Math.min(WATCH_WORLD.width-VIEW.w,p.x-VIEW.w*.5));this.camera.y=Math.max(0,Math.min(WATCH_WORLD.height-VIEW.h,p.y-VIEW.h*.70));const cx=this.camera.x,cy=this.camera.y;
  this.ground.setPosition(-cx,-cy).setTint(s.phase==='battle'?0xc8d5ed:0xffffff);
  const g=this.floor;g.clear();const f=this.fx;f.clear();
  for(const r of WATCH_WORLD.rocks){g.fillStyle(0x183a32,.3).fillEllipse(r.x-cx+8,r.y-cy+20,r.r*2.2,r.r*1.1);g.fillStyle(0x677e70,1).fillCircle(r.x-cx,r.y-cy,r.r);g.fillStyle(0x7e9b7e,1).fillCircle(r.x-cx-12,r.y-cy-16,r.r*.73);g.lineStyle(4,0x385d50).strokeCircle(r.x-cx,r.y-cy,r.r);}
  const live=new Set();
  this.entity('tree',s.tree.x,s.tree.y,'units','tree',194);live.add('tree');
  for(const c of s.caches){if(c.opened)continue;this.entity('cache'+c.id,c.x,c.y,'props','cache',98);live.add('cache'+c.id);g.lineStyle(3,0xffdd83,.7).strokeCircle(c.x-cx,c.y-cy,48+Math.sin(s.time*3)*3);}
  for(const slot of s.slots){g.fillStyle(0x182f2a,.45).fillCircle(slot.x-cx,slot.y-cy,49);g.lineStyle(3,slot.kind?0xa8dba6:0xf0c985,.9).strokeCircle(slot.x-cx,slot.y-cy,49);
   if(slot.kind){this.entity('slot'+slot.id,slot.x,slot.y,'props',slot.kind,114).setFrame(slot.kind);live.add('slot'+slot.id);this.bar(g,slot.x-cx,slot.y-cy+20,72,slot.hp/slot.maxHp,0xbddd9f);}else{g.lineStyle(4,0xe7d6a8).lineBetween(slot.x-cx-14,slot.y-cy,slot.x-cx+14,slot.y-cy).lineBetween(slot.x-cx,slot.y-cy-14,slot.x-cx,slot.y-cy+14);}
  }
  for(const e of s.enemies){const size=e.kind==='bear'?169:e.kind==='boar'?108:95,v=this.entity(e.id,e.x,e.y+Math.sin(s.time*10+e.id)*2,'units',e.kind,size);v.setFlipX(e.state==='walk'?this.session.target(e).x<e.x:e.dir?.x<0).setAlpha(e.flash>0?.58:1);live.add(e.id);this.bar(g,e.x-cx,e.y-cy+13,e.kind==='bear'?105:64,e.hp/e.maxHp,0xc6a3e4);
   if(e.state==='warn'){if(e.kind==='bear'){f.fillStyle(0xf4a4ba,.23).fillCircle(e.aim.x-cx,e.aim.y-cy,e.stage2?155:130);f.lineStyle(5,0xffbcbd,1).strokeCircle(e.aim.x-cx,e.aim.y-cy,e.stage2?155:130);}else{const length=e.kind==='boar'?310:128;f.lineStyle(e.r*1.5,0xffb286,.22).lineBetween(e.x-cx,e.y-cy,e.x-cx+e.dir.x*length,e.y-cy+e.dir.y*length);f.lineStyle(3,0xffe4a8,.9).lineBetween(e.x-cx,e.y-cy,e.x-cx+e.dir.x*length,e.y-cy+e.dir.y*length);}}
  }
  const moving=Math.hypot(this.controlState().x,this.controlState().y)>.1;
  // Hero rendering is isolated here so future paper-doll composition can replace this view.
  const hero=this.entity('hero',p.x,p.y+(moving?Math.sin(s.time*14)*3:0),'hero',undefined,105);hero.setFlipX(p.aim.x<0).setAlpha(p.invincible>0?.65:1);live.add('hero');
  g.fillStyle(0xffefb5,.15).fillCircle(p.x-cx,p.y-cy,p.dashing>0?38:25);
  for(const [id,v]of this.views)if(!live.has(id)){v.destroy();this.views.delete(id);}
  this.entities.sort?.('y');
  for(const shot of s.shots)f.fillStyle(0xfff0a2).fillCircle(shot.x-cx,shot.y-cy,7).fillStyle(0xffffff,.8).fillCircle(shot.x-cx,shot.y-cy,3);
  for(const z of s.zones)f.lineStyle(7,0xffdfb0,z.life/.3).strokeCircle(z.x-cx,z.y-cy,z.r);
  for(const e of this.effects){const x=e.x-cx,y=e.y-cy,a=e.age;if(e.type==='beam')f.lineStyle(4,0xffe799,Math.max(0,1-a/.3)).lineBetween(x,y-20,e.tx-cx,e.ty-cy);
   else if(['nova','frost','heal','cleanse','dash','cache'].includes(e.type)){const r=e.type==='nova'?230*a/.55:e.type==='frost'?250*a/.55:20+a*90;f.lineStyle(e.type==='nova'?6:3,e.type==='cleanse'?0xd8c4ff:e.type==='frost'?0xb1e4ff:0xffe5a1,Math.max(0,1-a)).strokeCircle(x,y,r);
    if(e.type==='cleanse')for(let i=0;i<6;i++){const t=i*Math.PI/3;f.fillStyle(0xffeebd,Math.max(0,1-a)).fillCircle(x+Math.cos(t)*a*80,y+Math.sin(t)*a*65-a*30,5);}}
  }
  this.hp.setText(`阿晨晨 ${Math.ceil(p.hp)} / ${p.maxHp}`);this.treeHP.setText(`月光樹 ${Math.ceil(s.tree.hp)} / ${s.tree.maxHp}`);
  this.phaseText.setText(s.phase==='prepare'?'黃昏 · 自由整備':s.phase==='rest'?'波次間 · 整備時間':`夢霧 ${s.wave} / 3`);
  this.objective.setText(`補給 ${s.stats.caches}/3　·　淨化 ${s.stats.cleansed}　·　${s.phase==='battle'?`剩餘 ${s.enemies.length+s.queue.length} 隻`:'回月光樹開始下一階段'}`);
  this.woodLabel.setText(`木材 ${s.wood}　·　防線 ${s.slots.filter(x=>x.kind).length}/4`);this.upgradeLabel.setText(`分枝 ${s.upgrades.scatter}　穿林 ${s.upgrades.pierce}　月泉 ${s.upgrades.renewal}`);
  const context=s.available();this.useLabel.setText(context?.label||'靠近互動');this.hint.setText(context?`E／互動：${context.label}`:'');
  const boss=s.enemies.find(e=>e.kind==='bear');this.notice.setText(boss?`夢霧熊首領　${Math.ceil(boss.hp)} / ${boss.maxHp}${boss.vulnerable>0?'　破綻！':''}`:s.phase==='battle'?'守住月光樹，粉紅圈出現時閃避':s.phase==='rest'?'這一波守住了！可修復防線，再回樹旁繼續':'三處補給在西北、東北與東南；木材也可留著維修');
  this.drawControls();this.drawCompass();
 }
 bar(g,x,y,w,value,color){g.fillStyle(0x102b29,.8).fillRoundedRect(x-w/2,y,w,6,3);g.fillStyle(color).fillRoundedRect(x-w/2,y,w*Math.max(0,value),6,3);}
 drawControls(){const g=this.controlGraphics,p=this.session.player;g.clear();const j=this.touch.owner===null?WATCH_CONTROLS.joystick:this.touch.origin;
  g.fillStyle(0x1b3c36,.8).fillCircle(j.x,j.y,83).lineStyle(4,0xd7d6a3,.65).strokeCircle(j.x,j.y,83).fillStyle(0xc9dec0,.8).fillCircle(j.x+this.touch.axis.x*59,j.y+this.touch.axis.y*59,34);
  for(const key of ['attack','dash','skill']){const c=WATCH_CONTROLS[key],cd=key==='dash'?p.dashCD:key==='skill'?p.skillCD:0;g.fillStyle(cd>0?0x39504b:key==='attack'?0x9b7745:0x386e68,.96).fillCircle(c.x,c.y,c.r).lineStyle(3,key==='attack'?0xf6df9c:0xacdbcc,1).strokeCircle(c.x,c.y,c.r);}
  const z=WATCH_CONTROLS.interact;g.fillStyle(this.session.available()?0x7e7045:0x294d42).fillRoundedRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h,16);
  this.dashLabel.setText(p.dashCD>0?`${p.dashCD.toFixed(1)}\n閃避`:'閃避');this.skillLabel.setText(p.skillCD>0?`${Math.ceil(p.skillCD)} 秒`:'淨化波');
 }
 drawCompass(){
  const s=this.session,p=s.player,targets=s.phase==='prepare'?s.caches.filter(c=>!c.opened):s.phase==='battle'?[...s.enemies]:[];
  const t=targets.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||s.tree;
  const dx=t.x-this.camera.x,dy=t.y-this.camera.y;
  if(dx>25&&dx<1255&&dy>35&&dy<460)return;const x=Math.max(40,Math.min(1240,dx)),y=Math.max(55,Math.min(440,dy));this.fx.fillStyle(0xffdf8a).fillCircle(x,y,15).lineStyle(3,0x244a3d).lineBetween(x,y,x+(t.x-p.x)/Math.max(1,Math.hypot(t.x-p.x,t.y-p.y))*24,y+(t.y-p.y)/Math.max(1,Math.hypot(t.x-p.x,t.y-p.y))*24);
 }
 interact(){const s=this.session,a=s.interact();if(!a)return;
  if(a.type==='cache'){this.tone('correct');return;}
  if(a.type==='slot'){this.buildMenu(a.id);return;}
  if(a.type==='tree'){
   if(s.phase==='battle'){this.repairTree();return;}
   this.menuPause();const box=this.makeDialog('月光樹旁的整備','準備好就選一項祝福，迎接下一波。\n也能先修復月光樹，保留更多防守餘裕。');
   box.add(this.b(395,426,430,84,'修復月光樹 · 15 木材',()=>{const ok=s.repair();this.menuClose();if(!ok)this.smallNotice('木材不足，或月光樹不需要修復。');}));
   box.add(this.b(892,426,460,84,'選擇祝福，開始守夜',()=>{this.menuClose();if(s.startNight())this.upgradeMenu();else this.smallNotice(s.message);},0x987641));this.closeButton(box);
  }
 }
 repairTree(){const ok=this.session.repair();if(!ok)this.smallNotice('修復需要 15 木材，且月光樹尚未滿血。');}
 menuPause(){this.mode='menu';this.session?.setPaused(true);this.clearInput();this.stopTones();}
 menuClose(){this.overlay?.destroy();this.overlay=null;this.mode='playing';this.session?.setPaused(false);this.clearInput();if(this.portrait())this.pauseGame('請橫放手機再繼續');}
 makeDialog(title,body){this.overlay?.destroy();const b=this.add.container(0,0).setDepth(1000);this.overlay=b;b.add(this.add.rectangle(640,360,1280,720,0x081f1b,.85).setInteractive());b.add(this.panel(640,355,1190,644,0x173d34,0xb8a96d,28));b.add(this.text(640,118,title,39));b.body=this.text(640,220,body,27,'#cde1d0').setWordWrapWidth(1080,true);b.add(b.body);return b;}
 closeButton(box,label='返回戰場'){box.add(this.b(640,604,580,82,label,()=>this.menuClose()));}
 dialog(title,body,callback,label='繼續'){const b=this.makeDialog(title,body);b.add(this.b(640,602,660,84,label,callback));}
 smallNotice(message){this.menuPause();const b=this.makeDialog('守夜筆記',message);this.closeButton(b);}
 buildMenu(id){this.menuPause();const s=this.session,slot=s.slots[id],box=this.makeDialog('選擇防禦設施',`目前木材 ${s.wood}　·　改建也需支付完整材料\n砲台輸出、蘑菇緩速、花燈治療，可以混搭。`);
  Object.entries(WATCH_BUILDS).forEach(([kind,b],i)=>{const x=265+i*377;box.add(this.art(x,350,'props',kind,125));box.add(this.text(x,426,b.tip,22));box.add(this.b(x,495,350,78,`${b.name} · ${b.cost}`,()=>{const ok=s.build(id,kind);this.menuClose();if(!ok)this.smallNotice('木材不足，這次沒有扣除材料。');},0x7c713e));});
  if(slot.kind)box.add(this.b(352,605,510,78,'維修本設施 · 15 木材',()=>{const ok=s.repair(id);this.menuClose();if(!ok)this.smallNotice('材料不足，或設施不需要維修。');}));
  box.add(this.b(slot.kind?925:640,605,slot.kind?510:600,78,'先不建設，返回',()=>this.menuClose()));
 }
 upgradeMenu(){this.menuPause();const box=this.makeDialog('選一項月光祝福',`第 ${this.session.wave+1} 波前的成長選擇\n相同祝福可疊加；也能組合成不同打法。`);
  WATCH_UPGRADES.forEach((u,i)=>{const x=265+i*377;box.add(this.text(x,353,u.name,32,'#ffe0a3'));box.add(this.text(x,435,u.tip,26).setWordWrapWidth(320,true));box.add(this.b(x,571,345,88,'選擇這項祝福',()=>{if(this.session.choose(u.id)){this.menuClose();this.drawState(0);}},0x92733e));});
 }
 pauseGame(title='休息一下，森林會等你',instructions=false){if(this.mode!=='playing')return;this.mode='paused';this.session.setPaused(true);this.clearInput();this.stopTones();
  const body=instructions?'左側拖曳搖桿／WASD 移動，右側按住攻擊／J 自動瞄準附近動物。\n空白鍵或閃避：短暫無敵。K／淨化波：範圍淨化與小量治療。\n靠近補給、防線或月光樹，按 E／互動。選單中戰鬥暫停。\n先找補給再守夜；粉紅圈與亮線是動物衝撞、重擊的預告。':'戰鬥與技能時間已暫停。\n返回時請橫放螢幕，再按繼續。';
  const box=this.makeDialog(title,body);if(instructions)box.body.setPosition(640,283).setFontSize(25);box.add(this.b(350,485,490,85,'繼續守夜',()=>this.resumeGame(),0x92733e));box.add(this.b(920,485,490,85,'重新準備本關',()=>this.start()));box.add(this.b(640,604,660,82,'返回遊戲列表',()=>this.leave()));
 }
 resumeGame(){if(this.mode!=='paused'||this.portrait())return;this.overlay?.destroy();this.overlay=null;this.clearInput();this.mode='playing';this.session.setPaused(false);}
 finish(){this.mode='result';this.session.setPaused(true);this.clearInput();const won=this.session.status==='won',s=this.session;this.best=Math.max(this.best,s.stars());
  const box=this.makeDialog(won?'月光亮起，夢霧散去了！':'先休息，再準備一次',won?`阿晨晨讓森林動物恢復了平靜。\n本次 ${s.stars()} 星：通關 1 星、三處補給 1 星、月光樹保留半血 1 星。`:s.message);
  box.add(this.art(297,400,'hero',undefined,218));box.add(this.text(830,354,`淨化動物 ${s.stats.cleansed}　補給 ${s.stats.caches}/3\n剩餘樹光 ${Math.ceil(s.tree.hp)}　承受傷害 ${s.stats.damage}\n本次開啟最佳 ${this.best} 星`,29));
  box.add(this.text(830,473,'換一種祝福或防線，試試不同打法。',25,'#ead3a1'));box.add(this.b(365,605,500,85,'重新挑戰',()=>this.start(),0x92733e));box.add(this.b(930,605,500,85,'返回遊戲列表',()=>this.leave()));this.tone(won?'finish':'hint');
 }
 tone(kind){if(preferences.value.sfx)super.tone(kind);}
 leave(){this.session?.setPaused(true);this.clearInput();this.stopTones();this.scene.start(this.returnScene||'MiniGameHub');}
}
