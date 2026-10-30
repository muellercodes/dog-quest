// The hero, combat, projectiles, warnings and effects.
let G = null;           // the saved game
const S = { scene: 'world', dun: null, foes: [], npcs: [], proj: [], tele: [], fx: [], nums: [], picks: [], clouds: [], time: 0, packs: [], hitstop: 0, slowmo: 1 };
const P = { x: 0, y: 0, r: 13, face: 1, dir: 0, state: 'idle', st: 0, t: 0, atkN: 0, atkCD: 0, combo: 0, rollCD: 0, inv: 0, hurt: 0, swim: 0, moving: 0, cds: {}, vx: 0, vy: 0, slow: 0, regenT: 0 };
const Cam = { x: 0, y: 0, z: 1, shake: 0, tx: 0, ty: 0 };
const DIFF = [{ name: 'Easy', dmg: 0.6, hp: 0.8 }, { name: 'Normal', dmg: 1, hp: 1 }, { name: 'Hard', dmg: 1.35, hp: 1.25 }];
const SET = Object.assign({ music: 0.5, sfx: 0.8, shake: 1, touch: 'auto', nums: 1 }, LS.get('dq_settings', {}));
function saveSettings() { LS.set('dq_settings', SET); }

function newGame(name, breed, diff) {
  G = {
    game: 'dogquest', v: 1, t: 0, lv: 1, xp: 0, gold: 0, hero: { name, breed }, hp: 1, mp: 0,
    x: 0, y: 0, respawn: 'waggington', main: 0, mainN: 0, side: {}, bounty: {}, items: { stick: 1, collar: 1 }, eq: { mouth: 'stick', head: null, body: 'collar' },
    tricks: {}, slots: [null, null, null, null], flags: {}, chests: {}, digs: {}, cleared: {}, pieces: 0, fog: '', diff: diff == null ? 1 : diff, won: false, qi: {}, picked: {}, met: {}, kills: 0, ch: 'Chapter 1',
  };
  const T = TOWNS.waggington;
  G.x = T.x + 120; G.y = T.y + 150;
  G.hp = maxHp(); G.mp = maxMp();
  return G;
}

// ---------- stats
function gearSum(k) { let s = 0; for (const sl in G.eq) { const id = G.eq[sl]; if (id) s += itemStat(id, G.items[id], k); } return s; }
function maxHp() { return 70 + 16 * (G.lv - 1) + gearSum('hp'); }
function maxMp() { return 50 + 2 * (G.lv - 1); }
function heroAtk() { return 8 + 3 * (G.lv - 1) + gearSum('atk'); }
function heroMag() { return 8 + 3 * (G.lv - 1) + gearSum('mag'); }
function heroDef() { return Math.floor(G.lv * 0.6) + gearSum('def'); }
function heroSpd() { return 205 * (1 + (G.eq.body === 'cape' ? 0.1 : 0)); }
function xpNeed(l) { return Math.round(30 * Math.pow(l, 1.55)); }
function trickLv(id) { return G.tricks[id] || 0; }

function giveXp(n) {
  if (G.lv >= 30) return;
  G.xp += Math.round(n);
  while (G.xp >= xpNeed(G.lv) && G.lv < 30) {
    G.xp -= xpNeed(G.lv); G.lv++;
    G.hp = maxHp(); G.mp = maxMp();
    UI.banner('LEVEL UP!', 'Level ' + G.lv);
    Sfx.play('level');
    fxBurst(P.x, P.y - 20, '#ffd84d', 24, 260);
    fxRing(P.x, P.y - 10, '#ffd84d', 90);
    S.fx.push({ k: 'rays', x: P.x, y: P.y - 18, t: 0, life: 1.4, r: 120 });
  }
}
function giveGold(n) { G.gold += Math.round(n); }
function giveItem(id, quiet) {
  const had = G.items[id] || 0;
  G.items[id] = Math.min(ITEM_MAX, had + 1);
  if (!quiet) {
    if (had) UI.toast(`${ITEMS[id].name} leveled up to Lv ${G.items[id]}!`, 'item', id);
    else UI.toast(`New gear: ${ITEMS[id].name}!`, 'item', id);
  }
  // first gear in an empty slot goes straight on
  if (!had && !G.eq[ITEMS[id].slot]) G.eq[ITEMS[id].slot] = id;
  G.hp = Math.min(G.hp, maxHp());
}

// ---------- effects
function fxBurst(x, y, col, n, spd, opts) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(0.3, 1) * (spd || 180);
    S.fx.push(Object.assign({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: rand(0.35, 0.7), r: rand(2, 4.5), col, g: 300 }, opts || {}));
  }
}
function fxRing(x, y, col, r, life) { S.fx.push({ k: 'ring', x, y, t: 0, life: life || 0.4, r, col }); }
function fxText(x, y, text, col, big) { S.nums.push({ x: x + rand(-8, 8), y, text: String(text), col, t: 0, big }); }
function fxSlash(x, y, a, r, big) { S.fx.push({ k: 'slash', x, y, a, r, t: 0, life: 0.16, big }); }
function fxPuff(x, y, n) { for (let i = 0; i < (n || 6); i++) S.fx.push({ k: 'puff', x: x + rand(-10, 10), y: y + rand(-6, 6), vx: rand(-40, 40), vy: rand(-30, -5), t: 0, life: rand(0.4, 0.7), r: rand(6, 11) }); }
function shake(n) { if (SET.shake) Cam.shake = Math.max(Cam.shake, n); }

// ---------- warnings (the red areas) and hit tests
function inShape(sh, x, y, rr) {
  const dx = x - sh.x, dy = y - sh.y;
  switch (sh.shape) {
    case 'circle': return dx * dx + dy * dy < (sh.r + rr) * (sh.r + rr);
    case 'ring': { const d = Math.hypot(dx, dy); return d < sh.r2 + rr && d > sh.r - rr; }
    case 'cone': { const d = Math.hypot(dx, dy); if (d > sh.r + rr) return false; if (d < 16) return true; return Math.abs(angDiff(sh.a, Math.atan2(dy, dx))) < sh.half + rr / Math.max(d, 1); }
    case 'rect': { const ca = Math.cos(sh.a), sa = Math.sin(sh.a); const u = dx * ca + dy * sa, v = -dx * sa + dy * ca; return u > -rr && u < sh.len + rr && Math.abs(v) < sh.w / 2 + rr; }
  }
  return false;
}
// a warning: when its time is up it hits the hero if the hero is still inside
function warn(sh) {
  const t = Object.assign({ t: 0, dmg: 10, onDone: null }, sh);
  S.tele.push(t);
  return t;
}
function updateTele(dt) {
  for (let i = S.tele.length - 1; i >= 0; i--) {
    const w = S.tele[i];
    if (w.follow && w.follow.hp > 0) { w.x = w.follow.x; w.y = w.follow.y; }
    w.t += dt;
    if (w.src && (w.src.hp <= 0 || w.src.gone) && !w.keep) { S.tele.splice(i, 1); continue; }
    if (w.t >= w.dur) {
      S.tele.splice(i, 1);
      if (!w.noHit && P.state !== 'dead' && inShape(w, P.x, P.y, P.r * 0.55)) heroHurt(w.dmg, w.x, w.y, w);
      if (w.onDone) w.onDone(w);
      if (w.boom) { fxBurst(w.x, w.y, w.boom, 10, 160); }
    }
  }
}
function drawTele(c) {
  for (const w of S.tele) {
    const p = clamp(w.t / w.dur, 0, 1), late = p > 0.78 ? (Math.sin(S.time * 40) * 0.5 + 0.5) : 0;
    c.save();
    const base = 'rgba(232,58,74,0.17)', rim = `rgba(${255},${70 + late * 120},${90 + late * 100},${0.85})`, inner = `rgba(240,64,80,${0.26 + p * 0.14})`;
    const path = (k, r2) => {
      c.beginPath();
      switch (w.shape) {
        case 'circle': c.arc(w.x, w.y, Math.max(0.1, w.r * k), 0, TAU); break;
        case 'ring': c.arc(w.x, w.y, w.r + (w.r2 - w.r) * k, 0, TAU); c.arc(w.x, w.y, w.r, 0, TAU, true); break;
        case 'cone': c.moveTo(w.x, w.y); c.arc(w.x, w.y, Math.max(0.1, w.r * k), w.a - w.half, w.a + w.half); c.closePath(); break;
        case 'rect': { const ca = Math.cos(w.a), sa = Math.sin(w.a), L = Math.max(1, w.len * k), h = w.w / 2; c.moveTo(w.x - sa * h, w.y + ca * h); c.lineTo(w.x - sa * h + ca * L, w.y + ca * h + sa * L); c.lineTo(w.x + sa * h + ca * L, w.y - ca * h + sa * L); c.lineTo(w.x + sa * h, w.y - ca * h); c.closePath(); break; }
      }
    };
    path(1); c.fillStyle = base; c.fill(w.shape === 'ring' ? 'evenodd' : 'nonzero');
    path(p); c.fillStyle = inner; c.fill(w.shape === 'ring' ? 'evenodd' : 'nonzero');
    path(1); c.lineWidth = 2.6 + late * 1.5; c.strokeStyle = rim; c.setLineDash([10, 6]); c.lineDashOffset = -S.time * 30; c.stroke(); c.setLineDash([]);
    c.restore();
  }
}

// ---------- the hero gets hurt
function heroHurt(dmg, sx, sy, src) {
  if (P.state === 'dead' || G.cheatGod) return;
  if (P.inv > 0 || P.state === 'roll' || P.state === 'zoom' || P.state === 'dig') { if (P.state === 'roll' && !P.dodged) { P.dodged = 1; fxText(P.x, P.y - 50, 'Dodged!', '#ffffff'); } return; }
  const d = Math.max(1, Math.round(dmg * DIFF[G.diff].dmg * rand(0.9, 1.1) * 100 / (100 + heroDef() * 3)));
  G.hp -= d;
  fxText(P.x, P.y - 46, d, '#ff5a6a');
  P.hurt = 1; P.inv = 0.7;
  const a = angTo(sx, sy, P.x, P.y);
  P.kbx = Math.cos(a) * 280; P.kby = Math.sin(a) * 280;
  if (src && src.slow) P.slow = src.slow;
  shake(7); Sfx.play('hurt');
  S.hitstop = 0.05;
  if (G.hp <= 0) { G.hp = 0; heroDie(); }
}
function heroDie() {
  P.state = 'dead'; P.st = 0;
  Sfx.play('faint');
  setTimeout(() => UI.showDeath(), 900);
}
function heroRespawn() {
  const T = TOWNS[G.respawn] || TOWNS.waggington;
  if (S.scene === 'dungeon') Dungeon.leave(true);
  P.x = T.x + 30; P.y = T.y + 70;
  G.hp = maxHp(); G.mp = maxMp();
  P.state = 'idle'; P.inv = 1.5; P.hurt = 0;
  S.tele.length = 0; S.proj.length = 0;
  for (const f of S.foes) if (!f.boss && !f.quest) f.gone = true;
  Cam.x = P.x; Cam.y = P.y;
}

// ---------- the hero hits things
function foeHurt(f, dmg, a, kb, opts) {
  if (f.hp <= 0 || f.gone) return 0;
  opts = opts || {};
  const crit = Math.random() < 0.08;
  let d = Math.max(1, Math.round(dmg * rand(0.9, 1.1) * (crit ? 1.6 : 1)));
  if (f.armorT > 0) d = Math.round(d * 0.5);
  f.hp -= d; f.hurt = 1;
  if (!f.boss || opts.bigKb) { f.kbx = Math.cos(a) * kb * (f.boss ? 0.15 : 1); f.kby = Math.sin(a) * kb * (f.boss ? 0.15 : 1); }
  if (opts.stun && !f.boss) { f.stun = opts.stun; }
  f.aggro = 1;
  if (SET.nums) fxText(f.x, f.y - 30 * (f.sc || 1) - 14, d, crit ? '#ffd84d' : '#ffffff', crit);
  fxBurst(f.x, f.y - 16, '#fff6d0', 5, 140);
  S.fx.push({ k: 'spark', x: f.x + rand(-6, 6), y: f.y - 18 * (f.sc || 1) + rand(-6, 6), t: 0, life: crit ? 0.26 : 0.2, r: crit ? 30 : 21, a: rand(0, TAU), crit });
  Sfx.play(crit ? 'crit' : 'hit');
  if (f.hp <= 0) foeDie(f);
  return d;
}
function foeDie(f) {
  f.hp = 0; f.dead = 0.0001;
  fxPuff(f.x, f.y - 10, 9);
  fxBurst(f.x, f.y - 14, '#ffd84d', 6, 160);
  if (f.boss) return Bosses.defeated(f);
  const xp = f.xp, gold = f.gold;
  giveXp(xp);
  // coins pop out and fly to the hero
  const n = Math.min(8, 1 + Math.floor(gold / 4));
  for (let i = 0; i < n; i++) S.picks.push({ k: 'coin', x: f.x, y: f.y - 10, vx: rand(-120, 120), vy: rand(-220, -120), z: 0, val: Math.max(1, Math.round(gold / n)), t: 0, delay: 0.35 + i * 0.03 });
  G.kills++;
  Quests.onKill(f);
  if (f.elite) Quests.onBounty(f);
}

// melee
function heroSwing() {
  const third = P.atkN === 2;
  const a = P.dir;
  P.state = 'atk'; P.st = 0; P.atkCD = third ? 0.36 : 0.24; P.combo = 0.55;
  const range = third ? 80 : 66;
  fxSlash(P.x + Math.cos(a) * 18, P.y - 16 + Math.sin(a) * 18, a, range * 0.85, third);
  Sfx.play('swing');
  P.lungeT = third ? 0.2 : 0.12; P.lungeA = a; P.swingN = P.atkN; P.atkDur = third ? 0.34 : 0.22; P.lungeSpd = third ? 260 : 190;
  let hits = 0;
  for (const f of S.foes) {
    if (f.hp <= 0 || f.gone || f.spawnT > 0) continue;
    const d = dist(P.x, P.y, f.x, f.y);
    if (d > range + f.r) continue;
    if (d > 20 && Math.abs(angDiff(a, angTo(P.x, P.y, f.x, f.y))) > 1.15) continue;
    if (S.scene === 'dungeon' && !Dungeon.losClear(P.x, P.y, f.x, f.y)) continue;
    foeHurt(f, heroAtk() * (third ? 1.5 : 1), a, third ? 340 : 160);
    hits++;
  }
  // smash pots and grass in dungeons
  if (S.scene === 'dungeon') Dungeon.swingAt(P.x + Math.cos(a) * 40, P.y + Math.sin(a) * 40, range);
  if (hits) { G.mp = Math.min(maxMp(), G.mp + 3 * hits); S.hitstop = third ? 0.07 : 0.035; if (third) shake(4); }
  P.atkN = (P.atkN + 1) % 3;
}

// tricks
function useTrick(slot) {
  const id = G.slots[slot];
  if (!id || !G.tricks[id]) { if (!id) UI.toast('No trick in that slot yet. Learn tricks from trainers in towns.'); return; }
  const T = TRICKS[id];
  if (P.cds[id] > 0) return;
  if (G.mp < T.cost) { UI.flashWoof(); Sfx.play('nope'); return; }
  if (P.swim) return;
  G.mp -= T.cost; P.cds[id] = T.cd;
  const lv = trickLv(id), mag = heroMag() * T.dmg * (1 + 0.25 * (lv - 1)) || 0;
  const a = P.dir;
  Sfx.play(id);
  switch (id) {
    case 'bark': {
      P.state = 'trick'; P.st = 0; P.trickDur = 0.3; P.trickKind = 'bark';
      S.fx.push({ k: 'bark', x: P.x + Math.cos(a) * 20, y: P.y - 18 + Math.sin(a) * 20, a, t: 0, life: 0.4, r: 160 });
      shake(3);
      for (const f of S.foes) if (f.hp > 0 && !f.gone && inShape({ shape: 'cone', x: P.x, y: P.y, a, r: 165, half: 0.8 }, f.x, f.y, f.r)) foeHurt(f, mag, angTo(P.x, P.y, f.x, f.y), 420);
      break;
    }
    case 'fetch': {
      P.state = 'trick'; P.st = 0; P.trickDur = 0.18; P.trickKind = 'throw';
      S.proj.push({ k: 'fetch', from: 'hero', x: P.x + Math.cos(a) * 16, y: P.y - 14 + Math.sin(a) * 16, vx: Math.cos(a) * 680, vy: Math.sin(a) * 680, r: 11, dmg: mag, life: 3, out: 0, hit: new Set(), spin: 0 });
      break;
    }
    case 'belly': {
      P.state = 'trick'; P.st = 0; P.trickDur = 0.75; P.trickKind = 'belly';
      const heal = Math.round(maxHp() * (T.heal + 0.05 * (lv - 1)));
      G.hp = Math.min(maxHp(), G.hp + heal);
      fxText(P.x, P.y - 50, '+' + heal, '#7fe07a', true);
      for (let i = 0; i < 8; i++) S.fx.push({ k: 'heart', x: P.x + rand(-20, 20), y: P.y - rand(10, 30), vx: rand(-20, 20), vy: rand(-80, -40), t: 0, life: rand(0.7, 1.1), r: rand(5, 8) });
      break;
    }
    case 'zoom': {
      P.state = 'zoom'; P.st = 0; P.zoomA = a; P.zoomHit = new Set(); P.zoomDmg = mag;
      break;
    }
    case 'howl': {
      P.state = 'trick'; P.st = 0; P.trickDur = 0.5; P.trickKind = 'howl';
      const tg = S.foes.filter((f) => f.hp > 0 && !f.gone && dist(P.x, P.y, f.x, f.y) < 380).sort((p, q) => dist2(P.x, P.y, p.x, p.y) - dist2(P.x, P.y, q.x, q.y)).slice(0, 4 + Math.floor(lv / 2));
      tg.forEach((f, i) => S.fx.push({ k: 'beam', x: f.x, y: f.y, t: -0.25 - i * 0.08, life: 0.45, f, dmg: mag }));
      if (!tg.length) fxText(P.x, P.y - 50, 'Awoo!', '#b9a8ff');
      break;
    }
    case 'dig': {
      P.state = 'dig'; P.st = 0; P.digDmg = mag;
      fxPuff(P.x, P.y, 8);
      break;
    }
  }
}

// ---------- the hero's update
function updateHero(dt) {
  P.t += dt;
  P.hurt = Math.max(0, P.hurt - dt * 5);
  P.inv = Math.max(0, P.inv - dt);
  P.atkCD -= dt; P.rollCD -= dt; P.combo -= dt; P.slow = Math.max(0, P.slow - dt);
  for (const k in P.cds) P.cds[k] -= dt;
  if (P.combo <= 0) P.atkN = 0;
  if (G.mp < maxMp()) G.mp = Math.min(maxMp(), G.mp + dt * 1.2);
  if (G.eq.head === 'chef' && G.hp < maxHp() && G.hp > 0) { P.regenT += dt; if (P.regenT > 1) { P.regenT = 0; G.hp = Math.min(maxHp(), G.hp + 1 + Math.floor(G.lv / 4)); } }
  if (P.state === 'dead') { P.st += dt; return; }
  const mx = Input.mx, my = Input.my, mlen = Math.hypot(mx, my);
  // aim: soft lock on the nearest foe, else the way you face
  if (mlen > 0.2) P.dir = Math.atan2(my, mx);
  const near = nearestFoe(P.x, P.y, 150);
  let aimA = near ? angTo(P.x, P.y, near.x, near.y) : P.dir;
  if (Input.aimMouse && performance.now() - Input.aimMouse.t < 300) { const w = screenToWorld(Input.aimMouse.x, Input.aimMouse.y); aimA = angTo(P.x, P.y - 14, w.x, w.y); }
  const inWater = S.scene === 'world' && World.inWater(P.x, P.y);
  P.swim = inWater && G.flags.swim ? 1 : 0;
  const busy = P.state === 'atk' || P.state === 'trick' || P.state === 'roll' || P.state === 'zoom' || P.state === 'dig' || P.state === 'digspot';
  // actions
  if (Game.canAct()) {
    const wantAtk = Input.hit.atk, wantAct = Input.hit.act;
    const it = Interact.target;
    if ((wantAct || (wantAtk && it && !nearestFoe(P.x, P.y, 170))) && it) { Interact.use(it); Input.hit.atk = false; }
    else if (wantAtk && !P.swim && P.atkCD <= 0 && (P.state === 'idle' || P.state === 'walk' || (P.state === 'atk' && P.st > 0.12))) { P.dir = aimA; heroSwing(); }
    if (Input.hit.roll && P.rollCD <= 0 && !P.swim && !busy) {
      P.state = 'roll'; P.st = 0; P.dodged = 0; P.rollA = mlen > 0.2 ? Math.atan2(my, mx) : P.dir; Sfx.play('roll'); fxPuff(P.x, P.y, 3);
    }
    for (let i = 0; i < 4; i++) if (Input.hit['t' + (i + 1)] && !busy) { const id = G.slots[i]; if (id && id !== 'zoom') P.dir = aimA; useTrick(i); }
  }
  // movement
  let spd = heroSpd() * (P.swim ? 0.62 : 1) * (P.slow > 0 ? 0.5 : 1);
  let vx = 0, vy = 0;
  P.st += dt;
  switch (P.state) {
    case 'roll': {
      const k = 1 - P.st / 0.32;
      vx = Math.cos(P.rollA) * 560 * (0.5 + k * 0.6); vy = Math.sin(P.rollA) * 560 * (0.5 + k * 0.6);
      if (P.st > 0.32) { P.state = 'idle'; P.rollCD = 0.12; }
      break;
    }
    case 'zoom': {
      vx = Math.cos(P.zoomA) * 1250; vy = Math.sin(P.zoomA) * 1250;
      S.fx.push({ k: 'dot', x: P.x + rand(-6, 6), y: P.y - rand(4, 24), vx: 0, vy: 0, t: 0, life: 0.35, r: rand(3, 6), col: '#7fd0ff', g: 0 });
      for (const f of S.foes) if (f.hp > 0 && !f.gone && !P.zoomHit.has(f) && dist(P.x, P.y, f.x, f.y) < f.r + 28) { P.zoomHit.add(f); foeHurt(f, P.zoomDmg, P.zoomA + (Math.random() < 0.5 ? 1.2 : -1.2), 380); }
      if (P.st > 0.24) { P.state = 'idle'; P.inv = 0.15; }
      break;
    }
    case 'dig': {
      vx = mx * spd * 0.7; vy = my * spd * 0.7;
      if (Math.random() < 0.5) S.fx.push({ k: 'dot', x: P.x + rand(-10, 10), y: P.y - 2, vx: rand(-60, 60), vy: rand(-120, -50), t: 0, life: 0.4, r: rand(2, 4), col: '#a87a50', g: 400 });
      if (P.st > 0.75) {
        P.state = 'idle'; P.inv = 0.25;
        shake(8); fxBurst(P.x, P.y - 6, '#a87a50', 26, 300); fxRing(P.x, P.y - 4, '#d9a46a', 140); Sfx.play('boom');
        for (const f of S.foes) if (f.hp > 0 && !f.gone && dist(P.x, P.y, f.x, f.y) < 140 + f.r) foeHurt(f, P.digDmg, angTo(P.x, P.y, f.x, f.y), 360, { stun: 1.1 });
      }
      break;
    }
    case 'digspot': { if (P.st > 0.8) { P.state = 'idle'; Interact.finishDig(); } break; }
    case 'atk': {
      if (P.lungeT > 0) { P.lungeT -= dt; vx = Math.cos(P.lungeA) * (P.lungeSpd || 190); vy = Math.sin(P.lungeA) * (P.lungeSpd || 190); }
      else { vx = mx * spd * 0.25; vy = my * spd * 0.25; }
      if (P.st > (P.atkDur || 0.22)) P.state = 'idle';
      break;
    }
    case 'trick': { vx = mx * spd * 0.2; vy = my * spd * 0.2; if (P.st > P.trickDur) P.state = 'idle'; break; }
    default: {
      vx = mx * spd; vy = my * spd;
      P.state = mlen > 0.15 ? 'walk' : 'idle';
    }
  }
  if (P.kbx) { vx += P.kbx; vy += P.kby; P.kbx *= Math.pow(0.0005, dt); P.kby *= Math.pow(0.0005, dt); if (Math.abs(P.kbx) + Math.abs(P.kby) < 8) P.kbx = P.kby = 0; }
  P.moving = clamp(Math.hypot(vx, vy) / heroSpd(), 0, 1.2);
  if (Math.abs(vx) > 8) P.face = vx > 0 ? 1 : -1;
  if (P.state === 'atk' || P.state === 'trick') P.face = Math.cos(P.dir) >= 0 ? 1 : -1;
  moveBody(P, vx * dt, vy * dt, true);
  // little dust puffs kicked up on each stride when running, and on sharp turns
  P.dustT = (P.dustT || 0) - dt * (P.moving > 0.7 ? 1 : 0.4);
  if (!P.swim && P.moving > 0.45 && P.dustT <= 0 && P.state !== 'dig') {
    P.dustT = P.state === 'zoom' ? 0.05 : 0.16;
    if ((P.dustBT = (P.dustBT || 0) - 1) <= 0) { P.dustB = S.scene === 'world' ? World.biomeAt(P.x, P.y) : 'dungeon'; P.dustBT = 8; }
    const col = { dungeon: '#c9bfae', snow: '#ffffff', desert: '#f6dca0', spooky: '#bdb4d0', isle: '#f2d2c4' }[P.dustB] || '#eadfc4';
    S.fx.push({ k: 'dust', x: P.x - P.face * 8 + rand(-3, 3), y: P.y + 4 + rand(-2, 2), vx: -P.face * rand(10, 30), vy: rand(-18, -6), t: 0, life: rand(0.35, 0.55), r: rand(4, 7), col });
  }
  // the world remembers where you've been
  if (S.scene === 'world') { G.x = P.x; G.y = P.y; Fog.reveal(P.x, P.y); }
}

// move a round body, sliding along walls
function moveBody(b, dx, dy, hero) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 10));
  dx /= steps; dy /= steps;
  for (let i = 0; i < steps; i++) {
    if (!blockedAt(b.x + dx, b.y, b.r, b, hero)) b.x += dx; else if (b.state === 'zoom') { b.st = 1; }
    if (!blockedAt(b.x, b.y + dy, b.r, b, hero)) b.y += dy;
  }
}
function blockedAt(x, y, r, b, hero) {
  if (S.scene === 'dungeon') return Dungeon.blocked(x, y, r, b);
  if (x < 60 || y < 60 || x > WW - 60 || y > WH - 60) return true;
  if (b.fly) return World.Fat(x, y) < -0.2 && !b.overWater ? false : false;
  const swim = hero ? !!G.flags.swim : false;
  if (!hero && World.Fat(x, y) < 0.02) return true;
  return World.blocked(x, y, r * 0.8, swim);
}
function nearestFoe(x, y, r) {
  let best = null, bd = r * r;
  for (const f of S.foes) { if (f.hp <= 0 || f.gone || f.spawnT > 0) continue; const d = dist2(x, y, f.x, f.y); if (d < bd) { bd = d; best = f; } }
  return best;
}
function screenToWorld(sx, sy) { return { x: Cam.x + (sx - SW / 2) / Cam.z, y: Cam.y + (sy - SH / 2) / Cam.z }; }

// ---------- projectiles
function updateProj(dt) {
  for (let i = S.proj.length - 1; i >= 0; i--) {
    const p = S.proj[i];
    p.life -= dt; p.spin = (p.spin || 0) + dt * 14;
    if (p.lob) {
      p.lob.t += dt;
      const k = clamp(p.lob.t / p.lob.dur, 0, 1);
      p.x = lerp(p.lob.x0, p.lob.x1, k); p.y = lerp(p.lob.y0, p.lob.y1, k); p.z = Math.sin(k * Math.PI) * p.lob.h;
      if (k >= 1) S.proj.splice(i, 1);
      continue;
    }
    if (p.k === 'fetch') {
      p.out += Math.hypot(p.vx, p.vy) * dt;
      if (p.out > 430 || p.back) {
        p.back = 1;
        const a = angTo(p.x, p.y, P.x, P.y - 14), sp = 760;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        if (!p.cleared) { p.cleared = 1; p.hit.clear(); }
        if (dist(p.x, p.y, P.x, P.y - 14) < 24) { S.proj.splice(i, 1); continue; }
      }
    }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const wall = S.scene === 'dungeon' ? Dungeon.blocked(nx, ny + 14, 4) : false;
    if (wall) {
      if (p.bounce) { const bx = Dungeon.blocked(nx, p.y + 14, 4), by = Dungeon.blocked(p.x, ny + 14, 4); if (bx) p.vx = -p.vx; if (by) p.vy = -p.vy; if (!bx && !by) { p.vx = -p.vx; p.vy = -p.vy; } }
      else if (p.k === 'fetch') { p.back = 1; } else { fxBurst(p.x, p.y, '#ffffff', 5, 100); S.proj.splice(i, 1); continue; }
    }
    else { p.x = nx; p.y = ny; }
    if (p.from === 'hero') {
      for (const f of S.foes) if (f.hp > 0 && !f.gone && !p.hit.has(f) && dist(p.x, p.y, f.x, f.y - 14) < p.r + f.r + 4) { p.hit.add(f); foeHurt(f, p.dmg, Math.atan2(p.vy, p.vx), 200); }
    } else if (dist(p.x, p.y, P.x, P.y - 14) < p.r + P.r) {
      heroHurt(p.dmg, p.x - p.vx, p.y - p.vy, p); S.proj.splice(i, 1); continue;
    }
    if (p.life <= 0) S.proj.splice(i, 1);
  }
}
function drawProj(c, p) {
  c.save(); c.translate(p.x, p.y - (p.z || 0));
  switch (p.k) {
    case 'fetch': c.fillStyle = 'rgba(201,232,74,0.35)'; circ(c, 0, 0, 16); c.fill(); c.rotate(p.spin); circ(c, 0, 0, 9); fo(c, '#c9e84a', 2.2); c.beginPath(); c.arc(-4, 0, 9, -0.9, 0.9); c.lineWidth = 1.8; c.strokeStyle = '#fff'; c.stroke(); break;
    case 'acorn': c.rotate(p.spin); c.beginPath(); c.ellipse(0, 1, 5, 6, 0, 0, TAU); fo(c, '#b5773e', 2); c.beginPath(); c.ellipse(0, -3, 6, 3, 0, 0, TAU); fo(c, '#7a4f2a', 1.8); break;
    case 'ice': c.rotate(Math.atan2(p.vy, p.vx)); c.beginPath(); c.moveTo(10, 0); c.lineTo(-8, -5); c.lineTo(-8, 5); c.closePath(); fo(c, '#bfe8fa', 2); break;
    case 'wrap': c.rotate(p.spin * 0.5); c.beginPath(); c.ellipse(0, 0, 10, 5, 0, 0, TAU); fo(c, '#efe3c4', 2); c.strokeStyle = '#cdbf98'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-6, -3); c.lineTo(6, 3); c.stroke(); break;
    case 'trash': c.rotate(p.spin * 0.6); c.beginPath(); rrect(c, -8, -8, 16, 16, 4); fo(c, '#8a96a8', 2); c.fillStyle = '#5fb848'; c.fillRect(-5, -10, 4, 4); break;
    case 'cannon': circ(c, 0, 0, 12); fo(c, '#3a3440', 2.4); c.fillStyle = 'rgba(255,255,255,0.4)'; circ(c, -4, -4, 3.5); c.fill(); break;
    case 'snowball': circ(c, 0, 0, 12); fo(c, '#ffffff', 2.4); break;
    case 'yarn': c.rotate(p.spin); circ(c, 0, 0, 11); fo(c, '#e8475f', 2.2); c.strokeStyle = '#b82f45'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(0, 0, 9, 4, 0.6, 0, Math.PI); c.stroke(); c.beginPath(); c.ellipse(0, 0, 9, 4, -0.6, 0, Math.PI); c.stroke(); break;
    case 'dust': c.fillStyle = '#b9b4c8'; blobShape(c, [[-4, 0, 7], [4, -2, 7], [0, 4, 6]], '#c9c4d6'); c.fillStyle = OUT; circ(c, -2, -1, 1.4); c.fill(); circ(c, 3, -1, 1.4); c.fill(); break;
    case 'anchor': c.rotate(p.spin * 0.7); c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, 12); c.moveTo(-12, 6); c.quadraticCurveTo(0, 18, 12, 6); c.stroke(); c.strokeStyle = '#7f8aa0'; c.lineWidth = 3; c.stroke(); break;
    default: circ(c, 0, 0, p.r || 7); fo(c, '#ffffff', 2);
  }
  c.restore();
  if (p.z) { c.fillStyle = 'rgba(40,25,60,0.18)'; ell(c, p.x, p.y + 4, 10, 4); c.fill(); }
}

// ---------- effects update and draw
function updateFx(dt) {
  for (let i = S.fx.length - 1; i >= 0; i--) {
    const f = S.fx[i];
    f.t += dt;
    if (f.k === 'beam' && f.t >= 0 && !f.done) {
      f.done = 1; shake(3); Sfx.play('beam');
      if (f.f && f.f.hp > 0) foeHurt(f.f, f.dmg, -Math.PI / 2, 60, { stun: 0.4 });
    }
    if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += f.g * dt; }
    if (f.t > f.life) S.fx.splice(i, 1);
  }
  for (let i = S.nums.length - 1; i >= 0; i--) { const n = S.nums[i]; n.t += dt; n.y -= 34 * dt; if (n.t > 0.9) S.nums.splice(i, 1); }
}
function drawFx(c) {
  for (const f of S.fx) {
    const p = clamp(f.t / f.life, 0, 1);
    if (f.t < 0) { if (f.k === 'beam') { c.fillStyle = 'rgba(185,168,255,0.25)'; circ(c, f.x, f.y, 26 * (1 + f.t * 2)); c.fill(); } continue; }
    switch (f.k) {
      case 'dot': c.globalAlpha = 1 - p; c.fillStyle = f.col; circ(c, f.x, f.y, f.r * (1 - p * 0.5)); c.fill(); c.globalAlpha = 1; break;
      case 'puff': c.globalAlpha = 0.7 * (1 - p); c.fillStyle = '#f4efe6'; circ(c, f.x, f.y, f.r * (0.6 + p * 0.8)); c.fill(); c.globalAlpha = 1; break;
      case 'ring': c.globalAlpha = 1 - p; c.strokeStyle = f.col; c.lineWidth = 4 * (1 - p) + 1; circ(c, f.x, f.y, f.r * easeOut(p)); c.stroke(); c.globalAlpha = 1; break;
      case 'slash': {
        // a sweeping crescent that grows along the swing, then fades
        c.save(); c.translate(f.x, f.y); c.rotate(f.a);
        const w = f.big ? 1.3 : 1, sweep = easeOut(Math.min(1, p * 2.4)), fade = p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
        const a0 = -1.15 * w, a1 = a0 + 2.3 * w * sweep, R = f.r * (0.9 + p * 0.15);
        c.globalAlpha = fade;
        const g = c.createRadialGradient(-R * 0.3, 0, R * 0.35, -R * 0.3, 0, R);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, f.big ? 'rgba(255,230,120,0.25)' : 'rgba(255,255,255,0.2)'); g.addColorStop(0.86, f.big ? 'rgba(255,244,170,0.95)' : 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(-R * 0.3, 0, R, a0, a1); c.arc(-R * 0.22, 0, R * 0.62, a1, a0, true); c.closePath(); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * 0.5; c.fillStyle = f.big ? '#ffd84d' : '#bfe6ff';
        c.beginPath(); c.arc(-R * 0.3, 0, R * 1.04, a1 - 0.5, a1); c.arc(-R * 0.3, 0, R * 0.8, a1, a1 - 0.5, true); c.closePath(); c.fill();
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; break;
      }
      case 'spark': {
        // a four-point star burst with streaks
        const k = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7, R = f.r * (0.6 + p * 0.6);
        c.save(); c.translate(f.x, f.y); c.rotate(f.a);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = k;
        c.fillStyle = f.crit ? '#ffd84d' : '#ffffff';
        c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? R * 0.18 : R; const an = (i / 8) * TAU; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill();
        c.strokeStyle = f.crit ? '#fff2a0' : '#ffffff'; c.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + 0.4; c.beginPath(); c.moveTo(Math.cos(an) * R * 0.7, Math.sin(an) * R * 0.7); c.lineTo(Math.cos(an) * R * 1.35, Math.sin(an) * R * 1.35); c.stroke(); }
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; break;
      }
      case 'rays': {
        const k = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        c.save(); c.translate(P.x, P.y - 18); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * TAU + f.t * 0.8, w = 0.12, R = f.r * (0.7 + 0.3 * Math.sin(i * 2.1 + f.t * 4));
          c.globalAlpha = k * (i % 2 ? 0.35 : 0.55);
          const g = c.createLinearGradient(0, 0, Math.cos(an) * R, Math.sin(an) * R);
          g.addColorStop(0, 'rgba(255,240,170,1)'); g.addColorStop(1, 'rgba(255,216,77,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, an - w, an + w); c.closePath(); c.fill();
        }
        c.globalAlpha = k * 0.6; glow(c, 0, 0, 46, '#fff2b0', 1);
        c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; break;
      }
      case 'dust': { c.globalAlpha = 0.55 * (1 - p); c.fillStyle = f.col || '#e9dcc0'; circ(c, f.x, f.y, f.r * (0.5 + p * 0.9)); c.fill(); c.globalAlpha = 1; break; }
      case 'bark': {
        c.save(); c.translate(f.x, f.y); c.rotate(f.a);
        for (let k = 0; k < 3; k++) { const q = clamp(p * 1.4 - k * 0.15, 0, 1); if (q <= 0) continue; c.globalAlpha = (1 - q) * 0.9; c.strokeStyle = '#ffd84d'; c.lineWidth = 6 * (1 - q) + 2; c.beginPath(); c.arc(0, 0, 20 + q * f.r, -0.75, 0.75); c.stroke(); }
        c.globalAlpha = 1 - p; c.fillStyle = '#fff'; c.font = 'bold 22px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.rotate(-f.a); c.strokeStyle = OUT; c.lineWidth = 4; c.strokeText('WOOF!', 0, -26 - p * 20); c.fillText('WOOF!', 0, -26 - p * 20);
        c.restore(); c.globalAlpha = 1; break;
      }
      case 'beam': {
        const a = 1 - p;
        c.fillStyle = `rgba(200,190,255,${0.75 * a})`; c.fillRect(f.x - 14 * a - 4, f.y - 600, 28 * a + 8, 600);
        c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(f.x - 5 * a - 1, f.y - 600, 10 * a + 2, 600);
        c.globalAlpha = a; c.strokeStyle = '#b9a8ff'; c.lineWidth = 3; circ(c, f.x, f.y, 40 * p + 10); c.stroke(); c.globalAlpha = 1;
        break;
      }
      case 'heart': { c.globalAlpha = 1 - p; c.fillStyle = '#ff6f8f'; c.save(); c.translate(f.x, f.y); c.beginPath(); c.moveTo(0, f.r * 0.9); c.bezierCurveTo(-f.r * 1.4, -f.r * 0.2, -f.r * 0.5, -f.r * 1.2, 0, -f.r * 0.3); c.bezierCurveTo(f.r * 0.5, -f.r * 1.2, f.r * 1.4, -f.r * 0.2, 0, f.r * 0.9); c.fill(); c.restore(); c.globalAlpha = 1; break; }
      case 'cloud': { c.globalAlpha = 0.45 * (1 - p * p); c.fillStyle = '#9be04a'; for (let k = 0; k < 5; k++) { const aa = k * 1.3 + f.t; circ(c, f.x + Math.cos(aa) * f.r * 0.45, f.y + Math.sin(aa) * f.r * 0.3, f.r * 0.5); c.fill(); } c.globalAlpha = 1; break; }
      case 'sparkle': { c.globalAlpha = 1 - p; c.fillStyle = f.col || '#fff6a8'; c.save(); c.translate(f.x, f.y - p * 20); c.rotate(p * 3); c.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 2 : 7; c.lineTo(Math.cos((k / 8) * TAU) * r, Math.sin((k / 8) * TAU) * r); } c.fill(); c.restore(); c.globalAlpha = 1; break; }
    }
  }
}
function drawNums(c) {
  c.textAlign = 'center';
  for (const n of S.nums) {
    const p = n.t / 0.9, s = n.t < 0.12 ? 0.6 + n.t * 5 : 1;
    c.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
    c.font = `700 ${Math.round((n.big ? 26 : 19) * s)}px Fredoka, ui-rounded, sans-serif`;
    c.lineWidth = 4.5; c.strokeStyle = OUT; c.strokeText(n.text, n.x, n.y); c.fillStyle = n.col; c.fillText(n.text, n.x, n.y);
  }
  c.globalAlpha = 1;
}

// ---------- drawing the hero
function heroLook() { return BREEDS[G.hero.breed] || BREEDS.corgi; }
function drawHero(c) {
  const L = heroLook();
  if (!P.anim) P.anim = newAnim();
  if (P.state === 'dig') {
    // tunnelling: a moving mound with dirt kicking up
    const w = Math.sin(P.t * 30) * 1.5;
    softShadow(c, P.x, P.y, 24, 7, 0.3);
    c.beginPath(); c.ellipse(P.x, P.y - 2, 19 + w, 10, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#a87a50'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = '#c4935f'; c.beginPath(); c.ellipse(P.x - 5, P.y - 7, 8, 3.5, -0.2, 0, TAU); c.fill();
    if (Math.floor(P.t * 6) % 2) { c.fillStyle = OUT; c.beginPath(); c.ellipse(P.x + 7, P.y - 10, 2.5, 3, 0, 0, TAU); c.fill(); }
    return;
  }
  if (P.inv > 0 && P.state !== 'roll' && Math.floor(P.t * 20) % 2 === 0 && P.hurt <= 0) c.globalAlpha = 0.6;
  const body = ITEMS[G.eq.body] || {};
  const st = {
    face: P.face, t: P.t, anim: P.anim, move: P.state === 'walk' ? P.moving : 0, run: P.moving > 0.7, hurt: P.hurt,
    hat: G.eq.head ? ITEMS[G.eq.head].art : null, item: G.eq.mouth ? ITEMS[G.eq.mouth].art : null,
    collar: body.art && body.art[0] === '#' ? body.art : '#e8475f', coat: body.coat, cape: body.cape,
    wagFast: P.state === 'walk' || G.hp > maxHp() * 0.9, pant: P.moving > 0.5 && !P.swim,
  };
  switch (P.state) {
    case 'atk': st.pose = ['atk1', 'atk2', 'atk3'][P.swingN || 0]; st.poseT = P.st / (P.atkDur || 0.22); break;
    case 'roll': st.pose = 'roll'; st.poseT = P.st / 0.32; break;
    case 'trick': st.pose = { bark: 'bark', throw: 'throw', belly: 'belly', howl: 'howl' }[P.trickKind] || 'bark'; st.poseT = P.st / (P.trickDur || 0.3); break;
    case 'digspot': st.pose = 'dig'; break;
    case 'zoom': st.move = 1.25; st.run = 1; break;
    case 'dead': st.pose = 'faint'; break;
  }
  if (P.swim) { st.pose = 'swim'; st.swim = 1; st.move = Math.max(0.2, P.moving); }
  if (P.hurt > 0.35 && !st.pose) { st.pose = 'hurt'; st.poseT = 1 - P.hurt; }
  if (P.state === 'zoom') {
    // afterimages streak behind
    for (let k = 3; k >= 1; k--) { c.globalAlpha = 0.16 * (4 - k); drawDog(c, P.x - Math.cos(P.zoomA) * k * 16, P.y - Math.sin(P.zoomA) * k * 16, L, Object.assign({}, st, { anim: null, t: P.t - k * 0.03 })); }
    c.globalAlpha = 1;
  }
  flashDraw(c, P.x, P.y + 12, 130, 120, P.hurt, (g) => drawDog(g, P.x, P.y, L, st));
  c.globalAlpha = 1;
  if (P.state === 'dead') { const k = (P.t * 0.8) % 1; c.font = '700 14px Fredoka, ui-rounded, sans-serif'; c.fillStyle = `rgba(255,255,255,${1 - k})`; c.strokeStyle = OUT; c.lineWidth = 3; c.strokeText('z', P.x + 16 + k * 10, P.y - 34 - k * 20); c.fillText('z', P.x + 16 + k * 10, P.y - 34 - k * 20); }
}
// coats and capes are drawn by the puppet now (kept so old callers still work)
function drawCoat() {}
