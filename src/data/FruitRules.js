// Deterministic bubble physics and hex connectivity; independent of Phaser or saves.
export const FRUIT_BOARD={width:528,radius:24,rowHeight:24*Math.sqrt(3),launcherY:490,warningY:420,maxRow:10};
export const FRUIT_COLORS=[{name:'紅心果',hex:0xef7181,symbol:'♥'},{name:'金陽果',hex:0xf4c75e,symbol:'●'},{name:'藍晶果',hex:0x70bce5,symbol:'◆'},{name:'紫花果',hex:0xb697e1,symbol:'✿'}];
const DT=1/120,SPEED=760,R=24,W=528;
export const cellKey=(r,c)=>`${r},${c}`;
export const validCell=(r,c)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&r<=10&&c>=0&&c<(r%2?10:11);
export function neighbors(r,c){return [[r,c-1],[r,c+1],[r-1,c-(r%2?0:1)],[r-1,c+(r%2?1:0)],[r+1,c-(r%2?0:1)],[r+1,c+(r%2?1:0)]].filter(([a,b])=>validCell(a,b));}
export function cellPosition(cell,offset=0){return {x:R+cell.c*48+(cell.r%2)*R,y:R+cell.r*FRUIT_BOARD.rowHeight+offset};}
export function readFruitRows(rows){
 const cells=[];const codes='RYBP';
 rows.forEach((row,r)=>{if(row.length>(r%2?10:11))throw new Error(`Fruit row ${r} too wide`);[...row].forEach((v,c)=>{
  if(v==='.'||v===' ')return;let kind='fruit',color=codes.indexOf(v),hp=0;
  if('rybp'.includes(v)){kind='vine';color='rybp'.indexOf(v);hp=1;}
  if('1234'.includes(v)){kind='armor';color=Number(v)-1;hp=2;}
  if(v==='*'){kind='bomb';color=null;}if(v==='@'){kind='pollen';color=null;}if(v==='o'){kind='bird';color=null;}
  if(color===-1)throw new Error(`Unknown fruit ${v}`);if(!validCell(r,c))throw new Error('Invalid fruit cell');cells.push({r,c,color,kind,hp});
 });});return cells;
}
function component(board,start,test=()=>true){const seen=new Set(),stack=[start];while(stack.length){const k=stack.pop(),b=board.get(k);if(seen.has(k)||!b||!test(b))continue;seen.add(k);for(const [r,c]of neighbors(b.r,b.c))stack.push(cellKey(r,c));}return seen;}
export function anchoredKeys(board){const seen=new Set();for(const [k,b]of board)if(b.r===0)for(const v of component(board,k))seen.add(v);return seen;}
export function validateFruitLevel(level){
 if(!Number.isInteger(level.shots)||level.shots<1||!level.ammo?.length||level.ammo.some(c=>!Number.isInteger(c)||c<0||c>3))throw new Error('Invalid shot budget/ammo');
 for(const wave of level.waves||[level]){const cells=readFruitRows(wave.rows),b=new Map(cells.map(c=>[cellKey(c.r,c.c),c]));if(!cells.length||anchoredKeys(b).size!==cells.length)throw new Error(`Unanchored fruit in ${level.id}`);if(cells.some(c=>cellPosition(c).y+24>=420))throw new Error('Fruit starts at warning line');}
 if(!['clear','rescue','color'].includes(level.goal.type))throw new Error('Invalid objective');return true;
}
// Exact swept circle intersection inside each fixed step; no tunnelling at low frame rates.
function contact(ax,ay,bx,by,cx,cy,rr){const dx=bx-ax,dy=by-ay,ox=ax-cx,oy=ay-cy,a=dx*dx+dy*dy,b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-rr*rr;if(c<=0)return 0;const d=b*b-4*a*c;if(d<0||a===0)return null;const u=(-b-Math.sqrt(d))/(2*a);return u>=0&&u<=1?u:null;}
export function traceFruitShot(session,angle){
 if(!Number.isFinite(angle))return null;angle=Math.max(-72,Math.min(72,angle));const rad=angle*Math.PI/180;
 let x=session.launchX,y=FRUIT_BOARD.launcherY,vx=Math.sin(rad)*SPEED,vy=-Math.cos(rad)*SPEED,t=0,bounces=0;
 const points=[{x,y,t}],cells=[...session.board.values()],wind=session.wind;
 let hit=null,ended=false;
 for(let step=0;step<430&&!ended;step++){
  let remaining=DT;vx+=wind*DT;
  while(remaining>1e-7&&!ended){
   const ax=x,ay=y,at=t;
   let span=remaining,wall=null;
   if(vx>0&&(W-R-x)/vx<span){span=Math.max(0,(W-R-x)/vx);wall=W-R;}
   if(vx<0&&(R-x)/vx<span){span=Math.max(0,(R-x)/vx);wall=R;}
   const nx=x+vx*span,ny=y+vy*span,off0=session.offsetAt(t+session.time),off1=session.offsetAt(t+span+session.time);
   let earliest=1,found=false,foundKey=null;
   const ceiling0=R+off0,ceiling1=R+off1;
   if(ny<=ceiling1){const u=(y-ceiling0)/((y-ny)+(ceiling1-ceiling0));if(u>=0&&u<=1){earliest=u;found=true;}}
   for(const c of cells){const p=cellPosition(c,off0);if(Math.min(ay,ny)>p.y+48+Math.abs(off1-off0)||Math.max(ay,ny)<p.y-48-Math.abs(off1-off0)||Math.min(ax,nx)>p.x+48||Math.max(ax,nx)<p.x-48)continue;
    const u=contact(ax,ay,nx,ny-(off1-off0),p.x,p.y,48-.02);if(u!==null&&u<=earliest){earliest=u;found=true;foundKey=cellKey(c.r,c.c);}
   }
   if(found){x=ax+(nx-ax)*earliest;y=ay+(ny-ay)*earliest;t=at+span*earliest;hit=foundKey;ended=true;points.push({x,y,t});break;}
   x=nx;y=ny;t+=span;remaining-=span;
   if(wall!==null){x=wall;vx=-vx;bounces++;points.push({x,y,t});if(span<1e-7)remaining=Math.max(0,remaining-1e-7);}
  }
  if(step%3===0&&!ended)points.push({x,y,t});
 }
 if(!ended)return null;
 const off=session.offsetAt(session.time+t),candidates=hit?neighbors(session.board.get(hit).r,session.board.get(hit).c):Array.from({length:11},(_,c)=>[0,c]);
 const free=candidates.filter(([r,c])=>!session.board.has(cellKey(r,c))).map(([r,c])=>{const p=cellPosition({r,c},off);return {r,c,d:Math.hypot(p.x-x,p.y-y),p};}).sort((a,b)=>a.d-b.d);
 // Only neighboring attachment slots reached at impact are legal; never jump through a filled row.
 const slot=free.find(q=>q.d<=51&&cells.every(c=>{const p=cellPosition(c,off);return Math.hypot(q.p.x-p.x,q.p.y-p.y)>=47.9;}));
 return {angle,points,duration:t,hit,slot:slot?{r:slot.r,c:slot.c}:null,bounces,wind};
}
export class FruitSession{
 constructor(level){validateFruitLevel(level);this.level=structuredClone(level);this.time=0;this.phase='ready';this.paused=false;this.wave=0;this.shots=0;this.descent=0;this.queue=[];this.ammoCursor=0;this.launchIndex=0;this.events=[];this.stats={removed:0,rescued:0,maxBurst:0,banks:0,blasts:0,unlocked:0};this.flight=null;this.lastResult=null;this.loadWave();this.refill();}
 get launchers(){return this.level.launchers||[264];}get launchX(){return this.launchers[this.launchIndex];}
 get remaining(){return this.level.shots-this.shots;}get wind(){const a=this.level.wind||[0];return a[this.shots%a.length];}
 get current(){return this.queue[0];}get next(){return this.queue[1];}
 offsetAt(time){return this.descent+(this.level.motion||0)*(1-Math.cos(time*1.7));}
 loadWave(){const w=this.level.waves?.[this.wave]||this.level;this.board=new Map(readFruitRows(w.rows).map(c=>[cellKey(c.r,c.c),c]));this.descent=0;this.waveGoal=w.goal||this.level.goal;}
 refill(){const colors=[...new Set([...this.board.values()].map(b=>b.color).filter(c=>c!==null))];const pool=colors.length?colors:[0,1,2,3];
  for(let i=0;i<this.queue.length;i++)if(!pool.includes(this.queue[i]))this.queue[i]=pool[this.queue[i]%pool.length];
  while(this.queue.length<3){let color=this.level.ammo[this.ammoCursor++%this.level.ammo.length];if(!pool.includes(color))color=pool[color%pool.length];this.queue.push(color);}
 }
 swap(){if(this.phase!=='ready'||this.paused)return false;[this.queue[0],this.queue[1]]=[this.queue[1],this.queue[0]];return true;}
 switchLauncher(){if(this.phase!=='ready'||this.paused||this.launchers.length<2)return false;this.launchIndex=(this.launchIndex+1)%this.launchers.length;return true;}
 fire(angle){if(this.phase!=='ready'||this.paused||this.remaining<=0)return false;const trace=traceFruitShot(this,angle);if(!trace)return false;this.flight={...trace,color:this.current,elapsed:0,startTime:this.time};this.shots++;this.queue.shift();this.phase='flying';this.events.push({type:'launch'});return true;}
 advance(seconds){if(this.paused||!['ready','flying'].includes(this.phase)||!Number.isFinite(seconds)||seconds<=0)return;const dt=Math.min(seconds,.1);this.time+=dt;
  if(this.phase==='flying'){this.flight.elapsed+=dt;if(this.flight.elapsed+1e-8>=this.flight.duration){this.time=this.flight.startTime+this.flight.duration;this.resolve(this.flight);}}
 }
 projectilePosition(){const f=this.flight;if(!f)return null;let i=1;while(i<f.points.length-1&&f.points[i].t<f.elapsed)i++;const a=f.points[i-1],b=f.points[i],u=Math.max(0,Math.min(1,(f.elapsed-a.t)/(b.t-a.t||1)));return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};}
 resolve(f){
  const board=this.board,removed=new Map(),blasts=[],unlocked=[];const snapshot=[...board.values()].map(c=>({...c}));
  const remove=k=>{const b=board.get(k);if(!b||removed.has(k))return;removed.set(k,{...b});board.delete(k);if(b.kind==='bomb')blasts.push(b);};
  const hit=board.get(f.hit);
  if(hit?.kind==='vine'||hit?.kind==='armor'){hit.hp--;this.stats.unlocked++;unlocked.push({...hit});if(hit.hp<=0)hit.kind='fruit';}
  if(hit?.kind==='pollen'){hit.kind='fruit';hit.color=f.color;for(const [r,c]of neighbors(hit.r,hit.c)){const b=board.get(cellKey(r,c));if(b?.kind==='fruit')b.color=f.color;}}
  if(f.slot){const b={...f.slot,color:f.color,kind:'fruit',hp:0};board.set(cellKey(b.r,b.c),b);}
  if(hit?.kind==='bomb')remove(f.hit);
  let matched=0;
  if(f.slot){const key=cellKey(f.slot.r,f.slot.c),group=component(board,key,b=>b.kind==='fruit'&&b.color===f.color);if(group.size>=3){matched=group.size;for(const k of group)remove(k);}}
  // A pop ignites neighboring pinecones; pinecones ignite each other once.
  for(const b of [...removed.values()])for(const [r,c]of neighbors(b.r,b.c))if(board.get(cellKey(r,c))?.kind==='bomb')remove(cellKey(r,c));
  let explosions=0;
  while(blasts.length){const b=blasts.shift();explosions++;for(const [r,c]of neighbors(b.r,b.c))remove(cellKey(r,c));}
  const anchored=anchoredKeys(board),fallen=[];for(const [k,b]of board)if(!anchored.has(k)){fallen.push({...b});board.delete(k);}
  const rescued=[...removed.values(),...fallen].filter(b=>b.kind==='bird').length,burst=removed.size+fallen.length;
  this.stats.removed+=burst;this.stats.rescued+=rescued;this.stats.maxBurst=Math.max(this.stats.maxBurst,burst);this.stats.banks+=f.bounces>0&&burst>0?1:0;this.stats.blasts+=explosions;
  this.lastResult={snapshot,removed:[...removed.values()],fallen,matched,explosions,rescued,burst,bounces:f.bounces,unlocked,slot:f.slot};this.events.push({type:'resolve',result:this.lastResult});this.flight=null;
  if(this.goalMet()){
   if(this.level.waves&&this.wave<this.level.waves.length-1){this.wave++;this.loadWave();this.events.push({type:'wave',wave:this.wave});this.phase='ready';}
   else{this.phase='won';this.events.push({type:'won'});}
  }else{if(this.level.descendEvery&&this.shots%this.level.descendEvery===0){this.descent+=this.level.descendBy||12;this.events.push({type:'descend'});}this.phase='ready';}
  if(this.phase==='ready'&&(this.remaining<=0||[...this.board.values()].some(b=>cellPosition(b,this.descent+2*(this.level.motion||0)).y+24>=FRUIT_BOARD.warningY)||!f.slot&&burst===0)){this.phase='lost';this.events.push({type:'lost',reason:this.remaining<=0?'shots':'line'});}
  this.refill();
 }
 goalMet(){const g=this.waveGoal;if(g.type==='clear')return this.board.size===0;if(g.type==='rescue')return ![...this.board.values()].some(b=>b.kind==='bird');return ![...this.board.values()].some(b=>b.color===g.color);}
 medals(){const won=this.phase==='won';return [won,won&&this.shots<=this.level.par,won&&this.stats.maxBurst>=this.level.chain];}
}
export function finishFruitShot(s,angle){if(!s.fire(angle))return false;for(let i=0;i<60&&s.phase==='flying';i++)s.advance(.1);if(s.phase==='flying')throw new Error('Unresolved shot');return true;}
