// First authored chapter. Simulation has no host-save writes or renderer dependency.
export const WATCH_WORLD={width:2048,height:1152,tree:{x:1024,y:530,r:58},
 rocks:[{x:640,y:365,r:67},{x:1425,y:386,r:74},{x:659,y:852,r:65},{x:1375,y:836,r:64}],
 caches:[{x:300,y:255},{x:1740,y:260},{x:1740,y:938}],
 slots:[{x:839,y:488},{x:1010,y:326},{x:1220,y:486},{x:1053,y:735}],
 gates:[{x:1024,y:95},{x:115,y:575},{x:1933,y:575},{x:1000,y:1057}]};
export const WATCH_BUILDS={
 acorn:{name:'松果砲台',cost:30,hp:95,range:420,rate:.72,damage:13,tip:'持續射擊，守住主要路線'},
 frost:{name:'月霜蘑菇',cost:25,hp:110,range:250,rate:2.1,damage:9,tip:'範圍緩速，爭取閃避時間'},
 bloom:{name:'療癒花燈',cost:25,hp:85,range:260,rate:2.3,damage:0,tip:'修復月光樹並治療附近主角'}
};
export const WATCH_UPGRADES=[
 {id:'scatter',name:'星芒分枝',tip:'多兩道散射星光；近身爆發更強'},
 {id:'pierce',name:'穿林光矢',tip:'星光多穿透兩隻動物，威力增加'},
 {id:'renewal',name:'月泉祝福',tip:'淨化波更快恢復，並額外治療自己'}
];
const KINDS={wolf:{hp:52,speed:99,r:23,damage:11,range:160,warn:.55},boar:{hp:115,speed:72,r:30,damage:18,range:265,warn:.9},bear:{hp:1120,speed:52,r:49,damage:25,range:165,warn:1.05}};
export const WATCH_CONTROLS={joystick:{x:154,y:613,r:83},attack:{x:1165,y:611,r:72},dash:{x:979,y:643,r:52},skill:{x:1050,y:493,r:53},interact:{x:785,y:647,w:170,h:82}};
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function direction(x,y){const d=Math.hypot(x,y);return d>0?{x:x/d,y:y/d}:{x:0,y:0};}
export function segmentHit(ax,ay,bx,by,cx,cy,r){const dx=bx-ax,dy=by-ay,t=clamp(((cx-ax)*dx+(cy-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+t*dx-cx,ay+t*dy-cy)<=r;}
export class WatchTouch{
 constructor(){this.reset();}
 reset(){this.owner=null;this.origin={...WATCH_CONTROLS.joystick};this.axis={x:0,y:0};this.fire=new Set();this.requests={};}
 down(p){
  if(p.x<350&&p.y>476){if(this.owner===null){this.owner=p.id;this.origin={x:clamp(p.x,85,270),y:clamp(p.y,540,635)};this.move(p);}return;}
  for(const key of ['attack','dash','skill']){const z=WATCH_CONTROLS[key];if(Math.hypot(p.x-z.x,p.y-z.y)<=z.r){if(key==='attack')this.fire.add(p.id);else this.requests[key]=true;return;}}
  const z=WATCH_CONTROLS.interact;if(Math.abs(p.x-z.x)<=z.w/2&&Math.abs(p.y-z.y)<=z.h/2)this.requests.interact=true;
 }
 move(p){if(p.id!==this.owner)return;const dx=p.x-this.origin.x,dy=p.y-this.origin.y,len=Math.hypot(dx,dy),amount=clamp((len-9)/65,0,1),dir=direction(dx,dy);this.axis={x:dir.x*amount,y:dir.y*amount};}
 up(p){if(p.id===this.owner){this.owner=null;this.axis={x:0,y:0};}this.fire.delete(p.id);}
 read(){return {x:this.axis.x,y:this.axis.y,fire:this.fire.size>0,...this.requests};}
 consume(){this.requests={};}
}
export class NightWatchSession{
 constructor({seed=17}={}){
  this.seed=seed>>>0;this.time=0;this.accumulator=0;this.phase='prepare';this.status='playing';this.paused=false;this.wave=0;this.queue=[];this.enemies=[];this.shots=[];this.zones=[];this.events=[];this.serial=0;this.wood=35;
  this.tree={...WATCH_WORLD.tree,hp:260,maxHp:260};
  this.player={x:1024,y:700,r:20,hp:110,maxHp:110,aim:{x:0,y:-1},fireCD:0,dashCD:0,skillCD:0,invincible:0,dashing:0,dashDir:{x:0,y:-1},hurt:0};
  this.caches=WATCH_WORLD.caches.map((c,i)=>({...c,id:i,opened:false}));this.slots=WATCH_WORLD.slots.map((p,i)=>({...p,id:i,kind:null,hp:0,cooldown:0}));this.upgrades={scatter:0,pierce:0,renewal:0};this.stats={cleansed:0,damage:0,caches:0,dashes:0,skills:0};this.pendingChoice=false;this.message='找補給、建設防線，準備好後回月光樹開始守夜。';
  for(const c of this.caches)for(let i=0;i<2;i++)this.spawn('wolf',c.x+65+i*40,c.y+65,true);
 }
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});if(this.events.length>120)this.events.shift();}
 setPaused(on){this.paused=!!on;this.accumulator=0;}
 spawn(kind,x,y,scout=false){if(this.enemies.length>=45)return;const k=KINDS[kind];this.enemies.push({id:++this.serial,kind,x,y,...k,maxHp:k.hp,cooldown:1+this.random(),state:'walk',timer:0,slow:0,flash:0,scout,home:{x,y},stage2:false,vulnerable:0});}
 moveBody(body,dx,dy){
  const pieces=Math.max(1,Math.ceil(Math.hypot(dx,dy)/10));
  for(let i=0;i<pieces;i++){
   body.x=clamp(body.x+dx/pieces,85,WATCH_WORLD.width-85);body.y=clamp(body.y+dy/pieces,85,WATCH_WORLD.height-85);
   for(const rock of WATCH_WORLD.rocks){const d=hypot(body,rock),reach=body.r+rock.r;if(d<reach){const n=direction(body.x-rock.x||1,body.y-rock.y);body.x=rock.x+n.x*reach;body.y=rock.y+n.y*reach;}}
  }
 }
 available(){
  const p=this.player;const cache=this.caches.find(c=>!c.opened&&hypot(p,c)<105);if(cache)return {type:'cache',id:cache.id,label:'拾取補給'};
  const slot=this.slots.find(c=>hypot(p,c)<102);if(slot)return {type:'slot',id:slot.id,label:slot.kind?'維修／改建':'建設防線'};
  if(hypot(p,this.tree)<153)return {type:'tree',label:this.phase==='prepare'?'開始守夜':this.phase==='rest'?'迎接下一波':'修復月光樹'};
  return null;
 }
 interact(){if(this.status!=='playing'||this.paused||this.pendingChoice)return null;const a=this.available();if(a?.type==='cache'){
   const c=this.caches[a.id];c.opened=true;this.wood+=25;this.stats.caches++;this.player.hp=Math.min(this.player.maxHp,this.player.hp+20);this.emit('cache',c.x,c.y);this.message='補給 +25 木材，體力回復。可回樹旁選擇建設。';
  }return a;
 }
 build(id,kind){
  const s=this.slots[id],b=WATCH_BUILDS[kind];if(!s||!b||hypot(this.player,s)>110||this.status!=='playing'||this.wood<b.cost)return false;
  // Building choices are made in a paused menu; no input can advance combat there.
  this.wood-=b.cost;s.kind=kind;s.hp=b.hp;s.maxHp=b.hp;s.cooldown=.1;this.emit('build',s.x,s.y);return true;
 }
 repair(id='tree'){
  const t=id==='tree'?this.tree:this.slots[id];if(!t||t.hp<=0||t.hp>=t.maxHp||hypot(this.player,t)>165||this.wood<15||this.status!=='playing')return false;
  this.wood-=15;t.hp=Math.min(t.maxHp,t.hp+65);this.emit('heal',t.x,t.y);return true;
 }
 startNight(){if(!['prepare','rest'].includes(this.phase)||this.status!=='playing'||hypot(this.player,this.tree)>165)return false;
  if(this.phase==='prepare'&&this.stats.caches<1){this.message='至少先找到一處補給，再開始守夜。';return false;}
  this.pendingChoice=true;return true;
 }
 choose(id){
  if(!this.pendingChoice||!WATCH_UPGRADES.some(u=>u.id===id))return false;
  this.upgrades[id]++;this.pendingChoice=false;this.wave++;this.phase='battle';this.player.hp=Math.min(this.player.maxHp,this.player.hp+30);this.tree.hp=Math.min(this.tree.maxHp,this.tree.hp+20);
  for(const e of this.enemies)e.scout=false;
  const kinds=this.wave===1?['wolf','wolf','wolf','boar','wolf','wolf','wolf']:this.wave===2?['boar','wolf','wolf','boar','wolf','wolf','boar','wolf','wolf','wolf']:['wolf','boar','wolf','bear','wolf','boar','wolf'];
  const first=Math.floor(this.random()*4);this.queue=kinds.map((kind,i)=>({kind,at:this.time+1.5+i*(this.wave===3?2.8:2),gate:(first+i%3)%4}));
  this.message=`第 ${this.wave} 波夢霧來襲！留意入口的光柱。`;this.emit('wave',this.tree.x,this.tree.y);return true;
 }
 aimTarget(from,range=640){return this.enemies.filter(e=>e.hp>0&&hypot(from,e)<range&&!WATCH_WORLD.rocks.some(r=>segmentHit(from.x,from.y,e.x,e.y,r.x,r.y,r.r+3))).sort((a,b)=>hypot(from,a)-hypot(from,b))[0];}
 shoot(){const p=this.player;if(p.fireCD>0||this.shots.length>140)return;
  const e=this.aimTarget(p);if(e)p.aim=direction(e.x-p.x,e.y-p.y);
  const base=Math.atan2(p.aim.y,p.aim.x),count=1+Math.min(4,this.upgrades.scatter*2);
  for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.19;this.shots.push({id:++this.serial,x:p.x,y:p.y,vx:Math.cos(a)*650,vy:Math.sin(a)*650,life:1.1,damage:16+this.upgrades.pierce*4,pierce:1+this.upgrades.pierce*2,hit:[],r:7});}
  p.fireCD=.25;this.emit('shot');
 }
 dash(input){const p=this.player;if(p.dashCD>0)return false;const d=direction(input.x||0,input.y||0);p.dashDir=Math.hypot(d.x,d.y)>0?d:{...p.aim};p.dashing=.19;p.invincible=.32;p.dashCD=3;this.stats.dashes++;this.emit('dash');return true;}
 skill(){const p=this.player;if(p.skillCD>0)return false;p.skillCD=Math.max(4,10-this.upgrades.renewal*2);this.stats.skills++;p.hp=Math.min(p.maxHp,p.hp+10+this.upgrades.renewal*12);
  for(const e of this.enemies)if(hypot(p,e)<230){this.damage(e,42);e.slow=2;const d=direction(e.x-p.x,e.y-p.y);this.moveBody(e,d.x*70,d.y*70);if(e.kind!=='bear'){e.state='recover';e.timer=.65;}}
  if(hypot(p,this.tree)<240)this.tree.hp=Math.min(this.tree.maxHp,this.tree.hp+8);this.emit('nova');return true;
 }
 damage(e,n){if(e.hp<=0)return;e.hp-=n*(e.vulnerable>0?1.3:1);e.flash=.12;
  if(e.hp<=0){this.stats.cleansed++;this.wood+=e.kind==='bear'?25:3;this.player.hp=Math.min(this.player.maxHp,this.player.hp+2);this.emit('cleanse',e.x,e.y,{kind:e.kind});}
 }
 hurt(t,n){if(t.hp<=0||t===this.player&&t.invincible>0)return;t.hp=Math.max(0,t.hp-n);if(t===this.player){t.invincible=.75;t.hurt=.22;this.stats.damage+=n;}this.emit('hurt',t.x,t.y);}
 target(e){if(e.scout){return hypot(e,this.player)<370?this.player:e.home;}
  const p=this.player;if(hypot(e,p)<260)return p;
  const building=this.slots.find(s=>s.kind&&s.hp>0&&hypot(e,s)<125);return building||this.tree;
 }
 attackTargets(e,r=50){return [this.player,this.tree,...this.slots.filter(s=>s.kind&&s.hp>0)].filter(t=>hypot(e,t)<r+(t.r||24));}
 tickEnemy(e,dt){
  e.cooldown=Math.max(0,e.cooldown-dt);e.slow=Math.max(0,e.slow-dt);e.flash=Math.max(0,e.flash-dt);e.vulnerable=Math.max(0,e.vulnerable-dt);
  if(e.kind==='bear'&&!e.stage2&&e.hp<e.maxHp*.5){e.stage2=true;this.message='熊首領的夢霧加深了！紅圈後閃避，重擊後反攻。';this.spawn('wolf',e.x-120,e.y+70);this.spawn('wolf',e.x+120,e.y+70);}
  if(e.state==='warn'){
   e.timer-=dt;if(e.timer<=0){if(e.kind==='bear'){
    this.zones.push({x:e.aim.x,y:e.aim.y,r:e.stage2?155:130,life:.3,damage:e.damage,hit:false});this.emit('slam',e.aim.x,e.aim.y);e.state='recover';e.timer=1.6;e.vulnerable=1.6;
   }else{e.state='charge';e.timer=e.kind==='boar'?.6:.32;}}return;
  }
  if(e.state==='charge'){const speed=e.kind==='boar'?520:390;this.moveBody(e,e.dir.x*speed*dt,e.dir.y*speed*dt);for(const t of this.attackTargets(e,e.r+10))if(!e.hit.includes(t)){this.hurt(t,e.damage);e.hit.push(t);}e.timer-=dt;if(e.timer<=0){e.state='recover';e.timer=.8;}return;}
  if(e.state==='recover'){e.timer-=dt;if(e.timer<=0){e.state='walk';e.cooldown=e.kind==='bear'?1.8:1.4;}return;}
  const t=this.target(e),dist=hypot(e,t),dir=direction(t.x-e.x,t.y-e.y);
  if(t.hp!==undefined&&dist<e.range&&e.cooldown<=0){e.state='warn';e.timer=e.warn*(e.stage2?.78:1);e.aim={x:t.x,y:t.y};e.dir=dir;e.hit=[];this.emit('warning',e.x,e.y);return;}
  if(dist>e.r+(t.r||10)+8){
   let move=dir;
   // Steer around the four authored rocks instead of pushing endlessly into them.
   for(const rock of WATCH_WORLD.rocks){const d=hypot(e,rock);if(d<rock.r+e.r+65&&dir.x*(rock.x-e.x)+dir.y*(rock.y-e.y)>0){const side=(e.id%2?1:-1);move=direction(dir.x-(rock.y-e.y)/d*side*1.8,dir.y+(rock.x-e.x)/d*side*1.8);break;}}
   const speed=e.speed*(e.slow>0?.42:1);this.moveBody(e,move.x*speed*dt,move.y*speed*dt);
  }
 }
 tick(dt,input){
  this.time+=dt;const p=this.player;for(const key of ['fireCD','dashCD','skillCD','invincible','hurt'])p[key]=Math.max(0,p[key]-dt);
  const mag=Math.hypot(input.x||0,input.y||0),axis={x:(input.x||0)/Math.max(1,mag),y:(input.y||0)/Math.max(1,mag)};
  if(input.dash)this.dash(axis);if(input.skill)this.skill();
  if(p.dashing>0){p.dashing=Math.max(0,p.dashing-dt);this.moveBody(p,p.dashDir.x*730*dt,p.dashDir.y*730*dt);}else this.moveBody(p,axis.x*220*dt,axis.y*220*dt);
  if(mag>0&&!this.aimTarget(p))p.aim=direction(axis.x,axis.y);
  if(input.fire)this.shoot();
  while(this.queue[0]?.at<=this.time){const n=this.queue.shift(),g=WATCH_WORLD.gates[n.gate];this.spawn(n.kind,g.x+(this.random()-.5)*45,g.y+(this.random()-.5)*45);}
  for(const s of this.slots){if(!s.kind||s.hp<=0)continue;const b=WATCH_BUILDS[s.kind];s.cooldown-=dt;if(s.cooldown>0)continue;
   if(s.kind==='bloom'){this.tree.hp=Math.min(this.tree.maxHp,this.tree.hp+3);if(hypot(p,s)<b.range)p.hp=Math.min(p.maxHp,p.hp+5);s.cooldown=b.rate;this.emit('heal',s.x,s.y);}
   else{const target=this.aimTarget(s,b.range);if(target){if(s.kind==='frost'){for(const e of this.enemies)if(hypot(s,e)<b.range){this.damage(e,b.damage);e.slow=2.4;}this.emit('frost',s.x,s.y);}else{this.damage(target,b.damage);this.emit('beam',s.x,s.y,{tx:target.x,ty:target.y});}s.cooldown=b.rate;}}
  }
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   if(WATCH_WORLD.rocks.some(r=>segmentHit(ox,oy,shot.x,shot.y,r.x,r.y,r.r))){shot.life=0;continue;}
   for(const e of this.enemies)if(e.hp>0&&!shot.hit.includes(e.id)&&segmentHit(ox,oy,shot.x,shot.y,e.x,e.y,e.r+shot.r)){this.damage(e,shot.damage);shot.hit.push(e.id);shot.pierce--;if(shot.pierce<=0){shot.life=0;break;}}
  }
  this.shots=this.shots.filter(s=>s.life>0);this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const e of [...this.enemies])this.tickEnemy(e,dt);
  for(const z of this.zones){if(!z.hit){for(const t of [p,this.tree,...this.slots.filter(s=>s.kind&&s.hp>0)])if(hypot(z,t)<z.r+(t.r||20))this.hurt(t,z.damage);z.hit=true;}z.life-=dt;}this.zones=this.zones.filter(z=>z.life>0);
  for(const s of this.slots)if(s.kind&&s.hp<=0){s.kind=null;this.emit('broken',s.x,s.y);}
  if(p.hp<=0||this.tree.hp<=0){this.status='lost';this.message=p.hp<=0?'阿晨晨需要休息，重新準備再挑戰吧。':'月光樹的光暫時熄滅了，試試不同防線。';this.emit('end');}
  else if(this.phase==='battle'&&!this.queue.length&&!this.enemies.length){
   if(this.wave===3){this.status='won';this.message='夢霧散去了，動物恢復平靜。月光樹守住了！';this.emit('end');}
   else{this.phase='rest';this.wood+=20;this.message='這一波守住了！木材 +20，回月光樹整備後再出發。';this.emit('rest');}
  }
 }
 advance(delta,input={}){
  if(this.paused||this.pendingChoice||this.status!=='playing')return 0;
  this.accumulator+=clamp(Number(delta)||0,0,.1);let n=0;
  while(this.accumulator+1e-9>=1/60){this.accumulator-=1/60;this.tick(1/60,{...input,dash:n===0&&input.dash,skill:n===0&&input.skill});n++;if(this.status!=='playing')break;}return n;
 }
 stars(){return this.status==='won'?1+Number(this.stats.caches===3)+Number(this.tree.hp>=this.tree.maxHp*.5):0;}
}
