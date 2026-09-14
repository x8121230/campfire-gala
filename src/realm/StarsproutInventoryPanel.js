import { ITEM_CATALOG, TYPE_LABELS, normalizeStarsproutInventory, occupiedSlots, sortedStarsproutItems, appendItemArt } from './StarsproutInventory.js';

// Shared by camp and hills. All selectors are scoped to avoid game HUD button rules.
export class StarsproutInventoryPanel {
  constructor(host, { state, onChange = () => {}, onClose = () => {}, onNotice = () => {} } = {}) {
    Object.assign(this, { host, onChange, onClose, onNotice });
    this.state = normalizeStarsproutInventory(state); this.filter = 'all'; this.selected = '';
    this.build(); this.render();
  }
  el(tag, cls = '', text = '', parent = this.overlay || this.host) {
    const node = document.createElement(tag); node.className = cls; node.textContent = text; parent.append(node); return node;
  }
  button(text, fn, parent, cls = '') {
    const node = this.el('button', cls, text, parent); node.type = 'button'; node.addEventListener('click', fn); return node;
  }
  build() {
    this.style = this.el('style'); this.style.textContent = `
.sprout-inv{position:absolute;inset:0;z-index:30;display:grid;place-items:center;padding:14px;background:#163e37bb;backdrop-filter:blur(5px);font-family:"Microsoft JhengHei",sans-serif;color:#533c29}
.sprout-inv *{box-sizing:border-box}
.sprout-inv.sprout-inv button{position:static;transform:none;min-height:44px;width:auto;height:auto;margin:0;white-space:normal;line-height:1.3;letter-spacing:normal;font:700 16px/1.3 "Microsoft JhengHei",sans-serif;color:#533c29;background:#fff5dc;border:2px solid #bf985e;border-radius:14px;padding:9px;cursor:pointer;box-shadow:none}
.sprout-inv button:focus-visible{outline:3px solid #25788c;outline-offset:3px}
.sprout-inv .sprout-book{position:relative;display:grid;grid-template-columns:32% 68%;width:min(1180px,100%);height:min(760px,96%);border:4px solid #956432;border-radius:28px;background:#fff0ca;overflow:hidden;box-shadow:0 20px 65px #10282088}
.sprout-inv .sprout-book:before{content:"";position:absolute;inset:8px;border:2px dashed #bb8a4b;border-radius:20px;pointer-events:none;z-index:1}
.sprout-inv .sprout-left{padding:26px 22px 24px;background:linear-gradient(120deg,#f4d99f,#ffecc3);border-right:3px double #bb8a4b;overflow:auto}
.sprout-inv .sprout-right{padding:26px 25px 22px;display:flex;flex-direction:column;min-width:0;min-height:0}
.sprout-inv .sprout-title{font-size:25px;font-weight:900;margin:0 0 12px;line-height:1.25;color:#67452a;text-align:center}
.sprout-inv .sprout-right>.sprout-title{padding-right:35px}
.sprout-inv.sprout-inv .sprout-close{position:absolute;top:15px;right:15px;width:44px;height:44px;padding:0;border-radius:50%;z-index:2;font-size:27px}
.sprout-inv .sprout-hero{display:block;height:185px;max-width:100%;object-fit:contain;margin:0 auto 12px;filter:drop-shadow(0 6px 6px #76562933)}
.sprout-inv .sprout-caption{margin:7px 0 14px;text-align:center;font-size:15px;line-height:1.5;color:#765a3e}
.sprout-inv.sprout-inv .sprout-skill{width:100%;display:flex;align-items:center;gap:12px;margin:8px 0;text-align:left;background:#fff8e8;min-height:82px}
.sprout-inv .sprout-skill img{width:62px;height:62px;object-fit:contain;border-radius:10px;flex-shrink:0}
.sprout-inv .sprout-skill strong{display:block;font-size:19px;color:#4b6c70}.sprout-inv .sprout-skill small{display:block;font-size:15px;margin-top:4px}
.sprout-inv .sprout-bead-title{font-size:18px;text-align:center;margin:20px 0 10px}
.sprout-inv .sprout-beads{display:flex;gap:10px;justify-content:center}
.sprout-inv.sprout-inv .sprout-bead{flex:1;min-width:0;max-width:88px;min-height:80px;border-radius:20px;padding:6px;font-size:14px;background:#fff6df}
.sprout-inv .sprout-bead img{display:block;width:48px;height:48px;margin:auto;border-radius:50%}.sprout-inv .sprout-bead .orb-symbol{display:block;font-size:26px}.sprout-inv .sprout-bead.locked{background:#e4d4b3;color:#7b705e}
.sprout-inv .sprout-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 14px;flex-shrink:0}
.sprout-inv.sprout-inv .sprout-tabs button{flex:1;white-space:nowrap;padding:8px 10px;background:#f2deb2}
.sprout-inv.sprout-inv .sprout-tabs button.active{background:#42665a;color:#fff4d7;border-color:#42665a}
.sprout-inv .sprout-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:148px;gap:10px;overflow:auto;flex:1;min-height:148px;padding:4px 7px 9px 3px;align-content:start;scrollbar-color:#b79159 #f5e6c8}
.sprout-inv.sprout-inv .sprout-slot{position:relative;min-width:0;height:148px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px 5px 17px;border:3px solid #d5c8ad;background:#fff7e5;border-radius:18px}
.sprout-inv .sprout-slot img{display:block;width:91px;height:91px;max-width:100%;object-fit:contain;border-radius:12px}
.sprout-inv .sprout-slot .name{display:block;font-size:16px;line-height:1.25;text-align:center;overflow-wrap:anywhere}
.sprout-inv .sprout-slot .qty{position:absolute;right:5px;bottom:4px;min-width:25px;text-align:center;padding:1px 5px;border-radius:9px;background:#795937;color:#fff8e7;font-size:15px}
.sprout-inv .sprout-slot .badge{position:absolute;left:5px;top:4px;border-radius:8px;background:#42665a;color:#fff;font-size:12px;padding:2px 5px}
.sprout-inv.sprout-inv .sprout-slot.empty{background:#f2e4c7;border:2px dashed #d8c59e;cursor:default;opacity:.65}
.sprout-inv.sprout-inv .sprout-slot.quest{border-color:#dfb340}.sprout-inv.sprout-inv .sprout-slot.uncommon{border-color:#75b692}.sprout-inv.sprout-inv .sprout-slot.rare{border-color:#6babe0}.sprout-inv.sprout-inv .sprout-slot.epic{border-color:#ad80ce}.sprout-inv.sprout-inv .sprout-slot.legendary{border-color:#d49a27}
.sprout-inv.sprout-inv .sprout-slot.selected{outline:3px solid #43695c;outline-offset:1px}
.sprout-inv .sprout-detail{flex-shrink:0;min-height:76px;margin:10px 0 0;padding:10px 12px;border-radius:14px;background:#ecd7a6;font-size:16px;line-height:1.5;display:flex;align-items:center;gap:10px}
.sprout-inv .sprout-detail-text{flex:1;min-width:0}.sprout-inv .sprout-detail strong{display:block}.sprout-inv .sprout-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;margin-top:10px;font-size:16px;font-weight:700;flex-shrink:0}
@media(max-height:560px){.sprout-inv{padding:6px}.sprout-inv .sprout-book{height:98%;border-radius:18px}.sprout-inv .sprout-left{padding:18px 15px}.sprout-inv .sprout-right{padding:17px 19px}.sprout-inv .sprout-hero{height:115px}.sprout-inv .sprout-title{font-size:21px}.sprout-inv .sprout-grid{grid-auto-rows:130px;min-height:130px}.sprout-inv.sprout-inv .sprout-slot{height:130px}.sprout-inv .sprout-slot img{width:72px;height:72px}.sprout-inv .sprout-detail{min-height:62px;font-size:15px}.sprout-inv .sprout-bead-title{margin-top:12px}}
@media(max-width:650px){.sprout-inv .sprout-book{grid-template-columns:1fr;overflow:auto}.sprout-inv .sprout-left{border-right:0;border-bottom:2px solid #bb8a4b}.sprout-inv .sprout-hero{height:130px}.sprout-inv .sprout-right{overflow:visible}.sprout-inv .sprout-grid{flex:none;height:420px;grid-template-columns:repeat(3,minmax(0,1fr))}.sprout-inv .sprout-title{font-size:22px}}
`;
    this.overlay=this.el('div','sprout-inv'); this.overlay.setAttribute('role','dialog'); this.overlay.setAttribute('aria-modal','true'); this.overlay.setAttribute('aria-label','冒險行囊');
    this.book=this.el('div','sprout-book'); this.button('×',()=>this.close(),this.book,'sprout-close').setAttribute('aria-label','關閉背包');
    const left=this.el('section','sprout-left','',this.book); this.el('h2','sprout-title','阿晨晨的魔法手帳',left);
    const hero=this.el('img','sprout-hero','',left);hero.src=new URL('../../assets/phantom-realm/hero-achenchen/hero-down.png',import.meta.url).href;hero.alt='勇者阿晨晨';
    for(const [name,cost,description] of [['魔法劍','SP 0','近距斬擊・J／空白鍵'],['魔法箭','SP −1','遠距射擊・K']]) {
      const card=this.button('',()=>this.showSkill(name),left,'sprout-skill');appendItemArt(card,name);const text=this.el('span','','',card);this.el('strong','',name+'　'+cost,text);this.el('small','',description,text);
    }
    this.el('p','sprout-caption','SP 上限 3 點，每 5 秒回復 1 點。\n營地為安全區，技能於野外使用。',left);
    this.el('h3','sprout-bead-title','靈珠插槽',left);this.beads=this.el('div','sprout-beads','',left);
    const right=this.el('section','sprout-right','',this.book);this.el('h2','sprout-title','冒險行囊',right);const tabs=this.el('div','sprout-tabs','',right);this.tabButtons={};
    for(const [type,label] of Object.entries(TYPE_LABELS))this.tabButtons[type]=this.button(label,()=>{this.filter=type;this.render();},tabs);
    this.grid=this.el('div','sprout-grid','',right);this.detail=this.el('div','sprout-detail','點選道具，看看它的小故事與用途。',right);
    const footer=this.el('div','sprout-footer','',right);this.capacity=this.el('div','sprout-cap','',footer);this.button('整理行囊',()=>{this.selected='';this.render();this.detail.textContent='已依品質、類型與等級整理。';this.onNotice('行囊整理好了！');},footer);
  }
  render(){
    this.state=normalizeStarsproutInventory(this.state);this.beads.replaceChildren();
    for(let i=0;i<3;i++){
      const unlocked=i<this.state.unlockedBeadSlots,name=this.state.beads[i];
      const node=this.button('',()=>this.unequipBead(i),this.beads,`sprout-bead ${unlocked?'':'locked'}`);
      if(name)appendItemArt(node,name);else this.el('span','orb-symbol',unlocked?'◇':'⌑',node);
      this.el('span','',name?'取下':unlocked?'空槽':'未解鎖',node);node.title=name||'隨主線任務解鎖';
      node.addEventListener('dragover',e=>{if(unlocked)e.preventDefault();});node.addEventListener('drop',e=>{e.preventDefault();this.equip(e.dataTransfer.getData('text/plain'),i);});
    }
    for(const [type,button] of Object.entries(this.tabButtons))button.classList.toggle('active',type===this.filter);
    const items=sortedStarsproutItems(this.state,this.filter);this.grid.replaceChildren();
    for(let i=0;i<Math.max(this.state.capacity,items.length);i++){
      const item=items[i];if(!item){this.el('div','sprout-slot empty','',this.grid);continue;}
      const node=this.button('',()=>this.select(item.name),this.grid,`sprout-slot ${item.rarity} ${this.selected===item.name?'selected':''}`);
      node.title=item.name;appendItemArt(node,item.name);this.el('span','name',item.name,node);this.el('span','qty',String(item.count),node);
      if(item.name==='魔法劍')this.el('span','badge','SP 0',node);
      node.draggable=item.type==='bead';node.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',item.name));
    }
    this.capacity.textContent=`${occupiedSlots(this.state)} / ${this.state.capacity} 格　｜　金幣 ${this.state.gold.toLocaleString('zh-TW')}`;
    if(this.selected)this.showDetail(this.selected);
  }
  showSkill(name){this.selected='';this.detail.replaceChildren();this.el('div','sprout-detail-text',name==='魔法劍'?'魔法劍｜SP 0。近距離向前斬擊，收勢結束前無法移動或格擋。':'魔法箭｜SP −1。向前射出魔力箭，命中第一隻怪物或飛行 520 距離後消散。SP 每 5 秒回復 1 點。',this.detail);}
  showDetail(name){const item=ITEM_CATALOG[name];this.detail.replaceChildren();const text=this.el('div','sprout-detail-text','',this.detail);this.el('strong','',name,text);this.el('span','',item?.description||'星芽谷旅途中取得的冒險物品。',text);if(item?.type==='bead')this.button('裝備靈珠',()=>this.equip(name),this.detail);}
  select(name){this.selected=name;this.render();}
  equip(name,requestedIndex=-1){const item=ITEM_CATALOG[name];if(item?.type!=='bead'||!this.state.items[name])return;let index=requestedIndex;if(index<0)index=this.state.beads.findIndex((v,i)=>i<this.state.unlockedBeadSlots&&!v);if(index<0)index=0;if(index>=this.state.unlockedBeadSlots)return;this.state.beads[index]=name;this.changed();}
  unequipBead(index){if(index<this.state.unlockedBeadSlots&&this.state.beads[index]){this.state.beads[index]='';this.changed();}}
  changed(){this.state=normalizeStarsproutInventory(this.state);this.onChange(this.state);this.render();}
  close(){this.onClose(this.state);this.style.remove();this.overlay.remove();}
}
