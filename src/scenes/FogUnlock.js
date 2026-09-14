import SaveSystem from '../systems/SaveSystem.js';
import WorldProgressSystem from '../systems/WorldProgressSystem.js';
import { getRegion } from '../data/WorldRegionData.js';

export default class FogUnlock extends Phaser.Scene {
    constructor() {
        super('FogUnlock');
    }

    init(data) {
        this.regionId = data?.regionId || 'water';
        this.finished = false;
    }

    create() {
        SaveSystem.applyToRegistry(this.registry);
        const region = getRegion(this.regionId);
        this.add.image(640, 360, 'world_map_overview').setDisplaySize(1280, 720).setTint(0x9dbac4);
        this.add.rectangle(640, 45, 1280, 90, 0x17394d, 0.88);
        this.title = this.add.text(640, 31, `用手指擦掉 ${region.name} 的迷霧`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '31px', color: '#fff5c1', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.percentText = this.add.text(640, 72, '已擦除 0%　擦到 70% 就完成！', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '19px', color: '#ffffff'
        }).setOrigin(0.5);

        this.puffs = [];
        for (let row = 0; row < 6; row += 1) {
            for (let col = 0; col < 10; col += 1) {
                const puff = this.add.circle(370 + col * 60 + (row % 2) * 25, 190 + row * 68, 52, 0xe7f3f5, 0.88)
                    .setStrokeStyle(2, 0xffffff, 0.35).setInteractive();
                puff.cleared = false;
                this.puffs.push(puff);
            }
        }
        this.totalPuffs = this.puffs.length;
        this.input.on('pointerdown', (pointer) => this.eraseAt(pointer.x, pointer.y));
        this.input.on('pointermove', (pointer) => { if (pointer.isDown) this.eraseAt(pointer.x, pointer.y); });
        this.makeButton(1110, 665, 230, 55, '直接跳過演出', () => this.completeUnlock());
    }

    eraseAt(x, y) {
        if (this.finished) return;
        this.puffs.forEach((puff) => {
            if (!puff.cleared && Phaser.Math.Distance.Between(x, y, puff.x, puff.y) < 92) {
                puff.cleared = true;
                this.tweens.add({ targets: puff, alpha: 0, scale: 1.45, duration: 180, onComplete: () => puff.destroy() });
            }
        });
        const cleared = this.puffs.filter((puff) => puff.cleared).length;
        const percent = Math.round(cleared / this.totalPuffs * 100);
        this.percentText.setText(`已擦除 ${percent}%　擦到 70% 就完成！`);
        if (percent >= 70) this.completeUnlock();
    }

    completeUnlock() {
        if (this.finished) return;
        this.finished = true;
        const region = getRegion(this.regionId);
        WorldProgressSystem.unlock(this.registry, this.regionId);
        this.puffs.forEach((puff) => {
            if (puff?.active) this.tweens.add({ targets: puff, alpha: 0, duration: 380 });
        });
        this.cameras.main.flash(650, 255, 237, 171);
        this.add.text(640, 330, `✨ ${region.name}開放了！`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '49px', color: '#fff4a8',
            fontStyle: 'bold', stroke: '#17435a', strokeThickness: 7
        }).setOrigin(0.5).setDepth(10);
        this.add.text(640, 395, '發現第一件區域服裝的神祕剪影', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '24px', color: '#ffffff',
            backgroundColor: '#17394dcc', padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setDepth(10);
        this.time.delayedCall(1500, () => this.scene.start('RegionGuide', { regionId: this.regionId }));
    }

    makeButton(x, y, width, height, label, callback) {
        const bg = this.add.rectangle(x, y, width, height, 0x315e75, 0.96).setStrokeStyle(3, 0xffedb3).setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        return [bg, text];
    }
}
