import AudioSystem from '../systems/AudioSystem.js';

const W = 1280;
const H = 720;
const CX = W / 2;
const CY = H / 2 - 18;

export default class RealmPortalTransition extends Phaser.Scene {
    constructor() { super('RealmPortalTransition'); }

    init(data) {
        this.targetScene = data?.targetScene || 'RealmWorldGame';
        this.targetData = { returnScene: data?.returnScene || 'WorldAtlas' };
        this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    }

    create() {
        AudioSystem.stopBgm(this);
        this.cameras.main.setBackgroundColor('#071620');

        const map = this.add.image(CX, H / 2, 'world_map_overview')
            .setDisplaySize(W, H)
            .setTint(0x769696);
        const dusk = this.add.rectangle(CX, H / 2, W, H, 0x071822, 0.18);
        const bloom = this.add.circle(CX, CY, 420, 0xb9fff1, 0.04)
            .setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({ targets: map, scaleX: 1.075, scaleY: 1.075, duration: 1900, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: dusk, alpha: 0.72, duration: 620, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: bloom, alpha: 0.14, scale: 0.52, duration: 1150, ease: 'Cubic.easeIn' });

        this.drawVignette();
        this.makeStorybookPortal();
        this.makeDandelionStream();
        this.makeDestinationCard();

        const total = this.reducedMotion ? 1050 : 2050;
        this.time.delayedCall(total - 420, () => this.finishTransition());
    }

    drawVignette() {
        const graphics = this.add.graphics().setDepth(5);
        for (let i = 0; i < 8; i += 1) {
            graphics.lineStyle(44, 0x07131c, 0.09 + i * 0.025);
            graphics.strokeRoundedRect(12 + i * 22, 12 + i * 14, W - 24 - i * 44, H - 24 - i * 28, 46);
        }
        graphics.alpha = 0;
        this.tweens.add({ targets: graphics, alpha: 1, duration: 460, ease: 'Sine.easeOut' });
    }

    makeStorybookPortal() {
        const portal = this.add.container(CX, CY).setDepth(20).setScale(0.12).setAlpha(0);
        const aura = this.add.circle(0, 0, 214, 0x9bfff0, 0.07)
            .setStrokeStyle(4, 0xffefb2, 0.26)
            .setBlendMode(Phaser.BlendModes.ADD);
        portal.add(aura);

        const petals = [];
        for (let i = 0; i < 12; i += 1) {
            const angle = i * 30;
            const rad = Phaser.Math.DegToRad(angle);
            const petal = this.add.ellipse(Math.cos(rad) * 151, Math.sin(rad) * 151, 62, 128,
                i % 2 ? 0xa5f2dd : 0xe4c5ff, 0.12)
                .setStrokeStyle(3, i % 2 ? 0xc9ffe9 : 0xf1dcff, 0.68)
                .setAngle(angle + 90)
                .setBlendMode(Phaser.BlendModes.ADD);
            petals.push(petal);
            portal.add(petal);
        }

        const rings = [
            this.add.arc(0, 0, 126, 8, 276, false).setStrokeStyle(6, 0xffefbd, 0.9),
            this.add.arc(0, 0, 103, 74, 345, false).setStrokeStyle(4, 0xa4f5e2, 0.94),
            this.add.arc(0, 0, 78, 168, 492, false).setStrokeStyle(3, 0xe7c8ff, 0.92)
        ];
        rings.forEach((ring) => {
            ring.setBlendMode(Phaser.BlendModes.ADD);
            portal.add(ring);
        });

        const core = this.add.circle(0, 0, 68, 0x244f68, 0.72)
            .setStrokeStyle(5, 0xe9fff5, 0.9);
        const star = this.add.star(0, 0, 8, 24, 48, 0xfff3b5, 0.92)
            .setStrokeStyle(4, 0xffffff, 0.75)
            .setBlendMode(Phaser.BlendModes.ADD);
        portal.add([core, star]);

        this.tweens.add({
            targets: portal,
            alpha: 1,
            scale: 1,
            angle: this.reducedMotion ? 0 : 7,
            duration: this.reducedMotion ? 360 : 720,
            ease: 'Back.easeOut'
        });
        this.tweens.add({ targets: petals, alpha: 0.42, scaleX: 1.08, scaleY: 1.08, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: rings[0], angle: 360, duration: 2400, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: rings[1], angle: -360, duration: 1850, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: rings[2], angle: 360, duration: 1350, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: star, angle: 180, scale: 1.2, alpha: 0.72, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: aura, scale: 1.16, alpha: 0.02, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.time.delayedCall(this.reducedMotion ? 650 : 1420, () => {
            this.tweens.add({ targets: portal, scale: 1.45, alpha: 0.18, duration: 420, ease: 'Cubic.easeIn' });
        });
    }

    makeDandelionStream() {
        for (let i = 0; i < (this.reducedMotion ? 18 : 42); i += 1) {
            const side = i % 2 ? -1 : 1;
            const x = CX + side * Phaser.Math.Between(270, 650);
            const y = CY + Phaser.Math.Between(-320, 320);
            const seed = this.add.container(x, y).setDepth(30).setAlpha(0);
            const glow = this.add.circle(0, 0, Phaser.Math.Between(2, 5), i % 3 ? 0xfff4bb : 0xb9fff1, 0.9)
                .setBlendMode(Phaser.BlendModes.ADD);
            const stem = this.add.rectangle(side * 6, 0, Phaser.Math.Between(7, 13), 1.2, 0xfff9d8, 0.72)
                .setAngle(Phaser.Math.Between(-35, 35));
            seed.add([glow, stem]);
            this.tweens.add({
                targets: seed,
                alpha: { from: 0, to: 0.95 },
                x: CX + Phaser.Math.Between(-24, 24),
                y: CY + Phaser.Math.Between(-24, 24),
                angle: Phaser.Math.Between(-120, 120),
                scale: 0.35,
                duration: this.reducedMotion ? 620 : Phaser.Math.Between(850, 1450),
                delay: this.reducedMotion ? Phaser.Math.Between(0, 180) : Phaser.Math.Between(80, 620),
                ease: 'Cubic.easeIn'
            });
        }
    }

    makeDestinationCard() {
        const card = this.add.container(CX, 626).setDepth(40).setAlpha(0);
        const lineLeft = this.add.rectangle(-250, 1, 150, 2, 0xffefb2, 0.65);
        const lineRight = this.add.rectangle(250, 1, 150, 2, 0xffefb2, 0.65);
        const leafLeft = this.add.ellipse(-164, 0, 20, 9, 0xb8f1c9, 0.9).setAngle(-18);
        const leafRight = this.add.ellipse(164, 0, 20, 9, 0xb8f1c9, 0.9).setAngle(18);
        const title = this.add.text(0, -18, '微 光 星 芽 谷', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '31px', color: '#fff2bd',
            fontStyle: 'bold', stroke: '#163f42', strokeThickness: 6
        }).setOrigin(0.5);
        const subtitle = this.add.text(0, 25, '循著母樹鐘聲，落進發光的童話畫卷', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '17px', color: '#e9fff2',
            stroke: '#102f35', strokeThickness: 4
        }).setOrigin(0.5);
        card.add([lineLeft, lineRight, leafLeft, leafRight, title, subtitle]);
        this.tweens.add({ targets: card, alpha: 1, y: 606, duration: this.reducedMotion ? 260 : 520, delay: 390, ease: 'Cubic.easeOut' });
    }

    finishTransition() {
        const wash = this.add.circle(CX, CY, 24, 0xfff7d7, 1)
            .setDepth(100)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: wash,
            scale: 42,
            duration: 380,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.cameras.main.flash(260, 255, 245, 210);
                this.scene.start(this.targetScene, this.targetData);
            }
        });
    }
}
