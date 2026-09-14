// src/UI/RewardPopup.js
import { ITEM_DB } from '../data/GameData.js';

export default class RewardPopup {
    static show(scene, config = {}) {
        const {
            title = '恭喜獲得！',
            itemName = '神秘物品',
            rarity = '普通',
            description = '',
            iconKey = null,
            onClose = null
        } = config;

        const { width, height } = scene.scale;

        // =========================
        // 1. 建立最外層容器
        // =========================
        const container = scene.add.container(0, 0);
        container.setDepth(9999);

        // =========================
        // 2. 黑色半透明遮罩
        // =========================
        const overlay = scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.55
        );
        overlay.setInteractive();

        // =========================
        // 3. 中央彈窗底板
        // =========================
        const panel = scene.add.rectangle(
            width / 2,
            height / 2,
            460,
            420,
            0xfff8e7
        );
        panel.setStrokeStyle(4, 0x8b5a2b);

        // =========================
        // 4. 標題文字
        // =========================
        const titleText = scene.add.text(
            width / 2,
            height / 2 - 170,
            title,
            {
                fontSize: '30px',
                color: '#7a4e2d',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // =========================
        // 5. Icon 背景框
        // =========================
        const iconBg = scene.add.rectangle(
            width / 2,
            height / 2 - 55,
            140,
            140,
            0xf5e6c8
        );
        iconBg.setStrokeStyle(3, 0x8b5a2b);

        // =========================
        // 6. Icon 圖示
        // =========================
        let iconImage = null;
        let iconFinalScale = 1;

        if (iconKey) {
            if (scene.textures.exists(iconKey)) {
                iconImage = scene.add.image(width / 2, height / 2 - 55, iconKey);

                const maxWidth = 95;
                const maxHeight = 95;

                const textureWidth = iconImage.width;
                const textureHeight = iconImage.height;

                const scaleX = maxWidth / textureWidth;
                const scaleY = maxHeight / textureHeight;
                iconFinalScale = Math.min(scaleX, scaleY);

                iconImage.setScale(iconFinalScale);
            } else {
                console.warn(`RewardPopup: 找不到 iconKey = ${iconKey}`);
            }
        }

        // =========================
        // 7. 物品名稱
        // =========================
        const itemNameText = scene.add.text(
            width / 2,
            height / 2 + 35,
            itemName,
            {
                fontSize: '28px',
                color: '#3d2b1f',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // =========================
        // 8. 稀有度顏色
        // =========================
        let rarityColor = '#6b7280';

        if (rarity === '普通') rarityColor = '#6b7280';
        if (rarity === '稀有') rarityColor = '#3b82f6';
        if (rarity === '史詩') rarityColor = '#a855f7';
        if (rarity === '傳說') rarityColor = '#f59e0b';

        const rarityText = scene.add.text(
            width / 2,
            height / 2 + 72,
            `稀有度：${rarity}`,
            {
                fontSize: '22px',
                color: rarityColor,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // =========================
        // 9. 描述文字
        // =========================
        const descText = scene.add.text(
            width / 2,
            height / 2 + 120,
            description,
            {
                fontSize: '18px',
                color: '#5c4033',
                align: 'center',
                wordWrap: { width: 360 }
            }
        ).setOrigin(0.5);

        // =========================
        // 10. 確定按鈕
        // =========================
        const confirmBtn = scene.add.rectangle(
            width / 2,
            height / 2 + 178,
            140,
            46,
            0x8b5a2b
        )
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const confirmText = scene.add.text(
            width / 2,
            height / 2 + 178,
            '確定',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // =========================
        // 11. 關閉函式
        // =========================
        const closePopup = () => {
            container.destroy();

            if (onClose) {
                onClose();
            }
        };

        // =========================
        // 12. 按鈕互動效果
        // =========================
        confirmBtn.on('pointerover', () => {
            confirmBtn.setScale(1.05);
            confirmText.setScale(1.05);
        });

        confirmBtn.on('pointerout', () => {
            confirmBtn.setScale(1);
            confirmText.setScale(1);
        });

        confirmBtn.on('pointerdown', () => {
            closePopup();
        });

        // =========================
        // 13. 加入容器
        // =========================
        const children = [
            overlay,
            panel,
            titleText,
            iconBg,
            itemNameText,
            rarityText,
            descText,
            confirmBtn,
            confirmText
        ];

        if (iconImage) {
            children.push(iconImage);
        }

        container.add(children);

        // =========================
        // 14. 開場動畫
        // =========================
        const normalTweenTargets = [
            panel,
            titleText,
            iconBg,
            itemNameText,
            rarityText,
            descText,
            confirmBtn,
            confirmText
        ];

        normalTweenTargets.forEach(obj => obj.setScale(0.8));

        scene.tweens.add({
            targets: normalTweenTargets,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Back.Out'
        });

        if (iconImage) {
            iconImage.setScale(iconFinalScale * 0.8);

            scene.tweens.add({
                targets: iconImage,
                scaleX: iconFinalScale,
                scaleY: iconFinalScale,
                duration: 180,
                ease: 'Back.Out'
            });
        }

        return container;
    }

    static normalizeRarity(rarity) {
        if (!rarity) return '普通';

        const map = {
            common: '普通',
            rare: '稀有',
            epic: '史詩',
            legendary: '傳說',
            普通: '普通',
            稀有: '稀有',
            史詩: '史詩',
            傳說: '傳說'
        };

        return map[rarity] || '普通';
    }

    static showItem(scene, itemId, extraConfig = {}) {
        const item = ITEM_DB[itemId];

        if (!item) {
            console.warn(`RewardPopup.showItem: 找不到 itemId = ${itemId}`);
            return null;
        }

        const itemName = item.name || item.displayName || itemId;
        const rarity = this.normalizeRarity(item.rarity);
        const description = item.desc || item.description || '這是一個神秘物品。';

        // 優先 icon，再退 texture，再退 itemId
        const iconKey = item.icon || item.iconKey || item.texture || item.textureKey || itemId;

        return this.show(scene, {
            title: extraConfig.title || '恭喜獲得！',
            itemName,
            rarity,
            description,
            iconKey,
            onClose: extraConfig.onClose || null
        });
    }

    static showCrystal(scene, amount = 1, extraConfig = {}) {
        return this.show(scene, {
            title: extraConfig.title || '重複獎勵轉換！',
            itemName: extraConfig.itemName || `水晶 +${amount}`,
            rarity: extraConfig.rarity || '普通',
            description: extraConfig.description || `你已經擁有這件裝備了，已自動轉換成 ${amount} 顆水晶。`,
            iconKey: extraConfig.iconKey || 'icon_crystal',
            onClose: extraConfig.onClose || null
        });
    }
}