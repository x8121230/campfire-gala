import ForestChestRoom from './ForestChestRoom.js';
import {openChestHere,chestService} from '../systems/ForestChestService.js';
import {CHEST_STATE_KEY,chestTypeFor} from '../data/ChestConfig.js';
import {ITEM_DB} from '../data/GameData.js';
import {fitImage} from '../data/PaperDollConfig.js';
import {OUTFIT_LAYERS} from '../data/PaperDollLayers.js';
import {ICON_KEYS} from '../data/WardrobeHeadData.js';
import Upgrade from '../systems/EquipmentUpgradeSystem.js';
import {createChestArt,preloadChestArt} from './ChestArt.js';

export default class InstantChestOpen extends ForestChestRoom {
 constructor(){super('InstantChestOpen');}
 init(data={}){this.hostKey=data.hostKey;this.chestId=data.chestId;this.chestGame=data.game;this.chestType=data.chestType;this.soundOn=data.soundOn!==false;this.resumed=false;}
 preload(){super.preload();preloadChestArt(this);}
 create(){
  this.scene.bringToTop();this.audioNodes=new Set();this.busy=false;this.modal=null;
  this.events.once('shutdown',()=>{this.stopTones();this.resumeHost();});
  try{
   const result=openChestHere(this.registry,this.chestId);
   if(result.status!=='opened'){this.error('這個 BOX 已經開啟，不會重複發放裝備。');return;}
   const type=chestTypeFor(result.chestType||this.chestType||this.chestGame),c=this.overlay(`${type.chest}正在打開！`,'看看這次會飛出什麼驚喜……');
   const box=createChestArt(this,640,375,type,285);c.add(box);
   this.tweens.add({targets:box,angle:5,duration:100,yoyo:true,repeat:3,onComplete:()=>{c.destroy();this.modal=null;this.reveal(result);}});
  }catch(e){this.error(e.message);}
 }
 modalButton(c,x,y,label,fn,fill){return super.modalButton(c,x,y,'收下，繼續',()=>this.finish(),fill);}
 rewardArt(x,y,itemId){
  const item=ITEM_DB[itemId],keys=[ICON_KEYS[itemId],OUTFIT_LAYERS[itemId]?.outfitBody,item?.icon,item?.texture].filter(Boolean),key=keys.find(value=>this.textures.exists(value));
  if(key)return fitImage(this.add.image(x,y,key),285,300);
  return this.text(x,y,'🎁',118);
 }
 rewardSparkles(c,x,y,strong=false){
  const count=strong?30:22;
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count,r=105+(i%5)*24,star=this.text(x,y,i%3?'✦':'★',i%4?24:35,i%2?'#f1c75b':'#91c991').setAlpha(0);c.add(star);
   this.tweens.add({targets:star,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,alpha:1,duration:520,delay:i*15,ease:'Cubic.Out',onComplete:()=>this.tweens.add({targets:star,alpha:0,y:star.y-24,duration:700})});
  }
 }
 qualityText(result){
  if(!result.itemId)return '';
  const after=Upgrade.appearance(this.registry,result.itemId);
  if(result.isNew)return `NEW　${after.label}`;
  if(result.isUpgrade&&Number.isInteger(result.previousStep)){
   const actual=this.registry.get('equipment_upgrades')||{},beforeRegistry={get:key=>key==='equipment_upgrades'?{...actual,[result.itemId]:result.previousStep}:this.registry.get(key)};
   return `${Upgrade.appearance(beforeRegistry,result.itemId).label}　→　${after.label}`;
  }
  return `滿階收藏　✦ 水晶 +${result.crystals||1}`;
 }
 reveal(result){
  const consolation=result.rewardType==='consolation'||!result.itemId;
  const title=consolation?'星光水晶飛出來了！':result.isNew?'找到新的裝備！':result.isUpgrade?'同款閃耀，品質提升！':'滿階收藏化成星光！';
  const body=consolation?`星光水晶 +${result.crystals}`:ITEM_DB[result.itemId]?.name||'神秘裝備';
  const c=this.overlay(title,body),type=chestTypeFor(result.chestType||result.game),halo=this.add.graphics();
  halo.fillStyle(type.accent,.20).fillCircle(640,350,165);halo.lineStyle(5,type.accent,.72).strokeCircle(640,350,142);c.add(halo);
  const art=consolation?this.text(640,360,'✦',165,'#f0c64f'):this.rewardArt(640,360,result.itemId);
  const finalScaleX=Number.isFinite(art.scaleX)?art.scaleX:1,finalScaleY=Number.isFinite(art.scaleY)?art.scaleY:1;
  art.setAlpha?.(0);art.setScale?.(finalScaleX*.15,finalScaleY*.15);c.add(art);
  this.tweens.add({targets:art,alpha:1,scaleX:finalScaleX,scaleY:finalScaleY,duration:780,ease:'Back.Out',onComplete:()=>this.rewardSparkles(c,640,350,!consolation&&!result.isNew)});
  this.tweens.add({targets:halo,alpha:.5,scaleX:1.08,scaleY:1.08,duration:900,yoyo:true,repeat:-1,ease:'Sine.InOut'});this.tone('finish');
  const badgeText=consolation?'下次仍有機會遇見主題收藏':this.qualityText(result),badge=this.text(640,526,badgeText,25,consolation?'#758273':'#a06c20');c.add(badge);
  if(!consolation&&!result.isNew)this.tweens.add({targets:badge,scaleX:1.1,scaleY:1.1,duration:360,yoyo:true,repeat:2,ease:'Back.Out'});
  this.modalButton(c,640,632,'收下，繼續',()=>this.finish());
 }
 error(message){const c=this.overlay('森林小提醒',message);super.modalButton(c,640,590,'繼續冒險',()=>this.finish());}
 resumeHost(){if(this.resumed)return;this.resumed=true;if(this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);}
 finish(){
  const next=chestService.load()[CHEST_STATE_KEY]?.queue?.find(entry=>entry.test);
  if(next){this.resumed=true;this.scene.start('ChestRewardCelebration',{hostKey:this.hostKey,reward:{...next,status:'chest',reason:'test'},soundOn:this.soundOn});return;}
  this.resumeHost();this.scene.stop();
 }
 update(){}
}
