import AudioSystem from '../systems/AudioSystem.js';
import MiniGameTestSession from '../systems/MiniGameTestSession.js';
import {
    MINI_GAME_CATALOG,
    MINI_GAME_CATEGORIES,
    getMiniGameCategory,
    getMiniGamesByCategory
} from '../data/MiniGameCatalog.js';

const FONT = 'Microsoft JhengHei, Arial';
const CARDS_PER_PAGE = 6;

export default class MiniGameHub extends Phaser.Scene {
    constructor() {
        super('MiniGameHub');
    }

    init(data = {}) {
        this.requestedCategory = data.category || null;
        this.requestedPage = Number.isFinite(data.page) ? data.page : null;
    }

    create() {
        this.returnedTestSession = MiniGameTestSession.finish(this.registry);
        this.selectedCategory = this.getInitialCategory();
        this.currentPage = this.getInitialPage();
        this.cardObjects = [];
        this.tabObjects = [];
        this.paginationObjects = [];

        AudioSystem.playBgm(this, 'home_bgm', 0.34);
        this.createBackground();
        this.createHeader();
        this.createTabs();
        this.renderCatalog();

        this.input.keyboard?.on('keydown-LEFT', () => this.changePage(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.changePage(1));
        this.input.on('wheel', (_pointer, _objects, _deltaX, deltaY) => {
            if (Math.abs(deltaY) > 8) this.changePage(deltaY > 0 ? 1 : -1);
        });

        if (this.returnedTestSession) {
            const game = MINI_GAME_CATALOG.find((item) => item.id === this.returnedTestSession.gameId);
            this.showToast(`已從「${game?.title || '小遊戲'}」返回；獲得的寶箱可到右上寶箱架查看。`, 0x3d7958);
        }
    }

    getInitialCategory() {
        const remembered = this.registry.get('mini_game_hub_category');
        const candidate = this.requestedCategory || remembered || 'all';
        return MINI_GAME_CATEGORIES.some((category) => category.id === candidate) ? candidate : 'all';
    }

    getInitialPage() {
        if (this.requestedPage !== null) return Math.max(0, this.requestedPage);
        return Math.max(0, Number(this.registry.get('mini_game_hub_page') || 0));
    }

    createBackground() {
        if (this.textures.exists('mm_bg_forest')) {
            this.add.image(640, 360, 'mm_bg_forest').setDisplaySize(1280, 720);
        } else {
            this.add.rectangle(640, 360, 1280, 720, 0x315f45, 1);
        }

        this.add.rectangle(640, 360, 1280, 720, 0x123528, 0.5);
        this.add.rectangle(640, 49, 1280, 98, 0x173e31, 0.96);
        this.add.rectangle(640, 430, 1190, 466, 0xfffae9, 0.94)
            .setStrokeStyle(5, 0xe8c66f, 0.95);

        for (let index = 0; index < 22; index += 1) {
            const glow = this.add.circle(
                Phaser.Math.Between(20, 1260),
                Phaser.Math.Between(105, 690),
                Phaser.Math.Between(2, 4),
                index % 3 === 0 ? 0xffef92 : 0xa8e6b0,
                Phaser.Math.FloatBetween(0.16, 0.42)
            );
            this.tweens.add({
                targets: glow,
                alpha: 0.03,
                scale: 1.55,
                duration: Phaser.Math.Between(900, 1900),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 800)
            });
        }
    }

    createHeader() {
        this.createButton(300,49,240,88,'冒險手冊',0xf7e6a8,0x765929,'#5d492d',()=>this.scene.start('EquipmentJournal',{returnScene:'MiniGameHub'}),26);
        this.createButton(90, 49, 142, 54, '← 首頁', 0xf7e6a8, 0x765929, '#5d492d', () => {
            MiniGameTestSession.finish(this.registry);
            this.scene.start('Start');
        }, 22);

        this.add.text(640, 34, '🎮 小遊戲測試樂園', {
            fontFamily: FONT,
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#fff5bd',
            stroke: '#244b38',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 72, `目前收錄 ${MINI_GAME_CATALOG.length} 款・選擇分類後直接測試`, {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#dff5df'
        }).setOrigin(0.5);

        const safeBadge = this.add.rectangle(1115, 49, 250, 88, 0x315d4b, 0.98)
            .setStrokeStyle(3, 0xa9d7ad, 0.9);
        safeBadge.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start('ForestChestRoom'));
        this.add.text(safeBadge.x, safeBadge.y, '寶箱架・裝備收藏', {
            fontFamily: FONT,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#e9ffe8'
        }).setOrigin(0.5);
    }

    createTabs() {
        const tabWidth = 214;
        const gap = 8;
        const totalWidth = MINI_GAME_CATEGORIES.length * tabWidth + (MINI_GAME_CATEGORIES.length - 1) * gap;
        const startX = 640 - totalWidth / 2 + tabWidth / 2;

        MINI_GAME_CATEGORIES.forEach((category, index) => {
            const x = startX + index * (tabWidth + gap);
            const active = category.id === this.selectedCategory;
            const games = getMiniGamesByCategory(category.id);
            const bg = this.add.rectangle(x, 137, tabWidth, 54, active ? category.color : 0xf2ead6, 1)
                .setStrokeStyle(3, active ? 0xffffff : 0xb99f6d, active ? 0.9 : 0.7)
                .setInteractive({ useHandCursor: true });
            const label = this.add.text(x, 137, `${category.icon} ${category.label} ${games.length}`, {
                fontFamily: FONT,
                fontSize: '19px',
                fontStyle: 'bold',
                color: active ? '#ffffff' : '#5c503e'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                if (category.id !== this.selectedCategory) bg.setFillStyle(category.color, 0.2);
                this.tweens.add({ targets: [bg, label], scale: 1.025, duration: 90 });
            });
            bg.on('pointerout', () => {
                if (category.id !== this.selectedCategory) bg.setFillStyle(0xf2ead6, 1);
                this.tweens.add({ targets: [bg, label], scale: 1, duration: 90 });
            });
            bg.on('pointerdown', () => this.selectCategory(category.id));
            this.tabObjects.push({ category, bg, label });
        });
    }

    selectCategory(categoryId) {
        if (categoryId === this.selectedCategory) return;
        this.playClick();
        this.selectedCategory = categoryId;
        this.currentPage = 0;
        this.registry.set('mini_game_hub_category', categoryId);
        this.registry.set('mini_game_hub_page', 0);

        this.tabObjects.forEach(({ category, bg, label }) => {
            const active = category.id === categoryId;
            bg.setFillStyle(active ? category.color : 0xf2ead6, 1);
            bg.setStrokeStyle(3, active ? 0xffffff : 0xb99f6d, active ? 0.9 : 0.7);
            label.setColor(active ? '#ffffff' : '#5c503e');
        });
        this.renderCatalog();
    }

    renderCatalog() {
        this.cardObjects.forEach((object) => object?.destroy?.());
        this.paginationObjects.forEach((object) => object?.destroy?.());
        this.cardObjects = [];
        this.paginationObjects = [];

        const category = getMiniGameCategory(this.selectedCategory);
        const games = getMiniGamesByCategory(this.selectedCategory);
        const pageCount = Math.max(1, Math.ceil(games.length / CARDS_PER_PAGE));
        this.currentPage = Phaser.Math.Clamp(this.currentPage, 0, pageCount - 1);
        this.registry.set('mini_game_hub_page', this.currentPage);

        const pageGames = games.slice(
            this.currentPage * CARDS_PER_PAGE,
            this.currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE
        );
        const positions = [
            { x: 235, y: 303 }, { x: 640, y: 303 }, { x: 1045, y: 303 },
            { x: 235, y: 505 }, { x: 640, y: 505 }, { x: 1045, y: 505 }
        ];

        pageGames.forEach((game, index) => this.createGameCard(positions[index].x, positions[index].y, game));

        const footerY = 648;
        const title = this.add.text(72, footerY, `${category.icon} ${category.label}・共 ${games.length} 款`, {
            fontFamily: FONT,
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#5b604e'
        }).setOrigin(0, 0.5);
        this.paginationObjects.push(title);

        if (pageCount > 1) {
            const previous = this.createButton(520, footerY, 70, 42, '◀', 0x7e6bb1, 0x584584, '#ffffff', () => this.changePage(-1), 20);
            const next = this.createButton(760, footerY, 70, 42, '▶', 0x7e6bb1, 0x584584, '#ffffff', () => this.changePage(1), 20);
            const pageText = this.add.text(640, footerY, `第 ${this.currentPage + 1} / ${pageCount} 頁`, {
                fontFamily: FONT,
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#5d506d'
            }).setOrigin(0.5);
            previous.background.setAlpha(this.currentPage > 0 ? 1 : 0.38);
            next.background.setAlpha(this.currentPage < pageCount - 1 ? 1 : 0.38);
            this.paginationObjects.push(previous.container, next.container, pageText);
        } else {
            const pageText = this.add.text(640, footerY, '第 1 / 1 頁', {
                fontFamily: FONT,
                fontSize: '17px',
                color: '#777061'
            }).setOrigin(0.5);
            this.paginationObjects.push(pageText);
        }

        const hint = this.add.text(1208, footerY, '可用滑鼠滾輪或 ← → 換頁', {
            fontFamily: FONT,
            fontSize: '14px',
            color: '#7c786c'
        }).setOrigin(1, 0.5);
        this.paginationObjects.push(hint);
    }

    createGameCard(x, y, game) {
        const category = getMiniGameCategory(game.category);
        const container = this.add.container(x, y);
        const shadow = this.add.rectangle(6, 7, 360, 180, 0x173c2c, 0.17);
        const background = this.add.rectangle(0, 0, 360, 180, 0xffffff, 0.99)
            .setStrokeStyle(5, game.accent, 0.88);
        const accentBar = this.add.rectangle(-176, 0, 8, 168, game.accent, 1);
        const iconGlow = this.add.circle(-137, -42, 32, game.accent, 0.16);
        const icon = this.add.text(-137, -42, game.icon, {
            fontFamily: FONT,
            fontSize: '38px'
        }).setOrigin(0.5);
        const title = this.add.text(-94, -62, game.title, {
            fontFamily: FONT,
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#493b2e'
        }).setOrigin(0, 0.5);
        const subtitle = this.add.text(-94, -34, game.subtitle, {
            fontFamily: FONT,
            fontSize: '15px',
            color: '#756a59'
        }).setOrigin(0, 0.5);
        const description = this.add.text(-150, 9, game.description, {
            fontFamily: FONT,
            fontSize: '16px',
            color: '#59645b',
            wordWrap: { width: 300 },
            lineSpacing: 4
        }).setOrigin(0, 0.5);

        const statusBg = this.add.rectangle(-91, 52, 140, 32, category.color, 0.14)
            .setStrokeStyle(2, category.color, 0.55);
        const statusText = this.add.text(-91, 52, game.status, {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#4e554d'
        }).setOrigin(0.5);
        const recordText = this.add.text(-154, 79, this.getRecordLabel(game), {
            fontFamily: FONT,
            fontSize: '12px',
            color: '#7d7c70'
        }).setOrigin(0, 0.5);

        const buttonBg = this.add.rectangle(104, 62, 118, 46, game.accent, 1)
            .setStrokeStyle(3, 0xffffff, 0.75);
        const buttonText = this.add.text(104, 62, '開始測試', {
            fontFamily: FONT,
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#514936',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([
            shadow, background, accentBar, iconGlow, icon, title, subtitle, description,
            statusBg, statusText, recordText, buttonBg, buttonText
        ]);
        container.setSize(360, 180).setInteractive({ useHandCursor: true });
        container.on('pointerover', () => {
            background.setFillStyle(0xfffdf3, 1);
            this.tweens.add({ targets: container, y: y - 5, scale: 1.018, duration: 100 });
        });
        container.on('pointerout', () => {
            background.setFillStyle(0xffffff, 0.99);
            this.tweens.add({ targets: container, y, scale: 1, duration: 100 });
        });
        container.on('pointerdown', () => this.launchGame(game));
        this.cardObjects.push(container);
    }

    getRecordLabel(game) {
        if (!game.stageId) return '測試入口：可直接遊玩';
        const stage = (this.registry.get('stage_progress') || {})[game.stageId];
        if (!stage?.cleared) return '正式紀錄：尚未通關';
        return `正式紀錄：最高 ${Number(stage.bestScore || 0)} 分`;
    }

    changePage(direction) {
        const games = getMiniGamesByCategory(this.selectedCategory);
        const pageCount = Math.max(1, Math.ceil(games.length / CARDS_PER_PAGE));
        const nextPage = Phaser.Math.Clamp(this.currentPage + direction, 0, pageCount - 1);
        if (nextPage === this.currentPage) return;
        this.playClick();
        this.currentPage = nextPage;
        this.renderCatalog();
    }

    launchGame(game) {
        const availableScenes = this.scene?.manager?.keys || {};
        if (!availableScenes[game.scene]) {
            this.showToast(`「${game.title}」場景尚未接入。`, 0xa95c50);
            return;
        }

        this.playClick();
        this.registry.set('mini_game_hub_category', this.selectedCategory);
        this.registry.set('mini_game_hub_page', this.currentPage);
        MiniGameTestSession.begin(this.registry, game.id);
        this.scene.start(game.scene, {
            ...(game.launchData || {}),
            stageId: game.stageId,
            returnScene: 'MiniGameHub',
            mapID: '01',
            testMode: true
        });
    }

    createButton(x, y, width, height, label, fill, stroke, textColor, onClick, fontSize = 20) {
        const container = this.add.container(x, y);
        const background = this.add.rectangle(0, 0, width, height, fill, 1)
            .setStrokeStyle(3, stroke, 1);
        const text = this.add.text(0, 0, label, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: textColor
        }).setOrigin(0.5);
        container.add([background, text]);
        container.setSize(width, height).setInteractive({ useHandCursor: true });
        container.on('pointerover', () => container.setScale(1.035));
        container.on('pointerout', () => container.setScale(1));
        container.on('pointerdown', onClick);
        return { container, background, text };
    }

    showToast(message, fill = 0x3d7958) {
        this.toastObjects?.forEach((object) => object?.destroy?.());
        const panel = this.add.rectangle(640, 690, 620, 42, fill, 0.97)
            .setStrokeStyle(2, 0xffffff, 0.7)
            .setDepth(1000);
        const label = this.add.text(640, 690, message, {
            fontFamily: FONT,
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(1001);
        this.toastObjects = [panel, label];
        this.tweens.add({
            targets: this.toastObjects,
            alpha: 0,
            y: '+=8',
            delay: 1900,
            duration: 350,
            onComplete: () => {
                this.toastObjects?.forEach((object) => object?.destroy?.());
                this.toastObjects = null;
            }
        });
    }

    playClick() {
        if (this.cache.audio.exists('click_sfx')) this.sound.play('click_sfx', { volume: 0.35 });
    }
}
