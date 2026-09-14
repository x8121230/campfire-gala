import {STAR_CRAFTS,getStarCraft} from '../data/StarflightCrafts.js';
import AnimalSnackGame from './AnimalSnackGame.js';
import {StarflightSession,StarflightTouch,STAR_CONTROLS,STAR_FIELD,STAR_WEAPONS,STAR_SPECIALS,STAR_PHASE1,STAR_TUNING,STAR_TRANSIT_SECONDS,resolveStarPhase,starColor} from '../data/StarflightRules.js';
import {CARNIVAL_PLANS} from '../data/StarflightCarnival.js';
import {registerCarnivalFrames,createCandyScenery,drawCandyEnemy,drawCandyWorld,carnivalCaption} from './StarflightCarnivalView.js';
import {drawLakeEnemy,drawLakeWorld,lakeCaption} from './StarflightLakeView.js';
import {registerCaveFrames,drawCaveEnemy,drawCaveWorld,caveCaption} from './StarflightCaveView.js';
import {registerIceFrames,drawIceEnemy,drawIceWorld,iceCaption} from './StarflightIceView.js';
import {registerWetlandFrames,drawWetlandEnemy,drawWetlandWorld,wetlandCaption} from './StarflightWetlandView.js';
import {registerMagmaFrames,drawMagmaEnemy,drawMagmaWorld,magmaCaption} from './StarflightMagmaView.js';
import {registerForestFrames,drawForestEnemy,drawForestWorld,forestCaption} from './StarflightForestView.js';
import {drawTransitEnemy,drawTransitWorld,transitCaption} from './StarflightTransitView.js';
import {preferences} from '../systems/AdventurePreferences.js';
const TOP=64,H=480,SCALE=1.27;
const FRAMES={hero:[0,174,348,456],fairy:[632,794,224,334],boss:[842,645,412,514]};
const SKY={cloud:'star_sky',market:'star_sky_market',honey:'star_sky_honey',crystal:'star_sky_crystal',harbor:'star_sky_harbor',carnival:'star_carnival_bg',cave:'star_cave_bg',ice:'star_ice_bg',wetland:'star_wetland_bg',magma:'star_magma_bg',forest:'star_forest_bg',transit:'star_transit_bg'};
const MAGIC=['clover','beam','dandelion','option','bubble'];
const MOTHER_GUARD='item_fullset_secret_guard';
const DOLL_BODIES={
 item_cloth_daily_01:['star_doll_daily','assets/wardrobe_v50/doll_daily_v50.png','日常休閒裝'],
 item_fullset_pink_home_01:['star_doll_pink','assets/wardrobe_v50/doll_pink_home_v50_alpha.png','粉色居家服'],
 item_cloth_fairy_01:['star_doll_fairy','assets/wardrobe_v52/doll_fairy_v52.png','森林精靈服'],
 item_cloth_explore_01:['star_doll_explore','assets/wardrobe_v53/doll_explore_v53.png','冒險衣'],
 item_fullset_explore_01:['star_doll_explore_full','assets/wardrobe_v53/doll_explore_full_nohat_v53.png','森林探險套裝'],
 item_cloth_firefly_01:['star_doll_firefly','assets/wardrobe_v53/doll_firefly_v53.png','螢火守望服'],
 item_fullset_firefly_01:['star_doll_forest_fairy','assets/wardrobe_v53/doll_forest_fairy_nohat_v53.png','森林精靈套裝'],
 item_cloth_campfire_01:['star_doll_campfire','assets/wardrobe_v53/doll_campfire_v53.png','營火工作服'],
 item_fullset_campfire_01:['star_doll_chef','assets/wardrobe_v52/doll_chef_v52.png','森林廚師套裝'],
 item_cloth_constellation_01:['star_doll_constellation','assets/wardrobe_v53/doll_constellation_v53.png','星座學徒服'],
 item_fullset_constellation_01:['star_doll_astronaut','assets/wardrobe_v52/doll_astronaut_v52.png','銀河特工套裝'],
 [MOTHER_GUARD]:['star_doll_mother','assets/wardrobe_v53/doll_mother_guard_v53.png','母上的守護'],
 item_cloth_fairytale_peach:['star_doll_peach','assets/wardrobe_v55/doll_peach.png','蜜桃精靈連身裝'],
 item_cloth_fairytale_dandelion:['star_doll_dandelion','assets/wardrobe_v55/doll_dandelion.png','蒲公英絨毛斗篷'],
 item_cloth_fairytale_acorn:['star_doll_acorn','assets/wardrobe_v55/doll_acorn.png','橡果工匠吊帶褲'],
 item_fullset_fairytale_raincoat:['star_doll_raincoat','assets/wardrobe_v55/doll_raincoat.png','大象水車雨衣'],
 item_cloth_fairytale_orbit:['star_doll_orbit','assets/wardrobe_v55/doll_orbit.png','夜空星軌法袍']
};
const DOLL_HATS={
 item_hat_fairytale_capybara:['star_hat_capybara','assets/wardrobe_v55/hat_capybara.png'],item_hat_fairytale_nightcap:['star_hat_nightcap','assets/wardrobe_v55/hat_nightcap.png'],
 item_hat_fairytale_lemon:['star_hat_lemon','assets/wardrobe_v55/hat_lemon.png'],item_hat_fairytale_pinecone:['star_hat_pinecone','assets/wardrobe_v55/hat_pinecone.png'],item_hat_fairytale_swan:['star_hat_swan','assets/wardrobe_v55/hat_swan.png'],
 item_hat_explore_01:['star_hat_explorer','assets/wardrobe_v53/hat_overlay_explorer_v53.png'],item_hat_firefly_01:['star_hat_firefly','assets/wardrobe_v53/hat_overlay_firefly_v53.png'],
 item_hat_campfire_01:['star_hat_chef','assets/wardrobe_v53/hat_overlay_chef_v53.png'],item_hat_constellation_01:['star_hat_star','assets/wardrobe_v53/hat_overlay_star_magic_v53.png'],
 item_hat_tiara_global:['star_hat_crown','assets/wardrobe_v53/hat_overlay_crown_v53.png'],item_hat_fairy_01:['star_hat_crown','assets/wardrobe_v53/hat_overlay_crown_v53.png'],item_hat_forest_fairy_01:['star_hat_forest_fairy','assets/wardrobe_v53/hat_overlay_forest_fairy_v53.png']
};
export default class ForestStarflightGame extends AnimalSnackGame{
 constructor(){super('ForestStarflightGame');}
 preload(){for(const c of STAR_CRAFTS)if(!this.textures.exists('craft_'+c.id))this.load.image('craft_'+c.id,'assets/forest-starflight/player/'+c.file);if(!this.textures.exists('craft_swift_frames'))this.load.spritesheet('craft_swift_frames','assets/forest-starflight/animation-v0105/swift-frames-v1.png',{frameWidth:444,frameHeight:444});this.flightLook=this.readFlightLook();const files={crew:'crew.png',sky:'sky.png',sky_market:'sky-market-v02.png',sky_honey:'sky-honey-v02.png',sky_crystal:'sky-crystal-v02.png',sky_harbor:'sky-harbor-v02.png'};
  for(const [key,file]of Object.entries(files))if(!this.textures.exists('star_'+key))this.load.image('star_'+key,'assets/forest-starflight/'+file);
  for(const [key,file]of [['star_carnival_bg','background.png'],['star_candy_enemies','enemies.png'],['star_candy_scenery','scenery.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/carnival-v092/'+file);
  for(const [key,file]of [['star_cave_bg','background.png'],['star_cave_enemies','enemies.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/cave-v096/'+file);
  for(const [key,file]of [['star_ice_bg','background.png'],['star_ice_enemies','enemies.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/ice-v097/'+file);
  for(const [key,file]of [['star_wetland_bg','background.png'],['star_wetland_enemies','enemies.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/wetland-v098/'+file);
  for(const [key,file]of [['star_magma_bg','background.png'],['star_magma_enemies','enemies.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/magma-v099/'+file);
  for(const [key,file]of [['star_forest_bg','background.png'],['star_forest_enemies','enemies.png']])if(!this.textures.exists(key))this.load.image(key,'assets/forest-starflight/forest-v0100/'+file);
  if(!this.textures.exists('star_transit_bg'))this.load.image('star_transit_bg','assets/forest-starflight/transit-v0102/star-wind-tunnel-1280x480.png');
  for(const key of MAGIC)if(!this.textures.exists('stg04_'+key))this.load.image('stg04_'+key,'assets/forest-starflight/magic-v04/'+key+'.png');
  const assets=[DOLL_BODIES.item_cloth_daily_01,DOLL_BODIES[MOTHER_GUARD],this.flightLook.body,this.flightLook.hat].filter(Boolean);
  for(const [key,file]of assets)if(!this.textures.exists(key))this.load.image(key,file);}
 create(){
  this.skyScenario=-1;
  this.selectedCraft='swift';this.mode='title';this.session=null;this.touch=new StarflightTouch();this.held=new Set();this.requests={};this.views=new Map();this.effects=[];this.heroAction=null;this.audioNodes=new Set();this.flightLook=this.readFlightLook();
  this.soundOn=preferences.value.sfx;this.autoFire=true;this.selectedSpecial='chargeLaser';this.difficulty='normal';this.overlay=null;this.carnivalIntro=0;
  this.reducedFX=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  if(this.textures.exists('star_crew')){const t=this.textures.get('star_crew'),im=t.getSourceImage();for(const [k,[x,y,w,h]]of Object.entries(FRAMES))if(!t.has(k))t.add(k,0,Math.round(x*im.width/1254),Math.round(y*im.height/1254),Math.round(w*im.width/1254),Math.round(h*im.height/1254));}
  this.input.addPointer(Math.max(0,4-(this.input.manager.pointersTotal||1)));const canvas=this.game.canvas,old=canvas.style.touchAction;canvas.style.touchAction='none';
  this.down=p=>{this.sound.context?.resume?.()?.catch?.(()=>{});if(this.mode==='playing'&&!this.chooseBranchAt(p.x,p.y))this.touch.down(p);};
  this.move=p=>{if(this.mode==='playing')this.touch.move(p);};this.up=p=>this.touch.up(p);this.cancel=()=>this.clearInput();
  this.keydown=e=>{if(e.repeat)return;if(['Escape','KeyP'].includes(e.code)){this.mode==='gm'?this.closeGMPanel():this.mode==='bay'?this.closeWeaponBay():this.mode==='paused'?this.resumeGame():this.pauseGame();return;}if(e.code==='KeyG'&&this.mode==='playing'){this.openGMPanel();return;}if(this.mode!=='playing')return;
   this.held.add(e.code);if(e.code==='Space'||e.code==='KeyK')this.requests.bomb=true;if(e.code==='KeyU')this.requests.dash=true;if(e.code==='KeyJ')this.requests.special=true;if(e.code==='KeyI')this.requests.trait=true;if(e.code==='KeyL')this.requests.bay=true;};
  this.keyup=e=>this.held.delete(e.code);
  this.input.on('pointerdown',this.down);this.input.on('pointermove',this.move);this.input.on('pointerup',this.up);this.input.on('pointerupoutside',this.up);this.input.on('gameout',this.cancel);
  this.input.keyboard?.on('keydown',this.keydown);this.input.keyboard?.on('keyup',this.keyup);this.input.keyboard?.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  this.blur=()=>this.pauseGame();this.hidden=()=>{if(document.hidden)this.pauseGame();};this.resize=()=>{if(this.portrait())this.pauseGame();};
  this.game.events.on('blur',this.blur);document.addEventListener('visibilitychange',this.hidden);window.addEventListener('resize',this.resize);window.addEventListener('pointercancel',this.cancel);
  this.events.once('shutdown',()=>{canvas.style.touchAction=old;this.input.off('pointerdown',this.down);this.input.off('pointermove',this.move);this.input.off('pointerup',this.up);this.input.off('pointerupoutside',this.up);this.input.off('gameout',this.cancel);
   this.input.keyboard?.off('keydown',this.keydown);this.input.keyboard?.off('keyup',this.keyup);this.input.keyboard?.removeCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
   this.game.events.off('blur',this.blur);document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('resize',this.resize);window.removeEventListener('pointercancel',this.cancel);
   this.clearInput();this.stopTones();this.maskShape?.destroy();this.fieldMask?.destroy();});
  if(Object.values(SKY).some(k=>!this.textures.exists(k))||!this.textures.exists('star_candy_enemies')||!this.textures.exists('star_candy_scenery')||!this.textures.exists('star_cave_enemies')||!this.textures.exists('star_ice_enemies')||!this.textures.exists('star_wetland_enemies')||!this.textures.exists('star_magma_enemies')||!this.textures.exists('star_forest_enemies')||!this.textures.exists('star_crew')||!this.textures.exists('craft_swift_frames')||STAR_CRAFTS.some(c=>!this.textures.exists('craft_'+c.id))||MAGIC.some(k=>!this.textures.exists('stg04_'+k))){
   this.add.rectangle(640,360,1280,720,0x173f43);this.text(640,260,'星航素材尚未齊全\n請將更新內容合併至保留原 assets 的遊戲資料夾',30);this.b(640,450,340,80,'返回遊戲列表',()=>this.leave());return;}
  this.registerMagicFrames();this.registerCraftAnimations();
  registerCarnivalFrames(this);
  registerCaveFrames(this);
  registerIceFrames(this);
  registerWetlandFrames(this);
  registerMagmaFrames(this);
  registerForestFrames(this);
  this.showTitle();
 }
 text(x,y,t,size=24,color='#fff3d2',origin=.5){return super.text(x,y,t,size,color,origin);}
 b(x,y,w,h,t,fn,color=0x31686b){const c=super.button(x,y,w,h,t,fn,color,'#fff7df');c.label.setFontSize(25);return c;}
 portrait(){return window.innerHeight>window.innerWidth;}
 clearInput(){this.touch?.reset();this.held?.clear();this.requests={};if(this.session){this.session.last={};this.session.pending={};}}
 clear(){this.clearInput();this.tweens.killAll();this.fieldMask?.destroy();this.maskShape?.destroy();this.fieldMask=null;this.maskShape=null;for(const child of this.children.getChildren().slice())child.destroy();this.views.clear();this.effects=[];this.heroAction=null;this.overlay=null;this.ultimateOverlay=null;this.guardianOverlay=null;this.launchOverlay=null;}
 art(x,y,frame,size,parent=null){const im=this.add.image(x,y,'star_crew',frame);im.setScale(size/Math.max(im.width,im.height));parent?.add(im);return im;}
 craft(x,y,width,parent=null,bodyAnchor=false){const c=getStarCraft(this.mode==='title'?this.selectedCraft:this.session?.craft?.id||this.selectedCraft),animated=bodyAnchor&&c.id==='swift'&&this.textures.exists('craft_swift_frames'),im=animated?this.add.sprite(x,y,'craft_swift_frames',0):this.add.image(x,y,'craft_'+c.id);im.setScale(width/im.width).setData('baseScale',width/im.width);if(animated)im.play('swift_idle');if(bodyAnchor)im.setOrigin(...c.anchor);parent?.add(im);return im;}
 readFlightLook(){let saved={};try{saved=JSON.parse(globalThis.localStorage?.getItem('forest_save_data')||'{}');}catch{}const get=k=>{try{const value=this.registry?.get(k);if(value!==undefined&&value!==null&&value!=='')return value;}catch{}return saved[k]||'none';},fullsetId=get('equipped_fullset'),clothId=get('equipped_cloth'),hatId=get('equipped_hat');
  const bodyId=fullsetId!=='none'?fullsetId:clothId!=='none'?clothId:'item_cloth_daily_01',body=DOLL_BODIES[bodyId]||DOLL_BODIES.item_cloth_daily_01;
  return {bodyId,hatId,body,hat:bodyId==='item_fullset_fairytale_raincoat'?null:DOLL_HATS[hatId]||null,guardian:bodyId===MOTHER_GUARD};}
 doll(parent,x,y,maxW,maxH,alpha=1,tint=0xffffff){const look=this.flightLook||this.readFlightLook(),c=this.add.container(x,y);parent?.add(c);const bodyKey=this.textures.exists(look.body[0])?look.body[0]:DOLL_BODIES.item_cloth_daily_01[0];
  const body=this.add.image(0,0,bodyKey),scale=Math.min(maxW/body.width,maxH/body.height);body.setScale(scale).setAlpha(alpha).setTint(tint);c.add(body);
  if(look.hat&&this.textures.exists(look.hat[0])){const hat=this.add.image(0,0,look.hat[0]).setScale(scale).setAlpha(alpha).setTint(tint);if(look.hat[1].includes('wardrobe_v55'))hat.y-=132*scale;c.add(hat);}return c;}
 showTitle(){this.clear();this.mode='title';const c=getStarCraft(this.selectedCraft);this.add.image(640,360,'star_carnival_bg').setDisplaySize(1280,854);this.add.rectangle(640,360,1280,720,0x102d35,.55);
  this.text(640,34,'森林星航・機體選擇',35,'#fff1c5');this.text(640,72,'四款鳥類＋隱藏機械全開放　v'+STAR_PHASE1.version,19,'#d7ece1');
  STAR_CRAFTS.forEach((item,i)=>{const x=140+i*250,selected=item.id===c.id;const btn=this.b(x,167,238,152,'',()=>{this.selectedCraft=item.id;this.showTitle();},selected?0x668469:0x234c57);const im=this.add.image(x,146,'craft_'+item.id).setDisplaySize(136,91);this.text(x,218,(selected?'✓ ':'')+item.name,18,selected?'#ffe3a3':'#dcebe4');});
  this.panel(328,428,590,336,0x193f4c,0xcab887,24);this.text(328,290,c.name+'・'+c.size,24,'#ffe2a1');const bird=this.craft(328,407,c.width*1.42);if(!this.reducedFX)this.tweens.add({targets:bird,y:400,duration:1100,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  this.text(328,514,c.tip,20,'#dff5de');this.text(328,546,'動作：'+c.motion,17,'#ffe1a7');this.text(328,578,'速度 '+c.speed+'　生命 '+c.hp+'　身體核心 '+c.radius,18,'#c9e3dc');
  this.panel(955,428,600,336,0x173e4d,0xcab887,24);this.text(955,290,'特殊武器・'+c.role,24,'#ffe2a1');
  STAR_SPECIALS.forEach((w,i)=>{const b=this.b(955,343+i*62,550,52,(this.selectedSpecial===w.id?'✓ ':'')+w.name+'　CD '+w.cd+' 秒',()=>{this.selectedSpecial=w.id;this.showTitle();},this.selectedSpecial===w.id?0x82702e:0x31686b);b.label.setFontSize(20);});
  this.diffButton=this.b(807,535,246,48,'難度：'+(this.difficulty==='normal'?'標準':'挑戰'),()=>{this.difficulty=this.difficulty==='normal'?'challenge':'normal';this.showTitle();});this.b(1090,535,246,48,this.reducedFX?'動態：柔和':'動態：標準',()=>{this.reducedFX=!this.reducedFX;this.showTitle();});
  this.text(955,574,'I '+c.trait+'　U 衝刺　K 大招　L 武器艙',17,'#d9d9ba');this.b(165,655,260,60,'← 遊戲列表',()=>this.leave());
  this.b(491,655,365,60,'糖果雲端：'+(CARNIVAL_PLANS[this.skyScenario]||'隨機劇本'),()=>{this.skyScenario=((this.skyScenario??-1)+2)%4-1;this.showTitle();},0x685478).label.setFontSize(20);
  this.b(978,655,520,60,c.name+'・出擊',()=>this.start(),0xa87535);
 }

 start(checkpoint=null){if(this.portrait()){this.showMessage('請把手機橫放','左手移動；右手操作特殊武器、機體攻擊、大招與武器艙。',()=>{this.overlay?.destroy();this.overlay=null;},'知道了');return;}
  this.flightLook=this.readFlightLook();this.session=new StarflightSession({skyScenario:this.skyScenario,craftId:this.selectedCraft,difficulty:this.difficulty,seed:checkpoint?.seed??((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0),checkpoint,guardianEnabled:this.flightLook.guardian});
  if(!checkpoint)this.session.specialWeapon=this.selectedSpecial;this.session.checkpoint=this.session.snapshot();
  this.renderGame();this.sound.context?.resume?.()?.catch?.(()=>{});this.showLaunchSequence(!!checkpoint);
 }
 renderGame(){this.clear();this.mode='playing';this.session.setPaused(false);this.soundCD=0;this.add.rectangle(640,360,1280,720,0x153d49);
  this.world=this.add.container(0,TOP).setScale(1,SCALE);
  this.maskShape=this.add.graphics().fillStyle(0xffffff).fillRect(0,TOP,1280,H*SCALE).setVisible(false);this.fieldMask=this.maskShape.createGeometryMask();this.world.setMask(this.fieldMask);
  this.background=[];this.themeWeights={};this.lastTheme=this.session.currentMap?.theme||'harbor';
  for(const [theme,texture]of Object.entries(SKY)){this.themeWeights[theme]=theme===this.lastTheme?1:0;for(let i=0;i<2;i++){const fitted=['carnival','cave','ice','wetland','magma','forest','transit'].includes(theme),im=this.add.image(i*1280,fitted?0:-165,texture).setOrigin(0).setDisplaySize(1280,fitted?H:854);this.world.add(im);this.background.push({im,theme,index:i});}}
  this.candyMid=this.add.container(0,0);this.world.add(this.candyMid);this.scenery=this.add.graphics();this.world.add(this.scenery);this.entities=this.add.container(0,0);this.world.add(this.entities);
  this.magicLayer=this.add.container(0,0);this.world.add(this.magicLayer);this.magicPool=[];this.magicIndex=0;
  this.candyFront=this.add.container(0,0);this.world.add(this.candyFront);createCandyScenery(this,this.candyMid,this.candyFront);this.fx=this.add.graphics();this.world.add(this.fx);
  this.add.rectangle(640,31,1280,62,0x173e48,.85);this.hp=this.text(24,17,'',23,'#ffe1c3',0);this.meta=this.text(245,17,'',23,'#bcf4d1',0);
  this.scoreLabel=this.text(640,17,'',22,'#ffdf92',0);this.stageLabel=this.text(20,690,'',17,'#cce8e1',0);
  this.gmButton=this.b(1008,31,120,47,'GM 調校',()=>this.openGMPanel(),0x6b567c);this.gmButton.label.setFontSize(19);this.b(1175,31,190,47,'暫停 P',()=>this.pauseGame());this.noticeText=this.text(640,100,'',24,'#fff1b1').setStroke('#254a56',5);
  this.carnivalLabel=this.text(640,76,'',17,'#fff7df').setStroke('#354754',4);this.noticeText.setY(110);
  this.bossText=this.text(640,135,'',22,'#ffdaae').setStroke('#254a56',4);
  this.control=this.add.graphics();this.fireLabel=this.text(STAR_CONTROLS.special.x,STAR_CONTROLS.special.y,'',19);
  this.dashLabel=this.text(STAR_CONTROLS.dash.x,STAR_CONTROLS.dash.y,'',19);this.bombLabel=this.text(STAR_CONTROLS.bomb.x,STAR_CONTROLS.bomb.y,'',24);
  this.evadeLabel=this.text(-100,-100,'',1).setVisible(false);this.traitLabel=this.text(STAR_CONTROLS.trait.x,STAR_CONTROLS.trait.y,'',17);
  this.branchHint=this.text(830,118,'',20,'#fff1b1').setStroke('#254a56',5).setVisible(false);this.branchTop=this.text(850,184,'',21,'#e5fff2').setStroke('#254a56',5).setVisible(false);this.branchBottom=this.text(850,536,'',21,'#e5fff2').setStroke('#254a56',5).setVisible(false);
  this.drawState(0);
 }
 showLaunchSequence(fromCheckpoint=false){this.mode='launching';this.session.setPaused(true);this.launchTime=0;this.launchCue=-1;const o=this.add.container(0,0).setDepth(120);this.launchOverlay=o;
  o.add(this.add.rectangle(640,360,1280,720,0x071e27,.94).setInteractive());
  const cabin=this.add.graphics();cabin.fillStyle(0x233f37).fillRoundedRect(0,0,1280,720,22);cabin.fillStyle(0x8ebd83,.25).fillTriangle(0,0,510,0,0,720).fillTriangle(1280,0,770,0,1280,720);
  cabin.lineStyle(12,0x6b8d5f,.85).lineBetween(95,555,1160,555).lineBetween(105,590,1170,590);cabin.lineStyle(3,0xc5f1b5,.3).lineBetween(105,548,1160,548);o.add(cabin);
  this.launchGateL=this.add.rectangle(300,325,390,560,0x41674f,.96).setStrokeStyle(8,0xa8cb8d);this.launchGateR=this.add.rectangle(980,325,390,560,0x41674f,.96).setStrokeStyle(8,0xa8cb8d);o.add([this.launchGateL,this.launchGateR]);
  this.launchCraft=this.craft(360,405,360,o);this.launchLines=this.add.graphics();o.add(this.launchLines);
  this.launchTitle=this.text(780,210,fromCheckpoint?'安全航點重新出擊':this.session.craft.name+'・出擊準備',40,'#fff0b8');this.launchStatus=this.text(780,275,'飛羽與武器確認中',25,'#d5f3de');this.launchCount=this.text(780,360,'3',78,'#ffe099');
  o.add([this.launchTitle,this.launchStatus,this.launchCount]);this.stepLaunch(0);
 }
 stepLaunch(dt){this.launchTime=Math.min(STAR_PHASE1.launchSeconds,this.launchTime+dt);const t=this.launchTime,p=t/STAR_PHASE1.launchSeconds,phase=t<.7?0:t<1.5?1:t<2.3?2:3;
  if(phase!==this.launchCue){this.launchCue=phase;this.tone(phase===3?'finish':phase===2?'correct':'send');}
  const gateOpen=Math.max(0,Math.min(1,(t-.55)/.9));this.launchGateL?.setX(300-gateOpen*330);this.launchGateR?.setX(980+gateOpen*330);
  const launch=Math.max(0,Math.min(1,(t-2.3)/.7));this.launchCraft?.setPosition(360+launch*1040,405-launch*110).setScale((360/this.launchCraft.width)*(1+launch*.25)).setAlpha(1-launch*.65);
  this.launchDoll?.setAlpha(Math.max(0,1-Math.max(0,(t-1.55)/.65)));this.launchLines?.clear();
  if(t>.7){const glow=.35+.3*Math.sin(t*12);this.launchLines.lineStyle(6,0xaaf6c1,glow).lineBetween(110,548,1170,548).lineBetween(110,590,1170,590);}
  if(t>2.3)for(let i=0;i<8;i++){const y=150+i*62,x=1280-((launch*1400+i*137)%1450);this.launchLines.lineStyle(4,0xe8fff2,.5).lineBetween(x,y,x-150-launch*220,y);}
  this.launchStatus?.setText(phase===0?'飛羽與武器確認中':phase===1?'螢光藤蔓導軌充能':phase===2?this.session.craft.name+'，準備出發！':'樹冠閘門開啟・彈射！');this.launchCount?.setText(phase<3?String(3-phase):'GO!').setAlpha(.78+.2*Math.sin(t*8));
  if(p>=1)this.finishLaunch();
 }
 finishLaunch(){this.launchOverlay?.destroy();this.launchOverlay=null;this.clearInput();this.session.setPaused(false);this.mode='playing';this.session.message(this.session.craft.name+'出擊！');}
 controlState(){const t=this.touch.read(),k=this.held;return {...t,x:t.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),y:t.y+Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp')),dash:t.dash||this.requests.dash,special:t.special||this.requests.special,trait:t.trait||this.requests.trait,bay:t.bay||this.requests.bay,bomb:t.bomb||this.requests.bomb,slow:k.has('ShiftLeft')||k.has('ShiftRight')};}
 chooseBranchAt(x,y){if(!this.session?.branchOffer||this.session.branchOffer.selected||x<720||x>990||y<105||y>615)return false;const worldY=(y-TOP)/SCALE;return this.session.chooseBranch(worldY<240?'top':'bottom','tap');}
 update(t,delta){if(this.mode==='launching'){if(!this.portrait()&&!document.hidden)this.stepLaunch(Math.min(.1,delta/1000));return;}if(this.mode==='returning'){if(this.portrait()||document.hidden)return;this.resumeTime-=Math.min(.1,delta/1000);this.resumeLabel?.setText(this.resumeTime>.35?'準備好了嗎？':'出發！');if(this.resumeTime<=0){this.overlay?.destroy();this.overlay=null;this.clearInput();this.session.closeBay();this.session.setPaused(false);this.mode='playing';}return;}
  if(this.mode!=='playing'||!this.session)return;const dt=Math.min(.1,delta/1000),input=this.controlState();
  if(input.bay&&this.openWeaponBay())return;
  if(this.session.advance(dt,input)){this.requests={};this.touch.consume();}
  this.soundOn=preferences.value.sfx;this.soundCD-=dt;
  for(const e of this.session.events.splice(0)){if(!['shot','stage','ultimateStart','charge'].includes(e.type))this.effects.push({...e,age:0});
   if(['dash','hurt','charge','laserFire','explosiveFire','shotgunFire','traitFire'].includes(e.type))this.heroAction={type:e.type,until:this.session.time+(e.type==='charge'?.45:e.type==='traitFire'?.62:e.type==='hurt'?.28:.34)};
   if(e.type==='regionIntro')this.carnivalIntro=2.8;
   if(['charge','laserFire','explosiveFire','shotgunFire','traitFire'].includes(e.type))this.weaponTone(e.type);
   else if(e.type==='guardianStart'||e.type==='guardianRevive'){this.tone(e.type==='guardianStart'?'finish':'correct');this.soundCD=.3;}
   else if(this.soundCD<=0&&e.type!=='stage'){this.tone(e.type==='shot'?'send':e.type==='hurt'?'hint':['end','boss','warning','ultimateStart'].includes(e.type)?'finish':'correct');this.soundCD=e.type==='shot'?.25:.13;}
   if(!this.reducedFX&&['bomb','hurt','elite','laserFire','guardianRevive','caveImpact','iceBreak'].includes(e.type))this.cameras.main.shake(e.type==='bomb'?180:['caveImpact','iceBreak'].includes(e.type)?130:90,e.type==='bomb'?.003:['caveImpact','iceBreak'].includes(e.type)?.0022:.0014);
  }
  if(this.session.phase==='combat'){this.effects=this.effects.map(e=>({...e,age:e.age+dt})).filter(e=>e.age<.7).slice(-65);this.carnivalIntro=Math.max(0,this.carnivalIntro-dt);}
  this.drawState(this.session.phase==='combat'?dt:0);this.drawUltimate();this.drawGuardian();if(this.session.status!=='playing')this.finish();
 }
 weaponTone(type){if(!this.soundOn)return;const ctx=this.sound.context;if(!ctx)return;
  try{const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime,d=type==='charge'?.5:.22;
   o.type=type==='explosiveFire'?'triangle':'sine';o.frequency.setValueAtTime(type==='charge'?260:type==='laserFire'?1000:480,now);o.frequency.exponentialRampToValueAtTime(type==='charge'?1050:150,now+d);
   g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+d);o.connect(g);g.connect(ctx.destination);this.audioNodes.add(o);o.onended=()=>{this.audioNodes.delete(o);o.disconnect();g.disconnect();};o.start(now);o.stop(now+d);
  }catch{}}
 drawUltimate(){const s=this.session;
  if(s.phase!=='ultimate'){this.ultimateOverlay?.destroy();this.ultimateOverlay=null;return;}
  if(!this.ultimateOverlay){const o=this.add.container(0,0).setDepth(80);this.ultimateOverlay=o;
   o.add(this.add.rectangle(640,360,1280,720,0x162742,.9));this.ultimatePortrait=this.craft(330,390,390,o);this.ultimateFairy=this.art(570,315,'fairy',190,o);
   o.add(this.text(865,260,'妍妍的星光祝福',43,'#ffe8ab'));o.add(this.text(865,348,'讓大家恢復好心情！',28,'#d9f7ed'));this.ultimateBar=this.add.graphics();o.add(this.ultimateBar);}
  const t=s.phaseTime;this.ultimateOverlay.setVisible(true);this.ultimatePortrait.setPosition(325+Math.min(1,t/.5)*25,390+Math.sin(t*3)*7).setAlpha(Math.min(1,t*3));this.ultimateFairy.setPosition(560+Math.sin(t*4)*12,310+Math.cos(t*3)*8).setAlpha(Math.min(1,t*4));
  this.ultimateBar.clear().fillStyle(0xffe6a5).fillRoundedRect(665,440,400*Math.min(1,t/3),8,4);
 }
 drawGuardian(){const s=this.session;if(s.phase!=='guardian'){this.guardianOverlay?.destroy();this.guardianOverlay=null;return;}
  if(!this.guardianOverlay){const o=this.add.container(0,0).setDepth(90);this.guardianOverlay=o;o.add(this.add.rectangle(640,360,1280,720,0x392b48,.9));
   const rings=this.add.graphics();rings.lineStyle(7,0xffefb5,.6).strokeCircle(325,360,225).lineStyle(3,0xffffff,.8).strokeCircle(325,360,185);o.add(rings);
   const def=DOLL_BODIES[MOTHER_GUARD],im=this.add.image(325,370,def[0]),scale=Math.min(360/im.width,560/im.height);im.setScale(scale);im.setData('baseScale',scale);o.add(im);this.guardianPortrait=im;
   o.add(this.text(855,250,'母上的守護',48,'#ffe5a5'));o.add(this.text(855,342,'別怕，媽媽在這裡。',29,'#fff5dc'));o.add(this.text(855,394,'回復 1 點生命・短暫無敵',22,'#d9f7ed'));this.guardianBar=this.add.graphics();o.add(this.guardianBar);}
  const t=s.phaseTime,q=Math.min(1,t/STAR_PHASE1.guardianSeconds),scale=this.guardianPortrait.getData('baseScale');this.guardianPortrait.setAlpha(Math.min(1,t*3)).setScale(scale*(1+.018*Math.sin(t*5)));this.guardianBar.clear().fillStyle(0xffe6a5).fillRoundedRect(655,466,410*q,10,5);
 }
 openWeaponBay(){if(this.mode!=='playing'||!this.session.openBay())return false;this.mode='bay';this.clearInput();this.stopTones();this.renderWeaponBay();return true;}
 renderWeaponBay(){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;const s=this.session;
  o.add([this.add.rectangle(640,360,1280,720,0x102e3b,.80).setInteractive(),this.panel(640,348,1120,590,0x193f4c,0xc8bc8d,28),this.text(640,113,'武器艙',40),this.text(640,166,'航程暫停中 · 換裝保留各武器的冷卻時間',23,'#c6eadd')]);
  STAR_SPECIALS.forEach((w,i)=>{const x=280+i*360,selected=w.id===s.specialWeapon,cd=s.specialCooldowns[w.id];
   o.add(this.panel(x,330,330,230,selected?0x3b6760:0x244854,selected?0xffd98e:0x648788,20));
   o.add(this.text(x,248,w.name,28,selected?'#ffe0a4':'#e3f6ed'));o.add(this.text(x,300,w.id==='chargeLaser'?'2 秒自動集氣 · 貫穿':w.id==='explosive'?'命中爆開 · 範圍安撫':'七向扇形 · 近距離火力',20));
   o.add(this.text(x,342,'CD '+w.cd+' 秒'+(cd>0?' · 剩餘 '+cd.toFixed(1)+' 秒':''),20,'#c9e2dc'));
   const b=this.b(x,398,276,54,selected?'✓ 裝備中':'裝備',()=>{if(s.equipSpecial(w.id)){this.tone('correct');this.renderWeaponBay();}},selected?0x86723f:0x387984);o.add(b);
  });
  o.add(this.text(640,493,s.charging?'雷射集氣已暫停；換另一把武器會取消這次集氣。':'點一下特殊攻擊即可使用 · 集氣與 CD 都在戰鬥時推進',21,'#d9e7d7'));
  o.add(this.b(640,575,380,68,'返回飛行',()=>this.closeWeaponBay(),0xa87535));
 }
 closeWeaponBay(){if(this.mode!=='bay'||this.portrait())return;this.overlay?.destroy();this.clearInput();this.mode='returning';this.resumeTime=.8;const o=this.add.container(0,0).setDepth(100);this.overlay=o;
  o.add(this.add.rectangle(640,360,1280,720,0x102e3b,.18).setInteractive());this.resumeLabel=this.text(640,270,'準備好了嗎？',38).setStroke('#193f4c',6);o.add(this.resumeLabel);
 }

 openGMPanel(){if(this.mode!=='playing'||!this.session||this.session.phase!=='combat')return false;this.mode='gm';this.session.setPaused(true);this.clearInput();this.stopTones();this.renderGMPanel();return true;}
 renderGMPanel(){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(120),s=this.session;this.overlay=o;
  o.add([this.add.rectangle(640,360,1280,720,0x071c28,.88).setInteractive(),this.panel(640,360,1190,655,0x193f4c,0xc8bc8d,28),this.text(640,66,'GM 調校模式',38),this.text(640,103,'僅影響本次測試與安全航點，不寫入正式衣櫃／遊戲進度',18,'#c6eadd')]);
  const maps=[['sky','天空'],['lake','月湖'],['cave','洞穴'],['ice','冰原'],['wetland','濕地'],['magma','岩漿'],['forest','樹海']];
  maps.forEach(([type,name],i)=>{const selected=s.currentMap?.type===type,b=this.b(145+i*165,151,142,46,(selected?'✓ ':'')+name,()=>{if(s.forceRegion(type)){this.tone('correct');this.renderGMPanel();}},selected?0x8b733a:0x315f68);b.label.setFontSize(17);o.add(b);});
  o.add(this.text(92,191,'可調參數',18,'#ffe0a4',0));
  STAR_TUNING.forEach((item,i)=>{const y=226+i*51,value=s.tuning[item.id];o.add(this.text(190,y,item.name,20,'#e4f5ec',0));
   const minus=this.b(590,y,56,38,'−',()=>{if(s.setTuning(item.id,value-item.step))this.tone('send');this.renderGMPanel();},0x315f68),plus=this.b(865,y,56,38,'＋',()=>{if(s.setTuning(item.id,value+item.step))this.tone('send');this.renderGMPanel();},0x315f68);minus.label.setFontSize(24);plus.label.setFontSize(22);o.add([minus,plus]);
   o.add(this.panel(728,y,190,38,0x102e3b,0x668b89,10));o.add(this.text(728,y,value.toFixed(item.digits)+item.unit,20,'#ffe3a1'));o.add(this.text(930,y,'範圍 '+item.min+'～'+item.max,15,'#a9c7c2',0));
  });
  o.add(this.text(640,585,'改變子彈速度會同步調整畫面上現存子彈；敵人生命倍率也會保留目前血量比例。',16,'#bcd5d0'));
  o.add(this.b(335,635,310,54,'恢復正式預設值',()=>{s.resetTuning();this.tone('correct');this.renderGMPanel();},0x6d5c45));o.add(this.b(850,635,360,54,'套用並返回飛行',()=>this.closeGMPanel(),0xa87535));
 }
 closeGMPanel(){if(this.mode!=='gm'||this.portrait())return false;this.overlay?.destroy();this.overlay=null;this.clearInput();this.session.setPaused(false);this.mode='playing';this.session.message(this.session.gmUsed?'GM 測試參數已套用 · 本局不寫入正式存檔':'已使用正式預設值繼續飛行');return true;}

 entity(id,x,y,frame,size){let v=this.views.get(id);if(!v){v=this.art(x,y,frame,size,this.entities);this.views.set(id,v);}v.setPosition(x,y);return v;}
 registerMagicFrames(){
  // Trim transparent padding at load time. Original PNG alpha is not changed.
  for(const name of MAGIC){const t=this.textures.get('stg04_'+name);if(t.has('trim'))continue;
   const image=t.getSourceImage(),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let x0=canvas.width,y0=canvas.height,x1=0,y1=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>18){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   if(x1>=x0&&y1>=y0)t.add('trim',0,x0,y0,x1-x0+1,y1-y0+1);
  }
 }
 registerCraftAnimations(){if(this.anims.exists('swift_idle'))return;this.anims.create({key:'swift_idle',frames:[0,1,2,1].map(frame=>({key:'craft_swift_frames',frame})),frameRate:8,repeat:-1});}
 animateHero(hero,s,moving,action){if(s.craft.id!=='swift'||!hero.anims)return;let state='idle',frame=0;if(s.player.dashing>0||action?.type==='dash'||action?.type==='traitFire'){state='dash';frame=6;}else if(s.charging||action?.type==='laserFire'||action?.type==='charge'){state='special';frame=7;}else if(moving.x<-.22){state='back';frame=4;}else if(moving.y<-.22){state='up';frame=4;}else if(moving.y>.22){state='down';frame=5;}if(hero.getData('swiftState')===state)return;hero.setData('swiftState',state);if(state==='idle')hero.play('swift_idle',true);else{hero.anims.stop();hero.setFrame(frame);}}
 magic(name,x,y,width,height=null,rotation=0,alpha=1,tint=0xffffff,anchor=.5){
  let v=this.magicPool[this.magicIndex];if(!v){v=this.add.image(0,0,'stg04_'+name,'trim');this.magicLayer.add(v);this.magicPool.push(v);}this.magicIndex++;
  v.setTexture('stg04_'+name,'trim').setOrigin(anchor,.5).setPosition(x,y).setRotation(rotation).setAlpha(alpha).setTint(tint).setVisible(true);
  v.setDisplaySize(width,height??width*v.frame.height/v.frame.width);return v;
 }
 star(g,x,y,r,color,alpha=1){g.fillStyle(color,alpha);const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});}g.fillPoints(pts,true);}
 enemy(g,e){
  const sx=e.x,sy=e.y;g.save().translateCanvas(sx,sy).scaleCanvas(1.5,1.5);
  const x=0,y=0,white=e.flash>0,c=(color)=>white?0xffffff:color;
  g.lineStyle(2,c(0x51415d),1);
  if(e.kind===0||e.kind===4){
   const color=c(e.kind===4?0xed8497:0x8996b7);g.fillStyle(color).fillEllipse(x,y+3,52,30).fillCircle(x-15,y-6,14).fillCircle(x+4,y-12,17).fillCircle(x+20,y-4,12);
   if(e.kind===4){g.fillStyle(c(0xae3656)).fillTriangle(x-19,y-19,x+20,y-19,x+7,y-41);this.star(g,x+8,y-31,6,0xffeac1);}
  }
  if(e.kind===1){g.fillStyle(c(0xd578ad)).fillEllipse(x,y-21,90,89);g.fillStyle(c(0xf4b2c5)).fillEllipse(x,y-16,65,76);g.fillStyle(c(0xf8c5ba)).fillCircle(x,y+15,34);
   g.fillTriangle(x-28,y-6,x-35,y-30,x-6,y-14).fillTriangle(x+28,y-6,x+35,y-30,x+6,y-14);
   g.fillStyle(c(0xea93a7)).fillEllipse(x,y+22,27,17);g.fillStyle(c(0x87475f)).fillCircle(x-6,y+22,3).fillCircle(x+6,y+22,3);
   g.lineStyle(3,c(0x98643f)).lineBetween(x-28,y+37,x-23,y+57).lineBetween(x+28,y+37,x+23,y+57);g.fillStyle(c(0xdab071)).fillRoundedRect(x-28,y+52,56,18,5);
  }
  if(e.kind===2){g.fillStyle(c(0x72b994)).fillCircle(x,y,25);g.fillStyle(c(0xf5a3ad)).fillEllipse(x-5,y+3,31,35);g.fillStyle(c(0xffd67e)).fillTriangle(x-18,y-1,x-43,y+5,x-18,y+12);
   g.fillStyle(c(0x39765d)).fillTriangle(x+9,y-15,x+39,y-8,x+18,y+7);g.fillStyle(0x57464d).fillEllipse(x-6,y+10,3,6);}
  if(e.kind===3){g.fillStyle(c(0xffefcf)).fillTriangle(x-44,y+16,x+39,y-9,x+20,y+26);g.fillStyle(c(0xc39576)).fillCircle(x+2,y-4,21).fillCircle(x-15,y-22,10).fillCircle(x+17,y-22,10);
   g.fillStyle(c(0xf2d5b5)).fillEllipse(x,y+3,27,23);
   if(e.state==='aim'){const ty=(e.targetY-sy)/1.5;g.lineStyle(2,0xffb589,.85).lineBetween(-sx/1.5,ty,-35,ty);g.lineStyle(3,0xffe7b0).strokeCircle(0,0,37);}
  }
  if(e.kind===5){g.fillStyle(c(0xd5f6ff),.7).fillEllipse(x-8,y-19,18,29).fillEllipse(x+12,y-18,20,30);
   g.fillStyle(c(0xffd06d)).fillEllipse(x,y,48,31);g.fillStyle(c(0x805951)).fillRect(x-3,y-14,7,28).fillRect(x+13,y-10,6,20);
   g.lineStyle(2,c(0x805951)).lineBetween(x-15,y-10,x-24,y-25);}
  if(e.kind===6){if(e.state==='enter'){g.lineStyle(3,0x9eeeff,.8).strokeEllipse(x,y+8,58,13);for(let i=0;i<4;i++)g.fillStyle(0xd8fbff,.55).fillCircle(x-24+i*16,y-4-(i%2)*8,4+i%2*2);}
   else{g.fillStyle(c(0x9d775d)).fillEllipse(x,y,61,39).fillCircle(x+22,y-8,18);g.fillStyle(c(0xe9a34c)).fillCircle(x+11,y-28,10);g.fillStyle(c(0x60485a)).fillEllipse(x-12,y+14,12,7);}}
  if(e.kind===7){g.fillStyle(c(0x75619a)).fillEllipse(x,y,37,28).fillTriangle(x-12,y-5,x-39,y-25,x-31,y+9).fillTriangle(x+12,y-5,x+39,y-25,x+31,y+9);g.fillStyle(c(0xb9a7e5)).fillTriangle(x-3,y+11,x+3,y+11,x,y+24);}
  if(e.kind===8){g.fillStyle(c(0xd9f5ff)).fillEllipse(x,y,44,36).fillCircle(x,y-12,22);g.fillStyle(c(0x9ed9ef)).fillTriangle(x-15,y-2,x-38,y+13,x-13,y+16).fillTriangle(x+15,y-2,x+38,y+13,x+13,y+16);g.fillStyle(c(0x8ac5de)).fillTriangle(x,y+11,x-8,y+30,x+8,y+30);}
  if(e.kind===9){g.fillStyle(c(0x79b77c)).fillEllipse(x,y+3,48,31).fillCircle(x+12,y-11,19);g.fillStyle(c(0xa5d99c)).fillCircle(x+4,y-18,8).fillCircle(x+20,y-18,8);g.fillStyle(c(0x6a8d66)).fillEllipse(x-18,y+16,18,8).fillEllipse(x+16,y+18,20,8);}
  if(e.kind===10){g.fillStyle(c(0xe97452)).fillEllipse(x,y,53,25).fillCircle(x+24,y-5,14);g.fillStyle(c(0xffc05f)).fillTriangle(x-20,y-5,x-39,y-20,x-31,y+4).fillCircle(x+26,y-8,5);g.lineStyle(4,c(0xffdb72)).lineBetween(x-25,y+5,x-43,y+18);}
  if(e.kind===11){g.fillStyle(c(0x9c6d48)).fillEllipse(x,y,42,27).fillCircle(x+17,y-8,15);g.fillStyle(c(0x5c8f5f)).fillTriangle(x-13,y-5,x-40,y-24,x-31,y+9).fillTriangle(x+3,y-3,x+25,y-28,x+21,y+7);g.fillStyle(c(0xd8a55a)).fillCircle(x-13,y+4,7);}
  g.fillStyle(c(0x3c3546)).fillCircle(x-10,y-3,3).fillCircle(x+6,y-3,3);
  if(e.kind!==1)g.lineStyle(2,c(0x6a4b59)).lineBetween(x-5,y+9,x+2,y+9);
  if(e.hp<e.maxHp&&e.maxHp>5){g.fillStyle(0x203746,.65).fillRect(x-26,y-57,52,4);g.fillStyle(0xffdfa1).fillRect(x-26,y-57,52*Math.max(0,e.hp/e.maxHp),4);}
  g.restore();
 }
 drawHeroMotion(f,p,s,moving,action){
  const id=s.craft.id,t=s.time,thrust=Math.min(1,Math.hypot(moving.x,moving.y)),pulse=.5+.5*Math.sin(t*15),active=action?.type;
  if(thrust>.08){const length=25+thrust*42;f.lineStyle(id==='ancient'?9:5,id==='starwing'?0x83dcff:id==='owl'?0xcdbbff:0xb7f5e3,.28+.25*pulse).lineBetween(p.x-8,p.y,p.x-length,p.y-moving.y*12);}
  if(id==='swift'){for(const side of [-1,1]){const a=t*5+side*.8;f.lineStyle(2,0xc7f5ff,.35).lineBetween(p.x-8,p.y+side*7,p.x-28-Math.cos(a)*9,p.y+side*13+Math.sin(a)*5);}}
  if(id==='falcon'&&(thrust>.35||active==='dash'||active==='traitFire')){for(let i=0;i<3;i++)f.lineStyle(2,0xffefb1,.4-i*.09).lineBetween(p.x-12-i*11,p.y+i*7-8,p.x-72-i*14,p.y+i*7-8);}
  if(id==='owl'&&(s.guardFeathers>0||active==='traitFire'))for(let i=0;i<3;i++){const a=t*5+i*Math.PI*2/3;this.star(f,p.x+Math.cos(a)*34,p.y+Math.sin(a)*27,5,0xdccaff,.78);}
  if(id==='ancient'&&(active==='traitFire'||s.guardTime>0)){f.lineStyle(4,0xffd994,.62).strokeEllipse(p.x,p.y,76+pulse*9,48+pulse*7);f.fillStyle(0xffc276,.22).fillCircle(p.x-29,p.y,13+pulse*5);}
  if(id==='starwing'&&(active==='traitFire'||active==='charge')){for(const side of [-1,1]){f.lineStyle(3,0x8eeeff,.62).lineBetween(p.x-4,p.y+side*8,p.x-36,p.y+side*42);f.fillStyle(0xe9f7ff,.8).fillCircle(p.x-37,p.y+side*43,4+pulse*2);}}
  if(active==='charge'){f.lineStyle(3,0xc6f3ff,.72).strokeCircle(p.x+26,p.y,23+pulse*12);}
  if(active==='hurt'){f.lineStyle(5,0xffb0bd,.7).strokeCircle(p.x,p.y,22+pulse*18);}
  if(active==='dash'||active==='traitFire'&&id==='falcon'){f.lineStyle(8,0xa7efff,.4).lineBetween(p.x-12,p.y,p.x-105,p.y);}
 }
 drawState(dt){
  const s=this.session,p=s.player,g=this.scenery,f=this.fx,travel=resolveStarPhase(s.time),theme=s.boss?s.route[s.route.length-1].theme:s.currentMap?.theme||'cloud';g.clear();f.clear();this.lastTheme=theme;this.magicIndex=0;
  // Shared world time: no reset, no stage flash, no pause at socket boundaries.
  const offset=s.time*18,cycle=Math.floor(offset/1280),scroll=offset%1280;
  const desired=Object.fromEntries(Object.keys(SKY).map(key=>[key,0]));
  if(travel.kind==='transit'){const q=Math.min(1,travel.elapsed/STAR_TRANSIT_SECONDS),next=s.route[travel.nextIndex]?.theme||theme;
   if(q<.18){desired[theme]=1-q/.18;desired.transit=q/.18;}else if(q>.78){desired.transit=1-(q-.78)/.22;desired[next]=(q-.78)/.22;}else desired.transit=1;
  }else desired[theme]=1;
  for(const key of Object.keys(SKY))this.themeWeights[key]+=(desired[key]-this.themeWeights[key])*Math.min(1,dt*(s.inTransit?5.8:2.2));
  // Alpha-composite normalized weights so transitions do not dim the scene.
  let covered=0;
  for(const key of Object.keys(SKY)){const weight=this.themeWeights[key];covered+=weight;for(const bg of this.background.filter(b=>b.theme===key)){
   const fitted=['carnival','cave','ice','wetland','magma','forest','transit'].includes(bg.theme),isTransit=bg.theme==='transit';
   bg.im.setPosition(isTransit?0:bg.index*1280-scroll,fitted?0:-165).setFlipX(isTransit?false:(cycle+bg.index)%2===1).setAlpha(covered?weight/covered:0).setVisible(weight>.0005&&(!isTransit||bg.index===0));}}
  const regionType=s.inTransit?'transit':s.currentMap?.type;
  if(!s.inTransit&&!['cave','ice','wetland','magma','forest'].includes(regionType)){for(let i=0;i<18;i++){const x=((i*91-s.time*10)%1400+1400)%1400-60;this.star(g,x,30+(i*47)%380,2,0xffffff,.45);}
   for(let i=0;i<9;i++){const x=((i*190-s.time*48)%1710+1710)%1710-180,y=410+(i%3)*25;g.fillStyle(0xfff4df,.5).fillEllipse(x,y,230,65).fillEllipse(x+60,y+16,210,66);}
   for(let i=0;i<7;i++){const x=((i*245-s.time*95)%1715+1715)%1715-160,y=i%2?472:4;g.fillStyle(0x597b81,.35).fillTriangle(x-70,y,x+90,y,x+10,y+(i%2?70:-70));g.fillStyle(0xb7d9c0,.4).fillEllipse(x+10,y,160,22);}}
  if(regionType==='lake')g.fillStyle(0x162968,.16).fillRect(0,0,1280,H);if(regionType==='cave')g.fillStyle(0x11162d,.28).fillRect(0,0,1280,H);
  if(regionType==='ice')g.fillStyle(0xbdeaff,.08).fillRect(0,0,1280,H);
  if(regionType==='wetland')g.fillStyle(0x315d51,.08).fillRect(0,0,1280,H);
  if(regionType==='magma')g.fillStyle(0x7c332d,.06).fillRect(0,0,1280,H);
  if(regionType==='forest')g.fillStyle(0x1f5639,.045).fillRect(0,0,1280,H);
  for(const h of s.hazards){if(h.kind==='mist'){g.fillStyle(0xbcecff,.16).fillEllipse(h.x,h.y,h.r*2.2,h.r*1.35).fillEllipse(h.x-55,h.y+18,h.r*1.5,h.r*.9);g.lineStyle(2,0xd9f7ff,.28).strokeEllipse(h.x,h.y,h.r*2.2,h.r*1.35);}
   if(h.kind==='marsh'){g.fillStyle(0xa8e2b0,.15).fillEllipse(h.x,h.y,h.r*2.1,h.r*1.25).fillCircle(h.x-45,h.y-12,38);g.lineStyle(2,0xc9f2ba,.3).strokeEllipse(h.x,h.y,h.r*2.1,h.r*1.25);for(let i=0;i<5;i++)g.fillStyle(0xc6f4cf,.35).fillCircle(h.x-70+i*34,h.y-24-(i%2)*19,5+i%3);}
   if(h.kind==='rock'||h.kind==='icicle'){if(h.age<h.warn){const q=h.age/h.warn,color=h.kind==='icicle'?0xa9efff:0xffd994;g.lineStyle(3,color,.35+q*.55).lineBetween(h.x,5,h.x,455);g.fillStyle(color,.2+q*.3).fillCircle(h.x,28,15+q*7);}else if(h.kind==='icicle'){g.fillStyle(0xc7f5ff,.85).fillTriangle(h.x-h.r,h.y-h.r,h.x+h.r,h.y-h.r,h.x,h.y+h.r*1.8);g.lineStyle(2,0xffffff,.8).lineBetween(h.x-5,h.y-h.r+4,h.x,h.y+h.r);}else{g.fillStyle(0x756680).fillCircle(h.x,h.y,h.r).fillStyle(0xc0acd0,.65).fillTriangle(h.x-12,h.y-5,h.x+5,h.y-15,h.x+15,h.y+8);}}
   if(h.kind==='ember'){if(h.age<h.warn){const q=h.age/h.warn;g.lineStyle(4,0xff6c3d,.4+q*.5).strokeCircle(h.x,440,22+q*11);g.fillStyle(0xffbb58,.2+q*.3).fillCircle(h.x,440,12+q*7);}else{g.fillStyle(0xffc052,.9).fillCircle(h.x,h.y,h.r).fillStyle(0xff6136,.8).fillCircle(h.x+5,h.y+4,h.r*.65);g.lineStyle(6,0xff9b45,.45).lineBetween(h.x-h.vx*.12,h.y-h.vy*.12,h.x,h.y);}}
  }
  if(!s.inTransit){drawCandyWorld(this,g);drawLakeWorld(this,g);drawCaveWorld(this,g);drawIceWorld(this,g);drawWetlandWorld(this,g);drawMagmaWorld(this,g);drawForestWorld(this,g);}
  drawTransitWorld(this,g);this.carnivalLabel.setText(this.carnivalIntro?'✦ '+s.currentMap.name+'　開始巡遊 ✦':transitCaption(s)||carnivalCaption(s)||lakeCaption(s)||caveCaption(s)||iceCaption(s)||wetlandCaption(s)||magmaCaption(s)||forestCaption(s)).setScale(this.carnivalIntro>0?1.18:1);
  const offer=s.branchOffer;if(offer){const chosen=offer.selected;g.fillStyle(0x142e3a,.72).fillRoundedRect(735,28,270,145,18).fillRoundedRect(735,307,270,145,18);g.lineStyle(4,chosen==='top'?0xffde83:0xbfead8,.9).strokeRoundedRect(735,28,270,145,18);g.lineStyle(4,chosen==='bottom'?0xffde83:0xbfead8,.9).strokeRoundedRect(735,307,270,145,18);g.fillStyle(0x597b65,.82).fillRoundedRect(710,215,330,48,18);}
  for(const gate of s.gates){const top=gate.gapY-gate.gap/2,bottom=gate.gapY+gate.gap/2,x=gate.x-gate.w/2;
   g.fillStyle(0x384b62,.4).fillRect(x+8,0,gate.w,top+7).fillRect(x+8,bottom+7,gate.w,H-bottom);
   g.fillStyle(0x916f78).fillRoundedRect(x,-20,gate.w,top+20,14).fillRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.lineStyle(3,0xffe4ae).strokeRoundedRect(x,-20,gate.w,top+20,14).strokeRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.fillStyle(0x8dc5a0).fillRoundedRect(x-4,top-15,gate.w+8,16,7).fillRoundedRect(x-4,bottom,gate.w+8,16,7);
   for(let j=0;j<4;j++){this.star(g,x+12+j*24,top-9,4,0xffe6ad);this.star(g,x+12+j*24,bottom+8,4,0xffe6ad);}
  }
  const live=new Set();for(const e of s.enemies)if(!e.dead&&!e.exit){if(e.kind>=40)drawTransitEnemy(this,g,e,live);else if(e.kind>=36)drawForestEnemy(this,g,e,live);else if(e.kind>=32)drawMagmaEnemy(this,g,e,live);else if(e.kind>=28)drawWetlandEnemy(this,g,e,live);else if(e.kind>=24)drawIceEnemy(this,g,e,live);else if(e.kind>=20)drawCaveEnemy(this,g,e,live);else if(e.kind>=16)drawLakeEnemy(this,g,e);else if(e.kind>=12)drawCandyEnemy(this,g,e,live);else this.enemy(g,e);}
  let hero=this.views.get('hero');if(!hero){hero=this.craft(p.x,p.y,s.craft.width,this.entities,true);hero.scaleY/=SCALE;this.views.set('hero',hero);}live.add('hero');
  const moving=this.controlState(),action=this.heroAction?.until>s.time?this.heroAction:null,base=hero.getData('baseScale'),move=Math.min(1,Math.hypot(moving.x,moving.y)),idle=Math.sin(s.time*(s.craft.id==='owl'?3.2:4.6))*.018,actionScale=action?.type==='traitFire'?1.09:action?.type==='charge'?1.045:action?.type==='hurt'?.93:1,tilt=moving.y*(s.craft.id==='ancient'?.035:.095)-moving.x*(s.craft.id==='falcon'?.10:.045)+(s.craft.id==='falcon'&&action?.type==='traitFire'?-0.19:0)+(s.craft.id==='starwing'&&action?.type==='traitFire'?.08:0);this.animateHero(hero,s,moving,action);
  this.drawHeroMotion(f,p,s,moving,action);hero.setRotation(s.phase==='falling'?s.phaseTime*2.4:tilt).setScale(base*(1+idle)*actionScale,base/SCALE*(1-idle*.55)*actionScale).setPosition(p.x,p.y+(s.phase==='falling'?s.phaseTime*130:Math.sin(s.time*(s.craft.id==='owl'?3.2:4.6))*(s.craft.id==='ancient'?1.2:2.5)-move*1.5)).setAlpha(s.phase==='falling'?1-s.phaseTime*.6:p.invuln>0?.58+Math.sin(s.time*24)*.2:1);
  if(this.effects.some(e=>e.type==='hurt'&&e.age<.13))hero.setTintFill(0xffffff);else hero.clearTint();
  const close=this.controlState().slow||s.bullets.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<75);
  f.fillStyle(0xffffff,close?1:.5).fillCircle(p.x,p.y,s.hitRadius);f.lineStyle(1,0x25685e,close?1:.5).strokeCircle(p.x,p.y,6);
  if(p.dashing>0){f.lineStyle(12,0x8eeeff,.22).lineBetween(p.x-135,p.y,p.x-15,p.y);f.lineStyle(4,0xffffff,.6).lineBetween(p.x-110,p.y,p.x-20,p.y);}
  if(s.guardFeathers>0){for(let i=0;i<s.guardFeathers;i++){const a=s.time*3+i*Math.PI/2;this.star(f,p.x+Math.cos(a)*58,p.y+Math.sin(a)*44,9,0xd7c7ff,.9);}}
  if(s.craft.id==='ancient'&&s.guardTime>0)f.lineStyle(5,0xffdc96,.7).strokeCircle(p.x,p.y,40);
  s.optionPositions.forEach((o,i)=>{this.magic('option',o.x,o.y+Math.sin(s.time*5+i)*2,36,null,Math.sin(s.time*3+i)*.07,.88);});
  for(const item of s.pickups){
   if(item.kind==='weapon'){this.magic('bubble',item.x,item.y,60,60,0,.9);this.star(f,item.x,item.y,17,0xffdf8f);
   }else if(item.kind==='option'){this.magic('option',item.x,item.y,49);f.lineStyle(2,0xffe9a4,.65).strokeCircle(item.x,item.y,30);}
   else if(item.kind==='heart'){f.fillStyle(0xffb7c5).fillCircle(item.x-5,item.y-3,7).fillCircle(item.x+5,item.y-3,7).fillTriangle(item.x-11,item.y,item.x+11,item.y,item.x,item.y+13);}
   else{this.star(f,item.x,item.y,10,0xffdc7b);f.fillStyle(0xffffff,.8).fillCircle(item.x-2,item.y-3,2);}
  }
  if(s.boss){const b=s.boss;const v=this.entity('boss',b.x,b.y,'boss',405);v.setTint(b.flash>0?0xffffff:b.color);live.add('boss');
   g.fillStyle(0x233f50,.7).fillRoundedRect(415,28,450,9,4);g.fillStyle(0xf5b7d1).fillRoundedRect(415,28,450*Math.max(0,b.hp/b.maxHp),9,4);
   this.bossText.setText(b.name+' · '+b.phase+' 階段');
   if(b.beam>0){f.fillStyle(b.beam>.6?0xf094b9:0xfff1ce,b.beam>.6?.2:.85).fillRect(0,b.beamY-26,b.x,52);f.lineStyle(2,0xffc6e0).lineBetween(0,b.beamY-26,b.x,b.beamY-26).lineBetween(0,b.beamY+26,b.x,b.beamY+26);}
  }else this.bossText.setText('');
  for(const [id,v]of this.views)if(!live.has(id)){v.destroy();this.views.delete(id);}
  for(const a of s.shots){const alpha=a.option?.38:.87;
   if(a.kind==='explosive'){this.magic('clover',a.x,a.y,38,null,a.x*.03,alpha);f.lineStyle(2,0xffd78a,.9).strokeCircle(a.x,a.y,17);}
   else if(a.kind==='traitLeaf'){this.magic('clover',a.x,a.y,58,null,a.x*.045,alpha);f.lineStyle(3,0xc9ffd5,.7).strokeCircle(a.x,a.y,24);}
   else if(a.kind==='laser')this.magic('beam',a.x,a.y,85+a.rank*12,a.r*2-2,0,alpha,0xffffff,1);
   else if(a.kind==='homing'){const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xffedb0,alpha*.38).lineBetween(a.x-a.vx*.05,a.y-a.vy*.05,a.x,a.y);this.magic('dandelion',a.x,a.y,29,null,angle,alpha,0xffffff,.78);}
   else{const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xb7ffd2,alpha*.25).lineBetween(a.x-15*Math.cos(angle),a.y-15*Math.sin(angle),a.x,a.y);this.magic('clover',a.x,a.y,23+a.rank*2,null,angle,alpha,0xffffff,.78);}
  }
  if(s.charging){const q=Math.min(1,s.charging.elapsed/2);f.lineStyle(4,0xb2f6ff,.85).strokeCircle(p.x+38,p.y,34-q*18);f.lineStyle(2,0xffefad,.65).strokeCircle(p.x+38,p.y,15+q*20);f.fillStyle(0xffffff,.4+q*.4).fillCircle(p.x+38,p.y,5+q*10);}
  if(s.laserVisual){const l=s.laserVisual;this.magic('beam',l.x,l.y,Math.max(1,l.end-l.x),31,0,Math.min(1,l.life*7),0xffffff,0);}
  for(let i=this.magicIndex;i<this.magicPool.length;i++)this.magicPool[i].setVisible(false);
  for(const a of s.bullets){const radius=a.visualRadius||8,edge=a.forest?0x39513a:a.magma?0x69333a:a.wetland?0x315f55:a.ice?0x3e647b:a.cave?0x3e355c:a.lake?0x315b79:a.candy?0x6f405d:0x48364e,fill=a.forest?0xb98a4e:a.magma?0xffa647:a.wetland?0xc9ef9b:a.ice?0xc9f7ff:a.cave?0xc8adff:a.lake?0x8fe8ff:a.candy?0xffbe6b:0xff86b0;f.fillStyle(edge).fillCircle(a.x,a.y,radius+2);f.fillStyle(fill).fillCircle(a.x,a.y,radius);f.fillStyle(0xfffbec).fillCircle(a.x-2,a.y-2,2);if(a.candy||a.wetland||a.magma||a.forest)this.star(f,a.x,a.y,Math.max(3,radius-2),a.forest?0xffd984:a.magma?0xfff0a8:a.wetland?0xe7d0ff:0xffef9c,.8);if(a.lake||a.cave||a.ice||a.wetland||a.magma||a.forest)f.lineStyle(2,a.cave?0xe6d9ff:a.wetland?0xffe6a3:a.magma?0xffd184:a.forest?0xc7e89a:0xe6fbff,.65).strokeCircle(a.x,a.y,radius+1);}
  for(const e of this.effects){const alpha=1-e.age/.7;
   if(e.type==='lock'){for(const t of e.targets||[])f.lineStyle(2,0x93eeff,alpha).strokeCircle(t.x,t.y,24);}
   else if(e.type==='candyBounce')f.lineStyle(7,0xf0b9e5,alpha).strokeCircle(e.x,e.y,35+e.age*90);
   else if(e.type==='bubblePop'){for(let i=0;i<6;i++){const a=i*Math.PI/3;f.fillStyle(i%2?0xff9fcf:0xffd5e8,alpha).fillCircle(e.x+Math.cos(a)*e.age*85,e.y+Math.sin(a)*e.age*70,7-e.age*5);}}
   else if(e.type==='lakePrism'||e.type==='lakeSplash'){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=e.age*(e.type==='lakePrism'?150:95);f.fillStyle(i%2?0x8fe8ff:0xffe9ae,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,Math.max(2,8-e.age*7));}f.lineStyle(4,0xcaf8ff,alpha).strokeCircle(e.x,e.y,18+e.age*105);}
   else if(e.type==='caveBlock'){f.fillStyle(0xfff5c7,alpha*.23).fillCircle(e.x,e.y,35+e.age*80);f.lineStyle(9,0xd8c5ff,alpha).strokeEllipse(e.x,e.y,65+e.age*150,84+e.age*190);for(let i=0;i<5;i++){const a=i*Math.PI*2/5+e.age*4;f.fillStyle(0xffedaa,alpha).fillTriangle(e.x+Math.cos(a)*45,e.y+Math.sin(a)*38,e.x+Math.cos(a+.14)*58,e.y+Math.sin(a+.14)*52,e.x+Math.cos(a-.14)*58,e.y+Math.sin(a-.14)*52);}}
   else if(e.type==='caveImpact'){f.fillStyle(0xe7d8ff,alpha*.2).fillCircle(e.x,e.y,28+e.age*210);f.lineStyle(7,0x9dece2,alpha).strokeCircle(e.x,e.y,18+e.age*230);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=8+e.age*190,tip=r+22;f.fillStyle(i%2?0x9dece2:0xc9b3ff,alpha).fillTriangle(e.x+Math.cos(a-.09)*r,e.y+Math.sin(a-.09)*r,e.x+Math.cos(a+.09)*r,e.y+Math.sin(a+.09)*r,e.x+Math.cos(a)*tip,e.y+Math.sin(a)*tip);}}
   else if(e.type==='iceBreak'||e.type==='iceChime'){for(let i=0;i<6;i++){const a=i*Math.PI/3,r=18+e.age*125;f.lineStyle(2,i%2?0xffffff:0xbcefff,alpha).lineBetween(e.x+Math.cos(a)*(r-9),e.y+Math.sin(a)*(r-9),e.x+Math.cos(a)*(r+9),e.y+Math.sin(a)*(r+9));}f.lineStyle(4,0xdaf8ff,alpha).strokeCircle(e.x,e.y,14+e.age*95);}
   else if(e.type==='iceTangle')f.lineStyle(7,0xa9e8ff,alpha).strokeEllipse(e.x,e.y,45+e.age*90,28+e.age*45);
   else if(e.type==='wetlandPrism'){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=18+e.age*175;f.lineStyle(4,[0xff9fbe,0xffe59a,0x9cf2d1,0xa9d8ff][i%4],alpha).lineBetween(e.x+Math.cos(a)*15,e.y+Math.sin(a)*15,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);}f.lineStyle(5,0xffffff,alpha).strokeCircle(e.x,e.y,22+e.age*95);}
   else if(e.type==='wetlandSpore'){for(let i=0;i<10;i++){const a=i*Math.PI/5+.35,r=8+e.age*(65+i%3*18);f.fillStyle(i%2?0xd2a5e3:0xb8efc0,alpha*.72).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.72,Math.max(2,8-e.age*6));}f.lineStyle(6,0xe5c7ee,alpha*.7).strokeEllipse(e.x,e.y,35+e.age*150,24+e.age*95);}
   else if(e.type==='wetlandDazed'){for(let i=0;i<3;i++){const r=18+i*13+e.age*60;f.lineStyle(4,i%2?0xffe39a:0xb7f3cc,alpha).beginPath().arc(e.x,e.y,r,e.age*5+i,Math.PI*1.45+e.age*5+i).strokePath();}}
   else if(e.type==='wetlandPollenPop'){f.fillStyle(0xe4b8ef,alpha*.18).fillCircle(e.x,e.y,28+e.age*190);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=10+e.age*165;f.fillStyle(i%2?0xffe7a6:0xbdf2b4,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,Math.max(2,7-e.age*5));}}
   else if(e.type==='wetlandNote'||e.type==='wetlandSteam'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5-e.age*2,r=16+e.age*115;f.fillStyle(i%2?0xffdfa0:0xd5b7ed,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.72,5);f.lineStyle(2,0xffffff,alpha*.7).lineBetween(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.72,e.x+Math.cos(a)*r,e.y-10+Math.sin(a)*r*.72);}}
   else if(e.type==='magmaSplash'||e.type==='magmaCoalBurst'){for(let i=0;i<10;i++){const a=i*Math.PI/5,r=10+e.age*(115+i%3*25);f.fillStyle(i%2?0xffa347:0xffe294,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.65,Math.max(2,8-e.age*6));}f.lineStyle(6,0xffce73,alpha).strokeEllipse(e.x,e.y,30+e.age*180,20+e.age*95);}
   else if(e.type==='magmaArmorBreak'){f.lineStyle(8,0xffe1a0,alpha).strokeCircle(e.x,e.y,26+e.age*210);for(let i=0;i<8;i++){const a=i*Math.PI/4,r=18+e.age*170;f.fillStyle(i%2?0xb87345:0xffc16b,alpha).fillTriangle(e.x+Math.cos(a-.1)*r,e.y+Math.sin(a-.1)*r,e.x+Math.cos(a+.1)*r,e.y+Math.sin(a+.1)*r,e.x+Math.cos(a)*(r+24),e.y+Math.sin(a)*(r+24));}}
   else if(e.type==='magmaPopcorn'){for(let i=0;i<12;i++){const a=i*Math.PI/6+.2,r=8+e.age*155;f.fillStyle(i%3?0xfff0bc:0xffa74e,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,4+i%3);}}
   else if(e.type==='magmaInhale'||e.type==='magmaDrop'){for(let i=0;i<6;i++){const a=i*Math.PI/3,r=18+e.age*120;f.lineStyle(4,i%2?0xffde91:0xff8961,alpha).beginPath().arc(e.x,e.y,r,a,a+1.15).strokePath();}}
   else if(e.type==='magmaScorch'){f.fillStyle(0xff8b46,alpha*.2).fillCircle(e.x,e.y,30+e.age*170);f.lineStyle(8,0xffd174,alpha).strokeCircle(e.x,e.y,16+e.age*145);}
   else if(e.type==='forestLeaves'||e.type==='forestLeafFan'){for(let i=0;i<11;i++){const a=i*Math.PI*2/11+.3,r=10+e.age*(95+i%3*25);f.fillStyle(i%3===0?0xffc45f:i%2?0xb8d66f:0xc95c47,alpha).fillEllipse(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.75,10,5);}}
   else if(e.type==='forestStrings'){for(let i=-2;i<=2;i++){f.lineStyle(2,0xe9f0dc,alpha*.75).lineBetween(e.x+i*13,e.y-25,e.x+i*18,e.y-150-e.age*55);}f.lineStyle(5,0xffd875,alpha).strokeCircle(e.x,e.y,20+e.age*110);}
   else if(e.type==='forestWoodStrike'||e.type==='forestTwigHit'){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=10+e.age*150;f.fillStyle(i%2?0xa96e42:0xe6bd72,alpha).fillTriangle(e.x+Math.cos(a-.1)*r,e.y+Math.sin(a-.1)*r,e.x+Math.cos(a+.1)*r,e.y+Math.sin(a+.1)*r,e.x+Math.cos(a)*(r+20),e.y+Math.sin(a)*(r+20));}f.lineStyle(6,0xffe5a3,alpha).strokeCircle(e.x,e.y,18+e.age*125);}
   else if(e.type==='forestTick'){for(let i=0;i<4;i++){const r=16+i*13+e.age*75;f.lineStyle(3,i%2?0xffd77a:0xb6df91,alpha).beginPath().arc(e.x,e.y,r,-Math.PI/2+e.age*4+i*.4,Math.PI*.35+e.age*4+i*.4).strokePath();}}
   else if(e.type==='transitPrize'||e.type==='transitRide'){for(let i=0;i<12;i++){const a=i*Math.PI/6,r=20+e.age*(e.type==='transitPrize'?260:170);this.star(f,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,Math.max(2,10-e.age*8),i%2?0xffdc78:0xaeeeff,alpha);}f.lineStyle(7,0xffffff,alpha).strokeCircle(e.x,e.y,24+e.age*180);}
   else if(e.type==='regionClear'){f.lineStyle(10,e.flawless?0xffe189:0xbcefcf,alpha).strokeCircle(e.x,e.y,45+e.age*700);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;this.star(f,e.x+Math.cos(a)*(35+e.age*290),e.y+Math.sin(a)*(30+e.age*170),9-e.age*7,0xffe6a1,alpha);}}
   else if(e.type==='breeze')f.lineStyle(5,0xb8f6ef,alpha).strokeCircle(e.x,e.y,20+e.age*180);
   else if(e.type==='bomb'){if(!this.reducedFX)f.fillStyle(0xfff8c9,alpha*.16).fillRect(0,0,1280,H);f.lineStyle(9,0xffefbd,alpha).strokeCircle(e.x,e.y,40+e.age*1600);}
   else if(e.type==='pop'||e.type==='elite'){f.fillStyle(0xffffff,alpha*.8).fillEllipse(e.x,e.y-e.age*35,24+e.age*80,17+e.age*35).fillCircle(e.x-14,e.y-9-e.age*35,10+e.age*12);}
   else if(e.type==='graze')f.lineStyle(2,0xa7fff0,alpha).strokeCircle(e.x,e.y,12+e.age*30);
   else if(e.type!=='warning'&&e.type!=='boss'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;this.star(f,e.x+Math.cos(a)*e.age*100,e.y+Math.sin(a)*e.age*80,Math.max(1,7-e.age*8),e.type==='hurt'?0xff9fb7:0xffebaf,alpha);}}
  }
  const weapon=STAR_WEAPONS.find(w=>w.id===s.weapon);this.hp.setText('生命 '+p.hp+'/'+p.maxHp);this.meta.setText(s.craft.name+' Lv.'+s.weaponRanks.clover);
  const stageName=s.boss?s.boss.name:s.inTransit?'星風亂流 → '+s.route[Math.min(s.segment+1,s.route.length-1)].name:s.currentMap?.name||'';this.scoreLabel.setText('分數 '+s.score.toLocaleString()+'  擦彈 '+s.stats.graze);this.stageLabel.setText(stageName+'　｜　J 特殊 · I 機體攻擊 · K 大招 · L 武器艙 · G 調校');this.gmButton?.label?.setText(s.gmUsed?'GM＊':'GM 調校');
  this.noticeText.setFontSize(s.inTransit?18:24).setY(s.inTransit?98:110).setText(s.noticeLife>0?s.notice:'');this.branchHint.setVisible(!!offer).setText(offer?(offer.selected?'已選擇 · 區域交接中':'飛入通道或直接點路牌'):'');this.branchTop.setVisible(!!offer).setText(offer?'上　'+offer.top.name:'');this.branchBottom.setVisible(!!offer).setText(offer?'下　'+offer.bottom.name:'');this.drawControls();
 }
 drawControls(){const s=this.session,g=this.control;g.clear();const j=this.touch.owner===null?STAR_CONTROLS.joystick:this.touch.origin;
  g.fillStyle(0x1c4654,.28).fillCircle(j.x,j.y,57).lineStyle(2,0xd3f2df,.55).strokeCircle(j.x,j.y,57).fillStyle(0xd1eddd,.55).fillCircle(j.x+this.touch.axis.x*36,j.y+this.touch.axis.y*36,23);
  for(const key of ['special','bomb','trait','dash']){const c=STAR_CONTROLS[key];g.fillStyle(key==='bomb'?0x74536c:key==='trait'?0xd94a50:key==='dash'?0x2e887f:0x244c5b,.82).fillCircle(c.x,c.y,c.r).lineStyle(2,key==='bomb'&&s.ultimateEnergy>=100?0xffe18b:0xcde9dd,.9).strokeCircle(c.x,c.y,c.r);}
  const c=STAR_CONTROLS.bomb;g.lineStyle(5,0xffd784,.9).beginPath().arc(c.x,c.y,c.r-5,-Math.PI/2,-Math.PI/2+Math.PI*2*s.ultimateEnergy/100,false).strokePath();
  this.dashLabel.setText(s.player.dashCD>0?'加速\n'+s.player.dashCD.toFixed(0)+'s':'加速\n+50%');const w=STAR_SPECIALS.find(w=>w.id===s.specialWeapon),cd=s.specialCooldowns[w.id];this.fireLabel.setText(s.charging?'集氣 '+Math.round(s.charging.elapsed/2*100)+'%':cd>0?w.short+'\n'+cd.toFixed(1)+'s':w.short+'\n特殊彈');
  this.bombLabel.setText(s.ultimateEnergy>=100?'大招\n就緒':'大招\n'+Math.floor(s.ultimateEnergy)+'%');this.traitLabel.setText(s.player.traitCD>0?s.craft.trait+'\n'+s.player.traitCD.toFixed(1)+'s':s.craft.trait+'\n短按技能\n長按彈艙');
 }

 showMessage(title,body,fn,label='繼續飛行'){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
  o.add([this.add.rectangle(640,360,1280,720,0x102e3b,.78).setInteractive(),this.panel(640,350,960,570,0x193f4c,0xc8bc8d,28),this.text(640,133,title,38),this.text(640,296,body,25)]);
  o.add(this.b(640,534,390,72,label,fn,0x9c743c));return o;}
 pauseGame(help=false){if(this.mode!=='playing')return;this.mode='paused';this.session.setPaused(true);this.clearInput();this.stopTones();this.ultimateOverlay?.setVisible(false);
  const o=this.showMessage(help?'飛行員小抄':'暫停飛行',help?'搖桿／WASD 移動 · 依機體節奏自動普攻\nJ／紅圈鍵：點一下，自動集氣 2 秒後發射貫穿雷射\nI／最右下：各機體專屬技能\nK／空白：能量滿時發動星光祝福\nU／衝刺：短暫無敵，3 秒冷卻\nL／武器艙：暫停換特殊武器\nG／右上 GM：暫停並調整本局測試參數\n生命耗盡後可從安全航點重試':'航程與所有道具已停止，準備好再繼續。\n失敗可以從附近安全航點重新出發。',()=>this.resumeGame());
  o.add(this.b(640,619,390,52,'返回遊戲列表',()=>this.leave(),0x315c65));}
 resumeGame(){if(this.mode!=='paused'||this.portrait())return;this.clearInput();this.overlay?.destroy();this.overlay=null;this.session.setPaused(false);this.mode='playing';}
 finish(){this.mode='finished';this.clearInput();this.tone('finish');const s=this.session,won=s.status==='won';
  const o=this.showMessage(won?'星光航線挑戰成功！':'先回補給站休息一下','分數 '+s.score.toLocaleString()+' · 擦彈 '+s.stats.graze+' 次\n淨化 '+s.stats.cleared+' 位對手 · 普攻強化 '+s.stats.weaponChoices+' 次\n'+(won?(s.boss?.name||'區域首領')+'化成滿天星光！':'從附近安全航點重試，保留當時武器。'),()=>this.start(won?null:s.checkpoint),won?'再飛一次':'安全航點重試');
  o.add(this.b(640,620,390,52,'返回遊戲列表',()=>this.leave()));}
 leave(){this.stopTones();this.clearInput();if(this.scene.manager.keys[this.returnScene]||this.scene.manager.keys.MiniGameHub)this.scene.start(this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub');else this.showTitle();}
}
