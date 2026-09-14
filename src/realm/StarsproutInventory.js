export const STARSPROUT_INVENTORY_SAVE = 'forest_starsprout_inventory_v1';

export const ITEM_CATALOG = Object.freeze({
  '魔法劍': { icon: '✦', type: 'equipment', slot: 'weapon', rarity: 'uncommon', level: 1, description: 'SP 0｜星光棒凝聚藍色魔力劍，從上往前劈下。攻擊動作結束前無法移動或格擋。' },
  '微光星芽珠': { icon: '🔮', type: 'bead', rarity: 'uncommon', level: 4, description: '生命 +80，脫戰後持續恢復生命。' },
  '橡果迅捷珠': { icon: '💎', type: 'bead', rarity: 'rare', level: 3, description: '移速 +5%，擴大掉落物磁吸範圍。' },
  '輕羽漂浮珠': { icon: '🪽', type: 'bead', rarity: 'rare', level: 3, description: '墜落緩衝，跳躍高度 +10%。' },
  '露珠回響珠': { icon: '🫧', type: 'bead', rarity: 'rare', level: 6, description: '瀕死受擊時觸發消彈微風。' },
  '綠指採集珠': { icon: '🌿', type: 'bead', rarity: 'rare', level: 5, description: '草藥雙倍採集機率 +10%。' },
  '蜜糖貪食珠': { icon: '🍯', type: 'bead', rarity: 'epic', level: 8, description: '金幣掉落 +15%，食物回復 +20%。' },
  '甜蘋果': { icon: '🍎', type: 'consumable', rarity: 'common', level: 1, description: '香甜的新手料理，可恢復少量生命。' },
  '清涼薄荷水': { icon: '🧃', type: 'consumable', rarity: 'uncommon', level: 8, description: '溪谷旅行常備的清涼飲品。' },
  '微光燃油': { icon: '🪔', type: 'consumable', rarity: 'uncommon', level: 10, description: '可點亮隨身提燈並驅散夜間薄霧。' },
  '蓬鬆絨毛': { icon: '🧶', type: 'material', rarity: 'common', level: 1, description: '柔軟的基礎素材，可用於布織裝備。' },
  '香脆橡果': { icon: '🌰', type: 'material', rarity: 'quest', level: 1, description: '波波鼠喜愛的食物，也是任務與料理素材。' },
  '鵝黃羽毛': { icon: '🪶', type: 'material', rarity: 'common', level: 2, description: '輕盈的淡黃色羽毛。' },
  '微光種子': { icon: '✨', type: 'material', rarity: 'common', level: 2, description: '會在掌心發出微弱晨光。' },
  '晨曦露水': { icon: '💧', type: 'material', rarity: 'common', level: 4, description: '水窪精靈留下的清澈露水。' },
  '純淨星芽膠': { icon: '🫧', type: 'material', rarity: 'quest', level: 4, description: '菲比拋光靈珠需要的任務素材。' },
  '肥沃泥土': { icon: '🟤', type: 'material', rarity: 'common', level: 4, description: '園藝鼴鼠翻出的肥沃土壤。' },
  '嫩草根': { icon: '🌱', type: 'material', rarity: 'common', level: 4, description: '可用於生活製作與藥草配方。' },
  '金彩紙糖果袋': { icon: '🍬', type: 'material', rarity: 'rare', level: 8, description: '南瓜兔收藏的亮晶晶糖果袋。' },
  '手繪布偶飾品': { icon: '🧸', type: 'material', rarity: 'rare', level: 8, description: '稀有菁英紀念素材。' },
  '銀幣袋': { icon: '🪙', type: 'material', rarity: 'common', level: 1, description: '裝著冒險旅費的小布袋。' },
  '星光微風種子': { icon: '🌟', type: 'material', rarity: 'rare', level: 8, description: '蒲公英大遷徙期間出現的稀有種子。' }
});

export const RARITY_ORDER = Object.freeze({ legendary: 6, epic: 5, rare: 4, uncommon: 3, quest: 2, common: 1 });
export const TYPE_LABELS = Object.freeze({ all: '全部', equipment: '武器', bead: '靈珠', consumable: '消耗', material: '素材／任務' });
export const STARSPROUT_QUICK_ITEMS = Object.freeze(['香脆橡果', '純淨星芽膠', '晨曦露水']);

const RETIRED_EQUIPMENT = new Set(['橡果小木蓋', '星芽旅行者套裝', '草莓棉拖鞋', '幼鹿織花角圈']);

function cleanItems(items) {
  const result = {};
  for (const [name, value] of Object.entries(items && typeof items === 'object' ? items : {})) {
    if (RETIRED_EQUIPMENT.has(name) || name === '星光吹泡泡棒') continue;
    const count = Math.max(0, Math.min(99, Math.floor(Number(value) || 0)));
    if (count) result[name] = ITEM_CATALOG[name]?.type === 'equipment' || ITEM_CATALOG[name]?.type === 'bead' ? Math.min(count, 99) : count;
  }
  return result;
}

export function defaultStarsproutInventory() {
  return {
    v: 1, capacity: 24, maxCapacity: 60, gold: 0,
    items: { '魔法劍': 1 },
    equipped: { weapon: '魔法劍' }, retiredEquipment: {},
    beads: ['', '', ''], unlockedBeadSlots: 1
  };
}

export function normalizeStarsproutInventory(value) {
  const base = defaultStarsproutInventory();
  if (!value || value.v !== 1) return base;
  const capacity = Math.max(24, Math.min(60, Math.floor(Number(value.capacity) / 6) * 6 || 24));
  const items = { ...base.items, ...cleanItems(value.items) };
  const equipped = { ...base.equipped };
  for (const [slot, name] of Object.entries(value.equipped || {})) if (slot === 'weapon' && name === '魔法劍' && items[name]) equipped[slot] = name;
  const unlockedBeadSlots = Math.max(1, Math.min(3, Math.floor(Number(value.unlockedBeadSlots) || 1)));
  const beads = [0, 1, 2].map((index) => index < unlockedBeadSlots && items[value.beads?.[index]] && ITEM_CATALOG[value.beads[index]]?.type === 'bead' ? value.beads[index] : '');
  const retiredEquipment = { ...(value.retiredEquipment || {}) };
  for (const name of RETIRED_EQUIPMENT) if (Number(value.items?.[name]) > 0) retiredEquipment[name] = value.items[name];
  items['魔法劍'] = 1;
  return { v: 1, retiredEquipment, capacity, maxCapacity: 60, gold: Math.max(0, Math.floor(Number(value.gold) || 0)), items, equipped, beads, unlockedBeadSlots };
}

export function loadStarsproutInventory() {
  try { return normalizeStarsproutInventory(JSON.parse(localStorage.getItem(STARSPROUT_INVENTORY_SAVE) || 'null')); }
  catch { return defaultStarsproutInventory(); }
}

export function saveStarsproutInventory(state) {
  const safe = normalizeStarsproutInventory(state);
  localStorage.setItem(STARSPROUT_INVENTORY_SAVE, JSON.stringify(safe));
  return safe;
}

export function mergeStarsproutItems(state, incoming) {
  const safe = normalizeStarsproutInventory(state);
  for (const [name, count] of Object.entries(cleanItems(incoming))) safe.items[name] = Math.max(safe.items[name] || 0, count);
  return safe;
}

export function sortedStarsproutItems(state, filter = 'all') {
  const safe = normalizeStarsproutInventory(state);
  return Object.entries(safe.items).filter(([, count]) => count > 0).map(([name, count]) => ({ name, count, ...(ITEM_CATALOG[name] || { icon: '🎒', type: 'material', rarity: 'common', level: 1, description: '在星芽谷旅途中取得的物品。' }) }))
    .filter((item) => filter === 'all' || item.type === filter)
    .sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || a.type.localeCompare(b.type) || b.level - a.level || a.name.localeCompare(b.name, 'zh-Hant'));
}

export function occupiedSlots(state) {
  return Object.entries(normalizeStarsproutInventory(state).items).reduce((sum, [name, count]) => sum + (['equipment', 'bead'].includes(ITEM_CATALOG[name]?.type) ? count : 1), 0);
}

const ITEM_ART = Object.freeze({
  '魔法劍':'magic-sword', '魔法箭':'magic-arrow', '香脆橡果':'acorn', '蓬鬆絨毛':'fluff',
  '純淨星芽膠':'sprout-gel', '鵝黃羽毛':'feather', '微光種子':'seed', '晨曦露水':'dew',
  '肥沃泥土':'soil', '嫩草根':'roots', '甜蘋果':'apple', '清涼薄荷水':'mint', '微光燃油':'oil',
  '金彩紙糖果袋':'candy', '手繪布偶飾品':'doll', '銀幣袋':'coins', '星光微風種子':'breeze-seed',
  '微光星芽珠':'sprout-orb', '橡果迅捷珠':'acorn-orb', '輕羽漂浮珠':'feather-orb',
  '露珠回響珠':'echo-orb', '綠指採集珠':'leaf-orb', '蜜糖貪食珠':'honey-orb', '晨曦蒲公英':'dandelion'
});
export function itemArtURL(name) {
  return new URL(`../../assets/phantom-realm/items-v317/${ITEM_ART[name] || 'parcel'}.webp`, import.meta.url).href;
}
export function appendItemArt(parent, name, className = 'item-art') {
  const image = document.createElement('img'); image.src = itemArtURL(name); image.alt = name;
  image.className = className; image.draggable = false; parent.append(image); return image;
}
