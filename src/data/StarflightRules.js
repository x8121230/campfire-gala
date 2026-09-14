import {stepIceYarn} from './StarflightIce.js?v=star0126';
import {getStarCraft} from './StarflightCrafts.js?v=star0126';
import {CARNIVAL_ENEMIES,carnivalTimeline,carnivalEvent,carnivalEnemy,carnivalHazard,carnivalDefeat,carnivalHit} from './StarflightCarnival.js?v=star0126';
import {LAKE_ENEMIES,lakeTimeline,lakeEvent,lakeEnemy,lakeHazard,lakeDefeat,lakeHit} from './StarflightLake.js?v=star0126';
import {CAVE_ENEMIES,caveTimeline,caveEvent,caveEnemy,caveHazard,caveDefeat,caveHit,stepCaveWorld} from './StarflightCave.js?v=star0126';
import {ICE_ENEMIES,iceTimeline,iceEvent,iceEnemy,iceHazard,iceDefeat,iceHit} from './StarflightIce.js?v=star0126';
import {WETLAND_ENEMIES,wetlandTimeline,wetlandEvent,wetlandEnemy,wetlandHazard,wetlandDefeat,wetlandHit} from './StarflightWetland.js?v=star0126';
import {MAGMA_ENEMIES,magmaTimeline,magmaEvent,magmaEnemy,magmaHazard,magmaDefeat,magmaHit,spawnMagmaMeteor,stepMagmaBomb} from './StarflightMagma.js?v=star0126';
import {FOREST_ENEMIES,forestTimeline,forestEvent,forestEnemy,forestHazard,forestDefeat,forestHit} from './StarflightForest.js?v=star0126';
import {TRANSIT_ENEMIES,transitTimeline,transitEvent,transitEnemy,transitHazard,transitDefeat} from './StarflightTransit.js?v=star0126';
// Horizontal flight simulation. World units match the 1280 × 480 playfield.
export const STAR_REGION_SECONDS=48;
export const starRegionDuration=index=>index===0?60:48;
export const STAR_TRANSIT_SECONDS=10;
export const STAR_SEGMENT_SECONDS=STAR_REGION_SECONDS+STAR_TRANSIT_SECONDS;
export const STAR_ROUTE_LENGTH=3;
export const starRegionStart=index=>index===0?0:70+(index-1)*STAR_SEGMENT_SECONDS;
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
export const STAR_PHASE1={version:'0.10.26',craftId:'swift-vanguard',craftName:'巡天雨燕',normalShotCooldown:.5,chargeSeconds:2,playerSpeed:245,visualScale:1.05,launchSeconds:3,guardianSeconds:3};
export const STAR_TUNING=[
 {id:'playerSpeed',name:'玩家移動速度',default:245,min:120,max:450,step:12.5,digits:1,unit:''},
 {id:'shotCooldown',name:'普攻發射間隔',default:.5,min:.2,max:1.2,step:.1,digits:1,unit:'秒'},
 {id:'playerBulletSpeed',name:'玩家子彈速度',default:880,min:500,max:1300,step:100,digits:0,unit:''},
 {id:'enemySpeedScale',name:'敵人移動速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyBulletScale',name:'敵方子彈速度',default:1,min:.5,max:1.8,step:.1,digits:1,unit:'×'},
 {id:'enemyHpScale',name:'敵人生命倍率',default:1,min:.5,max:2.5,step:.25,digits:2,unit:'×'},
 {id:'waveScale',name:'每波敵人數量',default:1,min:.5,max:2,step:.25,digits:2,unit:'×'}
];
export const STAR_CONTROLS={dash:{x:1060,y:617,r:42},joystick:{x:100,y:610,r:57},special:{x:1060,y:510,r:42},bomb:{x:1180,y:463,r:42},trait:{x:1180,y:607,r:56}};

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
 for(let index=0;index<STAR_ROUTE_LENGTH;index++){const start=starRegionStart(index),end=start+starRegionDuration(index);
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
export const STAR_BELL_COLORS=[{id:'upgrade',color:0x73cfff},{id:'shield',color:0x82e6a4},{id:'special',color:0xc49cff},{id:'power',color:0xff8c7d}];
export function starColor(item){const index=(item.colorIndex||0)%4;return {...STAR_BELL_COLORS[index],index};}
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
 route.slice(0,-1).forEach((m,index)=>events.push(...transitTimeline(index,starRegionStart(index)+starRegionDuration(index),seed)));
 events.push({at:STAR_FIELD.bossAt-3,type:'warning',index:STAR_ROUTE_LENGTH},{at:STAR_FIELD.bossAt,type:'boss',index:STAR_ROUTE_LENGTH});
 for(const e of events)if(e.index===0){
  if(e.type.endsWith('Clear'))e.at=58;
  else if(['carnival','lakeStory','caveStory','iceStory','wetlandStory','magmaStory','forestStory'].includes(e.type))e.at=30+(e.at-3)*.58;
 }
 for(const e of events)if(e.type==='caveStory'&&e.beat==='tunnel')e.at=starRegionStart(e.index)+starRegionDuration(e.index)-14;
 for(const at of [2,7,12,17,22,27])events.push({at,type:'warmup',index:0});
 for(const at of [18,27])events.push({at,type:'carrier',index:0});
 events.push({at:54,type:'storybookSurprise',index:0});
 return events.sort((a,b)=>a.at-b.at);
}
export class StarflightTouch{
 constructor(){this.reset();}
 reset(){this.ultimateReady=false;this.owner=null;this.origin={...STAR_CONTROLS.joystick};this.axis={x:0,y:0};this.firing=new Set();this.requests={};this.presses=new Map();this.lastTap=-Infinity;this.traitHold=null;this.bayPointerId=null;}
 down(p){const {x,y,id}=p;for(const key of ['trait','dash','special','bomb']){const c=STAR_CONTROLS[key];if(Math.hypot(x-c.x,y-c.y)<=c.r){if(key==='trait'){this.firing.add(id);this.presses.set(id,performance.now());}else if(key==='dash')this.requests.dash=true;else if(key==='bomb'&&this.ultimateReady)this.requests.bomb=true;return;}}
  if(this.owner===null&&x<450&&y>110){this.owner=id;this.origin={x:clamp(x,62,390),y:clamp(y,140,645)};this.move(p);}}
 move(p){if(this.firing.has(p.id)){const c=STAR_CONTROLS.trait;if(Math.hypot(p.x-c.x,p.y-c.y)>c.r+20){this.firing.delete(p.id);this.presses.delete(p.id);this.lastTap=-Infinity;}}if(p.id!==this.owner)return;const x=p.x-this.origin.x,y=p.y-this.origin.y,n=Math.max(57,Math.hypot(x,y));this.axis=Math.hypot(x,y)<7?{x:0,y:0}:{x:x/n,y:y/n};}
 up(p){this.firing.delete(p.id);this.presses.delete(p.id);if(p.id===this.owner){this.owner=null;this.axis={x:0,y:0};}}

 read(){return {...this.axis,fire:this.firing.size>0,...this.requests};}
 consume(){this.requests={};}
}
export class StarflightSession{
 constructor({difficulty='normal',seed=98731,checkpoint=null,guardianEnabled=false,craftId='swift',skyScenario=-1}={}){
  this.difficulty=difficulty;this.seed=checkpoint?.seed??seed;this.rng=checkpoint?.rng??this.seed;this.time=checkpoint?.time||0;
  this.route=checkpoint?.route?.map(m=>({...m}))||buildStarRoute(this.seed);const initialPhase=resolveStarPhase(this.time);this.segment=initialPhase.kind==='boss'?STAR_ROUTE_LENGTH:initialPhase.index;this.stage=this.segment;this.travelPhase=initialPhase.kind;
  if(!checkpoint){const candy=this.route.find(m=>m.type==='sky');if(candy)candy.carnivalScenario=skyScenario;}
  this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>=this.time);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.status='playing';this.paused=false;this.accumulator=0;this.id=0;this.craft=getStarCraft(checkpoint?.craftId||craftId);this.hurtbox=this.craft.hurtbox;this.hitRadius=this.hurtbox.ry;const hp=this.craft.hp;this.velocity={x:0,y:0};this.guardFeathers=0;this.owlOrbitCD=0;this.guardTime=0;this.cruise=0;this.breezeCD=0;
  this.tuning=Object.fromEntries(STAR_TUNING.map(item=>[item.id,checkpoint?.tuning?.[item.id]??item.default]));this.gmUsed=checkpoint?.gmUsed??false;if(!checkpoint?.tuning){this.tuning.playerSpeed=this.craft.speed;this.tuning.shotCooldown=this.craft.cd;}
  this.player={x:210,y:240,hp,maxHp:hp,invuln:2,dashCD:0,dashing:0,shotCD:0,traitCD:0,shield:0,powerBoost:0};
  this.weapon='clover';
  this.specialWeapon=checkpoint?.specialWeapon||'chargeLaser';this.specialCooldowns={chargeLaser:0,explosive:0,shotgun:0,...checkpoint?.specialCooldowns};
  this.charging=null;this.ultimateEnergy=checkpoint?.ultimateEnergy||0;this.energyBudget=0;this.phase='combat';this.phaseTime=0;this.laserVisual=null;this.bayOpen=false;this.suitActive=null;
  this.guardianEnabled=false;this.guardianUsed=false;
  this.bellLevels={upgrade:0,shield:0,special:0,power:0,...checkpoint?.bellLevels};this.gravityFields=[];this.ancientWaves=[];this.siegeTime=0;this.bellVolley=0;this.starLocks=[];this.starSalvoCD=0;this.starStacks=0;this.starOverclock=0;this.weaponRanks={clover:1,laser:1,homing:1,...checkpoint?.weaponRanks};this.options=checkpoint?.options||0;this.optionTrail=[];this.optionPositions=[];
  this.bombs=0;this.score=checkpoint?.score||0;this.chain=0;this.chainLife=0;
  this.stats={cleared:0,rescued:0,hits:0,bombs:0,weaponChoices:0,upgrades:0,graze:0,branches:0,gmChanges:0,...checkpoint?.stats};
  this.events=[];this.enemies=[];this.shots=[];this.bullets=[];this.pickups=[];this.gates=[];this.hazards=[];this.warnings=[];this.branchOffer=null;this.environmentSlow=1;this.boss=null;this.last={};this.pending={};
  this.notice='按住攻擊 · 能量滿後按大招 · U 加速';this.noticeLife=4;this.nextBossGift=STAR_FIELD.bossAt+12;this.checkpoint=this.snapshot();
 }
 get currentMap(){return this.segment<STAR_ROUTE_LENGTH?this.route[this.segment]:this.boss?this.route[STAR_ROUTE_LENGTH-1]:null;}
 get inTransit(){return this.travelPhase==='transit';}
 get phaseInfo(){return resolveStarPhase(this.time);}
 get dangerTier(){return Math.min(3,this.segment);}
 snapshot(){const time=this.boss?STAR_FIELD.bossAt:starRegionStart(Math.min(this.segment,STAR_ROUTE_LENGTH-1));return {bellLevels:{...this.bellLevels},craftId:this.craft.id,specialWeapon:this.specialWeapon,specialCooldowns:{...this.specialCooldowns},ultimateEnergy:this.ultimateEnergy,guardianEnabled:this.guardianEnabled,guardianUsed:this.guardianUsed,seed:this.seed,rng:this.rng,time,route:this.route.map(m=>({...m})),weapon:this.weapon,weaponRanks:{...this.weaponRanks},options:this.options,score:this.score,stats:{...this.stats},bombs:this.bombs,tuning:{...this.tuning},gmUsed:this.gmUsed};}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});if(this.events.length>150)this.events.shift();}
 message(t){this.notice=t;this.noticeLife=3;}
 setPaused(v){this.paused=!!v;}
 setTuning(id,value){const rule=STAR_TUNING.find(item=>item.id===id);if(!rule||!Number.isFinite(value))return false;const old=this.tuning[id],next=Math.round(clamp(value,rule.min,rule.max)*1000)/1000;if(next===old)return false;
  this.tuning[id]=next;this.gmUsed=true;this.stats.gmChanges++;
  if(id==='playerBulletSpeed'&&old>0)for(const shot of this.shots){shot.vx*=next/old;shot.vy*=next/old;if(shot.owlFeather)shot.maxTravel=this.owlShotRange(Math.hypot(shot.vx,shot.vy));}
  if(id==='enemyBulletScale'&&old>0)for(const bullet of this.bullets){bullet.vx*=next/old;bullet.vy*=next/old;}
  if(id==='enemyHpScale'&&old>0){for(const enemy of this.enemies){enemy.hp*=next/old;enemy.maxHp*=next/old;}if(this.boss){this.boss.hp*=next/old;this.boss.maxHp*=next/old;}}
  this.message('GM 調校：'+rule.name+' → '+next.toFixed(rule.digits)+rule.unit);return true;
 }
 resetTuning(){for(const item of STAR_TUNING)this.setTuning(item.id,item.id==='playerSpeed'?this.craft.speed:item.id==='shotCooldown'?this.craft.cd:item.default);this.gmUsed=false;this.message('GM 調校已恢復正式預設值');return true;}
 forceRegion(type){if(this.segment>=STAR_ROUTE_LENGTH||!STAR_REGION_TYPES.includes(type))return false;const pool=regionVariants(type),region=pool[Math.floor(this.random()*pool.length)];if(!region)return false;
  this.route[this.segment]={...region,index:this.segment,waveCount:4};this.enemies=[];this.bullets=[];this.hazards=[];this.gates=[];this.branchOffer=null;this.timeline=buildStarTimeline(this.route,this.seed);this.eventIndex=this.timeline.findIndex(e=>e.at>this.time+1e-7);if(this.eventIndex<0)this.eventIndex=this.timeline.length;
  this.gmUsed=true;this.stats.gmChanges++;this.emit('stage',0,0,{theme:region.theme});this.message('GM 地圖切換：'+region.name);return true;
 }
 bodySweep(ax,ay,bx,by,r=0){const h=this.hurtbox,p=this.player;return starSweep((ax-p.x)/(h.rx+r),(ay-p.y)/(h.ry+r),(bx-p.x)/(h.rx+r),(by-p.y)/(h.ry+r),0,0,1);}
 bodyCircle(x,y,r=0){return this.bodySweep(x,y,x,y,r);}
 bodyRing(x,y,r,w=12){const h=this.hurtbox,p=this.player,d=Math.hypot(p.x-x,p.y-y),a=Math.atan2(p.y-y,p.x-x),support=Math.hypot(h.rx*Math.cos(a),h.ry*Math.sin(a));return Math.abs(d-r)<=w+support;}
 hit(){const p=this.player;if(p.invuln>0||this.phase!=='combat'||this.status!=='playing')return false;p.invuln=1.7;this.chain=0;this.stats.hits++;this.cruise=0;if(this.craft.id==='swift'&&p.shield>0){const radius=90+this.bellLevels.shield*30;this.bullets=this.bullets.filter(b=>distance(b,p)>radius);this.emit('shieldBreak',p.x,p.y,{radius});}if(p.shield>0){p.shield--;if(this.craft.id==='ancient')this.emit('ancientArmor',p.x,p.y,{layers:p.shield});}else p.hp--;this.emit('hurt');if(p.hp<=0){this.phase='falling';this.phaseTime=0;this.charging=null;this.emit('fall');}return true;}
 addPickup(kind,x,y){if(kind==='heart')kind='gem';const item={id:++this.id,kind,x,y,age:0,r:kind==='weapon'?23:kind==='option'?20:12,life:18,locked:null,colorIndex:0,flash:0,hits:0,kick:0,baseY:y,colorLock:0};this.pickups.push(item);return item;}
 cycleStarbud(item){if(item.life<=0)return false;item.kick=430;item.flash=.16;if(item.colorLock>0){this.emit('bellHit',item.x,item.y,{color:starColor(item).color});return false;}item.hits=(item.hits||0)+1;
  if(item.hits<3){this.emit('bellHit',item.x,item.y,{hits:item.hits,color:starColor(item).color});return false;}
  item.hits=0;item.colorLock=.5;item.colorIndex=((item.colorIndex||0)+1)%4;item.kick=430;item.flash=.38;this.emit('bellChange',item.x,item.y,{color:starColor(item).color});return true;
 }
 attackMultiplier(){return 1+.25*(Math.max(1,Math.min(3,this.weaponRanks.clover))-1);}
 collectCrystal(){const upgraded=this.weaponRanks.clover<3;if(upgraded){this.weaponRanks.clover++;this.stats.upgrades++;}this.score+=1;this.emit('crystalCollect',this.player.x,this.player.y);this.message(upgraded?'全攻擊提升！ Lv.'+this.weaponRanks.clover+' · +'+Math.round((this.attackMultiplier()-1)*100)+'%':'全攻擊已滿級 +50% · 分數 +1');}

 collectWeapon(reward='upgrade'){
  const c=this.craft,p=this.player;if(!Object.hasOwn(this.bellLevels,reward))return false;
  const cap=c.id==='swift'&&reward==='upgrade'?4:3;if(this.bellLevels[reward]>=cap&&['upgrade','special'].includes(reward))this.gainEnergy(3);this.bellLevels[reward]=reward==='power'?1:Math.min(cap,this.bellLevels[reward]+1);const lv=this.bellLevels[reward];
  if(reward==='shield'){if(c.id==='owl'){this.guardFeathers=2+lv;this.guardTime=0;}else if(c.id==='starwing')this.options=Math.min(2,lv);else if(c.id==='falcon')p.dashCD=Math.max(0,p.dashCD-10);else p.shield=Math.min(c.id==='ancient'?2:1,lv);}
  if(reward==='power')p.powerBoost=10;
  this.score+=2;this.stats.weaponChoices++;this.message(c.bells[['upgrade','shield','special','power'].indexOf(reward)]+(reward==='power'?' · 10 秒':' Lv.'+lv));this.emit('weaponChosen',p.x,p.y,{reward});return true;
 }
 openBay(){return false;}
 equipSpecial(id){if(!this.bayOpen||!STAR_SPECIALS.some(w=>w.id===id))return false;
  if(id!==this.specialWeapon){this.charging=null;this.specialWeapon=id;}return true;
 }
 closeBay(){if(!this.bayOpen)return false;this.bayOpen=false;this.last={};this.pending={};return true;}
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
   for(const item of this.pickups)if(item.kind==='weapon'&&item.life>0&&item.x>=p.x+28&&item.x<end&&Math.abs(item.y-p.y)<item.r+13)this.cycleStarbud(item);
   for(const e of this.enemies)if(!e.dead&&!e.exit&&e.x>=p.x+28&&e.x-e.r<end&&Math.abs(e.y-p.y)<=e.r+13){e.hp-=45*this.attackMultiplier();carnivalHit(this,e);lakeHit(this,e);caveHit(this,e,45*this.attackMultiplier());iceHit(this,e,45*this.attackMultiplier());wetlandHit(this,e,45*this.attackMultiplier());magmaHit(this,e,45*this.attackMultiplier());forestHit(this,e,45*this.attackMultiplier());e.flash=.08;this.gainEnergy(2);if(e.hp<=0)this.defeat(e);}
   const b=this.boss;if(b&&b.age>2&&b.x-b.r<end&&b.x>p.x&&Math.abs(b.y-p.y)<=b.r+13){b.hp-=65*this.attackMultiplier();b.flash=.08;this.gainEnergy(3);}
   this.emit('laserFire');
  }else{
   const angles=id==='shotgun'?[-.45,-.30,-.15,0,.15,.30,.45]:[0];
   for(const a of angles){const velocity=this.tuning.playerBulletSpeed*.864;this.shots.push({id:++this.id,x:p.x+28,y:p.y,vx:velocity*Math.cos(a),vy:velocity*Math.sin(a),r:id==='explosive'?10:8,damage:(id==='explosive'?22:7)*this.attackMultiplier(),life:1.6,pierce:1,hit:new Set(),kind:id==='explosive'?'explosive':'leaf',rank:2,special:true});}
   this.emit(id==='explosive'?'explosiveFire':'shotgunFire');
  }
 }
 triggerTrait(){const p=this.player;if(this.phase!=='combat'||this.paused||p.traitCD>0)return false;
  this.stats.traits=(this.stats.traits||0)+1;p.traitCD=4;
  if(this.craft.id==='swift'){for(const a of [-.3,-.15,0,.15,.3])this.craftShot(a,'leaf',12,2);}
  if(this.craft.id==='falcon'){p.dashing=.28;p.invuln=Math.max(p.invuln,.3);this.craftShot(0,'laser',45,12,1550);}
  if(this.craft.id==='owl'){return false;}
  if(this.craft.id==='ancient'){p.shield=1;this.guardTime=2;this.craftShot(0,'explosive',55,3,620);p.traitCD=6;}
  if(this.craft.id==='starwing'){const targets=this.enemies.filter(e=>!e.dead&&e.x>p.x).sort((a,b)=>distance(a,p)-distance(b,p)).slice(0,4);if(!targets.length)this.craftShot(0,'laser',35,4);else targets.forEach((e,i)=>this.craftShot((i-1.5)*.25,'homing',26,1,740,e));p.traitCD=5;this.emit('lock',p.x,p.y,{targets:targets.map(e=>({x:e.x,y:e.y}))});}
  this.emit('traitFire');return true;
 }

 explode(shot,target){if(shot.ancientShell){const radius=shot.blastRadius;this.ancientArea(target.x,target.y,radius,shot.damage*.45,target);this.ancientWaves.push({x:target.x,y:target.y,radius:radius+25,damage:shot.damage*.30,delay:.25});this.ancientRicochet(shot,target);this.emit('ancientBlast',target.x,target.y,{radius});return;}this.emit('burst',target.x,target.y);for(const e of this.enemies)if(e!==target&&!e.dead&&!e.exit&&distance(e,target)<105){e.hp-=16*this.attackMultiplier();carnivalHit(this,e);lakeHit(this,e);caveHit(this,e,16*this.attackMultiplier());iceHit(this,e,16*this.attackMultiplier());wetlandHit(this,e,16*this.attackMultiplier());magmaHit(this,e,16*this.attackMultiplier());forestHit(this,e,16*this.attackMultiplier());e.flash=.06;this.gainEnergy(1);if(e.hp<=0)this.defeat(e);}}
 triggerUltimate(){if(this.paused||this.phase!=='combat'||this.ultimateEnergy<100)return false;
  if(this.craft.id==='owl')this.owlUltimateImpact();this.ultimateEnergy=0;this.player.invuln=Math.max(this.player.invuln,1);this.bullets=this.bullets.filter(b=>distance(b,this.player)>180);this.emit('breeze',this.player.x,this.player.y);this.phase='ultimate';this.phaseTime=0;this.charging=null;this.stats.bombs++;this.emit('ultimateStart');return true;
 }
 finishUltimate(){if(this.craft.id==='owl'){this.phase='combat';this.phaseTime=0;this.player.invuln=Math.max(this.player.invuln,1);this.last={};this.pending={};return;}this.bullets=[];for(const e of this.enemies){e.hp-=130*this.attackMultiplier();if(e.hp<=0)this.defeat(e);}if(this.boss?.age>2)this.boss.hp-=200*this.attackMultiplier();
  this.phase='combat';this.phaseTime=0;this.player.invuln=Math.max(this.player.invuln,1);this.last={};this.pending={};this.emit('bomb');}
 findSafeRespawn(){const x=155,candidates=[240,140,340,75,405];return candidates.map(y=>({x,y})).find(p=>this.gates.every(g=>Math.abs(p.x-g.x)>=g.w/2+40||(p.y>=g.gapY-g.gap/2+28&&p.y<=g.gapY+g.gap/2-28)))||null;}
 finishGuardian(){return false;}

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
 shoot(){const p=this.player,rank=this.weaponRanks.clover,c=this.craft;if(c.id==='swift'){this.shootSwift();return;}if(c.id==='owl'){this.shootOwl();return;}if(c.id==='falcon'){this.shootFalcon();return;}if(c.id==='ancient'){this.shootAncient();return;}if(c.id==='starwing'){this.shootStarwing();return;}
  const lv=this.bellLevels.upgrade;this.bellVolley++;
  let angles=c.id==='owl'?[-.25,0,.25]:c.id==='swift'||c.id==='starwing'?[-.045,.045]:[0];
  if(lv&&c.id==='swift')angles=[-.12-lv*.03,0,.12+lv*.03];if(lv&&c.id==='owl')angles=Array.from({length:3+lv*2},(_,i)=>(i-(2+lv*2)/2)*.12);
  for(const a of angles)this.craftShot(a,c.id==='ancient'?'explosive':c.id==='falcon'||c.id==='starwing'?'laser':'leaf',c.id==='ancient'?22:c.id==='falcon'?10:3,c.id==='falcon'?4+lv:1,c.id==='owl'?360:c.id==='falcon'?1500:this.tuning.playerBulletSpeed);
  for(const o of this.optionPositions)this.shots.push({id:++this.id,x:o.x,y:o.y,vx:this.tuning.playerBulletSpeed,vy:0,r:5,damage:2*this.attackMultiplier(),life:1.7,pierce:1,hit:new Set(),kind:'leaf',rank,option:true});
  const seek=this.bellLevels.special;if(seek&&this.bellVolley%Math.max(2,5-seek)===0){const targets=this.enemies.filter(e=>!e.dead&&!e.exit&&e.x>p.x);if(this.boss)targets.push(this.boss);if(c.id==='ancient'){this.craftShot(0,'gravity',12+seek*5,1,480);this.shots.at(-1).gravityLevel=seek;}else for(let i=0;i<Math.min(seek,targets.length);i++)this.craftShot((i-(seek-1)/2)*.2,'homing',6,1,c.id==='falcon'?1000:620,targets[i]);}
  p.shotCD=this.tuning.shotCooldown/(p.powerBoost>0&&['swift','starwing','owl'].includes(c.id)?1.5:1)/(c.id==='swift'&&this.cruise>=2?1.15:1);this.emit('shot');
 }
 starTargets(){const p=this.player;const valid=e=>!e.dead&&!e.exit&&!e.hidden&&!e.invisible&&e.hp>0&&e.x>p.x+20&&e.x<1280&&e.y>=0&&e.y<=480;
  const targets=this.enemies.filter(valid).sort((a,b)=>distance(a,p)-distance(b,p));if(this.boss?.age>2&&valid(this.boss))targets.push(this.boss);return targets;
 }
 updateStarLocks(dt){if(this.craft.id!=='starwing')return;this.starSalvoCD=Math.max(0,this.starSalvoCD-dt);this.starOverclock=Math.max(0,this.starOverclock-dt);
  const targets=this.starTargets().slice(0,4);if(targets.length===1&&targets[0]===this.boss)while(targets.length<4)targets.push(this.boss);
  const old=this.starLocks;this.starLocks=targets.map((target,i)=>{const previous=old.find(l=>l.target===target&&l.slot===i);return {target,slot:i,charge:Math.min(.6,(previous?.charge||0)+dt)};});
 }
 shootStarwing(){const p=this.player,rank=this.weaponRanks.clover,blue=this.bellLevels.upgrade,purple=this.bellLevels.special,boost=this.starOverclock>0;
  const count=blue>=2?4:2;for(let i=0;i<count;i++){this.craftShot((i-(count-1)/2)*.027,'laser',3+(rank-1)*.5,1+Math.floor(blue/2),1150);const beam=this.shots.at(-1);beam.starBeam=true;beam.y+=(i-(count-1)/2)*7;}
  for(const o of this.optionPositions){const n=this.bellLevels.shield>=3?2:1;for(let i=0;i<n;i++){this.craftShot((i-(n-1)/2)*.10,'laser',2.4,1,1050);const beam=this.shots.at(-1);beam.x=o.x+14;beam.y=o.y;beam.starBeam=true;beam.option=true;}}
  const valid=this.starTargets(),ready=this.starLocks.filter(l=>l.charge>=.6&&valid.includes(l.target));
  if(ready.length&&this.starSalvoCD<=0){const perTarget=1+(purple>=1?1:0)+(purple>=3?1:0);for(const lock of ready)for(let i=0;i<perTarget;i++){const side=(lock.slot+i)%2?1:-1;this.craftShot(side*(.25+i*.16),'homing',5+purple*1.5,1,680,lock.target);const missile=this.shots.at(-1);missile.starMissile=true;missile.targetId=null;}
   this.starSalvoCD=purple>=2?1.3:1.6;for(const l of this.starLocks)l.charge=0;
   this.emit('starSalvo',p.x,p.y,{count:ready.length*perTarget});if(!boost){this.starStacks++;if(this.starStacks>=3){this.starStacks=0;this.starOverclock=6;this.emit('starOverclock',p.x,p.y);}}
  }
  p.shotCD=this.tuning.shotCooldown/(1+(rank-1)*.2)/(this.starOverclock>0?1.6:1)/(p.powerBoost>0?1.5:1);this.emit('shot');
 }
 shootAncient(){const p=this.player,rank=this.weaponRanks.clover,blue=this.bellLevels.upgrade,purple=this.bellLevels.special;
  this.bellVolley++;this.craftShot(0,'explosive',22+(rank-1)*4,1,620);const shot=this.shots.at(-1);shot.ancientShell=true;shot.blastRadius=85+blue*15+(rank-1)*5;
  if(purple&&this.bellVolley%Math.max(2,5-purple)===0){this.craftShot(0,'gravity',12+purple*5,1,480);const core=this.shots.at(-1);core.gravityLevel=purple;core.deployX=Math.min(1180,p.x+360);}
  p.shotCD=this.tuning.shotCooldown/(1+(rank-1)*.15)/(this.siegeTime>=.7?1.25:1)/(p.powerBoost>0?1.3:1);this.emit('ancientFire',p.x,p.y);this.emit('shot');
 }
 ancientRicochet(shot,target){const candidates=this.enemies.filter(e=>e!==target&&!e.dead&&!e.exit&&e.hp>0&&e.x>0&&e.x<1280);if(this.boss&&this.boss!==target&&this.boss.hp>0&&this.boss.age>2)candidates.push(this.boss);const next=candidates.sort((a,b)=>distance(a,target)-distance(b,target))[0];if(!next)return;const angle=Math.atan2(next.y-target.y,next.x-target.x);this.shots.push({id:++this.id,x:target.x,y:target.y,vx:Math.cos(angle)*780,vy:Math.sin(angle)*780,r:6,damage:shot.damage*.4,life:1.5,pierce:1,hit:new Set([target.id]),kind:'leaf',rank:1,ancientRicochet:true});}
 separateBells(dt){const bells=this.pickups.filter(b=>b.kind==='weapon'&&b.life>0);for(let i=0;i<bells.length;i++)for(let j=i+1;j<bells.length;j++){const a=bells[i],b=bells[j],dx=b.x-a.x,dy=b.baseY-a.baseY,d=Math.hypot(dx,dy);if(d>=64)continue;const ux=d>.01?dx/d:0,uy=d>.01?dy/d:1,shift=Math.min((64-d)/2,90*dt);a.x=clamp(a.x-ux*shift,-40,1200);b.x=clamp(b.x+ux*shift,-40,1200);a.baseY=clamp(a.baseY-uy*shift,28,452);b.baseY=clamp(b.baseY+uy*shift,28,452);}}
 ancientArea(x,y,radius,damage,exclude=null){for(const e of this.enemies){if(e===exclude||e.dead||e.exit||distance(e,{x,y})>radius)continue;e.hp-=damage;carnivalHit(this,e);lakeHit(this,e);caveHit(this,e,damage);iceHit(this,e,damage);wetlandHit(this,e,damage);magmaHit(this,e,damage);forestHit(this,e,damage);e.flash=.08;if(e.hp<=0)this.defeat(e);}
  const b=this.boss;if(b&&b!==exclude&&b.age>2&&distance(b,{x,y})<=radius+b.r){b.hp-=damage;b.flash=.08;}
 }
 updateAncientWaves(dt){for(const w of this.ancientWaves){w.delay-=dt;if(w.delay<=0){this.ancientArea(w.x,w.y,w.radius,w.damage);this.emit('ancientWave',w.x,w.y,{radius:w.radius});}}this.ancientWaves=this.ancientWaves.filter(w=>w.delay>0);}
 shootFalcon(){const p=this.player,rank=Math.max(1,Math.min(3,this.weaponRanks.clover)),blue=this.bellLevels.upgrade,purple=this.bellLevels.special;
  this.bellVolley++;const empowered=purple>0&&this.bellVolley%Math.max(2,6-purple)===0;
  // One narrow lane: crystal increases cadence; bells extend penetration and precision.
  this.craftShot(0,'laser',10+(rank-1)*2,4+blue*2,2100);
  const shot=this.shots.at(-1);shot.falconBeam=true;shot.originX=shot.x;shot.falconBlue=blue;shot.falconEmpowered=empowered;
  if(empowered){shot.damage*=1.5+purple*.15;shot.pierce+=3;shot.r=8;this.emit('falconFocus',p.x,p.y);}
  p.shotCD=this.tuning.shotCooldown/[1,1.3,1.65][rank-1]/(p.powerBoost>0?1.2:1);this.emit('shot');
 }
 falconDamage(shot,target){if(!shot.falconBeam)return shot.damage;
  const range=Math.max(0,target.x-shot.originX),bonus=Math.min(1,range/600)*(.15+.10*shot.falconBlue);
  if(range>=450)this.emit('falconPierce',target.x,target.y);
  return shot.damage*(1+bonus);
 }
 owlShotRange(speed){const body=this.hurtbox.rx*2;return clamp(body*5*440/Math.max(1,speed),body*2,body*5);}
 shootOwl(){const p=this.player,rank=this.weaponRanks.clover,lv=this.bellLevels.upgrade,count=3+lv*2+(rank-1)*2;
  for(let i=0;i<count;i++){const speed=440*this.tuning.playerBulletSpeed/880;this.craftShot((i-(count-1)/2)*.105,'leaf',2.5,1,speed);Object.assign(this.shots.at(-1),{owlFeather:true,maxTravel:this.owlShotRange(speed),travelled:0});}

  p.shotCD=this.tuning.shotCooldown/(1+(rank-1)*.25)/(p.powerBoost>0?1.6:1);this.emit('shot');
 }
 launchOwlOrbit(){
  const p=this.player,lv=this.bellLevels.special;if(this.craft.id!=='owl'||lv<=0||this.owlOrbitCD>0)return false;
  this.owlOrbitCD=3;
  // A new volley starts in the four feather quadrants; each has its own life/hit set.
  for(let i=0;i<4;i++){const angle=-Math.PI/4+i*Math.PI/2;
   this.shots.push({id:++this.id,kind:'leaf',owlOrbit:true,orbitStart:angle,age:0,angle,x:p.x+Math.cos(angle)*66,y:p.y+Math.sin(angle)*66,vx:0,vy:0,r:13.5,damage:(8+2*lv)*this.attackMultiplier(),life:3,pierce:1,hit:new Set(),rank:this.weaponRanks.clover});
  }this.emit('owlOrbit',p.x,p.y);return true;
 }
 owlUltimateRadius(){return this.hurtbox.rx*2*5;}
 owlUltimateImpact(){const p=this.player,radius=this.owlUltimateRadius();this.owlUltimateCenter={x:p.x,y:p.y,radius};
  this.bullets=this.bullets.filter(b=>distance(b,p)>radius+(b.r||0));
  for(const e of this.enemies)if(!e.dead&&!e.exit&&distance(e,p)<=radius+e.r){e.hp-=130*this.attackMultiplier();e.flash=.1;if(e.hp<=0)this.defeat(e);}
  if(this.boss?.age>2&&distance(this.boss,p)<=radius+this.boss.r){this.boss.hp-=200*this.attackMultiplier();this.boss.flash=.1;}
  this.emit('owlNova',p.x,p.y,{radius});
 }
 blockOwlBullet(b,ox=b.x,oy=b.y){
  if(this.craft.id==='owl'&&b.life>0){let nearest=null,best=Infinity;
   for(const f of this.shots){if(!f.owlOrbit||f.life<=0)continue;const x=ox-(f.prevX??f.x),y=oy-(f.prevY??f.y),dx=(b.x-ox)-(f.x-(f.prevX??f.x)),dy=(b.y-oy)-(f.y-(f.prevY??f.y)),r=f.r+(b.r||0),a=dx*dx+dy*dy,c=x*x+y*y-r*r,bb=2*(x*dx+y*dy),d=bb*bb-4*a*c;let t=c<=0?0:a>0&&d>=0?(-bb-Math.sqrt(d))/(2*a):Infinity;
    if(t>=0&&t<=1&&t<best){best=t;nearest=f;}}
   if(nearest){nearest.life=0;b.life=0;this.emit('owlBlock',ox+(b.x-ox)*best,oy+(b.y-oy)*best);return true;}}
  if(this.craft.id!=='owl'||this.guardFeathers<=0||b.life<=0||b.heavy||(b.visualRadius||b.r||8)>12)return false;
  const p=this.player,dx=b.x-ox,dy=b.y-oy,t=clamp(((p.x-ox)*dx+(p.y-oy)*dy)/(dx*dx+dy*dy||1),0,1),x=ox+dx*t,y=oy+dy*t;if(Math.hypot(x-p.x,y-p.y)>58)return false;
  b.life=0;this.guardFeathers--;this.emit('owlBlock',x,y);return true;
 }
 shootSwift(){const p=this.player,rank=Math.max(1,Math.min(3,this.weaponRanks.clover)),lv=this.bellLevels.upgrade;
  // Crystal: denser central stream. Blue bells: wider independent wing fans.
  const count=rank*2;
  for(let i=0;i<count;i++){const angle=(i-(count-1)/2)*.038;this.craftShot(angle,'leaf',rank===1?3:rank===2?2.35:2,1,920);const shot=this.shots.at(-1);shot.swiftMain=true;shot.y+=(i-(count-1)/2)*4;}
  const sideCount=lv>0?Math.min(4,lv+1):0;for(let i=0;i<sideCount;i++){const angle=(i-(sideCount-1)/2)*.24+Math.sin(this.time*5)*.025;this.craftShot(angle,'leaf',1.35,1,840);const shot=this.shots.at(-1);shot.swiftSide=true;shot.guided=p.powerBoost>0;}
  for(const o of this.optionPositions){this.craftShot(0,'leaf',2,1,840);const shot=this.shots.at(-1);shot.x=o.x;shot.y=o.y;shot.option=true;}
  p.shotCD=Math.max(.075,this.tuning.shotCooldown/[1,1.35,1.8][rank-1]/(p.powerBoost>0?1.5:1));this.emit('shot');
 }
 swiftResonate(target,shot){const level=this.bellLevels.special;if(this.craft.id!=='swift'||!level||!shot.swiftMain)return;
  const previous=target.swiftEcho;if(!previous||this.time-previous.at>1)target.swiftEcho={count:0,at:this.time};const echo=target.swiftEcho;echo.count++;echo.at=this.time;
  if(echo.count<7-level||this.time<(target.swiftEchoReady||0))return;echo.count=0;target.swiftEchoReady=this.time+.16;const damage=7*this.attackMultiplier(),radius=48+level*10;
  target.hp-=damage;target.flash=.10;this.emit('swiftEcho',target.x,target.y,{radius});for(const e of this.enemies)if(e!==target&&!e.dead&&distance(e,target)<radius){e.hp-=damage*.6;if(e.hp<=0)this.defeat(e);}if(target!==this.boss&&target.hp<=0)this.defeat(target);
 }
 updateGravity(dt){
  for(const field of this.gravityFields){field.age+=dt;const radius=85+field.level*20;
   for(const e of this.enemies){if(e.dead||e.exit||e.kind!==0&&![12,16,20,24,28,32,36].includes(e.kind))continue;const d=distance(e,field);if(d<radius&&d>12){const step=Math.min(d-12,(45+field.level*15)*dt);const dx=(field.x-e.x)/d*step,dy=(field.y-e.y)/d*step;e.x+=dx;e.y=clamp(e.y+dy,25,455);e.baseY=(e.baseY??e.y)+dy;}}
   if(field.age>=1.2){this.ancientArea(field.x,field.y,radius,field.damage);this.emit('gravityBurst',field.x,field.y,{radius});}
  }this.gravityFields=this.gravityFields.filter(f=>f.age<1.2);
 }
 craftShot(angle,kind,damage,pierce=1,speed=880,target=null){const p=this.player;this.shots.push({id:++this.id,x:p.x+23,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:kind==='explosive'?11:5,damage:damage*(this.craft.id==='swift'&&this.bellLevels.upgrade>=4?1.02:1)*this.attackMultiplier()*(1+(this.bellLevels.upgrade||0)*(this.craft.id==='ancient'?.22:this.craft.id==='starwing'?.14:this.craft.id==='falcon'?.10:0))*(p.powerBoost>0?(['ancient','falcon'].includes(this.craft.id)?1.65:1.2):1),life:2.4,pierce,hit:new Set(),kind,rank:this.weaponRanks.clover,homingSpeed:speed,targetId:target?.id,target});}

 defeat(e){if(e.dead)return;e.dead=true;this.gainEnergy(e.kind===1?4:1.5);this.stats.cleared++;this.chain++;this.chainLife=3;this.score+=(e.kind===1?3:1)+Math.min(2,Math.floor(this.chain/12));this.emit(e.kind===1?'elite':'pop',e.x,e.y,{kind:e.kind});
  if(!e.warmup){carnivalDefeat(this,e);
  lakeDefeat(this,e);
  caveDefeat(this,e);
  iceDefeat(this,e);
  wetlandDefeat(this,e);
  magmaDefeat(this,e);
  forestDefeat(this,e);
  transitDefeat(this,e);}
  if(e.kind===4){this.addPickup('weapon',e.x,e.y);this.addPickup('crystal',e.x+65,clamp(e.y+65,35,435));}const count=e.kind===1?5:1;for(let i=0;i<count;i++)this.addPickup('gem',e.x+(i%3)*14,e.y+(i-2)*11);}
 advance(seconds,input={}){if(this.paused||this.status!=='playing')return 0;this.accumulator+=clamp(seconds,0,.1);let steps=0;
  for(const key of ['special','bomb','trait','dash']){if(input[key]&&!this.last[key])this.pending[key]=true;this.last[key]=!!input[key];}
  const edge={dash:false,special:false,bomb:false,trait:false,...this.pending};while(this.accumulator+1e-9>=STAR_FIELD.step){this.stepPhase(STAR_FIELD.step,{...input,...(steps===0?edge:{dash:false,special:false,bomb:false,trait:false})});this.accumulator-=STAR_FIELD.step;this.pending={};steps++;if(this.status!=='playing'||this.paused){this.accumulator=0;break;}}return steps;}
 stepPhase(dt,input){if(this.phase==='ultimate'){this.phaseTime+=dt;if(this.phaseTime>=(this.craft.id==='owl'?.9:3))this.finishUltimate();return;}
  if(this.phase==='guardian'){this.phaseTime+=dt;if(this.phaseTime>=STAR_PHASE1.guardianSeconds)this.finishGuardian();return;}
  if(this.phase==='falling'){this.phaseTime+=dt;if(this.phaseTime>=1){this.status='lost';this.emit('end');}return;}
  if(input.bomb&&this.triggerUltimate())return;
  this.tick(dt,input);
 }

 enterTransit(index){this.segment=index;this.stage=index;this.travelPhase='transit';this.branchOffer=null;this.gates=[];this.hazards=[];this.emit('transit',640,240,{from:this.route[index].name,to:this.route[index+1].name});this.message('星風亂流 · 航向 '+this.route[index+1].name);}
 enterSegment(index){this.segment=index;this.stage=index;this.travelPhase='region';this.branchOffer=null;this.hazards=[];for(const e of this.enemies)if(e.transit)e.exit=true;this.checkpoint=this.snapshot();this.emit('stage',0,0,{theme:this.currentMap?.theme});this.message('進入 '+this.currentMap.name);}
 timelineEvent(e){
  if(e.type==='warmup'){const kind={sky:15,lake:16,cave:20,ice:27,wetland:28,magma:35,forest:36}[this.currentMap.type];for(let i=0;i<4;i++){const enemy=this.spawn(kind,1320+i*65,90+((i*83+e.at*11)%280),'line');enemy.warmup=true;enemy.hp=enemy.maxHp=1;enemy.fireCD=999;}}
  if(e.type==='storybookSurprise'){const enemy=this.spawn(40,1300,210,'transitCourier');enemy.transit=true;enemy.escape=0;this.message('星光郵差迷路了！追上牠取得星芽鈴');}

  if(e.type==='carnival')carnivalEvent(this,e);
  if(e.type==='lakeStory')lakeEvent(this,e);
  if(e.type==='caveStory')caveEvent(this,e);
  if(e.type==='iceStory')iceEvent(this,e);
  if(e.type==='wetlandStory')wetlandEvent(this,e);
  if(e.type==='magmaStory')magmaEvent(this,e);
  if(e.type==='forestStory')forestEvent(this,e);
  if(e.type==='transitStory')transitEvent(this,e);
  if(e.type==='region'){this.message('區域 '+(e.index+1)+'／'+STAR_ROUTE_LENGTH+' · '+this.route[e.index].name);if(['sky','lake','cave','ice','wetland','magma','forest'].includes(this.route[e.index].type)){if(this.route[e.index].type==='sky')this.carnivalHitsStart=this.stats.hits;else if(this.route[e.index].type==='lake')this.lakeHitsStart=this.stats.hits;else if(this.route[e.index].type==='cave')this.caveHitsStart=this.stats.hits;else if(this.route[e.index].type==='ice')this.iceHitsStart=this.stats.hits;else if(this.route[e.index].type==='wetland')this.wetlandHitsStart=this.stats.hits;else if(this.route[e.index].type==='magma')this.magmaHitsStart=this.stats.hits;else this.forestHitsStart=this.stats.hits;this.emit('regionIntro',640,70,{name:this.route[e.index].name});}}
  if(e.type==='carnivalClear'){const flawless=this.stats.hits===(this.carnivalHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='lakeClear'){const flawless=this.stats.hits===(this.lakeHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='caveClear'){const flawless=this.stats.hits===(this.caveHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='iceClear'){const flawless=this.stats.hits===(this.iceHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='wetlandClear'){const flawless=this.stats.hits===(this.wetlandHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='magmaClear'){const flawless=this.stats.hits===(this.magmaHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='forestClear'){const flawless=this.stats.hits===(this.forestHitsStart??this.stats.hits);this.stats.regionsCleared=(this.stats.regionsCleared||0)+1;this.score+=flawless?8:5;this.message(flawless?'無傷穿越 · 分數 +8':'區域完成 · 分數 +5');this.emit('regionClear',640,240,{flawless});}
  if(e.type==='wave')this.wave(this.gates.length&&[3,4,5,7,8,9,10,11].includes(e.pattern)?0:e.pattern);if(e.type==='terrain')this.addTerrain(1440,240,260,true);
  if(e.type==='squirrel'&&!this.gates.some(g=>g.x>0))this.spawn(3,1340,100+this.random()*280,'charge');
  if(e.type==='carrier'){this.spawn(4,1310,240,'float');this.message('紅帽補給雲來了！擊破可取得星芽鈴；射擊鈴鐺可變色');}
  if(e.type==='option')this.addPickup('option',1300,240);if(e.type==='heart')this.addPickup('gem',1300,240);
  if(e.type==='gust'){this.message('前方風帶 · 順著風勢微調高度');this.emit('environment',0,0,{kind:'gust'});}
  if(e.type==='mist'){this.hazards.push({id:++this.id,kind:'mist',x:1380,y:90+this.random()*300,r:105,age:0,life:13});this.emit('environment',0,0,{kind:'mist'});}
  if(e.type==='lakeJump'){for(let i=0;i<2;i++){const enemy=this.spawn(6,890+i*250,454,'lakeLeap');enemy.charge=.85+i*.42;}this.message('湖面冒出泡泡 · 小心水豚躍起！');}
  if(e.type==='rockfall'){this.hazards.push({id:++this.id,kind:'rock',x:650+this.random()*500,y:-30,r:22,age:0,life:4.2,warn:1,vy:0,hit:false});this.message('洞頂星塵落下 · 留意落石預警！');}
  if(e.type==='icefall'){this.hazards.push({id:++this.id,kind:'icicle',x:560+this.random()*620,y:-35,r:18,age:0,life:4,warn:.9,vy:0,hit:false});this.message('冰晶發出亮光 · 冰柱即將掉落！');}
  if(e.type==='marsh'){this.hazards.push({id:++this.id,kind:'marsh',x:1380,y:100+this.random()*280,r:120,age:0,life:14});this.message('濕地泡泡霧 · 進入會稍微減速');}
  if(e.type==='ember'){spawnMagmaMeteor(this,20);this.message('火山落石 · 上方箭頭預警2秒');}
  if(e.type==='canopy'){this.addTerrain(1440,150+this.random()*180,225,false);this.message('古木枝幹交錯 · 尋找發光缺口！');}
  if(e.type==='warning'){const boss=STAR_REGION_BOSSES[this.route[this.route.length-1].type];this.message('前方大型反應！'+boss.name+'甦醒了');this.emit('warning');}
  if(e.type==='boss')this.startBoss();
 }
 startBoss(){if(this.boss)return;this.segment=STAR_ROUTE_LENGTH;this.stage=STAR_ROUTE_LENGTH;this.travelPhase='boss';this.branchOffer=null;this.hazards=[];this.bullets=[];this.warnings=[];for(const e of this.enemies){e.exit=true;this.emit('pop',e.x,e.y);}
  const profile=STAR_REGION_BOSSES[this.route[this.route.length-1].type],hp=profile.hp*this.tuning.enemyHpScale;this.gates=[];this.boss={...profile,x:1460,y:240,r:82,hp,maxHp:hp,age:0,fireCD:2,phase:1,cycle:0,beam:-1,beamY:240,flash:0};this.checkpoint=this.snapshot();this.message(profile.name+'現身！');this.emit('boss',0,0,{name:profile.name,regionType:profile.regionType});}
 tick(dt,input){
  const playerDt=dt;if(this.bayOpen){this.bayAge+=dt;if(this.bayAge>=3)this.closeBay();else dt*=.2;}
  if(this.craft.id==='ancient'){this.siegeTime=input.fire&&Math.hypot(input.x||0,input.y||0)<.12&&Math.hypot(this.velocity.x,this.velocity.y)<.12?Math.min(1,this.siegeTime+playerDt):0;}this.guardTime=Math.max(0,this.guardTime-dt);if(!this.guardTime&&this.craft.id!=='owl')this.guardFeathers=0;this.breezeCD=Math.max(0,this.breezeCD-dt);const motion=Math.hypot(input.x||0,input.y||0);this.cruise=motion>.25?this.cruise+dt:0;
  if(input.dash&&this.player.dashCD<=0){this.player.dashCD=30;this.player.dashing=5;if(this.craft.id==='falcon')this.player.invuln=Math.max(this.player.invuln,1);this.emit('dash');}
  this.time+=dt;const p=this.player;this.noticeLife=Math.max(0,this.noticeLife-dt);this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;
  for(const k of ['invuln','dashCD','dashing','shotCD','traitCD','powerBoost'])p[k]=Math.max(0,p[k]-playerDt);
  const travel=resolveStarPhase(this.time);if(travel.kind==='region'&&(travel.index!==this.segment||this.travelPhase!=='region'))this.enterSegment(travel.index);else if(travel.kind==='transit'&&this.travelPhase!=='transit')this.enterTransit(travel.index);
  this.energyBudget=Math.max(0,this.energyBudget-1.5*dt);
  for(const k of Object.keys(this.specialCooldowns))this.specialCooldowns[k]=Math.max(0,this.specialCooldowns[k]-dt);
  if(this.laserVisual){this.laserVisual.life-=dt;if(this.laserVisual.life<=0)this.laserVisual=null;}
  if(this.charging){this.charging.elapsed+=dt;if(this.charging.elapsed+1e-9>=STAR_PHASE1.chargeSeconds){const id=this.charging.id;this.charging=null;this.fireSpecial(id);}}
  // Buttons 2 and 3 are reserved.
  
  this.environmentSlow=1;this.carnivalWind=0;this.lakePull=0;this.caveDarkness=0;this.iceDrift=0;this.wetlandDrift=0;this.magmaPull=0;this.forestDrift=0;this.transitDrift=0;for(const h of this.hazards){h.age+=dt;h.life-=dt;carnivalHazard(this,h,dt);lakeHazard(this,h,dt);caveHazard(this,h,dt);iceHazard(this,h,dt);wetlandHazard(this,h,dt);magmaHazard(this,h,dt);forestHazard(this,h,dt);transitHazard(this,h,dt);if(h.kind==='mist'||h.kind==='marsh'){h.x-=(h.kind==='mist'?62:48)*dt;if(Math.hypot((h.x-p.x)*.72,h.y-p.y)<h.r)this.environmentSlow=Math.min(this.environmentSlow,h.kind==='mist'?.72:.82);}
   if((h.kind==='rock'||h.kind==='icicle')&&h.age>=h.warn){h.vy=Math.min(h.kind==='icicle'?430:360,h.vy+(h.kind==='icicle'?680:540)*dt);h.y+=h.vy*dt;if(!h.hit&&this.bodyCircle(h.x,h.y,h.r+5)){h.hit=true;this.hit();}}
   if(h.kind==='ember'&&h.age>=h.warn){h.vy=Math.min(390,h.vy+620*dt);h.x+=h.vx*dt;h.y+=h.vy*dt;if(!h.hit&&this.bodyCircle(h.x,h.y,h.r+6)){h.hit=true;this.hit();}}}
  this.hazards=this.hazards.filter(h=>h.life>0&&h.x>-160&&h.y<530);
  let ix=input.x||0,iy=input.y||0;if(this.craft.id==='ancient'){const q=1-Math.exp(-playerDt*5);this.velocity.x+=(ix-this.velocity.x)*q;this.velocity.y+=(iy-this.velocity.y)*q;ix=this.velocity.x;iy=this.velocity.y;}const x=ix,y=iy,n=Math.max(1,Math.hypot(x,y)),speed=this.tuning.playerSpeed*this.environmentSlow*(input.slow?.55:1)*(p.dashing>0?1+this.craft.boost:1);
  const drift=(this.currentMap?.hazard==='gust'&&!this.gates.length?Math.sin(this.time*1.4)*18:0)+(this.carnivalWind||0)+(this.lakePull||0)+(this.iceDrift||0)+(this.wetlandDrift||0)+(this.forestDrift||0)+(this.transitDrift||0);
  p.x=clamp(p.x+x/n*speed*playerDt,30,1225);p.y=clamp(p.y+(y/n*speed+drift)*playerDt,22,458);
  this.optionTrail.push({x:p.x,y:p.y});if(this.optionTrail.length>85)this.optionTrail.shift();
  this.optionPositions=this.craft.id==='starwing'?Array.from({length:this.options},(_,i)=>({x:p.x-40,y:clamp(p.y+(i===0?-1:1)*(this.starOverclock>0?57:36),18,462)})):Array.from({length:this.options},(_,i)=>{const a=this.optionTrail[Math.max(0,this.optionTrail.length-1-25*(i+1))]||p;return {x:a.x-45*(i+1),y:a.y};});
  this.owlOrbitCD=Math.max(0,this.owlOrbitCD-playerDt);if(input.fire)this.launchOwlOrbit();this.updateStarLocks(playerDt);if(input.fire&&p.shotCD<=0)this.shoot();
  while(this.eventIndex<this.timeline.length&&this.time>=this.timeline[this.eventIndex].at)this.timelineEvent(this.timeline[this.eventIndex++]);
  stepCaveWorld(this);if(this.boss)this.stepBoss(dt);
  for(const gate of this.gates){gate.x-=STAR_FIELD.scrollSpeed*dt;
   const overlap=Math.abs(p.x-gate.x)<gate.w/2+this.hurtbox.rx,outside=p.y<gate.gapY-gate.gap/2+this.hitRadius||p.y>gate.gapY+gate.gap/2-this.hitRadius;
   if(overlap&&outside){this.hit();p.y=clamp(p.y,gate.gapY-gate.gap/2+8,gate.gapY+gate.gap/2-8);}
   if(!gate.scored&&gate.x<p.x-70){gate.scored=true;this.score+=2;this.emit('gate');}}
  this.gates=this.gates.filter(g=>g.x>-120);
  for(const e of this.enemies){if(e.dead||e.exit)continue;e.age+=dt;e.flash=Math.max(0,e.flash-dt);
   if(e.warmup){e.x-=180*dt;e.y=e.baseY+Math.sin(e.age*2)*18;if(e.x<-100)e.exit=true;if(this.bodyCircle(e.x,e.y,e.r))this.hit();continue;}
   if(carnivalEnemy(this,e,dt)||lakeEnemy(this,e,dt)||caveEnemy(this,e,dt)||iceEnemy(this,e,dt)||wetlandEnemy(this,e,dt)||magmaEnemy(this,e,dt)||forestEnemy(this,e,dt)||transitEnemy(this,e,dt))continue;
   if(e.kind===2){const gate=this.gates.find(g=>g.id===e.gateId);if(!gate){e.exit=true;continue;}e.x=gate.x-15;}
   else if(e.kind===6&&e.pattern==='lakeLeap'){if(e.state==='enter'){e.charge-=dt;if(e.charge<=0){e.state='leap';e.age=0;}}else{e.x-=125*this.tuning.enemySpeedScale*dt;e.y=454-Math.sin(Math.min(1,e.age/2.2)*Math.PI)*300;if(e.age>2.2)e.exit=true;}}
   else if(e.kind===3){if(e.state==='enter'){e.x-=210*this.tuning.enemySpeedScale*dt;if(e.x<=1050){e.state='aim';e.charge=1;e.targetY=p.y;}}
    else if(e.state==='aim'){e.charge-=dt;e.y+=(e.targetY-e.y)*Math.min(1,dt*8);if(e.charge<=0){e.state='dash';e.y=e.targetY;}}
    else e.x-=650*this.tuning.enemySpeedScale*dt;}
   else{e.x-=e.speed*this.tuning.enemySpeedScale*dt;if(e.pattern==='sine')e.y=clamp(e.baseY+Math.sin(e.age*(e.kind===5?3:2))*(e.kind===5?55:22),30,450);if(e.pattern==='float')e.y=e.baseY+Math.sin(e.age*2)*15;if(e.pattern==='hop')e.y=clamp(e.baseY-Math.abs(Math.sin(e.age*2.6))*95,40,450);}
   if(e.x<-100)e.exit=true;e.fireCD-=dt;
   if(e.x>340&&e.x<1200&&e.fireCD<=0){if(e.kind===2)for(const off of [-.26,0,.26])this.aimed(e.x-18,e.y,this.difficulty==='challenge'?205:155,off);if(e.kind===1)this.aimed(e.x-30,e.y,135);if(e.kind===10)for(const off of [-.16,.16])this.aimed(e.x-18,e.y,145,off);e.fireCD=e.kind===2?2.1:e.kind===10?2.5:3;}
   if(!(e.kind===6&&e.state==='enter')&&this.bodyCircle(e.x,e.y,e.r))this.hit();
  }
  this.updateAncientWaves(dt);this.updateGravity(dt);
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;if(shot.targetId){const target=this.enemies.find(e=>e.id===shot.targetId&&!e.dead);if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),v=Math.hypot(shot.vx,shot.vy);shot.vx=Math.cos(a)*v;shot.vy=Math.sin(a)*v;}}
   if(shot.kind==='homing'){if(shot.starMissile&&shot.target&&!this.starTargets().includes(shot.target))shot.target=null;if(!shot.target||shot.target.dead||shot.target.exit||shot.target.hp<=0)shot.target=shot.starMissile?this.starTargets()[0]||null:this.enemies.filter(e=>!e.dead&&!e.exit&&e.x>shot.x-40).sort((a,b)=>distance(a,shot)-distance(b,shot))[0]||(this.boss?.age>2?this.boss:null);
    const target=shot.target;if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),velocity=shot.homingSpeed||this.tuning.playerBulletSpeed*.693;shot.vx+=(Math.cos(a)*velocity-shot.vx)*dt*5;shot.vy+=(Math.sin(a)*velocity-shot.vy)*dt*5;}}
   if(shot.guided){const target=this.enemies.find(e=>!e.dead&&!e.exit&&e.x>shot.x)||(this.boss?.age>2?this.boss:null);if(target){const a=Math.atan2(target.y-shot.y,target.x-shot.x),v=840;shot.vx+=(Math.cos(a)*v-shot.vx)*Math.min(1,playerDt*1.8);shot.vy+=(Math.sin(a)*v-shot.vy)*Math.min(1,playerDt*1.8);}}if(shot.owlOrbit){shot.prevX=shot.x;shot.prevY=shot.y;shot.age+=playerDt;shot.angle=shot.orbitStart+shot.age*Math.PI*2;const radius=66+Math.min(1,shot.age)*96;shot.x=p.x+Math.cos(shot.angle)*radius;shot.y=p.y+Math.sin(shot.angle)*radius;}else{const distance=Math.hypot(shot.vx,shot.vy)*playerDt,step=shot.maxTravel?Math.min(distance,Math.max(0,shot.maxTravel-shot.travelled)):distance,q=distance>0?step/distance:0;shot.x+=shot.vx*playerDt*q;shot.y+=shot.vy*playerDt*q;if(shot.maxTravel){shot.travelled+=step;shot.rangeExpired=shot.travelled>=shot.maxTravel;}}shot.life-=playerDt;
   if(shot.kind==='gravity'){if(shot.deployX!==undefined?shot.x>=shot.deployX:shot.life<=1.95){this.gravityFields.push({x:Math.min(1200,shot.x),y:shot.y,age:0,level:shot.gravityLevel,damage:shot.damage});shot.life=0;}continue;}
   for(const item of this.pickups)if(!shot.owlOrbit&&item.kind==='weapon'&&item.life>0&&shot.life>0&&starSweep(ox,oy,shot.x,shot.y,item.x,item.y,item.r+shot.r)){this.cycleStarbud(item);shot.life=0;break;}
   for(const gate of this.gates)if(shot.x>gate.x-gate.w/2&&ox<gate.x+gate.w/2&&(shot.y<gate.gapY-gate.gap/2||shot.y>gate.gapY+gate.gap/2))shot.life=0;
   if(shot.life<=0)continue;
   for(const e of (shot.falconBeam?[...this.enemies].sort((a,b)=>a.x-b.x):this.enemies))if(!e.dead&&!e.exit&&!shot.hit.has(e.id)&&starSweep(ox,oy,shot.x,shot.y,e.x,e.y,e.r+shot.r)){
    const impactDamage=this.falconDamage(shot,e),impact=shot.falconBeam?{...shot,damage:impactDamage}:shot;e.hp-=impactDamage;this.swiftResonate(e,shot);carnivalHit(this,e,impact);lakeHit(this,e,impact);caveHit(this,e,impactDamage);iceHit(this,e,impactDamage);wetlandHit(this,e,impactDamage);magmaHit(this,e,impactDamage);forestHit(this,e,impactDamage);this.gainEnergy(shot.option?.15:.6);e.flash=.035;shot.hit.add(e.id);shot.pierce--;if(e.hp<=0)this.defeat(e);
    if(shot.kind==='explosive')this.explode(shot,e);
    if(shot.kind==='homing'&&shot.rank===3){this.emit('burst',e.x,e.y);for(const other of this.enemies)if(other!==e&&!other.dead&&distance(e,other)<65){other.hp-=shot.damage*.45;if(other.hp<=0)this.defeat(other);}}
    if(shot.pierce<=0){shot.life=0;break;}}
   const b=this.boss;if(shot.life>0&&b&&b.age>2&&!shot.hit.has('boss')&&starSweep(ox,oy,shot.x,shot.y,b.x,b.y,b.r+shot.r)){b.hp-=this.falconDamage(shot,b);this.swiftResonate(b,shot);this.gainEnergy(shot.option?.15:.6);if(shot.kind==='explosive')this.explode(shot,b);b.flash=.035;shot.hit.add('boss');shot.life=0;this.emit('spark',shot.x,shot.y);}
   if(shot.rangeExpired)shot.life=0;
  }
  for(const b of this.bullets){if(b.magmaBomb){stepMagmaBomb(this,b,dt);continue;}const ox=b.x,oy=b.y;if(b.gravity)b.vy+=b.gravity*dt;if(b.forestDelay>0){b.forestDelay-=dt;if(b.forestDelay<=0&&!b.boosted){b.vx*=4.5;b.vy*=4.5;b.boosted=true;this.emit('forestTick',b.x,b.y);}}if(b.yarnBall)stepIceYarn(b,dt);else{b.x+=b.vx*dt;b.y+=b.vy*dt;}if(b.bounceY&&(b.y<18||b.y>462)){b.y=clamp(b.y,18,462);b.vy*=-1;}b.life-=dt;
   if(this.blockOwlBullet(b,ox,oy))continue;
   if(this.bodySweep(ox,oy,b.x,b.y,b.r)){this.hit();b.life=0;}
   else if(!b.grazed&&p.invuln<=0&&this.bodySweep(ox,oy,b.x,b.y,b.r+14)){b.grazed=true;this.stats.graze++;this.score+=1;this.emit('graze');}
   for(const gate of this.gates)if(Math.abs(b.x-gate.x)<gate.w/2&&(b.y<gate.gapY-gate.gap/2||b.y>gate.gapY+gate.gap/2))b.life=0;
  }
  this.separateBells(dt);for(const item of this.pickups){
   const captured=starColor(item).id;
   item.age+=dt;item.life-=dt;item.colorLock=Math.max(0,(item.colorLock||0)-dt);item.flash=Math.max(0,(item.flash||0)-dt);item.x+=((item.kick||0)-(item.kind==='weapon'?141.96:105))*dt;item.kick=Math.max(0,(item.kick||0)*Math.exp(-5*dt));if(item.kind==='weapon'){if(item.x>1200){item.x=1200;item.kick=Math.min(141.96,item.kick);}item.y=item.baseY+Math.sin(item.age*2.8)*7;}
   if(item.kind==='gem'&&distance(item,p)<150)item.magnetized=true;
   if(item.kind==='gem'&&item.magnetized){const d=distance(item,p),step=Math.min(d,Math.max(420,this.tuning.playerSpeed*2.1)*dt);if(d>0){item.x+=(p.x-item.x)/d*step;item.y+=(p.y-item.y)/d*step;}}else if(item.kind!=='weapon'&&distance(item,p)<65){item.x+=(p.x-item.x)*dt*6;item.y+=(p.y-item.y)*dt*6;}
   if(item.life>0&&this.status==='playing'&&this.phase==='combat'&&distance(item,p)<item.r+12){item.life=0;
    if(item.kind==='weapon')this.collectWeapon(captured);
    else if(item.kind==='crystal')this.collectCrystal();
    else if(item.kind==='option'){this.options=Math.min(2,this.options+1);this.stats.rescued++;this.score+=3;this.emit('rescue');this.message('妹妹精靈加入！同步輔助射擊');}
    else if(item.kind==='heart'){this.score+=1;this.emit('energy',item.x,item.y);}
    else{this.score+=1;this.emit('energy',item.x,item.y);}}
  }
  this.enemies=this.enemies.filter(e=>!e.dead&&!e.exit);this.shots=this.shots.filter(s=>s.life>0&&(s.owlOrbit||(s.x<1450&&s.x>-80&&s.y>-70&&s.y<550)));
  this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-70&&b.x<1350&&b.y>-70&&b.y<550);this.pickups=this.pickups.filter(i=>i.life>0&&i.x>-70);
  if(this.boss?.hp<=0&&this.status==='playing'&&this.phase==='combat'){this.status='won';this.score+=9;this.emit('end');}
 }
 stepBoss(dt){const b=this.boss;b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.x=Math.max(1070,b.x-125*this.tuning.enemySpeedScale*dt);b.y=240+Math.sin(b.age*.65*this.tuning.enemySpeedScale)*100;
  b.phase=b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.67?2:1;if(b.age<3)return;
  b.fireCD-=dt;if(b.fireCD<=0){b.cycle++;const speed=this.difficulty==='challenge'?215:170;for(let i=-b.phase;i<=b.phase;i++)this.aimed(b.x-80,b.y,speed,i*.19);
   b.fireCD=b.phase===3?1.2:1.8;if(b.phase>=2&&b.cycle%5===0){b.beam=2.5;b.beamY=this.player.y;this.message(b.name+'蓄力：離開發光帶！');}
   if(b.cycle%4===0){
    if(b.attack==='rockfall')this.hazards.push({id:++this.id,kind:'rock',x:520+this.random()*620,y:-30,r:24,age:0,life:4.2,warn:1,vy:0,hit:false});
    if(b.attack==='icefall')this.hazards.push({id:++this.id,kind:'icicle',x:520+this.random()*620,y:-35,r:20,age:0,life:4,warn:.9,vy:0,hit:false});
    if(b.attack==='ember')spawnMagmaMeteor(this,22);
    if(b.attack==='mist')this.hazards.push({id:++this.id,kind:'mist',x:1380,y:100+this.random()*280,r:95,age:0,life:10});
    if(b.attack==='marsh')this.hazards.push({id:++this.id,kind:'marsh',x:1380,y:100+this.random()*280,r:105,age:0,life:11});
    if(b.attack==='canopy')this.addTerrain(1440,150+this.random()*180,250,false);
    if(b.attack==='candy')for(let i=0;i<6;i++){const a=Math.PI+(i-2.5)*.22,velocity=115*this.tuning.enemyBulletScale;this.bullets.push({id:++this.id,x:b.x-70,y:b.y,vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,r:4,visualRadius:8,life:9,grazed:false,candy:true});}
   }}
  if(b.beam>-1){b.beam-=dt;if(b.beam<.6&&b.beam>0&&Math.abs(this.player.y-b.beamY)<26+this.hurtbox.ry&&this.player.x<b.x)this.hit();}
  if(this.bodyCircle(b.x,b.y,b.r))this.hit();
  if(this.time>=this.nextBossGift){this.addPickup('weapon',900,240);this.addPickup('gem',840,110+this.random()*260);this.nextBossGift+=18;}
 }
}
