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

// ---------- drawing: each room is painted once into its own canvas, then torches, doors and a soft lighting pass run live
const DLOOK = {
  oak: { floor: 'planks', fl: '#bb8c5a', fl2: '#ab7c4c', gap: '#6a4630', wall: 'bark', wl: '#7a5236', cap: '#5fa24c', capK: 'moss', dark: 0.36, light: '#ffcf7a', fire: 1, deco: 'oak', pillar: 'trunk' },
  wood: { floor: 'planks', fl: '#c99c68', fl2: '#b98c5a', gap: '#6e4a36', wall: 'boards', wl: '#8a6450', cap: '#a8693f', capK: 'trim', dark: 0.36, light: '#ffcf7a', fire: 1, deco: 'kennel', pillar: 'post' },
  haunt: { floor: 'planks', fl: '#91869f', fl2: '#827896', gap: '#4a3a5e', wall: 'boards', wl: '#5a4a72', cap: '#6f5f8f', capK: 'trim', dark: 0.56, light: '#b9a8ff', fire: 0, deco: 'haunt', pillar: 'post' },
  grotto: { floor: 'flag', fl: '#7f9ab5', fl2: '#7290ad', gap: '#46557a', wall: 'rock', wl: '#55678a', cap: '#6fb0cf', capK: 'wet', dark: 0.44, light: '#9fe8ff', fire: 0, deco: 'grotto', pillar: 'spire' },
  keep: { floor: 'flag', fl: '#8a7aa0', fl2: '#7d6d94', gap: '#45365f', wall: 'brick', wl: '#54447a', cap: '#c94a7a', capK: 'crenel', dark: 0.5, light: '#ffc46a', fire: 1, deco: 'keep', pillar: 'column' },
  ice: { floor: 'ice', fl: '#d4eaf7', fl2: '#c2dff1', gap: '#94bcdc', wall: 'iceblock', wl: '#8cb6dc', cap: '#ffffff', capK: 'snow', dark: 0.2, light: '#bfeaff', fire: 0, deco: 'ice', pillar: 'crystal' },
  sand: { floor: 'sandstone', fl: '#ebc47e', fl2: '#dfb66e', gap: '#a77d45', wall: 'sandstone', wl: '#c99a58', cap: '#f3d083', capK: 'gold', dark: 0.4, light: '#ffcf7a', fire: 1, deco: 'sand', pillar: 'obelisk' },
  dirt: { floor: 'dirt', fl: '#b8905e', fl2: '#a98252', gap: '#7a5838', wall: 'earth', wl: '#7d5a3a', cap: '#6cc24a', capK: 'grass', dark: 0.38, light: '#ffcf7a', fire: 1, deco: 'dirt', pillar: 'earth' },
};
function dLook() { return DLOOK[Dungeon.D.def.theme] || DLOOK.oak; }
const DSCALE = () => clamp(Cam.z * DPR, 1, 1.6);
const AO = 'rgba(40,20,60,', WEX = 64;   // the back wall is painted taller than the walkable edge, up into the dark

// a stone or brick with a cel shadow on its lower right and a light lip on top
function dBlock(g, x, y, w, h, base, rad) {
  const T = tones(base);
  g.fillStyle = T.sh; g.beginPath(); rrect(g, x, y, w, h, rad); g.fill();
  g.fillStyle = base; g.beginPath(); rrect(g, x, y, w - 3, h - 3, rad); g.fill();
  g.fillStyle = T.hi; g.globalAlpha = 0.75; g.beginPath(); rrect(g, x + 3, y + 2, Math.max(2, w * 0.55), 2.6, 1.3); g.fill(); g.globalAlpha = 1;
}
function dVar(rng, a, b, k) { return shade(rng() < 0.5 ? a : b, (rng() - 0.5) * (k || 0.08)); }
function dCrack(g, x, y, s, col, rng) {
  const pts = [[x, y]]; let a = rng() * TAU;
  for (let i = 0; i < 4; i++) { a += rng() - 0.5; const p = pts[pts.length - 1]; pts.push([p[0] + Math.cos(a) * s * 0.3, p[1] + Math.sin(a) * s * 0.3]); }
  taperLine(g, pts, 2.6, col);
}
function dGlyph(g, x, y, s, k, col) {
  g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath();
  switch (k % 5) {
    case 0: g.ellipse(0, 0, s, s * 0.5, 0, 0, TAU); g.moveTo(s * 0.35, 0); g.arc(0, 0, s * 0.35, 0, TAU); g.moveTo(-s * 0.2, s * 0.5); g.lineTo(-s * 0.4, s * 1.1); break;
    case 1: g.ellipse(0, -s * 0.55, s * 0.35, s * 0.45, 0, 0, TAU); g.moveTo(-s * 0.7, 0); g.lineTo(s * 0.7, 0); g.moveTo(0, -s * 0.1); g.lineTo(0, s * 1.1); break;
    case 2: for (let i = 0; i < 3; i++) { g.moveTo(-s, -s * 0.5 + i * s * 0.5); for (let j = 1; j <= 4; j++) g.lineTo(-s + j * s * 0.5, -s * 0.5 + i * s * 0.5 + (j % 2 ? -s * 0.2 : 0)); } break;
    case 3: g.arc(0, -s * 0.3, s * 0.45, Math.PI, 0); g.lineTo(s * 0.45, s * 0.8); g.lineTo(-s * 0.45, s * 0.8); g.closePath(); g.moveTo(-s * 0.2, -s * 0.75); g.lineTo(-s * 0.35, -s * 1.1); g.moveTo(s * 0.2, -s * 0.75); g.lineTo(s * 0.35, -s * 1.1); break;
    default: g.moveTo(-s, s * 0.6); g.quadraticCurveTo(0, -s * 1.2, s, s * 0.6); g.moveTo(-s * 0.3, s * 0.6); g.lineTo(-s * 0.3, -s * 0.1); g.moveTo(s * 0.3, s * 0.6); g.lineTo(s * 0.3, -s * 0.1);
  }
  g.stroke(); g.restore();
}
function dLeaf(g, x, y, s, a, col) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = col; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.7, s, 0); g.quadraticCurveTo(0, s * 0.7, -s, 0); g.fill();
  g.strokeStyle = shadeTone(col, 0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(-s * 0.8, 0); g.lineTo(s * 0.8, 0); g.stroke();
  g.restore();
}
function dTuft(g, x, y, s, col) { for (let i = -2; i <= 2; i++) taperLine(g, qpts(x + i * s * 0.25, y, x + i * s * 0.4, y - s * 0.6, x + i * s * 0.55 + s * 0.1, y - s * (0.9 + (i % 2 ? 0 : 0.3))), s * 0.28, col, 1, 0.1); }
function dWeb(g, x, y, s, fx, fy) {
  g.save(); g.translate(x, y); g.scale(fx, fy); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
  for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * s, Math.sin(a) * s); g.stroke(); }
  for (let r = s * 0.3; r <= s; r += s * 0.23) { g.beginPath(); for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI / 2, px = Math.cos(a) * r, py = Math.sin(a) * r; if (!i) g.moveTo(px, py); else { const pa = ((i - 0.5) / 4) * Math.PI / 2; g.quadraticCurveTo(Math.cos(pa) * r * 0.85, Math.sin(pa) * r * 0.85, px, py); } } g.stroke(); }
  g.restore();
}

// ---- floors
function dFloor(g, L, x0, y0, x1, y1, rng) {
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = L.gap; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (L.floor === 'planks') {
    const ph = 30;
    for (let y = y0; y < y1; y += ph) {
      let x = x0 - rng() * 140;
      while (x < x1) {
        const w = 110 + rng() * 170, col = dVar(rng, L.fl, L.fl2, 0.09);
        g.fillStyle = col; g.fillRect(x, y, w, ph - 2);
        g.globalAlpha = 0.45; g.strokeStyle = shadeTone(col, 0.22); g.lineWidth = 1.1;
        for (let k = 0; k < 3; k++) { const yy = y + 6 + rng() * (ph - 14); g.beginPath(); g.moveTo(x + 8, yy); g.bezierCurveTo(x + w * 0.3, yy + rng() * 5 - 2.5, x + w * 0.65, yy + rng() * 5 - 2.5, x + w - 8, yy + rng() * 3 - 1.5); g.stroke(); }
        g.globalAlpha = 1;
        if (rng() < 0.18) { const kx = x + 20 + rng() * (w - 40), ky = y + ph / 2; g.fillStyle = shadeTone(col, 0.3); ell(g, kx, ky, 6, 3.2); g.fill(); g.fillStyle = shadeTone(col, 0.5); ell(g, kx, ky, 2.6, 1.4); g.fill(); }
        g.fillStyle = lightTone(col, 0.3); g.fillRect(x, y, w, 2);
        g.fillStyle = shadeTone(col, 0.25); g.fillRect(x, y + ph - 6, w, 4);
        g.fillStyle = L.gap; g.fillRect(x + w - 2.5, y, 2.5, ph);
        g.fillStyle = shadeTone(col, 0.55); circ(g, x + 7, y + 8, 1.6); g.fill(); circ(g, x + 7, y + ph - 10, 1.6); g.fill();
        x += w;
      }
    }
  } else if (L.floor === 'flag') {
    let y = y0 - 12;
    while (y < y1) {
      const rh = 48 + rng() * 14; let x = x0 - rng() * 70;
      while (x < x1) {
        const w = 60 + rng() * 64, col = dVar(rng, L.fl, L.fl2, 0.12);
        dBlock(g, x + 3, y + 3, w - 5, rh - 5, col, 9);
        if (rng() < 0.12) dCrack(g, x + w * 0.3 + rng() * w * 0.4, y + rh * 0.3, rh, shadeTone(col, 0.35), rng);
        if (L.deco === 'grotto' && rng() < 0.16) { g.fillStyle = 'rgba(95,184,72,0.55)'; for (let k = 0; k < 4; k++) { circ(g, x + 6 + rng() * 18, y + rh - 8 - rng() * 8, 3 + rng() * 4); g.fill(); } }
        x += w;
      }
      y += rh;
    }
  } else if (L.floor === 'ice') {
    const tw = 104, th = 78;
    for (let y = y0 - 10, row = 0; y < y1; y += th, row++) for (let x = x0 - (row % 2) * 52; x < x1; x += tw) {
      const col = shade(L.fl, (rng() - 0.5) * 0.06);
      g.fillStyle = shadeTone(col, 0.12); g.beginPath(); rrect(g, x + 2, y + 2, tw - 4, th - 4, 6); g.fill();
      g.fillStyle = col; g.beginPath(); rrect(g, x + 2, y + 2, tw - 7, th - 7, 6); g.fill();
      g.save(); g.beginPath(); rrect(g, x + 2, y + 2, tw - 7, th - 7, 6); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.5)'; const sx = x + rng() * tw * 0.6; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 18, y); g.lineTo(sx - 22, y + th); g.lineTo(sx - 40, y + th); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(sx + 26, y); g.lineTo(sx + 32, y); g.lineTo(sx - 8, y + th); g.lineTo(sx - 14, y + th); g.closePath(); g.fill();
      g.restore();
      if (rng() < 0.2) dCrack(g, x + tw * 0.5, y + th * 0.5, 70, 'rgba(255,255,255,0.8)', rng);
    }
  } else if (L.floor === 'sandstone') {
    const bh = 46;
    for (let y = y0 - 8, row = 0; y < y1; y += bh, row++) for (let x = x0 - (row % 2) * 40 - 10; x < x1; x += 80) {
      const col = dVar(rng, L.fl, L.fl2, 0.07);
      dBlock(g, x + 2, y + 2, 77, bh - 3, col, 4);
      if (rng() < 0.16) dGlyph(g, x + 40, y + bh / 2, 9, (rng() * 5) | 0, shadeTone(col, 0.3));
    }
  } else {
    g.fillStyle = L.fl; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let i = 0; i < 70; i++) { g.fillStyle = rng() < 0.5 ? L.fl2 : lightTone(L.fl, 0.12); g.globalAlpha = 0.6; ell(g, x0 + rng() * (x1 - x0), y0 + rng() * (y1 - y0), 18 + rng() * 40, 8 + rng() * 16, rng()); g.fill(); }
    g.globalAlpha = 1;
    for (let i = 0; i < 46; i++) { const px = x0 + rng() * (x1 - x0), py = y0 + rng() * (y1 - y0), r = 2.5 + rng() * 4, col = pick(['#9c8f86', '#b5a596', '#8a7d72']); g.fillStyle = OUT; ell(g, px + 0.6, py + 0.8, r + 1.3, r * 0.7 + 1.2); g.fill(); g.fillStyle = col; ell(g, px, py, r, r * 0.7); g.fill(); g.fillStyle = lightTone(col, 0.4); ell(g, px - r * 0.3, py - r * 0.25, r * 0.4, r * 0.22); g.fill(); }
  }
  g.restore();
}
// soft occlusion where the floor meets the walls
function dAO(g, x0, y0, x1, y1, top) {
  const lg = (ax, ay, bx, by, a) => { const gr = g.createLinearGradient(ax, ay, bx, by); gr.addColorStop(0, AO + a + ')'); gr.addColorStop(1, AO + '0)'); return gr; };
  g.fillStyle = lg(0, y0, 0, y0 + (top || 80), 0.5); g.fillRect(x0, y0, x1 - x0, top || 80);
  g.fillStyle = lg(x0, 0, x0 + 50, 0, 0.32); g.fillRect(x0, y0, 50, y1 - y0);
  g.fillStyle = lg(x1, 0, x1 - 50, 0, 0.32); g.fillRect(x1 - 50, y0, 50, y1 - y0);
  g.fillStyle = lg(0, y1, 0, y1 - 34, 0.26); g.fillRect(x0, y1 - 34, x1 - x0, 34);
}

// ---- the back wall face (3/4 view) from y0 to y1, with its cap above
function dWallFace(g, L, x0, x1, y0, y1, rng) {
  const wl = L.wl, H = y1 - y0;
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, H); g.clip();
  g.fillStyle = shadeTone(wl, 0.3); g.fillRect(x0, y0, x1 - x0, H);
  switch (L.wall) {
    case 'brick': for (let y = y0, r = 0; y < y1; y += 16, r++) for (let x = x0 - (r % 2) * 22; x < x1; x += 44) dBlock(g, x + 1, y + 1, 43, 15, dVar(rng, wl, shade(wl, 0.06), 0.1), 3); break;
    case 'rock': for (let i = 0; i < (x1 - x0) / 14; i++) { const bx = x0 + rng() * (x1 - x0), by = y0 + rng() * H, rw = 18 + rng() * 26, rh = 12 + rng() * 14, col = dVar(rng, wl, shade(wl, 0.08), 0.12); g.fillStyle = OUT; ell(g, bx + 1, by + 1.5, rw + 2, rh + 2); g.fill(); g.fillStyle = shadeTone(col, 0.2); ell(g, bx, by, rw, rh); g.fill(); g.fillStyle = col; ell(g, bx - 2, by - 2, rw - 3, rh - 3); g.fill(); g.fillStyle = 'rgba(220,245,255,0.5)'; ell(g, bx - rw * 0.35, by - rh * 0.45, rw * 0.3, 2); g.fill(); } break;
    case 'bark': g.fillStyle = wl; g.fillRect(x0, y0, x1 - x0, H); for (let x = x0; x < x1; x += 10 + rng() * 14) { const col = shadeTone(wl, 0.3 + rng() * 0.2); taperLine(g, [[x, y0 - 4], [x + rng() * 6 - 3, y0 + H * 0.4], [x + rng() * 8 - 4, y0 + H * 0.75], [x + rng() * 6 - 3, y1 + 4]], 3 + rng() * 3, col); } for (let i = 0; i < (x1 - x0) / 160; i++) { const kx = x0 + rng() * (x1 - x0), ky = y0 + 14 + rng() * (H - 28); g.fillStyle = shadeTone(wl, 0.45); ell(g, kx, ky, 8, 11); g.fill(); g.fillStyle = '#2e1c22'; ell(g, kx + 1, ky + 1, 4, 6); g.fill(); } break;
    case 'boards': for (let x = x0; x < x1; x += 26) { const col = dVar(rng, wl, shade(wl, 0.07), 0.1); g.fillStyle = col; g.fillRect(x, y0, 24, H); g.fillStyle = lightTone(col, 0.25); g.fillRect(x + 2, y0, 3, H); g.fillStyle = shadeTone(col, 0.3); g.fillRect(x + 19, y0, 5, H); g.fillStyle = shadeTone(col, 0.55); circ(g, x + 12, y0 + 9, 1.6); g.fill(); circ(g, x + 12, y1 - 9, 1.6); g.fill(); } g.fillStyle = shade(wl, 0.12); g.fillRect(x0, y0 + H * 0.45, x1 - x0, 7); g.fillStyle = shadeTone(wl, 0.3); g.fillRect(x0, y0 + H * 0.45 + 7, x1 - x0, 2.5); break;
    case 'iceblock': for (let y = y0, r = 0; y < y1; y += 30, r++) for (let x = x0 - (r % 2) * 36; x < x1; x += 72) { const col = shade(wl, (rng() - 0.3) * 0.12); dBlock(g, x + 1, y + 1, 71, 29, col, 5); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x + 10, y + 4); g.lineTo(x + 22, y + 4); g.lineTo(x + 12, y + 26); g.lineTo(x + 2, y + 26); g.closePath(); g.fill(); } break;
    case 'sandstone': for (let y = y0, r = 0; y < y1; y += 21, r++) for (let x = x0 - (r % 2) * 30; x < x1; x += 60) { const col = dVar(rng, wl, shade(wl, 0.08), 0.08); dBlock(g, x + 1, y + 1, 59, 20, col, 3); if (r === 1 && rng() < 0.7) dGlyph(g, x + 30, y + 11, 6, (rng() * 5) | 0, shadeTone(col, 0.35)); } break;
    default: { // earth: strata, stones and roots
      for (let y = y0, k = 0; y < y1; y += 12, k++) { g.fillStyle = k % 2 ? wl : shade(wl, 0.07); g.beginPath(); g.moveTo(x0, y); for (let x = x0; x <= x1; x += 40) g.lineTo(x, y + Math.sin(x * 0.03 + k) * 3); g.lineTo(x1, y + 14); g.lineTo(x0, y + 14); g.closePath(); g.fill(); }
      for (let i = 0; i < (x1 - x0) / 40; i++) { const sx = x0 + rng() * (x1 - x0), sy = y0 + rng() * H, r = 4 + rng() * 6; g.fillStyle = OUT; ell(g, sx + 0.8, sy + 1, r + 1.5, r * 0.75 + 1.5); g.fill(); g.fillStyle = '#a89a8e'; ell(g, sx, sy, r, r * 0.75); g.fill(); g.fillStyle = '#c9bdb2'; ell(g, sx - r * 0.3, sy - r * 0.3, r * 0.4, r * 0.25); g.fill(); }
    }
  }
  // the wall darkens toward the floor and catches light at the top
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(255,240,210,0.16)'); gr.addColorStop(0.35, 'rgba(255,240,210,0)'); gr.addColorStop(1, AO + '0.42)');
  g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, H);
  g.restore();
}
function dCap(g, L, x0, x1, y0, y1, rng) {
  const T = tones(L.cap);
  g.fillStyle = L.cap; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = T.hi; g.fillRect(x0, y0, x1 - x0, 3);
  const yb = y1;
  switch (L.capK) {
    case 'moss': for (let x = x0; x < x1; x += 10 + rng() * 10) { g.fillStyle = rng() < 0.5 ? L.cap : T.sh; circ(g, x, yb, 5 + rng() * 5); g.fill(); if (rng() < 0.18) taperLine(g, [[x, yb], [x + 1, yb + 10 + rng() * 14]], 3, L.cap, 1, 0.2); } break;
    case 'snow': for (let x = x0; x < x1; x += 12 + rng() * 10) { g.fillStyle = '#ffffff'; circ(g, x, yb - 1, 6 + rng() * 5); g.fill(); } g.fillStyle = '#e1eef8'; g.fillRect(x0, yb - 2, x1 - x0, 2); break;
    case 'grass': g.fillStyle = T.sh; g.fillRect(x0, yb - 4, x1 - x0, 4); for (let x = x0 + 6; x < x1; x += 14 + rng() * 16) dTuft(g, x, yb + 5, 9 + rng() * 5, rng() < 0.5 ? L.cap : T.sh); break;
    case 'crenel': g.fillStyle = T.sh; g.fillRect(x0, yb - 4, x1 - x0, 4); g.fillStyle = '#ffd84d'; g.fillRect(x0, yb - 8, x1 - x0, 2.5); break;
    case 'gold': g.fillStyle = '#3a8fd9'; g.fillRect(x0, yb - 6, x1 - x0, 4); g.fillStyle = '#ffd84d'; for (let x = x0; x < x1; x += 16) g.fillRect(x + 4, yb - 6, 8, 4); break;
    case 'wet': g.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = x0; x < x1; x += 30 + rng() * 40) g.fillRect(x, y0 + 4 + rng() * 4, 10 + rng() * 14, 2); break;
    default: g.fillStyle = T.sh; g.fillRect(x0, yb - 4, x1 - x0, 4);
  }
  g.strokeStyle = OUT; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0, yb); g.lineTo(x1, yb); g.stroke();
}
// a side or bottom wall seen from above: a band of capstones
function dWallTop(g, L, x, y, w, h, horiz, rng) {
  const top = shade(L.wl, 0.16);
  g.fillStyle = shadeTone(top, 0.25); g.fillRect(x, y, w, h);
  if (horiz) for (let xx = x; xx < x + w; xx += 34) dBlock(g, xx + 1, y + 2, 33, h - 4, dVar(rng, top, shade(top, 0.06), 0.08), 4);
  else for (let yy = y; yy < y + h; yy += 34) dBlock(g, x + 2, yy + 1, w - 4, 33, dVar(rng, top, shade(top, 0.06), 0.08), 4);
}

// ---- wall and floor dressing for each theme
function dDecorWall(g, L, R, x, y0, y1, rng, k) {
  const H = y1 - y0;
  switch (L.deco) {
    case 'oak': if (k % 2) { for (let v = 0; v < 3; v++) { const vx = x - 14 + v * 12; taperLine(g, qpts(vx, y0 - 2, vx + 8, y0 + H * 0.4, vx - 2, y0 + H * (0.55 + rng() * 0.35)), 4, '#4c9a43', 1, 0.3); dLeaf(g, vx - 1, y0 + H * 0.5, 4, 1, '#6fbf4f'); } } else { g.fillStyle = OUT; ell(g, x, y1 - 7, 15, 7); g.fill(); g.fillStyle = '#e8475f'; g.beginPath(); g.ellipse(x, y1 - 9, 13, 8, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff3e8'; circ(g, x - 5, y1 - 13, 2); g.fill(); circ(g, x + 4, y1 - 12, 1.6); g.fill(); g.fillStyle = '#efe2cf'; g.fillRect(x - 3, y1 - 9, 6, 6); } break;
    case 'keep': if (k % 2) { g.fillStyle = OUT; g.beginPath(); g.moveTo(x - 18, y0 + 2); g.lineTo(x + 18, y0 + 2); g.lineTo(x + 18, y1 - 6); g.lineTo(x, y1 - 14); g.lineTo(x - 18, y1 - 6); g.closePath(); g.fill(); g.fillStyle = '#c94a7a'; g.beginPath(); g.moveTo(x - 15, y0 + 2); g.lineTo(x + 15, y0 + 2); g.lineTo(x + 15, y1 - 9); g.lineTo(x, y1 - 16); g.lineTo(x - 15, y1 - 9); g.closePath(); g.fill(); g.fillStyle = '#a8355f'; g.fillRect(x + 7, y0 + 2, 8, H - 12); g.fillStyle = '#ffd84d'; g.fillRect(x - 15, y0 + 6, 30, 3); drawFishBone(g, x, y0 + H * 0.45, 7); } else { g.fillStyle = OUT; g.beginPath(); g.arc(x, y0 + 22, 15, Math.PI, 0); g.lineTo(x + 15, y1 - 10); g.lineTo(x - 15, y1 - 10); g.closePath(); g.fill(); g.fillStyle = '#2a2050'; g.beginPath(); g.arc(x, y0 + 22, 12, Math.PI, 0); g.lineTo(x + 12, y1 - 13); g.lineTo(x - 12, y1 - 13); g.closePath(); g.fill(); g.fillStyle = '#fff6c8'; circ(g, x + 4, y0 + 20, 3.5); g.fill(); g.fillStyle = '#ffffff'; for (let s = 0; s < 3; s++) { circ(g, x - 6 + s * 5, y0 + 30 + (s % 2) * 6, 0.9); g.fill(); } g.fillStyle = OUT; g.fillRect(x - 1, y0 + 8, 2, H - 18); } break;
    case 'grotto': { const cols = ['#8ff0ff', '#b9a8ff']; const col = cols[k % 2]; for (let s = -1; s <= 1; s++) { const h = 14 + (1 - Math.abs(s)) * 10; g.save(); g.translate(x + s * 8, y1 - 2); g.rotate(s * 0.35); g.fillStyle = OUT; g.beginPath(); g.moveTo(-5, 0); g.lineTo(-4, -h); g.lineTo(0, -h - 6); g.lineTo(4, -h); g.lineTo(5, 0); g.closePath(); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(-3.5, -1); g.lineTo(-2.6, -h); g.lineTo(0, -h - 3.5); g.lineTo(2.6, -h); g.lineTo(3.5, -1); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-1.6, -h + 2, 1.3, h - 4); g.restore(); } taperLine(g, qpts(x + 20, y0, x + 26, y0 + H * 0.5, x + 18, y0 + H * 0.8), 4, '#5fb848', 1, 0.2); break; }
    case 'ice': for (let s = 0; s < 5; s++) { const ix = x - 22 + s * 11, ih = 10 + ((s * 7 + k * 3) % 5) * 4; g.fillStyle = OUT; g.beginPath(); g.moveTo(ix - 4.5, y0 - 1); g.lineTo(ix, y0 + ih + 2); g.lineTo(ix + 4.5, y0 - 1); g.fill(); g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(ix - 3, y0); g.lineTo(ix, y0 + ih); g.lineTo(ix + 3, y0); g.fill(); } break;
    case 'sand': if (k % 2) { g.fillStyle = OUT; g.beginPath(); g.moveTo(x - 16, y1 - 4); g.lineTo(x - 16, y0 + 16); g.arc(x, y0 + 16, 16, Math.PI, 0); g.lineTo(x + 16, y1 - 4); g.closePath(); g.fill(); g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(x - 13, y1 - 6); g.lineTo(x - 13, y0 + 16); g.arc(x, y0 + 16, 13, Math.PI, 0); g.lineTo(x + 13, y1 - 6); g.closePath(); g.fill(); g.fillStyle = '#ffd84d'; g.beginPath(); g.moveTo(x - 7, y1 - 7); g.lineTo(x - 7, y0 + 24); g.lineTo(x - 5, y0 + 15); g.lineTo(x - 2, y0 + 21); g.lineTo(x + 2, y0 + 21); g.lineTo(x + 5, y0 + 15); g.lineTo(x + 7, y0 + 24); g.lineTo(x + 7, y1 - 7); g.closePath(); g.fill(); g.fillStyle = OUT; circ(g, x - 2.5, y0 + 27, 1.2); g.fill(); circ(g, x + 2.5, y0 + 27, 1.2); g.fill(); } else { g.fillStyle = '#3a8fd9'; ell(g, x, y0 + H * 0.45, 13, 7); g.fill(); g.fillStyle = '#ffffff'; ell(g, x, y0 + H * 0.45, 8, 4.4); g.fill(); g.fillStyle = OUT; ell(g, x, y0 + H * 0.45, 2.8, 4.2); g.fill(); g.strokeStyle = '#3a8fd9'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 4, y0 + H * 0.45 + 7); g.lineTo(x - 7, y0 + H * 0.45 + 16); g.stroke(); } break;
    case 'dirt': for (let r = 0; r < 2; r++) { const rx = x - 10 + r * 22; taperLine(g, qpts(rx, y0 - 2, rx + 10 * (r ? 1 : -1), y0 + H * 0.5, rx + 4, y0 + H * (0.6 + rng() * 0.3)), 5, '#5a3a24', 1, 0.15); } break;
    case 'kennel': if (k % 2) { g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y0 + 6); g.lineTo(x, y0 + 14); g.stroke(); g.fillStyle = '#e8475f'; g.beginPath(); g.ellipse(x, y0 + 24, 10, 10, 0, 0, TAU); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke(); g.strokeStyle = '#e8475f'; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#ffd84d'; circ(g, x, y0 + 34, 3); g.fill(); } else { g.fillStyle = OUT; g.beginPath(); rrect(g, x - 18, y0 + 8, 36, 26, 4); g.fill(); g.fillStyle = '#9fd0f0'; g.beginPath(); rrect(g, x - 15, y0 + 11, 30, 20, 3); g.fill(); g.fillStyle = OUT; g.fillRect(x - 1, y0 + 11, 2, 20); g.fillRect(x - 15, y0 + 20, 30, 2); } break;
    case 'haunt': if (k % 2) { g.save(); g.translate(x, y0 + H * 0.45); g.rotate(0.12 * (k % 4 ? 1 : -1)); g.fillStyle = OUT; g.fillRect(-15, -15, 30, 30); g.fillStyle = '#b8743e'; g.fillRect(-12, -12, 24, 24); g.fillStyle = '#3a3050'; g.fillRect(-9, -9, 18, 18); g.fillStyle = '#d8d0e8'; circ(g, 0, -1, 5); g.fill(); g.beginPath(); g.moveTo(-4, -4); g.lineTo(-6, -9); g.lineTo(-1, -6); g.closePath(); g.moveTo(4, -4); g.lineTo(6, -9); g.lineTo(1, -6); g.closePath(); g.fill(); g.fillStyle = '#e8475f'; circ(g, -2, -1, 1); g.fill(); circ(g, 2, -1, 1); g.fill(); g.restore(); } else dWeb(g, x - 20, y0, 26, 1, 1); break;
  }
}
function dDecorFloor(g, L, R, x0, y0, x1, y1, rng) {
  const cy = R.h / 2 + 10;
  switch (L.deco) {
    case 'oak': for (let i = 0; i < 46; i++) dLeaf(g, x0 + rng() * (x1 - x0), y0 + rng() * (y1 - y0), 4 + rng() * 3, rng() * TAU, pick(['#e08a3c', '#d9b04a', '#8cc85c', '#c9643a', '#e8a64a'])); for (let i = 0; i < 8; i++) { const ax = x0 + rng() * (x1 - x0), ay = y0 + rng() * (y1 - y0); g.fillStyle = OUT; ell(g, ax, ay + 1, 5, 6); g.fill(); g.fillStyle = '#b5773e'; ell(g, ax, ay + 1.5, 3.8, 4.6); g.fill(); g.fillStyle = '#7a4f2a'; ell(g, ax, ay - 2.5, 4.5, 2.5); g.fill(); } for (let i = 0; i < 6; i++) { const ry = y0 + 40 + rng() * (y1 - y0 - 80), left = rng() < 0.5; const rx = left ? x0 : x1; taperLine(g, qpts(rx, ry, rx + (left ? 50 : -50), ry + rng() * 30 - 15, rx + (left ? 90 + rng() * 40 : -90 - rng() * 40), ry + rng() * 40 - 20), 9, '#6d4a33', 1, 0.1); } break;
    case 'keep': { const ty = cy - 52, h = 104; g.fillStyle = OUT; g.fillRect(x0, ty - 3, x1 - x0, h + 6); g.fillStyle = '#9e2c48'; g.fillRect(x0, ty, x1 - x0, h); g.fillStyle = '#b8324e'; g.fillRect(x0, ty + 12, x1 - x0, h - 24); g.fillStyle = '#ffd84d'; g.fillRect(x0, ty + 7, x1 - x0, 3); g.fillRect(x0, ty + h - 10, x1 - x0, 3); g.fillStyle = '#d9476a'; for (let x = x0 + 30; x < x1; x += 60) { g.beginPath(); g.moveTo(x, ty + 22); g.lineTo(x + 14, ty + h / 2); g.lineTo(x, ty + h - 22); g.lineTo(x - 14, ty + h / 2); g.closePath(); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0, ty + 12, x1 - x0, 6); break; }
    case 'grotto': for (let i = 0; i < 6; i++) { const px = x0 + 60 + rng() * (x1 - x0 - 120), py = y0 + 40 + rng() * (y1 - y0 - 80), rw = 26 + rng() * 40; g.fillStyle = OUT; ell(g, px, py, rw + 2.5, rw * 0.38 + 2.5); g.fill(); g.fillStyle = '#4f86b8'; ell(g, px, py, rw, rw * 0.38); g.fill(); g.fillStyle = '#7fc0e6'; ell(g, px - 2, py - 2, rw * 0.85, rw * 0.28); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(px - rw * 0.3, py - rw * 0.08, rw * 0.3, rw * 0.08, 0, Math.PI * 1.1, Math.PI * 1.7); g.stroke(); } for (let i = 0; i < 10; i++) { const sx = x0 + rng() * (x1 - x0), sy = y0 + rng() * (y1 - y0); g.fillStyle = OUT; g.beginPath(); g.arc(sx, sy, 5.5, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = pick(['#ffd0db', '#fff3e0', '#ffc7a8']); g.beginPath(); g.arc(sx, sy - 0.5, 4, Math.PI, 0); g.closePath(); g.fill(); } for (let x = x0 + 20; x < x1; x += 70 + rng() * 60) dTuft(g, x, y1 - 2, 14, '#3f9a5a'); break;
    case 'ice': for (const [ex, ey, d] of [[x0, 0, 1], [x1, 0, -1]]) for (let y = y0 + 10; y < y1; y += 22) { g.fillStyle = '#ffffff'; circ(g, ex + d * (6 + rng() * 10), y, 10 + rng() * 8); g.fill(); } for (let x = x0; x < x1; x += 22) { g.fillStyle = '#ffffff'; circ(g, x, y1 - 4 - rng() * 6, 9 + rng() * 7); g.fill(); } break;
    case 'sand': for (let i = 0; i < 9; i++) { const px = x0 + rng() * (x1 - x0), py = y0 + rng() * (y1 - y0); g.fillStyle = 'rgba(247,221,156,0.75)'; ell(g, px, py, 40 + rng() * 50, 10 + rng() * 10); g.fill(); g.strokeStyle = 'rgba(200,150,80,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(px, py + 2, 26, 4, 0, 0.2, Math.PI - 0.2); g.stroke(); } for (let i = 0; i < 4; i++) drawFishBone(g, x0 + 60 + rng() * (x1 - x0 - 120), y0 + 60 + rng() * (y1 - y0 - 120), 7); break;
    case 'dirt': for (let x = x0 + 10; x < x1; x += 22 + rng() * 26) dTuft(g, x, y0 + 8 + rng() * 6, 10 + rng() * 5, pick(['#6cc24a', '#58a83c'])); for (let i = 0; i < 5; i++) { const mx = x0 + 40 + rng() * (x1 - x0 - 80), my = y0 + 40 + rng() * (y1 - y0 - 80); g.fillStyle = OUT; ell(g, mx, my - 5, 9, 6); g.fill(); g.fillRect(mx - 3, my - 5, 6, 8); g.fillStyle = '#efe2cf'; g.fillRect(mx - 2, my - 5, 4, 7); g.fillStyle = pick(['#e8a64a', '#c9643a']); g.beginPath(); g.ellipse(mx, my - 5, 7.5, 5, 0, Math.PI, 0); g.fill(); } break;
    case 'kennel': for (let i = 0; i < 14; i++) { const sx = x0 + rng() * (x1 - x0), sy = y0 + rng() * (y1 - y0); for (let s = 0; s < 6; s++) { g.strokeStyle = pick(['#e9c86a', '#d9b04a', '#f2da8a']); g.lineWidth = 2; const a = rng() * TAU, l = 6 + rng() * 6; g.beginPath(); g.moveTo(sx + rng() * 16 - 8, sy + rng() * 8 - 4); g.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l * 0.5); g.stroke(); } } for (let i = 0; i < 3; i++) drawBone(g, x0 + 80 + rng() * (x1 - x0 - 160), y0 + 60 + rng() * (y1 - y0 - 120), 9, rng() * TAU); break;
    case 'haunt': dWeb(g, x0, y0, 70, 1, 1); dWeb(g, x1, y0, 70, -1, 1); dWeb(g, x0, y1, 50, 1, -1); dWeb(g, x1, y1, 50, -1, -1); for (let i = 0; i < 6; i++) { const cx = x0 + 60 + rng() * (x1 - x0 - 120), cy2 = y0 + 50 + rng() * (y1 - y0 - 100); g.fillStyle = OUT; g.fillRect(cx - 4, cy2 - 14, 8, 15); g.fillStyle = '#efe6d8'; g.fillRect(cx - 2.5, cy2 - 13, 5, 13); g.fillStyle = 'rgba(232,220,200,0.8)'; ell(g, cx, cy2 + 1, 9, 3); g.fill(); } break;
  }
}

Dungeon.roomCanvas = function (R) {
  const key = R.i, sc = DSCALE();
  const hit = this.cache[key];
  if (hit && hit.sc === sc) return hit.cv;
  // keep only the rooms near the hero in memory
  for (const k in this.cache) if (Math.abs(k - this.D.cur) > 2) delete this.cache[k];
  const L = dLook(), cv = mkCanvas((R.w + 2) * sc, (R.h + 2 + WEX) * sc), g = cv.getContext('2d');
  g.scale(sc, sc); g.translate(0, WEX); g.lineJoin = 'round'; g.lineCap = 'round';
  const rng = mulberry32(R.i * 131 + this.D.id.length * 17 + 7);
  const fx0 = WALL, fx1 = R.w - WALL, fy0 = TOPW, fy1 = R.h - WALL, cy = R.h / 2, dy0 = cy - DOOR / 2 + 10, dy1 = cy + DOOR / 2 + 10;
  dFloor(g, L, fx0 - 2, fy0 - 2, fx1 + 2, fy1 + 2, rng);
  g.save(); g.beginPath(); g.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); g.clip();
  dDecorFloor(g, L, R, fx0, fy0, fx1, fy1, rng);
  dAO(g, fx0, fy0, fx1, fy1, 90);
  g.restore();
  // walls: the back wall shows its face, the sides and front show their tops
  dWallFace(g, L, 0, R.w, 16 - WEX, TOPW, rng);
  dCap(g, L, 0, R.w, -WEX, 16 - WEX, rng);
  const hasL = true, hasR = R.i < this.D.rooms.length - 1;
  dWallTop(g, L, 0, 16 - WEX, WALL, R.h - 16 + WEX, false, rng);
  dWallTop(g, L, R.w - WALL, 16 - WEX, WALL, R.h - 16 + WEX, false, rng);
  dWallTop(g, L, WALL, R.h - WALL, R.w - WALL * 2, WALL, true, rng);
  // doorways cut through the side walls
  const door = (x) => { dFloor(g, L, x, dy0, x + WALL, dy1, rng); g.fillStyle = AO + '0.35)'; g.fillRect(x, dy0, WALL, 10); for (const yy of [dy0 - 12, dy1]) { dBlock(g, x - 2, yy, WALL + 4, 12, shade(L.wl, 0.24), 4); } };
  if (hasL) door(0);
  if (hasR) door(R.w - WALL);
  // wall dressing between the torches
  let k = 0;
  for (let x = 120; x < R.w - 90; x += 175) { if (dTorches(R).some((tx) => Math.abs(tx - x) < 70)) continue; dDecorWall(g, L, R, x, 16 - WEX * 0.6, TOPW - 4, rng, k++); }
  // one confident ink line around the floor, broken at the doors
  g.strokeStyle = OUT; g.lineWidth = 3.2; g.beginPath();
  g.moveTo(fx0, dy0 - 12); g.lineTo(fx0, fy0); g.lineTo(fx1, fy0); g.lineTo(fx1, hasR ? dy0 - 12 : fy1);
  if (hasR) { g.moveTo(fx1, dy1 + 12); g.lineTo(fx1, fy1); } else g.lineTo(fx1, fy1);
  g.lineTo(fx0, fy1); g.lineTo(fx0, dy1 + 12); g.stroke();
  g.lineWidth = 2.5; g.strokeRect(0.5, 0.5 - WEX, R.w - 1, R.h - 1 + WEX);
  this.cache[key] = { cv, sc };
  return cv;
};
function dTorches(R) { const out = []; for (let x = 250; x < R.w - 120; x += 520) out.push(x); return out; }
// the short halls between rooms, painted once per dungeon
Dungeon.hallCanvas = function () {
  const sc = DSCALE();
  if (this.cache.hall && this.cache.hall.sc === sc) return this.cache.hall.cv;
  const L = dLook(), w = GAP + 8, top = 64, h = DOOR + top + 30, cv = mkCanvas(w * sc, h * sc), g = cv.getContext('2d');
  g.scale(sc, sc); g.lineJoin = 'round'; g.lineCap = 'round';
  const rng = mulberry32(this.D.id.length * 7 + 3);
  dFloor(g, L, 0, top, w, top + DOOR, rng);
  g.fillStyle = AO + '0.45)'; g.fillRect(0, top, w, 18);
  dWallFace(g, L, 0, w, 12, top, rng); dCap(g, L, 0, w, 0, 12, rng);
  dWallTop(g, L, 0, top + DOOR, w, h - top - DOOR, true, rng);
  g.strokeStyle = OUT; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, top); g.lineTo(w, top); g.moveTo(0, top + DOOR); g.lineTo(w, top + DOOR); g.stroke();
  this.cache.hall = { cv, sc, top };
  return cv;
};

Dungeon.drawFloor = function (c, t) {
  const D = this.D; if (!D) return;
  const L = dLook(), v = viewRect(40);
  c.fillStyle = '#21142a'; c.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
  D.lockK = clamp((D.lockK || 0) + (D.locked ? 0.07 : -0.07), 0, 1);
  // paint rooms ahead of time: the first two while the iris is closed, the next one as each fight ends
  if (!D.prebaked) { D.prebaked = 1; this.hallCanvas(); this.roomCanvas(D.rooms[0]); if (D.rooms[1]) this.roomCanvas(D.rooms[1]); }
  else if (!D.locked && this.room().cleared && D.rooms[D.cur + 1] && !this.cache[D.cur + 1]) this.roomCanvas(D.rooms[D.cur + 1]);
  for (let i = 0; i < D.rooms.length; i++) {
    const R = D.rooms[i];
    if (R.x > v.x1 + GAP || R.x + R.w + GAP < v.x0) continue;
    const cy = R.y + R.h / 2;
    if (i < D.rooms.length - 1) { const hc = this.hallCanvas(), top = this.cache.hall.top; c.drawImage(hc, R.x + R.w - 4, cy - DOOR / 2 + 10 - top, GAP + 8, DOOR + top + 30); }
    if (i === 0) { c.fillStyle = L.fl2; c.fillRect(R.x - 70, cy - DOOR / 2 + 10, 72, DOOR); }
    if (R.x > v.x1 || R.x + R.w < v.x0) continue;
    c.drawImage(this.roomCanvas(R), R.x, R.y - WEX, R.w + 2, R.h + 2 + WEX);
    if (i === 0) {
      // daylight spilling in from the front door
      const ex = R.x - 70, y0 = cy - DOOR / 2 + 10;
      const gr = c.createLinearGradient(ex, 0, R.x + 190, 0); gr.addColorStop(0, 'rgba(255,246,214,0.8)'); gr.addColorStop(0.35, 'rgba(255,240,200,0.3)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(ex, y0); c.lineTo(R.x + WALL, y0); c.lineTo(R.x + 190, y0 - 26); c.lineTo(R.x + 190, y0 + DOOR + 26); c.lineTo(R.x + WALL, y0 + DOOR); c.lineTo(ex, y0 + DOOR); c.closePath(); c.fill();
    }
    // torches (fire) or glowing crystals on the back wall
    for (const tx0 of dTorches(R)) {
      const x = R.x + tx0, y = R.y + 14, fl = Math.sin(t * 13 + tx0) * 0.5 + Math.sin(t * 21 + tx0 * 2) * 0.5;
      glow(c, x, y - 8, 70 + fl * 6, L.light, 0.3);
      if (L.fire) {
        c.fillStyle = OUT; c.beginPath(); c.moveTo(x - 9, y + 2); c.lineTo(x + 9, y + 2); c.lineTo(x + 5, y + 14); c.lineTo(x - 5, y + 14); c.closePath(); c.fill(); c.fillRect(x - 2.5, y + 12, 5, 14);
        c.fillStyle = '#6a5a70'; c.beginPath(); c.moveTo(x - 7, y + 3.5); c.lineTo(x + 7, y + 3.5); c.lineTo(x + 4, y + 12); c.lineTo(x - 4, y + 12); c.closePath(); c.fill();
        const h = 22 + fl * 3, sw = Math.sin(t * 9 + tx0) * 2.5;
        c.fillStyle = '#e8475f'; c.beginPath(); c.moveTo(x - 8, y + 3); c.quadraticCurveTo(x - 10, y - h * 0.5, x + sw, y - h); c.quadraticCurveTo(x + 10, y - h * 0.5, x + 8, y + 3); c.closePath(); c.fill();
        c.fillStyle = '#ffb33a'; c.beginPath(); c.moveTo(x - 6, y + 3); c.quadraticCurveTo(x - 7, y - h * 0.35, x + sw * 0.7, y - h * 0.78); c.quadraticCurveTo(x + 7, y - h * 0.35, x + 6, y + 3); c.closePath(); c.fill();
        c.fillStyle = '#fff1a8'; c.beginPath(); c.moveTo(x - 3, y + 3); c.quadraticCurveTo(x - 4, y - h * 0.2, x + sw * 0.4, y - h * 0.45); c.quadraticCurveTo(x + 4, y - h * 0.2, x + 3, y + 3); c.closePath(); c.fill();
        for (let s = 0; s < 2; s++) { const q = (t * 0.9 + s * 0.5 + tx0 * 0.01) % 1; c.globalAlpha = 1 - q; c.fillStyle = '#ffd84d'; circ(c, x + Math.sin(q * 9 + s) * 5, y - h - q * 26, 1.6); c.fill(); }
        c.globalAlpha = 1;
      } else {
        const pul = 1 + Math.sin(t * 3 + tx0) * 0.06;
        c.save(); c.translate(x, y); c.scale(pul, pul);
        c.fillStyle = OUT; c.beginPath(); c.moveTo(0, -20); c.lineTo(9, -6); c.lineTo(5, 12); c.lineTo(-5, 12); c.lineTo(-9, -6); c.closePath(); c.fill();
        c.fillStyle = L.light; c.beginPath(); c.moveTo(0, -17); c.lineTo(6.5, -6); c.lineTo(3.5, 9.5); c.lineTo(-3.5, 9.5); c.lineTo(-6.5, -6); c.closePath(); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, -15); c.lineTo(-4.5, -6); c.lineTo(-2, 6); c.closePath(); c.fill();
        c.restore();
      }
    }
    // portcullis bars drop over the doors while a fight is on
    if (D.cur === i && D.lockK > 0) {
      const k = easeOut(D.lockK), y0 = cy - DOOR / 2 + 10;
      for (const dx of [R.x, R.x + R.w - WALL]) {
        if (dx > R.x + 10 && i === D.rooms.length - 1) continue;
        c.save(); c.beginPath(); c.rect(dx - 4, y0 - 14, WALL + 8, DOOR + 14); c.clip(); c.translate(0, -(1 - k) * (DOOR + 20));
        for (let b = 0; b < 4; b++) { const bx = dx + 6 + b * 9.5; c.fillStyle = OUT; c.fillRect(bx - 1.5, y0 - 14, 7, DOOR + 12); c.fillStyle = '#7d7f94'; c.fillRect(bx, y0 - 14, 4, DOOR + 10); c.fillStyle = '#b9bccb'; c.fillRect(bx, y0 - 14, 1.5, DOOR + 10); c.fillStyle = OUT; c.beginPath(); c.moveTo(bx - 1.5, y0 + DOOR - 4); c.lineTo(bx + 5.5, y0 + DOOR - 4); c.lineTo(bx + 2, y0 + DOOR + 4); c.closePath(); c.fill(); }
        for (const yy of [y0 + DOOR * 0.25, y0 + DOOR * 0.65]) { c.fillStyle = OUT; c.fillRect(dx + 2, yy - 1.5, WALL - 4, 8); c.fillStyle = '#8d8fa4'; c.fillRect(dx + 3, yy, WALL - 6, 5); }
        c.restore();
      }
    }
    for (const o of R.obst) softShadow(c, o.x + 6, o.y + 6, o.r * 1.5, o.r * 0.6, 0.45);
    for (const p of R.pots) if (p.hp > 0) softShadow(c, p.x + 2, p.y + 1, 17, 6, 0.38);
  }
  if (D.exit) drawExitRune(c, D.exit.x, D.exit.y, t);
};
// the way out: a ring of runes turning around a glowing paw, with a beam of light
function drawExitRune(c, x, y, t) {
  const pulse = Math.sin(t * 4) * 0.5 + 0.5;
  glow(c, x, y, 90, '#ffd84d', 0.35 + pulse * 0.15);
  c.save(); c.translate(x, y); c.scale(1, 0.45);
  c.lineWidth = 7; c.strokeStyle = OUT; circ(c, 0, 0, 52); c.stroke(); circ(c, 0, 0, 34); c.stroke();
  c.lineWidth = 3.5; c.strokeStyle = '#ffd84d'; circ(c, 0, 0, 52); c.stroke(); c.strokeStyle = '#fff1a8'; circ(c, 0, 0, 34); c.stroke();
  c.rotate(t * 0.8);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; c.save(); c.translate(Math.cos(a) * 43, Math.sin(a) * 43); c.rotate(a + Math.PI / 2); dGlyph(c, 0, 0, 4, i, '#ffd84d'); c.restore(); }
  c.restore();
  drawPaw(c, x, y - 2, 12, '#ffd84d');
  const gr = c.createLinearGradient(0, y - 160, 0, y); gr.addColorStop(0, 'rgba(255,240,170,0)'); gr.addColorStop(1, `rgba(255,240,170,${0.3 + pulse * 0.15})`);
  c.fillStyle = gr; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x - 26, y - 160); c.lineTo(x + 26, y - 160); c.lineTo(x + 40, y); c.closePath(); c.fill();
  for (let s = 0; s < 5; s++) { const q = (t * 0.5 + s / 5) % 1; c.globalAlpha = 1 - q; c.fillStyle = '#fff6c8'; circ(c, x + Math.sin(s * 2.3 + t) * 22, y - q * 140, 2); c.fill(); }
  c.globalAlpha = 1;
  c.font = '700 14px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = OUT; c.strokeText('Exit', x, y - 34); c.fillStyle = '#fff'; c.fillText('Exit', x, y - 34);
}
// darkness everywhere but around the hero, the torches and the exit, painted at low resolution
Dungeon.drawLight = function (c) {
  const D = this.D; if (!D) return;
  const L = dLook(); if (!L.dark) return;
  const k = 6, w = Math.ceil(SW / k), h = Math.ceil(SH / k);
  if (!this.lc || this.lc.width !== w || this.lc.height !== h) this.lc = mkCanvas(w, h);
  const g = this.lc.getContext('2d'), t = S.time;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
  g.fillStyle = `rgba(22,10,38,${L.dark})`; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  g.setTransform(Cam.z / k, 0, 0, Cam.z / k, (SW / 2 - Cam.x * Cam.z) / k, (SH / 2 - Cam.y * Cam.z) / k);
  const hole = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  hole(P.x, P.y - 20, 240, 0.92);
  const v = viewRect(300);
  for (const R of D.rooms) {
    if (R.x > v.x1 || R.x + R.w < v.x0) continue;
    for (const tx of dTorches(R)) hole(R.x + tx, R.y + 30, 210 + Math.sin(t * 13 + tx) * 8, 0.85);
    if (R.chest && R.cleared && !R.chest.open) hole(R.chest.x, R.chest.y - 20, 150, 0.6);
    if (R.i === 0) hole(R.x - 20, R.y + R.h / 2 + 10, 300, 0.9);
  }
  if (D.exit) hole(D.exit.x, D.exit.y - 20, 240, 0.9);
  for (const f of S.foes) if (f.boss && !f.gone) hole(f.x, f.y - 40, 200, 0.5);
  if (Game.sq) hole(Game.sq.x, Game.sq.y, 140, 0.5);
  c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(this.lc, 0, 0, w * k, h * k); c.restore();
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
// small sprite cache for pillars, pots and chests, painted at a fixed high scale
const DSPR = {};
function dSprite(key, w, h, ox, oy, fn) {
  let s = DSPR[key];
  if (!s) { const k = 3, cv = mkCanvas(w * k, h * k), g = cv.getContext('2d'); g.scale(k, k); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round'; fn(g); s = DSPR[key] = { cv, w, h, ox, oy }; }
  return s;
}
function dDrawSprite(c, s, x, y) { c.drawImage(s.cv, x - s.ox, y - s.oy, s.w, s.h); }
function drawPillar(c, o, th) {
  const L = Dungeon.D ? dLook() : DLOOK.keep, r = o.r;
  const s = dSprite('pil:' + L.pillar + ':' + L.wl + ':' + r, r * 2 + 40, r * 3.6 + 50, r + 20, r * 3.6 + 30, (g) => pillarArt(g, r, L));
  dDrawSprite(c, s, o.x, o.y);
}
function pillarArt(g, r, L) {
  const ink = (fn, w) => { fn(); g.lineWidth = w || 5; g.strokeStyle = OUT; g.stroke(); };
  const H = r * 2.7, hw = r * 0.72;
  const shaft = (col, flutes) => {
    const p = () => { g.beginPath(); g.rect(-hw, -H, hw * 2, H); };
    ink(p, 6); g.fillStyle = col; p(); g.fill();
    const T = tones(col);
    g.fillStyle = T.hi; g.fillRect(-hw, -H, hw * 0.45, H); g.fillStyle = T.sh; g.fillRect(hw * 0.35, -H, hw * 0.65, H);
    if (flutes) { g.strokeStyle = T.sh2; g.lineWidth = 1.4; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * hw * 0.45, -H + 6); g.lineTo(i * hw * 0.45, -6); g.stroke(); } }
    g.strokeStyle = OUT; g.lineWidth = 2.5; p(); g.stroke();
  };
  const disc = (y, rx, ry, h, col) => {
    const p = () => { g.beginPath(); g.ellipse(0, y, rx, ry, 0, 0, Math.PI); g.lineTo(-rx, y - h); g.ellipse(0, y - h, rx, ry, 0, Math.PI, 0, true); g.closePath(); };
    ink(p, 5); const T = tones(col); g.fillStyle = T.sh; p(); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(0, y - h, rx, ry, 0, 0, TAU); g.fill(); g.fillStyle = T.hi; g.beginPath(); g.ellipse(-rx * 0.2, y - h - ry * 0.2, rx * 0.6, ry * 0.45, 0, 0, TAU); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 2.2; g.beginPath(); g.ellipse(0, y - h, rx, ry, 0, 0, TAU); g.stroke();
  };
  switch (L.pillar) {
    case 'trunk': {
      const col = '#7a5236';
      for (const s of [-1, 1]) taperLine(g, qpts(s * hw * 0.6, -8, s * hw * 1.5, -2, s * hw * 2.1, 4), 12, OUT, 1, 0.3), taperLine(g, qpts(s * hw * 0.6, -8, s * hw * 1.5, -2, s * hw * 2.05, 3), 8, col, 1, 0.3);
      shaft(col, false);
      for (let i = -2; i <= 2; i++) taperLine(g, [[i * hw * 0.35, -H + 4], [i * hw * 0.35 + 2, -H * 0.5], [i * hw * 0.35 - 1, -4]], 2.4, '#4f3322');
      const crown = () => { g.beginPath(); for (const [cx, cy, cr] of [[-hw * 0.9, -H - 4, r * 0.7], [hw * 0.9, -H - 2, r * 0.65], [0, -H - r * 0.55, r * 0.8], [-hw * 0.2, -H + 4, r * 0.6]]) { g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, TAU); } };
      ink(crown, 6); g.fillStyle = '#5fa24c'; crown(); g.fill();
      g.fillStyle = '#7fc45f'; for (const [cx, cy, cr] of [[-hw * 0.95, -H - 8, r * 0.4], [0, -H - r * 0.7, r * 0.45]]) { circ(g, cx, cy, cr); g.fill(); }
      g.fillStyle = '#e8475f'; circ(g, hw * 0.7, -H - 6, 3.5); g.fill(); circ(g, -hw * 0.3, -H - r * 0.9, 3); g.fill();
      break;
    }
    case 'post': {
      const col = L.wl === '#5a4a72' ? '#6a5a7a' : '#9a6a48';
      disc(6, r * 0.95, r * 0.4, 10, shade(col, -0.1));
      shaft(col, true);
      for (const y of [-H * 0.25, -H * 0.7]) { g.fillStyle = OUT; g.fillRect(-hw - 2, y - 4, hw * 2 + 4, 10); g.fillStyle = '#8d8fa4'; g.fillRect(-hw, y - 2, hw * 2, 6); g.fillStyle = '#c0c3d0'; g.fillRect(-hw, y - 2, hw * 2, 1.6); }
      disc(-H + 4, r * 0.95, r * 0.4, 12, shade(col, 0.08));
      break;
    }
    case 'spire': {
      const col = L.wl, T = tones(shade(col, 0.15));
      const p = () => { g.beginPath(); g.moveTo(-r * 1.0, 4); g.quadraticCurveTo(-r * 0.8, -H * 0.4, -r * 0.25, -H * 0.95); g.quadraticCurveTo(0, -H * 1.12, r * 0.25, -H * 0.95); g.quadraticCurveTo(r * 0.8, -H * 0.4, r * 1.0, 4); g.quadraticCurveTo(0, r * 0.45, -r * 1.0, 4); g.closePath(); };
      ink(p, 6); g.fillStyle = T.base; p(); g.fill();
      g.save(); p(); g.clip(); g.fillStyle = T.sh; g.fillRect(r * 0.15, -H * 1.2, r * 1.2, H * 1.4); g.fillStyle = T.hi; g.fillRect(-r, -H * 1.2, r * 0.45, H * 1.4);
      g.strokeStyle = T.sh2; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.ellipse(0, -H * i * 0.22, r * (1 - i * 0.18), r * 0.25, 0, 0.1, Math.PI - 0.1); g.stroke(); } g.restore();
      g.fillStyle = 'rgba(95,184,72,0.85)'; for (let i = 0; i < 6; i++) { circ(g, -r * 0.8 + i * r * 0.32, 2 - (i % 2) * 4, 5); g.fill(); }
      for (let s = -1; s <= 1; s += 2) { g.save(); g.translate(s * r * 0.75, -2); g.rotate(s * 0.4); g.fillStyle = OUT; g.beginPath(); g.moveTo(-5, 0); g.lineTo(0, -18); g.lineTo(5, 0); g.closePath(); g.fill(); g.fillStyle = s > 0 ? '#8ff0ff' : '#b9a8ff'; g.beginPath(); g.moveTo(-3, -1); g.lineTo(0, -15); g.lineTo(3, -1); g.closePath(); g.fill(); g.restore(); }
      break;
    }
    case 'crystal': {
      const p = () => { g.beginPath(); g.moveTo(-hw * 1.15, 0); g.lineTo(-hw * 1.15, -H * 0.85); g.lineTo(0, -H * 1.1); g.lineTo(hw * 1.15, -H * 0.85); g.lineTo(hw * 1.15, 0); g.lineTo(0, r * 0.35); g.closePath(); };
      ink(p, 6); g.fillStyle = '#a9d8f5'; p(); g.fill();
      g.fillStyle = '#d8f2ff'; g.beginPath(); g.moveTo(-hw * 1.15, 0); g.lineTo(-hw * 1.15, -H * 0.85); g.lineTo(0, -H * 1.1); g.lineTo(0, r * 0.35); g.closePath(); g.fill();
      g.fillStyle = '#7fb6e0'; g.beginPath(); g.moveTo(hw * 0.5, -H * 0.95); g.lineTo(hw * 1.15, -H * 0.85); g.lineTo(hw * 1.15, 0); g.lineTo(hw * 0.5, r * 0.15); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(-hw * 0.8, -H * 0.8); g.lineTo(-hw * 0.5, -H * 0.85); g.lineTo(-hw * 0.5, -H * 0.2); g.lineTo(-hw * 0.8, -H * 0.15); g.closePath(); g.fill();
      g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -H * 1.1); g.lineTo(0, r * 0.35); g.moveTo(hw * 0.5, -H * 0.95); g.lineTo(hw * 0.5, r * 0.15); g.stroke();
      g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { circ(g, -hw * 1.6 + i * hw * 0.8, 3 + (i % 2) * 3, 7 + (i % 3) * 2); g.fill(); }
      break;
    }
    case 'obelisk': {
      disc(6, r * 1.0, r * 0.42, 12, '#d9a95e');
      shaft(L.wl, false);
      g.fillStyle = '#3a8fd9'; g.fillRect(-hw, -H * 0.62, hw * 2, 10); g.fillStyle = '#ffd84d'; for (let x = -hw; x < hw; x += 8) g.fillRect(x + 2, -H * 0.62 + 2, 4, 6);
      for (let i = 0; i < 2; i++) dGlyph(g, 0, -H * (0.3 + i * 0.5) + 8, 6, i * 2 + 1, shadeTone(L.wl, 0.4));
      disc(-H + 6, r * 1.0, r * 0.42, 14, '#ffd84d');
      break;
    }
    case 'earth': {
      const col = L.wl;
      const p = () => { g.beginPath(); g.moveTo(-hw * 1.2, 4); g.bezierCurveTo(-hw * 0.7, -H * 0.4, -hw * 1.3, -H * 0.7, -hw * 0.9, -H); g.lineTo(hw * 0.9, -H); g.bezierCurveTo(hw * 1.3, -H * 0.7, hw * 0.7, -H * 0.4, hw * 1.2, 4); g.quadraticCurveTo(0, r * 0.45, -hw * 1.2, 4); g.closePath(); };
      ink(p, 6); g.fillStyle = col; p(); g.fill();
      g.save(); p(); g.clip(); g.fillStyle = shadeTone(col, 0.3); g.fillRect(hw * 0.3, -H - 10, hw * 1.2, H + 30); g.fillStyle = lightTone(col, 0.2); g.fillRect(-hw * 1.3, -H - 10, hw * 0.5, H + 30); g.restore();
      for (let i = 0; i < 3; i++) taperLine(g, qpts(-hw * 1.1, -H * (0.2 + i * 0.28), 0, -H * (0.12 + i * 0.28), hw * 1.1, -H * (0.25 + i * 0.27)), 4.5, '#5a3a24', 0.4, 1);
      dTuft(g, -hw * 0.4, -H + 2, 12, '#6cc24a'); dTuft(g, hw * 0.4, -H + 1, 10, '#58a83c');
      g.strokeStyle = OUT; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-hw * 0.9, -H); g.lineTo(hw * 0.9, -H); g.stroke();
      break;
    }
    default: {
      disc(6, r * 1.0, r * 0.42, 12, shade(L.wl, 0.12));
      shaft(shade(L.wl, 0.22), true);
      g.fillStyle = OUT; g.fillRect(-hw - 2, -H * 0.55 - 6, hw * 2 + 4, 14); g.fillStyle = '#c94a7a'; g.fillRect(-hw, -H * 0.55 - 4, hw * 2, 10); g.fillStyle = '#ffd84d'; g.fillRect(-hw, -H * 0.55 - 4, hw * 2, 2);
      disc(-H + 6, r * 1.05, r * 0.44, 14, shade(L.wl, 0.3));
    }
  }
}
function drawPot(c, p) {
  const s = dSprite('pot' + p.v, 44, 52, 22, 46, (g) => {
    const col = ['#c98a58', '#9fa6c8', '#d9a46a'][p.v], T = tones(col);
    const body = () => { g.beginPath(); g.moveTo(-9, -30); g.quadraticCurveTo(-19, -24, -16, -10); g.quadraticCurveTo(-12, 1, 0, 1); g.quadraticCurveTo(12, 1, 16, -10); g.quadraticCurveTo(19, -24, 9, -30); g.closePath(); };
    body(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke();
    g.fillStyle = col; body(); g.fill();
    g.save(); body(); g.clip();
    g.fillStyle = T.sh; g.beginPath(); g.ellipse(6, -10, 16, 16, 0, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(2, -14, 15, 15, 0, 0, TAU); g.fill();
    g.fillStyle = T.hi2; g.beginPath(); g.ellipse(-8, -19, 4, 7, -0.4, 0, TAU); g.fill();
    g.strokeStyle = T.sh2; g.lineWidth = 2; g.beginPath(); for (let x = -16; x <= 16; x += 6) { g.lineTo(x, -16 + ((x / 6) % 2 ? 3 : -1)); } g.stroke();
    g.restore();
    g.beginPath(); g.ellipse(0, -31, 11, 4.5, 0, 0, TAU); g.lineWidth = 4.5; g.strokeStyle = OUT; g.stroke(); g.fillStyle = T.hi; g.fill();
    g.fillStyle = '#3a2232'; g.beginPath(); g.ellipse(0, -31, 7, 2.6, 0, 0, TAU); g.fill();
  });
  dDrawSprite(c, s, p.x, p.y);
}
function drawChest(c, x, y, open, glw) {
  const s = dSprite('chest' + (open ? 1 : 0), 80, 80, 40, 66, (g) => {
    const wood = '#b8743e', T = tones(wood);
    const box = () => { g.beginPath(); rrect(g, -27, -28, 54, 28, 5); };
    box(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.fillStyle = wood; box(); g.fill();
    g.fillStyle = T.sh; g.fillRect(-27, -10, 54, 10); g.fillStyle = T.hi; g.fillRect(-25, -26, 50, 3);
    g.strokeStyle = shadeTone(wood, 0.4); g.lineWidth = 1.4; for (const yy of [-19, -10]) { g.beginPath(); g.moveTo(-25, yy); g.lineTo(25, yy); g.stroke(); }
    for (const bx of [-18, 18]) { g.fillStyle = OUT; g.fillRect(bx - 4, -29, 8, 30); g.fillStyle = '#8d8fa4'; g.fillRect(bx - 2.5, -28, 5, 28); g.fillStyle = '#c0c3d0'; g.fillRect(bx - 2.5, -28, 1.5, 28); }
    if (open) {
      g.fillStyle = '#2a1626'; g.beginPath(); g.ellipse(0, -28, 24, 5, 0, 0, TAU); g.fill();
      const lid = () => { g.beginPath(); g.moveTo(-27, -30); g.lineTo(-24, -52); g.quadraticCurveTo(0, -60, 24, -52); g.lineTo(27, -30); g.closePath(); };
      lid(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.fillStyle = shade(wood, -0.12); lid(); g.fill();
      g.fillStyle = '#5a3420'; g.beginPath(); g.moveTo(-23, -33); g.lineTo(-21, -49); g.quadraticCurveTo(0, -55, 21, -49); g.lineTo(23, -33); g.closePath(); g.fill();
    } else {
      const lid = () => { g.beginPath(); g.moveTo(-27, -27); g.quadraticCurveTo(-27, -46, 0, -46); g.quadraticCurveTo(27, -46, 27, -27); g.closePath(); };
      lid(); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.fillStyle = '#c98448'; lid(); g.fill();
      g.save(); lid(); g.clip(); g.fillStyle = tones('#c98448').sh; g.fillRect(-27, -33, 54, 8); g.fillStyle = tones('#c98448').hi2; g.beginPath(); g.ellipse(-8, -41, 12, 3, -0.1, 0, TAU); g.fill(); g.restore();
      for (const bx of [-18, 18]) { g.fillStyle = OUT; g.fillRect(bx - 4, -46, 8, 20); g.fillStyle = '#8d8fa4'; g.fillRect(bx - 2.5, -44, 5, 17); }
      g.beginPath(); rrect(g, -7, -32, 14, 15, 3); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke(); g.fillStyle = '#ffd84d'; g.fill(); g.fillStyle = '#e8a42c'; g.fillRect(-7, -22, 14, 5); g.fillStyle = OUT; circ(g, 0, -26, 2); g.fill(); g.fillRect(-1, -26, 2, 5);
    }
  });
  softShadow(c, x + 2, y + 2, 34, 9, 0.38);
  if (!open && glw) { const k = 0.5 + Math.sin(S.time * 4) * 0.5; glow(c, x, y - 22, 54, '#ffd84d', 0.25 + k * 0.15); }
  if (open) glow(c, x, y - 30, 36, '#fff1a8', 0.25);
  dDrawSprite(c, s, x, y);
  if (!open && glw) { const q = (S.time * 0.7) % 1; c.globalAlpha = Math.sin(q * Math.PI); c.fillStyle = '#fff6c8'; c.save(); c.translate(x + 16, y - 48 - q * 10); c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.4 : 5; const a = (i / 8) * TAU; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); c.globalAlpha = 1; }
}
