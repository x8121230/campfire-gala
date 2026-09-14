import { FIREFLY_MAZES } from '../data/FireflyMazeData.js';

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

        // ===== 四色螢火能力（目前先固定）=====
        this.fireflyPower = {
            yellow: 3,
            blue: 2,
            green: 2,
            red: 2
        };

        // ===== 光能設定 =====
        this.baseMaxLightEnergy = 100;
        this.baseLightDrainPerSecond = 0.9;
        this.baseRevealRadius = 170;

        this.maxLightEnergy = this.baseMaxLightEnergy + this.fireflyPower.yellow * 12;
        this.lightEnergy = this.maxLightEnergy;

        this.lightDrainPerSecond = Math.max(
            0.3,
            this.baseLightDrainPerSecond - this.fireflyPower.green * 0.08
        );

        this.revealRadiusBonus = this.fireflyPower.blue * 18;
        this.revealRadius = this.baseRevealRadius + this.revealRadiusBonus;

        this.maxLightRadius = 230;
        this.minLightRadius = 70;
        this.lightRadius = this.maxLightRadius;

        // ===== 紅光爆發 =====
        this.redBurstCharges = this.fireflyPower.red;
        this.redBurstActive = false;
        this.redBurstEndTime = 0;
        this.redBurstDuration = 2200;
        this.redBurstBonusRadius = 260;

        // ===== 虛擬搖桿 =====
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.joystickBaseX = 160;
        this.joystickBaseY = 560;
        this.joystickRadius = 58;
        this.joystickDx = 0;
        this.joystickDy = 0;

        // ===== 場景資料 =====
        this.walkableTiles = [];
        this.wallTiles = [];
        this.collectibles = [];
        this.hazards = [];
        this.startTile = null;
        this.goalTile = null;

        // ===== 相機 =====
        this.cameras.main.setBackgroundColor('#dff1c8');
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // ===== 建立場景 =====
        this.drawMaze();
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
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        }
        this.cameras.main.setZoom(1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.setMessage(`${this.levelName}：${this.levelHint}`);
        this.updateHUD();
        this.redrawDarkOverlay();
    }

    // =========================================================
    // 地圖 / 場景建立
    // =========================================================
    drawMaze() {
        this.walkableTiles = [];
        this.wallTiles = [];
        this.startTile = null;
        this.goalTile = null;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.mapData[row][col];

                const x = this.offsetX + col * this.tileSize;
                const y = this.offsetY + row * this.tileSize;
                const centerX = x + this.tileSize / 2;
                const centerY = y + this.tileSize / 2;

                const isRoad = this.isRoadCell(cell);

                if (!isRoad) {
                    // 牆 / 草地 / 不可走
                    const grass = this.add.rectangle(
                        centerX,
                        centerY,
                        this.tileSize,
                        this.tileSize,
                        0x6ea563,
                        1
                    );
                    grass.setDepth(1);

                    // 草地細線，讓牆區更像背景
                    grass.setStrokeStyle(1, 0x4d7d45, 0.22);

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
                    // 路 / 可走區
                    const road = this.add.rectangle(
                        centerX,
                        centerY,
                        this.tileSize,
                        this.tileSize,
                        0xf2dec8,
                        0.95
                    );
                    road.setStrokeStyle(2, 0x8f6f4f, 0.45);
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

                    if (cell === 2) {
                        const startMark = this.add.circle(centerX, centerY, 14, 0x7dd3fc, 0.9);
                        startMark.setDepth(3);

                        this.startTile = {
                            row,
                            col,
                            x: centerX,
                            y: centerY
                        };
                    }

                    if (cell === 3) {
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
                            row,
                            col,
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
        // 正式統一：
        // 0 = 牆 / 不可走
        // 1 = 路 / 可走
        // 2 = 起點
        // 3 = 終點
        return cell === 1 || cell === 2 || cell === 3;
    }

    createDecorations() {
        for (let i = 0; i < 35; i++) {
            const x = Phaser.Math.Between(this.offsetX, this.worldWidth - this.offsetX);
            const y = Phaser.Math.Between(this.offsetY, this.worldHeight - this.offsetY);

            const g1 = this.add.rectangle(x - 8, y + 2, 4, 16, 0x4f8c4d, 0.7).setAngle(-12);
            const g2 = this.add.rectangle(x, y, 4, 18, 0x5a9a59, 0.75);
            const g3 = this.add.rectangle(x + 8, y + 2, 4, 16, 0x4f8c4d, 0.7).setAngle(12);

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
            const core = this.add.circle(x, y, 7, 0xffffff, 0.9).setDepth(6);

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

            const body = this.add.ellipse(x, y + 6, 34, 28, 0x6b5a5a, 0.95).setDepth(5);
            const eyeL = this.add.circle(x - 8, y, 3, 0xffd4d4, 1).setDepth(6);
            const eyeR = this.add.circle(x + 8, y, 3, 0xffd4d4, 1).setDepth(6);

            this.tweens.add({
                targets: body,
                scaleX: 1.05,
                scaleY: 0.95,
                duration: 700,
                yoyo: true,
                repeat: -1
            });

            this.hazards.push({
                row: item.row,
                col: item.col,
                x,
                y,
                type: item.type,
                damage: item.damage ?? 20,
                body,
                eyeL,
                eyeR,
                triggered: false
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

        const x = this.startTile.x;
        const y = this.startTile.y;

        this.player = this.add.image(x, y, 'player_front');
        this.player.setDepth(20);
        this.player.setDisplaySize(42, 58);

        this.playerGlow = this.add.circle(x, y + 4, 28, 0xffefad, 0.12);
        this.playerGlow.setDepth(19);

        this.playerDir = 'down';
        this.lastDir = { x: 0, y: 1 };

        this.playerRow = this.startTile.row;
        this.playerCol = this.startTile.col;

        this.isMovingGrid = false;
        this.moveCooldown = 0;
        this.moveCooldownMax = 400;
        this.gridMoveDuration = 400;
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
        this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        this.topPanel = this.add.rectangle(640, 42, 620, 58, 0x081018, 0.72)
            .setStrokeStyle(2, 0x8fdcff, 0.35);

        this.energyText = this.add.text(110, 28, '光能 100%', {
            fontSize: '24px',
            color: '#fff6c9',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.energyBarBg = this.add.rectangle(310, 42, 250, 18, 0x263844, 0.95).setOrigin(0, 0.5);
        this.energyBar = this.add.rectangle(310, 42, 250, 18, 0xffdc72, 1).setOrigin(0, 0.5);

        this.messageBg = this.add.rectangle(640, 680, 760, 54, 0x081018, 0.76)
            .setStrokeStyle(2, 0xb4ecff, 0.25);

        this.messageText = this.add.text(640, 680, '', {
            fontSize: '24px',
            color: '#eefcff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        this.helpText = this.add.text(1040, 28, '方向鍵 / WASD / 左下搖桿', {
            fontSize: '20px',
            color: '#c7eaff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0);

        this.fireflyInfoText = this.add.text(640, 76, '', {
            fontSize: '18px',
            color: '#dff5ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.burstBtnBg = this.add.circle(1180, 620, 52, 0xff8a7a, 0.18)
            .setScrollFactor(0)
            .setDepth(1200)
            .setStrokeStyle(3, 0xffc4b9, 0.45)
            .setInteractive(
                new Phaser.Geom.Circle(0, 0, 52),
                Phaser.Geom.Circle.Contains
            );

        this.burstBtnText = this.add.text(1180, 612, '爆發', {
            fontSize: '24px',
            color: '#fff2ed',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1201);

        this.burstBtnCountText = this.add.text(1180, 646, '', {
            fontSize: '18px',
            color: '#ffe2d9',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1201);

        this.burstBtnBg.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            this.activateRedBurst();
        });

        this.ui.add([
            this.topPanel,
            this.energyText,
            this.energyBarBg,
            this.energyBar,
            this.messageBg,
            this.messageText,
            this.helpText,
            this.fireflyInfoText
        ]);
    }

    createDarkOverlay() {
        this.darkOverlay = this.add.graphics();
        this.darkOverlay.setScrollFactor(0);
        this.darkOverlay.setDepth(900);

        this.lightRing = this.add.circle(0, 0, this.lightRadius, 0xfff2a8, 0.06);
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
        this.joystickContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(1200);

        this.joystickBase = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            this.joystickRadius,
            0xaedfff,
            0.10
        ).setStrokeStyle(3, 0xc7ecff, 0.28);

        this.joystickThumb = this.add.circle(
            this.joystickBaseX,
            this.joystickBaseY,
            28,
            0xdff6ff,
            0.24
        ).setStrokeStyle(2, 0xffffff, 0.35);

        this.joystickHint = this.add.text(this.joystickBaseX, this.joystickBaseY + 88, '拖曳移動', {
            fontSize: '20px',
            color: '#dff4ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.joystickTouchZone = this.add.zone(170, 540, 320, 300)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setInteractive();

        this.joystickContainer.add([
            this.joystickBase,
            this.joystickThumb,
            this.joystickHint
        ]);

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

        if (dist <= this.joystickRadius) {
            this.joystickDx = dx / this.joystickRadius;
            this.joystickDy = dy / this.joystickRadius;
            this.joystickThumb.x = this.joystickBaseX + dx;
            this.joystickThumb.y = this.joystickBaseY + dy;
        } else {
            const nx = dx / dist;
            const ny = dy / dist;
            this.joystickDx = nx;
            this.joystickDy = ny;
            this.joystickThumb.x = this.joystickBaseX + nx * this.joystickRadius;
            this.joystickThumb.y = this.joystickBaseY + ny * this.joystickRadius;
        }
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
        if (this.redBurstCharges <= 0) {
            this.setMessage('紅光能量不足，無法爆發。');
            return;
        }
        if (this.redBurstActive) return;

        this.redBurstCharges -= 1;
        this.redBurstActive = true;
        this.redBurstEndTime = this.time.now + this.redBurstDuration;

        this.setMessage('紅色螢火爆發！提燈瞬間大幅照亮四周。');

        this.tweens.add({
            targets: this.burstBtnBg,
            scale: 1.18,
            duration: 120,
            yoyo: true
        });

        if (this.playerGlow) {
            this.tweens.add({
                targets: this.playerGlow,
                alpha: { from: 0.12, to: 0.38 },
                scale: { from: 1, to: 1.45 },
                duration: 180,
                yoyo: true
            });
        }

        if (this.burstFlashCircle) {
            this.burstFlashCircle.destroy();
        }

        this.burstFlashCircle = this.add.circle(
            this.player.x,
            this.player.y,
            40,
            0xffd37a,
            0.22
        ).setDepth(18);

        this.tweens.add({
            targets: this.burstFlashCircle,
            radius: this.lightRadius + 220,
            alpha: 0,
            duration: 260,
            onComplete: () => {
                if (this.burstFlashCircle) {
                    this.burstFlashCircle.destroy();
                    this.burstFlashCircle = null;
                }
            }
        });
    }

    // =========================================================
    // 主更新
    // =========================================================
    update(time, delta) {
        if (this.isGameOver) return;
        if (!this.player) return;

        const dt = delta / 1000;

        if (this.moveCooldown > 0) {
            this.moveCooldown -= delta;
        }

        this.handleMovement();

        if (this.redBurstActive && time >= this.redBurstEndTime) {
            this.redBurstActive = false;
        }

        this.updateLightEnergy(dt);
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

        let dirX = 0;
        let dirY = 0;

        // 鍵盤優先
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            dirX = -1;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            dirX = 1;
        } else if (this.cursors.up.isDown || this.keys.W.isDown) {
            dirY = -1;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            dirY = 1;
        }

        // 搖桿
        if (dirX === 0 && dirY === 0) {
            const absX = Math.abs(this.joystickDx);
            const absY = Math.abs(this.joystickDy);

            if (absX > 0.62 || absY > 0.62) {
                if (absX >= absY) {
                    dirX = this.joystickDx > 0 ? 1 : -1;
                } else {
                    dirY = this.joystickDy > 0 ? 1 : -1;
                }
            }
        }

        if (dirX === 0 && dirY === 0) return;

        const targetRow = this.playerRow + dirY;
        const targetCol = this.playerCol + dirX;

        this.lastDir = { x: dirX, y: dirY };

        this.tryMoveToTile(targetRow, targetCol);
        this.moveCooldown = this.moveCooldownMax;
    }

    updatePlayerGridPos() {
        this.playerCol = Math.round(
            (this.player.x - this.offsetX - this.tileSize / 2) / this.tileSize
        );

        this.playerRow = Math.round(
            (this.player.y - this.offsetY - this.tileSize / 2) / this.tileSize
        );
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

        // 先記住起點
        const startX = this.player.x;
        const startY = this.player.y;

        this.currentMoveTween = this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: this.gridMoveDuration,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const t = tween.getValue();

                // 水平/垂直主位移
                const baseX = Phaser.Math.Linear(startX, targetX, t);
                const baseY = Phaser.Math.Linear(startY, targetY, t);

                // 額外小彈跳，只當成視覺偏移，不再開第二個 player tween
                const hop = Math.sin(t * Math.PI) * 5;

                this.player.x = baseX;
                this.player.y = baseY - hop;

                if (this.playerGlow) {
                    this.playerGlow.x = this.player.x;
                    this.playerGlow.y = this.player.y + 4;
                }

                if (this.burstFlashCircle) {
                    this.burstFlashCircle.x = this.player.x;
                    this.burstFlashCircle.y = this.player.y;
                }
            },
            onComplete: () => {
                // 強制鎖回格子中心，避免浮點誤差
                this.player.x = targetX;
                this.player.y = targetY;

                this.playerRow = targetRow;
                this.playerCol = targetCol;

                this.isMovingGrid = false;
                this.currentMoveTween = null;

                if (this.playerGlow) {
                    this.playerGlow.x = this.player.x;
                    this.playerGlow.y = this.player.y + 4;
                }

                if (this.burstFlashCircle) {
                    this.burstFlashCircle.x = this.player.x;
                    this.burstFlashCircle.y = this.player.y;
                }

                this.checkCurrentTileEvent();
            }
        });
    }

    isWalkableTile(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }

        const cell = this.mapData[row][col];
        return this.isRoadCell(cell);
    }

    isWalkable(worldX, worldY) {
        const col = Math.floor((worldX - this.offsetX) / this.tileSize);
        const row = Math.floor((worldY - this.offsetY) / this.tileSize);

        return this.isWalkableTile(row, col);
    }

    // =========================================================
    // 格子事件
    // =========================================================
    checkCurrentTileEvent() {
        if (this.isMovingGrid) return;

        this.checkCollectibles();
        this.checkHazards();
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
                    this.lightEnergy = Math.min(this.maxLightEnergy, this.lightEnergy + 18);
                    this.setMessage('收集到黃光！光能恢復了一些。');
                } else if (item.type === 'blue') {
                    this.revealRadiusBonus += 12;
                    this.setMessage('收集到藍光！視野變大了一點。');
                } else if (item.type === 'green') {
                    this.lightDrainPerSecond = Math.max(0.15, this.lightDrainPerSecond - 0.05);
                    this.setMessage('收集到綠光！耗光速度減慢了。');
                } else if (item.type === 'red') {
                    this.redBurstCharges += 1;
                    this.setMessage('收集到紅光！爆發次數 +1。');
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

    checkHazards() {
        if (!this.hazards || !this.player) return;

        for (const item of this.hazards) {
            if (item.row === this.playerRow && item.col === this.playerCol) {
                if (!item.triggered) {
                    item.triggered = true;

                    const damage = item.damage ?? 20;
                    this.lightEnergy = Math.max(0, this.lightEnergy - damage);
                    this.setMessage(`你被黑影嚇到了！光能 -${damage}`);

                    this.tweens.add({
                        targets: [item.body, item.eyeL, item.eyeR],
                        scaleX: 1.15,
                        scaleY: 1.15,
                        duration: 120,
                        yoyo: true
                    });

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
    // 光能 / 黑幕
    // =========================================================
    updateLightEnergy(dt) {
        if (this.isGameOver) return;

        this.lightEnergy -= this.lightDrainPerSecond * dt;
        this.lightEnergy = Phaser.Math.Clamp(this.lightEnergy, 0, this.maxLightEnergy);

        const t = this.lightEnergy / this.maxLightEnergy;

        let currentMaxRadius = this.maxLightRadius;
        if (this.redBurstActive) {
            currentMaxRadius += this.redBurstBonusRadius;
        }

        this.lightRadius = Phaser.Math.Linear(this.minLightRadius, currentMaxRadius, t);
        this.revealRadius = this.lightRadius * 0.82 + this.revealRadiusBonus + (this.redBurstActive ? 40 : 0);

        if (this.lightRing) {
            this.lightRing.x = this.player.x;
            this.lightRing.y = this.player.y;
            this.lightRing.setRadius(this.lightRadius);
            this.lightRing.setAlpha(this.redBurstActive ? 0.18 : (0.04 + 0.06 * t));
        }

        if (this.lightEnergy <= 0) {
            this.failGame();
        }
    }

    redrawDarkOverlay() {
        if (!this.player || !this.darkOverlay) return;

        const cam = this.cameras.main;
        const screenX = this.player.x - cam.scrollX;
        const screenY = this.player.y - cam.scrollY;

        this.darkOverlay.clear();

        this.darkOverlay.fillStyle(0x02060a, this.redBurstActive ? 0.52 : 0.86);
        this.darkOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);

        const layers = this.redBurstActive ? 9 : 7;

        for (let i = layers; i >= 1; i--) {
            const ratio = i / layers;
            const r = this.lightRadius * ratio;

            const alpha = this.redBurstActive
                ? 0.03 + ratio * 0.05
                : 0.016 + ratio * 0.018;

            this.darkOverlay.fillStyle(this.redBurstActive ? 0xffd98e : 0xfff0a8, alpha);
            this.darkOverlay.fillCircle(screenX, screenY, r);
        }

        if (this.redBurstActive) {
            this.darkOverlay.fillStyle(0xffd98e, 0.045);
            this.darkOverlay.fillCircle(screenX, screenY, this.lightRadius * 1.28);
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
        const ratio = this.lightEnergy / this.maxLightEnergy;
        const percent = Math.ceil(ratio * 100);

        this.energyText.setText(`光能 ${percent}%`);
        this.energyBar.scaleX = Math.max(0.001, ratio);

        if (percent <= 25) {
            this.energyText.setColor('#ffb3b3');
        } else if (percent <= 50) {
            this.energyText.setColor('#ffe7a8');
        } else {
            this.energyText.setColor('#fff6c9');
        }

        this.fireflyInfoText.setText(
            `黃+${this.fireflyPower.yellow}  藍+${this.fireflyPower.blue}  綠+${this.fireflyPower.green}  紅+${this.fireflyPower.red}`
        );

        this.burstBtnCountText.setText(`剩餘 ${this.redBurstCharges}`);

        if (this.redBurstCharges <= 0) {
            this.burstBtnBg.setAlpha(0.08);
            this.burstBtnText.setAlpha(0.45);
            this.burstBtnCountText.setAlpha(0.45);
        } else if (this.redBurstActive) {
            this.burstBtnBg.setAlpha(0.32);
            this.burstBtnText.setAlpha(1);
            this.burstBtnCountText.setAlpha(1);
        } else {
            this.burstBtnBg.setAlpha(0.18);
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

        this.setMessage('成功解鎖！你帶著光穿越了黑暗森林。');

        const remainPercent = Math.ceil((this.lightEnergy / this.maxLightEnergy) * 100);
        let stars = 1;
        if (remainPercent >= 65) stars = 3;
        else if (remainPercent >= 30) stars = 2;

        this.time.delayedCall(500, () => {
            this.showResultPanel(true, stars, `剩餘光能：${remainPercent}%`);
        });
    }

    failGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.resetJoystick();

        this.setMessage('提燈熄滅了… 這次沒能找到解鎖點。');

        this.time.delayedCall(500, () => {
            this.showResultPanel(false, 1, '光能耗盡');
        });
    }

    showResultPanel(success, stars, subText) {
        const panel = this.add.container(640, 360).setScrollFactor(0).setDepth(2000);

        const bg = this.add.rectangle(0, 0, 520, 300, 0x081018, 0.92)
            .setStrokeStyle(3, success ? 0x91ecff : 0xffb0b0, 0.65);

        const title = this.add.text(0, -90, success ? '探索成功！' : '探索失敗', {
            fontSize: '40px',
            color: success ? '#e8fdff' : '#ffd5d5',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const starText = this.add.text(0, -20, '⭐'.repeat(stars), {
            fontSize: '42px',
            color: '#ffe27a',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        const desc = this.add.text(0, 42, subText, {
            fontSize: '24px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const mainBtn = this.add.rectangle(0, 108, 200, 52, success ? 0x7bd389 : 0x6cc4ff, 0.95)
            .setStrokeStyle(2, 0xffffff, 0.5)
            .setInteractive({ useHandCursor: true });

        const mainBtnText = this.add.text(0, 108, success ? '下一關' : '再玩一次', {
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        mainBtn.on('pointerdown', () => {
            if (success) {
                this.goToNextLevel();
            } else {
                this.scene.restart();
            }
        });

        mainBtn.on('pointerover', () => {
            mainBtn.setScale(1.05);
        });

        mainBtn.on('pointerout', () => {
            mainBtn.setScale(1);
        });

        panel.add([bg, title, starText, desc, mainBtn, mainBtnText]);

        this.tweens.add({
            targets: panel,
            scale: { from: 0.85, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 220,
            ease: 'Back.Out'
        });
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