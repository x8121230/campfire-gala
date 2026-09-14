import {DETECTIVE_CASES,detectiveCase} from './DetectiveCases.js';
export const DETECTIVE_KEY='starlight_detective_v1';
const copy=v=>JSON.parse(JSON.stringify(v));
const add=(list,id)=>{if(!list.includes(id))list.push(id);};
const same=(a,b)=>a.length===b.length&&a.every((id,i)=>id===b[i]);
const pair=(a,b)=>a.length===2&&new Set(a).size===2&&a.every(id=>b.includes(id));
const fail=message=>{throw Error(message);};
export function detectiveState(data={}){
 const old=data[DETECTIVE_KEY];
 if(old===undefined)return {version:1,runs:{},badges:[],active:null};
 if(!old||old.version!==1||!old.runs||typeof old.runs!=='object'||Array.isArray(old.runs)||!Array.isArray(old.badges))fail('偵探存檔格式不相容，已停止寫入，保留原資料。');
 for(const [id,r] of Object.entries(old.runs)){
  const c=detectiveCase(id);
  if(!r||!['evidence','visited','proven','timeline'].every(k=>Array.isArray(r[k]))||!r.hints||typeof r.hints!=='object'||!Number.isInteger(r.seed)||!Number.isInteger(r.best)||r.best<0||r.best>2)fail('案件紀錄不完整，已保留原存檔。');
  if(r.evidence.some(x=>!c.clues.some(e=>e.id===x))||r.visited.some(x=>!c.places.some(p=>p.id===x))||r.proven.some(x=>!c.deductions.some(q=>q.id===x))||r.timeline.length!==c.timeline.length||new Set(r.timeline).size!==c.timeline.length||r.timeline.some(x=>!c.timeline.some(t=>t.id===x)))fail('案件紀錄含無效線索，已停止寫入。');
 }
 return copy(old);
}
export function unlocked(s,c){return !c.hidden||DETECTIVE_CASES.filter(x=>!x.hidden).every(x=>(s.runs[x.id]?.best||0)>0);}
export function ordered(items,seed=1){
 const a=[...items];let x=(seed>>>0)||1;
 for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function freshRun(c,seed=1,best=0){
 let timeline=ordered(c.timeline.map(t=>t.id),seed);
 if(same(timeline,c.timeline.map(t=>t.id)))timeline.push(timeline.shift());
 return {seed:seed>>>0,evidence:[],visited:[],proven:[],timeline,timelineSolved:false,hints:{},best,ending:0,experiments:0};
}
export function caseProgress(c,r){return {evidence:r?.evidence.length||0,total:c.clues.length,proven:r?.proven.length||0,questions:c.deductions.length,best:r?.best||0};}
export function experimentResult(c,values){
 const e=c.experiment;if(!e||!Array.isArray(values)||values.length!==e.controls.length||values.some((v,i)=>!Number.isInteger(v)||v<0||v>=e.controls[i].options.length))fail('請設定有效的實驗條件。');
 const mismatch=values.findIndex((v,i)=>v!==e.solution[i]);
 return {correct:mismatch<0,message:mismatch<0?c.clues.find(x=>x.id===e.output).text:e.failure[mismatch]};
}
export function nextLead(c,r){
 const raw=c.clues.find(e=>e.kind==='物證'&&!r.evidence.includes(e.id));
 if(raw)return {key:'clue_'+raw.id,steps:[`還有現場未查清。看看「${c.places.find(p=>p.id===raw.place).name}」。`,`在該處調查「${raw.name}」，讀清楚實際觀察到的事。`,raw.text]};
 const talk=c.people.find(p=>!r.evidence.includes(p.statement));
 if(talk)return {key:'talk_'+talk.id,steps:[`你還沒聽過${talk.name}的完整說法。`,'到人物頁，選他並聽取證詞。',c.clues.find(e=>e.id===talk.statement).text]};
 const comb=c.combinations.find(x=>!r.evidence.includes(x.output)&&x.inputs.every(id=>r.evidence.includes(id)));
 if(comb)return {key:'combine_'+comb.output,steps:['有兩張線索能互相印證。到證據本試著建立關聯。',`先查看「${c.clues.find(e=>e.id===comb.inputs[0]).name}」。`,`連結「${comb.inputs.map(id=>c.clues.find(e=>e.id===id).name).join('」與「')}」。`]};
 const challenge=c.people.find(p=>p.challenge&&!r.evidence.includes(p.challenge.reveal)&&r.evidence.includes(p.challenge.evidence));
 if(challenge)return {key:'challenge_'+challenge.id,steps:[`${challenge.name}的說法還有追問空間。`,challenge.claim,`向${challenge.name}出示「${c.clues.find(e=>e.id===challenge.challenge.evidence).name}」。`]};
 if(c.experiment&&!r.evidence.includes(c.experiment.output))return {key:'experiment',steps:['去重建台，用現場記錄驗證假設。',c.experiment.description,c.experiment.controls.map((v,i)=>`${v.label}：${v.options[c.experiment.solution[i]]}`).join('；')]};
 const q=c.deductions.find(q=>!r.proven.includes(q.id));
 if(q)return {key:'proof_'+q.id,steps:[q.q,'選結論後，還需要兩份互相支持的證據。',`結論：${q.options[q.answer]}。證據：${q.proofs[0].map(id=>c.clues.find(e=>e.id===id).name).join(' ＋ ')}`]};
 return {key:'timeline',steps:['把事件依先後排好，再到結案頁提交。','時間線每張卡都標了參考證據，點選兩張可交換位置。',c.timeline.map(t=>t.text).join(' → ')]};
}
// All writes derive from the latest complete host save. No registry snapshots or currency changes.
export function updateDetective(data,action){
 const next=copy(data),s=detectiveState(next),c=detectiveCase(action.caseId);
 if(!unlocked(s,c))fail('先完成三個主要案件，才能收到這封邀請。');
 let r=s.runs[c.id];let feedback='',type='info',evidence=null,ending=null;
 if(action.type==='start'||action.type==='restart'){
  if(!r||action.type==='restart')s.runs[c.id]=r=freshRun(c,Number.isInteger(action.seed)?action.seed:1,r?.best||0);
  s.active=c.id;
 }else{
  if(!r)fail('請先接下這個案件。');
  const has=id=>r.evidence.includes(id);
  const receive=id=>{const e=c.clues.find(x=>x.id===id);if(!e)fail('未知線索');const fresh=!has(id);add(r.evidence,id);evidence=e;type=fresh?'evidence':'info';feedback=e.text;};
  if(action.type==='visit'){
   if(!c.places.some(p=>p.id===action.id))fail('未知調查地點');add(r.visited,action.id);
  }else if(action.type==='inspect'){
   const p=c.places.find(p=>p.id===action.place);if(!p||!p.clues.includes(action.id)||!r.visited.includes(p.id))fail('請先進入線索所在的調查地點。');receive(action.id);
  }else if(action.type==='talk'){
   const p=c.people.find(p=>p.id===action.id);if(!p)fail('找不到這位角色');receive(p.statement);
  }else if(action.type==='present'){
   const p=c.people.find(p=>p.id===action.id);if(!p||!has(p.statement))fail('先聽完這位角色的證詞。');
   if(!has(action.evidence))fail('只能出示已取得的證據。');
   if(p.challenge?.evidence===action.evidence){receive(p.challenge.reveal);feedback=p.challenge.reply+'\n\n'+evidence.text;}
   else feedback='這份線索沒有直接回應這句證詞。想一想：它能證明時間、行動，還是動機？';
  }else if(action.type==='combine'){
   if(!Array.isArray(action.ids)||action.ids.length!==2||new Set(action.ids).size!==2||!action.ids.every(has))fail('選擇兩張不同且已取得的線索。');
   const match=c.combinations.find(x=>pair(action.ids,x.inputs));
   if(match)receive(match.output);else feedback='兩張線索目前不足以形成新的推論。試著找同一時間、同一路徑或能互相比對的記錄。';
  }else if(action.type==='experiment'){
   if(!c.experiment||!c.experiment.requires.every(has))fail('先取得重建台需要的現場記錄。');
   const result=experimentResult(c,action.values);r.experiments++;feedback=result.message;
   if(result.correct)receive(c.experiment.output);
  }else if(action.type==='prove'){
   const q=c.deductions.find(x=>x.id===action.id);if(!q)fail('未知推理問題');
   if(!Array.isArray(action.proofs)||!action.proofs.every(has)||action.proofs.length!==2||new Set(action.proofs).size!==2)fail('請附上兩份不同的已知證據。');
   if(action.answer!==q.answer)feedback='這個結論和已知事件仍有衝突。檢查是否把猜測當成觀察，或忽略了事件先後。';
   else if(!q.proofs.some(p=>pair(action.proofs,p)))feedback='方向有道理，但這兩份證據還沒有把關鍵原因說完整。找能直接支持這項結論的兩份記錄。';
   else{add(r.proven,q.id);feedback='推理成立！'+q.why;type='proved';}
  }else if(action.type==='swap'){
   const a=r.timeline.indexOf(action.a),b=r.timeline.indexOf(action.b);if(a<0||b<0)fail('未知事件');
   [r.timeline[a],r.timeline[b]]=[r.timeline[b],r.timeline[a]];r.timelineSolved=false;
  }else if(action.type==='timeline'){
   if(!c.timeline.every(t=>has(t.evidence)))fail('先取得時間線卡片所引用的全部證據。');
   r.timelineSolved=same(r.timeline,c.timeline.map(t=>t.id));feedback=r.timelineSolved?'時間線成立！'+c.timelineWhy:'順序還有矛盾。依據每張事件卡的證據，分清楚原因與後續反應。';type=r.timelineSolved?'proved':'info';
  }else if(action.type==='hint'){
   const lead=nextLead(c,r),n=Math.min(2,r.hints[lead.key]||0);r.hints[lead.key]=n+1;feedback=`星燈提示 ${n+1} / 3\n${lead.steps[n]}`;
  }else if(action.type==='finish'){
   if(!c.deductions.every(q=>r.proven.includes(q.id))||!r.timelineSolved)fail('還需要完成所有推理與時間線，才能提交結案。');
   const full=c.clues.every(e=>has(e.id))&&c.fullRequires.every(has);
   r.ending=full?2:1;r.best=Math.max(r.best,r.ending);add(s.badges,c.id);ending=r.ending;type='ending';feedback=full?c.full:c.normal;
  }else fail('未知的偵探動作');
 }
 next[DETECTIVE_KEY]=s;
 return {data:next,state:s,run:r,feedback,type,evidence,ending};
}
