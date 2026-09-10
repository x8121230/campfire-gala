export const KITCHEN_LEVELS = [
  {id:1,title:'林間早餐車',tag:'暖身開張',recipes:['salad','omelet'],goal:4,duration:330,patience:125,event:'rush',color:0x66865c,tip:'先切菜，再放到鍋子或裝盤台。備料齊全後，空手點一下才會開火／裝盤。'},
  {id:2,title:'河上漂流餐廳',tag:'濕地慢行',recipes:['salad','soup','omelet'],goal:5,duration:390,patience:130,event:'flood',color:0x477e91,tip:'河水每隔一陣子漫上中央通道，移動變慢。先分配隊員到左右兩側，或用兔兔快跑！'},
  {id:3,title:'蜂蜜慶典',tag:'蜜蜂來搗蛋',recipes:['pancake','flatbread','salad'],goal:6,duration:440,patience:145,event:'bee',color:0xa48042,tip:'蜜蜂盯上交接台或尚未開火的食材！看到黃色警告，點該工作台派隊員趕蜂。'},
  {id:4,title:'雪山熱湯屋',tag:'工作台結冰',recipes:['soup','stew','omelet'],goal:6,duration:440,patience:145,event:'freeze',color:0x6d93a3,tip:'工作台可能結冰。點一下派隊員解凍，完成後再點一次使用；熊熊解凍比較快。'},
  {id:5,title:'魔法夜市',tag:'客人想改單',recipes:['salad','soup','omelet','flatbread','pancake'],goal:7,duration:500,patience:155,event:'change',color:0x826fa0,tip:'改單會先預告 6 秒，變更後還有 12 秒接受舊餐點。新舊食譜都能在訂單詳情查看。'},
  {id:6,title:'古樹國王宴',tag:'三幕宴會',recipes:['salad','omelet'],waves:[['salad','omelet'],['soup','pancake'],['flatbread','stew']],goal:9,duration:620,patience:155,event:'power',color:0x5b7d6a,tip:'每送出 3 份進入下一幕，舊訂單保留。停電時爐火與焦糊計時一起停止，趁空檔切菜、裝盤。'}
];
