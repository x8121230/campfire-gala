// src/scenes/Start.js
import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import ConfigManager from '../systems/ConfigManager.js';
import WorldAtlas from './WorldAtlas.js';
import FogUnlock from './FogUnlock.js';
import RegionGuide from './RegionGuide.js';
import SubmapGames from './SubmapGames.js';
import FreeExplore from './FreeExplore.js';
import RealmPortalTransition from './RealmPortalTransition.js';
import RealmWorldGame from './RealmWorldGame.js';
import {
    FULLSCREEN_EVENT,
    fullscreenState,
    installMobileFullscreenListeners,
    toggleMobileFullscreen
} from '../systems/MobileFullscreen.js?v=mobile-fullscreen100';

export default class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    create() {
        installMobileFullscreenListeners();
        // 🔥 先停掉其他場景音樂
        AudioSystem.stopBgm(this);

        // 讀取存檔
        SaveSystem.applyToRegistry(this.registry);

        // 播放首頁音樂
        AudioSystem.playBgm(this, 'home_bgm', 0.4);

        // 背景
        const bg = this.add.image(640, 360, 'bg_home');
        bg.setDisplaySize(1280, 720);

        // ===== 首頁飄動螢火蟲 =====
        this.createFloatingFireflies();

        // ===== 開始冒險按鈕 =====
        const startBtnX = 640;
        const startBtnY = 560;

        // 雙層光圈（比之前明顯很多）
        const glowOuter = this.add.circle(startBtnX, startBtnY, 150, 0xffd54f, 0.18).setDepth(5);
        const glowInner = this.add.circle(startBtnX, startBtnY, 112, 0xfff3a3, 0.26).setDepth(6);

        // 外框閃光粒子
        const sparklePoints = [
            { x: startBtnX - 120, y: startBtnY - 8 },
            { x: startBtnX - 90, y: startBtnY + 34 },
            { x: startBtnX + 98, y: startBtnY - 28 },
            { x: startBtnX + 120, y: startBtnY + 16 },
            { x: startBtnX - 15, y: startBtnY - 52 }
        ];

        const sparkles = sparklePoints.map((p, i) => {
            const s = this.add.circle(p.x, p.y, i % 2 === 0 ? 4 : 3, 0xfff7c2, 0.95).setDepth(9);

            this.tweens.add({
                targets: s,
                alpha: 0.25,
                scaleX: 1.8,
                scaleY: 1.8,
                duration: 450 + i * 120,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 120
            });

            return s;
        });

        const startBtn = this.add.image(startBtnX, startBtnY, 'btn_start')
            .setInteractive({ useHandCursor: true })
            .setScale(0.84)
            .setDepth(10);

        // 按鈕浮動
        this.tweens.add({
            targets: [startBtn, glowOuter, glowInner, ...sparkles],
            y: '+=8',
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 光圈呼吸
        this.tweens.add({
            targets: glowOuter,
            alpha: 0.34,
            scaleX: 1.12,
            scaleY: 1.12,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: glowInner,
            alpha: 0.42,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // hover
        startBtn.on('pointerover', () => {
            this.tweens.add({
                targets: startBtn,
                scale: 0.9,
                duration: 120
            });

            this.tweens.add({
                targets: [glowOuter, glowInner],
                alpha: '+=0.08',
                duration: 120
            });
        });

        startBtn.on('pointerout', () => {
            this.tweens.add({
                targets: startBtn,
                scale: 0.84,
                duration: 120
            });

            this.tweens.add({
                targets: glowOuter,
                alpha: 0.18,
                duration: 120
            });

            this.tweens.add({
                targets: glowInner,
                alpha: 0.26,
                duration: 120
            });
        });

        // 點擊開始
        startBtn.on('pointerdown', () => {
            this.sound.play('click_sfx', { volume: 0.6 });

            this.tweens.add({
                targets: startBtn,
                scale: 0.8,
                duration: 80,
                yoyo: true
            });

            // ===== 母上的守護：按下開始冒險後消耗，並轉為聲望 +1 =====
            const equippedFullset = this.registry.get('equipped_fullset') || 'none';
            let ownedItems = this.registry.get('owned_items') || [];
            let reputation = this.registry.get('reputation') || 0;

            if (!Array.isArray(ownedItems)) {
                ownedItems = [];
            }

            if (
                equippedFullset === 'item_fullset_secret_guard' &&
                ownedItems.includes('item_fullset_secret_guard')
            ) {
                // 卸下
                this.registry.set('equipped_fullset', 'none');

                // 從背包移除
                ownedItems = ownedItems.filter(id => id !== 'item_fullset_secret_guard');
                this.registry.set('owned_items', ownedItems);

                // 聲望 +1
                this.registry.set('reputation', reputation + 1);

                console.log('✨ 母上的守護已消耗，聲望 +1');
            }

            // 存檔
            SaveSystem.saveFromRegistry(this.registry);

            this.time.delayedCall(140, () => {
                // 防止舊 main.js 被瀏覽器快取，首頁會自行確認新版地圖場景都已註冊。
                const requiredScenes = [
                    ['WorldAtlas', WorldAtlas],
                    ['FogUnlock', FogUnlock],
                    ['RegionGuide', RegionGuide],
                    ['SubmapGames', SubmapGames],
                    ['FreeExplore', FreeExplore],
                    ['RealmPortalTransition', RealmPortalTransition],
                    ['RealmWorldGame', RealmWorldGame]
                ];
                requiredScenes.forEach(([key, SceneClass]) => {
                    if (!this.scene.manager.keys[key]) {
                        this.scene.manager.add(key, SceneClass, false);
                    }
                });
                this.scene.start('WorldAtlas');
            });
        });

        // ===== 全螢幕按鈕 =====
        const fullscreenBtn = this.add.rectangle(1040, 60, 120, 50, 0x2d6cdf)
            .setDepth(999)
            .setInteractive({ useHandCursor: true });

        const fullscreenText = this.add.text(1040, 60, '全螢幕', {
            fontSize: '22px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setDepth(1000);

        fullscreenBtn.on('pointerover', () => {
            this.tweens.add({
                targets: [fullscreenBtn, fullscreenText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        fullscreenBtn.on('pointerout', () => {
            this.tweens.add({
                targets: [fullscreenBtn, fullscreenText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        const updateFullscreenLabel = () => {
            const state = fullscreenState();
            fullscreenText.setText(
                state === 'standalone' ? '已全螢幕' : state === 'windowed' ? '全螢幕' : '退出全螢幕'
            );
        };

        const onFullscreenChange = () => updateFullscreenLabel();
        window.addEventListener(FULLSCREEN_EVENT, onFullscreenChange);
        this.events.once('shutdown', () => {
            window.removeEventListener(FULLSCREEN_EVENT, onFullscreenChange);
        });

        fullscreenBtn.on('pointerdown', async () => {
            this.sound.play('click_sfx', { volume: 0.6 });
            const target = document.getElementById('game-container') || document.documentElement;
            const result = await toggleMobileFullscreen(target);
            updateFullscreenLabel();
            this.scale.refresh();

            if (result.needsInstallHelp) {
                this.showIOSFullscreenHelp();
            }
        });

        updateFullscreenLabel();

        // ===== 設定按鈕 =====
        const settingBtn = this.add.image(1180, 60, 'btn_setting')
            .setInteractive({ useHandCursor: true })
            .setScale(0.6)
            .setDepth(20);

        settingBtn.on('pointerover', () => {
            this.tweens.add({
                targets: settingBtn,
                scale: 0.65,
                duration: 120
            });
        });

        settingBtn.on('pointerout', () => {
            this.tweens.add({
                targets: settingBtn,
                scale: 0.6,
                duration: 120
            });
        });

        settingBtn.on('pointerdown', () => {
            this.sound.play('click_sfx', { volume: 0.6 });
            alert('設定功能未來加入');
        });

        // ===== 左下資訊 =====
        const crystals = this.registry.get('user_crystals') || 0;

        this.add.text(40, 650, `💎 水晶: ${crystals}`, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20);

        // 測試用：給收藏品
        let owned = this.registry.get('owned_items') || [];

        if (!owned.includes('item_collectible_scout_test_01')) {
            owned.push('item_collectible_scout_test_01');
            this.registry.set('owned_items', owned);
        }

        // ===== MINI 按鈕 =====
        const miniBtnX = 1040;
        const miniBtnY = 640;

        const miniBtnBg = this.add.rectangle(miniBtnX, miniBtnY, 180, 60, 0x8b5e34, 0.95)
            .setOrigin(0.5)
            .setDepth(300)
            .setInteractive({ useHandCursor: true });

        const miniBtnText = this.add.text(miniBtnX, miniBtnY, '小遊戲測試', {
            fontSize: '21px',
            color: '#ffffff',
            fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(301);

        miniBtnBg.on('pointerover', () => {
            this.tweens.add({
                targets: [miniBtnBg, miniBtnText],
                scale: 1.06,
                duration: 120
            });
        });

        miniBtnBg.on('pointerout', () => {
            this.tweens.add({
                targets: [miniBtnBg, miniBtnText],
                scale: 1,
                duration: 120
            });
        });

        miniBtnBg.on('pointerdown', () => {
            this.scene.start('MiniGameHub');
        });

        // ===== 開發用 GM 控制台 =====
        const gmEnabled = ConfigManager.get(
            'developer.gmEnabled',
            true,
            this.registry.get('game_config')
        );

        if (gmEnabled) {
            const gmBtnBg = this.add.rectangle(1190, 640, 110, 60, 0x356c54, 0.97)
                .setOrigin(0.5)
                .setDepth(300)
                .setStrokeStyle(3, 0xf0cf65)
                .setInteractive({ useHandCursor: true });

            const gmBtnText = this.add.text(1190, 640, 'GM 調整', {
                fontSize: '21px',
                color: '#fff7cf',
                fontStyle: 'bold',
                fontFamily: 'Microsoft JhengHei, Arial'
            }).setOrigin(0.5).setDepth(301);

            gmBtnBg.on('pointerover', () => this.tweens.add({
                targets: [gmBtnBg, gmBtnText],
                scale: 1.05,
                duration: 100
            }));
            gmBtnBg.on('pointerout', () => this.tweens.add({
                targets: [gmBtnBg, gmBtnText],
                scale: 1,
                duration: 100
            }));
            gmBtnBg.on('pointerdown', () => this.openGMPanel());

            this.input.keyboard?.on('keydown-G', (event) => {
                if (event.ctrlKey && event.shiftKey) this.openGMPanel();
            });
        }
    }

    openGMPanel() {
        this.sound.play('click_sfx', { volume: 0.6 });
        this.scene.start('GMPanel', { returnScene: 'Start' });
    }

    showIOSFullscreenHelp() {
        if (this.fullscreenHelp) return;

        const shade = this.add.rectangle(640, 360, 1280, 720, 0x07150f, 0.76)
            .setDepth(5000)
            .setInteractive();
        const panel = this.add.rectangle(640, 356, 820, 390, 0xfff8df, 0.98)
            .setDepth(5001)
            .setStrokeStyle(6, 0xe0a64d);
        const title = this.add.text(640, 232, 'iPhone 全畫面開啟方式', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#244a3a'
        }).setOrigin(0.5).setDepth(5002);
        const body = this.add.text(640, 342,
            'Safari 點下方「分享」\n→ 選擇「加入主畫面」\n→ 從桌面開啟《森林益智樂園》\n\n之後就能隱藏網址列，以全畫面遊玩。', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '27px',
                align: 'center',
                lineSpacing: 10,
                color: '#3c493f'
            }).setOrigin(0.5).setDepth(5002);
        const closeBg = this.add.rectangle(640, 508, 230, 62, 0x3f8a68, 1)
            .setDepth(5002)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(640, 508, '我知道了', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(5003);

        this.fullscreenHelp = [shade, panel, title, body, closeBg, closeText];
        closeBg.on('pointerdown', () => {
            this.fullscreenHelp.forEach(object => object.destroy());
            this.fullscreenHelp = null;
        });
    }

    createMiniGameButton(x, y, text, callback) {
        const bg = this.add.rectangle(x, y, 320, 100, 0xffffff)
            .setStrokeStyle(4, 0x000000)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, text, {
            fontSize: '32px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // hover效果（很加分🔥）
        bg.on('pointerover', () => {
            bg.setFillStyle(0xf5f5f5);
            this.tweens.add({ targets: bg, scale: 1.05, duration: 100 });
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0xffffff);
            this.tweens.add({ targets: bg, scale: 1.0, duration: 100 });
        });

        bg.on('pointerdown', callback);

        return { bg, label };
    }

    createFloatingFireflies() {
        const fireflyData = [
            { x: 180, y: 210, r: 3, delay: 0, duration: 2200 },
            { x: 240, y: 610, r: 4, delay: 150, duration: 2400 },
            { x: 1080, y: 185, r: 3, delay: 300, duration: 2100 },
            { x: 1115, y: 560, r: 4, delay: 450, duration: 2600 },
            { x: 980, y: 640, r: 3, delay: 600, duration: 2500 },
            { x: 120, y: 530, r: 4, delay: 760, duration: 2800 },
            { x: 890, y: 250, r: 3, delay: 920, duration: 2300 },
            { x: 325, y: 165, r: 3, delay: 1080, duration: 2700 }
        ];

        fireflyData.forEach((f) => {
            const glow = this.add.circle(f.x, f.y, f.r * 3.2, 0xffef99, 0.12).setDepth(3);
            const core = this.add.circle(f.x, f.y, f.r, 0xfff7b8, 0.95).setDepth(4);

            this.tweens.add({
                targets: [glow, core],
                alpha: { from: 0.2, to: 1 },
                duration: f.duration,
                yoyo: true,
                repeat: -1,
                delay: f.delay,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: [glow, core],
                x: f.x + Phaser.Math.Between(-18, 18),
                y: f.y + Phaser.Math.Between(-24, 24),
                duration: f.duration + 500,
                yoyo: true,
                repeat: -1,
                delay: f.delay,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: glow,
                scaleX: 1.25,
                scaleY: 1.25,
                duration: f.duration - 250,
                yoyo: true,
                repeat: -1,
                delay: f.delay,
                ease: 'Sine.easeInOut'
            });
        });
    }
}
