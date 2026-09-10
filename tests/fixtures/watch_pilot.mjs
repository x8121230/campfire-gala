import {NightWatchSession,WATCH_WORLD} from '../../src/data/NightWatchRules.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function route(p,target){
 const size=52,cols=37,rows=19,at=(x,y)=>({x:110+x*size,y:100+y*size}),cell=q=>({x:Math.max(0,Math.min(cols-1,Math.round((q.x-110)/size))),y:Math.max(0,Math.min(rows-1,Math.round((q.y-100)/size)))});
 const start=cell(p),end=cell(target),id=n=>n.y*cols+n.x,open=[start],seen=new Set([id(start)]),prev=new Map();let found=null;
 while(open.length){const n=open.shift();if(id(n)===id(end)){found=n;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:n.x+dx,y:n.y+dy};if(q.x<0||q.y<0||q.x>=cols||q.y>=rows||seen.has(id(q)))continue;const pos=at(q.x,q.y);if(WATCH_WORLD.rocks.some(r=>distance(pos,r)<r.r+35))continue;seen.add(id(q));prev.set(id(q),n);open.push(q);}}
 if(!found)return [target];const path=[target];while(id(found)!==id(start)){path.unshift(at(found.x,found.y));found=prev.get(id(found));}return path;
}
export function playWatch(seed=17,upgrade='pierce',builds=['acorn','frost','acorn','bloom']){
 const s=new NightWatchSession({seed});let task=0,path=[],goal=null,stuck=0,last={...s.player};const trail=[];
 const tasks=[...s.caches.map(c=>({type:'cache',id:c.id,...c})),...s.slots.map((c,i)=>({...c,type:'build',id:i,kind:builds[i]})),{type:'tree',...s.tree}];
 for(let frame=0;frame<12000&&s.status==='playing';frame++){
  const p=s.player;let target=null;
  if(s.phase==='prepare'){
   const t=tasks[task];target=t;
   if(t&&distance(p,t)<85){
    if(t.type==='cache')s.interact();else if(t.type==='build')s.build(t.id,t.kind);else if(t.type==='tree'){if(s.startNight())s.choose(upgrade);}
    task++;path=[];goal=null;
   }
  }else if(s.phase==='rest'){
   target=s.tree;if(distance(p,s.tree)<130){s.repair();if(s.startNight())s.choose(upgrade);path=[];goal=null;}
  }else{
   const e=[...s.enemies].sort((a,b)=>distance(a,s.tree)-distance(b,s.tree))[0];
   if(e){const d=distance(e,p);if(d<210){const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1;target={x:p.x+dx/len*130,y:p.y+dy/len*130};}
    else if(d>340)target=e;else{const dx=p.x-e.x,dy=p.y-e.y;target={x:p.x-dy*.25,y:p.y+dx*.25};}
   }else target={x:s.tree.x+150,y:s.tree.y+100};
  }
  let mx=0,my=0;
  if(target){target={x:Math.max(130,Math.min(1900,target.x)),y:Math.max(130,Math.min(1030,target.y))};
   if(!goal||distance(goal,target)>80||stuck>12){path=route(p,target);goal=target;stuck=0;}
   while(path.length>1&&distance(p,path[0])<26)path.shift();const t=path[0]||target,dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>12){mx=dx/d;my=dy/d;}
  }
  const danger=s.enemies.some(e=>e.state==='warn'&&(e.kind==='bear'?distance(p,e.aim)<180:distance(p,e)<220));
  const close=s.enemies.filter(e=>distance(e,p)<225).length;
  const input={x:mx,y:my,fire:true,dash:danger&&s.player.dashCD<=0,skill:close>=2||p.hp<70&&close>0};
  s.advance(.05,input);s.events.length=0;
  if(frame%20===0)trail.push({t:Math.round(s.time),phase:s.phase,wave:s.wave,hp:Math.round(p.hp),tree:Math.round(s.tree.hp),x:Math.round(p.x),y:Math.round(p.y),enemies:s.enemies.length});
  if(distance(p,last)<1&&Math.hypot(mx,my)>.2)stuck++;else stuck=0;last={x:p.x,y:p.y};
 }
 return {s,trail};
}
