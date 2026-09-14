(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const courseLength = 4350;
  const baseSpeed = 58;

  const ui = {
    start: document.getElementById("startPanel"),
    pause: document.getElementById("pausePanel"),
    finish: document.getElementById("finishPanel"),
    finishText: document.getElementById("finishText"),
    feathers: document.getElementById("featherText"),
    rings: document.getElementById("ringText"),
    progress: document.getElementById("progressBar"),
    startBtn: document.getElementById("startBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    replayBtn: document.getElementById("replayBtn"),
    restartBtn: document.getElementById("restartBtn"),
    slowBtn: document.getElementById("slowBtn"),
    hintBtn: document.getElementById("hintBtn"),
    soundBtn: document.getElementById("soundBtn"),
    pauseBtn: document.getElementById("pauseBtn")
  };

  const ringsTemplate = [
    [520,320],[900,245],[1280,360],[1690,185],[2100,290],
    [2520,370],[2960,235],[3410,325],[3890,205]
  ];
  const feathersTemplate = [
    [350,300],[700,220],[1050,300],[1450,255],[1860,345],[2250,220],
    [2700,290],[3150,190],[3600,375],[4050,275],[4180,210],[4270,245]
  ];
  const obstaclesTemplate = [
    [760,380,72],[1120,155,60],[1510,390,78],[1930,165,70],
    [2370,410,78],[2790,145,62],[3230,400,80],[3710,145,66]
  ];

  let state;
  let lastTime = performance.now();
  let audioCtx = null;

  function resetState() {
    state = {
      mode: "ready",
      held: false,
      y: 300,
      vy: 0,
      worldX: 0,
      feathers: 0,
      rings: 0,
      slow: false,
      hint: true,
      sound: true,
      inactive: 0,
      flash: 0,
      bump: 0,
      time: 0,
      ringsData: ringsTemplate.map(([x,y]) => ({x,y,hit:false})),
      feathersData: feathersTemplate.map(([x,y]) => ({x,y,hit:false})),
      obstacles: obstaclesTemplate.map(([x,y,r]) => ({x,y,r,hitCooldown:0})),
      particles: []
    };
    updateHud();
  }

  function tone(freq, duration=.11, type="sine", gain=.05) {
    if (!state.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, audioCtx.currentTime);
      amp.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      osc.connect(amp).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function begin() {
    resetState();
    state.mode = "playing";
    hidePanels();
    canvas.focus();
    tone(523,.12); setTimeout(() => tone(659,.13),90);
  }

  function hidePanels() {
    [ui.start, ui.pause, ui.finish].forEach(el => {
      el.classList.remove("show");
      el.setAttribute("aria-hidden", "true");
    });
  }

  function setPaused(value, automatic=false) {
    if (state.mode !== "playing" && state.mode !== "paused") return;
    state.mode = value ? "paused" : "playing";
    ui.pauseBtn.textContent = value ? "▶ 繼續" : "⏸ 暫停";
    if (value) {
      hidePanels();
      ui.pause.classList.add("show");
      ui.pause.setAttribute("aria-hidden", "false");
      ui.pause.querySelector("p").textContent = automatic ? "畫面暫停了，準備好再繼續飛。" : "準備好再繼續飛。";
    } else {
      hidePanels();
      canvas.focus();
      lastTime = performance.now();
    }
  }

  function finish() {
    state.mode = "finished";
    state.held = false;
    ui.finishText.textContent = `找到 ${state.feathers} 枚星羽，穿過 ${state.rings} 個順風圈！`;
    hidePanels();
    ui.finish.classList.add("show");
    ui.finish.setAttribute("aria-hidden", "false");
    tone(659,.16); setTimeout(() => tone(784,.18),130); setTimeout(() => tone(1047,.3),260);
  }

  function updateHud() {
    ui.feathers.textContent = `${state.feathers} / ${feathersTemplate.length}`;
    ui.rings.textContent = `${state.rings} / ${ringsTemplate.length}`;
    ui.progress.style.width = `${Math.min(100, state.worldX/courseLength*100)}%`;
  }

  function playerWorldX() { return state.worldX + 220; }
  function distance(x1,y1,x2,y2) { return Math.hypot(x1-x2,y1-y2); }

  function emit(x,y,color,count=12) {
    for (let i=0;i<count;i++) {
      const a = Math.random()*Math.PI*2;
      const s = 25+Math.random()*75;
      state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.75,size:3+Math.random()*5,color});
    }
  }

  function targetY() {
    const px = playerWorldX();
    const candidates = state.ringsData.filter(r => !r.hit && r.x > px-40);
    return candidates.length ? candidates[0].y : 270;
  }

  function update(dt) {
    if (state.mode !== "playing") return;
    const scale = state.slow ? .64 : 1;
    const t = dt * scale;
    state.time += t;
    state.worldX += baseSpeed * t;
    state.inactive += dt;
    state.flash = Math.max(0,state.flash-dt);
    state.bump = Math.max(0,state.bump-dt);

    const assist = state.inactive > 4.2;
    if (assist) {
      const delta = targetY() - state.y;
      state.vy += Math.sign(delta) * Math.min(90,Math.abs(delta)*.55) * t;
    } else {
      state.vy += (state.held ? -235 : 168) * t;
    }
    state.vy *= Math.pow(.985, t*60);
    state.vy = Math.max(-155,Math.min(145,state.vy));
    state.y += state.vy*t;

    if (state.y < 90) { state.y=90; state.vy=Math.abs(state.vy)*.45; }
    if (state.y > 465) { state.y=465; state.vy=-Math.abs(state.vy)*.48; }

    const px = playerWorldX();
    for (const ring of state.ringsData) {
      if (!ring.hit && distance(px,state.y,ring.x,ring.y) < 48) {
        ring.hit=true; state.rings++; state.flash=.3;
        emit(220,state.y,"#fff073",18); tone(740,.12,"sine",.055);
      }
    }
    for (const feather of state.feathersData) {
      if (!feather.hit && distance(px,state.y,feather.x,feather.y) < 34) {
        feather.hit=true; state.feathers++; emit(220,state.y,"#fff9c9",12); tone(980,.09,"triangle",.045);
      }
    }
    for (const cloud of state.obstacles) {
      cloud.hitCooldown = Math.max(0,cloud.hitCooldown-t);
      if (!cloud.hitCooldown && distance(px,state.y,cloud.x,cloud.y) < cloud.r+24) {
        cloud.hitCooldown=1.3; state.bump=.45;
        state.vy = state.y < cloud.y ? -90 : 90;
        state.worldX = Math.max(0,state.worldX-18);
        emit(220,state.y,"#d9ecf3",9); tone(180,.18,"sine",.045);
      }
    }

    for (const p of state.particles) {
      p.x += p.vx*t; p.y += p.vy*t; p.vy += 35*t; p.life -= t;
    }
    state.particles = state.particles.filter(p => p.life>0);
    updateHud();
    if (state.worldX >= courseLength) finish();
  }

  function roundedRect(x,y,w,h,r) {
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r); return ctx;
  }

  function drawCloud(x,y,s=1,gray=false,alpha=1) {
    ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.globalAlpha=alpha;
    ctx.fillStyle = gray ? "#b7cbd6" : "#ffffff";
    ctx.strokeStyle = gray ? "#8ca6b4" : "rgba(101,171,205,.28)";
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.arc(-35,5,29,0,Math.PI*2); ctx.arc(-4,-14,38,0,Math.PI*2);
    ctx.arc(34,0,32,0,Math.PI*2); ctx.arc(4,12,48,0,Math.PI*2);
    ctx.fill(); ctx.stroke();
    if (gray) {
      ctx.strokeStyle="#688696"; ctx.lineWidth=4; ctx.lineCap="round";
      ctx.beginPath(); ctx.arc(-18,8,6,.1,Math.PI-.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(20,8,6,.1,Math.PI-.1); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBackground() {
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#6ccdf9"); sky.addColorStop(.67,"#dff7ff"); sky.addColorStop(1,"#fff0af");
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,246,150,.85)"; ctx.beginPath(); ctx.arc(830,95,48,0,Math.PI*2); ctx.fill();
    for(let i=0;i<7;i++) {
      const x=((i*205-state.worldX*.12)%1250+1250)%1250-100;
      drawCloud(x,90+(i%3)*125,.55+(i%2)*.18,false,.46);
    }
    ctx.fillStyle="rgba(123,190,214,.22)";
    for(let i=0;i<5;i++) {
      const x=((i*270-state.worldX*.25)%1400+1400)%1400-200;
      ctx.beginPath(); ctx.ellipse(x,H-35,145,44,0,0,Math.PI*2); ctx.fill();
    }
  }

  function drawWindHint() {
    if (!state.hint || state.mode!=="playing") return;
    const ty=targetY();
    ctx.save(); ctx.strokeStyle="rgba(255,255,255,.62)"; ctx.lineWidth=5; ctx.setLineDash([10,14]);
    ctx.beginPath(); ctx.moveTo(285,state.y); ctx.bezierCurveTo(390,state.y,440,ty,570,ty); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle="rgba(255,255,255,.8)";
    ctx.beginPath(); ctx.moveTo(575,ty); ctx.lineTo(553,ty-11); ctx.lineTo(553,ty+11); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawRing(r) {
    const x=r.x-state.worldX; if(x<-80||x>W+80||r.hit)return;
    const pulse=1+Math.sin(state.time*4+r.x)*.045;
    ctx.save(); ctx.translate(x,r.y); ctx.scale(pulse,pulse);
    const colors=["#ff7b9c","#ffca55","#72dc9e","#63c9f4","#ad8bf4"];
    colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,43-i*4,0,Math.PI*2);ctx.stroke();});
    ctx.fillStyle="rgba(255,255,255,.28)"; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawFeather(f) {
    const x=f.x-state.worldX; if(x<-40||x>W+40||f.hit)return;
    ctx.save(); ctx.translate(x,f.y+Math.sin(state.time*3+f.x)*6); ctx.rotate(-.38);
    ctx.shadowColor="#fff5a5";ctx.shadowBlur=16;ctx.fillStyle="#fff8c5";ctx.strokeStyle="#e6b64d";ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,10,23,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,23);ctx.moveTo(0,-3);ctx.lineTo(8,-9);ctx.moveTo(0,5);ctx.lineTo(-8,0);ctx.stroke();
    ctx.restore();
  }

  function drawIsland() {
    const x=courseLength-state.worldX+215; if(x>W+260)return;
    ctx.save();ctx.translate(x,380);
    ctx.fillStyle="#8ee28f";ctx.beginPath();ctx.ellipse(0,0,180,53,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#a98263";ctx.beginPath();ctx.moveTo(-155,12);ctx.quadraticCurveTo(0,205,155,12);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e6fff0";for(let i=-2;i<=2;i++)drawCloud(i*58,12,.62,false,.8);
    ctx.fillStyle="#ffd662";ctx.beginPath();ctx.arc(0,-55,24,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const bob=Math.sin(state.time*5)*2;
    ctx.save();ctx.translate(220+(state.bump?Math.sin(state.bump*60)*5:0),state.y+bob);ctx.rotate(state.vy*.0014);
    ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=5;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-75,-4);ctx.lineTo(-36,-4);ctx.moveTo(-66,12);ctx.lineTo(-33,9);ctx.stroke();
    ctx.fillStyle="#79d695";ctx.strokeStyle="#2e7f76";ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(-37,4);ctx.quadraticCurveTo(-4,-34,44,-4);ctx.quadraticCurveTo(4,12,-37,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#ffe09a";ctx.beginPath();ctx.ellipse(5,0,20,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#6a493d";ctx.beginPath();ctx.arc(4,-11,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(9,-13,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#274252";ctx.beginPath();ctx.arc(10,-13,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f08f65";ctx.beginPath();ctx.moveTo(35,0);ctx.lineTo(49,5);ctx.lineTo(35,9);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life/.75);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }

  function drawReadyLabel() {
    if(state.mode!=="playing" || state.inactive>3.2)return;
    ctx.save();ctx.font="800 18px sans-serif";ctx.textAlign="center";ctx.fillStyle="rgba(35,80,110,.82)";
    roundedRect(120,438,200,42,18);ctx.fillStyle="rgba(255,255,255,.82)";ctx.fill();
    ctx.fillStyle="#315e79";ctx.fillText(state.held?"很好，正在上升！":"按住畫面往上飛",220,466);ctx.restore();
  }

  function render() {
    drawBackground(); drawIsland(); drawWindHint();
    state.ringsData.forEach(drawRing); state.feathersData.forEach(drawFeather);
    state.obstacles.forEach(c=>{const x=c.x-state.worldX;if(x>-120&&x<W+120)drawCloud(x,c.y,c.r/70,true,.95);});
    drawPlayer(); drawParticles(); drawReadyLabel();
    if(state.flash){ctx.fillStyle=`rgba(255,249,165,${state.flash*.32})`;ctx.fillRect(0,0,W,H);}
  }

  function loop(now) {
    const dt=Math.min(.034,(now-lastTime)/1000||0);lastTime=now;update(dt);render();requestAnimationFrame(loop);
  }

  function setHeld(value) {
    if(state.mode!=="playing")return;
    state.held=value;state.inactive=0;
  }

  canvas.addEventListener("pointerdown",e=>{e.preventDefault();canvas.setPointerCapture?.(e.pointerId);setHeld(true);});
  canvas.addEventListener("pointerup",e=>{e.preventDefault();setHeld(false);});
  canvas.addEventListener("pointercancel",()=>setHeld(false));
  window.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();setHeld(true);}if(e.code==="KeyP")setPaused(state.mode==="playing");});
  window.addEventListener("keyup",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();setHeld(false);}});

  ui.startBtn.addEventListener("click",begin);
  ui.replayBtn.addEventListener("click",begin);
  ui.restartBtn.addEventListener("click",()=>{resetState();hidePanels();ui.start.classList.add("show");ui.start.setAttribute("aria-hidden","false");ui.pauseBtn.textContent="⏸ 暫停";});
  ui.pauseBtn.addEventListener("click",()=>setPaused(state.mode==="playing"));
  ui.resumeBtn.addEventListener("click",()=>setPaused(false));
  ui.slowBtn.addEventListener("click",()=>{state.slow=!state.slow;ui.slowBtn.setAttribute("aria-pressed",String(state.slow));ui.slowBtn.textContent=state.slow?"🐢 慢速：開":"🐢 慢慢玩";});
  ui.hintBtn.addEventListener("click",()=>{state.hint=!state.hint;ui.hintBtn.setAttribute("aria-pressed",String(state.hint));ui.hintBtn.textContent=`✨ 提示：${state.hint?"開":"關"}`;});
  ui.soundBtn.addEventListener("click",()=>{state.sound=!state.sound;ui.soundBtn.setAttribute("aria-pressed",String(state.sound));ui.soundBtn.textContent=`${state.sound?"🔊":"🔇"} 音效：${state.sound?"開":"關"}`;if(state.sound)tone(620,.09);});

  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.mode==="playing")setPaused(true,true);});
  window.addEventListener("blur",()=>{if(state.mode==="playing")setPaused(true,true);});

  resetState(); requestAnimationFrame(loop);
})();
