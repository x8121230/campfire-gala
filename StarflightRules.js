import {getStarCraft} from './StarflightCrafts.js';
import {CARNIVAL_ENEMIES,carnivalTimeline,carnivalEvent,carnivalEnemy,carnivalHazard,carnivalDefeat,carnivalHit} from './StarflightCarnival.js';
import {LAKE_ENEMIES,lakeTimeline,lakeEvent,lakeEnemy,lakeHazard,lakeDefeat,lakeHit} from './StarflightLake.js';
import {CAVE_ENEMIES,caveTimeline,caveEvent,caveEnemy,caveHazard,caveDefeat,caveHit} from './StarflightCave.js';
import {ICE_ENEMIES,iceTimeline,iceEvent,iceEnemy,iceHazard,iceDefeat,iceHit} from './StarflightIce.js';
import {WETLAND_ENEMIES,wetlandTimeline,wetlandEvent,wetlandEnemy,wetlandHazard,wetlandDefeat,wetlandHit} from './StarflightWetland.js';
import {MAGMA_ENEMIES,magmaTimeline,magmaEvent,magmaEnemy,magmaHazard,magmaDefeat,magmaHit} from './StarflightMagma.js';
import {FOREST_ENEMIES,forestTimeline,forestEvent,forestEnemy,forestHazard,forestDefeat,forestHit} from './StarflightForest.js';
import {TRANSIT_ENEMIES,transitTimeline,transitEvent,transitEnemy,transitHazard,transitDefeat} from './StarflightTransit.js';
// Horizontal flight simulation. World units match the 1280 × 480 playfield.
export const STAR_REGION_SECONDS=48;
export const STAR_TRANSIT_SECONDS=10;
export const STAR_SEGMENT_SECONDS=STAR_REGION_SECONDS+STAR_TRANSIT_SECONDS;
export const STAR_ROUTE_LENGTH=3;
export const starRegionStart=index=>index*STAR_SEGMENT_SECONDS;
export const STAR_FIELD={width:1280,height:480,step:1/120,bossAt:starRegionStart(STAR_ROUTE_LENGTH-1)+STAR_REGION_SECONDS,hitRadius:5,scrollSpeed:155};
export const STAR_ACTS=['糖果雲端嘉年華','月光湖','星晶洞穴','霜花冰原','螢光濕地','熔火岩漿海','古木樹海','區域首領'];
export const STAR_WEAPONS=[
 {id:'clover',name:'幸運草連射',icon:'草',color:0x83ed99,tip:'雙向 → 三向 → 五向扇形連射',role:'廣角'},
 {id:'laser',name:'彩虹星露炮',icon:'光',color:0x7cdbff,tip:'穿透敵人，地形仍會阻擋光束',role:'貫穿'},
 {id:'homing',name:'蒲公英導彈',icon:'追',color:0xffd273,tip:'雙發 → 四發 → 六發追蹤爆破',role:'追蹤'}
];
export const STAR_SPECIALS=[
 {id:'chargeLaser',name:'聚氣雷射',short:'雷射',cd:5,charge:2,color:0x7cdbff,tip:'點一下，自動集氣 2 秒後發射貫穿光束'},
 {id:'explosive',name:'炸裂彈',short:'炸裂',cd:4,charge:0,color:0xffc87b,tip:'直射種子彈，命中後爆開、安撫附近敵人'},
 {id:'shotgun',name:'幸運草散彈',short:'散彈',cd:3,charge:0,color:0x83ed99,tip:'七向扇形散射，適合靠近大型敵人使用'}
];
export const STAR_PHASE1={version:'0.10.6',craftId:'swift-vanguard',craftName:'巡天雨燕',normalShotCooldown:.5,chargeSeconds:2,playerSpeed:245,visualScale:1.05,launchSeconds:3,guardianSeconds:3};
export const STAR_TUNING=[
 {id:'playerSpeed',name:'玩家移動速度',default:245,min:120,max:450,step:12.5,digits:1,unit:''},
 {id:'shotCooldown',name:'普攻發射間隔',default:.5,min:.2,max:1.2,step:.1,digits:1,unit:'秒'},
 {id:'playerBulletSpeed',name:'玩家子彈速度',default:880,min:500,max:1300,step:100,digits:0,unit:''},
 {id:'enemySpeedScale',name:'敵人移動速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyBulletScale',name:'敵方子彈速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyHpScale',name:'敵人生命倍率',default:1,min:.5,max:2.5,step:.25,digits:2,unit:'×'},
 {id:'waveScale',name:'每波敵人數量',default:1,min:.5,max:2,step:.25,digits:2,unit:'×'}
];
export const STAR_CONTROLS={dash:{x:937,y:617,r:42},joystick:{x:100,y:610,r:57},special:{x:1060,y:510,r:42},bomb:{x:1060,y:617,r:45},trait:{x:1180,y:607,r:56}};

export const STAR_REGIONS=[
 {id:'candy-cloud-carnival',type:'sky',name:'糖果雲端嘉年華',theme:'carnival',patterns:[0,3,5],hazard:'candyWind'},
 {id:'moonlight-lake',type:'lake',name:'靜謐月光湖',theme:'crystal',patterns:[0,1,6],hazard:'mist'},
 {id:'jelly-reeds',type:'lake',name:'水母蘆葦水域',theme:'crystal',patterns:[5,6,1],hazard:'mist'},
 {id:'star-crystal-cave',type:'cave',name:'星晶回音洞穴',theme:'cave',patterns:[2,7,3],hazard:'rockfall'},
 {id:'moonstone-cave',type:'cave',name:'月石鐘乳洞',theme:'cave',patterns:[0,7,2],hazard:'rockfall'},
 {id:'frost-petal-tundra',type:'ice',name:'霜花水晶冰原',theme:'ice',patterns:[8,0,5],hazard:'icefall'},
 {id:'glowcap-wetland',type:'wetland',name:'螢光菇泡泡濕地',theme:'wetland',patterns:[9,6,5],hazard:'marsh'},
 {id:'ember-magma-sea',type:'magma',name:'焦糖熔岩海火山群島',theme:'magma',patterns:[10,3,1],hazard:'ember'},
 {id:'ancient-tree-sea',type:'forest',name:'古木樹冠迷航',theme:'forest',patterns:[11,2,7],hazard:'canopy'}
];
export const STAR_MAPS=STAR_REGIONS;
export const STAR_REGION_BOSSES={
 sky:{regionType:'sky',name:'糖星雲鯨',hp:820,color:0xffc6df,attack:'candy'},
 lake:{regionType:'lake',name:'月鏡水龍',hp:850,color:0x9edfff,attack:'mist'},
 cave:{regionType:'cave',name:'星晶洞窟巨像',hp:900,color:0xc4a5ff,attack:'rockfall'},
 ice:{regionType:'ice',name:'霜冠冰天鵝',hp:840,color:0xd8f8ff,attack:'icefall'},
 wetland:{regionType:'wetland',name:'螢霧菌王',hp:880,color:0xa7db99,attack:'marsh'},
 magma:{regionType:'magma',name:'焦糖熔火古翼龍',hp:920,color:0xff9a68,attack:'ember'},
 forest:{regionType:'forest',name:'古樹機巧守護者',hp:940,color:0xb9c983,attack:'canopy'}
};

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const seeded=(seed)=>{let n=(seed^0x9e3779b9)>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
export function starSweep(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+t*dx-x,ay+t*dy-y)<=r;}

const STAR_REGION_TYPES=['sky','lake','cave','ice','wetland','magma','forest'];
const regionVariants=type=>STAR_REGIONS.filter(r=>r.type===type);
const decorateRegion=(region,index,random)=>({...region,index,waveCount:3+Math.floor(random()*3)});
export function buildStarBranchOptions(current,index,seed=98731){const random=seeded((seed^Math.imul(index+1,0x45d9f3b)^current.type.length*2654435761)>>>0),order=STAR_REGION_TYPES.filter(type=>type!==current.type);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const choices=order.slice(0,2).map(type=>{const pool=regionVariants(type);return {...pool[Math.floor(random()*pool.length)],index:index+1,waveCount:3+Math.floor(random()*3)};});
 if(random()<.5)choices.reverse();return {top:choices[0],bottom:choices[1]};}
export function buildStarRoute(seed=98731){const random=seeded(seed),types=[...STAR_REGION_TYPES];
 for(let i=types.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
 return types.slice(0,STAR_ROUTE_LENGTH).map((type,index)=>{const pool=regionVariants(type);return decorateRegion(pool[Math.floor(random()*pool.length)],index,random);});}
export function resolveStarPhase(time){
 for(let index=0;index<STAR_ROUTE_LENGTH;index++){const start=starRegionStart(index),end=start+STAR_REGION_SECONDS;
  if(time<end)return {kind:'region',index,elapsed:Math.max(0,time-start),start,end};
  if(index<STAR_ROUTE_LENGTH-1&&time<end+STAR_TRANSIT_SECONDS)return {kind:'transit',index,nextIndex:index+1,elapsed:time-end,start:end,end:end+STAR_TRANSIT_SECONDS};
 }
 return {kind:'boss',index:STAR_ROUTE_LENGTH,elapsed:Math.max(0,time-STAR_FIELD.bossAt),start:STAR_FIELD.bossAt,end:Infinity};
}


export const STAR_SOCKET={safeTop:165,safeBottom:315};
export const STAR_ENEMIES=[
 {name:'打嗝小烏雲',hp:1,r:19,speed:215},{name:'熱氣球胖胖豬',hp:95,r:43,speed:65},
 {name:'吐籽西瓜鳥',hp:24,r:23,speed:155},{name:'紙飛機鼯鼠',hp:5,r:22,speed:210},
 {name:'紅帽補給雲',hp:7,r:24,speed:125},{name:'搖擺蜜蜂',hp:3,r:18,speed:190},
 {name:'月泡水豚',hp:8,r:25,speed:125},{name:'回音小蝙蝠',hp:4,r:18,speed:185},
 {name:'冰羽小貓頭鷹',hp:6,r:21,speed:175},{name:'泥泡跳跳蛙',hp:5,r:19,speed:165},
 {name:'火種小蜥蜴',hp:9,r:22,speed:150},{name:'松果滑翔鳥',hp:6,r:20,speed:180},...CARNIVAL_ENEMIES,...LAKE_ENEMIES,...CAVE_ENEMIES,...ICE_ENEMIES,...WETLAND_ENEMIES,...MAGMA_ENEMIES,...FOREST_ENEMIES,...TRANSIT_ENEMIES
];
export function starColor(item){const phase=((item.age||0)/1.5)%3,index=Math.floor(phase);return {id:STAR_WEAPONS[index].id,index,remaining:(1-phase%1)*1.5};}
export function buildStarTimeline(route,seed){
 const rng=seeded(seed^0x51fa),events=[];
 route.forEach((m,index)=>{const start=starRegionStart(index),slots=[4,12,20,28,35];events.push({at:start+.05,type:'region',index});
  if(m.type==='sky'){
   events.push(...carnivalTimeline(m,seed,index,start),{at:start+8,type:'carrier',index},{at:start+38,type:'carnivalClear',index});
   return;
  }
  if(m.type==='lake'){
   events.push(...lakeTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'lakeClear',index});
   return;
  }
  if(m.type==='cave'){
   events.push(...caveTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'caveClear',index});
   return;
  }
  if(m.type==='ice'){
   events.push(...iceTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'iceClear',index});
   return;
  }
  if(m.type==='wetland'){
   events.push(...wetlandTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'wetlandClear',index});
   return;
  }
  if(m.type==='magma'){
   events.push(...magmaTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'magmaClear',index});
   return;
  }
  if(m.type==='forest'){
   events.push(...forestTimeline(m,seed,index,start),{at:start+12,type:'carrier',index},{at:start+43,type:'forestClear',index});
   return;
  }
  for(let i=0;i<m.waveCount;i++)events.push({at:start+slots[i],type:'wave',pattern:m.patterns[Math.floor(rng()*m.patterns.length)],index});
  if(m.type==='sky')events.push({at:start+16,type:'gust',index});
  if(m.type==='lake')for(const at of [10,24,34])events.push({at:start+at,type:'mist',index});
  if(m.type==='lake')for(const at of [17,31])events.push({at:start+at,type:'lakeJump',index});
  if(m.type==='cave'){events.push({at:start+18,type:'terrain',index});for(const at of [9,25,34])events.push({at:start+at,type:'rockfall',index});}
  if(m.type==='ice')for(const at of [9,23,35])events.push({at:start+at,type:'icefall',index});
  if(m.type==='wetland')for(const at of [10,24,35])events.push({at:start+at,type:'marsh',index});
  if(m.type==='magma')for(const at of [9,21,34])events.push({at:start+at,type:'ember',index});
  if(m.type==='forest'){events.push({at:start+15,type:'canopy',index},{at:start+31,type:'canopy',index});}
  events.push({at:start+8,type:'carrier',index});if(index===1)events.push({at:start+30,type:'option',index});
 });
 route.slice(0,-1).forEach((m,index)=>events.push(...transitTimeline(index,starRegionStart(index)+STAR_REGION_SECONDS,seed)));
 events.push({at:STAR_FIELD.bossAt-3,type:'warning',index:STAR_ROUTE_LENGTH},{at:STAR_FIELD.bossAt,type:'boss',index:STAR_ROUTE_LENGTH});
 return events.sort((a,b)=>a.at-b.at);
}
export class StarflightTouch{
 constructor(){this.reset();}
 reset(){this.owner=null;this.origin={...STAR_CONTROLS.joystick};this.axis={x:0,y:0};this.firing=new Set();this.requests={};}
 down(p){const {x,y,id}=p;for(const key of ['special','bomb','trait','dash']){const c=STAR_CONTROLS[key];if(Math.hypot(x-c.x,y-c.y)<=c.r){this.requests[key]=true;if(key==='trait')this.traitHold={id,at:performance.now()};return;}}
  if(this.owner===null&&x<450&&y>110){this.owner=id;this.origin={x:clamp(x,62,390),y:clamp(y,140,645)};this.move(p);}}
 move(p){if(p.id!==this.owner)return;const x=p.x-this.origin.x,y=p.y-this.origin.y,n=Math.max(57,Math.hypot(x,y));this.axis=Math.hypot(x,y)<7?{x:0,y:0}:{x:x/n,y:y/n};}
 up(p){this.firing.delete(p.id);if(this.traitHold?.id===p.id){if(performance.now()-this.traitHold.at>=1000){this.requests.bay=true;delete this.requests.trait;}this.traitHold=null;}if(p.id===this.owner){this.owner=null;this.axis={x:0,y:0};}}
 read(){if(this.traitHold&&performance.now()-this.traitHold.at>=1000){this.requests.bay=true;delete this.requests.trait;this.traitHold=null;}return {...this.axis,fire:this.firing.size>0,...this.requests};}
 consume(){this.requests={};}
}
export class StarflightSession{
 constructor({difficulty='normal',seed=98731,checkpoint=null,guardianEnabled=false,craftId='swift',skyScenario=-1}={}){
  this.difficulty=difficulty;this.seed=checkpoint?.seed??seed;this.rng=checkpoint?.rng??this.seed;this.time=checkpoint?.time||0;
  this.route=checkpoint?.route?.map(m=>({...m}))||buildStarRoute(this.seed);const initialPhase=resolveStarPhase(this.time);this.segment=initialPhase.kind==='boss'?STAR_ROUTE_LENGTH:initialPhase.index;this.stage=this.segment;this.travelPhase=initialPhase.kind;
  if(!checkpoint){const candy=this.route.find(m=>m.type==='sky');if(candy)candy.carnivalScenario=skyScenario;}
  this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>=this.time);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.status='playing';this.paused=false;this.accumulator=0;this.id=0;this.craft=getStarCraft(checkpoint?.craftId||craftId);this.hitRadius=this.craft.radius;const hp=this.craft.hp;this.velocity={x:0,y:0};this.guardFeathers=0;this.guardTime=0;this.cruise=0;this.breezeCD=0;
  this.tuning=Object.fromEntries(STAR_TUNING.map(item=>[item.id,checkpoint?.tuning?.[item.id]??item.default]));this.gmUsed=checkpoint?.gmUsed??false;if(!checkpoint?.tuning){this.tuning.playerSpeed=this.craft.speed;this.tuning.shotCooldown=this.craft.cd;}
  this.player={x:210,y:240,hp,maxHp:hp,invuln:2,dashCD:0,dashing:0,shotCD:0,traitCD:0,shield:0};
  this.weapon='clover';
  this.specialWeapon=checkpoint?.specialWeapon||'chargeLaser';this.specialCooldowns={chargeLaser:0,explosive:0,shotgun:0,...checkpoint?.specialCooldowns};
  this.charging=null;this.ultimateEnergy=checkpoint?.ultimateEnergy||0;this.energyBudget=0;this.phase='combat';this.phaseTime=0;this.laserVisual=null;this.bayOpen=false;this.suitActive=null;
  this.guardianEnabled=checkpoint?.guardianEnabled??!!guardianEnabled;this.guardianUsed=checkpoint?.guardianUsed??false;
  this.weaponRanks={clover:1,laser:1,homing:1,...checkpoint?.weaponRanks};this.options=checkpoint?.options||0;this.optionTrail=[];this.optionPositions=[];
  this.bombs=0;this.score=checkpoint?.score||0;this.chain=0;this.chainLife=0;
  this.stats={cleared:0,rescued:0,hits:0,bombs:0,weaponChoices:0,upgrades:0,graze:0,branches:0,gmChanges:0,...checkpoint?.stats};
  this.events=[];this.enemies=[];this.shots=[];this.bullets=[];this.pickups=[];this.gates=[];this.hazards=[];this.warnings=[];this.branchOffer=null;this.environmentSlow=1;this.boss=null;this.last={};this.pending={};
  this.notice='自動普攻 · I 專屬技能 · U 衝刺 · J 特殊武器';this.noticeLife=4;this.nextBossGift=STAR_FIELD.bossAt+12;this.checkpoint=this.snapshot();
 }
 get currentMap(){return this.segment<STAR_ROUTE_LENGTH?this.route[this.segment]:this.boss?this.route[STAR_ROUTE_LENGTH-1]:null;}
 get inTransit(){return this.travelPhase==='transit';}
 get phaseInfo(){return resolveStarPhase(this.time);}
 get dangerTier(){return Math.min(3,this.segment);}
 snapshot(){const time=this.boss?STAR_FIELD.bossAt:starRegionStart(Math.min(this.segment,STAR_ROUTE_LENGTH-1));return {craftId:this.craft.id,specialWeapon:this.specialWeapon,specialCooldowns:{...this.specialCooldowns},ultimateEnergy:this.ultimateEnergy,guardianEnabled:this.guardianEnabled,guardianUsed:this.guardianUsed,seed:this.seed,rng:this.rng,time,route:this.route.map(m=>({...m})),weapon:this.weapon,weaponRanks:{...this.weaponRanks},options:this.options,score:this.score,stats:{...this.stats},bombs:this.bombs,tuning:{...this.tuning},gmUsed:this.gmUsed};}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});if(this.events.length>150)this.events.shift();}
 message(t){this.notice=t;this.noticeLife=3;}
 setPaused(v){this.paused=!!v;}
 setTuning(id,value){const rule=STAR_TUNING.find(item=>item.id===id);if(!rule||!Number.isFinite(value))return false;const old=this.tuning[id],next=Math.round(clamp(value,rule.min,rule.max)*1000)/1000;if(next===old)return false;
  this.tuning[id]=next;this.gmUsed=true;this.stats.gmChanges++;
  if(id==='playerBulletSpeed'&&old>0)for(const shot of this.shots){shot.vx*=next/old;shot.vy*=next/old;}
  if(id==='enemyBulletScale'&&old>0)for(const bullet of this.bullets){bullet.vx*=next/old;bullet.vy*=next/old;}
  if(id==='enemyHpScale'&&old>0){for(const enemy of this.enemies){enemy.hp*=next/old;enemy.maxHp*=next/old;}if(this.boss){this.boss.hp*=next/old;this.boss.maxHp*=next/old;}}
  this.message('GM 調校：'+rule.name+' → '+next.toFixed(rule.digits)+rule.unit);return true;
 }
 resetTuning(){for(const item of STAR_TUNING)this.setTuning(item.id,item.id==='playerSpeed'?this.craft.speed:item.id==='shotCooldown'?this.craft.cd:item.default);this.gmUsed=false;this.message('GM 調校已恢復正式預設值');return true;}
 forceRegion(type){if(this.segment>=STAR_ROUTE_LENGTH||!STAR_REGION_TYPES.includes(type))return false;const pool=regionVariants(type),region=pool[Math.floor(this.random()*pool.length)];if(!region)return false;
  this.route[this.segment]={...region,index:this.segment,waveCount:4};this.enemies=[];this.bullets=[];this.hazards=[];this.gates=[];this.branchOffer=null;this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>this.time+1e-7);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.gmUsed=true;this.stats.gmChanges++;this.emit('stage',0,0,{theme:region.theme});this.message('GM 地圖切換：'+region.name);return true;
 }
 hit(){const p=this.player;if(p.invuln>0||this.phase!=='combat'||this.status!=='playing')return false;p.invuln=1.7;this.chain=0;this.stats.hits++;this.cruise=0;if(this.craft.id==='swift'&&this.breezeCD<=0){this.breezeCD=12;this.bullets=this.bullets.filter(b=>distance(b,p)>125);this.emit('breeze');}if(p.shield>0)p.shield--;else p.hp--;this.emit('hurt');if(p.hp<=0){this.phase='falling';this.phaseTime=0;this.charging=null;this.emit('fall');}return true;}
 addPickup(kind,x,y){const item={id:++this.id,kind,x,y,age:0,r:kind==='weapon'?23:kind==='option'?20:12,life:18,locked:null};this.pickups.push(item);return item;}
 collectWeapon(){if(this.weaponRanks.clover<3){this.weaponRanks.clover++;this.stats.upgrades++;}else this.score+=750;
  this.stats.weaponChoices++;this.emit('weaponChosen');this.message('種子普攻 Lv.'+this.weaponRanks.clover+' · 特殊武器由武器艙選擇');return true;
 }
 openBay(){if(this.status!=='playing'||this.phase!=='combat'||this.paused)return false;this.bayOpen=true;this.paused=true;return true;}
 equipSpecial(id){if(!this.bayOpen||!STAR_SPECIALS.some(w=>w.id===id))return false;
  if(id!==this.specialWeapon){this.charging=null;this.specialWeapon=id;}return true;
 }
 closeBay(){if(!this.bayOpen)return false;this.bayOpen=false;this.paused=false;this.last={};this.pending={};return true;}
 openBranch(){if(this.segment>=STAR_ROUTE_LENGTH-1||this.branchOffer)return false;const options=buildStarBranchOptions(this.currentMap,this.segment,this.seed);this.branchOffer={...options,selected:null,source:null};this.message('航線分岔！飛入上／下通道，或點選路牌');this.emit('branchOpen',0,0,{top:options.top.name,bottom:options.bottom.name});return true;}
 chooseBranch(side,source='flight'){const offer=this.branchOffer;if(!offer||offer.selected||!['top','bottom'].includes(side))return false;const chosen={...offer[side],index:this.segment+1};this.route[this.segment+1]=chosen;
  if(this.segment+2<STAR_ROUTE_LENGTH){const next=buildStarBranchOptions(chosen,this.segment+1,this.seed),fallback=((this.seed>>>this.segment)&1)?'top':'bottom';this.route[this.segment+2]={...next[fallback],index:this.segment+2};}
  offer.selected=side;offer.source=source;offer.selectedId=chosen.id;this.stats.branches=(this.stats.branches||0)+1;this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>this.time+1e-7);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.message((side==='top'?'上方':'下方')+'航線確認：'+chosen.name);this.emit('branchChosen',0,0,{side,name:chosen.name,source});return true;}
 gainEnergy(amount){amount*=this.craft.energy;if(this.phase!=='combat')return;const earned=Math.min(amount,Math.max(0,8-this.energyBudget));this.energyBudget+=earned;this.ultimateEnergy=Math.min(100,this.ultimateEnergy+earned);}
 triggerSpecial(){if(this.phase!=='combat'||this.paused||this.charging||this.specialCooldowns[this.specialWeapon]>0)return false;
  const w=STAR_SPECIALS.find(w=>w.id===this.specialWeapon);
  if(w.charge){this.charging={id:w.id,elapsed:0};this.emit('charge');}else this.fireSpecial(w.id);return true;
 }
 fireSpecial(id){const p=this.player,w=STAR_SPECIALS.find(w=>w.id===id);this.specialCooldowns[id]=w.cd;this.stats.specials=(this.stats.specials||0)+1;
  if(id==='chargeLaser'){
   let end=1280;for(const g of this.gates)if(g.x>p.x&&(p.y<g.gapY-g.gap/2+13||p.y>g.gapY+g.gap/2-13))end=Math.min(end,g.x-g.w/2);
   this.laserVisual={x:p.x+28,y:p.y,end,life:.32};
   for(const e of this.enemies)if(!e.dead&&!e.exit&&e.x>=p.x+28&&e.x-e.r<end&&Math.abs(e.y-p.y)<=e.r+13){e.hp-=45;carnivalHit(this,e);lakeHit(this,e);caveHit(this,e,45);iceHit(this,e,45);wetlandHit(this,e,45);magmaHit(this,e,45);forestHit(this,e,45);e.flash=.08;this.gainEnergy(2);if(e.hp<=0)this.defeat(e);}
   const b=this.boss;if(b&&b.age>2&&b.x-b.r<end&&b.x>p.x&&Math.abs(b.y-p.y)<=b.r+13){b.hp-=65;b.flash=.08;this.gainEnergy(3);}
   this.emit('laserFire');
  }else{
   const angles=id==='shotgun'?[-.45,-.30,-.15,0,.15,.30,.45]:[0];
   for(const a of angles){const velocity=this.tuning.playerBulletSpeed*.864;this.shots.push({id:++this.id,x:p.x+28,y:p.y,vx:velocity*Math.cos(a),vy:velocity*Math.sin(a),r:id==='explosive'?10:8,damage:id==='explosive'?22:7,life:1.6,pierce:1,hit:new Set(),kind:id==='explosive'?'explosive':'leaf',rank:2,special:true});}
   this.emit(id==='explosive'?'explosiveFire':'shotgunFire');
  }
 }
 triggerTrait(){const p=this.player;if(this.phase!=='combat'||this.paused||p.traitCD>0)return false;
  this.stats.traits=(this.stats.traits||0)+1;p.traitCD=4;
  if(this.craft.id==='swift'){for(const a of [-.3,-.15,0,.15,.3])this.craftShot(a,'leaf',12,2);}
  if(this.craft.id==='falcon'){p.dashing=.28;p.invuln=Math.max(p.invuln,.3);this.craftShot(0,'laser',45,12,1550);}
  if(this.craft.id==='owl'){if(this.guardFeathers){for(let i=0;i<this.guardFeathers;i++)this.craftShot((i-1.5)*.16,'leaf',18,3);this.guardFeathers=0;this.guardTime=0;p.traitCD=4;}else{this.guardFeathers=4;this.guardTime=5;p.traitCD=.5;}}
  if(this.craft.id==='ancient'){p.shield=1;this.guardTime=2;this.craftShot(0,'explosive',55,3,620);p.traitCD=6;}
  if(this.craft.id==='starwing'){const targets=this.enemies.filter(e=>!e.dead&&e.x>p.x).sort((a,b)=>distance(a,p)-distance(b,p)).slice(0,4);if(!targets.length)this.craftShot(0,'laser',35,4);else targets.forEach((e,i)=>this.craftShot((i-1.5)*.25,'homing',26,1,740,e));p.traitCD=5;this.emit('lock',p.x,p.y,{targets:targets.map(e=>({x:e.x,y:e.y}))});}
  this.emit('traitFire');return true;
 }

 explode(shot,target){this.emit('burst',target.x,target.y);for(const e of this.enemies)if(e!==target&&!e.dead&&!e.exit&&distance(e,target)<105){e.hp-=16;carnivalHit(this,e);lakeHit(this,e);caveHit(this,e,16);iceHit(this,e,16);wetlandHit(this,e,16);magmaHit(this,e,16);forestHit(this,e,16);e.flash=.06;this.gainEnergy(1);if(e.hp<=0)this.defeat(e);}}
 triggerUltimate(){if(this.paused||this.phase!=='combat'||this.ultimateEnergy<100)return false;
  this.ultimateEnergy=0;this.phase='ultimate';this.phaseTime=0;this.charging=null;this.stats.bombs++;this.emit('ultimateStart');return true;
 }
 finishUltimate(){this.bullets=[];for(const e of this.enemies){e.hp-=130;if(e.hp<=0)this.defeat(e);}if(this.boss?.age>2)this.boss.hp-=200;
  this.phase='combat';this.phaseTime=0;this.player.invuln=Math.max(this.player.invuln,1);this.last={};this.pending={};this.emit('bomb');}
 findSafeRespawn(){const x=155,candidates=[240,140,340,75,405];return candidates.map(y=>({x,y})).find(p=>this.gates.every(g=>Math.abs(p.x-g.x)>=g.w/2+40||(p.y>=g.gapY-g.gap/2+28&&p.y<=g.gapY+g.gap/2-28)))||null;}
 finishGuardian(){const spot=this.findSafeRespawn();if(!spot)return false;const p=this.player;p.x=spot.x;p.y=spot.y;p.hp=1;p.invuln=1;p.shotCD=.25;
  this.bullets=this.bullets.filter(b=>distance(b,p)>260);this.phase='combat';this.phaseTime=0;this.last={};this.pending={};this.emit('guardianRevive',p.x,p.y);this.message('母上的守護 · 回復 1 HP，短暫無敵！');return true;}

 spawn(kind,x,y,pattern='line',group=0){const d=STAR_ENEMIES[kind],hp=d.hp*(kind===0?1:1+this.dangerTier*.08)*this.tuning.enemyHpScale;const e={id:++this.id,kind,x,y,baseY:y,pattern,group,age:0,fireCD:1.7+this.random(),...d,hp,maxHp:hp,flash:0,exit:false,state:'enter',targetY:y,charge:0};this.enemies.push(e);return e;}
 wave(pattern){const group=++this.id,y=90+this.random()*300,count=base=>Math.max(1,Math.round(base*this.tuning.waveScale));
  if(pattern===0)for(let i=0,n=count(7);i<n;i++)this.spawn(0,1330+i*47,clamp(y+Math.abs(i-(n-1)/2)*20,45,435),'sine',group);
  if(pattern===1){this.spawn(1,1360,170,'float',group);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1370+i*65,340,'line',group);}
  if(pattern===2){this.addTerrain(1500,240,260,true);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1340+i*65,240,'line',group);}
  if(pattern===3){this.spawn(3,1350,100+this.random()*280,'charge',group);for(let i=0,n=count(4);i<n;i++)this.spawn(0,1440+i*50,clamp(y,60,420),'line',group);}
  if(pattern===4){this.spawn(1,1360,clamp(y,100,380),'float',group);for(let i=0,n=count(3);i<n;i++)this.spawn(5,1520+i*100,90+(i%3)*140,'sine',group);}
  if(pattern===5)for(let i=0,n=count(6);i<n;i++)this.spawn(5,1330+i*70,clamp(y,90,390),'sine',group);
  if(pattern===6)for(let i=0,n=count(3);i<n;i++){const e=this.spawn(6,920+i*170,454,'lakeLeap',group);e.charge=.8+i*.34;}
  if(pattern===7)for(let i=0,n=count(6);i<n;i++)this.spawn(7,1330+i*64,i%2?420:60,'sine',group);
  if(pattern===8)for(let i=0,n=count(5);i<n;i++)this.spawn(8,1330+i*72,75+(i%3)*145,'sine',group);
  if(pattern===9)for(let i=0,n=count(5);i<n;i++)this.spawn(9,1330+i*78,390-(i%2)*85,'hop',group);
  if(pattern===10)for(let i=0,n=count(4);i<n;i++)this.spawn(10,1340+i*95,90+(i%3)*130,'float',group);
  if(pattern===11)for(let i=0,n=count(6);i<n;i++)this.spawn(11,1330+i*68,70+(i%4)*105,'sine',group);
 }
 addTerrain(x=1440,gapY=240,gap=250,turret=false){if(this.gates.some(g=>g.x>700))return null;const gate={id:++this.id,x,w:100,gapY,gap,scored:false};this.gates.push(gate);if(turret){const e=this.spawn(2,x-15,gapY-gap/2-19,'turret');e.gateId=gate.id;}return gate;}
 aimed(x,y,speed,offset=0){const a=Math.atan2(this.player.y-y,this.player.x-x)+offset,velocity=speed*this.tuning.enemyBulletScale;this.bullets.push({id:++this.id,x,y,vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,r:3,visualRadius:8,life:12,grazed:false});}
 shoot(){const p=this.player,rank=this.weaponRanks.clover,c=this.craft;
  let angles=c.id==='owl'?[-.25,0,.25]:c.id==='swift'||c.id==='starwing'?[-.045,.045]:[0];
  for(const a of angles)this.craftShot(a,c.id==='ancient'?'explosive':c.id==='falcon'||c.id==='starwing'?'laser':'leaf',c.id==='ancient'?19+rank*3:c.id==='falcon'?8+rank*2:2+rank,c.id==='falcon'?4:1,c.id==='owl'?360:c.id==='falcon'?1500:this.tuning.playerBulletSpeed);
  for(const o of this.optionPositions)this.shots.push({id:++this.id,x:o.x,y:o.y,vx:this.tuning.playerBulletSpeed,vy:0,r:5,damage:2,life:1.7,pierce:1,hit:new Set(),kind:'leaf',rank,option:true});
  p.shotCD=this.tuning.shotCooldown/(c.id==='swift'&&this.cruise>=2?1.15:1);this.emit('shot');
 }
 craftShot(angle,kind,damage,pierce=1,speed=880,target=null){const p=this.player;this.shots.push({id:++this.id,x:p.x+23,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:kind==='explosive'?11:5,damage,life:2.4,pierce,hit:new Set(),kind,rank:this.weaponRanks.clover,targetId:target?.id,target});}

 defeat(e){if(e.dead)return;e.dead=true;this.gainEnergy(e.kind===1?4:1.5);this.stats.cleared++;this.chain++;this.chainLife=3;this.score+=(e.kind===1?250:70)*(1+Math.min(3,Math.floor(this.chain/10)));this.emit(e.kind===1?'elite':'pop',e.x,e.y,{kind:e.kind});
  carnivalDefeat(this,e);
  lakeDefeat(this,e);
  caveDefeat(this,e);
  iceDefeat(this,e);
  wetlandDefeat(this,e);
  magmaDefeat(this,e);
  forestDefeat(this,e);
  transitDefeat(this,e);
  if(e.kind===4)this.addPickup('weapon',e.x,e.y);const count=e.kind===1?5:1;for(let i=0;i<count;i++)this.addPickup('gem',e.x+(i%3)*14,e.y+(i-2)*11);}
 advance(seconds,input={}){if(this.paused||this.status!=='playing')return 0;this.accumulator+=clamp(seconds,0,.1);let steps=0;
  for(const key of ['special','bomb','trait','dash']){if(input[key]&&!this.last[key])this.pending[key]=true;this.last[key]=!!input[key];}
  const edge={dash:false,special:false,bomb:false,trait:false,...this.pending};while(this.accumulator+1e-9>=STAR_FIELD.step){this.stepPhase(STAR_FIELD.step,{...input,...(steps===0?edge:{dash:false,special:false,bomb:false,trait:false})});this.accumulator-=STAR_FIELD.step;this.pending={};steps++;if(this.status!=='playing'||this.paused){this.accumulator=0;break;}}return steps;}
 stepPhase(dt,input){if(this.phase==='ultimate'){this.phaseTime+=dt;if(this.phaseTime>=3)this.finishUltimate();return;}
  if(this.phase==='guardian'){this.phaseTime+=dt;if(this.phaseTime>=STAR_PHASE1.guardianSeconds)this.finishGuardian();return;}
  if(this.phase==='falling'){this.phaseTime+=dt;if(this.phaseTime>=1){if(this.guardianEnabled&&!this.guardianUsed){this.guardianUsed=true;this.phase='guardian';this.phaseTime=0;this.emit('guardianStart');}else{this.status='lost';this.emit('end');}}return;}
  if(input.bomb&&this.triggerUltimate())return;
  this.tick(dt,input);
 }

 enterTransit(index){this.segment=index;this.stage=index;this.travelPhase='transit';this.branchOffer=null;this.gates=[];this.hazards=[];this.emit('transit',640,240,{from:this.route[index].name,to:this.route[index+1].name});this.message('星風亂流 · 航向 '+this.route[index+1].name);}
 enterSegment(index){this.segment=index;this.stage=index;this.travelPhase='region';this.branchOffer=null;this.hazards=[];for(const e of this.enemies)if(e.transit)e.exit=true;this.checkpoint=this.snapshot();this.emit('stage',0,0,{theme:this.currentMap?.theme});this.message('進入 '+this.currentMap.name);}
 timelineEvent(e){
  if(e.type==='carnival')carnivalEvent(this,e);
  if(e.type==='lakeStory')lakeEvent(this,e);
  if(e.type==='caveStory')caveEvent(this,e);
  if(e.type==='iceStory')iceEvent(this,e);
  if(e.type==='wetlandStory')wetlandEvent(this,e);
  if(e.type==='magmaStory')magmaEvent(this,e);
  if(e.type==='forestStory')forestEvent(this,e);
  if(e.type==='transitStory')transitEvent(this,e);
  if(e.type==='region'){this.message('區域 '+(e.index+1)+'／'+STAR_ROUTE_LENGTH+' · '+this.route[e.index].name);if(['sky','lake','cave','ice','wetland','magma','forest'].includes(this.route[e.index].type)){if(this.route[e.index].type==='sky')this.carnivalHitsStart=this.stats.hits;else if(this.route[e.index].type==='lake')this.lakeHitsStart=this.stats.hits;else if(this.route[e.index].type==='cave')this.caveHitsStart=this.stats.hits;else if(this.route[e.index].type==='ice')this.iceHitsStart=this.stats.hits;else if(this.route[e.index].type==='wetland')this.wetlandHitsStart=this.stats.hits;else if(this.route[e.index].type==='magma')this.magmaHitsStart=this.stats.hits;else this.forestHitsStart=this.stats.hits;this.emit('regionIntro',640,70,{name:this.route[e.index].name});}}
  if(e.type==='carnivalClear'){const flawless=this.stats.hits===(this.carnivalHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?900:500;this.addPickup('heart',1260,240);this.message(flawless?'完美巡遊！獲得 900 分與回復愛心':'嘉年華航道完成！獲得 500 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='lakeClear'){const flawless=this.stats.hits===(this.lakeHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1000:600;this.addPickup('heart',1260,240);this.message(flawless?'月鏡無波！獲得 1000 分與回復愛心':'月光湖航道完成！獲得 600 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='caveClear'){const flawless=this.stats.hits===(this.caveHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1100:650;this.addPickup('heart',1260,240);this.message(flawless?'星晶共鳴！獲得 1100 分與回復愛心':'星晶洞穴航道完成！獲得 650 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='iceClear'){const flawless=this.stats.hits===(this.iceHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1200:700;this.addPickup('heart',1260,240);this.message(flawless?'極光無痕！獲得 1200 分與回復愛心':'霜花冰原航道完成！獲得 700 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='wetlandClear'){const flawless=this.stats.hits===(this.wetlandHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1300:750;this.addPickup('heart',1260,240);this.message(flawless?'露珠無痕！獲得 1300 分與回復愛心':'螢光濕地航道完成！獲得 750 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='magmaClear'){const flawless=this.stats.hits===(this.magmaHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1400:800;this.addPickup('heart',1260,240);this.message(flawless?'焦糖無痕！獲得 1400 分與回復愛心':'熔火群島航道完成！獲得 800 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='forestClear'){const flawless=this.stats.hits===(this.forestHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?1500:850;this.addPickup('heart',1260,240);this.message(flawless?'晨光無痕！獲得 1500 分與回復愛心':'古木樹海航道完成！獲得 850 分與回復愛心');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='wave')this.wave(this.gates.length&&[3,4,5,7,8,9,10,11].includes(e.pattern)?0:e.pattern);if(e.type==='terrain')this.addTerrain(1440,240,260,true);
  if(e.type==='squirrel'&&!this.gates.some(g=>g.x>0))this.spawn(3,1340,100+this.random()*280,'charge');
  if(e.type==='carrier'){this.spawn(4,1310,240,'float');this.message('紅帽補給雲來了！擊破可取得普攻強化星星');}
  if(e.type==='option')this.addPickup('option',1300,240);if(e.type==='heart')this.addPickup('gem',1300,240);
  if(e.type==='gust'){this.message('前方風帶 · 順著風勢微調高度');this.emit('environment',0,0,{kind:'gust'});}
  if(e.type==='mist'){this.hazards.push({id:++this.id,kind:'mist',x:1380,y:90+this.random()*300,r:105,age:0,life:13});this.emit('environment',0,0,{kind:'mist'});}
  if(e.type==='lakeJump'){for(let i=0;i<2;i++){const enemy=this.spawn(6,890+i*250,454,'lakeLeap');enemy.charge=.85+i*.42;}this.message('湖面冒出泡泡 · 小心水豚躍起！');}
  if(e.type==='rockfall'){this.hazards.push({id:++this.id,kind:'rock',x:650+this.random()*500,y:-30,r:22,age:0,life:4.2,warn:1,vy:0,hit:false});this.message('洞頂星塵落下 · 留意落石預警！');}
  if(e.type==='icefall'){this.hazards.push({id:++this.id,kind:'icicle',x:560+this.random()*620,y:-35,r:18,age:0,life:4,warn:.9,vy:0,hit:false});this.message('冰晶發出亮光 · 冰柱即將掉落！');}
  if(e.type==='marsh'){this.hazards.push({id:++this.id,kind:'marsh',x:1380,y:100+this.random()*280,r:120,age:0,life:14});this.message('濕地泡泡霧 · 進入會稍微減速');}
  if(e.type==='ember'){this.hazards.push({id:++this.id,kind:'ember',x:720+this.random()*470,y:-35,r:20,age:0,life:4.5,warn:.75,vx:-75-this.random()*70,vy:0,hit:false});this.message('岩漿亮起紅圈 · 火山星石即將噴出！');}
  if(e.type==='canopy'){this.addTerrain(1440,150+this.random()*180,225,false);this.message('古木枝幹交錯 · 尋找發光缺口！');}
  if(e.type==='warning'){const boss=STAR_REGION_BOSSES[this.route[this.route.length-1].type];this.message('前方大型反應！'+boss.name+'甦醒了');this.emit('warning');}
  if(e.type==='boss')this.startBoss();
 }
 startBoss(){if(this.boss)return;this.segment=STAR_ROUTE_LENGTH;this.stage=STAR_ROUTE_LENGTH;this.travelPhase='boss';this.branchOffer=null;this.hazards=[];this.bullets=[];this.warnings=[];for(const e of this.enemies){e.exit=true;this.emit('pop',e.x,e.y);}
  const profile=STAR_REGION_BOSSES[this.route[this.route.length-1].type],hp=profile.hp*this.tuning.enemyHpScale;this.gates=[];this.boss={...profile,x:1460,y:240,r:82,hp,maxHp:hp,age:0,fireCD:2,phase:1,cycle:0,beam:-1,beamY:240,flash:0};this.checkpoint=this.snapshot();this.message(profile.name+'現身！');this.emit('boss',0,0,{name:profile.name,regionType:profile.regionType});}
 tick(dt,input){
  this.guardTime=Math.max(0,this.guardTime-dt);if(!this.guardTime)this.guardFeathers=0;this.breezeCD=Math.max(0,this.breezeCD-dt);const motion=Math.hypot(input.x||0,input.y||0);this.cruise=motion>.25?this.cruise+dt:0;
  if(input.dash&&this.player.dashCD<=0){this.player.dashCD=30;this.player.dashing=3;this.emit('dash');}
  this.time+=dt;const p=this.player;this.noticeLife=Math.max(0,this.noticeLife-dt);this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;
  for(const k of ['invuln','dashCD','dashing','shotCD','traitCD'])p[k]=Math.max(0,p[k]-dt);
  const travel=resolveStarPhase(this.time);if(travel.kind==='region'&&(travel.index!==this.segment||this.travelPhase!=='region'))this.enterSegment(travel.index);else if(travel.kind==='transit'&&this.travelPhase!=='transit')this.enterTransit(travel.index);
  this.energyBudget=Math.max(0,this.energyBudget-1.5*dt);
  for(const k of Object.keys(this.specialCooldowns))this.specialCooldowns[k]=Math.max(0,this.specialCooldowns[k]-dt);
  if(this.laserVisual){this.laserVisual.life-=dt;if(this.laserVisual.life<=0)this.laserVisual=null;}
  if(this.charging){this.charging.elapsed+=dt;if(this.charging.elapsed+1e-9>=STAR_PHASE1.chargeSeconds){const id=this.charging.id;this.charging=null;this.fireSpecial(id);}}
  if(input.special)this.triggerSpecial();
  if(input.trait)this.triggerTrait();
  this.environmentSlow=1;this.carnivalWind=0;this.lakePull=0;this.caveDarkness=0;this.iceDrift=0;this.wetlandDrift=0;this.magmaPull=0;this.forestDrift=0;this.transitDrift=0;for(const h of this.hazards){h.age+=dt;h.life-=dt;carnivalHazard(this,h,dt);lakeHazard(this,h,dt);caveHazard(this,h,dt);iceHazard(this,h,dt);wetlandHazard(this,h,dt);magmaHazard(this,h,dt);forestHazard(this,h,dt);transitHazard(this,h,dt);if(h.kind==='mist'||h.kind==='marsh'){h.x-=(h.kind==='mist'?62:48)*dt;if(Math.hypot((h.x-p.x)*.72,h.y-p.y)<h.r)this.environmentSlow=Math.min(this.environmentSlow,h.kind==='mist'?.72:.82);}
   if((h.kind==='rock'||h.kind==='icicle')&&h.age>=h.warn){h.vy=Math.min(h.kind==='icicle'?430:360,h.vy+(h.kind==='icicle'?680:540)*dt);h.y+=h.vy*dt;if(!h.hit&&distance(h,p)<h.r+this.hitRadius+5){h.hit=true;this.hit();}}
   if(h.kind==='ember'&&h.age>=h.warn){h.vy=Math.min(390,h.vy+620*dt);h.x+=h.vx*dt;h.y+=h.vy*dt;if(!h.hit&&distance(h,p)<h.r+this.hitRadius+6){h.hit=true;this.hit();}}}
  this.hazards=this.hazards.filter(h=>h.life>0&&h.x>-160&&h.y<530);
  let ix=input.x||0,iy=input.y||0;if(this.craft.id==='ancient'){const q=1-Math.exp(-dt*5);this.velocity.x+=(ix-this.velocity.x)*q;this.velocity.y+=(iy-this.velocity.y)*q;ix=this.velocity.x;iy=this.velocity.y;}const x=ix,y=iy,n=Math.max(1,Math.hypot(x,y)),speed=this.tuning.playerSpeed*this.environmentSlow*(input.slow?.55:1)*(p.dashing>0?1.5:1);
  const drift=(this.currentMap?.hazard==='gust'&&!this.gates.length?Math.sin(this.time*1.4)*18:0)+(this.carnivalWind||0)+(this.lakePull||0)+(this.iceDrift||0)+(this.wetlandDrift||0)+(this.forestDrift||0)+(this.transitDrift||0);
  p.x=clamp(p.x+x/n*speed*dt,30,1225);p.y=clamp(p.y+(y/n*speed+drift)*dt,22,458);
  this.optionTrail.push({x:p.x,y:p.y});if(this.optionTrail.length>85)this.optionTrail.shift();
  this.optionPositions=Array.from({length:this.options},(_,i)=>{const a=this.optionTrail[Math.max(0,this.optionTrail.length-1-25*(i+1))]||p;return {x:a.x-45*(i+1),y:a.y};});
  if(p.shotCD<=0)this.shoot();
  while(this.eventIndex<this.timeline.length&&this.time>=this.timeline[this.eventIndex].at)this.timelineEvent(this.timeline[this.eventIndex++]);
  if(this.boss)this.stepBoss(dt);
  for(const gate of this.gates){gate.x-=STAR_FIELD.scrollSpeed*dt;
   const overlap=Math.abs(p.x-gate.x)<gate.w/2+this.hitRadius,outside=p.y<gate.gapY-gate.gap/2+this.hitRadius||p.y>gate.gapY+gate.gap/2-this.hitRadius;
   if(overlap&&outside){this.hit();p.y=clamp(p.y,gate.gapY-gate.gap/2+8,gate.gapY+gate.gap/2-8);}
   if(!gate.scored&&gate.x<p.x-70){gate.scored=true;this.score+=150;this.emit('gate');}}
  this.gates=this.gates.filter(g=>g.x>-120);
  for(const e of this.enemies){if(e.dead||e.exit)continue;e.age+=dt;e.flash=Math.max(0,e.flash-dt);
   if(carnivalEnemy(this,e,dt)||lakeEnemy(this,e,dt)||caveEnemy(this,e,dt)||iceEnemy(this,e,dt)||wetlandEnemy(this,e,dt)||magmaEnemy(this,e,dt)||forestEnemy(this,e,dt)||transitEnemy(this,e,dt))continue;
   if(e.kind===2){const gate=this.gates.find(g=>g.id===e.gateId);if(!gate){e.exit=true;continue;}e.x=gate.x-15;}
   else if(e.kind===6&&e.pattern==='lakeLeap'){if(e.state==='enter'){e.charge-=dt;if(e.charge<=0){e.state='leap';e.age=0;}}else{e.x-=125*this.tuning.enemySpeedScale*dt;e.y=454-Math.sin(Math.min(1,e.age/2.2)*Math.PI)*300;if(e.age>2.2)e.exit=true;}}
   else if(e.kind===3){if(e.state==='enter'){e.x-=210*this.tuning.enemySpeedScale*dt;if(e.x<=1050){e.state='aim';e.charge=1;e.targetY=p.y;}}
    else if(e.state==='aim'){e.charge-=dt;e.y+=(e.targetY-e.y)*Math.min(1,dt*8);if(e.charge<=0){e.state='dash';e.y=e.targetY;}}
    else e.x-=650*this.tuning.enemySpeedScale*dt;}
   else{e.x-=e.speed*this.tuning.enemySpeedScale*dt;if(e.pattern==='sine')e.y=clamp(e.baseY+Math.sin(e.age*(e.kind===5?3:2))*(e.kind===5?55:22),30,450);if(e.pattern==='float')e.y=e.baseY+Math.sin(e.age*2)*15;if(e.pattern==='hop')e.y=clamp(e.baseY-Math.abs(Math.sin(e.age*2.6))*95,40,450);}
   if(e.x<-100)e.exit=true;e.fireCD-=dt;
   if(e.x>340&&e.x<1200&&e.fireCD<=0){if(e.kind===2)for(const off of [-.26,0,.26])this.aimed(e.x-18,e.y,this.difficulty==='challenge'?205:155,off);if(e.kind===1)this.aimed(e.x-30,e.y,135);if(e.kind===10)for(const off of [-.16,.16])this.aimed(e.x-18,e.y,145,off);e.fireCD=e.kind===2?2.1:e.kind===10?2.5:3;}
   if(!(e.kind===6&&e.state==='enter')&&distance(e,p)<e.r+this.hitRadius)this.hit();
  }
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;if(shot.targetId){const target=this.enemies.find(e=>e.id===shot.targetId&&!e.dead);if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),v=Math.hypot(shot.vx,shot.vy);shot.vx=Math.cos(a)*v;shot.vy=Math.sin(a)*v;}}
   if(shot.kind==='homing'){if(!shot.target||shot.target.dead||shot.target.exit||shot.target.hp<=0)shot.target=this.enemies.filter(e=>!e.dead&&!e.exit&&e.x>shot.x-40).sort((a,b)=>distance(a,shot)-distance(b,shot))[0]||(this.boss?.age>2?this.boss:null);
    const target=shot.target;if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),velocity=this.tuning.playerBulletSpeed*.693;shot.vx+=(Math.cos(a)*velocity-shot.vx)*dt*5;shot.vy+=(Math.sin(a)*velocity-shot.vy)*dt*5;}}
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   for(const gate of this.gates)if(shot.x>gate.x-gate.w/2&&ox<gate.x+gate.w/2&&(shot.y<gate.gapY-gate.gap/2||shot.y>gate.gapY+gate.gap/2))shot.life=0;
   if(shot.life<=0)continue;
   for(const e of this.enemies)if(!e.dead&&!e.exit&&!shot.hit.has(e.id)&&starSweep(ox,oy,shot.x,shot.y,e.x,e.y,e.r+shot.r)){
    e.hp-=shot.damage;carnivalHit(this,e,shot);lakeHit(this,e,shot);caveHit(this,e,shot.damage);iceHit(this,e,shot.damage);wetlandHit(this,e,shot.damage);magmaHit(this,e,shot.damage);forestHit(this,e,shot.damage);this.gainEnergy(shot.option?.15:.6);e.flash=.035;shot.hit.add(e.id);shot.pierce--;if(e.hp<=0)this.defeat(e);
    if(shot.kind==='explosive')this.explode(shot,e);
    if(shot.kind==='homing'&&shot.rank===3){this.emit('burst',e.x,e.y);for(const other of this.enemies)if(other!==e&&!other.dead&&distance(e,other)<65){other.hp-=shot.damage*.45;if(other.hp<=0)this.defeat(other);}}
    if(shot.pierce<=0){shot.life=0;break;}}
   const b=this.boss;if(shot.life>0&&b&&b.age>2&&!shot.hit.has('boss')&&starSweep(ox,oy,shot.x,shot.y,b.x,b.y,b.r+shot.r)){b.hp-=shot.damage;this.gainEnergy(shot.option?.15:.6);if(shot.kind==='explosive')this.explode(shot,b);b.flash=.035;shot.hit.add('boss');shot.life=0;this.emit('spark',shot.x,shot.y);}
  }
  for(const b of this.bullets){if(this.guardFeathers>0&&distance(b,p)<65){b.life=0;this.guardFeathers--;this.emit('graze');continue;}const ox=b.x,oy=b.y;if(b.gravity)b.vy+=b.gravity*dt;if(b.forestDelay>0){b.forestDelay-=dt;if(b.forestDelay<=0&&!b.boosted){b.vx*=4.5;b.vy*=4.5;b.boosted=true;this.emit('forestTick',b.x,b.y);}}b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.bounceY&&(b.y<18||b.y>462)){b.y=clamp(b.y,18,462);b.vy*=-1;}b.life-=dt;
   if(starSweep(ox,oy,b.x,b.y,p.x,p.y,b.r+this.hitRadius)){this.hit();b.life=0;}
   else if(!b.grazed&&p.invuln<=0&&starSweep(ox,oy,b.x,b.y,p.x,p.y,b.r+20)){b.grazed=true;this.stats.graze++;this.score+=20;this.emit('graze');}
   for(const gate of this.gates)if(Math.abs(b.x-gate.x)<gate.w/2&&(b.y<gate.gapY-gate.gap/2||b.y>gate.gapY+gate.gap/2))b.life=0;
  }
  for(const item of this.pickups){
   // Close approach locks the visible colour for 0.35 s once per item.
   if(item.kind==='weapon'&&!item.locked&&distance(item,p)<65)item.locked={id:starColor(item).id,until:item.age+.35};
   const captured=item.locked&&item.age<item.locked.until?item.locked.id:starColor(item).id;
   item.age+=dt;item.life-=dt;item.x-=(item.kind==='weapon'?84:105)*dt;
   if(item.kind!=='weapon'&&distance(item,p)<65){item.x+=(p.x-item.x)*dt*6;item.y+=(p.y-item.y)*dt*6;}
   if(this.status==='playing'&&this.phase==='combat'&&distance(item,p)<item.r+12){item.life=0;
    if(item.kind==='weapon')this.collectWeapon(captured);
    else if(item.kind==='option'){this.options=Math.min(2,this.options+1);this.stats.rescued++;this.score+=300;this.emit('rescue');this.message('妹妹精靈加入！同步輔助射擊');}
    else if(item.kind==='heart'){const healed=p.hp<p.maxHp;if(healed)p.hp++;this.score+=100;this.emit('energy',item.x,item.y);this.message(healed?'接住回復愛心 · 生命＋1':'生命已滿 · 愛心轉為 100 分');}
    else{this.score+=100;this.emit('energy',item.x,item.y);}}
  }
  this.enemies=this.enemies.filter(e=>!e.dead&&!e.exit);this.shots=this.shots.filter(s=>s.life>0&&s.x<1450&&s.x>-80&&s.y>-70&&s.y<550);
  this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-70&&b.x<1350&&b.y>-70&&b.y<550);this.pickups=this.pickups.filter(i=>i.life>0&&i.x>-70);
  if(this.boss?.hp<=0&&this.status==='playing'&&this.phase==='combat'){this.status='won';this.score+=5000+p.hp*250;this.emit('end');}
 }
 stepBoss(dt){const b=this.boss;b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.x=Math.max(1070,b.x-125*this.tuning.enemySpeedScale*dt);b.y=240+Math.sin(b.age*.65*this.tuning.enemySpeedScale)*100;
  b.phase=b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.67?2:1;if(b.age<3)return;
  b.fireCD-=dt;if(b.fireCD<=0){b.cycle++;const speed=this.difficulty==='challenge'?215:170;for(let i=-b.phase;i<=b.phase;i++)this.aimed(b.x-80,b.y,speed,i*.19);
   b.fireCD=b.phase===3?1.2:1.8;if(b.phase>=2&&b.cycle%5===0){b.beam=2.5;b.beamY=this.player.y;this.message(b.name+'蓄力：離開發光帶！');}
   if(b.cycle%4===0){
    if(b.attack==='rockfall')this.hazards.push({id:++this.id,kind:'rock',x:520+this.random()*620,y:-30,r:24,age:0,life:4.2,warn:1,vy:0,hit:false});
    if(b.attack==='icefall')this.hazards.push({id:++this.id,kind:'icicle',x:520+this.random()*620,y:-35,r:20,age:0,life:4,warn:.9,vy:0,hit:false});
    if(b.attack==='ember')this.hazards.push({id:++this.id,kind:'ember',x:620+this.random()*500,y:-35,r:22,age:0,life:4.5,warn:.75,vx:-90-this.random()*60,vy:0,hit:false});
    if(b.attack==='mist')this.hazards.push({id:++this.id,kind:'mist',x:1380,y:100+this.random()*280,r:95,age:0,life:10});
    if(b.attack==='marsh')this.hazards.push({id:++this.id,kind:'marsh',x:1380,y:100+this.random()*280,r:105,age:0,life:11});
    if(b.attack==='canopy')this.addTerrain(1440,150+this.random()*180,250,false);
    if(b.attack==='candy')for(let i=0;i<6;i++){const a=Math.PI+(i-2.5)*.22,velocity=115*this.tuning.enemyBulletScale;this.bullets.push({id:++this.id,x:b.x-70,y:b.y,vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,r:4,visualRadius:8,life:9,grazed:false,candy:true});}
   }}
  if(b.beam>-1){b.beam-=dt;if(b.beam<.6&&b.beam>0&&Math.abs(this.player.y-b.beamY)<26&&this.player.x<b.x)this.hit();}
  if(distance(b,this.player)<b.r+this.hitRadius)this.hit();
  if(this.time>=this.nextBossGift){this.addPickup('weapon',900,240);this.addPickup('gem',840,110+this.random()*260);this.nextBossGift+=18;}
 }
}
