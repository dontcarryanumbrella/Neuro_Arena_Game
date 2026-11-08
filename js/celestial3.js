// Celestial art, third pass. Tamamo-no-Mae at a lady's size and the Heavenly Fox painted fur by fur; the Yellow Spring
// Ancestor redrawn small and hand-placed; the Sword Without a Head kept to the Sword Immortal's own shape, all in ink;
// and the Fourteenth Sword: Cut as a full cinematic (the world drained to ink on paper, focus lines, the lock, impact
// frames, the page split along the line, ink thrown off the cut, the sheathe). Loaded after celestial2.js.
(() => {
const RP = Renderer.prototype, { TAU, hash, mk, whiteOf, outline, disc, glow, E } = CEL;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = u => 1 - Math.pow(1 - clamp(u), 3);
const flipOf = c => { const o = mk(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; };
const art = (c, ax) => { const w = whiteOf(c); return { c, f: flipOf(c), white: w, whiteF: flipOf(w), ax, w: c.width, h: c.height }; };
// a hand-placed pixel map (one character a pixel), padded by one for its outline; ax is the column its feet stand on
const fromMap = (rows, pal, edge, ax) => {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), c = mk(w + 2, h + 2), g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x + 1, y + 1, 1, 1); } } });
  if (edge) outline(c, edge);
  return art(c, ax + 1);
};
// draw art standing at (X, Y = its feet), facing F; returns its top-left
const put = (g, A, X, Y, F, flash, a = 1) => {
  const x = F > 0 ? X - A.ax : X - (A.w - 1 - A.ax), y = Y - A.h + 2;
  g.globalAlpha = a; g.drawImage(F > 0 ? A.c : A.f, x, y);
  if (flash) { g.globalAlpha = 0.65 * a; g.drawImage(F > 0 ? A.white : A.whiteF, x, y); }
  g.globalAlpha = 1; return [x, y];
};
const px = (g, x, y, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.globalAlpha = 1; };
const line = (g, x0, y0, x1, y1, col, w = 1, a = 1) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.globalAlpha = 1; };
const lit = (g, fn) => { g.save(); g.globalCompositeOperation = 'lighter'; fn(g); g.restore(); };
// signed distances, for the painted figures
const sdEll = (x, y, cx, cy, rx, ry, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy, u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry; return (Math.hypot(u, v) - 1) * Math.min(rx, ry); };
const sdCap = (x, y, x0, y0, x1, y1, r0, r1 = r0) => { const vx = x1 - x0, vy = y1 - y0, h = clamp(((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy)); return Math.hypot(x - x0 - vx * h, y - y0 - vy * h) - (r0 + (r1 - r0) * h); };
const sdTri = (x, y, ax, ay, bx, by, cx, cy) => {
  const e = [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]]; let d = 1e9, s = 0;
  for (const [x0, y0, x1, y1] of e) { const vx = x1 - x0, vy = y1 - y0, h = clamp(((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy)); d = Math.min(d, Math.hypot(x - x0 - vx * h, y - y0 - vy * h)); if ((vx * (y - y0) - vy * (x - x0)) > 0) s++; }
  return (s === 3 || s === 0) ? -d : d;
};
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };

// =====================================================================================================
// Tamamo-no-Mae: a lady in red, no taller than a cultivator. White fox ears through black hair, a gold hairpin hung with
// beads, a white fur stole, a red hanfu with a gold sash and a hem stitched in gold; a folding fan in her hand.
// =====================================================================================================
const LADY_PAL = {
  e: '#fbf6f4', E: '#f08aa8', k: '#1a1420', K: '#4a3a5c', y: '#e8b030', Y: '#fff0a0', f: '#ffe8da', F: '#eab49c', m: '#c8102a', x: '#2a0810',
  l: '#ff3048', w: '#ffffff', W: '#d2cadc', r: '#d8281c', R: '#ff6a46', d: '#8e1012', D: '#4a080c', b: '#1c0a10', p: '#ffc8c8',
};
const LADY = [
  '...e...e.....',
  '..eEe.eEe....',
  '..ekkkkke....',
  '.ykKKKkkkk...',
  'yYkkkkkkkFk..',
  '.ykkkkkfffF..',
  '..kkkkfxffx..',
  '..kkkkfffmf..',
  '..kkkkkFflf..',
  '..kkkwwwwww..',
  '.kkkwWwwwwWw.',
  '.kkdrWwpprwWw',
  '.kdrRrWprrrwW',
  '.dddyYyyyyydd',
  '.ddrRrrrrrRrd',
  '.drRrrrrrrrRd',
  'ddrRrrrrrrrRrd',
  'drRrrrrrrrrrRd',
  'bYbybYbybYbybY',
];
RP.drawFoxLady = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift - 1 + Math.sin(t * 2) * 0.8), F = e.fx < 0 ? -1 : 1;
  const A = this.ladyArt || (this.ladyArt = fromMap(LADY, LADY_PAL, '#1c0608', 6));
  const [x0, y0] = put(g, A, X, Y, F, flash);
  if (Math.floor(t * 3.1 + e.id) % 9 === 0) { const ex = F > 0 ? x0 + 8 : x0 + A.w - 9; px(g, ex, y0 + 7, '#ffe8da'); px(g, ex + 3 * F, y0 + 7, '#ffe8da'); } // she blinks
  // the gold hairpin's beads, swinging
  const hx = F > 0 ? x0 + 1 : x0 + A.w - 2, sw = Math.round(Math.sin(t * 3) * 0.6);
  for (let i = 0; i < 3; i++) px(g, hx - F * (1 + sw * (i > 1 ? 1 : 0)), y0 + 7 + i, i === 2 ? '#d8281c' : '#ffe9a0');
  // the fan: red paper on dark ribs, a gold edge and a flame painted on it; snapped open and raised when she casts
  const casting = e.state === 'wind' || e.state === 'ult', open = casting ? 1 : 0.6 + 0.25 * Math.sin(t * 2.4), fx = X + F * 5, fy = Y - (casting ? 12 : 9), R0 = 5.5;
  const a0 = F > 0 ? (casting ? -1.9 : -0.9) : (casting ? -1.24 : -2.24), half = 0.4 + open * 0.75;
  g.fillStyle = '#5a0a0c'; g.beginPath(); g.moveTo(fx, fy); g.arc(fx, fy, R0 + 0.6, a0 - half, a0 + half); g.closePath(); g.fill();
  g.fillStyle = '#d8281c'; g.beginPath(); g.moveTo(fx, fy); g.arc(fx, fy, R0, a0 - half, a0 + half); g.closePath(); g.fill();
  g.fillStyle = '#ff6a46'; g.beginPath(); g.arc(fx, fy, R0, a0 - half, a0); g.arc(fx, fy, 2, a0, a0 - half, true); g.closePath(); g.fill();
  for (let i = -3; i <= 3; i++) line(g, fx, fy, fx + Math.cos(a0 + i * half / 3) * R0, fy + Math.sin(a0 + i * half / 3) * R0, '#3a0608', 0.35, 0.8);
  g.strokeStyle = '#f0c040'; g.lineWidth = 0.7; g.beginPath(); g.arc(fx, fy, R0, a0 - half, a0 + half); g.stroke();
  px(g, fx + Math.cos(a0) * 3.4, fy + Math.sin(a0) * 3.4, '#ffd84a'); px(g, fx + Math.cos(a0 + 0.3) * 4.2, fy + Math.sin(a0 + 0.3) * 4.2, '#ffffff');
  px(g, fx, fy, '#f0c040');
  if (casting) glow(g, fx + Math.cos(a0) * 3, fy + Math.sin(a0) * 3, 3, '#ff9ad8', 0.35);
  if (Math.random() < 0.3) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 14, y: Y - 4 - Math.random() * 14, vx: 0, vy: -10, life: 0.6, max: 0.6, color: ['#9ad8ff', '#ff9ad8', '#c8ff9a', '#ffd84a'][Math.floor(Math.random() * 4)] }); // foxfire of every colour
};
// her tails, white and full, edged so each one reads, with foxfire burning at the tips (the Heavenly Fox draws her own)
RP.drawFoxTails = function (sim, e, lift) {
  const g = this.g, t = sim.t, owner = e.mirrorOf != null ? sim.enemies.find(o => o.id === e.mirrorOf) : e;
  const n = (owner && owner.tails) || 1; if (n >= 9) return;
  const F = e.fx < 0 ? 1 : -1, x0 = sx(e.x) + F * 2, y0 = sy(e.y) - lift - 5, L = 11;
  const tipCol = ['#9ad8ff', '#ff9ad8', '#c8ff9a', '#ffd84a', '#b89aff', '#ff8a6a', '#9affe0', '#ffffff'];
  const tails = [];
  for (let i = 0; i < n; i++) {
    const spread = n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.7, a = -Math.PI / 2 + F * 1.15 + spread + Math.sin(t * 2 + i * 0.9) * 0.15, pts = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8, aa = a + Math.sin(u * 2.5 + t * 1.5 + i) * 0.35 * u - F * u * 0.4; pts.push([x0 + Math.cos(aa) * L * u, y0 + Math.sin(aa) * L * u * 0.9]); }
    tails.push(pts);
  }
  const W = u => 2.8 * Math.sin(Math.PI * (0.2 + u * 0.75)) + 0.9;
  g.lineCap = 'round';
  for (const [pass, col, dw] of [[0, '#6a5470', 1.4], [1, '#e8e0ee', 0], [2, '#ffffff', -1.2]]) for (const pts of tails) for (let k = 0; k < 8; k++) {
    const u = k / 8; g.strokeStyle = pass === 1 && u > 0.75 ? '#f8e8f0' : col; g.lineWidth = Math.max(0.5, W(u) + dw); g.beginPath(); g.moveTo(pts[k][0] + (pass === 2 ? -0.4 : 0), pts[k][1] + (pass === 2 ? -0.5 : 0)); g.lineTo(pts[k + 1][0] + (pass === 2 ? -0.4 : 0), pts[k + 1][1] + (pass === 2 ? -0.5 : 0)); g.stroke();
  }
  tails.forEach((pts, i) => { const [tx, ty] = pts[8]; glow(g, tx, ty, 2.4, tipCol[i % 8], 0.55); px(g, tx, ty - 1 - (Math.floor(t * 8 + i) % 2), tipCol[i % 8]); });
};

// =====================================================================================================
// The Heavenly Fox: a white fox standing tall, painted pixel by pixel in moonlit fur (lavender in the shadows), red
// markings at the eye and brow, a red cord and a gold bell at the throat; nine great tails fanned behind it like white
// fire, every tail clumped and edged, its tip burning blue-white; foxfire circling it.
// =====================================================================================================
const FUR = ['#433a62', '#655c88', '#8c86ae', '#b3aecc', '#d6d3e8', '#eeedf7', '#ffffff'];
const FOX_NEAR = (x, y) => {
  let d = sdEll(x, y, -3, -17, 12, 6, -0.06);
  d = smin(d, sdEll(x, y, 7, -20, 6, 8.5, 0.3), 3);
  d = smin(d, sdEll(x, y, -11, -17.5, 7, 7.2), 3);
  d = smin(d, sdCap(x, y, 8, -24, 12.5, -32, 4.4, 3.1), 2.5);
  d = smin(d, sdEll(x, y, 13.6, -34, 4.7, 3.8, 0.1), 2);
  d = smin(d, sdCap(x, y, 15, -33.6, 22.6, -31.4, 2.4, 0.9), 1.5);
  d = smin(d, sdCap(x, y, 15, -32, 20, -30.2, 1.6, 0.7), 1);
  d = Math.min(d, sdTri(x, y, 13, -36.2, 16.4, -46.5, 17.8, -35.8));                 // the near ear
  d = smin(d, sdCap(x, y, 9, -16, 10, -6, 2.4, 1.6), 1.5); d = Math.min(d, sdCap(x, y, 10, -6, 10.6, -1, 1.6, 1.3)); d = Math.min(d, sdEll(x, y, 11.6, -0.9, 2.1, 1.1));
  d = smin(d, sdCap(x, y, -12, -14, -7.5, -6.5, 3.5, 1.8), 2); d = Math.min(d, sdCap(x, y, -7.5, -6.5, -9.5, -1, 1.7, 1.3)); d = Math.min(d, sdEll(x, y, -8.6, -0.9, 2.1, 1.1));
  d = Math.min(d, sdTri(x, y, 11, -25, 14.5, -16.5, 8.5, -18.5)); d = Math.min(d, sdTri(x, y, 12.5, -21, 13.5, -13, 9.5, -15)); // the ruff at its chest
  d = Math.min(d, sdTri(x, y, 11.5, -33.5, 8, -27.5, 12.5, -30.5));                    // a tuft at the cheek
  d = Math.min(d, sdTri(x, y, -6, -12, -2, -9.5, -9, -11.5)); d = Math.min(d, sdTri(x, y, 2, -12, 5, -9.5, -1, -11.2)); // fur hanging from the belly
  return d;
};
const FOX_FAR = (x, y) => Math.min(sdTri(x, y, 10.4, -36.8, 11.8, -45.5, 14.4, -37.4), sdCap(x, y, 5, -15, 4, -6, 2.0, 1.4), sdCap(x, y, 4, -6, 4.6, -1, 1.4, 1.2), sdEll(x, y, 5.6, -0.9, 1.9, 1),
  sdCap(x, y, -7, -13, -3.5, -6, 2.6, 1.5), sdCap(x, y, -3.5, -6, -4.6, -1, 1.4, 1.2), sdEll(x, y, -3.8, -0.9, 1.9, 1));
function paintHeavenly(S) {
  const Wd = Math.ceil(50 * S) + 4, Hd = Math.ceil(50 * S) + 3, ox = Math.round(22 * S) + 2, oy = Hd - 2;
  const c = mk(Wd, Hd), g = c.getContext('2d'), set = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const at = (x, y) => [Math.round(ox + x * S), Math.round(oy + y * S)];
  for (let py = 0; py < Hd; py++) for (let qx = 0; qx < Wd; qx++) {
    const x = (qx - ox) / S, y = (py - oy) / S, dn = FOX_NEAR(x, y), df = dn < 0 ? 1 : FOX_FAR(x, y);
    if (dn >= 0 && df >= 0) continue;
    const fn = dn < 0 ? FOX_NEAR : FOX_FAR, d = Math.min(dn, df), q = 0.5;
    let nx = fn(x + q, y) - fn(x - q, y), ny = fn(x, y + q) - fn(x, y - q); const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const li = nx * -0.55 + ny * -0.83, depth = -d, edge = clamp(1.25 - depth / 3.5);
    let v = 0.74 + 0.32 * li * edge - (y + 25) / 220 + (hash(Math.floor((x - y * 0.55) * 1.2), Math.floor(y * 0.6), 5) - 0.5) * 0.16 + (hash(qx, py, 9) - 0.5) * 0.06;
    if (dn >= 0) v -= 0.24;                                         // the far legs and ear, in shadow
    if (y > -15 && y < -9 && x > -9 && x < 6) v -= 0.12;            // under the belly
    if (depth < 0.9 && li < -0.2) v -= 0.12;                       // a dark rim where the fur turns away
    set(qx, py, FUR[clamp(Math.floor(v * FUR.length + dith(qx, py) - 0.5), 0, FUR.length - 1)]);
  }
  // the inside of the near ear
  for (let py = 0; py < Hd; py++) for (let qx = 0; qx < Wd; qx++) { const x = (qx - ox) / S, y = (py - oy) / S; if (sdTri(x, y, 14.2, -37, 16.2, -44.2, 17, -37) < -0.15) set(qx, py, (qx + py) % 2 ? '#f2a6c0' : '#d77a9c'); }
  // the face: the eye a red-gold slit, red lines swept back from it, a flame on the brow, the black nose
  const [ex, ey] = at(15.4, -34.8); set(ex, ey, '#2a0810'); set(ex + 1, ey, '#ff4a3a'); set(ex + 2, ey - 1, '#c8102a');
  for (const [x, y] of [[13.8, -35.6], [12.6, -36.2], [11.6, -36.6], [14.2, -33.4], [12.8, -32.8]]) { const [q, r] = at(x, y); set(q, r, '#d81830'); }
  for (const [x, y] of [[14.8, -37.6], [15.2, -38.6], [14.4, -38.4], [15.6, -39.8]]) { const [q, r] = at(x, y); set(q, r, '#ff2a40'); }
  { const [q, r] = at(22.6, -31.6); set(q, r, '#2a2030'); set(q - 1, r, '#5a4a6a'); }
  { const [q, r] = at(19, -30.3); set(q, r, '#8a7aa0'); }
  // a red cord at the throat with a gold bell, and a red stripe down the near foreleg
  for (let i = 0; i <= 6; i++) { const u = i / 6, [q, r] = at(7.4 + u * 6, -26.4 + Math.sin(u * 3.1) * 1.6 + u * 1.5); set(q, r, '#c81828'); }
  { const [q, r] = at(11.6, -22.6); set(q, r, '#ffd84a'); set(q + 1, r, '#c8901a'); set(q, r + 1, '#c8901a'); set(q + 1, r + 1, '#7a4a10'); }
  for (let i = 0; i < 4; i++) { const [q, r] = at(9.6 + i * 0.1, -12 + i * 1.4); set(q, r, i % 2 ? '#d81830' : '#ff4a5a'); }
  outline(c, '#221a34');
  return { ...art(c, ox), eye: [ex + 1, ey], brow: at(15, -38.8), bell: at(11.6, -22.6), oy, ox };
}
// nine tails, drawn each frame onto their own small page (so they sway), crisp-edged
RP.heavenlyTails = function (S, t, F) {
  const key = 'hfTails' + S, Wb = Math.ceil(100 * S), Hb = Math.ceil(92 * S), bx = Wb - Math.round(34 * S), by = Hb - Math.round(26 * S);
  const buf = this[key] || (this[key] = mk(Wb, Hb)), b = buf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, Wb, Hb);
  const tips = [], order = [0, 8, 1, 7, 2, 6, 3, 5, 4];
  for (const i of order) {
    const a0 = -1.25 - i * 0.25 + (i % 2 ? 0.07 : -0.05), L = (30 + [6, 2, 9, 4, 11, 3, 8, 1, 5][i]) * S, Wm = (8 + (i % 2) * 1.0) * S, N = 26, pts = [];
    let x = bx, y = by, a = a0;
    for (let k = 0; k <= N; k++) {
      const u = k / N; pts.push([x, y, u]);
      a = a0 + (-0.95 + i * 0.16) * u * (0.4 + 0.6 * u) + Math.sin(u * 2.6 - t * 1.6 + i * 0.8) * 0.3 * u + Math.sin(t * 0.9 + i) * 0.05; x += Math.cos(a) * L / N; y += Math.sin(a) * L / N; // the high tails sweep back, the low ones lift: a flame
    }
    const wid = u => Wm * (u < 0.62 ? 0.42 + 0.58 * Math.sin(u / 0.62 * Math.PI / 2) : 1 - Math.pow((u - 0.62) / 0.38, 2) * 0.62); // bushy: widest past the middle, the end rounded
    const nrm = k => { const p = pts[Math.max(0, k - 1)], q = pts[Math.min(N, k + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l, dx / l, dy / l]; };
    const tip = u => u > 0.8;
    // its edge (with clumps of fur standing off it), its body, its lit side, a bright streak along its crest
    for (const pass of [0, 1, 2, 3]) for (let k = 0; k <= N; k++) {
      const [x0, y0, u] = pts[k], w = wid(u) / 2, [nx, ny, tx, ty] = nrm(k), up = ny < 0 ? 1 : -1, tp = tip(u);
      if (pass === 0) {
        disc(b, x0, y0, w + 1.2, tp ? '#3a5a90' : '#3a3058');
        if (k % 5 === 2 && u > 0.15 && u < 0.9) disc(b, x0 + nx * (w + 0.3) * up - tx * S, y0 + ny * (w + 0.3) * up - ty * S, 1.5 * S + 0.6, '#3a3058'); // a tuft along its crest
      } else if (pass === 1) {
        disc(b, x0, y0, w, tp ? (u > 0.9 ? '#c8f0ff' : '#dce6f6') : '#a8a2c4');
        if (k % 5 === 2 && u > 0.15 && u < 0.9) disc(b, x0 + nx * (w + 0.3) * up - tx * S, y0 + ny * (w + 0.3) * up - ty * S, 1.5 * S - 0.3, '#d8d4ea');
      } else if (pass === 2) disc(b, x0 + nx * w * 0.3 * up, y0 + ny * w * 0.3 * up, w * 0.62, tp ? '#f0faff' : '#e4e2f0');
      else disc(b, x0 + nx * w * 0.45 * up, y0 + ny * w * 0.45 * up, w * 0.26, '#ffffff');
    }
    tips.push([pts[N][0] - bx, pts[N][1] - by, i]);
  }
  // crisp: no half-covered pixels
  const im = b.getImageData(0, 0, Wb, Hb), d = im.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0; b.putImageData(im, 0, 0);
  return { buf, bx, by, tips, flip: null };
};
RP.drawHeavenlyFox = function (sim, e, lift, flash, S0 = 1, alpha = 1) {
  const g = this.g, t = sim.t, F = e.fx < 0 ? -1 : 1, S = S0 >= 1.5 ? 1 : 0.66, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift - (S === 1 ? 2 : 1) + Math.sin(t * 1.8) * 0.8);
  const A = (this.hfArt = this.hfArt || {})[S] || (this.hfArt[S] = paintHeavenly(S));
  g.save(); g.globalAlpha = alpha;
  // moonlight round it, and a pale ring behind its head
  lit(g, c => { const gr = c.createRadialGradient(X - F * 4 * S, Y - 26 * S, 2, X - F * 4 * S, Y - 26 * S, 46 * S); gr.addColorStop(0, 'rgba(200,220,255,0.32)'); gr.addColorStop(0.5, 'rgba(160,170,255,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = alpha; c.fillStyle = gr; c.fillRect(X - 50 * S, Y - 76 * S, 100 * S, 80 * S); });
  if (S === 1) { g.globalAlpha = 0.35 * alpha; g.strokeStyle = '#e8f0ff'; g.lineWidth = 1; g.beginPath(); g.ellipse(X + F * 12, Y - 38, 10 + Math.sin(t * 2) * 0.5, 10, 0, 0, TAU); g.stroke(); g.globalAlpha = alpha; }
  // the tails, behind it
  const T = this.heavenlyTails(S, t, F), rx = X + F * Math.round(-15 * S), ry = Y + Math.round(-20 * S);
  g.save(); g.translate(rx, ry); g.scale(F, 1); g.drawImage(T.buf, -T.bx, -T.by); g.restore();
  if (flash) { g.globalAlpha = 0.5 * alpha; g.save(); g.globalCompositeOperation = 'lighter'; g.translate(rx, ry); g.scale(F, 1); g.drawImage(T.buf, -T.bx, -T.by); g.restore(); g.globalAlpha = alpha; }
  // the body
  const [x0, y0] = put(g, A, X, Y, F, flash, alpha);
  // live light: foxfire at every tail's tip, the eye and the brow burning, the bell catching the light
  for (const [tx, ty, i] of T.tips) {
    const qx = rx + F * tx, qy = ry + ty, fl = Math.floor(t * 10 + i * 3) % 3;
    glow(g, qx, qy, 2.4 * S + 1, i % 3 === 1 ? '#ffb0e0' : '#9ad8ff', 0.32 * alpha);
    px(g, qx, qy - 1 - fl, '#ffffff', alpha); px(g, qx + (fl === 1 ? 1 : -1), qy - 2 - fl, '#bfefff', 0.8 * alpha);
  }
  const P = ([q, r]) => [F > 0 ? x0 + q : x0 + A.w - 1 - q, y0 + r];
  { const [q, r] = P(A.eye); glow(g, q, r, 1.5 * S, '#ff3a2a', 0.45 * alpha); px(g, q, r, '#ffe0a0', alpha); }
  { const [q, r] = P(A.brow); glow(g, q, r, 1.8 * S, '#ff2a50', (0.4 + 0.25 * Math.sin(t * 4)) * alpha); }
  { const [q, r] = P(A.bell); if (Math.floor(t * 2) % 4 === 0) px(g, q, r, '#ffffff', alpha); }
  g.restore(); g.globalAlpha = 1;
  // foxfire circling it (the true fox only)
  if (S === 1) for (let i = 0; i < 7; i++) {
    const a = t * 0.9 + i * TAU / 7, qx = X - F * 4 + Math.cos(a) * 30, qy = Y - 18 + Math.sin(a) * 9 - Math.sin(t * 3 + i) * 2, back = Math.sin(a) < 0, col = ['#9ad8ff', '#c8b0ff', '#ff9ad8'][i % 3];
    glow(g, qx, qy, back ? 2.4 : 3.4, col, back ? 0.35 : 0.6);
    const h = 3 + (Math.floor(t * 12 + i) % 2); for (let k = 0; k < h; k++) px(g, qx + (k === h - 1 ? Math.round(Math.sin(t * 9 + i)) : 0), qy - k, k === 0 ? col : '#ffffff', back ? 0.5 : 1);
  }
  if (Math.random() < 0.35 * alpha) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 50 * S - F * 10 * S, y: Y - Math.random() * 56 * S, vx: 0, vy: -8, life: 0.8, max: 0.8, color: Math.random() < 0.5 ? '#ffffff' : '#bfe4ff' });
};

// =====================================================================================================
// The Yellow Spring Ancestor, drawn small. Phase 1: an old ferryman in grey layered robes under a black board of eyes,
// a long paper talisman hung over his face, a bamboo fishing pole held out over the water. Phase 2: the river's true
// shape: a tall hooded grey figure, faceless, a high collar studded in gold, pale hands folded over dark ones, ribbons of
// eyes wound round its hood and reaching out, and one eye open in its chest.
// =====================================================================================================
const ANC_PAL = {
  K: '#0e0e12', k: '#24242c', y: '#c8962e', Y: '#f0c860', p: '#eaa392', P: '#c27a66', q: '#7a2418', m: '#3a3a44', M: '#56566a',
  f: '#d8c8b0', F: '#a08e78', g: '#9a9aa6', G: '#c8c8d2', 1: '#141419', 2: '#24242e', 3: '#373744', 4: '#4e4e60', 5: '#6a6a80', h: '#d8c4a0', H: '#a08a68',
};
const ANC1 = [
  '..yKKKKKKKKKKKy..',
  '..KkkkkkkkkkkkK..',
  '..yKKKKKKKKKKKy..',
  '.....MmppPmm.....',
  '.....mfpqPfm.....',
  '.....mfpppFm.....',
  '......gpPPg......',
  '....45gpqPg432...',
  '...4554pPP44432..',
  '..45544ppP444432.',
  '.4554444pP443332.',
  '.4554444pqP4h332.',
  '.45544y4pppPyhH2.',
  '..4442.4pPP3.222.',
  '...44.44pqP43.2..',
  '.....454pPP433...',
  '.....4544pP4332..',
  '....45444q443332.',
  '....455444443332.',
  '...44554444433322',
  '...1111111111111..',
];
// the true shape is drawn as its left half and mirrored, the far side a shade darker
const sym = half => half.map(r => r + [...r.slice(0, -1)].reverse().map(c => /[2-6]/.test(c) ? String(+c - 1) : c).join(''));
const ANC2_PAL = { ...ANC_PAL, 1: '#26262e', 2: '#3a3a44', 3: '#52525e', 4: '#6e6e7c', 5: '#8e8e9e', 6: '#b2b2c2', h: '#ecd8b8', H: '#bca07a', D: '#050508', o: '#16161c' };
const ANC2 = sym([
  '........6',
  '.......56',
  '......456',
  '.....4566',
  '.....45oo',
  '....45oDD',
  '....45oDD',
  '....456oo',
  '..2345566',
  '.234y5566',
  '.23455556',
  '23455556y',
  '2345.4555',
  '234H.4555',
  '.2hh.4555',
  '..h..3455',
  '....23455',
  '....23455',
  '...234455',
  '...234555',
  '..2344555',
  '..23.45.5',
  '.2..3..4.',
]);
RP.drawAncestor = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift), F = e.fx < 0 ? -1 : 1, two = e.phase === 2;
  this.ancArt3 = this.ancArt3 || [fromMap(ANC1, ANC_PAL, '#07070a', 8), fromMap(ANC2, ANC2_PAL, '#07070a', 8)];
  const A = this.ancArt3[two ? 1 : 0], br = Math.round(Math.sin(t * 1.4) * 0.6);
  E(g, e.x, e.y, 11, '#c8a030', 0.22, true); E(g, e.x, e.y, 6 + ((t * 6) % 6), '#e8c860', 0.3 * (1 - ((t * 6) % 6) / 6), false); // yellow water round his feet
  if (!two) {
    const [x0, y0] = put(g, A, X, Y + br, F, flash);
    const C = q => F > 0 ? x0 + q : x0 + A.w - 1 - q;
    // the eyes on the board, opening and closing out of time with each other
    for (const [q, ph] of [[4, 0], [9, 1.7], [14, 3.1]]) { const open = Math.sin(t * 1.3 + ph) > -0.6, ex = C(q), ey = y0 + 2; if (open) { px(g, ex - 1, ey, '#e8e0c8'); px(g, ex, ey, '#1a1a2a'); px(g, ex + 1, ey, '#e8e0c8'); px(g, ex, ey - 1, '#c8962e', 0.7); } else line(g, ex - 1.5, ey + 0.5, ex + 1.5, ey + 0.5, '#c8962e', 1, 0.8); }
    // the fishing pole: bamboo, knotted, bending out over the water; its line sways, and its lure is a golden eye
    const hx = C(15), hy = y0 + 13, tx = X + F * 26, ty = Y - 30 + Math.sin(t * 1.1) * 1.5;
    g.strokeStyle = '#3a2a14'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + tx) / 2, ty + 4, tx, ty); g.stroke();
    g.strokeStyle = '#a07a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + tx) / 2, ty + 4, tx, ty); g.stroke();
    for (let i = 1; i < 5; i++) { const u = i / 5, q = (1 - u) * (1 - u) * hx + 2 * u * (1 - u) * (hx + tx) / 2 + u * u * tx, r = (1 - u) * (1 - u) * hy + 2 * u * (1 - u) * (ty + 4) + u * u * ty; px(g, q, r, '#e8c870'); }
    const sw = Math.sin(t * 1.4) * 3, lx = tx + F * 2 + sw, ly = Y - 4 + Math.sin(t * 2.2);
    g.globalAlpha = 0.75; g.strokeStyle = '#e8e0c0'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + F * 3, (ty + ly) / 2, lx, ly); g.stroke(); g.globalAlpha = 1;
    glow(g, lx, ly, 2.6, '#ffd84a', 0.55); disc(g, lx, ly, 1.6, '#e8b830'); px(g, lx, ly, '#2a1a08'); px(g, lx - 1, ly - 1, '#fff4c0');
    for (let i = 0; i < 2; i++) { const u = (t * 0.8 + i * 0.5) % 1; g.globalAlpha = 0.5 * (1 - u); g.strokeStyle = '#ffe9a0'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(lx, ly + 3, 2 + u * 6, (2 + u * 6) * 0.35, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; } // rings where the lure sits in the water
    if (Math.random() < 0.08) this.parts.push({ kind: 'px', x: C(9), y: y0 + 22, vx: 0, vy: 6, life: 0.8, max: 0.8, color: '#eaa392' }); // the talisman flutters
  } else {
    // the river's true shape: ribbons of eyes trailing behind it like arms, the hooded body, a band of eyes across its brow
    const ribbon = (pts, w, front) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = '#4a2e10'; g.lineWidth = w + 1.2; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = front ? '#e0b060' : '#b88a44'; g.lineWidth = w; g.stroke();
      for (let i = 2; i < pts.length - 1; i += 3) { const open = Math.sin(t * 2 + i * 1.3 + pts[i][0] * 0.3) > -0.6; if (open) { px(g, pts[i][0], pts[i][1], '#fffaf0'); px(g, pts[i][0] + 1, pts[i][1], '#c23b22'); } else px(g, pts[i][0], pts[i][1], '#6a4a1a'); }
    };
    const top = Y + br - 24;
    for (const s of [-1, 1]) for (const [oy, L, ph] of [[9, 22, 0], [13, 17, 1.4]]) { // from behind its shoulders, out and down, curling at the ends
      const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, a = 0.15 + u * 1.1 + Math.sin(t * 1.6 + ph + u * 3) * 0.25 * u; pts.push([X + s * (5 + Math.cos(a) * L * u), top + oy + Math.sin(a) * L * u * 0.55 - 3 * u + Math.sin(t * 2 + u * 5 + ph) * 1.2]); }
      ribbon(pts, 1.4, false);
    }
    const [x0, y0] = put(g, A, X, Y + br, F, flash);
    { const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([X - 4 + u * 8, y0 + 4 + Math.sin(u * Math.PI) * -0.6]); } ribbon(pts, 1.4, true); } // bound across its brow
    // deep in the hood, sometimes, two pale points
    if (Math.sin(t * 0.9) > 0.5) { px(g, X - 1, y0 + 8, '#ffe9a0', 0.85); px(g, X + 1, y0 + 8, '#ffe9a0', 0.85); }
    // the eye in its chest: tall, gold, opening wide when it strikes
    const ex = X, ey = y0 + 13, wide = e.state === 'wind' || e.state === 'ult' ? 1 : 0.55 + 0.2 * Math.sin(t * 1.6);
    g.fillStyle = '#16161c'; g.beginPath(); g.moveTo(ex, ey - 4); g.quadraticCurveTo(ex + 3.4 * wide, ey, ex, ey + 4); g.quadraticCurveTo(ex - 3.4 * wide, ey, ex, ey - 4); g.fill();
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(ex, ey - 3); g.quadraticCurveTo(ex + 2.6 * wide, ey, ex, ey + 3); g.quadraticCurveTo(ex - 2.6 * wide, ey, ex, ey - 3); g.fill();
    const look = Math.round(Math.sin(t * 0.7) * 0.6); disc(g, ex + look, ey, 1.3 * wide + 0.2, '#d8a030'); px(g, ex + look, ey, '#0a0a0a'); px(g, ex + look, ey - 1, '#0a0a0a');
    glow(g, ex, ey, 2.4, '#ffd84a', 0.14 + 0.14 * wide);
    if (Math.random() < 0.2) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 14, y: Y - 1, vx: 0, vy: -4, life: 0.7, max: 0.7, color: Math.random() < 0.5 ? '#e8c860' : '#6e6e7c' }); // its hem coming apart into the water
  }
};

// =====================================================================================================
// The Sword Without a Head: the Sword Immortal's own shape, his own size, but drowned in ink. His robes black, his sash
// bleached, his flying sword and ribbons and the ring of swords all ink; and where his head was, a small burst of black
// blades, the longest streaming back the way his hair did.
// =====================================================================================================
const HL_PAL = { n: '#0c0a12', N: '#2e2840', a: '#625c74', b: '#7c7690', A: '#3a3448', s: '#e4e0ec', K: '#08060c' };
const HEADLESS = [ // the Sword Immortal's body, row for row (his white robe gone ash, his blue outer robe black, his gold sash bleached)
  '.KK.aNa....',
  '.KKnbaann..',
  '.K.nbsaann.',
  '.K.Nnbaannn',
  '...nnsssnn.',
  '...Nbaaan..',
  '...nbaaaan.',
  '..nbaaaaan.',
  '..nAbaaAann',
  '.nnA.aa.An.',
];
RP.drawHeadless = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, F = e.fx < 0 ? -1 : 1, X = Math.round(sx(e.x)), base = Math.round(sy(e.y));
  const k = e.state === 'transform' ? clamp(1 - e.st / (e.def.phase3.dur * 0.6)) : 1;
  const A = this.headlessArt || (this.headlessArt = fromMap(HEADLESS, HL_PAL, '#000000', 5));
  if (!this.c14baked) { this.c14baked = true; INK_EDGE(); PAPER_GRAIN(); } // the Fourteenth's paper, ready before it is drawn
  // the Black Sea at his feet: a pool of ink with rings running out of it
  E(g, e.x, e.y, 12, '#05040a', 0.42 * k, true);
  for (let i = 0; i < 2; i++) { const u = (t * 0.45 + i * 0.5) % 1; E(g, e.x, e.y, 13 * u + 2, '#5a4a7a', 0.45 * k * (1 - u), false); }
  // his body, exactly where the Sword Immortal's stands (his sprite is 11 by 16, the head the top six rows)
  const yTop = base - 16 + 1 - lift, bx = X - 5;
  g.drawImage(F > 0 ? A.c : A.f, bx - 1, yTop + 6 - 1);
  if (flash) { g.globalAlpha = 0.65; g.drawImage(F > 0 ? A.white : A.whiteF, bx - 1, yTop + 6 - 1); g.globalAlpha = 1; }
  // the head that isn't: black blades bursting from the neck, white along one edge; the longest stream back like hair
  const hx = X + (F > 0 ? -0.5 : 0.5), hy = yTop + 3;
  const blades = this.hlBlades || (this.hlBlades = Array.from({ length: 20 }, (_, i) => ({ a: (i + hash(i, 4, 9) * 0.6) / 20 * TAU, L: 3 + hash(i, 5, 9) * 4.5, w: 0.55 + hash(i, 6, 9) * 0.6, lit: i % 3 === 0 })));
  const pl = (x0, y0, x1, y1, col) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); g.fillStyle = col; for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
  const tips = blades.map((b, i) => { let a = b.a + Math.sin(t * 1.1 + i) * 0.05, L = b.L * (0.55 + 0.45 * k); if (Math.cos(a) * F < -0.3 && Math.sin(a) > -0.4) { L *= 1.5; a += F * 0.2; } return [hx + Math.cos(a) * L, hy + Math.sin(a) * L * 0.9, b, a, L]; });
  for (const [ex, ey] of tips) pl(hx + 1, hy + 1, ex + 1, ey + 1, '#3a3050'); // a violet shadow under each blade, so the black reads anywhere
  for (const [ex, ey, b, a, L] of tips) { // crisp black blades, thicker at the root, white along the lit ones
    const ink = flash ? '#ffffff' : '#050408'; pl(hx, hy, ex, ey, ink);
    if (b.w > 0.8) pl(hx + Math.cos(a + 1.57), hy + Math.sin(a + 1.57), hx + Math.cos(a) * L * 0.55, hy + Math.sin(a) * L * 0.5, ink);
    if (b.lit && !flash) { px(g, ex, ey, '#f0ecf8'); px(g, hx + Math.cos(a) * L * 0.7, hy + Math.sin(a) * L * 0.63, '#a8a2b8'); }
  }
  g.fillStyle = flash ? '#ffffff' : '#050408'; g.fillRect(Math.round(hx) - 2, Math.round(hy) - 1, 5, 3); g.fillRect(Math.round(hx) - 1, Math.round(hy) - 2, 3, 5);
  if (Math.floor(t * 1.7) % 5 === 0) { px(g, hx + F, hy, '#f4f0ff'); } // something in there looks out, once in a while
  // ink dripping from the burst and from his hem
  for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; px(g, hx - 2 + i * 2, hy + 3 + u * 8, '#120a18', 1 - u); }
  for (let i = 0; i < 2; i++) { const u = (t * 0.5 + i * 0.5) % 1; px(g, X - 3 + i * 5, base - lift + u * 2, '#0a0810', 1 - u); }
  if (Math.random() < 0.25 * k) this.parts.push({ kind: 'px', x: hx + (Math.random() - 0.5) * 10, y: hy + (Math.random() - 0.5) * 8, vx: -F * 8, vy: -6, life: 0.6, max: 0.6, color: Math.random() < 0.8 ? '#0a0810' : '#d8d4e0' });
};

// =====================================================================================================
// The Fourteenth Sword: Cut.
//   0.0 the world drains to ink on paper; ink bleeds in from the edges; the name is written, and sealed in red
//   0.8 a pencil line is drawn across the page, through you, and follows you; he settles into the draw, focus lines close
//   2.0 the line locks (red). Silence. The frame pushes in.
//   2.3 CUT: impact frames (negative, then black, then white), the page splits along the line and slides apart, ink and
//       paper thrown off the cut, the whole frame smeared along the stroke; he is already past you, his back turned
//   2.6 the page closes, leaving the scar; colour comes back.  4.3 he sheathes it.
// The fight layer draws the line and the stance; the rest happens over the finished frame (see present below).
// =====================================================================================================
const INKC = '#0a0810', PAPER = '#f2ead8', SEAL = '#c8141e';
const cutLine = S => { const ux = Math.cos(S.ang), uy = Math.sin(S.ang) * SQ, l = Math.hypot(ux, uy); return { x: sx(S.ax), y: sy(S.ay) - 4, ux: ux / l, uy: uy / l }; };
RP.drawPageCut = function (sim, S) {
  const g = this.g, T = S.t, e = S.owner;
  if (!this.cut14 || this.cut14.S !== S) this.cut14 = { S, sim, parts: [], fired: {}, T: 0, live: true, dur: S.dur };
  const C = this.cut14; C.T = T; C.live = true; C.sim = sim;
  const Ln = cutLine(S), L = 320;
  // the pencil line: drawn on in a stroke, faint graphite doubled the way a hand draws it, ticks where it crosses you
  if (T > 0.8 && T < 2.3) {
    const u = ease((T - 0.8) / 0.35), a = Math.min(1, (T - 0.8) * 3);
    for (let k = 0; k < 2; k++) {
      const j = k ? 0.7 : 0, x0 = Ln.x - Ln.ux * L, y0 = Ln.y - Ln.uy * L + j;
      g.save(); g.setLineDash(k ? [5, 3, 1, 3] : [14, 2, 3, 2]); line(g, x0, y0, x0 + Ln.ux * L * 2 * u, y0 + Ln.uy * L * 2 * u, k ? '#5a564e' : '#1a1814', k ? 0.8 : 1.2, a * (k ? 0.6 : 0.95)); g.restore();
    }
    for (const s of [-1, 1]) line(g, Ln.x - Ln.uy * 4 * s + Ln.ux * 6, Ln.y + Ln.ux * 4 * s + Ln.uy * 6, Ln.x - Ln.uy * 4 * s - Ln.ux * 6, Ln.y + Ln.ux * 4 * s - Ln.uy * 6, '#4a4640', 0.6, a * 0.5); // the margin he leaves you
  }
  // his hand on the hilt: a sheath at his hip, the blade not yet out
  if (e && !e.dead && T < 2.3) {
    const F = e.fx < 0 ? -1 : 1, X = sx(e.x), Y = sy(e.y) - 7, crouch = clamp((T - 1.0) / 0.8);
    line(g, X - F * 9, Y + 3 + crouch, X + F * 4, Y - 1, '#050408', 2); line(g, X - F * 9, Y + 2 + crouch, X + F * 4, Y - 2, '#3a3448', 0.6);
    px(g, X + F * 4, Y - 1, '#d8d4e0'); px(g, X + F * 5, Y - 2, '#d8d4e0');
    if (T > 1.6 && Math.floor(T * 30) % 2) px(g, X + F * 5, Y - 3, '#ffffff');
    if (Math.random() < 0.5 * crouch) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 40, y: Y + (Math.random() - 0.5) * 24, vx: (X - (X + (Math.random() - 0.5) * 40)) * 2, vy: 0, life: 0.25, max: 0.25, color: INKC });
  }
};
// the slow, scarred page: where the Fourteenth cut, a black line with a pale lip, and ink still running from it
RP.drawPageScar = function (s) {
  const g = this.g, ux = Math.cos(s.a), uy = Math.sin(s.a) * SQ, l = Math.hypot(ux, uy), x = sx(s.x), y = sy(s.y) - 4, L = 300, dx = ux / l, dy = uy / l;
  line(g, x - dx * L, y - dy * L + 1, x + dx * L, y + dy * L + 1, '#f4f0e6', 1, 0.35);
  line(g, x - dx * L, y - dy * L, x + dx * L, y + dy * L, '#05040a', 1, 0.8);
  const t = this.tick || 0;
  for (let i = 0; i < 9; i++) { const u = (i / 9 - 0.5) * 1.6, qx = x + dx * L * u * 0.5, qy = y + dy * L * u * 0.5, d = (t * 3 + i * 1.7) % 6; px(g, qx, qy + d, '#05040a', 1 - d / 6); }
};
RP.c14layer = function () { const c = this.c14ov || (this.c14ov = mk(W, H)), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); return g; };
// paper grain and the ink bleeding in from the edges, baked once
const PAPER_GRAIN = (() => { let c = null; return () => { if (c) return c; c = mk(W, H); const g = c.getContext('2d'); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = hash(x, y, 3) * 0.6 + hash(x >> 2, y >> 1, 4) * 0.4; if (v > 0.55) { g.fillStyle = v > 0.85 ? '#b8ad98' : '#d8cfbc'; g.fillRect(x, y, 1, 1); } } return c; }; })();
const vnoise = (x, y, sd) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), h = (a, b) => hash(a, b, sd); return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
const INK_EDGE = (() => { let c = null; return () => { if (c) return c; c = mk(W, H); const g = c.getContext('2d');
  for (let y = 13; y < H; y++) for (let x = 0; x < W; x++) {
    const ex = Math.min(x, W - 1 - x) / (W / 2), ey = Math.min(y - 13, H - 1 - y) / ((H - 13) / 2), d = Math.min(ex * 1.7, ey);
    const n = vnoise(x / 9, y / 7, 7) * 0.6 + vnoise(x / 3.5, y / 3.5, 8) * 0.3 + vnoise(x / 1.5, y / 1.5, 9) * 0.1, drip = y - 13 < 30 && hash(x >> 1, 0, 11) > 0.86 ? (30 - (y - 13)) / 30 * 0.12 : 0;
    const v = d - n * 0.3 - drip; if (v < 0.13) { g.fillStyle = v < 0.07 ? '#050408' : v < 0.1 ? '#120e18' : '#2a2430'; g.fillRect(x, y, 1, 1); }
  } return c; }; })();

RP.post14 = function () {
  const C = this.cut14; if (!C) return;
  if (!C.live) { C.T += this.lastDt || 1 / 60; if (C.T > 5.2) { this.cut14 = null; return; } } // the spectacle is over; its tail plays out
  C.live = false;
  const T = C.T, S = C.S, e = S.owner, K = this.S || 1, tg = K === 1 ? this.g : this.sg, Wp = W * K, Hp = H * K, top = 13 * K, dt = this.lastDt || 1 / 60;
  const Ln = cutLine(S), r = Math.random;
  tg.save(); tg.setTransform(1, 0, 0, 1, 0, 0); tg.imageSmoothingEnabled = false;
  const buf = this.c14buf || (this.c14buf = document.createElement('canvas')); if (buf.width !== Wp || buf.height !== Hp) { buf.width = Wp; buf.height = Hp; }
  const bg = buf.getContext('2d'); const snap = () => { bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'copy'; bg.drawImage(tg.canvas, 0, 0); bg.globalCompositeOperation = 'source-over'; };
  const fire = (k, fn) => { if (!C.fired[k]) { C.fired[k] = true; fn(); } };
  // ---- 1. ink on paper ----
  const gk = T < 0.7 ? ease(T / 0.7) : T < 3.0 ? 1 : 1 - ease((T - 3.0) / 0.8);
  if (gk > 0) {
    tg.globalCompositeOperation = 'saturation'; tg.globalAlpha = gk; tg.fillStyle = '#808080'; tg.fillRect(0, top, Wp, Hp - top);
    tg.globalCompositeOperation = 'multiply'; tg.globalAlpha = gk * 0.5; tg.fillStyle = '#efe0c0'; tg.fillRect(0, top, Wp, Hp - top);
    tg.globalAlpha = gk * 0.45; tg.drawImage(PAPER_GRAIN(), 0, 0, W, H, 0, 0, Wp, Hp);
    tg.globalCompositeOperation = 'source-over';
    const ek = gk * (0.75 + 0.25 * clamp((T - 1.0) / 1.2)); tg.globalAlpha = ek;
    const grow = 1 + 0.06 * clamp((T - 0.8) / 1.5) - 0.04 * clamp((T - 2.3) / 0.2); // the ink closes in as he draws, and is thrown back by the cut
    const sc = 2 - grow, dw = Wp * sc, dh = (Hp - top) * sc, qx = (Wp - dw) / 2, qy = top + (Hp - top - dh) / 2; tg.drawImage(INK_EDGE(), 0, 13, W, H - 13, qx, qy, dw, dh);
    tg.fillStyle = '#050408'; if (qx > 0) { tg.fillRect(0, top, qx + 1, Hp - top); tg.fillRect(Wp - qx - 1, top, qx + 1, Hp - top); tg.fillRect(0, top, Wp, qy - top + 1); tg.fillRect(0, qy + dh - 1, Wp, Hp - qy - dh + 1); } tg.globalAlpha = 1;
    fire('riser', () => this.snd('riser'));
  }
  // ---- 2. the lock: the frame pushes in on you ----
  if (T >= 2.0 && T < 2.3) {
    fire('lock', () => { this.snd('chime'); });
    const z = 1 + 0.05 * ease((T - 2.0) / 0.12), fx = Ln.x * K, fy = Ln.y * K; snap();
    tg.drawImage(buf, 0, top, Wp, Hp - top, fx - fx * z, top + (fy - top) - (fy - top) * z, Wp * z, (Hp - top) * z);
  }
  // ---- 3. CUT ----
  const open = T < 2.3 ? 0 : T < 2.34 ? (T - 2.3) / 0.04 : T < 2.62 ? 1 : T < 2.95 ? 1 - ease((T - 2.62) / 0.33) : 0;
  if (open > 0) {
    fire('cut', () => {
      this.snd('ultboom'); this.snd('slash'); this.shake = Math.max(this.shake, 20);
      for (let i = 0; i < 260; i++) { // ink thrown off the whole length of the stroke, a few flecks of paper white in it
        const u = (r() - 0.5) * 2 * 170, s = r() < 0.5 ? -1 : 1, sp = 30 + r() * r() * 220, along = (r() - 0.5) * 60;
        C.parts.push({ x: Ln.x + Ln.ux * u, y: Ln.y + Ln.uy * u, vx: -Ln.uy * s * sp + Ln.ux * along, vy: Ln.ux * s * sp + Ln.uy * along, g: 140, life: 0.5 + r() * 1.1, max: 1.6, sz: r() < 0.08 ? 2 : 1, col: r() < 0.84 ? INKC : PAPER });
      }
      for (let i = 0; i < 16; i++) { const u = (r() - 0.5) * 2 * 140, s = r() < 0.5 ? -1 : 1, sp = 20 + r() * 70; C.parts.push({ x: Ln.x + Ln.ux * u, y: Ln.y + Ln.uy * u, vx: -Ln.uy * s * sp, vy: Ln.ux * s * sp - 20, g: 40, life: 1.2 + r(), max: 2.2, scrap: true, a: r() * TAU, va: (r() - 0.5) * 18, col: PAPER }); } // scraps of the page
    });
    snap();
    const gap = open * 4 * K, slide = open * 9 * K, jx = (r() - 0.5) * 10 * K * open, jy = (r() - 0.5) * 6 * K * open;
    tg.fillStyle = '#000000'; tg.fillRect(0, top, Wp, Hp - top);
    const nx = -Ln.uy, ny = Ln.ux, cx = Ln.x * K, cy = Ln.y * K, far = Wp * 2;
    const half = s => { tg.beginPath(); tg.moveTo(cx - Ln.ux * far, cy - Ln.uy * far); tg.lineTo(cx + Ln.ux * far, cy + Ln.uy * far); tg.lineTo(cx + Ln.ux * far + nx * far * s, cy + Ln.uy * far + ny * far * s); tg.lineTo(cx - Ln.ux * far + nx * far * s, cy - Ln.uy * far + ny * far * s); tg.closePath(); };
    for (const s of [-1, 1]) {
      tg.save(); half(s); tg.clip();
      const ox = Ln.ux * slide * s + nx * gap * s + jx, oy = Ln.uy * slide * s + ny * gap * s + jy;
      if (T < 2.55) for (let j = 4; j >= 1; j--) { tg.globalAlpha = 0.16; tg.drawImage(buf, ox - Ln.ux * j * 3 * K * s, oy - Ln.uy * j * 3 * K * s); } // smeared along the stroke
      tg.globalAlpha = 1; tg.drawImage(buf, ox, oy); tg.restore();
    }
    for (const s of [-1, 1]) { const ox = Ln.ux * slide * s + nx * gap * s + jx, oy = Ln.uy * slide * s + ny * gap * s + jy; tg.globalAlpha = 0.9; tg.strokeStyle = PAPER; tg.lineWidth = Math.max(1, K * 0.75); tg.beginPath(); tg.moveTo(cx - Ln.ux * far + ox, cy - Ln.uy * far + oy); tg.lineTo(cx + Ln.ux * far + ox, cy + Ln.uy * far + oy); tg.stroke(); tg.globalAlpha = 1; } // the page's cut edges
    // inside the cut: white-hot at its heart for an instant, then only a black slit
    const heat = clamp(1 - (T - 2.3) / 0.25);
    if (heat > 0) { tg.save(); tg.globalCompositeOperation = 'lighter'; tg.globalAlpha = heat; tg.strokeStyle = '#ffffff'; tg.lineWidth = Math.max(1, gap * 0.7); tg.beginPath(); tg.moveTo(cx - Ln.ux * far + jx, cy - Ln.uy * far + jy); tg.lineTo(cx + Ln.ux * far + jx, cy + Ln.uy * far + jy); tg.stroke(); tg.restore(); }
    // impact frames over everything: the negative, the black, the white
    const f = T < 2.34 ? 0 : T < 2.39 ? 1 : T < 2.44 ? 2 : -1;
    if (f >= 0) {
      snap(); tg.save();
      if (f === 0) { tg.fillStyle = '#ffffff'; tg.fillRect(0, 0, Wp, Hp); } // blinding
      else if (f === 1) { tg.filter = 'grayscale(1) contrast(30) invert(1)'; tg.drawImage(buf, 0, 0); } // the negative: a black world, white shapes
      else { tg.filter = 'grayscale(1) brightness(1.25) contrast(30)'; tg.drawImage(buf, 0, 0); } // and the print: white paper, black shapes
      tg.restore();
      if (tg.filter === undefined) { tg.globalCompositeOperation = 'difference'; tg.fillStyle = '#fff'; tg.fillRect(0, top, Wp, Hp - top); tg.globalCompositeOperation = 'source-over'; }
      // the stroke itself, and the focus lines thrown out from where it crossed you
      tg.save(); tg.strokeStyle = f === 1 ? '#fff' : '#000'; tg.lineWidth = (f === 0 ? 2 : f === 1 ? 5 : 3) * K; tg.beginPath(); tg.moveTo(cx - Ln.ux * far, cy - Ln.uy * far); tg.lineTo(cx + Ln.ux * far, cy + Ln.uy * far); tg.stroke();
      tg.fillStyle = f === 1 ? '#fff' : '#000';
      for (let i = 0; i < 46; i++) { const a = r() * TAU, r0 = (18 + r() * 30) * K, r1 = r0 + (60 + r() * 140) * K, w = (0.5 + r() * 1.6) * K; tg.beginPath(); tg.moveTo(cx + Math.cos(a) * r1 - Math.sin(a) * w, cy + Math.sin(a) * r1 + Math.cos(a) * w); tg.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); tg.lineTo(cx + Math.cos(a) * r1 + Math.sin(a) * w, cy + Math.sin(a) * r1 - Math.cos(a) * w); tg.fill(); }
      tg.restore();
    }
  }
  // ---- 4. the overlay, at the fight layer's own pixels: focus lines, the seal, the locked line, his stroke, the ink ----
  const og = this.c14layer();
  if (T > 1.0 && T < 2.3 && e) { // focus lines closing on him
    const k = clamp((T - 1.0) / 1.0), fx = sx(e.x), fy = sy(e.y) - 8, rin = 120 - 70 * k;
    og.fillStyle = INKC;
    for (let i = 0; i < 40; i++) { const a = r() * TAU, r0 = rin + r() * 20, w = 0.6 + r() * 1.4 * k; og.globalAlpha = 0.35 + 0.5 * k; og.beginPath(); og.moveTo(fx + Math.cos(a) * 300 - Math.sin(a) * w * 3, fy + Math.sin(a) * 300 + Math.cos(a) * w * 3); og.lineTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0 * 0.8); og.lineTo(fx + Math.cos(a) * 300 + Math.sin(a) * w * 3, fy + Math.sin(a) * 300 - Math.cos(a) * w * 3); og.fill(); }
    og.globalAlpha = 1;
  }
  if (T > 0.9 && T < 2.3 && e && !e.dead) { // the Black Sea drawn in to him: ink running in on spiral paths, faster as he settles
    const k = clamp((T - 0.9) / 1.0), X = sx(e.x), Y = sy(e.y) - 8;
    og.strokeStyle = INKC; og.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const ph = (T * (0.8 + k * 1.6) + i / 9) % 1, a0 = i * 0.7 + T * 2, r0 = 46 * (1 - ph) + 4; og.globalAlpha = (1 - ph) * 0.8 * k + 0.1; og.lineWidth = 1 + (1 - ph) * 1.2; og.beginPath(); for (let j = 0; j <= 6; j++) { const rr = r0 + j * 3, a = a0 - j * 0.22; og.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.6); } og.stroke(); }
    og.globalAlpha = 1;
    if (T > 1.7) { const q = Math.floor(T * 24) % 2; px(og, X + (e.fx < 0 ? -5 : 5), Y + 4, q ? '#ffffff' : '#a8a2b8'); } // light gathering on the guard
  }
  if (T >= 2.0 && T < 2.34) { // the line, locked: drawn over in red ink
    const a = T < 2.06 ? (Math.floor(T * 60) % 2 ? 1 : 0.4) : 1;
    line(og, Ln.x - Ln.ux * 320, Ln.y - Ln.uy * 320, Ln.x + Ln.ux * 320, Ln.y + Ln.uy * 320, SEAL, 1, a);
    line(og, Ln.x - Ln.ux * 320, Ln.y - Ln.uy * 320 + 1, Ln.x + Ln.ux * 320, Ln.y + Ln.uy * 320 + 1, '#5a0408', 1, a * 0.6);
  }
  if (T >= 2.3 && T < 3.0 && S.from && e) { // his stroke: a brush of ink along the line, from far behind you to where he stands
    const u = clamp((T - 2.3) / 0.5), side = S.side || 1, x1 = sx(e.x), y1 = sy(e.y) - 7, x0 = x1 - Ln.ux * side * 110, y0 = y1 - Ln.uy * side * 110, nx = -Ln.uy, ny = Ln.ux;
    og.globalAlpha = 1 - u; og.fillStyle = INKC; og.beginPath();
    for (let i = 0; i <= 12; i++) { const s = i / 12, w = 3.4 * Math.sin(Math.PI * Math.pow(s, 0.7)) * (1 - u * 0.5) + 0.3; og.lineTo(x0 + (x1 - x0) * s + nx * w, y0 + (y1 - y0) * s + ny * w); }
    for (let i = 12; i >= 0; i--) { const s = i / 12, w = 3.4 * Math.sin(Math.PI * Math.pow(s, 0.7)) * (1 - u * 0.5) + 0.3; og.lineTo(x0 + (x1 - x0) * s - nx * w, y0 + (y1 - y0) * s - ny * w); }
    og.fill(); og.globalAlpha = (1 - u) * 0.9; line(og, x0, y0 - 1, x1, y1 - 1, '#f4f0ff', 0.5); og.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { const s = (i + 0.5) / 5; px(og, x0 + (x1 - x0) * s + (r() - 0.5) * 3, y0 + (y1 - y0) * s + 3 + r() * 4, INKC, 1 - u); } // the brush's dry flecks
  }
  if (T >= 2.3 && T < 2.75 && S.from && e && this.headlessArt) { // the afterimages he left on the way through: ink copies of him strung along the line
    const A = this.headlessArt, u = (T - 2.3) / 0.45, side = S.side || 1, X = sx(e.x), Y = sy(e.y);
    for (let i = 1; i <= 7; i++) { const d = i * 13, qx = Math.round(X - Ln.ux * side * d), qy = Math.round(Y - Ln.uy * side * d); og.globalAlpha = Math.max(0, (0.75 - i * 0.09) * (1 - u)); og.drawImage(e.fx < 0 ? A.f : A.c, qx - A.ax, qy - A.h - 6); }
    og.globalAlpha = 1;
  }
  if (e && !e.dead && T >= 2.3 && T < 4.42) { // the blade, out: bare steel, the only thing with colour, ink running off it; then home
    const F = e.fx < 0 ? -1 : 1, X = sx(e.x), Y = sy(e.y) - 7, sheath = T > 4.3 ? clamp((T - 4.3) / 0.1) : 0, len = 15 * (1 - sheath);
    if (len > 0.5) {
      const a = F > 0 ? 0.35 : Math.PI - 0.35, dx = Math.cos(a), dy = Math.sin(a), hx = X + F * 3, hy = Y + 1;
      line(og, hx, hy, hx + dx * len, hy + dy * len, '#8a9ab8', 2); line(og, hx, hy - 0.5, hx + dx * len, hy + dy * len - 0.5, '#f4f8ff', 1);
      px(og, hx + dx * len, hy + dy * len, '#ffffff'); px(og, hx, hy, '#e8c34a'); px(og, hx - F, hy, '#e8c34a');
      const d = (T * 2.2) % 1; px(og, hx + dx * len * 0.9, hy + dy * len * 0.9 + d * 6, INKC, 1 - d);
      if (Math.floor(T * 7) % 6 === 0) { const q = clamp((T * 7 % 1)); px(og, hx + dx * len * q, hy + dy * len * q - 1, '#ffffff'); }
    }
  }
  if (T >= 0.15 && T < 2.0) { // the name, written in one stroke of the brush, and sealed
    const k = clamp(Math.min((T - 0.15) / 0.18, (2.0 - T) / 0.25)), reveal = ease((T - 0.15) / 0.55), cx = W / 2;
    og.save(); og.globalAlpha = k; og.beginPath(); og.rect(cx - 50, 16, 100 * reveal + (hash(Math.floor(T * 30), 1, 2) - 0.5) * 2, 30); og.clip();
    og.font = `16px "KaiTi", "STKaiti", "Kaiti SC", "SimSun", "Noto Serif SC", serif`; og.textAlign = 'center'; og.textBaseline = 'alphabetic';
    og.fillStyle = PAPER; for (const [qx, qy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) og.fillText('第十四剑', cx - 6 + qx, 36 + qy);
    og.fillStyle = INKC; og.fillText('第十四剑', cx - 6, 36); og.restore();
    if (T > 0.75) { // the seal, stamped: a red square, uneven at its edges, the character for 'cut' left blank in it
      const sk = clamp((T - 0.75) / 0.06), s = 1 + (1 - sk) * 0.8, qx = cx + 34, qy = 28; og.save(); og.globalAlpha = k * sk; og.translate(qx, qy); og.scale(s, s);
      og.fillStyle = SEAL; og.fillRect(-6, -6, 12, 12); og.fillStyle = PAPER; for (let i = 0; i < 12; i++) { if (hash(i, 2, 5) > 0.6) og.fillRect(-6 + i, -6, 1, 1); if (hash(i, 3, 5) > 0.6) og.fillRect(-6 + i, 5, 1, 1); if (hash(i, 4, 5) > 0.7) og.fillRect(-6, -6 + i, 1, 1); }
      og.font = `10px "KaiTi", "STKaiti", "SimSun", serif`; og.textAlign = 'center'; og.fillText('斩', 0, 4); og.restore();
      fire('seal', () => { this.snd('heavyhit'); this.shake = Math.max(this.shake, 3); });
    }
    if (T > 0.6) { const kk = this.g; this.g = og; og.globalAlpha = k * clamp((T - 0.6) / 0.3); this.text('XIV · NOT IN THE MANUAL', cx, 44, '#2a2430', 'center'); og.globalAlpha = 1; this.g = kk; }
  }
  // the ink and the paper thrown off the cut
  for (const p of C.parts) {
    p.life -= dt; if (p.life <= 0) continue; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt * 0.8; p.vx *= 1 - dt * 1.5; const a = Math.min(1, p.life / 0.4);
    if (p.scrap) { p.a += p.va * dt; og.save(); og.globalAlpha = a; og.translate(p.x, p.y); og.rotate(p.a); og.fillStyle = '#8a8070'; og.fillRect(-1.5, -1, 3, 2); og.fillStyle = p.col; og.fillRect(-1, -0.5, 2, 1); og.restore(); }
    else { og.globalAlpha = a; og.fillStyle = p.col; const sp = Math.hypot(p.vx, p.vy), n = Math.min(4, Math.floor(sp / 50)); for (let j = 0; j <= n; j++) og.fillRect(Math.round(p.x - p.vx / sp * j), Math.round(p.y - p.vy / sp * j * 0.8), p.sz, p.sz); }
  }
  og.globalAlpha = 1; C.parts = C.parts.filter(p => p.life > 0);
  // the sheathe: a click of light at his hip, a ring of ink thrown out from him, the scar flaring once
  if (T >= 4.3 && T < 5.2 && e) {
    const u = clamp((T - 4.3) / 0.6), X = sx(e.x), Y = sy(e.y) - 6;
    fire('sheathe', () => { // click: and only now does the cut catch up, ink bursting the length of the scar
      this.shake = Math.max(this.shake, 12); this.snd('ultboom');
      for (let i = 0; i < 180; i++) { const q = (r() - 0.5) * 2 * 170, s = r() < 0.5 ? -1 : 1, sp = 40 + r() * r() * 200; C.parts.push({ x: Ln.x + Ln.ux * q, y: Ln.y + Ln.uy * q, vx: -Ln.uy * s * sp, vy: Ln.ux * s * sp - 30, g: 160, life: 0.4 + r() * 0.9, max: 1.3, sz: r() < 0.08 ? 2 : 1, col: r() < 0.88 ? INKC : PAPER }); }
    });
    if (T < 4.34) { tg.fillStyle = 'rgba(255,255,255,0.55)'; tg.fillRect(0, top, Wp, Hp - top); }
    og.globalAlpha = 1 - u; og.strokeStyle = INKC; og.lineWidth = 2.5 * (1 - u) + 0.5; og.beginPath(); og.ellipse(X, Y + 5, 6 + u * 60, (6 + u * 60) * SQ, 0, 0, TAU); og.stroke();
    if (T < 4.36) { line(og, X - 14, Y, X + 14, Y, '#ffffff', 1, 1); line(og, X, Y - 6, X, Y + 6, '#ffffff', 1, 0.7); }
    line(og, Ln.x - Ln.ux * 320, Ln.y - Ln.uy * 320, Ln.x + Ln.ux * 320, Ln.y + Ln.uy * 320, '#ffffff', 1, (1 - u) * 0.8);
    og.globalAlpha = 1;
  }
  tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over'; tg.filter = 'none';
  tg.drawImage(this.c14ov, 0, 0, W, H, 0, 0, Wp, Hp);
  tg.restore();
};
const basePresent = RP.present;
RP.present = function (lobby) {
  if (this.S === 1) { if (!lobby && this.cut14) this.post14(); return basePresent.call(this, lobby); }
  basePresent.call(this, lobby);
  if (!lobby && this.cut14) this.post14();
};
const baseReset3 = RP.reset;
RP.reset = function () { this.cut14 = null; return baseReset3.apply(this, arguments); }; // a new fight: none of the last one's page carries over
// the cut's moment belongs to the cinematic: no plain white flash over it
const baseEvent3 = RP.celestialEvent;
RP.celestialEvent = function (ev) {
  if (ev.type === 'pagecut') { this.shake = Math.max(this.shake, 6); return true; }
  return baseEvent3.call(this, ev);
};
})();
