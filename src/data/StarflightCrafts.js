export const STAR_CRAFTS=[
 // 全機體：移速 ×2；機身與核心判定縮小 30%。尾羽與翼端仍不列入碰撞。
 {id:'swift',name:'巡天雨燕',role:'平衡型',size:'中型',width:144,anchor:[.665,.65],speed:245,hp:3,radius:4.2,cd:.38,energy:1.15,trait:'雙星風刃',tip:'雙聯光彈・穩健巡航',motion:'月牙壓翼・風羽展開',file:'swift-storybook-v2.png'},
 {id:'falcon',name:'獵隼',role:'高速精準',size:'小型',width:123,anchor:[.70,.69],speed:380,hp:2,radius:2.8,cd:.48,energy:1,trait:'穿甲俯衝',tip:'高速貫穿光束・小判定',motion:'獵風傾身・俯衝殘影',file:'falcon-storybook-v2.png'},
 {id:'owl',name:'旋羽貓頭鷹',role:'防守反擊',size:'中大型',width:158,anchor:[.60,.63],speed:230,hp:4,radius:5.6,cd:.6,energy:1.3,trait:'旋羽護盾',tip:'扇形慢速羽刃・護盾反擊',motion:'懸浮拍翼・護羽環繞',file:'owl-storybook-v2.png'},
 {id:'ancient',name:'始祖鳥重裝型',role:'重砲控場',size:'大型',width:203,anchor:[.73,.64],speed:170,hp:6,radius:7.7,cd:1.05,energy:.75,trait:'固守重砲',tip:'碎裂加農・移動具有慣性',motion:'重裝滑翔・翼甲展開',file:'archaeopteryx-storybook-v2.png'},
 {id:'starwing',name:'星翼機巧隼',role:'隱藏・爆發',size:'大型機械',width:179,anchor:[.60,.54],speed:310,hp:3,radius:6.3,cd:.29,energy:.85,trait:'多重鎖定',tip:'雙聯光束・四目標追蹤齊射',motion:'浮游翼展開・鎖定齊射',file:'starwing-mechanical-storybook-v2.png'}
];
export const getStarCraft=id=>STAR_CRAFTS.find(c=>c.id===id)||STAR_CRAFTS[0];
