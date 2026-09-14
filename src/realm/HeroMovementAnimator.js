export const HERO_MOVEMENT_ATLAS = '../../assets/phantom-realm/hero-achenchen/animation-v2/hero-movement-atlas-v2.png';
export const HERO_FRAME_SIZE = 512;

const BASE_MOVE_SPEED = 260;
const BASE_WALK_FPS = 10.5;
const MAX_WALK_FPS = 13;
const STOP_SETTLE_SECONDS = .08;
const TURN_CONFIRM_SECONDS = .08;
const TURN_HYSTERESIS = 13 * Math.PI / 180;
const INSTANT_TURN_ANGLE = 120 * Math.PI / 180;
const INPUT_DEADZONE = .12;
const HERO_RENDER_HEIGHT = 123.2;

const ROW = Object.freeze({ down: 0, up: 1, right: 2, downRight: 3, upRight: 4 });
const DIRECTION_SECTORS = Object.freeze(['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight']);
const FACE_ANGLE = Object.freeze({ right: 0, downRight: Math.PI / 4, down: Math.PI / 2, downLeft: Math.PI * 3 / 4, left: Math.PI, upLeft: -Math.PI * 3 / 4, up: -Math.PI / 2, upRight: -Math.PI / 4 });

// Measured opaque sole contact lines for all 40 atlas cells. Correcting these
// at render time keeps the world position, shadow, collider and triggers fixed.
const FOOT_CONTACT_Y = Object.freeze({
  down: Object.freeze([504, 503, 506, 508, 508, 510, 510, 509]),
  up: Object.freeze([508, 510, 512, 508, 505, 507, 503, 507]),
  right: Object.freeze([512, 512, 512, 512, 500, 501, 501, 502]),
  downRight: Object.freeze([512, 506, 511, 511, 508, 509, 501, 501]),
  upRight: Object.freeze([508, 507, 506, 504, 509, 510, 509, 509])
});
const FOOT_BASELINE = Object.freeze(Object.fromEntries(Object.entries(FOOT_CONTACT_Y).map(([face, values]) => [face, Math.max(...values)])));
// Preserve the complete generated gait. Camera pixel snapping and per-frame sole
// calibration remove the jitter without sacrificing either passing pose.
const WALK_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 5]);
const WALK_BOB = Object.freeze([1.5, 0, -1.5, 1.5, 0, -1.5]);
const WALK_TILT = Object.freeze([-1, -.35, .35, 1, .35, -.35].map((degrees) => degrees * Math.PI / 180));

function wrapAngle(value) { return Math.atan2(Math.sin(value), Math.cos(value)); }
function angleDistance(a, b) { return Math.abs(wrapAngle(a - b)); }

function rawDirection(axis, fallback) {
  const length = Math.hypot(axis.x, axis.y);
  if (length < INPUT_DEADZONE) return fallback;
  const sector = Math.round(Math.atan2(axis.y, axis.x) / (Math.PI / 4));
  return DIRECTION_SECTORS[(sector + 8) % 8];
}

function sourceFor(face) {
  if (face === 'left') return { sourceFace: 'right', row: ROW.right, flip: true };
  if (face === 'downLeft') return { sourceFace: 'downRight', row: ROW.downRight, flip: true };
  if (face === 'upLeft') return { sourceFace: 'upRight', row: ROW.upRight, flip: true };
  return { sourceFace: face, row: ROW[face] ?? ROW.down, flip: false };
}

function renderOffsetRatio(sourceFace, column, bodyBob = 0) {
  const contact = FOOT_CONTACT_Y[sourceFace]?.[column] ?? HERO_FRAME_SIZE;
  const baseline = FOOT_BASELINE[sourceFace] ?? HERO_FRAME_SIZE;
  return (baseline - contact) / HERO_FRAME_SIZE + bodyBob / HERO_RENDER_HEIGHT;
}

export class HeroMovementAnimator {
  constructor(face = 'down') {
    this.face = face;
    this.walkClock = 0;
    this.wasMoving = false;
    this.stopSettle = 0;
    this.lastWalkBob = 0;
    this.lastWalkTilt = 0;
    this.turnCandidate = '';
    this.turnCandidateTime = 0;
  }

  updateDirection(dt, axis, moving) {
    if (Math.hypot(axis.x, axis.y) < INPUT_DEADZONE) { this.turnCandidate = ''; this.turnCandidateTime = 0; return; }
    if (moving && !this.wasMoving) { this.face = rawDirection(axis, this.face); this.turnCandidate = ''; this.turnCandidateTime = 0; return; }
    const inputAngle = Math.atan2(axis.y, axis.x);
    const delta = angleDistance(inputAngle, FACE_ANGLE[this.face] ?? Math.PI / 2);
    if (delta <= Math.PI / 8 + TURN_HYSTERESIS) { this.turnCandidate = ''; this.turnCandidateTime = 0; return; }
    const candidate = rawDirection(axis, this.face);
    if (candidate === this.face) return;
    if (delta > INSTANT_TURN_ANGLE) { this.face = candidate; this.turnCandidate = ''; this.turnCandidateTime = 0; return; }
    if (candidate !== this.turnCandidate) { this.turnCandidate = candidate; this.turnCandidateTime = 0; }
    this.turnCandidateTime += dt;
    if (this.turnCandidateTime >= TURN_CONFIRM_SECONDS) { this.face = candidate; this.turnCandidate = ''; this.turnCandidateTime = 0; }
  }

  update(dt, axis, moving, actualSpeed = BASE_MOVE_SPEED) {
    const safeDt = Math.max(0, Math.min(.05, dt || 0));
    this.updateDirection(safeDt, axis, moving);
    if (moving) {
      if (!this.wasMoving) this.walkClock = 0;
      const fps = Math.max(8.5, Math.min(MAX_WALK_FPS, BASE_WALK_FPS * Math.max(0, actualSpeed) / BASE_MOVE_SPEED));
      this.walkClock += safeDt * fps;
      this.stopSettle = STOP_SETTLE_SECONDS;
    } else if (this.wasMoving) {
      this.stopSettle = STOP_SETTLE_SECONDS;
    } else {
      this.stopSettle = Math.max(0, this.stopSettle - safeDt);
    }

    const settling = !moving && this.stopSettle > 0;
    const walkPhase = Math.floor(this.walkClock) % WALK_SEQUENCE.length;
    const column = moving ? WALK_SEQUENCE[walkPhase] : settling ? 7 : 6;
    const bodyBob = moving ? WALK_BOB[walkPhase] : settling ? this.lastWalkBob * this.stopSettle / STOP_SETTLE_SECONDS : 0;
    const walkTilt = moving ? WALK_TILT[walkPhase] : settling ? this.lastWalkTilt * this.stopSettle / STOP_SETTLE_SECONDS : 0;
    if (moving) { this.lastWalkBob = bodyBob; this.lastWalkTilt = walkTilt; }
    this.wasMoving = moving;
    const source = sourceFor(this.face);
    return {
      ...source,
      column,
      face: this.face,
      moving,
      settling,
      renderOffsetYRatio: renderOffsetRatio(source.sourceFace, column, bodyBob),
      renderTiltRadians: source.flip ? -walkTilt : walkTilt
    };
  }
}
