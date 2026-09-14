export const CHEST_ART_FILES = Object.freeze({
 fairy_nectar:'assets/chests_v15/chest_flower_nectar.png',
 ice_crystal:'assets/chests_v15/chest_ice_crystal.png',
 volcano_ember:'assets/chests_v15/chest_emberglow.png',
 water_pearl:'assets/chests_v15/chest_pearl.png',
 starlight_moon:'assets/chests_v15/chest_moonlight.png',
 dinosaur_fossil:'assets/chests_v15/chest_fossil.png',
 chess_crown:'assets/chests_v15/chest_crown.png',
 sky_cloud_crystal:'assets/chests_v15/chest_cloud_crystal.png',
 global_wood:'assets/chests_v15/chest_global_wood.png'
});

const keyFor=id=>`chest_art_${id}`;

export function preloadChestArt(scene){
 if(!scene.textures.exists('forest_chests'))scene.load.spritesheet('forest_chests','assets/forest-chests/chests.png',{frameWidth:512,frameHeight:512});
 Object.entries(CHEST_ART_FILES).forEach(([id,file])=>{const key=keyFor(id);if(!scene.textures.exists(key))scene.load.image(key,file);});
}

export function createChestArt(scene,x,y,type,size=320){
 let art;
 if(type?.id==='forest_moss'&&scene.textures.exists('forest_chests'))art=scene.add.image(x,y,'forest_chests',0);
 else{
  const requested=keyFor(type?.id),fallback=keyFor('global_wood'),key=scene.textures.exists(requested)?requested:fallback;
  art=scene.textures.exists(key)?scene.add.image(x,y,key):scene.add.text(x,y,'寶箱',{fontSize:'38px',color:'#fff1ba'}).setOrigin(.5);
 }
 art.setDisplaySize?.(size,size);return art;
}
