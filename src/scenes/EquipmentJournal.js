import ForestChestRoom from './ForestChestRoom.js';
import {ITEM_DB} from '../data/GameData.js';
import {CHEST_GAMES} from '../data/ChestConfig.js';
import {COLLECTION_SETS,ownedEquipment,setProgress,sourceHint,refreshCollection,selectCollection} from '../data/CollectionGoals.js';
import {chestService} from '../systems/ForestChestService.js';
import {adventureAchievements} from '../data/AdventureAchievements.js';
import ConfigManager from '../systems/ConfigManager.js';

export default class EquipmentJournal extends ForestChestRoom {
 constructor(){super('EquipmentJournal');}
 init(data={}){this.journalReturn=data.returnScene||'ForestChestRoom';this.journalReturnData=data.returnData||{};}
 create(){
  this.audioNodes=new Set();this.soundOn=true;this.busy=false;this.modal=null;this.page=0;this.tab='items';this.filter='all';
  this.events.once('shutdown',()=>this.stopTones());
  try{const old=chestService.load(),updated=refreshCollection(old,ITEM_DB);if(JSON.stringify(old)!==JSON.stringify(updated.data))chestService.commit(updated.data);this.draw();if(updated.added.length)this.celebrate(updated.added);}catch(e){this.error(e.message);}
 }
 draw(){
  this.children.removeAll(true);this.modal=null;this.data=chestService.load();this.owned=ownedEquipment(this.data);
  this.add.rectangle(640,360,1280,720,0xf0e5cc);this.add.rectangle(640,51,1280,102,0x355840);
  this.button(135,51,240,88,['WorldMap','StarlightLake'].includes(this.journalReturn)?'← 返回地圖':this.journalReturn==='Start'?'← 首頁':this.journalReturn==='MiniGameHub'?'← 遊戲列表':'← 寶箱小屋',()=>this.scene.start(this.journalReturn,this.journalReturnData));
  this.text(650,51,'森林冒險手冊',38,'#fff1cb');
  const items=Object.values(ITEM_DB).filter(i=>i.category==='equipment');
  this.text(1095,51,`${items.filter(i=>this.owned.has(i.id)).length} / ${items.length}`,30,'#fff1cb');
  this.button(175,159,280,88,'裝備圖鑑',()=>{this.tab='items';this.page=0;this.draw();});
  this.button(485,159,280,88,'套裝收集',()=>{this.tab='sets';this.draw();});
  this.button(795,159,280,88,'成就手冊',()=>{this.tab='achievements';this.draw();});
  this.button(1105,159,280,88,'我的展示',()=>this.showcase());
  if(this.tab==='sets'){this.drawSets();return;}
  if(this.tab==='achievements'){this.drawAchievements();return;}
  const filtered=items.filter(i=>this.filter==='all'||!this.owned.has(i.id)),pages=Math.max(1,Math.ceil(filtered.length/6));this.page=Math.min(this.page,pages-1);
  filtered.slice(this.page*6,this.page*6+6).forEach((i,n)=>{
   const x=225+n%3*415,y=306+Math.floor(n/3)*177,c=this.add.container(x,y),owned=this.owned.has(i.id);
   c.add(this.panel(0,0,380,161,owned?0xfff9e9:0xd8d9c9,0xb8a374));const art=this.item(-117,0,i.id,120);if(!owned)art.setTint?.(0x263e35);c.add(art);
   c.add(this.text(61,-37,!owned&&i.source==='secret'?'神秘裝備':i.name,26).setWordWrapWidth(215,true));
   c.add(this.text(61,11,owned?'已收藏':'尚未取得',25,owned?'#456847':'#6b7469'));
   c.add(this.text(61,49,'點選查看來源',23));c.setSize(380,161).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.detail(i);});
  });
  if(!filtered.length)this.text(640,379,'全部收齊了！到套裝收集看看你的獎勵。',32);
  this.button(224,654,360,88,'← 上一頁',()=>{this.page=Math.max(0,this.page-1);this.draw();});
  this.button(640,654,360,88,this.filter==='all'?'只看未取得':'顯示全部',()=>{this.filter=this.filter==='all'?'missing':'all';this.page=0;this.draw();});
  this.button(1056,654,360,88,'下一頁 →',()=>{this.page=Math.min(pages-1,this.page+1);this.draw();});
  this.text(640,588,`第 ${this.page+1} / ${pages} 頁 · 剪影代表尚未取得`,24);
 }
 detail(i){
  const owned=this.owned.has(i.id),c=this.overlay(owned||i.source!=='secret'?i.name:'神秘裝備',owned?'已加入你的收藏':'尚未取得，繼續冒險來發現它！');
  const art=this.item(400,369,i.id,255);if(!owned)art.setTint?.(0x263e35);c.add(art);
  c.add(this.text(850,317,sourceHint(i,CHEST_GAMES),28).setWordWrapWidth(460,true));
  const set=COLLECTION_SETS.find(s=>s.items.includes(i.id));
  c.add(this.text(850,430,set?`${set.name}：${setProgress(this.data,set,ITEM_DB).count} / ${set.items.length}`:'獨立收藏裝備',26).setWordWrapWidth(450,true));
  this.modalButton(c,640,614,'繼續收集',()=>{c.destroy();this.modal=null;});
 }
 drawAchievements(){
  const rows=adventureAchievements(this.data,this.registry.get('game_config')||ConfigManager.getConfig());
  rows.forEach((a,n)=>{const x=225+n%3*415,y=311+Math.floor(n/3)*188,c=this.add.container(x,y);
   c.add(this.panel(0,0,380,174,a.done?0xfff3c9:0xe2e2d4,0xb7a274));
   c.add(this.text(0,-55,`${a.done?'★':'☆'} ${a.name}`,28));
   c.add(this.text(0,-9,a.description,24).setWordWrapWidth(340,true));
   c.add(this.text(0,43,a.done?'已達成':`進度 ${a.count} / ${a.total}`,26));
  });
  this.text(640,622,`草叢探險 ${rows.filter(a=>a.done).length} / 6 項 · 顯示正式存檔，不重複發獎`,26);
  this.text(640,667,'測試入口的通關統計仍會還原；成就請由地圖入口挑戰。',24);
 }
 drawSets(){
  COLLECTION_SETS.forEach((s,n)=>{const x=328+n%2*624,y=309+Math.floor(n/2)*196,p=setProgress(this.data,s,ITEM_DB),c=this.add.container(x,y);
   c.add(this.panel(0,0,590,180,0xfff9e9,0xb99a65));c.add(this.item(-213,0,s.items[2],148));
   c.add(this.text(62,-50,`${s.name}　${p.count} / ${p.total}`,30));
   c.add(this.text(62,-7,`稱號：${s.title}`,25));c.add(this.text(62,38,p.complete?'已解鎖 · 點選展示':'點選查看還缺哪些裝備',25));
   c.setSize(590,180).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.modal)return;if(p.complete)this.showcase(s.id);else this.setDetail(s);});
  });this.text(640,646,'集齊即可解鎖稱號與背景；這是收集目標，不必同時穿戴。',26);
 }
 setDetail(s){const c=this.overlay(s.name,`集齊 ${s.items.length} 件：解鎖「${s.title}」與「${s.background}」`);
  s.items.forEach((id,n)=>{const i=ITEM_DB[id],owned=this.owned.has(id),x=320+n*320,art=this.item(x,333,id,180);if(!owned)art.setTint?.(0x263e35);c.add(art);c.add(this.text(x,453,`${owned?'✓':'待收集'} ${i?.name||id}`,24).setWordWrapWidth(290,true));});
  this.modalButton(c,640,613,'回到套裝收集',()=>{c.destroy();this.modal=null;});
 }
 celebrate(ids){const c=this.overlay('套裝收集完成！','解鎖了新的稱號與展示背景');
  const names=ids.map(id=>COLLECTION_SETS.find(s=>s.id===id));c.add(this.text(640,341,names.map(s=>`${s.name} → ${s.title}`).join('\n'),32));
  for(let i=0;i<10;i++){const star=this.text(210+i*95,470+(i%2)*35,'✦',32,'#bc9437');c.add(star);this.tweens.add({targets:star,y:star.y-50,alpha:.2,duration:850,delay:i*55,yoyo:true,repeat:1});}
  this.tone('finish');this.modalButton(c,640,614,'看看我的展示',()=>{c.destroy();this.modal=null;this.showcase(ids[0]);});
 }
 showcase(id){
  const state=this.data.collection_goals_v1,selected=id||state?.selected||state?.unlocked[0],s=COLLECTION_SETS.find(s=>s.id===selected);
  if(!s){const c=this.overlay('你的森林展示台','先集齊任一套裝，就能解鎖稱號與展示背景。');this.modalButton(c,640,610,'去看看收集目標',()=>{c.destroy();this.modal=null;this.tab='sets';this.draw();});return;}
  const c=this.overlay(s.title,s.background),g=this.add.graphics();g.fillStyle(s.color).fillRoundedRect(170,225,940,310,26);c.add(g);
  for(let i=0;i<16;i++){const x=210+i*55,y=255+(i%4)*60;c.add(this.text(x,y,s.id==='stars'?'✦':s.id==='campfire'?'✧':'✦',18+(i%3)*4,'#e8d49a'));}
  const hills=this.add.graphics().fillStyle(0x172d32,.32);for(let i=0;i<7;i++)hills.fillCircle(205+i*145,535,100);c.add(hills);
  c.add(this.item(640,376,s.items[2],275));
  c.add(this.text(640,563,'展示使用套裝公仔，不改變目前穿戴或遊戲能力。',25));
  this.modalButton(c,640,629,state.selected===s.id?'展示中 · 返回':'設為我的展示',()=>{try{chestService.commit(selectCollection(chestService.load(),s.id));c.destroy();this.modal=null;this.draw();}catch(e){c.destroy();this.modal=null;this.error(e.message);}});
 }
 update(){}
}
