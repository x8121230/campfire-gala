export const SMALL_CREATURE_TYPES = ['mole', 'dew'];
export const MOUSE_VISUAL_SCALE = .7;
export const CREATURE_DEATH_SECONDS = 1.35;
export function lifeFrame(mob) {
  if (!mob.alive) return { row: 2, frame: Math.min(5, Math.floor((mob.deathTime || 0) / .17)) };
  if ((mob.moveSpeed || 0) > 1) return { row: 1, frame: Math.floor((mob.walkDistance || 0) / 8) % 6 };
  const cycle = ((mob.animTime || 0) + mob.id * .31) % 2.6;
  // A calm hold, short blink/leaf sway, then a held resting frame.
  return { row: 0, frame: Math.min(5, Math.floor(cycle / .3)) };
}
export function drawLifeFrame(ctx, atlas, mob, size) {
  const { row, frame } = lifeFrame(mob);
  ctx.drawImage(atlas, frame*320,row*320,320,320,-size/2,-size*300/320,size,size);
}
export function updateSmallCreature(journey, mob, dt, walkable) {
  const homeDistance=Math.hypot(mob.x-mob.homeX,mob.y-mob.homeY);
  const pd=Math.hypot(journey.player.x-mob.x,journey.player.y-mob.y);
  const speed=mob.type==='mole'?34:40;
  let target=null;
  if(mob.aggro&&(pd>480||homeDistance>220)){mob.aggro=false;mob.returning=true;mob.roamTarget=null;}
  if(mob.aggro){
    const range=mob.type==='mole'?205:225;
    if(pd<range&&mob.attack<=0){
      mob.faceLeft=journey.player.x<mob.x;
      mob.attack=mob.type==='mole'?2.8:2.3;
      mob.cast={elapsed:0,duration:mob.type==='mole'?.7:.55};
      journey.effect('sound',{name:mob.type==='mole'?'mudDig':'dewGather'});return;
    }
    if(pd>range*.8)target=journey.player;
    else if(pd<85){const d=pd||1;target={x:mob.x+(mob.x-journey.player.x)/d*40,y:mob.y+(mob.y-journey.player.y)/d*40};}
  }else if(mob.returning){
    if(homeDistance<8){mob.returning=false;mob.roamWait=1.5;}else target={x:mob.homeX,y:mob.homeY};
  }else{
    mob.roamWait=Math.max(0,(mob.roamWait||0)-dt);
    if(!mob.roamTarget&&mob.roamWait<=0){
      for(let k=0;k<12;k++){
        const a=journey.random()*Math.PI*2,r=35+journey.random()*75;
        const p={x:mob.homeX+Math.cos(a)*r,y:mob.homeY+Math.sin(a)*r};
        const clear=Array.from({length:8},(_,i)=>walkable(mob.x+(p.x-mob.x)*(i+1)/8,mob.y+(p.y-mob.y)*(i+1)/8)).every(Boolean);
        if(clear){mob.roamTarget=p;break;}
      }
      mob.roamWait=.8+journey.random()*1.8;
    }
    target=mob.roamTarget;
  }
  if(!target)return;
  const d=Math.hypot(target.x-mob.x,target.y-mob.y);
  if(d<5){mob.roamTarget=null;return;}
  const before={x:mob.x,y:mob.y},step=Math.min(d,speed*(mob.aggro?1.4:1)*dt);
  journey.moveBody(mob,(target.x-mob.x)/d*step,(target.y-mob.y)/d*step);
  const travelled=Math.hypot(mob.x-before.x,mob.y-before.y);
  mob.moveSpeed=dt>0?travelled/dt:0;mob.walkDistance=(mob.walkDistance||0)+travelled;
  if(Math.abs(mob.x-before.x)>.01)mob.faceLeft=mob.x<before.x;
  if(travelled<step*.15){mob.roamTarget=null;mob.roamWait=.7;}
}
