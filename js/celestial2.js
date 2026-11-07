// Celestial art, second pass: the Last Keeper (a trace of the jar's keeper, made of light), the Sword Immortal's third
// stage (the Sword Without a Head, the Fourteenth Sword's page), the Yellow Spring Ancestor's two shapes and his Six
// Paths, and Tamamo-no-Mae as a lady in red and as the vast white Heavenly Fox. Loaded after celestial.js.
(() => {
const RP = Renderer.prototype, { TAU, hash, mk, whiteOf, outline, disc, glow, star4, E, fall, HZ, BEAMS, PROJ, BURST, BIG } = CEL;
const line = (g, x0, y0, x1, y1, col, w = 1, a = 1) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.globalAlpha = 1; };
const eye = (g, x, y, w, col = '#ffffff', pupil = '#141414', a = 1) => { // an almond eye
  g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - w * 0.7, x + w, y); g.quadraticCurveTo(x, y + w * 0.7, x - w, y); g.fill();
  g.fillStyle = pupil; g.fillRect(Math.round(x - 0.5), Math.round(y - 0.5), 1, 1); g.globalAlpha = 1;
};

// =====================================================================================================
// The Last Keeper: a man-shape of light, long arms and longer fingers, a head that is only a starburst
// =====================================================================================================
RP.drawKeeper = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, st = e.keeperStage || 1, X = sx(e.x), Y = sy(e.y) - lift - 2 + Math.sin(t * 1.6) * 1.2, K = 0.9;
  const flick = st === 3 && Math.floor(t * 13) % 7 === 0; // what remains of him can't hold together
  const jx = st === 3 ? (hash(Math.floor(t * 20), 1, 3) - 0.5) * 3 : 0;
  const core = st === 2 ? '#fff0d0' : '#fffaf0', warm = st === 2 ? '#ffb070' : '#ffe8a0', dark = st === 2 ? '#3a1a10' : '#2a2614';
  const P = (x, y) => [X + jx + x * K, Y + y * K];
  // the light he was made from: long streaks crossing behind him
  for (let i = 0; i < 3; i++) { const a = -0.45 + i * 0.5 + Math.sin(t * 0.2 + i) * 0.05, [hx, hy] = P(0, -48); line(g, hx - Math.cos(a) * 70, hy - Math.sin(a) * 40, hx + Math.cos(a) * 70, hy + Math.sin(a) * 40, '#fff6d8', 0.6, 0.35); }
  // the grain around him: a dark, noisy edge where the light meets nothing
  for (let i = 0; i < 70; i++) {
    const u = hash(i, 1, 5), v = hash(i, 2, 5), side = i % 2 ? 1 : -1, y = -50 + u * 52, wdt = y < -38 ? 9 : y < -22 ? 11 : 7;
    const [px, py] = P(side * (wdt + v * 6) + (hash(i, 3, 5) - 0.5) * 3, y);
    g.globalAlpha = 0.45 + 0.3 * Math.sin(t * 7 + i); g.fillStyle = i % 3 ? dark : '#4a4a20'; g.fillRect(Math.round(px), Math.round(py), 1 + (i % 4 === 0), 1);
  }
  g.globalAlpha = 1;
  if (flick) return;
  g.save(); g.globalCompositeOperation = 'lighter'; // the glow first
  const [cx, cy] = P(0, -26); disc(g, cx, cy, 20, warm, 0.07); disc(g, cx, cy - 8, 13, warm, 0.09);
  g.restore();
  const body = (col, w0) => { // one pass of the silhouette: legs, torso, arms with long fingers
    g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of [-1, 1]) { // legs
      g.lineWidth = (3.6 + w0) * K; g.beginPath(); g.moveTo(...P(s * 3, -21)); g.lineTo(...P(s * 3.5, -9)); g.stroke();
      g.lineWidth = (2.6 + w0) * K; g.beginPath(); g.moveTo(...P(s * 3.5, -9)); g.lineTo(...P(s * 3.2, 0)); g.stroke();
    }
    g.beginPath(); g.moveTo(...P(-7.5, -38)); g.lineTo(...P(7.5, -38)); g.lineTo(...P(4.5, -24)); g.lineTo(...P(5.5, -19)); g.lineTo(...P(-5.5, -19)); g.lineTo(...P(-4.5, -24)); g.closePath();
    g.lineWidth = 1 + w0; g.fill(); g.stroke();
    g.lineWidth = (2.6 + w0) * K; g.beginPath(); g.moveTo(...P(0, -38)); g.lineTo(...P(0, -42)); g.stroke(); // neck
    const arms = st === 2 ? [[-1, 0], [1, 0], [-1, 6], [1, 6]] : [[-1, 0], [1, 0]]; // the Finished Gu has more hands than a man
    for (const [s, o] of arms) {
      const sw = Math.sin(t * 1.3 + s + o) * 1.2, sh = P(s * 7, -37 + o), el = P(s * (10 + o * 0.4), -25 + o), hd = P(s * (11.5 + o * 0.5) + sw * 0.3, -12 + o * 0.6);
      g.lineWidth = (2.2 + w0) * K; g.beginPath(); g.moveTo(...sh); g.lineTo(...el); g.lineTo(...hd); g.stroke();
      g.lineWidth = (0.7 + w0 * 0.6) * K; // long fingers, splayed
      for (let f = -2; f <= 2; f++) { const a = Math.PI / 2 + s * 0.25 + f * 0.17 + sw * 0.03; g.beginPath(); g.moveTo(...hd); g.lineTo(hd[0] + Math.cos(a) * 6.5 * K, hd[1] + Math.sin(a) * 6.5 * K); g.stroke(); }
    }
  };
  body(st === 2 ? '#c87a40' : '#e8d8a0', 1.6); // a warm rim
  body(flash ? '#ffffff' : core, 0);
  // the head: nothing but a starburst, turning slowly
  const [hx, hy] = P(0, -48), n = st === 2 ? 16 : 13;
  g.save(); g.globalCompositeOperation = 'lighter'; disc(g, hx, hy, 12, warm, 0.18); disc(g, hx, hy, 7, '#ffffff', 0.3); g.restore();
  g.fillStyle = '#fffdf4';
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + t * 0.25, L = (i % 2 ? 7 : 12 + (i % 3) * 2) * (1 + 0.12 * Math.sin(t * 5 + i * 2)) * (st === 3 ? 1.2 : 1), w = i % 2 ? 0.9 : 1.6;
    g.beginPath(); g.moveTo(hx + Math.cos(a + 1.57) * w, hy + Math.sin(a + 1.57) * w); g.lineTo(hx + Math.cos(a) * L, hy + Math.sin(a) * L); g.lineTo(hx + Math.cos(a - 1.57) * w, hy + Math.sin(a - 1.57) * w); g.fill();
  }
  disc(g, hx, hy, 3.4, '#ffffff');
  if (st === 3) for (let i = 0; i < 4; i++) { const y = Math.round(Y - 4 - hash(Math.floor(t * 9), i, 7) * 50); g.globalAlpha = 0.6; g.fillStyle = '#000000'; g.fillRect(Math.round(X - 14), y, 28, 1); g.globalAlpha = 1; } // the trace breaking up
};

// =====================================================================================================
// The Sword Without a Head: a long black robe, and where the head should be, a burst of black blades
// =====================================================================================================
RP.drawHeadless = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, X = sx(e.x), Y = sy(e.y) - lift - 3, F = e.fx < 0 ? -1 : 1;
  const k = e.state === 'transform' ? Math.min(1, 1 - e.st / (e.def.phase3.dur * 0.6)) : 1;
  E(g, e.x, e.y, 30, '#05040a', 0.55 * k, true); // the Black Sea at his feet
  for (let i = 0; i < 2; i++) E(g, e.x, e.y, 30 * ((t * 0.5 + i * 0.5) % 1), '#5a4a7a', 0.4 * k, false);
  g.fillStyle = '#0c0a10'; g.fillRect(Math.round(X - 9), Math.round(Y + 1), 18, 2); g.fillStyle = '#e8e8f0'; g.fillRect(Math.round(X - 9), Math.round(Y + 1), 18, 1); // his flying sword, gone black
  g.save(); g.translate(X, Y); g.scale(1.5, 1.5); g.translate(-X, -Y); // he stands taller than he did
  // the robe: long, falling to one side and trailing in tatters behind him
  g.fillStyle = flash ? '#ffffff' : '#08070c';
  g.beginPath(); g.moveTo(X - 4, Y - 32); g.lineTo(X + 4, Y - 32); g.lineTo(X + 6, Y - 22); g.lineTo(X + 9, Y); g.lineTo(X - 8, Y); g.lineTo(X - 6, Y - 22); g.closePath(); g.fill(); // the robe
  g.beginPath(); g.moveTo(X - F * 4, Y - 18); g.lineTo(X - F * 6, Y - 1); // and its tatters streaming behind
  for (let i = 0; i <= 6; i++) { const u = i / 6; g.lineTo(X - F * (8 + u * 16) + Math.sin(t * 3 + i) * 1.5, Y - 1 - u * 9 + (i % 2) * 2.5); }
  g.lineTo(X - F * 10, Y - 14); g.closePath(); g.fill();
  g.strokeStyle = '#3a3448'; g.lineWidth = 0.6; for (const x of [-2, 1, 4]) line(g, X + x, Y - 30, X + x * 1.6, Y - 1, '#2a2434', 0.6, 0.9); // folds
  g.fillStyle = '#c8c8d0'; g.fillRect(Math.round(X + F * 5), Math.round(Y - 18), 1, 2); g.fillRect(Math.round(X + F * 6), Math.round(Y - 17), 1, 1); // a pale hand, half hidden
  // the head that isn't: a burst of black blades, white along one edge
  const hx = X, hy = Y - 38, n = 34;
  for (let i = 0; i < n; i++) {
    const a = hash(i, 4, 9) * TAU + Math.sin(t * 0.8 + i) * 0.03, L = (6 + hash(i, 5, 9) * 14) * (0.6 + 0.4 * k) * (i % 5 === 0 ? 1.4 : 1), w = 1 + hash(i, 6, 9) * 1.4;
    const ex = hx + Math.cos(a) * L, ey = hy + Math.sin(a) * L * 0.9;
    g.fillStyle = flash ? '#ffffff' : '#050408'; g.beginPath(); g.moveTo(hx + Math.cos(a + 1.57) * w, hy + Math.sin(a + 1.57) * w); g.lineTo(ex, ey); g.lineTo(hx + Math.cos(a - 1.57) * w, hy + Math.sin(a - 1.57) * w); g.fill();
    if (i % 2 === 0) line(g, hx + Math.cos(a) * L * 0.3, hy + Math.sin(a) * L * 0.27, ex, ey, '#d8d8e8', 0.5, 0.8);
  }
  disc(g, hx, hy, 5, '#050408');
  for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; g.globalAlpha = 1 - u; g.fillStyle = '#120a18'; g.fillRect(Math.round(hx - 3 + i * 3), Math.round(hy + 4 + u * 10), 1, 2); } // ink dripping out of it
  g.globalAlpha = 1;
  g.restore();
};

// =====================================================================================================
// The Yellow Spring Ancestor: a ferryman with a fishing pole, under a black board of eyes; then the river's true shape,
// its head bound in ribbons of eyes and an eye open in its chest
// =====================================================================================================
function paintAncestor1() {
  const c = mk(30, 40), g = c.getContext('2d'), set = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const hw1 = y => y < 13 ? 4 + (y - 9) * 1.4 : y < 29 ? 9.5 + (y - 13) * 0.18 + (y > 17 ? 1.5 : 0) : 10 + (y - 29) * 0.25; // shoulders, wide sleeves, a long hem
  for (let y = 9; y <= 39; y++) { const hw = hw1(y); for (let x = Math.floor(15 - hw); x <= Math.ceil(15 + hw); x++) { const s2 = (x - 15) / hw, sleeve = y > 17 && y < 29 && Math.abs(Math.abs(x - 15) - 6.5) < 0.6, v = 0.5 - s2 * 0.25 + (Math.sin(x * 1.4 + y * 0.12) > 0.6 ? 0.15 : 0) + (hash(x, y, 2) - 0.5) * 0.12 - (sleeve ? 0.3 : 0); set(x, y, v > 0.6 ? '#4a4a52' : v > 0.4 ? '#2e2e36' : '#18181e'); } }
  for (const sx2 of [4, 26]) for (let y = 27; y <= 29; y++) set(sx2, y, '#0e0e12'); // the sleeves' ends
  for (let x = 4; x <= 26; x++) for (let y = 3; y <= 8; y++) { const edge = y === 3 || y === 8 || x === 4 || x === 26; if ((x < 7 || x > 23) && y < 5) continue; set(x, y, edge ? '#0a0a0e' : (x + y) % 5 === 0 ? '#2a2a32' : '#16161c'); } // the board of eyes
  for (let x = 9; x <= 21; x++) for (let y = 1; y <= 3; y++) set(x, y, y === 1 ? '#0a0a0e' : '#1c1c22');
  for (let y = 8; y <= 36; y++) for (let x = 13; x <= 17; x++) { const v = (x === 13 || x === 17) ? '#c8806a' : '#e8a090'; set(x, y, v); } // the banner
  for (let y = 10; y <= 34; y += 3) { set(14, y, '#8a3a2a'); set(15, y, '#5a1a10'); set(16, y, '#8a3a2a'); } // the eyes written on it
  set(14, 37, '#e8a090'); set(16, 37, '#e8a090'); set(15, 38, '#c8806a'); // a torn end
  outline(c, '#050508');
  return { c, white: whiteOf(c) };
}
function paintAncestor2() {
  const c = mk(36, 42), g = c.getContext('2d'), set = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 1; y <= 9; y++) for (let x = 14; x <= 22; x++) { const dx = (x - 18) / 4.2, dy = (y - 5) / 4.4; if (dx * dx + dy * dy <= 1) set(x, y, dx * dx + dy * dy > 0.6 ? '#2a2a30' : '#141418'); } // a hooded head, faceless
  const hw2 = y => y < 13 ? 6 + (y - 9) * 1.2 : y < 31 ? 11 + (y - 13) * 0.2 + (y > 18 ? 2 : 0) : 13 + (y - 31) * 0.35;
  for (let y = 9; y <= 41; y++) { const hw = hw2(y); for (let x = Math.floor(18 - hw); x <= Math.ceil(18 + hw); x++) { const s2 = (x - 18) / hw, v = 0.55 - s2 * 0.25 + (Math.sin(x * 1.1 + y * 0.3) > 0.55 ? 0.14 : 0) + (hash(x, y, 4) - 0.5) * 0.14; set(x, y, v > 0.62 ? '#7a7a82' : v > 0.44 ? '#55555e' : v > 0.3 ? '#3a3a42' : '#24242a'); } }
  for (let x = 8; x <= 28; x++) for (let y = 9; y <= 13; y++) if (Math.abs(x - 18) < 11 - (y - 9)) set(x, y, '#46464e'); // the high collar
  for (const [x, y] of [[14, 24], [16, 24], [20, 24], [22, 24], [15, 26], [21, 26]]) set(x, y, '#c8962e'); // gold studs
  for (let x = 13; x <= 23; x++) for (let y = 27; y <= 29; y++) set(x, y, y === 27 ? '#e8b888' : '#c89068'); // the pale hands, folded
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { set(18 + s * (5 + i * 0.6) | 0, 32 + i, '#1a1a20'); set(18 + s * (4 + i * 0.6) | 0, 32 + i, '#2a2a30'); } // and the dark ones under them
  outline(c, '#0a0a0e');
  return { c, white: whiteOf(c) };
}
RP.drawAncestor = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift), F = e.fx < 0 ? -1 : 1, two = e.phase === 2;
  this.ancArt = this.ancArt || [paintAncestor1(), paintAncestor2()];
  const A = this.ancArt[two ? 1 : 0];
  E(g, e.x, e.y, 14, '#c8a030', 0.25, true); // yellow water round his feet
  if (!two) {
    // the fishing pole: a long rod out over the water, its line swaying, a golden eye for a lure
    const hx = X + F * 6, hy = Y - 22, tx = X + F * 24, ty = Y - 46;
    line(g, hx, hy, tx, ty, '#8a6a3a', 1); line(g, hx, hy, hx + (tx - hx) * 0.4, hy + (ty - hy) * 0.4, '#5a4020', 1.4);
    const sway = Math.sin(t * 1.4) * 4, lx = tx + F * 3 + sway, ly = Y - 8;
    g.globalAlpha = 0.7; g.strokeStyle = '#d8d0b0'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + F * 4, (ty + ly) / 2, lx, ly); g.stroke(); g.globalAlpha = 1;
    glow(g, lx, ly, 2, '#ffd84a', 0.5); eye(g, lx, ly, 2, '#ffe9a8', '#3a2a10');
    g.drawImage(A.c, X - 15, Y - 40); if (flash) { g.globalAlpha = 0.6; g.drawImage(A.white, X - 15, Y - 40); g.globalAlpha = 1; }
    for (const [ex, ey, w] of [[-6, -34, 1.6], [6, -34, 1.6], [0, -37, 1.4]]) { line(g, X + ex - w - 0.5, Y + ey, X + ex + w + 0.5, Y + ey, '#c8962e', 0.6); eye(g, X + ex, Y + ey, w, '#f4f0e0', '#1a1a2a'); } // the eyes on the board
    g.fillStyle = '#c8962e'; g.fillRect(hx - 1, hy - 1, 2, 2); // the hand on the rod
  } else {
    // the river's true shape: ribbons of eyes bound round its head, and more of them reaching out
    g.drawImage(A.c, X - 18, Y - 42); if (flash) { g.globalAlpha = 0.6; g.drawImage(A.white, X - 18, Y - 42); g.globalAlpha = 1; }
    eye(g, X, Y - 26, 3.4, '#f4f0e6', '#0a0a0a'); g.fillStyle = '#ffd84a'; g.fillRect(X, Y - 27, 1, 1); // the eye in its chest
    const ribbon = pts => { // a gold band with eyes along it
      g.strokeStyle = '#7a5a2a'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke();
      g.strokeStyle = '#d8a860'; g.lineWidth = 2.4; g.stroke();
      for (let i = 1; i < pts.length; i += 2) eye(g, pts[i][0], pts[i][1], 1.1, '#fffaf0', '#c23b22');
    };
    const hx = X, hy = Y - 38;
    for (let k2 = 0; k2 < 3; k2++) { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * TAU * 1.1 + k2 * 2.1 + t * 0.6; pts.push([hx + Math.cos(a) * (5 + k2), hy + Math.sin(a) * 4 + (k2 - 1) * 2.5]); } ribbon(pts); } // wound round and round its head
    for (const s of [-1, 1]) for (const [oy, L] of [[-28, 16], [-14, 13]]) { const pts = []; for (let i = 0; i <= 7; i++) { const u = i / 7; pts.push([X + s * (10 + u * L), Y + oy - Math.sin(u * 3 + t * 2 + oy) * 4 * u - u * 6]); } ribbon(pts); } // and reaching out like hands
  }
};

// =====================================================================================================
// Tamamo-no-Mae: a lady in red with a fan and a crown of fox ears; then the Heavenly Fox, white and vast
// =====================================================================================================
function paintFoxLady() {
  const c = mk(28, 36), g = c.getContext('2d'), set = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 14; y <= 35; y++) { const u = (y - 14) / 21, hw = 3.5 + u * 8 + (y > 31 ? 1 : 0); for (let x = Math.floor(14 - hw); x <= Math.ceil(14 + hw); x++) { const s2 = (x - 14) / hw, v = 0.55 - s2 * 0.25 + (Math.sin(x * 1.3 + y * 0.25) > 0.6 ? 0.16 : 0) + (hash(x, y, 6) - 0.5) * 0.1; set(x, y, y > 32 ? (x % 3 ? '#2a1010' : '#c8962e') : v > 0.62 ? '#ff5a3a' : v > 0.42 ? '#d8281c' : '#8a1010'); } } // the red robe, a black-and-gold hem
  for (let y = 15; y <= 30; y++) { set(13, y, '#f0c860'); set(14, y, '#ffe9a0'); } // the gold front panel
  for (let x = 8; x <= 20; x++) for (let y = 11; y <= 14; y++) if (Math.abs(x - 14) <= 6 - (y - 11) * 0.5) set(x, y, (x + y) % 2 ? '#ffffff' : '#ece8e0'); // white fur at the collar
  for (let y = 4; y <= 10; y++) for (let x = 11; x <= 17; x++) { const dx = (x - 14) / 3.2, dy = (y - 7) / 3.6; if (dx * dx + dy * dy <= 1) set(x, y, x < 14 ? '#ffe8d8' : '#f0d0c0'); } // her face
  set(13, 7, '#8a1010'); set(15, 7, '#8a1010'); set(14, 9, '#d8281c'); set(14, 5, '#d8281c'); // eyes, lips, a mark on the brow
  for (let y = 3; y <= 26; y++) for (const x of [10, 18]) { if (y > 8) { set(x + (x < 14 ? -1 : 1) * (y > 18 ? 1 : 0), y, '#141018'); set(x, y, '#241a24'); } } // long black hair
  for (let x = 10; x <= 18; x++) set(x, 3, '#141018');
  for (const x of [11, 13, 15, 17]) { set(x, 2, '#f0c860'); set(x, 1, '#ffe9a0'); } // the gold crown
  for (const s of [-1, 1]) { set(14 + s * 4, 1, '#ffffff'); set(14 + s * 4, 0, '#ffffff'); set(14 + s * 5, 0, '#ffffff'); set(14 + s * 4, -1, '#141414'); } // fox ears
  outline(c, '#200808');
  return { c, white: whiteOf(c) };
}
RP.drawFoxLady = function (sim, e, lift, flash) {
  const g = this.g, t = sim.t, X = Math.round(sx(e.x)), Y = Math.round(sy(e.y) - lift - 2 + Math.sin(t * 2) * 1), F = e.fx < 0 ? -1 : 1;
  this.foxLadyArt = this.foxLadyArt || paintFoxLady();
  const A = this.foxLadyArt;
  g.save(); g.translate(X, Y); g.scale(F, 1); g.drawImage(A.c, -14, -36); if (flash) { g.globalAlpha = 0.6; g.drawImage(A.white, -14, -36); } g.restore(); g.globalAlpha = 1;
  // the fan held out, red with gold ribs and a flame painted on it
  const fx = X + F * 10, fy = Y - 24, open = 0.9 + 0.1 * Math.sin(t * 3), a0 = F > 0 ? -2.3 : -0.84;
  g.fillStyle = '#b8181c'; g.beginPath(); g.moveTo(fx, fy); g.arc(fx, fy, 9, a0 - open, a0 + open); g.closePath(); g.fill();
  g.strokeStyle = '#f0c860'; g.lineWidth = 0.6; g.beginPath(); g.arc(fx, fy, 9, a0 - open, a0 + open); g.stroke();
  for (let i = -3; i <= 3; i++) line(g, fx, fy, fx + Math.cos(a0 + i * open / 3) * 9, fy + Math.sin(a0 + i * open / 3) * 9, '#5a0808', 0.4, 0.8);
  g.fillStyle = '#ffb040'; g.fillRect(Math.round(fx + Math.cos(a0) * 5), Math.round(fy + Math.sin(a0) * 5), 2, 1);
  line(g, X + F * 4, Y - 22, fx, fy, '#d8281c', 1.2); // her sleeve
  if (Math.random() < 0.4) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 20, y: Y - Math.random() * 30, vx: 0, vy: -12, life: 0.6, max: 0.6, color: ['#9ad8ff', '#ff9ad8', '#c8ff9a', '#ffd84a'][Math.floor(Math.random() * 4)] }); // foxfire of every colour
};
// her tails, white and full, with foxfire burning at the tips (the Heavenly Fox draws her own)
RP.drawFoxTails = function (sim, e, lift) {
  const g = this.g, t = sim.t, owner = e.mirrorOf != null ? sim.enemies.find(o => o.id === e.mirrorOf) : e;
  const n = (owner && owner.tails) || 1; if (n >= 9) return;
  const F = e.fx < 0 ? 1 : -1, x0 = sx(e.x) + F * 3, y0 = sy(e.y) - lift - 8, L = 14;
  const tipCol = ['#9ad8ff', '#ff9ad8', '#c8ff9a', '#ffd84a', '#b89aff', '#ff8a6a', '#9affe0', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const spread = n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.8, a = -Math.PI / 2 + F * 1.1 + spread + Math.sin(t * 2 + i * 0.9) * 0.15;
    const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8, aa = a + Math.sin(u * 2.5 + t * 1.5 + i) * 0.3 * u; pts.push([x0 + Math.cos(aa) * L * u, y0 + Math.sin(aa) * L * u * 0.85]); }
    for (let k = 0; k < 8; k++) { const u = k / 8, w = 3.4 * Math.sin(Math.PI * (0.2 + u * 0.8)) + 0.8; g.strokeStyle = u > 0.8 ? '#e8e0e8' : '#ffffff'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); g.stroke(); }
    glow(g, pts[8][0], pts[8][1], 2.2, tipCol[i % 8], 0.6);
  }
};
// the Heavenly Fox: a slender white fox, its nine tails rising behind it like white flame
RP.drawHeavenlyFox = function (sim, e, lift, flash, S = 1, alpha = 1) {
  const g = this.g, t = sim.t, F = e.fx < 0 ? -1 : 1, X = sx(e.x), Y = sy(e.y) - lift;
  g.save(); g.globalAlpha = alpha;
  for (let i = 0; i < 9; i++) { // the tails: thick, flowing, white flushed pink, rising and streaming back
    const base = -Math.PI / 2 + F * 0.15 - F * (i * 0.2) + Math.sin(t * 1.4 + i) * 0.08, L = (30 + (i % 3) * 7 + Math.sin(i * 1.7) * 3) * S;
    const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12, aa = base - F * u * 0.6 + Math.sin(u * 4 + t * 2 + i * 0.7) * 0.22 * u; pts.push([X - F * 8 * S + Math.cos(aa) * L * u, Y - 12 * S + Math.sin(aa) * L * u]); }
    if (!flash) for (let k = 0; k < 12; k++) { const u = k / 12, w = (4.6 * Math.sin(Math.PI * (0.12 + u * 0.8)) + 2.2) * S; g.strokeStyle = '#c8909c'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); g.stroke(); } // each tail edged, so all nine read
    for (let k = 0; k < 12; k++) { const u = k / 12, w = (4.6 * Math.sin(Math.PI * (0.12 + u * 0.8)) + 1) * S; g.strokeStyle = flash ? '#ffffff' : u > 0.7 ? '#ffd8e4' : u > 0.4 ? '#fff0f4' : '#ffffff'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); g.stroke(); }
    for (let k = 3; k < 12; k += 3) { g.globalAlpha = 0.5 * alpha; g.fillStyle = '#e8b8c8'; g.fillRect(Math.round(pts[k][0]), Math.round(pts[k][1]), 1, 2); g.globalAlpha = alpha; } // strands of fur
  }
  // the body: slim, white, sitting tall
  g.fillStyle = flash ? '#ffffff' : '#fbf6f4';
  g.beginPath(); g.ellipse(X - F * 2 * S, Y - 9 * S, 9 * S, 6 * S, 0, 0, TAU); g.fill();              // haunch
  g.beginPath(); g.ellipse(X + F * 5 * S, Y - 13 * S, 4.5 * S, 8 * S, F * 0.3, 0, TAU); g.fill();     // chest
  g.lineCap = 'round'; g.strokeStyle = g.fillStyle;
  for (const lx of [3, 7]) { g.lineWidth = 2 * S; g.beginPath(); g.moveTo(X + F * lx * S, Y - 8 * S); g.lineTo(X + F * (lx + 1) * S, Y); g.stroke(); } // forelegs
  g.lineWidth = 3.5 * S; g.beginPath(); g.moveTo(X + F * 6 * S, Y - 18 * S); g.lineTo(X + F * 8 * S, Y - 24 * S); g.stroke(); // neck
  g.beginPath(); g.moveTo(X + F * 5 * S, Y - 27 * S); g.lineTo(X + F * 15 * S, Y - 24 * S); g.lineTo(X + F * 7 * S, Y - 21 * S); g.closePath(); g.fill(); // the long muzzle
  g.beginPath(); g.ellipse(X + F * 8 * S, Y - 25 * S, 3.6 * S, 3 * S, 0, 0, TAU); g.fill();            // head
  for (const o of [-2, 1.5]) { g.beginPath(); g.moveTo(X + F * (6 + o) * S, Y - 27 * S); g.lineTo(X + F * (6 + o * 1.3) * S, Y - 34 * S); g.lineTo(X + F * (8.5 + o) * S, Y - 27.5 * S); g.fill(); } // ears
  g.fillStyle = '#ffc8d8'; g.fillRect(Math.round(X + F * 6 * S), Math.round(Y - 31 * S), Math.max(1, Math.round(S)), Math.max(1, Math.round(2 * S)));
  if (!flash) { g.fillStyle = '#d8281c'; g.fillRect(Math.round(X + F * 9 * S), Math.round(Y - 26 * S), Math.max(1, Math.round(1.5 * S)), 1); glow(g, X + F * 9.5 * S, Y - 26 * S, 1.6 * S, '#ff3a3a', 0.6); } // a red eye
  g.strokeStyle = '#e8c8d0'; g.lineWidth = 0.6; g.globalAlpha = 0.8 * alpha; g.beginPath(); g.ellipse(X - F * 2 * S, Y - 9 * S, 9 * S, 6 * S, 0, 0.3, 2.6); g.stroke();
  g.restore(); g.globalAlpha = 1;
};

// who gets painted here instead of their sprite
RP.drawCelestialFigure = function (sim, e, lift, flash) {
  if (e.def.keeperModel) { this.drawKeeper(sim, e, lift, flash); return true; }
  if (e.type === 'swordsaint' && (e.corrupt || (e.corrupting && e.st < e.def.phase3.dur * 0.6))) { this.drawHeadless(sim, e, lift, flash); return true; }
  if (e.type === 'ancestor') { this.drawAncestor(sim, e, lift, flash); return true; }
  const owner = e.mirrorOf != null ? sim.enemies.find(o => o.id === e.mirrorOf) : e;
  if (e.type === 'tamamo' || (e.mirrorOf != null && owner && owner.type === 'tamamo')) {
    if (owner && (owner.tails || 1) >= 9) this.drawHeavenlyFox(sim, e, lift, flash, e === owner ? 1.6 : 1.1, e === owner ? 1 : 0.75); // her clones take the fox's shape too
    else this.drawFoxLady(sim, e, lift, flash);
    return true;
  }
  return false;
};

// =====================================================================================================
// hazards, beams, shots
// =====================================================================================================
const set2 = (o) => Object.assign(HZ, o);
set2({
  keeperhand(g, h, t, k) { E(g, h.x, h.y, h.r, '#fff0c0', 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r, '#fffaf0', 0.5 + k * 0.5, false); if (k > 0.55) { const u = (k - 0.55) / 0.45, x = sx(h.x), y = sy(h.y); for (let f = -2; f <= 2; f++) line(g, x + f * 2, y, x + f * 2.6, y - 12 * u, '#fffaf0', 1, 0.9); glow(g, x, y - 4, 5 * u, '#ffe8a0', 0.5); } },
  jarmouth(g, h, t, k) { E(g, h.x, h.y, h.r, '#6a4a2a', 0.3 + k * 0.4, true); E(g, h.x, h.y, h.r, '#c89060', 0.6 + k * 0.4, false, 1.4); },
  gucore(g, h, t, k) { E(g, h.x, h.y, h.r, '#3a2a10', 0.3 + k * 0.4, true); E(g, h.x, h.y, h.r * (1 - k), '#fff0c0', 0.8, false); for (let i = 0; i < 6; i++) { const a = t * 3 + i; g.fillStyle = '#c8a050'; g.fillRect(Math.round(sx(h.x + Math.cos(a) * h.r * 0.6)), Math.round(sy(h.y + Math.sin(a) * h.r * 0.6)), 1, 1); } },
  tallymark(g, h, t, k) { const x = Math.round(sx(h.x)), y = Math.round(sy(h.y)); g.globalAlpha = 0.4 + k * 0.6; g.fillStyle = '#fff0c0'; g.fillRect(x, y - Math.round(10 * k), 1, Math.round(10 * k) + 1); g.globalAlpha = 1; E(g, h.x, h.y, h.r, '#fff0c0', 0.4, false); },
  lastlight(g, h, t, k) { E(g, h.x, h.y, h.r, '#ffffff', 0.15 + k * 0.4, true); E(g, h.x, h.y, h.r, '#fff0c0', 0.7 + k * 0.3, false, 2); star4(g, sx(h.x), sy(h.y) - 10 - fall(k) * 90, 6 + k * 14, '#ffffff', 0.9); },
  spiderlily(g, h, t, k) { const x = sx(h.x), y = sy(h.y); E(g, h.x, h.y, h.r, '#8a0a10', 0.15 + k * 0.3, true); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t, L = h.r * (0.3 + k * 0.6); line(g, x, y - 2, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.5 - 3 * k, '#e8202a', 1, 0.8); g.fillStyle = '#ff5a5a'; g.fillRect(Math.round(x + Math.cos(a) * L), Math.round(y + Math.sin(a) * L * 0.5 - 3 * k), 1, 1); } disc(g, x, y - 2, 1.4, '#ffd84a'); },
  devalotus(g, h, t, k) { E(g, h.x, h.y, h.r, '#ffe9a8', 0.4 + k * 0.5, false); const x = sx(h.x), y = sy(h.y); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = h.r * 0.8 * k; g.globalAlpha = 0.6; g.fillStyle = i % 2 ? '#ffd8e8' : '#fff4d8'; g.beginPath(); g.ellipse(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.3, L * 0.45, L * 0.16, a, 0, TAU); g.fill(); } g.globalAlpha = 1; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.15 + k * 0.35; g.fillStyle = '#fff4c8'; g.fillRect(Math.round(x - 1 - k * 3), 13, Math.round(2 + k * 6), Math.round(y - 13)); g.restore(); },
  ghosthand(g, h, t, k) { const x = sx(h.x), y = sy(h.y); E(g, h.x, h.y, h.r, '#3a5a4a', 0.2 + k * 0.3, true); if (k > 0.4) { const u = (k - 0.4) / 0.6; for (let f = -1; f <= 1; f++) line(g, x + f * 1.5, y, x + f * 2.2, y - 9 * u, '#9affc8', 1, 0.7); disc(g, x, y - 2 * u, 2, '#5a8a6a', 0.7); } },
  hellchain(g, h, t, k) { E(g, h.x, h.y, h.r, '#ff3a0a', 0.15 + k * 0.35, true); const x = sx(h.x), y = sy(h.y); for (let i = 0; i < 3; i++) { g.strokeStyle = '#8a8a90'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x - 3 + i * 3, y - 1, 1.6, 1, 0, 0, TAU); g.stroke(); } if (Math.random() < 0.4 * k) { g.fillStyle = Math.random() < 0.5 ? '#ff7a1a' : '#ffe14d'; g.fillRect(Math.round(x + (Math.random() - 0.5) * h.r), Math.round(y - Math.random() * 6), 1, 1); } },
  foxeye(g, h, t, k) { const x = sx(h.x), y = sy(h.y) - 2; E(g, h.x, h.y, h.r, '#8a0a20', 0.2 + k * 0.3, true); eye(g, x, y, 5, '#ffe8e8', '#8a0a10', 0.4 + k * 0.6); g.globalAlpha = 0.5 * k; g.fillStyle = '#c8d0e0'; g.fillRect(Math.round(x - 6), Math.round(y - 28 * (1 - k)), 12, 1); g.globalAlpha = 1; },
  foxland(g, h, t, k) { E(g, h.x, h.y, h.r, '#ff3a6a', 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r, '#ffd8e4', 0.6 + k * 0.4, false, 2); E(g, h.x, h.y, h.r * (1 - k), '#ffffff', 0.8, false); },
});
Object.assign(BEAMS, { keeperray: ['#fff0c0', '#ffffff'], iteration: ['#e8d8a0', '#ffffff'], tallystrike: ['#fff0c0', '#ffffff'], asurablade: ['#ff4a3a', '#ffe0d0'], foxtail: ['#ffe0ec', '#ffffff'] });
Object.assign(PROJ, {
  yellowwater(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6; glow(g, x, y, 4, '#c8a030', 0.5); disc(g, x, y, 3, '#d8b040'); eye(g, x, y, 1.8, '#fff8d8', '#3a2a10'); },
  beastspirit(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6, a = Math.atan2(pr.vy * SQ, pr.vx); glow(g, x, y, 4, '#9affc8', 0.5); g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#c8ffe0'; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, TAU); g.fill(); g.fillRect(2, -3, 1, 2); g.fillRect(-4, 0, 3, 1); g.restore(); },
  foxflame(g, pr, t) { const x = sx(pr.x), y = sy(pr.y) - 6, c = ['#9ad8ff', '#ff9ad8', '#c8ff9a', '#ffd84a'][Math.floor(pr.x * 7 + pr.y) & 3]; glow(g, x, y, 4, c, 0.6); disc(g, x, y, 2.2, '#ffffff'); disc(g, x, y + 0.5, 1.6, c); },
});
Object.assign(BURST, { keeperhand: ['#ffffff', '#fff0c0'], jarmouth: ['#c89060', '#6a4a2a'], gucore: ['#fff0c0', '#c8a050', '#3a2a10'], tallymark: ['#fff0c0'], lastlight: ['#ffffff', '#fff0c0', '#ffe8a0'],
  spiderlily: ['#e8202a', '#ff5a5a', '#ffd84a'], devalotus: ['#ffffff', '#fff4d8', '#ffd8e8'], ghosthand: ['#9affc8', '#3a5a4a'], hellchain: ['#ff7a1a', '#ffe14d', '#8a8a90'], foxeye: ['#ffe8e8', '#ff3a3a'], foxland: ['#ffffff', '#ffd8e4', '#ff9ad8', '#9ad8ff'] });
Object.assign(BIG, { lastlight: 22, foxland: 14, gucore: 6, devalotus: 5 });

// =====================================================================================================
// spectacles
// =====================================================================================================
const baseSpect = RP.drawSpectacles;
RP.drawSpectacles = function (sim, layer) {
  baseSpect.call(this, sim, layer);
  const g = this.g, t = sim.t;
  if (layer === 'back' && sim.pageScars) for (const s of sim.pageScars) { const ux = Math.cos(s.a), uy = Math.sin(s.a); line(g, sx(s.x - ux * 140), sy(s.y - uy * 140), sx(s.x + ux * 140), sy(s.y + uy * 140), '#f4f0e6', 1, 0.55); } // where the Fourteenth cut the page
  for (const S of sim.spectacles || []) {
    const k = Math.min(1, S.t / 0.4, (S.dur - S.t) / 0.4), e = S.owner;
    if (layer === 'back') {
      if (S.kind === 'lid') { // the lid comes down: a shadow over the whole jar, light only through the holes
        const u = Math.min(1, S.t / S.at);
        g.globalAlpha = (0.25 + 0.55 * u) * k; g.fillStyle = '#000000'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        g.globalAlpha = 0.5 * k; g.fillStyle = '#1a140a'; g.beginPath(); g.ellipse(W / 2, 13 + (1 - u) * 6, 150, 20 + u * 30, 0, 0, Math.PI); g.fill(); g.globalAlpha = 1; // its rim, lowering
        for (const h of S.holes || []) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 * k; g.fillStyle = '#fff0c0'; const x = sx(h.x); g.fillRect(Math.round(x - h.r * 0.8), 13, Math.round(h.r * 1.6), Math.round(sy(h.y) - 13)); g.restore(); E(g, h.x, h.y, h.r, '#fff6d8', 0.35 * k, true); E(g, h.x, h.y, h.r, '#ffffff', 0.9 * k, false, 1.2); }
      }
      if (S.kind === 'iterations') { // a ring of every life you've lived, standing round the edge
        g.globalAlpha = 0.45 * k; g.fillStyle = '#0a0806'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * 0.1, x = sx(Math.cos(a) * (R - 4)), y = sy(Math.sin(a) * (R - 4)); g.globalAlpha = 0.35 * k * (0.6 + 0.4 * Math.sin(t * 3 + i)); g.fillStyle = '#e8d8a0'; g.fillRect(Math.round(x - 1), Math.round(y - 9), 3, 9); g.fillRect(Math.round(x - 1), Math.round(y - 12), 3, 2); }
        g.globalAlpha = 1;
      }
      if (S.kind === 'lastlight' && e) { // his head bursts into a sun of rays
        g.globalAlpha = 0.6 * k; g.fillStyle = '#000000'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        const x = sx(e.x), y = sy(e.y) - 45; g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + t * 0.4, L = 60 + 40 * Math.abs(Math.sin(t * 2 + i)); g.globalAlpha = 0.25 * k; g.strokeStyle = '#fff0c0'; g.lineWidth = i % 3 ? 1 : 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
        g.restore();
      }
      if (S.kind === 'jarturn') for (let i = 0; i < 3; i++) { const r2 = R * (0.4 + i * 0.25); g.globalAlpha = 0.35 * k; g.strokeStyle = '#c89060'; g.setLineDash([6, 5]); g.lineDashOffset = -t * 40 * Math.sign(S.w || 1) * (i + 1); g.beginPath(); g.ellipse(sx(0), sy(0), r2, r2 * SQ, 0, 0, TAU); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      if (S.kind === 'inksea') { g.globalAlpha = 0.55 * k; g.fillStyle = '#05040a'; g.fillRect(0, 13, W, H - 13); for (let i = 0; i < 6; i++) { const y = 40 + i * 16 + Math.sin(t * 2 + i) * 3; g.globalAlpha = 0.4 * k; g.strokeStyle = '#3a2a5a'; g.beginPath(); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.08 + t * 3 + i) * 2); g.stroke(); } g.globalAlpha = 1; }
      if (S.kind === 'yellowriver') { // the Yellow Springs rise over the floor: lanterns adrift, faces under the water
        g.globalAlpha = 0.35 * k; g.fillStyle = '#6a5010'; g.fillRect(0, 13, W, H - 13);
        for (let i = 0; i < 8; i++) { const x = (i * 37 + t * 14) % (W + 20) - 10, y = 50 + (i * 23) % 80; g.globalAlpha = 0.8 * k; disc(g, x, y, 1.6, '#ffd84a', 0.8 * k); glow(g, x, y, 2.5, '#ffb040', 0.4 * k); g.globalAlpha = 0.25 * k; g.fillStyle = '#e8d8b0'; g.fillRect(Math.round(x + 12), Math.round(y + 6), 3, 3); }
        g.globalAlpha = 1;
      }
      if (S.kind === 'sixpaths') { // the wheel of rebirth over the stage, its six spokes, and the path now turning
        g.globalAlpha = 0.45 * k; g.fillStyle = '#100800'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        const a0 = t * 0.5, cx = sx(0), cy = sy(0), r2 = R - 2;
        g.save(); g.translate(cx, cy); g.scale(1, SQ); g.globalAlpha = 0.6 * k; g.strokeStyle = '#c8962e'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r2, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r2 * 0.25, 0, TAU); g.stroke();
        for (let i = 0; i < 6; i++) { const a = a0 + i * TAU / 6; g.beginPath(); g.moveTo(Math.cos(a) * r2 * 0.25, Math.sin(a) * r2 * 0.25); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.stroke(); }
        g.restore(); g.globalAlpha = 1;
        const names = ['DEVA', 'ASURA', 'HUMAN', 'ANIMAL', 'HUNGRY GHOST', 'HELL'], idx = Math.min(5, Math.floor(S.t / 1.0));
        this.text(names[idx], W / 2, 24, ['#fff4c8', '#ff6a5a', '#e8d8a0', '#9affc8', '#9ac8b0', '#ff7a1a'][idx], 'center');
      }
      if (S.kind === 'foxmoon') { // a red sky, a red moon, the fox's white spirit coiled round it, and eyes opening in the sky
        g.globalAlpha = 0.6 * k; g.fillStyle = '#4a0610'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
        const mx = 196, my = 38; glow(g, mx, my, 18, '#ff4a1a', 0.5 * k); disc(g, mx, my, 15, '#d8501a', k); disc(g, mx - 4, my + 3, 4, '#b83a10', k);
        for (let i = 0; i < 3; i++) { g.globalAlpha = 0.85 * k; g.strokeStyle = i ? '#ffe8f0' : '#ffffff'; g.lineWidth = 5 - i * 1.5; g.lineCap = 'round'; g.beginPath(); for (let s2 = 0; s2 <= 30; s2++) { const u = s2 / 30, a = u * 5 + t * 0.6 + i * 0.4, rr = 30 - u * 12; g.lineTo(mx + Math.cos(a) * rr - 20 * u, my + Math.sin(a) * rr * 0.7 - 10 * (1 - u)); } g.stroke(); }
        for (let i = 0; i < 6; i++) { const x = 20 + i * 30, y = 20 + (i % 2) * 12; eye(g, x, y, 4 + Math.sin(t * 2 + i), '#c8d0e0', '#4a0610', 0.6 * k); }
        g.globalAlpha = 1;
      }
    } else if (S.kind === 'pagecut') {
      this.drawPageCut(sim, S);
    }
  }
};
// The Fourteenth Sword: the world drains to ink on paper, folds flat as a page turned edge-on, a pencil line is drawn
// across it through you, one bare blade (the only thing left with depth) cuts it, sheathes, and the world fills out again.
RP.drawPageCut = function (sim, S) {
  const g = this.g, T = S.t, e = S.owner;
  if (!this.pageBuf) { this.pageBuf = mk(W, H); }
  const b = this.pageBuf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.drawImage(g.canvas, 0, 0);
  const fold = T < 0.8 ? T / 0.8 : T < 2.9 ? 1 : T < 3.5 ? 1 - (T - 2.9) / 0.6 * 1.08 : Math.max(0, -0.08 + (T - 3.5) * 0.4); // overshoots a little on the way back
  const sq = 1 - 0.9 * Math.max(0, Math.min(1, fold)) + (fold < 0 ? -fold * 0.5 : 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#ece4d2'; g.fillRect(0, 13, W, H - 13); // the paper
  g.filter = `grayscale(${Math.min(1, fold * 1.2)}) contrast(1.2)`;
  g.translate(0, CY); g.scale(1, Math.max(0.05, sq)); g.translate(0, -CY); g.drawImage(this.pageBuf, 0, 13, W, H - 13, 0, 13, W, H - 13);
  g.restore(); g.filter = 'none';
  const ux = Math.cos(S.ang), uy = Math.sin(S.ang), lx0 = sx(S.ax - ux * 160), ly0 = CY + (sy(S.ay - uy * 160) - CY) * sq, lx1 = sx(S.ax + ux * 160), ly1 = CY + (sy(S.ay + uy * 160) - CY) * sq;
  if (T > 0.8 && T < 2.4) { g.setLineDash([3, 2]); line(g, lx0, ly0, lx1, ly1, '#5a5a62', 0.7, Math.min(1, (T - 0.8) * 2)); g.setLineDash([]); } // the pencil line
  if (T >= 2.3 && T < 3.0) { const u = Math.min(1, (T - 2.3) / 0.12); g.fillStyle = '#ffffff'; g.save(); g.beginPath(); g.moveTo(lx0, ly0 - 2); g.lineTo(lx0 + (lx1 - lx0) * u, ly0 + (ly1 - ly0) * u - 2); g.lineTo(lx0 + (lx1 - lx0) * u, ly0 + (ly1 - ly0) * u + 2); g.lineTo(lx0, ly0 + 2); g.fill(); g.restore(); } // the page cut open: a blank slit
  if (e && !e.dead && T > 0.4 && T < 2.9) { // the blade: bare, in full colour, the only thing with depth
    const x = sx(e.x), y = CY + (sy(e.y) - CY) * sq - 10, swing = T < 2.2 ? -1.2 : T < 2.4 ? -1.2 + (T - 2.2) / 0.2 * 2.6 : 1.4;
    g.save(); g.translate(x, y); g.rotate(swing + S.ang);
    g.fillStyle = '#e8eef8'; g.fillRect(0, -1, 26, 2); g.fillStyle = '#ffffff'; g.fillRect(0, -1, 26, 1); g.fillStyle = '#8a92a8'; g.fillRect(0, 0, 26, 1);
    g.fillStyle = '#c8962e'; g.fillRect(-2, -3, 2, 6); g.fillStyle = '#2a2030'; g.fillRect(-7, -1, 5, 2);
    g.restore();
  }
  if (T > 0.5 && T < 2.2) this.text('CUT', W / 2, 30, '#141414', 'center');
};

// =====================================================================================================
// events
// =====================================================================================================
const baseEvent = RP.celestialEvent;
RP.celestialEvent = function (ev) {
  const x = sx(ev.x), y = sy(ev.y) - 4;
  switch (ev.type) {
    case 'swordcorrupt': this.flash('rgba(0,0,0,0.85)', 0.5); this.shake = Math.max(this.shake, 16); this.cburst(x, y - 20, 80, 160, ['#050408', '#120a18', '#d8d8e8'], 1.2, 30); this.banner = { text: 'SWORD WITHOUT A HEAD', life: 2.6, small: true, color: '#d8d8e8', kicker: 'THE BLACK SEA WAS ALREADY IN HIM', lore: 'THE SWORD NEEDS NO HAND. IT NEEDS NO HEAD EITHER' }; this.snd('ultboom'); return true;
    case 'inkecho': this.cburst(x, y - 10, 10, 50, ['#120a18', '#5a4a7a'], 0.4); return true;
    case 'pagecut': this.flash('rgba(255,255,255,0.9)', 0.1); this.shake = Math.max(this.shake, 4); this.snd('slash'); return true;
    case 'sheathe': this.banner = ev.fell ? { text: 'SHEATHED', life: 2.2, small: true, color: '#ece4d2', kicker: 'THE FOURTEENTH IS TO SHEATHE IT' } : { text: 'AGAIN', life: 1.2, small: true, color: '#ece4d2' }; this.snd('chime'); return true;
    case 'lidclose': this.flash('rgba(0,0,0,0.85)', 0.25); this.shake = Math.max(this.shake, 14); this.snd('ultboom'); return true;
    case 'keeperflare': this.cburst(x, y - 40, 14, 60, ['#ffffff', '#fff0c0'], 0.4); this.snd('holy'); return true;
    case 'formerselves': this.banner = { text: 'YOUR FORMER SELVES', life: 1.4, small: true, color: '#e8d8a0' }; this.cburst(x, y, 20, 90, ['#e8d8a0', '#ffffff'], 0.6); this.snd('warp'); return true;
    case 'iterations': case 'jarturn': this.shake = Math.max(this.shake, 4); this.snd('magic'); return true;
    case 'beaststampede': this.shake = Math.max(this.shake, 6); this.snd('roar'); return true;
    case 'fishcast': this.cburst(x, y, 24, 90, ['#d8b040', '#ffe9a8', '#3a5a8a'], 0.6, 60); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 18, life: 0.5, max: 0.5, color: '#ffe9a8' }); return false; // and the usual splash
    case 'release': if (ev.id === 'surge') { for (let i = 0; i < 12; i++) this.parts.push({ kind: 'px', x: x + ev.fx * (8 + i * 4), y: y + (Math.random() - 0.5) * 10, vx: ev.fx * 40, vy: -20 - Math.random() * 30, g: 60, life: 0.6, max: 0.6, color: i % 3 ? '#d8b040' : '#e8d8b0' }); } return false;
  }
  return baseEvent.call(this, ev);
};
})();
