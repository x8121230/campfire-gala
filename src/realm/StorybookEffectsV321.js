export const STORYBOOK_ASSETS=Object.freeze({pumpkinImpact:'../../assets/phantom-realm/dawn-dandelion-hills/art-v321/pumpkin-impact.png',storybookSlash:'../../assets/phantom-realm/dawn-dandelion-hills/art-v321/storybook-slash.png'});
export function mouseIdlePhase(clock,id=0){const seconds=Number.isFinite(clock)?clock:0;return (((seconds+Number(id||0)*.17)%2.8+2.8)%2.8)/2.8;}
const PUMPKINS=[[45,85,340,330,212,288],[460,85,340,330,628,288],[876,80,340,338,1046,290],[1295,85,336,330,1460,287]];
const CRACKS=[[50,575,306,220,201,710],[400,518,405,298,606,716],[810,513,446,315,1033,721],[1258,574,402,246,1456,722]];
export function impactFrame(age){return age<.09?0:age<.21?1:age<.4?2:3;}
export function drawPaintedImpact(ctx,atlas,fx){
 if(!atlas?.width||!(fx.life>0))return;
 const age=fx.maxLife-fx.life,i=impactFrame(age),[sx,sy,w,h,ax,ay]=CRACKS[i];
 const k=fx.kind==='pumpkinBurst'?.25:.52,fade=Math.min(1,Math.max(0,fx.life/.45));
 ctx.save();ctx.globalAlpha*=fade;ctx.drawImage(atlas,sx,sy,w,h,fx.x-(ax-sx)*k,fx.y-(ay-sy)*k,w*k,h*k);ctx.restore();
}
export function drawThrownPumpkin(ctx,atlas,shot,time){
 if(!atlas?.width)return false;
 const age=Math.max(0,(shot.maxLife||1)-shot.life),p=Math.min(1,age/(shot.maxLife||1));
 const i=Math.floor(age*9)%4,[sx,sy,w,h,ax,ay]=PUMPKINS[i],k=.19;
 const lift=36+Math.sin(p*Math.PI)*42;
 ctx.save();ctx.globalAlpha*=Math.min(1,Math.max(0,shot.life/.16));
 ctx.fillStyle='#53432a35';ctx.beginPath();ctx.ellipse(shot.x,shot.y,28,12,0,0,Math.PI*2);ctx.fill();
 ctx.translate(shot.x,shot.y-lift);ctx.rotate(Math.sin(age*6)*.18);
 ctx.drawImage(atlas,sx,sy,w,h,-(ax-sx)*k,-(ay-sy)*k,w*k,h*k);ctx.restore();return true;
}
export function slashAngle(dx,dy,swing){let target=Math.atan2(dy,dx);if(dx<0&&target>0)target-=Math.PI*2;let start=-Math.PI/2;if(dy<-.66)start=dx<0?-Math.PI:0;return start+(target-start)*Math.max(0,Math.min(1,swing));}
export function drawStorybookSlash(ctx,atlas,fx,pose){
 if(!atlas?.width||!pose)return;
 const dx=Number.isFinite(fx.dx)?fx.dx:1,dy=Number.isFinite(fx.dy)?fx.dy:0;
 const i=Number.isInteger(pose.frame)?Math.max(0,Math.min(3,pose.frame)):pose.swing<.025?0:pose.swing<.82?1:pose.wave<.5?2:3;
 const cw=atlas.width/2,ch=atlas.height/2,sx=(i%2)*cw,sy=Math.floor(i/2)*ch;
 const k=.22,anchorX=170,anchorY=i<2?280:285;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=Math.max(0,Math.min(1,pose.bladeAlpha));
 ctx.translate(fx.x+dx*38-dy*12,fx.y-67+dy*22);ctx.rotate(slashAngle(dx,dy,pose.swing));
 ctx.drawImage(atlas,sx,sy,cw,ch,-anchorX*k,-anchorY*k,cw*k,ch*k);ctx.restore();
}
