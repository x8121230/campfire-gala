export const DIRS=Object.freeze([
    {id:'N',dx:0,dy:-1,opposite:2},{id:'E',dx:1,dy:0,opposite:3},
    {id:'S',dx:0,dy:1,opposite:0},{id:'W',dx:-1,dy:0,opposite:1}
]);

export const WATERWAY_TYPES=Object.freeze({
    straight:{name:'直水道',ports:[1,3]},corner:{name:'彎水道',ports:[0,1]},
    tee:{name:'三通水道',ports:[0,1,3]},cross:{name:'十字水道',ports:[0,1,2,3]},
    valve:{name:'水閥',ports:[1,3]},pump:{name:'壓力泵',ports:[1,3]},
    filter:{name:'淨化石',ports:[1,3]},ice:{name:'冰晶管',ports:[1,3]},
    reservoir:{name:'儲水池',ports:[0,2,3]}
});

const P=(x,y,type,target,start=(target+1)%4,extra={})=>({x,y,type,target,start,...extra});
const S=(x,y,side,extra={})=>({x,y,side,...extra});

export const WATER_FLOW_LEVELS=Object.freeze([
    {name:'小水滴啟程',guide:'轉動六塊水道，接出第一條真正連通的水路。',cols:4,rows:2,water:4,sources:[S(0,0,3)],sinks:[S(3,0,1,{name:'太陽花'})],pieces:[P(0,0,'straight',0,1),P(1,0,'corner',2,0),P(1,1,'corner',0,2),P(2,1,'straight',0,1),P(3,1,'corner',3,1),P(3,0,'corner',1,3)]},
    {name:'雙花分流',guide:'用三通水道把同一股水送到上下兩座花圃。',cols:4,rows:3,water:4,sources:[S(0,1,3)],sinks:[S(3,0,1,{name:'粉紅花'}),S(3,2,1,{name:'藍鈴花'})],pieces:[P(0,1,'straight',0,1),P(1,1,'tee',3,1),P(1,0,'corner',1,3),P(2,0,'straight',0,1),P(3,0,'straight',0,1),P(1,2,'corner',0,2),P(2,2,'straight',0,1),P(3,2,'straight',0,1)]},
    {name:'不要吵醒蘑菇',guide:'讓水繞過睡覺蘑菇；水碰到牠就要重新配置。',cols:4,rows:3,water:4,hazards:[{x:1,y:1,name:'睡覺蘑菇'}],sources:[S(0,1,3)],sinks:[S(3,1,1,{name:'月光花'})],pieces:[P(0,1,'corner',3,0),P(0,0,'corner',1,2),P(1,0,'straight',0,1),P(2,0,'straight',0,1),P(3,0,'corner',2,0),P(3,1,'corner',0,2),P(1,1,'straight',0,0,{decoy:true})]},
    {name:'水車花園',guide:'水車需要 3 格壓力；讓水先通過壓力泵。',cols:5,rows:2,water:4,sources:[S(0,0,3,{pressure:1})],sinks:[S(4,0,1,{name:'森林水車',pressure:3})],pieces:[P(0,0,'straight',0,1),P(1,0,'corner',2,0),P(1,1,'corner',0,2),P(2,1,'pump',0,1,{power:3}),P(3,1,'straight',0,1),P(4,1,'corner',3,1),P(4,0,'corner',1,3)]},
    {name:'青蛙搗蛋',guide:'完成雙路花園；青蛙會跳來轉動一塊水道一次。',cols:4,rows:3,water:5,frog:true,sources:[S(0,1,3)],sinks:[S(3,0,1,{name:'星星花'}),S(3,2,1,{name:'鈴鐺花'})],pieces:[P(0,1,'straight',0,2),P(1,1,'tee',3,0),P(1,0,'corner',1,0),P(2,0,'straight',0,2),P(3,0,'straight',0,1),P(1,2,'corner',0,1),P(2,2,'straight',0,2),P(3,2,'straight',0,3)]},
    {name:'冰泉輸送',guide:'普通水要先穿過冰晶管，才能澆灌冰晶花。',cols:5,rows:2,water:4,sources:[S(0,0,3)],sinks:[S(4,0,1,{name:'冰晶花',quality:'cold'})],pieces:[P(0,0,'straight',0,1),P(1,0,'corner',2,0),P(1,1,'corner',0,2),P(2,1,'ice',0,1),P(3,1,'straight',0,1),P(4,1,'corner',3,1),P(4,0,'corner',1,3)]},
    {name:'地底污水',guide:'污水不能直接澆花，先讓它通過發光淨化石。',cols:5,rows:2,water:4,sources:[S(0,1,3,{quality:'dirty'})],sinks:[S(4,1,1,{name:'潔白百合',quality:'clean'})],pieces:[P(0,1,'straight',0,1),P(1,1,'filter',0,1),P(2,1,'corner',3,1),P(2,0,'corner',1,3),P(3,0,'straight',0,1),P(4,0,'corner',2,0),P(4,1,'corner',0,2)]},
    {name:'壓力水庫',guide:'開啟水閥，經過壓力泵，再用儲水池分送兩座水車。',cols:5,rows:3,water:4,sources:[S(0,1,3,{pressure:1})],sinks:[S(4,0,1,{name:'上層水車',pressure:3}),S(4,2,1,{name:'下層水車',pressure:3})],pieces:[P(0,1,'valve',0,0,{open:false}),P(1,1,'pump',0,0,{power:3}),P(2,1,'reservoir',0,0),P(2,0,'corner',1,2),P(3,0,'straight',0,1),P(4,0,'straight',0,2),P(2,2,'corner',0,3),P(3,2,'straight',0,1),P(4,2,'straight',0,2)]},
    {name:'暴雨排洪',guide:'時間內打開兩座水閥，讓暴雨從上下排水口流出去。',cols:5,rows:3,water:6,timeLimit:45,storm:true,sources:[S(0,1,3,{pressure:2})],sinks:[S(4,0,1,{name:'上排洪口'}),S(4,2,1,{name:'下排洪口'})],pieces:[P(0,1,'straight',0,1),P(1,1,'tee',3,1),P(1,0,'corner',1,3),P(2,0,'valve',0,0,{open:false}),P(3,0,'straight',0,1),P(4,0,'straight',0,2),P(1,2,'corner',0,2),P(2,2,'valve',0,0,{open:false}),P(3,2,'straight',0,3),P(4,2,'straight',0,2)]},
    {name:'巨大潮汐樹',guide:'淨化污水、提升壓力並分流，讓潮汐樹三冠同時甦醒。',cols:6,rows:4,water:6,timeLimit:60,boss:true,sources:[S(0,2,3,{quality:'dirty',pressure:1})],sinks:[S(5,0,1,{name:'冰晶樹冠',quality:'cold'}),S(5,2,1,{name:'主樹冠',quality:'clean',pressure:3}),S(5,3,1,{name:'低枝樹冠',quality:'clean'})],pieces:[P(0,2,'valve',0,0,{open:false}),P(1,2,'filter',0,1),P(2,2,'pump',0,1,{power:3}),P(3,2,'cross',0,1),P(3,1,'straight',1,0),P(3,0,'corner',1,3),P(4,0,'ice',0,1),P(5,0,'straight',0,2),P(4,2,'straight',0,1),P(5,2,'straight',0,2),P(3,3,'corner',0,2),P(4,3,'straight',0,3),P(5,3,'straight',0,2)]}
]);

export const rotatedPorts=(type,rotation,open=true)=>{if(type==='valve'&&!open)return[];return(WATERWAY_TYPES[type]?.ports||[]).map(p=>(p+rotation)%4).sort();};
const key=(x,y)=>`${x},${y}`;
const endpointAt=(list,x,y,side)=>list.find(v=>v.x===x&&v.y===y&&v.side===side);

export function traceWater(level,rotations,valves={}){
    const map=new Map(level.pieces.map((p,i)=>[key(p.x,p.y),{piece:p,index:i}])),reached=new Map(),visitedTiles=new Set(),leaks=new Set(),danger=new Set(),order=[],queue=[];
    level.sources.forEach((source,i)=>queue.push({x:source.x,y:source.y,incoming:source.side,quality:source.quality||'normal',pressure:source.pressure||2,source:i}));
    const seen=new Set();
    while(queue.length){let state=queue.shift(),entry=map.get(key(state.x,state.y));if(!entry){leaks.add(key(state.x,state.y));continue;}const{piece,index}=entry,open=piece.type!=='valve'||Boolean(valves[index]),ports=rotatedPorts(piece.type,rotations[index]||0,open);if(!ports.includes(state.incoming)){leaks.add(`${state.x},${state.y},${state.incoming}`);continue;}
        if(piece.type==='filter'&&state.quality==='dirty')state={...state,quality:'clean'};if(piece.type==='ice')state={...state,quality:'cold'};if(piece.type==='pump')state={...state,pressure:Math.min(9,state.pressure+(piece.power||2))};const signature=`${state.x},${state.y},${state.incoming},${state.quality},${state.pressure}`;if(seen.has(signature))continue;seen.add(signature);const tileKey=key(state.x,state.y);if(!visitedTiles.has(tileKey))order.push({x:state.x,y:state.y,index,quality:state.quality,pressure:state.pressure});visitedTiles.add(tileKey);if((level.hazards||[]).some(h=>h.x===state.x&&h.y===state.y))danger.add(tileKey);
        for(const side of ports){if(side===state.incoming)continue;const sink=endpointAt(level.sinks,state.x,state.y,side);if(sink){const qualityOk=!sink.quality||sink.quality===state.quality,pressureOk=!sink.pressure||state.pressure>=sink.pressure;reached.set(level.sinks.indexOf(sink),{sink,quality:state.quality,pressure:state.pressure,ok:qualityOk&&pressureOk});continue;}const d=DIRS[side],nx=state.x+d.dx,ny=state.y+d.dy,next=map.get(key(nx,ny));if(!next){leaks.add(`${state.x},${state.y},${side}`);continue;}const nextOpen=next.piece.type!=='valve'||Boolean(valves[next.index]);if(!rotatedPorts(next.piece.type,rotations[next.index]||0,nextOpen).includes(d.opposite)){leaks.add(`${state.x},${state.y},${side}`);continue;}queue.push({...state,x:nx,y:ny,incoming:d.opposite});}
    }
    const sinks=level.sinks.map((_s,i)=>reached.get(i)||null),success=sinks.every(s=>s?.ok)&&danger.size===0&&leaks.size===0;return{success,sinks,order,visited:[...visitedTiles],leaks:[...leaks],danger:[...danger]};
}

export class WaterFlowMazeSession{
    constructor(levelIndex=0){this.levelIndex=levelIndex;this.totalRotations=0;this.tests=0;this.hints=0;this.resets=0;this.totalStars=0;this.load();}
    get level(){return WATER_FLOW_LEVELS[this.levelIndex]??null;}
    load(){const l=this.level;this.rotations=l?.pieces.map(p=>p.start??((p.target+1)%4))||[];this.valves={};l?.pieces.forEach((p,i)=>{if(p.type==='valve')this.valves[i]=Boolean(p.open);});this.complete=false;this.water=l?.water||4;this.levelRotations=0;this.testsThisLevel=0;}
    rotate(index){const p=this.level?.pieces[index];if(this.complete||!p||p.type==='valve')return'ignored';this.rotations[index]=(this.rotations[index]+1)%4;this.totalRotations++;this.levelRotations++;return this.rotations[index]===p.target?'aligned':'rotated';}
    toggleValve(index){const p=this.level?.pieces[index];if(this.complete||p?.type!=='valve')return'ignored';this.valves[index]=!this.valves[index];return this.valves[index]?'opened':'closed';}
    flow(){if(this.complete||this.water<=0)return{result:'ignored',empty:this.water<=0};this.tests++;this.testsThisLevel++;this.water--;const trace=traceWater(this.level,this.rotations,this.valves);if(trace.success){this.complete=true;const stars=this.testsThisLevel===1&&this.levelRotations<=this.level.pieces.length?3:this.testsThisLevel<=2?2:1;this.totalStars+=stars;return{result:'complete',stars,...trace};}return{result:'retry',...trace};}
    hint(){if(this.complete)return-1;this.hints++;const valve=this.level.pieces.findIndex((p,i)=>p.type==='valve'&&!this.valves[i]);if(valve>=0)return valve;return this.level.pieces.findIndex((p,i)=>p.type!=='valve'&&this.rotations[i]!==p.target);}
    reset(){this.resets++;this.load();}
    refill(){if(this.complete)return false;this.water=this.level.water||4;return true;}
    solve(){this.rotations=this.level.pieces.map(p=>p.target);this.level.pieces.forEach((p,i)=>{if(p.type==='valve')this.valves[i]=true;});}
    advance(){if(!this.complete)return false;this.levelIndex++;if(this.level)this.load();return true;}
}
