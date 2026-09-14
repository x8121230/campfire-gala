export const WORLD_SCALE = 2;
export const MAP = Object.freeze({ width: 1672 * WORLD_SCALE, height: 941 * WORLD_SCALE });

const at = (spot) => Object.freeze({
  ...spot,
  x: spot.x * WORLD_SCALE,
  y: spot.y * WORLD_SCALE
});

export const SPOTS = Object.freeze({
  alden: at({ x: 745, y: 390, name: '守護者長老・奧爾登', kind: 'npc' }),
  washPool: at({ x: 375, y: 625, name: '晨露清洗池', kind: 'object', radius: 180 }),
  bronc: at({ x: 420, y: 430, name: '裁縫師・布隆克', kind: 'npc' }),
  phoebe: at({ x: 1275, y: 445, name: '奇物少女・菲比', kind: 'npc' }),
  noticeboard: at({ x: 1080, y: 355, name: '營地小布告欄', kind: 'object' }),
  fountain: at({ x: 835, y: 520, name: '晨露噴水池', kind: 'object', radius: 215 }),
  // Calibrated to the painted flower arch rather than the old oversized
  // trigger that floated left/below it. Source image point: (1017, 100).
  northGate: at({ x: 1017, y: 100, name: '晨曦蒲公英丘陵傳送門', kind: 'exit', radius: 125 })
});

const OUTER = [
  [704, 878], [955, 878], [1065, 770], [1285, 730], [1468, 625],
  [1476, 475], [1380, 372], [1110, 326], [960, 350], [866, 390],
  [690, 388], [530, 378], [360, 420], [235, 520], [252, 682],
  [470, 748], [650, 775]
].map(([x, y]) => [x * WORLD_SCALE, y * WORLD_SCALE]);

// The hand-painted eastern flagstone branch rises above OUTER's old straight
// edge. Keep it as a dedicated walkable lobe so nearby trees/cliffs stay out.
const EAST_ROAD = [
  [1060, 420], [1060, 325], [1140, 265], [1260, 245], [1390, 285],
  [1470, 370], [1430, 455], [1310, 475], [1180, 450]
].map(([x, y]) => [x * WORLD_SCALE, y * WORLD_SCALE]);

export const CAMP_BLOCKS = Object.freeze([
  { type: 'ellipse', x: 835, y: 520, rx: 92, ry: 58 },
  { type: 'ellipse', x: 375, y: 625, rx: 72, ry: 46 },
  { type: 'ellipse', x: 812, y: 286, rx: 142, ry: 92 },
  { type: 'rect', x1: 274, y1: 232, x2: 548, y2: 397 },
  // Right workshop footprint. The old box started at x=1180/y=245 and
  // incorrectly covered the visible flagstone road at world (2442, 641).
  { type: 'rect', x1: 1260, y1: 300, x2: 1515, y2: 560 },
  { type: 'rect', x1: 1040, y1: 292, x2: 1116, y2: 355 }
].map((block) => Object.freeze(Object.fromEntries(
  Object.entries(block).map(([key, value]) => [key, key === 'type' ? value : value * WORLD_SCALE])
))));

function inPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const crosses = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

let collisionPaint = { block: [], pass: [], disabled: [] };

const safePaintCircles = (items) => (Array.isArray(items) ? items : []).slice(0, 2400).map((item) => ({
  x: Number(item?.x), y: Number(item?.y), r: Math.max(12, Math.min(220, Number(item?.r) || 0))
})).filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y));

export function setCampCollisionPaint(value = {}) {
  collisionPaint = {
    block: safePaintCircles(value.block), pass: safePaintCircles(value.pass),
    disabled: [...new Set((Array.isArray(value.disabled) ? value.disabled : []).map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < CAMP_BLOCKS.length))]
  };
  return getCampCollisionPaint();
}

export function getCampCollisionPaint() { return { block: collisionPaint.block.map((item) => ({ ...item })), pass: collisionPaint.pass.map((item) => ({ ...item })), disabled: [...collisionPaint.disabled] }; }

export function addCampCollisionMark(mode, mark) {
  if (mode !== 'block' && mode !== 'pass') return getCampCollisionPaint();
  const [safe] = safePaintCircles([mark]); if (safe) collisionPaint[mode].push(safe);
  if (collisionPaint[mode].length > 2400) collisionPaint[mode].splice(0, collisionPaint[mode].length - 2400);
  return getCampCollisionPaint();
}

export function eraseCampCollisionMarks(x, y, radius) {
  const r = Math.max(12, Number(radius) || 0);
  for (const mode of ['block', 'pass']) collisionPaint[mode] = collisionPaint[mode].filter((mark) => Math.hypot(mark.x - x, mark.y - y) > mark.r + r * .55);
  return getCampCollisionPaint();
}

function obstacleContains(b, x, y, radius = 0) {
  if (b.type === 'rect') return x > b.x1 - radius && x < b.x2 + radius && y > b.y1 - radius && y < b.y2 + radius;
  const dx = (x - b.x) / (b.rx + radius), dy = (y - b.y) / (b.ry + radius);
  return dx * dx + dy * dy < 1;
}

export function disableCampObstaclesAt(x, y, radius) {
  CAMP_BLOCKS.forEach((block, index) => { if (!collisionPaint.disabled.includes(index) && obstacleContains(block, x, y, radius)) collisionPaint.disabled.push(index); });
  collisionPaint.disabled.sort((a, b) => a - b); return getCampCollisionPaint();
}

export function collisionStrokePoints(from, to, maxSpacing) {
  if (!to || !Number.isFinite(to.x) || !Number.isFinite(to.y)) return [];
  if (!from || !Number.isFinite(from.x) || !Number.isFinite(from.y)) return [{ x: to.x, y: to.y }];
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const spacing = Math.max(1, Number(maxSpacing) || 1);
  const steps = Math.max(1, Math.ceil(distance / spacing));
  return Array.from({ length: steps }, (_unused, index) => {
    const t = (index + 1) / steps;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}

export function explainCampWalkability(x, y, radius = 16) {
  const main = inPolygon(x, y, OUTER);
  const eastRoad = inPolygon(x, y, EAST_ROAD);
  const northPath = x > 850 * WORLD_SCALE - radius && x < 1160 * WORLD_SCALE + radius && y > 38 * WORLD_SCALE && y < 445 * WORLD_SCALE;
  const northPassage = x > 880 * WORLD_SCALE && x < 1024 * WORLD_SCALE && y > 38 * WORLD_SCALE && y < 445 * WORLD_SCALE;
  const paintedPass = collisionPaint.pass.some((mark) => Math.hypot(mark.x - x, mark.y - y) < mark.r + radius);
  const paintedBlock = collisionPaint.block.some((mark) => Math.hypot(mark.x - x, mark.y - y) < mark.r + radius);
  const obstacleIndex = CAMP_BLOCKS.findIndex((block, index) => !collisionPaint.disabled.includes(index) && obstacleContains(block, x, y, radius));

  // The editor overrides are intentionally resolved once, in strict order.
  // Red is the user's explicit wall; green is the user's explicit opening.
  if (paintedBlock) return { walkable: false, reason: '紅色手動阻擋', layer: 'paint-block' };
  if (paintedPass) return { walkable: true, reason: '綠色手動通行', layer: 'paint-pass' };
  if (northPassage) return { walkable: true, reason: '北門中央通道', layer: 'north-passage' };
  if (!main && !northPath && !eastRoad) return { walkable: false, reason: 'OUTER 地圖邊界', layer: 'outer' };
  if (obstacleIndex >= 0) return { walkable: false, reason: `橙色固定障礙 #${obstacleIndex}`, layer: 'obstacle', obstacleIndex };
  if (eastRoad && !main) return { walkable: true, reason: '東側石板道路補區', layer: 'east-road' };
  return { walkable: true, reason: northPath ? '北門道路補區' : '一般可行走區', layer: northPath ? 'north-path' : 'main' };
}

export function isWalkable(x, y, radius = 16) {
  return explainCampWalkability(x, y, radius).walkable;
}

export class RealmJourney {
  constructor(saved) {
    this.player = { x: 835 * WORLD_SCALE, y: 824 * WORLD_SCALE };
    this.stage = 0;
    this.apples = 0;
    this.robe = false;
    this.metPhoebe = false;
    this.time = 0;
    this.currentMoveSpeed = 0;
    if (saved && saved.v === 2) {
      this.stage = Math.max(0, Math.min(3, Math.floor(Number(saved.stage) || 0)));
      this.apples = this.stage >= 3 ? 10 : 0;
      this.robe = this.stage >= 3;
      this.metPhoebe = Boolean(saved.metPhoebe);
    }
  }

  export() {
    return { v: 2, stage: this.stage, metPhoebe: this.metPhoebe };
  }

  move(dt, axis, run = false) {
    dt = Math.min(0.05, Math.max(0, dt));
    this.time += dt;
    const length = Math.hypot(axis.x, axis.y);
    if (length < 0.12) { this.currentMoveSpeed = 0; return false; }
    const speedPerSecond = run ? 400 : 260;
    const speed = speedPerSecond * dt;
    const dx = axis.x / Math.max(1, length) * speed;
    const dy = axis.y / Math.max(1, length) * speed;
    let moved = false;
    const nextX = this.player.x + dx;
    if (isWalkable(nextX, this.player.y)) {
      this.player.x = nextX;
      moved = true;
    }
    const nextY = this.player.y + dy;
    if (isWalkable(this.player.x, nextY)) {
      this.player.y = nextY;
      moved = true;
    }
    this.currentMoveSpeed = moved ? speedPerSecond : 0;
    return moved;
  }

  nearby() {
    let best = null;
    let bestDistance = Infinity;
    for (const [id, spot] of Object.entries(SPOTS)) {
      const d = Math.hypot(spot.x - this.player.x, spot.y - this.player.y);
      const interactionRadius = spot.radius || 92;
      if (d < interactionRadius && d < bestDistance) {
        best = id;
        bestDistance = d;
      }
    }
    return best;
  }

  questMarker(id) {
    if (id === 'alden' && this.stage === 0) return '!';
    if (id === 'washPool' && this.stage === 1) return '!';
    if (id === 'bronc' && this.stage === 2) return '?';
    return '';
  }

  act(id) {
    if (this.nearby() !== id) return { message: '再靠近一點，就能互動。' };
    if (id === 'alden') {
      if (this.stage === 0) {
        this.stage = 1;
        return {
          changed: true,
          title: '主線・跌進畫卷的第一步',
          message: '歡迎來到星芽營地，孩子。先到左下方的晨露池洗去旅途的塵光，再去拜訪裁縫師布隆克。他已為你準備好第一件冒險衣。'
        };
      }
      return {
        title: '守護者長老・奧爾登',
        message: this.stage < 3
          ? '晨露池在廣場左下方。完成清洗後，布隆克會在裁縫鋪前等你。'
          : '很好，你已經準備好踏出營地。北門外便是晨曦蒲公英丘陵；不用急，先熟悉自己的步伐。'
      };
    }
    if (id === 'washPool') {
      if (this.stage === 0) return { message: '池水泛起柔光。先去聽聽奧爾登長老想說什麼。' };
      if (this.stage === 1) {
        this.stage = 2;
        return {
          changed: true,
          title: '晨露洗去旅塵',
          message: '清涼晨露輕輕繞過衣角，細小星光啵地散開。現在前往左側裁縫鋪拜訪布隆克。'
        };
      }
      return { message: '晨露池清澈地映著天空，也映出準備好冒險的你。' };
    }
    if (id === 'bronc') {
      if (this.stage < 2) return { title: '裁縫師・布隆克', message: '慢慢來，先完成奧爾登交代的晨露清洗，我會替你把衣服準備好。' };
      if (this.stage === 2) {
        this.stage = 3;
        this.apples = 10;
        this.robe = true;
        return {
          changed: true,
          win: true,
          title: '取得・星芽旅行者套裝',
          message: '剛剛好！莓紅小斗篷、星芽背帶裝與草莓棉拖鞋都很合身。再帶上10顆甜蘋果，北門已經開放。MAIN_01「跌進畫卷的第一步」完成！'
        };
      }
      return { title: '裁縫師・布隆克', message: '小斗篷如果勾到樹枝，隨時回來找我。我也會替你保留新的布料花樣。' };
    }
    if (id === 'phoebe') {
      const first = !this.metPhoebe;
      this.metPhoebe = true;
      return {
        changed: first,
        title: '奇物少女・菲比',
        message: this.stage < 3
          ? '你身上有剛落進畫卷的微光！等準備好出發，我會教你把星芽膠磨成第一顆靈珠。'
          : '在蒲公英丘陵深處尋找星芽露珠精靈吧。收集純淨星芽膠後，我就能替你磨亮第一顆星核珠。'
      };
    }
    if (id === 'noticeboard') {
      return {
        title: '營地小布告欄',
        message: this.stage < 3
          ? '布告欄上的委託被花瓣遮住了。完成序章後再回來看看。'
          : '橡果儲備告急！日常委託會在角色達到Lv.4後開放。'
      };
    }
    if (id === 'fountain') return { message: '晨露噴水池咕嘟冒泡，清亮水珠在陽光下變成小小彩虹。' };
    if (id === 'northGate') {
      if (this.stage < 3) return { message: '北門外風聲正輕輕呼喚。完成奧爾登的序章任務後再出發。' };
      return { travel: true, title: '前往晨曦蒲公英丘陵', message: '丘陵入口已解鎖。穿過花環木橋，開始第一場野外冒險。' };
    }
    return {};
  }

  objective() {
    return [
      '與母樹前的奧爾登長老交談',
      '到廣場左下方的晨露池清洗衣角',
      '拜訪左側裁縫鋪的布隆克',
      '序章完成・可由北門前往蒲公英丘陵'
    ][this.stage];
  }
}
