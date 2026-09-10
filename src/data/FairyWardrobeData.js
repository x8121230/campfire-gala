// Cosmetic-only: futureAbility is descriptive and is never read as a bonus.
const definitions = [
 ['capybara','水豚君橘子頂帽','hat','毛茸茸的睡睡水豚，頭上頂著一顆小橘子。','縮短泥巴造成的緩速時間。'],
 ['nightcap','星光泡泡睡帽','hat','長長的泡泡睡帽，尾端繫著一顆閃亮小星星。','星光泡泡體積增加 20%。'],
 ['lemon','盛夏檸檬草帽','hat','編織寬沿草帽，點綴檸檬切片與白色小花。','蜂蜜糖罐冷卻縮短 2 秒。'],
 ['pinecone','螢光小松果髮夾','hat','耳際的小松果，縫隙透出溫暖的螢光。','探索時提供柔和照明。'],
 ['swan','月冠天鵝絨帽','hat','柔軟純白絨帽，鑲著小小銀色弦月。','水面、冰面移動加速並飄落白羽毛。'],
 ['peach','蜜桃精靈連身裝','cloth','粉白蜜桃連身裝，搭配嫩葉與栗棕內彎髮。','淨化後提高星光幣與愛心掉落率。'],
 ['dandelion','蒲公英絨毛斗篷','cloth','輕盈的蒲公英斗篷，搭配森林冒險服。','蒲公英滑步距離與絨毛範圍增加。'],
 ['acorn','橡果工匠吊帶褲','cloth','口袋裝滿橡果與小工具，準備開始森林手作。','增加耐心值上限。'],
 ['raincoat','大象水車雨衣','fullset','大象耳朵連帽雨衣，配上水藍小雨靴。','大象水車扇形範圍增加 30%。'],
 ['orbit','夜空星軌法袍','cloth','星軌點綴深靛藍法袍，搭配藍紫波浪髮。','靜止 2 秒後短暫隱身。']
];
export const FAIRY_ITEMS = Object.fromEntries(definitions.map(([slug,name,type,desc,futureAbility]) => {
 const id=`item_${type}_fairytale_${slug}`;
 return [id,{id,name,type,desc,futureAbility,effects:{},cosmeticOnly:true,
   category:'equipment',rarity:'base',source:'fairy_wardrobe_v55',status:'ready',
   texture:`wardrobe_${type==='hat'?'hat':'doll'}_${slug}_v55`,
   icon:`wardrobe_${type==='hat'?'icon':'doll'}_${slug}_v55`,integratedHat:slug==='raincoat'}];
}));
export const FAIRY_IDS=Object.keys(FAIRY_ITEMS);
export const FAIRY_FILES=Object.fromEntries(definitions.flatMap(([slug,,type]) => type==='hat'
 ? [[`wardrobe_hat_${slug}_v55`,`assets/wardrobe_v55/hat_${slug}.png`],[`wardrobe_icon_${slug}_v55`,`assets/wardrobe_v55/icon_${slug}.png`]]
 : [[`wardrobe_doll_${slug}_v55`,`assets/wardrobe_v55/doll_${slug}.png`]]));
export const FAIRY_BODIES=Object.fromEntries(Object.values(FAIRY_ITEMS).filter(i=>i.type!=='hat').map(i=>[i.id,i.texture]));
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
