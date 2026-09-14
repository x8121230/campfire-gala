import PlatformStorage from './PlatformStorage.js';
export const PREFERENCE_KEY='forest_preferences_v1';
export function normalizePreferences(value={}){return {music:value.music!==false,sfx:value.sfx!==false,voice:value.voice!==false};}
export function soundCategory(key,loop=false){return loop||/bgm|music/i.test(String(key))?'music':'sfx';}
export const preferences={
 value:normalizePreferences(),
 load(){try{const raw=PlatformStorage.getItem(PREFERENCE_KEY);this.value=normalizePreferences(raw?JSON.parse(raw):JSON.parse(PlatformStorage.getItem('forest_save_data')||'{}').wardrobe_audio||{});}catch(e){this.value=normalizePreferences();}return this.value;},
 set(kind,value){if(!['music','sfx','voice'].includes(kind))throw Error('未知聲音設定');const next={...this.value,[kind]:!!value},text=JSON.stringify(next);
  if(typeof window!=='undefined'){if(!globalThis.localStorage)throw Error('裝置不允許保存設定');globalThis.localStorage.setItem(PREFERENCE_KEY,text);}
  PlatformStorage.setItem(PREFERENCE_KEY,text);this.value=next;return next;
 }
};
export function applySoundPreferences(manager){for(const sound of manager.sounds||[])sound.setMute?.(!preferences.value[soundCategory(sound.key,sound.loop)]);}
export function installSoundPreferences(manager){
 if(manager.adventurePreferencesInstalled)return;manager.adventurePreferencesInstalled=true;
 const add=manager.add;manager.add=function(...args){const sound=add.apply(this,args),play=sound.play; sound.play=function(...values){this.setMute?.(!preferences.value[soundCategory(this.key,this.loop)]);const result=play.apply(this,values);this.setMute?.(!preferences.value[soundCategory(this.key,this.loop)]);return result;};return sound;};
 applySoundPreferences(manager);
}
