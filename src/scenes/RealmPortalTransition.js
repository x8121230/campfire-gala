import AudioSystem from '../systems/AudioSystem.js';

export default class RealmPortalTransition extends Phaser.Scene {
    constructor() { super('RealmPortalTransition'); }

    init(data) {
        this.targetScene = data?.targetScene || 'RealmWorldGame';
    }

    create() {
        AudioSystem.stopBgm(this);
        this.add.image(640, 360, 'world_map_overview').setDisplaySize(1280, 720).setTint(0x66719a);
        this.add.rectangle(640, 360, 1280, 720, 0x071020, 0.42);

        const portal = this.add.container(640, 350);
        const rings = [];
        for (let i = 0; i < 6; i += 1) {
            const ring = this.add.arc(0, 0, 74 + i * 38, 18 + i * 17, 325 - i * 13, false)
                .setStrokeStyle(12 - i, [0xbba6ff, 0x76d9ff, 0xe3b8ff][i % 3], 0.86);
            portal.add(ring);
            rings.push(ring);
            this.tweens.add({
                targets: ring,
                angle: i % 2 ? -360 : 360,
                duration: 900 + i * 140,
                repeat: -1,
                ease: 'Linear'
            });
        }

        const core = this.add.circle(0, 0, 72, 0x07122e, 0.96).setStrokeStyle(7, 0xf4dbff, 0.9);
        portal.add(core);
        this.tweens.add({ targets: core, scale: 1.18, alpha: 0.72, duration: 380, yoyo: true, repeat: -1 });

        for (let i = 0; i < 28; i += 1) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(190, 420);
            const spark = this.add.circle(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance,
                Phaser.Math.Between(2, 6),
                i % 2 ? 0xb9e8ff : 0xe4c1ff,
                0.9
            );
            portal.add(spark);
            this.tweens.add({
                targets: spark,
                x: 0,
                y: 0,
                alpha: 0,
                duration: Phaser.Math.Between(520, 1050),
                delay: Phaser.Math.Between(0, 450),
                repeat: 1
            });
        }

        this.add.text(640, 650, '正在穿越異界漩渦…', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '29px', color: '#f4e5ff',
            fontStyle: 'bold', stroke: '#171334', strokeThickness: 6
        }).setOrigin(0.5);

        this.cameras.main.zoomTo(1.12, 1250, 'Sine.easeIn');
        this.time.delayedCall(1150, () => {
            this.cameras.main.flash(420, 222, 205, 255);
            this.time.delayedCall(260, () => this.scene.start(this.targetScene, { returnScene: 'WorldAtlas' }));
        });
    }
}
