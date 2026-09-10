import {
    PAPER_DOLL_LAYOUT,
    currentLook,
    fitImage
} from '../data/PaperDollConfig.js';

export default class CharacterManager {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.body = null;
        this.hat = null;
        this.hatGraphic = null;
        this.collectible = null;
        this.layout = PAPER_DOLL_LAYOUT.worldMap;
        this.onRegistryChange = this.onRegistryChange.bind(this);
    }

    createCharacter(x = this.layout.centerX, y = this.layout.centerY, options = {}) {
        this.destroy();
        this.layout = { ...PAPER_DOLL_LAYOUT.worldMap, ...options };
        this.container = this.scene.add.container(x, y);
        this.body = this.scene.add.image(0, 0, 'wardrobe_doll_daily_v50');
        this.hat = this.scene.add.image(0, 0, 'wardrobe_doll_daily_v50').setVisible(false);
        this.hatGraphic = this.scene.add.graphics().setVisible(false);
        this.collectible = this.scene.add.image(0, 0, 'wardrobe_doll_daily_v50').setVisible(false);
        this.container.add([this.body, this.hat, this.hatGraphic, this.collectible]);
        this.refreshLook();

        const events = this.scene.registry?.events;
        events?.on?.('changedata', this.onRegistryChange);
        this.scene.events?.once?.('shutdown', () => this.destroy());
        return this.container;
    }

    onRegistryChange(parent, key) {
        if (String(key).startsWith('equipped_')) this.refreshLook();
    }

    refreshLook(previewId = null) {
        if (!this.container || !this.body) return;
        const look = currentLook(this.scene.registry, previewId);
        const bodyTexture = this.scene.textures.exists(look.bodyTexture)
            ? look.bodyTexture
            : 'wardrobe_doll_daily_v50';

        this.body.setTexture(bodyTexture).setVisible(true).setPosition(0, 0);
        fitImage(this.body, this.layout.maxWidth, this.layout.maxHeight);

        const left = -this.layout.maxWidth / 2;
        const top = -this.layout.maxHeight / 2;
        const clipX = left + this.layout.maxWidth * this.layout.hatAnchorX;
        const headY = top + this.layout.maxHeight * 0.2;
        const accessoryX = left + this.layout.maxWidth * this.layout.accessoryAnchorX;
        const accessoryY = top + this.layout.maxHeight * this.layout.accessoryAnchorY;

        this.hat.setVisible(false).setTexture('wardrobe_doll_daily_v50').setPosition(0, 0).setScale(1);
        this.hatGraphic.clear().setVisible(false).setPosition(clipX, headY);
        if (!look.hatSuppressed && look.hatId === 'item_hat_daily_01') {
            this.drawHairClip(this.hatGraphic, 25).setVisible(true);
        } else if (look.hatTexture && this.scene.textures.exists(look.hatTexture)) {
            this.hat.setTexture(look.hatTexture).setPosition(0, 0).setVisible(true);
            fitImage(this.hat, this.layout.maxWidth, this.layout.maxHeight);
        }

        this.collectible.setVisible(false).setTexture('wardrobe_doll_daily_v50').setPosition(accessoryX, accessoryY).setScale(1);
        if (look.collectibleTexture && this.scene.textures.exists(look.collectibleTexture)) {
            this.collectible.setTexture(look.collectibleTexture).setVisible(true);
            fitImage(this.collectible, 42, 42);
        }

        this.container.setData('paperDollLook', look);
    }

    drawHairClip(graphics, size) {
        graphics.fillStyle(0x8d6847).fillRoundedRect(-size / 2, -size * 0.15, size, size * 0.3, size * 0.15);
        graphics.fillStyle(0xe5bd72).fillRoundedRect(-size / 2 + 1, -size * 0.15 + 1, size - 2, size * 0.3 - 2, 4);
        for (let i = 0; i < 5; i += 1) {
            const angle = i * Math.PI * 2 / 5;
            graphics.fillStyle(0xfff4d7).fillCircle(
                Math.cos(angle) * size * 0.11,
                Math.sin(angle) * size * 0.11,
                size * 0.09
            );
        }
        graphics.fillStyle(0xe7a44b).fillCircle(0, 0, size * 0.07);
        return graphics;
    }

    destroy() {
        this.scene?.registry?.events?.off?.('changedata', this.onRegistryChange);
        if (this.container) this.container.destroy(true);
        this.container = null;
        this.body = null;
        this.hat = null;
        this.hatGraphic = null;
        this.collectible = null;
    }
}
