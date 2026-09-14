import AnimalSnackGame from './AnimalSnackGame.js';
import {chestTypeFor} from '../data/ChestConfig.js';
import {createChestArt,preloadChestArt} from './ChestArt.js';

// Presentation only: the BOX is already committed before this scene launches.
// It appears over the paused result screen and opens as soon as the player touches it.
export default class ChestRewardCelebration extends AnimalSnackGame {
 constructor(){super('ChestRewardCelebration');}
 init(data={}){this.hostKey=data.hostKey;this.reward=data.reward||{};this.soundOn=data.soundOn!==false;this.closing=false;this.resumed=false;}
 preload(){preloadChestArt(this);}
 create(){
  this.scene.bringToTop();this.audioNodes=new Set();this.events.once('shutdown',()=>{this.stopTones();this.resumeHost();});
  const type=chestTypeFor(this.reward.chestType||this.reward.game);
  this.add.rectangle(640,360,1280,720,0x102c24,.72).setInteractive();
  this.add.graphics().lineStyle(3,0xbfa662,.8).strokeRoundedRect(42,28,1196,664,32);
  this.text(640,85,'森林送來一份驚喜！',42,'#fff1ba');
  const reason=this.reward.reason==='test'?(this.reward.batchCount>1?'測試寶箱已保存，先看看這一箱':'測試工具送來的區域禮物'):this.reward.reason==='daily'?'今日首勝的區域禮物':this.reward.reason==='pity'?'努力冒險的保底禮物':'冒險途中發現的寶藏';
  this.text(640,139,reason,27,'#cdddba');
  this.glow=this.add.container(640,350).setScale(.2).setAlpha(0);
  const rings=this.add.graphics();
  for(let i=5;i>0;i--)rings.fillStyle(type.accent,.025*(6-i)).fillCircle(0,0,40+i*30);
  this.glow.add(rings);
  for(let i=0;i<12;i++){
   const ray=this.add.graphics().fillStyle(type.accent,.13).fillTriangle(-9,-58,9,-58,0,-180).setAngle(i*30);
   this.glow.add(ray);
  }
  this.tweens.add({targets:this.glow,alpha:1,scaleX:1,scaleY:1,duration:650,ease:'Sine.Out'});
  this.tweens.add({targets:this.glow,angle:360,duration:24000,repeat:-1});
  this.chestArt=this.add.container(640,335).setScale(.08).setAlpha(0);
  this.chestArt.add(createChestArt(this,0,0,type,365));
  this.chestArt.setSize(410,350).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openNow());
  this.chestArt.on('pointerover',()=>{if(!this.closing)this.tweens.add({targets:this.chestArt,scaleX:1.08,scaleY:1.08,duration:140,ease:'Sine.Out'});});
  this.chestArt.on('pointerout',()=>{if(!this.closing)this.tweens.add({targets:this.chestArt,scaleX:1,scaleY:1,duration:160,ease:'Sine.Out'});});
  this.tweens.add({targets:this.chestArt,y:370,alpha:1,scaleX:1,scaleY:1,delay:220,duration:780,ease:'Bounce.Out',onComplete:()=>this.sparkle()});
  this.text(640,576,type.chest,34,'#fff1ba');
  this.text(640,614,type.regionName,22,'#cdddba');
  this.time.delayedCall(400,()=>{if(!this.closing&&!this.sound.mute)this.tone('finish');});
 }
 sparkle(){
  if(this.closing)return;
  for(let i=0;i<18;i++){
   const angle=i*Math.PI*2/18,radius=155+(i%3)*23;
   const star=this.text(640,345,i%3===0?'✦':'✧',i%3===0?32:24,i%2?'#fff4bf':'#cfe7a8').setAlpha(0);
   this.tweens.add({targets:star,x:640+Math.cos(angle)*radius,y:345+Math.sin(angle)*radius,alpha:1,duration:430,delay:i*12,ease:'Cubic.Out',onComplete:()=>this.tweens.add({targets:star,alpha:0,y:star.y-35,duration:950,onComplete:()=>star.destroy()})});
  }
  this.tweens.add({targets:this.chestArt,y:354,duration:800,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  this.tweens.add({targets:this.chestArt,angle:2.5,duration:360,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  this.time.addEvent?.({delay:1150,loop:true,callback:()=>this.sparkle()});
 }
 openNow(){
  if(this.closing)return;
  this.closing=true;this.resumed=true; // Transfer responsibility for resuming host.
  this.chestArt.disableInteractive();
  this.scene.start('InstantChestOpen',{hostKey:this.hostKey,chestId:this.reward.chestId,game:this.reward.game,chestType:this.reward.chestType,soundOn:this.soundOn});
 }
 resumeHost(){if(this.resumed)return;this.resumed=true;if(this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);}
 // Deliberately no AnimalSnackGame gameplay or keyboard update handlers.
 update(){}
}
