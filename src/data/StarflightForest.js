// Ancient tree canopy: gameplay helpers without a Phaser dependency.
export const FOREST_PLANS=['落葉傘兵徑','滴答木偶林','三尾幻葉祭'];
export const FOREST_ENEMIES=[
 {name:'橡果投石松鼠兵',hp:20,r:21,speed:116},
 {name:'提線木偶啄木鳥',hp:58,r:27,speed:92},
 {name:'時鐘齒輪松雞',hp:76,r:33,speed:70},
 {name:'落葉剪影狐狸',hp:118,r:38,speed:68}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const forestPlan=(map,seed)=>Number.isInteger(map?.forestScenario)&&map.forestScenario>=0?map.forestScenario%3:((seed>>>6)+(map?.index||0)*17)%3;
export function forestTimeline(map,seed,index,start=index*58){
 const plan=forestPlan(map,seed),schedules=[
  [[3,'squirrels'],[9,'grouse'],[15,'branchGate'],[21,'woodpecker'],[28,'squirrels'],[35,'fox'],[41,'finale']],
  [[3,'woodpecker'],[10,'squirrels'],[16,'leafStorm'],[22,'grouse'],[29,'woodpecker'],[35,'fox'],[41,'finale']],
  [[3,'grouse'],[9,'squirrels'],[16,'branchGate'],[22,'fox'],[29,'leafStorm'],[35,'woodpecker'],[41,'finale']]
 ];
 return schedules[plan].map(([at,beat])=>({at:start+at,type:'forestStory',beat,plan,index}));
}
function forestBullet(s,x,y,a,v=118,r=5,extra={}){const speed=v*s.tuning.enemyBulletScale;s.bullets.push({id:++s.id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,visualRadius:r+4,life:9,grazed:false,forest:true,...extra});}
function addHazard(s,kind,x,y,extra={}){const cap=kind==='forestEcho'?4:kind==='forestLeaf'?8:3;if(s.hazards.filter(h=>h.kind===kind).length>=cap)return null;let life=5,warn=.7,r=24;if(kind==='forestBranch'){life=7;warn=1;r=36;}else if(kind==='forestLeafWind'){life=6;warn=.8;r=110;}else if(kind==='forestEcho'){life=2.7;warn=.55;r=34;}const h={id:++s.id,kind,x,y,age:0,life,warn,r,...extra};s.hazards.push(h);return h;}

export function forestEvent(s,event){
 const {beat,plan}=event,group=++s.id,count=n=>Math.max(1,Math.round(n*s.tuning.waveScale));s.stats.forestWaves=(s.stats.forestWaves||0)+1;
 if(beat==='squirrels'){for(let i=0,n=count(5);i<n;i++){const e=s.spawn(36,1330+i*86,58+(i%4)*105,'forestSquirrel',group);e.floatPhase=i*.7;}s.message('橡果傘兵從樹冠飄落 · 橡果會沿斜線反彈');}
 if(beat==='woodpecker'){const e=s.spawn(37,1390,115+plan*92,'forestWoodpecker',group);e.fireCD=1.1;s.message('提線木偶啄木鳥 · 絲線收緊後瞬移，再射出三枚木楔');}
 if(beat==='grouse'){const e=s.spawn(38,1410,175+plan*48,'forestGrouse',group);e.fireCD=1.25;s.message('時鐘松雞的木鐘彈會先懸停，滴答一聲後突然加速');}
 if(beat==='fox'){const e=s.spawn(39,1430,165+plan*60,'forestFox',group);e.fireCD=1.45;s.message('菁英落葉狐狸製造兩道殘影 · 找出胸前最亮的本體');s.emit('warning',e.x,e.y);}
 if(beat==='branchGate'){addHazard(s,'forestBranch',1360,240,{gapY:plan===2?315:plan===1?165:240,gap:145});for(let i=0;i<7;i++)s.addPickup('gem',1200+i*48,(plan===2?315:plan===1?165:240)+Math.sin(i)*45);s.message('古木枝幹正在交錯 · 跟著星砂穿過發光缺口');}
 if(beat==='leafStorm'){addHazard(s,'forestLeafWind',1110,plan===2?315:150,{dir:plan===0?1:-1,r:115});for(let i=0;i<8;i++)s.addPickup('gem',1240+i*44,80+(i%4)*105);s.message('樹冠落葉風 · 順著葉片方向調整高度');}
 if(beat==='finale'){for(let i=0;i<9;i++)s.addPickup('gem',1280+i*42,240+Math.sin(i*.76)*126);s.message('晨光樹屋出口出現 · 沿金色螢光完成樹海巡航');}
}
export function forestHit(s,e,damage=0){if(e.kind<36||e.kind>39||damage<=0)return;if(e.kind===39&&e.phaseShift>0){const restored=damage*.35;e.hp=Math.min(e.maxHp,e.hp+restored);e.phaseFlash=.2;s.emit('forestLeaves',e.x,e.y);}}
export function forestDefeat(s,e){
 if(e.kind<36||e.kind>39)return;
 if(e.kind===36)s.addPickup('gem',e.x,e.y);
 if(e.kind===38){s.stats.forestElites=(s.stats.forestElites||0)+1;s.addPickup('gem',e.x,e.y-16);s.addPickup('gem',e.x,e.y+16);}
 if(e.kind===39){s.score+=4;s.stats.forestElites=(s.stats.forestElites||0)+1;s.addPickup('weapon',e.x+52,e.y);s.message('落葉狐狸化為金色葉片！接住變色星芽鈴');s.emit('elite',e.x,e.y);}
}
export function forestHazard(s,h,dt){
 if(!h.kind.startsWith('forest'))return;const p=s.player,active=h.age>=h.warn;
 if(h.kind==='forestBranch'){h.x-=125*dt;const outside=p.y<h.gapY-h.gap/2+s.hitRadius||p.y>h.gapY+h.gap/2-s.hitRadius;if(active&&!h.hit&&Math.abs(p.x-h.x)<h.r+s.hurtbox.rx&&outside){h.hit=true;s.hit();s.emit('forestTwigHit',p.x,p.y);}}
 if(h.kind==='forestLeafWind'){h.x-=58*dt;if(active&&Math.abs(p.x-h.x)<h.r+s.hurtbox.rx&&Math.abs(p.y-h.y)<170)s.forestDrift+=h.dir*62;}
 if(h.kind==='forestEcho'){h.x-=50*dt;h.y+=Math.sin(h.age*3+(h.phase||0))*13*dt;if(active&&!h.fired){h.fired=true;const a=Math.atan2(p.y-h.y,p.x-h.x);for(const off of [-.36,0,.36])forestBullet(s,h.x,h.y,a+off,104,4);s.emit('forestLeafFan',h.x,h.y);}}
}
export function forestEnemy(s,e,dt){
 if(e.kind<36||e.kind>39)return false;const speed=s.tuning.enemySpeedScale,p=s.player;e.fireCD-=dt;e.phaseFlash=Math.max(0,(e.phaseFlash||0)-dt);
 if(e.kind===36){e.x-=e.speed*speed*dt;e.y=clamp(e.baseY+e.age*25+Math.sin(e.age*2.5+(e.floatPhase||0))*18,45,438);if(e.x<1160&&e.fireCD<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);forestBullet(s,e.x-16,e.y,a,122,5,{bounceY:true});e.fireCD=2.25;}}
 else if(e.kind===37){e.x=Math.max(1005,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*3.2)*128,55,425);if(e.x<1180&&e.fireCD<=0){e.telegraph=.42;e.fireCD=2.45;s.emit('forestStrings',e.x,e.y);}if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){e.y=70+((e.id*97+Math.floor(e.age*10)*43)%340);const a=Math.atan2(p.y-e.y,p.x-e.x);for(const off of [-.17,0,.17])forestBullet(s,e.x-20,e.y,a+off,176,4);s.emit('forestWoodStrike',e.x,e.y);}}}
 else if(e.kind===38){e.x=Math.max(1035,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.3)*42,80,395);if(e.x<1180&&e.fireCD<=0){const a=Math.atan2(p.y-e.y,p.x-e.x);for(const off of [-.2,.2])forestBullet(s,e.x-30,e.y,a+off,38,6,{forestDelay:1,boosted:false});e.fireCD=2.7;s.emit('forestTick',e.x,e.y);}}
 else{e.x=Math.max(1020,e.x-e.speed*speed*dt);e.y=clamp(e.baseY+Math.sin(e.age*1.15)*55,75,395);e.phaseShift=Math.max(0,(e.phaseShift||0)-dt);if(e.x<1180&&e.fireCD<=0){e.phaseShift=1.1;for(const side of [-1,1])addHazard(s,'forestEcho',e.x+20,e.y+side*92,{phase:side});const a=Math.atan2(p.y-e.y,p.x-e.x);for(const off of [-.46,-.23,0,.23,.46])forestBullet(s,e.x-32,e.y,a+off,112,5);e.fireCD=3.25;s.emit('forestLeaves',e.x,e.y);}}
 if(e.x<-120)e.exit=true;if(s.bodyCircle(e.x,e.y,e.r))s.hit();return true;
}
