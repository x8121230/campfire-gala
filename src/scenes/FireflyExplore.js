import { FIREFLY_MAZES } from '../data/FireflyMazeData.js';
import { ENEMY_DB } from '../data/EnemyData.js';

export default class FireflyExplore extends Phaser.Scene {
    constructor() {
        super('FireflyExplore');
    }

    create() {
        this.gameWidth = 1280;
        this.gameHeight = 720;
        this.isGameOver = false;

        // ===== 關卡設定 =====
        this.levelKey = this.registry.get('firefly_stage_key') || 'stage_1';
        this.levelData = FIREFLY_MAZES[this.levelKey] || FIREFLY_MAZES.stage_1;

        this.tileSize = this.levelData.tileSize || 64;
        this.offsetX = this.levelData.offsetX ?? 160;
        this.offsetY = this.levelData.offsetY ?? 70;

        this.mapData = this.levelData.map || [];
        this.rows = this.mapData.length;
        this.cols = this.mapData[0]?.length || 0;

        this.worldWidth = this.cols * this.tileSize + this.offsetX * 2;
        this.worldHeight = this.rows * this.tileSize + this.offsetY * 2;

        this.levelName = this.levelData.name || '點點螢火';
        this.levelHint = this.levelData.hint || '找到終點。';
        this.levelTheme = this.levelData.theme || 'mushroom';

        this.levelCollectibles = this.levelData.collectibles || [];
        this.levelHazards = this.levelData.hazards || [];
        this.levelDecorations = this.levelData.decorations || [];

        // ===== 回合 / 步數 =====
        this.turnCount = 0;         // 成功移動幾回合
        this.stepCount = 0;         // 先跟 turnCount 同步
        this.enemyActing = false;   // 怪物回合中
        this.battleLocked = false;  // 戰鬥中先鎖住輸入

        // ===== 隨機起點 / 終點 / 怪物 =====
        const randomSetup = this.pickRandomPoints(this.levelData);

        if (randomSetup) {
            this.startTile = randomSetup.startTile;
            this.goalTile = randomSetup.goalTile;
            this.levelHazards = randomSetup.hazards;
            this.levelCollectibles = randomSetup.collectibles;
        } else {
            this.startTile = { row: 1, col: 1 };
            this.goalTile = { row: 1, col: 8 };
            this.levelHazards = this.levelData.hazards || [];
            this.levelCollectibles = this.levelData.collectibles || [];
        }

        console.log('隨機起點:', this.startTile);
        console.log('隨機終點:', this.goalTile);
        console.log('隨機怪物:', this.levelHazards);

        // ===== 戰鬥系統 =====
        this.inBattle = false;
        this.currentEnemy = null;
        this.battleQuestionIndex = 0;
        this.battleMaxQuestions = 3;
        this.postBattleCooldown = 0;


        // ===== 四色能力（P2先固定，之後再由P1帶入）=====
        this.fireflyPower = {
            yellow: 3,
            blue: 1,
            green: 2,
            red: 2
        };

        // ===== 光能 / 視野 =====
        this.moveEnergyCost = 2;

        this.maxLightEnergy = this.getGreenEnergyCap(this.fireflyPower.green);
        this.lightEnergy = this.maxLightEnergy;

        this.currentVisionLevel = this.getCurrentVisionLevel();
        this.lightRadius = 0;
        this.targetLightRadius = 0;
        this.visibleTileKeys = new Set();

        // ===== 紅光爆發 =====
        this.redBurstActive = false;
        this.redBurstUseCount = 0;
        this.redBurstMaxUses = 2;
        this.redBurstCooldownSteps = 0;
        this.redBurstCooldownMax = 5;
        this.redBurstStealth = false;
        this.pendingBurstCooldownSet = false;

        // ===== 視覺狀態 =====
        this.uiSoftenedUntil = 0;
        this.lowEnergyHeartbeatPlaying = false;

        // ===== 虛擬搖桿 =====
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.joystickBaseX = 225;
        this.joystickBaseY = 575;
        this.joystickRadius = 58;
        this.joystickDx = 0;
        this.joystickDy = 0;

        // ===== 場景資料 =====
        this.walkableTiles = [];
        this.wallTiles = [];
        this.collectibles = [];
        this.hazards = [];

        // ===== 相機 =====
        this.baseCameraZoom = 1.24;
        this.cameras.main.setBackgroundColor('#06080b');
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // ===== 建立場景 =====
        console.log('A 抽完後 start =', this.startTile);
        console.log('A 抽完後 goal =', this.goalTile);

        this.drawMaze();

        console.log('B drawMaze 後 start =', this.startTile);
        console.log('B drawMaze 後 goal =', this.goalTile);

        this.createDecorations();
        this.createObjectsFromMap();
        this.createPlayer();
        this.createHUD();
        this.createDarkOverlay();
        this.setupInput();
        this.createVirtualJoystick();

        this.input.keyboard.on('keydown-SPACE', () => {
            this.activateRedBurst();
        });

        if (this.player) {
            this.cameras.main.startFollow(this.player, true, 0.11, 0.11);
        }

        this.cameras.main.setZoom(this.baseCameraZoom);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.recalculateVision(true);
        this.applyVisibilityToWorld();
        this.updateLowEnergyEffects(0);

        this.setMessage(`${this.levelName}：${this.levelHint}`);
        this.updateHUD();
        this.redrawDarkOverlay();
    }

    checkPlayerTouchEnemy() {
        if (!this.player || !this.hazards || this.isGameOver) return false;
        if (this.battleLocked || this.inBattle) return false;
        if (this.postBattleCooldown > 0) return false;

        for (const hazard of this.hazards) {
            if (hazard.row === this.playerRow && hazard.col === this.playerCol) {
                this.triggerEnemyEncounter(hazard);
                return true;
            }
        }

        return false;
    }

    pickRandomPoints(stageData) {
        const zones = stageData.randomZones;
        if (!zones) return null;

        const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const pickMany = (arr, count) => Phaser.Utils.Array.Shuffle([...arr]).slice(0, count);

        const yellowPoints = zones.yellowPoints || [];
        const yellowPairs = zones.yellowPairs || [];

        if (yellowPoints.length === 0 || yellowPairs.length === 0) {
            return null;
        }

        const pointMap = {};
        yellowPoints.forEach(point => {
            pointMap[point.id] = point;
        });

        // ===== 抽一組合法起終點 =====
        const pickedPair = pickOne(yellowPairs);

        const startPoint = pointMap[pickedPair.start];
        const goalPoint = pointMap[pickedPair.goal];

        if (!startPoint || !goalPoint) {
            console.warn('yellowPairs 對不到 yellowPoints:', pickedPair);
            return null;
        }

        // ===== 過濾：避免危險/寶箱跟起終點重疊 =====
        const isSameTile = (a, b) => a.row === b.row && a.col === b.col;

        const dangerMainPool = (zones.danger_main || []).filter(p =>
            !isSameTile(p, startPoint) && !isSameTile(p, goalPoint)
        );

        const dangerSidePool = (zones.danger_side || []).filter(p =>
            !isSameTile(p, startPoint) && !isSameTile(p, goalPoint)
        );

        const chestMainPool = (zones.chest_main || []).filter(p =>
            !isSameTile(p, startPoint) && !isSameTile(p, goalPoint)
        );

        const chestSidePool = (zones.chest_side || []).filter(p =>
            !isSameTile(p, startPoint) && !isSameTile(p, goalPoint)
        );

        // ===== 危險：主線 2 個 + 支線 1 個（有幾個抽幾個）=====
        const mainHazards = pickMany(dangerMainPool, Math.min(2, dangerMainPool.length));
        const sideHazards = pickMany(dangerSidePool, Math.min(1, dangerSidePool.length));

        const hazards = [...mainHazards, ...sideHazards].map(p => ({
            row: p.row,
            col: p.col,
            type: p.type || 'wolf',
            damage: p.damage ?? 8,

            aggroRange: p.aggroRange ?? 2,
            chaseTurns: p.chaseTurns ?? 3,
            moveMode: p.moveMode || 'static',
            patrolRadius: p.patrolRadius ?? 2,
            attractedToLight: p.attractedToLight ?? true,

            enemyId: p.enemyId || 'wolf_common'
        }));

        // ===== 寶箱：主線 1 個 + 支線 1 個（有幾個抽幾個）=====
        const mainChests = pickMany(chestMainPool, Math.min(1, chestMainPool.length));
        const sideChests = pickMany(chestSidePool, Math.min(1, chestSidePool.length));

        const collectibles = [...mainChests, ...sideChests].map(p => ({
            row: p.row,
            col: p.col,
            type: p.type || 'yellow'
        }));

        return {
            startTile: {
                row: startPoint.row,
                col: startPoint.col
            },
            goalTile: {
                row: goalPoint.row,
                col: goalPoint.col
            },
            hazards,
            collectibles
        };
    }

    // =========================================================
    // 規格 / 能力
    // =========================================================
    getGreenEnergyCap(level) {
        const caps = {
            0: 30,
            1: 36,
            2: 42,
            3: 48
        };
        return caps[level] ?? 30;
    }

    getCurrentVisionLevel() {
        if (this.redBurstActive) return 5;

        const yellowLv = Phaser.Math.Clamp(this.fireflyPower.yellow || 1, 1, 3);
        return yellowLv;
    }

    getVisionOffsetsByLevel(level) {
        const templates = {
            1: [
                [0, 0],
                [0, -1], [0, 1], [-1, 0], [1, 0]
            ],

            2: [
                [0, 0],
                [0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1]
            ],

            3: [
                [0, 0],
                [0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1],
                [0, -2], [0, 2], [-2, 0], [2, 0]
            ],

            // 預留：裝備加乘
            4: [
                [0, 0],
                [0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1],
                [0, -2], [0, 2], [-2, 0], [2, 0],
                [-2, -1], [2, -1], [-2, 1], [2, 1],
                [-1, -2], [1, -2], [-1, 2], [1, 2]
            ],

            // 爆發 LV5
            5: [
                [0, 0],
                [0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1],
                [0, -2], [0, 2], [-2, 0], [2, 0],
                [-2, -1], [2, -1], [-2, 1], [2, 1],
                [-1, -2], [1, -2], [-1, 2], [1, 2],
                [0, -3], [0, 3], [-3, 0], [3, 0]
            ]
        };

        return templates[level] || templates[1];
    }

    getTargetLightRadiusByLevel(level) {
        const map = {
            1: this.tileSize * 1.4,
            2: this.tileSize * 1.9,
            3: this.tileSize * 2.25,
            4: this.tileSize * 2.7,
            5: this.tileSize * 3.2
        };
        return map[level] ?? this.tileSize * 1.9;
    }

    recalculateVision(force = false) {
        this.currentVisionLevel = this.getCurrentVisionLevel();

        const offsets = this.getVisionOffsetsByLevel(this.currentVisionLevel);
        const newVisibleKeys = new Set();

        for (const [dx, dy] of offsets) {
            const row = this.playerRow + dy;
            const col = this.playerCol + dx;

            if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) continue;
            newVisibleKeys.add(`${row},${col}`);
        }

        this.visibleTileKeys = newVisibleKeys;

        this.targetLightRadius = this.getTargetLightRadiusByLevel(this.currentVisionLevel);

        if (force) {
            this.lightRadius = this.targetLightRadius;
        }
    }

    isTileVisible(row, col) {
        return this.visibleTileKeys.has(`${row},${col}`);
    }

    // =========================================================
    // 地圖 / 場景建立
    // =========================================================
    drawMaze() {
        this.walkableTiles = [];
        this.wallTiles = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.mapData[row][col];

                const x = this.offsetX + col * this.tileSize;
                const y = this.offsetY + row * this.tileSize;
                const centerX = x + this.tileSize / 2;
                const centerY = y + this.tileSize / 2;

                const isRoad = this.isRoadCell(cell);

                if (!isRoad) {
                    const grass = this.add.rectangle(
                        centerX,
                        centerY,
                        this.tileSize,
                        this.tileSize,
                        0x183018,
                        1
                    );
                    grass.setDepth(1);
                    grass.setStrokeStyle(1, 0x355335, 0.18);

                    this.wallTiles.push({
                        row,
                        col,
                        x,
                        y,
                        centerX,
                        centerY,
                        rect: grass
                    });
                } else {
                    const road = this.add.rectangle(
                        centerX,
                        centerY,
                        this.tileSize,
                        this.tileSize,
                        0xe8dcc7,
                        0.96
                    );
                    road.setStrokeStyle(2, 0x7d6248, 0.38);
                    road.setDepth(2);

                    this.walkableTiles.push({
                        row,
                        col,
                        x,
                        y,
                        centerX,
                        centerY,
                        rect: road
                    });

                    // ===== 隨機起點標記 =====
                    if (
                        this.startTile &&
                        row === this.startTile.row &&
                        col === this.startTile.col
                    ) {
                        const startMark = this.add.circle(centerX, centerY, 12, 0x7dd3fc, 0.72);
                        startMark.setDepth(3);

                        this.startTile = {
                            ...this.startTile,
                            x: centerX,
                            y: centerY,
                            mark: startMark
                        };
                    }

                    // ===== 隨機終點標記 =====
                    if (
                        this.goalTile &&
                        row === this.goalTile.row &&
                        col === this.goalTile.col
                    ) {
                        const goalGlow = this.add.circle(centerX, centerY, 18, 0xffec8b, 0.95);
                        goalGlow.setDepth(3);

                        const goalStar = this.add.text(centerX, centerY, '⭐', {
                            fontSize: '34px'
                        }).setOrigin(0.5);
                        goalStar.setDepth(4);

                        this.tweens.add({
                            targets: goalGlow,
                            scale: 1.18,
                            alpha: 0.45,
                            duration: 700,
                            yoyo: true,
                            repeat: -1
                        });

                        this.goalTile = {
                            ...this.goalTile,
                            x: centerX,
                            y: centerY,
                            glow: goalGlow,
                            star: goalStar
                        };
                    }
                }
            }
        }
    }

    isRoadCell(cell) {
        return cell === 1 || cell === 2 || cell === 3;
    }

    createDecorations() {
        for (let i = 0; i < 35; i++) {
            const x = Phaser.Math.Between(this.offsetX, this.worldWidth - this.offsetX);
            const y = Phaser.Math.Between(this.offsetY, this.worldHeight - this.offsetY);

            const g1 = this.add.rectangle(x - 8, y + 2, 4, 16, 0x335d32, 0.55).setAngle(-12);
            const g2 = this.add.rectangle(x, y, 4, 18, 0x3f7440, 0.62);
            const g3 = this.add.rectangle(x + 8, y + 2, 4, 16, 0x335d32, 0.55).setAngle(12);

            g1.setDepth(1);
            g2.setDepth(1);
            g3.setDepth(1);
        }
    }

    createObjectsFromMap() {
        // ===== collectibles =====
        this.levelCollectibles.forEach(item => {
            const x = this.offsetX + item.col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + item.row * this.tileSize + this.tileSize / 2;

            let color = 0xffe680;
            if (item.type === 'blue') color = 0x8fd3ff;
            if (item.type === 'green') color = 0x9be27a;
            if (item.type === 'red') color = 0xff8f8f;

            const glow = this.add.circle(x, y, 14, color, 0.85).setDepth(5);
            const core = this.add.circle(x, y, 7, 0xffffff, 0.92).setDepth(6);

            this.tweens.add({
                targets: glow,
                scale: 1.25,
                alpha: 0.45,
                duration: 650,
                yoyo: true,
                repeat: -1
            });

            this.collectibles.push({
                row: item.row,
                col: item.col,
                x,
                y,
                type: item.type,
                glow,
                core,
                collected: false
            });
        });

        // ===== hazards =====
        this.levelHazards.forEach(item => {
            const x = this.offsetX + item.col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + item.row * this.tileSize + this.tileSize / 2;

            let sprite = null;
            let body = null;
            let eyeL = null;
            let eyeR = null;

            if (item.type === 'wolf') {
                sprite = this.add.image(x, y, 'enemy_wolf');
                sprite.setDepth(6);
                sprite.setOrigin(0.5, 0.6); // 稍微貼地一點
                sprite.setScale(0.3);
            
            } else {
                body = this.add.ellipse(x, y + 6, 34, 28, 0x6b5a5a, 0.95).setDepth(5);
                eyeL = this.add.circle(x - 8, y, 3, 0xffd4d4, 1).setDepth(6);
                eyeR = this.add.circle(x + 8, y, 3, 0xffd4d4, 1).setDepth(6);

                this.tweens.add({
                    targets: body,
                    scaleX: 1.05,
                    scaleY: 0.95,
                    duration: 700,
                    yoyo: true,
                    repeat: -1
                });
            }

            this.hazards.push({
                row: item.row,
                col: item.col,
                homeRow: item.row,
                homeCol: item.col,
                x,
                y,
                type: item.type || 'wolf',
                damage: item.damage ?? 8,

                aggroRange: item.aggroRange ?? 2,
                chaseTurns: item.chaseTurns ?? 3,
                chaseLeft: 0,
                isChasing: false,

                moveMode: item.moveMode || 'static',
                patrolRadius: item.patrolRadius ?? 2,
                attractedToLight: item.attractedToLight ?? true,

                sprite,
                body,
                eyeL,
                eyeR,

                triggered: false,
                encounterCooldown: 0,
                hasChased: false
            });
        });

        // ===== decorations =====
        this.levelDecorations.forEach(item => {
            const x = this.offsetX + item.col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + item.row * this.tileSize + this.tileSize / 2;

            if (item.type === 'flower') {
                this.add.rectangle(x, y + 8, 4, 18, 0x5d9f62, 0.95).setDepth(4);
                this.add.circle(x - 8, y - 4, 6, 0xff9db7, 0.95).setDepth(4);
                this.add.circle(x + 8, y - 4, 6, 0xff9db7, 0.95).setDepth(4);
                this.add.circle(x, y - 10, 6, 0xffd36b, 0.95).setDepth(4);
            } else if (item.type === 'mushroom') {
                this.add.rectangle(x, y + 8, 8, 18, 0xf0e6da, 1).setDepth(4);
                this.add.ellipse(x, y - 2, 28, 20, 0xff8f8f, 0.95).setDepth(5);
                this.add.circle(x - 6, y - 2, 2.5, 0xffffff, 0.9).setDepth(6);
                this.add.circle(x + 3, y - 5, 2.5, 0xffffff, 0.9).setDepth(6);
            } else if (item.type === 'bush') {
                this.add.circle(x - 10, y + 4, 12, 0x6cab66, 0.95).setDepth(4);
                this.add.circle(x + 2, y, 15, 0x77b870, 0.95).setDepth(4);
                this.add.circle(x + 14, y + 4, 11, 0x6cab66, 0.95).setDepth(4);
            }
        });
    }

    createPlayer() {
        if (!this.startTile) {
            console.error('❌ 沒有找到 startTile，無法建立玩家');
            return;
        }

        const x = this.startTile.x ?? (this.offsetX + this.startTile.col * this.tileSize + this.tileSize / 2);
        const y = this.startTile.y ?? (this.offsetY + this.startTile.row * this.tileSize + this.tileSize / 2);

        this.player = this.add.image(x, y, 'player_front');
        this.player.setDepth(20);
        this.player.setDisplaySize(56, 74);

        this.playerGlow = this.add.circle(x, y + 6, 34, 0xffefad, 0.18);
        this.playerGlow.setDepth(19);

        this.playerDir = 'down';
        this.lastDir = { x: 0, y: 1 };

        this.playerRow = this.startTile.row;
        this.playerCol = this.startTile.col;

        this.isMovingGrid = false;
        this.moveCooldown = 0;
        this.moveCooldownMax = 500;
        this.gridMoveDuration = 300;
        this.currentMoveTween = null;
    }

    setPlayerDirection(dir) {
        this.playerDir = dir;

        switch (dir) {
            case 'up':
                this.player.setTexture('player_back');
                break;
            case 'down':
                this.player.setTexture('player_front');
                break;
            case 'left':
                this.player.setTexture('player_left');
                break;
            case 'right':
                this.player.setTexture('player_right');
                break;
        }
    }

    // =========================================================
    // HUD / 黑幕
    // =========================================================
    createHUD() {
        const sw = this.scale.width;
        const sh = this.scale.height;

        this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(10000);

        this.topPanel = this.add.rectangle(
            sw / 2,
            100,
            sw - 70,
            88,
            0x081018,
            0.92
        ).setStrokeStyle(2, 0x8fdcff, 0.26);

        this.energyText = this.add.text(
            250,
            80,
            '光能 0 / 0',
            {
                fontSize: '28px',
                color: '#fff6c9',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 5
            }
        );

        this.energyBarBg = this.add.rectangle(
            140,
            125,
            430,
            20,
            0x263844,
            0.98
        ).setOrigin(0, 0.5);

        this.energyBar = this.add.rectangle(
            140,
            125,
            430,
            20,
            0xffdc72,
            1
        ).setOrigin(0, 0.5);

        this.fireflyInfoText = this.add.text(
            sw - 450,
            120,
            '',
            {
                fontSize: '32px',
                color: '#dff5ff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.helpText = this.add.text(
            sw - 40,
            16,
            '方向鍵 / WASD / 左下搖桿 / SPACE爆發',
            {
                fontSize: '17px',
                color: '#c7eaff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(1, 0);

        this.messageBg = this.add.rectangle(
            sw / 2,
            sh - 40,
            820,
            56,
            0x081018,
            0.82
        ).setStrokeStyle(2, 0xb4ecff, 0.18);

        this.messageText = this.add.text(
            sw / 2,
            sh - 40,
            '',
            {
                fontSize: '24px',
                color: '#eefcff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        ).setOrigin(0.5);

        const burstX = sw - 220;
        const burstY = sh - 160;

        this.burstBtnBg = this.add.circle(
            burstX,
            burstY,
            54,
            0xff8a7a,
            0.22
        )
            .setScrollFactor(0)
            .setDepth(5200)
            .setStrokeStyle(3, 0xffc4b9, 0.52)
            .setInteractive({ useHandCursor: true });

        this.burstBtnText = this.add.text(
            burstX,
            burstY - 10,
            '爆發',
            {
                fontSize: '24px',
                color: '#fff2ed',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(5201);

        this.burstBtnCountText = this.add.text(
            burstX,
            burstY + 24,
            '',
            {
                fontSize: '18px',
                color: '#ffe2d9',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(5201);

        this.vignette = this.add.rectangle(
            sw / 2,
            sh / 2,
            sw,
            sh,
            0x000000,
            0
        )
            .setScrollFactor(0)
            .setDepth(4800);

        this.burstBtnBg.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            this.activateRedBurst();
        });

        this.ui.add([
            this.topPanel,
            this.energyText,
            this.energyBarBg,
            this.energyBar,
            this.fireflyInfoText,
            this.helpText,
            this.messageBg,
            this.messageText
        ]);

        this.ui.setScrollFactor(0);
    }

    createDarkOverlay() {
        this.darkOverlay = this.add.graphics();
        this.darkOverlay.setScrollFactor(0);
        this.darkOverlay.setDepth(800);

        this.lightRing = this.add.circle(0, 0, 10, 0xfff2a8, 0.08);
        this.lightRing.setDepth(19);
    }

    // =========================================================
    // 輸入 / 搖桿
    // =========================================================
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    createVirtualJoystick() {
        this.joystickRadius = 70;

        this.joystickBaseX = 170;
        this.joystickBaseY = this.scale.height - 150;

        this.joystickContainer = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(12000);

        this.joystickBase = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            this.joystickRadius,
            0xaedfff,
            0.12
        ).setStrokeStyle(3, 0xc7ecff, 0.35);

        this.joystickThumb = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            28,
            0xdff6ff,
            0.30
        ).setStrokeStyle(2, 0xffffff, 0.4);

        this.joystickContainer.add([
            this.joystickBase,
            this.joystickThumb
        ]);

        // ✅ 重點：觸控區「完全包住搖桿」
        this.joystickTouchZone = this.add.zone(
            this.joystickBaseX,
            this.joystickBaseY,
            this.joystickRadius * 2.6,
            this.joystickRadius * 2.6
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(11999)
            .setInteractive();

        this.joystickDeadZone = 12;

        this.joystickTouchZone.on('pointerdown', (pointer) => {
            this.joystickActive = true;
            this.joystickPointerId = pointer.id;
            this.updateJoystick(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.joystickActive) return;
            if (pointer.id !== this.joystickPointerId) return;
            this.updateJoystick(pointer);
        });

        this.input.on('pointerup', (pointer) => {
            if (pointer.id !== this.joystickPointerId) return;
            this.resetJoystick();
        });

        this.input.on('pointerupoutside', (pointer) => {
            if (pointer.id !== this.joystickPointerId) return;
            this.resetJoystick();
        });
    }

    updateJoystick(pointer) {
        const dx = pointer.x - this.joystickBaseX;
        const dy = pointer.y - this.joystickBaseY;

        const dist = Math.hypot(dx, dy);

        if (dist < this.joystickDeadZone) {
            this.joystickDx = 0;
            this.joystickDy = 0;

            this.joystickThumb.x = this.joystickBaseX;
            this.joystickThumb.y = this.joystickBaseY;
            return;
        }

        const clamped = Math.min(dist, this.joystickRadius);

        const nx = dx / dist;
        const ny = dy / dist;

        this.joystickDx = nx;
        this.joystickDy = ny;

        this.joystickThumb.x = this.joystickBaseX + nx * clamped;
        this.joystickThumb.y = this.joystickBaseY + ny * clamped;
    }

    resetJoystick() {
        this.joystickActive = false;
        this.joystickPointerId = null;

        this.joystickDx = 0;
        this.joystickDy = 0;

        this.joystickThumb.x = this.joystickBaseX;
        this.joystickThumb.y = this.joystickBaseY;
    }

    // =========================================================
    // 爆發
    // =========================================================
    activateRedBurst() {
        if (this.isGameOver) return;
        if (this.redBurstActive) return;

        if (this.redBurstUseCount >= this.redBurstMaxUses) {
            this.setMessage('紅爆發次數已用完。');
            return;
        }

        if (this.redBurstCooldownSteps > 0) {
            this.setMessage(`紅爆發冷卻中，還要再走 ${this.redBurstCooldownSteps} 格。`);
            return;
        }

        const energyCost = this.redBurstUseCount === 0 ? 5 : 10;
        if (this.lightEnergy < energyCost) {
            this.setMessage('光能不足，無法施放紅爆發。');
            return;
        }

        this.lightEnergy = Math.max(0, this.lightEnergy - energyCost);
        this.redBurstUseCount += 1;
        this.redBurstActive = true;
        this.redBurstStealth = true;
        this.pendingBurstCooldownSet = true;

        this.recalculateVision();

        this.setMessage(`紅色爆發閃光！視野暫時提升到 LV5（消耗 ${energyCost} 光能）`);

        this.tweens.add({
            targets: this.burstBtnBg,
            scale: 1.18,
            duration: 120,
            yoyo: true
        });

        if (this.playerGlow) {
            this.tweens.add({
                targets: this.playerGlow,
                alpha: { from: 0.18, to: 0.42 },
                scale: { from: 1, to: 1.5 },
                duration: 220,
                yoyo: true
            });
        }

        if (this.burstFlashCircle) {
            this.burstFlashCircle.destroy();
        }

        this.burstFlashCircle = this.add.circle(
            this.player.x,
            this.player.y,
            30,
            0xffd37a,
            0.30
        ).setDepth(18);

        this.tweens.add({
            targets: this.burstFlashCircle,
            radius: this.tileSize * 4.2,
            alpha: 0,
            duration: 260,
            onComplete: () => {
                if (this.burstFlashCircle) {
                    this.burstFlashCircle.destroy();
                    this.burstFlashCircle = null;
                }
            }
        });

        this.applyVisibilityToWorld();
    }

    deactivateRedBurstAfterMove() {
        this.redBurstActive = false;
        this.redBurstStealth = false;

        if (this.pendingBurstCooldownSet) {
            this.redBurstCooldownSteps = this.redBurstCooldownMax;
            this.pendingBurstCooldownSet = false;
        }

        this.recalculateVision();
    }

    // =========================================================
    // 主更新
    // =========================================================
    update(time, delta) {
        if (this.isGameOver) return;
        if (!this.player) return;
        if (this.inBattle) return;        

        if (this.moveCooldown > 0) {
            this.moveCooldown -= delta;
            if (this.moveCooldown < 0) {
                this.moveCooldown = 0;
            }
        }
        if (this.postBattleCooldown > 0) {
            this.postBattleCooldown -= delta;
            if (this.postBattleCooldown < 0) {
                this.postBattleCooldown = 0;
            }
        }


        this.handleMovement();

        this.lightRadius = Phaser.Math.Linear(this.lightRadius, this.targetLightRadius, 0.22);

        if (this.lightRing) {
            this.lightRing.x = this.player.x;
            this.lightRing.y = this.player.y;
            this.lightRing.setRadius(this.lightRadius);
            this.lightRing.setAlpha(this.redBurstActive ? 0.16 : 0.10);
        }

        this.applyVisibilityToWorld();
        this.updateLowEnergyEffects();
        this.checkCurrentTileEvent();
        this.updateHUD();
        this.redrawDarkOverlay();
    }

    // =========================================================
    // 移動
    // =========================================================
    handleMovement() {
        if (!this.player) return;
        if (this.isMovingGrid) return;
        if (this.moveCooldown > 0) return;

        let rawX = 0;
        let rawY = 0;

        // ===== 鍵盤優先 =====
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            rawX = -1;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            rawX = 1;
        }

        if (this.cursors.up.isDown || this.keys.W.isDown) {
            rawY = -1;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            rawY = 1;
        }

        // ===== 如果鍵盤沒輸入，才讀搖桿 =====
        if (rawX === 0 && rawY === 0) {
            const absX = Math.abs(this.joystickDx);
            const absY = Math.abs(this.joystickDy);

            // 先過門檻，避免微小晃動就觸發
            if (absX >= 0.45 || absY >= 0.45) {
                if (absX > absY) {
                    rawX = this.joystickDx > 0 ? 1 : -1;
                    rawY = 0;
                } else {
                    rawY = this.joystickDy > 0 ? 1 : -1;
                    rawX = 0;
                }
            }
        }

        if (rawX === 0 && rawY === 0) return;

        const targetRow = this.playerRow + rawY;
        const targetCol = this.playerCol + rawX;

        this.lastDir = { x: rawX, y: rawY };

        this.tryMoveToTile(targetRow, targetCol);

        // ✅ 不管有沒有真的走成功，先吃一次輸入 CD
        this.moveCooldown = this.moveCooldownMax;
    }

    tryMoveToTile(targetRow, targetCol) {
        if (!this.isWalkableTile(targetRow, targetCol)) {
            return;
        }

        const targetX = this.offsetX + targetCol * this.tileSize + this.tileSize / 2;
        const targetY = this.offsetY + targetRow * this.tileSize + this.tileSize / 2;

        if (targetCol > this.playerCol) {
            this.setPlayerDirection('right');
        } else if (targetCol < this.playerCol) {
            this.setPlayerDirection('left');
        } else if (targetRow > this.playerRow) {
            this.setPlayerDirection('down');
        } else if (targetRow < this.playerRow) {
            this.setPlayerDirection('up');
        }

        this.isMovingGrid = true;

        if (this.currentMoveTween) {
            this.currentMoveTween.stop();
            this.currentMoveTween = null;
        }

        const startX = this.player.x;
        const startY = this.player.y;

        this.currentMoveTween = this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: this.gridMoveDuration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                if (this.playerGlow) {
                    this.playerGlow.x = this.player.x;
                    this.playerGlow.y = this.player.y + 6;
                }

                if (this.burstFlashCircle) {
                    this.burstFlashCircle.x = this.player.x;
                    this.burstFlashCircle.y = this.player.y;
                }

                // 移動途中也同步更新清晰度
                this.applyVisibilityToWorld();
            },
            onComplete: () => {
                this.player.x = targetX;
                this.player.y = targetY;

                this.playerRow = targetRow;
                this.playerCol = targetCol;

                this.isMovingGrid = false;
                this.currentMoveTween = null;

                if (this.playerGlow) {
                    this.playerGlow.x = this.player.x;
                    this.playerGlow.y = this.player.y + 6;
                }

                if (this.burstFlashCircle) {
                    this.burstFlashCircle.x = this.player.x;
                    this.burstFlashCircle.y = this.player.y;
                }

                this.turnCount += 1;
                this.stepCount += 1;

                const moveCost = this.getMoveEnergyCost();
                this.consumeMoveEnergy(moveCost);

                if (this.isGameOver) {
                    return;
                }

                if (this.redBurstActive) {
                    this.deactivateRedBurstAfterMove();
                } else if (this.redBurstCooldownSteps > 0) {
                    this.redBurstCooldownSteps -= 1;
                }

                this.recalculateVision();
                this.applyVisibilityToWorld();
                this.checkCurrentTileEvent();

                if (this.isGameOver) {
                    return;
                }

                if (this.checkPlayerTouchEnemy()) {
                    return;
                }

                this.updateEnemiesAfterPlayerMove();

                if (this.isGameOver || this.inBattle) {
                    return;
                }

                this.recalculateVision();
                this.applyVisibilityToWorld();
            }
        });
    }

    consumeMoveEnergy(amount) {
        this.lightEnergy = Math.max(0, this.lightEnergy - amount);

        if (this.lightEnergy <= 0) {
            this.failGame();
        }
    }

    getMoveEnergyCost() {
        let cost = this.moveEnergyCost;

        // 之後裝備 / 祝福從這裡擴充
        // 例：
        // if (this.blessingStepHalf && Math.random() < 0.5) {
        //     cost = Math.max(1, cost - 1);
        // }

        return cost;
    }

    getTileDistance(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    isTileOccupiedByHazard(row, col, ignoreHazard = null) {
        return this.hazards.some(h => {
            if (ignoreHazard && h === ignoreHazard) return false;
            return h.row === row && h.col === col;
        });
    }

    canEnemyStandAt(row, col, hazard = null) {
        if (!this.isWalkableTile(row, col)) return false;

        // 不站到其他怪身上
        if (this.isTileOccupiedByHazard(row, col, hazard)) return false;

        return true;
    }

    getEnemyStepCount(hazard) {
        // 先做最小版
        // wolf 先固定 1 格
        // 之後可改 80% 走1格 / 20% 走2格
        return 1;
    }

    updateEnemiesAfterPlayerMove() {
        if (this.isGameOver) return;
        if (this.enemyActing) return;
        if (!this.player) return;

        this.enemyActing = true;

        for (const hazard of this.hazards) {
            if (hazard.encounterCooldown > 0) {
                hazard.encounterCooldown -= 1;
            }
        }

        for (const hazard of this.hazards) {
            this.updateSingleEnemy(hazard);

            if (this.checkEnemyCollision(hazard)) {
                this.enemyActing = false;
                return;
            }
        }

        this.enemyActing = false;
    }

    updateSingleEnemy(hazard) {
        if (!hazard) return;

        const playerTile = {
            row: this.playerRow,
            col: this.playerCol
        };

        const enemyTile = {
            row: hazard.row,
            col: hazard.col
        };

        const aggroRange = hazard.aggroRange ?? 2;
        const distToPlayer = this.getTileDistance(enemyTile, playerTile);

        const ignoreAggro = this.redBurstActive && hazard.attractedToLight;

        // 只有第一次進入範圍才開始追
        if (!ignoreAggro && distToPlayer <= aggroRange && !hazard.isChasing && !hazard.hasChased) {
            hazard.isChasing = true;
            hazard.chaseLeft = hazard.chaseTurns ?? 3;
        }

        // 正在追擊
        if (hazard.isChasing && hazard.chaseLeft > 0) {
            this.moveEnemyTowardPlayer(hazard);
            hazard.chaseLeft -= 1;

            if (hazard.chaseLeft <= 0) {
                hazard.isChasing = false;
                hazard.chaseLeft = 0;
                hazard.hasChased = true;
            }

            return;
        }

        // 不在追擊時才 wander
        if (hazard.moveMode === 'wander') {
            this.moveEnemyWander(hazard);
        }
    }

    moveEnemyTowardPlayer(hazard) {
        const steps = this.getEnemyStepCount(hazard);

        for (let i = 0; i < steps; i++) {
            const candidates = [];

            const dRow = this.playerRow - hazard.row;
            const dCol = this.playerCol - hazard.col;

            if (Math.abs(dRow) >= Math.abs(dCol)) {
                if (dRow !== 0) {
                    candidates.push({
                        row: hazard.row + Math.sign(dRow),
                        col: hazard.col
                    });
                }
                if (dCol !== 0) {
                    candidates.push({
                        row: hazard.row,
                        col: hazard.col + Math.sign(dCol)
                    });
                }
            } else {
                if (dCol !== 0) {
                    candidates.push({
                        row: hazard.row,
                        col: hazard.col + Math.sign(dCol)
                    });
                }
                if (dRow !== 0) {
                    candidates.push({
                        row: hazard.row + Math.sign(dRow),
                        col: hazard.col
                    });
                }
            }

            // 補一點備案方向
            candidates.push(
                { row: hazard.row + 1, col: hazard.col },
                { row: hazard.row - 1, col: hazard.col },
                { row: hazard.row, col: hazard.col + 1 },
                { row: hazard.row, col: hazard.col - 1 }
            );

            let moved = false;

            for (const next of candidates) {
                if (!this.canEnemyStandAt(next.row, next.col, hazard)) continue;

                this.setHazardTilePosition(hazard, next.row, next.col);
                moved = true;
                break;
            }

            if (!moved) break;
        }
    }

    moveEnemyWander(hazard) {
        const maxDist = hazard.patrolRadius ?? 2;

        const candidates = [
            { row: hazard.row + 1, col: hazard.col },
            { row: hazard.row - 1, col: hazard.col },
            { row: hazard.row, col: hazard.col + 1 },
            { row: hazard.row, col: hazard.col - 1 },
            { row: hazard.row, col: hazard.col } // 有機率不動
        ];

        Phaser.Utils.Array.Shuffle(candidates);

        for (const next of candidates) {
            const distFromHome = Math.abs(next.row - hazard.homeRow) + Math.abs(next.col - hazard.homeCol);

            if (distFromHome > maxDist) continue;
            if (!this.canEnemyStandAt(next.row, next.col, hazard)) continue;

            this.setHazardTilePosition(hazard, next.row, next.col);
            return;
        }
    }

    setHazardTilePosition(hazard, row, col) {
        hazard.row = row;
        hazard.col = col;

        const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
        const y = this.offsetY + row * this.tileSize + this.tileSize / 2;

        hazard.x = x;
        hazard.y = y;

        if (hazard.sprite) {
            hazard.sprite.x = x;
            hazard.sprite.y = y;
        }

        if (hazard.body) {
            hazard.body.x = x;
            hazard.body.y = y + 6;
        }
        if (hazard.eyeL) {
            hazard.eyeL.x = x - 8;
            hazard.eyeL.y = y;
        }
        if (hazard.eyeR) {
            hazard.eyeR.x = x + 8;
            hazard.eyeR.y = y;
        }
    }

    checkEnemyCollision(hazard) {
        if (!hazard || !this.player) return false;
        if (hazard.encounterCooldown > 0) return false;

        if (hazard.row === this.playerRow && hazard.col === this.playerCol) {
            this.triggerEnemyEncounter(hazard);
            return true;
        }

        return false;
    }

    triggerEnemyEncounter(hazard) {
        if (this.isGameOver) return;
        if (this.battleLocked) return;

        this.battleLocked = true;
        this.inBattle = true;
        // 🎲 隨機怪物種類（先測試用）
        const pool = ['wolf_common', 'wolf_rare', 'wolf_elite'];
        const pick = Phaser.Utils.Array.GetRandom(pool);

        // 📦 取資料庫
        const enemyData = ENEMY_DB[pick];

        // 🧬 建立戰鬥用敵人
        this.currentEnemy = {
            ...hazard,
            ...enemyData,
            currentHp: enemyData.hp,
            sourceHazard: hazard
        };

        // 先扣初始傷害
        const damage = 2;
        this.lightEnergy = Math.max(0, this.lightEnergy - damage);

        this.setMessage(`被${hazard.type === 'wolf' ? '野狼' : '怪物'}攔住！進入戰鬥`);

        // ✅ 怪物碰撞動畫
        const hitTargets = [];

        if (hazard.sprite) hitTargets.push(hazard.sprite);
        if (hazard.body) hitTargets.push(hazard.body);
        if (hazard.eyeL) hitTargets.push(hazard.eyeL);
        if (hazard.eyeR) hitTargets.push(hazard.eyeR);

        if (hitTargets.length > 0) {
            this.tweens.add({
                targets: hitTargets,
                scaleX: 1.18,
                scaleY: 1.18,
                duration: 120,
                yoyo: true
            });
        }

        // ✅ 玩家被撞到的小震動
        this.tweens.add({
            targets: this.player,
            x: this.player.x + 6,
            duration: 40,
            yoyo: true,
            repeat: 2
        });

        // ✅ 紅色危險閃光
        this.flashDangerOverlay();

        // ✅ 扣血飄字
        const hitText = this.add.text(this.player.x, this.player.y - 40, `-${damage}`, {
            fontSize: '28px',
            color: '#ffb3b3',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(20050);

        this.tweens.add({
            targets: hitText,
            y: this.player.y - 72,
            alpha: 0,
            duration: 420,
            onComplete: () => hitText.destroy()
        });

        if (this.lightEnergy <= 0) {
            this.failGame();
            return;
        }

        this.startBattleUI();
    }
    startBattleUI() {
        this.battleQuestionIndex = 0;
        this.battleAnswerLocked = false;

        const enemy = this.currentEnemy;

        // ⭐ 直接用 currentEnemy（不要再用 enemyData）
        const enemyData = enemy;

        this.enemyMaxHp = enemyData.hp;
        this.enemyHp = enemyData.hp;

        // ===== 主面板基準 =====
        const panelCenterX = 500;
        const panelCenterY = 500;
        const panelWidth = 600;

        const leftX = panelCenterX - 150;
        const rightX = panelCenterX + 150;

        this.questionY = panelCenterY - 120;

        // ===== 遮罩 =====
        this.battleOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55)
            .setDepth(20000);

        // ===== 主面板 =====
        this.battlePanel = this.add.rectangle(panelCenterX, panelCenterY, panelWidth, 420, 0x0f2a33, 0.95)
            .setStrokeStyle(3, 0x6fd3ff)
            .setDepth(20001);

        // ===== 標題 =====
        this.battleTitle = this.add.text(panelCenterX, 140, '戰鬥挑戰', {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20002);

        // =========================
        // ⭐ 左側怪物卡
        // =========================
        const cardX = leftX;
        const cardY = panelCenterY;

        this.enemyCard = this.add.rectangle(cardX, cardY, 200, 300, 0x1c3f4a, 0.95)
            .setStrokeStyle(3, 0x89e6ff)
            .setDepth(20002);

        // 頭像
        this.enemyIcon = null;
        if (enemy && enemy.sprite) {
            this.enemyIcon = this.add.image(cardX, cardY - 80, enemy.sprite.texture.key)
                .setScale(0.3)
                .setDepth(20003);
        }

        // 名稱
        this.enemyNameText = this.add.text(cardX, cardY - 10, enemy.name, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20003);

        // Lv
        this.levelText = this.add.text(cardX, cardY + 25, `Lv.${enemyData.level}`, {
            fontSize: '20px',
            color: '#ffe58a'
        }).setOrigin(0.5).setDepth(20003);

        // 攻擊
        this.atkText = this.add.text(cardX, cardY + 60, `⚔ 攻擊：${enemyData.attack}`, {
            fontSize: '18px',
            color: '#ffb3b3'
        }).setOrigin(0.5).setDepth(20003);

        // 稀有度
        const rarityColorMap = {
            common: '#ffffff',
            rare: '#66ccff',
            elite: '#ff9966'
        };

        this.rarityText = this.add.text(cardX, cardY + 95, enemyData.rarity || '普通', {
            fontSize: '18px',
            color: rarityColorMap[enemyData.rarity] || '#ffffff'
        }).setOrigin(0.5).setDepth(20003);

        // ❤️ HP
        this.hpText = this.add.text(cardX, cardY + 130, '', {
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(20003);

        this.updateEnemyHPUI();

        // =========================
        // ⭐ 右側題目區
        // =========================
        this.battleQuestionText = this.add.text(
            rightX,
            this.questionY,
            '',
            {
                fontSize: '34px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(20003);

        this.battleChoices = [];

        this.generateNextQuestion();

        this.isBattleMustWin = !!(
            enemyData.isBoss ||
            enemyData.isGatekeeper ||
            enemyData.mustDefeat
        );
    }

    generateNextQuestion() {
        const a = Phaser.Math.Between(1, 9);
        const b = Phaser.Math.Between(1, 9);
        const answer = a + b;

        this.currentQuestion = {
            text: `${a} + ${b} = ?`,
            answer
        };

        // 顯示題目
        this.battleQuestionText.setText(this.currentQuestion.text);

        // 清掉舊選項
        if (this.battleChoices) {
            this.battleChoices.forEach(item => {
                if (item.bg) item.bg.destroy();
                if (item.text) item.text.destroy();
            });
        }
        this.battleChoices = [];

        // 產生 3 個選項（含正確）
        const choices = [answer];
        while (choices.length < 3) {
            const fake = answer + Phaser.Math.Between(-3, 3);
            if (!choices.includes(fake) && fake >= 0) {
                choices.push(fake);
            }
        }
        Phaser.Utils.Array.Shuffle(choices);

        // 位置設定
        // 修正：使用 this.questionY
            const rightX = 650; 
            const choiceStartY = this.questionY + 80; // 加上 this.
            const choiceGap = 80;

        // 建立按鈕
        choices.forEach((val, i) => {
            const y = choiceStartY + i * choiceGap;

            const bg = this.add.rectangle(rightX, y, 180, 50, 0x3b5f7a)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive()
                .setDepth(20003);

            const text = this.add.text(rightX, y, `${val}`, {
                fontSize: '22px',
                color: '#ffffff'
            })
            .setOrigin(0.5)
            .setDepth(20004);

            bg.on('pointerdown', () => {
                this.handleAnswer(val);
            });

            this.battleChoices.push({ bg, text, value: val });
        });
    }

    handleAnswer(value) {
        if (this.battleAnswerLocked) return;
        if (!this.currentQuestion) return;

        this.battleAnswerLocked = true;

        const isCorrect = value === this.currentQuestion.answer;

        // 每回答一次都算 1 題
        this.battleQuestionIndex += 1;

        // 找到被點到的選項
        let selectedChoice = null;
        if (this.battleChoices) {
            selectedChoice = this.battleChoices.find(item => item.value === value) || null;
        }

        if (isCorrect) {
            // =========================
            // ✅ 答對
            // =========================
            if (selectedChoice && selectedChoice.bg) {
                selectedChoice.bg.setFillStyle(0x4f8a5b, 1);
                selectedChoice.bg.setStrokeStyle(3, 0xffffff, 1);
            }

            // 怪物卡震動
            const shakeTargets = [];
            if (this.enemyCard) shakeTargets.push(this.enemyCard);
            if (this.enemyIcon) shakeTargets.push(this.enemyIcon);
            if (this.enemyNameText) shakeTargets.push(this.enemyNameText);
            if (this.levelText) shakeTargets.push(this.levelText);
            if (this.atkText) shakeTargets.push(this.atkText);
            if (this.rarityText) shakeTargets.push(this.rarityText);
            if (this.hpText) shakeTargets.push(this.hpText);

            if (shakeTargets.length > 0) {
                this.tweens.add({
                    targets: shakeTargets,
                    x: '+=8',
                    duration: 45,
                    yoyo: true,
                    repeat: 3
                });
            }

            const enemyDamageText = this.add.text(
                this.enemyCard ? this.enemyCard.x : 360,
                this.enemyCard ? this.enemyCard.y - 120 : 300,
                '-1',
                {
                    fontSize: '30px',
                    color: '#ffb3b3',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 5
                }
            ).setOrigin(0.5).setDepth(20050);

            this.tweens.add({
                targets: enemyDamageText,
                y: enemyDamageText.y - 36,
                alpha: 0,
                duration: 450,
                onComplete: () => enemyDamageText.destroy()
            });

            this.enemyHp -= 1;
            if (this.enemyHp < 0) this.enemyHp = 0;

            this.updateEnemyHPUI();
            this.updateHUD();
            this.setMessage(`答對！(${this.battleQuestionIndex}/${this.battleMaxQuestions})`);

            // 打死怪物
            if (this.enemyHp <= 0) {
                this.time.delayedCall(350, () => {
                    this.endBattle(true);
                });
                return;
            }

            // 題目用完但怪還沒死
            if (this.battleQuestionIndex >= this.battleMaxQuestions) {
                this.time.delayedCall(450, () => {
                    this.endBattle(false);
                });
                return;
            }

            this.time.delayedCall(550, () => {
                this.battleAnswerLocked = false;
                this.generateNextQuestion();
            });

        } else {
            // =========================
            // ❌ 答錯
            // =========================
            if (selectedChoice && selectedChoice.bg) {
                selectedChoice.bg.setFillStyle(0xa84f4f, 1);
                selectedChoice.bg.setStrokeStyle(3, 0xffffff, 1);
            }

            const correctChoice = this.battleChoices.find(
                item => item.value === this.currentQuestion.answer
            );

            if (correctChoice && correctChoice.bg) {
                correctChoice.bg.setFillStyle(0x4f8a5b, 1);
                correctChoice.bg.setStrokeStyle(3, 0xffffff, 1);
            }

            const dmg = this.currentEnemy?.attack ?? 2;
            this.lightEnergy = Math.max(0, this.lightEnergy - dmg);

            // 這行很重要：戰鬥中主 update 不會幫你刷 HUD，要手動刷
            this.updateHUD();

            this.setMessage(`答錯！光能 -${dmg} (${this.battleQuestionIndex}/${this.battleMaxQuestions})`);

            if (this.player) {
                this.tweens.add({
                    targets: this.player,
                    x: this.player.x + 8,
                    duration: 45,
                    yoyo: true,
                    repeat: 3
                });
            }

            const hurtText = this.add.text(
                this.player ? this.player.x : 640,
                this.player ? this.player.y - 45 : 360,
                `-${dmg}`,
                {
                    fontSize: '30px',
                    color: '#ffb3b3',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 5
                }
            ).setOrigin(0.5).setDepth(20050);

            this.tweens.add({
                targets: hurtText,
                y: hurtText.y - 36,
                alpha: 0,
                duration: 450,
                onComplete: () => hurtText.destroy()
            });

            if (this.lightEnergy <= 0) {
                this.time.delayedCall(350, () => {
                    this.failGame();
                });
                return;
            }

            // 題目用完：一般怪直接消失，Boss/守門怪保留
            if (this.battleQuestionIndex >= this.battleMaxQuestions) {
                this.time.delayedCall(500, () => {
                    if (this.isBattleMustWin) {
                        this.endBattle(false);   // 怪保留
                    } else {
                        this.endBattle(true);    // 一般怪題目耗完就消失
                    }
                });
                return;
            }

            this.time.delayedCall(650, () => {
                this.battleAnswerLocked = false;
                this.generateNextQuestion();
            });
        }
    }

    updateEnemyHPUI() {
        if (!this.hpText) return;

        let hearts = '';
        for (let i = 0; i < this.enemyHp; i++) {
            hearts += '❤';
        }

        this.hpText.setText(`生命：${hearts}`);
    }

    showNextQuestion() {
        if (!this.inBattle) return;

        if (this.battleQuestionIndex >= this.battleMaxQuestions) {
            this.endBattle(false);
            return;
        }

        const q = this.generateQuestion();
        this.currentQuestion = q;

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.battleQuestionText.setText(q.text);
        const hearts = '❤'.repeat(Math.max(0, this.currentEnemy?.currentHp ?? 0));
        this.battleInfoText.setText(`生命：${hearts}`);
        // 清除舊按鈕
        this.battleChoices.forEach(item => {
            if (item.bg) item.bg.destroy();
            if (item.text) item.text.destroy();
        });
        this.battleChoices = [];

        const choiceYList = [
            centerY + 30,
            centerY + 120,
            centerY + 210
        ];

        q.choices.forEach((choice, i) => {
            const y = choiceYList[i];

            const bg = this.add.rectangle(
                centerX,
                y,
                180,
                58,
                0x355c7d,
                0.95
            )
                .setScrollFactor(0)
                .setDepth(20002)
                .setStrokeStyle(2, 0xffffff, 0.35)
                .setInteractive({ useHandCursor: true });

            const text = this.add.text(
                centerX,
                y,
                `${choice}`,
                {
                    fontSize: '30px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(20003);

            bg.on('pointerover', () => {
                bg.setScale(1.05);
            });

            bg.on('pointerout', () => {
                bg.setScale(1);
            });

            bg.on('pointerdown', () => {
                this.submitAnswer(choice);
            });

            this.battleChoices.push({ bg, text });
        });
    }

    submitAnswer(answer) {
        if (!this.inBattle) return;
        if (!this.currentQuestion) return;
        if (this.battleAnswerLocked) return;

        this.battleAnswerLocked = true;

        const correct = this.currentQuestion.correct;

        if (answer === correct) {
            this.currentEnemy.currentHp -= 1;

            if (this.currentEnemy.currentHp <= 0) {
                this.battleInfoText.setText('答對了！成功擊退怪物！');
                this.setMessage('答對了！成功擊退怪物！');

                this.time.delayedCall(500, () => {
                    this.endBattle(true);
                });
            } else {
                this.battleInfoText.setText(`答對！怪物生命剩餘 ${this.currentEnemy.currentHp}`);
                this.setMessage('答對了！繼續追擊怪物！');

                this.time.delayedCall(450, () => {
                    this.battleAnswerLocked = false;
                    this.showNextQuestion();
                });
            }
        } else {
            const damage = this.currentEnemy?.attack ?? 2;
            this.lightEnergy = Math.max(0, this.lightEnergy - damage);

            this.battleInfoText.setText(`答錯！光能 -${damage}`);

            if (this.lightEnergy <= 0) {
                this.failGame();
                return;
            }

            this.time.delayedCall(450, () => {
                this.battleAnswerLocked = false;
                this.showNextQuestion();
            });
        }

        this.updateHUD();
    }

    endBattle(success) {
        if (!this.inBattle) return;

        this.inBattle = false;
        this.battleLocked = false;
        this.battleAnswerLocked = false;

        if (success) {
            const reward = Phaser.Math.Between(3, 6);
            this.lightEnergy = Math.min(this.maxLightEnergy, this.lightEnergy + reward);

            this.setMessage(`擊退野狼！光能 +${reward}`);

            const healText = this.add.text(
                this.player.x,
                this.player.y - 40,
                `+${reward}`,
                {
                    fontSize: '28px',
                    color: '#9bffb3',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 5
                }
            ).setOrigin(0.5).setDepth(20050);

            this.tweens.add({
                targets: healText,
                y: this.player.y - 70,
                alpha: 0,
                duration: 500,
                onComplete: () => healText.destroy()
            });

            // ✅ 真的把怪移除
            if (this.currentEnemy && this.currentEnemy.sourceHazard) {
                const source = this.currentEnemy.sourceHazard;

                if (source.sprite) source.sprite.destroy();
                if (source.body) source.body.destroy();
                if (source.eyeL) source.eyeL.destroy();
                if (source.eyeR) source.eyeR.destroy();

                this.hazards = this.hazards.filter(h => h !== source);
            }
        } else {
            // 戰鬥失敗先不刪怪，只給短暫冷卻
            if (this.currentEnemy) {
                this.currentEnemy.encounterCooldown = 2;
            }
        }

        if (this.battleOverlay) {
            this.battleOverlay.destroy();
            this.battleOverlay = null;
        }

        if (this.battlePanel) {
            this.battlePanel.destroy();
            this.battlePanel = null;
        }

        if (this.battleTitle) {
            this.battleTitle.destroy();
            this.battleTitle = null;
        }

        if (this.battleQuestionText) {
            this.battleQuestionText.destroy();
            this.battleQuestionText = null;
        }

        if (this.battleInfoText) {
            this.battleInfoText.destroy();
            this.battleInfoText = null;
        }

        // ✅ 左側怪物資訊卡也要清掉
        if (this.enemyCard) {
            this.enemyCard.destroy();
            this.enemyCard = null;
        }

        if (this.enemyIcon) {
            this.enemyIcon.destroy();
            this.enemyIcon = null;
        }

        if (this.enemyNameText) {
            this.enemyNameText.destroy();
            this.enemyNameText = null;
        }

        if (this.levelText) {
            this.levelText.destroy();
            this.levelText = null;
        }

        if (this.atkText) {
            this.atkText.destroy();
            this.atkText = null;
        }

        if (this.rarityText) {
            this.rarityText.destroy();
            this.rarityText = null;
        }

        if (this.hpText) {
            this.hpText.destroy();
            this.hpText = null;
        }

        if (this.battleChoices) {
            this.battleChoices.forEach(item => {
                if (item.bg) item.bg.destroy();
                if (item.text) item.text.destroy();
            });
        }

        this.battleChoices = [];
        this.currentQuestion = null;
        this.currentEnemy = null;

        if (this.darkOverlay) {
            this.darkOverlay.setVisible(true);
        }
        if (this.lightRing) {
            this.lightRing.setVisible(true);
        }

        this.postBattleCooldown = 500;

        this.recalculateVision(true);
        this.applyVisibilityToWorld();
        this.redrawDarkOverlay();
    }

    generateQuestion() {
        const enemy = this.currentEnemy;

        if (!enemy || !enemy.questionTypes || enemy.questionTypes.length === 0) {
            return this.buildAddQuestion(5);
        }

        const type = Phaser.Utils.Array.GetRandom(enemy.questionTypes);
        const max = enemy.numberRange || 5;

        switch (type) {
            case 'add':
                return this.buildAddQuestion(max);

            case 'sub':
                return this.buildSubQuestion(max);

            case 'mul':
                return this.buildMulQuestion(max);

            case 'div':
                return this.buildDivQuestion(max);

            case 'compare':
                return this.buildCompareQuestion(max);

            default:
                return this.buildAddQuestion(max);
        }
    }

buildAddQuestion(max = 5) {
    const a = Phaser.Math.Between(1, max);
    const b = Phaser.Math.Between(1, max);
    const correct = a + b;

    return {
        type: 'add',
        text: `${a} + ${b} = ?`,
        correct,
        choices: this.buildChoices(correct)
    };
}

buildSubQuestion(max = 5) {
    let a = Phaser.Math.Between(1, max);
    let b = Phaser.Math.Between(1, max);

    if (b > a) {
        [a, b] = [b, a];
    }

    const correct = a - b;

    return {
        type: 'sub',
        text: `${a} - ${b} = ?`,
        correct,
        choices: this.buildChoices(correct)
    };
}

buildMulQuestion(max = 10) {
    const safeMax = Math.min(max, 10);
    const a = Phaser.Math.Between(1, Math.max(2, Math.floor(safeMax / 2)));
    const b = Phaser.Math.Between(1, Math.max(2, Math.floor(safeMax / 2)));
    const correct = a * b;

    return {
        type: 'mul',
        text: `${a} × ${b} = ?`,
        correct,
        choices: this.buildChoices(correct)
    };
}

buildDivQuestion(max = 10) {
    const divisor = Phaser.Math.Between(1, Math.max(2, Math.floor(max / 2)));
    const quotient = Phaser.Math.Between(1, Math.max(2, Math.floor(max / 2)));
    const dividend = divisor * quotient;
    const correct = quotient;

    return {
        type: 'div',
        text: `${dividend} ÷ ${divisor} = ?`,
        correct,
        choices: this.buildChoices(correct)
    };
}

buildCompareQuestion(max = 10) {
    let a = Phaser.Math.Between(1, max);
    let b = Phaser.Math.Between(1, max);

    while (a === b) {
        b = Phaser.Math.Between(1, max);
    }

    const correct = a > b ? a : b;

    return {
        type: 'compare',
        text: `${a} 和 ${b}，哪個比較大？`,
        correct,
        choices: this.buildChoices(correct)
    };
}

buildChoices(correct) {
    const choices = [correct];
    const used = new Set([correct]);

    let tries = 0;
    while (choices.length < 3 && tries < 30) {
        tries += 1;

        let offset = Phaser.Math.Between(1, 4);
        if (Math.random() < 0.5) offset *= -1;

        let wrong = correct + offset;

        if (wrong < 0) wrong = Phaser.Math.Between(0, correct + 4);

        if (!used.has(wrong)) {
            used.add(wrong);
            choices.push(wrong);
        }
    }

    while (choices.length < 3) {
        const fallback = correct + choices.length + 1;
        if (!used.has(fallback)) {
            used.add(fallback);
            choices.push(fallback);
        }
    }

    Phaser.Utils.Array.Shuffle(choices);
    return choices;
}

    isWalkableTile(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }

        const cell = this.mapData[row][col];
        return this.isRoadCell(cell);
    }

    // =========================================================
    // 可視範圍
    // =========================================================
    applyVisibilityToWorld() {
        if (!this.player) return;

        const isVisible = (row, col) => this.visibleTileKeys.has(`${row},${col}`);

        for (const tile of this.walkableTiles) {
            const visible = isVisible(tile.row, tile.col);
            tile.rect.setAlpha(visible ? 1.0 : 0.06);
            tile.rect.setStrokeStyle(2, 0x8f6f4f, visible ? 0.42 : 0.02);
        }

        for (const tile of this.wallTiles) {
            const visible = isVisible(tile.row, tile.col);
            tile.rect.setAlpha(visible ? 0.28 : 0.02);
            tile.rect.setStrokeStyle(1, 0x4d7d45, visible ? 0.10 : 0.01);
        }

        if (this.startTile?.mark) {
            this.startTile.mark.setAlpha(isVisible(this.startTile.row, this.startTile.col) ? 0.85 : 0.03);
        }

        if (this.goalTile) {
            const visible = isVisible(this.goalTile.row, this.goalTile.col);
            this.goalTile.glow.setAlpha(visible ? 1 : 0.03);
            this.goalTile.star.setAlpha(visible ? 1 : 0.03);
        }

        for (const item of this.collectibles) {
            if (item.collected) continue;

            const visible = isVisible(item.row, item.col);
            const alpha = visible ? 1 : 0.03;

            if (item.glow) item.glow.setAlpha(alpha * 0.9);
            if (item.core) item.core.setAlpha(alpha);
        }

        for (const item of this.hazards) {
            const visible = isVisible(item.row, item.col);
            const alpha = visible ? 1 : 0.03;

            if (item.sprite) {
                item.sprite.setAlpha(alpha);
            }

            if (item.body) {
                item.body.setAlpha(alpha * 0.95);
            }

            if (item.eyeL) {
                item.eyeL.setAlpha(alpha);
            }

            if (item.eyeR) {
                item.eyeR.setAlpha(alpha);
            }
        }
    }

    // =========================================================
    // 格子事件
    // =========================================================
    checkCurrentTileEvent() {
        if (this.isMovingGrid) return;

        this.checkCollectibles();
        // this.checkHazards(); // 先停用舊版踩到怪扣血，改由怪物碰撞系統接手
        this.checkGoal();
    }

    checkCollectibles() {
        if (!this.collectibles || !this.player) return;

        for (const item of this.collectibles) {
            if (item.collected) continue;

            if (item.row === this.playerRow && item.col === this.playerCol) {
                item.collected = true;

                const collectX = item.x;
                const collectY = item.y;

                if (item.glow) {
                    this.tweens.add({
                        targets: item.glow,
                        x: this.player.x,
                        y: this.player.y,
                        scale: 0.2,
                        alpha: 0,
                        duration: 220,
                        onComplete: () => item.glow?.destroy()
                    });
                }

                if (item.core) {
                    this.tweens.add({
                        targets: item.core,
                        x: this.player.x,
                        y: this.player.y,
                        scale: 0.2,
                        alpha: 0,
                        duration: 220,
                        onComplete: () => item.core?.destroy()
                    });
                }

                if (item.type === 'yellow') {
                    this.lightEnergy = Math.min(this.maxLightEnergy, this.lightEnergy + 4);
                    this.flashCollectVisual(0xffef9f, 120);
                    this.setMessage('收集到黃光！提燈更明亮了一瞬，光能 +4');
                } else if (item.type === 'blue') {
                    this.createBlueWave();
                    this.setMessage('收集到藍光！周圍泛起一圈勘破波紋。');
                } else if (item.type === 'green') {
                    this.uiSoftenedUntil = this.time.now + 1800;
                    this.lightEnergy = Math.min(this.maxLightEnergy, this.lightEnergy + 2);
                    this.setMessage('收集到綠光！氛圍變得柔和，光能 +2');
                } else if (item.type === 'red') {
                    this.flashCollectVisual(0xff9d8e, 180);

                    if (!this.redBurstActive) {
                        this.redBurstActive = true;
                        this.redBurstStealth = true;
                        this.pendingBurstCooldownSet = true;
                        this.recalculateVision();
                        this.applyVisibilityToWorld();
                    }

                    this.setMessage('收集到紅光！短暫進入爆發閃光狀態。');
                }

                const popText = this.add.text(collectX, collectY - 24, '✨', {
                    fontSize: '24px'
                }).setOrigin(0.5).setDepth(30);

                this.tweens.add({
                    targets: popText,
                    y: collectY - 50,
                    alpha: 0,
                    duration: 350,
                    onComplete: () => popText.destroy()
                });

                this.pulseEnergyBar();
            }
        }
    }

    createBlueWave() {
        const wave = this.add.circle(this.player.x, this.player.y, 10, 0x8fd3ff, 0.24)
            .setDepth(21);

        this.tweens.add({
            targets: wave,
            radius: this.tileSize * 2.8,
            alpha: 0,
            duration: 420,
            onComplete: () => wave.destroy()
        });
    }

    flashCollectVisual(color, duration = 140) {
        const flash = this.add.rectangle(640, 360, 1280, 720, color, 0.10)
            .setScrollFactor(0)
            .setDepth(1490);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration,
            onComplete: () => flash.destroy()
        });
    }

    checkHazards() {
        if (!this.hazards || !this.player) return;

        for (const item of this.hazards) {
            if (item.row === this.playerRow && item.col === this.playerCol) {
                if (!item.triggered) {
                    item.triggered = true;

                    const damage = item.damage ?? 8;
                    this.lightEnergy = Math.max(0, this.lightEnergy - damage);
                    this.setMessage(`踩到危險！光能 -${damage}`);

                    const hazardTargets = [];
                    if (item.sprite) hazardTargets.push(item.sprite);
                    if (item.body) hazardTargets.push(item.body);
                    if (item.eyeL) hazardTargets.push(item.eyeL);
                    if (item.eyeR) hazardTargets.push(item.eyeR);

                    if (hazardTargets.length > 0) {
                        this.tweens.add({
                            targets: hazardTargets,
                            scaleX: 1.15,
                            scaleY: 1.15,
                            duration: 120,
                            yoyo: true
                        });
                    }

                    this.tweens.add({
                        targets: this.player,
                        x: this.player.x + 6,
                        duration: 40,
                        yoyo: true,
                        repeat: 2
                    });

                    this.flashDangerOverlay();

                    const dmgText = this.add.text(this.player.x, this.player.y - 36, `-${damage}`, {
                        fontSize: '26px',
                        color: '#ffb3b3',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 5
                    }).setOrigin(0.5).setDepth(40);

                    this.tweens.add({
                        targets: dmgText,
                        y: this.player.y - 70,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => dmgText.destroy()
                    });

                    if (this.lightEnergy <= 0) {
                        this.failGame();
                        return;
                    }
                }
            } else {
                item.triggered = false;
            }
        }
    }

    checkGoal() {
        if (!this.goalTile || !this.player) return;
        if (this.isMovingGrid) return;

        if (this.playerRow === this.goalTile.row && this.playerCol === this.goalTile.col) {
            this.winGame();
        }
    }

    // =========================================================
    // 低光壓迫 / 黑幕
    // =========================================================
    updateLowEnergyEffects() {
        const ratio = this.lightEnergy / Math.max(1, this.maxLightEnergy);

        const vignetteAlpha = ratio < 0.30
            ? Phaser.Math.Clamp((0.30 - ratio) * 1.8, 0, 0.28)
            : 0;

        if (this.vignette) {
            this.vignette.setAlpha(vignetteAlpha);
        }

        // 先固定鏡頭，不做呼吸縮放
        this.cameras.main.setZoom(this.baseCameraZoom);

        // 先停用心跳音效，等畫面穩了再加回來
        if (this.lowEnergyHeartbeatPlaying) {
            this.sound.stopByKey('heartbeat');
            this.lowEnergyHeartbeatPlaying = false;
        }

        if (this.time.now < this.uiSoftenedUntil) {
            this.topPanel.setFillStyle(0x102316, 0.84);
            this.energyBar.setFillStyle(0xa8ffb0, 1);
        } else {
            this.topPanel.setFillStyle(0x081018, 0.86);
            this.energyBar.setFillStyle(0xffdc72, 1);
        }
    }

    redrawDarkOverlay() {
        if (!this.player || !this.darkOverlay) return;

        const cam = this.cameras.main;
        const px = this.player.x - cam.scrollX;
        const py = this.player.y - cam.scrollY;

        this.darkOverlay.clear();

        // 整體黑幕：稍微淡一點，避免太悶
        this.darkOverlay.fillStyle(0x000000, 0.74);
        this.darkOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);

        const color = this.redBurstActive ? 0xffd89a : 0xffefb0;

        // 主光圈：層數更多、每層更淡 → 會順很多
        const layers = 50;
        const radius = this.lightRadius * 1.02;

        for (let i = layers; i >= 1; i--) {
            const ratio = i / layers;
            const r = radius * ratio;

            const alpha = this.redBurstActive
                ? 0.004 + ratio * 0.016
                : 0.003 + ratio * 0.015;

            this.darkOverlay.fillStyle(color, alpha);
            this.darkOverlay.fillCircle(px, py, r);
        }

        // 中心補一層柔亮，不要太硬
        const coreLayers = 12;
        const coreRadius = this.tileSize * 1.25;

        for (let i = coreLayers; i >= 1; i--) {
            const ratio = i / coreLayers;
            const r = coreRadius * ratio;
            const alpha = 0.004 + ratio * 0.010;

            this.darkOverlay.fillStyle(color, alpha);
            this.darkOverlay.fillCircle(px, py, r);
        }
    }

    drawSoftLight(x, y, radius, color) {
        const layers = 10;

        for (let i = layers; i >= 1; i--) {
            const ratio = i / layers;
            const r = radius * ratio;
            const alpha = this.redBurstActive
                ? 0.018 + ratio * 0.040
                : 0.010 + ratio * 0.030;

            this.darkOverlay.fillStyle(color, alpha);
            this.darkOverlay.fillCircle(x, y, r);
        }
    }

    flashDangerOverlay() {
        if (this.damageFlash) {
            this.damageFlash.destroy();
        }

        this.damageFlash = this.add.rectangle(640, 360, 1280, 720, 0xff4d4d, 0.16)
            .setScrollFactor(0)
            .setDepth(1500);

        this.tweens.add({
            targets: this.damageFlash,
            alpha: 0,
            duration: 180,
            onComplete: () => {
                this.damageFlash?.destroy();
                this.damageFlash = null;
            }
        });
    }

    pulseEnergyBar() {
        if (!this.energyBar) return;

        this.tweens.add({
            targets: this.energyBar,
            scaleY: 1.28,
            duration: 100,
            yoyo: true
        });
    }

    // =========================================================
    // HUD 更新 / 訊息
    // =========================================================
    updateHUD() {
        const ratio = this.lightEnergy / Math.max(1, this.maxLightEnergy);

        this.energyText.setText(`光能 ${this.lightEnergy} / ${this.maxLightEnergy}`);
        this.energyBar.scaleX = Math.max(0.001, ratio);

        if (ratio <= 0.25) {
            this.energyText.setColor('#ffb3b3');
        } else if (ratio <= 0.50) {
            this.energyText.setColor('#ffe7a8');
        } else {
            this.energyText.setColor('#fff6c9');
        }

        this.fireflyInfoText.setText(
            `黃Lv${this.fireflyPower.yellow}　藍Lv${this.fireflyPower.blue}　綠Lv${this.fireflyPower.green}　紅 ${this.redBurstUseCount}/${this.redBurstMaxUses}`
        );

        const remainingUses = Math.max(0, this.redBurstMaxUses - this.redBurstUseCount);
        const cdText = this.redBurstCooldownSteps > 0 ? ` / CD${this.redBurstCooldownSteps}` : '';

        this.burstBtnCountText.setText(`剩餘 ${remainingUses}${cdText}`);

        if (remainingUses <= 0) {
            this.burstBtnBg.setAlpha(0.08);
            this.burstBtnText.setAlpha(0.45);
            this.burstBtnCountText.setAlpha(0.45);
        } else if (this.redBurstCooldownSteps > 0) {
            this.burstBtnBg.setAlpha(0.12);
            this.burstBtnText.setAlpha(0.75);
            this.burstBtnCountText.setAlpha(0.80);
        } else if (this.redBurstActive) {
            this.burstBtnBg.setAlpha(0.34);
            this.burstBtnText.setAlpha(1);
            this.burstBtnCountText.setAlpha(1);
        } else {
            this.burstBtnBg.setAlpha(0.20);
            this.burstBtnText.setAlpha(1);
            this.burstBtnCountText.setAlpha(1);
        }
    }

    setMessage(text) {
        if (!text) return;

        this.messageText.setText(text);

        if (this.messageTimer) {
            this.messageTimer.remove(false);
            this.messageTimer = null;
        }

        this.messageTimer = this.time.delayedCall(2200, () => {
            this.messageText.setText('');
        });
    }

    // =========================================================
    // 勝敗 / 關卡切換
    // =========================================================
    winGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.resetJoystick();

        if (this.lowEnergyHeartbeatPlaying) {
            this.sound.stopByKey('heartbeat');
            this.lowEnergyHeartbeatPlaying = false;
        }

        this.setMessage('成功解鎖！你帶著光穿越了黑暗森林。');

        const remainPercent = Math.ceil((this.lightEnergy / this.maxLightEnergy) * 100);
        let stars = 1;
        if (remainPercent >= 65) stars = 3;
        else if (remainPercent >= 30) stars = 2;

        this.time.delayedCall(500, () => {
            this.showResultPanel(true, stars, `剩餘光能：${this.lightEnergy}/${this.maxLightEnergy}`);
        });
    }

    failGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.resetJoystick();

        if (this.lowEnergyHeartbeatPlaying) {
            this.sound.stopByKey('heartbeat');
            this.lowEnergyHeartbeatPlaying = false;
        }

        this.setMessage('提燈熄滅了… 這次沒能找到解鎖點。');

        this.time.delayedCall(500, () => {
            this.showResultPanel(false, 1, '光能耗盡');
        });
    }

    showResultPanel(success, stars, subText) {
        const sw = this.scale.width;
        const sh = this.scale.height;

        // 先擋住底下操作
        this.resultBlocker = this.add.rectangle(sw / 2, sh / 2, sw, sh, 0x000000, 0.38)
            .setScrollFactor(0)
            .setDepth(19990)
            .setInteractive();

        this.resultBg = this.add.rectangle(sw / 2, sh / 2, 520, 300, 0x081018, 0.92)
            .setScrollFactor(0)
            .setDepth(20000)
            .setStrokeStyle(3, success ? 0x91ecff : 0xffb0b0, 0.65);

        this.resultTitle = this.add.text(sw / 2, sh / 2 - 90, success ? '探索成功！' : '探索失敗', {
            fontSize: '40px',
            color: success ? '#e8fdff' : '#ffd5d5',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.resultStar = this.add.text(sw / 2, sh / 2 - 20, '⭐'.repeat(stars), {
            fontSize: '42px',
            color: '#ffe27a',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.resultDesc = this.add.text(sw / 2, sh / 2 + 42, subText, {
            fontSize: '24px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.resultBtn = this.add.rectangle(
            sw / 2,
            sh / 2 + 108,
            220,
            56,
            success ? 0x7bd389 : 0x6cc4ff,
            0.95
        )
            .setScrollFactor(0)
            .setDepth(20002)
            .setStrokeStyle(2, 0xffffff, 0.5)
            .setInteractive({ useHandCursor: true });

        this.resultBtnText = this.add.text(
            sw / 2,
            sh / 2 + 108,
            success ? '下一關' : '再玩一次',
            {
                fontSize: '26px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(20003);

        this.resultBtn.on('pointerover', () => {
            this.resultBtn.setScale(1.05);
        });

        this.resultBtn.on('pointerout', () => {
            this.resultBtn.setScale(1);
        });

        this.resultBtn.on('pointerdown', () => {
            this.cleanupBeforeRestart();

            if (success) {
                this.goToNextLevel();
            } else {
                this.scene.restart();
            }
        });

        this.tweens.add({
            targets: [
                this.resultBg,
                this.resultTitle,
                this.resultStar,
                this.resultDesc,
                this.resultBtn,
                this.resultBtnText
            ],
            alpha: { from: 0, to: 1 },
            duration: 180
        });
    }

    cleanupBeforeRestart() {
        this.resetJoystick();

        if (this.messageTimer) {
            this.messageTimer.remove(false);
            this.messageTimer = null;
        }

        if (this.currentMoveTween) {
            this.currentMoveTween.stop();
            this.currentMoveTween = null;
        }

        if (this.lowEnergyHeartbeatPlaying) {
            this.sound.stopByKey('heartbeat');
            this.lowEnergyHeartbeatPlaying = false;
        }

        this.input.removeAllListeners();
        this.children.removeAll();
    }

    goToNextLevel() {
        const order = ['stage_1', 'stage_2', 'stage_3'];
        const currentIndex = order.indexOf(this.levelKey);

        if (currentIndex === -1 || currentIndex >= order.length - 1) {
            this.registry.set('firefly_stage_key', 'stage_1');
            this.scene.restart();
            return;
        }

        const nextKey = order[currentIndex + 1];
        this.registry.set('firefly_stage_key', nextKey);
        this.scene.restart();
    }
}