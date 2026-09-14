// Runtime sprite loading: color-key backgrounds are never drawn on the game canvas.
// The generated source sheets are retained intact; crop and matte happen in memory.
const REFERENCE_SIZE=[1448,1086];
export const ATLAS_CROPS=[
 [0,0,395,425],[391,97,318,323],[724,10,359,416],[1090,108,357,306],
 [99,423,209,342],[392,434,291,329],[747,429,318,335],[1117,425,296,326],
 [87,776,218,294],[418,779,285,274],[764,787,281,274],[1080,741,368,338]
];
export function keyedCanvas(image,rect,mode='neutral',trim=true,mainComponent=false){
 const c=document.createElement('canvas');c.width=Math.ceil(rect[2]);c.height=Math.ceil(rect[3]);const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,...rect,0,0,c.width,c.height);
 const data=g.getImageData(0,0,c.width,c.height),px=data.data,w=c.width,h=c.height;
 if(mode==='magenta'){
  for(let i=0;i<px.length;i+=4){const r=px[i],green=px[i+1],b=px[i+2];if(r>130&&b>120&&Math.min(r,b)-green>65)px[i+3]=0;}
 }else{
  // Edge-connected neutral backdrop removal preserves white eyes and cream fur.
  const marked=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  const add=n=>{if(n<0||n>=w*h||marked[n])return;marked[n]=1;const i=n*4,r=px[i],green=px[i+1],b=px[i+2];if(Math.min(r,green,b)>183&&Math.max(r,green,b)-Math.min(r,green,b)<30){px[i+3]=0;queue[tail++]=n;}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(head<tail){const n=queue[head++],x=n%w;if(x>0)add(n-1);if(x<w-1)add(n+1);add(n-w);add(n+w);}
 }
 if(mainComponent){
  // A neighboring tree slightly crosses the mushroom cell. Keep its main cluster.
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
  for(let start=0;start<w*h;start++){
   if(seen[start]||px[start*4+3]<11)continue;
   let head=0,tail=1;queue[0]=start;seen[start]=1;
   const add=n=>{if(n>=0&&n<w*h&&!seen[n]&&px[n*4+3]>10){seen[n]=1;queue[tail++]=n;}};
   while(head<tail){const n=queue[head++],x=n%w;if(x>0)add(n-1);if(x<w-1)add(n+1);add(n-w);add(n+w);}
   if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
  }
  const keep=new Uint8Array(w*h);for(const n of largest)keep[n]=1;
  for(let n=0;n<w*h;n++)if(!keep[n])px[n*4+3]=0;
 }
 g.putImageData(data,0,0);if(!trim)return c;
 let x0=w,y0=h,x1=0,y1=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>10){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const out=document.createElement('canvas');out.width=Math.max(1,x1-x0+1);out.height=Math.max(1,y1-y0+1);out.getContext('2d').drawImage(c,x0,y0,out.width,out.height,0,0,out.width,out.height);return out;
}
export function prepareAtlas(image){return ATLAS_CROPS.map((rect,index)=>keyedCanvas(image,rect.map((v,i)=>v*image[i%2?'height':'width']/REFERENCE_SIZE[i%2]),'neutral',true,index===1));}
export function prepareHero(image){return keyedCanvas(image,[0,0,image.width,image.height],'magenta',false);}
