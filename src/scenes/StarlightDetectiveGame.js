import AnimalSnackGame from './AnimalSnackGame.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import {chestService} from '../systems/ForestChestService.js';
import {preferences} from '../systems/AdventurePreferences.js';
import {DETECTIVE_CASES,DETECTIVE_CAST,detectiveCase} from '../data/DetectiveCases.js';
import {detectiveState,updateDetective,unlocked,ordered,caseProgress} from '../data/DetectiveRules.js';

const C={ink:0x102c3b,card:0x203f4e,green:0x38655d,gold:0xad8240,pale:'#fff1cc',muted:'#b8d5da'};
export default class StarlightDetectiveGame extends AnimalSnackGame{
 constructor(){super('StarlightDetectiveGame');}
 init(data={}){this.returnScene=data.returnScene||'StarlightLake';this.caseId=null;this.tab='investigate';this.placeId=null;this.personId=null;this.page=0;this.selected=[];this.drafts={};this.question=0;this.proofTab='questions';this.swapId=null;this.values=[];this.modal=null;this.busy=false;this.loadError=null;}
 preload(){
  for(const key of ['dock','tower','cave','cast'])if(!this.textures.exists('detective_'+key))this.load.image('detective_'+key,`assets/starlight-detective/${key}.png`);
  if(!this.textures.exists('lake_owl'))this.load.image('lake_owl','assets/starlight-lake/owl-guide.png');
  if(!this.cache.audio.exists('lake_music'))this.load.audio('lake_music','assets/lake_bgm.mp3');
 }
 create(){
  this.audioNodes=new Set();this.soundOn=true;
  try{this.state=detectiveState(chestService.load());}catch(e){this.state=detectiveState();this.loadError=e.message;}
  // The generated atlas has intentionally measured row bounds to preserve long ears.
  if(this.textures.exists('detective_cast')){
   const tex=this.textures.get('detective_cast'),im=tex.getSourceImage(),sx=im.width/1280,sy=im.height/1280;
   for(const [name,x,y,w,h] of [['otter',0,0,640,585],['bird',640,0,640,610],['rabbit',0,585,640,695],['fox',640,610,640,670]])
    if(!tex.has(name))tex.add(name,0,Math.round(x*sx),Math.round(y*sy),Math.round(w*sx),Math.round(h*sy));
  }
  this.onResize=()=>{if(!this.scene.isActive())return;this.layout();this.draw();};
  globalThis.window?.addEventListener('resize',this.onResize);this.events.on('resume',this.onResize);
  this.events.once('shutdown',()=>{globalThis.window?.removeEventListener('resize',this.onResize);this.events.off('resume',this.onResize);this.stopTones();this.scale.setGameSize(1280,720);});
  this.layout();this.draw();if(this.cache.audio.exists('lake_music'))AudioSystem.playBgm(this,'lake_music',.3);
 }
 layout(){this.portrait=(globalThis.innerHeight||720)>(globalThis.innerWidth||1280);this.W=this.portrait?720:1280;this.H=this.portrait?1280:720;this.scale.setGameSize(this.W,this.H);}
 get file(){return this.caseId?detectiveCase(this.caseId):null;}
 get run(){return this.state.runs[this.caseId];}
 text(x,y,t,size=27,color=C.pale,origin=.5){return super.text(x,y,t,size,color,origin);}
 label(x,y,t,size=27,width=this.W-80,color=C.pale){return this.text(x,y,t,size,color).setWordWrapWidth(width,true);}
 b(x,y,w,h,t,fn,fill=C.card,inModal=false){const b=super.button(x,y,w,h,t,()=>{if((!this.modal||inModal)&&!this.busy)fn();},fill,C.pale);b.label.setFontSize(this.portrait?28:25).setWordWrapWidth(w-24,true);return b;}
 art(key,x,y,w,h,alpha=1){if(!this.textures.exists(key))return this.panel(x,y,w,h,C.card,C.gold);return this.add.image(x,y,key).setDisplaySize(w,h).setAlpha(alpha);}
 actor(id,x,y,size){if(!DETECTIVE_CAST[id]||!this.textures.exists('detective_cast'))return this.text(x,y,DETECTIVE_CAST[id]?.name||'星燈',30);const im=this.add.image(x,y,'detective_cast',id);return im.setScale(size/Math.max(im.width,im.height));}
 owl(x,y,size){if(!this.textures.exists('lake_owl'))return this.text(x,y,'✦',80);const im=this.add.image(x,y,'lake_owl');return im.setScale(size/Math.max(im.width,im.height));}
 act(type,fields={},show=true){
  if(this.loadError){this.notice('紀錄無法讀取',this.loadError);return null;}
  try{
   const r=updateDetective(chestService.load(),{...fields,type,caseId:this.caseId});
   chestService.commit(r.data);this.state=r.state;
   if(show){this.draw();if(r.evidence)this.evidenceNotice(r);else if(r.type==='ending')this.ending(r.ending);else if(r.feedback)this.notice(r.type==='proved'?'推理有了根據！':'偵探筆記',r.feedback);}
   return r;
  }catch(e){this.notice('這一步尚未完成',e.message);return null;}
 }
 chooseCase(c,restart=false){
  this.caseId=c.id;
  if(!this.act(restart?'restart':'start',{seed:Date.now()>>>0},false)){this.caseId=null;return;}
  this.tab='investigate';this.placeId=null;this.personId=null;this.page=0;this.selected=[];this.drafts={};this.question=0;this.proofTab='questions';this.swapId=null;this.values=c.experiment?.controls.map(()=>0)||[];this.draw();
  if(!this.run.evidence.length)this.notice(`委託 ${c.number}｜${c.title}`,c.intro,'接下委託');
 }
 draw(){
  this.tweens.killAll();this.children.removeAll(true);this.modal=null;
  this.add.rectangle(this.W/2,this.H/2,this.W,this.H,C.ink);
  if(!this.caseId){this.drawCases();if(this.loadError)this.notice('紀錄無法讀取',this.loadError);return;}
  this.header();
  if(this.tab==='investigate')this.placeId?this.drawPlace():this.drawInvestigation();
  if(this.tab==='people')this.personId?this.drawPerson():this.drawPeople();
  if(this.tab==='evidence')this.drawEvidence();
  if(this.tab==='experiment')this.drawExperiment();
  if(this.tab==='reason')this.drawReason();
  const tabs=[['investigate','調查'],['people','人物'],['evidence','證據'],['experiment','重建'],['reason','推理']];
  this.add.rectangle(this.W/2,this.H-48,this.W,96,0x091e2b);
  tabs.forEach(([id,name],i)=>this.b((i+.5)*this.W/5,this.H-48,this.W/5-12,78,name,()=>{this.tab=id;this.page=0;this.draw();},this.tab===id?C.gold:C.card));
 }
 header(){
  this.add.rectangle(this.W/2,46,this.W,92,0x091e2b);
  this.b(91,46,162,76,'← 案件',()=>{this.caseId=null;this.draw();});
  this.label(this.W/2,32,this.file.title,this.portrait?28:32,this.W-370);
  const p=caseProgress(this.file,this.run);this.text(this.W/2,68,`線索 ${p.evidence}/${p.total}　推理 ${p.proven}/${p.questions}`,21,C.muted);
  this.b(this.W-86,46,150,76,'星燈提示',()=>this.act('hint'),C.green);
 }
 drawCases(){
  const P=this.portrait,W=this.W,H=this.H;
  this.art('detective_dock',W/2,P?245:210,W,P?405:420,.6);
  this.add.rectangle(W/2,46,W,92,0x091e2b,.95);
  this.b(105,46,190,76,this.returnScene==='MiniGameHub'?'← 遊戲列表':'← 返回地圖',()=>this.leave());
  this.text(W/2,45,'星湖偵探社',P?36:40);
  this.b(W-83,46,145,76,'玩法',()=>this.help());
  this.owl(P?W/2:225,P?259:260,P?230:245);
  this.label(P?W/2:810,P?424:206,'真相，藏在彼此之間。',P?36:43,P?650:760);
  this.label(P?W/2:810,P?492:284,'調查現場 · 追問證詞 · 動手重建\n用證據，說一個完整的故事。',27,P?620:700);
  DETECTIVE_CASES.forEach((c,i)=>{
   const x=P?W/2:330+(i%2)*620,y=P?617+i*151:446+Math.floor(i/2)*160,w=P?650:590;
   const r=this.state.runs[c.id],open=unlocked(this.state,c);
   const b=this.b(x,y,w,P?135:140,'',()=>open?this.caseMenu(c):this.notice('尚未送達的邀請','完成三個主要案件後，星燈就會收到這封特別的信。'),open?C.card:0x23343d);
   b.add(this.text(-w/2+46,-26,c.number,26,'#e4ba6d'));
   b.add(this.text(35,-28,c.title,P?30:29));
   b.add(this.text(0,16,open?c.tag:'完成三案後解鎖',22,C.muted));
   b.add(this.text(0,48,r?.best===2?'完整真相已還原':r?.best===1?'已結案，可繼續補查':r?'調查中 · 點選繼續':open?'新委託':'封存中',22,'#e4ba6d'));
  });
  this.text(W/2,H-30,`已收藏 ${this.state.badges.length} / 4 枚偵探徽章　·　進度自動保存`,P?23:21,C.muted);
 }
 caseMenu(c){
  const r=this.state.runs[c.id];if(!r){this.chooseCase(c);return;}
  const box=this.dialog(c.title,`${r.best?`已收藏「${c.badge}」\n`:''}線索 ${r.evidence.length} / ${c.clues.length}　·　${r.best===2?'已還原完整真相':r.best===1?'已結案，仍可補查':'正在調查'}\n重查只重置本案的調查過程，保留最佳結果與徽章。`);
  box.add(this.b(this.W/2,this.H*.59,this.W-180,82,'繼續調查',()=>{this.closeModal();this.chooseCase(c);},C.gold,true));
  box.add(this.b(this.W/2,this.portrait?this.H*.74:520,this.W-180,this.portrait?78:64,'重新調查本案',()=>{this.closeModal();this.chooseCase(c,true);},C.card,true));this.modalClose(box);
 }
 help(page=0){
  const pages=['調查：拜訪地點，收集實際觀察。\n人物：聽證詞，拿證據追問矛盾。\n證據：詳讀線索，連結兩張形成推論。','重建：調整模型，驗證現場原因。\n推理：每個結論附兩份證據。\n排好時間線，就能提交結案報告。','沒有倒數，不消耗愛心。\n提示分三階，不影響結局。\n找齊全部線索，可看到完整真相。\n從測試入口進入也會保存偵探進度。'];
  const c=this.dialog(`偵探入門 ${page+1} / 3`,pages[page]);
  c.add(this.b(this.W/2,this.H*.7,this.W-180,82,page<2?'下一頁':'從頭看看',()=>this.help((page+1)%3),C.green,true));this.modalClose(c,'返回案件冊');
 }
 drawInvestigation(){
  const P=this.portrait,W=this.W,c=this.file;
  this.art('detective_'+c.art,P?360:405,P?314:305,P?720:754,P?405:424);
  this.panel(P?360:405,P?541:557,P?650:754,P?92:108,C.card,C.gold);
  this.label(P?360:405,P?541:557,'先查現場，再比對證詞。\n點選地點進入調查。',26,P?600:680);
  c.places.forEach((p,i)=>{
   const count=p.clues.filter(id=>this.run.evidence.includes(id)).length;
   const x=P?190+(i%2)*340:1030,y=P?697+Math.floor(i/2)*178:150+i*86;
   const b=this.b(x,y,P?310:450,P?152:76,'',()=>{if(this.act('visit',{id:p.id},false)){this.placeId=p.id;this.draw();}},count===p.clues.length?C.green:C.card);
   b.add(this.label(0,P?-21:-12,p.name,P?28:26,P?280:420));b.add(this.text(0,P?37:21,`${count}/${p.clues.length} 現場線索${p.actor?' · 有人在場':''}`,21,C.muted));
  });
 }
 drawPlace(){
  const P=this.portrait,c=this.file,p=c.places.find(x=>x.id===this.placeId);
  this.art('detective_'+c.art,P?360:400,P?350:333,P?720:740,P?405:416);
  this.b(P?130:142,137,235,74,'← 全部地點',()=>{this.placeId=null;this.draw();});
  this.panel(P?360:400,P?632:569,P?652:740,P?152:109,C.card,C.gold);
  this.label(P?360:400,P?602:540,p.name,31,P?590:685);
  this.label(P?360:400,P?657:586,p.description,P?27:24,P?590:685,C.muted);
  const x=P?360:1020,y=P?800:233;
  this.text(x,P?747:164,'現場調查',30);
  p.clues.forEach((id,i)=>{const e=c.clues.find(e=>e.id===id);this.b(x,y+i*112,P?630:450,92,`${this.run.evidence.includes(id)?'✓':'＋'} ${e.name}`,()=>this.act('inspect',{place:p.id,id}),C.green);});
  if(p.actor)this.b(x,P?1080:531,P?630:450,85,`找${DETECTIVE_CAST[p.actor].name.split('・')[1]}談談`,()=>{this.tab='people';this.personId=p.actor;this.draw();},C.gold);
 }
 drawPeople(){
  const P=this.portrait;
  this.text(this.W/2,139,'每個人看見的，只是故事的一部分。',P?27:30);
  this.file.people.forEach((p,i)=>{
   const x=P?190+i%2*340:180+i*307,y=P?396+Math.floor(i/2)*455:358;
   this.panel(x,y,P?305:280,P?407:402,C.card,0x466776);
   this.actor(p.id,x,y-46,P?255:255);
   this.text(x,y+103,`${p.name} · ${p.role}`,P?23:22,C.muted);
   this.b(x,y+161,P?275:253,77,this.run.evidence.includes(p.statement)?'再聊一聊':'聽取證詞',()=>{this.personId=p.id;this.draw();},C.green);
  });
 }
 drawPerson(){
  const P=this.portrait,p=this.file.people.find(x=>x.id===this.personId),heard=this.run.evidence.includes(p.statement),corrected=p.challenge&&this.run.evidence.includes(p.challenge.reveal);
  this.b(135,138,240,74,'← 所有人物',()=>{this.personId=null;this.draw();});
  this.actor(p.id,P?360:300,P?381:348,P?330:355);
  const x=P?360:888;
  this.label(x,P?605:224,`${p.name} · ${p.role}`,35,P?610:635);
  this.panel(x,P?761:352,P?640:660,P?230:183,C.card,C.gold);
  const quote=corrected?this.file.clues.find(e=>e.id===p.challenge.reveal).text:p.claim;
  this.label(x,P?761:352,heard?quote:'先聽聽他的說法，再決定是否需要追問。',P?29:28,P?575:590);
  this.b(x,P?963:499,P?620:625,84,heard?'重讀完整證詞':'聽取證詞',()=>this.act('talk',{id:p.id}),C.green);
  if(heard)this.b(x,P?1070:593,P?620:625,84,'出示證據，追問這句話',()=>this.picker('選擇出示的證據',id=>this.act('present',{id:p.id,evidence:id})),C.gold);
 }
 evidenceList(){return ordered(this.file.clues.filter(e=>this.run.evidence.includes(e.id)),this.run.seed);}
 drawEvidence(){
  const P=this.portrait,items=this.evidenceList(),per=6,pages=Math.max(1,Math.ceil(items.length/per));this.page=Math.min(this.page,pages-1);
  this.label(this.W/2,136,'點卡片詳讀；選兩張建立關聯。',29);
  if(!items.length){this.owl(this.W/2,this.H*.42,240);this.label(this.W/2,this.H*.62,'證據本還是空的。\n到調查地點看看，或聽聽角色的證詞。',29);return;}
  items.slice(this.page*per,(this.page+1)*per).forEach((e,i)=>{
   const x=P?190+(i%2)*340:230+(i%3)*410,y=P?289+Math.floor(i/2)*207:259+Math.floor(i/3)*160;
   const box=this.b(x,y,P?310:380,P?175:140,'',()=>this.clueDetail(e,true),this.selected.includes(e.id)?C.gold:C.card);
   box.add(this.text(0,P?-49:-39,`${this.selected.includes(e.id)?'✓ ':''}${e.kind}`,21,C.muted));box.add(this.label(0,P?0:-1,e.name,P?28:26,P?270:340));box.add(this.text(0,P?57:45,'點選詳讀',21,C.muted));
  });
  const names=this.selected.map(id=>this.file.clues.find(e=>e.id===id).name);
  this.label(this.W/2,P?889:531,names.length?names.join(' ＋ '):'尚未選取關聯線索',P?25:24,this.W-100,'#edc47e');
  this.b(this.W*.19,P?1005:579,P?210:200,78,'← 上頁',()=>{this.page=(this.page-1+pages)%pages;this.draw();});
  this.b(this.W/2,P?1005:579,P?270:530,78,`連結 ${this.selected.length} / 2`,()=>{const r=this.act('combine',{ids:this.selected},false);if(!r)return;if(r.evidence)this.selected=[];this.draw();if(r.evidence)this.evidenceNotice(r);else this.notice('偵探筆記',r.feedback);},C.gold);
  this.b(this.W*.81,P?1005:579,P?210:200,78,'下頁 →',()=>{this.page=(this.page+1)%pages;this.draw();});
  this.text(this.W/2,P?1118:175,`${this.page+1} / ${pages} 頁　·　線索不會被消耗`,P?22:19,C.muted);
 }
 clueDetail(e,select=false){
  const box=this.dialog(`${e.kind}｜${e.name}`,e.text);
  if(select)box.add(this.b(this.W/2,this.H*.7,this.W-180,88,this.selected.includes(e.id)?'取消選取':'選作關聯線索',()=>{if(this.selected.includes(e.id))this.selected=this.selected.filter(id=>id!==e.id);else if(this.selected.length<2)this.selected.push(e.id);else this.selected=[this.selected[1],e.id];this.draw();},C.gold,true));
  this.modalClose(box);
 }
 drawExperiment(){
  const P=this.portrait,e=this.file.experiment;
  if(!e){this.owl(this.W/2,this.H*.4,270);this.label(this.W/2,this.H*.65,'這封邀請不需要機械實驗。\n連結證據，安排節慶的先後順序吧。',30);return;}
  const missing=e.requires.filter(id=>!this.run.evidence.includes(id));
  this.label(this.W/2,141,e.title,34);
  if(missing.length){this.owl(this.W/2,P?444:315,230);this.label(this.W/2,P?727:507,'先取得這些記錄，再建立有根據的模型：\n'+missing.map(id=>this.file.clues.find(c=>c.id===id).name).join('、'),29,this.W-180);return;}
  this.label(this.W/2,P?259:211,e.description,P?28:25,this.W-110,C.muted);
  const n=e.controls.length;
  e.controls.forEach((ctrl,i)=>{
   const x=P?360:(i+.5)*this.W/n,y=P?479+i*178:349;
   this.text(x,y-48,ctrl.label,28,C.muted);
   this.b(x,y+23,P?630:this.W/n-34,90,ctrl.options[this.values[i]||0]+'　↻',()=>{this.values[i]=((this.values[i]||0)+1)%ctrl.options.length;this.draw();},C.green);
  });
  this.label(this.W/2,P?977:493,'每次只改一個條件，比較結果更容易找出原因。',24,this.W-140,'#edc47e');
  this.b(this.W/2,P?1080:579,P?630:690,78,'啟動模型 · 觀察結果',()=>this.runExperiment(),C.gold);
 }
 runExperiment(){
  const r=this.act('experiment',{values:this.values},false);if(!r)return;
  this.draw();const box=this.dialog(r.evidence?'現場重建成功':'模型觀察',r.feedback);
  // Three moving signals visualize the controlled experiment, not an unrelated success flash.
  const y=this.portrait?800:445,start=this.W*.25,end=this.W*.75;
  const labels=this.file.id==='moonfish'?['養池','底道','蘆葦灣']:this.file.id==='midnight'?['北風','風輪','鈴聲']:['重量','鏡像','紋路'];
  labels.forEach((t,i)=>{const x=start+(end-start)*i/2;box.add(this.panel(x,y,this.portrait?180:250,75,C.green,C.gold));box.add(this.text(x,y,t,26));});
  const dot=this.add.circle(start,y-64,11,0xffdc87);box.add(dot);this.tweens.add({targets:dot,x:r.evidence?end:this.W/2,duration:1500,yoyo:true,repeat:1});
  if(this.file.id==='midnight')this.playModelSound();else if(r.evidence)this.tone('finish');this.modalClose(box,r.evidence?'記入證據本':'調整條件再試');
 }
 drawReason(){
  const P=this.portrait;
  [['questions','提出推理'],['timeline','重排事件'],['ending','結案報告']].forEach(([id,label],i)=>this.b((i+.5)*this.W/3,138,this.W/3-18,77,label,()=>{this.proofTab=id;this.draw();},this.proofTab===id?C.gold:C.card));
  if(this.proofTab==='questions')this.drawQuestion();else if(this.proofTab==='timeline')this.drawTimeline();else this.drawReport();
 }
 drawQuestion(){
  const P=this.portrait,qs=this.file.deductions,q=qs[this.question];
  const draft=this.drafts[q.id]||(this.drafts[q.id]={answer:null,proofs:[null,null]});
  this.label(this.W/2,P?252:221,`${this.question+1}/${qs.length}　${q.q}${this.run.proven.includes(q.id)?' ✓':''}`,P?31:29,this.W-100);
  const opts=ordered(q.options.map((t,i)=>({t,i})),this.run.seed+this.question);
  opts.forEach(({t,i},row)=>this.b(P?360:345,P?390+row*115:300+row*91,P?640:620,85,`${draft.answer===i?'✓ ':''}${t}`,()=>{draft.answer=i;this.draw();},draft.answer===i?C.green:C.card));
  if(!P)this.text(978,285,'支持結論的兩份證據',27,C.muted);
  draft.proofs.forEach((id,i)=>{
   const name=id?this.file.clues.find(e=>e.id===id).name:`選擇證據 ${i+1}`;
   this.b(P?360:978,P?764+i*111:364+i*112,P?640:500,91,name,()=>this.picker(`支持結論的證據 ${i+1}`,id=>{draft.proofs[i]=id;this.draw();}),id?C.green:C.card);
  });
  this.b(this.W/2,P?1001:579,P?640:650,78,'提交這項推理',()=>this.act('prove',{id:q.id,answer:draft.answer,proofs:draft.proofs}),C.gold);
  this.b(P?195:160,P?1110:579,P?310:270,76,'← 上一項',()=>{this.question=(this.question-1+qs.length)%qs.length;this.draw();});
  this.b(P?525:1120,P?1110:579,P?310:270,76,'下一項 →',()=>{this.question=(this.question+1)%qs.length;this.draw();});
 }
 drawTimeline(){
  const P=this.portrait;
  this.label(this.W/2,216,'依先後排列：點選兩張事件卡交換位置。',P?27:26);
  this.run.timeline.forEach((id,i)=>{
   const t=this.file.timeline.find(t=>t.id===id),has=this.run.evidence.includes(t.evidence),e=this.file.clues.find(e=>e.id===t.evidence);
   const y=P?356+i*170:287+i*77;
   const b=this.b(this.W/2,y,this.W-90,P?142:68,'',()=>{if(!this.swapId){this.swapId=id;this.draw();}else{this.act('swap',{a:this.swapId,b:id},false);this.swapId=null;this.draw();}},this.swapId===id?C.gold:C.card);
   b.add(this.label(0,P?-26:-13,`${i+1}. ${t.text}`,P?29:25,this.W-140));
   b.add(this.label(0,P?33:19,`${has?'參考':'尚缺'}：${e.name}`,P?23:20,this.W-140,has?C.muted:'#efba86'));
  });
  this.b(this.W/2,P?1090:579,this.W-120,78,this.run.timelineSolved?'✓ 再次核對時間線':'核對事件順序',()=>{this.swapId=null;this.act('timeline');},C.gold);
 }
 drawReport(){
  const P=this.portrait,r=this.run,c=this.file;
  this.owl(P?360:290,P?393:379,P?225:265);
  const x=P?360:851,y=P?624:304;
  this.label(x,y,`推理成立　${r.proven.length} / ${c.deductions.length}\n時間線　${r.timelineSolved?'已核對':'待完成'}\n線索收集　${r.evidence.length} / ${c.clues.length}`,30,P?610:665);
  this.label(x,P?820:443,'完成推理與時間線即可結案。\n找齊全部線索，可解鎖完整真相。\n提示與錯誤嘗試不會降低結局。',P?27:25,P?610:670,C.muted);
  this.b(this.W/2,P?1049:579,this.W-180,78,'提交結案報告',()=>this.act('finish'),C.gold);
 }
 ending(level){
  const c=this.file,box=this.dialog(level===2?'完整真相，終於拼齊了！':'案件告一段落',level===2?c.full:c.normal);
  box.add(this.add.circle(this.W/2,this.portrait?739:421,57,C.gold));
  box.add(this.add.star(this.W/2,this.portrait?739:421,5,22,43,0xffdf8d));
  box.add(this.label(this.W/2,this.portrait?838:492,`已收藏「${c.badge}」`,29,this.W-140,'#ffd787'));
  box.add(this.b(this.W*.28,this.H-118,this.W*.4,84,'繼續補查',()=>this.draw(),C.green,true));
  box.add(this.b(this.W*.72,this.H-118,this.W*.4,84,'返回案件冊',()=>{this.caseId=null;this.draw();},C.gold,true));
  for(let i=0;i<12;i++){const star=this.add.star(this.W/2+(i-6)*35,this.portrait?770:450,4,3,8+i%3*3,0xffe1a1);box.add(star);this.tweens.add({targets:star,y:star.y-90-i%4*20,alpha:0,duration:1300+i*100});}
  this.tone('finish');
 }
 picker(title,onPick,page=0){
  const items=this.evidenceList(),P=this.portrait,per=6,pages=Math.max(1,Math.ceil(items.length/per));page=Math.min(page,pages-1);
  const box=this.dialog(title,items.length?'點選一張已取得的證據。':'證據本還是空的，先去調查吧。');
  items.slice(page*per,(page+1)*per).forEach((e,i)=>{
   const x=P?195+(i%2)*330:263+(i%3)*377,y=P?473+Math.floor(i/2)*166:306+Math.floor(i/3)*108;
   box.add(this.b(x,y,P?298:350,P?143:96,e.name,()=>{this.closeModal();onPick(e.id);},C.green,true));
  });
  box.add(this.b(this.W*.22,this.H-217,this.W*.27,76,'← 上頁',()=>this.picker(title,onPick,(page-1+pages)%pages),C.card,true));
  box.add(this.text(this.W/2,this.H-217,`${page+1}/${pages}`,27));
  box.add(this.b(this.W*.78,this.H-217,this.W*.27,76,'下頁 →',()=>this.picker(title,onPick,(page+1)%pages),C.card,true));this.modalClose(box,'取消');
 }
 dialog(title,body){
  this.closeModal();const P=this.portrait,box=this.add.container(0,0).setDepth(3000);this.modal=box;
  box.add(this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x04131d,.91).setInteractive());
  box.add(this.panel(this.W/2,this.H/2,this.W-42,this.H-50,C.ink,C.gold,28));
  box.add(this.label(this.W/2,P?141:103,title,P?34:33,this.W-110,'#ffdda0'));
  box.add(this.label(this.W/2,P?310:233,body,P?29:27,this.W-140,C.muted));return box;
 }
 modalClose(box,label='繼續調查'){box.add(this.b(this.W/2,this.H-115,this.W-180,84,label,()=>this.closeModal(),C.card,true));}
 closeModal(){this.modal?.destroy();this.modal=null;this.stopTones();}
 notice(title,body,label='繼續調查'){const c=this.dialog(title,body);this.modalClose(c,label);}
 evidenceNotice(r){const c=this.dialog(`${r.type==='evidence'?'新線索':'線索筆記'}｜${r.evidence.name}`,r.feedback);c.add(this.add.star(this.W/2,this.portrait?722:432,4,20,47,0xe8bc6b));c.add(this.text(this.W/2,this.portrait?873:525,'已記入證據本，可隨時回顧',26,C.muted));this.modalClose(c);if(r.type==='evidence')this.tone('correct');}
 playModelSound(){
  const ctx=this.sound.context;if(!preferences.value.sfx||this.sound.mute||!ctx||ctx.state!=='running'||!this.values[0])return;
  const phrase=[[392,0,1.1]];if(this.values[1]&&this.values[2])phrase.push([1046,1.2,.25],[1318,1.65,.3]);
  const notes=[...phrase,...phrase.map(([f,t,d])=>[f,t+6,d])];
  for(const [frequency,delay,duration] of notes){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;osc.type='sine';osc.frequency.value=frequency;
   gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(Math.max(.001,.055*this.sound.volume),at+.05);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
   osc.connect(gain);gain.connect(ctx.destination);this.audioNodes.add(osc);osc.onended=()=>{this.audioNodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.03);
  }
 }
 tone(kind){if(preferences.value.sfx)super.tone(kind);}
 leave(){if(this.busy)return;const target=this.scene.manager.keys[this.returnScene]?this.returnScene:'MiniGameHub';SaveSystem.saveFromRegistry(this.registry);this.busy=true;this.scene.start(target);}
 update(){}
}
