// Atmosphere: biome particles in world space around the camera (falling leaves, snow, sand wisps, fireflies, mist,
// petals, sea spray, warm motes), a few high clouds, and a light vignette with a gentle colour grade per biome.
// Kept light: under 120 particles, a handful of drawImage calls, nothing that fogs over the characters.
const Atmos = { P: [], n: {}, ready: false, tint: [255, 214, 150, 0.05], tintKey: '', over: null, overKey: '' };
const ATM_CAP = 112;
const ATM_TYPE = { meadow: 'leaf', forest: 'leaf', plains: 'leaf', coast: 'mote', snow: 'snow', desert: 'sand', spooky: 'fly', isle: 'petal' };
const ATM_MAX = { leaf: 24, snow: 56, sand: 18, fly: 16, mist: 4, petal: 26, spray: 18, mote: 10 };
const ATM_GRADE = {
  meadow: [255, 206, 140, 0.06], forest: [150, 210, 150, 0.05], plains: [255, 214, 140, 0.06], coast: [150, 220, 255, 0.05],
  snow: [175, 205, 255, 0.07], desert: [255, 188, 112, 0.07], spooky: [128, 96, 196, 0.09], isle: [255, 172, 214, 0.06],
};

Atmos.init = function () {
  this.ready = true;
  // little leaf and petal sprites, drawn at 2x
  const leaf = (col) => { const c = mkCanvas(24, 16), g = c.getContext('2d'); g.scale(2, 2); g.translate(6, 4);
    g.fillStyle = col; g.beginPath(); g.moveTo(-5, 0); g.bezierCurveTo(-2, -4.2, 2, -3.8, 5, 0); g.bezierCurveTo(2, 3.8, -2, 4.2, -5, 0); g.fill();
    g.fillStyle = lightTone(col, 0.35); g.beginPath(); g.moveTo(-4, -0.4); g.bezierCurveTo(-1.6, -3.2, 1.6, -2.8, 4, -0.4); g.closePath(); g.fill();
    g.strokeStyle = shadeTone(col, 0.35); g.lineWidth = 0.6; g.beginPath(); g.moveTo(-4.6, 0); g.lineTo(4.4, 0); g.stroke(); return c; };
  this.leaves = ['#f0973a', '#e2603b', '#f2c242', '#d9822f', '#7cc04f'].map(leaf);
  const petal = (col) => { const c = mkCanvas(16, 12), g = c.getContext('2d'); g.scale(2, 2); g.translate(4, 3);
    g.fillStyle = col; g.beginPath(); g.moveTo(-3.5, 0); g.quadraticCurveTo(0, -3.2, 3.5, -0.4); g.quadraticCurveTo(0.5, 2.6, -3.5, 0); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-0.6, -0.8, 1.6, 0.8, 0, 0, TAU); g.fill(); return c; };
  this.petals = ['#ffc1dc', '#ff9cc6', '#fff0f6'].map(petal);
  // a high cloud: puffy, white on top, lavender underneath, soft edged
  const cc = mkCanvas(360, 180), g = cc.getContext('2d');
  const puffs = [[95, 112, 46], [150, 88, 60], [215, 96, 52], [262, 118, 38], [180, 124, 44], [120, 128, 34]];
  g.shadowColor = '#c9c3ec'; g.shadowBlur = 14; g.shadowOffsetX = 1000; g.fillStyle = '#000';
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x - 1000, y + 6, r, 0, TAU); g.fill(); }
  g.shadowColor = '#ffffff'; g.shadowBlur = 10;
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x - 1000 - r * 0.12, y - r * 0.14, r * 0.9, 0, TAU); g.fill(); }
  g.shadowBlur = 0; g.shadowOffsetX = 0;
  this.cloud = cc;
  const rng = mulberry32(31);
  this.highs = [];
  for (let i = 0; i < 8; i++) this.highs.push({ x: rng() * WW, y: rng() * WH, s: 0.9 + rng() * 0.6, v: 8 + rng() * 6 });
  this.overCv = mkCanvas(64, 64);
};

Atmos.spawn = function (v, b) {
  const x = rand(v.x0, v.x1), y = rand(v.y0, v.y1);
  const bm = World.biomeAt(x, y);
  let k = ATM_TYPE[bm] || 'leaf';
  if (bm === 'spooky' && Math.random() < 0.12) k = 'mist';
  if ((bm === 'meadow' || bm === 'plains') && Math.random() < 0.3) k = 'mote';
  if ((this.n[k] || 0) >= ATM_MAX[k]) return;
  const p = { k, x, y, age: 0, ph: rand(0, TAU) };
  switch (k) {
    case 'leaf': p.life = rand(4, 7); p.vx = rand(14, 28); p.vy = rand(10, 22); p.spin = rand(-2.5, 2.5); p.s = rand(0.7, 1.1); p.img = this.leaves[bm === 'forest' && Math.random() < 0.4 ? 4 : (Math.random() * 4) | 0]; break;
    case 'snow': p.life = rand(5, 8); p.vx = rand(6, 16); p.vy = rand(26, 50); p.r = Math.random() < 0.25 ? rand(2.2, 3) : rand(1.1, 1.9); break;
    case 'sand': p.life = rand(1.2, 2.2); p.vx = rand(120, 200); p.vy = rand(-8, 8); p.len = rand(16, 34); break;
    case 'fly': p.life = rand(5, 9); p.dir = rand(0, TAU); p.sp = rand(8, 18); break;
    case 'mist': p.life = rand(9, 14); p.vx = rand(4, 9); p.s = rand(80, 130); break;
    case 'petal': p.life = rand(4, 7); p.vx = rand(16, 30); p.vy = rand(12, 22); p.spin = rand(-3, 3); p.s = rand(0.8, 1.15); p.img = this.petals[(Math.random() * 3) | 0]; break;
    case 'mote': p.life = rand(3, 6); p.vx = rand(-4, 6); p.vy = rand(-8, -3); p.r = rand(1, 1.8); break;
  }
  this.P.push(p); this.n[k] = (this.n[k] || 0) + 1;
};
// sea spray rising off the surf in view
Atmos.spray = function (v) {
  if ((this.n.spray || 0) >= ATM_MAX.spray || Math.random() > 0.35) return;
  const vis = World.shore.foam.filter((P) => P.x1 > v.x0 && P.x0 < v.x1 && P.y1 > v.y0 && P.y0 < v.y1);
  if (!vis.length) return;
  const P = vis[(Math.random() * vis.length) | 0], i = (Math.random() * (P.p.length / 2)) | 0;
  const x = P.p[i * 2] + P.n[i * 2] * rand(0, 6), y = P.p[i * 2 + 1] + P.n[i * 2 + 1] * rand(0, 6);
  this.P.push({ k: 'spray', x, y, age: 0, life: rand(0.5, 0.95), vx: rand(-14, 14) + P.n[i * 2] * 10, vy: rand(-34, -20), r: rand(1.2, 2.6) });
  this.n.spray = (this.n.spray || 0) + 1;
};

Atmos.draw = function (c, dt) {
  if (!this.ready) this.init();
  const t = S.time, v = viewRect(30);
  for (let i = 0; i < 3 && this.P.length < ATM_CAP; i++) this.spawn(v);
  if (this.P.length < ATM_CAP) this.spray(v);
  const wind = Math.sin(t * 0.41) * 0.5 + 0.5;
  const snow = new Path2D(), spray = new Path2D(), motes = [], flies = [];
  for (let i = this.P.length - 1; i >= 0; i--) {
    const p = this.P[i];
    p.age += dt;
    if (p.age > p.life || p.x < v.x0 - 120 || p.x > v.x1 + 120 || p.y < v.y0 - 120 || p.y > v.y1 + 120) { this.P.splice(i, 1); this.n[p.k]--; continue; }
    const k = p.age / p.life, fade = Math.min(1, p.age * 2, (p.life - p.age) * 2);
    switch (p.k) {
      case 'leaf': case 'petal': {
        p.x += (p.vx * (0.6 + wind * 0.8) + Math.sin(t * 2 + p.ph) * 14) * dt; p.y += (p.vy + Math.sin(t * 3.1 + p.ph) * 8) * dt;
        const a = p.ph + t * p.spin, fl = Math.cos(t * 3.4 + p.ph);
        c.save(); c.globalAlpha = fade * 0.95; c.translate(p.x, p.y); c.rotate(a); c.scale(p.s * fl, p.s);
        c.drawImage(p.img, -p.img.width / 4, -p.img.height / 4, p.img.width / 2, p.img.height / 2); c.restore();
        break;
      }
      case 'snow': {
        p.x += (p.vx * (0.5 + wind) + Math.sin(t * 1.6 + p.ph) * 10) * dt; p.y += p.vy * dt;
        snow.moveTo(p.x + p.r, p.y); snow.arc(p.x, p.y, p.r * (fade < 1 ? 0.4 + fade * 0.6 : 1), 0, TAU);
        break;
      }
      case 'sand': {
        p.x += p.vx * (0.6 + wind * 0.6) * dt; p.y += (p.vy + Math.sin(t * 4 + p.ph) * 10) * dt;
        c.globalAlpha = Math.sin(k * Math.PI) * 0.4; c.fillStyle = '#fff3d2';
        c.beginPath(); taperTo(c, [[p.x - p.len, p.y + 2], [p.x - p.len * 0.5, p.y - 1.5], [p.x, p.y], [p.x + p.len * 0.3, p.y - 1]], 1.8); c.fill();
        c.globalAlpha = 1;
        break;
      }
      case 'fly': {
        p.dir += Math.sin(t * 1.3 + p.ph) * 1.6 * dt; p.x += Math.cos(p.dir) * p.sp * dt; p.y += Math.sin(p.dir) * p.sp * 0.7 * dt - Math.sin(t * 2 + p.ph) * 4 * dt;
        flies.push([p.x, p.y, fade * Math.pow(Math.max(0, Math.sin(t * 1.9 + p.ph)), 2)]);
        break;
      }
      case 'mist': {
        p.x += p.vx * dt;
        c.globalAlpha = Math.sin(k * Math.PI) * 0.16; c.drawImage(Ground.mist, p.x - p.s, p.y - p.s * 0.35, p.s * 2, p.s * 0.7); c.globalAlpha = 1;
        break;
      }
      case 'spray': {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 50 * dt;
        spray.moveTo(p.x + p.r, p.y); spray.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, TAU);
        break;
      }
      case 'mote': {
        p.x += (p.vx + Math.sin(t * 0.9 + p.ph) * 6) * dt; p.y += p.vy * dt;
        motes.push([p.x, p.y, fade * (0.5 + 0.5 * Math.sin(t * 2.4 + p.ph)), p.r]);
        break;
      }
    }
  }
  c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill(snow);
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(spray);
  for (const [x, y, a] of flies) if (a > 0.02) { drawGlow(c, x, y, 12, '#d8ff7a', a * 0.75); c.globalAlpha = a; c.fillStyle = '#f6ffd0'; circ(c, x, y, 1.6); c.fill(); c.globalAlpha = 1; }
  for (const [x, y, a, r] of motes) if (a > 0.02) { drawGlow(c, x, y, 7, '#fff0b0', a * 0.5); c.globalAlpha = a * 0.8; c.fillStyle = '#fffbe6'; circ(c, x, y, r); c.fill(); c.globalAlpha = 1; }
  this.drawHigh(c, dt);
  this.screen(c, dt);
};

// a few high clouds drifting over the land, with a little parallax; they fade away near the middle of the screen
Atmos.drawHigh = function (c, dt) {
  const z = Cam.z, hw = SW / 2 / z, hh = SH / 2 / z;
  for (const k of this.highs) {
    k.x += k.v * dt; if (k.x > WW + 600) k.x = -600;
    const w = 360 * k.s, h = 180 * k.s;
    const x = k.x - (Cam.x - WW / 2) * 0.3, y = k.y - (Cam.y - WH / 2) * 0.3;
    if (x + w < Cam.x - hw || x > Cam.x + hw || y + h < Cam.y - hh || y > Cam.y + hh) continue;
    const dx = (x + w / 2 - Cam.x) / hw, dy = (y + h / 2 - Cam.y) / hh, d = Math.sqrt(dx * dx + dy * dy);
    const a = clamp((d - 0.45) / 0.5, 0, 1) * 0.6;
    if (a < 0.02) continue;
    c.globalAlpha = a; c.drawImage(this.cloud, x, y, w, h); c.globalAlpha = 1;
  }
};

// screen space: a soft vignette and a gentle per-biome tint, baked into a tiny canvas and stretched
Atmos.screen = function (c, dt) {
  const b = World.biomeAt(Cam.x, Cam.y), G0 = ATM_GRADE[b] || ATM_GRADE.meadow, T = this.tint, k = Math.min(1, dt * 1.5);
  for (let i = 0; i < 4; i++) T[i] += (G0[i] - T[i]) * k;
  const key = T.map((q, i) => (i < 3 ? Math.round(q / 6) : Math.round(q * 200))).join(',');
  if (key !== this.overKey) {
    // one corner of the vignette, tinted by the biome (the middle of the screen is left untouched)
    this.overKey = key;
    const o = this.overCv, g = o.getContext('2d'), W = o.width;
    g.clearRect(0, 0, W, W);
    // the piece covers the lower-right 40% x 45% of the screen; alpha follows the normalised distance from the
    // screen centre and is zero along the piece's inner edges, so the four mirrored pieces join without seams
    const [r, gg, bb, a] = T.map((q, i) => (i < 3 ? Math.round(q) : q));
    const img = g.createImageData(W, W), d = img.data, u0 = 1 - 2 * 0.4, v0 = 1 - 2 * 0.45, r0 = 1.03, r1 = 1.42;
    const dr = Math.round(r * 0.3 + 40), dg = Math.round(gg * 0.2 + 18), db = Math.round(bb * 0.3 + 50);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const u = u0 + (1 - u0) * (i + 0.5) / W, v = v0 + (1 - v0) * (j + 0.5) / W, rn = Math.sqrt(u * u + v * v);
      const k = ease(clamp((rn - r0) / (r1 - r0), 0, 1)), o = (j * W + i) * 4;
      d[o] = lerp(r, dr, k); d[o + 1] = lerp(gg, dg, k); d[o + 2] = lerp(bb, db, k); d[o + 3] = 255 * k * (a * 2 + 0.2);
    }
    g.putImageData(img, 0, 0);
    // and a warm sunlit corner for the upper left
    if (!this.sunCv) {
      this.sunCv = mkCanvas(64, 64);
      const sg = this.sunCv.getContext('2d'), sun = sg.createRadialGradient(0, 0, 0, 0, 0, 64);
      sun.addColorStop(0, 'rgba(255,244,206,0.22)'); sun.addColorStop(0.55, 'rgba(255,244,206,0.08)'); sun.addColorStop(1, 'rgba(255,244,206,0)');
      sg.fillStyle = sun; sg.fillRect(0, 0, 64, 64);
    }
  }
  const cw = SW * 0.4, ch = SH * 0.45, o = this.overCv;
  c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.drawImage(this.sunCv, 0, 0, SW * 0.45, SH * 0.6);
  c.drawImage(o, SW - cw, SH - ch, cw, ch);
  c.setTransform(-DPR, 0, 0, DPR, SW * DPR, 0); c.drawImage(o, SW - cw, SH - ch, cw, ch);
  c.setTransform(DPR, 0, 0, -DPR, 0, SH * DPR); c.drawImage(o, SW - cw, SH - ch, cw, ch);
  c.restore();
};
