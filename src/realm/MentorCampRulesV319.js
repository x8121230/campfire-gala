import {RealmJourney as BaseJourney,SPOTS as BASE_SPOTS} from './RealmRules.js';
export * from './RealmRules.js';
export const SPOTS=Object.freeze({...BASE_SPOTS,bronc:Object.freeze({...BASE_SPOTS.bronc,name:'冒險導師・布隆克'})});
const retell=s=>String(s||'').replaceAll('裁縫師布隆克','冒險導師布隆克').replaceAll('裁縫師・布隆克','冒險導師・布隆克').replaceAll('裁縫鋪','冒險工房').replace('他已為你準備好第一件冒險衣。','他會教你第一個技能「斬擊」。');
export class RealmJourney extends BaseJourney {
 constructor(saved){super(saved);this.apples=0;this.robe=false;this.moveMultiplier=1;}
 move(dt,axis,run=false){
  const duration=Math.max(0,Math.min(.05,Number(dt)||0)),factor=this.moveMultiplier||1;
  if(factor===1)return super.move(duration,axis,run);
  const time=this.time,steps=Math.max(1,Math.ceil(duration*factor/.04));let moved=false;
  for(let i=0;i<steps;i++)moved=super.move(duration*factor/steps,axis,run)||moved;
  this.time=time+duration;this.currentMoveSpeed*=factor;return moved;
 }
 act(id){
  if(id==='bronc'){
   if(this.nearby()!==id)return{message:'再靠近一點，就能互動。'};
   if(this.stage<2)return{title:SPOTS.bronc.name,message:'先完成長老交代的晨露清洗，我會在這裡等你，教你把星光化成斬擊。'};
   if(this.stage===2){this.stage=3;return{changed:true,win:true,title:'學會技能・斬擊',message:'讓星光在身前凝成一把劍，再由上往前揮下！你學會了「斬擊」（SP 0）。帶上甜蘋果 3 顆，放入快捷欄就能在受傷時自動回復 1 HP。北門開放了！',reward:'mentorSlash'};}
   return{title:SPOTS.bronc.name,message:'斬擊不消耗 SP，收勢結束前要站穩。蘋果放在快捷欄就會在缺少至少 1 HP 時自動使用。'};
  }
  const result=super.act(id);if(result.title)result.title=retell(result.title);if(result.message)result.message=retell(result.message);return result;
 }
 objective(){return retell(super.objective());}
}
