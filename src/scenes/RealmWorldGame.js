import AnimalSnackGame from './AnimalSnackGame.js';
import { preferences } from '../systems/AdventurePreferences.js';
import AudioSystem from '../systems/AudioSystem.js';

export default class RealmWorldGame extends AnimalSnackGame {
    constructor() { super('RealmWorldGame'); }
    preload() {}
    update() {}

    init(data) {
        this.returnScene = data?.returnScene || 'WorldAtlas';
    }

    create() {
        AudioSystem.playRegionBgm(this, 'realm', 0.32);
        this.audioNodes = new Set();
        this.soundOn = true;
        this.realmDead = false;
        this.root = document.createElement('div');
        document.body.append(this.root);
        this.root.textContent = '正在穿越漩渦，喚醒幻界・星芽谷…';
        this.root.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#173e37;color:#fff0cf;display:grid;place-items:center;font:700 24px "Microsoft JhengHei",sans-serif';

        this.events.once('shutdown', () => {
            this.realmDead = true;
            this.app?.dispose();
            this.root?.remove();
            this.stopTones();
        });

        import('../realm/RealmApp.js').then(({ RealmApp }) => {
            if (this.realmDead) return;
            this.root.textContent = '';
            this.app = new RealmApp(this.root, {
                onExit: () => this.scene.start(this.returnScene),
                onSound: (name) => {
                    if (!preferences.value.sfx) return;
                    const context = this.sound.context;
                    if (context?.state === 'suspended') context.resume().then(() => { if (!this.realmDead) this.tone(name); });
                    else this.tone(name);
                }
            });
            this.app.start();
        }).catch((error) => {
            if (this.realmDead) return;
            this.root.textContent = '幻界・星芽谷載入失敗，請確認 src/realm 與 assets/phantom-realm 已完整保留。';
            const back = document.createElement('button');
            back.textContent = '返回世界地圖';
            back.onclick = () => this.scene.start(this.returnScene);
            this.root.append(back);
            console.error(error);
        });
    }
}
