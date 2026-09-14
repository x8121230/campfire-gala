// Additive library adapter: original games keep their isolated documents.
const entries=[
 ['Cloud_Glider_v0_1','雲端滑翔隊','天空'],['Cloud_Shapes_v0_1','雲朵變變變','天空'],
 ['Rainbow_Bridge_v0_1','彩虹橋修理隊','天空'],['Raindrop_Home_v0_1','小雨滴回家','天空'],
 ['Sky_Delivery_v0_1','天空快遞隊','天空'],['Rainbow_Cloud_Pop_v0_1','啵啵彩虹雲朵','天空'],
 ['Star_Constellation_Magic_v0_1','星星連線魔法','天空'],['Owl_Hot_Air_Balloon_v0_1','貓頭鷹的熱氣球','天空'],
 ['Cloud_Chime_Concert_v0_1','雲端風鈴音樂會','天空'],['Sun_Moon_Hide_Seek_v0_1','太陽與月亮捉迷藏','天空'],
 ['Forest_Stair_Adventure_v0_1','森林階梯探險隊','森林'],
 ['AhChen_Volleyball_v1','阿晨晨打排球','其他']
];
const style=document.createElement('style');style.textContent=`
#forestExtraOpen{position:fixed;bottom:8px;left:8px;z-index:9900;border:2px solid #edcb83;border-radius:16px;padding:9px 16px;background:#264d42;color:white;font:bold 15px system-ui;cursor:pointer}
#forestExtra{position:fixed;inset:0;z-index:10000;background:#15372c;color:#fff;display:flex;flex-direction:column;font-family:system-ui}
#forestExtra[hidden]{display:none}#forestExtra header{display:flex;gap:12px;align-items:center;padding:12px;background:#234d40;flex-wrap:wrap}#forestExtra button{padding:10px 16px;background:#ffdf9a;color:#293a30;border:0;border-radius:12px;font:bold 15px system-ui;cursor:pointer}#forestExtra h2{margin:0;font-size:20px}#forestExtra nav{padding:12px;display:flex;gap:12px}#forestExtra section{padding:16px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}#forestExtra .entry{min-height:110px;text-align:left}#forestExtra small{display:block;margin-top:10px;font-weight:400}#forestExtra iframe{flex:1;width:100%;border:0;background:#fff;min-height:0}#forestExtra p{padding:0 16px;color:#d4e7d8}`;document.head.append(style);
const open=document.createElement('button');open.id='forestExtraOpen';open.textContent='天空・下樓梯・排球';document.body.append(open);
const panel=document.createElement('div');panel.id='forestExtra';panel.hidden=true;
panel.innerHTML='<header><button id="extraClose">← 返回主系統</button><button id="extraBack" hidden>← 遊戲列表</button><h2>更多遊戲</h2><a href="./tools/Forest_Asset_Workbench_v0_2/index.html" target="_blank" rel="noopener" style="color:#ffdf9a;margin-left:auto">素材驗收台 ↗</a></header><nav></nav><p>選一款遊戲開始玩吧！</p><section></section>';document.body.append(panel);
const list=panel.querySelector('section'),nav=panel.querySelector('nav'),back=panel.querySelector('#extraBack');let frame=null,paused=[];
function showList(region='全部'){frame?.remove();frame=null;back.hidden=true;nav.hidden=false;panel.querySelector('p').hidden=false;list.hidden=false;list.style.display='grid';list.replaceChildren();for(const [folder,title,area]of entries){if(region!=='全部'&&region!==area)continue;const button=document.createElement('button');button.className='entry';button.textContent=title;const label=document.createElement('small');label.textContent=area+'區域 · 獨立玩法';button.append(label);button.onclick=()=>{list.style.display='none';nav.hidden=true;panel.querySelector('p').hidden=true;back.hidden=false;frame=document.createElement('iframe');frame.title=title;frame.src='./standalone/'+folder+'/index.html';panel.append(frame);};list.append(button);}}
for(const region of ['全部','天空','森林','其他']){const b=document.createElement('button');b.textContent=region;b.onclick=()=>showList(region);nav.append(b);}
open.onclick=()=>{const game=window.forestGame;paused=game?game.scene.getScenes(true).filter(s=>!s.scene.isPaused()).map(s=>s.scene.key):[];for(const key of paused)game.scene.pause(key);game?.sound.pauseAll();panel.hidden=false;showList();};
panel.querySelector('#extraClose').onclick=()=>{frame?.remove();frame=null;panel.hidden=true;for(const key of paused)window.forestGame?.scene.resume(key);window.forestGame?.sound.resumeAll();paused=[];};back.onclick=()=>showList();
