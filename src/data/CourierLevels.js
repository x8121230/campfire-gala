const places=()=>[
    {name:'郵站',x:367,y:373,art:1},{name:'兔兔農場',x:543,y:205,art:2},
    {name:'松鼠麵包屋',x:793,y:205,art:3},{name:'小熊樹屋',x:919,y:373,art:4},
    {name:'河狸工坊',x:793,y:518,art:5},{name:'林間市集',x:543,y:518,art:1}
];
const E=(a,b,cost=1,extra={})=>({a,b,cost,...extra});
const ring=()=>[E(0,1),E(1,2),E(2,3),E(3,4),E(4,5),E(5,0)];
const P=(name,from,to,weight=1,extra={})=>({name,from,to,weight,...extra});
const L=(id,title,focus,par,parcels,extra={})=>({id,title,focus,par,nodes:places(),edges:ring(),start:0,capacity:2,parcels,returnHome:false,
    hints:['先比較包裹的取送站，再想哪些可以順路一起帶。','路上的數字是路程；先處理限制較多的包裹，通常能少繞路。'],...extra});
export const COURIER_CHAPTERS=['路線小學徒','配送規劃師','森林總調度'];
export const COURIER_LEVELS=[
    L(1,'第一封森林信','取貨與送達',2,[P('歡迎信',0,1)],{hints:['包裹不會自己上車，要先在取貨站裝貨。','在右側點「裝 A」，再點兔兔農場；抵達後會自動送達。']}),
    L(2,'順路一起送','一起帶省路程',4,[P('種子信',0,1),P('市集海報',0,5)],{hints:['背包有兩格，這兩件可以同時裝上。','兩件都在郵站。先一起裝，再比較走兩側或繞一圈的路程。']}),
    L(3,'背包不是無限大','重量與分趟',5,[P('工具箱',0,4,2),P('農場信',0,1)],{hints:['工具箱佔兩格，不能再帶信；可以分兩趟送。','不必把地圖繞一圈，送完一件後可以沿原路回郵站。']}),
    L(4,'沿路收件','不同取貨站',5,[P('紅蘿蔔',1,3),P('麵粉袋',5,2)],{edges:[...ring(),E(1,5)],hints:['先到取貨站，才有包裹能送。背包空著時可先想下一筆。','比較從兔兔農場或市集出發取件，利用它們之間的直路一起帶走。']}),
    L(5,'小橋的載重牌','輕裝走捷徑',12,[P('大型木箱',1,5,2),P('明信片',0,4)],{edges:[...ring().map(e=>({...e,cost:2})),E(1,5,1,{maxLoad:1})],hints:['捷徑只讓一格貨通過，木箱需要兩格。','重貨得走外圈；安排信件順路送，回程再利用小橋。']}),
    L(6,'送完記得收工','三件與返站',6,[P('農場訂單',0,1),P('麵包籃',2,4),P('市集回信',5,0)],{returnHome:true,edges:[...ring(),E(2,4,1)],hints:['這次最後要回出發站。先規劃一條能沿路收送的路線。','市集回信的終點就是郵站，可以留到返程時一起帶。']}),
    L(7,'河狸的吊橋','到站操作橋樑',4,[P('蜂蜜罐',2,3),P('木工圖',0,4)],{gateCount:1,nodes:places().map((n,i)=>i===1?{...n,switch:0}:n),edges:ring().map(e=>e.a===2?{...e,gate:0}:e),hints:['橋關著時不能過，要到有扳手的站點操作。','兔兔農場有扳手，經過時先放下橋，再去麵包屋取蜂蜜。']}),
    L(8,'先開捷徑再取件','提前準備路線',10,[P('重工具',1,5,2),P('招呼信',0,4)],{returnHome:true,gateCount:1,nodes:places().map((n,i)=>i===4?{...n,switch:0}:n),edges:[...ring().map(e=>({...e,cost:2})),E(1,5,1,{gate:0})],hints:['扳手在河狸工坊，提早開橋能替之後的重貨省路。','先送工坊信順便放橋，再考慮從哪側去領工具。']}),
    L(9,'通行證先到','送件解鎖道路',7,[P('通行文件',0,4),P('農場禮物',1,2),P('市集回信',5,0)],{returnHome:true,edges:[...ring().filter(e=>e.a!==1),E(1,2,1,{permit:0}),E(2,4,1)],hints:['標「先 A」的路，要送完 A 才能使用。','河狸工坊收到通行文件後，農場和麵包屋之間的路才會開放。']}),
    L(10,'先麵粉後麵包','委託先後順序',6,[P('麵粉',0,2),P('新鮮麵包',2,3,1,{requires:[0]}),P('市集訂單',0,5)],{returnHome:true,hints:['麵包屋得先收到麵粉，才能把麵包交給你。','A 送達麵包屋後，B 才能裝貨；順便考慮 C 要在去程還是回程送。']}),
    L(11,'大件小件排順序','容量與窄路',9,[P('木製看板',0,3,2),P('種子包',1,5),P('圖書包',2,4)],{capacity:2,returnHome:true,edges:[...ring(),E(1,5,1,{maxLoad:1}),E(2,4,1,{maxLoad:1})],hints:['帶著看板時背包已滿，也不能走窄路。','先比較完成大件後，沿途能不能把兩件小貨順路收齊。']}),
    L(12,'兩座橋的巡迴','雙開關與串單',6,[P('北橋工具',0,2),P('南橋材料',2,5),P('完工照片',4,0)],{returnHome:true,gateCount:2,nodes:places().map((n,i)=>i===1?{...n,switch:0}:i===4?{...n,switch:1}:n),edges:[...ring(),E(1,5,1,{gate:0}),E(2,4,1,{gate:1})],hints:['兩個扳手各管一座橋；不是每次都要開兩座。','把取貨與送貨排在同一圈，只有能縮短路程的橋才值得繞去開。']}),
    L(13,'冰淇淋專送','保鮮路程',6,[P('冰淇淋',2,5,1,{fresh:3}),P('農場海報',0,1),P('木工信',0,4)],{returnHome:true,edges:[...ring(),E(1,5,1,{maxLoad:1})],hints:['鮮度從裝貨後才開始計算，只在走路時消耗。','先把順路的普通信送掉，再領冰淇淋；窄橋要保持輕裝。']}),
    L(14,'生日蛋糕接力','先備料再保鮮',6,[P('蛋糕材料',0,2,2),P('生日蛋糕',2,3,1,{requires:[0],fresh:2}),P('邀請卡',0,5)],{capacity:3,returnHome:true,hints:['蛋糕要等材料送達才能領，領到後不能繞遠路。','先決定邀請卡在哪一段送；從麵包屋到小熊樹屋只有一路程。']}),
    L(15,'兩份鮮貨別貪心','分批保鮮',8,[P('冰果汁',1,4,1,{fresh:3}),P('熱麵包',2,5,1,{fresh:3}),P('市集布旗',0,3)],{returnHome:true,edges:[...ring(),E(2,4,1,{maxLoad:1}),E(1,5,1,{maxLoad:1})],hints:['同時裝兩份鮮貨不一定划算；窄路也會檢查總載重。','先安排一份鮮貨的最短送達路，再決定要不要中途領另一份。']}),
    L(16,'開路後的冷藏單','解鎖與保鮮',7,[P('修橋文件',0,4),P('冷藏甜點',2,5,1,{fresh:2}),P('農場木箱',0,1,2)],{capacity:3,returnHome:true,edges:[...ring(),E(1,5,1,{permit:0,maxLoad:1})],hints:['甜點的保鮮路程很短，要先讓捷徑能用。','先把修橋文件送到工坊；從麵包屋經農場走捷徑，兩步就能到市集。']}),
    L(17,'森林慶典籌備','雙前置與四件貨',9,[P('食材箱',1,2,2),P('活動許可',0,4),P('慶典點心',2,3,1,{requires:[0,1],fresh:2}),P('市集旗幟',5,3)],{capacity:3,returnHome:true,gateCount:1,nodes:places().map((n,i)=>i===4?{...n,switch:0}:n),edges:[...ring(),E(2,4,1,{gate:0})],hints:['C 要等 A 與 B 都送達；可以先處理遠處的許可與開橋。','點心領到後要儘快送。旗幟可以先放在背包，等點心一起送到樹屋。']}),
    L(18,'總調度的一天','綜合路網挑戰',9,[P('冷藏原料',1,2,2,{fresh:2}),P('橋梁通行證',0,4),P('慶典蛋糕',2,5,1,{requires:[0,1],fresh:2}),P('工坊回件',4,0,2)],{capacity:3,returnHome:true,gateCount:1,nodes:places().map((n,i)=>i===4?{...n,switch:0}:n),edges:[...ring(),E(1,5,1,{permit:1,maxLoad:1}),E(2,4,2,{gate:0})],hints:['先把需要開通的路準備好，再領短程保鮮的貨。','蛋糕只剩兩路程，必須經農場窄橋送市集。大件回貨可以等送完蛋糕再拿。']})
];
// Reproducible bonus jobs: route costs, endpoints and departure station change.
// The shipped seed list is checked by the same solver as the story missions.
export function makeCourierVariant(seed){
    const base=COURIER_LEVELS[12+seed%6],l=JSON.parse(JSON.stringify(base));
    l.id=`v${seed+1}`;l.title=`變化委託 ${String(seed+1).padStart(2,'0')}`;l.focus=['改道配送','換站出發','不同收件地'][seed%3];
    l.start=(seed+2+Math.floor(seed/6))%6;l.par=([8,6,8,8,8,12,8,8,9,8,10,14][seed]??base.par+8);
    const e=l.edges[(seed*3+1+Math.floor(seed/6))%l.edges.length];e.cost=2+seed%2;
    const p=l.parcels[(seed+1)%l.parcels.length];p.to=(p.to+1+(seed+Math.floor(seed/6))%3)%6;if(p.to===p.from)p.to=(p.to+1)%6;
    l.parcels.forEach(p=>{if(p.fresh!==undefined)p.fresh+=2;});
    l.hints=['先重新看取貨站、收件站與出發站；這份委託的配置與主線不同。','先送能解鎖道路或包裹的委託，再替鮮貨保留短路線。'];
    return l;
}
export const COURIER_VARIANT_SEEDS=[0,1,2,3,4,5,6,7,8,9,10,11];
export const COURIER_VARIANTS=COURIER_VARIANT_SEEDS.map(makeCourierVariant);
