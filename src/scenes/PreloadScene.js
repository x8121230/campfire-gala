// src/scenes/PreloadScene.js
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loadingText = this.add.text(width / 2, height / 2, '森林益智樂園 載入中...', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ===== 首頁 / 背景 =====
        this.load.image('bg_home', 'assets/forest_bg.jpg');
        this.load.image('collection_bg', 'assets/forest_bg.jpg');
        this.load.image('bg_collection_room', 'assets/bg_collection_room.jpg');

        // ===== 音效 / 音樂 =====
        this.load.audio('home_bgm', 'assets/home_bgm.mp3');
        this.load.audio('forest_music', 'assets/forest_bgm.mp3');
        this.load.audio('collection_bgm', 'assets/collection_bgm.mp3');
        this.load.audio('equip_hat_sfx', 'assets/equip_hat_sfx.mp3');
        this.load.audio('equip_cloth_sfx', 'assets/equip_cloth_sfx.mp3');
        this.load.audio('equip_fullset_sfx', 'assets/equip_fullset_sfx.mp3');
        this.load.audio('dig_sfx', 'assets/dig_sfx.mp3');
        this.load.audio('gold_sfx', 'assets/gold_sfx.mp3');
        this.load.audio('chest_open_sfx', 'assets/chest_open_sfx.mp3');
        this.load.audio('click_sfx', 'assets/click_sfx.mp3');
        this.load.audio('bush_bgm', 'assets/bush_bgm.mp3');
        this.load.audio('dig_grass_sfx', 'assets/dig_grass_sfx.mp3');
        this.load.audio('ui_click_sfx', 'assets/ui_click_sfx.mp3');
        this.load.audio('answer_correct_sfx', 'assets/answer_correct_sfx.mp3');
        this.load.audio('answer_wrong_sfx', 'assets/answer_wrong_sfx.mp3');

        // ===== 背景 / 場景 =====
        this.load.image('bg_bush_forest', 'assets/bg_bush_forest.jpg');

        // ===== 角色 =====
        this.load.image('daughter_base', 'assets/daughter_base.png');
        this.load.image('empty', 'assets/empty.png');

        // ===== 紙娃娃穿戴圖層 =====
        this.load.image('hat_tiara', 'assets/item_hat_tiara.png');
        this.load.image('cloth_fairy', 'assets/item_cloth_fairy.png');

        this.load.image('item_hat_daily_01', 'assets/item_hat_daily_01.png');
        this.load.image('item_cloth_daily_01', 'assets/item_cloth_daily_01.png');

        this.load.image('fullset_pink_home_01', 'assets/item_fullset_pink_home_01.png');
        this.load.image('icon_fullset_pink_home_01', 'assets/item_fullset_pink_home_01.png');

        this.load.image('icon_guard', 'assets/icon_guard.png');
        this.load.image('fullset_guard', 'assets/fullset_guard.png');

        this.load.image('item_collectible_pigtear', 'assets/item_collectible_pigtear.png');
        this.load.image('icon_collectible_pigtear', 'assets/icon_collectible_pigtear.png');

        // ===== 衣櫃 / 背包圖示 =====
        this.load.image('item_hat_tiara', 'assets/item_hat_tiara.png');
        this.load.image('item_cloth_fairy', 'assets/item_cloth_fairy.png');
        this.load.image('icon_crystal', 'assets/icon_crystal.png');

        // ===== 收藏 / 裝飾 =====
        this.load.image('item_bush', 'assets/item_bush.png');
        this.load.image('rare_a_forest', 'assets/rare_a_forest.png');

        // ===== 按鈕 =====
        this.load.image('btn_start', 'assets/btn_start.png');
        this.load.image('btn_setting', 'assets/btn_setting.png');
        this.load.image('btn_back', 'assets/btn_back.png');
        this.load.image('btn_red', 'assets/btn_red.png');
        this.load.image('btn_edit', 'assets/btn_edit.png');

        // 舊程式相容
        this.load.image('btn_orange', 'assets/btn_start2.png');
        this.load.image('btn_green', 'assets/btn_setting.png');

        // ===== WorldMap 關卡 icon =====
        this.load.image('icon_chest', 'assets/icon_chest.png');
        this.load.image('icon_tent', 'assets/icon_tent.png');
        this.load.image('icon_tree', 'assets/icon_tree.png');
        this.load.image('icon_fire', 'assets/icon_fire.png');
        this.load.image('icon_firefly', 'assets/icon_firefly.png');

        // ===== 草叢尋寶 icon =====
        this.load.image('icon_bush', 'assets/icon_bush.png');
        this.load.image('icon_bush_1', 'assets/icon_bush_1.png');
        this.load.image('icon_bush_2', 'assets/icon_bush_2.png');
        this.load.image('icon_bush_3', 'assets/icon_bush_3.png');
        this.load.image('icon_bush_4', 'assets/icon_bush_4.png');
        this.load.image('fruit_green', 'assets/fruit_green.png');
        this.load.image('fruit_red', 'assets/fruit_red.png');
        this.load.image('fruit_blue', 'assets/fruit_blue.png');
        this.load.image('fruit_poison', 'assets/fruit_poison.png');
        this.load.image('fruit_big', 'assets/fruit_big.png');
        this.load.image('danger_snake', 'assets/danger_snake.png');
        this.load.image('danger_thorn', 'assets/danger_thorn.png');
        this.load.image('danger_boar', 'assets/danger_boar.png');
        this.load.image('danger_web', 'assets/danger_web.png');
        this.load.image('danger_stone', 'assets/danger_stone.png');
        this.load.image('icon_tile_dirt', 'assets/icon_tile_dirt.png');
        this.load.image('icon_gold_golden', 'assets/icon_gold_golden.png');
        this.load.image('icon_gold_rainbow', 'assets/icon_gold_rainbow.png');
        this.load.image('icon_gold_mystery', 'assets/icon_gold_mystery.png');
        this.load.image('icon_gold_kingbug', 'assets/icon_gold_kingbug.png');

        this.load.image('fruit_generic', 'assets/fruit_generic.png');
        this.load.image('fruit_gold', 'assets/fruit_gold.png');
        this.load.image('icon_flag_wood', 'assets/icon_flag_wood.png');


        // ===== 草叢尋寶素材 =====
        this.load.image('tile_dirt', 'assets/tile_dirt.png');
        this.load.image('leaf_particle', 'assets/leaf_particle.png');
        this.load.image('bug_green', 'assets/bug_green.png');
        this.load.image('bug_red', 'assets/bug_red.png');
        this.load.image('sparkle_gold', 'assets/sparkle_gold.png');

        // ===== 形色棋 icon =====
        this.load.image('tile_base', 'assets/tile_base_white.png');

        this.load.image('shape_circle', 'assets/shape_circle_white.png');
        this.load.image('shape_square', 'assets/shape_square_white.png');
        this.load.image('shape_diamond', 'assets/shape_diamond_white.png');
        this.load.image('shape_star', 'assets/shape_star_white.png');
        this.load.image('shape_clover', 'assets/shape_clover_white.png');
        this.load.image('shape_cross', 'assets/shape_cross_white.png');

        // ===== 動物配對 icon =====
        // AnimalFoodMatch 素材
        // 路徑：assets/AnimalFoodMatch/
        // =========================
        this.load.image('forest_match_bg', 'assets/AnimalFoodMatch/forest_match_bg.png');
        this.load.image('afm_brown_bear_body', 'assets/AnimalFoodMatch/food_brown_bear_body.png');
        this.load.image('afm_brown_bear_item', 'assets/AnimalFoodMatch/food_brown_bear_item.png');
        this.load.image('afm_butterfly_body', 'assets/AnimalFoodMatch/food_butterfly_body.png');
        this.load.image('afm_butterfly_item', 'assets/AnimalFoodMatch/food_butterfly_item.png');
        this.load.image('afm_cat_body', 'assets/AnimalFoodMatch/food_cat_body.png');
        this.load.image('afm_cat_item', 'assets/AnimalFoodMatch/food_cat_item.png');
        this.load.image('afm_deer_body', 'assets/AnimalFoodMatch/food_deer_body.png');
        this.load.image('afm_deer_item', 'assets/AnimalFoodMatch/food_deer_item.png');
        this.load.image('afm_dolphin_body', 'assets/AnimalFoodMatch/food_dolphin_body.png');
        this.load.image('afm_dolphin_item', 'assets/AnimalFoodMatch/food_dolphin_item.png');
        this.load.image('afm_hedgehog_body', 'assets/AnimalFoodMatch/food_hedgehog_body.png');
        this.load.image('afm_hedgehog_item', 'assets/AnimalFoodMatch/food_hedgehog_item.png');
        this.load.image('afm_monkey_body', 'assets/AnimalFoodMatch/food_monkey_body.png');
        this.load.image('afm_monkey_item', 'assets/AnimalFoodMatch/food_monkey_item.png');
        this.load.image('afm_mouse_body', 'assets/AnimalFoodMatch/food_mouse_body.png');
        this.load.image('afm_mouse_item', 'assets/AnimalFoodMatch/food_mouse_item.png');
        this.load.image('afm_owl_body', 'assets/AnimalFoodMatch/food_owl_body.png');
        this.load.image('afm_owl_item', 'assets/AnimalFoodMatch/food_owl_item.png');
        this.load.image('afm_panda_body', 'assets/AnimalFoodMatch/food_panda_body.png');
        this.load.image('afm_panda_item', 'assets/AnimalFoodMatch/food_panda_item.png');
        this.load.image('afm_rabbit_body', 'assets/AnimalFoodMatch/food_rabbit_body.png');
        this.load.image('afm_rabbit_item', 'assets/AnimalFoodMatch/food_rabbit_item.png');
        this.load.image('afm_seahorse_body', 'assets/AnimalFoodMatch/food_seahorse_body.png');
        this.load.image('afm_seahorse_item', 'assets/AnimalFoodMatch/food_seahorse_item.png');
        this.load.image('afm_squirrel_body', 'assets/AnimalFoodMatch/food_squirrel_body.png');
        this.load.image('afm_squirrel_item', 'assets/AnimalFoodMatch/food_squirrel_item.png');
        this.load.image('afm_tiger_body', 'assets/AnimalFoodMatch/food_tiger_body.png');
        this.load.image('afm_tiger_item', 'assets/AnimalFoodMatch/food_tiger_item.png');
        
        this.load.audio('afm_bgm', 'assets/AnimalFoodMatch/afm_bgm.mp3');
        /* =========================
        * MemoryMatchGame 動物頭像
        * ========================= */
        this.load.image('mm_tile_base', 'assets/MemoryMatchGame/tile_base_white.png');

        this.load.image('mm_elephant', 'assets/MemoryMatchGame/大象.png');
        this.load.image('mm_sheep', 'assets/MemoryMatchGame/小羊.png');
        this.load.image('mm_dog', 'assets/MemoryMatchGame/小狗.png');
        this.load.image('mm_raccoon', 'assets/MemoryMatchGame/小浣熊.png');
        this.load.image('mm_deer', 'assets/MemoryMatchGame/小鹿.png');
        this.load.image('mm_bear', 'assets/MemoryMatchGame/小熊.png');
        this.load.image('mm_pig', 'assets/MemoryMatchGame/小豬.png');
        this.load.image('mm_cat', 'assets/MemoryMatchGame/小貓.png');
        this.load.image('mm_penguin', 'assets/MemoryMatchGame/企鵝.png');
        this.load.image('mm_tiger', 'assets/MemoryMatchGame/老虎.png');
        this.load.image('mm_cow', 'assets/MemoryMatchGame/乳牛.png');
        this.load.image('mm_rabbit', 'assets/MemoryMatchGame/兔子.png');
        this.load.image('mm_hedgehog', 'assets/MemoryMatchGame/刺蝟.png');
        this.load.image('mm_squirrel', 'assets/MemoryMatchGame/松鼠.png');
        this.load.image('mm_hippo', 'assets/MemoryMatchGame/河馬.png');
        this.load.image('mm_fox', 'assets/MemoryMatchGame/狐狸.png');
        this.load.image('mm_chipmunk', 'assets/MemoryMatchGame/花栗鼠.png');
        this.load.image('mm_giraffe', 'assets/MemoryMatchGame/長頸鹿.png');
        this.load.image('mm_frog', 'assets/MemoryMatchGame/青蛙.png');
        this.load.image('mm_zebra', 'assets/MemoryMatchGame/斑馬.png');
        this.load.image('mm_koala', 'assets/MemoryMatchGame/無尾熊.png');
        this.load.image('mm_monkey', 'assets/MemoryMatchGame/猴子.png');
        this.load.image('mm_lion', 'assets/MemoryMatchGame/獅子.png');
        this.load.image('mm_panda', 'assets/MemoryMatchGame/熊貓.png');
        this.load.image('mm_bee', 'assets/MemoryMatchGame/蜜蜂.png');
        this.load.image('mm_butterfly', 'assets/MemoryMatchGame/蝴蝶.png');
        this.load.image('mm_owl', 'assets/MemoryMatchGame/貓頭鷹.png');
        this.load.image('mm_whale', 'assets/MemoryMatchGame/小鯨魚.png');
        this.load.image('mm_bg_forest', 'assets/MemoryMatchGame/mm_bg_forest.png');
        // 音效
        this.load.audio('memory_bgm', 'assets/MemoryMatchGame/mm_bgm.mp3');

        this.load.audio('mm_flip', 'assets/MemoryMatchGame/mm_flip.mp3');
        this.load.audio('mm_match', 'assets/MemoryMatchGame/mm_match.mp3');
        this.load.audio('mm_wrong', 'assets/MemoryMatchGame/mm_wrong.mp3');
        this.load.audio('mm_win', 'assets/MemoryMatchGame/mm_win.mp3');
        this.load.audio('mm_lose', 'assets/MemoryMatchGame/mm_lose.mp3');

        /* =========================
        * FireflyExplore 點點螢火
        * ========================= */
        this.load.image('player_front', 'assets/characters/little_red/player_front.png');
        this.load.image('player_back', 'assets/characters/little_red/player_back.png');
        this.load.image('player_left', 'assets/characters/little_red/player_left.png');
        this.load.image('player_right', 'assets/characters/little_red/player_right.png');

        this.load.image('enemy_wolf', 'assets/characters/enemy/enemy_wolf.png');
        // ===== 載入進度 =====
        this.load.on('progress', (value) => {
            loadingText.setText(`森林益智樂園 載入中... ${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            loadingText.setText('載入完成！');

            console.log('✅ preload 完成', {
                icon_collectible_pigtear: this.textures.exists('icon_collectible_pigtear'),
                item_collectible_pigtear: this.textures.exists('item_collectible_pigtear')
            });
        });
    }

    create() {
        if (!this.registry.has('hearts')) {
            this.registry.set('hearts', 3);
        }

        if (!this.registry.has('max_hearts')) {
            this.registry.set('max_hearts', 3);
        }

        if (!this.registry.has('recovery_seconds')) {
            this.registry.set('recovery_seconds', 7200);
        }

        if (!this.registry.has('next_heart_time')) {
            this.registry.set('next_heart_time', null);
        }

        if (!this.registry.has('user_crystals')) {
            this.registry.set('user_crystals', 50);
        }

        if (!this.registry.has('reputation')) {
            this.registry.set('reputation', 0);
        }

        if (!this.registry.has('owned_items')) {
            this.registry.set('owned_items', [
                'item_hat_daily_01',
                'item_cloth_daily_01'
            ]);
        }

        if (!this.registry.has('owned_collectibles')) {
            this.registry.set('owned_collectibles', []);
        }

        if (!this.registry.has('placed_decorations')) {
            this.registry.set('placed_decorations', []);
        }

        if (!this.registry.has('equipped_hat')) {
            this.registry.set('equipped_hat', 'none');
        }

        if (!this.registry.has('equipped_cloth')) {
            this.registry.set('equipped_cloth', 'none');
        }

        if (!this.registry.has('equipped_fullset')) {
            this.registry.set('equipped_fullset', 'none');
        }

        if (!this.registry.has('equipped_collectible')) {
            this.registry.set('equipped_collectible', 'none');
        }

        if (!this.registry.has('minigame_stats')) {
            this.registry.set('minigame_stats', {
                treasure: { playCount: 0, clearCount: 0, bestScore: 0 },
                firefly: { playCount: 0, clearCount: 0, bestScore: 0 },
                campfire: { playCount: 0, clearCount: 0, bestScore: 0 },
                explore: { playCount: 0, clearCount: 0, bestScore: 0 }
            });
        }

        if (!this.registry.has('bonus_play_counts')) {
            this.registry.set('bonus_play_counts', {});
        }

        if (!this.registry.has('bonus_reward_rates')) {
            this.registry.set('bonus_reward_rates', {});
        }

        if (!this.registry.has('bonus_drop_rates')) {
            this.registry.set('bonus_drop_rates', {});
        }

        console.log('🎒 PreloadScene create 完成', {
            owned_items: this.registry.get('owned_items'),
            owned_collectibles: this.registry.get('owned_collectibles'),
            equipped_collectible: this.registry.get('equipped_collectible')
        });

        this.scene.start('Start');
    }
}