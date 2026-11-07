// Celestial art: the painted Life Tree and the White Stag inside it, the Taiji Venerable (the eclipse), the Rabbit's moon,
// and every hazard, shot, beam and spectacle of the celestial arts in sim.js (the Venerables, the Golden Dragon's coil).
// Painted at 1x with texture and dithering, baked once where it can be, lit live on top. Loaded after render.js.
(() => {
const RP = Renderer.prototype;
const TAU = Math.PI * 2;
const hash = (x, y, s = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (v, x, y) => v + (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.45;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const whiteOf = c => { const o = mk(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); return o; };
const outline = (c, col) => { // a one-pixel dark edge round whatever was painted
  const g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
  g.fillStyle = col;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!on(x, y) && (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1))) g.fillRect(x, y, 1, 1);
};
// screen-space helpers (the renderer's g is the 256x144 fight layer)
const disc = (g, x, y, r, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0.4, r), 0, TAU); g.fill(); g.globalAlpha = 1; };
const glow = (g, x, y, r, col, a = 0.5) => { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 3; i >= 1; i--) disc(g, x, y, r * (0.6 + i * 0.45), col, a * 0.3); g.restore(); };
const star4 = (g, x, y, s, col, a = 1) => {
  g.globalAlpha = a; g.fillStyle = col; g.beginPath();
  g.moveTo(x, y - s); g.lineTo(x + s * 0.22, y - s * 0.22); g.lineTo(x + s, y); g.lineTo(x + s * 0.22, y + s * 0.22); g.lineTo(x, y + s); g.lineTo(x - s * 0.22, y + s * 0.22); g.lineTo(x - s, y); g.lineTo(x - s * 0.22, y - s * 0.22);
  g.fill(); g.globalAlpha = 1;
};
// world-space floor ellipse
const E = (g, x, y, r, col, a, fill, lw = 1) => {
  g.globalAlpha = Math.max(0, Math.min(1, a)); g.beginPath(); g.ellipse(sx(x), sy(y), Math.max(0.5, r), Math.max(0.5, r * SQ), 0, 0, TAU);
  if (fill) { g.fillStyle = col; g.fill(); } else { g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
  g.globalAlpha = 1;
};
const crescent = (g, x, y, r, rot, col, a = 1) => { // a crescent moon opening toward rot
  g.globalAlpha = a; g.fillStyle = col; g.beginPath();
  g.arc(x, y, r, rot + 0.35, rot + TAU - 0.35); g.arc(x + Math.cos(rot) * r * 0.55, y + Math.sin(rot) * r * 0.55, r * 0.8, rot + TAU - 0.9, rot + 0.9, true);
  g.fill(); g.globalAlpha = 1;
};
const sunDisc = (g, x, y, r, t, a = 1) => {
  glow(g, x, y, r * 1.2, '#ff8a2a', 0.55 * a);
  g.globalAlpha = 0.8 * a; g.strokeStyle = '#ffd84a'; g.lineWidth = 1;
  for (let i = 0; i < 10; i++) { const q = t * 1.6 + i * TAU / 10, L = r * (1.5 + 0.25 * Math.sin(t * 9 + i * 2)); g.beginPath(); g.moveTo(x + Math.cos(q) * r * 1.05, y + Math.sin(q) * r * 1.05); g.lineTo(x + Math.cos(q) * L, y + Math.sin(q) * L); g.stroke(); }
  disc(g, x, y, r, '#ff6a14', a); disc(g, x - r * 0.12, y - r * 0.12, r * 0.78, '#ffb52e', a); disc(g, x - r * 0.25, y - r * 0.25, r * 0.45, '#fff2b8', a);
  g.globalAlpha = 1;
};
const yinyang = (g, x, y, r, a, sqY = 1, alpha = 1, white = '#f4f0e6', black = '#141414') => { // a taiji, turned by a; squashed onto the floor by sqY
  g.save(); g.translate(x, y); g.scale(1, sqY); g.rotate(a); g.globalAlpha = alpha;
  g.fillStyle = white; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
  g.fillStyle = black; g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.fill();
  g.fillStyle = white; g.beginPath(); g.arc(r / 2, 0, r / 2, 0, TAU); g.fill();
  g.fillStyle = black; g.beginPath(); g.arc(-r / 2, 0, r / 2, 0, TAU); g.fill();
  g.fillStyle = black; g.beginPath(); g.arc(r / 2, 0, Math.max(0.6, r / 7), 0, TAU); g.fill();
  g.fillStyle = white; g.beginPath(); g.arc(-r / 2, 0, Math.max(0.6, r / 7), 0, TAU); g.fill();
  g.restore();
};
const TRIGRAMS = [0b111, 0b000, 0b100, 0b010, 0b001, 0b110, 0b101, 0b011];
const trigram = (g, x, y, n, col, a, w = 7) => { // three bars, whole or broken
  g.globalAlpha = a; g.fillStyle = col;
  for (let b = 0; b < 3; b++) { const yy = Math.round(y - 3 + b * 3); if ((TRIGRAMS[n % 8] >> b) & 1) g.fillRect(Math.round(x - w / 2), yy, w, 1); else { g.fillRect(Math.round(x - w / 2), yy, Math.floor(w / 2) - 1, 1); g.fillRect(Math.round(x + 1), yy, Math.floor(w / 2) - 1, 1); } }
  g.globalAlpha = 1;
};
const PEARL = { wood: ['#5ad86a', '#c8ffb0'], fire: ['#ff5a2a', '#ffe08a'], earth: ['#d8a040', '#fff0b0'], metal: ['#dfe6f2', '#ffffff'], water: ['#3a8aff', '#b8e0ff'] };

// ---------- the Life Tree, painted ----------
function paintTree(S, pale) {
  const Wc = Math.round(118 * S), Hc = Math.round(96 * S), c = mk(Wc, Hc), g = c.getContext('2d');
  const P = pale ? { leaf: ['#6a807e', '#98b0ac', '#c8dcd6', '#eef8f4', '#ffffff'], bark: ['#5a585e', '#8a868e', '#bab6ba', '#e6e2de'] }
    : { leaf: ['#163820', '#2a5c2c', '#4c8c36', '#84c24a', '#cdee82'], bark: ['#2a1a0e', '#4a3018', '#72522e', '#a07e50'] };
  const set = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const bx = Wc / 2, base = Hc - 3, top = base - 44 * S;
  for (let y = Math.floor(top); y <= base; y++) { // the trunk: thick, lit from the left, its bark in grooves
    const u = (base - y) / (base - top), hw = (6.5 + 10 * Math.pow(1 - u, 5)) * S, lean = Math.sin(u * 2.4) * 2.2 * S;
    for (let x = Math.floor(bx - hw + lean); x <= Math.ceil(bx + hw + lean); x++) {
      const s = (x - (bx + lean)) / hw;
      let v = 0.66 - s * 0.42 - s * s * 0.2;
      if (Math.sin(x * 1.25 / S + Math.sin(y * 0.16) * 2.6) > 0.5) v -= 0.33;
      v += (hash(x, y, 3) - 0.5) * 0.25;
      set(x, y, P.bark[Math.max(0, Math.min(3, Math.floor(dith(v, x, y) * 4)))]);
    }
  }
  for (const [dir, len, dy] of [[-1, 24, 0], [1, 26, 0], [-1, 15, 2], [1, 16, 2], [-1, 10, -1], [1, 9, 1]]) { // roots gripping the ground
    for (let i = 0; i < len * S; i++) {
      const u = i / (len * S), x = bx + dir * (6 * S + i), y = base - 1 + dy * S * u + Math.sin(u * 3) * 1.4, th = Math.max(1, 4 * S * (1 - u));
      for (let k = 0; k < th; k++) set(x, y - k, P.bark[k === 0 ? 0 : k === Math.ceil(th) - 1 ? 3 : dir < 0 ? 2 : 1]);
    }
  }
  for (const [a, L] of [[-1.1, 30], [1.05, 32], [-0.5, 26], [0.45, 28], [0, 20], [-1.6, 24], [1.55, 24]]) { // limbs up into the crown
    let x = bx, y = top + 8 * S; const ang = -Math.PI / 2 + a * 0.6;
    for (let i = 0; i < L * S; i++) { const u = i / (L * S), q = ang + Math.sin(u * 4 + a) * 0.3; x += Math.cos(q); y += Math.sin(q); const w = Math.max(1, 4.5 * S * (1 - u * 0.8)); for (let k = -w / 2; k < w / 2; k++) set(x + k, y, P.bark[k < 0 ? 3 : 1]); }
  }
  let seed = pale ? 900 : 100; const rnd = () => hash(seed++, 7, 2);
  const blobs = [], ccx = bx, ccy = top - 2 * S;
  for (let i = 0; i < 38; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()); blobs.push({ x: ccx + Math.cos(a) * d * 47 * S, y: ccy + Math.sin(a) * d * 20 * S - 4 * S, r: (8 + rnd() * 7.5) * S }); }
  blobs.push({ x: ccx, y: ccy - 22 * S, r: 13 * S }, { x: ccx - 18 * S, y: ccy - 17 * S, r: 10 * S }, { x: ccx + 18 * S, y: ccy - 17 * S, r: 10 * S });
  blobs.sort((p, q) => p.y - q.y);
  for (const b of blobs) { // the crown: clusters painted back to front, each lit from the upper left, edges leafy
    for (let y = Math.floor(b.y - b.r - 2); y <= b.y + b.r + 2; y++) for (let x = Math.floor(b.x - b.r - 2); x <= b.x + b.r + 2; x++) {
      const dx = (x - b.x) / b.r, dy = (y - b.y) / (b.r * 0.82), d = Math.hypot(dx, dy);
      if (d > 1 + (hash(x, y, 11) - 0.5) * 0.4) continue;
      let v = 0.56 + (-dx * 0.35 - dy * 0.55) * 0.62 - d * d * 0.22 + (hash(x >> 1, y >> 1, 5) - 0.5) * 0.36;
      set(x, y, P.leaf[Math.max(0, Math.min(4, Math.floor(dith(v, x, y) * 5)))]);
    }
  }
  for (let i = 0; i < 90 * S; i++) { const b = blobs[Math.floor(hash(i, 3, 4) * blobs.length)]; set(b.x + (hash(i, 5, 6) - 0.5) * b.r * 1.2, b.y + (hash(i, 8, 9) - 0.7) * b.r, P.leaf[4]); } // light through the leaves
  for (let i = 0; i < 40 * S; i++) { const b = blobs[Math.floor(hash(i, 13, 4) * blobs.length)]; set(b.x + (hash(i, 15, 6) - 0.5) * b.r, b.y + (hash(i, 18, 9) - 0.2) * b.r, P.leaf[0]); }
  outline(c, pale ? '#3a4846' : '#0a1a0e');
  return { c, white: whiteOf(c), bx, base, faceY: base - 24 * S, S };
}

RP.drawLifeTree = function (sim, e, lift, flash) {
  if (e.stag || (e.toStage === 3 && e.state === 'transform' && e.st < e.def.phase3.dur * 0.45)) return this.drawWhiteStag(sim, e, lift, flash);
  const pale = !!e.pale, S = pale ? 0.86 : 0.68, key = (pale ? 'p' : 'g') + S;
  this.treeArt = this.treeArt || {};
  const A = this.treeArt[key] || (this.treeArt[key] = paintTree(S, pale));
  const g = this.g, t = sim.t, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift + 3), ox = X - Math.round(A.bx), oy = Y - A.base;
  const top = oy + 6;
  g.save(); g.globalCompositeOperation = 'lighter'; // holy light falling through and behind the crown
  for (let i = 0; i < 6; i++) {
    const a = -0.5 + i * 0.2 + Math.sin(t * 0.4 + i) * 0.04, L = 120;
    g.globalAlpha = (pale ? 0.1 : 0.07) * (0.7 + 0.3 * Math.sin(t * 1.3 + i * 2));
    g.fillStyle = pale ? '#ffffff' : '#fff6c0';
    g.beginPath(); g.moveTo(X + Math.sin(a) * 4, top); g.lineTo(X + Math.sin(a - 0.07) * L, top + Math.cos(a) * L); g.lineTo(X + Math.sin(a + 0.07) * L, top + Math.cos(a) * L); g.fill();
  }
  disc(g, X, oy + A.c.height * 0.35, A.c.width * 0.42, pale ? '#e8f4ff' : '#d8ffb0', pale ? 0.1 : 0.06);
  g.restore();
  const sway = Math.round(Math.sin(t * 0.8) * 0.6);
  g.drawImage(A.c, ox + sway, oy);
  if (flash) { g.globalAlpha = 0.45; g.drawImage(A.white, ox + sway, oy); g.globalAlpha = 1; } // a big thing struck only blanches
  if (!flash) { // its face in the bark, its eyes lit
    const eye = pale ? '#bfe8ff' : e.phase === 2 ? '#ffe070' : '#b8ff90', fy = oy + Math.round(A.faceY), k = 0.7 + 0.3 * Math.sin(t * 2.2);
    for (const ex of [-3, 2]) { glow(g, X + ex + 0.5, fy, 2, eye, 0.5 * k); g.fillStyle = eye; g.fillRect(X + ex, fy, 2, 1); }
    g.fillStyle = pale ? '#5a585e' : '#2a1a0e'; g.fillRect(X - 2, fy + 6, 4, 1);
  }
  for (let i = 0; i < (pale ? 10 : 6); i++) { // motes of light (petals when pale) drifting down
    const u = (t * 0.22 + i / (pale ? 10 : 6)) % 1, mx = X - A.c.width * 0.4 + ((i * 37) % Math.round(A.c.width * 0.8)) + Math.sin(t + i) * 4, my = oy + A.c.height * 0.3 + u * A.c.height * 0.7;
    g.globalAlpha = 0.8 * (1 - u); g.fillStyle = pale ? (i % 2 ? '#ffffff' : '#ffd8ec') : (i % 2 ? '#e8ffb0' : '#fff6c0'); g.fillRect(Math.round(mx), Math.round(my), 1, 1);
  }
  g.globalAlpha = 1;
};

// ---------- the White Stag, the god of the elves ----------
function paintStag(frame) {
  const w = 64, h = 68, sil = mk(w, h), s = sil.getContext('2d'), c = mk(w, h), g = c.getContext('2d');
  s.translate(0, 8); // room above for the rack
  s.fillStyle = '#fff'; s.strokeStyle = '#fff'; s.lineCap = 'round'; s.lineJoin = 'round';
  s.beginPath(); s.ellipse(29, 37, 10.5, 6, -0.04, 0, TAU); s.fill();         // barrel
  s.beginPath(); s.ellipse(37.5, 35, 5, 6.2, 0.1, 0, TAU); s.fill();          // chest
  s.beginPath(); s.ellipse(20.5, 35.5, 5, 5.6, 0, 0, TAU); s.fill();          // haunch
  s.lineWidth = 5; s.beginPath(); s.moveTo(37.5, 33); s.quadraticCurveTo(40, 27, 42.5, 21.5); s.stroke(); // a proud neck
  s.lineWidth = 3.4; s.beginPath(); s.moveTo(38.5, 34); s.lineTo(41.5, 25); s.stroke();
  s.beginPath(); s.ellipse(44, 20, 3.5, 2.8, 0.35, 0, TAU); s.fill();          // head
  s.lineWidth = 2.6; s.beginPath(); s.moveTo(45, 20.5); s.lineTo(48.6, 23); s.stroke(); s.lineWidth = 1.6; s.beginPath(); s.moveTo(46, 21.5); s.lineTo(49, 23.6); s.stroke(); // muzzle
  s.beginPath(); s.ellipse(40.5, 18.6, 2.4, 1, -0.5, 0, TAU); s.fill();        // ear
  s.beginPath(); s.ellipse(15.6, 33.6, 1.8, 1.2, 0.6, 0, TAU); s.fill();       // tail
  const legs = frame ? [[19, 40, 15, 49, 13, 57], [23, 41, 25, 49, 27, 57], [35, 41, 39, 48, 41, 56], [38, 40, 36, 49, 34, 57]]
    : [[19, 40, 18.5, 49, 19, 57], [23, 41, 23.5, 49, 23, 57], [35, 41, 35.5, 49, 35, 57], [38, 40, 38.5, 49, 39, 57]];
  for (const [x0, y0, x1, y1, x2, y2] of legs) { s.lineWidth = 2.1; s.beginPath(); s.moveTo(x0, y0); s.lineTo(x1, y1); s.stroke(); s.lineWidth = 1.1; s.beginPath(); s.moveTo(x1, y1); s.lineTo(x2, y2); s.stroke(); }
  const tips = [];
  const branch = (x, y, a, len, depth) => { // the rack: branching like the trees it came out of
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    s.lineWidth = depth >= 3 ? 1.6 : depth === 2 ? 1.2 : 1; s.beginPath(); s.moveTo(x, y); s.lineTo(x2, y2); s.stroke();
    if (depth > 0) { branch(x2, y2, a - 0.55, len * 0.72, depth - 1); branch(x2, y2, a + 0.38, len * 0.7, depth - 1); } else tips.push([x2, y2]);
  };
  branch(43, 17, -1.3, 9.5, 4); branch(41.5, 17.5, -2.15, 9, 4);
  const d = s.getImageData(0, 0, w, h).data, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 90;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!on(x, y)) continue;
    const top = !on(x, y - 1) || !on(x - 1, y - 1), bot = !on(x, y + 1) || !on(x + 1, y + 1);
    let col = '#eef2ff';
    if (top) col = '#ffffff'; else if (bot) col = '#b4c0e2';
    else if (y > 47 && x > 17 && x < 41 && y < 52) col = '#d2daf2'; // belly in shade
    else if (y > 57) col = '#dce2f4';
    else if (hash(x, y, 21) > 0.93) col = '#ffffff';
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  for (const [x, y] of tips) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), Math.round(y) + 8, 1, 1); }
  outline(c, 'rgba(96,112,170,0.8)');
  g.fillStyle = '#3a4a80'; g.fillRect(45, 27, 1, 1); g.fillStyle = '#6a76a0'; g.fillRect(48, 31, 1, 1); // eye, nose
  g.fillStyle = '#8a94b8'; for (const [, , , , x2, y2] of legs) g.fillRect(Math.round(x2) - 1, Math.round(y2) + 8, 2, 1); // hooves
  return { c, white: whiteOf(c) };
}

RP.drawWhiteStag = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, moving = !!e.dashC || Math.hypot(e.vx || 0, e.vy || 0) > 4 || e.state === 'move';
  this.stagArt = this.stagArt || [paintStag(0), paintStag(1)];
  const A = this.stagArt[moving ? Math.floor(t * 9) % 2 : 0], F = e.fx < 0 ? -1 : 1, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift);
  const rise = e.state === 'transform' ? Math.min(1, 1 - e.st / (e.def.phase3.dur * 0.45)) : 1; // stepping out of the light
  g.save(); g.globalCompositeOperation = 'lighter';
  disc(g, X, Y - 16, 24, '#ffffff', 0.05 * rise); disc(g, X, Y - 16, 15, '#e8f0ff', 0.07 * rise); disc(g, X + F * 10, Y - 40, 18, '#fff8e0', 0.06 * rise);
  const hx = X + F * 12, hy = Y - 41; // the halo, as in the old painting: a ring of fuzzy light behind the head
  disc(g, hx, hy, 13, '#fff4d8', 0.08 * rise);
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * TAU + t * 0.25, rr = 14 + (hash(i, 1, 1) - 0.5) * 4 + Math.sin(t * 3 + i) * 0.5;
    g.globalAlpha = (0.5 + 0.4 * Math.sin(t * 4 + i * 1.7)) * rise; g.fillStyle = i % 3 ? '#fff0c8' : '#ffffff';
    g.fillRect(Math.round(hx + Math.cos(a) * rr), Math.round(hy + Math.sin(a) * rr), 1, 1);
  }
  g.restore();
  g.save(); g.translate(X, Y); g.scale(F, 1); g.globalAlpha = rise; g.drawImage(A.c, -30, -65); if (flash) { g.globalAlpha = 0.6 * rise; g.drawImage(A.white, -30, -65); } g.restore();
  const p = 3.6 + Math.sin(t * 3) * 0.8, stx = X + F * 12, sty = Y - 47; // the star between the antlers
  glow(g, stx, sty, 6, '#fff6d0', 0.9 * rise); star4(g, stx, sty, p + 3, '#fff6d0', 0.9 * rise); star4(g, stx, sty, p * 0.6, '#ffffff', rise);
  if (e.graceT > 0) for (let i = 0; i < 6; i++) { const u = (t * 0.8 + i / 6) % 1; g.globalAlpha = 1 - u; g.fillStyle = '#c8ffb0'; g.fillRect(Math.round(X - 10 + i * 4), Math.round(Y - u * 22), 1, 1); }
  g.globalAlpha = 1;
};

// ---------- the Taiji Venerable: the eclipse given a body ----------
function paintTaiji() {
  const w = 48, h = 62, c = mk(w, h), g = c.getContext('2d'), set = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y) + 4, 1, 1); }; // 4px of headroom
  const skin = v => v > 0.8 ? '#f2f6ff' : v > 0.58 ? '#c9d6ee' : v > 0.38 ? '#9aaad2' : '#6a78a6';
  for (let y = 28; y <= 53; y++) { const u = (y - 28) / 25, hw = 5.5 + u * 8.5; // the robe, dark and falling in folds
    for (let x = Math.floor(24 - hw); x <= Math.ceil(24 + hw); x++) { const s = (x - 24) / hw; let v = 0.46 - s * 0.24 + (Math.sin(x * 1.6 + y * 0.18) > 0.55 ? 0.16 : 0) + (hash(x, y, 4) - 0.5) * 0.14; v = dith(v, x, y); set(x, y, v > 0.6 ? '#403c52' : v > 0.4 ? '#2a2838' : '#16151e'); } }
  for (let x = 12; x <= 36; x++) { const n = hash(x, 2, 8) > 0.45 ? Math.floor(hash(x, 3, 8) * 4) : 0; for (let y = 54; y < 54 + n; y++) set(x, y, '#16151e'); } // a tattered hem
  for (let y = 28; y <= 47; y++) { set(23, y, '#8a6420'); set(24, y, '#f0c860'); set(25, y, '#c8962e'); } // the gold sash
  for (let x = 17; x <= 31; x++) { set(x, 27, '#8a6420'); set(x, 28, x % 3 ? '#f0c860' : '#c8962e'); }
  for (const [x, y] of [[22, 30], [23, 30], [24, 30], [25, 30], [26, 30], [22, 31], [26, 31], [23, 32], [24, 32], [25, 32], [23, 33], [25, 33]]) set(x, y, '#e8e0c8'); // a skull at the clasp
  set(23, 31, '#1a1414'); set(25, 31, '#1a1414'); set(24, 33, '#5a4a3a');
  for (let y = 12; y <= 27; y++) { const u = (y - 12) / 15, hw = 8 - u * 3.6 - (y < 14 ? (14 - y) * 1.6 : 0); // a bare torso, pale blue
    for (let x = Math.floor(24 - hw); x <= Math.ceil(24 + hw); x++) { const s = (x - 24) / Math.max(1, hw); let v = 0.7 - s * 0.32 - Math.abs(s) * 0.12 + (y === 19 && Math.abs(s) < 0.7 ? -0.2 : 0) + (x === 24 && y > 19 ? -0.15 : 0) + (hash(x, y, 9) - 0.5) * 0.1; set(x, y, skin(dith(v, x, y))); } }
  for (const [cx, cy, r] of [[20, 17, 2.5], [28, 21, 2], [19, 23, 1.5]]) for (let a = 0; a < 5; a += 0.35) set(cx + Math.cos(a) * r * (1 - a / 8), cy + Math.sin(a) * r * (1 - a / 8), '#ffffff'); // swirl markings
  for (let i = 0; i < 18; i++) { const x = 16 + i * 0.8, y = 12 + i * 0.85; for (let k = -1; k <= 1; k++) set(x + k, y, k === -1 ? '#c8962e' : '#2a2232'); } // a dark sash over one shoulder
  for (const side of [-1, 1]) for (let y = 13; y <= 36; y++) { // long arms hanging, gold bracers
    const x = 24 + side * (8.5 + (y - 13) * 0.12);
    for (let k = -1; k <= 1; k++) set(x + k, y, y >= 27 && y <= 30 ? (k ? '#c8962e' : '#f0c860') : skin(0.62 - side * k * 0.18 + (y > 33 ? -0.1 : 0)));
  }
  for (const side of [-1, 1]) for (const [dx, dy] of [[0, 37], [side, 38], [-side, 38]]) set(24 + side * 11.6 + dx, dy, skin(0.5)); // long fingers
  for (let y = 9; y <= 12; y++) for (let x = 21; x <= 27; x++) set(x, y, skin(0.56 - (x - 24) * 0.08 - (y === 9 ? 0.15 : 0))); // neck
  for (let y = -1; y <= 9; y++) for (let x = 18; x <= 30; x++) { const dx = (x - 24) / 4.8, dy = (y - 4) / 5.4; if (dx * dx + dy * dy <= 1) set(x, y, skin(0.74 - dx * 0.25 + (y > 6 ? -0.08 : 0) + (y > 8 ? -0.12 : 0))); } // the face
  set(24, 6, '#9aaad2'); set(24, 7, '#7a8ab8'); set(23, 8, '#8a5a6a'); set(24, 8, '#b07a8a'); set(25, 8, '#8a5a6a'); // nose, lips
  outline(c, '#0c0c16');
  // painted big, then brought down to three quarters (smoothly, then alpha snapped) so it stands among the others
  const K = TAIJI_K, sm = mk(Math.round(w * K), Math.round(h * K)), sg = sm.getContext('2d');
  sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high'; sg.drawImage(c, 0, 0, sm.width, sm.height);
  const id = sg.getImageData(0, 0, sm.width, sm.height), dd = id.data;
  for (let i = 3; i < dd.length; i += 4) { if (dd[i] < 110) dd[i] = 0; else { const a = dd[i] / 255; dd[i - 3] = Math.min(255, dd[i - 3] / a); dd[i - 2] = Math.min(255, dd[i - 2] / a); dd[i - 1] = Math.min(255, dd[i - 1] / a); dd[i] = 255; } }
  sg.putImageData(id, 0, 0);
  return { c: sm, white: whiteOf(sm), w: sm.width, h: sm.height };
}
const TAIJI_K = 0.75;
RP.drawTaijiFigure = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t;
  this.taijiArt = this.taijiArt || paintTaiji();
  const A = this.taijiArt, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift - 3 + Math.sin(t * 2) * 1.5), hx = X, hy = Y - 53, yin = !!e.yin;
  // its aura: the cold blue mist of Yin, or the black-gold fire of Yang
  for (let i = 0; i < 16; i++) {
    const u = (t * (yin ? 0.5 : 1.1) + i / 16) % 1, ax = X + Math.sin(i * 2.3 + t) * (9 + u * 4), ay = Y - 6 - u * 46;
    g.globalAlpha = 0.55 * (1 - u); g.fillStyle = yin ? (i % 2 ? '#3a4a8a' : '#c8d8ff') : (i % 2 ? '#141414' : '#ffd84a');
    g.fillRect(Math.round(ax), Math.round(ay), yin ? 2 : 1, yin ? 1 : 2);
  }
  g.globalAlpha = 1;
  const K = TAIJI_K, zoom = () => { g.save(); g.translate(X, Y); g.scale(K, K); g.translate(-X, -Y); };
  zoom();
  // hair, long and white, streaming out to both sides
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1, j = i >> 1, L = 18 + j * 3;
    g.strokeStyle = j % 3 === 0 ? '#c8d4ec' : '#f4f8ff'; g.lineWidth = 1; g.beginPath();
    let x = hx + side * (2 + j * 0.3), y = hy - 1 + j * 0.6; g.moveTo(x, y);
    for (let k = 1; k <= 10; k++) { const u = k / 10; x = hx + side * (3 + u * L * (0.9 + j * 0.05)); y = hy + j * 0.6 + u * (8 + j * 2.6) + Math.sin(t * 2.2 + u * 5 + j) * 2.2 * u; g.lineTo(x, y); }
    g.stroke();
  }
  g.restore();
  g.drawImage(A.c, Math.round(X - A.w / 2), Y - A.h);
  if (flash) { g.globalAlpha = 0.6; g.drawImage(A.white, Math.round(X - A.w / 2), Y - A.h); g.globalAlpha = 1; }
  zoom();
  // the crown: great black petals of the eclipse fanned over the head, curling like slow flames, starry inside
  for (let i = 0; i < 6; i++) {
    const a = Math.PI - 0.15 + i * (Math.PI + 0.3) / 5 + Math.sin(t * 1.1 + i * 1.3) * 0.05, len = i === 2 || i === 3 ? 12 : i === 1 || i === 4 ? 11 : 9, curl = 0.75;
    const L = [], Rr = [];
    for (let k = 0; k <= 9; k++) {
      const u = k / 9, r = 6.5 + u * len, q = a + curl * u * u, wdt = (u < 0.3 ? 1.6 + u * 4 : 2.8 * (1 - (u - 0.3) / 0.7)) + 0.3;
      const cx = hx + Math.cos(q) * r, cy = hy - 1 + Math.sin(q) * r, nx = -Math.sin(q) * wdt, ny = Math.cos(q) * wdt;
      L.push([cx + nx, cy + ny]); Rr.push([cx - nx, cy - ny]);
    }
    g.fillStyle = '#06060c'; g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let k = Rr.length - 1; k >= 0; k--) g.lineTo(Rr[k][0], Rr[k][1]); g.closePath(); g.fill();
    g.strokeStyle = '#2c2c4c'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(L[1][0], L[1][1]); for (const p of L.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); // a rim of cold light on one edge
    for (let k = 2; k < 8; k += 3) { g.globalAlpha = 0.4 + 0.5 * Math.sin(t * 4 + i * 2 + k); g.fillStyle = '#9aa8e8'; const m = L[k], n = Rr[k]; g.fillRect(Math.round((m[0] + n[0]) / 2), Math.round((m[1] + n[1]) / 2), 1, 1); g.globalAlpha = 1; }
  }
  // the eclipse over its eyes, full of stars, and the white sun at its heart
  g.fillStyle = '#07070e'; g.beginPath(); g.ellipse(hx, hy - 0.5, 5.6, 4.2, 0, 0, TAU); g.fill(); g.strokeStyle = '#3a3a6a'; g.lineWidth = 0.6; g.stroke();
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#8a9ad8' : '#ffffff'; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + i * 2); g.fillRect(Math.round(hx - 4 + hash(i, 3, 3) * 8), Math.round(hy - 4 + hash(i, 4, 3) * 6), 1, 1); }
  g.globalAlpha = 1;
  const pulse = 1 + 0.25 * Math.sin(t * 3);
  glow(g, hx, hy - 1, 2.2 * pulse, '#ffffff', 0.6); disc(g, hx, hy - 1, 1.9 * pulse, '#ffffff');
  g.restore();
};
const baseHalo = RP.drawVenerableHalo;
RP.drawVenerableHalo = function (sim, e, lift) {
  if (!(e.taiji || e.spriteNow === 'b_taiji')) return baseHalo.call(this, sim, e, lift);
  const g = this.g, t = sim.t, X = sx(e.x), Y = Math.round(sy(e.y) - lift - 3 + Math.sin(t * 2) * 1.5) - 40; // behind the head and its crown, like a sun
  glow(g, X, Y, 16, e.yin ? '#8aa0ff' : '#ffd84a', 0.14);
  g.globalAlpha = 0.8; g.strokeStyle = '#ffe9a8'; g.lineWidth = 1; g.beginPath(); g.arc(X, Y, 21, 0, TAU); g.stroke(); g.globalAlpha = 1;
  yinyang(g, X, Y, 20, t * 0.7, 1, 0.75);
  for (let i = 0; i < 8; i++) { const a = -t * 0.35 + i * TAU / 8; trigram(g, X + Math.cos(a) * 26, Y + Math.sin(a) * 26, i, '#ffe9a8', 0.85, 5); }
  if (e.state === 'transform') for (let i = 0; i < 12; i++) { const a = t * 2.4 + i * TAU / 12, L = 30 + Math.sin(t * 17 + i) * 10; g.globalAlpha = 0.35; g.strokeStyle = i % 2 ? '#ffffff' : '#141414'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L * 0.75); g.stroke(); }
  g.globalAlpha = 1;
};

// ---------- what the Rabbit looks like in the air, and under each moon ----------
RP.celestialPre = function (sim, e, lift) {
  if (e.landAt) { const u = 1 - e.landAt.t / e.landAt.dur; lift += Math.round(Math.sin(Math.PI * Math.min(1, u)) * 110); }
  if (e.hop) { const u = Math.min(1, e.hop.t / e.hop.dur); lift += Math.round(Math.sin(Math.PI * u) * 12); }
  if (e.def.moonPhases && e.moonPh === 0) this.g.globalAlpha *= 0.45; // the new moon: barely there
  if (e.moonRabbit) this.g.globalAlpha *= 0.85;
  return lift;
};

// ---------- hazards ----------
const fall = k => (1 - k) * (1 - k);
const HZ = {
  sunfall(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ff6a14', 0.12 + k * 0.3, true); E(g, h.x, h.y, h.r, '#ffd84a', 0.5 + k * 0.5, false); E(g, h.x, h.y, h.r * (1 - k), '#fff2b8', 0.8, false);
    const x = sx(h.x), y = sy(h.y) - 6 - fall(k) * 120;
    for (let i = 1; i < 6; i++) disc(g, x + i * 1.5, y - i * 7, 4 - i * 0.5, '#ff8a2a', 0.3 - i * 0.04); // its trail of fire
    sunDisc(g, x, y, 3.5 + k * 3, t);
  },
  greatsun(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ff3a0a', 0.15 + k * 0.35, true); E(g, h.x, h.y, h.r, '#ffd84a', 0.6 + k * 0.4, false, 2); E(g, h.x, h.y, h.r * (1 - k), '#ffffff', 0.8, false);
    g.globalAlpha = 0.15 * k; g.fillStyle = '#ff4a0a'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
    sunDisc(g, sx(h.x), sy(h.y) - 8 - fall(k) * 140, 9 + k * 12, t);
  },
  noonray(g, h, t, k) {
    const x = sx(h.x), y = sy(h.y);
    E(g, h.x, h.y, h.r, '#ffd84a', 0.4 + k * 0.5, false); E(g, h.x, h.y, h.r * 0.4, '#fff2b8', 0.6, true);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.1 + k * 0.5; g.fillStyle = '#fff2b0'; const w = 1 + k * h.r * 0.7; g.fillRect(Math.round(x - w / 2), y - 46, Math.round(w), 46); g.restore();
    sunDisc(g, x, y - 48, 3 + k * 1.5, t);
  },
  prominence(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ff4a1a', 0.18 + k * 0.4, true); E(g, h.x, h.y, h.r, '#ffb040', 0.5 + k * 0.4, false);
    for (let i = 0; i < 3; i++) if (Math.random() < 0.5) { g.fillStyle = i % 2 ? '#ffe14d' : '#ff7a1a'; g.fillRect(Math.round(sx(h.x) + (Math.random() - 0.5) * h.r * 1.4), Math.round(sy(h.y) - Math.random() * 4 * k), 1, 1); }
  },
  lotus(g, h, t, k) {
    const x = sx(h.x), y = sy(h.y);
    E(g, h.x, h.y, h.r, '#9ad0ff', 0.5 + k * 0.4, false);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.5, L = h.r * 0.95 * (0.3 + k * 0.7); g.globalAlpha = 0.35 + k * 0.5; g.fillStyle = i % 2 ? '#e8f4ff' : '#b8dcff'; g.beginPath(); g.ellipse(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 * SQ, L * 0.5, L * 0.18, a, 0, TAU); g.fill(); }
    disc(g, x, y, 1.5 + k * 1.5, '#ffffff', 0.9); g.globalAlpha = 1;
  },
  moonwell(g, h, t, k) {
    const x = sx(h.x), y = sy(h.y);
    E(g, h.x, h.y, h.r, '#101c48', 0.55, true); E(g, h.x, h.y, h.r, '#9ab8ff', 0.6 + k * 0.4, false);
    for (let i = 0; i < 2; i++) E(g, h.x, h.y, h.r * ((t * 0.8 + i * 0.5) % 1), '#c8d8ff', 0.4, false);
    crescent(g, x, y - 1, 2.5 + k * 2, -Math.PI / 2 + Math.sin(t * 3) * 0.2, '#f4f8ff', 0.6 + 0.4 * Math.sin(t * 7));
    if (k > 0.75) { const u = (k - 0.75) / 0.25; g.globalAlpha = u; g.fillStyle = '#e8f0ff'; g.fillRect(Math.round(x - 1), Math.round(y - 14 * u), 3, Math.round(14 * u)); g.globalAlpha = 1; } // her reflection rising out of the water
  },
  crescentfall(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#c8d8ff', 0.4 + k * 0.5, false);
    const x = sx(h.x), y = sy(h.y) - 4 - fall(k) * 70;
    glow(g, x, y, 4, '#9ab8ff', 0.4); crescent(g, x, y, 4.5, Math.PI / 2 + t * 6, '#f4f8ff');
  },
  moonpillar(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#9ab8ff', 0.2 + k * 0.3, true); E(g, h.x, h.y, h.r, '#e8f0ff', 0.5 + k * 0.5, false);
    g.save(); g.globalCompositeOperation = 'lighter'; const x = sx(h.x), w = 1 + k * h.r * 0.9; g.globalAlpha = 0.08 + k * 0.3; g.fillStyle = '#cfe0ff'; g.fillRect(Math.round(x - w / 2), 13, Math.round(w), Math.round(sy(h.y) - 13)); g.restore();
  },
  starfall(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#c8d8ff', 0.4 + k * 0.5, false);
    const x = sx(h.x) + fall(k) * 40, y = sy(h.y) - 4 - fall(k) * 90;
    g.globalAlpha = 0.5; g.strokeStyle = '#c8d8ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y - 22); g.stroke(); g.globalAlpha = 1;
    glow(g, x, y, 3, '#ffffff', 0.6); star4(g, x, y, 3, '#ffffff');
  },
  trigram(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ffd84a', 0.4 + k * 0.6, false); E(g, h.x, h.y, h.r, '#ffe9a8', 0.08 + k * 0.2, true);
    trigram(g, sx(h.x), sy(h.y), h.tri || 0, '#fff4c8', 0.5 + k * 0.5);
  },
  taijiseal(g, h, t, k) { E(g, h.x, h.y, h.r, '#ffffff', 0.5 + k * 0.5, false); yinyang(g, sx(h.x), sy(h.y), h.r * (0.3 + k * 0.7), t * 4, SQ, 0.4 + k * 0.5); },
  genesis(g, h, t, k) {
    glow(g, sx(h.x), sy(h.y) - 4, h.r * k, '#ffffff', 0.3 * k);
    yinyang(g, sx(h.x), sy(h.y), h.r, t * (2 + k * 8), SQ, 0.35 + k * 0.5); E(g, h.x, h.y, h.r, '#ffffff', 0.6 + k * 0.4, false, 2);
  },
  blacksun(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#000000', 0.25 + k * 0.45, true); E(g, h.x, h.y, h.r, '#e8e0ff', 0.6 + k * 0.4, false, 1.5); E(g, h.x, h.y, h.r * (1 - k), '#ffffff', 0.8, false);
    const x = sx(h.x), y = sy(h.y) - 8 - fall(k) * 130, r = 7 + k * 9;
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const a = t * 0.8 + i * TAU / 16, L = r * (1.4 + 0.4 * Math.sin(t * 7 + i * 3)); g.globalAlpha = 0.45; g.strokeStyle = i % 2 ? '#ffffff' : '#c8b8ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } g.restore();
    disc(g, x, y, r + 1, '#ffffff', 0.9); disc(g, x, y, r, '#000000');
  },
  sym_dragon(g, h, t, k) { sym(g, h, t, k, '#4ac0ff', '龙'); }, sym_tiger(g, h, t, k) { sym(g, h, t, k, '#f4f4f4', '虎'); },
  sym_bird(g, h, t, k) { sym(g, h, t, k, '#ff4a2a', '雀'); }, sym_tortoise(g, h, t, k) { sym(g, h, t, k, '#3ad0b0', '龟'); },
  goldpearl(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ffd84a', 0.15 + k * 0.35, true); E(g, h.x, h.y, h.r, '#fff2b8', 0.6 + k * 0.4, false, 2);
    g.globalAlpha = 0.8; g.strokeStyle = '#c8901c'; g.setLineDash([3, 3]); g.lineDashOffset = -t * 30; g.beginPath(); g.ellipse(sx(h.x), sy(h.y), h.r * 0.8, h.r * 0.8 * SQ, 0, 0, TAU); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    const x = sx(h.x), y = sy(h.y) - 10 - fall(k) * 120, r = 6 + k * 10;
    glow(g, x, y, r * 1.3, '#ffd84a', 0.7); disc(g, x, y, r, '#ffb52e'); disc(g, x - r * 0.2, y - r * 0.2, r * 0.7, '#ffe08a'); disc(g, x - r * 0.35, y - r * 0.35, r * 0.3, '#ffffff');
  },
  mortar(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#3a3a4a', 0.2 + k * 0.3, true); E(g, h.x, h.y, h.r, '#e8e8f0', 0.5 + k * 0.5, false); E(g, h.x, h.y, h.r * (1 - k), '#ffffff', 0.7, false);
    const x = Math.round(sx(h.x)), y = Math.round(sy(h.y) - 4 - fall(k) * 100);
    g.fillStyle = '#d8d0c0'; g.fillRect(x - 2, y - 10, 4, 10); g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 10, 1, 10); g.fillStyle = '#8a8478'; g.fillRect(x - 3, y, 6, 2); // the pestle, coming down
    g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; for (const o of [-4, 4]) g.fillRect(x + o, y - 18, 1, 6); g.globalAlpha = 1;
  },
  elixir(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#3aff8a', 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r, '#b8ffd0', 0.5 + k * 0.5, false);
    const x = Math.round(sx(h.x) - fall(k) * 30), y = Math.round(sy(h.y) - 4 - Math.sin(Math.PI * k) * 26 - fall(k) * 20);
    g.fillStyle = '#e8e0d0'; g.fillRect(x - 2, y - 4, 4, 4); g.fillStyle = '#c23b22'; g.fillRect(x - 1, y - 6, 2, 2); g.fillStyle = '#3aff8a'; g.fillRect(x - 1, y - 3, 2, 2);
  },
  pollen(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#ffe070', 0.25 + k * 0.4, false);
    for (let i = 0; i < 18; i++) { const a = hash(i, 1, h.x | 0) * TAU + t * 0.6, rr = hash(i, 2, h.y | 0) * h.r; g.globalAlpha = (0.35 + 0.5 * k) * (0.6 + 0.4 * Math.sin(t * 6 + i)); g.fillStyle = i % 3 ? '#ffe070' : '#ffffff'; g.fillRect(Math.round(sx(h.x + Math.cos(a) * rr)), Math.round(sy(h.y + Math.sin(a) * rr) - 2 - Math.sin(t * 2 + i) * 2), 1, 1); }
    g.globalAlpha = 1;
  },
  antler(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#e8f0ff', 0.35 + k * 0.5, false);
    if (k > 0.5) { const u = (k - 0.5) * 2, x = Math.round(sx(h.x)), y = Math.round(sy(h.y)); g.fillStyle = '#ffffff'; g.fillRect(x, y - Math.round(6 * u), 1, Math.round(6 * u)); g.fillRect(x - 2, y - Math.round(4 * u), 1, Math.round(3 * u)); g.fillRect(x + 2, y - Math.round(5 * u), 1, Math.round(3 * u)); }
  },
  holystar(g, h, t, k) {
    E(g, h.x, h.y, h.r, '#fff6d0', 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r, '#ffffff', 0.6 + k * 0.4, false, 2);
    const x = sx(h.x), y = sy(h.y) - 10 - fall(k) * 110, s = 6 + k * 10;
    glow(g, x, y, s, '#fff6d0', 0.8); star4(g, x, y, s, '#fff6d0'); star4(g, x, y, s * 0.55, '#ffffff');
  },
  fullmoon(g, h, t, k) { E(g, h.x, h.y, h.r * k, '#e8e8ff', 0.8, false, 1.5); E(g, h.x, h.y, h.r, '#c8c8e8', 0.3, false); },
  hop() {}, inkhop() {}, hollowburst() {},
};
for (const v of ['wood', 'fire', 'earth', 'metal', 'water']) HZ['pearl_' + v] = (g, h, t, k) => {
  const [c1, c2] = PEARL[v];
  E(g, h.x, h.y, h.r, c1, 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r, c2, 0.5 + k * 0.5, false);
  const x = sx(h.x), y = sy(h.y) - 8 - fall(k) * 100;
  for (let i = 1; i < 5; i++) disc(g, x, y - i * 6, 3 - i * 0.5, c1, 0.3);
  glow(g, x, y, 5, c1, 0.6); disc(g, x, y, 4, c1); disc(g, x - 1, y - 1, 2.4, c2); disc(g, x - 1.5, y - 1.5, 1, '#ffffff');
};
function sym(g, h, t, k, col, ch) { // one of the Four Symbols, its beast's character burning in the floor
  E(g, h.x, h.y, h.r, col, 0.12 + k * 0.3, true); E(g, h.x, h.y, h.r, col, 0.6 + k * 0.4, false, 1.5);
  glow(g, sx(h.x), sy(h.y) - 4, 6 + k * 4, col, 0.4 * k);
  g.globalAlpha = 0.5 + k * 0.5; g.fillStyle = '#ffffff'; g.font = '9px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, Math.round(sx(h.x)), Math.round(sy(h.y) - 3)); g.globalAlpha = 1;
}
RP.celestialHazard = function (h, t) {
  if (h.kind !== 'sigil' || !HZ[h.variant]) return false;
  HZ[h.variant](this.g, h, t, Math.max(0, Math.min(1, 1 - h.t / (h.delay || 1))));
  return true;
};

// ---------- beams ----------
const BEAMS = {
  starbeam: ['#e8f0ff', '#ffffff'], stagray: ['#d8ffd0', '#ffffff'], eclipsebeam: ['#7a4aff', '#ffffff'], coronabeam: ['#ffe9a8', '#ffffff'],
  yangbeam: ['#f4f0e6', '#ffffff'], yinbeam: ['#2a1a4a', '#c8b8ff'], trigrambeam: ['#ffd84a', '#fff4c8'], moonlance: ['#9ab8ff', '#ffffff'],
};
const baseBeam = RP.drawBeam;
RP.drawBeam = function (h, t) {
  const st = BEAMS[h.variant];
  if (!st) return baseBeam.call(this, h, t);
  const g = this.g, k = Math.max(0, Math.min(1, 1 - h.t / h.delay)), x0 = sx(h.x), y0 = sy(h.y) - 4, x1 = sx(h.x + Math.cos(h.a) * h.len), y1 = sy(h.y + Math.sin(h.a) * h.len) - 4;
  const nx = -Math.sin(h.a) * h.w / 2, ny = Math.cos(h.a) * h.w / 2 * SQ;
  g.globalAlpha = 0.06 + k * 0.18; g.fillStyle = st[0];
  g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.lineTo(x1 - nx, y1 - ny); g.lineTo(x0 - nx, y0 - ny); g.fill();
  g.globalAlpha = 0.4 + k * 0.6; g.strokeStyle = st[0]; g.lineWidth = 1; g.setLineDash([2, 2]); g.lineDashOffset = -t * 30;
  g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.moveTo(x0 - nx, y0 - ny); g.lineTo(x1 - nx, y1 - ny); g.stroke(); g.setLineDash([]);
  g.strokeStyle = st[1]; g.globalAlpha = 0.5 + k * 0.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); g.stroke(); // the line of light drawing itself
  g.globalAlpha = 1;
};

// ---------- projectiles ----------
const trail = (g, pr, col, n = 4, r = 2) => { const sp = Math.hypot(pr.vx, pr.vy) || 1; for (let i = 1; i <= n; i++) disc(g, sx(pr.x - pr.vx / sp * i * 3), sy(pr.y - pr.vy / sp * i * 3) - 5, r * (1 - i / (n + 1)), col, 0.35 * (1 - i / (n + 1))); };
const PROJ = {
  goldcrow(g, pr, t) { // a three-legged crow of fire
    const x = sx(pr.x), y = sy(pr.y) - 6, a = Math.atan2(pr.vy * SQ, pr.vx), f = Math.sin(t * 16 + pr.x) * 3.5;
    trail(g, pr, '#ff7a1a', 5, 2.5); glow(g, x, y, 4, '#ff8a2a', 0.6);
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = '#ff6a14'; g.beginPath(); g.moveTo(-1, 0); g.lineTo(-4, -1 - Math.abs(f)); g.lineTo(-2, 0); g.lineTo(-4, 1 + Math.abs(f)); g.fill(); // wings
    disc(g, 0, 0, 2, '#ffb52e'); disc(g, 2, 0, 1.2, '#fff2b8'); g.fillStyle = '#141414'; g.fillRect(2, -1, 1, 1);
    g.fillStyle = '#ffd84a'; for (const o of [-1, 0, 1]) g.fillRect(-1, o + 1, 1, 1); // three legs
    g.restore();
  },
  sunwheel(g, pr, t) {
    const x = sx(pr.x), y = sy(pr.y) - 6; glow(g, x, y, 6, '#ff8a2a', 0.6);
    disc(g, x, y, 4.5, '#ff6a14'); disc(g, x, y, 3.2, '#ffd84a');
    g.strokeStyle = '#fff6c8'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = t * 22 + i * TAU / 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5); g.stroke(); }
    for (let i = 0; i < 8; i++) { const a = -t * 14 + i * TAU / 8; g.fillStyle = i % 2 ? '#ffe14d' : '#ff3a0a'; g.fillRect(Math.round(x + Math.cos(a) * 5.6), Math.round(y + Math.sin(a) * 5.6), 1, 1); }
  },
  sunspot(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6; glow(g, x, y, 4, '#ff7a1a', 0.5); disc(g, x, y, 3, '#ff6a14'); disc(g, x, y, 1.8, '#3a1408'); trail(g, pr, '#ff8a2a', 3, 1.5); },
  crescent(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6, a = Math.atan2(pr.vy * SQ, pr.vx); trail(g, pr, '#9ab8ff', 4, 2.5); glow(g, x, y, 4, '#9ab8ff', 0.5); crescent(g, x, y, 4, a, '#f4f8ff'); },
  yangfish(g, pr, t) { fish(g, pr, t, '#f4f0e6', '#141414', '#ffd84a'); },
  yinfish(g, pr, t) { fish(g, pr, t, '#141414', '#f4f0e6', '#8a6aff'); },
  starmote(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6, s = 2 + Math.sin(t * 12 + pr.x) * 0.7; glow(g, x, y, 3, '#fff6d0', 0.5); star4(g, x, y, s, '#ffffff'); },
};
function fish(g, pr, t, body, eye, aura) { // one of the two fish of the taiji
  const x = sx(pr.x), y = sy(pr.y) - 6, a = Math.atan2(pr.vy * SQ, pr.vx);
  trail(g, pr, aura, 5, 2.4); glow(g, x, y, 4, aura, 0.55);
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = body;
  g.beginPath(); g.arc(1, 0, 2.8, -Math.PI / 2, Math.PI / 2); g.quadraticCurveTo(-3, 2.5 + Math.sin(t * 14) * 1.2, -6, Math.sin(t * 14)); g.quadraticCurveTo(-3, -2.5 + Math.sin(t * 14) * 1.2, 1, -2.8); g.fill();
  g.strokeStyle = aura; g.lineWidth = 0.5; g.stroke();
  g.fillStyle = eye; g.fillRect(1, -1, 1, 1); g.restore();
}
const baseProj = RP.drawProjectile;
RP.drawProjectile = function (pr, t) { const f = PROJ[pr.kind]; if (!f) return baseProj.call(this, pr, t); f(this.g, pr, t); };

// ---------- the Two Poles, painted to match the floor the sim turns ----------
RP.drawTwoPoles = function (sim) {
  const P = sim.twoPoles, g = this.g, t = sim.t, a = P.a ?? (P.a0 + P.t * 1.2), k = Math.min(1, P.t / 0.5, (P.dur - P.t) / 0.5), r = R - 2, dot = P.dot || 12, enh = P.enh;
  g.save(); g.translate(sx(0), sy(0)); g.scale(1, SQ); g.rotate(a);
  // the white half (frost) is +v, the black half (black flame) is -v; the dots sit on the axis at +-r/2
  g.globalAlpha = 0.5 * k; yinyang(g, 0, 0, r, 0, 1, 0.5 * k, '#f4f0e6', '#0c0c10');
  g.globalAlpha = 0.9 * k; g.strokeStyle = enh ? '#ffd84a' : '#c8c8d8'; g.lineWidth = enh ? 2 : 1.4; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  // the S that divides them, burning
  g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.globalAlpha = (0.5 + 0.4 * Math.sin(t * 12)) * k;
  g.beginPath(); g.arc(r / 2, 0, r / 2, Math.PI, TAU); g.arc(-r / 2, 0, r / 2, 0, Math.PI); g.stroke();
  for (let i = 0; i < 8; i++) { // the eight trigrams round the rim, turning with the floor
    const q = i * TAU / 8 + Math.PI / 8; g.save(); g.translate(Math.cos(q) * (r - 7), Math.sin(q) * (r - 7)); g.rotate(q + Math.PI / 2);
    trigram(g, 0, 0, i, enh ? '#ffd84a' : '#d8d0c0', 0.85 * k, 8); g.restore();
  }
  for (const [u, col, ring] of [[r / 2, '#0c0c10', '#ffffff'], [-r / 2, '#f4f0e6', '#141414']]) { // the dots: safe ground, pulsing
    const pulse = 1 + 0.12 * Math.sin(t * 8);
    g.globalAlpha = k; g.fillStyle = col; g.beginPath(); g.arc(u, 0, dot, 0, TAU); g.fill();
    g.strokeStyle = '#ffd84a'; g.lineWidth = 1.4; g.globalAlpha = (0.6 + 0.4 * Math.sin(t * 8)) * k; g.beginPath(); g.arc(u, 0, dot * pulse, 0, TAU); g.stroke();
    g.strokeStyle = ring; g.lineWidth = 0.8; g.globalAlpha = 0.5 * k; g.beginPath(); g.arc(u, 0, dot + 3 + (t * 10 % 4), 0, TAU); g.stroke();
  }
  g.restore(); g.globalAlpha = 1;
  if (enh) { // the outer ring turns the other way
    g.globalAlpha = 0.6 * k; g.strokeStyle = '#ffd84a'; g.setLineDash([4, 3]); g.lineDashOffset = t * 40 * (P.dir || 1); g.beginPath(); g.ellipse(sx(0), sy(0), R + 3, (R + 3) * SQ, 0, 0, TAU); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  }
  if (Math.random() < 0.9) for (let i = 0; i < 3; i++) { // frost on the white half, black fire on the black
    const q = Math.random() * TAU, rr = Math.sqrt(Math.random()) * r, wx = Math.cos(q) * rr, wy = Math.sin(q) * rr, white = (wx * -Math.sin(a) + wy * Math.cos(a)) > 0;
    this.parts.push(white ? { kind: 'px', x: sx(wx), y: sy(wy), vx: (Math.random() - 0.5) * 6, vy: -6, life: 0.6, max: 0.6, color: '#e8f4ff' } : { kind: 'px', x: sx(wx), y: sy(wy), vx: 0, vy: -26 - Math.random() * 20, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#141414' : '#5a2a8a' });
  }
};

// ---------- spectacles: the great ultimates over the whole stage ----------
const SUN_SKY = i => [40 + i * 22, 24 - Math.sin(i / 8 * Math.PI) * 7];
RP.drawSpectacles = function (sim, layer) {
  const L = sim.spectacles; if (!L || !L.length) return;
  const g = this.g, t = sim.t;
  for (const S of L) {
    const k = Math.min(1, S.t / 0.4, (S.dur - S.t) / 0.4), e = S.owner;
    if (layer === 'back') {
      if (S.kind === 'ninesuns') {
        g.globalAlpha = (S.enh ? 0.22 : 0.13) * k; g.fillStyle = S.enh ? '#ff2a0a' : '#ff7a1a'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        for (let i = 0; i < 9; i++) {
          const f = S.fallen && S.fallen[i], rekindled = S.enh && S.t > 3.0 && f != null && f < 2.9, inSky = f == null || (rekindled && !(S.fallen2 && S.fallen2[i]));
          if (!inSky) continue;
          const [x, y] = SUN_SKY(i), rise = Math.min(1, S.t / (0.3 + i * 0.05));
          sunDisc(g, x, y + (1 - rise) * 20, 3.6 + Math.sin(t * 4 + i) * 0.4, t + i, rise * k);
        }
        if (S.enh && S.t > 3.3 && S.t < 5.2) sunDisc(g, W / 2, 26, Math.min(15, (S.t - 3.3) * 9), t, k); // the great sun gathers
      }
      if (S.kind === 'night' || S.kind === 'rabbitmoon' || S.kind === 'inkmoon') {
        g.globalAlpha = (S.kind === 'night' ? (S.enh ? 0.7 : 0.55) : 0.4) * k; g.fillStyle = '#02041a'; g.fillRect(0, 13, W, H - 13);
        for (let i = 0; i < 46; i++) { g.globalAlpha = k * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i * 7.3))); g.fillStyle = i % 5 ? '#c8d8ff' : '#ffffff'; g.fillRect(Math.round(hash(i, 1, 77) * W), Math.round(14 + hash(i, 2, 77) * 60), 1, 1); }
        const mx = S.kind === 'night' ? 196 : W / 2, my = 34, mr = S.kind === 'night' ? (S.enh ? 19 : 15) : 17;
        glow(g, mx, my, mr * 1.3, '#c8d8ff', 0.5 * k);
        disc(g, mx, my, mr, '#f4f6ff', k); disc(g, mx - mr * 0.3, my + mr * 0.2, mr * 0.22, '#d0d8ec', k); disc(g, mx + mr * 0.35, my - mr * 0.25, mr * 0.16, '#d0d8ec', k); disc(g, mx + mr * 0.1, my + mr * 0.45, mr * 0.12, '#d0d8ec', k);
        if (S.kind === 'rabbitmoon') { const up = Math.abs(Math.sin(t * 6)) * 3; g.globalAlpha = 0.7 * k; g.fillStyle = '#9aa2bc'; g.fillRect(mx - 4, my + 2, 5, 5); g.fillRect(mx - 3, my - 2, 1, 4); g.fillRect(mx - 1, my - 2, 1, 4); g.fillRect(mx + 3, my - 3 - up, 2, 8); g.fillRect(mx + 2, my + 5, 6, 2); g.globalAlpha = 1; } // the rabbit pounding the elixir
        if (S.kind === 'inkmoon') { const u = Math.min(1, S.t / (S.dur * 0.6)); disc(g, mx - mr * 2 + u * mr * 2, my, mr * 1.05, '#000000', k); for (let i = 0; i < 5; i++) { g.globalAlpha = k; g.fillStyle = '#000'; g.fillRect(Math.round(mx - mr + i * mr * 0.4), my + mr - 2, 2, Math.round(4 + ((t * 20 + i * 9) % 18))); } } // the ink eats it, and drips
        if (S.kind === 'night' && S.enh) for (let i = 0; i < 4; i++) { const u = (t * 0.7 + i / 4) % 1; g.globalAlpha = (1 - u) * k; g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(30 + i * 50 + u * 60, 16 + u * 50); g.lineTo(30 + i * 50 + u * 60 - 8, 16 + u * 50 - 6); g.stroke(); } // stars falling
        g.globalAlpha = 1;
      }
      if (S.kind === 'eclipse') {
        g.globalAlpha = 0.6 * k; g.fillStyle = '#000000'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        const x = W / 2, y = 30, r = 13;
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 24; i++) { const a = t * 0.5 + i * TAU / 24, L = r * (1.5 + 0.6 * Math.abs(Math.sin(t * 3 + i * 1.7))); g.globalAlpha = 0.5 * k; g.strokeStyle = i % 3 ? '#e8e0ff' : '#ffffff'; g.lineWidth = i % 4 ? 1 : 2; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
        g.restore();
        disc(g, x, y, r + 1.5, '#ffffff', k); disc(g, x, y, r, '#000000', k);
        const da = t * 1.3; glow(g, x + Math.cos(da) * r, y + Math.sin(da) * r, 3, '#ffffff', k); // the diamond ring
      }
      if (S.kind === 'genesis') {
        const T = S.t;
        if (T < 1.0) { g.globalAlpha = Math.max(0, 1 - T) * 0.9; g.fillStyle = '#ffffff'; g.fillRect(0, 13, W, H - 13); } // Wuji: nothing but light
        g.globalAlpha = 0.5 * k; g.fillStyle = '#000000'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        if (T > 0.8) yinyang(g, sx(0), sy(0), Math.min(R - 4, (T - 0.8) * 80), t * 1.5, SQ, 0.35 * k); // Taiji
        if (T > 3.4 && T < 4.8) { const u = Math.min(1, (T - 3.4) / 0.3); [['#4ac0ff', 1, 0], ['#ff4a2a', 0, 1], ['#f4f4f4', -1, 0], ['#3ad0b0', 0, -1]].forEach(([c, dx, dy]) => glow(g, sx(dx * (R - 10)), sy(dy * (R - 10)), 10 * u, c, 0.45 * k)); } // the Four Symbols at the quarters
        if (T > 4.5) for (let i = 0; i < 8; i++) { const a = t * 0.6 + i * TAU / 8; trigram(g, sx(Math.cos(a) * (R - 6)), sy(Math.sin(a) * (R - 6)), i, '#ffe9a8', k, 9); } // the Eight Trigrams
      }
      if (S.kind === 'stagnova' && e) {
        g.globalAlpha = 0.12 * k; g.fillStyle = '#fff8e0'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        const x = sx(e.x), y = sy(e.y) - 30, rr = 28 + Math.sin(t * 2) * 2;
        for (let i = 0; i < 120; i++) { const a = i / 120 * TAU + t * 0.3, q = rr + (hash(i, 9, 9) - 0.5) * 6; g.globalAlpha = k * (0.3 + 0.5 * Math.abs(Math.sin(t * 3 + i))); g.fillStyle = i % 4 ? '#fff4d8' : '#ffffff'; g.fillRect(Math.round(x + Math.cos(a) * q), Math.round(y + Math.sin(a) * q * 0.85), 1, 1); }
        glow(g, x, y - 10, 10, '#fff6d0', 0.7 * k); star4(g, x, y - 10, 9 + Math.sin(t * 5), '#ffffff', k);
        g.globalAlpha = 1;
      }
      if (S.kind === 'pull') { for (let i = 0; i < 3; i++) E(g, S.x, S.y, R * (1 - ((S.t * 2 + i / 3) % 1)), '#ffffff', 0.5 * k, false); }
    } else { // top
      if (S.kind === 'dragoncoil') { // the Golden Dragon's body ringing the stage, closing in; outside it, nothing is safe
        g.save(); g.beginPath(); g.rect(0, 13, W, H - 13); g.ellipse(sx(0), sy(0), S.r, S.r * SQ, 0, 0, TAU); g.globalAlpha = 0.22 * k; g.fillStyle = '#ff3a0a'; g.fill('evenodd'); g.restore();
        const n = 110;
        for (let i = 0; i < n; i++) {
          const q = i / n * TAU, x = sx(Math.cos(q) * S.r), y = sy(Math.sin(q) * S.r), seg = Math.floor(i + S.a * 14) % 4;
          disc(g, x, y - 4, 4.2, seg === 0 ? '#c8901c' : '#ffcc40', k); disc(g, x, y - 2.5, 1.6, '#fff3c0', k * 0.9);
          if (seg === 0 && i % 2 === 0) { g.globalAlpha = k; g.fillStyle = '#ff7a2a'; g.fillRect(Math.round(x), Math.round(y - 9), 1, 2); } // the dorsal crest
        }
        g.globalAlpha = 1;
        const hq = S.a, hx = sx(Math.cos(hq) * S.r), hy = sy(Math.sin(hq) * S.r) - 6;
        glow(g, hx, hy, 8, '#ffd84a', 0.6 * k);
        this.dragonHead(hx, hy, -Math.sin(hq) >= 0 ? 1 : -1, EASTERN_DRAGONS.emperor({ stage: 3 }), 1.6, Math.floor(t * 4) % 2);
      }
      if (S.kind === 'hollowsun') {
        const u = Math.min(1, S.t / S.dur), x = sx(S.x), y = sy(S.y) - 4;
        for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + t * 3, rr = 40 * (1 - ((S.t * 1.8 + i / 14) % 1)); g.globalAlpha = 0.7; g.fillStyle = i % 2 ? '#ffffff' : '#8a6aff'; g.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * SQ), 1, 1); }
        glow(g, x, y, 6 + u * 4, '#8a6aff', 0.6); disc(g, x, y, 5 + u * 4, '#ffffff', 0.9); disc(g, x, y, 4 + u * 4, '#000000');
        g.globalAlpha = 1;
      }
    }
  }
  if (layer === 'top') for (const e of sim.enemies) if (e.def.moonPhases && !e.dead) { // the moon over the Rabbit's head, in its phase
    const x = Math.round(sx(e.x)), y = Math.round(sy(e.y)) - 20, ph = e.moonPh || 0;
    disc(g, x, y, 2.6, '#2a2e44', 0.8);
    if (ph === 2) { glow(g, x, y, 3, '#ffe8e8', 0.6); disc(g, x, y, 2.6, '#fff6f0'); }
    else if (ph === 1) crescent(g, x, y, 2.6, 0, '#f4f6ff');
    else if (ph === 3) crescent(g, x, y, 2.6, Math.PI, '#f4f6ff');
    if (ph === 2) { g.globalAlpha = 0.3 + 0.2 * Math.sin(t * 10); g.strokeStyle = '#ff6a6a'; g.beginPath(); g.ellipse(sx(e.x), sy(e.y), 9, 9 * SQ, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; }
  }
};

// ---------- events: bursts, beams, rises and shifts ----------
RP.cburst = function (x, y, n, speed, cols, life = 0.5, grav = 0) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = speed * (0.3 + Math.random() * 0.7); this.parts.push({ kind: 'px', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - grav * 0.3, g: grav, life, max: life, color: cols[i % cols.length] }); } };
const BURST = {
  sunfall: ['#ffffff', '#ffd84a', '#ff7a1a', '#ff3a0a'], greatsun: ['#ffffff', '#ffd84a', '#ff7a1a', '#ff3a0a'], noonray: ['#ffffff', '#fff2b8', '#ffd84a'], prominence: ['#ffe14d', '#ff7a1a', '#ff3a0a'],
  lotus: ['#ffffff', '#d8ecff', '#9ad0ff'], moonwell: ['#ffffff', '#c8d8ff', '#3a5aaa'], crescentfall: ['#ffffff', '#c8d8ff'], moonpillar: ['#ffffff', '#cfe0ff', '#9ab8ff'], starfall: ['#ffffff', '#c8d8ff'],
  trigram: ['#fff4c8', '#ffd84a'], taijiseal: ['#ffffff', '#141414', '#ffd84a'], genesis: ['#ffffff', '#141414', '#ffd84a', '#8a6aff'], blacksun: ['#000000', '#ffffff', '#c8b8ff', '#5a2a8a'],
  sym_dragon: ['#4ac0ff', '#ffffff'], sym_tiger: ['#f4f4f4', '#c8c8c8'], sym_bird: ['#ff4a2a', '#ffd84a'], sym_tortoise: ['#3ad0b0', '#1a3a4a'],
  goldpearl: ['#ffffff', '#ffd84a', '#ffb52e', '#ff7a2a'], mortar: ['#ffffff', '#c8c8d8', '#8a8478'], elixir: ['#3aff8a', '#b8ffd0', '#ffffff'], pollen: ['#ffe070', '#ffffff'],
  antler: ['#ffffff', '#e8f0ff'], holystar: ['#ffffff', '#fff6d0', '#d8ffd0'], fullmoon: ['#ffffff', '#ffe8e8'], hop: ['#e8e8f0', '#a8a0b0'], inkhop: ['#141414', '#3a3a40'], hollowburst: ['#000000', '#ffffff', '#8a6aff'],
};
for (const v of ['wood', 'fire', 'earth', 'metal', 'water']) BURST['pearl_' + v] = [...PEARL[v], '#ffffff'];
const BIG = { greatsun: 22, goldpearl: 22, blacksun: 20, genesis: 20, holystar: 14, moonpillar: 8, sunfall: 9, hollowburst: 12, mortar: 6 };
RP.celestialEvent = function (ev) {
  const x = sx(ev.x), y = sy(ev.y) - 4;
  if (ev.type === 'sigilburst' && BURST[ev.variant]) {
    const cols = BURST[ev.variant], big = BIG[ev.variant] || 0, r = ev.r || 10;
    this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: r * 0.3, r1: r * 1.35, life: 0.35, max: 0.35, color: cols[0] });
    this.cburst(x, y, 10 + Math.round(r * 1.2), 60 + r * 5, cols, 0.5, ev.variant === 'pollen' ? 0 : 60);
    if (['sunfall', 'greatsun', 'noonray', 'moonpillar', 'holystar', 'goldpearl', 'starfall', 'genesis', 'blacksun'].includes(ev.variant) || ev.variant.startsWith('pearl_')) this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: cols[0], life: 0.3, max: 0.3, w: Math.max(3, r * 0.5) });
    if (big) { this.shake = Math.max(this.shake, big); this.flash(ev.variant === 'blacksun' ? 'rgba(0,0,0,0.7)' : ev.variant === 'genesis' ? 'rgba(255,255,255,0.8)' : 'rgba(255,240,200,0.45)', 0.12 + big / 100); }
    if (ev.variant === 'greatsun' || ev.variant === 'goldpearl' || ev.variant === 'genesis' || ev.variant === 'blacksun') this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: r, r1: r * 3, life: 0.6, max: 0.6, color: cols[1] });
    this.snd(ev.variant.includes('sun') || ev.variant.includes('pearl') || big > 10 ? 'ultboom' : ev.variant === 'mortar' ? 'thud' : /moon|lotus|star|crescent/.test(ev.variant) ? 'chime' : 'magic');
    return true;
  }
  if (ev.type === 'beamhit' && BEAMS[ev.variant]) {
    const [c1, c2] = BEAMS[ev.variant];
    (this.cparts = this.cparts || []).push({ kind: 'beam', x0: sx(ev.x), y0: sy(ev.y) - 4, x1: sx(ev.x1), y1: sy(ev.y1) - 4, w: ev.w || 8, c1, c2, life: 0.32, max: 0.32 });
    this.shake = Math.max(this.shake, 3); this.snd('laser');
    return true;
  }
  const cp = (o) => (this.cparts = this.cparts || []).push(o);
  switch (ev.type) {
    case 'stagrise': this.flash('rgba(255,255,255,0.9)', 0.5); this.shake = Math.max(this.shake, 14); this.cburst(x, y - 10, 90, 160, ['#ffffff', '#fff6d0', '#d8ffd0'], 1.2, -20); this.banner = { text: 'THE WHITE STAG', life: 2.4, small: true, color: '#ffffff', kicker: 'THE GOD OF THE ELVES', lore: 'THE TREE WAS ONLY WHERE IT SLEPT' }; this.snd('ultboom'); return true;
    case 'taijishift': cp({ kind: 'text', x, y: y - 56, text: ev.yin ? 'YIN' : 'YANG', color: ev.yin ? '#9ab8ff' : '#ffd84a', life: 1, max: 1 }); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 30, life: 0.45, max: 0.45, color: ev.yin ? '#9ab8ff' : '#ffd84a' }); this.snd('chime'); return true;
    case 'moonphase': cp({ kind: 'text', x, y: y - 24, text: { new: 'NEW MOON', waxing: 'WAXING', full: 'FULL MOON', waning: 'WANING' }[ev.ph], color: ev.ph === 'full' ? '#ff8a8a' : '#e8e8ff', life: 1.1, max: 1.1 }); if (ev.ph === 'full') { this.flash('rgba(255,230,230,0.3)', 0.12); this.snd('roar'); } return true;
    case 'inversion': this.flash('rgba(255,255,255,0.75)', 0.08); cp({ kind: 'swap', x0: x, y0: y, x1: sx(ev.tx), y1: sy(ev.ty) - 4, life: 0.45, max: 0.45 }); this.shake = Math.max(this.shake, 6); this.snd('warp'); return true;
    case 'pushhands': this.parts.push({ kind: 'ring', x: ev.x + ev.ux * 10, y: ev.y + ev.uy * 10, r0: 2, r1: 16, life: 0.3, max: 0.3, color: ev.pull ? '#141414' : '#ffffff' }); this.cburst(x + ev.ux * 10, y + ev.uy * 6, 12, 90, ['#ffffff', '#141414'], 0.35); this.snd('heavyhit'); return true;
    case 'sanctuary': for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4 + i * 8, r1: (ev.big ? 70 : 50) + i * 6, life: 0.6 + i * 0.15, max: 0.6 + i * 0.15, color: i % 2 ? '#d8ffb0' : '#fff6d0' }); this.flash('rgba(220,255,200,0.25)', 0.12); this.snd('holy'); return true;
    case 'polesreverse': this.flash('rgba(255,255,255,0.5)', 0.1); this.shake = Math.max(this.shake, 8); this.banner = { text: 'THE POLES TURN BACK', life: 1.2, small: true, color: '#ffd84a' }; this.snd('ultboom'); return true;
    case 'hollowsun': this.snd('warp'); return true;
    case 'eclipseeye': glowFlash(this, x, y - 50); this.snd('laser'); return true;
    case 'starcharge': this.cburst(x, y - 40, 14, 40, ['#ffffff', '#fff6d0'], 0.5); this.snd('holy'); return true;
    case 'crowcry': this.cburst(x, y - 4, 10, 60, ['#ffd84a', '#ff7a1a'], 0.4); this.snd('fire'); return true;
    case 'elixirthrow': case 'moonrabbits': case 'grace': this.cburst(x, y, 10, 50, ev.type === 'grace' ? ['#d8ffb0', '#ffffff'] : ['#ffffff', '#e8e8f0', '#3aff8a'], 0.5); this.snd('magic'); return true;
    case 'rabbitleap': this.cburst(x, y + 4, 16, 70, ['#e8e8f0', '#a8a0b0'], 0.4, 80); this.snd('whoosh'); return true;
    case 'rabbitland': this.shake = Math.max(this.shake, 6); return true;
    case 'stagcharge': this.snd('whoosh'); return true;
    case 'stagtrail': this.parts.push({ kind: 'px', x: x + (Math.random() - 0.5) * 6, y: y - Math.random() * 14, vx: 0, vy: -10, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ffffff' : '#fff6d0' }); return true;
    case 'taijipulse': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: 22, life: 0.3, max: 0.3, color: '#ffffff' }); return true;
    case 'spectacle': this.shake = Math.max(this.shake, 6); if (ev.kind === 'ninesuns') this.flash('rgba(255,160,60,0.4)', 0.15); if (ev.kind === 'genesis' || ev.kind === 'stagnova') this.flash('rgba(255,255,255,0.7)', 0.2); if (ev.kind === 'eclipse' || ev.kind === 'night') this.flash('rgba(0,0,0,0.6)', 0.15); return true;
  }
  return false;
};
function glowFlash(r, x, y) { r.cburst(x, y, 16, 80, ['#ffffff', '#8a6aff'], 0.4); }
RP.drawCelestialParts = function (dt) {
  const L = this.cparts; if (!L || !L.length) return;
  const g = this.g;
  for (const p of L) {
    p.life -= dt; const k = Math.max(0, p.life / p.max);
    if (p.kind === 'beam') {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      g.globalAlpha = 0.5 * k; g.strokeStyle = p.c1; g.lineWidth = p.w * (0.6 + k); g.beginPath(); g.moveTo(p.x0, p.y0); g.lineTo(p.x1, p.y1); g.stroke();
      g.globalAlpha = k; g.strokeStyle = p.c2; g.lineWidth = Math.max(1, p.w * 0.35 * k); g.beginPath(); g.moveTo(p.x0, p.y0); g.lineTo(p.x1, p.y1); g.stroke(); g.restore();
    } else if (p.kind === 'text') {
      g.globalAlpha = Math.min(1, k * 2); this.text(p.text, Math.round(p.x), Math.round(p.y - (1 - k) * 6), p.color, 'center'); g.globalAlpha = 1;
    } else if (p.kind === 'swap') {
      g.globalAlpha = k; g.strokeStyle = '#ffffff'; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(p.x0, p.y0); g.lineTo(p.x1, p.y1); g.stroke(); g.setLineDash([]); g.strokeStyle = '#141414'; g.beginPath(); g.moveTo(p.x0, p.y0 + 1); g.lineTo(p.x1, p.y1 + 1); g.stroke(); g.globalAlpha = 1;
    }
  }
  this.cparts = L.filter(p => p.life > 0);
};
})();
