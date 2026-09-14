import ForestChestRoom from './ForestChestRoom.js';
import { ITEM_DB } from '../data/GameData.js';
import { CHEST_GAMES } from '../data/ChestConfig.js';
import { COLLECTION_SETS, ownedEquipment, setProgress, sourceHint, refreshCollection, selectCollection } from '../data/CollectionGoals.js';
import { chestService } from '../systems/ForestChestService.js';
import { WORLD_REGIONS, REGION_SUBMAPS } from '../data/WorldRegionData.js';
import {
    HANDBOOK_TABS, EQUIPMENT_FILTERS, ECOLOGY_CATEGORIES, ECOLOGY_ENTRIES,
    WORLD_PUZZLES, SUBMAP_LANDMARKS, equipmentRarity, isEcologyUnlocked, puzzleProgress,
    growthMilestones, handbookSummary
} from '../data/AdventureHandbookData.js';

const INK = '#493e31', MUTED = '#786f61';
const EQUIPMENT_SUBTABS = [...EQUIPMENT_FILTERS, {id:'sets',label:'✨ 套裝目標'}];

export default class EquipmentJournal extends ForestChestRoom {
 constructor(){super('EquipmentJournal');}
 init(data={}){this.journalReturn=data.returnScene||'MiniGameHub';this.journalReturnData=data.returnData||{};this.requestedTab=data.tab||'equipment';}
 create(){
  this.audioNodes=new Set();this.soundOn=true;this.busy=false;this.modal=null;this.page=0;
  this.tab=HANDBOOK_TABS.some(v=>v.id===this.requestedTab)?this.requestedTab:'equipment';this.filter='all';
  this.events.once('shutdown',()=>this.stopTones());
  try{const old=chestService.load(),updated=refreshCollection(old,ITEM_DB);if(JSON.stringify(old)!==JSON.stringify(updated.data))chestService.commit(updated.data);this.draw();if(updated.added.length)this.celebrate(updated.added);}catch(e){this.error(e.message);}
 }
 equipmentItems(){return Object.values(ITEM_DB).filter(i=>i.category==='equipment');}
 region(id){return WORLD_REGIONS.find(v=>v.id===id);}
 backLabel(){if(['WorldMap','WorldAtlas','RegionGuide','StarlightLake'].includes(this.journalReturn))return '← 返回地圖';if(this.journalReturn==='Start')return '← 首頁';return '← 遊戲列表';}
 draw(){
  this.children.removeAll(true);this.modal=null;this.data=chestService.load();this.owned=ownedEquipment(this.data);
  const items=this.equipmentItems(),summary=handbookSummary(this.data,items);
  this.add.rectangle(640,360,1280,720,0xf2ead8);this.add.rectangle(640,49,1280,98,0x355840);this.add.rectangle(640,389,1218,558,0xfffbef).setStrokeStyle(4,0xd1b779);
  this.button(112,49,200,76,this.backLabel(),()=>this.scene.start(this.journalReturn,this.journalReturnData),0x52745b);
  this.text(640,31,'📖 冒險手冊',35,'#fff2c8');this.text(640,72,`49 款小遊戲・10 大區域・${summary.equipmentTotal} 件裝備資料`,17,'#dcefdc');
  this.drawTabs(summary);
  if(this.tab==='equipment')this.drawEquipment();if(this.tab==='ecology')this.drawEcology();if(this.tab==='puzzles')this.drawPuzzles();if(this.tab==='milestones')this.drawMilestones();if(this.tab==='regions')this.drawRegions();
 }
 drawTabs(s){
  const badges={equipment:`${s.equipment}/${s.equipmentTotal}`,ecology:`${s.ecology}/${s.ecologyTotal}`,puzzles:`${s.puzzles}/${s.puzzlesTotal}`,milestones:`${s.milestones}/${s.milestonesTotal}`,regions:'10'};
  HANDBOOK_TABS.forEach((tab,index)=>{const active=this.tab===tab.id,x=142+index*249,b=this.button(x,132,230,57,`${tab.icon} ${tab.label}  ${badges[tab.id]}`,()=>{this.tab=tab.id;this.filter='all';this.page=0;this.draw();},active?tab.color:0xe6ddc9,active?'#fff':INK);b.label.setFontSize(19);});
 }
 drawFilterBar(filters){
  const width=Math.min(205,Math.floor(1160/filters.length)-8),gap=8,total=filters.length*width+(filters.length-1)*gap;
  filters.forEach((row,index)=>{const x=640-total/2+width/2+index*(width+gap),active=this.filter===row.id,b=this.button(x,193,width,42,row.label,()=>{this.filter=row.id;this.page=0;this.draw();},active?0x668263:0xeee8da,active?'#fff':INK);b.label.setFontSize(filters.length>5?16:18);});
 }
 paginate(entries,perPage){const pages=Math.max(1,Math.ceil(entries.length/perPage));this.page=Math.max(0,Math.min(this.page,pages-1));return{pages,rows:entries.slice(this.page*perPage,this.page*perPage+perPage)};}
 footer(pages,hint){this.button(210,665,260,54,'← 上一頁',()=>{this.page=Math.max(0,this.page-1);this.draw();},this.page>0?0x668263:0xb9b5a8);this.text(640,654,`第 ${this.page+1} / ${pages} 頁`,23,INK);this.text(640,682,hint,16,MUTED);this.button(1070,665,260,54,'下一頁 →',()=>{this.page=Math.min(pages-1,this.page+1);this.draw();},this.page<pages-1?0x668263:0xb9b5a8);}
 drawEquipment(){
  this.drawFilterBar(EQUIPMENT_SUBTABS);if(this.filter==='sets'){this.drawSets();return;}
  let items=this.equipmentItems();if(this.filter!=='all')items=items.filter(i=>i.type===this.filter||(this.filter==='collectible'&&i.type==='accessory'));
  const{pages,rows}=this.paginate(items,6);rows.forEach((item,n)=>{const x=225+n%3*415,y=315+Math.floor(n/3)*171,owned=this.owned.has(item.id),rarity=equipmentRarity(item),c=this.add.container(x,y);c.add(this.panel(0,0,380,154,owned?0xfffaec:0xd5d6d0,owned?rarity.color:0x747a74));const art=this.item(-118,0,item.id,112);if(!owned){art.setTint?.(0x000000);art.setText?.('？');art.setColor?.('#111111');}c.add(art);c.add(this.text(55,-45,owned?item.name:'？？？',22,INK).setWordWrapWidth(220,true));c.add(this.text(55,-2,owned?`${rarity.icon} ${rarity.label}・已收藏`:`類別：${this.equipmentTypeLabel(item)}`,18,owned?'#47704d':'#555b56'));c.add(this.text(55,40,owned?'點開看故事與效果':`線索：${this.lockedEquipmentHint(item)}`,16,MUTED).setWordWrapWidth(220,true));c.setSize(380,154).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.equipmentDetail(item);});});
  if(!rows.length)this.text(640,398,'這個分類還沒有資料。',28,MUTED);this.footer(pages,'剪影代表尚未取得・手冊查閱不會改變目前穿戴');
 }
 equipmentDetail(item){
  const owned=this.owned.has(item.id),rarity=equipmentRarity(item),regionText=item.recommendedMap||sourceHint(item,CHEST_GAMES),c=this.overlay(owned?item.name:'？？？',owned?`${rarity.icon} ${rarity.label}・已加入收藏`:`類別：${this.equipmentTypeLabel(item)}・尚未取得`),art=this.item(365,362,item.id,250);if(!owned){art.setTint?.(0x000000);art.setText?.('？');art.setColor?.('#111111');}c.add(art);
  c.add(this.text(815,274,owned?(item.desc||'一件陪伴冒險的可愛裝備。'):'故事：？？？',24,INK).setWordWrapWidth(510,true));c.add(this.text(815,382,owned?`取得方式：${regionText}`:`探索線索：${this.lockedEquipmentHint(item)}`,21,'#5f6f59').setWordWrapWidth(510,true));const effect=item.futureAbility||this.effectText(item.effects)||'外觀收藏：目前不改變遊戲能力。';c.add(this.text(815,478,owned?`能力／外觀效果：${effect}`:'能力／外觀效果：？？？',21,'#765d43').setWordWrapWidth(510,true));this.modalButton(c,640,625,owned?'回到裝備衣櫥':'記住線索，繼續冒險',()=>this.dismissModal(c));
 }
 equipmentTypeLabel(item){return({cloth:'衣服／披風',hat:'帽子／頭飾',fullset:'整套服裝',collectible:'冒險道具',accessory:'冒險道具'})[item.type]||'神秘裝備';}
 lockedEquipmentHint(item){if(item.source==='secret')return '完成一段特別的冒險故事';if(item.recommendedMap)return '到指定區域完成探索';return '完成小遊戲，遇見並觸碰 BOX';}
 effectText(effects={}){const labels={rewardRate:'寶箱獎勵',dropRate:'稀有掉落率',extraPlayCount:'每日額外遊玩',maxHearts:'愛心上限'};return Object.entries(effects||{}).filter(([,v])=>Number(v)).map(([k,v])=>`${labels[k]||k} +${v}${k.includes('Rate')?'%':''}`).join('・');}
 drawEcology(){
  this.drawFilterBar(ECOLOGY_CATEGORIES);const entries=ECOLOGY_ENTRIES.filter(e=>this.filter==='all'||e.category===this.filter),{pages,rows}=this.paginate(entries,6);
  rows.forEach((entry,n)=>{const x=225+n%3*415,y=315+Math.floor(n/3)*171,unlocked=isEcologyUnlocked(entry,this.data),region=this.region(entry.region),c=this.add.container(x,y);c.add(this.panel(0,0,380,154,unlocked?0xf2f6df:0xd7ded5,unlocked?0x78a36d:0x7c8a80));c.add(this.text(-130,-8,unlocked?entry.icon:'？',58,unlocked?'#375b3c':'#526157'));c.add(this.text(55,-45,unlocked?entry.name:'尚未發現',24,INK));c.add(this.text(55,-5,unlocked?`${region?.icon||''} ${region?.name||'未知區域'}`:'在冒險中觀察牠',18,'#57705b'));c.add(this.text(55,38,unlocked?`🔊 點擊聽「${entry.sound}」`:'剪影線索：'+(region?.name||'神秘地區'),16,MUTED).setWordWrapWidth(220,true));c.setSize(380,154).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.ecologyDetail(entry,unlocked);});});
  this.footer(pages,'遇見、互動或取得子地圖貼紙，就會自動解鎖生態卡片');
 }
 ecologyDetail(entry,unlocked){
  this.tone(unlocked?'correct':'hint');const region=this.region(entry.region),c=this.overlay(unlocked?`${entry.icon} ${entry.name}`:'？ 尚未發現',unlocked?`🔊 ${entry.sound}`:`線索：前往${region?.name||'神秘地區'}觀察與幫助新朋友。`);c.add(this.text(360,365,unlocked?entry.icon:'？',150,unlocked?'#436b48':'#65746a'));c.add(this.text(805,310,unlocked?entry.fact:'完成互動後，這裡會出現一則有趣的小知識。',25,INK).setWordWrapWidth(520,true));c.add(this.text(805,435,unlocked?entry.story:'牠的童話小故事，也正在等你親自發現。',23,'#6f654f').setWordWrapWidth(520,true));this.modalButton(c,410,620,unlocked?'關閉圖鑑':'稍後再找',()=>this.dismissModal(c),0x66766a);this.modalButton(c,870,620,unlocked?'再聽一次':'前往尋找',()=>{if(unlocked)this.tone('correct');else{this.dismissModal(c);this.scene.start('RegionGuide',{regionId:entry.region});}},unlocked?0x5b8061:0x7b6991);
 }
 overlay(title,body){const c=super.overlay(title,body),backdrop=c.list?.[0];backdrop?.on?.('pointerdown',()=>this.dismissModal(c));const close=super.button(1190,68,68,54,'✕',()=>this.dismissModal(c),0x7b6656);close.label.setFontSize(25);c.add(close);const esc=()=>this.dismissModal(c);this.input?.keyboard?.on?.('keydown-ESC',esc);c.once?.('destroy',()=>this.input?.keyboard?.off?.('keydown-ESC',esc));return c;}
 dismissModal(c=this.modal){if(!c||c!==this.modal)return;c.destroy();this.modal=null;}
 drawPuzzles(){
  const{pages,rows}=this.paginate(WORLD_PUZZLES,6);rows.forEach((puzzle,n)=>{const x=225+n%3*415,y=300+Math.floor(n/3)*185,p=puzzleProgress(puzzle,this.data),c=this.add.container(x,y);c.add(this.panel(0,0,380,168,p.complete?0xfff3ca:0xe8edf0,p.complete?0xd6a843:0x7188a5));c.add(this.text(-132,-15,puzzle.icon,56));c.add(this.text(58,-51,puzzle.name,23,INK).setWordWrapWidth(220,true));c.add(this.text(58,-4,`${'★'.repeat(p.count)}${'☆'.repeat(p.total-p.count)}　${p.count}/${p.total}`,22,p.complete?'#a87425':'#607493'));c.add(this.text(58,44,p.complete?'拼圖完成・夢幻獎勵已點亮':'探索子地圖取得碎片',16,MUTED).setWordWrapWidth(225,true));c.setSize(380,168).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.puzzleDetail(puzzle,p);});});this.footer(pages,'每區 3 塊繪本碎片・完成整區即可點亮夢幻套裝收藏目標');
 }
 puzzleDetail(puzzle,progress){
  const c=this.overlay(puzzle.name,progress.complete?'拼圖完成！整幅繪本重新亮起。':'到各子地圖探索，逐塊找回故事。');puzzle.pieces.forEach((piece,n)=>{const x=330+n*310,unlocked=progress.unlockedIds.has(piece.id);c.add(this.panel(x,363,245,210,unlocked?0xfff2c7:0xbec7cb,unlocked?0xd2a341:0x687781));c.add(this.text(x,328,unlocked?`${puzzle.icon} ${piece.number}`:'？',58,unlocked?'#765826':'#4e5a60'));c.add(this.text(x,418,unlocked?piece.name:'尚未取得',20,INK).setWordWrapWidth(215,true));});c.add(this.text(640,521,`100% 獎勵：✦ ${puzzle.reward}`,25,progress.complete?'#a57425':'#776c5d'));this.modalButton(c,640,625,progress.complete?'夢幻收藏已點亮':'前往這個區域',()=>{c.destroy();this.modal=null;if(!progress.complete)this.openRegion(puzzle.regionId);},progress.complete?0xb1843e:0x647d9c);
 }
 drawMilestones(){
  const rows=growthMilestones(this.data);rows.forEach((row,n)=>{const x=n<3?225+n*415:432+(n-3)*416,y=n<3?322:510,c=this.add.container(x,y);c.add(this.panel(0,0,380,164,row.done?0xfff2c7:0xf0eadc,row.done?0xd6a843:0xb7a884));c.add(this.text(-139,-24,row.icon,46));c.add(this.text(53,-52,`${row.done?'★':'☆'} ${row.name}`,23,INK));c.add(this.text(53,-12,row.description,17,MUTED).setWordWrapWidth(225,true));c.add(this.text(53,29,`進度 ${row.count} / ${row.total}`,20,row.done?'#9a6f28':'#5e745f'));c.add(this.text(53,58,`獎勵：${row.reward}`,15,'#806b4f'));});this.text(640,629,'所有成就都是正向累積；失敗不扣進度，也不會錯過獎勵。',19,MUTED);
 }
 drawRegions(){
  const{pages,rows}=this.paginate(WORLD_REGIONS,10);rows.forEach((region,n)=>{const x=155+n%5*242,y=301+Math.floor(n/5)*229,submaps=REGION_SUBMAPS[region.id]||[],world=this.data.world_progress||{},discovered=submaps.filter(s=>(world.discoveredSubmaps||[]).includes(s.id)).length,c=this.add.container(x,y);c.add(this.panel(0,0,220,205,0xf7f2e4,0x9984ac));c.add(this.text(0,-65,region.icon,49));c.add(this.text(0,-17,region.name,22,INK).setWordWrapWidth(195,true));c.add(this.text(0,25,region.mechanic,15,MUTED).setWordWrapWidth(190,true));c.add(this.text(0,69,region.id==='realm'?'漩渦直達星芽谷':`${submaps.length} 張子地圖・發現 ${discovered}`,15,'#6b5c7d'));c.setSize(220,205).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.regionDetail(region);});});this.footer(pages,'點選區域可查看子地圖、地標入口與專屬收藏方向');
 }
 regionDetail(region){
  const submaps=REGION_SUBMAPS[region.id]||[],c=this.overlay(`${region.icon} ${region.name}`,region.mechanic);if(region.id==='realm')c.add(this.text(640,355,'幻界不拆成三張一般子地圖。\n由幻界漩渦發動轉場，直達微光星芽谷與晨曦蒲公英丘陵。\nRPG 地標：星核漩渦門・星芽甦醒區・星芽谷野外・冒險據點',25,INK));else submaps.forEach((submap,n)=>{const x=325+n*315,landmarks=SUBMAP_LANDMARKS[submap.id]||[];c.add(this.panel(x,372,278,258,0xf5eddc,0x9c87ae));c.add(this.text(x,278,submap.icon,42));c.add(this.text(x,323,submap.name,22,INK));c.add(this.text(x,365,submap.description,15,MUTED).setWordWrapWidth(246,true));c.add(this.text(x,431,`地標：${landmarks.join('・')}`,14,'#625475').setWordWrapWidth(246,true));c.add(this.text(x,486,submap.reward?`限定：${submap.reward}`:`共 ${landmarks.length||submap.slots||3} 個入口`,14,'#806846').setWordWrapWidth(246,true));});this.modalButton(c,640,625,`前往${region.name}`,()=>{c.destroy();this.modal=null;this.openRegion(region.id);},0x74628e);
 }
 openRegion(regionId){const region=this.region(regionId);if(region?.navigation==='portal')this.scene.start(region.targetScene||'RealmWorldGame');else this.scene.start('RegionGuide',{regionId});}
 drawSets(){
  COLLECTION_SETS.forEach((set,n)=>{const x=328+n%2*624,y=320+Math.floor(n/2)*190,p=setProgress(this.data,set,ITEM_DB),c=this.add.container(x,y);c.add(this.panel(0,0,590,172,p.complete?0xfff1c5:0xf0eadc,p.complete?0xd3a33e:0xb59c70));c.add(this.item(-218,0,set.items[2],135));c.add(this.text(64,-48,`${set.name}　${p.count}/${p.total}`,27,INK));c.add(this.text(64,-4,`稱號：${set.title}`,21,'#6e5b44'));c.add(this.text(64,39,p.complete?'已解鎖・點選設定展示':'點選查看缺少的裝備',18,MUTED));c.setSize(590,172).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.modal)return;p.complete?this.showcase(set.id):this.setDetail(set);});});this.text(640,635,'原有套裝稱號與展示功能完整保留；展示不會改變目前穿戴。',18,MUTED);
 }
 setDetail(set){const c=this.overlay(set.name,`集齊 ${set.items.length} 件，解鎖「${set.title}」與「${set.background}」`);set.items.forEach((id,n)=>{const item=ITEM_DB[id],owned=this.owned.has(id),x=320+n*320,art=this.item(x,350,id,170);if(!owned)art.setTint?.(0x30483e);c.add(art);c.add(this.text(x,464,`${owned?'✓':'待收集'} ${item?.name||id}`,21,INK).setWordWrapWidth(285,true));});this.modalButton(c,640,620,'回到套裝目標',()=>{c.destroy();this.modal=null;});}
 celebrate(ids){const c=this.overlay('套裝收集完成！','新的稱號與展示背景已經解鎖。');c.add(this.text(640,355,ids.map(id=>{const s=COLLECTION_SETS.find(v=>v.id===id);return`${s.name} → ${s.title}`;}).join('\n'),30,INK));this.tone('finish');this.modalButton(c,640,615,'看看我的展示',()=>{c.destroy();this.modal=null;this.showcase(ids[0]);});}
 showcase(id){
  const state=this.data.collection_goals_v1,selected=id||state?.selected||state?.unlocked[0],set=COLLECTION_SETS.find(s=>s.id===selected);if(!set){const c=this.overlay('我的展示','先集齊任一套裝，就能解鎖稱號與展示背景。');this.modalButton(c,640,610,'去看看套裝目標',()=>{c.destroy();this.modal=null;this.filter='sets';this.draw();});return;}
  const c=this.overlay(set.title,set.background),g=this.add.graphics();g.fillStyle(set.color).fillRoundedRect(175,220,930,330,28);c.add(g);c.add(this.item(640,382,set.items[2],285));c.add(this.text(640,558,'展示使用套裝公仔，不改變衣櫥穿戴或遊戲能力。',21,'#f8edcf'));this.modalButton(c,640,625,state.selected===set.id?'展示中・返回':'設為我的展示',()=>{try{chestService.commit(selectCollection(chestService.load(),set.id));c.destroy();this.modal=null;this.draw();}catch(e){c.destroy();this.modal=null;this.error(e.message);}});
 }
 update(){}
}
