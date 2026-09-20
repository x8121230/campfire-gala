import { SMALL_CREATURE_TYPES, updateSmallCreature } from './CreatureLifeV318.js';
import { regenerateSkillResource } from './RealmSkillResource.js';
import { NEW_HILLS_SIZE, NEW_HILLS_OBSTACLES, HILLS_OUTER, islandPoint, HILLS_BRIDGES } from './HillsMapV316.js';
import { updatePumpkinBossV321, advancePumpkinProjectile, clearPumpkinAttacks } from './PumpkinCombatV321.js';
import { MANA_SLASH } from './ManaSlashTiming.js';
import { movementProfile } from './RealmMovementProfilesV325.js';
export const HILLS_SCALE = 2;
export const HILLS_MAP = Object.freeze(NEW_HILLS_SIZE);

const at = (item) => Object.freeze({
  ...item,
  x: item.x * HILLS_SCALE,
  y: item.y * HILLS_SCALE
});

const location=(x,y)=>{const [wx,wy]=islandPoint([x,y]);return {x:wx,y:wy};};
export const HILLS_PORTALS=Object.freeze({
 camp:{...location(1317,791),name:'返回星芽營地',radius:120},
 forest:{...location(1460,180),name:'螢火古橡樹林入口',radius:100}
});
export const HILLS_ENTRY=Object.freeze(location(1270,720));
export const GATHER_NODES=Object.freeze([
 {id:'dandelion-a',type:'晨曦蒲公英',...location(755,426)},
 {id:'dandelion-b',type:'晨曦蒲公英',...location(1130,650)},
 {id:'acorn-a',type:'香脆橡果',...location(1260,711)},
 {id:'acorn-b',type:'香脆橡果',...location(1095,694)}
]);

export const MOB_TYPES = Object.freeze({
  mouse: { id: 'MOB_01', name: '草地波波鼠', level: 'Lv.1～3', hp: 3, speed: 72, temperament: 'passive' },
  chick: { id: 'MOB_02', name: '蒲公英浮空雀', level: 'Lv.2～3', hp: 3, speed: 54, temperament: 'passive' },
  dew: { id: 'MOB_03', name: '星芽露珠精靈', level: 'Lv.4～6', hp: 5, speed: 46, temperament: 'neutral' },
  mole: { id: 'MOB_04', name: '園藝小鼴鼠', level: 'Lv.4～5', hp: 5, speed: 42, temperament: 'neutral' },
  rabbit: { id: 'ELITE_01', name: '貪食的南瓜兔', level: 'Lv.8 稀有', hp: 28, speed: 34, temperament: 'neutral', elite: true }
});

export const HILLS_COMBAT = Object.freeze({
  slashRange: 205,
  slashConeDot: .42,
  attackDuration: MANA_SLASH.duration,
  attackCooldown: MANA_SLASH.cooldown,
  attackImpact: MANA_SLASH.impact,
  attackMoveUnlock: MANA_SLASH.moveUnlock,
  shieldMax: 100,
  shieldDamagePerHit: 25,
  guardConeDot: .34,
  guardBreakStun: 2,
  guardBreakRecovery: 25,
  guardBreakGrace: .5
});

// Fixed ecological slots: the original 18 actors made the entrance look like a
// monster pile. Keep exactly half the population and revive each defeated slot
// in place instead of appending new actors. This guarantees the cap can never
// grow during a long play session.
const SPAWNS=Object.freeze([
 ['mouse',1260,640],['mouse',1175,650],['mouse',1080,710],
 ['chick',930,575],['chick',650,455],['mole',730,400],
 ['dew',545,310],['dew',590,370],['rabbit',280,462]
].map(([type,x,y])=>[type,...islandPoint([x,y])]));

export const HILLS_POPULATION = Object.freeze({
  total: SPAWNS.length,
  mouse: SPAWNS.filter(([type]) => type === 'mouse').length,
  chick: SPAWNS.filter(([type]) => type === 'chick').length,
  mole: SPAWNS.filter(([type]) => type === 'mole').length,
  dew: SPAWNS.filter(([type]) => type === 'dew').length,
  rabbit: SPAWNS.filter(([type]) => type === 'rabbit').length
});

const OUTER = Object.freeze(HILLS_OUTER);

export const HILLS_OBSTACLES = Object.freeze(NEW_HILLS_OBSTACLES);

// Player-authored collision paint is deliberately kept separate from the map
// landmarks above. Red circles add blockers; green circles repair an unwanted
// blocker. The outer island silhouette always remains a hard safety boundary.
let collisionPaint = { block: [], pass: [], disabled: [] };

const safePaintCircles = (items) => (Array.isArray(items) ? items : []).slice(0, 2400).map((item) => ({
  x: Number(item?.x), y: Number(item?.y), r: Math.max(12, Math.min(220, Number(item?.r) || 0))
})).filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y));

export function setHillsCollisionPaint(value = {}) {
  collisionPaint = {
    block: safePaintCircles(value.block),
    pass: safePaintCircles(value.pass),
    disabled: [...new Set((Array.isArray(value.disabled) ? value.disabled : []).map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < HILLS_OBSTACLES.length))]
  };
  return getHillsCollisionPaint();
}

export function getHillsCollisionPaint() {
  return {
    block: collisionPaint.block.map((item) => ({ ...item })),
    pass: collisionPaint.pass.map((item) => ({ ...item })),
    disabled: [...collisionPaint.disabled]
  };
}

export function addHillsCollisionMark(mode, mark) {
  if (mode !== 'block' && mode !== 'pass') return getHillsCollisionPaint();
  const [safe] = safePaintCircles([mark]);
  if (safe) collisionPaint[mode].push(safe);
  if (collisionPaint[mode].length > 2400) collisionPaint[mode].splice(0, collisionPaint[mode].length - 2400);
  return getHillsCollisionPaint();
}

export function eraseHillsCollisionMarks(x, y, radius) {
  const r = Math.max(12, Number(radius) || 0);
  for (const mode of ['block', 'pass']) {
    collisionPaint[mode] = collisionPaint[mode].filter((mark) => Math.hypot(mark.x - x, mark.y - y) > mark.r + r * .55);
  }
  return getHillsCollisionPaint();
}

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1;
  const lengthSquared = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / lengthSquared));
  return Math.hypot(x - (x1 + vx * t), y - (y1 + vy * t));
}

function obstacleContains(obstacle, x, y, radius = 0) {
  if (obstacle.type === 'polygon') {
    if (inPolygon(x, y, obstacle.points)) return true;
    return obstacle.points.some(([x1, y1], index) => {
      const [x2, y2] = obstacle.points[(index + 1) % obstacle.points.length];
      return distanceToSegment(x, y, x1, y1, x2, y2) <= radius;
    });
  }
  if (obstacle.type === 'capsule') return distanceToSegment(x, y, obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2) < obstacle.r + radius;
  const dx = (x - obstacle.x) / (obstacle.rx + radius);
  const dy = (y - obstacle.y) / (obstacle.ry + radius);
  return dx * dx + dy * dy < 1;
}

export function disableHillsObstaclesAt(x, y, radius) {
  const r = Math.max(12, Number(radius) || 0);
  HILLS_OBSTACLES.forEach((obstacle, index) => {
    if (!collisionPaint.disabled.includes(index) && obstacleContains(obstacle, x, y, r)) collisionPaint.disabled.push(index);
  });
  collisionPaint.disabled.sort((a, b) => a - b);
  return getHillsCollisionPaint();
}

const DROP_DATA = Object.freeze({
  mouse: [['蓬鬆絨毛', .82], ['香脆橡果', .78], ['橡果迅捷珠', .035]],
  chick: [['鵝黃羽毛', .86], ['微光種子', .55], ['輕羽漂浮珠', .035]],
  dew: [['晨曦露水', .9], ['純淨星芽膠', .72], ['露珠回響珠', .04]],
  mole: [['肥沃泥土', .9], ['嫩草根', .62], ['綠指採集珠', .04]],
  rabbit: [['金彩紙糖果袋', 1], ['手繪布偶飾品', 1], ['蜜糖貪食珠', 1]]
});

export const HILLS_RESPAWN_SECONDS = Object.freeze({ mouse: 12, chick: 16, dew: 18, mole: 20, rabbit: 540 });

function inPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

export function hillsWalkable(x, y, radius = 15) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !inPolygon(x, y, OUTER)) return false;
  if (collisionPaint.block.some((mark) => Math.hypot(x - mark.x, y - mark.y) < mark.r + radius)) return false;
  if (collisionPaint.pass.some((mark) => Math.hypot(x - mark.x, y - mark.y) < Math.max(4, mark.r - radius))) return true;
  if (HILLS_BRIDGES.some(bridge=>obstacleContains(bridge,x,y,-radius))) return true;
  return !HILLS_OBSTACLES.some((obstacle, index) => !collisionPaint.disabled.includes(index) && obstacleContains(obstacle, x, y, radius));
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function safeSaved(saved) {
  return saved && saved.v === 1 && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}

export class DandelionHillsJourney {
  constructor(saved) {
    const data = safeSaved(saved);
    this.learnedSkills=[];this.damage=1;this.moveMultiplier=1;this.movementProfile='sprout';
    this.time = 0;
    this.player = { x: HILLS_ENTRY.x, y: HILLS_ENTRY.y };
    this.downed = false;
    this.downTime = 0;
    this.revivePrompted = false;
    this.hp = 3;
    this.maxHp = 3;
    this.maxMana = 3;
    this.mana = Number.isFinite(data.mana) ? Math.max(0, Math.min(3, Math.floor(data.mana))) : 3;
    this.spRegenElapsed = 0;
    this.invulnerable = 0;
    this.blind = 0;
    this.speedBuff = 0;
    this.attackCooldown = 0;
    this.attackWindow = 0;
    this.attackMoveLock = 0;
    this.activeSlash = null;
    this.slashSerial = 0;
    this.dodgeCooldown = 0;
    this.shieldMax = HILLS_COMBAT.shieldMax;
    this.shieldDurability = Math.max(0, Math.min(this.shieldMax, Number(data.shieldDurability ?? this.shieldMax) || 0));
    this.stunned = 0;
    this.guardBreaks = 0;
    this.facing = { x: -1, y: 0 };
    this.currentMoveSpeed = 0;
    this.questStage = Math.max(0, Math.min(2, Math.floor(Number(data.questStage) || 0)));
    this.mouseProgress = Math.max(0, Math.min(6, Math.floor(Number(data.mouseProgress) || 0)));
    this.inventory = data.inventory && typeof data.inventory === 'object' ? { ...data.inventory } : {};
    this.tutorialLoot = Boolean(data.tutorialLoot);
    this.met = new Set(Array.isArray(data.met) ? data.met.filter(Number.isInteger) : []);
    this.rng = (Math.floor(Number(data.rng)) >>> 0) || 0x5eed1234;
    this.messages = [];
    this.effects = [];
    this.projectiles = [];
    this.loot = [];
    this.traps = [];
    this.gather = null;
    this.gathers = GATHER_NODES.map((node) => ({ ...node, cooldown: 0 }));
    this.bounceCooldown = 0;
    this.migration = 0;
    this.nextMigration = 480 + this.random() * 420;
    this.mobs = SPAWNS.map(([type, x, y], id) => this.makeMob(id, type, x, y));
    this.dirty = false;
  }

  random() {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }

  makeMob(id, type, x, y) {
    if (SMALL_CREATURE_TYPES.includes(type) && !hillsWalkable(x,y)) {
      let found = false;
      for (let r=12;r<=180&&!found;r+=12) for (let i=0;i<24;i++) {
        const a=i*Math.PI/12,nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;
        if(hillsWalkable(nx,ny)){x=nx;y=ny;found=true;break;}
      }
    }
    const spec = MOB_TYPES[type];
    return { id, type, x, y, animTime: 0, walkDistance: 0, moveSpeed: 0, faceLeft: false, roamWait: .5 + id*.17, deathTime: 0, homeX: x, homeY: y, hp: spec.hp, maxHp: spec.hp, alive: true, respawn: 0, aggro: false, hitFlash: 0, flee: 0, float: 0, dizzy: 0, attack: .8 + this.random() * 1.4, engaged: false, cast: null, recovery: 0, boss: null };
  }

  export() {
    return { v: 1, questStage: this.questStage, mouseProgress: this.mouseProgress, inventory: { ...this.inventory }, tutorialLoot: this.tutorialLoot, met: [...this.met], rng: this.rng, mana: this.mana, shieldDurability: this.shieldDurability };
  }

  say(text, sound = '') { this.messages.push({ text, sound }); }
  effect(kind, data = {}) { this.effects.push({ kind, ...data }); }

  itemCount(name) { return Math.max(0, Math.floor(Number(this.inventory[name]) || 0)); }

  objective() {
    if (this.questStage === 0) return `MAIN_02 軟綿綿的試煉｜波波鼠 ${this.mouseProgress}/6・香脆橡果 ${Math.min(4, this.itemCount('香脆橡果'))}/4`;
    if (this.questStage === 1) return `MAIN_03 磨亮第一顆星核珠｜純淨星芽膠 ${Math.min(5, this.itemCount('純淨星芽膠'))}/5`;
    return '丘陵探索完成｜可採集、挑戰南瓜兔或返回營地';
  }

  nearby() {
    for (const [id, portal] of Object.entries(HILLS_PORTALS)) if (distance(this.player, portal) < portal.radius) return { kind: 'portal', id, ...portal };
    let best = null;
    for (const node of this.gathers) {
      const d = distance(this.player, node);
      if (d < 66 && (!best || d < best.distance)) best = { kind: 'gather', id: node.id, name: node.type, distance: d };
    }
    return best;
  }

  moveBody(body, dx, dy) {
    let moved = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 7));
    for (let i = 0; i < steps; i += 1) {
      if (hillsWalkable(body.x + dx / steps, body.y)) { body.x += dx / steps; moved = true; }
      if (hillsWalkable(body.x, body.y + dy / steps)) { body.y += dy / steps; moved = true; }
    }
    return moved;
  }

  move(dt, axis, dodge = false) {
    if (this.downed) return false;
    if (this.stunned > 0 || this.attackMoveLock > 0) { this.currentMoveSpeed = 0; return false; }
    const length = Math.hypot(axis.x, axis.y);
    if (length < .12) { this.currentMoveSpeed = 0; return false; }
    // Input after 0.32s cancels only the remaining pose and blade; damage already resolved.
    if (this.activeSlash) this.activeSlash = null;
    this.facing = { x: axis.x / length, y: axis.y / length };
    const pacing = movementProfile(this.movementProfile);
    let speed = pacing.walkSpeed * (this.moveMultiplier||1) * (this.speedBuff > 0 ? 1.12 : 1);
    if (dodge && this.dodgeCooldown <= 0) {
      speed *= 2.45;
      this.dodgeCooldown = 2.2;
      this.invulnerable = Math.max(this.invulnerable, .28);
      this.effect('dodge', { x: this.player.x, y: this.player.y });
    }
    const moved = this.moveBody(this.player, this.facing.x * speed * dt, this.facing.y * speed * dt);
    this.currentMoveSpeed = moved ? speed : 0;
    if (moved && this.gather) { this.gather = null; this.say('移動使採集中斷。'); }
    return moved;
  }

  nearestMob(range = 300) {
    let best = null, bestDistance = range;
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const d = distance(this.player, mob);
      if (d < bestDistance) { best = mob; bestDistance = d; }
    }
    return best;
  }

  attack() {
    if(!this.learnedSkills.includes('slash'))return false;
    if (this.downed) return false;
    if (this.attackWindow > 0 || this.attackCooldown > 0 || this.blind > 0 || this.stunned > 0) return false;
    const target = this.nearestMob(HILLS_COMBAT.slashRange);
    if (target) {
      const d = distance(this.player, target) || 1;
      this.facing = { x: (target.x - this.player.x) / d, y: (target.y - this.player.y) / d };
    }
    this.attackCooldown = HILLS_COMBAT.attackCooldown;
    this.attackWindow = HILLS_COMBAT.attackDuration;
    this.attackMoveLock = HILLS_COMBAT.attackMoveUnlock;
    this.activeSlash = { id: ++this.slashSerial, start: this.time, x: this.player.x, y: this.player.y, dx: this.facing.x, dy: this.facing.y, resolved: false };
    this.effect('slash', { ...this.activeSlash });
    return true;
  }

  castMagicArrow() {
    // Reserved for a future learned skill; unavailable in this release.
    return false;
  }

  resolveSlash() {
    const slash = this.activeSlash;
    if (!slash || slash.resolved) return;
    slash.resolved = true;
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const d = distance(slash, mob);
      if (d > HILLS_COMBAT.slashRange || d < 1) continue;
      const dot = ((mob.x - slash.x) * slash.dx + (mob.y - slash.y) * slash.dy) / d;
      if (dot >= HILLS_COMBAT.slashConeDot) this.hitMob(mob, this.damage||1);
    }
    return true;
  }

  canGuardFrom(source) {
    if (!source || this.stunned > 0 || this.attackWindow > 0 || this.shieldDurability <= 0) return false;
    const dx = source.x - this.player.x, dy = source.y - this.player.y;
    const d = Math.hypot(dx, dy) || 1;
    return (dx / d) * this.facing.x + (dy / d) * this.facing.y >= HILLS_COMBAT.guardConeDot;
  }

  hitMob(mob, power = 1) {
    if (!mob?.alive) return;
    mob.hp = Math.max(0, mob.hp - power);
    mob.hitFlash = .18;
    mob.aggro = mob.type === 'chick' || MOB_TYPES[mob.type].temperament !== 'passive';
    if (mob.type === 'mouse') {
      mob.flee = 2.3;
      mob.float = .38;
      if (!mob.engaged) {
        mob.engaged = true;
        this.met.add(mob.id);
        this.mouseProgress = Math.min(6, this.mouseProgress + 1);
        this.dirty = true;
      }
    }
    if (mob.type === 'chick') mob.float = 1.15;
    this.effect('hit', { x: mob.x, y: mob.y, target: mob.id, type: mob.type });
    if (mob.hp <= 0) this.defeat(mob);
    this.checkQuest();
  }

  defeat(mob) {
    if (!mob.alive) return;
    if(mob.type==='rabbit')clearPumpkinAttacks(this,mob);
    mob.alive = false; mob.deathTime = 0; mob.cast = null; mob.moveSpeed = 0;
    mob.respawn = HILLS_RESPAWN_SECONDS[mob.type];
    mob.aggro = false;
    this.effect('souvenirDefeat', {type:mob.type});
    this.effect('poof', { x: mob.x, y: mob.y, type: mob.type, target: mob.id, faceLeft: mob.faceLeft });
    const table = DROP_DATA[mob.type];
    for (const [name, chance] of table) {
      let drops = this.random() < chance;
      if (mob.type === 'mouse' && name === '香脆橡果' && this.itemCount(name) < 4) drops = true;
      if (drops) this.spawnLoot(mob.x, mob.y, name, name.includes('珠') ? 'rare' : (name === '純淨星芽膠' && this.questStage === 1 ? 'quest' : 'common'));
    }
    if (mob.type === 'rabbit') {
      for (let i = 0; i < 6; i += 1) this.spawnLoot(mob.x, mob.y, i % 2 ? '銀幣袋' : '金彩紙糖果袋', 'common');
    }
  }

  spawnLoot(x, y, name, rarity = 'common') {
    const angle = this.random() * Math.PI * 2;
    this.loot.push({
      id: `${this.time}-${this.random()}`, name, rarity, x, y, groundX: x, groundY: y,
      vx: Math.cos(angle) * 58, vy: Math.sin(angle) * 38, lift: 0, liftVelocity: 390,
      bounces: 0, settled: false, magnet: false, age: 0, ownerId: 'local', privateUntil: 15,
      personal: rarity === 'quest', lifetime: 60
    });
  }

  magnetRadius() { return 92 + (this.itemCount('橡果迅捷珠') > 0 ? 42 : 0); }

  collect(drop) {
    this.inventory[drop.name] = this.itemCount(drop.name) + 1;
    this.dirty = true;
    this.effect('pickup', { x: this.player.x, y: this.player.y, name: drop.name, rarity: drop.rarity });
    this.say(`${drop.name} +1`, drop.rarity === 'rare' ? 'finish' : 'correct');
    if (!this.tutorialLoot) {
      this.tutorialLoot = true;
      this.say('光團會在靠近時化成流光，自動飛進背包。掉落物會保留60秒。');
    }
    this.checkQuest();
  }

  checkQuest() {
    if (this.questStage === 0 && this.mouseProgress >= 6 && this.itemCount('香脆橡果') >= 4) {
      this.questStage = 1;
      this.dirty = true;
      this.say('MAIN_02 完成！軟綿綿的試煉通過了。菲比正在等待5份純淨星芽膠。', 'finish');
    }
    if (this.questStage === 1 && this.itemCount('純淨星芽膠') >= 5) {
      this.questStage = 2;
      this.inventory['微光星芽珠'] = Math.max(1, this.itemCount('微光星芽珠'));
      this.dirty = true;
      this.say('MAIN_03 完成！菲比已能替你磨亮第一顆星核珠。', 'finish');
    }
  }

  interact() {
    if (this.downed) return {};
    const nearby = this.nearby();
    if (!nearby) return { message: '靠近採集物或花環入口再互動。' };
    if (nearby.kind === 'portal') {
      if (nearby.id === 'camp') return { travel: 'camp', title: '返回星芽營地', message: '沿著花環木橋回到星芽營地。' };
      return { title: '古橡樹林尚未開放', message: '林間傳來藍莓落下的聲音。完成後續主線後再前往。' };
    }
    const node = this.gathers.find((item) => item.id === nearby.id);
    if (node.cooldown > 0) return { message: '這處素材正在重新生長。' };
    this.gather = { id: node.id, elapsed: 0, duration: 1.35 };
    if (node.type === '晨曦蒲公英') {
      for (const mob of this.mobs) if (mob.type === 'mole' && mob.alive && distance(mob, node) < 190) mob.aggro = true;
    }
    return { message: `開始採集${node.type}…不要移動。` };
  }

  finishGather() {
    const node = this.gathers.find((item) => item.id === this.gather?.id);
    this.gather = null;
    if (!node) return;
    const amount = this.migration > 0 && node.type === '晨曦蒲公英' ? 2 : 1;
    this.inventory[node.type] = this.itemCount(node.type) + amount;
    node.cooldown = 25;
    this.dirty = true;
    this.effect('gather', { x: node.x, y: node.y, name: node.type });
    this.say(`${node.type} +${amount}`, 'correct');
  }

  hurt(power, kind = '', source = null) {
    if (this.downed || this.invulnerable > 0) return false;
    if (this.canGuardFrom(source)) {
      this.shieldDurability = Math.max(0, this.shieldDurability - HILLS_COMBAT.shieldDamagePerHit * Math.max(1, power));
      this.dirty = true;
      this.invulnerable = .18;
      this.effect('guard', { x: this.player.x, y: this.player.y, dx: this.facing.x, dy: this.facing.y, durability: this.shieldDurability });
      if (this.shieldDurability <= 0) {
        this.stunned = HILLS_COMBAT.guardBreakStun;
        this.attackWindow = 0;
        this.attackMoveLock = 0;
        this.activeSlash = null;
        this.attackCooldown = 0;
        this.gather = null;
        this.invulnerable = Math.max(this.invulnerable, HILLS_COMBAT.guardBreakStun + HILLS_COMBAT.guardBreakGrace);
        this.guardBreaks += 1;
        this.effect('guardBreak', { x: this.player.x, y: this.player.y, dx: this.facing.x, dy: this.facing.y });
        this.say('盾牌破防！阿晨晨原地暈眩2秒。', 'wrong');
      }
      return 'blocked';
    }
    this.hp = Math.max(0, this.hp - power);
    this.invulnerable = 1.15;
    if (kind === 'mud') this.blind = Math.max(this.blind, 1.6);
    if (this.gather) { this.gather = null; this.say('受擊使採集中斷！'); }
    this.effect('hurt', { x: this.player.x, y: this.player.y, kind });
    if (this.hp <= 0) {
      this.downed = true; this.downTime = 0; this.revivePrompted = false;
      this.activeSlash = null; this.attackWindow = 0; this.attackMoveLock = 0; this.gather = null;
      this.stunned = 0; this.blind = 0; this.invulnerable = 0;
      this.projectiles = []; this.traps = [];
      for (const mob of this.mobs) { mob.aggro = false; mob.cast = null; }
      this.effect('sound', { name: 'playerDown' });
    }
    return true;
  }

  revive() {
    if (!this.downed || this.downTime < 1.2) return false;
    this.downed = false; this.downTime = 0; this.revivePrompted = false;
    this.hp = this.maxHp; this.mana = this.maxMana; this.spRegenElapsed = 0;
    this.shieldDurability = this.shieldMax; this.attackCooldown = 0;
    this.invulnerable = 3; Object.assign(this.player, HILLS_ENTRY);
    this.projectiles = []; this.traps = [];
    this.say('晨曦微光守護著你，準備好再出發吧！', 'correct');
    return true;
  }

  updateProjectiles(dt) {
    for (const shot of this.projectiles) {
      if(shot.kind==='pumpkin'){advancePumpkinProjectile(this,shot,dt,hillsWalkable);continue;}
      shot.life -= dt;
      if (shot.life <= 0) {
        this.effect('projectileEnd', { x: shot.x, y: shot.y, type: shot.kind });
        continue;
      }
      if (shot.kind === 'magicArrow') {
        // Substeps check walls before targets, so fast arrows cannot jump through a fence.
        const steps = Math.max(1, Math.ceil(shot.speed * dt / 6));
        for (let i = 0; i < steps && shot.life > 0; i++) {
          shot.x += shot.dx * shot.speed * dt / steps; shot.y += shot.dy * shot.speed * dt / steps;
          if (!hillsWalkable(shot.x, shot.y, 0)) { shot.life = 0; break; }
          const target = this.mobs.find(mob => mob.alive && distance(shot, mob) < (mob.type === 'rabbit' ? 52 : 28));
          if (target) { this.hitMob(target, shot.power); shot.life = 0; }
        }
        if (shot.life <= 0) this.effect('projectileEnd', { x: shot.x, y: shot.y, type: shot.kind });
      } else if (shot.friendly) {
        const target = this.mobs.find((mob) => mob.id === shot.target && mob.alive);
        if (!target) { shot.life = 0; continue; }
        const d = distance(shot, target) || 1;
        shot.x += (target.x - shot.x) / d * shot.speed * dt;
        shot.y += (target.y - shot.y) / d * shot.speed * dt;
        if (d < 28) { this.hitMob(target, shot.power); shot.life = 0; }
      } else {
        shot.x += shot.dx * shot.speed * dt;
        shot.y += shot.dy * shot.speed * dt;
        if (distance(shot, this.player) < 25) { this.hurt(shot.power, shot.kind, shot); shot.life = 0; }
      }
    }
    this.projectiles = this.projectiles.filter((shot) => shot.life > 0 && hillsWalkable(shot.x, shot.y, 0));
  }

  enemyShot(mob, kind, speed, power) {
    const d = distance(mob, this.player) || 1;
    this.projectiles.push({ kind, friendly: false, x: mob.x, y: mob.y, dx: (this.player.x - mob.x) / d, dy: (this.player.y - mob.y) / d, speed, power, life: (kind === 'mud' ? 280 : 310) / speed, maxLife: (kind === 'mud' ? 280 : 310) / speed });
    this.effect('sound', { name: kind === 'mud' ? 'mudThrow' : kind === 'seed' ? 'chickChirp' : 'bubbleCast' });
  }

  updateMobs(dt) {
    for (const mob of this.mobs) {
      mob.hitFlash = Math.max(0, mob.hitFlash - dt);
      mob.float = Math.max(0, mob.float - dt);
      mob.dizzy = Math.max(0, mob.dizzy - dt);
      mob.attack = Math.max(0, mob.attack - dt);
      if (!mob.alive) {
        mob.deathTime = (mob.deathTime || 0) + dt;
        mob.respawn -= dt;
        if (mob.respawn <= 0) Object.assign(mob, this.makeMob(mob.id, mob.type, mob.homeX, mob.homeY));
        continue;
      }
      mob.animTime = (mob.animTime || 0) + dt; mob.moveSpeed = 0;
      if (mob.type === 'rabbit') { updatePumpkinBossV321(this, mob, dt, hillsWalkable); continue; }
      mob.recovery = Math.max(0, (mob.recovery || 0) - dt);
      if (mob.cast) {
        mob.cast.elapsed += dt;
        if (mob.cast.elapsed >= mob.cast.duration) {
          this.enemyShot(mob, mob.type === 'mole' ? 'mud' : mob.type === 'chick' ? 'seed' : 'water', mob.type === 'mole' ? 175 : 155, 1);
          mob.cast = null; mob.recovery = .36;
        }
        continue;
      }
      if (SMALL_CREATURE_TYPES.includes(mob.type)) {
        if (mob.recovery <= 0 && mob.dizzy <= 0) updateSmallCreature(this, mob, dt, hillsWalkable);
        continue;
      }
      const spec = MOB_TYPES[mob.type];
      const playerDistance = distance(mob, this.player);
      if (mob.dizzy > 0) continue;
      if (mob.flee > 0) {
        mob.flee -= dt;
        const d = playerDistance || 1;
        const moved = this.moveBody(mob, (mob.x - this.player.x) / d * spec.speed * 1.8 * dt, (mob.y - this.player.y) / d * spec.speed * 1.8 * dt);
        if (!moved && mob.type === 'mouse') { mob.flee = 0; mob.dizzy = .85; }
        continue;
      }
      if (mob.aggro && playerDistance < (spec.elite ? 260 : 310)) {
        if (mob.type === 'chick' && mob.attack <= 0 && playerDistance < 240) { mob.attack = 2.6; mob.cast = { elapsed: 0, duration: .45 }; this.effect('sound', { name: 'chickChirp' }); }
        if (mob.type === 'dew' && mob.attack <= 0 && playerDistance < 235) { mob.attack = 2.3; mob.cast = { elapsed: 0, duration: .55 }; this.effect('sound', { name: 'dewGather' }); }
        if (mob.type === 'mole' && mob.attack <= 0 && playerDistance < 215) { mob.attack = 2.8; mob.cast = { elapsed: 0, duration: .7 }; this.effect('sound', { name: 'mudDig' }); }

      } else if (distance(mob, { x: mob.homeX, y: mob.homeY }) > 16) {
        const d = distance(mob, { x: mob.homeX, y: mob.homeY }) || 1;
        this.moveBody(mob, (mob.homeX - mob.x) / d * spec.speed * .55 * dt, (mob.homeY - mob.y) / d * spec.speed * .55 * dt);
        if (distance(mob, { x: mob.homeX, y: mob.homeY }) < 8) mob.aggro = false;
      }
    }
  }

  updateLoot(dt) {
    for (const drop of this.loot) {
      drop.age += dt;
      if (!drop.settled) {
        drop.groundX += drop.vx * dt;
        drop.groundY += drop.vy * dt;
        if (!hillsWalkable(drop.groundX, drop.groundY, 4)) { drop.groundX -= drop.vx * dt; drop.groundY -= drop.vy * dt; drop.vx *= -.3; drop.vy *= -.3; }
        drop.vx *= Math.pow(.2, dt);
        drop.vy *= Math.pow(.2, dt);
        drop.lift += drop.liftVelocity * dt;
        drop.liftVelocity -= 620 * dt;
        if (drop.lift <= 0 && drop.liftVelocity < 0) {
          drop.lift = 0;
          drop.bounces += 1;
          if (drop.bounces >= 2) drop.settled = true;
          else drop.liftVelocity = drop.bounces === 1 ? 115 : 60;
        }
      } else if (distance({ x: drop.groundX, y: drop.groundY }, this.player) < this.magnetRadius()) {
        drop.magnet = true;
        const pull = 1 - Math.exp(-dt * 11);
        drop.groundX += (this.player.x - drop.groundX) * pull;
        drop.groundY += (this.player.y - 48 - drop.groundY) * pull;
        if (distance({ x: drop.groundX, y: drop.groundY }, { x: this.player.x, y: this.player.y - 48 }) < 28) { this.collect(drop); drop.age = 99; }
      }
    }
    this.loot = this.loot.filter((drop) => drop.age < drop.lifetime);
  }

  updateTraps(dt) {
    for (const trap of this.traps) {
      trap.life -= dt;
      trap.pulse += dt * 4;
      if (trap.life > 0 && distance(trap, this.player) < 28) { this.hurt(1, 'seed'); trap.life = 0; }
    }
    this.traps = this.traps.filter((trap) => trap.life > 0);
  }

  update(dt, axis = { x: 0, y: 0 }, attacking = false, dodge = false) {
    dt = Number.isFinite(dt) ? Math.max(0, Math.min(.05, dt)) : 0;
    this.time += dt;
    if (this.downed) {
      this.downTime += dt;
      if (this.downTime >= 1.2 && !this.revivePrompted) {
        this.revivePrompted = true; this.effect('playerDownReady', {});
      }
      return false;
    }
    if (regenerateSkillResource(this, dt)) this.dirty = true;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.blind = Math.max(0, this.blind - dt);
    this.speedBuff = Math.max(0, this.speedBuff - dt);
    this.attackCooldown = this.attackCooldown <= dt + 1e-9 ? 0 : this.attackCooldown - dt;
    this.attackWindow = this.attackWindow <= dt + 1e-9 ? 0 : this.attackWindow - dt;
    this.attackMoveLock = this.attackMoveLock <= dt + 1e-9 ? 0 : this.attackMoveLock - dt;
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    const wasStunned = this.stunned > 0;
    this.stunned = Math.max(0, this.stunned - dt);
    if (wasStunned && this.stunned <= 0) {
      this.shieldDurability = HILLS_COMBAT.guardBreakRecovery;
      this.invulnerable = Math.max(this.invulnerable, HILLS_COMBAT.guardBreakGrace);
      this.effect('guardRecover', { x: this.player.x, y: this.player.y });
      this.say('重新站穩！盾牌恢復25%耐久。', 'correct');
      this.dirty = true;
    }
    this.bounceCooldown = Math.max(0, this.bounceCooldown - dt);
    for (const node of this.gathers) node.cooldown = Math.max(0, node.cooldown - dt);
    if (this.activeSlash && !this.activeSlash.sounded && this.stunned <= 0 && this.time - this.activeSlash.start >= MANA_SLASH.windup) {
      this.activeSlash.sounded = true;
      this.effect('sound', { name: 'manaSwing' });
    }
    if (this.activeSlash && this.stunned <= 0 && this.time - this.activeSlash.start >= HILLS_COMBAT.attackImpact) this.resolveSlash();
    if (this.activeSlash && this.attackWindow <= 0) this.activeSlash = null;
    if (attacking && this.stunned <= 0) this.attack();
    const moving = this.move(dt, axis, dodge);
    if (this.gather) {
      this.gather.elapsed += dt;
      if (this.gather.elapsed >= this.gather.duration) this.finishGather();
    }
    if (this.bounceCooldown <= 0 && distance(this.player, { x: 2700, y: 1600 }) < 72) {
      this.bounceCooldown = 2;
      this.speedBuff = 3;
      this.effect('bounce', { x: this.player.x, y: this.player.y });
      this.say('彈性蒲公英！移動速度提升3秒。');
    }
    this.nextMigration -= dt;
    if (this.nextMigration <= 0 && this.migration <= 0) {
      this.migration = 45;
      this.nextMigration = 480 + this.random() * 420;
      this.say('晨曦的微風吹過丘陵……蒲公英採集量暫時加倍！', 'finish');
      if (this.random() < .03) this.spawnLoot(1035 * HILLS_SCALE, 510 * HILLS_SCALE, '星光微風種子', 'rare');
    }
    this.migration = Math.max(0, this.migration - dt);
    this.updateProjectiles(dt);
    this.updateMobs(dt);
    this.updateTraps(dt);
    this.updateLoot(dt);
    return moving;
  }
}
