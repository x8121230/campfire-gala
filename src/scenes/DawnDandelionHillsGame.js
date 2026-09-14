import { playRealmSound } from '../realm/RealmSoundEffects.js';
import { travelBetweenRealms, revealRealmArrival } from '../realm/RealmTravelCurtain.js';
import AnimalSnackGame from './AnimalSnackGame.js';
import { preferences } from '../systems/AdventurePreferences.js';

export default class DawnDandelionHillsGame extends AnimalSnackGame {
  tone(name) {
    try { if (!playRealmSound(this, name)) super.tone(name); }
    catch (error) { console.warn('Realm sound skipped', name, error); }
  }
  constructor() { super('DawnDandelionHillsGame'); }
  preload() {}
  update() {}
  init(data) { this.returnScene = data?.returnScene || 'WorldAtlas'; this.portalArrival = Boolean(data?.portalArrival); }

  create() {
    this.audioNodes = new Set(); this.soundOn = true; this.hillsDead = false;
    this.root = document.createElement('div'); document.body.append(this.root);
    this.root.textContent = '正在穿過北門，前往晨曦蒲公英丘陵…';
    this.root.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#315a49;color:#fff1c5;display:grid;place-items:center;font:700 24px "Microsoft JhengHei",sans-serif';
    this.events.once('shutdown', () => { this.hillsDead = true; this.app?.dispose(); this.root?.remove(); this.stopTones(); });
    import('../realm/DandelionHillsApp.js').then(async ({ DandelionHillsApp }) => {
      if (this.hillsDead) return;
      this.root.textContent = '';
      this.app = new DandelionHillsApp(this.root, {
        onExit: () => this.scene.start(this.returnScene),
        portalArrival: this.portalArrival,
        onTravel: (target) => travelBetweenRealms(this, target === 'camp' ? 'RealmWorldGame' : this.returnScene, { returnScene: this.returnScene, entry: target === 'camp' ? 'northGate' : '' }),
        onSound: (name) => {
          if (!preferences.value.sfx) return;
          const context = this.sound.context;
          if (context?.state === 'suspended') context.resume().then(() => { if (!this.hillsDead) this.tone(name); }).catch(() => {});
          else this.tone(name);
        }
      });
      const ready = await this.app.start();
      if (this.portalArrival) {
        await revealRealmArrival();
        if (ready && !this.hillsDead && !this.app.modal) this.app.close();
      }
    }).catch((error) => {
      if (this.hillsDead) return;
      if (this.portalArrival) revealRealmArrival();
      console.error(error); this.root.textContent = '晨曦蒲公英丘陵載入失敗，請確認丘陵場景與怪物素材完整。';
      const back = document.createElement('button'); back.textContent = '返回星芽營地'; back.onclick = () => this.scene.start('RealmWorldGame', { returnScene: this.returnScene, entry: 'northGate' }); this.root.append(back);
    });
  }
}
