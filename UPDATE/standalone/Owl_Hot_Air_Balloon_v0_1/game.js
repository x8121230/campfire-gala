"use strict";
const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const ui={chapter:document.querySelector("#chapter"),name:document.querySelector("#levelName"),instruction:document.querySelector("#instruction"),progress:document.querySelector("#progressFill"),picker:document.querySelector("#levelPicker"),hint:document.querySelector("#hintBtn"),toddler:document.querySelector("#toddlerBtn"),slow:document.querySelector("#slowBtn"),sound:document.querySelector("#soundBtn"),pause:document.querySelector("#pauseBtn"),restart:document.querySelector("#restartBtn"),pauseOverlay:document.querySelector("#pauseOverlay"),resume:document.querySelector("#resumeBtn"),finish:document.querySelector("#finishOverlay"),again:document.querySelector("#playAgainBtn")};
const partDefs={
  envelope:{label:"彩色氣囊",target:[480,190],start:[105,155],size:78},
  basket:{label:"木頭吊籃",target:[480,385],start:[850,390],size:55},
  star:{label:"星星沙袋",target:[390,350],start:[105,355],size:40},
  moon:{label:"月亮沙袋",target:[570,350],start:[850,150],size:42},
  bow:{label:"蝴蝶結",target:[480,305],start:[110,465],size:38},
  flag:{label:"小旗子",target:[515,75],start:[850,285],size:42}
};
const levels=[
 {name:"晨光號",parts:["envelope","basket","star"],colors:["#ff7eb6","#ffd86f"]},
 {name:"藍莓號",parts:["envelope","basket","moon"],colors:["#73d6ff","#8a7bea"]},
 {name:"蜜糖號",parts:["envelope","basket","bow"],colors:["#ffb45e","#ff7c8f"]},
 {name:"嫩芽號",parts:["envelope","basket","flag"],colors:["#79d997","#f7e86a"]},
 {name:"彩虹號",parts:["envelope","basket","star","moon"],colors:["#f478bd","#69dbed"]},
 {name:"晚霞號",parts:["envelope","basket","bow","flag"],colors:["#fa8777","#a77bee"]},
 {name:"海風號",parts:["envelope","basket","star","bow"],colors:["#56cdd8","#ffd365"]},
 {name:"葡萄號",parts:["envelope","basket","moon","flag"],colors:["#9b77e8","#ff8eb8"]},
 {name:"星芽號",parts:["envelope","basket","star","moon","bow"],colors:["#6dd9ad","#ffe078"]},
 {name:"月糖號",parts:["envelope","basket","star","moon","flag"],colors:["#768fea","#f58fc5"]},
 {name:"花冠號",parts:["envelope","basket","star","bow","flag"],colors:["#ff9979","#ffe06c"]},
 {name:"雲端夢想號",parts:["envelope","basket","star","moon","bow","flag"],colors:["#ef75b8","#6fe0ed"]}
];
const chapters=["第一站 · 大形狀","第二站 · 左右配對","第三站 · 天空工匠"];
const bg=new Image();bg.src="assets/cloud-island-workshop.png";
let levelIndex=0,pieces=[],dragged=null,offset={x:0,y:0},toddler=false,slow=false,soundOn=true,paused=false,launched=false,launchAt=0,launchTimer=null,hintKey="",hintUntil=0,lastAction=performance.now(),particles=[],audioCtx=null;

function current(){return levels[levelIndex]}
function createPieces(){
  if(launchTimer){clearTimeout(launchTimer);launchTimer=null;}
  pieces=current().parts.map((key,i)=>{const d=partDefs[key];return{key,x:d.start[0],y:d.start[1]+((i%2)*12),homeX:d.start[0],homeY:d.start[1]+((i%2)*12),placed:false,wobbleUntil:0}});
  dragged=null;launched=false;launchAt=0;particles=[];lastAction=performance.now();hintUntil=performance.now()+1800;hintKey=pieces[0]?.key||"";updateUI();
}
function updateUI(){
  const placed=pieces.filter(p=>p.placed).length,total=pieces.length;
  ui.chapter.textContent=chapters[Math.floor(levelIndex/4)];ui.name.textContent=`${levelIndex+1}/12 ${current().name}`;
  ui.instruction.textContent=toddler?"點一下零件，它會飛到正確位置":"把零件拖到一樣形狀的虛線框";
  ui.progress.style.width=`${total?placed/total*100:0}%`;
  [...ui.picker.children].forEach((b,i)=>b.classList.toggle("active",i===levelIndex));
}
function makePicker(){levels.forEach((l,i)=>{const b=document.createElement("button");b.innerHTML=`${i+1}<small>${l.name}</small>`;b.addEventListener("click",()=>{levelIndex=i;ui.finish.classList.add("hidden");createPieces()});ui.picker.appendChild(b)})}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*960/r.width,y:(e.clientY-r.top)*540/r.height}}
function hitPiece(pt){for(let i=pieces.length-1;i>=0;i--){const p=pieces[i],d=partDefs[p.key];if(!p.placed&&Math.hypot(pt.x-p.x,pt.y-p.y)<d.size+25)return p}return null}
function tone(freq,duration=.12,type="sine",vol=.06){if(!soundOn)return;audioCtx||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),n=audioCtx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,n);g.gain.setValueAtTime(vol,n);g.gain.exponentialRampToValueAtTime(.001,n+duration);o.connect(g).connect(audioCtx.destination);o.start(n);o.stop(n+duration)}
function petals(x,y,count=18){const colors=["#ff82b5","#fff09b","#a7f5ff","#bd9cff"];for(let i=0;i<count;i++){particles.push({x,y,vx:(Math.random()-.5)*130,vy:-30-Math.random()*90,life:1,color:colors[i%4],r:3+Math.random()*4,spin:Math.random()*6})}}
function place(p){const d=partDefs[p.key];p.x=d.target[0];p.y=d.target[1];p.placed=true;dragged=null;lastAction=performance.now();petals(p.x,p.y,10);tone(410+pieces.filter(x=>x.placed).length*55);updateUI();if(pieces.every(x=>x.placed))launchTimer=setTimeout(launch,slow?700:350)}
function reject(p){p.x=p.homeX;p.y=p.homeY;p.wobbleUntil=performance.now()+500;dragged=null;hintKey=p.key;hintUntil=performance.now()+1400;tone(155,.14,"triangle",.035)}
function launch(){launchTimer=null;if(launched)return;if(paused){launchTimer=setTimeout(launch,250);return}launched=true;launchAt=performance.now();ui.instruction.textContent="暖暖火焰點燃了，出發！";petals(480,400,60);[440,554,659].forEach((f,i)=>setTimeout(()=>tone(f,.35,"sine",.07),i*140))}
function advance(){if(levelIndex===11){ui.finish.classList.remove("hidden");return}levelIndex++;createPieces()}
function setPaused(v){paused=v;ui.pauseOverlay.classList.toggle("hidden",!v);ui.pause.textContent=v?"繼續":"暫停"}

canvas.addEventListener("pointerdown",e=>{if(paused||launched)return;const p=hitPiece(point(e));if(!p)return;lastAction=performance.now();if(toddler){place(p);return}dragged=p;if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);offset={x:point(e).x-p.x,y:point(e).y-p.y};tone(300,.07)});
canvas.addEventListener("pointermove",e=>{if(!dragged||paused)return;const q=point(e);dragged.x=q.x-offset.x;dragged.y=q.y-offset.y});
function release(){if(!dragged)return;const d=partDefs[dragged.key];if(Math.hypot(dragged.x-d.target[0],dragged.y-d.target[1])<(toddler?150:95))place(dragged);else reject(dragged)}
canvas.addEventListener("pointerup",release);canvas.addEventListener("pointercancel",release);
ui.hint.addEventListener("click",()=>{const p=pieces.find(x=>!x.placed);if(p){hintKey=p.key;hintUntil=performance.now()+2500;tone(650)}});
ui.toddler.addEventListener("click",()=>{toddler=!toddler;ui.toddler.textContent=`幼幼模式：${toddler?"開":"關"}`;ui.toddler.setAttribute("aria-pressed",String(toddler));updateUI()});
ui.slow.addEventListener("click",()=>{slow=!slow;ui.slow.textContent=`慢慢玩：${slow?"開":"關"}`;ui.slow.setAttribute("aria-pressed",String(slow))});
ui.sound.addEventListener("click",()=>{soundOn=!soundOn;ui.sound.textContent=`音效：${soundOn?"開":"關"}`;ui.sound.setAttribute("aria-pressed",String(soundOn))});
ui.pause.addEventListener("click",()=>setPaused(!paused));ui.resume.addEventListener("click",()=>setPaused(false));ui.restart.addEventListener("click",createPieces);ui.again.addEventListener("click",()=>{ui.finish.classList.add("hidden");levelIndex=0;createPieces()});
document.addEventListener("visibilitychange",()=>{if(document.hidden)setPaused(true)});window.addEventListener("blur",()=>setPaused(true));

function starPath(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.44:r,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath()}
function balloonPath(x,y,s=1){ctx.beginPath();ctx.moveTo(x,y+80*s);ctx.bezierCurveTo(x-90*s,y+25*s,x-80*s,y-95*s,x,y-105*s);ctx.bezierCurveTo(x+80*s,y-95*s,x+90*s,y+25*s,x,y+80*s);ctx.closePath()}
function drawPart(key,x,y,ghost=false,colors=current().colors){
  ctx.save();ctx.translate(x,y);ctx.lineWidth=ghost?4:3;ctx.setLineDash(ghost?[9,9]:[]);ctx.strokeStyle=ghost?"rgba(62,71,130,.48)":"rgba(75,55,80,.35)";ctx.fillStyle=ghost?"rgba(255,255,255,.22)":colors[0];ctx.shadowColor=ghost?"transparent":"rgba(75,74,150,.35)";ctx.shadowBlur=ghost?0:12;
  if(key==="envelope"){balloonPath(0,0,.72);ctx.fill();ctx.stroke();if(!ghost){ctx.save();balloonPath(0,0,.72);ctx.clip();ctx.fillStyle=colors[1];ctx.fillRect(-18,-80,36,140);ctx.restore();ctx.beginPath();ctx.moveTo(0,-74);ctx.lineTo(0,58);ctx.stroke()}}
  if(key==="basket"){ctx.beginPath();ctx.roundRect(-48,-34,96,68,12);ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#a9693e";ctx.fill();ctx.stroke();if(!ghost){ctx.strokeStyle="#704329";for(let yy=-18;yy<30;yy+=16){ctx.beginPath();ctx.moveTo(-45,yy);ctx.lineTo(45,yy);ctx.stroke()}}}
  if(key==="star"){starPath(0,0,39);ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#ffe16b";ctx.fill();ctx.stroke()}
  if(key==="moon"){ctx.beginPath();ctx.arc(0,0,38,-Math.PI/2,Math.PI/2);ctx.arc(15,0,29,Math.PI/2,-Math.PI/2,true);ctx.closePath();ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#b99bff";ctx.fill();ctx.stroke()}
  if(key==="bow"){ctx.beginPath();ctx.ellipse(-23,0,25,16,-.3,0,Math.PI*2);ctx.ellipse(23,0,25,16,.3,0,Math.PI*2);ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#ff7eae";ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#ffd96b";ctx.fill();ctx.stroke()}
  if(key==="flag"){ctx.beginPath();ctx.moveTo(-25,32);ctx.lineTo(-25,-35);ctx.lineTo(35,-20);ctx.lineTo(-25,0);ctx.stroke();ctx.fillStyle=ghost?"rgba(255,255,255,.22)":"#62d9d0";ctx.fill()}
  ctx.restore();
}
function drawRopes(shiftY){ctx.save();ctx.strokeStyle="#76543c";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(430,248+shiftY);ctx.lineTo(447,352+shiftY);ctx.moveTo(530,248+shiftY);ctx.lineTo(513,352+shiftY);ctx.stroke();ctx.restore()}
function drawOwl(shiftY,t){
  const y=363+shiftY+Math.sin(t/260)*2;ctx.save();ctx.translate(480,y);ctx.fillStyle="#8d5c48";ctx.beginPath();ctx.ellipse(0,0,37,35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f2d29a";ctx.beginPath();ctx.arc(-14,-7,16,0,Math.PI*2);ctx.arc(14,-7,16,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#4b4a61";ctx.lineWidth=5;ctx.beginPath();ctx.arc(-14,-7,12,0,Math.PI*2);ctx.arc(14,-7,12,0,Math.PI*2);ctx.moveTo(-2,-7);ctx.lineTo(2,-7);ctx.stroke();ctx.fillStyle="#302b3e";ctx.beginPath();ctx.arc(-14,-7,4,0,Math.PI*2);ctx.arc(14,-7,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ef9b48";ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(-7,12);ctx.lineTo(7,12);ctx.closePath();ctx.fill();ctx.restore()
}
function draw(t){
  requestAnimationFrame(draw);if(paused)return;ctx.clearRect(0,0,960,540);if(bg.complete)ctx.drawImage(bg,0,0,960,540);else{ctx.fillStyle="#bde9ff";ctx.fillRect(0,0,960,540)}
  const shift=launched?-Math.min(610,(t-launchAt)/(slow?7:4)):0,pulse=(Math.sin(t/300)+1)/2;
  ctx.save();ctx.translate(0,shift);
  if(!launched){pieces.filter(p=>!p.placed).forEach(p=>{const d=partDefs[p.key];drawPart(p.key,d.target[0],d.target[1],true);if((t<hintUntil||t-lastAction>5000)&&p.key===(hintKey||pieces.find(q=>!q.placed)?.key)){ctx.strokeStyle=`rgba(255,239,115,${.45+pulse*.45})`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(d.target[0],d.target[1],d.size+20+pulse*7,0,Math.PI*2);ctx.stroke()}})}
  if(pieces.some(p=>p.key==="envelope"&&p.placed))drawRopes(0);
  pieces.filter(p=>p.placed).forEach(p=>drawPart(p.key,partDefs[p.key].target[0],partDefs[p.key].target[1]));
  pieces.filter(p=>!p.placed).forEach(p=>{const wobble=t<p.wobbleUntil?Math.sin(t*.08)*8:0;drawPart(p.key,p.x+wobble,p.y)});
  if(launched||pieces.every(p=>p.placed)){drawOwl(0,t);ctx.fillStyle="#ff9a39";ctx.shadowColor="#ffcf5d";ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(480,343);ctx.quadraticCurveTo(462,322,480,300);ctx.quadraticCurveTo(498,322,480,343);ctx.fill()}
  ctx.restore();
  particles.forEach(p=>{p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=1.1;p.life-=.013;p.spin+=.12;ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y+shift);ctx.rotate(p.spin);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.55,0,0,Math.PI*2);ctx.fill();ctx.restore()});particles=particles.filter(p=>p.life>0);
  if(launched&&t-launchAt>(slow?4400:2850)){launched=false;advance()}
}
makePicker();createPieces();requestAnimationFrame(draw);
