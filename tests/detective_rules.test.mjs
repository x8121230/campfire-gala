import test from 'node:test';
import assert from 'node:assert/strict';
import {DETECTIVE_CASES,detectiveCase} from '../src/data/DetectiveCases.js';
import {DETECTIVE_KEY,detectiveState,updateDetective,experimentResult,nextLead,ordered} from '../src/data/DetectiveRules.js';
const host=()=>({hearts:4,user_crystals:91,reputation:67,inventory:['hat'],starlight_lake_v1:{version:1,seals:['cave'],collectibles:['moonstone']},future_system:{keep:true}});
function player(id,data=host()){
 let current=data;const c=detectiveCase(id);
 const api={c,get data(){return current;},get run(){return detectiveState(current).runs[id];},act(type,fields={}){const r=updateDetective(current,{caseId:id,type,...fields});current=r.data;return r;}};
 api.act('start',{seed:20260910});return api;
}
export function investigate(p,skip=[]){
 for(const place of p.c.places){p.act('visit',{id:place.id});for(const id of place.clues)if(!skip.includes(id))p.act('inspect',{place:place.id,id});}
 for(const actor of p.c.people)if(!skip.includes(actor.statement))p.act('talk',{id:actor.id});
 for(let i=0;i<5;i++){
  const has=id=>p.run.evidence.includes(id);
  for(const combo of p.c.combinations)if(!skip.includes(combo.output)&&combo.inputs.every(has))p.act('combine',{ids:combo.inputs});
  if(p.c.experiment&&p.c.experiment.requires.every(has)&&!skip.includes(p.c.experiment.output))p.act('experiment',{values:p.c.experiment.solution});
  for(const actor of p.c.people)if(actor.challenge&&has(actor.statement)&&has(actor.challenge.evidence)&&!skip.includes(actor.challenge.reveal))p.act('present',{id:actor.id,evidence:actor.challenge.evidence});
 }
}
export function solve(p){
 for(const q of p.c.deductions)p.act('prove',{id:q.id,answer:q.answer,proofs:q.proofs[0]});
 p.c.timeline.forEach((t,i)=>{const a=p.run.timeline[i];if(a!==t.id)p.act('swap',{a,b:t.id});});
 p.act('timeline');return p.act('finish');
}
test('case schema has valid unique clues and all causal references resolve',()=>{
 for(const c of DETECTIVE_CASES){
  const ids=c.clues.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
  const refs=[...c.places.flatMap(p=>p.clues),...c.people.flatMap(p=>[p.statement,...(p.challenge?[p.challenge.evidence,p.challenge.reveal]:[])]),...c.combinations.flatMap(x=>[...x.inputs,x.output]),...c.deductions.flatMap(x=>x.proofs.flat()),...c.timeline.map(x=>x.evidence),...c.fullRequires,...(c.experiment?[...c.experiment.requires,c.experiment.output]:[])];
  for(const id of refs)assert(ids.includes(id),`${c.id} invalid ${id}`);
  for(const q of c.deductions){assert(q.answer>=0&&q.answer<q.options.length);for(const pair of q.proofs)assert.equal(new Set(pair).size,2);}
  if(!c.hidden){assert.equal(c.places.length,6);assert.equal(c.people.length,4);assert.equal(c.deductions.length,3);}
 }
});
for(const c of DETECTIVE_CASES.filter(c=>!c.hidden)){
 test(`${c.id}: complete investigation is reachable through legal actions; full ending and idempotent badge`,()=>{
  const p=player(c.id),original=host();investigate(p);assert.equal(p.run.evidence.length,c.clues.length);
  const r=solve(p);assert.equal(r.ending,2);assert.equal(p.run.best,2);
  p.act('finish');assert.deepEqual(detectiveState(p.data).badges,[c.id]);
  for(const k of Object.keys(original))assert.deepEqual(p.data[k],original[k]);
  const before=p.data;const resumed=player(c.id,JSON.parse(JSON.stringify(before)));assert.deepEqual(resumed.run,p.run);
  p.act('restart',{seed:3});assert.equal(p.run.evidence.length,0);assert.equal(p.run.best,2);assert.deepEqual(detectiveState(p.data).badges,[c.id]);
 });
 test(`${c.id}: ordinary ending can be improved by investigating remaining evidence`,()=>{
  const skip=c.id==='moonfish'?['feather','delivery','alibi','care']:c.id==='midnight'?['bird_s','log']:['correction','bird_s','lock'];
  const p=player(c.id);investigate(p,skip);assert.equal(solve(p).ending,1);
  investigate(p);assert.equal(p.act('finish').ending,2);assert.equal(p.run.best,2);
 });
 test(`${c.id}: every incorrect experimental condition has a distinct observation; cannot experiment before prerequisites`,()=>{
  const p=player(c.id);assert.throws(()=>p.act('experiment',{values:c.experiment.solution}),/現場記錄/);
  c.experiment.controls.forEach((ctrl,i)=>{for(let j=0;j<ctrl.options.length;j++){
   const settings=[...c.experiment.solution];settings[i]=j;const r=experimentResult(c,settings);assert.equal(r.correct,j===c.experiment.solution[i]);assert(r.message.length>10);
  }});
 });
}
test('missing evidence, unsupported proofs, unrelated pairs and contradictions cannot bypass investigation',()=>{
 const p=player('moonfish');assert.throws(()=>p.act('finish'),/完成/);assert.throws(()=>p.act('inspect',{place:'pier',id:'seal'}),/進入/);
 assert.throws(()=>p.act('present',{id:'otter',evidence:'tank'}),/先聽/);assert.throws(()=>p.act('combine',{ids:['gate','weed']}),/選擇/);
 p.act('visit',{id:'pier'});p.act('inspect',{place:'pier',id:'seal'});p.act('inspect',{place:'pier',id:'tracks'});
 assert.equal(p.act('combine',{ids:['seal','tracks']}).evidence,null);
 const q=p.c.deductions[0];assert.equal(p.act('prove',{id:q.id,answer:q.answer,proofs:['seal','tracks']}).type,'info');assert.equal(p.run.proven.length,0);
 assert.throws(()=>p.act('prove',{id:q.id,answer:q.answer,proofs:['seal','seal']}),/不同/);
 investigate(p);assert.equal(p.act('prove',{id:q.id,answer:0,proofs:q.proofs[0]}).type,'info');assert.equal(p.run.proven.length,0);
 const before=p.run.evidence.length;assert.equal(p.act('present',{id:'bird',evidence:'tracks'}).evidence,null);assert.equal(p.run.evidence.length,before);
});
test('timeline validates prerequisites and order, and any later swap invalidates a previously verified sequence',()=>{
 const p=player('moonfish');assert.throws(()=>p.act('timeline'),/全部證據/);investigate(p);
 assert.equal(p.act('timeline').type,'info');solve(p);
 p.act('swap',{a:p.c.timeline[0].id,b:p.c.timeline[1].id});assert.equal(p.run.timelineSolved,false);assert.throws(()=>p.act('finish'),/完成/);
});
test('hints are gradual, capped at three per lead, survive resume, and never award evidence',()=>{
 const p=player('moonfish');const lead=nextLead(p.c,p.run);assert.equal(lead.key,'clue_tracks');
 for(let n=0;n<5;n++){const r=p.act('hint');assert(r.feedback.includes(`${Math.min(n+1,3)} / 3`));}
 assert.equal(p.run.evidence.length,0);assert.equal(p.run.hints[lead.key],3);assert.equal(player('moonfish',p.data).run.hints[lead.key],3);
});
test('three solved cases unlock a playable epilogue; each contributes one permanent badge',()=>{
 assert.throws(()=>player('lantern'),/三個/);let data=host();
 for(const c of DETECTIVE_CASES.filter(c=>!c.hidden)){const p=player(c.id,data);investigate(p);solve(p);data=p.data;}
 const p=player('lantern',data);investigate(p);assert.equal(solve(p).ending,2);assert.equal(detectiveState(p.data).badges.length,4);
});
test('save compatibility rejects malformed data without mutating the source',()=>{
 for(const old of [null,{version:2},{version:1,runs:[],badges:[]},{version:1,runs:{moonfish:{}},badges:[]}]){
  const data={...host(),[DETECTIVE_KEY]:old},before=JSON.stringify(data);assert.throws(()=>updateDetective(data,{type:'start',caseId:'moonfish'}));assert.equal(JSON.stringify(data),before);
 }
 const p=player('moonfish');const data=JSON.parse(JSON.stringify(p.data));data[DETECTIVE_KEY].runs.moonfish.timeline=['unknown'];assert.throws(()=>detectiveState(data));
});
test('replay shuffles presentation reproducibly while preserving the underlying case truth',()=>{
 const items=[1,2,3,4,5,6];assert.deepEqual(ordered(items,123),ordered(items,123));assert.notDeepEqual(ordered(items,123),ordered(items,567));assert.deepEqual(items,[1,2,3,4,5,6]);
 const c=detectiveCase('moonfish'),truth=JSON.stringify(c);const p=player(c.id);investigate(p);solve(p);p.act('restart',{seed:894});assert.equal(JSON.stringify(c),truth);
});
