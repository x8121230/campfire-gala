import {CHEST_GAMES,CHEST_RATES,CHEST_STATE_KEY} from '../data/ChestConfig.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function migrateChestData(data){
 if(!object(data))throw Error('存檔格式異常，已停止寫入。');
 const d=copy(data),old=d[CHEST_STATE_KEY];
 if(old!==undefined&&(!object(old)||old.version!==1||!Array.isArray(old.queue)||!object(old.games)||!object(old.receipts)))throw Error('寶箱存檔版本不相容，已停止寫入。');
 d[CHEST_STATE_KEY]=old||{version:1,queue:[],games:{},receipts:{},sequence:0,opened:0,lastResult:null};
 return d;
}
export default class ChestLedger {
 constructor({read,write,items,receive,random=Math.random,now=()=>Date.now()}){Object.assign(this,{read,write,items,receive,random,now});}
 load(){return migrateChestData(this.read());}
 commit(data){this.write(data);return data;}
 grantForTesting(games){
  if(!Array.isArray(games)||!games.length||games.some(id=>!CHEST_GAMES.some(g=>g.id===id)))throw Error('寶箱種類不正確');
  const d=this.load(),s=d[CHEST_STATE_KEY],rewards=games.map(game=>{const id=`chest-${++s.sequence}`;s.queue.push({id,game,stars:3,createdAt:this.now(),test:true});return {status:'chest',game,stars:3,chestId:id,reason:'test',batchCount:games.length};});
  this.commit(d);return rewards;
 }
 refillForTesting(){const d=this.load();if(!Number.isFinite(d.max_hearts)||d.max_hearts<1)throw Error('愛心上限不正確');d.hearts=d.max_hearts;d.next_heart_time=null;this.commit(d);return d;}
 pool(game){const all=Object.values(this.items).filter(i=>i.category==='equipment'&&!['secret','starter'].includes(i.source)&&i.rarity!=='base');if(!all.length)throw Error('找不到可掉落裝備，請先安裝衣櫃版本。');return all;}
 award(game,run,stars){
  if(!CHEST_GAMES.some(g=>g.id===game)||!run||!Number.isInteger(stars)||stars<1||stars>3)return {status:'ineligible'};
  const d=this.load(),s=d[CHEST_STATE_KEY];if(s.receipts[run])return {...s.receipts[run],duplicate:true};
  const day=new Date(this.now()+8*3600000).toISOString().slice(0,10),g=s.games[game]||{day:'',misses:0};
  // A backward clock must not renew daily rewards.
  const first=day>g.day,pity=g.misses>=3,drop=first||pity||this.random()<CHEST_RATES[stars];
  const result={status:drop?'chest':'miss',game,stars,reason:first?'daily':pity?'pity':'roll',misses:drop?0:g.misses+1};
  if(drop){const id=`chest-${++s.sequence}`;s.queue.push({id,game,stars,createdAt:this.now()});result.chestId=id;}
  s.games[game]={day:first?day:g.day,misses:result.misses};s.receipts[run]=result;
  this.commit(d);return result;
 }
 open(id){
  const d=this.load(),s=d[CHEST_STATE_KEY],index=s.queue.findIndex(c=>c.id===id);
  if(index<0)return {status:'missing'};
  if(!Number.isFinite(d.hearts)||d.hearts<1)return {status:'no_hearts'};
  const chest=s.queue[index],pool=this.pool(chest.game),owned=new Set([...(d.owned_items||[]),...(d.owned_collectibles||[])]);
  const unseen=pool.filter(i=>!owned.has(i.id)),theme=CHEST_GAMES.find(g=>g.id===chest.game);
  // First three openings prefer unowned equipment, if any remain.
  let candidates=s.opened<3&&unseen.length?unseen:pool;
  const themed=candidates.filter(i=>i.source===theme.source);if(themed.length&&this.random()<.6)candidates=themed;
  const item=candidates[Math.min(candidates.length-1,Math.floor(this.random()*candidates.length))];
  const registry={get:k=>d[k],set:(k,v)=>{d[k]=v;}};
  const received=this.receive(registry,item.id);if(!received?.success)throw Error('裝備發放失敗，寶箱與愛心保留。');
  d.hearts-=1;if(!Number.isFinite(d.next_heart_time)||d.next_heart_time<=0)d.next_heart_time=this.now()+Math.max(1,Number(d.recovery_seconds)||300)*1000;
  s.queue.splice(index,1);s.opened++;const result={status:'opened',chestId:id,game:chest.game,itemId:item.id,isNew:!!received.isNew,isUpgrade:!!received.isUpgrade,crystals:received.type==='crystal'?1:0,openedAt:this.now()};s.lastResult=result;
  this.commit(d);return result;
 }
}
