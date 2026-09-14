// 9 大區域主題池＋全域木雕池。恐龍裝備只會出現在化石寶箱。
export const CHEST_LOOT_POOLS = Object.freeze({
 forest_moss: [
  'item_collectible_scout_test_01','item_hat_explore_01','item_cloth_explore_01','item_fullset_explore_01',
  'item_hat_fairytale_pinecone','item_hat_fairytale_fox','item_hat_fairytale_mushroom',
  'item_hat_fairytale_bunny','item_hat_fairytale_moss_bamboo','item_cloth_fairytale_squirrel',
  'item_cloth_fairytale_moss_lantern','item_cloth_fairytale_acorn'
 ],
 fairy_nectar: [
  'item_hat_fairytale_lemon','item_cloth_fairytale_peach','item_hat_fairytale_flower',
  'item_hat_fairytale_antennae','item_hat_fairytale_lily_bell','item_cloth_fairytale_lily_valley',
  'item_hat_fairytale_crystal_rose_crown','item_cloth_fairytale_crystal_rose_gown',
  'item_cloth_fairy_01','item_hat_forest_fairy_01'
 ],
 ice_crystal: [
  'item_hat_fairytale_swan','item_hat_fairytale_penguin_diving','item_cloth_fairytale_penguin_ice'
 ],
 volcano_ember: [
  'item_hat_campfire_01','item_cloth_campfire_01','item_fullset_campfire_01',
  'item_hat_fairytale_pumpkin_carriage','item_cloth_fairytale_pumpkin_mage',
  'item_hat_fairytale_clockwork_gear','item_hat_fairytale_steam_train',
  'item_hat_fairytale_radar_propeller','item_hat_fairytale_retro_tv',
  'item_cloth_fairytale_clockwork_overalls','item_cloth_fairytale_dynamo_coil',
  'item_cloth_fairytale_tin_woodman'
 ],
 water_pearl: [
  'item_fullset_fairytale_raincoat','item_hat_fairytale_pitcher_hood',
  'item_cloth_fairytale_pitcher_overalls','item_hat_fairytale_chameleon_hood',
  'item_cloth_fairytale_chameleon'
 ],
 starlight_moon: [
  'item_hat_constellation_01','item_cloth_constellation_01','item_fullset_constellation_01',
  'item_hat_fairytale_nightcap','item_cloth_fairytale_orbit','item_cloth_fairytale_owl',
  'item_cloth_fairytale_starlight_pillow'
 ],
 dinosaur_fossil: [
  'item_hat_fairytale_trex_plush','item_hat_fairytale_stegosaurus_explorer',
  'item_hat_fairytale_pterodactyl_goggles','item_hat_fairytale_triceratops_helmet',
  'item_cloth_fairytale_trex_stomp','item_cloth_fairytale_stegosaurus',
  'item_cloth_fairytale_pterodactyl','item_cloth_fairytale_triceratops'
 ],
 chess_crown: [
  'item_hat_tiara_global','item_hat_fairytale_alice_teacup','item_cloth_fairytale_alice_poker',
  'item_hat_fairytale_peacock_crown','item_cloth_fairytale_peacock','item_cloth_fairytale_rainbow'
 ],
 sky_cloud_crystal: [
  'item_cloth_fairytale_dandelion','item_cloth_fairytale_maple_cloak',
  'item_hat_fairytale_maple_parasol','item_cloth_fairytale_aviator_jacket',
  'item_cloth_fairytale_cloud_tutu','item_hat_fairytale_dream_cloud'
 ],
 global_wood: [
  'item_hat_fairytale_capybara','item_cloth_fairytale_bear','item_cloth_fairytale_sister',
  'item_hat_fairytale_lion_sunflower','item_cloth_fairytale_lion_vest',
  'item_cloth_home_ferris','item_cloth_home_flowers','item_hat_home_chestnut'
 ]
});

// 每一種區域箱的 20% 共用收藏都從這裡抽；木雕箱以日常休閒裝為主。
export const SHARED_CHEST_LOOT = Object.freeze([
 'item_hat_firefly_01','item_cloth_firefly_01','item_fullset_firefly_01',
 'item_cloth_home_ferris','item_cloth_home_flowers','item_hat_home_chestnut'
]);

export const CHEST_LOOT_WEIGHTS = Object.freeze({themed:.30,shared:.20,consolation:.50});
export const CONSOLATION_CRYSTALS = 1;
