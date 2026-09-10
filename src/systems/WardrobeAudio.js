// v4.2 — warmer, more audible cabin music and gentle UI effects.
const MUSIC_GAIN = 0.09;
const SFX_GAIN = 0.12;

export default class WardrobeAudio {
    constructor(scene) {
        this.scene = scene;
        this.ctx = null;
        this.timer = null;
        this.musicStep = 0;
        this.activeNotes = new Set();
        const saved = scene.registry.get('wardrobe_audio');
        this.prefs = {
            music: saved?.music !== false,
            sfx: saved?.sfx !== false
        };
    }

    context() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return null;
            this.ctx = new AudioContext();
        }
        return this.ctx;
    }

    unlock() {
        const ctx = this.context();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        if (this.prefs.music && !this.timer) this.startMusic();
    }

    note(freq, duration = .45, gain = MUSIC_GAIN, type = 'sine', delay = 0) {
        const ctx = this.context();
        if (!ctx || ctx.state !== 'running') return;
        const oscillator = ctx.createOscillator();
        const amp = ctx.createGain();
        const start = ctx.currentTime + delay;
        const end = start + duration;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, start);
        amp.gain.setValueAtTime(.0001, start);
        amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), start + .045);
        amp.gain.exponentialRampToValueAtTime(.0001, end);
        oscillator.connect(amp).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end + .04);
        this.activeNotes.add(oscillator);
        oscillator.onended = () => this.activeNotes.delete(oscillator);
    }

    startMusic() {
        if (!this.prefs.music || this.timer) return;
        const melody = [392, 440, 523, 494, 440, 392, 349, 392, 440, 523, 587, 523, 494, 440, 392, 349];
        const chords = [[196, 247, 294], [174, 220, 262], [220, 262, 330], [196, 247, 294]];
        const tick = () => {
            if (!this.prefs.music) return;
            const i = this.musicStep % melody.length;
            this.note(melody[i], .72, MUSIC_GAIN, 'sine');
            this.note(melody[i] / 2, .78, MUSIC_GAIN * .34, 'triangle');
            if (i % 4 === 0) {
                chords[Math.floor(i / 4)].forEach((frequency, n) => this.note(frequency, 2.9, MUSIC_GAIN * .22, 'sine', n * .035));
            }
            this.musicStep += 1;
        };
        tick();
        this.timer = window.setInterval(tick, 822); // about 73 BPM
    }

    stopMusic() {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
        this.activeNotes.forEach(note => { try { note.stop(); } catch (_) {} });
        this.activeNotes.clear();
    }

    effect(name) {
        if (!this.prefs.sfx) return;
        const sequences = {
            click: [[698, .08, 0]],
            equip: [[587, .12, 0], [784, .18, .09]],
            upgrade: [[523, .12, 0], [659, .14, .09], [784, .16, .18], [1046, .28, .29]]
        };
        (sequences[name] || sequences.click).forEach(([frequency, duration, delay]) => {
            this.note(frequency, duration, SFX_GAIN, name === 'click' ? 'triangle' : 'sine', delay);
        });
    }

    toggle(kind) {
        this.prefs[kind] = !this.prefs[kind];
        this.scene.registry.set('wardrobe_audio', { ...this.prefs });
        if (kind === 'music') {
            if (this.prefs.music) this.unlock();
            else this.stopMusic();
        }
    }

    destroy() {
        this.stopMusic();
        if (this.ctx) this.ctx.close().catch(() => {});
        this.ctx = null;
    }
}
