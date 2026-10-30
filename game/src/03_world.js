// The overworld of Barkadia: land shape, regions, towns, roads, scenery and collision.
const WW = 9600, WH = 7200, GS = 16;           // world size, field grid step
const GW = WW / GS + 1, GH = WH / GS + 1;
const PC = 256, PCW = Math.ceil(WW / PC), PCH = Math.ceil(WH / PC);   // prop grid

const BIOMES = {
  meadow: { name: 'Waggle Meadows', g: '#9fd66a', g2: '#8cc85c', sand: '#f4df98', dark: '#6fa64a' },
  forest: { name: 'Nutwood Forest', g: '#71b65a', g2: '#5fa24c', sand: '#e9d28c', dark: '#4a8a3c' },
  plains: { name: 'Royal Plains', g: '#addb72', g2: '#9bcf63', sand: '#f4df98', dark: '#78ad4e' },
  coast: { name: 'Fetchwick Coast', g: '#b9de7c', g2: '#a6d26c', sand: '#f6e3a4', dark: '#84b358' },
  snow: { name: 'Mount Barkmore', g: '#f1f6fc', g2: '#e1ebf6', sand: '#d5e6f2', dark: '#b8cce0' },
  desert: { name: 'Bone Dry Desert', g: '#f3d083', g2: '#e9c171', sand: '#f7dd9c', dark: '#cf9f55' },
  spooky: { name: 'Howlow Woods', g: '#938cb3', g2: '#827aa3', sand: '#c9c0d6', dark: '#655d86' },
  isle: { name: 'Scratchpost Isle', g: '#cf95b0', g2: '#bf83a0', sand: '#f2d2c4', dark: '#9c6283' },
};
const BIOME_IDS = Object.keys(BIOMES);

// regions: where each biome is centred, and how strong the critters there are
const REGIONS = [
  { id: 'meadow', x: 1850, y: 4500, lv: [1, 3] },
  { id: 'forest', x: 1450, y: 2250, lv: [3, 6] },
  { id: 'plains', x: 4200, y: 3450, lv: [4, 7] },
  { id: 'coast', x: 7300, y: 3800, lv: [7, 10] },
  { id: 'snow', x: 4400, y: 1050, lv: [10, 14] },
  { id: 'spooky', x: 7300, y: 1500, lv: [12, 16] },
  { id: 'desert', x: 4800, y: 5650, lv: [14, 18] },
];
const ISLE = { id: 'isle', x: 8500, y: 6150, rx: 760, ry: 520, lv: [18, 22] };

// land is the union of soft ellipses with a wobbly coast
const BLOBS = [
  { x: 4300, y: 3400, rx: 2900, ry: 1700 },
  { x: 1700, y: 3500, rx: 1300, ry: 1900 },
  { x: 4400, y: 1250, rx: 1900, ry: 900 },
  { x: 7200, y: 1650, rx: 1400, ry: 950 },
  { x: 4700, y: 5450, rx: 2050, ry: 1100 },
  { x: 7100, y: 3700, rx: 1250, ry: 1300 },
  { x: 1950, y: 5200, rx: 950, ry: 720 },
  { x: ISLE.x, y: ISLE.y, rx: ISLE.rx, ry: ISLE.ry, isle: 1 },
  // treasure islets (reachable by swimming)
  { x: 260, y: 2300, rx: 200, ry: 170, islet: 'turtle' },
  { x: 8820, y: 3250, rx: 230, ry: 200, islet: 'gull' },
  { x: 3000, y: 6560, rx: 190, ry: 150, islet: 'sandbar' },
  { x: 6520, y: 6560, rx: 200, ry: 160, islet: 'bonekey' },
  { x: 2250, y: 640, rx: 190, ry: 160, islet: 'floe' },
];
const LAKES = [
  { x: 3520, y: 3950, rx: 270, ry: 170, name: 'Royal Pond' },
  { x: 5250, y: 1500, rx: 300, ry: 150, name: 'Frozen Pond' },
  { x: 4330, y: 5500, rx: 210, ry: 140, name: 'the Oasis' },
  { x: 7650, y: 1950, rx: 240, ry: 140, name: 'Howlow Bog' },
];

// towns and special places (positions are nudged onto land at start)
const TOWNS = {
  waggington: { name: 'Waggington', x: 1850, y: 4380, r: 360, biome: 'meadow' },
  barkingham: { name: 'Barkingham', x: 4300, y: 3330, r: 470, biome: 'plains' },
  fetchwick: { name: 'Fetchwick', x: 7600, y: 3640, r: 380, biome: 'coast' },
  frostpaw: { name: 'Frostpaw', x: 4230, y: 1760, r: 330, biome: 'snow' },
  dunehound: { name: 'Dunehound Oasis', x: 4050, y: 5230, r: 340, biome: 'desert' },
  howlow: { name: 'Howlow Hollow', x: 6980, y: 1480, r: 300, biome: 'spooky' },
  camp: { name: 'Ranger Camp', x: 1930, y: 2650, r: 220, biome: 'forest' },
  landing: { name: 'Mittens Landing', x: 7930, y: 6120, r: 200, biome: 'isle' },
};

// dungeons: big ones hold a Golden Piece, burrows are small side caves
const DUNGEON_SPOTS = {
  oak: { x: 1180, y: 1820, art: 'oak' },
  grotto: { x: 8830, y: 3190, art: 'grotto' },
  den: { x: 4640, y: 640, art: 'icecave' },
  purramid: { x: 5750, y: 5880, art: 'purramid' },
  keep: { x: 8640, y: 5980, art: 'keep' },
  b_bunny: { x: 2600, y: 4850, art: 'burrow' },
  b_mole: { x: 900, y: 3050, art: 'burrow' },
  b_kennel: { x: 3420, y: 2650, art: 'kennel' },
  b_crab: { x: 7850, y: 4550, art: 'burrow' },
  b_ice: { x: 3500, y: 950, art: 'icecave' },
  b_haunt: { x: 7750, y: 1150, art: 'kennel' },
  b_sand: { x: 5300, y: 6230, art: 'burrow' },
};

// roads: lists of points (town keys or [x,y])
const ROADS = [
  ['waggington', [2600, 4150], [3400, 3720], 'barkingham'],
  ['barkingham', [5200, 3520], [6300, 3660], 'fetchwick'],
  ['barkingham', [4250, 2700], 'frostpaw', [4420, 1500], [4560, 860]],
  ['barkingham', [4180, 4200], [4120, 4750], 'dunehound', [5000, 5620], [5650, 5800]],
  ['waggington', [1650, 3650], [1800, 3100], 'camp', [1500, 2150], [1250, 1930]],
  ['fetchwick', [7450, 2800], [7150, 2100], 'howlow'],
  ['waggington', [2350, 4700], [2600, 4800]],
];

const World = {
  F: null, BI: null, CR: null, CG: null, CB: null, TW: null,
  props: [], grid: [], decor: [], dgrid: [], coast: [], roadPolys: [], plazas: [],
  ready: false,
};

function blobF(x, y) {
  let f = -9;
  for (const b of BLOBS) {
    const dx = (x - b.x) / b.rx, dy = (y - b.y) / b.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    const v = (1 - d) * Math.min(b.rx, b.ry) / 600;
    if (v > f) f = v;
  }
  return f;
}
function rawF(x, y) {
  let f = blobF(x, y);
  f += (fbm(x / 950, y / 950, 3, 11) - 0.5) * 0.62 + (fbm(x / 230, y / 230, 2, 23) - 0.5) * 0.13;
  for (const l of LAKES) {
    const dx = (x - l.x) / l.rx, dy = (y - l.y) / l.ry;
    const d = Math.sqrt(dx * dx + dy * dy) + (vnoise(x / 120, y / 120, 31) - 0.5) * 0.25;
    f = Math.min(f, (d - 1) * Math.min(l.rx, l.ry) / 600);
  }
  // the world's edge is always sea
  f = Math.min(f, (Math.min(x, WW - x, y, WH - y) - 120) / 600);
  return f;
}

// which biome a point belongs to, plus the next one and how close to the border
function biomeRaw(x, y) {
  const idx = (x - ISLE.x) / ISLE.rx, idy = (y - ISLE.y) / ISLE.ry;
  if (idx * idx + idy * idy < 2.6) return { a: 'isle', b: 'isle', t: 1 };
  const wx = x + (fbm(x / 800, y / 800, 2, 5) - 0.5) * 900, wy = y + (fbm(x / 800, y / 800, 2, 9) - 0.5) * 900;
  let d1 = 1e12, d2 = 1e12, a = null, b = null;
  for (const r of REGIONS) {
    const d = dist(wx, wy, r.x, r.y) * (r.id === 'plains' ? 0.85 : 1);
    if (d < d1) { d2 = d1; b = a; d1 = d; a = r.id; } else if (d < d2) { d2 = d; b = r.id; }
  }
  return { a, b, t: clamp((d2 - d1) / 260, 0, 1) };
}

World.init = function () {
  const t0 = performance.now();
  const n = GW * GH;
  const F = (this.F = new Float32Array(n));
  const BI = (this.BI = new Uint8Array(n));
  const CR = (this.CR = new Uint8Array(n)), CG = (this.CG = new Uint8Array(n)), CB = (this.CB = new Uint8Array(n));
  const M = (this.M = new Float32Array(n));
  const rgbs = {};
  for (const id of BIOME_IDS) rgbs[id] = { g: hexRgb(BIOMES[id].g), g2: hexRgb(BIOMES[id].g2) };
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const x = i * GS, y = j * GS, k = j * GW + i;
    F[k] = rawF(x, y);
    const bm = biomeRaw(x, y);
    BI[k] = BIOME_IDS.indexOf(bm.a);
    const m = fbm(x / 340, y / 340, 2, 77);
    M[k] = m;
    const ca = rgbs[bm.a], cb = rgbs[bm.b];
    const mt = clamp((m - 0.35) * 2.2, 0, 1);
    const w = 0.5 + 0.5 * bm.t;
    for (let c = 0; c < 3; c++) {
      const va = lerp(ca.g[c], ca.g2[c], mt), vb = lerp(cb.g[c], cb.g2[c], mt);
      const v = lerp(vb, va, w);
      (c === 0 ? CR : c === 1 ? CG : CB)[k] = v;
    }
  }
  // nudge towns and dungeon spots onto solid land
  for (const id in TOWNS) { const t = TOWNS[id]; const p = this.toLand(t.x, t.y, 0.25); t.x = p.x; t.y = p.y; }
  for (const id in DUNGEON_SPOTS) { const t = DUNGEON_SPOTS[id]; const p = this.toLand(t.x, t.y, 0.12); t.x = p.x; t.y = p.y; }
  this.buildRoads();
  this.buildCoast();
  this.buildProps();
  this.buildTowns();
  this.buildShade();
  this.ready = true;
  this.initMs = performance.now() - t0;
};

World.Fat = function (x, y) {
  const gx = clamp(x / GS, 0, GW - 1.001), gy = clamp(y / GS, 0, GH - 1.001);
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, k = j * GW + i, F = this.F;
  const a = F[k], b = F[k + 1], c = F[k + GW], d = F[k + GW + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
World.biomeAt = function (x, y) {
  const i = clamp(Math.round(x / GS), 0, GW - 1), j = clamp(Math.round(y / GS), 0, GH - 1);
  return BIOME_IDS[this.BI[j * GW + i]];
};
World.regionAt = function (x, y) {
  const b = this.biomeAt(x, y);
  return b === 'isle' ? ISLE : REGIONS.find((r) => r.id === b);
};
World.toLand = function (x, y, minF) {
  if (this.Fat(x, y) > minF) return { x, y };
  for (let r = 24; r < 1200; r += 24) for (let a = 0; a < 24; a++) {
    const px = x + Math.cos((a / 24) * TAU) * r, py = y + Math.sin((a / 24) * TAU) * r;
    if (this.Fat(px, py) > minF) return { x: px, y: py };
  }
  return { x, y };
};
World.townAt = function (x, y) {
  for (const id in TOWNS) { const t = TOWNS[id]; if (dist2(x, y, t.x, t.y) < t.r * t.r) return id; }
  return null;
};

// ---------- roads (drawn as crisp strokes every frame) and town plazas
World.buildRoads = function () {
  const pt = (p) => (typeof p === 'string' ? [TOWNS[p].x, TOWNS[p].y] : p);
  this.roadSegs = [];
  this.roadPolys = ROADS.map((r, ri) => {
    const pts = r.map(pt), out = [];
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      const len = dist(ax, ay, bx, by), steps = Math.max(2, Math.round(len / 70));
      const nx = -(by - ay) / len, ny = (bx - ax) / len;
      for (let k = 0; k < steps; k++) {
        const t = k / steps, w = (vnoise(ri * 50 + s * 9 + t * len / 300, 3, 41) - 0.5) * 110 * Math.sin(t * Math.PI);
        out.push([ax + (bx - ax) * t + nx * w, ay + (by - ay) * t + ny * w]);
      }
    }
    out.push(pts[pts.length - 1]);
    for (let k = 0; k < out.length - 1; k++) this.roadSegs.push([out[k][0], out[k][1], out[k + 1][0], out[k + 1][1]]);
    return out;
  });
  this.plazas = Object.keys(TOWNS).map((id) => {
    const t = TOWNS[id], pts = [], R = t.r * 0.62;
    for (let a = 0; a < 28; a++) { const ang = (a / 28) * TAU, rr = R * (0.86 + 0.28 * vnoise(Math.cos(ang) * 2 + 5, Math.sin(ang) * 2 + id.length, 61)); pts.push([t.x + Math.cos(ang) * rr, t.y + Math.sin(ang) * rr * 0.8]); }
    return { id, pts, x: t.x, y: t.y, r: R };
  });
};
World.roadDist = function (x, y) {
  let best = 1e9;
  for (const s of this.roadSegs) {
    const [ax, ay, bx, by] = s, dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const d = dist2(x, y, ax + dx * t, ay + dy * t);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
};

// ---------- the raised land (visual only): the map reads as a thick plateau, so south and east coasts show a
// cliff face. FE is the land field pushed down (and a little right) by the cliff height: where F < 0 but FE >= 0
// the pixel is cliff face; the sea, its depth and the foam all follow FE. Gameplay still uses F alone.
const CLIFF_H = 20, CLIFF_SKEW = 0.3, LAKE_H = 9;
function cliffH(x, y) {
  for (const l of LAKES) { const dx = (x - l.x) / (l.rx + 170), dy = (y - l.y) / (l.ry + 170); if (dx * dx + dy * dy < 1) return LAKE_H; }
  return CLIFF_H;
}
// exact extruded field from F samples along the drop
World.FEx = function (x, y) {
  let f = this.Fat(x, y);
  if (f >= 0 || f < -0.1) return f;
  const h = cliffH(x, y);
  for (let s = 1; s <= 4; s++) { const t = s / 4, g = this.Fat(x - CLIFF_SKEW * h * t, y - h * t); if (g > f) f = g; }
  return f;
};
// bilinear sample of any grid field
function gridAt(A, x, y) {
  const gx = clamp(x / GS, 0, GW - 1.001), gy = clamp(y / GS, 0, GH - 1.001);
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, k = j * GW + i;
  const a = A[k], b = A[k + 1], c = A[k + GW], d = A[k + GW + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
World.FEat = function (x, y) { return gridAt(this.FE, x, y); };

// marching squares on a grid field at level L, chained into polylines, cut into short pieces for culling.
// each piece: { p: [x,y,...], n: [nx,ny,...] (unit normal toward lower values, i.e. toward the water), bbox, s0: length at start }
World.contours = function (A, L, pieceN) {
  const sx = [], sy = [], ex = [], ey = [], se = [], ee = [];
  const at = new Map();
  const link = (e, s) => { const l = at.get(e); if (l) l.push(s); else at.set(e, [s]); };
  const add = (e1, x1, y1, e2, x2, y2) => { const s = se.length; se.push(e1); sx.push(x1); sy.push(y1); ee.push(e2); ex.push(x2); ey.push(y2); link(e1, s); link(e2, s); };
  for (let j = 0; j < GH - 1; j++) for (let i = 0; i < GW - 1; i++) {
    const k = j * GW + i;
    const a = A[k], b = A[k + 1], c = A[k + GW + 1], d = A[k + GW];
    const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const x = i * GS, y = j * GS;
    const ip = (v1, v2) => (L - v1) / (v2 - v1 || 1e-6);
    const T = [k * 2, x + GS * ip(a, b), y], R = [(k + 1) * 2 + 1, x + GS, y + GS * ip(b, c)], B = [(k + GW) * 2, x + GS * ip(d, c), y + GS], Lf = [k * 2 + 1, x, y + GS * ip(a, d)];
    const seg = (p, q) => add(p[0], p[1], p[2], q[0], q[1], q[2]);
    switch (idx) {
      case 1: case 14: seg(Lf, B); break;
      case 2: case 13: seg(B, R); break;
      case 3: case 12: seg(Lf, R); break;
      case 4: case 11: seg(T, R); break;
      case 6: case 9: seg(T, B); break;
      case 7: case 8: seg(Lf, T); break;
      case 5: seg(Lf, T); seg(B, R); break;
      case 10: seg(T, R); seg(Lf, B); break;
    }
  }
  const used = new Uint8Array(se.length), lines = [];
  const walk = (e, out) => {
    for (;;) {
      const l = at.get(e); let nx = -1;
      if (l) for (const s of l) if (!used[s]) { nx = s; break; }
      if (nx < 0) return e;
      used[nx] = 1;
      if (se[nx] === e) { out.push(ex[nx], ey[nx]); e = ee[nx]; } else { out.push(sx[nx], sy[nx]); e = se[nx]; }
    }
  };
  for (let s = 0; s < se.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const fw = [sx[s], sy[s], ex[s], ey[s]], bw = [];
    walk(ee[s], fw);
    walk(se[s], bw);
    const pts = [];
    for (let i = bw.length - 2; i >= 0; i -= 2) pts.push(bw[i], bw[i + 1]);
    for (const v of fw) pts.push(v);
    if (pts.length >= 6) lines.push(pts);
  }
  // cut into pieces with normals
  const pieces = [];
  pieceN = pieceN || 28;
  for (const pts of lines) {
    const n = pts.length / 2;
    let len = 0;
    for (let st = 0; st < n - 1; st += pieceN - 1) {
      const en = Math.min(n, st + pieceN), p = [], nn = [];
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const s0 = len;
      for (let i = st; i < en; i++) {
        const x = pts[i * 2], y = pts[i * 2 + 1];
        p.push(x, y);
        if (i > st) len += Math.hypot(x - p[p.length - 4], y - p[p.length - 3]);
        const gx = gridAt(A, x + 4, y) - gridAt(A, x - 4, y), gy = gridAt(A, x, y + 4) - gridAt(A, x, y - 4), gl = Math.hypot(gx, gy) || 1;
        nn.push(-gx / gl, -gy / gl);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      pieces.push({ p, n: nn, x0, y0, x1, y1, s0 });
      if (en === n) break;
    }
  }
  return pieces;
};

World.buildCoast = function () {
  const n = GW * GH, F = this.F, FE = (this.FE = new Float32Array(n));
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const k = j * GW + i; FE[k] = F[k] >= 0 || F[k] < -0.1 ? F[k] : this.FEx(i * GS, j * GS); }
  this.shore = {
    lip: this.contours(F, 0, 24),          // top edge of the land (the cliff lip, or the beach waterline)
    foam: this.contours(FE, 0, 28),        // base of the cliffs and beaches: the surf line
    ring: this.contours(FE, -0.035, 28),   // shallow-water foam ring
    ring2: this.contours(FE, -0.085, 32),  // outer ring where the shelf drops off
  };
};

// ---------- shade under tree clusters (visual only): a soft density grid baked into the ground
World.buildShade = function () {
  const TS = (this.TS = new Float32Array(GW * GH));
  const R = { tree: 46, pine: 38, palm: 30, dead: 26, bush: 26, mountain: 150, rock: 20, srock: 20, log: 22, stump: 18, cactus: 16 };
  for (const p of this.props) {
    if (p.gone || !R[p.kind]) continue;
    const r = R[p.kind] * (p.s || 1), x = p.x + r * 0.18, y = p.y - (p.kind === 'mountain' ? 20 : 2) * (p.s || 1);
    const w = p.kind === 'tree' || p.kind === 'pine' ? 0.75 : p.kind === 'mountain' ? 0.6 : 0.5;
    for (let gy = Math.max(0, Math.floor((y - r) / GS)); gy <= Math.min(GH - 1, Math.ceil((y + r) / GS)); gy++)
      for (let gx = Math.max(0, Math.floor((x - r) / GS)); gx <= Math.min(GW - 1, Math.ceil((x + r) / GS)); gx++) {
        const dx = (gx * GS - x) / r, dy = (gy * GS - y) / (r * 0.8), d = dx * dx + dy * dy;
        if (d < 1) TS[gy * GW + gx] += (1 - d) * (1 - d) * w;
      }
  }
  for (let k = 0; k < TS.length; k++) TS[k] = TS[k] > 1.4 ? 1.4 : TS[k];
  // keep flat decor off the roads and town squares (purely visual)
  for (let i = 0; i < this.dgrid.length; i++) {
    const g = this.dgrid[i];
    if (!g.length) continue;
    const cx = (i % PCW) * PC + PC / 2, cy = Math.floor(i / PCW) * PC + PC / 2;
    const nearRoad = this.roadSegs.some((s) => Math.min(s[0], s[2]) < cx + PC && Math.max(s[0], s[2]) > cx - PC && Math.min(s[1], s[3]) < cy + PC && Math.max(s[1], s[3]) > cy - PC);
    const nearTown = this.plazas.some((p) => Math.abs(p.x - cx) < p.r + PC && Math.abs(p.y - cy) < p.r + PC);
    if (!nearRoad && !nearTown) continue;
    this.dgrid[i] = g.filter((d) => (!nearRoad || this.roadDist(d.x, d.y) > 28) && (!nearTown || !this.plazas.some((p) => inPoly(p.pts, d.x, d.y))));
  }
};
function inPoly(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// ---------- scenery props
// kinds: tree, pine, palm, dead, bush, rock, srock, cactus, mountain, mushroom, pumpkin, yarn, post, bones, log, snowman, stump
// decor (flat, no collision): tuft, flower, pebble, shell, drift, fern
function propAt(kind, x, y, opts) {
  const p = Object.assign({ kind, x, y, v: 0, s: 1, r: 0 }, opts || {});
  if (!p.r) p.r = PROP_R[kind] || 0;
  return p;
}
const PROP_R = { tree: 20, pine: 18, palm: 14, dead: 14, bush: 16, rock: 20, srock: 20, cactus: 13, mountain: 95, mushroom: 0, pumpkin: 12, yarn: 14, post: 12, bones: 0, log: 18, snowman: 14, stump: 14, crystal: 14, lamp: 6 };

World.addProp = function (p) {
  this.props.push(p);
  const cx = clamp(Math.floor(p.x / PC), 0, PCW - 1), cy = clamp(Math.floor(p.y / PC), 0, PCH - 1);
  this.grid[cy * PCW + cx].push(p);
  return p;
};
World.addDecor = function (d) {
  const cx = clamp(Math.floor(d.x / PC), 0, PCW - 1), cy = clamp(Math.floor(d.y / PC), 0, PCH - 1);
  this.dgrid[cy * PCW + cx].push(d);
};
World.clearSpot = function (x, y, r) {
  for (const t of Object.values(TOWNS)) if (dist(x, y, t.x, t.y) < t.r + r) return false;
  for (const t of Object.values(DUNGEON_SPOTS)) if (dist(x, y, t.x, t.y) < 170 + r) return false;
  if (this.roadDist(x, y) < 52 + r) return false;
  return true;
};
World.buildProps = function () {
  this.grid = []; this.dgrid = []; this.props = [];
  for (let i = 0; i < PCW * PCH; i++) { this.grid.push([]); this.dgrid.push([]); }
  const rng = mulberry32(2026);
  const C = 56;
  for (let cy = 0; cy < WH / C; cy++) for (let cx = 0; cx < WW / C; cx++) {
    const x = cx * C + rng() * C, y = cy * C + rng() * C;
    const f = this.Fat(x, y);
    const r1 = rng(), r2 = rng();
    if (f < 0.035) {
      if (f > 0.005 && r1 < 0.06) { const b = this.biomeAt(x, y); if (b === 'coast' || b === 'meadow' || b === 'isle') this.addDecor({ kind: 'shell', x, y, v: (r2 * 3) | 0 }); }
      continue;
    }
    const b = this.biomeAt(x, y);
    const m = fbm(x / 500, y / 500, 2, 91);       // clumping: woods grow in patches
    const open = this.clearSpot(x, y, 10);
    // flat decor first
    if (r2 < 0.5) {
      const dk = { meadow: ['tuft', 'flower', 'flower'], forest: ['tuft', 'fern', 'fern'], plains: ['tuft', 'flower', 'tuft'], coast: ['tuft', 'tuft', 'shell'],
        snow: ['drift', 'drift', 'pebble'], desert: ['pebble', 'pebble', 'tuft'], spooky: ['tuft', 'fern', 'pebble'], isle: ['tuft', 'pebble', 'flower'] }[b];
      this.addDecor({ kind: dk[(r2 * 6) | 0 % 3] || dk[0], x: x + rng() * 30 - 15, y: y + rng() * 30 - 15, v: (rng() * 4) | 0, b });
    }
    if (!open) continue;
    let kind = null;
    const dens = clamp((m - 0.38) * 2.4, 0, 1);
    switch (b) {
      case 'meadow': if (r1 < 0.04 + dens * 0.2) kind = 'tree'; else if (r1 < 0.27) kind = r2 < 0.3 ? 'bush' : null; else if (r1 < 0.29) kind = 'rock'; break;
      case 'forest': if (r1 < 0.16 + dens * 0.4) kind = r2 < 0.18 ? 'pine' : 'tree'; else if (r1 < 0.58) kind = r2 < 0.2 ? 'bush' : r2 < 0.3 ? 'mushroom' : r2 < 0.33 ? 'log' : null; break;
      case 'plains': if (r1 < 0.03 + dens * 0.1) kind = 'tree'; else if (r1 < 0.2) kind = r2 < 0.22 ? 'bush' : r2 < 0.3 ? 'rock' : null; break;
      case 'coast': if (r1 < 0.04 + dens * 0.08) kind = r2 < 0.55 ? 'palm' : 'tree'; else if (r1 < 0.16) kind = r2 < 0.25 ? 'rock' : r2 < 0.4 ? 'bush' : null; break;
      case 'snow': if (r1 < 0.08 + dens * 0.18) kind = 'pine'; else if (r1 < 0.26) kind = r2 < 0.25 ? 'srock' : r2 < 0.3 ? 'snowman' : r2 < 0.34 ? 'crystal' : null; break;
      case 'desert': if (r1 < 0.05) kind = 'cactus'; else if (r1 < 0.14) kind = r2 < 0.35 ? 'rock' : r2 < 0.6 ? 'bones' : null; break;
      case 'spooky': if (r1 < 0.1 + dens * 0.15) kind = r2 < 0.6 ? 'dead' : 'pine'; else if (r1 < 0.34) kind = r2 < 0.3 ? 'mushroom' : r2 < 0.45 ? 'pumpkin' : r2 < 0.55 ? 'stump' : null; break;
      case 'isle': if (r1 < 0.05 + dens * 0.06) kind = r2 < 0.5 ? 'post' : 'tree'; else if (r1 < 0.2) kind = r2 < 0.3 ? 'yarn' : r2 < 0.45 ? 'rock' : r2 < 0.55 ? 'bones' : null; break;
    }
    if (kind) {
      const big = kind === 'tree' || kind === 'pine' || kind === 'palm' || kind === 'dead';
      this.addProp(propAt(kind, x, y, { v: (rng() * 4) | 0, s: big ? 1.1 + rng() * 0.45 : 0.85 + rng() * 0.35 }));
    }
  }
  // the mountains of Barkmore: a range across the high north, leaving the road, the towns and the caves clear
  for (let y = 100; y < 1750; y += 125) for (let x = 2500; x < 6600; x += 150) {
    const px = x + (rng() - 0.5) * 110 + ((y / 125) % 2) * 70, py = y + (rng() - 0.5) * 80;
    const f = this.Fat(px, py);
    if (f < 0.16 || this.biomeAt(px, py) !== 'snow') continue;
    if (this.roadDist(px, py) < 200 || !this.clearSpot(px, py, 150)) continue;
    if (vnoise(px / 380, py / 380, 13) < 0.3 + Math.max(0, py - 600) / 3000) continue;
    if (dist(px, py, LAKES[1].x, LAKES[1].y) < 430) continue;
    if (this.grid[Math.floor(py / PC) * PCW + Math.floor(px / PC)].some((q) => q.kind === 'mountain' && dist(q.x, q.y, px, py) < 160)) continue;
    this.addProp(propAt('mountain', px, py, { v: (rng() * 3) | 0, s: 0.75 + rng() * 0.45 }));
  }
  // clear small scenery out from under the mountains
  for (const g of this.grid) for (let i = g.length - 1; i >= 0; i--) { const q = g[i]; if (q.kind === 'mountain') continue; if (this.props.some((m) => m.kind === 'mountain' && Math.abs(m.x - q.x) < 110 * m.s && q.y < m.y + 10 && q.y > m.y - 150 * m.s)) { g.splice(i, 1); q.gone = true; } }
  this.props = this.props.filter((q) => !q.gone);
};

// is the spot blocked for a body of radius r? swim: shallow water is fine
World.blocked = function (x, y, r, swim) {
  const f = this.Fat(x, y);
  if (f < 0.012) {
    if (!swim) return true;
    if (f < -0.45) return true;
    if (!G.flags.ferry && dist2(x, y, ISLE.x, ISLE.y) < 1500 * 1500 && this.biomeAt(x, y) !== 'isle') return true;
  }
  const cx0 = Math.floor((x - 220) / PC), cx1 = Math.floor((x + 220) / PC), cy0 = Math.floor((y - 220) / PC), cy1 = Math.floor((y + 220) / PC);
  for (let cy = Math.max(0, cy0); cy <= Math.min(PCH - 1, cy1); cy++) for (let cx = Math.max(0, cx0); cx <= Math.min(PCW - 1, cx1); cx++) {
    for (const p of this.grid[cy * PCW + cx]) {
      if (p.box) { const b = p.box; if (x + r > b[0] && x - r < b[0] + b[2] && y + r > b[1] && y - r < b[1] + b[3]) return true; continue; }
      if (!p.r || p.gone) continue;
      const rr = p.r * (p.s || 1) + r;
      if (dist2(x, y, p.x, p.y) < rr * rr) return true;
    }
  }
  return false;
};
World.inWater = function (x, y) { return this.Fat(x, y) < 0.012; };
World.propsIn = function (x0, y0, x1, y1, out) {
  for (let cy = Math.max(0, Math.floor(y0 / PC)); cy <= Math.min(PCH - 1, Math.floor(y1 / PC)); cy++)
    for (let cx = Math.max(0, Math.floor(x0 / PC)); cx <= Math.min(PCW - 1, Math.floor(x1 / PC)); cx++) for (const p of this.grid[cy * PCW + cx]) out.push(p);
  return out;
};
