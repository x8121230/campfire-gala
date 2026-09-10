import {ASSAULT_DT as DT, ASSAULT_BALANCE as B, ASSAULT_DIFFICULTIES, ASSAULT_LOADOUTS, ASSAULT_WEAPONS, ASSAULT_ENEMIES} from './AssaultConfig.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const copy=v=>JSON.parse(JSON.stringify(v));
const approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
export const assaultOverlap=(a,b)=>a.x<b.x+b.w-.001&&a.x+a.w>b.x+.001&&a.y<b.y+b.h-.001&&a.y+a.h>b.y+.001;
export function assaultRay(x,y,dx,dy,r){
  let near=0,far=1,nx=0,ny=0;
  for(const [p,d,lo,hi,ax,ay] of [[x,dx,r.x,r.x+r.w,1,0],[y,dy,r.y,r.y+r.h,0,1]]){
    if(Math.abs(d)<1e-9){if(p<lo||p>hi)return null;continue;}
    let a=(lo-p)/d,b=(hi-p)/d,n=-Math.sign(d);if(a>b)[a,b]=[b,a];
    if(a>near){near=a;nx=ax*n;ny=ay*n;}far=Math.min(far,b);if(near>far)return null;
  }
  return near>=0&&near<=1?{t:near,nx,ny}:null;
}
export function assaultMover(m,t){const q=(1-Math.cos(t*2*Math.PI/m.period))/2;return {...m,x:m.x+m.dx*q,y:m.y+m.dy*q,oneWay:true};}
export function assaultHazard(h,t){const q=((t+(h.offset||0))%h.period+h.period)%h.period;return {active:q<h.on,warning:q>h.period-.8};}
export function validateAssaultLevel(l){
  if(!Number.isFinite(l.width)||l.width<2000||!l.boss||!['beetle','train','mole','owl','saw','core'].includes(l.boss.type)||l.boss.hp<=0)throw Error('Invalid assault level');
  for(const r of [...l.platforms,...l.objects,...l.gates,...l.bridges,...l.hazards])if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)throw Error('Invalid rectangle');
  for(const p of [l.spawn,l.exit,...l.checkpoints])if(!l.platforms.some(r=>p.x>r.x+25&&p.x<r.x+r.w-25&&r.y===p.y))throw Error('Unsafe landmark');
  for(const p of [l.spawn,...l.checkpoints])if([...l.objects.filter(o=>o.kind!=='cage'),...l.hazards].some(r=>assaultOverlap({x:p.x-49,y:p.y-62,w:98,h:62},r)))throw Error('Blocked checkpoint');
  for(const m of l.movers)if(![m.x,m.y,m.w,m.h,m.dx,m.dy,m.period].every(Number.isFinite)||m.period<=0)throw Error('Invalid mover');
  for(const g of l.gates)if(g.requires.some(i=>l.objects[i]?.kind!=='generator'))throw Error('Invalid gate');
  for(const b of l.bridges)if(!l.switches[b.switch])throw Error('Invalid bridge');
  if(l.chips.length!==3||l.rescueGoal>l.objects.filter(o=>o.kind==='cage').length||l.generatorGoal>l.objects.filter(o=>o.kind==='generator').length)throw Error('Unreachable objective');
  return l;
}
export class AssaultSession {
  constructor(level,{difficulty='standard',loadout=0}={}){
    this.level=validateAssaultLevel(copy(level));this.difficulty=ASSAULT_DIFFICULTIES[difficulty]?difficulty:'standard';this.settings=ASSAULT_DIFFICULTIES[this.difficulty];this.build=ASSAULT_LOADOUTS[loadout]||ASSAULT_LOADOUTS[0];
    this.time=0;this.accumulator=0;this.paused=false;this.status='playing';this.respawnDelay=0;this.events=[];this.uid=0;
    this.player={...level.spawn,vx:0,vy:0,facing:1,grounded:true,groundId:null,coyote:B.coyote,buffer:0,drop:0,crouch:false,hp:this.settings.hp,invuln:0,weapon:0,ammo:[0,35+this.build.ammo,40+this.build.ammo],grenades:3+this.build.grenades,fireCooldown:0,grenadeCooldown:0,dash:0,dashCooldown:0,tank:-1};
    this.objects=level.objects.map((o,i)=>({...copy(o),id:`o${i}`,hp:o.hp,maxHp:o.hp,rescued:false}));
    this.enemies=level.enemies.map((e,i)=>this.makeEnemy(e,`e${i}`));this.tanks=level.tanks.map((t,i)=>({...t,id:i,hp:B.tankHealth,heat:0,overheat:false}));
    this.switches=level.switches.map(()=>false);this.chips=[];this.pickups=level.supplies.map(o=>({...o,id:++this.uid}));this.shots=[];this.bullets=[];this.grenades=[];this.attacks=[];
    this.stats={score:0,kills:0,rescued:0,generators:0,damage:0,deaths:0,dashes:0,grenades:0,tankShots:0,parts:0,maxCombo:0};this.combo=0;this.comboTime=0;this.boss=null;
    this.checkpointIndex=-1;this.message='前往右方，出發！';this.messageTime=2.5;this.previous={};this.saveCheckpoint(-1);
  }
  makeEnemy(e,id){const def=ASSAULT_ENEMIES[e.kind];if(!def)throw Error('Unknown enemy');return {...copy(e),id,hp:def.hp*this.settings.enemyHp,maxHp:def.hp*this.settings.enemyHp,homeY:e.y,facing:-1,cooldown:.6+(Number(String(id).replace(/\D/g,''))%4)*.25,aim:null,flash:0};}
  say(text){this.message=text;this.messageTime=2.6;}
  setPaused(value){this.paused=!!value;this.accumulator=0;this.previous={};this.player.buffer=0;}
  setWeapon(i){if(this.paused||this.status!=='playing'||this.respawnDelay>0||!ASSAULT_WEAPONS[i])return false;this.player.weapon=i;return true;}
  playerBox(p=this.player){const tank=p.tank>=0;const w=tank?B.tankWidth:B.playerWidth,h=tank?B.tankHeight:p.crouch?B.crouchHeight:B.playerHeight;return {x:p.x-w/2,y:p.y-h,w,h};}
  enemyBox(e){return {x:e.x-22,y:e.y-(e.kind==='drone'?38:48),w:44,h:e.kind==='drone'?38:48};}
  solids(t=this.time){
    const l=this.level;
    return [...l.platforms.map((r,i)=>({...r,id:`p${i}`})),...l.movers.map((m,i)=>({...assaultMover(m,t),id:`m${i}`})),
      ...this.objects.filter(o=>o.hp>0&&o.kind!=='cage').map(o=>({...o})),
      ...l.bridges.flatMap((r,i)=>this.switches[r.switch]?[{...r,id:`b${i}`}]:[]),
      ...l.gates.flatMap((r,i)=>r.requires.every(j=>this.objects[j].hp<=0)?[]:[{...r,id:`g${i}`}]),
      ...(this.boss?.hp>0?[{x:l.boss.arena-40,y:0,w:32,h:560,id:'arena'}]:[])];
  }
  advance(seconds,input={}){
    if(this.paused||this.status!=='playing')return 0;
    this.accumulator+=clamp(Number(seconds)||0,0,.1);let steps=0;
    while(this.accumulator+1e-10>=DT){this.accumulator-=DT;this.step(input);steps++;if(this.status!=='playing')break;}
    return steps;
  }
  step(input){
    this.time+=DT;this.messageTime=Math.max(0,this.messageTime-DT);this.comboTime=Math.max(0,this.comboTime-DT);if(!this.comboTime)this.combo=0;
    if(this.respawnDelay>0){this.respawnDelay-=DT;if(this.respawnDelay<=0)this.restoreCheckpoint();return;}
    const p=this.player;for(const k of ['invuln','fireCooldown','grenadeCooldown','dashCooldown','buffer','drop'])p[k]=Math.max(0,p[k]-DT);
    if(Number.isInteger(input.weapon))this.setWeapon(input.weapon);
    const edge=k=>!!input[k]&&!this.previous[k];
    if(edge('jump')){if(input.down&&p.grounded&&this.solids().find(r=>r.id===p.groundId)?.oneWay){p.drop=.24;p.y+=4;p.grounded=false;p.coyote=0;p.buffer=0;}else p.buffer=B.jumpBuffer;}
    if(edge('interact'))this.interact();
    const wanted=!!input.down&&p.grounded&&p.tank<0;
    if(wanted)p.crouch=true;else if(p.crouch){p.crouch=false;if(this.solids().some(r=>!r.oneWay&&assaultOverlap(this.playerBox(),r)))p.crouch=true;}
    const axis=clamp(Number(input.axis)||0,-1,1);if(axis&&p.dash<=0)p.facing=Math.sign(axis);
    if(edge('dash')&&p.dashCooldown<=0&&p.tank<0){p.dash=B.dashTime;p.dashCooldown=B.dashCooldown*this.build.cooldown;p.invuln=Math.max(p.invuln,B.dashTime);this.stats.dashes++;this.events.push({type:'dash',x:p.x,y:p.y});}
    if(p.grounded)p.coyote=B.coyote;else p.coyote=Math.max(0,p.coyote-DT);
    if(p.buffer>0&&p.coyote>0){p.vy=-(p.tank>=0?B.tankJump:B.jump);p.grounded=false;p.groundId=null;p.coyote=0;p.buffer=0;this.events.push({type:'jump',x:p.x,y:p.y});}
    const speed=p.tank>=0?B.tankSpeed:B.speed*this.build.speed;
    p.vx=p.dash>0?p.facing*B.dashSpeed:approach(p.vx,axis*speed*(p.crouch?.4:1),B.acceleration*DT);
    if(p.dash>0){p.dash=Math.max(0,p.dash-DT);p.vy=0;}else p.vy=Math.min(1000,p.vy+B.gravity*DT);
    const solids=this.solids();
    if(p.groundId?.startsWith('m')){const i=Number(p.groundId.slice(1)),m=this.level.movers[i],now=assaultMover(m,this.time),old=assaultMover(m,this.time-DT);p.x+=now.x-old.x;p.y+=now.y-old.y;}
    p.x+=p.vx*DT;
    for(const r of solids){if(r.oneWay||!assaultOverlap(this.playerBox(),r))continue;const box=this.playerBox();p.x=p.vx>0?r.x-box.w/2:r.x+r.w+box.w/2;p.vx=0;}
    p.x=clamp(p.x,p.tank>=0?52:18,this.level.width-(p.tank>=0?52:18));
    const oldBottom=p.y;p.y+=p.vy*DT;p.grounded=false;p.groundId=null;
    for(const r of solids){const box=this.playerBox();if(r.oneWay&&p.drop>0||box.x>=r.x+r.w-.01||box.x+box.w<=r.x+.01)continue;
      if(p.vy>=0&&oldBottom<=r.y+3&&p.y>=r.y){p.y=r.y;p.vy=0;p.grounded=true;p.groundId=r.id;}
      else if(!r.oneWay&&p.vy<0&&assaultOverlap(box,r)){p.y=r.y+r.h+box.h;p.vy=0;}
    }
    if(p.tank>=0){const t=this.tanks[p.tank];t.x=p.x;t.y=p.y;t.heat=Math.max(0,t.heat-B.tankCooling*DT);if(t.overheat&&t.heat<=B.tankUnlockHeat)t.overheat=false;}
    for(const t of this.tanks)if(t.id!==p.tank){t.heat=Math.max(0,t.heat-B.tankCooling*DT);if(t.heat<=B.tankUnlockHeat)t.overheat=false;}
    if(input.fire&&p.fireCooldown<=0)this.fire(!!input.up,axis);
    if(edge('grenade'))this.throwGrenade();
    this.updateEnemies();this.updateBoss();this.updateProjectiles();this.updateGrenades();this.updateAttacks();this.collect();
    for(const h of this.level.hazards)if(assaultHazard(h,this.time).active&&assaultOverlap(this.playerBox(),h))this.hurt();
    if(p.y>this.level.height+80){this.die();}
    if(this.respawnDelay<=0){
      for(let i=this.checkpointIndex+1;i<this.level.checkpoints.length;i++){const c=this.level.checkpoints[i];if(Math.abs(p.x-c.x)<55&&Math.abs(p.y-c.y)<12&&p.grounded){p.hp=this.settings.hp;p.grenades=Math.max(p.grenades,2);p.ammo[1]=Math.max(p.ammo[1],20);p.ammo[2]=Math.max(p.ammo[2],25);this.checkpointIndex=i;this.saveCheckpoint(i);this.say('檢查點！補滿體力並補充彈藥');this.events.push({type:'checkpoint',x:c.x,y:c.y});}}
      if(!this.boss&&p.x>this.level.boss.arena+(p.tank>=0?60:30)){if(this.missionReady())this.spawnBoss();else if(this.messageTime<=0)this.say(this.objectiveText());}
      if(this.boss?.hp<=0&&p.x>this.level.exit.x-30){this.status='won';this.stats.score+=3000;this.events.push({type:'won'});}
    }
    this.previous={jump:!!input.jump,dash:!!input.dash,grenade:!!input.grenade,interact:!!input.interact};
  }
  interact(){
    const p=this.player;if(p.tank>=0){
      const t=this.tanks[p.tank];
      for(const offset of [-76,76,0]){const q={...p,tank:-1,crouch:false,x:clamp(p.x+offset,20,this.level.width-20),y:p.y-(offset===0?B.tankHeight:0)};
        if(!this.solids().some(r=>!r.oneWay&&assaultOverlap(this.playerBox(q),r))){Object.assign(p,q,{vy:-160,grounded:false,invuln:Math.max(.55,p.invuln)});this.say('已下車，甲蟲坦克會留在原地');return true;}}
      this.say('旁邊空間不足，移到空曠處再下車');return false;
    }
    for(let i=0;i<this.level.switches.length;i++){const s=this.level.switches[i];if(!this.switches[i]&&Math.hypot(p.x-s.x,p.y-25-s.y)<85){this.switches[i]=true;this.say(`${s.label}已開啟`);this.events.push({type:'switch',x:s.x,y:s.y});return true;}}
    const t=this.tanks.find(v=>v.hp>0&&Math.abs(v.x-p.x)<90&&Math.abs(v.y-p.y)<80);
    if(t){const q={...p,x:t.x,y:t.y,tank:t.id,crouch:false};if(this.solids().some(r=>!r.oneWay&&assaultOverlap(this.playerBox(q),r))){this.say('載具空間不足');return false;}Object.assign(p,q,{vx:0,vy:0,invuln:Math.max(.6,p.invuln)});this.say('甲蟲坦克！注意炮管熱量');return true;}
    return false;
  }
  fire(up,axis){
    const p=this.player,angle=up?(axis?(axis>0?-Math.PI/4:-3*Math.PI/4):-Math.PI/2):(p.facing>0?0:Math.PI),origin={x:p.x,y:p.y-(p.tank>=0?40:p.crouch?18:33)};
    if(p.tank>=0){const t=this.tanks[p.tank];if(t.overheat)return;t.heat=Math.min(100,t.heat+B.tankHeatPerShot);if(t.heat>=99)t.overheat=true;p.fireCooldown=.32;this.stats.tankShots++;
      this.shots.push({id:++this.uid,...origin,vx:Math.cos(angle)*820,vy:Math.sin(angle)*820,r:8,damage:42*this.build.damage,life:1.2,kind:'tank',pierce:3,hit:[]});
    }else{
      let w=ASSAULT_WEAPONS[p.weapon];if(w.cost&&p.ammo[p.weapon]<=0){p.weapon=0;w=ASSAULT_WEAPONS[0];this.say('特殊彈用完，切回種子連發');}p.ammo[p.weapon]-=w.cost;p.fireCooldown=w.interval;
      const angles=w.id==='spread'?[-.24,-.12,0,.12,.24]:[0];
      for(const off of angles)this.shots.push({id:++this.uid,...origin,vx:Math.cos(angle+off)*w.speed,vy:Math.sin(angle+off)*w.speed,r:w.id==='bounce'?6:4,damage:w.damage*this.build.damage,life:w.life,kind:w.id,bounces:w.id==='bounce'?3:0,pierce:w.id==='bounce'?2:1,hit:[]});
    }
    this.events.push({type:'fire',x:origin.x+Math.cos(angle)*25,y:origin.y+Math.sin(angle)*25});
  }
  throwGrenade(){const p=this.player;if(p.grenades<=0||p.grenadeCooldown>0)return false;p.grenades--;p.grenadeCooldown=.45;this.stats.grenades++;this.grenades.push({id:++this.uid,x:p.x+p.facing*20,y:p.y-40,vx:p.facing*380,vy:-450,life:B.grenadeFuse});return true;}
  damageObject(o,damage){if(o.hp<=0)return;o.hp=Math.max(0,o.hp-damage);if(o.hp>0)return;this.events.push({type:'burst',x:o.x+o.w/2,y:o.y+o.h/2});
    if(o.kind==='generator'){this.stats.generators++;this.stats.score+=400;this.say('能源裝置已摧毀！');}
    if(o.kind==='crate')this.pickups.push({id:++this.uid,x:o.x+o.w/2,y:o.y+o.h-20,kind:o.loot});
  }
  damageEnemy(e,damage,{kind='seed',vx=1,x=e.x}={}){if(e.hp<=0)return;const front=(x-e.x)*e.facing>0;
    if(e.kind==='shield'&&front&&!['grenade','tank'].includes(kind))damage*=.25;
    e.hp=Math.max(0,e.hp-damage);e.flash=.09;if(e.hp>0)return;
    this.combo=this.comboTime>0?this.combo+1:1;this.comboTime=B.comboWindow;this.stats.maxCombo=Math.max(this.stats.maxCombo,this.combo);this.stats.kills++;this.stats.score+=Math.round(ASSAULT_ENEMIES[e.kind].score*(1+Math.min(10,this.combo-1)*.1));
    this.events.push({type:'burst',x:e.x,y:e.y-24});
    if(this.stats.kills%3===0)this.pickups.push({id:++this.uid,x:e.x,y:Math.min(454,e.y-20),kind:this.stats.kills%9===0?'health':'ammo'});
  }
  updateEnemies(){
    const p=this.player;
    for(const e of this.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-DT);if(Math.abs(e.x-p.x)>B.enemyActivation)continue;
      const def=ASSAULT_ENEMIES[e.kind],facing=p.x<e.x?-1:1;
      if(e.kind==='shield'&&facing!==e.facing){e.turn=(e.turn??B.shieldTurnDelay)-DT;if(e.turn<=0){e.facing=facing;e.turn=B.shieldTurnDelay;}}else{e.facing=facing;e.turn=B.shieldTurnDelay;}
      if(e.kind==='drone')e.y=e.homeY+Math.sin(this.time*2+e.x)*24;
      else if(def.speed){const nx=e.x+e.facing*def.speed*DT;const b={...this.enemyBox(e),x:nx-22};if(nx>e.left&&nx<e.right&&!this.solids().some(r=>!r.oneWay&&assaultOverlap(b,r)))e.x=nx;}
      if(assaultOverlap(this.playerBox(),this.enemyBox(e)))this.hurt();
      e.cooldown-=DT;
      if(e.cooldown<.5&&!e.aim)e.aim={x:p.x,y:p.y-28};
      if(e.cooldown<=0){const a=e.aim||{x:p.x,y:p.y-28};if(e.kind==='mortar')this.bullets.push({id:++this.uid,x:e.x,y:e.y-40,vx:clamp((a.x-e.x)/1.1,-370,370),vy:-510,gravity:860,r:8,life:3,kind:'mortar'});
        else if(e.kind==='guard'||e.kind==='shield'){this.enemyBullet(e.x,e.y-37,e.facing*260*this.settings.bulletSpeed,0,6);}
        else{const angle=Math.atan2(a.y-(e.y-24),a.x-e.x),speed=(e.kind==='sniper'?400:245)*this.settings.bulletSpeed;this.enemyBullet(e.x,e.y-24,Math.cos(angle)*speed,Math.sin(angle)*speed,e.kind==='sniper'?5:6);}
        e.cooldown=def.interval/this.settings.attackRate;e.aim=null;
      }
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
  }
  enemyBullet(x,y,vx,vy,r=7){this.bullets.push({id:++this.uid,x,y,vx,vy,r,life:5,kind:'bullet'});}
  missionReady(){return this.stats.rescued>=this.level.rescueGoal&&this.stats.generators>=this.level.generatorGoal;}
  objectiveText(){return this.level.rescueGoal>this.stats.rescued?`先救出 ${this.level.rescueGoal} 位夥伴（已救 ${this.stats.rescued}）`:`先摧毀 ${this.level.generatorGoal} 座裝置（已拆 ${this.stats.generators}）`;}
  spawnBoss(){const l=this.level.boss,hp=l.hp*this.settings.enemyHp;
    this.boss={...l,hp,maxHp:hp,phase:1,age:0,cooldown:1.5,guard:1.2,flash:0,attack:0,exposed:false,buried:false,parts:[{hp:85*this.settings.enemyHp,maxHp:85*this.settings.enemyHp},{hp:85*this.settings.enemyHp,maxHp:85*this.settings.enemyHp}]};
    this.bullets=[];this.enemies=this.enemies.filter(e=>e.x>=l.arena);this.say(`${l.name}出現！攻擊藍光核心`);this.events.push({type:'boss',x:l.x,y:l.y});
  }
  bossParts(){const b=this.boss;if(!b)return [];return b.parts.map((p,i)=>({...p,i,x:b.x+(i===0?-67:48),y:b.y-80,w:39,h:39}));}
  bossBox(){const b=this.boss;return {x:b.x-53,y:b.y-124,w:106,h:124};}
  damageBoss(damage,part=-1){const b=this.boss;if(!b||b.hp<=0||b.buried)return;
    if(part>=0){const p=b.parts[part];if(p.hp<=0)return;p.hp=Math.max(0,p.hp-damage);if(p.hp===0){this.stats.parts++;this.stats.score+=500;this.say('武器部位擊破，頭目攻勢減弱！');this.events.push({type:'burst',x:b.x,y:b.y-80});}return;}
    if(b.guard>0||!b.exposed)damage*=B.bossGuardDamage;b.hp=Math.max(0,b.hp-damage);b.flash=.07;
    const phase=b.hp/b.maxHp>.67?1:b.hp/b.maxHp>.34?2:3;
    if(phase!==b.phase&&b.hp>0){b.phase=phase;b.guard=B.bossPhaseGuard;b.cooldown=1.1;this.bullets=[];this.say(`第 ${phase} 階段！新攻勢即將展開`);this.events.push({type:'phase'});}
    if(b.hp===0){this.bullets=[];this.attacks=[];this.enemies=[];this.stats.score+=2000;this.say('頭目擊破！前往右側撤離旗');this.events.push({type:'bossDown',x:b.x,y:b.y-65});}
  }
  updateBoss(){
    const b=this.boss;if(!b||b.hp<=0)return;b.age+=DT;b.guard=Math.max(0,b.guard-DT);b.flash=Math.max(0,b.flash-DT);b.cooldown-=DT;
    const l=this.level,p=this.player,cycle=b.age%7;
    b.exposed=cycle>3.1||b.parts.every(v=>v.hp<=0);b.buried=b.type==='mole'&&cycle>0.2&&cycle<1.4;
    if(b.type==='owl')b.y=335+Math.sin(b.age*1.3)*54;
    if(b.type==='train')b.x=l.boss.x+Math.sin(b.age*.8)*90;
    if(b.type==='mole'&&b.buried)b.x=clamp(p.x+200,l.boss.arena+400,l.width-200);
    if(!b.buried&&assaultOverlap(this.playerBox(),this.bossBox()))this.hurt();
    if(b.cooldown>0||b.buried)return;
    const n=b.attack++,ph=b.phase,rate=this.settings.attackRate,parts=b.parts.filter(v=>v.hp>0).length;
    const fan=(count,speed)=>{const a=Math.atan2(p.y-25-(b.y-80),p.x-b.x);for(let j=0;j<count;j++){const q=a+(j-(count-1)/2)*.17;this.enemyBullet(b.x-65,b.y-80,Math.cos(q)*speed*this.settings.bulletSpeed,Math.sin(q)*speed*this.settings.bulletSpeed);}};
    const strike=(type,x,y,w,h,warn=.9)=>this.attacks.push({id:++this.uid,type,x,y,w,h,age:0,warn,duration:type==='beam'?.38:.46});
    if(b.type==='beetle'){
      if(n%3===2)strike('ground',l.boss.arena,454,1130,26,1);else fan(2+ph+parts,215);
    }else if(b.type==='train'){
      if(n%3===2)fan(3+parts,235);else strike('beam',l.boss.arena,n%2===0?464:431,1130,12,1.05);
    }else if(b.type==='mole'){
      if(n%2===0)for(let i=0;i<ph;i++)strike('column',clamp(p.x-38+i*130,l.boss.arena,l.width-70),250,65,230,1);
      else fan(3+parts,225);
    }else if(b.type==='owl'){
      fan(3+ph+parts,215);if(ph>=2&&n%2===0)strike('column',clamp(p.x-36,l.boss.arena,l.width-75),0,72,480,1.1);
      if(n%4===3&&this.enemies.length<3)this.enemies.push(this.makeEnemy({kind:'drone',x:b.x-200,y:230,left:b.x-250,right:b.x},`s${++this.uid}`));
    }else if(b.type==='saw'){
      if(n%2===0)strike('ground',l.boss.arena,451,1130,29,.95);else fan(3+ph+parts,230);
      if(ph===3&&n%3===0)strike('column',p.x-40,270,80,210,1.2);
    }else{
      if(n%3===0)for(let i=0;i<ph;i++)strike('column',clamp(p.x-35+(i-1)*150,l.boss.arena,l.width-75),0,70,480,1.05);
      if(n%3===1)fan(4+ph+parts,240);
      if(n%3===2)strike('ground',l.boss.arena,452,1130,28,.9);
    }
    b.cooldown=(2.3-ph*.22+(2-parts)*.18)/rate;
  }
  projectileTargets(q){
    const targets=[];
    for(const r of this.solids()){if(r.id?.startsWith('o')||r.oneWay)continue;targets.push({rect:r,kind:'wall',value:r});}
    for(const o of this.objects)if(o.hp>0&&!q.hit.includes(o.id))targets.push({rect:o,kind:'object',value:o,id:o.id});
    for(const e of this.enemies)if(e.hp>0&&!q.hit.includes(e.id))targets.push({rect:this.enemyBox(e),kind:'enemy',value:e,id:e.id});
    if(this.boss?.hp>0&&!this.boss.buried){for(const part of this.bossParts())if(part.hp>0&&!q.hit.includes(`part${part.i}`))targets.push({rect:part,kind:'part',value:part.i,id:`part${part.i}`});if(!q.hit.includes('boss'))targets.push({rect:this.bossBox(),kind:'boss',id:'boss'});}
    return targets;
  }
  updateProjectiles(){
    for(const q of this.shots){q.life-=DT;let remaining=DT,iterations=0;
      while(remaining>1e-7&&q.life>0&&iterations++<6){const dx=q.vx*remaining,dy=q.vy*remaining;let hit=null;
        for(const target of this.projectileTargets(q)){const r=target.rect,h=assaultRay(q.x,q.y,dx,dy,{x:r.x-q.r,y:r.y-q.r,w:r.w+q.r*2,h:r.h+q.r*2});if(h&&(!hit||h.t<hit.t))hit={...target,...h};}
        if(!hit){q.x+=dx;q.y+=dy;break;}const fromX=q.x;q.x+=dx*hit.t;q.y+=dy*hit.t;remaining*=1-hit.t;
        if(hit.kind==='wall'){
          if(q.bounces>0){q.bounces--;if(hit.nx)q.vx*=-1;if(hit.ny)q.vy*=-1;if(!hit.nx&&!hit.ny){q.life=0;break;}q.x+=hit.nx*.2;q.y+=hit.ny*.2;}
          else{q.life=0;break;}
        }else{
          if(hit.kind==='object')this.damageObject(hit.value,q.damage);
          if(hit.kind==='enemy')this.damageEnemy(hit.value,q.damage,{...q,x:fromX});
          if(hit.kind==='part')this.damageBoss(q.damage,hit.value);
          if(hit.kind==='boss')this.damageBoss(q.damage);
          q.hit.push(hit.id);q.pierce--;if(q.pierce<=0)q.life=0;
        }
      }
    }
    this.shots=this.shots.filter(q=>q.life>0&&q.x>-30&&q.x<this.level.width+30&&q.y>-50&&q.y<580);
    const pb=this.playerBox();
    for(const q of this.bullets){q.life-=DT;q.vy+=(q.gravity||0)*DT;const dx=q.vx*DT,dy=q.vy*DT;let nearest=null;
      const targets=[{r:pb,player:true},...this.solids().filter(r=>!r.oneWay).map(r=>({r}))];
      for(const {r,player}of targets){const hit=assaultRay(q.x,q.y,dx,dy,{x:r.x-q.r,y:r.y-q.r,w:r.w+q.r*2,h:r.h+q.r*2});if(hit&&(!nearest||hit.t<nearest.t))nearest={...hit,player};}
      if(nearest){q.life=0;if(nearest.player)this.hurt();}
      q.x+=dx;q.y+=dy;
    }
    this.bullets=this.bullets.filter(q=>q.life>0&&q.x>-30&&q.x<this.level.width+30&&q.y<580&&q.y>-300);
  }
  updateGrenades(){
    for(const g of this.grenades){g.life-=DT;g.vy+=B.gravity*.7*DT;const dx=g.vx*DT,dy=g.vy*DT;let first=null;
      for(const r of this.solids()){if(r.oneWay&&g.vy<0)continue;const h=assaultRay(g.x,g.y,dx,dy,{x:r.x-5,y:r.y-5,w:r.w+10,h:r.h+10});if(h&&(!first||h.t<first.t))first=h;}
      if(first){g.x+=dx*first.t+first.nx;g.y+=dy*first.t+first.ny;if(first.ny)g.vy*=-.48;if(first.nx)g.vx*=-.65;g.vx*=.85;}else{g.x+=dx;g.y+=dy;}
      if(g.life<=0){const damage=B.grenadeDamage*this.build.damage;this.events.push({type:'grenade',x:g.x,y:g.y});
        for(const e of this.enemies)if(Math.hypot(e.x-g.x,e.y-24-g.y)<B.grenadeRadius)this.damageEnemy(e,damage,{kind:'grenade'});
        for(const o of this.objects)if(Math.hypot(o.x+o.w/2-g.x,o.y+o.h/2-g.y)<B.grenadeRadius)this.damageObject(o,damage);
        if(this.boss?.hp>0){for(const part of this.bossParts())if(Math.hypot(part.x+20-g.x,part.y+20-g.y)<B.grenadeRadius)this.damageBoss(damage,part.i);if(Math.hypot(this.boss.x-g.x,this.boss.y-55-g.y)<B.grenadeRadius+35)this.damageBoss(damage);}
        this.bullets=this.bullets.filter(q=>Math.hypot(q.x-g.x,q.y-g.y)>B.grenadeRadius);
      }
    }
    this.grenades=this.grenades.filter(g=>g.life>0);
  }
  updateAttacks(){for(const a of this.attacks){a.age+=DT;if(a.age>=a.warn&&a.age<a.warn+a.duration&&assaultOverlap(this.playerBox(),a))this.hurt();}this.attacks=this.attacks.filter(a=>a.age<a.warn+a.duration);}
  collect(){
    const p=this.player;
    for(const o of this.objects)if(o.kind==='cage'&&o.hp<=0&&!o.rescued&&Math.hypot(p.x-o.x-24,p.y-25-(o.y+28))<76){o.rescued=true;this.stats.rescued++;this.stats.score+=600;p.grenades=Math.min(B.grenadeLimit,p.grenades+1);this.say('救援成功！獲得松果手榴彈');this.events.push({type:'rescue',x:o.x+24,y:o.y+28});}
    this.level.chips.forEach((c,i)=>{if(!this.chips.includes(i)&&Math.hypot(p.x-c.x,p.y-25-c.y)<42){this.chips.push(i);this.stats.score+=350;p.hp=Math.min(this.settings.hp,p.hp+1);this.say('找到森林徽章，回復一格體力');this.events.push({type:'chip',x:c.x,y:c.y});}});
    this.pickups=this.pickups.filter(o=>{if(Math.hypot(p.x-o.x,p.y-25-o.y)>60)return true;
      if(o.kind==='health'){p.hp=Math.min(this.settings.hp,p.hp+2);if(p.tank>=0)this.tanks[p.tank].hp=Math.min(B.tankHealth,this.tanks[p.tank].hp+3);}
      if(o.kind==='ammo')for(let i=1;i<3;i++)p.ammo[i]=Math.min(B.ammoLimit,p.ammo[i]+B.supplyAmmo);
      if(o.kind==='grenade')p.grenades=Math.min(B.grenadeLimit,p.grenades+B.supplyGrenades);
      this.events.push({type:'pickup',x:o.x,y:o.y});return false;
    });
  }
  hurt(){const p=this.player;if(this.paused||this.status!=='playing'||this.respawnDelay>0||p.invuln>0)return false;this.stats.damage++;p.invuln=B.invulnerability;this.combo=0;this.comboTime=0;this.events.push({type:'hurt',x:p.x,y:p.y-25});
    if(p.tank>=0){const t=this.tanks[p.tank];t.hp--;if(t.hp<=0){p.tank=-1;p.y-=35;p.vy=-220;p.grounded=false;this.say('坦克裝甲耗盡，緊急彈出！');this.events.push({type:'burst',x:p.x,y:p.y});}}
    else{p.hp--;if(p.hp<=0)this.die();}return true;
  }
  die(){if(this.respawnDelay>0)return;this.stats.deaths++;this.respawnDelay=1.05;this.say('稍作整備，回到檢查點');this.events.push({type:'down',x:this.player.x,y:this.player.y});}
  saveCheckpoint(index){this.snapshot=copy({index,player:this.player,objects:this.objects,enemies:this.enemies,tanks:this.tanks,switches:this.switches,chips:this.chips,pickups:this.pickups,stats:this.stats,uid:this.uid});if(index>=0){const c=this.level.checkpoints[index];Object.assign(this.snapshot.player,c);if(this.snapshot.player.tank>=0)Object.assign(this.snapshot.tanks[this.snapshot.player.tank],c);}}
  restoreCheckpoint(){const saved=copy(this.snapshot),deaths=this.stats.deaths,damage=this.stats.damage,dashes=this.stats.dashes,grenades=this.stats.grenades,tankShots=this.stats.tankShots;
    for(const key of ['player','objects','enemies','tanks','switches','chips','pickups','stats','uid'])this[key]=saved[key];this.stats={...this.stats,deaths,damage,dashes,grenades,tankShots};
    const p=this.player;p.hp=this.settings.hp;p.vx=0;p.vy=0;p.dash=0;p.buffer=0;p.invuln=B.checkpointGrace;p.fireCooldown=0;p.crouch=false;
    this.shots=[];this.bullets=[];this.grenades=[];this.attacks=[];this.boss=null;this.combo=0;this.comboTime=0;this.previous={};this.respawnDelay=0;this.say('從檢查點再出發！');this.events.push({type:'respawn',x:p.x,y:p.y});
  }
  medals(){return [this.status==='won',this.status==='won'&&this.chips.length===3&&this.objects.filter(o=>o.kind==='cage').every(o=>o.rescued),this.status==='won'&&this.stats.deaths===0];}
}
