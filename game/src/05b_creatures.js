// Dogs, cats and critters: animated puppets drawn every frame, inked and cel shaded (see ART.md).
const BREEDS = {
  corgi: { name: 'Corgi', body: '#ee9c48', belly: '#fff4e2', ear: '#ee9c48', earType: 'point', snout: 'med', tail: 'fluffy', legLen: 0.7, bodyLen: 1.12, blaze: 1, cheekFluff: 1 },
  beagle: { name: 'Beagle', body: '#cf8d4c', belly: '#fffaf0', ear: '#99582c', earType: 'long', snout: 'med', tail: 'thin', saddle: '#3d2e2e', socks: 1, tip: '#fffaf0', blaze: 1 },
  husky: { name: 'Husky', body: '#8e9bb2', belly: '#ffffff', ear: '#8e9bb2', earType: 'point', snout: 'med', tail: 'curl', eye: '#4aa8e8', mask: '#ffffff', cheekFluff: 1 },
  golden: { name: 'Golden', body: '#e8b462', belly: '#f8dca6', ear: '#d99f4a', earType: 'flop', snout: 'med', tail: 'fluffy', cheekFluff: 1, chestFluff: 1 },
  dalmatian: { name: 'Dalmatian', body: '#ffffff', belly: '#ffffff', ear: '#2f2a33', earType: 'flop', snout: 'long', tail: 'thin', spots: '#2f2a33', eyeSpot: 1 },
  pug: { name: 'Pug', body: '#dcbd8c', belly: '#ecd4ab', ear: '#2f2a33', earType: 'fold', snout: 'short', tail: 'curl', mask: '#3b3036', legLen: 0.85, wrinkles: 1 },
  dachshund: { name: 'Dachshund', body: '#a8562f', belly: '#c47447', ear: '#7d3b1e', earType: 'long', snout: 'long', tail: 'thin', legLen: 0.58, bodyLen: 1.38 },
  poodle: { name: 'Poodle', body: '#f3cfae', belly: '#f8dfc6', ear: '#efc49f', earType: 'fluff', snout: 'long', tail: 'pom', fluff: 1 },
  // the folk of Barkadia
  lab: { body: '#3f3536', belly: '#4d4243', ear: '#352c2d', earType: 'flop', snout: 'med', tail: 'thin' },
  collie: { body: '#2f2a33', belly: '#ffffff', ear: '#2f2a33', earType: 'fold', snout: 'long', tail: 'fluffy', blaze: 1, socks: 1, tip: '#ffffff', chestFluff: 1 },
  bernese: { body: '#2f2a33', belly: '#ffffff', ear: '#2f2a33', earType: 'flop', snout: 'med', tail: 'fluffy', blaze: 1, cheeks: '#c97a3e', size: 1.15, chestFluff: 1 },
  newfie: { body: '#3a3238', belly: '#463c43', ear: '#30292e', earType: 'flop', snout: 'med', tail: 'fluffy', size: 1.25, cheekFluff: 1 },
  shepherd: { body: '#c98a4b', belly: '#e0b07a', ear: '#3b2b2b', earType: 'point', snout: 'long', tail: 'fluffy', saddle: '#3b2b2b', size: 1.1, muzzleDark: 1 },
  basset: { body: '#c98a4b', belly: '#fffaf0', ear: '#9a5a2e', earType: 'long', snout: 'long', tail: 'thin', legLen: 0.6, bodyLen: 1.28, saddle: '#4a3530', droopy: 1, blaze: 1 },
  chihuahua: { body: '#e8c08a', belly: '#f6dfbd', ear: '#e8c08a', earType: 'big', snout: 'short', tail: 'thin', size: 0.75 },
  shiba: { body: '#e48a3c', belly: '#fff3e0', ear: '#e48a3c', earType: 'point', snout: 'med', tail: 'curl', mask: '#fff3e0', cheekFluff: 1 },
  sheepdog: { body: '#dcdde4', belly: '#ffffff', ear: '#9aa0b0', earType: 'fluff', snout: 'short', tail: 'stub', shaggy: 1, size: 1.15, saddle: '#8a90a2', fringe: 1 },
  borzoi: { body: '#f1e8dc', belly: '#ffffff', ear: '#d8c4a8', earType: 'fold', snout: 'long', tail: 'thin', legLen: 1.2, spots: '#d8b88a' },
  greyhound: { body: '#8f8aa0', belly: '#c9c4d6', ear: '#7f7a90', earType: 'fold', snout: 'long', tail: 'thin', legLen: 1.2, bodyLen: 1.05 },
  terrier: { body: '#f2f0ea', belly: '#ffffff', ear: '#c98a4b', earType: 'fold', snout: 'med', tail: 'stub', saddle: '#c98a4b', shaggy: 1, size: 0.9, beard: 1 },
  puppy: { body: '#f2c27a', belly: '#fff3dc', ear: '#d99a4e', earType: 'flop', snout: 'short', tail: 'thin', size: 0.72 },
  saint: { body: '#ffffff', belly: '#ffffff', ear: '#b0602e', earType: 'flop', snout: 'med', tail: 'fluffy', saddle: '#b0602e', size: 1.3, droopy: 1, eyeSpot2: '#b0602e' },
};
for (const k in BREEDS) { const [r, g, b] = hexRgb(BREEDS[k].body); BREEDS[k].dark = r * 0.3 + g * 0.59 + b * 0.11 < 80; BREEDS[k].kind = 'dog'; }
const PLAYER_BREEDS = ['corgi', 'beagle', 'husky', 'golden', 'dalmatian', 'pug', 'dachshund', 'poodle'];

const CRITTERS = {
  squirrel: { kind: 'squirrel', body: '#c2703f', belly: '#f3d2a8', tail: '#c2703f' },
  graysquirrel: { kind: 'squirrel', body: '#8e8ea0', belly: '#e8e2ea', tail: '#8e8ea0' },
  cat: { kind: 'cat', body: '#9b9bab', belly: '#e9e6ee', stripes: '#6c6c7c', eye: '#9be04a' },
  ginger: { kind: 'cat', body: '#f09a4a', belly: '#fff0dc', stripes: '#c9682a', eye: '#9be04a' },
  blackcat: { kind: 'cat', body: '#3a3440', belly: '#4a4452', eye: '#ffd84d', dark: 1 },
  raccoon: { kind: 'raccoon', body: '#8a8496', belly: '#c9c4d2', mask: '#3a3440', ring: '#4a4452', eye: '#ffffff' },
  fox: { kind: 'fox', body: '#ef8a3c', belly: '#fff5e8', tip: '#ffffff', eye: '#3a2236', socks: '#4a3530' },
  snowfox: { kind: 'fox', body: '#f2f6ff', belly: '#ffffff', tip: '#dbe6f5', eye: '#4aa8e8' },
  skunk: { kind: 'skunk', body: '#2f2a36', belly: '#2f2a36', stripe: '#ffffff', eye: '#3a2236', dark: 1 },
  snowcat: { kind: 'cat', body: '#e4ecf6', belly: '#ffffff', spots: '#7f8aa0', eye: '#4aa8e8' },
  mummy: { kind: 'cat', body: '#efe3c4', belly: '#efe3c4', wraps: '#cdbf98', eye: '#7fff8a', glowEye: 1 },
  ghost: { kind: 'cat', body: '#d9d2ff', belly: '#efeaff', ghost: 1, eye: '#5a4a9a' },
  knight: { kind: 'cat', body: '#3a3440', belly: '#4a4452', eye: '#ffd84d', armor: '#c9ccd9', item: 'cutlass', dark: 1 },
  // bosses
  nutsworth: { kind: 'squirrel', body: '#b5602e', belly: '#f3d2a8', tail: '#b5602e', hat: 'crown', item: 'acorn' },
  whiskers: { kind: 'cat', body: '#f09a4a', belly: '#fff0dc', stripes: '#c9682a', eye: '#9be04a', hat: 'pirate', item: 'cutlass', patch: 1, coat: '#c93a4a' },
  snowball: { kind: 'cat', body: '#eef2f8', belly: '#ffffff', spots: '#6f7a90', eye: '#4aa8e8', scarf: '#4fb8e8', tailBig: 1 },
  cleocatra: { kind: 'cat', body: '#e8c08a', belly: '#f6dfbd', eye: '#3a8fd9', hat: 'nemes', goldCollar: 1, liner: 1 },
  mittens: { kind: 'cat', body: '#f6f4fa', belly: '#ffffff', patches: '#9a96aa', eye: '#c94ad9', hat: 'crown', cape: '#6a3fa8', fluffy: 1 },
};

// ---------- animation state kept on each creature (springs for ears and tails, gait phase, blinks, idle fidgets)
function newAnim() { return { lt: null, phase: Math.random() * 6, ear: 0, earV: 0, tail: 0, tailV: 0, hy: null, sq: 0, sqV: 0, blinkT: 1 + Math.random() * 4, blink: 0, fid: 0, fidT: 2 + Math.random() * 5, fidK: 0 }; }
function spring(A, k, target, dt, stiff, damp) {
  const v = k + 'V';
  A[v] += ((target - A[k]) * stiff - A[v] * damp) * dt;
  A[k] += A[v] * dt;
}

// ---------- the parts list: every part is drawn twice, first as one plum silhouette, then painted
function P_fill(path, col, o) { return Object.assign({ t: 'f', path, col }, o || {}); }
function P_line(path, w, col, o) { return Object.assign({ t: 's', path, w, col }, o || {}); }
let INK_LOD = 0;   // 0 full paint, 1 skip highlight bands, 2 flat fills (used for crowds far from the hero)
function drawParts(c, parts, ow, face) {
  // 1: the silhouette, with heavier ink on the lower right
  c.fillStyle = OUT; c.strokeStyle = OUT; c.lineJoin = 'round'; c.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    if (pass) { c.save(); c.translate(0.55 * face, 0.75); }
    for (const p of parts) {
      if (p.noSil) continue;
      p.path(c);
      if (p.t === 'f') { c.lineWidth = ow * (pass ? 1.5 : 2); c.stroke(); if (!pass) c.fill(); }
      else { c.lineWidth = p.w + ow * (pass ? 1.5 : 2); c.stroke(); }
    }
    if (pass) c.restore();
  }
  // 2: paint
  for (const p of parts) {
    if (p.pre) p.pre(c);
    if (!p.col) { if (p.post) p.post(c); continue; }
    p.path(c);
    if (p.t === 'f') {
      c.fillStyle = p.col; c.fill();
      if ((p.sh && INK_LOD < 2) || (p.hi && INK_LOD < 1) || p.paint) {
        c.save(); p.path(c); c.clip();
        if (p.sh && INK_LOD < 2) { c.fillStyle = p.sh; c.beginPath(); c.rect(-400, -400, 800, 800); c.save(); c.translate(-(p.so || 3.2) * face, -(p.so || 3.2) * 1.1); p.path(c, true); c.restore(); c.fill('evenodd'); }
        if (p.paint) p.paint(c);
        if (p.hi && INK_LOD < 1) { c.globalAlpha = 0.9; c.fillStyle = p.hi; c.beginPath(); c.rect(-400, -400, 800, 800); c.save(); c.translate((p.ho || 2.4) * face, (p.ho || 2.4) * 1.15); p.path(c, true); c.restore(); c.fill('evenodd'); c.globalAlpha = 1; }
        c.restore();
      }
      if (p.inner) { (p.innerPath || p.path)(c); c.lineWidth = ow * 0.62; c.strokeStyle = OUT; c.stroke(); }
    } else {
      c.lineWidth = p.w; c.strokeStyle = p.col; c.stroke();
      if (p.sh) { c.save(); c.translate(0.9 * face, 1.2); p.path(c); c.lineWidth = p.w * 0.45; c.strokeStyle = p.sh; c.globalAlpha = 0.9; c.stroke(); c.restore(); }
      if (p.paint) p.paint(c);
    }
    if (p.post) p.post(c);
  }
}
// a leg: a bendy capsule from hip or shoulder down to the paw
function legShape(c, ax, ay, fx, fy, bend, w0, w1, open) {
  const mx = (ax + fx) / 2, my = (ay + fy) / 2, dx = fx - ax, dy = fy - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const cx = mx + nx * bend, cy = my + ny * bend;
  const L = [], R = [], n = 5;
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const px = u * u * ax + 2 * u * t * cx + t * t * fx, py = u * u * ay + 2 * u * t * cy + t * t * fy;
    const tx = 2 * u * (cx - ax) + 2 * t * (fx - cx), ty = 2 * u * (cy - ay) + 2 * t * (fy - cy), tl = Math.hypot(tx, ty) || 1;
    const w = lerp(w0, w1, t) / 2;
    L.push([px - (ty / tl) * w, py + (tx / tl) * w]); R.push([px + (ty / tl) * w, py - (tx / tl) * w]);
  }
  const s0 = open ? 2 : 0;
  c.beginPath(); c.moveTo(L[s0][0], L[s0][1]);
  for (let i = s0 + 1; i <= n; i++) c.lineTo(L[i][0], L[i][1]);
  c.arc(fx, fy, w1 / 2, Math.atan2(L[n][1] - fy, L[n][0] - fx), Math.atan2(R[n][1] - fy, R[n][0] - fx), true);
  for (let i = n; i >= s0; i--) c.lineTo(R[i][0], R[i][1]);
  if (!open) c.closePath();
}

// ---------- the quadruped rig: dogs, cats, foxes, raccoons and the big bosses
// st: { face, t, move, run, pose, poseT, anim, hurt, sc, hat, item, collar, coat, cape, talk, pant, happy, angry, swim, look, tele, hop, sit, dig, roll, atk, alpha }
function drawQuad(c, x, y, Q, st) {
  const A = st.anim || (st.anim = newAnim());
  const t = st.t || 0;
  let dt = A.lt == null ? 0.016 : clamp(t - A.lt, 0, 0.05); A.lt = t;
  const dog = Q.kind === 'dog', fox = Q.kind === 'fox', rac = Q.kind === 'raccoon', skunk = Q.kind === 'skunk', ghost = Q.ghost;
  const size = (Q.size || 1) * (st.sc || 1), face = st.face || 1;
  const bl = Q.bodyLen || (dog ? 1 : 0.95), ll = Q.legLen || (dog ? 1 : 0.95), hr = dog ? 12.5 : 11.2;
  const ow = 2.35 / Math.sqrt(Math.max(1, size));
  let pose = st.pose || 'idle', pt = st.poseT || 0;
  if (st.roll >= 0 && st.roll !== undefined && !st.pose) { pose = 'roll'; pt = st.roll; }
  if (st.atk > 0 && !st.pose) { pose = 'atk1'; pt = st.atk; }
  if (st.tele > 0 && !st.pose) { pose = 'wind'; pt = st.tele; }
  if (st.sit && !st.pose) pose = 'sit';
  if (st.dig && !st.pose) pose = 'dig';
  const mv = clamp(st.move || 0, 0, 1.3);
  // gait
  const run = st.run || mv > 0.72;
  const stride = (dog ? 30 : 32) * bl;
  if (mv > 0.03) A.phase += dt * (run ? 14 : 10) * Math.min(1.15, 0.45 + mv * 0.75);
  const ph = A.phase;
  // blinking and little idle fidgets
  A.blinkT -= dt; if (A.blinkT < 0) { A.blink = 0.14; A.blinkT = 2.2 + Math.random() * 3.5; } A.blink = Math.max(0, A.blink - dt);
  A.fidT -= dt; if (A.fidT < 0 && mv < 0.05 && pose === 'idle') { A.fid = 1.2; A.fidK = (Math.random() * 3) | 0; A.fidT = 3 + Math.random() * 6; } A.fid = Math.max(0, A.fid - dt);
  const legH = 12 * ll;
  let by = -(legH + 7), rootX = 0, rootY = 0, rootRot = 0, pitch = 0, sqx = 1, sqy = 1;
  let hx = 13 * bl + 1, hy = -13, hrot = (st.look || 0) * 0.3;
  let mouth = 0, tongue = !!st.pant, eyes = st.happy ? 'happy' : 'open', brow = st.angry ? 1 : 0, earBack = 0, tailBase = dog ? -0.45 : -1.0, wagAmt = dog ? 0.32 : 0.12, wagSpd = st.wagFast ? 20 : 8;
  let tuck = 0, sitK = 0, digK = 0, legKick = 0, swimK = st.swim ? 1 : 0;
  // feet: [x offset from anchor, lift]
  const feet = [[0, 0], [0, 0], [0, 0], [0, 0]];   // 0 near front, 1 far front, 2 near hind, 3 far hind
  if (mv > 0.03 && pose !== 'roll') {
    if (run) {
      const offs = [Math.PI, Math.PI + 0.5, 0, 0.5];
      for (let i = 0; i < 4; i++) { const p = ph + offs[i]; feet[i] = [-Math.cos(p) * stride * 0.32 * Math.min(1, mv), Math.max(0, Math.sin(p)) * 7 * ll]; }
      pitch = Math.sin(ph) * 0.07; rootY = -Math.max(0, Math.sin(ph - 0.6)) * 3.2 * Math.min(1, mv);
      sqy = 1 + Math.sin(ph * 2) * 0.025; sqx = 2 - sqy;
      tailBase += 0.35; earBack = 0.35;
    } else {
      const offs = [0, Math.PI, Math.PI, 0];
      for (let i = 0; i < 4; i++) { const p = ph + offs[i]; feet[i] = [-Math.cos(p) * stride * 0.18, Math.max(0, Math.sin(p)) * 4.5 * ll]; }
      rootY = -(1 - Math.abs(Math.cos(ph))) * 1.4;
    }
  } else if (pose === 'idle') {
    // breathing
    const br = Math.sin(t * 2.6) * 0.5 + 0.5;
    sqy = 1 + br * 0.018; sqx = 1 - br * 0.008;
    if (A.fid > 0) { const k = Math.sin((1 - A.fid / 1.2) * Math.PI); if (A.fidK === 0) hrot += k * 0.18; else if (A.fidK === 1) { hy += k * 4; hrot += k * 0.35; } else { hrot -= k * 0.15; earBack -= k * 0.3; } }
  }
  // poses
  const E = (a, b) => clamp((pt - a) / (b - a), 0, 1), es = (v) => v * v * (3 - 2 * v);
  switch (pose) {
    case 'atk1': case 'atk2': {
      const up = pose === 'atk1' ? 1 : -1;
      const a = es(E(0, 0.28)), s = es(E(0.28, 0.55)), r = es(E(0.6, 1));
      rootX = -4 * a + 13 * s * (1 - r); hrot += (-0.4 * a + 0.85 * s) * up * (1 - r) - 0.1 * s;
      sqx = 1 - 0.06 * a + 0.1 * s * (1 - r); sqy = 2 - sqx; pitch = 0.08 * s * up * (1 - r);
      eyes = s > 0.2 && r < 0.6 ? 'fierce' : eyes; brow = 1;
      feet[0][0] += 8 * s * (1 - r); feet[2][0] -= 6 * s * (1 - r);
      break;
    }
    case 'atk3': {
      const a = es(E(0, 0.22)), j = E(0.22, 0.72), l = es(E(0.72, 1));
      rootX = -3 * a + 20 * es(j) * (1 - l * 0.4); rootY = -Math.sin(j * Math.PI) * 18;
      pitch = -0.25 * Math.sin(j * Math.PI * 0.5) + 0.25 * es(E(0.45, 0.72)) * (1 - l);
      hrot += -0.5 * a + 1.0 * es(E(0.4, 0.7)) * (1 - l);
      if (j > 0 && j < 1) { tuck = 0.5 * Math.sin(j * Math.PI); }
      const land = E(0.72, 0.85) * (1 - E(0.85, 1)); sqy = 1 - 0.14 * land + 0.08 * Math.sin(j * Math.PI); sqx = 2 - sqy;
      eyes = 'fierce'; brow = 1; earBack = 0.6;
      break;
    }
    case 'wind': {
      // anticipation: crouch back, then the strike comes
      const k = es(clamp(pt, 0, 1));
      rootX = -5 * k; sqy = 1 - 0.12 * k; sqx = 1 + 0.08 * k; hrot -= 0.1 * k; brow = 1; eyes = 'fierce'; earBack = 0.7 * k; tailBase += 0.4 * k; wagAmt = 0.05; by += 2 * k;
      break;
    }
    case 'hurt': { const k = Math.sin(clamp(pt, 0, 1) * Math.PI); rootX = -6 * k; hrot -= 0.35 * k; eyes = 'squint'; earBack = 0.8 * k; sqy = 1 - 0.08 * k; sqx = 1 + 0.06 * k; break; }
    case 'bark': { const k = Math.sin(clamp(pt, 0, 1) * Math.PI); hrot -= 0.3 * k; mouth = k; earBack = 0.9 * k; sqx = 1 + 0.08 * k; sqy = 1 - 0.04 * k; rootX = 3 * k; eyes = k > 0.3 ? 'fierce' : eyes; break; }
    case 'throw': { const a = es(E(0, 0.4)), s = es(E(0.4, 1)); hrot += 0.35 * a - 0.8 * s; rootX = -3 * a + 4 * s; break; }
    case 'howl': sitK = 1; hrot -= 1.05; mouth = 0.7; eyes = 'closed'; earBack = 0.5; break;
    case 'sit': sitK = 1; break;
    case 'dig': digK = 1; pitch = 0.32; hrot += 0.5; hy += 3; break;
    case 'belly': { rootRot = Math.PI * 0.82 * face; rootY = -legH - 12; legKick = 1; eyes = 'happy'; tongue = true; mouth = 0.5; tailBase = 0.4; break; }
    case 'faint': { sitK = 0; tuck = 0.9; by = -9; hy = -4; hrot = 0.35; eyes = 'closed'; tailBase = 0.9; wagAmt = 0.03; break; }
    case 'roll': { tuck = 1; rootRot = clamp(pt, 0, 1) * TAU * 1.25 * face; rootY = -2; eyes = 'squint'; break; }
    case 'swim': swimK = 1; break;
  }
  if (st.talk && Math.sin(t * 17) > -0.2) mouth = Math.max(mouth, 0.45);
  if (A.blink > 0 && eyes === 'open') eyes = 'blink';
  if (st.hurt > 0.3) eyes = 'squint';
  if (swimK) { rootY += 6; for (let i = 0; i < 4; i++) { const p = ph * 0.9 + i * 1.6; feet[i] = [Math.cos(p) * 6, 4 + Math.sin(p) * 3]; } }
  // springs: ears lag behind the head's bounce, the tail wags and swings
  const headWorldY = rootY + by + hy;
  if (A.hy == null) A.hy = headWorldY;
  const vy = (headWorldY - A.hy) / Math.max(dt, 0.001); A.hy = headWorldY;
  if (dt > 0) {
    spring(A, 'ear', clamp(-vy * 0.012, -0.6, 0.7) + earBack, dt, 220, 13);
    spring(A, 'tail', tailBase + Math.sin(t * wagSpd) * wagAmt + clamp(vy * 0.004, -0.3, 0.3), dt, 140, 9);
  }
  const earA = A.ear, tailA = A.tail;

  c.save();
  c.translate(x, y);
  if (st.alpha != null) c.globalAlpha *= st.alpha;
  if (swimK) { c.beginPath(); c.rect(-80 * size, -120 * size, 160 * size, 120 * size - 3); c.clip(); }
  c.scale(face * size, size);
  c.translate(rootX, rootY);
  if (rootRot) { c.translate(0, by + 4); c.rotate(rootRot); c.translate(0, -(by + 4)); }
  c.scale(sqx, sqy);
  if (pitch) { c.translate(0, by); c.rotate(pitch); c.translate(0, -by); }

  // geometry
  const T = tones(Q.body), Tb = tones(Q.belly), ear = Q.ear || Q.body;
  const fA = [9 * bl, by + 3], hA = [-10 * bl, by + 3];
  const legW0 = dog ? 7.5 : 6.2, legW1 = dog ? 5.8 : 4.8;
  const legCol = (i) => (Q.socks && dog ? Q.belly : Q.socks && fox ? Q.socks : Q.body);
  const parts = [];
  const legPath = (i) => {
    const front = i < 2, far = i % 2 === 1;
    const ax = (front ? fA[0] : hA[0]) + (far ? -2.5 : 0), ay = (front ? fA[1] : hA[1]) - (far ? 1.2 : 0);
    let fx = ax + feet[i][0] + (front ? 1 : -1), fy = -feet[i][1] - (far ? 1 : 0);
    if (tuck) { fx = lerp(fx, ax + (front ? -3 : 4), tuck); fy = lerp(fy, ay + 5, tuck); }
    if (sitK && !front) { fx = ax + 9; fy = -1; }
    if (sitK && front) { fx = ax + 2; fy = 0; }
    if (digK && front) { const p = t * 26 + (far ? Math.PI : 0); fx = ax + 6 + Math.cos(p) * 5; fy = -2 + Math.sin(p) * 4; }
    if (legKick) { const p = t * 14 + i * 1.7; fx = ax + Math.cos(p) * 4; fy = ay - 12 - Math.sin(p) * 4; }
    const bend = front ? -feet[i][1] * 0.5 - 0.5 : feet[i][1] * 0.35 + 1.5;
    const f = (cc, open) => legShape(cc, ax, ay - 3, fx, fy, sitK && !front ? -6 : bend, legW0, legW1, open === 'open');
    f.edge = (cc) => f(cc, 'open');
    return f;
  };
  const legCols = [legCol(0), shadeTone(legCol(1), 0.22), legCol(2), shadeTone(legCol(3), 0.22)];
  // far legs
  for (const i of [3, 1]) parts.push(P_fill(legPath(i), legCols[i]));
  // sitting hind thigh
  if (sitK) parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(hA[0] + 3, by + 6, 9, 7.5, -0.3, 0, TAU); }, Q.body, { sh: T.sh }));
  // tail
  const tx = -14 * bl, tyy = by - 3;
  const tailRot = (cc) => { cc.translate(tx, tyy); cc.rotate(tailA); };
  const tailPart = (pathFn, col, o) => P_fill((cc, inner) => { cc.save(); tailRot(cc); pathFn(cc); cc.restore(); }, col, o);
  const tailLine = (pathFn, w, col, o) => P_line((cc) => { cc.save(); tailRot(cc); pathFn(cc); cc.restore(); }, w, col, o);
  const tailKind = Q.tail || (fox ? 'bushy' : rac ? 'ringed' : skunk ? 'plume' : ghost ? 'wisp' : 'cat');
  switch (tailKind) {
    case 'fluffy': parts.push(tailPart((cc) => { cc.beginPath(); cc.ellipse(-4, -10, 6.5, 12.5, -0.35, 0, TAU); }, Q.body, { sh: T.sh, paint: Q.tip ? (cc) => { cc.save(); tailRot(cc); cc.fillStyle = Q.tip; cc.beginPath(); cc.ellipse(-7, -19, 5, 5.5, -0.35, 0, TAU); cc.fill(); cc.restore(); } : null })); break;
    case 'curl': parts.push(tailLine((cc) => { cc.beginPath(); cc.arc(1, -10, 7.5, Math.PI * 0.55, Math.PI * 2.25); }, 5.8, Q.body, { sh: T.sh })); break;
    case 'stub': parts.push(tailPart((cc) => { cc.beginPath(); cc.arc(-1, -2, 4.8, 0, TAU); }, Q.body)); break;
    case 'pom': parts.push(tailLine((cc) => { cc.beginPath(); cc.moveTo(0, 0); cc.lineTo(-3, -12); }, 3, Q.body)); parts.push(tailPart((cc) => { cc.beginPath(); cc.arc(-4, -16, 6.5, 0, TAU); }, Q.belly, { sh: Tb.sh })); break;
    case 'thin': parts.push(tailLine((cc) => { cc.beginPath(); cc.moveTo(0, 0); cc.quadraticCurveTo(-7, -8, -4, -19); }, 4, Q.body, { sh: T.sh, paint: Q.tip ? (cc) => { cc.save(); tailRot(cc); cc.fillStyle = Q.tip; cc.beginPath(); cc.arc(-4, -18, 2.6, 0, TAU); cc.fill(); cc.restore(); } : null })); break;
    case 'bushy': parts.push(tailPart((cc) => { cc.beginPath(); cc.ellipse(-12, -2, 15, 7.5, 0.25, 0, TAU); }, Q.body, { sh: T.sh, paint: (cc) => { cc.save(); tailRot(cc); cc.fillStyle = Q.tip; cc.beginPath(); cc.ellipse(-23, 0.5, 6, 6, 0, 0, TAU); cc.fill(); cc.restore(); } })); break;
    case 'ringed': parts.push(tailPart((cc) => { cc.beginPath(); cc.ellipse(-12, -2, 14, 6.5, 0.3, 0, TAU); }, Q.body, { sh: T.sh, paint: (cc) => { cc.save(); tailRot(cc); cc.rotate(0.3); cc.fillStyle = Q.ring; for (let i = -24; i < -2; i += 6) cc.fillRect(i, -9, 3, 18); cc.restore(); } })); break;
    case 'plume': parts.push(tailPart((cc) => { cc.beginPath(); cc.moveTo(0, 0); cc.bezierCurveTo(-14, -2, -18, -28, -4, -34); cc.bezierCurveTo(8, -38, 10, -24, 2, -22); cc.bezierCurveTo(-4, -18, -6, -8, 0, 0); }, Q.body, { paint: (cc) => { cc.save(); tailRot(cc); cc.strokeStyle = Q.stripe; cc.lineWidth = 4; cc.beginPath(); cc.moveTo(-3, -3); cc.bezierCurveTo(-11, -10, -12, -26, -2, -30); cc.stroke(); cc.restore(); } })); break;
    case 'wisp': parts.push(tailLine((cc) => { cc.beginPath(); cc.moveTo(0, 0); cc.quadraticCurveTo(-10, -2, -14, -12); }, 4, Q.body)); break;
    default: { const big = Q.tailBig || Q.fluffy ? 1.6 : 1; parts.push(tailLine((cc) => { cc.beginPath(); cc.moveTo(0, 0); cc.bezierCurveTo(-10, -4, -12, -16, -8, -24); cc.quadraticCurveTo(-5, -30, 0, -28); }, 4 * big, Q.body, { sh: T.sh, paint: Q.stripes || Q.spots ? (cc) => { cc.save(); tailRot(cc); cc.strokeStyle = Q.stripes || Q.spots; cc.lineWidth = 2; for (const [a, b] of [[-8, -6], [-11, -14], [-8, -22]]) { cc.beginPath(); cc.moveTo(a - 2.5 * big, b); cc.lineTo(a + 2.5 * big, b - 1); cc.stroke(); } cc.restore(); } : null })); }
  }
  // cape behind the body
  if (st.cape || Q.cape) {
    const capeCol = st.cape || Q.cape, fl = Math.sin(t * 9) * (2 + mv * 4);
    parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(9 * bl, by - 9); cc.quadraticCurveTo(-6 * bl, by - 13, -22 * bl - mv * 6, by + 2 + fl); cc.quadraticCurveTo(-16 * bl, by + 8 + fl * 0.5, -8 * bl, by + 5); cc.quadraticCurveTo(2, by - 1, 9 * bl, by - 2); cc.closePath(); }, capeCol, { sh: shadeTone(capeCol), so: 2.5 }));
  }
  // body
  const H = Q.fluffy ? 10.5 : 9.5, Lb = 15 * bl;
  const bodyPath = (cc) => {
    cc.beginPath();
    if (ghost) { cc.moveTo(-Lb, by + 3); cc.bezierCurveTo(-Lb, by - H - 2, Lb, by - H - 2, Lb + 1, by + 1); for (let i = 0; i <= 6; i++) cc.lineTo(Lb - i * (2 * Lb / 6), by + H + 2 + (i % 2 ? -4 : 2) + Math.sin(t * 6 + i) * 2); cc.closePath(); return; }
    cc.moveTo(-Lb, by - 1);
    cc.bezierCurveTo(-Lb, by - H - 1, -Lb * 0.4, by - H - 1.5, Lb * 0.2, by - H - 1);
    cc.bezierCurveTo(Lb * 0.75, by - H - 0.5, Lb + 2.5, by - H * 0.6, Lb + 2.5, by + 1);
    cc.bezierCurveTo(Lb + 2.5, by + H * 0.85, Lb * 0.4, by + H + 0.5, 0, by + H * 0.92);
    cc.bezierCurveTo(-Lb * 0.5, by + H, -Lb, by + H * 0.7, -Lb, by - 1);
    cc.closePath();
  };
  parts.push(P_fill(bodyPath, Q.body, { sh: T.sh, hi: T.hi, so: 3.5, paint: (cc) => {
    cc.fillStyle = Q.belly; cc.beginPath(); cc.ellipse(4 * bl, by + 8, 13 * bl, 5.5, 0, 0, TAU); cc.fill();
    if (Q.saddle) { cc.fillStyle = Q.saddle; cc.beginPath(); cc.ellipse(-3 * bl, by - 7.5, 12.5 * bl, 6.5, -0.05, 0, TAU); cc.fill(); }
    if (Q.spots && dog) { cc.fillStyle = Q.spots; for (const [sx, sy, r] of [[-9, -3, 2.6], [-2, -5.5, 2], [5, -1, 2.4], [-5, 3, 1.8], [10, -5, 1.6], [-13, 1, 1.5]]) { cc.beginPath(); cc.arc(sx * bl, by + sy, r, 0, TAU); cc.fill(); } }
    if (Q.stripes) { cc.strokeStyle = Q.stripes; cc.lineWidth = 2.4; for (let i = -10; i <= 8; i += 4.5) { cc.beginPath(); cc.moveTo(i, by - 10); cc.quadraticCurveTo(i + 2, by - 4, i - 0.5, by + 1); cc.stroke(); } }
    if (Q.spots && !dog) { cc.strokeStyle = Q.spots; cc.lineWidth = 1.7; for (const [a, b] of [[-9, -3], [-2, -5], [5, -2], [-5, 2], [9, 1]]) { cc.beginPath(); cc.arc(a, by + b, 2.2, 0.3, 5.6); cc.stroke(); } }
    if (Q.patches) { cc.fillStyle = Q.patches; cc.beginPath(); cc.ellipse(-6, by - 5, 6.5, 4.5, 0.2, 0, TAU); cc.fill(); }
    if (skunk) { cc.fillStyle = Q.stripe; cc.beginPath(); cc.ellipse(0, by - 8, 15, 2.8, 0, 0, TAU); cc.fill(); }
    if (Q.wraps) { cc.strokeStyle = Q.wraps; cc.lineWidth = 1.6; for (let i = -14; i <= 12; i += 4) { cc.beginPath(); cc.moveTo(i, by - 10); cc.lineTo(i + 5, by + 10); cc.stroke(); } }
    if (Q.shaggy || Q.fluffy) { cc.strokeStyle = shadeTone(Q.body, 0.12); cc.lineWidth = 1.3; for (let i = -12; i <= 10; i += 4.5) { cc.beginPath(); cc.moveTo(i * bl, by - 5); cc.quadraticCurveTo(i * bl + 2, by, i * bl, by + 5); cc.stroke(); } }
    if (Q.coat || st.coat) { const cc2 = st.coat || Q.coat; cc.fillStyle = cc2; cc.beginPath(); cc.rect(-Lb - 4, by - H - 4, Lb * 2 + 8, H + 7); cc.fill(); cc.fillStyle = shadeTone(cc2); cc.fillRect(-Lb - 4, by + 1, Lb * 2 + 8, 2.2); if (Q.coat) { cc.fillStyle = '#ffd84d'; cc.beginPath(); cc.arc(10, by - 3, 1.5, 0, TAU); cc.arc(10, by + 2, 1.5, 0, TAU); cc.fill(); } }
    if (Q.armor) { cc.fillStyle = Q.armor; cc.beginPath(); cc.ellipse(2, by - 1, 14, 8.5, 0, 0, TAU); cc.fill(); cc.fillStyle = lightTone(Q.armor, 0.5); cc.beginPath(); cc.ellipse(-2, by - 5, 8, 2.5, -0.1, 0, TAU); cc.fill(); cc.strokeStyle = shadeTone(Q.armor, 0.35); cc.lineWidth = 1.3; cc.beginPath(); cc.moveTo(-8, by - 7); cc.lineTo(-8, by + 6); cc.moveTo(3, by - 8); cc.lineTo(3, by + 8); cc.stroke(); }
  } }));
  // fur: a shaggy fringe under the belly, or a fluffy bib on the chest
  if (Q.fringe) parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(Lb * 0.8, by + 2); for (let i = 0; i <= 7; i++) cc.lineTo(Lb * 0.8 - i * 3.6 - 1.8, by + H - 0.5 + (i % 2 ? 3.5 : 0)); cc.lineTo(Lb * 0.8 - 26, by + 2); cc.closePath(); }, Q.body, { sh: T.sh }));
  if (Q.chestFluff || Q.fluffy) parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(Lb * 0.45, by - 3); cc.quadraticCurveTo(Lb + 6, by - 5, Lb + 4, by + 3); cc.lineTo(Lb + 1.5, by + 4.5); cc.lineTo(Lb + 3, by + 7); cc.lineTo(Lb - 1, by + 8); cc.lineTo(Lb - 1, by + 10.5); cc.lineTo(Lb - 5, by + 9); cc.quadraticCurveTo(Lb * 0.4, by + 6, Lb * 0.45, by - 3); cc.closePath(); }, Q.belly, { noSil: true }));
  // a few fur strokes so the coat reads as fur
  parts.push({ t: 'f', noSil: true, path: () => {}, post: (cc) => { const fc = shadeTone(Q.body, 0.16); for (const [fx, fy, a] of [[-Lb * 0.55, by - 6, 0.5], [-Lb * 0.2, by - 7.5, 0.4], [-Lb * 0.75, by - 1, 0.9]]) taperLine(cc, qpts(fx, fy, fx + 2, fy + 2, fx + 1 + a * 2, fy + 5, 4), 1.6, fc); } });
  // near legs
  for (const i of [2, 0]) { const lp = legPath(i); parts.push(P_fill(lp, legCols[i], { inner: true, innerPath: lp.edge, sh: shadeTone(legCols[i], 0.18), so: 1.8 })); }
  // collar
  if (st.collar || Q.goldCollar || Q.scarf) {
    const ccol = Q.goldCollar ? '#ffd84d' : Q.scarf || st.collar;
    const nx = hx - 8.5, ny = by + hy + 8.5;
    parts.push(P_fill((cc) => { cc.beginPath(); cc.save(); cc.translate(nx, ny); cc.rotate(0.55); rrect(cc, -3.4, -8.5, 6.8, 17, 3.4); cc.restore(); }, ccol, { inner: true, sh: shadeTone(ccol), so: 1.6 }));
    if (Q.scarf) parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(nx - 2, ny + 3); cc.quadraticCurveTo(nx - 10, ny + 8 + Math.sin(t * 8) * 2, nx - 16, ny + 4 + Math.sin(t * 8 + 1) * 3); cc.lineTo(nx - 13, ny + 1); cc.closePath(); }, Q.scarf, { inner: true }));
    if (!Q.scarf) parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(nx + 3.5, ny + 6, 2.6, 0, TAU); }, Q.goldCollar ? '#3a8fd9' : '#ffd84d', { inner: true, noSil: true, post: (cc) => { cc.fillStyle = 'rgba(255,255,255,0.8)'; cc.beginPath(); cc.arc(nx + 2.8, ny + 5.2, 0.9, 0, TAU); cc.fill(); } }));
  }
  // head (everything below is in head space)
  const HX = hx, HY = by + hy;
  const headT = (cc) => { cc.translate(HX, HY); cc.rotate(hrot); };
  const inHead = (fn) => (cc, inner) => { cc.save(); headT(cc); fn(cc, inner); cc.restore(); };
  const snx = Q.snout === 'long' ? 10.5 : Q.snout === 'short' ? 6.5 : dog ? 8.5 : fox ? 9 : 7.2;
  const srx = Q.snout === 'long' ? 9.5 : Q.snout === 'short' ? 5.6 : dog ? 7.6 : fox ? 8 : 6;
  const earCol = Q.ear || Q.body;
  const earShape = (cc, far) => {
    const k = far ? 1 : 1;
    const et = dog ? Q.earType : 'cat';
    cc.save();
    if (far) cc.translate(5.5, -0.5);
    switch (et) {
      case 'point': case 'big': case 'cat': {
        const big = et === 'big' ? 1.4 : et === 'cat' ? 1.0 : 1.08;
        cc.translate(-4, -hr + 5); cc.rotate(-earA * 0.35);
        cc.beginPath(); cc.moveTo(-5 * big, 2); cc.quadraticCurveTo(-4 * big, -9 * big, -0.5, -15 * big); cc.quadraticCurveTo(4 * big, -8 * big, 5.5 * big, 1); cc.closePath(); break;
      }
      case 'fold': cc.translate(-4, -hr + 5); cc.rotate(-earA * 0.4); cc.beginPath(); cc.moveTo(-5, 2); cc.quadraticCurveTo(-3, -9, 2, -10); cc.quadraticCurveTo(7, -9, 8, -3); cc.quadraticCurveTo(4, -5, 4.5, 1); cc.closePath(); break;
      case 'long': cc.translate(-3.5, -hr + 6); cc.rotate(0.12 + earA * 0.9); cc.beginPath(); cc.moveTo(-3, -1); cc.bezierCurveTo(-8, 4, -8, 16, -3, 20); cc.bezierCurveTo(1, 23, 5, 18, 4, 10); cc.bezierCurveTo(3.5, 4, 3, 0, 2, -2); cc.closePath(); break;
      case 'fluff': cc.translate(-4, -hr + 7); cc.rotate(0.1 + earA * 0.7); cc.beginPath(); for (const [ex, ey, r] of [[0, 2, 6], [-1, 8, 6.5], [0, 14, 5.5]]) { cc.moveTo(ex + r, ey); cc.arc(ex, ey, r, 0, TAU); } break;
      default: cc.translate(-3.5, -hr + 6); cc.rotate(0.25 + earA * 0.9); cc.beginPath(); cc.moveTo(-3, -1); cc.bezierCurveTo(-8, 3, -8, 12, -3, 14); cc.bezierCurveTo(1, 16, 4.5, 11, 4, 6); cc.bezierCurveTo(3.5, 2, 3, 0, 2, -2); cc.closePath();
    }
    cc.restore();
  };
  const innerEar = (cc) => { const et = dog ? Q.earType : 'cat'; if (et === 'point' || et === 'big' || et === 'cat') { const big = et === 'big' ? 1.4 : 1; cc.save(); cc.translate(-4, -hr + 5); cc.rotate(-earA * 0.35); cc.fillStyle = rac || skunk ? '#cfc8d8' : '#ffb1c1'; cc.beginPath(); cc.moveTo(-2.6 * big, 1); cc.quadraticCurveTo(-2.2 * big, -6 * big, -0.5, -10.5 * big); cc.quadraticCurveTo(2.2 * big, -5 * big, 3 * big, 1); cc.closePath(); cc.fill(); cc.restore(); } };
  // far ear
  parts.push(P_fill(inHead((cc) => earShape(cc, true)), shadeTone(earCol, 0.25)));
  // head and muzzle
  const headPath = (cc) => {
    cc.beginPath(); cc.arc(0, 0, hr, 0, TAU);
    if (Q.cheekFluff || Q.fluffy) { cc.moveTo(-hr + 3, 6); cc.arc(-hr + 6, 6, 5.5, 0, TAU); }
    if (fox) { cc.moveTo(2, 0); cc.ellipse(snx - 1, 2.5, srx + 2, 5, 0.08, 0, TAU); }
    else { cc.moveTo(snx + srx, 4); cc.ellipse(snx, 4, srx, dog ? 6 : 5, 0, 0, TAU); }
  };
  parts.push(P_fill(inHead(headPath), Q.body, { sh: T.sh, hi: T.hi, so: 3, inner: true, innerPath: inHead((cc) => { cc.beginPath(); cc.arc(0, 0, hr, Math.PI * 0.5, Math.PI * 1.12); }), paint: inHead((cc) => {
    if (dog && !Q.mask && !Q.blaze && !Q.muzzleDark) { cc.fillStyle = lightTone(Q.body, 0.32); cc.beginPath(); cc.ellipse(snx + 0.5, 4.6, srx - 0.5, 5.2, 0, 0, TAU); cc.fill(); }
    if (Q.mask && Q.mask !== '#ffffff' && Q.mask !== '#fff3e0') { cc.fillStyle = Q.mask; cc.beginPath(); cc.ellipse(snx - 1, 3, srx + 3, 8, 0, 0, TAU); cc.fill(); }
    else if (Q.mask) { cc.fillStyle = Q.mask; cc.beginPath(); cc.ellipse(4, 5, 11, 8, 0, 0, TAU); cc.fill(); cc.beginPath(); cc.ellipse(snx, 4, srx, 6, 0, 0, TAU); cc.fill(); }
    if (Q.blaze) { cc.fillStyle = Q.belly; cc.beginPath(); cc.moveTo(3, -hr); cc.quadraticCurveTo(9, -5, 7.5, 1); cc.lineTo(2.5, 1); cc.quadraticCurveTo(3.5, -5, 0.5, -hr); cc.fill(); cc.beginPath(); cc.ellipse(snx, 4.5, srx, 5.6, 0, 0, TAU); cc.fill(); }
    if (Q.cheeks) { cc.fillStyle = Q.cheeks; cc.beginPath(); cc.ellipse(4, 7, 6, 4, 0, 0, TAU); cc.fill(); }
    if (Q.eyeSpot) { cc.fillStyle = Q.spots; cc.beginPath(); cc.ellipse(3, -2.5, 5, 5.5, 0, 0, TAU); cc.fill(); }
    if (Q.eyeSpot2) { cc.fillStyle = Q.eyeSpot2; cc.beginPath(); cc.ellipse(1, -3, 6.5, 6, 0, 0, TAU); cc.fill(); }
    if (Q.shaggy) { cc.fillStyle = Q.belly; cc.beginPath(); cc.ellipse(-1, -7, 12, 6.5, 0, 0, TAU); cc.fill(); }
    if (Q.muzzleDark) { cc.fillStyle = '#3b2b2b'; cc.beginPath(); cc.ellipse(snx + 2, 3.5, srx - 1, 5.2, 0, 0, TAU); cc.fill(); }
    if (rac) { cc.fillStyle = Q.mask; cc.beginPath(); cc.ellipse(4, -2, 10.5, 4.6, 0, 0, TAU); cc.fill(); }
    if (Q.stripes) { cc.strokeStyle = Q.stripes; cc.lineWidth = 2.2; for (const i of [-4, 0, 4]) { cc.beginPath(); cc.moveTo(i - 2, -hr); cc.lineTo(i, -hr + 5); cc.stroke(); } }
    if (skunk) { cc.fillStyle = Q.stripe; cc.fillRect(-2, -hr, 4, 9); }
    if (Q.wraps) { cc.strokeStyle = Q.wraps; cc.lineWidth = 1.6; for (let i = -10; i <= 10; i += 4) { cc.beginPath(); cc.moveTo(-hr, i); cc.lineTo(hr, i + 3); cc.stroke(); } }
    if (!dog && !fox && !Q.mask) { cc.fillStyle = Q.belly; cc.beginPath(); cc.ellipse(snx, 4.5, srx, 4.6, 0, 0, TAU); cc.fill(); }
    if (fox) { cc.fillStyle = Q.belly; cc.beginPath(); cc.ellipse(snx, 5, srx, 3.2, 0.08, 0, TAU); cc.fill(); }
    if (Q.wrinkles) { cc.strokeStyle = shadeTone(Q.body, 0.3); cc.lineWidth = 1; cc.beginPath(); cc.moveTo(-2, -8); cc.quadraticCurveTo(2, -10, 6, -8); cc.moveTo(-1, -6); cc.quadraticCurveTo(2, -7.5, 5, -6); cc.stroke(); }
    if (Q.beard) { cc.fillStyle = Q.belly; cc.beginPath(); cc.moveTo(snx - 4, 6); cc.lineTo(snx + 5, 6); cc.lineTo(snx + 1, 13); cc.closePath(); cc.fill(); }
  }) }));
  // nose, mouth, eyes, blush
  const nosePart = P_fill(inHead((cc) => { cc.beginPath(); if (dog || fox) { const nx = snx + srx - 1.6 + (fox ? 2 : 0); cc.moveTo(nx - 3.2, 0.2); cc.quadraticCurveTo(nx, -1.8, nx + 3, 0.6); cc.quadraticCurveTo(nx + 1, 4, nx - 0.5, 3.4); cc.quadraticCurveTo(nx - 3, 3, nx - 3.2, 0.2); } else { cc.moveTo(snx + 1.5, 1.2); cc.lineTo(snx + 5.5, 1.2); cc.lineTo(snx + 3.5, 3.8); cc.closePath(); } }), dog || fox ? OUT : '#ff8fa8', { noSil: true, post: inHead((cc) => { if (dog || fox) { cc.fillStyle = 'rgba(255,255,255,0.75)'; cc.beginPath(); cc.ellipse(snx + srx - 2.3 + (fox ? 2 : 0), 0.4, 1.2, 0.7, -0.3, 0, TAU); cc.fill(); } }) });
  parts.push(nosePart);
  parts.push({ t: 'f', noSil: true, path: () => {}, post: inHead((cc) => {
    // mouth
    cc.strokeStyle = OUT; cc.lineWidth = 1.5; cc.lineCap = 'round';
    const mx = snx + (dog ? srx - 3 : 3.5);
    if (mouth > 0.08) {
      const o = mouth;
      cc.fillStyle = '#7a2f45'; cc.beginPath(); cc.moveTo(mx + 1, 5.5); cc.quadraticCurveTo(mx - 3, 6 + 7 * o, mx - 8, 5.5); cc.quadraticCurveTo(mx - 3, 6.5, mx + 1, 5.5); cc.fill(); cc.stroke();
      cc.fillStyle = '#ff8fa8'; cc.beginPath(); cc.ellipse(mx - 3.5, 6.5 + 4.5 * o, 2.6, 1.8 * o + 0.6, 0, 0, TAU); cc.fill();
    } else if (dog) {
      cc.beginPath(); cc.moveTo(mx, 5.2); cc.quadraticCurveTo(mx - 3, 8.8, mx - 7, 6.2); cc.stroke();
      if (tongue) { cc.fillStyle = '#ff7f9a'; cc.beginPath(); cc.ellipse(mx - 3, 9.5 + Math.sin(t * 11) * 0.8, 2.5, 3.6, 0.1, 0, TAU); cc.fill(); cc.lineWidth = 1.2; cc.stroke(); cc.beginPath(); cc.moveTo(mx - 3, 7.5); cc.lineTo(mx - 3, 10.5); cc.strokeStyle = '#d95f7a'; cc.stroke(); }
    } else {
      cc.beginPath(); cc.moveTo(snx + 3.5, 3.8); cc.lineTo(snx + 3.5, 5.2); cc.quadraticCurveTo(snx + 1.8, 7, snx, 5.6); cc.moveTo(snx + 3.5, 5.2); cc.quadraticCurveTo(snx + 5.2, 7, snx + 7, 5.6); cc.stroke();
    }
    if (!dog && !fox) { cc.strokeStyle = 'rgba(59,34,53,0.65)'; cc.lineWidth = 0.9; for (const d of [-1.2, 1.4]) { cc.beginPath(); cc.moveTo(snx + 4.5, 3 + d); cc.lineTo(snx + 15, 1.5 + d * 2.2); cc.stroke(); } }
    // eyes
    const ex = dog ? 3.2 : 3, ey = -2.6;
    const ec = Q.eye || null;
    cc.lineWidth = 1.7; cc.strokeStyle = OUT;
    if (Q.droopy && eyes === 'open') { cc.fillStyle = shadeTone(Q.body, 0.25); cc.beginPath(); cc.ellipse(ex, ey + 2.6, 4.2, 2.6, 0, 0, TAU); cc.fill(); }
    if (Q.patch) { cc.fillStyle = '#2b2b3a'; cc.beginPath(); cc.ellipse(ex, ey, 4.2, 3.6, 0, 0, TAU); cc.fill(); cc.beginPath(); cc.moveTo(-hr + 1, -6); cc.lineTo(hr - 2, -1); cc.lineWidth = 1.4; cc.strokeStyle = '#2b2b3a'; cc.stroke(); }
    else if (eyes === 'happy' || eyes === 'closed') { cc.beginPath(); if (eyes === 'happy') cc.arc(ex, ey + 1.2, 2.8, Math.PI * 1.1, Math.PI * 1.9); else { cc.moveTo(ex - 2.8, ey + 0.5); cc.quadraticCurveTo(ex, ey + 2.2, ex + 2.8, ey + 0.5); } cc.lineWidth = 2; cc.stroke(); }
    else if (eyes === 'squint') { cc.beginPath(); cc.moveTo(ex - 2.6, ey - 2.2); cc.lineTo(ex + 1.6, ey); cc.lineTo(ex - 2.6, ey + 2.2); cc.lineWidth = 2; cc.stroke(); }
    else if (eyes === 'blink') { cc.beginPath(); cc.moveTo(ex - 2.8, ey + 0.4); cc.lineTo(ex + 2.8, ey + 0.4); cc.lineWidth = 2; cc.stroke(); }
    else {
      const fierce = eyes === 'fierce';
      if (dog) {
        if (Q.dark) { cc.fillStyle = '#e8dde4'; cc.beginPath(); cc.ellipse(ex, ey, 4.2, 5, 0, 0, TAU); cc.fill(); }
        cc.fillStyle = ec || '#2a1a26'; cc.beginPath(); cc.ellipse(ex, ey + (fierce ? 0.6 : 0), 3.2, fierce ? 2.9 : 4.0, 0, 0, TAU); cc.fill();
        if (ec) { cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.arc(ex + 0.5, ey, 1.6, 0, TAU); cc.fill(); }
      } else {
        cc.fillStyle = Q.glowEye ? '#c8ffcc' : ec || '#9be04a'; cc.beginPath(); cc.ellipse(ex, ey, 3.5, fierce ? 2.4 : 3.1, -0.15, 0, TAU); cc.fill(); cc.stroke();
        cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.ellipse(ex + 0.5, ey, 0.95, fierce ? 2 : 2.6, 0, 0, TAU); cc.fill();
        if (Q.liner) { cc.beginPath(); cc.moveTo(ex + 3.4, ey); cc.lineTo(ex + 7, ey - 1.5); cc.lineWidth = 1.6; cc.stroke(); }
        if (Q.glowEye) glow(cc, ex, ey, 8, '#7fff8a', 0.5);
      }
      cc.fillStyle = '#ffffff'; cc.beginPath(); cc.arc(ex + 1.1, ey - 1.5, dog ? 1.3 : 0.95, 0, TAU); cc.fill();
      cc.beginPath(); cc.arc(ex - 0.9, ey + 1.3, 0.5, 0, TAU); cc.fill();
      if (fierce || brow || !dog) { cc.beginPath(); cc.moveTo(ex - 3.5, ey - 4.6 - (fierce ? 0 : 0.6)); cc.lineTo(ex + 3, ey - (fierce ? 3 : 4.2)); cc.lineWidth = 1.8; cc.strokeStyle = OUT; cc.stroke(); }
    }
    // blush
    cc.fillStyle = 'rgba(255,120,150,0.32)'; cc.beginPath(); cc.ellipse(-1.5, 5.5, 3.2, 2, 0, 0, TAU); cc.fill();
  }) });
  // near ear on top
  parts.push(P_fill(inHead((cc) => earShape(cc, false)), earCol, { inner: !(dog && Q.earType === 'fluff'), sh: shadeTone(earCol, 0.2), so: 2, paint: inHead(innerEar) }));
  // hat and the thing in its mouth
  const hat = st.hat || Q.hat;
  if (hat) parts.push({ t: 'f', noSil: true, path: () => {}, post: inHead((cc) => drawHat(cc, hat, hat === 'scarf' ? -6 : 0, hat === 'scarf' ? hr - 10 : -hr + 2)) });
  const item = st.item || Q.item;
  if (item) parts.push({ t: 'f', noSil: true, path: () => {}, post: inHead((cc) => { if (item === 'acorn') return; drawMouthItem(cc, item, snx + srx - 3, 9); }) });

  drawParts(c, parts, ow, face);
  c.restore();
  // ripples when paddling
  if (swimK) {
    c.save(); c.translate(x, y);
    const k = (t * 1.4) % 1;
    c.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.8})`; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(0, -4, (20 + k * 16) * size * bl, (5 + k * 4) * size, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(0, -4, 20 * size * bl, 5 * size, 0, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
    c.restore();
  }
}

// the old names still work
function drawDog(c, x, y, L, st) { drawQuad(c, x, y, L, st); }
function drawCritter(c, x, y, S, st) {
  if (S.kind === 'squirrel') return drawSquirrel(c, x, y, S, st);
  drawQuad(c, x, y, S, st);
}

// ---------- squirrels: hoppy, with a huge tail
function drawSquirrel(c, x, y, S, st) {
  const A = st.anim || (st.anim = newAnim());
  const t = st.t || 0, mv = st.move || 0, face = st.face || 1, sc = st.sc || 1;
  let dt = A.lt == null ? 0.016 : clamp(t - A.lt, 0, 0.05); A.lt = t;
  if (mv > 0.03) A.phase += dt * 11;
  const hopK = mv > 0.03 ? Math.abs(Math.sin(A.phase)) : 0;
  const hop = hopK * 7 * Math.min(1, mv + 0.3);
  const land = mv > 0.03 ? Math.max(0, 1 - Math.abs(Math.sin(A.phase)) * 4) : 0;
  const tele = st.tele || 0;
  spring(A, 'tail', -hop * 0.03 + Math.sin(t * 3) * 0.08 - tele * 0.3, dt, 120, 8);
  A.blinkT -= dt; if (A.blinkT < 0) { A.blink = 0.14; A.blinkT = 2 + Math.random() * 3; } A.blink = Math.max(0, A.blink - dt);
  const T = tones(S.body), Tt = tones(S.tail || S.body);
  c.save(); c.translate(x, y); c.scale(face * sc, sc);
  c.translate(-tele * 3, -hop);
  const sq = 1 + land * 0.12 - tele * 0.08;
  c.scale(2 - sq, sq);
  const by = -14;
  const parts = [];
  // tail made of puffs, one outline
  parts.push(P_fill((cc) => { cc.save(); cc.translate(-8, by); cc.rotate(A.tail); cc.beginPath(); for (const [a, b, r] of [[-6, -6, 8], [-10, -16, 10], [-6, -28, 11], [3, -34, 9], [-12, -24, 7]]) { cc.moveTo(a + r, b); cc.arc(a, b, r, 0, TAU); } cc.restore(); }, S.tail || S.body, { sh: Tt.sh, hi: Tt.hi, so: 3.5, paint: (cc) => { cc.save(); cc.translate(-8, by); cc.rotate(A.tail); cc.strokeStyle = shadeTone(S.tail || S.body, 0.15); cc.lineWidth = 1.3; for (const [a, b] of [[-10, -12], [-8, -22], [0, -30]]) { cc.beginPath(); cc.moveTo(a - 3, b); cc.quadraticCurveTo(a, b + 3, a + 3, b); cc.stroke(); } cc.restore(); } }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(-3, -2.5, 6, 3, 0, 0, TAU); }, shadeTone(S.body, 0.2)));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(1, by, 10, 9.5, -0.4, 0, TAU); }, S.body, { sh: T.sh, hi: T.hi, paint: (cc) => { cc.fillStyle = S.belly; cc.beginPath(); cc.ellipse(5, by + 2, 5, 6.5, -0.4, 0, TAU); cc.fill(); } }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(5, -2.5, 5.5, 3, 0, 0, TAU); }, S.body, { inner: true }));
  // head
  const hx = 7 + tele * 2, hy = by - 11 + tele * 2;
  parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(hx - 4, hy - 8, 3.6, 0, TAU); }, shadeTone(S.body, 0.25)));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(hx, hy, 8.5, 0, TAU); cc.moveTo(hx + 10, hy + 2.5); cc.ellipse(hx + 6, hy + 2.5, 4.5, 3.8, 0, 0, TAU); }, S.body, { sh: T.sh, hi: T.hi, paint: (cc) => { cc.fillStyle = S.belly; cc.beginPath(); cc.ellipse(hx + 5, hy + 3, 4.5, 3.4, 0, 0, TAU); cc.fill(); } }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(hx - 2, hy - 8, 3.4, 0, TAU); }, S.body, { inner: true, paint: (cc) => { cc.fillStyle = '#e8a8a0'; cc.beginPath(); cc.arc(hx - 2, hy - 8, 1.6, 0, TAU); cc.fill(); } }));
  parts.push({ t: 'f', noSil: true, path: () => {}, post: (cc) => {
    cc.fillStyle = OUT; cc.beginPath(); cc.arc(hx + 9.2, hy + 1, 1.7, 0, TAU); cc.fill();
    cc.fillStyle = '#fff'; cc.fillRect(hx + 6.5, hy + 5, 2.2, 3); cc.strokeStyle = OUT; cc.lineWidth = 0.9; cc.strokeRect(hx + 6.5, hy + 5, 2.2, 3);
    if (A.blink > 0) { cc.beginPath(); cc.moveTo(hx, hy - 2); cc.lineTo(hx + 4, hy - 2); cc.lineWidth = 1.8; cc.stroke(); }
    else { cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.ellipse(hx + 2, hy - 2, 2.2, 2.6, 0, 0, TAU); cc.fill(); cc.fillStyle = '#fff'; cc.beginPath(); cc.arc(hx + 2.8, hy - 2.9, 0.85, 0, TAU); cc.fill(); }
    cc.beginPath(); cc.moveTo(hx - 1.5, hy - 6.2 + tele); cc.lineTo(hx + 4, hy - 4.6); cc.lineWidth = 1.6; cc.strokeStyle = OUT; cc.stroke();
    cc.fillStyle = 'rgba(255,120,150,0.3)'; cc.beginPath(); cc.ellipse(hx + 1, hy + 3.5, 2.6, 1.6, 0, 0, TAU); cc.fill();
    if (S.hat) drawHat(cc, S.hat, hx, hy - 7);
  } });
  // paws and an acorn
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(10, by + 1, 3.5, 2.5, 0, 0, TAU); }, S.body, { inner: true }));
  if (S.item === 'acorn' || tele > 0) parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(13, by - 1, 3.6, 4.3, 0, 0, TAU); }, '#b5773e', { inner: true, sh: '#8f5a2a', so: 1.4, post: (cc) => { cc.fillStyle = '#7a4f2a'; cc.beginPath(); cc.ellipse(13, by - 4.2, 4.3, 2.2, 0, 0, TAU); cc.fill(); cc.lineWidth = 1.2; cc.strokeStyle = OUT; cc.stroke(); } }));
  drawParts(c, parts, 2.3 / Math.sqrt(Math.max(1, sc)), face);
  c.restore();
}

// ---------- the odd ones out
function drawBee(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, face = st.face || 1, tele = st.tele || 0;
  c.save(); c.translate(x, y - 26 + Math.sin(t * 6) * 3); c.scale(face * sc, sc);
  c.rotate(tele * -0.3);
  const fl = Math.sin(t * 46);
  // wings (see-through, no outline merge)
  c.fillStyle = 'rgba(235,248,255,0.75)'; c.strokeStyle = 'rgba(59,34,53,0.7)'; c.lineWidth = 1.3;
  c.save(); c.rotate(-0.6 + fl * 0.5); c.beginPath(); c.ellipse(-2, -10, 5, 10, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
  const parts = [
    P_fill((cc) => { cc.beginPath(); cc.ellipse(0, 0, 11.5, 9, 0, 0, TAU); cc.moveTo(-10, -1); cc.lineTo(-17, 1); cc.lineTo(-10, 3.5); }, '#ffd23f', { sh: '#e8a52a', hi: '#fff09a', paint: (cc) => { cc.fillStyle = '#3a2236'; cc.fillRect(-6, -10, 3.5, 20); cc.fillRect(0.5, -10, 3.5, 20); } }),
    P_fill((cc) => { cc.beginPath(); cc.arc(8, -2, 6, 0, TAU); }, '#3a2236', { inner: true, post: (cc) => { cc.fillStyle = '#fff'; cc.beginPath(); cc.arc(10, -3.5, 1.4, 0, TAU); cc.fill(); cc.strokeStyle = OUT; cc.lineWidth = 1.4; cc.beginPath(); cc.moveTo(7, -7); cc.quadraticCurveTo(8, -14, 12, -14); cc.stroke(); cc.beginPath(); cc.moveTo(5, -7); cc.lineTo(10, -5.5); cc.stroke(); } }),
  ];
  drawParts(c, parts, 2.2, face);
  c.fillStyle = 'rgba(235,248,255,0.85)'; c.strokeStyle = 'rgba(59,34,53,0.7)';
  c.save(); c.rotate(0.3 - fl * 0.5); c.beginPath(); c.ellipse(3, -10, 4.5, 9, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
}
function drawCrab(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, mv = st.move || 0, tele = st.tele || 0;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  const snap = tele > 0 ? Math.sin(t * 30) * 0.3 : Math.sin(t * 3) * 0.1;
  const scut = Math.sin(t * 16) * 2 * mv;
  c.translate(scut, -Math.abs(scut) * 0.3);
  const parts = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = Math.sin(t * 16 + i + s) * 2.5 * mv; parts.push(P_line((cc) => { cc.beginPath(); cc.moveTo(s * 8, -8 + i * 2); cc.lineTo(s * (16 + i * 2), -5 + i * 3 + w); cc.lineTo(s * (18 + i * 2), 0); }, 2.4, '#d9493c')); }
  for (const s of [-1, 1]) parts.push(P_fill((cc) => { cc.save(); cc.translate(s * 13, -16 - tele * 3); cc.rotate(s * (-0.4 + snap - tele * 0.4)); cc.beginPath(); cc.ellipse(s * 4, -6, 7, 5.5, 0, 0, TAU); cc.moveTo(s * 4, -8); cc.lineTo(s * 12, -13); cc.lineTo(s * 10, -6); cc.restore(); }, '#e8584a', { inner: true, sh: '#c03c3a' }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(0, -11, 15, 9.5, 0, 0, TAU); }, '#e8584a', { sh: '#c03c3a', hi: '#ff9a7e', so: 3 }));
  for (const s of [-1, 1]) parts.push(P_line((cc) => { cc.beginPath(); cc.moveTo(s * 4, -18); cc.lineTo(s * 5, -24); }, 2, '#e8584a', { noSil: true }));
  for (const s of [-1, 1]) parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(s * 5, -25, 3.2, 0, TAU); }, '#ffffff', { inner: true, post: (cc) => { cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.arc(s * 5 + 0.6, -25, 1.4, 0, TAU); cc.fill(); } }));
  parts.push({ t: 'f', noSil: true, path: () => {}, post: (cc) => { cc.strokeStyle = OUT; cc.lineWidth = 1.5; cc.beginPath(); cc.arc(0, -10, 3, 0.3, Math.PI - 0.3); cc.stroke(); } });
  drawParts(c, parts, 2.3, 1);
  c.restore();
}
function drawGull(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, alt = st.alt != null ? st.alt : 34, face = st.face || 1;
  c.save(); c.translate(x, y - alt); c.scale(face * sc, sc);
  const fl = Math.sin(t * 10);
  c.rotate((st.tele || 0) * 0.35);
  const parts = [
    P_fill((cc) => { cc.beginPath(); cc.moveTo(-2, -4); cc.quadraticCurveTo(-10, -18 * fl - 4, -24, -11 * fl - 2); cc.quadraticCurveTo(-12, -2, -2, 2); }, '#d9dfe9', { sh: '#b7c0d2' }),
    P_fill((cc) => { cc.beginPath(); cc.ellipse(0, 0, 13, 7.5, 0, 0, TAU); cc.moveTo(-12, -1); cc.lineTo(-20, -4); cc.lineTo(-19, 3.5); cc.moveTo(16, -5); cc.arc(11, -5, 6, 0, TAU); }, '#ffffff', { sh: '#d6dceb', paint: (cc) => { cc.fillStyle = '#9aa3b5'; cc.beginPath(); cc.moveTo(-12, -1); cc.lineTo(-20, -4); cc.lineTo(-19, 3.5); cc.fill(); } }),
    P_fill((cc) => { cc.beginPath(); cc.moveTo(15, -6.5); cc.lineTo(24, -3.5); cc.lineTo(15, -2); cc.closePath(); }, '#ffc23a', { inner: true, paint: (cc) => { cc.fillStyle = '#e8473b'; cc.beginPath(); cc.arc(21, -3.3, 1.2, 0, TAU); cc.fill(); } }),
    P_fill((cc) => { cc.beginPath(); cc.moveTo(2, -2); cc.quadraticCurveTo(8, -16 * fl - 6, 19, -9 * fl - 6); cc.quadraticCurveTo(10, -2, 2, 2); }, '#c9d1de', { inner: true, sh: '#a8b2c6', paint: (cc) => { cc.fillStyle = '#5a5f78'; cc.beginPath(); cc.moveTo(14, -7 * fl - 6); cc.lineTo(19, -9 * fl - 6); cc.lineTo(15, -5 * fl - 4); cc.fill(); } }),
    { t: 'f', noSil: true, path: () => {}, post: (cc) => { cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.arc(12.5, -7, 1.4, 0, TAU); cc.fill(); cc.strokeStyle = OUT; cc.lineWidth = 1.4; cc.beginPath(); cc.moveTo(10, -10); cc.lineTo(15, -8.5); cc.stroke(); } },
  ];
  drawParts(c, parts, 2.2, face);
  c.restore();
}
function drawScorpion(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, mv = st.move || 0, face = st.face || 1, strike = st.tele > 0 ? st.tele : 0;
  c.save(); c.translate(x, y); c.scale(face * sc, sc);
  const parts = [];
  for (let i = 0; i < 4; i++) { const w = Math.sin(t * 16 + i * 1.3) * 2.2 * mv; parts.push(P_line((cc) => { cc.beginPath(); cc.moveTo(-6 + i * 4.5, -6); cc.quadraticCurveTo(-8 + i * 5 + w, -9, -9 + i * 5.5 + w, 0); }, 2.2, '#9a5a2e')); }
  const segs = 5, tail = [];
  for (let i = 0; i <= segs; i++) { const k = i / segs, a = -Math.PI * 0.15 - k * Math.PI * (1.05 - strike * 0.25) + Math.sin(t * 3 + k) * 0.06; tail.push([-11 + Math.cos(a) * 4 - k * 10 * (1 - k) + Math.sin(k * Math.PI) * -6 + strike * k * 10, -9 + Math.sin(a) * 22 * k]); }
  for (let i = 0; i < segs; i++) { const [px, py] = tail[i + 1]; parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(px, py, 4.8 - i * 0.3, 4.2 - i * 0.3, 0, 0, TAU); }, '#c47a3e', { inner: true, sh: '#9a5a2e', so: 1.6 })); }
  const [sx, sy] = tail[segs];
  parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(sx - 3, sy - 2); cc.quadraticCurveTo(sx + 6, sy - 6, sx + 7, sy + 4); cc.quadraticCurveTo(sx + 2, sy + 1, sx - 3, sy + 2); }, '#5a3a2e', { inner: true }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.ellipse(0, -8, 13.5, 7, 0, 0, TAU); }, '#c47a3e', { sh: '#9a5a2e', hi: '#e0a060', so: 2.5 }));
  for (const s of [0, 1]) parts.push(P_fill((cc) => { cc.save(); cc.translate(12, -9 + s * 3); cc.rotate(-0.3 + s * 0.4 + Math.sin(t * 4 + s) * 0.1); cc.beginPath(); cc.ellipse(6, 0, 6.5, 3.8, 0, 0, TAU); cc.moveTo(10, -2); cc.lineTo(16, -4); cc.lineTo(12, 1); cc.restore(); }, s ? '#b06a34' : '#c47a3e', { inner: true }));
  parts.push({ t: 'f', noSil: true, path: () => {}, post: (cc) => { cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.arc(9, -11, 1.5, 0, TAU); cc.arc(6, -11.5, 1.3, 0, TAU); cc.fill(); } });
  drawParts(c, parts, 2.3, face);
  c.restore();
}
function drawBat(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, face = st.face || 1;
  c.save(); c.translate(x, y - 30 + Math.sin(t * 5) * 4); c.scale(face * sc, sc);
  const fl = Math.sin(t * 16);
  const parts = [];
  for (const s of [-1, 1]) parts.push(P_fill((cc) => { cc.beginPath(); cc.moveTo(0, -2); cc.quadraticCurveTo(s * 10, -13 * fl - 4, s * 23, -6 * fl); cc.quadraticCurveTo(s * 17, -1, s * 19, 4); cc.quadraticCurveTo(s * 13, 0, s * 10, 4); cc.quadraticCurveTo(s * 6, 1, 0, 3); cc.closePath(); }, s > 0 ? '#5a4a78' : '#4a3d66', { sh: '#3e3256' }));
  parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(0, 0, 8.5, 0, TAU); cc.moveTo(-6, -5); cc.lineTo(-4.5, -13); cc.lineTo(-1, -6); cc.moveTo(6, -5); cc.lineTo(4.5, -13); cc.lineTo(1, -6); }, '#6a5a8a', { sh: '#54477a', hi: '#8576a8', post: (cc) => { cc.fillStyle = '#ffd84d'; cc.beginPath(); cc.arc(-3, -1, 2, 0, TAU); cc.arc(3, -1, 2, 0, TAU); cc.fill(); cc.fillStyle = OUT; cc.beginPath(); cc.arc(-2.6, -1, 0.9, 0, TAU); cc.arc(3.4, -1, 0.9, 0, TAU); cc.fill(); cc.fillStyle = '#fff'; cc.beginPath(); cc.moveTo(-1.5, 3); cc.lineTo(-0.8, 5.5); cc.lineTo(0, 3); cc.moveTo(0.5, 3); cc.lineTo(1.2, 5.5); cc.lineTo(2, 3); cc.fill(); } }));
  drawParts(c, parts, 2.2, face);
  c.restore();
}
function drawVacbot(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, face = st.face || 1, suck = st.tele > 0;
  c.save(); c.translate(x, y); c.scale(face * sc, sc);
  c.translate(0, -Math.abs(Math.sin(t * 9)) * 1.2 * (st.move || 0));
  const parts = [
    P_line((cc) => { cc.beginPath(); cc.moveTo(6, -22); cc.quadraticCurveTo(24, -32, 27, -10); }, 5.5, '#7f8aa0', { sh: '#5f6a82' }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, 20, -11, 15, 9, 3); }, '#5a5f78', { inner: true }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, -17, -36, 32, 32, 13); cc.moveTo(-12, -34); cc.lineTo(-9, -44); cc.lineTo(-3, -35); cc.moveTo(3, -35); cc.lineTo(9, -44); cc.lineTo(12, -34); }, '#9b7fd6', { sh: '#7a5fb8', hi: '#c0a8f0', so: 3.5 }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, -12, -29, 23, 11, 5.5); }, '#2b2b3a', { inner: true, post: (cc) => { const col = suck ? '#ff5a5a' : '#7fffd0'; cc.fillStyle = col; cc.beginPath(); cc.arc(-5, -23.5, 2.2, 0, TAU); cc.arc(4, -23.5, 2.2, 0, TAU); cc.fill(); glow(cc, -0.5, -23.5, 12, col, 0.35); } }),
  ];
  for (const wx of [-9, 7]) parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(wx, -4, 5.2, 0, TAU); }, '#3a3440', { inner: true, post: (cc) => { cc.strokeStyle = '#6a6478'; cc.lineWidth = 1.2; cc.beginPath(); const a = t * 8; cc.moveTo(wx + Math.cos(a) * 3.5, -4 + Math.sin(a) * 3.5); cc.lineTo(wx - Math.cos(a) * 3.5, -4 - Math.sin(a) * 3.5); cc.stroke(); } }));
  drawParts(c, parts, 2.3, face);
  if (suck) { c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 1.8; for (let i = 0; i < 4; i++) { const p = (t * 3 + i / 4) % 1; c.beginPath(); c.arc(29 + (1 - p) * 34, -6, 7 * (1 - p) + 2, -1, 1); c.stroke(); } }
  c.restore();
}
function drawDreadVacuum(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, face = st.face || 1, angry = st.tele > 0;
  c.save(); c.translate(x, y); c.scale(face * sc, sc);
  c.translate(Math.sin(t * 30) * 0.8, 0);
  const parts = [
    P_line((cc) => { cc.beginPath(); cc.moveTo(18, -40); cc.quadraticCurveTo(62, -62, 66, -14); }, 11, '#7f8aa0', { sh: '#5f6a82' }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, 52, -19, 36, 17, 6); }, '#5a5f78', { inner: true, sh: '#454a62' }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, -47, -72, 82, 64, 22); cc.moveTo(-41, -69); cc.lineTo(-35, -90); cc.lineTo(-23, -71); cc.moveTo(19, -71); cc.lineTo(29, -90); cc.lineTo(33, -69); }, '#6a3fa8', { sh: '#4f2c86', hi: '#8f63cc', so: 5 }),
    P_fill((cc) => { cc.beginPath(); rrect(cc, -31, -46, 58, 23, 10); }, '#2b2b3a', { inner: true, post: (cc) => { const col = angry ? '#ff5a5a' : '#ffd84d'; cc.fillStyle = col; for (const ex of [-14, 12]) { cc.beginPath(); cc.ellipse(ex, -34.5, 6.5, 5.5, 0, 0, TAU); cc.fill(); } cc.fillStyle = OUT; for (const ex of [-14, 12]) { cc.beginPath(); cc.ellipse(ex, -34.5, 1.7, 4.4, 0, 0, TAU); cc.fill(); } glow(cc, -1, -34, 34, col, 0.3); } }),
  ];
  for (const wx of [-34, 0, 26]) parts.push(P_fill((cc) => { cc.beginPath(); cc.arc(wx, -6, 9.5, 0, TAU); }, '#3a3440', { inner: true, post: (cc) => { cc.fillStyle = '#9a96aa'; cc.beginPath(); cc.arc(wx, -6, 3.2, 0, TAU); cc.fill(); } }));
  drawParts(c, parts, 3, face);
  c.restore();
}

// the squeaky ball spirit who follows the hero around
function drawSqueaky(c, x, y, t, talk) {
  const by = Math.sin(t * 3) * 4, sq = 1 + Math.sin(t * 6) * 0.04;
  c.save(); c.translate(x, y + by);
  glow(c, 0, 0, 26 + Math.sin(t * 5) * 3, '#fff0a0', 0.45);
  c.scale(2 - sq, sq);
  const parts = [P_fill((cc) => { cc.beginPath(); cc.arc(0, 0, 10, 0, TAU); }, '#d9ee4a', { sh: '#b5cc32', hi: '#f2ff9a', so: 2.6, paint: (cc) => { cc.lineWidth = 2; cc.strokeStyle = '#ffffff'; cc.beginPath(); cc.arc(-5.5, 0, 10, -0.95, 0.95); cc.stroke(); cc.beginPath(); cc.arc(5.5, 0, 10, Math.PI - 0.95, Math.PI + 0.95); cc.stroke(); } })];
  parts.push({ t: 'f', noSil: true, path: () => {}, post: (cc) => {
    cc.fillStyle = '#2a1a26'; cc.beginPath(); cc.ellipse(-3.2, -2, 1.5, 1.9, 0, 0, TAU); cc.ellipse(3.2, -2, 1.5, 1.9, 0, 0, TAU); cc.fill();
    cc.fillStyle = '#fff'; cc.beginPath(); cc.arc(-2.7, -2.7, 0.6, 0, TAU); cc.arc(3.7, -2.7, 0.6, 0, TAU); cc.fill();
    cc.fillStyle = 'rgba(255,120,150,0.4)'; cc.beginPath(); cc.ellipse(-5.5, 1.5, 2, 1.2, 0, 0, TAU); cc.ellipse(5.5, 1.5, 2, 1.2, 0, 0, TAU); cc.fill();
    cc.strokeStyle = OUT; cc.lineWidth = 1.4; cc.fillStyle = '#7a2f45';
    cc.beginPath(); if (talk && Math.sin(t * 18) > 0) { cc.ellipse(0, 3.4, 2, 1.7, 0, 0, TAU); cc.fill(); } else { cc.arc(0, 1.8, 2.4, 0.2, Math.PI - 0.2); cc.stroke(); }
  } });
  drawParts(c, parts, 2.2, 1);
  c.restore();
  // a little sparkle now and then
  const k = (t * 0.7) % 1;
  if (k < 0.25) { const a = k / 0.25; c.fillStyle = `rgba(255,250,200,${Math.sin(a * Math.PI)})`; c.save(); c.translate(x + 9, y + by - 9); c.rotate(a * 2); c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.2 : 4; c.lineTo(Math.cos((i / 8) * TAU) * r, Math.sin((i / 8) * TAU) * r); } c.fill(); c.restore(); }
}

// ---------- hats and things to carry in the mouth (inked and shaded)
function hatFill(c, col) { c.fillStyle = col; c.fill(); c.lineWidth = 1.9; c.strokeStyle = OUT; c.stroke(); }
function drawHat(c, id, x, y) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (id) {
    case 'party': c.beginPath(); c.moveTo(-8, 0); c.lineTo(1, -20); c.lineTo(9, 0); c.closePath(); hatFill(c, '#4fb8e8'); c.save(); c.clip(); c.fillStyle = '#3b9ad0'; c.fillRect(2, -22, 10, 24); c.fillStyle = '#ffd84d'; for (const [a, b] of [[-3, -5], [3, -9], [-1, -13], [4, -3]]) { c.beginPath(); c.arc(a, b, 1.5, 0, TAU); c.fill(); } c.restore(); c.beginPath(); c.arc(1, -21, 3.2, 0, TAU); hatFill(c, '#ff6f8f'); break;
    case 'bandana': c.beginPath(); c.moveTo(-11, 2); c.quadraticCurveTo(0, -12, 11, 1); c.lineTo(6, 3); c.quadraticCurveTo(0, -4, -6, 3); c.closePath(); hatFill(c, '#e8475f'); c.fillStyle = '#fff'; for (const [a, b] of [[-4, -3], [2, -5], [6, -1]]) { c.beginPath(); c.arc(a, b, 1.1, 0, TAU); c.fill(); } c.beginPath(); c.moveTo(-11, 2); c.lineTo(-17, 7); c.lineTo(-13, -1); c.closePath(); hatFill(c, '#c93a4a'); break;
    case 'pirate': c.beginPath(); c.moveTo(-17, -2); c.quadraticCurveTo(-10, -19, 0, -17); c.quadraticCurveTo(10, -19, 17, -2); c.quadraticCurveTo(0, -7, -17, -2); hatFill(c, '#2b2b3a'); c.strokeStyle = '#ffd84d'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-15, -3.5); c.quadraticCurveTo(0, -8, 15, -3.5); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -11, 2.8, 0, TAU); c.fill(); c.fillStyle = OUT; c.beginPath(); c.arc(-1, -11.5, 0.7, 0, TAU); c.arc(1, -11.5, 0.7, 0, TAU); c.fill(); break;
    case 'wizard': { const sway = Math.sin((typeof S !== 'undefined' ? S.time : 0) * 3) * 1.5; c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-2, -6, 0 + sway, -30); c.quadraticCurveTo(6 + sway, -34, 13 + sway, -30); c.quadraticCurveTo(5 + sway, -26, 5, -20); c.quadraticCurveTo(6, -6, 13, 0); c.closePath(); hatFill(c, '#6a4fc9'); c.save(); c.clip(); c.fillStyle = '#5a3fb0'; c.fillRect(2, -36, 16, 40); c.restore(); c.beginPath(); c.ellipse(0, 0, 16, 4, 0, 0, TAU); hatFill(c, '#5a3fb0'); c.fillStyle = '#ffd84d'; c.beginPath(); c.arc(-2, -13, 2, 0, TAU); c.arc(4, -21, 1.5, 0, TAU); c.fill(); break; }
    case 'beanie': c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-12, -16, 0, -16); c.quadraticCurveTo(12, -16, 12, 1); c.closePath(); hatFill(c, '#4fa8a0'); c.strokeStyle = '#3d8a83'; c.lineWidth = 1.2; for (let i = -8; i <= 8; i += 4) { c.beginPath(); c.moveTo(i, -2); c.lineTo(i * 0.8, -13); c.stroke(); } c.beginPath(); rrect(c, -13, -3, 26, 6, 3); hatFill(c, '#3d8a83'); c.beginPath(); c.arc(0, -18, 4.2, 0, TAU); hatFill(c, '#fff'); break;
    case 'crown': c.beginPath(); c.moveTo(-10, 0); c.lineTo(-11, -14); c.lineTo(-5, -7); c.lineTo(0, -16); c.lineTo(5, -7); c.lineTo(11, -14); c.lineTo(10, 0); c.closePath(); hatFill(c, '#ffd84d'); c.save(); c.clip(); c.fillStyle = '#f2b52a'; c.fillRect(2, -18, 12, 20); c.restore(); c.fillStyle = '#e8475f'; c.beginPath(); c.arc(0, -5, 2.2, 0, TAU); c.fill(); c.fillStyle = '#4f7fd9'; c.beginPath(); c.arc(-6, -4, 1.4, 0, TAU); c.arc(6, -4, 1.4, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-0.7, -5.7, 0.7, 0, TAU); c.fill(); break;
    case 'cone': c.beginPath(); c.moveTo(-6, 4); c.lineTo(-22, -16); c.lineTo(22, -16); c.lineTo(6, 4); c.closePath(); c.fillStyle = 'rgba(245,245,255,0.72)'; c.fill(); c.lineWidth = 1.9; c.strokeStyle = OUT; c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-17, -13); c.lineTo(-5, 1); c.stroke(); break;
    case 'viking': c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-12, -15, 0, -15); c.quadraticCurveTo(12, -15, 12, 1); c.closePath(); hatFill(c, '#a7a8b8'); c.fillStyle = '#c9cad8'; c.beginPath(); c.ellipse(-4, -9, 4, 2.5, -0.4, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -8); c.quadraticCurveTo(s * 20, -10, s * 20, -22); c.quadraticCurveTo(s * 15, -14, s * 9, -12); c.closePath(); hatFill(c, '#fff6e0'); } c.beginPath(); rrect(c, -13, -2, 26, 5, 2.5); hatFill(c, '#8a7a6a'); break;
    case 'sombrero': c.beginPath(); c.ellipse(0, -2, 22, 5, 0, 0, TAU); hatFill(c, '#e8b84a'); c.beginPath(); c.moveTo(-9, -3); c.quadraticCurveTo(-8, -18, 0, -18); c.quadraticCurveTo(8, -18, 9, -3); c.closePath(); hatFill(c, '#f2c85a'); c.strokeStyle = '#e8475f'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-8.5, -6); c.lineTo(8.5, -6); c.stroke(); c.strokeStyle = '#4fa86a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8.5, -8.2); c.lineTo(8.5, -8.2); c.stroke(); break;
    case 'chef': c.beginPath(); rrect(c, -9, -10, 18, 10, 2); hatFill(c, '#fff'); c.beginPath(); for (const [a, b, r] of [[-6, -14, 6], [0, -18, 7], [6, -14, 6]]) { c.moveTo(a + r, b); c.arc(a, b, r, 0, TAU); } hatFill(c, '#fff'); c.fillStyle = '#e4e4f0'; c.beginPath(); c.arc(3, -12, 4, 0, TAU); c.fill(); break;
    case 'tophat': c.beginPath(); c.ellipse(0, -1, 14, 3.5, 0, 0, TAU); hatFill(c, '#2b2b3a'); c.beginPath(); c.rect(-8, -20, 16, 19); hatFill(c, '#2b2b3a'); c.fillStyle = '#e8475f'; c.fillRect(-8, -6, 16, 3); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-6, -18, 3, 11); break;
    case 'flower': for (const [ox, col] of [[-4, '#ff8fb4'], [5, '#ffd84d']]) { c.fillStyle = col; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.beginPath(); c.arc(ox + Math.cos(a) * 3.6, -3 + Math.sin(a) * 3.6, 2.8, 0, TAU); c.fill(); } c.fillStyle = col === '#ffd84d' ? '#e8743b' : '#ffd84d'; c.beginPath(); c.arc(ox, -3, 2.2, 0, TAU); c.fill(); } break;
    case 'halo': c.beginPath(); c.ellipse(0, -10, 10, 3, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#ffd84d'; c.stroke(); break;
    case 'helm': c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(-13, -15, 0, -16); c.quadraticCurveTo(13, -15, 12, 3); c.closePath(); hatFill(c, '#c9ccd9'); c.fillStyle = '#e8ebf5'; c.beginPath(); c.ellipse(-4, -9, 4, 2.6, -0.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(0, -16); c.quadraticCurveTo(-8, -26, -17, -22); c.lineWidth = 4; c.strokeStyle = '#e8475f'; c.stroke(); break;
    case 'nemes': c.beginPath(); c.moveTo(-15, 22); c.lineTo(-14, 2); c.quadraticCurveTo(-13, -12, 0, -13); c.quadraticCurveTo(12, -12, 12, -2); c.quadraticCurveTo(4, -5, -4, -2); c.lineTo(-6, 22); c.closePath(); hatFill(c, '#3a7fd9'); c.save(); c.clip(); c.strokeStyle = '#ffd84d'; c.lineWidth = 2; for (let i = -16; i <= 12; i += 4) { c.beginPath(); c.moveTo(i, -14); c.lineTo(i - 2, 24); c.stroke(); } c.restore(); c.beginPath(); c.moveTo(-6, -12); c.quadraticCurveTo(0, -21, 6, -12); c.lineWidth = 2.6; c.strokeStyle = '#ffd84d'; c.stroke(); break;
    case 'scarf': c.beginPath(); rrect(c, -10, 8, 20, 6, 3); hatFill(c, '#4fb8e8'); break;
  }
  c.restore();
}
function drawMouthItem(c, id, x, y) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  const stick = (col, hl) => { c.beginPath(); c.moveTo(-10, 1); c.lineTo(18, -2); c.lineWidth = 6.4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.6; c.strokeStyle = col; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = hl; c.beginPath(); c.moveTo(-8, -0.2); c.lineTo(15, -2.8); c.stroke(); };
  switch (id) {
    case 'stick': stick('#a8763f', '#d0a06a'); c.beginPath(); c.moveTo(10, -1); c.lineTo(14, -6); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#a8763f'; c.stroke(); c.fillStyle = '#5fb848'; c.beginPath(); c.ellipse(15.5, -7.5, 3.4, 2, 0.5, 0, TAU); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); break;
    case 'bone': drawBone(c, 4, 0, 24, 0, '#fff6e0', 1.8); break;
    case 'squeaky': c.beginPath(); c.moveTo(-6, 0); c.lineTo(10, 0); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = '#8a5a34'; c.stroke(); c.beginPath(); rrect(c, 8, -8, 12, 16, 4); c.fillStyle = '#ff6f8f'; c.fill(); c.lineWidth = 1.9; c.strokeStyle = OUT; c.stroke(); c.fillStyle = '#ffa0b8'; c.fillRect(10, -6, 3, 12); break;
    case 'chicken': c.beginPath(); c.ellipse(6, 0, 12, 4.5, 0, 0, TAU); hatFill(c, '#ffd84d'); c.beginPath(); c.arc(18, -2, 4, 0, TAU); hatFill(c, '#ffd84d'); c.fillStyle = '#e8475f'; c.beginPath(); c.moveTo(19, -6); c.lineTo(21, -9); c.lineTo(22, -5); c.fill(); c.fillStyle = '#f08a2a'; c.beginPath(); c.moveTo(22, -2); c.lineTo(26, -1); c.lineTo(22, 0); c.fill(); c.fillStyle = OUT; c.beginPath(); c.arc(19, -3, 0.8, 0, TAU); c.fill(); break;
    case 'frisbee': c.beginPath(); c.ellipse(10, -2, 13, 5, -0.2, 0, TAU); hatFill(c, '#4fb8e8'); c.beginPath(); c.ellipse(10, -3, 8, 2.8, -0.2, 0, TAU); c.lineWidth = 1.3; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(5, -4, 4, 1.2, -0.2, 0, TAU); c.fill(); break;
    case 'scepter': drawBone(c, 6, 0, 26, 0, '#ffd84d', 1.8); c.fillStyle = '#e8475f'; c.beginPath(); c.arc(6, 0, 2.6, 0, TAU); c.fill(); glow(c, 6, 0, 10, '#ffd84d', 0.3); break;
    case 'icicle': c.beginPath(); c.moveTo(-6, -2); c.lineTo(26, 0); c.lineTo(-6, 3); c.closePath(); hatFill(c, '#bfe8fa'); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-4, -1, 18, 1.2); glow(c, 10, 0, 12, '#bfe8fa', 0.25); break;
    case 'rib': c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(10, -10, 26, -2); c.lineWidth = 6.4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.6; c.strokeStyle = '#fbe9b8'; c.stroke(); c.fillStyle = '#3a8fd9'; c.beginPath(); c.arc(10, -4, 2.4, 0, TAU); c.fill(); break;
    case 'golden': stick('#ffd84d', '#fff6b0'); glow(c, 6, -1, 18, '#ffd84d', 0.35); break;
    case 'cutlass': c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(14, -6, 30, -12); c.quadraticCurveTo(18, -2, -4, 4); c.closePath(); hatFill(c, '#d8dce8'); c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0.5); c.quadraticCurveTo(14, -4, 26, -10); c.stroke(); c.beginPath(); rrect(c, -9, -3, 7, 7, 2); hatFill(c, '#ffd84d'); break;
    case 'letter': c.beginPath(); c.rect(2, -6, 16, 11); hatFill(c, '#fff6e0'); c.beginPath(); c.moveTo(2, -6); c.lineTo(10, 0); c.lineTo(18, -6); c.lineWidth = 1.2; c.stroke(); break;
    case 'ball': c.beginPath(); c.arc(8, -1, 6, 0, TAU); hatFill(c, '#c9e84a'); c.beginPath(); c.arc(4, -1, 6, -0.9, 0.9); c.lineWidth = 1.4; c.strokeStyle = '#fff'; c.stroke(); break;
  }
  c.restore();
}

// a white flash when something is hit: draw it on a scratch canvas, whiten it there, then copy it over
const Flash = { c: null };
function flashDraw(c, x, y, w, h, k, fn) {
  if (!(k > 0.04)) return fn(c);
  const m = c.getTransform(), a = Math.hypot(m.a, m.b) || 1;
  const pw = Math.ceil(w * a), ph = Math.ceil(h * a);
  if (!Flash.c || Flash.c.width < pw || Flash.c.height < ph) { Flash.c = mkCanvas(Math.max(pw, 256), Math.max(ph, 256)); }
  const f = Flash.c, g = f.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw + 2, ph + 2);
  g.setTransform(a, 0, 0, a, -(x - w / 2) * a, -(y - h) * a);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.globalAlpha = c.globalAlpha;
  fn(g);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(255,255,255,${clamp(k, 0, 1) * 0.85})`; g.fillRect(0, 0, pw, ph); g.globalCompositeOperation = 'source-over';
  const ga = c.globalAlpha; c.globalAlpha = 1;
  c.drawImage(f, 0, 0, pw, ph, x - w / 2, y - h, w, h);
  c.globalAlpha = ga;
}
