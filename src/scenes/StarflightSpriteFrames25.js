// Each pose has its own source bounds and body/foot anchor: no edge clipping or foot sliding.
export const STAR125_ENEMIES={
16:{key:'boat',width:102,anchors:[[323,440],[302,440],[323,370],[302,385]]},
17:{key:'frog',width:112,anchors:[[315,425],[315,402],[318,328],[320,435]],rects:[[0,0,627,627],[627,0,627,627],[0,627,667,627],[667,627,587,627]]},
18:{key:'seahorse',width:132,anchors:[[321,367],[327,370],[375,347],[382,353]]},
19:{key:'teapot',width:146,anchors:[[335,425],[348,434],[341,352],[380,345]]},
26:{key:'leopard',width:210,feet:[557,559,527,526],anchors:[[335,380],[327,390],[300,350],[325,345]],rects:[[0,0,640,627],[640,0,614,627],[0,627,594,627],[594,627,660,627]]}
};
export function registerStar125Frames(scene){for(const spec of Object.values(STAR125_ENEMIES)){const tex=scene.textures.get('star125_'+spec.key);for(let i=0;i<4;i++){const r=spec.rects?.[i]||[(i%2)*627,Math.floor(i/2)*627,627,627];if(!tex.has(i))tex.add(i,0,...r);}}}
export function star125Frame(e){if(e.kind===16)return Math.floor(e.age*6)%4;if(e.kind===17)return e.state==='hidden'?0:e.age<.35?1:e.age<1.45?2:3;if(e.kind===26)return e.attackAnim>0?3:e.throwWindup>0?2:Math.floor(e.age*7)%2;return e.attackAnim>0?3:e.windup>0?2:Math.floor(e.age*4)%2;}
export function drawStar125Enemy(scene,e,live){const spec=STAR125_ENEMIES[e.kind],frame=star125Frame(e),id='star125-'+e.id;let v=scene.views.get(id);if(!v){v=scene.add.image(e.x,e.y,'star125_'+spec.key,frame);scene.entities.add(v);scene.views.set(id,v);}live.add(id);v.setFrame(frame);const [ax,ay]=spec.anchors[frame],sx=spec.width/627,sy=sx/1.27;v.setOrigin(ax/v.frame.width,ay/v.frame.height).setDisplaySize(v.frame.width*sx,v.frame.height*sy).setPosition(e.x,spec.feet?455-(spec.feet[frame]-ay)*sy:e.y).setRotation(0).setVisible(true);if(e.flash>0)v.setTintFill(0xffffff);else v.clearTint();return v;}
