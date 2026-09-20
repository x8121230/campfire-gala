import {STARWING30_SHEETS,registerStarwing30,starwingPose30,setStarwingPose30,drawStarwingShot30,drawStarwingLocks30,drawStarwingDrone30,drawStarwingFx30,drawStarwingUltimate30} from './StarflightStarwingFrames30.js?v=star0130';
import {ANCIENT29_SHEETS,registerAncient29,ancientPose29,setAncientPose29,drawAncientShot29,drawAncientFx29,drawAncientUltimate29} from './StarflightAncientFrames29.js?v=star0130';
import {FALCON28_SHEETS,registerFalcon28,falconPose28,setFalconPose28,drawFalconBeam28,drawFalconFx28,drawFalconUltimate28} from './StarflightFalconFrames28.js?v=star0130';
import {OWL27_SHEETS,registerOwl27,owlPose27,setOwlPose27} from './StarflightOwlFrames27.js?v=star0130';
import {registerIceArt26,drawBubbleBreak26} from './StarflightIceArt26.js?v=star0130';
import {registerStar125Frames} from './StarflightSpriteFrames25.js?v=star0130';
import {STAR_CRAFTS,getStarCraft} from '../data/StarflightCrafts.js?v=star0201';
import AnimalSnackGame from './AnimalSnackGame.js';
import {StarflightSession,StarflightTouch,STAR_CONTROLS,STAR_FIELD,STAR_WEAPONS,STAR_SPECIALS,STAR_PHASE1,STAR_TUNING,STAR_TRANSIT_SECONDS,resolveStarPhase,starColor} from '../data/StarflightRules.js?v=star0201';
import {CARNIVAL_PLANS} from '../data/StarflightCarnival.js?v=star0130';
import {registerCarnivalFrames,createCandyScenery,drawCandyEnemy,drawCandyWorld,carnivalCaption} from './StarflightCarnivalView.js';
import {drawLakeEnemy,drawLakeWorld,lakeCaption} from './StarflightLakeView.js?v=star0130';
import {registerCaveFrames,drawCaveEnemy,drawCaveWorld,caveCaption} from './StarflightCaveView.js?v=star0130';
import {registerIceFrames,drawIceEnemy,drawIceWorld,iceCaption} from './StarflightIceView.js?v=star0130';
import {registerWetlandFrames,drawWetlandEnemy,drawWetlandWorld,wetlandCaption} from './StarflightWetlandView.js?v=star0130';
import {registerMagmaFrames,drawMagmaEnemy,drawMagmaWorld,magmaCaption} from './StarflightMagmaView.js?v=star0130';
import {registerForestFrames,drawForestEnemy,drawForestWorld,forestCaption} from './StarflightForestView.js';
import {drawTransitEnemy,drawTransitWorld,transitCaption} from './StarflightTransitView.js?v=star0130';
import {preferences} from '../systems/AdventurePreferences.js';
const TOP=64,H=480,SCALE=1.27;
const FRAMES={hero:[0,174,348,456],fairy:[632,794,224,334],boss:[842,645,412,514]};
const SKY={cloud:'star_sky',market:'star_sky_market',honey:'star_sky_honey',crystal:'star_sky_crystal',harbor:'star_sky_harbor',carnival:'star_carnival_bg',cave:'star_cave_bg',ice:'star_ice_bg',wetland:'star_wetland_bg',magma:'star_magma_bg',forest:'star_forest_bg',transit:'star_transit_bg'};
const MAGIC=['clover','beam','dandelion','option','bubble'];
const MOTHER_GUARD='item_fullset_secret_guard';
const STAR_SFX31={sortie:'swift-sortie',shot:'swift-shot',echo:'swift-echo',hurt:'swift-hurt',dash:'swift-dash',shield:'swift-shield-break',ultimate:'swift-ultimate',fall:'swift-fall',bellHit:'bell-hit',bellChange:'bell-change',crystal:'crystal',upgrade:'upgrade',enemyHit:'enemy-hit',enemyPop:'enemy-pop',elite:'elite-break',warning:'boss-warning',boss:'boss-enter',clear:'ultimate-clear',weaponCharge:'weapon-charge',weaponLaser:'weapon-laser',weaponExplosive:'weapon-explosive',weaponShotgun:'weapon-shotgun',graze:'graze'};
const STAR_SFX32={falconSortie:'falcon-sortie',falconShot:'falcon-shot',falconFocus:'falcon-focus',falconPierce:'falcon-pierce',falconHurt:'falcon-hurt',falconDash:'falcon-dash',falconUltimate:'falcon-ultimate',falconFall:'falcon-fall'};
const STAR_SFX33={owlSortie:'owl-sortie',owlShot:'owl-shot',owlOrbit:'owl-orbit',owlBlock:'owl-block',owlNova:'owl-nova',owlHurt:'owl-hurt',owlDash:'owl-dash',owlUltimate:'owl-ultimate',owlFall:'owl-fall'};
const STAR_SFX34={ancientSortie:'ancient-sortie',ancientCannon:'ancient-cannon',ancientBlast:'ancient-blast',ancientWave:'ancient-wave',ancientArmor:'ancient-armor',ancientGravity:'ancient-gravity',ancientHurt:'ancient-hurt',ancientDash:'ancient-dash',ancientUltimate:'ancient-ultimate',ancientFall:'ancient-fall'};
const STAR_SFX35={starwingSortie:'starwing-sortie',starwingLaser:'starwing-laser',starwingLock:'starwing-lock',starwingSalvo:'starwing-salvo',starwingMissileHit:'starwing-missile-hit',starwingBeamHit:'starwing-beam-hit',starwingOverclock:'starwing-overclock',starwingHurt:'starwing-hurt',starwingDash:'starwing-dash',starwingUltimate:'starwing-ultimate',starwingFall:'starwing-fall',starwingWingOpen:'starwing-wing-open',starwingWingClose:'starwing-wing-close'};
const STAR_BGM36={sky:'candy-carnival',lake:'moonlit-lake',cave:'crystal-cave',ice:'winter-sky',wetland:'misty-wetland',magma:'magma-gallop',forest:'ancient-canopy',transit:'starwind-transit',boss:'storybook-boss'};
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
 loadStarflightSfx31(){for(const [key,file]of Object.entries(STAR_SFX31))this.load.audio('star131_'+key,'assets/forest-starflight/audio-v0131/'+file+'.mp3');}
 loadStarflightSfx32(){for(const [key,file]of Object.entries(STAR_SFX32))this.load.audio('star132_'+key,'assets/forest-starflight/audio-v0132/'+file+'.mp3');}
 loadStarflightSfx33(){for(const [key,file]of Object.entries(STAR_SFX33))this.load.audio('star133_'+key,'assets/forest-starflight/audio-v0133/'+file+'.mp3');}
 loadStarflightSfx34(){for(const [key,file]of Object.entries(STAR_SFX34))this.load.audio('star134_'+key,'assets/forest-starflight/audio-v0134/'+file+'.mp3');}
 loadStarflightSfx35(){for(const [key,file]of Object.entries(STAR_SFX35))this.load.audio('star135_'+key,'assets/forest-starflight/audio-v0135/'+file+'.mp3');}
 loadStarflightBgm36(){for(const [key,file]of Object.entries(STAR_BGM36))this.load.audio('star136_bgm_'+key,'assets/forest-starflight/bgm-v0136/'+file+'.mp3');}
 init(data){super.init?.(data);this.loadStarflightSfx31();this.loadStarflightSfx32();this.loadStarflightSfx33();this.loadStarflightSfx34();this.loadStarflightSfx35();}
 preload(){this.loadStarflightBgm36();for(const key of STARWING30_SHEETS)this.load.image('star130_'+key,'assets/forest-starflight/animation-v0130/'+key+'.png');for(const key of ANCIENT29_SHEETS)this.load.image('star129_'+key,'assets/forest-starflight/animation-v0129/'+key+'.png');for(const key of FALCON28_SHEETS)this.load.image('star128_'+key,'assets/forest-starflight/animation-v0128/'+key+'.png');for(const key of OWL27_SHEETS)this.load.image('star127_'+key,'assets/forest-starflight/animation-v0127/'+key+'.png');for(const key of ['rabbit','swan','pinecone','bubble','updraft','starwind'])this.load.image('star126_'+key,'assets/forest-starflight/ice-v0126/'+key+'.png');for(const key of ['boat','frog','seahorse','teapot','leopard','yarn'])this.load.image('star125_'+key,'assets/forest-starflight/lake-ice-v0125/'+key+'.png');for(const key of ['icicle','shard','pillar','feather','bomb','fireball'])this.load.image('star124_'+key,'assets/forest-starflight/world-v0124/'+key+'.png');for(const key of ['salamander','flame'])this.load.spritesheet('star124_'+key,'assets/forest-starflight/world-v0124/'+key+'.png',{frameWidth:627,frameHeight:627,endFrame:3});for(const [key,file,w,h] of [['popbird','popbird-flap',627,627],['cloud','cloud-puff',887,443],['tanuki','tanuki-attack',627,627]])this.load.spritesheet('star123_'+key,'assets/forest-starflight/owl-magma-v0123/'+file+'.png',{frameWidth:w,frameHeight:h,endFrame:3});for(const key of ['meteor','warning'])this.load.image('star123_'+key,'assets/forest-starflight/owl-magma-v0123/'+key+'.png');this.load.spritesheet('star_courier122','assets/forest-starflight/transit-v0122/treasure-bird-flap.png',{frameWidth:627,frameHeight:627});for(const key of ['blue','green','purple','coral','drone'])this.load.image('starwing120_'+key,'assets/forest-starflight/starwing-v0120/'+key+'.png');for(const key of ['blue','green','purple','coral'])this.load.image('ancient119_'+key,'assets/forest-starflight/ancient-v0119/'+key+'.png');for(const key of ['blue','green','purple','coral'])this.load.image('falcon118_'+key,'assets/forest-starflight/falcon-v0118/'+key+'.png');for(const key of ['blue','green','purple','coral','feather'])this.load.image('owl117_'+key,'assets/forest-starflight/owl-v0117/'+key+'.png');for(const key of ['blue','green','purple','coral','wind-feather'])this.load.image('star115_'+key,'assets/forest-starflight/ui-v0115/'+key+'.png');this.load.image('star_hangar112','assets/forest-starflight/hangar-v0112/storybook-stage.png');this.load.image('star_bell109','assets/forest-starflight/pickups-v0109/starbud-bell.png');this.load.image('star_crystal109','assets/forest-starflight/pickups-v0109/energy-crystal.png');for(const c of STAR_CRAFTS)if(!this.textures.exists('craft_'+c.id))this.load.image('craft_'+c.id,'assets/forest-starflight/player/'+c.file);if(!this.textures.exists('craft_swift_cruise'))this.load.spritesheet('craft_swift_cruise','assets/forest-starflight/animation-v0107/swift-cruise-8.png',{frameWidth:444,frameHeight:444});if(!this.textures.exists('craft_swift_maneuver'))this.load.spritesheet('craft_swift_maneuver','assets/forest-starflight/animation-v0107/swift-maneuver-8.png',{frameWidth:444,frameHeight:444});if(!this.textures.exists('craft_swift_combat'))this.load.spritesheet('craft_swift_combat','assets/forest-starflight/animation-v0107/swift-combat-8.png',{frameWidth:444,frameHeight:444});this.flightLook=this.readFlightLook();const files={crew:'crew.png',sky:'sky.png',sky_market:'sky-market-v02.png',sky_honey:'sky-honey-v02.png',sky_crystal:'sky-crystal-v02.png',sky_harbor:'sky-harbor-v02.png'};
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
  this.stopStarflightMusic();for(const music of [...(this.sound.sounds||[])])if(music.loop||/bgm|music/i.test(music.key||''))music.stop();this.flightMusicBank={};this.flightMusic=null;this.flightMusicKey='';this.flightMusicStarted=false;
  this.skyScenario=-1;this.sfxLast={};
  this.selectedCraft='swift';this.mode='title';this.session=null;this.touch=new StarflightTouch();this.held=new Set();this.requests={};this.views=new Map();this.effects=[];this.heroAction=null;this.audioNodes=new Set();this.flightLook=this.readFlightLook();
  this.soundOn=preferences.value.sfx;this.autoFire=true;this.selectedSpecial='chargeLaser';this.difficulty='normal';this.overlay=null;this.carnivalIntro=0;
  this.reducedFX=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  if(this.textures.exists('star_crew')){const t=this.textures.get('star_crew'),im=t.getSourceImage();for(const [k,[x,y,w,h]]of Object.entries(FRAMES))if(!t.has(k))t.add(k,0,Math.round(x*im.width/1254),Math.round(y*im.height/1254),Math.round(w*im.width/1254),Math.round(h*im.height/1254));}
  this.input.addPointer(Math.max(0,4-(this.input.manager.pointersTotal||1)));const canvas=this.game.canvas,old=canvas.style.touchAction;canvas.style.touchAction='none';
  this.down=p=>{this.unlockStarflightMusic();if(this.mode!=='playing')return;if(this.session?.bayOpen&&p.x>760){this.weaponPointerId=p.id;this.selectWeaponAt(p.x,p.y);return;}this.touch.ultimateReady=this.session.ultimateEnergy>=100&&this.session.phase==='combat';if(!this.chooseBranchAt(p.x,p.y))this.touch.down(p);};
  this.move=p=>{if(this.mode!=='playing')return;if(this.session?.bayOpen&&p.id===this.weaponPointerId)this.selectWeaponAt(p.x,p.y);else this.touch.move(p);};
  this.up=p=>{if(this.session?.bayOpen&&p.id===this.weaponPointerId){this.selectWeaponAt(p.x,p.y);this.closeWeaponBay(true);}this.touch.up(p);};this.cancel=()=>{this.closeWeaponBay();this.clearInput();};
  this.keydown=e=>{if(e.repeat)return;this.unlockStarflightMusic();if(this.mode==='title'&&['ArrowLeft','ArrowRight'].includes(e.code)){this.switchCraft(e.code==='ArrowLeft'?-1:1);return;}if(['Escape','KeyP'].includes(e.code)){if(this.session?.bayOpen){this.closeWeaponBay();return;}this.mode==='gm'?this.closeGMPanel():this.mode==='bay'?this.closeWeaponBay():this.mode==='paused'?this.resumeGame():this.pauseGame();return;}if(e.code==='KeyG'&&this.mode==='playing'){this.openGMPanel();return;}if(this.mode!=='playing')return;
   this.held.add(e.code);if(e.code==='Space'||e.code==='KeyI')this.touch.down({id:'keyboardFire',...STAR_CONTROLS.trait});if(e.code==='KeyU')this.requests.dash=true;if(e.code==='KeyK'&&this.session.ultimateEnergy>=100)this.requests.bomb=true;};
  this.keyup=e=>{this.held.delete(e.code);if(e.code==='Space'||e.code==='KeyI')this.touch.up({id:'keyboardFire',...STAR_CONTROLS.trait});};
  this.input.on('pointerdown',this.down);this.input.on('pointermove',this.move);this.input.on('pointerup',this.up);this.input.on('pointerupoutside',this.up);this.input.on('gameout',this.cancel);
  this.input.keyboard?.on('keydown',this.keydown);this.input.keyboard?.on('keyup',this.keyup);this.input.keyboard?.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  this.blur=()=>this.pauseGame();this.hidden=()=>{if(document.hidden)this.pauseGame();};this.resize=()=>{if(this.portrait())this.pauseGame();};
  this.game.events.on('blur',this.blur);document.addEventListener('visibilitychange',this.hidden);window.addEventListener('resize',this.resize);window.addEventListener('pointercancel',this.cancel);
  this.events.once('shutdown',()=>{canvas.style.touchAction=old;this.input.off('pointerdown',this.down);this.input.off('pointermove',this.move);this.input.off('pointerup',this.up);this.input.off('pointerupoutside',this.up);this.input.off('gameout',this.cancel);
   this.input.keyboard?.off('keydown',this.keydown);this.input.keyboard?.off('keyup',this.keyup);this.input.keyboard?.removeCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
   this.game.events.off('blur',this.blur);document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('resize',this.resize);window.removeEventListener('pointercancel',this.cancel);
   this.stopStarflightMusic();this.clearInput();this.stopTones();this.maskShape?.destroy();this.fieldMask?.destroy();});
  if(STARWING30_SHEETS.some(k=>!this.textures.exists('star130_'+k))||!this.textures.exists('star_courier122')||['blue','green','purple','coral','drone'].some(k=>!this.textures.exists('starwing120_'+k))||['blue','green','purple','coral'].some(k=>!this.textures.exists('ancient119_'+k))||['blue','green','purple','coral'].some(k=>!this.textures.exists('falcon118_'+k))||['blue','green','purple','coral','feather'].some(k=>!this.textures.exists('owl117_'+k))||['blue','green','purple','coral','wind-feather'].some(k=>!this.textures.exists('star115_'+k))||!this.textures.exists('star_hangar112')||!this.textures.exists('star_bell109')||!this.textures.exists('star_crystal109')||Object.values(SKY).some(k=>!this.textures.exists(k))||!this.textures.exists('star_candy_enemies')||!this.textures.exists('star_candy_scenery')||!this.textures.exists('star_cave_enemies')||!this.textures.exists('star_ice_enemies')||!this.textures.exists('star_wetland_enemies')||!this.textures.exists('star_magma_enemies')||!this.textures.exists('star_forest_enemies')||!this.textures.exists('star_crew')||!this.textures.exists('craft_swift_cruise')||!this.textures.exists('craft_swift_maneuver')||!this.textures.exists('craft_swift_combat')||STAR_CRAFTS.some(c=>!this.textures.exists('craft_'+c.id))||MAGIC.some(k=>!this.textures.exists('stg04_'+k))){
   this.add.rectangle(640,360,1280,720,0x173f43);this.text(640,260,'星航素材尚未齊全\n請將更新內容合併至保留原 assets 的遊戲資料夾',30);this.b(640,450,340,80,'返回遊戲列表',()=>this.leave());return;}
  registerStarwing30(this);registerAncient29(this);registerFalcon28(this);registerOwl27(this);this.registerMagicFrames();this.registerCraftAnimations();
  registerCarnivalFrames(this);
  registerCaveFrames(this);
  registerIceFrames(this);registerStar125Frames(this);registerIceArt26(this);
  registerWetlandFrames(this);
  registerMagmaFrames(this);
  registerForestFrames(this);
  this.showTitle();
 }
 text(x,y,t,size=24,color='#fff3d2',origin=.5){return super.text(x,y,t,size,color,origin);}
 b(x,y,w,h,t,fn,color=0x31686b){const c=super.button(x,y,w,h,t,fn,color,'#fff7df');c.label.setFontSize(25);return c;}
 portrait(){return window.innerHeight>window.innerWidth;}
 clearInput(){this.touch?.reset();this.held?.clear();this.requests={};if(this.session){this.session.last={};this.session.pending={};}}
 clear(){this.clearInput();this.tweens.killAll();this.fieldMask?.destroy();this.maskShape?.destroy();this.fieldMask=null;this.maskShape=null;for(const child of this.children.getChildren().slice())child.destroy();this.views.clear();this.effects=[];this.heroAction=null;this.overlay=null;this.ultimateOverlay=null;this.guardianOverlay=null;this.launchOverlay=null;this.skillCards=null;this.skillMeters=null;}
 art(x,y,frame,size,parent=null){const im=this.add.image(x,y,'star_crew',frame);im.setScale(size/Math.max(im.width,im.height));parent?.add(im);return im;}
 craft(x,y,width,parent=null,bodyAnchor=false){const c=getStarCraft(this.mode==='title'?this.selectedCraft:this.session?.craft?.id||this.selectedCraft),animated=bodyAnchor&&c.id==='swift'&&this.textures.exists('craft_swift_cruise'),im=animated?this.add.sprite(x,y,'craft_swift_cruise',0):this.add.image(x,y,'craft_'+c.id);im.setScale(width/im.width).setData('baseScale',width/im.width);if(animated)im.play('swift_cruise');if(c.id==='starwing'){im.setData('starwingWidth',width);setStarwingPose30(im,['cruise',0,'cruise']);im.setScale(width/im.width).setData('baseScale',width/im.width);}if(c.id==='owl'){im.setData('owlWidth',width);setOwlPose27(im,['owl-cruise',0,'cruise']);im.setScale(width/im.width).setData('baseScale',width/im.width);}if(c.id==='ancient'){im.setData('ancientWidth',width);setAncientPose29(im,['cruise',0,'cruise']);im.setScale(width/im.width).setData('baseScale',width/im.width);}if(c.id==='falcon'){im.setData('falconWidth',width);setFalconPose28(im,['falcon-cruise',0,'cruise']);im.setScale(width/im.width).setData('baseScale',width/im.width);}if(bodyAnchor&&!['owl','falcon','ancient','starwing'].includes(c.id))im.setOrigin(...c.anchor);parent?.add(im);return im;}
 readFlightLook(){let saved={};try{saved=JSON.parse(globalThis.localStorage?.getItem('forest_save_data')||'{}');}catch{}const get=k=>{try{const value=this.registry?.get(k);if(value!==undefined&&value!==null&&value!=='')return value;}catch{}return saved[k]||'none';},fullsetId=get('equipped_fullset'),clothId=get('equipped_cloth'),hatId=get('equipped_hat');
  const bodyId=fullsetId!=='none'?fullsetId:clothId!=='none'?clothId:'item_cloth_daily_01',body=DOLL_BODIES[bodyId]||DOLL_BODIES.item_cloth_daily_01;
  return {bodyId,hatId,body,hat:bodyId==='item_fullset_fairytale_raincoat'?null:DOLL_HATS[hatId]||null,guardian:bodyId===MOTHER_GUARD};}
 doll(parent,x,y,maxW,maxH,alpha=1,tint=0xffffff){const look=this.flightLook||this.readFlightLook(),c=this.add.container(x,y);parent?.add(c);const bodyKey=this.textures.exists(look.body[0])?look.body[0]:DOLL_BODIES.item_cloth_daily_01[0];
  const body=this.add.image(0,0,bodyKey),scale=Math.min(maxW/body.width,maxH/body.height);body.setScale(scale).setAlpha(alpha).setTint(tint);c.add(body);
  if(look.hat&&this.textures.exists(look.hat[0])){const hat=this.add.image(0,0,look.hat[0]).setScale(scale).setAlpha(alpha).setTint(tint);if(look.hat[1].includes('wardrobe_v55'))hat.y-=132*scale;c.add(hat);}return c;}
 switchCraft(direction){const i=STAR_CRAFTS.findIndex(c=>c.id===this.selectedCraft);this.selectedCraft=STAR_CRAFTS[(i+direction+STAR_CRAFTS.length)%STAR_CRAFTS.length].id;this.showTitle(direction);this.hangarSound(this.selectedCraft);}
 hangarSound(id='click'){
  const ctx=this.sound.context;if(!ctx||!preferences.value.sfx)return;ctx.resume?.()?.catch?.(()=>{});
  const notes=id==='owl'?[420,340]:id==='ancient'?[260,340]:id==='starwing'?[660,990,1320]:id==='falcon'?[1500,1000]:id==='swift'?[1100,1650]:[420];
  notes.forEach((hz,i)=>{const o=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+i*.095;o.type=id==='starwing'?'triangle':'sine';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*.75,t+.085);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.055,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(gain);gain.connect(ctx.destination);this.audioNodes?.add(o);o.onended=()=>{o.disconnect();gain.disconnect();this.audioNodes?.delete(o);};o.start(t);o.stop(t+.13);});
 }
 hangarButton(x,y,w,h,label,fn,color=0x64835a){const b=this.b(x,y,w,h,label,()=>{this.hangarSound();fn();},color);const trim=this.add.graphics();trim.lineStyle(1,0xffecc4,.30).strokeRoundedRect(-w/2+4,-h/2+4,w-8,h-8,10);trim.lineStyle(2,0x34472b,.20).lineBetween(-w/2+14,h/2-5,w/2-14,h/2-5);b.addAt(trim,1);b.label.setFontSize(20);b.on('pointerover',()=>{if(!this.reducedFX)b.setScale(1.035);});b.on('pointerout',()=>b.setScale(1));return b;}
 hangarArrow(x,direction){const g=this.add.graphics();g.fillStyle(0x638951,1).fillEllipse(x,300,72,56).lineStyle(3,0xf8e3a6,1).strokeEllipse(x,300,72,56);g.lineStyle(5,0xfff3d1,1).beginPath().moveTo(x-direction*7,286).lineTo(x+direction*9,300).lineTo(x-direction*7,314).strokePath();this.add.zone(x,300,80,84).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.switchCraft(direction));}
 drawScoreGem(g,x,y,t=0){
  y+=Math.sin(t*3)*2;g.fillStyle(0xffd986,.10).fillEllipse(x,y,34,40);g.fillStyle(0xffedb9,.18).fillEllipse(x,y,25,31);
  const poly=(points,color,alpha=1)=>g.fillStyle(color,alpha).fillPoints(points.map(([dx,dy])=>({x:x+dx,y:y+dy})),true);
  poly([[0,-12],[8,-5],[7,6],[0,13],[-7,6],[-8,-5]],0xb58643);
  poly([[0,-10],[6,-4],[0,1],[-6,-4]],0xfff3c4);poly([[-6,-4],[0,1],[0,11],[-5,5]],0xe6b760);poly([[6,-4],[0,1],[0,11],[5,5]],0xffd78a);
  g.lineStyle(1,0xfff9dd,.85).lineBetween(x-3,y-7,x,y-9);g.lineStyle(1,0xffefd0,.55).lineBetween(x+11,y-9,x+11,y-3).lineBetween(x+8,y-6,x+14,y-6);
 }
 drawHeroRim(hero,live){
  const offsets=[[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]];
  offsets.forEach(([dx,dy],i)=>{const id='heroRim'+i;let rim=this.views.get(id);if(!rim){rim=this.add.image(0,0,hero.texture.key,hero.frame.name);this.entities.add(rim);this.views.set(id,rim);}live.add(id);rim.setTexture(hero.texture.key,hero.frame.name).setOrigin(hero.originX,hero.originY).setPosition(hero.x+dx,hero.y+dy).setScale(hero.scaleX,hero.scaleY).setRotation(hero.rotation).setTintFill(0xfff7e6).setAlpha(hero.alpha*.45);});
  this.entities.bringToTop(hero);
 }
 showTitle(direction=0){this.clear();this.mode='title';const c=getStarCraft(this.selectedCraft),index=STAR_CRAFTS.indexOf(c),ink='#405746';
  this.add.image(640,360,'star_hangar112').setDisplaySize(1280,720);
  this.text(640,40,'森林星航・選一位冒險夥伴',32,ink).setStroke('#fff4d9',4);
  this.text(640,76,'四款鳥類與隱藏機巧　｜　v'+STAR_PHASE1.version,16,ink);
  this.add.ellipse(300,390,260,34,0xfff0ad,.5);
  const bird=this.craft(300+(direction?direction*65:0),280,Math.min(418,c.width*2.45));bird.setAlpha(direction?0:1);
  if(!this.reducedFX){this.tweens.add({targets:bird,x:300,alpha:1,duration:340,ease:'Cubic.out',onComplete:()=>{this.tweens.add({targets:bird,y:270,angle:1.5,duration:1600,yoyo:true,repeat:-1,ease:'Sine.inOut'});}});}else bird.setPosition(300,280).setAlpha(1);
  this.hangarArrow(94,-1);this.hangarArrow(520,1);
  this.text(300,439,c.name,31,ink).setStroke('#fff6df',4);
  this.text(300,475,c.role+' · '+c.size,20,ink).setStroke('#fff6df',3);
  this.text(300,511,'♥ '.repeat(c.hp).trim(),26,'#ba6670').setStroke('#fff8e5',3);
  this.text(189,549,'速度',18,ink);const g=this.add.graphics(),rating={swift:3,falcon:5,owl:2,ancient:1,starwing:4}[c.id];
  for(let i=0;i<5;i++){const x=242+i*29;g.fillStyle(i<rating?0x558c97:0xc0c5b7,1);g.fillTriangle(x-9,550,x+10,537,x+3,555);g.lineStyle(2,0xfff4d6,1).lineBetween(x-5,550,x+7,541);}
  this.text(300,580,'4 號戰術特攻：'+c.trait,16,ink);
  STAR_CRAFTS.forEach((item,i)=>{this.add.circle(244+i*28,610,i===index?6:4,i===index?0x547f5b:0xb9baa4);this.add.zone(244+i*28,610,26,28).setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.selectedCraft=item.id;this.showTitle(i>index?1:-1);this.hangarSound(item.id);});});
  this.text(910,145,'飛行夥伴手冊',28,'#795b32');
  this.text(679,201,'①',25,'#ba6353');this.text(727,185,'按住攻擊',21,ink,0);this.text(727,217,c.tip,17,'#796b52',0);
  this.text(910,261,'紅鈴輪盤 · 四項技能可並存',20,'#795b32');
  const descriptions={swift:['風羽寬度 +10／20／30%','追加 1／2／3 枚側翼風羽','命中分裂風屑，最高分裂 2 枚','強化狂風過載，最高延長至 15 秒'],falcon:['翼下微型貫穿彈逐步成雙','擴大擦彈圈與最遠端傷害','累積擦彈後召喚幻隼反擊','增加超頻獵殺時間與分身上限'],owl:['月羽音波與旋羽距離 +10／20／30%','未攻擊後生成 2／3／4 片旋羽','縮短常駐護羽重新生成時間','同步增加羽傷與爆破範圍'],ancient:['定時凝聚可吸收攻擊的岩盾','每 10／8／6 秒拋出史前落石','提高古生岩嶂的吸收上限','手動引爆散射更多碎岩'],starwing:['光束逐步升級為四聯裝矩陣','追加並強化追蹤導彈','浮游子機數量與射速成長','雷達鎖定上限提升至 8／10／12']}[c.id];
  const colors=[0xd56b62,0xc96358,0xb95750,0xa94b48];
  c.bells.forEach((name,i)=>{const y=310+i*66;g.fillStyle(colors[i],.10).fillRoundedRect(650,y-24,515,59,12);this.add.image(679,y,'star_bell109').setDisplaySize(45,45).setTint(colors[i]);
   const x=734;g.lineStyle(3,colors[i],1);if(i===0){g.lineBetween(x-10,y+8,x+9,y-9).lineBetween(x-7,y,x+2,y+5);}if(i===1){g.beginPath().moveTo(x,y-12).lineTo(x+11,y-7).lineTo(x+8,y+7).lineTo(x,y+14).lineTo(x-8,y+7).lineTo(x-11,y-7).closePath().strokePath();}if(i===2){g.strokeCircle(x,y,10).lineBetween(x-15,y,x+15,y);}if(i===3)this.star(g,x,y,13,colors[i],1);
   this.text(770,y-18,name,20,ink,0);this.text(770,y+9,descriptions[i],15,'#796b52',0);
  });
  this.text(910,566,'黃分數・綠特攻・白移速・紫攻速・虹奇蹟',14,'#796b52');
  this.hangarButton(773,604,235,38,'難度：'+(this.difficulty==='normal'?'標準':'挑戰'),()=>{this.difficulty=this.difficulty==='normal'?'challenge':'normal';this.showTitle();},0x819578).label.setFontSize(17);
  this.hangarButton(1032,604,235,38,this.reducedFX?'動態：柔和':'動態：標準',()=>{this.reducedFX=!this.reducedFX;this.showTitle();},0x819578).label.setFontSize(17);
  this.hangarButton(160,666,240,56,'← 遊戲列表',()=>this.leave());
  this.hangarButton(463,666,330,56,'糖果雲端：'+(CARNIVAL_PLANS[this.skyScenario]||'隨機劇本'),()=>{this.skyScenario=((this.skyScenario??-1)+2)%4-1;this.showTitle();},0x938263).label.setFontSize(18);
  this.hangarButton(943,660,510,70,'準備出發！',()=>this.start(),0xb58242).label.setFontSize(29);
 }


 start(checkpoint=null){if(this.portrait()){this.showMessage('請把手機橫放','左手移動；右手按住紅鍵連射，能量滿時向上滑放大招，4號使用戰術特攻。',()=>{this.overlay?.destroy();this.overlay=null;},'知道了');return;}
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
 showLaunchSequence(fromCheckpoint=false){
  this.clearInput();this.mode='launching';this.session.setPaused(true);this.launchTime=0;this.launchDuration=fromCheckpoint?1:2;this.launchCue=-1;
  if(this.session.craft.id==='swift')this.playSfx31('sortie',.36,.5);else if(this.session.craft.id==='falcon')this.playSfx32('falconSortie',.38,.5);else if(this.session.craft.id==='owl')this.playSfx33('owlSortie',.36,.5);else if(this.session.craft.id==='ancient')this.playSfx34('ancientSortie',.42,.5);else if(this.session.craft.id==='starwing')this.playSfx35('starwingSortie',.43,.5);
  this.entities.setVisible(false);this.fx.setVisible(false);this.noticeText.setVisible(false);
  const o=this.add.container(0,0).setDepth(120);this.launchOverlay=o;
  this.launchMist=this.add.rectangle(640,368,1280,610,0xd5e9e5,.3).setInteractive();o.add(this.launchMist);
  this.launchLines=this.add.graphics();o.add(this.launchLines);
  // Reuse the live sprite sheet, body anchor and size; world Y is scaled only once.
  this.launchCraft=this.craft(-120,760,this.session.craft.width,o,true);
  this.launchLeaves=this.add.graphics();o.add(this.launchLeaves);this.stepLaunch(0);
 }
 launchPoint(q){const end=this.session.player,u=1-q;
  return {x:u*u*u*(-120)+3*u*u*q*70+3*u*q*q*(end.x-95)+q*q*q*end.x,
   y:u*u*u*760+3*u*u*q*850+3*u*q*q*(TOP+end.y*SCALE)+q*q*q*(TOP+end.y*SCALE)};
 }
 stepLaunch(dt){this.launchTime=Math.min(this.launchDuration,this.launchTime+dt);const p=this.launchTime/this.launchDuration,q=1-Math.pow(1-p,3),pt=this.launchPoint(q),prev=this.launchPoint(Math.max(0,q-.008));
  if(this.session.craft.id==='starwing')setStarwingPose30(this.launchCraft,['arrival',Math.min(3,Math.floor(p*4)),'sortie']);if(this.session.craft.id==='owl')setOwlPose27(this.launchCraft,['owl-arrival',Math.min(3,Math.floor(p*4)),'sortie']);
  if(this.session.craft.id==='ancient')setAncientPose29(this.launchCraft,['arrival',Math.min(3,Math.floor(p*4)),'sortie']);if(this.session.craft.id==='falcon')setFalconPose28(this.launchCraft,['falcon-arrival',Math.min(3,Math.floor(p*4)),'sortie']);this.launchCraft.setPosition(pt.x,pt.y).setRotation(Math.atan2(pt.y-prev.y,pt.x-prev.x)*Math.min(1,(1-p)*4));
  this.launchMist.setAlpha(.3*(1-p));const g=this.launchLines.clear();
  if(!this.reducedFX){for(let i=1;i<13;i++){const a=this.launchPoint(Math.max(0,q-i*.018)),b=this.launchPoint(Math.max(0,q-(i-1)*.018));g.lineStyle(12-i*.7,0xc2efff,(1-i/13)*.35*(1-p)).lineBetween(a.x,a.y,b.x,b.y);}}
  const leaves=this.launchLeaves.clear();for(let i=0;i<3;i++){const phase=i*.23,lit=p>=phase,scatter=Math.max(0,(p-.72)/.28),x=565+i*75+scatter*(i-1)*115,y=215-scatter*85;
   const points=[];for(let n=0;n<24;n++){const a=n*Math.PI/12;points.push({x:x+Math.sin(a)*17,y:y+Math.cos(a)*29});}leaves.fillStyle(lit?0xd4f8a1:0x8fada0,(lit?.95:.35)*(1-scatter)).fillPoints(points,true);leaves.lineStyle(2,0xfff4c1,(1-scatter)*.8).lineBetween(x,y-21,x,y+22);
  }
  const cue=Math.min(2,Math.floor(p/.23));if(cue>this.launchCue){this.launchCue=cue;this.bellTone('bellHit',cue);}
  // Keep the same region moving visually, without consuming combat time or spawning enemies.
  for(const bg of this.background)if(bg.theme===this.lastTheme&&bg.theme!=='transit')bg.im.x=bg.index*1280-((this.session.time*18+Math.sin(p*Math.PI)*22)%1280);
  if(p>=1)this.finishLaunch();
 }
 finishLaunch(){this.launchOverlay?.destroy();this.launchOverlay=null;this.entities.setVisible(true);this.fx.setVisible(true);this.noticeText.setVisible(true);this.clearInput();this.session.setPaused(false);this.mode='playing';this.drawState(0);}
 controlState(){const t=this.touch.read(),k=this.held;return {...t,x:t.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),y:t.y+Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp')),dash:t.dash||this.requests.dash,special:t.special||this.requests.special,trait:t.trait||this.requests.trait,fire:t.fire,bomb:t.bomb||this.requests.bomb,slow:k.has('ShiftLeft')||k.has('ShiftRight')};}
 chooseBranchAt(x,y){if(!this.session?.branchOffer||this.session.branchOffer.selected||x<720||x>990||y<105||y>615)return false;const worldY=(y-TOP)/SCALE;return this.session.chooseBranch(worldY<240?'top':'bottom','tap');}
 musicTheme(){if(this.session?.travelPhase==='boss'||this.session?.boss)return 'boss';if(this.session?.travelPhase==='transit')return 'transit';return this.session?.currentMap?.type||'sky';}
 unlockStarflightMusic(){const resume=this.sound.context?.resume?.();this.startStarflightMusic();resume?.then?.(()=>this.startStarflightMusic()).catch?.(()=>{});}
 startStarflightMusic(){this.flightMusicStarted=true;this.switchStarflightMusic(this.musicTheme(),true);}
 switchStarflightMusic(theme,immediate=false){if(!this.flightMusicStarted)return;const key=STAR_BGM36[theme]?theme:'sky';if(this.flightMusicKey===key&&this.flightMusic?.isPlaying)return;const old=this.flightMusic;let next=this.flightMusicBank?.[key];if(!next){if(!this.cache.audio.exists('star136_bgm_'+key))return;this.flightMusicBank??={};next=this.flightMusicBank[key]=this.sound.add('star136_bgm_'+key,{loop:true,volume:0});}
  if(!next.isPlaying)next.play();next.setMute(!preferences.value.music||document.hidden);this.flightMusic=next;this.flightMusicKey=key;const target=key==='boss'?.29:.25;
  this.tweens.killTweensOf(next);if(immediate)next.setVolume(target);else{next.setVolume(0);this.tweens.add({targets:next,volume:target,duration:850,ease:'Sine.easeInOut'});}if(old&&old!==next){this.tweens.killTweensOf(old);if(immediate)old.stop();else this.tweens.add({targets:old,volume:0,duration:850,ease:'Sine.easeInOut',onComplete:()=>old.stop()});}}
 updateStarflightMusic(){this.switchStarflightMusic(this.musicTheme());const muted=!preferences.value.music||document.hidden;for(const music of Object.values(this.flightMusicBank||{}))music.setMute(muted);}
 stopStarflightMusic(){this.tweens?.killTweensOf?.(Object.values(this.flightMusicBank||{}));for(const music of Object.values(this.flightMusicBank||{})){music.stop();music.destroy();}if(this.flightMusic&&!Object.values(this.flightMusicBank||{}).includes(this.flightMusic)){this.flightMusic.stop();this.flightMusic.destroy();}this.flightMusicBank={};this.flightMusic=null;this.flightMusicKey='';this.flightMusicStarted=false;}
 playSfx31(name,volume=.3,minGap=0,detune=0){if(!this.soundOn||!this.cache.audio.exists('star131_'+name))return false;const now=this.time.now,last=this.sfxLast?.[name]??-Infinity;if(now-last<minGap*1000)return true;this.sfxLast??={};this.sfxLast[name]=now;this.sound.play('star131_'+name,{volume,detune});return true;}
 playSfx32(name,volume=.3,minGap=0,detune=0){if(!this.soundOn||!this.cache.audio.exists('star132_'+name))return false;const now=this.time.now,last=this.sfxLast?.[name]??-Infinity;if(now-last<minGap*1000)return true;this.sfxLast??={};this.sfxLast[name]=now;this.sound.play('star132_'+name,{volume,detune});return true;}
 playSfx33(name,volume=.3,minGap=0,detune=0){if(!this.soundOn||!this.cache.audio.exists('star133_'+name))return false;const now=this.time.now,last=this.sfxLast?.[name]??-Infinity;if(now-last<minGap*1000)return true;this.sfxLast??={};this.sfxLast[name]=now;this.sound.play('star133_'+name,{volume,detune});return true;}
 playSfx34(name,volume=.3,minGap=0,detune=0){if(!this.soundOn||!this.cache.audio.exists('star134_'+name))return false;const now=this.time.now,last=this.sfxLast?.[name]??-Infinity;if(now-last<minGap*1000)return true;this.sfxLast??={};this.sfxLast[name]=now;this.sound.play('star134_'+name,{volume,detune});return true;}
 playSfx35(name,volume=.3,minGap=0,detune=0){if(!this.soundOn||!this.cache.audio.exists('star135_'+name))return false;const now=this.time.now,last=this.sfxLast?.[name]??-Infinity;if(now-last<minGap*1000)return true;this.sfxLast??={};this.sfxLast[name]=now;this.sound.play('star135_'+name,{volume,detune});return true;}
 playEventSfx31(e){if(!this.soundOn)return false;const swift=this.session?.craft?.id==='swift';
  if(e.type==='bellHit')return this.playSfx31('bellHit',.23,.045,Math.min(180,(e.hits||0)*70));
  if(e.type==='bellChange')return this.playSfx31('bellChange',.32,.18);
  if(e.type==='crystalCollect')return this.playSfx31('crystal',.30,.12);
  if(e.type==='weaponChosen')return this.playSfx31('upgrade',.34,.18);
  if(e.type==='enemyHit')return this.playSfx31('enemyHit',e.boss?.20:.10,.045,e.boss?-120:Phaser.Math.Between(-80,70));
  if(e.type==='pop')return this.playSfx31('enemyPop',.16,.055,Phaser.Math.Between(-90,90));
  if(e.type==='elite')return this.playSfx31('elite',.34,.12);
  if(e.type==='warning')return this.playSfx31('warning',.38,.5);
  if(e.type==='boss')return this.playSfx31('boss',.42,.8);
  if(e.type==='bomb')return this.playSfx31('clear',.34,.2);
  if(e.type==='charge')return this.playSfx31('weaponCharge',.28,.18);
  if(e.type==='laserFire')return this.playSfx31('weaponLaser',.32,.12);
  if(e.type==='explosiveFire')return this.playSfx31('weaponExplosive',.38,.12);
  if(e.type==='shotgunFire')return this.playSfx31('weaponShotgun',.34,.12);
  if(e.type==='graze')return this.playSfx31('graze',.14,.07,Phaser.Math.Between(-60,60));
  const falcon=this.session?.craft?.id==='falcon';
  if(falcon&&e.type==='falconShot')return this.playSfx32('falconShot',.22,.075,Phaser.Math.Between(-35,35));
  if(falcon&&e.type==='falconFocus')return this.playSfx32('falconFocus',.31,.10);
  if(falcon&&e.type==='falconPierce')return this.playSfx32('falconPierce',e.far?.27:.18,.045,e.empowered?90:0);
  if(falcon&&e.type==='hurt')return this.playSfx32('falconHurt',.35,.25);
  if(falcon&&e.type==='dash')return this.playSfx32('falconDash',.38,.5);
  if(falcon&&e.type==='fall')return this.playSfx32('falconFall',.38,.6);
  if(falcon&&e.type==='ultimateStart')return this.playSfx32('falconUltimate',.43,.7);
  if(falcon&&e.type==='shot')return true;
  const owl=this.session?.craft?.id==='owl';
  if(owl&&e.type==='shot')return this.playSfx33('owlShot',.19,.09,Phaser.Math.Between(-45,45));
  if(owl&&e.type==='owlOrbit')return this.playSfx33('owlOrbit',.32,.25);
  if(owl&&e.type==='owlBlock')return this.playSfx33('owlBlock',.27,.055,Phaser.Math.Between(-70,70));
  if(owl&&e.type==='owlNova')return this.playSfx33('owlNova',.40,.5);
  if(owl&&e.type==='hurt')return this.playSfx33('owlHurt',.34,.25);
  if(owl&&e.type==='dash')return this.playSfx33('owlDash',.33,.5);
  if(owl&&e.type==='fall')return this.playSfx33('owlFall',.37,.6);
  if(owl&&e.type==='ultimateStart')return this.playSfx33('owlUltimate',.43,.7);
  const ancient=this.session?.craft?.id==='ancient';
  if(ancient&&e.type==='ancientFire')return this.playSfx34('ancientCannon',.39,.12,Phaser.Math.Between(-35,25));
  if(ancient&&e.type==='ancientBlast')return this.playSfx34('ancientBlast',.39,.09);
  if(ancient&&e.type==='ancientWave')return this.playSfx34('ancientWave',.34,.12);
  if(ancient&&e.type==='ancientArmor')return this.playSfx34('ancientArmor',.32,.16);
  if(ancient&&e.type==='gravityBurst')return this.playSfx34('ancientGravity',.40,.35);
  if(ancient&&e.type==='hurt')return this.playSfx34('ancientHurt',.38,.25);
  if(ancient&&e.type==='dash')return this.playSfx34('ancientDash',.37,.5);
  if(ancient&&e.type==='fall')return this.playSfx34('ancientFall',.42,.6);
  if(ancient&&e.type==='ultimateStart')return this.playSfx34('ancientUltimate',.46,.7);
  if(ancient&&e.type==='shot')return true;
  const starwing=this.session?.craft?.id==='starwing';
  if(starwing&&e.type==='shot')return this.playSfx35('starwingLaser',.20,.065,Phaser.Math.Between(-30,30));
  if(starwing&&e.type==='lock')return this.playSfx35('starwingLock',.30,.18);
  if(starwing&&e.type==='starSalvo')return this.playSfx35('starwingSalvo',.36,.18);
  if(starwing&&e.type==='starImpact')return this.playSfx35(e.missile?'starwingMissileHit':'starwingBeamHit',e.missile?.31:.18,.045);
  if(starwing&&e.type==='starOverclock')return this.playSfx35('starwingOverclock',.40,.5);
  if(starwing&&e.type==='starWingOpen')return this.playSfx35('starwingWingOpen',.31,.35);
  if(starwing&&e.type==='starWingClose')return this.playSfx35('starwingWingClose',.25,.35);
  if(starwing&&e.type==='traitFire')return true;
  if(starwing&&e.type==='hurt')return this.playSfx35('starwingHurt',.37,.25);
  if(starwing&&e.type==='dash')return this.playSfx35('starwingDash',.40,.5);
  if(starwing&&e.type==='fall')return this.playSfx35('starwingFall',.43,.6);
  if(starwing&&e.type==='ultimateStart')return this.playSfx35('starwingUltimate',.48,.7);
  if(!swift)return false;
  if(e.type==='shot')return this.playSfx31('shot',.17,.075,Phaser.Math.Between(-45,45));
  if(e.type==='swiftEcho')return this.playSfx31('echo',.28,.10);
  if(e.type==='hurt')return this.playSfx31('hurt',.34,.25);
  if(e.type==='shieldBreak')return this.playSfx31('shield',.34,.2);
  if(e.type==='dash')return this.playSfx31('dash',.34,.5);
  if(e.type==='fall')return this.playSfx31('fall',.38,.6);
  if(e.type==='ultimateStart')return this.playSfx31('ultimate',.42,.7);
  return false;
 }
 update(t,delta){this.updateStarflightMusic();if(this.mode==='launching'){if(!this.portrait()&&!document.hidden)this.stepLaunch(Math.min(.1,delta/1000));return;}if(this.mode==='returning'){if(this.portrait()||document.hidden)return;this.resumeTime-=Math.min(.1,delta/1000);this.resumeLabel?.setText(this.resumeTime>.35?'準備好了嗎？':'出發！');if(this.resumeTime<=0){this.overlay?.destroy();this.overlay=null;this.clearInput();this.session.closeBay();this.session.setPaused(false);this.mode='playing';}return;}
  if(this.mode!=='playing'||!this.session)return;const dt=Math.min(.1,delta/1000),input=this.controlState();
  
  if(this.session.advance(dt,input)){this.requests={};this.touch.consume();}
  this.soundOn=preferences.value.sfx;this.soundCD-=dt;
  for(const e of this.session.events.splice(0)){if(!['shot','stage','ultimateStart','charge'].includes(e.type))this.effects.push({...e,age:0});
   if(['dash','hurt','charge','laserFire','explosiveFire','shotgunFire','traitFire','owlOrbit'].includes(e.type))this.heroAction={type:e.type,started:this.session.time,until:this.session.time+(e.type==='charge'?.45:['traitFire','owlOrbit'].includes(e.type)?.5:e.type==='hurt'?.28:.34)};
   if(e.type==='weaponChosen'&&e.reward)this.bellFeedback={index:e.reward==='red'?(e.slot??-1):-1,until:this.session.time+.65};
   if(e.type==='regionIntro')this.carnivalIntro=2.8;
   if(this.playEventSfx31(e)){}
   else if(['bellHit','bellChange','crystalCollect','weaponChosen','swiftEcho','shieldBreak','owlBlock','owlOrbit','falconFocus','ancientFire','ancientBlast','ancientArmor','starSalvo','starOverclock'].includes(e.type))this.bellTone(e.type,e.hits||0);
   else if(['charge','laserFire','explosiveFire','shotgunFire','traitFire'].includes(e.type))this.weaponTone(e.type);
   else if(e.type==='guardianStart'||e.type==='guardianRevive'){this.tone(e.type==='guardianStart'?'finish':'correct');this.soundCD=.3;}
   else if(this.soundCD<=0&&!['stage','starImpact'].includes(e.type)){this.tone(e.type==='shot'?'send':e.type==='hurt'?'hint':['end','boss','warning','ultimateStart'].includes(e.type)?'finish':'correct');this.soundCD=e.type==='shot'?.25:.13;}
   if(!this.reducedFX&&['bomb','hurt','elite','laserFire','guardianRevive','caveImpact','iceBreak'].includes(e.type))this.cameras.main.shake(e.type==='bomb'?180:['caveImpact','iceBreak'].includes(e.type)?130:90,e.type==='bomb'?.003:['caveImpact','iceBreak'].includes(e.type)?.0022:.0014);
  }
  if(this.session.phase==='combat'){this.effects=this.effects.map(e=>({...e,age:e.age+dt})).filter(e=>e.age<.7).slice(-65);this.carnivalIntro=Math.max(0,this.carnivalIntro-dt);}
  if(this.weaponWheel&&!this.session.bayOpen)this.closeWeaponBay();if(this.session.bayOpen)this.paintWeaponWheel();this.drawState(this.session.phase==='combat'?dt:0);this.drawUltimate();this.drawGuardian();if(this.session.status!=='playing')this.finish();
 }
 bellTone(type,hits=0){if(!this.soundOn)return;const ctx=this.sound.context;if(!ctx)return;try{const now=ctx.currentTime,base=type==='starSalvo'?784:type==='starOverclock'?1175:type==='ancientFire'?196:type==='ancientBlast'?130:type==='ancientArmor'?392:type==='falconFocus'?1568:type==='owlBlock'?520:type==='owlOrbit'?1040:type==='bellHit'?660+hits*110:type==='bellChange'?1175:880;
  [1,2.76,4.1].forEach((ratio,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),start=now+(type==='crystalCollect'?i*.065:0);o.type='sine';o.frequency.setValueAtTime(base*ratio,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.025/(i+1),start+.006);g.gain.exponentialRampToValueAtTime(.0001,start+.48);o.connect(g);g.connect(ctx.destination);this.audioNodes.add(o);o.onended=()=>{this.audioNodes.delete(o);o.disconnect();g.disconnect();};o.start(start);o.stop(start+.5);});}catch{}}
 weaponTone(type){if(!this.soundOn)return;const ctx=this.sound.context;if(!ctx)return;
  try{const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime,d=type==='charge'?.5:.22;
   o.type=type==='explosiveFire'?'triangle':'sine';o.frequency.setValueAtTime(type==='charge'?260:type==='laserFire'?1000:480,now);o.frequency.exponentialRampToValueAtTime(type==='charge'?1050:150,now+d);
   g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+d);o.connect(g);g.connect(ctx.destination);this.audioNodes.add(o);o.onended=()=>{this.audioNodes.delete(o);o.disconnect();g.disconnect();};o.start(now);o.stop(now+d);
  }catch{}}
 drawStarwingUltimate(){drawStarwingUltimate30(this,TOP,SCALE);}
 drawAncientUltimate(){drawAncientUltimate29(this,TOP,SCALE);}
 drawFalconUltimate(){drawFalconUltimate28(this,TOP,SCALE);}
 drawOwlUltimate(){const s=this.session,p=s.owlUltimateCenter||s.player;
  if(!this.ultimateOverlay){this.ultimateOverlay=this.add.container(0,0).setDepth(80);this.owlBurst=Array.from({length:32},()=>{const im=this.add.image(0,0,'star124_feather').setDisplaySize(70,56);this.ultimateOverlay.add(im);return im;});}
  const t=s.phaseTime,r=(p.radius||s.owlUltimateRadius())*Math.min(1,t/.55),alpha=Math.min(1,t*15)*Math.max(0,1-Math.max(0,t-.55)/.35);
  this.owlBurst.forEach((im,i)=>{const a=i*Math.PI/16;im.setPosition(p.x+Math.cos(a)*r,TOP+(p.y+Math.sin(a)*r)*SCALE).setRotation(a).setAlpha(alpha);});
 }
 drawUltimate(){const s=this.session;
  if(s.phase!=='ultimate'){this.ultimateOverlay?.destroy();this.ultimateOverlay=null;return;}
  if(s.craft.id==='owl'){this.drawOwlUltimate();return;}if(s.craft.id==='falcon'){this.drawFalconUltimate();return;}if(s.craft.id==='ancient'){this.drawAncientUltimate();return;}if(s.craft.id==='starwing'){this.drawStarwingUltimate();return;}
  if(!this.ultimateOverlay){const o=this.add.container(0,0).setDepth(80);this.ultimateOverlay=o;
   o.add(this.add.rectangle(640,360,1280,720,0x162742,.9));this.ultimatePortrait=this.craft(330,390,390,o);this.ultimateFairy=this.art(570,315,'fairy',190,o);
   o.add(this.text(865,260,'妍妍的星光祝福',43,'#ffe8ab'));o.add(this.text(865,348,'讓彈幕化成滿天星光！',28,'#d9f7ed'));this.ultimateBar=this.add.graphics();o.add(this.ultimateBar);}
  const t=s.phaseTime;this.ultimateOverlay.setVisible(true);this.ultimatePortrait.setPosition(325+Math.min(1,t/.5)*25,390+Math.sin(t*3)*7).setAlpha(Math.min(1,t*3));this.ultimateFairy.setPosition(560+Math.sin(t*4)*12,310+Math.cos(t*3)*8).setAlpha(Math.min(1,t*4));
  this.ultimateBar.clear().fillStyle(0xffe6a5).fillRoundedRect(665,440,400*Math.min(1,t/3),8,4);
 }
 drawGuardian(){this.guardianOverlay?.destroy();this.guardianOverlay=null;}
 openWeaponBay(){if(this.session?.bayOpen){this.closeWeaponBay();return false;}if(this.mode!=='playing'||!this.session.openBay())return false;
  this.weaponPointerId=this.touch.bayPointerId;this.touch.bayPointerId=null;this.weaponChoice=-1;
  this.weaponSlots=[{x:955,y:430},{x:1080,y:365},{x:1205,y:430}];this.weaponWheel=this.add.graphics().setDepth(70);this.paintWeaponWheel();return true;}
 selectWeaponAt(x,y){if(!this.session?.bayOpen)return;this.weaponChoice=this.weaponSlots.findIndex(p=>Math.hypot(x-p.x,y-p.y)<=60);}
 paintWeaponWheel(){const g=this.weaponWheel;if(!g)return;g.clear();g.fillStyle(0x153b49,.76).fillRoundedRect(875,295,400,210,35);
  this.weaponSlots.forEach((p,i)=>{const w=STAR_SPECIALS[i],selected=this.weaponChoice===i;g.fillStyle(selected?0x87683b:0x244c5b,.95).fillCircle(p.x,p.y,selected?57:49).lineStyle(selected?5:2,selected?0xffe18b:0xbdebe3,.95).strokeCircle(p.x,p.y,selected?57:49);this.weaponIcon(g,w.id,p.x,p.y,1);if(w.id===this.session.specialWeapon)g.fillStyle(0xffe18b).fillCircle(p.x,p.y+39,4);});
 }
 closeWeaponBay(commit=false){if(commit&&this.weaponChoice>=0&&this.session?.bayOpen){this.session.equipSpecial(STAR_SPECIALS[this.weaponChoice].id);this.tone('correct');}this.session?.closeBay();this.weaponWheel?.destroy();this.weaponWheel=null;this.weaponPointerId=null;this.weaponChoice=-1;}
 weaponIcon(g,id,x,y,k=1){g.lineStyle(4,0xfff3cb,.96);
  if(id==='chargeLaser'){g.lineBetween(x-23*k,y,x+18*k,y).lineBetween(x-15*k,y-9*k,x+9*k,y-9*k).lineBetween(x-15*k,y+9*k,x+9*k,y+9*k);g.fillStyle(0x94edff).fillTriangle(x+27*k,y,x+12*k,y-14*k,x+12*k,y+14*k);}
  else if(id==='explosive'){this.star(g,x,y,25*k,0xffc778,.95);g.fillStyle(0xfff6d7).fillCircle(x,y,9*k);}
  else if(id==='shotgun'){for(const a of [-.6,0,.6]){const ex=x+Math.cos(a)*24*k,ey=y+Math.sin(a)*24*k;g.lineBetween(x-20*k,y,ex,ey);g.fillStyle(0xa9ef9c).fillCircle(ex,ey,5*k);}}
  else if(id==='dash'){for(const dx of [-12,8])g.lineBetween(x+dx-7,y-17,x+dx+9,y).lineBetween(x+dx+9,y,x+dx-7,y+17);}
  else if(id==='bomb'){this.star(g,x,y,25,0xffe19c,.95);g.lineStyle(2,0xfff5d8).strokeCircle(x,y,30);}
  else {for(const direction of [-1,1]){g.fillStyle(0xffe9c8).fillTriangle(x,y+10,x+direction*29,y-20,x+direction*16,y+14);g.lineBetween(x+direction*10,y+14,x+direction*25,y+1);}g.fillStyle(0xffffff).fillCircle(x,y,6);}
 }

 openGMPanel(){if(this.mode!=='playing'||!this.session||this.session.phase!=='combat')return false;this.closeWeaponBay();this.mode='gm';this.session.setPaused(true);this.clearInput();this.stopTones();this.renderGMPanel();return true;}
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
 registerCraftAnimations(){if(this.anims.exists('swift_cruise'))return;const make=(key,texture,frames,frameRate,repeat=-1)=>this.anims.create({key,frames:frames.map(frame=>({key:texture,frame})),frameRate,repeat});
  make('swift_cruise','craft_swift_cruise',[0,1,2,3,4,5,6,7],12);make('swift_reverse','craft_swift_maneuver',[0,1,2,3],10);make('swift_up','craft_swift_maneuver',[4,5],8);make('swift_down','craft_swift_maneuver',[6,7],8);make('swift_hurt','craft_swift_combat',[0,1],12,0);make('swift_boost','craft_swift_combat',[2,3],12);make('swift_trait','craft_swift_combat',[4,5],10);make('swift_fall','craft_swift_combat',[6,7],7,0);}
 animateHero(hero,s,moving,action){if(s.craft.id==='starwing'){setStarwingPose30(hero,starwingPose30(s,moving,action?{...action,elapsed:s.time-(action.started??s.time)}:null));return;}if(s.craft.id==='ancient'){setAncientPose29(hero,ancientPose29(s,moving,action?{...action,elapsed:s.time-(action.started??s.time)}:null));return;}if(s.craft.id==='falcon'){setFalconPose28(hero,falconPose28(s,moving,action?{...action,elapsed:s.time-(action.started??s.time)}:null));return;}if(s.craft.id==='owl'){setOwlPose27(hero,owlPose27(s,moving,action?{...action,elapsed:s.time-(action.started??s.time)}:null));return;}if(s.craft.id!=='swift'||!hero.anims)return;let state='cruise';if(s.phase==='falling')state='fall';else if(action?.type==='hurt')state='hurt';else if(action?.type==='traitFire'||s.charging||['laserFire','charge','explosiveFire','shotgunFire'].includes(action?.type))state='trait';else if(s.player.dashing>0||action?.type==='dash')state='boost';else if(moving.x<-.22)state='reverse';else if(moving.y<-.22)state='up';else if(moving.y>.22)state='down';if(hero.getData('swiftState')===state)return;hero.setData('swiftState',state);hero.play('swift_'+state,true);}
 magic(name,x,y,width,height=null,rotation=0,alpha=1,tint=0xffffff,anchor=.5){
  let v=this.magicPool[this.magicIndex];if(!v){v=this.add.image(0,0,'stg04_'+name,'trim');this.magicLayer.add(v);this.magicPool.push(v);}this.magicIndex++;
  v.setBlendMode(0).setTexture('stg04_'+name,'trim').setOrigin(anchor,.5).setPosition(x,y).setRotation(rotation).setAlpha(alpha).setTint(tint).setVisible(true);
  v.setDisplaySize(width,height??width*v.frame.height/v.frame.width);return v;
 }
 pickupArt(key,x,y,width,rotation=0,tint=0xffffff){let v=this.magicPool[this.magicIndex];if(!v){v=this.add.image(0,0,key);this.magicLayer.add(v);this.magicPool.push(v);}this.magicIndex++;v.setBlendMode(0).setTexture(key).setOrigin(.5).setPosition(x,y).setRotation(rotation).setAlpha(1).setTint(tint).setVisible(true).setDisplaySize(width,width);return v;}
 star(g,x,y,r,color,alpha=1){g.fillStyle(color,alpha);const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});}g.fillPoints(pts,true);}
 enemy(g,e){
  if(e.kind===4){const v=this.pickupArt('star123_cloud',e.x,e.y,126).setFrame(Math.floor(e.age*6)%4);v.setDisplaySize(126,126*443/887);if(e.flash>0)v.setTintFill(0xffffff);return;}
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
  if(id==='owl')for(let i=0;i<s.guardFeathers;i++){const a=t*2.5+i*Math.PI*2/Math.max(1,s.guardFeathers);this.pickupArt('star124_feather',p.x+Math.cos(a)*58,p.y+Math.sin(a)*44,42,a+Math.PI/2).setDisplaySize(42,34).setBlendMode(1);}
  if(id==='ancient'){for(let i=0;i<p.shield;i++){const side=i===0?-1:1;this.pickupArt('star115_wind-feather',p.x-15,p.y+side*30,65,side*.32).setDisplaySize(65,23).setTint(0xb5dda0).setBlendMode(1).setAlpha(.8);}if(s.siegeTime>=.7)f.lineStyle(3,0xffdb8e,.65).lineBetween(p.x+20,p.y-7,p.x+43,p.y-7).lineBetween(p.x+20,p.y+7,p.x+43,p.y+7);}
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
  for(const gate of s.gates){if(gate.crystalPillar){this.pickupArt('star124_pillar',gate.x,gate.side==='top'?0:480,210,gate.side==='top'?Math.PI:0).setOrigin(.5,.96).setDisplaySize(210,gate.height/.9);continue;}const top=gate.gapY-gate.gap/2,bottom=gate.gapY+gate.gap/2,x=gate.x-gate.w/2;
   g.fillStyle(0x384b62,.4).fillRect(x+8,0,gate.w,top+7).fillRect(x+8,bottom+7,gate.w,H-bottom);
   g.fillStyle(0x916f78).fillRoundedRect(x,-20,gate.w,top+20,14).fillRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.lineStyle(3,0xffe4ae).strokeRoundedRect(x,-20,gate.w,top+20,14).strokeRoundedRect(x,bottom,gate.w,H-bottom+20,14);
   g.fillStyle(0x8dc5a0).fillRoundedRect(x-4,top-15,gate.w+8,16,7).fillRoundedRect(x-4,bottom,gate.w+8,16,7);
   for(let j=0;j<4;j++){this.star(g,x+12+j*24,top-9,4,0xffe6ad);this.star(g,x+12+j*24,bottom+8,4,0xffe6ad);}
  }
  if(s.craft.id==='starwing')drawStarwingLocks30(this);
  const live=new Set();for(const e of s.enemies)if(!e.dead&&!e.exit){if(e.kind>=40)drawTransitEnemy(this,g,e,live);else if(e.kind>=36)drawForestEnemy(this,g,e,live);else if(e.kind>=32)drawMagmaEnemy(this,g,e,live);else if(e.kind>=28)drawWetlandEnemy(this,g,e,live);else if(e.kind>=24)drawIceEnemy(this,g,e,live);else if(e.kind>=20)drawCaveEnemy(this,g,e,live);else if(e.kind>=16)drawLakeEnemy(this,g,e,live);else if(e.kind>=12)drawCandyEnemy(this,g,e,live);else this.enemy(g,e);}
  let hero=this.views.get('hero');if(!hero){hero=this.craft(p.x,p.y,s.craft.width,this.entities,true);hero.scaleY/=SCALE;this.views.set('hero',hero);}live.add('hero');
  const moving=this.controlState(),action=this.heroAction?.until>s.time?this.heroAction:null,base=hero.getData('baseScale'),move=Math.min(1,Math.hypot(moving.x,moving.y)),idle=Math.sin(s.time*(s.craft.id==='owl'?3.2:4.6))*.018,actionScale=action?.type==='traitFire'?1.09:action?.type==='charge'?1.045:action?.type==='hurt'?.93:1,tilt=moving.y*(s.craft.id==='ancient'?.035:.095)-moving.x*(s.craft.id==='falcon'?.10:.045)+(s.craft.id==='falcon'&&action?.type==='traitFire'?-0.19:0)+(s.craft.id==='starwing'&&action?.type==='traitFire'?.08:0);this.animateHero(hero,s,moving,action);
  this.drawHeroMotion(f,p,s,moving,action);hero.setRotation(s.phase==='falling'?(['owl','falcon','ancient','starwing'].includes(s.craft.id)?.15:s.phaseTime*2.4):tilt).setScale(hero.getData('baseScale')*(1+idle)*actionScale,hero.getData('baseScale')/SCALE*(1-idle*.55)*actionScale).setPosition(p.x,p.y+(s.phase==='falling'?s.phaseTime*130:Math.sin(s.time*(s.craft.id==='owl'?3.2:4.6))*(s.craft.id==='ancient'?1.2:2.5)-move*1.5)).setAlpha(s.phase==='falling'?1-s.phaseTime*.6:p.invuln>0?.58+Math.sin(s.time*24)*.2:1);
  if(this.held.has('KeyH'))f.lineStyle(2,0xff756f,.95).strokeEllipse(p.x,p.y,s.hurtbox.rx*2,s.hurtbox.ry*2);
  if(this.effects.some(e=>e.type==='hurt'&&e.age<.13))hero.setTintFill(0xffffff);else hero.clearTint();
  this.drawHeroRim(hero,live);
  if(p.dashing>0){f.lineStyle(12,0x8eeeff,.22).lineBetween(p.x-135,p.y,p.x-15,p.y);f.lineStyle(4,0xffffff,.6).lineBetween(p.x-110,p.y,p.x-20,p.y);}
  if(s.guardFeathers>0&&s.craft.id!=='owl'){for(let i=0;i<s.guardFeathers;i++){const a=s.time*3+i*Math.PI/2;this.star(f,p.x+Math.cos(a)*58,p.y+Math.sin(a)*44,9,0xd7c7ff,.9);}}
  
  s.optionPositions.forEach((o,i)=>{if(s.craft.id==='starwing'){drawStarwingDrone30(this,o,i);}else this.magic('option',o.x,o.y+Math.sin(s.time*5+i)*2,36,null,Math.sin(s.time*3+i)*.07,.88);});
  for(const item of s.pickups){
   if(item.kind==='weapon'){const color=starColor(item).color,k=item.flash>0?1+item.flash*.45:1;
   this.pickupArt('star_bell109',item.x,item.y,64*k,Math.sin(item.age*4)*.16+Math.sin(item.age*30)*item.flash*.5,color);
    f.lineStyle(item.colorLock>0?3:2,item.colorLock>0?0xffffff:color,item.colorLock>0?.65+.25*Math.sin(item.age*40):.55).strokeCircle(item.x,item.y,35*k);for(let j=0;j<3;j++)f.fillStyle(j<item.hits?0xffffff:color,j<item.hits?1:.45).fillCircle(item.x+(j-1)*10,item.y+40,3);if(starColor(item).id==='red')for(let j=0;j<4;j++)f.fillStyle(j===item.rouletteSlot?0xfff2ae:0x733f3b,j===item.rouletteSlot?1:.7).fillCircle(item.x-15+j*10,item.y-42,j===item.rouletteSlot?4:3);if(starColor(item).id==='rainbow'){for(let j=0;j<6;j++)f.lineStyle(3,[0xff6b6b,0xffcc5c,0x77dd88,0x69b7ff,0xa98bff,0xff8fd8][j],.9).beginPath().arc(item.x,item.y,39,j*Math.PI/3,(j+1)*Math.PI/3).strokePath();}
   }else if(item.kind==='crystal'){this.pickupArt('star_crystal109',item.x,item.y,43,Math.sin(item.age*3)*.10);f.lineStyle(2,0x92eaff,.45).strokeCircle(item.x,item.y,25+Math.sin(item.age*5)*2);
   }else if(item.kind==='option'){this.magic('option',item.x,item.y,49);f.lineStyle(2,0xffe9a4,.65).strokeCircle(item.x,item.y,30);}
   else if(item.kind==='heart'){f.fillStyle(0xffb7c5).fillCircle(item.x-5,item.y-3,7).fillCircle(item.x+5,item.y-3,7).fillTriangle(item.x-11,item.y,item.x+11,item.y,item.x,item.y+13);}
   else this.drawScoreGem(f,item.x,item.y,item.age);
  }
  if(s.boss){const b=s.boss;const v=this.entity('boss',b.x,b.y,'boss',405);v.setTint(b.flash>0?0xffffff:b.color);live.add('boss');
   g.fillStyle(0x233f50,.7).fillRoundedRect(415,28,450,9,4);g.fillStyle(0xf5b7d1).fillRoundedRect(415,28,450*Math.max(0,b.hp/b.maxHp),9,4);
   this.bossText.setText(b.name+' · '+b.phase+' 階段');
   if(b.beam>0){f.fillStyle(b.beam>.6?0xf094b9:0xfff1ce,b.beam>.6?.2:.85).fillRect(0,b.beamY-26,b.x,52);f.lineStyle(2,0xffc6e0).lineBetween(0,b.beamY-26,b.x,b.beamY-26).lineBetween(0,b.beamY+26,b.x,b.beamY+26);}
  }else this.bossText.setText('');
  for(const [id,v]of this.views)if(!live.has(id)){v.destroy();this.views.delete(id);}
  for(const a of s.shots){const alpha=a.option?.38:.87;
   if(a.ancientShell||a.ancientRicochet||(a.kind==='gravity'&&s.craft.id==='ancient')){drawAncientShot29(this,a);}
   else if(a.kind==='gravity'){this.magic('clover',a.x,a.y,38);}
   else if(a.kind==='explosive'){this.magic('clover',a.x,a.y,38,null,a.x*.03,alpha);f.lineStyle(2,0xffd78a,.9).strokeCircle(a.x,a.y,17);}
   else if(a.kind==='traitLeaf'){this.magic('clover',a.x,a.y,58,null,a.x*.045,alpha);f.lineStyle(3,0xc9ffd5,.7).strokeCircle(a.x,a.y,24);}
   else if(a.starBeam||a.starMissile){drawStarwingShot30(this,a);}
   else if(a.kind==='laser'&&!a.falconBeam)this.magic('beam',a.x,a.y,85+a.rank*12,a.r*2-2,0,alpha,0xffffff,1);
   else if(a.kind==='homing'){const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xffedb0,alpha*.38).lineBetween(a.x-a.vx*.05,a.y-a.vy*.05,a.x,a.y);this.magic('dandelion',a.x,a.y,29,null,angle,alpha,0xffffff,.78);}
   else if(a.falconBeam){drawFalconBeam28(this,a);}
   else if(a.owlOrbit){this.pickupArt('star124_feather',a.x,a.y,62,a.angle+Math.PI/2).setDisplaySize(93,74.5).setTint(0xe5c9ff).setAlpha(alpha);if(!this.reducedFX)f.lineStyle(3,0xd8b5ff,.4).beginPath().arc(p.x,p.y,66+Math.min(1,a.age)*96,a.angle-.28,a.angle,false).strokePath();}
   else if(s.craft.id==='owl'){this.pickupArt('star124_feather',a.x,a.y,46,Math.atan2(a.vy,a.vx)).setDisplaySize(46,37).setBlendMode(1).setAlpha(alpha);}
   else if(s.craft.id==='swift'){this.pickupArt('star115_wind-feather',a.x,a.y,52+a.rank*3,Math.atan2(a.vy,a.vx)).setDisplaySize(52+a.rank*3,20).setBlendMode(1).setAlpha(alpha);}
   else{const angle=Math.atan2(a.vy,a.vx);if(!this.reducedFX)f.lineStyle(2,0xb7ffd2,alpha*.25).lineBetween(a.x-15*Math.cos(angle),a.y-15*Math.sin(angle),a.x,a.y);this.magic('clover',a.x,a.y,23+a.rank*2,null,angle,alpha,0xffffff,.78);}
  }
  for(const field of s.gravityFields||[]){const radius=(85+field.level*20)*(1-field.age/1.5);for(let n=0;n<3;n++){const angle=s.time*3+n*Math.PI*2/3;f.lineStyle(2,0xcfb5e9,.55).beginPath().arc(field.x,field.y,radius*(1-n*.2),angle,angle+1.7).strokePath();}f.fillStyle(0xffebca,.8).fillCircle(field.x,field.y,5);}
  if(s.charging){const q=Math.min(1,s.charging.elapsed/2);f.lineStyle(4,0xb2f6ff,.85).strokeCircle(p.x+38,p.y,34-q*18);f.lineStyle(2,0xffefad,.65).strokeCircle(p.x+38,p.y,15+q*20);f.fillStyle(0xffffff,.4+q*.4).fillCircle(p.x+38,p.y,5+q*10);}
  if(s.laserVisual){const l=s.laserVisual;this.magic('beam',l.x,l.y,Math.max(1,l.end-l.x),31,0,Math.min(1,l.life*7),0xffffff,0);}
  for(const a of s.bullets){if(a.swanShot){this.pickupArt('star124_shard',a.x,a.y,30,Math.atan2(a.vy,a.vx)+Math.PI/4).setDisplaySize(30,24);continue;}if(a.yarnBall){this.pickupArt('star125_yarn',a.x,a.y,86,a.age*3).setDisplaySize(86,57.3).setOrigin(.42,.52);continue;}if(a.iceShard){this.pickupArt('star124_shard',a.x,a.y,30,Math.atan2(a.vy,a.vx)+Math.PI/4);continue;}if(a.magmaBomb){this.pickupArt('star124_bomb',a.x,a.y,48,a.age*2);continue;}if(a.magmaFireball){this.pickupArt('star124_fireball',a.x,a.y,68,Math.atan2(a.vy,a.vx)-Math.PI).setDisplaySize(68,45);continue;}const radius=a.visualRadius||8,edge=a.forest?0x39513a:a.magma?0x69333a:a.wetland?0x315f55:a.ice?0x3e647b:a.cave?0x3e355c:a.lake?0x315b79:a.candy?0x6f405d:0x48364e,fill=a.forest?0xb98a4e:a.magma?0xffa647:a.wetland?0xc9ef9b:a.ice?0xc9f7ff:a.cave?0xc8adff:a.lake?0x8fe8ff:a.candy?0xffbe6b:0xff86b0;f.fillStyle(edge).fillCircle(a.x,a.y,radius+2);f.fillStyle(fill).fillCircle(a.x,a.y,radius);f.fillStyle(0xfffbec).fillCircle(a.x-2,a.y-2,2);if(a.candy||a.wetland||a.magma||a.forest)this.star(f,a.x,a.y,Math.max(3,radius-2),a.forest?0xffd984:a.magma?0xfff0a8:a.wetland?0xe7d0ff:0xffef9c,.8);if(a.lake||a.cave||a.ice||a.wetland||a.magma||a.forest)f.lineStyle(2,a.cave?0xe6d9ff:a.wetland?0xffe6a3:a.magma?0xffd184:a.forest?0xc7e89a:0xe6fbff,.65).strokeCircle(a.x,a.y,radius+1);}
  for(const e of this.effects){const alpha=1-e.age/.7;
   if(['starImpact','starSalvo','starOverclock'].includes(e.type)){drawStarwingFx30(this,e);}
   else if(e.type==='iceBubbleBreak'){drawBubbleBreak26(this,e);}
   else if(e.type==='lock'){for(const t of e.targets||[])f.lineStyle(2,0x93eeff,alpha).strokeCircle(t.x,t.y,24);}
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
   else if(e.type==='magmaSplash'||e.type==='magmaCoalBurst'||e.type==='magmaBombBurst'){for(let i=0;i<10;i++){const a=i*Math.PI/5,r=10+e.age*(115+i%3*25);f.fillStyle(i%2?0xffa347:0xffe294,alpha).fillCircle(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.65,Math.max(2,8-e.age*6));}f.lineStyle(6,0xffce73,alpha).strokeEllipse(e.x,e.y,30+e.age*180,20+e.age*95);}
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
   else if(e.type==='bellHit'||e.type==='bellChange'||e.type==='crystalCollect'){const c=e.color||0x9aeaff;f.lineStyle(e.type==='bellChange'?5:2,c,alpha).strokeCircle(e.x,e.y,12+e.age*100);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.star(f,e.x+Math.cos(a)*e.age*110,e.y+Math.sin(a)*e.age*90,Math.max(1,7-e.age*8),c,alpha);}}
   else if(['ancientFire','ancientBlast','ancientWave','gravityBurst'].includes(e.type)){drawAncientFx29(this,e);}
   else if(e.type==='ancientArmor'){const radius=e.radius||55,rr=radius*Math.min(1,e.age/.45);f.lineStyle(e.type==='ancientWave'?5:8,e.type==='ancientArmor'?0xbde8ad:0xffd798,alpha*.75).strokeEllipse(e.x,e.y,rr*2,rr*1.4);for(let n=0;n<8;n++){const a=n*Math.PI/4;f.lineStyle(3,0xffefc8,alpha).lineBetween(e.x+Math.cos(a)*rr*.7,e.y+Math.sin(a)*rr*.5,e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr*.7);}}
   else if(['falconPierce','falconShot','falconFocus'].includes(e.type)){drawFalconFx28(this,e);}
   else if(e.type==='wetlandSpore'){this.pickupArt('star127_mushroom',e.x,e.y,118).setFrame(e.age<.32?6:7).setDisplaySize(118,118/1.27).setAlpha(alpha);}
   else if(e.type==='owlBlock'||e.type==='owlOrbit'){for(let i=0;i<6;i++){const a=i*Math.PI/3;f.lineStyle(3,e.type==='owlBlock'?0xc7ffe0:0xe8caff,alpha).lineBetween(e.x+Math.cos(a)*e.age*80,e.y+Math.sin(a)*e.age*80,e.x+Math.cos(a)*(e.age*80+10),e.y+Math.sin(a)*(e.age*80+10));}}
   else if(e.type==='swiftEcho'||e.type==='shieldBreak'){const radius=(e.radius||80)*Math.min(1,e.age*4);f.lineStyle(e.type==='shieldBreak'?5:3,e.type==='shieldBreak'?0xb9ffdc:0xa9dcff,alpha).strokeCircle(e.x,e.y,radius);f.lineStyle(2,0xffffff,alpha*.65).strokeCircle(e.x,e.y,radius*.7);}
   else if(e.type==='gravityBurst'){f.lineStyle(4,0xdcc5f1,alpha).strokeCircle(e.x,e.y,e.radius*Math.min(1,e.age*4));f.lineStyle(2,0xffeed1,alpha*.7).strokeCircle(e.x,e.y,e.radius*Math.min(1,e.age*3));}
   else if(e.type==='breeze')f.lineStyle(5,0xb8f6ef,alpha).strokeCircle(e.x,e.y,20+e.age*180);
   else if(e.type==='bomb'){if(!this.reducedFX)f.fillStyle(0xfff8c9,alpha*.16).fillRect(0,0,1280,H);f.lineStyle(9,0xffefbd,alpha).strokeCircle(e.x,e.y,40+e.age*1600);}
   else if(e.type==='pop'||e.type==='elite'){f.fillStyle(0xffffff,alpha*.8).fillEllipse(e.x,e.y-e.age*35,24+e.age*80,17+e.age*35).fillCircle(e.x-14,e.y-9-e.age*35,10+e.age*12);}
   else if(e.type==='graze')f.lineStyle(2,0xa7fff0,alpha).strokeCircle(e.x,e.y,12+e.age*30);
   else if(e.type!=='warning'&&e.type!=='boss'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;this.star(f,e.x+Math.cos(a)*e.age*100,e.y+Math.sin(a)*e.age*80,Math.max(1,7-e.age*8),e.type==='hurt'?0xff9fb7:0xffebaf,alpha);}}
  }
  const weapon=STAR_WEAPONS.find(w=>w.id===s.weapon);this.hp.setText('生命 '+p.hp+'/'+p.maxHp);this.meta.setText(s.craft.name+' 全攻擊 +'+Math.round((s.attackMultiplier()-1)*100)+'%');
  const stageName=s.boss?s.boss.name:s.inTransit?'星風亂流 → '+s.route[Math.min(s.segment+1,s.route.length-1)].name:s.currentMap?.name||'';this.scoreLabel.setText('分數 '+s.score.toLocaleString()+'  擦彈 '+s.stats.graze);this.stageLabel.setText(stageName+'　｜　按住射擊・滿能量向上滑放大招・U 戰術特攻・G 調校');this.gmButton?.label?.setText(s.gmUsed?'GM＊':'GM 調校');
  for(let i=this.magicIndex;i<this.magicPool.length;i++)this.magicPool[i].setVisible(false);
  this.noticeText.setOrigin(0).setPosition(24,90).setFontSize(17).setWordWrapWidth(365).setText(s.noticeLife>0?s.notice:'');this.branchHint.setVisible(!!offer).setText(offer?(offer.selected?'已選擇 · 區域交接中':'飛入通道或直接點路牌'):'');this.branchTop.setVisible(!!offer).setText(offer?'上　'+offer.top.name:'');this.branchBottom.setVisible(!!offer).setText(offer?'下　'+offer.bottom.name:'');this.drawControls();
 }
 bellSkillIcon(g,id,index,x,y,color,active){
  const alpha=active?1:.5,ink=0xfff3d2;g.lineStyle(2,color,alpha);
  const feather=(dx,dy,angle=0)=>{g.fillStyle(color,alpha).fillEllipse(x+dx,y+dy,12,30);g.lineStyle(2,ink,alpha*.8).lineBetween(x+dx,y+dy-10,x+dx,y+dy+10);g.lineStyle(1,ink,alpha*.6).lineBetween(x+dx-4,y+dy-4,x+dx,y+dy);};
  const shield=(dx=0)=>{g.fillStyle(color,alpha*.6).fillPoints([{x:x+dx,y:y-17},{x:x+dx+14,y:y-10},{x:x+dx+10,y:y+8},{x:x+dx,y:y+17},{x:x+dx-10,y:y+8},{x:x+dx-14,y:y-10}],true);g.lineStyle(2,ink,alpha).lineBetween(x+dx,y-10,x+dx,y+8);};
  const beam=dy=>{g.fillStyle(color,alpha).fillRoundedRect(x-22,y+dy-4,43,8,4);g.fillStyle(ink,alpha).fillRoundedRect(x-14,y+dy-1,31,2,1);};
  const missile=dx=>{g.fillStyle(color,alpha).fillTriangle(x+dx,y-17,x+dx-7,y+7,x+dx+7,y+7);g.lineStyle(2,ink,alpha).lineBetween(x+dx,y+9,x+dx-5,y+18);};
  if(index===0){if(id==='swift'||id==='owl'){feather(-13,2);feather(13,2);if(id==='owl')feather(0,-7);}else if(id==='ancient'){g.fillStyle(color,alpha).fillCircle(x,y,14);g.lineStyle(3,ink,alpha).lineBetween(x-20,y+13,x-10,y+7);}else{beam(id==='starwing'?-8:0);if(id==='starwing')beam(8);}}
  if(index===1){if(id==='owl'){for(const [dx,dy]of [[-16,0],[16,0],[0,-10]])feather(dx,dy);}else if(id==='starwing'){missile(-14);missile(14);g.fillStyle(ink,alpha).fillCircle(x,y,4);}else if(id==='falcon'){g.lineStyle(4,color,alpha).beginPath().moveTo(x-17,y-16).lineTo(x+2,y).lineTo(x-17,y+16).strokePath().beginPath().moveTo(x+1,y-16).lineTo(x+20,y).lineTo(x+1,y+16).strokePath();}else{shield(id==='ancient'?-7:0);if(id==='ancient')shield(7);}}
  if(index===2){if(id==='swift'){for(const rad of [8,15,23])g.lineStyle(2,color,alpha).beginPath().arc(x,y,rad,-.9,.9).strokePath();g.fillStyle(ink,alpha).fillCircle(x-6,y,5);}else if(id==='ancient'){g.lineStyle(3,color,alpha).strokeEllipse(x,y,45,20).strokeEllipse(x,y,20,39);g.fillStyle(ink,alpha).fillCircle(x,y,7);}else if(id==='owl'){feather(0,0);g.lineStyle(2,ink,alpha).strokeCircle(x,y,20);}else{missile(-10);missile(10);}}
  if(index===3){if(id==='swift'){feather(-8,0);g.lineStyle(3,color,alpha).lineBetween(x+3,y-10,x+24,y-10).lineBetween(x+3,y,x+20,y).lineBetween(x+3,y+10,x+25,y+10);}else if(id==='ancient'){g.fillStyle(color,alpha).fillTriangle(x,y-22,x-18,y+13,x+17,y+13);g.fillStyle(ink,alpha).fillTriangle(x,y-7,x-7,y+13,x+7,y+13);}else{beam(-8);beam(8);g.fillStyle(ink,alpha).fillTriangle(x+2,y-22,x-6,y+1,x+6,y-2);}}
 }
 drawSwiftCards(){const s=this.session,colors=[0xd56b62,0xc96358,0xb95750,0xa94b48];
  if(!this.skillCards){this.skillCards=['blue','green','purple','coral'].map((key,i)=>this.add.image(416+i*104,613,(s.craft.id==='starwing'?'starwing120_':s.craft.id==='ancient'?'ancient119_':s.craft.id==='falcon'?'falcon118_':s.craft.id==='owl'?'owl117_':'star115_')+key).setDisplaySize(92,92).setDepth(10));this.skillMeters=this.add.graphics().setDepth(11);}
  const g=this.skillMeters.clear();this.skillCards.forEach((card,i)=>{const x=416+i*104,y=613,level=s.skillLevels[i],remaining=this.bellFeedback?.index===i?Math.max(0,this.bellFeedback.until-s.time):0,pulse=remaining>0?Math.sin(Math.PI*(1-remaining/.65)):0;
   card.setVisible(true).setDisplaySize(92*(1+.12*pulse),92*(1+.12*pulse));if(level)card.clearTint();else card.setTint(0x777777);
   if(pulse>0)g.lineStyle(3,colors[i],pulse).strokeRoundedRect(x-48-pulse*4,y-48-pulse*4,96+pulse*8,96+pulse*8,8);
   for(let n=0;n<3;n++)g.fillStyle(n<level?0xffefbd:0x6f6250).fillCircle(x-12+n*12,y+32,3.5);
  });
  const status=[{x:842,color:0xf8f2dc,value:s.whiteStacks},{x:884,color:0xb98cff,value:s.purpleStacks}];for(const item of status){g.fillStyle(0x193e4e,.84).fillRoundedRect(item.x-19,588,38,48,8).lineStyle(2,item.color,.9).strokeRoundedRect(item.x-19,588,38,48,8);for(let n=0;n<5;n++)g.fillStyle(n<item.value?item.color:0x5d584d,n<item.value?1:.7).fillCircle(item.x-12+n*6,626,2.4);g.fillStyle(item.color,.9).fillCircle(item.x,606,8);}
 }
 drawBellBar(g){if(['swift','owl','falcon','ancient','starwing'].includes(this.session.craft.id)){this.drawSwiftCards();return;}if(this.skillCards)this.skillCards.forEach(c=>c.setVisible(false));this.skillMeters?.clear();const s=this.session,colors=[0x73cfff,0x82e6a4,0xc49cff,0xff8c7d],levels=[s.bellLevels.upgrade/3,s.craft.id==='owl'?s.guardFeathers/5:s.craft.id==='starwing'?s.options/2:s.craft.id==='falcon'?s.bellLevels.shield/3:s.player.shield/(s.craft.id==='ancient'?2:1),s.bellLevels.special/3,(s.player.powerBoost||0)/10];
  g.fillStyle(0x193e4e,.76).fillRoundedRect(364,584,420,74,15).lineStyle(2,0xe9c880,.8).strokeRoundedRect(364,584,420,74,15);
  colors.forEach((color,i)=>{const x=416+i*104,y=618,active=s.bellLevels[['upgrade','shield','special','power'][i]]>0;g.fillStyle(color,active?.25:.06).fillRoundedRect(x-42,y-27,84,55,8).lineStyle(2,color,active?1:.35).strokeRoundedRect(x-42,y-27,84,55,8);g.lineStyle(3,color,active?1:.45);
   if(this.bellFeedback?.index===i&&this.bellFeedback.until>s.time)g.lineStyle(3,0xffffff,.8).strokeRoundedRect(x-45,y-30,90,61,9);
   this.bellSkillIcon(g,s.craft.id,i,x,y,color,active);
   if(i<3){const lv=s.bellLevels[['upgrade','shield','special'][i]];for(let n=0;n<3;n++)g.fillStyle(color,n<lv?1:.15).fillCircle(x-12+n*12,y+30,3);}
   if(i===1){g.fillStyle(levels[i]>0?color:0x193e4e).fillCircle(x+29,y-15,6).lineStyle(1,color,.8).strokeCircle(x+29,y-15,6);}
   if(i===3)g.fillStyle(color,.9).fillRoundedRect(x-28,y+25,56*Math.max(0,levels[i]),4,2);
  });}
 drawControls(){const s=this.session,g=this.control,j=this.touch.owner===null?STAR_CONTROLS.joystick:this.touch.origin;g.clear();this.drawBellBar(g);
  for(const label of [this.fireLabel,this.dashLabel,this.bombLabel,this.traitLabel,this.evadeLabel])label?.setVisible(false);
  g.fillStyle(0x1c4654,.28).fillCircle(j.x,j.y,57).lineStyle(2,0xd3f2df,.55).strokeCircle(j.x,j.y,57).fillStyle(0xd1eddd,.55).fillCircle(j.x+this.touch.axis.x*36,j.y+this.touch.axis.y*36,23);
  for(const key of ['trait','dash']){const c=STAR_CONTROLS[key],recharge=s.craft.id==='falcon'?40:60,progress=key==='trait'?s.ultimateEnergy/100:s.tacticalStock>0?1:s.tacticalRecharge/recharge;
   g.fillStyle(key==='trait'?0xce4753:s.tacticalStock>0?0x287f78:0x45565b,.9).fillCircle(c.x,c.y,c.r).lineStyle(2,0xccece1,.9).strokeCircle(c.x,c.y,c.r);
   this.weaponIcon(g,key==='trait'?'chargeLaser':'dash',c.x,c.y,.8);
   if(key==='trait'&&this.touch.firing.size)g.lineStyle(4,0xffffff,.9).strokeCircle(c.x,c.y,c.r-10);
   g.lineStyle(5,key==='trait'&&s.ultimateEnergy>=100?0xffffff:0xffdf91,.94).beginPath().arc(c.x,c.y,c.r-4,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,progress),false).strokePath();
   if(key==='dash')for(let n=0;n<3;n++)g.fillStyle(n<s.tacticalStock?0xe7ffd7:0x34484d,.95).fillCircle(c.x-12+n*12,c.y+c.r+8,3.5);
  }
  if(this.touch.traitHold){const c=STAR_CONTROLS.trait,progress=Math.min(1,(performance.now()-this.touch.traitHold.at)/1000);g.lineStyle(6,0xffffff,.94).beginPath().arc(c.x,c.y,c.r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*progress,false).strokePath();}
 }

 showMessage(title,body,fn,label='繼續飛行'){this.overlay?.destroy();const o=this.add.container(0,0).setDepth(100);this.overlay=o;
  o.add([this.add.rectangle(640,360,1280,720,0x102e3b,.78).setInteractive(),this.panel(640,350,960,570,0x193f4c,0xc8bc8d,28),this.text(640,133,title,38),this.text(640,296,body,25)]);
  o.add(this.b(640,534,390,72,label,fn,0x9c743c));return o;}
 pauseGame(help=false){if(this.mode!=='playing')return;this.closeWeaponBay();this.mode='paused';this.session.setPaused(true);this.clearInput();this.stopTones();this.ultimateOverlay?.setVisible(false);
  const o=this.showMessage(help?'飛行員小抄':'暫停飛行',help?'搖桿／WASD 移動\n紅鍵／I／空白鍵：按住連射，放開停止\n大招能量滿：在紅鍵上向上滑（鍵盤 K）\n4號／U：專屬戰術特攻，綠鈴補充，最多 3 次\n紅鈴：拾取當下自動選定輪播中的技能\n鈴鐺每 3 次命中換色；虹鈴出現後鎖色\nH：按住顯示身體判定　G：GM調校':'航程與所有道具已停止，準備好再繼續。\n失敗可以從附近安全航點重新出發。',()=>this.resumeGame());
  o.add(this.b(640,619,390,52,'返回遊戲列表',()=>this.leave(),0x315c65));}
 resumeGame(){if(this.mode!=='paused'||this.portrait())return;this.clearInput();this.overlay?.destroy();this.overlay=null;this.session.setPaused(false);this.mode='playing';}
 finish(){this.closeWeaponBay();this.mode='finished';this.clearInput();this.tone('finish');const s=this.session,won=s.status==='won';
  const o=this.showMessage(won?'星光航線挑戰成功！':'先回補給站休息一下','分數 '+s.score.toLocaleString()+' · 擦彈 '+s.stats.graze+' 次\n淨化 '+s.stats.cleared+' 位對手 · 星芽鈴 '+s.stats.weaponChoices+' 次\n'+(won?(s.boss?.name||'區域首領')+'化成滿天星光！':'從附近安全航點重試，保留當時武器。'),()=>this.start(won?null:s.checkpoint),won?'再飛一次':'安全航點重試');
  if(won&&s.craft.id==='starwing'){const bird=this.craft(210,365,190,o);let frame=4;setStarwingPose30(bird,['arrival',frame,'victory']);this.time.addEvent({delay:200,repeat:2,callback:()=>{if(bird.active)setStarwingPose30(bird,['arrival',++frame,'victory']);}});}
  if(won&&s.craft.id==='ancient'){const bird=this.craft(210,365,190,o);let frame=4;setAncientPose29(bird,['arrival',frame,'victory']);this.time.addEvent({delay:220,repeat:2,callback:()=>{if(bird.active)setAncientPose29(bird,['arrival',++frame,'victory']);}});}
  if(won&&s.craft.id==='falcon'){const bird=this.craft(210,365,190,o);let frame=4;setFalconPose28(bird,['falcon-arrival',frame,'victory']);this.time.addEvent({delay:180,repeat:2,callback:()=>{if(bird.active)setFalconPose28(bird,['falcon-arrival',++frame,'victory']);}});}
  if(won&&s.craft.id==='owl'){const bird=this.craft(210,365,190,o);let frame=4;setOwlPose27(bird,['owl-arrival',frame,'victory']);this.time.addEvent({delay:180,repeat:2,callback:()=>{if(bird.active)setOwlPose27(bird,['owl-arrival',++frame,'victory']);}});}
  o.add(this.b(640,620,390,52,'返回遊戲列表',()=>this.leave()));}
 leave(){this.stopStarflightMusic();this.stopTones();this.clearInput();if(this.scene.manager.keys[this.returnScene]||this.scene.manager.keys.MiniGameHub)this.scene.start(this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub');else this.showTitle();}
}
