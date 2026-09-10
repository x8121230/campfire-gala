import ForestChestRoom from './ForestChestRoom.js';
import {preferences,applySoundPreferences} from '../systems/AdventurePreferences.js';
import SaveSystem from '../systems/SaveSystem.js';
export default class AdventureSettings extends ForestChestRoom {
 constructor(){super('AdventureSettings');}
 init(data={}){this.hostKey=data.hostKey||'WorldMap';this.mapID=data.mapID||'01';this.leaving=false;}
 preload(){}
 create(){this.scene.bringToTop();this.busy=false;this.modal=null;this.audioNodes=new Set();
  this.events.once('shutdown',()=>{if(!this.leaving&&this.scene.isPaused(this.hostKey))this.scene.resume(this.hostKey);});this.draw();}
 draw(){this.children.removeAll(true);this.add.rectangle(640,360,1280,720,0x193b30,.97).setInteractive();
  this.add.graphics().lineStyle(3,0xd5ba77).strokeRoundedRect(45,25,1190,670,30);
  this.text(640,80,'設定與冒險選單',40,'#fff2cc');this.notice=this.text(640,146,'設定會記住，下次開啟也沿用',26,'#dce8cc');
  [['voice','語音'],['music','音樂'],['sfx','音效']].forEach(([key,label],i)=>this.button(225+i*415,266,370,100,`${label}：${preferences.value[key]?'開':'關'}`,()=>{
   try{preferences.set(key,!preferences.value[key]);applySoundPreferences(this.sound);if(!preferences.value.voice)globalThis.speechSynthesis?.cancel();
    this.registry.set('wardrobe_audio',{music:preferences.value.music,sfx:preferences.value.sfx});this.draw();
   }catch(e){this.notice.setText('設定未保存：請確認裝置儲存空間');}
  },preferences.value[key]?0x607f54:0x686b61));
  this.text(640,360,'語音控制既有朗讀；沒有旁白的內容不會新增語音。',25,'#dce8cc');
  this.button(398,458,440,100,'森林冒險手冊',()=>this.navigate('EquipmentJournal'),0x98763b);
  this.button(884,458,440,100,'我的寶箱',()=>this.navigate('ForestChestRoom'),0x98763b);
  if(this.hostKey==='WorldMap'){
   const host=this.scene.get(this.hostKey);
   this.button(225,619,360,96,host.isEditMode?'完成地圖佈置':'佈置地圖',()=>{host.toggleEditMode();this.scene.stop();},0x607f54);
   this.button(640,619,360,96,'世界地圖',()=>this.navigate('RegionAtlas'),0x98763b);
   this.button(1055,619,360,96,'返回遊戲',()=>this.scene.stop());
  }else{
   this.button(398,619,440,96,'世界地圖',()=>this.navigate('RegionAtlas'),0x98763b);
   this.button(884,619,440,96,'返回遊戲',()=>this.scene.stop());
  }
 }
 navigate(target){if(this.leaving)return;SaveSystem.saveFromRegistry(this.registry);this.leaving=true;this.scene.stop(this.hostKey);this.scene.start(target,{returnScene:this.hostKey,returnData:{mapID:this.mapID}});}
 update(){}
}
