// Pure route/cargo rules. No timers, Phaser, network or formal save writes.
const clone = s => ({...s, parcels:[...s.parcels], age:[...s.age]});
export function compileCourierLevel(spec) {
    const l=JSON.parse(JSON.stringify(spec));
    if(!Array.isArray(l.nodes)||l.nodes.length<2||l.nodes.length>9)throw Error('Invalid nodes');
    if(!Number.isInteger(l.start)||!l.nodes[l.start]||!Number.isInteger(l.capacity)||l.capacity<1||l.capacity>5)throw Error('Invalid start/capacity');
    if(!Array.isArray(l.parcels)||!l.parcels.length||l.parcels.length>4)throw Error('Invalid parcels');
    l.initialGates=l.initialGates??0;l.gateCount=l.gateCount??0;
    if(!Number.isInteger(l.gateCount)||l.gateCount<0||l.gateCount>2||!Number.isInteger(l.initialGates)||l.initialGates<0||l.initialGates>=(1<<l.gateCount))throw Error('Invalid gates');
    const pairs=new Set();l.adj=l.nodes.map(()=>[]);
    l.nodes.forEach(n=>{if(!n.name||!Number.isFinite(n.x)||!Number.isFinite(n.y))throw Error('Invalid node');if(n.switch!==undefined&&(!Number.isInteger(n.switch)||n.switch<0||n.switch>=l.gateCount))throw Error('Invalid switch');});
    if(!Array.isArray(l.edges)||!l.edges.length)throw Error('Invalid edges');
    l.edges.forEach((e,i)=>{
        if(!Number.isInteger(e.a)||!Number.isInteger(e.b)||!l.nodes[e.a]||!l.nodes[e.b]||e.a===e.b||!Number.isInteger(e.cost)||e.cost<1||e.cost>9)throw Error('Invalid edge');
        const key=[e.a,e.b].sort((a,b)=>a-b).join(':');if(pairs.has(key))throw Error('Duplicate edge');pairs.add(key);
        if(e.maxLoad!==undefined&&(!Number.isInteger(e.maxLoad)||e.maxLoad<0||e.maxLoad>5))throw Error('Invalid load limit');
        if(e.gate!==undefined&&(!Number.isInteger(e.gate)||e.gate<0||e.gate>=l.gateCount))throw Error('Invalid edge gate');
        if(e.permit!==undefined&&(!Number.isInteger(e.permit)||!l.parcels[e.permit]))throw Error('Invalid permit');
        l.adj[e.a].push({to:e.b,edge:i});l.adj[e.b].push({to:e.a,edge:i});
    });
    l.parcels.forEach((p,i)=>{
        if(!p.name||!Number.isInteger(p.from)||!Number.isInteger(p.to)||!l.nodes[p.from]||!l.nodes[p.to]||p.from===p.to||!Number.isInteger(p.weight)||p.weight<1||p.weight>l.capacity)throw Error('Invalid parcel');
        p.requires=p.requires??[];
        if(!Array.isArray(p.requires)||new Set(p.requires).size!==p.requires.length||p.requires.some(r=>!Number.isInteger(r)||!l.parcels[r]||r===i))throw Error('Invalid prerequisite');
        if(p.fresh!==undefined&&(!Number.isInteger(p.fresh)||p.fresh<1||p.fresh>30))throw Error('Invalid freshness');
    });
    const visiting=new Set(),done=new Set();function visit(i){if(visiting.has(i))throw Error('Cyclic prerequisite');if(done.has(i))return;visiting.add(i);l.parcels[i].requires.forEach(visit);visiting.delete(i);done.add(i);}l.parcels.forEach((_,i)=>visit(i));
    return l;
}
export function initialCourierState(l){return {pos:l.start,parcels:l.parcels.map(()=>0),age:l.parcels.map(()=>0),gates:l.initialGates,distance:0,actions:0,failed:false};}
export function cargoWeight(l,s){return l.parcels.reduce((n,p,i)=>n+(s.parcels[i]===1?p.weight:0),0);}
export function courierComplete(l,s){return !s.failed&&s.parcels.every(v=>v===2)&&(!l.returnHome||s.pos===l.start);}
export function edgeBlock(l,s,e){
    if(e.gate!==undefined&&!(s.gates&(1<<e.gate)))return '橋還沒放下，先到扳手站開橋。';
    if(e.permit!==undefined&&s.parcels[e.permit]!==2)return `先送完 ${String.fromCharCode(65+e.permit)}「${l.parcels[e.permit].name}」，這條路才會開放。`;
    if(e.maxLoad!==undefined&&cargoWeight(l,s)>e.maxLoad)return `這條窄路限重 ${e.maxLoad} 格，目前載重 ${cargoWeight(l,s)} 格。`;
    return '';
}
export function courierStep(l,state,action){
    const no=reason=>({ok:false,reason,state});
    if(state.failed)return no('鮮貨已超過保鮮路程，請撤回或重來。');
    if(courierComplete(l,state))return no('這份委託已完成。');
    const s=clone(state);let note='';
    if(action.type==='move'){
        const link=l.adj[s.pos].find(a=>a.to===action.to);if(!link)return no('請點有道路相連的下一站。');
        const e=l.edges[link.edge],blocked=edgeBlock(l,s,e);if(blocked)return no(blocked);
        s.pos=action.to;s.distance+=e.cost;
        l.parcels.forEach((p,i)=>{if(s.parcels[i]===1&&p.fresh!==undefined){s.age[i]+=e.cost;if(s.age[i]>p.fresh)s.failed=true;}});
        if(s.failed)note='鮮貨走太遠了！按撤回，重新安排配送順序。';
        else{
            const delivered=[];l.parcels.forEach((p,i)=>{if(s.parcels[i]===1&&p.to===s.pos){s.parcels[i]=2;s.age[i]=0;delivered.push(String.fromCharCode(65+i));}});
            note=delivered.length?`${delivered.join('、')} 包裹送達！${s.parcels.every(v=>v===2)&&l.returnHome?'現在返回出發站收工。':''}`:`抵達${l.nodes[s.pos].name}。看看這裡有沒有要領的包裹。`;
        }
    }else if(action.type==='load'){
        const i=action.parcel,p=l.parcels[i];if(!p||s.parcels[i]!==0||p.from!==s.pos)return no('要先到這件包裹的取貨站。');
        if(p.requires.some(r=>s.parcels[r]!==2))return no(`先送完 ${p.requires.map(r=>String.fromCharCode(65+r)).join('、')}，才能領這件包裹。`);
        if(cargoWeight(l,s)+p.weight>l.capacity)return no(`背包只有 ${l.capacity} 格，這件需要 ${p.weight} 格。先送出一些貨吧。`);
        s.parcels[i]=1;note=`已裝上 ${String.fromCharCode(65+i)}「${p.name}」。`;
    }else if(action.type==='unload'){
        const i=action.parcel,p=l.parcels[i];if(!p||s.parcels[i]!==1||p.from!==s.pos)return no('只能在原取貨站放回包裹。');
        s.parcels[i]=0;note='包裹放回原站；已消耗的保鮮路程不會重置。';
    }else if(action.type==='toggle'){
        const gate=l.nodes[s.pos].switch;if(gate===undefined)return no('這裡沒有橋樑扳手。');
        s.gates^=1<<gate;note=s.gates&(1<<gate)?'橋放下了，可以通過。':'橋收起來了。';
    }else return no('未知操作。');
    s.actions++;return {ok:true,state:s,reason:note};
}
export function courierActions(l,s){
    if(s.failed||courierComplete(l,s))return [];
    const a=l.adj[s.pos].map(e=>({type:'move',to:e.to}));
    l.parcels.forEach((p,i)=>{if(p.from===s.pos&&s.parcels[i]!==2)a.push({type:s.parcels[i]===0?'load':'unload',parcel:i});});
    if(l.nodes[s.pos].switch!==undefined)a.push({type:'toggle'});
    return a.filter(x=>courierStep(l,s,x).ok);
}
export class CourierSession{
    constructor(level){this.level=level;this.state=initialCourierState(level);this.history=[];this.hintsUsed=0;}
    act(action){const r=courierStep(this.level,this.state,action);if(r.ok){this.history.push(clone(this.state));this.state=r.state;}return r;}
    undo(){if(!this.history.length)return false;this.state=this.history.pop();return true;}
    medals(){const done=courierComplete(this.level,this.state);return [done,done&&this.state.distance<=this.level.par,done&&this.hintsUsed===0];}
}
// Incremental Dijkstra search. Positive travel cost; zero-distance load/toggle
// cycles are bounded by the complete cargo/age/gate state key.
const stateKey=s=>`${s.pos}|${s.gates}|${s.parcels.join('')}|${s.age.join(',')}`;
class Heap{
    constructor(){this.a=[];}
    push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].cost<=v.cost)break;a[i]=a[p];i=p;}a[i]=v;}
    pop(){const a=this.a,first=a[0],v=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=v.cost)break;a[i]=a[c];i=c;}a[i]=v;}return first;}
}
export function createCourierSolver(l,start=initialCourierState(l),maxStates=180000){
    const heap=new Heap(),best=new Map(),root={state:clone(start),cost:0,parent:null,action:null};heap.push(root);best.set(stateKey(start),0);
    const job={status:'searching',checked:0,solution:null,cost:null,
        tick(budget=80){
            if(this.status!=='searching')return this.status;
            for(let n=0;n<budget;n++){
                if(!heap.a.length){this.status='unsolvable';break;}
                const cur=heap.pop();if(cur.cost!==best.get(stateKey(cur.state))){n--;continue;}
                this.checked++;
                if(courierComplete(l,cur.state)){
                    this.cost=cur.cost;this.solution=[];let p=cur;while(p.parent){this.solution.push(p.action);p=p.parent;}this.solution.reverse();this.status='solved';break;
                }
                if(this.checked>=maxStates){this.status='limit';break;}
                for(const action of courierActions(l,cur.state)){
                    const r=courierStep(l,cur.state,action);if(r.state.failed)continue;
                    const cost=r.state.distance-start.distance,key=stateKey(r.state);
                    if(best.has(key)&&best.get(key)<=cost)continue;best.set(key,cost);heap.push({state:r.state,cost,parent:cur,action});
                }
            }return this.status;
        }
    };return job;
}
export function describeCourierAction(l,a){if(!a)return '所有貨都送好了。';if(a.type==='move')return `下一步可以前往「${l.nodes[a.to].name}」。`;if(a.type==='toggle')return '試著操作目前站點的橋樑扳手。';return `${a.type==='load'?'裝上':'放回'} ${String.fromCharCode(65+a.parcel)}「${l.parcels[a.parcel].name}」。`;}
