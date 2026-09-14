import AnimalSnackGame from './AnimalSnackGame.js';
import {preferences} from '../systems/AdventurePreferences.js';
export default class PaperForestGame extends AnimalSnackGame{
 constructor(sceneKey='PaperForestGame'){super(sceneKey);}
 preload(){}
 update(){}
 create(){this.audioNodes=new Set();this.soundOn=true;this.realmDead=false;this.root=document.createElement('div');document.body.append(this.root);this.root.textContent='正在翻開幻界・星芽谷繪本…';this.root.style.cssText='position:fixed;inset:0;z-index:10000;background:#173e37;color:#fff0cf;display:block';
  this.events.once('shutdown',()=>{this.realmDead=true;this.app?.dispose();this.root?.remove();this.stopTones();});
  import('../adventure/AdventureApp.js').then(({AdventureApp:RealmApp})=>{if(this.realmDead)return;this.root.textContent='';this.app=new RealmApp(this.root,{onExit:()=>this.scene.start(this.returnScene||'MiniGameHub'),onSound:name=>{if(preferences.value.sfx){const ctx=this.sound.context;if(ctx?.state==='suspended')ctx.resume().then(()=>{if(!this.realmDead)this.tone(name);});else this.tone(name);}}});this.app.start();}).catch(e=>{if(this.realmDead)return;this.root.textContent='幻界繪本載入失敗，請完整覆蓋 src/adventure、src/paper-forest 與對應 assets。';const b=document.createElement('button');b.textContent='返回遊戲列表';b.onclick=()=>this.scene.start(this.returnScene||'MiniGameHub');this.root.append(b);console.error(e);});
 }
}
