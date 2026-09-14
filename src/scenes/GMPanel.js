import AudioSystem from '../systems/AudioSystem.js';
import ConfigManager from '../systems/ConfigManager.js';
import SaveSystem from '../systems/SaveSystem.js';
import { DEFAULT_STAGE_PROGRESS } from '../data/GameData.js';
import { CONSTELLATION_PATTERNS } from '../data/ConstellationData.js';

const BUSH_ACHIEVEMENT_IDS = [
    'bush_first_clear',
    'bush_three_clears',
    'bush_no_hint',
    'bush_perfect',
    'bush_no_flag',
    'gold_grass_collector'
];

const BUSH_REWARD_ITEM_ID = 'item_decoration_golden_bug_house_bush';
const BUSH_REWARD_TEXTURE = 'q_golden_bug_house';

const BUSH_PAGES = [
    {
        id: 'board',
        label: '盤面規則',
        description: '調整地圖、危險與容錯；新設定會在下一局生效。',
        kind: 'fields',
        fields: [
            { path: 'bushMinesweeper.board.rows', label: '地圖列數', hint: '建議 5～7', min: 5, max: 7, step: 1 },
            { path: 'bushMinesweeper.board.cols', label: '地圖欄數', hint: '建議 5～7', min: 5, max: 7, step: 1 },
            { path: 'bushMinesweeper.board.dangerCount', label: '危險總數', hint: '目前預設 6', min: 1, max: 20, step: 1 },
            { path: 'bushMinesweeper.board.mistakeLimit', label: '勇氣數量', hint: '預設 2；歸零立即失敗', min: 1, max: 5, step: 1 },
            { path: 'bushMinesweeper.board.hintCount', label: '精靈提示', hint: '每局可用次數', min: 0, max: 3, step: 1 }
        ]
    },
    {
        id: 'visual',
        label: '圖示比例',
        description: '數值代表圖示像素大小，可直接進測試關卡比較。',
        kind: 'fields',
        fields: [
            { path: 'bushMinesweeper.visuals.bushSize', label: '草叢大小', hint: '盤面未挖草叢', min: 45, max: 100, step: 2 },
            { path: 'bushMinesweeper.visuals.flagSize', label: '旗子大小', hint: '盤面標記旗子', min: 45, max: 100, step: 2 },
            { path: 'bushMinesweeper.visuals.dangerSize', label: '刺刺球大小', hint: '盤面危險主體', min: 55, max: 110, step: 2 },
            { path: 'bushMinesweeper.visuals.sideDangerSize', label: '資訊區刺刺球', hint: '找到危險旁圖示', min: 45, max: 100, step: 2 },
            { path: 'bushMinesweeper.visuals.goldBoardSize', label: '盤面金草', hint: '破關成長動畫', min: 55, max: 110, step: 2 },
            { path: 'bushMinesweeper.visuals.goldResultSize', label: '結算金草', hint: '結果視窗主圖', min: 90, max: 190, step: 5 }
        ]
    },
    {
        id: 'reward',
        label: '獎勵分數',
        description: '金草合計必須為 100％；一般滿分公式也必須正好等於 100。',
        kind: 'fields',
        fields: [
            { path: 'bushMinesweeper.goldGrass.rates.goldenGrass', label: '黃金草機率', hint: '一般圖鑑', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'bushMinesweeper.goldGrass.rates.rainbowGrass', label: '彩虹草機率', hint: '稀有圖鑑', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'bushMinesweeper.goldGrass.rates.mysteryGrass', label: '神祕草機率', hint: '超稀有圖鑑', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'bushMinesweeper.goldGrass.duplicatePity', label: '重複保底', hint: '連續重複幾次後保底', min: 1, max: 20, step: 1, suffix: '次' },
            { path: 'bushMinesweeper.score.clearPoints', label: '破關基礎分', hint: '成功就取得', min: 0, max: 100, step: 5, suffix: '分' },
            { path: 'bushMinesweeper.score.noDangerBonus', label: '無傷加分', hint: '沒有踩到刺刺球', min: 0, max: 100, step: 5, suffix: '分' },
            { path: 'bushMinesweeper.score.dangerPenaltyPerHit', label: '踩錯扣除', hint: '第一次失誤的扣分', min: 0, max: 100, step: 5, suffix: '分' },
            { path: 'bushMinesweeper.score.noHintBonus', label: '未提示加分', hint: '沒有使用精靈', min: 0, max: 100, step: 5, suffix: '分' }
        ]
    },
    {
        id: 'achievement',
        label: '成就門檻',
        description: '控制長期目標需要累積幾局，避免第一次玩就解完全部成就。',
        kind: 'fields',
        fields: [
            { path: 'bushMinesweeper.achievements.clearCountTarget', label: '累積破關成就', hint: '完成幾局後解鎖', min: 2, max: 30, step: 1, suffix: '局' },
            { path: 'bushMinesweeper.achievements.noHintClearTarget', label: '不用提示成就', hint: '累積不用提示破關', min: 2, max: 30, step: 1, suffix: '局' },
            { path: 'bushMinesweeper.achievements.perfectClearTarget', label: '完美小偵探', hint: '累積滿分幾局後解鎖', min: 2, max: 30, step: 1, suffix: '局' }
        ]
    },
    {
        id: 'test_data',
        label: '測試資料',
        description: '只處理草叢探險紀錄，不會影響其他小遊戲、衣服、水晶或聲望。',
        kind: 'bush_test'
    }
];

const FIREFLY_PAGES = [
    {
        id: 'firefly_rhythm',
        label: '節拍判定',
        description: '幼兒版預設 80 BPM 與寬鬆判定；建議先實玩，再小幅調整。',
        kind: 'fields',
        fields: [
            { path: 'fireflyCatch.rhythm.bpm', label: '歌曲速度', hint: '幼兒版預設 80', min: 70, max: 100, step: 5, suffix: ' BPM' },
            { path: 'fireflyCatch.rhythm.travelBeats', label: '預覽拍數', hint: '預設提前 5 拍出現', min: 4, max: 7, step: 1, suffix: '拍' },
            { path: 'fireflyCatch.rhythm.perfectWindowMs', label: 'Perfect 範圍', hint: '幼兒版前後 300ms', min: 150, max: 450, step: 25, suffix: 'ms' },
            { path: 'fireflyCatch.rhythm.goodWindowMs', label: 'Good 範圍', hint: '幼兒版前後 650ms', min: 400, max: 800, step: 25, suffix: 'ms' },
            { path: 'fireflyCatch.rhythm.missWindowMs', label: '漏接判定', hint: '超過 900ms 才算漏掉', min: 700, max: 1200, step: 50, suffix: 'ms' },
            { path: 'fireflyCatch.rhythm.musicVolumePercent', label: '音樂音量', hint: '只調整螢火小舞曲', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'fireflyCatch.rhythm.fireflySize', label: '螢火蟲大小', hint: '幼兒版預設 100，整條色道都能點', min: 70, max: 116, step: 2 }
        ]
    },
    {
        id: 'firefly_score',
        label: '分數',
        description: 'Perfect／Good 判定和最高 Combo 兩項合計必須等於滿分 100。',
        kind: 'fields',
        fields: [
            { path: 'fireflyCatch.score.accuracyPoints', label: '節拍判定分', hint: 'Perfect 得滿值、Good 得八成', min: 0, max: 100, step: 5, suffix: '分' },
            { path: 'fireflyCatch.score.comboPoints', label: '連擊分', hint: '連續找對就提高', min: 0, max: 100, step: 5, suffix: '分' }
        ]
    },
    {
        id: 'firefly_test',
        label: '測試資料',
        description: '只重置點點螢火，不會影響草叢探險或其他小遊戲。',
        kind: 'firefly_test'
    }
];

const CONSTELLATION_PAGES = [
    {
        id: 'constellation_play',
        label: '幼兒難度',
        description: '每場抽 3 位朋友；第一次固定小魚、小兔、貓頭鷹，之後優先安排尚未收集的朋友。',
        kind: 'fields',
        fields: [
            { path: 'constellation.game.roundCount', label: '每場朋友數', hint: '最多 3 位；完整圖鑑共有 6 位', min: 1, max: 3, step: 1, suffix: ' 位' },
            { path: 'constellation.game.snapRadius', label: '吸附範圍', hint: '越大越容易點中或拖中', min: 55, max: 100, step: 5, suffix: ' px' },
            { path: 'constellation.presentation.toneVolumePercent', label: '星星音階音量', hint: '每連一顆會播放不同音階', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'constellation.presentation.comboBurstEvery', label: '星光爆發間隔', hint: '每連幾顆出現大型星星特效', min: 2, max: 6, step: 1, suffix: ' 顆' },
            { path: 'constellation.presentation.rainbowChancePercent', label: '彩虹星機率', hint: '每位朋友出現彩虹星驚喜的機率', min: 0, max: 100, step: 5, suffix: '%' },
            { path: 'constellation.presentation.interactionItemCount', label: '互動物數量', hint: '朋友甦醒後要點擊的泡泡、星星或螢火蟲', min: 2, max: 5, step: 1, suffix: ' 個' }
        ]
    },
    {
        id: 'constellation_guide',
        label: '導航提示',
        description: '一般遊玩不顯示答案路線；手動提示或連續選錯時才會出現金色正確路線。',
        kind: 'fields',
        fields: [
            { path: 'constellation.game.idleHintSeconds', label: '密碼提醒等待', hint: '停下幾秒後只放大題目，不會公布答案', min: 3, max: 12, step: 1, suffix: ' 秒' },
            { path: 'constellation.game.branchHintMistakes', label: '錯路提示門檻', hint: '連續選錯幾次後顯示金色正確路線', min: 1, max: 4, step: 1, suffix: ' 次' }
        ]
    },
    {
        id: 'constellation_score',
        label: '分數',
        description: '點錯與主動提示只影響分數，不會讓幼兒中途失敗。',
        kind: 'fields',
        fields: [
            { path: 'constellation.score.wrongPenalty', label: '每次點錯扣分', hint: '預設扣 5 分', min: 0, max: 20, step: 1, suffix: ' 分' },
            { path: 'constellation.score.maxWrongPenalty', label: '點錯最多扣分', hint: '避免挫折感太重', min: 0, max: 50, step: 5, suffix: ' 分' },
            { path: 'constellation.score.hintPenalty', label: '主動提示扣分', hint: '自動提示不扣分', min: 0, max: 20, step: 1, suffix: ' 分' },
            { path: 'constellation.score.maxHintPenalty', label: '提示最多扣分', hint: '預設最多扣 20 分', min: 0, max: 50, step: 5, suffix: ' 分' },
            { path: 'constellation.score.minScore', label: '完成保底分', hint: '只要完成就至少有分', min: 0, max: 100, step: 5, suffix: ' 分' }
        ]
    },
    {
        id: 'constellation_test',
        label: '測試資料',
        description: '重置星空連線的分數、彩虹星與朋友圖鑑，不影響其他小遊戲。',
        kind: 'constellation_test'
    }
];

const GM_SECTIONS = [
    {
        id: 'common',
        label: '共用設定',
        pages: [{ id: 'common_settings', label: '設定檔', description: '管理全遊戲共用的設定檔；不會刪除玩家進度。', kind: 'common' }]
    },
    { id: 'bush', label: '草叢探險', pages: BUSH_PAGES },
    {
        id: 'firefly',
        label: '點點螢火',
        pages: FIREFLY_PAGES
    },
    {
        id: 'constellation',
        label: '星空連線',
        pages: CONSTELLATION_PAGES
    },
    {
        id: 'campfire',
        label: '營火小學堂',
        pages: [{ id: 'campfire_pending', label: '準備中', description: '營火小學堂的參數與測試資料會放在這個獨立分頁。', kind: 'placeholder' }]
    },
    {
        id: 'shape',
        label: '形色棋',
        pages: [{ id: 'shape_pending', label: '準備中', description: '形色棋的設定之後會獨立接入，不會與草叢參數混在一起。', kind: 'placeholder' }]
    },
    {
        id: 'more',
        label: '其他小遊戲',
        pages: [{ id: 'more_pending', label: '準備中', description: '新小遊戲會沿用相同分頁骨架，加入時不必重寫 GM 控制台。', kind: 'placeholder' }]
    }
];

export default class GMPanel extends Phaser.Scene {
    constructor() {
        super('GMPanel');
    }

    init(data = {}) {
        this.returnScene = data.returnScene || 'Start';
    }

    create() {
        AudioSystem.stopBgm(this);
        this.currentConfig = ConfigManager.getConfig();
        this.currentSectionId = 'common';
        this.currentPageId = 'common_settings';
        this.dynamicObjects = [];
        this.primaryButtons = [];
        this.pendingConfirmation = null;

        this.createBackground();
        this.createHeader();
        this.createPrimaryTabs();
        this.createFooter();
        this.renderPage();

        this.input.keyboard?.on('keydown-ESC', () => this.returnHome());
    }

    createBackground() {
        this.add.rectangle(640, 360, 1280, 720, 0x102f27);
        this.add.rectangle(640, 360, 1230, 680, 0xf7f4e8)
            .setStrokeStyle(6, 0xd8b84f);
        this.add.rectangle(640, 55, 1230, 90, 0x245a43);
        this.add.rectangle(145, 345, 220, 480, 0xe5ecd8)
            .setStrokeStyle(3, 0x799064);
        this.add.rectangle(755, 345, 930, 480, 0xfffdf5)
            .setStrokeStyle(3, 0xd6c89d);
    }

    createHeader() {
        this.add.text(55, 52, '森林益智樂園・GM控制台', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#fff6cf'
        }).setOrigin(0, 0.5);

        this.add.text(1215, 52, '設定版本 v' + this.currentConfig.version, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '18px',
            color: '#d7ead7'
        }).setOrigin(1, 0.5);
    }

    createPrimaryTabs() {
        this.add.text(145, 113, '功能分頁', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#31523d'
        }).setOrigin(0.5);

        this.primaryButtons = GM_SECTIONS.map((section, index) => {
            const button = this.makeButton(145, 153 + index * 66, 190, 50, section.label, 0xcbdab9, 0x6e8b55, () => {
                this.currentSectionId = section.id;
                this.currentPageId = section.pages[0].id;
                this.pendingConfirmation = null;
                this.renderPage();
            }, 19);
            return { section, button };
        });
    }

    createFooter() {
        this.statusText = this.add.text(750, 605, '', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '18px',
            color: '#3e644c',
            align: 'center',
            wordWrap: { width: 900 }
        }).setOrigin(0.5);

        this.makeButton(110, 665, 160, 50, '返回首頁', 0x8f958b, 0x4b513e, () => this.returnHome(), 18);
        this.makeButton(315, 665, 180, 50, '匯入設定', 0x5d86b5, 0x405a78, () => this.importConfig(), 18);
        this.makeButton(515, 665, 180, 50, '匯出設定', 0x5d86b5, 0x405a78, () => this.exportConfig(), 18);
        this.makeButton(725, 665, 190, 50, '儲存本機', 0x4c9167, 0x365f49, () => this.saveConfig(false), 18);
        this.primaryActionButton = this.makeButton(1045, 665, 300, 50, '儲存設定', 0xd9a52c, 0x7a601e, () => this.runPrimaryAction(), 18);
    }

    getCurrentSection() {
        return GM_SECTIONS.find((section) => section.id === this.currentSectionId) || GM_SECTIONS[0];
    }

    getCurrentPage() {
        const section = this.getCurrentSection();
        return section.pages.find((page) => page.id === this.currentPageId) || section.pages[0];
    }

    renderPage() {
        this.dynamicObjects.forEach((object) => object?.destroy?.());
        this.dynamicObjects = [];
        this.rewardTotalText = null;
        this.fireflyTotalText = null;
        this.unlockAllLabel = null;

        const section = this.getCurrentSection();
        const page = this.getCurrentPage();

        this.primaryButtons.forEach(({ section: itemSection, button }) => {
            const active = itemSection.id === section.id;
            button.redraw(active ? 0xf0c94e : 0xcbdab9);
            button.label.setColor(active ? '#4d3c13' : '#40553b');
        });

        this.dynamicObjects.push(
            this.add.text(310, 112, section.label, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '28px',
                fontStyle: 'bold',
                color: '#31523d'
            }).setOrigin(0, 0.5)
        );

        const subTabWidth = Math.min(160, Math.floor(850 / section.pages.length));
        const subTabStartX = 330 + subTabWidth / 2;
        section.pages.forEach((subPage, index) => {
            const button = this.makeButton(
                subTabStartX + index * (subTabWidth + 8),
                158,
                subTabWidth,
                40,
                subPage.label,
                subPage.id === page.id ? 0x79ad56 : 0xe1e8d4,
                0x6e8b55,
                () => {
                    this.currentPageId = subPage.id;
                    this.pendingConfirmation = null;
                    this.renderPage();
                },
                16
            );
            button.label.setColor(subPage.id === page.id ? '#ffffff' : '#40553b');
            this.dynamicObjects.push(button.container);
        });

        this.dynamicObjects.push(
            this.add.text(755, 205, page.description, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '18px',
                color: '#5e6958',
                align: 'center',
                wordWrap: { width: 850 }
            }).setOrigin(0.5)
        );

        if (page.kind === 'fields') this.renderFieldPage(page);
        if (page.kind === 'common') this.renderCommonPage();
        if (page.kind === 'bush_test') this.renderBushTestPage();
        if (page.kind === 'firefly_test') this.renderFireflyTestPage();
        if (page.kind === 'constellation_test') this.renderConstellationTestPage();
        if (page.kind === 'placeholder') this.renderPlaceholderPage(section);

        this.updatePrimaryAction();
    }

    renderFieldPage(page) {
        page.fields.forEach((field, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = column === 0 ? 535 : 975;
            const y = 260 + row * 78;
            this.createStepper(x, y, field);
        });

        if (page.id === 'reward') {
            this.rewardTotalText = this.add.text(755, 568, '', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '18px',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.dynamicObjects.push(this.rewardTotalText);
            this.refreshRewardTotal();
        }
        if (page.id === 'firefly_score') {
            this.fireflyTotalText = this.add.text(755, 500, '', {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '18px',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.dynamicObjects.push(this.fireflyTotalText);
            this.refreshFireflyScoreTotal();
        }

        this.refreshValidation();
    }

    renderCommonPage() {
        const cards = [
            { x: 525, title: '設定與存檔分離', body: '恢復正式參數只會調整遊戲數值，\n不會刪除圖鑑、成就或裝備。' },
            { x: 985, title: '各遊戲獨立管理', body: '草叢、螢火與後續小遊戲各有分頁，\n測試資料不會互相影響。' }
        ];

        cards.forEach((card) => {
            const bg = this.add.rectangle(card.x, 325, 410, 160, 0xf0f6e6)
                .setStrokeStyle(3, 0x9db780);
            const title = this.add.text(card.x, 285, card.title, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '23px',
                fontStyle: 'bold',
                color: '#35563d'
            }).setOrigin(0.5);
            const body = this.add.text(card.x, 340, card.body, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '17px',
                color: '#56634e',
                align: 'center',
                lineSpacing: 8
            }).setOrigin(0.5);
            this.dynamicObjects.push(bg, title, body);
        });

        const unlockAll = this.makeButton(585, 480, 300, 54, '', 0x6fa9d8, 0x456c8c, () => {
            const enabled = ConfigManager.get('worldMap.unlockAllStages', false, this.currentConfig) === true;
            ConfigManager.set('worldMap.unlockAllStages', !enabled, this.currentConfig);
            this.renderPage();
            this.setStatus('全關卡開放模式已切換；按「儲存共用設定」後生效。', '#37724d');
        }, 18);
        unlockAll.label.setText(
            ConfigManager.get('worldMap.unlockAllStages', false, this.currentConfig)
                ? '✨ 全關卡開放：開'
                : '🔒 全關卡開放：關'
        );
        const reset = this.makeButton(925, 480, 270, 54, '恢復正式預設參數', 0xb78563, 0x76523d, () => this.resetConfig(), 18);
        this.dynamicObjects.push(unlockAll.container, reset.container);
        this.setStatus('目前先開放全部關卡；之後可在這裡一鍵恢復聲望解鎖。');
    }

    renderBushTestPage() {
        const actions = [
            {
                y: 278,
                title: '重置今日狀態',
                body: '重新測試今日金草與今日最高分；保留圖鑑和成就。',
                label: '重置今日',
                color: 0x5d86b5,
                id: 'daily',
                confirm: '再次點擊「重置今日」即可確認；本次只重置草叢的今日紀錄。',
                action: () => this.resetBushDaily()
            },
            {
                y: 393,
                title: '重播成就通知',
                body: '保留累積數據與獎勵；下一次成功時重新判斷並播放成就。',
                label: '重播成就',
                color: 0xd2a62d,
                id: 'achievements',
                confirm: '再次點擊「重播成就」即可確認；既有獎勵不會重複放置。',
                action: () => this.replayBushAchievements()
            },
            {
                y: 508,
                title: '完整重置草叢進度',
                body: '清除草叢圖鑑、成就、分數、黃金蟲與黃金蟲小屋。',
                label: '完整重置',
                color: 0xb9534f,
                id: 'all',
                confirm: '再次點擊「完整重置」即可確認；其他小遊戲與共用資源不受影響。',
                action: () => this.resetBushProgress()
            }
        ];

        actions.forEach((item) => {
            const card = this.add.rectangle(755, item.y, 840, 92, 0xffffff)
                .setStrokeStyle(3, item.color, 0.72);
            const title = this.add.text(360, item.y - 17, item.title, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '21px',
                fontStyle: 'bold',
                color: '#334f3c'
            }).setOrigin(0, 0.5);
            const body = this.add.text(360, item.y + 18, item.body, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '15px',
                color: '#697064',
                wordWrap: { width: 520 }
            }).setOrigin(0, 0.5);
            const button = this.makeButton(1090, item.y, 150, 46, item.label, item.color, 0x564a36, () => {
                this.confirmTestAction(item.id, item.confirm, item.action);
            }, 17);
            this.dynamicObjects.push(card, title, body, button.container);
        });

        this.setStatus('測試資料按鈕都需要在 6 秒內點擊兩次才會執行。');
    }

    renderFireflyTestPage() {
        const stats = ((this.registry.get('minigame_stats') || {}).fireflyCatch || {});
        const summaryCard = this.add.rectangle(755, 320, 840, 150, 0xf2f8e8)
            .setStrokeStyle(3, 0x8cb56c, 0.9);
        const summaryTitle = this.add.text(755, 278, '目前測試紀錄', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#35563d'
        }).setOrigin(0.5);
        const summary = this.add.text(755, 342,
            `遊玩 ${stats.playCount || 0} 次　｜　最高 ${stats.bestScore || 0} 分　｜　` +
            `正確率 ${stats.bestAccuracy || 0}%　｜　連擊 ${stats.bestCombo || 0}`, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '19px',
                color: '#51654c',
                align: 'center'
            }).setOrigin(0.5);
        const reset = this.makeButton(755, 455, 260, 54, '重置點點螢火紀錄', 0xb9534f, 0x733b38, () => {
            this.confirmTestAction(
                'firefly_all',
                '再次點擊「重置點點螢火紀錄」即可確認；其他遊戲紀錄會保留。',
                () => this.resetFireflyCatchProgress()
            );
        }, 18);
        this.dynamicObjects.push(summaryCard, summaryTitle, summary, reset.container);
        this.setStatus('重置按鈕需要在 6 秒內點擊兩次才會執行。');
    }

    renderConstellationTestPage() {
        const stats = ((this.registry.get('minigame_stats') || {}).constellation || {});
        const foundFriends = CONSTELLATION_PATTERNS.filter((friend) => (
            Number(stats.friendEncyclopedia?.[friend.id]?.foundCount || 0) > 0
        )).length;
        const summaryCard = this.add.rectangle(755, 320, 840, 150, 0xf3f0ff)
            .setStrokeStyle(3, 0x9b83d1, 0.9);
        const summaryTitle = this.add.text(755, 278, '目前測試紀錄', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#554477'
        }).setOrigin(0.5);
        const summary = this.add.text(755, 342,
            `遊玩 ${stats.playCount || 0} 次　｜　最高 ${stats.bestScore || 0} 分　｜　` +
            `正確率 ${stats.bestAccuracy || 0}%　｜　圖鑑 ${foundFriends}/${CONSTELLATION_PATTERNS.length}　｜　🌈 ${stats.rainbowStarCount || 0}`, {
                fontFamily: 'Microsoft JhengHei, Arial',
                fontSize: '19px',
                color: '#625777',
                align: 'center'
            }).setOrigin(0.5);
        const reset = this.makeButton(755, 455, 280, 54, '重置星空連線紀錄', 0xb9534f, 0x733b38, () => {
            this.confirmTestAction(
                'constellation_all',
                '再次點擊「重置星空連線紀錄」即可確認；其他遊戲紀錄會保留。',
                () => this.resetConstellationProgress()
            );
        }, 18);
        this.dynamicObjects.push(summaryCard, summaryTitle, summary, reset.container);
        this.setStatus('重置按鈕需要在 6 秒內點擊兩次才會執行。');
    }

    renderPlaceholderPage(section) {
        const badge = this.add.rectangle(755, 345, 310, 150, 0xe9efe1)
            .setStrokeStyle(3, 0xa7b796);
        const icon = this.add.text(755, 315, '🧩', { fontSize: '54px' }).setOrigin(0.5);
        const title = this.add.text(755, 375, `${section.label}尚未接入`, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#52634d'
        }).setOrigin(0.5);
        this.dynamicObjects.push(badge, icon, title);
        this.setStatus('分頁骨架已保留；製作該小遊戲時再加入專屬參數與測試資料。');
    }

    createStepper(x, y, field) {
        const card = this.add.rectangle(x, y, 420, 66, 0xffffff)
            .setStrokeStyle(2, 0xc9ceb8);
        const label = this.add.text(x - 194, y - 14, field.label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#334f3c'
        }).setOrigin(0, 0.5);
        const hint = this.add.text(x - 194, y + 15, field.hint, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '13px',
            color: '#7a806f'
        }).setOrigin(0, 0.5);

        const minus = this.makeMiniButton(x + 82, y, '－', () => this.adjustField(field, -field.step));
        const valueText = this.add.text(x + 132, y, '', {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#294938'
        }).setOrigin(0.5);
        const plus = this.makeMiniButton(x + 182, y, '＋', () => this.adjustField(field, field.step));

        const refresh = () => {
            const value = ConfigManager.get(field.path, 0, this.currentConfig);
            valueText.setText(String(value) + (field.suffix || ''));
        };
        refresh();

        this.dynamicObjects.push(card, label, hint, minus.container, valueText, plus.container);
        field.refresh = refresh;
    }

    adjustField(field, amount) {
        const current = Number(ConfigManager.get(field.path, 0, this.currentConfig));
        const next = Phaser.Math.Clamp(current + amount, field.min, field.max);
        ConfigManager.set(field.path, next, this.currentConfig);
        field.refresh();
        this.refreshRewardTotal();
        this.refreshFireflyScoreTotal();
        this.refreshValidation('尚未儲存');
    }

    refreshRewardTotal() {
        if (!this.rewardTotalText) return;
        const rates = ConfigManager.get('bushMinesweeper.goldGrass.rates', {}, this.currentConfig);
        const total = Number(rates.goldenGrass) + Number(rates.rainbowGrass) + Number(rates.mysteryGrass);
        this.rewardTotalText.setText(`金草機率合計：${total}％`);
        this.rewardTotalText.setColor(total === 100 ? '#37724d' : '#bd4b43');
    }

    refreshFireflyScoreTotal() {
        if (!this.fireflyTotalText) return;
        const score = ConfigManager.get('fireflyCatch.score', {}, this.currentConfig);
        const total = Number(score.accuracyPoints) + Number(score.comboPoints);
        this.fireflyTotalText.setText(`兩項分數合計：${total} / ${score.maxScore || 100}`);
        this.fireflyTotalText.setColor(total === Number(score.maxScore || 100) ? '#37724d' : '#bd4b43');
    }

    refreshValidation(prefix = '') {
        const errors = ConfigManager.validate(this.currentConfig);
        if (errors.length > 0) {
            this.setStatus((prefix ? `${prefix}｜` : '') + errors[0], '#bd4b43');
        } else {
            const gameName = this.currentSectionId === 'firefly'
                ? '點點螢火'
                : this.currentSectionId === 'constellation'
                    ? '星空連線'
                    : '草叢探險';
            this.setStatus(prefix || `目前設定有效，可儲存或直接進入${gameName}測試。`);
        }
    }

    setStatus(message, color = '#3e644c') {
        this.statusText.setColor(color);
        this.statusText.setText(message);
    }

    updatePrimaryAction() {
        if (this.currentSectionId === 'bush') {
            this.primaryActionButton.label.setText('儲存並測試草叢探險');
            this.primaryActionButton.redraw(0xd9a52c);
        } else if (this.currentSectionId === 'firefly') {
            this.primaryActionButton.label.setText('儲存並測試點點螢火');
            this.primaryActionButton.redraw(0x6fa9d8);
        } else if (this.currentSectionId === 'constellation') {
            this.primaryActionButton.label.setText('儲存並測試星空連線');
            this.primaryActionButton.redraw(0x8e76cf);
        } else if (this.currentSectionId === 'common') {
            this.primaryActionButton.label.setText('儲存共用設定');
            this.primaryActionButton.redraw(0x4c9167);
        } else {
            this.primaryActionButton.label.setText('此遊戲尚未接入');
            this.primaryActionButton.redraw(0x9aa196);
        }
    }

    runPrimaryAction() {
        if (this.currentSectionId === 'bush') {
            this.saveConfig('bush');
            return;
        }
        if (this.currentSectionId === 'firefly') {
            this.saveConfig('firefly');
            return;
        }
        if (this.currentSectionId === 'constellation') {
            this.saveConfig('constellation');
            return;
        }
        if (this.currentSectionId === 'common') {
            this.saveConfig(false);
            return;
        }
        this.setStatus('這個小遊戲目前只有獨立分頁骨架，尚未接入可調參數。', '#7b5730');
    }

    saveConfig(testGame = null) {
        const result = ConfigManager.saveConfig(this.currentConfig);
        if (!result.ok) {
            this.setStatus(result.errors[0], '#bd4b43');
            return;
        }

        this.currentConfig = result.config;
        ConfigManager.applyToRegistry(this.registry);
        if (testGame === 'bush') {
            this.scene.start('BushExplore', { stageId: 'bush_01', stageData: {} });
        } else if (testGame === 'firefly') {
            this.scene.start('FireflyCatchGame', { stageId: 'firefly_01', stageData: {} });
        } else if (testGame === 'constellation') {
            this.scene.start('ConstellationGame', { stageId: 'constellation_01', stageData: {} });
        } else {
            this.setStatus('已儲存本機 GM 設定；相關遊戲會在下一局套用。');
        }
    }

    resetConfig() {
        this.currentConfig = ConfigManager.resetConfig();
        ConfigManager.applyToRegistry(this.registry);
        this.renderPage();
        this.setStatus('已恢復正式預設參數；玩家存檔與圖鑑不受影響。', '#7b5730');
    }

    confirmTestAction(actionId, message, action) {
        const now = Date.now();
        if (this.pendingConfirmation?.id === actionId && now - this.pendingConfirmation.startedAt <= 6000) {
            this.pendingConfirmation = null;
            action();
            return;
        }

        this.pendingConfirmation = { id: actionId, startedAt: now };
        this.setStatus(message, '#b36b23');
        this.time.delayedCall(6100, () => {
            if (this.pendingConfirmation?.id === actionId && Date.now() - this.pendingConfirmation.startedAt > 6000) {
                this.pendingConfirmation = null;
                this.setStatus('確認已逾時，沒有刪除任何資料。');
            }
        });
    }

    resetBushDaily() {
        const minigameStats = { ...(this.registry.get('minigame_stats') || {}) };
        minigameStats.treasure = {
            ...(minigameStats.treasure || {}),
            dailyGrassDate: '',
            dailyScoreDate: '',
            dailyBestScore: 0
        };
        this.registry.set('minigame_stats', minigameStats);
        SaveSystem.saveFromRegistry(this.registry);
        this.renderPage();
        this.setStatus('已重置草叢探險的今日金草與今日最高分。', '#37724d');
    }

    replayBushAchievements() {
        const achievements = (this.registry.get('achievements') || [])
            .filter((id) => !BUSH_ACHIEVEMENT_IDS.includes(id));
        this.registry.set('achievements', achievements);

        const minigameStats = { ...(this.registry.get('minigame_stats') || {}) };
        minigameStats.treasure = {
            ...(minigameStats.treasure || {}),
            fullAchievementRewardClaimed: false
        };
        this.registry.set('minigame_stats', minigameStats);
        SaveSystem.saveFromRegistry(this.registry);
        this.renderPage();
        this.setStatus('草叢成就標記已清除；下一次成功時會依現有進度重新播放。', '#37724d');
    }

    resetBushProgress() {
        const minigameStats = { ...(this.registry.get('minigame_stats') || {}) };
        minigameStats.treasure = this.createDefaultBushStats();
        this.registry.set('minigame_stats', minigameStats);
        this.registry.set('gold_grass_encyclopedia', []);
        this.registry.set(
            'achievements',
            (this.registry.get('achievements') || []).filter((id) => !BUSH_ACHIEVEMENT_IDS.includes(id))
        );

        const stageProgress = { ...(this.registry.get('stage_progress') || {}) };
        stageProgress.bush_01 = JSON.parse(JSON.stringify(DEFAULT_STAGE_PROGRESS.bush_01));
        this.registry.set('stage_progress', stageProgress);

        this.registry.set(
            'owned_items',
            (this.registry.get('owned_items') || []).filter((id) => id !== BUSH_REWARD_ITEM_ID)
        );
        this.registry.set(
            'new_items',
            (this.registry.get('new_items') || []).filter((id) => id !== BUSH_REWARD_ITEM_ID)
        );
        this.registry.set(
            'placed_decorations',
            (this.registry.get('placed_decorations') || []).filter(
                (item) => item.rewardId !== BUSH_REWARD_ITEM_ID && item.key !== BUSH_REWARD_TEXTURE
            )
        );

        SaveSystem.saveFromRegistry(this.registry);
        this.renderPage();
        this.setStatus('草叢探險已完整重置；其他遊戲、衣服、水晶與聲望均保留。', '#37724d');
    }

    resetFireflyCatchProgress() {
        const minigameStats = { ...(this.registry.get('minigame_stats') || {}) };
        minigameStats.fireflyCatch = this.createDefaultFireflyCatchStats();
        this.registry.set('minigame_stats', minigameStats);

        const stageProgress = { ...(this.registry.get('stage_progress') || {}) };
        stageProgress.firefly_01 = JSON.parse(JSON.stringify(DEFAULT_STAGE_PROGRESS.firefly_01));
        this.registry.set('stage_progress', stageProgress);

        SaveSystem.saveFromRegistry(this.registry);
        this.renderPage();
        this.setStatus('點點螢火的分數與遊玩紀錄已重置；其他遊戲均保留。', '#37724d');
    }

    resetConstellationProgress() {
        const minigameStats = { ...(this.registry.get('minigame_stats') || {}) };
        minigameStats.constellation = this.createDefaultConstellationStats();
        this.registry.set('minigame_stats', minigameStats);

        const stageProgress = { ...(this.registry.get('stage_progress') || {}) };
        stageProgress.constellation_01 = JSON.parse(JSON.stringify(DEFAULT_STAGE_PROGRESS.constellation_01));
        this.registry.set('stage_progress', stageProgress);

        SaveSystem.saveFromRegistry(this.registry);
        this.renderPage();
        this.setStatus('星空連線的分數、彩虹星與朋友圖鑑已重置；其他遊戲均保留。', '#37724d');
    }

    createDefaultBushStats() {
        return {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            bestBaseScore: 0,
            duplicateStreak: 0,
            noHintClearCount: 0,
            perfectClearCount: 0,
            noFlagClearCount: 0,
            noFlagAchievementRuleVersion: 2,
            dailyBestScore: 0,
            dailyScoreDate: '',
            dailyGrassDate: '',
            goldenBugUnlocked: false,
            goldenBugDiscovered: false,
            goldenBugFindCount: 0,
            goldenBugMissStreak: 0,
            fullAchievementRewardClaimed: false
        };
    }

    createDefaultFireflyCatchStats() {
        return {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            lastScore: 0,
            bestAccuracy: 0,
            bestCombo: 0,
            fastestSeconds: 0
        };
    }

    createDefaultConstellationStats() {
        return {
            playCount: 0,
            clearCount: 0,
            bestScore: 0,
            lastScore: 0,
            bestAccuracy: 0,
            bestCombo: 0,
            perfectClearCount: 0,
            fewestMistakes: null,
            fastestSeconds: 0,
            rainbowStarCount: 0,
            friendEncyclopedia: {}
        };
    }

    exportConfig() {
        const errors = ConfigManager.validate(this.currentConfig);
        if (errors.length > 0) {
            this.setStatus(errors[0], '#bd4b43');
            return;
        }

        const blob = new Blob([JSON.stringify(this.currentConfig, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'game_balance.json';
        anchor.click();
        URL.revokeObjectURL(url);
        this.setStatus('已匯出 game_balance.json，可作為正式版本設定檔。');
    }

    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(String(reader.result || ''));
                    const candidate = ConfigManager.merge(ConfigManager.getDefaultConfig(), parsed);
                    const errors = ConfigManager.validate(candidate);
                    if (errors.length > 0) throw new Error(errors[0]);
                    this.currentConfig = candidate;
                    this.renderPage();
                    this.setStatus('設定檔已載入；確認後請按「儲存本機」。', '#37724d');
                } catch (error) {
                    this.setStatus('匯入失敗：' + error.message, '#bd4b43');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    returnHome() {
        this.scene.start(this.returnScene);
    }

    makeMiniButton(x, y, label, onClick) {
        return this.makeButton(x, y, 42, 38, label, 0xe7edda, 0x7a8d68, onClick, 20);
    }

    makeButton(x, y, width, height, label, fill, stroke, onClick, fontSize = 20) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, width, height, fill)
            .setStrokeStyle(2, stroke)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Microsoft JhengHei, Arial',
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        bg.on('pointerover', () => container.setScale(1.025));
        bg.on('pointerout', () => container.setScale(1));
        bg.on('pointerdown', onClick);
        container.add([bg, text]);

        return {
            container,
            label: text,
            redraw(nextFill) {
                bg.setFillStyle(nextFill);
            }
        };
    }
}
