import {registerSouvenir,souvenirProgress} from './SouvenirProgression.js';
import {SOUVENIR_CATALOG} from './SouvenirBookV322.js';
export function souvenirForEvent(e){
 if(e.kind==='pickup'&&e.name==='香脆橡果')return 'first_acorn';
 if(e.kind==='gather'&&e.name==='晨曦蒲公英')return 'wind_seed_bottle';
 if(e.kind==='souvenirDefeat')return ({dew:'morning_dew_crystal',mole:'garden_shovel_charm',chick:'dandelion_bird_feather',rabbit:'pumpkin_star_medal'})[e.type]||null;
 return null;
}
export function claimSouvenir(state,journey,id){
 const item=SOUVENIR_CATALOG.find(x=>x.id===id);if(!item)return null;
 const before=souvenirProgress(state.souvenirs);if(!registerSouvenir(state,id,item.rarity))return null;
 const after=souvenirProgress(state.souvenirs);Object.assign(journey,after);
 // Level growth never heals, revives or resets combat timers.
 journey.hp=Math.min(Number.isFinite(journey.hp)?journey.hp:0,after.maxHp);
 journey.mana=Math.min(Number.isFinite(journey.mana)?journey.mana:0,after.maxMana);
 return {item,before,after,leveled:after.level>before.level};
}
export class SouvenirRewardToast {
 constructor(host){this.host=host;this.queue=[];this.timer=null;this.node=null;this.disposed=false;}
 show(reward){if(this.disposed)return;this.queue.push(reward);if(!this.node)this.next();}
 next(){if(this.disposed||!this.queue.length)return;const r=this.queue.shift(),i=SOUVENIR_CATALOG.indexOf(r.item);const n=document.createElement('div');this.node=n;
 n.setAttribute('role','status');n.style.cssText='position:absolute;z-index:32;top:24%;left:50%;transform:translateX(-50%);width:min(420px,85%);padding:16px;border:3px solid #bc9854;border-radius:24px;background:#fff3dceF;color:#604830;box-shadow:0 12px 35px #24463866;pointer-events:none;display:flex;align-items:center;gap:14px;font:700 18px/1.5 Microsoft JhengHei,sans-serif';
 const art=document.createElement('span');art.style.cssText=`flex:0 0 88px;width:88px;height:88px;border-radius:18px;background-image:url("${new URL('../../assets/phantom-realm/souvenirs-v322/collection-atlas.png',import.meta.url).href}");background-size:300% 200%;background-position:${i%3*50}% ${Math.floor(i/3)*100}%`;n.append(art);
 const text=document.createElement('div');const title=document.createElement('strong');title.textContent='收藏了！'+r.item.name;title.style.fontSize='21px';text.append(title);const line=document.createElement('div');line.textContent=`${r.item.rarity==='rare'?'稀有 ＋2':'普通 ＋1'} 點 · ${r.after.intoLevel} / ${r.after.needed} 點`;text.append(line);
 if(r.leveled){const lv=document.createElement('div');lv.style.color='#397966';const keys={damage:'傷害',agility:'敏捷',maxHp:'HP 上限',maxMana:'SP 上限'};lv.textContent=`✦ 升到 Lv.${r.after.level}！ `+Object.entries(keys).filter(([k])=>r.after[k]>r.before[k]).map(([k,v])=>`${v} +${r.after[k]-r.before[k]}`).join('・');text.append(lv);}
 n.append(text);this.host.append(n);if(n.animate&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)n.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:320,easing:'ease-out'});
 this.timer=setTimeout(()=>{n.remove();this.node=null;this.timer=null;this.next();},r.leveled?5200:3800);
 }
 dispose(){this.disposed=true;clearTimeout(this.timer);this.node?.remove();this.node=null;this.queue=[];}
}
