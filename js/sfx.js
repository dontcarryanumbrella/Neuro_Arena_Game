// Synthesized sound effects (WebAudio). No audio files: every sound is built from oscillators and noise.

class Sfx {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.last = {};
    this.recent = [];
  }

  // Browsers only allow audio after a user gesture.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  ready() { return this.enabled && this.ctx && this.ctx.state === 'running'; }

  // envelope helper: gain node that rises to `peak` and decays over `dur`
  env(t, peak, dur, attack = 0.005) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    return g;
  }

  tone(type, f0, f1, dur, peak = 0.5, delay = 0, attack = 0.005) {
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.connect(this.env(t, peak, dur, attack));
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(filter, f0, f1, dur, peak = 0.5, delay = 0, q = 1, attack = 0.005) {
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true; // Sustain the full envelope, even when starting partway into the noise buffer.
    const fl = this.ctx.createBiquadFilter();
    fl.type = filter; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    src.connect(fl); fl.connect(this.env(t, peak, dur, attack));
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ready() || !SOUNDS[name]) return;
    const now = this.ctx.currentTime;
    if (this.last[name] !== undefined && now - this.last[name] < 0.05) return; // same sound at most every 50ms
    this.recent = this.recent.filter(t => now - t < 0.1);
    if (this.recent.length >= 6) return;               // and no more than 6 sounds per 100ms
    this.last[name] = now; this.recent.push(now);
    SOUNDS[name](this);
  }
}

const SOUNDS = {
  // The Yellow Court: detuned bells, breath-like noise and restrained sub-bass.
  // Short voices are scheduled on the audio clock, never from animation frames.
  kingWhisper: s => {
    s.noise('bandpass', 450, 1700, 0.7, 0.13, 0, 5, 0.25);
    s.noise('bandpass', 1900, 650, 0.65, 0.09, 0.08, 7, 0.2);
    [146.8, 155.6].forEach(f => s.tone('sine', f, f*0.94, 0.8, 0.07, 0, 0.25));
  },
  kingSilk: s => {
    s.noise('highpass', 2600, 650, 0.55, 0.16, 0, 0.8, 0.04);
    for(let i=0;i<5;i++) {
      s.noise('bandpass', 1300+i*180, 700, 0.12, 0.06, i*0.055, 3);
      s.tone('sine', 980+i*111, 660+i*37, 0.2, 0.035, i*0.055);
    }
  },
  kingDust: s => {
    s.noise('bandpass', 1700, 220, 0.65, 0.2, 0, 2, 0.015);
    s.tone('sine', 180, 47, 0.5, 0.18);
    s.tone('triangle', 622, 587, 0.7, 0.04, 0.06);
  },
  kingStrings: s => {
    [293.7, 311.1, 440, 466.2].forEach((f,i) => {
      s.tone('triangle', f*2.01, f, 0.6, 0.07, i*0.1);
      s.tone('sine', f*3, f*2.97, 0.4, 0.025, i*0.1);
    });
    s.noise('bandpass', 2200, 800, 0.5, 0.045, 0.15, 6, 0.1);
  },
  kingEye: s => {
    [73.4, 110, 155.6, 233.1].forEach((f,i) => s.tone('sine', f*1.2, f, 1.2, 0.1-i*0.015, i*0.035, 0.15));
    s.noise('bandpass', 600, 2100, 0.85, 0.13, 0, 8, 0.2);
    s.tone('triangle', 1244, 622, 0.9, 0.04, 0.05, 0.1);
  },
  kingCharge: s => {
    s.tone('sine', 49, 73.4, 1.3, 0.23, 0, 1.0);
    s.tone('triangle', 146.8, 155.6, 1.3, 0.09, 0, 0.9);
    s.noise('bandpass', 220, 1800, 1.3, 0.16, 0, 4, 1.05);
  },
  kingStars: s => {
    [55, 58.27, 110, 116.54].forEach((f,i) => s.tone('sine', f, f*0.97, 2.6, i<2?0.13:0.045, 0, 0.2));
    for(let i=0;i<4;i++) s.tone('triangle', 466.2, 440, 0.8, 0.045, i*0.5, 0.08);
  },
  kingFall: s => {
    s.tone('sine', 146.8, 36.7, 2.5, 0.22, 0, 0.5);
    s.tone('triangle', 311.1, 73.4, 2.5, 0.08, 0, 0.6);
    for(let i=0;i<5;i++) s.noise('bandpass', 300+i*180, 1500, 0.8, 0.075, i*0.38, 2, 0.6);
  },
  kingImpact: s => {
    s.tone('sine', 100, 28, 1.7, 0.48);
    s.noise('lowpass', 1300, 80, 1.1, 0.3, 0, 0.8, 0.01);
    [146.8, 155.6, 220].forEach((f,i) => s.tone('sine', f, f*0.98, 2.2, 0.075, 0.08+i*0.04));
  },
  kingUnmask: s => {
    s.noise('bandpass', 800, 2800, 1.4, 0.12, 0, 5, 0.9);
    [293.7, 311.1, 415.3].forEach(f => s.tone('triangle', f, f*0.5, 1.5, 0.055, 0, 0.65));
    s.tone('sine', 50, 70, 1.5, 0.18, 0, 1.2);
  },
  kingUnveiled: s => {
    s.tone('sine', 73.4, 36.7, 2.1, 0.3);
    [146.8, 155.6, 220, 233.1].forEach(f => s.tone('sine', f, f, 2.4, 0.065, 0.05, 0.2));
    s.noise('lowpass', 700, 100, 1.2, 0.2);
  },
  whoosh: s => s.noise('bandpass', 500, 2200, 0.13, 0.25, 0, 1.5),
  slash: s => { s.noise('highpass', 2500, 5000, 0.09, 0.35); s.tone('triangle', 1800, 900, 0.08, 0.08); },
  hit: s => { s.noise('bandpass', 1400, 700, 0.06, 0.5, 0, 1.2); s.tone('sine', 140, 60, 0.09, 0.5); },
  heavyhit: s => { s.noise('lowpass', 1600, 200, 0.16, 0.6); s.tone('sine', 95, 38, 0.2, 0.7); },
  hurt: s => { s.tone('sawtooth', 220, 90, 0.13, 0.18); s.noise('lowpass', 900, 300, 0.08, 0.3); },
  block: s => { s.noise('lowpass', 600, 200, 0.08, 0.5); s.tone('square', 180, 140, 0.05, 0.08); },
  parry: s => { s.tone('triangle', 1450, 1400, 0.28, 0.35); s.tone('triangle', 2180, 2100, 0.22, 0.2); s.noise('highpass', 4000, 4000, 0.05, 0.3); },
  stun: s => { for (let i = 0; i < 3; i++) s.tone('sine', 900 - i * 120, 700 - i * 120, 0.12, 0.18, i * 0.1); },
  death: s => { s.tone('square', 420, 70, 0.3, 0.15); s.noise('lowpass', 800, 100, 0.25, 0.3); },
  charge: s => s.tone('sine', 220, 520, 0.3, 0.12, 0, 0.08),
  roar: s => { s.tone('sawtooth', 120, 70, 0.45, 0.25, 0, 0.05); s.noise('lowpass', 500, 200, 0.4, 0.35, 0, 1, 0.05); },
  ring: s => { s.tone('sine', 880, 880, 0.7, 0.3); s.tone('sine', 1320, 1320, 0.5, 0.15); s.tone('sine', 1760, 1760, 0.35, 0.08); },
  thud: s => { s.tone('sine', 70, 35, 0.35, 0.8); s.noise('lowpass', 400, 80, 0.3, 0.5); },
  boom: s => { s.noise('lowpass', 1200, 80, 0.55, 0.7); s.tone('sine', 80, 30, 0.5, 0.7); },
  gun: s => { s.noise('highpass', 1500, 600, 0.05, 0.6); s.noise('lowpass', 900, 200, 0.12, 0.4); },
  laser: s => { s.tone('sawtooth', 2200, 500, 0.3, 0.18); s.noise('highpass', 3000, 3000, 0.06, 0.3); },
  magic: s => { [660, 880, 1100, 1320].forEach((f, i) => s.tone('sine', f, f * 1.02, 0.18, 0.13, i * 0.045)); },
  holy: s => { [523, 659, 784, 1046].forEach(f => s.tone('sine', f, f, 0.6, 0.1, 0, 0.12)); },
  thunder: s => { s.noise('highpass', 3000, 1000, 0.08, 0.6); s.noise('lowpass', 600, 60, 0.9, 0.7, 0.05, 1, 0.02); },
  fire: s => { s.noise('bandpass', 900, 500, 0.45, 0.35, 0, 0.7, 0.04); s.noise('lowpass', 300, 150, 0.4, 0.3); },
  wind: s => s.noise('bandpass', 300, 1800, 0.5, 0.35, 0, 0.8, 0.1),
  bats: s => { for (let i = 0; i < 5; i++) s.tone('square', 2800 + i * 300, 3600, 0.04, 0.05, i * 0.05); },
  smoke: s => s.noise('lowpass', 900, 200, 0.25, 0.3, 0, 1, 0.02),
  summon: s => { s.tone('sine', 300, 900, 0.4, 0.15); [1200, 1500, 1800].forEach((f, i) => s.tone('triangle', f, f, 0.1, 0.06, 0.25 + i * 0.05)); },
  vortex: s => { s.noise('bandpass', 400, 1600, 0.6, 0.3, 0, 3, 0.1); s.noise('bandpass', 1600, 400, 0.6, 0.2, 0.3, 3); },
  bite: s => { s.noise('bandpass', 2000, 800, 0.07, 0.4, 0, 2); s.tone('sine', 300, 120, 0.12, 0.2, 0.05); },
  howl: s => { s.tone('sawtooth', 300, 520, 0.5, 0.12, 0, 0.1); s.tone('sine', 600, 1040, 0.5, 0.08, 0, 0.1); },
  zap: s => { s.tone('square', 1200, 300, 0.12, 0.12); s.noise('highpass', 2500, 2500, 0.1, 0.2); },
  gong: s => { s.tone('sine', 110, 108, 1.4, 0.5); s.tone('sine', 165, 162, 1.1, 0.25); s.tone('sine', 247, 240, 0.8, 0.12); },
  drum: s => { s.tone('sine', 90, 50, 0.25, 0.7); s.tone('sine', 90, 50, 0.25, 0.6, 0.18); },
  riser: s => { s.noise('bandpass', 200, 3000, 1.3, 0.3, 0, 2, 1.1); s.tone('sawtooth', 110, 440, 1.3, 0.1, 0, 1.1); s.tone('sine', 55, 110, 1.3, 0.3, 0, 1.0); },
  bassdrop: s => { s.tone('sine', 140, 28, 1.2, 0.9); s.tone('triangle', 70, 30, 1.0, 0.4); },
  ultboom: s => { SOUNDS.bassdrop(s); SOUNDS.boom(s); s.noise('highpass', 3000, 800, 0.25, 0.5); s.tone('sine', 110, 108, 1.6, 0.3, 0.05); s.tone('sine', 165, 160, 1.3, 0.18, 0.05); },
  learn: s => { [523, 659, 784, 1046, 1318].forEach((f, i) => s.tone('triangle', f, f, 0.25, 0.15, i * 0.07)); },
  // the newer foes
  club: s => { s.tone('sine', 85, 40, 0.3, 0.8); s.noise('lowpass', 700, 120, 0.25, 0.55); s.tone('square', 160, 90, 0.06, 0.08); },
  punch: s => { s.noise('bandpass', 1100, 500, 0.05, 0.55, 0, 1.4); s.tone('sine', 170, 80, 0.07, 0.45); },
  scythe: s => { s.noise('bandpass', 1800, 4200, 0.22, 0.3, 0, 3, 0.03); s.tone('sine', 1300, 600, 0.22, 0.06); },
  rock: s => { s.noise('lowpass', 900, 100, 0.4, 0.6); s.tone('sine', 60, 32, 0.4, 0.6); for (let i = 0; i < 4; i++) s.noise('bandpass', 1400, 900, 0.04, 0.2, 0.06 + i * 0.05, 3); },
  glass: s => { [2600, 3300, 4100].forEach((f, i) => s.tone('triangle', f, f * 0.97, 0.12, 0.08, i * 0.02)); s.noise('highpass', 4000, 6000, 0.12, 0.3); },
  web: s => { s.noise('bandpass', 700, 300, 0.15, 0.25, 0, 4); s.tone('sine', 300, 180, 0.12, 0.06); },
  squelch: s => { s.noise('lowpass', 600, 200, 0.18, 0.4, 0, 6); s.tone('sine', 220, 90, 0.16, 0.2); },
  hiss: s => s.noise('highpass', 3500, 5000, 0.4, 0.18, 0, 1, 0.05),
  crackle: s => { for (let i = 0; i < 6; i++) s.noise('bandpass', 2000 + i * 300, 1200, 0.03, 0.25, i * 0.04, 4); s.noise('lowpass', 500, 200, 0.4, 0.2, 0, 1, 0.1); },
  screech: s => { s.tone('sawtooth', 900, 1800, 0.35, 0.14, 0, 0.02); s.tone('sawtooth', 1350, 2600, 0.3, 0.07, 0.05, 0.02); s.noise('bandpass', 2500, 3500, 0.35, 0.2, 0, 2); },
  snap: s => { s.noise('highpass', 2200, 1500, 0.04, 0.6); s.tone('square', 600, 200, 0.06, 0.12); },
  poof: s => { s.noise('lowpass', 1400, 300, 0.22, 0.35, 0, 1, 0.01); [880, 1320].forEach((f, i) => s.tone('sine', f, f * 1.5, 0.12, 0.06, 0.05 + i * 0.04)); },
  pop: s => s.tone('sine', 600, 1400, 0.05, 0.12),
  foxfire: s => { [523, 784, 1046].forEach((f, i) => s.tone('sine', f, f * 1.01, 0.4, 0.07, i * 0.06, 0.05)); s.noise('bandpass', 1200, 2400, 0.3, 0.08, 0, 3); },
  gulp: s => { [0, 0.12, 0.24].forEach(d => s.tone('sine', 260, 160, 0.09, 0.25, d)); },
  warp: s => { s.tone('sine', 400, 80, 0.4, 0.25); s.tone('sawtooth', 60, 30, 0.35, 0.1); s.noise('bandpass', 300, 1200, 0.3, 0.15, 0, 4); },
  chime: s => { [660, 990, 1320].forEach((f, i) => s.tone('sine', f, f, 0.8, 0.12, i * 0.09, 0.005)); },
  // a slow, quiet piano line for the Honored One's return
  piano: s => {
    [[440, 0], [523, 0.32], [659, 0.64], [880, 0.96], [784, 1.4], [659, 1.72], [587, 2.04], [659, 2.5]].forEach(([f, t]) => {
      s.tone('triangle', f, f * 0.998, 1.4, 0.16, t, 0.004);
      s.tone('sine', f * 2, f * 2, 0.6, 0.04, t, 0.004);
      s.tone('sine', f / 2, f / 2, 1.6, 0.08, t, 0.004);
    });
  },
};

const sfx = new Sfx();

// Generative ambient music: a low drone, slow pad chords, soft wind and a wandering
// guzheng-like pluck in D pentatonic, all fed through a gentle echo.
const SCALE = [220, 246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];
const PADS = [[146.83, 220, 329.63], [123.47, 185, 293.66], [146.83, 220, 369.99], [110, 164.81, 246.94]];

class Music {
  constructor(sound) {
    this.sound = sound;
    this.on = false;
  }

  start() {
    const s = this.sound;
    s.unlock();
    if (!s.ctx || this.on) return;
    const ctx = s.ctx;
    this.on = true;
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.out.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 3);
    this.out.connect(ctx.destination);
    // echo send
    this.echo = ctx.createDelay(2);
    this.echo.delayTime.value = 0.6;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    this.echo.connect(fb); fb.connect(this.echo); this.echo.connect(wet); wet.connect(this.out);
    this.nodes = [];
    // drone: D2 and A2 through a dark filter, breathing slowly
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.05;
    lp.connect(droneGain); droneGain.connect(this.out);
    for (const f of [73.42, 110, 146.83]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(lp); o.start(); this.nodes.push(o);
    }
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.025;
    lfo.connect(lfoAmt); lfoAmt.connect(droneGain.gain); lfo.start(); this.nodes.push(lfo);
    // wind: filtered noise drifting through the mountains
    const wind = ctx.createBufferSource(); wind.buffer = s.noiseBuf; wind.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = 0.025;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.05;
    const wla = ctx.createGain(); wla.gain.value = 250;
    wl.connect(wla); wla.connect(bp.frequency);
    wind.connect(bp); bp.connect(wg); wg.connect(this.out);
    wind.start(); wl.start(); this.nodes.push(wind, wl);

    this.next = ctx.currentTime + 1;
    this.step = 0; this.note = 4;
    this.timer = setInterval(() => this.schedule(), 200);
  }

  stop() {
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer);
    const ctx = this.sound.ctx, out = this.out, nodes = this.nodes;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); out.disconnect(); }, 1700);
  }

  schedule() {
    const ctx = this.sound.ctx;
    while (this.next < ctx.currentTime + 1) {
      const t = this.next;
      if (this.step % 16 === 0) this.pad(t, PADS[(this.step / 16) % PADS.length]);
      // the melody wanders a step or two at a time, resting often
      if (Math.random() < 0.38) {
        this.note = Math.max(0, Math.min(SCALE.length - 1, this.note + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        this.pluck(t, SCALE[this.note], 0.07);
        if (Math.random() < 0.15) this.pluck(t + 0.25, SCALE[Math.max(0, this.note - 2)], 0.04);
      }
      this.step++;
      this.next += 0.5;
    }
  }

  // a plucked string that bends down into its note, like a guzheng
  pluck(t, f, peak) {
    const ctx = this.sound.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    g.connect(this.out); g.connect(this.echo);
    for (const [type, mul, amt] of [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f * mul * 1.03, t);
      o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.12);
      og.gain.value = amt;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + 2.3);
    }
  }

  pad(t, chord) {
    const ctx = this.sound.ctx;
    for (const f of chord) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 10;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.025, t + 2.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 8);
      o.connect(g); g.connect(this.out);
      o.start(t); o.stop(t + 8.1);
    }
  }
}

const music = new Music(sfx);
