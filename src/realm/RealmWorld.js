import { CAMP_BLOCKS, MAP, SPOTS, WORLD_SCALE, getCampCollisionPaint } from './RealmRules.js';
import { HERO_FRAME_SIZE, HERO_MOVEMENT_ATLAS, HeroMovementAnimator } from './HeroMovementAnimator.js';

const ASSETS = Object.freeze({
  background: '../../assets/phantom-realm/starsprout-camp/background.png',
  alden: '../../assets/phantom-realm/starsprout-camp/npc-alden.png',
  bronc: '../../assets/phantom-realm/starsprout-camp/npc-bronc.png',
  phoebe: '../../assets/phantom-realm/starsprout-camp/npc-phoebe.png',
  heroMovement: HERO_MOVEMENT_ATLAS
});

const NPC_HEIGHT = Object.freeze({ alden: 168, bronc: 164, phoebe: 158 });

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load ' + path));
    image.src = new URL(path, import.meta.url).href;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export class RealmWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.overview = false;
    this.images = {};
    this.camera = { x: 835 * WORLD_SCALE, y: 610 * WORLD_SCALE };
    this.heroAnimator = new HeroMovementAnimator('down');
    this.heroFrame = this.heroAnimator.update(0, { x: 0, y: 1 }, false);
    this.collisionEditor = { enabled: false, mode: 'block', radius: 112, cursor: null };
    this.lastTransform = null;
  }

  async load() {
    const entries = await Promise.all(Object.entries(ASSETS).map(async ([key, path]) => [key, await loadImage(path)]));
    this.images = Object.fromEntries(entries);
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  view() {
    if (this.overview) {
      return { scale: Math.min(this.width / MAP.width, this.height / MAP.height), x: MAP.width / 2, y: MAP.height / 2 };
    }
    const visibleWidth = this.height < 520 ? 920 : 1050;
    const visibleHeight = this.height < 520 ? 520 : 650;
    const scale = Math.max(this.width / visibleWidth, this.height / visibleHeight);
    const halfW = this.width / scale / 2;
    const halfH = this.height / scale / 2;
    return {
      scale,
      x: Math.max(halfW, Math.min(MAP.width - halfW, this.camera.x)),
      y: Math.max(halfH, Math.min(MAP.height - halfH, this.camera.y))
    };
  }

  setCollisionEditor(value = {}) { this.collisionEditor = { ...this.collisionEditor, ...value }; }

  screenToWorld(clientX, clientY) {
    if (!this.lastTransform) return null;
    const rect = this.canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return null;
    const sx = (clientX - rect.left) * this.width / rect.width, sy = (clientY - rect.top) * this.height / rect.height;
    return { x: (sx - this.lastTransform.originX) / this.lastTransform.scale, y: (sy - this.lastTransform.originY) / this.lastTransform.scale };
  }

  drawCollisionEditor(ctx) {
    if (!this.collisionEditor.enabled) return;
    const paint = getCampCollisionPaint(); ctx.save(); ctx.setLineDash([11, 8]); ctx.strokeStyle = 'rgba(255,174,78,.9)'; ctx.fillStyle = 'rgba(255,145,70,.1)'; ctx.lineWidth = 3;
    CAMP_BLOCKS.forEach((block, index) => { if (paint.disabled.includes(index)) return; ctx.beginPath(); if (block.type === 'rect') ctx.rect(block.x1, block.y1, block.x2 - block.x1, block.y2 - block.y1); else ctx.ellipse(block.x, block.y, block.rx, block.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.setLineDash([]);
    for (const [mode, color] of [['block', '255,70,70'], ['pass', '74,228,153']]) for (const mark of paint[mode]) { ctx.fillStyle = `rgba(${color},.23)`; ctx.strokeStyle = `rgba(${color},.95)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mark.x, mark.y, mark.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (this.collisionEditor.cursor) { const color = this.collisionEditor.mode === 'pass' ? '#4aeb9e' : this.collisionEditor.mode === 'erase' ? '#fff' : '#ff5d5d'; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.arc(this.collisionEditor.cursor.x, this.collisionEditor.cursor.y, this.collisionEditor.radius, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  drawNpc(ctx, id, image, journey) {
    const spot = SPOTS[id];
    const bob = Math.sin(this.time * 2.15 + id.length) * 2.4;
    const height = NPC_HEIGHT[id];
    const width = image.width / image.height * height;
    const selected = journey.nearby() === id;
    ctx.save();
    ctx.globalAlpha = selected ? .32 : .2;
    ctx.fillStyle = selected ? '#fff0a8' : '#274a42';
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y + 5, width * .28, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = '#fff3b2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y + 4, width * .36, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(image, spot.x - width / 2, spot.y - height + bob, width, height);
    this.drawNameplate(ctx, spot.name, spot.x, spot.y + 27);
    const marker = journey.questMarker(id);
    if (marker) this.drawMarker(ctx, marker, spot.x, spot.y - height - 12 + bob);
    ctx.restore();
  }

  drawNameplate(ctx, name, x, y) {
    ctx.save();
    ctx.font = '700 15px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const width = ctx.measureText(name).width + 24;
    roundedRect(ctx, x - width / 2, y - 13, width, 26, 12);
    ctx.fillStyle = 'rgba(29,72,61,.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,238,185,.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff1c4';
    ctx.fillText(name, x, y + .5);
    ctx.restore();
  }

  drawMarker(ctx, symbol, x, y) {
    const pulse = 1 + Math.sin(this.time * 5) * .07;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#fff5ad';
    ctx.shadowBlur = 15;
    ctx.fillStyle = symbol === '?' ? '#8bd1d4' : '#ffd55f';
    ctx.strokeStyle = '#fff8cf';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#315c4f';
    ctx.font = '900 27px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 0, 1);
    ctx.restore();
  }

  drawPlayer(ctx, player, moving) {
    const height = 123.2;
    const width = height;
    const frame = this.heroFrame;
    const stride = moving ? Math.abs(Math.sin(frame.column * Math.PI / 3)) : 0;
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#183f38';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 7, width * (.25 - stride * .012), 11 - stride, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(player.x, player.y);
    ctx.translate(0, frame.renderOffsetYRatio * height);
    if (frame.flip) ctx.scale(-1, 1);
    ctx.drawImage(
      this.images.heroMovement,
      frame.column * HERO_FRAME_SIZE,
      frame.row * HERO_FRAME_SIZE,
      HERO_FRAME_SIZE,
      HERO_FRAME_SIZE,
      -width / 2,
      -height,
      width,
      height
    );
    ctx.restore();
  }

  drawFountainFx(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 10; i += 1) {
      const angle = i * 2.399 + this.time * .16;
      const radius = (25 + (i % 4) * 18) * WORLD_SCALE;
      const x = SPOTS.fountain.x + Math.cos(angle) * radius;
      const y = SPOTS.fountain.y - 25 * WORLD_SCALE + Math.sin(angle) * radius * .28 - Math.sin(this.time * 2 + i) * 5;
      ctx.globalAlpha = .35 + (i % 3) * .16;
      ctx.fillStyle = i % 2 ? '#dffcff' : '#fff2a3';
      ctx.beginPath();
      ctx.arc(x, y, 2.5 + i % 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawObjectMarkers(ctx, journey) {
    for (const id of ['washPool', 'northGate']) {
      const marker = journey.questMarker(id);
      if (!marker) continue;
      const spot = SPOTS[id];
      this.drawMarker(ctx, marker, spot.x, spot.y - (id === 'washPool' ? 78 : 36));
    }
  }

  render(journey, dt, axis, moving) {
    this.time += dt;
    this.heroFrame = this.heroAnimator.update(dt, axis, moving, journey.currentMoveSpeed || 260);
    const follow = 1 - Math.exp(-Math.max(0, dt) * 5.5);
    this.camera.x += (journey.player.x - this.camera.x) * follow;
    this.camera.y += (journey.player.y - 80 - this.camera.y) * follow;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#c8e0d7';
    ctx.fillRect(0, 0, this.width, this.height);
    const view = this.view();
    const originX = this.width / 2 - view.x * view.scale;
    const originY = this.height / 2 - view.y * view.scale;
    this.lastTransform = { originX, originY, scale: view.scale };
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(view.scale, view.scale);
    ctx.drawImage(this.images.background, 0, 0, MAP.width, MAP.height);
    this.drawCollisionEditor(ctx);
    this.drawFountainFx(ctx);
    const actors = [
      { y: SPOTS.alden.y, draw: () => this.drawNpc(ctx, 'alden', this.images.alden, journey) },
      { y: SPOTS.bronc.y, draw: () => this.drawNpc(ctx, 'bronc', this.images.bronc, journey) },
      { y: SPOTS.phoebe.y, draw: () => this.drawNpc(ctx, 'phoebe', this.images.phoebe, journey) },
      { y: journey.player.y, draw: () => this.drawPlayer(ctx, journey.player, moving) }
    ];
    actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
    this.drawObjectMarkers(ctx, journey);
    ctx.restore();
  }

  dispose() {
    this.images = {};
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}
