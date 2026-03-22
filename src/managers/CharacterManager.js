// src/managers/CharacterManager.js
import { ITEM_DB } from '../data/GameData.js';

export default class CharacterManager {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.base = null;
        this.fullset = null;
        this.cloth = null;
        this.hat = null;
        this.collectible = null;
    }

    createCharacter(x, y) {
        if (this.container) {
            this.container.destroy();
        }

        this.container = this.scene.add.container(x, y);

        // 圖層順序：基底 -> 全身裝 -> 衣服 -> 帽子 -> 收藏品
        this.base = this.scene.add.image(0, 0, 'daughter_base');
        this.fullset = this.scene.add.image(0, 0, 'empty').setVisible(false);
        this.cloth = this.scene.add.image(0, 0, 'empty').setVisible(false);
        this.hat = this.scene.add.image(0, 0, 'empty').setVisible(false);
        this.collectible = this.scene.add.image(0, 0, 'empty').setVisible(false);

        this.container.add([
            this.base,
            this.fullset,
            this.cloth,
            this.hat,
            this.collectible
        ]);

        this.container.setScale(0.8);

        this.refreshLook();
    }

    refreshLook() {
        const equippedFullsetId = this.scene.registry.get('equipped_fullset') ?? 'none';
        const equippedHatId = this.scene.registry.get('equipped_hat') ?? 'none';
        const equippedClothId = this.scene.registry.get('equipped_cloth') ?? 'none';
        const equippedCollectibleId = this.scene.registry.get('equipped_collectible') ?? 'none';

        const fullsetTexture = this.getTextureKeyFromItem(equippedFullsetId);
        const hatTexture = this.getTextureKeyFromItem(equippedHatId);
        const clothTexture = this.getTextureKeyFromItem(equippedClothId);
        const collectibleTexture = this.getTextureKeyFromItem(equippedCollectibleId);

        console.log('👗 目前裝備', {
            equippedFullsetId,
            equippedHatId,
            equippedClothId,
            equippedCollectibleId,
            fullsetTexture,
            hatTexture,
            clothTexture,
            collectibleTexture
        });

        // 全部重置
        this.base.setVisible(true);

        this.fullset.setTexture('empty');
        this.fullset.setVisible(false);
        this.fullset.setPosition(0, 0);
        this.fullset.setScale(1);

        this.cloth.setTexture('empty');
        this.cloth.setVisible(false);
        this.cloth.setPosition(0, 0);
        this.cloth.setScale(1);

        this.hat.setTexture('empty');
        this.hat.setVisible(false);
        this.hat.setPosition(0, -150);
        this.hat.setScale(1);

        this.collectible.setTexture('empty');
        this.collectible.setVisible(false);
        this.collectible.setPosition(78, 40);
        this.collectible.setScale(0.42);

        // 有全身裝時：隱藏 base，只顯示 fullset
        if (fullsetTexture && this.scene.textures.exists(fullsetTexture)) {
            this.base.setVisible(false);

            this.fullset.setTexture(fullsetTexture);
            this.fullset.setVisible(true);
            this.applyFullsetAdjust(fullsetTexture);
        } else {
            this.base.setVisible(true);

            if (clothTexture && this.scene.textures.exists(clothTexture)) {
                this.cloth.setTexture(clothTexture);
                this.cloth.setVisible(true);
                this.applyClothAdjust(clothTexture);
            }

            if (hatTexture && this.scene.textures.exists(hatTexture)) {
                this.hat.setTexture(hatTexture);
                this.hat.setVisible(true);
                this.applyHatAdjust(hatTexture);
            }
        }

        // 收藏品永遠可以疊在最後一層
        if (collectibleTexture && this.scene.textures.exists(collectibleTexture)) {
            this.collectible.setTexture(collectibleTexture);
            this.collectible.setVisible(true);
            this.applyCollectibleAdjust(collectibleTexture);
        }
    }

    getTextureKeyFromItem(itemId) {
        if (!itemId || itemId === 'none') return null;

        const itemData = ITEM_DB[itemId];
        if (!itemData) {
            console.warn(`⚠️ ITEM_DB 找不到裝備資料：${itemId}`);
            return null;
        }

        return itemData.texture || null;
    }

    applyFullsetAdjust(fullsetTexture) {
        this.fullset.setPosition(0, 0);
        this.fullset.setScale(1);

        if (fullsetTexture.includes('mother_guard')) {
            this.fullset.setPosition(0, 0);
            this.fullset.setScale(1);
        }
    }

    applyClothAdjust(clothTexture) {
        this.cloth.setPosition(0, 0);
        this.cloth.setScale(1);

        if (clothTexture.includes('fairy')) {
            this.cloth.setPosition(0, 0);
            this.cloth.setScale(1);
        }

        if (clothTexture.includes('daily_01')) {
            this.cloth.setPosition(0, 0);
            this.cloth.setScale(1);
        }
    }

    applyHatAdjust(hatTexture) {
        this.hat.setPosition(0, -150);
        this.hat.setScale(1);

        if (hatTexture.includes('tiara')) {
            this.hat.setPosition(10, -185);
            this.hat.setScale(1.1);
        }

        if (hatTexture.includes('daily_01')) {
            this.hat.setPosition(0, -150);
            this.hat.setScale(1);
        }
    }

    applyCollectibleAdjust(collectibleTexture) {
        this.collectible.setPosition(78, 40);
        this.collectible.setScale(0.42);

        if (collectibleTexture.includes('pigtear')) {
            this.collectible.setPosition(76, 42);
            this.collectible.setScale(0.42);
        }

        if (collectibleTexture.includes('crystal')) {
            this.collectible.setPosition(76, 42);
            this.collectible.setScale(0.42);
        }
    }

}