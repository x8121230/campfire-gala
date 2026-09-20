// Every pose is painted separately; selection is deterministic and independent of combat time freezes.
export const OWL27_SHEETS=['owl-cruise','owl-maneuver','owl-combat','owl-burst-fall','owl-arrival','mushroom','owl-attack'];
export const OWL27_ANCHORS={
 'owl-attack':[[370,430],[255,440],[380,390],[370,395]],
 'owl-cruise':[[285,305],[285,305],[285,305],[285,305],[285,275],[285,275],[285,275],[285,275]],
 'owl-maneuver':[[270,285],[275,285],[275,285],[285,285],[270,275],[275,275],[270,275],[275,275]],
 'owl-combat':[[210,290],[210,290],[255,290],[255,290],[220,270],[220,270],[160,250],[250,275]],
 'owl-burst-fall':[[210,295],[220,295],[235,295],[260,295],[235,250],[235,250],[225,250],[225,250]],
 'owl-arrival':[[280,280],[280,295],[270,290],[280,280],[265,275],[275,270],[275,250],[270,245]]
};
export function registerOwl27(scene){for(const key of OWL27_SHEETS){const t=scene.textures.get('star127_'+key),im=t.getSourceImage();const cols=key==='owl-attack'?2:4;for(let i=0;i<cols*2;i++){const x=Math.round((i%cols)*im.width/cols),y=Math.round(Math.floor(i/cols)*im.height/2),r=Math.round((i%cols+1)*im.width/cols),b=Math.round((Math.floor(i/cols)+1)*im.height/2);if(!t.has(i))t.add(i,0,x,y,r-x,b-y);}}}
export function owlPose27(s,m={},a=null){
 if(s.phase==='falling')return ['owl-burst-fall',4+Math.min(3,Math.floor(s.phaseTime*4)),'fall'];
 if(s.phase==='ultimate')return ['owl-burst-fall',Math.min(3,Math.floor(s.phaseTime/0.225)),'ultimate'];
 if(a?.type==='hurt')return ['owl-combat',Math.min(1,Math.floor((a.elapsed||0)*8)),'hurt'];
 if(a?.type==='owlOrbit'||a?.type==='traitFire'||s.charging)return ['owl-combat',4+Math.min(3,Math.floor((a?.elapsed||0)*8)),'special'];
 if(s.player.dashing>0)return ['owl-combat',2+Math.floor(s.time*10)%2,'boost'];
 if(m.x<-.22)return ['owl-maneuver',Math.floor(s.time*10)%4,'reverse'];
 if(m.y<-.22)return ['owl-maneuver',4+Math.floor(s.time*8)%2,'up'];
 if(m.y>.22)return ['owl-maneuver',6+Math.floor(s.time*8)%2,'down'];
 if(m.fire)return ['owl-attack',Math.floor(s.time*10)%4,'attack'];
 return ['owl-cruise',Math.floor(s.time*12)%8,'cruise'];
}
export function setOwlPose27(hero,pose){hero.setTexture('star127_'+pose[0],pose[1]);const anchor=OWL27_ANCHORS[pose[0]][pose[1]];hero.setOrigin(anchor[0]/hero.frame.width,anchor[1]/hero.frame.height);hero.setData('owlState',pose[2]);const w=hero.getData('owlWidth');if(w)hero.setData('baseScale',w/hero.frame.width);}
export function mushroomPose27(e){return e.attackAnim>0?5:e.sporeWindup>0?4:Math.floor(e.age*8)%4;}
