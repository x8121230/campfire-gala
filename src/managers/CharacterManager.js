import { PAPER_DOLL_LAYOUT, currentLook, fitImage } from '../data/PaperDollConfig.js';
import { renderPaperDoll } from '../systems/PaperDollRenderer.js';
export default class CharacterManager {
 constructor(scene) {
  this.scene=scene;this.container=null;this.nodes=[];this.layout=PAPER_DOLL_LAYOUT.worldMap;
  this.onRegistryChange=this.onRegistryChange.bind(this);
 }
 createCharacter(x=this.layout.centerX,y=this.layout.centerY,options={}) {
  this.destroy();this.layout={...PAPER_DOLL_LAYOUT.worldMap,...options};
  this.container=this.scene.add.container(x,y);this.refreshLook();
  this.scene.registry?.events?.on?.('changedata',this.onRegistryChange);
  this.scene.events?.once?.('shutdown',()=>this.destroy());return this.container;
 }
 onRegistryChange(parent,key) {if(String(key).startsWith('equipped_'))this.refreshLook();}
 refreshLook(previewId=null) {
  if(!this.container)return;
  for(const n of this.nodes)n.destroy();this.nodes=[];
  this.collectible?.destroy();this.collectible=null;
  const look=currentLook(this.scene.registry,previewId);
  const result=renderPaperDoll(this.scene,this.container,look,{...this.layout,centerX:0,centerY:0});
  this.nodes=result.nodes;this.body=this.nodes.find(n=>n.name==='paper-doll-outfitBody');
  this.hat=this.nodes.find(n=>n.name==='paper-doll-headStyle');
  if(look.collectibleTexture && this.scene.textures.exists(look.collectibleTexture)) {
   this.collectible=this.scene.add.image(this.layout.maxWidth*(this.layout.accessoryAnchorX-.5),this.layout.maxHeight*(this.layout.accessoryAnchorY-.5),look.collectibleTexture);
   fitImage(this.collectible,42,42);this.container.add(this.collectible);
  }
  this.container.setData('paperDollLook',look);
 }
 destroy() {
  this.scene?.registry?.events?.off?.('changedata',this.onRegistryChange);
  this.container?.destroy(true);this.container=null;this.nodes=[];this.body=null;this.hat=null;this.collectible=null;
 }
}
