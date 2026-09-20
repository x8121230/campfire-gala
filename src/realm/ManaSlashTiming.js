// One clock controls animation, damage and input locks. Gameplay time never pauses.
export const MANA_SLASH=Object.freeze({
 duration:.45,cooldown:.45,impact:.20,moveUnlock:.32,guardUnlock:.45,
 windup:.10,visualFreezeStart:.20,visualFreezeEnd:.25
});
const clamp01=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp01(n);return n*n*(3-2*n);};
export function slashLocks(elapsed){const t=Math.max(0,Number(elapsed)||0);return {movement:t<MANA_SLASH.moveUnlock,guard:t<MANA_SLASH.guardUnlock,attack:t<MANA_SLASH.cooldown};}
export function manaSlashPose(elapsed){
 const t=Math.max(0,Number(elapsed)||0);if(t>=MANA_SLASH.duration)return null;
 // Hold only the drawn pose for 50ms. Physics, enemies and timers keep updating.
 const visualT=t>=MANA_SLASH.visualFreezeStart&&t<MANA_SLASH.visualFreezeEnd?MANA_SLASH.visualFreezeStart:t-(t>=MANA_SLASH.visualFreezeEnd?MANA_SLASH.visualFreezeEnd-MANA_SLASH.visualFreezeStart:0);
 let frame=0,swing=0,forward=0,tilt=-.045,wave=0,bladeAlpha=1,bodyY=0,scaleX=1,scaleY=1;
 if(visualT<.10){const p=ease(visualT/.10);frame=0;forward=-4*p;tilt=-.045-.025*p;bodyY=3*p;scaleX=1+.01*p;scaleY=1-.02*p;}
 else if(visualT<.20){const p=ease((visualT-.10)/.10);frame=1;swing=.04+.74*p;forward=-4+19*p;tilt=-.07+.13*p;bodyY=3-5*p;scaleX=1.01+.015*p;scaleY=.98+.03*p;}
 else if(t<.32){const p=ease((Math.max(t,.25)-.25)/.07);frame=2;swing=.78+.22*p;forward=15+9*p;tilt=.06-.025*p;wave=.25*p;bodyY=-2+4*p;scaleX=1.025-.005*p;scaleY=1.01-.03*p;}
 else {const p=ease((t-.32)/.13);frame=3;swing=1;forward=24*(1-p);tilt=.035*(1-p);wave=.25+.75*p;bladeAlpha=1-p;bodyY=2*(1-p);scaleX=1+.02*(1-p);scaleY=1-.02*(1-p);}
 return {frame,swing,forward,tilt,wave,bladeAlpha,bodyY,scaleX,scaleY,hitStop:t>=.20&&t<.25};
}
