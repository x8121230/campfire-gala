import {TRANSIT_ENEMY_KIND} from '../data/StarflightTransit.js';

export function drawTransitEnemy(scene,g,e,live){
 if(e.kind!==TRANSIT_ENEMY_KIND)return false;
 const id='transit-'+e.id;let v=scene.views.get(id);
 if(!v){v=scene.add.container(e.x,e.y);scene.entities.add(v);scene.views.set(id,v);
  const bird=scene.add.image(0,-12,'star_courier122',0).setDisplaySize(118,118);
  v.add(bird);v.setData('bird',bird);
 }
 live.add(id);const bird=v.getData('bird');const frame=Math.floor(e.age*8)%4;bird.setFrame(frame).setOrigin([.34,.30,.30,.32][frame],[.65,.65,.48,.52][frame]);bird.setTint(e.flash>0?0xffedbc:0xffffff);v.setPosition(e.x,e.y).setRotation(Math.sin(e.age*3)*.045);
 g.fillStyle(0x203b52,.82).fillRoundedRect(e.x-42,e.y-76,84,6,3);g.fillStyle(0xffdc7b).fillRoundedRect(e.x-42,e.y-76,84*Math.max(0,e.hp/e.maxHp),6,3);
 return true;
}

export function drawTransitWorld(scene,g){
 const s=scene.session;if(!s.inTransit)return;
 const info=s.phaseInfo,q=Math.min(1,info.elapsed/10),pulse=.52+Math.sin(s.time*5)*.22;
 g.fillStyle(0x11152f,.07+Math.sin(q*Math.PI)*.14).fillRect(0,0,1280,480);
 for(let i=0;i<22;i++){const x=((i*113-s.time*(135+i%4*40))%1420+1420)%1420-90,y=28+(i*61)%424,size=2+i%3;
  g.fillStyle(i%3===0?0xffe6a1:i%2?0xb8efff:0xe5c8ff,.25+pulse*.25).fillCircle(x,y,size);g.lineStyle(1+i%2,i%2?0xb5e7ff:0xf1d2ff,.16+pulse*.14).lineBetween(x-size*8,y,x+size*10,y+(i%3-1)*size*3);}
 for(const h of s.hazards){if(h.kind!=='starGust')continue;const active=h.age>=h.warn,warn=Math.min(1,h.age/h.warn),color=h.dir>0?0x9cefff:0xe2b6ff,alpha=(active?.22:.09+warn*.1);
  for(let lane=-2;lane<=2;lane++){const x=h.x-165+lane*74,y=h.y+lane*17+Math.sin(s.time*4+lane)*16;g.lineStyle(active?5:3,color,alpha).lineBetween(x-66,y-h.dir*40,x+58,y+h.dir*34);g.fillStyle(lane%2?0xffffff:color,.26+warn*.33).fillEllipse(x+40,y+h.dir*23,22,7);}
  if(!active){g.fillStyle(0xffe7a4,.55+warn*.25).fillCircle(h.x,h.y,9+warn*12);g.lineStyle(2,0xfff2c4,.8).strokeCircle(h.x,h.y,18+warn*14);}
 }
}

export function transitCaption(s){
 if(!s.inTransit)return '';
 const info=s.phaseInfo,left=Math.max(0,Math.ceil(10-info.elapsed)),next=s.route[info.nextIndex];
 return '星風航道　·　'+(info.elapsed<3?'穿越星雲':info.elapsed<7?'追逐寶箱鳥':'出口正在展開')+'　'+left+' 秒後抵達 '+next.name;
}
