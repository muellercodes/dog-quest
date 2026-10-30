// Towns: buildings, their art, and where everything stands.
const WALLS = ['#f6e7c8', '#cfe6f2', '#f6d2d8', '#d8efcf', '#efe0f7'];
const ROOFS = ['#d9534f', '#4f7fd9', '#a8693f', '#4fa86a', '#8a5fc9'];
// w, h, ox, oy: the baked sprite's box; foot: the collision footprint (gameplay, keep as is)
const BLD = {
  house: { w: 160, h: 160, ox: 80, oy: 140, foot: [108, 52] },
  inn: { w: 220, h: 190, ox: 110, oy: 166, foot: [160, 60] },
  smith: { w: 200, h: 180, ox: 100, oy: 156, foot: [126, 54] },
  trainer: { w: 190, h: 210, ox: 95, oy: 190, foot: [126, 54] },
  castle: { w: 500, h: 462, ox: 250, oy: 422, foot: [420, 150] },
  board: { w: 96, h: 100, ox: 48, oy: 88, foot: [56, 12] },
  well: { w: 80, h: 96, ox: 40, oy: 82, foot: [40, 18] },
  stall: { w: 124, h: 116, ox: 62, oy: 100, foot: [86, 26] },
  tent: { w: 130, h: 110, ox: 65, oy: 92, foot: [84, 30] },
  hut: { w: 160, h: 170, ox: 80, oy: 150, foot: [100, 50] },
  fountain: { w: 160, h: 150, ox: 80, oy: 106, foot: [100, 34] },
  sign: { w: 76, h: 80, ox: 38, oy: 68, foot: [10, 8] },
  campfire: { w: 76, h: 56, ox: 38, oy: 38, foot: [30, 14] },
  boat: { w: 190, h: 180, ox: 95, oy: 124, foot: [0, 0] },
  oak: { w: 340, h: 372, ox: 170, oy: 338, foot: [120, 60] },
  grotto: { w: 240, h: 230, ox: 120, oy: 200, foot: [150, 50] },
  icecave: { w: 240, h: 200, ox: 120, oy: 172, foot: [150, 50] },
  purramid: { w: 340, h: 290, ox: 170, oy: 262, foot: [250, 90] },
  keep: { w: 400, h: 412, ox: 200, oy: 378, foot: [300, 120] },
  burrow: { w: 150, h: 110, ox: 75, oy: 90, foot: [90, 26] },
  kennel: { w: 200, h: 190, ox: 100, oy: 170, foot: [130, 54] },
};

// ---------- the paint kit (ART.md): one plum outline per silhouette, cel bands, light from the upper left
let _bR = mulberry32(7);
const bR = (a, b) => a + _bR() * (b - a);
const bSeed = (s) => { _bR = mulberry32(s | 0); };
const IRON = '#5d5873', GOLD = '#ffd04d', GLASS1 = '#fff6c4', GLASS2 = '#f4ae45';

// the ink pass: every part of the silhouette stroked thick in plum under the paint, then again nudged lower right
function inkSil(g, fns, w) {
  w = (w || OUTW) * 2;
  g.save(); g.strokeStyle = OUT; g.fillStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    if (k) g.translate(0.8, 1);
    g.lineWidth = k ? w * 0.85 : w;
    for (const f of fns) { g.beginPath(); f(); g.stroke(); g.fill(); }
  }
  g.restore();
}
function fillP(g, f, col) { g.beginPath(); f(); g.fillStyle = col; g.fill(); }
function clipP(g, f, fn) { g.save(); g.beginPath(); f(); g.clip(); fn(); g.restore(); }
function thinP(g, f, col, w) { g.beginPath(); f(); g.strokeStyle = col || OUT; g.lineWidth = w || OUTW * 0.6; g.stroke(); }
// paint a cel band: inside shape f, the part not covered by f shifted by (dx, dy)
function celBand(g, f, col, dx, dy, a) {
  g.save(); g.beginPath(); f(); g.clip();
  g.globalAlpha = a == null ? 1 : a; g.fillStyle = col;
  g.beginPath(); g.rect(-3000, -3000, 6000, 6000); g.translate(dx, dy); f(); g.fill('evenodd');
  g.restore();
}
// fill a small part, ink it, shade it (props and trims)
function part(g, f, col, o) {
  o = o || {};
  inkSil(g, [f], o.w || 0.75);
  fillP(g, f, col);
  const T = tones(col);
  if (o.sh !== false) celBand(g, f, T.sh, -(o.s || 3), -(o.s || 3) * 1.1, 0.9);
  if (o.hi !== false) celBand(g, f, T.hi, (o.s || 3) * 0.8, (o.s || 3) * 0.9, 0.7);
}
// where a building meets the ground: a soft violet shadow falling lower right and tight AO under the base
function bGround(g, rx, ry, x0) {
  x0 = x0 || 0;
  softShadow(g, x0 + rx * 0.1, ry * 0.25, rx * 1.05, ry, 0.3);
  softShadow(g, x0 + 2, 0, rx * 0.85, ry * 0.4, 0.32);
}
function aoFoot(g, x, yb, w, h, a) { const gr = g.createLinearGradient(0, yb, 0, yb - h); gr.addColorStop(0, `rgba(52,28,74,${a || 0.4})`); gr.addColorStop(1, 'rgba(52,28,74,0)'); g.fillStyle = gr; g.fillRect(x, yb - h, w, h); }
// the shadow a roof's eave throws on the wall below it (a cel band with a scalloped edge)
function eaveShade(g, x, y, w, h) {
  g.fillStyle = 'rgba(70,38,104,0.3)';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h + 3);
  for (let xx = x + w; xx > x; xx -= 9) g.quadraticCurveTo(xx - 4.5, y + h + 6 + ((xx - x) / w) * 2, xx - 9, y + h + 1 + ((xx - x) / w) * 3);
  g.closePath(); g.fill();
}

// wall materials (call with the wall's rect clipped)
function stonesIn(g, x, y, w, h, col, sz) {
  g.fillStyle = shadeTone(col, 0.27); g.fillRect(x, y, w, h);
  let row = 0;
  for (let yy = y + h - sz; yy > y - sz; yy -= sz, row++) {
    let xx = x - bR(0, sz) - (row & 1) * sz * 0.7;
    while (xx < x + w) {
      const sw = sz * bR(1.3, 2.2), c0 = mix(col, _bR() < 0.55 ? '#fff6dc' : '#7a6a9a', bR(0, 0.14));
      g.fillStyle = shadeTone(c0, 0.15); g.beginPath(); rrect(g, xx + 0.8, yy + 0.8, sw - 1.6, sz - 1.6, sz * 0.3); g.fill();
      g.fillStyle = c0; g.beginPath(); rrect(g, xx + 0.8, yy + 0.8, sw - 2.8, sz - 3, sz * 0.3); g.fill();
      g.fillStyle = lightTone(c0, 0.4); g.beginPath(); rrect(g, xx + 2.2, yy + 1.6, (sw - 4) * 0.55, Math.max(1, sz * 0.13), 0.7); g.fill();
      xx += sw;
    }
  }
}
function planksIn(g, x, y, w, h, col, sz) {
  for (let yy = y + h - sz, i = 0; yy > y - sz; yy -= sz, i++) {
    const c0 = mix(col, i & 1 ? '#fff0d0' : '#5a3a6a', bR(0.02, 0.1));
    g.fillStyle = c0; g.fillRect(x, yy, w, sz);
    g.fillStyle = shadeTone(c0, 0.38); g.fillRect(x, yy + sz - 1.7, w, 1.7);
    g.fillStyle = lightTone(c0, 0.32); g.fillRect(x, yy, w, 1);
    let xx = x + bR(8, 40);
    while (xx < x + w) { g.fillStyle = shadeTone(c0, 0.34); g.fillRect(xx, yy, 1.2, sz - 1.6); xx += bR(28, 54); }
    if (_bR() < 0.35) { g.fillStyle = shadeTone(c0, 0.3); ell(g, x + bR(6, w - 6), yy + sz * 0.45, 2, 1.1); g.fill(); }
  }
}
function vplanksIn(g, x, y, w, h, col, sz) {
  for (let xx = x, i = 0; xx < x + w; xx += sz, i++) {
    const c0 = mix(col, i % 3 === 0 ? '#fff0d0' : '#5a3a6a', bR(0.02, 0.11));
    g.fillStyle = c0; g.fillRect(xx, y, sz, h);
    g.fillStyle = shadeTone(c0, 0.4); g.fillRect(xx + sz - 1.4, y, 1.4, h);
    g.fillStyle = lightTone(c0, 0.28); g.fillRect(xx + 0.5, y, 1.1, h);
    g.strokeStyle = shadeTone(c0, 0.2); g.lineWidth = 0.8;
    const gx = xx + bR(2.5, sz - 3); g.beginPath(); g.moveTo(gx, y + bR(0, h * 0.3)); g.quadraticCurveTo(gx + 1.5, y + h * 0.5, gx - 0.5, y + h * bR(0.6, 1)); g.stroke();
    g.fillStyle = shadeTone(c0, 0.55); circ(g, xx + sz / 2, y + 3.5, 0.8); g.fill(); circ(g, xx + sz / 2, y + h - 4, 0.8); g.fill();
  }
}
// timber frame beams: [x0, y0, x1, y1, width]
function beamsIn(g, col, beams) {
  const T = tones(col);
  g.save(); g.lineCap = 'butt';
  for (const [x0, y0, x1, y1, bw] of beams) {
    g.strokeStyle = col; g.lineWidth = bw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const s = nx + ny > 0 ? -1 : 1;     // the side facing the upper left gets the light
    g.strokeStyle = T.hi; g.lineWidth = bw * 0.25; g.beginPath(); g.moveTo(x0 + nx * s * bw * 0.32, y0 + ny * s * bw * 0.32); g.lineTo(x1 + nx * s * bw * 0.32, y1 + ny * s * bw * 0.32); g.stroke();
    g.strokeStyle = T.sh2; g.lineWidth = bw * 0.28; g.beginPath(); g.moveTo(x0 - nx * s * bw * 0.36, y0 - ny * s * bw * 0.36); g.lineTo(x1 - nx * s * bw * 0.36, y1 - ny * s * bw * 0.36); g.stroke();
  }
  g.restore();
}
// a wall face: material, the eave's shadow on top, a cel band down the right and AO at the foot
function bWall(g, x, y, w, h, col, mat, o) {
  o = o || {};
  const T = tones(col);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = col; g.fillRect(x, y, w, h);
  if (mat === 'stone') stonesIn(g, x, y, w, h, col, o.sz || 10);
  else if (mat === 'planks') planksIn(g, x, y, w, h, col, o.sz || 8);
  else if (mat === 'vplanks') vplanksIn(g, x, y, w, h, col, o.sz || 10);
  else {
    g.globalAlpha = 0.18;
    for (let i = 0; i < (w * h) / 220; i++) { g.fillStyle = _bR() < 0.5 ? T.hi2 : T.sh; ell(g, x + bR(0, w), y + bR(0, h), bR(3, 8), bR(1.5, 3.5)); g.fill(); }
    g.globalAlpha = 1;
    if (o.chips !== false) for (let i = 0; i < 2; i++) {
      const cx = x + bR(6, w - 18), cy = y + bR(h * 0.35, h * 0.7);
      g.fillStyle = shadeTone(col, 0.18); g.beginPath(); g.ellipse(cx + 5, cy + 3, 7, 4.5, 0.1, 0, TAU); g.fill();
      g.fillStyle = '#d99a7a'; g.beginPath(); rrect(g, cx, cy, 6, 3, 1); g.fill(); g.beginPath(); rrect(g, cx + 4, cy + 3.6, 6, 3, 1); g.fill();
    }
  }
  if (o.beams) beamsIn(g, o.beamCol || '#8a5a3c', o.beams);
  g.fillStyle = T.sh2; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(x + w - 9, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w - 5, y + h); g.closePath(); g.fill(); g.globalAlpha = 1;
  if (o.eave !== false) eaveShade(g, x, y, w, o.eaveH || 8);
  aoFoot(g, x, y + h, w, o.ao || 14);
  g.restore();
}

// a hipped roof seen from the front and a little above: shingle rows, a lit hip on the left,
// a shaded hip on the right, a ridge that catches the light and a fascia that shows its thickness
function hipRoof(g, cx, ey, ew, ry, rw, col, o) {
  o = o || {};
  const h = ey - ry, sag = o.sag == null ? 4 : o.sag, fas = o.fascia == null ? 4.5 : o.fascia, inset = o.inset == null ? 7 : o.inset;
  const BL = [cx - ew, ey - sag * 0.5], BR = [cx + ew, ey - sag * 0.5], TL = [cx - rw, ry], TR = [cx + rw, ry];
  const LB = [cx - ew + inset, ey - h * 0.45], RB = [cx + ew - inset, ey - h * 0.45];
  const T = tones(col);
  const sil = () => { g.moveTo(BL[0], BL[1]); g.lineTo(LB[0], LB[1]); g.lineTo(TL[0], TL[1]); g.lineTo(TR[0], TR[1]); g.lineTo(RB[0], RB[1]); g.lineTo(BR[0], BR[1]); g.lineTo(BR[0], BR[1] + fas); g.quadraticCurveTo(cx, ey + sag + fas, BL[0], BL[1] + fas); g.closePath(); };
  const ridge = () => { rrect(g, TL[0] - 4, ry - 5, TR[0] - TL[0] + 8, 7.5, 3.5); };
  const front = () => { g.moveTo(BL[0], BL[1]); g.lineTo(TL[0], TL[1]); g.lineTo(TR[0], TR[1]); g.lineTo(BR[0], BR[1]); g.quadraticCurveTo(cx, ey + sag, BL[0], BL[1]); g.closePath(); };
  const hipL = () => { g.moveTo(BL[0], BL[1]); g.lineTo(LB[0], LB[1]); g.lineTo(TL[0], TL[1]); g.closePath(); };
  const hipR = () => { g.moveTo(BR[0], BR[1]); g.lineTo(RB[0], RB[1]); g.lineTo(TR[0], TR[1]); g.closePath(); };
  return {
    sils: [sil, ridge],
    paint() {
      fillP(g, sil, T.sh2);
      // the fascia: a lighter lip along its top edge
      g.strokeStyle = shadeTone(col, 0.15); g.lineWidth = 1.4; g.beginPath(); g.moveTo(BL[0] + 1, BL[1] + 1.6); g.quadraticCurveTo(cx, ey + sag + 1.6, BR[0] - 1, BR[1] + 1.6); g.stroke();
      // hips
      for (const [f, c0, k] of [[hipL, T.hi, 1], [hipR, T.sh, -1]]) {
        fillP(g, f, c0);
        clipP(g, f, () => { g.strokeStyle = k > 0 ? shadeTone(T.hi, 0.12) : shadeTone(T.sh, 0.2); g.lineWidth = 1.1; const A = k > 0 ? BL : BR, B = k > 0 ? LB : RB, Ct = k > 0 ? TL : TR; for (let s = 0.14; s < 1; s += 0.16) { g.beginPath(); g.moveTo(lerp(A[0], Ct[0], s), lerp(A[1], Ct[1], s)); g.lineTo(lerp(B[0], Ct[0], s), lerp(B[1], Ct[1], s)); g.stroke(); } });
      }
      // the front plane, shingle rows from the eave up so each row overlaps the one below
      clipP(g, front, () => {
        g.fillStyle = col; g.fillRect(cx - ew - 4, ry - 4, ew * 2 + 8, h + sag + 8);
        const rows = Math.max(3, Math.round(h / (o.rowH || 10.5))), rh = h / rows, tw = o.tile || 13;
        for (let k = 0; k < rows; k++) {
          const yb = ey - k * rh, sagK = sag * (1 - k / rows), half = lerp(ew, rw, k / rows) + tw, off = (k & 1) * tw * 0.5;
          for (let pass = 0; pass < 2; pass++) for (let x = cx - half - off; x < cx + half; x += tw) {
            const t = (x + tw / 2 - cx) / ew, yy = yb + sagK * (1 - t * t) + (pass ? 0 : 2.2);
            const c0 = pass ? mix(col, (k + Math.round(x / tw)) % 3 ? '#fff4d8' : '#4a3070', bR(0, 0.1)) : T.sh2;
            g.fillStyle = c0; g.beginPath();
            if (o.style === 'slate') { g.moveTo(x + 0.6, yy - rh - 3); g.lineTo(x + 0.6, yy - 1.5); g.quadraticCurveTo(x + 0.6, yy, x + 2, yy); g.lineTo(x + tw - 2, yy); g.quadraticCurveTo(x + tw - 0.6, yy, x + tw - 0.6, yy - 1.5); g.lineTo(x + tw - 0.6, yy - rh - 3); }
            else { g.moveTo(x, yy - rh - 3); g.lineTo(x, yy - 4); g.quadraticCurveTo(x, yy, x + tw / 2, yy); g.quadraticCurveTo(x + tw, yy, x + tw, yy - 4); g.lineTo(x + tw, yy - rh - 3); }
            g.closePath(); g.fill();
            if (pass && _bR() < 0.5) { g.fillStyle = lightTone(c0, 0.3); g.beginPath(); rrect(g, x + 2, yy - rh * 0.7, tw * 0.35, 1.3, 0.6); g.fill(); }
          }
        }
        // cel bands: the upper rows catch the sun, the right side turns away from it
        g.fillStyle = T.hi; g.globalAlpha = 0.28; g.beginPath(); g.moveTo(TL[0] - 10, ry - 2); g.lineTo(TR[0] + 4, ry - 2); g.lineTo(lerp(TR[0], BR[0], 0.3) - 14, lerp(ry, ey, 0.3)); g.lineTo(lerp(TL[0], BL[0], 0.3), lerp(ry, ey, 0.3)); g.closePath(); g.fill();
        g.fillStyle = T.sh2; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(TR[0] - rw * 0.25, ry); g.lineTo(TR[0] + 2, ry); g.lineTo(BR[0] + 2, ey + sag); g.lineTo(BR[0] - ew * 0.38, ey + sag); g.closePath(); g.fill();
        g.globalAlpha = 1;
      });
      // the hip creases as thin tapering ink
      taperLine(g, [[BL[0] + 1, BL[1]], [lerp(BL[0], TL[0], 0.5), lerp(BL[1], TL[1], 0.5)], [TL[0], TL[1] + 1]], 1.4, shadeTone(col, 0.5));
      taperLine(g, [[BR[0] - 1, BR[1]], [lerp(BR[0], TR[0], 0.5), lerp(BR[1], TR[1], 0.5)], [TR[0], TR[1] + 1]], 1.6, OUT);
      // the ridge cap catches the light
      fillP(g, ridge, shadeTone(col, 0.3));
      g.fillStyle = lightTone(col, 0.25); g.beginPath(); rrect(g, TL[0] - 2.5, ry - 4, TR[0] - TL[0] + 5, 3, 1.5); g.fill();
      g.fillStyle = lightTone(col, 0.55); g.beginPath(); rrect(g, TL[0], ry - 3.6, (TR[0] - TL[0]) * 0.45, 1.2, 0.6); g.fill();
      if (o.snow) this.snow();
    },
    snow() {
      const yS = lerp(ry, ey, 0.5);
      const cap = () => {
        g.moveTo(TL[0] - 5, ry - 6); g.lineTo(TR[0] + 5, ry - 6); g.lineTo(lerp(TR[0], BR[0], 0.52) + 2, yS);
        const n = 7, x0 = lerp(TR[0], BR[0], 0.52), x1 = lerp(TL[0], BL[0], 0.52);
        for (let i = 1; i <= n; i++) { const xx = lerp(x0, x1, i / n), xm = lerp(x0, x1, (i - 0.5) / n); g.quadraticCurveTo(xm, yS + (i % 2 ? 9 : 4), xx, yS + (i % 3 === 0 ? 0 : 2)); }
        g.lineTo(TL[0] - 5, ry - 6); g.closePath();
      };
      clipP(g, sil, () => { g.save(); g.translate(1.5, 2.5); fillP(g, cap, '#b9cdea'); g.restore(); fillP(g, cap, '#ffffff'); g.fillStyle = '#e4eefb'; g.globalAlpha = 0.9; g.beginPath(); g.rect(lerp(TR[0], BR[0], 0.2) - 12, ry, 60, h); g.globalAlpha = 1; });
      fillP(g, () => rrect(g, TL[0] - 6, ry - 8, TR[0] - TL[0] + 12, 8, 4), '#ffffff');
      // icicles under the eave
      for (let x = BL[0] + 8; x < BR[0] - 6; x += bR(8, 14)) { const t = (x - cx) / ew, y0 = ey + sag * (1 - t * t) + fas - 1, l = bR(4, 9); g.fillStyle = '#d5ecfb'; g.beginPath(); g.moveTo(x - 2, y0); g.lineTo(x, y0 + l); g.lineTo(x + 2, y0); g.closePath(); g.fill(); g.strokeStyle = '#8fb6dc'; g.lineWidth = 0.7; g.stroke(); }
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(BL[0] + 2, BL[1] - 0.5); g.quadraticCurveTo(cx, ey + sag - 0.5, BR[0] - 2, BR[1] - 0.5); g.stroke();
    },
  };
}
// a stone chimney standing on a roof
function bChimney(g, x, yTop, w, yBot, col) {
  col = col || '#c98a6a';
  const body = () => g.rect(x - w / 2, yTop, w, yBot - yTop), cap = () => rrect(g, x - w / 2 - 3, yTop - 5, w + 6, 6.5, 2);
  return {
    sils: [body, cap],
    paint(snow) {
      softShadow(g, x + w * 0.4, yBot - 1, w * 0.9, 3.5, 0.35);
      inkSil(g, [body, cap], OUTW * 0.8);
      clipP(g, body, () => { stonesIn(g, x - w / 2, yTop, w, yBot - yTop, col, 5.5); g.fillStyle = shadeTone(col, 0.35); g.globalAlpha = 0.45; g.fillRect(x + w * 0.18, yTop, w, yBot - yTop); g.globalAlpha = 1; aoFoot(g, x - w / 2, yBot, w, 6); });
      fillP(g, cap, shadeTone(col, 0.12)); g.fillStyle = lightTone(col, 0.4); g.fillRect(x - w / 2 - 1.5, yTop - 4.2, w + 3, 1.3);
      g.fillStyle = '#2f1d33'; ell(g, x, yTop - 2.4, w / 2 - 0.5, 1.4); g.fill();
      if (snow) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - 1, yTop - 5, w / 2 + 3, 3, 0, Math.PI, 0); g.fill(); }
    },
  };
}
// an arched doghouse door with a frame, planks, iron straps and a step
function bDoor(g, x, y0, w, h, col, o) {
  o = o || {};
  const arch = (p) => { g.beginPath(); g.moveTo(x - w / 2 - p, y0); g.lineTo(x - w / 2 - p, y0 - h + w / 2); g.arc(x, y0 - h + w / 2, w / 2 + p, Math.PI, 0); g.lineTo(x + w / 2 + p, y0); g.closePath(); };
  const fr = o.frame || '#e6d8c2', st = o.step || '#c9bfb6';
  g.fillStyle = OUT; g.beginPath(); rrect(g, x - w / 2 - 9, y0 - 3, w + 18, 7.4, 3); g.fill();
  g.fillStyle = st; g.beginPath(); rrect(g, x - w / 2 - 7.8, y0 - 2, w + 15.6, 5, 2); g.fill();
  g.fillStyle = lightTone(st, 0.45); g.fillRect(x - w / 2 - 6, y0 - 1.6, w + 9, 1.1);
  arch(6.2); g.fillStyle = OUT; g.fill();
  arch(4.8); g.fillStyle = fr; g.fill();
  g.save(); arch(4.8); g.clip();
  if (o.stone !== false) { g.strokeStyle = shadeTone(fr, 0.32); g.lineWidth = 1; const cy = y0 - h + w / 2; for (let a = Math.PI + 0.35; a < TAU - 0.2; a += 0.45) { g.beginPath(); g.moveTo(x + Math.cos(a) * w / 2, cy + Math.sin(a) * w / 2); g.lineTo(x + Math.cos(a) * (w / 2 + 5), cy + Math.sin(a) * (w / 2 + 5)); g.stroke(); } for (let yy = cy + 7; yy < y0; yy += 8) { g.beginPath(); g.moveTo(x - w / 2 - 5, yy); g.lineTo(x - w / 2, yy); g.moveTo(x + w / 2, yy - 4); g.lineTo(x + w / 2 + 5, yy - 4); g.stroke(); } }
  g.fillStyle = shadeTone(fr, 0.3); g.globalAlpha = 0.6; g.fillRect(x + w * 0.2, y0 - h - 6, w, h + 6); g.globalAlpha = 1;
  g.fillStyle = lightTone(fr, 0.4); g.globalAlpha = 0.8; g.fillRect(x - w / 2 - 4.4, y0 - h + w / 2, 1.4, h - w / 2); g.globalAlpha = 1;
  g.restore();
  arch(1.1); g.fillStyle = OUT; g.fill();
  arch(0); g.fillStyle = col; g.fill();
  g.save(); arch(0); g.clip();
  const T = tones(col);
  for (let xx = x - w / 2 + w / 4; xx < x + w / 2 - 1; xx += w / 4) { g.fillStyle = T.sh2; g.fillRect(xx - 0.6, y0 - h, 1.3, h); g.fillStyle = T.hi; g.fillRect(xx + 0.8, y0 - h, 0.8, h); }
  if (o.double) { g.fillStyle = OUT; g.fillRect(x - 0.9, y0 - h, 1.8, h); }
  // recess: the frame shades the top and left of the door
  g.fillStyle = 'rgba(40,18,60,0.38)'; g.beginPath(); g.rect(x - w, y0 - h - w, w * 2, h + w * 2); g.translate(2.6, 3.2); arch(0); g.fill('evenodd');
  g.restore();
  // iron straps and a knob
  for (const yy of [y0 - h * 0.28, y0 - h * 0.66]) {
    for (const s of o.double ? [-1, 1] : [-1]) { const xa = x + s * (w / 2 - 1), xb = x + s * w * 0.05; g.fillStyle = IRON; g.fillRect(Math.min(xa, xb), yy - 1.5, Math.abs(xb - xa), 3); g.fillStyle = '#8f8aa8'; g.fillRect(Math.min(xa, xb), yy - 1.5, Math.abs(xb - xa), 0.9); g.fillStyle = '#2e2a3e'; circ(g, xb - s * 1.6, yy, 0.8); g.fill(); }
  }
  for (const s of o.double ? [-1, 1] : [1]) { const kx = x + s * (o.double ? 3.6 : w * 0.28), ky = y0 - h * 0.42; circ(g, kx, ky, 2.4); g.fillStyle = OUT; g.fill(); circ(g, kx - 0.2, ky - 0.2, 1.7); g.fillStyle = GOLD; g.fill(); g.fillStyle = '#fffbe0'; circ(g, kx - 0.7, ky - 0.7, 0.6); g.fill(); }
  if (o.bone) drawBone(g, x, y0 - h - 3, Math.min(20, w * 0.75), 0, '#fff6e0', 1.4);
}
// a glowing window: frame, warm glass, mullions, a sill; o.round / o.arch, o.shut (shutter colour), o.box (flower box)
function bWin(g, x, y, w, h, o) {
  o = o || {};
  const fr = o.frame || '#8a5a3c';
  const shape = (p) => {
    g.beginPath();
    if (o.round) g.arc(x, y, w / 2 + p, 0, TAU);
    else if (o.arch) { g.moveTo(x - w / 2 - p, y + h / 2 + p); g.lineTo(x - w / 2 - p, y - h / 2 + w / 2); g.arc(x, y - h / 2 + w / 2, w / 2 + p, Math.PI, 0); g.lineTo(x + w / 2 + p, y + h / 2 + p); g.closePath(); }
    else rrect(g, x - w / 2 - p, y - h / 2 - p, w + p * 2, h + p * 2, 1.5 + p * 0.6);
  };
  if (o.shut) for (const s of [-1, 1]) {
    const sx = x + s * (w / 2 + 5.5), f = () => rrect(g, sx - 3.8, y - h / 2 - 1, 7.6, h + 2, 1.4);
    g.beginPath(); f(); g.fillStyle = OUT; g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    fillP(g, f, o.shut); g.fillStyle = shadeTone(o.shut, 0.3); for (let yy = y - h / 2 + 2.5; yy < y + h / 2; yy += 3.4) g.fillRect(sx - 2.6, yy, 5.2, 1);
    g.fillStyle = lightTone(o.shut, 0.35); g.fillRect(sx - 3, y - h / 2, 1, h);
  }
  shape(3.6); g.fillStyle = OUT; g.fill();
  shape(2.4); g.fillStyle = fr; g.fill();
  g.save(); shape(2.4); g.clip(); g.fillStyle = shadeTone(fr, 0.3); g.fillRect(x + w * 0.15, y - h, w, h * 2); g.fillStyle = lightTone(fr, 0.35); g.fillRect(x - w / 2 - 2.4, y - h, 1.2, h * 2); g.restore();
  shape(0.6); g.fillStyle = OUT; g.fill();
  shape(0);
  const gr = g.createRadialGradient(x - w * 0.12, y + h * 0.12, 0.5, x, y, Math.max(w, h) * 0.75);
  gr.addColorStop(0, o.glow1 || GLASS1); gr.addColorStop(1, o.glow2 || GLASS2); g.fillStyle = gr; g.fill();
  g.save(); shape(0); g.clip();
  if (o.curtain) { g.fillStyle = o.curtain; g.beginPath(); g.moveTo(x - w / 2, y - h / 2 - 2); g.quadraticCurveTo(x - w * 0.15, y - h * 0.3, x - w / 2, y + h * 0.1); g.fill(); g.beginPath(); g.moveTo(x + w / 2, y - h / 2 - 2); g.quadraticCurveTo(x + w * 0.15, y - h * 0.3, x + w / 2, y + h * 0.1); g.fill(); }
  g.fillStyle = 'rgba(150,70,40,0.32)'; g.beginPath(); g.rect(x - w, y - h, w * 2, h * 2); g.translate(1.6, 2); shape(0); g.fill('evenodd');
  g.restore();
  g.save(); shape(0); g.clip();
  if (!o.noBars) { g.fillStyle = fr; g.fillRect(x - 1.1, y - h, 2.2, h * 2); g.fillRect(x - w, y - 1.1 + (o.arch ? h * 0.12 : 0), w * 2, 2.2); }
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - w * 0.36, y - h * 0.05); g.lineTo(x - w * 0.12, y - h * 0.32); g.stroke();
  g.restore();
  if (!o.round && !o.noSill) {
    const f = () => rrect(g, x - w / 2 - 5, y + h / 2 + 1.2, w + 10, 4.2, 1.4);
    g.beginPath(); f(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); fillP(g, f, lightTone(fr, 0.15)); g.fillStyle = lightTone(fr, 0.5); g.fillRect(x - w / 2 - 4, y + h / 2 + 1.6, w + 7, 1);
    if (o.snow) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y + h / 2 + 1.2, w / 2 + 5, 2.2, 0, Math.PI, 0); g.fill(); }
  }
  if (o.box) flowerBox(g, x, y + h / 2 + 5.6, w + 6, o.box);
}
function flowerBox(g, x, y, w, cols) {
  cols = Array.isArray(cols) ? cols : ['#ff6f8f', '#ffd84d', '#ff8fb4'];
  const f = () => rrect(g, x - w / 2, y, w, 6.5, 1.5);
  g.fillStyle = '#4f9a43'; for (let i = 0; i < 6; i++) { ell(g, x - w / 2 + 3 + i * (w - 6) / 5, y, 3.4, 2.6); g.fill(); }
  for (let i = 0; i < 5; i++) { const fx = x - w / 2 + 4 + i * (w - 8) / 4, fy = y - 2.2 - (i & 1) * 1.6, c0 = cols[i % cols.length]; g.fillStyle = OUT; circ(g, fx, fy, 2.6); g.fill(); g.fillStyle = c0; circ(g, fx, fy, 2); g.fill(); g.fillStyle = '#fff3b0'; circ(g, fx - 0.3, fy - 0.3, 0.7); g.fill(); }
  g.beginPath(); f(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); fillP(g, f, '#b06a40'); g.fillStyle = '#d58a55'; g.fillRect(x - w / 2 + 1, y + 0.8, w - 2, 1.2); g.fillStyle = '#8a4a30'; g.fillRect(x - w / 2 + 1, y + 4.6, w - 2, 1.4);
}

// little props
function pBarrel(g, x, y, s) {
  s = s || 1;
  g.save(); g.translate(x, y); g.scale(s, s);
  softShadow(g, 3, 0, 13, 4, 0.3);
  const body = () => { g.moveTo(-8, 0); g.quadraticCurveTo(-11.5, -11, -8, -22); g.lineTo(8, -22); g.quadraticCurveTo(11.5, -11, 8, 0); g.closePath(); };
  part(g, body, '#b47a46', { s: 3 });
  clipP(g, body, () => { g.strokeStyle = '#8a5530'; g.lineWidth = 0.9; for (const xx of [-4, 0, 4]) { g.beginPath(); g.moveTo(xx * 1.1, 0); g.quadraticCurveTo(xx * 1.5, -11, xx * 1.1, -22); g.stroke(); } for (const yy of [-5, -17]) { g.fillStyle = IRON; g.fillRect(-12, yy - 1.4, 24, 2.8); g.fillStyle = '#9a96b0'; g.fillRect(-12, yy - 1.4, 24, 0.8); } });
  const top = () => g.ellipse(0, -22, 8, 2.6, 0, 0, TAU);
  fillP(g, top, '#d49a62'); thinP(g, top, OUT, 1.2); g.strokeStyle = '#a8703f'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(0, -22, 5, 1.5, 0, 0, TAU); g.stroke();
  g.restore();
}
function pCrate(g, x, y, s, col) {
  s = s || 1; col = col || '#c8955a';
  g.save(); g.translate(x, y); g.scale(s, s);
  softShadow(g, 3, 0, 14, 4, 0.3);
  const f = () => g.rect(-10, -18, 20, 18);
  part(g, f, col, { s: 2.5 });
  clipP(g, f, () => { g.strokeStyle = shadeTone(col, 0.35); g.lineWidth = 1; for (const yy of [-12, -6]) { g.beginPath(); g.moveTo(-10, yy); g.lineTo(10, yy); g.stroke(); } g.strokeStyle = shadeTone(col, 0.5); g.lineWidth = 2.6; g.beginPath(); g.moveTo(-8, -2); g.lineTo(8, -16); g.stroke(); g.strokeStyle = lightTone(col, 0.25); g.lineWidth = 1; g.beginPath(); g.moveTo(-8.6, -3); g.lineTo(7.4, -17); g.stroke(); });
  g.restore();
}
function pMailbox(g, x, y, col) {
  col = col || '#4f7fd9';
  g.save(); g.translate(x, y);
  softShadow(g, 2, 0, 9, 3, 0.3);
  const post = () => g.rect(-1.8, -20, 3.6, 20), box = () => { g.moveTo(-8, -18); g.lineTo(-8, -26); g.quadraticCurveTo(-8, -31, 0, -31); g.quadraticCurveTo(8, -31, 8, -26); g.lineTo(8, -18); g.closePath(); };
  inkSil(g, [post, box], 0.8);
  fillP(g, post, '#9a6a45'); fillP(g, box, col); celBand(g, box, tones(col).sh, -2.5, -2.5); celBand(g, box, tones(col).hi, 2, 2, 0.7);
  g.fillStyle = shadeTone(col, 0.4); ell(g, -7.6, -24.5, 0.9, 4); g.fill();
  g.fillStyle = '#e8475f'; g.fillRect(7.5, -30, 2.2, 7); g.fillRect(7.5, -30, 5, 3); g.strokeStyle = OUT; g.lineWidth = 0.8; g.strokeRect(7.5, -30, 5, 3);
  drawPaw(g, 0, -25, 3, '#fff6e0');
  g.restore();
}
function pLantern(g, x, y, s) {
  s = s || 1;
  g.save(); g.translate(x, y); g.scale(s, s);
  const f = () => { rrect(g, -3.6, -4, 7.2, 9, 2); }, cap = () => { g.moveTo(-5, -4); g.lineTo(0, -8.5); g.lineTo(5, -4); g.closePath(); };
  inkSil(g, [f, cap], 0.7);
  fillP(g, f, '#ffe08a'); g.fillStyle = '#fff8d8'; g.fillRect(-1.8, -2.5, 2.2, 5); fillP(g, cap, '#4a3a52'); g.fillStyle = '#4a3a52'; g.fillRect(-3.8, 4, 7.6, 1.6);
  g.restore();
}
function pFlowerPot(g, x, y, col) {
  g.save(); g.translate(x, y);
  softShadow(g, 2, 0, 8, 3, 0.3);
  g.fillStyle = '#4f9a43'; for (const [a, b, r] of [[-3, -12, 4], [3, -13, 4], [0, -16, 4.5]]) { g.fillStyle = OUT; circ(g, a, b, r + 1); g.fill(); }
  for (const [a, b, r] of [[-3, -12, 4], [3, -13, 4], [0, -16, 4.5]]) { g.fillStyle = '#5fae4c'; circ(g, a, b, r); g.fill(); }
  g.fillStyle = col || '#ff6f8f'; for (const [a, b] of [[-3, -14], [3, -15], [0, -18.5]]) { circ(g, a, b, 1.8); g.fill(); }
  const pot = () => { g.moveTo(-5.5, -9); g.lineTo(5.5, -9); g.lineTo(4, 0); g.lineTo(-4, 0); g.closePath(); };
  part(g, pot, '#d9774a', { s: 2, w: 0.7 });
  g.restore();
}
// a little plank sign with a painted picture
function pSign(g, x, y, w, h, icon) {
  const f = () => rrect(g, x - w / 2, y - h / 2, w, h, 2.5);
  part(g, f, '#d9a46a', { s: 2.5 });
  clipP(g, f, () => { g.fillStyle = '#b07a46'; g.fillRect(x - w / 2, y - 0.6, w, 1.2); });
  if (icon) icon(x, y);
}

const BldArt = {
  house(g, v, opt) {
    bSeed(v * 31 + 5);
    const wall = WALLS[v % 5], roof = opt.roof || ROOFS[(v + 2) % 5], snow = opt.snow, k = v % 5;
    const mat = ['timber', 'planks', 'plaster', 'planks', 'timber'][k];
    bGround(g, 66, 13);
    const R = hipRoof(g, 0, -48, 60, -104, 30, roof, { snow });
    const C = bChimney(g, 26, -118, 12, -82, '#c98a6a');
    const wallP = () => g.rect(-46, -54, 92, 54);
    inkSil(g, [wallP, ...R.sils, ...C.sils]);
    bWall(g, -46, -54, 92, 54, wall, mat === 'planks' ? 'planks' : 'plaster', mat === 'timber' ? { beams: [[-43.5, -54, -43.5, -8, 5], [43.5, -54, 43.5, -8, 5], [-46, -42, 46, -42, 4], [-17, -42, -17, -8, 3.5], [17, -42, 17, -8, 3.5], [-43, -42, -30, -54, 3]] } : { sz: 7.5 });
    // a stone plinth along the foot
    clipP(g, () => g.rect(-47, -9, 94, 9), () => { stonesIn(g, -47, -9, 94, 9, '#cfc6c0', 4.5); aoFoot(g, -47, 0, 94, 6); });
    g.fillStyle = OUT; g.fillRect(-47, -9.6, 94, 1.1);
    const doorX = k === 1 || k === 3 ? -18 : 0;
    bDoor(g, doorX, 0, 24, 36, ['#8a4a3a', '#5a6aa8', '#7a5a8a', '#8a4a3a', '#4f7f5a'][k], { bone: true });
    const shut = k === 3 ? '#4f7fd9' : k === 4 ? '#e8475f' : null, box = k === 0 || k === 2 ? ['#ff6f8f', '#ffd84d'] : k === 4 ? ['#ffffff', '#8fb8ff'] : null;
    if (doorX === 0) for (const x of [-30, 30]) bWin(g, x, -28, 16, 16, { shut, box, snow, curtain: k === 2 ? '#ff9fb8' : null });
    else { bWin(g, 18, -28, 24, 17, { shut, box: ['#ff6f8f', '#ffd84d', '#ffffff'], snow }); }
    R.paint();
    C.paint(snow);
    // the little things that make it lived in
    if (k === 0) pMailbox(g, -56, 2, '#e8475f');
    if (k === 1) { pBarrel(g, 53, 2, 0.9); pLantern(g, 0, -42); }
    if (k === 2) { pCrate(g, -55, 2, 0.85); pCrate(g, -52, -13, 0.7, '#d9a46a'); }
    if (k === 3) { pMailbox(g, 56, 2, '#4f7fd9'); pFlowerPot(g, 2, 1, '#ffd84d'); }
    if (k === 4) { pBarrel(g, -54, 2, 0.85); pFlowerPot(g, -14, 2, '#ff6f8f'); pFlowerPot(g, 14, 2, '#8fb8ff'); }
    if (snow) snowDrifts(g, [[-36, 1, 16], [34, 1, 18], [56, 2, 9]]);
  },
  inn(g, v, opt) {
    bSeed(77);
    const snow = opt.snow, roof = snow ? '#6f84bf' : '#4f6fc9';
    bGround(g, 94, 16);
    const R = hipRoof(g, 0, -72, 92, -134, 56, roof, { snow, rowH: 10, tile: 12 });
    const C = bChimney(g, -58, -150, 14, -112, '#c98a6a');
    const ground = () => g.rect(-72, -42, 144, 42), upper = () => g.rect(-77, -80, 154, 40), bracket = () => { g.rect(70, -72, 26, 3.4); };
    const gable = () => { g.moveTo(-36, -70); g.lineTo(0, -116); g.lineTo(36, -70); g.closePath(); };
    inkSil(g, [ground, upper, bracket, ...R.sils, ...C.sils, gable]);
    bWall(g, -72, -42, 144, 42, '#d6cbbd', 'stone', { sz: 9, eave: false });
    bWall(g, -77, -80, 154, 39, '#f6e3c2', 'plaster', { beamCol: '#7d4e33', beams: [[-74, -80, -74, -41, 5], [74, -80, 74, -41, 5], [-36, -80, -36, -41, 4], [36, -80, 36, -41, 4], [-74, -46, 74, -46, 3], [-36, -46, -20, -78, 3], [36, -46, 20, -78, 3], [-74, -46, -62, -78, 3], [74, -46, 62, -78, 3]], ao: 6 });
    // the jetty: beam ends where the upper floor sticks out
    g.fillStyle = OUT; g.fillRect(-78, -42.6, 156, 5.4);
    g.fillStyle = '#7d4e33'; g.fillRect(-77, -41.8, 154, 3.6); g.fillStyle = '#a8703f'; g.fillRect(-77, -41.8, 154, 1);
    for (let x = -70; x <= 70; x += 14) { g.fillStyle = OUT; g.fillRect(x - 2.4, -39, 4.8, 4.4); g.fillStyle = '#a8703f'; g.fillRect(x - 1.6, -38.4, 3.2, 3); }
    eaveShade(g, -72, -37, 144, 5);
    bDoor(g, 0, 0, 32, 34, '#8a4a3a', { double: true });
    for (const x of [-48, 48]) bWin(g, x, -20, 22, 15, { box: ['#ff6f8f', '#ffd84d', '#ffffff'], frame: '#7d4e33' });
    for (const x of [-56, 56]) bWin(g, x, -61, 15, 15, { shut: '#4f6fc9', frame: '#7d4e33', snow, curtain: '#ff9fb8' });
    R.paint();
    // the front gable over the door, its own little roof edges and a round window
    fillP(g, gable, '#f6e3c2');
    clipP(g, gable, () => { beamsIn(g, '#7d4e33', [[0, -114, 0, -70, 4], [-30, -72, 30, -72, 4]]); eaveShade(g, -40, -112, 80, 8); });
    bWin(g, 0, -88, 14, 14, { round: true, frame: '#7d4e33' });
    for (const s of [-1, 1]) {
      const f = () => { g.moveTo(0, -121); g.lineTo(s * 42, -68); g.lineTo(s * 42, -62); g.lineTo(0, -113); g.closePath(); };
      g.beginPath(); f(); g.strokeStyle = OUT; g.lineWidth = 2.4; g.stroke(); fillP(g, f, s < 0 ? lightTone(roof, 0.1) : shadeTone(roof, 0.2));
      g.strokeStyle = s < 0 ? lightTone(roof, 0.45) : shadeTone(roof, 0.05); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -119.5); g.lineTo(s * 40.5, -67); g.stroke();
      if (snow) { g.strokeStyle = '#ffffff'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, -122); g.lineTo(s * 30, -83); g.stroke(); }
    }
    C.paint(snow);
    // bracket for the hanging sign (the sign itself swings, drawn live)
    g.fillStyle = IRON; g.fillRect(70, -71.2, 26, 1.8); g.strokeStyle = IRON; g.lineWidth = 1.4; g.beginPath(); g.moveTo(72, -68); g.quadraticCurveTo(80, -62, 86, -69); g.stroke();
    pLantern(g, -24, -30, 0.9); pLantern(g, 24, -30, 0.9);
    pBarrel(g, 82, 2, 0.9); pBarrel(g, 70, -4, 0.75); pCrate(g, -84, 2, 0.85);
    if (snow) snowDrifts(g, [[-60, 1, 18], [56, 1, 14], [-30, 1, 8]]);
  },
  smith(g, v, opt) {
    bSeed(41);
    const snow = opt.snow, roofC = snow ? '#7d84a8' : '#6b5a7a';
    bGround(g, 86, 15, 4);
    const R = hipRoof(g, -22, -52, 52, -98, 26, roofC, { snow, style: 'slate', rowH: 8, tile: 10 });
    const main = () => g.rect(-64, -58, 86, 58), shed = () => g.rect(20, -48, 56, 48), chim = () => g.rect(34, -130, 22, 80), chimCap = () => rrect(g, 31, -136, 28, 8, 2.5);
    const lean = () => { g.moveTo(16, -40); g.lineTo(82, -40); g.lineTo(78, -62); g.lineTo(22, -64); g.closePath(); };
    inkSil(g, [main, shed, chim, chimCap, lean, ...R.sils]);
    // the forge chimney first: the lean-to roof hides its foot
    clipP(g, chim, () => { stonesIn(g, 34, -130, 22, 80, '#a49aae', 7); g.fillStyle = shadeTone('#a49aae', 0.4); g.globalAlpha = 0.45; g.fillRect(48, -130, 10, 80); g.globalAlpha = 1; });
    fillP(g, chimCap, '#8a8098'); g.fillStyle = '#c4bccf'; g.fillRect(32, -135, 26, 1.6); g.fillStyle = '#2a1a2a'; ell(g, 45, -133.5, 10, 1.8); g.fill();
    if (snow) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(44, -136, 15, 3.5, 0, Math.PI, 0); g.fill(); }
    bWall(g, -64, -58, 86, 58, '#d2c6b6', 'stone', { sz: 9 });
    // the open forge under the lean-to: a dark nook, a brick hearth with a hot mouth
    fillP(g, shed, '#3e2848');
    clipP(g, shed, () => {
      g.fillStyle = '#56385c'; g.fillRect(20, -48, 56, 10);
      const hearth = () => g.rect(28, -30, 36, 30);
      g.save(); g.beginPath(); hearth(); g.clip(); g.fillStyle = '#8a4a3a'; g.fillRect(28, -30, 36, 30);
      for (let yy = -30, r = 0; yy < 0; yy += 6, r++) for (let xx = 28 - (r & 1) * 5; xx < 64; xx += 10) { g.fillStyle = mix('#b8604a', '#7a3a3a', bR(0, 0.6)); g.beginPath(); rrect(g, xx + 0.6, yy + 0.6, 8.8, 4.8, 1.2); g.fill(); }
      g.restore();
      g.beginPath(); g.moveTo(36, -4); g.lineTo(36, -16); g.arc(46, -16, 10, Math.PI, 0); g.lineTo(56, -4); g.closePath(); g.fillStyle = OUT; g.fill();
      g.beginPath(); g.moveTo(37.5, -4); g.lineTo(37.5, -16); g.arc(46, -16, 8.5, Math.PI, 0); g.lineTo(54.5, -4); g.closePath();
      const gr = g.createRadialGradient(46, -9, 1, 46, -12, 13); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(0.45, '#ffb43a'); gr.addColorStop(1, '#c8402a'); g.fillStyle = gr; g.fill();
      g.fillStyle = '#5a2a2a'; for (const [cx, r] of [[41, 2.6], [46, 3], [51, 2.4]]) { circ(g, cx, -5, r); g.fill(); } g.fillStyle = '#ffdf6a'; circ(g, 44, -6, 1); g.fill(); circ(g, 49, -6.5, 0.9); g.fill();
      g.fillStyle = '#7a3a3a'; g.fillRect(26, -33, 40, 4); g.fillStyle = '#c4705a'; g.fillRect(26, -33, 40, 1.2);
      // tools on the back wall
      g.strokeStyle = '#2a1a2e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(68, -44); g.lineTo(68, -30); g.moveTo(72, -44); g.lineTo(73, -28); g.stroke();
      g.fillStyle = '#8f8aa8'; g.fillRect(65, -32, 6, 3); g.fillRect(72, -30, 3, 3);
      aoFoot(g, 20, 0, 56, 10, 0.5);
    });
    // the lean-to roof in wooden shingles, and its two posts
    for (const x of [22, 76]) { const p = () => g.rect(x - 2.6, -42, 5.2, 42); fillP(g, p, '#8a5a3c'); g.fillStyle = '#b07a4a'; g.fillRect(x - 2.2, -42, 1.2, 42); }
    fillP(g, lean, '#a8703f');
    clipP(g, lean, () => {
      for (let r = 0; r < 4; r++) { const yb = -40 - r * 6; for (let x = 14 + (r & 1) * 4; x < 84; x += 8) { const c0 = mix('#a8703f', r & 1 ? '#fff0d0' : '#4a3070', bR(0, 0.14)); g.fillStyle = shadeTone(c0, 0.35); g.fillRect(x, yb - 7, 7.4, 8.4); g.fillStyle = c0; g.fillRect(x, yb - 7, 7, 6.6); } }
      g.fillStyle = lightTone('#a8703f', 0.3); g.globalAlpha = 0.35; g.fillRect(14, -66, 70, 7); g.globalAlpha = 1;
      if (snow) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(14, -70); g.lineTo(86, -70); g.lineTo(86, -54); for (let x = 86; x > 14; x -= 9) g.quadraticCurveTo(x - 4.5, -48 - (x % 2), x - 9, -53); g.closePath(); g.fill(); }
    });
    g.fillStyle = '#6d4530'; g.fillRect(16, -41.5, 66, 2.4);
    eaveShade(g, 20, -38, 56, 4);
    bDoor(g, -40, 0, 24, 34, '#6d4a5a', {});
    bWin(g, -6, -30, 16, 15, { frame: '#6d4a5a', snow });
    pSign(g, 45, -98, 26, 13, (x, y) => { g.fillStyle = '#4a4a5e'; g.beginPath(); g.moveTo(x - 8, y - 3); g.lineTo(x + 7, y - 3); g.lineTo(x + 9.5, y - 0.5); g.lineTo(x + 3, y - 0.5); g.lineTo(x + 3, y + 1.5); g.lineTo(x + 5, y + 3.4); g.lineTo(x - 5, y + 3.4); g.lineTo(x - 3, y + 1.5); g.lineTo(x - 3, y - 0.5); g.lineTo(x - 7, y - 0.5); g.closePath(); g.fill(); });
    R.paint();
    // the anvil out front of the forge, a water barrel and a rack of swords
    anvil(g, 47, 2);
    pBarrel(g, -72, 2, 0.85);
    for (const [x, a] of [[86, -0.12], [91, 0.1]]) { g.save(); g.translate(x, 0); g.rotate(a); swordShape(g); g.restore(); }
    if (snow) snowDrifts(g, [[-46, 1, 16], [6, 1, 12]]);
  },
  trainer(g, v, opt) {
    bSeed(23);
    const snow = opt.snow, hat = snow ? '#6f6fc9' : '#7b55c9', wall = '#ece0f7';
    bGround(g, 76, 14);
    const body = () => { g.moveTo(-50, -70); g.lineTo(-50, -6); g.quadraticCurveTo(0, 7, 50, -6); g.lineTo(50, -70); g.closePath(); };
    const brim = () => g.ellipse(0, -70, 66, 15, 0, 0, TAU);
    const cone = () => { g.moveTo(-46, -76); g.quadraticCurveTo(-22, -106, -14, -150); g.quadraticCurveTo(-10, -176, 12, -186); g.quadraticCurveTo(26, -190, 30, -180); g.quadraticCurveTo(18, -178, 10, -162); g.quadraticCurveTo(16, -106, 46, -76); g.closePath(); };
    inkSil(g, [body, brim, cone]);
    // a round tower: cel bands follow the curve
    clipP(g, body, () => {
      g.fillStyle = wall; g.fillRect(-52, -80, 104, 90);
      g.globalAlpha = 0.16; for (let i = 0; i < 26; i++) { g.fillStyle = _bR() < 0.5 ? '#fff8e0' : '#b9a6d6'; ell(g, bR(-48, 48), bR(-66, -10), bR(3, 7), bR(1.5, 3)); g.fill(); } g.globalAlpha = 1;
      g.fillStyle = lightTone(wall, 0.5); g.globalAlpha = 0.6; g.fillRect(-42, -80, 12, 90); g.globalAlpha = 1;
      g.fillStyle = shadeTone(wall, 0.3); g.globalAlpha = 0.55; g.beginPath(); g.moveTo(24, -80); g.quadraticCurveTo(30, -40, 22, 10); g.lineTo(60, 10); g.lineTo(60, -80); g.fill(); g.globalAlpha = 1;
      // stone foot band following the curve
      g.save(); g.beginPath(); g.moveTo(-52, -14); g.quadraticCurveTo(0, -1, 52, -14); g.lineTo(52, 10); g.lineTo(-52, 10); g.closePath(); g.clip(); stonesIn(g, -52, -20, 104, 30, '#c4b3d8', 6); g.restore();
      aoFoot(g, -52, 6, 104, 16);
      eaveShade(g, -52, -70, 104, 10);
    });
    bDoor(g, 0, 2, 26, 38, '#4f55a8', { frame: '#d9c8ee' });
    // a gold star over the door
    star5(g, 0, -45, 5.5, GOLD, true);
    for (const x of [-32, 32]) bWin(g, x, -36, 17, 17, { round: true, frame: '#6a4aa8', glow1: '#fff4ff', glow2: '#c88af0' });
    // the wizard hat roof
    fillP(g, brim, hat);
    g.save(); g.beginPath(); brim(); g.clip(); g.fillStyle = shadeTone(hat, 0.35); g.beginPath(); g.ellipse(4, -64, 66, 13, 0, 0, TAU); g.rect(-80, -60, 160, 30); g.fill(); g.fillStyle = lightTone(hat, 0.25); g.beginPath(); g.ellipse(-8, -73, 50, 8, 0, 0, TAU); g.fill(); g.restore();
    fillP(g, cone, hat);
    clipP(g, cone, () => {
      g.fillStyle = shadeTone(hat, 0.32); g.beginPath(); g.moveTo(14, -190); g.quadraticCurveTo(8, -130, 18, -100); g.quadraticCurveTo(30, -84, 50, -74); g.lineTo(60, -190); g.closePath(); g.fill();
      g.fillStyle = lightTone(hat, 0.3); g.beginPath(); g.moveTo(-40, -76); g.quadraticCurveTo(-20, -100, -12, -150); g.quadraticCurveTo(-14, -110, -26, -78); g.closePath(); g.fill();
      // hat band with a moon buckle
      g.fillStyle = OUT; g.fillRect(-60, -90, 120, 13); g.fillStyle = GOLD; g.fillRect(-60, -89, 120, 10.6); g.fillStyle = '#ffeaa0'; g.fillRect(-60, -89, 120, 2.4); g.fillStyle = '#d89a2a'; g.fillRect(-60, -81, 120, 2.2);
      for (const [x, y, r] of [[-20, -118, 6], [12, -132, 5], [-6, -158, 4.4], [24, -108, 4.5], [-28, -98, 3.2]]) star5(g, x, y, r, '#ffe36a', false);
      g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(4, -110, 6.5, 0, TAU); g.fill(); g.fillStyle = hat; g.beginPath(); g.arc(7, -112, 5.6, 0, TAU); g.fill();
    });
    g.fillStyle = OUT; g.beginPath(); rrect(g, -8, -91, 16, 14, 3); g.fill(); g.fillStyle = '#ffe9a0'; g.beginPath(); rrect(g, -6.4, -89.4, 12.8, 10.8, 2); g.fill(); g.fillStyle = '#d89a2a'; g.beginPath(); rrect(g, -3.2, -86.4, 6.4, 4.8, 1); g.fill();
    if (snow) { clipP(g, cone, () => { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-20, -150); g.quadraticCurveTo(-4, -160, 12, -156); g.quadraticCurveTo(4, -150, -6, -146); g.quadraticCurveTo(-14, -142, -20, -150); g.fill(); }); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-6, -76, 52, 6, 0, Math.PI, 0); g.fill(); }
    // a striped hoop on a stand and a crystal ball
    g.save(); g.translate(72, 0);
    softShadow(g, 2, 0, 12, 4, 0.3);
    const stand = () => g.rect(-1.8, -26, 3.6, 26), foot = () => rrect(g, -8, -3, 16, 4, 2);
    inkSil(g, [stand, foot], 0.8); fillP(g, stand, '#8a5a3c'); fillP(g, foot, '#6d4530');
    g.lineWidth = 6.4; g.strokeStyle = OUT; g.beginPath(); g.ellipse(0, -42, 11, 15, 0, 0, TAU); g.stroke();
    g.lineWidth = 4; g.setLineDash([5, 5]); g.strokeStyle = '#ffffff'; g.beginPath(); g.ellipse(0, -42, 11, 15, 0, 0, TAU); g.stroke(); g.lineDashOffset = 5; g.strokeStyle = '#e8475f'; g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
    g.restore();
    g.save(); g.translate(-70, 0);
    softShadow(g, 2, 0, 10, 3.5, 0.3);
    const ped = () => { g.moveTo(-6, 0); g.lineTo(-4, -12); g.lineTo(4, -12); g.lineTo(6, 0); g.closePath(); }, ball = () => g.arc(0, -19, 8, 0, TAU);
    inkSil(g, [ped, ball], 0.8); fillP(g, ped, '#8a6aa8'); celBand(g, ped, '#6a4a8a', -2, -2);
    const bg = g.createRadialGradient(-2.5, -21.5, 0.5, 0, -19, 8); bg.addColorStop(0, '#f2fbff'); bg.addColorStop(0.5, '#9fe0f5'); bg.addColorStop(1, '#5a8ad9'); fillP(g, ball, bg);
    g.fillStyle = '#ffffff'; circ(g, -3, -22, 1.6); g.fill();
    g.restore();
  },
  castle(g, v, opt) { drawCastle(g); },
  board(g) {
    bSeed(9);
    bGround(g, 36, 7);
    const posts = [() => g.rect(-29, -64, 6, 64), () => g.rect(23, -64, 6, 64)], panel = () => g.rect(-36, -64, 72, 42);
    const roof = () => { g.moveTo(-44, -60); g.lineTo(-30, -78); g.lineTo(30, -78); g.lineTo(44, -60); g.lineTo(44, -56); g.lineTo(-44, -56); g.closePath(); };
    inkSil(g, [...posts, panel, roof]);
    for (const p of posts) { fillP(g, p, '#8a5a3c'); }
    g.fillStyle = '#b07a4a'; g.fillRect(-28, -22, 1.4, 22); g.fillRect(24, -22, 1.4, 22); aoFoot(g, -30, 0, 60, 6);
    clipP(g, panel, () => { vplanksIn(g, -36, -64, 72, 42, '#c08a58', 9); g.fillStyle = 'rgba(60,30,80,0.25)'; g.fillRect(-36, -64, 72, 6); g.fillStyle = shadeTone('#c08a58', 0.3); g.globalAlpha = 0.45; g.fillRect(24, -64, 12, 42); g.globalAlpha = 1; });
    // the notes pinned to it
    const notes = [[-22, -48, -0.12, '#fff6e0', 0], [-4, -50, 0.06, '#fffbe8', 1], [14, -44, -0.05, '#ffe8ea', 2], [-12, -33, 0.1, '#eaf6ff', 3], [22, -32, 0.08, '#fff6e0', 0]];
    for (const [x, y, a, col, kind] of notes) {
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = 'rgba(52,28,74,0.3)'; g.fillRect(-7, -6, 15, 14);
      g.fillStyle = col; g.fillRect(-8, -7.5, 15, 14); g.strokeStyle = 'rgba(59,34,53,0.6)'; g.lineWidth = 0.7; g.strokeRect(-8, -7.5, 15, 14);
      g.fillStyle = shadeTone(col, 0.15); g.beginPath(); g.moveTo(7, 6.5); g.lineTo(3, 6.5); g.lineTo(7, 2.5); g.fill();
      if (kind === 1) { g.fillStyle = '#5a3a4a'; g.font = 'bold 4px sans-serif'; g.textAlign = 'center'; g.fillText('WANTED', -0.5, -3); circ(g, -0.5, 2, 3); g.fillStyle = '#e8a04f'; g.fill(); g.fillStyle = '#5a3a4a'; g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(-2.6, -2.6); g.lineTo(-1.6, -0.6); g.moveTo(2.5, 0); g.lineTo(1.6, -2.6); g.lineTo(0.6, -0.6); g.fill(); }
      else if (kind === 2) drawPaw(g, -0.5, 0, 4, '#e8475f');
      else { g.strokeStyle = '#b0a090'; g.lineWidth = 0.8; for (let yy = -4; yy < 5; yy += 2.6) { g.beginPath(); g.moveTo(-5.5, yy); g.lineTo(4 - (yy > 2 ? 3 : 0), yy); g.stroke(); } }
      g.fillStyle = OUT; circ(g, -0.5, -6, 1.5); g.fill(); g.fillStyle = ['#e8475f', '#4f7fd9', '#ffd84d', '#4fa86a'][kind]; circ(g, -0.8, -6.3, 1.1); g.fill();
      g.restore();
    }
    fillP(g, roof, '#8a4a3a');
    clipP(g, roof, () => { for (let x = -46; x < 46; x += 7) { g.fillStyle = mix('#8a4a3a', '#fff0d0', bR(0, 0.15)); g.fillRect(x, -78, 6.4, 18); g.fillStyle = shadeTone('#8a4a3a', 0.3); g.fillRect(x + 6.4, -78, 0.8, 18); } g.fillStyle = lightTone('#8a4a3a', 0.3); g.fillRect(-46, -78, 92, 4); g.fillStyle = shadeTone('#8a4a3a', 0.4); g.fillRect(-46, -59, 92, 3); });
    // the "!" that says there is work here
    g.save(); g.translate(30, -76); circ(g, 0, 0, 8); g.fillStyle = OUT; g.fill(); circ(g, 0, 0, 6.6); g.fillStyle = GOLD; g.fill(); g.fillStyle = '#fff3b0'; circ(g, -2, -2, 2.4); g.fill();
    g.fillStyle = OUT; g.beginPath(); rrect(g, -1.3, -4.4, 2.6, 5.6, 1.2); g.fill(); circ(g, 0, 3.2, 1.4); g.fill(); g.restore();
  },
  well(g) {
    bSeed(3);
    bGround(g, 30, 8);
    const base = () => { g.moveTo(-24, -20); g.lineTo(-24, -4); g.quadraticCurveTo(0, 6, 24, -4); g.lineTo(24, -20); g.ellipse(0, -20, 24, 9, 0, 0, Math.PI, true); g.closePath(); };
    const posts = [() => g.rect(-21, -60, 5, 42), () => g.rect(16, -60, 5, 42)];
    const roof = () => { g.moveTo(-31, -54); g.lineTo(0, -76); g.lineTo(31, -54); g.lineTo(31, -50); g.lineTo(-31, -50); g.closePath(); };
    inkSil(g, [base, ...posts, roof]);
    clipP(g, base, () => { stonesIn(g, -26, -30, 52, 36, '#c4bccf', 6.5); g.fillStyle = shadeTone('#c4bccf', 0.32); g.globalAlpha = 0.5; g.beginPath(); g.moveTo(10, -30); g.quadraticCurveTo(18, -10, 12, 6); g.lineTo(30, 6); g.lineTo(30, -30); g.fill(); g.globalAlpha = 1; g.fillStyle = lightTone('#c4bccf', 0.4); g.globalAlpha = 0.4; g.fillRect(-20, -30, 7, 36); g.globalAlpha = 1; aoFoot(g, -26, 4, 52, 8); });
    // rim and water
    g.fillStyle = '#d9d2e2'; ell(g, 0, -20, 24, 9); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#2d4a7a'; ell(g, 0, -20, 18.5, 6.2); g.fill(); g.fillStyle = '#3f86c9'; ell(g, 1, -19, 15, 4.4); g.fill(); g.fillStyle = '#9fe0f5'; ell(g, -5, -20.5, 5, 1.2); g.fill();
    for (const p of posts) fillP(g, p, '#8a5a3c');
    g.fillStyle = '#b07a4a'; g.fillRect(-20, -60, 1.4, 36); g.fillRect(17, -60, 1.4, 36);
    // the crank, the rope and a bucket
    g.fillStyle = OUT; g.fillRect(-22, -48.5, 44, 4); g.fillStyle = '#a8703f'; g.fillRect(-21, -47.8, 42, 2.6); g.fillStyle = '#d9a46a'; g.fillRect(-21, -47.8, 42, 0.8);
    g.strokeStyle = '#d9c09a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-3, -45.5); g.lineTo(-3, -32); g.stroke();
    const bucket = () => { g.moveTo(-8, -33); g.lineTo(2, -33); g.lineTo(1, -25); g.lineTo(-7, -25); g.closePath(); };
    part(g, bucket, '#a8703f', { s: 1.6, w: 0.6 }); g.fillStyle = IRON; g.fillRect(-7.6, -31, 9.2, 1.2);
    g.strokeStyle = OUT; g.lineWidth = 1.4; g.beginPath(); g.moveTo(22, -46.5); g.lineTo(27, -46.5); g.lineTo(27, -40); g.stroke();
    fillP(g, roof, '#d9534f');
    clipP(g, roof, () => { for (let r = 0; r < 4; r++) for (let x = -34 + (r & 1) * 4; x < 34; x += 8) { const yb = -50 - r * 6.5, c0 = mix('#d9534f', r & 1 ? '#fff0d0' : '#4a3070', bR(0, 0.12)); g.fillStyle = shadeTone(c0, 0.35); g.beginPath(); g.ellipse(x + 4, yb + 1.2, 4.2, 3.6, 0, 0, Math.PI); g.fill(); g.fillStyle = c0; g.beginPath(); g.moveTo(x, yb - 7); g.lineTo(x, yb - 2); g.quadraticCurveTo(x, yb, x + 4, yb); g.quadraticCurveTo(x + 8, yb, x + 8, yb - 2); g.lineTo(x + 8, yb - 7); g.fill(); } g.fillStyle = shadeTone('#d9534f', 0.3); g.globalAlpha = 0.4; g.beginPath(); g.moveTo(0, -76); g.lineTo(34, -52); g.lineTo(34, -48); g.lineTo(6, -48); g.closePath(); g.fill(); g.globalAlpha = 1; });
    g.fillStyle = OUT; circ(g, 0, -77, 2.6); g.fill(); g.fillStyle = GOLD; circ(g, -0.3, -77.3, 1.8); g.fill();
  },
  stall(g, v) {
    bSeed(v * 7 + 1);
    const k = v % 3, cloth = ['#e8475f', '#4f7fd9', '#4fa86a'][k];
    bGround(g, 54, 10);
    const counter = () => g.rect(-44, -32, 88, 32), posts = [() => g.rect(-44, -78, 5, 50), () => g.rect(39, -78, 5, 50)];
    const awn = () => { g.moveTo(-54, -64); g.lineTo(-46, -86); g.lineTo(46, -86); g.lineTo(54, -64); g.lineTo(54, -60); g.lineTo(-54, -60); g.closePath(); };
    inkSil(g, [counter, ...posts, awn]);
    for (const p of posts) fillP(g, p, '#8a5a3c');
    g.fillStyle = '#b07a4a'; g.fillRect(-43, -78, 1.3, 46); g.fillRect(40, -78, 1.3, 46);
    clipP(g, counter, () => {
      vplanksIn(g, -44, -32, 88, 32, '#c08a58', 8);
      // a cloth skirt hung along the counter's front
      g.fillStyle = OUT; g.beginPath(); g.moveTo(-44, -25); g.lineTo(44, -25); g.lineTo(44, -14); for (let x = 44; x > -44; x -= 11) g.quadraticCurveTo(x - 5.5, -6, x - 11, -14); g.closePath(); g.fill();
      g.fillStyle = cloth; g.beginPath(); g.moveTo(-44, -24); g.lineTo(44, -24); g.lineTo(44, -15); for (let x = 44; x > -44; x -= 11) g.quadraticCurveTo(x - 5.5, -7.4, x - 11, -15); g.closePath(); g.fill();
      g.fillStyle = lightTone(cloth, 0.35); g.fillRect(-44, -24, 88, 2);
      aoFoot(g, -44, 0, 88, 10);
    });
    g.fillStyle = OUT; g.fillRect(-46, -33.5, 92, 4.4); g.fillStyle = '#d9a46a'; g.fillRect(-45, -32.8, 90, 3); g.fillStyle = '#f2c28a'; g.fillRect(-45, -32.8, 90, 0.9);
    // crates of produce on the counter
    const goods = [['#e8473b', '#ff8f6a'], ['#ff9a3a', '#ffc27a'], ['#7fd36a', '#b4ec8a'], ['#ffd84d', '#fff0a0'], ['#b46ad9', '#d8a0f0']];
    for (let i = 0; i < 3; i++) {
      const cx = -28 + i * 28, [c1, c2] = goods[(k + i * 2) % 5];
      const box = () => g.rect(cx - 11, -42, 22, 10);
      inkSil(g, [box], 0.7); fillP(g, box, '#c8955a'); g.fillStyle = '#e0b07a'; g.fillRect(cx - 11, -42, 22, 1.2); g.fillStyle = '#8a5a3c'; g.fillRect(cx - 11, -37.5, 22, 1);
      for (const [dx, dy] of [[-6, -44], [0, -45], [6, -44], [-3, -48.5], [3, -48.5]]) { g.fillStyle = OUT; circ(g, cx + dx, dy, 4.3); g.fill(); }
      for (const [dx, dy] of [[-6, -44], [0, -45], [6, -44], [-3, -48.5], [3, -48.5]]) { g.fillStyle = c1; circ(g, cx + dx, dy, 3.5); g.fill(); g.fillStyle = c2; circ(g, cx + dx - 1.1, dy - 1.1, 1.3); g.fill(); }
    }
    // the striped awning with a scalloped hem
    fillP(g, awn, '#fff8ee');
    clipP(g, awn, () => {
      for (let i = 0; i < 9; i++) if (i % 2 === 0) { const x0 = -46 + i * 10.2, x1 = x0 + 10.2; g.fillStyle = cloth; g.beginPath(); g.moveTo(x0, -86); g.lineTo(x1, -86); g.lineTo(x1 * 1.17, -60); g.lineTo(x0 * 1.17, -60); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(255,248,220,0.35)'; g.fillRect(-60, -86, 120, 6);
      g.fillStyle = 'rgba(64,30,90,0.22)'; g.fillRect(28, -86, 30, 30);
    });
    for (let i = 0; i < 9; i++) { const x = -54 + i * 12 + 6, col = i % 2 === 0 ? cloth : '#fff8ee'; g.beginPath(); g.arc(x, -60, 6.6, 0, Math.PI); g.fillStyle = OUT; g.fill(); g.beginPath(); g.arc(x, -60.6, 5.4, 0, Math.PI); g.fillStyle = col; g.fill(); }
    g.fillStyle = 'rgba(70,38,104,0.3)'; g.fillRect(-42, -54, 84, 4);
    // sausages hanging from the front rail: this is a dog market after all
    if (k !== 1) for (let i = 0; i < 4; i++) { const x = -30 + i * 8; g.strokeStyle = '#d9c09a'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, -60); g.lineTo(x, -57); g.stroke(); const s = () => rrect(g, x - 2.4, -57, 4.8, 9, 2.4); inkSil(g, [s], 0.5); fillP(g, s, '#c0533a'); g.fillStyle = '#e88a6a'; g.fillRect(x - 1.4, -55.5, 1, 5); }
    else { drawBone(g, 22, -52, 12, 0.3, '#fff6e0', 1.1); drawBone(g, 30, -50, 10, -0.4, '#fff6e0', 1.1); }
  },
  tent(g, v) {
    bSeed(v + 11);
    const col = v % 2 ? '#e8a04f' : '#5fa24c', T = tones(col);
    bGround(g, 54, 10);
    const front = () => { g.moveTo(-48, 0); g.lineTo(0, -70); g.lineTo(48, 0); g.closePath(); };
    const side = () => { g.moveTo(0, -70); g.lineTo(14, -78); g.lineTo(60, -8); g.lineTo(48, 0); g.closePath(); };
    const pole = () => g.rect(-1.6, -84, 3.2, 16);
    inkSil(g, [front, side, pole]);
    // ropes and stakes
    g.strokeStyle = '#8a7a6a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-30, -26); g.lineTo(-58, 2); g.moveTo(54, -10); g.lineTo(66, 0); g.stroke();
    for (const x of [-58, 66]) { g.fillStyle = OUT; g.fillRect(x - 1.6, -4, 3.2, 6); g.fillStyle = '#b07a4a'; g.fillRect(x - 0.9, -3.4, 1.8, 5); }
    fillP(g, side, T.sh);
    clipP(g, side, () => { g.strokeStyle = T.sh2; g.lineWidth = 1; for (let s = 0.2; s < 1; s += 0.2) { g.beginPath(); g.moveTo(lerp(0, 48, s), lerp(-70, 0, s)); g.lineTo(lerp(14, 60, s), lerp(-78, -8, s)); g.stroke(); } });
    fillP(g, front, col);
    clipP(g, front, () => {
      // canvas stripes and a patch
      g.fillStyle = shadeTone(col, 0.12); for (let i = -3; i <= 3; i += 2) { g.beginPath(); g.moveTo(0, -70); g.lineTo(i * 16 - 8, 0); g.lineTo(i * 16 + 8, 0); g.closePath(); g.fill(); }
      g.fillStyle = T.hi; g.globalAlpha = 0.45; g.beginPath(); g.moveTo(0, -70); g.lineTo(-48, 0); g.lineTo(-30, 0); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#f2e2c4'; g.fillRect(24, -22, 10, 9); g.strokeStyle = shadeTone('#f2e2c4', 0.4); g.lineWidth = 0.7; g.setLineDash([1.4, 1.4]); g.strokeRect(24.5, -21.5, 9, 8); g.setLineDash([]);
      aoFoot(g, -50, 0, 100, 10);
    });
    // the open flap
    const hole = () => { g.moveTo(-16, 0); g.lineTo(0, -44); g.lineTo(16, 0); g.closePath(); };
    fillP(g, hole, '#3a2442'); clipP(g, hole, () => { g.fillStyle = '#56385c'; g.fillRect(-16, -8, 32, 8); g.fillStyle = '#e8c08a'; g.globalAlpha = 0.5; ell(g, 0, -2, 7, 2.5); g.fill(); g.globalAlpha = 1; });
    const flap = () => { g.moveTo(0, -44); g.quadraticCurveTo(-4, -18, -26, -2); g.lineTo(-17, -1); g.closePath(); };
    fillP(g, flap, T.hi); thinP(g, flap, OUT, 1.4);
    g.strokeStyle = OUT; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -44); g.lineTo(16, 0); g.stroke();
    g.fillStyle = '#d9c09a'; circ(g, -14, -14, 1.6); g.fill();
    fillP(g, pole, '#8a5a3c');
  },
  hut(g, v, opt) {
    bSeed(v * 13 + 2);
    const wall = '#8f8aa5', roof = '#5a4a78';
    bGround(g, 62, 12);
    const walls = () => { g.moveTo(-48, 0); g.lineTo(-45, -62); g.lineTo(47, -58); g.lineTo(49, 0); g.closePath(); };
    const rf = () => { g.moveTo(-64, -50); g.quadraticCurveTo(-34, -78, -8, -128); g.lineTo(2, -122); g.quadraticCurveTo(30, -84, 64, -54); g.quadraticCurveTo(0, -42, -64, -50); g.closePath(); };
    const pipe = () => { g.moveTo(24, -86); g.lineTo(24, -110); g.lineTo(30, -116); g.lineTo(36, -112); g.lineTo(31, -107); g.lineTo(31, -80); g.closePath(); };
    inkSil(g, [walls, pipe, rf]);
    clipP(g, walls, () => {
      g.save(); g.transform(1, -0.03, 0.04, 1, 0, 0); vplanksIn(g, -52, -70, 106, 74, wall, 11); g.restore();
      g.fillStyle = '#a7a2bd'; g.fillRect(-36, -40, 16, 9); g.fillStyle = '#6a6488'; g.fillRect(-36, -32, 16, 1.4);
      for (const [x, y] of [[-34, -38], [-23, -38], [-34, -33], [-23, -33]]) { g.fillStyle = '#4a4058'; circ(g, x, y, 0.8); g.fill(); }
      g.fillStyle = 'rgba(80,140,70,0.45)'; for (let i = 0; i < 7; i++) { ell(g, bR(-46, 46), bR(-6, -1), bR(4, 9), bR(1.5, 3)); g.fill(); }
      g.fillStyle = shadeTone(wall, 0.3); g.globalAlpha = 0.45; g.fillRect(36, -70, 16, 74); g.globalAlpha = 1;
      eaveShade(g, -50, -64, 100, 9); aoFoot(g, -50, 0, 100, 14);
    });
    bDoor(g, 0, 0, 24, 30, '#3a2a48', { frame: '#6a6488', stone: false });
    for (const x of [-27, 28]) {
      bWin(g, x, -36, 14, 14, { round: true, frame: '#4a3a5a', glow1: '#f4ffc4', glow2: '#8fd04a', noBars: true });
      g.strokeStyle = '#4a3a5a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - 6, -36); g.lineTo(x + 6, -37); g.moveTo(x, -43); g.lineTo(x + 1, -30); g.stroke();
    }
    clipP(g, pipe, () => { g.fillStyle = '#6a6488'; g.fillRect(20, -120, 20, 44); g.fillStyle = '#8f8aa8'; g.fillRect(24, -112, 2, 30); g.fillStyle = '#4a4058'; g.fillRect(20, -98, 20, 2); });
    fillP(g, rf, roof);
    clipP(g, rf, () => {
      // patchy old shingles, a hole or two
      for (let r = 0; r < 9; r++) for (let x = -70 + (r & 1) * 5; x < 70; x += 10) { const yb = -48 - r * 9 + x * 0.04, c0 = mix(roof, _bR() < 0.5 ? '#9a8ab8' : '#2e2442', bR(0, 0.3)); g.fillStyle = shadeTone(roof, 0.35); g.fillRect(x, yb - 9, 9.6, 10.4); g.fillStyle = c0; g.save(); g.translate(x + 5, yb - 4.5); g.rotate(bR(-0.15, 0.15)); g.fillRect(-4.8, -4.5, 9.4, 8.6); g.restore(); }
      g.fillStyle = '#2a1e36'; ell(g, -20, -76, 6, 3.4, 0.3); g.fill(); ell(g, 22, -64, 4, 2.4); g.fill();
      g.fillStyle = 'rgba(120,180,90,0.5)'; for (let i = 0; i < 6; i++) { ell(g, bR(-50, 50), bR(-70, -50), bR(4, 8), 2); g.fill(); }
      g.fillStyle = lightTone(roof, 0.25); g.globalAlpha = 0.4; g.beginPath(); g.moveTo(-64, -50); g.quadraticCurveTo(-34, -78, -8, -128); g.lineTo(-20, -60); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.fillStyle = shadeTone(roof, 0.4); g.globalAlpha = 0.45; g.beginPath(); g.moveTo(2, -122); g.quadraticCurveTo(30, -84, 64, -54); g.lineTo(20, -50); g.closePath(); g.fill(); g.globalAlpha = 1;
    });
    // a cobweb under the eave and a jack o' lantern by the door
    g.strokeStyle = 'rgba(240,240,255,0.7)'; g.lineWidth = 0.6; for (const a of [0, 0.5, 1]) { g.beginPath(); g.moveTo(-45, -58); g.lineTo(-45 + 12 * Math.cos(a * 1.5), -58 + 12 * Math.sin(a * 1.5)); g.stroke(); } for (const r of [5, 9]) { g.beginPath(); g.arc(-45, -58, r, 0.05, 1.45); g.stroke(); }
    jackLantern(g, 24, 2);
    if (opt.label) {
      g.strokeStyle = IRON; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-14, -74); g.lineTo(-14, -68); g.moveTo(14, -74); g.lineTo(14, -68); g.stroke();
      pSign(g, 0, -62, 40, 13, (x, y) => { g.fillStyle = '#4a3a5a'; g.font = 'bold 9px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(opt.label, x, y + 3.4); });
    }
  },
  fountain(g) {
    bSeed(19);
    bGround(g, 68, 14);
    const outer = () => { g.moveTo(-60, -18); g.lineTo(-60, -4); g.quadraticCurveTo(0, 10, 60, -4); g.lineTo(60, -18); g.ellipse(0, -18, 60, 20, 0, 0, Math.PI, true); g.closePath(); };
    const ped = () => { g.moveTo(-10, -20); g.lineTo(-8, -48); g.lineTo(8, -48); g.lineTo(10, -20); g.closePath(); }, plinth = () => rrect(g, -14, -54, 28, 8, 2.5);
    inkSil(g, [outer, ped, plinth]);
    clipP(g, outer, () => { stonesIn(g, -62, -40, 124, 50, '#d2cadc', 7); g.fillStyle = shadeTone('#d2cadc', 0.3); g.globalAlpha = 0.45; g.beginPath(); g.moveTo(30, -30); g.quadraticCurveTo(44, -10, 40, 8); g.lineTo(64, 8); g.lineTo(64, -30); g.fill(); g.globalAlpha = 1; aoFoot(g, -62, 6, 124, 10); });
    // rim, then water
    g.fillStyle = '#e6e0ee'; ell(g, 0, -18, 60, 20); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = '#c9c0d6'; ell(g, 2, -16.5, 52, 15.5); g.fill();
    g.fillStyle = '#3a8fc9'; ell(g, 0, -17, 50, 14.5); g.fill();
    const wg = g.createLinearGradient(0, -31, 0, -3); wg.addColorStop(0, '#2f78c0'); wg.addColorStop(1, '#5fd3ec'); g.fillStyle = wg; ell(g, 1, -16, 47, 12.5); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -17, 42, 10, 0, 0.3, 1.2); g.stroke(); g.beginPath(); g.ellipse(0, -17, 36, 8, 0, 3.6, 4.4); g.stroke();
    // the pedestal
    fillP(g, ped, '#d8d0e6'); celBand(g, ped, '#aea4c4', -3, -2); g.fillStyle = '#f2eef8'; g.fillRect(-7, -46, 2, 24);
    fillP(g, plinth, '#e6e0ee'); g.fillStyle = '#fff'; g.fillRect(-12, -53, 24, 1.5); g.fillStyle = '#aea4c4'; g.fillRect(-12, -48.5, 24, 1.5);
    drawPaw(g, 0, -34, 5, '#aea4c4');
    // the proud stone dog: sitting tall, chest out, nose up
    g.save(); g.translate(0, -54);
    const st = '#dcd5e8';
    const dogParts = [
      () => { g.moveTo(-14, -6); g.quadraticCurveTo(-26, -26, -20, -36); g.quadraticCurveTo(-17, -40, -15, -36); g.quadraticCurveTo(-19, -26, -10, -12); g.closePath(); }, // tail curled up
      () => g.ellipse(-8, -9, 12, 9, 0, 0, TAU),                         // haunch
      () => g.ellipse(-2, -20, 10, 16, 0.18, 0, TAU),                    // body, sitting upright
      () => g.ellipse(5, -24, 8, 11, -0.15, 0, TAU),                     // chest puffed out
      () => rrect(g, 2, -18, 5.5, 18, 2.6),                              // front leg
      () => rrect(g, 7.5, -17, 5, 17, 2.4),                              // front leg
      () => g.arc(4, -40, 9, 0, TAU),                                    // head
      () => g.ellipse(12.5, -44, 7, 4.4, -0.42, 0, TAU),                 // snout raised
      () => g.ellipse(-2.5, -40, 3.6, 7.5, 0.45, 0, TAU),               // floppy ear
    ];
    inkSil(g, dogParts);
    for (const f of dogParts) fillP(g, f, st);
    for (const f of dogParts) celBand(g, f, '#b3a9c9', -3, -3.4, 0.95);
    for (const f of [dogParts[2], dogParts[6], dogParts[3]]) celBand(g, f, '#f7f4fb', 2.6, 3, 0.9);
    taperLine(g, qpts(-4, -27, -6, -16, -1, -9, 6), 1.3, '#9a90b4');
    taperLine(g, qpts(-3, -46, -6, -39, -4, -33, 5), 1.1, '#9a90b4');
    g.fillStyle = '#7a7096'; ell(g, 18.4, -47.2, 2.1, 1.7, -0.42); g.fill();
    g.strokeStyle = '#7a7096'; g.lineWidth = 1.2; g.beginPath(); g.arc(6.5, -42, 2, Math.PI * 1.1, Math.PI * 1.85); g.stroke();
    // a little gold crown
    g.fillStyle = OUT; g.beginPath(); g.moveTo(-1, -47); g.lineTo(0, -54); g.lineTo(3, -51); g.lineTo(5.5, -56); g.lineTo(8, -51); g.lineTo(11, -54); g.lineTo(11, -47); g.closePath(); g.fill();
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(0.2, -47.8); g.lineTo(0.8, -52.2); g.lineTo(3.2, -49.8); g.lineTo(5.5, -54.2); g.lineTo(7.8, -49.8); g.lineTo(10, -52.2); g.lineTo(10, -47.8); g.closePath(); g.fill();
    g.fillStyle = '#fff3b0'; g.fillRect(1, -49.6, 8, 1);
    g.restore();
  },
  sign(g, v, opt) {
    bSeed(5);
    bGround(g, 14, 4);
    const post = () => g.rect(-3, -50, 6, 50);
    const a1 = () => { g.moveTo(-28, -56); g.lineTo(18, -56); g.lineTo(27, -48); g.lineTo(18, -40); g.lineTo(-28, -40); g.closePath(); };
    const a2 = () => { g.moveTo(26, -34); g.lineTo(-18, -34); g.lineTo(-27, -26); g.lineTo(-18, -18); g.lineTo(26, -18); g.closePath(); };
    inkSil(g, [post, a1, a2]);
    fillP(g, post, '#8a5a3c'); g.fillStyle = '#b07a4a'; g.fillRect(-2.4, -50, 1.4, 50); aoFoot(g, -3, 0, 6, 6);
    for (const [f, y] of [[a1, -48], [a2, -26]]) { fillP(g, f, '#d9a46a'); celBand(g, f, '#b07a46', -2, -2.6); celBand(g, f, '#f2c88a', 1.6, 1.8, 0.8); g.strokeStyle = '#8a5a30'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-18, y - 2); g.lineTo(10, y - 2); g.moveTo(-18, y + 2.4); g.lineTo(4, y + 2.4); g.stroke(); }
    g.fillStyle = '#5a3a3a'; for (const [x, y] of [[0, -48], [0, -26]]) { circ(g, x, y, 0.9); g.fill(); }
    g.fillStyle = '#5fae4c'; for (const [x, a] of [[-6, -0.5], [-3, -0.15], [3, 0.2], [6, 0.5]]) { g.save(); g.translate(x, 1); g.rotate(a); g.beginPath(); g.ellipse(0, -4, 1.6, 4.5, 0, 0, TAU); g.fill(); g.restore(); }
  },
  campfire(g) {
    bSeed(2);
    softShadow(g, 2, 2, 28, 8, 0.25);
    g.fillStyle = '#4a3448'; ell(g, 0, -2, 18, 6); g.fill(); g.fillStyle = '#6a5068'; ell(g, -2, -3, 12, 3.6); g.fill();
    // crossed logs
    for (const [a, c] of [[0.35, '#8a5a3c'], [-0.35, '#9a6a45']]) {
      g.save(); g.translate(0, -5); g.rotate(a);
      const lg = () => rrect(g, -17, -3.6, 34, 7.2, 3.6);
      inkSil(g, [lg], 0.7); fillP(g, lg, c); g.fillStyle = lightTone(c, 0.3); g.fillRect(-15, -3, 30, 1.6);
      g.fillStyle = '#e8c08a'; ell(g, 16, 0, 2.6, 3.4); g.fill(); g.strokeStyle = '#b08050'; g.lineWidth = 0.6; ell(g, 16, 0, 1.2, 1.8); g.stroke();
      g.restore();
    }
    // the ring of stones, front ones last
    const stones = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.2; stones.push([Math.cos(a) * 22, Math.sin(a) * 7.5 - 2, bR(4.2, 5.8)]); }
    stones.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of stones) { const f = () => g.ellipse(x, y, r * 1.15, r * 0.85, 0, 0, TAU); inkSil(g, [f], 0.75); fillP(g, f, '#a7a8b8'); celBand(g, f, '#7f7f98', -2, -2); celBand(g, f, '#d8d8e6', 1.4, 1.6, 0.8); }
  },
  boat(g) {
    bSeed(31);
    const hull = () => { g.moveTo(-80, -34); g.lineTo(78, -34); g.quadraticCurveTo(72, 2, 40, 8); g.lineTo(-46, 8); g.quadraticCurveTo(-76, 4, -80, -34); g.closePath(); };
    const mast = () => g.rect(-3, -126, 6, 96);
    const sail = () => { g.moveTo(5, -120); g.quadraticCurveTo(58, -94, 52, -44); g.lineTo(5, -44); g.closePath(); };
    const jib = () => { g.moveTo(-5, -116); g.lineTo(-5, -44); g.quadraticCurveTo(-40, -52, -56, -40); g.closePath(); };
    inkSil(g, [hull, mast, sail, jib]);
    fillP(g, hull, '#b06a45');
    clipP(g, hull, () => {
      for (let y = -34, i = 0; y < 10; y += 7, i++) { const c0 = mix('#b06a45', i & 1 ? '#fff0d0' : '#4a3070', 0.08); g.fillStyle = c0; g.fillRect(-82, y, 164, 7); g.fillStyle = shadeTone(c0, 0.38); g.fillRect(-82, y + 5.6, 164, 1.4); }
      g.fillStyle = '#4f6fc9'; g.fillRect(-82, -24, 164, 6); g.fillStyle = '#7f9fe8'; g.fillRect(-82, -24, 164, 1.4);
      g.fillStyle = shadeTone('#b06a45', 0.35); g.globalAlpha = 0.55; g.beginPath(); g.moveTo(-90, 4); g.quadraticCurveTo(0, -10, 90, -8); g.lineTo(90, 12); g.lineTo(-90, 12); g.fill(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-82, -34, 164, 3);
    });
    // the deck seen from above and a fat rail
    g.fillStyle = OUT; g.beginPath(); rrect(g, -82, -40, 164, 9, 4); g.fill(); g.fillStyle = '#fff6e6'; g.beginPath(); rrect(g, -80.6, -38.8, 161.2, 6.6, 3); g.fill(); g.fillStyle = '#d8cbb8'; g.fillRect(-79, -34.6, 158, 1.6);
    for (const x of [-60, -30, 30, 60]) { g.fillStyle = '#2d3e78'; circ(g, x, -14, 3.4); g.fill(); g.strokeStyle = '#c4a060'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#9fe0f5'; circ(g, x - 0.8, -14.8, 1.2); g.fill(); }
    fillP(g, mast, '#8a5a34'); g.fillStyle = '#b8864f'; g.fillRect(-2, -126, 1.4, 92);
    for (const [f, k] of [[sail, 1], [jib, -1]]) {
      fillP(g, f, '#fff6e0');
      clipP(g, f, () => { g.fillStyle = '#e8dcc0'; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(k * 5, -120); g.quadraticCurveTo(k * 30, -80, k * 24, -44); g.lineTo(k * 60, -44); g.lineTo(k * 60, -120); g.fill(); g.globalAlpha = 1; g.strokeStyle = '#e0d0b0'; g.lineWidth = 0.8; for (let y = -104; y < -44; y += 14) { g.beginPath(); g.moveTo(k * 5, y); g.lineTo(k * 60, y + 4); g.stroke(); } });
    }
    drawPaw(g, 24, -78, 9, '#4f6fc9');
    g.fillStyle = OUT; g.fillRect(-6, -46, 62, 3.4); g.fillStyle = '#8a5a34'; g.fillRect(-5, -45.4, 60, 2.2);
    g.strokeStyle = '#8a7a6a'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, -126); g.lineTo(-78, -38); g.moveTo(0, -126); g.lineTo(76, -38); g.stroke();
  },
  oak(g) { drawOak(g); },
  grotto(g) { drawGrotto(g); },
  icecave(g) { drawIceCave(g); },
  purramid(g) { drawPurramid(g); },
  keep(g) { drawKeep(g); },
  burrow(g, v) { drawBurrow(g, v); },
  kennel(g, v, opt) { drawKennel(g, !!opt.spooky); },
};

function snowDrifts(g, list) {
  for (const [x, y, r] of list) { g.fillStyle = '#b9cdea'; g.beginPath(); g.ellipse(x + 1.5, y + 0.5, r, r * 0.4, 0, Math.PI, 0); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, r * 0.95, r * 0.36, 0, Math.PI, 0); g.fill(); }
}
function star5(g, x, y, r, col, ink) {
  const f = () => { for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  if (ink) inkSil(g, [f], 0.6);
  fillP(g, f, col);
  g.fillStyle = lightTone(col, 0.6); circ(g, x - r * 0.2, y - r * 0.2, r * 0.22); g.fill();
}
function anvil(g, x, y) {
  g.save(); g.translate(x, y);
  softShadow(g, 2, 0, 16, 4, 0.35);
  const f = () => { g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(6, -6); g.lineTo(5, -10); g.lineTo(14, -12); g.lineTo(16, -16); g.lineTo(-12, -16); g.quadraticCurveTo(-20, -16, -22, -12); g.lineTo(-6, -10); g.lineTo(-6, -6); g.closePath(); };
  part(g, f, '#6a6a80', { s: 2.4 });
  g.fillStyle = '#c8c8dc'; g.fillRect(-11, -16, 25, 1.4);
  g.restore();
}
function swordShape(g) {
  const f = () => { g.moveTo(-1.6, -6); g.lineTo(-1.6, -34); g.lineTo(0, -38); g.lineTo(1.6, -34); g.lineTo(1.6, -6); g.closePath(); }, h = () => { g.rect(-5, -7, 10, 2.6); g.rect(-1.2, -5, 2.4, 6); };
  inkSil(g, [f, h], 0.6); fillP(g, f, '#d8dcec'); g.fillStyle = '#ffffff'; g.fillRect(-1, -34, 0.9, 27); fillP(g, h, '#a8703f'); g.fillStyle = GOLD; circ(g, 0, 1.2, 1.4); g.fill();
}
function jackLantern(g, x, y) {
  g.save(); g.translate(x, y);
  softShadow(g, 2, 0, 10, 3, 0.3);
  const f = () => { g.ellipse(-4, -7, 6, 7, 0, 0, TAU); g.ellipse(4, -7, 6, 7, 0, 0, TAU); g.ellipse(0, -7.4, 6.5, 7.6, 0, 0, TAU); };
  inkSil(g, [f], 0.7); fillP(g, f, '#f08a2a'); celBand(g, f, '#c4621a', -2, -2);
  g.fillStyle = '#ffe36a'; g.beginPath(); g.moveTo(-5, -9); g.lineTo(-2, -9); g.lineTo(-3.5, -11.5); g.fill(); g.beginPath(); g.moveTo(2, -9); g.lineTo(5, -9); g.lineTo(3.5, -11.5); g.fill(); g.beginPath(); g.moveTo(-4.5, -5.5); g.lineTo(4.5, -5.5); g.lineTo(2.5, -3.2); g.lineTo(0, -4.4); g.lineTo(-2.5, -3.2); g.closePath(); g.fill();
  g.fillStyle = '#5b8a3a'; g.fillRect(-1, -16, 2.4, 3.4);
  g.restore();
}

function drawPaw(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.62, r * 0.5, 0, 0, TAU); g.fill();
  for (const [dx, dy] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) { circ(g, x + dx * r, y + dy * r, r * 0.24); g.fill(); }
}
function drawFishBone(g, x, y, r) {
  g.strokeStyle = '#fff6e0'; g.lineWidth = r * 0.22;
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r * 0.7, y); g.stroke();
  for (let i = -2; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * r * 0.35, y - r * 0.45); g.lineTo(x + i * r * 0.35, y + r * 0.45); g.stroke(); }
  g.fillStyle = '#fff6e0'; g.beginPath(); g.moveTo(x + r * 0.6, y); g.lineTo(x + r * 1.15, y - r * 0.4); g.lineTo(x + r * 1.15, y + r * 0.4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 1.4, y - r * 0.4); g.lineTo(x - r * 1.4, y + r * 0.4); g.closePath(); g.fill();
}

function bldSprite(b) {
  const d = BLD[b.bk];
  return sprite('b:' + b.bk + ':' + b.v + ':' + (b.opt.snow ? 1 : 0) + (b.opt.spooky ? 1 : 0) + (b.opt.label || ''), d.w, d.h, d.ox, d.oy, (g) => BldArt[b.bk](g, b.v, b.opt));
}

// town layouts: [kind, dx, dy, variant, extra]
const TOWN_LAYOUT = {
  waggington: [['inn', -175, -95], ['trainer', 175, -105, 0, { svc: 'trainer' }], ['house', -30, -205, 1, { home: 'barkley' }], ['house', 195, 215, 2], ['house', -205, 110, 3], ['house', 215, 95, 4],
    ['board', 50, -20], ['well', -55, 45], ['lamp', -95, -10], ['lamp', 120, 20], ['stall', 0, 210, 1]],
  barkingham: [['castle', 0, -215, 0, { svc: 'castle' }], ['fountain', 0, 70], ['inn', -275, -40], ['smith', 275, -40, 0, { svc: 'smith' }], ['trainer', -250, 205, 0, { svc: 'trainer' }],
    ['board', 105, 150], ['house', 245, 215, 1], ['house', -40, 300, 2], ['house', 150, 320, 3], ['stall', -120, 150, 0], ['stall', 190, 80, 2], ['lamp', -80, 50], ['lamp', 80, 30], ['lamp', -170, 260]],
  fetchwick: [['inn', -170, -120], ['smith', 140, -150, 0, { svc: 'smith' }], ['trainer', -215, 115, 0, { svc: 'trainer' }], ['board', 30, 30], ['house', 190, 110, 1], ['house', -10, -230, 3], ['house', 40, 210, 4],
    ['stall', -60, 130, 0], ['lamp', -60, -40], ['lamp', 100, -20]],
  frostpaw: [['inn', -140, -70, 0, { snow: 1 }], ['trainer', 140, -90, 0, { svc: 'trainer', snow: 1 }], ['smith', 10, -190, 0, { svc: 'smith', snow: 1 }], ['board', 0, 50], ['house', -160, 130, 1, { snow: 1 }], ['house', 165, 120, 2, { snow: 1 }], ['lamp', -40, -20], ['lamp', 60, 100]],
  dunehound: [['inn', -150, -90], ['smith', 150, -90, 0, { svc: 'smith' }], ['trainer', -135, 130, 0, { svc: 'trainer' }], ['board', 60, 40], ['house', 165, 130, 3], ['stall', 0, -150, 2], ['well', -20, 70]],
  howlow: [['hut', -120, -50, 0, { label: 'INN', inn: 1 }], ['hut', 125, -70, 1], ['board', 0, 60], ['hut', 105, 120, 2], ['lamp', -40, 10]],
  camp: [['tent', -70, -50, 0], ['tent', 75, -30, 1], ['campfire', 0, 30], ['board', -40, 90]],
  landing: [['sign', 40, -60]],
};
const INN_KINDS = { inn: 1 };

// where the roads leave each town, so no house sits on one
function roadExits(T) {
  const out = [];
  for (const poly of World.roadPolys) for (const end of [0, 1]) {
    const pts = end ? poly.slice().reverse() : poly;
    if (dist(pts[0][0], pts[0][1], T.x, T.y) > 30) continue;
    const q = pts.find((p) => dist(p[0], p[1], T.x, T.y) > T.r * 0.55) || pts[pts.length - 1];
    out.push(angTo(T.x, T.y, q[0], q[1]));
  }
  // roads that pass through a town on their way somewhere
  for (const poly of World.roadPolys) for (let i = 1; i < poly.length - 1; i++) {
    const p = poly[i];
    if (dist(p[0], p[1], T.x, T.y) < T.r * 0.3) { const a = poly[Math.max(0, i - 3)], b = poly[Math.min(poly.length - 1, i + 3)]; out.push(angTo(T.x, T.y, a[0], a[1]), angTo(T.x, T.y, b[0], b[1])); }
  }
  return out;
}
// which look a small dungeon's entrance takes (art only)
const DUNGEON_LOOK = { b_bunny: 0, b_mole: 1, b_crab: 2, b_sand: 3 };
World.buildTowns = function () {
  this.blds = [];
  this.inters = [];
  for (const id in TOWN_LAYOUT) {
    const T = TOWNS[id], exits = roadExits(T);
    for (const [kind, dx0, dy0, v, extra] of TOWN_LAYOUT[id]) {
      let dx = dx0, dy = dy0;
      // swing a building around the town centre until it is off the road
      const big = kind !== 'lamp' && kind !== 'sign' && BLD[kind] ? BLD[kind].foot[0] : 0;
      if (big && kind !== 'castle') {
        const d = Math.hypot(dx, dy);
        for (let k = 0; k < 3; k++) {
          const a = Math.atan2(dy, dx), need = Math.atan((big / 2 + 36) / Math.max(60, d));
          const e = exits.find((ex) => Math.abs(angDiff(ex, a)) < need);
          if (e == null) break;
          const na = e + (angDiff(e, a) >= 0 ? need + 0.05 : -need - 0.05);
          dx = Math.cos(na) * d; dy = Math.sin(na) * d;
        }
      }
      const x = T.x + dx, y = T.y + dy, opt = Object.assign({}, extra || {});
      if (T.biome === 'snow') opt.snow = 1;
      if (kind === 'lamp') { this.addProp(propAt('lamp', x, y)); continue; }
      const d = BLD[kind];
      const b = { kind: 'bld', bk: kind, x, y, v: v || 0, opt, town: id, r: 0 };
      if (d.foot[0]) b.box = [x - d.foot[0] / 2, y - d.foot[1], d.foot[0], d.foot[1]];
      this.addProp(b); this.blds.push(b);
      let svc = opt.svc || (kind === 'inn' || opt.inn ? 'inn' : kind === 'board' ? 'board' : kind === 'tent' && v === 0 ? 'inn' : null);
      if (svc) this.inters.push({ kind: svc, x, y: y + 14, r: kind === 'castle' ? 70 : 54, town: id, b });
      if (kind === 'sign' || kind === 'well' || kind === 'fountain' || kind === 'campfire') this.inters.push({ kind: 'sign', x, y: y + 10, r: 46, town: id, b, sub: kind });
    }
    // a welcome sign on the road into town
    this.inters.push({ kind: 'townname', x: T.x, y: T.y, r: T.r * 0.7, town: id });
  }
  // the docks at Fetchwick and Mittens Landing: find the shore nearest the right direction
  const shore = (x, y, dx, dy) => { let px = x, py = y; for (let i = 0; i < 120 && this.Fat(px, py) > 0.02; i++) { px += dx * 12; py += dy * 12; } return { x: px, y: py }; };
  const fw = shore(TOWNS.fetchwick.x, TOWNS.fetchwick.y + 40, 1, 0.08);
  this.dock = { x: fw.x - 30, y: fw.y, to: 'isle' };
  const ld = shore(TOWNS.landing.x + 40, TOWNS.landing.y, -1, 0);
  this.dock2 = { x: ld.x + 30, y: ld.y, to: 'main' };
  for (const dk of [this.dock, this.dock2]) {
    for (const g of this.grid) for (let i = g.length - 1; i >= 0; i--) { const q = g[i]; if (q.kind !== 'bld' && dist(q.x, q.y, dk.x, dk.y) < 170) { g.splice(i, 1); q.gone = true; } }
    const b = { kind: 'bld', bk: 'boat', x: dk.x + (dk.to === 'isle' ? 120 : -120), y: dk.y + 40, v: 0, opt: {}, r: 0, dockOf: dk };
    this.addProp(b); this.blds.push(b);
    this.inters.push({ kind: 'dock', x: dk.x + (dk.to === 'isle' ? -50 : 50), y: dk.y + 20, r: 80, dock: dk });
  }
  // dungeon entrances
  for (const id in DUNGEON_SPOTS) {
    const s = DUNGEON_SPOTS[id], d = BLD[s.art];
    const b = { kind: 'bld', bk: s.art, x: s.x, y: s.y, v: DUNGEON_LOOK[id] || 0, opt: { spooky: id === 'b_haunt' }, r: 0, dungeon: id };
    b.box = [s.x - d.foot[0] / 2, s.y - d.foot[1], d.foot[0], d.foot[1]];
    this.addProp(b); this.blds.push(b);
    this.inters.push({ kind: 'dungeon', id, x: s.x, y: s.y + 16, r: 64, b });
  }
};


// ---------- castles: round towers, cone roofs, battlements, a grand gate
function towerBody(g, x, w, yTop, yBot, col, o) {
  o = o || {};
  const f = () => { g.moveTo(x - w / 2, yTop); g.lineTo(x - w / 2, yBot - 3); g.quadraticCurveTo(x, yBot + 5, x + w / 2, yBot - 3); g.lineTo(x + w / 2, yTop); g.closePath(); };
  return {
    f,
    paint() {
      clipP(g, f, () => {
        stonesIn(g, x - w / 2, yTop, w, yBot - yTop + 6, col, o.sz || 9);
        g.fillStyle = lightTone(col, 0.45); g.globalAlpha = 0.35; g.fillRect(x - w * 0.36, yTop, w * 0.14, yBot - yTop + 6);
        g.fillStyle = shadeTone(col, 0.3); g.globalAlpha = 0.5; g.fillRect(x + w * 0.16, yTop, w * 0.4, yBot - yTop + 6);
        g.fillStyle = shadeTone(col, 0.45); g.globalAlpha = 0.4; g.fillRect(x + w * 0.36, yTop, w * 0.2, yBot - yTop + 6);
        g.globalAlpha = 1;
        if (o.ao !== false) aoFoot(g, x - w / 2, yBot + 5, w, 18);
        eaveShade(g, x - w / 2, yTop, w, 9);
      });
    },
  };
}
function coneRoof(g, x, r, yb, h, col, o) {
  o = o || {};
  const tip = yb - h, dip = r * 0.26, T = tones(col);
  const f = () => { g.moveTo(x - r, yb); g.quadraticCurveTo(x - r * 0.42, yb - h * 0.42, x, tip); g.quadraticCurveTo(x + r * 0.42, yb - h * 0.42, x + r, yb); g.quadraticCurveTo(x, yb + dip * 2, x - r, yb); g.closePath(); };
  const fas = () => { g.moveTo(x - r, yb); g.quadraticCurveTo(x, yb + dip * 2, x + r, yb); g.lineTo(x + r, yb + 4.5); g.quadraticCurveTo(x, yb + dip * 2 + 4.5, x - r, yb + 4.5); g.closePath(); };
  const pole = () => g.rect(x - 1.6, tip - 28, 3.2, 28);
  return {
    sils: o.pole === false ? [f, fas] : [f, fas, pole], x, tip,
    paint() {
      if (o.pole !== false) { fillP(g, pole, '#8a6a50'); g.fillStyle = '#c4a07a'; g.fillRect(x - 1, tip - 28, 0.9, 28); }
      fillP(g, fas, T.sh2);
      fillP(g, f, col);
      clipP(g, f, () => {
        const rows = Math.round(h / 11), tw0 = o.tile || 12, rh = h / rows;
        for (let k = 0; k < rows; k++) {
          const t = k / rows, yb2 = yb - t * h * 0.98, half = r * (1 - t) + 6, tw = Math.max(5, tw0 * (1 - t * 0.6)), sag = dip * (1 - t);
          for (let pass = 0; pass < 2; pass++) for (let xx = x - half - (k & 1) * tw / 2; xx < x + half; xx += tw) {
            const u = clamp((xx + tw / 2 - x) / (r * (1 - t) + 0.01), -1, 1), yy = yb2 + sag * (1 - u * u) + (pass ? 0 : 2);
            const c0 = pass ? mix(col, (k + Math.round(xx / tw)) % 3 ? '#fff4d8' : '#4a3070', bR(0, 0.1)) : T.sh2;
            g.fillStyle = c0; g.beginPath(); g.moveTo(xx, yy - rh - 3); g.lineTo(xx, yy - 3); g.quadraticCurveTo(xx, yy, xx + tw / 2, yy); g.quadraticCurveTo(xx + tw, yy, xx + tw, yy - 3); g.lineTo(xx + tw, yy - rh - 3); g.closePath(); g.fill();
          }
        }
        g.fillStyle = T.hi; g.globalAlpha = 0.4; g.beginPath(); g.moveTo(x, tip); g.quadraticCurveTo(x - r * 0.42, yb - h * 0.42, x - r, yb); g.lineTo(x - r * 0.55, yb + dip); g.quadraticCurveTo(x - r * 0.2, yb - h * 0.4, x, tip); g.fill();
        g.fillStyle = T.sh2; g.globalAlpha = 0.45; g.beginPath(); g.moveTo(x, tip); g.quadraticCurveTo(x + r * 0.15, yb - h * 0.4, x + r * 0.3, yb + dip * 2); g.lineTo(x + r + 2, yb + 4); g.lineTo(x + r, yb); g.quadraticCurveTo(x + r * 0.42, yb - h * 0.42, x, tip); g.fill();
        g.globalAlpha = 1;
      });
      g.fillStyle = OUT; circ(g, x, tip - 1, 3.4); g.fill(); g.fillStyle = GOLD; circ(g, x - 0.3, tip - 1.3, 2.4); g.fill();
    },
  };
}
// a roof shaped like two cat ears (Clawhold Keep)
function catEarRoof(g, x, r, yb, h, col) {
  const T = tones(col);
  const f = () => { g.moveTo(x - r, yb); g.lineTo(x - r * 0.8, yb - h); g.quadraticCurveTo(x - r * 0.4, yb - h * 0.66, x, yb - h * 0.5); g.quadraticCurveTo(x + r * 0.4, yb - h * 0.66, x + r * 0.8, yb - h); g.lineTo(x + r, yb); g.quadraticCurveTo(x, yb + r * 0.5, x - r, yb); g.closePath(); };
  return {
    sils: [f],
    paint() {
      fillP(g, f, col);
      clipP(g, f, () => {
        g.strokeStyle = T.sh2; g.lineWidth = 1.1; for (let k = 1; k < 7; k++) { const yy = yb - k * h * 0.12; g.beginPath(); g.moveTo(x - r - 4, yy + 2); g.quadraticCurveTo(x, yy + r * 0.3 * (1 - k / 7) + 4, x + r + 4, yy + 2); g.stroke(); }
        for (const s of [-1, 1]) { g.fillStyle = OUT; g.beginPath(); g.moveTo(x + s * r * 0.76, yb - h * 0.9); g.lineTo(x + s * r * 0.62, yb - h * 0.42); g.lineTo(x + s * r * 0.3, yb - h * 0.55); g.closePath(); g.fill(); g.fillStyle = '#c86aa8'; g.beginPath(); g.moveTo(x + s * r * 0.75, yb - h * 0.84); g.lineTo(x + s * r * 0.63, yb - h * 0.46); g.lineTo(x + s * r * 0.35, yb - h * 0.56); g.closePath(); g.fill(); }
        g.fillStyle = T.hi; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(x - r, yb); g.lineTo(x - r * 0.8, yb - h); g.lineTo(x - r * 0.6, yb - h * 0.4); g.lineTo(x - r * 0.5, yb + 8); g.closePath(); g.fill();
        g.fillStyle = T.sh2; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x + r * 0.3, yb - h); g.lineTo(x + r + 4, yb - h); g.lineTo(x + r + 4, yb + r); g.lineTo(x + r * 0.35, yb + r); g.closePath(); g.fill();
        g.globalAlpha = 1;
        g.fillStyle = T.sh2; g.fillRect(x - r - 2, yb + r * 0.1, r * 2 + 4, 6);
      });
    },
  };
}
function merlonsP(g, x0, x1, y, mw, mh, gap, spiky) {
  return () => { for (let x = x0; x < x1 - 1; x += mw + gap) { const w = Math.min(mw, x1 - x); if (spiky) { g.moveTo(x, y); g.lineTo(x, y - mh * 0.6); g.lineTo(x + w / 2, y - mh); g.lineTo(x + w, y - mh * 0.6); g.lineTo(x + w, y); g.closePath(); } else g.rect(x, y - mh, w, mh); } };
}
function paintMerlons(g, x0, x1, y, mw, mh, gap, col, spiky) {
  const f = merlonsP(g, x0, x1, y, mw, mh, gap, spiky);
  fillP(g, f, col);
  clipP(g, f, () => {
    for (let x = x0; x < x1 - 1; x += mw + gap) { const w = Math.min(mw, x1 - x); g.fillStyle = lightTone(col, 0.45); g.fillRect(x, y - mh, w, spiky ? mh * 0.5 : 2.6); g.fillStyle = shadeTone(col, 0.32); g.fillRect(x + w * 0.62, y - mh + (spiky ? 0 : 2.6), w * 0.38, mh); g.fillStyle = shadeTone(col, 0.2); g.fillRect(x, y - mh * 0.45, w, 1); }
  });
}
// an arched gateway: stone voussoirs, a deep passage, raised portcullis teeth, doors swung open
function bigGate(g, gw, gc, o) {
  o = o || {};
  const op = (p) => { g.beginPath(); g.moveTo(-gw - p, 0); g.lineTo(-gw - p, gc); g.arc(0, gc, gw + p, Math.PI, 0); g.lineTo(gw + p, 0); g.closePath(); };
  const fr = o.frame || '#e4d8c2';
  op(13.4); g.fillStyle = OUT; g.fill();
  op(12); g.fillStyle = fr; g.fill();
  g.save(); op(12); g.clip();
  g.strokeStyle = shadeTone(fr, 0.35); g.lineWidth = 1.2;
  for (let i = 0; i <= 9; i++) { const a = Math.PI + (i / 9) * Math.PI; g.beginPath(); g.moveTo(Math.cos(a) * gw, gc + Math.sin(a) * gw); g.lineTo(Math.cos(a) * (gw + 12), gc + Math.sin(a) * (gw + 12)); g.stroke(); }
  for (let yy = gc + 10; yy < 0; yy += 11) { g.beginPath(); g.moveTo(-gw - 12, yy); g.lineTo(-gw, yy); g.moveTo(gw, yy - 5); g.lineTo(gw + 12, yy - 5); g.stroke(); }
  g.fillStyle = shadeTone(fr, 0.3); g.globalAlpha = 0.5; g.fillRect(gw * 0.35, gc - gw - 14, gw * 2, -gc + gw + 20); g.globalAlpha = 1;
  g.restore();
  // the keystone
  const ks = () => { g.moveTo(-7, gc - gw - 14); g.lineTo(7, gc - gw - 14); g.lineTo(5, gc - gw + 1); g.lineTo(-5, gc - gw + 1); g.closePath(); };
  inkSil(g, [ks], 0.7); fillP(g, ks, lightTone(fr, 0.15)); celBand(g, ks, shadeTone(fr, 0.25), -2, -2);
  if (o.keyIcon) o.keyIcon(0, gc - gw - 6);
  op(1.2); g.fillStyle = OUT; g.fill();
  op(0);
  const gr = g.createLinearGradient(0, gc - gw, 0, 0); gr.addColorStop(0, o.deep || '#1e1230'); gr.addColorStop(1, o.deep2 || '#40284a'); g.fillStyle = gr; g.fill();
  g.save(); op(0); g.clip();
  if (o.light) { g.fillStyle = o.light; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(-gw * 0.4, 0); g.lineTo(-gw * 0.4, gc + 10); g.arc(0, gc + 10, gw * 0.4, Math.PI, 0); g.lineTo(gw * 0.4, 0); g.fill(); g.globalAlpha = 1; }
  // the open doors against the passage walls
  if (o.doors) for (const s of [-1, 1]) { g.fillStyle = o.doors; g.beginPath(); g.moveTo(s * gw, 2); g.lineTo(s * gw, gc + 4); g.lineTo(s * (gw - 13), gc + 14); g.lineTo(s * (gw - 13), -4); g.closePath(); g.fill(); g.strokeStyle = shadeTone(o.doors, 0.4); g.lineWidth = 1; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(s * (gw - k * 4.3), 0); g.lineTo(s * (gw - k * 4.3), gc + 4 + k * 3.3); g.stroke(); } g.fillStyle = IRON; g.fillRect(s > 0 ? gw - 13 : -gw, gc + 22, 13, 2.4); g.fillRect(s > 0 ? gw - 13 : -gw, -18, 13, 2.4); }
  // portcullis teeth hanging from the top
  const pt = gc - gw * 0.35;
  g.fillStyle = OUT; g.fillRect(-gw, gc - gw, gw * 2, pt - (gc - gw) + 2);
  g.strokeStyle = o.bars || '#4a4458'; g.lineWidth = 3;
  for (let x = -gw + 6; x < gw; x += 9) { g.beginPath(); g.moveTo(x, gc - gw); g.lineTo(x, pt); g.stroke(); g.fillStyle = o.teeth || '#8f8aa8'; g.beginPath(); g.moveTo(x - 2.4, pt); g.lineTo(x, pt + 7); g.lineTo(x + 2.4, pt); g.closePath(); g.fill(); }
  g.lineWidth = 2.4; for (const yy of [pt - 8, pt - 17]) { g.beginPath(); g.moveTo(-gw, yy); g.lineTo(gw, yy); g.stroke(); }
  g.strokeStyle = '#8f8aa8'; g.lineWidth = 0.8; for (let x = -gw + 6; x < gw; x += 9) { g.beginPath(); g.moveTo(x - 0.8, gc - gw); g.lineTo(x - 0.8, pt); g.stroke(); }
  g.fillStyle = 'rgba(20,8,30,0.45)'; g.beginPath(); g.rect(-gw * 2, gc - gw * 2, gw * 4, -gc + gw * 3); g.translate(3, 4); op(0); g.fill('evenodd');
  g.restore();
}
function crestShield(g, x, y, s, col, icon) {
  const f = () => { g.moveTo(x - 13 * s, y - 14 * s); g.lineTo(x + 13 * s, y - 14 * s); g.lineTo(x + 13 * s, y); g.quadraticCurveTo(x + 13 * s, y + 11 * s, x, y + 17 * s); g.quadraticCurveTo(x - 13 * s, y + 11 * s, x - 13 * s, y); g.closePath(); };
  inkSil(g, [f], 0.9); fillP(g, f, GOLD);
  g.save(); g.translate(x, y); g.scale(0.82, 0.82); g.translate(-x, -y + 0.6 * s); fillP(g, f, col); g.restore();
  celBand(g, f, shadeTone(col, 0.3), -3, -3, 0.5);
  if (icon) icon(x, y + 1 * s);
}
function hedge(g, x0, x1, y, flowers) {
  const cs = [];
  for (let x = x0; x <= x1; x += 13) cs.push([x, y - 7 - bR(0, 3), bR(8, 10)]);
  inkSil(g, cs.map(([x, yy, r]) => () => g.arc(x, yy, r, 0, TAU)));
  for (const [x, yy, r] of cs) { g.fillStyle = '#4c9a43'; circ(g, x, yy, r); g.fill(); }
  for (const [x, yy, r] of cs) { g.fillStyle = '#6cbf55'; circ(g, x - r * 0.3, yy - r * 0.35, r * 0.5); g.fill(); }
  g.fillStyle = 'rgba(40,70,40,0.45)'; for (const [x, yy, r] of cs) { g.beginPath(); g.arc(x + 1, yy + 1, r, 0.2, 1.6); g.lineTo(x, yy); g.fill(); }
  if (flowers) for (const [x, yy] of cs) { const c0 = flowers[(x | 0) % flowers.length]; g.fillStyle = c0; circ(g, x + bR(-4, 4), yy + bR(-5, 2), 1.8); g.fill(); circ(g, x + bR(-4, 4), yy + bR(-5, 2), 1.5); g.fill(); }
}
function archWin(g, x, y, w, h, o) { bWin(g, x, y, w, h, Object.assign({ arch: true, noSill: false }, o || {})); }

// where the castles' live bits go (flags, banners, torches)
const CASTLE = { inner: [-84, 84], outer: [-196, 196], innerTip: -386, outerTip: -314, banners: [-108, 108], torches: [-54, 54] };
function drawCastle(g) {
  bSeed(101);
  const st = '#f1e8d4', stB = '#ddd3c4', rf = '#d9534f', rfB = '#4f6fc9';
  bGround(g, 236, 36);
  const hall = () => g.rect(-118, -252, 236, 140);
  const HR = hipRoof(g, 0, -246, 128, -302, 84, rfB, { rowH: 12, tile: 15, sag: 6 });
  const iT = CASTLE.inner.map((x) => towerBody(g, x, 58, -300, -120, stB, { sz: 12 }));
  const iC = CASTLE.inner.map((x) => coneRoof(g, x, 42, -300, 86, rf));
  const oT = CASTLE.outer.map((x) => towerBody(g, x, 78, -214, 0, st, { sz: 13 }));
  const oC = CASTLE.outer.map((x) => coneRoof(g, x, 54, -214, 100, rf));
  const wall = () => g.rect(-160, -128, 320, 128), wallM = merlonsP(g, -160, 160, -128, 15, 14, 11);
  const gate = () => g.rect(-62, -196, 124, 196), gateM = merlonsP(g, -62, 62, -196, 14, 15, 8.6);
  const step1 = () => rrect(g, -58, -2, 116, 8, 3), step2 = () => rrect(g, -68, 4, 136, 8, 3);
  inkSil(g, [hall, ...HR.sils, ...iT.map((t) => t.f), ...iC.flatMap((c) => c.sils), wall, wallM, gate, gateM, ...oT.map((t) => t.f), ...oC.flatMap((c) => c.sils), step1, step2]);
  // the great hall behind, a touch cooler and darker: it is further away
  bWall(g, -118, -252, 236, 140, stB, 'stone', { sz: 13, ao: 4 });
  bWin(g, 0, -222, 26, 26, { round: true, frame: '#8a7a6a', noBars: true, glow1: '#fff4d0', glow2: '#e89a4a' });
  g.save(); g.translate(0, -222); for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillStyle = '#8a7a6a'; g.fillRect(-0.8, 0, 1.6, 13); } g.fillStyle = '#8a7a6a'; circ(g, 0, 0, 4.4); g.fill(); drawPaw(g, 0, 0, 3.2, GOLD); g.restore();
  for (const x of [-36, 36]) archWin(g, x, -220, 12, 22, { frame: '#8a7a6a' });
  HR.paint();
  for (const t of iT) t.paint();
  for (const x of CASTLE.inner) archWin(g, x, -262, 13, 22, { frame: '#8a7a6a' });
  for (const c of iC) c.paint();
  // the curtain wall: a walkway behind its battlements, banners, flowers along the foot
  bWall(g, -160, -128, 320, 128, st, 'stone', { sz: 14, eave: false, ao: 18 });
  g.fillStyle = lightTone(st, 0.4); g.fillRect(-160, -129, 320, 3);
  paintMerlons(g, -160, 160, -128, 15, 14, 11, st);
  for (const x of CASTLE.banners) { g.fillStyle = OUT; g.beginPath(); rrect(g, x - 17, -122, 34, 5, 2.5); g.fill(); g.fillStyle = '#8a6a50'; g.beginPath(); rrect(g, x - 16, -121.2, 32, 3.4, 1.7); g.fill(); for (const s of [-1, 1]) { g.fillStyle = OUT; circ(g, x + s * 17, -119.5, 3); g.fill(); g.fillStyle = GOLD; circ(g, x + s * 17, -119.8, 2.1); g.fill(); } }
  for (const x of [-130, 130]) archWin(g, x, -64, 11, 18, { frame: '#8a7a6a' });
  // the gatehouse stands proud of the wall
  inkSil(g, [gate, gateM], 0.9);
  bWall(g, -62, -196, 124, 196, lightTone(st, 0.1), 'stone', { sz: 14, eave: false, ao: 20 });
  g.fillStyle = lightTone(st, 0.5); g.fillRect(-62, -197, 124, 3);
  paintMerlons(g, -62, 62, -196, 14, 15, 8.6, lightTone(st, 0.1));
  g.save(); g.translate(0, 0);
  bigGate(g, 36, -66, { light: '#fff0b8', doors: '#8a5a3c', keyIcon: (x, y) => drawPaw(g, x, y, 4, '#b8a888') });
  g.restore();
  crestShield(g, 0, -150, 1.1, '#4f6fc9', (x, y) => drawPaw(g, x, y, 7, GOLD));
  g.fillStyle = OUT; g.beginPath(); g.moveTo(-10, -167); g.lineTo(-10, -177); g.lineTo(-5, -172); g.lineTo(0, -180); g.lineTo(5, -172); g.lineTo(10, -177); g.lineTo(10, -167); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(-8.6, -168); g.lineTo(-8.6, -174.4); g.lineTo(-5, -170.6); g.lineTo(0, -177.6); g.lineTo(5, -170.6); g.lineTo(8.6, -174.4); g.lineTo(8.6, -168); g.closePath(); g.fill();
  for (const x of [-44, 44]) { g.fillStyle = OUT; g.beginPath(); rrect(g, x - 3, -168, 6, 18, 3); g.fill(); g.fillStyle = '#2a1830'; g.beginPath(); rrect(g, x - 1.8, -166.8, 3.6, 15.6, 1.8); g.fill(); }
  for (const x of CASTLE.torches) { g.fillStyle = IRON; g.fillRect(x - 1.6, -62, 3.2, 14); g.fillStyle = OUT; g.beginPath(); g.moveTo(x - 5, -66); g.lineTo(x + 5, -66); g.lineTo(x + 3, -60); g.lineTo(x - 3, -60); g.closePath(); g.fill(); g.fillStyle = '#6a6480'; g.fillRect(x - 3.4, -65, 6.8, 3); }
  // the big corner towers in front
  for (const t of oT) { inkSil(g, [t.f], 0.9); t.paint(); }
  for (const x of CASTLE.outer) {
    archWin(g, x, -162, 14, 24, { frame: '#8a7a6a', shut: null });
    archWin(g, x, -96, 14, 24, { frame: '#8a7a6a', box: ['#ff6f8f', '#ffd84d'] });
    // a corbel band under the roof
    g.fillStyle = shadeTone(st, 0.12); g.fillRect(x - 39, -212, 78, 8); for (let k = -36; k < 38; k += 9) { g.fillStyle = shadeTone(st, 0.4); g.beginPath(); g.arc(x + k + 4.5, -204, 3.6, Math.PI, 0); g.fill(); }
  }
  for (const c of oC) { inkSil(g, c.sils, 0.9); c.paint(); }
  // ivy on the towers
  for (const [x0, h] of [[-218, 70], [170, 54], [214, 40]]) for (let y = 0; y > -h; y -= 6) { g.fillStyle = y % 12 ? '#4c9a43' : '#6cbf55'; ell(g, x0 + Math.sin(y * 0.15) * 5 + bR(-3, 3), y - 4, bR(4, 6), 3, bR(-0.6, 0.6)); g.fill(); }
  for (const [f, c0] of [[step2, '#cfc6bc'], [step1, '#e2d9cc']]) { fillP(g, f, c0); }
  g.fillStyle = lightTone('#e2d9cc', 0.5); g.fillRect(-54, -1, 108, 1.4); g.fillStyle = lightTone('#cfc6bc', 0.5); g.fillRect(-64, 5, 128, 1.4);
  hedge(g, -150, -76, 2, ['#ff6f8f', '#ffd84d', '#ffffff']); hedge(g, 76, 150, 2, ['#ff8fb4', '#ffffff', '#8fb8ff']);
}

const KEEP = { inner: [-66, 66], outer: [-156, 156], innerEyes: -262, outerEyes: -160, banners: [-94, 94], torches: [-48, 48], gateEyes: -138 };
function drawKeep(g) {
  bSeed(202);
  const st = '#7a6494', stB = '#62507c', rf = '#3e2f5a';
  bGround(g, 186, 30);
  const hall = () => g.rect(-108, -236, 216, 130);
  const HR = hipRoof(g, 0, -230, 118, -282, 76, rf, { style: 'slate', rowH: 10, tile: 12 });
  const iT = KEEP.inner.map((x) => towerBody(g, x, 60, -290, -110, stB, { sz: 12 }));
  const iC = KEEP.inner.map((x) => catEarRoof(g, x, 40, -290, 70, '#4a3a6a'));
  const oT = KEEP.outer.map((x) => towerBody(g, x, 66, -190, 0, st, { sz: 12 }));
  const oC = KEEP.outer.map((x) => catEarRoof(g, x, 44, -190, 74, '#4a3a6a'));
  const wall = () => g.rect(-132, -112, 264, 112), wallM = merlonsP(g, -132, 132, -112, 14, 18, 9, true);
  const gate = () => g.rect(-54, -170, 108, 170), gateM = merlonsP(g, -54, 54, -170, 12, 18, 7.2, true);
  inkSil(g, [hall, ...HR.sils, ...iT.map((t) => t.f), ...iC.flatMap((c) => c.sils), wall, wallM, gate, gateM, ...oT.map((t) => t.f), ...oC.flatMap((c) => c.sils)]);
  bWall(g, -108, -236, 216, 130, stB, 'stone', { sz: 13, ao: 4 });
  for (const x of [-24, 24]) archWin(g, x, -206, 11, 22, { frame: '#3e2f5a', glow1: '#fff6c0', glow2: '#e0a030' });
  HR.paint();
  const eyes = (x, y, s) => { for (const d of [-1, 1]) { const ex = x + d * 9 * s; g.fillStyle = OUT; g.beginPath(); g.ellipse(ex, y, 7 * s, 4.6 * s, d * 0.2, 0, TAU); g.fill(); g.fillStyle = '#ffd84d'; g.beginPath(); g.ellipse(ex, y, 5.8 * s, 3.5 * s, d * 0.2, 0, TAU); g.fill(); g.fillStyle = '#fff6b0'; ell(g, ex - 1.6 * s, y - 1 * s, 2 * s, 1.2 * s); g.fill(); g.fillStyle = OUT; g.beginPath(); g.ellipse(ex, y, 1.3 * s, 3.4 * s, 0, 0, TAU); g.fill(); } };
  for (const t of iT) t.paint();
  for (const x of KEEP.inner) eyes(x, KEEP.innerEyes, 1);
  for (const c of iC) c.paint();
  bWall(g, -132, -112, 264, 112, st, 'stone', { sz: 14, eave: false, ao: 18 });
  paintMerlons(g, -132, 132, -112, 14, 18, 9, st, true);
  // claw marks scratched into the wall
  for (const [x, y] of [[-112, -70], [100, -46], [-80, -30]]) for (let k = 0; k < 3; k++) taperLine(g, [[x + k * 5, y], [x + k * 5 + 6, y + 9], [x + k * 5 + 10, y + 20]], 2.2, '#3e2f5a');
  for (const x of KEEP.banners) { g.fillStyle = OUT; g.beginPath(); rrect(g, x - 16, -106, 32, 5, 2.5); g.fill(); g.fillStyle = '#2e2440'; g.beginPath(); rrect(g, x - 15, -105.2, 30, 3.4, 1.7); g.fill(); }
  inkSil(g, [gate, gateM], 0.9);
  bWall(g, -54, -170, 108, 170, lightTone(st, 0.06), 'stone', { sz: 14, eave: false, ao: 20 });
  paintMerlons(g, -54, 54, -170, 12, 18, 7.2, lightTone(st, 0.06), true);
  bigGate(g, 32, -58, { frame: '#9a86b0', deep: '#0e0818', deep2: '#2a1838', bars: '#2a2236', teeth: '#fff6e0' });
  // a scowling cat carved over the gate
  const head = () => { g.moveTo(-20, -124); g.lineTo(-22, -152); g.lineTo(-10, -142); g.quadraticCurveTo(0, -146, 10, -142); g.lineTo(22, -152); g.lineTo(20, -124); g.quadraticCurveTo(0, -112, -20, -124); g.closePath(); };
  inkSil(g, [head], 0.9); fillP(g, head, '#9a86b0'); celBand(g, head, '#6a5684', -3, -3); celBand(g, head, '#c4b4d8', 2, 2, 0.7);
  eyes(0, KEEP.gateEyes, 0.8);
  g.strokeStyle = OUT; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -126); g.quadraticCurveTo(-3, -123, 0, -126); g.quadraticCurveTo(3, -123, 6, -126); g.stroke();
  for (const x of KEEP.torches) { g.fillStyle = IRON; g.fillRect(x - 1.6, -56, 3.2, 14); g.fillStyle = OUT; g.beginPath(); g.moveTo(x - 5, -60); g.lineTo(x + 5, -60); g.lineTo(x + 3, -54); g.lineTo(x - 3, -54); g.closePath(); g.fill(); }
  for (const t of oT) { inkSil(g, [t.f], 0.9); t.paint(); }
  for (const x of KEEP.outer) { eyes(x, KEEP.outerEyes, 1); archWin(g, x, -96, 12, 22, { frame: '#3e2f5a', glow1: '#fff6c0', glow2: '#e0a030' }); }
  for (const c of oC) { inkSil(g, c.sils, 0.9); c.paint(); }
  // brambles and a stray ball of yarn
  for (const [x0, x1] of [[-180, -60], [60, 180]]) for (let x = x0; x < x1; x += 16) { const pts = qpts(x, 2, x + 6, -16 - bR(0, 10), x + 14, bR(-6, 0), 6); taperLine(g, pts, 2.6, '#4a2e5a'); for (const p of pts.slice(1, -1)) { g.fillStyle = '#4a2e5a'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 2.5, p[1] - 3.5); g.lineTo(p[0] + 1, p[1]); g.fill(); } }
  const yarn = () => g.arc(-112, -8, 9, 0, TAU);
  inkSil(g, [yarn], 0.8); fillP(g, yarn, '#e8475f'); g.strokeStyle = '#b8304a'; g.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(-112, -8, 7.5, 3 + Math.abs(i) * 2, i * 0.6, 0, Math.PI); g.stroke(); }
}

const PURR = { braziers: [-104, 104], eyes: [[-24, -117], [24, -117]] };
function drawPurramid(g) {
  bSeed(55);
  const sand = '#f0c878', T = tones(sand), th = 26;
  bGround(g, 166, 28);
  const hw = (k) => 150 - k * 19;
  const tiersF = [];
  for (let k = 0; k < 7; k++) tiersF.push(() => g.rect(-hw(k), -(k + 1) * th, hw(k) * 2, th));
  const earL = () => { g.moveTo(-34, -180); g.lineTo(-24, -236); g.lineTo(-4, -182); g.closePath(); }, earR = () => { g.moveTo(34, -180); g.lineTo(24, -236); g.lineTo(4, -182); g.closePath(); };
  const statue = (x) => [() => g.ellipse(x, -14, 14, 13, 0, 0, TAU), () => g.arc(x, -34, 10, 0, TAU), () => { g.moveTo(x - 9, -38); g.lineTo(x - 8, -50); g.lineTo(x - 2, -42); g.closePath(); }, () => { g.moveTo(x + 9, -38); g.lineTo(x + 8, -50); g.lineTo(x + 2, -42); g.closePath(); }, () => rrect(g, x - 17, -6, 34, 7, 2)];
  const sts = [...statue(-64), ...statue(64)];
  const braz = PURR.braziers.map((x) => [() => { g.moveTo(x - 12, -26); g.lineTo(x + 12, -26); g.quadraticCurveTo(x + 10, -16, x, -15); g.quadraticCurveTo(x - 10, -16, x - 12, -26); g.closePath(); }, () => g.rect(x - 2.5, -16, 5, 16), () => rrect(g, x - 8, -3, 16, 4, 2)]).flat();
  inkSil(g, [...tiersF, earL, earR]);
  for (let k = 0; k < 7; k++) {
    const y0 = -(k + 1) * th, w = hw(k);
    clipP(g, tiersF[k], () => {
      // the step's sunlit top, then the block face below it
      g.fillStyle = shadeTone(sand, 0.3); g.fillRect(-w, y0, w * 2, th);
      for (let x = -w - bR(0, 20), r = 0; x < w; x += bR(20, 30), r++) { const c0 = mix(sand, r % 2 ? '#fff4d8' : '#b07a3a', bR(0, 0.16)); g.fillStyle = c0; g.beginPath(); rrect(g, x + 1, y0 + 6.6, bR(18, 28), th - 7.6, 2.5); g.fill(); g.fillStyle = lightTone(c0, 0.35); g.fillRect(x + 2.5, y0 + 7.4, 9, 1.4); }
      g.fillStyle = lightTone(sand, 0.45); g.fillRect(-w, y0, w * 2, 6);
      g.fillStyle = lightTone(sand, 0.7); g.fillRect(-w, y0, w * 2, 1.4);
      g.fillStyle = shadeTone(sand, 0.4); g.globalAlpha = 0.5; g.fillRect(-w, y0 + 6, w * 2, 2); g.globalAlpha = 1;
      // the sunny left end and shaded right end of each tier
      g.fillStyle = shadeTone(sand, 0.3); g.globalAlpha = 0.45; g.fillRect(w * 0.55, y0 + 6, w, th); g.globalAlpha = 1;
      g.fillStyle = lightTone(sand, 0.3); g.globalAlpha = 0.4; g.fillRect(-w, y0 + 6, w * 0.25, th); g.globalAlpha = 1;
      // hieroglyphs: paws, fish, eyes
      for (let i = 0; i < 3; i++) { const hx = bR(-w + 12, w - 12), hy = y0 + 15; if (Math.abs(hx) < 40 && k < 6) continue; const kind = (i + k) % 3; g.fillStyle = shadeTone(sand, 0.42); if (kind === 0) drawPaw(g, hx, hy, 4.4, shadeTone(sand, 0.42)); else if (kind === 1) { g.beginPath(); g.ellipse(hx, hy, 5, 2.6, 0, 0, TAU); g.moveTo(hx + 4, hy); g.lineTo(hx + 8, hy - 3); g.lineTo(hx + 8, hy + 3); g.fill(); } else { g.beginPath(); g.ellipse(hx, hy, 5.5, 2.8, 0, 0, TAU); g.fill(); g.fillStyle = lightTone(sand, 0.3); circ(g, hx, hy, 1.4); g.fill(); } }
    });
  }
  aoFoot(g, -150, 0, 300, 16);
  // cat ears on top
  for (const [f, c0] of [[earL, lightTone(sand, 0.1)], [earR, shadeTone(sand, 0.15)]]) { fillP(g, f, c0); celBand(g, f, shadeTone(sand, 0.35), -3, -2); }
  g.fillStyle = '#e8a090'; g.beginPath(); g.moveTo(-28, -186); g.lineTo(-23, -222); g.lineTo(-12, -186); g.closePath(); g.fill(); g.beginPath(); g.moveTo(28, -186); g.lineTo(23, -222); g.lineTo(12, -186); g.closePath(); g.fill();
  // the face: gem eyes, a nose, whiskers
  for (const [ex, ey] of PURR.eyes) { g.fillStyle = OUT; g.beginPath(); g.ellipse(ex, ey, 13, 8.4, 0, 0, TAU); g.fill(); const eg = g.createRadialGradient(ex - 3, ey - 2, 1, ex, ey, 12); eg.addColorStop(0, '#bff0ff'); eg.addColorStop(0.5, '#3a9fe0'); eg.addColorStop(1, '#1f5aa8'); g.fillStyle = eg; g.beginPath(); g.ellipse(ex, ey, 11.4, 6.9, 0, 0, TAU); g.fill(); g.fillStyle = OUT; g.beginPath(); g.ellipse(ex, ey, 2.4, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; circ(g, ex - 4, ey - 2.4, 1.8); g.fill(); }
  const nose = () => { g.moveTo(-8, -98); g.lineTo(8, -98); g.lineTo(0, -88); g.closePath(); };
  inkSil(g, [nose], 0.8); fillP(g, nose, '#e8907a'); g.fillStyle = '#ffc0b0'; g.fillRect(-4, -97, 4, 1.6);
  g.strokeStyle = OUT; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -88); g.lineTo(0, -84); g.moveTo(-9, -82); g.quadraticCurveTo(-4.5, -79, 0, -84); g.quadraticCurveTo(4.5, -79, 9, -82); g.stroke();
  for (const s of [-1, 1]) for (const k of [0, 1]) taperLine(g, [[s * 16, -92 + k * 5], [s * 40, -94 + k * 7], [s * 62, -97 + k * 10]], 2, shadeTone(sand, 0.5));
  // the doorway: jambs, a heavy lintel, darkness inside
  const jambs = [() => g.rect(-38, -68, 12, 68), () => g.rect(26, -68, 12, 68)], lintel = () => g.rect(-44, -78, 88, 12);
  inkSil(g, [...jambs, lintel], 0.9);
  const door = () => { g.moveTo(-26, 0); g.lineTo(-26, -50); g.quadraticCurveTo(-26, -66, 0, -66); g.quadraticCurveTo(26, -66, 26, -50); g.lineTo(26, 0); g.closePath(); };
  const dg = g.createLinearGradient(0, -66, 0, 0); dg.addColorStop(0, '#1c0f22'); dg.addColorStop(1, '#4a2c3a'); fillP(g, door, dg);
  clipP(g, door, () => { g.fillStyle = 'rgba(20,8,30,0.5)'; g.beginPath(); g.rect(-40, -80, 80, 90); g.translate(3, 4); door(); g.fill('evenodd'); });
  for (const f of jambs) { fillP(g, f, lightTone(sand, 0.1)); celBand(g, f, shadeTone(sand, 0.3), -3, -2); }
  fillP(g, lintel, lightTone(sand, 0.15)); celBand(g, lintel, shadeTone(sand, 0.3), -2, -3);
  for (let i = 0; i < 6; i++) { const x = -34 + i * 13.6; if (i % 2) drawPaw(g, x, -72, 3.4, shadeTone(sand, 0.45)); else { g.fillStyle = shadeTone(sand, 0.45); g.beginPath(); g.ellipse(x, -72, 4, 2, 0, 0, TAU); g.fill(); } }
  // sitting cat statues by the door and two braziers
  inkSil(g, sts);
  for (const x of [-64, 64]) {
    const [bd, hd, e1, e2, base] = statue(x);
    fillP(g, base, shadeTone(sand, 0.1)); fillP(g, bd, lightTone(sand, 0.05)); celBand(g, bd, shadeTone(sand, 0.3), -3, -3); fillP(g, e1, lightTone(sand, 0.05)); fillP(g, e2, shadeTone(sand, 0.15)); fillP(g, hd, lightTone(sand, 0.1)); celBand(g, hd, shadeTone(sand, 0.3), -2.5, -2.5); celBand(g, hd, lightTone(sand, 0.45), 2, 2, 0.7);
    for (const d of [-1, 1]) { g.fillStyle = '#3a9fe0'; g.beginPath(); g.ellipse(x + d * 4, -35, 2.4, 1.6, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#4a7ad9'; g.fillRect(x - 6, -26, 12, 3); g.fillStyle = GOLD; g.fillRect(x - 6, -26, 12, 1);
  }
  inkSil(g, braz, 0.8);
  for (const x of PURR.braziers) { const [bowl, leg, foot] = braz.slice(PURR.braziers.indexOf(x) * 3, PURR.braziers.indexOf(x) * 3 + 3); fillP(g, foot, '#8a6a50'); fillP(g, leg, '#b07a46'); fillP(g, bowl, '#c9963a'); celBand(g, bowl, '#9a6a2a', -3, -2); g.fillStyle = '#5a2a2a'; ell(g, x, -26, 11, 2.6); g.fill(); }
  // sand drifting against the base
  for (const [x, w, h] of [[-128, 46, 12], [128, 50, 14], [-70, 30, 7], [96, 26, 6]]) { const f = () => { g.moveTo(x - w, 4); g.quadraticCurveTo(x - w * 0.3, 4 - h * 2, x + w * 0.2, 2 - h); g.quadraticCurveTo(x + w * 0.7, 2 - h * 0.8, x + w, 4); g.closePath(); }; fillP(g, f, '#f6dca0'); celBand(g, f, '#e0b878', -4, -3); }
}

const OAK = { lantern: [-34, -64] };
function drawOak(g) {
  bSeed(66);
  const bark = '#8a5a3c', T = tones(bark);
  bGround(g, 128, 26);
  const roots = [[-30, -8, -112, 8, 20], [-20, -4, -70, 14, 16], [30, -8, 114, 6, 20], [22, -4, 76, 14, 15], [-50, -26, -96, -4, 12], [52, -24, 98, -6, 12]];
  const rootF = roots.map(([x0, y0, x1, y1, w]) => () => { const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 8; g.moveTo(x0 - w * 0.5, y0 - w * 0.3); g.quadraticCurveTo(mx, my - w * 0.4, x1, y1); g.quadraticCurveTo(mx, my + w * 0.7, x0 + w * 0.5, y0 + w * 0.5); g.closePath(); });
  const trunk = () => { g.moveTo(-74, 2); g.quadraticCurveTo(-50, -10, -50, -60); g.quadraticCurveTo(-48, -112, -40, -150); g.lineTo(40, -150); g.quadraticCurveTo(48, -112, 50, -60); g.quadraticCurveTo(50, -10, 74, 2); g.quadraticCurveTo(0, 12, -74, 2); g.closePath(); };
  const back = [[-112, -182, 48], [112, -182, 48], [-62, -246, 56], [62, -246, 56], [0, -276, 52], [0, -206, 72]];
  const front = [[-60, -258, 40], [12, -262, 46], [-34, -220, 54], [44, -216, 54], [-96, -184, 50], [96, -182, 50], [-126, -152, 40], [128, -150, 40], [-62, -164, 52], [64, -160, 52], [0, -170, 58]];
  const circF = [...back, ...front].map(([x, y, r]) => () => g.arc(x, y, r + 1, 0, TAU));
  inkSil(g, [...rootF, trunk, ...circF]);
  for (const f of rootF) { fillP(g, f, bark); celBand(g, f, T.sh, -3, -4); celBand(g, f, T.hi, 2, 2.5, 0.8); }
  fillP(g, trunk, bark);
  clipP(g, trunk, () => {
    // bark grooves follow the trunk's flare
    for (let i = 0; i < 12; i++) { const x = -44 + i * 8 + bR(-2, 2), flare = x * 0.5; taperLine(g, qpts(x + flare, 0, x * 0.95, -70, x * 0.85 + bR(-3, 3), -150, 8), bR(2, 3.4), shadeTone(bark, 0.35)); }
    g.fillStyle = T.hi; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(-46, -150); g.quadraticCurveTo(-46, -60, -62, 0); g.lineTo(-40, 0); g.quadraticCurveTo(-30, -60, -32, -150); g.fill();
    g.fillStyle = T.sh2; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(22, -150); g.quadraticCurveTo(30, -60, 40, 10); g.lineTo(80, 10); g.lineTo(60, -150); g.fill(); g.globalAlpha = 1;
    g.fillStyle = shadeTone(bark, 0.45); ell(g, 30, -118, 5, 7); g.fill(); g.fillStyle = shadeTone(bark, 0.2); ell(g, 29, -119, 2.6, 4); g.fill();
    aoFoot(g, -80, 6, 160, 16);
    g.fillStyle = 'rgba(40,20,50,0.4)'; g.fillRect(-60, -152, 120, 18);
  });
  // canopy: the dark back layer, then clumps from the top down, each with its own shade and light
  for (const [x, y, r] of back) { g.fillStyle = '#3d8040'; circ(g, x, y, r); g.fill(); }
  for (const [x, y, r] of back) { g.fillStyle = '#4a9446'; circ(g, x - r * 0.25, y - r * 0.3, r * 0.6); g.fill(); }
  const fr = front.slice().sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of fr) {
    g.fillStyle = '#3b7a3c'; circ(g, x, y, r); g.fill();
    g.fillStyle = '#5aa84a'; circ(g, x - r * 0.1, y - r * 0.12, r * 0.9); g.fill();
    g.save(); circ(g, x, y, r); g.clip();
    g.fillStyle = '#7cc45a'; circ(g, x - r * 0.34, y - r * 0.38, r * 0.5); g.fill();
    g.fillStyle = '#a2dc76'; circ(g, x - r * 0.45, y - r * 0.5, r * 0.18); g.fill();
    // leaf tufts
    for (let i = 0; i < 6; i++) { const a = bR(0, TAU), d = bR(0.3, 0.85) * r, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d; g.strokeStyle = Math.sin(a) < 0 ? '#8fd06a' : '#3b7a3c'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(lx - 3, ly + 1); g.quadraticCurveTo(lx, ly - 3, lx + 3, ly + 1); g.stroke(); }
    g.restore();
    taperLine(g, qpts(x - r * 0.85, y + r * 0.45, x, y + r * 1.15, x + r * 0.85, y + r * 0.45, 8), 2, '#2f6a34');
  }
  // acorns hanging from the lowest clumps
  for (const [x, y] of [[-118, -112], [-66, -112], [-18, -112], [40, -108], [92, -130], [124, -112], [-100, -136]]) {
    const nut = () => g.ellipse(x, y + 5, 4.4, 5.6, 0, 0, TAU), cap = () => g.ellipse(x, y, 5.6, 3.4, 0, 0, TAU);
    inkSil(g, [nut, cap], 0.7); fillP(g, nut, '#c98a48'); celBand(g, nut, '#9a6430', -1.5, -1.5); fillP(g, cap, '#6d4530'); g.strokeStyle = '#4a2e20'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 3, y - 1); g.lineTo(x + 3, y + 1); g.moveTo(x - 3, y + 1); g.lineTo(x + 3, y - 1); g.stroke(); g.fillStyle = '#fff2d0'; circ(g, x - 1.6, y + 3.6, 1); g.fill();
  }
  // the door in the trunk, a little round window, a lantern, steps of root
  bDoor(g, 0, 0, 40, 56, '#7a4a2a', { frame: '#d9b07a', stone: false, double: true });
  bWin(g, 30, -88, 15, 15, { round: true, frame: '#d9b07a' });
  g.fillStyle = OUT; g.fillRect(-36, -82, 3, 10); g.fillRect(-36, -82, 10, 3); g.fillStyle = '#6d4530'; g.fillRect(-35.2, -81.2, 1.6, 8.6); g.fillRect(-35.2, -81.2, 8.6, 1.6);
  g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.moveTo(-28, -80); g.lineTo(-28, -74); g.stroke();
  pLantern(g, OAK.lantern[0] + 6, OAK.lantern[1] - 4, 1.1);
  pSign(g, -36, -32, 22, 16, (x, y) => { g.fillStyle = '#c98a48'; ell(g, x, y + 2, 4, 4.6); g.fill(); g.fillStyle = '#6d4530'; ell(g, x, y - 2, 5, 3); g.fill(); g.fillRect(x - 0.6, y - 6, 1.2, 3); });
  for (const [x, c0] of [[-70, '#e8473b'], [80, '#f2a03d'], [62, '#e8473b']]) { g.save(); g.translate(x, 6); g.scale(0.8, 0.8); PropArt.mushroom(g, 1, 'forest'); g.restore(); }
}

const GROT = { flag: [60, -186] };
function drawGrotto(g) {
  bSeed(88);
  const rock = '#8a93ad', T = tones(rock);
  bGround(g, 112, 22);
  const main = () => { g.moveTo(-98, 2); g.quadraticCurveTo(-112, -82, -56, -122); g.quadraticCurveTo(-8, -152, 48, -130); g.quadraticCurveTo(106, -102, 100, 2); g.closePath(); };
  const rocks = [() => g.ellipse(-94, -24, 30, 28, 0.2, 0, TAU), () => g.ellipse(98, -30, 26, 34, -0.2, 0, TAU), () => g.ellipse(-22, -142, 36, 20, -0.1, 0, TAU), () => g.ellipse(40, -136, 26, 16, 0.3, 0, TAU)];
  const pole = () => g.rect(GROT.flag[0] - 2, GROT.flag[1], 4, 62);
  inkSil(g, [pole, main, ...rocks]);
  fillP(g, pole, '#7a5a3c'); g.fillStyle = '#a8805a'; g.fillRect(GROT.flag[0] - 1.4, GROT.flag[1], 1, 58);
  for (const f of [rocks[2], rocks[3], main]) { fillP(g, f, rock); celBand(g, f, T.sh, -6, -7); celBand(g, f, T.hi, 5, 6, 0.85); }
  clipP(g, main, () => {
    // rock strata and cracks
    for (let i = 0; i < 6; i++) { const y = -110 + i * 18; taperLine(g, qpts(-110, y + bR(-4, 4), 0, y - 10, 110, y + bR(-4, 4), 10), 1.6, shadeTone(rock, 0.25)); }
    for (const [x, y] of [[-70, -70], [64, -88], [-40, -112], [80, -40]]) taperLine(g, [[x, y], [x + 6, y + 8], [x + 2, y + 16], [x + 8, y + 24]], 1.8, OUT);
    g.fillStyle = 'rgba(255,255,255,0.55)'; for (const [x, y, l] of [[-60, -110, 14], [10, -136, 18], [-90, -60, 10], [70, -116, 12]]) { g.beginPath(); rrect(g, x, y, l, 2, 1); g.fill(); }
    aoFoot(g, -110, 4, 220, 20);
  });
  for (const f of [rocks[0], rocks[1]]) { inkSil(g, [f], 0.9); fillP(g, f, rock); celBand(g, f, T.sh, -5, -6); celBand(g, f, T.hi, 4, 5, 0.85); }
  // barnacles and a starfish
  g.fillStyle = '#f2ece0'; for (const [x, y] of [[-100, -36], [-92, -42], [-84, -34], [104, -50], [96, -44], [-60, -100], [-54, -96]]) { circ(g, x, y, 2.4); g.fill(); g.strokeStyle = '#8a8070'; g.lineWidth = 0.6; g.stroke(); }
  star5(g, -96, -14, 7, '#f28a4a', true);
  // the sea cave's mouth, deep and dark, dripping
  const mouth = () => { g.moveTo(-42, 2); g.quadraticCurveTo(-48, -76, 0, -84); g.quadraticCurveTo(48, -76, 42, 2); g.closePath(); };
  g.save(); g.translate(0, 0); g.beginPath(); mouth(); g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.restore();
  const mg = g.createRadialGradient(0, -20, 4, 0, -30, 60); mg.addColorStop(0, '#0b1222'); mg.addColorStop(1, '#2e3c5c'); fillP(g, mouth, mg);
  clipP(g, mouth, () => { g.fillStyle = 'rgba(10,14,30,0.6)'; g.beginPath(); g.rect(-60, -100, 120, 110); g.translate(4, 6); mouth(); g.fill('evenodd'); });
  for (let x = -30; x <= 30; x += 10) { const y0 = -78 + Math.abs(x) * 0.6 - (Math.abs(x) > 25 ? -6 : 0), l = bR(8, 16); const f = () => { g.moveTo(x - 4, y0 - 2); g.lineTo(x, y0 + l); g.lineTo(x + 4, y0 - 2); g.closePath(); }; fillP(g, f, shadeTone(rock, 0.15)); g.fillStyle = T.hi; g.fillRect(x - 2, y0, 1, l * 0.5); }
  // the water running out of it
  const pool = () => g.ellipse(0, 4, 50, 10, 0, 0, TAU);
  inkSil(g, [pool], 0.8); fillP(g, pool, '#3fb6d9'); g.fillStyle = '#7fe0f2'; ell(g, -4, 2.5, 40, 6.4); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; for (const [x, y, w] of [[-24, 2, 10], [8, 5, 14], [26, 1, 8]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 2, x + w, y); g.stroke(); }
  // seaweed draped over the arch
  for (const [x, l, c0] of [[-34, 26, '#4fa86a'], [-20, 18, '#3f8a4a'], [22, 22, '#4fa86a'], [34, 14, '#3f8a4a'], [-4, 12, '#5fc07a']]) { const y0 = -78 + Math.abs(x) * 0.4; taperLine(g, qpts(x, y0 - 8, x + 6, y0 + l * 0.5, x - 2, y0 + l, 8), 4, c0, 1, 0.2); }
  // a barrel, an anchor
  pBarrel(g, -64, 6, 0.95);
  g.save(); g.translate(78, 4); g.rotate(0.25);
  const anc = [() => g.rect(-1.8, -28, 3.6, 26), () => g.arc(0, -31, 4, 0, TAU), () => { g.moveTo(-12, -10); g.quadraticCurveTo(-10, 0, 0, 0); g.quadraticCurveTo(10, 0, 12, -10); g.lineTo(9, -10); g.quadraticCurveTo(7, -4, 0, -4); g.quadraticCurveTo(-7, -4, -9, -10); g.closePath(); }, () => g.rect(-8, -24, 16, 3)];
  inkSil(g, anc, 0.8); for (const f of anc) fillP(g, f, '#6a6a80'); g.fillStyle = '#9a9ab0'; g.fillRect(-1.2, -28, 1, 24); g.fillStyle = '#4a3a2e'; circ(g, 0, -31, 1.8); g.fill();
  g.restore();
}

function drawIceCave(g) {
  bSeed(44);
  bGround(g, 108, 22);
  const mound = () => { g.moveTo(-102, 2); g.quadraticCurveTo(-108, -72, -52, -100); g.quadraticCurveTo(0, -124, 54, -104); g.quadraticCurveTo(108, -76, 102, 2); g.closePath(); };
  const xs = [[-10, -100, 16, 46, -3], [16, -104, 18, 56, 3], [-66, -24, 20, 66, -4], [-86, -14, 15, 44, -6], [-48, -40, 13, 40, 2], [68, -28, 22, 72, 4], [90, -12, 14, 42, 7], [48, -50, 12, 36, -2]];
  const cryF = xs.map(([x, y, w, h, t]) => () => { g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - h + w * 0.6); g.lineTo(x + t, y - h); g.lineTo(x + w / 2, y - h + w * 0.6); g.lineTo(x + w / 2, y); g.closePath(); });
  inkSil(g, [mound, ...cryF]);
  fillP(g, mound, '#f4f9ff');
  clipP(g, mound, () => {
    g.fillStyle = '#c9dcf2'; g.beginPath(); g.moveTo(30, -110); g.quadraticCurveTo(70, -60, 60, 10); g.lineTo(120, 10); g.lineTo(120, -110); g.fill();
    g.fillStyle = '#dfeaf8'; for (let i = 0; i < 9; i++) { ell(g, bR(-90, 90), bR(-90, -10), bR(10, 22), bR(3, 6)); g.fill(); }
    g.fillStyle = '#ffffff'; ell(g, -40, -92, 30, 8, -0.3); g.fill();
    const ga = g.createLinearGradient(0, 4, 0, -24); ga.addColorStop(0, 'rgba(60,80,150,0.35)'); ga.addColorStop(1, 'rgba(60,80,150,0)'); g.fillStyle = ga; g.fillRect(-110, -24, 220, 28);
  });
  // ice crystals, faceted
  for (let i = 0; i < xs.length; i++) {
    const [x, y, w, h, t] = xs[i], f = cryF[i];
    if (i > 1) inkSil(g, [f], 0.8);
    fillP(g, f, '#a8e0f5');
    clipP(g, f, () => { g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - h + w * 0.6); g.lineTo(x + t, y - h); g.lineTo(x + t * 0.3 - w * 0.1, y); g.closePath(); g.fill(); g.fillStyle = '#6fb0e0'; g.beginPath(); g.moveTo(x + w * 0.2, y); g.lineTo(x + t, y - h); g.lineTo(x + w / 2, y - h + w * 0.6); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - w * 0.32, y - h * 0.7, 1.6, h * 0.45); });
  }
  // the mouth with icicles
  const mouth = () => { g.moveTo(-40, 2); g.quadraticCurveTo(-44, -70, 0, -76); g.quadraticCurveTo(44, -70, 40, 2); g.closePath(); };
  g.beginPath(); mouth(); g.lineWidth = 7; g.strokeStyle = OUT; g.stroke();
  const mg = g.createRadialGradient(0, -16, 4, 0, -26, 60); mg.addColorStop(0, '#0d1838'); mg.addColorStop(1, '#3a5a9a'); fillP(g, mouth, mg);
  g.beginPath(); mouth(); g.lineWidth = 2.6; g.strokeStyle = '#bfe6f8'; g.stroke();
  for (let x = -32; x <= 32; x += 7) { const y0 = -72 + (x * x) / 40, l = bR(7, 18); const f = () => { g.moveTo(x - 3.2, y0 - 2); g.lineTo(x, y0 + l); g.lineTo(x + 3.2, y0 - 2); g.closePath(); }; g.beginPath(); f(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); fillP(g, f, '#d5f0ff'); g.fillStyle = '#ffffff'; g.fillRect(x - 1.6, y0, 1, l * 0.55); }
  snowDrifts(g, [[-58, 3, 22], [62, 3, 18], [0, 5, 12]]);
  // paw prints leading in
  for (const [x, y, a] of [[-8, 16, 0], [6, 24, 0], [-6, 32, 0]]) drawPaw(g, x, y, 3, '#b9cdea');
}

function drawBurrow(g, v) {
  bSeed(12 + v);
  const earth = ['#a87a50', '#8a6448', '#e6cb92', '#dcae6a'][v], T = tones(earth);
  bGround(g, 66, 12);
  const mound = () => { g.moveTo(-62, 2); g.quadraticCurveTo(-62, -48, -12, -58); g.quadraticCurveTo(46, -62, 62, 2); g.closePath(); };
  inkSil(g, [mound]);
  fillP(g, mound, earth);
  clipP(g, mound, () => {
    celBand(g, mound, T.sh, -8, -8);
    g.fillStyle = shadeTone(earth, 0.15); for (let i = 0; i < 14; i++) { ell(g, bR(-56, 56), bR(-50, -4), bR(2, 4), bR(1.2, 2.4)); g.fill(); }
    if (v < 2) {
      // a grassy cap
      g.fillStyle = v ? '#4f9a43' : '#6cc24a';
      g.beginPath(); g.moveTo(-70, -70); g.lineTo(70, -70); g.lineTo(70, -34); for (let x = 70; x > -70; x -= 7) { g.lineTo(x - 3.5, -40 + Math.sin(x) * 3 + (x > 0 ? 6 : 0)); g.lineTo(x - 7, -32 + (x > 0 ? 6 : 0)); } g.closePath(); g.fill();
      g.fillStyle = v ? '#66b553' : '#8fdc62'; ell(g, -24, -52, 22, 5, -0.15); g.fill();
    } else if (v === 2) { g.strokeStyle = '#d4b47a'; g.lineWidth = 1.2; for (let y = -46; y < 0; y += 8) { g.beginPath(); g.moveTo(-60, y); g.quadraticCurveTo(0, y - 5, 60, y); g.stroke(); } }
    else { g.strokeStyle = '#c99a58'; g.lineWidth = 1.2; for (let y = -44; y < 0; y += 9) { g.beginPath(); g.moveTo(-60, y + 3); g.quadraticCurveTo(-20, y - 3, 10, y + 2); g.quadraticCurveTo(40, y + 6, 60, y); g.stroke(); } }
    aoFoot(g, -64, 4, 128, 12);
  });
  // the hole: a rim of packed earth and darkness inside
  const rim = () => { g.moveTo(-31, 3); g.quadraticCurveTo(-36, -46, 0, -48); g.quadraticCurveTo(36, -46, 31, 3); g.closePath(); };
  const hole = () => { g.moveTo(-24, 3); g.quadraticCurveTo(-28, -38, 0, -40); g.quadraticCurveTo(28, -38, 24, 3); g.closePath(); };
  fillP(g, rim, shadeTone(earth, 0.1)); celBand(g, rim, lightTone(earth, 0.3), 2.5, 3, 0.9);
  g.beginPath(); hole(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  const hg = g.createRadialGradient(0, -6, 2, 0, -14, 34); hg.addColorStop(0, '#120a14'); hg.addColorStop(1, '#3e2832'); fillP(g, hole, hg);
  if (v === 1) for (const [x, l] of [[-12, 12], [4, 9], [14, 14]]) taperLine(g, qpts(x, -38, x + 3, -38 + l * 0.6, x - 1, -38 + l, 6), 2.2, '#6d4530', 1, 0.2);
  for (const [x, y, r] of [[-38, -2, 5], [-44, 2, 4], [40, 0, 5.5], [33, 3, 3.6]]) { const f = () => g.ellipse(x, y, r * 1.2, r * 0.85, 0, 0, TAU); inkSil(g, [f], 0.7); fillP(g, f, v >= 2 ? '#c9b48a' : '#a7a8b8'); celBand(g, f, v >= 2 ? '#a08a60' : '#7f7f98', -1.6, -1.6); }
  // what lives here
  if (v === 0) {
    for (const [x, a] of [[46, 0.1], [54, -0.15]]) { g.save(); g.translate(x, 2); g.rotate(a); const c = () => { g.moveTo(-3, -12); g.lineTo(3, -12); g.lineTo(0, 0); g.closePath(); }; inkSil(g, [c], 0.6); fillP(g, c, '#f28a2a'); g.fillStyle = '#5fae4c'; for (const d of [-2, 0, 2]) { g.beginPath(); g.ellipse(d, -15, 1.4, 3.6, d * 0.2, 0, TAU); g.fill(); } g.restore(); }
    g.fillStyle = OUT; g.fillRect(-55, -26, 3, 28); pSign(g, -53, -30, 22, 13, (x, y) => { g.fillStyle = '#f28a2a'; g.beginPath(); g.moveTo(x - 6, y - 2); g.lineTo(x + 6, y); g.lineTo(x - 6, y + 2); g.fill(); g.fillStyle = '#5fae4c'; g.fillRect(x - 9, y - 1.5, 3, 3); });
  } else if (v === 1) {
    g.save(); g.translate(-48, 2); g.scale(0.75, 0.75); PropArt.mushroom(g, 1, 'forest'); g.restore();
    pLantern(g, 44, -22, 1); g.fillStyle = OUT; g.fillRect(43, -16, 2.4, 18);
  } else if (v === 2) {
    star5(g, 42, -8, 6, '#f28a4a', true); g.save(); g.translate(-46, 2); DecorArt.shell(g, 0); g.restore(); g.save(); g.translate(-38, 4); DecorArt.shell(g, 1); g.restore();
    g.fillStyle = OUT; g.fillRect(-55, -26, 3, 28); pSign(g, -53, -30, 22, 13, (x, y) => { g.fillStyle = '#e8473b'; g.beginPath(); g.arc(x, y, 4, 0.5, TAU - 0.5); g.lineTo(x, y); g.fill(); });
  } else {
    drawBone(g, 40, 0, 14, 0.4, '#fbf3e0', 1.2); drawBone(g, -44, 2, 12, -0.3, '#fbf3e0', 1.2);
    g.save(); g.translate(50, -2); g.scale(0.6, 0.6); PropArt.cactus(g, 1); g.restore();
  }
}

function drawKennel(g, spooky) {
  bSeed(spooky ? 71 : 70);
  const wall = spooky ? '#8a7f9f' : '#c4a074', roof = spooky ? '#4a3a6a' : '#8a4a3a';
  bGround(g, 84, 15);
  const walls = () => { g.moveTo(-58, 0); g.lineTo(-58, -80); g.lineTo(0, -138); g.lineTo(58, -80); g.lineTo(58, 0); g.closePath(); };
  const lr = () => { g.moveTo(-76, -62); g.lineTo(0, -138); g.lineTo(0, -158); g.lineTo(-76, -82); g.closePath(); };
  const rr = () => { g.moveTo(76, -62); g.lineTo(0, -138); g.lineTo(0, -158); g.lineTo(76, -82); g.closePath(); };
  inkSil(g, [walls, lr, rr]);
  clipP(g, walls, () => {
    if (spooky) { g.save(); g.translate(0, 0); g.rotate(0.02); vplanksIn(g, -62, -130, 124, 132, wall, 12); g.restore(); g.fillStyle = '#2a1e36'; g.fillRect(-40, -60, 9, 26); g.fillRect(34, -40, 10, 18); }
    else vplanksIn(g, -62, -130, 124, 132, wall, 12);
    g.fillStyle = shadeTone(wall, 0.3); g.globalAlpha = 0.45; g.fillRect(40, -130, 20, 132); g.globalAlpha = 1;
    g.fillStyle = 'rgba(70,38,104,0.3)'; g.beginPath(); g.moveTo(-58, -80); g.lineTo(0, -138); g.lineTo(58, -80); g.lineTo(58, -68); g.lineTo(0, -126); g.lineTo(-58, -68); g.fill();
    aoFoot(g, -60, 0, 120, 16);
  });
  // the roof: two planes seen from the front and above
  for (const [f, s] of [[lr, -1], [rr, 1]]) {
    const c0 = s < 0 ? lightTone(roof, 0.12) : shadeTone(roof, 0.2);
    fillP(g, f, c0);
    clipP(g, f, () => {
      for (let d = 4; d < 20; d += 4.5) { g.strokeStyle = shadeTone(c0, 0.3); g.lineWidth = 1.1; g.beginPath(); g.moveTo(s * 76, -62 - d); g.lineTo(0, -138 - d); g.stroke(); }
      for (let t = 0.1; t < 1; t += 0.1) for (let d = 0; d < 20; d += 4.5) { const x = s * 76 * (1 - t), y = -62 - 76 * t - d - (Math.round(t * 10) % 2 ? 2.2 : 0); g.strokeStyle = shadeTone(c0, 0.3); g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5); g.stroke(); }
      g.fillStyle = lightTone(c0, 0.35); g.beginPath(); g.moveTo(s * 76, -62); g.lineTo(0, -138); g.lineTo(0, -141); g.lineTo(s * 76, -65); g.fill();
    });
    g.fillStyle = OUT; g.beginPath(); g.moveTo(s * 77, -60); g.lineTo(0, -137); g.lineTo(0, -132); g.lineTo(s * 77, -55); g.fill();
    g.fillStyle = shadeTone(roof, 0.35); g.beginPath(); g.moveTo(s * 76, -60); g.lineTo(0, -136); g.lineTo(0, -133); g.lineTo(s * 76, -57); g.fill();
  }
  if (spooky) { g.fillStyle = '#2a1e36'; ell(g, -30, -102, 6, 3, -0.8); g.fill(); g.strokeStyle = 'rgba(240,240,255,0.7)'; g.lineWidth = 0.6; for (const a of [0, 0.5, 1]) { g.beginPath(); g.moveTo(56, -74); g.lineTo(56 - 14 * Math.cos(a * 1.5), -74 + 14 * Math.sin(a * 1.5)); g.stroke(); } for (const r of [6, 11]) { g.beginPath(); g.arc(56, -74, r, Math.PI - 1.45, Math.PI - 0.05); g.stroke(); } }
  // the big round doorway
  const door = () => { g.moveTo(-26, 0); g.lineTo(-26, -30); g.arc(0, -30, 26, Math.PI, 0); g.lineTo(26, 0); g.closePath(); };
  g.beginPath(); door(); g.lineWidth = 9; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 6; g.strokeStyle = spooky ? '#6a6488' : '#e8d4b0'; g.stroke();
  const dg = g.createLinearGradient(0, -56, 0, 0); dg.addColorStop(0, '#120a16'); dg.addColorStop(1, '#3a2434'); fillP(g, door, dg);
  clipP(g, door, () => { g.fillStyle = 'rgba(10,4,16,0.5)'; g.beginPath(); g.rect(-40, -70, 80, 80); g.translate(3, 4); door(); g.fill('evenodd'); });
  // a bone-shaped sign nailed on, a little crooked
  g.save(); g.translate(0, -96); g.rotate(spooky ? -0.12 : 0.06);
  drawBone(g, 0, 0, 58, 0, spooky ? '#d8d0e0' : '#fff6e0', 1.6);
  g.fillStyle = spooky ? '#6a3a8a' : '#a8463a'; g.font = 'bold 9px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(spooky ? 'BOO!' : 'KEEP OUT', 0, 3.2);
  g.restore();
  if (!spooky) {
    // a food bowl, a chain, a bone
    const bowl = () => { g.moveTo(32, -6); g.lineTo(52, -6); g.lineTo(49, 2); g.lineTo(35, 2); g.closePath(); };
    inkSil(g, [bowl], 0.7); fillP(g, bowl, '#e8475f'); g.fillStyle = '#ff8f9f'; g.fillRect(33, -5.4, 18, 1.4); g.fillStyle = '#8a5a3c'; ell(g, 42, -6, 9.4, 2); g.fill();
    g.strokeStyle = '#8f8aa8'; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(-30 - i * 5, -6 + i * 1.6, 2.6, 1.6, 0, 0, TAU); g.stroke(); }
    drawBone(g, -62, 4, 14, 0.4, '#fff6e0', 1.2);
  } else {
    jackLantern(g, 44, 2);
    // a little ghost peeking over the roof
    g.save(); g.translate(-46, -94);
    const gh = () => { g.moveTo(-9, 6); g.lineTo(-9, -4); g.arc(0, -4, 9, Math.PI, 0); g.lineTo(9, 6); g.lineTo(6, 3); g.lineTo(3, 6); g.lineTo(0, 3); g.lineTo(-3, 6); g.lineTo(-6, 3); g.closePath(); };
    inkSil(g, [gh], 0.8); fillP(g, gh, '#f4f0ff'); celBand(g, gh, '#c8c0e0', -2, -2); g.fillStyle = OUT; ell(g, -3, -4, 1.6, 2.2); g.fill(); ell(g, 3, -4, 1.6, 2.2); g.fill(); ell(g, 0, 1, 1.8, 1.4); g.fill();
    g.restore();
  }
}

// ---------- live touches drawn over the baked sprites each frame (a few small paths, no gradients)
const _glowC = {};
function glowSpr(col) {
  let c = _glowC[col]; if (c) return c;
  c = mkCanvas(64, 64); const g = c.getContext('2d'), [r, gg, b] = hexRgb(col);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.4, `rgba(${r},${gg},${b},0.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (_glowC[col] = c);
}
function glowAt(c, x, y, r, col, a) {
  const op = c.globalCompositeOperation, ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * a;
  c.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = op; c.globalAlpha = ga;
}
function puffs(c, x, y, t, seed, col, sh) {
  const ga = c.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.32 + seed + i / 3) % 1, px = x + k * 18 + Math.sin(k * 5 + seed * 7) * 3, py = y - k * 44, r = 3.5 + k * 8;
    c.globalAlpha = ga * (k < 0.1 ? k * 10 : 1) * (1 - k) * 0.85;
    c.fillStyle = sh || '#cdbfdc'; circ(c, px + r * 0.18, py + r * 0.2, r); c.fill();
    c.fillStyle = col || '#f6f0f8'; circ(c, px - r * 0.08, py - r * 0.08, r * 0.86); c.fill();
  }
  c.globalAlpha = ga;
}
function flagLive(c, x, y, w, h, t, col, emblem) {
  const ph = t * 5 + x * 0.05;
  c.beginPath(); c.moveTo(x, y);
  for (let i = 1; i <= 5; i++) { const u = i / 5; c.lineTo(x + w * u, y + Math.sin(ph - u * 3) * 2.6 * u); }
  for (let i = 5; i >= 0; i--) { const u = i / 5; c.lineTo(x + w * u - (i === 5 ? w * 0.18 : 0), y + h - (i === 5 ? h * 0.5 : 0) + Math.sin(ph - u * 3) * 2.6 * u); }
  c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(60,30,90,0.25)'; c.beginPath(); c.moveTo(x + w * 0.5, y + Math.sin(ph - 1.5) * 1.3); c.lineTo(x + w * 0.62, y + Math.sin(ph - 1.9) * 1.6); c.lineTo(x + w * 0.62, y + h * 0.82 + Math.sin(ph - 1.9) * 1.6); c.lineTo(x + w * 0.5, y + h * 0.9 + Math.sin(ph - 1.5) * 1.3); c.fill();
  if (emblem) emblem(x + w * 0.36, y + h * 0.45 + Math.sin(ph - 1.1) * 1.2);
}
function bannerLive(c, x, y, w, h, t, col, emblem) {
  const sw = Math.sin(t * 1.8 + x * 0.07) * 2.6, T = tones(col);
  const f = () => { c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.quadraticCurveTo(x + w / 2 + sw * 0.4, y + h * 0.6, x + w / 2 + sw, y + h); c.lineTo(x + sw, y + h - w * 0.4); c.lineTo(x - w / 2 + sw, y + h); c.quadraticCurveTo(x - w / 2 + sw * 0.4, y + h * 0.6, x - w / 2, y); c.closePath(); };
  c.beginPath(); f(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke(); c.fillStyle = col; c.fill();
  c.fillStyle = T.sh; c.beginPath(); c.moveTo(x + w * 0.22, y); c.lineTo(x + w / 2, y); c.quadraticCurveTo(x + w / 2 + sw * 0.4, y + h * 0.6, x + w / 2 + sw, y + h); c.lineTo(x + sw * 0.9 + w * 0.22, y + h - w * 0.2); c.closePath(); c.fill();
  c.fillStyle = GOLD; c.fillRect(x - w / 2 + 2 + sw * 0.1, y + 3, w - 4, 2);
  if (emblem) emblem(x + sw * 0.5, y + h * 0.48);
}
function flameLive(c, x, y, s, t, cols) {
  cols = cols || ['#ff7a2a', '#ffc23a', '#fff3a8'];
  const f1 = Math.sin(t * 13 + x) * 0.12 + Math.sin(t * 7.3 + y) * 0.1;
  for (let i = 0; i < 3; i++) {
    const h = s * (14 - i * 4) * (1 + f1 * (1 + i * 0.4)), w = s * (6.5 - i * 1.8), lean = Math.sin(t * 5 + i + x) * s * 1.4;
    c.fillStyle = cols[i]; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + lean, y - h); c.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y); c.quadraticCurveTo(x, y + w * 0.6, x - w, y); c.fill();
    if (i === 0) { c.lineWidth = 1.2; c.strokeStyle = OUT; c.globalAlpha *= 0.5; c.stroke(); c.globalAlpha *= 2; }
  }
}
function twinkle(c, x, y, r, col) {
  if (r < 0.4) return;
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r * 2.4); c.quadraticCurveTo(x, y, x + r * 2.4, y); c.quadraticCurveTo(x, y, x, y + r * 2.4); c.quadraticCurveTo(x, y, x - r * 2.4, y); c.quadraticCurveTo(x, y, x, y - r * 2.4); c.fill();
}
function sparksLive(c, x, y, t, n, col) {
  for (let i = 0; i < n; i++) { const k = (t * 0.8 + i / n) % 1, px = x + Math.sin(i * 7.1 + t * 2) * 6 * k + (i - n / 2) * 2, py = y - k * 30; c.fillStyle = col || '#ffd84d'; c.globalAlpha *= 1 - k; c.fillRect(px - 0.8, py - 0.8, 1.6, 1.6); c.globalAlpha /= 1 - k || 1; }
}
const BldLive = {
  house(c, x, y, t) { puffs(c, x + 26, y - 124, t, (x * 0.013) % 1); },
  inn(c, x, y, t) {
    puffs(c, x - 58, y - 156, t, (x * 0.017) % 1);
    // the sign swings on its bracket
    const a = Math.sin(t * 1.7 + x) * 0.07;
    c.save(); c.translate(x + 87, y - 70); c.rotate(a);
    c.strokeStyle = IRON; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-8, 5); c.moveTo(8, 0); c.lineTo(8, 5); c.stroke();
    c.fillStyle = OUT; c.beginPath(); rrect(c, -14, 4, 28, 20, 4); c.fill(); c.fillStyle = '#fff3d6'; c.beginPath(); rrect(c, -12.6, 5.4, 25.2, 17.2, 3); c.fill(); c.fillStyle = '#e8d4b0'; c.fillRect(-12, 19, 24, 3);
    c.fillStyle = '#f2c14a'; c.beginPath(); c.arc(-5, 12, 5, 0.5, Math.PI * 1.6 + 0.5); c.arc(-3, 10.5, 4, Math.PI * 1.55 + 0.5, 0.55, true); c.closePath(); c.fill();
    c.fillStyle = '#4f6fc9'; c.font = '700 7px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.fillText('INN', 5, 16);
    c.restore();
  },
  smith(c, x, y, t) {
    puffs(c, x + 45, y - 140, t, (x * 0.011) % 1, '#a8a0b4', '#7a7090');
    const fl = 0.75 + Math.sin(t * 9) * 0.12 + Math.sin(t * 23) * 0.08;
    glowAt(c, x + 46, y - 12, 26, '#ff8a3a', 0.55 * fl);
    glowAt(c, x + 46, y - 8, 12, '#ffd070', 0.5 * fl);
    sparksLive(c, x + 46, y - 22, t, 4, '#ffd84d');
  },
  trainer(c, x, y, t) {
    const pts = [[-30, -110, 0], [20, -150, 1.3], [40, -96, 2.1], [-46, -86, 3.4], [6, -186, 4.2], [-12, -136, 5.1], [72, -58, 0.7], [64, -30, 2.8]];
    for (const [dx, dy, ph] of pts) { const k = Math.sin(t * 2.6 + ph * 1.7); if (k > 0) twinkle(c, x + dx, y + dy, k * 2.2, ph > 3 ? '#ffffff' : '#ffe36a'); }
    glowAt(c, x - 70, y - 19, 14 + Math.sin(t * 3) * 2, '#7fd8ff', 0.5);
  },
  castle(c, x, y, t) {
    for (const ix of CASTLE.inner) flagLive(c, x + ix + 1.5, y + CASTLE.innerTip - 26, 24, 15, t, '#4f6fc9', (fx, fy) => drawPaw(c, fx, fy, 4, GOLD));
    for (const ox of CASTLE.outer) flagLive(c, x + ox + 1.5, y + CASTLE.outerTip - 26, 28, 17, t + 0.7, '#e8475f', (fx, fy) => drawPaw(c, fx, fy, 4.4, '#fff6e0'));
    for (const bx of CASTLE.banners) bannerLive(c, x + bx, y - 118, 28, 64, t, '#4f6fc9', (ex, ey) => drawPaw(c, ex, ey, 8, GOLD));
    for (const tx of CASTLE.torches) { glowAt(c, x + tx, y - 72, 22, '#ffa040', 0.45); flameLive(c, x + tx, y - 66, 0.6, t); }
  },
  tent(c, x, y, t) { flagLive(c, x + 1.6, y - 84, 16, 9, t, '#ffd84d'); },
  hut(c, x, y, t) { puffs(c, x + 33, y - 120, t, (x * 0.013) % 1, '#d8f0c8', '#9ab48a'); glowAt(c, x - 27, y - 36, 14, '#b6e46a', 0.25 + Math.sin(t * 7 + x) * 0.08); glowAt(c, x + 28, y - 36, 14, '#b6e46a', 0.25 + Math.sin(t * 6 + 1) * 0.08); },
  fountain(c, x, y, t) {
    const ga = c.globalAlpha;
    // two arcs of water from the dog's raised pedestal, splashing into the basin
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(x + s * 11, y - 50); c.quadraticCurveTo(x + s * 30, y - 74, x + s * 40, y - 20);
      c.strokeStyle = '#8fe0f5'; c.lineWidth = 3.4; c.globalAlpha = ga * 0.7; c.stroke();
      c.setLineDash([5, 7]); c.lineDashOffset = -t * 40; c.strokeStyle = '#ffffff'; c.lineWidth = 1.8; c.globalAlpha = ga; c.stroke(); c.setLineDash([]);
      for (let i = 0; i < 2; i++) { const k = (t * 1.3 + i * 0.5 + (s > 0 ? 0.25 : 0)) % 1; c.globalAlpha = ga * (1 - k); c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x + s * 40, y - 19, 3 + k * 10, 1.2 + k * 3, 0, 0, TAU); c.stroke(); }
    }
    c.globalAlpha = ga;
    for (let i = 0; i < 4; i++) { const k = Math.sin(t * 3 + i * 2.1); if (k > 0.3) twinkle(c, x - 30 + i * 19, y - 22 + (i % 2) * 7, (k - 0.3) * 2.2, '#ffffff'); }
  },
  campfire(c, x, y, t) {
    glowAt(c, x, y - 12, 46, '#ff9a3a', 0.4 + Math.sin(t * 9) * 0.05);
    flameLive(c, x - 5, y - 6, 1.0, t + 0.4); flameLive(c, x + 5, y - 6, 0.9, t + 1.1); flameLive(c, x, y - 5, 1.35, t);
    sparksLive(c, x, y - 22, t, 4, '#ffd070');
  },
  oak(c, x, y, t) {
    glowAt(c, x + OAK.lantern[0] + 6, y + OAK.lantern[1] - 4, 18, '#ffc860', 0.45 + Math.sin(t * 5) * 0.06);
    for (let i = 0; i < 3; i++) { const k = (t * 0.12 + i / 3) % 1, lx = x - 90 + i * 80 + Math.sin(k * 9 + i) * 16, ly = y - 140 + k * 150; c.globalAlpha = Math.min(1, (1 - k) * 3) * (k < 0.08 ? k * 12 : 1); c.save(); c.translate(lx, ly); c.rotate(Math.sin(k * 12 + i) * 0.9); c.fillStyle = i === 1 ? '#e8a04f' : '#7cc45a'; c.beginPath(); c.ellipse(0, 0, 4.4, 2.2, 0, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke(); c.restore(); c.globalAlpha = 1; }
  },
  grotto(c, x, y, t) {
    flagLive(c, x + GROT.flag[0] + 2, y + GROT.flag[1] + 2, 34, 22, t, '#2b2b3a', (fx, fy) => {
      c.fillStyle = '#ffffff'; circ(c, fx + 1, fy, 4.6); c.fill(); c.beginPath(); c.moveTo(fx - 3, fy - 2.4); c.lineTo(fx - 2.4, fy - 7.4); c.lineTo(fx + 0.2, fy - 3.6); c.moveTo(fx + 1.8, fy - 3.6); c.lineTo(fx + 4.4, fy - 7.4); c.lineTo(fx + 5, fy - 2.4); c.fill();
      c.fillStyle = '#2b2b3a'; circ(c, fx - 0.8, fy - 0.4, 1.1); c.fill(); circ(c, fx + 2.8, fy - 0.4, 1.1); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx - 5, fy + 4); c.lineTo(fx + 7, fy + 9); c.moveTo(fx + 7, fy + 4); c.lineTo(fx - 5, fy + 9); c.stroke();
    });
  },
  icecave(c, x, y, t) {
    const pts = [[-66, -78, 0], [-10, -136, 1.4], [18, -150, 2.6], [70, -90, 3.3], [-86, -50, 4.4], [92, -46, 5.6]];
    for (const [dx, dy, ph] of pts) { const k = Math.sin(t * 2.2 + ph * 1.9); if (k > 0) twinkle(c, x + dx, y + dy, k * 2, '#ffffff'); }
  },
  purramid(c, x, y, t) {
    for (const bx of PURR.braziers) { glowAt(c, x + bx, y - 34, 26, '#ffa040', 0.45); flameLive(c, x + bx, y - 27, 0.9, t + bx); }
    const k = 0.3 + Math.sin(t * 2) * 0.12;
    for (const [ex, ey] of PURR.eyes) glowAt(c, x + ex, y + ey, 18, '#5fc8ff', k);
  },
  keep(c, x, y, t) {
    const k = 0.45 + Math.sin(t * 2.4) * 0.2, blink = (t % 5.3) < 0.14;
    for (const ix of KEEP.inner) for (const d of [-9, 9]) glowAt(c, x + ix + d, y + KEEP.innerEyes, 12, '#ffd84d', blink ? 0 : k);
    for (const ox of KEEP.outer) for (const d of [-9, 9]) glowAt(c, x + ox + d, y + KEEP.outerEyes, 12, '#ffd84d', blink ? 0 : k);
    for (const d of [-7.2, 7.2]) glowAt(c, x + d, y + KEEP.gateEyes, 10, '#ffd84d', k);
    for (const bx of KEEP.banners) bannerLive(c, x + bx, y - 102, 26, 58, t, '#c94a7a', (ex, ey) => drawFishBone(c, ex, ey, 7));
    for (const tx of KEEP.torches) { glowAt(c, x + tx, y - 66, 20, '#c070ff', 0.45); flameLive(c, x + tx, y - 60, 0.6, t, ['#8a3ad9', '#c070ff', '#f0d0ff']); }
  },
  kennel(c, x, y, t, b) {
    if (!b.opt.spooky) return;
    const open = (t + x * 0.01) % 4 > 0.18;
    if (open) for (const d of [-7, 7]) { glowAt(c, x + d, y - 22, 9, '#c8ff90', 0.5); c.fillStyle = '#e8ffb0'; c.beginPath(); c.ellipse(x + d, y - 22, 2.4, 1.7, 0, 0, TAU); c.fill(); }
  },
};
// draw one building: the baked sprite, then its live touches
function drawBld(c, b) {
  const s = bldSprite(b), t = S.time;
  if (b.bk === 'boat') {
    const bob = Math.sin(t * 1.5 + b.x * 0.01), ga = c.globalAlpha;
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.6;
    for (let i = 0; i < 2; i++) { const k = (t * 0.5 + i * 0.5) % 1; c.globalAlpha = ga * (1 - k) * 0.8; c.beginPath(); c.ellipse(b.x, b.y + 6, 84 + k * 18, 10 + k * 4, 0, 0.1, Math.PI - 0.1); c.stroke(); }
    c.globalAlpha = ga;
    c.save(); c.translate(b.x, b.y + bob * 2.2); c.rotate(Math.sin(t * 1.1 + b.x) * 0.02);
    c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    flagLive(c, 1.6, -150, 18, 11, t, '#e8475f');
    c.restore();
    return;
  }
  drawSprite(c, s, b.x, b.y, 1);
  const f = BldLive[b.bk];
  if (f) f(c, b.x, b.y, t, b);
}
