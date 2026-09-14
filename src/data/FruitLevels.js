import {validateFruitLevel} from './FruitRules.js';
export const FRUIT_CHAPTERS=['果園練習場','藤蔓救援隊','風之連鎖谷','古樹的試煉','樹靈嘉年華'];
const make=(id,title,focus,rows,extra={})=>({id,title,focus,rows,shots:16,par:9,chain:7,ammo:[0,1,2,3,0,2,1,3],goal:{type:'clear'},chapter:Math.floor((id-1)/3),hint:'先找兩顆同色果實，補上第三顆。消掉支點，下面整串都會掉落。',...extra});
export const FRUIT_LEVELS=[
 make(1,'第一串豐收','瞄準與三顆連消',['..RR..YY...','..R...Y...'],{shots:8,par:3,chain:4,ammo:[0,1],hint:'紅心與金陽各有一串。對準相同圖案，三顆以上就能一起收成。'}),
 make(2,'繞個彎採果','牆面反彈',['RR..BB..YY.','R...B...Y.','Y...P...R..','Y...P...R.'],{shots:15,par:7,chain:5,hint:'側邊牆可以反彈；先清下方，或繞到上方支點。虛線會顯示完整飛行路線。'}),
 make(3,'吊橋下的小鳥','切斷支點救援',['..RR..BB...','..R...B...','..Y...P....','..o...o...'],{shots:12,par:5,chain:5,goal:{type:'rescue'},hint:'小鳥不能同色消除。消掉頭上的支點，整串掉落就能救出牠！'}),
 make(4,'纏住的果實','命中解開藤蔓',['RRYYBBPP...','ryybpp....','RYBPP......'],{shots:19,par:10,chain:8,hint:'綠色藤圈需要直接命中一次才能配色。打同色球解鎖，也可能立刻連消。'}),
 make(5,'硬殼裡的祕密','敲殼或繞路',['RRYYBBPP...','R1Y2B3P4..','RRYYBBPP...','..o...o...'],{shots:20,par:11,chain:9,goal:{type:'rescue'},hint:'灰殼的數字是剩餘敲擊次數。也可以拆上方支點，讓硬殼整顆掉落。'}),
 make(6,'松果連環響','引爆相鄰松果',['RRYYBBPPYYR','R*YB*PYY*R','RYYBBPPYYRR','..o...o...'],{shots:15,par:7,chain:14,goal:{type:'rescue'},hint:'直接打松果，或在它旁邊連消，就會引爆周圍一圈；松果也能引爆松果。'}),
 make(7,'花粉調色師','用花粉改變鄰果',['RRBBYYPP...','RB@Y@PP...','RBBYYPP....','..@..@....'],{shots:16,par:9,chain:9,hint:'彩虹花粉被打中後，自己與周圍普通果實會變成射來的顏色。先換球再選顏色。'}),
 make(8,'風從哪裡來','順逆風彈道',['RRYYBBPPYYR','RYYBBPPYYR','R*YB@PYY*RR','..YB..YY..'],{shots:18,par:9,chain:10,wind:[95,-95,0],hint:'風向每球輪換；彈道虛線已計入風力。別只看直線，觀察反彈後的落點。'}),
 make(9,'只採藍晶果','指定顏色目標',['RRYBBYPPYYR','RYB3BYPPYR','RRBBBP*YYRR','...BBo....'],{shots:18,par:10,chain:10,goal:{type:'color',color:2},hint:'這次只要讓藍晶果全部離開果陣。可以連消、引爆，也可以讓藍晶果隨支點掉落。'}),
 make(10,'呼吸的枝葉','上下移動的果陣',['RRYYBBPPYYR','RYYBBPPYYR','RR@BB*PYYRR','..oB..Po..'],{shots:17,par:9,chain:12,motion:10,goal:{type:'rescue'},hint:'整片枝葉會緩緩升降。瞄準線會預測飛行時的果陣位置；看好落點再出手。'}),
 make(11,'左右雙哨站','切換發射位置',['RRYYBBPPYYR','rYYB3PPYYr','RR*BBoP@YRR','YRPB..PBYR','YoP....BoRR'],{shots:22,par:12,chain:12,launchers:[108,420],goal:{type:'rescue'},hint:'按「換發射台」或 Tab，從左或右尋找角度。有些支點從另一側更容易打中。'}),
 make(12,'枝葉向下長','有限回合下降',['RRYYBBPPYYR','RYYB*PPYYR','R@YBB3PYYRR','YRoBPPoBYR','YYBBPPYYRR.'],{shots:22,par:12,chain:14,descendEvery:3,descendBy:13,hint:'每射三球，果陣下降一小段。紅色警戒線是底限；不要只補球，找機會消一大串。'}),
 make(13,'風中大救援','風向與雙發射台',['RRYYBBPPYYR','r1YB*PPY2r','RR@BBoPYYRR','YYPBPPYBYR','YYoBP*YoRR.'],{shots:24,par:13,chain:15,launchers:[108,420],wind:[85,0,-85,0],goal:{type:'rescue'},hint:'先看本球顏色、風向與下一球，再決定從哪側發射。松果旁的硬殼也能被炸開。'}),
 make(14,'暮光大豐收','移動與下降綜合',['RRYYBBPPYYR','R1YB*P3YYR','R@YBBPPY@RR','YYoBPPoBYR','YYBB*PYYRR.'],{shots:24,par:13,chain:16,motion:8,descendEvery:4,descendBy:12,wind:[65,-65],hint:'後段組合挑戰：先處理伸得最低的枝葉，再用花粉和松果整理上層。'}),
 make(15,'喚醒古樹之心','三幕樹靈嘉年華',['RRYYBBPP...'],{shots:34,par:20,chain:14,launchers:[108,420],wind:[0,70,0,-70],motion:6,goal:{type:'rescue'},hint:'三幕共用發射次數，每幕救完小鳥就會換果陣。留下球數，迎接古樹最後的試煉！',waves:[
  {rows:['RRYYBBPPYYR','RYYB*PPYYR','RR@BBPPYYRR','..oB..Po..'],goal:{type:'rescue'}},
  {rows:['RRYYBBPPYYR','r1YB*PPY2r','RR@BBoPYYRR','YYPBPPYBYR','YYoBP*YoRR.'],goal:{type:'rescue'}},
  {rows:['RRYYBBPPYYR','R1YB*P3YYR','R@YBBPPY@RR','YYoBPPoBYR','YYBB*PYYRR.'],goal:{type:'rescue'}}
 ]})
];
FRUIT_LEVELS.forEach(validateFruitLevel);
export function localFruitDate(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function dailyFruitLevel(date=localFruitDate()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Use YYYY-MM-DD');let seed=2166136261;for(const c of date)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const base=FRUIT_LEVELS[[5,7,9,10][seed%4]],l=structuredClone(base),shift=(seed>>>4)%4,mirror=Boolean(seed&256),palette='RYBP',vine='rybp';
 l.rows=l.rows.map((row,r)=>{let s=[...row.padEnd(r%2?10:11,'.')].map(v=>{if(palette.includes(v))return palette[(palette.indexOf(v)+shift)%4];if(vine.includes(v))return vine[(vine.indexOf(v)+shift)%4];if('1234'.includes(v))return String((Number(v)-1+shift)%4+1);return v;}).join('');return mirror?[...s].reverse().join(''):s;});
 l.ammo=l.ammo.map(c=>(c+shift)%4);if(l.goal.color!==undefined)l.goal.color=(l.goal.color+shift)%4;
 if(mirror){l.wind=l.wind?.map(w=>-w);l.launchers=l.launchers?.map(x=>528-x);}
 l.id=`daily-${date}`;l.title='每日果園挑戰';l.date=date;l.daily={seed,template:base.id,colorShift:shift,mirror};l.hint='今天的果陣固定不變。先看目標，再決定換球與發射角度；可以反覆挑戰更好的連鎖。';
 validateFruitLevel(l);return l;
}
