import StarlightLake from './StarlightLake.js';
export default class RegionAtlas extends StarlightLake {
 constructor(){super('RegionAtlas');}
 preload(){super.preload();if(!this.textures.exists('atlas_forest'))this.load.image('atlas_forest','assets/WorldMap01.jpg');}
 draw(){
  this.tweens.killAll();this.children.removeAll(true);this.modal=null;
  const W=this.W,H=this.H;this.add.rectangle(W/2,H/2,W,H,0x102b3d);
  this.text(W/2,87,'選一個地方，開始冒險',this.portrait?36:43);
  this.text(W/2,155,'同一位冒險家 · 共用衣櫃、寶箱與設定',25,'#bdd7df');
  [{name:'森林營地',subtitle:'熟悉的樹屋與森林朋友',art:'atlas_forest',key:'WorldMap',data:{mapID:'01'}},
   {name:'星光湖畔',subtitle:'三枚星印，喚醒湖心月門',art:'lake_panorama',key:'StarlightLake',data:{}}].forEach((r,i)=>{
   const x=this.portrait?W/2:335+i*610,y=this.portrait?410+i*407:397,w=this.portrait?620:570;
   this.panel(x,y,w,358,0x21445a,0xd7b879);
   if(this.textures.exists(r.art))this.add.image(x,y-55,r.art).setDisplaySize(w-26,215);
   this.text(x,y+82,r.subtitle,25,'#c6dce4');
   this.baseButton(x,y+132,w-40,72,`${r.name}　→`,()=>this.travel(r.key,r.data),i?0x80623b:0x416b52);
  });
  this.baseButton(W/2,H-90,this.portrait?560:380,80,'返回首頁',()=>this.travel('Start'));
 }
}
