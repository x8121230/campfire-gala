export const STAR_CRAFTS=[
 // 全機體：移速 ×2；顯示機身縮小 30%；受擊改為標記身體橢圓。尾羽與翼端仍不列入碰撞。
 {id:'swift',boost:0.6,bells:['側翼風羽', '風羽護罩', '音爆共振', '順風巡航'],hurtbox:{rx:32,ry:17},name:'巡天雨燕',role:'平衡型',size:'中型',width:144,anchor:[.665,.65],speed:245,hp:2,radius:4.2,cd:.38,energy:1.15,trait:'雙星風刃',tip:'雙聯光彈・穩健巡航',motion:'月牙壓翼・風羽展開',file:'swift-storybook-v2.png'},
 {id:'falcon',boost:0.8,bells:['穿甲鷹眼', '俯衝整備', '凝光狙擊', '弱點強襲'],hurtbox:{rx:30,ry:14},name:'獵隼',role:'高速精準',size:'小型',width:123,anchor:[.70,.69],speed:380,hp:1,radius:2.8,cd:.48,energy:1,trait:'穿甲俯衝',tip:'遠距穿透光束・小判定',motion:'獵風傾身・俯衝殘影',file:'falcon-storybook-v2.png'},
 {id:'owl',boost:0.5,bells:['廣域羽扇', '環繞護羽', '蓄羽反擊', '夜翼連奏'],hurtbox:{rx:35,ry:30},name:'旋羽貓頭鷹',role:'防守反擊',size:'中大型',width:158,anchor:[.60,.63],speed:230,hp:2,radius:5.6,cd:.6,energy:1.3,trait:'旋羽護盾',tip:'扇形慢速羽刃・護盾反擊',motion:'懸浮拍翼・護羽環繞',file:'owl-storybook-v2.png'},
 {id:'ancient',boost:0.4,bells:['重砲強化', '雙層翼甲', '引力砲核', '熔核重砲'],hurtbox:{rx:45,ry:25},name:'始祖鳥重裝型',role:'重砲控場',size:'大型',width:203,anchor:[.73,.64],speed:170,hp:3,radius:7.7,cd:1.05,energy:.75,trait:'固守重砲',tip:'碎裂加農・低速連射加快裝填',motion:'重裝滑翔・翼甲展開',file:'archaeopteryx-storybook-v2.png'},
 {id:'starwing',boost:0.7,bells:['雙光束增幅', '浮游子機', '多重追蹤彈', '超頻齊射'],hurtbox:{rx:51,ry:17},name:'星翼機巧隼',role:'隱藏・爆發',size:'大型機械',width:179,anchor:[.60,.54],speed:310,hp:2,radius:6.3,cd:.29,energy:.85,trait:'多重鎖定',tip:'鎖定齊射・三次齊射觸發超頻',motion:'浮游翼展開・鎖定齊射',file:'starwing-mechanical-storybook-v2.png'}
];
export const getStarCraft=id=>STAR_CRAFTS.find(c=>c.id===id)||STAR_CRAFTS[0];
