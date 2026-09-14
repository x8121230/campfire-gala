import * as T from '../vendor/three.module.js';
import {RealmWorld} from './RealmWorld.js';
import {terrainHeight,heightAt,SPOTS,APPLES,ANIMALS,TREES,MUSHROOMS,PATHS,inPond} from './StarForestRules.js';

// Original vector paper characters. Canvas textures remain local and need no network.
function paperTexture(type){
 const c=document.createElement('canvas');c.width=256;c.height=320;const g=c.getContext('2d');
 g.lineWidth=6;g.lineJoin='round';g.strokeStyle='#604a42';
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();};
 const dot=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
 const path=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.stroke();};
 if(type==='apple'){
  g.strokeStyle='#b28139';oval(128,180,75,77,'#ffd762');oval(132,164,60,60,'#ffdf79');g.strokeStyle='#725b39';g.beginPath();g.moveTo(128,111);g.quadraticCurveTo(116,65,142,61);g.stroke();oval(162,85,28,14,'#98c982');dot(94,151,13,'#fff1b0');
 }else if(type==='duck'){
  oval(128,212,65,60,'#ffe78c');oval(139,144,52,50,'#fff0a4');oval(105,221,30,24,'#ffdc70');path([[180,147],[225,167],[178,177]],'#efad63');dot(158,137,6,'#4d4642');dot(160,135,2,'#fff');oval(109,277,25,10,'#eeb367');oval(157,277,25,10,'#eeb367');
 }else if(type==='owl'){
  oval(128,205,77,85,'#ae8270');path([[60,133],[58,56],[113,99]],'#ad8270');path([[140,96],[199,56],[196,143]],'#ad8270');oval(128,151,86,77,'#bc9480');oval(92,150,35,40,'#ffecd0');oval(166,150,35,40,'#ffecd0');dot(95,151,9,'#443b3b');dot(164,151,9,'#443b3b');path([[115,170],[141,170],[128,192]],'#efb45f');g.strokeStyle='#635a69';g.lineWidth=5;g.strokeRect(58,127,67,50);g.strokeRect(135,127,67,50);g.beginPath();g.moveTo(125,143);g.lineTo(135,143);g.stroke();oval(128,237,43,36,'#eed7b5');oval(92,289,21,10,'#dba459');oval(165,289,21,10,'#dba459');
 }else if(type==='hedgehog'){
  const spikes=[];for(let i=0;i<36;i++){let a=i*Math.PI*2/36,r=i%2?79:101;spikes.push([128+Math.cos(a)*r,185+Math.sin(a)*r]);}path(spikes,'#937669');oval(127,203,63,73,'#efcfaa');oval(126,151,59,44,'#f6ddbd');path([[81,213],[171,213],[185,268],[73,268]],'#9aafa0');dot(107,151,6,'#4e423d');dot(150,151,6,'#4e423d');oval(128,176,9,7,'#685049');oval(91,283,25,11,'#f1d4b1');oval(163,283,25,11,'#f1d4b1');
 }else{
  const rabbit=type==='rabbit',fur=rabbit?'#f7e5d5':'#ce9978';
  if(!rabbit){oval(198,207,40,75,'#a77361');oval(195,210,22,50,'#dab391');}
  oval(127,219,60,62,fur);oval(101,278,32,13,fur);oval(154,278,32,13,fur);
  if(rabbit){oval(88,87,22,69,fur);oval(163,87,22,69,fur);g.lineWidth=0;oval(88,83,9,44,'#efbdb9');oval(163,83,9,44,'#efbdb9');g.lineWidth=6;}
  else {oval(83,92,23,33,fur);oval(165,92,23,33,fur);}
  oval(125,152,75,65,fur);oval(126,234,33,35,'#fff0da');dot(99,150,7,'#52433f');dot(151,150,7,'#52433f');dot(101,147,2,'#fff');dot(153,147,2,'#fff');oval(126,169,7,5,'#b88280');
  g.strokeStyle='#956d64';g.lineWidth=3;g.beginPath();g.moveTo(114,183);g.quadraticCurveTo(126,193,139,182);g.stroke();dot(78,174,12,'#eab3a2');dot(175,174,12,'#eab3a2');
 }
 // Paper rim plus warm brush-like highlights are baked into each transparent texture.
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
}
export class StarForestWorld extends RealmWorld{
 constructor(canvas){
  super(canvas);this.scene.background=new T.Color('#9ac8bc');this.scene.fog=new T.Fog('#9ac8bc',58,110);
  this.camera.far=170;this.target.set(-29,0,5);this.dynamic=new T.Group();this.scene.add(this.dynamic);
  this.textures={};for(const type of ['rabbit','squirrel','owl','hedgehog','duck','apple'])this.textures[type]=paperTexture(type);
  this.animalViews=ANIMALS.map(a=>{
   const sprite=this.paper(a.type,a.x,a.z,2.6);const bar=new T.Group();this.scene.add(bar);
   const bg=new T.Mesh(new T.PlaneGeometry(1.3,.14),new T.MeshBasicMaterial({color:0x574a50,depthTest:false}));bar.add(bg);
   const fill=new T.Mesh(new T.PlaneGeometry(1.22,.085),new T.MeshBasicMaterial({color:0xf4b487,depthTest:false}));fill.position.z=.01;bar.add(fill);bar.renderOrder=7;
   const cue=this.flatRing(.9,0xf5ac79);return {sprite,bar,fill,cue};
  });
  this.appleViews=APPLES.map(p=>this.paper('apple',p.x,p.z,1.3));
  this.paper('owl',SPOTS.owl.x,SPOTS.owl.z,2.8);this.paper('hedgehog',SPOTS.hedgehog.x,SPOTS.hedgehog.z,2.2);
  this.duckViews=[0,1,2].map(i=>this.paper('duck',1-i*.7,6+i*.35,1.2));this.paper('duck',SPOTS.nest.x,SPOTS.nest.z,1.8);
  this.rivalView=this.paper('squirrel',-7,-8,2);this.rivalView.visible=false;
  this.bubbleGeo=new T.SphereGeometry(.24,10,8);this.bubbleMat=new T.MeshStandardMaterial({color:0xbdf4ee,emissive:0x619cac,emissiveIntensity:.5,transparent:true,opacity:.72,roughness:.18,metalness:.2});
  this.pool=[];this.effectObjects=new Map();this.fieldObjects=new Map();this.nutViews=[];
  this.aimRing=this.flatRing(3.4,0xffcf74);this.aimRing.visible=false;
  this.heroStar=this.mesh(new T.OctahedronGeometry(.18),0xffde88,-29,3.2,5);this.heroStar.material.emissive.set(0xc89339);
  this.guide=this.mesh(new T.OctahedronGeometry(.27),0xffe28d,-29,4,1);this.guide.material.emissive.set(0xb19a42);
 }
 mat(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,...extra});}
 paper(type,x,z,size){const s=new T.Sprite(new T.SpriteMaterial({map:this.textures[type],transparent:true,alphaTest:.05,depthWrite:true}));s.center.set(.5,.07);s.scale.set(size*.8,size,1);s.position.set(x,terrainHeight(x,z)+.04,z);this.scene.add(s);return s;}
 flatRing(r,color){const mesh=new T.Mesh(new T.RingGeometry(r-.05,r,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));mesh.rotation.x=-Math.PI/2;this.scene.add(mesh);return mesh;}
 path(points,width=2,color=0xc8c294){
  const pts=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let k=0;k<n;k++)pts.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}pts.push(points.at(-1));
  const v=[],idx=[];pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;for(const s of [-1,1]){const x=p[0]+s*dz/l*width/2,z=p[1]-s*dx/l*width/2;v.push(x,terrainHeight(x,z)+.04,z);}if(i){const j=i*2;idx.push(j-2,j-1,j,j-1,j+1,j);}});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();return this.mesh(geo,color,0,0,0,this.scene,{side:T.DoubleSide});
 }
 makeLand(){
  const geo=new T.BufferGeometry(),v=[],colors=[],idx=[];const nx=74,nz=54;
  for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){
   const x=ix-37,z=iz-27,y=inPond(x,z)?-.85:terrainHeight(x,z);v.push(x,y,z);
   const col=new T.Color(x<-21?'#8daf74':x>18&&z<0?'#aac879':'#6d9d7a');col.offsetHSL(0,Math.sin(x*.6+z*.3)*.035,Math.sin(x*.5)*Math.cos(z*.4)*.035);colors.push(col.r,col.g,col.b);
   if(ix<nx&&iz<nz){let a=iz*(nx+1)+ix;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  }
  geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();this.mesh(geo,0xffffff,0,0,0,this.scene,{vertexColors:true,side:T.DoubleSide});
  this.box(0,-1.7,0,74,1.8,54,0x74857a);
  const water=this.mesh(new T.CircleGeometry(1,64),0x71b6c1,12,-.1,19,this.scene,{roughness:.22,metalness:.24});water.rotation.x=-Math.PI/2;water.scale.set(8.5,6.4,1);this.water=water;
  this.ripples=[];for(let i=0;i<12;i++){const r=this.flatRing(.7+(i%3)*.3,0xd2efe2);r.position.set(8+(i%4)*2.4,-.08,16+Math.floor(i/4)*2.3);r.scale.set(1,.5,1);this.ripples.push(r);}
  PATHS.forEach(p=>this.path(p));
  this.foliage=[];TREES.forEach(([x,z,s])=>this.tree(x,z,terrainHeight(x,z),s));
  for(let i=0;i<54;i++){const side=i%4,a=Math.floor(i/4),x=side<2?(side?36:-36):-34+a*5,z=side<2?-25+a*4:(side===2?26:-26);if(Math.abs(x)>37||Math.abs(z)>27)continue;this.tree(x,z,terrainHeight(x,z),1.15+(i%3)*.25);}
  MUSHROOMS.forEach(([x,z,s],i)=>this.mushroom(x,z,s,i));
  // A few luminous crystals point toward the next chapter.
  for(let i=0;i<5;i++){const x=20+i*.9,z=-23-Math.sin(i);const crystal=this.mesh(new T.OctahedronGeometry(.6),0xc4c4ee,x,terrainHeight(x,z)+.8,z);crystal.scale.y=1.8;crystal.material.emissive.set(0x70688d);}
  let seed=71;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const grassGeo=new T.ConeGeometry(.13,.4,3),grassMat=this.mat(0x629874);const grass=new T.InstancedMesh(grassGeo,grassMat,460),o=new T.Object3D();let count=0;
  for(let i=0;i<460;i++){const x=rnd()*72-36,z=rnd()*52-26;if(heightAt(x,z)===null)continue;o.position.set(x,terrainHeight(x,z)+.13,z);o.rotation.set(0,rnd()*6,0);o.scale.setScalar(.6+rnd()*.8);o.updateMatrix();grass.setMatrixAt(count++,o.matrix);}grass.count=count;this.scene.add(grass);
  for(let i=0;i<50;i++){const x=rnd()*67-34,z=rnd()*48-24;if(heightAt(x,z)===null)continue;const flower=this.ball(x,terrainHeight(x,z)+.16,z,.14,[0xe4b8cb,0xf7db98,0xb6cbed][i%3]);flower.castShadow=false;}
 }
 tree(x,z,y,s=1){
  this.cylinder(x,y+1.3*s,z,.36*s,2.6*s,0x856d58);
  const c=this.ball(x,y+3.1*s,z,1.65*s,0x467a6c);c.scale.set(1.15,.95,1);this.foliage.push(c);
  const t=this.ball(x-.5*s,y+4*s,z-.15,1.15*s,0x69947a);this.foliage.push(t);
 }
 mushroom(x,z,s,i){
  const y=terrainHeight(x,z);this.cylinder(x,y+.7*s,z,.24*s,1.4*s,0xe9d9b2);
  const cap=this.mesh(new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),[0xd196b0,0x9ea8d3,0xe6bc80,0x88c5c0][i%4],x,y+1.4*s,z);cap.scale.set(s,.55*s,s);this.foliage.push(cap);
  for(let k=0;k<3;k++){const a=k*2.1+i;const dot=this.ball(x+Math.sin(a)*.55*s,y+1.8*s,z+Math.cos(a)*.5*s,.14*s,0xffefd0);dot.scale.y=.25;this.foliage.push(dot);}
 }
 makeVillage(){
  const h=terrainHeight(-32,-5);
  const deck=this.cylinder(-32,h+2.8,-5,2.8,.3,0xc6a879);this.foliage.push(deck);
  const house=this.cylinder(-30.7,h+3.9,-3.5,1.5,2.1,0xf0d2a0);this.foliage.push(house);
  const roof=this.mesh(new T.ConeGeometry(2.4,1.8,8),0x98a88b,-30.7,h+5.7,-3.5);this.foliage.push(roof);
  this.box(-30,h+4,-2.1,.65,.9,.1,0xffdc8e);this.box(-31,h+3.75,-2.05,.72,1.5,.1,0x896d56);
  for(let i=0;i<16;i++){const a=i*.18,x=-32+Math.sin(a)*2.9,z=-5+Math.cos(a)*2.9;const step=this.box(x,h+.15+i*.175,z,1,.17,.6,0xc5aa7a);step.rotation.y=a;}
  this.label('橡果樹屋村',-31,h+8,-5);
  const shop=terrainHeight(-28,12);this.box(-28,shop+.6,12,2.8,1.2,1.6,0xc7a375);this.box(-28,shop+2.4,12,3.7,.22,2.3,0xd4ac9c);for(const x of [-29.4,-26.6])this.cylinder(x,shop+1.2,12,.07,2.4,0x866b50);
  for(let i=0;i<3;i++)this.ball(-29+i*.8,shop+1.35,12,.22,0xf3ce6a);
  this.label('貓頭鷹村長',-29,terrainHeight(-29,1)+3.4,1);this.label('刺蝟太太',-25,terrainHeight(-25,9)+2.9,9);
  this.label('迷亂蘑菇林',-7,5,-8);this.label('陽光蘋果坡',25,7.6,-12);this.label('鴨媽媽',19,terrainHeight(19,10)+2.5,10);
  const e=SPOTS.event,y=terrainHeight(e.x,e.z);this.cylinder(e.x,y+1.6,e.z,.12,3.2,0xa58d68);const bell=this.mesh(new T.ConeGeometry(.5,.6,8),0xf1d086,e.x,y+2.7,e.z);bell.material.emissive.set(0x766338);this.label('金橡果風鈴',e.x,y+3.5,e.z);
  for(const id of ['marsh','moon']){const p=SPOTS[id],y=terrainHeight(p.x,p.z);this.cylinder(p.x,y+.9,p.z,.1,1.8,0x8c7159);this.box(p.x,y+1.8,p.z,2.5,.8,.18,0xc0b699);this.label(id==='marsh'?'泡泡泥沼 · 待開放':'月亮湖 · 待開放',p.x,y+3,p.z);}
  this.lanterns=[];for(const [x,z]of [[-31,5],[-22,3],[-16,3],[-2,-4],[9,-4],[19,8],[-17,9]]){const y=terrainHeight(x,z);this.cylinder(x,y+.9,z,.08,1.8,0x8b8062);const orb=this.ball(x,y+2,z,.23,0xffe6a2);orb.material.emissive.set(0xffd279);orb.material.emissiveIntensity=.65;this.lanterns.push(orb);}
  // Glowing hill and tiny apple shrubs establish a recognisable collection landmark.
  APPLES.forEach(p=>{this.cylinder(p.x,terrainHeight(p.x,p.z)+.45,p.z,.15,.9,0xa28a61);this.ball(p.x,terrainHeight(p.x,p.z)+.9,p.z,.65,0x9fc480);});
 }
 makeLife(){this.shadow=this.mesh(new T.CircleGeometry(.45,20),0x23413b,0,.04,0,this.scene,{transparent:true,opacity:.25,depthWrite:false});this.shadow.rotation.x=-Math.PI/2;this.ring=this.flatRing(.66,0xffecad);}
 projection(){const h=this.overview?34:(this.height<500?10:11.5),a=this.width/this.height;Object.assign(this.camera,{left:-h*a,right:h*a,top:h,bottom:-h});this.camera.updateProjectionMatrix();}
 pickGround(clientX,clientY){const r=this.renderer.domElement.getBoundingClientRect(),mouse=new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),ray=new T.Raycaster();ray.setFromCamera(mouse,this.camera);let out=new T.Vector3();ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),out);for(let i=0;i<3;i++)ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-terrainHeight(out.x,out.z)),out);return {x:out.x,z:out.z};}
 showAim(dest){this.aimRing.visible=!!dest;if(dest)this.aimRing.position.set(dest.x,terrainHeight(dest.x,dest.z)+.08,dest.z);}
 disposeGroup(group){this.scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});}
 createEffect(e){
  const group=new T.Group();group.position.set(e.x,terrainHeight(e.x,e.z),e.z);this.scene.add(group);
  const m=(geo,color,x,y,z,extra={})=>this.mesh(geo,color,x,y,z,group,extra);
  if(e.kind==='elephant'){
   group.rotation.y=Math.atan2(e.dir.x,e.dir.z);
   m(new T.SphereGeometry(.9,10,8),0xb2cfdb,0,1.4,-.8,{transparent:true,opacity:.65}).scale.set(1,1,1.4);
   m(new T.SphereGeometry(.7,10,8),0xc5dce2,0,1.9,.3,{transparent:true,opacity:.72});
   for(const x of [-.85,.85])m(new T.SphereGeometry(.6,8,6),0xddccdd,x,1.9,.1,{transparent:true,opacity:.75}).scale.set(1,.9,.25);
   for(const x of [-.5,.5])for(const z of [-1.3,-.2])m(new T.CylinderGeometry(.2,.25,.9,7),0xb9d3da,x,.5,z,{transparent:true,opacity:.65});
   const curve=new T.CatmullRomCurve3([new T.Vector3(0,1.8,.8),new T.Vector3(0,1.1,1.2),new T.Vector3(0,1.6,1.7)]);m(new T.TubeGeometry(curve,10,.18,6,false),0xc7dce0,0,0,0,{transparent:true,opacity:.8});
   [0xf0a5ab,0xf5cf91,0xf5eab4,0xaee0b3,0x94d5e4,0xb9b4e6].forEach((col,i)=>{
    const angle=(i-2.5)*.18,curve=new T.CatmullRomCurve3([new T.Vector3(0,1.6,1.7),new T.Vector3(Math.sin(angle)*4,2.5,5),new T.Vector3(Math.sin(angle)*9,.3,9)]);m(new T.TubeGeometry(curve,12,.22,5,false),col,0,0,0,{transparent:true,opacity:.7});});
  }else if(e.kind==='jar'){
   m(new T.CylinderGeometry(.3,.4,.65,8),0xeac077,0,1,0);m(new T.CylinderGeometry(.33,.33,.15,8),0xf5e5b5,0,1.4,0);
  }else if(e.kind==='heart'){
   const sh=new T.Shape();sh.moveTo(0,-.4);sh.bezierCurveTo(-1,.1,-.55,.75,0,.35);sh.bezierCurveTo(.55,.75,1,.1,0,-.4);const heart=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:0xf5adbd,side:T.DoubleSide,transparent:true}));heart.position.y=2.8;group.add(heart);group.userData.heart=heart;
   m(new T.SphereGeometry(1,12,8),0xc5f3f0,0,1.2,0,{transparent:true,opacity:.22,depthWrite:false});
  }else{
   const color=e.kind==='bump'?0xffc69d:e.kind==='dandelion'?0xfff2da:0xffdf91;
   for(let i=0;i<(e.kind==='celebrate'?26:10);i++){const a=i*2.399,r=.6+(i%4)*.3;const item=m(e.kind==='pop'?new T.SphereGeometry(.1,5,4):new T.OctahedronGeometry(.1),color,Math.sin(a)*r,.5+(i%5)*.4,Math.cos(a)*r);item.castShadow=false;}
  }
  return group;
 }
 render(j,dt,axis,moving){
  this.t+=dt;const p=j.player,goal=this.overview?new T.Vector3(0,0,0):new T.Vector3(p.x,p.y+.7,p.z);this.target.lerp(goal,1-Math.exp(-Math.max(dt,.001)*7));this.camera.position.copy(this.target).add(new T.Vector3(30,42.43,30));this.camera.lookAt(this.target);
  if(this.hero){if(moving){if(Math.abs(axis.x)>Math.abs(axis.y))this.face=axis.x>0?1:3;else if(Math.hypot(axis.x,axis.y)>.1)this.face=axis.y>0?0:2;}const walk=moving&&Math.floor(this.t*7)%2;this.texture.offset.set((this.face||0)*.25,walk?0:.5);this.hero.scale.set(1.6,3.2,1);this.hero.position.set(p.x,p.y+.04+(moving?Math.abs(Math.sin(this.t*10))*.06:0),p.z);this.hero.material.opacity=j.invulnerable>0?.65+Math.sin(this.t*20)*.25:1;}
  this.heroStar.position.set(p.x,p.y+3.3+Math.sin(this.t*3)*.09,p.z);this.heroStar.rotation.y=this.t;
  this.shadow.position.set(p.x,p.y+.06,p.z);this.ring.position.set(p.x,p.y+.08,p.z);
  this.guide.visible=!j.accepted||(!j.finished&&j.calm.length===8&&j.apples.length===5);this.guide.position.y=terrainHeight(-29,1)+4+Math.sin(this.t*3)*.2;
  this.animalViews.forEach((v,i)=>{const a=j.animals[i];v.sprite.visible=a.anger>0||j.time-a.calmAt<2.5;v.sprite.position.set(a.x,terrainHeight(a.x,a.z)+Math.abs(Math.sin(this.t*5+i))*.06,a.z);v.sprite.material.color.set(a.root>0?0xffe2a0:0xffffff);v.bar.visible=a.anger>0;v.bar.position.set(a.x,terrainHeight(a.x,a.z)+2.8,a.z);v.bar.quaternion.copy(this.camera.quaternion);v.fill.scale.x=a.anger/3;v.fill.position.x=-(1-a.anger/3)*.61;v.cue.visible=a.windup>0;v.cue.position.set(a.x,terrainHeight(a.x,a.z)+.1,a.z);v.cue.scale.setScalar(1+a.windup);});
  this.appleViews.forEach((s,i)=>{s.visible=!j.apples.includes(i);s.position.y=terrainHeight(APPLES[i].x,APPLES[i].z)+1+Math.sin(this.t*2+i)*.1;});
  this.duckViews.forEach((v,i)=>{const d=j.escortDone?{x:18.4-i*.75,z:11.3}:j.ducks[i];v.position.set(d.x,terrainHeight(d.x,d.z)+Math.abs(Math.sin(this.t*7+i))*.04,d.z);});
  while(this.pool.length<j.bubbles.length){const b=new T.Mesh(this.bubbleGeo,this.bubbleMat);this.scene.add(b);this.pool.push(b);}this.pool.forEach((v,i)=>{const b=j.bubbles[i];v.visible=!!b;if(b)v.position.set(b.x,terrainHeight(b.x,b.z)+1.25,b.z);});
  for(const [e,v]of this.effectObjects)if(!j.effects.includes(e)){this.disposeGroup(v);this.effectObjects.delete(e);}
  for(const e of j.effects){let v=this.effectObjects.get(e);if(!v){v=this.createEffect(e);this.effectObjects.set(e,v);}const a=1-e.life/e.max;
   if(e.kind==='jar'){v.position.set(e.x+(e.dest.x-e.x)*a,terrainHeight(e.x,e.z)+Math.sin(a*Math.PI)*3,e.z+(e.dest.z-e.z)*a);}
   else if(e.kind==='heart'){v.position.y=terrainHeight(e.x,e.z)+a*1.4;v.userData.heart.quaternion.copy(this.camera.quaternion);}
   else if(e.kind!=='elephant'){v.scale.setScalar(.6+a*1.6);v.position.y=terrainHeight(e.x,e.z)+a*.6;}
   v.traverse(o=>{if(o.material?.transparent)o.material.opacity=Math.min(o.material.opacity,Math.max(0,e.life*2));});
  }
  for(const [f,v]of this.fieldObjects)if(!j.fields.includes(f)){this.disposeGroup(v);this.fieldObjects.delete(f);}
  for(const f of j.fields)if(!this.fieldObjects.has(f)){const v=new T.Group();const honey=new T.Mesh(new T.CircleGeometry(f.r,40),new T.MeshBasicMaterial({color:0xe8b65a,transparent:true,opacity:.42,side:T.DoubleSide,depthWrite:false}));honey.rotation.x=-Math.PI/2;v.add(honey);v.position.set(f.x,terrainHeight(f.x,f.z)+.1,f.z);this.scene.add(v);this.fieldObjects.set(f,v);}
  this.rivalView.visible=!!j.event;if(j.event){this.rivalView.position.set(j.rival.x,terrainHeight(j.rival.x,j.rival.z),j.rival.z);while(this.nutViews.length<12){const n=this.mesh(new T.IcosahedronGeometry(.3,1),0xffd078,0,0,0);n.material.emissive.set(0x8e6023);this.nutViews.push(n);}}
  this.nutViews.forEach((v,i)=>{const n=j.event?.nuts[i],elapsed=j.event?30-j.event.left:0;v.visible=!!n&&!n.taken&&!n.lost&&elapsed>=n.at;if(v.visible){v.position.set(n.x,terrainHeight(n.x,n.z)+.5+Math.max(0,.8-(elapsed-n.at))*7,n.z);v.rotation.y=this.t;}});
  this.ripples.forEach((r,i)=>{r.material.opacity=.18+Math.sin(this.t*1.2+i)*.1;});
  const head=new T.Vector3(p.x,p.y+1.2,p.z),delta=head.clone().sub(this.camera.position),ray=new T.Raycaster(this.camera.position,delta.clone().normalize(),0,delta.length()),hits=new Set(ray.intersectObjects(this.foliage,false).map(h=>h.object));
  for(const f of this.foliage){f.material.transparent=true;f.material.opacity=hits.has(f)?.2:1;f.material.depthWrite=!hits.has(f);}
  this.renderer.render(this.scene,this.camera);
 }
 dispose(){for(const tx of Object.values(this.textures||{}))tx.dispose();this.bubbleGeo?.dispose();this.bubbleMat?.dispose();super.dispose();}
}
