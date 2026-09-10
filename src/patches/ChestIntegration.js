import Bush from '../scenes/BushMinesweeper.js';
import Shape from '../scenes/ShapeColorGame.js';
import Banqi from '../scenes/BushBanqiMiniGame.js';
import Memory from '../scenes/MemoryMatchGame.js';
import Animal from '../scenes/AnimalFoodMatch.js';
import BootScene from '../scenes/BootScene.js';
import Collection from '../scenes/Collection.js';
import MiniGameTestSession from '../systems/MiniGameTestSession.js';
import SaveSystem from '../systems/SaveSystem.js';
import {chestService,syncChestInventory} from '../systems/ForestChestService.js';
import {installChestHooks} from '../systems/ChestSceneHooks.js';

const finish=MiniGameTestSession.finish;
const openTests=Collection.prototype.openTests;
Collection.prototype.openTests=function(){
 if(this.modal)return;
 openTests.call(this);
 this.modal?.list?.find(o=>o.text==='測試送裝備')?.setText('裝備與寶箱測試');
 this.modal?.list?.find(o=>typeof o.text==='string'&&o.text.startsWith('測試會改變目前存檔'))?.setText('測試會改變存檔；寶箱不占用首勝與保底。');
 if(this.modal)this.button(this.modal,385,312,510,48,'獲得寶箱／補滿愛心',()=>{
  this.closeModal();this.events.once('resume',()=>{syncChestInventory(this.registry);this.render();});
  this.scene.launch('ChestTestTools',{hostKey:this.sys.settings.key});this.scene.pause();
 },0x94713f,'#ffffff','chest-test-tools');
};
MiniGameTestSession.finish=function(registry){const result=finish.call(this,registry);try{syncChestInventory(registry);}catch(e){console.warn(e.message);}return result;};
// Older save adapters omit this existing wardrobe field during registry hydration.
const apply=SaveSystem.applyToRegistry;
SaveSystem.applyToRegistry=function(registry){const result=apply.call(this,registry);try{syncChestInventory(registry);}catch(e){console.warn(e.message);}return result;};
const boot=BootScene.prototype.create;
BootScene.prototype.create=function(...args){const result=boot.apply(this,args);try{syncChestInventory(this.registry);}catch(e){console.warn(e.message);}return result;};
function notify(scene,result){
 if(result.status==='chest'){
  const hostKey=scene.sys.settings.key;
  scene.scene.launch('ChestRewardCelebration',{hostKey,reward:result,soundOn:scene.soundOn!==false});
  scene.scene.pause();return;
 }
 scene.chestNotice?.destroy();
 const text=result.status==='chest'?'獲得寶箱！已放進寶箱架':result.status==='miss'?`這次未掉箱 · 保底進度 ${result.misses}/3`: `寶箱未存入：${result.message}`;
 const box=scene.add.container(640,58).setDepth(30000);
 box.add(scene.add.rectangle(0,0,1100,96,0x244c3b,.98).setStrokeStyle(3,0xe8c777));
 box.add(scene.add.text(-100,0,text,{fontFamily:'Microsoft JhengHei, sans-serif',fontSize:'27px',color:'#fff3ce',wordWrap:{width:820}}).setOrigin(.5));
 const close=scene.add.rectangle(460,0,160,88,0x698a59).setInteractive({useHandCursor:true});box.add(close);
 box.add(scene.add.text(460,0,result.status==='error'?'重試':'知道了',{fontFamily:'Microsoft JhengHei, sans-serif',fontSize:'26px',color:'#ffffff'}).setOrigin(.5));
 close.on('pointerdown',()=>{box.destroy();if(result.status==='error')result.retry();});scene.chestNotice=box;
}
for(const [Scene,game,method,reset] of [
 [Bush,'bush_minesweeper','completeWinRewards','create'],
 [Shape,'shape_color','showGameEndPanel','create'],
 [Banqi,'bush_banqi','endGame','startNewGame'],
 [Memory,'memory_match','checkGameOver','create'],
 [Animal,'animal_food','showResult','create']
])installChestHooks(Scene,{game,method,reset,service:chestService,notify});
