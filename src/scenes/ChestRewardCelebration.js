import AnimalSnackGame from './AnimalSnackGame.js';
import {CHEST_GAMES} from '../data/ChestConfig.js';

// Presentation only: the chest is already committed before this scene launches.
// Pausing the host keeps its achievement/result timers and input underneath us.
export default class ChestRewardCelebration extends AnimalSnackGame {
 constructor(){super('ChestRewardCelebration');}
 init(data={}){this.hostKey=data.hostKey;this.reward=data.reward||{};this.soundOn=data.soundOn!==false;this.closing=false;this.resumed=false;}
 preload(){if(!this.textures.exists('forest_chests'))this.load.spritesheet('forest_chests','assets/forest-chests/chests.png',{frameWidth:512,frameHeight:512});}
 create(){
  this.scene.bringToTop();this.audioNodes=new Set();this.events.once('shutdown',()=>{this.stopTones();this.resumeHost();});
  const index=CHEST_GAMES.findIndex(g=>g.id===this.reward.game),game=CHEST_GAMES[index];
  this.add.rectangle(640,360,1280,720,0x102c24,.96).setInteractive();
  this.add.graphics().lineStyle(3,0xbfa662,.8).strokeRoundedRect(42,28,1196,664,32);
  this.text(640,85,'森林送來一份驚喜！',42,'#fff1ba');
  const reason=this.reward.reason==='test'?(this.reward.batchCount>1?'五種測試寶箱已保存，先看看這一箱':'測試工具送來的森林禮物'):this.reward.reason==='daily'?'今日首勝的森林禮物':this.reward.reason==='pity'?'努力冒險的保底禮物':'冒險途中發現的寶藏';
  this.text(640,139,reason,27,'#cdddba');
  this.glow=this.add.container(640,350).setScale(.2).setAlpha(0);
  const rings=this.add.graphics();
  for(let i=5;i>0;i--)rings.fillStyle(0xf5d878,.018*(6-i)).fillCircle(0,0,40+i*30);
  this.glow.add(rings);
  for(let i=0;i<12;i++){
   const ray=this.add.graphics().fillStyle(0xfce3a0,.10).fillTriangle(-9,-58,9,-58,0,-180).setAngle(i*30);
   this.glow.add(ray);
  }
  this.tweens.add({targets:this.glow,alpha:1,scaleX:1,scaleY:1,duration:650,ease:'Sine.Out'});
  this.tweens.add({targets:this.glow,angle:360,duration:24000,repeat:-1});
  this.chestArt=this.add.container(640,310).setScale(.08).setAlpha(0);
  if(this.textures.exists('forest_chests'))this.chestArt.add(this.add.image(0,0,'forest_chests',Math.max(0,index)).setDisplaySize(340,340));
  else{const art=this.add.graphics();art.fillStyle(0x9c6436).fillRoundedRect(-125,-83,250,166,24);art.lineStyle(9,0xe5bc59).strokeRoundedRect(-125,-83,250,166,24);art.fillStyle(0xe5bc59).fillRoundedRect(-20,-22,40,50,8);this.chestArt.add(art);}
  this.tweens.add({targets:this.chestArt,y:340,alpha:1,scaleX:1,scaleY:1,delay:220,duration:780,ease:'Bounce.Out',onComplete:()=>this.sparkle()});
  this.text(640,493,game?.chest||'森林寶箱',34,'#fff1ba');
  this.text(640,538,'★'.repeat(Math.max(1,Math.min(3,this.reward.stars||1))),32,'#f6cf68');
  this.text(640,581,'寶箱已保存，可立即開啟或先收起來',25,'#d6e5c6');
  this.collectButton=this.button(397,642,440,88,'先收起來',()=>this.collect(),0x527456);this.collectButton.label.setFontSize(30);
  this.openButton=this.button(883,642,440,88,'立即開啟 ♥ 1',()=>this.openNow(),0xa47934);this.openButton.label.setFontSize(30);
  this.text(1121,100,'寶箱架',24,'#f3dfa9');
  this.add.graphics().lineStyle(3,0xcaaa64).strokeRoundedRect(1061,119,120,78,14).lineBetween(1061,173,1181,173);
  this.time.delayedCall(400,()=>{if(!this.closing&&!this.sound.mute)this.tone('finish');});
 }
 sparkle(){
  if(this.closing)return;
  for(let i=0;i<18;i++){
   const angle=i*Math.PI*2/18,radius=155+(i%3)*23;
   const star=this.text(640,345,i%3===0?'✦':'✧',i%3===0?32:24,i%2?'#fff4bf':'#cfe7a8').setAlpha(0);
   this.tweens.add({targets:star,x:640+Math.cos(angle)*radius,y:345+Math.sin(angle)*radius,alpha:1,duration:430,delay:i*12,ease:'Cubic.Out',onComplete:()=>this.tweens.add({targets:star,alpha:0,y:star.y-35,duration:950,onComplete:()=>star.destroy()})});
  }
  this.tweens.add({targets:this.chestArt,y:330,duration:950,yoyo:true,repeat:-1,ease:'Sine.InOut'});
 }
 collect(){
  if(this.closing)return;this.closing=true;this.collectButton.disableInteractive();this.collectButton.label.setText('已收好！');
  this.tweens.killTweensOf(this.chestArt);
  this.tweens.add({targets:this.chestArt,x:1121,y:153,scaleX:.2,scaleY:.2,alpha:.4,duration:480,ease:'Cubic.In',onComplete:()=>{this.resumeHost();this.scene.stop();}});
 }
 openNow(){
  if(this.closing)return;
  if((this.registry.get('hearts')||0)<1){this.openButton.label.setText('愛心不足，先收好');return;}
  this.closing=true;this.resumed=true; // Transfer responsibility for resuming host.
  this.scene.start('InstantChestOpen',{hostKey:this.hostKey,chestId:this.reward.chestId,game:this.reward.game,soundOn:this.soundOn});
 }
 resumeHost(){if(this.resumed)return;this.resumed=true;if(this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);}
 // Deliberately no AnimalSnackGame gameplay or keyboard update handlers.
 update(){}
}
