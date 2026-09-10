// Shared movement and core combat balance. Level layouts/boss HP are in AssaultLevels.
// These values do not alter any other minigame.
export const ASSAULT_DT = 1 / 120;
export const ASSAULT_BALANCE = Object.freeze({
  gravity: 1550, speed: 280, acceleration: 2500, jump: 675,
  coyote: .12, jumpBuffer: .14, dashSpeed: 760, dashTime: .17,
  dashCooldown: 1.8, invulnerability: 1.05, checkpointGrace: 2,
  playerWidth: 30, playerHeight: 54, crouchHeight: 29,
  tankWidth: 98, tankHeight: 62, tankSpeed: 225, tankJump: 445,
  tankHealth: 12, tankHeatPerShot: 26, tankCooling: 23, tankUnlockHeat: 34,
  grenadeDamage: 100, grenadeRadius: 120, grenadeFuse: 1.05,
  grenadeLimit: 8, ammoLimit: 100, enemyActivation: 850,
  supplyAmmo: 20, supplyGrenades: 1, comboWindow: 3.2,
  bossGuardDamage: .22, bossPhaseGuard: .9,
  shieldTurnDelay: .55,
});
export const ASSAULT_DIFFICULTIES = Object.freeze({
  explore: {name: '探索', hp: 9, enemyHp: .8, bulletSpeed: .82, attackRate: .85},
  standard: {name: '標準', hp: 6, enemyHp: 1, bulletSpeed: 1, attackRate: 1},
  assault: {name: '強襲', hp: 4, enemyHp: 1.25, bulletSpeed: 1.18, attackRate: 1.2},
});
export const ASSAULT_LOADOUTS = Object.freeze([
  {id: 'power', name: '火力手', tip: '武器傷害 +20%，正面突破', damage: 1.2, speed: 1, cooldown: 1, ammo: 0, grenades: 0},
  {id: 'scout', name: '游擊手', tip: '跑速 +15%，衝刺冷卻 -30%', damage: 1, speed: 1.15, cooldown: .7, ammo: 0, grenades: 0},
  {id: 'supply', name: '補給手', tip: '特殊彈 +25，手榴彈 +2', damage: 1, speed: 1, cooldown: 1, ammo: 25, grenades: 2},
]);
export const ASSAULT_WEAPONS = Object.freeze([
  {id: 'seed', name: '種子連發', short: '連發', tip: '無限彈藥，遠距穩定', damage: 9, interval: .13, speed: 870, life: .95, cost: 0, color: 0xbdff8b},
  {id: 'spread', name: '花瓣散彈', short: '散彈', tip: '五發散射，近距爆發', damage: 10, interval: .4, speed: 720, life: .42, cost: 1, color: 0xffcc9e},
  {id: 'bounce', name: '彈跳橡果', short: '反彈', tip: '反彈三次，穿過兩個目標', damage: 19, interval: .28, speed: 650, life: 1.75, cost: 1, color: 0xc8b0ff},
]);
export const ASSAULT_ENEMIES = Object.freeze({
  guard: {hp: 32, interval: 1.8, speed: 38, score: 100},
  shield: {hp: 62, interval: 2.1, speed: 22, score: 160},
  drone: {hp: 24, interval: 2.3, speed: 0, score: 130},
  mortar: {hp: 42, interval: 2.8, speed: 0, score: 170},
  sniper: {hp: 30, interval: 2.2, speed: 0, score: 150},
});
