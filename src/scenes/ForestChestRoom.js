import AnimalSnackGame from './AnimalSnackGame.js';
import {ITEM_DB} from '../data/GameData.js';
import {PAPER_DOLL_FILES} from '../data/PaperDollConfig.js';
import {CHEST_GAMES,CHEST_STATE_KEY} from '../data/ChestConfig.js';
import {chestService,syncChestInventory} from '../systems/ForestChestService.js';
import SaveSystem from '../systems/SaveSystem.js';
import Upgrade from '../systems/EquipmentUpgradeSystem.js';

export default class ForestChestRoom extends AnimalSnackGame {
 constructor(key='ForestChestRoom'){super(key);}
 init(data={}){this.roomReturn=data.returnScene||'MiniGameHub';this.roomReturnData=data.returnData||{};}
 preload(){if(!this.textures.exists('forest_chests'))this.load.spritesheet('forest_chests','assets/forest-chests/chests.png',{frameWidth:512,frameHeight:512});for(const [key,file]of Object.entries(PAPER_DOLL_FILES))if(!this.textures.exists(key))this.load.image(key,file);}
 create(){this.sound.stopAll();this.soundOn=true;this.audioNodes=new Set();this.page=0;this.tab='boxes';this.busy=false;this.modal=null;this.events.once('shutdown',()=>this.stopTones());
  try{syncChestInventory(this.registry);SaveSystem.saveFromRegistry(this.registry);this.draw();}catch(e){this.error(e.message);}
 }
 button(x,y,w,h,label,fn,fill=0x537b5b){const b=super.button(x,y,w,h,label,()=>{if(!this.modal&&!this.busy)fn();},fill);b.label.setFontSize(28);return b;}
 chest(x,y,frame,size){if(this.textures.exists('forest_chests'))return this.add.image(x,y,'forest_chests',frame).setDisplaySize(size,size);return this.text(x,y,'寶箱',38);}
 item(x,y,id,size){const i=ITEM_DB[id],key=i?.icon||i?.texture;if(key&&this.textures.exists(key)){const a=this.add.image(x,y,key);a.setScale(size/Math.max(a.width,a.height));return a;}return this.text(x,y,i?.name||'裝備',30).setWordWrapWidth(size,true);}
 draw(){
  this.children.removeAll(true);this.modal=null;this.data=chestService.load();const state=this.data[CHEST_STATE_KEY];
  this.add.rectangle(640,360,1280,720,0xe8ddc3);this.add.rectangle(640,52,1280,104,0x365a42);
  this.button(112,52,200,88,['WorldMap','StarlightLake'].includes(this.roomReturn)?'← 返回地圖':this.roomReturn==='Start'?'← 首頁':'← 遊戲列表',()=>this.scene.start(this.roomReturn,this.roomReturnData));
  this.text(475,50,'森林寶箱小屋',38,'#fff3d4');this.wallet=this.text(959,50,`♥ ${this.registry.get('hearts')??this.data.hearts}　水晶 ${this.data.user_crystals||0}`,30,'#fff3d4');
  this.button(225,158,360,88,`寶箱架（${state.queue.length}）`,()=>{this.tab='boxes';this.page=0;this.draw();},this.tab==='boxes'?0x567e59:0x8b9375);
  this.button(640,158,360,88,'森林冒險手冊',()=>this.scene.start('EquipmentJournal',{returnScene:'ForestChestRoom',returnData:{returnScene:this.roomReturn,returnData:this.roomReturnData}}),0x8b9375);
  this.button(1055,158,360,88,'掉落說明',()=>this.help(),0x967547);
  const entries=this.tab==='boxes'?state.queue:Object.keys(ITEM_DB).filter(id=>[...(this.data.owned_items||[]),...(this.data.owned_collectibles||[])].includes(id));
  const pages=Math.max(1,Math.ceil(entries.length/6));this.page=Math.min(this.page,pages-1);
  entries.slice(this.page*6,this.page*6+6).forEach((entry,n)=>{const x=225+n%3*415,y=304+Math.floor(n/3)*185,c=this.add.container(x,y);c.add(this.panel(0,0,380,170,0xfff7e3,0xb89a66));
   if(this.tab==='boxes'){const g=CHEST_GAMES.findIndex(v=>v.id===entry.game);c.add([this.chest(-111,0,g,134),this.text(67,-37,CHEST_GAMES[g].chest,30),this.text(67,4,'★'.repeat(entry.stars),28,'#a97e2c'),this.text(67,43,'開啟：1 愛心',26)]);c.setSize(380,170).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal&&!this.busy)this.confirm(entry);});}
   else{const reg={get:k=>this.data[k]},q=Upgrade.appearance(reg,entry);c.add([this.item(-112,0,entry,135),this.text(67,-22,ITEM_DB[entry].name,28).setWordWrapWidth(200,true),this.text(67,39,q.label+(q.step?' ↑':''),26,'#9b743e')]);}
  });
  if(!entries.length)this.text(640,372,this.tab==='boxes'?'還沒有寶箱。完成五款基礎遊戲，迎接第一份驚喜！':'開啟寶箱，收集新的森林裝備。',30).setWordWrapWidth(1020,true);
  this.text(640,602,this.tab==='boxes'?'寶箱永久保留 · 每箱必有裝備 · 重複品依衣櫃規則升級或轉水晶':'取得的裝備已加入原本衣櫃，可回首頁進入衣櫃換裝。',26);
  this.button(236,662,360,88,'← 上一頁',()=>{this.page=Math.max(0,this.page-1);this.draw();});
  this.text(640,662,`${this.page+1} / ${pages}`,30);
  this.button(1044,662,360,88,'下一頁 →',()=>{this.page=Math.min(pages-1,this.page+1);this.draw();});
 }
 overlay(title,body){const c=this.add.container(0,0).setDepth(100);this.modal=c;c.add([this.add.rectangle(640,360,1280,720,0x163726,.92).setInteractive(),this.panel(640,360,1130,660,0xfff7e4,0xbe9d64),this.text(640,92,title,38),this.text(640,182,body,28).setWordWrapWidth(1010,true)]);return c;}
 modalButton(c,x,y,label,fn,fill=0x557b60){const b=super.button(x,y,390,96,label,()=>{if(!this.busy)fn();},fill);b.label.setFontSize(29);c.add(b);}
 confirm(entry){const c=this.overlay('打開這份森林驚喜？','消耗 1 顆愛心。新裝備會加入衣櫃；滿階重複品轉 1 水晶。');c.add(this.chest(640,380,CHEST_GAMES.findIndex(g=>g.id===entry.game),270));this.modalButton(c,410,599,'先收著',()=>{c.destroy();this.modal=null;});this.modalButton(c,870,599,'♥ 1　開寶箱',()=>this.open(entry.id),0xa88143);}
 open(id){
  if(this.busy)return;this.busy=true;
  try{SaveSystem.saveFromRegistry(this.registry);const result=chestService.open(id);
   if(result.status!=='opened'){this.busy=false;this.modal?.destroy();this.modal=null;this.error(result.status==='no_hearts'?'愛心不足，寶箱仍留在架上。稍後再來開！':'這個寶箱已開啟，請重新查看寶箱架。');return;}
   const d=syncChestInventory(this.registry);this.registry.set('hearts',d.hearts);this.registry.set('next_heart_time',d.next_heart_time);this.busy=false;this.draw();this.reveal(result);
  }catch(e){this.busy=false;this.modal?.destroy();this.modal=null;this.error(e.message);}
 }
 reveal(result){const c=this.overlay(result.isNew?'找到新的裝備！':result.isUpgrade?'同款合併，品質提升！':'滿階收藏，轉成水晶',ITEM_DB[result.itemId].name);c.add(this.chest(640,427,5,210));const art=this.item(640,299,result.itemId,200);c.add(art);this.tweens.add({targets:art,y:279,duration:650,yoyo:true,repeat:1});this.tone('finish');c.add(this.text(640,555,result.crystals?'水晶 +1，原裝備保留':'已存入裝備收藏與衣櫃',28));this.modalButton(c,640,635,'收下！',()=>{c.destroy();this.modal=null;});}
 help(){const c=this.overlay('五款遊戲，一起收集森林寶藏','草叢探險・形色棋・象棋暗棋・記憶翻牌・森林歷險');c.add(this.text(640,355,'地圖與測試樂園都可掉箱，共用首勝與保底\n每日每款首勝必掉箱；與今日金草領取無關\n重玩 1／2／3 星：20%／35%／50%\n連續 3 次勝利未掉箱，第 4 次勝利保證掉箱\n前三次開箱優先新裝備；棋類需擊敗 AI\n平手、失敗、中途離開不發箱（台灣時間換日）',28));this.modalButton(c,640,612,'開始收集吧',()=>{c.destroy();this.modal=null;});}
 error(message){const c=this.overlay('森林小提醒',message);this.modalButton(c,640,575,'返回遊戲列表',()=>this.scene.start('MiniGameHub'));}
 update(){if(this.wallet&&!this.wallet.destroyed)this.wallet.setText(`♥ ${this.registry.get('hearts')??this.data?.hearts??0}　水晶 ${this.data?.user_crystals||0}`);}
}
