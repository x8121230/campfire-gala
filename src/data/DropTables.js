// src/data/DropTables.js

/**
 * 掉落表系統（Drop Tables）
 * 
 * 說明：
 * - 每個關卡有自己的掉落池
 * - 分為：small / big / dream 三種寶箱
 * - 每個寶箱再分：common / rare / epic / legendary
 * 
 * ⚠️ secret 類型裝備（例如母上的守護）不會出現在這裡
 */

export const DROP_TABLES = {

    bush_01: {

        small: {
            common: [
                'item_hat_leaf_bush01',
                'item_cloth_moss_bush01'
            ],
            rare: [
                'item_hat_flower_bush01'
            ],
            epic: [],
            legendary: []
        },

        big: {
            common: [
                'item_hat_leaf_bush01'
            ],
            rare: [
                'item_hat_flower_bush01'
            ],
            epic: [
                'item_cloth_fairy_bush01'
            ],
            legendary: []
        },

        dream: {
            common: [],
            rare: [
                'item_hat_flower_bush01'
            ],
            epic: [
                'item_cloth_fairy_bush01'
            ],
            legendary: [
                'item_fullset_forest_legend'
            ]
        }
    }

};