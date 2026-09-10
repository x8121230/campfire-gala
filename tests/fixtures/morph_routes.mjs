import {MORPH_DT,moverAt} from '../../src/data/MorphRules.js';
export const MORPH_ROUTES=[
 [['walk',430],['walk',550],['jump',760],['walk',870,1],['jump',1000,1],['walk',1220],['jump',1440],['walk',1810]],
 [['walk',760],['walk',820,1],['jump',960,1],['walk',1140],['wait',.1,2],['walk',2010,0]],
 [['walk',425,1],['dash',610],['walk',820,1],['jumpDash',1120],['walk',1425,1],['dash',1600],['walk',2110]],
 [['walk',360],['spring',670],['walk',775],['jump',980,1],['walk',2110]],
 [['walk',820,2],['wait',.55],['walk',2310,0]],
 [['walk',565],['waitM',0,'x'],['jump',750],['rideX',980],['jump',1190],['walk',1520,1],['jump',1660,1],['walk',2210]],
 [['walk',590,2],['walk',720,1],['jump',920,1],['walk',1020,0],['jump',1260,0],['walk',2410]],
 [['walk',590,1],['dash',760],['walk',920,1],['jump',1060,1],['walk',1410,1],['dash',1580],['walk',1825,1],['dash',2030],['walk',2310]],
 [['walk',685,2],['wait',.55],['walk',1450,0],['walk',1575,1],['dash',1770],['walk',1785,1],['jump',1940,1],['walk',2510]],
 [['walk',585],['waitM',0,'y'],['jump',715],['rideY',380],['jump',1010,1],['walk',1240],['jump',1510,1],['walk',2410]],
 [['walk',390],['spring',760],['walk',1220,0],['jump',1490,0],['walk',1990,1],['dash',2160],['walk',2305,1],['dash',2510],['walk',2710]],
 [['walk',830],['walk',880,1],['dash',1100],['walk',1255,2],['wait',.55],['walk',1610,0],['jumpDash',1930],['walk',2025,1],['dash',2220],['walk',2330,0],['spring',2700],['walk',3210]]
];
export function executeMorphRouteCommand(s,c){
 const [type,value,form]=c;if(type==='waitM'){for(let n=0;n<800;n++){const m=moverAt(s.level.movers[value],s.time);if(form==='x'?m.x<650:m.y>510)return;s.advance(MORPH_DT,{});}throw Error('wait mover timed out');}if(form!==undefined)s.setForm(form);if(type==='dash'||type==='jumpDash')s.setForm(1);
 if(type==='wait'){for(let t=0;t<value;t+=MORPH_DT)s.advance(MORPH_DT,{});return;}
 const start=s.time;let tick=0;
 while(!s.finished&&s.time-start<14){
  const p=s.player;let done=false,axis=0,jump=false,dash=false;
  if(type==='rideX')done=p.x>=value;
  else if(type==='rideY')done=p.y<=value&&p.grounded;
  else{const diff=value-p.x;axis=Math.abs(diff)<6?0:Math.sign(diff);done=Math.abs(diff)<6&&(type==='walk'||type==='dash'||p.grounded);jump=(type==='jump'||type==='jumpDash')&&tick<90;dash=(type==='dash'||type==='jumpDash')&&tick===0;}
  if(done)return;
  s.advance(MORPH_DT,{left:axis<0,right:axis>0,jump,dash});tick++;
 }
 if(!s.finished)throw Error('timeout '+JSON.stringify(c)+' x='+s.player.x.toFixed(1)+' y='+s.player.y.toFixed(1));
}
