// Every distance is a world-grid unit; the painted ground has no visible grid.
export const SAVE='forest_storybook_adventure_v2';
export const LEGACY='forest_paper_forest_ch1_v1';
export const PLAYER={hp:10,mp:6,speed:4.6,regen:.3,hurtGrace:.8};
export const ITEMS={coat:{name:'冒險衣',slot:'armor',defense:1},wand:{name:'魔法棒',slot:'weapon',attack:1,range:5,interval:.6}};
export const SKILLS={honey:{name:'蜂蜜糖罐',icon:'❀',cost:2,cooldown:6,range:6,radius:3,duration:3},elephant:{name:'大象水車',icon:'≋',cost:4,cooldown:12,range:7,damage:6},blossom:{name:'星花療癒',icon:'✿',cost:3,cooldown:10,heal:3}};
export const ENEMIES={
 rabbit:{name:'暈眩小兔',hp:3,defense:0,attack:2,range:1,interval:1.8,speed:2,special:'hop',power:2,cooldown:7},
 squirrel:{name:'調皮松鼠',hp:4,defense:0,attack:2,range:4,interval:2,speed:1.8,special:'dash',power:2,cooldown:6},
 capy:{name:'氣噗噗水豚',hp:6,defense:0,attack:2,range:3,interval:2,speed:1.2,special:'fan',power:2,cooldown:7},
 otter:{name:'貝殼滑水獺',hp:5,defense:0,attack:2,range:1,interval:1.6,speed:2,special:'dash',power:3,cooldown:6},
 frog:{name:'鼓腮泥巴蛙',hp:4,defense:0,attack:2,range:4,interval:2.2,speed:1.1,special:'mud',power:2,cooldown:7},
 swan:{name:'月冠天鵝',hp:18,defense:0,attack:3,range:2,interval:2,speed:2.1,special:'tornado',power:3,cooldown:8}
};
export const AREAS={moon:{name:'沉睡月亮湖',spawn:{x:-17,z:7},npc:{id:'moon',name:'月光守望者',x:-17,z:3},portal:{x:-19,z:10,name:'回到星之森'}},forest:{name:'星之森',spawn:{x:-29,z:5},npc:{id:'forest',name:'貓頭鷹村長',x:-29,z:1},portal:{x:22,z:-24,name:'前往月亮湖'}}};
export const ISLANDS=[{x:-13,z:0,rx:11,rz:15},{x:13,z:-3,rx:8,rz:11}];
export const PADS=Array.from({length:5},(_,i)=>({id:'pad'+i,x:-3.4+i*2.4,z:-2,r:1.55,hidden:i===1||i===3}));
export const REEDS=[[-20,-5],[-18,0],[-10,8],[-5,-5],[8,-8],[15,4]].map(([x,z],i)=>({id:'reed'+i,x,z}));
export const FOREST_APPLES=[[20,-8],[24,-10],[28,-8],[27,-14],[22,-15]].map(([x,z],i)=>({id:'apple'+i,x,z}));
export const MUD=[[-20,4],[-16,3],[-13,1]].map(([x,z],i)=>({id:'mud'+i,x,z}));
export const SPAWNS={forest:[['rabbit',-12,1],['squirrel',-9,-4],['rabbit',-2,-2],['squirrel',3,-10],['rabbit',10,-6],['squirrel',16,-12],['rabbit',6,6],['squirrel',14,8]],moon:[['capy',-10,3],['capy',-12,-5],['capy',-6,-6],['otter',-12,-9],['frog',-6,1],['frog',12,3],['swan',13,-3]]};
export const QUESTS=[
 {id:'moon_capy',area:'moon',title:'讓水豚睡個好覺',goal:3,kind:'calm',type:'capy',story:'噓……月亮湖的水豚整晚沒睡好。用星光泡泡洗去牠們的壞脾氣，讓三位朋友安心入睡。',reward:'honey'},
 {id:'moon_path',area:'moon',title:'風裡藏著荷葉路',goal:5,kind:'pads',story:'前方有五片月光荷葉。走到岸邊，按「蒲公英閃避」吹出絨毛，就能照亮看不見的落腳處。每片踩過的荷葉都會記住你。',reward:'elephant'},
 {id:'moon_swan',area:'moon',title:'洗亮月亮的皇冠',goal:1,kind:'calm',type:'swan',story:'月冠天鵝把羽毛弄髒了，正氣得團團轉！先躲開橘色預告，再用泡泡幫忙。蜂蜜能黏住牠，大象水車能沖洗一大片。'},
 {id:'moon_home',area:'moon',title:'沿著星霜回家',goal:1,kind:'ice',story:'天鵝留下了一條星霜小徑。沿南側的冰路走回西岸，再來告訴我湖畔的晚安故事。',reward:'blossom'},
 {id:'forest_calm',area:'forest',title:'森林朋友深呼吸',goal:8,kind:'calm',story:'惡作劇流星讓八位森林朋友愛生氣。按住星光泡泡，幫大家慢慢平靜下來。'},
 {id:'forest_apples',area:'forest',title:'陽光蘋果派',goal:5,kind:'apples',story:'刺蝟太太想烤蘋果派。去東方的向陽坡找五顆金色蘋果，靠近後按出現的「採摘」按鈕。'},
 {id:'forest_clean',area:'forest',title:'把小路洗香香',goal:3,kind:'mud',story:'村口的小路沾上了三處泥巴。走近泥巴，用任務專用的清洗泡泡把路洗乾淨吧。',reward:'honey'},
 {id:'forest_ducks',area:'forest',title:'小鴨排隊回家',goal:1,kind:'ducks',story:'三隻小鴨在林間迷路了。去小路中央找到牠們，放慢腳步走在前面，帶牠們回東側湖邊。',reward:'elephant'}
];
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const damage=(raw,defense)=>Math.max(1,raw-defense);
export const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return dist(p,{x:a.x+t*dx,z:a.z+t*dz});};
export const ICE=[{x:-6,z:9},{x:10,z:6}];
export const onIsland=p=>ISLANDS.some(a=>((p.x-a.x)/a.rx)**2+((p.z-a.z)/a.rz)**2<=1);
