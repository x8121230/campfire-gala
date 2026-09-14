// src/scenes/BaseMiniGame.js
import AudioSystem from '../systems/AudioSystem.js';
export default class BaseMiniGame extends Phaser.Scene {
    constructor(key) {
        super(key);
    }

    init(data) {
        this.mapID = data?.mapID || '01';
        this.levelLabel = data?.label || '';

        // 一進小遊戲就先停掉所有 BGM
        AudioSystem.stopAllBgm(this);
    }


    createBackButton() {
        const btn = this.add.image(120, 60, 'btn_red')
            .setDisplaySize(160, 56)
            .setDepth(100)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(120, 60, '返回地圖', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(101);

        btn.on('pointerover', () => {
            this.tweens.add({
                targets: btn,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        btn.on('pointerout', () => {
            this.tweens.add({
                targets: btn,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        btn.on('pointerdown', () => {
            this.scene.start('WorldMap', {
                mapID: this.mapID
            });
        });
    }

    createTitle(title) {
        this.add.text(640, 70, title, {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createInfoText(text) {
        this.infoText = this.add.text(640, 140, text, {
            fontSize: '26px',
            color: '#ffffaa',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
    }
}