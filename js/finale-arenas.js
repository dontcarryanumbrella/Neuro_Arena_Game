// The finales' arenas, given more: what stands in Heaven's End and at the Bottom of the Jar, and what moves there in
// answer to the fight in progress. Added onto the scenes in arenas.js (each scene's own bake and ambient run first),
// plus the scar the teacher leaves in the Peaks' sky. Loaded after arenas.js and swordfx.js.

// the fight being drawn (the ambient is painted after it, in Renderer.present); null for a scene with no fight
let finaleSim = null;
const drawFight = Renderer.prototype.draw;
Renderer.prototype.draw = function (sim, dt, extra) { finaleSim = sim; return drawFight.call(this, sim, dt, extra); };

// set by main.js: what the jar remembers between fights
const ARENA_MARKS = { peaksScar: false };

const JAR_WATCHERS = [[10, 108, 1], [24, 118, 1], [9, 130, 1], [246, 108, -1], [232, 118, -1], [247, 130, -1]]; // [x, y, facing]
const SUMMIT_SWORDS = [[6, 102, 12, 2], [18, 112, 14, -1], [30, 126, 11, 3], [11, 136, 13, -2], [248, 104, 12, -2], [236, 114, 14, 1], [226, 128, 11, -3], [244, 138, 13, 2]]; // [x, y, length, tilt]
const offStage = (x, y) => ((x - CX) / (R + 2)) ** 2 + ((y - CY - 3) / (R * SQ + 6)) ** 2 > 1;
const scarPath = (k, w, c) => { k.g.beginPath(); for (let x = -4; x <= 260; x += 4) k.g.lineTo(x, SKY_SCAR(x)); k.g.strokeStyle = c; k.g.lineWidth = w; k.g.lineCap = 'round'; k.g.stroke(); };

// add to a scene: its bake and its ambient each run the scene's own first
function addToScene(id, { bake, ambient }) {
  const sc = WORLD_SCENES[id], b0 = sc.bake, a0 = sc.ambient;
  if (bake) sc.bake = (k, rand) => { b0(k, rand); bake(k, rand); };
  if (ambient) sc.ambient = (k, t, sim = finaleSim) => { if (a0) a0(k, t); ambient(k, t, sim); };
}

// ---------- the Peaks: once he has yielded, the sky he cut stays open ----------
addToScene('peaks', {
  ambient(k, t) {
    if (!ARENA_MARKS.peaksScar) return;
    k.with(() => { k.g.globalAlpha = 0.55 + 0.15 * Math.sin(t * 1.2); scarPath(k, 3.2, 'rgba(159,216,255,0.35)'); scarPath(k, 1.2, '#e8f4ff'); scarPath(k, 0.4, '#ffffff'); });
  },
});

// ---------- the Bottom of the Jar ----------
addToScene('bottom', {
  bake(k) {
    // the fifteen talismans on the lid's rim, every one burned down to a stub
    for (let i = 0; i < 15; i++) { const x = 113 + i * 2.1, len = 2.5 + (i * 7) % 5; k.rect(x, 5, 0.9, len, '#d8c8a0'); k.rect(x, 5 + len, 0.9, 1.6, '#3a200e'); }
    // the ones who came before, sitting against the clay in the dark, facing the stage
    for (const [x, y, f] of JAR_WATCHERS) { k.poly([[x - 3.4, y], [x + 3.4, y], [x + 2.2, y - 7], [x - 2.2, y - 7]], '#120904'); k.circle(x + f, y - 9, 2.3, '#120904'); k.oval(x + f * 3, y - 1, 2.6, 1.4, '#120904'); }
  },
  ambient(k, t, sim) {
    const her = sim && sim.enemies.find(e => e.def.mystery && !e.dead), keeper = sim && sim.enemies.find(e => e.finalKeeper && !e.dead);
    const past = sim && sim.heroes.some(h => h.discarded), coat = sim && sim.heroes.some(h => h.guardianEcho);
    const open = her && her.phase === 2 ? 1 - her.hp / her.maxHp : 0; // as her last gamble runs out, the lid begins to lift
    k.poly([[116 - open * 10, 0], [140 + open * 10, 0], [164 + open * 22, 84], [92 - open * 22, 84]], `rgba(255,236,190,${0.03 + 0.025 * Math.sin(t * 0.7) + open * 0.14})`);
    if (open > 0) { k.glow(128, 6, 26 + open * 20, '#fffae0', 0.3 + open * 0.6, 4 + open * 4); k.rect(110 - open * 8, 5.5, 36 + open * 16, 0.8, `rgba(255,252,232,${0.4 + open * 0.6})`); }
    for (let i = 0; i < 7; i++) { // ash from the talismans, rocking as it falls; a few still have an ember on their edge
      const u = (t * 0.045 + i / 7) % 1, x = 112 + (i * 13) % 34 + Math.sin(t * 1.3 + i * 2) * 7 * u, y = 10 + u * 92, a = 1 - u;
      k.rect(x, y, 1.6, 0.9, `rgba(52,36,26,${0.85 * a})`); if (i % 3 === 0) k.glow(x + 1.4, y + 0.4, 1.4, '#ff8a3a', a * (0.5 + 0.5 * Math.sin(t * 9 + i)));
    }
    for (let i = 0; i < 9; i++) { const dir = i % 2 ? 1 : -1, x = ((dir * t * (3 + i % 3) + i * 41) % (W + 60) + W + 60) % (W + 60) - 30; k.oval(x, 118 + (i * 7) % 24, 22, 2.2, 'rgba(8,4,2,0.4)'); } // murk along the floor
    // the ones against the wall open their eyes for their own kind: grey for a discarded iteration, gold for her
    if (past || her || coat) JAR_WATCHERS.forEach(([x, y, f], i) => {
      if (Math.sin(t * 0.8 + i * 2.3) < -0.92) return; // a blink
      const c = her || coat ? '#ffd27a' : '#c8c4be';
      for (const ex of [x + f - 0.9 + f * 0.6, x + f + 0.9 + f * 0.6]) { k.glow(ex, y - 9.2, 1.6, c, 0.7); k.circle(ex, y - 9.2, 0.45, c); }
    });
    if (keeper) { // the keeper's dial, faint on the clay under the lid, ticking backwards
      k.ring(128, 22, 8, 'rgba(232,196,120,0.4)', 0.5);
      for (let i = 0; i < 12; i++) { const q = i / 12 * 6.283; k.circle(128 + Math.cos(q) * 6.6, 22 + Math.sin(q) * 6.6, 0.4, 'rgba(232,196,120,0.5)'); }
      const q = -Math.floor(t) * Math.PI / 30 - Math.PI / 2; k.line(128, 22, 128 + Math.cos(q) * 6, 22 + Math.sin(q) * 6, 'rgba(255,224,150,0.7)', 0.6);
    }
    if (her || coat) for (let i = 0; i < 4; i++) { // her dice, tumbling down through the light
      const u = (t * 0.07 + i / 4) % 1, x = 106 + i * 13 + Math.sin(t * 0.9 + i) * 4, y = 12 + u * 66, a = Math.min(1, (1 - u) * 2), face = ((Math.floor(t * 3 + i * 1.7) % 3) + 3) % 3;
      k.with(() => { k.g.translate(x + 1.6, y + 1.6); k.g.rotate(Math.sin(t * 2 + i) * 0.5); k.rect(-1.6, -1.6, 3.2, 3.2, `rgba(244,236,216,${a})`);
        const pip = `rgba(160,26,26,${a})`, P = [[0, 0], [-0.9, -0.9, 0.9, 0.9], [-0.9, -0.9, 0, 0, 0.9, 0.9]][face];
        for (let j = 0; j < P.length; j += 2) k.circle(P[j], P[j + 1], 0.4, pip); });
    }
  },
});

// ---------- Heaven's End Summit ----------
addToScene('summit', {
  bake(k) {
    // his manual, open on a stone where he left it
    k.oval(16, 87, 12, 3, 'rgba(0,0,0,0.35)'); k.poly([[5, 87], [6, 82], [12, 80], [22, 80], [27, 83], [27, 87]], '#3e475a'); k.poly([[6, 82], [12, 80], [22, 80], [26, 82]], '#5e687c');
    k.poly([[9, 81], [16, 80.4], [16, 77.6], [9, 78.2]], '#ece8d8'); k.poly([[16, 80.4], [23, 81], [23, 78.2], [16, 77.6]], '#d4ceb8'); k.line(16, 77.6, 16, 80.4, '#8a7a60', 0.4);
    for (let i = 0; i < 3; i++) { k.line(10, 78.8 + i * 0.6, 15, 78.4 + i * 0.6, '#8a8a96', 0.25); k.line(17, 78.4 + i * 0.6, 22, 78.8 + i * 0.6, '#8a8a96', 0.25); }
    // the swords of every challenger who climbed here first, left standing in the snow
    for (const [x, y, len, tilt] of SUMMIT_SWORDS) {
      const gx = x + tilt * 0.7, gy = y - len * 0.7;
      k.oval(x, y, 3, 1, '#c8d4dc'); k.line(x, y, gx, gy, '#9fb0c6', 1); k.line(x + 0.4, y, gx + 0.4, gy, '#5a6a82', 0.4);
      k.line(gx - 2.2, gy, gx + 2.2, gy, '#7a6a44', 0.8); k.line(gx, gy, x + tilt, y - len, '#232a3c', 0.8); k.circle(x + tilt, y - len - 0.4, 0.6, '#8a7a50');
    }
  },
  ambient(k, t, sim) {
    const saint = sim && sim.enemies.find(e => e.def.manual), bound = saint && saint.deathBound && !saint.dead, gone = saint && saint.dead, fierce = saint && saint.phase === 2 ? 1 : 0;
    if (bound) k.with(() => { k.g.globalAlpha = 0.6 + 0.25 * Math.sin(t * 5); scarPath(k, 5, 'rgba(255,40,80,0.45)'); scarPath(k, 2.2, '#ff5a7a'); }); // the wound in the sky bleeds while the manual holds him up
    else k.with(() => { k.g.globalAlpha = 0.25 + 0.2 * Math.sin(t * 1.4); scarPath(k, 4, 'rgba(159,216,255,0.4)'); }); // and breathes, otherwise
    for (let i = 0; i < 16; i++) { // light coming down through the split, drifting with the wind
      const u = (t * 0.07 + i / 16) % 1, x0 = (i * 83 + 20) % W, x = x0 - u * (16 + fierce * 20) + Math.sin(t + i) * 3, y = SKY_SCAR(x0) + u * 74;
      k.glow(x, y, 1.6, bound ? '#ffcf4a' : '#e8f4ff', 0.9 * (1 - u));
    }
    const sp = 70 + fierce * 70; // the wind, right to left, harder once he means it
    for (let i = 0; i < 14; i++) { const x = W + 20 - ((t * sp * (0.7 + (i % 3) * 0.2) + i * 53) % (W + 60)), y = 8 + (i * 29) % 132, L = 4 + (i % 4) * 2 + fierce * 5; if (!offStage(x, y) || !offStage(x + L, y)) continue; k.line(x, y, x + L, y, `rgba(220,235,255,${0.2 + (i % 3) * 0.08 + fierce * 0.1})`, 0.6); }
    for (let i = 0; i < 18; i++) { const x = ((i * 31 - t * (12 + fierce * 22) + Math.sin(t + i) * 5) % W + W) % W, y = (t * 10 + i * 23) % 140; k.circle(x, y, 0.5, 'rgba(255,255,255,0.75)'); }
    // the challengers' swords: a gleam runs up one blade at a time; when he falls, every one of them answers
    const n = SUMMIT_SWORDS.length, at = Math.floor(t * 0.6) % n, u = (t * 0.6) % 1;
    SUMMIT_SWORDS.forEach(([x, y, len, tilt], i) => {
      const tx = x + tilt, ty = y - len;
      if (gone) { k.glow(tx, ty - 1, 4, '#9fd8ff', 0.6 + 0.4 * Math.sin(t * 3 + i)); for (let j = 0; j < 3; j++) { const m = (t * 0.5 + i / n + j / 3) % 1; k.glow(tx + Math.sin(t + i + j) * 2, ty - 2 - m * 34, 1.6, '#e8f4ff', 1 - m); } }
      else if (bound) { if ((Math.floor(t * 12) + i) % 3 === 0) k.glow(tx + (i % 2 ? 0.6 : -0.6), ty, 2, '#ff5a7a', 0.9); } // they tremble in their snow
      else if (i === at && u < 0.4) { const v = u / 0.4; k.glow(x + tilt * 0.7 * v, y - len * 0.7 * v, 2.2, '#ffffff', 0.9); }
    });
    if (Math.floor(t * 0.4) % 5 === 0) { const v = (t * 0.4) % 1; k.poly([[16 + v * 5, 77.6], [21 + v * 4, 77.6 - Math.sin(v * Math.PI) * 3], [21 + v * 4, 79 - Math.sin(v * Math.PI) * 3], [16 + v * 5, 79]], '#ece8d8'); } // a page of the manual lifts in the wind
  },
});
