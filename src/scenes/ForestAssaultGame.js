import AnimalSnackGame from './AnimalSnackGame.js';
import {AssaultSession,assaultMover,assaultHazard} from '../data/AssaultRules.js';
import {ASSAULT_LEVELS} from '../data/AssaultLevels.js';
import {ASSAULT_WEAPONS,ASSAULT_DIFFICULTIES,ASSAULT_LOADOUTS,ASSAULT_BALANCE} from '../data/AssaultConfig.js';
const X=20,Y=98,W=1240,H=500;
const COLORS=[0x426b53,0x65876c,0x465c77,0x608298,0x9a6752,0x416b62];
const CAPTURE=['UP','DOWN','LEFT','RIGHT','SPACE','SHIFT'];
export default class ForestAssaultGame extends AnimalSnackGame {
  constructor(){super('ForestAssaultGame');}
  preload(){for(const name of ['units','bosses','worlds'])if(!this.textures.exists(`assault_${name}`))this.load.spritesheet(`assault_${name}`,`assets/forest-assault/${name}.png`,{frameWidth:512,frameHeight:512});}
  art(x,y,frame,size=80,key='units'){return this.add.image(x,y,`assault_${key}`,frame).setDisplaySize(size,size);}
  create(){
    this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.records=this.records||{};this.difficulty=this.difficulty||'standard';this.loadout=this.loadout??0;this.autoFire=this.autoFire??false;
    this.session=null;this.mode='select';this.overlay=null;this.held=new Set();this.touch=new Map();this.requests={};this.effects=[];this.cameraX=0;
    const extra=Math.max(0,4-(this.input.manager?.pointersTotal??1));if(extra)this.input.addPointer?.(extra);
    this.keyDown=e=>{if(e.repeat)return;if(['Escape','KeyP'].includes(e.code)){if(this.mode==='paused')this.resumeGame();else this.pauseGame();return;}if(this.mode!=='playing')return;
      this.held.add(e.code);if(/^Digit[123]$/.test(e.code))this.changeWeapon(Number(e.code.at(-1))-1);
      if(e.code==='KeyQ')this.changeWeapon((this.session.player.weapon+1)%3);
      if(['Space','KeyK'].includes(e.code))this.requests.jump=true;if(['ShiftLeft','ShiftRight','KeyL'].includes(e.code))this.requests.dash=true;
      if(e.code==='KeyE')this.requests.interact=true;if(e.code==='KeyG')this.requests.grenade=true;
    };
    this.keyUp=e=>this.held.delete(e.code);this.onUp=p=>this.touch.delete(p.id);
    this.input.keyboard?.on('keydown',this.keyDown);this.input.keyboard?.on('keyup',this.keyUp);this.input.keyboard?.addCapture?.(CAPTURE);
    this.input.on('pointerup',this.onUp);this.input.on('pointerupoutside',this.onUp);
    this.visibilityHandler=()=>{if(document.hidden)this.pauseGame();};this.blurHandler=()=>this.pauseGame();document.addEventListener('visibilitychange',this.visibilityHandler);this.game.events.on('blur',this.blurHandler);
    this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',this.visibilityHandler);this.game.events.off('blur',this.blurHandler);this.input.keyboard?.off('keydown',this.keyDown);this.input.keyboard?.off('keyup',this.keyUp);this.input.keyboard?.removeCapture?.(CAPTURE);this.input.off('pointerup',this.onUp);this.input.off('pointerupoutside',this.onUp);this.clearInput();this.stopTones();this.worldMask?.destroy();this.worldMask=null;this.session=null;});
    if(['units','bosses','worlds'].some(n=>!this.textures.exists(`assault_${n}`))){this.dialog('素材尚未載入','請完整複製 assets/forest-assault，\n返回遊戲列表後重新進入。').add(this.button(640,530,300,60,'返回遊戲列表',()=>this.leave()));return;}
    this.showSelection();if(!this.seenIntro)this.showIntro();
  }
  clearInput(){this.held?.clear();this.touch?.clear();this.requests={};if(this.session){this.session.previous={};this.session.player.buffer=0;}}
  clear(){this.clearInput();this.tweens.killAll();this.worldMask?.destroy();this.worldMask=null;this.children.removeAll(true);this.overlay=null;this.effects=[];this.views=new Map();this.world=null;}
  backdrop(){this.add.rectangle(640,360,1280,720,0x152f2c);this.art(640,360,0,1280,'worlds').setAlpha(.14);}
  topbar(label){
    this.panel(640,32,1260,54,0x203e36,0x719781,12);this.button(95,32,156,38,'← 遊戲列表',()=>this.leave(),0x426e5c);
    this.text(329,32,'森林突擊小隊',27,'#f4efcf');this.text(687,32,label,18,'#d6e2c9');
    this.soundButton=this.button(1030,32,104,38,this.soundOn?'音效：開':'音效：關',()=>{this.soundOn=!this.soundOn;if(!this.soundOn)this.stopTones();this.soundButton.label.setText(this.soundOn?'音效：開':'音效：關');},0x3b5d50);
    this.button(1170,32,148,38,this.mode==='select'?'操作 / 戰術':'暫停 / 說明',()=>this.mode==='select'?this.showIntro():this.pauseGame(),0x716843);
  }
  showSelection(){
    this.session?.setPaused(true);this.clear();this.mode='select';this.backdrop();this.topbar('六場戰役 · 跑跳射擊 · 載具與探索');
    this.text(43,78,'選擇戰役',25,'#ffefc7',0).setOrigin(0,.5);this.text(525,79,'每關獨立出發 · 檢查點可重試 · 尋找支線與徽章',18,'#c4d9c8');
    this.difficultyButton=this.button(1061,79,309,36,`難度：${ASSAULT_DIFFICULTIES[this.difficulty].name}　切換`,()=>{if(this.mode!=='select')return;const keys=Object.keys(ASSAULT_DIFFICULTIES);this.difficulty=keys[(keys.indexOf(this.difficulty)+1)%keys.length];this.showSelection();},0x5c7251);
    this.levelButtons=ASSAULT_LEVELS.map((l,i)=>{const cx=230+i%3*410,cy=205+Math.floor(i/3)*212,c=this.add.container(cx,cy),r=this.records[`${l.id}:${this.difficulty}`];
      c.add([this.panel(0,0,390,192,0xf1edda,COLORS[i],18),this.art(-117,-10,l.theme,139,'worlds').setDisplaySize(142,163),this.text(54,-62,`${String(l.id).padStart(2,'0')}　${l.title}`,24),this.text(58,-17,l.mission,17).setWordWrapWidth(198,true),this.text(55,62,r?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars):'出發 →',20,r?'#ad752e':'#46694f')]);
      c.setSize(390,192).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='select')this.startLevel(i);});return c;
    });
    this.text(640,531,'選擇出戰配置　｜　同一關也能換打法',20,'#e7e5c6');
    this.loadoutButtons=ASSAULT_LOADOUTS.map((b,i)=>{const selected=this.loadout===i,c=this.add.container(230+i*410,590);c.add([this.panel(0,0,390,78,selected?0x648267:0x294b40,0x95b495,14),this.text(0,-18,`${selected?'✓ ':''}${b.name}`,23,'#fff0c9'),this.text(0,16,b.tip,18,'#d8e8d0')]);c.setSize(390,78).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.mode==='select'){this.loadout=i;this.showSelection();}});return c;});
    this.text(640,668,'★ 完成戰役　★ 全救援＋三枚徽章　★ 一命通關　｜　可先打通，再追求完整收集',18,'#c3d9c4');
  }
  startLevel(index){if(!Number.isInteger(index)||!ASSAULT_LEVELS[index])return;this.index=index;this.session=new AssaultSession(ASSAULT_LEVELS[index],{difficulty:this.difficulty,loadout:this.loadout});this.cameraX=0;this.renderLevel();this.sound.context?.resume?.()?.catch?.(()=>{});}
  renderLevel(){
    this.clear();this.mode='playing';const s=this.session,l=s.level;s.setPaused(false);this.backdrop();this.topbar(`${String(l.id).padStart(2,'0')}　${l.title}　｜　${ASSAULT_DIFFICULTIES[this.difficulty].name}`);
    this.healthText=this.text(35,78,'',22,'#ffc3ae',0).setOrigin(0,.5);this.missionText=this.text(452,78,'',18,'#e7efd4');this.scoreText=this.text(1008,78,'',18,'#ffdf91');
    this.world=this.add.container(X,Y);const mask=this.add.graphics().fillStyle(0xffffff,1).fillRect(X,Y,W,H).setVisible(false);this.worldMask=mask.createGeometryMask();this.world.setMask(this.worldMask);
    this.backgrounds=[0,1,2].map(i=>this.art(i*640,0,l.theme,640,'worlds').setOrigin(0).setDisplaySize(640,500));this.world.add(this.backgrounds);this.world.add(this.add.rectangle(W/2,H/2,W,H,0x061914,.18));
    this.groundGraphics=this.add.graphics();this.world.add(this.groundGraphics);this.hazardGraphics=this.add.graphics();this.world.add(this.hazardGraphics);this.entityLayer=this.add.container(0,0);this.world.add(this.entityLayer);this.detailGraphics=this.add.graphics();this.world.add(this.detailGraphics);
    this.hero=this.art(s.player.x,s.player.y-32,0,86);this.world.add(this.hero);this.bulletGraphics=this.add.graphics();this.world.add(this.bulletGraphics);this.effectGraphics=this.add.graphics();this.world.add(this.effectGraphics);
    this.bossTitle=this.text(W/2,18,'',21,'#fff1c9');this.world.add(this.bossTitle);this.bossBar=this.add.graphics();this.world.add(this.bossBar);
    this.noticeText=this.text(W/2,74,'',24,'#ffedb5');this.world.add(this.noticeText);this.interactText=this.text(W/2,461,'',18,'#fff2b3');this.world.add(this.interactText);
    this.panel(640,657,1260,107,0x1c3c32,0x5d876f,13);
    this.moveButtons={};this.moveButtons.left=this.holdButton(63,651,77,73,'←','left');this.moveButtons.down=this.holdButton(148,670,77,35,'蹲','down');this.moveButtons.up=this.holdButton(148,625,77,35,'↑','up');this.moveButtons.right=this.holdButton(233,651,77,73,'→','right');
    this.weaponButtons=ASSAULT_WEAPONS.map((w,i)=>this.button(331+i*98,632,91,39,`${i+1} ${w.short}`,()=>this.changeWeapon(i),0x607b50));
    this.ammoText=this.text(430,674,'',17,'#e4e9cb');this.autoButton=this.button(632,632,112,39,this.autoFire?'自動射：開':'自動射：關',()=>{if(this.mode==='playing'){this.autoFire=!this.autoFire;this.autoButton.label.setText(this.autoFire?'自動射：開':'自動射：關');}},0x5d6248);
    this.useButton=this.actionButton(631,675,112,37,'互動 E','interact');this.grenadeButton=this.actionButton(763,652,124,75,'松果 G','grenade',0x967442);
    this.dashButton=this.actionButton(901,652,131,75,'衝刺 L','dash',0x4b8586);this.jumpButton=this.actionButton(1040,652,130,75,'跳 K','jump',0x668549);this.fireButton=this.holdButton(1180,652,129,75,'射擊 J','fire',0xb17d4c);
    this.controlsText=this.text(640,709,'AD / ←→ 移動　W / ↑ 上瞄　S / ↓ 蹲下　空白鍵跳　蹲＋跳穿下平台　Shift 衝刺　Q 換槍　E 上下車／開橋',14,'#bccfba');this.soundCooldown=0;this.drawState(0);
  }
  holdButton(x,y,w,h,label,action,color=0x466950){const b=this.button(x,y,w,h,label,()=>{},color);b.on('pointerdown',p=>{if(this.mode==='playing')this.touch.set(p.id,action);});for(const e of ['pointerup','pointerout'])b.on(e,p=>{if(this.touch.get(p.id)===action)this.touch.delete(p.id);});return b;}
  actionButton(x,y,w,h,label,action,color=0x537057){return this.button(x,y,w,h,label,()=>{if(this.mode==='playing')this.requests[action]=true;},color);}
  changeWeapon(i){if(this.mode==='playing')return this.session.setWeapon(i);return false;}
  controls(){const k=this.held,t=new Set(this.touch.values()),has=(a,...keys)=>t.has(a)||keys.some(key=>k.has(key));return {axis:Number(has('right','KeyD','ArrowRight'))-Number(has('left','KeyA','ArrowLeft')),up:has('up','KeyW','ArrowUp'),down:has('down','KeyS','ArrowDown'),fire:this.autoFire||has('fire','KeyJ','KeyZ'),...this.requests};}
  update(_time,delta){if(this.mode!=='playing'||!this.session)return;const dt=Math.max(0,Math.min(.1,delta/1000));this.soundCooldown=Math.max(0,this.soundCooldown-dt);const steps=this.session.advance(dt,this.controls());if(steps)this.requests={};
    for(const e of this.session.events.splice(0)){if(['burst','grenade','bossDown','rescue','chip','fire','dash'].includes(e.type))this.effects.push({...e,age:0});if(e.type==='respawn')this.clearInput();
      if(['hurt','phase','boss'].includes(e.type))this.tone('hint');
      if(['fire','burst','grenade','pickup','rescue','chip','checkpoint'].includes(e.type)&&this.soundCooldown<=0){this.tone(e.type==='fire'?'send':e.type==='grenade'?'finish':'correct');this.soundCooldown=e.type==='fire'?.12:.2;}
    }
    this.drawState(dt);if(this.session.status==='won')this.finishLevel();
  }
  entity(id,x,y,frame,size,key='units'){let v=this.views.get(id);if(!v){v=this.art(0,0,frame,size,key);this.entityLayer.add(v);this.views.set(id,v);}v.x=x-this.cameraX;v.y=y;v.setFrame(frame).setVisible(true);return v;}
  drawState(dt){
    const s=this.session,p=s.player,l=s.level,c=Math.max(0,Math.min(l.width-W,p.x-W*.36));this.cameraX=c;
    this.backgrounds.forEach((v,i)=>{v.x=i*640-(c*.25)%640;});
    const g=this.groundGraphics;g.clear();
    for(const r of s.solids()){if(r.id?.startsWith('o')||r.x+r.w<c||r.x>c+W)continue;const moving=r.id?.startsWith('m'),gate=r.id?.startsWith('g')||r.id==='arena',fill=gate?0x705c62:moving?0xc29553:r.oneWay?0x827b4a:COLORS[l.theme];
      g.fillStyle(fill,1).fillRoundedRect(r.x-c,r.y,r.w,r.h,Math.min(7,r.h/3)).fillStyle(gate?0xf4b9b0:moving?0xffdc98:0xa1c186,1).fillRect(r.x-c,r.y,r.w,5);
      if(!gate)for(let xx=Math.max(r.x,c);xx<Math.min(c+W,r.x+r.w);xx+=37)g.lineStyle(1,0x1a4434,.35).lineBetween(xx-c,r.y+9,xx-c-9,r.y+21);
      if(gate)for(let yy=r.y+12;yy<r.y+r.h;yy+=26)g.lineStyle(3,0xdca995,.7).lineBetween(r.x-c+4,yy,r.x-c+r.w-4,yy+11);
    }
    const hg=this.hazardGraphics;hg.clear();
    for(const h of l.hazards){const state=assaultHazard(h,s.time);hg.fillStyle(state.active?0xff965f:state.warning?0xffc7a2:0x314549,state.active?.6:state.warning?.42:.5).fillRect(h.x-c,h.y,h.w,h.h);hg.lineStyle(state.active?4:2,state.active?0xffe2a4:0xee9690,.85).lineBetween(h.x-c,h.y+h.h,h.x+h.w-c,h.y+h.h);if(state.warning)hg.lineStyle(2,0xffd289,.9).strokeCircle(h.x+h.w/2-c,h.y+12,9);}
    for(const a of s.attacks){const active=a.age>=a.warn;hg.fillStyle(active?0xffb7a1:0xff6386,active?.63:.18).fillRect(a.x-c,a.y,a.w,a.h);hg.lineStyle(active?4:2,active?0xffeed2:0xff91ad,1).lineBetween(a.x-c,a.y,a.x+a.w-c,a.y);if(!active)for(let x=a.x;x<a.x+a.w;x+=40)hg.lineStyle(2,0xffb1b5,.8).lineBetween(x-c,a.y+3,x+12-c,a.y+Math.min(20,a.h));}
    const d=this.detailGraphics;d.clear();const live=new Set();
    for(const e of s.enemies){const frame=e.kind==='drone'?4:3,size=e.kind==='drone'?66:78,v=this.entity(e.id,e.x,e.y-(e.kind==='drone'?21:29),frame,size);live.add(e.id);v.setFlipX(e.facing>0).setAlpha(e.flash>0?.6:1);if(e.kind==='sniper')v.setTint(0xe2b7f0);else if(e.kind==='mortar')v.setTint(0xf0c995);else v.setTint(0xffffff);
      if(e.kind==='shield')d.fillStyle(0xa4dbef,.5).fillRoundedRect(e.x-c+e.facing*23-5,e.y-47,10,46,4).lineStyle(2,0xd4faff,1).lineBetween(e.x-c+e.facing*26,e.y-44,e.x-c+e.facing*26,e.y-6);
      if(e.aim&&e.kind==='sniper')d.lineStyle(2,0xff758d,.7).lineBetween(e.x-c,e.y-24,e.aim.x-c,e.aim.y);
      if(e.aim)d.fillStyle(0xffb980,1).fillCircle(e.x-c,e.y-62,4);
      if(e.hp<e.maxHp)d.fillStyle(0x20342a,.85).fillRect(e.x-c-21,e.y-56,42,4).fillStyle(0xffd285,1).fillRect(e.x-c-21,e.y-56,42*e.hp/e.maxHp,4);
    }
    for(const t of s.tanks){if(t.hp<=0)continue;const id=`tank${t.id}`,v=this.entity(id,t.x,t.y-41,5,148);v.setDisplaySize(156,117).setFlipX(p.tank===t.id&&p.facing<0);live.add(id);d.fillStyle(0x1d3b2e,.9).fillRect(t.x-c-42,t.y-85,84,5).fillStyle(0xc6e987,1).fillRect(t.x-c-42,t.y-85,84*t.hp/ASSAULT_BALANCE.tankHealth,5);}
    for(const o of s.objects){if(o.hp<=0&&o.kind!=='cage')continue;const xx=o.x-c;
      if(o.kind==='crate'){d.fillStyle(0x9f7547,1).fillRoundedRect(xx,o.y,o.w,o.h,5).lineStyle(3,0xe1bd7b,1).lineBetween(xx+6,o.y+7,xx+o.w-6,o.y+o.h-7).lineBetween(xx+o.w-6,o.y+7,xx+6,o.y+o.h-7);const col={ammo:0xc9dcff,health:0xaee6a2,grenade:0xffd898}[o.loot];d.fillStyle(col,1).fillCircle(xx+22,o.y+24,8);}
      if(o.kind==='generator'){d.fillStyle(0x495a6a,1).fillRoundedRect(xx,o.y,o.w,o.h,8).fillStyle(0xabf1fb,.75).fillRoundedRect(xx+9,o.y+10,28,40,6);d.fillStyle(0x233f45,1).fillRect(xx,o.y-10,o.w,5).fillStyle(0x9de5e6,1).fillRect(xx,o.y-10,o.w*o.hp/o.maxHp,5);}
      if(o.kind==='cage'&&!o.rescued){d.fillStyle(0xffcf97,1).fillCircle(xx+24,o.y+34,12).fillStyle(0x2c4534,1).fillCircle(xx+21,o.y+30,2).fillCircle(xx+28,o.y+30,2);if(o.hp>0){d.lineStyle(3,0xc8d9c6,1).strokeRoundedRect(xx,o.y,o.w,o.h,8);for(let k=1;k<4;k++)d.lineBetween(xx+k*12,o.y+4,xx+k*12,o.y+o.h-4);}else d.lineStyle(2,0xb9f4b4,.9).strokeCircle(xx+24,o.y+30,23+Math.sin(s.time*5)*3);}
    }
    l.switches.forEach((v,i)=>{d.fillStyle(0x856d4a,1).fillRect(v.x-c-13,v.y-7,26,35).lineStyle(5,s.switches[i]?0xb9ebae:0xffd187,1).lineBetween(v.x-c,v.y+3,v.x-c+(s.switches[i]?14:-14),v.y-18);});
    l.checkpoints.forEach((v,i)=>{d.lineStyle(4,0xd8cf9b,1).lineBetween(v.x-c,v.y,v.x-c,v.y-70).fillStyle(i<=s.checkpointIndex?0xa7e5a6:0xffcc79,1).fillRoundedRect(v.x-c,v.y-70,33,21,4);});
    l.chips.forEach((v,i)=>{if(!s.chips.includes(i))d.fillStyle(0xffd279,1).fillCircle(v.x-c,v.y+Math.sin(s.time*3)*4,13).lineStyle(2,0xfff0b8,1).strokeCircle(v.x-c,v.y+Math.sin(s.time*3)*4,17);});
    for(const o of s.pickups){const color={health:0xa4ed9c,ammo:0xc2c8ff,grenade:0xffc98e}[o.kind];d.fillStyle(color,1).fillRoundedRect(o.x-c-12,o.y-12,24,24,6).lineStyle(3,0x31533c,1).lineBetween(o.x-c-6,o.y,o.x-c+6,o.y);if(o.kind==='health')d.lineBetween(o.x-c,o.y-6,o.x-c,o.y+6);else if(o.kind==='ammo')d.lineBetween(o.x-c-6,o.y+5,o.x-c+6,o.y+5);else d.strokeCircle(o.x-c,o.y,7);}
    d.lineStyle(4,0xe6dbb9,1).lineBetween(l.exit.x-c,480,l.exit.x-c,400).fillStyle(s.boss?.hp<=0?0xacf09f:0x7b8b79,1).fillRoundedRect(l.exit.x-c,400,40,26,5);
    const b=s.boss;this.bossBar.clear();if(b?.hp>0){live.add('boss');const v=this.entity('boss',b.x,b.y-77,l.theme,230,'bosses');v.setDisplaySize(220,205).setAlpha(b.buried?.18:b.flash>0?.65:1);
      const coreX=b.x-c,coreY=b.y-61;d.lineStyle(3,b.exposed?0xa0fbff:0xf7c67a,.9).strokeCircle(coreX,coreY,b.exposed?31:37);if(b.exposed)d.fillStyle(0x8dfaff,.18).fillCircle(coreX,coreY,31);
      for(const part of s.bossParts()){if(part.hp>0)d.lineStyle(2,0xffdc93,1).strokeRoundedRect(part.x-c,part.y,part.w,part.h,7).fillStyle(0xffc776,1).fillRect(part.x-c,part.y-7,39*part.hp/part.maxHp,4);else d.lineStyle(3,0x2c423a,.85).lineBetween(part.x-c,part.y,part.x+39-c,part.y+39);}
      this.bossBar.fillStyle(0x1b3430,.88).fillRoundedRect(W/2-236,36,472,10,5).fillStyle(0xf2af8c,1).fillRoundedRect(W/2-236,36,472*b.hp/b.maxHp,10,5);this.bossTitle.setText(`${b.name}　${b.phase} / 3　${b.buried?'鑽地中':b.exposed?'核心暴露！':'裝甲防禦'}`);
    }else this.bossTitle.setText('');
    for(const [id,v]of this.views)if(!live.has(id)){v.destroy();this.views.delete(id);}
    this.hero.x=p.x-c;this.hero.y=p.y-(p.crouch?25:32);this.hero.setFrame(p.crouch?2:Math.abs(p.vx)>25?Math.floor(s.time*10)%2:0).setDisplaySize(86,p.crouch?72:86).setFlipX(p.facing<0).setVisible(p.tank<0&&s.respawnDelay<=0).setAlpha(p.invuln>0?.55+.4*Math.abs(Math.sin(s.time*20)):1);
    const aim=this.controls().up;if(aim)d.lineStyle(4,0xffe5ad,.8).lineBetween(p.x-c,p.y-32,p.x-c+(Math.abs(p.vx)>5?p.facing*22:0),p.y-62);
    const bullets=this.bulletGraphics;bullets.clear();for(const q of s.shots){const color=q.kind==='tank'?0xffe193:ASSAULT_WEAPONS.find(w=>w.id===q.kind)?.color||0xc9ffaa;bullets.lineStyle(q.r*1.5,color,.35).lineBetween(q.x-c,q.y,q.x-c-q.vx*.015,q.y-q.vy*.015).fillStyle(color,1).fillCircle(q.x-c,q.y,q.r);}
    for(const q of s.bullets)bullets.fillStyle(0xb44b65,1).fillCircle(q.x-c,q.y,q.r+2).fillStyle(0xffbfca,1).fillCircle(q.x-c,q.y,q.r);
    for(const q of s.grenades)bullets.fillStyle(0xdca36b,1).fillCircle(q.x-c,q.y,8).lineStyle(2,0xffe8b5,1).strokeCircle(q.x-c,q.y,9);
    const fx=this.effectGraphics;fx.clear();for(const e of this.effects){e.age+=dt;const duration=e.type==='bossDown'?1:e.type==='fire'?.1:.5,u=e.age/duration,r=e.type==='grenade'?120:e.type==='bossDown'?130:e.type==='fire'?12:42;if(u<=1){fx.lineStyle(e.type==='grenade'?7:3,e.type==='rescue'?0xb8ffbb:0xffd9a1,1-u).strokeCircle(e.x-c,e.y,Math.max(3,u*r));if(e.type==='grenade')fx.fillStyle(0xffdfae,(1-u)*.2).fillCircle(e.x-c,e.y,u*r);}}this.effects=this.effects.filter(e=>e.age<(e.type==='bossDown'?1:e.type==='fire'?.1:.5));
    this.noticeText.setText(s.messageTime>0?s.message:'');this.healthText.setText(`♥ ${p.hp} / ${s.settings.hp}${p.tank>=0?`　裝甲 ${s.tanks[p.tank].hp}`:''}`);
    this.missionText.setText(`救援 ${s.stats.rescued}/${l.objects.filter(o=>o.kind==='cage').length}　徽章 ${s.chips.length}/3${l.generatorGoal?`　裝置 ${s.stats.generators}/${l.generatorGoal}`:''}`);
    this.scoreText.setText(`${String(s.stats.score).padStart(6,'0')}　連擊 ${s.combo}　${Math.floor(s.time)}s`);
    this.weaponButtons.forEach((v,i)=>v.setAlpha(i===p.weapon?1:.47));this.ammoText.setText(p.tank>=0?`炮管 ${Math.round(s.tanks[p.tank].heat)}%${s.tanks[p.tank].overheat?' 過熱！':''}`:`${ASSAULT_WEAPONS[p.weapon].name}　${p.weapon===0?'∞':p.ammo[p.weapon]} 發`);
    this.grenadeButton.label.setText(`松果 ${p.grenades}\nG`);this.dashButton.label.setText(p.tank>=0?'載具中':p.dashCooldown>0?`衝刺 ${p.dashCooldown.toFixed(1)}`:'衝刺 L');
    this.useButton.label.setText(p.tank>=0?'下車 E':'互動 E');let near='';if(p.tank>=0)near='E 下車探索高處　｜　連射過熱時稍停降溫';else if(l.switches.some((v,i)=>!s.switches[i]&&Math.hypot(v.x-p.x,v.y-(p.y-25))<85))near='按 E／互動 開啟橋樑';else if(s.tanks.some(t=>t.hp>0&&Math.abs(t.x-p.x)<90&&Math.abs(t.y-p.y)<80))near='按 E／互動 駕駛甲蟲坦克';else if(s.objects.some(o=>o.kind==='cage'&&o.hp<=0&&!o.rescued&&Math.abs(o.x-p.x)<120))near='靠近夥伴，完成救援';this.interactText.setText(near);
  }
  dialog(title,body){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;o.add([this.add.rectangle(640,360,1280,720,0x102920,.9).setInteractive(),this.panel(640,360,1040,606,0xf1efdb,0x73917a),this.text(640,104,title,32),this.text(640,178,body,22).setWordWrapWidth(946,true)]);return o;}
  showIntro(){if(this.mode!=='select')return;this.mode='intro';const o=this.dialog('森林突擊小隊，準備出發！','跑跳射擊、探索救援，迎戰六隻機械頭目。\n先選「標準」體驗，再依你的手感調整難度。');
    const rows=[['跑跳與閃避','AD / 方向鍵移動，空白鍵 / K 跳躍\nW 上瞄，S 蹲下；蹲＋跳穿下平台\nShift / L 衝刺，短暫無敵'],['武器與載具','J 按住射擊，1～3 / Q 換槍\nG 松果手榴彈，可越過掩體\nE 開橋／上下坦克，連射會過熱'],['探索與頭目','射開籠子，再靠近救援\n高處有徽章與補給，旗子是檢查點\n頭目先預警、再攻擊，藍光是破綻']];
    rows.forEach(([t,b],i)=>{const x=316+i*325;o.add([this.panel(x,356,306,208,0xe2e5ce,0xa4b696),this.text(x,286,t,23),this.text(x,365,b,18)]);});
    o.add(this.text(640,502,'特殊彈數量有限，種子連發永不缺彈。可以自由選擇任何一關。\n觸控可同時按方向和動作，也可開啟「自動射」。',20));o.add(this.button(640,590,328,57,'選擇戰役與配置',()=>{this.seenIntro=true;this.overlay.destroy();this.overlay=null;this.mode='select';},0x507b59));
  }
  pauseGame(){if(this.mode!=='playing')return;this.mode='paused';this.session.setPaused(true);this.clearInput();this.stopTones();const o=this.dialog('暫停整備',this.session.level.tip);o.add(this.text(640,296,'AD / 方向鍵移動　空白鍵 / K 跳躍　W 上瞄　S 蹲下\nJ 射擊　1～3 / Q 換槍　G 手榴彈　Shift / L 衝刺　E 互動\n綠色＋：治療／修甲　紫色＝：特殊彈藥　橙色○：手榴彈',21));o.add(this.text(640,403,'星星目標：完成戰役、全救援＋三徽章、一命通關。\n倒下會回到檢查點，該段敵人、物件與補給也會重置。',20));o.add(this.button(640,495,302,55,'繼續突擊',()=>this.resumeGame(),0x507b59));o.add(this.button(459,579,294,54,'重新開始本關',()=>this.confirmRestart(),0x99844e));o.add(this.button(821,579,294,54,'返回選關',()=>this.showSelection(),0x719171));}
  resumeGame(){if(this.mode!=='paused')return;this.overlay.destroy();this.overlay=null;this.clearInput();this.session.setPaused(false);this.mode='playing';}
  confirmRestart(){if(this.mode!=='paused')return;this.mode='confirm';const o=this.dialog('重新開始這場戰役？','這次的檢查點、救援與補給將重置。\n已完成的本次最佳紀錄會保留。');o.add(this.button(462,480,300,58,'繼續目前戰役',()=>{this.mode='paused';this.resumeGame();},0x507b59));o.add(this.button(818,480,300,58,'確認重新出發',()=>this.startLevel(this.index),0x99844e));}
  finishLevel(){const s=this.session,m=s.medals(),stars=m.filter(Boolean).length,key=`${s.level.id}:${this.difficulty}`,old=this.records[key];this.records[key]={stars:Math.max(stars,old?.stars||0),score:Math.max(s.stats.score,old?.score||0)};this.mode='finished';this.clearInput();this.tone('finish');
    const o=this.dialog('戰役完成！',`${'★'.repeat(stars)}${'☆'.repeat(3-stars)}　${s.stats.score} 分\n救援 ${s.stats.rescued} 位　擊退 ${s.stats.kills} 台　用時 ${Math.floor(s.time)} 秒`);o.add(this.art(640,329,0,142));o.add(this.text(640,440,`${m[1]?'✓':'○'} 全救援＋三枚徽章　　${m[2]?'✓':'○'} 一命通關（重試 ${s.stats.deaths} 次）`,21));o.add(this.button(319,552,276,57,'再戰一次',()=>this.startLevel(this.index),0x99844e));o.add(this.button(640,552,276,57,'返回選關',()=>this.showSelection(),0x719171));o.add(this.button(961,552,276,57,this.index<5?'下一場戰役 →':'查看戰役紀錄',()=>this.index<5?this.startLevel(this.index+1):this.showSelection(),0x507b59));o.add(this.text(640,623,'紀錄保留於本次開啟。換配置、找支線，挑戰自己的最佳表現。',18));
  }
  leave(){this.clearInput();this.stopTones();this.session?.setPaused(true);if(this.scene.manager.keys[this.returnScene])this.scene.start(this.returnScene);}
}
