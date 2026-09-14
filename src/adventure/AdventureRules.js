import {SAVE,PLAYER,ITEMS,SKILLS,ENEMIES,AREAS,PADS,REEDS,FOREST_APPLES,MUD,SPAWNS,QUESTS,dist,damage,onIsland,ICE,segmentDistance} from './AdventureData.js';
import {heightAt,BLOCKS} from '../realm/StarForestRules.js';
export {SAVE};
const finite=(v,f)=>Number.isFinite(v)?v:f;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ids=(v,allowed)=>Array.isArray(v)?[...new Set(v.filter(x=>allowed.includes(x)))]:[];
export class AdventureJourney{
 constructor(saved=null,legacy=null){
  const s=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};this.area=s.area==='forest'?'forest':'moon';this.time=0;this.dirty=false;this.messages=[];this.effects=[];this.shots=[];this.fields=[];this.reedAt={};this.nearLatch=null;this.facing={x:1,z:0};this.cooldowns={attack:0,dodge:0,honey:0,elephant:0,blossom:0};this.invulnerable=0;this.slow=0;
  this.legacyRecord=s.legacyRecord;this.completed=ids(s.completed,QUESTS.map(q=>q.id));this.active=QUESTS.some(q=>q.id===s.active)&&!this.completed.includes(s.active)?s.active:null;
  this.calm=ids(s.calm,Object.entries(SPAWNS).flatMap(([area,spawns])=>spawns.map((_,i)=>area+i)));
  this.apples=ids(s.apples,FOREST_APPLES.map(p=>p.id));this.clean=ids(s.clean,MUD.map(p=>p.id));this.revealed=ids(s.revealed,PADS.map(p=>p.id));this.stepped=ids(s.stepped,PADS.map(p=>p.id));this.ice=!!s.ice;this.iceCrossed=!!s.iceCrossed;this.ducksDone=!!s.ducksDone;this.escort=!!s.escort;
  this.unlocked=['honey',...ids(s.unlocked,['elephant','blossom'])];this.equipment={weapon:s.equipment?.weapon===null?null:'wand',armor:s.equipment?.armor===null?null:'coat'};this.loadout={A:this.unlocked.includes(s.loadout?.A)?s.loadout.A:'honey',B:this.unlocked.includes(s.loadout?.B)?s.loadout.B:(this.unlocked.includes('elephant')?'elephant':null)};
  this.hp=clamp(finite(s.hp,PLAYER.hp),1,PLAYER.hp);this.mp=clamp(finite(s.mp,PLAYER.mp),0,PLAYER.mp);this.eventBest=clamp(finite(s.eventBest,0),0,12);this.event=null;this.iceEntered=!!s.iceEntered;
  this.ducks=Array.isArray(s.ducks)&&s.ducks.length===3?s.ducks.map((p,i)=>({x:clamp(finite(p?.x,1-i*.6),-36,36),z:clamp(finite(p?.z,6),-26,26)})):Array.from({length:3},(_,i)=>({x:1-i*.6,z:6}));
  if(!saved&&legacy)this.migrate(legacy);
  this.player={...AREAS[this.area].spawn};if(s.player&&this.walkable(s.player))this.player={x:s.player.x,z:s.player.z};this.spawn();
 }
 migrate(s){
  this.calm=ids((Array.isArray(s.calm)?s.calm:[]).map(i=>'forest'+i),SPAWNS.forest.map((_,i)=>'forest'+i));this.apples=ids((Array.isArray(s.apples)?s.apples:[]).map(i=>'apple'+i),FOREST_APPLES.map(a=>a.id));
  if(this.calm.length===8)this.completed.push('forest_calm');if(this.apples.length===5)this.completed.push('forest_apples');if(s.escortDone){this.ducksDone=true;this.completed.push('forest_ducks');}
  if(s.accepted&&!this.completed.includes('forest_calm'))this.active='forest_calm';else if(s.appleQuest&&!this.completed.includes('forest_apples'))this.active='forest_apples';
  this.legacyRecord=s;this.eventBest=clamp(finite(s.eventBest,0),0,12);this.unlocked=['honey','elephant'];this.loadout.B='elephant';this.dirty=true;
 }
 export(){return {v:2,area:this.area,player:this.player,hp:this.hp,mp:this.mp,completed:this.completed,active:this.active,calm:this.calm,apples:this.apples,clean:this.clean,revealed:this.revealed,stepped:this.stepped,ice:this.ice,iceCrossed:this.iceCrossed,iceEntered:this.iceEntered,ducksDone:this.ducksDone,escort:this.escort,ducks:this.ducks,eventBest:this.eventBest,unlocked:this.unlocked,equipment:this.equipment,loadout:this.loadout,legacyRecord:this.legacyRecord};}
 spawn(){this.animals=SPAWNS[this.area].map(([type,x,z],i)=>({id:this.area+i,type,x,z,home:{x,z},hp:this.calm.includes(this.area+i)?0:ENEMIES[type].hp,root:0,next:1+i*.23,special:3+i*.4,action:null}));this.shots=[];this.fields=[];this.nearLatch=null;}
 stats(){const weapon=ITEMS[this.equipment.weapon];return {attack:weapon?.attack||0,range:weapon?.range||0,interval:weapon?.interval||.6,defense:ITEMS[this.equipment.armor]?.defense||0};}
 equip(slot,id){if(!['armor','weapon'].includes(slot)||id!==null&&ITEMS[id]?.slot!==slot)return false;this.equipment[slot]=id;this.dirty=true;return true;}
 assign(slot,id){if(!['A','B'].includes(slot)||!this.unlocked.includes(id))return false;const other=slot==='A'?'B':'A';if(this.loadout[other]===id)this.loadout[other]=this.loadout[slot];this.loadout[slot]=id;this.dirty=true;return true;}
 quest(){return QUESTS.find(q=>q.id===this.active);}
 offer(){return !this.active?QUESTS.find(q=>q.area===this.area&&!this.completed.includes(q.id)):null;}
 accept(id){const q=this.offer();if(!q||q.id!==id)return false;this.active=id;this.dirty=true;return true;}
 progress(q=this.quest()){
  if(!q)return 0;if(q.kind==='calm')return this.calm.filter(id=>{const a=id.startsWith('moon')?'moon':'forest',i=Number(id.slice(a.length));return a===q.area&&(!q.type||SPAWNS[a][i]?.[0]===q.type);}).length;
  return ({pads:this.stepped.length,apples:this.apples.length,mud:this.clean.length,ice:Number(this.iceCrossed),ducks:Number(this.ducksDone)})[q.kind]||0;
 }
 finish(){const q=this.quest();if(!q||q.area!==this.area||this.progress(q)<q.goal)return false;this.completed.push(q.id);this.active=null;if(q.reward&&!this.unlocked.includes(q.reward)){this.unlocked.push(q.reward);if(!this.loadout.B)this.loadout.B=q.reward;}this.hp=PLAYER.hp;this.mp=PLAYER.mp;this.dirty=true;this.effect('celebrate',this.player,2);this.say('委託完成！'+(q.reward?' 獲得 '+SKILLS[q.reward].name:''),'finish');return true;}
 objective(){const q=this.quest();return q?`${q.title}  ${Math.min(this.progress(q),q.goal)} / ${q.goal}${q.area!==this.area?' · 在'+AREAS[q.area].name:''}`:this.offer()?'靠近'+AREAS[this.area].npc.name+'，聽聽新故事':'本區故事完成 · 自由探索';}
 abandon(){this.active=null;this.dirty=true;}
 say(text,sound='hint'){this.messages.push({text,sound});}
 effect(kind,p,max=1,extra={}){this.effects.push({kind,x:p.x,z:p.z,life:max,max,...extra});}
 walkable(p,enemy=false){if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;if(this.area==='forest')return heightAt(p.x,p.z)!==null&&!BLOCKS.some(b=>dist(p,b)<b.r+.16);
  if(onIsland(p))return true;if(enemy)return false;return PADS.some(a=>(!a.hidden||this.revealed.includes(a.id))&&dist(a,p)<=a.r)||(this.ice&&segmentDistance(p,...ICE)<=1.05);
 }
 moveBody(body,dx,dz,enemy=false){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));let moved=false;for(let i=0;i<n;i++){let p={x:body.x+dx/n,z:body.z+dz/n};if(this.walkable(p,enemy)){Object.assign(body,p);moved=true;}else{p={x:body.x+dx/n,z:body.z};if(this.walkable(p,enemy)){Object.assign(body,p);moved=true;}p={x:body.x,z:body.z+dz/n};if(this.walkable(p,enemy)){Object.assign(body,p);moved=true;}}}return moved;}
 move(dt,axis){let dx=(axis.x+axis.y)*Math.SQRT1_2,dz=(axis.y-axis.x)*Math.SQRT1_2,l=Math.hypot(dx,dz);if(l<.05)return false;dx/=Math.max(1,l);dz/=Math.max(1,l);this.facing={x:dx/(Math.hypot(dx,dz)||1),z:dz/(Math.hypot(dx,dz)||1)};const speed=this.area==='forest'&&this.escort&&!this.ducksDone&&this.quest()?.kind==='ducks'?2.3:PLAYER.speed;return this.moveBody(this.player,dx*dt*speed*(this.slow>0?.55:1),dz*dt*speed*(this.slow>0?.55:1));}
 nearestEnemy(range=Infinity){return this.animals.filter(a=>a.hp>0&&dist(a,this.player)<=range).sort((a,b)=>dist(a,this.player)-dist(b,this.player))[0];}
 cast(kind,aim=null){
  if(kind==='dodge'){if(this.cooldowns.dodge>0)return false;this.cooldowns.dodge=3;this.invulnerable=Math.max(this.invulnerable,.45);if(this.area==='moon')for(const p of PADS)if(dist(p,this.player)<5&&!this.revealed.includes(p.id)){this.revealed.push(p.id);this.dirty=true;}this.effect('dandelion',this.player,1.2);this.moveBody(this.player,this.facing.x*2.5,this.facing.z*2.5);return true;}
  if(kind==='attack'){const s=this.stats();if(!s.attack){this.say('先在手帳裝備魔法棒');return false;}if(this.cooldowns.attack>0)return false;const a=this.nearestEnemy(s.range);if(!a)return false;this.cooldowns.attack=s.interval;this.shots.push({x:this.player.x,z:this.player.z,target:a.id,life:1,speed:14,power:s.attack,friend:true});return true;}
  const skill=SKILLS[kind];if(!skill||!this.unlocked.includes(kind)||this.cooldowns[kind]>0)return false;if(this.mp<skill.cost){this.say('星光不足，稍等一下就會恢復 ✦');return false;}
  const target=kind==='blossom'?null:aim||this.nearestEnemy(skill.range);if(kind!=='blossom'&&(!target||dist(target,this.player)>skill.range+.05||kind==='honey'&&!this.walkable(target))){this.say('再靠近一點，或選擇可以落腳的位置');return false;}if(kind==='blossom'&&this.hp>=PLAYER.hp){this.say('愛心已經滿滿的！');return false;}
  this.mp-=skill.cost;this.cooldowns[kind]=skill.cooldown;this.dirty=true;
  if(kind==='honey'){this.fields.push({x:target.x,z:target.z,r:skill.radius,life:skill.duration,kind:'honey'});this.effect('jar',this.player,.6,{dest:{x:target.x,z:target.z}});}
  if(kind==='elephant'){const d=dist(target,this.player)||1,dir={x:(target.x-this.player.x)/d,z:(target.z-this.player.z)/d};this.effect('elephant',this.player,1.3,{dir});for(const a of this.animals){const d2=dist(a,this.player);if(d2<=skill.range&&((a.x-this.player.x)*dir.x+(a.z-this.player.z)*dir.z)/(d2||1)>.35)this.hit(a,skill.damage);}}
  if(kind==='blossom'){this.hp=Math.min(PLAYER.hp,this.hp+skill.heal);this.effect('heart',this.player,1.6);}return true;
 }
 hit(a,power){if(a.hp<=0)return;a.hp=Math.max(0,a.hp-damage(power,ENEMIES[a.type].defense));this.effect('sparkle',a,.45);if(a.hp===0){this.calm.push(a.id);a.action=null;this.mp=Math.min(PLAYER.mp,this.mp+1);this.effect('heart',a,2);this.dirty=true;if(a.type==='swan'){this.ice=true;this.say('月冠天鵝變回白色了！南側出現星霜小徑。','finish');}else this.say(ENEMIES[a.type].name+'安心休息了 ♥','correct');}}
 hurt(power,slow=0){if(this.invulnerable>0)return false;this.hp-=damage(power,this.stats().defense);this.invulnerable=PLAYER.hurtGrace;this.slow=Math.max(this.slow,slow);this.dirty=true;this.effect('bump',this.player,.6);if(this.hp<=0){this.hp=PLAYER.hp;this.mp=Math.max(3,this.mp);Object.assign(this.player,AREAS[this.area].spawn);this.invulnerable=3;this.shots=[];this.fields=[];for(const a of this.animals){a.action=null;a.next=2;}this.say('星光帶你回到安全岸邊。任務進度都還在 ♥');}return true;}
 context(){const q=this.quest();if(q?.area===this.area){const list=q.kind==='apples'?FOREST_APPLES.filter(a=>!this.apples.includes(a.id)):q.kind==='mud'?MUD.filter(a=>!this.clean.includes(a.id)):[];const p=list.find(a=>dist(a,this.player)<2);if(p)return {...p,kind:q.kind,label:q.kind==='apples'?'採摘蘋果':'清洗小路'};}return null;}
 interact(){const p=this.context();if(!p)return false;(p.kind==='apples'?this.apples:this.clean).push(p.id);this.effect('sparkle',p,1);this.dirty=true;this.say(p.kind==='apples'?'收好一顆陽光蘋果！':'小路乾淨了！','correct');return true;}
 portal(){return dist(this.player,AREAS[this.area].portal)<2;}
 travel(){if(this.event){this.eventBest=Math.max(this.eventBest,this.event.score);this.event=null;}this.area=this.area==='moon'?'forest':'moon';this.player={...AREAS[this.area].spawn};this.spawn();this.invulnerable=2;this.dirty=true;return this.area;}
 eventNearby(){return this.area==='forest'&&!this.event&&dist(this.player,{x:-7,z:-8})<2;}
 startEvent(){if(!this.eventNearby())return false;this.event={left:30,score:0,nuts:Array.from({length:12},(_,i)=>({x:-7+Math.cos(i*2.4)*(2+i%3),z:-8+Math.sin(i*2.4)*(2+i%3),at:i*1.4,taken:false})),rival:{x:-3,z:-8}};this.say('起風了！30 秒內收集金色橡果，和松鼠比一比速度！');return true;}
 nextGoal(){const q=this.quest();if(!q||q.area!==this.area||this.progress(q)>=q.goal)return q?.area!==this.area&&q?AREAS[this.area].portal:AREAS[this.area].npc;
  if(q.kind==='calm')return this.animals.find(a=>a.hp>0&&(!q.type||a.type===q.type))||AREAS[this.area].npc;
  if(q.kind==='pads')return PADS.find(p=>!this.stepped.includes(p.id));if(q.kind==='apples')return FOREST_APPLES.find(p=>!this.apples.includes(p.id));if(q.kind==='mud')return MUD.find(p=>!this.clean.includes(p.id));if(q.kind==='ice')return this.iceEntered?ICE[0]:ICE[1];if(q.kind==='ducks')return this.escort?{x:19,z:10}:this.ducks[0];return null;
 }
 tick(dt,axis={x:0,y:0},attacking=false){
  this.time+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.slow=Math.max(0,this.slow-dt);this.mp=Math.min(PLAYER.mp,this.mp+dt*PLAYER.regen);for(const k in this.cooldowns)this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt);const moving=this.move(dt,axis);if(attacking)this.cast('attack');
  for(const f of this.fields){f.life-=dt;if(f.kind==='honey')for(const a of this.animals)if(dist(a,f)<f.r)a.root=Math.max(a.root,.2);if(f.kind==='mud'&&dist(this.player,f)<f.r)this.slow=Math.max(this.slow,.2);}this.fields=this.fields.filter(f=>f.life>0);
  for(const a of this.animals){if(a.hp<=0)continue;const s=ENEMIES[a.type];a.root=Math.max(0,a.root-dt);a.next-=dt;a.special-=dt;const d=dist(a,this.player),safe=dist(this.player,AREAS[this.area].npc)<5;
   if(safe||d>7){a.action=null;const home=dist(a,a.home);if(home>.3)this.moveBody(a,(a.home.x-a.x)/home*dt,(a.home.z-a.z)/home*dt,true);continue;}
   if(a.action){if(a.root>0)continue;a.action.left-=dt;if(a.action.left<=0){const ac=a.action;a.action=null;a.next=s.interval;const end=ac.target;
     if(ac.kind==='dash'||ac.kind==='hop'){if(segmentDistance(this.player,a,end)<1)this.hurt(s.power);this.moveBody(a,end.x-a.x,end.z-a.z,true);a.next+=.7;}
     else if(ac.kind==='tornado'){this.fields.push({x:a.x,z:a.z,r:3,life:1.8,kind:'tornado',power:s.power});}
     else if(ac.kind==='mud')this.fields.push({...end,r:1.8,life:3,kind:'mud'});
     else if(ac.kind==='fan'){const angle=Math.atan2(end.z-a.z,end.x-a.x);for(const offset of [-.3,0,.3])this.shots.push({x:a.x,z:a.z,dx:Math.cos(angle+offset),dz:Math.sin(angle+offset),speed:5,life:1.2,power:s.power,slow:1.5});}
     else if(s.range>1.5){const dd=dist(a,end)||1;this.shots.push({x:a.x,z:a.z,dx:(end.x-a.x)/dd,dz:(end.z-a.z)/dd,speed:6,life:1.2,power:s.attack,slow:a.type==='capy'?1.5:0});}
     else if(dist(a,this.player)<=s.range+.45)this.hurt(s.attack);
    }continue;}
   if(a.root>0)continue;if(a.next<=0&&d<=(a.special<=0?Math.max(s.range,4):s.range)){const special=a.special<=0;a.action={kind:special?s.special:'basic',left:special?.85:.65,total:special?.85:.65,target:{...this.player}};if(special)a.special=s.cooldown;}
   else if(d>s.range*.85)this.moveBody(a,(this.player.x-a.x)/(d||1)*s.speed*dt,(this.player.z-a.z)/(d||1)*s.speed*dt,true);
  }
  for(const f of this.fields)if(f.kind==='tornado'&&dist(f,this.player)<f.r)this.hurt(f.power);
  for(const b of this.shots){b.life-=dt;const before={x:b.x,z:b.z};if(b.friend){const a=this.animals.find(a=>a.id===b.target);if(!a||a.hp<=0){b.life=0;continue;}const d=dist(a,b);if(d<=b.speed*dt+.3){this.hit(a,b.power);b.life=0;}else{b.x+=(a.x-b.x)/d*b.speed*dt;b.z+=(a.z-b.z)/d*b.speed*dt;}}else{b.x+=b.dx*b.speed*dt;b.z+=b.dz*b.speed*dt;if(segmentDistance(this.player,before,b)<.5){this.hurt(b.power,b.slow);b.life=0;}}}this.shots=this.shots.filter(b=>b.life>0);
  for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
  if(this.area==='moon'){
   for(const p of PADS)if(dist(this.player,p)<p.r&&(!p.hidden||this.revealed.includes(p.id))&&!this.stepped.includes(p.id)){this.stepped.push(p.id);if(!this.revealed.includes(p.id))this.revealed.push(p.id);this.dirty=true;}
   if(this.ice&&segmentDistance(this.player,...ICE)<1&&this.player.x>5)this.iceEntered=true;
   if(this.iceEntered&&this.player.x<-5&&this.player.z>6&&!this.iceCrossed){this.iceCrossed=true;this.dirty=true;}
   for(const p of REEDS)if(dist(p,this.player)<2&&this.time-(this.reedAt[p.id]??-10)>5){this.reedAt[p.id]=this.time;this.effect('music',p,1.4);this.messages.push({sound:'correct'});}
  }else if(this.quest()?.kind==='ducks'&&!this.ducksDone){if(!this.escort&&dist(this.player,this.ducks[0])<2){this.escort=true;this.dirty=true;this.say('小鴨跟上了！慢慢走，別離得太遠。');}if(this.escort){let target=this.player;for(const d of this.ducks){const l=dist(d,target);if(l>1.1&&l<5)this.moveBody(d,(target.x-d.x)/l*dt*2.7,(target.z-d.z)/l*dt*2.7);target=d;}if(dist(this.player,{x:19,z:10})<2&&this.ducks.every(d=>dist(d,{x:19,z:10})<3.8)){this.ducksDone=true;this.dirty=true;this.say('小鴨安全到家了 ♥','finish');}}}
  if(this.event){const e=this.event;e.left-=dt;const elapsed=30-e.left;for(const n of e.nuts)if(!n.taken&&!n.lost&&elapsed>=n.at&&dist(n,this.player)<1){n.taken=true;e.score++;this.effect('sparkle',n,.8);this.messages.push({sound:'correct'});}const target=e.nuts.find(n=>!n.taken&&!n.lost&&elapsed>n.at+2);if(target){const d=dist(e.rival,target);if(d<.5)target.lost=true;else this.moveBody(e.rival,(target.x-e.rival.x)/(d||1)*dt*1.3,(target.z-e.rival.z)/(d||1)*dt*1.3);}if(e.left<=0){this.eventBest=Math.max(this.eventBest,e.score);this.say(`橡果挑戰完成：${e.score} 顆！最高紀錄 ${this.eventBest} 顆`,'finish');this.event=null;this.dirty=true;}}
  return moving;
 }
}
