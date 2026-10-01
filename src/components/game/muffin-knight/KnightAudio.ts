import type { KnightEvent } from "@/lib/game/muffinKnight";

/** Original synthesized arcade score and layered SFX; optional CC0 Kenney foley. */
export class KnightAudio {
  private ctx: AudioContext | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private samples = new Map<string, AudioBuffer>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private nextNote = 0;
  private active = false;
  private request = 0;
  private closed = false;
  private voices = 0;
  private sfxEnabled = true;
  private musicEnabled = true;
  private loading: Promise<void> | null = null;
  async unlock() {
    if (this.closed) return;
    const request = ++this.request;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext(); const c = this.ctx;
        const compressor = c.createDynamicsCompressor(); compressor.threshold.value = -16; compressor.ratio.value = 5; compressor.connect(c.destination);
        this.sfx = c.createGain(); this.sfx.gain.value = this.sfxEnabled ? .6 : 0; this.sfx.connect(compressor);
        this.music = c.createGain(); this.music.gain.value = this.musicEnabled ? .17 : 0; this.music.connect(compressor);
        this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.loading = Promise.all([['land', '/sounds/Audio_rpg/footstep00.ogg'], ['dash', '/sounds/Audio_rpg/cloth1.ogg']].map(async ([name, url]) => {
          try { const response = await fetch(url); if (!response.ok) return; const buffer = await c.decodeAudioData(await response.arrayBuffer()); if (!this.closed) this.samples.set(name, buffer); } catch { /* Synthesized layers remain available without samples. */ }
        })).then(() => {});
      }
      await this.ctx.resume(); if (this.closed || request !== this.request) return;
      this.active = true; this.nextNote = this.ctx.currentTime + .03;
      if (!this.timer) this.timer = setInterval(() => this.schedule(), 80);
    } catch { /* Audio never blocks controls. */ }
  }
  setEnabled(sfx: boolean, music: boolean) {
    this.sfxEnabled = sfx; this.musicEnabled = music;
    if (this.ctx) { this.sfx?.gain.setTargetAtTime(sfx ? .6 : 0, this.ctx.currentTime, .025); this.music?.gain.setTargetAtTime(music ? .17 : 0, this.ctx.currentTime, .06); }
  }
  pause() { this.request++; this.active = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } void this.ctx?.suspend().catch(() => {}); }
  // Allow end-of-round fanfares to finish, while stopping the musical sequencer.
  finish() { this.request++; this.active = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  close() { this.closed = true; this.finish(); void this.ctx?.close().catch(() => {}); this.ctx = null; this.samples.clear(); }
  private tone(freq: number, end: number, duration: number, volume: number, type: OscillatorType = 'sine', delay = 0, music = false) {
    const c = this.ctx, bus = music ? this.music : this.sfx; if (!c || !bus || c.state !== 'running' || this.voices > 40) return;
    const at = c.currentTime + delay; const osc = c.createOscillator(), gain = c.createGain(); osc.type = type;
    osc.frequency.setValueAtTime(freq, at); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), at + .006); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain); gain.connect(bus); osc.start(at); osc.stop(at + duration + .01); this.voices++;
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices--; };
  }
  private hiss(duration: number, volume: number, frequency: number, delay = 0, music = false) {
    const c = this.ctx, bus = music ? this.music : this.sfx; if (!c || !bus || !this.noise || c.state !== 'running' || this.voices > 40) return;
    const at = c.currentTime + delay, src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(); src.buffer = this.noise;
    filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .8;
    gain.gain.setValueAtTime(volume, at); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    src.connect(filter); filter.connect(gain); gain.connect(bus); src.start(at); src.stop(at + duration); this.voices++;
    src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); this.voices--; };
  }
  private sample(name: string, volume: number, rate = 1) {
    const c = this.ctx, buffer = this.samples.get(name); if (!c || !this.sfx || !buffer || c.state !== 'running') return;
    const src = c.createBufferSource(), gain = c.createGain(); src.buffer = buffer; src.playbackRate.value = rate; gain.gain.value = volume;
    src.connect(gain); gain.connect(this.sfx); src.start(); src.onended = () => { src.disconnect(); gain.disconnect(); };
  }
  play(event: KnightEvent) {
    if (!this.sfxEnabled) return;
    const b = event.beast;
    switch (event.type) {
      case 'spring': this.tone(130, 1100, .28, .24 * event.power, 'triangle'); this.tone(330, 180, .17, .13, 'sine', .06); break;
      case 'portal': [330, 495, 740].forEach((f, i) => this.tone(f, f * 2, .22, .11 * event.power, 'sine', i * .035)); this.hiss(.2, .1, 2600); break;
      case 'grow': this.tone(180, 42, .48, .3, 'triangle'); this.hiss(.28, .2, 450); this.tone(70, 100, .3, .2, 'sine', .15); break;
      case 'jump': this.tone(b === 1 ? 130 : 210, b === 1 ? 530 : 490, .13, .16, 'triangle'); this.hiss(.055, .07, 1400); break;
      case 'land': this.tone(115, 55, .095, .1 * event.power); this.sample('land', .24 * event.power, 1.05); break;
      case 'attack':
        if (b === 3) { this.hiss(.2, .3, 1100); this.tone(150, 60, .17, .12, 'triangle'); this.sample('dash', .3, 1.3); }
        else if (b === 1 || b === 4) { this.tone(b === 1 ? 220 : 460, 950, .09, .16); this.tone(580, 200, .13, .09, 'sine', .04); }
        else if (b === 2) { this.hiss(.075, .19, 2400); this.tone(520, 240, .08, .07, 'triangle'); }
        else if (b === 5) { this.hiss(.13, .14, 3500); this.tone(870, 330, .09, .09, 'triangle'); }
        else if (b === 6) { this.hiss(.16, .24, 800); this.tone(280, 90, .11, .15, 'triangle'); }
        else { this.tone(740, 410, .065, .1, 'triangle'); this.hiss(.035, .08, 1800); }
        break;
      case 'hit': this.hiss(.085, .25, 2100); this.tone(145, 55, .12, .24); this.tone(490 * Math.pow(1.08, Math.min(10, event.power)), 900, .085, .08, 'triangle'); break;
      case 'hurt': this.hiss(.18, .24, 650); this.tone(250, 65, .24, .24, 'triangle'); break;
      case 'collect': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f * .99, .23, .16, 'sine', i * .055)); this.hiss(.1, .09, 4000); break;
      case 'win': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, f, .65, .2, 'triangle', i * .105)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, f * .92, .32, .15, 'triangle', i * .15)); break;
    }
  }
  private schedule() {
    const c = this.ctx; if (!c || !this.active || c.state !== 'running') return;
    // Original 112 BPM, eight-bar pentatonic motif, plucked lead / bass / brushed beat.
    const motif = [0, 7, 12, 7, 4, 7, 16, 12, 0, 7, 14, 12, 7, 4, 2, 7];
    const roots = [48, 45, 53, 55];
    while (this.nextNote < c.currentTime + .18) {
      const i = this.beat++, step = i % 16, root = roots[Math.floor(i / 16) % 4]; const delay = Math.max(0, this.nextNote - c.currentTime);
      if (this.musicEnabled) {
        if (step % 2 === 0 || step === 7 || step === 15) { const f = 440 * 2 ** ((root + 12 + motif[step] - 69) / 12); this.tone(f, f, .23, .22, 'sine', delay, true); this.tone(f * 2, f * 2, .07, .025, 'sine', delay, true); }
        if (step % 4 === 0) { const f = 440 * 2 ** ((root - 12 - 69) / 12); this.tone(f, f, .35, .5, 'triangle', delay, true); this.tone(105, 42, .12, .38, 'sine', delay, true); }
        if (step % 4 === 2) this.hiss(.07, .13, 1600, delay, true);
        this.hiss(.022, step % 2 ? .045 : .065, 6800, delay, true);
      }
      this.nextNote += 60 / 112 / 2;
    }
  }
}
