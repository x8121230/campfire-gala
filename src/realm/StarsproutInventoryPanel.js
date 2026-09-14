import { ITEM_CATALOG, TYPE_LABELS, normalizeStarsproutInventory, occupiedSlots, sortedStarsproutItems } from './StarsproutInventory.js';

const HERO = '../../assets/phantom-realm/hero-achenchen/hero-down.png';
const SLOT_NAMES = Object.freeze({ hat: '頭飾', weapon: '手杖', shield: '盾牌', outfit: '服裝', boots: '短靴' });

export class StarsproutInventoryPanel {
  constructor(host, { state, onChange = () => {}, onClose = () => {}, onNotice = () => {} } = {}) {
    this.host = host; this.state = normalizeStarsproutInventory(state); this.onChange = onChange; this.onClose = onClose; this.onNotice = onNotice; this.filter = 'all'; this.selected = '';
    this.build(); this.render();
  }

  el(tag, cls = '', text = '', parent = this.overlay || this.host) { const node = document.createElement(tag); node.className = cls; if (text) node.textContent = text; parent.append(node); return node; }
  button(text, fn, parent, cls = '') { const node = this.el('button', cls, text, parent); node.type = 'button'; node.addEventListener('click', fn); return node; }

  build() {
    this.style = this.el('style'); this.style.textContent = `
      .sprout-inv{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:16px;background:#173c35b8;backdrop-filter:blur(5px);font-family:"Microsoft JhengHei",sans-serif;color:#4a3824}
      .sprout-inv *{box-sizing:border-box}.sprout-book{position:relative;width:min(1120px,97vw);height:min(690px,94vh);display:grid;grid-template-columns:42% 58%;overflow:hidden;border:4px solid #7e512c;border-radius:28px;background:linear-gradient(90deg,#f5dfad 0 41.7%,#ead09a 42%,#fff0c8 43%,#f7e4b5 100%);box-shadow:0 22px 90px #102d28aa,inset 0 0 45px #9f713733}
      .sprout-book:before{content:"";position:absolute;inset:9px;border:2px dashed #ad7540;border-radius:20px;pointer-events:none}.sprout-left,.sprout-right{position:relative;padding:24px 27px;min-width:0}.sprout-left{border-right:4px double #a8733d}.sprout-title{margin:0 0 10px;text-align:center;font:900 27px Georgia,"Microsoft JhengHei";color:#604328}.sprout-close{position:absolute;z-index:3;right:18px;top:14px;width:43px;height:43px;border:2px solid #8b5c31;border-radius:50%;background:#fff1c8;color:#704823;font-size:24px;cursor:pointer}
      .sprout-doll{position:relative;height:375px;margin:3px auto 8px}.sprout-hero{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);height:315px;max-width:60%;object-fit:contain;filter:drop-shadow(0 10px 7px #5c432955)}.sprout-equip{position:absolute;width:104px;min-height:54px;padding:5px;border:2px solid #b48650;border-radius:15px;background:#fff6d7e8;color:#604328;font-weight:800;font-size:12px;text-align:center}.sprout-equip b{display:block;font-size:22px}.sprout-equip.hat{top:10px;left:50%;transform:translateX(-50%)}.sprout-equip.weapon{left:2px;top:135px}.sprout-equip.shield{right:2px;top:135px}.sprout-equip.outfit{left:8px;bottom:38px}.sprout-equip.boots{right:8px;bottom:38px}
      .sprout-beads{display:flex;gap:12px;justify-content:center}.sprout-bead{width:82px;height:82px;border:3px solid #b58752;border-radius:50%;background:#fff4d1;color:#604328;font-size:12px;font-weight:800}.sprout-bead b{display:block;font-size:27px}.sprout-bead.locked{filter:grayscale(1);opacity:.58}.sprout-bead.filled{box-shadow:0 0 18px #79bfff}
      .sprout-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 48px 12px 0}.sprout-tabs button,.sprout-tools button{border:2px solid #a87943;border-radius:12px;background:#f6e1ad;color:#654427;padding:8px 11px;font-weight:800;cursor:pointer}.sprout-tabs button.active{background:#795a32;color:#fff4d1}.sprout-grid{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:93px;gap:7px;height:400px;overflow-y:auto;padding-right:4px}.sprout-slot{position:relative;min-width:0;border:3px solid #c8b38e;border-radius:13px;background:linear-gradient(#fff9e8,#ead9b6);color:#523b26;box-shadow:inset 0 -5px 11px #9d784a22;cursor:pointer}.sprout-slot .ico{display:block;font-size:31px;line-height:35px}.sprout-slot .name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:800}.sprout-slot .qty{position:absolute;right:5px;bottom:3px;padding:1px 4px;border-radius:7px;background:#4a3824d9;color:#fff;font-size:10px}.sprout-slot.empty{opacity:.48;cursor:default}.sprout-slot.common{border-color:#d5d1c6}.sprout-slot.quest{border-color:#e7b841;box-shadow:0 0 9px #ffd75d}.sprout-slot.uncommon{border-color:#65c899}.sprout-slot.rare{border-color:#64aef1;box-shadow:0 0 10px #6bc5ff88}.sprout-slot.epic{border-color:#aa72e9;box-shadow:0 0 12px #bd80ff}.sprout-slot.legendary{border-color:#e5a928;box-shadow:0 0 13px #ffd458}.sprout-slot.selected{outline:4px solid #fff;transform:translateY(-2px)}
      .sprout-detail{height:62px;margin-top:10px;padding:8px 12px;border-radius:12px;background:#e5c98d88;font-size:12px;line-height:1.45}.sprout-footer{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-top:9px;font-weight:800}.sprout-tools{display:flex;gap:7px}.sprout-tools button:disabled{opacity:.45}.sprout-cap{white-space:nowrap}
      @media(max-height:560px){.sprout-book{height:96vh}.sprout-left,.sprout-right{padding:12px 18px}.sprout-title{font-size:20px}.sprout-doll{height:245px}.sprout-hero{height:220px}.sprout-equip{width:82px;min-height:44px;font-size:9px}.sprout-equip b{font-size:17px}.sprout-equip.weapon,.sprout-equip.shield{top:90px}.sprout-grid{height:285px}.sprout-slot .ico{font-size:23px;line-height:27px}.sprout-bead{width:58px;height:58px}.sprout-bead b{font-size:19px}.sprout-detail{height:45px;padding:5px 9px;font-size:10px}.sprout-footer{font-size:11px}.sprout-tabs button,.sprout-tools button{padding:5px 7px;font-size:10px}}
    `;
    this.overlay = this.el('div', 'sprout-inv', '', this.host); this.book = this.el('div', 'sprout-book'); this.button('×', () => this.close(), this.book, 'sprout-close');
    const left = this.el('section', 'sprout-left', '', this.book); this.el('h2', 'sprout-title', '小勇者紙娃娃', left); this.doll = this.el('div', 'sprout-doll', '', left);
    const hero = this.el('img', 'sprout-hero', '', this.doll); hero.src = new URL(HERO, import.meta.url).href; hero.alt = '勇者阿晨晨目前穿搭';
    this.equipNodes = {}; for (const slot of ['hat', 'weapon', 'shield', 'outfit', 'boots']) { const node = this.button('', () => this.unequip(slot), this.doll, `sprout-equip ${slot}`); node.dataset.slot = slot; this.equipNodes[slot] = node; }
    this.el('h3', 'sprout-title', '◎ 靈珠插槽', left); this.beads = this.el('div', 'sprout-beads', '', left);
    const right = this.el('section', 'sprout-right', '', this.book); this.el('h2', 'sprout-title', '手繪皮扣探險包', right); const tabs = this.el('div', 'sprout-tabs', '', right); this.tabButtons = {};
    for (const [type, label] of Object.entries(TYPE_LABELS)) this.tabButtons[type] = this.button(label, () => { this.filter = type; this.render(); }, tabs);
    this.grid = this.el('div', 'sprout-grid', '', right); this.detail = this.el('div', 'sprout-detail', '點選物品查看故事與用途。', right); const footer = this.el('div', 'sprout-footer', '', right); this.capacity = this.el('div', 'sprout-cap', '', footer); const tools = this.el('div', 'sprout-tools', '', footer);
    this.button('整理', () => { this.selected = ''; this.render(); this.onNotice('已依品質、類型與等級整理。'); }, tools); const dismantle = this.button('批量分解', () => {}, tools); dismantle.disabled = true; dismantle.title = '完成裝備詞條系統後開放';
  }

  render() {
    this.state = normalizeStarsproutInventory(this.state);
    for (const [slot, node] of Object.entries(this.equipNodes)) { const name = this.state.equipped[slot]; const item = ITEM_CATALOG[name]; node.innerHTML = `<b>${item?.icon || '＋'}</b>${SLOT_NAMES[slot]}${name ? `<br>${name}` : ''}`; }
    this.beads.replaceChildren();
    for (let index = 0; index < 3; index += 1) { const unlocked = index < this.state.unlockedBeadSlots, name = this.state.beads[index], item = ITEM_CATALOG[name]; const node = this.button('', () => this.unequipBead(index), this.beads, `sprout-bead ${unlocked ? '' : 'locked'} ${name ? 'filled' : ''}`); node.innerHTML = unlocked ? `<b>${item?.icon || '◇'}</b>${name || `空槽 ${index + 1}`}` : '<b>🔒</b>尚未解鎖'; node.addEventListener('dragover', (event) => { if (unlocked) event.preventDefault(); }); node.addEventListener('drop', (event) => { event.preventDefault(); this.equip(event.dataTransfer.getData('text/plain'), index); }); }
    for (const [type, button] of Object.entries(this.tabButtons)) button.classList.toggle('active', type === this.filter);
    const items = sortedStarsproutItems(this.state, this.filter); this.grid.replaceChildren();
    for (let index = 0; index < this.state.capacity; index += 1) { const item = items[index]; if (!item) { this.el('div', 'sprout-slot empty', '', this.grid); continue; } const node = this.button('', () => this.select(item.name), this.grid, `sprout-slot ${item.rarity} ${this.selected === item.name ? 'selected' : ''}`); node.draggable = item.type === 'equipment' || item.type === 'bead'; node.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', item.name)); node.innerHTML = `<span class="ico">${item.icon}</span><span class="name">${item.name}</span><span class="qty">${item.count}</span>`; }
    this.capacity.textContent = `容量：${occupiedSlots(this.state)}/${this.state.capacity}　💰 金幣：${this.state.gold.toLocaleString('zh-TW')}`;
    if (this.selected) { const item = ITEM_CATALOG[this.selected]; this.detail.textContent = `${item?.icon || '🎒'} ${this.selected}｜${item?.description || '星芽谷的冒險物品。'}${item?.type === 'bead' ? '（點一下或拖到左側圓槽即可裝備）' : item?.type === 'equipment' ? '（點一下即可穿戴）' : ''}`; }
  }

  select(name) { this.selected = name; const item = ITEM_CATALOG[name]; if (item?.type === 'equipment' || item?.type === 'bead') this.equip(name); else this.render(); }
  equip(name, requestedIndex = -1) { const item = ITEM_CATALOG[name]; if (!item || !this.state.items[name]) return; if (item.type === 'equipment') this.state.equipped[item.slot] = name; else if (item.type === 'bead') { let index = requestedIndex; if (index < 0) index = this.state.beads.findIndex((value, i) => i < this.state.unlockedBeadSlots && !value); if (index < 0) index = 0; if (index >= this.state.unlockedBeadSlots) return; this.state.beads[index] = name; } this.changed(); }
  unequip(slot) { if (this.state.equipped[slot]) { this.state.equipped[slot] = ''; this.changed(); } }
  unequipBead(index) { if (index < this.state.unlockedBeadSlots && this.state.beads[index]) { this.state.beads[index] = ''; this.changed(); } }
  changed() { this.state = normalizeStarsproutInventory(this.state); this.onChange(this.state); this.render(); }
  close() { this.onClose(this.state); this.style.remove(); this.overlay.remove(); }
}
