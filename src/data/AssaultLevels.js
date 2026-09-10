const ground = (x, w) => ({x, y: 480, w, h: 100});
const ledge = (x, y, w = 210) => ({x, y, w, h: 20, oneWay: true});
const enemy = (kind, x, y = 480, range = 70) => ({kind, x, y, left: x-range, right: x+range});
const crate = (x, y = 480, loot = 'ammo') => ({x, y: y-48, w: 44, h: 48, hp: 27, kind: 'crate', loot});
const cage = (x, y = 380) => ({x, y: y-56, w: 48, h: 56, hp: 24, kind: 'cage'});
const generator = (x, y = 480) => ({x, y: y-72, w: 46, h: 72, hp: 70, kind: 'generator'});
const checkpoint = x => ({x, y: 480});
const base = (id, title, theme, width, boss, mission, tip) => ({
  id, title, theme, width, height: 560, spawn: {x: 95, y: 480}, exit: {x: width-70, y: 480},
  mission, tip, boss: {...boss, arena: width-1130, x: width-275, y: 480},
  platforms: [], movers: [], objects: [], gates: [], switches: [], bridges: [],
  hazards: [], tanks: [], enemies: [], checkpoints: [], chips: [],
  supplies: [], rescueGoal: 0, generatorGoal: 0,
});
const l1 = base(1, '苔光前哨', 0, 4500,
  {name: '鐵甲守門蟲', type: 'beetle', hp: 600},
  '打開吊橋、突破前哨，擊退鐵甲守門蟲', '盾兵正面減傷；跳到背後或用松果爆破。藍色核心亮起時是頭目的破綻。');
l1.platforms = [ground(0,1550),ground(1750,2750),ledge(500,380),ledge(820,285),ledge(1190,380),ledge(2040,380),ledge(2360,285),ledge(2750,380),ledge(3510,380),ledge(3840,380)];
l1.bridges = [{x:1550,y:480,w:200,h:24,switch:0}];l1.switches=[{x:1440,y:447,label:'吊橋'}];
l1.objects=[crate(330),cage(900,285),crate(1250,380,'health'),crate(1940),cage(2440,285),crate(2810,380,'grenade'),crate(3170,480,'health')];
l1.enemies=[enemy('guard',620),enemy('drone',1040,270),enemy('guard',1210),enemy('shield',2020),enemy('guard',2420),enemy('mortar',2750,380),enemy('drone',2670,275),enemy('shield',3100),enemy('sniper',3610,380)];
l1.checkpoints=[checkpoint(1840),checkpoint(3300)];l1.chips=[{x:635,y:344},{x:2480,y:249},{x:3600,y:344}];l1.tanks=[{x:2120,y:480}];l1.supplies=[{x:3250,y:450,kind:'ammo'}];

const l2=base(2,'樹冠貨運線',1,5050,{name:'暴走裝甲列車',type:'train',hp:720},'跨越列車平台，救出至少一位乘客並阻止裝甲列車','列車低射線可跳過，高射線可蹲下；紅色虛線亮起時先決定站位。');
l2.platforms=[ground(0,1200),ground(1370,880),ground(2440,850),ground(3480,1570),ledge(440,380),ledge(750,280),ledge(1600,375),ledge(1890,275),ledge(2660,380),ledge(2910,280),ledge(4010,380),ledge(4350,365)];
l2.movers=[{x:1150,y:425,w:140,h:20,dx:140,dy:0,period:3.5},{x:2180,y:435,w:170,h:20,dx:125,dy:-45,period:4},{x:3220,y:430,w:170,h:20,dx:135,dy:0,period:3.6}];
l2.objects=[crate(280),cage(830,280),crate(1700,375,'grenade'),cage(1960,275),crate(2640,480,'health'),cage(2990,280),crate(3650,480,'health')];l2.rescueGoal=1;
l2.enemies=[enemy('guard',660),enemy('drone',1030,260),enemy('guard',1650),enemy('sniper',1980,275,0),enemy('drone',2360,280),enemy('shield',2780),enemy('mortar',2960,280,0),enemy('guard',3610),enemy('drone',3780,240),enemy('sniper',4220,380,0)];
l2.checkpoints=[checkpoint(1480),checkpoint(3570)];l2.chips=[{x:900,y:244},{x:1910,y:239},{x:3030,y:244}];l2.supplies=[{x:1500,y:451,kind:'ammo'},{x:3640,y:451,kind:'grenade'}];

const l3=base(3,'螢晶深洞',2,4680,{name:'鑽地鼴鼠機',type:'mole',hp:760},'摧毀兩座抽取機，穿過蒸氣洞窟','蒸氣先閃紅光再噴發；反彈橡果與手榴彈能攻擊掩體後方。鼴鼠鑽地後留意落點。');
l3.platforms=[ground(0,4680),ledge(440,380),ledge(740,280),{x:1110,y:395,w:100,h:85},ledge(1500,380),ledge(1800,280),{x:2180,y:395,w:90,h:85},ledge(2540,380),ledge(2850,280),ledge(3680,380),ledge(4020,380)];
l3.objects=[crate(290),generator(1020),cage(810,280),crate(1560,380,'grenade'),generator(2480),cage(2930,280),crate(3210,480,'health')];l3.generatorGoal=2;
l3.gates=[{x:3440,y:270,w:35,h:210,requires:[1,4]}];
l3.hazards=[{x:1290,y:421,w:110,h:59,period:3.8,on:1.15,offset:0,type:'steam'},{x:2340,y:408,w:105,h:72,period:4.2,on:1.3,offset:1.7,type:'steam'},{x:3090,y:415,w:110,h:65,period:4,on:1.2,offset:2,type:'steam'}];
l3.enemies=[enemy('guard',600),enemy('shield',980),enemy('mortar',1540,380,0),enemy('drone',1830,260),enemy('sniper',2030),enemy('guard',2670),enemy('shield',3030),enemy('drone',3240,265),enemy('sniper',3800,380,0)];
l3.checkpoints=[checkpoint(1470),checkpoint(3340)];l3.chips=[{x:840,y:244},{x:1900,y:244},{x:2990,y:244}];l3.tanks=[{x:1500,y:480}];

const l4=base(4,'雲端齒輪廠',3,4930,{name:'浮空夜梟堡',type:'owl',hp:820},'啟動空橋並救出工匠，擊退浮空夜梟堡','上方平台適合對付飛行敵人。向上加左右可斜射；夜梟張翼後核心會暴露。');
l4.platforms=[ground(0,1330),ground(1570,1170),ground(2960,1970),ledge(420,380),ledge(700,280),ledge(1690,380),ledge(1970,280),ledge(2290,380),ledge(3080,380),ledge(3360,280),ledge(3910,380),ledge(4200,280),ledge(4510,380)];
l4.movers=[{x:1280,y:440,w:150,h:20,dx:195,dy:-70,period:4},{x:2700,y:405,w:155,h:20,dx:165,dy:0,period:3.5}];
l4.switches=[{x:2450,y:447,label:'空橋'}];l4.bridges=[{x:2740,y:480,w:220,h:22,switch:0}];
l4.objects=[crate(300),cage(780,280),crate(1900,480,'grenade'),generator(2230),cage(3430,280),crate(3570,480,'health')];l4.rescueGoal=1;
l4.hazards=[{x:1110,y:320,w:16,h:160,period:4.5,on:1.3,offset:0,type:'laser'},{x:2610,y:340,w:18,h:140,period:4.3,on:1.25,offset:2,type:'laser'}];
l4.enemies=[enemy('guard',570),enemy('drone',890,220),enemy('drone',1270,285),enemy('sniper',2040,280,0),enemy('shield',2290),enemy('drone',2800,260),enemy('mortar',3170,380,0),enemy('drone',3540,230),enemy('guard',4040)];
l4.checkpoints=[checkpoint(1650),checkpoint(3690)];l4.chips=[{x:850,y:244},{x:2080,y:244},{x:3490,y:244}];

const l5=base(5,'熔岩伐木場',4,5120,{name:'熔爐鋸木巨像',type:'saw',hp:900},'駕駛甲蟲坦克突破重兵，拆除熔爐與鋸木巨像','坦克裝甲厚、炮彈能穿盾，但連射會過熱；高處救援要下車。鋸木巨像震地時用跳躍閃避。');
l5.platforms=[ground(0,1830),ground(2070,3050),ledge(560,380),ledge(840,280),ledge(1440,380),ledge(2300,380),ledge(2590,280),ledge(2980,380),ledge(4210,380),ledge(4530,380)];
l5.switches=[{x:1710,y:447,label:'耐熱橋'}];l5.bridges=[{x:1830,y:480,w:240,h:22,switch:0}];
l5.objects=[crate(350),cage(920,280),generator(1370),crate(2460,480,'health'),cage(2670,280),generator(3310),crate(3650,480,'health')];l5.generatorGoal=2;
l5.gates=[{x:3890,y:230,w:34,h:250,requires:[2,5]}];l5.tanks=[{x:430,y:480},{x:2200,y:480}];
l5.hazards=[{x:1130,y:427,w:110,h:53,period:4.2,on:1.4,offset:0,type:'lava'},{x:2780,y:420,w:105,h:60,period:3.8,on:1.1,offset:1.5,type:'lava'}];
l5.enemies=[enemy('shield',800),enemy('mortar',1490,380,0),enemy('guard',1590),enemy('drone',1890,240),enemy('shield',2490),enemy('mortar',2710,280,0),enemy('shield',3060),enemy('guard',3490),enemy('drone',3650,230),enemy('sniper',4330,380,0)];
l5.checkpoints=[checkpoint(2170),checkpoint(3780)];l5.chips=[{x:980,y:244},{x:2730,y:244},{x:3090,y:344}];

const l6=base(6,'古樹核心堡',5,5450,{name:'古樹機械王',type:'core',hp:1100},'拆除三座護盾塔，迎戰古樹機械王','核心王依序使用鎖定雷柱、扇形連射與震地波。先拆武器部位，趁核心藍光時集中火力。');
l6.platforms=[ground(0,1860),ground(2060,3390),ledge(480,380),ledge(770,280),ledge(1180,380),ledge(1530,280),ledge(2260,380),ledge(2550,280),ledge(2990,380),ledge(3290,280),ledge(4410,380),ledge(4710,280),ledge(5020,380)];
l6.switches=[{x:1740,y:447,label:'古樹橋'}];l6.bridges=[{x:1860,y:480,w:200,h:22,switch:0}];
l6.objects=[crate(310),generator(1090),cage(850,280),crate(1510,480,'grenade'),generator(2450),cage(2630,280),generator(3510),cage(3360,280),crate(3890,480,'health')];l6.generatorGoal=3;
l6.gates=[{x:4170,y:230,w:34,h:250,requires:[1,4,6]}];l6.tanks=[{x:2130,y:480}];
l6.hazards=[{x:1300,y:405,w:100,h:75,period:4.2,on:1.15,offset:0,type:'steam'},{x:2830,y:325,w:18,h:155,period:4.7,on:1.2,offset:1.5,type:'laser'},{x:3730,y:425,w:100,h:55,period:4.1,on:1.15,offset:2,type:'lava'}];
l6.enemies=[enemy('shield',640),enemy('drone',990,240),enemy('sniper',1630,280,0),enemy('guard',1670),enemy('shield',2390),enemy('mortar',2670,280,0),enemy('drone',3040,255),enemy('shield',3250),enemy('sniper',3410,280,0),enemy('guard',3840),enemy('drone',4100,230),enemy('sniper',4520,380,0)];
l6.checkpoints=[checkpoint(2150),checkpoint(4030)];l6.chips=[{x:1650,y:244},{x:2730,y:244},{x:3440,y:244}];

export const ASSAULT_LEVELS = Object.freeze([l1,l2,l3,l4,l5,l6]);
