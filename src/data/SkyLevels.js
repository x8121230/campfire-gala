export const SKY_CHAPTERS=['翡翠森林','赤岩峽谷','暴風雲海','熔岩山脈','天空古城'];
export const SKY_BOSSES=['鐵甲鍬形艦','金翼巡航堡','雷雲魔魟','熔岩龍戰機','古城核心艦'];
const L=(id,title,type,duration,kinds,extra={})=>({id,title,type,duration,kinds,theme:Math.floor((id-1)/3),seed:8721+id*193,interval:Math.max(3.3,5.3-id*.09),count:3+(id>6?1:0),killGoal:Math.round(duration/5),rescueGoal:3,rescueTotal:5,power:id>=10?4:id>=4?2:0,damageStar:3,challenge:{type:'kills',value:Math.round(duration/3.1),label:`擊退 ${Math.round(duration/3.1)} 架敵機`},tip:'移動閃避紅紫色敵彈，自動連射會持續攻擊。青色機心才是被擊中的範圍。',...extra});
export const SKY_LEVELS=[
 L(1,'青葉起飛','patrol',36,['scout'],{count:3,interval:5.5,killGoal:6,challenge:{type:'kills',value:12,label:'擊退 12 架敵機'},tip:'先用連射練習追蹤敵機。收集 P 升級武器，青色光點是你的小小判定圈。'}),
 L(2,'雲端救援','rescue',48,['scout','diver'],{challenge:{type:'rescue',value:5,label:'救回全部 5 隻小鳥'},tip:'靠近綠傘小鳥就能救援。牠們不會被子彈打傷；先閃彈，再靠近接住。'}),
 L(3,'森林巨甲','boss',22,['scout','diver'],{boss:0,challenge:{type:'parts',value:2,label:'擊破左右兩個武器部位'},tip:'紅圈標出左右武器部位。先拆掉它們，頭目的火力與核心防護都會減弱。'}),
 L(4,'峽谷封鎖線','patrol',55,['scout','sniper','guard'],{wind:16,challenge:{type:'kills',value:23,label:'擊退 23 架敵機'},tip:'紫色狙擊機會先畫出瞄準線。等瞄準線固定後再移動，讓它打在你剛才的位置。'}),
 L(5,'護送補給艇','escort',58,['scout','diver','sniper'],{challenge:{type:'escort',value:4,label:'補給艇保留至少 4 格裝甲'},tip:'補給艇在下方航行。敵彈會傷到它；站在前方攔截敵機，也可用炸彈清場。'}),
 L(6,'金翼堡壘','boss',26,['guard','sniper'],{boss:1,challenge:{type:'parts',value:2,label:'擊破左右兩個武器部位'},tip:'金翼堡會封鎖交錯航道。留意寬大的預警帶，趁空檔用雷射穿透護衛。'}),
 L(7,'守住雲燈塔','defend',58,['diver','scout','carrier'],{challenge:{type:'beacon',value:6,label:'燈塔保留至少 6 格耐久'},tip:'每架逃過底線的敵機都會傷害燈塔。用散彈攔截編隊，追蹤彈追擊兩側敵人。'}),
 L(8,'逆風救援','rescue',64,['sniper','diver','carrier'],{wind:30,weather:11,rescueTotal:6,rescueGoal:4,challenge:{type:'rescue',value:6,label:'救回全部 6 隻小鳥'},tip:'橫風會推動飛機；預警帶亮起後，雷柱才會落下。小鳥仍有時間慢慢接近。'}),
 L(9,'雷雲魔魟','boss',28,['scout','sniper'],{boss:2,wind:20,challenge:{type:'parts',value:2,label:'擊破左右兩個武器部位'},tip:'環狀彈幕會留下缺口。不要追著每一顆子彈跑；看整圈走勢，必要時衝刺穿過。'}),
 L(10,'穿越火山口','patrol',64,['diver','guard','sniper'],{weather:10,challenge:{type:'kills',value:27,label:'擊退 27 架敵機'},tip:'火山噴流有橘色預警。蓄力彈可以穿透多架敵機，適合處理排成一列的封鎖隊。'}),
 L(11,'最後的補給','escort',68,['carrier','sniper','diver'],{weather:14,challenge:{type:'escort',value:4,label:'補給艇保留至少 4 格裝甲'},tip:'召喚機會派出小型護衛。先處理母艦，可減少後續壓力；補給艇也會靠撿取護盾修復。'}),
 L(12,'熔岩龍追擊','boss',30,['diver','guard'],{boss:3,challenge:{type:'parts',value:2,label:'擊破左右兩個武器部位'},tip:'熔岩龍會召喚俯衝機並封鎖航道。左右火焰部位被擊破後，扇形彈幕會變少。'}),
 L(13,'守衛天空之門','defend',68,['carrier','guard','sniper','diver'],{wind:18,challenge:{type:'beacon',value:6,label:'城門保留至少 6 格耐久'},tip:'在左右航道間輪流攔截。護盾機需要較集中火力，追蹤彈與雷射各有擅長的目標。'}),
 L(14,'古城撤離任務','rescue',72,['carrier','sniper','guard'],{wind:24,weather:12,rescueTotal:7,rescueGoal:5,challenge:{type:'rescue',value:7,label:'救回全部 7 隻小鳥'},tip:'小鳥、升級與敵機會同時出現。先安排移動路線，滿能量時蓄力，危急時炸彈清場。'}),
 L(15,'核心艦決戰','boss',34,['carrier','guard','sniper'],{boss:4,weather:16,challenge:{type:'parts',value:2,label:'擊破左右兩個武器部位'},tip:'核心艦有三個戰鬥階段，混合交錯彈、旋轉彈圈與雷柱。拆塔後集中火力攻擊中央。'})
];
