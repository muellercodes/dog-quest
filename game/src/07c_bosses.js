// Bosses: each move is a little script of red warnings.
const Bosses = { current: null };
Bosses.spawn = function (key, x, y) {
  const d = BOSSES[key], hp = Math.round(d.hp * DIFF[G.diff].hp);
  const f = { id: foeId++, key, boss: key, def: d, name: d.name, lv: d.lv, hp, maxHp: hp, atk: d.atk * (1 + 0.2 * (d.lv - 1)), spd: d.spd, r: d.r, sc: d.sc, art: d.art, x, y, face: -1, t: 0, st: 0,
    busy: 1.2, walkT: 0, q: [], last: null, hurt: 0, kbx: 0, kby: 0, move: 0, spawnT: 0.01, fly: key === 'vacuum' ? 0 : 0 };
  S.foes.push(f);
  this.current = f;
  fxPuff(x, y - 20, 14);
  return f;
};
function later(f, t, fn) { f.q.push([t, fn]); }
function bw(f, t) { return t * (f.enraged ? 0.82 : 1) * (G.diff === 0 ? 1.15 : G.diff === 2 ? 0.92 : 1); }
function roomClamp(x, y, m) { if (S.scene !== 'dungeon') return { x, y }; const r = Dungeon.room(); m = m || 60; return { x: clamp(x, r.x + 40 + m, r.x + r.w - 40 - m), y: clamp(y, r.y + 70 + m * 0.6, r.y + r.h - 40 - m * 0.6) }; }
function lobTo(f, k, x, y, dur, h) { S.proj.push({ k, from: 'foe', x: f.x, y: f.y - 30, vx: 0, vy: 0, r: 10, dmg: 0, life: dur + 0.1, lob: { t: 0, dur, x0: f.x, y0: f.y - 30, x1: x, y1: y, h: h || 160 } }); }

Bosses.update = function (f, dt) {
  for (let i = f.q.length - 1; i >= 0; i--) { f.q[i][0] -= dt; if (f.q[i][0] <= 0) { const fn = f.q[i][1]; f.q.splice(i, 1); if (f.hp > 0) fn(); } }
  f.move = 0;
  if (!f.enraged && f.hp < f.maxHp * 0.5) { f.enraged = 1; fxText(f.x, f.y - 90, 'Grrr!', '#ff5a6a', true); shake(6); }
  if (f.dashing) {
    const D = f.dashing, sp = D.spd * dt;
    const ox = f.x, oy = f.y;
    moveBody(f, Math.cos(D.a) * sp, Math.sin(D.a) * sp); f.move = 1;
    D.left -= sp;
    if (!D.hit && dist(f.x, f.y, P.x, P.y) < f.r + P.r + 6) { D.hit = 1; heroHurt(D.dmg, f.x, f.y); }
    if (D.left <= 0 || (Math.abs(f.x - ox) + Math.abs(f.y - oy) < sp * 0.3)) { if (D.left > 0) { shake(8); fxPuff(f.x + Math.cos(D.a) * f.r, f.y, 8); } f.dashing = null; }
    if (Math.random() < 0.6) fxPuff(f.x, f.y, 1);
    return;
  }
  if (f.jump) {
    const J = f.jump; J.t += dt;
    if (J.t > J.delay) { const k = clamp((J.t - J.delay) / J.dur, 0, 1); f.x = lerp(J.x0, J.x1, k); f.y = lerp(J.y0, J.y1, k); f.hop = Math.sin(k * Math.PI) * 70; if (k >= 1) { f.jump = null; f.hop = 0; shake(6); fxPuff(f.x, f.y, 8); } }
  }
  if (f.pullTel && S.tele.includes(f.pullTel) && P.state !== 'roll' && inShape(f.pullTel, P.x, P.y, 8)) { const a = angTo(P.x, P.y, f.x, f.y); moveBody(P, Math.cos(a) * 165 * dt, Math.sin(a) * 165 * dt, true); }
  if (!f.jump) f.face = P.x > f.x ? 1 : -1;
  f.busy -= dt;
  if (f.busy > 0 || P.state === 'dead') return;
  if (f.walkT > 0) {
    f.walkT -= dt;
    const d = dist(f.x, f.y, P.x, P.y);
    if (d > 150) { const a = angTo(f.x, f.y, P.x, P.y); moveBody(f, Math.cos(a) * f.spd * 0.7 * dt, Math.sin(a) * f.spd * 0.7 * dt); f.move = 1; }
    return;
  }
  const moves = BOSSES[f.key].moves;
  let m = pick(moves);
  for (let k = 0; k < 4 && m === f.last; k++) m = pick(moves);
  f.last = m;
  f.busy = this.moves[m](f);
  f.walkT = rand(0.45, 1.0) * (f.enraged ? 0.6 : 1);
};

Bosses.moves = {
  acornRain(f) {
    const n = f.enraged ? 10 : 6;
    for (let i = 0; i < n; i++) later(f, i * 0.14, () => { const p = roomClamp(P.x + rand(-120, 120), P.y + rand(-90, 90), 20); warn({ shape: 'circle', x: p.x, y: p.y, r: 46, dur: bw(f, 1.0), dmg: f.atk, boom: '#b5773e' }); lobTo(f, 'acorn', p.x, p.y, bw(f, 1.0)); });
    return n * 0.14 + 1.0;
  },
  tailSpin(f) { warn({ shape: 'circle', x: f.x, y: f.y, r: 140, dur: bw(f, 1.0), dmg: f.atk * 1.3, src: f, follow: f, boom: '#ffffff' }); later(f, bw(f, 1.0), () => { shake(5); Sfx.play('swipe'); }); return 1.5; },
  charge(f) {
    const a = angTo(f.x, f.y, P.x, P.y), len = 600;
    warn({ shape: 'rect', x: f.x, y: f.y, a, len, w: 84, dur: bw(f, 0.85), noHit: 1, src: f, onDone: () => { f.dashing = { a, left: len, spd: 980, dmg: f.atk * 1.3, hit: 0 }; Sfx.play('roll'); } });
    return bw(f, 0.85) + 0.8;
  },
  summon(f) {
    const k = BOSSES[f.key].summon, n = f.enraged ? 3 : 2;
    if (S.foes.filter((m) => !m.boss && m.hp > 0).length >= 4) return this.charge(f);
    for (let i = 0; i < n; i++) later(f, 0.25 * i, () => { const a = rand(0, TAU); const p = roomClamp(f.x + Math.cos(a) * 150, f.y + Math.sin(a) * 110, 30); addFoe(makeFoe(k, Math.max(1, BOSSES[f.key].lv - 2), p.x, p.y, { aggro: 1, minion: 1 })); });
    fxText(f.x, f.y - 100, BOSSES[f.key].summon === 'squirrel' ? 'Get them, my nuts!' : 'Minions!', '#ffffff');
    return 1.1;
  },
  cannons(f) {
    const a = angTo(f.x, f.y, P.x, P.y), n = f.enraged ? 7 : 5;
    for (let i = 0; i < n; i++) later(f, i * 0.12, () => { const p = roomClamp(f.x + Math.cos(a) * (110 + i * 90), f.y + Math.sin(a) * (110 + i * 90), 10); warn({ shape: 'circle', x: p.x, y: p.y, r: 58, dur: bw(f, 1.0), dmg: f.atk * 1.1, boom: '#3a3440' }); lobTo(f, 'cannon', p.x, p.y, bw(f, 1.0), 200); });
    Sfx.play('boom');
    return n * 0.12 + 1.1;
  },
  sweep(f) {
    const a = angTo(f.x, f.y, P.x, P.y);
    warn({ shape: 'cone', x: f.x, y: f.y, a, r: 185, half: 1.2, dur: bw(f, 0.8), dmg: f.atk * 1.3, src: f });
    if (f.enraged) later(f, 0.9, () => warn({ shape: 'cone', x: f.x, y: f.y, a: angTo(f.x, f.y, P.x, P.y), r: 185, half: 1.2, dur: bw(f, 0.6), dmg: f.atk * 1.3, src: f }));
    return f.enraged ? 1.9 : 1.2;
  },
  anchor(f) {
    const a = angTo(f.x, f.y, P.x, P.y);
    warn({ shape: 'rect', x: f.x, y: f.y, a, len: 700, w: 46, dur: bw(f, 0.75), noHit: 1, src: f, onDone: () => S.proj.push({ k: 'anchor', from: 'foe', x: f.x, y: f.y - 20, vx: Math.cos(a) * 780, vy: Math.sin(a) * 780, r: 16, dmg: f.atk * 1.2, life: 1.3 }) });
    return 1.3;
  },
  icicles(f) {
    const n = 8, off = rand(0, TAU);
    const ring = (o) => { for (let i = 0; i < n; i++) warn({ shape: 'rect', x: f.x, y: f.y, a: o + (i / n) * TAU, len: 480, w: 38, dur: bw(f, 1.0), dmg: f.atk, src: f, boom: '#bfe8fa' }); };
    ring(off);
    if (f.enraged) later(f, 1.15, () => ring(off + Math.PI / n));
    return f.enraged ? 2.5 : 1.5;
  },
  pounces(f) {
    const n = f.enraged ? 4 : 3;
    for (let i = 0; i < n; i++) later(f, i * 0.95, () => {
      const p = roomClamp(P.x, P.y, 40), d = bw(f, 0.75);
      warn({ shape: 'circle', x: p.x, y: p.y, r: 76, dur: d, dmg: f.atk * 1.2, boom: '#ffffff' });
      f.jump = { t: 0, delay: Math.max(0, d - 0.32), dur: 0.32, x0: f.x, y0: f.y, x1: p.x, y1: p.y };
    });
    return n * 0.95 + 0.4;
  },
  blizzard(f) {
    warn({ shape: 'ring', x: f.x, y: f.y, r: 105, r2: 320, dur: bw(f, 1.15), dmg: f.atk * 1.2, src: f });
    later(f, 1.35, () => warn({ shape: 'circle', x: f.x, y: f.y, r: 120, dur: bw(f, 0.9), dmg: f.atk * 1.2, src: f }));
    for (let i = 0; i < 20; i++) S.fx.push({ k: 'dot', x: f.x + rand(-300, 300), y: f.y + rand(-200, 200), vx: rand(80, 160), vy: rand(20, 60), t: 0, life: 1.6, r: rand(2, 4), col: '#ffffff', g: 0 });
    return 2.6;
  },
  snowballs(f) {
    const n = f.enraged ? 8 : 6;
    for (let i = 0; i < n; i++) later(f, i * 0.12, () => { const p = roomClamp(P.x + rand(-140, 140), P.y + rand(-100, 100), 20); warn({ shape: 'circle', x: p.x, y: p.y, r: 52, dur: bw(f, 1.0), dmg: f.atk, boom: '#ffffff' }); lobTo(f, 'snowball', p.x, p.y, bw(f, 1.0)); });
    return n * 0.12 + 1.1;
  },
  eyebeam(f) {
    const dir = Math.random() < 0.5 ? 1 : -1, a0 = angTo(f.x, f.y, P.x, P.y) - dir * 0.9, n = f.enraged ? 9 : 7;
    for (let i = 0; i < n; i++) later(f, i * 0.12, () => warn({ shape: 'rect', x: f.x, y: f.y - 10, a: a0 + dir * i * 0.27, len: 720, w: 44, dur: bw(f, 0.7), dmg: f.atk, src: f }));
    return n * 0.12 + 0.95;
  },
  sandring(f) {
    [[50, 155, 0.9], [155, 260, 1.3], [260, 365, 1.7]].forEach(([a, b, t]) => warn({ shape: 'ring', x: f.x, y: f.y, r: a, r2: b, dur: bw(f, t), dmg: f.atk, src: f, boom: '#ebc47e' }));
    return 2.1;
  },
  curse(f) {
    const n = f.enraged ? 6 : 5;
    for (let i = 0; i < n; i++) later(f, i * 0.35, () => warn({ shape: 'circle', x: P.x, y: P.y, r: 60, dur: bw(f, 0.85), dmg: f.atk, boom: '#7fff8a' }));
    return n * 0.35 + 0.9;
  },
  yarn(f) {
    const n = f.enraged ? 4 : 3, a0 = angTo(f.x, f.y, P.x, P.y);
    for (let i = 0; i < n; i++) {
      const a = a0 + (i - (n - 1) / 2) * 0.55;
      warn({ shape: 'rect', x: f.x, y: f.y, a, len: 220, w: 26, dur: 0.6, noHit: 1, src: f, onDone: () => S.proj.push({ k: 'yarn', from: 'foe', x: f.x, y: f.y - 16, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, r: 12, dmg: f.atk * 0.9, life: 4.5, bounce: 1 }) });
    }
    return 1.5;
  },
  swipes(f) {
    for (let i = 0; i < 3; i++) later(f, i * 0.55, () => {
      const a = angTo(f.x, f.y, P.x, P.y);
      moveBody(f, Math.cos(a) * 45, Math.sin(a) * 45);
      warn({ shape: 'cone', x: f.x, y: f.y, a, r: 125, half: 1.0, dur: bw(f, 0.5), dmg: f.atk, src: f });
    });
    return 2.2;
  },
  suckup(f) {
    const a = angTo(f.x, f.y, P.x, P.y), d = bw(f, 1.6);
    f.pullTel = warn({ shape: 'cone', x: f.x, y: f.y, a, r: 380, half: 0.55, dur: d, noHit: 1, src: f });
    later(f, d, () => { f.pullTel = null; warn({ shape: 'circle', x: f.x + Math.cos(a) * 70, y: f.y + Math.sin(a) * 70, r: 105, dur: 0.35, dmg: f.atk * 1.4, src: f }); });
    Sfx.play('vacuum');
    return d + 0.8;
  },
  dustbunnies(f) {
    const spray = (o) => { for (let i = 0; i < 12; i++) { const a = o + (i / 12) * TAU; S.proj.push({ k: 'dust', from: 'foe', x: f.x, y: f.y - 30, vx: Math.cos(a) * 290, vy: Math.sin(a) * 290, r: 11, dmg: f.atk * 0.8, life: 2.6 }); } };
    warn({ shape: 'circle', x: f.x, y: f.y, r: 80, dur: 0.6, noHit: 1, src: f, follow: f, onDone: () => spray(rand(0, TAU)) });
    if (f.enraged) later(f, 1.0, () => spray(rand(0, TAU)));
    return f.enraged ? 2.2 : 1.6;
  },
  bigslam(f) {
    warn({ shape: 'circle', x: f.x, y: f.y, r: 215, dur: bw(f, 1.25), dmg: f.atk * 1.6, src: f, follow: f, onDone: () => { shake(14); Sfx.play('boom'); fxBurst(f.x, f.y, '#c9c4d6', 30, 360); } });
    return 1.9;
  },
};

Bosses.defeated = function (f) {
  S.tele.length = 0;
  S.proj = S.proj.filter((p) => p.from === 'hero');
  for (const m of S.foes) if (!m.boss && m.hp > 0) { m.hp = 0; m.dead = 0.0001; fxPuff(m.x, m.y, 6); }
  shake(16); Sfx.play('bossdown');
  fxBurst(f.x, f.y - 30, '#ffd84d', 40, 380); fxRing(f.x, f.y - 20, '#ffffff', 220, 0.8);
  S.slowmo = 0.25;
  setTimeout(() => (S.slowmo = 1), 700);
  if (f.key === 'mittens') {
    // Mittens hops into his machine
    setTimeout(() => Dialog.play(BOSS_LINES.mittens.phase2, () => { const v = Bosses.spawn('vacuum', f.x, f.y); v.busy = 1.0; }), 900);
    return;
  }
  const key = f.key === 'vacuum' ? 'mittens' : f.key;
  giveXp(f.lv * 40); giveGold(f.lv * 30);
  this.current = null;
  setTimeout(() => Dialog.play(BOSS_LINES[key].win, () => Dungeon.bossBeaten(key)), 1000);
};
