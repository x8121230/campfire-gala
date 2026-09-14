// Hand-painted ice sprite sheets: explicit 4-pose animation and consistent world anchors.
const SWAN_RECTS=[[0,0,627,578],[627,0,627,578],[0,578,580,676],[580,578,674,676]];
const SWAN_ANCHORS=[[330,420],[330,420],[330,492],[450,492]];
const SPECS={24:{key:'rabbit',width:142},25:{key:'swan',width:174},27:{key:'pinecone',width:92}};
export function registerIceArt26(scene){for(const key of ['rabbit','swan','pinecone','bubble']){const tex=scene.textures.get('star126_'+key),im=tex.getSourceImage(),w=Math.floor(im.width/2),h=Math.floor(im.height/2);for(let i=0;i<4;i++)if(!tex.has(i))tex.add(i,0,...(key==='swan'?SWAN_RECTS[i]:[(i%2)*w,Math.floor(i/2)*h,w,h]));}}
export function icePose26(e){return e.kind===25?(e.attackAnim>0?3:e.swanWindup>0?2:Math.floor(e.age*4)%2):Math.floor(e.age*(e.kind===27?9:6))%4;}
export function drawIceArt26(scene,e,live){const spec=SPECS[e.kind],id='ice126-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star126_'+spec.key,0);scene.entities.add(v);scene.views.set(id,v);}live.add(id);const frame=icePose26(e);v.setFrame(frame).setPosition(e.x,e.y).setDisplaySize(spec.width,spec.width/1.27).setOrigin(.5,.5).setRotation(e.kind===27?Math.sin(e.age*3)*.12:0).setVisible(true);if(e.kind===25){const [ax,ay]=SWAN_ANCHORS[frame],r=SWAN_RECTS[frame];v.setOrigin(ax/r[2],ay/r[3]).setDisplaySize(spec.width*r[2]/627,spec.width*r[3]/627/1.27);}
 if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();
 if(e.kind===24&&e.snowShield>0){const q=1+Math.sin(e.age*3)*.025,size=164*q;scene.pickupArt('star126_bubble',e.x,e.y,size).setFrame(e.shieldFlash>0?1:0).setDisplaySize(size,size/1.27).setAlpha(.85);}
}
export function drawUpdraft26(scene,h){const active=h.age>=h.warn;for(let i=0;i<3;i++){const q=(scene.session.time*.5+i/3)%1,up=h.dir<0;scene.pickupArt('star126_updraft',h.x+(i-1)*h.r*.57,240+(up?-1:1)*(q-.5)*65,400,up?0:Math.PI).setDisplaySize(h.r*3.3,450).setAlpha((active?.50:.20)*(i===1?1:.60));}}
export function drawBubbleBreak26(scene,e){const progress=Math.min(1,e.age/.55),size=164*(1+progress*.22);scene.pickupArt('star126_bubble',e.x,e.y,size).setFrame(progress<.3?1:progress<.65?2:3).setDisplaySize(size,size/1.27).setAlpha(1-progress);}
