import {StarJourney,SPOTS,APPLES,MUSHROOMS,distance} from '../realm/StarForestRules.js';
export const PAPER_SAVE='forest_paper_forest_ch1_v1';
export class PaperJourney extends StarJourney {
 constructor(saved){super(saved);this.musicContacts=new Set();this.musicCount=0;}
 update(dt,axis={x:0,y:0},attacking=false){
  // The same map, enemies and spell balance as the 3D version; escort pace is gentler.
  const pace=(this.escort?3.25/5.1:1)/Math.max(1,Math.hypot(axis.x,axis.y));
  const moved=super.update(dt,{x:axis.x*pace,y:axis.y*pace},attacking);
  if(this.appleQuest)APPLES.forEach((p,i)=>{if(!this.apples.includes(i)&&distance(this.player,p)<1.45){this.apples.push(i);this.dirty=true;this.effect('sparkle',p,1.2);this.say(`陽光蘋果 ${this.apples.length}/5 · 輕輕摘好了！`,'correct');}});
  MUSHROOMS.forEach(([x,z,size],i)=>{const d=distance(this.player,{x,z});if(d>size+1.3)this.musicContacts.delete(i);if(d<size+.35&&!this.musicContacts.has(i)){this.musicContacts.add(i);this.musicCount++;this.effect('music',{x,z},1.1,{note:i%3});}});
  return moved;
 }
 nextGoal(){
  if(!this.accepted)return {...SPOTS.owl,label:'走近村長 · 自動對話'};
  if(this.escort)return {...SPOTS.nest,label:'帶小鴨慢慢回家'};
  if(this.calm.length===8&&this.apples.length===5&&!this.finished)return {...SPOTS.owl,label:'回村交任務'};
  if(!this.finished){
   const candidates=this.animals.filter(a=>a.anger>0).map(a=>({...a,label:'幫動物找回好脾氣'}));
   APPLES.forEach((p,i)=>{if(!this.apples.includes(i))candidates.push({...p,label:'走近採摘陽光蘋果'});});
   return candidates.sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0]||null;
  }
  if(!this.escortDone)return {...SPOTS.ducks,label:'還有小鴨等你幫忙'};
  return {...SPOTS.event,label:'金橡果風鈴 · 自由挑戰'};
 }
}
