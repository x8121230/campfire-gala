import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import WorldProgressSystem from '../systems/WorldProgressSystem.js';
import { DEVELOPMENT_UNLOCK_ALL, WORLD_REGIONS } from '../data/WorldRegionData.js';

export default class WorldAtlas extends Phaser.Scene {
    constructor() {
        super('WorldAtlas');
        this.busy = false;
        this.modal = null;
    }

    create() {
        this.busy = false;
        this.modal = null;
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(640, 360);
        SaveSystem.applyToRegistry(this.registry);
        StageManager.applyToRegistry(this.registry);
        this.progress = WorldProgressSystem.read(this.registry);
        AudioSystem.playBgm(this, 'world_atlas_bgm', 0.34, 'home_bgm');

        this.map = this.add.image(640, 360, 'world_map_overview').setDisplaySize(1280, 720);
        this.add.rectangle(640, 35, 1280, 70, 0x123247, 0.78).setDepth(50);
        this.add.text(640, 34, '阿晨晨的世界冒險地圖', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '31px', color: '#fff6cf',
            fontStyle: 'bold', stroke: '#153247', strokeThickness: 5
        }).setOrigin(0.5).setDepth(51);

        this.add.text(28, 675, '⭐ ' + WorldProgressSystem.totalStars(this.registry), {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '23px', color: '#fff4a8',
            backgroundColor: '#173c55cc', padding: { x: 16, y: 8 }
        }).setDepth(51);

        this.makeButton(1190, 675, 150, 50, '回首頁', () => this.scene.start('Start'), 0x315e75).setDepth(60);
        WORLD_REGIONS.forEach((region) => this.createRegionMarker(region));
    }

    createRegionMarker(region) {
        const state = this.progress.regions[region.id] || {};
        const open = DEVELOPMENT_UNLOCK_ALL || region.alwaysUnlocked === true || (state.unlocked && state.fogCleared);
        const group = this.add.container(region.x, region.y).setDepth(20);
        const width = region.haloWidth || 180;
        const height = region.haloHeight || 150;
        const hit = this.createRegionHitArea(region);
        const labelY = height / 2 - 3;
        const labelBg = this.add.rectangle(0, labelY, Math.max(132, region.name.length * 28 + 38), 43, open ? 0x245c49 : 0x334956, 0.92)
            .setStrokeStyle(2, open ? 0xffe59a : 0xb7cbd1);
        const label = this.add.text(0, labelY - 1, `${region.icon} ${region.name}${open ? '' : ' 🔒'}`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '21px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        group.add([labelBg, label]);

        if (region.navigation === 'portal' && open) this.addRealmPortalAnimation(group, hit, labelBg, label);
        hit.on('pointerover', () => {
            this.tweens.add({ targets: group, scale: 1.035, duration: 120 });
            labelBg.setStrokeStyle(3, open ? 0xffedb3 : 0xd6ebef, 1);
        });
        hit.on('pointerout', () => {
            this.tweens.add({ targets: group, scale: 1, duration: 120 });
            labelBg.setStrokeStyle(2, open ? 0xffe59a : 0xb7cbd1, 1);
        });
        hit.on('pointerdown', () => this.onRegionPressed(region, group));
    }

    createRegionHitArea(region) {
        const points = region.hitPolygon || [
            [-region.haloWidth / 2, -region.haloHeight / 2],
            [region.haloWidth / 2, -region.haloHeight / 2],
            [region.haloWidth / 2, region.haloHeight / 2],
            [-region.haloWidth / 2, region.haloHeight / 2]
        ];
        const xs = points.map(([x]) => x);
        const ys = points.map(([, y]) => y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const localPoints = points.map(([x, y]) => ({ x: x - minX, y: y - minY }));
        const hit = this.add.zone(region.x + minX, region.y + minY, maxX - minX, maxY - minY)
            .setOrigin(0, 0)
            .setDepth(19);
        hit.setInteractive(new Phaser.Geom.Polygon(localPoints), Phaser.Geom.Polygon.Contains);
        if (hit.input) hit.input.cursor = 'pointer';
        return hit;
    }

    onRegionPressed(region, marker) {
        if (this.busy || this.modal) return;
        if (DEVELOPMENT_UNLOCK_ALL) {
            this.travelToRegion(region, marker);
            return;
        }
        const state = this.progress.regions[region.id] || {};
        if (region.alwaysUnlocked === true || (state.unlocked && state.fogCleared)) {
            this.travelToRegion(region, marker);
            return;
        }

        const stars = WorldProgressSystem.totalStars(this.registry);
        const canUnlock = stars >= region.unlockStars;
        this.showLockedCard(region, stars, canUnlock);
    }

    travelToRegion(region, marker) {
        this.busy = true;
        if (region.navigation === 'portal') {
            this.scene.start('RealmPortalTransition', { regionId: region.id, targetScene: region.targetScene });
            return;
        }
        this.cameras.main.pan(region.x, region.y, 480, 'Sine.easeInOut');
        this.cameras.main.zoomTo(1.35, 480, 'Sine.easeInOut');
        this.tweens.add({ targets: marker, scale: 1.12, duration: 240, yoyo: true });
        this.time.delayedCall(390, () => this.leafCurtain(() => {
            this.scene.start('RegionGuide', { regionId: region.id });
        }));
    }

    leafCurtain(done) {
        const left = this.add.rectangle(-320, 360, 650, 800, 0x285a3e).setDepth(200).setAngle(-7);
        const right = this.add.rectangle(1600, 360, 650, 800, 0x183e31).setDepth(200).setAngle(7);
        this.tweens.add({ targets: left, x: 315, duration: 360, ease: 'Quad.easeIn' });
        this.tweens.add({ targets: right, x: 965, duration: 360, ease: 'Quad.easeIn', onComplete: done });
    }

    addRealmPortalAnimation(group, hit, labelBg, label) {
        const outer = this.add.arc(0, -8, 67, 12, 326, false).setStrokeStyle(6, 0xbfa8ff, 0.9);
        const inner = this.add.arc(0, -8, 49, 198, 530, false).setStrokeStyle(5, 0x79ddff, 0.92);
        const core = this.add.circle(0, -8, 34, 0x5a2fa8, 0.22).setStrokeStyle(3, 0xead7ff, 0.76);
        const sparks = [];
        for (let index = 0; index < 8; index += 1) {
            const angle = Math.PI * 2 * index / 8;
            const spark = this.add.circle(Math.cos(angle) * 77, -8 + Math.sin(angle) * 68, index % 2 ? 3 : 4, index % 2 ? 0x8de7ff : 0xe8c8ff, 0.92);
            sparks.push(spark);
            this.tweens.add({ targets: spark, alpha: 0.25, scale: 1.7, duration: 520 + index * 55, delay: index * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        group.addAt([core, outer, inner, ...sparks], 1);
        group.bringToTop(labelBg);
        group.bringToTop(label);
        this.tweens.add({ targets: outer, angle: 360, duration: 2300, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: inner, angle: -360, duration: 1650, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: core, scale: 1.22, alpha: 0.42, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: group, y: group.y - 4, duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    showLockedCard(region, stars, canUnlock) {
        const shade = this.add.rectangle(640, 360, 1280, 720, 0x071722, 0.64).setDepth(100).setInteractive();
        const panel = this.add.rectangle(640, 365, 590, 330, 0x214b61, 0.98).setDepth(101).setStrokeStyle(5, 0xe5cf92);
        const title = this.add.text(640, 250, `${region.icon} ${region.name}`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '36px', color: '#fff2b7', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102);
        const message = canUnlock
            ? `森林星星已達成 ${stars}/${region.unlockStars}\n可以用手擦掉迷霧囉！`
            : `${region.mechanic}\n需要累積 ⭐ ${region.unlockStars}（目前 ${stars}）`;
        const body = this.add.text(640, 340, message, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '24px', color: '#ffffff', align: 'center', lineSpacing: 12
        }).setOrigin(0.5).setDepth(102);
        const action = this.makeButton(640, 455, 270, 62, canUnlock ? '開始擦除迷霧' : '我知道了', () => {
            this.closeModal();
            if (canUnlock) this.scene.start('FogUnlock', { regionId: region.id });
        }, canUnlock ? 0xd18438 : 0x47748a).setDepth(103);
        const close = this.makeButton(915, 225, 50, 46, '×', () => this.closeModal(), 0x8b4a4a).setDepth(103);
        this.modal = [shade, panel, title, body, action, close];
    }

    closeModal() {
        (this.modal || []).forEach((item) => item?.destroy?.());
        this.modal = null;
    }

    makeButton(x, y, width, height, label, callback, color) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, width, height, color, 0.97).setStrokeStyle(3, 0xffedb3).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, label, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '21px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        c.add([bg, text]);
        bg.on('pointerdown', callback);
        bg.on('pointerover', () => c.setScale(1.04));
        bg.on('pointerout', () => c.setScale(1));
        return c;
    }
}
