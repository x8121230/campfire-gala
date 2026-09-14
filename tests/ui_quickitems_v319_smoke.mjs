import assert from 'node:assert/strict';
class Node extends EventTarget {
 constructor(tag='div'){super();this.tagName=tag;this.children=[];this.style={};this.dataset={};this.attributes={};this.className='';this._text='';this.classList={add:(...n)=>{this.className+=' '+n.join(' ');},remove:(n)=>{this.className=this.className.split(' ').filter(v=>v!==n).join(' ');},toggle:(n,on)=>{if(on)this.classList.add(n);else this.classList.remove(n);}};this.clientWidth=1280;this.clientHeight=720;}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}} replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
 querySelector(q){for(const c of this.children){if((q[0]==='.'&&c.className.split(' ').includes(q.slice(1)))||c.tagName===q)return c;const found=c.querySelector(q);if(found)return found;}return null;}
}
globalThis.document={createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t),addEventListener:()=>{},hidden:false};globalThis.window=new EventTarget();const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};

const {StarsproutInventoryPanel}=await import('../src/realm/StarsproutInventoryPanel.js');
const {defaultStarsproutInventory,normalizeStarsproutInventory}=await import('../src/realm/StarsproutInventory.js');
const {mentorReward,consumeItem,buildQuickSlots,renderQuickSlots}=await import('../src/realm/RealmQuickItemsV319.js');
let state=mentorReward(defaultStarsproutInventory(),3);const health={hp:2,maxHp:3};let changed=0;
const panel=new StarsproutInventoryPanel(new Node(),{state,onChange:s=>{state=s;changed++;},onUse:name=>{const result=consumeItem(state,health,name);return {...result,state};}});
assert.equal(panel.quick.children.length,4);assert.equal(panel.grid.children.length,24);assert(!panel.book.textContent.includes('魔法箭'));assert(!panel.book.textContent.includes('魔法劍'));assert(panel.book.textContent.includes('斬擊'));
panel.select('甜蘋果');panel.quick.children[3].dispatchEvent(new Event('click'));assert.equal(state.quickSlots[3],'甜蘋果');assert.equal(changed,1);
panel.select('甜蘋果');const use=panel.detail.children.find(n=>n.tagName==='button'&&n.textContent==='使用');assert(use);use.dispatchEvent(new Event('click'));assert.equal(health.hp,3);assert.equal(panel.state.items['甜蘋果'],2);
const remove=panel.detail.children.find(n=>n.tagName==='button'&&n.textContent==='從快捷欄取下');remove.dispatchEvent(new Event('click'));assert.deepEqual(state.quickSlots,['','','','']);
const app={inventoryState:state,quickbar:new Node(),el:panel.el.bind(panel),button:panel.button.bind(panel),useQuick:i=>{app.clicked=i;}};app.quickSlots=buildQuickSlots(app);renderQuickSlots(app);assert.equal(app.quickSlots.length,4);app.quickSlots[2].dispatchEvent(new Event('click'));assert.equal(app.clicked,2);state.quickSlots[2]='甜蘋果';renderQuickSlots(app);assert.equal(app.quickSlots[2].querySelector('.count').textContent,'2');assert(!app.quickSlots[2].querySelector('img').hidden);
console.log('PASS: real inventory component, four slots, click assignment, use, removal, HUD artwork/count sync; DOM smoke only.');
