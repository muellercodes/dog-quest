// Dogs, cats and critters, drawn live every frame so they can wag, bob and roll.
const BREEDS = {
  corgi: { name: 'Corgi', body: '#eb9d4c', belly: '#fff4e2', ear: '#eb9d4c', earType: 'point', snout: 'med', tail: 'fluffy', legLen: 0.72, bodyLen: 1.12, blaze: 1 },
  beagle: { name: 'Beagle', body: '#c98a4b', belly: '#fffaf0', ear: '#9a5a2e', earType: 'long', snout: 'med', tail: 'thin', saddle: '#3b2b2b', socks: 1, tip: '#fffaf0' },
  husky: { name: 'Husky', body: '#8e9bb0', belly: '#ffffff', ear: '#8e9bb0', earType: 'point', snout: 'med', tail: 'curl', eye: '#4aa8e8', mask: '#ffffff' },
  golden: { name: 'Golden', body: '#e6b562', belly: '#f7dca4', ear: '#d9a24e', earType: 'flop', snout: 'med', tail: 'fluffy' },
  dalmatian: { name: 'Dalmatian', body: '#ffffff', belly: '#ffffff', ear: '#2f2a33', earType: 'flop', snout: 'long', tail: 'thin', spots: '#2f2a33' },
  pug: { name: 'Pug', body: '#dcbd8c', belly: '#ecd4ab', ear: '#2f2a33', earType: 'fold', snout: 'short', tail: 'curl', mask: '#3b3036', legLen: 0.85 },
  dachshund: { name: 'Dachshund', body: '#a5552e', belly: '#c47447', ear: '#7d3b1e', earType: 'long', snout: 'long', tail: 'thin', legLen: 0.6, bodyLen: 1.35 },
  poodle: { name: 'Poodle', body: '#f3cfae', belly: '#f8dfc6', ear: '#efc49f', earType: 'fluff', snout: 'long', tail: 'pom', fluff: 1 },
  // breeds for the folk of Barkadia
  lab: { body: '#3f3536', belly: '#4d4243', ear: '#352c2d', earType: 'flop', snout: 'med', tail: 'thin' },
  collie: { body: '#2f2a33', belly: '#ffffff', ear: '#2f2a33', earType: 'fold', snout: 'long', tail: 'fluffy', blaze: 1, socks: 1, tip: '#ffffff' },
  bernese: { body: '#2f2a33', belly: '#ffffff', ear: '#2f2a33', earType: 'flop', snout: 'med', tail: 'fluffy', blaze: 1, cheeks: '#c97a3e', size: 1.15 },
  newfie: { body: '#3a3238', belly: '#463c43', ear: '#30292e', earType: 'flop', snout: 'med', tail: 'fluffy', size: 1.25 },
  shepherd: { body: '#c98a4b', belly: '#e0b07a', ear: '#3b2b2b', earType: 'point', snout: 'long', tail: 'fluffy', saddle: '#3b2b2b', size: 1.1 },
  basset: { body: '#c98a4b', belly: '#fffaf0', ear: '#9a5a2e', earType: 'long', snout: 'long', tail: 'thin', legLen: 0.62, bodyLen: 1.25, saddle: '#4a3530', droopy: 1 },
  chihuahua: { body: '#e8c08a', belly: '#f6dfbd', ear: '#e8c08a', earType: 'big', snout: 'short', tail: 'thin', size: 0.75 },
  shiba: { body: '#e48a3c', belly: '#fff3e0', ear: '#e48a3c', earType: 'point', snout: 'med', tail: 'curl', mask: '#fff3e0' },
  sheepdog: { body: '#dcdde4', belly: '#ffffff', ear: '#9aa0b0', earType: 'fluff', snout: 'short', tail: 'stub', shaggy: 1, size: 1.15, saddle: '#8a90a2' },
  borzoi: { body: '#f1e8dc', belly: '#ffffff', ear: '#d8c4a8', earType: 'fold', snout: 'long', tail: 'thin', legLen: 1.2, spots: '#d8b88a' },
  greyhound: { body: '#8f8aa0', belly: '#c9c4d6', ear: '#7f7a90', earType: 'fold', snout: 'long', tail: 'thin', legLen: 1.2, bodyLen: 1.05 },
  terrier: { body: '#f2f0ea', belly: '#ffffff', ear: '#c98a4b', earType: 'fold', snout: 'med', tail: 'stub', saddle: '#c98a4b', shaggy: 1, size: 0.9 },
  puppy: { body: '#f2c27a', belly: '#fff3dc', ear: '#d99a4e', earType: 'flop', snout: 'short', tail: 'thin', size: 0.72 },
  saint: { body: '#ffffff', belly: '#ffffff', ear: '#b0602e', earType: 'flop', snout: 'med', tail: 'fluffy', saddle: '#b0602e', size: 1.3, droopy: 1 },
};
for (const k in BREEDS) { const [r, g, b] = hexRgb(BREEDS[k].body); BREEDS[k].dark = r * 0.3 + g * 0.59 + b * 0.11 < 80; }
const PLAYER_BREEDS = ['corgi', 'beagle', 'husky', 'golden', 'dalmatian', 'pug', 'dachshund', 'poodle'];

function legPath(c, x, y, len, w, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); rrect(c, -w / 2, 0, w, len, w / 2); c.restore();
}

// st: { face, t, move, atk, roll, hurt, swim, sc, hat, item, collar, talk, sit, dig, look (0..1 up/down) }
function drawDog(c, x, y, L, st) {
  const sc = (st.sc || 1) * (L.size || 1), bl = L.bodyLen || 1, ll = L.legLen || 1, t = st.t || 0, mv = st.move || 0;
  c.save(); c.translate(x, y);
  if (st.roll >= 0 && st.roll !== undefined) { drawDogBall(c, L, st, sc); c.restore(); return; }
  c.scale((st.face || 1) * sc, sc);
  const bob = mv > 0.05 ? Math.abs(Math.sin(t * 13)) * 2.2 * mv : Math.sin(t * 2.4) * 0.6;
  const lunge = st.atk > 0 ? Math.sin(st.atk * Math.PI) * 7 : 0;
  c.translate(lunge, 0);
  if (st.swim) { c.beginPath(); c.rect(-60, -80, 120, 80 - 11); c.clip(); c.translate(0, 7); }
  const legH = 12 * ll, by = -legH - 7 - bob;           // body centre y
  const hx = 13 * bl + 1, hy = by - 13 + (st.dig ? 9 : 0) + (st.atk > 0 ? -2 : 0), hr = 12;
  const swing = Math.sin(t * 13) * 0.55 * mv;
  const far = shade(L.body, -0.18), sock = L.socks ? L.belly : null;
  // far legs
  if (!st.sit) {
    legPath(c, -9 * bl + 3, by + 3, legH + bob, 6, -swing); fo(c, sock ? shade(sock, -0.12) : far, 2.2);
    legPath(c, 8 * bl + 3, by + 3, legH + bob, 6, swing); fo(c, sock ? shade(sock, -0.12) : far, 2.2);
  }
  // tail
  const wag = Math.sin(t * (st.wagFast ? 22 : 9)) * (st.wagFast ? 0.6 : 0.35);
  c.save(); c.translate(-13 * bl, by - 3); c.rotate(-0.5 + wag);
  switch (L.tail) {
    case 'fluffy': c.beginPath(); c.ellipse(-3, -9, 6, 12, -0.3, 0, TAU); fo(c, L.body, 2.4); if (L.tip) { c.beginPath(); c.ellipse(-5, -17, 4, 5, -0.3, 0, TAU); c.fillStyle = L.tip; c.fill(); } break;
    case 'curl': c.beginPath(); c.arc(0, -10, 8, Math.PI * 0.5, Math.PI * 2.3); c.lineWidth = 6.5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = L.body; c.stroke(); break;
    case 'stub': circ(c, -1, -2, 4.5); fo(c, L.body, 2.2); break;
    case 'pom': c.beginPath(); c.moveTo(0, 0); c.lineTo(-4, -12); c.lineWidth = 5.5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = L.body; c.stroke(); circ(c, -5, -15, 6); fo(c, L.belly, 2.2); break;
    default: c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-6, -8, -4, -18); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3; c.strokeStyle = L.body; c.stroke(); if (L.tip) { circ(c, -4, -17, 2.4); c.fillStyle = L.tip; c.fill(); }
  }
  c.restore();
  // body
  c.beginPath(); c.ellipse(0, by, 15 * bl, 9.5, 0, 0, TAU); fo(c, L.body);
  c.save(); c.beginPath(); c.ellipse(0, by, 15 * bl - 1, 8.5, 0, 0, TAU); c.clip();
  c.fillStyle = L.belly; c.beginPath(); c.ellipse(3, by + 7, 13 * bl, 6, 0, 0, TAU); c.fill();
  if (L.saddle) { c.fillStyle = L.saddle; c.beginPath(); c.ellipse(-3, by - 7, 12 * bl, 6.5, -0.05, 0, TAU); c.fill(); }
  if (L.spots) { c.fillStyle = L.spots; for (const [sx, sy, r] of [[-8, -3, 2.6], [-1, -5, 2], [5, -1, 2.4], [-5, 3, 1.8], [9, -5, 1.6]]) { circ(c, sx * bl, by + sy, r); c.fill(); } }
  if (L.shaggy) { c.strokeStyle = shade(L.body, -0.12); c.lineWidth = 1.4; for (let i = -10; i <= 10; i += 5) { c.beginPath(); c.moveTo(i * bl, by - 6); c.quadraticCurveTo(i * bl + 2, by, i * bl, by + 5); c.stroke(); } }
  c.restore();
  // near legs
  if (!st.sit) {
    legPath(c, -9 * bl, by + 4, legH + bob, 6.5, swing); fo(c, sock || L.body, 2.4);
    legPath(c, 8 * bl, by + 4, legH + bob, 6.5, -swing); fo(c, sock || L.body, 2.4);
  } else {
    c.beginPath(); c.ellipse(-8 * bl, by + 7, 8, 6, 0, 0, TAU); fo(c, L.body, 2.2);
    legPath(c, 8 * bl, by + 3, legH + 3, 6.5, -0.1); fo(c, sock || L.body, 2.4);
  }
  // collar
  if (st.collar) { c.save(); c.translate(hx - 7, hy + 10); c.rotate(0.5); c.beginPath(); rrect(c, -3, -8, 6, 16, 3); fo(c, st.collar, 1.8); c.restore(); circ(c, hx - 4, hy + 15, 2.6); fo(c, '#ffd84d', 1.4); }
  // head
  c.save(); c.translate(hx, hy); c.rotate((st.look || 0) * 0.25 + (st.atk > 0 ? -0.12 * Math.sin(st.atk * Math.PI) : 0));
  drawDogHead(c, L, st, hr);
  c.restore();
  c.restore();
  if (st.swim) { c.save(); c.translate(x, y); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, -4, 24 * sc * bl, 6 * sc, 0, 0, TAU); c.stroke(); c.restore(); }
}

function drawDogHead(c, L, st, hr) {
  const far = shade(L.ear || L.body, -0.15), t = st.t || 0;
  const snx = L.snout === 'long' ? 10 : L.snout === 'short' ? 6 : 8, srx = L.snout === 'long' ? 9 : L.snout === 'short' ? 5.5 : 7.5;
  // far ear
  if (L.earType === 'point' || L.earType === 'big') { c.beginPath(); c.moveTo(2, -hr + 4); c.lineTo(6, -hr - (L.earType === 'big' ? 13 : 9)); c.lineTo(10, -hr + 6); c.closePath(); fo(c, far, 2.2); }
  else { c.beginPath(); c.ellipse(5, -hr + 7, 5, 9, -0.2, 0, TAU); fo(c, far, 2.2); }
  // head shape
  circ(c, 0, 0, hr); fo(c, L.body);
  c.save(); circ(c, 0, 0, hr - 1); c.clip();
  if (L.mask) { c.fillStyle = L.mask; c.beginPath(); c.ellipse(7, 4, 9, 8, 0, 0, TAU); c.fill(); }
  if (L.blaze) { c.fillStyle = L.belly; c.beginPath(); c.moveTo(4, -hr); c.quadraticCurveTo(9, -4, 8, 2); c.lineTo(3, 2); c.quadraticCurveTo(4, -4, 1, -hr); c.fill(); }
  if (L.cheeks) { c.fillStyle = L.cheeks; c.beginPath(); c.ellipse(5, 6, 6, 4, 0, 0, TAU); c.fill(); }
  if (L.shaggy) { c.fillStyle = L.belly; c.beginPath(); c.ellipse(-1, -7, 12, 6, 0, 0, TAU); c.fill(); }
  c.restore();
  // muzzle
  const mcol = L.mask && L.mask !== '#ffffff' && L.mask !== '#fff3e0' ? L.mask : L.blaze || L.mask ? L.belly : L.muzzle || shade(L.body, 0.25);
  c.beginPath(); c.ellipse(snx, 4, srx, 5.6, 0, 0, TAU); fo(c, mcol, 2.2);
  // nose
  c.fillStyle = OUT; c.beginPath(); c.ellipse(snx + srx - 1.5, 1.6, 3, 2.4, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; circ(c, snx + srx - 2.2, 0.8, 0.8); c.fill();
  // mouth
  c.strokeStyle = OUT; c.lineWidth = 1.6;
  if (st.talk && Math.sin(t * 18) > 0) { c.fillStyle = '#7a2f45'; c.beginPath(); c.ellipse(snx + 2, 8, 3.5, 2.6, 0, 0, TAU); c.fill(); }
  else { c.beginPath(); c.moveTo(snx + srx - 3, 5); c.quadraticCurveTo(snx + 2, 9, snx - 2, 6); c.stroke(); }
  if (st.pant) { c.fillStyle = '#ff7f9a'; c.beginPath(); c.ellipse(snx + 1, 10 + Math.sin(t * 10), 2.6, 3.8, 0, 0, TAU); c.fill(); c.lineWidth = 1.4; c.stroke(); }
  // eye
  const ex = 3, ey = -3;
  if (L.droopy) { c.fillStyle = shade(L.body, -0.2); c.beginPath(); c.ellipse(ex, ey + 2.5, 4, 2.5, 0, 0, TAU); c.fill(); }
  const blink = (t % 3.7) > 3.58;
  if (st.happy || blink) { c.beginPath(); c.arc(ex, ey + 1, 2.8, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); }
  else {
    if (L.dark) { c.fillStyle = '#d8cfd6'; c.beginPath(); c.ellipse(ex, ey, 3.6, 4.2, 0, 0, TAU); c.fill(); }
    c.fillStyle = L.eye || OUT; c.beginPath(); c.ellipse(ex, ey, 2.5, 3.1, 0, 0, TAU); c.fill();
    if (L.eye) { c.fillStyle = OUT; circ(c, ex + 0.5, ey, 1.2); c.fill(); }
    c.fillStyle = '#fff'; circ(c, ex + 0.9, ey - 1.2, 1); c.fill();
  }
  // brow when angry
  if (st.angry) { c.beginPath(); c.moveTo(ex - 4, ey - 6); c.lineTo(ex + 3, ey - 4); c.lineWidth = 2; c.stroke(); }
  // blush
  c.fillStyle = 'rgba(255,120,150,0.35)'; c.beginPath(); c.ellipse(-1, 5, 3, 2, 0, 0, TAU); c.fill();
  // near ear
  const flap = Math.sin(t * 9) * 0.08;
  switch (L.earType) {
    case 'point': c.beginPath(); c.moveTo(-8, -hr + 6); c.lineTo(-4, -hr - 10); c.lineTo(1, -hr + 3); c.closePath(); fo(c, L.ear || L.body, 2.4); c.beginPath(); c.moveTo(-6, -hr + 4); c.lineTo(-4, -hr - 5); c.lineTo(-1.5, -hr + 3); c.fillStyle = '#ffb3c1'; c.fill(); break;
    case 'big': c.beginPath(); c.moveTo(-9, -hr + 6); c.lineTo(-7, -hr - 15); c.lineTo(1, -hr + 2); c.closePath(); fo(c, L.ear || L.body, 2.4); c.beginPath(); c.moveTo(-7, -hr + 4); c.lineTo(-6.5, -hr - 9); c.lineTo(-2, -hr + 3); c.fillStyle = '#ffb3c1'; c.fill(); break;
    case 'fold': c.beginPath(); c.moveTo(-8, -hr + 5); c.lineTo(-3, -hr - 5); c.lineTo(4, -hr + 1); c.lineTo(-1, -hr + 4); c.closePath(); fo(c, L.ear || L.body, 2.2); break;
    case 'long': c.save(); c.translate(-4, -hr + 6); c.rotate(0.15 + flap); c.beginPath(); c.ellipse(0, 9, 5.5, 13, 0, 0, TAU); fo(c, L.ear || L.body, 2.4); c.restore(); break;
    case 'fluff': c.save(); c.translate(-5, -hr + 6); c.rotate(0.1 + flap); blobShape(c, [[0, 4, 6], [-1, 10, 6], [0, 15, 5]], L.ear || L.body); c.restore(); blobShape(c, [[-2, -hr + 1, 6], [4, -hr - 1, 6]], L.belly); break;
    default: c.save(); c.translate(-4, -hr + 6); c.rotate(0.25 + flap); c.beginPath(); c.ellipse(0, 6, 5.5, 9.5, 0, 0, TAU); fo(c, L.ear || L.body, 2.4); c.restore();
  }
  if (st.hat) drawHat(c, st.hat, 0, -hr + 2);
  if (st.item) drawMouthItem(c, st.item, snx + srx - 3, 9);
}

function drawDogBall(c, L, st, sc) {
  const a = st.roll * TAU * 1.5 * (st.face || 1);
  c.scale(sc, sc);
  c.translate(0, -13);
  c.rotate(a);
  circ(c, 0, 0, 13); fo(c, L.body);
  c.save(); circ(c, 0, 0, 12); c.clip(); c.fillStyle = L.belly; c.beginPath(); c.ellipse(0, 9, 13, 7, 0, 0, TAU); c.fill();
  if (L.spots) { c.fillStyle = L.spots; circ(c, -4, -3, 2.4); c.fill(); circ(c, 5, 2, 2); c.fill(); } c.restore();
  c.beginPath(); c.ellipse(-5, -10, 4, 7, 0.6, 0, TAU); fo(c, L.ear || L.body, 2);
  c.fillStyle = OUT; circ(c, 6, -3, 1.8); c.fill();
}

// ---------- hats and things to carry in the mouth
function drawHat(c, id, x, y) {
  c.save(); c.translate(x, y);
  switch (id) {
    case 'party': c.beginPath(); c.moveTo(-8, 0); c.lineTo(1, -20); c.lineTo(9, 0); c.closePath(); fo(c, '#4fb8e8', 2); c.fillStyle = '#ffd84d'; circ(c, -2, -6, 1.6); c.fill(); circ(c, 4, -11, 1.6); c.fill(); circ(c, 1, -21, 3); fo(c, '#ff6f8f', 1.6); break;
    case 'bandana': c.beginPath(); c.moveTo(-11, 2); c.quadraticCurveTo(0, -12, 11, 1); c.lineTo(6, 3); c.quadraticCurveTo(0, -4, -6, 3); c.closePath(); fo(c, '#e8475f', 2); c.fillStyle = '#fff'; circ(c, -3, -3, 1.2); c.fill(); circ(c, 3, -4, 1.2); c.fill(); c.beginPath(); c.moveTo(-11, 2); c.lineTo(-17, 6); c.lineTo(-13, -1); c.closePath(); fo(c, '#e8475f', 1.6); break;
    case 'pirate': c.beginPath(); c.moveTo(-16, -2); c.quadraticCurveTo(-10, -18, 0, -16); c.quadraticCurveTo(10, -18, 16, -2); c.quadraticCurveTo(0, -6, -16, -2); fo(c, '#2b2b3a', 2); c.fillStyle = '#fff'; circ(c, 0, -10, 2.6); c.fill(); c.strokeStyle = '#ffd84d'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-14, -3); c.quadraticCurveTo(0, -7, 14, -3); c.stroke(); break;
    case 'wizard': c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-2, -6, 0, -30); c.quadraticCurveTo(6, -34, 12, -30); c.quadraticCurveTo(5, -26, 5, -20); c.quadraticCurveTo(6, -6, 13, 0); c.closePath(); fo(c, '#6a4fc9', 2); c.beginPath(); c.ellipse(0, 0, 16, 4, 0, 0, TAU); fo(c, '#6a4fc9', 2); c.fillStyle = '#ffd84d'; circ(c, 0, -14, 2); c.fill(); circ(c, 5, -22, 1.5); c.fill(); break;
    case 'beanie': c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-12, -16, 0, -16); c.quadraticCurveTo(12, -16, 12, 1); c.closePath(); fo(c, '#4fa8a0', 2); c.beginPath(); rrect(c, -13, -3, 26, 6, 3); fo(c, '#3d8a83', 2); circ(c, 0, -18, 4); fo(c, '#fff', 1.6); break;
    case 'crown': c.beginPath(); c.moveTo(-10, 0); c.lineTo(-11, -14); c.lineTo(-5, -7); c.lineTo(0, -16); c.lineTo(5, -7); c.lineTo(11, -14); c.lineTo(10, 0); c.closePath(); fo(c, '#ffd84d', 2); c.fillStyle = '#e8475f'; circ(c, 0, -5, 2); c.fill(); break;
    case 'cone': c.beginPath(); c.moveTo(-6, 4); c.lineTo(-22, -16); c.lineTo(22, -16); c.lineTo(6, 4); c.closePath(); c.fillStyle = 'rgba(245,245,255,0.75)'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); break;
    case 'viking': c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-12, -15, 0, -15); c.quadraticCurveTo(12, -15, 12, 1); c.closePath(); fo(c, '#a7a8b8', 2); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -8); c.quadraticCurveTo(s * 20, -10, s * 20, -22); c.quadraticCurveTo(s * 15, -14, s * 9, -12); c.closePath(); fo(c, '#fff6e0', 1.8); } break;
    case 'sombrero': c.beginPath(); c.ellipse(0, -2, 22, 5, 0, 0, TAU); fo(c, '#e8b84a', 2); c.beginPath(); c.moveTo(-9, -3); c.quadraticCurveTo(-8, -18, 0, -18); c.quadraticCurveTo(8, -18, 9, -3); c.closePath(); fo(c, '#e8b84a', 2); c.strokeStyle = '#e8475f'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -6); c.lineTo(8, -6); c.stroke(); break;
    case 'chef': c.beginPath(); rrect(c, -9, -10, 18, 10, 2); fo(c, '#fff', 2); blobShape(c, [[-6, -14, 6], [0, -18, 7], [6, -14, 6]], '#fff'); break;
    case 'tophat': c.beginPath(); c.ellipse(0, -1, 14, 3.5, 0, 0, TAU); fo(c, '#2b2b3a', 2); c.beginPath(); c.rect(-8, -20, 16, 19); fo(c, '#2b2b3a', 2); c.fillStyle = '#e8475f'; c.fillRect(-8, -6, 16, 3); break;
    case 'flower': c.fillStyle = '#ff8fb4'; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circ(c, -4 + Math.cos(a) * 4, -3 + Math.sin(a) * 4, 3); c.fill(); } c.fillStyle = '#ffd84d'; circ(c, -4, -3, 2.4); c.fill(); break;
    case 'halo': c.beginPath(); c.ellipse(0, -10, 10, 3, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#ffd84d'; c.stroke(); break;
    case 'helm': c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(-13, -15, 0, -16); c.quadraticCurveTo(13, -15, 12, 3); c.closePath(); fo(c, '#c9ccd9', 2); c.beginPath(); c.moveTo(0, -16); c.quadraticCurveTo(-8, -26, -16, -22); c.lineWidth = 4; c.strokeStyle = '#e8475f'; c.stroke(); break;
    case 'nemes': c.beginPath(); c.moveTo(-15, 22); c.lineTo(-14, 2); c.quadraticCurveTo(-13, -12, 0, -13); c.quadraticCurveTo(12, -12, 12, -2); c.quadraticCurveTo(4, -5, -4, -2); c.lineTo(-6, 22); c.closePath(); fo(c, '#3a7fd9', 2); c.strokeStyle = '#ffd84d'; c.lineWidth = 2; for (let i = -12; i <= 8; i += 5) { c.beginPath(); c.moveTo(i, -11 + Math.abs(i) * 0.15); c.lineTo(i < -6 ? i : i * 0.6 - 4, i < -6 ? 20 : -3); c.stroke(); } c.beginPath(); c.moveTo(-6, -12); c.quadraticCurveTo(0, -20, 6, -12); c.lineWidth = 2.5; c.strokeStyle = '#ffd84d'; c.stroke(); break;
    case 'scarf': c.beginPath(); rrect(c, -10, 8, 20, 6, 3); fo(c, '#4fb8e8', 1.8); break;
  }
  c.restore();
}
function drawMouthItem(c, id, x, y) {
  c.save(); c.translate(x, y);
  switch (id) {
    case 'stick': c.beginPath(); c.moveTo(-10, 1); c.lineTo(18, -2); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = '#a8763f'; c.stroke(); c.beginPath(); c.moveTo(10, -1); c.lineTo(14, -6); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#a8763f'; c.stroke(); c.fillStyle = '#5fb848'; ell(c, 15, -7, 3, 1.8, 0.5); c.fill(); break;
    case 'bone': drawBone(c, 4, 0, 24, 0, '#fff6e0', 1.8); break;
    case 'squeaky': c.beginPath(); c.moveTo(-6, 0); c.lineTo(10, 0); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = '#8a5a34'; c.stroke(); c.beginPath(); rrect(c, 8, -8, 12, 16, 4); fo(c, '#ff6f8f', 2); break;
    case 'chicken': c.beginPath(); c.ellipse(6, 0, 12, 4.5, 0, 0, TAU); fo(c, '#ffd84d', 2); circ(c, 18, -2, 4); fo(c, '#ffd84d', 1.8); c.fillStyle = '#e8475f'; c.beginPath(); c.moveTo(19, -6); c.lineTo(21, -9); c.lineTo(22, -5); c.fill(); c.fillStyle = '#f08a2a'; c.beginPath(); c.moveTo(22, -2); c.lineTo(26, -1); c.lineTo(22, 0); c.fill(); break;
    case 'frisbee': c.beginPath(); c.ellipse(10, -2, 13, 5, -0.2, 0, TAU); fo(c, '#4fb8e8', 2); c.beginPath(); c.ellipse(10, -3, 8, 2.8, -0.2, 0, TAU); c.lineWidth = 1.4; c.stroke(); break;
    case 'scepter': drawBone(c, 6, 0, 26, 0, '#ffd84d', 1.8); c.fillStyle = '#e8475f'; circ(c, 6, 0, 2.6); c.fill(); break;
    case 'icicle': c.beginPath(); c.moveTo(-6, -2); c.lineTo(26, 0); c.lineTo(-6, 3); c.closePath(); fo(c, '#bfe8fa', 2); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-4, -1, 18, 1.2); break;
    case 'rib': c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(10, -10, 26, -2); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = '#fbe9b8'; c.stroke(); c.fillStyle = '#3a8fd9'; circ(c, 10, -4, 2.4); c.fill(); break;
    case 'golden': c.beginPath(); c.moveTo(-8, 1); c.lineTo(24, -3); c.lineWidth = 6.5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.8; c.strokeStyle = '#ffd84d'; c.stroke(); c.fillStyle = '#fff6b0'; for (const [a, b] of [[4, -1], [14, -2], [22, -3]]) { circ(c, a, b, 1); c.fill(); } break;
    case 'cutlass': c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(14, -6, 30, -12); c.quadraticCurveTo(18, -2, -4, 4); c.closePath(); fo(c, '#d8dce8', 1.8); c.beginPath(); rrect(c, -9, -3, 7, 7, 2); fo(c, '#ffd84d', 1.6); break;
    case 'letter': c.beginPath(); c.rect(2, -6, 16, 11); fo(c, '#fff6e0', 1.8); c.beginPath(); c.moveTo(2, -6); c.lineTo(10, 0); c.lineTo(18, -6); c.lineWidth = 1.2; c.stroke(); break;
    case 'ball': circ(c, 8, -1, 6); fo(c, '#c9e84a', 2); c.beginPath(); c.arc(4, -1, 6, -0.9, 0.9); c.lineWidth = 1.4; c.strokeStyle = '#fff'; c.stroke(); break;
  }
  c.restore();
}

// ---------- cats, foxes, raccoons and other critters
const CRITTERS = {
  squirrel: { kind: 'squirrel', body: '#c2703f', belly: '#f3d2a8', tail: '#c2703f' },
  graysquirrel: { kind: 'squirrel', body: '#8e8ea0', belly: '#e8e2ea', tail: '#8e8ea0' },
  cat: { kind: 'cat', body: '#9b9bab', belly: '#e9e6ee', stripes: '#6c6c7c', eye: '#9be04a' },
  ginger: { kind: 'cat', body: '#f09a4a', belly: '#fff0dc', stripes: '#c9682a', eye: '#9be04a' },
  blackcat: { kind: 'cat', body: '#3a3440', belly: '#4a4452', eye: '#ffd84d' },
  raccoon: { kind: 'raccoon', body: '#8a8496', belly: '#c9c4d2', mask: '#3a3440', ring: '#4a4452', eye: '#ffffff' },
  fox: { kind: 'fox', body: '#ef8a3c', belly: '#fff5e8', tip: '#ffffff', eye: '#3a2236' },
  snowfox: { kind: 'fox', body: '#f2f6ff', belly: '#ffffff', tip: '#dbe6f5', eye: '#4aa8e8' },
  skunk: { kind: 'skunk', body: '#2f2a36', belly: '#2f2a36', stripe: '#ffffff', eye: '#3a2236' },
  snowcat: { kind: 'cat', body: '#e4ecf6', belly: '#ffffff', spots: '#7f8aa0', eye: '#4aa8e8' },
  mummy: { kind: 'cat', body: '#efe3c4', belly: '#efe3c4', wraps: '#cdbf98', eye: '#7fff8a' },
  ghost: { kind: 'cat', body: '#d9d2ff', belly: '#efeaff', ghost: 1, eye: '#5a4a9a' },
  knight: { kind: 'cat', body: '#3a3440', belly: '#4a4452', eye: '#ffd84d', armor: '#c9ccd9' },
  // bosses
  nutsworth: { kind: 'squirrel', body: '#b5602e', belly: '#f3d2a8', tail: '#b5602e', hat: 'crown', item: 'acorn' },
  whiskers: { kind: 'cat', body: '#f09a4a', belly: '#fff0dc', stripes: '#c9682a', eye: '#9be04a', hat: 'pirate', item: 'cutlass', patch: 1, coat: '#c93a4a' },
  snowball: { kind: 'cat', body: '#eef2f8', belly: '#ffffff', spots: '#6f7a90', eye: '#4aa8e8', hat: 'scarf', tailBig: 1 },
  cleocatra: { kind: 'cat', body: '#e8c08a', belly: '#f6dfbd', eye: '#3a8fd9', hat: 'nemes', goldCollar: 1 },
  mittens: { kind: 'cat', body: '#f6f4fa', belly: '#ffffff', patches: '#9a96aa', eye: '#c94ad9', hat: 'crown', cape: '#6a3fa8', fluffy: 1 },
};

// st: { face, t, move, atk, hurt, sc, alpha, tele (0..1 windup) }
function drawCritter(c, x, y, S, st) {
  const sc = st.sc || 1, t = st.t || 0, mv = st.move || 0;
  c.save(); c.translate(x, y); c.scale((st.face || 1) * sc, sc);
  if (st.alpha != null) c.globalAlpha = st.alpha;
  const wind = st.tele > 0 ? Math.sin(st.tele * Math.PI * 0.5) : 0;
  c.translate(-wind * 3, 0);
  if (S.kind === 'squirrel') drawSquirrelBody(c, S, st, mv, t);
  else drawCatBody(c, S, st, mv, t);
  c.restore();
}

function drawCatBody(c, S, st, mv, t) {
  const bob = mv > 0.05 ? Math.abs(Math.sin(t * 12)) * 2 * mv : Math.sin(t * 2.2) * 0.5;
  const ghost = S.ghost;
  const by = (ghost ? -22 + Math.sin(t * 3) * 3 : -19) - bob, hx = 14, hy = by - 12;
  const swing = Math.sin(t * 12) * 0.5 * mv, far = shade(S.body, -0.18);
  const fox = S.kind === 'fox', rac = S.kind === 'raccoon', skunk = S.kind === 'skunk';
  // far legs
  if (!ghost) { legPath(c, -8 + 3, by + 3, 12 + bob, 5.5, -swing); fo(c, far, 2.2); legPath(c, 8 + 3, by + 3, 12 + bob, 5.5, swing); fo(c, far, 2.2); }
  // cape behind
  if (S.cape) { c.beginPath(); c.moveTo(8, by - 8); c.quadraticCurveTo(-20, by - 6, -26 + Math.sin(t * 4) * 3, by + 14); c.lineTo(4, by + 10); c.closePath(); fo(c, S.cape); }
  // tail
  c.save(); c.translate(-14, by - 2);
  const tw = Math.sin(t * 3) * 0.25;
  if (fox) { c.rotate(0.6 + tw); c.beginPath(); c.ellipse(-12, 0, 15, 7, 0, 0, TAU); fo(c, S.body); c.beginPath(); c.ellipse(-22, 0, 6, 5, 0, 0, TAU); c.fillStyle = S.tip; c.fill(); }
  else if (rac) { c.rotate(0.5 + tw); c.beginPath(); c.ellipse(-12, 0, 14, 6, 0, 0, TAU); fo(c, S.body); c.save(); c.beginPath(); c.ellipse(-12, 0, 13, 5, 0, 0, TAU); c.clip(); c.fillStyle = S.ring; for (let i = -22; i < 0; i += 6) c.fillRect(i, -7, 3, 14); c.restore(); }
  else if (skunk) { c.rotate(-0.2 + tw); blobShape(c, [[-4, -12, 9], [-6, -24, 10], [2, -32, 8]], S.body); c.strokeStyle = S.stripe; c.lineWidth = 4; c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(-8, -22, 2, -34); c.stroke(); }
  else if (ghost) { c.rotate(0.3 + tw); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -4, -14, -14); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = S.body; c.stroke(); }
  else {
    const big = S.tailBig || S.fluffy ? 1.6 : 1;
    c.rotate(-0.2 + tw); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-12, -6, -10, -20); c.quadraticCurveTo(-8, -28, -2, -26);
    c.lineWidth = 6.5 * big; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.8 * big; c.strokeStyle = S.body; c.stroke();
    if (S.stripes || S.spots) { c.strokeStyle = S.stripes || S.spots; c.lineWidth = 2; for (const [a, b] of [[-9, -6], [-11, -14], [-7, -22]]) { c.beginPath(); c.moveTo(a - 2, b); c.lineTo(a + 2, b - 1); c.stroke(); } }
  }
  c.restore();
  // body
  c.beginPath();
  if (ghost) { c.moveTo(-15, by); c.quadraticCurveTo(-15, by - 10, 0, by - 10); c.quadraticCurveTo(15, by - 10, 15, by); for (let i = 0; i <= 6; i++) c.lineTo(15 - i * 5, by + 10 + (i % 2 ? -4 : 2) + Math.sin(t * 6 + i) * 2); c.closePath(); fo(c, S.body); }
  else { c.ellipse(0, by, 15 * (S.fluffy ? 1.1 : 1), 9 * (S.fluffy ? 1.15 : 1), 0, 0, TAU); fo(c, S.body); }
  c.save(); c.beginPath(); c.ellipse(0, by, 14, 8.5, 0, 0, TAU); c.clip();
  c.fillStyle = S.belly; c.beginPath(); c.ellipse(3, by + 7, 12, 5.5, 0, 0, TAU); c.fill();
  if (S.stripes) { c.strokeStyle = S.stripes; c.lineWidth = 2.6; for (let i = -9; i <= 7; i += 5) { c.beginPath(); c.moveTo(i, by - 9); c.quadraticCurveTo(i + 2, by - 4, i, by); c.stroke(); } }
  if (S.spots) { c.strokeStyle = S.spots; c.lineWidth = 1.8; for (const [a, b] of [[-8, -3], [-1, -5], [6, -2], [-4, 2]]) { c.beginPath(); c.arc(a, by + b, 2.2, 0.3, 5.5); c.stroke(); } }
  if (S.patches) { c.fillStyle = S.patches; c.beginPath(); c.ellipse(-6, by - 5, 6, 4, 0.2, 0, TAU); c.fill(); }
  if (skunk) { c.fillStyle = S.stripe; c.beginPath(); c.ellipse(0, by - 7, 14, 2.6, 0, 0, TAU); c.fill(); }
  if (S.wraps) { c.strokeStyle = S.wraps; c.lineWidth = 1.6; for (let i = -12; i <= 10; i += 4) { c.beginPath(); c.moveTo(i, by - 9); c.lineTo(i + 5, by + 9); c.stroke(); } }
  if (S.coat) { c.fillStyle = S.coat; c.beginPath(); c.ellipse(4, by, 12, 9, 0, 0, TAU); c.fill(); c.fillStyle = '#ffd84d'; circ(c, 9, by - 2, 1.4); c.fill(); circ(c, 9, by + 3, 1.4); c.fill(); }
  if (S.armor) { c.fillStyle = S.armor; c.beginPath(); c.ellipse(2, by - 1, 13, 8, 0, 0, TAU); c.fill(); c.strokeStyle = shade(S.armor, -0.3); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, by - 6); c.lineTo(-8, by + 6); c.moveTo(2, by - 8); c.lineTo(2, by + 8); c.stroke(); }
  c.restore();
  if (S.goldCollar) { c.beginPath(); c.ellipse(hx - 5, hy + 10, 6, 9, 0.4, 0, TAU); fo(c, '#ffd84d', 2); c.fillStyle = '#3a8fd9'; circ(c, hx - 3, hy + 12, 2); c.fill(); }
  // near legs
  if (!ghost) { legPath(c, -8, by + 4, 12 + bob, 6, swing); fo(c, S.wraps ? S.body : S.body, 2.4); legPath(c, 8, by + 4, 12 + bob, 6, -swing); fo(c, S.body, 2.4); }
  // head
  c.save(); c.translate(hx, hy); c.rotate(st.atk > 0 ? -0.15 * Math.sin(st.atk * Math.PI) : 0);
  const hr = 11;
  // far ear
  c.beginPath(); c.moveTo(1, -hr + 3); c.lineTo(6, -hr - 9); c.lineTo(10, -hr + 5); c.closePath(); fo(c, far, 2.2);
  circ(c, 0, 0, hr); fo(c, S.body);
  c.save(); circ(c, 0, 0, hr - 1); c.clip();
  if (rac) { c.fillStyle = S.mask; c.beginPath(); c.ellipse(4, -2, 10, 4.5, 0, 0, TAU); c.fill(); }
  if (S.stripes) { c.strokeStyle = S.stripes; c.lineWidth = 2.2; for (const i of [-4, 0, 4]) { c.beginPath(); c.moveTo(i - 2, -hr); c.lineTo(i, -hr + 5); c.stroke(); } }
  if (skunk) { c.fillStyle = S.stripe; c.fillRect(-2, -hr, 4, 8); }
  if (S.wraps) { c.strokeStyle = S.wraps; c.lineWidth = 1.6; for (let i = -10; i <= 10; i += 4) { c.beginPath(); c.moveTo(-hr, i); c.lineTo(hr, i + 3); c.stroke(); } }
  c.fillStyle = S.belly; c.beginPath(); c.ellipse(7, 4, 7, 5, 0, 0, TAU); c.fill();
  c.restore();
  if (fox) { c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(14, 1, 17, 4); c.quadraticCurveTo(10, 8, 4, 7); c.closePath(); fo(c, S.belly, 2); c.fillStyle = OUT; circ(c, 16.5, 3.5, 2); c.fill(); }
  else { c.fillStyle = '#ff8fa8'; c.beginPath(); c.moveTo(9, 1); c.lineTo(13, 1); c.lineTo(11, 3.5); c.closePath(); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.beginPath(); c.moveTo(11, 3.5); c.lineTo(11, 5); c.quadraticCurveTo(9, 7, 7.5, 5.5); c.moveTo(11, 5); c.quadraticCurveTo(13, 7, 14.5, 5.5); c.stroke();
    c.strokeStyle = 'rgba(59,34,53,0.7)'; c.lineWidth = 1; for (const d of [-1, 1.5]) { c.beginPath(); c.moveTo(12, 3 + d); c.lineTo(22, 1 + d * 2); c.stroke(); } }
  // eye: cat eyes are almonds with slits
  const ex = 3, ey = -2;
  if (S.patch) { c.beginPath(); c.ellipse(ex, ey, 4, 3.5, 0, 0, TAU); fo(c, '#2b2b3a', 1.4); c.beginPath(); c.moveTo(-hr + 1, -6); c.lineTo(hr - 2, -1); c.lineWidth = 1.4; c.strokeStyle = '#2b2b3a'; c.stroke(); }
  else {
    c.fillStyle = S.eye || '#9be04a'; c.beginPath(); c.ellipse(ex, ey, 3.4, 2.8, -0.2, 0, TAU); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = OUT; c.beginPath(); c.ellipse(ex + 0.4, ey, 0.9, 2.4, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(ex - 4, ey - 4.5); c.lineTo(ex + 3.5, ey - 3); c.lineWidth = 1.8; c.stroke();
  }
  // near ear
  c.beginPath(); c.moveTo(-8, -hr + 6); c.lineTo(-5, -hr - 10); c.lineTo(1, -hr + 2); c.closePath(); fo(c, S.body, 2.4);
  c.beginPath(); c.moveTo(-6, -hr + 4); c.lineTo(-4.5, -hr - 5); c.lineTo(-1.5, -hr + 2); c.fillStyle = rac || skunk ? '#cfc8d8' : '#ffb3c1'; c.fill();
  if (S.armor) drawHat(c, 'helm', 0, -hr + 3);
  if (S.hat) drawHat(c, S.hat, S.hat === 'scarf' ? -6 : 0, S.hat === 'scarf' ? hr - 10 : -hr + 2);
  if (S.item === 'cutlass') drawMouthItem(c, 'cutlass', 10, 8);
  if (S.armor && !S.item) drawMouthItem(c, 'cutlass', 10, 8);
  c.restore();
}

function drawSquirrelBody(c, S, st, mv, t) {
  const hop = mv > 0.05 ? Math.abs(Math.sin(t * 10)) * 6 * mv : Math.sin(t * 3) * 0.6;
  const by = -14 - hop, far = shade(S.body, -0.18);
  // big curly tail
  c.save(); c.translate(-8, by); c.rotate(Math.sin(t * 4) * 0.12);
  blobShape(c, [[-6, -6, 8], [-10, -16, 10], [-6, -28, 11], [3, -34, 9]], S.tail || S.body, shade(S.tail || S.body, 0.15));
  c.restore();
  // body (sits up a bit)
  c.beginPath(); c.ellipse(1, by, 10, 9, -0.4, 0, TAU); fo(c, S.body);
  c.fillStyle = S.belly; c.beginPath(); c.ellipse(5, by + 2, 5, 6.5, -0.4, 0, TAU); c.fill();
  // feet
  c.beginPath(); c.ellipse(-3, -2 - hop * 0.3, 6, 3, 0, 0, TAU); fo(c, far, 2);
  c.beginPath(); c.ellipse(5, -2 - hop * 0.3, 5, 3, 0, 0, TAU); fo(c, S.body, 2);
  // head
  const hx = 7, hy = by - 11;
  c.save(); c.translate(hx, hy);
  circ(c, -4, -8, 3.6); fo(c, far, 2);
  circ(c, 0, 0, 8.5); fo(c, S.body);
  c.fillStyle = S.belly; c.beginPath(); c.ellipse(5, 3, 4.5, 3.5, 0, 0, TAU); c.fill();
  c.fillStyle = OUT; circ(c, 8.2, 1, 1.6); c.fill();
  c.fillStyle = '#fff'; c.fillRect(6, 5, 2.2, 3); c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(6, 5, 2.2, 3);
  c.fillStyle = OUT; c.beginPath(); c.ellipse(2, -2, 2, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; circ(c, 2.6, -2.8, 0.7); c.fill();
  c.beginPath(); c.moveTo(-1, -6); c.lineTo(4, -4.5); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
  circ(c, -2, -8, 3.4); fo(c, S.body, 2);
  if (S.hat) drawHat(c, S.hat, 0, -7);
  c.restore();
  // paws holding an acorn
  c.beginPath(); c.ellipse(10, by + 1, 3.5, 2.5, 0, 0, TAU); fo(c, S.body, 1.8);
  if (S.item === 'acorn' || st.acorn) { c.beginPath(); c.ellipse(13, by - 1, 3.5, 4.2, 0, 0, TAU); fo(c, '#b5773e', 1.6); c.beginPath(); c.ellipse(13, by - 4, 4.2, 2.2, 0, 0, TAU); fo(c, '#7a4f2a', 1.6); }
}

// ---------- the odd ones out
function drawBee(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1;
  c.save(); c.translate(x, y - 26 + Math.sin(t * 6) * 3); c.scale((st.face || 1) * sc, sc);
  const fl = Math.sin(t * 40) * 0.5;
  c.fillStyle = 'rgba(230,245,255,0.85)'; c.strokeStyle = OUT; c.lineWidth = 1.6;
  c.save(); c.rotate(-0.6 + fl); c.beginPath(); c.ellipse(-2, -10, 5, 9, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.save(); c.rotate(0.3 - fl); c.beginPath(); c.ellipse(3, -10, 4.5, 8, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.ellipse(0, 0, 11, 8.5, 0, 0, TAU); fo(c, '#ffd23f');
  c.save(); c.beginPath(); c.ellipse(0, 0, 10, 7.5, 0, 0, TAU); c.clip(); c.fillStyle = '#3a2236'; c.fillRect(-5, -9, 3.5, 18); c.fillRect(1, -9, 3.5, 18); c.restore();
  c.beginPath(); c.moveTo(-11, 0); c.lineTo(-16, 1); c.lineTo(-11, 3); c.fillStyle = OUT; c.fill();
  c.fillStyle = OUT; circ(c, 7, -2, 1.6); c.fill();
  c.beginPath(); c.moveTo(7, -7); c.quadraticCurveTo(9, -13, 12, -13); c.lineWidth = 1.4; c.stroke();
  c.restore();
}
function drawCrab(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, mv = st.move || 0;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  const snap = st.tele > 0 ? Math.sin(t * 30) * 0.3 : Math.sin(t * 3) * 0.1;
  c.strokeStyle = OUT; c.lineWidth = 3;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = Math.sin(t * 14 + i) * 2 * mv; c.beginPath(); c.moveTo(s * 8, -8 + i * 2); c.lineTo(s * (16 + i * 2), -4 + i * 3 + w); c.lineTo(s * (18 + i * 2), 0); c.stroke(); }
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * 13, -16); c.rotate(s * (-0.4 + snap));
    c.beginPath(); c.ellipse(s * 4, -6, 6.5, 5, 0, 0, TAU); fo(c, '#e8584a', 2);
    c.beginPath(); c.moveTo(s * 4, -8); c.lineTo(s * 11, -12); c.lineTo(s * 9, -6); c.closePath(); fo(c, '#e8584a', 1.8);
    c.restore();
  }
  c.beginPath(); c.ellipse(0, -11, 14, 9, 0, 0, TAU); fo(c, '#e8584a');
  c.fillStyle = '#ff8a76'; c.beginPath(); c.ellipse(-3, -14, 7, 3.5, 0, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 4, -18); c.lineTo(s * 5, -24); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); circ(c, s * 5, -25, 3); fo(c, '#fff', 1.6); c.fillStyle = OUT; circ(c, s * 5.5, -25, 1.3); c.fill(); }
  c.restore();
}
function drawGull(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, alt = st.alt != null ? st.alt : 34;
  c.save(); c.translate(x, y - alt); c.scale((st.face || 1) * sc, sc);
  const fl = Math.sin(t * 10);
  c.beginPath(); c.moveTo(-2, -4); c.quadraticCurveTo(-10, -18 * fl - 4, -22, -10 * fl - 2); c.quadraticCurveTo(-12, -2, -2, 2); fo(c, '#d9dfe9', 2);
  c.beginPath(); c.ellipse(0, 0, 13, 7, 0, 0, TAU); fo(c, '#ffffff');
  c.beginPath(); c.moveTo(-12, -1); c.lineTo(-19, -4); c.lineTo(-18, 3); c.closePath(); fo(c, '#9aa3b5', 1.8);
  circ(c, 11, -5, 6); fo(c, '#ffffff', 2);
  c.beginPath(); c.moveTo(15, -6); c.lineTo(23, -3); c.lineTo(15, -2); c.closePath(); fo(c, '#ffc23a', 1.6);
  c.fillStyle = OUT; circ(c, 12, -7, 1.3); c.fill();
  c.beginPath(); c.moveTo(2, -2); c.quadraticCurveTo(8, -16 * fl - 6, 18, -8 * fl - 6); c.quadraticCurveTo(10, -2, 2, 2); fo(c, '#c9d1de', 2);
  c.restore();
}
function drawScorpion(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1, mv = st.move || 0;
  c.save(); c.translate(x, y); c.scale((st.face || 1) * sc, sc);
  c.strokeStyle = OUT; c.lineWidth = 2.6;
  for (let i = 0; i < 3; i++) { const w = Math.sin(t * 14 + i) * 2 * mv; c.beginPath(); c.moveTo(-4 + i * 5, -6); c.lineTo(-7 + i * 6 + w, 0); c.stroke(); }
  const strike = st.tele > 0 ? st.tele : 0;
  c.save(); c.translate(-10, -9);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14, -6, -10, -24 + strike * 6); c.quadraticCurveTo(-4, -34, 8 + strike * 6, -28 + strike * 8);
  c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#c47a3e'; c.stroke();
  c.beginPath(); c.moveTo(8 + strike * 6, -28 + strike * 8); c.lineTo(14 + strike * 6, -22 + strike * 8); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.restore();
  c.beginPath(); c.ellipse(0, -8, 13, 6.5, 0, 0, TAU); fo(c, '#c47a3e');
  for (const s of [0, 1]) { c.save(); c.translate(12, -9 + s * 3); c.rotate(-0.3 + s * 0.4); c.beginPath(); c.ellipse(6, 0, 6, 3.5, 0, 0, TAU); fo(c, s ? shade('#c47a3e', -0.15) : '#c47a3e', 2); c.restore(); }
  c.fillStyle = OUT; circ(c, 9, -11, 1.4); c.fill();
  c.restore();
}
function drawBat(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1;
  c.save(); c.translate(x, y - 30 + Math.sin(t * 5) * 4); c.scale((st.face || 1) * sc, sc);
  const fl = Math.sin(t * 16);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(s * 10, -12 * fl - 4, s * 22, -6 * fl); c.quadraticCurveTo(s * 16, 0, s * 18, 4); c.quadraticCurveTo(s * 10, 1, 0, 3); c.closePath(); fo(c, '#5a4a78', 2); }
  circ(c, 0, 0, 8); fo(c, '#6a5a8a');
  c.beginPath(); c.moveTo(-6, -5); c.lineTo(-4, -12); c.lineTo(-1, -6); c.moveTo(6, -5); c.lineTo(4, -12); c.lineTo(1, -6); fo(c, '#6a5a8a', 1.6);
  c.fillStyle = '#ffd84d'; circ(c, -3, -1, 1.8); c.fill(); circ(c, 3, -1, 1.8); c.fill();
  c.restore();
}
function drawVacbot(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1;
  c.save(); c.translate(x, y); c.scale((st.face || 1) * sc, sc);
  const suck = st.tele > 0;
  // hose
  c.beginPath(); c.moveTo(6, -22); c.quadraticCurveTo(22, -30, 26, -10); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#7f8aa0'; c.stroke();
  c.beginPath(); rrect(c, 20, -10, 14, 8, 3); fo(c, '#5a5f78', 2);
  if (suck) { c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const p = ((t * 3 + i / 3) % 1); c.beginPath(); c.arc(28 + (1 - p) * 30, -6, 6 * (1 - p) + 2, -1, 1); c.stroke(); } }
  c.beginPath(); rrect(c, -16, -34, 30, 30, 12); fo(c, '#9b7fd6');
  c.beginPath(); rrect(c, -12, -28, 22, 10, 5); fo(c, '#2b2b3a', 2);
  c.fillStyle = suck ? '#ff5a5a' : '#7fffd0'; circ(c, -5, -23, 2); c.fill(); circ(c, 4, -23, 2); c.fill();
  c.beginPath(); c.moveTo(-12, -33); c.lineTo(-9, -42); c.lineTo(-4, -34); c.moveTo(4, -34); c.lineTo(9, -42); c.lineTo(11, -33); fo(c, '#9b7fd6', 2);
  for (const wx of [-9, 7]) { circ(c, wx, -4, 5); fo(c, '#3a3440', 2); }
  c.restore();
}
function drawDreadVacuum(c, x, y, st) {
  const t = st.t || 0, sc = st.sc || 1;
  c.save(); c.translate(x, y); c.scale((st.face || 1) * sc, sc);
  const rumble = Math.sin(t * 30) * 0.8;
  c.translate(rumble, 0);
  c.beginPath(); c.moveTo(18, -40); c.quadraticCurveTo(60, -60, 64, -14); c.lineWidth = 14; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#7f8aa0'; c.stroke();
  c.beginPath(); rrect(c, 50, -18, 34, 16, 6); fo(c, '#5a5f78');
  c.beginPath(); rrect(c, -46, -70, 80, 62, 22); fo(c, '#6a3fa8');
  c.fillStyle = '#7f55c0'; c.beginPath(); rrect(c, -40, -64, 40, 20, 10); c.fill();
  c.beginPath(); rrect(c, -30, -44, 56, 22, 10); fo(c, '#2b2b3a', 2);
  c.fillStyle = st.tele > 0 ? '#ff5a5a' : '#ffd84d'; for (const ex of [-14, 12]) { c.beginPath(); c.ellipse(ex, -33, 6, 5, 0, 0, TAU); c.fill(); }
  c.fillStyle = OUT; for (const ex of [-14, 12]) { c.beginPath(); c.ellipse(ex, -33, 1.6, 4, 0, 0, TAU); c.fill(); }
  c.beginPath(); c.moveTo(-40, -68); c.lineTo(-34, -88); c.lineTo(-22, -70); c.moveTo(18, -70); c.lineTo(28, -88); c.lineTo(32, -68); fo(c, '#6a3fa8');
  for (const wx of [-34, 0, 26]) { circ(c, wx, -6, 9); fo(c, '#3a3440'); circ(c, wx, -6, 3); c.fillStyle = '#9a96aa'; c.fill(); }
  c.restore();
}

// the squeaky ball spirit who follows the hero around
function drawSqueaky(c, x, y, t, talk) {
  c.save(); c.translate(x, y + Math.sin(t * 3) * 4);
  c.fillStyle = 'rgba(255,240,120,0.25)'; circ(c, 0, 0, 16 + Math.sin(t * 5) * 2); c.fill();
  circ(c, 0, 0, 10); fo(c, '#d9ee4a', 2.2);
  c.beginPath(); c.arc(-5, 0, 10, -0.95, 0.95); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
  c.beginPath(); c.arc(5, 0, 10, Math.PI - 0.95, Math.PI + 0.95); c.stroke();
  c.fillStyle = OUT; circ(c, -3, -2, 1.5); c.fill(); circ(c, 3, -2, 1.5); c.fill();
  c.beginPath(); if (talk && Math.sin(t * 18) > 0) { c.ellipse(0, 3.5, 2, 1.6, 0, 0, TAU); c.fill(); } else { c.arc(0, 2, 2.4, 0.2, Math.PI - 0.2); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke(); }
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
