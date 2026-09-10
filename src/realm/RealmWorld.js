import * as T from '../vendor/three.module.js';
import {SPOTS,FIREFLIES,heightAt} from './RealmRules.js';
export class RealmWorld{
 constructor(canvas){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.scene=new T.Scene();this.scene.background=new T.Color('#b4d7cb');this.scene.fog=new T.Fog('#b4d7cb',48,95);this.camera=new T.OrthographicCamera(-15,15,8.5,-8.5,.1,120);this.materials=[];this.foliage=[];this.t=0;this.overview=false;
  this.scene.add(new T.HemisphereLight(0xfff3d3,0x467b83,2.5));const sun=new T.DirectionalLight(0xffe5b5,3);sun.position.set(-12,28,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:70});sun.shadow.bias=-.001;this.scene.add(sun);
  this.makeLand();this.makeVillage();this.makeLife();this.target=new T.Vector3(-8,0,5);this.camera.position.set(12,28,25);this.camera.lookAt(this.target);
 }
 mat(color,extra={}){const m=new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,...extra});this.materials.push(m);return m;}
 mesh(geo,color,x,y,z,parent=this.scene,extra={}){const m=new T.Mesh(geo,this.mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(x,y,z,w,h,d,color,parent){return this.mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent);}
 cylinder(x,y,z,r,h,color,parent){return this.mesh(new T.CylinderGeometry(r*.85,r,h,10),color,x,y,z,parent);}
 ball(x,y,z,r,color,parent){return this.mesh(new T.IcosahedronGeometry(r,1),color,x,y,z,parent);}
 label(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='rgba(26,61,53,.88)';ctx.beginPath();ctx.roundRect(4,8,504,80,28);ctx.fill();ctx.font='bold 40px sans-serif';ctx.fillStyle='#fff0c4';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const sp=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:false,transparent:true}));sp.position.set(x,y,z);sp.scale.set(4.8,.9,1);sp.renderOrder=5;this.scene.add(sp);return sp;}
 path(points,width=1.7,color=0xc9b38a){const verts=[],idx=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;for(const sign of [-1,1]){const x=p[0]+sign*dz/l*width/2,z=p[1]-sign*dx/l*width/2;verts.push(x,(heightAt(x,z,true)??0)+.035,z);}if(i){const j=i*2;idx.push(j-2,j-1,j,j-1,j+1,j);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return this.mesh(g,color,0,0,0,this.scene,{side:T.DoubleSide});}
 makeLand(){
  this.box(0,-1.5,0,35,2,31,0x7b7662);this.box(-9.55,-.1,0,14.9,.2,30,0x7ca866);this.box(9.55,-.1,0,14.9,.2,30,0x8aac70);
  this.water=this.box(0,-.32,0,4.2,.16,30,0x56aeb5,undefined);this.water.material.metalness=.25;this.water.material.roughness=.27;
  this.ripples=[];for(let i=0;i<22;i++){const w=this.box(Math.sin(i*4)*1.4,-.222,-14+i*1.3,.45,.012,.07,0xb0e1d4);w.castShadow=false;this.ripples.push(w);}
  for(let i=0;i<34;i++){const z=-14+i*.86;if(Math.abs(z)<1.5||Math.abs(z-10)<1.3)continue;for(const x of [-2.3,2.3]){const r=this.ball(x,-.06,z,.22+(i%3)*.04,0xa4b29c);r.scale.y=.65;}}

  this.box(12.5,1.48,-9.5,9,3,11,0x899b80);this.box(12.5,3.01,-9.5,9,.1,11,0x9ab778);
  // Solid wedge: 3 meters of elevation along the south approach, matching collision height.
  const vs=[9,0,4,12,0,4,9,3,-4,12,3,-4,9,0,-4,12,0,-4];const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vs,3));geo.setIndex([0,2,1,1,2,3,0,4,2,1,3,5,2,4,3,3,4,5]);geo.computeVertexNormals();this.mesh(geo,0xb4956d,0,.02,0,this.scene,{side:T.DoubleSide});
  for(let i=0;i<16;i++)this.box(10.5,3*i/16+.065,4-8*i/16,3.08,.09,.11,0xd6bd8a);
  for(const x of [9,12])for(let i=0;i<5;i++){const z=4-i*2,h=3*i/4;this.box(x,h+.5,z,.12,1,.12,0x765d46);}
  // Real arched footbridge with deck boards, legs and railings.
  for(let i=0;i<20;i++){const x=-2.1+(i+.5)*4.2/20,y=.15+Math.cos(x/2.1*Math.PI/2);const plank=this.box(x,y-.08,0,.23,.18,2.5,0xd9ba81);plank.rotation.z=-Math.sin(x/2.1*Math.PI/2)*.6;}
  for(const z of [-1.23,1.23]){const pts=[];for(let i=0;i<=16;i++){const x=-2.1+i*4.2/16;pts.push(new T.Vector3(x,1.1+Math.cos(x/2.1*Math.PI/2),z));}const curve=new T.CatmullRomCurve3(pts);this.mesh(new T.TubeGeometry(curve,24,.075,5,false),0x846447,0,0,0);for(const x of [-2,-1,0,1,2])this.box(x,.65+Math.cos(x/2.1*Math.PI/2),z,.13,1.15,.13,0x9a744d);}
  this.shortBridge=new T.Group();this.scene.add(this.shortBridge);for(let i=0;i<12;i++)this.box(-2.1+i*.38,.05,10,.4,.2,2.3,0xc4a977,this.shortBridge);this.shortBridge.visible=false;
  this.path([[-14,5],[-10,5],[-6,3],[-3,0]],2.1);this.path([[-10,5],[-12,0],[-11,-8]],1.3);this.path([[3,0],[6,1],[10.5,4],[10.5,0],[10.5,-4],[10.2,-6.3]],1.5);this.path([[5,1],[5,10]],1.3);
  let seed=33;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<210;i++){const x=rnd()*33-16.5,z=rnd()*29-14.5,h=heightAt(x,z);if(h===null||Math.abs(x)<3||Math.abs(z)<2||x>8&&x<13&&z>-5&&z<5)continue;if(i%5===0)this.ball(x,h+.09,z,.12,[0xf2db9a,0xf5adc2,0xd2d9f5][i%3]);else{const g=this.mesh(new T.ConeGeometry(.08,.35,3),0x527d50,x,h+.15,z);g.rotation.z=.2;}}
  for(const [x,z]of [[-14,-4],[-9,-10],[5,10],[14,-13]]){const y=heightAt(x,z)||0;for(let i=0;i<3;i++){this.cylinder(x+i*.35,y+.22,z+i*.2,.09,.44,0xffe4bc);const cap=this.ball(x+i*.35,y+.47,z+i*.2,.3,0xd49ea8);cap.scale.y=.48;}}
  for(let i=0;i<28;i++){const x=i%2?16:-16,z=-14+Math.floor(i/2)*2.15;if(x>0&&z< -4)this.tree(x,z,3,.8);else this.tree(x,z,0,.8);}
  for(const [x,z,s]of [[-13,8,1.3],[-8,10,.8],[-15,-10,1],[-6,-12,.9],[6,-12,.8],[14,-7.5,1.4],[6,13,1],[-12,13,.8]])this.tree(x,z,heightAt(x,z)||0,s);
 }
 tree(x,z,y,s=1){const trunk=this.cylinder(x,y+1.3*s,z,.36*s,2.6*s,0x826344);const canopy=this.ball(x,y+3.1*s,z,1.55*s,0x47775b);canopy.scale.set(1,1.1,1);this.foliage.push(canopy);const top=this.ball(x-.45*s,y+4*s,z-.1,1.0*s,0x709553);this.foliage.push(top);return trunk;}
 makeVillage(){
  // Timber cottage and little market: real walls, roof, beams, windows.
  const house=new T.Group();house.position.set(-13,0,8);this.scene.add(house);this.foliage.push(this.box(0,1.35,0,3.2,2.7,3.1,0xf3dfad,house));const roof=this.mesh(new T.ConeGeometry(2.75,1.9,4),0x798d73,0,3.45,0,house);roof.rotation.y=Math.PI/4;this.foliage.push(roof);
  for(const x of [-1.5,1.5])for(const z of [-1.5,1.5])this.box(x,1.3,z,.17,2.7,.17,0x886645,house);this.box(0,.95,1.57,.85,1.9,.1,0x77543e,house);this.box(1,1.6,1.59,.65,.7,.12,0xffd987,house);this.box(-1,1.6,1.59,.65,.7,.12,0xffd987,house);
  this.cylinder(-10,.32,5,.45,.64,0x8f6e4d);this.ball(-10,1,5,.46,0xbb8b63);this.ball(-10,1.52,5,.49,0xcc9b70);for(const x of [-10.3,-9.7])this.ball(x,1.92,5,.17,0xaa7957);this.box(-10,1,4.57,.6,.55,.1,0x69877c);this.label('榛果爺爺',-10,2.5,5);this.ball(-10.15,1.58,5.42,.055,0x283d32);this.ball(-9.85,1.58,5.42,.055,0x283d32);this.ball(-10,1.42,5.46,.15,0xe2bd8d);this.ball(-10,1.49,5.58,.065,0x40352e);
  // Treehouse platform on the high ground.
  this.cylinder(14,5,-7.5,.65,4,0x826344);this.box(13.6,4.65,-7.5,4.4,.26,3.8,0xbf9a67);this.foliage.push(this.box(14,5.65,-8,2.6,1.8,2.3,0xe4c693));const roof2=this.mesh(new T.ConeGeometry(2.4,1.6,5),0x657f6e,14,7.3,-8);this.foliage.push(roof2);this.box(14,5.6,-6.81,.7,1.3,.08,0x947052);this.label('星芽樹屋',13,8.5,-8);
  // Ground-level entry cabin sits on plateau; stairs visually lead onto balcony.
  for(let i=0;i<6;i++)this.box(13,3+i*.26,-5.3-i*.26,1.5,.22,.4,0xc9a271);
  this.wheel=new T.Group();this.wheel.position.set(-3.15,1.25,4);this.scene.add(this.wheel);const ring=this.mesh(new T.TorusGeometry(1.05,.13,6,16),0x8b6946,0,0,0,this.wheel);ring.rotation.y=Math.PI/2;for(let i=0;i<8;i++){const spoke=this.box(0,0,0,.14,2.05,.12,0xaf8b56,this.wheel);spoke.rotation.x=i*Math.PI/4;const a=i*Math.PI/4;const paddle=this.box(0,Math.cos(a)*1.05,Math.sin(a)*1.05,.9,.22,.45,0xc7a474,this.wheel);paddle.rotation.x=-a;}
  this.box(-4.5,.65,4,1,1.3,1.2,0x7b9180);this.label('星芽水車',-4.5,2.6,4);
  this.valves=[];for(let i=0;i<3;i++){const x=9+i*1.15;this.cylinder(x,3.4,-6.3,.42,.8,0x819887);const gem=this.mesh(new T.OctahedronGeometry(.42),[0xb1d781,0xb7d9f3,0xffd178][i],x,4.1,-6.3);this.valves.push(gem);}
  this.label('葉 → 月 → 星',10.2,7.1,-6.3);this.box(10.2,3.12,-6.3,4,.2,1.6,0x658876);
  this.jam=new T.Group();this.jam.position.set(-11,0,-8);this.scene.add(this.jam);this.cylinder(0,.3,0,.65,.6,0x856447,this.jam);this.gear=this.mesh(new T.TorusGeometry(.38,.12,5,8),0xf9d380,0,1.1,0,this.jam);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.ball(Math.cos(a)*.55,.65,Math.sin(a)*.55,.4,0x926c9d,this.jam);}this.label('夢藤齒輪',-11,2.1,-8);
  this.lanterns=[];for(const [x,z]of [[-8,4],[-5,1],[4,1],[10.5,4],[13,-5.5]]){const y=heightAt(x,z)||0;this.cylinder(x,y+.95,z,.08,1.9,0x7c7152);const g=this.ball(x,y+2,z,.22,0x97bfa9);this.lanterns.push(g);}
  const cable=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(13,5,-5.5),new T.Vector3(-8,2,5)]),new T.LineBasicMaterial({color:0x6f7b71}));this.scene.add(cable);this.label('滑索',13,4.7,-5.1);
 }
 makeLife(){this.flyViews=FIREFLIES.map(f=>{const g=this.ball(f.x,(heightAt(f.x,f.z)||0)+1,f.z,.2,0xffe9a6);g.material.emissive.set(0xffdd88);g.material.emissiveIntensity=1;return g;});this.shadow=this.mesh(new T.CircleGeometry(.38,20),0x23413b,0,.04,0,this.scene,{transparent:true,opacity:.25,depthWrite:false});this.shadow.rotation.x=-Math.PI/2;this.ring=this.mesh(new T.TorusGeometry(.5,.025,4,32),0xfff0b0,0,.08,0);this.ring.rotation.x=-Math.PI/2;}
 async load(){this.texture=await new T.TextureLoader().loadAsync(new URL('../../assets/phantom-realm/hero-directions.png',import.meta.url).href);this.texture.colorSpace=T.SRGBColorSpace;this.texture.magFilter=T.LinearFilter;this.texture.minFilter=T.LinearFilter;this.texture.generateMipmaps=false;this.texture.repeat.set(.25,.5);this.hero=new T.Sprite(new T.SpriteMaterial({map:this.texture,transparent:true,alphaTest:.08,depthWrite:true}));this.hero.center.set(.5,.065);this.hero.scale.set(1.9,3.8,1);this.scene.add(this.hero);}
 resize(w,h){this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.projection();}
 projection(){const h=this.overview?25:(this.height<500?8.5:10.5),a=this.width/this.height;Object.assign(this.camera,{left:-h*a,right:h*a,top:h,bottom:-h});this.camera.updateProjectionMatrix();}
 render(j,dt,axis,moving){this.t+=dt;this.ripples.forEach((r,i)=>{r.position.z=-14+((i*1.3+this.t*.45)%28);});const p=j.player;const goal=this.overview?new T.Vector3(0,0,-1):new T.Vector3(p.x,p.y+.7,p.z);this.target.lerp(goal,1-Math.exp(-dt*7));this.camera.position.copy(this.target).add(new T.Vector3(20,Math.sqrt(800),20));this.camera.lookAt(this.target);
  if(this.hero){if(moving){if(Math.abs(axis.x)>Math.abs(axis.y))this.face=axis.x>0?1:3;else this.face=axis.y>0?0:2;}const walk=moving&&Math.floor(this.t*7)%2;this.texture.offset.set((this.face||0)*.25,walk?0:.5);this.hero.position.set(p.x,p.y+.04+(moving?Math.abs(Math.sin(this.t*10))*.055:0),p.z);}
  this.shadow.position.set(p.x,p.y+.04,p.z);this.ring.position.set(p.x,p.y+.05,p.z);this.wheel.rotation.x+=j.water?dt*1.4:0;this.shortBridge.visible=j.shortcut;this.jam.visible=!j.gear;
  this.flyViews.forEach((g,i)=>{g.visible=!j.found.includes(i);g.position.y=(heightAt(FIREFLIES[i].x,FIREFLIES[i].z)||0)+1+Math.sin(this.t*2+i)*.22;});this.valves.forEach((v,i)=>{v.rotation.y+=dt;v.material.emissive.set(j.water||j.steps.length>i?0x7f8c55:0x000000);});this.lanterns.forEach(l=>{l.material.emissive.set(j.complete?0xffcc65:0x000000);});
  // Ray from camera to hero head: only obstructing crowns/roofs become translucent.
  const head=new T.Vector3(p.x,p.y+1.2,p.z),delta=head.clone().sub(this.camera.position),ray=new T.Raycaster(this.camera.position,delta.clone().normalize(),0,delta.length());const hits=new Set(ray.intersectObjects(this.foliage,false).map(h=>h.object));for(const f of this.foliage){f.material.transparent=true;f.material.opacity=hits.has(f)?.23:1;f.material.depthWrite=!hits.has(f);}
  this.renderer.render(this.scene,this.camera);
 }
 dispose(){const tx=new Set(),geo=new Set(),mat=new Set();this.scene.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){mat.add(m);if(m.map)tx.add(m.map);}});tx.forEach(t=>t.dispose());geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());this.texture?.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}
