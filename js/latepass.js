// The late-game pass, drawn: the Time Administrator's clock (a dial under him that runs fast in the Future and backwards
// in the Past, the hands of the clock sweeping the stage, Past/Present/Future marks, Borrowed Time), Yun Xi's Last Bet
// (the die over her head, its faces, the cards and coins round her, dice falling from the sky), the Last Keeper's saved
// selves, the Sword Emperor, and Thousand Skins: the hero in the skin of anything it has felled, and the Four Symbols
// standing guard round it. Loaded after celestial3.js.
(() => {
const RP = Renderer.prototype, { TAU, hash, disc, glow, star4, E, HZ, BEAMS, PROJ, BURST } = CEL;
const px = (g, x, y, c, a = 1) => { g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.globalAlpha = 1; };
const line = (g, x0, y0, x1, y1, c, w = 1, a = 1) => { g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.globalAlpha = 1; };
const lit = (g, fn) => { g.save(); g.globalCompositeOperation = 'lighter'; fn(g); g.restore(); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ELC = { wood: ['#5ad08a', '#c8ffd0'], fire: ['#ff5a2a', '#ffd84a'], earth: ['#e8c34a', '#fff0b0'], metal: ['#e8f0f8', '#ffffff'], water: ['#4a8aff', '#c8e8ff'] };

// ---------------------------------------------------------------------------------------------------------------
// the Time Administrator
// ---------------------------------------------------------------------------------------------------------------
// a clock face lying on the floor under him: twelve ticks, two hands, running at his speed (fast as the Future, back as the Past)
RP.drawAdminDial = function (sim, e) {
  const g = this.g, t = sim.t, past = !!e.past, fut = e.phase === 2 && !past, col = past ? '#ffd8a0' : fut ? '#b8f4ff' : '#7fe0ff', R = 17;
  const spin = past ? -t * 0.8 : fut ? t * 4 : t;
  E(g, e.x, e.y, R, col, 0.1, true); E(g, e.x, e.y, R, col, 0.55, false); E(g, e.x, e.y, R - 3, col, 0.25, false);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, big = i % 3 === 0; line(g, sx(e.x + Math.cos(a) * (R - (big ? 4 : 2.5))), sy(e.y + Math.sin(a) * (R - (big ? 4 : 2.5))), sx(e.x + Math.cos(a) * (R - 0.5)), sy(e.y + Math.sin(a) * (R - 0.5)), col, 1, big ? 0.9 : 0.5); }
  const hand = (a, L, w, c) => line(g, sx(e.x), sy(e.y), sx(e.x + Math.cos(a) * L), sy(e.y + Math.sin(a) * L), c, w, 0.85);
  hand(spin * 0.083 - Math.PI / 2, R * 0.55, 1.6, col); hand(spin - Math.PI / 2, R * 0.85, 1, '#ffffff');
  if (fut && Math.random() < 0.3) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - 0.5) * 30, y: sy(e.y) + (Math.random() - 0.5) * 12, vx: 30, vy: 0, life: 0.25, max: 0.25, color: '#b8f4ff' }); // time running past him
};
Object.assign(HZ, {
  tl_past(g, h, t, k) { // where you stood: sepia, a ghost of you in it
    E(g, h.x, h.y, h.r, '#c89a5a', 0.15 + k * 0.3, true); E(g, h.x, h.y, h.r * (1 - k * 0.3), '#ffd8a0', 0.7, false);
    const x = sx(h.x), y = sy(h.y); const s = SPRITE_CACHE.hero; if (s) { g.globalAlpha = 0.25 + 0.3 * k; g.drawImage(s.ghost, Math.round(x - s.w / 2), Math.round(y - s.h)); g.globalAlpha = 1; }
    for (let i = 0; i < 12; i++) { const a = -i / 12 * TAU - t * 2; px(g, x + Math.cos(a) * h.r, y + Math.sin(a) * h.r * SQ, '#ffd8a0', 0.4 + 0.5 * (i / 12)); }
  },
  tl_present(g, h, t, k) { // where you stand: white, ticking down
    E(g, h.x, h.y, h.r, '#ffffff', 0.12 + k * 0.3, true); const x = sx(h.x), y = sy(h.y), a = -Math.PI / 2 + k * TAU;
    g.globalAlpha = 0.85; g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, h.r, h.r * SQ, 0, -Math.PI / 2, a); g.stroke(); g.globalAlpha = 1;
    line(g, x, y, x + Math.cos(a) * h.r, y + Math.sin(a) * h.r * SQ, '#ffffff', 1, 0.9);
  },
  tl_future(g, h, t, k) { // where you're going: cyan, dashed, an outline of you already standing there
    const x = sx(h.x), y = sy(h.y); E(g, h.x, h.y, h.r, '#7fe0ff', 0.1 + k * 0.3, true);
    g.save(); g.setLineDash([2, 2]); g.lineDashOffset = -t * 20; g.strokeStyle = '#b8f4ff'; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(x, y, h.r, h.r * SQ, 0, 0, TAU); g.stroke(); g.restore();
    const s = SPRITE_CACHE.hero; if (s) lit(g, c => { c.globalAlpha = 0.25 + 0.35 * k; c.drawImage(s.ghost, Math.round(x - s.w / 2), Math.round(y - s.h)); });
  },
  betdie(g, h, t, k) { // a die falling out of the sky onto the mark: its shadow grows, it tumbles down, it lands
    const x = sx(h.x), y = sy(h.y), alt = (1 - k) * (1 - k) * 90;
    E(g, h.x, h.y, h.r * (0.4 + k * 0.6), '#000000', 0.2 + k * 0.35, true); E(g, h.x, h.y, h.r, '#ffd84a', 0.35 + k * 0.4, false);
    drawDie(g, x, y - 4 - alt, 3 + k * 1.5, t * 14 + h.x, 1 + Math.floor(hash(Math.floor(h.x), Math.floor(h.y), 3) * 6), 1);
  },
});
Object.assign(BEAMS, { hourhand: ['#7fe0ff', '#ffffff'], minutehand: ['#c8f4ff', '#ffffff'], betbeam: ['#ffd84a', '#fff8e0'] });
Object.assign(BURST, { tl_past: ['#ffd8a0', '#c89a5a', '#ffffff'], tl_present: ['#ffffff', '#e8f4ff'], tl_future: ['#7fe0ff', '#ffffff', '#b8f4ff'], betdie: ['#ffffff', '#ffd84a', '#c23b22', '#141414'] });
// a little die in pixels, its top face toward you; spin tumbles it
function drawDie(g, x, y, s, spin, face, a = 1) {
  g.save(); g.globalAlpha = a; g.translate(Math.round(x), Math.round(y)); g.rotate(Math.sin(spin) * 0.6);
  g.fillStyle = '#7a6a58'; g.fillRect(-s, -s + 1, s * 2, s * 2); g.fillStyle = '#f4ecd8'; g.fillRect(-s, -s, s * 2, s * 2); g.fillStyle = '#ffffff'; g.fillRect(-s, -s, s * 2, 1);
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[face] || [[0, 0]];
  g.fillStyle = face === 1 ? '#c8141e' : '#1a1418'; const q = s * 0.55;
  for (const [i, j] of P) g.fillRect(Math.round(i * q - 0.5), Math.round(j * q - 0.5), s > 3 ? 2 : 1, s > 3 ? 2 : 1);
  g.restore(); g.globalAlpha = 1;
}
PROJ.betcard = function (g, pr, t) { // a playing card, spinning
  const x = sx(pr.x), y = sy(pr.y) - 6, a = t * 12 + pr.x * 0.3, w = Math.abs(Math.cos(a)) * 2 + 0.5;
  glow(g, x, y, 3, '#ffd84a', 0.35); g.fillStyle = '#141414'; g.fillRect(Math.round(x - w - 0.5), y - 3, Math.round(w * 2 + 1), 6);
  g.fillStyle = '#fffaf0'; g.fillRect(Math.round(x - w), y - 2.5, Math.max(1, Math.round(w * 2)), 5); if (w > 1) { g.fillStyle = Math.floor(pr.x) % 2 ? '#c8141e' : '#141414'; g.fillRect(Math.round(x), y - 1, 1, 2); }
};

// ---------------------------------------------------------------------------------------------------------------
// Yun Xi's Last Bet: the die over her head, the cards and coins round her
// ---------------------------------------------------------------------------------------------------------------
const FACE_NAME = ['THE ACE', 'A PAIR', 'TRIPS', 'FOUR CORNERS', 'THE FIVE-SPOT', 'JACKPOT'];
RP.drawLastBet = function (sim, e, lift) {
  const g = this.g, t = sim.t, B = e.bet, X = sx(e.x), Y = sy(e.y) - lift, spent = B.st === 'spent';
  // a ring of six pips on the floor round her, the face she rolled lit
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.3, on = B.face === i + 1 && B.st !== 'roll'; const qx = e.x + Math.cos(a) * 16, qy = e.y + Math.sin(a) * 16; E(g, qx, qy, on ? 3 : 2, on ? '#ffd84a' : '#8a6a2a', spent ? 0.3 : on ? 0.9 : 0.5, true); }
  E(g, e.x, e.y, 16, '#ffd84a', spent ? 0.15 : 0.35, false);
  // cards circling her, and coins catching the light
  for (let i = 0; i < 6; i++) {
    const a = t * (spent ? 0.3 : 1.4) + i / 6 * TAU, cx = X + Math.cos(a) * 13, cy = Y - 10 + Math.sin(a) * 4 - (spent ? -6 : 0), front = Math.sin(a) > 0, w = Math.abs(Math.cos(a * 2)) * 1.5 + 0.6;
    g.globalAlpha = front ? 1 : 0.5; g.fillStyle = '#141414'; g.fillRect(Math.round(cx - w - 0.5), Math.round(cy - 2.5), Math.round(w * 2 + 1), 5); g.fillStyle = '#fffaf0'; g.fillRect(Math.round(cx - w), Math.round(cy - 2), Math.max(1, Math.round(w * 2)), 4);
    if (w > 1) { g.fillStyle = i % 2 ? '#c8141e' : '#141414'; g.fillRect(Math.round(cx), Math.round(cy - 1), 1, 2); } g.globalAlpha = 1;
  }
  if (!spent && Math.random() < 0.3) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 20, y: Y - 18 - Math.random() * 6, vx: (Math.random() - 0.5) * 20, vy: 20, g: 80, life: 0.7, max: 0.7, color: Math.random() < 0.5 ? '#ffd84a' : '#fff4c0' });
  // the die
  const hy = Y - 30;
  if (B.st === 'roll') { // tumbling up out of her hand, faces flickering
    const u = 1 - B.t / 0.9, ay = hy - Math.sin(u * Math.PI) * 10;
    for (let k = 1; k <= 3; k++) drawDie(g, X - k * 0.5, ay + k * 2, 4, t * 30 - k, 1 + Math.floor(t * 40 + k) % 6, 0.25 / k);
    drawDie(g, X, ay, 4.5, t * 30, 1 + Math.floor(t * 40) % 6);
    lit(g, c => { c.globalAlpha = 0.4; c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(X, ay, 8, 0, TAU); c.fill(); });
  } else if (!spent) { // landed, showing its face; its name over it
    const fresh = B.st === 'cast' ? 1 : clamp(1 - (1.15 - B.t) / 0.6), s = 4.5 + fresh * 2;
    lit(g, c => { const gr = c.createRadialGradient(X, hy, 1, X, hy, 14 + fresh * 8); gr.addColorStop(0, 'rgba(255,216,74,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(X - 24, hy - 24, 48, 48); });
    if (B.face) drawDie(g, X, hy + Math.sin(t * 3) * 1, s, 0, B.face);
    if (B.face && fresh > 0.05) { g.globalAlpha = Math.min(1, fresh * 2); this.text(FACE_NAME[B.face - 1], X, hy - 18, '#ffd84a', 'center'); g.globalAlpha = 1; }
    for (let i = 0; i < 5; i++) { const on = i < B.rolls; px(g, X - 4 + i * 2, hy + 9, on ? '#ffd84a' : '#5a4a2a'); } // five rolls a round
  } else { // spent: the die dark on the floor, her slumped
    drawDie(g, X + 8, Y - 2, 3, 0, B.face || 1, 0.6);
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); this.text('SPENT', X, Y - 30, '#c8c0b0', 'center'); g.globalAlpha = 1;
  }
};

// ---------------------------------------------------------------------------------------------------------------
// who gets drawn with what
// ---------------------------------------------------------------------------------------------------------------
const baseDrawEnemy = RP.drawEnemy;
RP.drawEnemy = function (sim, e, frame) {
  const pre = e.type === 'timeadmin' && !e.finalKeeper && !e.dead && e.state !== 'spawn';
  if (pre) this.drawAdminDial(sim, e);
  baseDrawEnemy.call(this, sim, e, frame);
  if (e.bet && !e.dead) this.drawLastBet(sim, e, 0);
};
const baseDrawHero = RP.drawHero;
RP.drawHero = function (sim, p, frame) {
  const F = p.beastT > 0 && p.skinForm;
  if (F) this.drawSkinAura(sim, p, F, 'pre');
  if (F && EASTERN_DRAGONS[F.type] && this.drawEasternDragon && !(p.polyT > 0)) { // a dragon's skin is a dragon, drawn whole
    try { const d = this.skinDragon || (this.skinDragon = {}); const pe = d[p.id] || (d[p.id] = { id: 9000 + (p.id || 0), type: F.type, def: ENEMY_TYPES[F.type], r: 6, phase: 1 }); Object.assign(pe, { x: p.x, y: p.y, fx: p.fx, fy: p.fy, state: p.state, st: p.st, mvx: p.mvx, mvy: p.mvy, hp: p.hp, maxHp: p.maxHp, flash: 0 });
      this.drawEasternDragon(sim, pe, EASTERN_DRAGONS[F.type](pe), 0, 0, p.hurtT > 0 && Math.floor(p.hurtT * 30) % 2, 0.7); this.drawStatus(sim, p, 0); }
    catch (err) { baseDrawHero.call(this, sim, p, frame); }
  } else baseDrawHero.call(this, sim, p, frame);
  if (F) this.drawSkinAura(sim, p, F, 'post');
  if (p.formerSelf && !p.dead) { // one of your saved selves, called up out of the clay
    const X = sx(p.x), Y = sy(p.y);
    this.text((p.selfName || 'YOU').toUpperCase(), X, Y - 26, '#ffe8b0', 'center', 6);
    lit(this.g, c => { c.globalAlpha = 0.25 + 0.15 * Math.sin(sim.t * 5 + p.id); c.fillStyle = '#ffd88a'; c.beginPath(); c.ellipse(X, Y - 6, 7, 9, 0, 0, TAU); c.fill(); });
    if (Math.random() < 0.3) this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 8, y: Y - Math.random() * 12, vx: 0, vy: 8, life: 0.6, max: 0.6, color: '#8a5a3a' }); // clay crumbling off them
    const left = Math.max(0, p.selfLife / 14); this.g.fillStyle = '#3a2416'; this.g.fillRect(X - 6, Y + 3, 12, 1); this.g.fillStyle = '#ffd88a'; this.g.fillRect(X - 6, Y + 3, Math.round(12 * left), 1);
  }
  if (p.swordEmperor && !p.dead) { // the Sword Emperor: a gold crown, and a ring of sheathed swords that never leave their scabbards
    const g = this.g, X = sx(p.x), Y = sy(p.y), t = sim.t;
    g.fillStyle = '#e8c34a'; g.fillRect(X - 3, Y - 14, 7, 1); for (const dx of [-3, 0, 3]) g.fillRect(X + dx, Y - 15, 1, 1); g.fillStyle = '#ff4a5a'; g.fillRect(X, Y - 14, 1, 1);
    for (let i = 0; i < 6; i++) { const a = t * 1.2 + i / 6 * TAU, s = Math.sin(a), qx = X + Math.cos(a) * 12, qy = Y - 4 + s * 3; g.globalAlpha = s > 0 ? 1 : 0.45; g.fillStyle = '#1a1214'; g.fillRect(Math.round(qx), Math.round(qy - 5), 1, 6); g.fillStyle = '#e8c34a'; g.fillRect(Math.round(qx) - 1, Math.round(qy - 5), 3, 1); g.globalAlpha = 1; }
  }
};
// the skin's light: its colour round the fighter; with the Four Symbols, the other four standing at the compass points
RP.drawSkinAura = function (sim, p, F, layer) {
  const g = this.g, t = sim.t, X = sx(p.x), Y = sy(p.y);
  if (layer === 'pre') {
    E(g, p.x, p.y, F.divine ? 10 : 7, F.color, 0.25 + 0.15 * Math.sin(t * 6), true);
    if (F.divine) { E(g, p.x, p.y, 13, F.color, 0.6, false); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t; px(g, sx(p.x + Math.cos(a) * 13), sy(p.y + Math.sin(a) * 13), ELC[F.el][1]); } }
    return;
  }
  if (Math.random() < (F.divine ? 0.6 : 0.3)) { const c = F.el ? ELC[F.el] : [F.color, '#ffffff']; this.parts.push({ kind: 'px', x: X + (Math.random() - 0.5) * 12, y: Y - Math.random() * 14, vx: (Math.random() - 0.5) * 8, vy: F.el === 'water' ? 12 : -20, life: 0.5, max: 0.5, color: c[Math.random() < 0.5 ? 0 : 1] }); }
  if (!p.fourSymbols) return;
  const SYM = { eastdragon: ['wood', 0], phoenix: ['fire', 1], tiger: ['metal', 2], tortoise: ['water', 3], qilin: ['earth', 4] };
  for (const [type, [el, slot]] of Object.entries(SYM)) {
    if (type === F.type) continue;
    const [c0, c1] = ELC[el];
    let qx, qy;
    if (slot === 4) { qx = X; qy = Y - 26 + Math.sin(t * 2) * 1.5; } // the Qilin, over you
    else { const a = [0, Math.PI / 2, Math.PI, -Math.PI / 2][slot] + t * 0.6; qx = X + Math.cos(a) * 18; qy = Y - 6 + Math.sin(a) * 8; } // east, south, west, north
    lit(g, c => { c.globalAlpha = 0.5; c.fillStyle = c0; c.beginPath(); c.arc(qx, qy, 3.5, 0, TAU); c.fill(); });
    disc(g, qx, qy, 1.6, c1); px(g, qx, qy, '#ffffff');
    if (Math.random() < 0.15) this.parts.push({ kind: 'px', x: qx, y: qy, vx: (Math.random() - 0.5) * 6, vy: el === 'fire' ? -14 : el === 'water' ? 10 : -4, life: 0.4, max: 0.4, color: c0 });
  }
};

// ---------------------------------------------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------------------------------------------
const baseEvent = RP.celestialEvent;
RP.celestialEvent = function (ev) {
  const x = sx(ev.x), y = sy(ev.y) - 4, cp = o => (this.cparts = this.cparts || []).push(o);
  switch (ev.type) {
    case 'threelives': cp({ kind: 'text', x, y: y - 30, text: 'PAST · PRESENT · FUTURE', color: '#b8f4ff', life: 1.2, max: 1.2 }); this.snd('chime'); return true;
    case 'hourhand': { // a vast clock face thrown down round him for a moment
      (this.lateFx = this.lateFx || []).push({ kind: 'clock', x: ev.x, y: ev.y, minute: ev.minute, age: 0, life: ev.minute ? 1.6 : 2.0 });
      this.snd('warp'); return true;
    }
    case 'borrowed': cp({ kind: 'text', x, y: y - 22, text: 'BORROWED TIME', color: '#c8c0b0', life: 1.2, max: 1.2 }); (this.lateFx = this.lateFx || []).push({ kind: 'hourglass', x: ev.x, y: ev.y, age: 0, life: 1.1 }); this.snd('glass'); return true;
    case 'lastbet':
      this.flash('rgba(255,216,74,0.55)', 0.25); this.shake = Math.max(this.shake, 10);
      this.banner = { kicker: 'SHE PUTS EVERYTHING ON ONE DIE', text: 'THE LAST BET', color: '#ffd84a', life: 2.6, small: true, lore: 'ONLY GOOD ROLLS LEFT' };
      this.cburst(x, y - 10, 70, 140, ['#ffd84a', '#fff4c0', '#c8141e', '#ffffff'], 1.0, 80); this.snd('ultboom'); return true;
    case 'betroll': this.snd('pop'); return true;
    case 'betface': this.cburst(x, y - 30, 24, 70, ['#ffd84a', '#ffffff'], 0.5); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 30, life: 0.35, max: 0.35, color: '#ffd84a' }); this.snd(ev.face === 6 ? 'gong' : 'chime'); if (ev.face === 6) this.flash('rgba(255,216,74,0.3)', 0.12); return true;
    case 'betspent': this.cburst(x, y - 12, 30, 60, ['#8a7a5a', '#c8c0b0'], 0.8, 60); this.snd('poof'); return true;
    case 'betagain': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 40, life: 0.5, max: 0.5, color: '#ffd84a' }); this.snd('riser'); return true;
    case 'formerself': cp({ kind: 'text', x, y: y - 28, text: (ev.name || '').toUpperCase(), color: '#ffe8b0', life: 1.4, max: 1.4 }); this.cburst(x, y, 30, 80, ['#8a5a3a', '#c89a6a', '#ffe8b0'], 0.6, 60); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 18, life: 0.4, max: 0.4, color: '#ffd88a' }); this.snd('rock'); return true;
    case 'selffade': this.cburst(x, y - 6, 26, 50, ['#8a5a3a', '#5a3a26', '#ffe8b0'], 0.7, 90); this.snd('poof'); return true;
    case 'skinart': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 12, life: 0.25, max: 0.25, color: ev.color || '#ffffff' }); return true;
    case 'guardianstrike': { const c = ELC[ev.el] || ['#ffffff', '#ffffff']; cp({ kind: 'beam', x0: x, y0: 14, x1: x, y1: y, w: 5, c1: c[0], c2: c[1], life: 0.3, max: 0.3 }); this.snd('zap'); return true; }
    case 'fivephases': {
      this.flash('rgba(255,250,230,0.75)', 0.25); this.shake = Math.max(this.shake, 14);
      this.banner = { kicker: '四象五行', text: 'FIVE PHASES COMPLETE', color: '#ffd84a', life: 2.4, small: true, lore: 'WOOD · FIRE · EARTH · METAL · WATER' };
      (this.lateFx = this.lateFx || []).push({ kind: 'wuxingwheel', x: ev.x, y: ev.y, age: 0, life: 1.8 });
      for (const el of Object.keys(ELC)) this.cburst(x, y - 8, 22, 130, ELC[el], 0.9, 40);
      this.snd('ultboom'); return true;
    }
  }
  if (ev.type === 'shiftform' && ev.skin) { // a new skin: its colour bursting out, and for the Four Symbols, its name in brush
    if (ev.cn) { (this.lateFx = this.lateFx || []).push({ kind: 'cjk', x, y: y - 30, text: ev.cn, color: ev.color, age: 0, life: 1.5 }); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: 34, life: 0.5, max: 0.5, color: ev.color }); this.flash(`rgba(255,255,255,0.25)`, 0.08); this.shake = Math.max(this.shake, 5); }
  }
  return baseEvent.call(this, ev);
};
// the passing shows: a clock face, an hourglass, the wheel of the five phases
const baseParts = RP.drawCelestialParts;
RP.drawCelestialParts = function (dt) {
  baseParts.call(this, dt);
  const L = this.lateFx; if (!L || !L.length) return;
  const g = this.g;
  for (const f of L) {
    f.age += dt; const u = f.age / f.life, k = Math.min(1, f.age / 0.2, (f.life - f.age) / 0.4);
    if (f.kind === 'clock') {
      const R = 60, col = f.minute ? '#c8f4ff' : '#7fe0ff';
      E(g, f.x, f.y, R, col, 0.06 * k, true); E(g, f.x, f.y, R, col, 0.6 * k, false, 1); E(g, f.x, f.y, R - 6, col, 0.3 * k, false);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, tx = sx(f.x + Math.cos(a) * (R - 12)), ty = sy(f.y + Math.sin(a) * (R - 12)) - 2; g.globalAlpha = k; this.text(['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i], tx, ty, col, 'center', 6); g.globalAlpha = 1; line(g, sx(f.x + Math.cos(a) * (R - 4)), sy(f.y + Math.sin(a) * (R - 4)), sx(f.x + Math.cos(a) * R), sy(f.y + Math.sin(a) * R), col, 1, k); }
    } else if (f.kind === 'cjk') { // a name in brush, rising and fading
      g.save(); g.globalAlpha = k; g.font = `12px ${typeof CJK_FONT !== 'undefined' ? CJK_FONT : 'serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = f.color; g.shadowBlur = 6; g.fillStyle = '#fffaf0'; g.fillText(f.text, f.x, f.y - u * 8); g.restore();
    } else if (f.kind === 'hourglass') {
      const X = sx(f.x), Y = sy(f.y) - 30, flip = Math.min(1, f.age / 0.3) * Math.PI;
      g.save(); g.translate(X, Y); g.rotate(flip); g.globalAlpha = k;
      g.fillStyle = '#c8a46a'; g.fillRect(-4, -6, 9, 1); g.fillRect(-4, 6, 9, 1);
      g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(-3, -5); g.lineTo(4, -5); g.lineTo(0.5, 0); g.lineTo(4, 5); g.lineTo(-3, 5); g.lineTo(0.5, 0); g.closePath(); g.fill();
      g.fillStyle = '#e8c870'; g.beginPath(); g.moveTo(-2, 4.5); g.lineTo(3, 4.5); g.lineTo(0.5, 2); g.fill(); g.restore(); g.globalAlpha = 1;
    } else if (f.kind === 'wuxingwheel') { // the five, each a point of colour on a turning wheel, a line drawn from each to the one it gives birth to
      const X = sx(f.x), Y = sy(f.y) - 8, R = 20 + u * 40, els = Object.keys(ELC);
      lit(g, c => { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + f.age * 2, b = (i + 1) / 5 * TAU + f.age * 2, [c0] = ELC[els[i]]; c.globalAlpha = k; c.strokeStyle = c0; c.lineWidth = 2; c.beginPath(); c.moveTo(X + Math.cos(a) * R, Y + Math.sin(a) * R * 0.6); c.lineTo(X + Math.cos(b) * R, Y + Math.sin(b) * R * 0.6); c.stroke(); c.fillStyle = c0; c.beginPath(); c.arc(X + Math.cos(a) * R, Y + Math.sin(a) * R * 0.6, 4, 0, TAU); c.fill(); } });
    }
  }
  this.lateFx = L.filter(f => f.age < f.life);
};
})();
