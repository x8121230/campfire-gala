import ForestChestRoom from './ForestChestRoom.js';
import {openChestHere} from '../systems/ForestChestService.js';
import {CHEST_GAMES} from '../data/ChestConfig.js';
export default class InstantChestOpen extends ForestChestRoom {
 constructor(){super('InstantChestOpen');}
 init(data={}){this.hostKey=data.hostKey;this.chestId=data.chestId;this.chestGame=data.game;this.soundOn=data.soundOn!==false;this.resumed=false;}
 create(){
  this.scene.bringToTop();this.audioNodes=new Set();this.busy=false;this.modal=null;
  this.events.once('shutdown',()=>{this.stopTones();this.resumeHost();});
  try{
   const result=openChestHere(this.registry,this.chestId);
   if(result.status!=='opened'){this.error(result.status==='no_hearts'?'愛心不足，寶箱仍留在架上。':'這個寶箱已開啟，沒有重複扣愛心。');return;}
   const c=this.overlay('森林寶箱正在打開！','獎勵已保存，準備迎接驚喜……');
   const box=this.chest(640,375,Math.max(0,CHEST_GAMES.findIndex(g=>g.id===this.chestGame)),300);c.add(box);
   this.tweens.add({targets:box,angle:5,duration:100,yoyo:true,repeat:3,onComplete:()=>{c.destroy();this.modal=null;this.reveal(result);}});
  }catch(e){this.error(e.message);}
 }
 modalButton(c,x,y,label,fn,fill){return super.modalButton(c,x,y,'收下，繼續',()=>this.finish(),fill);}
 error(message){const c=this.overlay('森林小提醒',message);super.modalButton(c,640,590,'繼續冒險',()=>this.finish());}
 resumeHost(){if(this.resumed)return;this.resumed=true;if(this.hostKey&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);}
 finish(){this.resumeHost();this.scene.stop();}
 update(){}
}
