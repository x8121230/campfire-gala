// Star Forest chapter 01. Pure rules, independent of rendering and the main save.
export const SAVE_KEY = 'forest_star_forest_ch1_v1';
export const HOME = {x:-29,z:5};
export const SPOTS = {
  owl:{x:-29,z:1,name:'貓頭鷹村長'}, hedgehog:{x:-25,z:9,name:'刺蝟太太'},
  ducks:{x:1,z:6,name:'走失的小鴨'}, nest:{x:19,z:10,name:'鴨媽媽'},
  event:{x:-7,z:-8,name:'金橡果風鈴'},
  marsh:{x:34,z:7,name:'泡泡泥沼 · 後續區域'}, moon:{x:22,z:-24,name:'沉睡月亮湖 · 後續區域'}
};
export const AUTO_NPCS = ['owl','hedgehog','ducks','nest'];
export const APPLES = [{x:20,z:-8},{x:24,z:-10},{x:28,z:-8},{x:27,z:-14},{x:22,z:-15}];
export const ANIMALS = [
  {x:-12,z:1,type:'rabbit'},{x:-9,z:-4,type:'squirrel'},
  {x:-2,z:-2,type:'rabbit'},{x:3,z:-10,type:'squirrel'},
  {x:10,z:-6,type:'rabbit'},{x:16,z:-12,type:'squirrel'},
  {x:6,z:6,type:'rabbit'},{x:14,z:8,type:'squirrel'}
];
export const TREES = [
  [-32,-4,2.8],[-34,13,1.5],[-23,-7,1.6],[-23,15,1.5],[-16,-13,1.6],[-13,10,1.4],
  [-6,-15,1.6],[4,-17,1.8],[12,-19,1.8],[30,-19,1.6],[33,-3,1.5],
  [4,22,1.8],[24,22,1.5],[-7,19,1.8],[-19,23,1.5]
];
export const MUSHROOMS = [[-17,-4,1.7],[-12,-7,1.4],[-7,4,1.5],[-3,-11,2],[3,1,1.4],[9,-11,1.8],[10,2,1.5],[0,12,1.8],[-14,15,1.5],[18,-18,1.6],[31,0,1.8]];
export const BLOCKS = [
  ...TREES.map(([x,z,s])=>({x,z,r:.38*s})),
  ...MUSHROOMS.map(([x,z,s])=>({x,z,r:.24*s})),
  {x:-32,z:-5,r:2.1},{x:-28,z:12,r:1.5}
];
export const PATHS = [
  [[-34,5],[-29,5],[-22,4],[-16,2],[-9,0],[-1,-3],[8,-5],[17,-5],[24,-9]],
  [[-22,4],[-16,9],[-7,12],[2,8],[10,7],[19,10],[27,8],[34,7]],
  [[-9,0],[-7,-8],[0,-13],[9,-15],[17,-18],[22,-24]],
  [[24,-9],[29,-4],[27,8]], [[-29,5],[-25,9]], [[19,10],[22,16],[19,23]]
];
export function terrainHeight(x,z){
  const hill=3.5*Math.exp(-((x-25)**2/110+(z+12)**2/95));
  return .3*Math.sin(x*.12)*Math.sin(z*.11)+hill;
}
export function inPond(x,z){return ((x-12)/8.5)**2+((z-19)/6.4)**2<1;}
export function heightAt(x,z){return Math.abs(x)>37||Math.abs(z)>27||inPond(x,z)?null:terrainHeight(x,z);}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function screenToWorld(x,y){return {x:(x+y)*Math.SQRT1_2,z:(y-x)*Math.SQRT1_2};}
export function zoneAt(p){return p.x<-21?'橡果樹屋村':p.x>18&&p.z<0?'陽光蘋果坡':p.z>12?'螢光小池塘':'迷亂蘑菇林';}
const validIds=(list,max)=>Array.isArray(list)?[...new Set(list.filter(i=>Number.isInteger(i)&&i>=0&&i<max))]:[];
export class StarJourney {
  constructor(saved){
    const s=saved?.v===1?saved:{};
    this.accepted=!!s.accepted;this.appleQuest=!!s.appleQuest;
    this.calm=validIds(s.calm,ANIMALS.length);this.apples=validIds(s.apples,APPLES.length);
    this.finished=!!s.finished&&this.calm.length===8&&this.apples.length===5;
    this.escortDone=!!s.escortDone;this.eventBest=Math.max(0,Math.min(12,Number(s.eventBest)||0));
    this.player={...HOME,y:terrainHeight(HOME.x,HOME.z)};this.facing={x:Math.SQRT1_2,z:-Math.SQRT1_2};
    this.energy=5;this.invulnerable=0;this.time=0;this.cooldowns={bubble:0,honey:0,dash:0,elephant:0};
    this.animals=ANIMALS.map((p,i)=>({...p,id:i,home:{...p},anger:this.calm.includes(i)?0:3,root:0,attack:0,windup:0,calmAt:-100}));
    this.talkContacts=new Set();this.bubbles=[];this.fields=[];this.effects=[];this.notices=[];this.dirty=false;this.escort=false;
    this.ducks=[0,1,2].map(i=>({x:1-i*.7,z:6+i*.35}));this.event=null;this.dashTime=0;this.obscured=0;
  }
  export(){return {v:1,accepted:this.accepted,appleQuest:this.appleQuest,calm:this.calm,apples:this.apples,finished:this.finished,escortDone:this.escortDone,eventBest:this.eventBest};}
  say(message,sound='hint'){this.notices.push({message,sound});}
  effect(kind,p,life=1,extra={}){this.effects.push({kind,x:p.x,z:p.z,life,max:life,...extra});}
  moveBody(body,dx,dz,r=.35){
    let moved=false;
    for(const axis of ['x','z']){
      const p={x:body.x,z:body.z};p[axis]+=axis==='x'?dx:dz;
      if(heightAt(p.x,p.z)===null||BLOCKS.some(b=>distance(p,b)<b.r+r))continue;
      body[axis]=p[axis];body.y=terrainHeight(body.x,body.z);moved=true;
    }
    return moved;
  }
  nearestEnemy(range=9){return this.animals.filter(a=>a.anger>0&&distance(a,this.player)<=range).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];}
  cast(kind,aim){
    if(!this.accepted){this.say('先走近貓頭鷹村長，領取星光魔法。');return false;}
    if(this.cooldowns[kind]>0)return false;
    const p=this.player;
    if(kind==='bubble'){
      const target=this.nearestEnemy();if(!target)return false;
      this.cooldowns.bubble=.32;this.shotCount=(this.shotCount||0)+1;
      this.bubbles.push({x:p.x,z:p.z,target:target.id,life:2.5});
      this.effect('cast',p,.2);return true;
    }
    if(kind==='honey'){
      let dest=aim||this.nearestEnemy(7)||{x:p.x+this.facing.x*5,z:p.z+this.facing.z*5};
      const d=distance(dest,p),k=Math.min(1,7/(d||1));dest={x:p.x+(dest.x-p.x)*k,z:p.z+(dest.z-p.z)*k};
      if(heightAt(dest.x,dest.z)===null){this.say('蜂蜜要放在草地上，再選一個位置吧。');return false;}
      this.cooldowns.honey=8;this.fields.push({...dest,life:3.5,r:3.4});
      this.effect('jar',p,.45,{dest});this.say('蜂蜜好香！動物會停下腳步 3 秒。','correct');
    }else if(kind==='dash'){
      this.cooldowns.dash=4;this.dashTime=.3;this.dashDirection={...this.facing};this.obscured=1.6;this.invulnerable=Math.max(this.invulnerable,.55);
      this.effect('dandelion',p,1.6);this.say('乘著蒲公英，輕輕滑步！');
    }else if(kind==='elephant'){
      this.cooldowns.elephant=20;this.effect('elephant',p,1.6,{dir:{...this.facing}});
      for(const a of this.animals){const d=distance(a,p),dot=((a.x-p.x)*this.facing.x+(a.z-p.z)*this.facing.z)/(d||1);if(a.anger>0&&d<11&&(dot>.35||d<1.5))this.calmAnimal(a,3);}
      this.say('精靈大象，彩虹洗洗澡！','finish');
    }else return false;
    return true;
  }
  calmAnimal(a,amount){
    if(a.anger<=0)return;a.anger=Math.max(0,a.anger-amount);this.effect('pop',a,.55);
    if(a.anger===0){a.calmAt=this.time;this.calm.push(a.id);this.dirty=true;this.effect('heart',a,2.5);this.say(`好脾氣回來了！ ${this.calm.length} / 8`,'correct');}
  }
  nearby(){
    const candidates=Object.entries(SPOTS).filter(([id])=>!(id==='ducks'&&(this.escort||this.escortDone))).map(([id,p])=>({id,...p}));
    if(this.appleQuest)APPLES.forEach((p,i)=>{if(!this.apples.includes(i))candidates.push({id:`apple${i}`,name:'採摘陽光蘋果',...p});});
    return candidates.filter(p=>distance(p,this.player)<2.7).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];
  }
  autoTalk(){
    // Hysteresis: leave a wider ring before the same NPC can speak again.
    for(const id of [...this.talkContacts])if(distance(this.player,SPOTS[id])>4.2)this.talkContacts.delete(id);
    const candidates=AUTO_NPCS.filter(id=>!this.talkContacts.has(id)&&!(id==='ducks'&&(this.escort||this.escortDone)))
      .map(id=>({id,d:distance(this.player,SPOTS[id])})).filter(p=>p.d<=2.4).sort((a,b)=>a.d-b.d);
    if(!candidates.length)return null;
    const id=candidates[0].id;this.talkContacts.add(id);
    return this.interact(id);
  }
  interact(automaticId=null){
    const spot=automaticId&&AUTO_NPCS.includes(automaticId)&&distance(this.player,SPOTS[automaticId])<=2.4?{id:automaticId,...SPOTS[automaticId]}:this.nearby();if(!spot)return {message:'走近居民會自動交談；金色蘋果或風鈴可按「互動」。'};
    const id=spot.id;
    if(id==='owl'){
      if(!this.accepted){this.accepted=true;this.appleQuest=true;this.dirty=true;return {title:'星光小魔仙，出發吧！',message:'惡作劇流星讓小兔和松鼠愛生氣了！\n幫 8 隻動物找回好脾氣，再到東方的向陽坡採 5 顆陽光蘋果。\n\n按住大泡泡鍵會自動瞄準附近動物。完成後回來找我，大家一起吃蘋果派！'};}
      if(this.calm.length===8&&this.apples.length===5&&!this.finished){this.finished=true;this.dirty=true;this.effect('celebrate',this.player,3);return {title:'第一章完成 · 森林又笑了',message:'8 隻動物找回好脾氣，5 顆陽光蘋果也帶回來了！\n村長送你一枚「森林好朋友」紀念章。\n\n可以繼續護送小鴨、挑戰金橡果風鈴，或打開地圖看看未來的旅程。'};}
      return {title:'貓頭鷹村長',message:this.finished?'謝謝你，森林好朋友！泥沼和月亮湖的故事，會在之後的章節開放。':`安撫動物 ${this.calm.length}/8，陽光蘋果 ${this.apples.length}/5。\n動物在蘑菇林；蘋果在東方高坡，打開地圖就能找到。`};
    }
    if(id==='hedgehog'){this.energy=5;this.dirty=true;return {title:'刺蝟太太的蘋果派攤',message:this.finished?'剛烤好的蘋果派，請慢慢吃！你的星光已補滿。':'來吃一小口餅乾，星光補滿！\n村長會告訴你採蘋果的任務。完成 5 顆蘋果和 8 隻動物的委託，再找村長一起開派對。'};}
    if(id.startsWith('apple')){const i=Number(id.slice(5));if(!this.apples.includes(i)){this.apples.push(i);this.dirty=true;this.effect('sparkle',APPLES[i],1.2);this.say(`陽光蘋果 ${this.apples.length} / 5`,'correct');}return {};}
    if(id==='ducks'){
      if(!this.accepted)return {message:'先和村長交談，再帶小鴨一起出發。'};
      this.escort=true;return {title:'跟著星光回家',message:'三隻小鴨想去東邊池塘找媽媽。\n沿著南側小路慢慢走；走太遠牠們會停下來等你。\n小鴨附近有生氣動物時，先用泡泡幫忙。'};
    }
    if(id==='nest')return {title:'鴨媽媽',message:this.escortDone?'孩子們都回家了，謝謝你！':'我的三個孩子在西邊的小路上。請慢慢帶牠們回來。'};
    if(id==='event'){
      if(!this.accepted)return {message:'先和村長交談，學會星光魔法。'};
      if(this.event)return {message:'金橡果正在飄落，快去撿吧！'};
      this.startEvent();return {message:'起風了！30 秒內走近金橡果收集，和松鼠比比速度！'};
    }
    return {title:spot.name,message:'前方的森林還在準備新的故事。\n本次可以探索樹屋村、蘑菇林、蘋果坡與小池塘。'};
  }
  startEvent(){
    const center=SPOTS.event;
    this.event={left:30,count:0,lost:0,nuts:Array.from({length:12},(_,i)=>{const a=i*2.399;return {x:center.x+Math.cos(a)*(2+i%4),z:center.z+Math.sin(a)*(2+i%4),at:i*1.3,taken:false,lost:false};})};
    this.rival={x:center.x+5,z:center.z+1};
  }
  objective(){
    if(!this.accepted)return '和貓頭鷹村長交談，領取星光魔法';
    if(this.finished)return '森林好朋友 ✓ · 自由探索與小鴨護送';
    if(this.calm.length===8&&this.apples.length===5)return '委託完成！回村找貓頭鷹村長';
    return `好脾氣 ${this.calm.length}/8　·　陽光蘋果 ${this.apples.length}/5`;
  }
  update(dt,axis={x:0,y:0},attacking=false){
    dt=Math.min(.05,Math.max(0,dt));this.time+=dt;
    const l=Math.hypot(axis.x,axis.y),w=screenToWorld(axis.x/Math.max(l,1),axis.y/Math.max(l,1));
    if(l>.12){const n=Math.hypot(w.x,w.z);this.facing={x:w.x/n,z:w.z/n};}
    let moving=false;
    if(this.dashTime>0){moving=this.moveBody(this.player,this.dashDirection.x*19*dt,this.dashDirection.z*19*dt);this.dashTime-=dt;}
    else if(l>.08)moving=this.moveBody(this.player,w.x*5.1*dt,w.z*5.1*dt);
    this.invulnerable=Math.max(0,this.invulnerable-dt);this.obscured=Math.max(0,this.obscured-dt);
    for(const k of Object.keys(this.cooldowns))this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt);
    if(attacking&&this.accepted)this.cast('bubble');
    for(const f of this.fields)f.life-=dt;
    this.fields=this.fields.filter(f=>f.life>0);
    for(const a of this.animals){
      if(a.anger<=0){if(this.time-a.calmAt<2.5)this.moveBody(a,dt*1.8,dt*.6);continue;}
      a.root=Math.max(0,a.root-dt);a.attack=Math.max(0,a.attack-dt);
      for(const f of this.fields)if(distance(a,f)<f.r&&a.root<=0&&!f.hit?.includes(a.id)){a.root=3;(f.hit??=[]).push(a.id);}
      const d=distance(a,this.player),leashed=distance(a,a.home)>7;
      const chase=this.accepted&&d<7.5&&this.player.x>-20&&!leashed&&this.obscured<=0;
      if(a.root>0){a.windup=0;continue;}
      if(a.windup>0){a.windup-=dt;if(a.windup<=0){a.attack=1.5;if(d<1.55&&this.player.x>-21&&this.invulnerable<=0){this.energy--;this.invulnerable=1.8;this.effect('bump',this.player,.7);if(this.energy<=0)this.recover();else this.say('小心搗蛋！滑步或蜂蜜可以拉開距離。');}}continue;}
      if(chase&&d<1.25&&a.attack<=0){a.windup=.65;continue;}
      const target=chase?this.player:{x:a.home.x+Math.sin(this.time*.6+a.id)*1.2,z:a.home.z+Math.cos(this.time*.7+a.id)*1.2};
      const td=distance(a,target);if(td>.25)this.moveBody(a,(target.x-a.x)/td*dt*(chase?1.8:.8),(target.z-a.z)/td*dt*(chase?1.8:.8),.3);
    }
    for(const b of this.bubbles){
      b.life-=dt;const a=this.animals[b.target];if(a.anger<=0){b.life=0;continue;}
      const d=distance(b,a);if(d<dt*15+.4){this.calmAnimal(a,1);b.life=0;}else {b.x+=(a.x-b.x)/d*dt*15;b.z+=(a.z-b.z)/d*dt*15;}
    }
    this.bubbles=this.bubbles.filter(b=>b.life>0);
    this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
    if(this.escort&&!this.escortDone){
      this.ducks.forEach((duck,i)=>{const lead=i===0?this.player:this.ducks[i-1],d=distance(duck,lead);const danger=this.animals.some(a=>a.anger>0&&distance(a,duck)<3);if(!danger&&distance(duck,this.player)<8&&d>1)this.moveBody(duck,(lead.x-duck.x)/d*dt*3.8,(lead.z-duck.z)/d*dt*3.8,.22);});
      if(this.ducks.every(d=>distance(d,SPOTS.nest)<3.7)){this.escortDone=true;this.escort=false;this.dirty=true;this.say('三隻小鴨都回家了！獲得「溫柔領隊」紀念章。','finish');this.effect('celebrate',SPOTS.nest,2.5);}
    }
    if(this.event){
      const e=this.event;e.left=Math.max(0,e.left-dt);const elapsed=30-e.left;
      for(const n of e.nuts)if(!n.taken&&!n.lost&&elapsed>n.at+.8&&distance(n,this.player)<1.2){n.taken=true;e.count++;this.effect('sparkle',n,.7);this.say(`金橡果 ${e.count} 顆`,'correct');}
      const n=e.nuts.find(n=>!n.taken&&!n.lost&&elapsed>n.at+3);
      if(n){const d=distance(n,this.rival);if(d<.6){n.lost=true;e.lost++;}else this.moveBody(this.rival,(n.x-this.rival.x)/d*dt*1.25,(n.z-this.rival.z)/d*dt*1.25,.2);}
      if(e.left===0){this.eventBest=Math.max(this.eventBest,e.count);this.dirty=true;this.say(`豐收完成！你 ${e.count} 顆 · 松鼠 ${e.lost} 顆。最高 ${this.eventBest} 顆，可再敲風鈴挑戰。`,'finish');this.event=null;}
    }
    if(this.player.x<-21)this.energy=Math.min(5,this.energy+dt*.4);
    return moving;
  }
  recover(){this.player={...HOME,y:terrainHeight(HOME.x,HOME.z)};this.energy=5;this.invulnerable=3;this.dashTime=0;
    this.talkContacts.clear();if(this.escort)this.ducks=[0,1,2].map(i=>({x:HOME.x-1-i*.6,z:HOME.z+1}));
    this.say('星光送你回村歇一歇，任務進度都有保留。','hint');this.effect('celebrate',this.player,2);
  }
}
