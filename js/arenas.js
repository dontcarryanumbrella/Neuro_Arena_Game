// The worlds' arenas: a painted scene behind the stage for every world of the jar (and the two finales), a floor of
// its own, and a little life that moves while the fight goes on. The stage itself never changes shape: the ring is
// the same circle the simulation uses. Loaded after render.js.
//
// The backdrop is painted at ARENA_S times the fight's resolution and laid under the fight, which stays in its own
// crisp pixels on top (see Renderer.present). Everything here is drawn in the fight's coordinates (256 x 144); the
// canvas transform does the scaling.

const ARENA_S = 4; // the screen: four of its pixels to every pixel of the fight
const ARENA_PX = 1.5; // platform pixels: a little coarser than the original painted floor
const WORLD_BG_PX = 0.75; // scenery and ambience: larger pixels than the platform
const rgbOf = c => { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; };
const hexOf = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; };
// a colour lightened (t > 0, toward white) or darkened (t < 0, toward black)
const tone = (c, t) => hexOf(mixRgb(rgbOf(c), t > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t)));
const mix = (a, b, t) => hexOf(mixRgb(rgbOf(a), rgbOf(b), t));

// ---------- the painting toolkit (fight coordinates, smooth edges) ----------
function paintKit(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  const k = {
    g,
    rect: (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); },
    poly: (pts, c) => { path(pts); g.fillStyle = c; g.fill(); },
    circle: (x, y, r, c) => { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, 6.2832); g.fillStyle = c; g.fill(); },
    oval: (x, y, rx, ry, c) => { g.beginPath(); g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, 6.2832); g.fillStyle = c; g.fill(); },
    ring: (x, y, r, c, w = 0.5, ry = r, a0 = 0, a1 = 6.2832) => { g.beginPath(); g.ellipse(x, y, r, ry, 0, a0, a1); g.strokeStyle = c; g.lineWidth = w; g.stroke(); },
    line: (x0, y0, x1, y1, c, w = 0.5) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); },
    // a smooth stroke through points
    curve: (pts, c, w = 0.5) => {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      const e = pts[pts.length - 1]; g.lineTo(e[0], e[1]);
      g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    },
    vgrad: (y0, y1, cols) => { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; },
    hgrad: (x0, x1, cols) => { const gr = g.createLinearGradient(x0, 0, x1, 0); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; },
    sky: (y0, y1, cols) => { g.fillStyle = k.vgrad(y0, y1, cols); g.fillRect(-2, y0, W + 4, y1 - y0); },
    glow: (x, y, r, c, a = 1, ry = r) => {
      g.save(); g.translate(x, y); g.scale(1, ry / r);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(0.4, rgba(c, a * 0.35)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
    },
    // a ridge of hills from a seeded walk, smoothed; c may be a colour or a gradient
    ridge: (rand, base, rough, step, c, bottom = H, sharp = false) => {
      const pts = []; let y = base;
      for (let x = -step; x <= W + step * 2; x += step * (0.7 + rand() * 0.6)) { y = Math.max(base - rough, Math.min(base + rough * 0.4, y + (rand() - 0.55) * rough)); pts.push([x, y]); }
      g.beginPath(); g.moveTo(-4, bottom); g.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) sharp ? g.lineTo(pts[i][0], pts[i][1]) : g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      g.lineTo(W + 4, pts[pts.length - 1][1]); g.lineTo(W + 4, bottom); g.closePath(); g.fillStyle = c; g.fill();
      return pts;
    },
    // a mountain: a jagged peak, its lit face toward the light (side: -1 left, 1 right), snow on its crown
    mountain: (rand, x, base, w, h, body, lit, snow, side = -1) => {
      const L = [], Rr = [], n = 6;
      for (let i = 0; i <= n; i++) { const u = i / n; L.push([x - w / 2 * u + (rand() - 0.5) * w * 0.06, base - h * (1 - u) + (rand() - 0.5) * h * 0.08 * u]); Rr.push([x + w / 2 * u + (rand() - 0.5) * w * 0.06, base - h * (1 - u) + (rand() - 0.5) * h * 0.08 * u]); }
      L[0] = Rr[0] = [x, base - h];
      k.poly([...L, ...Rr.slice().reverse()], body);
      const mid = [];
      for (let i = 0; i <= n; i++) mid.push([x + (rand() - 0.5) * w * 0.1 + side * w * 0.04 * i / n, base - h * (1 - i / n)]);
      k.poly([...(side < 0 ? L : Rr), ...mid.slice().reverse()], lit);
      if (snow) {
        const cut = 0.32 + rand() * 0.1, sn = [[x, base - h]];
        for (let i = 1; i <= 2; i++) sn.push([x - w / 2 * cut * i / 2, base - h * (1 - cut * i / 2)]);
        for (let j = 0; j < 5; j++) { const u = 1 - j / 4; sn.push([x - w / 2 * cut * u + (j % 2 ? 0 : 1) * w * 0.02, base - h * (1 - cut) + (j % 2 ? -h * 0.06 : h * 0.04)]); }
        for (let i = 2; i >= 1; i--) sn.push([x + w / 2 * cut * i / 2, base - h * (1 - cut * i / 2)]);
        k.poly(sn, snow);
        k.poly([[x, base - h], ...(side < 0 ? [[x - w / 2 * cut, base - h * (1 - cut)], [x - w * 0.02, base - h * (1 - cut * 0.9)]] : [[x + w / 2 * cut, base - h * (1 - cut)], [x + w * 0.02, base - h * (1 - cut * 0.9)]])], tone(snow, 0.5));
      }
    },
    // a heaped cloud with a flat underside: shadow beneath, body, light on top toward the sun
    cloud: (rand, x, y, w, h, [sh, md, lt], lx = -1) => {
      const n = Math.max(3, Math.round(w / (h * 0.8))), puffs = [];
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, e = 1 - Math.abs(u - 0.5) * 1.5; puffs.push([x - w / 2 + u * w + (rand() - 0.5) * h * 0.3, y - h * (0.15 + 0.55 * e * (0.6 + rand() * 0.4)), h * (0.3 + 0.38 * e) * (0.85 + rand() * 0.3)]); }
      puffs.sort((p, q) => q[2] - p[2]); // the big ones behind
      g.save(); g.beginPath(); g.rect(x - w, y - h * 3, w * 2, h * 3); g.clip();
      k.oval(x, y - h * 0.15, w / 2, h * 0.3, sh);
      for (const [px, py, r] of puffs) {
        k.circle(px, py + r * 0.12, r, sh);
        const gr = g.createRadialGradient(px + lx * r * 0.35, py - r * 0.5, 0, px + lx * r * 0.1, py - r * 0.15, r * 1.05);
        gr.addColorStop(0, lt); gr.addColorStop(0.45, md); gr.addColorStop(0.85, mix(md, sh, 0.6)); gr.addColorStop(1, rgba(sh, 0));
        k.circle(px, py, r, gr);
      }
      g.restore();
    },
    stars: (rand, n, y0, y1, cols) => {
      for (let i = 0; i < n; i++) { const x = rand() * W, y = y0 + rand() * (y1 - y0), c = cols[Math.floor(rand() * cols.length)], r = 0.2 + rand() * rand() * 0.6; k.circle(x, y, r, c); if (r > 0.55) k.glow(x, y, 2.5, c, 0.4); }
    },
    // a curved eastern roof: eaves turning up at the ends, tiles running down, a gold line on the eave
    roof: (cx, y, w, h, c, trim, curl = 2) => {
      const x0 = cx - w / 2, x1 = cx + w / 2;
      g.beginPath(); g.moveTo(x0 - curl, y - curl * 1.1);
      g.quadraticCurveTo(x0 + w * 0.1, y + 0.6, x0 + w * 0.22, y + 0.4); g.lineTo(x1 - w * 0.22, y + 0.4);
      g.quadraticCurveTo(x1 - w * 0.1, y + 0.6, x1 + curl, y - curl * 1.1);
      g.quadraticCurveTo(x1 - w * 0.12, y - h * 0.45, cx + w * 0.3, y - h); g.lineTo(cx - w * 0.3, y - h);
      g.quadraticCurveTo(x0 + w * 0.12, y - h * 0.45, x0 - curl, y - curl * 1.1); g.closePath();
      g.fillStyle = k.vgrad(y - h, y, [tone(c, 0.12), c, tone(c, -0.25)]); g.fill();
      g.save(); g.clip();
      for (let x = x0 - curl; x < x1 + curl; x += 1.5) k.line(x + (x - cx) * 0.25, y - h, x, y + 1, rgba(tone(c, -0.45), 0.55), 0.35);
      g.restore();
      k.rect(cx - w * 0.31, y - h - 0.9, w * 0.62, 1.1, tone(c, -0.35));
      k.circle(cx - w * 0.31, y - h - 0.6, 0.8, tone(c, -0.35)); k.circle(cx + w * 0.31, y - h - 0.6, 0.8, tone(c, -0.35));
      if (trim) k.curve([[x0 - curl, y - curl * 1.1], [x0 + w * 0.1, y + 0.6], [cx, y + 0.5], [x1 - w * 0.1, y + 0.6], [x1 + curl, y - curl * 1.1]], trim, 0.5);
      k.rect(x0 + w * 0.06, y + 0.4, w * 0.88, 0.9, 'rgba(0,0,0,0.35)');
    },
    // the body of a hall: wall, columns, lattice windows between them, a door in the middle
    hall: (cx, y, w, h, wall, col, win, n = 4) => {
      const x0 = cx - w / 2;
      k.rect(x0, y, w, h, wall);
      k.rect(x0, y, w, h, k.vgrad(y, y + h, ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']));
      for (let i = 0; i <= n; i++) { const x = x0 + i * w / n - 0.6; k.rect(x, y, 1.2, h, col); k.rect(x, y, 0.4, h, rgba('#ffffff', 0.18)); }
      for (let i = 0; i < n; i++) {
        const bx = x0 + i * w / n + 1.2, bw = w / n - 2.4, door = i === Math.floor(n / 2) && n % 2 === 1;
        if (door) { k.rect(bx + bw * 0.15, y + h * 0.3, bw * 0.7, h * 0.7, tone(win, -0.55)); k.line(bx + bw / 2, y + h * 0.3, bx + bw / 2, y + h, rgba('#000', 0.5), 0.3); continue; }
        k.rect(bx, y + h * 0.22, bw, h * 0.5, win);
        for (let gx = bx + 1; gx < bx + bw; gx += 1.2) k.line(gx, y + h * 0.22, gx, y + h * 0.72, rgba(tone(win, -0.6), 0.7), 0.25);
        k.line(bx, y + h * 0.47, bx + bw, y + h * 0.47, rgba(tone(win, -0.6), 0.7), 0.3);
      }
    },
    with: fn => { g.save(); fn(); g.restore(); },
  };
  return k;
}

// ---------- the floors, drawn from above (stage units, the ring of radius R) ----------
const floorArt = {
  // stone flags in courses, every stone its own shade, the joints dark
  flags: (k, rand, size, cols, joint, w = 0.5) => {
    for (let y = -R - size; y < R + size; y += size) {
      const off = (Math.round(y / size) % 2) * size * 0.5;
      for (let x = -R - size * 2 + off; x < R + size; x += size * (0.8 + rand() * 0.5)) {
        const sw = size * (0.8 + rand() * 0.5);
        k.rect(x, y, sw, size, cols[Math.floor(rand() * cols.length)]);
        k.rect(x, y, sw, size * 0.18, rgba('#ffffff', 0.06));
        k.line(x, y, x, y + size, joint, w);
      }
      k.line(-R - 4, y, R + 4, y, joint, w);
    }
  },
  planks: (k, rand, size, cols, seam) => {
    for (let y = -R - size; y < R + size; y += size) {
      k.rect(-R - 4, y, 2 * R + 8, size, cols[Math.floor(rand() * cols.length)]);
      for (let i = 0; i < 3; i++) k.line(-R + rand() * 2 * R, y + size * (0.25 + rand() * 0.5), -R + rand() * 2 * R, y + size * (0.25 + rand() * 0.5), rgba(seam, 0.25), 0.3);
      k.line(-R - 4, y, R + 4, y, seam, 0.6);
      for (let x = -R + rand() * 30; x < R; x += 24 + rand() * 30) { k.line(x, y, x, y + size, seam, 0.5); k.circle(x - 1.5, y + size * 0.3, 0.35, tone(seam, -0.3)); k.circle(x - 1.5, y + size * 0.7, 0.35, tone(seam, -0.3)); }
    }
  },
  rings: (k, list) => { for (const [r, c, w] of list) k.ring(0, 0, r, c, w); },
  ticks: (k, r0, r1, n, c, w = 0.8) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; k.line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, c, w); } },
  speckle: (k, rand, n, cols, r = 0.6) => { for (let i = 0; i < n; i++) { const a = rand() * 6.2832, d = Math.sqrt(rand()) * R; k.circle(Math.cos(a) * d, Math.sin(a) * d, r * (0.4 + rand()), cols[Math.floor(rand() * cols.length)]); } },
  cracks: (k, rand, n, c, w = 0.5) => {
    for (let i = 0; i < n; i++) {
      let a = rand() * 6.2832, d = Math.sqrt(rand()) * R * 0.9, x = Math.cos(a) * d, y = Math.sin(a) * d, dir = rand() * 6.2832; const pts = [[x, y]];
      for (let j = 0; j < 4 + rand() * 5; j++) { dir += (rand() - 0.5) * 1.2; x += Math.cos(dir) * 4; y += Math.sin(dir) * 4; pts.push([x, y]); }
      k.curve(pts, c, w);
    }
  },
};

// ---------- each world: its sky and horizon, its floor, and what moves ----------
// ground: [near, far] below the horizon; floor: { top, rim, side, art(k, rand) } with art drawn from above in stage units
const WORLD_SCENES = {
  frontier: {
    ground: ['#5a3020', '#8a4a30'],
    floor: { top: '#a8744c', rim: '#d8a868', side: '#5c3a26', art: (k, rand) => floorArt.planks(k, rand, 9, ['#a8744c', '#9c6a44', '#b07c52', '#946240'], '#5a3822') },
    bake(k, rand) { // a red mesa sunset, a water tower and the saloon at the end of the road
      k.sky(0, 66, ['#24142e', '#552040', '#a83a3a', '#e0703a', '#f6b45c']);
      k.glow(196, 48, 70, '#ffb050', 0.55, 40);
      k.circle(196, 48, 11, '#ffcf7a'); k.circle(196, 48, 9.5, '#ffe8a8'); k.circle(195, 47, 7, '#fff6d8');
      for (const [x, y, w] of [[34, 18, 70], [140, 12, 80], [228, 28, 50], [96, 32, 60], [180, 36, 40]]) { k.oval(x, y, w / 2, 1.4, rgba('#f4a070', 0.5)); k.oval(x + 6, y + 1.3, w / 2.3, 0.9, rgba('#6a2040', 0.45)); }
      // far mesas, in haze, then nearer ones lit from the sun on their right
      const mesa = (x, w, top, base, body, lit) => {
        k.poly([[x, base], [x + 4, top + 2], [x + 7, top], [x + w - 7, top], [x + w - 4, top + 2], [x + w, base]], body);
        k.poly([[x + w - 7, top], [x + w - 4, top + 2], [x + w, base], [x + w - 6, base]], lit);
        k.rect(x + 7, top, w - 14, 0.8, tone(lit, 0.2));
        for (let y = top + 4; y < base; y += 3 + rand() * 2) k.rect(x + 3 + (y - top) * 0.3, y, w - 6 - (y - top) * 0.6, 0.5, rgba('#000', 0.18));
      };
      mesa(-10, 60, 40, 64, '#8a4a48', '#b06050'); mesa(84, 40, 46, 64, '#8a4a48', '#b06050'); mesa(150, 30, 44, 64, '#8a4a48', '#b06050');
      k.rect(0, 50, W, 16, k.vgrad(50, 66, [rgba('#f0a060', 0), rgba('#f0a060', 0.35)]));
      mesa(0, 46, 34, 70, '#5e2a2a', '#9a4434'); mesa(176, 44, 42, 70, '#5e2a2a', '#9a4434'); mesa(226, 40, 30, 70, '#5e2a2a', '#9a4434');
      k.ridge(rand, 66, 3, 12, k.vgrad(60, 90, ['#4a2a24', '#3a2018']), 100);
      // the water tower: tank of staves on a trestle
      for (const [x0, x1] of [[19, 15], [33, 37]]) k.line(x0, 41, x1, 70, '#2e1a12', 1);
      for (const y of [48, 56, 63]) { k.line(17.5, y, 34.5 + (y - 48) * 0.13, y + 7, '#2e1a12', 0.4); k.line(34.5, y, 17.5 - (y - 48) * 0.13, y + 7, '#2e1a12', 0.4); }
      k.rect(16, 28, 20, 13, k.hgrad(16, 36, ['#4a3020', '#7a5236', '#8a6040', '#5a3a26']));
      for (let x = 17; x < 36; x += 1.6) k.line(x, 28, x, 41, rgba('#2a180e', 0.5), 0.25);
      for (const y of [30.5, 35, 39]) k.rect(15.6, y, 20.8, 0.7, '#2a1a10');
      k.poly([[14.5, 28.5], [26, 21], [37.5, 28.5]], '#3e2618'); k.poly([[26, 21], [37.5, 28.5], [30, 28.5]], '#6a4028');
      k.rect(14, 41, 24, 1.2, '#2e1a12');
      // the saloon: a false front, a porch, warm windows
      k.rect(212, 44, 40, 26, '#4a2c1c'); k.rect(212, 44, 40, 26, k.hgrad(212, 252, ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(255,180,90,0.12)']));
      k.poly([[210, 44], [210, 33], [222, 33], [222, 30], [242, 30], [242, 33], [254, 33], [254, 44]], '#5e3a24');
      for (let y = 31; y < 44; y += 1.5) k.line(210, y, 254, y, rgba('#2a180e', 0.35), 0.25);
      k.rect(219, 34.5, 26, 5, '#2a1810'); k.rect(219.6, 35.1, 24.8, 3.8, '#c89848');
      for (let i = 0; i < 7; i++) k.rect(222 + i * 3, 36.2, 1.8, 1.6, '#3a2010');
      for (const x of [215, 229, 243]) { k.glow(x + 2.5, 50, 6, '#ffb050', 0.6); k.rect(x, 47, 5, 6, '#f0a850'); k.rect(x, 47, 5, 6, k.vgrad(47, 53, ['#ffd890', '#d88a3a'])); k.line(x + 2.5, 47, x + 2.5, 53, '#3a2010', 0.35); k.line(x, 50, x + 5, 50, '#3a2010', 0.35); k.rect(x - 0.5, 46.4, 6, 0.6, '#2a180e'); }
      k.rect(228, 59, 8, 11, '#1e100a'); k.rect(228.5, 60.5, 3.3, 5, '#7a4a28'); k.rect(232.2, 60.5, 3.3, 5, '#7a4a28');
      k.poly([[208, 56], [256, 56], [256, 58.5], [210, 59.5]], '#3a2216'); k.rect(208, 55.4, 48, 0.8, '#8a5a34');
      for (const x of [211, 224, 240, 253]) k.rect(x, 58.5, 1, 11.5, '#3a2216');
      k.rect(206, 69, 50, 1.6, '#6a4428');
      // saguaros, the near one large
      const cactus = (x, y, h, s) => {
        const c = '#3e5e30', d = '#2a4222', l = '#6a8a4a';
        k.line(x, y, x, y - h, c, 3 * s); k.line(x - 0.6 * s, y, x - 0.6 * s, y - h, d, 1 * s); k.line(x + 0.7 * s, y - 1, x + 0.7 * s, y - h + 1, l, 0.5 * s);
        k.curve([[x, y - h * 0.45], [x - 4 * s, y - h * 0.45], [x - 4 * s, y - h * 0.8]], c, 2.2 * s);
        k.curve([[x, y - h * 0.6], [x + 3.5 * s, y - h * 0.6], [x + 3.5 * s, y - h * 0.9]], c, 2 * s);
        k.curve([[x + 3.9 * s, y - h * 0.65], [x + 3.9 * s, y - h * 0.88]], l, 0.4 * s);
      };
      cactus(60, 64, 12, 0.6); cactus(162, 63, 9, 0.45); cactus(8, 96, 26, 1.1);
      for (let i = 0; i < 9; i++) { const x = 70 + i * 13; k.line(x, 63, x, 66.5, '#3a2018', 0.6); } k.line(70, 64, 174, 64, '#3a2018', 0.3);
    },
    ambient(k, t) { // two vultures wheeling, dust blowing across
      for (const [cx, ph] of [[120, 0], [150, 2.4]]) { const x = cx + Math.cos(t * 0.4 + ph) * 24, y = 16 + Math.sin(t * 0.4 + ph) * 6, f = Math.sin(t * 5 + ph) * 1.2; k.curve([[x - 3, y - f], [x - 1.2, y - 0.4], [x, y]], '#1a0e10', 0.7); k.curve([[x + 3, y - f], [x + 1.2, y - 0.4], [x, y]], '#1a0e10', 0.7); }
      for (let i = 0; i < 12; i++) { const x = ((t * (30 + i * 3) + i * 47) % (W + 20)) - 10, y = 62 + (i * 13) % 34; k.oval(x, y, 1.6, 0.35, 'rgba(240,200,140,0.35)'); }
    },
  },
  temple: {
    ground: ['#3e2820', '#6a4434'],
    floor: { top: '#a89a84', rim: '#c4683e', side: '#5a4e42', art: (k, rand) => { floorArt.flags(k, rand, 11, ['#a89a84', '#9e907a', '#b2a48c', '#988a74'], '#6a5e4e', 0.6); floorArt.rings(k, [[24, '#8a4a30', 1], [26, '#d8a050', 0.4]]); floorArt.speckle(k, rand, 60, ['rgba(120,60,40,0.25)']); } },
    bake(k, rand) { // red dust over layered mountains, the temple on its cliff, the great bell
      k.sky(0, 64, ['#3a2028', '#7a3a34', '#c06a48', '#e8a874']);
      k.glow(128, 40, 90, '#ffc080', 0.4, 30);
      k.ridge(rand, 36, 10, 16, '#a87a64', 80); k.ridge(rand, 44, 9, 14, '#8a5a4a', 85);
      k.rect(0, 36, W, 24, k.vgrad(36, 60, [rgba('#e8a874', 0), rgba('#e8a874', 0.4)]));
      k.ridge(rand, 56, 6, 10, k.vgrad(50, 80, ['#5a3a30', '#3e2820']), 100);
      // the cliff and the pagoda on it, five eaves
      k.poly([[-4, 70], [-4, 60], [8, 58], [36, 60], [48, 66], [52, 74]], '#3a2620'); k.poly([[36, 60], [48, 66], [52, 74], [40, 72]], '#5a3a2c');
      const px = 26;
      k.rect(px - 1, 20, 2, 8, '#d8a050'); for (let i = 0; i < 4; i++) k.oval(px, 21 + i * 1.6, 1.6 - i * 0.2, 0.4, '#e8b860');
      for (const [y, w, h] of [[59, 34, 7], [51, 29, 6.4], [43.5, 24, 5.8], [36.5, 19, 5.2], [30, 14, 4.6]]) {
        k.hall(px, y, w - 10, h - 1, '#5a2a22', '#8a2a20', '#e8a050', 3);
        k.roof(px, y + 0.3, w, 3.6, '#2e2224', '#d8a050', 2);
        k.circle(px - w / 2 - 2, y - 1.8, 0.4, '#ffd070'); k.circle(px + w / 2 + 2, y - 1.8, 0.4, '#ffd070');
      }
      k.rect(px - 17, 62, 34, 2, '#7a6a58');
      // the bell pavilion
      for (const x of [205, 241]) { k.rect(x, 40, 2.4, 28, k.hgrad(x, x + 2.4, ['#8a2a1e', '#5a1a14'])); }
      k.rect(205, 41.5, 38, 1.4, '#6a2a1e');
      k.roof(224, 40, 48, 7, '#2e2224', '#d8a050', 3);
      k.line(224, 43, 224, 45, '#3a2a18', 0.6);
      k.poly([[218, 56], [219, 47], [221, 45], [227, 45], [229, 47], [230, 56]], k.hgrad(218, 230, ['#5a4020', '#a8803a', '#c8a050', '#6a4a20']));
      k.rect(217, 55.5, 14, 1.6, '#5a3e18'); for (const y of [48, 51, 54]) k.rect(218.6, y, 10.8, 0.5, rgba('#3a2810', 0.7));
      for (let i = 0; i < 9; i++) k.circle(220.5 + (i % 3) * 1.6, 46.5 + Math.floor(i / 3) * 1.2, 0.3, '#e8c870');
      k.rect(203, 67, 42, 2.4, '#6a5a48');
      // pines, layered
      const pine = (x, y, h) => {
        k.line(x, y, x, y - h, '#2a1a14', 1);
        for (let i = 0; i < 4; i++) { const yy = y - h * 0.35 - i * h * 0.17, w = h * 0.5 * (1 - i * 0.2); k.oval(x, yy, w / 2, h * 0.08, '#24301e'); k.oval(x - w * 0.08, yy - h * 0.03, w / 2.4, h * 0.05, '#3e5230'); }
      };
      pine(58, 66, 18); pine(66, 64, 13); pine(186, 64, 14); pine(194, 66, 19);
      // a stone lantern on the near cliff
      k.rect(4, 78, 6, 2, '#6a5e50'); k.rect(5.5, 70, 3, 8, '#5a4e42'); k.rect(4, 67, 6, 3.4, '#6a5e50'); k.glow(7, 68.6, 6, '#ffb060', 0.7); k.rect(5.6, 67.6, 2.8, 2.1, '#ffc070'); k.poly([[3, 67], [7, 63.5], [11, 67]], '#4a3e34');
    },
    ambient(k, t) { // incense rising from the pagoda; red dust drifting
      for (let i = 0; i < 14; i++) { const u = (t * 0.2 + i / 14) % 1, x = 26 + Math.sin(u * 9 + i) * 3 * u, y = 19 - u * 18; k.circle(x, y, 0.5 + u, `rgba(230,210,190,${0.3 * (1 - u)})`); }
      for (let i = 0; i < 16; i++) { const x = ((t * 12 + i * 37) % W), y = 26 + ((i * 17 + t * 4) % 44); k.circle(x, y, 0.4, 'rgba(210,100,70,0.45)'); }
    },
  },
  night: {
    ground: ['#121119', '#24203a'],
    floor: { top: '#55545e', rim: '#a8445a', side: '#24232c', art: (k, rand) => { for (let y = -R; y < R; y += 10) for (let x = -R; x < R; x += 10) k.rect(x, y, 10, 10, ((x + y) / 10) % 2 ? '#5a5964' : '#45444e'); floorArt.cracks(k, rand, 10, 'rgba(20,18,28,0.6)', 0.4); floorArt.rings(k, [[48, '#95394f', 1.4], [24, '#95394f', 1], [50, rgba('#000', 0.4), 0.4]]); } },
    bake(k, rand) { // the moon over a gothic castle, graves and a dead tree
      k.sky(0, 66, ['#05050c', '#0c0e1e', '#1a1a34', '#302650']);
      k.stars(rand, 90, 1, 50, ['#8a8aa8', '#c8c8e0', '#5a5a78', '#e8e8ff']);
      k.glow(200, 28, 50, '#b8c8ff', 0.4);
      k.circle(200, 28, 13, '#d8d2c4'); k.circle(201, 27, 12.4, '#efe8da');
      for (const [x, y, r] of [[195, 24, 2.6], [204, 32, 2], [206, 22, 1.6], [197, 33, 1.2], [201, 27, 1]]) { k.circle(x, y, r, '#d0c8b8'); k.circle(x + r * 0.2, y + r * 0.2, r * 0.7, '#c4bcac'); }
      for (const [x, y, w] of [[170, 34, 40], [220, 40, 30], [60, 22, 50]]) k.oval(x, y, w / 2, 1.5, rgba('#4a4870', 0.6));
      k.ridge(rand, 56, 6, 12, '#1a1826', 100);
      // the castle: towers with spires, a keep with arched windows, battlements
      const tower = (x, w, top, spire) => {
        k.rect(x, top, w, 66 - top, k.hgrad(x, x + w, ['#141220', '#0c0a14']));
        k.poly([[x - 1.2, top], [x + w / 2, top - spire], [x + w + 1.2, top]], '#0e0c16'); k.poly([[x + w / 2, top - spire], [x + w + 1.2, top], [x + w * 0.6, top]], '#24203a');
        k.line(x + w / 2, top - spire, x + w / 2, top - spire - 3, '#24203a', 0.4);
        for (let i = 0; i < w; i += 2) k.rect(x + i, top - 1, 1, 1, '#0e0c16');
      };
      k.rect(190, 44, 52, 22, '#0e0c16'); for (let x = 190; x < 242; x += 2.4) k.rect(x, 42.6, 1.4, 1.6, '#0e0c16');
      tower(184, 12, 30, 12); tower(224, 11, 24, 15); tower(236, 14, 34, 10); tower(204, 14, 36, 9);
      const win = (x, y, h = 3) => { k.glow(x + 0.8, y + h / 2, 4, '#ffb060', 0.5); k.rect(x, y + 0.8, 1.6, h - 0.8, '#f0b058'); k.circle(x + 0.8, y + 0.8, 0.8, '#f0b058'); };
      win(189, 38); win(229, 31); win(229, 40); win(242, 42); win(208, 48); win(214, 48); win(198, 52);
      k.poly([[205, 66], [205, 59], [211, 55], [217, 59], [217, 66]], '#06050a');
      // graves, a cross, a dead tree, an iron fence
      for (const [x, h] of [[8, 8], [22, 6.5], [36, 9], [50, 6]]) { k.rect(x, 66 - h, 5, h, '#2a2834'); k.circle(x + 2.5, 66 - h, 2.5, '#2a2834'); k.rect(x + 3.5, 66 - h - 1.4, 1.2, h + 1, '#3a3848'); k.rect(x + 1.6, 64 - h * 0.5, 1.8, 0.4, '#1a1822'); }
      k.rect(29, 52, 1.2, 10, '#33313e'); k.rect(26.5, 54.5, 6.2, 1.2, '#33313e');
      const branch = (x, y, a, len, w) => { if (len < 2) return; const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; k.line(x, y, x1, y1, '#0c0a10', w); branch(x1, y1, a - 0.45 - rand() * 0.3, len * 0.68, w * 0.65); branch(x1, y1, a + 0.35 + rand() * 0.3, len * 0.62, w * 0.65); };
      branch(70, 68, -1.5, 13, 2.2);
      for (let x = 0; x < 60; x += 3) { k.line(x, 74, x, 67.5, '#0a0810', 0.5); k.poly([[x - 0.6, 67.6], [x, 66.4], [x + 0.6, 67.6]], '#0a0810'); } k.line(0, 69, 60, 69, '#0a0810', 0.5); k.line(0, 72.5, 60, 72.5, '#0a0810', 0.5);
    },
    ambient(k, t) { // bats across the moon; a window flickers; ground fog
      for (let i = 0; i < 3; i++) { const x = ((t * 22 + i * 90) % (W + 30)) - 15, y = 24 + Math.sin(t * 2 + i) * 8, f = Math.sin(t * 16 + i) * 1.4; k.curve([[x - 2.6, y - f], [x - 1, y - 0.6], [x, y]], '#000', 0.8); k.curve([[x + 2.6, y - f], [x + 1, y - 0.6], [x, y]], '#000', 0.8); }
      if (Math.floor(t * 3) % 7 === 0) k.rect(228.6, 31, 2, 3, rgba('#000', 0.6));
      for (let i = 0; i < 7; i++) { const x = ((t * 5 + i * 50) % (W + 60)) - 30; k.oval(x, 63 + (i % 3) * 2, 18, 1.6, 'rgba(140,140,180,0.12)'); }
    },
  },
  peaks: {
    ground: ['#b8c8d4', '#e4ecf2'],
    floor: { top: '#a2b0b4', rim: '#b0dcea', side: '#495e69', art: (k, rand) => { floorArt.flags(k, rand, 13, ['#a2b0b4', '#98a6ac', '#adbabd'], '#7a8a92', 0.5); floorArt.cracks(k, rand, 8, 'rgba(70,90,100,0.5)', 0.35); floorArt.speckle(k, rand, 90, ['rgba(255,255,255,0.7)', 'rgba(230,240,248,0.6)'], 0.8); } },
    bake(k, rand) { // snow peaks above a sea of cloud; swords are planted in drifting cloud banks
      k.sky(0, 62, ['#16243e', '#2e4a6a', '#6a8aa8', '#c4d4de']);
      k.glow(128, 0, 120, '#eef6ff', 0.25, 40);
      k.mountain(rand, 50, 60, 90, 44, '#7088a0', '#a4b8c8', '#eef4f8', -1);
      k.mountain(rand, 200, 60, 110, 52, '#7088a0', '#a4b8c8', '#eef4f8', -1);
      k.rect(0, 30, W, 32, k.vgrad(30, 62, [rgba('#c4d4de', 0), rgba('#c4d4de', 0.5)]));
      k.mountain(rand, 120, 62, 70, 46, '#4a627a', '#8aa2b6', '#e8f0f6', -1);
      k.mountain(rand, 18, 64, 60, 36, '#3e5470', '#7890a8', '#e0eaf2', -1);
      k.mountain(rand, 236, 64, 64, 40, '#3e5470', '#7890a8', '#e0eaf2', -1);
      // Floating cloud banks hold the swords; the blades point downward and disappear into the mist.
      for (const [x, y, s] of [[30, 38, 0.9], [75, 32, 0.8], [225, 37, 0.9]]) {
        k.cloud(rand, x, y + 2 * s, 21 * s, 6 * s, ['#9fb3c8', '#dce9f1', '#ffffff']);
        k.glow(x, y - 5 * s, 7 * s, '#9fd8ff', 0.35);
        k.poly([[x - 1.4*s, y - 10*s], [x + 1.4*s, y - 10*s], [x + 0.8*s, y], [x, y + 3*s], [x - 0.8*s, y]], '#e8f4ff');
        k.line(x, y - 10*s, x, y + 1*s, '#a6c3d5', 0.5*s);
        k.rect(x - 3*s, y - 11*s, 6*s, 1.3*s, '#c8a050');
        k.rect(x - 0.8*s, y - 15*s, 1.6*s, 4*s, '#5a3a20');
        k.circle(x, y - 15*s, 0.9*s, '#e0bd75');
        k.oval(x, y + 2*s, 7*s, 1.4*s, 'rgba(244,250,255,0.9)');
      }
      for (let i = 0; i < 18; i++) k.cloud(rand, rand() * W, 64 + rand() * 4, 26 + rand() * 30, 6 + rand() * 4, ['#b8c8d8', '#e0e8f0', '#ffffff']);
      // a pine on a crag, near
      k.poly([[-4, 100], [-4, 66], [10, 62], [22, 70], [26, 100]], '#3a4a5a'); k.poly([[10, 62], [22, 70], [16, 70]], '#6a7e90'); k.oval(9, 62.6, 5, 1, '#f0f6fa');
      for (let i = 0; i < 4; i++) { const y = 56 - i * 4, w = 12 - i * 2.4; k.oval(8, y, w / 2, 1.4, '#22342a'); k.oval(7.4, y - 0.8, w / 2.6, 0.7, '#f0f6fa'); } k.line(8, 62, 8, 44, '#2a1a14', 0.8);
    },
    ambient(k, t) { // cloud wisps sliding, snow falling, now and then a flying sword crossing the sky
      for (let i = 0; i < 5; i++) { const x = ((t * 3 + i * 60) % (W + 80)) - 40; k.oval(x, 57 + (i % 2) * 3, 16, 1.4, 'rgba(240,246,250,0.45)'); }
      for (let i = 0; i < 22; i++) { const x = (i * 31 + Math.sin(t + i) * 6 + t * 4) % W, y = (t * 10 + i * 23) % 70; k.circle(x, y, 0.35 + (i % 3) * 0.12, 'rgba(255,255,255,0.75)'); }
      const s = (t * 0.6) % 6; if (s < 1) { const x = s * 300 - 20, y = 20 + s * 10; k.glow(x + 3, y, 5, '#9fd8ff', 0.5); k.line(x, y, x + 6, y - 1, '#e8f4ff', 0.6); }
    },
  },
  abyss: {
    ground: ['#140810', '#3a1014'],
    floor: { top: '#46323e', rim: '#ec7740', side: '#251b2d', art: (k, rand) => { floorArt.flags(k, rand, 14, ['#46323e', '#3e2c38', '#4e3844'], '#2a1e28', 0.6); k.g.save(); k.g.shadowColor = '#ff6a2a'; k.g.shadowBlur = 6 * ARENA_S; floorArt.cracks(k, rand, 9, '#ff7a3a', 0.6); k.g.restore(); floorArt.cracks(k, rand, 6, '#ffc060', 0.25); } },
    bake(k, rand) { // pits beneath pits: black spires, lava falls, glow from below
      k.sky(0, 70, ['#080306', '#1a0810', '#3a1018', '#7a2018']);
      k.glow(128, 74, 140, '#ff4a1a', 0.35, 30);
      for (let i = 0; i < 14; i++) { const x = i * 20 + rand() * 10, h = 14 + rand() * 18; k.poly([[x - 6, 70], [x - 1, 70 - h], [x + 1, 70 - h + 2], [x + 6, 70]], '#2a1018'); }
      k.rect(0, 50, W, 22, k.vgrad(50, 72, [rgba('#7a2018', 0), rgba('#a02a18', 0.45)]));
      for (let i = 0; i < 9; i++) {
        const x = i * 31 + rand() * 10, h = 24 + rand() * 30, w = 6 + rand() * 4;
        k.poly([[x - w, 72], [x - 1.5, 72 - h], [x + 0.8, 72 - h - 2], [x + 3, 72 - h + 6], [x + w + 1, 72]], '#120810');
        k.poly([[x + 0.8, 72 - h - 2], [x + 3, 72 - h + 6], [x + w + 1, 72], [x + w - 2, 72]], '#3a1418');
        k.line(x - w + 1, 72, x - 1.5, 72 - h + 1, rgba('#ff6a2a', 0.35), 0.4);
      }
      // the lava falls, with their pools
      for (const [x, y0] of [[20, 26], [232, 20]]) {
        k.glow(x + 1.5, 50, 16, '#ff6a2a', 0.5, 30);
        k.poly([[x - 3, y0 - 2], [x + 6, y0 - 2], [x + 5, y0 + 1], [x - 2, y0 + 1]], '#1a0a0c');
        k.rect(x, y0, 3.4, 72 - y0, k.hgrad(x, x + 3.4, ['#c03a14', '#ffb040', '#ffe080', '#e85a24']));
        for (let y = y0 + 3; y < 72; y += 4) k.oval(x + 1.7, y, 1.4, 0.4, rgba('#fff0a0', 0.6));
        k.glow(x + 1.7, 72, 10, '#ff7a30', 0.8, 4); k.oval(x + 1.7, 72, 6, 1.6, '#ffa040');
      }
      // hanging chains
      for (const [x, len] of [[70, 20], [186, 26]]) for (let y = 0; y < len; y += 1.6) k.ring(x + Math.sin(y * 0.1) * 0.6, y, 0.6, '#2a1a1a', 0.35, 0.8);
      k.ridge(rand, 66, 4, 8, k.vgrad(62, 90, ['#2a0e12', '#14080c']), 100, true);
    },
    ambient(k, t) { // embers rising; the lava glow breathes
      for (let i = 0; i < 22; i++) { const u = (t * 0.2 + i / 22) % 1, x = (i * 53 + Math.sin(t + i) * 8) % W, y = 100 - u * 100; k.circle(x, y, 0.45, `rgba(255,${120 + i * 5},60,${1 - u})`); }
      k.glow(128, 66, 140, '#ff5a28', 0.08 + 0.06 * Math.sin(t * 2), 6);
    },
  },
  isles: {
    ground: ['#2e2448', '#6a4a78'],
    floor: { top: '#947d80', rim: '#e08aa0', side: '#514452', art: (k, rand) => { floorArt.planks(k, rand, 8, ['#947d80', '#8a7376', '#9c8487'], '#5a4448'); floorArt.speckle(k, rand, 40, ['#ffb8cc', '#f08aa8'], 0.7); } },
    bake(k, rand) { // a twilight sea, a torii standing in the water, a cherry tree in bloom
      k.sky(0, 54, ['#241c3c', '#4e3664', '#9a6084', '#eea4a0']);
      k.glow(70, 42, 70, '#ffd0c0', 0.5, 40);
      k.circle(70, 42, 9, '#ffe4cc'); k.circle(70, 42, 7.6, '#fff4e4');
      for (const [x, y, w] of [[150, 22, 70], [30, 18, 40], [210, 34, 50], [110, 40, 34]]) { k.oval(x, y, w / 2, 1.8, rgba('#f4b8b8', 0.55)); k.oval(x + 4, y + 1.6, w / 2.3, 1, rgba('#5a3e6a', 0.5)); }
      // the sea, with the sun's path on it
      k.rect(0, 54, W, 30, k.vgrad(54, 84, ['#7a5a84', '#4a3a62', '#2e2648']));
      for (let y = 55; y < 84; y += 1.2) { const s = (y - 54) / 30, n = 2 + Math.floor(rand() * 3); for (let i = 0; i < n; i++) k.oval(70 + (rand() - 0.5) * (8 + s * 30), y, 1 + rand() * 3 * (1 - s * 0.5), 0.25, rgba('#ffe0c8', 0.7 * (1 - s))); for (let i = 0; i < 2; i++) k.oval(rand() * W, y, 2 + rand() * 4, 0.2, rgba('#c88aa0', 0.4)); }
      // far islands, one with a pagoda
      for (const [x, w, h] of [[140, 34, 8], [178, 20, 5], [104, 16, 4]]) { k.poly([[x, 55], [x + w * 0.3, 55 - h], [x + w * 0.6, 55 - h * 0.8], [x + w, 55]], '#3a2c52'); }
      k.rect(152, 41, 1.6, 6, '#3a2c52'); for (let i = 0; i < 3; i++) k.poly([[148 + i, 47 - i * 2.4], [153.6 - 0.8, 44.5 - i * 2.4], [158.4 - i, 47 - i * 2.4]], '#3a2c52');
      // the torii, standing in the water with its reflection
      const torii = (y, flip, a) => {
        k.with(() => {
          k.g.globalAlpha = a; k.g.translate(0, y); k.g.scale(1, flip);
          const red = '#c0302a', dk = '#7a1a18';
          k.rect(25, 0, 3.2, 30, k.hgrad(25, 28.2, [red, dk])); k.rect(48, 0, 3.2, 30, k.hgrad(48, 51.2, [red, dk]));
          k.rect(22, 23, 32, 2.2, red); k.rect(36.5, 25.2, 3, 3.6, red);
          k.g.beginPath(); k.g.moveTo(17, 30.6); k.g.quadraticCurveTo(38, 27.6, 59, 30.6); k.g.lineTo(58, 28.4); k.g.quadraticCurveTo(38, 25.4, 18, 28.4); k.g.closePath(); k.g.fillStyle = red; k.g.fill();
          k.g.beginPath(); k.g.moveTo(16, 31.6); k.g.quadraticCurveTo(38, 28.4, 60, 31.6); k.g.lineTo(59.6, 30.4); k.g.quadraticCurveTo(38, 27.2, 16.4, 30.4); k.g.closePath(); k.g.fillStyle = '#1e1014'; k.g.fill();
        });
      };
      torii(66, -1, 1); torii(66, 1, 0.3);
      for (let i = 0; i < 5; i++) k.oval(26.6 + (i % 2) * 23, 66 + i * 0.4, 3, 0.4, rgba('#ffd0d8', 0.5));
      // the cherry tree on the near shore
      k.poly([[200, 100], [204, 72], [214, 66], [256, 66], [256, 100]], '#3a2c40');
      k.line(224, 72, 224, 44, '#3a2028', 3); k.curve([[224, 54], [232, 48], [240, 40]], '#3a2028', 1.6); k.curve([[223, 50], [214, 44], [206, 38]], '#3a2028', 1.4); k.curve([[224, 46], [226, 38], [222, 30]], '#3a2028', 1.2);
      for (const [cx, cy, r] of [[222, 32, 11], [240, 38, 9], [207, 38, 8], [230, 30, 8], [214, 30, 7], [248, 44, 6]]) {
        k.circle(cx, cy + 1, r, '#c86a8a');
        for (let i = 0; i < 26; i++) { const a = rand() * 6.28, d = Math.sqrt(rand()) * r; k.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 1 + rand() * 1.6, rand() < 0.5 ? '#f4a0b8' : '#e888a6'); }
        for (let i = 0; i < 10; i++) { const a = -2.4 + rand() * 1.6, d = rand() * r * 0.8; k.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 0.6 + rand(), '#ffd0dc'); }
      }
      k.rect(204, 70, 6, 1.4, '#5a4e58'); k.rect(205.6, 64, 2.8, 6, '#4a3e48'); k.rect(204.4, 61.6, 5.2, 2.6, '#5a4e58'); k.glow(207, 63, 5, '#ffc080', 0.6); k.rect(206, 62.2, 2, 1.6, '#ffd090'); k.poly([[203.4, 61.6], [207, 59], [210.6, 61.6]], '#3a2e38');
    },
    ambient(k, t) { // petals falling; light glinting on the water
      for (let i = 0; i < 22; i++) { const u = (t * 0.15 + i / 22) % 1, x = (220 - u * 160 + Math.sin(t * 2 + i) * 6 + i * 29) % W, y = 24 + u * 90, s = Math.sin(t * 4 + i); k.oval(x, y, 0.8, 0.45 + 0.25 * s, i % 2 ? '#ffc8d8' : '#f8a0b8'); }
      for (let i = 0; i < 10; i++) { const x = (i * 37 + t * 6) % W, a = 0.3 + 0.3 * Math.sin(t * 3 + i); k.oval(x, 58 + (i * 5) % 22, 2, 0.25, `rgba(255,230,235,${a})`); }
    },
  },
  heavens: {
    ground: ['#f2ead8', '#c8d8ec'],
    floor: { top: '#ece4d0', rim: '#d8aa48', side: '#9a907e', art: (k, rand) => {
      floorArt.flags(k, rand, 16, ['#ece4d0', '#e6dcc6', '#f2ead8', '#e0d6c0'], '#c8baa0', 0.4);
      floorArt.rings(k, [[48, '#d1a448', 1.2], [45.5, '#d1a448', 0.4], [25, '#d1a448', 1], [22.5, '#4a9a6a', 0.6]]);
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; k.ring(Math.cos(a) * 36, Math.sin(a) * 36, 3, '#d1a448', 0.5); k.ring(Math.cos(a) * 36 + 1.6, Math.sin(a) * 36 - 0.4, 1.6, '#d1a448', 0.4); }
      k.circle(0, 0, 6, '#f8f0dc'); k.ring(0, 0, 6, '#d1a448', 0.6);
    } },
    bake(k, rand) { // a sea of cloud under a gold sky, the celestial palace standing on it
      k.sky(0, 66, ['#3e5c94', '#7a9cc8', '#c8d0d0', '#f4e2b4', '#fff0cc']);
      k.glow(206, 18, 110, '#fff0b0', 0.55, 70);
      for (let i = 0; i < 12; i++) { const a = -2.6 + i * 0.22; k.poly([[206, 18], [206 + Math.cos(a) * 160, 18 + Math.sin(a) * 160], [206 + Math.cos(a + 0.06) * 160, 18 + Math.sin(a + 0.06) * 160]], 'rgba(255,244,200,0.08)'); }
      k.circle(206, 18, 7, '#fff4cc'); k.circle(206, 18, 5.5, '#fffbea');
      // high thin clouds, then far cloud banks on the horizon
      for (const [x, y, w] of [[50, 14, 60], [120, 24, 50], [90, 8, 40]]) { k.oval(x, y, w / 2, 1.6, 'rgba(255,250,240,0.55)'); k.oval(x + 5, y + 1.2, w / 2.4, 0.9, 'rgba(160,170,200,0.3)'); }
      for (let i = 0; i < 12; i++) k.cloud(rand, i * 24 + rand() * 10 - 10, 54, 30 + rand() * 20, 6 + rand() * 4, ['#d4cfc8', '#f2ebdc', '#fffaf0'], 1);
      // far palaces, pale in the haze
      for (const [x, s] of [[70, 0.55], [128, 0.4]]) { k.with(() => { k.g.globalAlpha = 0.35; k.hall(x, 50 - 6 * s, 20 * s, 6 * s, '#c88070', '#b05a4a', '#f0c890', 3); k.roof(x, 50 - 6 * s, 28 * s, 4 * s, '#c8a060', null, 1.5 * s); k.roof(x, 50 - 11 * s, 18 * s, 3.4 * s, '#c8a060', null, 1.2 * s); }); }
      // the celestial palace: a jade terrace and balustrade, a great hall under double gold eaves, a pavilion above
      const pcx = 210, gold = '#e8b440', red = '#c0342a';
      k.cloud(rand, pcx, 66, 70, 12, ['#cfc6b8', '#f2ebdc', '#ffffff'], 1);
      k.poly([[pcx - 34, 58], [pcx + 34, 58], [pcx + 30, 62], [pcx - 30, 62]], '#e8e2d4'); k.poly([[pcx + 34, 58], [pcx + 30, 62], [pcx + 26, 62], [pcx + 30, 58]], '#c8c0b0');
      k.rect(pcx - 33, 55.6, 66, 2.4, '#f4f0e6'); for (let x = pcx - 32; x <= pcx + 32; x += 2.4) k.rect(x, 54.4, 0.7, 2, '#f8f6ee'); k.rect(pcx - 33, 54.2, 66, 0.6, '#f8f6ee');
      for (let i = 0; i < 5; i++) k.rect(pcx - 6 + i * 0.4, 58 + i * 0.8, 12 - i * 0.8, 0.8, i % 2 ? '#d8d0c0' : '#f4f0e6');
      k.hall(pcx, 41, 46, 13.6, '#a8282a', red, '#f4c870', 5);
      k.roof(pcx, 41.4, 58, 6, '#d89a30', '#fff0a0', 3.2);
      k.hall(pcx, 31.6, 34, 5, '#a8282a', red, '#f4c870', 4);
      k.roof(pcx, 32.6, 44, 5.4, '#d89a30', '#fff0a0', 2.8);
      k.rect(pcx - 3.6, 33.6, 7.2, 3, '#1e3a6a'); k.rect(pcx - 3.2, 34, 6.4, 2.2, '#2a5090'); k.rect(pcx - 2.4, 34.6, 4.8, 0.4, gold); k.rect(pcx - 2.4, 35.4, 4.8, 0.4, gold);
      k.hall(pcx, 21.6, 12, 5, '#a8282a', red, '#f4c870', 2);
      k.roof(pcx, 22, 20, 5, '#d89a30', '#fff0a0', 2.2);
      k.line(pcx, 16.6, pcx, 11, gold, 0.8); for (let i = 0; i < 3; i++) k.circle(pcx, 15.6 - i * 1.4, 0.9 - i * 0.15, gold); k.glow(pcx, 10.6, 6, '#ffe070', 0.8); k.circle(pcx, 10.6, 1.2, '#fff4b0');
      for (const x of [pcx - 30, pcx + 30]) { k.rect(x - 1, 40, 2, 15, '#4a9a6a'); k.rect(x - 1, 40, 0.6, 15, '#8ad0a0'); k.rect(x - 1.6, 39, 3.2, 1.2, gold); k.glow(x, 38, 4, '#fff0a0', 0.6); k.circle(x, 38, 1, '#fff4c0'); }
      // the jade gate on the left, at the top of a cloud stair
      for (const x of [16, 40]) { k.rect(x, 26, 4.4, 34, k.hgrad(x, x + 4.4, ['#7ac898', '#4a9a6a', '#2e6a48'])); for (let y = 30; y < 58; y += 5) k.curve([[x, y], [x + 2.2, y + 1.6], [x + 4.4, y]], '#2e6a48', 0.4); k.rect(x - 1, 59, 6.4, 2, '#d8d0c0'); k.rect(x - 0.8, 25, 6, 1.6, gold); }
      k.rect(12, 30, 36, 2, red); k.rect(20.4, 32, 19.6, 4, '#1e3a6a'); k.rect(21, 32.6, 18.4, 2.8, '#2a5090'); for (let i = 0; i < 5; i++) k.rect(23 + i * 3.4, 33.4, 2, 1.2, gold);
      k.roof(30, 25, 42, 5, '#d89a30', '#fff0a0', 3);
      for (let i = 0; i < 9; i++) k.cloud(rand, 52 + i * 6, 66 - i * 3.6, 14, 4, ['#d8d0c4', '#f6f0e4', '#ffffff'], 1);
      // the sea of cloud: rows of cloud, larger and warmer as they come nearer
      for (let row = 0; row < 10; row++) {
        const y = 64 + row * 9, h = 6 + row * 2.6;
        for (let x = -20 + (row % 2) * 14; x < W + 30; x += h * 3.2 + rand() * 8) k.cloud(rand, x, y + rand() * 3, h * 3.6, h, [mix('#c8cad8', '#d8c8b0', row / 9), mix('#eef0f4', '#f8eedc', row / 9), '#ffffff'], 1);
      }
    },
    ambient(k, t) { // cloud wisps drifting, golden motes, a crane crossing
      for (let i = 0; i < 6; i++) { const x = ((t * (2 + i % 3)) + i * 50) % (W + 60) - 30; k.oval(x, 6 + i * 4, 14, 1.2, 'rgba(255,252,240,0.45)'); }
      for (let i = 0; i < 14; i++) { const x = (i * 41 + t * 8) % W, y = 12 + (i * 7 + Math.sin(t + i) * 4) % 40; k.glow(x, y, 1.6, '#ffe080', 0.6); k.circle(x, y, 0.35, '#fff4c0'); }
      const x = (t * 14) % (W + 40) - 20, y = 24 + Math.sin(t) * 2, f = Math.sin(t * 4) * 1.6;
      k.curve([[x - 4, y - f], [x - 1.5, y - 0.4], [x, y]], '#ffffff', 0.8); k.curve([[x + 4, y - f], [x + 1.5, y - 0.4], [x, y]], '#ffffff', 0.8); k.line(x - 2, y + 0.2, x + 2.4, y - 0.2, '#ffffff', 0.7); k.circle(x + 2.6, y - 0.4, 0.4, '#c0342a'); k.line(x - 2, y + 0.2, x - 3.6, y + 0.8, '#2a2a2a', 0.3);
    },
  },
  timestream: {
    ground: ['#08121a', '#123040'],
    floor: { top: '#33525f', rim: '#75d8d4', side: '#1b2b38', art: (k, rand) => {
      k.circle(0, 0, R, '#2e4a56'); floorArt.flags(k, rand, 15, ['#33525f', '#2e4c58', '#385864'], '#1e3440', 0.5);
      floorArt.rings(k, [[52, '#75d8d4', 1.2], [49, '#3a7a80', 0.5], [25, '#75d8d4', 0.9]]);
      floorArt.ticks(k, 52, 60, 12, '#75d8d4', 1.4); floorArt.ticks(k, 52, 56, 60, 'rgba(117,216,212,0.5)', 0.4);
      k.line(0, 0, 0, -40, '#a8f0e8', 1.6); k.line(0, 0, 28, 14, '#a8f0e8', 1.2); k.circle(0, 0, 3, '#75d8d4');
    } },
    bake(k, rand) { // a river of light running through the dark, broken clock faces adrift in it
      k.sky(0, 72, ['#03070d', '#07111c', '#0c1c2c', '#14303e']);
      k.stars(rand, 50, 2, 62, ['#3a6a7a', '#6aa8b0', '#a8e0e0']);
      const river = x => 18 + x * 0.18 + Math.sin(x * 0.05) * 6;
      k.with(() => { k.g.shadowColor = '#6ae8e0'; k.g.shadowBlur = 10 * ARENA_S; k.g.beginPath(); k.g.moveTo(-2, river(-2)); for (let x = 0; x <= W + 2; x += 4) k.g.lineTo(x, river(x)); for (let x = W + 2; x >= -2; x -= 4) k.g.lineTo(x, river(x) + 7); k.g.closePath(); k.g.fillStyle = '#123848'; k.g.fill(); });
      for (let j = 0; j < 5; j++) { const pts = []; for (let x = -2; x <= W + 2; x += 6) pts.push([x, river(x) + 1.4 + j * 1.1 + Math.sin(x * 0.2 + j) * 0.3]); k.curve(pts, rgba(j === 2 ? '#c8fff8' : '#3aa0a8', j === 2 ? 0.7 : 0.4), j === 2 ? 0.5 : 0.35); }
      // floating rock shards
      for (const [x, y, s] of [[90, 46, 5], [160, 52, 4], [240, 60, 6]]) { k.poly([[x - s, y], [x - s * 0.4, y - s * 0.5], [x + s, y - s * 0.2], [x + s * 0.3, y + s * 1.2]], '#16242e'); k.poly([[x - s, y], [x - s * 0.4, y - s * 0.5], [x + s, y - s * 0.2]], '#2a4a56'); }
      // the clocks: rim, face, hour marks, a missing wedge, a gear behind
      for (const [x, y, r] of [[34, 36, 16], [210, 30, 13], [128, 16, 8]]) {
        const gear = (gx, gy, gr) => { k.circle(gx, gy, gr, '#0e1c26'); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; k.with(() => { k.g.translate(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr); k.g.rotate(a); k.rect(-0.8, -1, 1.8, 2, '#0e1c26'); }); } k.circle(gx, gy, gr * 0.4, '#16303c'); };
        gear(x + r * 0.7, y - r * 0.6, r * 0.5);
        k.glow(x, y, r * 1.8, '#6ae8e0', 0.2);
        k.circle(x, y, r, '#2a6068'); k.circle(x, y, r - 1.2, '#0c1a26'); k.circle(x, y, r - 1.8, k.vgrad(y - r, y + r, ['#1a3a46', '#0c1a26']));
        for (let i = 0; i < 12; i++) { const q = i / 12 * 6.2832, d = r - 3.2; k.line(x + Math.cos(q) * d, y + Math.sin(q) * d, x + Math.cos(q) * (d + (i % 3 ? 0.8 : 1.6)), y + Math.sin(q) * (d + (i % 3 ? 0.8 : 1.6)), '#c8f4e8', i % 3 ? 0.4 : 0.7); }
        k.poly([[x, y], [x + Math.cos(0.9) * (r + 1), y + Math.sin(0.9) * (r + 1)], [x + Math.cos(1.5) * (r + 1), y + Math.sin(1.5) * (r + 1)]], '#05090f');
        k.ring(x, y, r - 0.6, '#8ad8d0', 0.5);
      }
      k.ridge(rand, 66, 4, 14, k.vgrad(60, 90, ['#0e1c26', '#08121a']), 100);
    },
    ambient(k, t) { // light flowing down the river; clock hands turning (one backwards)
      for (let i = 0; i < 24; i++) { const x = (t * 26 + i * 13) % W, y = 21 + x * 0.18 + Math.sin(x * 0.05) * 6 + (i % 3) * 1.2; k.glow(x, y, 2, '#8ad8d0', 0.5); k.circle(x, y, 0.35, i % 3 ? '#8ad8d0' : '#ffffff'); }
      for (const [x, y, r, s] of [[34, 36, 16, 1], [210, 30, 13, -1.6], [128, 16, 8, 3]]) { const q = t * s; k.line(x, y, x + Math.cos(q) * (r - 4), y + Math.sin(q) * (r - 4), '#e8fff8', 0.5); k.line(x, y, x + Math.cos(q / 12) * (r - 7), y + Math.sin(q / 12) * (r - 7), '#8ad8d0', 0.8); k.circle(x, y, 0.8, '#e8fff8'); }
    },
  },
  cursed: {
    ground: ['#0a0612', '#22143a'],
    floor: { top: '#46404a', rim: '#a870d3', side: '#24212e', art: (k, rand) => {
      floorArt.flags(k, rand, 12, ['#46404a', '#403a44', '#4c4650'], '#2a2630', 0.5);
      k.with(() => { k.g.shadowColor = '#a870d3'; k.g.shadowBlur = 5 * ARENA_S;
        floorArt.rings(k, [[45, '#a870d3', 0.9], [41, '#a870d3', 0.4]]);
        for (let i = 0; i < 5; i++) { const a = -1.5708 + i * 2 * 2.5133; k.line(Math.cos(a) * 41, Math.sin(a) * 41, Math.cos(a + 2.5133 * 2) * 41, Math.sin(a + 2.5133 * 2) * 41, '#a870d3', 0.6); }
      });
      floorArt.cracks(k, rand, 8, 'rgba(10,6,16,0.6)', 0.4);
    } },
    bake(k, rand) { // a city under a domain: a dark dome over the skyline, a red moon, talisman seals hung across the gap
      k.sky(0, 68, ['#08040f', '#140a24', '#26163c', '#3e2254']);
      k.glow(54, 22, 40, '#ff4060', 0.4);
      k.circle(54, 22, 9, '#b02a40'); k.circle(54, 22, 8, '#d8384a'); k.circle(52, 20, 5, '#e85060');
      k.with(() => { k.g.shadowColor = '#a870d3'; k.g.shadowBlur = 8 * ARENA_S; k.ring(128, 96, 142, '#8a5ac8', 0.7, 88, 3.3, 6.12); });
      k.with(() => { k.g.beginPath(); k.g.ellipse(128, 96, 142, 88, 0, 3.3, 6.12); k.g.closePath(); k.g.fillStyle = 'rgba(120,70,180,0.06)'; k.g.fill(); });
      // the skyline: towers of every height, lit windows, a water tank, antennae
      for (let layer = 0; layer < 2; layer++) {
        let x = -4;
        while (x < W) {
          const w = 7 + rand() * 9, h = layer ? 14 + rand() * 30 : 24 + rand() * 30, top = 70 - h, body = layer ? '#0c0816' : '#1a1028';
          k.rect(x, top, w, h + 4, body);
          if (layer) { k.rect(x + w - 1.2, top, 1.2, h, 'rgba(168,112,211,0.12)'); for (let wy = top + 2.5; wy < 66; wy += 2.8) for (let wx = x + 1.2; wx < x + w - 1.6; wx += 2) if (rand() < 0.3) k.rect(wx, wy, 1, 1.4, rand() < 0.7 ? '#8a6ab8' : '#e8b860'); }
          if (rand() < 0.3) k.line(x + w / 2, top, x + w / 2, top - 5, body, 0.4);
          if (layer && rand() < 0.15) { k.rect(x + 1, top - 3, 4, 3, body); k.line(x + 1.5, top, x + 1.5, top - 1, body, 0.3); }
          x += w + (layer ? 0.4 : 2);
        }
      }
      // the talisman seals, hung on ropes
      for (const x of [16, 228]) {
        k.line(x + 5.5, 0, x + 5.5, 26, '#4a3a5a', 0.4);
        k.rect(x, 26, 11, 22, '#e2d6c0'); k.rect(x, 26, 11, 22, k.vgrad(26, 48, ['rgba(0,0,0,0)', 'rgba(60,30,40,0.25)']));
        k.rect(x + 0.8, 26.8, 9.4, 20.4, 'rgba(0,0,0,0)'); k.ring(x + 5.5, 29.6, 2, '#a01a2a', 0.5);
        k.line(x + 5.5, 32, x + 5.5, 45, '#a01a2a', 0.8); for (const y of [34, 38, 42]) k.line(x + 2.4, y, x + 8.6, y + 0.6, '#a01a2a', 0.6); k.line(x + 3, 44, x + 8, 40, '#a01a2a', 0.4);
        k.poly([[x, 48], [x + 2, 50], [x + 4, 48], [x + 6, 50], [x + 8, 48], [x + 11, 50], [x + 11, 48]], '#e2d6c0');
      }
    },
    ambient(k, t) { // curses drifting like smoke; the dome shimmers
      for (let i = 0; i < 12; i++) { const u = (t * 0.1 + i / 12) % 1, x = (i * 29 + Math.sin(t + i) * 10) % W, y = 70 - u * 60; k.circle(x, y, 0.6 + u * 1.2, `rgba(168,112,211,${0.35 * (1 - u)})`); }
      const a = 3.3 + ((t * 0.5) % 2.82); k.glow(128 + Math.cos(a) * 142, 96 + Math.sin(a) * 88, 5, '#c8a0ff', 0.8);
    },
  },
  blacksea: {
    ground: ['#080c0e', '#1a2426'],
    floor: { top: '#4e5756', rim: '#dce6d4', side: '#202d30', art: (k, rand) => { floorArt.flags(k, rand, 13, ['#4e5756', '#485150', '#545e5c'], '#2e3634', 0.5); k.with(() => { k.g.globalAlpha = 0.6; floorArt.speckle(k, rand, 14, ['#1a1e20'], 4); }); floorArt.speckle(k, rand, 80, ['rgba(220,230,212,0.25)'], 0.5); } },
    bake(k, rand) { // a narrow shore, black water to every horizon, and far lights that are other worlds; the scholar's ink near
      k.sky(0, 50, ['#0a0c0e', '#161a1c', '#2a302e', '#4a524e']);
      k.stars(rand, 26, 2, 40, ['#5a625e', '#8a928a']);
      for (const [x, y, w] of [[60, 20, 90], [190, 30, 70]]) k.oval(x, y, w / 2, 3, 'rgba(70,80,76,0.35)');
      k.rect(0, 50, W, H - 50, k.vgrad(50, H, ['#18201f', '#0a0e10', '#050708']));
      for (let y = 51; y < 90; y += 1 + (y - 50) * 0.08) for (let i = 0; i < 6; i++) k.oval(rand() * W, y, 2 + rand() * 6 * (1 + (y - 50) / 20), 0.18 + (y - 50) * 0.01, rgba('#6a7a76', 0.25));
      // the far lights, each with its long reflection
      for (const [x, y, r] of [[30, 46, 1.6], [86, 42, 1], [150, 47, 2.4], [214, 44, 1.6], [244, 48.5, 1]]) {
        k.glow(x, y, r * 6, '#e8e4c8', 0.4); k.circle(x, y, r, '#f4f0dc');
        for (let i = 0; i < 10; i++) k.oval(x + (rand() - 0.5) * r, 51 + i * 2.2, r * (1.2 - i * 0.08), 0.25, rgba('#e8e4c8', 0.4 - i * 0.035));
      }
      // a broken pier on the left, a lamp on its last post
      for (const [x, h] of [[4, 18], [12, 14], [20, 11], [28, 9]]) { k.rect(x, 74 - h, 1.6, h + 8, '#121616'); k.rect(x, 74 - h, 0.5, h + 8, '#2a3230'); }
      k.poly([[0, 60], [26, 64], [26, 65.2], [0, 61.4]], '#1a1e1e');
      k.line(4.8, 56, 4.8, 50, '#121616', 0.5); k.glow(4.8, 49, 6, '#ffd890', 0.6); k.rect(3.8, 48, 2, 2.4, '#ffe0a0');
      // ink brushed across the near water
      for (const [x0, y0, len, w] of [[30, 66, 46, 2.4], [206, 60, 50, 2]]) k.with(() => {
        k.g.beginPath(); k.g.moveTo(x0, y0);
        k.g.bezierCurveTo(x0 + len * 0.3, y0 - w * 2, x0 + len * 0.6, y0 + w, x0 + len, y0 - w * 0.4);
        k.g.bezierCurveTo(x0 + len * 0.6, y0 + w * 1.6, x0 + len * 0.3, y0 - w * 0.4, x0, y0 + w * 0.6); k.g.closePath(); k.g.fillStyle = '#000'; k.g.fill();
        for (let i = 0; i < 6; i++) k.circle(x0 + len + 1 + i * 1.6, y0 - w * 0.4 + (rand() - 0.5), 0.5 - i * 0.06, '#000');
      });
    },
    ambient(k, t) { // the water moves; a ferry lamp crawls along the horizon
      for (let i = 0; i < 28; i++) { const x = (i * 37 + t * (3 + i % 3)) % W, y = 54 + (i * 11) % 80; k.oval(x, y, 2, 0.25, 'rgba(140,160,152,0.3)'); }
      const fx = (t * 4) % (W + 20) - 10; k.glow(fx, 49, 3, '#ffd890', 0.6); k.circle(fx, 49, 0.5, '#ffe8b0'); k.oval(fx, 52, 0.6, 1.6, 'rgba(255,216,144,0.3)');
    },
  },
  pallid: {
    ground: ['#c8b878', '#ece0a8'],
    floor: { top: '#a89e78', rim: '#efcf63', side: '#5c5545', art: (k, rand) => {
      for (let y = -R; y < R; y += 12) for (let x = -R; x < R; x += 12) k.rect(x, y, 12, 12, ((x + y) / 12) % 2 ? '#b0a680' : '#968c68');
      k.with(() => { k.g.globalAlpha = 0.6; floorArt.rings(k, [[40, '#efcf63', 1], [37, '#1a140a', 0.5]]); });
      for (let i = 0; i < 3; i++) { const a = -1.5708 + i * 2.0944; k.curve([[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a + 0.6) * 20, Math.sin(a + 0.6) * 20], [Math.cos(a + 0.2) * 32, Math.sin(a + 0.2) * 32]], '#1a140a', 1.2); }
      floorArt.speckle(k, rand, 50, ['rgba(60,50,30,0.25)'], 0.6);
    } },
    bake(k, rand) { // twin suns over a lake of cloud; the towers of the court; black stars in a yellow sky
      k.sky(0, 58, ['#241e14', '#54441e', '#a88a3a', '#e8d088', '#f4e8b8']);
      for (const [x, y, r] of [[44, 22, 9], [206, 16, 6]]) { k.glow(x, y, r * 6, '#fff4c0', 0.5); k.circle(x, y, r, '#f8eab8'); k.circle(x, y, r - 1.6, '#fff8e0'); }
      for (let i = 0; i < 10; i++) { const x = rand() * W, y = 4 + rand() * 30; k.glow(x, y, 3, '#000000', 0.4); k.circle(x, y, 0.6, '#0a0806'); }
      // the towers of the court: slender, banded in gold, crowned with spires
      for (const [x, w, h] of [[150, 7, 34], [161, 5, 46], [170, 9, 28], [183, 5, 40], [192, 6, 24]]) {
        k.rect(x, 62 - h, w, h, k.hgrad(x, x + w, ['#4a3e26', '#3a3020', '#241e12']));
        for (let y = 62 - h + 4; y < 60; y += 6) { k.rect(x, y, w, 0.6, '#8a7030'); k.rect(x + w / 2 - 0.5, y + 1.6, 1, 2.4, '#efcf63'); k.circle(x + w / 2, y + 1.6, 0.5, '#efcf63'); }
        k.poly([[x - 1, 62 - h], [x + w / 2, 48 - h], [x + w + 1, 62 - h]], '#2a2216'); k.poly([[x + w / 2, 48 - h], [x + w + 1, 62 - h], [x + w * 0.6, 62 - h]], '#5a4a2a');
        k.glow(x + w / 2, 50 - h, 3, '#efcf63', 0.7); k.circle(x + w / 2, 50 - h, 0.6, '#efcf63');
      }
      // the lake of cloud
      for (let row = 0; row < 4; row++) for (let x = -10 + row * 9; x < W + 20; x += 22 + rand() * 12) k.cloud(rand, x, 62 + row * 4 + rand() * 2, 26 + row * 6, 5 + row * 1.6, ['#c8b878', '#e8dcb0', '#fff8e0'], -1);
      // banners with the sign
      for (const x of [24, 232]) {
        k.line(x, 18, x, 70, '#2a2216', 0.8); k.circle(x, 18, 0.9, '#efcf63');
        k.g.beginPath(); k.g.moveTo(x + 0.4, 21); k.g.lineTo(x + 11, 21); k.g.lineTo(x + 11.4, 40); k.g.lineTo(x + 6, 37); k.g.lineTo(x + 0.4, 40); k.g.closePath(); k.g.fillStyle = k.hgrad(x, x + 11, ['#a88020', '#d8b030', '#b08a24']); k.g.fill();
        k.circle(x + 5.8, 28.6, 3, '#1a140a'); k.circle(x + 5.8, 28.6, 2.2, '#c8a028');
        for (let i = 0; i < 3; i++) { const a = -1.5708 + i * 2.0944; k.curve([[x + 5.8, 28.6], [x + 5.8 + Math.cos(a + 0.6) * 2.4, 28.6 + Math.sin(a + 0.6) * 2.4], [x + 5.8 + Math.cos(a + 0.2) * 3.8, 28.6 + Math.sin(a + 0.2) * 3.8]], '#1a140a', 0.5); }
      }
    },
    ambient(k, t) { // the black stars pulse; the cloud-lake drifts
      for (let i = 0; i < 6; i++) { const x = (i * 53 + 20) % W, y = 8 + (i * 7) % 26, a = Math.max(0, Math.sin(t * 2 + i)); k.glow(x, y, 4, '#000000', 0.5 * a); k.circle(x, y, 0.7 * a, '#000'); }
      for (let i = 0; i < 6; i++) k.oval((i * 47 + t * 5) % W, 62 + (i % 3) * 2, 6, 0.6, 'rgba(255,248,224,0.4)');
    },
  },
  bottom: {
    ground: ['#2e1e12', '#3e2a1a'],
    floor: { top: '#875b3d', rim: '#c8a470', side: '#4b2e20', art: (k, rand) => {
      for (let r = 8; r < R; r += 6 + rand() * 3) k.ring(0, 0, r, rgba('#5a3a24', 0.35), 0.5);
      floorArt.rings(k, [[32, '#b79766', 1]]); floorArt.cracks(k, rand, 10, 'rgba(60,36,20,0.6)', 0.4); floorArt.speckle(k, rand, 60, ['rgba(176,128,96,0.6)', 'rgba(90,60,40,0.5)'], 0.6);
    } },
    bake(k, rand) { // the bottom of the jar: clay curving up on every side, tallies in many hands, one shaft of light from the lid
      k.sky(0, 80, ['#0e0804', '#1e120a', '#2e1e12', '#3e2a1a']);
      for (let i = 0; i < 6; i++) { const y = 10 + i * 12; k.curve([[0, y + 10], [128, y - 6], [256, y + 10]], rgba('#5a3a24', 0.35), 0.6); }
      // the walls curving in at the sides, shaded
      k.poly([[0, 0], [34, 0], [64, 80], [0, 104]], k.hgrad(0, 64, ['#140a06', '#2e1c10', '#3a2416']));
      k.poly([[W, 0], [W - 34, 0], [W - 64, 80], [W, 104]], k.hgrad(W, W - 64, ['#140a06', '#2e1c10', '#3a2416']));
      // tallies scratched into the clay, many hands
      const tally = (x, y, c, s = 1) => { for (let j = 0; j < 4; j++) k.line(x + j * 1.8 * s, y, x + j * 1.8 * s + (rand() - 0.5) * 0.4, y + 5.4 * s, c, 0.45); k.line(x - 1, y + 5 * s, x + 6.6 * s, y + 0.6, c, 0.45); };
      for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 6; gy++) tally(5 + gx * 9 + gy * 1.5, 16 + gy * 9, gy % 2 ? '#7a5a40' : '#a07e5a');
      for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 5; gy++) tally(214 + gx * 9 - gy * 1.5, 20 + gy * 9, '#8a6a4a', 0.9);
      // the light from the lid
      k.poly([[108, 0], [148, 0], [172, 84], [84, 84]], k.vgrad(0, 84, ['rgba(255,236,190,0.22)', 'rgba(255,230,180,0.05)']));
      k.glow(128, 2, 40, '#fff0c8', 0.6, 14);
      k.oval(128, 2, 20, 5, '#4a3020'); k.oval(128, 2, 16, 3.6, '#fff4d4'); k.oval(128, 1.6, 12, 2.4, '#ffffff');
    },
    ambient(k, t) { // dust drifting down through the light
      for (let i = 0; i < 22; i++) { const u = (t * 0.06 + i / 22) % 1, x = 104 + (i * 23) % 48 + u * (i % 7) * 2 + Math.sin(t + i) * 3, y = u * 80; k.circle(x, y, 0.35, `rgba(255,236,200,${0.7 * (1 - u)})`); }
    },
  },
  summit: {
    ground: ['#1e2a40', '#2c3e5c'],
    floor: { top: '#b0bebc', rim: '#e4f2f6', side: '#61737b', art: (k, rand) => {
      floorArt.flags(k, rand, 14, ['#b0bebc', '#a8b6b4', '#bac6c4'], '#8a9a9a', 0.5);
      k.with(() => { k.g.shadowColor = '#9fd8ff'; k.g.shadowBlur = 4 * ARENA_S; k.line(-R, -R * 0.3, R, R * 0.3, '#eaf8ff', 0.9); });
      floorArt.speckle(k, rand, 60, ['rgba(255,255,255,0.6)'], 0.7);
    } },
    bake(k, rand) { // the top of the world at night: ridge after ridge of granite going pale into the mist, a pine on its cliff, and the sky he split still open
      k.sky(0, 70, ['#03051a', '#0a1236', '#1c2c62', '#41598f']);
      k.glow(150, 18, 160, '#5a78c8', 0.22, 46); // the split's light, spread through the haze
      k.stars(rand, 150, 1, 52, ['#8a9ac8', '#e0e8ff', '#5a6a98', '#ffffff']);
      for (const [x, y, s] of [[34, 10, 3.2], [206, 44, 2.2], [98, 6, 2], [176, 4, 1.6]]) { // a few bright ones, with points
        k.glow(x, y, s * 1.6, '#cfe0ff', 0.6); k.line(x - s, y, x + s, y, '#e8f0ff', 0.3); k.line(x, y - s, x, y + s, '#e8f0ff', 0.3); k.circle(x, y, 0.5, '#ffffff');
      }
      // the split: a tear of light across the sky, glowing
      k.with(() => { k.g.shadowColor = '#9fd8ff'; k.g.shadowBlur = 14 * ARENA_S;
        k.g.beginPath(); k.g.moveTo(-4, 31); k.g.quadraticCurveTo(128, 17, 260, 7.4); k.g.quadraticCurveTo(128, 21.4, -4, 32.6); k.g.closePath(); k.g.fillStyle = '#dff4ff'; k.g.fill(); });
      k.with(() => { k.g.beginPath(); k.g.moveTo(-4, 31.4); k.g.quadraticCurveTo(128, 18.8, 260, 7.8); k.g.lineWidth = 0.4; k.g.strokeStyle = '#ffffff'; k.g.stroke(); });
      const mist = (y0, y1, a) => k.rect(0, y0, W, y1 - y0, k.vgrad(y0, y1, ['rgba(140,166,226,0)', `rgba(140,166,226,${a})`, 'rgba(140,166,226,0)']));
      // granite spires, narrow and tall, their moonlit faces toward the split
      const spire = (x, base, w, h, body, lit) => {
        k.poly([[x - w, base], [x - w * 0.55, base - h * 0.55], [x - w * 0.3, base - h], [x + w * 0.2, base - h * 0.96], [x + w * 0.5, base - h * 0.5], [x + w, base]], body);
        k.poly([[x - w * 0.3, base - h], [x + w * 0.2, base - h * 0.96], [x + w * 0.5, base - h * 0.5], [x + w, base], [x + w * 0.35, base]], lit);
      };
      k.ridge(rand, 40, 14, 10, '#5d74a8', 70, true); // the farthest ranges, almost the colour of the sky
      mist(30, 46, 0.4);
      k.ridge(rand, 47, 12, 9, '#4f66a0', 70, true);
      // far off on its own peak, a spire with something built on it, and a cold glint
      spire(70, 50, 5, 28, '#4c629a', '#6a82b8'); k.rect(66.5, 21, 7, 1.4, '#3c5088'); k.poly([[67.5, 21], [70, 17.5], [72.5, 21]], '#3c5088'); k.rect(69.6, 10, 0.8, 8, '#3c5088');
      k.glow(70, 11, 9, '#7fe8ff', 0.7, 2); k.line(62, 11, 78, 11, 'rgba(160,240,255,0.7)', 0.3);
      mist(36, 54, 0.45);
      k.ridge(rand, 55, 10, 8, '#3c5088', 70, true);
      for (const [x, h, w] of [[22, 22, 7], [40, 15, 5], [118, 18, 6], [138, 26, 7], [160, 14, 5], [182, 20, 6]]) spire(x, 62, w, h, '#2e3e70', '#4c64a0');
      mist(48, 66, 0.5);
      // the sea of cloud the peaks stand in, its tops edged with the split's light
      for (let i = 0; i < 16; i++) {
        const x = (i * 17 + rand() * 10) % (W + 20) - 10, y = 63 + rand() * 6, w = 26 + rand() * 30, h = 5 + rand() * 3, seed = Math.floor(rand() * 1e6);
        k.cloud(mulberry32(seed), x, y - 0.7, w, h, ['#c8d8ff', '#dce6ff', '#f0f4ff'], 1); // the lit rim
        k.cloud(mulberry32(seed), x, y, w, h, ['#1c2850', '#2c3c6c', '#4a5e94'], 1);
      }
      // the near cliff on the right, pale granite under the moon, and the pine that grows out of it
      k.poly([[W + 4, -4], [242, 4], [234, 20], [238, 32], [229, 48], [233, 70], [W + 4, 70]], k.hgrad(228, W, ['#a8b6d4', '#7a8ab0', '#3e4a70']));
      for (const [x0, y0, x1, y1] of [[244, 8, 240, 22], [238, 34, 234, 46], [250, 18, 247, 40], [236, 52, 240, 66]]) k.line(x0, y0, x1, y1, 'rgba(30,36,60,0.6)', 0.5);
      k.curve([[238, 33], [229, 26], [220, 17], [214, 12]], '#1a1c26', 1.4); k.curve([[233, 50], [222, 46], [208, 45]], '#1a1c26', 1);
      for (const [x, y, w] of [[212, 12, 26], [225, 9, 15], [201, 17, 17], [219, 19, 15], [210, 45, 21], [197, 48, 14], [223, 43, 13]]) { // its flat, layered crowns of needles
        const seed = Math.floor(rand() * 1e6);
        k.cloud(mulberry32(seed), x, y + 0.5, w, 3.6, ['#7aa890', '#7aa890', '#9ac8aa'], -1); // moonlight on their tops
        k.cloud(mulberry32(seed), x, y + 1.2, w, 3.6, ['#0e221e', '#1e3c34', '#3a6656'], -1);
      }
      // a dark pine near on the left, framing the view
      k.line(4, 70, 6, -4, '#05080f', 2.2);
      for (let i = 0; i < 7; i++) { const y = 4 + i * 9, w = 9 + i * 1.6; k.poly([[5, y - 1], [5 + w, y + 2.6], [5 + w * 0.6, y + 3.6], [5, y + 2.4], [-4, y + 3]], '#05080f'); }
    },
    ambient(k, t) { // the split glows and the stars turn
      for (let i = 0; i < 40; i++) { const x = (i * 6.4 + t * 2) % W, y = 31 - x * 23.6 / 256 - 0.4; if ((i + Math.floor(t * 4)) % 5 === 0) k.glow(x, y, 2.4, '#ffffff', 0.8); }
      for (let i = 0; i < 12; i++) { const a = Math.sin(t * 3 + i * 7); if (a > 0.7) k.glow((i * 61) % W, (i * 17) % 56 + 4, 2, '#ffffff', a); }
    },
  },
  forest: {
    ground: ['#16261a', '#2a4428'],
    floor: { top: '#5a7a3a', rim: '#7e9a52', side: '#3a3c2c', art: (k, rand) => {
      // a grassy clearing: tufts of light and shade in the turf
      for (let i = 0; i < 260; i++) { const a = rand() * 6.2832, d = Math.sqrt(rand()) * R; k.oval(Math.cos(a) * d, Math.sin(a) * d, 2 + rand() * 5, 1.4 + rand() * 3, ['#527236', '#628440', '#4a6a30', '#6e9046', '#5e7e3a'][Math.floor(rand() * 5)]); }
      for (let i = 0; i < 160; i++) { const a = rand() * 6.2832, d = Math.sqrt(rand()) * R, x = Math.cos(a) * d, y = Math.sin(a) * d; k.line(x, y, x + (rand() - 0.5) * 1.2, y - 1.6 - rand(), rand() < 0.5 ? '#8aae5a' : '#3e5a28', 0.4); }
      // an old stone path round the middle, and a worn round stone at its heart, both half sunk in the grass
      for (let i = 0; i < 26; i++) { const a = i / 26 * 6.2832 + rand() * 0.08, d = 52 + (rand() - 0.5) * 4, x = Math.cos(a) * d, y = Math.sin(a) * d, w = 6 + rand() * 3, h = 4.5 + rand() * 2;
        k.oval(x + 0.6, y + 0.8, w / 2, h / 2, rgba('#1e2a14', 0.5)); k.oval(x, y, w / 2, h / 2, ['#8a8a74', '#7e806a', '#96967e'][Math.floor(rand() * 3)]); k.oval(x - 0.6, y - 0.6, w / 3, h / 4, rgba('#ffffff', 0.12)); if (rand() < 0.5) k.oval(x + w * 0.15, y + h * 0.1, w / 4, h / 4, rgba('#5e8e3a', 0.7)); }
      k.circle(0.8, 1, 17, rgba('#1e2a14', 0.45)); k.circle(0, 0, 17, '#8a8a72'); k.circle(-1, -1, 15, '#94947c');
      for (let i = 0; i < 14; i++) { const a = rand() * 6.2832, d = rand() * 15; k.oval(Math.cos(a) * d, Math.sin(a) * d, 2 + rand() * 3, 1.4 + rand() * 2, rgba('#5e8e3a', 0.6)); }
      // roots of the great tree running under the stage and out through it
      for (let i = 0; i < 4; i++) {
        const a = -2.2 + i * 1.5 + rand() * 0.5; let x = Math.cos(a) * R * 1.15, y = Math.sin(a) * R * 1.15, dir = a + Math.PI + (rand() - 0.5) * 0.6; const pts = [[x, y]];
        for (let j = 0; j < 6; j++) { dir += (rand() - 0.5) * 0.5; x += Math.cos(dir) * 8; y += Math.sin(dir) * 8; pts.push([x, y]); }
        for (let j = 0; j < pts.length - 1; j++) { // tapering as it goes in
          const w = 9 * (1 - j / pts.length) + 1.5, seg = [pts[j], pts[j + 1]];
          k.curve(seg, rgba('#000', 0.35), w + 1.6); k.curve(seg, '#4a3624', w); k.curve(seg.map(([x, y]) => [x - w * 0.15, y - w * 0.2]), '#7a5e40', w * 0.45);
        }
      }
      // an old elven ward circle, mostly grown over
      floorArt.rings(k, [[12, rgba('#e8f8b8', 0.45), 0.5], [14, rgba('#e8f8b8', 0.25), 0.3]]);
      floorArt.ticks(k, 12, 14, 9, rgba('#e8f8b8', 0.45), 0.35);
      // little flowers and fallen petals
      for (let i = 0; i < 40; i++) { const a = rand() * 6.2832, d = Math.sqrt(rand()) * R; k.circle(Math.cos(a) * d, Math.sin(a) * d, 0.5 + rand() * 0.5, ['#f0e0a0', '#f4b8c8', '#ffffff', '#b8d8ff'][Math.floor(rand() * 4)]); }
      floorArt.speckle(k, rand, 60, ['rgba(40,70,30,0.35)', 'rgba(230,240,170,0.18)']);
    } },
    bake(k, rand) { // dawn in a forest older than names: mist, a waterfall, the Life Tree burning gold in the distance, the elves' lanterns
      const g = k.g;
      k.sky(0, 64, ['#1a2840', '#34566a', '#7aa08a', '#d8d8a0', '#f8e8b8']);
      k.glow(128, 30, 120, '#fff2c0', 0.55, 60);
      // far ranges in the mist
      k.ridge(rand, 34, 7, 20, '#8eaaa0', 80); k.ridge(rand, 42, 6, 16, '#7a9a8c', 80);
      k.rect(0, 30, W, 22, k.vgrad(30, 52, [rgba('#f0f0d0', 0), rgba('#f0f0d0', 0.45)]));
      // a long-necked giant walking in the far mist
      const sauro = (x, y, s, c) => {
        k.oval(x, y, 7 * s, 3 * s, c); k.line(x - 4 * s, y, x - 4 * s, y + 4 * s, c, 1.4 * s); k.line(x + 4 * s, y, x + 4 * s, y + 4 * s, c, 1.4 * s);
        k.curve([[x + 5 * s, y - 1 * s], [x + 9 * s, y - 6 * s], [x + 10 * s, y - 13 * s]], c, 1.4 * s); k.oval(x + 11 * s, y - 13.4 * s, 1.6 * s, 0.9 * s, c);
        k.curve([[x - 6 * s, y], [x - 12 * s, y + 1 * s], [x - 16 * s, y + 3 * s]], c, 1 * s);
      };
      sauro(46, 29, 0.75, rgba('#5e7e78', 0.8)); sauro(66, 32, 0.45, rgba('#6e8e86', 0.65)); sauro(196, 30, 0.55, rgba('#6a8a82', 0.7));
      // the Life Tree: a colossal trunk far away, its crown filling the sky, light coming through it
      k.poly([[118, 64], [121, 40], [124, 26], [126, 14], [130, 14], [132, 26], [135, 40], [138, 64]], k.hgrad(118, 138, ['#4a5a48', '#7a8a6a', '#a8b48a', '#5a6a54']));
      for (const [sx, ex, ey] of [[121, 96, 30], [122, 104, 22], [135, 160, 30], [134, 152, 20], [128, 110, 12], [128, 148, 10]]) k.curve([[(sx + 128) / 2, 34], [sx, 24], [ex, ey]], '#6a7a5e', 1.4);
      k.with(() => { g.globalAlpha = 0.95;
        // a broad, layered crown: dark undersides, sunlit tops, and sky showing through between the boughs
        const tufts = [];
        for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 18 - layer * 4; i++) { // three tiers, each narrower and higher: a dome
          const u = (i + rand() * 0.7) / (18 - layer * 4), span = 124 - layer * 30, x = 128 + (u - 0.5) * span, arc = Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.5) * 2, 2)));
          tufts.push([x, 24 - layer * 7 - arc * (6 + layer * 2) + (rand() - 0.5) * 3, 4 + rand() * 3 + arc * 2.5]);
        }
        tufts.sort((p, q) => q[1] - p[1]);
        for (const [x, y, r] of tufts) k.oval(x, y + r * 0.35, r * 1.25, r * 0.55, '#2c4a36');
        for (const [x, y, r] of tufts) { k.oval(x, y, r * 1.2, r * 0.62, '#4e7a4e'); k.oval(x - r * 0.2, y - r * 0.22, r * 0.85, r * 0.38, '#6a9a5a'); k.oval(x - r * 0.35, y - r * 0.32, r * 0.42, r * 0.18, '#a8d07a'); }
      });
      k.with(() => { g.globalCompositeOperation = 'screen'; for (let i = 0; i < 26; i++) { const x = 74 + rand() * 108, y = 6 + rand() * 18; k.glow(x, y, 2 + rand() * 3, rand() < 0.5 ? '#fff4b0' : '#d8ffb0', 0.55); } });
      // light falling through the crown
      k.with(() => { g.globalCompositeOperation = 'screen';
        for (const [x, w] of [[92, 6], [110, 4], [146, 5], [166, 7], [128, 3]]) k.poly([[x - w / 2, 18], [x + w / 2, 18], [x + w * 2.4, 66], [x - w * 1.2, 66]], k.vgrad(18, 66, [rgba('#fff4c0', 0.28), rgba('#fff4c0', 0)]));
      });
      k.rect(0, 50, W, 16, k.vgrad(50, 66, [rgba('#e8f0d0', 0), rgba('#e8f0d0', 0.35)]));
      // the nearer forest: broad old trees, lit along their tops toward the tree's light
      const tree = (x, y, h, s, body, lit) => {
        k.rect(x - 1.2 * s, y - h, 2.4 * s, h, '#2e2a1e'); k.rect(x - 1.2 * s, y - h, 0.8 * s, h, rgba('#c8b080', 0.18));
        for (let i = 0; i < 6; i++) { const ox = (rand() - 0.5) * 12 * s, oy = -h - rand() * 8 * s, r = (4 + rand() * 4) * s; k.circle(x + ox, y + oy, r, body); k.circle(x + ox + (x < 128 ? 1 : -1) * r * 0.25, y + oy - r * 0.3, r * 0.6, lit); }
      };
      for (let x = -6; x < 70; x += 9 + rand() * 6) tree(x, 62, 10 + rand() * 8, 0.9, '#2c4a30', '#4e7a44');
      for (let x = 186; x < 262; x += 9 + rand() * 6) tree(x, 62, 10 + rand() * 8, 0.9, '#2c4a30', '#4e7a44');
      k.ridge(rand, 62, 3, 10, k.vgrad(58, 90, ['#22382a', '#18281c']), 100);
      // the waterfall, falling from a mossy cliff into a pool of mist
      k.poly([[-4, 20], [14, 18], [26, 24], [30, 44], [24, 76], [-4, 78]], k.hgrad(-4, 30, ['#2a3428', '#4a5a46', '#3a463a']));
      for (let i = 0; i < 8; i++) k.oval(4 + rand() * 22, 22 + rand() * 50, 3 + rand() * 4, 1.4, rgba('#5e8a3e', 0.7));
      k.rect(13, 22, 7, 50, k.vgrad(22, 72, ['#d8f0ff', '#a8d0e8', '#e8f8ff']));
      for (let x = 13.5; x < 20; x += 1.2) k.line(x, 22, x + 0.2, 72, rgba('#ffffff', 0.4), 0.25);
      k.glow(16, 72, 14, '#ffffff', 0.55, 6); k.oval(16, 74, 12, 2.5, rgba('#c8e8ff', 0.7));
      // the elves' tree-hall: a great trunk, a curved white arch, a platform hung with lanterns
      k.rect(226, 6, 14, 70, k.hgrad(226, 240, ['#3a3022', '#6a5a40', '#4a3e2c']));
      for (let y = 10; y < 74; y += 3) k.line(226, y, 240, y + 1, rgba('#2a2018', 0.35), 0.3);
      // its crown, dark against the dawn
      for (const [x, y, r] of [[226, 6, 9], [240, 4, 10], [252, 10, 8], [232, 14, 7], [248, 18, 6]]) { k.oval(x, y + 1, r * 1.2, r * 0.6, '#1e3626'); k.oval(x - 1, y - 1, r, r * 0.45, '#3a6040'); }
      k.with(() => { g.beginPath(); g.ellipse(233, 34, 16, 4.4, 0, 0, 6.2832); g.fillStyle = '#7a6a4a'; g.fill(); g.beginPath(); g.ellipse(233, 33.4, 16, 3.6, 0, 0, 6.2832); g.fillStyle = '#a8946a'; g.fill(); });
      k.rect(216, 33.4, 34, 1, '#f0e8d0');
      for (const x of [219, 247]) { k.rect(x - 0.6, 25, 1.2, 8.6, '#f0ead8'); k.rect(x - 0.6, 25, 0.4, 8.6, '#ffffff'); }
      k.curve([[219, 26], [222, 19], [233, 15], [244, 19], [247, 26]], '#f0ead8', 1.4); k.curve([[220.5, 26], [223, 20.6], [233, 17], [243, 20.6], [245.5, 26]], rgba('#c8b890', 0.9), 0.5);
      k.circle(233, 15.4, 1.2, '#d8ffb0'); k.glow(233, 15.4, 5, '#d8ffb0', 0.6); // a leaf-shaped gem at the arch's crown
      for (const [x, y] of [[221, 37], [233, 38], [245, 37], [229, 52], [238, 60]]) { k.line(x, y - 2.6, x, y - 1, '#5a4a30', 0.3); k.glow(x, y, 6, '#ffe39a', 0.8); k.circle(x, y, 0.9, '#fff2c0'); }
      k.curve([[226, 70], [218, 64], [236, 56], [226, 46], [238, 40]], rgba('#e8e0c8', 0.6), 0.5);
      // glowing mushrooms and great ferns in the near corners
      for (const [x, y, c] of [[34, 80, '#9ae8ff'], [38, 82, '#b8f0ff'], [212, 82, '#d8b8ff'], [217, 79, '#b8f0ff']]) { k.glow(x, y - 1, 5, c, 0.6); k.rect(x - 0.3, y - 1.5, 0.6, 2, '#e8e0d0'); k.oval(x, y - 1.6, 1.4, 0.7, c); }
      const fern = (x, y, dir, s) => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + dir * (0.2 + i * 0.2), L = (16 + rand() * 6) * s, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8 + L * 0.25; k.curve([[x, y], [(x + ex) / 2 + dir * 2, (y + ey) / 2 - 4], [ex, ey]], '#1c3420', 2.2 * s); k.curve([[x, y], [(x + ex) / 2 + dir * 2, (y + ey) / 2 - 4.5], [ex, ey - 0.4]], '#4a7a3a', 0.6 * s); } };
      fern(4, 112, 1, 1.1); fern(252, 114, -1, 1.1); fern(-2, 140, 1, 1.3); fern(258, 142, -1, 1.3);
    },
    ambient(k, t) { // fireflies and drifting spores, leaves falling from the crown, the waterfall moving
      for (let i = 0; i < 22; i++) { const x = (i * 53 + Math.sin(t * 0.6 + i) * 10 + t * 3) % W, y = 20 + (i * 29) % 70 + Math.sin(t * 0.9 + i * 2) * 4, a = 0.35 + 0.35 * Math.sin(t * 3 + i * 1.7); k.glow(x, y, 2.4, i % 3 ? '#f0ffa0' : '#b8ffd8', a); }
      for (let i = 0; i < 8; i++) { const u = (t * 0.07 + i / 8) % 1, x = 70 + i * 16 + Math.sin(u * 12 + i) * 6, y = 10 + u * 56; k.oval(x, y, 0.8, 0.4, rgba(i % 2 ? '#c8e070' : '#e8c060', 0.8 * (1 - u))); }
      for (let i = 0; i < 6; i++) { const y = 22 + ((t * 40 + i * 9) % 50); k.rect(13.5 + (i % 5) * 1.2, y, 0.5, 2.2, 'rgba(255,255,255,0.5)'); }
      for (const ph of [0, 1.7, 3.1]) { const x = ((t * 14 + ph * 60) % (W + 40)) - 20, y = 14 + Math.sin(t * 0.5 + ph) * 4, f = Math.sin(t * 7 + ph) * 0.9; k.curve([[x - 2, y - f], [x - 0.8, y - 0.3], [x, y]], '#2a3a30', 0.5); k.curve([[x + 2, y - f], [x + 0.8, y - 0.3], [x, y]], '#2a3a30', 0.5); }
    },
  },
};

// ---------- light and depth ----------
// each world's light: where it comes from, its colour, how far it reaches and how strong it is; the haze colour and
// the horizon it gathers on; how deep the shade at the picture's edges is
const ARENA_LIGHT = {
  frontier: { lights: [{ x: 196, y: 48, c: '#ffb050', reach: 170, power: 0.5 }], haze: '#e8a060', horizon: 62, shade: 0.45 },
  temple: { lights: [{ x: 128, y: 36, c: '#ffb070', reach: 170, power: 0.35 }, { x: 7, y: 68, c: '#ffc080', reach: 30, power: 0.4 }], haze: '#d89a6a', horizon: 58, shade: 0.45 },
  forest: { lights: [{ x: 128, y: 26, c: '#fff0b8', reach: 200, power: 0.4 }, { x: 233, y: 40, c: '#ffe39a', reach: 40, power: 0.35 }, { x: 16, y: 72, c: '#d8f0ff', reach: 30, power: 0.3 }], haze: '#c8dcb0', horizon: 60, shade: 0.5 },
  night: { lights: [{ x: 200, y: 28, c: '#b8c8ff', reach: 150, power: 0.35 }], haze: '#3a3458', horizon: 60, shade: 0.6 },
  peaks: { lights: [{ x: 60, y: -10, c: '#eef6ff', reach: 220, power: 0.3 }], haze: '#c8dae6', horizon: 60, shade: 0.35 },
  abyss: { lights: [{ x: 21, y: 60, c: '#ff6a2a', reach: 90, power: 0.5 }, { x: 233, y: 60, c: '#ff6a2a', reach: 90, power: 0.5 }, { x: 128, y: 170, c: '#ff3a1a', reach: 140, power: 0.4 }], haze: '#7a2018', horizon: 66, shade: 0.6 },
  isles: { lights: [{ x: 70, y: 42, c: '#ffd0c0', reach: 170, power: 0.4 }], haze: '#e8a0a8', horizon: 55, shade: 0.45 },
  heavens: { lights: [{ x: 206, y: 18, c: '#fff0b0', reach: 230, power: 0.35 }], haze: '#fff4dc', horizon: 58, shade: 0.25 },
  timestream: { lights: [{ x: 128, y: 40, c: '#6ae8e0', reach: 170, power: 0.3 }], haze: '#14404c', horizon: 66, shade: 0.55 },
  cursed: { lights: [{ x: 54, y: 22, c: '#ff4060', reach: 150, power: 0.35 }], haze: '#3a2058', horizon: 64, shade: 0.6 },
  blacksea: { lights: [{ x: 150, y: 47, c: '#e8e4c8', reach: 90, power: 0.3 }, { x: 30, y: 46, c: '#e8e4c8', reach: 50, power: 0.2 }], haze: '#4a524e', horizon: 50, shade: 0.65 },
  pallid: { lights: [{ x: 44, y: 22, c: '#fff4c0', reach: 160, power: 0.4 }, { x: 206, y: 16, c: '#fff4c0', reach: 120, power: 0.3 }], haze: '#e8d498', horizon: 60, shade: 0.4 },
  bottom: { lights: [{ x: 128, y: 4, c: '#fff0c8', reach: 150, power: 0.45 }], haze: '#3a2618', horizon: 80, shade: 0.65 },
  summit: { lights: [{ x: 128, y: 20, c: '#cfe8ff', reach: 190, power: 0.3 }], haze: '#24365a', horizon: 66, shade: 0.55 },
};

// The scene behind the stage, baked once per world at ARENA_S times the fight's resolution: ground, scene, haze on
// the horizon, the stage's soft shadow, the stage lit from its light's side, then the light over everything and
// shade at the edges.
function bakeWorldArena(id) {
  const sc = WORLD_SCENES[id], L = ARENA_LIGHT[id];
  if (!sc) return null;
  const S = ARENA_S, c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const g = c.getContext('2d'), k = paintKit(g), rand = mulberry32(431 + Object.keys(WORLD_SCENES).indexOf(id) * 97);
  const screen = () => g.setTransform(S, 0, 0, S, 0, 0), stage = () => g.setTransform(S, 0, 0, S * SQ, CX * S, CY * S);
  screen();
  const hz = L ? L.horizon : 64, RY = R * SQ;
  k.rect(0, 0, W, H, k.vgrad(hz, H, [sc.ground[1], sc.ground[0]]));
  sc.bake(k, rand);
  if (L) k.rect(0, hz - 16, W, 32, k.vgrad(hz - 16, hz + 16, [rgba(L.haze, 0), rgba(L.haze, 0.3), rgba(L.haze, 0)]));
  const lit = L && L.lights[0], ldx = lit ? lit.x - CX : 0, ldy = lit ? lit.y - CY : -1, ln = Math.hypot(ldx, ldy) || 1, dir = [ldx / ln, ldy / ln];
  // the stage's shadow, soft, thrown away from the light
  k.with(() => { g.filter = `blur(${3 * S}px)`; k.oval(CX - dir[0] * 7, CY + 11, R + 6, RY + 4, 'rgba(0,0,0,0.5)'); });
  // the stage's side: stone courses darkening downward, lit on the light's side
  const f = sc.floor;
  k.oval(CX, CY + 7, R, RY, k.vgrad(CY + RY * 0.5, CY + RY + 7, [f.side, tone(f.side, -0.45)]));
  k.with(() => {
    g.beginPath(); g.ellipse(CX, CY + 7, R, RY, 0, 0, 6.2832); g.clip();
    k.rect(CX - R, CY, 2 * R, RY + 8, k.hgrad(CX - R, CX + R, [rgba('#000', dir[0] > 0 ? 0.35 : 0), 'rgba(0,0,0,0)', rgba('#000', dir[0] > 0 ? 0 : 0.35)]));
    for (let a = 0.08; a < Math.PI; a += 0.16) { const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * RY; k.line(x, y, x, y + 7.4, rgba(tone(f.side, -0.6), 0.6), 0.35); }
    for (let a = 0.02; a < Math.PI; a += 0.02) { const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * RY + 3.6; k.rect(x, y, 1.2, 0.3, rgba(tone(f.side, -0.6), 0.5)); }
  });
  // the top: its own floor, then light across it toward the light and shade at its edge
  k.with(() => {
    stage(); g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.clip();
    k.circle(0, 0, R, f.top); f.art(k, mulberry32(77));
    const gl = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R); gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,0.28)'); k.circle(0, 0, R, gl);
    screen(); const gx = g.createLinearGradient(CX + dir[0] * R, CY + dir[1] * RY, CX - dir[0] * R, CY - dir[1] * RY);
    gx.addColorStop(0, 'rgba(255,248,230,0.16)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,0.22)'); k.rect(0, 0, W, H, gx);
  });
  // the rim: a raised edge, catching the light on one side
  k.ring(CX, CY, R - 1.1, f.rim, 2.2, RY - 1.1);
  k.ring(CX, CY, R - 2.4, rgba('#000', 0.3), 0.4, RY - 2.4);
  k.with(() => { const gr = g.createLinearGradient(CX + dir[0] * R, CY + dir[1] * RY, CX - dir[0] * R, CY - dir[1] * RY); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)'); k.ring(CX, CY, R - 0.4, gr, 0.8, RY - 0.4); });
  if (L) {
    // light over everything, then the edges falling into shade
    k.with(() => { g.globalCompositeOperation = 'screen'; for (const l of L.lights) k.glow(l.x, l.y, l.reach, l.c, l.power); });
    const vg = g.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(6,4,3,0)'); vg.addColorStop(1, `rgba(6,4,3,${L.shade})`); k.rect(0, 0, W, H, vg);
  }
  // Sample the distant scene on a coarser grid, then restore the stage from a finer grid.
  // Both samples come from the same finished painting, so their lighting and shadows agree.
  const P = ARENA_PX, B = WORLD_BG_PX, p = document.createElement('canvas'); p.width = W * P; p.height = H * P;
  const coarse = document.createElement('canvas'); coarse.width = W * B; coarse.height = H * B;
  const cg = coarse.getContext('2d'); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high';
  cg.drawImage(c, 0, 0, coarse.width, coarse.height);
  const pg = p.getContext('2d', { willReadFrequently: true });
  pg.imageSmoothingEnabled = false; pg.drawImage(coarse, 0, 0, p.width, p.height);
  // The two ellipses cover the top and front wall of the actual fighting platform.
  pg.save(); pg.setTransform(P, 0, 0, P, 0, 0); pg.beginPath();
  pg.ellipse(CX, CY, R, RY, 0, 0, Math.PI * 2);
  pg.moveTo(CX + R, CY + 7); pg.ellipse(CX, CY + 7, R, RY, 0, 0, Math.PI * 2);
  pg.clip(); pg.setTransform(1, 0, 0, 1, 0, 0);
  pg.imageSmoothingEnabled = true; pg.imageSmoothingQuality = 'high'; pg.drawImage(c, 0, 0, p.width, p.height);
  pg.restore();
  const img = pg.getImageData(0, 0, W * P, H * P), d = img.data, q = 14;
  for (let i = 0; i < d.length; i += 4) { // brightness in bands, hue kept (stepping each channel alone tints the bands)
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3 + 0.01, k = Math.max(q / 2, Math.round(l / q) * q) / l;
    d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  pg.putImageData(img, 0, 0);
  return p;
}

// What moves behind the fight (and only behind it: drawn on the backdrop, under the fighters). g is set up in the
// fight's coordinates.
function drawWorldAmbient(g, id, t) {
  const sc = WORLD_SCENES[id];
  if (sc && sc.ambient) sc.ambient(paintKit(g), t);
}
