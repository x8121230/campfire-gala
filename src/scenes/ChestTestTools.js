import ForestChestRoom from './ForestChestRoom.js';
import {CHEST_TYPES} from '../data/ChestConfig.js';
import {chestService} from '../systems/ForestChestService.js';
import SaveSystem from '../systems/SaveSystem.js';
export default class ChestTestTools extends ForestChestRoom {
 constructor(){super('ChestTestTools');}
 init(data={}){this.hostKey=data.hostKey;this.transferred=false;}
 create(){
  this.scene.bringToTop();this.modal=null;this.busy=false;this.audioNodes=new Set();
  this.events.once('shutdown',()=>{this.stopTones();if(!this.transferred&&this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);});
  this.add.rectangle(640,360,1280,720,0xe8ddc3).setInteractive();
  this.text(640,72,'BOX 測試工具',40);
  this.text(640,124,'9 大區域＋全域木雕箱 · 不占用首勝，不改變掉落保底',24);
  this.statusText=this.text(640,160,'30% 主題收藏／20% 共用收藏／50% 水晶 ×1',23);
  const choices=[...CHEST_TYPES.map(type=>({name:type.chest,sub:type.regionName,run:()=>this.grant([type.id])})),
   {name:'隨機獲得 1 箱',sub:'全部種類',run:()=>this.grant([CHEST_TYPES[Math.floor(Math.random()*CHEST_TYPES.length)].id])},
   {name:'寶箱預覽／機率',sub:'查看內容',run:()=>this.showRates()}];
  choices.forEach((choice,i)=>{
   const x=178+(i%4)*308,y=220+Math.floor(i/4)*104;
   this.button(x,y,282,76,choice.name,choice.run);this.text(x,y+27,choice.sub,16,'#dfe9df');
  });
  this.button(640,650,390,66,'返回衣櫃',()=>this.scene.stop());
 }
 showRates(){
  const c=this.overlay('10 款寶箱預覽','每箱固定機率：30% 該箱主題收藏／20% 全域共用收藏／50% 星光水晶 ×1');
  c.add(this.text(640,365,'苔蘚・花蜜・冰晶・熔光・珍珠\n月光・化石・王冠・雲晶・木雕',31,'#47664f').setLineSpacing(18));
  this.modalButton(c,640,602,'看完了',()=>{c.destroy();this.modal=null;});
 }
 grant(ids){if(this.busy)return;this.busy=true;try{
  chestService.load();SaveSystem.saveFromRegistry(this.registry);const rewards=chestService.grantForTesting(ids);
  this.transferred=true;this.scene.start('ChestRewardCelebration',{hostKey:this.hostKey,reward:rewards[0]});
 }catch(e){this.busy=false;this.statusText.setText(e.message);}}
 update(){}
}
