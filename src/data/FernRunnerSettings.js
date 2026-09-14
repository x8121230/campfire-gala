// 兩款關卡各自調整；數值單位為像素、秒。修改後重新開啟遊戲即可。
const RUNNER_SETTINGS = {
 mud: {title:'泥地追蹤',subtitle:'沿著小腳印，找到叢林裡的恐龍朋友',node:'巨蕨叢林・右下巨大泥地腳印',goalName:'小腳印',bonusName:'遠古野果',speed:280,gravity:1180,jump:-560,doubleJump:-475,bounce:-640,normalGoal:10,childGoal:5,boostMultiplier:1.42,childBoostMultiplier:1.12,boostSeconds:2.4,segmentGap:400,upperHeight:410},
 sky: {title:'星光雲徑',subtitle:'踏上彈力雲，收集星光點亮天空樹屋',node:'雲端島嶼・風鈴浮島・右下探索點',goalName:'星光碎片',bonusName:'螢火蟲',speed:265,gravity:780,jump:-440,doubleJump:-375,bounce:-610,normalGoal:10,childGoal:5,boostMultiplier:1,childBoostMultiplier:1,boostSeconds:0,segmentGap:420,upperHeight:410}
};

export default RUNNER_SETTINGS;
