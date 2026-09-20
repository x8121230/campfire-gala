export const FALCON28_SHEETS=['falcon-cruise','falcon-maneuver','falcon-combat','falcon-burst','falcon-arrival','falcon-fall','laser-fx'];
export function registerFalcon28(scene){for(const key of FALCON28_SHEETS){const t=scene.textures.get('star128_'+key),im=t.getSourceImage(),rows=key==='laser-fx'?3:2,cols=['falcon-burst','falcon-fall'].includes(key)?2:4;for(let i=0;i<cols*rows;i++){const x=Math.round(i%cols*im.width/cols),y=Math.round(Math.floor(i/cols)*im.height/rows),r=Math.round((i%cols+1)*im.width/cols),b=Math.round((Math.floor(i/cols)+1)*im.height/rows);if(!t.has(i))t.add(i,0,x,y,r-x,b-y);}}}
export function falconPose28(s,m={},a=null){
 if(s.phase==='falling')return ['falcon-fall',Math.min(3,Math.floor(s.phaseTime*4)),'fall'];
 if(s.phase==='ultimate')return ['falcon-burst',Math.min(3,Math.floor(s.phaseTime/.75)),'ultimate'];
 if(a?.type==='hurt')return ['falcon-combat',Math.min(1,Math.floor((a.elapsed||0)*8)),'hurt'];
 if(s.player.dashing>0)return ['falcon-combat',2+Math.floor(s.time*12)%2,'boost'];
 if(s.charging)return ['falcon-burst',Math.min(1,Math.floor(s.charging.elapsed*4)),'charge'];
 if(m.x<-.22)return ['falcon-maneuver',Math.floor(s.time*10)%4,'reverse'];
 if(m.y<-.22)return ['falcon-maneuver',4+Math.floor(s.time*10)%2,'up'];
 if(m.y>.22)return ['falcon-maneuver',6+Math.floor(s.time*10)%2,'down'];
 const age=s.time-(s.falconLastShot??-100);if(age<.4)return ['falcon-combat',4+Math.floor(s.time*10)%4,'attack'];
 return ['falcon-cruise',Math.floor(s.time*14)%8,'cruise'];
}
export function setFalconPose28(hero,pose){const anchors=FALCON28_ANCHORS[pose[0]],a=anchors?.[pose[1]]||[.62,.60];hero.setTexture('star128_'+pose[0],pose[1]).setOrigin(...a);hero.setData('falconState',pose[2]);const w=hero.getData('falconWidth');if(w)hero.setData('baseScale',w/hero.frame.width);}
export function drawFalconBeam28(scene,a){const strong=a.falconEmpowered,age=scene.session.time-(a.bornAt??scene.session.time),frame=Math.floor(age*24)%4,length=strong?260:170;
 scene.pickupArt('star128_laser-fx',a.x-length*.35,a.y,length).setFrame(frame).setDisplaySize(length,strong?74:48).setAlpha(.95).setTint(strong?0xd9c4ff:0xffffff);
 if(strong&&!scene.reducedFX)for(const dy of [-7,7])scene.pickupArt('star128_laser-fx',a.x-length*.42,a.y+dy,length*.8).setFrame((frame+2)%4).setDisplaySize(length*.8,30).setAlpha(.35);
}
export function drawFalconFx28(scene,e){const hit=e.type==='falconPierce',duration=hit?.32:.20;if(e.age>=duration)return;const frame=(hit?8:4)+Math.min(3,Math.floor(e.age/duration*4)),size=hit?(e.empowered?105:76):(e.empowered?95:65);scene.pickupArt('star128_laser-fx',e.x,e.y,size).setFrame(frame).setDisplaySize(size,size/1.27).setAlpha(1-e.age/duration*.6);}
export function drawFalconUltimate28(scene,top,scale){const s=scene.session,p=s.player,t=s.phaseTime;if(!scene.ultimateOverlay){scene.ultimateOverlay=scene.add.container(0,0).setDepth(80);scene.falconRay28=Array.from({length:3},()=>{const im=scene.add.image(0,0,'star128_laser-fx',0);scene.ultimateOverlay.add(im);return im;});scene.falconMuzzle28=scene.add.image(0,0,'star128_laser-fx',4);scene.ultimateOverlay.add(scene.falconMuzzle28);}
 const q=Math.min(1,t/.3)*Math.max(0,1-Math.max(0,t-2.4)/.6),length=1280-p.x,frame=Math.floor(t*20)%4;
 scene.falconRay28.forEach((im,i)=>im.setFrame(frame).setPosition(p.x+length*.42,top+(p.y+(i-1)*16)*scale).setDisplaySize(length*1.45,i===1?145:90).setAlpha(q*(i===1?.9:.35)).setRotation((i-1)*.035));
 scene.falconMuzzle28.setFrame(4+Math.floor(t*16)%4).setPosition(p.x+25,top+p.y*scale).setDisplaySize(125,100).setAlpha(q);
}

export const FALCON28_ANCHORS={
 'falcon-cruise':[[.65,.76],[.65,.76],[.65,.76],[.65,.76],[.65,.68],[.65,.68],[.65,.68],[.65,.68]],
 'falcon-maneuver':Array.from({length:8},()=>[.64,.67]),
 'falcon-combat':[[.54,.63],[.57,.61],[.63,.56],[.63,.56],[.51,.61],[.52,.61],[.55,.65],[.57,.65]],
 'falcon-burst':[[.63,.65],[.65,.67],[.63,.56],[.65,.55]],
 'falcon-fall':[[.60,.57],[.62,.60],[.58,.55],[.65,.56]]
};
