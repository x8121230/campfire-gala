import assert from 'node:assert/strict';
class Node extends EventTarget {
 constructor(tag='div'){super();this.tagName=tag;this.children=[];this.style={};this.dataset={};this.attributes={};this.className='';this._text='';this.classList={add:(...n)=>{this.className+=' '+n.join(' ');},remove:(n)=>{this.className=this.className.split(' ').filter(v=>v!==n).join(' ');},toggle:(n,on)=>{if(on)this.classList.add(n);else this.classList.remove(n);}};this.clientWidth=1280;this.clientHeight=720;}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}} replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
 querySelector(q){for(const c of this.children){if(q[0]==='.'&&c.className.split(' ').includes(q.slice(1)))return c;const found=c.querySelector(q);if(found)return found;}return null;}
}
globalThis.document={createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t),addEventListener:()=>{},hidden:false};globalThis.window=new EventTarget();const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const {StarsproutInventoryPanel}=await import('../src/realm/StarsproutInventoryPanel.js');
const {defaultStarsproutInventory}=await import('../src/realm/StarsproutInventory.js');
const state=defaultStarsproutInventory();state.items['香脆橡果']=4;let saved;
const panel=new StarsproutInventoryPanel(new Node(),{state,onChange:s=>{saved=s;}});
assert.equal(panel.grid.children.length,24);assert(!panel.book.textContent.includes('短靴'));assert(!panel.book.textContent.includes('手杖'));
panel.tabButtons.equipment.dispatchEvent(new Event('click'));assert.equal(panel.grid.children.filter(n=>n.tagName==='button').length,1);assert(panel.grid.children[0].textContent.includes('魔法劍'));
panel.showSkill('魔法箭');assert(panel.detail.textContent.includes('SP −1'));
const {DandelionHillsApp}=await import('../src/realm/DandelionHillsApp.js');const app=new DandelionHillsApp(new Node());app.hud();assert(app.attackButton.querySelector('.skill-icon'));assert(app.arrowButton.querySelector('.skill-icon'));assert(app.spStatus.textContent.includes('SP 3/3'));app.paused=false;app.arrowButton.dispatchEvent(new Event('click'));assert(app.arrowRequested);app.clearInput();assert(!app.arrowRequested);
const {RealmApp}=await import('../src/realm/RealmApp.js');const camp=new RealmApp(new Node());camp.hud();assert(camp.spStatus.textContent.includes('SP 3/3'));camp.loading=false;camp.backpack();assert(camp.inventoryPanel);assert(camp.inventoryPanel.book.textContent.includes('魔法箭'));
console.log('PASS: shared inventory renders, weapon filter, item art nodes, spell buttons/input reset, and camp inventory integration. DOM smoke test; CSS/browser rendering not verified.');
