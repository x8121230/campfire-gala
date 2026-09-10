import ForestChestRoom from './ForestChestRoom.js';
import {CHEST_GAMES} from '../data/ChestConfig.js';
import {chestService,syncChestWallet} from '../systems/ForestChestService.js';
import SaveSystem from '../systems/SaveSystem.js';
export default class ChestTestTools extends ForestChestRoom {
 constructor(){super('ChestTestTools');}
 init(data={}){this.hostKey=data.hostKey;this.transferred=false;}
 create(){
  this.scene.bringToTop();this.modal=null;this.busy=false;this.audioNodes=new Set();
  this.events.once('shutdown',()=>{this.stopTones();if(!this.transferred&&this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);});
  this.add.rectangle(640,360,1280,720,0xe8ddc3).setInteractive();
  this.text(640,72,'寶箱測試工具',40);
  this.text(640,137,'會加入目前存檔 · 不占用首勝，不改變掉落保底',27);
  this.statusText=this.text(640,189,'點選一種寶箱，立即體驗獲箱與當場開啟',26);
  const choices=[...CHEST_GAMES.map(g=>({name:g.chest,ids:()=>[g.id]})),{name:'隨機獲得 1 箱',ids:()=>[CHEST_GAMES[Math.floor(Math.random()*5)].id]}];
  choices.forEach((g,i)=>this.button(225+i%3*415,284+Math.floor(i/3)*116,370,90,g.name,()=>this.grant(g.ids())));
  this.button(398,521,440,90,'五種各獲得 1 箱',()=>this.grant(CHEST_GAMES.map(g=>g.id)),0xa47934);
  this.button(884,521,440,90,'補滿愛心',()=>{try{chestService.load();SaveSystem.saveFromRegistry(this.registry);chestService.refillForTesting();const d=syncChestWallet(this.registry);this.statusText.setText(`愛心已補滿：${d.hearts} / ${d.max_hearts}`);}catch(e){this.statusText.setText(e.message);}});
  this.button(640,642,440,88,'返回衣櫃',()=>this.scene.stop());
 }
 grant(ids){if(this.busy)return;this.busy=true;try{
  chestService.load();SaveSystem.saveFromRegistry(this.registry);const rewards=chestService.grantForTesting(ids);
  this.transferred=true;this.scene.start('ChestRewardCelebration',{hostKey:this.hostKey,reward:rewards[0]});
 }catch(e){this.busy=false;this.statusText.setText(e.message);}}
 update(){}
}
