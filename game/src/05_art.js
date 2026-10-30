// Scenery art: trees, rocks, mountains, little ground details, all baked once into crisp sprites (see ART.md).
// Each prop is one inked silhouette with cel-shaded paint on top; wind sway and glows are added when drawn.
const SPR_SC = 3;
const Spr = { cache: {} };
function sprite(key, w, h, ox, oy, fn) {
  let s = Spr.cache[key];
  if (s) return s;
  const c = mkCanvas(w * SPR_SC, h * SPR_SC), g = c.getContext('2d');
  g.scale(SPR_SC, SPR_SC); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
  fn(g);
  s = { c, w, h, ox, oy };
  Spr.cache[key] = s;
  return s;
}
function drawSprite(c, s, x, y, sc, flip) {
  sc = sc || 1;
  if (flip) { c.save(); c.translate(x, y); c.scale(-sc, sc); c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); c.restore(); }
  else c.drawImage(s.c, x - s.ox * sc, y - s.oy * sc, s.w * sc, s.h * sc);
}
// a shape made of circles with one outline around the whole union
function blobShape(g, circles, fill, hl) {
  g.lineWidth = OUTW * 2; g.strokeStyle = OUT;
  for (const [x, y, r] of circles) { circ(g, x, y, r); g.stroke(); }
  g.fillStyle = fill;
  for (const [x, y, r] of circles) { circ(g, x, y, r); g.fill(); }
  if (hl) { g.fillStyle = hl; for (const [x, y, r] of circles) { circ(g, x - r * 0.25, y - r * 0.3, r * 0.55); g.fill(); } }
}
// a classic dog bone, centred at x,y, len long, turned by a
function drawBone(g, x, y, len, a, fill, lw) {
  const r = len * 0.17, h = len * 0.13, e = len / 2 - r * 0.6;
  g.save(); g.translate(x, y); g.rotate(a);
  const shape = () => { g.beginPath(); g.rect(-e, -h / 2, e * 2, h); g.moveTo(-e + r, -r * 0.7); g.arc(-e, -r * 0.7, r, 0, TAU); g.moveTo(-e + r, r * 0.7); g.arc(-e, r * 0.7, r, 0, TAU); g.moveTo(e + r, -r * 0.7); g.arc(e, -r * 0.7, r, 0, TAU); g.moveTo(e + r, r * 0.7); g.arc(e, r * 0.7, r, 0, TAU); };
  shape(); g.lineWidth = (lw || OUTW) * 2; g.strokeStyle = OUT; g.stroke();
  shape(); g.fillStyle = fill; g.fill();
  g.restore();
}
function shadowEl(g, rx, ry, a) { g.fillStyle = `rgba(40,25,60,${a || 0.2})`; ell(g, 0, 0, rx, ry); g.fill(); }

// ---------- ink and paint for sprites
// shapes are functions that add subpaths to a context: q => { q.moveTo(...); ... }
const circlesP = (list) => (q) => { for (const [x, y, r] of list) { q.moveTo(x + r, y); q.arc(x, y, r, 0, TAU); } };
const polyP = (pts) => (q) => { q.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) q.lineTo(pts[i][0], pts[i][1]); q.closePath(); };
const joinP = (...fs) => (q) => { for (const f of fs) f(q); };
// one plum silhouette for the whole shape, heavier on the lower right
function inkSil(g, shape, w) {
  w = w || OUTW;
  g.save(); g.fillStyle = OUT; g.strokeStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = w * 2;
  g.beginPath(); shape(g); g.stroke(); g.fill();
  g.translate(0.75, 0.95); g.lineWidth = w * 1.9; g.beginPath(); shape(g); g.stroke(); g.fill();
  g.restore();
}
function clipTo(g, shape, dx, dy) { g.save(); g.translate(dx || 0, dy || 0); g.beginPath(); shape(g); g.restore(); g.clip(); }
function fillS(g, shape, col, dx, dy, a) {
  g.save(); g.translate(dx || 0, dy || 0); g.beginPath(); shape(g); g.restore();
  g.fillStyle = col; if (a != null) g.globalAlpha = a; g.fill(); if (a != null) g.globalAlpha = 1;
}
// cel shading for any shape (unions of overlapping parts too): shadow band lower right with a soft step, highlight upper left
function cel(g, shape, base, o) {
  o = o || {};
  const T = tones(base), s = o.s == null ? 4 : o.s, sh = o.sh || T.sh, hi = o.hi === false ? null : o.hi || T.hi;
  const ax = o.ax == null ? -s : o.ax, ay = o.ay == null ? -s * 1.2 : o.ay;
  g.save(); clipTo(g, shape);
  g.fillStyle = sh; g.fillRect(-600, -600, 1200, 1200);
  fillS(g, shape, mix(sh, base, 0.55), ax * 0.5, ay * 0.5);
  fillS(g, shape, base, ax, ay);
  if (hi) {
    clipTo(g, shape, ax, ay);
    const hs = o.hs == null ? s * 0.75 : o.hs;
    g.fillStyle = hi; g.globalAlpha = o.ha == null ? 0.9 : o.ha; g.fillRect(-600, -600, 1200, 1200); g.globalAlpha = 1;
    fillS(g, shape, base, ax + hs, ay + hs * 1.15);
  }
  g.restore();
}
// a thin tapered interior line (60% weight, used sparingly)
function inkLine(g, pts, w, col) { taperLine(g, pts, w || OUTW * 0.6, col || OUT); }
// cheap soft ground shadow + contact occlusion, purple and nudged to the lower right
function groundShadow(g, rx, ry, a, dx) { softShadow(g, dx == null ? rx * 0.18 : dx, ry * 0.15, rx, ry, a == null ? 0.26 : a); }

// ---------- palettes
const TREEPAL = {
  meadow: '#6bc049', forest: '#4f9c45', plains: '#79c64c', coast: '#72c351', isle: '#e48cba', desert: '#8fbf4c', snow: '#4f9a6a', spooky: '#6f5f8f',
  autumn: '#f0973a', autumn2: '#e2603b', gold: '#f2c242', red: '#d4493b',
};
const CANOPY = {};
for (const k in TREEPAL) CANOPY[k] = [TREEPAL[k], lightTone(TREEPAL[k], 0.3)];
const LEAFC = { autumn: ['#f0973a', '#f7b955', '#e2603b'], autumn2: ['#e2603b', '#f0973a', '#c94a3a'], gold: ['#f2c242', '#f7d870', '#f0973a'], red: ['#d4493b', '#e2603b', '#f0973a'] };
// it is autumn: about half the meadow and plains trees have turned
function treePal(p, b) {
  if (p.pal) return p.pal;
  const h = hash2(Math.round(p.x), Math.round(p.y), 71);
  let pal = b;
  if (b === 'meadow' || b === 'plains') pal = h < 0.17 ? 'autumn' : h < 0.3 ? 'autumn2' : h < 0.42 ? 'gold' : h < 0.48 ? 'red' : b;
  else if (b === 'forest') pal = h < 0.12 ? 'autumn' : h < 0.19 ? 'gold' : h < 0.23 ? 'autumn2' : b;
  return (p.pal = pal);
}

// canopy clumps per variant: a puffy rim of clumps around a core, front clumps last
function makeClumps(seed, cx, cy, rx, ry, n, r0, r1) {
  const rng = mulberry32(seed), rim = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * TAU + (rng() - 0.5) * 0.4, r = r0 + rng() * (r1 - r0);
    rim.push([cx + Math.cos(a) * (rx - r * 0.72), cy + Math.sin(a) * (ry - r * 0.72), r]);
  }
  const core = [[cx, cy + ry * 0.05, Math.min(rx, ry) * 0.78], [cx - rx * 0.25, cy - ry * 0.2, r1 * 0.95], [cx + rx * 0.22, cy + ry * 0.15, r1 * 0.9]];
  rim.sort((p, q) => p[1] - q[1]);
  return { core, rim, all: core.concat(rim) };
}
const TREE_CL = [
  makeClumps(11, 0, -54, 29, 25, 9, 10, 14),
  makeClumps(23, 0, -58, 25, 29, 9, 9, 13),
  makeClumps(37, 0, -50, 33, 22, 10, 9, 13),
  makeClumps(41, 2, -55, 28, 26, 8, 11, 15),
];
// paint a foliage mass: core in shade, every clump with a dark rim to its lower right, lit body and a highlight cluster
function paintFoliage(g, cl, leaf, o) {
  o = o || {};
  const T = tones(leaf), cx = o.cx || 0, cy = o.cy || -50, R = o.R || 28;
  const sil = circlesP(cl.all);
  g.save(); clipTo(g, sil);
  g.fillStyle = T.sh2; g.fillRect(-300, -300, 600, 600);
  for (const [x, y, r] of cl.core) { fillS(g, circlesP([[x - 2, y - 3, r]]), T.sh); }
  for (const [x, y, r] of cl.rim) {
    const lit = clamp(0.55 - ((x - cx) / R) * 0.42 - ((y - cy) / R) * 0.5, 0, 1);
    const body = lit > 0.62 ? leaf : lit > 0.3 ? mix(T.sh, leaf, 0.72) : mix(T.sh, leaf, 0.38);
    fillS(g, circlesP([[x, y, r]]), lit > 0.3 ? T.sh : T.sh2);
    const bx = x - r * 0.13, by = y - r * 0.17, br = r * 0.9;
    fillS(g, circlesP([[bx, by, br]]), body);
    if (lit > 0.35) {
      g.save(); clipTo(g, circlesP([[bx, by, br]]));
      fillS(g, circlesP([[bx - br * 0.36, by - br * 0.42, br * 0.62]]), lit > 0.7 ? T.hi : mix(body, T.hi, 0.6));
      if (lit > 0.7) fillS(g, circlesP([[bx - br * 0.45, by - br * 0.52, br * 0.3]]), T.hi2, 0, 0, 0.8);
      g.restore();
    }
  }
  // leaf texture: little scallops in shadow, specks of light
  const rng = mulberry32((o.seed || 5) * 31 + 7);
  for (const [x, y, r] of cl.rim) {
    if (rng() < 0.45) continue;
    const a = rng() * TAU, d = r * (0.25 + rng() * 0.4), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, sz = 1.8 + rng() * 1.6;
    const lit = clamp(0.55 - ((px - cx) / R) * 0.42 - ((py - cy) / R) * 0.5, 0, 1);
    if (lit < 0.5) { taperLine(g, qpts(px - sz, py - sz * 0.5, px - sz * 0.2, py + sz * 0.6, px + sz * 0.3, py - sz * 0.2, 5), 1.2, T.sh2); }
    else { g.fillStyle = T.hi2; g.globalAlpha = 0.85; for (const [ox, oy, rr] of [[0, 0, 1.3], [1.8, 0.9, 0.9], [-1.2, 1.3, 0.8]]) { circ(g, px + ox, py + oy, rr * sz * 0.6); g.fill(); } g.globalAlpha = 1; }
  }
  g.restore();
}

// a tapered trunk with flared roots
function trunkP(w, top, lean) {
  lean = lean || 0;
  return (q) => {
    q.moveTo(-w - 4, 0); q.quadraticCurveTo(-w - 0.5, -1.5, -w + 0.5, -9);
    q.lineTo(-w * 0.62 + lean, top); q.lineTo(w * 0.62 + lean, top);
    q.lineTo(w - 0.5, -9); q.quadraticCurveTo(w + 0.5, -1.5, w + 5, 0.5);
    q.quadraticCurveTo(w * 0.4, 2.2, 0, 1.2); q.quadraticCurveTo(-w * 0.5, 2.4, -w - 4, 0); q.closePath();
  };
}
function paintTrunk(g, tp, col, top, w) {
  cel(g, tp, col, { s: 3, ay: 0, ax: -w * 0.55, hs: 1.6 });
  g.save(); clipTo(g, tp);
  const d = shadeTone(col, 0.42);
  taperLine(g, qpts(-w * 0.2, -3, -w * 0.35, (top - 3) / 2, -w * 0.05, top + 4, 6), 1.3, d);
  taperLine(g, qpts(w * 0.35, -6, w * 0.15, top * 0.45, w * 0.3, top + 10, 6), 1.2, d);
  taperLine(g, qpts(-w * 0.5, -12, -w * 0.25, -16, -w * 0.4, -21, 4), 1, lightTone(col, 0.3));
  g.restore();
}

// ---------- the props (base at 0,0; up is negative)
const PropArt = {
  tree(g, v, b, pal) {
    const leaf = TREEPAL[pal] || TREEPAL[b] || TREEPAL.meadow;
    const trunkCol = b === 'spooky' ? '#7a5b6e' : b === 'isle' ? '#a8735a' : '#9a6a45';
    const cl = TREE_CL[v % 4], top = -36;
    groundShadow(g, 31, 9.5, 0.3, 8); softShadow(g, 2, 0.5, 11, 3.5, 0.35);
    const tp = trunkP(6.5, top);
    const sil = circlesP(cl.all);
    inkSil(g, joinP(tp, sil));
    paintTrunk(g, tp, trunkCol, top, 6.5);
    // the canopy's shade falls on the top of the trunk
    g.save(); clipTo(g, tp); g.fillStyle = shadeTone(trunkCol, 0.55); ell(g, 1, top - 2, 10, 9); g.fill(); g.restore();
    paintFoliage(g, cl, leaf, { cy: -54, R: 29, seed: v + 1 });
    if (pal === 'meadow' && v === 1) for (const [x, y] of [[-12, -50], [9, -60], [14, -44], [-3, -68], [-15, -38]]) { circ(g, x, y, 3.4); fo(g, '#e8473b', 1.1); g.fillStyle = '#ff9c8a'; circ(g, x - 1, y - 1.1, 1.1); g.fill(); }
    if (pal === 'isle' && v % 2 === 0) for (const [x, y] of [[-12, -50], [9, -62], [14, -46], [-5, -68], [-17, -40], [3, -50]]) { g.fillStyle = '#fff3fa'; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circ(g, x + Math.cos(a) * 2, y + Math.sin(a) * 2, 1.6); g.fill(); } g.fillStyle = '#f7c548'; circ(g, x, y, 1); g.fill(); }
  },
  pine(g, v, b) {
    const snow = b === 'snow', spook = b === 'spooky';
    const col = spook ? '#5b4d7a' : snow ? '#3d8a62' : '#3f904f';
    const T = tones(col);
    groundShadow(g, 23, 7.5, 0.3, 6); softShadow(g, 1, 0.5, 8, 3, 0.35);
    const tiers = v % 2 ? [[-9, 24, 26], [-24, 20, 24], [-38, 15, 21], [-51, 10, 18]] : [[-10, 22, 25], [-25, 18, 23], [-39, 13.5, 20], [-51, 9, 17]];
    const tierP = ([y, w, h]) => (q) => {
      q.moveTo(-w, y);
      q.lineTo(-w * 0.3, y - h * 0.62); q.quadraticCurveTo(-w * 0.08, y - h * 0.95, 0, y - h); q.quadraticCurveTo(w * 0.08, y - h * 0.95, w * 0.3, y - h * 0.62);
      q.lineTo(w, y);
      const n = 4;
      for (let k = n - 1; k >= 0; k--) { const xb = -w + (k * 2 * w) / n, xa = xb + (2 * w) / n; q.quadraticCurveTo((xa + xb) / 2, y + 4.5, xb, y); }
      q.closePath();
    };
    const tp = (q) => { q.moveTo(-4, 1); q.lineTo(-3.4, -12); q.lineTo(3.4, -12); q.lineTo(4.5, 1); q.closePath(); };
    const all = joinP(tp, ...tiers.map(tierP));
    inkSil(g, all);
    cel(g, tp, '#8a5a3c', { s: 2.5, ay: 0, ax: -3 });
    g.save(); clipTo(g, all);
    for (let i = 0; i < tiers.length; i++) {
      const sh = tierP(tiers[i]), [y, w, h] = tiers[i];
      // the tier above drops a shadow onto this one
      if (i > 0) fillS(g, tierP(tiers[i]), T.sh2, 1.5, 5, 0.85);
      fillS(g, sh, col);
      g.save(); clipTo(g, sh);
      // right side in shade, lit sliver on the left
      g.fillStyle = T.sh; g.beginPath(); g.moveTo(0, y - h - 2); g.quadraticCurveTo(w * 0.12, y - h * 0.45, w * 0.2, y + 6); g.lineTo(w + 6, y + 6); g.lineTo(w + 6, y - h - 2); g.closePath(); g.fill();
      g.fillStyle = T.hi; g.beginPath(); g.moveTo(-1, y - h + 2); g.quadraticCurveTo(-w * 0.35, y - h * 0.35, -w * 0.78, y + 1); g.lineTo(-w * 0.5, y + 1); g.quadraticCurveTo(-w * 0.2, y - h * 0.4, -1, y - h + 2); g.fill();
      taperLine(g, qpts(-w * 0.15, y - h * 0.3, -w * 0.3, y - h * 0.1, -w * 0.4, y + 2, 5), 1.2, T.hi2);
      taperLine(g, qpts(w * 0.35, y - h * 0.25, w * 0.45, y - h * 0.05, w * 0.55, y + 2, 5), 1.2, T.sh2);
      if (snow) {
        const sp = (q) => { q.moveTo(-w * 0.62, y - h * 0.32); q.quadraticCurveTo(-w * 0.2, y - h * 0.12, -w * 0.05, y - h * 0.3); q.quadraticCurveTo(w * 0.25, y - h * 0.08, w * 0.6, y - h * 0.34); q.lineTo(w * 0.12, y - h * 0.92); q.quadraticCurveTo(0, y - h - 1, -w * 0.12, y - h * 0.92); q.closePath(); };
        fillS(g, sp, '#ffffff');
        g.save(); clipTo(g, sp); g.fillStyle = '#cfdff2'; g.beginPath(); g.moveTo(0, y - h); g.quadraticCurveTo(w * 0.1, y - h * 0.5, w * 0.15, y); g.lineTo(w, y); g.lineTo(w, y - h); g.fill(); g.restore();
      }
      g.restore();
    }
    g.restore();
  },
  palm(g, v) {
    groundShadow(g, 26, 8, 0.28, 10); softShadow(g, 1, 0.5, 8, 3, 0.35);
    const lean = v % 2 ? -1 : 1, cx = 9 * lean, cy = -60;
    const trunk = (q) => { q.moveTo(-5.5, 0.5); q.quadraticCurveTo(-3 + lean * 1, -32, cx - 3.2, cy + 2); q.lineTo(cx + 3.6, cy + 3); q.quadraticCurveTo(4.5 + lean * 2, -30, 6, 0.5); q.quadraticCurveTo(0, 2, -5.5, 0.5); q.closePath(); };
    // [direction, length, droop]: back fronds first, the front ones last
    const fr = [[-1.95, 24, 4], [-1.15, 24, 4], [-2.75, 32, 14], [-0.4, 32, 14], [3.0, 30, 22], [0.15, 30, 22], [2.35, 22, 20], [0.8, 22, 20]];
    const frond = ([a, L, dr]) => {
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.55 + dr;
      const mx = cx + Math.cos(a) * L * 0.55, my = cy + Math.sin(a) * L * 0.3 - 10 + dr * 0.15;
      const dl = Math.hypot(ex - cx, ey - cy) || 1, nx = -(ey - cy) / dl, ny = (ex - cx) / dl;
      return { ex, ey, mx, my, nx, ny, a, P: (q) => {
        q.moveTo(cx, cy);
        q.quadraticCurveTo(mx - nx * 5, my - ny * 5, ex, ey);
        // a serrated lower edge, like palm leaflets
        const n = 5;
        for (let k = n; k > 0; k--) {
          const t = k / n, t2 = (k - 0.5) / n, u = 1 - t, u2 = 1 - t2;
          const px = u * u * cx + 2 * u * t * mx + t * t * ex, py = u * u * cy + 2 * u * t * my + t * t * ey;
          const qx = u2 * u2 * cx + 2 * u2 * t2 * mx + t2 * t2 * ex, qy = u2 * u2 * cy + 2 * u2 * t2 * my + t2 * t2 * ey;
          const wd = 7 * Math.pow(Math.sin(t2 * Math.PI), 0.7) + 1;
          q.lineTo(qx + nx * wd + (ex - cx) / dl * 2.5, qy + ny * wd + (ey - cy) / dl * 2.5 + 1.5);
          q.lineTo(px + nx * wd * 0.3, py + ny * wd * 0.3);
        }
        q.closePath();
      } };
    };
    const fronds = fr.map(frond);
    const nuts = [[cx - 3, cy + 4, 3.6], [cx + 3, cy + 4.5, 3.6], [cx, cy + 1.5, 3.4]];
    inkSil(g, joinP(trunk, ...fronds.map((f) => f.P), circlesP(nuts)));
    const tc = '#c99a5f';
    cel(g, trunk, tc, { s: 3, ax: -4, ay: 0, hs: 1.8 });
    g.save(); clipTo(g, trunk);
    for (let i = 1; i < 9; i++) { const t = i / 9, x = lerp(0, cx, t * t) + lean * Math.sin(t * 3) * 1.5, y = -t * 58; taperLine(g, qpts(x - 6, y + 1, x, y + 3.2, x + 6, y + 1, 5), 1.3, shadeTone(tc, 0.42)); }
    g.restore();
    const leaf = '#5fb848', T = tones(leaf);
    for (const f of fronds) {
      const up = f.ey < cy + 4;
      fillS(g, f.P, up ? mix(T.sh, leaf, 0.5) : leaf);
      g.save(); clipTo(g, f.P);
      // the underside of each leaf is in shade
      g.fillStyle = T.sh; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(f.mx, f.my, f.ex, f.ey); g.lineTo(f.ex + f.nx * 12, f.ey + f.ny * 12 + 8); g.lineTo(cx + f.nx * 12, cy + f.ny * 12 + 8); g.closePath(); g.fill();
      taperLine(g, qpts(cx, cy, f.mx - f.nx * 4, f.my - f.ny * 4, f.ex, f.ey, 8), 1.4, up ? T.sh2 : T.hi);
      g.restore();
    }
    for (const [x, y, r] of nuts) { cel(g, circlesP([[x, y, r]]), '#8a5a34', { s: 1.4 }); }
  },
  dead(g, v, b) {
    groundShadow(g, 21, 6.5, 0.28, 6); softShadow(g, 1, 0.5, 8, 3, 0.35);
    const col = '#6e5878';
    const br = (x0, y0, x1, y1, w0, w1, cx, cy) => (q) => { const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1; const ax = nx / l, ay = ny / l; q.moveTo(x0 - ax * w0, y0 - ay * w0); q.quadraticCurveTo(cx - ax * (w0 + w1) / 2, cy - ay * (w0 + w1) / 2, x1 - ax * w1, y1 - ay * w1); q.lineTo(x1 + ax * w1, y1 + ay * w1); q.quadraticCurveTo(cx + ax * (w0 + w1) / 2, cy + ay * (w0 + w1) / 2, x0 + ax * w0, y0 + ay * w0); q.closePath(); };
    const parts = v % 2
      ? [br(0, 1, 2, -62, 7, 2, -4, -30), br(-1, -30, -19, -50, 3.2, 1.2, -12, -36), br(1, -40, 17, -55, 2.8, 1, 12, -44), br(-12, -42, -16, -60, 1.6, 0.8, -15, -52), br(1, -18, 14, -30, 2.6, 1, 9, -22)]
      : [br(0, 1, -3, -60, 7, 2, 4, -32), br(0, -26, 18, -46, 3.2, 1.2, 9, -34), br(-2, -38, -18, -52, 2.8, 1, -11, -42), br(12, -40, 20, -58, 1.6, 0.8, 18, -48), br(-1, -14, -15, -24, 2.4, 1, -9, -17)];
    const roots = (q) => { q.moveTo(-11, 1.5); q.quadraticCurveTo(-6, -2, -4, -8); q.lineTo(4, -8); q.quadraticCurveTo(6, -2, 12, 1.5); q.quadraticCurveTo(0, 3, -11, 1.5); q.closePath(); };
    const all = joinP(roots, ...parts);
    inkSil(g, all, OUTW * 0.9);
    cel(g, all, col, { s: 2.6, ax: -3, ay: -1 });
    g.save(); clipTo(g, all);
    taperLine(g, qpts(-1, -4, -2, -24, 0, -46, 6), 1.1, shadeTone(col, 0.45));
    g.fillStyle = OUT; ell(g, 1, -24, 2.2, 3.4); g.fill();
    g.restore();
    if (v % 2) {
      // a little lantern hangs from a branch (it glows at night... always night here)
      const lx = 15, ly = -50;
      g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, ly - 3); g.lineTo(lx, ly + 4); g.stroke();
      g.beginPath(); rrect(g, lx - 3, ly + 4, 6, 7, 2); fo(g, '#c6f27a', 1.2);
      g.fillStyle = '#f3ffd0'; circ(g, lx - 0.8, ly + 7, 1.3); g.fill();
    }
  },
  bush(g, v, b) {
    const leaf = b === 'isle' ? TREEPAL.isle : b === 'spooky' ? TREEPAL.spooky : b === 'desert' ? '#8fb84f' : b === 'snow' ? '#4f9a6a' : '#55a748';
    groundShadow(g, 22, 6.5, 0.28, 5);
    const cl = { core: [[0, -11, 10]], rim: [[-10, -10, 9.5], [9, -10, 9.5], [-3, -18, 10], [6, -19, 8], [0, -7, 9]].sort((a, c) => a[1] - c[1]) };
    cl.all = cl.core.concat(cl.rim);
    inkSil(g, circlesP(cl.all));
    paintFoliage(g, cl, leaf, { cy: -12, R: 16, seed: v + 9 });
    const berry = v === 1 ? '#4c7ee8' : v === 2 ? '#ff5f86' : null;
    if (berry) for (const [x, y] of [[-9, -12], [5, -18], [10, -8], [-2, -9], [-6, -19]]) { circ(g, x, y, 2.6); fo(g, berry, 0.9); g.fillStyle = 'rgba(255,255,255,0.85)'; circ(g, x - 0.8, y - 0.9, 0.9); g.fill(); }
    if (b === 'snow') { fillS(g, circlesP([[-6, -21, 5], [2, -24, 5.5], [9, -21, 4]]), '#ffffff'); }
  },
  rock(g, v, b) {
    const col = b === 'desert' ? '#d6a46e' : b === 'isle' ? '#a98aa8' : b === 'spooky' ? '#8a83a6' : b === 'snow' ? '#a7b1c9' : '#a9aab9';
    groundShadow(g, 24, 7, 0.3, 6); softShadow(g, 0, 0, 18, 4, 0.3);
    const shapes = [
      [[-21, 0], [-23, -11], [-15, -23], [-2, -27], [12, -24], [21, -13], [21, -2], [8, 2], [-10, 2]],
      [[-19, 0], [-20, -14], [-9, -25], [5, -28], [17, -19], [20, -5], [14, 2], [-6, 2]],
      [[-23, 0], [-20, -16], [-6, -22], [10, -26], [22, -14], [24, -2], [10, 2.5], [-12, 2]],
      [[-17, 0], [-19, -10], [-10, -30], [3, -33], [14, -24], [18, -6], [12, 2], [-6, 2]],
    ];
    const pts = shapes[v % 4];
    const P = (q) => { const n = pts.length; for (let i = 0; i < n; i++) { const a = pts[i], c2 = pts[(i + 1) % n], m = [(a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2]; if (i === 0) q.moveTo(m[0], m[1]); else q.quadraticCurveTo(a[0], a[1], m[0], m[1]); } const a = pts[0], m0 = [(pts[n - 1][0] + a[0]) / 2, (pts[n - 1][1] + a[1]) / 2]; q.quadraticCurveTo(pts[n - 1][0], pts[n - 1][1], m0[0], m0[1]); q.quadraticCurveTo(a[0], a[1], (a[0] + pts[1][0]) / 2, (a[1] + pts[1][1]) / 2); q.closePath(); };
    inkSil(g, P);
    const T = tones(col);
    cel(g, P, col, { s: 5, hs: 3 });
    g.save(); clipTo(g, P);
    // facets: a lit top plane and a shaded right plane
    const top = pts.reduce((m, p) => (p[1] < m[1] ? p : m), pts[0]);
    g.fillStyle = lightTone(col, 0.32); g.beginPath(); g.moveTo(-18, -12); g.quadraticCurveTo(top[0] - 4, top[1] - 4, top[0] + 4, top[1] + 2); g.quadraticCurveTo(top[0] + 2, -14, -6, -10); g.closePath(); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    g.fillStyle = T.sh; g.beginPath(); g.moveTo(top[0] + 4, top[1] + 2); g.quadraticCurveTo(top[0] + 6, -10, 6, 3); g.lineTo(26, 3); g.lineTo(26, top[1] - 5); g.closePath(); g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    taperLine(g, qpts(top[0] + 3, top[1] + 4, top[0] + 6, -12, 5, 1, 6), 1.4, T.sh2);
    if (v === 2) taperLine(g, qpts(-12, -6, -6, -9, 0, -4, 5), 1.2, T.sh2);
    if ((b === 'meadow' || b === 'forest' || b === 'plains') && v % 2 === 0) {
      fillS(g, circlesP([[-10, -21, 5], [-4, -24, 5], [2, -25, 4], [-14, -17, 3.5]]), '#7cbf4f');
      fillS(g, circlesP([[-11, -22.5, 2.6], [-5, -25.5, 2.4]]), '#a3d86b');
    }
    g.fillStyle = 'rgba(255,255,255,0.55)'; circ(g, top[0] - 4, top[1] + 5, 1.3); g.fill(); circ(g, -12, -9, 0.9); g.fill();
    g.restore();
  },
  srock(g, v) {
    PropArt.rock(g, v, 'snow');
    const cap = (q) => { q.moveTo(-19, -14); q.quadraticCurveTo(-12, -27, 0, -28); q.quadraticCurveTo(14, -27, 19, -16); q.quadraticCurveTo(14, -12, 9, -15); q.quadraticCurveTo(4, -10, -2, -15); q.quadraticCurveTo(-8, -11, -12, -15); q.quadraticCurveTo(-16, -11, -19, -14); q.closePath(); };
    inkSil(g, cap, OUTW * 0.6);
    cel(g, cap, '#ffffff', { s: 3, sh: '#cfdcf0', hi: false });
  },
  cactus(g, v) {
    groundShadow(g, 17, 6, 0.3, 5); softShadow(g, 0, 0, 9, 3, 0.35);
    const col = '#5cae5a', T = tones(col);
    const body = (q) => { rrect2(q, -7.5, -46, 15, 46.5, 7.5); };
    const armL = (q) => { q.moveTo(-6, -18); q.lineTo(-14, -18); q.quadraticCurveTo(-20, -18, -20, -25); q.lineTo(-20, -33); q.quadraticCurveTo(-20, -38, -16, -38); q.quadraticCurveTo(-12, -38, -12, -33); q.lineTo(-12, -26); q.lineTo(-6, -26); q.closePath(); };
    const armR = (q) => { q.moveTo(6, -32); q.lineTo(11, -32); q.lineTo(11, -39); q.quadraticCurveTo(11, -44, 15, -44); q.quadraticCurveTo(19, -44, 19, -39); q.lineTo(19, -31); q.quadraticCurveTo(19, -24, 13, -24); q.lineTo(6, -24); q.closePath(); };
    const parts = v % 2 ? [body, armL, armR] : v === 2 ? [body, armR] : [body, armL];
    const all = joinP(...parts);
    inkSil(g, all);
    cel(g, all, col, { s: 3.5, ay: -0.6, ax: -4.5, hs: 2.4 });
    g.save(); clipTo(g, all);
    for (const x of [-3, 2.5]) taperLine(g, [[x, -42], [x + 0.4, -22], [x, -3]], 1.2, T.sh2);
    taperLine(g, [[-17, -35], [-16.4, -28], [-16.5, -20]], 1, T.sh2);
    g.restore();
    g.strokeStyle = '#fff6d6'; g.lineWidth = 0.8;
    for (const [x, y] of [[-6.5, -36], [-6.5, -24], [-7, -12], [6.5, -40], [7, -16], [-19, -30], [18.5, -36], [0, -44]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x < 0 ? -2 : 2), y - 1.2); g.stroke(); }
    const fc = ['#ff7fa8', '#ffd84d', '#ff9f5a', '#ff7fa8'][v % 4];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; circ(g, Math.cos(a) * 2.6, -48 + Math.sin(a) * 2, 2.1); g.fillStyle = fc; g.fill(); }
    g.fillStyle = '#fff1a8'; circ(g, 0, -48, 1.3); g.fill();
  },
  mountain(g, v) {
    groundShadow(g, 132, 26, 0.2, 18);
    const H = [0, -14, 10][v % 3];
    // rock faces from left to right: [peak, ridge foot] pairs
    const outline = [[-128, 2], [-112, -30], [-94, -52], [-70, -96 + H * 0.4], [-56, -150 - H], [-38, -128 - H * 0.6], [-22, -138], [-8, -176 + H], [10, -210 + H], [28, -178 + H], [44, -150], [60, -120], [74, -126], [92, -86], [108, -44], [128, 2], [80, 8], [20, 10], [-40, 8], [-90, 8]];
    const P = (q) => { q.moveTo(outline[0][0], outline[0][1]); for (let i = 1; i < outline.length; i++) q.lineTo(outline[i][0], outline[i][1]); q.closePath(); };
    inkSil(g, P, 3);
    const base = '#9aa4c8', T = tones(base);
    fillS(g, P, base);
    g.save(); clipTo(g, P);
    // big shaded planes on the right of each ridge
    const pk1 = [-56, -150 - H], pk2 = [10, -210 + H], pk3 = [74, -126];
    g.fillStyle = T.sh;
    g.beginPath(); g.moveTo(pk2[0], pk2[1]); g.lineTo(28, -178 + H); g.lineTo(44, -150); g.lineTo(60, -120); g.lineTo(74, -126); g.lineTo(92, -86); g.lineTo(130, 10); g.lineTo(36, 12); g.quadraticCurveTo(30, -60, 18, -110); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(pk1[0], pk1[1]); g.lineTo(-38, -128 - H * 0.6); g.lineTo(-22, -138); g.lineTo(-8, -176 + H); g.lineTo(-6, -120); g.quadraticCurveTo(-30, -70, -30, 10); g.lineTo(-44, 10); g.quadraticCurveTo(-46, -80, pk1[0], pk1[1]); g.closePath(); g.fill();
    g.fillStyle = T.sh2;
    g.beginPath(); g.moveTo(pk3[0], pk3[1]); g.lineTo(92, -86); g.lineTo(108, -44); g.lineTo(130, 10); g.lineTo(84, 12); g.quadraticCurveTo(82, -60, pk3[0], pk3[1]); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(pk2[0], pk2[1]); g.lineTo(28, -178 + H); g.lineTo(26, -140); g.quadraticCurveTo(22, -100, 30, -60); g.quadraticCurveTo(20, -100, pk2[0] + 6, pk2[1] + 30); g.closePath(); g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    // lit planes on the upper left
    g.fillStyle = T.hi;
    g.beginPath(); g.moveTo(pk2[0], pk2[1]); g.lineTo(-8, -176 + H); g.lineTo(-20, -120); g.quadraticCurveTo(-10, -150, pk2[0] + 2, pk2[1] + 24); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(pk1[0], pk1[1]); g.lineTo(-70, -96 + H * 0.4); g.lineTo(-94, -52); g.lineTo(-80, -60); g.quadraticCurveTo(-66, -110, pk1[0] + 2, pk1[1] + 20); g.closePath(); g.fill();
    g.globalAlpha = 0.55; g.fillStyle = T.hi2;
    g.beginPath(); g.moveTo(-112, -30); g.lineTo(-94, -52); g.lineTo(-90, -30); g.quadraticCurveTo(-100, -20, -112, -30); g.fill();
    g.globalAlpha = 1;
    // strata and cracks
    const crack = (pts, w) => taperLine(g, pts, w || 1.6, T.sh2);
    crack(qpts(-30, -60, -20, -50, -26, -30, 6)); crack(qpts(-80, -30, -66, -26, -60, -12, 5)); crack(qpts(48, -80, 56, -60, 50, -40, 6), 1.8);
    crack(qpts(-4, -100, 6, -90, 2, -70, 5)); crack(qpts(96, -40, 104, -30, 100, -14, 5));
    taperLine(g, qpts(-54, -40, -40, -46, -30, -40, 6), 1.3, T.hi);
    taperLine(g, qpts(-12, -60, -2, -66, 10, -60, 6), 1.3, T.hi);
    // snow caps with drippy lower edges, lit and shaded halves
    const cap = (px, py, w, d) => (q) => {
      q.moveTo(px, py);
      q.lineTo(px + w * 0.95, py + w * 1.25);
      q.quadraticCurveTo(px + w * 0.75, py + w * 1.15 + d, px + w * 0.55, py + w * 1.05);
      q.quadraticCurveTo(px + w * 0.38, py + w * 1.45 + d, px + w * 0.15, py + w * 1.15);
      q.quadraticCurveTo(px - w * 0.05, py + w * 1.55 + d, px - w * 0.3, py + w * 1.1);
      q.quadraticCurveTo(px - w * 0.5, py + w * 1.3 + d, px - w * 0.7, py + w * 0.95);
      q.quadraticCurveTo(px - w * 0.85, py + w * 1.1, px - w, py + w * 1.1);
      q.closePath();
    };
    const caps = [cap(pk2[0], pk2[1], 38, 4), cap(pk1[0], pk1[1], 26, 3), cap(pk3[0], pk3[1], 15, 2)];
    for (const c2 of caps) {
      inkSil(g, c2, 1.2);
      fillS(g, c2, '#ffffff');
    }
    g.save(); clipTo(g, joinP(...caps));
    g.fillStyle = '#c9d8f0';
    for (const [px, py] of [pk1, pk2, pk3]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + 60, py + 70); g.lineTo(px + 60, py + 90); g.lineTo(px + 6, py + 90); g.quadraticCurveTo(px + 6, py + 30, px, py); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.restore();
    g.restore();
    // scree and boulders at the foot
    const rng = mulberry32(v * 13 + 5);
    const heaps = [[-96, 4], [-30, 8], [58, 6], [104, 3]];
    for (let i = 0; i < 9; i++) {
      const hp = heaps[i % 4], r = i < 4 ? 5.5 + rng() * 3 : 2.4 + rng() * 2.4, x = hp[0] + (rng() - 0.5) * 26, y = hp[1] + rng() * 4 + (i < 4 ? 0 : 3);
      const S = (q) => { q.moveTo(x - r, y); q.quadraticCurveTo(x - r, y - r * 1.1, x, y - r * 1.1); q.quadraticCurveTo(x + r * 1.1, y - r, x + r, y); q.closePath(); };
      inkSil(g, S, 1.3); cel(g, S, '#a1a9c4', { s: 1.6 });
    }
  },
  mushroom(g, v, b) {
    const spook = b === 'spooky';
    const cap = spook ? (v % 2 ? '#9a6be0' : '#6fc3e8') : v % 2 ? '#e8473b' : '#f2a03d';
    groundShadow(g, 15, 4.5, 0.26, 3);
    const list = v % 2 ? [[-6, 0, 1], [7, 2, 0.7], [1, 3, 0.5]] : [[-5, 0, 1], [7, 2, 0.75]];
    for (const [x, y, s] of list) {
      g.save(); g.translate(x, y); g.scale(s, s);
      const stem = (q) => { q.moveTo(-3.6, 0.5); q.quadraticCurveTo(-4.2, -6, -3, -12); q.lineTo(3, -12); q.quadraticCurveTo(4.2, -6, 3.6, 0.5); q.quadraticCurveTo(0, 1.6, -3.6, 0.5); q.closePath(); };
      const capP = (q) => { q.moveTo(-12, -10); q.bezierCurveTo(-12, -25, 12, -25, 12, -10); q.quadraticCurveTo(0, -6.5, -12, -10); q.closePath(); };
      inkSil(g, joinP(stem, capP), 2.1);
      cel(g, stem, '#fff1d8', { s: 2, ay: 0, ax: -2.4, hs: 1.4 });
      g.save(); clipTo(g, stem); g.fillStyle = 'rgba(80,50,70,0.35)'; ell(g, 0, -12, 6, 3); g.fill(); g.restore();
      cel(g, capP, cap, { s: 3.2, hs: 2.2 });
      g.save(); clipTo(g, capP);
      g.fillStyle = spook ? '#efe2ff' : '#fffaf0';
      for (const [a, c2, r] of [[-6, -15, 2.2], [2, -19, 2.4], [7, -13, 1.6], [-1, -12.5, 1.3]]) { circ(g, a, c2, r); g.fill(); }
      g.restore();
      g.restore();
    }
  },
  pumpkin(g, v) {
    groundShadow(g, 18, 5.5, 0.3, 4);
    const P = (q) => { for (const [x, rx] of [[-7.5, 8.5], [7.5, 8.5], [0, 9.5]]) { q.moveTo(x + rx, -11); q.ellipse(x, -11, rx, 11.5, 0, 0, TAU); } };
    const stem = (q) => { q.moveTo(-1.8, -21); q.quadraticCurveTo(-2.5, -26, 1, -29); q.lineTo(3.4, -27.5); q.quadraticCurveTo(1.5, -25, 2, -21); q.closePath(); };
    inkSil(g, joinP(P, stem));
    const col = v % 3 === 1 ? '#f2b33a' : '#f0862a', T = tones(col);
    cel(g, P, col, { s: 3.5 });
    g.save(); clipTo(g, P);
    taperLine(g, qpts(-4, -21, -6.5, -11, -4, -0.5, 7), 1.5, T.sh2);
    taperLine(g, qpts(4, -21, 6.5, -11, 4, -0.5, 7), 1.5, T.sh2);
    taperLine(g, qpts(-12, -17, -14, -11, -12, -5, 5), 1.2, T.hi2);
    g.restore();
    cel(g, stem, '#5b8a3a', { s: 1.5 });
    g.strokeStyle = '#5b8a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, -24); g.quadraticCurveTo(8, -28, 9, -23); g.stroke();
    if (v % 2 === 0) {
      g.fillStyle = '#5a2a1c';
      const face = (q) => { q.moveTo(-8, -13); q.lineTo(-2.5, -13); q.lineTo(-5.2, -18); q.closePath(); q.moveTo(2.5, -13); q.lineTo(8, -13); q.lineTo(5.2, -18); q.closePath(); q.moveTo(-7, -8); q.quadraticCurveTo(0, -1.5, 7, -8); q.lineTo(4, -7); q.lineTo(2.5, -5); q.lineTo(0, -6.5); q.lineTo(-2.5, -5); q.lineTo(-4, -7); q.closePath(); };
      g.beginPath(); face(g); g.fill();
      g.save(); g.translate(0.6, 0.8); g.beginPath(); face(g); g.restore(); g.fillStyle = '#ffd66b'; g.fill();
      g.save(); g.translate(1.1, 1.4); g.beginPath(); face(g); g.restore(); g.fillStyle = '#fff3b0'; g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    }
  },
  yarn(g, v) {
    const col = ['#e8475f', '#4d8fe6', '#f2c14a', '#8b5fd6'][v % 4], T = tones(col);
    groundShadow(g, 16, 5, 0.3, 4);
    const P = circlesP([[0, -13, 13]]);
    const tail = (q) => { q.moveTo(9, -5); q.quadraticCurveTo(18, 3, 27, -1); q.lineTo(27.5, 0.8); q.quadraticCurveTo(18, 5.5, 8.5, -3); q.closePath(); };
    inkSil(g, joinP(P, tail), OUTW * 0.9);
    cel(g, P, col, { s: 4.5, hs: 3 });
    fillS(g, tail, col);
    g.save(); clipTo(g, P);
    for (let i = -3; i <= 3; i++) { g.strokeStyle = i < 0 ? T.hi : T.sh2; g.globalAlpha = 0.85; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, -13, 12, 4 + Math.abs(i) * 1.8, 0.5 + i * 0.32, 0, Math.PI); g.stroke(); }
    g.globalAlpha = 1;
    g.strokeStyle = T.sh; g.lineWidth = 1.3; g.beginPath(); g.ellipse(0, -13, 12, 6, -0.9, Math.PI, TAU); g.stroke();
    g.restore();
  },
  post(g, v) {
    groundShadow(g, 22, 6.5, 0.3, 5);
    const baseP = (q) => rrect2(q, -19, -7, 38, 9, 3.5);
    const postP = (q) => { q.rect(-7.5, -56, 15, 51); };
    const topP = (q) => rrect2(q, -16, -64, 32, 10, 3.5);
    inkSil(g, joinP(baseP, postP, topP));
    cel(g, baseP, '#b88aa8', { s: 2.5 });
    cel(g, postP, '#dcbc8c', { s: 3, ay: 0, ax: -5, hs: 2 });
    g.save(); clipTo(g, postP);
    for (let y = -54; y < -4; y += 4.2) { taperLine(g, [[-8, y], [0, y + 2], [8, y + 3.6]], 1.5, '#a8865a'); taperLine(g, [[-7, y - 1.4], [0, y + 0.4], [7, y + 1.8]], 0.9, '#f3dcb0'); }
    g.fillStyle = 'rgba(70,40,70,0.35)'; g.fillRect(-8, -56, 16, 4);
    g.restore();
    cel(g, topP, '#b88aa8', { s: 2.5 });
    if (v % 2) {
      g.strokeStyle = OUT; g.lineWidth = 1.2; g.beginPath(); g.moveTo(11, -55); g.quadraticCurveTo(13, -48, 11, -41); g.stroke();
      const ball = circlesP([[11, -38, 3.8]]); inkSil(g, ball, 1.1); cel(g, ball, '#e8475f', { s: 1.6 });
    } else {
      // a toy mouse waiting on the base
      const m = (q) => { q.moveTo(8, -7); q.quadraticCurveTo(10, -13, 15, -12); q.quadraticCurveTo(18.5, -10, 17.5, -7); q.closePath(); };
      inkSil(g, m, 1); cel(g, m, '#9aa1b8', { s: 1.2 });
      g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.moveTo(8, -8); g.quadraticCurveTo(4, -9, 3, -6); g.stroke();
      g.fillStyle = '#f5a3b8'; circ(g, 13.5, -12.3, 1.5); g.fill();
    }
  },
  bones(g, v) {
    groundShadow(g, 17, 4.5, 0.22, 3);
    const bone = (x, y, len, a) => {
      const r = len * 0.17, h = len * 0.13, e = len / 2 - r * 0.6;
      const S = (q) => { const ca = Math.cos(a), sa = Math.sin(a); const T = (px, py) => [x + px * ca - py * sa, y + px * sa + py * ca]; const c0 = T(-e, -h / 2), c1 = T(e, -h / 2), c2 = T(e, h / 2), c3 = T(-e, h / 2); q.moveTo(c0[0], c0[1]); q.lineTo(c1[0], c1[1]); q.lineTo(c2[0], c2[1]); q.lineTo(c3[0], c3[1]); q.closePath(); for (const [px, py] of [[-e, -r * 0.7], [-e, r * 0.7], [e, -r * 0.7], [e, r * 0.7]]) { const p = T(px, py); q.moveTo(p[0] + r, p[1]); q.arc(p[0], p[1], r, 0, TAU); } };
      return S;
    };
    const parts = [bone(-4, -4, 19, 0.3 + v)];
    if (v % 2) parts.push(bone(7, -2, 14, -0.6));
    const all = joinP(...parts);
    inkSil(g, all, 1.9);
    cel(g, all, '#fbf2dc', { s: 2, sh: '#d9c7b4' });
  },
  log(g, v) {
    groundShadow(g, 28, 6.5, 0.28, 6);
    const body = (q) => rrect2(q, -25, -15, 45, 14.5, 7);
    const end = circlesP([[20, -7.8, 7]]);
    inkSil(g, joinP(body, end));
    const col = '#9a6a45', T = tones(col);
    cel(g, body, col, { s: 3, ax: 0, ay: -3.6, hs: 1.6 });
    g.save(); clipTo(g, body);
    for (const [x0, y0, x1] of [[-20, -10, -6], [-2, -5, 12], [-14, -4, -4], [4, -11, 14]]) taperLine(g, [[x0, y0], [(x0 + x1) / 2, y0 - 0.6], [x1, y0]], 1.3, T.sh2);
    g.restore();
    cel(g, end, '#e2b77f', { s: 1.8 });
    g.strokeStyle = '#b88752'; g.lineWidth = 1; for (const r of [2.4, 4.6]) { circ(g, 20.4, -7.6, r); g.stroke(); }
    const moss = circlesP([[-12, -15, 3.5], [-7, -16, 3.2], [-2, -15.2, 2.6]]);
    fillS(g, moss, '#6fb24a'); fillS(g, circlesP([[-12.6, -16.2, 1.6], [-7.4, -17, 1.5]]), '#9ad468');
    if (v % 2) { const m = (q) => { q.moveTo(-20, -15); q.bezierCurveTo(-20, -22, -12, -22, -12, -15); q.closePath(); q.rect(-17, -15, 2, 3); }; inkSil(g, m, 1); cel(g, m, '#e8473b', { s: 1.2 }); g.fillStyle = '#fff'; circ(g, -17.5, -18, 0.9); g.fill(); }
  },
  snowman(g, v) {
    groundShadow(g, 18, 5.5, 0.28, 4);
    const body = circlesP([[0, -12, 12.5], [0, -30, 9.5]]);
    // floppy dog ears made of snow
    const earL = (q) => { q.moveTo(-7, -31); q.quadraticCurveTo(-8, -26, -11.5, -23.5); q.bezierCurveTo(-15, -27, -14, -39, -6, -37); q.closePath(); };
    const earR = (q) => { q.moveTo(6, -37); q.bezierCurveTo(14, -39, 15, -27, 11.5, -23.5); q.quadraticCurveTo(8, -26, 7, -31); q.closePath(); };
    const arms = (q) => { q.moveTo(-11, -18); q.lineTo(-21, -25); q.lineTo(-20.4, -26.2); q.lineTo(-10.4, -19.6); q.closePath(); q.moveTo(11, -18); q.lineTo(20, -23); q.lineTo(20.6, -21.8); q.lineTo(11.4, -16.6); q.closePath(); };
    inkSil(g, joinP(body, earL, earR, arms), OUTW * 0.9);
    g.fillStyle = '#8a5a3c'; g.beginPath(); arms(g); g.fill();
    cel(g, body, '#ffffff', { s: 3.5, sh: '#c9d9f0', hi: false });
    for (const e of [earL, earR]) cel(g, e, '#eef4fc', { s: 2, sh: '#b9cce6', hi: false });
    g.fillStyle = OUT; circ(g, -3.4, -32, 1.5); g.fill(); circ(g, 3.4, -32, 1.5); g.fill();
    g.fillStyle = '#2e1d2a'; ell(g, 0, -28, 2.6, 1.9); g.fill(); g.fillStyle = '#fff'; circ(g, -0.8, -28.6, 0.7); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-2.2, -25.5); g.quadraticCurveTo(0, -24, 2.2, -25.5); g.stroke();
    const scarf = (q) => { rrect2(q, -9.5, -23, 19, 4.6, 2.2); q.moveTo(4, -20); q.lineTo(9, -10); q.lineTo(5, -10); q.lineTo(2, -19); q.closePath(); };
    const sc = ['#e8475f', '#4d8fe6', '#f2a03d', '#8b5fd6'][v % 4];
    inkSil(g, scarf, 1); cel(g, scarf, sc, { s: 1.6 });
    g.fillStyle = OUT; for (const y of [-14, -8]) { circ(g, 0, y, 1.3); g.fill(); }
  },
  stump(g, v, b) {
    groundShadow(g, 18, 5.5, 0.3, 4);
    const col = b === 'spooky' ? '#7a5b6e' : '#9a6a45';
    const body = (q) => { q.moveTo(-15, 0.5); q.quadraticCurveTo(-11, -2, -11, -7); q.lineTo(-10, -15); q.lineTo(10, -15); q.lineTo(11, -7); q.quadraticCurveTo(11, -2, 16, 0.5); q.quadraticCurveTo(0, 2.5, -15, 0.5); q.closePath(); };
    const top = (q) => { q.moveTo(10.5, -15); q.ellipse(0, -15, 10.5, 4.2, 0, 0, TAU); };
    inkSil(g, joinP(body, top));
    cel(g, body, col, { s: 3, ay: 0, ax: -4 });
    g.save(); clipTo(g, body); for (const x of [-5, 2, 7]) taperLine(g, [[x, -13], [x + 1, -7], [x, -1]], 1.2, shadeTone(col, 0.45)); g.restore();
    fillS(g, top, b === 'spooky' ? '#c4a3a8' : '#e2b77f');
    g.strokeStyle = b === 'spooky' ? '#9a7a86' : '#b88752'; g.lineWidth = 0.9;
    for (const r of [3, 6.5]) { g.beginPath(); g.ellipse(0.5, -15, r, r * 0.4, 0, 0, TAU); g.stroke(); }
    if (v % 2) { const m = circlesP([[-12, -3, 3.4]]); inkSil(g, m, 1); cel(g, m, '#9a6be0', { s: 1.2 }); }
  },
  crystal(g, v) {
    groundShadow(g, 16, 5, 0.28, 4);
    const list = [[-7, 26, 6, -0.15], [5, 36, 7.5, 0.05], [13, 20, 5, 0.25], [-14, 14, 4, -0.35]];
    const shard = ([x, h, w, a]) => (q) => { const ca = Math.cos(a), sa = Math.sin(a); const T = (px, py) => [x + px * ca - py * sa, px * sa + py * ca]; const pts = [T(-w, 1), T(-w, -h + w), T(0, -h), T(w, -h + w), T(w, 1)]; q.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) q.lineTo(p[0], p[1]); q.closePath(); };
    const all = joinP(...list.map(shard));
    inkSil(g, all, OUTW * 0.85);
    for (const s of list) {
      const P = shard(s), [x, h, w, a] = s, ca = Math.cos(a), sa = Math.sin(a);
      fillS(g, P, '#8fd6f2');
      g.save(); clipTo(g, P);
      g.fillStyle = '#5ea9dc'; g.beginPath(); const T = (px, py) => [x + px * ca - py * sa, px * sa + py * ca];
      let p = T(0.6, -h + 1); g.moveTo(p[0], p[1]); p = T(w + 2, -h + w); g.lineTo(p[0], p[1]); p = T(w + 2, 3); g.lineTo(p[0], p[1]); p = T(0.6, 3); g.lineTo(p[0], p[1]); g.fill();
      g.fillStyle = '#d8f5ff'; g.beginPath(); p = T(-w + 1.5, -2); g.moveTo(p[0], p[1]); p = T(-w + 1.5, -h + w + 1); g.lineTo(p[0], p[1]); p = T(-0.8, -h + 2); g.lineTo(p[0], p[1]); p = T(-2, -2); g.lineTo(p[0], p[1]); g.fill();
      g.restore();
    }
  },
  lamp(g) {
    groundShadow(g, 9, 3, 0.3, 2);
    const post = (q) => { q.rect(-2.2, -47, 4.4, 47); rrect2(q, -5, -4, 10, 4.5, 1.5); };
    const lant = (q) => rrect2(q, -7, -59, 14, 14, 4);
    const roof = (q) => { q.moveTo(-9.5, -58); q.lineTo(0, -67); q.lineTo(9.5, -58); q.closePath(); };
    inkSil(g, joinP(post, lant, roof), 2);
    cel(g, post, '#4a3a52', { s: 1.6, ay: 0, ax: -2 });
    fillS(g, lant, '#ffe79a');
    g.fillStyle = '#fff8d6'; ell(g, -1.5, -53, 3.5, 4.5); g.fill();
    g.strokeStyle = '#4a3a52'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -59); g.lineTo(0, -45); g.stroke();
    cel(g, roof, '#4a3a52', { s: 1.5 });
  },
};
function rrect2(q, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  q.moveTo(x + r, y); q.arcTo(x + w, y, x + w, y + h, r); q.arcTo(x + w, y + h, x, y + h, r); q.arcTo(x, y + h, x, y, r); q.arcTo(x, y, x + w, y, r); q.closePath();
}
const PROP_SIZE = { mountain: [290, 250, 140, 230], tree: [100, 104, 48, 92], pine: [66, 82, 32, 72], palm: [100, 96, 46, 84], dead: [56, 76, 27, 68], bush: [56, 40, 27, 30], rock: [62, 46, 30, 36], srock: [62, 46, 30, 36] };

function propSprite(p, b) {
  const sz = PROP_SIZE[p.kind] || [70, 74, 35, 66];
  const pal = p.kind === 'tree' ? treePal(p, b) : '';
  return sprite(p.kind + ':' + p.v + ':' + b + ':' + pal, sz[0], sz[1], sz[2], sz[3], (g) => PropArt[p.kind](g, p.v, b, pal));
}

// ---------- life: wind sway and glows, applied when drawing
function windK(x, y, t) { return Math.sin(t * 1.3 + x * 0.011 + y * 0.004) * 0.6 + Math.sin(t * 2.3 + x * 0.027 - y * 0.013) * 0.22 + Math.sin(t * 0.41 + x * 0.002) * 0.3; }
const SWAY = { tree: 0.032, pine: 0.024, palm: 0.045, bush: 0.04 };
// bend lines (sprite-local y): each band above a line leans a little further, axis-aligned draws only (cheap everywhere)
const BENDS = { tree: [-60, -44, -28], pine: [-44, -22], palm: [-60, -36], bush: [-14] };
const _glows = {};
function glowSprite(col) {
  if (_glows[col]) return _glows[col];
  const c = mkCanvas(64, 64), g = c.getContext('2d'), [r, gg, b] = hexRgb(col);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${gg},${b},0.9)`); gr.addColorStop(0.35, `rgba(${r},${gg},${b},0.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (_glows[col] = c);
}
function drawGlow(c, x, y, r, col, a) {
  const op = c.globalCompositeOperation, ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * a;
  c.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = op; c.globalAlpha = ga;
}
function drawPropSprite(c, p, s) {
  const t = S.time, amp = SWAY[p.kind], sc = p.s || 1;
  if (amp && c.globalAlpha === 1) {
    const k = windK(p.x, p.y, t) * amp, B = BENDS[p.kind], X = p.x - s.ox * sc, Y = p.y - s.oy * sc, cw = s.c.width, n = B.length;
    let top = 0;
    for (let i = 0; i <= n; i++) {
      const bot = i < n ? Math.round((s.oy + B[i]) * SPR_SC) : s.c.height, dx = i < n ? -k * B[i] * sc : 0;
      const h = Math.min(s.c.height, bot + (i < n ? 2 : 0)) - top;
      c.drawImage(s.c, 0, top, cw, h, X + dx, Y + (top / SPR_SC) * sc, s.w * sc, (h / SPR_SC) * sc);
      top = bot;
    }
  } else drawSprite(c, s, p.x, p.y, sc);
  // glowing things
  const ph = Math.sin(t * 2.2 + p.x * 0.05);
  switch (p.kind) {
    case 'lamp': drawGlow(c, p.x, p.y - 52 * sc, 34 * sc, '#ffc86b', 0.42 + ph * 0.06); break;
    case 'crystal': {
      drawGlow(c, p.x + 3, p.y - 18 * sc, 34 * sc, '#7fdcff', 0.3 + ph * 0.1);
      const tw = Math.max(0, Math.sin(t * 3.1 + p.y * 0.07)), sx = p.x + 3 * sc, sy = p.y - 33 * sc;
      if (tw > 0.15) { c.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`; const r = 2 + tw * 3; c.beginPath(); c.moveTo(sx, sy - r * 1.8); c.quadraticCurveTo(sx, sy, sx + r, sy); c.quadraticCurveTo(sx, sy, sx, sy + r * 1.8); c.quadraticCurveTo(sx, sy, sx - r, sy); c.quadraticCurveTo(sx, sy, sx, sy - r * 1.8); c.fill(); }
      break;
    }
    case 'pumpkin': if (p.v % 2 === 0) drawGlow(c, p.x, p.y - 10 * sc, 24 * sc, '#ffad42', 0.36 + ph * 0.1); break;
    case 'dead': if (p.v % 2) drawGlow(c, p.x + 15 * sc, p.y - 43 * sc, 18 * sc, '#c6f27a', 0.45 + ph * 0.15); break;
    case 'mushroom': if (p.b === 'spooky') drawGlow(c, p.x, p.y - 12 * sc, 18 * sc, p.v % 2 ? '#b98cff' : '#7fd8ff', 0.22 + ph * 0.08); break;
  }
}

// ---------- flat ground details
const DecorArt = {
  tuft(g, v, b) {
    const B = BIOMES[b] || BIOMES.meadow, dk = b === 'spooky' ? '#5a4e80' : shadeTone(B.dark, 0.15), lt = b === 'spooky' ? '#a49cc4' : lightTone(B.g, 0.25);
    const set = [[-5, 9, -2.6], [-1.5, 13, -0.6], [2, 11, 1.6], [5.5, 8, 3.2]];
    for (const [x, h, l] of set) { g.fillStyle = dk; g.beginPath(); g.moveTo(x - 1.6, 0.5); g.quadraticCurveTo(x - 1 + l * 0.3, -h * 0.55, x + l, -h); g.quadraticCurveTo(x + 1 + l * 0.3, -h * 0.5, x + 1.6, 0.5); g.closePath(); g.fill(); }
    for (const [x, h, l] of set.slice(1, 3)) { g.fillStyle = lt; g.beginPath(); g.moveTo(x - 0.7, -1); g.quadraticCurveTo(x - 0.6 + l * 0.3, -h * 0.5, x + l * 0.9, -h * 0.85); g.quadraticCurveTo(x + l * 0.3, -h * 0.4, x + 0.5, -1); g.closePath(); g.fill(); }
  },
  flower(g, v, b) {
    const col = ['#ffffff', '#ffd84d', '#ff8fb4', '#9fc0ff'][v % 4];
    g.fillStyle = 'rgba(60,40,70,0.16)'; ell(g, 1.5, 0.5, 5, 1.8); g.fill();
    g.strokeStyle = '#4f8f3a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0.5); g.quadraticCurveTo(-1, -4, 0, -8); g.stroke();
    g.fillStyle = '#5c9a3e'; g.beginPath(); g.ellipse(-2.6, -3.6, 2.6, 1.2, -0.5, 0, TAU); g.fill();
    g.fillStyle = shadeTone(col, 0.3); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.3; circ(g, Math.cos(a) * 3.3 + 0.5, -9.4 + Math.sin(a) * 3 + 0.6, 2.4); g.fill(); }
    g.fillStyle = col; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.3; circ(g, Math.cos(a) * 3.3, -9.4 + Math.sin(a) * 3, 2.3); g.fill(); }
    g.fillStyle = v % 4 === 1 ? '#e8743b' : '#ffd84d'; circ(g, 0, -9.4, 1.8); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; circ(g, -0.5, -10, 0.6); g.fill();
  },
  fern(g, v, b) {
    const col = b === 'spooky' ? '#6a5d88' : '#4a9640', T = tones(col);
    for (const [a, l] of [[-1.05, 12], [-0.45, 15], [0.2, 14], [0.85, 12]]) {
      const ex = Math.sin(a) * l, ey = -Math.cos(a) * l * 0.75 - 2;
      taperLine(g, qpts(0, 0, ex * 0.3, ey * 0.7 - 2, ex, ey, 6), 2.2, a < 0 ? T.base : T.sh);
      for (let k = 1; k < 4; k++) { const t = k / 4, px = ex * t * 0.9, py = ey * t + (1 - t) * -1; taperLine(g, [[px, py], [px - 2.2 * Math.cos(a), py - 1.2], [px - 3.2 * Math.cos(a), py - 0.4]], 1.4, a < 0 ? T.hi : T.base); }
    }
  },
  pebble(g, v, b) {
    const col = b === 'desert' ? '#d29a5e' : b === 'snow' ? '#b9c6d8' : b === 'isle' ? '#b897b4' : b === 'spooky' ? '#8a84a2' : '#a7a3b6';
    const T = tones(col);
    const ps = v % 2 ? [[-3, -1, 3.4, 2.4], [3.2, 0, 2.6, 1.9], [0, -3.5, 1.9, 1.4]] : [[-2.5, -0.6, 3.6, 2.5], [3.4, 0.3, 2.4, 1.8]];
    for (const [x, y, rx, ry] of ps) {
      g.fillStyle = 'rgba(60,40,70,0.22)'; ell(g, x + 0.8, y + 1, rx, ry); g.fill();
      g.fillStyle = T.sh; ell(g, x, y, rx, ry); g.fill();
      g.fillStyle = col; ell(g, x - rx * 0.12, y - ry * 0.18, rx * 0.85, ry * 0.75); g.fill();
      g.fillStyle = T.hi; ell(g, x - rx * 0.35, y - ry * 0.4, rx * 0.35, ry * 0.3); g.fill();
    }
  },
  shell(g, v) {
    const col = ['#ffb3a7', '#fff0d0', '#ffd27a'][v % 3], T = tones(col);
    g.fillStyle = 'rgba(60,40,70,0.2)'; ell(g, 1, 0.8, 6, 2); g.fill();
    const P = (q) => { q.moveTo(-5.5, 0); q.quadraticCurveTo(-6.5, -8.5, 0, -8.5); q.quadraticCurveTo(6.5, -8.5, 5.5, 0); q.quadraticCurveTo(0, 1.5, -5.5, 0); q.closePath(); };
    g.beginPath(); P(g); g.fillStyle = col; g.fill(); g.lineWidth = 1.1; g.strokeStyle = shadeTone(col, 0.45); g.stroke();
    g.save(); g.beginPath(); P(g); g.clip(); g.fillStyle = T.sh; g.fillRect(1.5, -10, 6, 12); g.restore();
    g.strokeStyle = shadeTone(col, 0.35); g.lineWidth = 0.9;
    for (const dx of [-3.4, -1.2, 1.2, 3.4]) { g.beginPath(); g.moveTo(dx * 0.4, 0); g.lineTo(dx, -7.5); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.8)'; circ(g, -2.4, -5.5, 0.9); g.fill();
  },
  drift(g) {
    g.fillStyle = 'rgba(120,140,190,0.25)'; ell(g, 1.5, 1, 15, 4.5); g.fill();
    g.fillStyle = '#d2e1f2'; ell(g, 0, 0, 14, 4.5); g.fill(); g.fillStyle = '#ffffff'; ell(g, -2, -1.5, 11, 3.4); g.fill();
    g.fillStyle = '#f2f8ff'; ell(g, -5, -2.4, 4, 1.2); g.fill();
  },
};
function decorSprite(d) { return sprite('d:' + d.kind + ':' + d.v + ':' + d.b, 32, 22, 16, 18, (g) => DecorArt[d.kind](g, d.v, d.b)); }
// all the flat decor in view; grass, ferns and flowers bend in the wind
const DSWAY = { tuft: 0.16, fern: 0.1, flower: 0.12 };
function drawDecorAll(c, v, t) {
  const m = c.getTransform(), A = m.a, B = m.b, C = m.c, D = m.d, E = m.e, F = m.f;
  for (let cy = Math.max(0, Math.floor(v.y0 / PC)); cy <= Math.min(PCH - 1, Math.floor(v.y1 / PC)); cy++)
    for (let cx = Math.max(0, Math.floor(v.x0 / PC)); cx <= Math.min(PCW - 1, Math.floor(v.x1 / PC)); cx++)
      for (const d of World.dgrid[cy * PCW + cx]) {
        if (d.x < v.x0 || d.x > v.x1 || d.y < v.y0 || d.y > v.y1) continue;
        const s = decorSprite(d), amp = DSWAY[d.kind];
        if (amp) {
          const k = windK(d.x, d.y, t) * amp;
          c.setTransform(A, B, C - A * k, D - B * k, A * d.x + C * d.y + E, B * d.x + D * d.y + F);
          c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
        } else c.drawImage(s.c, d.x - s.ox, d.y - s.oy, s.w, s.h);
      }
  c.setTransform(A, B, C, D, E, F);
}
