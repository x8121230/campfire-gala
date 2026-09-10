import {KITCHEN_CHEFS,KITCHEN_DIFFICULTIES,KITCHEN_STATIONS,KITCHEN_TARGETS,kitchenFood,kitchenRecipe} from './KitchenConfig.js';

const same = (a,b) => a.length===b.length && a.every(x=>b.includes(x));
export class KitchenSession {
  constructor(level,{difficulty='standard',seed=12345}={}) {
    this.level=level;this.difficulty=KITCHEN_DIFFICULTIES[difficulty]?difficulty:'standard';this.settings=KITCHEN_DIFFICULTIES[this.difficulty];this.seed=seed>>>0;
    this.time=0;this.remaining=level.duration*this.settings.time;this.paused=false;this.status='playing';this.selected=0;
    this.chefs=KITCHEN_CHEFS.map((_,i)=>({x:160+i*300,y:424,held:null,target:null,job:null,cooldown:0}));
    this.stations=Object.fromEntries(KITCHEN_STATIONS.map(s=>[s.id,{items:[],state:'idle',worker:null,frozen:false,progress:0,total:0,recipe:null,ready:0,safe:this.settings.burn}]));
    this.orders=[];this.orderId=0;this.orderCursor=0;this.spawnWait=0;this.phase=0;this.eventAt=24;this.eventCount=0;this.event=null;
    this.buff={speed:0,warm:0,party:0};this.stats={served:0,expired:0,waste:0,score:0,bestCombo:0,swats:0,thaws:0,variety:[]};this.combo=0;this.message='點訂單看食譜，切換隊員分工！';this.messageTime=6;
    this.addOrder();this.addOrder();
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  notice(text){this.message=text;this.messageTime=4;return false;}
  setPaused(v){this.paused=!!v;}
  active(){return !this.paused&&this.status==='playing';}
  select(i){if(this.active()&&this.chefs[i])this.selected=i;}
  command(target,index=this.selected){
    if(!this.active()||!this.chefs[index]||!KITCHEN_TARGETS.some(t=>t.id===target&&t.dock))return false;
    const c=this.chefs[index];if(c.job)return this.notice('隊員正在工作，可先切換其他隊員。');
    c.target=target;return true;
  }
  skill(){
    if(!this.active())return false;const c=this.chefs[this.selected];if(c.cooldown>0)return this.notice('絕招還在準備中。');
    if(this.selected===0)this.buff.speed=8;
    else if(this.selected===1){if(c.job?.kind!=='chop')return this.notice('浣浣開始切菜後，再使用快刀！');c.job.left=0;}
    else this.buff.warm=10;
    c.cooldown=24;this.notice(`${KITCHEN_CHEFS[this.selected].skill}！`);return true;
  }
  trash(){if(!this.active())return false;const c=this.chefs[this.selected];if(c.job)return this.notice('請先等隊員完成工作。');if(!c.held)return false;c.held=null;c.target=null;this.waste();return true;}
  waste(){this.stats.waste++;this.combo=0;}
  clearStation(id){
    if(!this.active()||!['pan','pot','plate','counter'].includes(id))return false;
    const s=this.stations[id],c=this.chefs[this.selected];
    if(s.worker!==null||c.job)return this.notice('工作進行中，現在不能清台。');
    if(!s.items.length&&s.state==='idle')return false;
    this.resetStation(id);this.waste();this.notice('已清空工作台，可以重新備料。');return true;
  }
  resetStation(id){const s=this.stations[id];Object.assign(s,{items:[],state:'idle',worker:null,progress:0,total:0,recipe:null,ready:0,safe:this.settings.burn});}
  addOrder(){
    if(this.orders.length>=3)return;
    if(this.level.waves&&this.stats.served+this.orders.length>=(this.phase+1)*3)return;
    const choices=this.level.waves?.[this.phase]||this.level.recipes;
    // Cycle guarantees variety; random rotation changes which recipe starts each phase.
    if(this.orderCursor===0)this.orderOffset=Math.floor(this.random()*choices.length);
    const recipe=choices[(this.orderCursor+++(this.orderOffset||0))%choices.length];
    const patience=this.level.patience*this.settings.patience;
    this.orders.push({id:++this.orderId,recipe,left:patience,total:patience,old:null,grace:0,change:null});
  }
  compatible(station,items){return this.recipesFor(station).some(r=>items.every(f=>r.foods.includes(f))&&new Set(items).size===items.length);}
  recipesFor(station){return ['salad','soup','omelet','flatbread','pancake','stew'].map(kitchenRecipe).filter(r=>r.station===station);}
  job(index,station,kind,seconds){const c=this.chefs[index],s=this.stations[station];s.worker=index;c.job={station,kind,left:seconds,total:seconds};}
  interact(index,id){
    const c=this.chefs[index],food=kitchenFood(id),s=this.stations[id];
    if(food){if(c.held)return this.notice('手上有東西：先放交接台、入鍋或裝盤。');c.held={kind:'ingredient',food:id,prepared:!food.chop};return true;}
    if(!s)return false;
    if(s.worker!==null)return this.notice('工作台有人使用，請換一台或稍等。');
    if(this.event?.kind==='bee'&&this.event.target===id){this.event=null;this.stats.swats++;this.notice('蜜蜂飛走了，食材保住！');return true;}
    if(s.frozen){this.job(index,id,'thaw',index===2?1.4:2.8);return true;}
    if(id==='chop'){
      if(c.held?.kind!=='ingredient'||c.held.prepared)return this.notice('拿生的番茄、紅蘿蔔或蘑菇來切。');
      this.job(index,id,'chop',KITCHEN_CHEFS[index].chop);return true;
    }
    if(id==='counter'){
      if(c.held){if(s.items.length>=2)return this.notice('交接台滿了，最多放兩份。');s.items.push(c.held);c.held=null;}
      else if(s.items.length)c.held=s.items.shift();else return this.notice('交接台可放兩份食材或餐點。');return true;
    }
    if(id==='serve')return this.serve(c);
    if(id==='plate')return this.plate(index);
    if(s.state==='burnt'){this.job(index,id,'clean',2.5);return true;}
    if(s.state==='ready'){
      if(c.held)return this.notice('空手才能起鍋，先把手上物品放到交接台。');
      c.held={kind:'meal',recipe:s.recipe,quality:s.ready<s.safe*.65?1:.75};this.resetStation(id);return true;
    }
    if(s.state==='cooking')return this.notice('正在料理，可以先準備另一張訂單。');
    if(c.held){
      if(c.held.kind!=='ingredient'||!c.held.prepared)return this.notice('食材需先切好；熟食請送裝盤台。');
      if(!this.compatible(id,[...s.items.map(v=>v.food),c.held.food]))return this.notice('這個組合不合食譜，點訂單確認。');
      s.items.push(c.held);c.held=null;return true;
    }
    const recipe=this.recipesFor(id).find(r=>same(r.foods,s.items.map(v=>v.food)));
    if(!recipe)return this.notice('食材還沒齊，點訂單查看食譜。');
    s.recipe=recipe.id;s.state='cooking';s.total=recipe.time;s.progress=0;s.safe=this.settings.burn+(index===2?8:0);this.notice(`${recipe.name}開火！可切換隊員繼續備料。`);return true;
  }
  plate(index){
    const c=this.chefs[index],s=this.stations.plate;
    if(c.held?.kind==='meal'){
      if(s.items.length)return this.notice('裝盤台有食物，先完成或清台。');
      s.items.push(c.held);s.recipe=c.held.recipe;c.held=null;return true;
    }
    if(c.held){
      if(c.held.kind!=='ingredient'||!c.held.prepared)return this.notice('裝盤需要切好的菜或已煮好的餐點。');
      if(s.recipe){
        const r=kitchenRecipe(s.recipe);if(c.held.food!==r.garnish||s.items.length!==1)return this.notice('這道菜不需要這項配料。');
      }else if(!this.compatible('plate',[...s.items.map(v=>v.food),c.held.food]))return this.notice('裝盤台可組沙拉；其他食材要先下鍋。');
      s.items.push(c.held);c.held=null;return true;
    }
    let recipe=s.recipe?kitchenRecipe(s.recipe):this.recipesFor('plate').find(r=>same(r.foods,s.items.map(v=>v.food)));
    if(!recipe)return this.notice('先放入兩種切好的菜，或煮好的餐點。');
    if(recipe.garnish&&!s.items.some(v=>v.food===recipe.garnish))return this.notice('鬆餅還要淋蜂蜜！拿蜂蜜點裝盤台。');
    s.recipe=recipe.id;this.job(index,'plate','plate',1.1);return true;
  }
  serve(c){
    if(c.held?.kind!=='dish')return this.notice('餐點需要先到裝盤台裝盤。');
    const candidates=this.orders.filter(o=>o.recipe===c.held.recipe||(o.old===c.held.recipe&&o.grace>0)).sort((a,b)=>a.left-b.left);
    const order=candidates[0];if(!order)return this.notice('目前沒有這道餐點的訂單，先放交接台等候。');
    this.stats.served++;this.combo++;this.stats.bestCombo=Math.max(this.combo,this.stats.bestCombo);
    if(!this.stats.variety.includes(c.held.recipe))this.stats.variety.push(c.held.recipe);
    this.stats.score+=Math.round(kitchenRecipe(c.held.recipe).price*c.held.quality*(1+Math.min(this.combo-1,5)*.12)*(order.left>order.total*.5?1.2:1));
    c.held=null;this.orders.splice(this.orders.indexOf(order),1);this.spawnWait=Math.min(this.spawnWait,1.8);
    if(this.combo%3===0){this.buff.party=10;this.notice('森林派對！全隊工作與爐火加速 10 秒！');}else this.notice(`成功出餐！連續 ${this.combo} 份`);
    const phase=Math.min(2,Math.floor(this.stats.served/3));if(this.level.waves&&phase!==this.phase){this.phase=phase;this.orderCursor=0;this.notice(`宴會第 ${phase+1} 幕！新菜單登場，舊訂單仍可完成。`);}
    if(this.stats.served>=this.level.goal){this.status='won';this.chefs.forEach(v=>v.target=null);}
    return true;
  }
  startEvent(){
    this.eventCount++;const kind=this.level.event;
    if(kind==='bee'){
      const candidates=['counter','pan','pot','plate'].filter(id=>{const s=this.stations[id];return s.worker===null&&s.state==='idle'&&s.items.some(v=>v.kind==='ingredient');});
      if(candidates.length){this.event={kind,target:candidates[Math.floor(this.random()*candidates.length)],left:7};this.notice('蜜蜂盯上食材！點亮起的工作台趕蜂。');}
    }else if(kind==='freeze'){
      const candidates=['chop','pan','pot','plate'].filter(id=>{const s=this.stations[id];return s.worker===null&&!s.frozen&&s.state==='idle';});
      if(candidates.length){const target=candidates[Math.floor(this.random()*candidates.length)];this.stations[target].frozen=true;this.notice('雪花把工作台凍住了！點它派隊員解凍。');}
    }else if(kind==='change'){
      const o=this.orders.find(v=>!v.changed&&!v.change&&v.grace<=0&&v.left>25);
      if(o){const options=this.level.recipes.filter(r=>r!==o.recipe);o.changed=true;o.change={recipe:options[Math.floor(this.random()*options.length)],left:6};this.notice('客人想改單！預告 6 秒，舊餐點仍有寬限。');}
    }else {this.event={kind,left:kind==='power'?7:kind==='flood'?12:10};this.notice({power:'停電 7 秒！先切菜裝盤，鍋子不會焦。',flood:'河水漫上中央通道！隊員走慢了。',rush:'早餐尖峰！新客人來了，完成連單開派對！'}[kind]);if(kind==='rush')this.addOrder();}
  }
  tick(dt){
    if(!this.active()||!Number.isFinite(dt)||dt<=0)return;
    // Clamp long frame gaps; hidden tabs are paused by the scene too.
    dt=Math.min(dt,.1);this.time+=dt;this.remaining=Math.max(0,this.remaining-dt);this.messageTime-=dt;
    for(const k of Object.keys(this.buff))this.buff[k]=Math.max(0,this.buff[k]-dt);
    const party=this.buff.party>0?1.4:1;
    for(let i=0;i<this.chefs.length;i++){
      const c=this.chefs[i];c.cooldown=Math.max(0,c.cooldown-dt);
      if(c.job){const j=c.job;j.left-=dt*party;
        if(j.left<=0){const s=this.stations[j.station];
          if(j.kind==='chop'&&c.held)c.held.prepared=true;
          if(j.kind==='thaw'){s.frozen=false;this.stats.thaws++;this.notice('解凍完成，再點工作台就能使用。');}
          if(j.kind==='plate'){c.held={kind:'dish',recipe:s.recipe,quality:s.items[0]?.quality??1};this.resetStation('plate');}
          if(j.kind==='clean')this.resetStation(j.station);
          s.worker=null;c.job=null;
        }
      }else if(c.target){
        const target=KITCHEN_TARGETS.find(v=>v.id===c.target),[x,y]=target.dock,dist=Math.hypot(x-c.x,y-c.y);
        const flooded=this.event?.kind==='flood'&&c.x>300&&c.x<700;
        const step=KITCHEN_CHEFS[i].speed*dt*(this.buff.speed>0?1.65:1)*party*(flooded?.45:1);
        if(dist<=step){c.x=x;c.y=y;const id=c.target;c.target=null;this.interact(i,id);}else{c.x+=(x-c.x)/dist*step;c.y+=(y-c.y)/dist*step;}
      }
    }
    if(this.status!=='playing')return;
    for(const id of ['pan','pot']){const s=this.stations[id];if(this.event?.kind==='power')continue;
      if(s.state==='cooking'){s.progress+=dt*party;if(s.progress>=s.total){s.state='ready';s.ready=0;this.notice(`${kitchenRecipe(s.recipe).name}好了！空手點鍋起鍋。`);}}
      else if(s.state==='ready'&&this.buff.warm<=0){s.ready+=dt;if(s.ready>=s.safe){s.state='burnt';s.items=[];this.waste();this.notice('鍋子焦了！點鍋清洗，就能重新料理。');}}
    }
    for(const o of [...this.orders]){
      o.left-=dt;o.grace=Math.max(0,o.grace-dt);
      if(o.change){o.change.left-=dt;if(o.change.left<=0){o.old=o.recipe;o.recipe=o.change.recipe;o.grace=12;o.left=Math.max(o.left,80*this.settings.patience);o.total=Math.max(o.total,o.left);o.change=null;}}
      if(o.left<=0){this.orders.splice(this.orders.indexOf(o),1);this.stats.expired++;this.combo=0;this.notice('客人先離開了，整理節奏迎接下一位。');}
    }
    this.spawnWait-=dt;if(this.spawnWait<=0){this.addOrder();this.spawnWait=this.orders.length<3?3:16;}
    if(this.event){this.event.left-=dt;if(this.event.left<=0){if(this.event.kind==='bee'){const s=this.stations[this.event.target];if(s.worker===null&&s.state==='idle'){const i=s.items.findIndex(v=>v.kind==='ingredient');if(i>=0){s.items.splice(i,1);this.waste();this.notice('蜜蜂偷走一份食材，可以重新補上。');}}}this.event=null;}}
    if(this.time>=this.eventAt){this.eventAt+=28;this.startEvent();}
    if(this.remaining<=0&&this.status==='playing')this.status='lost';
  }
  medals(){return [this.status==='won',this.status==='won'&&this.stats.expired<=1&&this.stats.waste<=1,this.status==='won'&&this.stats.bestCombo>=this.level.goal&&this.stats.variety.length>=2];}
}
