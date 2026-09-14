// High-detail art uses the existing world rectangle. No collision or portal transforms.
export const DETAIL_TILES = Object.freeze(Array.from({length:18},(_,i)=>{
  const tile=Math.floor(i/2),half=i%2;
  return {id:`${tile}-${half}`,x:(tile%3)*1576+half*788,y:Math.floor(tile/3)*888,width:788,height:888};
}));
export class HillsDetailTiles {
  constructor(loader){this.loader=loader;this.cache=new Map();this.pending=new Set();this.failed=new Map();this.disposed=false;}
  draw(ctx,view,width,height,dt=0){
    if(this.disposed)return;
    const visible=DETAIL_TILES.filter(t=>t.x+t.width>=view.x-width/view.scale/2&&t.x<=view.x+width/view.scale/2&&t.y+t.height>=view.y-height/view.scale/2&&t.y<=view.y+height/view.scale/2);
    const wanted=new Set(visible.map(t=>t.id));
    for(const t of visible){
      const entry=this.cache.get(t.id);
      if(entry){entry.age+=Math.max(0,dt);this.cache.delete(t.id);this.cache.set(t.id,entry);ctx.save();ctx.globalAlpha=Math.min(1,entry.age/.2);ctx.drawImage(entry.image,t.x,t.y,t.width,t.height);ctx.restore();continue;}
      if(this.pending.size>=2||this.pending.has(t.id)||(this.failed.get(t.id)||0)>Date.now())continue;
      this.pending.add(t.id);
      this.loader(`../../assets/phantom-realm/dawn-dandelion-hills/map-v318/${t.id}.webp`).then(image=>{
        if(!this.disposed)this.cache.set(t.id,{image,age:0});
      }).catch(()=>{if(!this.disposed)this.failed.set(t.id,Date.now()+30000);}).finally(()=>this.pending.delete(t.id));
    }
    for(const [id]of this.cache){if(this.cache.size<=8)break;if(!wanted.has(id))this.cache.delete(id);}
  }
  dispose(){this.disposed=true;this.cache.clear();this.pending.clear();this.failed.clear();}
}
