// Ground: soft colour fields baked into chunks, with crisp coastlines, foam, plazas and roads drawn as vectors on top.
const CHW = 512, CHS = 0.5, CHP = CHW * CHS;   // chunk world size, scale, pixel size
const Ground = { cache: new Map(), queue: [], frame: 0 };

const WATER = { edge: hexRgb('#a8ecf2'), shallow: hexRgb('#5fc8ec'), deep: hexRgb('#3b94dd') };
const SANDS = {};
for (const id of BIOME_IDS) SANDS[id] = hexRgb(BIOMES[id].sand);

Ground.render = function (cx, cy) {
  const c = mkCanvas(CHP, CHP), g = c.getContext('2d');
  const img = g.createImageData(CHP, CHP), d = img.data;
  const x0 = cx * CHW, y0 = cy * CHW, step = 1 / CHS;
  const F = World.F, CR = World.CR, CG = World.CG, CB = World.CB, BI = World.BI;
  for (let py = 0; py < CHP; py++) {
    const wy = y0 + (py + 0.5) * step;
    const gy = clamp(wy / GS, 0, GH - 1.001), j = gy | 0, fy = gy - j;
    for (let px = 0; px < CHP; px++) {
      const wx = x0 + (px + 0.5) * step;
      const gx = clamp(wx / GS, 0, GW - 1.001), i = gx | 0, fx = gx - i;
      const k = j * GW + i, k2 = k + 1, k3 = k + GW, k4 = k + GW + 1;
      const w1 = (1 - fx) * (1 - fy), w2 = fx * (1 - fy), w3 = (1 - fx) * fy, w4 = fx * fy;
      const f = F[k] * w1 + F[k2] * w2 + F[k3] * w3 + F[k4] * w4;
      let r, gg, b;
      const o = (py * CHP + px) * 4;
      if (f < 0) {
        const t = clamp(-f / 0.55, 0, 1);
        const A = t < 0.22 ? WATER.edge : WATER.shallow, B = t < 0.22 ? WATER.shallow : WATER.deep, u = t < 0.22 ? t / 0.22 : (t - 0.22) / 0.78;
        r = A[0] + (B[0] - A[0]) * u; gg = A[1] + (B[1] - A[1]) * u; b = A[2] + (B[2] - A[2]) * u;
        const wave = Math.sin(wx * 0.021 + Math.sin(wy * 0.012) * 2.2 + wy * 0.006) * 0.5 + 0.5;
        const wv = (wave > 0.86 ? 10 : 0) * (0.4 + t * 0.6);
        r += wv; gg += wv; b += wv;
      } else {
        r = CR[k] * w1 + CR[k2] * w2 + CR[k3] * w3 + CR[k4] * w4;
        gg = CG[k] * w1 + CG[k2] * w2 + CG[k3] * w3 + CG[k4] * w4;
        b = CB[k] * w1 + CB[k2] * w2 + CB[k3] * w3 + CB[k4] * w4;
        if (f < 0.07) {
          const sd = SANDS[BIOME_IDS[BI[w1 + w3 > 0.5 ? k : k2]]];
          const t = clamp((f - 0.045) / 0.025, 0, 1);
          r = sd[0] + (r - sd[0]) * t; gg = sd[1] + (gg - sd[1]) * t; b = sd[2] + (b - sd[2]) * t;
        }
        const n = (hash2(wx >> 2, wy >> 2, 3) - 0.5) * 7;
        r += n; gg += n; b += n;
      }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
};

Ground.get = function (cx, cy, force) {
  const key = cy * 1000 + cx;
  let c = this.cache.get(key);
  if (c) { c.used = this.frame; return c; }
  if (!force) return null;
  c = { cv: this.render(cx, cy), used: this.frame };
  this.cache.set(key, c);
  if (this.cache.size > 90) {
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
  const v = viewRect(0);
  c.fillStyle = '#3b94dd';
  c.fillRect(v.x0 - 4, v.y0 - 4, v.x1 - v.x0 + 8, v.y1 - v.y0 + 8);
  const cx0 = Math.floor(v.x0 / CHW), cx1 = Math.floor(v.x1 / CHW), cy0 = Math.floor(v.y0 / CHW), cy1 = Math.floor(v.y1 / CHW);
  let made = 0;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    if (cx < 0 || cy < 0 || cx * CHW >= WW || cy * CHW >= WH) continue;
    // chunks on screen are always drawn; at most a few new ones per frame
    let ch = this.get(cx, cy, false);
    if (!ch && (made < 3 || !this.started)) { ch = this.get(cx, cy, true); made++; }
    if (ch) c.drawImage(ch.cv, cx * CHW - 0.5, cy * CHW - 0.5, CHW + 1, CHW + 1);
  }
  this.started = true;
  // warm the ring around the view while there is time
  if (made === 0) {
    for (let cy = cy0 - 1; cy <= cy1 + 1 && made < 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1 && made < 1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHW >= WW || cy * CHW >= WH) continue;
      if (!this.get(cx, cy, false)) { this.get(cx, cy, true); made++; }
    }
  }
  this.drawCoast(c, v, t);
  this.drawGlints(c, v, t);
  this.drawRoads(c, v);
  this.drawPlazas(c, v);
};

Ground.drawCoast = function (c, v, t) {
  const cx0 = Math.max(0, Math.floor(v.x0 / PC)), cx1 = Math.min(PCW - 1, Math.floor(v.x1 / PC));
  const cy0 = Math.max(0, Math.floor(v.y0 / PC)), cy1 = Math.min(PCH - 1, Math.floor(v.y1 / PC));
  const styles = [
    { w: 3.2, s: 'rgba(120,84,60,0.45)' },
    { w: 4.5 + Math.sin(t * 1.6) * 1.2, s: `rgba(255,255,255,${0.78 + Math.sin(t * 1.6) * 0.15})` },
    { w: 2.6, s: `rgba(255,255,255,${0.22 + Math.sin(t * 1.6 + 1.7) * 0.14})` },
  ];
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let li = 2; li >= 0; li--) {
    c.beginPath();
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const s = World.coast[li][cy * PCW + cx];
      for (let i = 0; i < s.length; i += 4) { c.moveTo(s[i], s[i + 1]); c.lineTo(s[i + 2], s[i + 3]); }
    }
    c.lineWidth = styles[li].w; c.strokeStyle = styles[li].s; c.stroke();
  }
};

// little white wave marks that blink on the water
Ground.glints = [];
Ground.drawGlints = function (c, v, t) {
  const G = this.glints;
  while (G.length < 26) {
    const x = rand(v.x0, v.x1), y = rand(v.y0, v.y1);
    if (World.Fat(x, y) < -0.06) G.push({ x, y, t: 0, life: rand(1.4, 2.6), s: rand(0.7, 1.2) }); else if (Math.random() < 0.7) break;
  }
  c.lineCap = 'round'; c.lineWidth = 2.4;
  for (let i = G.length - 1; i >= 0; i--) {
    const g = G[i]; g.t += 1 / 60;
    if (g.t > g.life || g.x < v.x0 - 50 || g.x > v.x1 + 50 || g.y < v.y0 - 50 || g.y > v.y1 + 50) { G.splice(i, 1); continue; }
    const a = Math.sin((g.t / g.life) * Math.PI);
    c.strokeStyle = `rgba(255,255,255,${0.75 * a})`;
    c.beginPath(); c.arc(g.x - 7 * g.s, g.y, 7 * g.s, 0.15 * Math.PI, 0.85 * Math.PI); c.arc(g.x + 7 * g.s, g.y, 7 * g.s, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
};

Ground.drawPlazas = function (c, v) {
  for (const p of World.plazas) {
    if (p.x + p.r < v.x0 || p.x - p.r > v.x1 || p.y + p.r < v.y0 || p.y - p.r > v.y1) continue;
    const b = TOWNS[p.id].biome;
    const col = { snow: '#d9e3ee', desert: '#e8c78e', spooky: '#a59ab8', isle: '#d9a9bd' }[b] || '#e7d3a1';
    c.beginPath(); p.pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath();
    c.fillStyle = shade(col, -0.12); c.lineWidth = 14; c.strokeStyle = shade(col, -0.12); c.lineJoin = 'round'; c.stroke(); c.fill();
    c.fillStyle = col; c.fill();
    // cobbles
    c.fillStyle = shade(col, -0.07);
    for (let i = 0; i < 40; i++) {
      const a = hash2(i, p.id.length, 5) * TAU, r = Math.sqrt(hash2(i, 3, 9)) * p.r * 0.85;
      ell(c, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.8, 9, 6); c.fill();
    }
  }
};

Ground.drawRoads = function (c, v) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  const passes = [[50, '#c9a873'], [40, '#e6cf9a']];
  for (const [w, col] of passes) {
    c.beginPath();
    for (const poly of World.roadPolys) {
      let on = false;
      for (let i = 0; i < poly.length; i++) {
        const [x, y] = poly[i];
        const vis = x > v.x0 - 200 && x < v.x1 + 200 && y > v.y0 - 200 && y < v.y1 + 200;
        if (vis) { if (!on) { c.moveTo(x, y); on = true; } else c.lineTo(x, y); } else if (on) { c.lineTo(x, y); on = false; }
      }
    }
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
};

// drifting cloud shadows over the land
const Clouds = { list: [] };
Clouds.init = function () {
  const rng = mulberry32(7);
  for (let i = 0; i < 26; i++) this.list.push({ x: rng() * WW, y: rng() * WH, s: 0.8 + rng() * 1.2, v: 0.6 + rng() * 0.6 });
  const c = mkCanvas(420, 260), g = c.getContext('2d');
  g.fillStyle = 'rgba(40,40,90,1)';
  for (const [x, y, r] of [[140, 150, 80], [220, 120, 95], [300, 150, 70], [190, 175, 70], [260, 180, 60]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  this.spr = c;
};
Clouds.draw = function (c, dt) {
  const v = viewRect(300);
  c.globalAlpha = 0.07;
  for (const k of this.list) {
    k.x += 14 * k.v * dt; k.y += 4 * k.v * dt;
    if (k.x > WW + 500) k.x = -500; if (k.y > WH + 300) k.y = -300;
    if (k.x + 420 * k.s < v.x0 || k.x > v.x1 || k.y + 260 * k.s < v.y0 || k.y > v.y1) continue;
    c.drawImage(this.spr, k.x, k.y, 420 * k.s, 260 * k.s);
  }
  c.globalAlpha = 1;
};
