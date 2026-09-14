// Realm-only procedural audio: no network loads, shared mute/volume and cleanup.
export function safeCue(callback, name) {
  try { callback(name); } catch (error) { console.warn('Optional sound skipped', name, error); }
}
export class FootstepClock {
  constructor() { this.last = null; this.distance = 0; }
  update(player, moving) {
    const distance = this.last ? Math.hypot(player.x - this.last.x, player.y - this.last.y) : 0;
    this.last = { x: player.x, y: player.y };
    if (!moving || distance > 100) { this.distance = 0; return false; }
    this.distance += distance;
    if (this.distance < 74) return false;
    this.distance %= 74;
    return true;
  }
}
const buffers = new WeakMap();
const cues = new Set(['manaSwing', 'mouseHit', 'creatureHit', 'stepGrass', 'stepStone', 'moleHit', 'dewHit', 'mudDig', 'mudThrow', 'dewGather', 'bubbleCast', 'chickChirp', 'playerDown', 'bossWarn', 'bossSlam', 'bossSeeds']);
export function playRealmSound(scene, name) {
  if (!cues.has(name)) return false;
  const ctx = scene.sound?.context;
  if (!scene.soundOn || scene.sound.mute || !ctx || ctx.state !== 'running') return true;
  const volume = Math.max(0, Math.min(1, scene.sound.volume ?? 1));
  if (!volume || (scene.audioNodes?.size || 0) > 24) return true;
  scene.audioNodes ||= new Set();
  const at = ctx.currentTime;
  function voice(noise, from, to, duration, level, offset = 0) {
    const source = noise ? ctx.createBufferSource() : ctx.createOscillator();
    const filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type = 'lowpass';
    if (noise) {
      if (!buffers.has(ctx)) {
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .5), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        buffers.set(ctx, buffer);
      }
      source.buffer = buffers.get(ctx);
    } else {
      source.type = 'sine';
      source.frequency.setValueAtTime(from, at + offset);
      source.frequency.exponentialRampToValueAtTime(to, at + offset + duration);
    }
    filter.frequency.setValueAtTime(noise ? from : 5000, at + offset);
    if (noise) filter.frequency.exponentialRampToValueAtTime(to, at + offset + duration);
    gain.gain.setValueAtTime(0, at + offset);
    gain.gain.linearRampToValueAtTime(level * volume, at + offset + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, at + offset + duration);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    scene.audioNodes.add(source);
    source.onended = () => { scene.audioNodes.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(at + offset); source.stop(at + offset + duration + .01);
  }
  if (name==='bossWarn'){voice(false,190,310,.35,.07);}
  else if(name==='bossSlam'){voice(false,130,40,.28,.16);voice(true,650,150,.22,.13);}
  else if(name==='bossSeeds'){voice(true,2300,500,.25,.11);}
  else if (name === 'chickChirp') {
    voice(false, 1300, 1900, .10, .055); voice(false, 1600, 1100, .12, .04, .12);
  } else if (name === 'playerDown') {
    voice(false, 440, 220, .30, .06);voice(false, 330, 165, .25, .045, .20);
  } else if (name === 'manaSwing') {
    voice(true, 5200, 550, .22, .19);
    voice(false, 880, 440, .27, .045);
    voice(false, 1320, 880, .20, .024, .035);
  } else if (name === 'mouseHit') {
    voice(false, 1450, 820, .12, .065);
    voice(false, 180, 75, .08, .10);
    voice(true, 1300, 350, .065, .07);
  } else if (name === 'mudDig') {
    voice(true, 700, 180, .19, .14);voice(true, 950, 240, .16, .10, .20);
  } else if (name === 'mudThrow') {
    voice(true, 1400, 350, .18, .16);voice(false, 180, 80, .10, .06);
  } else if (name === 'dewGather' || name === 'bubbleCast' || name === 'dewHit') {
    voice(false, name === 'dewHit' ? 920 : 440, name === 'dewGather' ? 880 : 260, .16, .075);
    voice(false, 1200, 650, .12, .035, .065);
  } else if (name === 'moleHit') {
    voice(false, 480, 210, .14, .085);voice(true, 800, 250, .09, .08);
  } else if (name === 'creatureHit') {
    voice(true, 2000, 450, .10, .12);
    voice(false, 240, 90, .09, .08);
  } else {
    scene.realmStepIndex = (scene.realmStepIndex || 0) + 1;
    const pitch = scene.realmStepIndex % 2 ? 1 : .9;
    voice(true, name === 'stepGrass' ? 1700 : 2900, 450, .065, .065);
    voice(false, 135 * pitch, 65 * pitch, .07, .055);
  }
  return true;
}
