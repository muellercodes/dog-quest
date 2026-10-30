// Ground: the painted terrain. Each 512px chunk is baked once: a soft colour field (half resolution) with a brush
// texture, raised cliffs on the south and east coasts, painted grass strokes, roads and cobbled town squares.
// The surf, lapping waves and sparkles on the water are drawn live on top.
const CHW = 512, FLD = 2, FPX = CHW / FLD + 2;   // chunk world size; the colour field is baked at half resolution (+1px margin)
const Ground = { cache: new Map(), frame: 0, lastT: 0 };

const SANDS = {};
for (const id of BIOME_IDS) SANDS[id] = hexRgb(BIOMES[id].sand);
// sea colour by depth: turquoise shallows to cobalt deep, in soft painted bands
const WBANDS = [[0, '#b8f4ea'], [0.045, '#7fe0e4'], [0.13, '#52c6e6'], [0.3, '#38a2df'], [0.56, '#2f80d5'], [1, '#2a64c4']];
// cliff faces per biome: earthy strata colours
const CLIFF = { meadow: '#c79565', forest: '#94694c', plains: '#cc9f6a', coast: '#d4a872', snow: '#b4cfe8', desert: '#e3965a', spooky: '#73679a', isle: '#c78a9c' };
const ROADC = {
  def: { edge: '#c09a68', main: '#e6cf9c', hi: '#f6e6c0', rut: '#caa774' },
  snow: { edge: '#b2c0d6', main: '#e2e9f3', hi: '#ffffff', rut: '#bfcbdc' },
  desert: { edge: '#c08a4d', main: '#e6bf84', hi: '#f6d9a4', rut: '#cc9d62' },
  spooky: { edge: '#685d84', main: '#a497bb', hi: '#bfb4d2', rut: '#8a7da4' },
  isle: { edge: '#ad7b90', main: '#e5bfbb', hi: '#f5d9d4', rut: '#cc9ea5' },
};
const PLAZAC = { snow: '#d6e0ec', desert: '#e6c48c', spooky: '#a296b6', isle: '#d9a8bb' };

Ground.prep = function () {
  this.prepped = true;
  // depth -> colour lookup with soft band edges
  const L = (this.WL = new Uint8ClampedArray(256 * 3)), B = WBANDS.map(([t, h]) => [t, hexRgb(h)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let b = 0; while (b < B.length - 2 && t >= B[b + 1][0]) b++;
    const [t0, c0] = B[b], [t1, c1] = B[b + 1], u = (t - t0) / (t1 - t0);
    const edge = clamp((u - 0.9) / 0.1, 0, 1), k = u * 0.28 + ease(edge) * 0.72;
    for (let ch = 0; ch < 3; ch++) L[i * 3 + ch] = lerp(c0[ch], c1[ch], k);
  }
  // per biome palettes as rgb
  this.CL = BIOME_IDS.map((id) => { const h = CLIFF[id]; return { top: hexRgb(lightTone(h, 0.42)), mid: hexRgb(h), low: hexRgb(shadeTone(h, 0.3)), base: hexRgb(shadeTone(h, 0.52)) }; });
  this.DK = BIOME_IDS.map((id) => hexRgb(shadeTone(BIOMES[id].dark, 0.22)));
  this.AMP = BIOME_IDS.map((id) => ({ meadow: 10, forest: 10, plains: 10, coast: 9, snow: 13, desert: 9, spooky: 9, isle: 8 }[id]));
  // a tileable brush texture: soft diagonal dabs, light and dark
  const N = 300, c = mkCanvas(N, N), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  const rng = mulberry32(99);
  const dab = (x, y, l, w, a, col) => {
    g.fillStyle = col;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      const X = x + ox, Y = y + oy;
      if (X < -l - 4 || X > N + l + 4 || Y < -l - 4 || Y > N + l + 4) continue;
      g.beginPath(); g.ellipse(X, Y, l, w, a, 0, TAU); g.fill();
    }
  };
  for (let i = 0; i < 70; i++) { const v = rng() < 0.5 ? 255 : 0; dab(rng() * N, rng() * N, 30 + rng() * 40, 18 + rng() * 22, rng() * 3, `rgba(${v},${v},${v},0.06)`); }
  for (let i = 0; i < 2400; i++) {
    const v = rng() < 0.52 ? 255 : 0;
    dab(rng() * N, rng() * N, 3 + rng() * 9, 1.1 + rng() * 2.2, -0.55 + (rng() - 0.5) * 0.7, `rgba(${v},${v},${v},${0.05 + rng() * 0.09})`);
  }
  const d = g.getImageData(0, 0, N, N).data, M = (this.MT = new Float32Array(N * N));
  for (let i = 0; i < N * N; i++) M[i] = (d[i * 4] - 128) / 128;
  this.MTN = N;
  // soft mist puff for the spooky woods
  const mc = mkCanvas(64, 64), mg = mc.getContext('2d'), gr = mg.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(236,228,255,0.55)'); gr.addColorStop(0.6, 'rgba(236,228,255,0.2)'); gr.addColorStop(1, 'rgba(236,228,255,0)');
  mg.fillStyle = gr; mg.fillRect(0, 0, 64, 64);
  this.mist = mc;
  // road bounding boxes
  this.roadBox = World.roadPolys.map((p) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0 - 40, y0 - 40, x1 + 40, y1 + 40]; });
  this.fieldCv = mkCanvas(FPX, FPX);
  this.fieldCtx = this.fieldCv.getContext('2d');
  this.fieldImg = this.fieldCtx.createImageData(FPX, FPX);
};

// ---------- the colour field: land, cliff faces and sea, per pixel at half resolution
Ground.field = function (x0, y0) {
  const img = this.fieldImg, d = img.data;
  const F = World.F, FE = World.FE, TS = World.TS, CR = World.CR, CG = World.CG, CB = World.CB, BI = World.BI;
  const WL = this.WL, MT = this.MT, MN = this.MTN, CL = this.CL, DK = this.DK, AMP = this.AMP;
  for (let py = 0; py < FPX; py++) {
    const wy = y0 + (py - 1 + 0.5) * FLD;
    const gy = clamp(wy / GS, 0, GH - 1.001), j = gy | 0, fy = gy - j;
    const my = ((((wy / 2) | 0) % MN) + MN) % MN;
    for (let px = 0; px < FPX; px++) {
      const wx = x0 + (px - 1 + 0.5) * FLD;
      const gx = clamp(wx / GS, 0, GW - 1.001), i = gx | 0, fx = gx - i;
      const k = j * GW + i, k2 = k + 1, k3 = k + GW, k4 = k + GW + 1;
      const w1 = (1 - fx) * (1 - fy), w2 = fx * (1 - fy), w3 = (1 - fx) * fy, w4 = fx * fy;
      const f = F[k] * w1 + F[k2] * w2 + F[k3] * w3 + F[k4] * w4;
      const mt = MT[my * MN + ((((wx / 2) | 0) % MN) + MN) % MN];
      const bi = BI[w1 + w3 > 0.5 ? (w1 > w3 ? k : k3) : w2 > w4 ? k2 : k4];
      let r, gg, b;
      const o = (py * FPX + px) * 4;
      if (f >= 0) {
        // land: the biome colour field, brush texture, shade under trees, beaches on the north-facing shores
        r = CR[k] * w1 + CR[k2] * w2 + CR[k3] * w3 + CR[k4] * w4;
        gg = CG[k] * w1 + CG[k2] * w2 + CG[k3] * w3 + CG[k4] * w4;
        b = CB[k] * w1 + CB[k2] * w2 + CB[k3] * w3 + CB[k4] * w4;
        const ts = TS[k] * w1 + TS[k2] * w2 + TS[k3] * w3 + TS[k4] * w4;
        if (ts > 0.02) { const s = Math.min(0.42, ts * 0.36), D = DK[bi]; r += (D[0] - r) * s; gg += (D[1] - gg) * s; b += (D[2] - b) * s; }
        const v = mt * AMP[bi];
        r += v * 0.85; gg += v; b += v * (mt > 0 ? 0.45 : 0.95);
        if (f < 0.075) {
          const dx = ((F[k2] - F[k]) * (1 - fy) + (F[k4] - F[k3]) * fy), dy = ((F[k3] - F[k]) * (1 - fx) + (F[k4] - F[k2]) * fx);
          const ny = dy / (Math.hypot(dx, dy) || 1);       // > 0: the land rises to the south, the sea is north (a beach)
          const beach = clamp((ny + 0.6) / 0.45, 0, 1);
          const sd = SANDS[BIOME_IDS[bi]];
          let t = clamp((f - 0.045) / 0.028, 0, 1);
          t = 1 - (1 - t) * beach;
          r = sd[0] + (r - sd[0]) * t; gg = sd[1] + (gg - sd[1]) * t; b = sd[2] + (b - sd[2]) * t;
          if (beach > 0.2 && f < 0.012) { const w = (1 - f / 0.012) * 0.2 * beach; r -= r * w; gg -= gg * w * 0.8; b -= b * w * 0.5; }
          if (beach < 0.8 && f < 0.008) { const w = (1 - f / 0.008) * (1 - beach) * 0.16; r += (255 - r) * w; gg += (250 - gg) * w; b += (215 - b) * w; }
        }
      } else {
        const fe = FE[k] * w1 + FE[k2] * w2 + FE[k3] * w3 + FE[k4] * w4;
        if (fe >= 0) {
          // cliff face: find how far below the lip this pixel sits (u: 0 at the lip, 1 at the base)
          const h = cliffH(wx, wy);
          let u = 1, fp = f, tp = 0;
          for (let s = 1; s <= 5; s++) {
            const tt = s / 5, fs = World.Fat(wx - CLIFF_SKEW * h * tt, wy - h * tt);
            if (fs >= 0) { u = tp + (tt - tp) * (-fp / (fs - fp || 1e-6)); break; }
            fp = fs; tp = tt;
          }
          const C = CL[bi];
          const dx = ((F[k2] - F[k]) * (1 - fy) + (F[k4] - F[k3]) * fy), dy = ((F[k3] - F[k]) * (1 - fx) + (F[k4] - F[k2]) * fx);
          const nx = -dx / (Math.hypot(dx, dy) || 1);     // > 0: an east-facing face, away from the sun
          let A, Bc, q;
          if (u < 0.13) { A = C.top; Bc = C.mid; q = u / 0.13; } else if (u < 0.8) { A = C.mid; Bc = C.low; q = (u - 0.13) / 0.67; } else { A = C.low; Bc = C.base; q = (u - 0.8) / 0.2; }
          r = A[0] + (Bc[0] - A[0]) * q; gg = A[1] + (Bc[1] - A[1]) * q; b = A[2] + (Bc[2] - A[2]) * q;
          const sh = nx > 0 ? nx * 0.2 : nx * 0.08;
          r -= r * sh; gg -= gg * sh; b -= b * sh * 0.6;
          const v = mt * 7; r += v; gg += v; b += v;
        } else {
          // sea: depth bands from the extruded field, a faint caustic net in the shallows, the cliffs' shadow
          const t = clamp(-fe / 0.5, 0, 1), li = (t * 255) | 0;
          r = WL[li * 3]; gg = WL[li * 3 + 1]; b = WL[li * 3 + 2];
          if (t < 0.42) {
            const n = Math.sin(wx * 0.047 + 1.8 * Math.sin(wy * 0.031 + 0.5)) + Math.sin(wy * 0.058 + 1.6 * Math.sin(wx * 0.026));
            const line = 1 - Math.abs(n) * 4.5;
            if (line > 0) { const w = line * 14 * (1 - t / 0.42); r += w; gg += w; b += w * 0.7; }
          } else { const v = mt * 5; r += v; gg += v; b += v; }
          if (fe > -0.07) {
            const h = cliffH(wx, wy);
            const s1 = World.Fat(wx - CLIFF_SKEW * h - 4, wy - h - 7) >= 0 ? 0.5 : 0, s2 = World.Fat(wx - CLIFF_SKEW * h - 8, wy - h - 14) >= 0 ? 0.5 : 0;
            const s = (s1 + s2) * 0.2;
            if (s) { r -= r * s * 1.1; gg -= gg * s; b -= b * s * 0.55; }
          }
        }
      }
      const n = (hash2(wx >> 1, wy >> 1, 3) - 0.5) * 4;
      d[o] = r + n; d[o + 1] = gg + n; d[o + 2] = b + n; d[o + 3] = 255;
    }
  }
  this.fieldCtx.putImageData(img, 0, 0);
  return this.fieldCv;
};

Ground.render = function (cx, cy) {
  if (!this.prepped) this.prep();
  const t0 = performance.now();
  const x0 = cx * CHW, y0 = cy * CHW;
  const c = mkCanvas(CHW, CHW), g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(this.field(x0, y0), -FLD, -FLD, FPX * FLD, FPX * FLD);
  g.translate(-x0, -y0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  this.paintCliffs(g, x0, y0);
  this.paintLand(g, x0, y0);
  this.paintRoads(g, x0, y0);
  this.paintPlazas(g, x0, y0);
  this.lastBake = performance.now() - t0;
  return c;
};

// append a tapered stroke (thin ends, full in the middle) to a path
function taperTo(P, pts, w) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const ww = (w / 2) * Math.max(0.15, Math.sin((Math.PI * i) / (n - 1)));
    L.push([p[0] - dy * ww, p[1] + dx * ww]); R.push([p[0] + dy * ww, p[1] - dx * ww]);
  }
  P.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) P.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) P.lineTo(R[i][0], R[i][1]);
  P.closePath();
}
// a blade that starts full at the root and tapers to a point
function bladeTo(P, x, y, lean, h, w) {
  P.moveTo(x - w / 2, y);
  P.quadraticCurveTo(x - w * 0.3 + lean * 0.3, y - h * 0.55, x + lean, y - h);
  P.quadraticCurveTo(x + w * 0.3 + lean * 0.3, y - h * 0.5, x + w / 2, y);
  P.closePath();
}
function piecesIn(list, x0, y0, x1, y1, pad) { return list.filter((P) => P.x1 > x0 - pad && P.x0 < x1 + pad && P.y1 > y0 - pad && P.y0 < y1 + pad); }

// ---------- cliffs: the inked lip, a light rim on the grass, strata lines and cracks on the face
Ground.paintCliffs = function (g, x0, y0) {
  const lip = piecesIn(World.shore.lip, x0, y0, x0 + CHW, y0 + CHW, 40);
  if (!lip.length) return;
  const onFace = (x, y) => World.Fat(x, y) < 0 && World.FEat(x, y) >= 0;
  const ink = new Path2D(), rim = new Path2D(), dark = new Path2D(), lite = new Path2D(), crack = new Path2D(), grass = new Path2D(), base = new Path2D();
  for (const P of lip) {
    const p = P.p, n = p.length / 2;
    for (let i = 0; i < n - 1; i++) {
      const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 2], by = p[i * 2 + 3], mx = (ax + bx) / 2, my = (ay + by) / 2;
      const h = cliffH(mx, my);
      if (!onFace(mx + CLIFF_SKEW * h * 0.5, my + h * 0.5)) continue;
      ink.moveTo(ax, ay); ink.lineTo(bx, by);
      rim.moveTo(ax - 0.4, ay - 2.6); rim.lineTo(bx - 0.4, by - 2.6);
      // strata: the lip pushed down the face, wobbling a little
      for (const [dd, P2, P3] of [[0.36, dark, lite], [0.64, dark, lite]]) {
        const w1 = Math.sin(ax * 0.05 + dd * 9) * 1.3, w2 = Math.sin(bx * 0.05 + dd * 9) * 1.3;
        const da = h * dd + w1, db = h * dd + w2;
        if (!onFace(mx + CLIFF_SKEW * h * dd, my + h * dd)) continue;
        P2.moveTo(ax + CLIFF_SKEW * da, ay + da); P2.lineTo(bx + CLIFF_SKEW * db, by + db);
        P3.moveTo(ax + CLIFF_SKEW * da, ay + da + 1.3); P3.lineTo(bx + CLIFF_SKEW * db, by + db + 1.3);
      }
      const hh = hash2(Math.round(ax), Math.round(ay), 77);
      if (hh < 0.22 && h > 12) {
        const cx = ax + (bx - ax) * hh * 3, cy = ay + (by - ay) * hh * 3, l0 = h * (0.15 + hh), l1 = l0 + h * (0.22 + hh * 0.8);
        if (onFace(cx + CLIFF_SKEW * l1, cy + l1)) taperTo(crack, [[cx + CLIFF_SKEW * l0, cy + l0], [cx + CLIFF_SKEW * (l0 + l1) / 2 + 1, cy + (l0 + l1) / 2], [cx + CLIFF_SKEW * l1, cy + l1]], 1.6);
      }
      // little tufts of grass hanging over the lip
      if (hh > 0.6 && hh < 0.78 && h > 12) { const gx = (ax + bx) / 2, gy = (ay + by) / 2; for (let q = -1; q <= 1; q++) taperTo(grass, [[gx + q * 3, gy - 1], [gx + q * 3.6 + 0.6, gy + 2.5], [gx + q * 4 + 1.2, gy + 5 - Math.abs(q) * 1.5]], 2); }
    }
  }
  g.lineCap = 'round';
  g.fillStyle = 'rgba(52,26,58,0.28)'; g.fill(crack);
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(58,28,64,0.24)'; g.stroke(dark);
  g.lineWidth = 1.1; g.strokeStyle = 'rgba(255,244,226,0.22)'; g.stroke(lite);
  g.fillStyle = 'rgba(70,110,50,0.75)'; g.fill(grass);
  g.lineWidth = 2.6; g.strokeStyle = 'rgba(255,252,220,0.32)'; g.stroke(rim);
  g.lineWidth = 2.3; g.strokeStyle = OUT; g.stroke(ink);
  // a soft ink line where the cliffs meet the water (the surf covers most of it)
  for (const P of piecesIn(World.shore.foam, x0, y0, x0 + CHW, y0 + CHW, 30)) {
    const p = P.p;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 2], by = p[i * 2 + 3];
      if (!onFace((ax + bx) / 2 - CLIFF_SKEW * 3, (ay + by) / 2 - 3)) continue;
      base.moveTo(ax, ay); base.lineTo(bx, by);
    }
  }
  g.lineWidth = 2.2; g.strokeStyle = 'rgba(59,34,53,0.6)'; g.stroke(base);
};

// ---------- painted strokes on the land, per biome, placed by a hash so chunks agree at their seams
const AUTUMN = ['#f0973a', '#e5623b', '#f7c548', '#d9822f', '#c94f3d'];
Ground.paintLand = function (g, x0, y0) {
  const S = 15, pad = 26;
  const paths = {};
  const P = (key) => paths[key] || (paths[key] = new Path2D());
  const leaves = [], puddles = [], mists = [], stars = [];
  const segs = World.roadSegs.filter((q) => Math.max(q[0], q[2]) > x0 - 60 && Math.min(q[0], q[2]) < x0 + CHW + 60 && Math.max(q[1], q[3]) > y0 - 60 && Math.min(q[1], q[3]) < y0 + CHW + 60);
  for (let iy = Math.floor((y0 - pad) / S); iy <= Math.ceil((y0 + CHW + pad) / S); iy++)
    for (let ix = Math.floor((x0 - pad) / S); ix <= Math.ceil((x0 + CHW + pad) / S); ix++) {
      const h1 = hash2(ix, iy, 201), h2 = hash2(ix, iy, 202), h3 = hash2(ix, iy, 203), h4 = hash2(ix, iy, 204);
      const x = (ix + h1) * S, y = (iy + h2) * S;
      const f = World.Fat(x, y);
      if (f < 0.03) continue;
      const b = World.biomeAt(x, y);
      if (segs.length && nearSegs(segs, x, y, 30)) continue;
      const dn = vnoise(x / 150, y / 150, 57);
      const ts = gridAt(World.TS, x, y);
      if (b === 'meadow' || b === 'plains' || b === 'coast' || b === 'forest' || b === 'spooky') {
        if (h3 < 0.12 + dn * 0.42 + ts * 0.15) {
          const lean = 2 + h4 * 4, hgt = 5 + h4 * 5, dk = h1 < 0.62;
          const path = P((dk ? 'gd:' : 'gl:') + b);
          const cnt = 2 + ((h2 * 3) | 0);
          for (let q = 0; q < cnt; q++) bladeTo(path, x + q * 3 - cnt * 1.5, y + (q % 2) * 1.5, lean + q * 0.6 - 1, hgt * (0.7 + ((q * 7 + ix) % 3) * 0.15), 2.3);
        }
        if (b !== 'spooky' && b !== 'coast' && h4 > 0.975 && dn > 0.45) {
          // a clover patch
          const path = P('clover:' + b);
          for (let q = 0; q < 4; q++) { const cx = x + Math.cos(q * 2.4 + h1 * 6) * 6, cy = y + Math.sin(q * 2.4 + h1 * 6) * 3.5; for (let l = 0; l < 3; l++) { const a = (l / 3) * TAU + q; path.moveTo(cx + Math.cos(a) * 1.8 + 1.7, cy + Math.sin(a) * 1.8); path.arc(cx + Math.cos(a) * 1.8, cy + Math.sin(a) * 1.8, 1.7, 0, TAU); } }
        }
        if ((b === 'meadow' || b === 'plains' || b === 'forest') && h4 > 0.985 && h1 < 0.5) leaves.push([x, y, h1, h2, 0, null]);
        if (b !== 'spooky' && b !== 'coast' && h3 > 0.9975 && f > 0.12 && ts < 0.2) puddles.push([x, y, h1]);
        if (b === 'spooky' && h4 < 0.035) mists.push([x, y, h1]);
      } else if (b === 'snow') {
        if (h3 < 0.16) stars.push([x, y, h1]);
        if (h4 > 0.82 && dn > 0.42) { const w = 14 + h1 * 22; taperTo(P('drift'), [[x - w, y], [x - w * 0.5, y - 3 - h2 * 2], [x, y - 1], [x + w * 0.5, y + 1.5], [x + w, y]], 3.2); }
        if (h3 > 0.9 && ts > 0.1) taperTo(P('drift'), [[x - 8, y], [x, y - 2], [x + 9, y]], 2.4);
      } else if (b === 'desert') {
        if (h3 < 0.3 + dn * 0.3 && ((iy + ix) % 2 === 0)) {
          const w = 20 + h1 * 30, a = -0.18 + (dn - 0.5) * 0.5, ca = Math.cos(a), sa = Math.sin(a);
          const pts = []; for (let q = 0; q <= 6; q++) { const u = (q / 6 - 0.5) * w * 2, vv = Math.sin(q * 1.1 + h2 * 3) * 2.2; pts.push([x + ca * u - sa * vv, y + sa * u + ca * vv]); }
          taperTo(P('rip'), pts, 2.4);
          taperTo(P('ripl'), pts.map(([px, py]) => [px - 0.6, py - 2.2]), 2);
        }
        if (h4 > 0.97) stars.push([x, y, h1]);
      } else if (b === 'isle') {
        if (dn > 0.42 && h3 < 0.85) {
          // knitted carpet: rows of little V stitches
          const path = P(h1 < 0.5 ? 'knitd' : 'knitl');
          for (let q = 0; q < 2; q++) { const kx = ix * S + q * 7.5 + (iy % 2) * 3.7, ky = iy * S + q * 4; path.moveTo(kx - 3, ky - 3); path.quadraticCurveTo(kx - 1.6, ky + 1, kx, ky + 2.4); path.quadraticCurveTo(kx - 2.6, ky + 0.6, kx - 3, ky - 3); path.moveTo(kx + 3, ky - 3); path.quadraticCurveTo(kx + 1.6, ky + 1, kx, ky + 2.4); path.quadraticCurveTo(kx + 2.6, ky + 0.6, kx + 3, ky - 3); }
        }
        if (h4 < 0.08) { const lean = 2 + h1 * 3; for (let q = 0; q < 3; q++) bladeTo(P('gd:isle'), x + q * 3 - 4, y, lean, 6 + h2 * 4, 2.2); }
      }
    }
  // leaf litter under the autumn trees
  for (const p of World.propsIn(x0 - 80, y0 - 80, x0 + CHW + 80, y0 + CHW + 80, [])) {
    if (p.kind !== 'tree' || p.gone) continue;
    const pal = treePal(p, p.b || (p.b = World.biomeAt(p.x, p.y)));
    if (!LEAFC[pal]) continue;
    const n = 7 + ((hash2(p.x | 0, p.y | 0, 5) * 7) | 0);
    for (let q = 0; q < n; q++) {
      const a = hash2(p.x | 0, q, 6) * TAU, r = Math.sqrt(hash2(p.y | 0, q, 7)) * 40 * p.s;
      const lx = p.x + Math.cos(a) * r + 6, ly = p.y + Math.sin(a) * r * 0.55 + 2;
      if (World.Fat(lx, ly) < 0.02) continue;
      leaves.push([lx, ly, hash2(q, p.x | 0, 8), hash2(q, p.y | 0, 9), 0, LEAFC[pal][q % LEAFC[pal].length]]);
    }
  }
  // puddles under everything else
  for (const [x, y, h] of puddles) {
    const rx = 12 + h * 10, ry = rx * 0.45;
    g.fillStyle = 'rgba(70,60,90,0.25)'; ell(g, x + 1, y + 1.5, rx + 2, ry + 1.5); g.fill();
    g.fillStyle = '#7ccde6'; ell(g, x, y, rx, ry); g.fill();
    g.fillStyle = '#a9e6f2'; ell(g, x - rx * 0.15, y - ry * 0.2, rx * 0.7, ry * 0.55); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; ell(g, x - rx * 0.4, y - ry * 0.3, rx * 0.22, ry * 0.18); g.fill();
  }
  for (const [x, y, h] of mists) { const s = 70 + h * 80; g.globalAlpha = 0.55; g.drawImage(this.mist, x - s, y - s * 0.45, s * 2, s * 0.9); g.globalAlpha = 1; }
  const fillP = (key, col) => { if (paths[key]) { g.fillStyle = col; g.fill(paths[key]); } };
  for (const b of BIOME_IDS) {
    const B = BIOMES[b];
    fillP('gd:' + b, b === 'spooky' ? 'rgba(84,72,120,0.5)' : b === 'isle' ? 'rgba(150,80,118,0.4)' : hexA(shadeTone(B.dark, 0.2), 0.42));
    fillP('gl:' + b, b === 'spooky' ? 'rgba(186,176,214,0.4)' : hexA(lightTone(B.g, 0.35), 0.55));
    fillP('clover:' + b, hexA(shadeTone(B.g2, 0.1), 0.45));
  }
  fillP('drift', 'rgba(150,176,214,0.45)');
  fillP('rip', 'rgba(196,140,70,0.38)'); fillP('ripl', 'rgba(255,240,200,0.5)');
  fillP('knitd', 'rgba(150,84,120,0.16)'); fillP('knitl', 'rgba(255,230,240,0.2)');
  // fallen autumn leaves
  for (const [lx, ly, h1, h2, h3, c0] of leaves) {
    const a = h1 * 6, col = c0 || AUTUMN[(h2 * 5) | 0], s = 0.8 + h2 * 0.5;
    g.save(); g.translate(lx, ly); g.rotate(a); g.scale(s, s);
    g.fillStyle = 'rgba(60,40,70,0.16)'; g.beginPath(); g.ellipse(0.8, 1.1, 4.4, 2.6, 0, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(-4.6, 0); g.bezierCurveTo(-2, -4, 2, -3.6, 4.6, 0); g.bezierCurveTo(2, 3.6, -2, 4, -4.6, 0); g.fill();
    g.fillStyle = lightTone(col, 0.3); g.beginPath(); g.moveTo(-3.6, -0.3); g.bezierCurveTo(-1.5, -3, 1.5, -2.6, 3.6, -0.3); g.closePath(); g.fill();
    g.strokeStyle = shadeTone(col, 0.32); g.lineWidth = 0.7; g.beginPath(); g.moveTo(-4.4, 0); g.lineTo(4, 0); g.stroke();
    g.restore();
  }
  // snow and sand sparkles
  if (stars.length) {
    const sp = new Path2D();
    for (const [x, y, h] of stars) { const r = 1.6 + h * 2; sp.moveTo(x, y - r * 1.6); sp.quadraticCurveTo(x, y, x + r, y); sp.quadraticCurveTo(x, y, x, y + r * 1.6); sp.quadraticCurveTo(x, y, x - r, y); sp.quadraticCurveTo(x, y, x, y - r * 1.6); }
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(sp);
  }
};
function hexA(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function nearSegs(segs, x, y, r) {
  for (const s of segs) {
    if (x < Math.min(s[0], s[2]) - r || x > Math.max(s[0], s[2]) + r || y < Math.min(s[1], s[3]) - r || y > Math.max(s[1], s[3]) + r) continue;
    const dx = s[2] - s[0], dy = s[3] - s[1], t = clamp(((x - s[0]) * dx + (y - s[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    if (dist2(x, y, s[0] + dx * t, s[1] + dy * t) < r * r) return true;
  }
  return false;
}

// ---------- roads: worn dirt edges, ruts, a lighter middle, pebbles and grass at the verges
Ground.paintRoads = function (g, x0, y0) {
  const x1 = x0 + CHW, y1 = y0 + CHW;
  World.roadPolys.forEach((poly, ri) => {
    const bb = this.roadBox[ri];
    if (bb[2] < x0 || bb[0] > x1 || bb[3] < y0 || bb[1] > y1) return;
    // normals and colours per point
    const n = poly.length, N = [], col = [];
    for (let i = 0; i < n; i++) {
      const a = poly[Math.max(0, i - 1)], b = poly[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      N.push([-(b[1] - a[1]) / l, (b[0] - a[0]) / l]);
      const bi = World.biomeAt(poly[i][0], poly[i][1]);
      col.push(ROADC[bi] || ROADC.def);
    }
    const near = (i) => { const [x, y] = poly[i]; return x > x0 - 120 && x < x1 + 120 && y > y0 - 120 && y < y1 + 120; };
    const segs = []; for (let i = 0; i < n - 1; i++) if (near(i) || near(i + 1)) segs.push(i);
    const stroke = (w, key, alpha, off) => {
      g.lineWidth = w; g.globalAlpha = alpha == null ? 1 : alpha;
      for (const i of segs) {
        const a = poly[i], b = poly[i + 1], o = off || 0;
        g.strokeStyle = col[i][key];
        g.beginPath(); g.moveTo(a[0] + N[i][0] * o, a[1] + N[i][1] * o); g.lineTo(b[0] + N[i + 1][0] * o, b[1] + N[i + 1][1] * o); g.stroke();
      }
      g.globalAlpha = 1;
    };
    stroke(54, 'edge', 0.35);
    stroke(47, 'edge');
    // ragged worn edges: irregular bites of dirt along both sides
    for (const i of segs) {
      const a = poly[i], b = poly[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.ceil(len / 13), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.fillStyle = col[i].edge;
      for (let s = 0; s < steps; s++) {
        const t = (s + hash2(i, s, 3) * 0.8) / steps, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, h = hash2(Math.round(x), Math.round(y), 5);
        if (h < 0.35) continue;
        const side = hash2(s, i, 4) < 0.5 ? 1 : -1, off = 22.5 + h * 3, nx = N[i][0], ny = N[i][1];
        g.beginPath(); g.ellipse(x + nx * off * side, y + ny * off * side, 5 + h * 9, 1.8 + h * 2.6, ang, 0, TAU); g.fill();
      }
    }
    stroke(39, 'main');
    stroke(3.2, 'rut', 0.55, 8.5); stroke(3.2, 'rut', 0.55, -8.5);
    stroke(12, 'hi', 0.45, 0);
    // pebbles and verge grass
    const peb = new Path2D(), pebH = new Path2D(), grass = new Path2D();
    for (const i of segs) {
      const a = poly[i], b = poly[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.ceil(len / 11);
      for (let s = 0; s < steps; s++) {
        const t = s / steps, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, h = hash2(Math.round(x * 3), Math.round(y * 3), 9), h2 = hash2(Math.round(x), Math.round(y), 13);
        if (h < 0.4) {
          const off = (h2 - 0.5) * 34, px = x + N[i][0] * off, py = y + N[i][1] * off, r = 1.6 + h * 3;
          peb.moveTo(px + r, py); peb.ellipse(px, py, r, r * 0.7, 0, 0, TAU);
          pebH.moveTo(px - r * 0.2 + r * 0.45, py - r * 0.25); pebH.ellipse(px - r * 0.2, py - r * 0.25, r * 0.45, r * 0.3, 0, 0, TAU);
        }
        if (h2 > 0.62 && World.biomeAt(x, y) !== 'desert' && World.biomeAt(x, y) !== 'snow') {
          const side = h > 0.5 ? 1 : -1, off = 24 + h * 4, gx = x + N[i][0] * off * side, gy = y + N[i][1] * off * side;
          for (let q = 0; q < 3; q++) bladeTo(grass, gx + q * 3 - 3, gy + 2, 1.5 + q, 6 + h2 * 4, 2.2);
        }
      }
    }
    g.fillStyle = 'rgba(80,60,70,0.42)'; g.fill(peb);
    g.fillStyle = 'rgba(255,248,230,0.55)'; g.fill(pebH);
    g.fillStyle = 'rgba(80,140,60,0.6)'; g.fill(grass);
  });
};

// ---------- town squares: cobblestones with mortar, highlights and a border of bigger stones
Ground.paintPlazas = function (g, x0, y0) {
  for (const p of World.plazas) {
    const R = p.r * 1.25;
    if (p.x + R < x0 || p.x - R > x0 + CHW || p.y + R < y0 || p.y - R > y0 + CHW) continue;
    const b = TOWNS[p.id].biome, col = PLAZAC[b] || '#e7d3a1';
    const mortar = shadeTone(col, 0.26), path = new Path2D();
    p.pts.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]))); path.closePath();
    g.lineWidth = 18; g.strokeStyle = hexA(mortar, 0.35); g.stroke(path);
    g.fillStyle = mortar; g.fill(path);
    g.save(); g.clip(path);
    const sh = new Path2D(), hi = new Path2D(), V = [new Path2D(), new Path2D(), new Path2D()];
    const cw = 17, chh = 12;
    const ys0 = Math.max(p.y - R, y0 - 20), ys1 = Math.min(p.y + R, y0 + CHW + 20), xs0 = Math.max(p.x - R, x0 - 20), xs1 = Math.min(p.x + R, x0 + CHW + 20);
    for (let row = Math.floor(ys0 / chh); row <= Math.ceil(ys1 / chh); row++) {
      const off = (row % 2) * cw * 0.5;
      for (let colN = Math.floor((xs0 - off) / cw); colN <= Math.ceil((xs1 - off) / cw); colN++) {
        const h = hash2(colN, row, 31), h2 = hash2(colN, row, 32);
        const w = cw - 3 - h * 2.5, hh = chh - 3 - h2 * 1.5, x = colN * cw + off + (h2 - 0.5) * 1.5, y = row * chh + (h - 0.5) * 1.2;
        const v = h < 0.45 ? 0 : h < 0.8 ? 1 : 2;
        const rr = (P, dx, dy, ww, hh2) => { const r = Math.min(4, hh2 / 2); P.moveTo(x + dx - ww / 2 + r, y + dy - hh2 / 2); P.arcTo(x + dx + ww / 2, y + dy - hh2 / 2, x + dx + ww / 2, y + dy + hh2 / 2, r); P.arcTo(x + dx + ww / 2, y + dy + hh2 / 2, x + dx - ww / 2, y + dy + hh2 / 2, r); P.arcTo(x + dx - ww / 2, y + dy + hh2 / 2, x + dx - ww / 2, y + dy - hh2 / 2, r); P.arcTo(x + dx - ww / 2, y + dy - hh2 / 2, x + dx + ww / 2, y + dy - hh2 / 2, r); P.closePath(); };
        rr(sh, 0.8, 1.2, w, hh);
        rr(V[v], 0, 0, w, hh);
        hi.moveTo(x - w / 2 + 3, y - hh / 2 + 2); hi.ellipse(x - w * 0.12, y - hh * 0.22, w * 0.3, hh * 0.18, 0, Math.PI, TAU);
      }
    }
    g.fillStyle = hexA(shadeTone(col, 0.42), 0.5); g.fill(sh);
    g.fillStyle = col; g.fill(V[0]);
    g.fillStyle = shadeTone(col, 0.07); g.fill(V[1]);
    g.fillStyle = lightTone(col, 0.18); g.fill(V[2]);
    g.fillStyle = 'rgba(255,250,235,0.45)'; g.fill(hi);
    // a paw print laid in darker stones at the heart of the square
    g.fillStyle = hexA(shadeTone(col, 0.18), 0.55);
    const px = p.x, py = p.y + p.r * 0.3;
    ell(g, px, py, 26, 20); g.fill();
    for (const [dx, dy] of [[-28, -26], [-10, -38], [10, -38], [28, -26]]) { ell(g, px + dx, py + dy, 9, 10); g.fill(); }
    g.restore();
    // border stones
    const bs = new Path2D(), bsh = new Path2D();
    for (let i = 0; i < p.pts.length; i++) {
      const a = p.pts[i], c2 = p.pts[(i + 1) % p.pts.length], len = Math.hypot(c2[0] - a[0], c2[1] - a[1]), steps = Math.ceil(len / 15);
      for (let s = 0; s < steps; s++) {
        const t = s / steps, x = a[0] + (c2[0] - a[0]) * t, y = a[1] + (c2[1] - a[1]) * t, h = hash2(i, s, 41);
        const rx = 7 + h * 2.5, ry = 5 + h * 1.5;
        bsh.moveTo(x + 1 + rx, y + 1.6); bsh.ellipse(x + 1, y + 1.6, rx, ry, 0, 0, TAU);
        bs.moveTo(x + rx, y); bs.ellipse(x, y, rx, ry, 0, 0, TAU);
      }
    }
    g.fillStyle = hexA(OUT, 0.35); g.fill(bsh);
    g.fillStyle = shadeTone(col, 0.12); g.fill(bs);
  }
};

Ground.get = function (cx, cy, force) {
  const key = cy * 1000 + cx;
  let c = this.cache.get(key);
  if (c) { c.used = this.frame; return c; }
  if (!force) return null;
  c = { cv: this.render(cx, cy), used: this.frame };
  this.cache.set(key, c);
  if (this.cache.size > 46) {
    let oldK = null, old = 1e12;
    for (const [k, v] of this.cache) if (v.used < old) { old = v.used; oldK = k; }
    this.cache.delete(oldK);
  }
  return c;
};

// view rect in world space
function viewRect(pad) {
  const z = Cam.z, hw = SW / 2 / z + (pad || 0), hh = SH / 2 / z + (pad || 0);
  return { x0: Cam.x - hw, y0: Cam.y - hh, x1: Cam.x + hw, y1: Cam.y + hh };
}

Ground.draw = function (c, t) {
  this.frame++;
  const dt = clamp(t - this.lastT, 0, 0.05); this.lastT = t;
  const v = viewRect(0);
  c.fillStyle = WBANDS[WBANDS.length - 1][1];
  c.fillRect(v.x0 - 4, v.y0 - 4, v.x1 - v.x0 + 8, v.y1 - v.y0 + 8);
  const cx0 = Math.floor(v.x0 / CHW), cx1 = Math.floor(v.x1 / CHW), cy0 = Math.floor(v.y0 / CHW), cy1 = Math.floor(v.y1 / CHW);
  let made = 0;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    if (cx < 0 || cy < 0 || cx * CHW >= WW || cy * CHW >= WH) continue;
    // chunks on screen are always drawn; at most a couple of new ones per frame
    let ch = this.get(cx, cy, false);
    if (!ch && (made < 2 || !this.started)) { ch = this.get(cx, cy, true); made++; }
    if (ch) c.drawImage(ch.cv, cx * CHW - 0.5, cy * CHW - 0.5, CHW + 1, CHW + 1);
  }
  this.started = true;
  // warm the ring around the view while there is time (one chunk every few frames)
  if (made === 0 && this.frame % 3 === 0) {
    const mx = (Cam.x / CHW) | 0, my = (Cam.y / CHW) | 0;
    let best = null, bd = 1e9;
    for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHW >= WW || cy * CHW >= WH || this.cache.has(cy * 1000 + cx)) continue;
      const d = Math.abs(cx - mx) + Math.abs(cy - my);
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
    if (best) this.get(best[0], best[1], true);
  }
  this.drawSurf(c, v, t);
  this.drawWaves(c, v, t, dt);
};

// a smooth path through polyline points (quadratic curves through the midpoints)
function smoothPath(c, p, ox, oy) {
  const n = p.length / 2;
  c.moveTo(p[0], p[1]);
  for (let i = 1; i < n - 1; i++) c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[i * 2 + 2]) / 2, (p[i * 2 + 1] + p[i * 2 + 3]) / 2);
  c.lineTo(p[n * 2 - 2], p[n * 2 - 1]);
}
const _off = [];
function offsetPts(P, d, t, wob) {
  const p = P.p, nn = P.n, n = p.length / 2;
  _off.length = n * 2;
  for (let i = 0; i < n; i++) {
    const x = p[i * 2], y = p[i * 2 + 1], dd = d + (wob ? Math.sin(x * 0.021 + y * 0.017 + t * 1.3) * wob : 0);
    _off[i * 2] = x + nn[i * 2] * dd; _off[i * 2 + 1] = y + nn[i * 2 + 1] * dd;
  }
  return _off;
}

// ---------- surf: foam hugging the cliffs and beaches, waves lapping in, flowing foam on the shallows
Ground.drawSurf = function (c, v, t) {
  const S = World.shore;
  const pad = 40;
  const foam = piecesIn(S.foam, v.x0, v.y0, v.x1, v.y1, pad), ring = piecesIn(S.ring, v.x0, v.y0, v.x1, v.y1, pad), ring2 = piecesIn(S.ring2, v.x0, v.y0, v.x1, v.y1, pad);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // the outer shelf: a faint line drifting in and out
  c.beginPath(); for (const P of ring2) smoothPath(c, offsetPts(P, Math.sin(t * 0.7) * 3, t, 2.5));
  c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,255,255,0.16)'; c.stroke();
  // shallow foam: dashes that flow along the shore
  c.setLineDash([22, 30, 9, 26, 30, 40]); c.lineWidth = 2.6; c.strokeStyle = 'rgba(255,255,255,0.4)';
  for (const P of ring) { c.lineDashOffset = P.s0 - t * 11; c.beginPath(); smoothPath(c, offsetPts(P, Math.sin(t * 0.9 + P.s0 * 0.01) * 2.5, t, 2)); c.stroke(); }
  c.setLineDash([]);
  // two waves rolling in toward the shore
  for (let k = 0; k < 2; k++) {
    const ph = (t * 0.32 + k * 0.5) % 1, d = 3 + 17 * (1 - ease(ph)), a = Math.sin(ph * Math.PI) * 0.6;
    c.beginPath(); for (const P of foam) smoothPath(c, offsetPts(P, d, t, 2.2));
    c.lineWidth = 2.2 + ph * 1.6; c.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; c.stroke();
  }
  // the surf line itself
  c.beginPath(); for (const P of foam) smoothPath(c, offsetPts(P, 1.5 + Math.sin(t * 1.6) * 1.2, t, 1.2));
  c.lineWidth = 8.5; c.strokeStyle = 'rgba(232,252,255,0.55)'; c.stroke();
  c.lineWidth = 4.2; c.strokeStyle = '#ffffff'; c.stroke();
  // foam clumps rolling along the surf
  c.setLineDash([5, 19, 2, 27, 9, 23, 3, 31]); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.95)';
  for (const P of foam) { c.lineDashOffset = P.s0 + t * 9; c.beginPath(); smoothPath(c, offsetPts(P, 3.2, t, 1.5)); c.stroke(); }
  c.setLineDash([]);
};

// ---------- wave marks drifting on open water, and sparkles
Ground.marks = [];
Ground.sparks = [];
Ground.drawWaves = function (c, v, t, dt) {
  const M = this.marks, W = v.x1 - v.x0, H = v.y1 - v.y0, want = Math.round(clamp((W * H) / 24000, 14, 44));
  for (let tries = 0; M.length < want && tries < 6; tries++) {
    const x = rand(v.x0 - 30, v.x1 + 30), y = rand(v.y0 - 20, v.y1 + 20), fe = World.FEat(x, y);
    if (fe < -0.05) M.push({ x, y, age: 0, life: rand(2.6, 4.8), w: rand(12, 26) * (fe < -0.2 ? 1.2 : 0.9), vx: rand(5, 11), ph: rand(0, TAU) });
  }
  c.fillStyle = '#ffffff';
  for (let i = M.length - 1; i >= 0; i--) {
    const m = M[i]; m.age += dt; m.x += m.vx * dt;
    if (m.age > m.life || m.x < v.x0 - 80 || m.x > v.x1 + 80 || m.y < v.y0 - 60 || m.y > v.y1 + 60) { M.splice(i, 1); continue; }
    const k = m.age / m.life, a = Math.sin(k * Math.PI), w = m.w * (0.55 + 0.45 * ease(Math.min(1, k * 1.6)));
    const bob = Math.sin(t * 2 + m.ph) * 1.2;
    c.globalAlpha = a * 0.75;
    c.beginPath();
    const y = m.y + bob, pts = [[m.x - w, y - w * 0.12], [m.x - w * 0.5, y + w * 0.07], [m.x, y + w * 0.11], [m.x + w * 0.5, y + w * 0.06], [m.x + w, y - w * 0.13]];
    taperTo(c, pts, 2.4 + w * 0.07);
    if (m.w > 20) { taperTo(c, [[m.x - w * 0.35, y + w * 0.3], [m.x, y + w * 0.38], [m.x + w * 0.4, y + w * 0.28]], 1.8); }
    c.fill();
  }
  c.globalAlpha = 1;
  // sparkles
  const SP = this.sparks;
  while (SP.length < 14) { const x = rand(v.x0, v.x1), y = rand(v.y0, v.y1); if (World.FEat(x, y) < -0.03) SP.push({ x, y, age: 0, life: rand(0.5, 1.2), r: rand(2.2, 4.4) }); else break; }
  c.fillStyle = '#ffffff';
  c.beginPath();
  for (let i = SP.length - 1; i >= 0; i--) {
    const s = SP[i]; s.age += dt;
    if (s.age > s.life || s.x < v.x0 - 20 || s.x > v.x1 + 20 || s.y < v.y0 - 20 || s.y > v.y1 + 20) { SP.splice(i, 1); continue; }
    const r = s.r * Math.sin((s.age / s.life) * Math.PI);
    c.moveTo(s.x, s.y - r * 1.8); c.quadraticCurveTo(s.x, s.y, s.x + r, s.y); c.quadraticCurveTo(s.x, s.y, s.x, s.y + r * 1.8); c.quadraticCurveTo(s.x, s.y, s.x - r, s.y); c.quadraticCurveTo(s.x, s.y, s.x, s.y - r * 1.8);
  }
  c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
};

// drifting cloud shadows over the land
const Clouds = { list: [] };
Clouds.init = function () {
  const rng = mulberry32(7);
  for (let i = 0; i < 26; i++) this.list.push({ x: rng() * WW, y: rng() * WH, s: 0.8 + rng() * 1.2, v: 0.6 + rng() * 0.6 });
  // soft-edged shadow, blurred once while baking
  const c = mkCanvas(420, 260), g = c.getContext('2d');
  g.shadowColor = 'rgba(40,30,90,1)'; g.shadowBlur = 28; g.shadowOffsetX = 1000;
  g.fillStyle = '#000';
  for (const [x, y, r] of [[140, 150, 70], [215, 122, 82], [295, 150, 62], [190, 172, 62], [258, 178, 54]]) { g.beginPath(); g.arc(x - 1000, y, r, 0, TAU); g.fill(); }
  this.spr = c;
};
Clouds.draw = function (c, dt) {
  const v = viewRect(300);
  c.globalAlpha = 0.085;
  for (const k of this.list) {
    k.x += 14 * k.v * dt; k.y += 4 * k.v * dt;
    if (k.x > WW + 500) k.x = -500; if (k.y > WH + 300) k.y = -300;
    if (k.x + 420 * k.s < v.x0 || k.x > v.x1 || k.y + 260 * k.s < v.y0 || k.y > v.y1) continue;
    c.drawImage(this.spr, k.x, k.y, 420 * k.s, 260 * k.s);
  }
  c.globalAlpha = 1;
};
