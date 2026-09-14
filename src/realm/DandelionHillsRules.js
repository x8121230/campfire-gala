export const HILLS_SCALE = 2;
export const HILLS_MAP = Object.freeze({ width: 1672 * HILLS_SCALE, height: 941 * HILLS_SCALE });

const at = (item) => Object.freeze({
  ...item,
  x: item.x * HILLS_SCALE,
  y: item.y * HILLS_SCALE
});

export const HILLS_PORTALS = Object.freeze({
  camp: at({ x: 1444, y: 858, name: '返回星芽營地', radius: 180 }),
  forest: at({ x: 1515, y: 160, name: '螢火古橡樹林入口', radius: 100 })
});

export const GATHER_NODES = Object.freeze([
  at({ id: 'dandelion-a', type: '晨曦蒲公英', x: 850, y: 455 }),
  at({ id: 'dandelion-b', type: '晨曦蒲公英', x: 1085, y: 595 }),
  at({ id: 'acorn-a', type: '香脆橡果', x: 1190, y: 705 }),
  at({ id: 'acorn-b', type: '香脆橡果', x: 1320, y: 625 })
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
  attackDuration: .72,
  attackCooldown: 1.04,
  shieldMax: 100,
  shieldDamagePerHit: 25,
  guardConeDot: .34,
  guardBreakStun: 2,
  guardBreakRecovery: 25,
  guardBreakGrace: .5
});

const SPAWNS = Object.freeze([
  ['mouse', 1510, 700], ['mouse', 1385, 735], ['mouse', 1260, 765],
  ['mouse', 1440, 615], ['mouse', 1190, 650], ['mouse', 1050, 750],
  ['chick', 1150, 555], ['chick', 950, 610], ['chick', 780, 570], ['chick', 720, 650],
  ['mole', 810, 495], ['mole', 520, 665], ['mole', 760, 735],
  ['dew', 615, 350], ['dew', 750, 390], ['dew', 520, 400], ['dew', 650, 445],
  ['rabbit', 230, 405]
].map(([type, x, y]) => Object.freeze([type, x * HILLS_SCALE, y * HILLS_SCALE])));

const OUTER = Object.freeze([
  [26, 500], [22, 320], [55, 175], [110, 72], [300, 24], [475, 68],
  [650, 43], [830, 34], [1030, 45], [1220, 20], [1560, 20], [1655, 82],
  [1670, 420], [1625, 625], [1538, 782], [1538, 941], [1372, 941],
  [1372, 835], [1135, 845], [920, 850], [750, 822], [610, 770],
  [455, 705], [295, 655], [135, 585]
].map(([x, y]) => Object.freeze([x * HILLS_SCALE, y * HILLS_SCALE])));

const ellipse = (x, y, rx, ry) => Object.freeze({ type: 'ellipse', x: x * HILLS_SCALE, y: y * HILLS_SCALE, rx: rx * HILLS_SCALE, ry: ry * HILLS_SCALE });
const polygon = (points) => Object.freeze({ type: 'polygon', points: Object.freeze(points.map(([x, y]) => Object.freeze([x * HILLS_SCALE, y * HILLS_SCALE]))) });
const capsule = (x1, y1, x2, y2, r = 7) => Object.freeze({ type: 'capsule', x1: x1 * HILLS_SCALE, y1: y1 * HILLS_SCALE, x2: x2 * HILLS_SCALE, y2: y2 * HILLS_SCALE, r: r * HILLS_SCALE });

// Every entry follows a visible landmark in background.png.  Water and cliffs use
// polygons, foliage uses projected ellipses, and fences use narrow capsules.
export const HILLS_OBSTACLES = Object.freeze([
  polygon([[0, 0], [610, 0], [620, 78], [585, 150], [630, 225], [610, 292], [510, 326], [390, 306], [280, 298], [170, 270], [0, 260]]),
  polygon([[1390, 190], [1672, 175], [1672, 535], [1585, 535], [1515, 490], [1480, 430], [1510, 360], [1415, 320]]),
  // Trees block at their visible trunk/root footprint only. Their painted crown
  // no longer creates a large invisible wall across nearby grass and flowers.
  ellipse(1275, 155, 56, 35), ellipse(1602, 122, 38, 28),
  ellipse(1105, 153, 31, 23), ellipse(975, 225, 29, 21), ellipse(820, 220, 25, 19),
  ellipse(712, 347, 32, 23), ellipse(525, 347, 33, 23), ellipse(985, 386, 36, 26),
  ellipse(1225, 452, 39, 28), ellipse(1420, 380, 35, 25), ellipse(1075, 540, 32, 23),
  ellipse(875, 712, 38, 26), ellipse(1260, 710, 36, 25), ellipse(520, 755, 42, 27),
  ellipse(365, 615, 31, 23), ellipse(450, 555, 29, 21), ellipse(635, 785, 31, 22),
  capsule(25, 292, 185, 252), capsule(185, 252, 390, 266), capsule(390, 266, 485, 340),
  capsule(485, 340, 480, 500), capsule(480, 500, 305, 526), capsule(190, 526, 25, 485), capsule(25, 485, 25, 292),
  capsule(675, 188, 960, 188, 8), capsule(1380, 505, 1590, 565, 8)
]);

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

const RESPAWN = Object.freeze({ mouse: 12, chick: 16, dew: 18, mole: 20, rabbit: 540 });

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
  return !HILLS_OBSTACLES.some((obstacle, index) => !collisionPaint.disabled.includes(index) && obstacleContains(obstacle, x, y, radius));
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function safeSaved(saved) {
  return saved && saved.v === 1 && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}

export class DandelionHillsJourney {
  constructor(saved) {
    const data = safeSaved(saved);
    this.time = 0;
    this.player = { x: 1444 * HILLS_SCALE, y: 820 * HILLS_SCALE };
    this.hp = 10;
    this.maxHp = 10;
    this.invulnerable = 0;
    this.blind = 0;
    this.speedBuff = 0;
    this.attackCooldown = 0;
    this.attackWindow = 0;
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
    const spec = MOB_TYPES[type];
    return { id, type, x, y, homeX: x, homeY: y, hp: spec.hp, maxHp: spec.hp, alive: true, respawn: 0, aggro: false, hitFlash: 0, flee: 0, float: 0, dizzy: 0, attack: .8 + this.random() * 1.4, engaged: false };
  }

  export() {
    return { v: 1, questStage: this.questStage, mouseProgress: this.mouseProgress, inventory: { ...this.inventory }, tutorialLoot: this.tutorialLoot, met: [...this.met], rng: this.rng, shieldDurability: this.shieldDurability };
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
    if (this.stunned > 0 || this.attackWindow > 0) { this.currentMoveSpeed = 0; return false; }
    const length = Math.hypot(axis.x, axis.y);
    if (length < .12) { this.currentMoveSpeed = 0; return false; }
    this.facing = { x: axis.x / length, y: axis.y / length };
    let speed = 260 * (this.speedBuff > 0 ? 1.12 : 1);
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
    if (this.attackCooldown > 0 || this.blind > 0 || this.stunned > 0) return false;
    const target = this.nearestMob(HILLS_COMBAT.slashRange + 28);
    if (target) {
      const d = distance(this.player, target) || 1;
      this.facing = { x: (target.x - this.player.x) / d, y: (target.y - this.player.y) / d };
    }
    this.attackCooldown = HILLS_COMBAT.attackCooldown;
    this.attackWindow = HILLS_COMBAT.attackDuration;
    this.effect('slash', { x: this.player.x, y: this.player.y, dx: this.facing.x, dy: this.facing.y });
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const d = distance(this.player, mob);
      if (d > HILLS_COMBAT.slashRange || d < 1) continue;
      const dot = ((mob.x - this.player.x) * this.facing.x + (mob.y - this.player.y) * this.facing.y) / d;
      if (dot >= HILLS_COMBAT.slashConeDot) this.hitMob(mob, 1);
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
    mob.aggro = MOB_TYPES[mob.type].temperament !== 'passive';
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
    this.effect('hit', { x: mob.x, y: mob.y, target: mob.id });
    if (mob.hp <= 0) this.defeat(mob);
    this.checkQuest();
  }

  defeat(mob) {
    mob.alive = false;
    mob.respawn = RESPAWN[mob.type];
    mob.aggro = false;
    this.effect('poof', { x: mob.x, y: mob.y, type: mob.type });
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
      this.say('MAIN_02 完成！取得手工木製冒險法杖。菲比正在等待5份純淨星芽膠。', 'finish');
    }
    if (this.questStage === 1 && this.itemCount('純淨星芽膠') >= 5) {
      this.questStage = 2;
      this.inventory['微光星芽珠'] = Math.max(1, this.itemCount('微光星芽珠'));
      this.dirty = true;
      this.say('MAIN_03 完成！菲比已能替你磨亮第一顆星核珠。', 'finish');
    }
  }

  interact() {
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
    if (this.invulnerable > 0) return false;
    if (this.canGuardFrom(source)) {
      this.shieldDurability = Math.max(0, this.shieldDurability - HILLS_COMBAT.shieldDamagePerHit * Math.max(1, power));
      this.dirty = true;
      this.invulnerable = .18;
      this.effect('guard', { x: this.player.x, y: this.player.y, dx: this.facing.x, dy: this.facing.y, durability: this.shieldDurability });
      if (this.shieldDurability <= 0) {
        this.stunned = HILLS_COMBAT.guardBreakStun;
        this.attackWindow = 0;
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
      this.hp = this.maxHp;
      Object.assign(this.player, { x: 1444 * HILLS_SCALE, y: 820 * HILLS_SCALE });
      this.invulnerable = 3;
      this.projectiles = [];
      this.traps = [];
      for (const mob of this.mobs) mob.aggro = false;
      this.say('星芽微光把你送回安全前哨，任務與素材都保留。');
    }
    return true;
  }

  updateProjectiles(dt) {
    for (const shot of this.projectiles) {
      shot.life -= dt;
      if (shot.friendly) {
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
    this.projectiles.push({ kind, friendly: false, x: mob.x, y: mob.y, dx: (this.player.x - mob.x) / d, dy: (this.player.y - mob.y) / d, speed, power, life: 2.2 });
  }

  updateMobs(dt) {
    for (const mob of this.mobs) {
      mob.hitFlash = Math.max(0, mob.hitFlash - dt);
      mob.float = Math.max(0, mob.float - dt);
      mob.dizzy = Math.max(0, mob.dizzy - dt);
      mob.attack = Math.max(0, mob.attack - dt);
      if (!mob.alive) {
        mob.respawn -= dt;
        if (mob.respawn <= 0) Object.assign(mob, this.makeMob(mob.id, mob.type, mob.homeX, mob.homeY));
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
        if (mob.type === 'dew' && mob.attack <= 0 && playerDistance < 235) { mob.attack = 2.3; this.enemyShot(mob, 'water', 155, 1); }
        if (mob.type === 'mole' && mob.attack <= 0 && playerDistance < 215) { mob.attack = 2.8; this.enemyShot(mob, 'mud', 175, 1); }
        if (mob.type === 'rabbit' && mob.attack <= 0 && playerDistance < 250) {
          mob.attack = 4;
          for (let i = 0; i < 5; i += 1) {
            const angle = i * Math.PI * 2 / 5;
            this.traps.push({ x: mob.x + Math.cos(angle) * 72, y: mob.y + Math.sin(angle) * 48, life: 7, pulse: this.random() * 6 });
          }
        }
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
    dt = Math.max(0, Math.min(.05, dt));
    this.time += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.blind = Math.max(0, this.blind - dt);
    this.speedBuff = Math.max(0, this.speedBuff - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackWindow = Math.max(0, this.attackWindow - dt);
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
    if (attacking && this.stunned <= 0) this.attack();
    const moving = this.move(dt, axis, dodge);
    if (this.gather) {
      this.gather.elapsed += dt;
      if (this.gather.elapsed >= this.gather.duration) this.finishGather();
    }
    if (this.bounceCooldown <= 0 && distance(this.player, { x: 840 * HILLS_SCALE, y: 585 * HILLS_SCALE }) < 72) {
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
