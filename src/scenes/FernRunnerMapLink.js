import FernRunnerGame from './FernRunnerGame.js';

// Mud stays in the jungle; sky belongs to Windchime Isle.
export function createFernRunnerNode(scene,x,y,index){
 const sky=scene.regionId==='cloud'&&scene.submapId==='windchime_isle'&&index===3;
 const mud=scene.regionId==='dinosaur'&&scene.submapId==='giant_fern_jungle'&&index===3;
 if(!sky&&!mud)return false;
 scene.fernRunnerOpening=false;
 const theme=sky?'sky':'mud';
 const returnContext=sky?{regionId:'cloud',submapId:'windchime_isle'}:{regionId:'dinosaur',submapId:'giant_fern_jungle'};
 const title=sky?'星光雲徑':'泥地追蹤';
 const enter=()=>{
  if(scene.fernRunnerOpening)return;
  scene.fernRunnerOpening=true;
  try{
   if(!scene.scene.manager.keys.FernRunnerGame)scene.scene.add('FernRunnerGame',FernRunnerGame,false);
   scene.registry.set('submap_return_context',returnContext);
   scene.scene.start('FernRunnerGame',{theme,child:false,intro:true});
  }catch(error){scene.fernRunnerOpening=false;throw error;}
 };
 // Transparent hotspot covers the landmark; the title also opens the game.
 scene.add.rectangle(x,y,180,125,0xffffff,.001).setDepth(21).setInteractive({useHandCursor:true}).on('pointerdown',enter);
 scene.makeButton(x,y+46,175,48,title,enter,sky?0x66688c:0x537d5c).setDepth(22);
 scene.add.text(x,y+83,'點這裡開始探險',{fontFamily:'Microsoft JhengHei, Arial',fontSize:'15px',color:'#fff6da',stroke:'#294f43',strokeThickness:4}).setOrigin(.5).setDepth(22);
 return true;
}
