// Critters: making them, their brains, the packs that roam Barkadia, and the bosses.
let foeId = 1;
function makeFoe(key, lv, x, y, opts) {
  opts = opts || {};
  const d = FOES[key], el = opts.elite ? 1 : 0, dh = DIFF[G.diff].hp;
  const hp = Math.round(d.hp * (1 + 0.36 * (lv - 1)) * dh * (el ? 6 : 1));
  const sc = (d.sc || 1) * (el ? 1.6 : 1);
  return {
    id: foeId++, key, def: d, name: opts.elite || d.name, lv, hp, maxHp: hp, atk: d.atk * (1 + 0.25 * (lv - 1)) * (el ? 1.35 : 1), spd: d.spd * (el ? 1.05 : 1), r: d.r * sc, x, y,
    home: { x, y }, face: Math.random() < 0.5 ? 1 : -1, state: 'idle', st: rand(0, 2), t: rand(0, 5), cd: rand(0.4, 1.2), sc, fly: d.fly, art: d.art, atks: d.atks,
    xp: d.xp * (1 + 0.3 * (lv - 1)) * (el ? 6 : 1), gold: d.gold * (1 + 0.25 * (lv - 1)) * (el ? 10 : 1), aggro: opts.aggro ? 1 : 0, spawnT: opts.noPuff ? 0 : 0.35, elite: opts.elite, bounty: opts.bounty,
    quest: opts.quest, pack: opts.pack, wx: x, wy: y, wanderT: rand(0, 2), hurt: 0, kbx: 0, kby: 0, move: 0,
  };
}
function addFoe(f) { S.foes.push(f); if (f.spawnT > 0) fxPuff(f.x, f.y - 8, 6); return f; }

function updateFoes(dt) {
  for (let i = S.foes.length - 1; i >= 0; i--) {
    const f = S.foes[i];
    if (f.gone) { S.foes.splice(i, 1); continue; }
    updateFoe(f, dt);
  }
  // keep them from stacking
  for (let i = 0; i < S.foes.length; i++) for (let j = i + 1; j < S.foes.length; j++) {
    const a = S.foes[i], b = S.foes[j];
    if (a.hp <= 0 || b.hp <= 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d > 0.1 && d < m) { const push = (m - d) * 0.5, ux = dx / d, uy = dy / d; if (!a.boss) moveBody(a, -ux * push, -uy * push); if (!b.boss) moveBody(b, ux * push, uy * push); }
  }
  // stink clouds linger
  for (let i = S.clouds.length - 1; i >= 0; i--) {
    const k = S.clouds[i]; k.t += dt; k.tick -= dt;
    if (k.tick <= 0) { k.tick = 0.5; if (dist(P.x, P.y, k.x, k.y) < k.r) heroHurt(k.dmg, k.x, k.y); }
    if (k.t > k.life) S.clouds.splice(i, 1);
  }
}

function foeSafeZone() { return S.scene === 'world' && (P.swim || World.townAt(P.x, P.y)); }

function updateFoe(f, dt) {
  f.t += dt; f.st += dt; f.cd -= dt;
  f.hurt = Math.max(0, f.hurt - dt * 5);
  if (f.dead) { f.dead += dt; if (f.dead > 0.35) f.gone = true; return; }
  if (f.spawnT > 0) { f.spawnT -= dt; return; }
  if (f.kbx || f.kby) { moveBody(f, f.kbx * dt, f.kby * dt); f.kbx *= Math.pow(0.002, dt); f.kby *= Math.pow(0.002, dt); if (Math.abs(f.kbx) + Math.abs(f.kby) < 10) f.kbx = f.kby = 0; }
  if (f.stun > 0) { f.stun -= dt; f.move = 0; if (f.state === 'wind') cancelWind(f); return; }
  if (f.boss) return Bosses.update(f, dt);
  const dP = dist(f.x, f.y, P.x, P.y), safe = foeSafeZone(), heroOk = P.state !== 'dead';
  f.move = 0;
  switch (f.state) {
    case 'idle': case 'wander': {
      if (heroOk && !safe && (dP < (f.elite ? 300 : 250) || (f.aggro && dP < 700))) { f.state = 'chase'; f.st = 0; f.alert = 0.6; Sfx.play('alert'); break; }
      f.wanderT -= dt;
      if (f.wanderT <= 0) { f.wanderT = rand(1.5, 3.5); const a = rand(0, TAU), r = rand(0, 120); f.wx = f.home.x + Math.cos(a) * r; f.wy = f.home.y + Math.sin(a) * r; }
      const dw = dist(f.x, f.y, f.wx, f.wy);
      if (dw > 8) { const a = angTo(f.x, f.y, f.wx, f.wy); moveBody(f, Math.cos(a) * f.spd * 0.35 * dt, Math.sin(a) * f.spd * 0.35 * dt); f.face = Math.cos(a) >= 0 ? 1 : -1; f.move = 0.4; }
      break;
    }
    case 'chase': {
      if (!heroOk || safe || dist(f.x, f.y, f.home.x, f.home.y) > 1000) { f.state = 'return'; f.st = 0; break; }
      const k = pickAtk(f, dP);
      if (k && f.cd <= 0) { startAtk(f, k); break; }
      const want = f.fly ? 90 : 46;
      const a = angTo(f.x, f.y, P.x, P.y);
      f.face = Math.cos(a) >= 0 ? 1 : -1;
      if (dP > want) {
        // circle a little so packs spread around the hero
        const side = ((f.id % 3) - 1) * 0.5;
        moveBody(f, Math.cos(a + side) * f.spd * dt, Math.sin(a + side) * f.spd * dt); f.move = 1;
      }
      break;
    }
    case 'wind': {
      f.face = Math.cos(f.atkA) >= 0 ? 1 : -1;
      if (f.jump && f.st >= f.jump.start) {
        const k = clamp((f.st - f.jump.start) / f.jump.dur, 0, 1);
        f.x = lerp(f.jump.x0, f.jump.x1, k); f.y = lerp(f.jump.y0, f.jump.y1, k); f.hop = Math.sin(k * Math.PI) * 50;
      }
      if (f.pull && f.tel && inShape(f.tel, P.x, P.y, 6) && P.state !== 'roll') { const a = angTo(P.x, P.y, f.x, f.y); moveBody(P, Math.cos(a) * 110 * dt, Math.sin(a) * 110 * dt, true); }
      if (f.st >= f.windT) { f.state = f.dashing ? 'dash' : 'recover'; f.st = 0; f.hop = 0; f.jump = null; }
      break;
    }
    case 'dash': {
      const sp = f.dashing.spd;
      moveBody(f, Math.cos(f.dashing.a) * sp * dt, Math.sin(f.dashing.a) * sp * dt); f.move = 1;
      f.dashing.left -= sp * dt;
      if (!f.dashing.hit && dist(f.x, f.y, P.x, P.y) < f.r + P.r + 6) { f.dashing.hit = 1; heroHurt(f.dashing.dmg, f.x, f.y); }
      if (f.dashing.left <= 0) { f.dashing = null; f.state = 'recover'; f.st = 0; }
      break;
    }
    case 'recover': if (f.st > 0.5) { f.state = 'chase'; f.st = 0; } break;
    case 'return': {
      const a = angTo(f.x, f.y, f.home.x, f.home.y), d = dist(f.x, f.y, f.home.x, f.home.y);
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.4 * dt);
      if (d < 20) { f.state = 'idle'; f.aggro = 0; break; }
      moveBody(f, Math.cos(a) * f.spd * dt, Math.sin(a) * f.spd * dt); f.face = Math.cos(a) >= 0 ? 1 : -1; f.move = 1;
      if (f.st > 4) { f.x = f.home.x; f.y = f.home.y; }
      if (heroOk && !safe && dP < 200 && f.st > 1) { f.state = 'chase'; f.st = 0; }
      break;
    }
  }
}
function pickAtk(f, dP) {
  const opts = f.atks.filter((k) => dP <= ATKS[k].rng + f.r);
  return opts.length ? pick(opts) : null;
}
function cancelWind(f) { if (f.tel) { const i = S.tele.indexOf(f.tel); if (i >= 0) S.tele.splice(i, 1); } for (const t of f.extraTel || []) { const i = S.tele.indexOf(t); if (i >= 0) S.tele.splice(i, 1); } f.state = 'recover'; f.st = 0; f.jump = null; f.hop = 0; f.dashing = null; }

function startAtk(f, key) {
  const A = ATKS[key], a = angTo(f.x, f.y, P.x, P.y);
  const wind = A.wind * (f.elite ? 0.9 : 1), dmg = f.atk * A.dmg;
  f.state = 'wind'; f.st = 0; f.windT = wind; f.atkA = a; f.cd = rand(1.1, 2.0) * (f.elite ? 0.8 : 1); f.atkKey = key; f.pull = A.pull; f.extraTel = [];
  let sh = { shape: A.shape, a, dur: wind, dmg, src: f, half: A.half, len: A.len, w: A.w };
  if (A.shape === 'circle') {
    if (A.at === 'self') { sh.x = f.x; sh.y = f.y; sh.r = A.r * Math.max(1, f.sc * 0.8); sh.follow = f; }
    else if (A.at === 'front') { sh.x = f.x + Math.cos(a) * A.off * f.sc; sh.y = f.y + Math.sin(a) * A.off * f.sc; sh.r = A.r * Math.max(1, f.sc * 0.8); }
    else if (A.at === 'blink') {
      fxPuff(f.x, f.y - 10, 8);
      const b = rand(0, TAU); f.x = P.x + Math.cos(b) * 80; f.y = P.y + Math.sin(b) * 80;
      if (blockedAt(f.x, f.y, f.r, f)) { f.x = P.x + Math.cos(b + Math.PI) * 80; f.y = P.y + Math.sin(b + Math.PI) * 80; }
      fxPuff(f.x, f.y - 10, 8); sh.x = P.x; sh.y = P.y; sh.r = A.r; f.atkA = angTo(f.x, f.y, P.x, P.y);
    } else {
      const d = Math.min(dist(f.x, f.y, P.x, P.y), A.rng);
      sh.x = f.x + Math.cos(a) * d; sh.y = f.y + Math.sin(a) * d; sh.r = A.r * Math.max(1, f.sc * 0.7);
    }
  } else { sh.x = f.x; sh.y = f.y; if (A.shape === 'cone') sh.r = A.r * Math.max(1, f.sc * 0.7); }
  if (A.shot || A.dash) sh.noHit = 1;
  if (A.dash) { f.dashing = { a, left: A.len, spd: A.dash, dmg, hit: 0 }; }
  if (A.jump) { f.jump = { start: Math.max(0, wind - 0.3), dur: 0.3, x0: f.x, y0: f.y, x1: sh.x, y1: sh.y }; }
  if (A.lob) { S.proj.push({ k: A.lob, from: 'foe', x: f.x, y: f.y, vx: 0, vy: 0, r: 8, dmg: 0, life: wind + 0.1, lob: { t: 0, dur: wind, x0: f.x, y0: f.y - 10, x1: sh.x, y1: sh.y, h: 120 } }); }
  if (A.cloud) sh.onDone = (w) => { S.clouds.push({ x: w.x, y: w.y, r: w.r * 0.85, t: 0, life: 2.6, tick: 0.5, dmg: dmg * 0.3 }); S.fx.push({ k: 'cloud', x: w.x, y: w.y, r: w.r, t: 0, life: 2.6 }); };
  if (A.shot) {
    const n = A.spread || 1;
    sh.onDone = () => {
      if (f.hp <= 0) return;
      for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * 0.28; S.proj.push({ k: A.shot.art, from: 'foe', x: f.x, y: f.y - 14, vx: Math.cos(aa) * A.shot.spd, vy: Math.sin(aa) * A.shot.spd, r: A.shot.r, dmg, life: 1.4, slow: A.shot.slow }); }
      Sfx.play('shoot');
    };
    if (n > 1) for (let i = 0; i < n; i++) if (i !== (n - 1) / 2) f.extraTel.push(warn(Object.assign({}, sh, { a: a + (i - (n - 1) / 2) * 0.28, onDone: null })));
  }
  if (A.shape === 'circle' && A.at === 'self' || key === 'swipe' || key === 'bite' || key === 'pinch') sh.onDone = sh.onDone || (() => Sfx.play('swipe'));
  f.tel = warn(sh);
}

// ---------- packs of critters roaming the world
const Packs = { list: [] };
Packs.init = function () {
  this.list = [];
  const rng = mulberry32(99);
  for (let y = 260; y < WH - 200; y += 430) for (let x = 260; x < WW - 200; x += 430) {
    const px = x + (rng() - 0.5) * 240, py = y + (rng() - 0.5) * 240;
    if (World.Fat(px, py) < 0.12) continue;
    if (rng() < 0.4) continue;
    let ok = true;
    for (const t of Object.values(TOWNS)) if (dist(px, py, t.x, t.y) < t.r + 380) ok = false;
    for (const t of Object.values(DUNGEON_SPOTS)) if (dist(px, py, t.x, t.y) < 230) ok = false;
    if (!ok || World.blocked(px, py, 20, false)) continue;
    const reg = World.regionAt(px, py);
    if (!reg) continue;
    const lv = Math.round(lerp(reg.lv[0], reg.lv[1], rng()));
    this.list.push({ x: px, y: py, region: reg.id, lv, n: 2 + Math.floor(rng() * (reg.id === 'meadow' ? 2 : 3)), alive: [], cool: 0, seed: rng() });
  }
};
function weighted(list) { let s = 0; for (const [, w] of list) s += w; let r = Math.random() * s; for (const [k, w] of list) { r -= w; if (r <= 0) return k; } return list[0][0]; }
Packs.update = function (dt) {
  if (S.scene !== 'world') return;
  const v = viewRect(60);
  for (const pk of this.list) {
    pk.cool -= dt;
    pk.alive = pk.alive.filter((f) => !f.gone);
    const d = dist(P.x, P.y, pk.x, pk.y);
    if (pk.alive.length) {
      if (d > 1700) { for (const f of pk.alive) f.gone = true; pk.alive = []; pk.spawned = 0; }
      else if (pk.alive.every((f) => f.hp <= 0)) { pk.cool = 75; }
      continue;
    }
    if (pk.spawned && pk.cool > 0) continue;
    if (d < 1100 && (pk.x < v.x0 - 40 || pk.x > v.x1 + 40 || pk.y < v.y0 - 40 || pk.y > v.y1 + 40 || !pk.spawned)) {
      if (pk.cool > 0) continue;
      const table = REGION_FOES[pk.region];
      for (let i = 0; i < pk.n; i++) {
        const k = weighted(table), a = rand(0, TAU), r = rand(10, 70);
        let x = pk.x + Math.cos(a) * r, y = pk.y + Math.sin(a) * r;
        if (World.blocked(x, y, 16, false)) { x = pk.x; y = pk.y; }
        const f = makeFoe(k, clamp(pk.lv + randi(-1, 1), 1, 30), x, y, { pack: pk, noPuff: !pk.spawned });
        f.home = { x: pk.x, y: pk.y };
        pk.alive.push(addFoe(f));
      }
      pk.spawned = 1; pk.cool = 0;
    }
  }
  // quest spawns and bounties keep their own critters near their spot
  for (const q of Quests.spawnsWanted()) {
    const tag = q.tag;
    const mine = S.foes.filter((f) => f.quest === tag && !f.gone && f.hp > 0);
    const d = dist(P.x, P.y, q.x, q.y);
    if (d > 1800) { for (const f of mine) f.gone = true; continue; }
    if (mine.length || d > 1100) continue;
    if (q.cool && q.cool > S.time) continue;
    for (let i = 0; i < q.n; i++) {
      const a = (i / q.n) * TAU, x = q.x + Math.cos(a) * 50 * (q.n > 1 ? 1 : 0), y = q.y + Math.sin(a) * 40 * (q.n > 1 ? 1 : 0);
      addFoe(makeFoe(q.foe, q.lv, x, y, { quest: tag, elite: q.elite, bounty: q.bounty }));
    }
    q.onSpawn && q.onSpawn();
  }
};

// ---------- folk walking around town
function makeNpcs() {
  S.npcs = [];
  for (const id in NPCS) {
    const n = NPCS[id], T = TOWNS[n.town];
    let x, y;
    if (n.dock) { x = World.dock.x - 40; y = World.dock.y - 10; }
    else if (n.dock2) { x = World.dock2.x + 40; y = World.dock2.y - 10; }
    else { x = T.x + n.at[0]; y = T.y + n.at[1]; }
    const p = World.blocked(x, y, 12, false) ? World.toLand(x + 20, y + 30, 0.1) : { x, y };
    S.npcs.push({ id, def: n, x: p.x, y: p.y, home: { x: p.x, y: p.y }, face: 1, t: rand(0, 9), wx: p.x, wy: p.y, wT: rand(1, 4), r: 14, move: 0, bubble: null, bT: rand(4, 14) });
  }
}
function updateNpcs(dt) {
  for (const n of S.npcs) {
    n.t += dt; n.wT -= dt; n.move = 0;
    const dP = dist(n.x, n.y, P.x, P.y);
    if (dP < 110) { n.face = P.x > n.x ? 1 : -1; continue; }
    if (n.def.still) { n.wT <= 0 && (n.wT = rand(5, 10), n.sit = !n.sit && Math.random() < 0.5); continue; }
    if (n.wT <= 0) {
      n.wT = rand(2, 5); n.sit = Math.random() < 0.4;
      if (n.sit) { n.wx = n.x; n.wy = n.y; n.wT = rand(4, 9); }
      else { const a = rand(0, TAU), r = rand(0, 60); n.wx = n.home.x + Math.cos(a) * r; n.wy = n.home.y + Math.sin(a) * r * 0.6; }
    }
    const d = dist(n.x, n.y, n.wx, n.wy);
    if (d > 6) { const a = angTo(n.x, n.y, n.wx, n.wy); const nx = n.x + Math.cos(a) * 45 * dt, ny = n.y + Math.sin(a) * 45 * dt; if (!World.blocked(nx, ny, 10, false)) { n.x = nx; n.y = ny; } else n.wT = 0; n.face = Math.cos(a) >= 0 ? 1 : -1; n.move = 0.5; }
    n.bT -= dt;
    if (n.bT <= 0) { n.bT = rand(9, 20); if (dP < 600) n.bubble = { text: pick(['Woof!', 'Arf!', '*sniff sniff*', '*wag wag*', pick(n.def.talk || ['Woof!'])]), t: 0 }; }
    if (n.bubble) { n.bubble.t += dt; if (n.bubble.t > 3) n.bubble = null; }
  }
}

// ---------- drawing a critter of any kind
function drawFoe(c, f) {
  if (!f.anim) f.anim = newAnim();
  const st = { face: f.face, t: f.t, anim: f.anim, move: f.move || (f.state === 'dash' ? 1 : 0), run: f.state === 'dash' || (f.state === 'chase' && f.move > 0.9), hurt: f.hurt, sc: f.sc, tele: f.state === 'wind' ? f.st / f.windT : 0, alt: f.hop ? 34 + f.hop : undefined, angry: f.state === 'chase' || f.state === 'wind' || f.state === 'dash', pant: f.state === 'recover' };
  if (f.hurt > 0.2 && !f.dead) { st.pose = 'hurt'; st.poseT = 1 - f.hurt; }
  if (f.dead) { st.pose = 'faint'; st.poseT = Math.min(1, f.dead / 0.2); }
  const y = f.y - (f.hop || 0);
  if (f.dead) { c.globalAlpha = 1 - f.dead / 0.35; st.sc = f.sc * (1 + f.dead); }
  if (f.spawnT > 0) c.globalAlpha = 1 - f.spawnT / 0.35;
  const sz = (f.boss ? 150 : 80) * f.sc;
  flashDraw(c, f.x, f.y + 10, sz * 1.4, sz * 1.5 + (f.hop || 0) + (f.fly ? 40 : 0), f.hurt, (c) => {
  switch (f.art) {
    case 'bee': drawBee(c, f.x, y, st); break;
    case 'crab': drawCrab(c, f.x, y, st); break;
    case 'gull': drawGull(c, f.x, f.y, st); break;
    case 'scorpion': drawScorpion(c, f.x, y, st); break;
    case 'bat': drawBat(c, f.x, y, st); break;
    case 'vacbot': drawVacbot(c, f.x, y, st); break;
    case 'vacuum': drawDreadVacuum(c, f.x, y, st); if (!f.anim2) f.anim2 = newAnim(); drawCritter(c, f.x - 6 * f.face, y - 88 * f.sc, CRITTERS.mittens, { face: f.face, t: f.t, sc: 1.4, hurt: f.hurt, anim: f.anim2, sit: 1, angry: st.angry }); break;
    default: drawCritter(c, f.x, y, CRITTERS[f.art] || CRITTERS.cat, st);
  }
  });
  c.globalAlpha = 1;
  if (f.stun > 0 && !f.dead) { for (let i = 0; i < 3; i++) { const a = f.t * 5 + (i / 3) * TAU; c.fillStyle = '#ffd84d'; circ(c, f.x + Math.cos(a) * 14, f.y - 40 * f.sc + Math.sin(a) * 4, 3); c.fill(); } }
  if (f.alert > 0) { f.alert -= 1 / 60; c.font = '700 22px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = OUT; c.strokeText('!', f.x, f.y - 46 * f.sc - 10); c.fillStyle = '#ffd84d'; c.fillText('!', f.x, f.y - 46 * f.sc - 10); }
}
// little level tag and health bar over a critter
function drawFoeBar(c, f) {
  if (f.boss || f.dead || f.spawnT > 0) return;
  const y = f.y - 48 * f.sc - (f.fly ? 22 : 0) - (f.hop || 0), w = f.elite ? 54 : 36;
  const diff = f.lv - G.lv, col = diff >= 4 ? '#e8475f' : diff >= 2 ? '#f2a03d' : diff <= -4 ? '#9a96aa' : '#ffffff';
  if (f.hp < f.maxHp || f.elite || f.state === 'chase' || f.state === 'wind') {
    c.fillStyle = OUT; c.beginPath(); rrect(c, f.x - w / 2 - 2, y - 2, w + 4, 8, 4); c.fill();
    c.fillStyle = '#e8475f'; c.beginPath(); rrect(c, f.x - w / 2, y, Math.max(2, w * f.hp / f.maxHp), 4, 2); c.fill();
  }
  c.font = '700 12px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center';
  const label = (f.elite ? f.name + ' ' : '') + 'Lv' + f.lv;
  c.lineWidth = 3.5; c.strokeStyle = OUT; c.strokeText(label, f.x, y - 5); c.fillStyle = col; c.fillText(label, f.x, y - 5);
}
function drawNpc(c, n) {
  const L = BREEDS[n.def.breed] || BREEDS.golden;
  const talking = Dialog.open && Dialog.speaker === n.id;
  if (!n.anim) n.anim = newAnim();
  const near = dist(n.x, n.y, P.x, P.y) < 110;
  const st = { face: n.face, t: n.t, anim: n.anim, move: n.move, hat: n.def.hat, talk: talking, sit: n.sit && !near && !talking, happy: near && !talking, collar: '#4f7fd9', wagFast: near, look: near ? clamp((P.y - n.y) / 120, -1, 1) : 0 };
  // townsfolk are painted into their own little canvas and animate on twos, like hand-drawn background characters
  const m = c.getTransform(), z = m.a, sz = L.size || 1, W = 150 * sz, H = 150 * sz, oy = H - 22 * sz;
  if (z > 0 && !talking && typeof document !== 'undefined') {
    if (!n.cv) n.cv = document.createElement('canvas');
    const pw = Math.ceil(W * z), ph = Math.ceil(H * z);
    if (n.cv.width !== pw || n.cv.height !== ph) { n.cv.width = pw; n.cv.height = ph; n.cvF = -9; }
    const f = Game.frameN || 0;
    if (f - (n.cvF || -9) >= 2 || f < n.cvF) {
      n.cvF = f;
      const g = n.cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph);
      g.setTransform(z, 0, 0, z, 0, 0); g.lineJoin = 'round'; g.lineCap = 'round';
      drawDog(g, W / 2, oy, L, st);
    }
    // snap to whole device pixels so the ink stays crisp
    const px = (Math.round(m.a * (n.x - W / 2) + m.e) - m.e) / m.a, py = (Math.round(m.d * (n.y - oy) + m.f) - m.f) / m.d;
    c.drawImage(n.cv, px, py, W, H);
  } else drawDog(c, n.x, n.y, L, st);
  // a mark over folk who have something for you
  const mark = G ? Quests.npcMark(n.id) : null;
  if (mark) {
    const y = n.y - 64 * (L.size || 1) + Math.sin(n.t * 4) * 3;
    c.font = '700 26px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = OUT;
    c.strokeText(mark, n.x, y); c.fillStyle = mark === '!' ? '#ffd84d' : mark === '?' ? '#7fd0ff' : '#ffffff'; c.fillText(mark, n.x, y);
  }
  if (n.bubble) drawBubble(c, n.x, n.y - 70 * (L.size || 1), n.bubble.text);
}
function drawBubble(c, x, y, text) {
  c.font = '600 13px Fredoka, ui-rounded, sans-serif';
  const w = Math.min(220, c.measureText(text).width + 20);
  c.fillStyle = '#fffaf0'; c.beginPath(); rrect(c, x - w / 2, y - 24, w, 26, 12); c.moveTo(x - 6, y + 2); c.lineTo(x, y + 9); c.lineTo(x + 6, y + 2); c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = OUT; c.textAlign = 'center'; c.fillText(text.length > 34 ? text.slice(0, 32) + '...' : text, x, y - 7);
}
