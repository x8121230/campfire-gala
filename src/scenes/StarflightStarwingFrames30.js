// Starwing: independent 8-frame atlases; all positions remain body-anchored.
export const STARWING30_SHEETS=['cruise','maneuver','combat','deploy','burst','arrival','weapons','radar','drone'];
export const STARWING30_ANCHORS={
 cruise:[[.67,.56],[.67,.56],[.67,.56],[.67,.56],[.67,.47],[.67,.47],[.67,.47],[.67,.47]],
 deploy:[[.664,.563],[.649,.564],[.651,.563],[.655,.563],[.661,.484],[.651,.482],[.656,.483],[.636,.485]],
 maneuver:[[.67,.56],[.67,.56],[.67,.56],[.67,.56],[.67,.47],[.67,.47],[.67,.50],[.67,.50]],
 combat:[[.65,.56],[.65,.56],[.65,.56],[.65,.56],[.65,.49],[.65,.49],[.65,.49],[.65,.49]],
 burst:[[.65,.55],[.64,.55],[.61,.55],[.65,.55],[.69,.59],[.64,.53],[.62,.55],[.59,.6]],
 arrival:[[.677,.581],[.707,.570],[.707,.573],[.709,.574],[.712,.529],[.709,.535],[.707,.533],[.662,.540]]
};
export function registerStarwing30(scene){for(const key of STARWING30_SHEETS){const t=scene.textures.get('star130_'+key),im=t.getSourceImage();for(let i=0;i<8;i++){const x=Math.round(i%4*im.width/4),y=Math.round(Math.floor(i/4)*im.height/2),r=Math.round((i%4+1)*im.width/4),b=Math.round((Math.floor(i/4)+1)*im.height/2);if(!t.has(i))t.add(i,0,x,y,r-x,b-y);}}}
export function starwingPose30(s,m={},a=null){
 if(s.phase==='falling')return ['burst',4+Math.min(3,Math.floor(s.phaseTime*4)),'fall'];
 if(s.phase==='ultimate'){const t=s.phaseTime;return t<.55?['deploy',Math.min(7,Math.floor(t/.55*8)),'deploy']:['burst',Math.min(3,Math.floor((t-.55)/.61)),'ultimate'];}
 if(a?.type==='hurt')return ['combat',Math.min(1,Math.floor((a.elapsed||0)*8)),'hurt'];
 if(s.player.dashing>0)return ['combat',2+Math.floor(s.time*10)%2,'boost'];
 const wing=s.starWingOpen||0,attackAge=s.time-(s.starLastShot??-100),salvoAge=s.time-(s.starLastSalvo??-100);
 if(wing>0&&wing<.99)return ['deploy',Math.min(7,Math.floor(wing*8)),s.starLocks?.length?'deploy':'retract'];
 if(salvoAge<.48||s.starOverclock>0)return ['burst',Math.floor((salvoAge<.48?salvoAge:s.time)*9)%4,'salvo'];
 if(attackAge<.24)return ['combat',4+Math.min(3,Math.floor(attackAge/.24*4)),'attack'];
 if(wing>=.99)return ['deploy',7,'locked'];
 if(m.x<-.22)return ['maneuver',Math.floor(s.time*8)%4,'reverse'];
 if(m.y<-.22)return ['maneuver',4+Math.floor(s.time*8)%2,'up'];
 if(m.y>.22)return ['maneuver',6+Math.floor(s.time*8)%2,'down'];
 return ['cruise',Math.floor(s.time*10)%8,'cruise'];
}
export function setStarwingPose30(hero,pose){hero.setTexture('star130_'+pose[0],pose[1]).setOrigin(...(STARWING30_ANCHORS[pose[0]]?.[pose[1]]||[.65,.55])).setData('starwingState',pose[2]);const width=hero.getData('starwingWidth');if(width)hero.setData('baseScale',width/hero.frame.width);}
export function drawStarwingShot30(scene,shot){const age=Math.max(0,scene.session.time-(shot.bornAt??0)),missile=!!shot.starMissile,frame=missile?4+Math.min(3,Math.floor(age*14)):Math.floor(age*18)%4,w=missile?43:shot.option?68:90,h=missile?29:shot.option?20:27;
 const im=scene.pickupArt('star130_weapons',shot.x,shot.y,w,Math.atan2(shot.vy,shot.vx)).setFrame(frame).setOrigin(missile?.70:.90,.5).setDisplaySize(w,h);if(!missile)im.setBlendMode(1);
}
export function drawStarwingLocks30(scene){const s=scene.session;for(const lock of s.starLocks){const e=lock.target;if(!e||e.dead||e.exit||e.hp<=0)continue;const frame=Math.min(3,Math.floor(lock.charge/.6*4)),offset=e===s.boss?(lock.slot-1.5)*28:0,size=46+(1-Math.min(1,lock.charge/.6))*16;scene.pickupArt('star130_radar',e.x+offset,e.y,size).setFrame(frame).setDisplaySize(size,size).setAlpha(scene.reducedFX?.55:.7);}}
export function drawStarwingDrone30(scene,o,i){const s=scene.session,age=s.time-(s.starLastShot??-100),frame=age<.24?4+Math.min(3,Math.floor(age/.24*4)):Math.floor(s.time*8+i)%4;scene.pickupArt('star130_drone',o.x,o.y,54).setFrame(frame).setDisplaySize(54,36);}
export function drawStarwingFx30(scene,e){const q=Math.min(1,e.age/.55),frame=4+Math.min(3,Math.floor(q*4)),size=e.type==='starImpact'?(e.missile?62:34):e.type==='starOverclock'?135:72;scene.pickupArt('star130_radar',e.x,e.y,size).setFrame(frame).setDisplaySize(size,size).setAlpha((1-q)*(scene.reducedFX?.4:.8));}
export function drawStarwingUltimate30(scene,top,scale){const s=scene.session,p=s.player,t=s.phaseTime;
 if(!scene.ultimateOverlay){scene.ultimateOverlay=scene.add.container(0,0).setDepth(80);scene.starRays30=Array.from({length:8},()=>{const im=scene.add.image(0,0,'star130_weapons',0).setOrigin(0,.5).setBlendMode(1);scene.ultimateOverlay.add(im);return im;});scene.starCore30=scene.add.image(0,0,'star130_radar',4).setBlendMode(1);scene.ultimateOverlay.add(scene.starCore30);}
 const alpha=Math.min(1,Math.max(0,(t-.48)*7))*Math.max(0,Math.min(1,(3-t)/.45));
 scene.starRays30.forEach((im,i)=>{const x=p.x+18,y=top+(p.y+(i-3.5)*8)*scale,ey=95+i*70,dx=1280-x,dy=ey-y;im.setPosition(x,y).setFrame(Math.floor(t*16+i)%4).setDisplaySize(Math.hypot(dx,dy),scene.reducedFX?17:27).setRotation(Math.atan2(dy,dx)).setAlpha(alpha*(scene.reducedFX?.35:.65));});
 scene.starCore30.setPosition(p.x,top+p.y*scale).setFrame(4+Math.min(3,Math.floor(t/.75))).setDisplaySize(120,120).setAlpha(alpha*.65);
}
