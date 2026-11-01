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

// Generative ambient music, one theme per place: a low drone, slow pad chords, soft wind, a wandering melody on the
// place's own instrument and, in some, quiet percussion, all through a gentle echo. Changing place crossfades.
const N = (n) => 440 * Math.pow(2, n / 12); // semitones from A4
const notes = (root, steps) => steps.map(s => N(root + s));
const MUSIC_THEMES = {
  // the jar, the lobby and the Pavilion: the guzheng in D pentatonic it always had
  jar: { drone: [73.42, 110, 146.83], scale: [220, 246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25],
    pads: [[146.83, 220, 329.63], [123.47, 185, 293.66], [146.83, 220, 369.99], [110, 164.81, 246.94]], inst: 'pluck', beat: 0.5, density: 0.38, wind: 0.025, echo: 0.6 },
  // a slide-guitar twang over a low E, a shaker in the dust
  frontier: { drone: [82.41, 123.47], scale: notes(-17, [0, 3, 5, 7, 10, 12, 15, 17, 19]), pads: [[164.81, 246.94, 392], [146.83, 220, 349.23], [130.81, 196, 329.63]],
    inst: 'twang', beat: 0.42, density: 0.45, wind: 0.035, echo: 0.42, perc: { kind: 'shaker', every: 2, level: 0.03 } },
  // temple bells and a wooden fish keeping time
  temple: { drone: [73.42, 110], scale: notes(-19, [0, 2, 5, 7, 9, 12, 14, 17, 19]), pads: [[146.83, 220, 293.66], [130.81, 196, 261.63]],
    inst: 'bell', beat: 0.6, density: 0.3, wind: 0.02, echo: 0.7, perc: { kind: 'woodfish', every: 4, level: 0.05 } },
  // a music box in a minor key, an organ underneath
  night: { drone: [73.42, 110, 116.54], scale: notes(-7, [0, 2, 3, 5, 7, 8, 11, 12, 14]), pads: [[146.83, 174.61, 220], [116.54, 146.83, 174.61], [130.81, 155.56, 196], [110, 138.59, 164.81]],
    inst: 'musicbox', beat: 0.45, density: 0.42, wind: 0.03, echo: 0.55, pad: 'organ' },
  // a bamboo flute over wide, cold air
  peaks: { drone: [98, 146.83], scale: notes(-14, [0, 2, 4, 7, 9, 12, 14, 16, 19]), pads: [[196, 293.66, 392], [174.61, 261.63, 349.23]],
    inst: 'flute', beat: 0.65, density: 0.32, wind: 0.05, echo: 0.8 },
  // low and wrong: a tritone in the drone, slow war drums
  abyss: { drone: [55, 77.78, 110], scale: notes(-21, [0, 1, 3, 6, 7, 8, 11, 12, 13]), pads: [[110, 155.56, 207.65], [103.83, 146.83, 196]],
    inst: 'synth', beat: 0.55, density: 0.28, wind: 0.04, echo: 0.5, perc: { kind: 'taiko', every: 4, level: 0.09 } },
  // a koto in the old in-scale, waves for wind
  isles: { drone: [82.41, 123.47], scale: notes(-17, [0, 1, 5, 7, 8, 12, 13, 17, 19]), pads: [[164.81, 220, 329.63], [146.83, 207.65, 293.66]],
    inst: 'koto', beat: 0.5, density: 0.4, wind: 0.035, echo: 0.65 },
  // bright bells over a major pad
  heavens: { drone: [98, 146.83, 196], scale: notes(-2, [0, 2, 4, 7, 9, 12, 14, 16, 19]), pads: [[196, 246.94, 392], [220, 277.18, 440], [174.61, 220, 349.23]],
    inst: 'bell', beat: 0.45, density: 0.4, wind: 0.02, echo: 0.75 },
  // a ticking clock under a whole-tone arpeggio
  timestream: { drone: [65.41, 98], scale: notes(-9, [0, 2, 4, 6, 8, 10, 12, 14, 16]), pads: [[130.81, 164.81, 207.65], [146.83, 185, 233.08]],
    inst: 'synth', beat: 0.25, density: 0.55, wind: 0.015, echo: 0.375, perc: { kind: 'tick', every: 2, level: 0.035 } },
  // a slow heartbeat under something that never resolves
  cursed: { drone: [61.74, 87.31], scale: notes(-10, [0, 1, 3, 6, 7, 10, 12, 13, 15]), pads: [[123.47, 146.83, 174.61], [116.54, 138.59, 174.61]],
    inst: 'synth', beat: 0.6, density: 0.26, wind: 0.03, echo: 0.6, perc: { kind: 'heartbeat', every: 4, level: 0.07 } },
  // almost nothing: water, a deep tone, a note now and then across the dark
  blacksea: { drone: [55, 82.41], scale: notes(-14, [0, 3, 5, 7, 10, 12, 15, 17]), pads: [[110, 164.81, 220]],
    inst: 'bell', beat: 0.9, density: 0.16, wind: 0.06, echo: 0.9 },
  // a bell slightly out of tune, a choir that never quite arrives
  pallid: { drone: [69.3, 103.83], scale: notes(-13, [0, 1, 4, 5, 7, 8, 10, 12, 13]), pads: [[138.59, 174.61, 207.65], [130.81, 164.81, 207.65]],
    inst: 'bell', detune: 30, beat: 0.6, density: 0.3, wind: 0.025, echo: 0.7, pad: 'choir' },
  // the jar's own song, slower and deeper
  bottom: { drone: [55, 73.42, 110], scale: [146.83, 164.81, 196, 220, 246.94, 293.66, 329.63], pads: [[110, 164.81, 220], [98, 146.83, 196]],
    inst: 'pluck', beat: 0.75, density: 0.25, wind: 0.03, echo: 0.8 },
  // high, sparse and cold: bells above the clouds
  summit: { drone: [98, 146.83], scale: notes(3, [0, 2, 4, 7, 9, 12, 14]), pads: [[293.66, 440, 587.33]],
    inst: 'bell', beat: 0.8, density: 0.22, wind: 0.07, echo: 0.9 },
};
// how each instrument sounds: its partials ([wave, multiple, level]), how loud and long, how it bends into the note
const INSTRUMENTS = {
  pluck: { peak: 0.07, len: 2.2, bend: 1.03, parts: [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12]] },        // a guzheng
  koto: { peak: 0.07, len: 1.6, bend: 1.05, parts: [['triangle', 1, 1], ['sine', 2, 0.5], ['sine', 4, 0.15]] },          // a sharper bend, quicker
  twang: { peak: 0.06, len: 1.8, bend: 0.94, parts: [['sawtooth', 1, 0.35], ['triangle', 1, 0.8], ['sine', 2, 0.25]] },  // a slide up into it
  bell: { peak: 0.055, len: 3.2, bend: 1, parts: [['sine', 1, 1], ['sine', 2.76, 0.4], ['sine', 5.4, 0.18]] },           // struck metal
  musicbox: { peak: 0.05, len: 1.4, bend: 1, parts: [['sine', 2, 1], ['sine', 4, 0.3], ['sine', 6.1, 0.1]] },            // small and high
  flute: { peak: 0.05, len: 1.6, bend: 1, attack: 0.15, vibrato: true, parts: [['sine', 1, 1], ['triangle', 2, 0.12]] }, // breath and a waver
  synth: { peak: 0.035, len: 1.0, bend: 1, filter: 900, parts: [['square', 1, 0.5], ['sawtooth', 0.5, 0.3]] },          // cold
};

class Music {
  constructor(sound) {
    this.sound = sound;
    this.on = false;
    this.themeId = 'jar';
  }

  get theme() { return MUSIC_THEMES[this.themeId] || MUSIC_THEMES.jar; }

  // a new place: the old theme fades out while the new one fades in
  setTheme(id) {
    if (!MUSIC_THEMES[id] || id === this.themeId) return;
    this.themeId = id;
    if (this.on) { this.stop(); this.start(); }
  }

  start() {
    const s = this.sound, T = this.theme;
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
    this.echo.delayTime.value = T.echo;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    this.echo.connect(fb); fb.connect(this.echo); this.echo.connect(wet); wet.connect(this.out);
    this.nodes = [];
    // drone: the theme's low notes through a dark filter, breathing slowly
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.05;
    lp.connect(droneGain); droneGain.connect(this.out);
    for (const f of T.drone) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(lp); o.start(); this.nodes.push(o);
    }
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.025;
    lfo.connect(lfoAmt); lfoAmt.connect(droneGain.gain); lfo.start(); this.nodes.push(lfo);
    // wind: filtered noise drifting
    const wind = ctx.createBufferSource(); wind.buffer = s.noiseBuf; wind.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = T.wind;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.05;
    const wla = ctx.createGain(); wla.gain.value = 250;
    wl.connect(wla); wla.connect(bp.frequency);
    wind.connect(bp); bp.connect(wg); wg.connect(this.out);
    wind.start(); wl.start(); this.nodes.push(wind, wl);

    this.next = ctx.currentTime + 1;
    this.step = 0; this.note = Math.floor(T.scale.length / 2);
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
    const ctx = this.sound.ctx, T = this.theme, beatsPerPad = Math.round(8 / T.beat);
    while (this.next < ctx.currentTime + 1) {
      const t = this.next;
      if (this.step % beatsPerPad === 0) this.pad(t, T.pads[(this.step / beatsPerPad) % T.pads.length]);
      if (T.perc && this.step % T.perc.every === 0) this.hit(t, T.perc);
      // the melody wanders a step or two at a time, resting often
      if (Math.random() < T.density) {
        this.note = Math.max(0, Math.min(T.scale.length - 1, this.note + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        this.voice(t, T.scale[this.note], T);
        if (Math.random() < 0.15) this.voice(t + T.beat / 2, T.scale[Math.max(0, this.note - 2)], T, 0.6);
      }
      this.step++;
      this.next += T.beat;
    }
  }

  // one note on the theme's instrument
  voice(t, f, T, vol = 1) {
    const ctx = this.sound.ctx, g = ctx.createGain(), I = INSTRUMENTS[T.inst] || INSTRUMENTS.pluck;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(I.peak * vol, t + (I.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + I.len);
    let dest = g;
    if (I.filter) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = I.filter; lp.connect(g); dest = lp; }
    g.connect(this.out); g.connect(this.echo);
    for (const [type, mul, amt] of I.parts) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type;
      if (T.detune) o.detune.value = (Math.random() - 0.5) * T.detune;
      o.frequency.setValueAtTime(f * mul * I.bend, t);
      o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.12);
      if (I.vibrato) { const v = ctx.createOscillator(), va = ctx.createGain(); v.frequency.value = 5; va.gain.value = f * mul * 0.008; v.connect(va); va.connect(o.frequency); v.start(t); v.stop(t + I.len + 0.1); }
      og.gain.value = amt;
      o.connect(og); og.connect(dest);
      o.start(t); o.stop(t + I.len + 0.1);
    }
  }

  // quiet percussion: a shaker, a wooden fish, a war drum, a clock, a heartbeat
  hit(t, p) {
    const ctx = this.sound.ctx, g = ctx.createGain(), L = p.level;
    g.connect(this.out);
    const tone = (f0, f1, dur, lvl, at = t) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
      og.gain.setValueAtTime(lvl, at); og.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(og); og.connect(g); o.start(at); o.stop(at + dur + 0.05);
    };
    const noise = (dur, lvl, freq) => {
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = this.sound.noiseBuf; f.type = 'highpass'; f.frequency.value = freq;
      ng.gain.setValueAtTime(lvl, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f); f.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + 0.05);
    };
    if (p.kind === 'shaker') noise(0.08, L, 5000);
    else if (p.kind === 'tick') noise(0.025, L, 7000);
    else if (p.kind === 'woodfish') tone(820, 700, 0.12, L);
    else if (p.kind === 'taiko') { tone(110, 50, 0.6, L); noise(0.05, L * 0.4, 1500); }
    else if (p.kind === 'heartbeat') { tone(70, 45, 0.25, L); tone(65, 42, 0.22, L * 0.7, t + 0.28); }
  }

  pad(t, chord) {
    const ctx = this.sound.ctx, T = this.theme;
    for (const f of chord) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = T.pad === 'organ' ? 'square' : T.pad === 'choir' ? 'sawtooth' : 'sine';
      o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * (T.pad === 'choir' ? 22 : 10);
      const lvl = T.pad === 'organ' ? 0.008 : T.pad === 'choir' ? 0.007 : 0.025;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(lvl, t + 2.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 8);
      let dest = g;
      if (T.pad) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = T.pad === 'choir' ? 1200 : 700; lp.connect(g); dest = lp; }
      o.connect(dest); g.connect(this.out);
      o.start(t); o.stop(t + 8.1);
    }
  }
}

const music = new Music(sfx);
