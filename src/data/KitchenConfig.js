export const KITCHEN_FOODS = [
  {id:'tomato',name:'番茄',chop:true}, {id:'carrot',name:'紅蘿蔔',chop:true},
  {id:'mushroom',name:'蘑菇',chop:true}, {id:'egg',name:'雞蛋'},
  {id:'dough',name:'麵糰'}, {id:'honey',name:'蜂蜜'}
];
export const KITCHEN_RECIPES = [
  {id:'salad',name:'田園沙拉',foods:['tomato','carrot'],station:'plate',time:0,price:100},
  {id:'soup',name:'暖心蘑菇湯',foods:['carrot','mushroom'],station:'pot',time:9,price:140},
  {id:'omelet',name:'番茄蛋包',foods:['tomato','egg'],station:'pan',time:7,price:130},
  {id:'flatbread',name:'森林烤餅',foods:['dough','tomato','mushroom'],station:'pan',time:10,price:180},
  {id:'pancake',name:'蜂蜜鬆餅',foods:['dough','egg'],station:'pan',garnish:'honey',time:8,price:160},
  {id:'stew',name:'古樹濃燉湯',foods:['carrot','mushroom','egg'],station:'pot',time:12,price:190}
];
export const KITCHEN_CHEFS = [
  {name:'兔兔',role:'快腳',skill:'全隊快跑',tip:'全隊移動加速 8 秒',speed:340,chop:4},
  {name:'浣浣',role:'快刀',skill:'快刀料理',tip:'完成自己的切菜；切菜中才能用',speed:280,chop:2.6},
  {name:'熊熊',role:'穩火',skill:'暖心保溫',tip:'所有熟食延緩焦糊 10 秒',speed:250,chop:4}
];
export const KITCHEN_DIFFICULTIES = {
  relaxed:{name:'悠閒',time:1.4,patience:1.5,burn:32},
  standard:{name:'熱鬧',time:1,patience:1,burn:22},
  rush:{name:'尖峰',time:.8,patience:.8,burn:15}
};
// Design coordinates: host keeps its existing 1280 × 720 FIT resolution.
// Smallest active target is 88 units (45.8 CSS px at 667 × 375 landscape).
export const KITCHEN_STATIONS = [
  {id:'chop',name:'切菜台',x:165,y:302,w:280,h:140,dock:[165,416]},
  {id:'pan',name:'平底鍋',x:465,y:302,w:280,h:140,dock:[465,416]},
  {id:'pot',name:'湯鍋',x:765,y:302,w:280,h:140,dock:[765,416]},
  {id:'counter',name:'交接台',x:165,y:536,w:280,h:140,dock:[165,438]},
  {id:'plate',name:'裝盤台',x:465,y:536,w:280,h:140,dock:[465,438]},
  {id:'serve',name:'出餐口',x:765,y:536,w:280,h:140,dock:[765,438]}
];
export const KITCHEN_TARGETS = [
  ...KITCHEN_STATIONS,
  ...KITCHEN_FOODS.map((f,i)=>({id:f.id,x:1002+i%2*170,y:286+Math.floor(i/2)*122,w:152,h:112,dock:[905,390+Math.floor(i/2)*22]})),
  ...KITCHEN_CHEFS.map((_,i)=>({id:`chef${i}`,x:148+i*260,y:660,w:244,h:96})),
  {id:'skill',x:913,y:660,w:144,h:96},{id:'trash',x:1073,y:660,w:144,h:96},{id:'book',x:1221,y:660,w:112,h:96},
  {id:'back',x:82,y:46,w:144,h:88},{id:'sound',x:1090,y:46,w:104,h:88},{id:'pause',x:1210,y:46,w:104,h:88},
  ...[0,1,2].map(i=>({id:`order${i}`,x:218+i*422,y:157,w:406,h:122}))
];
export const kitchenRecipe = id => KITCHEN_RECIPES.find(r=>r.id===id);
export const kitchenFood = id => KITCHEN_FOODS.find(f=>f.id===id);
export const kitchenItemName = item => !item?'空手':item.kind==='ingredient'?`${kitchenFood(item.food).name}${item.prepared?'✓':''}`:`${kitchenRecipe(item.recipe).name}${item.kind==='meal'?'（待裝盤）':''}`;
