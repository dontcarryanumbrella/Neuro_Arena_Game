// The Sword Immortal and the Thirteen Swords of Heaven's End: how he and every sword look.
// Drawing only; the sim decides what each sword does. Loaded after render.js and adds to the Renderer.
//
// Each sword has its own visual language, rising from mortal craft to something beyond it:
//   I    Drawing the Sword        a razor crescent and the click of the sheath
//   II   Chasing the Wind         wind lines; ghosts of him left behind, each cutting a beat later
//   III  Falling Rain             swords thrown to the sky, hanging, glinting, then falling and staying where they land
//   IV   Sweeping the Moon        a pale moon behind him, and the moon's edge cut loose across the stage
//   V    Returning Swallow        a sword with a swallow's forked tail of light
//   VI   Hundred Shadows          shadow swords waiting all around, then cutting through together
//   VII  Severing the River       a wall of sword energy rising along a flowing line
//   VIII Piercing the Heavens     the clouds part, a pillar of light, a celestial sword descends, the ground cracks
//   IX   Ten Thousand Swords      a great formation circle, its swords revealed one by one, then one thrust
//   X    A Sword Without Form     he slowly raises a hand; the air warps, and endless invisible cleaves open everywhere
//   XI   Severing Cause & Effect  a slow red stroke; red lines bind you to the arena's edge, and each second one snaps
//   XII  Man and Sword as One     the world slows to half; four streaks of light; then a vast half-moon left burning on the stage
//   XIII Heaven and Earth         the world stills and dims, light rises, one finger, one line, and it all comes apart

// The line the teacher cuts across the sky when he yields (screen y at x): the same curve as the split the Summit's
// sky keeps open, so the Peaks and the Summit share one wound.
const SKY_SCAR = x => { const u = (x + 4) / 264; return 31.7 * (1 - u) * (1 - u) + 38.4 * u * (1 - u) + 7.6 * u * u; };

const SWORD_CN =['拔剑', '追风', '落雨', '扫月', '归燕', '百影', '断江', '贯天', '万剑归一', '无形剑', '斩因果', '人剑合一', '天地一剑'];
const SWORD_EN = ['DRAWING THE SWORD', 'CHASING THE WIND', 'FALLING RAIN', 'SWEEPING THE MOON', 'RETURNING SWALLOW', 'HUNDRED SHADOWS', 'SEVERING THE RIVER',
  'PIERCING THE HEAVENS', 'TEN THOUSAND SWORDS RETURN', 'A SWORD WITHOUT FORM', 'SEVERING CAUSE AND EFFECT', 'MAN AND SWORD AS ONE', 'HEAVEN AND EARTH, ONE SWORD'];
const SWORD_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
const SW = { white: '#ffffff', pale: '#e8f4ff', blue: '#9fd8ff', deep: '#3f7fd0', gold: '#ffd88a', red: '#ff5a7a', steel: '#dfe9f5', shade: '#8fa3bd', ink: '#1c2440', scale: 1, guard: '#ffd84a', hilt: '#2f4f8a', pommel: '#c9a65a', tassel: '#c23b22', tassel2: '#8f2416', rib1: '#9fc8e8', rib2: '#3f7fd0' };
// the Unfinished Manual: the swords he has left, drawn in crimson and gold, and bigger
const SW_BOUND = { white: '#fff4e0', pale: '#ffd8b0', blue: '#ff4a5a', deep: '#a01030', gold: '#ffcf4a', red: '#ffcf4a', steel: '#ffe6d6', shade: '#c0786a', ink: '#3a0a14', scale: 1.4, guard: '#ffd84a', hilt: '#2f4f8a', pommel: '#c9a65a', tassel: '#c23b22', tassel2: '#8f2416', rib1: '#9fc8e8', rib2: '#3f7fd0' };
// the Corrupted Manual: the Black Sea in him, every sword drawn in ink (painted over the world, not lit into it)
const SW_INK = { white: '#0a0710', pale: '#cfc8dc', blue: '#2a1c3a', deep: '#141018', gold: '#9a8ab8', red: '#f2eef8', steel: '#16121e', shade: '#4a4458', ink: '#000000', scale: 1.3, guard: '#d8d2e4', hilt: '#0c0a12', pommel: '#5a5268', tassel: '#0a0810', tassel2: '#3a3448', rib1: '#14101c', rib2: '#3a3050' };
const SWORD_HAZARDS = new Set(['afterimage', 'swordrain', 'sword', 'cleave', 'riverwave', 'shadowcut', 'onethrust', 'onesword']);
const CJK_FONT = '"KaiTi", "STKaiti", "Kaiti SC", "Kaiti TC", "BiauKai", "SimSun", "Noto Serif SC", serif';
const ease = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const clamp01 = u => Math.min(1, Math.max(0, u));

Object.assign(Renderer.prototype, {
  // ---------- small brushes ----------
  swordFx(kind, o) { (this.swFx = this.swFx || []).push({ kind, age: 0, bound: this.boundNow, ...o }); },
  // draw something in the Unfinished Manual's colours and size, then put the ordinary ones back
  bounded(on, fn) { if (!on) return fn(); const keep = { ...SW }, ink0 = this.inkMode; Object.assign(SW, on === 'ink' ? SW_INK : SW_BOUND); this.inkMode = on === 'ink'; try { return fn(); } finally { Object.assign(SW, keep); this.inkMode = ink0; } },
  // a colour written into an effect by hand: in the corrupted man's ink it comes out as ink (dark, or a pale edge if it was bright)
  inkish(c) { if (!this.inkMode) return c; const m = /^#([0-9a-f]{6})$/i.exec(c), v = m ? parseInt(m[1].slice(0, 2), 16) * 0.3 + parseInt(m[1].slice(2, 4), 16) * 0.59 + parseInt(m[1].slice(4, 6), 16) * 0.11 : 0; if (!m) { const q = /rgba?\([^,]+,[^,]+,[^,]+,?\s*([0-9.]*)\)/.exec(c); return `rgba(20,14,30,${q && q[1] !== '' ? q[1] : 1})`; } return v > 215 ? '#d8d2e4' : v > 120 ? '#3a3448' : '#0a0710'; },
  palOf(src) { return src ? (src.corrupt ? 'ink' : src.deathBound) : false; }, // whose colours: the bound man's crimson, or the corrupted one's ink
  lit(fn) { const g = this.g; g.save(); g.globalCompositeOperation = this.inkMode ? 'source-over' : 'lighter'; fn(g); g.restore(); }, // ink is laid on, not lit

  // a soft round light
  glow(x, y, r, color, alpha) {
    if (alpha <= 0 || r <= 0) return;
    this.lit(g => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = alpha; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    });
  },

  // a four-pointed glint
  flare(x, y, s, color = SW.white, alpha = 1) {
    if (alpha <= 0) return;
    this.lit(g => {
      g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s * 0.7); g.lineTo(x, y + s * 0.7); g.stroke();
      g.globalAlpha = alpha * 0.5; g.beginPath(); g.moveTo(x - s * 0.35, y - s * 0.35); g.lineTo(x + s * 0.35, y + s * 0.35); g.moveTo(x + s * 0.35, y - s * 0.35); g.lineTo(x - s * 0.35, y + s * 0.35); g.stroke();
    });
    this.glow(x, y, s * 0.8, color, alpha * 0.6);
  },

  // a line of light: a coloured glow round a white core
  lightLine(x0, y0, x1, y1, w, color, alpha) {
    if (alpha <= 0) return;
    w *= SW.scale;
    this.lit(g => {
      g.lineCap = 'round';
      g.globalAlpha = alpha * 0.35; g.strokeStyle = color; g.lineWidth = w * 2.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.globalAlpha = alpha; g.strokeStyle = SW.white; g.lineWidth = Math.max(0.6, w * 0.6); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    });
  },

  // a crescent of sword light: thick in the middle, fine at both tips (sq flattens it into the 3/4 view)
  crescent(cx, cy, r, a0, a1, th, alpha, core = SW.white, edge = SW.blue, sq = 0.62) {
    if (alpha <= 0 || Math.abs(a1 - a0) < 0.01) return;
    th *= SW.scale;
    const n = 26, pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sq]); }
    for (let i = n; i >= 0; i--) { const u = i / n, a = a0 + (a1 - a0) * u, rr = r - th * Math.sin(Math.PI * u); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sq]); }
    const g = this.g, path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    this.lit(c => { path(); c.globalAlpha = alpha * 0.55; c.strokeStyle = edge; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke(); }); // its glow
    g.save(); path(); g.globalAlpha = alpha * 0.9; g.fillStyle = edge; g.fill(); // painted, so it keeps its shape even on pale stone
    g.beginPath(); for (let i = 0; i <= n; i++) g.lineTo(...pts[i]); g.globalAlpha = alpha; g.strokeStyle = core; g.lineWidth = 1.2; g.stroke(); // and its keen outer edge
    g.restore();
  },

  // a small flying sword, pixel by pixel: tip at (x, y), pointing along a (screen radians)
  miniSword(x, y, a, len = 7, alpha = 1, glow = 0.35, shadow) {
    if (alpha <= 0) return;
    len *= SW.scale;
    const g = this.g, dx = Math.cos(a), dy = Math.sin(a), bl = len * 0.7;
    if (glow) this.lit(c => { c.globalAlpha = alpha * glow; c.strokeStyle = shadow ? '#5a6cff' : SW.blue; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dx * len, y - dy * len); c.stroke(); });
    const a0 = g.globalAlpha; g.globalAlpha = a0 * alpha;
    this.pline(x, y, x - dx * bl, y - dy * bl, shadow ? SW.ink : SW.steel);
    this.pix(x, y, shadow ? '#7f8cff' : SW.white);
    const gx = x - dx * bl, gy = y - dy * bl;
    this.pline(gx - dy * 1.6, gy + dx * 1.6, gx + dy * 1.6, gy - dx * 1.6, shadow ? '#3a3f6a' : SW.guard); // the guard
    this.pline(gx - dx, gy - dy, x - dx * len, y - dy * len, shadow ? '#141830' : SW.hilt);      // the hilt
    this.pix(x - dx * (len + 0.6), y - dy * (len + 0.6), shadow ? '#3a3f6a' : SW.pommel);           // the pommel
    g.globalAlpha = a0;
  },

  // a great sword drawn as a shape: tip at (tx, ty), pointing along a. Celestial (gold and jade) or shadow.
  bigSword(tx, ty, a, len, wid, alpha = 1, look = 'celestial', t = 0) {
    if (alpha <= 0) return;
    const g = this.g, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, shadow = look === 'shadow';
    const P = (along, side) => [tx - dx * along + px * side, ty - dy * along + py * side];
    const blade = len * 0.76, half = wid / 2;
    const outline = [P(0, 0), P(len * 0.1, half * 0.85), P(blade, half), P(blade, -half), P(len * 0.1, -half * 0.85)];
    const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    this.lit(c => { c.globalAlpha = alpha * 0.45; path(outline); c.strokeStyle = shadow ? '#5a6cff' : SW.blue; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke(); }); // its aura
    g.save(); g.globalAlpha = alpha;
    const [lx, ly] = P(0, half), [rx, ry] = P(0, -half), gr = g.createLinearGradient(lx, ly, rx, ry);
    if (shadow) { gr.addColorStop(0, '#2a3160'); gr.addColorStop(0.5, '#141830'); gr.addColorStop(1, '#0a0c1a'); }
    else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, SW.steel); gr.addColorStop(1, SW.shade); }
    path(outline); g.fillStyle = gr; g.fill();
    g.strokeStyle = shadow ? '#7f8cff' : '#ffffff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(len * 0.1, half * 0.85)); g.lineTo(...P(blade, half)); g.stroke(); // the lit edge
    g.strokeStyle = shadow ? '#3a3f6a' : '#9fb8d8'; g.lineWidth = Math.max(0.8, wid * 0.18); g.beginPath(); g.moveTo(...P(len * 0.16, 0)); g.lineTo(...P(blade - 1, 0)); g.stroke(); // the fuller
    if (!shadow) for (let i = 0; i < 4; i++) { const [x, y] = P(len * (0.25 + i * 0.12), 0); if ((Math.floor(t * 6) + i) % 3) { g.fillStyle = SW.gold; g.fillRect(Math.round(x), Math.round(y), 1, 1); } } // runes along the blade
    const gw = wid * 1.5, gt = Math.max(1.5, wid * 0.45); // the crossguard, its ends curling up like clouds
    g.lineCap = 'round'; g.strokeStyle = shadow ? '#3a3f6a' : '#e8c34a'; g.lineWidth = gt;
    g.beginPath(); g.moveTo(...P(blade + gt * 0.6, -gw)); g.quadraticCurveTo(...P(blade + gt * 0.2, 0), ...P(blade + gt * 0.6, gw)); g.stroke();
    g.lineWidth = gt * 0.7; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(...P(blade + gt * 0.6, s * gw)); g.lineTo(...P(blade - gt * 0.6, s * (gw + gt * 0.5))); g.stroke(); }
    if (!shadow) { const [jx, jy] = P(blade + gt * 0.3, 0); g.fillStyle = '#3fbf8a'; g.beginPath(); g.arc(jx, jy, Math.max(1, gt * 0.45), 0, Math.PI * 2); g.fill(); g.fillStyle = '#c8ffe8'; g.fillRect(Math.round(jx), Math.round(jy) - 1, 1, 1); }
    const hl = len * 0.18; // the hilt, bound in blue, and a gold pommel
    g.strokeStyle = shadow ? '#141830' : '#2f4f8a'; g.lineWidth = Math.max(1.5, wid * 0.42); g.beginPath(); g.moveTo(...P(blade + gt, 0)); g.lineTo(...P(blade + gt + hl, 0)); g.stroke();
    if (!shadow) { g.strokeStyle = '#c9a65a'; g.lineWidth = 0.8; for (let i = 1; i < 4; i++) { const u = blade + gt + hl * i / 4; g.beginPath(); g.moveTo(...P(u, -wid * 0.21)); g.lineTo(...P(u + 1, wid * 0.21)); g.stroke(); } }
    const [qx, qy] = P(blade + gt + hl + 1, 0); g.fillStyle = shadow ? '#3a3f6a' : '#e8c34a'; g.beginPath(); g.arc(qx, qy, Math.max(1, wid * 0.32), 0, Math.PI * 2); g.fill();
    if (!shadow) { g.strokeStyle = '#c23b22'; g.lineWidth = 1; g.beginPath(); g.moveTo(qx, qy); g.quadraticCurveTo(qx - dx * 4 + Math.sin(t * 5) * 2, qy - dy * 4, qx - dx * 7 + Math.sin(t * 5 + 1) * 3, qy - dy * 7 + 2); g.stroke(); } // a red tassel
    g.restore();
  },

  // ---------- what the sim tells us ----------
  swordEvent(ev) {
    const P = this.parts, r = Math.random;
    const sparks = (x, y, n, sp, colors, life = 0.4, grav = 0) => { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, v = sp * (0.4 + r() * 0.6); P.push({ kind: 'px', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, g: grav, life: life * (0.6 + r() * 0.4), max: life, color: colors[i % colors.length] }); } };
    { const m = this.sim && this.sim.enemies.find(e => e.def.manual && !e.dead && (e.corrupt || e.deathBound)); this.boundNow = m ? (m.corrupt ? 'ink' : true) : false; } // effects begun now keep his last colours
    const cast = ev.type === 'release' ? ev.id : ev.type; // melee swords announce themselves by name rather than as a release
    switch (/^sword\d+$/.test(cast || '') ? 'release' : ev.type) {
      case 'ultCharge': { // his ultimates are swords of the manual too: their names are written once the ULTIMATE banner clears
        const n = /^Ninth Sword/.test(ev.name || '') ? 9 : /^Thirteenth Sword/.test(ev.name || '') ? 13 : 0;
        if (n) this.swordTitle = { n, ink: this.boundNow === 'ink', t: -((ev.charge || 1) + 0.4), life: 2.4 };
        break;
      }
      case 'swordname':
        this.swordTitle = { n: ev.n, adv: ev.adv, bound: ev.bound, ink: this.boundNow === 'ink', t: 0, life: 1.8 };
        this.swordFx('cast', { x: ev.x, y: ev.y, life: 0.45, adv: ev.adv });
        (this.swAdv = this.swAdv || {})[ev.n] = ev.adv;
        break;
      case 'release': {
        const m = /^sword(\d+)$/.exec(cast || ''); if (!m) break;
        const n = +m[1], a = Math.atan2((ev.fy || 0) * SQ, ev.fx || 1), X = sx(ev.x), Y = sy(ev.y) - 6, adv = this.swAdv && this.swAdv[n];
        if (n === 1) {
          this.swordFx('iaido', { x: ev.x, y: ev.y, a, life: 0.55, adv }); this.flash('rgba(255,255,255,0.22)', 0.04);
          for (let i = 0; i < 14; i++) { const b = a - 1.2 + 2.3 * r(); P.push({ kind: 'px', x: X + Math.cos(b) * 19, y: Y + Math.sin(b) * 12, vx: Math.cos(b) * 50, vy: Math.sin(b) * 30, life: 0.35, max: 0.35, color: i % 2 ? SW.white : SW.blue }); }
        }
        if (n === 2) { this.swordFx('wind', { x: ev.x, y: ev.y, a, life: 0.4, seed: r() * 99 }); for (let i = 0; i < 10; i++) P.push({ kind: 'px', x: X + (r() - .5) * 10, y: Y + (r() - .5) * 8, vx: -Math.cos(a) * (40 + r() * 60), vy: -Math.sin(a) * 30 + (r() - .5) * 20, life: 0.4, max: 0.4, color: r() < 0.5 ? '#bff0e8' : SW.pale }); }
        if (n === 3) this.swordFx('rainrise', { x: ev.x, y: ev.y, life: 0.55, seeds: Array.from({ length: 12 }, () => [-Math.PI / 2 + (r() - .5) * 1.4, 160 + r() * 120]) });
        if (n === 4) this.swordFx('moon', { x: ev.x, y: ev.y, a, life: 0.8 });
        if (n === 5) this.swordFx('flick', { x: ev.x, y: ev.y, a, life: 0.25 });
        if (n === 6) this.swordFx('darkring', { x: ev.x, y: ev.y, life: 0.5 });
        if (n === 7) this.swordFx('riverdraw', { x: ev.x, y: ev.y, a, life: 0.35 });
        if (n === 8) this.swordFx('skypoint', { x: ev.x, y: ev.y, life: 0.6 });
        if (n === 11) this.swordFx('slowstroke', { x: ev.x, y: ev.y, a, life: 0.8 });
        break;
      }
      case 'sigilburst': {
        const X = sx(ev.x), Y = sy(ev.y);
        if (ev.variant === 'afterimage') { this.swordFx('ghostslash', { x: ev.x, y: ev.y, a: r() * 6.28, life: 0.32 }); sparks(X, Y - 6, 10, 70, [SW.pale, SW.blue], 0.4, -40); }
        if (ev.variant === 'swordrain') { this.swordFx('lodged', { x: ev.x, y: ev.y, life: 0.7, tilt: (r() - .5) * 0.5 }); sparks(X, Y, 6, 60, [SW.white, SW.blue], 0.3, 120); P.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 1, r1: 7, life: 0.3, max: 0.3, color: SW.pale }); }
        if (ev.variant === 'sword') {
          this.swordFx('heavenimpact', { x: ev.x, y: ev.y, life: 1.0 });
          this.swordFx('cracks', { x: ev.x, y: ev.y, life: 1.6, layer: 'g', lines: Array.from({ length: 10 }, (_, i) => { const a0 = i / 10 * 6.28 + r() * 0.4, pts = [[0, 0]]; let x = 0, y = 0; for (let k = 0; k < 4; k++) { const a1 = a0 + (r() - .5) * 0.7, l = 4 + r() * 7; x += Math.cos(a1) * l; y += Math.sin(a1) * l; pts.push([x, y]); } return pts; }) });
          sparks(X, Y - 4, 30, 160, [SW.white, SW.gold, SW.blue], 0.7, 60);
        }
        break;
      }
      case 'beamhit':
        if (ev.variant === 'shadowcut') this.swordFx('streak', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: 0.32, w: 2.2, color: '#7f8cff' });
        if (ev.variant === 'riverwave') { this.swordFx('river', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, w: ev.w, life: 1.0 }); this.swordFx('scar', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: 1.6, layer: 'g' }); }
        if (ev.variant === 'onethrust') { this.swordFx('thrust', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: 0.5 }); P.push({ kind: 'ring', x: ev.x1, y: ev.y1, r0: 2, r1: 26, life: 0.4, max: 0.4, color: SW.white }); }
        if (ev.variant === 'cleave') { // a cleave: the air simply parts along a line
          this.swordFx('cleavecut', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: 0.45 });
          for (let i = 0; i < 6; i++) { const u = r(); P.push({ kind: 'px', x: sx(ev.x + (ev.x1 - ev.x) * u), y: sy(ev.y + (ev.y1 - ev.y) * u) - 4, vx: (r() - .5) * 70, vy: -20 - r() * 40, g: 140, life: 0.4, max: 0.4, color: r() < 0.6 ? '#ffffff' : '#8a8f9c' }); }
          this.shake = Math.max(this.shake, 2);
        }
        if (ev.variant === 'onesword') { this.swordFx('heavencut', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: 0.5 }); this.flash('rgba(255,255,255,0.75)', 0.2); }
        break;
      case 'swordformation': this.swordFx('formation', { x: ev.x, y: ev.y, r: ev.r, n: ev.n || 12, d0: ev.d0 || 1.2, life: (ev.d0 || 1.2) + 0.7, layer: 'g' }); break;
      case 'cleavestorm': this.swordFx('cleavefield', { x: ev.x, y: ev.y, life: (ev.dur || 2) + 0.5 }); break;
      case 'karmalines': { // the lines of cause: from the edge of the arena, every one already holding them
        const anchors = Array.from({ length: ev.n || 5 }, (_, i) => { const a = (i + r() * 0.6) / (ev.n || 5) * Math.PI * 2; return [Math.cos(a) * (R - 3), Math.sin(a) * (R - 3)]; });
        this.swordFx('karma', { id: ev.id, anchors, life: 30, dim: 0 });
        this.flash('rgba(255,40,80,0.18)', 0.1);
        break;
      }
      case 'karmasnap': { // one cause gives way, and its effect lands
        const k = (this.swFx || []).find(f => f.kind === 'karma' && f.id === ev.id);
        const an = k && k.anchors.shift();
        if (k && !k.anchors.length) k.life = k.age + 0.3;
        this.swordFx('snap', { x: ev.x, y: ev.y, id: ev.id, ax: an ? an[0] : ev.x, ay: an ? an[1] : ev.y, life: 0.7, cut: r() * 0.8 - 0.4 });
        const X = sx(ev.x), Y = sy(ev.y) - 6;
        for (let i = 0; i < 12; i++) { const a = r() * 6.28, v = 30 + r() * 60; P.push({ kind: 'px', x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 20, g: 90, life: 0.6, max: 0.6, color: i % 3 ? SW.red : '#ffd0da' }); }
        this.flash('rgba(255,40,80,0.14)', 0.05); this.shake = Math.max(this.shake, 3); this.snd('slash');
        break;
      }
      case 'deathbound': // a killing blow lands, and he does not fall: the manual is not finished
        this.banner = { kicker: 'THE UNFINISHED MANUAL', text: 'NOT YET', color: SW.red, life: 2.0 };
        this.flash('rgba(255,255,255,0.5)', 0.12); this.shake = Math.max(this.shake, 6); this.snd('gong');
        for (let i = 0; i < 24; i++) { const a = r() * 6.28, v = 40 + r() * 80; P.push({ kind: 'px', x: sx(ev.x), y: sy(ev.y) - 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, life: 0.6, max: 0.6, color: i % 2 ? SW.red : SW.white }); }
        break;
      case 'teacheryield': // the teacher lowers his sword: the lesson is over, and the air goes still
        this.banner = { kicker: 'THE LESSON IS OVER', text: 'ENOUGH.', color: SW.pale, life: 2.3 };
        this.flash('rgba(255,255,255,0.3)', 0.12); this.snd('gong');
        this.swordFx('lowered', { x: ev.x, y: ev.y, life: YIELD_T - YIELD_DRAW });
        for (let i = 0; i < 16; i++) P.push({ kind: 'px', x: sx(ev.x) + (r() - .5) * 8, y: sy(ev.y) - 6 - r() * 10, vx: (r() - .5) * 20, vy: -10 - r() * 20, life: 1.2, max: 1.2, color: r() < 0.5 ? SW.white : SW.blue });
        break;
      case 'teacherdraw': { // one stroke, straight up into the sky, never at you: what he held back
        this.banner = { kicker: 'THE THIRTEENTH SWORD', text: 'WHAT I HELD BACK', color: SW.white, life: 2.0, small: true };
        this.flash('rgba(255,255,255,0.75)', 0.25); this.shake = Math.max(this.shake, 7); this.snd('ultboom');
        this.swordFx('skystroke', { x: ev.x, y: ev.y, life: 0.7 });
        for (let i = 0; i < 30; i++) { const x = r() * W; P.push({ kind: 'px', x, y: SKY_SCAR(x), vx: (r() - .5) * 30, vy: 10 + r() * 30, life: 1.2, max: 1.2, color: r() < 0.5 ? SW.white : SW.blue }); }
        break;
      }
      case 'teacherleave': // he turns, and goes up the stroke he left in the sky
        for (let i = 0; i < 40; i++) P.push({ kind: 'px', x: sx(ev.x) + (r() - .5) * 8, y: sy(ev.y) - 4 - r() * 14, vx: (r() - .5) * 16, vy: -40 - r() * 60, life: 1.6, max: 1.6, color: r() < 0.5 ? SW.white : SW.blue });
        this.snd('chime');
        break;
      case 'manualend': // the Thirteenth Sword drawn at last: every sword he carried breaks into light, and he goes with them
        this.banner = ev.survived ? { kicker: 'YOU ARE STILL STANDING', text: 'THE MANUAL IS COMPLETE', color: SW.pale, life: 3.0, small: true } : { kicker: 'THE THIRTEEN SWORDS', text: 'COMPLETE', color: SW.pale, life: 2.4 };
        if (ev.survived) this.swordFx('slowmo', { life: 1.2 });
        this.flash('rgba(255,255,255,0.8)', 0.3); this.snd('ultboom');
        for (let i = 0; i < 60; i++) P.push({ kind: 'px', x: sx(ev.x) + (r() - .5) * 10, y: sy(ev.y) - 8 + (r() - .5) * 8, vx: (r() - .5) * 60, vy: -20 - r() * 60, life: 1.6, max: 1.6, color: r() < 0.5 ? SW.white : SW.blue });
        break;
      case 'slowmo': this.swordFx('slowmo', { life: ev.dur || 2 }); this.snd('riser'); break;
      case 'bigcrescent': this.swordFx('moonfield', { x: ev.x, y: ev.y, a: ev.a, r0: ev.r0, r1: ev.r1, life: ev.dur || 2.6, layer: 'g' }); this.flash('rgba(220,240,255,0.5)', 0.1); this.shake = Math.max(this.shake, 8); this.snd('ultboom'); break;
      case 'swordlightdash': {
        this.swordFx('streak', { x0: ev.x, y0: ev.y, x1: ev.x1, y1: ev.y1, life: ev.last ? 0.9 : 0.6, w: 2.4, color: SW.blue, last: ev.last });
        for (let i = 0; i < 8; i++) { const u = r(); P.push({ kind: 'px', x: sx(ev.x + (ev.x1 - ev.x) * u), y: sy(ev.y + (ev.y1 - ev.y) * u) - 6, vx: (r() - .5) * 40, vy: (r() - .5) * 30, life: 0.4, max: 0.4, color: r() < 0.5 ? SW.white : SW.blue }); }
        break;
      }
      case 'swordshatter': for (let i = 0; i < 6; i++) P.push({ kind: 'px', x: sx(ev.x) + (r() - .5) * 6, y: sy(ev.y) - 5 + (r() - .5) * 4, vx: (r() - .5) * 20, vy: -10 - r() * 25, life: 1.2, max: 1.2, color: r() < 0.5 ? SW.white : SW.blue }); break;
      case 'stillness': this.swordFx('stillness', { x: ev.x, y: ev.y, life: 1.9, motes: Array.from({ length: 70 }, () => [r() * W, 14 + r() * (H - 14), 4 + r() * 10, r() * 6]) }); break;
      case 'onesworddraw': this.swordFx('finger', { x: ev.x, y: ev.y, life: 1.5 }); break;
      case 'forbidden': this.swordFx('forbidden', { x: ev.x, y: ev.y, life: 1.3, lines: Array.from({ length: 6 }, () => { const a0 = r() * 6.28, pts = [[0, 0]]; let x = 0, y = 0; for (let k = 0; k < 3; k++) { const a1 = a0 + (r() - .5) * 0.9; x += Math.cos(a1) * 3; y += Math.sin(a1) * 3; pts.push([x, y]); } return pts; }) }); break;
    }
  },

  // ---------- the hazards his swords leave ----------
  swordHazard(h, t) { return this.bounded(this.palOf(h.src), () => this.swordHazardBase(h, t)); },
  swordHazardBase(h, t) {
    const g = this.g, k = clamp01(1 - h.t / h.delay), r = Math.random;
    switch (h.variant) {
      case 'afterimage': { // a ghost of him, keeping his pose, a gleam running down its blade, then the cut
        const src = h.src, name = src && (src.isPlayer ? 'hero' : spriteFor(src)), flip = src ? (src.fx || 1) < 0 : false, F = flip ? -1 : 1;
        if (name && SPRITE_CACHE[name]) {
          const sc = (src.def && src.def.scale) || 1;
          g.globalAlpha = 0.18 + k * 0.4; this.sprite(name, h.x, h.y, flip, 'ghost', 4, sc);
          this.lit(c => { c.globalAlpha = 0.18 + 0.12 * Math.sin(t * 30); const s = SPRITE_CACHE[name], w = Math.round(s.w * sc), hh = Math.round(s.h * sc); c.drawImage(flip ? s.ghostF : s.ghost, Math.round(sx(h.x) - w / 2) + 1, Math.round(sy(h.y) - hh - 3), w, hh); });
          g.globalAlpha = 1;
        }
        const X = sx(h.x), Y = sy(h.y) - 8;
        for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1 + h.x; this.pix(X + Math.cos(a) * 7, Y + Math.sin(a) * 3, this.inkish('#bff0e8')); } // the wind still turning round it
        if (k > 0.55) this.flare(X + F * (3 + (k - 0.55) * 14), Y - 2 + (k - 0.55) * 8, 2 + k * 2, SW.white, (k - 0.55) * 2);
        return true;
      }
      case 'swordrain': { // a sword hanging point-down in the sky, then falling with a streak of light
        const X = sx(h.x) + Math.sin(h.y * 3.1) * 1.5, Y = sy(h.y), hgt = 62 + ((h.x * 7.3) % 14);
        g.globalAlpha = 0.25 + 0.45 * k; this.ellipse(h.x, h.y, h.r * (1.3 - 0.5 * k), SW.blue, true); g.globalAlpha = 1;
        this.pix(X, Y, k > 0.8 && Math.floor(t * 20) % 2 ? SW.white : SW.blue);
        if (k < 0.5) {
          const tipY = Y - hgt + Math.sin(t * 6 + h.x) * 1.2;
          this.miniSword(X, tipY, Math.PI / 2, 8, Math.min(1, k * 4), 0.4);
          if ((Math.floor(t * 8 + h.x) % 7) === 0) this.flare(X, tipY - 3, 2.5, SW.white, 0.8);
        } else {
          const v = (k - 0.5) / 0.5, tipY = Y - hgt * (1 - v * v * v);
          this.lightLine(X, tipY - 6 - v * v * 30, X, tipY - 6, 1, SW.blue, 0.25 + v * 0.5);
          this.miniSword(X, tipY, Math.PI / 2, 8, 1, 0.6);
        }
        return true;
      }
      case 'sword': { // Piercing the Heavens: the clouds part, light comes down, a celestial sword descends onto the rune circle
        const X = sx(h.x), Yg = sy(h.y), R0 = h.r;
        this.lit(c => { // the light from above
          const w = 2 + k * 12, gr = c.createLinearGradient(0, 13, 0, Yg);
          gr.addColorStop(0, this.inkish('rgba(255,240,200,0)')); gr.addColorStop(0.2, this.inkish('rgba(255,240,200,0.5)')); gr.addColorStop(1, this.inkish('rgba(160,215,255,0.65)'));
          c.globalAlpha = 0.25 + k * 0.45; c.fillStyle = gr; c.fillRect(X - w / 2, 13, w, Yg - 13);
        });
        g.save(); g.globalAlpha = 0.85; // the clouds pulling apart
        for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? this.inkish('#3a4258') : this.inkish('#4c566e'); g.beginPath(); g.ellipse(X + s * (8 + k * 34 + i * 7), 17 + (i % 2) * 2, 9 - i, 3.5, 0, 0, Math.PI * 2); g.fill(); }
        g.restore();
        this.lit(c => { // the rune circle, turning
          c.globalAlpha = 0.25 + k * 0.6; c.strokeStyle = this.inkish('#ffe6a0'); c.lineWidth = 1;
          c.beginPath(); c.ellipse(X, Yg, R0, R0 * SQ, 0, 0, Math.PI * 2); c.stroke();
          c.setLineDash([3, 3]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(X, Yg, R0 * 0.72, R0 * 0.72 * SQ, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
          for (let i = 0; i < 8; i++) { const a = t * 1.5 + i * Math.PI / 4; c.beginPath(); c.moveTo(X + Math.cos(a) * R0 * 0.78, Yg + Math.sin(a) * R0 * 0.78 * SQ); c.lineTo(X + Math.cos(a) * R0 * 0.95, Yg + Math.sin(a) * R0 * 0.95 * SQ); c.stroke(); }
          for (let i = 0; i < 4; i++) { const a = -t * 1.2 + i * Math.PI / 2, x = X + Math.cos(a) * R0 * 0.45, y = Yg + Math.sin(a) * R0 * 0.45 * SQ; c.fillStyle = SW.gold; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + 1.5, y); c.lineTo(x, y + 2); c.lineTo(x - 1.5, y); c.closePath(); c.fill(); }
        });
        const tipY = k < 0.8 ? Yg - 78 + 56 * ease(k / 0.8) : Yg - 22 + 22 * Math.pow((k - 0.8) / 0.2, 2); // it comes down out of the sky, hangs over them, then falls
        this.glow(X, tipY - 22, 18 + k * 8, this.inkish('rgba(160,215,255,1)'), 0.25 + k * 0.3);
        this.bigSword(X, tipY, Math.PI / 2, 60, 7, Math.min(1, k * 3), 'celestial', t);
        return true;
      }
      case 'cleave': { // an invisible cut about to happen: only the air along it warps and shimmers
        const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len, x0 = sx(h.x), y0 = sy(h.y) - 4, x1 = sx(ex), y1 = sy(ey) - 4;
        const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
        this.lit(c => {
          c.lineWidth = 1;
          for (let j = 0; j < 3; j++) { // three warped copies of the air, out of step with one another
            c.globalAlpha = (0.06 + 0.22 * k) * (j === 1 ? 1 : 0.6); c.strokeStyle = j === 1 ? this.inkish('#e8f4ff') : this.inkish('#bcc8d8'); c.beginPath();
            for (let i = 0; i <= 16; i++) { const u = i / 16, w = Math.sin(u * 9 + t * 22 + j * 2) * (1.6 - k) * 1.4 + (j - 1) * 1.2 * (1 - k); c.lineTo(x0 + (x1 - x0) * u + nx * w, y0 + (y1 - y0) * u + ny * w); }
            c.stroke();
          }
        });
        if (k > 0.8) this.lightLine(x0, y0, x1, y1, 0.3, this.inkish('#ffffff'), (k - 0.8) * 3); // the instant before: a hairline
        return true;
      }
      case 'shadowcut': { // a shadow sword hanging where it will strike from, his shade behind it
        const X = sx(h.x), Y = sy(h.y) - 6, dx = Math.cos(h.a), dy = Math.sin(h.a) * SQ, dl = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx), jit = k > 0.7 ? (r() - .5) * 1.2 : 0;
        if (h.src && !h.src.isPlayer && SPRITE_CACHE[spriteFor(h.src)]) { g.globalAlpha = 0.1 + k * 0.22; this.sprite(spriteFor(h.src), h.x - Math.cos(h.a) * 7, h.y - Math.sin(h.a) * 7, dx < 0, 'ghost', 4, 1); g.globalAlpha = 1; }
        g.save(); g.globalAlpha = 0.3 * k; g.strokeStyle = this.inkish('#7f8cff'); g.setLineDash([2, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + dx / dl * h.len * 0.8, Y + dy / dl * h.len * 0.8); g.stroke(); g.restore();
        this.bigSword(X + dx / dl * 8 + jit, Y + dy / dl * 8 + jit, a, 16, 3, 0.25 + k * 0.75, 'shadow', t);
        return true;
      }
      case 'riverwave': { // the river of sword energy gathering along its course before it rises
        const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len, x0 = sx(h.x), y0 = sy(h.y), x1 = sx(ex), y1 = sy(ey), L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, hw = h.w * 0.5 * SQ;
        this.lit(c => {
          c.globalAlpha = 0.12 + 0.3 * k; c.strokeStyle = SW.blue; c.lineWidth = 1;
          for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x0 - uy * hw * s, y0 + ux * hw * s); c.lineTo(x1 - uy * hw * s, y1 + ux * hw * s); c.stroke(); }
          for (let i = 0; i < 46; i++) { // the current, flowing along it
            const u = ((i * 0.618) % 1 + t * (0.6 + k)) % 1, off = (((i * 0.37) % 1) - 0.5) * 2 * hw, x = x0 + (x1 - x0) * u - uy * off, y = y0 + (y1 - y0) * u + ux * off;
            c.globalAlpha = (0.25 + 0.5 * k) * Math.sin(Math.PI * u); c.strokeStyle = i % 3 ? SW.blue : SW.white; c.beginPath(); c.moveTo(x, y); c.lineTo(x + ux * (3 + k * 4), y + uy * (3 + k * 4)); c.stroke();
          }
        });
        if (r() < 0.4 * k) { const u = r(); this.parts.push({ kind: 'px', x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, vx: 0, vy: -20 - r() * 20, life: 0.4, max: 0.4, color: SW.pale }); }
        return true;
      }
      case 'onethrust': { // the converged swords become one line of intent
        const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len;
        this.lightLine(sx(h.x), sy(h.y) - 6, sx(ex), sy(ey) - 6, 0.5 + k, SW.blue, 0.2 + k * 0.6);
        return true;
      }
      case 'onesword': { // a hair-thin line across everything; the light drifts toward it
        const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len, x0 = sx(h.x), y0 = sy(h.y) - 4, x1 = sx(ex), y1 = sy(ey) - 4;
        this.lit(c => {
          c.globalAlpha = 0.08 + 0.2 * k; c.strokeStyle = SW.blue; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.globalAlpha = (0.4 + 0.6 * k) * (Math.floor(t * 30) % 2 ? 1 : 0.7); c.strokeStyle = SW.white; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        });
        if (r() < 0.7) { const u = r(), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, side = r() < 0.5 ? -1 : 1, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * side, ny = (x1 - x0) / L * side; this.parts.push({ kind: 'px', x: x + nx * 14, y: y + ny * 14, vx: -nx * 40, vy: -ny * 40, life: 0.35, max: 0.35, color: SW.pale }); }
        return true;
      }
    }
    return false;
  },

  // ---------- his flying swords ----------
  swordProjectile(pr, t) { return (pr.kind === 'sword' || pr.kind === 'moonblade' || pr.kind === 'swallow') && this.bounded(this.palOf(pr.src), () => this.swordProjectileBase(pr, t)); },
  swordProjectileBase(pr, t) {
    const X = sx(pr.x), Y = sy(pr.y) - 5, ua = Math.atan2(pr.vy * SQ, pr.vx), moving = !(pr.delay > 0);
    const tr = pr._tr = pr._tr || [];
    if (moving && (!tr.length || Math.hypot(tr[0][0] - X, tr[0][1] - Y) > 1.5)) { tr.unshift([X, Y]); if (tr.length > (pr.kind === 'swallow' ? 16 : 8)) tr.pop(); }
    if (pr.kind === 'moonblade') { // the moon's edge, cut loose; fading echoes of it trail behind
      for (let i = tr.length - 1; i >= 2; i -= 2) this.crescent(tr[i][0] - Math.cos(ua) * 4, tr[i][1] - Math.sin(ua) * 4, 11, ua - 1.35, ua + 1.35, 3.5, 0.25 * (1 - i / tr.length), SW.pale, SW.blue, 1);
      this.glow(X, Y, 12, this.inkish('rgba(180,225,255,1)'), 0.3);
      this.crescent(X - Math.cos(ua) * 4, Y - Math.sin(ua) * 4, 11, ua - 1.35, ua + 1.35, 4, 1, SW.white, SW.blue, 1);
      if (Math.random() < 0.5) this.parts.push({ kind: 'star', x: X + (Math.random() - .5) * 14, y: Y + (Math.random() - .5) * 10, life: 0.15, max: 0.15, s: 0.6, color: SW.pale });
      return true;
    }
    if (pr.kind === 'swallow') { // a swallow of light: a sword at its head, a forked tail streaming behind
      this.lit(c => {
        for (let i = 1; i < tr.length; i++) {
          const [ax, ay] = tr[i - 1], [bx, by] = tr[i], u = i / tr.length, L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L, fork = u * 4;
          c.globalAlpha = 0.6 * (1 - u); c.strokeStyle = i % 2 ? SW.blue : SW.pale; c.lineWidth = 1;
          for (const s of [-1, 1]) { c.beginPath(); c.moveTo(ax + nx * s * (fork - 4 / tr.length), ay + ny * s * (fork - 4 / tr.length)); c.lineTo(bx + nx * s * fork, by + ny * s * fork); c.stroke(); }
        }
      });
      const flap = Math.sin(t * 30) * 0.4, gx = X - Math.cos(ua) * 5, gy = Y - Math.sin(ua) * 5;
      for (const s of [-1, 1]) { const wa = ua + Math.PI + s * (0.9 + flap); this.pline(gx, gy, gx + Math.cos(wa) * 4, gy + Math.sin(wa) * 4, SW.pale); } // its wings
      this.miniSword(X, Y, ua, 8, 1, 0.5);
      return true;
    }
    // a flying sword: hanging in its formation, revealed in turn and glinting; or in flight with a streak behind it
    const F = pr.formation;
    let alpha = 1, len = 7;
    if (F && pr.delay > 0) {
      const el = F.d0 - pr.delay, at = F.i / F.n * F.d0 * 0.5;
      alpha = clamp01((el - at) / 0.15); len = 9;
      if (el - at > 0 && el - at < 0.12) this.flare(X, Y, 3, SW.white, 1 - (el - at) / 0.12);
    }
    if (moving && tr.length > 1) this.lightLine(tr[tr.length - 1][0], tr[tr.length - 1][1], X, Y, 0.8, SW.blue, 0.5);
    this.miniSword(X, Y + (moving ? 0 : Math.sin(t * 5 + (F ? F.i : pr.x)) * 0.7), ua, len, alpha, 0.45);
    return true;
  },

  // ---------- the effects themselves ----------
  drawSwordLayer(sim, dt, layer) {
    if (this.swSim !== sim) { this.swSim = sim; this.swFx = []; this.swordTitle = null; } // a new fight: nothing of the last one carries over (fighter ids start again)
    if (!this.swFx || !this.swFx.length) return;
    this.sim = sim;
    for (const f of this.swFx) {
      if ((f.layer || 'a') !== layer && !(f.kind === 'stillness' || f.kind === 'cleavefield' || f.kind === 'slowmo' || f.kind === 'moonfield')) continue;
      const fn = this['sw_' + f.kind]; if (fn) this.bounded(f.bound, () => fn.call(this, f, layer, sim));
    }
    if (layer === 'a') { for (const f of this.swFx) f.age += dt; this.swFx = this.swFx.filter(f => f.age < f.life); }
  },
  fxPos(f) { return [sx(f.x), sy(f.y) - 6]; },

  sw_cast(f) { // a ring of sword intent flaring out from him
    const [X, Y] = this.fxPos(f), u = f.age / f.life, rr = 4 + 16 * ease(u), c = f.adv ? SW.gold : SW.blue;
    this.lit(g => { g.globalAlpha = (1 - u) * 0.8; g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.ellipse(X, Y + 4, rr, rr * 0.45, 0, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + u; g.beginPath(); g.moveTo(X + Math.cos(a) * rr, Y + 4 + Math.sin(a) * rr * 0.45); g.lineTo(X + Math.cos(a) * (rr + 3), Y + 4 + Math.sin(a) * (rr + 3) * 0.45); g.stroke(); } });
    this.lightLine(X, Y - 10 - 8 * u, X, Y - 4, 0.6, c, (1 - u) * 0.8);
  },
  sw_lowered(f) { // the teacher's sword held point-down at his side, its light going out
    const [X, Y] = this.fxPos(f), u = f.age / f.life, F = this.sim && this.sim.p && this.sim.p.x < f.x ? -1 : 1;
    this.lightLine(X + F * 4, Y + 1, X + F * 9, Y + 10, 0.6, SW.blue, 0.8 * (1 - u * 0.6));
    if (Math.random() < 0.15) this.parts.push({ kind: 'px', x: X + F * (5 + Math.random() * 4), y: Y + 2 + Math.random() * 8, vx: 0, vy: -12, life: 0.8, max: 0.8, color: SW.pale });
  },
  sw_skystroke(f) { // one line from his hand straight up to the sky he is cutting
    const [X, Y] = this.fxPos(f), u = f.age / f.life, top = SKY_SCAR(X), reach = Math.min(1, f.age / 0.12);
    this.lightLine(X, Y - 6, X, Y - 6 + (top - Y + 6) * reach, 1.6 * (1 - u * 0.5), SW.blue, 1 - u);
    this.glow(X, Y - 8, 14, this.inkish('rgba(200,235,255,1)'), 0.6 * (1 - u));
  },
  sw_iaido(f) { // I: drawn and cut in the same instant; the sheath clicks shut after
    const [X, Y] = this.fxPos(f), u = f.age / f.life, sweep = Math.min(1, f.age / 0.06), alpha = f.age < 0.12 ? 1 : Math.max(0, 1 - (f.age - 0.12) / 0.3);
    if (f.age < 0.1) this.lightLine(X - Math.cos(f.a) * 8, Y - Math.sin(f.a) * 5, X + Math.cos(f.a) * 52, Y + Math.sin(f.a) * 30, 0.6, SW.blue, 1 - f.age / 0.1);
    this.crescent(X, Y, 20, f.a - 1.25, f.a - 1.25 + 2.4 * sweep, f.adv ? 6 : 4.5, alpha);
    if (f.adv) this.crescent(X, Y, 24, f.a + 1.3, f.a + 1.3 - 2.5 * sweep, 4, alpha * 0.9, SW.white, SW.gold);
    if (f.age > 0.34 && f.age < 0.46) this.flare(X - Math.cos(f.a) * 3, Y + 3, 3, SW.white, 1 - (f.age - 0.34) / 0.12);
  },
  sw_wind(f) { // II: the wind he leaves behind
    const [X, Y] = this.fxPos(f), u = f.age / f.life, ca = Math.cos(f.a), sa = Math.sin(f.a);
    this.lit(g => { g.strokeStyle = SW.pale; g.lineWidth = 1;
      for (let i = 0; i < 10; i++) { const off = ((i * 0.37 + f.seed) % 1 - 0.5) * 18, back = 6 + ((i * 0.61) % 1) * 16 + u * 40, L = 8 + (i % 4) * 5;
        g.globalAlpha = (1 - u) * (0.35 + (i % 3) * 0.15); const x = X - ca * back - sa * off, y = Y - sa * back * 0.7 + ca * off * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - ca * L, y - sa * L * 0.7); g.stroke(); } });
  },
  sw_ghostslash(f) { const [X, Y] = this.fxPos(f), s = Math.min(1, f.age / 0.06); this.crescent(X, Y, 12, f.a, f.a + 2.4 * s, 3.5, 1 - f.age / f.life); },
  sw_rainrise(f) { // III: the swords thrown up into the sky
    const [X, Y] = this.fxPos(f), u = f.age / f.life;
    for (const [a, v] of f.seeds) { const d = v * f.age, x = X + Math.cos(a) * d * 0.4, y = Y + Math.sin(a) * d; this.miniSword(x, y, a, 7, 1 - u * u, 0.5); }
  },
  sw_lodged(f) { // where a falling sword landed, it stays a moment, point in the stone
    const X = sx(f.x), Y = sy(f.y), a = f.age < 0.5 ? 1 : 1 - (f.age - 0.5) / 0.2;
    this.miniSword(X + Math.cos(Math.PI / 2 + f.tilt) * 2, Y + 2, Math.PI / 2 + f.tilt, 8, a, 0.25);
  },
  sw_moon(f) { // IV: a pale moon rises behind him; he sweeps its edge loose
    const [X, Y] = this.fxPos(f), u = f.age / f.life, fade = Math.min(1, f.age / 0.12) * (1 - u), mx = X - Math.cos(f.a) * 4, my = Y - 12;
    this.glow(mx, my, 20, this.inkish('rgba(200,230,255,1)'), 0.35 * fade);
    const g = this.g; g.save(); g.globalAlpha = 0.75 * fade; g.fillStyle = this.inkish('#eef6ff'); g.beginPath(); g.arc(mx, my, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = this.inkish('#c8d8ea'); for (const [cx, cy, cr] of [[-3, -2, 1.6], [2, 2, 2], [3, -3, 1], [-1, 4, 1]]) { g.beginPath(); g.arc(mx + cx, my + cy, cr, 0, Math.PI * 2); g.fill(); } g.restore();
    const s = Math.min(1, f.age / 0.1); this.crescent(X, Y, 17, f.a - 1.3, f.a - 1.3 + 2.6 * s, 4, Math.max(0, 1 - f.age / 0.35));
  },
  sw_flick(f) { const [X, Y] = this.fxPos(f), s = Math.min(1, f.age / 0.05); this.crescent(X, Y, 12, f.a + 1, f.a + 1 - 2 * s, 3, 1 - f.age / f.life, SW.white, f.red ? SW.red : SW.blue); },
  sw_darkring(f) { // VI: his shadows spill out of him
    const [X, Y] = this.fxPos(f), u = f.age / f.life, g = this.g;
    g.save(); g.globalAlpha = 0.35 * (1 - u); g.strokeStyle = this.inkish('#1c2440'); g.lineWidth = 3; g.beginPath(); g.ellipse(X, Y + 5, 6 + u * 26, (6 + u * 26) * 0.45, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    this.lit(c => { c.globalAlpha = 0.5 * (1 - u); c.strokeStyle = this.inkish('#7f8cff'); c.lineWidth = 1; c.beginPath(); c.ellipse(X, Y + 5, 6 + u * 26, (6 + u * 26) * 0.45, 0, 0, Math.PI * 2); c.stroke(); });
  },
  sw_riverdraw(f) { const [X, Y] = this.fxPos(f), s = Math.min(1, f.age / 0.08); this.crescent(X, Y + 2, 22, f.a - 1.5, f.a - 1.5 + 3 * s, 3, 1 - f.age / f.life, SW.white, SW.blue, 0.35); },
  sw_skypoint(f) { const [X, Y] = this.fxPos(f), u = f.age / f.life; this.lightLine(X, 14, X, Y - 10, 0.6 + 1.2 * (1 - u), SW.gold, (1 - u) * 0.7); this.flare(X, Y - 12, 4, SW.white, 1 - u); },
  sw_eyeglint(f) { const [X, Y] = this.fxPos(f); this.flare(X + 1, Y - 6, 2, SW.white, 1 - f.age / f.life); },
  sw_river(f) { // VII: the river of sword energy stands up as a wall, then crashes down
    const x0 = sx(f.x0), y0 = sy(f.y0), x1 = sx(f.x1), y1 = sy(f.y1), L = Math.hypot(x1 - x0, y1 - y0) || 1, a = f.age;
    const rise = a < 0.12 ? a / 0.12 : a < 0.42 ? 1 : Math.max(0, 1 - (a - 0.42) / 0.55), hmax = 26 + (f.w || 16) * 0.7;
    this.lit(g => {
      for (let s = 0; s <= L; s += 1.5) {
        const u = s / L, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        const swell = 0.58 + 0.24 * Math.sin(s * 0.09 + a * 11) + 0.12 * Math.sin(s * 0.31 - a * 19) + 0.06 * Math.sin(s * 0.83 + a * 7); // waves on waves, never quite repeating
        const hh = hmax * rise * swell * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02)), 0.3);
        if (hh < 1) continue;
        const gr = g.createLinearGradient(0, y, 0, y - hh); gr.addColorStop(0, this.inkish('rgba(60,140,255,0.35)')); gr.addColorStop(0.75, this.inkish('rgba(160,215,255,0.22)')); gr.addColorStop(1, this.inkish('rgba(255,255,255,0.85)'));
        g.globalAlpha = 0.85; g.fillStyle = gr; g.fillRect(x, y - hh, 1.6, hh);
        const k = (s * 7.31) % 11; // streaks of sword energy running up the wall
        if (k < 1.6) { g.globalAlpha = 0.5; g.fillStyle = this.inkish('#e8f4ff'); g.fillRect(x, y - hh * (0.3 + ((s * 3.7) % 1) * 0.6), 1, hh * 0.35); }
        g.globalAlpha = 0.95; g.fillStyle = this.inkish('#ffffff'); g.fillRect(x, y - hh - 0.5, 1.6, 1.2); // the crest, white with foam
      }
    });
    if (a > 0.42 && Math.random() < 0.9) { const u = Math.random(); this.parts.push({ kind: 'px', x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u - hmax * rise, vx: (Math.random() - .5) * 30, vy: 20, g: 160, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? SW.white : SW.blue }); }
  },
  sw_scar(f, layer) { // where the river ran, a cut in the stone that slowly stops glowing
    if (layer !== 'g') return;
    const u = f.age / f.life; this.lightLine(sx(f.x0), sy(f.y0), sx(f.x1), sy(f.y1), 0.5, SW.blue, 0.6 * (1 - u));
  },
  sw_heavenimpact(f) { // VIII: the celestial sword stands where it fell, then comes apart into light
    const X = sx(f.x), Y = sy(f.y), a = f.age < 0.45 ? 1 : Math.max(0, 1 - (f.age - 0.45) / 0.5);
    this.glow(X, Y - 20, 26, this.inkish('rgba(200,230,255,1)'), 0.5 * a);
    this.bigSword(X, Y + 10, Math.PI / 2, 60, 7, a, 'celestial', this.tick || 0);
    if (f.age > 0.45 && Math.random() < 0.8) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 8, y: Y - Math.random() * 50, vx: (Math.random() - .5) * 10, vy: -20 - Math.random() * 20, life: 0.8, max: 0.8, color: Math.random() < 0.5 ? SW.gold : SW.pale });
  },
  sw_cracks(f, layer) {
    if (layer !== 'g') return;
    const X = sx(f.x), Y = sy(f.y), u = f.age / f.life, g = this.g;
    g.save(); g.globalAlpha = 0.8 * (1 - u); g.strokeStyle = this.inkish('#141820'); g.lineWidth = 1.4;
    for (const pts of f.lines) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(X + x, Y + y * SQ) : g.moveTo(X + x, Y + y * SQ)); g.stroke(); }
    g.restore();
    this.lit(c => { c.globalAlpha = 0.7 * (1 - u) * (1 - u); c.strokeStyle = SW.gold; c.lineWidth = 0.6; for (const pts of f.lines) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(X + x, Y + y * SQ) : c.moveTo(X + x, Y + y * SQ)); c.stroke(); } });
  },
  sw_formation(f, layer) { // IX: the great formation round the target, spokes running from every sword to its heart
    if (layer !== 'g') return;
    const X = sx(f.x), Y = sy(f.y), a = f.age, grow = ease(a / 0.35), fade = a < f.d0 ? 1 : Math.max(0, 1 - (a - f.d0) / 0.7), rr = f.r * grow, t = this.tick || 0;
    this.lit(g => {
      g.lineWidth = 1;
      g.globalAlpha = 0.65 * fade; g.strokeStyle = SW.blue; g.beginPath(); g.ellipse(X, Y, rr, rr * SQ, 0, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 0.35 * fade; g.setLineDash([4, 3]); g.lineDashOffset = t * 12; g.beginPath(); g.ellipse(X, Y, rr + 4, (rr + 4) * SQ, 0, 0, Math.PI * 2); g.stroke();
      g.lineDashOffset = -t * 18; g.strokeStyle = SW.gold; g.beginPath(); g.ellipse(X, Y, rr * 0.55, rr * 0.55 * SQ, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 12; i++) { const b = -t * 0.8 + i / 12 * 6.28; g.beginPath(); g.moveTo(X + Math.cos(b) * rr * 0.55, Y + Math.sin(b) * rr * 0.55 * SQ); g.lineTo(X + Math.cos(b) * rr * 0.68, Y + Math.sin(b) * rr * 0.68 * SQ); g.stroke(); }
      g.globalAlpha = 0.14 * fade; g.strokeStyle = SW.pale;
      for (let i = 0; i < f.n; i++) { const b = i / f.n * 6.28; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * SQ); g.stroke(); }
    });
    const pulse = 0.6 + 0.4 * Math.sin(a * 10);
    this.flare(X, Y - 2, 4 + (a > f.d0 - 0.3 ? 6 : 0), SW.white, fade * pulse);
    if (a > f.d0 && a < f.d0 + 0.3) this.glow(X, Y - 4, 30, this.inkish('rgba(200,235,255,1)'), (1 - (a - f.d0) / 0.3) * 0.8);
  },
  sw_thrust(f) { // ...then one thrust: a spear of sword light
    const x0 = sx(f.x0), y0 = sy(f.y0) - 6, x1 = sx(f.x1), y1 = sy(f.y1) - 6, ext = ease(f.age / 0.07), u = f.age / f.life, ex = x0 + (x1 - x0) * ext, ey = y0 + (y1 - y0) * ext;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L, w = 6 * (1 - u * u);
    this.lit(g => { for (const [c, k, al] of [[SW.blue, 2.2, 0.45], [SW.white, 1, 1]]) { g.globalAlpha = al * (1 - u); g.fillStyle = c; g.beginPath(); g.moveTo(x0 + nx * w * k, y0 + ny * w * k); g.lineTo(ex, ey); g.lineTo(x0 - nx * w * k, y0 - ny * w * k); g.closePath(); g.fill(); } });
    this.flare(ex, ey, 8 * (1 - u), SW.white, 1 - u);
  },
  fighterById(id) { const s = this.sim; return s && id != null ? s.fighters().find(o => o.id === id) : null; },

  // X: while the air cuts, a crimson-black pall over the stage, as if something vast is watching
  sw_cleavefield(f, layer) {
    if (layer !== 'a') return;
    const g = this.g, k = Math.min(1, f.age / 0.3, (f.life - f.age) / 0.4);
    g.save(); g.globalAlpha = 0.35 * k; g.fillStyle = this.inkish('#1a0408'); g.fillRect(0, 13, W, H - 13);
    const vg = g.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 150); vg.addColorStop(0, this.inkish('rgba(0,0,0,0)')); vg.addColorStop(1, this.inkish('rgba(60,0,10,0.7)')); g.globalAlpha = k; g.fillStyle = vg; g.fillRect(0, 13, W, H - 13); g.restore();
  },
  // ...and each cleave: a razor-white slash outlined in black, whose two edges spring apart
  sw_cleavecut(f) {
    const x0 = sx(f.x0), y0 = sy(f.y0) - 4, x1 = sx(f.x1), y1 = sy(f.y1) - 4, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    const a = f.age, ext = ease(a / 0.04), ex = x0 + (x1 - x0) * ext, ey = y0 + (y1 - y0) * ext, gap = Math.min(2.2, a * 12), al = Math.max(0, 1 - a / f.life), g = this.g;
    if (a < 0.08) { // the cut itself
      g.save(); g.lineCap = 'round'; g.strokeStyle = SW.scale > 1 ? SW.ink : this.inkish('#000000'); g.lineWidth = 3 * SW.scale; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke();
      g.strokeStyle = SW.white; g.lineWidth = 1.4 * SW.scale; g.globalAlpha = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke(); g.restore();
      this.glow((x0 + ex) / 2, (y0 + ey) / 2, 10, this.inkish('rgba(255,255,255,1)'), 0.4);
    } else for (const s of [-1, 1]) { // the air on either side of it, sliding apart
      g.save(); g.globalAlpha = al; g.strokeStyle = this.inkish('#000000'); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 + nx * gap * s, y0 + ny * gap * s); g.lineTo(x1 + nx * gap * s, y1 + ny * gap * s); g.stroke();
      g.strokeStyle = s < 0 ? SW.white : SW.scale > 1 ? SW.blue : this.inkish('#c8d0dc'); g.lineWidth = 0.7 * SW.scale; g.stroke(); g.restore();
    }
  },

  // XI: the slow stroke that cuts a cause rather than a body
  sw_slowstroke(f) {
    const [X, Y] = this.fxPos(f), sweep = ease(f.age / 0.5);
    this.crescent(X, Y, 24, f.a - 1.6, f.a - 1.6 + 3.2 * sweep, 3.5, Math.max(0, 1 - Math.max(0, f.age - 0.5) / 0.3), this.inkish('#ffd0da'), SW.red);
  },
  // the lines of cause, each from the arena's edge to the one who must bear its effect, drawn taut and trembling
  sw_karma(f) {
    const v = this.fighterById(f.id), held = this.sim && (this.sim.karmas || []).some(k => k.target === v && k.left > 0);
    if (!v || v.dead || !held) { f.life = Math.min(f.life, f.age + 0.01); return; } // only while a cause still binds them
    const X1 = sx(v.x), Y1 = sy(v.y) - 7, t = this.tick || 0, k = Math.min(1, f.age / 0.35);
    this.lit(c => {
      for (const [i, [ax, ay]] of f.anchors.entries()) {
        const X0 = sx(ax), Y0 = sy(ay), ext = Math.min(1, k * 1.4 - i * 0.06), ex = X0 + (X1 - X0) * ext, ey = Y0 + (Y1 - Y0) * ext;
        const L = Math.hypot(ex - X0, ey - Y0) || 1, nx = -(ey - Y0) / L, ny = (ex - X0) / L, tr = Math.sin(t * 40 + i * 3) * 0.5;
        c.globalAlpha = 0.25; c.strokeStyle = SW.red; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(ex, ey); c.stroke();
        c.globalAlpha = 0.9; c.strokeStyle = i === 0 ? this.inkish('#ffd0da') : SW.red; c.lineWidth = 0.7; c.beginPath(); c.moveTo(X0, Y0); c.quadraticCurveTo((X0 + ex) / 2 + nx * tr, (Y0 + ey) / 2 + ny * tr, ex, ey); c.stroke();
        c.globalAlpha = 0.9; c.fillStyle = SW.red; c.fillRect(Math.round(X0) - 1, Math.round(Y0) - 1, 2, 2); // where it is fastened to the world
      }
    });
    this.glow(X1, Y1, 8, this.inkish('rgba(255,60,90,1)'), 0.35 * k + 0.1 * Math.sin(t * 6));
    const next = f.anchors[0]; if (next) this.flare(sx(next[0]), sy(next[1]), 2.5, this.inkish('#ffd0da'), 0.5 + 0.5 * Math.sin(t * 12)); // the next to give way
  },
  // a line snapping: its two halves whip back, the wound opens, and 果 is written over it
  sw_snap(f) {
    const v = this.fighterById(f.id), X1 = sx(v ? v.x : f.x), Y1 = sy(v ? v.y : f.y) - 7, X0 = sx(f.ax), Y0 = sy(f.ay), u = f.age / f.life, back = ease(f.age / 0.25);
    const mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2;
    if (f.age < 0.3) this.lit(c => { c.globalAlpha = 1 - f.age / 0.3; c.strokeStyle = SW.red; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(X0, Y0); c.lineTo(mx + (X0 - mx) * back, my + (Y0 - my) * back + 6 * back); c.stroke();
      c.beginPath(); c.moveTo(X1, Y1); c.lineTo(mx + (X1 - mx) * back, my + (Y1 - my) * back + 6 * back); c.stroke(); });
    const open = Math.sin(Math.PI * Math.min(1, f.age / 0.4)), ca = f.cut;
    if (f.age < 0.4) this.lit(c => { c.lineCap = 'round'; c.globalAlpha = 0.95; c.strokeStyle = SW.red; c.lineWidth = 1 + open * 2.5; c.beginPath(); c.moveTo(X1 - 7 * Math.cos(ca + 0.8), Y1 + 6 * Math.sin(ca + 0.8)); c.lineTo(X1 + 7 * Math.cos(ca + 0.8), Y1 - 6 * Math.sin(ca + 0.8)); c.stroke();
      c.strokeStyle = SW.white; c.lineWidth = 0.5 + open; c.stroke(); });
    const g = this.g; g.save(); g.globalAlpha = Math.min(1, (1 - u) * 2); g.font = `12px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = SW.red; g.shadowBlur = 6; g.fillStyle = this.inkish('#ffe0e6'); g.fillText('果', X1, Y1 - 12 - u * 8); g.restore();
  },

  // XII: time itself slows: the world goes cold and blue, and still air streams past
  sw_slowmo(f, layer) {
    if (layer !== 'a') return;
    const g = this.g, k = Math.min(1, f.age / 0.2, (f.life - f.age) / 0.3), t = this.tick || 0;
    g.save(); g.globalAlpha = 0.28 * k; g.fillStyle = this.inkish('#0a1a3a'); g.fillRect(0, 13, W, H - 13);
    const vg = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 150); vg.addColorStop(0, this.inkish('rgba(0,0,0,0)')); vg.addColorStop(1, this.inkish('rgba(20,40,90,0.65)')); g.globalAlpha = k; g.fillStyle = vg; g.fillRect(0, 13, W, H - 13); g.restore();
    this.lit(c => { c.strokeStyle = SW.pale; c.lineWidth = 0.6; for (let i = 0; i < 14; i++) { const y = 18 + ((i * 37) % (H - 24)), x = ((i * 53 + t * 40) % (W + 40)) - 20; c.globalAlpha = 0.18 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14 + (i % 3) * 6, y); c.stroke(); } });
  },
  // ...and the moon he leaves: a vast half-moon of sword light lying across the stage, burning while it lingers
  sw_moonfield(f, layer) {
    const X = sx(f.x), Y = sy(f.y), sweep = ease(f.age / 0.15), fade = Math.min(1, (f.life - f.age) / 0.5), t = this.tick || 0, g = this.g;
    const a0 = f.a - Math.PI / 2, a1 = a0 + Math.PI * sweep, pulse = 0.75 + 0.25 * Math.sin(t * 9);
    const ring = (r0, r1) => { g.beginPath(); for (let i = 0; i <= 30; i++) { const a = a0 + (a1 - a0) * i / 30; g.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1 * SQ); } for (let i = 30; i >= 0; i--) { const a = a0 + (a1 - a0) * i / 30; g.lineTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0 * SQ); } g.closePath(); };
    if (layer === 'g') {
      g.save(); ring(f.r0, f.r1); g.globalAlpha = 0.35 * fade * pulse; g.fillStyle = SW.scale > 1 ? SW.blue : this.inkish('#7fbfff'); g.fill(); g.restore();
      this.lit(c => { ring(f.r0, f.r1); c.globalAlpha = 0.5 * fade; c.strokeStyle = SW.white; c.lineWidth = 1; c.stroke();
        c.globalAlpha = 0.25 * fade; c.strokeStyle = SW.blue; c.lineWidth = 4; c.stroke(); });
      if (Math.random() < 0.8 * fade) { const a = a0 + Math.random() * (a1 - a0), rr = f.r0 + Math.random() * (f.r1 - f.r0); this.parts.push({ kind: 'px', x: X + Math.cos(a) * rr, y: Y + Math.sin(a) * rr * SQ, vx: 0, vy: -12, life: 0.6, max: 0.6, color: Math.random() < 0.5 ? SW.white : SW.blue }); }
      return;
    }
    if (f.age < 0.35) this.crescent(X, Y - 6, f.r1, a0, a1, (f.r1 - f.r0) * 0.5, 1 - f.age / 0.35, SW.white, SW.blue, SQ); // the sweep that lays it down, standing tall for an instant
  },
  sw_streak(f) { // XII (and VI): a streak of sword light, wide in the middle, needle-fine at each end
    const x0 = sx(f.x0), y0 = sy(f.y0) - 6, x1 = sx(f.x1), y1 = sy(f.y1) - 6, L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    const u = f.age / f.life, ext = ease(f.age / 0.05), al = f.age < 0.06 ? 1 : Math.max(0, 1 - (f.age - 0.06) / (f.life - 0.06)), ex = x0 + (x1 - x0) * ext, ey = y0 + (y1 - y0) * ext;
    const blade = (g, c, k, a) => {
      g.globalAlpha = a * al; g.fillStyle = c; g.beginPath(); g.moveTo(x0, y0);
      for (let i = 0; i <= 10; i++) { const s = i / 10, w = f.w * k * Math.sin(Math.PI * s) * (1 - u * 0.5); g.lineTo(x0 + (ex - x0) * s + nx * w, y0 + (ey - y0) * s + ny * w); }
      for (let i = 10; i >= 0; i--) { const s = i / 10, w = f.w * k * Math.sin(Math.PI * s) * (1 - u * 0.5); g.lineTo(x0 + (ex - x0) * s - nx * w, y0 + (ey - y0) * s - ny * w); }
      g.closePath(); g.fill();
    };
    const col = SW.scale > 1 ? SW.blue : f.color;
    this.lit(g => blade(g, col, 1.8 * SW.scale, 0.35));            // its glow
    const g = this.g; g.save(); blade(g, col, 0.75 * SW.scale, 0.9); blade(g, SW.white, 0.35 * SW.scale, 1); g.restore(); // a painted edge, so the cuts stay crisp where they cross
    if (f.age < 0.15) this.flare(ex, ey, 5, SW.white, 1 - f.age / 0.15);
  },
  sw_stillness(f, layer) { // XIII: everything stops; the world dims, and light rises out of it
    if (layer !== 'a') return;
    const u = f.age / f.life, k = Math.min(1, f.age / 0.25) * (u > 0.85 ? (1 - u) / 0.15 : 1), g = this.g;
    g.save(); g.globalAlpha = 0.55 * k; g.fillStyle = this.inkish('#060a14'); g.fillRect(0, 13, W, H - 13);
    const vg = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 150); vg.addColorStop(0, this.inkish('rgba(0,0,0,0)')); vg.addColorStop(1, this.inkish('rgba(0,0,0,0.8)')); g.globalAlpha = k; g.fillStyle = vg; g.fillRect(0, 13, W, H - 13); g.restore();
    this.lit(c => { for (const [x, y, sp, ph] of f.motes) { const yy = y - f.age * sp, tw = 0.5 + 0.5 * Math.sin(f.age * 4 + ph); if (yy < 14) continue; c.globalAlpha = k * tw * 0.8; c.fillStyle = ph > 3 ? SW.pale : SW.blue; c.fillRect(Math.round(x), Math.round(yy), 1, 1); } });
  },
  sw_finger(f) { // one finger raised: a point of light, the whole sky above it drawn to it
    const [X, Y] = this.fxPos(f), a = f.age, grow = ease(a / 0.5), fade = a > f.life - 0.3 ? (f.life - a) / 0.3 : 1, fx = X + 3, fy = Y - 12;
    this.lightLine(fx, 13, fx, fy, 0.3 + grow * 0.4, SW.pale, 0.35 * fade);
    this.glow(fx, fy, 3 + grow * 6, this.inkish('rgba(255,255,255,1)'), 0.9 * fade);
    this.lit(g => { g.globalAlpha = fade; g.strokeStyle = SW.white; g.lineWidth = 0.6; g.beginPath(); g.moveTo(fx - 4 - grow * 18, fy); g.lineTo(fx + 4 + grow * 18, fy); g.moveTo(fx, fy - 3 - grow * 9); g.lineTo(fx, fy + 3 + grow * 9); g.stroke(); });
  },
  sw_heavencut(f) { // ...and the line: blinding for an instant, then gone
    const x0 = sx(f.x0), y0 = sy(f.y0) - 4, x1 = sx(f.x1), y1 = sy(f.y1) - 4, a = f.age, w = a < 0.06 ? a / 0.06 * 10 : Math.max(0, 10 * (1 - (a - 0.06) / 0.35));
    this.lightLine(x0, y0, x1, y1, w * 0.5 + 0.4, SW.blue, Math.min(1, 1.2 - a / f.life));
  },
  sw_forbidden(f) { // the price: red cracks running through him
    const [X, Y] = this.fxPos(f), u = f.age / f.life;
    this.lit(g => { g.globalAlpha = 0.9 * (1 - u); g.strokeStyle = SW.red; g.lineWidth = 0.8; for (const pts of f.lines) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(X + x, Y + y) : g.moveTo(X + x, Y + y)); g.stroke(); } });
  },

  // the sword's name, written over the stage as he draws it
  drawSwordTitle(dt) {
    const T = this.swordTitle; if (!T) return;
    T.t += dt; if (T.t > T.life) { this.swordTitle = null; return; }
    if (T.t < 0) return; // waiting for the ULTIMATE banner to clear
    const forbidden = T.n === 13, g = this.g, a = Math.min(1, T.t / 0.15, (T.life - T.t) / 0.45), n = T.n - 1, c = T.ink ? '#d8d0e8' : T.bound ? SW_BOUND.blue : forbidden ? SW.red : T.adv ? SW.gold : SW.blue, cx = W / 2, wl = 92 * ease(T.t / 0.4);
    g.save(); g.globalAlpha = a * 0.7;
    const gr = g.createLinearGradient(cx - wl, 0, cx + wl, 0); gr.addColorStop(0, 'rgba(159,216,255,0)'); gr.addColorStop(0.5, T.ink ? 'rgba(10,6,16,0.95)' : T.bound ? 'rgba(255,74,90,0.95)' : forbidden ? 'rgba(255,90,122,0.9)' : T.adv ? 'rgba(255,216,138,0.9)' : 'rgba(159,216,255,0.9)'); gr.addColorStop(1, 'rgba(159,216,255,0)');
    g.fillStyle = gr; g.fillRect(cx - wl, 38, wl * 2, 1); g.globalAlpha = a * 0.3; g.fillRect(cx - wl * 0.7, 40, wl * 1.4, 1);
    g.globalAlpha = a; g.font = `14px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.shadowColor = c; g.shadowBlur = 6; g.fillStyle = '#ffffff';
    g.fillText(SWORD_CN[n] || '', cx, 36);
    g.restore();
    const en = SWORD_EN[n] || '', kicker = SWORD_ROMAN[n] + (T.bound ? ' · UNFINISHED' : forbidden ? ' · FORBIDDEN' : T.adv ? ' · ADVANCED' : '');
    g.save(); g.globalAlpha = a;
    this.text(kicker, cx, 15, c, 'center');
    this.text(en, cx, 43, '#e8f4ff', 'center', en.length * 8 <= 240 ? 8 : 6);
    g.restore();
  },

  // ---------- the man himself ----------
  // behind him: in his second form, the swords that circle him (the far half of the ring)
  drawImmortalBack(sim, e, X, y0, F, t) { return this.bounded(this.palOf(e), () => this.drawImmortalBackBase(sim, e, X, y0, F, t)); },
  drawImmortalBackBase(sim, e, X, y0, F, t) {
    if (!e.unity || e.swordForm) return;
    for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * Math.PI / 3, s = Math.sin(a); if (s >= 0) continue; this.miniSword(X + Math.cos(a) * 13, y0 + 11 + s * 3, -Math.PI / 2, 5, 0.5, 0.2); }
    this.lit(g => { g.globalAlpha = 0.22 + 0.08 * Math.sin(t * 3); g.strokeStyle = SW.gold; g.lineWidth = 0.6; g.beginPath(); g.ellipse(X - F * 2, y0 + 2, 4.5, 4.5, 0, 0, Math.PI * 2); g.stroke(); }); // a faint halo behind his head
  },
  // over him: the flying sword under his feet, ribbons in his hair, the near swords of the ring, his Sword Intent
  drawImmortalFront(sim, e, X, y0, base, lift, F, t) { return this.bounded(this.palOf(e), () => this.drawImmortalFrontBase(sim, e, X, y0, base, lift, F, t)); },
  drawImmortalFrontBase(sim, e, X, y0, base, lift, F, t) {
    const g = this.g, r = Math.random, moving = Math.hypot(e.mvx || 0, e.mvy || 0) > 0.2 && e.state !== 'ult';
    if (!e.swordForm) {
      const by = base - Math.max(1, lift - 1) + 1;
      this.lit(c => { c.globalAlpha = 0.3 + 0.1 * Math.sin(t * 6); c.fillStyle = SW.blue; c.beginPath(); c.ellipse(X, by + 1, 11, 1.6, 0, 0, Math.PI * 2); c.fill(); });
      this.pline(X - 7 * F, by, X + 9 * F, by, SW.steel); this.pline(X - 7 * F, by + 1, X + 8 * F, by + 1, SW.shade); this.pix(X + 10 * F, by, SW.white); // the blade
      this.pix(X + 2 * F, by, SW.white);
      g.fillStyle = SW.guard; g.fillRect(X - 8 * F - (F < 0 ? 0 : 0), by - 1, 1, 3); // the guard
      this.pline(X - 9 * F, by, X - 11 * F, by, SW.hilt); this.pix(X - 12 * F, by, SW.pommel); // hilt and pommel
      const tw = Math.sin(t * 9) * (moving ? 1.5 : 0.8); this.pix(X - 13 * F, by + 1, SW.tassel); this.pix(X - 14 * F, by + 1 + Math.round(tw * 0.5), SW.tassel); this.pix(X - 15 * F, by + 2 + Math.round(tw), SW.tassel2); // its tassel
      if (moving) { // riding the wind: streaks peel off the sword
        if (r() < 0.8) this.parts.push({ kind: 'line', x0: X - 10 * F, y0: by + (r() - .5) * 3, x1: X - (18 + r() * 10) * F, y1: by + (r() - .5) * 3, life: 0.14, max: 0.14, color: r() < 0.5 ? SW.pale : SW.blue });
        if (r() < 0.5) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: y0 + 4 + r() * 10, vx: -F * (40 + r() * 40), vy: 0, life: 0.2, max: 0.2, color: SW.pale });
      } else if (r() < 0.3) this.parts.push({ kind: 'px', x: X - 9 * F, y: by, vx: -F * 12, vy: 2, life: 0.4, max: 0.4, color: SW.blue });
      // two ribbons tied in his hair, lifting on the wind
      for (const [k, col] of [[0, SW.rib1], [1, SW.rib2]]) {
        let x = X - F * 1, y = y0 + 1 + k;
        for (let i = 0; i < 6; i++) { x -= F * (1 + (moving ? 0.5 : 0)); y += 0.5 + Math.sin(t * (moving ? 14 : 6) + i * 0.8 + k * 1.7) * 0.6; this.pix(x, y, col); }
      }
    }
    if (e.unity && !e.swordForm) for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * Math.PI / 3, s = Math.sin(a); if (s < 0) continue; this.miniSword(X + Math.cos(a) * 13, y0 + 11 + s * 3, -Math.PI / 2, 5, 0.9, 0.25); }
    const raising = e.state === 'wind' && e.atk && e.atk.kind === 'cleaves', up = e.handRaised ? 1 : raising ? Math.min(1, 1 - e.st / e.atk.wind) : 0;
    if (up > 0) { // X: he slowly raises one hand, and the air around him begins to warp
      const hx = X + F * (3 + up * 1), hy = y0 + 8 - up * 9;
      this.pline(X + F * 2, y0 + 8, hx, hy, this.inkish('#e2b48a')); this.pix(hx, hy - 1, this.inkish('#ffffff'));
      this.lit(c => { for (let i = 0; i < 3; i++) { const rr = 6 + i * 5 + ((t * 14 + i * 4) % 5); c.globalAlpha = 0.12 * up * (1 - i * 0.25); c.strokeStyle = this.inkish('#e8f4ff'); c.lineWidth = 1; c.beginPath(); c.ellipse(X + Math.sin(t * 9 + i) * 0.8, y0 + 8, rr, rr * 0.7, 0, 0, Math.PI * 2); c.stroke(); } });
      if (Math.random() < 0.3 * up) this.parts.push({ kind: 'line', x0: X + (Math.random() - .5) * 24, y0: y0 + (Math.random() - .5) * 16, x1: X + (Math.random() - .5) * 24, y1: y0 + (Math.random() - .5) * 16, life: 0.08, max: 0.08, color: this.inkish('#c8d0dc') });
    }
    if (e.deathBound && !e.corrupt) { // bound to the manual: his body is spent, cracked with red light, held up only by what is left to draw
      this.lit(c => { c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 14); c.strokeStyle = SW.red; c.lineWidth = 0.7; for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; c.beginPath(); c.moveTo(X, y0 + 8); c.lineTo(X + Math.cos(a) * 4, y0 + 8 + Math.sin(a) * 4); c.lineTo(X + Math.cos(a + 0.4) * 7, y0 + 8 + Math.sin(a + 0.4) * 6); c.stroke(); } });
      if (Math.random() < 0.5) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 8, y: y0 + 4 + Math.random() * 10, vx: 0, vy: -16, life: 0.6, max: 0.6, color: Math.random() < 0.5 ? SW.red : SW.white });
    }
    const n = Math.floor((e.intent || 0) / 20); // Sword Intent: a fan of small swords of light over his head, one for every 20
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.4; this.miniSword(X + Math.cos(a) * 8, y0 - 5 + Math.sin(a) * 3, a, 4, 0.85, 0.15); }
  },

  // XII: man and sword as one: a comet of sword light
  drawSwordForm(sim, e) { return this.bounded(this.palOf(e), () => this.drawSwordFormBase(sim, e)); },
  drawSwordFormBase(sim, e) {
    const X = sx(e.x), Y = sy(e.y) - 8, dx = e.fx || 1, dy = (e.fy || 0) * SQ, a = Math.atan2(dy, dx), t = sim.t;
    this.glow(X, Y, 10 * SW.scale, SW.blue, 0.45);
    this.lit(g => { g.save(); g.translate(X, Y); g.rotate(a); g.globalAlpha = 0.9; g.fillStyle = SW.white; g.beginPath(); g.ellipse(0, 0, 7, 1.8, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 0.5; g.fillStyle = SW.blue; g.beginPath(); g.ellipse(-4, 0, 11, 3, 0, 0, Math.PI * 2); g.fill(); g.restore(); });
    this.flare(X + dx * 4, Y + dy * 4, 5 + Math.sin(t * 40) * 1.5, SW.white, 0.9);
    if (Math.random() < 0.9) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 6, y: Y + (Math.random() - .5) * 4, vx: -dx * 50, vy: -dy * 50, life: 0.3, max: 0.3, color: Math.random() < 0.5 ? SW.blue : SW.white });
  },
});
