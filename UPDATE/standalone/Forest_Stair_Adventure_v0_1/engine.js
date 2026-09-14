(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class Game {
  constructor(options={}){this.mode=options.mode||'child';this.course=options.course||'grass';this.random=options.random||Math.random;this.events=[];this.reset();}
  emit(type,data={}){this.events.push({type,...data});}
  reset(){this.time=0;this.camera=0;this.depth=0;this.combo=0;this.best=0;this.acorns=0;this.rescues=0;this.streak=0;this.magicUntil=0;this.cooldown=0;this.state='play';this.nextRest=10;this.platforms=[];this.lastX=300;this.nextId=0;this.player={x:300,y:200,vy:0,on:null};this.add(300,200,190,'grass');for(let i=1;i<14;i++)this.generate();this.player.on=this.platforms[0];this.emit('start');}
  add(x,y,w,type){const p={id:this.nextId++,x,y,w,type,base:x,used:false,touched:null,gone:false,coin:true,dir:this.random()<.5?-1:1};this.platforms.push(p);return p;}
  generate(){const baby=this.mode==='baby',i=this.nextId;const last=this.platforms[this.platforms.length-1];const step=(this.random()<.5?-1:1)*(95+this.random()*30);const x=clamp(this.lastX+step,115,485);this.lastX=x;const kinds=['grass','mushroom','leaf','water','honey'];let type='grass';if(!baby&&this.course!=='grass'&&i>4&&i%3===0)type=kinds[1+Math.floor(this.random()*4)];this.add(x,last.y+85,baby?205:160,type);}
  magic(){if(this.state!=='play'||this.time<this.cooldown)return;this.magicUntil=this.time+8;this.cooldown=this.time+15;this.emit('magic');}
  rescue(){this.rescues++;this.streak++;this.combo=0;let p=this.platforms.find(q=>!q.gone&&q.y-this.camera>265&&q.y-this.camera<520);if(!p)p=this.add(300,this.camera+380,220,'grass');p.type='grass';p.gone=false;p.touched=null;p.w=Math.max(220,p.w);this.player.x=p.x;this.player.y=p.y;this.player.vy=0;this.player.on=p;this.emit('rescue');if(this.streak>=2){this.cooldown=0;this.magic();}}
  resume(){if(this.state==='rest'){this.state='play';this.nextRest+=10;this.emit('continue');}}
  tick(dt,direction){if(this.state!=='play')return;dt=clamp(dt,0,1/30);this.time+=dt;const baby=this.mode==='baby',u=this.player;const speed=baby?30:Math.min(72,40+this.depth*.45);this.camera+=speed*dt;
   for(const p of this.platforms){if(p.touched!==null&&p.type==='leaf'&&this.time-p.touched>1.5&&this.time>this.magicUntil)p.gone=true;}
   const oldY=u.y;const oldOn=u.on;const safe=this.time<this.magicUntil;const honey=u.on&&u.on.type==='honey'&&!safe;u.x+=direction*(baby?180:235)*(honey?.52:1)*dt;
   if(u.on&&u.on.type==='water'&&!safe)u.x+=u.on.dir*50*dt;
   if(baby){if(u.x<12){u.x=588;this.emit('wrap');}if(u.x>588){u.x=12;this.emit('wrap');}}else u.x=clamp(u.x,12,588);
   if(u.on&&(u.on.gone||Math.abs(u.x-u.on.x)>u.on.w/2+7))u.on=null;
   if(!u.on){u.vy+=850*dt;u.y+=u.vy*dt;if(u.vy>=0){const candidates=this.platforms.filter(p=>!p.gone&&oldY<=p.y+.1&&u.y>=p.y&&Math.abs(u.x-p.x)<p.w/2+9).sort((a,b)=>a.y-b.y);if(candidates.length){const p=candidates[0];u.y=p.y;u.vy=0;u.on=p;this.land(p,safe);}}}
   else {u.y=u.on.y;u.vy=0;}
   if(u.y-this.camera<68||u.y-this.camera>770)this.rescue();
   if(u.on&&this.player.on===oldOn&&!u.on.used)this.land(u.on,safe);
   this.platforms=this.platforms.filter(p=>p.y>this.camera-140||p===u.on);while(this.platforms.at(-1).y<this.camera+1200)this.generate();
  }
  land(p,safe){const u=this.player;p.touched=p.touched===null?this.time:p.touched;if(!p.used){p.used=true;this.depth=Math.max(this.depth,p.id);this.combo++;this.best=Math.max(this.best,this.combo);if(this.combo>=3)this.streak=0;if(p.coin){p.coin=false;this.acorns++;}this.emit('land',{combo:this.combo,kind:p.type});if(this.course!=='endless'&&this.depth>=30){this.state='complete';this.emit('complete');return;}if(this.depth>=this.nextRest){this.state='rest';this.emit('rest');return;}}
   if(p.type==='mushroom'&&!safe){u.vy=-240;u.on=null;this.emit('bounce');}
  }
 }
 root.StairGame=Game;if(typeof module!=='undefined')module.exports=Game;
})(typeof globalThis!=='undefined'?globalThis:window);
