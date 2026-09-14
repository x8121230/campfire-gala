// QA drives the public controls only. No health, position, enemy or result writes.
import {AssaultSession} from '../../src/data/AssaultRules.js';
const routes=[
  [[635,380],[940,285],[1340,380],[1440,480],[1840,480],[2150,380],[2480,285],[2920,380],[3300,480]],
  [[550,380],[890,280],[1090,480],[1470,480],[1780,375],[2010,275],[2130,480],[2510,480],[2750,380],[3030,280],[3160,480],[3570,480]],
  [[550,380],[840,280],[915,480],[1090,480],[1250,480],[1410,480],[1660,380],[1900,280],[2080,480],[2290,480],[2390,480],[2670,380],[2990,280],[3340,480]],
  [[530,380],[850,280],[1260,480],[1650,480],[1800,380],[2080,280],[2390,380],[2450,480],[3000,480],[3180,380],[3490,280],[3690,480]],
  [[660,380],[980,280],[1200,480],[1470,480],[1540,380],[1710,480],[2170,480],[2410,380],[2730,280],[3090,380],[3160,480],[3400,480],[3780,480]],
  [[590,380],[900,280],[960,480],[1270,380],[1650,280],[1740,480],[2150,480],[2310,480],[2370,380],[2730,280],[3100,380],[3440,280],[3420,480],[3650,480],[4030,480]],
];
export function createAssaultPilot(){return {waypoint:0,death:0,frame:0,bossAge:0};}
function bossPilot(s,ctx){
  // Short predictive rollouts choose ordinary button presses. Every rollout uses
  // a disposable copy; the real session is changed only by advance(input).
  if(ctx.planLeft>0){ctx.planLeft--;return {...ctx.plan,jump:false,dash:false,grenade:false};}
  const p=s.player,b=s.boss,desired=b.type==='owl'?b.x:b.x-290,candidates=[];
  for(const axis of [-1,0,1])for(const stance of ['normal','jump','crouch','dash','up']){
    if(stance==='dash'&&p.dashCooldown>0||stance==='jump'&&!p.grounded)continue;
    candidates.push({axis,fire:true,weapon:Math.abs(b.x-p.x)<260&&p.ammo[1]>0?1:0,jump:stance==='jump',down:stance==='crouch',dash:stance==='dash',up:stance==='up',grenade:p.grenades>0&&b.exposed&&Math.abs(b.x-p.x)<355&&ctx.frame%11===0});
  }
  let best=null;
  for(const action of candidates){
    const q=Object.assign(Object.create(AssaultSession.prototype),JSON.parse(JSON.stringify(s)));
    for(let n=0;n<18;n++){q.advance(1/30,n===0?action:{...action,jump:false,dash:false,grenade:false});q.events=[];if(q.respawnDelay>0)break;}
    const qb=q.boss,partBefore=b.parts.reduce((v,p)=>v+p.hp,0),partAfter=qb?.parts.reduce((v,p)=>v+p.hp,0)||0;
    const cost=(q.stats.damage-s.stats.damage)*350+(q.stats.deaths-s.stats.deaths)*5000+(p.hp-q.player.hp)*20+
      Math.abs(q.player.x-desired)*.028+(qb?.hp-b.hp)*.38+(partAfter-partBefore)*.1+(q.player.y>530?2000:0)+
      (action.dash?1.6:0)+(action.jump?.2:0)+(b.type!=='owl'&&q.player.y<350?9:0);
    if(!best||cost<best.cost)best={cost,action};
  }
  ctx.plan=best.action;ctx.planLeft=2;return best.action;
}
export function assaultPilot(s,ctx){
  ctx.frame++;const p=s.player,l=s.level,input={axis:0,fire:true,weapon:0};
  if(ctx.death!==s.stats.deaths){ctx.death=s.stats.deaths;ctx.waypoint=routes[l.id-1].findIndex(r=>r[0]>s.snapshot.player.x-45);if(ctx.waypoint<0)ctx.waypoint=routes[l.id-1].length;}
  if(s.respawnDelay>0)return {};
  if(s.boss?.hp<=0){input.axis=1;return input;}
  if(s.boss)return bossPilot(s,ctx);
  const route=ctx.tankRoute?[[430,480],[1600,480],[1710,480],[2170,480],[3140,480],[3400,480],[3780,480]]:routes[l.id-1];let target=route[ctx.waypoint]||[l.boss.arena+100,480];
  if(Math.abs(p.x-target[0])<23&&Math.abs(p.y-target[1])<12&&p.grounded){ctx.waypoint++;target=route[ctx.waypoint]||[l.boss.arena+100,480];}
  input.axis=Math.abs(target[0]-p.x)>6?Math.sign(target[0]-p.x):0;
  const platform=l.platforms.find(r=>r.y===target[1]&&target[0]>r.x&&target[0]<r.x+r.w);
  if(p.grounded&&target[1]<p.y-15&&platform){if(p.x>platform.x-115&&p.x<platform.x+platform.w+115)input.jump=!s.previous.jump;}
  if(p.grounded&&p.groundId?.startsWith('p')&&s.solids().find(r=>r.id===p.groundId)?.oneWay&&target[1]>p.y+30&&Math.abs(p.x-target[0])<45){input.down=true;input.jump=!s.previous.jump;}
  if(!p.grounded&&platform&&target[1]<480&&p.y<target[1]+15&&p.x<platform.x-20&&p.vy>0&&p.dashCooldown<=0)input.dash=true;
  // Jump before a ledge or low solid obstacle. Bridge switches use the same E action.
  if(p.grounded&&input.axis){
    const ahead=p.x+input.axis*45,solids=s.solids(),support=solids.some(r=>r.y>=p.y-5&&r.y<p.y+35&&ahead>r.x&&ahead<r.x+r.w);
    if(!support)input.jump=!s.previous.jump;
    if(solids.some(r=>!r.oneWay&&!r.id.startsWith('o')&&r.y<p.y-20&&r.y>p.y-135&&ahead>r.x-10&&ahead<r.x+r.w+10))input.jump=!s.previous.jump;
  }
  if(l.switches.some((v,i)=>!s.switches[i]&&Math.abs(v.x-p.x)<70&&Math.abs(v.y-(p.y-25))<60)){input.interact=!s.previous.interact;input.axis=0;}
  const obstacle=s.objects.find(o=>o.hp>0&&o.kind!=='cage'&&o.x>p.x&&o.x-p.x<180&&o.y< p.y-20&&o.y+o.h>p.y-40);
  if(obstacle){input.axis=0;input.jump=false;input.down=false;if(p.facing<0)input.axis=1;input.weapon=1;}
  const cage=s.objects.find(o=>o.kind==='cage'&&!o.rescued&&Math.abs(o.x+24-p.x)<130&&Math.abs(o.y+o.h-p.y)<20);
  if(cage){if(cage.hp>0){input.axis=Math.sign(cage.x+24-p.x);if(Math.abs(cage.x+24-p.x)<70&&p.facing===Math.sign(cage.x+24-p.x))input.axis=0;}else input.axis=Math.sign(cage.x+24-p.x);}
  const near=s.enemies.find(e=>Math.abs(e.x-p.x)<370&&Math.abs(e.y-p.y)<65);
  if(near&&near.x>p.x&&p.grounded){input.weapon=near.x-p.x<255&&p.ammo[1]>0?1:0;if(near.x-p.x<190){input.axis=0;if(!input.jump)input.down=true;}if(near.kind==='shield'&&ctx.frame%30===0)input.grenade=true;}
  const hazard=l.hazards.find(h=>p.x>h.x-70&&p.x<h.x+h.w+10&&h.h<100&&p.grounded);
  if(hazard&&!obstacle)input.jump=!s.previous.jump;
  if(ctx.tankRoute&&p.tank<0&&!l.switches.some((v,i)=>!s.switches[i]&&Math.abs(v.x-p.x)<90)&&s.tanks.some(t=>t.hp>0&&Math.abs(t.x-p.x)<80&&Math.abs(t.y-p.y)<70&&!l.switches.some((v,i)=>!s.switches[i]&&Math.abs(v.x-t.x)<150))){input.interact=!s.previous.interact;input.axis=0;}
  return input;
}
