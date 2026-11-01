// The worlds' arenas: a pixel scene behind the stage for every world of the jar (and the two finales), a floor of
// its own, and a little life that moves while the fight goes on. The stage itself never changes shape: the ring is
// the same circle the simulation uses. Loaded after render.js.

// ---------- a small pixel toolkit (everything lands on whole pixels: no smoothing, no blurred edges) ----------
function pixelKit(g) {
  const k = {
    px: (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    rect: (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    // a sky in bands, dithered where two bands meet
    sky: (y0, y1, cols) => {
      for (let y = y0; y < y1; y++) {
        const u = (y - y0) / (y1 - y0) * (cols.length - 1), i = Math.floor(u), f = u - i;
        for (let x = 0; x < W; x++) k.px(x, y, f > ((x * 7 + y * 3) % 4) / 4 + 0.12 ? cols[Math.min(cols.length - 1, i + 1)] : cols[i]);
      }
    },
    disc: (cx, cy, r, c, ry = r) => { for (let y = -ry; y <= ry; y++) for (let x = -r; x <= r; x++) if ((x / r) ** 2 + (y / ry) ** 2 <= 1) k.px(cx + x, cy + y, c); },
    ring: (cx, cy, r, c, gap) => { for (let a = 0; a < 6.283; a += 0.5 / r) if (!gap || !gap(a)) k.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c); },
    line: (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) k.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
    // a filled polygon by scanlines (crisp edges)
    poly: (pts, c) => {
      const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) k.rect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]), 1, c);
      }
    },
    // a ridge of hills or mountains from a seeded walk
    ridge: (rand, base, rough, step, c, bottom = H) => {
      const pts = [[0, bottom]];
      let y = base;
      for (let x = 0; x <= W + step; x += step) { y = Math.max(base - rough, Math.min(base + rough * 0.4, y + (rand() - 0.55) * rough)); pts.push([x, y]); }
      pts.push([W, bottom]); k.poly(pts, c);
    },
    stars: (rand, n, y0, y1, cols) => { for (let i = 0; i < n; i++) k.px(rand() * W, y0 + rand() * (y1 - y0), cols[Math.floor(rand() * cols.length)]); },
  };
  return k;
}

// ---------- each world: its sky and horizon, its floor, and what moves ----------
// ground: the land below the horizon, dithered; floor: [base, dark, light, rim, side]; pattern(x, y, rr, a) returns 0 (base), 1 (dark), 2 (light) or 3 (rim)
const WORLD_SCENES = {
  frontier: {
    ground: ['#6a3e2a', '#5a3222'],
    floor: ['#a8744c', '#86583a', '#c99566', '#e0b070', '#5c3a26'],
    pattern: (x, y) => (Math.floor((y + 80) / 6) % 2 === 0 && (x + 300) % 23 === 0) || (y + 80) % 6 === 0 ? 1 : (x * 13 + y * 7 + 999) % 61 === 0 ? 2 : 0,
    bake(k, rand) { // a red mesa sunset, a water tower and the saloon at the end of the road
      k.sky(0, 70, ['#3a1e3e', '#7a2e3a', '#c8503a', '#e8843e', '#f4b860']);
      k.disc(196, 46, 14, '#ffd27a'); k.disc(196, 46, 10, '#fff0b0');
      k.ridge(rand, 52, 6, 16, '#7a3a34', 90);
      for (const [x, w, h] of [[10, 34, 22], [52, 22, 14], [176, 46, 18], [222, 30, 26]]) { k.rect(x, 62 - h, w, h + 30, '#5a2a2a'); k.rect(x, 62 - h, w, 2, '#9a4a3a'); for (let i = 4; i < h; i += 5) k.rect(x, 62 - h + i, w, 1, '#6a3230'); }
      k.ridge(rand, 66, 3, 10, '#3e2224', 100);
      // the water tower
      k.rect(18, 30, 16, 10, '#6a4630'); k.rect(17, 29, 18, 2, '#4a3020'); for (let i = 0; i < 16; i += 3) k.rect(18 + i, 30, 1, 10, '#5a3a26');
      for (const x of [19, 32]) k.line(x, 40, x - 2 + (x > 25 ? 4 : 0), 66, '#3a2418');
      k.line(19, 48, 33, 58, '#3a2418'); k.line(33, 48, 19, 58, '#3a2418');
      // the saloon
      k.rect(214, 40, 38, 28, '#4a2c1e'); k.rect(212, 34, 42, 7, '#5e3a26'); k.rect(222, 36, 22, 3, '#c8a050');
      for (const x of [218, 232, 244]) k.rect(x, 48, 5, 6, '#e8a050'); k.rect(229, 56, 7, 12, '#2a1810');
      // a cactus, close
      k.rect(4, 74, 3, 20, '#3e5a2e'); k.rect(1, 80, 3, 2, '#3e5a2e'); k.rect(1, 76, 2, 5, '#3e5a2e'); k.rect(7, 78, 3, 2, '#3e5a2e'); k.rect(9, 74, 2, 5, '#3e5a2e');
    },
    ambient(k, t, rand) { // two vultures wheeling, dust blowing across
      for (const [cx, ph] of [[120, 0], [150, 2.4]]) { const x = cx + Math.cos(t * 0.4 + ph) * 24, y = 18 + Math.sin(t * 0.4 + ph) * 6, f = Math.floor(t * 4 + ph) % 2; k.px(x, y, '#1a0e10'); k.px(x - 1, y - f, '#1a0e10'); k.px(x + 1, y - f, '#1a0e10'); k.px(x - 2, y - 1 + f, '#1a0e10'); k.px(x + 2, y - 1 + f, '#1a0e10'); }
      for (let i = 0; i < 10; i++) { const x = ((t * (30 + i * 3) + i * 47) % (W + 20)) - 10, y = 60 + (i * 13) % 30; k.px(x, y, 'rgba(240,200,140,0.5)'); }
    },
  },
  temple: {
    ground: ['#4a3028', '#3e2820'],
    floor: ['#a89a84', '#8a7c68', '#c8baa0', '#b45d3c', '#5a4e42'],
    pattern: (x, y) => (x + 120) % 15 === 0 || (y + 70) % 8 === 0 ? 1 : (x * 7 + y * 5 + 500) % 47 === 0 ? 2 : 0,
    bake(k, rand) { // red dust over layered mountains, the temple on its cliff, the great bell
      k.sky(0, 66, ['#4a2a2a', '#8a4a3a', '#c87a52', '#e0a874']);
      k.ridge(rand, 40, 10, 14, '#9a6a56', 80); k.ridge(rand, 50, 8, 12, '#7a5044', 85); k.ridge(rand, 60, 5, 10, '#4a3028', 100);
      // the pagoda, tier on tier
      k.rect(16, 36, 4, 30, '#3a2420');
      for (const [y, w] of [[60, 40], [50, 32], [41, 24], [33, 16]]) { k.rect(28 - w / 2 + 6, y, w - 12, 8, '#5a2a22'); k.poly([[28 - w / 2, y], [28 + w / 2, y], [28 + w / 2 - 3, y - 3], [28 - w / 2 + 3, y - 3]], '#2a1e1e'); k.px(28 - w / 2, y - 1, '#d8a050'); k.px(28 + w / 2, y - 1, '#d8a050'); k.rect(26, y + 2, 4, 4, '#e8a050'); }
      k.rect(27, 26, 2, 7, '#d8a050');
      // the bell pavilion
      k.rect(206, 40, 3, 26, '#6a2a1e'); k.rect(240, 40, 3, 26, '#6a2a1e'); k.poly([[200, 40], [249, 40], [244, 34], [205, 34]], '#2a1e1e'); k.rect(203, 33, 43, 1, '#d8a050');
      k.rect(218, 42, 13, 14, '#8a6a30'); k.rect(219, 42, 11, 2, '#c8a050'); k.rect(216, 55, 17, 2, '#6a4a20'); k.rect(223, 40, 3, 2, '#4a3418');
      // pines
      for (const x of [56, 64, 186, 194]) { k.rect(x, 52, 2, 14, '#2a1a14'); for (let i = 0; i < 4; i++) k.rect(x - 4 + i, 44 + i * 3, 10 - i * 2, 3, '#2e3a26'); }
    },
    ambient(k, t) { // incense rising from the pagoda; red dust drifting
      for (let i = 0; i < 12; i++) { const u = (t * 0.25 + i / 12) % 1, x = 28 + Math.sin(u * 9 + i) * 3, y = 26 - u * 24; k.px(x, y, `rgba(220,200,180,${0.5 * (1 - u)})`); }
      for (let i = 0; i < 14; i++) { const x = ((t * 12 + i * 37) % W), y = 30 + ((i * 17 + t * 4) % 40); k.px(x, y, 'rgba(200,90,60,0.45)'); }
    },
  },
  night: {
    ground: ['#14131c', '#1c1a26'],
    floor: ['#55545e', '#3e3d48', '#7a7886', '#95394f', '#24232c'],
    pattern: (x, y, rr) => Math.abs(rr - 48) < 0.8 || Math.abs(rr - 24) < 0.8 ? 3 : (x * 3 + y * 11 + 900) % 37 === 0 ? 1 : (Math.floor((x + 200) / 10) + Math.floor((y + 100) / 6)) % 2 ? 0 : 1,
    bake(k, rand) { // the moon over a gothic castle, graves and a dead tree
      k.sky(0, 70, ['#08080f', '#0e1020', '#1a1a32', '#2a2240']);
      k.stars(rand, 50, 2, 50, ['#8a8aa8', '#c8c8e0', '#5a5a78']);
      k.disc(200, 30, 15, '#c8c0b0'); k.disc(200, 30, 13, '#e8e0d0');
      for (const [x, y, r] of [[195, 26, 3], [204, 34, 2], [206, 24, 2]]) k.disc(x, y, r, '#c8c0b0');
      k.ridge(rand, 58, 6, 12, '#16141e', 100);
      // the castle
      for (const [x, w, h] of [[184, 14, 38], [198, 26, 26], [224, 12, 44], [236, 18, 30]]) { k.rect(x, 66 - h, w, h, '#0e0c14'); k.poly([[x - 2, 66 - h], [x + w / 2, 54 - h], [x + w + 2, 66 - h]], '#0e0c14'); }
      for (const [x, y] of [[189, 38], [228, 30], [242, 44], [206, 48], [214, 48]]) k.rect(x, y, 2, 3, '#e8b860');
      // graves and a dead tree
      for (const [x, h] of [[10, 9], [24, 7], [38, 10], [52, 6]]) { k.rect(x, 66 - h, 5, h, '#2a2834'); k.rect(x + 2, 62 - h, 1, 4, '#2a2834'); k.rect(x + 1, 63 - h, 3, 1, '#2a2834'); }
      k.line(66, 66, 70, 34, '#0e0c10'); k.line(69, 44, 60, 36, '#0e0c10'); k.line(70, 38, 78, 30, '#0e0c10'); k.line(68, 50, 76, 46, '#0e0c10');
    },
    ambient(k, t) { // bats across the moon; windows flicker; ground fog
      for (let i = 0; i < 3; i++) { const x = ((t * 22 + i * 90) % (W + 30)) - 15, y = 26 + Math.sin(t * 2 + i) * 8, f = Math.floor(t * 8 + i) % 2; k.px(x, y, '#000'); k.px(x - 1, y - f, '#000'); k.px(x + 1, y - f, '#000'); k.px(x - 2, y - 1 + 2 * f, '#000'); k.px(x + 2, y - 1 + 2 * f, '#000'); }
      if (Math.floor(t * 3) % 7 === 0) k.rect(228, 30, 2, 3, '#7a5a30');
      for (let i = 0; i < 6; i++) { const x = ((t * 5 + i * 50) % (W + 60)) - 30; k.rect(x, 62 + (i % 3), 26, 1, 'rgba(140,140,170,0.18)'); }
    },
  },
  peaks: {
    ground: ['#c8d4dc', '#aebcc8'],
    floor: ['#9faeb2', '#808e94', '#d8e2e0', '#a7d4e2', '#495e69'],
    pattern: (x, y) => Math.abs(y - x * 0.22) < 0.6 || Math.abs(y + x * 0.17 - 8) < 0.6 ? 2 : (x * 5 + y * 9 + 700) % 53 === 0 ? 1 : 0,
    bake(k, rand) { // snow peaks above a sea of cloud, a sword on every summit
      k.sky(0, 64, ['#1e2e48', '#34506e', '#6a8aa8', '#b8cad6']);
      for (const [base, rough, c] of [[30, 16, '#8aa0b6'], [42, 14, '#5e7690'], [54, 8, '#3e5470']]) {
        const pts = [[0, 80]]; let x = 0;
        while (x <= W) { pts.push([x, base + rand() * 6]); x += 10 + rand() * 10; pts.push([x, base - rough * (0.5 + rand() * 0.5)]); x += 10 + rand() * 10; }
        pts.push([W, 80]); k.poly(pts, c);
      }
      for (const [x, y] of [[40, 12], [120, 16], [210, 10]]) { k.poly([[x - 6, y + 6], [x, y], [x + 6, y + 6]], '#eef4f6'); k.line(x, y, x, y - 10, '#d8e2ec'); k.rect(x - 2, y - 4, 5, 1, '#c8a050'); }
      for (let i = 0; i < 26; i++) k.disc(rand() * W, 60 + rand() * 6, 5 + rand() * 8, '#dce6ee', 2 + rand() * 2);
    },
    ambient(k, t) { // cloud banks sliding, snow falling, now and then a flying sword crossing the sky
      for (let i = 0; i < 5; i++) { const x = ((t * 3 + i * 60) % (W + 80)) - 40; k.rect(x, 56 + i % 2 * 3, 30, 2, 'rgba(240,246,250,0.55)'); }
      for (let i = 0; i < 16; i++) { const x = (i * 31 + Math.sin(t + i) * 6 + t * 4) % W, y = (t * 10 + i * 23) % 70; k.px(x, y, 'rgba(255,255,255,0.7)'); }
      const s = (t * 0.6) % 6; if (s < 1) { const x = s * 300 - 20, y = 20 + s * 10; k.line(x, y, x + 6, y - 1, '#e8f4ff'); k.px(x - 3, y + 1, '#9fd8ff'); }
    },
  },
  abyss: {
    ground: ['#1a0a10', '#2c0e12'],
    floor: ['#503845', '#3a2834', '#7a4a4a', '#ec7740', '#251b2d'],
    pattern: (x, y) => Math.abs(Math.sin(x * 0.12 + y * 0.29)) < 0.045 ? 3 : (x * 9 + y * 5 + 400) % 41 === 0 ? 2 : 0,
    bake(k, rand) { // pits beneath pits: black spires, lava falls, glow from below
      k.sky(0, 72, ['#0a0408', '#1e0a14', '#40121a', '#7a2018']);
      for (let i = 0; i < 9; i++) { const x = i * 31 + rand() * 10, h = 24 + rand() * 30; k.poly([[x - 7, 72], [x, 72 - h], [x + 3, 72 - h + 6], [x + 8, 72]], '#120810'); }
      for (const [x, y0] of [[20, 30], [232, 24]]) { for (let y = y0; y < 72; y++) k.rect(x + Math.round(Math.sin(y * 0.3) * 1.5), y, 3, 1, y % 4 ? '#e85a24' : '#ffb040'); k.disc(x + 1, 72, 6, '#ff7a30', 2); }
      k.ridge(rand, 66, 4, 8, '#1a0a10', 100);
    },
    ambient(k, t) { // embers rising; the lava glow breathes
      for (let i = 0; i < 18; i++) { const u = (t * 0.2 + i / 18) % 1, x = (i * 53 + Math.sin(t + i) * 8) % W, y = 100 - u * 100; k.px(x, y, `rgba(255,${120 + i * 6},60,${1 - u})`); }
      k.rect(0, 64, W, 2, `rgba(255,90,40,${0.12 + 0.08 * Math.sin(t * 2)})`);
    },
  },
  isles: {
    ground: ['#3a2e54', '#4a3a62'],
    floor: ['#947d80', '#7a6468', '#c8a4a8', '#d8869d', '#514452'],
    pattern: (x, y) => (x * 7 + y * 11 + 3000) % 83 < 2 ? 2 : (Math.floor((x + 200) / 18) + Math.floor((y + 100) / 9)) % 2 && (x + 200) % 18 === 0 ? 1 : 0,
    bake(k, rand) { // a twilight sea, a torii standing in the water, a cherry tree in bloom
      k.sky(0, 54, ['#2e2448', '#5a3e6a', '#a86a88', '#f0a8a0']);
      k.disc(70, 40, 10, '#ffe0c8'); k.disc(70, 40, 8, '#fff0e0');
      for (let y = 54; y < 76; y++) for (let x = 0; x < W; x++) k.px(x, y, (x + y * 3) % 9 === 0 ? '#c88aa0' : y < 60 ? '#6a4a78' : '#4a3a62');
      for (const [x, w] of [[140, 30], [176, 18], [104, 14]]) k.poly([[x, 56], [x + w / 2, 48], [x + w, 56]], '#2a2040');
      // the torii
      k.rect(26, 34, 3, 32, '#b02a24'); k.rect(48, 34, 3, 32, '#b02a24'); k.rect(20, 32, 37, 3, '#b02a24'); k.rect(18, 31, 41, 1, '#2a1418'); k.rect(24, 39, 29, 2, '#b02a24');
      for (let i = 0; i < 4; i++) k.rect(26 + i * 8, 66 + i % 2, 6, 1, '#d88aa0');
      // the cherry tree
      k.rect(222, 40, 4, 34, '#3a2028'); k.line(224, 50, 236, 40, '#3a2028'); k.line(222, 46, 210, 38, '#3a2028');
      for (let i = 0; i < 70; i++) { const a = rand() * 6.28, r = rand() * 20; k.px(222 + Math.cos(a) * r * 1.3, 34 + Math.sin(a) * r * 0.7, rand() < 0.5 ? '#ffb8cc' : '#f08aa8'); }
    },
    ambient(k, t) { // petals falling; light on the water
      for (let i = 0; i < 18; i++) { const u = (t * 0.15 + i / 18) % 1, x = (220 - u * 160 + Math.sin(t * 2 + i) * 6 + i * 29) % W, y = 20 + u * 90; k.px(x, y, i % 2 ? '#ffc8d8' : '#f8a0b8'); }
      for (let i = 0; i < 8; i++) { const x = (i * 37 + t * 6) % W; k.rect(x, 58 + (i * 5) % 14, 4, 1, 'rgba(255,220,230,0.35)'); }
    },
  },
  heavens: {
    ground: ['#efe6d2', '#e2d6bc'],
    floor: ['#e4d5b4', '#c8b48e', '#fff2d6', '#d1a448', '#968a7b'],
    pattern: (x, y, rr) => Math.abs(rr - 48) < 0.7 || Math.abs(rr - 25) < 0.7 ? 3 : (x * 5 + y * 3 + 200) % 43 === 0 ? 2 : 0,
    bake(k, rand) { // a sea of cloud under a gold sky, the celestial palace floating on it
      k.sky(0, 70, ['#5a7aa8', '#8aa8c8', '#d8c89a', '#f4e0b0']);
      for (let i = 0; i < 40; i++) k.disc(rand() * W, 58 + rand() * 12, 6 + rand() * 12, rand() < 0.5 ? '#f8f0e0' : '#e8dcc4', 3 + rand() * 3);
      // the palace
      for (const [x, y, w] of [[178, 46, 58], [186, 36, 42], [196, 26, 22]]) { k.rect(x + 3, y, w - 6, 10, '#c83a2a'); k.poly([[x - 4, y], [x + w + 4, y], [x + w - 2, y - 4], [x + 2, y - 4]], '#e8b040'); for (let i = x + 6; i < x + w - 6; i += 6) k.rect(i, y + 2, 2, 8, '#8a2a1e'); }
      k.rect(205, 18, 4, 4, '#ffd84a');
      // jade pillars and a stair of cloud
      for (const x of [20, 40]) { k.rect(x, 30, 5, 40, '#4a9a6a'); k.rect(x - 1, 28, 7, 2, '#e8b040'); }
      for (let i = 0; i < 8; i++) k.rect(56 + i * 6, 64 - i * 4, 10, 2, '#fff8e8');
    },
    ambient(k, t) { // cloud bands drifting, golden motes, a crane crossing
      for (let i = 0; i < 6; i++) { const x = ((t * (2 + i % 3)) + i * 50) % (W + 60) - 30; k.rect(x, 50 + i * 3, 24, 2, 'rgba(255,250,235,0.6)'); }
      for (let i = 0; i < 12; i++) k.px((i * 41 + t * 8) % W, 14 + (i * 7 + Math.sin(t + i) * 4) % 40, 'rgba(255,220,120,0.8)');
      const x = (t * 14) % (W + 40) - 20, y = 22 + Math.sin(t) * 2, f = Math.floor(t * 3) % 2; k.rect(x - 3, y - f, 2, 1, '#fff'); k.rect(x + 2, y - f, 2, 1, '#fff'); k.rect(x, y, 2, 1, '#fff'); k.px(x + 2, y + 1, '#c83a2a');
    },
  },
  timestream: {
    ground: ['#0a141e', '#10202c'],
    floor: ['#355563', '#24404c', '#5a8a90', '#75d8d4', '#1b2b38'],
    pattern: (x, y, rr, a) => Math.abs(rr - 52) < 0.7 || Math.abs(rr - 25) < 0.7 || (rr > 45 && Math.abs(Math.sin(a * 12)) < 0.03) ? 3 : (x * 3 + y * 7 + 100) % 59 === 0 ? 2 : 0,
    bake(k, rand) { // a river of light running through the dark, broken clock faces adrift in it
      k.sky(0, 76, ['#04080f', '#08121e', '#0e1e2e', '#14283a']);
      k.stars(rand, 30, 2, 60, ['#3a6a7a', '#6aa8b0']);
      for (let x = 0; x < W; x++) { const y = 20 + x * 0.18 + Math.sin(x * 0.05) * 6; k.rect(x, y, 1, 7, '#123848'); k.px(x, y + 3, '#2a7a88'); }
      for (const [x, y, r] of [[34, 38, 16], [210, 30, 13], [128, 18, 8]]) { k.disc(x, y, r, '#0c1a26'); k.ring(x, y, r, '#8ad8d0', a => a > 1.0 && a < 1.6); k.ring(x, y, r - 2, '#3a7a80'); for (let i = 0; i < 12; i++) { const q = i / 12 * 6.283; k.px(x + Math.cos(q) * (r - 4), y + Math.sin(q) * (r - 4), '#c8f4e8'); } }
      k.ridge(rand, 68, 4, 14, '#0a141e', 100);
    },
    ambient(k, t) { // light flowing down the river; clock hands turning (one backwards)
      for (let i = 0; i < 20; i++) { const x = (t * 26 + i * 13) % W, y = 23 + x * 0.18 + Math.sin(x * 0.05) * 6; k.px(x, y, i % 3 ? '#8ad8d0' : '#ffffff'); }
      for (const [x, y, r, s] of [[34, 38, 16, 1], [210, 30, 13, -1.6], [128, 18, 8, 3]]) { const q = t * s; k.line(x, y, x + Math.cos(q) * (r - 5), y + Math.sin(q) * (r - 5), '#e8fff8'); k.line(x, y, x + Math.cos(q / 12) * (r - 8), y + Math.sin(q / 12) * (r - 8), '#8ad8d0'); }
    },
  },
  cursed: {
    ground: ['#0c0816', '#160e22'],
    floor: ['#4a414c', '#352e38', '#6e6276', '#a870d3', '#24212e'],
    pattern: (x, y, rr) => Math.abs(x - y * 1.5) < 1 || Math.abs(x + y * 1.5) < 1 || Math.abs(rr - 45) < 0.7 ? 3 : (x * 7 + y * 3 + 600) % 37 === 0 ? 2 : 0,
    bake(k, rand) { // a city under a domain: a dark dome over the skyline, a red moon, talisman seals hung across the gap
      k.sky(0, 70, ['#0a0614', '#160c28', '#2a1840', '#3a2050']);
      k.disc(54, 22, 9, '#a8243a'); k.disc(54, 22, 7, '#d8384a');
      for (let a = 3.3; a < 6.1; a += 0.01) k.px(128 + Math.cos(a) * 140, 92 + Math.sin(a) * 86, '#6a4aa0');
      for (let i = 0; i < 22; i++) { const x = i * 12, h = 16 + rand() * 34; k.rect(x, 70 - h, 11, h, '#0c0816'); for (let j = 0; j < h - 6; j += 5) for (let q = 2; q < 9; q += 3) if (rand() < 0.4) k.px(x + q, 74 - h + j, '#8a6ab8'); }
      for (const x of [16, 228]) { k.rect(x, 26, 11, 22, '#d8ccb8'); k.rect(x + 5, 29, 1, 14, '#8a1a2a'); k.rect(x + 2, 32, 7, 1, '#8a1a2a'); k.rect(x + 3, 38, 5, 1, '#8a1a2a'); k.line(x + 5, 26, x + 5, 12, '#4a3a5a'); }
    },
    ambient(k, t) { // curses drifting like smoke; the dome shimmers; windows go dark
      for (let i = 0; i < 10; i++) { const u = (t * 0.1 + i / 10) % 1, x = (i * 29 + Math.sin(t + i) * 10) % W, y = 70 - u * 60; k.px(x, y, `rgba(168,112,211,${0.7 * (1 - u)})`); k.px(x + 1, y - 1, `rgba(90,40,120,${0.6 * (1 - u)})`); }
      const a = 3.3 + ((t * 0.5) % 2.8); k.rect(128 + Math.cos(a) * 140, 92 + Math.sin(a) * 86, 2, 2, '#c8a0ff');
    },
  },
  blacksea: {
    ground: ['#0c1214', '#1e2a2c'],
    floor: ['#535c5b', '#3a4242', '#7a8680', '#dce6d4', '#202d30'],
    pattern: (x, y) => Math.sin(x * 0.18 + y * 0.45) > 0.96 ? 2 : (x * 11 + y * 3 + 300) % 47 === 0 ? 1 : 0,
    bake(k, rand) { // a narrow shore, black water to every horizon, and far lights that are other worlds; the scholar's ink near
      k.sky(0, 50, ['#0e1012', '#1a1e20', '#2e3432', '#4a524e']);
      k.stars(rand, 18, 2, 40, ['#5a625e']);
      for (let y = 50; y < H; y++) for (let x = 0; x < W; x++) k.px(x, y, (x * 7 + y * 13) % 23 === 0 ? '#1e2a2c' : '#0c1214');
      for (const [x, y, r] of [[30, 46, 2], [86, 42, 1], [150, 48, 3], [214, 44, 2], [244, 49, 1]]) { k.disc(x, y, r, '#e8e4c8'); for (let i = 1; i < 9; i += 2) k.rect(x - 1, y + 3 + i, 3 - (i > 4 ? 1 : 0), 1, 'rgba(232,228,200,0.35)'); }
      // ink brushed across the near water
      for (const [x0, y0, len] of [[4, 64, 40], [212, 58, 40]]) for (let i = 0; i < len; i++) k.rect(x0 + i, y0 + Math.sin(i * 0.2) * 2, 1, 3 - Math.abs(i - len / 2) / (len / 2) * 2, '#000');
    },
    ambient(k, t) { // the water moves; the far lights bob; a ferry lamp crawls along the horizon
      for (let i = 0; i < 24; i++) { const x = (i * 37 + t * (3 + i % 3)) % W, y = 54 + (i * 11) % 80; k.rect(x, y, 3, 1, 'rgba(120,140,136,0.35)'); }
      const fx = (t * 4) % (W + 20) - 10; k.px(fx, 49, '#ffd890'); k.px(fx, 51, 'rgba(255,216,144,0.4)');
    },
  },
  pallid: {
    ground: ['#d8c890', '#c8b878'],
    floor: ['#a89e78', '#8a8060', '#bcb08a', '#efcf63', '#5c5545'],
    pattern: (x, y) => (Math.floor((x + 120) / 12) + Math.floor((y + 70) / 7)) % 2 === 0 ? 2 : (x * 3 + y * 7 + 30) % 61 === 0 ? 1 : 0,
    bake(k, rand) { // twin suns over a lake of cloud; the towers of the court; black stars in a yellow sky
      k.sky(0, 60, ['#2a2418', '#5a4a24', '#a88a3a', '#e8d088']);
      for (const [x, y, r] of [[44, 22, 9], [206, 16, 6]]) { k.disc(x, y, r, '#f8eab8'); k.disc(x, y, r - 2, '#fff8e0'); }
      for (let i = 0; i < 8; i++) k.px(rand() * W, 6 + rand() * 30, '#0a0806');
      for (let i = 0; i < 30; i++) k.disc(rand() * W, 60 + rand() * 10, 8 + rand() * 12, rand() < 0.5 ? '#e8dcb0' : '#d8c890', 2 + rand() * 2);
      // the towers of the court
      for (const [x, w, h] of [[150, 8, 34], [162, 6, 44], [172, 10, 28], [186, 5, 38]]) { k.rect(x, 62 - h, w, h, '#3a3020'); k.poly([[x - 1, 62 - h], [x + w / 2, 50 - h], [x + w + 1, 62 - h]], '#2a2216'); k.px(x + w / 2, 54 - h, '#efcf63'); }
      // banners with the sign
      for (const x of [24, 232]) { k.line(x, 22, x, 66, '#2a2216'); k.rect(x + 1, 24, 10, 16, '#c8a028'); k.rect(x + 5, 27, 2, 10, '#1a140a'); k.rect(x + 3, 30, 6, 1, '#1a140a'); k.px(x + 3, 35, '#1a140a'); k.px(x + 8, 35, '#1a140a'); }
    },
    ambient(k, t) { // the black stars pulse; the banners stir; the cloud-lake ripples
      for (let i = 0; i < 5; i++) { const x = (i * 53 + 20) % W, y = 8 + (i * 7) % 26, on = Math.sin(t * 2 + i) > 0.3; if (on) { k.px(x, y, '#000'); k.px(x - 1, y, 'rgba(0,0,0,0.5)'); k.px(x + 1, y, 'rgba(0,0,0,0.5)'); } }
      for (const x of [24, 232]) { const s = Math.round(Math.sin(t * 3 + x) * 1); k.rect(x + 11, 26 + s, 1, 12, '#c8a028'); }
      for (let i = 0; i < 6; i++) k.rect((i * 47 + t * 5) % W, 62 + i % 3 * 2, 10, 1, 'rgba(255,248,224,0.4)');
    },
  },
  bottom: {
    ground: ['#3a2618', '#2e1e12'],
    floor: ['#875b3d', '#6a4430', '#b08060', '#b79766', '#4b2e20'],
    pattern: (x, y, rr) => Math.abs(rr - 32) < 0.7 ? 3 : (x * 11 + y * 7 + 3000) % 67 === 0 ? 1 : (x * 5 + y * 13 + 20) % 89 === 0 ? 2 : 0,
    bake(k) { // the bottom of the jar: clay curving up on every side, tallies in many hands, one shaft of light from the lid
      k.sky(0, 80, ['#120a06', '#1e120a', '#2c1c12', '#3a2618']);
      k.poly([[0, 0], [30, 0], [62, 80], [0, 100]], '#2a1a10'); k.poly([[W, 0], [W - 30, 0], [W - 62, 80], [W, 100]], '#2a1a10');
      for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 6; gy++) { const x = 6 + gx * 9 + gy, y = 18 + gy * 9; for (let j = 0; j < 4; j++) k.rect(x + j * 2, y, 1, 6, gy % 2 ? '#7a5a40' : '#9a7a58'); k.line(x - 1, y + 6, x + 8, y, '#5a2a1e'); }
      for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 5; gy++) { const x = 212 + gx * 9 - gy, y = 22 + gy * 9; for (let j = 0; j < 4; j++) k.rect(x + j * 2, y, 1, 6, '#8a6a4a'); }
      k.poly([[110, 0], [146, 0], [168, 80], [88, 80]], 'rgba(255,230,180,0.07)');
      k.disc(128, 4, 18, '#3a2818', 4); k.disc(128, 4, 14, '#fff0c8', 2);
    },
    ambient(k, t) { // dust drifting down through the light
      for (let i = 0; i < 16; i++) { const u = (t * 0.06 + i / 16) % 1, x = 100 + (i * 23) % 56 + Math.sin(t + i) * 3, y = u * 80; k.px(x, y, `rgba(255,236,200,${0.6 * (1 - u)})`); }
    },
  },
  summit: {
    ground: ['#2a3a54', '#22304a'],
    floor: ['#b6c4c2', '#8a9a9a', '#eff6ef', '#deedf0', '#61737b'],
    pattern: (x, y) => Math.abs(y - x * 0.3) < 0.5 ? 3 : (x * 7 + y * 11 + 50) % 71 === 0 ? 2 : 0,
    bake(k, rand) { // above the clouds at night; the sky he split is still open
      k.sky(0, 70, ['#02040c', '#060c1e', '#101c38', '#24365a']);
      k.stars(rand, 80, 2, 64, ['#8a9ac8', '#e0e8ff', '#5a6a98']);
      for (const [x0, y0, x1, y1] of [[0, 30, 256, 8]]) { k.line(x0, y0, x1, y1, '#ffffff'); k.line(x0, y0 + 1, x1, y1 + 1, '#9fd8ff'); }
      for (const [x, y] of [[20, 58], [60, 50], [196, 52], [238, 60]]) k.poly([[x - 14, 72], [x, y], [x + 12, 72]], '#2a3a54');
      for (let i = 0; i < 30; i++) k.disc(rand() * W, 66 + rand() * 6, 6 + rand() * 10, '#3a4a6a', 2);
    },
    ambient(k, t) { // the split glows and the stars turn
      for (let i = 0; i < 40; i++) { const x = (i * 6.4 + t * 2) % W, y = 30 - x * 22 / 256; if ((i + Math.floor(t * 4)) % 5 === 0) k.px(x, y - 1, '#ffffff'); }
      for (let i = 0; i < 10; i++) if (Math.sin(t * 3 + i * 7) > 0.8) k.px((i * 61) % W, (i * 17) % 56 + 4, '#ffffff');
    },
  },
};

// The scene behind the stage, baked once per world: its sky and horizon, then the stage's floor in its own colours.
function bakeWorldArena(id) {
  const sc = WORLD_SCENES[id];
  if (!sc) return null;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), k = pixelKit(g), rand = mulberry32(431 + Object.keys(WORLD_SCENES).indexOf(id) * 97);
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) k.px(x, y, (x * 3 + y * 5) % 7 === 0 || (x + y) % 11 === 0 ? sc.ground[1] : sc.ground[0]); // the ground, under everything
  sc.bake(k, rand);
  // the stage: the same ellipse the fight uses, its top and its side, floored per world
  const [base, dark, light, rim, side] = sc.floor, RX = R, RY = R * SQ;
  for (let y = -Math.ceil(RY) - 1; y <= Math.ceil(RY) + 8; y++) for (let x = -RX - 1; x <= RX + 1; x++) {
    const top = (x / RX) ** 2 + (y / RY) ** 2, sd = (x / RX) ** 2 + ((y - 7) / RY) ** 2, X = CX + x, Y = Math.round(CY + y);
    if (top <= 1) {
      const wy = y / SQ, rr = Math.hypot(x, wy), a = Math.atan2(wy, x);
      let col = [base, dark, light, rim][sc.pattern(x, y, rr, a)];
      if (rr > R - 3) col = rim; else if (rr > R - 5) col = side;
      else if ((x + y) % 2 && rr > R - 12) col = col === base ? dark : col; // a worn edge
      k.px(X, Y, col);
    } else if (sd <= 1 && y > 0) k.px(X, Y, (X + Y) % 7 === 0 ? dark : side);
  }
  return c;
}

// What moves behind the fight (and only behind it: drawn before the fighters).
function drawWorldAmbient(g, id, t) {
  const sc = WORLD_SCENES[id];
  if (sc && sc.ambient) sc.ambient(pixelKit(g), t);
}
