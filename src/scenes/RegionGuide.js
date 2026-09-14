import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import WorldProgressSystem from '../systems/WorldProgressSystem.js';
import { DEVELOPMENT_UNLOCK_ALL, getRegion, REGION_SUBMAPS } from '../data/WorldRegionData.js';

export default class RegionGuide extends Phaser.Scene {
    constructor() {
        super('RegionGuide');
        this.modal = null;
    }

    init(data) {
        this.regionId = data?.regionId || 'forest';
    }

    create() {
        this.modal = null;
        SaveSystem.applyToRegistry(this.registry);
        this.progress = WorldProgressSystem.read(this.registry);
        this.region = getRegion(this.regionId);
        AudioSystem.playBgm(this, this.regionId === 'forest' ? 'forest_music' : 'home_bgm', 0.38);

        const guideBackground = this.region.guideBackground
            || (this.regionId === 'forest' ? 'forest_region_overview_v2' : null);
        const hasGuideArt = guideBackground && this.textures.exists(guideBackground);
        if (hasGuideArt) this.add.image(640, 360, guideBackground).setDisplaySize(1280, 720);
        else this.add.image(640, 360, 'world_map_overview').setDisplaySize(1280, 720).setTint(0x8aa9a5);
        this.add.rectangle(640, 360, 1280, 720, 0x102c2f, 0.25);
        this.add.rectangle(640, 50, 1280, 100, 0x173c43, 0.88);

        const regionStars = WorldProgressSystem.regionStars(this.registry, this.regionId);
        this.add.text(640, 31, `${this.region.icon} ${this.region.name}　⭐ ${regionStars}`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '35px', color: '#fff0ac', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(640, 75, this.region.mechanic, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '20px', color: '#d7eef0'
        }).setOrigin(0.5);

        this.makeButton(92, 52, 145, 56, '← 世界地圖', () => this.scene.start('WorldAtlas'), 0x315e75);
        this.makeButton(1180, 52, 150, 56, '📖 貼紙圖鑑', () => this.showStickerBook(), 0x735d8c);
        (REGION_SUBMAPS[this.regionId] || []).forEach((submap, index) => this.createSubmapNode(submap, index));
        this.add.text(1160, 670, '👗 本區獎勵', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '19px', color: '#fff4bf',
            backgroundColor: '#173c43dd', padding: { x: 14, y: 9 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showRewardPreview());
    }

    getNodePoints() {
        return [{ x: 235, y: 495 }, { x: 650, y: 220 }, { x: 1035, y: 485 }];
    }

    createSubmapNode(submap, index) {
        const p = this.getNodePoints()[index];
        const available = DEVELOPMENT_UNLOCK_ALL || this.regionId === 'forest' || index === 0;
        const stars = (submap.stageIds || []).reduce((sum, id) => sum + Number((this.registry.get('stage_progress') || {})[id]?.stars || 0), 0);
        const maxStars = Math.max(1, (submap.stageIds || []).length * 3);
        const c = this.add.container(p.x, p.y).setDepth(5);
        const sign = this.add.graphics();
        sign.fillStyle(available ? 0xf7e7ba : 0xb7c2be, 0.94);
        sign.fillRoundedRect(-112, -63, 224, 126, 24);
        sign.lineStyle(5, available ? 0x8d6238 : 0x61716f, 0.96);
        sign.strokeRoundedRect(-112, -63, 224, 126, 24);
        sign.lineStyle(2, available ? 0xfff4cf : 0xd9dfdc, 0.85);
        sign.strokeRoundedRect(-103, -54, 206, 108, 19);
        const hit = this.add.zone(0, 0, 224, 126).setInteractive({ useHandCursor: true });
        const icon = this.add.text(0, -27, submap.icon, { fontSize: '43px' }).setOrigin(0.5);
        const title = this.add.text(0, 18, submap.name, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '24px', color: available ? '#3f543b' : '#596562', fontStyle: 'bold' }).setOrigin(0.5);
        const badge = this.add.text(0, 48, `⭐ ${stars}/${maxStars}`, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '17px', color: '#7b5a2f', fontStyle: 'bold' }).setOrigin(0.5);
        const leaves = this.add.text(-91, -49, '❧', { fontSize: '24px', color: '#79934d' }).setOrigin(0.5);
        c.add([sign, hit, icon, title, badge, leaves]);
        this.tweens.add({ targets: c, y: p.y - 5, duration: 1450 + index * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        hit.on('pointerover', () => c.setScale(1.06));
        hit.on('pointerout', () => c.setScale(1));
        hit.on('pointerdown', () => available ? this.openSubmap(submap) : this.showNotice(`${submap.name}正在整理中，很快就能探索！`));
    }

    openSubmap(submap) {
        if (this.regionId === 'forest') {
            this.registry.set('forest_submap_id', submap.id);
            this.scene.start('WorldMap', { mapID: '01', submapId: submap.id, returnScene: 'RegionGuide' });
            return;
        }
        this.scene.start('SubmapGames', { regionId: this.regionId, submapId: submap.id });
    }

    showStickerBook() {
        const progress = WorldProgressSystem.read(this.registry);
        const count = progress.stickers.length;
        this.showNotice(`📖 生態貼紙圖鑑\n目前已發現 ${count} 張貼紙`);
    }

    showRewardPreview() {
        this.showNotice('👗 本區服裝預覽\n完成子地圖的星星與貼紙後，將逐步揭開服裝剪影。');
    }

    showNotice(message) {
        if (this.modal) return;
        const shade = this.add.rectangle(640, 360, 1280, 720, 0x07161b, 0.62).setDepth(100).setInteractive();
        const panel = this.add.rectangle(640, 360, 620, 280, 0x244f53, 0.99).setDepth(101).setStrokeStyle(5, 0xf4d58b);
        const text = this.add.text(640, 330, message, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '24px', color: '#fff', align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(102);
        const close = this.makeButton(640, 440, 220, 58, '知道了', () => this.closeModal(), 0x47748a).setDepth(103);
        this.modal = [shade, panel, text, close];
    }

    closeModal() {
        (this.modal || []).forEach((item) => item?.destroy?.());
        this.modal = null;
    }

    makeButton(x, y, width, height, label, callback, color) {
        const c = this.add.container(x, y).setDepth(10);
        const bg = this.add.rectangle(0, 0, width, height, color, 0.98).setStrokeStyle(3, 0xffe6a7).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, label, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        c.add([bg, text]); bg.on('pointerdown', callback); bg.on('pointerover', () => c.setScale(1.04)); bg.on('pointerout', () => c.setScale(1));
        return c;
    }
}
