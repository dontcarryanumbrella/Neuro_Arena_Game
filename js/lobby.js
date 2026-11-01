// The lobby: the inside of the jar, drawn at 256x144 like the arena. Its stations open the game's panels;
// the fighter walks to the one you click. Loaded after render.js (it draws through a Renderer).

// Each station: what it is, where it is clicked (screen rectangle), and where the fighter stands to use it.
const STATIONS = [
  { id: 'portal', name: 'PORTAL', desc: 'Enter a world', panel: 'portalPanel', rect: [104, 26, 152, 84], at: [128, 92] },
  { id: 'pavilion', name: 'MEMORY PAVILION', desc: 'Train, watch, simulate', panel: 'pavilionPanel', rect: [46, 44, 96, 86], at: [70, 94] },
  { id: 'hearth', name: 'FIREPLACE', desc: 'Abilities and identity', panel: 'hearthPanel', rect: [158, 48, 203, 104], at: [181, 105] },
  { id: 'altar', name: 'TALENT ALTAR', desc: 'Talents and spins', panel: 'talentSection', rect: [166, 106, 196, 134], at: [160, 124] },
  { id: 'mirror', name: 'MIRROR', desc: 'Races and skin shop', panel: 'mirrorPanel', rect: [212, 46, 242, 88], at: [222, 98] },
  { id: 'tally', name: 'TALLY WALL', desc: 'Level, kills, memories', panel: 'tallyPanel', rect: [4, 26, 46, 80], at: [30, 98] },
  { id: 'urns', name: 'MEMORY URNS', desc: 'Save and load fighters', panel: 'savePanel', rect: [18, 108, 58, 136], at: [52, 122] },
  { id: 'stone', name: 'RESONANCE STONE', desc: 'Other jars: online', panel: 'onlineSection', rect: [212, 106, 238, 138], at: [206, 126] },
  { id: 'lid', name: 'THE LID', desc: 'Fifteen seals', panel: 'portalPanel', rect: [80, 0, 176, 20], at: [128, 104] },
];
const STATION_BY_ID = Object.fromEntries(STATIONS.map(s => [s.id, s]));
const LID = { x: 128, y: 6, rx: 46, ry: 9 };
const SEALS_SHOWN = 15;
const HEARTH = { x: 180, y: 84 }; // the fireplace, on the back wall
const ALTAR = { x: 181, y: 128 };
const FLOOR_CANDLES = [[80, 98], [152, 93]]; // flame positions; each candle stands under its flame
const CANDLE_FLAMES = [[8, 109], [233, 38], ...FLOOR_CANDLES]; // every loose candle in the room

class Lobby {
  constructor(renderer) {
    this.r = renderer;
    this.t = 0;
    this.hero = { x: 128, y: 112, tx: 128, ty: 112, flip: false, walkT: 0, then: null };
    this.hover = null;
    this.smoke = [];
    this.sparks = [];
    this.motes = Array.from({ length: 16 }, (_, i) => ({ x: (i * 53) % 256, y: 20 + (i * 37) % 100, s: 2 + (i % 5) }));
    this.access = {};
    this.bg = this.bake();
  }

  setAccess(access) {
    const key = JSON.stringify(access);
    if (key === this.accessKey) return;
    this.accessKey = key; this.access = access; this.bg = this.bake();
    if (this.hover && !access[this.hover.id]) this.hover = null;
    this.hero.then = null;
  }

  // the parts that never move: walls, floor, rug, the structures of the stations and the clutter of a long stay
  bake() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), rand = mulberry32(7);
    // furniture and clutter are painted on their own layer, so each piece can get a dark outline
    const lc = document.createElement('canvas'); lc.width = W; lc.height = H;
    const L = lc.getContext('2d');
    let tg = g;
    const px = (x, y, col) => { tg.fillStyle = col; tg.fillRect(x, y, 1, 1); };
    const rect = (x, y, w, h, col) => { tg.fillStyle = col; tg.fillRect(x, y, w, h); };
    // warm light (f > 0) or shadow (f < 0), in coarse steps so it stays pixel art
    const shade = (hex, f) => {
      const n = parseInt(hex.slice(1), 16), to = f > 0 ? [232, 168, 104] : [16, 9, 5], k = Math.min(1, Math.abs(f));
      const ch = i => Math.round(((n >> (16 - i * 8)) & 255) * (1 - k) + to[i] * k);
      return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
    };
    const floorTop = x => Math.round(112 - 35.7 * Math.sqrt(Math.max(0, 1 - ((x - 128) / 134.4) ** 2)));
    // the jar's wall: warm glazed clay, curving away at the sides, lit by the fire and the gate
    const wall = ['#1e130d', '#2a1a11', '#372315', '#452d1a', '#53381f', '#5f4128'];
    for (let x = 0; x < W; x++) for (let y = 0, ft = floorTop(x); y < ft; y++) {
      const curve = Math.abs(x - 128) / 128;
      const light = Math.max(0, 1 - Math.hypot(x - 128, (y - 56) * 1.6) / 120) * 0.8 + Math.max(0, 1 - Math.hypot(x - HEARTH.x, (y - 72) * 1.3) / 70) * 1.4;
      const k = 1 + light * 2.4 - curve * 1.5 + (y / 96) * 0.7 + ((x + y) % 2 ? 0.25 : 0);
      px(x, y, wall[Math.max(0, Math.min(5, Math.floor(k)))]);
    }
    // glaze that ran as it fired
    for (let i = 0; i < 40; i++) { tg.fillStyle = 'rgba(255,220,170,0.05)'; tg.fillRect(Math.floor(rand() * W), 26 + Math.floor(rand() * 34), 1, 3 + Math.floor(rand() * 6)); }
    // older tallies under his, worn almost smooth: someone was here before
    for (let i = 0; i < 70; i++) {
      const grp = Math.floor(i / 5), k = i % 5, x = 7 + (grp % 4) * 9 + (grp % 3), y = 31 + Math.floor(grp / 4) * 8 + (grp % 2);
      if (k < 4) { for (let j = 0; j < 6; j++) if (rand() < 0.75) px(x + k * 2, y + j, '#3d2a1d'); }
      else for (let j = 0; j < 7; j++) px(x - 1 + j, y + 5 - Math.floor(j * 0.8), '#36251a');
    }
    // a painted band round the jar's shoulder, where the potter's coils joined
    for (let x = 0; x < W; x++) {
      const y0 = 21 + Math.round(((x - 128) / 128) ** 2 * 6);
      px(x, y0, '#2a1a10'); px(x, y0 + 4, '#2a1a10');
      for (let k = 1; k <= 3; k++) {
        const m = (x + 2) % 8, diamond = Math.abs(m - 3.5) + Math.abs(k - 2) * 1.5 < 2;
        px(x, y0 + k, diamond ? '#7a2a1c' : k === 2 && m === 7 ? '#c9a65a' : '#7e6040');
      }
    }
    // wooden wainscot along the foot of the wall: upright boards under a rail
    for (let x = 0; x < W; x++) {
      const ft = floorTop(x), top = ft - 13, lit = Math.max(0, 1 - Math.abs(x - HEARTH.x) / 70) * 0.6 + Math.max(0, 1 - Math.abs(x - 128) / 80) * 0.35;
      for (let y = top; y < ft; y++) {
        const r = y - top, board = x % 9;
        const col = r === 0 ? '#2e1c10' : r === 1 ? '#8a6040' : r === 2 ? '#4a301c' : y === ft - 1 ? '#24160c' : board === 0 ? '#36210f' : board === 1 ? '#74502f' : (x * 13 + y * 7) % 11 === 0 ? '#4e321e' : '#5c3c22';
        px(x, y, r === 0 || y === ft - 1 ? col : shade(col, Math.round(lit * 3) / 3 * 0.3 - Math.abs(x - 128) / 128 * 0.25));
      }
    }
    // the floor: worn planks laid across the jar's round bottom, darker toward the wall, warm where the light falls
    const tones = ['#6a4629', '#62412a', '#704b2d', '#5c3d25'];
    for (let y = 70; y < H; y++) for (let x = 0; x < W; x++) {
      const ft = floorTop(x);
      if (y < ft) continue;
      const d = Math.hypot((x - 128) / 128, (y - 112) / 34);
      if (d > 1.05) { px(x, y, '#170e09'); continue; }
      const row = Math.floor((y - 77) / 5), r = y - 77 - row * 5, plank = Math.floor((x + row * 23) / 41);
      let base = tones[(plank * 7 + row * 3) % 4];
      if (r === 4 || (x + row * 23) % 41 === 0) base = '#3a2516';
      else if (r === 0) base = '#7e563a';
      else if ((x * 31 + y * 17 + plank * 5) % 23 === 0) base = '#553820'; // the grain
      const glow = Math.max(0, 1 - Math.hypot(x - 128, (y - 92) * 2.2) / 70) + Math.max(0, 1 - Math.hypot(x - HEARTH.x, (y - 88) * 2) / 60) * 0.8;
      const dark = Math.max(0, (d - 0.78) / 0.27) + (y - ft < 2 ? 0.6 : 0);
      px(x, y, shade(base, Math.round(Math.min(1, glow) * 4) / 4 * 0.4 - Math.round(Math.min(1, dark) * 3) / 3 * 0.55));
    }
    // a woven rug in the middle, where the fighter rests
    for (let y = -11; y <= 11; y++) for (let x = -44; x <= 44; x++) {
      const d = Math.hypot(x / 44, y / 11);
      if (d > 1) continue;
      const band = d > 0.95 ? '#3a1a10' : d > 0.88 ? '#b8913c' : d > 0.8 ? '#7a2a1c' : d > 0.7 ? '#c9a65a' : ((Math.abs(x) + Math.abs(y) * 3) % 8 < 2 ? '#a8462c' : '#8f3420');
      px(128 + x, 113 + y, (x + y) % 2 && d > 0.9 && d <= 0.95 ? '#8f7438' : band);
    }
    for (const [x, y] of [[128, 113], [112, 113], [144, 113]]) { rect(x - 2, y, 5, 1, '#e8c34a'); rect(x, y - 1, 1, 3, '#e8c34a'); }
    for (let x = -46; x <= 46; x += 3) { px(128 + x, 113 + Math.round(Math.sqrt(Math.max(0, 1 - (x / 46) ** 2)) * 12), '#c9a65a'); } // fringe
    // the mouth of the jar overhead, shut with its lid
    for (let y = -LID.ry - 3; y <= LID.ry + 3; y++) for (let x = -LID.rx - 4; x <= LID.rx + 4; x++) {
      const d = Math.hypot(x / (LID.rx + 3), y / (LID.ry + 3));
      if (d <= 1 && LID.y + y >= 0) px(LID.x + x, LID.y + y, d > 0.86 ? '#6b4a2f' : d > 0.78 ? '#4a3220' : (x * 3 + y) % 7 === 0 ? '#1a1410' : '#0c0908');
    }
    // cobwebs in the top corners
    for (const [sx, dir] of [[0, 1], [W - 1, -1]]) {
      for (let i = 0; i < 9; i++) { px(sx + dir * i, 0, '#5a4a3a'); px(sx, i, '#5a4a3a'); if (i < 7) px(sx + dir * i, i, '#4a3c30'); }
      for (const r of [3, 6]) for (let i = 0; i <= r; i++) px(sx + dir * i, r - i, '#3e3228');
    }
    if (this.access.hearth) { // the chimney breast: bricks rising into the dark, fading as they go (no outline: it crumbles)
      const hx = HEARTH.x, hy = HEARTH.y;
      for (let y = 22; y < hy - 34; y++) for (let x = hx - 13; x <= hx + 13; x++) {
        const row = Math.floor((y - 22) / 3), off = row % 2 ? 3 : 0, fade = (y - 22) / (hy - 56);
        const mortar = (y - 22) % 3 === 2 || (x + off) % 6 === 5;
        if (rand() > 0.35 + fade) continue;
        px(x, y, mortar ? '#2e2018' : fade > 0.6 ? '#5a4030' : '#4a3628');
      }
    }

    tg = L; // ---- everything below stands in the room and is outlined ----
    if (this.access.pavilion) {
    // the Memory Pavilion: a small pavilion of red posts under a dark tiled roof
    rect(48, 82, 46, 3, '#2a1d14'); rect(50, 81, 42, 1, '#4a3220');
    for (const x of [54, 86]) { rect(x, 60, 3, 21, '#8f2416'); rect(x, 60, 1, 21, '#c23b22'); }
    for (let i = 0; i < 9; i++) rect(52 - i, 52 + i, 40 + i * 2, 1, i < 2 ? '#45455a' : i % 2 ? '#2a2a35' : '#34344a');
    rect(46, 60, 4, 1, '#b8913c'); rect(92, 60, 4, 1, '#b8913c'); px(45, 59, '#e8c34a'); px(96, 59, '#e8c34a');
    rect(56, 51, 30, 1, '#b8913c'); rect(69, 47, 4, 4, '#b8913c'); px(70, 46, '#e8c34a');
    rect(57, 61, 28, 2, '#5a3a20');
    }
    if (this.access.hearth) {
    // the fireplace: a brick hearth set into the clay, a mantel with a teapot and a candle
    const hx = HEARTH.x, hy = HEARTH.y;
    for (let y = hy - 32; y < hy; y++) for (let x = hx - 22; x <= hx + 22; x++) {
      const row = Math.floor((y - (hy - 32)) / 3), off = row % 2 ? 3 : 0;
      const mortar = (y - (hy - 32)) % 3 === 2 || (x + off - (hx - 22)) % 6 === 5;
      px(x, y, mortar ? '#3a2a20' : (x * 7 + row * 3) % 5 === 0 ? '#7a5a44' : '#6a4c38');
    }
    // the opening: an arch, sooty inside
    for (let y = hy - 22; y < hy; y++) for (let x = hx - 13; x <= hx + 13; x++) {
      const top = hy - 14 - Math.round(Math.sqrt(Math.max(0, 1 - ((x - hx) / 13) ** 2)) * 8);
      if (y >= top) px(x, y, y < top + 2 ? '#2a1a12' : '#140b07');
    }
    rect(hx - 25, hy - 34, 50, 3, '#5e4630'); rect(hx - 25, hy - 34, 50, 1, '#8a6a4a'); rect(hx - 24, hy - 31, 48, 1, '#3a2a20'); // mantel
    rect(hx - 24, hy, 48, 3, '#5a4838'); rect(hx - 24, hy, 48, 1, '#7a6250'); // hearthstone
    rect(hx - 9, hy - 3, 18, 2, '#4a3220'); rect(hx - 7, hy - 5, 14, 2, '#5e4630'); px(hx - 6, hy - 5, '#8a6a4a'); px(hx + 5, hy - 3, '#8a6a4a'); // logs
    // on the mantel: a clay teapot and two cups, a small jar, the candle
    rect(hx - 20, hy - 38, 6, 4, '#8a6a4a'); rect(hx - 19, hy - 39, 4, 1, '#a8825a'); px(hx - 14, hy - 37, '#8a6a4a'); px(hx - 21, hy - 37, '#8a6a4a');
    rect(hx - 11, hy - 36, 2, 2, '#d8cfb8'); rect(hx - 8, hy - 36, 2, 2, '#d8cfb8');
    rect(hx + 10, hy - 37, 4, 3, '#4f7a6a'); px(hx + 11, hy - 38, '#33544a');
    rect(hx + 18, hy - 38, 2, 4, '#ece4d2');
    // firewood stacked beside it, ends out
    for (const [x, y] of [[209, 99], [215, 99], [212, 94]]) {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const r = Math.hypot(dx, dy);
        if (r <= 3.2) px(x + dx, y + dy, r > 2.4 ? '#5a3a22' : r > 1.4 ? '#a87a4a' : r > 0.6 ? '#c89a62' : '#7a5234');
      }
    }
    }
    if (this.access.altar) {
    // the Talent Altar, at the front: a low table under a red runner, a bronze censer, candles
    const ax = ALTAR.x, ay = ALTAR.y;
    rect(ax - 13, ay - 9, 26, 3, '#6b4a2f'); rect(ax - 13, ay - 6, 26, 1, '#4a3220'); rect(ax - 11, ay - 5, 2, 6, '#4a3220'); rect(ax + 9, ay - 5, 2, 6, '#4a3220');
    rect(ax - 4, ay - 9, 8, 6, '#8f2416'); rect(ax - 4, ay - 9, 8, 1, '#c23b22'); px(ax - 4, ay - 3, '#c9a65a'); px(ax + 3, ay - 3, '#c9a65a');
    rect(ax - 5, ay - 15, 10, 6, '#8f7438'); rect(ax - 4, ay - 15, 8, 1, '#c9a65a'); rect(ax - 6, ay - 16, 12, 1, '#b8913c');
    rect(ax - 10, ay - 12, 2, 3, '#ece4d2'); rect(ax + 8, ay - 12, 2, 3, '#ece4d2');
    }
    if (this.access.mirror) {
    // the Mirror: a round bronze mirror on a stand
    rect(225, 70, 2, 16, '#6b4a2f'); rect(219, 85, 14, 2, '#4a3220');
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) {
      const d = Math.hypot(x, y);
      if (d <= 10) px(226 + x, 60 + y, d > 8.6 ? '#b8913c' : d > 7.8 ? '#8f7438' : (x - y) % 9 === 0 ? '#e8dcc4' : '#9a8670');
    }
    }
    // the Memory Urns: three jars of different sizes, lids sealed
    const urn = (cx, base, w, h, body, dark) => {
      for (let y = 0; y < h; y++) {
        const k = Math.sin((y + 1) / (h + 1) * Math.PI), half = Math.round(w / 2 * (0.55 + 0.45 * k));
        for (let x = -half; x <= half; x++) px(cx + x, base - y, x > half - 2 ? dark : body);
      }
      rect(cx - Math.round(w / 4), base - h - 1, Math.round(w / 2) + 1, 2, dark);
    };
    urn(28, 130, 10, 14, '#4f7a6a', '#33544a'); urn(42, 133, 12, 18, '#8a6a4a', '#5e4630'); urn(54, 129, 8, 10, '#6a6a8a', '#45455a');
    // the Resonance Stone
    for (let y = 0; y < 26; y++) {
      const half = Math.round(6 - Math.abs(y - 13) * 0.18 - (y < 4 ? (4 - y) : 0));
      for (let x = -half; x <= half; x++) px(226 + x, 134 - y, x > half - 2 ? '#4a4a52' : (x + y) % 5 === 0 ? '#6e6e78' : '#5c5c66');
    }
    // shelves on the clay, crowded the way a long stay crowds them
    const shelf = (x0, y, w) => { rect(x0, y, w, 2, '#6b4a2f'); rect(x0, y, w, 1, '#8a6240'); rect(x0 + 2, y + 2, 2, 3, '#4a3220'); rect(x0 + w - 4, y + 2, 2, 3, '#4a3220'); };
    shelf(58, 40, 30);
    for (const [x, h, col] of [[60, 7, '#7a2a1c'], [62, 6, '#3e5a4a'], [64, 8, '#a8822a'], [66, 7, '#4a4a6a']]) { rect(x, 40 - h, 2, h, col); rect(x, 42 - h, 2, 1, '#d8c48a'); }
    for (let i = 0; i < 6; i++) px(69 + (i >> 1), 39 - i, '#8f3420'); // one leaning on the rest
    rect(74, 35, 5, 5, '#4f7a6a'); rect(75, 34, 3, 1, '#33544a'); px(75, 36, '#8fc8b0'); // a little glazed jar
    rect(81, 37, 5, 3, '#a8582c'); rect(81, 37, 5, 1, '#c87040'); // a pot of something green
    for (const [x, y, col] of [[82, 35, '#5a9a4a'], [83, 34, '#6ab85a'], [84, 35, '#5a9a4a'], [83, 36, '#4a8a3a'], [81, 34, '#4a8a3a'], [85, 33, '#6ab85a'], [80, 35, '#5a9a4a']]) px(x, y, col);
    shelf(204, 44, 46);
    for (const [x, col] of [[206, '#6a4a8a'], [210, '#b87a2a'], [227, '#3e7a6a']]) { rect(x, 38, 3, 6, col); rect(x + 1, 36, 1, 2, col); px(x, 39, '#e8dcc4'); px(x + 1, 35, '#8a6a4a'); }
    rect(214, 41, 9, 3, '#d8cfb8'); rect(215, 38, 7, 3, '#c8bc9e'); px(214, 42, '#a8997e'); px(222, 39, '#a8997e'); // scrolls
    rect(233, 40, 2, 4, '#ece4d2'); // a candle
    rect(240, 40, 6, 4, '#a8582c'); rect(240, 40, 6, 1, '#c87040'); // and ivy spilling off the end
    for (let i = 0; i < 12; i++) { px(240 + (i % 3 === 0 ? 0 : 1), 44 + i, i % 2 ? '#4a8a3a' : '#6ab85a'); if (i < 8) px(246 - (i % 2), 44 + i, i % 2 ? '#6ab85a' : '#4a8a3a'); }
    // herbs drying from the shoulder of the jar
    for (const [x, len] of [[14, 6], [62, 3], [196, 4], [244, 7]]) {
      rect(x, 0, 1, len, '#3a2a1c'); rect(x - 1, len, 3, 1, '#b8913c');
      for (let i = 1; i <= 5; i++) for (let j = -Math.ceil(i / 2); j <= Math.ceil(i / 2); j++) px(x + j, len + i, (i + j) % 3 ? '#5a7a3a' : '#7a6a3a');
    }
    // a stack of books by the wall, a candle burning on top
    rect(3, 121, 12, 3, '#3e5a4a'); rect(4, 118, 11, 3, '#7a2a1c'); rect(3, 115, 12, 3, '#a8822a');
    for (const y of [116, 119, 122]) rect(13, y, 2, 1, '#e8dcc4');
    rect(8, 111, 2, 4, '#ece4d2');
    // candles on the floor, each on a brass dish
    for (const [x, fy] of FLOOR_CANDLES) { rect(x, fy + 2, 2, 4, '#ece4d2'); rect(x - 1, fy + 6, 4, 1, '#8f7438'); }
    // a cushion beside the rug
    rect(93, 128, 14, 5, '#3e6a6a'); rect(92, 129, 16, 3, '#3e6a6a'); rect(94, 128, 12, 1, '#5a8a8a'); rect(99, 130, 2, 1, '#c9a65a');
    for (const [x, y] of [[92, 128], [107, 128], [92, 132], [107, 132]]) px(x, y, '#c9a65a');
    // a potted plant in the corner
    for (const [dx, dy, len] of [[-1, -1, 9], [1, -1, 8], [0, -1, 11], [-1, 0, 6], [1, 0, 6], [-1, -2, 6], [1, -2, 7]]) {
      for (let i = 0; i < len; i++) rect(247 + dx * i, 127 + dy * i, 2, 2, i % 3 ? '#4a8a3a' : '#6ab85a');
    }
    rect(242, 128, 11, 10, '#a8582c'); rect(241, 127, 13, 2, '#c87040'); rect(250, 130, 2, 7, '#8a4420');
    // loose pages on the floor
    rect(64, 134, 5, 3, '#d8cfb8'); px(65, 135, '#a8997e'); px(67, 135, '#a8997e');
    rect(197, 113, 4, 3, '#d8cfb8'); px(198, 114, '#a8997e');

    // shadows where things stand on the floor, then the outlines, then the things themselves
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (const [x, y, w] of [[42, 134, 40], [226, 135, 16], [9, 124, 14], [100, 133, 18], [247, 138, 14], [212, 103, 14], ...FLOOR_CANDLES.map(([x, fy]) => [x + 1, fy + 7, 6]), ...(this.access.pavilion ? [[71, 85, 50]] : []), ...(this.access.altar ? [[ALTAR.x, ALTAR.y + 1, 30]] : []), ...(this.access.mirror ? [[226, 87, 16]] : [])]) g.fillRect(x - w / 2, y, w, 2);
    const img = L.getImageData(0, 0, W, H);
    if (img && img.data) {
      const a = img.data, solid = i => a[i * 4 + 3] > 0;
      g.fillStyle = '#140b07';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!solid(i) && ((x > 0 && solid(i - 1)) || (x < W - 1 && solid(i + 1)) || (y > 0 && solid(i - W)) || (y < H - 1 && solid(i + W)))) g.fillRect(x, y, 1, 1);
      }
    }
    g.drawImage(lc, 0, 0);
    return c;
  }

  // a station under a point of the screen
  hit(x, y) { return STATIONS.find(s => this.access[s.id] && x >= s.rect[0] && x <= s.rect[2] && y >= s.rect[1] && y <= s.rect[3]) || null; }

  // walk to a station, then do what it opens
  go(st, then) {
    const h = this.hero;
    h.tx = st.at[0]; h.ty = st.at[1]; h.then = then;
    if (Math.hypot(h.tx - h.x, h.ty - h.y) < 2) { h.then = null; then(); }
  }

  draw(dt, info) {
    const g = this.r.g, t = (this.t += dt);
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const flick = 0.75 + 0.15 * Math.sin(t * 7.3) + 0.1 * Math.sin(t * 13.1 + 1.7); // the fire breathes
    const lights = this.lights = []; // every flame adds a pool of light, laid over the room at the end
    g.drawImage(this.bg, 0, 0);
    this.drawSeals(g, info.seals);
    this.drawOldMarks(g, info);
    this.drawTallies(g, info.lives);
    this.drawPortal(g, t, info.sea);
    // the pavilion reconstructs what you have met: one memory at a time, flickering
    const met = info.met;
    if (this.access.pavilion && met.length) {
      const k = Math.floor(t / 3.2) % met.length, s = SPRITE_CACHE[spriteOf(met[k])];
      if (s) {
        const a = Math.min(1, (t % 3.2) / 0.5, (3.2 - t % 3.2) / 0.5) * (0.55 + 0.15 * Math.sin(t * 9));
        g.globalAlpha = a; g.drawImage(s.ghost, Math.round(71 - s.w / 2), 80 - s.h); g.globalAlpha = 1;
      }
    }
    if (this.access.pavilion) for (const [x, y] of [[55, 63], [87, 63]]) { // lanterns on the pavilion's posts
      const f = Math.floor(t * 8 + x) % 3;
      lights.push([x + 1, y + 3, 12, '255,140,60', 0.065]);
      g.fillStyle = '#c23b22'; g.fillRect(x - 1, y, 4, 6); g.fillStyle = f ? '#e8703a' : '#f09050'; g.fillRect(x, y + 1, 2, 4);
    }
    if (this.access.hearth) this.drawFire(g, t, flick);
    this.drawHangingLanterns(g, t);
    if (this.access.altar) {
    // incense from the altar, and its candles
    const ax = ALTAR.x, ay = ALTAR.y;
    if (Math.random() < dt * 6) this.smoke.push({ x: ax + (Math.random() - 0.5) * 3, y: ay - 17, life: 2.4 });
    for (const s of this.smoke) { s.life -= dt; s.y -= dt * 7; s.x += Math.sin(t * 2 + s.y * 0.3) * dt * 4; }
    this.smoke = this.smoke.filter(s => s.life > 0);
    for (const s of this.smoke) { g.globalAlpha = Math.min(0.55, s.life / 2.4); px(Math.round(s.x), Math.round(s.y), '#c9bfa8'); }
    g.globalAlpha = 1;
    for (const x of [ax - 9, ax + 9]) { px(x, ay - 13, Math.sin(t * 11 + x) > 0 ? '#ffd27a' : '#f0a040'); lights.push([x, ay - 13, 11, '255,180,90', 0.065]); }
    }
    // loose candles about the room
    CANDLE_FLAMES.forEach(([x, y], i) => {
      const f = Math.sin(t * 11 + i * 2.3) > 0;
      px(x, y, f ? '#ffd27a' : '#f0a040'); px(x, y + 1, '#fff2b0'); if (f) px(x, y - 1, '#e05a1c');
      lights.push([x, y + 1, 13, '255,175,85', 0.07 + 0.015 * Math.sin(t * 7 + i)]);
    });
    // the mirror catches a moving glint of firelight
    const gl = Math.floor((t * 12) % 40) - 10;
    if (this.access.mirror && gl > -8 && gl < 8) for (let i = -2; i <= 2; i++) px(226 + gl + i, 60 - i - gl, '#fff0d0');
    // runes on the stone pulse when another jar is near
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    g.fillStyle = `rgba(150,220,210,${0.3 + 0.5 * pulse})`;
    for (const [x, y] of [[224, 116], [227, 116], [225, 119], [226, 122], [224, 125], [228, 125], [226, 128]]) g.fillRect(x, y, 1, 2);
    // dust drifting in the warm light
    for (const m of this.motes) {
      m.y -= dt * m.s * 0.6; m.x += Math.sin(t + m.s) * dt * 2;
      if (m.y < 16) { m.y = 96; m.x = 40 + ((m.x * 7) % 176); }
      g.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + m.s); px(Math.round(m.x), Math.round(m.y), '#f0dcb0');
    }
    g.globalAlpha = 1;
    this.drawUrnGlow(g, t);
    this.drawHero(dt, info.skin, info.race);
    // pools of candle and lantern light, in rings the way pixel art holds them
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, rgb, a] of lights) this.glow(g, x, y, r, rgb, a);
    g.restore();
    if (this.access.hearth) {
    // firelight over everything near the hearth, breathing with the flames
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = g.createRadialGradient(HEARTH.x, HEARTH.y - 6, 4, HEARTH.x, HEARTH.y - 6, 90);
    fl.addColorStop(0, `rgba(255,150,60,${0.22 * flick})`); fl.addColorStop(0.5, `rgba(200,90,30,${0.08 * flick})`); fl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fl; g.fillRect(0, 0, W, H);
    g.restore();
    }
    // a soft dark edge, so the room closes in around the light
    const vg = g.createRadialGradient(128, 80, 70, 128, 80, 170);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,4,2,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // the station under the pointer: an arrow over it, and its name along the bottom
    const hv = this.hover;
    if (hv) {
      const bob = Math.round(Math.sin(t * 6)), ax2 = Math.round((hv.rect[0] + hv.rect[2]) / 2), ay2 = hv.id === 'lid' ? 22 : hv.rect[1] - 6 + bob;
      g.fillStyle = '#e8c34a';
      if (hv.id === 'lid') { g.fillRect(ax2 - 2, ay2, 5, 1); g.fillRect(ax2 - 1, ay2 - 1, 3, 1); g.fillRect(ax2, ay2 - 2, 1, 1); }
      else { g.fillRect(ax2 - 2, ay2, 5, 1); g.fillRect(ax2 - 1, ay2 + 1, 3, 1); g.fillRect(ax2, ay2 + 2, 1, 1); }
    }
    g.fillStyle = 'rgba(14,8,4,0.72)'; g.fillRect(0, H - 11, W, 11);
    const label = hv ? hv.name + (hv.id === 'lid' ? `  ${info.sealsBroken}/${SEALS_SHOWN} BROKEN` : '') : info.hint;
    this.r.text(label, W / 2, H - 9, hv ? '#e8c34a' : '#9a8f7c', 'center');
    this.r.text('LV ' + info.level, 4, 3, '#ece4d2');
    this.r.text(`${info.cycle ? 'NG+' + info.cycle + ' ' : ''}${info.sealsBroken}/${SEALS_SHOWN}`, W - 4, 3, '#e8c34a', 'right');
  }

  // the moon gate: a stone ring around still, moonlit water that ripples outward
  drawPortal(g, t, sea) {
    const cx = 128, cy = 56, rx = 18, ry = 24;
    const cols = sea ? ['#101b28', '#142331', '#192b39', '#203443', '#263b48', '#304650'] : ['#fff4dc', '#f0e2c4', '#d8d4cc', '#b8c4cc', '#93a8b8', '#7890a4'];
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = Math.hypot(x / rx, y / ry);
      if (d > 1.12) continue;
      if (d > 0.96) { g.fillStyle = d > 1.06 ? '#4a4038' : (x + y) % 2 ? '#867b69' : '#9a8f7c'; g.fillRect(cx + x, cy + y, 1, 1); continue; }
      // bright at the heart, cooler at the rim, with slow rings drifting outward
      const ripple = Math.sin(d * 14 - t * 1.6) * 0.5 + 0.5;
      let k = d * 5.2 + (ripple > 0.82 ? -1 : 0) + ((x + y) % 2 ? 0.3 : 0);
      g.fillStyle = cols[Math.max(0, Math.min(cols.length - 1, Math.floor(k)))];
      g.fillRect(cx + x, cy + y, 1, 1);
    }
    if (sea) { g.fillStyle = '#e6d9a7'; for (const [x, y] of [[-9,-10],[6,-13],[11,2],[-4,8],[3,15]]) g.fillRect(cx+x, cy+y, 1, 1); }
    g.fillStyle = `rgba(255,240,210,${0.07 + 0.03 * Math.sin(t * 1.6)})`; g.fillRect(cx - 24, cy + 24, 48, 8);
    g.fillStyle = '#4a4038'; g.fillRect(cx - 21, cy + 25, 43, 3); g.fillStyle = '#867b69'; g.fillRect(cx - 20, cy + 25, 41, 1);
  }

  // the fire in the hearth: flames that lick upward, embers that drift out
  drawFire(g, t, flick) {
    const hx = HEARTH.x, base = HEARTH.y - 5;
    const cols = ['#fff2b0', '#ffd060', '#ff9a30', '#e05a1c', '#8a2a10'];
    for (let x = -10; x <= 10; x++) {
      const h = Math.max(0, Math.round((9 - Math.abs(x) * 0.7) * (0.75 + 0.35 * Math.sin(t * 9 + x * 1.7) + 0.15 * Math.sin(t * 17 + x))));
      for (let y = 0; y < h; y++) {
        const k = Math.min(4, Math.floor((y / Math.max(1, h)) * 4 + Math.abs(x) * 0.18));
        g.fillStyle = cols[k]; g.fillRect(hx + x, base - y, 1, 1);
      }
    }
    g.fillStyle = `rgba(255,170,70,${0.18 * flick})`; g.fillRect(hx - 13, HEARTH.y - 16, 27, 16);
    if (Math.random() < 0.08) this.sparks.push({ x: hx + (Math.random() - 0.5) * 12, y: base - 6, vx: (Math.random() - 0.5) * 6, life: 1 + Math.random() });
    for (const s of this.sparks) { s.life -= 1 / 60; s.y -= 0.35; s.x += s.vx / 60; }
    this.sparks = this.sparks.filter(s => s.life > 0 && s.y > HEARTH.y - 22);
    for (const s of this.sparks) { g.fillStyle = s.life > 0.6 ? '#ffd060' : '#e05a1c'; g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    // the candle on the mantel
    g.fillStyle = Math.sin(t * 12) > 0 ? '#ffd27a' : '#f0a040'; g.fillRect(hx + 18, HEARTH.y - 40, 1, 2);
    this.lights.push([hx + 18, HEARTH.y - 39, 12, '255,175,85', 0.065]);
  }

  // a disc of light in three stepped rings (drawn additively)
  glow(g, x, y, r, rgb, a) {
    g.fillStyle = `rgba(${rgb},${a})`;
    for (const k of [1, 0.66, 0.38]) {
      const R = Math.round(r * k);
      for (let dy = -R; dy <= R; dy++) { const w = Math.round(Math.sqrt(R * R - dy * dy)); g.fillRect(x - w, y + dy, w * 2 + 1, 1); }
    }
  }

  // paper lanterns hanging from the shoulder of the jar, swaying a little
  drawHangingLanterns(g, t) {
    for (const [x, len, ph] of [[34, 16, 0], [222, 14, 1.3], [92, 10, 2.1]]) {
      const sway = Math.round(Math.sin(t * 0.9 + ph) * 1.2), y = 12 + len;
      g.fillStyle = '#2a1a12'; g.fillRect(x, 12, 1, len);
      this.lights.push([x + sway, y + 4, 15, '255,150,70', 0.065]);
      g.fillStyle = '#c23b22'; g.fillRect(x - 3 + sway, y, 7, 8); g.fillStyle = '#e8703a'; g.fillRect(x - 2 + sway, y + 1, 5, 6);
      g.fillStyle = Math.floor(t * 6 + ph * 3) % 3 ? '#ffb060' : '#ffd090'; g.fillRect(x - 1 + sway, y + 2, 3, 4);
      g.fillStyle = '#b8913c'; g.fillRect(x - 3 + sway, y - 1, 7, 1); g.fillRect(x - 3 + sway, y + 8, 7, 1); g.fillRect(x + sway, y + 9, 1, 2);
    }
  }

  // fifteen paper talismans hang round the lid; a broken one is a charred stub
  drawSeals(g, seals) {
    for (let i = 0; i < SEALS_SHOWN; i++) {
      const a = Math.PI * (0.06 + 0.88 * i / (SEALS_SHOWN - 1));
      const x = Math.round(LID.x - Math.cos(a) * (LID.rx + 1)), y = Math.round(LID.y + Math.sin(a) * (LID.ry + 1));
      if (seals[i]) { g.fillStyle = '#2a1d14'; g.fillRect(x - 1, y, 3, 2); if ((Math.floor(this.t * 3) + i) % 7 === 0) { g.fillStyle = '#e8703a'; g.fillRect(x, y + 1, 1, 1); } continue; }
      const sway = Math.round(Math.sin(this.t * 1.3 + i) * 0.6);
      g.fillStyle = '#e8d48a'; g.fillRect(x - 1 + sway, y, 3, 9);
      g.fillStyle = '#c23b22'; g.fillRect(x + sway, y + 2, 1, 1); g.fillRect(x - 1 + sway, y + 4, 3, 1); g.fillRect(x + sway, y + 6, 1, 2);
    }
  }

  // the tally marks: one for every thousand completed lives, in fives (four strokes and a slash)
  drawTallies(g, lives) {
    const marks = Math.min(120, Math.floor(lives / 1000));
    g.fillStyle = '#c9b48a';
    for (let i = 0; i < marks; i++) {
      const grp = Math.floor(i / 5), inGrp = i % 5, row = Math.floor(grp / 4), col = grp % 4;
      if (row > 5) break;
      const x = 8 + col * 9, y = 32 + row * 8;
      if (inGrp < 4) g.fillRect(x + inGrp * 2, y, 1, 6);
      else for (let k = 0; k < 7; k++) g.fillRect(x - 1 + k, y + 5 - Math.floor(k * 0.8), 1, 1);
    }
  }

  // What the older tallies turn out to be, once he remembers: each group crossed out, 蛊 carved beside them; and later
  // one group that was never crossed out, with her name under it.
  drawOldMarks(g, info) {
    if (!info.crossed) return;
    const her = info.yunxi ? 13 : -1;
    for (let grp = 0; grp < 14; grp++) {
      const x = 7 + (grp % 4) * 9 + (grp % 3), y = 31 + Math.floor(grp / 4) * 8 + (grp % 2);
      if (grp === her) { g.fillStyle = `rgba(232,196,120,${0.35 + 0.15 * Math.sin(this.t * 1.5)})`; for (let k = 0; k < 4; k++) g.fillRect(x + k * 2, y, 1, 6); continue; }
      g.fillStyle = '#5a1e14';
      for (let k = 0; k < 9; k++) g.fillRect(x - 1 + k, y + 2 + (k > 4 ? 1 : 0), 1, 1);
    }
    g.font = '10px serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillStyle = '#1a0f08'; g.fillText('蛊', 33, 61); g.fillStyle = '#a8825a'; g.fillText('蛊', 32, 60); // carved: a shadow, then the cut
    if (info.yunxi) { g.fillStyle = 'rgba(232,196,120,0.75)'; g.font = '8px serif'; g.fillText('云汐', 22, 74); }
  }

  drawUrnGlow(g, t) {
    for (const [x, y, ph] of [[28, 115, 0], [42, 114, 1.7], [54, 118, 3.1]]) {
      g.fillStyle = `rgba(232,216,176,${0.15 + 0.15 * Math.sin(t * 1.5 + ph)})`; g.fillRect(x - 1, y - 1, 3, 1);
    }
  }

  drawHero(dt, skin, race) {
    const h = this.hero, dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy), speed = 70;
    let walking = false;
    if (d > 0.5) {
      const step = Math.min(d, speed * dt);
      h.x += dx / d * step; h.y += dy / d * step; walking = true; h.walkT += dt;
      if (Math.abs(dx) > 0.5) h.flip = dx < 0;
      if (d - step <= 0.5 && h.then) { const f = h.then; h.then = null; f(); }
    }
    const pose = walking && Math.floor(h.walkT * 8) % 2 ? 'hero_walk' : 'hero';
    const s = SPRITE_CACHE[skinSprite(pose, skin)], g = this.r.g;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(h.x - 4), Math.round(h.y), 9, 1);
    g.drawImage(h.flip ? s.f : s.n, Math.round(h.x - s.w / 2), Math.round(h.y - s.h + 1));
    drawRaceFeatures(g, race, h.x, h.y, 1, h.flip);
  }
}
