// Scenery art: trees, rocks, mountains, little ground details, all baked once into crisp sprites.
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

const CANOPY = {
  meadow: ['#6cc24a', '#8fdc62'], forest: ['#4c9a43', '#66b553'], plains: ['#77c84e', '#97de68'], coast: ['#7acb55', '#9be06f'],
  isle: ['#de86b4', '#f2acd0'], desert: ['#8fbf4c', '#a9d466'], snow: ['#4f9a6a', '#6db585'], spooky: ['#6f5f8f', '#857aa6'],
  autumn: ['#ef9a3a', '#f8bd5e'], autumn2: ['#e0663c', '#f28a5a'],
};

const PropArt = {
  tree(g, v, b) {
    let [fill, hl] = CANOPY[b] || CANOPY.meadow;
    if ((b === 'meadow' || b === 'plains' || b === 'forest') && v === 3) [fill, hl] = CANOPY[(v + b.length) % 2 ? 'autumn' : 'autumn2'];
    shadowEl(g, 26, 9);
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(-4, -26); g.lineTo(4, -26); g.lineTo(6, 0); g.closePath(); fo(g, '#9a6a45');
    const sets = [
      [[-14, -40, 17], [12, -42, 18], [0, -56, 20], [-2, -34, 16]],
      [[-16, -44, 16], [14, -46, 16], [0, -60, 18], [0, -38, 18]],
      [[-12, -38, 15], [10, -40, 17], [-2, -54, 19], [16, -54, 12]],
      [[-15, -42, 18], [15, -42, 17], [0, -58, 19], [0, -36, 15]],
    ];
    blobShape(g, sets[v % 4], fill, hl);
    if (b === 'meadow' && v === 1) { g.fillStyle = '#e8473b'; for (const [x, y] of [[-10, -42], [8, -50], [12, -36], [-4, -58]]) { circ(g, x, y, 3); g.fill(); } }
    if (b === 'isle' && v % 2 === 0) { g.fillStyle = '#fff3fa'; for (const [x, y] of [[-10, -42], [8, -50], [12, -36], [-4, -58]]) { circ(g, x, y, 2.2); g.fill(); } }
  },
  pine(g, v, b) {
    const snow = b === 'snow', spook = b === 'spooky';
    const col = spook ? '#55496f' : snow ? '#3f8a63' : '#3f8f4f', hl = spook ? '#6a5d88' : snow ? '#57a77a' : '#56aa62';
    shadowEl(g, 20, 7);
    g.beginPath(); g.rect(-4, -14, 8, 14); fo(g, '#8a5a3c');
    const tiers = [[-12, 24], [-28, 20], [-43, 15]];
    for (let i = 0; i < 3; i++) {
      const [y, w] = tiers[i];
      g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + 5, w, y); g.lineTo(0, y - 26); g.closePath(); fo(g, col);
      g.beginPath(); g.moveTo(-w * 0.5, y - 2); g.lineTo(0, y - 24); g.lineTo(-w * 0.12, y - 2); g.closePath(); g.fillStyle = hl; g.fill();
      if (snow) { g.beginPath(); g.moveTo(-w * 0.45, y - 12); g.lineTo(0, y - 26); g.lineTo(w * 0.45, y - 12); g.quadraticCurveTo(w * 0.2, y - 8, 0, y - 12); g.quadraticCurveTo(-w * 0.2, y - 8, -w * 0.45, y - 12); g.fillStyle = '#ffffff'; g.fill(); }
    }
  },
  palm(g, v) {
    shadowEl(g, 22, 7);
    g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(-2, -30, 8, -56); g.lineTo(14, -54); g.quadraticCurveTo(6, -30, 5, 0); g.closePath(); fo(g, '#b88752');
    g.strokeStyle = '#94683d'; g.lineWidth = 1.5; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-3 + i * 0.5, -i * 9); g.lineTo(5 + i * 1.2, -i * 9 - 1); g.stroke(); }
    const fr = [[-1, -0.35], [1, -0.4], [-1, 0.25], [1, 0.3], [0.2, -1]];
    for (const [dx, dy] of fr) {
      g.beginPath(); g.moveTo(11, -56); g.quadraticCurveTo(11 + dx * 22, -66 + dy * 18, 11 + dx * 34, -50 + dy * 26); g.quadraticCurveTo(11 + dx * 18, -56 + dy * 8, 11, -54); fo(g, '#5fb848', 2.2);
    }
    g.fillStyle = '#8a5a34'; for (const [x, y] of [[8, -52], [13, -51], [11, -55]]) { circ(g, x, y, 3); g.fill(); }
  },
  dead(g, v) {
    shadowEl(g, 18, 6);
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(-3, -34); g.lineTo(-16, -50); g.lineTo(-13, -53); g.lineTo(-1, -40); g.lineTo(2, -60); g.lineTo(6, -60); g.lineTo(5, -38); g.lineTo(16, -48); g.lineTo(19, -45); g.lineTo(5, -30); g.lineTo(6, 0); g.closePath();
    fo(g, '#6b5470');
    if (v % 2) { g.fillStyle = '#b6e46a'; circ(g, -14, -52, 2); g.fill(); }
  },
  bush(g, v, b) {
    const [fill, hl] = CANOPY[b === 'isle' ? 'isle' : b === 'spooky' ? 'spooky' : 'forest'];
    shadowEl(g, 20, 6);
    blobShape(g, [[-9, -9, 10], [8, -9, 10], [0, -15, 11]], fill, hl);
    if (v === 1) { g.fillStyle = '#4c7ee8'; for (const [x, y] of [[-8, -12], [5, -16], [9, -7]]) { circ(g, x, y, 2.5); g.fill(); } }
    if (v === 2) { g.fillStyle = '#ff6f8f'; for (const [x, y] of [[-8, -12], [5, -16], [9, -7]]) { circ(g, x, y, 2.5); g.fill(); } }
  },
  rock(g, v, b) {
    const col = b === 'desert' ? '#d7a46c' : b === 'isle' ? '#a98aa8' : b === 'spooky' ? '#8d86a5' : '#a7a8b8';
    shadowEl(g, 22, 7);
    g.beginPath(); g.moveTo(-20, -2); g.quadraticCurveTo(-22, -18, -8, -24); g.quadraticCurveTo(6, -30, 16, -18); g.quadraticCurveTo(24, -6, 18, -1); g.quadraticCurveTo(0, 3, -20, -2); fo(g, col);
    g.beginPath(); g.moveTo(-12, -16); g.quadraticCurveTo(-4, -24, 8, -21); g.quadraticCurveTo(-2, -18, -12, -16); g.fillStyle = shade(col, 0.35); g.fill();
    if (v === 2) { g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(4, -8, 12, -4); g.lineWidth = 1.8; g.strokeStyle = shade(col, -0.25); g.stroke(); }
  },
  srock(g, v) {
    PropArt.rock(g, v, 'snow');
    g.beginPath(); g.moveTo(-17, -15); g.quadraticCurveTo(-8, -28, 4, -27); g.quadraticCurveTo(14, -25, 16, -17); g.quadraticCurveTo(6, -13, 0, -17); g.quadraticCurveTo(-8, -12, -17, -15); g.fillStyle = '#fff'; g.fill();
  },
  cactus(g, v) {
    shadowEl(g, 16, 6);
    const col = '#5cae5a';
    g.beginPath(); rrect(g, -7, -44, 14, 44, 7); fo(g, col);
    g.beginPath(); g.moveTo(-7, -20); g.lineTo(-15, -20); g.quadraticCurveTo(-19, -20, -19, -26); g.lineTo(-19, -32); g.quadraticCurveTo(-19, -36, -15, -36); g.quadraticCurveTo(-12, -36, -12, -32); g.lineTo(-12, -27); g.lineTo(-7, -27); fo(g, col);
    if (v % 2) { g.beginPath(); g.moveTo(7, -26); g.lineTo(14, -26); g.quadraticCurveTo(18, -26, 18, -32); g.lineTo(18, -38); g.quadraticCurveTo(18, -42, 14, -42); g.quadraticCurveTo(11, -42, 11, -38); g.lineTo(11, -33); g.lineTo(7, -33); fo(g, col); }
    g.strokeStyle = '#3f8a45'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -40); g.lineTo(0, -4); g.stroke();
    g.fillStyle = '#ff7fa8'; circ(g, 0, -46, 3.5); g.fill();
  },
  mountain(g, v) {
    shadowEl(g, 130, 26, 0.16);
    const pk = [[-125, 0], [-60, -150 - v * 12], [-25, -120], [10, -205 + v * 10], [75, -110], [125, 0]];
    g.beginPath(); pk.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); fo(g, '#8c96b5', 3.2);
    g.beginPath(); g.moveTo(10, -205 + v * 10); g.lineTo(75, -110); g.lineTo(125, 0); g.lineTo(20, 0); g.lineTo(40, -90); g.closePath(); g.fillStyle = '#76809f'; g.fill();
    g.beginPath(); g.moveTo(-60, -150 - v * 12); g.lineTo(-25, -120); g.lineTo(-75, -40); g.closePath(); g.fillStyle = '#a3add0'; g.fill();
    // snow caps
    const cap = (x, y, w) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + w * 1.3); g.lineTo(x + w * 0.45, y + w * 1.05); g.lineTo(x, y + w * 1.4); g.lineTo(x - w * 0.5, y + w * 1.0); g.lineTo(x - w * 0.95, y + w * 1.3); g.closePath(); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); };
    cap(10, -205 + v * 10, 34); cap(-60, -150 - v * 12, 24);
    g.beginPath(); pk.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.lineWidth = 3.2; g.strokeStyle = OUT; g.stroke();
  },
  mushroom(g, v, b) {
    const spook = b === 'spooky';
    const cap = spook ? '#9a6be0' : v % 2 ? '#e8473b' : '#f2a03d';
    for (const [x, y, s] of [[-6, 0, 1], [7, 2, 0.7]]) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = 'rgba(40,25,60,0.18)'; ell(g, 0, 0, 9, 3); g.fill();
      g.beginPath(); rrect(g, -3.5, -12, 7, 12, 3); fo(g, '#fff4dc', 2);
      g.beginPath(); g.moveTo(-11, -10); g.quadraticCurveTo(-10, -22, 0, -22); g.quadraticCurveTo(10, -22, 11, -10); g.closePath(); fo(g, cap, 2);
      g.fillStyle = spook ? '#e8d8ff' : '#fff'; for (const [a, c] of [[-5, -15], [3, -17], [6, -12]]) { circ(g, a, c, 1.8); g.fill(); }
      g.restore();
    }
  },
  pumpkin(g, v) {
    shadowEl(g, 16, 5);
    g.beginPath(); g.ellipse(-6, -11, 8, 11, 0, 0, TAU); g.ellipse(6, -11, 8, 11, 0, 0, TAU); g.ellipse(0, -11, 9, 12, 0, 0, TAU); fo(g, '#f08a2a');
    g.strokeStyle = '#c4621a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-4, -20); g.quadraticCurveTo(-6, -11, -4, -1); g.moveTo(4, -20); g.quadraticCurveTo(6, -11, 4, -1); g.stroke();
    g.beginPath(); g.rect(-1.5, -27, 4, 6); fo(g, '#5b8a3a', 1.6);
    if (v % 2 === 0) {
      g.fillStyle = '#ffd66b';
      g.beginPath(); g.moveTo(-7, -14); g.lineTo(-3, -14); g.lineTo(-5, -18); g.fill();
      g.beginPath(); g.moveTo(3, -14); g.lineTo(7, -14); g.lineTo(5, -18); g.fill();
      g.beginPath(); g.moveTo(-6, -8); g.quadraticCurveTo(0, -3, 6, -8); g.quadraticCurveTo(0, -6, -6, -8); g.fill();
    }
  },
  yarn(g, v) {
    const col = ['#e8475f', '#4d8fe6', '#f2c14a', '#8b5fd6'][v % 4];
    shadowEl(g, 15, 5);
    circ(g, 0, -13, 13); fo(g, col);
    g.strokeStyle = shade(col, -0.25); g.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(0, -13, 11, 4 + Math.abs(i) * 1.5, i * 0.5, 0, Math.PI); g.stroke(); }
    g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(20, 0, 26, -2); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
  },
  post(g, v) {
    shadowEl(g, 20, 6);
    g.beginPath(); rrect(g, -18, -6, 36, 8, 3); fo(g, '#b88aa8');
    g.beginPath(); g.rect(-7, -54, 14, 50); fo(g, '#d9b98a');
    g.strokeStyle = '#a8865a'; g.lineWidth = 1.5; for (let y = -50; y < -6; y += 5) { g.beginPath(); g.moveTo(-7, y); g.lineTo(7, y + 3); g.stroke(); }
    g.beginPath(); rrect(g, -15, -62, 30, 9, 3); fo(g, '#b88aa8');
    if (v % 2) { g.beginPath(); g.moveTo(10, -53); g.lineTo(10, -40); g.strokeStyle = '#e8475f'; g.lineWidth = 1.5; g.stroke(); circ(g, 10, -38, 3.5); g.fillStyle = '#e8475f'; g.fill(); }
  },
  bones(g, v) {
    g.fillStyle = 'rgba(40,25,60,0.15)'; ell(g, 0, 0, 16, 4); g.fill();
    drawBone(g, -4, -4, 18, 0.3 + v, '#fbf3e0', 2); if (v % 2) drawBone(g, 7, -2, 13, -0.6, '#fbf3e0', 2);
  },
  log(g, v) {
    shadowEl(g, 26, 6);
    g.beginPath(); rrect(g, -24, -14, 46, 13, 6); fo(g, '#9a6a45');
    circ(g, 22, -7.5, 6.5); fo(g, '#e2b77f', 2); circ(g, 22, -7.5, 3); g.strokeStyle = '#b88752'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#5fa24c'; circ(g, -10, -15, 3); g.fill(); circ(g, -6, -16, 2.5); g.fill();
  },
  snowman(g, v) {
    shadowEl(g, 16, 5);
    circ(g, 0, -11, 12); fo(g, '#ffffff'); circ(g, 0, -29, 9); fo(g, '#ffffff');
    // dog ears made of snow
    g.beginPath(); g.ellipse(-8, -33, 3.5, 7, 0.4, 0, TAU); fo(g, '#e8f0fa', 2); g.beginPath(); g.ellipse(8, -33, 3.5, 7, -0.4, 0, TAU); fo(g, '#e8f0fa', 2);
    g.fillStyle = OUT; circ(g, -3, -31, 1.4); g.fill(); circ(g, 3, -31, 1.4); g.fill(); circ(g, 0, -27, 2); g.fill();
    g.beginPath(); rrect(g, -9, -22, 18, 4, 2); fo(g, '#e8475f', 1.6);
  },
  stump(g, v) {
    shadowEl(g, 16, 5);
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(-10, -14); g.lineTo(10, -14); g.lineTo(12, 0); g.closePath(); fo(g, '#7d5b6b');
    g.beginPath(); g.ellipse(0, -14, 10, 4, 0, 0, TAU); fo(g, '#b89a9a', 2);
  },
  crystal(g, v) {
    shadowEl(g, 14, 5);
    for (const [x, h, w] of [[-6, 26, 6], [5, 34, 7], [12, 18, 5]]) { g.beginPath(); g.moveTo(x - w, 0); g.lineTo(x - w, -h + w); g.lineTo(x, -h); g.lineTo(x + w, -h + w); g.lineTo(x + w, 0); g.closePath(); fo(g, '#9fdcf5', 2); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(x - w + 2, -2); g.lineTo(x - w + 2, -h + w); g.lineTo(x, -h + 2); g.lineTo(x - 1, -2); g.fill(); }
  },
  lamp(g) {
    shadowEl(g, 8, 3);
    g.beginPath(); g.rect(-2, -46, 4, 46); fo(g, '#4a3a52', 2);
    g.beginPath(); rrect(g, -7, -58, 14, 14, 4); fo(g, '#ffe28a', 2);
    g.beginPath(); g.moveTo(-9, -58); g.lineTo(0, -66); g.lineTo(9, -58); g.closePath(); fo(g, '#4a3a52', 2);
  },
};
const PROP_SIZE = { mountain: [270, 240, 135, 228], tree: [80, 90, 40, 82], pine: [60, 80, 30, 74], palm: [90, 90, 40, 82], dead: [50, 70, 25, 66] };

function propSprite(p, b) {
  const sz = PROP_SIZE[p.kind] || [70, 74, 35, 66];
  return sprite(p.kind + ':' + p.v + ':' + b, sz[0], sz[1], sz[2], sz[3], (g) => PropArt[p.kind](g, p.v, b));
}

// flat ground details
const DecorArt = {
  tuft(g, v, b) {
    const col = BIOMES[b] ? BIOMES[b].dark : '#6fa64a';
    g.strokeStyle = col; g.lineWidth = 2.2;
    for (const [x, h, a] of [[-4, 9, -0.35], [0, 12, 0], [4, 8, 0.4]]) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + a * 4, -h * 0.6, x + a * 10, -h); g.stroke(); }
  },
  flower(g, v, b) {
    const col = ['#ffffff', '#ffd84d', '#ff8fb4', '#8fb8ff'][v % 4];
    g.strokeStyle = '#5c9a3e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -7); g.stroke();
    g.fillStyle = col; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circ(g, Math.cos(a) * 3.2, -9 + Math.sin(a) * 3.2, 2.4); g.fill(); }
    g.fillStyle = v % 4 === 1 ? '#e8743b' : '#ffd84d'; circ(g, 0, -9, 1.8); g.fill();
  },
  fern(g, v, b) {
    const col = b === 'spooky' ? '#6a5d88' : '#4f9a43';
    g.strokeStyle = col; g.lineWidth = 2.4;
    for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.sin(a) * 6, -8, Math.sin(a) * 13, -6 - Math.cos(a) * 6); g.stroke(); }
  },
  pebble(g, v, b) {
    const col = b === 'desert' ? '#d29a5e' : b === 'snow' ? '#b9c6d8' : '#9a96a8';
    g.fillStyle = col; ell(g, -3, -1, 3.2, 2.2); g.fill(); ell(g, 3, 0, 2.4, 1.8); g.fill(); if (v % 2) { ell(g, 0, -4, 1.8, 1.4); g.fill(); }
  },
  shell(g, v) {
    const col = ['#ffb3a7', '#fff0d0', '#ffd27a'][v % 3];
    g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-6, -8, 0, -8); g.quadraticCurveTo(6, -8, 5, 0); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 1.4; g.strokeStyle = shade(col, -0.35); g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -7); g.moveTo(-2.5, 0); g.lineTo(-3.5, -6); g.moveTo(2.5, 0); g.lineTo(3.5, -6); g.stroke();
  },
  drift(g) {
    g.fillStyle = '#d4e2f2'; ell(g, 0, 0, 14, 4.5); g.fill(); g.fillStyle = '#ffffff'; ell(g, -2, -1.5, 11, 3.5); g.fill();
  },
};
function decorSprite(d) { return sprite('d:' + d.kind + ':' + d.v + ':' + d.b, 32, 22, 16, 18, (g) => DecorArt[d.kind](g, d.v, d.b)); }
