// The endings, animated: short scenes at 256x144 (the arena's own size), a beat at a time, each with one line of
// text under the picture. Drawn in the fight's coordinates on a canvas ARENA_S times finer, like the arenas: their
// painted backdrops and ambient, and the fighters' sprites in crisp pixels. Loaded after finale-arenas.js; main.js
// decides when each scene plays.

// ---------- the player: beats of { dur, line, sound, draw(g, k, t, u), choices } ----------
const CUT = { beats: null, i: 0, t: 0, done: null, last: 0, raf: 0, fired: null };

function playCutscene(beats, done) {
  Object.assign(CUT, { beats, i: 0, t: 0, done, last: performance.now() });
  document.getElementById('cutscene').hidden = false;
  cutEnter();
  cancelAnimationFrame(CUT.raf);
  const loop = now => { if (!CUT.beats) return; cutTick(Math.max(0, Math.min(0.1, (now - CUT.last) / 1000))); CUT.last = now; CUT.raf = requestAnimationFrame(loop); };
  CUT.raf = requestAnimationFrame(loop);
}

function cutEnter() {
  const b = CUT.beats[CUT.i], line = document.getElementById('cutLine'), acts = document.getElementById('cutActs');
  CUT.fired = new Set();
  line.textContent = b.line || ''; line.classList.remove('in'); void line.offsetWidth; line.classList.add('in');
  acts.innerHTML = '';
  for (const [label, fn, primary] of b.choices || []) {
    const btn = document.createElement('button'); btn.textContent = label; if (primary) btn.className = 'primary';
    btn.onclick = fn; acts.appendChild(btn);
  }
  document.getElementById('cutSkip').hidden = !!b.choices;
  (acts.querySelector('button') || document.getElementById('cutSkip')).focus();
  if (b.sound) sfx.play(b.sound);
}

function cutTick(dt) {
  const b = CUT.beats[CUT.i], g = document.getElementById('cutCanvas').getContext('2d');
  CUT.t += dt;
  g.imageSmoothingEnabled = false; g.setTransform(ARENA_S, 0, 0, ARENA_S, 0, 0); g.globalAlpha = 1; g.filter = 'none';
  b.draw(g, cutKit(g), CUT.t, b.choices ? 0 : Math.min(1, CUT.t / b.dur));
  // each beat fades in from black and out to it, unless it cuts or flows straight into its neighbour (noFadeIn, noFadeOut)
  const fade = Math.max(b.noFadeIn ? 0 : Math.max(0, 1 - CUT.t / 0.35), b.choices || b.noFadeOut ? 0 : Math.max(0, 1 - (b.dur - CUT.t) / 0.35));
  if (fade > 0 && !b.noFade) { g.globalAlpha = fade; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  if (!b.choices && CUT.t >= b.dur) { if (CUT.i + 1 < CUT.beats.length) { CUT.i++; CUT.t = 0; cutEnter(); } else endCutscene(); }
}

// once per beat: a sound (or anything) at a moment inside it
const cutOnce = (key, fn) => { if (!CUT.fired.has(key)) { CUT.fired.add(key); fn(); } };

function endCutscene() {
  const done = CUT.done;
  CUT.beats = null; cancelAnimationFrame(CUT.raf);
  document.getElementById('cutscene').hidden = true;
  if (done) done();
}

// Skip runs on to the next choice, if one is waiting; otherwise to the end.
function skipCutscene() {
  if (!CUT.beats) return;
  const c = CUT.beats.findIndex((b, i) => i > CUT.i && b.choices);
  if (c < 0) return endCutscene();
  CUT.i = c; CUT.t = 0; cutEnter();
}

function bindCutscene() {
  document.getElementById('cutSkip').onclick = skipCutscene;
  document.getElementById('cutscene').addEventListener('keydown', e => { if (e.code === 'Escape') { e.stopPropagation(); e.preventDefault(); skipCutscene(); } });
}

// ---------- brushes ----------
// the arenas' paint kit, plus a few pixel-ish brushes: whole squares, discs, firmer lines
function cutKit(g) {
  const p = paintKit(g);
  return { ...p, px: (x, y, c) => p.rect(x, y, 1, 1, c), disc: (x, y, r, c, ry = r) => p.oval(x, y, r, ry, c), line: (x0, y0, x1, y1, c, w = 1) => p.line(x0, y0, x1, y1, c, w) };
}
const cutBg = id => renderer.worldBackgrounds[id] || (renderer.worldBackgrounds[id] = bakeWorldArena(id));
const drawBg = (g, id) => g.drawImage(cutBg(id), 0, 0, W, H);
// a sprite stood on its feet at (x, y), scaled by whole pixels; crop cuts rows off its bottom (kneeling)
function cutSprite(g, name, x, y, { scale = 2, flip = false, alpha = 1, filter = 'none', crop = 0 } = {}) {
  if (!SPRITE_CACHE[name] && SPRITES[name]) bakeSprite(name);
  const s = SPRITE_CACHE[name]; if (!s || alpha <= 0) return;
  const h = s.h - crop;
  g.save(); g.globalAlpha = alpha; g.filter = filter;
  g.drawImage(flip ? s.f : s.n, 0, 0, s.w, h, Math.round(x - s.w * scale / 2), Math.round(y - h * scale), s.w * scale, h * scale);
  g.restore();
}
const cutSim = (open = 0) => ({ enemies: [{ def: { mystery: true }, dead: false, phase: open > 0 ? 2 : 1, hp: 1 - open, maxHp: 1 }], heroes: [] });
const easeIn = u => u * u, easeOut = u => 1 - (1 - u) * (1 - u);

// one die, its face showing n pips (1..3 drawn as the jar's ambient dice do)
function cutDie(k, x, y, n, a = 1) {
  k.rect(x, y, 5, 5, `rgba(244,236,216,${a})`); k.rect(x, y + 5, 5, 1, `rgba(120,100,80,${a})`);
  const pip = `rgba(160,26,26,${a})`, P = [[2, 2], [0, 0, 4, 4], [0, 0, 2, 2, 4, 4], [0, 0, 4, 0, 0, 4, 4, 4]][(n - 1) % 4];
  for (let i = 0; i < P.length; i += 2) k.px(x + P[i], y + P[i + 1], pip);
}

// A world's backdrop for a film, not a fight: its painted sky and land without the round stage, and ground of its own
// where the characters stand (CUT_GROUND). Painted once.
const CUT_LAND = {};
const CUT_GROUND = {
  peaks(k, rand) { // a sea of cloud below, and the snowy ledge they stand on
    k.rect(0, 66, W, 30, k.vgrad(66, 96, ['#c4d4de', '#9fb3c8']));
    for (const [y, n] of [[74, 6], [83, 6], [92, 5], [99, 4]]) for (let i = 0; i < n; i++) k.cloud(rand, rand() * (W + 40) - 20, y + rand() * 3, 40 + rand() * 46, 5 + (y - 66) / 7, ['#8a9eb4', '#c8d8e4', '#ffffff']);
    k.rect(0, 66, W, 34, k.vgrad(66, 100, ['rgba(196,212,222,0.55)', 'rgba(196,212,222,0)'])); // haze lying on the cloud
    const edge = [[-4, 99], [30, 96], [80, 94], [140, 93.4], [200, 95], [260, 98]];
    k.poly([[-4, H + 2], ...edge, [260, H + 2]], k.vgrad(93, H, ['#f4f8fb', '#d6e2ec', '#a6b6c6']));
    k.curve(edge, '#ffffff', 0.6);
    for (const [x, y, r] of [[22, 118, 6], [56, 131, 4], [128, 124, 3], [210, 128, 5], [238, 108, 3]]) { k.oval(x, y, r * 1.4, r * 0.7, '#6a7a8a'); k.oval(x - 0.5, y - r * 0.45, r * 1.2, r * 0.32, '#f0f6fa'); }
    for (let i = 0; i < 30; i++) { const x = rand() * W, y = 100 + rand() * 40; k.line(x, y, x + 4 + rand() * 6, y + 0.3, 'rgba(150,175,200,0.35)', 0.4); } // wind in the snow
  },
  bottom(k, rand) { // the jar's floor: worn clay, bowl-shaped, lighter where the light from the lid falls
    const gr = k.g.createRadialGradient(128, 100, 6, 128, 112, 150);
    gr.addColorStop(0, '#7e563a'); gr.addColorStop(0.35, '#5e3e28'); gr.addColorStop(0.7, '#3a2416'); gr.addColorStop(1, '#1e120a');
    k.oval(128, 116, 160, 44, gr);
    for (let r = 20; r < 150; r += 9 + rand() * 4) k.ring(128, 116, r, 'rgba(40,24,14,0.35)', 0.4, r * 0.27, Math.PI, 2 * Math.PI);
    for (let i = 0; i < 12; i++) { const x = 30 + rand() * 196, y = 96 + rand() * 40; k.line(x, y, x + (rand() - 0.5) * 12, y + rand() * 4, 'rgba(36,20,12,0.5)', 0.4); }
    k.oval(128, 104, 46, 11, 'rgba(255,220,160,0.10)');
    for (const [x, y, f] of JAR_WATCHERS) { k.poly([[x - 3.4, y], [x + 3.4, y], [x + 2.2, y - 7], [x - 2.2, y - 7]], '#120904'); k.circle(x + f, y - 9, 2.3, '#120904'); k.oval(x + f * 3, y - 1, 2.6, 1.4, '#120904'); } // the ones who came before, in the dark at the edge
  },
};
function cutLandscape(id) {
  if (CUT_LAND[id]) return CUT_LAND[id];
  const sc = WORLD_SCENES[id], L = ARENA_LIGHT[id], c = document.createElement('canvas'); c.width = W * ARENA_S; c.height = H * ARENA_S;
  const g = c.getContext('2d'), k = paintKit(g), hz = L ? L.horizon : 64;
  g.setTransform(ARENA_S, 0, 0, ARENA_S, 0, 0);
  k.rect(0, 0, W, H, k.vgrad(hz, H, [sc.ground[1], sc.ground[0]]));
  sc.bake(k, mulberry32(431 + Object.keys(WORLD_SCENES).indexOf(id) * 97));
  if (L) k.rect(0, hz - 16, W, 32, k.vgrad(hz - 16, hz + 16, [rgba(L.haze, 0), rgba(L.haze, 0.3), rgba(L.haze, 0)]));
  if (CUT_GROUND[id]) CUT_GROUND[id](k, mulberry32(7));
  return (CUT_LAND[id] = c);
}
const drawLand = (g, id) => g.drawImage(cutLandscape(id), 0, 0, W, H);

// the jar's floor, its fighters and its light: the setting of both endings
function cutJar(g, k, t, open = 0) {
  drawLand(g, 'bottom');
  k.with(() => { // its ambient, but not the murk it drifts along a stage's dark floor: here the floor is lit
    g.beginPath(); g.rect(-4, -90, W + 8, 206); g.rect(-4, 116, 44, 40); g.rect(216, 116, 44, 40); g.clip();
    WORLD_SCENES.bottom.ambient(paintKit(g), t, cutSim(open));
  });
}

// the hero in the black coat (the last cycle's echo): greyed, in her coat
function cutEcho(g, x, y, opts = {}) {
  cutSprite(g, 'hero', x, y, { ...opts, filter: 'grayscale(1) brightness(0.48)' });
  const s = opts.scale || 2, c = opts.crop || 0, top = y - (11 - c) * s + 5 * s; // the coat: from the shoulders, flaring to the floor
  g.save(); g.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
  g.fillStyle = '#17151b'; g.beginPath(); g.moveTo(x - 3.5 * s, top); g.lineTo(x + 3.5 * s, top); g.lineTo(x + 5 * s, y); g.lineTo(x - 5 * s, y); g.closePath(); g.fill();
  g.fillStyle = '#2a2630'; g.fillRect(x - 3.5 * s, top, 7 * s, 0.5 * s); g.fillRect(x - 0.25 * s, top, 0.5 * s, y - top); // collar, and where it closes
  g.restore();
}

// a clay wall of tallies, in groups of five; `n` groups, the newest at the end
function tallyWall(g, k, n, { hand = '#c6a07a', old = true } = {}) {
  k.rect(0, 0, W, H, k.vgrad(0, H, ['#3e2618', '#553522', '#3a2216']));
  for (let i = 0; i < 400; i++) k.rect((i * 97) % W, (i * 61) % H, 1.2, 0.8, i % 3 ? 'rgba(90,58,36,0.6)' : 'rgba(40,24,14,0.5)'); // grit in the clay
  for (let r = 0; r < 4; r++) k.rect(0, 30 + r * 34, W, 1, '#3a2216'); // the coils of the jar
  if (old) for (let i = 0; i < 60; i++) { const x = 10 + (i % 20) * 12, y = 8 + Math.floor(i / 20) * 46; for (let j = 0; j < 4; j++) k.rect(x + j * 2 + 1, y + 3, 1, 6, '#6a4a34'); k.line(x, y + 10, x + 9, y + 2, '#5a2a1e'); } // older hands, all crossed out
  const at = i => [12 + (i % 19) * 12, 14 + Math.floor(i / 19) * 13];
  for (let i = 0; i < n; i++) { const [x, y] = at(i); for (let j = 0; j < 4; j++) k.rect(x + j * 2, y, 1, 7, hand); k.line(x - 1, y + 6, x + 7, y + 1, hand); }
  return at;
}
const tallyGroups = () => Math.max(12, Math.min(180, Math.floor((state.livesTotal || 0) / 20)));

// ---------- the camera, light and framing the longer scenes share ----------
// A camera on the 256x144 world: (x0, y0) its top-left corner, z a whole-number zoom so the painted backdrops stay
// crisp pixels. Everything drawn inside fn is in world coordinates.
function cam(g, x0, y0, z, fn) { g.save(); g.scale(z, z); g.translate(-x0, -y0); fn(); g.restore(); }
const easeInOut = u => u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
const span = (u, a, b) => clamp01((u - a) / (b - a)); // u's progress through [a, b]
// the edges of the picture close in, so the eye stays on the light
function cutVignette(g, a = 0.55, rgb = '0,0,0', inner = 50) {
  const gr = g.createRadialGradient(128, 70, inner, 128, 70, 165);
  gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(1, `rgba(${rgb},${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
const cutWash = (g, c, a) => { if (a <= 0) return; g.globalAlpha = Math.min(1, a); g.fillStyle = c; g.fillRect(0, 0, W, H); g.globalAlpha = 1; };
// light added over the picture, not painted on it
function cutLight(g, fn) { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); }
// a scene's own clock: it can slow, stop and start again without jumping (snow held in the air, then falling)
function cutClock() {
  const S = { t: 0, prev: 0 };
  return (t, speed) => { const dt = t >= S.prev ? t - S.prev : t; S.prev = t; S.t += dt * speed; return S.t; };
}
// Words typed onto the picture, a letter at a time, with a breath after each pause in the sentence. Laid out whole
// first, so a line never jumps when the next word arrives.
function typeSchedule(text, cps = 19) {
  const at = []; let t = 0;
  for (let i = 0; i < text.length; i++) { at.push(t); const c = text[i], next = text[i + 1]; t += 1 / cps; if (c === '.' && next !== '.') t += 0.5; else if (c === ',') t += 0.25; }
  return { text, at, end: t };
}
function typeText(g, sched, t, { color = '#17110c', alpha = 1, y = 72, size = 7, width = 200 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.font = `italic ${size}px Georgia, "Times New Roman", serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
  const lines = [[]]; let w = 0;
  for (const word of sched.text.split(' ')) {
    const ww = g.measureText(word + ' ').width;
    if (w + ww > width && lines[lines.length - 1].length) { lines.push([]); w = 0; }
    lines[lines.length - 1].push(word); w += ww;
  }
  let shown = sched.at.filter(a => a <= t).length, i = 0;
  g.globalAlpha = alpha; g.fillStyle = color;
  lines.forEach((words, row) => {
    const full = words.join(' '), x = 128 - g.measureText(full).width / 2, ly = y + (row - (lines.length - 1) / 2) * size * 1.6;
    const n = Math.max(0, Math.min(full.length, shown - i)); i += full.length + 1;
    if (n) g.fillText(full.slice(0, n), x, ly);
  });
  g.restore();
}

// ---------- the teacher's last draw: the Myriad Sword Peaks, when he yields ----------
// One place, held still. He says enough; the world waits; one stroke of light, and the sky stays cut along it
// (SKY_SCAR, the same wound the Summit's sky keeps). Nobody moves until it is over (main.js holds the fight).
function teacherBeats() {
  const TX = 92, HX = 170, FY = 110, snow = cutClock();
  const words1 = typeSchedule('So... you are the reincarnation of the Golden Cicada... sigh.');
  const words2 = typeSchedule('When you finally understand the truth, I will see you on the summit.');
  // a near pine and rocks: dark shapes in front of everything, so the peaks fall away behind them
  const framing = (k, shift = 0) => {
    const dark = '#070d18', snowy = 'rgba(214,228,240,0.6)', tx = 5 + shift;
    k.rect(tx - 2.5, -4, 5, H + 8, dark);
    for (let i = 0; i < 9; i++) { // tiers of branches drooping under snow, longer toward the ground
      const y = 2 + i * 14, w = 12 + i * 2.2, sag = 4 + i * 0.4;
      k.poly([[tx - w * 0.6, y + sag * 0.6], [tx, y - 2], [tx + w, y + sag], [tx + w * 0.7, y + sag + 2.4], [tx, y + 3], [tx - w * 0.5, y + sag + 1.6]], dark);
      k.curve([[tx, y - 2], [tx + w * 0.5, y + sag * 0.3], [tx + w, y + sag]], snowy, 0.7);
    }
    k.poly([[-4, H], [-4, 117], [8, 111], [19, 114], [31, 121], [42, H]], dark); k.line(8, 111, 19, 114, snowy, 0.7);
    k.poly([[W + 4, H], [W + 4, 120], [244, 116], [232, 124], [222, H]], dark); k.line(244, 116, 232, 124, snowy, 0.6);
  };
  // the sword held point-down at his side; a glint can run along it
  const lowSword = (k, glint = -1) => {
    k.line(TX + 6, FY - 16, TX + 9, FY - 2, '#dfe9f5', 0.7); k.rect(TX + 5, FY - 17, 3, 1, '#c9a65a');
    if (glint >= 0 && glint <= 1) { const x = TX + 6 + glint * 3, y = FY - 16 + glint * 14; k.glow(x, y, 4, '#ffffff', 0.9); k.px(x, y, '#ffffff'); }
  };
  // the cut: a lens of light along the scar, `w` its half-width at the middle, `open` how far from his side it reaches
  const skyCut = (g, k, w, open = 1, glow = 1) => {
    const x1 = -4 + 264 * open, mid = Math.min(x1, 128);
    k.with(() => {
      g.beginPath(); g.rect(-4, -4, x1 + 4, 60); g.clip();
      g.beginPath(); g.moveTo(-4, 30.7); g.quadraticCurveTo(128, 16.2 - w, 260, 5.6); g.lineTo(260, 9.6); g.quadraticCurveTo(128, 22.2 + w, -4, 32.7); g.closePath();
      g.fillStyle = 'rgba(4,10,24,0.45)'; g.fill(); // a dark edge, so the light reads against a pale sky
      g.shadowColor = '#9fd8ff'; g.shadowBlur = 12 * ARENA_S * glow;
      g.beginPath(); g.moveTo(-4, 31.7); g.quadraticCurveTo(128, 19.2 - w, 260, 7.6); g.quadraticCurveTo(128, 19.2 + w, -4, 31.7); g.closePath();
      g.fillStyle = '#e8f6ff'; g.fill();
      g.shadowBlur = 0; g.beginPath(); g.moveTo(-4, 31.7); g.quadraticCurveTo(128, 19.2, 260, 7.6); g.lineWidth = 0.5; g.strokeStyle = '#ffffff'; g.stroke();
    });
    if (open < 1) k.glow(x1, SKY_SCAR(x1), 8, '#ffffff', 1);
    return mid;
  };
  // the whole place; o: { z, x0, y0, t, snowT, dim, teacher (alpha), turned, glint, cut, cutOpen, shift }
  const scene = (g, k, o) => {
    k.rect(0, 0, W, H, '#000');
    cam(g, o.x0 || 0, o.y0 || 0, o.z || 1, () => {
      drawLand(g, 'peaks');
      WORLD_SCENES.peaks.ambient(paintKit(g), o.snowT);
      k.glow(TX, FY - 22, 22, '#cfe8ff', 0.18 * (o.teacher == null ? 1 : o.teacher)); // the cold light he stands in
      const ta = o.teacher == null ? 1 : o.teacher;
      k.oval(TX, FY, 9, 1.6, `rgba(10,20,40,${0.35 * ta})`); k.oval(HX, FY, 8, 1.6, 'rgba(10,20,40,0.35)');
      if (ta > 0) { cutSprite(g, 'b_swordsaint', TX, FY, { alpha: ta, flip: !!o.turned }); if (!o.turned && ta >= 1) lowSword(k, o.glint); }
      cutSprite(g, 'hero', HX, FY, { flip: true });
    });
    cutWash(g, '#0a1426', o.dim || 0);
    if (o.cut) skyCut(g, k, o.cut, o.cutOpen == null ? 1 : o.cutOpen, o.cutGlow || 1); // over the dark: the one bright thing
    if ((o.z || 1) === 1) framing(k, o.shift || 0);
    cutVignette(g, 0.5, '6,10,22');
  };
  // falling sparks of the cut, drifting down from the line
  const embers = (k, t, a) => { for (let i = 0; i < 36; i++) { const x = (i * 37.3) % W, age = t - i * 0.06; if (age < 0) continue; const y = SKY_SCAR(x) + age * (5 + (i % 5) * 2), f = Math.max(0, 1 - age / 3) * a; if (f > 0) k.px(x + Math.sin(age * 2 + i) * 2, y, `rgba(232,246,255,${f})`); } };
  const white = '#fbf8f2';
  return [
    { dur: 2.8, line: '', sound: 'wind', noFadeOut: true, // the fight is over: wide, still, the snow slowing
      draw(g, k, t, u) { scene(g, k, { snowT: snow(t, 1 - u * 0.55), dim: u * 0.12, shift: -u * 2 }); } },
    { dur: 3.8, line: '“Enough.”', noFade: true, // closer: him, in his own cold light
      draw(g, k, t, u) {
        scene(g, k, { z: 2, x0: 40, y0: 52, snowT: snow(t, 0.45 - u * 0.3), dim: 0.12 + u * 0.08 });
        if (u > 0.08) cutOnce('word', () => sfx.play('gong'));
      } },
    { dur: 2.6, line: '', noFade: true, // the pause: the snow stops in the air, the light drains toward his blade
      draw(g, k, t, u) {
        const v = easeIn(u);
        scene(g, k, { snowT: snow(t, Math.max(0, 0.15 * (1 - u * 3))), dim: 0.2 + v * 0.38, glint: span(u, 0.55, 0.9) || -1, shift: -2 });
        cutLight(g, () => k.glow(TX + 7, FY - 9, 10 + v * 10, '#cfe8ff', 0.2 + v * 0.35));
        if (u > 0.55) cutOnce('ring', () => sfx.play('ring'));
      } },
    { dur: 1.1, line: '', noFade: true, // the draw: one stroke of light across the whole sky
      draw(g, k, t, u) {
        cutOnce('slash', () => { sfx.play('slash'); sfx.play('ultboom'); });
        const open = easeOut(Math.min(1, t / 0.14));
        scene(g, k, { snowT: snow(t, 0), dim: 0.58 - u * 0.08, turned: true, cut: 0.5, cutOpen: open, cutGlow: 2, shift: -2 });
        cutWash(g, '#ffffff', t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.75));
      } },
    { dur: 4.8, line: '', noFade: true, // the line stays: time to see it, then the snow falls again
      draw(g, k, t, u) {
        const go = span(t, 1.6, 3.2);
        scene(g, k, { snowT: snow(t, go * 0.6), turned: true, dim: 0.5 - easeInOut(span(t, 1.2, 4.6)) * 0.3, cut: 0.5 + easeOut(span(t, 0, 2.4)) * 1.3, cutGlow: 1.4, shift: -2 });
        cutLight(g, () => embers(k, t - 1.4, 1));
        if (go > 0) cutOnce('wind', () => sfx.play('wind'));
      } },
    { dur: 3.4, line: '', sound: 'riser', noFade: true, // the light of it fills everything
      draw(g, k, t, u) {
        scene(g, k, { snowT: snow(t, 0.6), turned: true, dim: 0.2 * (1 - u), cut: 1.8 + u * 2, cutGlow: 1.4 + u * 2, shift: -2 });
        cutLight(g, () => embers(k, t + 3.4, 1 - u));
        cutWash(g, white, easeIn(u));
      } },
    { dur: words1.end + 3.0 + 1.0, line: '', noFade: true, // on the white, his voice, a letter at a time; then silence
      draw(g, k, t) {
        k.rect(0, 0, W, H, white);
        typeText(g, words1, t - 0.4, { alpha: 1 - span(t, words1.end + 3.0, words1.end + 3.9) });
      } },
    { dur: 0.8 + words2.end + 4.0, line: '', noFade: true,
      draw(g, k, t) { k.rect(0, 0, W, H, white); typeText(g, words2, t - 0.8); } },
    { dur: 2.8, line: '', noFade: true, sound: 'chime', // the white gives the Peaks back: he is gone, the sky stays cut
      draw(g, k, t, u) {
        scene(g, k, { snowT: snow(t, 1), teacher: 0, cut: 3.8, cutGlow: 1.6 });
        cutLight(g, () => { for (let i = 0; i < 14; i++) { const v = ((t * 0.35 + i / 14) % 1), x = TX + Math.sin(i * 2.1 + t) * 4 * (1 + v * 3), y = FY - 6 - v * 60; k.px(x, y, `rgba(200,232,255,${(1 - v) * (1 - u * 0.5)})`); } });
        cutWash(g, white, 1 - easeOut(span(u, 0, 0.75)));
        typeText(g, words2, 99, { alpha: 1 - span(u, 0, 0.25) });
      } },
  ];
}

// ---------- the bottom of the jar: the stage both endings share ----------
const YX = 98, HX0 = 160, FLOOR = 110, DIE = [130, 104]; // where she kneels, where you stand, where the die comes to rest
// Above the backdrop's top edge (for the camera to look up into): the jar's shoulder closing to its mouth, and the
// lid on it. gap: how far the lid has slid (0 shut, ~0.15 loose); lift: how far it has risen (0..1, gone).
function jarMouth(g, k, t, gap = 0.15, lift = 0) {
  k.rect(-4, -90, W + 8, 92, k.vgrad(-90, 2, ['#040201', '#0b0603', '#140b06']));
  for (let i = 0; i < 4; i++) k.curve([[0, -6 - i * 18], [128, -20 - i * 20], [256, -6 - i * 18]], 'rgba(96,62,38,0.28)', 0.6);
  k.poly([[-4, -90], [70, -90], [104, 4], [-4, 40]], 'rgba(0,0,0,0.45)'); k.poly([[W + 4, -90], [186, -90], [152, 4], [W + 4, 40]], 'rgba(0,0,0,0.45)');
  // the mouth: light behind wherever the lid does not cover it
  const open = Math.max(gap, lift);
  cutLight(g, () => { k.glow(128, 0, 34 + open * 60, '#fff0c8', 0.35 + open * 0.6, 12 + open * 20); });
  k.oval(128, 0, 21, 5.4, '#3a2416'); k.oval(128, 0, 18, 4.2, '#fff4d4'); k.oval(128, -0.3, 13, 2.8, '#ffffff');
  if (lift < 1) { // the lid: slid aside, a crescent of daylight along its edge, or lifting away
    const lx = 128 + gap * 40 + lift * 10, ly = -0.6 - easeIn(lift) * 70, r = 21 + lift * 8;
    cutLight(g, () => k.oval(lx - r + 1, 0.6, 3 + gap * 20, 4.4, `rgba(255,250,228,${0.5 + gap * 2})`));
    k.oval(lx, ly + 1.2, r, 5.4 + lift * 2, '#140b06'); k.oval(lx, ly, r, 5.2 + lift * 2, '#2e1c10'); k.oval(lx - 2, ly - 1, r * 0.8, 2.6 + lift, '#3e2818');
  }
  for (let i = 0; i < 15; i++) { // the fifteen talismans' burnt stubs, dark against the light, an ember on a few
    const x = 113 + i * 2.1, len = 2.5 + (i * 7) % 5, sw = Math.sin(t * 0.8 + i) * 0.3, ly = -easeIn(lift) * 70;
    k.rect(x + sw, 5 + ly, 1, len + 1.6, '#160c06');
    if ((i * 5) % 3 === 0 && Math.sin(t * 3 + i) > 0.3) k.px(x + sw, 5 + ly + len + 1, '#e8703a');
  }
  // dust shaken from the rim, falling through the gap's light
  for (let i = 0; i < 10; i++) { const v = (t * 0.22 + i / 10) % 1, x = 108 + (i * 13) % 26 + Math.sin(t + i) * 1.5; k.px(x, 3 + v * 40, `rgba(255,232,190,${(1 - v) * 0.7 * Math.min(1, open * 6)})`); }
}
// rays of the mouth's light, falling to the floor; w: how wide they spread, a: how strong
function jarRays(g, k, t, w = 1, a = 1) {
  cutLight(g, () => {
    k.poly([[128 - 14 * w, 2], [128 + 14 * w, 2], [128 + 46 * w, 92], [128 - 46 * w, 92]], k.vgrad(0, 92, [`rgba(255,236,190,${0.16 * a})`, `rgba(255,226,170,${0.04 * a})`]));
    for (let i = 0; i < 5; i++) { // thin beams, each breathing on its own
      const x = 128 + (i - 2) * 7 * w, sp = (i - 2) * 9 * w, b = (0.05 + 0.04 * Math.sin(t * 0.9 + i * 1.7)) * a;
      k.poly([[x - 1.6, 4], [x + 1.6, 4], [x + sp + 4, 96], [x + sp - 4, 96]], k.vgrad(4, 96, ['rgba(255,240,205,0)', `rgba(255,240,205,${b})`, `rgba(255,240,205,${b * 0.6})`, 'rgba(255,240,205,0)']));
    }
    k.oval(128, 104, 34 * w + 10, 9, `rgba(255,214,150,${0.09 * a})`); // where it lands on the clay
  });
}
// burnt talismans hanging into the top of the picture, the nearest things to the eye
function jarFraming(k, t, a = 1) {
  for (const [x, len, ph] of [[8, 22, 0], [20, 13, 1.2], [34, 18, 2.1], [226, 16, 0.6], [240, 25, 1.7], [250, 12, 2.6]]) {
    const sw = Math.sin(t * 0.7 + ph) * 1.2;
    k.poly([[x - 2.2, -2], [x + 2.2, -2], [x + 2 + sw, len], [x - 2 + sw, len + 1.4]], `rgba(10,6,4,${a})`);
    if (Math.sin(t * 2.3 + ph * 5) > 0.6) k.px(x + sw, len, `rgba(232,112,58,${0.8 * a})`); // an ember still in the char
  }
  k.poly([[-4, H + 2], [-4, 134], [40, 129], [90, 138], [120, H + 2]], `rgba(6,3,2,${0.85 * a})`); // the near edge of the floor
  k.poly([[W + 4, H + 2], [W + 4, 131], [210, 133], [170, H + 2]], `rgba(6,3,2,${0.85 * a})`);
}
// her, or the one in her coat; drop lowers the head, rise lifts from a kneel to standing
function jarHer(g, echo, { x = YX, drop = 0, crop = 3, alpha = 1, filter } = {}) {
  if (echo) cutEcho(g, x, FLOOR + drop, { crop, alpha, filter: filter || 'grayscale(1) brightness(0.48)' });
  else cutSprite(g, 'b_yunxi', x, FLOOR - 2 + drop, { crop, alpha, filter: filter || 'none' });
}
// you: the sword lowered at your side, and the page, if you carry it
function jarYou(g, k, t, { x = HX0, walk = false, crop = 0, sword = true, page = false, filter = 'none', alpha = 1 } = {}) {
  k.oval(x, FLOOR, 8, 1.6, 'rgba(0,0,0,0.35)');
  cutSprite(g, walk && Math.floor(t * 7) % 2 ? 'hero_walk' : 'hero', x, FLOOR + crop * 2, { flip: true, crop, filter, alpha });
  if (sword) { k.line(x - 6, FLOOR - 9 + crop * 2, x - 12, FLOOR - 1, '#dfe9f5', 0.7); k.rect(x - 7, FLOOR - 10 + crop * 2, 2, 1, '#c9a65a'); }
  if (page) { k.rect(x + 5, FLOOR - 11 + crop * 2, 3, 4, '#f4f0e0'); cutLight(g, () => k.glow(x + 6.5, FLOOR - 9 + crop * 2, 7, '#ffd88a', 0.35 + 0.2 * Math.sin(t * 2.2))); }
}
// the floor of the jar with its light; o: { z, x0, y0, gap, lift, rays, raysA, framing }
function jarScene(g, k, t, o, actors) {
  k.rect(0, 0, W, H, '#000');
  cam(g, o.x0 || 0, o.y0 || 0, o.z || 1, () => {
    cutJar(g, k, t, o.lift || 0);
    jarMouth(g, k, t, o.gap == null ? 0.15 : o.gap, o.lift || 0);
    jarRays(g, k, t, o.rays || 1, o.raysA == null ? 1 : o.raysA);
    actors();
  });
  if (o.framing !== false && (o.z || 1) === 1) jarFraming(k, t);
  cutVignette(g, 0.6, '8,4,2', 40);
}
// the die rolling out of her hand to your feet; u: 0..1
function dieRoll(k, u) {
  const v = Math.min(1, u / 0.6), x = 106 + v * (DIE[0] - 106), y = DIE[1] - Math.abs(Math.sin(v * Math.PI * 2)) * (1 - v) * 9;
  cutDie(k, x, y, v < 1 ? 1 + Math.floor(u * 24) % 4 : 1);
  return v;
}

// ---------- after the last fight: her last words, and the choice ----------
function finaleBeats(echo, page) {
  return [
    { dur: 5.4, line: echo ? 'The one in her coat kneels. It is wearing your face.' : '“Then this time it’s you.”', sound: 'chime',
      draw(g, k, t, u) { // wide: the fight is over; she goes down onto one knee in the jar's light
        const kneel = span(u, 0.1, 0.32);
        jarScene(g, k, t, {}, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)');
          jarHer(g, echo, { crop: Math.round(kneel * 3), drop: 0 });
          jarYou(g, k, t);
        });
        if (kneel >= 1) cutOnce('knee', () => sfx.play('thud'));
      } },
    { dur: 3.8, line: '', noFadeOut: true,
      draw(g, k, t, u) { // close on the clay: the die leaves her hand and comes to rest at your feet
        jarScene(g, k, t, { z: 3, x0: 96, y0: 72 }, () => {
          k.oval(DIE[0] + 2, DIE[1] + 6, 14, 3, 'rgba(255,214,150,0.12)');
          jarHer(g, echo); jarYou(g, k, t);
          const v = dieRoll(k, span(u, 0.08, 0.92));
          if (v >= 0.5) cutOnce('b1', () => sfx.play('pop'));
          if (v >= 1) cutOnce('b2', () => sfx.play('pop'));
        });
      } },
    { dur: 6, line: echo ? '“Then this time it’s you. I’m sorry.”' : '“I’m sorry. I lost the bet again.”', noFadeIn: true, noFadeOut: true,
      draw(g, k, t, u) { // the two of you, nearer: her head goes down
        const drop = Math.round(easeInOut(span(u, 0.35, 0.7)) * 2);
        jarScene(g, k, t, { z: 2, x0: 66, y0: 54 }, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)');
          jarHer(g, echo, { drop }); cutDie(k, DIE[0], DIE[1], 1); jarYou(g, k, t, { page });
        });
      } },
    { dur: 4.4, line: '', noFadeIn: true,
      draw(g, k, t, u) { // and up, to the lid: it has come loose
        const v = easeInOut(span(u, 0, 0.75));
        jarScene(g, k, t, { z: 2, x0: 66 - v * 2, y0: 54 - v * 82 }, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)');
          jarHer(g, echo, { drop: 2 }); cutDie(k, DIE[0], DIE[1], 1); jarYou(g, k, t, { page });
        });
        if (u > 0.6) cutOnce('creak', () => sfx.play('rock'));
      } },
    { choices: [['Open the door', () => playCutscene(doorBeats(echo), afterDoor), true], ...(page ? [['Sheathe the sword', () => { endCutscene(); chooseStay(); }]] : []), ['Not yet', () => endCutscene()]],
      line: page ? 'Above you, the lid is loose. In your hand, the Fourteenth Page.' : 'Above you, the lid is loose.',
      draw(g, k, t) { // the choice, held: the two of you under the loose lid
        jarScene(g, k, t, { gap: 0.15 + Math.sin(t * 0.8) * 0.02, raysA: 1 + Math.sin(t * 1.3) * 0.15 }, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)');
          jarHer(g, echo, { drop: Math.sin(t * 1.4) > 0.2 ? 2 : 1 }); cutDie(k, DIE[0], DIE[1], 1); jarYou(g, k, t, { page });
        });
        cutLight(g, () => k.rect(110, 4, 36, 1, `rgba(255,250,224,${0.25 + 0.2 * Math.sin(t * 2)})`));
      } },
  ];
}

// The sea outside the jar is a sea of stars: a river of nebula across the dark, and the same sky lying on the water
// below the horizon. Painted once at the picture's own size (one canvas pixel to a picture pixel), so the gas and
// dust stay in coarse pixels when it is drawn four times larger.
let SEA_BG = null;
const SEA_HZ = 74;
function seaBackdrop() {
  if (SEA_BG) return SEA_BG;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), k = cutKit(g), rand = mulberry32(31);
  k.rect(0, 0, W, H, k.vgrad(0, SEA_HZ, ['#04030e', '#0a0a26', '#121a46', '#1a2a5a']));
  const band = x => 10 + x * 0.16 + Math.sin(x / 38) * 7; // the river's middle, falling from upper left to the horizon
  for (let i = 0; i < 620; i++) { // the gas: violet into blue into sea-green along its length
    const x = rand() * (W + 20) - 10, off = (rand() - 0.5) * (22 + rand() * 18), y = band(x) + off, r = 1.5 + rand() * 5.5, edge = Math.min(1, Math.abs(off) / 22);
    const cols = x < 80 ? ['#3a2a8a', '#5a2a90', '#7a3aa0'] : x < 170 ? ['#2a3aa0', '#3a58b8', '#5a3a9a'] : ['#1e6a80', '#2a8e90', '#5ab8b4'];
    k.circle(x, y, r, rgba(cols[i % 3], 0.2 * (1 - edge * 0.7)));
  }
  for (let i = 0; i < 180; i++) { const x = 60 + rand() * 200, y = band(x) + (rand() - 0.5) * 9; k.circle(x, y, 0.6 + rand() * 1.4, rgba(x > 170 ? '#a8f0e4' : '#b8c8ff', 0.18 + rand() * 0.2)); } // its bright heart
  for (let i = 0; i < 120; i++) { const x = rand() * W, side = rand() < 0.5 ? -1 : 1, y = band(x) + side * (10 + rand() * 12), r = 0.8 + rand() * rand() * 4; k.circle(x, y, r, 'rgba(4,3,14,0.92)'); } // dark dust eating its edges
  k.with(() => { // a small gold galaxy, far off, turned on its side
    g.translate(42, 40); g.rotate(-0.35);
    for (let j = 6; j >= 0; j--) k.ring(0, 0, 2 + j * 1.9, rgba(j > 3 ? '#c8803a' : '#ffd88a', 0.35 + (6 - j) * 0.08), 0.7, (2 + j * 1.9) * 0.36);
    k.oval(0, 0, 2.4, 1.1, '#fff0c0');
  });
  for (const [x, y, r] of [[214, 18, 6], [174, 56, 3], [20, 64, 2]]) { k.circle(x, y, r, '#030208'); k.ring(x, y, r, 'rgba(110,130,220,0.5)', 0.5, r, -2.4, -0.6); } // dark worlds against the light
  for (let i = 0; i < 260; i++) k.rect(Math.floor(rand() * W), Math.floor(rand() * (SEA_HZ - 2)), 1, 1, rgba(['#c8d4ff', '#ffffff', '#8a9ad8', '#ffe8c0'][i % 4], 0.35 + rand() * 0.6));
  SEA_BG = c; return c;
}
// the far lights, become stars sitting on the horizon: [x, y, size, colour]
const SEA_LIGHTS = [[14, 72.6, 1.0, '#cfe0ff'], [47, 71.2, 0.6, '#ffd8a0'], [61, 72, 0.5, '#e8f0ff'], [96, 72.6, 0.9, '#a8f0e4'], [171, 73, 1.4, '#ffe0b0'], [207, 71.2, 0.55, '#e8f0ff'], [236, 72.2, 1.0, '#ffd8a0']];
// a star with points, its light added to the picture
function sparkle(g, k, x, y, s, c, a = 1) {
  cutLight(g, () => {
    k.glow(x, y, s * 2.4, c, 0.5 * a);
    k.line(x - s * 2.6, y, x + s * 2.6, y, rgba(c, 0.85 * a), 0.35); k.line(x, y - s * 2.6, x, y + s * 2.6, rgba(c, 0.85 * a), 0.35);
    k.line(x - s, y - s, x + s, y + s, rgba(c, 0.4 * a), 0.25); k.line(x - s, y + s, x + s, y - s, rgba(c, 0.4 * a), 0.25);
  });
  k.circle(x, y, 0.45, '#ffffff');
}
function seaScene(g, k, t, { haloA = 1 } = {}) {
  const bg = seaBackdrop();
  g.imageSmoothingEnabled = false;
  g.drawImage(bg, 0, 0, W, SEA_HZ, 0, 0, W, SEA_HZ);
  for (let y = SEA_HZ; y < H; y++) { // the water: the same sky upside down, broken into moving rows, wider apart nearer
    const d = y - SEA_HZ, sy = Math.max(0, Math.floor(SEA_HZ - 1 - d * 0.85)), dx = Math.round(Math.sin(t * 1.1 + d * 0.55) * (0.4 + d * 0.05));
    g.drawImage(bg, 0, sy, W, 1, dx, y, W, 1);
  }
  k.rect(0, SEA_HZ, W, H - SEA_HZ, k.vgrad(SEA_HZ, H, ['rgba(3,3,14,0.25)', 'rgba(3,3,14,0.45)', 'rgba(3,3,14,0.7)']));
  cutLight(g, () => k.rect(0, SEA_HZ - 0.6, W, 1.2, 'rgba(150,180,255,0.18)')); // the horizon, where the sky meets itself
  for (let i = 0; i < 26; i++) { const x = ((i * 41 + t * (1.5 + i % 3)) % (W + 30)) - 15, y = 78 + (i * 13) % 62; k.rect(x, y, 6 + (i % 4) * 3, 0.5, 'rgba(160,190,255,0.12)'); } // the swell
  for (let i = 0; i < 12; i++) { const x = (i * 67 + 13) % W, y = (i * 29) % (SEA_HZ - 10) + 3, a = Math.max(0, Math.sin(t * (0.8 + i % 3 * 0.3) + i * 2)); if (a > 0.5) sparkle(g, k, x, y, 0.7, '#e8f0ff', (a - 0.5) * 2 * haloA); }
  for (const [x, ly, r, c] of SEA_LIGHTS) {
    const tw = 0.75 + 0.25 * Math.sin(t * 1.7 + x);
    sparkle(g, k, x, ly, r * 1.3, c, tw * haloA);
    const y0 = SEA_HZ + 1, len = 30 * r; // and its reflection, wavering
    for (let y = y0; y < y0 + len; y += 1.5) { const f = 1 - (y - y0) / len, w = f * 1.4 * r + 0.3, dx = Math.sin(t * 1.6 + y * 0.7 + x) * (1.4 - f); k.rect(x - w / 2 + dx, y, w, 0.5, rgba(c, 0.32 * f * tw)); }
  }
}
// the jar seen from outside, `s` times its size on the water, its mouth at (x, y); open: its light pouring up
function seaJar(g, k, t, x, y, s, open = 1) {
  const body = (yy, c) => { k.oval(x, yy + 9 * s, 9 * s, 7.5 * s, c); k.rect(x - 4 * s, yy + 0.8 * s, 8 * s, 3 * s, c); k.oval(x, yy + 0.8 * s, 5 * s, 1.4 * s, c); };
  k.with(() => { g.globalAlpha = 0.35; g.translate(0, 2 * (y + 16.5 * s)); g.scale(1, -1); body(y, '#1a120c'); }); // its reflection
  body(y, '#4e3422'); k.oval(x - 3 * s, y + 8 * s, 4.5 * s, 5 * s, 'rgba(120,86,56,0.35)'); // lit a little from inside the dark
  for (let i = 0; i < 3; i++) k.ring(x, y + (6 + i * 3.4) * s, 8.6 * s, 'rgba(30,18,10,0.6)', 0.35 * s, 1.1 * s, 0, Math.PI);
  k.oval(x, y + 0.8 * s, 4.2 * s, 1.1 * s, '#fff0c8');
  cutLight(g, () => { k.poly([[x - 4 * s, y + 0.8 * s], [x + 4 * s, y + 0.8 * s], [x + 9 * s, y - 40 * s], [x - 9 * s, y - 40 * s]], k.vgrad(y - 40 * s, y, ['rgba(255,236,190,0)', `rgba(255,236,190,${0.22 * open})`])); k.glow(x, y, 8 * s, '#fff0c8', 0.5 * open); });
}
// the core: a green light and the thread it climbs
function seaCore(g, k, x0, y0, x, y, a = 1) {
  cutLight(g, () => { k.line(x0, y0, x, y, `rgba(160,240,200,${0.3 * a})`, 0.5); k.glow(x, y, 9, '#7fe0a8', 0.6 * a); });
  k.circle(x, y, 1.2, '#cfffe0'); k.px(x, y, '#ffffff');
}
// The hand: vast, open, fingers hanging down out of the dark; drawn twice, a faint rim of light and then the black.
// top: the fingertips' height; curl: a slight bend of the fingers
const HAND_FINGERS = [[66, 42, 22, -5], [104, 52, 25, -1.5], [152, 50, 24, 2], [193, 38, 20, 5]]; // [x, length, width, lean]: a gap at the middle for the core
function seaHand(g, k, top, curl = 0) {
  const shape = (dx, dy, c) => {
    const T = top + dy;
    k.poly([[-40 + dx, -140], [296 + dx, -140], [300 + dx, T - 26], [232 + dx, T - 3], [128 + dx, T + 1], [40 + dx, T - 1], [-40 + dx, T - 18]], c); // the palm
    for (const [fx, len, w, lean] of HAND_FINGERS) {
      const x = fx + dx, L = len + curl * len / 50, tx = x + lean, ty = T + L - w * 0.42;
      k.poly([[x - w / 2, T - 6], [x + w / 2, T - 6], [tx + w * 0.42, ty], [tx - w * 0.42, ty]], c);
      k.oval(tx, ty, w * 0.42, w * 0.42, c); // the fingertip
    }
    k.poly([[214 + dx, T - 16], [246 + dx, T - 24], [254 + dx, T + 4], [240 + dx, T + 24], [222 + dx, T + 16]], c); k.oval(231 + dx, T + 21, 8, 6, c); // the thumb, curling in under the palm
  };
  shape(0, 1.4, '#3a3478'); shape(0.6, 0.6, '#16142e'); shape(0, 0, k.vgrad(top - 60, top + 54, ['#010103', '#040410', '#0e0c22'])); // dark, rimmed with the nebula's violet light
  for (const [fx, len, w, lean] of HAND_FINGERS) for (const f of [0.34, 0.66]) { const y = top + len * f, x = fx + lean * f; k.line(x - w * 0.3, y, x + w * 0.3, y + 0.4, 'rgba(70,62,130,0.55)', 0.4); } // the joints
}
// its reflection on the water: a long darkness where the lights' reflections would be
function seaHandShadow(g, k, top) {
  k.with(() => { g.globalAlpha = 0.55; g.translate(0, 74 * 1.45); g.scale(1, -0.45); k.poly([[-30, -60], [286, -60], [276, top + 30], [200, top + 44], [60, top + 40], [-36, top + 20]], '#000'); });
}

// Ending one, the Door: the lid lifts, the core rises out of the jar into a hand held open, and the face becomes a clock.
function doorBeats(echo) {
  return [
    { dur: 6.4, line: 'The lid lifts. Light pours in.', sound: 'riser', noFadeIn: true,
      draw(g, k, t, u) { // you step under the mouth; the lid grinds aside and lifts away; the light comes down on you both
        const walk = span(u, 0, 0.32), lift = easeIn(span(u, 0.34, 0.8)), x = HX0 - easeInOut(walk) * (HX0 - 128);
        jarScene(g, k, t, { gap: 0.15 + lift * 0.4, lift, rays: 1 + lift * 1.6, raysA: 1 + lift * 2.4 }, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)');
          jarHer(g, echo, { drop: Math.round(2 - span(u, 0.45, 0.6) * 2) }); cutDie(k, DIE[0], DIE[1], 1);
          jarYou(g, k, t, { x, walk: walk > 0 && walk < 1 });
          k.poly([[YX - 3, FLOOR], [YX + 3, FLOOR], [YX - 8 - lift * 10, FLOOR + 6 + lift * 6], [YX - 16 - lift * 10, FLOOR + 6 + lift * 6]], `rgba(0,0,0,${0.18 + lift * 0.2})`); // shadows thrown long by the light
        });
        if (u > 0.34) cutOnce('grind', () => sfx.play('rock'));
        cutWash(g, '#fff6e0', easeIn(span(u, 0.72, 1)) * 0.92);
      } },
    { dur: 5.8, line: 'The core rises from your chest.', sound: 'chime', noFadeIn: true,
      draw(g, k, t, u) { // close on you in the full light; the core climbs out of you and the camera follows it up
        const rise = easeInOut(span(u, 0.25, 1)), cy = 97 - rise * 116, look = easeInOut(span(u, 0.35, 1));
        jarScene(g, k, t, { z: 2, x0: 64, y0: 52 - look * 100, lift: 1, rays: 2.6, raysA: 3.2 }, () => {
          jarHer(g, echo, { drop: 0 });
          jarYou(g, k, t, { x: 128, sword: true, filter: `grayscale(${span(u, 0.1, 0.6)}) brightness(${1 - span(u, 0.1, 0.6) * 0.35})` });
          cutLight(g, () => { k.glow(128, cy, 10 + 6 * Math.sin(t * 5), '#7fe0a8', 0.55); k.line(128, 97, 128, cy, 'rgba(160,240,200,0.35)', 0.5); });
          for (let i = 1; i < 8; i++) k.px(128 + Math.sin(t * 6 + i) * 1.4, cy + i * 2.5, `rgba(200,255,220,${0.6 - i * 0.07})`);
          k.circle(128, cy, 2.2, '#7fe0a8'); k.circle(128, cy, 1.3, '#cfffe0'); k.px(127.5, cy - 0.5, '#ffffff');
        });
        cutWash(g, '#fff6e0', Math.max(1 - span(t, 0, 0.9), easeIn(span(u, 0.86, 1)) * 0.8) * 0.92);
      } },
    { dur: 7, line: 'Beyond the rim: black water, far lights,', sound: 'wind', noFadeOut: true,
      draw(g, k, t, u) { // outside: the rim fills the picture, then the jar falls away to a speck on the sea
        const v = easeOut(span(u, 0, 0.85)), s = 7 - v * 6.2, y = 108 + v * 5;
        seaScene(g, k, t);
        seaJar(g, k, t, 128, y, s);
        seaCore(g, k, 128, y, 128, y - 4 - (1 - v) * 40);
        cutVignette(g, 0.55, '0,0,0', 40);
      } },
    { dur: 9.5, line: 'and a hand held open.', sound: 'gong', noFadeIn: true,
      draw(g, k, t, u) { // the same sea, and over it, coming down out of the dark where the stars were, a hand
        const top = -44 + easeOut(span(u, 0, 0.7)) * 62 + Math.sin(t * 0.5) * 0.6, jy = 113;
        seaScene(g, k, t, { haloA: 1 - span(u, 0.6, 1) * 0.4 });
        seaHandShadow(g, k, top);
        seaJar(g, k, t, 128, jy, 0.8);
        const cv = easeInOut(span(u, 0.2, 0.92)), cy = jy - 4 - cv * (jy - 4 - (top - 8));
        seaHand(g, k, top, Math.sin(t * 0.45) * 1.2);
        cutLight(g, () => { // the core's light, caught by the underside of the fingers as it comes near
          const near = span(u, 0.55, 0.95);
          k.glow(128, top - 10, 30 + near * 40, '#7fe0a8', near * 0.35, 14 + near * 10);
        });
        seaCore(g, k, 128, jy, 128, cy, 1);
        if (cv >= 1) cutOnce('touch', () => sfx.play('chime'));
        cutVignette(g, 0.6, '0,0,0', 30);
      } },
    { dur: 4.5, line: 'Your face flickers. For an instant, the hands of a clock move where your eyes were.',
      draw(g, k, t, u) {
        k.rect(0, 0, W, H, '#120a06'); k.poly([[100, 0], [156, 0], [190, H], [66, H]], 'rgba(255,236,190,0.06)');
        const gl = u > 0.35 && u < 0.92, jx = gl && Math.random() < 0.3 ? Math.round((Math.random() - 0.5) * 6) : 0;
        if (u > 0.35) cutOnce('glass', () => sfx.play('glass'));
        k.rect(84 + jx, 104, 88, 40, '#e8e4d8'); k.rect(84 + jx, 104, 88, 3, '#c8c0b0'); k.rect(116 + jx, 92, 24, 14, '#d8a47a'); // shoulders, neck
        k.rect(100 + jx, 46, 56, 50, '#e8b48a'); k.rect(100 + jx, 46, 4, 50, '#c8946a'); k.rect(104 + jx, 92, 48, 4, '#c8946a'); // the face
        k.rect(96 + jx, 18, 64, 26, '#141012'); k.rect(100 + jx, 14, 56, 4, '#141012'); k.rect(96 + jx, 44, 6, 22, '#141012'); k.rect(154 + jx, 44, 6, 22, '#141012'); // hair
        k.rect(96 + jx, 38, 64, 7, '#b8322a'); k.rect(160 + jx, 40, 10, 3, '#b8322a'); k.rect(162 + jx, 43, 6, 6, '#9a2a22'); // the headband
        k.rect(124 + jx, 82, 10, 2, '#8a4a3a'); k.rect(127 + jx, 64, 3, 10, '#d8a47a');
        const clock = gl && (u > 0.5 || Math.random() < 0.4);
        for (const ex of [114, 138]) {
          if (!clock) { k.rect(ex + jx, 58, 8, 5, '#141012'); k.px(ex + 5 + jx, 59, '#ffffff'); continue; }
          const cx = ex + 4 + jx, cy = 60; k.disc(cx, cy, 7, '#2a2016'); k.disc(cx, cy, 6, '#f4ecd0');
          for (let i = 0; i < 12; i++) { const q = i / 12 * 6.283; k.px(cx + Math.cos(q) * 5, cy + Math.sin(q) * 5, '#8a6a30'); }
          const q = t * 9, q2 = t * 0.75; k.line(cx, cy, cx + Math.cos(q) * 5, cy + Math.sin(q) * 5, '#141012'); k.line(cx, cy, cx + Math.cos(q2) * 3, cy + Math.sin(q2) * 3, '#8a1a1a');
        }
        if (gl) for (let i = 0; i < 6; i++) { const y = Math.floor(Math.random() * 100) + 14, h = 1 + Math.floor(Math.random() * 3), dx = Math.round((Math.random() - 0.5) * 14); g.drawImage(g.canvas, 90 * ARENA_S, y * ARENA_S, 80 * ARENA_S, h * ARENA_S, 90 + dx, y, 80, h); k.rect(90 + dx, y, 2, h, Math.random() < 0.5 ? 'rgba(80,220,230,0.6)' : 'rgba(255,60,90,0.6)'); }
      } },
    { dur: 7, line: 'On the wall where you woke, one more mark.',
      draw(g, k, t, u) {
        const n = tallyGroups(), at = tallyWall(g, k, n), [x, y] = at(n), m = Math.min(5, Math.floor(Math.max(0, u - 0.25) * 14));
        for (let j = 0; j < Math.min(4, m); j++) k.rect(x + j * 2, y, 1, 7, '#f0d8b0');
        if (m >= 5) k.line(x - 1, y + 6, x + 7, y + 1, '#f0d8b0');
        if (m > 0 && m <= 5) { cutOnce('m' + m, () => sfx.play('snap')); k.px(x + Math.min(3, m - 1) * 2, y - 1, '#ffffff'); }
        if (u > 0.7) { g.globalAlpha = (u - 0.7) / 0.3 * 0.85; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      } },
    { dur: 5, line: 'THE DOOR · Thank you for playing.', noFade: false,
      draw(g, k, t, u) { k.rect(0, 0, W, H, '#000'); g.fillStyle = `rgba(232,195,74,${Math.min(1, u * 3)})`; g.font = '16px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('NEURO ARENA', 128, 70); g.font = '8px "Press Start 2P", monospace'; g.fillStyle = `rgba(236,228,210,${Math.min(1, u * 2)})`; g.fillText('THE JAR', 128, 88); g.textAlign = 'left'; } },
  ];
}

// Ending two, the Sheathed Sword: he stays; she rests; her name is crossed out; someone else begins.
function stayBeats(cycle) {
  const swordDown = (k, v, x = HX0) => { const sx0 = x - 10, sy0 = 92 + v * 20; k.line(sx0 - 10 * v, sy0, sx0 + 12, sy0 - 12 * (1 - v), '#dfe9f5', 0.7); k.rect(sx0 + 10, sy0 - 12 * (1 - v) - 1, 2, 3, '#c9a65a'); };
  const coat = k => { k.rect(138, 104, 12, 4, '#17151b'); k.rect(139, 103, 10, 1, '#2a2630'); k.rect(138, 107, 12, 1, '#0c0b0e'); }; // her coat, folded on the clay beside you
  return [
    { dur: 5.6, line: 'You put the sword down.', noFadeIn: true,
      draw(g, k, t, u) { // you kneel and lay the blade on the clay; the light from the gap grows gentler
        const kneel = easeOut(span(u, 0.1, 0.4)), v = easeInOut(span(u, 0.3, 0.7));
        jarScene(g, k, t, { raysA: 1 - u * 0.3 }, () => {
          k.oval(YX, FLOOR, 9, 1.6, 'rgba(0,0,0,0.35)'); jarHer(g, false, { drop: 2 }); cutDie(k, DIE[0], DIE[1], 1);
          jarYou(g, k, t, { crop: Math.round(kneel * 2), sword: false });
          swordDown(k, v);
        });
        if (v >= 1) cutOnce('lay', () => { sfx.play('ring'); sfx.play('gong'); });
      } },
    { dur: 7.2, line: 'Yun Xi leaves her coat beside you, and finally rests.', sound: 'chime',
      draw(g, k, t, u) { // nearer: she stands, leaves the coat folded by you, and goes up into the light
        const stand = span(u, 0.05, 0.25), go = easeIn(span(u, 0.45, 0.95));
        jarScene(g, k, t, { z: 2, x0: 66, y0: 54, raysA: 0.8 + go * 1.2 }, () => {
          if (u > 0.32) coat(k);
          jarHer(g, false, { x: YX + span(u, 0.22, 0.35) * 6, drop: -Math.round(go * 10), crop: Math.round(3 - stand * 3), alpha: 1 - go, filter: `brightness(${1 + go * 0.8})` });
          cutDie(k, DIE[0], DIE[1], 1);
          jarYou(g, k, t, { crop: 2, sword: false }); swordDown(k, 1);
          cutLight(g, () => { for (let i = 0; i < 26; i++) { const v = ((t * 0.3 + i / 26) % 1) * span(u, 0.4, 1), x = YX + 6 + Math.sin(i * 2.4 + t) * 5 * (1 + v * 3), y = 100 - v * 100; k.px(x, y, `rgba(232,196,120,${(1 - v) * span(u, 0.4, 0.7)})`); } k.glow(YX + 6, 96 - go * 20, 16, '#ffe0a0', go * 0.4); });
        });
        if (u > 0.32) cutOnce('coat', () => sfx.play('poof'));
      } },
    { dur: 5.6, line: 'The lid stays shut. The light goes out of the jar.',
      draw(g, k, t, u) { // up to the lid: it settles shut, and the dark comes down after the light
        const v = easeInOut(span(u, 0, 0.45)), shut = 1 - easeIn(span(u, 0.4, 0.62));
        jarScene(g, k, t, { z: 2, x0: 64, y0: 54 - v * 82, gap: 0.15 * shut, raysA: shut }, () => {
          jarYou(g, k, t, { crop: 2, sword: false }); swordDown(k, 1); coat(k);
        });
        if (shut <= 0) cutOnce('shut', () => sfx.play('thud'));
        cutWash(g, '#050302', 0.15 + easeIn(span(u, 0.6, 1)) * 0.85);
      } },
    { dur: 5, line: 'Under her tallies, her name is crossed out at last.',
      draw(g, k, t, u) {
        tallyWall(g, k, 40, { hand: '#b89a74' });
        k.rect(84, 52, 88, 40, 'rgba(40,24,14,0.85)');
        cutLight(g, () => k.glow(128, 72, 50, '#ffcf8a', 0.12));
        g.fillStyle = '#e8c478'; g.font = `28px ${typeof CJK_FONT !== 'undefined' ? CJK_FONT : 'serif'}`; g.textAlign = 'center'; g.fillText('云汐', 128, 82); g.textAlign = 'left';
        const v = Math.max(0, Math.min(1, (u - 0.3) / 0.35)); if (v > 0) { k.line(94, 77, 94 + 68 * v, 65, '#2a1408', 1.6); k.line(94, 76, 94 + 68 * v, 64, '#e0c8a0', 1.1); cutOnce('x', () => sfx.play('snap')); }
        cutVignette(g, 0.6, '0,0,0', 40);
      } },
    { dur: 6.5, line: 'In the dark, a new set of marks begins, in another hand.',
      draw(g, k, t, u) {
        k.rect(0, 0, W, H, '#0e0806');
        for (let i = 0; i < 300; i++) k.rect((i * 97) % W, (i * 61) % H, 1, 0.8, 'rgba(40,26,16,0.7)');
        const n = Math.floor(u * 22);
        for (let i = 0; i < n; i++) { const x = 40 + (i % 5) * 4 + Math.floor(i / 5) * 30, y = 64 + (i % 2); k.line(x, y, x + 2, y + 9, '#8a9aa8'); if (i % 5 === 4) k.line(x - 17, y + 7, x + 3, y + 2, '#8a9aa8'); }
        if (n > 0) cutOnce('n' + n, () => sfx.play('snap'));
      } },
    { dur: 4.5, line: `New Game+ ${cycle}. What you learned has soaked into the clay.`,
      draw(g, k, t, u) { k.rect(0, 0, W, H, '#000'); g.fillStyle = `rgba(232,195,74,${Math.min(1, u * 3)})`; g.font = '12px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('THE SHEATHED SWORD', 128, 70); g.font = '8px "Press Start 2P", monospace'; g.fillStyle = `rgba(236,228,210,${Math.min(1, u * 2)})`; g.fillText(`CYCLE ${cycle + 1}`, 128, 88); g.textAlign = 'left'; } },
  ];
}

// ---------- the Summit, painted for the films ----------
// A painting brought down to pixels: made at the picture's own size (one canvas pixel to a picture pixel), with
// texture in every surface (strata and lit faces in the rock, shaded cloud, needles, wind in the snow, grain over
// all of it), then drawn four times larger with no smoothing. Its manual, its stone and the challengers' swords sit
// where the fight's ambient expects them (finale-arenas.js), so the page still lifts and the blades still gleam.
let SUMMIT_ART = null;
function summitPainting() {
  if (SUMMIT_ART) return SUMMIT_ART;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), k = cutKit(g), r = mulberry32(2024);
  const hex = s => s[0] === '#' ? [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)] : s.match(/\d+/g).slice(0, 3).map(Number); // '#rrggbb' or 'rgb(r,g,b)'
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, u)))).join(',')})`; };
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  // the sky: deep at the top, paling to the haze on the horizon, brighter all along the split
  for (let y = 0; y < 80; y++) for (let x = 0; x < W; x++) {
    const v = y / 80, near = Math.max(0, 1 - Math.abs(y - SKY_SCAR(x)) / 26);
    px(x, y, mixc(mixc(v < 0.5 ? '#050820' : '#16255a', v < 0.5 ? '#16255a' : '#5c70a8', v < 0.5 ? v * 2 : (v - 0.5) * 2), '#6c84c4', near * 0.35 + (r() - 0.5) * 0.05));
  }
  for (let i = 0; i < 14; i++) { const x = r() * W, y = SKY_SCAR(x) + (r() - 0.5) * 20; k.oval(x, y, 10 + r() * 20, 3 + r() * 4, 'rgba(130,150,230,0.06)'); } // wisps lit by it
  for (let i = 0; i < 240; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 62), b = r(); px(x, y, b > 0.9 ? '#ffffff' : b > 0.6 ? '#c8d4ff' : '#7a88c0'); if (b > 0.97) { px(x - 1, y, '#8a9ad8'); px(x + 1, y, '#8a9ad8'); px(x, y - 1, '#8a9ad8'); px(x, y + 1, '#8a9ad8'); } }
  // the split: a lens of white light with its glow
  for (const [w, col] of [[5, 'rgba(160,210,255,0.12)'], [3.2, 'rgba(190,225,255,0.25)'], [1.6, '#dff2ff'], [0.6, '#ffffff']]) {
    g.beginPath(); g.moveTo(-4, 31.7); g.quadraticCurveTo(128, 19.2 - w, 260, 7.6); g.quadraticCurveTo(128, 19.2 + w, -4, 31.7); g.fillStyle = col; g.fill();
  }
  // a ridge line, one height per column: peaks of every size, each a steep cone, roughened
  const ridge = (base, rough, step) => {
    const h = new Float32Array(W).fill(base + 4);
    for (let c = -step; c < W + step; c += step * (0.5 + r() * 0.8)) {
      const a = rough * (0.35 + r() * 0.65), sl = 0.55 + r() * 0.9, sr = 0.55 + r() * 0.9;
      for (let x = 0; x < W; x++) h[x] = Math.min(h[x], base - a + (x < c ? (c - x) * sl : (x - c) * sr));
    }
    let j = 0; for (let x = 0; x < W; x++) { j = j * 0.6 + (r() - 0.5) * 1.6; h[x] += j; }
    return h;
  };
  // a range of granite: faces turned toward the split's light (on the left) lit, the others in shade, snow on the
  // high ground and caught in the gullies, strata, and fog thickening toward its foot
  const range = (h, bottom, tone, fog, fogAt = 0.65) => {
    for (let x = 0; x < W; x++) {
      const top = Math.round(h[x]), slope = h[Math.min(W - 1, x + 2)] - h[Math.max(0, x - 2)], high = h[x] <= Math.min(h[Math.max(0, x - 4)], h[Math.min(W - 1, x + 4)]) + 0.5;
      const face = slope > 0.4 ? tone.lit : slope < -0.4 ? tone.dark : tone.mid;
      for (let y = top; y < bottom; y++) {
        const d = (y - top) / Math.max(1, bottom - top);
        let col = face;
        if ((y - top < 2 && high) || (slope > 0.4 && y - top < 7 && r() < 0.28)) col = tone.snow;
        else if ((x * 3 + y * 7) % 13 === 0 && r() < 0.6) col = tone.dark;
        else if (r() < 0.05) col = tone.mid;
        px(x, y, mixc(col, fog, d * fogAt + 0.08));
      }
    }
  };
  const mist = (y0, y1, a, col = '140,164,226') => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.55, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); };
  range(ridge(40, 18, 16), 70, { lit: '#7086bc', mid: '#5c72aa', dark: '#4a5e96', snow: '#a8b8e4' }, '#7488c0', 0.8);
  mist(30, 52, 0.45);
  // far off, on its own spire, something built, and a cold glint
  for (let y = 18; y < 56; y++) { const w = 1 + (y - 18) * 0.16; for (let x = Math.round(70 - w); x <= Math.round(70 + w * 0.8); x++) px(x, y, mixc(x < 70 ? '#6e86bc' : '#4c62a0', '#7488c0', (y - 18) / 50)); }
  k.rect(66, 18, 8, 1, '#3c5088'); k.rect(67, 16, 6, 2, '#4a5e96'); k.rect(68, 15, 4, 1, '#3c5088'); k.rect(69.5, 8, 1, 7, '#3c5088');
  px(70, 8, '#c8faff'); k.rect(64, 9, 13, 1, 'rgba(150,240,255,0.55)'); k.oval(70, 9, 6, 2, 'rgba(120,230,255,0.25)');
  range(ridge(50, 14, 12), 72, { lit: '#5c74ac', mid: '#475e98', dark: '#36497e', snow: '#9aaedc' }, '#5e74ac', 0.75);
  mist(42, 62, 0.4);
  // granite pillars standing out of the cloud, a stunted pine on a few of their crowns
  for (const [cx, base, w, ht] of [[22, 66, 5, 24], [36, 66, 3, 16], [118, 66, 4, 20], [136, 66, 5, 28], [158, 66, 3, 14], [180, 66, 4, 22], [196, 66, 3, 15]]) {
    for (let y = base - ht; y < base; y++) {
      const t = (y - (base - ht)) / ht, half = w * (0.45 + 0.55 * Math.min(1, t * 2.2)) + (r() - 0.5) * 0.8;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
        const lit = x < cx - half * 0.2, edge = x === Math.round(cx - half);
        let col = edge ? '#8ea4d8' : lit ? '#5a70a8' : '#34467a';
        if ((y * 5 + x * 2) % 9 === 0 && r() < 0.5) col = '#2a3a68'; // its seams
        px(x, y, mixc(col, '#5e74ac', t * 0.5));
      }
    }
    if (ht > 18) for (let i = 0; i < 10; i++) px(Math.round(cx + (r() - 0.3) * w * 1.6), base - ht - Math.floor(r() * 2), r() < 0.4 ? '#4a6a5e' : '#1c3430');
  }
  // the sea of cloud: rows of puffs, small and pale far off, larger and nearer below, each lit from above
  const puff = (x, y, rad, far) => { // a bank of cloud, wider than it is tall, its top caught by the light
    const w = rad * (1.6 + r() * 0.8);
    k.oval(x, y, w, rad, mixc('#1e2a52', '#5a6ea4', far));
    k.oval(x - w * 0.08, y - rad * 0.3, w * 0.86, rad * 0.62, mixc('#33447a', '#6a80b8', far));
    k.oval(x - w * 0.15, y - rad * 0.62, w * 0.6, rad * 0.3, mixc('#7286bc', '#94a8d8', far));
    k.oval(x - w * 0.2, y - rad * 0.8, w * 0.32, rad * 0.14, mixc('#c4d2f2', '#c4d2f2', far));
  };
  for (const [y, n, rmin, rmax, far] of [[64, 22, 1.5, 3, 0.75], [69, 18, 2, 3.5, 0.55], [75, 16, 2.5, 4.5, 0.38], [82, 13, 3, 5.5, 0.22], [90, 11, 4, 7, 0.1], [99, 10, 5, 8, 0]]) {
    k.rect(0, y - 2, W, 12, mixc('#1e2a52', '#5a6ea4', far)); // the cloud between the banks
    for (let i = 0; i < n; i++) puff(r() * (W + 20) - 10, y + r() * 4 - 1, (rmin + r() * (rmax - rmin)) * (r() < 0.2 ? 1.6 : 1), far);
    mist(y - 7, y + 9, 0.22 + far * 0.25);
  }
  // the near cliff on the right: granite under the moon, cracked, its lit edge toward the split
  const cliff = new Path2D(); cliff.moveTo(W + 2, -2); cliff.lineTo(244, 2); cliff.lineTo(236, 16); cliff.lineTo(239, 28); cliff.lineTo(230, 44); cliff.lineTo(234, 58); cliff.lineTo(228, 74); cliff.lineTo(W + 2, 80); cliff.closePath();
  for (let y = 0; y < 82; y++) for (let x = 224; x < W; x++) {
    if (!g.isPointInPath(cliff, x + 0.5, y + 0.5)) continue;
    const edge = !g.isPointInPath(cliff, x - 1.5, y + 0.5), u = (x - 228) / 28;
    let col = edge ? '#d4def4' : mixc('#a6b4d6', '#3a4670', u + (r() - 0.5) * 0.18);
    if (!edge && (x * 7 + Math.floor(y / 3) * 5) % 17 === 0) col = '#2c3456'; // its cracks
    px(x, y, col);
  }
  for (let i = 0; i < 9; i++) { let x = 236 + r() * 16, y = r() * 60; for (let j = 0; j < 12; j++) { px(Math.round(x), Math.round(y), '#262c4c'); px(Math.round(x) - 1, Math.round(y), 'rgba(220,230,250,0.35)'); y += 1; x += (r() - 0.5) * 1.2; } }
  // its pine: a gnarled trunk out of the rock, and flat crowns of needles
  k.curve([[239, 34], [231, 28], [222, 18], [214, 12]], '#141016', 2); k.curve([[234, 54], [224, 49], [212, 46]], '#141016', 1.4);
  k.line(226, 24, 205, 18, '#141016', 0.9); k.line(222, 49, 199, 49, '#141016', 0.8);
  for (const [cx, cy, w] of [[212, 11, 26], [226, 8, 14], [201, 17, 16], [220, 19, 14], [209, 45, 20], [196, 48, 13], [222, 43, 12]]) {
    for (let i = 0; i < w * 4; i++) { const x = cx + (r() - 0.5) * w, y = cy + (r() - 0.3) * 3.2 * (1 - Math.abs(x - cx) / w); k.circle(x, y, 0.8 + r() * 1.2, r() < 0.5 ? '#0c1e1a' : '#18342c'); }
    for (let i = 0; i < w * 2; i++) { const x = cx + (r() - 0.5) * w * 0.9, y = cy - 1.2 - r() * 1.2 * (1 - Math.abs(x - cx) / w); px(Math.round(x), Math.round(y), r() < 0.25 ? '#a6c8b2' : r() < 0.6 ? '#5e8a76' : '#2e5244'); }
  }
  // a near pine on the left, dark, framing the view
  for (let y = -2; y < 98; y++) { px(4, y, '#04060c'); px(5, y, '#070a14'); px(6, y, '#04060c'); }
  for (let i = 0; i < 8; i++) {
    const y = 3 + i * 10, w = 8 + i * 1.8;
    for (let x = 0; x < w; x++) { const sag = (x / w) * (x / w) * 4, th = 2.6 * (1 - x / w) + 0.8; for (let d = 0; d < th; d++) px(6 + x, Math.round(y + sag + d), '#04060c'); if (r() < 0.5) px(6 + x, Math.round(y + sag + th), '#04060c'); if (r() < 0.25) px(6 + x, Math.round(y + sag - 1), 'rgba(160,180,230,0.35)'); }
    for (let x = 0; x < w * 0.5; x++) { const sag = (x / w) * 3; px(4 - x, Math.round(y + sag), '#04060c'); px(4 - x, Math.round(y + sag + 1), '#04060c'); }
  }
  // the outcrop under his manual, the ledge you stand on: snow, wind-ripples in it, rocks with caps, glints
  k.poly([[-4, 100], [-4, 85], [6, 86.6], [28, 86.8], [40, 92], [54, 100]], '#2a3658');
  for (let i = 0; i < 40; i++) px(Math.floor(r() * 46), 86 + Math.floor(r() * 12), r() < 0.5 ? '#3c4a74' : '#1e2846');
  k.poly([[-4, 87], [6, 86.4], [28, 86.6], [36, 89], [-4, 89]], '#9eb0d8');
  const edge = x => 95.5 - Math.sin((x + 10) / 60) * 2 + Math.sin(x / 9) * 0.6;
  for (let x = 0; x < W; x++) for (let y = Math.round(edge(x)); y < H; y++) {
    const d = (y - edge(x)) / (H - 95);
    let col = mixc(mixc('#8c9ecc', '#56689a', d * 1.3), '#222a48', Math.max(0, d - 0.5) * 1.6);
    if (y === Math.round(edge(x))) col = '#c8d6f2';
    else if (r() < 0.004) col = '#eef4ff';
    px(x, y, col);
  }
  for (let i = 0; i < 70; i++) { // drifts and wind-ripples across the snow, longer nearer
    const y = 98 + r() * r() * 46, x = r() * W, len = 3 + (y - 96) * 0.25 + r() * 6, lit = r() < 0.5;
    for (let j = 0; j < len; j++) px(Math.round(x + j), Math.round(y + Math.sin(j * 0.5) * 0.6), lit ? 'rgba(200,214,246,0.45)' : 'rgba(30,38,72,0.35)');
  }
  for (const [x, y, rad] of [[46, 128, 5], [66, 136, 3], [196, 124, 4], [212, 140, 5], [140, 132, 2.5]]) {
    k.oval(x, y + 1, rad * 1.5, rad * 0.6, 'rgba(20,24,48,0.4)'); k.oval(x, y, rad * 1.3, rad * 0.75, '#2c3454'); k.oval(x - rad * 0.4, y - rad * 0.2, rad * 0.6, rad * 0.35, '#4a5680'); k.oval(x, y - rad * 0.55, rad * 1.1, rad * 0.3, '#d6e2f8');
  }
  // his stone: slate, old cuts in it, snow on its crown
  for (let y = 80; y < 111; y++) { const half = 7 - Math.max(0, 84 - y) * 1.4; for (let x = Math.round(95 - half); x <= Math.round(95 + half); x++) { let col = x < 92 ? '#1a2236' : x < 97 ? '#2e3a56' : '#4a5a80'; if ((x + y * 2) % 7 === 0 && r() < 0.5) col = '#141a2c'; px(x, y, col); } }
  k.oval(95, 80.6, 5, 1.3, '#dce8fa'); for (let i = 0; i < 5; i++) k.line(90 + i * 2.6, 88 + i * 3, 92 + i * 2.6, 95 + i * 3, 'rgba(160,200,240,0.4)', 0.4);
  // his manual, open on its stone where he left it (as in the fight)
  k.oval(16, 87, 12, 3, 'rgba(0,0,0,0.35)'); k.poly([[5, 87], [6, 82], [12, 80], [22, 80], [27, 83], [27, 87]], '#3e475a'); k.poly([[6, 82], [12, 80], [22, 80], [26, 82]], '#5e687c');
  k.poly([[9, 81], [16, 80.4], [16, 77.6], [9, 78.2]], '#ece8d8'); k.poly([[16, 80.4], [23, 81], [23, 78.2], [16, 77.6]], '#d4ceb8'); k.line(16, 77.6, 16, 80.4, '#8a7a60', 0.4);
  // the swords of every challenger who climbed here first
  for (const [x, y, len, tilt] of SUMMIT_SWORDS) {
    const gx = x + tilt * 0.7, gy = y - len * 0.7;
    k.oval(x, y, 3, 1, '#c8d4dc'); k.line(x, y, gx, gy, '#9fb0c6', 1); k.line(x + 0.4, y, gx + 0.4, gy, '#5a6a82', 0.4);
    k.line(gx - 2.2, gy, gx + 2.2, gy, '#7a6a44', 0.8); k.line(gx, gy, x + tilt, y - len, '#232a3c', 0.8); k.circle(x + tilt, y - len - 0.4, 0.6, '#8a7a50');
  }
  // grain over the whole of it, the way paint sits on a surface
  const img = g.getImageData(0, 0, W, H), a = img.data;
  for (let i = 0; i < a.length; i += 4) { const n = (r() - 0.5) * 9; a[i] += n; a[i + 1] += n; a[i + 2] += n * 1.2; }
  g.putImageData(img, 0, 0);
  return (SUMMIT_ART = c);
}
const drawSummitArt = g => { g.imageSmoothingEnabled = false; g.drawImage(summitPainting(), 0, 0, W, H); };

// After the serious duel: he sits against his stone, tears the last page from his manual, and puts it in your hand.
function pageBeats() {
  const TX = 104, HX = 158, FY = 110;
  // the place, him against his stone and you; o.page: where the torn page is
  const scene = (g, k, t, o = {}) => {
    k.rect(0, 0, W, H, '#000');
    cam(g, o.x0 || 0, o.y0 || 0, o.z || 1, () => {
      drawSummitArt(g);
      WORLD_SCENES.summit.ambient(paintKit(g), t, null);
      for (let i = 0; i < 14; i++) { const x = ((i * 47 + t * (18 + i % 4 * 6)) % (W + 40)) - 20, y = 70 + (i * 17) % 60; k.line(x, y, x + 5, y + 0.4, 'rgba(200,220,255,0.25)', 0.3); } // wind across the summit
      const gone = o.gone || 0;
      k.oval(TX, FY, 10, 1.6, `rgba(0,0,0,${0.35 * (1 - gone)})`); k.oval(HX, FY, 8, 1.6, 'rgba(0,0,0,0.35)');
      cutSprite(g, 'b_swordsaint', TX, FY, { crop: 4, alpha: 1 - gone });
      if (o.page) { const [x, y] = o.page; k.rect(x, y, 4, 5, '#f2ead4'); k.rect(x, y, 0.6, 5, '#c8bc9e'); cutLight(g, () => k.glow(x + 2, y + 2.5, 6, '#ffe0a0', 0.35 + 0.15 * Math.sin(t * 3))); }
      cutSprite(g, 'hero', HX, FY, { flip: true });
    });
    cutVignette(g, 0.62, '2,4,12', 40);
  };
  // The close view: his hand holds the page out, yours comes to take it, and he lets go.
  const handover = (g, k, t, u) => {
    k.rect(0, 0, W, H, '#000');
    cam(g, 70, 6, 3, () => { drawSummitArt(g); WORLD_SCENES.summit.ambient(paintKit(g), t, null); }); // the split sky behind, near and soft
    cutWash(g, '#02040c', 0.62);
    for (let i = 0; i < 9; i++) { const x = (i * 61 + 20) % W, y = (i * 37) % 60 + 6, a = 0.08 + 0.06 * Math.sin(t * 1.3 + i); cutLight(g, () => k.glow(x, y, 6 + (i % 3) * 3, '#9fd8ff', a)); } // stars out of focus
    const enter = easeOut(span(u, 0, 0.16)), reach = easeInOut(span(u, 0.16, 0.42)), let_go = easeIn(span(u, 0.56, 0.82)), take = easeInOut(span(u, 0.56, 0.86));
    // the hands and the page, painted in pixels at the picture's own size, sharp in front of the soft sky
    const off = handover.layer || (handover.layer = Object.assign(document.createElement('canvas'), { width: W, height: H }));
    const lg = off.getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H);
    { const k = cutKit(lg);
      const px = Math.round(104 + take * 14), py = Math.round(34 + take * 3), flutter = Math.sin(t * 4.2) * (1.6 - reach);
      // his hand behind the page: the fingers under it
      const hx = Math.round(-46 * (1 - enter) - let_go * 80);
      k.poly([[-14 + hx, 62], [64 + hx, 70], [68 + hx, 100], [-14 + hx, 110]], '#8eaccb'); k.poly([[-14 + hx, 66], [64 + hx, 72], [64 + hx, 78], [-14 + hx, 74]], '#a8c4de'); // the sleeve, pale blue
      k.rect(58 + hx, 70, 8, 28, '#eef4fa'); // the white cuff under it
      k.poly([[64 + hx, 74], [100 + hx, 76], [110 + hx, 82], [108 + hx, 90], [86 + hx, 96], [66 + hx, 96]], '#e6c6a2'); // the hand
      k.poly([[66 + hx, 90], [92 + hx, 91], [86 + hx, 96], [66 + hx, 96]], '#c49c78'); // its shaded underside
      for (const x of [86, 92, 98]) k.rect(x + hx, 76, 3, 1, '#f6e0c6'); // knuckles catching the split's light
      for (const y of [81, 86]) k.line(94 + hx, y, 104 + hx, y + 0.6, 'rgba(150,110,80,0.6)', 0.5); // fingers, curled under the page
      // the page: torn along its left edge, blank, with the manual's seal in one corner
      const torn = []; for (let y = 0; y <= 74; y += 4) torn.push([px - (y / 4 % 2 ? 1.6 : 0), py + y]); // down the torn edge
      k.poly([...torn, [px + 52, py + 74], [px + 52 + flutter, py - 1 + flutter * 0.3]], k.hgrad(px, px + 52, ['#d6c9a8', '#efe6cf', '#f4ecd8']));
      k.line(px + 52 + flutter, py - 1 + flutter * 0.3, px + 52, py + 74, 'rgba(160,140,110,0.6)', 0.5);
      for (let i = 0; i < 6; i++) k.rect(px + 8, py + 10 + i * 9, 36, 0.4, 'rgba(150,130,100,0.18)'); // ruled for writing, never written on
      k.rect(px + 41, py + 62, 6, 6, '#a8322a'); k.rect(px + 42, py + 63, 4, 4, '#c8483a'); k.rect(px + 43, py + 64, 2, 2, '#a8322a');
      k.rect(px - 4 + hx * 0.02, 74, 12, 5, '#e6c6a2'); k.rect(px - 4 + hx * 0.02, 74, 12, 1, '#f2d8b8'); // his thumb on the page
      // your hand, coming in from the right
      const yx = Math.round(260 - reach * 104 + take * 14);
      k.poly([[yx + 50, 64], [W + 20, 58], [W + 20, 104], [yx + 52, 100]], '#e4e0d4'); k.rect(yx + 44, 66, 8, 30, '#c8c0b0'); // your sleeve
      k.poly([[yx + 46, 70], [yx + 4, 72], [yx - 4, 80], [yx + 2, 88], [yx + 24, 94], [yx + 46, 94]], '#d8a47a'); // your hand
      k.poly([[yx + 2, 88], [yx + 46, 89], [yx + 46, 94], [yx + 24, 94]], '#b0805a'); // its shaded underside
      for (const y of [77, 82, 87]) k.line(yx - 1, y, yx + 16, y - 0.4, 'rgba(140,90,60,0.65)', 0.5); // fingers
      k.rect(yx + 8, 72, 30, 1, '#ecc49a'); // light along the back of it
      if (reach > 0.95) k.rect(yx - 6, 76, 12, 5, '#d8a47a'); // your thumb, holding it now
    }
    g.imageSmoothingEnabled = false; g.drawImage(off, 0, 0, W, H);
    { const px = Math.round(104 + take * 14), py = Math.round(34 + take * 3);
      cutLight(g, () => k.glow(px + 26, py + 36, 24 + take * 10, '#ffe8b8', 0.16 + 0.06 * Math.sin(t * 2) + take * 0.18)); } // light it holds, more of it in your hand
    cutVignette(g, 0.65, '2,4,12', 36);
  };
  return [
    { dur: 5.4, line: '“All thirteen. You saw every one, and you are still standing.”', sound: 'gong',
      draw(g, k, t) { scene(g, k, t); } },
    { dur: 5.6, line: '“The Thirteenth Sword cuts heaven and earth apart. The Fourteenth was never written in ink.”', noFadeOut: true,
      draw(g, k, t, u) { // nearer: from his robe he takes the page torn from his manual's end, and holds it out to you
        const out = easeOut(span(u, 0.45, 0.75));
        scene(g, k, t, { z: 2, x0: 72, y0: 58, page: u > 0.45 ? [TX + 5 + out * 9, FY - 13 - out * 3] : null });
        if (u > 0.45) cutOnce('draw', () => sfx.play('wind'));
      } },
    { dur: 7.4, line: '', noFadeIn: true,
      draw(g, k, t, u) {
        handover(g, k, t, u);
        if (u > 0.42) cutOnce('take', () => sfx.play('pop'));
        if (u > 0.6) cutOnce('given', () => sfx.play('chime'));
      } },
    { dur: 6, line: '“It is to sheathe it. Carry that page to the door.”',
      draw(g, k, t, u) { // wide again: you hold the page; he goes up into the split sky as light
        const gone = easeIn(span(u, 0.2, 0.9));
        scene(g, k, t, { gone, page: [HX + 5, FY - 13] });
        cutLight(g, () => { for (let i = 0; i < 24; i++) { const v = ((t * 0.25 + i / 24) % 1) * span(u, 0.15, 1), x = TX + Math.sin(i * 1.9 + t) * 4 * (1 + v * 4), y = 100 - v * 90; k.px(x, y, `rgba(159,216,255,${(1 - v) * gone})`); } });
      } },
  ];
}
