// Deterministic platform simulation, shared by the game and recorded-input QA.
export const MORPH_DT=1/120;
export const MORPH_FORMS=Object.freeze([
    {id:'round',name:'圓形',w:30,h:28,speed:330,jump:590,color:0x68d7ac},
    {id:'triangle',name:'三角形',w:36,h:44,speed:270,jump:650,color:0xf0b650},
    {id:'square',name:'方形',w:40,h:44,speed:210,jump:530,color:0x7c95e3}
]);
export const intersects=(a,b)=>a.x<b.x+b.w-.001&&a.x+a.w>b.x+.001&&a.y<b.y+b.h-.001&&a.y+a.h>b.y+.001;
export const playerBox=p=>({x:p.x-MORPH_FORMS[p.form].w/2,y:p.y-MORPH_FORMS[p.form].h,w:MORPH_FORMS[p.form].w,h:MORPH_FORMS[p.form].h});
export function compileMorphLevel(spec){
    const l=JSON.parse(JSON.stringify(spec));
    if(!Number.isFinite(l.width)||l.width<1280||l.width>6000||!l.spawn||!l.exit)throw Error('Invalid level bounds');
    for(const key of ['platforms','vines','gates','plates','springs','movers','winds','hazards','rocks','checkpoints','badges','signs'])l[key]=l[key]||[];
    for(const key of ['platforms','vines','gates','winds','hazards'])for(const r of l[key])if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)throw Error('Invalid rectangle');
    for(const m of l.movers)if(![m.x,m.y,m.w,m.h,m.dx,m.dy,m.period].every(Number.isFinite)||m.period<=0||m.w<=0||m.h<=0)throw Error('Invalid moving platform');
    for(const p of l.plates)if(!Number.isInteger(p.gate)||!l.gates[p.gate]||![p.x,p.y,p.w].every(Number.isFinite))throw Error('Invalid plate');
    for(const r of l.rocks)if(![r.x,r.top,r.bottom,r.period,r.fall].every(Number.isFinite)||r.period<=r.fall+0.8||r.fall<=0)throw Error('Invalid rock cycle');
    if(l.badges.length!==3)throw Error('Each stage needs three badges');
    if(!['falls','forms','vines','springs','plates'].includes(l.challenge?.type)||!Number.isInteger(l.challenge?.value))throw Error('Invalid challenge');
    for(const p of [l.spawn,l.exit,...l.checkpoints,...l.badges])if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<20||p.x>l.width-20||p.y<80||p.y>580)throw Error('Invalid landmark');
    for(const p of [l.spawn,l.exit,...l.checkpoints]){
        const b=playerBox({...p,form:0});
        if([...l.platforms.filter(r=>!r.oneWay),...l.vines,...l.gates].some(r=>intersects(b,r))||!l.platforms.some(r=>Math.abs(r.y-p.y)<1&&p.x>r.x+15&&p.x<r.x+r.w-15))throw Error('Unsafe checkpoint or endpoint');
    }
    return l;
}
export function moverAt(m,time){const phase=(m.phase||0)+time*2*Math.PI/m.period,v=(1-Math.cos(phase))/2;return {x:m.x+m.dx*v,y:m.y+m.dy*v,w:m.w,h:m.h,oneWay:true};}
export function rockAt(r,time){
    const phase=((time+(r.offset||0))%r.period+r.period)%r.period;
    if(phase<.8)return {warning:true,x:r.x,y:r.top,progress:phase/.8};
    if(phase<.8+r.fall)return {warning:false,x:r.x-16,y:r.top+(r.bottom-r.top)*(phase-.8)/r.fall-16,w:32,h:32};
    return null;
}
const approach=(v,target,step)=>v<target?Math.min(target,v+step):Math.max(target,v-step);
export class MorphSession{
    constructor(level){
        this.level=level;this.time=0;this.accumulator=0;this.paused=false;this.finished=false;this.falls=0;this.respawnDelay=0;
        this.player={...level.spawn,vx:0,vy:0,form:0,facing:1,grounded:false,groundId:null,coyote:0,buffer:0,dash:0,cooldown:0};
        this.checkpoint={...level.spawn,index:-1};this.collected=new Set();this.broken=new Set();this.usedForms=new Set([0]);this.usedSprings=new Set();this.usedPlates=new Set();
        this.gateTimes=level.gates.map(()=>0);this.charge=level.plates.map(()=>0);this.lastJump=false;this.lastDash=false;this.message='';this.messageTime=0;this.events=[];
    }
    say(text){this.message=text;this.messageTime=2.8;}
    solids(){const l=this.level;return [...l.platforms.map((r,i)=>({...r,id:`p${i}`})),...l.vines.flatMap((r,i)=>this.broken.has(i)?[]:[{...r,id:`v${i}`,vine:i}]),...l.gates.flatMap((r,i)=>this.gateTimes[i]>0?[]:[{...r,id:`g${i}`}])];}
    setForm(index){
        if(this.paused||this.finished||this.respawnDelay>0||!MORPH_FORMS[index])return false;
        const p=this.player;if(index===p.form)return true;const next=playerBox({...p,form:index});
        if(this.solids().some(r=>!r.oneWay&&intersects(next,r))){this.say('上方空間不夠，先用圓形離開低洞再變身。');return false;}
        p.form=index;p.dash=0;this.usedForms.add(index);this.events.push('form');return true;
    }
    respawn(){
        if(this.finished)return;this.falls++;this.respawnDelay=.4;const p=this.player;
        Object.assign(p,this.checkpoint,{vx:0,vy:0,form:0,grounded:false,groundId:null,coyote:0,buffer:0,dash:0,cooldown:0});
        this.gateTimes.fill(0);this.charge.fill(0);this.events.push('fall');this.say('回到最近的燈籠了，已收集的徽章會保留。');
    }
    advance(seconds,input={}){
        if(this.paused||this.finished){this.accumulator=0;return;}
        // Do not fast-forward a hidden/stalled frame through hazards.
        this.accumulator+=Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,.1));
        while(this.accumulator+1e-9>=MORPH_DT&&!this.finished){this.step(input);this.accumulator-=MORPH_DT;}
    }
    step(input={}){
        if(this.paused||this.finished)return;
        const dt=MORPH_DT,l=this.level,p=this.player,oldTime=this.time;this.time+=dt;
        this.messageTime=Math.max(0,this.messageTime-dt);
        if(this.respawnDelay>0){this.respawnDelay=Math.max(0,this.respawnDelay-dt);this.lastJump=!!input.jump;this.lastDash=!!input.dash;return;}
        if(Number.isInteger(input.form))this.setForm(input.form);
        const jump=!!input.jump,dash=!!input.dash,axis=(input.right?1:0)-(input.left?1:0);
        if(jump&&!this.lastJump)p.buffer=.12;else p.buffer=Math.max(0,p.buffer-dt);
        if(!jump&&this.lastJump&&p.vy<-260)p.vy=-260;
        p.cooldown=Math.max(0,p.cooldown-dt);p.dash=Math.max(0,p.dash-dt);
        if(axis)p.facing=axis;
        if(dash&&!this.lastDash&&p.form===1&&p.cooldown===0){p.dash=.18;p.cooldown=.65;this.events.push('dash');}
        this.lastJump=jump;this.lastDash=dash;
        if(p.grounded)p.coyote=.10;else p.coyote=Math.max(0,p.coyote-dt);
        if(p.buffer>0&&p.coyote>0){p.vy=-MORPH_FORMS[p.form].jump;p.buffer=0;p.coyote=0;p.grounded=false;p.groundId=null;this.events.push('jump');}
        if(p.grounded&&p.groundId?.startsWith('m')){
            const m=l.movers[Number(p.groundId.slice(1))],before=moverAt(m,oldTime),after=moverAt(m,this.time);
            p.x+=after.x-before.x;p.y+=after.y-before.y;
        }
        const box=playerBox(p);let wind=0,gravity=1600;
        l.winds.forEach(w=>{if(intersects(box,w)){wind+=(w.force||0)*(p.form===2 ? .16 : 1);if(w.lift&&p.form===0)gravity=700;}});
        p.vx=p.dash>0?p.facing*660:approach(p.vx,axis*MORPH_FORMS[p.form].speed+wind*.12,2600*dt);
        p.vy=Math.min(1000,p.vy+gravity*dt);
        for(let i=0;i<this.gateTimes.length;i++){
            this.gateTimes[i]=Math.max(0,this.gateTimes[i]-dt);
            // A closing gate waits for the character already inside to clear it.
            if(this.gateTimes[i]===0&&intersects(playerBox(p),l.gates[i]))this.gateTimes[i]=.08;
        }
        const solids=this.solids();p.x+=p.vx*dt;
        for(const r of solids){
            if(r.oneWay||!intersects(playerBox(p),r))continue;
            if(r.vine!==undefined&&p.form===1&&p.dash>0){this.broken.add(r.vine);this.events.push('cut');continue;}
            const half=MORPH_FORMS[p.form].w/2;if(p.vx>0)p.x=r.x-half;else if(p.vx<0)p.x=r.x+r.w+half;p.vx=0;p.dash=0;
        }
        p.x=Math.max(MORPH_FORMS[p.form].w/2,Math.min(l.width-MORPH_FORMS[p.form].w/2,p.x));
        const oldFeet=p.y,oldTop=playerBox(p).y;p.y+=p.vy*dt;p.grounded=false;p.groundId=null;
        const surfaces=[...solids.filter(r=>r.vine===undefined||!this.broken.has(r.vine)),...l.movers.map((m,i)=>({...moverAt(m,this.time),id:`m${i}`})),...l.springs.map((s,i)=>({x:s.x,y:s.y,w:s.w,h:12,oneWay:true,id:`s${i}`,spring:i}))];
        if(p.vy>=0){
            let landing=null;
            for(const r of surfaces){const b=playerBox(p);if(b.x+b.w>r.x+.01&&b.x<r.x+r.w-.01&&oldFeet<=r.y+2.5&&p.y>=r.y&&(landing===null||r.y<landing.y))landing=r;}
            if(landing){p.y=landing.y;p.vy=0;p.grounded=true;p.groundId=landing.id;
                if(landing.spring!==undefined){p.vy=-880;p.grounded=false;p.groundId=null;p.coyote=0;this.usedSprings.add(landing.spring);this.events.push('spring');}
            }
        }else{
            for(const r of surfaces){if(r.oneWay)continue;const b=playerBox(p);if(b.x+b.w>r.x+.01&&b.x<r.x+r.w-.01&&oldTop>=r.y+r.h-.5&&b.y<r.y+r.h){p.y=r.y+r.h+b.h;p.vy=0;}}
        }
        // The soft mushroom lip can be stepped onto directly from nearby ground.
        if(p.grounded)l.springs.forEach((spring,i)=>{if(p.x>spring.x&&p.x<spring.x+spring.w&&p.y>=spring.y&&p.y<=spring.y+24){p.y=spring.y;p.vy=-880;p.grounded=false;p.groundId=null;p.coyote=0;this.usedSprings.add(i);this.events.push('spring');}});
        // A moving platform must not push the player through a ceiling or wall.
        if(this.solids().some(r=>!r.oneWay&&intersects(playerBox(p),r))){this.respawn();return;}
        l.plates.forEach((plate,i)=>{
            const b=playerBox(p),standing=p.form===2&&p.grounded&&Math.abs(p.y-plate.y)<3&&b.x+b.w>plate.x&&b.x<plate.x+plate.w;
            this.charge[i]=standing?Math.min(.45,this.charge[i]+dt):0;
            if(this.charge[i]>=.45-1e-8){this.gateTimes[plate.gate]=plate.duration||8;if(!this.usedPlates.has(i)){this.usedPlates.add(i);this.events.push('plate');this.say('石門開了！換形態也能通過，留意倒數。');}}
        });
        if(p.y>690||l.hazards.some(r=>intersects(playerBox(p),r))||l.rocks.some(r=>{const a=rockAt(r,this.time);return a&&!a.warning&&intersects(playerBox(p),a);})){this.respawn();return;}
        l.checkpoints.forEach((cp,i)=>{if(i>this.checkpoint.index&&Math.abs(p.x-cp.x)<32&&Math.abs(p.y-cp.y)<55&&p.grounded){this.checkpoint={...cp,index:i};this.events.push('checkpoint');this.say('檢查點點亮了！失足會從這裡繼續。');}});
        l.badges.forEach((b,i)=>{if(!this.collected.has(i)&&intersects(playerBox(p),{x:b.x-16,y:b.y-16,w:32,h:32})){this.collected.add(i);this.events.push('badge');}});
        if(Math.abs(p.x-l.exit.x)<32&&Math.abs(p.y-l.exit.y)<55&&p.grounded){this.finished=true;this.events.push('finish');}
    }
    challengeMet(){const c=this.level.challenge;return c.type==='falls'?this.falls<=c.value:c.type==='forms'?this.usedForms.size>=c.value:c.type==='vines'?this.broken.size>=c.value:c.type==='springs'?this.usedSprings.size>=c.value:this.usedPlates.size>=c.value;}
    medals(){return [this.finished,this.finished&&this.collected.size===3,this.finished&&this.challengeMet()];}
}
