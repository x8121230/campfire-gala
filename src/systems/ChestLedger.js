import {CHEST_GAMES,CHEST_TYPES,CHEST_RATES,CHEST_STATE_KEY,chestTypeFor} from '../data/ChestConfig.js';
import {CHEST_LOOT_POOLS,SHARED_CHEST_LOOT,CHEST_LOOT_WEIGHTS,CONSOLATION_CRYSTALS} from '../data/ChestLootPools.js';
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
 grantForTesting(types){
  const valid=value=>CHEST_TYPES.some(type=>type.id===value)||CHEST_GAMES.some(game=>game.id===value);
  if(!Array.isArray(types)||!types.length||types.some(id=>!valid(id)))throw Error('寶箱種類不正確');
  const d=this.load(),s=d[CHEST_STATE_KEY],rewards=types.map(value=>{const id=`chest-${++s.sequence}`,game=CHEST_GAMES.find(entry=>entry.id===value)?.id||null,chestType=chestTypeFor(value).id;s.queue.push({id,game,chestType,stars:3,createdAt:this.now(),test:true});return {status:'chest',game,chestType,stars:3,chestId:id,reason:'test',batchCount:types.length};});
  this.commit(d);return rewards;
 }
 refillForTesting(){const d=this.load();if(!Number.isFinite(d.max_hearts)||d.max_hearts<1)throw Error('愛心上限不正確');d.hearts=d.max_hearts;d.next_heart_time=null;this.commit(d);return d;}
 pool(game){const all=Object.values(this.items).filter(i=>i.category==='equipment'&&!['secret','starter'].includes(i.source));if(!all.length)throw Error('找不到可掉落裝備，請先安裝衣櫃版本。');return all;}
 itemPool(ids,all){const allowed=new Set(ids);return all.filter(item=>allowed.has(item.id));}
 themedPool(value,all){
  const type=chestTypeFor(value),configured=this.itemPool(CHEST_LOOT_POOLS[type.id]||[],all);
  if(configured.length)return configured;
  const source=CHEST_GAMES.find(g=>g.id===value)?.source,legacy=all.filter(item=>item.source===source);
  return legacy.length?legacy:all;
 }
 sharedPool(all){const shared=this.itemPool(SHARED_CHEST_LOOT,all);return shared.length?shared:all;}
 award(game,run,stars){
  if(!CHEST_GAMES.some(g=>g.id===game)||!run||!Number.isInteger(stars)||stars<1||stars>3)return {status:'ineligible'};
  const d=this.load(),s=d[CHEST_STATE_KEY];if(s.receipts[run])return {...s.receipts[run],duplicate:true};
  const day=new Date(this.now()+8*3600000).toISOString().slice(0,10),g=s.games[game]||{day:'',misses:0};
  // A backward clock must not renew daily rewards.
  const first=day>g.day,pity=g.misses>=3,drop=first||pity||this.random()<CHEST_RATES[stars];
  const result={status:drop?'chest':'miss',game,stars,reason:first?'daily':pity?'pity':'roll',misses:drop?0:g.misses+1};
  if(drop){const id=`chest-${++s.sequence}`,chestType=chestTypeFor(game).id;s.queue.push({id,game,chestType,stars,createdAt:this.now()});result.chestId=id;result.chestType=chestType;}
  s.games[game]={day:first?day:g.day,misses:result.misses};s.receipts[run]=result;
  this.commit(d);return result;
 }
 open(id){
  const d=this.load(),s=d[CHEST_STATE_KEY],index=s.queue.findIndex(c=>c.id===id);
  if(index<0)return {status:'missing'};
  const chest=s.queue[index],type=chestTypeFor(chest.chestType||chest.game),pool=this.pool(chest.game);
  const themed=this.themedPool(type.id,pool),shared=this.sharedPool(pool);
  // Every BOX uses the same transparent odds: 30% themed equipment,
  // 20% shared equipment, 50% one consolation crystal.
  const roll=this.random();let candidates;
  if(roll>=CHEST_LOOT_WEIGHTS.themed+CHEST_LOOT_WEIGHTS.shared){
   const crystals=CONSOLATION_CRYSTALS;
   d.user_crystals=(Number(d.user_crystals)||0)+crystals;s.queue.splice(index,1);s.opened++;
   const result={status:'opened',rewardType:'consolation',chestId:id,game:chest.game,chestType:type.id,itemId:null,isNew:false,isUpgrade:false,crystals,openedAt:this.now()};s.lastResult=result;
   this.commit(d);return result;
  }
  candidates=roll<CHEST_LOOT_WEIGHTS.themed?themed:shared;
  if(!candidates?.length)candidates=pool;
  // Keep the requested 30/20/50 category odds, but avoid repeats inside the
  // selected equipment category until every candidate has been collected.
  const owned=new Set([...(Array.isArray(d.owned_items)?d.owned_items:[]),...(Array.isArray(d.owned_collectibles)?d.owned_collectibles:[])]),unseen=candidates.filter(item=>!owned.has(item.id));
  if(unseen.length)candidates=unseen;
  const item=candidates[Math.min(candidates.length-1,Math.floor(this.random()*candidates.length))];
  const registry={get:k=>d[k],set:(k,v)=>{d[k]=v;}};
  const received=this.receive(registry,item.id);if(!received?.success)throw Error('裝備發放失敗，BOX 仍會保留。');
  s.queue.splice(index,1);s.opened++;const result={status:'opened',rewardType:'equipment',chestId:id,game:chest.game,chestType:type.id,itemId:item.id,isNew:!!received.isNew,isUpgrade:!!received.isUpgrade,previousStep:Number.isInteger(received.previousStep)?received.previousStep:null,upgradeStep:Number.isInteger(received.upgradeStep)?received.upgradeStep:null,crystals:received.type==='crystal'?1:0,openedAt:this.now()};s.lastResult=result;
  this.commit(d);return result;
 }
}
