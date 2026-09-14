import RUNNER_SETTINGS from '../data/FernRunnerSettings.js';
import AudioSystem from '../systems/AudioSystem.js';
const W=1280,H=720,FLOOR=570,FONT='"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Base extends Phaser.Scene{
 text(x,y,t,size=22,color='#355b4b'){return this.add.text(x,y,t,{fontFamily:FONT,fontSize:size,color,fontStyle:'bold',align:'center',lineSpacing:8}).setOrigin(.5);}
 panel(x,y,w,h,color=0xfff8e6){return this.add.rectangle(x,y,w,h,color,.97).setStrokeStyle(2,0xcbd4b0);}
 button(x,y,w,label,fn,color=0x527e66){const c=this.add.container(x,y);c.add([this.add.rectangle(0,0,w,56,color).setStrokeStyle(2,0xb6ceb1),this.text(0,0,label,22,'#fff9e6')]);c.label=c.list[1];c.setSize(w,56).setInteractive({useHandCursor:true});c.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation();fn();});return c;}
}
export default class FernRunnerGame extends Base{
 constructor(){super('FernRunnerGame');}
 returnToMap(){this.tweens.resumeAll();this.scene.start('SubmapGames',this.theme==='sky'?{regionId:'cloud',submapId:'windchime_isle'}:{regionId:'dinosaur',submapId:'giant_fern_jungle'});}
 init(data){this.theme=data.theme==='sky'?'sky':'mud';this.child=!!data.child;this.cfg=RUNNER_SETTINGS[this.theme];this.startWithIntro=!!data.intro;}
 create(){
  AudioSystem.stopAllBgm(this);
  this.mode='playing';this.count=0;this.bonus=0;this.hearts=3;this.target=this.child?this.cfg.childGoal:this.cfg.normalGoal;this.distance=0;this.speed=this.cfg.speed;this.boost=0;this.immune=0;this.vy=0;this.grounded=true;this.jumps=0;this.buffer=0;this.coyote=0;this.elapsed=0;this.nextSpawn=220;this.index=0;this.objects=[];this.platforms=[];this.soundOn=true;this.overlay=null;this.soundNodes=new Set();this.support=null;
  this.background();this.shadow=this.add.ellipse(300,FLOOR+5,60,12,0x193e37,.22).setDepth(19);this.player=this.explorer(300,FLOOR).setDepth(40);this.label=this.text(300,FLOOR-126,'阿晨晨',18,this.theme==='sky'?'#fff2cc':'#315748').setDepth(41);
  this.hud();this.input.on('pointerdown',(_p,objects)=>{if(this.mode==='playing'&&!(objects||[]).length)this.jump();});
  this.keyHandler=e=>{if(e.repeat)return;if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();this.jump();}if(['KeyP','Escape'].includes(e.code)){this.mode==='paused'?this.resume():this.pause();}};this.input.keyboard.on('keydown',this.keyHandler);
  this.blur=()=>this.pause();this.visibility=()=>{if(document.hidden)this.pause();};this.game.events.on('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.input.keyboard.off('keydown',this.keyHandler);this.game.events.off('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);this.stopAudio();});
  if(this.startWithIntro)this.intro();
 }
 background(){
  const sky=this.theme==='sky',g=this.add.graphics();g.fillGradientStyle(sky?0x17284e:0x93c5b2,sky?0x344476:0xb3d9c2,sky?0x826b9e:0xd1e6b5,sky?0x536b99:0x82b99c,1).fillRect(0,0,W,H);
  this.far=[];this.near=[];
  if(sky){
   g.fillStyle(0xfff0bf,.9).fillCircle(1060,200,46);g.fillStyle(0x33416a).fillCircle(1078,188,43);
   for(let i=0;i<90;i++)g.fillStyle(i%2?0xc7e9ee:0xffefc3,.3+(i%4)*.15).fillCircle((i*197)%1280,110+(i*83)%380,1+i%2);
   for(let i=0;i<6;i++){const a=this.add.ellipse(100+i*260,230+(i%3)*45,580,65,i%2?0x9be3cb:0xb0a6ea,.11).setAngle(-18);this.far.push(a);}
   for(let i=0;i<7;i++){const c=this.cloud(i*235,600,1.2).setDepth(5);this.near.push(c);}
   g.fillStyle(0xcccde7).fillRect(0,FLOOR,1280,75);g.fillStyle(0xf6efec).fillRect(0,FLOOR,1280,8);
  }else{
   g.fillStyle(0x68a58d,.8).fillEllipse(200,420,800,450).fillEllipse(1000,430,900,540);
   g.fillStyle(0xdef6db,.4).fillTriangle(700,190,770,190,660,525).fillTriangle(720,190,900,190,690,525);
   g.fillStyle(0x85d6d7,.75).fillRect(710,252,72,250);g.fillStyle(0xe1ffed,.7).fillRect(731,252,17,250);g.fillStyle(0xc4eddf).fillEllipse(749,501,175,24);
   for(let i=0;i<8;i++)this.far.push(this.fern(i*190,485,.9).setDepth(3));
   for(let i=0;i<5;i++)this.near.push(this.fern(i*335,580,1.4).setDepth(6));
   g.fillStyle(0x80ac70).fillRect(0,526,W,44);g.fillStyle(0xb18d62).fillRect(0,FLOOR,W,90);g.fillStyle(0xe3be87).fillRect(0,FLOOR,W,8);
  }
  this.pebbles=[];for(let i=0;i<22;i++)this.pebbles.push(this.add.ellipse(i*65,590+(i%3)*19,14,4,sky?0xf2e7fc:0xe3c59b,.55));
 }
 fern(x,y,scale){const c=this.add.container(x,y),g=this.add.graphics();g.lineStyle(5,0x416d4d).beginPath().moveTo(0,0).lineTo(0,-145).strokePath();for(let i=0;i<8;i++){const yy=-20-i*16,w=75-i*7;g.fillStyle(i%2?0x4e9162:0x77ab69).fillEllipse(-w*.42,yy,w,15).fillEllipse(w*.42,yy-7,w,15);}c.add(g);return c.setScale(scale);}
 cloud(x,y,scale=1){const c=this.add.container(x,y),g=this.add.graphics();g.fillStyle(0xf2eaf9,.95).fillEllipse(0,7,200,38).fillCircle(-50,-3,28).fillCircle(0,-14,36).fillCircle(47,-4,27);g.fillStyle(0xbcc9e9,.6).fillEllipse(0,20,167,13);c.add(g);return c.setScale(scale);}
 explorer(x,y){const c=this.add.container(x,y);this.legs=[-1,1].map(side=>{const g=this.add.graphics({x:side*12,y:-27});g.fillStyle(0xf1c5a3).fillRoundedRect(-6,0,12,23,5);g.fillStyle(0xcc8074).fillRoundedRect(-8,17,20,10,5);c.add(g);return g;});const g=this.add.graphics();g.fillStyle(0x5c4236).fillCircle(0,-88,24).fillEllipse(-24,-73,18,32).fillEllipse(24,-73,18,32);g.fillStyle(0xf0c6a8).fillCircle(0,-81,22);g.fillStyle(0x334238).fillCircle(-8,-83,3).fillCircle(8,-83,3);g.fillStyle(0xe99e91).fillEllipse(-13,-73,10,6).fillEllipse(13,-73,10,6);g.fillStyle(0xe5c578).fillRoundedRect(-22,-114,44,21,7).fillRoundedRect(-31,-98,62,8,4);g.fillStyle(this.theme==='sky'?0xaaa3d2:0x74a68a).fillRoundedRect(-22,-59,44,38,10);g.fillStyle(0xf0c6a8).fillRoundedRect(-30,-54,11,29,5).fillRoundedRect(19,-54,11,29,5);g.fillStyle(0xe7b46e).fillRoundedRect(-13,-46,26,21,5);g.fillStyle(0xd97d6b).fillTriangle(10,-63,46,-50,15,-48);c.add(g);return c;}
 hud(){this.panel(640,44,1248,64).setDepth(80);this.button(105,44,170,(this.theme==='sky'?'← 風鈴浮島':'← 巨蕨叢林'),()=>this.returnToMap()).setDepth(81);this.text(345,44,this.cfg.title,31).setDepth(81);this.progress=this.text(658,44,'',23).setDepth(81);this.audioButton=this.button(930,44,130,'音效 開',()=>{this.soundOn=!this.soundOn;this.audioButton.label.setText(this.soundOn?'音效 開':'音效 關');if(!this.soundOn)this.stopAudio();this.notice.setText(this.soundOn?'音效已開啟':'音效已關閉');}).setDepth(81);this.button(1130,44,170,'暫停 / 說明',()=>this.pause()).setDepth(81);this.panel(640,113,900,50).setDepth(80);this.stats=this.text(640,113,'',22).setDepth(81);this.notice=this.text(640,172,this.cfg.subtitle,23,this.theme==='sky'?'#fff1d5':'#335a4a').setDepth(80);this.text(640,687,this.theme==='sky'?'點一下跳躍・再點二段跳｜踩彈力雲上高路，留在下路也能過關':'點一下跳躍・再點二段跳｜青苔帶會短暫滑行加速',20,this.theme==='sky'?'#fff0db':'#385746').setDepth(80);this.refresh();}
 refresh(){this.progress.setText(`${this.cfg.goalName} ${this.count} / ${this.target}`);this.stats.setText(`${this.child?'幼童版・不扣愛心':'正常版・'+'♥'.repeat(this.hearts)+'♡'.repeat(3-this.hearts)}　｜　${this.cfg.bonusName} ${this.bonus}${this.boost>0?'　｜　青苔滑行！':''}`);}
 collectible(kind,x,y){const c=this.add.container(x,y),g=this.add.graphics();if(kind==='goal'&&this.theme==='mud'){g.fillStyle(0xffe1a0).fillEllipse(0,8,27,32).fillCircle(-13,-13,7).fillCircle(0,-20,8).fillCircle(13,-13,7);g.lineStyle(2,0x805f3f).strokeEllipse(0,8,27,32);}else if(kind==='goal'){c.add(this.add.star(0,0,5,12,26,0xffdf89).setStrokeStyle(2,0xfff5d0));}else if(this.theme==='sky'){g.fillStyle(0xffe8a8,.25).fillCircle(0,0,23);g.fillStyle(0xf9e27b).fillEllipse(0,0,12,19);g.fillStyle(0xd9f7f1,.8).fillEllipse(-10,-5,16,8).fillEllipse(10,-5,16,8);}else{g.fillStyle(0xec9673).fillCircle(-8,0,16).fillCircle(8,0,16);g.fillStyle(0x557e4e).fillEllipse(7,-20,22,8);}c.add(g);return this.entity(c,kind);}
 entity(v,kind){v.kind=kind;v.used=false;v.setDepth(25);this.objects.push(v);return v;}
 feature(kind,x){const c=this.add.container(x,FLOOR),g=this.add.graphics();if(kind==='boost'){g.fillStyle(0x73ac7d).fillRoundedRect(-65,-7,130,15,7);g.lineStyle(4,0xd1edac);for(let i=-1;i<=1;i++)g.beginPath().moveTo(i*32-7,-4).lineTo(i*32+6,0).lineTo(i*32-7,4).strokePath();}else if(kind==='bounce'){c.add(this.cloud(0,-5,.62));g.fillStyle(0xeac984).fillTriangle(-9,-18,0,-31,9,-18);}else if(kind==='log'){g.fillStyle(0x876042).fillRoundedRect(-49,-46,98,46,16);g.fillStyle(0xc99c68).fillCircle(42,-24,21);}else{g.fillStyle(kind==='puddle'?0x619b9e:0x798978).fillRoundedRect(-34,kind==='puddle'?-9:-55,68,kind==='puddle'?12:55,14);}c.add(g);return this.entity(c,kind);}
 spawn(){const x=1380,i=this.index++,sky=this.theme==='sky';
  if(sky){const seq=i%6;if(seq===0){this.feature('bounce',x);this.collectible('bonus',x+90,470);}else if(seq===1){this.collectible('goal',x,484);const platform=this.cloud(x-60,this.cfg.upperHeight+5,1.15).setDepth(20);platform.top=this.cfg.upperHeight;platform.width=215;this.platforms.push(platform);this.collectible('goal',x-60,this.cfg.upperHeight-75);}else if(seq===2)this.collectible('bonus',x,335);else if(seq===3)this.collectible('goal',x,484);else if(seq===4)this.feature('bounce',x);else this.collectible('goal',x,440);
  }else{const seq=i%8;if([0,2,5].includes(seq))this.collectible('goal',x,seq===2?432:493);else if(seq===1)this.feature('rock',x);else if(seq===3)this.feature('boost',x);else if(seq===4)this.collectible('bonus',x,480);else if(seq===6)this.feature('log',x);else this.feature('puddle',x);}
 }
 jump(){if(this.mode!=='playing')return;if(this.jumps>=2){this.buffer=.13;return;}this.unlockAudio();this.jumps++;this.vy=this.jumps===1?this.cfg.jump:this.cfg.doubleJump;this.grounded=false;this.support=null;this.coyote=0;this.buffer=0;this.tone(this.jumps===1?480:660);if(this.jumps===2)this.spark(this.player.x,this.player.y-15);}
 update(_time,delta){if(!['playing','ending'].includes(this.mode))return;const dt=Math.min(.035,delta/1000);this.elapsed+=dt;this.buffer=Math.max(0,this.buffer-dt);this.coyote=Math.max(0,this.coyote-dt);this.immune=Math.max(0,this.immune-dt);this.boost=Math.max(0,this.boost-dt);const factor=this.boost>0?(this.child?this.cfg.childBoostMultiplier:this.cfg.boostMultiplier):1;this.speed+=(this.cfg.speed*factor-this.speed)*Math.min(1,dt*4);const travel=this.speed*dt;this.distance+=travel;
  this.far.forEach(v=>{v.x-=travel*.14;if(v.x<-400)v.x+=1850;});this.near.forEach(v=>{v.x-=travel*.32;if(v.x<-250)v.x+=1660;});this.pebbles.forEach(v=>{v.x-=travel;if(v.x<-25)v.x+=1430;});
  for(const p of this.platforms)p.x-=travel;
  if(this.grounded&&this.support&&Math.abs(this.support.x-this.player.x)>this.support.width/2+8){this.grounded=false;this.support=null;this.coyote=.12;}
  if(!this.grounded&&this.jumps===0&&this.coyote===0)this.jumps=1;
  const oldY=this.player.y;
  if(!this.grounded){this.vy+=this.cfg.gravity*dt;this.player.y+=this.vy*dt;let landing=null;
   if(this.vy>=0)for(const p of this.platforms){if(oldY<=p.top+2&&this.player.y>=p.top&&Math.abs(this.player.x-p.x)<p.width/2+8&&(!landing||p.top<landing.top))landing=p;}
   if(landing){this.land(landing.top,landing);}else if(this.player.y>=FLOOR)this.land(FLOOR,null);
  }
  this.player.angle=this.grounded?Math.sin(this.distance*.065)*2:clamp(this.vy*.012,-8,8);this.player.alpha=this.immune>0?.6+.4*Math.abs(Math.sin(this.elapsed*18)):1;this.legs.forEach((v,i)=>v.angle=this.grounded?Math.sin(this.distance*.07+i*Math.PI)*23:(i?24:-24));this.label.y=this.player.y-126;this.shadow.setScale(clamp(1-(FLOOR-this.player.y)/450,.35,1));
  if(this.mode==='ending'){this.endMarker.x=Math.max(640,this.endMarker.x-travel);if(this.endMarker.x===640&&this.grounded){this.mode='won';this.showResult();}return;}
  this.nextSpawn-=travel;if(this.nextSpawn<=0){this.nextSpawn=this.cfg.segmentGap;this.spawn();}
  for(const v of this.objects){if(this.mode!=='playing')break;v.x-=travel;this.touch(v,oldY);}
  this.objects=this.objects.filter(v=>{if(v.x<-180||v.used){v.destroy();return false;}return true;});this.platforms=this.platforms.filter(p=>{if(p.x<-250&&p!==this.support){p.destroy();return false;}return true;});this.refresh();
 }
 land(y,support){this.player.y=y;this.vy=0;this.grounded=true;this.jumps=0;this.support=support;this.coyote=0;if(this.buffer>0)this.jump();}
 touch(v,oldY){if(v.used)return;const dx=Math.abs(v.x-this.player.x);if(['goal','bonus'].includes(v.kind)){if(dx>(this.child?63:48)||Math.abs(v.y-(this.player.y-61))>(this.child?72:53))return;v.used=true;this.spark(v.x,v.y);this.tone(v.kind==='goal'?740:590);if(v.kind==='goal'){this.count++;this.notice.setText(`找到${this.cfg.goalName} ${this.count} / ${this.target}！`);}else this.bonus++;if(this.count>=this.target)this.endRun();return;}
  if(v.kind==='boost'){if(dx<60&&this.grounded&&this.player.y===FLOOR){v.used=true;this.boost=this.cfg.boostSeconds;this.notice.setText('青苔滑行～速度會慢慢恢復！');this.spark(v.x,v.y-12);}return;}
  if(v.kind==='bounce'){if(dx<62&&this.vy>=0&&oldY<=FLOOR+2&&this.player.y>=FLOOR-15){v.used=true;this.grounded=false;this.support=null;this.vy=this.cfg.bounce;this.jumps=1;this.buffer=0;this.notice.setText('彈力雲！飛上高路，還能再跳一次！');this.tone(850);this.spark(v.x,v.y-15);}return;}
  const top=FLOOR-(v.kind==='rock'?55:v.kind==='log'?46:9),width=v.kind==='log'?49:34;
  if(dx>width+(this.child?7:17)||this.player.y<=top+(this.child?15:4)||this.immune>0)return;v.used=true;this.immune=1.4;if(!this.child)this.hearts--;this.notice.setText(this.child?'站穩了，繼續找小腳印！':'碰到障礙了，再看準時機跳！');this.tone(220);if(this.hearts<=0){this.mode='lost';this.showResult();}
 }
 endRun(){this.mode='ending';this.boost=0;this.objects.forEach(v=>v.destroy());this.objects=[];this.notice.setText(this.theme==='mud'?'腳印通往前方，恐龍朋友就在那裡！':'星光集齊了，前方的天空樹屋亮起來了！');this.endMarker=this.add.container(1400,0).setDepth(30);const g=this.add.graphics();if(this.theme==='mud'){g.fillStyle(0x88b092).fillEllipse(0,514,135,68).fillCircle(56,475,40).fillTriangle(-55,512,-130,468,-72,528);g.fillStyle(0xfff7dd).fillCircle(70,466,13);g.fillStyle(0x3b5c4c).fillCircle(73,466,5);g.fillStyle(0x88b092).fillRoundedRect(-40,535,22,35,8).fillRoundedRect(26,535,22,35,8);g.fillStyle(0xe9d187).fillTriangle(-20,487,0,447,18,487);this.endMarker.add(this.text(0,397,'♥ 找到你了！',27));}else{g.fillStyle(0x755873).fillRect(-12,400,24,170);g.fillStyle(0xbba3c4).fillRoundedRect(-95,413,190,113,12);g.fillStyle(0xf4d599).fillTriangle(-120,416,0,330,120,416);g.fillStyle(0xffefb6).fillRoundedRect(-25,443,50,69,12);for(let i=-1;i<=1;i++)this.endMarker.add(this.add.star(i*85,300-Math.abs(i)*15,5,8,19,0xffebac));this.endMarker.add(this.text(0,257,'✦ 星光樹屋 ✦',27,'#fff1cd'));}this.endMarker.add(g);}
 spark(x,y){for(let i=0;i<9;i++){const p=this.add.star(x,y,5,3,7,i%2?0xffe2a0:0xc9edd4).setDepth(60);this.tweens.add({targets:p,x:x+Math.cos(i*.7)*65,y:y+Math.sin(i*.7)*55,alpha:0,duration:430,onComplete:()=>p.destroy()});}}
 modal(title,body){this.overlay=this.add.container(0,0).setDepth(100);this.overlay.add([this.add.rectangle(640,360,1280,720,0x153d35,.7).setInteractive(),this.panel(640,360,880,460),this.text(640,210,title,33),this.text(640,315,body,23)]);return this.overlay;}
 intro(){this.mode='intro';const o=this.modal(this.cfg.title,this.cfg.subtitle+'\n點一下跳躍，空中再點一下二段跳。\n可選正常版或幼童版。');o.add(this.button(470,460,270,'正常版出發',()=>this.scene.restart({theme:this.theme,child:false})));o.add(this.button(810,460,270,'幼童版出發',()=>this.scene.restart({theme:this.theme,child:true})));}
 pause(){if(!['playing','ending'].includes(this.mode))return;this.resumeMode=this.mode;this.mode='paused';this.buffer=0;this.tweens.pauseAll();this.stopAudio();const o=this.modal('休息一下',this.theme==='mud'?'點一下跳躍，空中再點一下二段跳。\n收集小腳印；青苔帶會短暫加速滑行。':'點一下跳躍，空中再點一下二段跳。\n踩彈力雲上高路，從下方可穿過雲台。\n上下路都有星光，不上高路也能完成。');o.add(this.button(480,470,270,'繼續探險',()=>this.resume()));o.add(this.button(800,470,270,(this.theme==='sky'?'返回風鈴浮島':'返回巨蕨叢林'),()=>{this.tweens.resumeAll();this.returnToMap();}));}
 resume(){if(this.mode!=='paused')return;this.overlay.destroy();this.mode=this.resumeMode;this.tweens.resumeAll();}
 showResult(){this.stopAudio();const win=this.mode==='won';const o=this.modal(win?(this.theme==='mud'?'跟著腳印，找到恐龍朋友！':'星光樹屋點亮了！'):'休息一下，再試一次',`${this.cfg.goalName} ${this.count} / ${this.target}\n${this.cfg.bonusName} ${this.bonus} 個${win?'\n謝謝阿晨晨，探險成功！':''}`);o.add(this.button(470,480,270,'再玩一次',()=>this.scene.restart({theme:this.theme,child:this.child})));o.add(this.button(810,480,270,(this.theme==='sky'?'返回風鈴浮島':'返回巨蕨叢林'),()=>this.returnToMap()));}
 unlockAudio(){if(!this.soundOn)return;this.sound.context?.resume?.();}
 tone(freq){const c=this.sound.context;if(!this.soundOn||!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.04,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(c.destination);this.soundNodes.add(o);o.onended=()=>{this.soundNodes.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+.18);}
 stopAudio(){for(const o of this.soundNodes){try{o.stop();}catch{}}this.soundNodes.clear();}
}
