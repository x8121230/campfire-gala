// QA pilot: only returns ordinary controls. Never edits health, enemies, timers or objectives.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function skyPilot(s){
 const p=s.player,b=s.boss;let gx=320,gy=s.escort?425:500,priority=1;
 const birds=s.pickups.filter(o=>o.kind==='bird').sort((a,b)=>b.y-a.y),power=s.pickups.filter(o=>o.kind!=='bird'&&o.y>120&&o.y<600).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 if(b&&b.y>20){const part=b.parts.find(q=>q.hp>0);gx=b.x+(part?part.side*65:0);gy=470;}
 else if(s.enemies.length){const target=[...s.enemies].filter(e=>e.y>0&&e.y<580).sort((a,b)=>b.y-a.y)[0];if(target)gx=target.x;}
 if(power.length&&(!b||p.power<4)){gx=power[0].x;gy=clamp(power[0].y+35,210,570);priority=1.4;}
 if(birds.length){gx=birds[0].x;gy=clamp(birds[0].y+20,185,570);priority=3;}
 const dangers=s.bullets.filter(q=>q.y>p.y-230&&Math.abs(q.x-p.x)<240),enemies=s.enemies.filter(e=>e.y>p.y-150&&e.y<p.y+110);
 let best={x:p.x,y:p.y,cost:Infinity};const points=[];for(const dx of [-115,-60,0,60,115])for(const dy of [-95,-45,0,45,95])points.push({x:clamp(p.x+dx,24,616),y:clamp(p.y+dy,180,585)});points.push({x:clamp(gx,24,616),y:gy});
 for(const q of points){let cost=Math.hypot(q.x-gx,(q.y-gy)*1.1)*priority+.12*Math.hypot(q.x-p.x,q.y-p.y);const dist=Math.hypot(q.x-p.x,q.y-p.y),dx=(q.x-p.x)/(dist||1),dy=(q.y-p.y)/(dist||1);
  for(const t of [.15,.35,.6]){const travel=Math.min(dist,340*t),x=p.x+dx*travel,y=p.y+dy*travel;for(const a of dangers){const d=Math.hypot(x-(a.x+a.vx*t),y-(a.y+a.vy*t));if(d<60)cost+=(60-d)**2*(p.invuln>.7?.01:1.8);}for(const e of enemies){const d=Math.hypot(x-e.x,y-e.y-e.speed*t);if(d<e.r+35)cost+=(e.r+35-d)**2*3;}for(const h of s.hazards)if(h.age+t>=h.warn-.15&&h.age+t<h.warn+h.active){const d=Math.abs(x-h.x);if(d<h.w/2+22)cost+=4500;}}
  if(cost<best.cost)best={...q,cost};
 }
 const imminent=dangers.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<80).length;const bomb=p.bombs>0&&s.bombCooldown<=0&&((imminent>=5&&p.invuln<.3)||(s.escort?.hp<=3&&dangers.length>7)||(b&&b.age>5&&Math.floor(s.time*2)%16===0));
 return {target:{x:best.x,y:best.y},weapon:3,bomb,dash:imminent>=3&&p.dashCooldown<=0&&p.invuln<.2};
}
