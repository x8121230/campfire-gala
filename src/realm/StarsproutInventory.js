export const STARSPROUT_INVENTORY_SAVE = 'forest_starsprout_inventory_v1';

export const ITEM_CATALOG = Object.freeze({
  '星光吹泡泡棒': { icon: '🪄', type: 'equipment', slot: 'weapon', rarity: 'uncommon', level: 1, description: '黃銅星形的童話手杖，可凝聚魔法斬與遠距水泡。' },
  '橡果小木蓋': { icon: '🛡️', type: 'equipment', slot: 'shield', rarity: 'uncommon', level: 1, description: '輕巧的橡果木盾，格擋時會發出清脆咚聲。' },
  '星芽旅行者套裝': { icon: '🥻', type: 'equipment', slot: 'outfit', rarity: 'uncommon', level: 1, description: '布隆克縫製的莓紅斗篷與星芽背帶裝。' },
  '草莓棉拖鞋': { icon: '👟', type: 'equipment', slot: 'boots', rarity: 'uncommon', level: 1, description: '走過水窪會發出啪嘰聲的柔軟冒險鞋。' },
  '幼鹿織花角圈': { icon: '🌸', type: 'equipment', slot: 'hat', rarity: 'epic', level: 12, description: '七彩神鹿首領戰的紀念頭飾。' },
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
export const TYPE_LABELS = Object.freeze({ all: '全部', equipment: '裝備／服飾', bead: '靈珠寶盒', consumable: '冒險消耗', material: '素材／任務' });
export const STARSPROUT_QUICK_ITEMS = Object.freeze(['香脆橡果', '純淨星芽膠', '晨曦露水']);

function cleanItems(items) {
  const result = {};
  for (const [name, value] of Object.entries(items && typeof items === 'object' ? items : {})) {
    const count = Math.max(0, Math.min(99, Math.floor(Number(value) || 0)));
    if (count) result[name] = ITEM_CATALOG[name]?.type === 'equipment' || ITEM_CATALOG[name]?.type === 'bead' ? Math.min(count, 99) : count;
  }
  return result;
}

export function defaultStarsproutInventory() {
  return {
    v: 1, capacity: 24, maxCapacity: 60, gold: 0,
    items: { '星光吹泡泡棒': 1, '橡果小木蓋': 1, '草莓棉拖鞋': 1 },
    equipped: { weapon: '星光吹泡泡棒', shield: '橡果小木蓋', hat: '', outfit: '', boots: '草莓棉拖鞋' },
    beads: ['', '', ''], unlockedBeadSlots: 1
  };
}

export function normalizeStarsproutInventory(value) {
  const base = defaultStarsproutInventory();
  if (!value || value.v !== 1) return base;
  const capacity = Math.max(24, Math.min(60, Math.floor(Number(value.capacity) / 6) * 6 || 24));
  const items = { ...base.items, ...cleanItems(value.items) };
  const equipped = { ...base.equipped };
  for (const [slot, name] of Object.entries(value.equipped || {})) if (!name || (items[name] && ITEM_CATALOG[name]?.slot === slot)) equipped[slot] = name;
  const unlockedBeadSlots = Math.max(1, Math.min(3, Math.floor(Number(value.unlockedBeadSlots) || 1)));
  const beads = [0, 1, 2].map((index) => index < unlockedBeadSlots && items[value.beads?.[index]] && ITEM_CATALOG[value.beads[index]]?.type === 'bead' ? value.beads[index] : '');
  return { v: 1, capacity, maxCapacity: 60, gold: Math.max(0, Math.floor(Number(value.gold) || 0)), items, equipped, beads, unlockedBeadSlots };
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
