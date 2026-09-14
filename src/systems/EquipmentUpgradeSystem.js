import { ITEM_DB } from '../data/GameData.js';

// v4.2: no white equipment. Base looks have no quality; normal equipment upgrades once.
const QUALITY_ORDER = ['good', 'rare', 'epic', 'legendary', 'dream'];
const QUALITY = {
    base: { label: '基礎造型', color: null },
    good: { label: '優良', color: 0x63b987 },
    rare: { label: '稀有', color: 0x65a9e4 },
    epic: { label: '史詩', color: 0xa984db },
    legendary: { label: '傳說', color: 0xe3b942 },
    dream: { label: '夢幻', color: 0xc57dea }
};

export default class EquipmentUpgradeSystem {
    static baseQuality(item) {
        const rarity = item?.rarity;
        if (rarity === 'common' || rarity === 'uncommon') return 'good';
        if (rarity === 'stage') return 'rare';
        if (['myth', 'legend'].includes(rarity)) return 'legendary';
        return QUALITY[rarity] ? rarity : 'good';
    }

    static limit(item) {
        if (!item || item.source === 'secret') return 0;
        if (item.category !== 'equipment') return 0;
        const quality = this.baseQuality(item);
        return ['base', 'legendary', 'dream'].includes(quality) ? 0 : 1;
    }

    static step(registry, id) {
        const value = registry.get('equipment_upgrades')?.[id];
        return Math.min(this.limit(ITEM_DB[id]), Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0));
    }

    static appearance(registry, id) {
        const item = ITEM_DB[id] || {};
        const baseKey = this.baseQuality(item);
        const step = this.step(registry, id);
        const index = QUALITY_ORDER.indexOf(baseKey);
        const currentKey = index < 0 ? baseKey : QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 1, index + step)];
        const data = QUALITY[currentKey] || QUALITY.good;
        const max = this.limit(item);
        const nextKey = step < max ? QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 1, index + step + 1)] : null;
        return { baseKey, currentKey, step, max, label: data.label, color: data.color,
            nextKey, nextLabel: nextKey ? QUALITY[nextKey]?.label : null, canUpgrade: step < max };
    }

    static normalizeRegistry(registry) {
        const upgrades = registry.get('equipment_upgrades');
        if (!upgrades || typeof upgrades !== 'object') return false;
        const normalized = {};
        let changed = false;
        Object.entries(upgrades).forEach(([id, value]) => {
            const step = Math.min(this.limit(ITEM_DB[id]), Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0));
            normalized[id] = step;
            if (step !== value) changed = true;
        });
        if (changed) registry.set('equipment_upgrades', normalized);
        return changed;
    }

    static receive(registry, id) {
        const item = ITEM_DB[id];
        if (!item) return { success: false, type: 'error', itemKey: id, itemData: null };
        const field = item.type === 'collectible' ? 'owned_collectibles' : 'owned_items';
        const owned = Array.isArray(registry.get(field)) ? registry.get(field) : [];
        const a = registry.get('owned_items'), b = registry.get('owned_collectibles');
        const all = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
        const result = { success: true, itemKey: id, itemData: item, amount: 0, isNew: false, isDuplicate: all.includes(id) };
        if (!result.isDuplicate) {
            registry.set(field, [...owned, id]);
            registry.set('equipment_upgrades', { ...(registry.get('equipment_upgrades') || {}), [id]: 0 });
            const unread = Array.isArray(registry.get('new_items')) ? registry.get('new_items') : [];
            registry.set('new_items', [...new Set([...unread, id])]);
            return { ...result, type: 'item', isNew: true, upgradeStep: 0 };
        }
        const before = this.step(registry, id);
        if (before < this.limit(item)) {
            registry.set('equipment_upgrades', { ...(registry.get('equipment_upgrades') || {}), [id]: before + 1 });
            return { ...result, type: 'item', isUpgrade: true, previousStep: before, upgradeStep: before + 1 };
        }
        const crystals = registry.get('user_crystals');
        registry.set('user_crystals', (Number.isFinite(crystals) ? crystals : 0) + 1);
        return { ...result, type: 'crystal', amount: 1, upgradeStep: before };
    }
}
