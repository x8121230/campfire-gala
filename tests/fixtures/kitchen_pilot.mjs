import {kitchenRecipe,kitchenFood} from '../../src/data/KitchenConfig.js';
// Only public player actions and elapsed frames. No gameplay-state assignment.
export function kitchenPilot(s,{dispatch,step}={}) {
  const actions=[];
  const emit=(kind,value)=>{actions.push([kind,value]);if(dispatch)dispatch(kind,value);else if(kind==='select')s.select(value);else if(kind==='command')s.command(value);else if(kind==='skill')s.skill();else if(kind==='trash')s.trash();};
  const frame=()=>{const last=actions.at(-1);if(last?.[0]==='tick')last[1]++;else actions.push(['tick',1]);if(step)step();else s.tick(.1);};
  const wait=fn=>{let n=0;while(s.status==='playing'&&fn()){frame();if(++n>2000)throw Error('pilot timeout: '+s.message);}};
  const go=id=>{
    const interrupted=s.stations[id]?.frozen||(s.event?.kind==='bee'&&s.event.target===id);
    emit('command',id);wait(()=>s.chefs[s.selected].target||s.chefs[s.selected].job);
    if(interrupted&&s.status==='playing'){emit('command',id);wait(()=>s.chefs[s.selected].target||s.chefs[s.selected].job);}
  };
  let attempts=0;
  while(s.status==='playing'&&attempts++<32){
    if(!s.orders.length){frame();continue;}
    const order=[...s.orders].sort((a,b)=>a.left-b.left)[0],r=kitchenRecipe(order.change?.recipe||order.recipe);
    emit('select',attempts%3);if(s.selected!==1)emit('skill');
    for(const f of r.foods){
      go(f);if(kitchenFood(f).chop)go('chop');go(r.station);
      // An event can steal an ingredient after it was deposited; refill from visible state.
    }
    if(r.station!=='plate'){
      for(const f of r.foods)if(!s.stations[r.station].items.some(i=>i.food===f)){go(f);if(kitchenFood(f).chop)go('chop');go(r.station);}
      go(r.station);wait(()=>s.stations[r.station].state==='cooking');go(r.station);go('plate');
    }
    if(r.garnish){go(r.garnish);go('plate');}
    go('plate');go('serve');
    if(s.chefs[s.selected].held)emit('trash');
  }
  return {id:s.level.id,difficulty:s.difficulty,status:s.status,time:Math.round(s.time*10)/10,stats:s.stats,stars:s.medals().filter(Boolean).length,actions};
}
