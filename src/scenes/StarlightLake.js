import AnimalSnackGame from './AnimalSnackGame.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import {chestService} from '../systems/ForestChestService.js';
import {preferences} from '../systems/AdventurePreferences.js';
import {LAKE_PLACES,LAKE_RIDDLES,MOON_PHASES,lakeState,updateLake,islandUnlocked,lakeLayout,moonNext} from '../data/StarlightLakeData.js';

export default class StarlightLake extends AnimalSnackGame {
 constructor(key='StarlightLake'){super(key);}
 init(){this.modal=null;this.travelBusy=false;this.errorMessage='';}
 preload(){
  if(!this.textures.exists('lake_panorama'))this.load.image('lake_panorama','assets/starlight-lake/lakeside.png');
  if(!this.textures.exists('lake_owl'))this.load.image('lake_owl','assets/starlight-lake/owl-guide.png');
  if(!this.cache.audio.exists('lake_music'))this.load.audio('lake_music','assets/lake_bgm.mp3');
 }
 create(){
  SaveSystem.applyToRegistry(this.registry);this.audioNodes=new Set();this.soundOn=true;
  this.loadState();this.resizeLake=()=>{if(!this.scene.isActive())return;this.setLayout();this.draw();};
  globalThis.window?.addEventListener('resize',this.resizeLake);
  this.events.on('resume',this.resizeLake);
  this.events.once('shutdown',()=>{globalThis.window?.removeEventListener('resize',this.resizeLake);this.events.off('resume',this.resizeLake);this.stopTones();this.scale.setGameSize(1280,720);});
  this.setLayout();this.draw();
  if(this.cache.audio.exists('lake_music'))AudioSystem.playBgm(this,'lake_music',.35);
 }
 setLayout(){this.portrait=(globalThis.innerHeight||720)>(globalThis.innerWidth||1280);this.layout=lakeLayout(this.portrait);this.W=this.layout.width;this.H=this.layout.height;this.scale.setGameSize(this.W,this.H);}
 loadState(){try{this.state=lakeState(chestService.load());this.errorMessage='';}catch(e){this.state=lakeState();this.errorMessage=e.message;}}
 commit(action,id){try{const data=updateLake(chestService.load(),action,id);chestService.commit(data);this.state=lakeState(data);return true;}catch(e){this.errorMessage=e.message;this.showError(e.message);return false;}}
 text(x,y,t,size=28,color='#fff2d2',origin=.5){return super.text(x,y,t,size,color,origin);}
 button(x,y,w,h,label,fn,fill=0x254d65,color='#fff2d2'){
  const b=super.button(x,y,w,h,label,fn,fill,color);b.label.setFontSize(28);b.label.setWordWrapWidth(w-18,true);return b;
 }
 baseButton(x,y,w,h,label,fn,fill){return this.button(x,y,w,h,label,()=>{if(!this.modal&&!this.travelBusy)fn();},fill);}
 draw(){
  this.tweens.killAll();this.children.removeAll(true);this.modal=null;
  const W=this.W,H=this.H;
  this.add.rectangle(W/2,H/2,W,H,0x0b2236);
  if(this.textures.exists('lake_panorama')){
   if(this.portrait)this.add.image(W/2,275,'lake_panorama').setDisplaySize(W,405);
   else this.add.image(640,360,'lake_panorama').setDisplaySize(1280,720);
  }else this.errorMessage='湖畔素材未載入，請完整覆蓋 assets/starlight-lake 後重開。';
  for(let i=0;i<22;i++){
   const p=this.add.circle(45+(i*173)%(W-90),this.portrait?120+(i*57)%290:110+(i*57)%430,2+i%3,0xffe79c,.6);
   this.tweens.add({targets:p,y:p.y-12,alpha:.15,duration:1400+(i%4)*300,yoyo:true,repeat:-1});
  }
  this.add.rectangle(W/2,44,W,88,0x10283d,.95);
  this.baseButton(106,44,188,this.portrait?82:68,'← 世界地圖',()=>this.travel('RegionAtlas'));
  this.text(W/2,43,'星光湖畔',this.portrait?35:40);
  this.baseButton(W-69,44,112,this.portrait?82:68,'設定',()=>{this.scale.setGameSize(1280,720);this.scene.launch('AdventureSettings',{hostKey:'StarlightLake'});this.scene.pause();});
  if(this.portrait){
   this.panel(W/2,376,610,72,0x102e44,0x9dbeca);this.text(W/2,376,`星印 ${this.state.seals.length} / 3　·　點亮湖心月門`,28);
  }
  this.layout.places.forEach((r,i)=>{
   const p=LAKE_PLACES[i],seal=this.state.seals.includes(p.id),locked=p.id==='island'&&!islandUnlocked(this.state);
   if(this.portrait){
    const b=this.baseButton(r.x,r.y,r.w,r.h,'',()=>this.place(p),seal?0x315a58:0x203f57);
    b.add(this.text(0,-45,`${seal?'✦ ':locked?'◇ ':''}${p.name}`,29));
    b.add(this.text(0,0,p.subtitle,24,'#afd1de'));
    b.add(this.text(0,46,seal?'星印已收藏':locked?'集齊 3 枚星印解鎖':'點選探索 →',24,'#f1d591'));
   }else{
    // Generous landmark hit areas; the label and artwork both open the place.
    this.add.zone(p.x,p.y,250,135).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.modal)this.place(p);});
    this.baseButton(r.x,r.y,r.w,r.h,`${seal?'✦ ':locked?'◇ ':''}${p.name}`,()=>this.place(p),seal?0x315a58:0x193d52);
   }
  });
  if(!this.portrait){
   this.panel(648,360,490,73,0x102e44,0xa7c1cc);
   this.text(648,360,`星印 ${this.state.seals.length} / 3　·　${islandUnlocked(this.state)?'月門已甦醒':'找尋三枚星印'}`,28);
  }else{
   this.owl(123,1120,155);this.text(431,1100,'「抬頭看星星，答案就在身邊。」',25).setWordWrapWidth(380,true);
   this.text(431,1145,'導遊・星燈',25,'#b8d4e0');
  }
  this.add.rectangle(W/2,H-45,W,90,0x10283d,.98);
  const bw=this.portrait?212:270;
  this.baseButton(W*.19,H-45,bw,this.portrait?82:72,'探索手帳',()=>this.journal());
  this.baseButton(W*.5,H-45,bw,this.portrait?82:72,'我的寶箱',()=>this.travel('ForestChestRoom',{returnScene:'StarlightLake'}));
  this.baseButton(W*.81,H-45,bw,this.portrait?82:72,'裝備與成就',()=>this.travel('EquipmentJournal',{returnScene:'StarlightLake'}));
  if(this.errorMessage)this.showError(this.errorMessage);
 }
 owl(x,y,size){if(!this.textures.exists('lake_owl'))return this.text(x,y,'星燈',32);const a=this.add.image(x,y,'lake_owl');return a.setScale(size/Math.max(a.width,a.height));}
 dialog(title,body){
  this.closeDialog();const W=this.W,H=this.H,c=this.add.container(0,0).setDepth(2000);this.modal=c;
  c.add(this.add.rectangle(W/2,H/2,W,H,0x031321,.86).setInteractive());
  c.add(this.panel(W/2,H/2,W-60,H-100,0x102e44,0xd7ba7b,28));
  c.add(this.text(W/2,this.portrait?125:106,title,36).setWordWrapWidth(W-100,true));
  c.add(this.text(W/2,this.portrait?245:193,body,27,'#c8e1e7').setWordWrapWidth(W-140,true));
  return c;
 }
 closeDialog(){this.modal?.destroy();this.modal=null;}
 closeButton(c,label='返回湖畔'){c.add(this.button(this.W/2,this.H-112,this.portrait?540:430,76,label,()=>this.closeDialog()));}
 place(p){
  if(!this.commit('visit',p.id))return;
  if(p.id==='owl'){this.detectiveHouse();return;}
  if(p.id==='island'){this.island();return;}
  const c=this.dialog(p.name,p.story),W=this.W,H=this.H;
  c.add(this.owl(this.portrait?W/2:285,this.portrait?465:370,this.portrait?220:230));
  const x=this.portrait?W/2:800;
  c.add(this.text(x,this.portrait?641:298,p.gameName,32));
  c.add(this.text(x,this.portrait?700:349,'既有遊戲入口 · 挑戰時建議橫放',24,'#aaccd9'));
  c.add(this.button(x,this.portrait?795:420,this.portrait?540:490,82,'前往挑戰',()=>this.travel(p.game,{returnScene:'StarlightLake',mapID:'02',testMode:false})));
  if(p.seal)c.add(this.button(this.W/2,this.portrait?949:511,this.portrait?540:630,76,this.state.seals.includes(p.id)?'再解一次星印謎題':'解開星印謎題（3 題）',()=>this.startRiddle(p.id),0x8c6839));
  this.closeButton(c);
 }
 startRiddle(id){this.riddle={id,index:0,order:Phaser.Utils.Array.Shuffle([...LAKE_RIDDLES[id]])};this.riddleRound();}
 riddleRound(){
  const r=this.riddle,q=r.order[r.index],c=this.dialog(`${LAKE_PLACES.find(p=>p.id===r.id).seal}　${r.index+1} / 3`,q.q);
  c.add(this.text(this.W/2,this.portrait?430:277,'不用倒數，答錯可以再想；提示不扣分。',24,'#aaccd9'));
  const choices=Phaser.Utils.Array.Shuffle([...q.options]);let settled=false;
  choices.forEach((answer,i)=>c.add(this.button(this.portrait?this.W/2:310+i*330,this.portrait?566+i*117:375,this.portrait?510:292,90,answer,()=>{
   if(settled)return;
   if(answer!==q.answer){feedback.setText('差一點！看看提示，再試一次。');return;}
   settled=true;r.index++;
   if(r.index===r.order.length){if(this.commit('seal',r.id))this.sealCelebration(r.id);}
   else this.riddleRound();
  })));
  const feedback=this.text(this.W/2,this.portrait?922:465,'觀察規律，選出答案。',25,'#f2d495').setWordWrapWidth(this.W-140,true);c.add(feedback);
  c.add(this.button(this.W/2,this.portrait?1033:518,300,64,'給我線索',()=>feedback.setText(q.hint),0x426078));this.closeButton(c,'稍後再挑戰');
 }
 sealCelebration(id){this.draw();const p=LAKE_PLACES.find(p=>p.id===id),c=this.dialog('星印亮起了！',`${p.seal} 已收藏　·　${this.state.seals.length} / 3`);
  const star=this.text(this.W/2,this.portrait?580:358,'✦',150,'#ffe28b');c.add(star);this.tweens.add({targets:star,angle:30,scaleX:1.13,scaleY:1.13,duration:850,yoyo:true,repeat:1});
  c.add(this.text(this.W/2,this.portrait?855:482,islandUnlocked(this.state)?'三枚星印到齊，湖心小島等著你！':'再找找其他場所，月門就快甦醒了。',28).setWordWrapWidth(this.W-140,true));this.closeButton(c,'收進探索手帳');this.tone('finish');}
 detectiveHouse(){
  const c=this.dialog('夜行動物屋 · 星湖偵探社','星燈收到三份奇妙的委託。\n調查現場、追問證詞，再用證據拼出真相。');
  c.add(this.owl(this.W/2,this.portrait?555:330,this.portrait?270:190));
  c.add(this.button(this.W/2,this.portrait?840:446,this.portrait?590:720,76,'進入星湖偵探社',()=>this.travel('StarlightDetectiveGame',{returnScene:'StarlightLake',testMode:false}),0x8c6839));
  c.add(this.button(this.W/2,this.portrait?963:528,this.portrait?590:720,64,'查看原本的探索手帳',()=>this.journal()));
  this.closeButton(c);
 }
 journal(){const c=this.dialog('星燈的探索手帳','尋找星印 → 喚醒月門 → 收藏月光石');
  c.add(this.owl(this.portrait?this.W/2:292,this.portrait?466:370,this.portrait?225:260));
  const lines=LAKE_PLACES.filter(p=>p.seal).map(p=>`${this.state.seals.includes(p.id)?'✦':'◇'} ${p.seal}　${this.state.seals.includes(p.id)?'已找到':'待探索'}`);
  lines.push(`${this.state.collectibles.includes('moonstone')?'✦':'◇'} 月光石　${this.state.collectibles.includes('moonstone')?'已收藏':'月門的禮物'}`);
  c.add(this.text(this.portrait?this.W/2:823,this.portrait?741:364,lines.join('\n'),30));
  c.add(this.text(this.W/2,this.portrait?1006:510,`拜訪 ${this.state.visited.length} / 6 個場所 · 探索紀錄自動保存\n月光石是本區紀念收藏，不是能力裝備或寶箱。`,23,'#bcd4df').setWordWrapWidth(this.W-130,true));this.closeButton(c);}
 island(){
  if(!islandUnlocked(this.state)){const c=this.dialog('沉睡的月門','還需要螢光、星軌、水晶三枚星印。\n到螢火草原、觀測台和水晶洞窟解開謎題。');c.add(this.owl(this.W/2,this.portrait?650:369,250));this.closeButton(c);return;}
  const c=this.dialog('月門甦醒','月亮有自己的循環：新月 → 上弦 → 滿月 → 下弦。\n連續解開 3 道月相密碼，就能收藏月光石。');
  c.add(this.text(this.W/2,this.portrait?603:351,'●　◐　○　◑',64,'#f6dda1'));
  c.add(this.button(this.W/2,this.portrait?868:480,this.portrait?540:550,84,this.state.collectibles.includes('moonstone')?'再次點亮月門':'點亮月門',()=>{this.moonRound=0;this.moonPuzzle();},0x8c6839));this.closeButton(c);
 }
 moonPuzzle(){
  const start=Phaser.Math.Between(0,3),sequence=[0,1,2].map(i=>MOON_PHASES[(start+i)%4]),answer=moonNext(sequence);
  const c=this.dialog(`月相密碼　${this.moonRound+1} / 3`,`${sequence.join(' → ')} → ？`);let settled=false;
  const feedback=this.text(this.W/2,this.portrait?953:462,'觀察循環，找出下一個月相。',26,'#f2d495');c.add(feedback);
  Phaser.Utils.Array.Shuffle([...MOON_PHASES]).forEach((phase,i)=>c.add(this.button(this.portrait?this.W/2:217+i*282,this.portrait?464+i*111:345,this.portrait?520:258,86,phase,()=>{
   if(settled)return;if(phase!==answer){feedback.setText('下弦之後，會回到新月。再想想！');return;}settled=true;
   this.moonRound++;if(this.moonRound<3){this.moonPuzzle();return;}
   if(!this.commit('moon'))return;
   this.draw();const done=this.dialog('月門點亮，湖水也亮起來了！','月光石已存入湖畔探索手帳。\n重玩不會重複發放收藏，也不消耗愛心。');
   done.add(this.text(this.W/2,this.portrait?590:353,'☾',150,'#ffe4a0'));
   done.add(this.button(this.W/2,this.portrait?903:494,this.portrait?550:630,88,'加碼挑戰：記憶翻牌',()=>this.travel('MemoryMatchGame',{returnScene:'StarlightLake',mapID:'02',testMode:false})));this.closeButton(done);this.tone('finish');
  })));
  c.add(this.button(this.W/2,this.portrait?1050:524,340,66,'查看月相循環',()=>feedback.setText('新月 → 上弦 → 滿月 → 下弦 → 新月'),0x426078));this.closeButton(c,'稍後再挑戰');
 }
 showError(message){const c=this.dialog('探索紀錄尚未保存',message);this.closeButton(c,'知道了，保留原存檔');}
 travel(key,data={}){
  if(this.travelBusy)return;
  if(!this.scene.manager.keys[key]){this.showError('找不到遊戲場景，請將本更新包完整覆蓋到既有完整遊戲。');return;}
  this.travelBusy=true;SaveSystem.saveFromRegistry(this.registry);this.scene.start(key,data);
 }
 tone(kind){if(preferences.value.sfx)super.tone(kind);}
 update(){}
}
