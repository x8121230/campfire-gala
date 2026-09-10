// Horizontal flight simulation. World units match the 1280 × 480 playfield.
export const STAR_FIELD={width:1280,height:480,step:1/120,bossAt:360};
export const STAR_UPGRADES=['加速','飛彈','雙重','雷射','精靈','護盾'];
export const STAR_CAPS=[2,2,2,2,2,3];
export const STAR_ACTS=['花糖雲海','氣球市集','積木拱門','飛行城堡'];
export const STAR_CONTROLS={joystick:{x:102,y:635,r:61},fire:{x:1173,y:638,r:66},dash:{x:909,y:668,r:43},bomb:{x:1010,y:613,r:45},upgrade:{x:698,y:678,w:222,h:58}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function starSweep(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+t*dx-x,ay+t*dy-y)<=r;}
export class StarflightTouch{
 constructor(){this.reset();}
 reset(){this.owner=null;this.origin={...STAR_CONTROLS.joystick};this.axis={x:0,y:0};this.firing=new Set();this.requests={};}
 down(p){const {x,y,id}=p;for(const key of ['fire','dash','bomb']){const c=STAR_CONTROLS[key];if(Math.hypot(x-c.x,y-c.y)<=c.r){if(key==='fire')this.firing.add(id);else this.requests[key]=true;return;}}
 const c=STAR_CONTROLS.upgrade;if(Math.abs(x-c.x)<c.w/2&&Math.abs(y-c.y)<c.h/2){this.requests.upgrade=true;return;}
 if(this.owner===null&&x<300&&y>250){this.owner=id;this.origin={x:clamp(x,62,245),y:clamp(y,280,650)};this.move(p);}}
 move(p){if(p.id!==this.owner)return;let x=p.x-this.origin.x,y=p.y-this.origin.y,n=Math.max(61,Math.hypot(x,y));this.axis=Math.hypot(x,y)<7?{x:0,y:0}:{x:x/n,y:y/n};}
 up(p){this.firing.delete(p.id);if(p.id===this.owner){this.owner=null;this.axis={x:0,y:0};}}
 read(){return {...this.axis,fire:this.firing.size>0,...this.requests};}
 consume(){this.requests={};}
}
export class StarflightSession{
 constructor({difficulty='normal',seed=98731,checkpoint=null}={}){
  this.difficulty=difficulty;this.seed=seed;this.rng=seed;this.time=checkpoint?.time||0;this.stage=Math.min(3,Math.floor(this.time/120));this.status='playing';this.paused=false;this.accumulator=0;this.id=0;
  this.player={x:210,y:240,hp:difficulty==='challenge'?5:8,maxHp:difficulty==='challenge'?5:8,invuln:2,dashCD:0,dashing:0,shotCD:0,missileCD:0,shield:0};
  this.upgrades=[0,0,0,0,0,0];this.cursor=-1;this.weapon='normal';this.bombs=3;this.score=0;this.chain=0;this.chainLife=0;this.stats={cleared:0,rescued:0,hits:0,upgrades:0,bombs:0};this.events=[];this.enemies=[];this.shots=[];this.bullets=[];this.pickups=[];this.gates=[];this.warnings=[];this.boss=null;this.last={};this.pending={};this.notice='拾取金色能量，選擇你想要的強化';this.noticeLife=6;
  this.nextWave=this.time+3;this.nextSupply=this.time+6;this.nextGate=Math.max(125,this.time+10);this.nextAmbush=Math.max(90,this.time+28);this.nextRescue=this.time+31;this.nextBossGift=370;this.waveIndex=Math.floor(this.time/8);
  if(checkpoint){this.upgrades=[...checkpoint.upgrades];this.weapon=checkpoint.weapon;this.score=checkpoint.score;this.stats={...checkpoint.stats};this.bombs=Math.max(2,checkpoint.bombs);this.player.shield=this.upgrades[5];}
  this.checkpoint=this.snapshot();
 }
 snapshot(){return {time:this.stage*120,upgrades:[...this.upgrades],weapon:this.weapon,score:this.score,stats:{...this.stats},bombs:this.bombs};}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});if(this.events.length>100)this.events.shift();}
 message(t){this.notice=t;this.noticeLife=4;}
 setPaused(v){this.paused=!!v;}
 energy(){this.cursor=(this.cursor+1)%6;this.score+=25;this.emit('energy');}
 upgrade(){const i=this.cursor;if(i<0)return false;if(i===5){if(this.player.shield>=3){this.message('護盾已充滿，可再拾能量選下一格');return false;}this.upgrades[i]=3;this.player.shield=3;}
 else{if(this.upgrades[i]>=STAR_CAPS[i]){if((i===2&&this.weapon!=='double')||(i===3&&this.weapon!=='laser'))this.weapon=i===2?'double':'laser';else{this.message('這項已滿級，再拾能量選下一格');return false;}}
 else{this.upgrades[i]++;if(i===2||i===3)this.weapon=i===2?'double':'laser';}}
 this.cursor=-1;this.stats.upgrades++;this.emit('upgrade');this.message(`${STAR_UPGRADES[i]}強化！${i===2?'雙路射擊，覆蓋斜上方':i===3?'雷射可貫穿敵人':''}`);return true;}
 hit(){const p=this.player;if(p.invuln>0||this.status!=='playing')return false;p.invuln=1.7;this.chain=0;this.stats.hits++;if(p.shield>0)p.shield--;else p.hp--;this.emit('hurt');if(p.hp<=0){this.status='lost';this.emit('end');}return true;}
 addPickup(kind,x,y){this.pickups.push({id:++this.id,kind,x,y,r:kind==='rescue'?25:15,life:14});}
 spawn(kind,x,y,pattern='line',group=0){const data=[{hp:3,r:26,speed:175},{hp:7,r:31,speed:100},{hp:11,r:31,speed:82},{hp:5,r:29,speed:230},{hp:15,r:31,speed:65},{hp:4,r:26,speed:150}][kind];const e={id:++this.id,kind,x,y,baseY:y,pattern,group,age:0,fireCD:1.3+this.random(),...data,maxHp:data.hp,flash:0,exit:false};this.enemies.push(e);return e;}
 wave(){const n=this.waveIndex++,pattern=n%6,group=n+1,y=70+this.random()*330;
  if(pattern===0)for(let i=0;i<6;i++)this.spawn(0,1320+i*70,y,'sine',group);
  if(pattern===1)for(let i=0;i<4;i++)this.spawn(1,1330+i*115,75+i*98,'float',group);
  if(pattern===2){this.spawn(2,1320,90,'hover',group);this.spawn(2,1460,390,'hover',group);for(let i=0;i<3;i++)this.spawn(0,1390+i*80,240,'line',group);}
  if(pattern===3)for(let i=0;i<5;i++)this.spawn(3,1330+i*100,clamp(y+(i-2)*43,45,430),'sine',group);
  if(pattern===4){this.spawn(4,1350,145,'hover',group);this.spawn(4,1530,340,'hover',group);}
  if(pattern===5)for(let i=0;i<5;i++)this.spawn(5,1330+i*100,80+i*74,'zig',group);
 }
 aimed(x,y,speed,offset=0){const a=Math.atan2(this.player.y-y,this.player.x-x)+offset;this.bullets.push({id:++this.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:12});}
 shoot(){const p=this.player,laser=this.weapon==='laser',double=this.weapon==='double';const origins=[{x:p.x+40,y:p.y}];for(let i=0;i<this.upgrades[4];i++)origins.push({x:p.x-38*(i+1),y:p.y+(i%2?-36:36)});
  for(const o of origins){const make=(vy)=>this.shots.push({id:++this.id,x:o.x,y:o.y,vx:laser?1080:820,vy,r:laser?7:6,damage:laser?2+this.upgrades[3]:2,life:1.8,pierce:laser?5:1,hit:new Set(),kind:laser?'laser':'leaf'});make(0);if(double){make(-150);if(this.upgrades[2]>1)make(150);}}
  if(this.upgrades[1]&&p.missileCD<=0){p.missileCD=.72-.12*this.upgrades[1];this.shots.push({id:++this.id,x:p.x+20,y:p.y+15,vx:440,vy:120,r:9,damage:8,life:3.2,pierce:1,hit:new Set(),kind:'missile'});}
  this.emit('shot');p.shotCD=laser?.19:.145;
 }
 defeat(e){if(e.dead)return;e.dead=true;this.stats.cleared++;this.chain++;this.chainLife=3;this.score+=Math.round((e.kind===4?160:80)*(1+Math.min(3,Math.floor(this.chain/8))));this.emit('pop',e.x,e.y,{kind:e.kind});if(e.kind===4||this.stats.cleared%4===0)this.addPickup('energy',e.x,e.y);if(this.stats.cleared%9===0)this.addPickup('star',e.x,e.y-25);}
 advance(seconds,input={}){if(this.paused||this.status!=='playing')return 0;this.accumulator+=clamp(seconds,0,.1);let steps=0;for(const key of ['dash','bomb','upgrade']){if(input[key]&&!this.last[key])this.pending[key]=true;this.last[key]=!!input[key];}const edge={dash:false,bomb:false,upgrade:false,...this.pending};while(this.accumulator+1e-9>=STAR_FIELD.step){this.tick(STAR_FIELD.step,{...input,...(steps===0?edge:{dash:false,bomb:false,upgrade:false})});this.accumulator-=STAR_FIELD.step;this.pending={};steps++;if(this.status!=='playing'){this.accumulator=0;break;}}return steps;}
 tick(dt,input){
  this.time+=dt;const p=this.player;this.noticeLife=Math.max(0,this.noticeLife-dt);this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;
  for(const k of ['invuln','dashCD','dashing','shotCD','missileCD'])p[k]=Math.max(0,p[k]-dt);
  const stage=Math.min(3,Math.floor(this.time/120));if(stage!==this.stage){this.stage=stage;p.hp=Math.min(p.maxHp,p.hp+2);this.bombs=Math.min(4,this.bombs+1);this.checkpoint=this.snapshot();this.message(`${STAR_ACTS[stage]} · 補充 2 生命與 1 星爆`);this.emit('stage');}
  if(input.upgrade)this.upgrade();if(input.dash&&p.dashCD<=0){p.dashCD=4;p.dashing=.23;p.invuln=Math.max(p.invuln,.45);this.emit('dash');}
  if(input.bomb&&this.bombs>0){this.bombs--;this.stats.bombs++;this.bullets=[];p.invuln=Math.max(p.invuln,1.8);for(const e of this.enemies){e.hp-=25;if(e.hp<=0)this.defeat(e);}if(this.boss&&this.boss.age>2)this.boss.hp-=65;this.emit('bomb');}
  let x=input.x||0,y=input.y||0,n=Math.max(1,Math.hypot(x,y));const speed=(245+this.upgrades[0]*45)*(p.dashing>0?2.5:1);p.x=clamp(p.x+x/n*speed*dt,50,1225);p.y=clamp(p.y+y/n*speed*dt,28,452);
  if(input.fire&&p.shotCD<=0)this.shoot();
  if(this.time<354){if(this.time>=this.nextWave){this.wave();this.nextWave+=this.stage===0?9:8;}if(this.time>=this.nextSupply){this.addPickup('energy',1300,80+this.random()*320);this.nextSupply+=14;}
   if(this.time>=this.nextRescue){this.addPickup('rescue',1300,70+this.random()*340);this.nextRescue+=43;}
   if(this.time>=this.nextGate){const gapY=125+this.random()*230,gap=this.stage===2?190:230;this.gates.push({id:++this.id,x:1400,w:76,gapY,gap,scored:false});this.nextGate+=this.stage===2?12:23;}
   if(this.time>=this.nextAmbush){const side=['left','top','bottom'][Math.floor(this.random()*3)];this.warnings.push({side,remaining:2.7,y:80+this.random()*320,x:650+this.random()*450});this.nextAmbush+=38;this.message(`${side==='left'?'後方':side==='top'?'上方':'下方'}有飛行隊靠近！`);}}
  for(const w of this.warnings){w.remaining-=dt;if(w.remaining<=0){for(let i=0;i<2;i++){const e=this.spawn(3,w.side==='left'?-100-i*110:w.x+i*90,w.side==='top'?-80:w.side==='bottom'?560:w.y,w.side==='left'?'rear':w.side);e.baseY=clamp(w.y,70,410);}}}this.warnings=this.warnings.filter(w=>w.remaining>0);
  if(this.time>=360&&!this.boss){this.enemies=[];this.bullets=[];this.gates=[];this.warnings=[];this.boss={x:1460,y:240,r:103,hp:5000,maxHp:5000,age:0,fireCD:2,phase:1,cycle:0,beam:-1,beamY:240};this.message('熊船長的嘉年華考驗！注意蓄力光帶');this.emit('boss');}
  if(this.boss)this.stepBoss(dt);
  for(const e of this.enemies){if(e.dead)continue;e.age+=dt;e.flash=Math.max(0,e.flash-dt);const speed=e.speed;
   if(e.pattern==='rear'){e.x+=speed*dt;if(e.x>1320)e.exit=true;}
   else if(e.pattern==='top'||e.pattern==='bottom'){e.y+=(e.pattern==='top'?1:-1)*speed*dt;e.x-=50*dt;if(e.y< -130||e.y>610)e.exit=true;}
   else{e.x-=speed*dt;if(e.pattern==='sine')e.y=clamp(e.baseY+Math.sin(e.age*2.5)*67,32,448);if(e.pattern==='float')e.y=e.baseY+Math.sin(e.age*2)*18;if(e.pattern==='zig')e.y=clamp(e.baseY+Math.sin(e.age*3)*45,32,448);}
   if(e.x< -130)e.exit=true;
   e.fireCD-=dt;if(e.x>280&&e.x<1190&&e.fireCD<=0){if([1,2,4,5].includes(e.kind)){const speed=(this.difficulty==='challenge'?220:175)+this.stage*12;if(e.kind===4){for(const off of [-.25,0,.25])this.aimed(e.x-20,e.y,speed,off);}else this.aimed(e.x-20,e.y,speed);}
    e.fireCD=e.kind===2?1.65:2.6;}
   if(distance(e,p)<e.r+12)this.hit();
  }
  for(const gate of this.gates){gate.x-=125*dt;if(Math.abs(p.x-gate.x)<gate.w/2+12&&(p.y<gate.gapY-gate.gap/2+12||p.y>gate.gapY+gate.gap/2-12))this.hit();if(!gate.scored&&gate.x<p.x-70){gate.scored=true;this.score+=150;this.emit('gate',p.x,p.y);}}
  this.gates=this.gates.filter(g=>g.x> -100);
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;if(shot.kind==='missile'){const target=this.enemies.find(e=>!e.dead&&e.x>shot.x)||(this.boss?.age>2?this.boss:null);if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x);shot.vx+= (Math.cos(a)*490-shot.vx)*dt*4;shot.vy+=(Math.sin(a)*490-shot.vy)*dt*4;}}
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   for(const g of this.gates)if(shot.x>g.x-g.w/2&&ox<g.x+g.w/2&&(shot.y<g.gapY-g.gap/2||shot.y>g.gapY+g.gap/2))shot.life=0;
   if(shot.life<=0)continue;for(const e of this.enemies)if(!e.dead&&!shot.hit.has(e.id)&&starSweep(ox,oy,shot.x,shot.y,e.x,e.y,e.r+shot.r)){e.hp-=shot.damage;e.flash=.1;shot.hit.add(e.id);shot.pierce--;if(e.hp<=0)this.defeat(e);if(shot.pierce<=0){shot.life=0;break;}}
   const b=this.boss;if(shot.life>0&&b&&b.age>2&&!shot.hit.has('boss')&&starSweep(ox,oy,shot.x,shot.y,b.x,b.y,b.r+shot.r)){b.hp-=shot.damage;shot.hit.add('boss');shot.life=0;this.emit('spark',shot.x,shot.y);}
  }
  for(const b of this.bullets){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(starSweep(ox,oy,b.x,b.y,p.x,p.y,b.r+10)){this.hit();b.life=0;}}
  for(const item of this.pickups){item.x-=110*dt;item.life-=dt;if(distance(item,p)<65&&item.kind!=='rescue'){item.x+=(p.x-item.x)*dt*7;item.y+=(p.y-item.y)*dt*7;}if(distance(item,p)<item.r+24){item.life=0;if(item.kind==='energy')this.energy();else if(item.kind==='heart'){p.hp=Math.min(p.maxHp,p.hp+2);this.emit('rescue');}else if(item.kind==='rescue'){this.stats.rescued++;this.score+=500;p.hp=Math.min(p.maxHp,p.hp+1);this.emit('rescue');this.message('接到迷路星精靈！生命 +1，分數 +500');}else{this.score+=300;this.emit('energy');}}}
  this.enemies=this.enemies.filter(e=>!e.dead&&!e.exit);this.shots=this.shots.filter(s=>s.life>0&&s.x<1450&&s.x> -80&&s.y> -50&&s.y<530);this.bullets=this.bullets.filter(b=>b.life>0&&b.x> -60&&b.x<1350&&b.y> -60&&b.y<540);this.pickups=this.pickups.filter(p=>p.life>0&&p.x> -70);
  if(this.boss?.hp<=0&&this.status==='playing'){this.status='won';this.score+=5000+this.player.hp*250;this.emit('end');}
 }
 stepBoss(dt){const b=this.boss;b.age+=dt;b.x=Math.max(1065,b.x-125*dt);b.y=240+Math.sin(b.age*.65)*105;b.phase=b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.67?2:1;
  if(b.age<3)return;b.fireCD-=dt;if(b.fireCD<=0){b.cycle++;const speed=this.difficulty==='challenge'?235:190;for(let i=-b.phase;i<=b.phase;i++)this.aimed(b.x-100,b.y,speed,i*.18);b.fireCD=b.phase===3?1.05:1.65;
   if(b.phase>=2&&b.cycle%5===0){b.beam=2.5;b.beamY=this.player.y;this.message('星光炮蓄力：離開粉紅光帶！');}
   if(b.phase===3&&b.cycle%4===0)for(let i=0;i<2;i++)this.spawn(0,1340+i*80,70+i*335,'sine');}
  if(b.beam> -1){b.beam-=dt;if(b.beam<.65&&b.beam>0&&Math.abs(this.player.y-b.beamY)<31&&this.player.x<b.x)this.hit();}
  if(distance(b,this.player)<b.r+12)this.hit();
  if(this.time>=this.nextBossGift){this.addPickup('energy',910,clamp(this.player.y+80,60,420));if(Math.floor(this.nextBossGift)%30===10)this.addPickup('heart',850,100+this.random()*280);this.nextBossGift+=10;}
 }
}
