import {rewardStars} from '../data/ChestConfig.js';
let serial=0;
export function installChestHooks(Scene,{game,method,reset='create',service,notify}){
 const start=Scene.prototype[reset],finish=Scene.prototype[method];
 if(typeof start!=='function'||typeof finish!=='function')throw Error(`寶箱接點不存在：${game}`);
 Scene.prototype[reset]=function(...args){this.chestRunId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${++serial}-${Math.random().toString(36).slice(2)}`;this.chestAwardDone=false;return start.apply(this,args);};
 Scene.prototype[method]=function(...args){
  const result=finish.apply(this,args);
  const stars=rewardStars(game,this,args);
  const eligible=game!=='memory_match'||this.gameEnded===true;
  // Map and test-hub entries share the same ledger and daily/pity counters.
  if(stars>0&&eligible&&!this.chestAwardDone){
   const attempt=()=>{try{const award=service.award(game,this.chestRunId,stars);this.chestAwardDone=true;notify(this,award);}
    catch(error){notify(this,{status:'error',message:error.message,retry:attempt});}};
   attempt();
  }
  return result;
 };
}
