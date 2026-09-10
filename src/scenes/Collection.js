// v5.3 — unified paper doll, master-aligned headwear and map synchronization.
import AudioSystem from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import Upgrade from '../systems/EquipmentUpgradeSystem.js';
import { grantAllItemsForTesting } from '../systems/TestGrantSystem.js';
import WardrobeAudio from '../systems/WardrobeAudio.js';
import { ITEM_DB } from '../data/GameData.js';
import { FAIRY_IDS, ensureFairyWardrobe } from '../data/FairyWardrobeData.js';
import {
    PAPER_DOLL_FILES,
    PAPER_DOLL_LAYOUT,
    currentLook,
    fitImage
} from '../data/PaperDollConfig.js';

const CLIP = 'item_hat_daily_01';
const SECRET = 'item_fullset_secret_guard';
const NONE_HAT = '__none_hat__', NONE_ACCESSORY = '__none_accessory__';
const NONE_ITEMS = {
    [NONE_HAT]: { id: NONE_HAT, name: '不戴頭飾', type: 'none', desc: '保留原本的髮型，不配戴頭部裝備。' },
    [NONE_ACCESSORY]: { id: NONE_ACCESSORY, name: '卸下能力飾品', type: 'none', desc: '暫時不使用能力飾品。' }
};
const C = { ink: '#3e5145', muted: '#788477', wood: 0x987454, cream: 0xf8f3e5, green: 0x557b60, gold: 0xe5bd72 };
const FONT = '"Microsoft JhengHei", "Noto Sans CJK TC", Arial, sans-serif';

export default class Collection extends Phaser.Scene {
    constructor() { super('Collection'); }
    init(data = {}) {
        this.mapID = data.mapID || '01';
        this.selectedType = 'all';
        this.page = 0;
        this.selectedId = null;
        this.previewId = null;
        this.armedId = null;
        this.modal = null;
    }
    preload() {
        Object.entries(PAPER_DOLL_FILES).forEach(([key, file]) => {
            if (!this.textures.exists(key)) this.load.image(key, file);
        });
    }
    create() {
        AudioSystem.stopAllBgm(this);
        if (ensureFairyWardrobe(this.registry)) this.save();
        this.audio = new WardrobeAudio(this);
        this.input.setTopOnly(true);
        this.cabin();
        this.header = this.add.container(0, 0);
        this.grid = this.add.container(0, 0);
        this.details = this.add.container(0, 0);
        this.mirror = this.add.container(0, 0);
        this.selectedId = this.owned()[0] || null;
        this.previewId = null;
        this.armedId = null;
        if (Upgrade.normalizeRegistry(this.registry)) this.save();
        EquipmentSystem.applyBonusToRegistry(this.registry);
        this.render();
        this.input.on('pointerdown', this.unlockAudio, this);
        this.events.once('shutdown', () => {
            this.input.off('pointerdown', this.unlockAudio, this);
            this.clearWardrobeEffects(); this.audio.destroy(); this.modal = null;
        });
        this.time.delayedCall(350, () => this.checkMotherGuardReward());
    }
    unlockAudio() { this.audio.unlock(); }
    txt(parent, x, y, text, size = 18, color = C.ink, bold = false) {
        const node = this.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color,
            fontStyle: bold ? 'bold' : 'normal', lineSpacing: 5 });
        parent?.add(node); return node;
    }
    panel(parent, x, y, w, h, fill = C.cream, radius = 18, stroke = null, strokeWidth = 2) {
        const g = this.add.graphics();
        g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, radius);
        if (stroke !== null) g.lineStyle(strokeWidth, stroke).strokeRoundedRect(x, y, w, h, radius);
        parent?.add(g); return g;
    }
    button(parent, x, y, w, h, label, action, fill = C.green, textColor = '#ffffff', name = '') {
        const box = this.add.container(x, y); parent.add(box);
        this.panel(box, 0, 0, w, h, fill, 12);
        this.txt(box, w / 2, h / 2, label, 18, textColor, true).setOrigin(.5);
        const hit = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, .001)
            .setInteractive({ useHandCursor: true }).setName(name || label);
        box.add(hit);
        hit.on('pointerover', () => box.setAlpha(.86));
        hit.on('pointerout', () => box.setAlpha(1));
        hit.on('pointerdown', () => { if (!this.modal || parent === this.modal) { this.audio.effect('click'); action(); } });
        return box;
    }
    cabin() {
        this.cameras.main.setBackgroundColor('#dec8a9');
        const g = this.add.graphics();
        g.fillStyle(0xe7d6bc).fillRect(0, 0, 1280, 720);
        for (let x = 0; x < 1280; x += 128) g.fillStyle(x % 256 ? 0xc9aa85 : 0xd5b993, .3).fillRect(x, 0, 3, 720);
        g.fillStyle(0xad8a65).fillRect(0, 674, 1280, 46);
        g.fillStyle(0x967452).fillRect(0, 672, 1280, 5);
        this.panel(null, 28, 106, 394, 552, 0xb78e64, 26);
        this.panel(null, 38, 116, 374, 532, C.cream, 21);
        this.panel(null, 446, 106, 806, 552, 0xfdfaf2, 22);
        this.txt(null, 58, 132, '今日的小小冒險家', 22, C.ink, true);
        this.panel(null, 70, 200, 310, 394, C.cream, 70, 0xe5dbc6);
        this.txt(null, 42, 686, 'FOREST ATELIER  /  小木屋衣櫃', 13, '#fff8e8');
        this.txt(null, 1234, 686, 'v5.5 · 童話新裝 10 件', 13, '#fff8e8').setOrigin(1, 0);
    }
    item(id) { return ITEM_DB[id] || NONE_ITEMS[id] || null; }
    owned() {
        const a = this.registry.get('owned_items'), b = this.registry.get('owned_collectibles');
        return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])].filter(id => ITEM_DB[id]);
    }
    isEquipped(id) {
        if (id === NONE_HAT) return !this.registry.get('equipped_hat') || this.registry.get('equipped_hat') === 'none';
        if (id === NONE_ACCESSORY) return !this.registry.get('equipped_collectible') || this.registry.get('equipped_collectible') === 'none';
        return ['hat', 'cloth', 'fullset', 'collectible'].some(k => this.registry.get(`equipped_${k}`) === id);
    }
    canUnequip(id) {
        if (!this.isEquipped(id) || id === 'item_cloth_daily_01') return false;
        const item = ITEM_DB[id];
        return Boolean(item && ['hat', 'cloth', 'fullset', 'collectible'].includes(item.type));
    }
    save() {
        try { SaveSystem.saveFromRegistry(this.registry); }
        catch (error) { console.warn('衣櫃存檔失敗', error); this.saveFailed = true; }
    }
    render() { this.clearWardrobeEffects(); this.renderHeader(); this.renderGrid(); this.renderDetails(); this.renderDoll(); }
    renderHeader() {
        this.header.removeAll(true);
        this.button(this.header, 30, 29, 114, 48, '← 地圖', () => this.scene.start('WorldMap', { mapID: this.mapID }), 0xf9f2de, C.ink);
        this.txt(this.header, 170, 24, '森林小木屋', 32, C.ink, true);
        this.txt(this.header, 172, 64, '換一套心情，準備下一場冒險。', 16, '#6f735f');
        this.txt(this.header, 676, 42, `水晶  ${this.registry.get('user_crystals') || 0}`, 21, C.ink, true);
        const prefs = this.audio.prefs;
        this.button(this.header, 826, 29, 110, 48, `音樂 ${prefs.music ? '開' : '關'}`, () => {
            this.audio.toggle('music'); this.save(); this.renderHeader();
        }, 0xf9f2de, C.ink, 'music-toggle');
        this.button(this.header, 946, 29, 110, 48, `音效 ${prefs.sfx ? '開' : '關'}`, () => {
            this.audio.toggle('sfx'); this.save(); this.renderHeader();
        }, 0xf9f2de, C.ink, 'sfx-toggle');
        this.button(this.header, 1066, 29, 184, 48, '測試工具', () => this.openTests(), 0x866a53, '#ffffff', 'test-tools');
    }
    filtered() {
        const result = this.owned().filter(id => {
            const item = ITEM_DB[id];
            if (this.selectedType === 'all') return true;
            if (this.selectedType === 'fairy') return FAIRY_IDS.includes(id);
            if (this.selectedType === 'body') return ['cloth', 'fullset'].includes(item.type);
            if (this.selectedType === 'accessory') return item.type === 'collectible' && (item.skill || item.category === 'equipment');
            if (this.selectedType === 'collection') return !['hat', 'cloth', 'fullset'].includes(item.type) && !item.skill && item.category !== 'equipment';
            return item.type === this.selectedType;
        });
        if (this.selectedType === 'hat') result.unshift(NONE_HAT);
        if (this.selectedType === 'accessory') result.unshift(NONE_ACCESSORY);
        return result;
    }
    renderGrid() {
        this.grid.list.forEach(n => this.tweens.killTweensOf(n));
        this.grid.removeAll(true);
        const tabs = [['all', '全部'], ['hat', '頭部'], ['body', '服裝造型'], ['accessory', '能力飾品'], ['collection', '收藏'], ['fairy', '童話新裝']];
        tabs.forEach(([type, title], index) => this.button(this.grid, 467 + index * 126, 125, 119, 43, title, () => {
            this.selectedType = type; this.page = 0; this.armedId = null; this.previewId = null; this.render();
        }, this.selectedType === type ? C.green : 0xebe8dc, this.selectedType === type ? '#ffffff' : C.ink, `tab-${type}`));
        const ids = this.filtered(), pages = Math.max(1, Math.ceil(ids.length / 6));
        this.page = Math.min(this.page, pages - 1);
        const unread = this.registry.get('new_items') || [];
        ids.slice(this.page * 6, this.page * 6 + 6).forEach((id, i) => {
            const cx = 469 + (i % 3) * 251, cy = 184 + Math.floor(i / 3) * 126, x = -117, y = -57, item = this.item(id);
            const card = this.add.container(cx + 117, cy + 57); this.grid.add(card);
            const quality = ITEM_DB[id] ? Upgrade.appearance(this.registry, id) : { color: 0xb9b9ab };
            const active = this.isEquipped(id), selected = this.selectedId === id;
            const fill = active ? 0xe1efe1 : selected ? 0xf2ead9 : 0xf5f1e7;
            this.panel(card, x, y, 235, 114, fill, 14, active ? 0x3a9275 : selected ? 0xc89951 : quality.color, active ? 4 : 2);
            this.drawIcon(card, id, x + 51, y + 54, 76, 75);
            this.txt(card, x + 95, y + 34, item.name, 17, C.ink, true).setWordWrapWidth(130);
            if (active) {
                this.panel(card, x + 159, y + 5, 68, 23, 0x3a9275, 7);
                this.txt(card, x + 165, y + 7, '已裝備', 13, '#ffffff', true);
            }
            this.txt(card, x + 95, y + 79, active ? (this.canUnequip(id) ? '再點一下卸下' : '基礎造型') : '點一下裝備', 13, active ? '#337b60' : C.muted);
            if (unread.includes?.(id)) this.txt(card, x + 12, y + 5, 'NEW', 12, '#b35d43', true);
            const hit = this.add.rectangle(x + 117, y + 57, 235, 114, 0xffffff, .001)
                .setInteractive({ useHandCursor: true }).setName(`item-${id}`);
            card.add(hit);
            hit.on('pointerover', () => { if (this.modal) return; this.tweens.killTweensOf(card); this.tweens.add({targets:card,scale:1.035,duration:140,ease:'Sine.easeOut'}); });
            hit.on('pointerout', () => { this.tweens.killTweensOf(card); this.tweens.add({targets:card,scale:1,duration:140,ease:'Sine.easeOut'}); });
            hit.on('pointerdown', () => { if (!this.modal) this.selectItem(id); });
        });
        if (!ids.length) this.txt(this.grid, 850, 277, '這裡還空著，出發尋找新收藏吧！', 20, C.muted).setOrigin(.5);
        this.txt(this.grid, 473, 444, `${ids.length} 個選項 · 綠框＝已裝備 · 點一下穿卸`, 14, C.muted);
        this.button(this.grid, 1042, 432, 48, 39, '‹', () => { this.page = Math.max(0, this.page - 1); this.renderGrid(); }, 0xebe8dc, C.ink);
        this.txt(this.grid, 1138, 442, `${this.page + 1} / ${pages}`, 16, C.ink).setOrigin(.5, 0);
        this.button(this.grid, 1181, 432, 48, 39, '›', () => { this.page = Math.min(pages - 1, this.page + 1); this.renderGrid(); }, 0xebe8dc, C.ink);
    }
    selectItem(id) {
        if (this.modal || !this.item(id) || (ITEM_DB[id] && !this.owned().includes(id))) return false;
        const wasEquipped = this.isEquipped(id);
        this.selectedId = id; this.previewId = null; this.armedId = null;
        const unread = this.registry.get('new_items');
        if (Array.isArray(unread)) this.registry.set('new_items', unread.filter(x => x !== id));
        const changed = wasEquipped ? this.unequipItem(id, false) : this.equipItem(id, false);
        this.audio.unlock();
        if (this.audio.ctx?.state === 'suspended') this.audio.ctx.resume().then(() => { if (this.sys?.isActive()) this.audio.effect(changed ? 'equip' : 'click'); }).catch(() => {});
        else this.audio.effect(changed ? 'equip' : 'click');
        this.save(); this.render();
        if (changed) this.playWardrobeEffect(!wasEquipped);
        return changed;
    }
    clearWardrobeEffects() {
        for (const entry of this.dollPulses || []) {
            this.tweens.killTweensOf(entry.node);
            if (entry.node.active) entry.node.setScale(entry.x, entry.y);
        }
        this.dollPulses = [];
        if (this.wardrobeFx) {
            this.wardrobeFx.list.forEach(n => this.tweens.killTweensOf(n));
            this.tweens.killTweensOf(this.wardrobeFx);
            this.wardrobeFx.destroy(); this.wardrobeFx = null;
        }
    }
    playWardrobeEffect(equipping) {
        this.clearWardrobeEffects();
        const layout = PAPER_DOLL_LAYOUT.wardrobe;
        const fx = this.add.container(0, 0).setDepth(40); this.wardrobeFx = fx;
        const ring = this.add.graphics(); fx.add(ring);
        ring.lineStyle(4, equipping ? 0xf2ca74 : 0xb6daca, .9).strokeEllipse(0, 0, 168, 46);
        ring.setPosition(layout.centerX, layout.centerY + layout.maxHeight * .4);
        this.tweens.add({targets:ring,scaleX:1.5,scaleY:1.5,alpha:0,duration:600});
        for (let i=0;i<(equipping?12:6);i++) {
            const angle=i*Math.PI*2/(equipping?12:6), x=layout.centerX+Math.cos(angle)*75, y=layout.centerY+Math.sin(angle)*120;
            const star=this.txt(fx,x,y,'✦',18+i%3*5,equipping?'#e8bc5e':'#83bba8',true).setOrigin(.5);
            this.tweens.add({targets:star,x:x+Math.cos(angle)*38,y:y-45,alpha:0,scale:.4,duration:550+i*15});
        }
        this.dollPulses = this.mirror.list.filter(n => n.type === 'Image').map(node => ({node,x:node.scaleX,y:node.scaleY}));
        for(const e of this.dollPulses) this.tweens.add({targets:e.node,scaleX:e.x*1.035,scaleY:e.y*1.035,yoyo:true,duration:150,ease:'Sine.easeOut'});
        this.tweens.add({targets:fx,alpha:0,duration:180,delay:650,onComplete:()=>{if(this.wardrobeFx===fx){fx.destroy();this.wardrobeFx=null;}}});
    }
    drawClip(parent, x, y, size) {
        const g = this.add.graphics(); parent.add(g);
        g.fillStyle(0x8d6847).fillRoundedRect(x - size / 2, y - size * .15, size, size * .3, size * .15);
        g.fillStyle(0xe5bd72).fillRoundedRect(x - size / 2 + 2, y - size * .15 + 2, size - 4, size * .3 - 4, 5);
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5;
            g.fillStyle(0xfff4d7).fillCircle(x + Math.cos(a) * size * .11, y + Math.sin(a) * size * .11, size * .09);
        }
        g.fillStyle(0xe7a44b).fillCircle(x, y, size * .07);
        return g;
    }
    drawIcon(parent, id, x, y, maxW, maxH) {
        if (id === NONE_HAT || id === NONE_ACCESSORY) {
            const ring = this.add.graphics(); parent.add(ring);
            ring.lineStyle(5, 0xa5ad9f).strokeCircle(x, y, 24);
            ring.lineBetween(x - 17, y + 17, x + 17, y - 17);
            return ring;
        }
        if (id === CLIP) return this.drawClip(parent, x, y, maxW * .76);
        const key = ITEM_DB[id]?.icon || ITEM_DB[id]?.texture;
        if (!key || !this.textures.exists(key)) {
            return this.txt(parent, x, y, ITEM_DB[id]?.type === 'hat' ? '帽' : ITEM_DB[id]?.type === 'collectible' ? '飾' : '衣', 28, '#a38c65', true).setOrigin(.5);
        }
        const img = this.add.image(x, y, key); parent.add(img);
        img.setScale(Math.min(maxW / img.width, maxH / img.height)); return img;
    }
    qualityLine(id) {
        const item = ITEM_DB[id];
        if (item?.cosmeticOnly) return '童話外觀 · 能力預留，尚未啟用';
        if (!item) return '點一下套用；再次點擊可卸下。';
        const q = Upgrade.appearance(this.registry, id);
        if (q.baseKey === 'base') return '基礎造型 · 不屬於品質裝備';
        if (q.canUpgrade) return `${q.label}品質 · 再取得同款可升為${q.nextLabel}`;
        if (item.source === 'secret') return `${q.label}品質 · 特殊彩蛋裝備，不參與升階`;
        if (!q.max) return `${q.label}品質 · 最高品質，不參與升階`;
        return `${q.label}品質 · 已達升階上限，重複將轉成 1 水晶`;
    }
    abilityLines(item) {
        if (!item) return [];
        const labels = {
            rewardRate: v => `寶箱獎勵 +${v}%`, dropRate: v => `稀有掉落機率 +${v}%`,
            extraPlayCount: v => `每日額外遊玩 +${v} 次`, maxHearts: v => `體力上限 +${v}`,
            timeBonus: v => `關卡時間 +${v} 秒`, extraMistake: v => `容錯次數 +${v}`,
            revealHint: v => `開局提示 +${v} 次`, noHeartCost: () => '進入關卡不消耗體力',
            ignoreReputationLock: () => '不受聲望門檻限制', freeMinigameEntry: () => '小遊戲入場不消耗體力',
            freeStageEntry: () => '關卡入場不消耗體力', reviveOnce: () => '每局可復活一次'
        };
        const result = Object.entries(item.effects || {}).filter(([, value]) => value !== 0 && value !== false)
            .map(([key, value]) => labels[key] ? labels[key](value) : `${key}：${value}`);
        if (item.skill?.type === 'scout') result.push(`偵查：每局探索 ${item.skill.usesPerRun || 1} 格`);
        return result;
    }
    renderDetails() {
        this.details.removeAll(true);
        this.panel(this.details, 467, 485, 762, 153, 0xeee9da, 16);
        const id = this.selectedId, item = this.item(id);
        if (!item) { this.txt(this.details, 491, 511, '點一下裝備，再點一下卸下。', 19); return; }
        this.txt(this.details, 490, 501, item.name, 23, C.ink, true);
        this.txt(this.details, 490, 537, this.qualityLine(id), 15, '#76674f');
        this.txt(this.details, 490, 565, (item.desc || '森林裡的小小收藏。').split('\n')[0], 14, C.muted).setWordWrapWidth(700);
        const abilities = this.abilityLines(item);
        const abilityText = abilities.length ? `能力：${abilities.join('　')}` : '能力：純外觀造型，沒有額外能力';
        this.txt(this.details, 490, 597, abilityText, 14, abilities.length ? '#557b60' : C.muted, abilities.length).setWordWrapWidth(700);
        const actionText = this.isEquipped(id)
            ? (this.canUnequip(id)
                ? '✓ 已裝備 · 點一下卸下'
                : '✓ 基礎服裝')
            : '點一下裝備';
        this.txt(this.details, 1188, 505, actionText, 14, '#557b60', true).setOrigin(1, 0);
    }
    renderDoll() {
        this.mirror.removeAll(true);
        const layout = PAPER_DOLL_LAYOUT.wardrobe;
        const look = currentLook(this.registry, this.previewId);
        const key = this.textures.exists(look.bodyTexture) ? look.bodyTexture : 'wardrobe_doll_daily_v50';
        if (this.textures.exists(key)) {
            const doll = this.add.image(layout.centerX, layout.centerY, key); this.mirror.add(doll);
            fitImage(doll, layout.maxWidth, layout.maxHeight);
        } else this.txt(this.mirror, 225, 365, '公仔素材載入失敗\n請檢查 assets/wardrobe_v50', 16, '#975b4b').setOrigin(.5);
        const left = layout.centerX - layout.maxWidth / 2;
        const top = layout.centerY - layout.maxHeight / 2;
        const clipX = left + layout.maxWidth * layout.hatAnchorX;
        const headY = top + layout.maxHeight * 0.2;
        if (!look.hatSuppressed && look.hatId === CLIP) {
            this.drawClip(this.mirror, clipX, headY, 33);
        } else if (look.hatTexture && this.textures.exists(look.hatTexture)) {
            const hat = this.add.image(layout.centerX, layout.centerY, look.hatTexture); this.mirror.add(hat);
            fitImage(hat, layout.maxWidth, layout.maxHeight);
        }
        const fallback = !look.bodyIsConverted;
        const bodyItem = ITEM_DB[look.bodyId];
        const label = fallback ? `${bodyItem?.name || '此造型'}待統一繪製，暫顯示日常公仔` : (bodyItem?.name || '日常休閒裝');
        this.txt(this.mirror, 225, 606, label, 16, fallback ? '#977255' : C.ink).setOrigin(.5);
        const hint = this.previewId ? '預覽中 · 再點同一張卡才會穿戴' : '目前正式穿戴造型';
        this.txt(this.mirror, 225, 630, hint, 12, this.previewId ? '#9a6f32' : C.muted).setOrigin(.5);
    }
    equipItem(id, render = true) {
        let changed = false;
        if (id === NONE_HAT) {
            changed = this.registry.get('equipped_hat') !== 'none';
            this.registry.set('equipped_hat', 'none');
        } else if (id === NONE_ACCESSORY) {
            changed = this.registry.get('equipped_collectible') !== 'none';
            this.registry.set('equipped_collectible', 'none');
        } else {
            const item = ITEM_DB[id];
            if (!item || !this.owned().includes(id) || !['hat', 'cloth', 'fullset', 'collectible'].includes(item.type)) return false;
            const key = `equipped_${item.type}`;
            changed = this.registry.get(key) !== id;
            this.registry.set(key, id);
            if (item.type === 'cloth') this.registry.set('equipped_fullset', 'none');
            if (item.type === 'fullset') this.registry.set('equipped_cloth', 'none');
        }
        EquipmentSystem.applyBonusToRegistry(this.registry);
        if (render) { this.save(); this.audio.effect(changed ? 'equip' : 'click'); this.render(); }
        return changed;
    }
    unequipItem(id, render = true) {
        if (!this.canUnequip(id)) return false;
        const item = ITEM_DB[id];
        if (item.type === 'hat') this.registry.set('equipped_hat', 'none');
        else if (item.type === 'collectible') this.registry.set('equipped_collectible', 'none');
        else {
            // 身體不能呈現裸體；脫下造型時自動換回基礎休閒裝。
            this.registry.set('equipped_fullset', 'none');
            this.registry.set('equipped_cloth', 'item_cloth_daily_01');
        }
        EquipmentSystem.applyBonusToRegistry(this.registry);
        if (render) { this.save(); this.audio.effect('equip'); this.render(); }
        return true;
    }
    openModal(title, body) {
        if (this.modal) return null;
        const modal = this.add.container(0, 0).setDepth(1000); this.modal = modal;
        const shade = this.add.rectangle(640, 360, 1280, 720, 0x25382e, .62).setInteractive(); modal.add(shade);
        this.panel(modal, 345, 166, 590, 390, C.cream, 24, 0xd6ba88);
        this.txt(modal, 640, 202, title, 27, C.ink, true).setOrigin(.5, 0);
        this.txt(modal, 385, 258, body, 18, C.ink).setWordWrapWidth(510);
        this.button(modal, 515, 486, 250, 46, '知道了', () => this.closeModal(), C.green, '#fff', 'modal-close');
        return modal;
    }
    closeModal() { if (this.modal) { this.modal.destroy(true); this.modal = null; } }
    openTests() {
        const item = ITEM_DB[this.selectedId], canGrant = item && item.source !== 'secret' && Upgrade.limit(item) > 0;
        const modal = this.openModal('測試送裝備', '測試會改變目前存檔。\n左側依正式規則取得目前裝備；右側一次補齊全部道具。\n補齊全道具不升階、不轉水晶，也不改變目前穿戴。');
        if (!modal) return;
        if (canGrant) this.button(modal, 385, 367, 250, 48, '取得目前選取裝備', () => {
            const id = this.selectedId; this.closeModal(); this.grantItem(id);
        }, C.green, '#fff', 'grant-selected');
        this.button(modal, 653, 367, 245, 48, '獲得全道具（測試用）', () => {
            this.closeModal(); this.grantAllTestItems();
        }, 0xb48258, '#fff', 'grant-all-items');
        this.txt(modal, 390, 432, '全道具：只補未擁有項目，包含彩蛋與收藏。', 17, '#876b44');
    }
    grantAllTestItems() {
        const added = grantAllItemsForTesting(this.registry, ITEM_DB);
        this.save(); this.render(); this.audio.effect('equip');
        const body = added.length
            ? `已補齊 ${added.length} 件尚未擁有的道具。\n原有裝備品質、水晶與目前穿戴都沒有改變。`
            : '目前版本的全部道具都已經擁有。\n原有裝備品質、水晶與目前穿戴都沒有改變。';
        this.openModal('全道具已補齊', body);
        return added;
    }
    grantItem(id, secret = false) {
        if (!ITEM_DB[id] || (ITEM_DB[id].source === 'secret' && !secret)) return null;
        const result = EquipmentSystem.giveItem(this.registry, id);
        if (!result.success) return result;
        this.save(); this.render(); this.audio.effect(result.isUpgrade ? 'upgrade' : 'equip');
        const q = Upgrade.appearance(this.registry, id);
        const title = result.isUpgrade ? '同款合併，品質提升！' : result.type === 'crystal' ? '已達上限，轉成水晶' : '找到新的收藏！';
        const body = result.type === 'crystal'
            ? `${ITEM_DB[id].name}\n水晶 +1；原裝備與目前品質保留。`
            : `${ITEM_DB[id].name}\n${q.label}品質；圖示與裝備名稱維持不變。`;
        const modal = this.openModal(title, body);
        if (modal) {
            const left = this.add.container(490, 403), right = this.add.container(790, 403); modal.add([left, right]);
            this.drawIcon(left, id, 0, 0, 72, 79); this.drawIcon(right, id, 0, 0, 72, 79);
            if (result.isUpgrade) this.tweens.add({ targets: [left, right], x: 640, duration: 480, ease: 'Sine.easeInOut', onComplete: () => { if (right.active) right.setVisible(false); } });
            else { right.setVisible(false); left.setX(640); }
        }
        return result;
    }
    checkMotherGuardReward() {
        const state = this.registry.get('secret_state') || {};
        if (!state.motherGuardPendingReward) return;
        this.registry.set('secret_state', { ...state, motherGuardUnlocked: true, motherGuardPendingReward: false, motherGuardSequence: [], motherGuardSequenceStartTime: 0 });
        if (!this.owned().includes(SECRET)) { this.closeModal(); this.grantItem(SECRET, true); }
        this.save();
    }
}
