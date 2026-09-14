(()=>{
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const ui={start:document.getElementById("startPanel"),stage:document.getElementById("stagePanel"),pause:document.getElementById("pausePanel"),finish:document.getElementById("finishPanel"),stageTitle:document.getElementById("stageTitle"),stageHelp:document.getElementById("stageHelp"),stageIcon:document.getElementById("stageIcon"),stageText:document.getElementById("stageText"),roundText:document.getElementById("roundText"),progress:document.getElementById("progressBar"),startBtn:document.getElementById("startBtn"),stageBtn:document.getElementById("stageBtn"),resumeBtn:document.getElementById("resumeBtn"),replayBtn:document.getElementById("replayBtn"),restartBtn:document.getElementById("restartBtn"),toddlerBtn:document.getElementById("toddlerBtn"),hintBtn:document.getElementById("hintBtn"),soundBtn:document.getElementById("soundBtn"),pauseBtn:document.getElementById("pauseBtn")};
const stageInfo=[
 {name:"第一階段：找形狀",title:"先看看形狀",help:"圓形、三角形和星星，哪一塊跟缺口一樣？",icon:"🔷"},
 {name:"第二階段：看大小",title:"再看看大小",help:"形狀一樣時，要選大小剛剛好的雲塊。",icon:"🔍"},
 {name:"第三階段：看方向",title:"最後看看方向",help:"形狀和大小都一樣，還要轉到正確方向。",icon:"🧭"}
];
const silhouettes=["小兔雲","鯨魚雲","城堡雲","星星雲"];
const questions=[
 {shape:"circle",size:46,rot:0,others:["triangle","star"]},
 {shape:"triangle",size:48,rot:0,others:["circle","diamond"]},
 {shape:"star",size:47,rot:0,others:["square","circle"]},
 {shape:"diamond",size:48,rot:0,others:["triangle","capsule"]},
 {shape:"circle",size:44,rot:0,sizes:[27,44,62]},
 {shape:"star",size:48,rot:0,sizes:[65,31,48]},
 {shape:"square",size:45,rot:0,sizes:[45,29,64]},
 {shape:"capsule",size:47,rot:0,sizes:[30,63,47]},
 {shape:"triangle",size:50,rot:0,rots:[Math.PI,0,Math.PI/2]},
 {shape:"triangle",size:49,rot:Math.PI/4,rots:[-Math.PI/4,Math.PI/4,Math.PI*.75]},
 {shape:"capsule",size:48,rot:Math.PI/2,rots:[0,-Math.PI/4,Math.PI/2]},
 {shape:"star",size:48,rot:0,rots:[Math.PI/8,Math.PI/4,0]}
];
const optionXs=[300,480,660], optionY=445, hole={x:640,y:245};
let state,last=performance.now(),audioCtx=null;

function reset(){state={mode:"ready",index:0,toddler:false,hint:false,sound:true,options:[],selected:-1,pointer:{x:0,y:0},drag:false,anim:null,shake:0,success:0,sparkles:[],attempts:0};prepareQuestion();updateHud();}
function tone(freq,d=.12,type="sine",gain=.05){if(!state.sound)return;try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(_){}}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function prepareQuestion(){const q=questions[state.index],stage=Math.floor(state.index/4);let opts=[];
 if(stage===0){opts=[{shape:q.shape,size:q.size,rot:q.rot,correct:true},...q.others.map(s=>({shape:s,size:q.size,rot:0,correct:false}))];}
 if(stage===1){opts=q.sizes.map(s=>({shape:q.shape,size:s,rot:q.rot,correct:s===q.size}));}
 if(stage===2){opts=q.rots.map((r,i)=>({shape:q.shape,size:q.size,rot:r,correct:Math.abs(r-q.rot)<.001}));}
 shuffle(opts);state.options=opts.map((o,i)=>({...o,x:optionXs[i],y:optionY,homeX:optionXs[i],homeY:optionY}));state.selected=-1;state.drag=false;state.anim=null;state.success=0;state.shake=0;}
function hidePanels(){[ui.start,ui.stage,ui.pause,ui.finish].forEach(p=>{p.classList.remove("show");p.setAttribute("aria-hidden","true")})}
function showStage(){state.mode="stage";const s=stageInfo[Math.floor(state.index/4)];ui.stageTitle.textContent=s.title;ui.stageHelp.textContent=s.help;ui.stageIcon.textContent=s.icon;hidePanels();ui.stage.classList.add("show");ui.stage.setAttribute("aria-hidden","false");}
function begin(){reset();hidePanels();showStage();}
function playStage(){hidePanels();state.mode="playing";last=performance.now();canvas.focus();tone(523,.1);setTimeout(()=>tone(659,.13),90)}
function setPaused(v,automatic=false){if(!["playing","paused"].includes(state.mode))return;state.mode=v?"paused":"playing";ui.pauseBtn.textContent=v?"▶ 繼續":"⏸ 暫停";if(v){hidePanels();ui.pause.classList.add("show");ui.pause.setAttribute("aria-hidden","false");ui.pause.querySelector("p").textContent=automatic?"畫面暫停了，準備好再繼續。":"準備好再繼續。"}else{hidePanels();last=performance.now();canvas.focus()}}
function updateHud(){const si=Math.floor(state.index/4);ui.stageText.textContent=stageInfo[Math.min(2,si)].name;ui.roundText.textContent=`${Math.min(12,state.index+1)} / 12`;ui.progress.style.width=`${state.index/12*100}%`;}
function completeOption(i){if(state.mode!=="playing"||state.anim)return;state.selected=i;state.attempts++;const o=state.options[i];state.anim={i,t:0,d:.55,sx:o.x,sy:o.y,tx:hole.x,ty:hole.y};tone(440,.07,"triangle",.035);}
function judge(){const o=state.options[state.selected];if(o.correct){state.success=.85;emit(hole.x,hole.y);tone(659,.13);setTimeout(()=>tone(880,.18),100)}else{state.shake=.55;tone(190,.18,"sine",.04);state.anim={i:state.selected,t:0,d:.42,sx:hole.x,sy:hole.y,tx:o.homeX,ty:o.homeY,returning:true};}}
function next(){state.index++;if(state.index>=questions.length){state.mode="finished";ui.progress.style.width="100%";hidePanels();ui.finish.classList.add("show");ui.finish.setAttribute("aria-hidden","false");tone(660,.15);setTimeout(()=>tone(880,.18),120);setTimeout(()=>tone(1040,.25),260);return}prepareQuestion();updateHud();if(state.index%4===0)showStage();}
function emit(x,y){for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,s=45+Math.random()*105;state.sparkles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.8,size:3+Math.random()*5,color:["#fff373","#ff9bc8","#79e1b6","#9ee8ff"][i%4]})}}

function update(dt){if(state.mode!=="playing")return;if(state.anim){const a=state.anim;a.t=Math.min(a.d,a.t+dt);const p=a.t/a.d,e=1-Math.pow(1-p,3),o=state.options[a.i];o.x=a.sx+(a.tx-a.sx)*e;o.y=a.sy+(a.ty-a.sy)*e;if(p>=1){if(a.returning){state.anim=null;state.selected=-1}else{state.anim=null;judge()}}}
 if(state.success>0){state.success-=dt;if(state.success<=0)next()}state.shake=Math.max(0,state.shake-dt);
 for(const p of state.sparkles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=45*dt;p.life-=dt}state.sparkles=state.sparkles.filter(p=>p.life>0);
}

function pathShape(g,shape,size,rot=0){g.save();g.rotate(rot);g.beginPath();if(shape==="circle")g.arc(0,0,size*.66,0,Math.PI*2);else if(shape==="square")g.rect(-size*.58,-size*.58,size*1.16,size*1.16);else if(shape==="diamond"){g.moveTo(0,-size*.76);g.lineTo(size*.62,0);g.lineTo(0,size*.76);g.lineTo(-size*.62,0);g.closePath()}else if(shape==="triangle"){g.moveTo(0,-size*.78);g.lineTo(size*.72,size*.62);g.lineTo(-size*.72,size*.62);g.closePath()}else if(shape==="capsule"){g.roundRect(-size*.75,-size*.4,size*1.5,size*.8,size*.38)}else if(shape==="star"){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?size*.34:size*.76;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath()}g.restore();}
function drawPiece(o,alpha=1){ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=alpha;ctx.shadowColor="rgba(39,100,139,.24)";ctx.shadowBlur=14;ctx.shadowOffsetY=7;ctx.fillStyle="#fff";ctx.strokeStyle="#83bad2";ctx.lineWidth=4;pathShape(ctx,o.shape,o.size,o.rot);ctx.fill();ctx.stroke();ctx.shadowColor="transparent";ctx.fillStyle="rgba(179,232,250,.45)";ctx.translate(-5,-7);ctx.scale(.7,.7);pathShape(ctx,o.shape,o.size,o.rot);ctx.fill();ctx.restore();}
function cloudBlob(g,type){g.beginPath();const blobs={0:[[-120,10,72],[-55,-35,76],[18,-26,88],[90,5,72],[5,28,112],[-112,-78,38],[-142,-105,30]],1:[[-100,10,75],[-30,-35,93],[65,-25,82],[125,0,55],[5,30,118],[144,-25,32]],2:[[-110,15,68],[-40,-20,80],[35,-18,84],[105,15,68],[0,35,118],[-80,-92,42],[0,-110,46],[80,-88,40]],3:[[-105,5,75],[-42,-45,82],[40,-43,82],[106,5,74],[0,35,112],[0,-110,42]]}[type];for(const [x,y,r] of blobs)g.moveTo(x+r,y),g.arc(x,y,r,0,Math.PI*2);}
function drawBigCloud(){const q=questions[state.index],type=state.index%4,shakeX=state.shake?Math.sin(state.shake*80)*8:0;const off=document.createElement("canvas");off.width=W;off.height=H;const g=off.getContext("2d");g.save();g.translate(435+shakeX,250);g.fillStyle="#fff";g.strokeStyle="#83bad2";g.lineWidth=5;cloudBlob(g,type);g.fill();g.stroke();g.restore();g.save();g.globalCompositeOperation="destination-out";g.translate(hole.x+shakeX,hole.y);pathShape(g,q.shape,q.size+5,q.rot);g.fill();g.restore();ctx.drawImage(off,0,0);
 ctx.save();ctx.translate(hole.x+shakeX,hole.y);ctx.strokeStyle=state.hint?"#ffd04e":"rgba(65,128,160,.7)";ctx.lineWidth=state.hint?8:4;ctx.setLineDash(state.hint?[]:[8,8]);ctx.shadowColor=state.hint?"#fff29d":"transparent";ctx.shadowBlur=state.hint?18:0;pathShape(ctx,q.shape,q.size+5,q.rot);ctx.stroke();ctx.restore();
 ctx.save();ctx.font="800 20px sans-serif";ctx.textAlign="center";ctx.fillStyle="#2f6485";ctx.fillText(silhouettes[type],435,104);ctx.restore();}
function drawBackground(){const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#69cdf7");gr.addColorStop(.72,"#e1f8ff");gr.addColorStop(1,"#fff1b8");ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);ctx.fillStyle="rgba(255,255,255,.34)";for(let i=0;i<8;i++){const x=(i*157+Math.sin(performance.now()/1800+i)*20)%W,y=90+(i%3)*85;ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.arc(x+28,y+4,34,0,Math.PI*2);ctx.arc(x+58,y+8,24,0,Math.PI*2);ctx.fill()}ctx.fillStyle="rgba(56,118,154,.15)";ctx.fillRect(0,382,W,158);}
function drawOptions(){for(let i=0;i<state.options.length;i++){const o=state.options[i];ctx.save();ctx.fillStyle=state.hint&&o.correct?"rgba(255,226,91,.36)":"rgba(255,255,255,.3)";ctx.strokeStyle=state.hint&&o.correct?"#ffd04b":"rgba(255,255,255,.76)";ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(o.homeX-88,385,176,128,24);ctx.fill();ctx.stroke();ctx.restore();drawPiece(o,state.selected===i&&state.drag?.82:1);ctx.save();ctx.font="800 18px sans-serif";ctx.textAlign="center";ctx.fillStyle="#386581";ctx.fillText(String(i+1),o.homeX,502);ctx.restore()}}
function drawSparkles(){for(const p of state.sparkles){ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
function render(){drawBackground();drawBigCloud();drawOptions();drawSparkles();if(state.mode==="playing"&&state.toddler){ctx.save();ctx.fillStyle="rgba(255,255,255,.85)";ctx.beginPath();ctx.roundRect(18,330,210,38,16);ctx.fill();ctx.fillStyle="#376681";ctx.font="800 16px sans-serif";ctx.fillText("點一下，小風精靈會幫忙",31,355);ctx.restore()}}
function loop(now){const dt=Math.min(.034,(now-last)/1000||0);last=now;update(dt);render();requestAnimationFrame(loop)}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function optionAt(p){for(let i=state.options.length-1;i>=0;i--)if(Math.hypot(p.x-state.options[i].x,p.y-state.options[i].y)<75)return i;return-1}
canvas.addEventListener("pointerdown",e=>{if(state.mode!=="playing"||state.anim)return;e.preventDefault();const p=canvasPoint(e),i=optionAt(p);if(i<0)return;if(state.toddler){completeOption(i);return}state.selected=i;state.drag=true;state.pointer=p;canvas.setPointerCapture?.(e.pointerId);tone(420,.06,"triangle",.025)});
canvas.addEventListener("pointermove",e=>{if(!state.drag||state.selected<0)return;const p=canvasPoint(e),o=state.options[state.selected];o.x=p.x;o.y=p.y});
function release(e){if(!state.drag||state.selected<0)return;const o=state.options[state.selected],near=Math.hypot(o.x-hole.x,o.y-hole.y)<92;state.drag=false;if(near){o.x=hole.x;o.y=hole.y;judge()}else{state.anim={i:state.selected,t:0,d:.3,sx:o.x,sy:o.y,tx:o.homeX,ty:o.homeY,returning:true}}}
canvas.addEventListener("pointerup",release);canvas.addEventListener("pointercancel",release);
window.addEventListener("keydown",e=>{if(["Digit1","Digit2","Digit3","Numpad1","Numpad2","Numpad3"].includes(e.code)){const n=Number(e.code.slice(-1))-1;if(n>=0&&n<3)completeOption(n)}if(e.code==="KeyP")setPaused(state.mode==="playing")});
ui.startBtn.addEventListener("click",begin);ui.stageBtn.addEventListener("click",playStage);ui.resumeBtn.addEventListener("click",()=>setPaused(false));ui.replayBtn.addEventListener("click",begin);
ui.restartBtn.addEventListener("click",()=>{reset();hidePanels();ui.start.classList.add("show");ui.start.setAttribute("aria-hidden","false");ui.pauseBtn.textContent="⏸ 暫停"});
ui.pauseBtn.addEventListener("click",()=>setPaused(state.mode==="playing"));
ui.toddlerBtn.addEventListener("click",()=>{state.toddler=!state.toddler;ui.toddlerBtn.setAttribute("aria-pressed",String(state.toddler));ui.toddlerBtn.textContent=state.toddler?"👶 幼幼：開":"👶 幼幼模式"});
ui.hintBtn.addEventListener("click",()=>{state.hint=!state.hint;ui.hintBtn.setAttribute("aria-pressed",String(state.hint));ui.hintBtn.textContent=state.hint?"✨ 提示：開":"✨ 提示"});
ui.soundBtn.addEventListener("click",()=>{state.sound=!state.sound;ui.soundBtn.setAttribute("aria-pressed",String(state.sound));ui.soundBtn.textContent=`${state.sound?"🔊":"🔇"} 音效：${state.sound?"開":"關"}`;if(state.sound)tone(620,.09)});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.mode==="playing")setPaused(true,true)});window.addEventListener("blur",()=>{if(state.mode==="playing")setPaused(true,true)});
reset();requestAnimationFrame(loop);
})();
