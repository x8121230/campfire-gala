// Deform the existing painted sprites once at load time, not every game frame.
// Logical positions and collision shapes never enter this render-only rig.
const TAU = Math.PI * 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const bump = (x, y, cx, cy, rx, ry) => Math.exp(-2 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));

export function deformCreature(kind, u, v, phase) {
  const a = phase * TAU, sine = Math.sin(a);
  let x = u, y = v;
  if (kind === 'mouseRun') {
    // Alternate the two visible feet around a stable body; keep hat/head shape.
    const back = bump(u, v, .19, .65, .15, .13);
    const front = bump(u, v, .61, .74, .17, .12);
    x += sine * .037 * (front - back);
    y -= .025 * (Math.max(0, sine) * front + Math.max(0, -sine) * back);
    y += Math.cos(a * 2) * .0035 * bump(u, v, .51, .48, .4, .28);
  } else if (kind === 'mouseIdle') {
    // Breathing is anchored above the toes, without changing entire body size.
    x += (u - .5) * sine * .018 * bump(u, v, .5, .6, .36, .25);
    y += sine * .004 * bump(u, v, .5, .58, .4, .27);
    x += Math.sin(a + .4) * .003 * bump(u, v, .34, .27, .25, .18);
  } else if (kind === 'chickFlight') {
    // Wing tips move most; shoulders and face remain stable. Tail lags behind.
    const left = bump(u, v, .08, .55, .23, .22) * (1 - smooth((u - .22) / .12));
    const right = bump(u, v, .77, .67, .28, .18) * smooth((u - .5) / .15);
    y += sine * .075 * (left + right);
    x += sine * .021 * (left - right);
    const tail = smooth((u - .52) / .18) * (1 - smooth((v - .43) / .17));
    x += Math.sin(a - .7) * .009 * tail;
    y += Math.cos(a - .7) * .006 * tail;
  }
  return { x, y };
}

function triangle(ctx, source, src, dst) {
  const [a, b, c] = src, [p, q, r] = dst;
  const det = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const A = ((q.x - p.x) * (c.y - a.y) - (r.x - p.x) * (b.y - a.y)) / det;
  const B = ((q.y - p.y) * (c.y - a.y) - (r.y - p.y) * (b.y - a.y)) / det;
  const C = ((r.x - p.x) * (b.x - a.x) - (q.x - p.x) * (c.x - a.x)) / det;
  const D = ((r.y - p.y) * (b.x - a.x) - (q.y - p.y) * (c.x - a.x)) / det;
  ctx.save(); ctx.beginPath();
  // Tiny overlap suppresses antialiased hairline seams between triangles.
  const mid = { x: (p.x + q.x + r.x) / 3, y: (p.y + q.y + r.y) / 3 };
  [p, q, r].forEach((v, i) => {
    const dx = v.x - mid.x, dy = v.y - mid.y, d = Math.hypot(dx, dy) || 1;
    ctx[i ? 'lineTo' : 'moveTo'](v.x + dx / d * .45, v.y + dy / d * .45);
  });
  ctx.closePath(); ctx.clip();
  ctx.transform(A, B, C, D, p.x - A * a.x - C * a.y, p.y - B * a.x - D * a.y);
  ctx.drawImage(source, 0, 0); ctx.restore();
}

export function buildCreatureFrames(images, createCanvas = (w, h) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}) {
  const result = {};
  for (const [kind, key, width, foot] of [['mouseIdle', 'mouse', 256, .80], ['mouseRun', 'mouseRun1', 256, .77], ['chickFlight', 'chick', 320, .925]]) {
    const image = images[key];
    const height = Math.round(width * image.height / image.width);
    const source = createCanvas(width, height);
    source.getContext('2d').drawImage(image, 0, 0, width, height);
    const frames = [];
    for (let frame = 0; frame < 16; frame++) {
      const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
      const count = 12, points = [];
      for (let row = 0; row <= count; row++) for (let col = 0; col <= count; col++) {
        const u = col / count, v = row / count;
        const warped = deformCreature(kind, u, v, frame / 16);
        points.push({ src: { x: u * width, y: v * height }, dst: { x: warped.x * width, y: warped.y * height } });
      }
      for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
        const a = row * (count + 1) + col, b = a + 1, c = a + count + 1, d = c + 1;
        for (const ids of [[a, b, d], [a, d, c]]) triangle(ctx, source, ids.map(i => points[i].src), ids.map(i => points[i].dst));
      }
      frames.push(canvas);
    }
    result[kind] = { frames, foot };
  }
  return result;
}

export class CreatureAnimator {
  constructor() { this.states = new Map(); }
  update(mob, dt) {
    let s = this.states.get(mob.id);
    if (!mob.alive) { this.states.delete(mob.id); return null; }
    if (!s) {
      s = { x: mob.x, y: mob.y, flip: false, phase: (mob.id * .173) % 1, clock: mob.id * .37, lift: mob.type === 'chick' ? 7 : 0, mode: 'idle', mix: 0, wasDizzy: false };
      this.states.set(mob.id, s);
    }
    const dx = mob.x - s.x, dy = mob.y - s.y, moved = Math.hypot(dx, dy);
    s.x = mob.x; s.y = mob.y;
    if (dt <= 0) return s;
    s.clock += dt;
    const speed = moved / dt;
    if (Math.abs(dx) > .08) s.flip = dx < 0;
    const running = speed > 3 && mob.hitFlash <= 0 && mob.dizzy <= 0;
    s.mode = mob.dizzy > 0 ? 'dizzy' : mob.hitFlash > 0 ? 'hit' : running ? 'run' : 'idle';
    s.mix += (Number(running) - s.mix) * (1 - Math.exp(-dt * 22));
    if (mob.type === 'chick') s.phase = (s.phase + dt * (mob.float > .1 ? 3.8 : 2.1)) % 1;
    else if (running) s.phase = (s.phase + moved / 44) % 1;
    const targetLift = mob.type === 'chick' ? 7 + Math.sin(s.clock * 2.4) * 2 + mob.float * 32 : Math.max(0, mob.float * 24);
    s.lift += (targetLift - s.lift) * (1 - Math.exp(-dt * (mob.type === 'chick' ? 9 : 18)));
    if (mob.type !== 'chick' && s.lift < .03) s.lift = 0;
    return s;
  }
}

export function drawCreatureFrame(ctx, rig, phase, width, height) {
  // Sixteen baked poses keep wings and feet smooth without translucent double images.
  const count = rig.frames?.length || 16;
  const i = Math.floor(((phase % 1 + 1) % 1) * count) % count;
  if (rig.atlas) {
    const cw = rig.atlas.width / 8, ch = rig.atlas.height / 2;
    ctx.drawImage(rig.atlas, (i % 8) * cw, Math.floor(i / 8) * ch, cw, ch, -width / 2, -height * rig.foot, width, height);
  } else ctx.drawImage(rig.frames[i], -width / 2, -height * rig.foot, width, height);
}

export function creatureAtlasRigs(images) {
  return {
    mouseIdle: { atlas: images.mouseIdleAtlas, foot: .80 },
    mouseRun: { atlas: images.mouseRunAtlas, foot: .77 },
    chickFlight: { atlas: images.chickFlightAtlas, foot: .925 }
  };
}
