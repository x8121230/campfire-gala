export const ANCIENT29_SHEETS=['cruise','maneuver','combat','burst-fall','arrival','ammo'];
export function registerAncient29(scene){for(const key of ANCIENT29_SHEETS){const t=scene.textures.get('star129_'+key),im=t.getSourceImage(),rows=key==='ammo'?3:2;for(let i=0;i<rows*4;i++){const x=Math.round(i%4*im.width/4),y=Math.round(Math.floor(i/4)*im.height/rows),r=Math.round((i%4+1)*im.width/4),b=Math.round((Math.floor(i/4)+1)*im.height/rows);if(!t.has(i))t.add(i,0,x,y,r-x,b-y);}}}
export function ancientPose29(s,m={},a=null){
 if(s.phase==='falling')return ['burst-fall',4+Math.min(3,Math.floor(s.phaseTime*4)),'fall'];
 if(s.phase==='ultimate')return ['burst-fall',Math.min(3,Math.floor(s.phaseTime/.75)),'ultimate'];
 if(a?.type==='hurt')return ['combat',Math.min(1,Math.floor((a.elapsed||0)*8)),'hurt'];
 if(s.player.dashing>0)return ['combat',2+Math.floor(s.time*9)%2,'boost'];
 const age=s.time-(s.ancientLastShot??-100);if(age<.5)return ['combat',4+Math.min(3,Math.floor(age*8)),'attack'];
 if(s.charging||s.siegeTime>=.7)return ['burst-fall',Math.floor(s.time*5)%2,'charge'];
 if(m.x<-.22)return ['maneuver',Math.floor(s.time*8)%4,'reverse'];
 if(m.y<-.22)return ['maneuver',4+Math.floor(s.time*8)%2,'up'];
 if(m.y>.22)return ['maneuver',6+Math.floor(s.time*8)%2,'down'];
 return ['cruise',Math.floor(s.time*10)%8,'cruise'];
}
export const ANCIENT29_ANCHORS={"cruise": [[0.76, 0.71], [0.76, 0.71], [0.76, 0.71], [0.76, 0.71], [0.77, 0.63], [0.77, 0.63], [0.77, 0.63], [0.77, 0.63]], "maneuver": [[0.77, 0.64], [0.77, 0.64], [0.77, 0.64], [0.77, 0.64], [0.78, 0.55], [0.78, 0.58], [0.75, 0.47], [0.76, 0.48]], "combat": [[0.7, 0.52], [0.68, 0.54], [0.72, 0.55], [0.75, 0.56], [0.7, 0.5], [0.7, 0.53], [0.61, 0.49], [0.73, 0.5]], "burst-fall": [[0.57, 0.4], [0.72, 0.5], [0.62, 0.44], [0.78, 0.4], [0.56, 0.42], [0.69, 0.44], [0.59, 0.49], [0.77, 0.43]], "arrival": [[0.73, 0.69], [0.7, 0.55], [0.65, 0.52], [0.66, 0.5], [0.74, 0.43], [0.65, 0.47], [0.7, 0.44], [0.75, 0.4]]};
export function setAncientPose29(hero,pose){const a=ANCIENT29_ANCHORS[pose[0]]?.[pose[1]]||[.62,.6];hero.setTexture('star129_'+pose[0],pose[1]).setOrigin(...a).setData('ancientState',pose[2]);const w=hero.getData('ancientWidth');if(w)hero.setData('baseScale',w/hero.frame.width);}
export function drawAncientShot29(scene,a){const ric=a.ancientRicochet,gravity=a.kind==='gravity',age=scene.session.time-(a.bornAt??0),frame=(ric?8:0)+Math.floor(age*16)%4,w=ric?48:gravity?65:76;const im=scene.pickupArt('star129_ammo',a.x,a.y,w,Math.atan2(a.vy,a.vx)).setFrame(frame).setDisplaySize(w,w*.7);if(gravity)im.setTint(0xd3abff);}
export function drawAncientFx29(scene,e){const duration=e.type==='ancientFire'?.3:.65;if(e.age>=duration)return;const q=e.age/duration,frame=4+Math.min(3,Math.floor(q*4)),size=e.type==='ancientFire'?85:(e.radius||90)*2;scene.pickupArt('star129_ammo',e.x+(e.type==='ancientFire'?28:0),e.y,size).setFrame(frame).setDisplaySize(size,size*.75).setAlpha(1-q*.65).setTint(e.type==='gravityBurst'?0xd6b3ff:0xffffff);}
export function drawAncientUltimate29(scene,top,scale){const s=scene.session,p=s.player,t=s.phaseTime;if(!scene.ultimateOverlay){scene.ultimateOverlay=scene.add.container(0,0).setDepth(80);scene.ancientRings29=Array.from({length:3},()=>{const im=scene.add.image(0,0,'star129_ammo',4);scene.ultimateOverlay.add(im);return im;});}scene.ancientRings29.forEach((im,i)=>{const age=t-i*.3,q=Math.max(0,age)/2.4,size=100+Math.max(0,age)*820;im.setFrame(4+Math.min(3,Math.floor(q*4))).setPosition(p.x,top+p.y*scale).setDisplaySize(size,size*.75).setVisible(age>=0&&q<1).setAlpha(Math.max(0,1-q)*.7);});}
