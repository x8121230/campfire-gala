// World coordinates are actual meters: x/east, y/up, z/south. No screen-space fake terrain.
export const SPOTS = Object.freeze({
 keeper:{x:-10,z:5,name:'榛果爺爺'},jam:{x:-11,z:-8,name:'纏住齒輪的夢藤'},
 valve:{x:10.2,z:-6.3,name:'星芽引水閘'},mill:{x:-4.4,z:4,name:'沉睡的水車'},
 lift:{x:13,z:-5.5,name:'樹屋滑索'},home:{x:-9,z:7,name:'營地'},
});
export const FIREFLIES=[{x:-14,z:-3},{x:5,z:10},{x:14,z:-13}];
export const BLOCKS=[{x:-13,z:8,r:2},{x:-8,z:10,r:1.2},{x:14,z:-7.5,r:1.2},{x:6,z:-12,r:1.1}];
export function heightAt(x,z,shortcut=false){
 if(Math.abs(x)>17||Math.abs(z)>15)return null;
 if(x>-2.1&&x<2.1){
  if(Math.abs(z)<=1.25)return .15+1.0*Math.cos(x/2.1*Math.PI/2);
  if(shortcut&&Math.abs(z-10)<=1.2)return .12;
  return null;
 }
 if(x>=8&&z<=-4)return 3;
 if(x>=9&&x<=12&&z>-4&&z<4)return 3*(4-z)/8;
 return 0;
}
export function screenToWorld(x,y){return {x:(x+y)*Math.SQRT1_2,z:(y-x)*Math.SQRT1_2};}
export class RealmJourney{
 constructor(saved){
  this.player={x:-8,z:5,y:0};this.stage=0;this.fan=false;this.gear=false;this.water=false;this.complete=false;this.shortcut=false;this.found=[];this.steps=[];this.time=0;
  if(saved&&saved.v===1){this.stage=Math.max(0,Math.min(4,Math.floor(Number(saved.stage)||0)));this.fan=this.stage>=1;this.gear=this.stage>=2;this.water=this.stage>=3;this.complete=this.stage>=4;this.shortcut=this.water;this.found=Array.isArray(saved.found)?[...new Set(saved.found.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[];}
 }
 export(){return {v:1,stage:this.stage,found:[...this.found]};}
 move(dt,axis,run=false){dt=Math.min(.05,Math.max(0,dt));this.time+=dt;let l=Math.hypot(axis.x,axis.y);if(l<.08)return false;const w=screenToWorld(axis.x/Math.max(1,l),axis.y/Math.max(1,l)),step=(run?5.4:3.6)*dt;let moved=false;
  for(const key of ['x','z']){const p={...this.player,[key]:this.player[key]+w[key]*step};const h=heightAt(p.x,p.z,this.shortcut);if(h===null||Math.abs(h-this.player.y)>.3||BLOCKS.some(b=>Math.hypot(p.x-b.x,p.z-b.z)<b.r+.28))continue;this.player[key]=p[key];this.player.y=h;moved=true;}return moved;
 }
 nearby(){let best=null,d=2;for(const [id,p]of Object.entries(SPOTS)){if(id==='home')continue;const h=heightAt(p.x,p.z,this.shortcut);const n=Math.hypot(p.x-this.player.x,p.z-this.player.z);if(n<d&&Math.abs(h-this.player.y)<1){best=id;d=n;}}return best;}
 act(id,tool=false){if(this.nearby()!==id)return {message:'再靠近一點，就能互動。'};
  if(id==='keeper'){if(!this.stage){this.stage=1;this.fan=true;return {changed:true,title:'接下委託 · 沉睡的水車',message:'水車停了，樹屋的星燈也熄了。帶上引風扇，先去營地北方吹開夢藤，找回齒輪；再過橋到東岸，沿坡道登上樹屋高台。'};}return {title:'榛果爺爺',message:this.complete?'星芽谷又亮起來了！還有三隻迷路螢火蟲等你發現。':'夢藤在營地北方。東岸高台要從南側的木坡道上去；古老石碑記著引水閘的順序。'};}
  if(id==='jam'){if(!this.fan)return {message:'柔軟的藤蔓怕風。先問問營地的榛果爺爺。'};if(this.gear)return {message:'齒輪已放進背包，去東岸高台看看。'};if(!tool)return {message:'按右側「引風」吹開藤蔓，就能取出齒輪。'};this.gear=true;this.stage=2;return {changed:true,title:'找回星芽齒輪',message:'藤蔓隨風散開，齒輪回到背包。越過拱橋，從東岸南側坡道登上高台，修復引水閘。'};}
  if(id==='valve'){if(!this.gear)return {message:'機關缺少校準齒輪。先吹開西岸的夢藤。'};if(this.water)return {message:'引水閘已啟動。樹屋滑索能直接回營地。'};return {puzzle:true};}
  if(id==='mill'){if(!this.water)return {message:'水車需要齒輪與水流。先調查西岸夢藤，再去東岸高台開閘。'};if(this.complete)return {message:'水車正在轉動，星燈會一直亮著。'};this.complete=true;this.stage=4;return {changed:true,win:true,title:'星芽谷甦醒了！',message:'水車、星燈和南邊的浮橋都恢復了。這是幻界的第一段故事；你可以繼續探索，尋找三隻螢火蟲。'};}
  if(id==='lift'){if(!this.water)return {message:'滑索安全鎖還沒供能，先啟動高台的引水閘。'};this.player={x:-8,z:5,y:0};return {travel:true,message:'搭乘樹屋滑索，回到星芽營地。'};}
  return {};
 }
 rune(symbol){if(this.nearby()!=='valve'||!this.gear||this.water)return {message:'先靠近高台的引水閘。'};const answer=['leaf','moon','star'];if(symbol!==answer[this.steps.length]){this.steps=[];return {wrong:true,message:'光芒散去了。石碑說：葉先醒來，月接住露水，星才亮起。'};}this.steps.push(symbol);if(this.steps.length===3){this.water=true;this.shortcut=true;this.stage=3;return {changed:true,message:'引水閘啟動！南側浮橋升起，樹屋滑索解鎖。回到西岸水車完成修復。'};}return {message:`已點亮 ${this.steps.length} / 3 枚符印。`};}
 collect(){const i=FIREFLIES.findIndex((f,i)=>!this.found.includes(i)&&Math.hypot(f.x-this.player.x,f.z-this.player.z)<1.2&&Math.abs(heightAt(f.x,f.z,this.shortcut)-this.player.y)<.5);if(i<0)return false;this.found.push(i);return true;}
 objective(){return ['與營地的榛果爺爺交談','去西岸北方，使用引風吹開夢藤','過拱橋，沿東岸坡道登高開閘','回到西岸水車，安裝齒輪','自由探索 · 尋找三隻螢火蟲'][this.stage];}
}
