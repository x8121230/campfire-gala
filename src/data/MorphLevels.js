const floor=(x,w,y=560)=>({x,y,w,h:150});
const deck=(x,y,w)=>({x,y,w,h:22,oneWay:true});
const tunnel=(x,w=210)=>({x,y:385,w,h:143});
const vine=x=>({x,y:390,w:30,h:170});
const badge=(x,y=535)=>({x,y});
const sign=(x,text)=>({x,text});
const falls=n=>({type:'falls',value:n,label:`失足不超過 ${n} 次`});
const base=(id,title,focus,width,extra)=>({id,title,focus,width,theme:Math.floor((id-1)/3),spawn:{x:85,y:560},exit:{x:width-90,y:560},
    platforms:[floor(0,width)],badges:[badge(300),badge(width/2),badge(width-280)],checkpoints:[{x:Math.floor(width/2),y:560}],challenge:falls(2),...extra});
export const MORPH_CHAPTERS=['晨光林地','蘑菇溪谷','風之遺跡','樹冠試煉'];
export const MORPH_LEVELS=[
    base(1,'第一段飛躍','跑跳與檢查點',1900,{
        platforms:[floor(0,580),floor(700,570),floor(1390,510),deck(920,470,150)],
        badges:[badge(330),badge(1000,440),badge(1570)],checkpoints:[{x:1130,y:560}],
        signs:[sign(220,'← → 移動　空白鍵跳躍'),sign(480,'按住跳得高，放開跳得低'),sign(780,'高處也藏著徽章')]
    }),
    base(2,'圓滾滾小樹洞','低洞與高低支線',2100,{
        platforms:[floor(0,2100),tunnel(410),tunnel(1260,250),deck(880,475,160)],
        badges:[badge(520,545),badge(960,446),badge(1400,545)],checkpoints:[{x:1130,y:560}],challenge:{type:'forms',value:3,label:'試用三種形態'},
        signs:[sign(240,'1 圓形：身體小，能鑽低洞'),sign(740,'2 三角形跳得更高'),sign(1640,'3 方形：穩穩站住')]
    }),
    base(3,'三角衝鋒隊','破藤與空中衝刺',2200,{
        platforms:[floor(0,870),floor(1050,1150)],vines:[vine(480),vine(1480)],badges:[badge(650),badge(1190),badge(1640)],checkpoints:[{x:1220,y:560}],
        challenge:{type:'vines',value:2,label:'清除兩道藤蔓'},signs:[sign(260,'2 三角形＋X 衝刺破藤'),sign(710,'跳躍途中也能衝刺'),sign(1260,'X 放開後才能再次衝刺')]
    }),
    base(4,'彈跳菇的高空路','彈跳與上下路線',2200,{
        platforms:[floor(0,2200),deck(550,360,270),deck(900,440,180)],springs:[{x:370,y:540,w:85}],
        badges:[badge(660,330),badge(980,408),badge(1710)],checkpoints:[{x:1350,y:560}],challenge:{type:'springs',value:1,label:'乘坐彈跳菇'},
        signs:[sign(180,'踩上粉紅菇，向上彈！'),sign(820,'高路找徽章，地面也能抵達'),sign(1500,'燈籠會記住最近的落腳點')]
    }),
    base(5,'方塊守門員','壓板與逆風',2400,{
        gates:[{x:1240,y:350,w:42,h:210}],plates:[{x:780,y:560,w:88,gate:0,duration:8}],winds:[{x:450,y:360,w:700,h:210,force:-1500}],
        badges:[badge(630),badge(1450),badge(2080)],checkpoints:[{x:1480,y:560}],challenge:{type:'plates',value:1,label:'啟動石頭壓板'},
        signs:[sign(250,'3 方形受風影響較小'),sign(720,'方形站住壓板半秒，開門 8 秒'),sign(1020,'開門後可換形態加速')]
    }),
    base(6,'會移動的葉舟','搭乘移動平台',2300,{
        platforms:[floor(0,620),floor(1120,1180),deck(1580,460,180)],
        movers:[{x:615,y:525,w:190,h:22,dx:320,dy:0,period:5}],badges:[badge(300),badge(1300),badge(1670,430)],
        checkpoints:[{x:1310,y:560}],signs:[sign(360,'先等葉舟靠近，再跳上去'),sign(1190,'站穩會跟著葉舟移動'),sign(1490,'用高跳找上層徽章')]
    }),
    base(7,'風中的兩條路','浮風與穩重',2500,{
        platforms:[floor(0,780),floor(860,1640),deck(1130,380,280)],
        winds:[{x:400,y:220,w:520,h:350,force:1100},{x:1000,y:220,w:620,h:350,force:-500,lift:true}],
        badges:[badge(590),badge(1260,349),badge(1970)],checkpoints:[{x:1660,y:560}],challenge:{type:'forms',value:3,label:'活用三種形態'},
        signs:[sign(240,'方形穩，圓形快，三角跳得高'),sign(1040,'上升氣流讓圓形跳得更高'),sign(1740,'高路徽章可自行選擇探索')]
    }),
    base(8,'落石山道','看預警抓時機',2400,{
        rocks:[{x:660,top:190,bottom:620,period:3.6,fall:.8,offset:0},{x:1490,top:190,bottom:620,period:4.2,fall:.9,offset:1.6}],
        platforms:[floor(0,2400),deck(980,470,170)],vines:[vine(1890)],
        badges:[badge(340),badge(1060,440),badge(2070)],checkpoints:[{x:1200,y:560}],
        signs:[sign(390,'金色預警出現後，落石才會掉下'),sign(1270,'等落石通過，或抓時機衝刺')]
    }),
    base(9,'石門與低洞','開門後即時變形',2600,{
        platforms:[floor(0,2600),tunnel(870,230),deck(1850,460,200)],
        plates:[{x:640,y:560,w:88,gate:0,duration:8}],gates:[{x:1200,y:350,w:42,h:210}],vines:[vine(1640)],
        badges:[badge(990,545),badge(1470),badge(1940,430)],checkpoints:[{x:1390,y:560}],challenge:{type:'forms',value:3,label:'使用全部變形能力'},
        signs:[sign(380,'先方形壓板，再圓形過低洞'),sign(1450,'三角衝刺通過藤蔓')]
    }),
    base(10,'樹冠升降梯','垂直平台與落點',2500,{
        platforms:[floor(0,2500),deck(880,350,420),deck(1430,440,180)],
        movers:[{x:630,y:525,w:180,h:22,dx:0,dy:-185,period:5}],
        badges:[badge(1080,319),badge(1510,408),badge(2160)],checkpoints:[{x:1760,y:560}],challenge:falls(1),
        signs:[sign(370,'跳上升降葉台，站穩等它上升'),sign(1340,'從高處跳到下一片葉台'),sign(1870,'地面也是可以回頭探索的路')]
    }),
    base(11,'蘑菇風之旅','彈跳、浮風與落石',2800,{
        platforms:[floor(0,1280),floor(1420,1380),deck(640,340,260)],springs:[{x:410,y:540,w:90}],
        winds:[{x:350,y:200,w:850,h:370,force:450,lift:true}],rocks:[{x:2060,top:180,bottom:620,period:4,fall:.8,offset:.7}],
        vines:[vine(2370)],badges:[badge(760,310),badge(1650),badge(2550)],checkpoints:[{x:1540,y:560}],challenge:{type:'vines',value:1,label:'衝破終點藤牆'},
        signs:[sign(180,'圓形借風彈得更高，空中可調方向'),sign(1140,'離開氣流後，準備跨過溪谷'),sign(1810,'觀察預警後再通過落石區')]
    }),
    base(12,'變形精靈的試煉','三形態綜合冒險',3300,{
        platforms:[floor(0,1670),floor(1840,1460),tunnel(430,230),deck(2570,350,300)],
        vines:[vine(940),vine(2090)],plates:[{x:1210,y:560,w:90,gate:0,duration:8}],gates:[{x:1510,y:350,w:42,h:210}],
        springs:[{x:2350,y:540,w:88}],rocks:[{x:1980,top:190,bottom:620,period:4.4,fall:.8,offset:2}],
        badges:[badge(540,545),badge(2210),badge(2700,319)],checkpoints:[{x:1110,y:560},{x:1900,y:560},{x:2980,y:560}],
        challenge:{type:'forms',value:3,label:'三種精靈全員登場'},
        signs:[sign(220,'圓形過洞，三角破藤，方形開門'),sign(1570,'開門後準備起跳跨溪'),sign(2250,'最後一枚徽章藏在樹冠上')]
    })
];
