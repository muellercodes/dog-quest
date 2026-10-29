// Dungeons: a row of rooms joined by short halls. Doors lock while a room is being fought.
const RW = 1040, RH = 680, GAP = 230, DOOR = 132, WALL = 40, TOPW = 78;
const Dungeon = { D: null };

Dungeon.enter = function (id) {
  const def = DUNGEONS[id], th = THEMES[def.theme];
  const cleared = !!G.cleared[id];
  const rng = mulberry32(id.length * 97 + 13);
  const rooms = def.rooms.map((rd, i) => {
    const big = !!rd.boss, w = big ? 1300 : RW, h = big ? 820 : RH;
    const x = i === 0 ? 0 : 0, room = { i, w, h, x: 0, y: 0, def: rd, cleared: cleared || (!rd.w && !rd.boss), started: false, wave: 0, obst: [], pots: [], chest: null };
    return room;
  });
  // place rooms left to right, centred on one line
  let x = 0;
  for (const r of rooms) { r.x = x; r.y = -r.h / 2; x += r.w + GAP; }
  for (const r of rooms) {
    // pillars, mirrored so rooms look tidy
    if (!r.def.boss) {
      let kind = rng();
      if (r.def.chest && kind >= 0.35) kind = kind < 0.6 ? 0.1 : 0.9;   // keep the middle clear for the chest
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 20;
      if (kind < 0.35) for (const [dx, dy] of [[-260, -130], [260, -130], [-260, 150], [260, 150]]) r.obst.push({ x: cx + dx, y: cy + dy, r: 30 });
      else if (kind < 0.65) for (const [dx, dy] of [[-170, 0], [170, 0]]) r.obst.push({ x: cx + dx, y: cy + dy, r: 34 });
      else if (kind < 0.85) r.obst.push({ x: cx, y: cy, r: 44 });
      for (let k = 0; k < 4; k++) { const px = r.x + 90 + rng() * (r.w - 180), py = r.y + TOPW + 50 + rng() * (r.h - TOPW - 110); if (r.obst.some((o) => dist(o.x, o.y, px, py) < 80)) continue; if (r.def.chest && dist(px, py, r.x + r.w / 2, r.y + r.h / 2 - 40) < 110) continue; if (Math.abs(py - (r.y + r.h / 2)) < 90 && (px < r.x + 160 || px > r.x + r.w - 160)) continue; r.pots.push({ x: px, y: py, hp: 1, v: (rng() * 3) | 0 }); }
    }
    if (r.def.chest) r.chest = { x: r.x + r.w / 2, y: r.y + r.h / 2 - 40, id: id + ':' + r.i, item: r.def.chest, open: !!G.chests[id + ':' + r.i] };
  }
  this.D = { id, def, th, rooms, cur: 0, locked: false, exit: cleared && rooms[rooms.length - 1].def.boss ? { x: rooms[rooms.length - 1].x + rooms[rooms.length - 1].w / 2, y: rooms[rooms.length - 1].y + rooms[rooms.length - 1].h / 2 + 120 } : null, t: 0 };
  this.cache = {};
  S.scene = 'dungeon'; S.dun = this.D;
  S.foes.length = 0; S.proj.length = 0; S.tele.length = 0; S.clouds.length = 0; S.picks.length = 0;
  const r0 = rooms[0];
  P.x = r0.x + 80; P.y = r0.y + r0.h / 2 + 20; P.face = 1; P.state = 'idle';
  Cam.x = P.x; Cam.y = P.y;
  UI.areaName(def.name);
  Music.play(def.main ? 'dungeon' : 'cave');
};

Dungeon.leave = function (dead) {
  const s = DUNGEON_SPOTS[this.D.id];
  S.scene = 'world'; S.dun = null; this.D = null;
  S.foes.length = 0; S.proj.length = 0; S.tele.length = 0; S.clouds.length = 0; S.picks.length = 0;
  for (const pk of Packs.list) { pk.alive = []; pk.spawned = 0; }
  if (!dead) { P.x = s.x; P.y = s.y + 60; Cam.x = P.x; Cam.y = P.y; }
  Bosses.current = null;
  Music.play(Game.regionMusic());
  Game.save();
};

Dungeon.room = function () { return this.D.rooms[this.D.cur]; };
Dungeon.roomAt = function (x) { for (const r of this.D.rooms) if (x >= r.x - GAP / 2 && x < r.x + r.w + GAP / 2) return r; return null; };

// walls, halls, pillars and doors
Dungeon.blocked = function (x, y, r, b) {
  const D = this.D; if (!D) return false;
  r = r || 0;
  for (let i = 0; i < D.rooms.length; i++) {
    const R = D.rooms[i];
    const ix0 = R.x + WALL, ix1 = R.x + R.w - WALL, iy0 = R.y + TOPW, iy1 = R.y + R.h - WALL;
    if (y - r * 0.6 >= iy0 && y + r * 0.4 <= iy1 && x - r >= ix0 && x + r <= ix1) {
      for (const o of R.obst) if (dist2(x, y, o.x, o.y) < (o.r + r) * (o.r + r)) return true;
      for (const p of R.pots) if (p.hp > 0 && dist2(x, y, p.x, p.y) < (14 + r) * (14 + r)) return true;
      if (R.chest && (R.cleared || R.chest.open) && dist2(x, y, R.chest.x, R.chest.y) < (26 + r) * (26 + r)) return true;
      return false;
    }
    const cy = R.y + R.h / 2, dy0 = cy - DOOR / 2 + 10, dy1 = cy + DOOR / 2 + 10;
    if (!(y - r * 0.6 >= dy0 && y + r * 0.4 <= dy1)) continue;
    const lockedHere = D.locked && D.cur === i;
    // right: the doorway and the hall to the next room
    if (i < D.rooms.length - 1 && x >= ix1 - r - 1 && x <= R.x + R.w + GAP) return lockedHere && x + r > ix1;
    // left: the doorway (the first room's leads back outside)
    if (x <= ix0 + r + 1 && x >= R.x - (i === 0 ? 70 : 0)) return lockedHere && x - r < ix0;
  }
  return true;
};
Dungeon.losClear = function (x0, y0, x1, y1) { const n = Math.ceil(dist(x0, y0, x1, y1) / 16); for (let i = 1; i < n; i++) { const t = i / n; if (this.blocked(lerp(x0, x1, t), lerp(y0, y1, t), 0)) return false; } return true; };

Dungeon.update = function (dt) {
  const D = this.D; if (!D) return;
  D.t += dt;
  const r = this.roomAt(P.x);
  if (r) D.cur = r.i;
  const R = this.room();
  // stepping into an unfought room starts it
  if (!R.cleared && !R.started && P.x > R.x + WALL + 70 && P.x < R.x + R.w - WALL - 70) {
    R.started = true; D.locked = true; Sfx.play('lock');
    if (R.def.boss) {
      const bk = D.def.boss;
      const lines = BOSS_LINES[bk] && BOSS_LINES[bk].intro;
      const bx = R.x + R.w - 300, by = R.y + R.h / 2 + 30;
      Bosses.spawn(bk, bx, by);
      Music.play('boss');
      if (lines) Dialog.play(lines);
    } else this.spawnWave(R, R.def.w);
  }
  if (R.started && !R.cleared && !R.def.boss) {
    if (R.pending > 0) { R.pending -= dt; if (R.pending <= 0) this.spawnWave(R, R.def.w2); }
    else if (!S.foes.some((f) => f.hp > 0 && !f.gone)) {
      if (R.def.w2 && R.wave === 1) { R.wave = 2; R.pending = 0.7; }
      else this.roomCleared(R);
    }
  }
  // stepping onto the exit
  if (D.exit && dist(P.x, P.y, D.exit.x, D.exit.y) < 40 && !D.exitUsed) { D.exitUsed = 1; Game.fade(() => this.leave()); }
  // leaving by the front door
  if (P.x < D.rooms[0].x + 18 && !D.leaving) { D.leaving = 1; Game.fade(() => this.leave()); }
};
Dungeon.spawnWave = function (R, list) {
  const D = this.D, lv = D.def.lv;
  let i = 0;
  for (const [k, n] of list) for (let j = 0; j < n; j++) {
    const a = (i++ / 6) * TAU + rand(-0.3, 0.3);
    let x = R.x + R.w * 0.6 + Math.cos(a) * rand(120, 260), y = R.y + R.h / 2 + 30 + Math.sin(a) * rand(80, 180);
    const p = roomClamp(x, y, 40);
    if (this.blocked(p.x, p.y, 18)) { p.x = R.x + R.w / 2 + rand(-60, 60); p.y = R.y + R.h / 2 + rand(-40, 60); }
    addFoe(makeFoe(k, clamp(lv + randi(-1, 1), 1, 30), p.x, p.y, { aggro: 1 }));
  }
  R.wave = Math.max(R.wave, 1);
};
Dungeon.roomCleared = function (R) {
  R.cleared = true; this.D.locked = false;
  Sfx.play('unlock');
  if (R.chest && !R.chest.open) UI.toast('A chest appeared!');
  else if (R.i < this.D.rooms.length - 1) UI.toast('The way is open!');
  else if (!R.def.boss) { this.finish(); }
};
Dungeon.finish = function () {
  const D = this.D, last = D.rooms[D.rooms.length - 1];
  if (!G.cleared[D.id]) { G.cleared[D.id] = 1; Quests.onDungeon(D.id); }
  D.exit = { x: last.x + last.w / 2, y: last.y + last.h / 2 + 140 };
  UI.toast(D.def.name + ' cleared!');
  Game.save();
};
Dungeon.bossBeaten = function (key) {
  const D = this.D; if (!D) return;
  const R = this.room(); R.cleared = true; D.locked = false;
  G.pieces = Math.max(G.pieces, { nutsworth: 1, whiskers: 2, snowball: 3, cleocatra: 4 }[key] || G.pieces);
  if (key !== 'mittens') UI.banner('GOLDEN PIECE!', G.pieces + ' of 4 found');
  else { G.flags.gleam = 1; UI.banner('THE GLEAM!', 'The heart of the Golden Ball'); }
  Music.play('dungeon');
  this.finish();
};
// swinging at pots
Dungeon.swingAt = function (x, y, r) {
  const R = this.room(); if (!R) return;
  for (const p of R.pots) if (p.hp > 0 && dist(x, y, p.x, p.y) < r * 0.7 + 14) {
    p.hp = 0; Sfx.play('pot'); fxBurst(p.x, p.y - 14, '#c98a58', 12, 200);
    const roll = Math.random();
    if (roll < 0.25 && G.hp < maxHp()) S.picks.push({ k: 'heart', x: p.x, y: p.y - 10, vx: rand(-40, 40), vy: -160, z: 0, t: 0, delay: 0.3 });
    else if (roll < 0.75) for (let i = 0; i < 3; i++) S.picks.push({ k: 'coin', x: p.x, y: p.y - 10, vx: rand(-100, 100), vy: rand(-200, -120), z: 0, val: 1 + Math.floor(this.D.def.lv / 3), t: 0, delay: 0.35 });
  }
};
Dungeon.inters = function (out) {
  const D = this.D; if (!D) return out;
  const R = this.room();
  if (R.chest && R.cleared && !R.chest.open) out.push({ kind: 'dchest', x: R.chest.x, y: R.chest.y + 30, r: 60, chest: R.chest });
  return out;
};

// ---------- drawing
Dungeon.roomCanvas = function (R) {
  const key = R.i;
  if (this.cache[key]) return this.cache[key];
  const th = this.D.th, c = mkCanvas(R.w + 2, R.h + 2), g = c.getContext('2d');
  g.lineJoin = 'round';
  // floor tiles
  g.fillStyle = th.floor; g.fillRect(0, 0, R.w, R.h);
  const T = 52, rng = mulberry32(R.i * 31 + 7);
  for (let y = TOPW; y < R.h; y += T) for (let x = WALL; x < R.w; x += T) {
    g.fillStyle = rng() < 0.5 ? th.floor2 : shade(th.floor, rng() * 0.06 - 0.03);
    g.beginPath(); rrect(g, x + 3, y + 3, T - 6, T - 6, 9); g.fill();
  }
  if (th.name === 'dirt' || th.name === 'sand') { g.fillStyle = shade(th.floor, -0.06); for (let i = 0; i < 40; i++) { ell(g, rng() * R.w, TOPW + rng() * (R.h - TOPW), 6 + rng() * 10, 3 + rng() * 4); g.fill(); } }
  // walls
  const wall = th.wall;
  g.fillStyle = shade(wall, -0.15); g.fillRect(0, 0, R.w, TOPW);
  g.fillStyle = wall; g.fillRect(0, 0, R.w, TOPW - 22);
  g.fillStyle = shade(wall, 0.12); for (let x = 0; x < R.w; x += 46) { g.beginPath(); rrect(g, x + 4, 8, 38, 18, 5); g.fill(); g.beginPath(); rrect(g, x + 27, 32, 38, 18, 5); g.fill(); }
  g.fillStyle = th.top; g.fillRect(0, 0, R.w, 8);
  g.fillStyle = wall; g.fillRect(0, 0, WALL, R.h); g.fillRect(R.w - WALL, 0, WALL, R.h); g.fillRect(0, R.h - WALL, R.w, WALL);
  g.fillStyle = shade(wall, 0.1); g.fillRect(0, R.h - WALL, R.w, 6);
  // door gaps
  const cy = R.h / 2;
  g.fillStyle = th.floor2;
  if (R.i > 0 || true) g.fillRect(0, cy - DOOR / 2 + 10, WALL, DOOR);
  if (R.i < this.D.rooms.length - 1) g.fillRect(R.w - WALL, cy - DOOR / 2 + 10, WALL, DOOR);
  g.strokeStyle = OUT; g.lineWidth = 3; g.strokeRect(WALL, TOPW, R.w - WALL * 2, R.h - TOPW - WALL);
  // a few theme details on the wall
  for (let x = 120; x < R.w - 80; x += 260) {
    if (th.name === 'wood' || this.D.def.theme === 'oak') { g.fillStyle = '#5fa24c'; g.beginPath(); g.ellipse(x, TOPW - 8, 26, 10, 0, 0, TAU); g.fill(); }
    if (this.D.def.theme === 'keep') { g.fillStyle = '#c94a7a'; g.beginPath(); g.moveTo(x - 16, 10); g.lineTo(x + 16, 10); g.lineTo(x + 16, 54); g.lineTo(x, 46); g.lineTo(x - 16, 54); g.closePath(); g.fill(); g.lineWidth = 2; g.stroke(); drawFishBone(g, x, 30, 8); }
    if (this.D.def.theme === 'sand') { g.fillStyle = '#3a8fd9'; g.beginPath(); g.ellipse(x, 30, 10, 6, 0, 0, TAU); g.fill(); g.fillStyle = OUT; g.beginPath(); g.ellipse(x, 30, 2.5, 5, 0, 0, TAU); g.fill(); }
    if (this.D.def.theme === 'ice') { g.fillStyle = '#e8f6ff'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 12 - 5, TOPW - 22); g.lineTo(x + k * 12, TOPW - 2 + Math.abs(k) * -4); g.lineTo(x + k * 12 + 5, TOPW - 22); g.fill(); } }
    if (this.D.def.theme === 'grotto') { g.strokeStyle = '#5fb848'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, TOPW - 20); g.quadraticCurveTo(x + 10, TOPW + 20, x - 4, TOPW + 40); g.stroke(); }
  }
  this.cache[key] = c;
  return c;
};

Dungeon.drawFloor = function (c, t) {
  const D = this.D; if (!D) return;
  const v = viewRect(40);
  c.fillStyle = '#2a1a2e'; c.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
  for (let i = 0; i < D.rooms.length; i++) {
    const R = D.rooms[i];
    if (R.x > v.x1 || R.x + R.w < v.x0) continue;
    // hall to the next room
    if (i < D.rooms.length - 1) {
      const cy = R.y + R.h / 2;
      c.fillStyle = D.th.floor2; c.fillRect(R.x + R.w - 2, cy - DOOR / 2 + 10, GAP + 4, DOOR);
      c.fillStyle = shade(D.th.wall, -0.15); c.fillRect(R.x + R.w - 2, cy - DOOR / 2 - 20, GAP + 4, 30);
      c.fillStyle = D.th.wall; c.fillRect(R.x + R.w - 2, cy + DOOR / 2 + 10, GAP + 4, 22);
    }
    if (i === 0) { const cy = R.y + R.h / 2; c.fillStyle = D.th.floor2; c.fillRect(R.x - 60, cy - DOOR / 2 + 10, 62, DOOR); c.fillStyle = 'rgba(255,240,200,0.35)'; c.fillRect(R.x - 60, cy - DOOR / 2 + 10, 40, DOOR); }
    c.drawImage(this.roomCanvas(R), R.x, R.y);
    // torches
    for (let x = R.x + 250; x < R.x + R.w - 120; x += 520) {
      const fl = Math.sin(t * 12 + x) * 2;
      c.fillStyle = '#6d4a33'; c.fillRect(x - 4, R.y + 30, 8, 22);
      c.fillStyle = 'rgba(255,200,90,0.25)'; circ(c, x, R.y + 26, 26 + fl); c.fill();
      c.fillStyle = '#ffb33a'; c.beginPath(); c.ellipse(x, R.y + 22, 7, 11 + fl, 0, 0, TAU); c.fill(); c.fillStyle = '#fff1a8'; c.beginPath(); c.ellipse(x, R.y + 25, 3.5, 6, 0, 0, TAU); c.fill();
    }
    // locked doors get bars
    if (D.locked && D.cur === i) {
      const cy = R.y + R.h / 2;
      for (const dx of [R.x + 6, R.x + R.w - WALL + 6]) { if (dx > R.x + 10 && i === D.rooms.length - 1) continue; c.fillStyle = '#6a6a80'; for (let k = 0; k < 5; k++) { c.beginPath(); rrect(c, dx + (k % 2) * 8, cy - DOOR / 2 + 12 + k * 26, 26, 12, 4); } for (let k = 0; k < 4; k++) { c.beginPath(); rrect(c, dx + 2 + k * 7, cy - DOOR / 2 + 10, 6, DOOR, 3); fo(c, '#8a8aa0', 2); } }
    }
    // pillars
    for (const o of R.obst) {
      c.fillStyle = 'rgba(30,20,40,0.25)'; ell(c, o.x, o.y + 6, o.r + 6, o.r * 0.45); c.fill();
    }
    for (const p of R.pots) if (p.hp > 0) {
      c.fillStyle = 'rgba(30,20,40,0.2)'; ell(c, p.x, p.y + 2, 14, 5); c.fill();
    }
  }
  if (D.exit) {
    const e = D.exit, pulse = Math.sin(t * 4) * 4;
    c.fillStyle = 'rgba(255,230,120,0.35)'; ell(c, e.x, e.y, 46 + pulse, 22 + pulse / 2); c.fill();
    c.strokeStyle = '#ffd84d'; c.lineWidth = 3; ell(c, e.x, e.y, 38 + pulse, 18 + pulse / 2); c.stroke();
    drawPaw(c, e.x, e.y - 2, 12, '#ffd84d');
    c.font = '700 14px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = OUT; c.strokeText('Exit', e.x, e.y - 30); c.fillStyle = '#fff'; c.fillText('Exit', e.x, e.y - 30);
  }
};
// tall things in a room take part in the y-sorted draw
Dungeon.sprites = function (out) {
  const D = this.D; if (!D) return out;
  const v = viewRect(80);
  for (const R of D.rooms) {
    if (R.x > v.x1 || R.x + R.w < v.x0) continue;
    for (const o of R.obst) out.push({ y: o.y, draw: (c) => drawPillar(c, o, D.th) });
    for (const p of R.pots) if (p.hp > 0) out.push({ y: p.y, draw: (c) => drawPot(c, p) });
    if (R.chest && (R.cleared || R.chest.open)) out.push({ y: R.chest.y, draw: (c) => drawChest(c, R.chest.x, R.chest.y, R.chest.open, 1) });
  }
  return out;
};
function drawPillar(c, o, th) {
  c.save(); c.translate(o.x, o.y);
  const r = o.r;
  c.beginPath(); c.rect(-r * 0.75, -r * 2.6, r * 1.5, r * 2.6); fo(c, shade(th.wall, 0.25));
  c.fillStyle = shade(th.wall, 0.4); c.fillRect(-r * 0.75 + 3, -r * 2.6 + 3, r * 0.4, r * 2.6 - 6);
  c.beginPath(); c.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI); c.lineTo(-r, -6); c.ellipse(0, -6, r, r * 0.42, 0, Math.PI, 0, true); c.closePath(); fo(c, shade(th.wall, 0.1));
  c.beginPath(); rrect(c, -r, -r * 2.6 - 12, r * 2, 16, 5); fo(c, shade(th.wall, 0.3));
  c.restore();
}
function drawPot(c, p) {
  c.save(); c.translate(p.x, p.y);
  const col = ['#c98a58', '#b9b4c8', '#d9a46a'][p.v];
  c.beginPath(); c.moveTo(-9, -28); c.quadraticCurveTo(-16, -18, -12, -4); c.quadraticCurveTo(0, 3, 12, -4); c.quadraticCurveTo(16, -18, 9, -28); c.closePath(); fo(c, col, 2.2);
  c.beginPath(); rrect(c, -10, -33, 20, 7, 3); fo(c, shade(col, -0.1), 2);
  c.strokeStyle = shade(col, -0.25); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-12, -14); c.quadraticCurveTo(0, -10, 12, -14); c.stroke();
  c.restore();
}
function drawChest(c, x, y, open, glow) {
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(40,25,60,0.22)'; ell(c, 0, 2, 30, 8); c.fill();
  if (!open && glow) { c.fillStyle = `rgba(255,216,77,${0.18 + Math.sin(S.time * 4) * 0.08})`; circ(c, 0, -16, 40); c.fill(); }
  c.beginPath(); rrect(c, -26, -26, 52, 26, 5); fo(c, '#b8743e');
  c.fillStyle = '#ffd84d'; c.fillRect(-26, -16, 52, 5); c.strokeStyle = OUT; c.lineWidth = 1.6; c.strokeRect(-26, -16, 52, 5);
  if (open) { c.beginPath(); c.moveTo(-26, -26); c.lineTo(-22, -44); c.lineTo(22, -44); c.lineTo(26, -26); c.closePath(); fo(c, '#9a5f30'); c.fillStyle = '#2a1a26'; c.fillRect(-22, -30, 44, 5); }
  else { c.beginPath(); c.moveTo(-26, -26); c.quadraticCurveTo(-26, -42, 0, -42); c.quadraticCurveTo(26, -42, 26, -26); c.closePath(); fo(c, '#c98448'); c.beginPath(); rrect(c, -6, -26, 12, 14, 3); fo(c, '#ffd84d', 2); }
  c.restore();
}
