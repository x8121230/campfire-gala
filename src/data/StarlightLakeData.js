export const LAKE_KEY = 'starlight_lake_v1';
export const LAKE_PLACES = [
 {id:'meadow',name:'螢火草原',subtitle:'節奏與觀察',x:205,y:212,labelY:288,game:'FireflyCatchGame',gameName:'點點螢火',seal:'螢光星印',story:'螢火蟲正在排練晚會。先找出燈光規律，再一起跟著節拍發光！'},
 {id:'observatory',name:'星象觀測台',subtitle:'連線與推理',x:638,y:163,labelY:262,game:'ConstellationGame',gameName:'星空連線',seal:'星軌星印',story:'望遠鏡的密碼藏在星星裡。觀察排列，找回失散的星座。'},
 {id:'cave',name:'水晶洞窟',subtitle:'光路與機關',x:1080,y:205,labelY:288,game:'LightWorkshopGame',gameName:'森林光路工坊',seal:'水晶星印',story:'水晶折射出奇妙的光。解讀洞口謎題，也能到光路工坊挑戰鏡子機關。'},
 {id:'dock',name:'月光碼頭',subtitle:'規劃與運送',x:205,y:438,labelY:532,game:'ForestCourierGame',gameName:'森林快遞',story:'船長正準備出發！先在既有的森林快遞練習規劃路線；湖上航行玩法留待後續擴充。'},
 {id:'owl',name:'夜行動物屋',subtitle:'星湖偵探社',x:572,y:449,labelY:586,story:'我是星燈，這片湖的守夜人。新的偵探委託已經送到，探索手帳也替你保管好了。'},
 {id:'island',name:'湖心小島',subtitle:'月門的祕密',x:1060,y:443,labelY:558,story:'月門沉睡已久。集齊三枚星印，再依照月亮的規律點亮石碑。'}
];
// Solutions are IDs rather than display positions; options may be shuffled safely.
export const LAKE_RIDDLES = {
 meadow:[
  {q:'燈籠依序亮起：金、藍、金、藍、金、？',options:['金','藍','紫'],answer:'藍',hint:'每兩盞重複一次：金 → 藍。'},
  {q:'每朵花停 3 隻螢火蟲。4 朵花共有幾隻？',options:['7','12','16'],answer:'12',hint:'把 3 加四次，或想成 4 組 3。'},
  {q:'一群螢火蟲每次多 2 隻：3、5、7、？',options:['8','9','10'],answer:'9',hint:'上一群有 7 隻，再加 2 隻。'}
 ],
 observatory:[
  {q:'望遠鏡密碼：2、4、8、16、？',options:['20','24','32'],answer:'32',hint:'每個數都是前一個的兩倍。'},
  {q:'向北走，再右轉，接著左轉。最後面向哪裡？',options:['北','東','西'],answer:'北',hint:'北向右是東，東向左又回到……'},
  {q:'星星排成三角形：第一排 1 顆、第二排 2 顆、第三排 3 顆。總共？',options:['5','6','9'],answer:'6',hint:'要算的是所有排，不是只看最後一排。'}
 ],
 cave:[
  {q:'紅水晶比藍水晶重，藍水晶比綠水晶重。哪個最輕？',options:['紅','藍','綠'],answer:'綠',hint:'由重到輕排列：紅 → 藍 → 綠。'},
  {q:'開門需要 9 單位能量。已有 4，還缺多少？',options:['4','5','13'],answer:'5',hint:'9 減掉已經有的 4。'},
  {q:'水晶按大小循環：小、中、大、小、中、？',options:['小','中','大'],answer:'大',hint:'三顆是一組，最後一顆接在哪裡？'}
 ]
};
export const MOON_PHASES = ['新月','上弦','滿月','下弦'];
export function moonNext(sequence){return MOON_PHASES[(MOON_PHASES.indexOf(sequence.at(-1))+1)%4];}
export function lakeState(data={}){
 const old=data[LAKE_KEY];
 if(old!==undefined&&(!old||old.version!==1||!Array.isArray(old.seals)||!Array.isArray(old.visited)||!Array.isArray(old.collectibles)))throw Error('湖畔存檔版本不相容，已停止寫入。');
 return old?JSON.parse(JSON.stringify(old)):{version:1,seals:[],visited:[],collectibles:[],moonClears:0};
}
export function islandUnlocked(state){return ['meadow','observatory','cave'].every(id=>state.seals.includes(id));}
export function updateLake(data,action,id){
 const next=JSON.parse(JSON.stringify(data)),s=lakeState(next);
 if(action==='visit'){
  if(!LAKE_PLACES.some(p=>p.id===id))throw Error('未知場所');
  if(!s.visited.includes(id))s.visited.push(id);
 }else if(action==='seal'){
  if(!LAKE_RIDDLES[id])throw Error('未知星印');
  if(!s.seals.includes(id))s.seals.push(id);
 }else if(action==='moon'){
  if(!islandUnlocked(s))throw Error('請先收集三枚星印');
  if(!s.collectibles.includes('moonstone'))s.collectibles.push('moonstone');
  s.moonClears=Math.min(999999,(Number(s.moonClears)||0)+1);
 }else throw Error('未知探索動作');
 next[LAKE_KEY]=s;return next;
}
export function lakeLayout(portrait){
 return portrait?{width:720,height:1280,places:LAKE_PLACES.map((p,i)=>({id:p.id,x:190+(i%2)*340,y:510+Math.floor(i/2)*200,w:310,h:172}))}
 :{width:1280,height:720,places:LAKE_PLACES.map(p=>({id:p.id,x:p.x,y:p.labelY,w:280,h:76}))};
}
