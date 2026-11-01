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
  const fade = Math.max(Math.max(0, 1 - CUT.t / 0.35), b.choices ? 0 : Math.max(0, 1 - (b.dur - CUT.t) / 0.35)); // each beat fades in from black and out to it
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

// the jar's floor, its fighters and its light: the setting of both endings
function cutJar(g, k, t, open = 0) {
  drawBg(g, 'bottom');
  WORLD_SCENES.bottom.ambient(paintKit(g), t, cutSim(open));
}

// the hero in the black coat (the last cycle's echo): greyed, in her coat
function cutEcho(g, x, y, opts = {}) {
  cutSprite(g, 'hero', x, y, { ...opts, filter: 'grayscale(1) brightness(0.48)' });
  const s = opts.scale || 2, c = opts.crop || 0;
  g.fillStyle = '#17151b'; g.fillRect(x - 4 * s, y - (11 - c) * s + 5 * s, 8 * s, 4 * s);
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

// ---------- after the last fight: her last words, and the door ----------
function finaleBeats(echo, page) {
  const kneel = (g, k, t, u, drop) => {
    cutJar(g, k, t);
    if (echo) cutEcho(g, 98, 108 + drop, { crop: 3 }); else cutSprite(g, 'b_yunxi', 98, 108 + drop, { crop: 3 });
    cutSprite(g, 'hero', 160, 110, { flip: true });
  };
  const dieAt = u => { const v = Math.min(1, u / 0.45); return [108 + v * 22, 104 - Math.sin(v * Math.PI * 2) * (1 - v) * 10, v < 1 ? 1 + Math.floor(u * 30) % 4 : 1]; };
  return [
    { dur: 4.6, line: echo ? 'The one in her coat kneels. It is wearing your face.' : '“Then this time it’s you.”', sound: 'chime',
      draw(g, k, t, u) { kneel(g, k, t, u, 0); const [x, y, n] = dieAt(u); cutDie(k, x, y, n); if (u > 0.45) cutOnce('land', () => sfx.play('pop')); } },
    { dur: 4.6, line: echo ? '“Then this time it’s you. I’m sorry.”' : '“I’m sorry. I lost the bet again.”',
      draw(g, k, t, u) { kneel(g, k, t, u, Math.round(easeOut(u) * 2)); cutDie(k, 130, 104, 1); } },
    { choices: [['Open the door', () => playCutscene(doorBeats(echo), afterDoor), true], ...(page ? [['Sheathe the sword', () => { endCutscene(); chooseStay(); }]] : []), ['Not yet', () => endCutscene()]],
      line: page ? 'Above you, the lid is loose. In your hand, the Fourteenth Page.' : 'Above you, the lid is loose.',
      draw(g, k, t) { kneel(g, k, t, 0, 2); cutDie(k, 130, 104, 1); const a = 0.25 + 0.2 * Math.sin(t * 2); k.rect(112, 6, 32, 1, `rgba(255,250,224,${a})`); } },
  ];
}

// Ending one, the Door: the lid lifts, the core rises into a hand held open, and the face becomes a clock.
function doorBeats(echo) {
  const her = (g, d = 2) => echo ? cutEcho(g, 98, 110, { crop: 3 }) : cutSprite(g, 'b_yunxi', 98, 108 + d, { crop: 3 });
  return [
    { dur: 4.5, line: 'The lid lifts. Light pours in.', sound: 'riser',
      draw(g, k, t, u) {
        cutJar(g, k, t, easeIn(u));
        const w = 10 + easeIn(u) * 120; k.poly([[128 - w * 0.3, 0], [128 + w * 0.3, 0], [128 + w, H], [128 - w, H]], `rgba(255,244,214,${0.1 + u * 0.35})`);
        k.disc(128, Math.round(4 - easeIn(u) * 26), 20, '#2a1a10', 4); // the lid, rising out of sight
        her(g); cutSprite(g, 'hero', 128, 110);
        if (u > 0.6) { g.globalAlpha = (u - 0.6) * 1.2; g.fillStyle = '#fff6e0'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      } },
    { dur: 4.5, line: 'The core rises from his chest.', sound: 'chime',
      draw(g, k, t, u) {
        cutJar(g, k, t, 1);
        k.poly([[90, 0], [166, 0], [248, H], [8, H]], 'rgba(255,244,214,0.38)');
        her(g); cutSprite(g, 'hero', 128, 110, { filter: `grayscale(${u})`, alpha: 1 - u * 0.4 });
        const y = 92 - easeIn(u) * 110;
        for (let i = 1; i < 10; i++) k.px(128 + Math.sin(t * 6 + i) * 1.5, y + i * 3, `rgba(200,255,220,${0.6 - i * 0.06})`);
        k.disc(128, y, 3, '#7fe0a8'); k.disc(128, y, 2, '#cfffe0'); k.px(127, y - 1, '#ffffff');      } },
    { dur: 5, line: 'Beyond the rim: black water, far lights, and a hand held open.', sound: 'gong',
      draw(g, k, t, u) {
        k.sky(0, 70, ['#1c262c', '#10181c', '#0a1012', '#141c1e']);
        k.rect(0, 70, W, H - 70, k.vgrad(70, H, ['#141c1e', '#0a0f11']));
        for (let i = 0; i < 40; i++) k.rect(((i * 37 + t * (2 + i % 3)) % (W + 20)) - 10, 72 + (i * 11) % 70, 4, 0.6, 'rgba(120,140,136,0.3)'); // the water moving
        for (const [x, y, r] of [[22, 66, 2], [70, 60, 1], [196, 64, 3], [236, 68, 1], [150, 58, 1]]) { k.disc(x, y, r, '#e8e4c8'); k.rect(x - 1, y + 4 + Math.round(Math.sin(t * 2 + x) * 1), 3, 1, 'rgba(232,228,200,0.35)'); }
        // the jar, small on the water, its lid off
        k.disc(128, 124, 16, '#5a3a26', 12); k.disc(128, 114, 10, '#2a1a10', 3); k.rect(112, 118, 32, 1, '#7a5a40');
        // the hand: vast, coming down out of the dark, palm open
        const hy = -38 + easeOut(u) * 18, hand = (dy, c) => { // drawn twice: a faint edge of light, then the black over it
          k.disc(128, hy + dy, 74, c, 36);
          for (const [fx, len, tilt] of [[78, 30, -6], [104, 40, -2], [134, 42, 2], [162, 36, 5]]) k.poly([[fx - 10, hy + 20 + dy], [fx + 10, hy + 20 + dy], [fx + 9 + tilt, hy + 22 + len + dy], [fx + tilt, hy + 26 + len + dy], [fx - 9 + tilt, hy + 22 + len + dy]], c);
          k.poly([[190, hy + 14 + dy], [214, hy + 16 + dy], [224, hy + 40 + dy], [208, hy + 48 + dy], [196, hy + 30 + dy]], c); // the thumb
        };
        hand(1, '#4a6a70'); hand(0, '#000000');
        for (let i = 0; i < 4; i++) k.line(82 + i * 28, hy + 22, 86 + i * 28, hy + 34, '#141c1e', 0.5); // creases between the fingers
        // the core, climbing a thread of light into the palm
        const cy = 110 - easeOut(u) * 70;
        k.line(128, 112, 128, cy, 'rgba(160,240,200,0.35)'); k.disc(128, cy, 2, '#7fe0a8'); k.px(128, cy, '#ffffff');
      } },
    { dur: 4.5, line: 'His face flickers. For an instant, the hands of a clock move where his eyes were.',
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
    { dur: 7, line: 'On the wall where he woke, one more mark.',
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
  return [
    { dur: 4.5, line: 'He puts the sword down.', sound: 'gong',
      draw(g, k, t, u) {
        cutJar(g, k, t); cutSprite(g, 'b_yunxi', 98, 110, { crop: 3 });
        cutSprite(g, 'hero', 150, 110 + Math.round(easeOut(u) * 4), { flip: true, crop: Math.round(easeOut(u) * 2) });
        const v = Math.min(1, u * 1.6), sx0 = 150, sy0 = 92 + v * 22; // the sword, lowered to the clay
        k.line(sx0 - 10 * v, sy0, sx0 + 12, sy0 - 12 * (1 - v), '#dfe9f5'); k.rect(sx0 + 10, sy0 - 12 * (1 - v) - 1, 2, 3, '#c9a65a');
      } },
    { dur: 5, line: 'Yun Xi leaves her coat beside him, and finally rests.', sound: 'chime',
      draw(g, k, t, u) {
        cutJar(g, k, t);
        cutSprite(g, 'hero', 150, 114, { flip: true, crop: 2 }); k.line(140, 114, 162, 114, '#dfe9f5');
        k.rect(126, 108, 12, 6, '#17151b'); k.rect(127, 107, 10, 1, '#2a2630'); // her coat, folded on the clay
        cutSprite(g, 'b_yunxi', 104, 110 - Math.round(easeIn(u) * 6), { alpha: 1 - easeIn(u) });
        for (let i = 0; i < 24; i++) { const v = ((t * 0.3 + i / 24) % 1) * u, x = 104 + Math.sin(i * 2.4 + t) * 6 * (1 + v * 3), y = 100 - v * 100; k.px(x, y, `rgba(232,196,120,${(1 - v) * u})`); }
      } },
    { dur: 4, line: 'The lid stays shut. The light goes out of the jar.',
      draw(g, k, t, u) {
        cutJar(g, k, t); cutSprite(g, 'hero', 150, 114, { flip: true, crop: 2 }); k.line(140, 114, 162, 114, '#dfe9f5'); k.rect(126, 108, 12, 6, '#17151b');
        g.globalAlpha = 0.25 + easeIn(u) * 0.7; g.fillStyle = '#050302'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      } },
    { dur: 5, line: 'Under her tallies, her name is crossed out at last.',
      draw(g, k, t, u) {
        tallyWall(g, k, 40, { hand: '#b89a74' });
        k.rect(84, 52, 88, 40, 'rgba(40,24,14,0.85)');
        g.fillStyle = '#e8c478'; g.font = `28px ${typeof CJK_FONT !== 'undefined' ? CJK_FONT : 'serif'}`; g.textAlign = 'center'; g.fillText('云汐', 128, 82); g.textAlign = 'left';
        const v = Math.max(0, Math.min(1, (u - 0.3) / 0.35)); if (v > 0) { k.line(94, 77, 94 + 68 * v, 65, '#2a1408', 1.6); k.line(94, 76, 94 + 68 * v, 64, '#e0c8a0', 1.1); cutOnce('x', () => sfx.play('snap')); }
      } },
    { dur: 6.5, line: 'In the dark, a new set of marks begins, in another hand.',
      draw(g, k, t, u) {
        k.rect(0, 0, W, H, '#0e0806');
        for (let i = 0; i < 300; i++) k.rect((i * 97) % W, (i * 61) % H, 1, 0.8, 'rgba(40,26,16,0.7)');
        const n = Math.floor(u * 22);
        for (let i = 0; i < n; i++) { const x = 40 + (i % 5) * 4 + Math.floor(i / 5) * 30, y = 64 + (i % 2); k.line(x, y, x + 2, y + 9, '#8a9aa8'); if (i % 5 === 4) k.line(x - 17, y + 7, x + 3, y + 2, '#8a9aa8'); }
        if (n > 0) cutOnce('n' + n, () => sfx.play('snap'));
      } },
    { dur: 4.5, line: `New Game+ ${cycle}. What he learned has soaked into the clay.`,
      draw(g, k, t, u) { k.rect(0, 0, W, H, '#000'); g.fillStyle = `rgba(232,195,74,${Math.min(1, u * 3)})`; g.font = '12px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('THE SHEATHED SWORD', 128, 70); g.font = '8px "Press Start 2P", monospace'; g.fillStyle = `rgba(236,228,210,${Math.min(1, u * 2)})`; g.fillText(`CYCLE ${cycle + 1}`, 128, 88); g.textAlign = 'left'; } },
  ];
}

// After the serious duel: he sits against his stone, and gives the hero the page torn from the end of his manual.
function pageBeats() {
  const scene = (g, k, t, gone = 0) => {
    drawBg(g, 'summit'); WORLD_SCENES.summit.ambient(paintKit(g), t, null);
    cutSprite(g, 'b_swordsaint', 104, 108, { crop: 4, alpha: 1 - gone });
    cutSprite(g, 'hero', 158, 110, { flip: true });
  };
  return [
    { dur: 4.8, line: '“All thirteen. You saw every one, and you are still standing.”', sound: 'gong', draw(g, k, t) { scene(g, k, t); } },
    { dur: 5, line: '“The Thirteenth Sword cuts heaven and earth apart. The Fourteenth was never written in ink.”',
      draw(g, k, t, u) {
        scene(g, k, t);
        const v = easeOut(Math.min(1, u * 1.4)), x = 112 + v * 38, y = 92 - Math.sin(v * Math.PI) * 18 + Math.sin(t * 6) * 1; // the page, carried to him on the wind
        k.rect(x, y, 6, 8, '#f4f0e0'); k.rect(x, y, 1, 8, '#c8c0a8'); for (let i = 0; i < 3; i++) k.rect(x + 2, y + 2 + i * 2, 3, 1, '#8a8a90');
        if (u < 0.1) cutOnce('tear', () => sfx.play('wind'));
      } },
    { dur: 5.2, line: '“It is to sheathe it. Carry that page to the door.”',
      draw(g, k, t, u) {
        scene(g, k, t, easeIn(u));
        k.rect(148, 94, 6, 8, '#f4f0e0'); k.rect(148, 94, 1, 8, '#c8c0a8'); k.px(151, 97, `rgba(255,236,170,${0.5 + 0.5 * Math.sin(t * 4)})`);
        for (let i = 0; i < 20; i++) { const v = ((t * 0.25 + i / 20) % 1) * u, x = 104 + Math.sin(i * 1.9 + t) * 4 * (1 + v * 4), y = 92 - v * 90; k.px(x, y, `rgba(159,216,255,${(1 - v) * u})`); }
      } },
  ];
}
