import { createFernRunnerNode } from './FernRunnerMapLink.js';
import SaveSystem from '../systems/SaveSystem.js';
import StageManager from '../systems/StageManager.js';
import CharacterManager from '../managers/CharacterManager.js';
import { getRegion, getSubmap } from '../data/WorldRegionData.js';
import { getStageData } from '../data/StageData.js';
import { PAPER_DOLL_LAYOUT } from '../data/PaperDollConfig.js';
import { getSubmapDollLayout } from '../data/SubmapDollLayout.js';
import AudioSystem from '../systems/AudioSystem.js';

export default class SubmapGames extends Phaser.Scene {
    constructor() { super('SubmapGames'); }

    init(data) {
        const saved = this.registry.get('submap_return_context') || {};
        this.regionId = data?.regionId || saved.regionId || 'forest';
        this.submapId = data?.submapId || saved.submapId || 'morning_camp';
    }

    create() {
        SaveSystem.applyToRegistry(this.registry);
        StageManager.applyToRegistry(this.registry);
        const region = getRegion(this.regionId);
        const submap = getSubmap(this.regionId, this.submapId);
        AudioSystem.playRegionBgm(this, this.regionId, 0.38);
        this.registry.set('submap_return_context', { regionId: this.regionId, submapId: this.submapId });
        const background = submap?.background && this.textures.exists(submap.background)
            ? submap.background : 'world_map_overview';
        this.add.image(640, 360, background).setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x102c32, submap?.layout === 'storybook_map' ? 0.1 : 0.45);

        if (submap?.layout === 'storybook_map') {
            this.createStorybookMap(region, submap);
            return;
        }

        this.add.text(640, 55, `${region.icon} ${submap?.name || '冒險挑戰'}`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '38px', color: '#fff1b1', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.makeButton(100, 55, 160, 56, '← 子地圖', () => this.scene.start('RegionGuide', { regionId: this.regionId }), 0x315e75);
        const stages = submap?.stageIds || [];
        const slots = submap?.slots || 3;
        for (let i = 0; i < slots; i += 1) {
            const x = 250 + (i % 3) * 390;
            const y = 245 + Math.floor(i / 3) * 260;
            if (i < stages.length) this.createStageCard(x, y, stages[i]);
            else this.createComingSoonCard(x, y, i + 1);
        }
    }

    createStorybookMap(region, submap) {
        this.createStorybookAmbience(submap);
        this.add.rectangle(640, 48, 1280, 96, 0x174b62, 0.78).setDepth(70);
        this.add.text(640, 31, `${region.icon} ${submap.name}`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '34px', color: '#fff2b4',
            fontStyle: 'bold', stroke: '#16475b', strokeThickness: 5
        }).setOrigin(0.5).setDepth(71);
        this.add.text(640, 72, submap.subtitle || submap.description, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '18px', color: '#e7fbff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(71);
        this.makeButton(95, 50, 150, 54, `← ${region.name}`, () => this.scene.start('RegionGuide', { regionId: this.regionId }), 0x286f88).setDepth(72);

        const layout = getSubmapDollLayout(this.submapId, PAPER_DOLL_LAYOUT.worldMap);
        const footY = layout.footY ?? layout.centerY + layout.maxHeight * (1266 / 1290 - .5);
        this.add.ellipse(layout.centerX, footY + 3, layout.maxWidth * .52, 18, 0x243b38, .18).setDepth(10);
        this.add.ellipse(layout.centerX, footY + 2, layout.maxWidth * .34, 9, 0x243b38, .12).setDepth(11);
        this.character = new CharacterManager(this);
        this.character.createCharacter(layout.centerX, layout.centerY, layout);
        this.character.container.setDepth(12);

        const dollHitArea = new Phaser.Geom.Rectangle(
            -layout.maxWidth / 2, -layout.maxHeight / 2,
            layout.maxWidth, layout.maxHeight
        );
        this.character.container
            .setInteractive(dollHitArea, Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.scene.start('Collection', {
                mapID: '01',
                returnScene: 'SubmapGames',
                regionId: this.regionId,
                submapId: this.submapId
            }));

        (submap.stageIds || []).forEach((stageId, index) => {
            const p = submap.stagePlacements?.[stageId] || { x: 260 + index * 380, y: 320 };
            this.createStorybookStage(p.x, p.y, stageId, index);
        });
        const stageCount = (submap.stageIds || []).length;
        for (let index = stageCount; index < (submap.slots || 3); index += 1) {
            const p = submap.slotPlacements?.[index] || { x: 260 + (index % 3) * 380, y: index < 3 ? 330 : 575 };
            this.createComingSoonBubble(p.x, p.y, index);
        }
    }

    createStorybookAmbience(submap) {
        if (submap.id === 'sky_temple') {
            const templeColors = [0xffffff, 0xd8c4ff, 0xaee8ff, 0xffe19a];
            for (let index = 0; index < 14; index += 1) {
                const crystalGlint = this.add.star(
                    60 + (index * 93) % 1170,
                    85 + (index * 63) % 430,
                    5, 2, 6,
                    templeColors[index % templeColors.length], 0.16
                ).setDepth(5);
                this.tweens.add({
                    targets: crystalGlint, scale: 1.9, alpha: 0.7, angle: index % 2 ? 35 : -35,
                    duration: 1180 + index * 110, delay: index * 92,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 930, y: 300 }, { x: 1010, y: 370 }, { x: 1090, y: 445 }].forEach((point, index) => {
                const liftGlow = this.add.ellipse(point.x, point.y, 46, 10, templeColors[index + 1], 0.05).setDepth(6);
                this.tweens.add({ targets: liftGlow, y: point.y - 10, alpha: 0.3, scaleX: 1.18, duration: 900 + index * 130, delay: index * 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            [{ x: 230, y: 335 }, { x: 640, y: 205 }, { x: 1060, y: 350 }].forEach((point, index) => {
                const templeGlow = this.add.star(point.x, point.y, 7, 3, 9, templeColors[index + 1], 0.07).setDepth(6);
                this.tweens.add({ targets: templeGlow, scale: 2.3, alpha: 0.34, angle: index % 2 ? 28 : -28, duration: 1120 + index * 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'windchime_isle') {
            const chimeColors = [0xffb8d8, 0x9edfff, 0xcdb9ff, 0xa8ebcf, 0xffdc78];
            for (let index = 0; index < 15; index += 1) {
                const petal = this.add.ellipse(
                    55 + (index * 91) % 1170,
                    95 + (index * 57) % 430,
                    7 + index % 3, 4 + index % 2,
                    chimeColors[index % chimeColors.length], 0.2
                ).setAngle(index * 27).setDepth(5);
                this.tweens.add({
                    targets: petal, x: petal.x + 34 + index % 3 * 8, y: petal.y + (index % 2 ? 16 : -10), angle: petal.angle + 55, alpha: 0.58,
                    duration: 2050 + index * 125, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 490, y: 260 }, { x: 530, y: 240 }, { x: 570, y: 260 }, { x: 610, y: 240 }].forEach((point, index) => {
                const airGlow = this.add.ellipse(point.x, point.y, 34, 6, chimeColors[index], 0.05).setAngle(-12).setDepth(6);
                this.tweens.add({ targets: airGlow, x: point.x + 24, y: point.y - 8, alpha: 0.29, scaleX: 1.22, duration: 820, delay: index * 235, yoyo: true, repeat: -1, repeatDelay: 650, ease: 'Sine.easeInOut' });
            });
            [{ x: 225, y: 320 }, { x: 610, y: 205 }, { x: 1045, y: 260 }, { x: 1080, y: 515 }].forEach((point, index) => {
                const islandGlow = this.add.star(point.x, point.y, 6, 3, 8, chimeColors[index], 0.07).setDepth(6);
                this.tweens.add({ targets: islandGlow, scale: 2.3, alpha: 0.33, angle: index % 2 ? 28 : -28, duration: 1080 + index * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'cloud_meadow') {
            const cloudColors = [0xffffff, 0xccecff, 0xffd7ee, 0xded0ff, 0xffe995];
            for (let index = 0; index < 15; index += 1) {
                const cloudMote = this.add.ellipse(
                    45 + (index * 87) % 1190,
                    90 + (index * 61) % 430,
                    5 + index % 3 * 2, 3 + index % 2 * 2,
                    cloudColors[index % cloudColors.length], 0.18
                ).setDepth(5);
                this.tweens.add({
                    targets: cloudMote, x: cloudMote.x + 30 + index % 4 * 7, y: cloudMote.y + (index % 2 ? 7 : -7), alpha: 0.55,
                    duration: 2100 + index * 120, delay: index * 95,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 520, y: 255 }, { x: 555, y: 245 }, { x: 590, y: 255 }, { x: 625, y: 245 }].forEach((point, index) => {
                const breezeRibbon = this.add.ellipse(point.x, point.y, 30, 5, cloudColors[index + 1], 0.06).setAngle(-8).setDepth(6);
                this.tweens.add({ targets: breezeRibbon, x: point.x + 24, alpha: 0.3, scaleX: 1.25, duration: 880, delay: index * 240, yoyo: true, repeat: -1, repeatDelay: 620, ease: 'Sine.easeInOut' });
            });
            [{ x: 230, y: 335 }, { x: 600, y: 205 }, { x: 1060, y: 260 }, { x: 1070, y: 525 }].forEach((point, index) => {
                const landmarkGlow = this.add.star(point.x, point.y, 6, 3, 8, cloudColors[index + 1], 0.07).setDepth(6);
                this.tweens.add({ targets: landmarkGlow, scale: 2.25, alpha: 0.32, angle: index % 2 ? 25 : -25, duration: 1100 + index * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'crown_chess_city') {
            const royalColors = [0xffdf76, 0xa9eaff, 0xffffff, 0x9eaaff];
            for (let index = 0; index < 14; index += 1) {
                const crownSpark = this.add.star(
                    70 + (index * 97) % 1160,
                    85 + (index * 59) % 410,
                    4, 2, 6,
                    royalColors[index % royalColors.length], 0.17
                ).setDepth(5);
                this.tweens.add({
                    targets: crownSpark, scale: 1.85, alpha: 0.7, angle: index % 2 ? 30 : -30,
                    duration: 1200 + index * 100, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 520, y: 490 }, { x: 560, y: 470 }, { x: 600, y: 490 }, { x: 640, y: 470 }, { x: 680, y: 490 }].forEach((point, index) => {
                const strategyGlow = this.add.rectangle(point.x, point.y, 25, 18, 0xffefb0, 0.04).setAngle(index % 2 ? 4 : -4).setDepth(6);
                this.tweens.add({ targets: strategyGlow, alpha: 0.27, scale: 1.14, duration: 740, delay: index * 230, yoyo: true, repeat: -1, repeatDelay: 760, ease: 'Sine.easeInOut' });
            });
            [{ x: 235, y: 335 }, { x: 640, y: 220 }, { x: 1050, y: 340 }].forEach((point, index) => {
                const royalGlow = this.add.star(point.x, point.y, 7, 3, 9, royalColors[index], 0.08).setDepth(6);
                this.tweens.add({ targets: royalGlow, scale: 2.3, alpha: 0.34, angle: index % 2 ? 26 : -26, duration: 1120 + index * 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'knight_gallery') {
            const galleryColors = [0xffdf78, 0x9ee8ff, 0xffffff, 0x9eb6ff];
            for (let index = 0; index < 13; index += 1) {
                const glassSpark = this.add.star(
                    90 + (index * 89) % 1110,
                    95 + (index * 61) % 390,
                    4, 2, 5,
                    galleryColors[index % galleryColors.length], 0.16
                ).setDepth(5);
                this.tweens.add({
                    targets: glassSpark, scale: 1.9, alpha: 0.68, angle: index % 2 ? 32 : -32,
                    duration: 1150 + index * 105, delay: index * 85,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 520, y: 390 }, { x: 555, y: 390 }, { x: 590, y: 390 }, { x: 590, y: 355 }].forEach((point, index) => {
                const stepGlow = this.add.rectangle(point.x, point.y, 24, 18, 0xffedaa, 0.04).setAngle(-4).setDepth(6);
                this.tweens.add({ targets: stepGlow, alpha: 0.28, scale: 1.16, duration: 720, delay: index * 250, yoyo: true, repeat: -1, repeatDelay: 700, ease: 'Sine.easeInOut' });
            });
            [{ x: 225, y: 330 }, { x: 585, y: 225 }, { x: 1035, y: 255 }, { x: 1080, y: 520 }].forEach((point, index) => {
                const landmarkGlow = this.add.star(point.x, point.y, 6, 3, 8, galleryColors[index], 0.08).setDepth(6);
                this.tweens.add({ targets: landmarkGlow, scale: 2.25, alpha: 0.32, angle: index % 2 ? 28 : -28, duration: 1050 + index * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'pawn_harbor') {
            const harborColors = [0xffdf7f, 0xbcecff, 0xffffff, 0xffb29a];
            for (let index = 0; index < 14; index += 1) {
                const waterSpark = this.add.star(
                    50 + (index * 91) % 1180,
                    230 + (index * 53) % 280,
                    4, 2, 5,
                    harborColors[index % harborColors.length],
                    0.19
                ).setDepth(5);
                this.tweens.add({
                    targets: waterSpark,
                    scale: 1.75, alpha: 0.7, angle: index % 2 ? 35 : -35,
                    duration: 1250 + index * 115, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 555, y: 325 }, { x: 590, y: 300 }, { x: 625, y: 275 }, { x: 660, y: 250 }].forEach((point, index) => {
                const tileGlow = this.add.rectangle(point.x, point.y, 25, 18, 0xfff1b8, 0.05).setAngle(-10).setDepth(6);
                this.tweens.add({ targets: tileGlow, alpha: 0.3, scale: 1.18, duration: 760, delay: index * 260, yoyo: true, repeat: -1, repeatDelay: 650, ease: 'Sine.easeInOut' });
            });
            [{ x: 235, y: 330 }, { x: 640, y: 215 }, { x: 1060, y: 300 }].forEach((point, index) => {
                const harborGlow = this.add.circle(point.x, point.y, 17, harborColors[index], 0.08)
                    .setStrokeStyle(2, 0xfff3c8, 0.46).setDepth(6);
                this.tweens.add({ targets: harborGlow, scale: 2.3, alpha: 0.31, duration: 1080 + index * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'ancient_nest_valley') {
            const valleyColors = [0xffe28c, 0xa7f0c2, 0xa8e8ff, 0xffb87a];
            for (let index = 0; index < 13; index += 1) {
                const driftingLeaf = this.add.ellipse(
                    60 + (index * 103) % 1160,
                    125 + (index * 63) % 390,
                    5 + index % 3,
                    10 + index % 4,
                    valleyColors[index % valleyColors.length],
                    0.2
                ).setAngle(index * 29).setDepth(5);
                this.tweens.add({
                    targets: driftingLeaf,
                    x: driftingLeaf.x + (index % 2 ? 36 : -30),
                    y: driftingLeaf.y + 32 + index % 3 * 10,
                    angle: driftingLeaf.angle + (index % 2 ? 75 : -75),
                    alpha: 0.55,
                    duration: 2350 + index * 140, delay: index * 95,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 6; index += 1) {
                const waterfallGlint = this.add.circle(500 + index * 85, 330 + index % 2 * 55, 3, 0xe8fbff, 0.17).setDepth(5);
                this.tweens.add({ targets: waterfallGlint, y: waterfallGlint.y + 20, scale: 2, alpha: 0.65, duration: 1050 + index * 120, delay: index * 220, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
            [{ x: 1090, y: 315 }, { x: 1120, y: 350 }, { x: 1150, y: 385 }].forEach((point, index) => {
                const warningStone = this.add.circle(point.x, point.y, 9 + index * 2, 0xffc56e, 0.08)
                    .setStrokeStyle(2, 0xffe8a8, 0.3).setDepth(6);
                this.tweens.add({ targets: warningStone, y: warningStone.y + 5, angle: index % 2 ? 4 : -4, alpha: 0.22, duration: 900 + index * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            [{ x: 230, y: 330 }, { x: 640, y: 205 }, { x: 1070, y: 330 }].forEach((point, index) => {
                const valleyGlow = this.add.circle(point.x, point.y, 17, valleyColors[index], 0.08)
                    .setStrokeStyle(2, 0xfff2c2, 0.45).setDepth(6);
                this.tweens.add({ targets: valleyGlow, scale: 2.35, alpha: 0.31, duration: 1120 + index * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'giant_fern_jungle') {
            const jungleColors = [0xbdf58b, 0x7be6c4, 0xffd56f, 0x8fdfff];
            for (let index = 0; index < 14; index += 1) {
                const leafLight = this.add.ellipse(
                    55 + (index * 97) % 1170,
                    130 + (index * 59) % 430,
                    5 + index % 3,
                    11 + index % 4,
                    jungleColors[index % jungleColors.length],
                    0.22
                ).setAngle(index * 31).setDepth(5);
                this.tweens.add({
                    targets: leafLight,
                    x: leafLight.x + (index % 2 ? 32 : -27),
                    y: leafLight.y + 34 + index % 4 * 9,
                    angle: leafLight.angle + (index % 2 ? 85 : -85),
                    alpha: 0.55,
                    duration: 2300 + index * 145, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 5; index += 1) {
                const waterGlint = this.add.circle(720 + index * 72, 345 + index % 2 * 30, 3, 0xd9fbff, 0.16).setDepth(5);
                this.tweens.add({
                    targets: waterGlint,
                    scale: 2.2, alpha: 0.7,
                    duration: 980 + index * 130, delay: index * 240,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 990, y: 465 }, { x: 1040, y: 490 }, { x: 1090, y: 515 }].forEach((point, index) => {
                const footprint = this.add.ellipse(point.x, point.y, 26, 17, 0xffe799, 0.07).setDepth(6);
                this.tweens.add({ targets: footprint, scale: 1.45, alpha: 0.36, duration: 820, delay: index * 360, yoyo: true, repeat: -1, repeatDelay: 760, ease: 'Sine.easeInOut' });
            });
            [{ x: 220, y: 330 }, { x: 600, y: 195 }, { x: 1080, y: 185 }, { x: 1030, y: 485 }].forEach((point, index) => {
                const jungleGlow = this.add.circle(point.x, point.y, 16, jungleColors[index], 0.08)
                    .setStrokeStyle(2, 0xeaffd7, 0.43).setDepth(6);
                this.tweens.add({ targets: jungleGlow, scale: 2.25, alpha: 0.3, duration: 1120 + index * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'fossil_wilds') {
            const fossilColors = [0xffd98a, 0x8ff5e7, 0xfff1c1, 0x75d9e8];
            for (let index = 0; index < 13; index += 1) {
                const sandSpark = this.add.circle(
                    65 + (index * 101) % 1160,
                    145 + (index * 61) % 425,
                    2 + index % 2,
                    fossilColors[index % fossilColors.length],
                    0.2
                ).setDepth(5);
                this.tweens.add({
                    targets: sandSpark,
                    x: sandSpark.x + 38 + index % 3 * 12,
                    y: sandSpark.y - 20 - index % 4 * 7,
                    alpha: 0.58, scale: 1.35,
                    duration: 2100 + index * 135, delay: index * 100,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 1045, y: 210 }, { x: 1090, y: 255 }, { x: 1130, y: 305 }].forEach((point, index) => {
                const footprint = this.add.ellipse(point.x, point.y, 28, 18, 0xffe5a0, 0.08).setDepth(6);
                this.tweens.add({
                    targets: footprint,
                    scale: 1.45, alpha: 0.38,
                    duration: 820, delay: index * 360,
                    yoyo: true, repeat: -1, repeatDelay: 720,
                    ease: 'Sine.easeInOut'
                });
            });
            [{ x: 240, y: 325 }, { x: 560, y: 205 }, { x: 1080, y: 225 }, { x: 1040, y: 500 }].forEach((point, index) => {
                const fossilGlow = this.add.circle(point.x, point.y, 16, fossilColors[index], 0.08)
                    .setStrokeStyle(2, 0xfff1c8, 0.44).setDepth(6);
                this.tweens.add({
                    targets: fossilGlow,
                    scale: 2.25, alpha: 0.3,
                    duration: 1100 + index * 160,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            });
            return;
        }
        if (submap.id === 'star_sunken_heart') {
            const starColors = [0xfff0a8, 0xc9eaff, 0xe2c7ff, 0xffffff];
            for (let index = 0; index < 14; index += 1) {
                const reflection = this.add.star(
                    90 + (index * 89) % 1110,
                    180 + (index * 73) % 355,
                    4, 2, 5,
                    starColors[index % starColors.length],
                    0.2
                ).setDepth(5);
                this.tweens.add({
                    targets: reflection,
                    scale: 1.7, alpha: 0.72, angle: index % 2 ? 30 : -30,
                    duration: 1450 + index * 120, delay: index * 95,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 6; index += 1) {
                const lakeRipple = this.add.ellipse(255 + index * 145, 365 + index % 2 * 70, 36, 9, 0xaedfff, 0.03)
                    .setStrokeStyle(2, 0xeaf8ff, 0.28).setDepth(5);
                this.tweens.add({
                    targets: lakeRipple,
                    scaleX: 2.5, scaleY: 1.7, alpha: 0.01,
                    duration: 2250 + index * 160, delay: index * 290,
                    repeat: -1, ease: 'Sine.easeOut'
                });
            }
            [{ x: 245, y: 295 }, { x: 640, y: 215 }, { x: 1030, y: 295 }].forEach((point, index) => {
                const sanctuaryGlow = this.add.circle(point.x, point.y, 16, starColors[index], 0.08)
                    .setStrokeStyle(2, 0xfff8d8, 0.46).setDepth(6);
                this.tweens.add({
                    targets: sanctuaryGlow,
                    scale: 2.35, alpha: 0.32,
                    duration: 1080 + index * 170,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            });
            return;
        }
        if (submap.id === 'glow_reeds') {
            const reedColors = [0x78fff0, 0xc9a7ff, 0xffe99a, 0x9fdcff];
            for (let index = 0; index < 12; index += 1) {
                const reedLight = this.add.circle(
                    70 + (index * 103) % 1140,
                    150 + (index * 67) % 420,
                    2 + index % 3,
                    reedColors[index % reedColors.length],
                    0.24
                ).setDepth(5);
                this.tweens.add({
                    targets: reedLight,
                    x: reedLight.x + (index % 2 ? 25 : -22),
                    y: reedLight.y - 18 - index % 4 * 8,
                    scale: 1.35, alpha: 0.72,
                    duration: 1900 + index * 130, delay: index * 100,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 5; index += 1) {
                const mist = this.add.ellipse(80 + index * 265, 470 + index % 2 * 70, 235, 56, 0xe8f9ff, 0.07).setDepth(4);
                this.tweens.add({
                    targets: mist,
                    x: mist.x + 80 + index * 10, scaleX: 1.18, alpha: 0.13,
                    duration: 4400 + index * 360, delay: index * 280,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 3; index += 1) {
                const soundRipple = this.add.ellipse(245, 315, 30, 12, 0x8fffe7, 0.02)
                    .setStrokeStyle(2, reedColors[index], 0.4).setDepth(6);
                this.tweens.add({
                    targets: soundRipple,
                    scaleX: 3.2, scaleY: 2.2, alpha: 0.01,
                    duration: 2300, delay: index * 760,
                    repeat: -1, ease: 'Sine.easeOut'
                });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const landmarkGlow = this.add.circle(point.x, point.y, 15, reedColors[index], 0.08)
                    .setStrokeStyle(2, 0xeafffa, 0.42).setDepth(6);
                this.tweens.add({ targets: landmarkGlow, scale: 2.25, alpha: 0.29, duration: 1150 + index * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'moonshadow_shore') {
            const moonColors = [0xffefa5, 0xd9f7ff, 0xdacbff, 0x9cf7dc];
            for (let index = 0; index < 13; index += 1) {
                const firefly = this.add.circle(
                    55 + (index * 97) % 1170,
                    155 + (index * 71) % 430,
                    2 + index % 3,
                    moonColors[index % moonColors.length],
                    0.28
                ).setDepth(5);
                this.tweens.add({
                    targets: firefly,
                    x: firefly.x + (index % 2 ? 34 : -28),
                    y: firefly.y - 22 - index % 4 * 10,
                    alpha: 0.78,
                    duration: 1800 + index * 140, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            for (let index = 0; index < 5; index += 1) {
                const ripple = this.add.ellipse(380 + index * 135, 330 + index % 2 * 45, 34, 9, 0x8fdcff, 0.05)
                    .setStrokeStyle(2, 0xe5fbff, 0.27).setDepth(5);
                this.tweens.add({ targets: ripple, scaleX: 2.4, scaleY: 1.6, alpha: 0.01, duration: 2100 + index * 190, delay: index * 320, repeat: -1, ease: 'Sine.easeOut' });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const moonGlow = this.add.circle(point.x, point.y, 15, moonColors[index], 0.09)
                    .setStrokeStyle(2, 0xfff9d8, 0.44).setDepth(6);
                this.tweens.add({ targets: moonGlow, scale: 2.3, alpha: 0.31, duration: 1080 + index * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'starfire_summit') {
            const starColors = [0xffd85e, 0xff8b4e, 0xfff1a8, 0x8fe8ff];
            for (let index = 0; index < 15; index += 1) {
                const starSpark = this.add.star(
                    55 + (index * 83) % 1170,
                    120 + (index * 47) % 360,
                    4,
                    2 + index % 2,
                    5 + index % 3,
                    starColors[index % starColors.length],
                    0.3
                ).setDepth(5);
                this.tweens.add({
                    targets: starSpark,
                    y: starSpark.y - 70 - index % 4 * 17,
                    angle: index % 2 ? 55 : -55,
                    scale: 1.45, alpha: 0.06,
                    duration: 2100 + index * 120, delay: index * 85,
                    repeat: -1, ease: 'Sine.easeOut'
                });
            }
            const warningGlow = this.add.circle(245, 305, 24, 0xffa13d, 0.08)
                .setStrokeStyle(3, 0xffe584, 0.5).setDepth(6);
            this.tweens.add({ targets: warningGlow, scale: 2.2, alpha: 0.28, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            [{ x: 245, y: 305 }, { x: 640, y: 215 }, { x: 1020, y: 310 }].forEach((point, index) => {
                const summitGlow = this.add.circle(point.x, point.y, 15, starColors[index], 0.1)
                    .setStrokeStyle(2, 0xfff4ca, 0.45).setDepth(6);
                this.tweens.add({ targets: summitGlow, scale: 2.35, alpha: 0.33, duration: 1050 + index * 175, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'molten_workshop') {
            const forgeColors = [0xffc34d, 0xff7447, 0x72ddff, 0xffe4a3];
            for (let index = 0; index < 12; index += 1) {
                const forgeSpark = this.add.circle(
                    90 + (index * 101) % 1080,
                    160 + (index * 67) % 380,
                    2 + index % 3,
                    forgeColors[index % 2],
                    0.38
                ).setDepth(5);
                this.tweens.add({
                    targets: forgeSpark,
                    x: forgeSpark.x + (index % 2 ? 30 : -22),
                    y: forgeSpark.y - 80 - index % 4 * 16,
                    alpha: 0.06,
                    duration: 1750 + index * 125, delay: index * 90,
                    repeat: -1, ease: 'Sine.easeOut'
                });
            }
            for (let index = 0; index < 4; index += 1) {
                const puff = this.add.ellipse(155 + index * 44, 205 - index % 2 * 22, 25, 38, 0xfff4e2, 0.1).setDepth(5);
                this.tweens.add({ targets: puff, y: puff.y - 48, scale: 1.55, alpha: 0.01, duration: 1650 + index * 180, delay: index * 240, repeat: -1, ease: 'Sine.easeOut' });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const workshopGlow = this.add.circle(point.x, point.y, 15, forgeColors[index], 0.1)
                    .setStrokeStyle(2, 0xfff2c4, 0.45).setDepth(6);
                this.tweens.add({ targets: workshopGlow, scale: 2.3, alpha: 0.33, duration: 1020 + index * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'warmflame_foothill') {
            const emberColors = [0xffc15a, 0xff7b45, 0xffe39a, 0xff9f68];
            for (let index = 0; index < 14; index += 1) {
                const ember = this.add.circle(
                    55 + (index * 89) % 1170,
                    170 + (index * 73) % 420,
                    2 + index % 3,
                    emberColors[index % emberColors.length],
                    0.35
                ).setDepth(5);
                this.tweens.add({
                    targets: ember,
                    x: ember.x + (index % 2 ? 24 : -18),
                    y: ember.y - 75 - index % 4 * 18,
                    alpha: 0.08,
                    duration: 1900 + index * 120, delay: index * 85,
                    repeat: -1, ease: 'Sine.easeOut'
                });
            }
            for (let index = 0; index < 5; index += 1) {
                const steam = this.add.ellipse(115 + index * 55, 285 - index % 2 * 28, 24, 42, 0xfff2df, 0.11).setDepth(5);
                this.tweens.add({
                    targets: steam, y: steam.y - 55, scaleX: 1.65, scaleY: 1.35, alpha: 0.02,
                    duration: 1800 + index * 170, delay: index * 260, repeat: -1, ease: 'Sine.easeOut'
                });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const warmGlow = this.add.circle(point.x, point.y, 15, emberColors[index], 0.1)
                    .setStrokeStyle(2, 0xfff0c2, 0.44).setDepth(6);
                this.tweens.add({ targets: warmGlow, scale: 2.25, alpha: 0.32, duration: 1000 + index * 145, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'aurora_palace') {
            const auroraColors = [0x87fff2, 0xb8a6ff, 0xffb9ec, 0xa7ffbc];
            for (let index = 0; index < 10; index += 1) {
                const auroraSpark = this.add.ellipse(
                    55 + (index * 137) % 1180,
                    115 + (index * 39) % 205,
                    50 + index % 3 * 18,
                    7 + index % 2 * 3,
                    auroraColors[index % auroraColors.length],
                    0.18
                ).setAngle(index % 2 ? 9 : -9).setDepth(5);
                this.tweens.add({
                    targets: auroraSpark,
                    x: auroraSpark.x + (index % 2 ? 75 : -60),
                    scaleX: 1.7, alpha: 0.48,
                    duration: 2100 + index * 130, delay: index * 95,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 245, y: 305 }, { x: 640, y: 215 }, { x: 1020, y: 310 }].forEach((point, index) => {
                const palaceGlow = this.add.circle(point.x, point.y, 16, auroraColors[index], 0.1)
                    .setStrokeStyle(2, 0xffffff, 0.46).setDepth(6);
                this.tweens.add({ targets: palaceGlow, scale: 2.4, alpha: 0.34, duration: 1050 + index * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'ice_mirror_lake') {
            const shimmerColors = [0xdffbff, 0xc8e7ff, 0xf2d2ff, 0xffedb0];
            for (let index = 0; index < 12; index += 1) {
                const shimmer = this.add.ellipse(
                    90 + (index * 103) % 1110,
                    185 + (index * 61) % 430,
                    22 + index % 3 * 8,
                    3,
                    shimmerColors[index % shimmerColors.length],
                    0.22
                ).setAngle(index % 2 ? 8 : -8).setDepth(5);
                this.tweens.add({
                    targets: shimmer,
                    scaleX: 2.1, alpha: 0.62,
                    duration: 900 + index * 95, delay: index * 100,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const prismGlow = this.add.circle(point.x, point.y, 15, shimmerColors[index], 0.1)
                    .setStrokeStyle(2, 0xffffff, 0.44).setDepth(6);
                this.tweens.add({ targets: prismGlow, scale: 2.3, alpha: 0.32, duration: 1000 + index * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'snowbell_field') {
            for (let index = 0; index < 18; index += 1) {
                const snowflake = this.add.circle(
                    25 + (index * 83) % 1230,
                    105 + (index * 47) % 500,
                    2 + index % 4,
                    0xffffff,
                    0.52
                ).setDepth(5);
                this.tweens.add({
                    targets: snowflake,
                    x: snowflake.x + 28 + index % 3 * 12,
                    y: snowflake.y + 145 + index % 4 * 22,
                    alpha: 0.12,
                    duration: 3000 + index * 115, delay: index * 90,
                    repeat: -1, ease: 'Linear'
                });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const frostGlow = this.add.circle(point.x, point.y, 15, index === 2 ? 0xffdf91 : 0xdff7ff, 0.09)
                    .setStrokeStyle(2, 0xffffff, 0.42).setDepth(6);
                this.tweens.add({ targets: frostGlow, scale: 2.25, alpha: 0.3, duration: 1050 + index * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'moon_butterfly_market') {
            for (let index = 0; index < 7; index += 1) {
                const butterfly = this.add.container(
                    75 + (index * 181) % 1120,
                    145 + (index * 83) % 430
                ).setDepth(7).setAlpha(0.42);
                const leftWing = this.add.ellipse(-5, 0, 10, 15, index % 2 ? 0xffe9a3 : 0xdac8ff, 0.78).setAngle(-32);
                const rightWing = this.add.ellipse(5, 0, 10, 15, index % 2 ? 0xffe9a3 : 0xbceeff, 0.78).setAngle(32);
                const body = this.add.circle(0, 2, 2, 0xffffff, 0.92);
                butterfly.add([leftWing, rightWing, body]);
                this.tweens.add({
                    targets: butterfly,
                    x: butterfly.x + (index % 2 ? 80 : -65),
                    y: butterfly.y - 34 - index % 3 * 12,
                    alpha: 0.88,
                    duration: 2500 + index * 180, delay: index * 120,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                this.tweens.add({ targets: [leftWing, rightWing], scaleX: 0.45, duration: 230 + index * 15, yoyo: true, repeat: -1 });
            }
            [{ x: 245, y: 305 }, { x: 640, y: 215 }, { x: 1020, y: 310 }].forEach((point, index) => {
                const lanternGlow = this.add.circle(point.x, point.y, 17, 0xffdf86, 0.1).setDepth(6);
                this.tweens.add({ targets: lanternGlow, scale: 2.35, alpha: 0.32, duration: 1000 + index * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'dew_garden') {
            for (let index = 0; index < 14; index += 1) {
                const droplet = this.add.circle(
                    45 + (index * 97) % 1190,
                    125 + (index * 71) % 500,
                    3 + index % 4,
                    index % 3 === 0 ? 0xfff3b8 : 0xd8fbff,
                    0.42
                ).setStrokeStyle(1, 0xffffff, 0.78).setDepth(5);
                this.tweens.add({
                    targets: droplet,
                    y: droplet.y - 9 - index % 3 * 3,
                    scale: 1.45, alpha: 0.82,
                    duration: 850 + index * 75, delay: index * 90,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 245, y: 295 }, { x: 620, y: 215 }, { x: 1010, y: 295 }, { x: 1100, y: 545 }].forEach((point, index) => {
                const ripple = this.add.circle(point.x, point.y, 13, 0xcffbff, 0.08)
                    .setStrokeStyle(2, index % 2 ? 0xffdf91 : 0xd8fbff, 0.5).setDepth(6);
                this.tweens.add({ targets: ripple, scale: 2.2, alpha: 0.28, duration: 1000 + index * 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id === 'flower_crown_village') {
            const petalColors = [0xffd0df, 0xffefad, 0xe1c8ff, 0xffffff];
            for (let index = 0; index < 12; index += 1) {
                const petal = this.add.ellipse(
                    80 + (index * 109) % 1140,
                    135 + (index * 67) % 470,
                    9 + index % 3 * 3,
                    5 + index % 2 * 2,
                    petalColors[index % petalColors.length],
                    0.64
                ).setAngle(index * 29).setDepth(5);
                this.tweens.add({
                    targets: petal,
                    x: petal.x + (index % 2 ? 38 : -30), y: petal.y + 90 + (index % 3) * 18,
                    angle: petal.angle + 170, alpha: 0.12,
                    duration: 2800 + index * 130, delay: index * 110,
                    repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            [{ x: 245, y: 300 }, { x: 640, y: 220 }, { x: 1020, y: 305 }].forEach((point, index) => {
                const glow = this.add.circle(point.x, point.y, 15, index === 1 ? 0xfff0a8 : 0xffd2e4, 0.12).setDepth(6);
                this.tweens.add({ targets: glow, scale: 2.1, alpha: 0.34, duration: 1050 + index * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            return;
        }
        if (submap.id !== 'jellyfish_palace') return;
        for (let index = 0; index < 12; index += 1) {
            const bubble = this.add.circle(
                55 + (index * 107) % 1180,
                150 + (index * 83) % 520,
                4 + (index % 4) * 2,
                0xdffbff,
                0.3
            ).setStrokeStyle(1, 0xffffff, 0.62).setDepth(5);
            this.tweens.add({
                targets: bubble, y: bubble.y - 130 - (index % 3) * 30,
                x: bubble.x + (index % 2 ? 18 : -18), alpha: 0.05,
                duration: 2600 + index * 120, delay: index * 95,
                repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        for (let index = 0; index < 7; index += 1) {
            const light = this.add.circle(155 + index * 165, 175 + (index % 2) * 120, 8, index % 2 ? 0xb9f6ff : 0xe8c8ff, 0.16).setDepth(6);
            this.tweens.add({ targets: light, scale: 1.8, alpha: 0.42, duration: 900 + index * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
    }

    createStorybookStage(x, y, stageId, index) {
        const data = getStageData(stageId);
        const stars = StageManager.getStageStars(this.registry, stageId);
        const c = this.add.container(x, y).setDepth(20);
        const glow = this.add.circle(0, -15, 57, 0xcaf8ff, 0.2).setStrokeStyle(4, 0xf8e4a7, 0.92);
        const hit = this.add.circle(0, -15, 61, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        const icon = this.add.text(0, -21, data?.icon || '⭐', { fontSize: '48px' }).setOrigin(0.5);
        const title = data?.name?.replace(/^泡泡淺灣[①②③]\s*/, '') || stageId;
        const label = this.add.text(0, 55, `${title}\n⭐ ${stars}/3`, {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '19px', color: '#fff',
            fontStyle: 'bold', align: 'center', lineSpacing: 5, stroke: '#17485d', strokeThickness: 6,
            backgroundColor: '#17485dbb', padding: { x: 12, y: 6 }
        }).setOrigin(0.5);
        c.add([glow, hit, icon, label]);
        this.tweens.add({ targets: c, y: y - 7, duration: 1250 + index * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: glow, scale: 1.12, alpha: 0.38, duration: 850 + index * 120, yoyo: true, repeat: -1 });
        hit.on('pointerover', () => c.setScale(1.08));
        hit.on('pointerout', () => c.setScale(1));
        hit.on('pointerdown', () => StageManager.enterStage(this, stageId, { returnScene: 'SubmapGames' }));
    }

    createComingSoonBubble(x, y, index = 0) {
        if (createFernRunnerNode(this, x, y, index)) return;
        const c = this.add.container(x, y).setDepth(18);
        const bubble = this.add.circle(0, 0, 43, 0xbbefff, 0.28).setStrokeStyle(3, 0xe7fbff, 0.75);
        const text = this.add.text(0, 0, '🌱\n待開放', {
            fontFamily: 'Microsoft JhengHei, Arial', fontSize: '15px', color: '#effcff',
            align: 'center', stroke: '#245b6e', strokeThickness: 4
        }).setOrigin(0.5);
        c.add([bubble, text]);
        this.tweens.add({ targets: c, y: y - 10, duration: 1600 + index * 120, yoyo: true, repeat: -1 });
    }

    createStageCard(x, y, stageId) {
        const data = getStageData(stageId);
        const stars = StageManager.getStageStars(this.registry, stageId);
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 330, 190, 0x285f52, 0.97).setStrokeStyle(4, 0xf2d58f).setInteractive({ useHandCursor: true });
        const icon = this.add.text(0, -48, data?.icon || (data?.type === 'timing' ? '🔥' : data?.type === 'matching' ? '🐿️' : '⭐'), { fontSize: '42px' }).setOrigin(0.5);
        const title = this.add.text(0, 10, data?.name || stageId, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold', align: 'center', wordWrap: { width: 285 } }).setOrigin(0.5);
        const score = this.add.text(0, 65, `⭐ ${stars}/3　點擊開始`, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '18px', color: '#ffe89d' }).setOrigin(0.5);
        c.add([bg, icon, title, score]);
        bg.on('pointerdown', () => StageManager.enterStage(this, stageId, { returnScene: 'SubmapGames' }));
        bg.on('pointerover', () => c.setScale(1.04));
        bg.on('pointerout', () => c.setScale(1));
    }

    createComingSoonCard(x, y, number) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 330, 190, 0x40545a, 0.9).setStrokeStyle(3, 0xaebfc3);
        const icon = this.add.text(0, -35, '🌱', { fontSize: '40px' }).setOrigin(0.5);
        const title = this.add.text(0, 27, `第 ${number} 款小遊戲\n逐步開放`, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '21px', color: '#dce7e9', align: 'center', lineSpacing: 7 }).setOrigin(0.5);
        c.add([bg, icon, title]);
    }

    makeButton(x, y, width, height, label, callback, color) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, width, height, color, 0.98).setStrokeStyle(3, 0xffe6a7).setInteractive({ useHandCursor: true });
        const t = this.add.text(0, 0, label, { fontFamily: 'Microsoft JhengHei, Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        c.add([bg, t]);
        bg.on('pointerdown', callback);
        return c;
    }
}
