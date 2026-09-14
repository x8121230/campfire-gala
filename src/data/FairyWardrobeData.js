import { inventoryIconKey, WARDROBE_ICON_FILES } from './WardrobeIcons.js';

// Cosmetic-only wardrobe data. futureAbility documents the approved fairy-tale
// design, while effects stays empty until gameplay balance is implemented.
const v55Definitions = [
 ['capybara','水豚君橘子頂帽','hat','毛茸茸的睡睡水豚，頭上頂著一顆小橘子。','縮短泥巴造成的緩速時間。'],
 ['nightcap','星光泡泡睡帽','hat','長長的泡泡睡帽，尾端繫著一顆閃亮小星星。','星光泡泡體積增加 20%。',null,'epic'],
 ['lemon','盛夏檸檬草帽','hat','編織寬沿草帽，點綴檸檬切片與白色小花。','蜂蜜糖罐冷卻縮短 2 秒。'],
 ['pinecone','螢光小松果髮夾','hat','耳際的小松果，縫隙透出溫暖的螢光。','探索時提供柔和照明。'],
 ['swan','月冠天鵝絨帽','hat','柔軟純白絨帽，鑲著小小銀色弦月。','水面、冰面移動加速並飄落白羽毛。'],
 ['peach','蜜桃精靈連身裝','cloth','粉白蜜桃連身裝，搭配嫩葉與栗棕內彎髮。','淨化後提高星光幣與愛心掉落率。'],
 ['dandelion','蒲公英絨毛斗篷','cloth','輕盈的蒲公英斗篷，搭配森林冒險服。','蒲公英滑步距離與絨毛範圍增加。'],
 ['acorn','橡果工匠吊帶褲','cloth','口袋裝滿橡果與小工具，準備開始森林手作。','增加耐心值上限。'],
 ['raincoat','大象水車雨衣','fullset','大象耳朵連帽雨衣，配上水藍小雨靴。','大象水車扇形範圍增加 30%。'],
 ['orbit','夜空星軌法袍','cloth','星軌點綴深靛藍法袍，搭配藍紫波浪髮。','靜止 2 秒後短暫隱身。']
];

const v56Definitions = [
 ['fox','搗蛋狐狸耳罩','hat','毛茸茸的橘色狐狸耳朵耳罩，俏皮緞帶帶出雙馬尾般的活力。','輕巧腳步：基礎移動速度提升 15%，在森林走動不會驚醒睡覺的動物。'],
 ['mushroom','彈跳蘑菇貝雷帽','hat','紅色白點的傾斜蘑菇貝雷帽，像果凍一樣柔軟有彈性。','反彈防護：擋下動物衝撞，不扣耐心值並把對方彈退兩步。'],
 ['bunny','垂耳兔偵探帽','hat','格紋偵探帽垂著兩片長兔耳，跑動時會輕輕上下拍打。','聽力雷達：提示畫面外需要幫助的 NPC 與稀有收集品方向。'],
 ['flower','晨露花冠','hat','發光野花與牽牛花編成的花冠，綴著晶亮晨露與垂落緞帶。','治癒氣息：走過草地會開花；蜂蜜糖罐可呼喚蝴蝶撿取遠處星光幣。'],
 ['antennae','螢火蟲觸角髮箍','hat','黑色髮箍伸出兩根彈簧觸角，黃綠光球會柔和閃爍。','光學共鳴：夜間泡泡自帶微光，淨化動物有機率留下發光孢子。'],
 ['bear','貪睡熊毛絨睡衣','cloth','極度舒適的棕熊連身毛絨睡衣，背後露出圓滾滾的小尾巴。','熊熊力氣：可推動巨大木箱或岩石，開啟隱藏捷徑；移動速度稍慢。'],
 ['sister','妍妍的姐妹洋裝','cloth','印有奶瓶與小碎花的精靈洋裝，和妹妹小精靈的服裝互相呼應。','家庭羈絆：小精靈撿拾範圍加倍，偶爾主動丟迷你星星暈眩動物。'],
 ['squirrel','蓬鬆松鼠連體衣','cloth','帶著巨大蓬鬆尾巴的松鼠連身短褲，手套做成可愛小肉墊。','橡果磁鐵：靠近木材、星光幣或掉落物時會自動吸入口袋。'],
 ['owl','月光貓頭鷹披風','cloth','深藍羽毛披肩像收攏的翅膀，內層藏著月光星空紋路。','月光浮行：蒲公英滑步時微微浮空，穿越泥沼與淺水不受緩速。'],
 ['rainbow','彩虹水滴畫畫衣','cloth','沾滿螢光彩虹顏料的防水畫畫衣，口袋插著兩支魔法水彩筆。','彩虹洗淨：大象水車改噴彩虹顏料水，被淨化的動物掉落雙倍獎勵。']
];

const v57Definitions = [
 ['lily_valley','鈴蘭花瓣層層裙','cloth','裙襬像倒開的白色鈴蘭花，走動時會如波浪輕晃，邊緣帶淡綠漸層。','花香小徑：走過草地會留下短暫的花朵加速路徑，提升跟隨精靈與護送動物的速度。','森林草地、護送任務'],
 ['pitcher_overalls','豬籠草探險吊帶褲','cloth','綠色寬鬆吊帶褲有著深不見底的口袋，腰間繫著藤蔓皮帶。','自動清潔：踩中泡泡泥沼陷阱時，衣服會吃掉泥巴並抵消一次地形緩速。','泡泡泥沼'],
 ['maple_cloak','秋楓精靈飛膜斗篷','cloth','由紅黃漸層楓葉製成的短斗篷，張開雙手時會像飛鼠翼膜般展開。','乘風破浪：風屬性魔法影響範圍增加 20%，可吹散更大面積的毒霧或障礙。','毒霧森林、風力機關區'],
 ['moss_lantern','發光苔蘚燈籠裙','cloth','蓬裙帶有燈籠骨架，裙底長滿在暗處散發幽藍光芒的柔軟苔蘚。','光合作用：在陽光照射區域靜止 3 秒，可快速恢復失去的耐心值。','陽光林地、洞穴入口'],
 ['alice_poker','愛麗絲撲克圍裙洋裝','cloth','水藍洋裝搭配白色荷葉邊圍裙，口袋繡有紅心與黑桃圖案。','驚奇抽卡：每 30 秒隨機獲得普攻變大、跑速提升或一層防護罩。','童話森林、綜合冒險區'],
 ['crystal_rose_gown','睡美人水晶刺繡禮服','cloth','輕盈粉色長禮服的裙襬上，繡著半透明的水晶玫瑰藤蔓。','溫柔反彈：遭暴走動物撞擊時，水晶藤蔓會將牠推開並定身 1 秒。','動物暴走區、頭目區'],
 ['pumpkin_mage','魔法南瓜法師袍','cloth','橘色寬鬆法師袍有南瓜蒂領口與巨大袖口，跑動時像兩把扇子。','南瓜彈射：星光泡泡撞上牆壁或障礙物時可反彈一次，解開轉角射擊謎題。','森林機關、轉角射擊區'],
 ['cloud_tutu','軟綿綿雲朵澎澎裙','cloth','以白色雲朵棉花做成的蓬鬆芭蕾舞裙，讓腳步變得異常輕盈。','無聲踏步：走路沒有聲音，能通過枯葉橋或薄冰而不使其碎裂。','枯葉橋、月亮湖薄冰區'],
 ['clockwork_overalls','古銅齒輪工裝服','cloth','蒸氣龐克風卡其連身工裝，背後裝著一枚緩慢轉動的古銅大齒輪。','動能儲存：跑動距離會累積動能，停下後可一次連續射出 3 發星光泡泡。','森林工坊、戰鬥關卡'],
 ['aviator_jacket','蒸汽飛行員皮夾克','cloth','復古短版皮夾克帶白色羊毛領，背後裝有兩支小型蒸汽噴射管。','蒸汽衝刺：衝刺距離加倍，路徑上的動物會被白色蒸汽短暫弄暈。','寬闊森林、競速區']
];

const v58Definitions = [
 ['dynamo_coil','發電線圈背包服','cloth','背著復古玻璃真空管與銅線圈背包，衣服邊緣會閃過微弱藍色靜電。','靜電磁場：每收集 10 枚星光幣，會產生靜電場吸附遠處的任務道具。','資源採集區、森林機關'],
 ['tin_woodman','錫人金屬拼接鎧甲','cloth','以閃亮鐵罐和金屬板拼接成的輕型圓筒鎧甲，胸口畫著一顆紅心。','絕對防禦：無法使用閃避，但能完全抵擋動物衝撞，不後退也不扣耐心值。','頭目區、動物暴走區'],
 ['chameleon','變色龍迷彩連身衣','cloth','帶鱗片質感的綠色連身短裝，身後有一條會自動捲曲的長尾巴。','環境擬態：貼著樹幹或岩壁移動時會變成半透明，可繞過危險區域。','森林岩壁、頭目區外圍'],
 ['peacock','孔雀開屏華麗舞裙','cloth','平時是優雅綠色長裙，發動能力時背後裙襬會像孔雀般向上開屏。','華麗威嚇：被超過 3 隻動物包圍時自動開屏，將牠們推至安全距離，冷卻 15 秒。','群體戰鬥區'],
 ['penguin_ice','胖企鵝滑冰衣','cloth','黑白相間的圓肚防寒服，腳底藏著一雙可愛的溜冰鞋。','冰上芭蕾：冰上移動不會打滑；衝刺會變成企鵝滑壘並推開擋路冰塊。','月亮湖冰面區'],
 ['lion_vest','小獅王毛絨背心','cloth','領口圍著一整圈向日葵色人造獅毛，穿起來格外神氣。','王者氣場：護送的小動物不再因害怕停下腳步，使護送任務更加順暢。','森林護送任務'],
 ['trex_stomp','暴龍大腳丫連體衣','cloth','綠色恐龍布偶裝搭配超大暴龍腳掌鞋，走起路來充滿份量感。','震撼踐踏：從高低差落地時引發小範圍地鳴，使附近動物短暫跌坐失去行動。','高低差地形、動物群聚區'],
 ['stegosaurus','劍龍骨板防護背包裝','cloth','背後拉鍊背包從頸部延伸到尾椎，長滿粉紅色柔軟防撞骨板。','背後防禦：採集或操作機關時遭背後偷襲，可完全吸收一次攻擊且不中斷動作。','蘋果採集區、森林機關'],
 ['pterodactyl','翼龍滑翔飛翼裝','cloth','手臂與腰部連接輕薄翼膜，跑動張手時就像一隻小翼龍。','乘風滑翔：被彈簧菇或噴氣孔彈起後可控制滑翔方向，飛越寬闊河道。','彈簧菇區、噴氣孔、河道'],
 ['triceratops','三角龍重裝吊帶裙','cloth','厚實卡其皮革吊帶裙，肩膀配有三個圓潤的三角龍角護肩。','堅如磐石：推動巨石、木箱或大雪球時，移動速度不會下降。','推箱機關、雪地與巨石區']
];

const v59Definitions = [
 ['lily_bell','晨霧鈴蘭花帽','hat','倒扣的白色鈴蘭花綴著晶亮晨露，走路時會發出玻璃風鈴般的清脆聲響。','安撫音波：走過的軌跡留下音符記號，氣噗噗的動物踩到後會停下發呆 2 秒。','森林草地、動物暴走區'],
 ['pitcher_hood','貪吃豬籠草頭套','hat','綠色小布袋般的豬籠草頭套，頭頂蓋子會開合，偶爾還會自己嚼兩下。','泥球吞噬：免疫泥巴浣熊與搗蛋青蛙的投擲攻擊，並把泥巴球轉成 1 顆星光幣。','泡泡泥沼、青蛙池塘'],
 ['maple_parasol','巨大楓葉遮陽傘','hat','比角色頭部大兩倍的秋日紅楓葉，以小樹枝輕巧固定在髮際。','緩降：從樹屋或斷崖跳下時楓葉自動撐開，使角色慢慢飄浮並跨越寬闊障礙。','樹屋、斷崖與高低差地形'],
 ['moss_bamboo','魔法發光苔蘚笠','hat','傳統斗笠上長滿柔軟魔法苔蘚，在暗處散發幽幽藍光。','植物同化：在草叢或植物密集區靜止時獲得保護色，使暴走動物失去目標。','草叢、植物密集區'],
 ['alice_teacup','愛麗絲的瘋狂茶杯帽','hat','三個不同花色的陶瓷茶杯堆疊成帽，最上層仍冒著香甜紅茶熱氣。','香甜紅茶：基礎跑速降低；連續 10 秒未撞到障礙物時補滿耐心值。','童話森林、障礙賽道'],
 ['crystal_rose_crown','睡美人水晶玫瑰冠','hat','透明粉色水晶雕刻的玫瑰花冠，周圍纏繞無刺的半透明水晶藤蔓。','水晶睡意：施放蜂蜜糖罐時長出水晶玫瑰，使範圍內動物定身並短暫打瞌睡。','動物暴走區、蜂蜜機關'],
 ['pumpkin_carriage','糖霜南瓜馬車帽','hat','袖珍南瓜馬車模型頂在頭上，糖霜餅乾輪會隨角色跑動轉動。','午夜魔法：夜晚或黑暗洞穴中移動速度提升 25%。','夜晚地圖、黑暗洞穴'],
 ['dream_cloud','夢境雲朵睡帽','hat','柔軟的白雲睡帽不斷灑落細小星星雨，像一場戴在頭上的夢。','溫柔靜電：雲朵偶爾自動戳破阻路的危險陷阱或泥巴泡泡。','陷阱區、泡泡泥沼'],
 ['clockwork_gear','古銅發條齒輪帽','hat','蒸氣龐克皮帽側邊裝有巨大古銅發條，角色移動時會持續轉動。','動能轉化：保持跑動期間，魔法技能冷卻時間以 1.5 倍速縮短。','森林工坊、競速區'],
 ['steam_train','蒸汽噗噗火車頭罩','hat','復古火車頭造型帽，頂部有小煙囪，衝刺時會發出噗噗鳴笛聲。','蒸汽軌跡：位移時留下白色蒸汽，穿過的動物會被遮蔽視線並原地打轉。','衝刺賽道、動物群聚區'],
 ['radar_propeller','偵察雷達螺旋槳帽','hat','飛行員帽頂部的螺旋槳結合旋轉雷達天線，護目鏡映著尋寶微光。','尋寶導航：畫面邊緣顯示箭頭，指向最需要幫助的 NPC 或稀有寶箱。','世界地圖、尋寶區'],
 ['retro_tv','復古電視機頭盔','hat','方形復古小電視頭盔，螢幕會同步顯示角色當下的可愛表情。','情緒探測儀：靠近暴走動物時，螢幕會顯示可一擊淨化牠的弱點道具。','動物暴走區、頭目區'],
 ['chameleon_hood','貪玩變色龍頭套','hat','一隻大眼變色龍趴在頭上，眼珠不停轉動，色彩會隨地圖區域改變。','變色泡泡：星光泡泡隨機變色；若與動物霧氣同色，淨化效果翻倍。','草地、水域與彩色泡泡區'],
 ['peacock_crown','孔雀開屏寶石冠','hat','孔雀羽毛與碧綠寶石構成華麗頭冠，轉身或發動大招時如扇面展開。','極度吸睛：吸引畫面內所有動物靠近，便於集中使用大象水車洗淨。','群體戰鬥區'],
 ['penguin_diving','胖胖企鵝潛水帽','hat','包覆整個頭部的圓潤企鵝頭套，額頭附有一副橘色小蛙鏡。','月亮湖潛行：荷葉間跳躍不打滑，並可進入特定淺水區的隱藏通道。','月亮湖、淺水隱藏區'],
 ['lion_sunflower','小獅王向日葵鬃毛','hat','同時像獅子鬃毛與盛開向日葵的亮黃色頸圈帽，威風又可愛。','太陽威嚴：靠近擋路的小青蛙或小蟲子時，牠們會受驚並自動讓路。','森林小徑、護送任務'],
 ['trex_plush','咬咬暴龍布偶帽','hat','Q 版小暴龍張嘴輕咬角色頭頂，兩隻小短手會隨動作晃動。','假裝很兇：被帽子注視的氣噗噗動物，其衝撞攻擊準備時間延長。','動物衝撞區'],
 ['stegosaurus_explorer','劍龍骨板探險帽','hat','卡其色探險家圓帽，帽頂至後腦排列三片粉紅色柔軟劍龍骨板。','背後防禦術：背對怪物逃跑時可完全吸收一次衝撞；冷卻 15 秒。','採集區、偷襲路段'],
 ['pterodactyl_goggles','飛行翼龍風鏡','hat','護目鏡兩側帶有翼龍小翅膀，奔跑時翅膀會快速拍動。','高空氣流：大幅提升星光泡泡飛行速度，使攻擊更即時精準。','遠距射擊區、飛行關卡'],
 ['triceratops_helmet','堅硬三角龍角盔','hat','具有三根圓潤鈍角與厚實恐龍頸盾的綠色頭盔。','採集大師：以頭盔撞擊果樹或礦石時，木材與星光幣掉落數量固定翻倍。','果樹林、礦石採集區']
];

const v63Definitions = [
 ['starlight_pillow','星眠長抱枕睡衣','cloth','淺藍紫熊熊毛絨睡衣，抱著從左肩延伸到右腳的奶油色長抱枕；單穿時保留完整棕髮與溫柔表情。','柔眠緩衝：長抱枕可減輕正面衝撞並避免跌倒；搭配星光泡泡睡帽時追加 Zzz／打呼外觀演出。','小木屋、護送任務、動物衝撞區','epic']
];

const profileForHat = slug => {
 const night = new Set(['nightcap','swan','antennae','moss_bamboo','dream_cloud','retro_tv','pterodactyl_goggles']);
 const elegant = new Set(['lemon','flower','lily_bell','maple_parasol','alice_teacup','crystal_rose_crown','peacock_crown','lion_sunflower']);
 const explorer = new Set(['fox','bunny','pinecone','pitcher_hood','clockwork_gear','steam_train','radar_propeller','chameleon_hood','stegosaurus_explorer','trex_plush','triceratops_helmet']);
 if (night.has(slug)) return 'night';
 if (elegant.has(slug)) return 'elegant';
 if (explorer.has(slug)) return 'explorer';
 return 'neutral';
};
const EPIC_VISUAL_SLUGS = new Set([
 'nightcap','swan','flower','antennae','orbit','owl','rainbow','moss_lantern',
 'crystal_rose_gown','clockwork_overalls','aviator_jacket','dynamo_coil','peacock',
 'pterodactyl','crystal_rose_crown','dream_cloud','retro_tv','peacock_crown','starlight_pillow'
]);

const buildItems = (definitions, version) => Object.fromEntries(definitions.map(([slug,name,type,desc,futureAbility,recommendedMap,rarity='base']) => {
 if (EPIC_VISUAL_SLUGS.has(slug)) rarity='epic';
 const id=`item_${type}_fairytale_${slug}`;
 return [id,{id,name,type,desc,futureAbility,recommendedMap,effects:{},cosmeticOnly:true,
   category:'equipment',rarity,source:`fairy_wardrobe_v${version}`,status:'ready',wardrobeVersion:version,
   texture:`wardrobe_${type==='hat'?'hat':'doll'}_${slug}_v${version}`,
   icon:type==='hat'?`wardrobe_icon_${slug}_v${version}`:inventoryIconKey(slug),
   iconKind:'object',integratedHat:false,headProfile:type==='hat'?profileForHat(slug):null}];
}));

export const FAIRY_V55_ITEMS = buildItems(v55Definitions, 55);
export const FAIRY_V56_ITEMS = buildItems(v56Definitions, 56);
export const FAIRY_V57_ITEMS = buildItems(v57Definitions, 57);
export const FAIRY_V58_ITEMS = buildItems(v58Definitions, 58);
export const FAIRY_V59_ITEMS = buildItems(v59Definitions, 59);
export const FAIRY_V63_ITEMS = buildItems(v63Definitions, 63);
export const FAIRY_ITEMS = {...FAIRY_V55_ITEMS, ...FAIRY_V56_ITEMS, ...FAIRY_V57_ITEMS, ...FAIRY_V58_ITEMS, ...FAIRY_V59_ITEMS, ...FAIRY_V63_ITEMS};
export const FAIRY_V56_IDS = Object.keys(FAIRY_V56_ITEMS);
export const FAIRY_V57_IDS = Object.keys(FAIRY_V57_ITEMS);
export const FAIRY_V58_IDS = Object.keys(FAIRY_V58_ITEMS);
export const FAIRY_V59_IDS = Object.keys(FAIRY_V59_ITEMS);
export const FAIRY_V63_IDS = Object.keys(FAIRY_V63_ITEMS);
export const FAIRY_IDS = Object.keys(FAIRY_ITEMS);

const filesFor = (definitions, version) => Object.fromEntries(definitions.flatMap(([slug,,type]) => {
 const suffix=version>=57?`_v${version}`:'';
 return type==='hat'
  ? [[`wardrobe_hat_${slug}_v${version}`,`assets/wardrobe_v${version}/hat_${slug}${suffix}.png`],[`wardrobe_icon_${slug}_v${version}`,`assets/wardrobe_v${version}/icon_${slug}${suffix}.png`]]
  : [[`wardrobe_doll_${slug}_v${version}`,`assets/wardrobe_v${version}/doll_${slug}${suffix}.png`]];
}));

export const FAIRY_FILES = {...filesFor(v55Definitions, 55), ...filesFor(v56Definitions, 56), ...filesFor(v57Definitions, 57), ...filesFor(v58Definitions, 58), ...filesFor(v59Definitions, 59), ...filesFor(v63Definitions, 63), ...WARDROBE_ICON_FILES};
export const FAIRY_BODIES = Object.fromEntries(Object.values(FAIRY_ITEMS).filter(i=>i.type!=='hat').map(i=>[i.id,i.texture]));

export function ensureFairyWardrobe(registry) {
 const owned=registry.get('owned_items');
 const items=Array.isArray(owned)?[...owned]:[];
 const added=FAIRY_IDS.filter(id=>!items.includes(id));
 if (!added.length) return false;
 const unread=registry.get('new_items');
 registry.set('owned_items',[...items,...added]);
 registry.set('new_items',[...new Set([...(Array.isArray(unread)?unread:[]),...added])]);
 return true;
}
