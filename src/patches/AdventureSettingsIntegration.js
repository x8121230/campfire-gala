import WorldMap from '../scenes/WorldMap.js';
import Start from '../scenes/Start.js';
import BootScene from '../scenes/BootScene.js';
import AnimalSnackGame from '../scenes/AnimalSnackGame.js';
import WardrobeAudio from '../systems/WardrobeAudio.js';
import CampfireGame from '../scenes/CampfireGame.js';
import ConstellationGame from '../scenes/ConstellationGame.js';
import {preferences,installSoundPreferences} from '../systems/AdventurePreferences.js';
const boot=BootScene.prototype.create;
BootScene.prototype.create=function(...args){preferences.load();installSoundPreferences(this.sound);
 const speech=globalThis.speechSynthesis;if(speech&&!speech.adventurePreferencesInstalled){const speak=speech.speak.bind(speech);speech.speak=function(...args){if(preferences.value.voice)return speak(...args);};speech.adventurePreferencesInstalled=true;}
 return boot.apply(this,args);};
for(const [Class,method]of [[AnimalSnackGame,'tone'],[CampfireGame,'playRainbowPerfectSfx'],[ConstellationGame,'playStarTone']]){const original=Class.prototype[method];if(original)Class.prototype[method]=function(...args){if(preferences.value.sfx)return original.apply(this,args);};}
const music=WardrobeAudio.prototype.startMusic,effect=WardrobeAudio.prototype.effect;
WardrobeAudio.prototype.startMusic=function(...args){this.prefs.music=preferences.value.music;if(this.prefs.music)return music.apply(this,args);};
WardrobeAudio.prototype.effect=function(...args){this.prefs.sfx=preferences.value.sfx;if(this.prefs.sfx)return effect.apply(this,args);};
const toggle=WardrobeAudio.prototype.toggle;
WardrobeAudio.prototype.toggle=function(kind){preferences.set(kind,!preferences.value[kind]);this.prefs[kind]=!preferences.value[kind];return toggle.call(this,kind);};
const unlock=WardrobeAudio.prototype.unlock;WardrobeAudio.prototype.unlock=function(...args){this.prefs={music:preferences.value.music,sfx:preferences.value.sfx};return unlock.apply(this,args);};

export function addAdventureGear(scene,isMap){
 const objects=[...(scene.children.list||[])];
 for(const o of objects){if(isMap&&o.text===scene.mapDisplayName){o.setPosition(1120,20).setOrigin(1,0).setFontSize(32);}if(o.texture?.key==='btn_setting'){scene.tweens.killTweensOf(o);o.destroy();}}
 const group=scene.add.container(1210,40).setDepth(1000);
 const icon=isMap&&scene.editBtn?scene.editBtn:scene.textures.exists('btn_edit')?scene.add.image(0,0,'btn_edit'):scene.add.text(0,0,'⚙',{fontSize:'52px',color:'#ddbd83'}).setOrigin(.5);
 scene.tweens.killTweensOf(icon);icon.removeAllListeners('pointerdown');icon.disableInteractive();icon.setPosition(0,0);icon.setDisplaySize?.(60,60);group.add(icon);
 const restore=()=>{if(scene.isEditMode)icon.setTint?.(0x00ff00);else icon.clearTint?.();};
 let opening=false;
 group.setSize(100,80).setInteractive({useHandCursor:true});
 group.on('pointerover',()=>icon.setTint?.(0xffdfa3));group.on('pointerout',()=>{if(!opening)restore();});
 group.on('pointerdown',()=>{if(opening||scene.isPopupOpen)return;opening=true;icon.setTint?.(0xffdfa3);
  const onShutdown=()=>scene.events.off('resume',onResume);
  const onResume=()=>{opening=false;restore();scene.events.off('shutdown',onShutdown);};
  scene.events.once('resume',onResume);scene.events.once('shutdown',onShutdown);
  scene.scene.launch('AdventureSettings',{hostKey:scene.sys.settings.key,mapID:scene.mapID});scene.scene.pause();
 });restore();
}
for(const [Class,isMap]of [[WorldMap,true],[Start,false]]){const create=Class.prototype.create;Class.prototype.create=function(...args){const r=create.apply(this,args);addAdventureGear(this,isMap);
 if(isMap){
  const entry=this.add.container(169,673).setDepth(1000);
  entry.add(this.add.rectangle(0,0,304,76,0x143b4b,.96).setStrokeStyle(2,0xd6bb7a));
  entry.add(this.add.text(0,0,'世界地圖 · 星光湖畔 →',{fontFamily:'Microsoft JhengHei, sans-serif',fontSize:'23px',color:'#fff2d2'}).setOrigin(.5));
  entry.setSize(304,76).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.isPopupOpen||this.isEditMode)return;this.scene.start('RegionAtlas');});
 }
 return r;};}
