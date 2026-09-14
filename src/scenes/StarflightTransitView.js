import {TRANSIT_ENEMY_KIND} from '../data/StarflightTransit.js';

export function drawTransitEnemy(scene,g,e,live){
 if(e.kind!==TRANSIT_ENEMY_KIND)return false;
 const id='transit-'+e.id;let v=scene.views.get(id);
 if(!v){v=scene.add.container(e.x,e.y);scene.entities.add(v);scene.views.set(id,v);
  const wing=scene.add.graphics();wing.fillStyle(0xdaf5ff,.92).fillEllipse(-30,-4,50,24).fillEllipse(22,-7,43,21);wing.lineStyle(3,0x8fc9dc,.9).strokeEllipse(-30,-4,50,24).strokeEllipse(22,-7,43,21);
  const body=scene.add.graphics();body.fillStyle(0xffd978).fillEllipse(0,0,55,36).fillStyle(0xfff4cf).fillCircle(18,-8,15).fillStyle(0x45526b).fillCircle(22,-11,3).fillStyle(0xf09a66).fillTriangle(31,-7,44,-2,31,1);
  body.fillStyle(0x9a6a42).fillRoundedRect(-24,10,42,28,7).lineStyle(3,0xffd26c).strokeRoundedRect(-24,10,42,28,7).fillStyle(0xffdf78).fillCircle(-3,23,5);
  v.add([wing,body]);v.setData('wing',wing);
 }
 live.add(id);const wing=v.getData('wing'),flap=.82+Math.sin(e.age*15)*.22;wing.setScale(1,flap);v.setPosition(e.x,e.y).setRotation(Math.sin(e.age*3)*.045).setScale(e.flash>0?1.09:1);
 g.fillStyle(0x203b52,.82).fillRoundedRect(e.x-42,e.y-53,84,6,3);g.fillStyle(0xffdc7b).fillRoundedRect(e.x-42,e.y-53,84*Math.max(0,e.hp/e.maxHp),6,3);
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
