import {RealmApp} from './RealmApp.js';
import {StarForestWorld} from './StarForestWorld.js';
import {StarJourney,SAVE_KEY,SPOTS,APPLES,PATHS,TREES,AUTO_NPCS,terrainHeight,screenToWorld,zoneAt,distance} from './StarForestRules.js';

const SPELL_ICONS = {
 bubble:'<circle cx="19" cy="24" r="12" fill="#d7f6e8"/><circle cx="36" cy="13" r="7" fill="#ecfaf0"/><path d="M12 22a8 8 0 0 1 8-7"/><circle cx="36" cy="36" r="4" fill="#ffe7aa"/>',
 honey:'<path d="M15 12h20v7l4 7v13q0 4-4 4H15q-4 0-4-4V26l4-7z" fill="#f5cd7c"/><path d="M15 12h20v6H15z" fill="#fff0c6"/><path d="M12 26q5-6 9 0t8 0t9 0"/><path d="M24 27q-9 9 0 12q9-3 0-12z" fill="#ffe8a2"/>',
 dash:'<path d="M12 44L30 15M12 20q-8-7-9 1M35 29q10-2 11-10M19 37q17 2 23-8" fill="none"/><path d="M30 15L20 8M30 15L30 3M30 15L41 8M30 15L44 18M30 15L18 20"/><circle cx="30" cy="15" r="4" fill="#fff0c4"/>',
 elephant:'<ellipse cx="26" cy="24" rx="13" ry="12" fill="#d3e2ea"/><ellipse cx="15" cy="23" rx="9" ry="11" fill="#e8d5df"/><path d="M35 20q10 2 9 13q0 9-8 8l-3-6q5 2 5-3l-5-3" fill="#d3e2ea"/><circle cx="30" cy="20" r="2" fill="#4b626d"/><path d="M21 34v8M29 35v7"/>'
};
export class StarForestApp extends RealmApp {
 buildUI(){
  let saved;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{}
  this.journey=new StarJourney(saved);this.attacking=false;this.skillButtons={};this.root.classList.add('realm-app','star-forest');
  this.el('style').textContent=`
  .star-forest{position:fixed;inset:0;z-index:10000;overflow:hidden;background:#83b6a2;color:#fff4d8;font:600 16px "Microsoft JhengHei","Noto Sans CJK TC",sans-serif;touch-action:none;user-select:none;isolation:isolate}
  .star-forest *{box-sizing:border-box}.star-forest canvas.world{width:100%;height:100%;display:block}
  .star-forest button{font:inherit;color:inherit;cursor:pointer;border:1px solid #e1d3a766;background:#244d43ec;border-radius:14px;min-height:44px;padding:9px 15px;touch-action:none;-webkit-tap-highlight-color:transparent}
  .star-forest button:focus-visible{outline:3px solid #ffe5a0;outline-offset:3px}.star-forest button:active{transform:scale(.94)}.star-forest button:disabled{opacity:.56;cursor:default}
  .star-forest .top{position:absolute;top:max(16px,env(safe-area-inset-top));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));display:flex;justify-content:space-between;align-items:start;pointer-events:none;gap:14px}
  .star-forest .brand{background:linear-gradient(130deg,#173f38ef,#345e4ae5);border:1px solid #e6d29d55;border-radius:22px;padding:15px 21px;max-width:53%;box-shadow:0 8px 30px #163c3826}
  .star-forest .eyebrow{font-size:10px;letter-spacing:3px;color:#d5d4ae}.star-forest h1{font-size:28px;font-weight:800;margin:4px 0 7px;letter-spacing:3px}.star-forest .objective{font-size:14px;color:#fff0c4;line-height:1.5}.star-forest .statusline{font-size:12px;color:#c0d3b7;margin-top:8px;display:flex;gap:15px}.star-forest .energy{color:#f9d594;letter-spacing:2px}
  .star-forest .topright{display:flex;flex-direction:column;align-items:end;gap:9px;pointer-events:auto}.star-forest .topnav{display:flex;gap:7px}.star-forest .topnav button{font-size:13px;padding:8px 13px;background:#214d43e8}.star-forest .minimap{width:174px;height:112px;padding:0;overflow:hidden;border:2px solid #e2d0a0aa;border-radius:18px;box-shadow:0 4px 20px #254d4030}.star-forest .minimap canvas{width:100%;height:100%;display:block}
  .star-forest .joy{position:absolute;left:max(34px,env(safe-area-inset-left));bottom:max(32px,env(safe-area-inset-bottom));width:132px;height:132px;border:2px solid #faf1c778;border-radius:50%;background:radial-gradient(circle,#fff7d512,#255b4955);box-shadow:0 5px 20px #244c3d20,inset 0 0 0 12px #fcf5d508;touch-action:none}
  .star-forest .knob{position:absolute;left:36px;top:36px;width:56px;height:56px;border-radius:50%;border:2px solid #fff0c2;background:linear-gradient(140deg,#e9e7be,#accbb0);box-shadow:0 4px 12px #23483840;pointer-events:none}.star-forest .joylabel{position:absolute;bottom:-23px;left:0;width:100%;text-align:center;font-size:11px;text-shadow:0 1px 4px #244c3d;pointer-events:none}
  .star-forest .actions{position:absolute;right:max(27px,env(safe-area-inset-right));bottom:max(25px,env(safe-area-inset-bottom));width:254px;height:195px}
  .star-forest .skill{position:absolute;border-radius:50%;width:76px;height:76px;padding:4px;background:radial-gradient(circle at 35% 20%,#688d70,#234f44);border:2px solid #e9d7a67d;box-shadow:0 6px 20px #1c46364d;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;font-size:12px;overflow:hidden}
  .star-forest .skill .icon{font-size:24px;margin-bottom:4px;display:flex}.star-forest .skill .icon svg{width:35px;height:35px}.star-forest .skill.bubble .icon svg{width:45px;height:45px}.star-forest .skill .cooldown{position:absolute;inset:0;display:grid;place-items:center;background:#173f38b8;color:#fff1c5;font-size:26px;border-radius:50%;pointer-events:none}.star-forest .skill .cooldown:empty{display:none}
  .star-forest .skill.bubble{right:0;bottom:0;width:110px;height:110px;background:radial-gradient(circle at 30% 20%,#b9e4d3,#528d80 70%);border:3px solid #f0e4b3;color:#163f38;font-size:16px}.star-forest .skill.bubble .icon{font-size:34px}.star-forest .skill.honey{right:108px;bottom:87px;background:radial-gradient(circle at 35% 20%,#dcc88a,#8c804f)}.star-forest .skill.dash{right:142px;bottom:0}.star-forest .skill.elephant{right:13px;bottom:119px;background:radial-gradient(circle at 35% 20%,#a8adc5,#686f99)}
  .star-forest .interaction{position:absolute;bottom:max(41px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);background:#f1ddb0;color:#355448;border:2px solid #fff1c9;box-shadow:0 5px 18px #22483930;max-width:36%;font-size:14px}.star-forest .interaction:active{transform:translateX(-50%) scale(.96)}.star-forest .interaction[hidden]{display:none}
  .star-forest .helpbar{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font-size:11px;color:#fff6d6;text-shadow:0 1px 4px #214838;white-space:nowrap;pointer-events:none}
  .star-forest .toast{position:absolute;top:27%;left:50%;transform:translateX(-50%);background:#204b3fec;border:1px solid #e7d5a5aa;border-radius:16px;padding:12px 22px;max-width:58%;text-align:center;font-size:15px;opacity:0;transition:opacity .15s;pointer-events:none;box-shadow:0 6px 20px #24483c20}
  .star-forest .eventbar{position:absolute;top:44%;left:50%;transform:translateX(-50%);background:#f6e4b8ed;color:#526047;border-radius:15px;padding:9px 17px;font-size:14px;pointer-events:none;white-space:nowrap}.star-forest .escortbar{position:absolute;left:22px;top:180px;max-width:250px;padding:8px 13px;border-radius:12px;background:#224f44d9;font-size:13px;pointer-events:none}
  .star-forest .modal{position:absolute;inset:0;background:#153c36b0;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(5px)}.star-forest .card{width:min(770px,94%);max-height:96%;overflow:auto;border-radius:28px;border:2px solid #d6c69a;background:linear-gradient(135deg,#fcf4db,#ecebd4);color:#355749;padding:29px 35px;box-shadow:0 20px 80px #14393280}.star-forest h2{font-size:28px;margin:0 0 14px;letter-spacing:1px}.star-forest .body{font-size:17px;line-height:1.85;white-space:pre-line}.star-forest .choices{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.star-forest .choices button{flex:1;min-width:115px;background:#406b55;color:#fff5d6;min-height:48px}.star-forest .mapcard{width:min(970px,96%);padding:20px 25px}.star-forest .atlas{display:block;width:100%;object-fit:contain;max-height:53vh;border-radius:18px;aspect-ratio:1.8;background:#7da48b}.star-forest .mapnote{font-size:13px;color:#627764;margin-top:10px;line-height:1.6}.star-forest .loading{position:absolute;inset:0;display:grid;place-items:center;background:#214d42;font-size:23px}.star-forest .rotate{position:absolute;inset:0;z-index:8;background:#214d42f5;display:none;align-items:center;justify-content:center;text-align:center;padding:35px;font-size:23px;line-height:1.8;white-space:pre-line}
  @media(max-height:500px){.star-forest .top{top:8px;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right))}.star-forest .brand{padding:9px 13px;border-radius:17px;max-width:52%}.star-forest .eyebrow{font-size:8px;letter-spacing:2px}.star-forest h1{font-size:20px;margin:2px 0 4px}.star-forest .objective{font-size:11px}.star-forest .statusline{font-size:10px;margin-top:4px;gap:8px}.star-forest .topnav button{font-size:11px;min-height:38px;padding:7px 10px}.star-forest .minimap{width:130px;height:83px}.star-forest .topright{gap:6px}.star-forest .joy{width:108px;height:108px;left:max(23px,env(safe-area-inset-left));bottom:26px}.star-forest .knob{left:29px;top:29px;width:46px;height:46px}.star-forest .joylabel{font-size:10px;bottom:-19px}.star-forest .actions{width:220px;height:156px;right:max(16px,env(safe-area-inset-right));bottom:17px}.star-forest .skill{width:62px;height:62px;font-size:10px}.star-forest .skill .icon{font-size:21px;margin-bottom:2px}.star-forest .skill .icon svg{width:27px;height:27px}.star-forest .skill.bubble .icon svg{width:35px;height:35px}.star-forest .skill.bubble{width:90px;height:90px;font-size:13px}.star-forest .skill.bubble .icon{font-size:29px}.star-forest .skill.honey{right:91px;bottom:72px}.star-forest .skill.dash{right:123px}.star-forest .skill.elephant{right:9px;bottom:96px}.star-forest .interaction{bottom:32px;font-size:11px;padding:8px 12px;min-height:40px;max-width:36%}.star-forest .helpbar{font-size:9px;bottom:7px}.star-forest .toast{font-size:12px;padding:9px 15px;top:35%}.star-forest .eventbar{font-size:11px;top:51%;padding:6px 12px}.star-forest .escortbar{top:130px;left:12px;font-size:10px;max-width:200px}.star-forest .modal{padding:12px}.star-forest .card{padding:19px 25px;border-radius:22px}.star-forest h2{font-size:22px;margin-bottom:10px}.star-forest .body{font-size:14px;line-height:1.6}.star-forest .choices{margin-top:14px;gap:9px}.star-forest .choices button{font-size:13px;min-height:42px}.star-forest .mapcard{padding:14px 20px}.star-forest .atlas{max-height:49vh}.star-forest .mapnote{font-size:11px;margin-top:5px}}
  `;
  this.canvas=this.el('canvas','world');this.canvas.setAttribute('aria-label','星之森 3D 童話探索地圖');
  const top=this.el('div','top'),brand=this.el('div','brand','',top);this.el('div','eyebrow','STARWOOD TALES / 星芽谷・第一章',brand);this.el('h1','','星之森',brand);this.objective=this.el('div','objective','',brand);
  const status=this.el('div','statusline','',brand);this.energy=this.el('span','energy','',status);this.zone=this.el('span','','橡果樹屋村',status);
  const right=this.el('div','topright','',top),nav=this.el('div','topnav','',right);this.button('手帳',()=>this.journal(),nav);this.button('地圖',()=>this.atlas(),nav);this.button('暫停',()=>this.pause(),nav);
  const mini=this.button('',()=>this.atlas(),right,'minimap');mini.setAttribute('aria-label','打開星之森地圖');this.mini=this.el('canvas','','',mini);this.mini.width=348;this.mini.height=224;
  this.toast=this.el('div','toast');this.eventbar=this.el('div','eventbar');this.eventbar.hidden=true;this.escortbar=this.el('div','escortbar');this.escortbar.hidden=true;
  this.joy=this.el('div','joy');this.joy.setAttribute('aria-label','移動搖桿');this.knob=this.el('div','knob','',this.joy);this.el('div','joylabel','拖曳移動',this.joy);
  const actions=this.el('div','actions');
  for(const [id,icon,label,tip]of [['honey','♧','蜂蜜糖罐','Q · 輕點自動投擲，拖曳選落點'],['dash','✧','蒲公英','Space · 朝移動方向滑步'],['elephant','♬','大象水車','R · 朝面前噴射彩虹'],['bubble','◌','星光泡泡','J · 按住自動連射']]){
   const b=this.button('',()=>{},actions,`skill ${id}`);const iconElement=this.el('span','icon','',b);iconElement.innerHTML=`<svg viewBox="0 0 50 50" width="36" height="36" aria-hidden="true" fill="none" stroke="#596d61" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SPELL_ICONS[id]}</svg>`;this.el('span','label',label,b);b.title=tip;b.setAttribute('aria-label',label);this.skillButtons[id]={button:b,counter:this.el('span','cooldown','',b)};
  }
  this.interactButton=this.button('交談',()=>this.interact(),this.root,'interaction');this.el('div','helpbar','WASD 移動 · E 互動 · J 泡泡 · Q 蜂蜜 · 空白 滑步 · R 大象');
  this.loading=this.el('div','loading','正在打開星之森的故事書…');this.rotate=this.el('div','rotate','請把手機橫放\n左手移動，右手施放魔法。');this.bindInput();this.hud();
 }
 bindInput(){
  this.on(this.joy,'pointerdown',e=>{if(this.paused||this.joyId!==null)return;e.preventDefault();this.joyId=e.pointerId;this.joy.setPointerCapture(e.pointerId);this.joystick(e);});
  this.on(this.joy,'pointermove',e=>{if(e.pointerId===this.joyId)this.joystick(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.on(this.joy,type,e=>{if(e.pointerId===this.joyId)this.resetJoystick();});
  const attack=this.skillButtons.bubble.button;
  this.on(attack,'pointerdown',e=>{if(this.paused)return;e.preventDefault();attack.setPointerCapture(e.pointerId);this.attackId=e.pointerId;this.attacking=true;if(!this.journey.accepted)this.notify('先找村長領取星光魔法。');else if(!this.journey.nearestEnemy())this.notify('靠近搗蛋動物，再按住泡泡鍵。');});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.on(attack,type,e=>{if(e.pointerId===this.attackId){this.attacking=false;this.attackId=null;}});
  this.on(attack,'click',e=>{if(e.detail===0&&!this.paused)this.journey.cast('bubble');});
  for(const kind of ['dash','elephant'])this.on(this.skillButtons[kind].button,'click',()=>{if(!this.paused){this.journey.cast(kind);this.flush();}});
  const honey=this.skillButtons.honey.button;
  this.on(honey,'pointerdown',e=>{if(this.paused||this.honeyInput||this.journey.cooldowns.honey>0)return;e.preventDefault();honey.setPointerCapture(e.pointerId);this.honeyInput={id:e.pointerId,x:e.clientX,y:e.clientY,aim:null};});
  this.on(honey,'pointermove',e=>{const h=this.honeyInput;if(!h||h.id!==e.pointerId)return;const dx=e.clientX-h.x,dy=e.clientY-h.y,l=Math.hypot(dx,dy);if(l>12){const w=screenToWorld(dx/(l||1),dy/(l||1)),r=Math.min(7,l/12),p=this.journey.player;h.aim={x:p.x+w.x*r,z:p.z+w.z*r};this.world?.showAim(h.aim);}});
  this.on(honey,'pointerup',e=>{const h=this.honeyInput;if(!h||h.id!==e.pointerId)return;this.honeyInput=null;this.world?.showAim(null);if(!this.paused){this.journey.cast('honey',h.aim);this.flush();}});
  for(const type of ['pointercancel','lostpointercapture'])this.on(honey,type,()=>{this.honeyInput=null;this.world?.showAim(null);});
  this.on(honey,'click',e=>{if(e.detail===0&&!this.paused){this.journey.cast('honey');this.flush();}});
  this.on(window,'keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){if(!this.loading)this.modal?this.close():this.pause();return;}if(e.code==='KeyM'&&!this.loading){this.modal?this.close():this.atlas();return;}if(this.paused)return;this.keys.add(e.code);if(e.code==='KeyE')this.interact();if(e.code==='KeyQ')this.journey.cast('honey');if(e.code==='Space')this.journey.cast('dash');if(e.code==='KeyR')this.journey.cast('elephant');this.flush();});
  this.on(window,'keyup',e=>this.keys.delete(e.code));this.on(window,'blur',()=>this.pause());this.on(document,'visibilitychange',()=>{if(document.hidden)this.pause();});this.on(window,'resize',()=>this.resize());
  this.on(this.canvas,'webglcontextlost',e=>{if(this.dead)return;e.preventDefault();this.fatal=true;this.dialog('畫面暫時中斷','請返回遊戲列表再進入，已完成的委託會保留。',[['返回遊戲列表',()=>this.onExit()]]);});
 }
 clearInput(){this.resetJoystick();this.keys.clear();this.attacking=false;this.attackId=null;this.honeyInput=null;this.world?.showAim(null);}
 async start(){
  try{
   this.world=new StarForestWorld(this.canvas);await this.world.load();if(this.dead){this.world.dispose();return;}
   this.loading.remove();this.loading=null;this.resize();
   this.dialog('星之森：動物童話歷險','第一章 · 蘑菇林的好脾氣\n\n惡作劇流星落進森林，小動物變得愛生氣！\n阿晨晨，帶上星光泡泡，讓大家重新笑起來。\n\n左手搖桿移動，右手按住泡泡鍵自動連射。\n蜂蜜可拖曳瞄準，蒲公英滑步，大象噴彩虹。\n走到戴眼鏡的貓頭鷹村長旁邊，就會自動交談。',[[this.journey.accepted?'繼續我的旅程':'翻開第一頁',()=>this.close()]]);
   this.last=performance.now();this.frame=requestAnimationFrame(t=>this.tick(t));
  }catch(e){if(this.dead)return;this.fatal=true;this.world?.dispose();this.world=null;this.loading?.remove();this.loading=null;this.dialog('森林尚未成功載入','請完整覆蓋更新包，使用支援 WebGL 2 的瀏覽器，並沿用原遊戲啟動方式。',[['返回遊戲列表',()=>this.onExit()]]);console.error('Star Forest load failed',e);}
 }
 close(){if(this.fatal)return;super.close();}
 tick(t){
  if(this.dead)return;const dt=Math.min(.05,(t-this.last)/1000);this.last=t;let axis={x:0,y:0},moving=false;
  if(!this.paused){axis={x:this.axis.x+(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0),y:this.axis.y+(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)};const shots=this.journey.shotCount||0;moving=this.journey.update(dt,axis,this.attacking||this.keys.has('KeyJ'));if((this.journey.shotCount||0)>shots)this.onSound('send');this.flush();this.hud();const dialogue=this.journey.autoTalk();if(dialogue)this.presentDialogue(dialogue);}
  this.world?.render(this.journey,this.paused?0:dt,axis,moving);if(this.toastUntil&&t>this.toastUntil)this.toast.style.opacity='0';this.frame=requestAnimationFrame(n=>this.tick(n));
 }
 flush(){if(this.journey.dirty){this.save();this.journey.dirty=false;}if(this.journey.notices.length){const n=this.journey.notices.at(-1);this.journey.notices=[];this.notify(n.message);this.onSound(n.sound);}}
 save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.journey.export()));this.storageOK=true;}catch{this.storageOK=false;this.notify('目前無法保存進度；請先不要關閉此頁。');}}
 hud(){
  const j=this.journey;this.objective.textContent=j.objective();this.energy.textContent='★'.repeat(Math.ceil(j.energy))+'☆'.repeat(5-Math.ceil(j.energy));this.energy.setAttribute('aria-label',`星光 ${Math.ceil(j.energy)} / 5`);this.zone.textContent=zoneAt(j.player);
  const near=j.nearby();this.interactButton.hidden=!near||AUTO_NPCS.includes(near.id);this.interactButton.textContent=near?`E · ${near.name}`:'';
  for(const [kind,{button,counter}]of Object.entries(this.skillButtons)){const cd=j.cooldowns[kind];counter.textContent=kind!=='bubble'&&cd>.05?String(Math.ceil(cd)):'';button.setAttribute('aria-disabled',String(!j.accepted||cd>.05));}
  this.eventbar.hidden=!j.event;if(j.event)this.eventbar.textContent=`橡果大豐收　${Math.ceil(j.event.left)} 秒　·　你 ${j.event.count} / 松鼠 ${j.event.lost}`;
  this.escortbar.hidden=!j.escort;if(j.escort){const far=Math.max(...j.ducks.map(d=>distance(d,j.player)));this.escortbar.textContent=far>=7?'小鴨在後面等你，回頭接牠們吧。':'小鴨跟隨中 · 沿小路帶回東邊池塘';}
  if(!this.mapPaintAt||performance.now()-this.mapPaintAt>160){this.drawMap(this.mini,false);this.mapPaintAt=performance.now();}
 }
 interact(){if(this.paused)return;const near=this.journey.nearby();if(near&&AUTO_NPCS.includes(near.id))return;this.presentDialogue(this.journey.interact());}
 presentDialogue(r){this.flush();this.hud();if(r.title){this.onSound(this.journey.finished?'finish':'hint');this.dialog(r.title,r.message,[['繼續探索',()=>this.close()]]);}else if(r.message)this.notify(r.message);}
 pause(){if(this.dead||this.loading)return;this.clearInput();if(this.modal)return;this.dialog('在樹蔭下歇一會兒',`${this.journey.objective()}\n\n${this.storageOK?'已完成的委託會自動保存。':'目前無法保存，離開可能遺失進度。'}\n未完成的護送與限時活動，下次可重新挑戰。`,[['繼續探險',()=>this.close()],['返回遊戲列表',()=>{this.save();this.onExit();}]]);}
 journal(){
  if(this.loading)return;const j=this.journey;
  this.dialog('阿晨晨的童話手帳',`主線 · 蘑菇林的好脾氣\n${j.accepted?'✓':'○'} 走近樹屋村的貓頭鷹村長，自動交談\n${j.calm.length===8?'✓':'○'} 用泡泡安撫動物 ${j.calm.length}/8\n${j.apples.length===5?'✓':'○'} 到東方高坡採陽光蘋果 ${j.apples.length}/5\n${j.finished?'✓':'○'} 回村走近村長，獲得「森林好朋友」\n\n自由委託\n${j.escortDone?'✓ 溫柔領隊':'○ 小路上的三隻小鴨 → 東邊池塘的鴨媽媽'}\n金橡果風鈴：30 秒小挑戰，最高 ${j.eventBest} 顆\n\n魔法小提示\n泡泡：按住 J 或大按鍵，9 公尺內自動連射。\n蜂蜜：Q / 點按自動投擲；拖曳按鍵選落點，黏住 3 秒。\n蒲公英：空白鍵，沿移動方向滑步；不會穿越樹幹和水面。\n大象：R，往面前噴出扇形彩虹。\n走近居民會自動對話；關閉後需走開再靠近才會重開。\n星光耗盡會回村休息，已完成進度保留。`,[['繼續探索',()=>this.close()],['重玩第一章',()=>this.dialog('重新翻開第一頁？','只清除星之森第一章的任務與紀念章。原星芽谷、衣櫃和其他遊戲的進度都會保留。',[['取消',()=>this.journal()],['確認重玩',()=>{this.journey=new StarJourney();this.save();this.hud();this.world.target.set(-29,0,5);this.close();}]])]]);
 }
 atlas(){
  if(this.loading)return;const card=this.dialog('星芽谷 · 森林旅行圖','',[['回到森林',()=>this.close()]]);card.classList.add('mapcard');const map=this.el('canvas','atlas','',card);map.width=1440;map.height=800;card.insertBefore(map,card.querySelector('.choices'));const note=this.el('div','mapnote','金色圓點：陽光蘋果　珊瑚圓點：搗蛋動物　星星：阿晨晨　虛線：後續旅程\n本章開放村莊、蘑菇林、蘋果坡與小池塘；泡泡泥沼／月亮湖尚未開放。',card);card.insertBefore(note,card.querySelector('.choices'));this.drawMap(map,true);
 }
 drawMap(canvas,full){
  const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;g.clearRect(0,0,w,h);g.fillStyle='#81a68c';g.fillRect(0,0,w,h);
  const X=x=>(x+40)/80*w,Y=z=>(z+30)/60*h;
  const ellipse=(x,z,rx,rz,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(X(x),Y(z),rx/80*w,rz/60*h,0,0,Math.PI*2);g.fill();};
  ellipse(-28,4,12,15,'#b1bd89');ellipse(24,-12,12,12,'#b5c78b');ellipse(12,19,8.5,6.4,'#6aabb2');ellipse(12,19,6,4,'#81bec0');
  g.lineCap='round';g.lineJoin='round';g.lineWidth=full?9:4;g.strokeStyle='#ddd1a0';
  for(const path of PATHS){g.beginPath();path.forEach(([x,z],i)=>i?g.lineTo(X(x),Y(z)):g.moveTo(X(x),Y(z)));g.stroke();}
  for(const [x,z,s]of TREES)ellipse(x,z,s*.7,s*.9,'#608c73');
  const dot=(x,z,color,r)=>{g.fillStyle=color;g.strokeStyle='#f8efcd';g.lineWidth=full?2:1;g.beginPath();g.arc(X(x),Y(z),r,0,Math.PI*2);g.fill();g.stroke();};
  this.journey.animals.filter(a=>a.anger>0).forEach(a=>dot(a.x,a.z,'#d99f91',full?7:3));APPLES.forEach((a,i)=>{if(!this.journey.apples.includes(i))dot(a.x,a.z,'#f7d779',full?8:3);});
  dot(-29,1,'#486d61',full?12:5);dot(-25,9,'#486d61',full?9:4);dot(1,6,'#fff0aa',full?7:3);dot(19,10,'#fff0aa',full?9:3);
  if(full){
   const label=(txt,x,z,size=25)=>{g.font=`bold ${size}px sans-serif`;g.textAlign='center';g.textBaseline='middle';const tw=g.measureText(txt).width;g.fillStyle='#234e43e8';g.beginPath();g.roundRect(X(x)-tw/2-16,Y(z)-21,tw+32,42,15);g.fill();g.fillStyle='#fff0c8';g.fillText(txt,X(x),Y(z));};
   label('橡果樹屋村',-27,-4);label('迷亂蘑菇林',-4,-18);label('陽光蘋果坡',25,-20);label('螢光小池塘',13,27,20);label('金橡果風鈴',-8,-10,18);label('小鴨起點',1,10,18);label('鴨媽媽',23,13,18);
   g.setLineDash([9,10]);g.strokeStyle='#f4e6b499';g.lineWidth=5;g.beginPath();g.moveTo(X(34),Y(7));g.lineTo(X(39),Y(0));g.moveTo(X(22),Y(-24));g.lineTo(X(27),Y(-29));g.stroke();g.setLineDash([]);label('月亮湖 · 待開放',23,-28,17);label('泥沼 · 待開放',31,1,17);
  }
  const p=this.journey.player;dot(p.x,p.z,'#fff6cf',full?12:6);g.fillStyle='#315c50';g.font=`bold ${full?22:13}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('★',X(p.x),Y(p.z)+1);
  if(!full){g.font='bold 15px sans-serif';g.textAlign='left';g.fillStyle='#fff1ce';g.fillText('N ↑',10,15);}
 }
}
