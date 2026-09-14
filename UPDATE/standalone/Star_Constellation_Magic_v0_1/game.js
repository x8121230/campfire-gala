"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const ui = {
  chapter: document.querySelector("#chapter"), levelName: document.querySelector("#levelName"),
  instruction: document.querySelector("#instruction"), progress: document.querySelector("#progressFill"),
  hint: document.querySelector("#hintBtn"), toddler: document.querySelector("#toddlerBtn"),
  slow: document.querySelector("#slowBtn"), sound: document.querySelector("#soundBtn"),
  pause: document.querySelector("#pauseBtn"), restart: document.querySelector("#restartBtn"),
  pauseOverlay: document.querySelector("#pauseOverlay"), resume: document.querySelector("#resumeBtn"),
  chapterOverlay: document.querySelector("#chapterOverlay"), chapterTitle: document.querySelector("#chapterTitle"),
  chapterText: document.querySelector("#chapterText"), chapterIcon: document.querySelector("#chapterIcon"),
  nextChapter: document.querySelector("#nextChapterBtn"), finishOverlay: document.querySelector("#finishOverlay"),
  playAgain: document.querySelector("#playAgainBtn")
};

const levels = [
  {name:"月芽小舟",icon:"🌙",points:[[250,330],[420,390],[610,330]]},
  {name:"雲頂風箏",icon:"🪁",points:[[300,170],[490,270],[310,360],[660,370]]},
  {name:"星尾小魚",icon:"🐟",points:[[250,270],[440,190],[610,270],[440,360]]},
  {name:"芽芽皇冠",icon:"👑",points:[[260,350],[330,190],[480,315],[630,190]]},
  {name:"月耳兔",icon:"🐰",points:[[320,145],[400,270],[475,155],[565,290],[430,390]]},
  {name:"晴空小鹿",icon:"🦌",points:[[270,190],[410,260],[540,170],[630,310],[470,390]]},
  {name:"糖羽天鵝",icon:"🦢",points:[[260,200],[390,160],[515,245],[445,350],[635,370],[690,240]]},
  {name:"星尾鯨魚",icon:"🐳",points:[[235,275],[365,190],[520,220],[660,315],[500,380],[330,350]]},
  {name:"旋羽貓頭鷹",icon:"🦉",points:[[300,165],[405,235],[500,150],[600,240],[535,370],[410,370],[275,300]]},
  {name:"彈果翼龍",icon:"🦕",points:[[235,210],[390,260],[520,150],[480,310],[680,220],[590,390],[390,350]]},
  {name:"雲冠獅子",icon:"🦁",points:[[265,250],[340,160],[460,205],[570,150],[670,270],[560,370],[420,335],[320,390]]},
  {name:"虹光飛船",icon:"🚀",points:[[260,360],[350,210],[470,135],[585,220],[690,360],[520,325],[470,420],[410,320]]}
];

const chapterInfo = [
  {name:"第一章 · 星芽初醒",text:"大星星會告訴你順序。",icon:"🌟"},
  {name:"第二章 · 雲海尋路",text:"星星變多了，跟著下一顆光芒前進。",icon:"☁️"},
  {name:"第三章 · 星座現身",text:"長長的魔法路，會喚醒天空朋友。",icon:"🪄"}
];

const bg = new Image();
bg.src = "assets/cloud-island-night.png";
let audioCtx = null;
let levelIndex = 0, connected = 0, dragging = false, paused = false, completed = false;
let toddler = false, slow = false, soundOn = true, hintUntil = 0, lastAction = performance.now();
let particles = [], ripples = [], wrongStar = -1, wrongUntil = 0, completionAt = 0;

function chapterIndex(){ return Math.floor(levelIndex / 4); }
function current(){ return levels[levelIndex]; }
function setupLevel(){
  connected = 0; dragging = false; completed = false; completionAt = 0; particles = []; ripples = [];
  hintUntil = performance.now() + 2200; lastAction = performance.now(); updateUI();
}
function updateUI(){
  const info = chapterInfo[chapterIndex()];
  ui.chapter.textContent = info.name;
  ui.levelName.textContent = `${levelIndex + 1}/12 ${current().name}`;
  ui.instruction.textContent = toddler ? "碰一下天空，魔法會帶你找到下一顆" : "從 1 開始，依序點擊或滑過星星";
  ui.progress.style.width = `${(connected / current().points.length) * 100}%`;
}
function canvasPoint(event){
  const r = canvas.getBoundingClientRect();
  return {x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height};
}
function starAt(p){
  const pts = current().points;
  for(let i=0;i<pts.length;i++){
    const radius = toddler ? 58 : 42;
    if(Math.hypot(p.x-pts[i][0],p.y-pts[i][1]) <= radius) return i;
  }
  return -1;
}
function tone(freq,duration=0.12,type="sine",volume=0.07){
  if(!soundOn) return;
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), now=audioCtx.currentTime;
  osc.type=type; osc.frequency.setValueAtTime(freq,now); gain.gain.setValueAtTime(volume,now);
  gain.gain.exponentialRampToValueAtTime(0.001,now+duration); osc.connect(gain).connect(audioCtx.destination);
  osc.start(now); osc.stop(now+duration);
}
function burst(x,y,count=14){
  for(let i=0;i<count;i++){
    const a=Math.PI*2*i/count+Math.random()*.25, speed=35+Math.random()*85;
    particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1,color:["#fff2a6","#9ff6ff","#ff9de2"][i%3]});
  }
}
function acceptNext(){
  if(paused || completed || connected >= current().points.length) return;
  const [x,y]=current().points[connected];
  connected++; lastAction=performance.now(); ripples.push({x,y,r:12,life:1}); burst(x,y,10);
  tone(390 + connected*55, slow ? .22 : .12, "sine"); updateUI();
  if(connected === current().points.length) finishLevel();
}
function tryStar(index){
  if(index === connected){ acceptNext(); return true; }
  if(index >= connected){ wrongStar=index; wrongUntil=performance.now()+450; tone(145,.12,"triangle",.035); hintUntil=performance.now()+1200; }
  return false;
}
function finishLevel(){
  completed=true; completionAt=performance.now();
  current().points.forEach(([x,y],i)=>setTimeout(()=>burst(x,y,20),i*70));
  [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.32,"sine",.075),i*150));
  ui.instruction.textContent=`${current().name}醒來了！`;
}
function advance(){
  if(levelIndex === levels.length-1){ ui.finishOverlay.classList.remove("hidden"); return; }
  levelIndex++;
  if(levelIndex % 4 === 0){
    const info=chapterInfo[chapterIndex()]; ui.chapterIcon.textContent=info.icon; ui.chapterTitle.textContent=info.name;
    ui.chapterText.textContent=info.text; ui.chapterOverlay.classList.remove("hidden");
  }
  setupLevel();
}
function setPaused(value){
  paused=value; ui.pauseOverlay.classList.toggle("hidden",!value); ui.pause.textContent=value?"繼續":"暫停";
}

canvas.addEventListener("pointerdown",e=>{
  if(paused || completed) return; if(canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId); dragging=true;
  if(toddler) acceptNext(); else tryStar(starAt(canvasPoint(e)));
});
canvas.addEventListener("pointermove",e=>{ if(dragging && !toddler) tryStar(starAt(canvasPoint(e))); });
canvas.addEventListener("pointerup",()=>dragging=false);
canvas.addEventListener("pointercancel",()=>dragging=false);
window.addEventListener("keydown",e=>{
  if(e.key>="1"&&e.key<="8") tryStar(Number(e.key)-1);
  if(e.key===" "){ e.preventDefault(); setPaused(!paused); }
});
ui.hint.addEventListener("click",()=>{ hintUntil=performance.now()+2500; tone(660,.12); });
ui.toddler.addEventListener("click",()=>{ toddler=!toddler; ui.toddler.textContent=`幼幼模式：${toddler?"開":"關"}`; ui.toddler.setAttribute("aria-pressed",String(toddler)); updateUI(); });
ui.slow.addEventListener("click",()=>{ slow=!slow; ui.slow.textContent=`慢慢玩：${slow?"開":"關"}`; ui.slow.setAttribute("aria-pressed",String(slow)); });
ui.sound.addEventListener("click",()=>{ soundOn=!soundOn; ui.sound.textContent=`音效：${soundOn?"開":"關"}`; ui.sound.setAttribute("aria-pressed",String(soundOn)); });
ui.pause.addEventListener("click",()=>setPaused(!paused)); ui.resume.addEventListener("click",()=>setPaused(false));
ui.restart.addEventListener("click",()=>setupLevel()); ui.nextChapter.addEventListener("click",()=>ui.chapterOverlay.classList.add("hidden"));
ui.playAgain.addEventListener("click",()=>{ ui.finishOverlay.classList.add("hidden"); levelIndex=0; setupLevel(); });
document.addEventListener("visibilitychange",()=>{ if(document.hidden) setPaused(true); });
window.addEventListener("blur",()=>setPaused(true));

function starPath(x,y,r,rotation=-Math.PI/2){
  ctx.beginPath(); for(let i=0;i<10;i++){const rr=i%2===0?r:r*.43,a=rotation+i*Math.PI/5;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);} ctx.closePath();
}
function drawMascot(level,t){
  if(!completed) return;
  const age=Math.min(1,(t-completionAt)/750), bob=Math.sin(t/330)*5;
  ctx.save(); ctx.globalAlpha=age; ctx.translate(480,270+bob); ctx.scale(.6+.4*age,.6+.4*age);
  ctx.font="116px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.shadowColor="#b8f7ff";ctx.shadowBlur=35;
  ctx.fillText(level.icon,0,0); ctx.font="800 32px sans-serif";ctx.shadowBlur=16;ctx.fillStyle="#fff7c4";ctx.fillText(level.name,0,90);ctx.restore();
}
function draw(t){
  requestAnimationFrame(draw); if(paused) return;
  ctx.clearRect(0,0,960,540);
  if(bg.complete) ctx.drawImage(bg,0,0,960,540); else {ctx.fillStyle="#17184c";ctx.fillRect(0,0,960,540);}
  const level=current(), pts=level.points, pulse=(Math.sin(t/(slow?650:360))+1)/2;
  ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round";
  // Gentle guide in chapter one only.
  if(chapterIndex()===0 && !completed){ctx.setLineDash([7,13]);ctx.strokeStyle="rgba(204,232,255,.28)";ctx.lineWidth=4;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  if(connected>1){ctx.shadowColor="#9ff6ff";ctx.shadowBlur=18;ctx.strokeStyle="#eafcff";ctx.lineWidth=7;ctx.beginPath();pts.slice(0,connected).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  if(completed){ctx.shadowColor="#ffe58a";ctx.shadowBlur=28;ctx.strokeStyle="#fff3b0";ctx.lineWidth=9;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  pts.forEach(([x,y],i)=>{
    const done=i<connected, next=i===connected && !completed, hinted=next && (t<hintUntil || t-lastAction>5000);
    let dx=0;if(i===wrongStar&&t<wrongUntil)dx=Math.sin(t*.06)*7;
    ctx.save();ctx.translate(x+dx,y);ctx.shadowColor=done?"#fff2a6":"#80eaff";ctx.shadowBlur=done?24:12+(hinted?pulse*20:0);
    starPath(0,0,(next&&hinted?28+pulse*5:done?26:22));ctx.fillStyle=done?"#fff2a6":next?"#c8f9ff":"rgba(180,199,255,.7)";ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle="#1f255c";ctx.font="900 16px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(i+1),0,1);ctx.restore();
  });
  ripples.forEach(r=>{ctx.globalAlpha=r.life;ctx.strokeStyle="#d9fbff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();r.r+=1.8;r.life-=.025;});ripples=ripples.filter(r=>r.life>0);
  particles.forEach(p=>{p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=.8;p.life-=.018;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;starPath(p.x,p.y,4);ctx.fill();});particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
  drawMascot(level,t);ctx.restore();
  if(completed && t-completionAt>(slow?2600:1750)){ completed=false; advance(); }
}

setupLevel(); requestAnimationFrame(draw);
