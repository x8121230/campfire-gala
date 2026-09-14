import { HILLS_TILES } from './HillsMapV316.js';
import { drawPumpkinBoss } from './PumpkinBoss.js';
import { drawCombatFrame, combatFrameIndex } from './CombatFrames.js';
import { CreatureAnimator, creatureAtlasRigs, drawCreatureFrame } from './CreatureAnimator.js';
import { manaSlashPose, MANA_SLASH } from './ManaSlashTiming.js';
import { GATHER_NODES, HILLS_COMBAT, HILLS_ENTRY, HILLS_MAP, HILLS_OBSTACLES, HILLS_PORTALS, HILLS_SCALE, MOB_TYPES, distance, getHillsCollisionPaint } from './DandelionHillsRules.js';
import { HERO_FRAME_SIZE, HERO_MOVEMENT_ATLAS, HeroMovementAnimator } from './HeroMovementAnimator.js';

const ASSETS = Object.freeze({
  bossFrames: '../../assets/phantom-realm/dawn-dandelion-hills/pumpkin-boss-v315.png',
  combatFrames: '../../assets/phantom-realm/dawn-dandelion-hills/combat-frames-v314.png',
  mouseIdleAtlas: '../../assets/phantom-realm/dawn-dandelion-hills/mouseIdle-v311.png',
  mouseRunAtlas: '../../assets/phantom-realm/dawn-dandelion-hills/mouseRun-v311.png',
  chickFlightAtlas: '../../assets/phantom-realm/dawn-dandelion-hills/chickFlight-v311.png',
  ...Object.fromEntries(HILLS_TILES.map(name => ['terrain_'+name, '../../assets/phantom-realm/dawn-dandelion-hills/map-v316/'+name+'.png'])),
  mouse: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse.png',
  mouseIdle2: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-02.png',
  mouseRun1: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-03.png',
  mouseRun2: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-04.png',
  mouseHit: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-05.png',
  mouseBounce: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-06.png',
  mouseDizzy: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-07.png',
  mousePoof: '../../assets/phantom-realm/dawn-dandelion-hills/mob-poppo-mouse-08.png',
  chick: '../../assets/phantom-realm/dawn-dandelion-hills/mob-floating-chick.png',
  dew: '../../assets/phantom-realm/dawn-dandelion-hills/mob-dew-spirit.png',
  mole: '../../assets/phantom-realm/dawn-dandelion-hills/mob-gardener-mole.png',
  rabbit: '../../assets/phantom-realm/dawn-dandelion-hills/elite-pumpkin-rabbit.png',
  heroMovement: HERO_MOVEMENT_ATLAS
});

const MOB_HEIGHT = Object.freeze({ mouse: 160, chick: 98, dew: 100, mole: 108, rabbit: 148 });

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const timeout = setTimeout(() => reject(new Error('Image load timed out: ' + path)), 10000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Unable to load ' + path)); };
    image.src = new URL(path, import.meta.url).href;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export class DandelionHillsWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.images = {};
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.camera = { x: HILLS_ENTRY.x, y: HILLS_ENTRY.y };
    this.overview = false;
    this.heroAnimator = new HeroMovementAnimator('left');
    this.heroFrame = this.heroAnimator.update(0, { x: -1, y: 0 }, false);
    this.effects = [];
    this.creatureAnimator = new CreatureAnimator();
    this.creatureFrames = null;
    this.shake = 0;
    this.stepCooldown = 0;
    this.collisionEditor = { enabled: false, mode: 'block', radius: 56, cursor: null };
    this.lastTransform = null;
  }

  async load() {
    const loaded = await Promise.all(Object.entries(ASSETS).map(async ([key, path]) => [key, await loadImage(path)]));
    this.images = Object.fromEntries(loaded);
    this.creatureFrames = creatureAtlasRigs(this.images);
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  view() {
    if (this.overview) return { scale: Math.min(this.width / HILLS_MAP.width, this.height / HILLS_MAP.height), x: HILLS_MAP.width / 2, y: HILLS_MAP.height / 2 };
    const visibleWidth = this.height < 520 ? 930 : 1080;
    const visibleHeight = this.height < 520 ? 525 : 660;
    // Avoid magnifying the painted background until it becomes visibly soft on
    // wide desktop displays. The camera shows more of the field instead.
    const scale = Math.min(1.42, Math.max(this.width / visibleWidth, this.height / visibleHeight));
    const halfW = this.width / scale / 2, halfH = this.height / scale / 2;
    return {
      scale,
      x: Math.max(halfW, Math.min(HILLS_MAP.width - halfW, this.camera.x)),
      y: Math.max(halfH, Math.min(HILLS_MAP.height - halfH, this.camera.y))
    };
  }

  consumeEffect(effect) {
    if (effect.kind === 'hurt') this.shake = .28;
    if (effect.kind === 'guardBreak') this.shake = .42;
    const life = { hit: .35, poof: .8, pickup: .8, cast: .3, slash: HILLS_COMBAT.attackDuration, guard: .38, guardBreak: .85, guardRecover: .7, dodge: .45, bounce: .7, gather: .75, hurt: .45, grassStep: .45, splash: .55 }[effect.kind] || .5;
    const creaturePose = effect.kind === 'poof' ? { ...this.creatureAnimator.states.get(effect.target) } : null;
    this.effects.push({ ...effect, creaturePose, life, maxLife: life });
  }

  setCollisionEditor(value = {}) {
    this.collisionEditor = { ...this.collisionEditor, ...value };
  }

  screenToWorld(clientX, clientY) {
    if (!this.lastTransform) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const sx = (clientX - rect.left) * this.width / rect.width;
    const sy = (clientY - rect.top) * this.height / rect.height;
    return {
      x: (sx - this.lastTransform.originX) / this.lastTransform.scale,
      y: (sy - this.lastTransform.originY) / this.lastTransform.scale
    };
  }

  drawCollisionEditor(ctx) {
    if (!this.collisionEditor.enabled) return;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.setLineDash([11, 8]);
    ctx.strokeStyle = 'rgba(255,174,78,.8)';
    ctx.fillStyle = 'rgba(255,145,70,.09)';
    const paint = getHillsCollisionPaint();
    for (const [obstacleIndex, obstacle] of HILLS_OBSTACLES.entries()) {
      if (paint.disabled.includes(obstacleIndex)) continue;
      ctx.beginPath();
      if (obstacle.type === 'ellipse') ctx.ellipse(obstacle.x, obstacle.y, obstacle.rx, obstacle.ry, 0, 0, Math.PI * 2);
      else if (obstacle.type === 'polygon') {
        obstacle.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
      } else {
        ctx.lineWidth = obstacle.r * 2;
        ctx.moveTo(obstacle.x1, obstacle.y1); ctx.lineTo(obstacle.x2, obstacle.y2);
      }
      ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3;
    }
    ctx.setLineDash([]);
    for (const [mode, color] of [['block', '255,70,70'], ['pass', '74,228,153']]) {
      for (const mark of paint[mode]) {
        ctx.fillStyle = `rgba(${color},.23)`; ctx.strokeStyle = `rgba(${color},.95)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mark.x, mark.y, mark.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    const cursor = this.collisionEditor.cursor;
    if (cursor) {
      const color = this.collisionEditor.mode === 'pass' ? '#4aeb9e' : this.collisionEditor.mode === 'erase' ? '#ffffff' : '#ff5d5d';
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([7, 6]);
      ctx.beginPath(); ctx.arc(cursor.x, cursor.y, this.collisionEditor.radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  drawPlayer(ctx, journey, moving) {
    const player = journey.player;
    const height = 123.2;
    const width = height;
    const frame = this.heroFrame;
    const stride = moving ? Math.abs(Math.sin(frame.column * Math.PI / 3)) : 0;
    ctx.save();
    ctx.globalAlpha = .23;
    ctx.fillStyle = '#163e35';
    ctx.beginPath(); ctx.ellipse(player.x, player.y + 7, width * (.25 - stride * .012), 11 - stride, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = journey.invulnerable > 0 && Math.floor(this.time * 14) % 2 ? .45 : 1;
    ctx.translate(player.x, player.y);
    if (journey.downed) {
      ctx.globalAlpha = 1;
      if (frame.flip) ctx.scale(-1, 1);
      drawCombatFrame(ctx, this.images.combatFrames, 2, Math.min(5, Math.floor(journey.downTime / .16)), height * 1.13);
      ctx.restore(); return;
    }
    const beads = Object.keys(journey.inventory).filter((name) => name.includes('珠') && journey.itemCount(name) > 0).slice(0, 3);
    const beadColors = ['#fff3c4', '#79c8ff', '#c99bff'];
    beads.forEach((_name, index) => {
      const angle = this.time * .85 + index * Math.PI * 2 / Math.max(3, beads.length);
      const orbX = Math.cos(angle) * 48;
      const orbY = -76 + Math.sin(angle) * 22;
      ctx.save();
      ctx.shadowColor = beadColors[index]; ctx.shadowBlur = 15;
      ctx.fillStyle = beadColors[index]; ctx.globalAlpha *= .84;
      ctx.beginPath(); ctx.arc(orbX, orbY, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha *= .45;
      ctx.beginPath(); ctx.arc(orbX - Math.cos(angle) * 12, orbY - Math.sin(angle) * 7, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.save();
    const slash = journey.activeSlash;
    const pose = slash ? manaSlashPose(journey.time - slash.start) : null;
    if (pose) {
      ctx.translate(slash.dx * pose.forward, slash.dy * pose.forward * .5);
      ctx.rotate(pose.tilt * slash.dx);
    }
    ctx.rotate(frame.renderTiltRadians);
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
    if (journey.blind > 0) {
      ctx.strokeStyle = '#704a30'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-18, -height * .69); ctx.lineTo(18, -height * .61); ctx.stroke();
    }
    if (journey.stunned > 0) {
      for (let i = 0; i < 3; i += 1) {
        const angle = this.time * 4.8 + i * Math.PI * 2 / 3;
        const sx = Math.cos(angle) * 31, sy = -height - 13 + Math.sin(angle) * 8;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.fillStyle = '#ffe47a'; ctx.strokeStyle = '#7c5932'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const a = -Math.PI / 2 + point * Math.PI / 5, radius = point % 2 ? 3.2 : 7;
          const px = Math.cos(a) * radius, py = Math.sin(a) * radius;
          if (!point) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  }

  drawMob(ctx, mob, journey) {
    if (!mob.alive) return;
    const image = this.images[mob.type];
    const state = this.creatureAnimator.states.get(mob.id);
    const animated = this.creatureFrames && state && ['mouse', 'chick'].includes(mob.type);
    const height = MOB_HEIGHT[mob.type];
    const width = image.width / image.height * height;
    const lift = animated ? state.lift : mob.type === 'rabbit' && mob.boss?.phase === 'leap' ? Math.sin(Math.min(1,mob.boss.elapsed/.55)*Math.PI)*95 : 0;
    const targeted = journey.nearestMob(310)?.id === mob.id;
    ctx.save();
    const hostile = mob.aggro;
    const ringColor = hostile ? '#ff5b52' : '#ffd65c';
    ctx.globalAlpha = hostile ? .32 : .26;
    ctx.fillStyle = ringColor;
    ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 5, width * .31, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#59432bd9'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 4, width * (targeted ? .41 : .36), targeted ? 16 : 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = ringColor; ctx.lineWidth = targeted ? 5.5 : 4.5;
    ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 4, width * (targeted ? .41 : .36), targeted ? 16 : 14, 0, 0, Math.PI * 2); ctx.stroke();
    if (hostile) {
      ctx.globalAlpha = .5 + Math.sin(this.time * 8) * .22;
      ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 4, width * .45, 18, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (mob.hitFlash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 22; }
    if (animated) {
      ctx.save(); ctx.translate(mob.x, mob.y - lift);
      if (state.flip) ctx.scale(-1, 1);
      if (mob.type === 'mouse') {
        const running = state.mix > .5;
        const hit = Math.min(1, mob.hitFlash / .18);
        if (state.mode === 'dizzy') ctx.rotate(Math.sin(state.clock * 9) * .035);
        ctx.scale(1 + hit * .045, 1 - hit * .035);
        drawCreatureFrame(ctx, this.creatureFrames[running ? 'mouseRun' : 'mouseIdle'], running ? state.phase : state.clock / 2.8, width, height);
      } else {
        ctx.rotate(Math.sin(state.clock * 2.4) * .022);
        drawCreatureFrame(ctx, this.creatureFrames.chickFlight, state.phase, width, height);
      }
      ctx.restore();
      if (state.mode === 'dizzy') {
        ctx.fillStyle = '#ffe897'; ctx.font = '15px serif'; ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) {
          const a = this.time * 4 + i * Math.PI * 2 / 3;
          ctx.fillText('✦', mob.x + Math.cos(a) * 19, mob.y - 108 + Math.sin(a) * 5);
        }
      }
    } else if(mob.type === 'rabbit') drawPumpkinBoss(ctx,this.images.bossFrames,mob);
    else if (['mole', 'dew'].includes(mob.type)) {
      ctx.save();ctx.translate(mob.x, mob.y);if (journey.player.x < mob.x) ctx.scale(-1, 1);
      drawCombatFrame(ctx, this.images.combatFrames, mob.type === 'mole' ? 0 : 1, combatFrameIndex(mob), mob.type === 'mole' ? 132 : 122);
      ctx.restore();
    }
    else ctx.drawImage(image, mob.x - width / 2, mob.y - height - lift, width, height);
    ctx.shadowBlur = 0;
    const spec = MOB_TYPES[mob.type];
    if (mob.hp < mob.maxHp || targeted || spec.elite) {
      const barW = spec.elite ? 104 : 72, y = mob.y - (mob.type === 'rabbit' ? 225 : height) * (animated && mob.type === 'mouse' ? .63 : 1) - lift - 18;
      roundedRect(ctx, mob.x - barW / 2, y, barW, 9, 5); ctx.fillStyle = '#253f38c9'; ctx.fill();
      roundedRect(ctx, mob.x - barW / 2 + 2, y + 2, (barW - 4) * mob.hp / mob.maxHp, 5, 3); ctx.fillStyle = spec.elite ? '#e7ae4c' : '#86c784'; ctx.fill();
      ctx.font = '700 17px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff6d6'; ctx.strokeStyle = '#25443b'; ctx.lineWidth = 4;
      ctx.strokeText(`${spec.elite ? '★ ' : ''}${spec.name} ${spec.level}`, mob.x, y - 7); ctx.fillText(`${spec.elite ? '★ ' : ''}${spec.name} ${spec.level}`, mob.x, y - 7);
    }
    ctx.restore();
  }

  drawLoot(ctx, drop) {
    const hover = drop.settled ? 12 + Math.sin(this.time * Math.PI * 2 / 1.2 + drop.groundX) * 5 : drop.lift;
    const y = drop.groundY - hover;
    const color = drop.rarity === 'rare' ? '#79bfff' : drop.rarity === 'quest' ? '#ffe56b' : '#fff5db';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = color; ctx.shadowBlur = drop.rarity === 'rare' ? 25 : 17;
    const pulse = 9 + Math.sin(this.time * 5 + drop.groundX) * 1.5;
    const gradient = ctx.createRadialGradient(drop.groundX - 2, y - 3, 1, drop.groundX, y, pulse * 1.8);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.35, color); gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(drop.groundX, y, pulse * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(drop.groundX, y, pulse * .62, 0, Math.PI * 2); ctx.fill();
    if (drop.rarity === 'quest') { ctx.fillStyle = '#6c5a20'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', drop.groundX, y + 4); }
    ctx.restore();
  }

  drawGather(ctx, node, journey) {
    const state = journey.gathers.find((item) => item.id === node.id);
    if (!state || state.cooldown > 0) return;
    ctx.save();
    ctx.translate(node.x, node.y + Math.sin(this.time * 2 + node.x) * 2);
    ctx.shadowColor = '#fff3a2'; ctx.shadowBlur = 12;
    ctx.fillStyle = node.type === '香脆橡果' ? '#c98436' : '#fff4bd';
    if (node.type === '香脆橡果') { ctx.beginPath(); ctx.ellipse(0, 0, 10, 13, -.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#77512e'; ctx.fillRect(-7, -12, 14, 5); }
    else { ctx.font = '700 27px serif'; ctx.textAlign = 'center'; ctx.fillText('✿', 0, 8); }
    ctx.restore();
  }

  drawPortal(ctx, id, portal, journey) {
    const near = distance(journey.player, portal) < portal.radius;
    if (id === 'camp') {
      const pulse = .5 + Math.sin(this.time * 2.8) * .5;
      ctx.save(); ctx.translate(portal.x, portal.y - 72);
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 118);
      glow.addColorStop(0, 'rgba(255,255,225,.74)'); glow.addColorStop(.45, 'rgba(128,238,213,.25)'); glow.addColorStop(1, 'rgba(128,238,213,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, 0, 105, 124, 0, 0, Math.PI * 2); ctx.fill();
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.save(); ctx.rotate(this.time * (ring % 2 ? -.23 : .19) + ring * .7);
        ctx.strokeStyle = ring === 1 ? 'rgba(255,232,157,.82)' : 'rgba(174,255,231,.76)';
        ctx.lineWidth = 4 - ring * .7; ctx.setLineDash([20 + ring * 5, 12 + ring * 4]);
        ctx.beginPath(); ctx.ellipse(0, 0, 59 + ring * 12, 86 + ring * 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < 10; i += 1) {
        const angle = i * Math.PI * 2 / 10 + this.time * .18;
        ctx.fillStyle = i % 2 ? 'rgba(255,240,176,.9)' : 'rgba(177,251,215,.88)';
        ctx.beginPath(); ctx.ellipse(Math.cos(angle) * (80 + pulse * 4), Math.sin(angle) * (103 + pulse * 5), 5, 10, angle, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = .72 + pulse * .2; ctx.strokeStyle = '#a8e9d4'; ctx.lineWidth = near ? 5 : 3;
      ctx.beginPath(); ctx.ellipse(portal.x, portal.y + 8, 70 + pulse * 4, 20 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff4c6'; ctx.font = '700 14px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = '#24473e'; ctx.lineWidth = 4;
      ctx.strokeText(portal.name, portal.x, portal.y + 48); ctx.fillText(portal.name, portal.x, portal.y + 48); ctx.restore();
      return;
    }
    ctx.save();
    ctx.strokeStyle = id === 'camp' ? '#a8e9d4' : '#8eb8ff'; ctx.lineWidth = near ? 5 : 3; ctx.globalAlpha = .7 + Math.sin(this.time * 3) * .18;
    ctx.beginPath(); ctx.ellipse(portal.x, portal.y, 40, 17, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff4c6'; ctx.font = '700 14px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = '#24473e'; ctx.lineWidth = 4;
    ctx.strokeText(portal.name, portal.x, portal.y - 28); ctx.fillText(portal.name, portal.x, portal.y - 28);
    ctx.restore();
  }

  drawProjectiles(ctx, journey) {
    for (const shot of journey.projectiles) {
      if (shot.kind === 'magicArrow') {
        ctx.save(); ctx.translate(shot.x, shot.y - 42); ctx.rotate(Math.atan2(shot.dy, shot.dx));
        ctx.globalAlpha = Math.min(1, Math.max(0, shot.life / .16));
        const trail = ctx.createLinearGradient(-68,0,18,0); trail.addColorStop(0,'#62ccff00');trail.addColorStop(1,'#bdfaff');
        ctx.strokeStyle=trail;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-68,0);ctx.lineTo(14,0);ctx.stroke();
        ctx.shadowColor='#40baff';ctx.shadowBlur=15;ctx.strokeStyle='#ecffff';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.moveTo(-29,0);ctx.lineTo(15,0);ctx.stroke();ctx.fillStyle='#53bfff';
        ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(9,-10);ctx.lineTo(13,0);ctx.lineTo(9,10);ctx.closePath();ctx.fill();ctx.stroke();
        for (const side of [-1,1]) {ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-33,side*9);ctx.lineTo(-16,side*4);ctx.stroke();}
        ctx.restore();continue;
      }

      const p = Math.max(0, Math.min(1, 1 - shot.life / (shot.maxLife || 2.2)));
      const mud = shot.kind === 'mud', r = mud ? 10 : 12;
      const lift = mud ? 22 + Math.sin(p * Math.PI) * 32 : 42 + Math.sin(this.time * 5) * 3;
      ctx.save();ctx.globalAlpha = Math.min(1, Math.max(0, shot.life / .22));
      ctx.fillStyle = '#51432e30';ctx.beginPath();ctx.ellipse(shot.x,shot.y,9,4,0,0,Math.PI*2);ctx.fill();
      ctx.translate(shot.x, shot.y-lift);ctx.rotate(mud?p*8:0);
      ctx.fillStyle = mud ? '#a27348' : shot.kind === 'seed' ? '#ffe57c' : '#9ce9ff77';ctx.strokeStyle = mud ? '#604129' : '#edffff';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(0,0,r,mud?8:r,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=mud?'#d3ab79':'#ffffff';ctx.beginPath();ctx.arc(-3,-4,mud?2.5:3,0,Math.PI*2);ctx.fill();
      if(mud){ctx.fillStyle='#7e5031';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-12-i*5,3+i*2,2.5-i*.5,0,Math.PI*2);ctx.fill();}}
      ctx.restore();
    }
    for (const trap of journey.traps) {
      ctx.save(); ctx.globalAlpha = .68 + Math.sin(trap.pulse) * .2; ctx.fillStyle = '#e8b64c'; ctx.strokeStyle = '#8a6434'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i += 1) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.ellipse(trap.x + Math.cos(a) * 9, trap.y + Math.sin(a) * 5, 4, 8, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }

  drawEffects(ctx, dt, journey) {
    for (const fx of this.effects) {
      if (fx.kind === 'slash') {
        if (journey.activeSlash?.id !== fx.id) { fx.life = 0; continue; }
        fx.life = Math.max(0, fx.maxLife - (journey.time - fx.start));
      } else fx.life -= dt;
      // Expired effects must never reach Canvas (arc rejects negative radii).
      if (!(fx.life > 0) || !(fx.maxLife > 0)) continue;
      const p = Math.max(0, Math.min(1, 1 - fx.life / fx.maxLife));
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p);
      const color = fx.kind === 'hurt' ? '#ff8f82' : fx.kind === 'pickup' ? (fx.rarity === 'rare' ? '#79bfff' : '#fff1a2') : '#fff4bd';
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
      if (fx.kind === 'slash') {
        const dx = Number.isFinite(fx.dx) ? fx.dx : 1;
        const dy = Number.isFinite(fx.dy) ? fx.dy : 0;
        let targetAngle = Math.atan2(dy, dx);
        // Keep left-facing attacks on the upper half-plane: overhead -> left,
        // never the accidental lower-left -> upward reverse cut.
        if (dx < 0 && targetAngle > 0) targetAngle -= Math.PI * 2;
        let startAngle = -Math.PI / 2;
        if (dy < -.66) startAngle = dx < 0 ? -Math.PI : 0;
        const elapsed = journey.time - fx.start;
        const pose = manaSlashPose(elapsed);
        const formation = pose.formation;
        const swingTime = pose.swing;
        const eased = pose.swing;
        const swordAngle = startAngle + (targetAngle - startAngle) * eased;
        // The spell forms at the star-wand tip, not at the character's body.
        const pivotX = fx.x + dx * 38 - dy * 12;
        const pivotY = fx.y - 67 + dy * 22;
        ctx.globalCompositeOperation = 'screen';

        // Blue mana gathers above the hero before the kendo-style cut.
        for (let i = 0; i < 12; i += 1) {
          const a = i * Math.PI * 2 / 12 + this.time * (i % 2 ? 2.4 : -1.8);
          const gather = (1 - formation) * (54 + i % 3 * 8);
          const px = pivotX + Math.cos(a) * gather;
          const py = pivotY - 58 + Math.sin(a) * gather * .58;
          ctx.globalAlpha = pose.bladeAlpha * (.35 + formation * .55);
          ctx.fillStyle = i % 3 ? '#63cfff' : '#d8f8ff';
          ctx.beginPath(); ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
        }

        // Three translucent blade afterimages make the swing direction legible.
        if (swingTime > 0) {
          for (let trail = 3; trail >= 1; trail -= 1) {
            const oldEase = Math.max(0, eased - trail * .1);
            const oldAngle = startAngle + (targetAngle - startAngle) * oldEase;
            ctx.save(); ctx.translate(pivotX, pivotY); ctx.rotate(oldAngle);
            ctx.globalAlpha = pose.bladeAlpha * (.04 + (4 - trail) * .035);
            ctx.strokeStyle = trail === 1 ? '#7fe4ff' : '#3d7dff';
            ctx.lineWidth = 13 - trail * 2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(116, 0); ctx.stroke(); ctx.restore();
          }
        }

        // The actual mana sword keeps its blue pigment against the bright meadow.
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(pivotX, pivotY); ctx.rotate(swordAngle);
        ctx.globalAlpha = pose.bladeAlpha;
        ctx.shadowColor = '#36a9ff'; ctx.shadowBlur = 16;
        const blade = ctx.createLinearGradient(13, 0, 125, 0);
        blade.addColorStop(0, '#225cce'); blade.addColorStop(.45, '#288fdc'); blade.addColorStop(.78, '#67dcff'); blade.addColorStop(1, 'rgba(126,225,255,0)');
        ctx.fillStyle = blade; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(104, -9.75); ctx.lineTo(132, 0); ctx.lineTo(104, 9.75); ctx.lineTo(14, 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = elapsed >= MANA_SLASH.windup && elapsed <= MANA_SLASH.impact + MANA_SLASH.contactHold ? '#e9fdff' : '#63cfff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(119, 0); ctx.stroke();
        ctx.shadowBlur = 16; ctx.strokeStyle = '#8be8ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(2, -18); ctx.lineTo(2, 18); ctx.stroke();
        ctx.fillStyle = '#fff4a8'; ctx.beginPath();
        for (let n = 0; n < 10; n += 1) { const a = -Math.PI / 2 + n * Math.PI / 5, r = n % 2 ? 5 : 11; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (!n) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fill(); ctx.restore();

        // A forward blue pressure wave finishes the strike instead of a plain arc.
        if (elapsed >= MANA_SLASH.impact && pose.wave < 1) {
          const wave = pose.wave;
          ctx.save(); ctx.translate(pivotX + dx * (68 + wave * 54), pivotY + 30 + dy * (35 + wave * 35)); ctx.rotate(targetAngle);
          ctx.globalAlpha = (1 - wave) * .5;
          ctx.shadowColor = '#56cfff'; ctx.shadowBlur = 24;
          ctx.strokeStyle = '#bff7ff'; ctx.lineWidth = 6 * (1 - wave * .55); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(0, 0, 42 + wave * 52, -1.05, 1.05); ctx.stroke();
          ctx.strokeStyle = '#438dff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 51 + wave * 57, -.92, .92); ctx.stroke();
          for (let i = 0; i < 7; i += 1) { const a = -.9 + i * .3; ctx.fillStyle = i % 2 ? '#78dcff' : '#e3fbff'; ctx.beginPath(); ctx.arc(Math.cos(a) * (58 + wave * 70), Math.sin(a) * (58 + wave * 70), 2.5 + (1 - wave) * 2, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
      } else if (fx.kind === 'guard') {
        const dx = fx.dx || 1, dy = fx.dy || 0;
        ctx.translate(fx.x + dx * 45, fx.y - 56 + dy * 25);
        ctx.rotate(Math.atan2(dy, dx));
        const pulse = 1 + Math.sin(p * Math.PI) * .14;
        ctx.scale(pulse, pulse);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = (1 - p) * .9;
        ctx.shadowColor = '#9cecff'; ctx.shadowBlur = 22;
        ctx.fillStyle = 'rgba(126,220,255,.26)'; ctx.strokeStyle = '#eaffff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(15, -42); ctx.bezierCurveTo(43, -30, 43, 23, 0, 45); ctx.bezierCurveTo(-43, 23, -43, -30, -15, -42); ctx.quadraticCurveTo(0, -51, 15, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ffe990'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -2, 13 + p * 8, 0, Math.PI * 2); ctx.stroke();
      } else if (fx.kind === 'guardBreak') {
        ctx.translate(fx.x, fx.y - 48);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = '#ffcf72'; ctx.fillStyle = '#a7eaff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 24 + p * 58, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 9; i += 1) {
          const a = i * Math.PI * 2 / 9 + .15;
          const r = 18 + p * 72;
          ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(8, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      } else if (fx.kind === 'guardRecover') {
        ctx.translate(fx.x, fx.y - 48); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = '#b8f4d4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 18 + p * 45, 0, Math.PI * 2); ctx.stroke();
      } else if (fx.kind === 'poof' && this.creatureFrames && ['mouse', 'chick'].includes(fx.type)) {
        const pose = fx.creaturePose || {};
        const rig = fx.type === 'chick' ? this.creatureFrames.chickFlight : this.creatureFrames[pose.mode === 'run' ? 'mouseRun' : 'mouseIdle'];
        const source = this.images[fx.type], h = MOB_HEIGHT[fx.type], w = h * source.width / source.height;
        ctx.save(); ctx.translate(fx.x, fx.y - (pose.lift || 0) - p * 9);
        if (pose.flip) ctx.scale(-1, 1);
        ctx.scale(1 - p * .1, 1 - p * .1);
        ctx.globalAlpha = Math.max(0, 1 - p * 1.6);
        drawCreatureFrame(ctx, rig, pose.mode === 'run' || fx.type === 'chick' ? (pose.phase || 0) : (pose.clock || 0) / 2.8, w, h);
        ctx.restore();
        ctx.globalAlpha = (1 - p) * .7; ctx.fillStyle = '#fff0b4';
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          ctx.beginPath(); ctx.arc(fx.x + Math.cos(a) * p * 38, fx.y - h * .35 + Math.sin(a) * p * 27, 2.5 * (1 - p), 0, Math.PI * 2); ctx.fill();
        }
      } else if (fx.kind === 'bossSlam') {
        ctx.strokeStyle='#ffc56a';ctx.lineWidth=6*(1-p)+1;ctx.beginPath();ctx.ellipse(fx.x,fx.y,20+p*100,12+p*60,0,0,Math.PI*2);ctx.stroke();
      } else if(fx.kind==='poof'&&fx.type==='rabbit') {
        drawPumpkinBoss(ctx,this.images.bossFrames,{x:fx.x,y:fx.y,alive:false});
      } else if (fx.kind === 'projectileEnd') {
        ctx.fillStyle = fx.type === 'mud' ? '#bb8857' : '#cbfaff';
        for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(fx.x+Math.cos(a)*p*22,fx.y-25+Math.sin(a)*p*15,Math.max(.2,3*(1-p)),0,Math.PI*2);ctx.fill();}
      } else if (fx.kind === 'grassStep') {
        ctx.strokeStyle = '#8fc56d'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.moveTo(fx.x + i * 7, fx.y); ctx.lineTo(fx.x + i * 10, fx.y - 5 - p * 9); ctx.stroke(); }
      } else if (fx.kind === 'splash') {
        ctx.strokeStyle = '#bceef4'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(fx.x, fx.y, 8 + p * 22, 3 + p * 8, 0, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(fx.x - 12, fx.y - p * 18, 2.5, 0, Math.PI * 2); ctx.arc(fx.x + 12, fx.y - p * 16, 2.5, 0, Math.PI * 2); ctx.fill();
      } else if (fx.kind === 'poof' || fx.kind === 'hit' || fx.kind === 'gather') { ctx.beginPath(); ctx.arc(fx.x, fx.y - 36, 12 + p * 42, 0, Math.PI * 2); ctx.stroke(); }
      else { for (let i = 0; i < 7; i += 1) { const a = i * .9; ctx.beginPath(); ctx.arc(fx.x + Math.cos(a) * p * 55, fx.y - 30 + Math.sin(a) * p * 45, 3, 0, Math.PI * 2); ctx.fill(); } }
      ctx.restore();
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  render(journey, dt, axis, moving) {
    this.time += dt;
    for (const mob of journey.mobs) this.creatureAnimator.update(mob, dt);
    // Match the locked damage direction; walking input cannot turn a locked strike.
    const slash = journey.activeSlash;
    if (slash && this.renderSlashId !== slash.id) {
      this.heroAnimator.wasMoving = false;
      this.heroAnimator.updateDirection(0, { x: slash.dx, y: slash.dy }, true);
      this.heroAnimator.stopSettle = 0;
      this.renderSlashId = slash.id;
    }
    this.heroFrame = this.heroAnimator.update(dt, slash ? { x: slash.dx, y: slash.dy } : axis, moving, journey.currentMoveSpeed || 260);
    this.shake = Math.max(0, this.shake - dt);
    this.stepCooldown = Math.max(0, this.stepCooldown - dt);
    if (moving && this.stepCooldown <= 0) {
      this.stepCooldown = .18;
      const dx = (journey.player.x - 2776) / 180;
      const dy = (journey.player.y - 160) / 96;
      this.consumeEffect({ kind: dx * dx + dy * dy < 1 ? 'splash' : 'grassStep', x: journey.player.x, y: journey.player.y + 3 });
    }
    const follow = 1 - Math.exp(-dt * 5.5);
    this.camera.x += (journey.player.x - this.camera.x) * follow;
    this.camera.y += (journey.player.y - 70 - this.camera.y) * follow;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#c9e0d7'; ctx.fillRect(0, 0, this.width, this.height);
    const view = this.view();
    const shakeX = this.shake ? Math.sin(this.time * 75) * 7 : 0;
    const originX = Math.round((this.width / 2 - view.x * view.scale + shakeX) * this.dpr) / this.dpr;
    const originY = Math.round((this.height / 2 - view.y * view.scale) * this.dpr) / this.dpr;
    this.lastTransform = { originX, originY, scale: view.scale };
    ctx.save(); ctx.translate(originX, originY); ctx.scale(view.scale, view.scale);
    for(let i=0;i<HILLS_TILES.length;i++) {
      const x=(i%3)*1576,y=Math.floor(i/3)*888;
      if(x+1576<view.x-this.width/view.scale/2||x>view.x+this.width/view.scale/2||y+888<view.y-this.height/view.scale/2||y>view.y+this.height/view.scale/2)continue;
      ctx.drawImage(this.images['terrain_'+HILLS_TILES[i]],x,y);
    }
    this.drawCollisionEditor(ctx);
    for (const node of GATHER_NODES) this.drawGather(ctx, node, journey);
    this.drawPortal(ctx, 'camp', HILLS_PORTALS.camp, journey);
    this.drawPortal(ctx, 'forest', HILLS_PORTALS.forest, journey);
    for(const mob of journey.mobs) {
      const b=mob.boss;
      if(!mob.alive||!b||!['slamWindup','leap'].includes(b.phase))continue;
      ctx.save();ctx.fillStyle='#ff984a44';ctx.strokeStyle='#ffdf8b';ctx.lineWidth=5;
      ctx.beginPath();ctx.ellipse(b.target.x,b.target.y,105,65,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#6b3223';ctx.font='bold 25px sans-serif';ctx.textAlign='center';ctx.fillText('!',b.target.x,b.target.y+8);ctx.restore();
    }
    const actors = journey.mobs.filter((mob) => mob.alive).map((mob) => ({ y: mob.y, draw: () => this.drawMob(ctx, mob, journey) }));
    actors.push({ y: journey.player.y, draw: () => this.drawPlayer(ctx, journey, moving) });
    actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
    this.drawProjectiles(ctx, journey);
    for (const drop of journey.loot) this.drawLoot(ctx, drop);
    this.drawEffects(ctx, dt, journey);
    ctx.restore();
  }

  dispose() { this.images = {}; this.effects = []; this.creatureFrames = null; this.creatureAnimator.states.clear(); this.canvas.width = 1; this.canvas.height = 1; }
}
