// Ink and paint helpers shared by all the art (see ART.md).
const VIOLET = [58, 44, 110], WARM = [255, 244, 200];
// shadow tone: darker and a little toward violet
function shadeTone(h, k) {
  k = k == null ? 0.24 : k;
  const [r, g, b] = hexRgb(h);
  return rgbHex(r * (1 - k) + VIOLET[0] * k * 0.35, g * (1 - k) + VIOLET[1] * k * 0.35, b * (1 - k) + VIOLET[2] * k * 0.5);
}
// highlight tone: lighter and a little warm
function lightTone(h, k) {
  k = k == null ? 0.2 : k;
  const [r, g, b] = hexRgb(h);
  return rgbHex(r + (WARM[0] - r) * k, g + (WARM[1] - g) * k, b + (WARM[2] - b) * k * 0.85);
}
const _tones = {};
function tones(h) { return _tones[h] || (_tones[h] = { base: h, sh: shadeTone(h), sh2: shadeTone(h, 0.4), hi: lightTone(h), hi2: lightTone(h, 0.38) }); }

// soft round shadow on the ground
function softShadow(c, x, y, rx, ry, a) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx);
  g.addColorStop(0, `rgba(52,28,74,${a == null ? 0.28 : a})`); g.addColorStop(0.65, `rgba(52,28,74,${(a == null ? 0.28 : a) * 0.6})`); g.addColorStop(1, 'rgba(52,28,74,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
// additive glow
function glow(c, x, y, r, col, a) {
  const [R, G, B] = hexRgb(col);
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${R},${G},${B},${a == null ? 0.6 : a})`); g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalCompositeOperation = op;
}
// a brush stroke that tapers at both ends; pts = [[x,y],...], w = widest width
function taperLine(c, pts, w, col, startW, endW) {
  if (pts.length < 2) return;
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const t = i / (n - 1), prof = Math.sin(Math.PI * (startW == null ? t : (t * 0.5 + 0.5 * (startW ? 0.5 : 0))));
    const ww = (w / 2) * Math.max(0.12, startW != null || endW != null ? lerp(startW == null ? 1 : startW, endW == null ? 1 : endW, t) : prof);
    L.push([p[0] - dy * ww, p[1] + dx * ww]); R.push([p[0] + dy * ww, p[1] - dx * ww]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath(); c.fillStyle = col || OUT; c.fill();
}
// points along a quadratic curve (for taperLine)
function qpts(x0, y0, cx, cy, x1, y1, n) {
  const out = []; n = n || 8;
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
  return out;
}
// paint a cel shadow band inside the current path: call with the shape's path set, then the band offset
function celShade(c, pathFn, col, dx, dy, a) {
  c.save(); pathFn(); c.clip();
  c.globalAlpha = a == null ? 1 : a;
  c.translate(dx, dy); c.fillStyle = col; pathFn(); c.fill('evenodd');
  c.restore();
}
// fill a path, then darken its lower-right and lighten its upper-left (cheap cel look for props)
function paintShape(c, pathFn, base, opts) {
  opts = opts || {};
  const T = tones(base);
  pathFn(); c.fillStyle = base; c.fill();
  c.save(); pathFn(); c.clip();
  // shadow band: the same shape pushed up-left leaves a crescent on the lower right
  c.fillStyle = T.sh; c.beginPath(); c.rect(-2000, -2000, 4000, 4000); c.save(); c.translate(opts.sx == null ? -opts.s || -4 : opts.sx, opts.sy == null ? -(opts.s || 4) * 1.2 : opts.sy); pathFn(); c.restore(); c.fill('evenodd');
  if (opts.hi !== false) { c.fillStyle = T.hi; c.globalAlpha = 0.85; c.beginPath(); c.rect(-2000, -2000, 4000, 4000); c.save(); c.translate((opts.s || 4) * 0.7, (opts.s || 4) * 0.8); pathFn(); c.restore(); c.fill('evenodd'); }
  c.restore();
}
// outline a path like ink: heavier on the lower right
function inkPath(c, pathFn, w) {
  w = w || OUTW;
  c.save(); c.strokeStyle = OUT; c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = w; pathFn(); c.stroke();
  c.translate(0.7, 0.9); c.lineWidth = w * 0.9; pathFn(); c.stroke();
  c.restore();
}
