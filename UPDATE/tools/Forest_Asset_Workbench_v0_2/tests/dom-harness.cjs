// Lightweight DOM/service doubles. These checks do not replace browser QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {File} = require('node:buffer');

module.exports = async function harness(root) {
  const nodes = [], ids = new Map(), urlBlobs = new Map(), downloads = [];
  class Node {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.style = {}; this._value = ''; this.textContent = ''; this.className = ''; this.hidden = false; this.disabled = false; this.checked = false; this.handlers = {};
      this.classList = { add: c => { if (!this.className.split(' ').includes(c)) this.className += ` ${c}`; }, remove: c => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); }, toggle: (c, value) => { const on = value === undefined ? !this.className.split(' ').includes(c) : value; on ? this.classList.add(c) : this.classList.remove(c); } }; nodes.push(this); }
    set value(v) { this._value = String(v); } get value() { return this._value; }
    append(...children) { this.children.push(...children); } replaceChildren(...children) { this.children = [...children]; }
    add(option) { this.children.push(option); } remove() {}
    setAttribute(k, v) { this.attributes[k] = String(v); } removeAttribute(k) { delete this.attributes[k]; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    click() { if (this.disabled) return; if (this.tagName === 'a') downloads.push({name:this.download, blob:urlBlobs.get(this.href)}); return (this.onclick || this.handlers.click)?.({target:this}); }
    getContext() { return context2d; }
    toBlob(callback) { callback(new Blob(['canvas-double'], {type:'image/png'})); }
  }
  const context2d = {draws:[], clearRect(){this.draws=[];},fillRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},setLineDash(){},fillText(){},translate(){},scale(){},
    drawImage(image,...args){this.draws.push({width:image.naturalWidth,height:image.naturalHeight,args});},getImageData(){return {data:new Uint8ClampedArray([0,0,0,0,255,255,255,255])};}};
  const body = new Node('body');
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const node = new Node(match[1]);
    for (const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
      const [,, value] = attr, key = attr[1]; node.attributes[key] = value;
      if (key === 'id') { node.id = value; ids.set(value,node); }
      else if (key === 'class') node.className = value;
      else if (key.startsWith('data-')) node.dataset[key.slice(5)] = value;
      else node[key] = value;
    }
    node.checked = /\bchecked(?:\s|$)/.test(match[2]); node.hidden = /\bhidden(?:\s|$)/.test(match[2]);
  }
  ids.get('spriteMode').value = 'whole';
  let urlIndex = 0;
  class ImageDouble extends Node {
    constructor() { super('img'); }
    set src(value) { this._src = value; Promise.resolve().then(async () => {
      try { const buffer = value.startsWith('data:image/png;base64,') ? Buffer.from(value.split(',')[1],'base64') : Buffer.from(await urlBlobs.get(value).arrayBuffer());
        if (buffer.toString('ascii',1,4) !== 'PNG') throw new Error('not PNG');
        this.naturalWidth = buffer.readUInt32BE(16); this.naturalHeight = buffer.readUInt32BE(20); this.onload?.();
      } catch { this.onerror?.(); }
    }); } get src() { return this._src; }
  }
  const document = {body, hidden:false, createElement:tag=>new Node(tag), getElementById:id=>ids.get(id),
    querySelectorAll:selector=>{const key=selector.match(/^\[data-(.+)\]$/)?.[1];return nodes.filter(n=>key && Object.hasOwn(n.dataset,key));},addEventListener(){}};
  const timers = new Set();
  const sandbox = {document, Image:ImageDouble, Option:class extends Node{constructor(text,value){super('option');this.textContent=text;this.value=value;}},
    Blob, File, console, performance, URL:{createObjectURL:blob=>{const id=`blob:test-${++urlIndex}`;urlBlobs.set(id,blob);return id;},revokeObjectURL:id=>urlBlobs.delete(id)},
    setTimeout:(callback,ms)=>{const timer=setTimeout(callback,ms);timer.unref();timers.add(timer);return timer;},clearTimeout,
    setInterval:(callback,ms)=>{const timer=setInterval(callback,ms);timer.unref();timers.add(timer);return timer;},clearInterval,
    requestAnimationFrame:callback=>{sandbox.raf=callback;}};
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  for (const file of ['demo-data.js','core.js','app.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
  async function flush() { for(let i=0;i<20;i++) await new Promise(resolve=>setImmediate(resolve)); }
  await flush();
  return {get:id=>ids.get(id),nodes,downloads,context2d,sandbox,flush, async change(id,value){const node=ids.get(id);node.value=value;await (node.onchange||node.oninput)?.({target:node});await flush();},
    async tab(name){await nodes.find(n=>n.dataset.tab===name).click();await flush();},
    file(name,data,relative){const file=new File([data],name);Object.defineProperty(file,'webkitRelativePath',{value:relative});return file;},
    cleanup(){for(const timer of timers){clearTimeout(timer);clearInterval(timer);}}};
};
