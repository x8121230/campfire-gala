export function starPilot(s){const p=s.player;let target={x:220,y:240};const items=s.pickups.filter(a=>a.x<750&&a.x>80).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 if(items.length)target={x:Math.min(520,items[0].x),y:items[0].y};else if(s.boss)target={x:230,y:240+Math.sin((s.boss.age+.8)*.65)*105};else{const e=s.enemies.filter(e=>e.x>p.x+180&&e.x<1200).sort((a,b)=>a.x-b.x)[0];if(e)target={x:215,y:e.y};}
 const gate=s.gates.find(g=>g.x>p.x-65&&g.x<p.x+370);if(gate)target={x:200,y:gate.gapY};
 const speed=245+s.upgrades[0]*45,candidates=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[.707,-.707],[-.707,.707],[-.707,-.707]];
 let best=null;for(const [x,y]of candidates){let cost=0;for(const t of [.15,.35,.65]){const px=Math.max(50,Math.min(1225,p.x+x*speed*t)),py=Math.max(28,Math.min(452,p.y+y*speed*t));cost+=(Math.hypot(px-target.x,py-target.y)*.7+Math.max(0,px-620)*3)/3;
 for(const b of s.bullets){const d=Math.hypot(px-(b.x+b.vx*t),py-(b.y+b.vy*t));if(d<58)cost+=(58-d)**2*2;}
 for(const e of s.enemies){let ex=e.x-e.speed*t,ey=e.y;if(e.pattern==='rear')ex=e.x+e.speed*t;if(e.pattern==='top'||e.pattern==='bottom'){ex=e.x-50*t;ey=e.y+(e.pattern==='top'?1:-1)*e.speed*t;}const d=Math.hypot(px-ex,py-ey);if(d<e.r+48)cost+=(e.r+48-d)**2*3;}
 for(const g of s.gates)if(Math.abs(px-(g.x-125*t))<g.w/2+38&&(py<g.gapY-g.gap/2+33||py>g.gapY+g.gap/2-33))cost+=25000;
 if(s.boss?.beam>0&&s.boss.beam-t<1&&Math.abs(py-s.boss.beamY)<58)cost+=20000;
 if(py<40||py>438)cost+=100;if(px<80)cost+=200;
 }if(!best||cost<best.cost)best={x,y,cost};}
 let wanted=s.upgrades[3]<2?3:s.upgrades[4]<2?4:p.shield<2?5:s.upgrades[1]<2?1:0;
 return {x:best.x,y:best.y,fire:true,upgrade:s.cursor===wanted,bomb:best.cost>6000&&s.bombs>0&&p.invuln<.1,dash:best.cost>4000&&p.invuln<.1};}
export function playStar(s,limit=900){for(let i=0;i<limit*60&&s.status==='playing';i++){s.advance(1/60,starPilot(s));s.events=[];}return {status:s.status,time:Math.round(s.time),hp:s.player.hp,score:s.score,stats:s.stats,upgrades:s.upgrades};}
