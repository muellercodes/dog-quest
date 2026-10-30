// The game loop: states, the camera, drawing order, saving and loading.
const Game = { state: 'boot', fading: false, saveT: 0, regionT: 0, region: null, sq: { x: 0, y: 0 } };
Game.canAct = function () { return this.state === 'play' && !this.fading && P.state !== 'dead'; };

Game.localSave = function () { const s = LS.get('dq_save', null); return s && s.game === 'dogquest' ? s : null; };
Game.save = function (force) {
  if (!G || this.state === 'title' || this.state === 'boot') return;
  if (S.scene === 'world') { G.x = P.x; G.y = P.y; }
  G.fog = Fog.save();
  G.saved = Date.now();
  G.lv = G.lv;
  LS.set('dq_save', G);
  Net.maybePush(force);
};
Game.migrate = function (s) {
  const d = newGame(s.hero ? s.hero.name : 'Biscuit', s.hero ? s.hero.breed : 'corgi', s.diff);
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  return s;
};
Game.load = function (data) {
  G = this.migrate(JSON.parse(JSON.stringify(data)));
  Fog.load(G.fog);
  S.scene = 'world'; S.dun = null; Dungeon.D = null;
  S.foes.length = 0; S.proj.length = 0; S.tele.length = 0; S.fx.length = 0; S.nums.length = 0; S.picks.length = 0; S.clouds.length = 0;
  for (const pk of Packs.list) { pk.alive = []; pk.spawned = 0; pk.cool = 0; }
  Bosses.current = null;
  P.x = G.x; P.y = G.y; P.state = 'idle'; P.inv = 1; P.hurt = 0; P.cds = {}; P.kbx = P.kby = 0;
  if (World.blocked(P.x, P.y, 10, !!G.flags.swim)) { const t = TOWNS[G.respawn] || TOWNS.waggington; P.x = t.x + 30; P.y = t.y + 70; }
  G.hp = clamp(G.hp, 1, maxHp());
  Cam.x = P.x; Cam.y = P.y; this.sq.x = P.x; this.sq.y = P.y - 50;
  this.region = null;
  this.state = 'play';
  UI.hideScreen();
  Music.play(this.regionMusic());
};
Game.continueGame = async function () {
  let s = this.localSave();
  if (Net.user) { const c = await Net.pullNewer(); if (c && (!s || (c.t || 0) > (s.t || 0))) { s = c; LS.set('dq_save', c); } }
  if (!s) return;
  this.fade(() => { this.load(s); if (G.main < MAIN.length && G.mainN === 0 && G.main === 0) Quests.begin(); else UI.toast('Welcome back, ' + G.hero.name + '!', 'save'); });
};
Game.startNew = function (name, breed, diff) {
  newGame(name, breed, diff);
  Fog.load('');
  UI.hideScreen();
  UI.showPrologue(() => {
    this.fade(() => {
      this.load(G);
      P.state = 'idle';
      LS.set('dq_save', G);
      if (Net.user) { Net.blocked = false; Net.push(true); }
      setTimeout(() => Quests.begin(), 600);
    });
  });
};
Game.toTitle = function () {
  this.save(true);
  S.foes.length = 0; S.tele.length = 0; S.proj.length = 0;
  if (S.scene === 'dungeon') { S.scene = 'world'; Dungeon.D = null; S.dun = null; }
  Bosses.current = null;
  UI.showTitle();
};
Game.fade = function (fn, text) {
  if (this.fading) return;
  this.fading = true;
  const f = $('#fade'); f.querySelector('.ft').textContent = text || '';
  f.classList.add('on');
  setTimeout(() => { try { fn(); } catch (e) { console.error(e); } setTimeout(() => { f.classList.remove('on'); this.fading = false; }, text ? 600 : 120); }, 320);
};
Game.regionMusic = function () {
  if (S.scene === 'dungeon') return 'dungeon';
  const t = World.townAt(P.x, P.y);
  if (t && t !== 'camp' && t !== 'landing') return 'town';
  const b = World.biomeAt(P.x, P.y);
  return { meadow: 'field', plains: 'field', forest: 'forest', coast: 'coast', snow: 'snow', desert: 'desert', spooky: 'spooky', isle: 'isle' }[b] || 'field';
};
Game.checkRegion = function (dt) {
  this.regionT -= dt; if (this.regionT > 0 || S.scene !== 'world') return;
  this.regionT = 0.5;
  const t = World.townAt(P.x, P.y), b = World.biomeAt(P.x, P.y);
  const key = t || b;
  if (key !== this.region) {
    const first = this.region == null;
    this.region = key;
    if (!first || true) UI.areaName(t ? TOWNS[t].name : BIOMES[b].name);
    Music.play(this.regionMusic());
  }
};

// coins and hearts on the ground
function updatePicks(dt) {
  for (let i = S.picks.length - 1; i >= 0; i--) {
    const p = S.picks[i];
    p.t += dt;
    if (p.t < p.delay) { p.x += p.vx * dt; p.z = Math.max(0, (p.z || 0) - p.vy * dt); p.vy += 600 * dt; if (p.z <= 0 && p.vy > 0) { p.vy = -p.vy * 0.3; } continue; }
    const a = angTo(p.x, p.y, P.x, P.y), d = dist(p.x, p.y, P.x, P.y), sp = 300 + p.t * 600;
    p.x += Math.cos(a) * Math.min(d, sp * dt); p.y += Math.sin(a) * Math.min(d, sp * dt); p.z = Math.max(0, (p.z || 0) - 200 * dt);
    if (d < 20) {
      S.picks.splice(i, 1);
      if (p.k === 'coin') { G.gold += p.val; Sfx.play('coin'); }
      else if (p.k === 'heart') { const h = Math.round(maxHp() * 0.15); G.hp = Math.min(maxHp(), G.hp + h); fxText(P.x, P.y - 50, '+' + h, '#7fe07a'); Sfx.play('belly'); }
    }
  }
}
function drawPick(c, p) {
  const y = p.y - (p.z || 0);
  softShadow(c, p.x, p.y + 1, 6 - (p.z || 0) * 0.05, 2.4, 0.22);
  if (p.k === 'coin') {
    // a spinning gold coin: the face narrows as it turns, with a rim, a stamped bone and a glint
    const sp = Math.cos(p.t * 6), w = Math.abs(sp) * 0.8 + 0.2;
    c.save(); c.translate(p.x, y - 9 + Math.sin(p.t * 3) * 1.5);
    c.beginPath(); c.ellipse(0, 0, 7.5 * w + 1.2, 7.5, 0, 0, TAU); c.fillStyle = OUT; c.fill();
    c.beginPath(); c.ellipse(0, 0, 6 * w + 0.6, 6, 0, 0, TAU); c.fillStyle = sp > 0 ? '#ffcf3f' : '#f2b330'; c.fill();
    c.beginPath(); c.ellipse(0, 0, 4.2 * w, 4.2, 0, 0, TAU); c.fillStyle = '#ffe58a'; c.fill();
    if (w > 0.5) { c.save(); c.scale(w, 1); c.fillStyle = '#e8a42c'; c.fillRect(-2.4, -0.7, 4.8, 1.4); circ(c, -2.6, -1, 1.1); c.fill(); circ(c, -2.6, 1, 1.1); c.fill(); circ(c, 2.6, -1, 1.1); c.fill(); circ(c, 2.6, 1, 1.1); c.fill(); c.restore(); }
    const gl = (p.t * 1.3) % 2.4;
    if (gl < 0.4) { const k = Math.sin((gl / 0.4) * Math.PI); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k; c.fillStyle = '#fffbe0'; c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.2 : 6; const a = (i / 8) * TAU; c.lineTo(3 + Math.cos(a) * r, -3 + Math.sin(a) * r); } c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    c.restore();
  } else {
    const b = 1 + Math.sin(p.t * 7) * 0.06;
    c.save(); c.translate(p.x, y - 10); c.scale(b, b);
    glow(c, 0, 0, 16, '#ff8fa8', 0.35);
    c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, -2, -5, -11, 0, -3); c.bezierCurveTo(5, -11, 12, -2, 0, 8);
    c.lineWidth = 3.2; c.strokeStyle = OUT; c.stroke(); c.fillStyle = '#ff6f8f'; c.fill();
    c.fillStyle = '#e04a6c'; c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(6, 2, 9, -2, 8.5, -5); c.bezierCurveTo(10, 0, 5, 4, 0, 8); c.fill();
    c.fillStyle = '#ffd0db'; c.beginPath(); c.ellipse(-4.5, -4, 2.2, 1.4, -0.6, 0, TAU); c.fill();
    c.restore();
  }
}

// ---------- the camera
function updateCamera(dt) {
  Cam.z = clamp(Math.min(SW, SH) / 480, 0.6, 2.8);
  let tx = P.x + Input.mx * 40, ty = P.y - 20 + Input.my * 30;
  if (Game.state === 'title') { Game.titleT = (Game.titleT || 0) + dt; tx = TOWNS.waggington.x + Math.cos(Game.titleT * 0.05) * 500; ty = TOWNS.waggington.y + Math.sin(Game.titleT * 0.04) * 300 - 60; }
  const k = Math.min(1, dt * 6);
  Cam.x += (tx - Cam.x) * k; Cam.y += (ty - Cam.y) * k;
  if (S.scene === 'dungeon' && Dungeon.D) {
    const R = Dungeon.room(), vw = SW / Cam.z, vh = SH / Cam.z;
    const inHall = P.x < R.x || P.x > R.x + R.w;
    if (!inHall) {
      Cam.x = R.w + 80 > vw ? clamp(Cam.x, R.x - 40 + vw / 2, R.x + R.w + 40 - vw / 2) : lerp(Cam.x, R.x + R.w / 2, k);
      Cam.y = R.h + 80 > vh ? clamp(Cam.y, R.y - 30 + vh / 2, R.y + R.h + 30 - vh / 2) : lerp(Cam.y, R.y + R.h / 2, k);
    }
  }
  if (S.scene === 'world') { const vw = SW / Cam.z / 2, vh = SH / Cam.z / 2; Cam.x = clamp(Cam.x, vw, WW - vw); Cam.y = clamp(Cam.y, vh, WH - vh); }
  Cam.shake = Math.max(0, Cam.shake - dt * 30);
}

// ---------- each frame
Game.update = function (dt) {
  S.time += dt;
  if (document.body.dataset.state !== this.state) document.body.dataset.state = this.state;
  switch (this.state) {
    case 'title': case 'story': case 'dead': updateNpcs(dt); Nav.update(); break;
    case 'dialog': Dialog.update(dt); updateFx(dt); break;
    case 'menu': case 'shop': Nav.update(); if (Input.hit.menu && Game.state === 'menu') UI.closePanel(); break;
    case 'play': {
      if (this.fading) break;
      if (Input.hit.menu) { UI.openMenu(); break; }
      if (Input.hit.map) { UI.openMenu('map'); break; }
      let wdt = dt * S.slowmo;
      if (S.hitstop > 0) { S.hitstop -= dt; wdt *= 0.08; }
      updateHero(wdt);
      updateFoes(wdt);
      updateTele(wdt);
      updateProj(wdt);
      updateFx(wdt);
      updatePicks(wdt);
      if (S.scene === 'world') { updateNpcs(wdt); Packs.update(wdt); Quests.checkGoto(); this.checkRegion(dt); }
      else Dungeon.update(wdt);
      Interact.find();
      UI.updateTouch();
      G.t += dt;
      this.saveT += dt;
      if (this.saveT > 30) { this.saveT = 0; this.save(); }
      break;
    }
  }
  updateCamera(dt);
};

Game.render = function (dt) {
  const c = ctx, t = S.time;
  this.frameN = (this.frameN || 0) + 1;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = true;
  const z = Cam.z * DPR, sx = (Math.random() - 0.5) * Cam.shake, sy = (Math.random() - 0.5) * Cam.shake;
  c.setTransform(z, 0, 0, z, Math.round((SW / 2 + sx - Cam.x * Cam.z) * DPR), Math.round((SH / 2 + sy - Cam.y * Cam.z) * DPR));
  c.lineJoin = 'round'; c.lineCap = 'round';
  const v = viewRect(60);
  const list = [];
  if (S.scene === 'world') {
    Ground.draw(c, t);
    // flat ground details
    for (let cy = Math.max(0, Math.floor(v.y0 / PC)); cy <= Math.min(PCH - 1, Math.floor(v.y1 / PC)); cy++) for (let cx = Math.max(0, Math.floor(v.x0 / PC)); cx <= Math.min(PCW - 1, Math.floor(v.x1 / PC)); cx++)
      for (const d of World.dgrid[cy * PCW + cx]) if (d.x > v.x0 && d.x < v.x1 && d.y > v.y0 && d.y < v.y1) drawSprite(c, decorSprite(d), d.x, d.y, 1);
    drawDocks(c, v);
    if (G) drawTreasure(c, v, t, list);
    // scenery
    const ps = World.propsIn(v.x0 - 150, v.y0 - 40, v.x1 + 150, v.y1 + 260, []);
    for (const p of ps) list.push({ y: p.y, p });
  } else Dungeon.drawFloor(c, t);
  if (Game.state !== 'title' && G) {
    drawTele(c);
    // soft shadows under everyone
    // soft contact shadows that shrink and fade when a body leaves the ground
    if (P.state !== 'dig') { const up = P.state === 'atk' && P.swingN === 2 ? Math.sin(clamp(P.st / (P.atkDur || 0.34), 0, 1) * Math.PI) : 0; softShadow(c, P.x, P.y + 1, 21 * (1 - up * 0.3), 7.5 * (1 - up * 0.3), 0.36 * (1 - up * 0.4)); }
    for (const f of S.foes) if (!f.gone) { const up = (f.hop || 0) / 60 + (f.fly ? 0.4 : 0); softShadow(c, f.x, f.y + 1, f.r * 1.45 * (1 - up * 0.3), f.r * 0.52 * (1 - up * 0.3), 0.34 * (1 - Math.min(0.6, up))); }
    for (const n of S.npcs) if (S.scene === 'world' && n.x > v.x0 && n.x < v.x1 && n.y > v.y0 && n.y < v.y1 + 40) { const sz = (BREEDS[n.def.breed] || {}).size || 1; softShadow(c, n.x, n.y + 1, 21 * sz, 7.5 * sz, 0.34); }
    list.push({ y: P.y, hero: 1 });
    for (const f of S.foes) if (!f.gone) list.push({ y: f.y, f });
    for (const p of S.proj) list.push({ y: p.y + (p.lob ? 1000 : 0), pr: p });
    for (const p of S.picks) list.push({ y: p.y, pk: p });
    if (S.scene === 'dungeon') Dungeon.sprites(list);
  }
  if (S.scene === 'world') for (const n of S.npcs) if (n.x > v.x0 - 40 && n.x < v.x1 + 40 && n.y > v.y0 - 40 && n.y < v.y1 + 120) list.push({ y: n.y, n });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.p) drawProp(c, it.p);
    else if (it.hero) drawHero(c);
    else if (it.f) drawFoe(c, it.f);
    else if (it.n) drawNpc(c, it.n);
    else if (it.pr) drawProj(c, it.pr);
    else if (it.pk) drawPick(c, it.pk);
    else if (it.draw) it.draw(c);
  }
  if (Game.state !== 'title' && G) {
    // Squeaky floats along behind the hero
    const sq = this.sq, k = Math.min(1, dt * 4);
    sq.x += (P.x - P.face * 30 - sq.x) * k; sq.y += (P.y - 58 - sq.y) * k;
    if (P.state !== 'dead') drawSqueaky(c, sq.x, sq.y, t, Dialog.open && Dialog.speaker === 'squeaky');
    for (const f of S.foes) if (!f.gone) drawFoeBar(c, f);
    drawFx(c);
    drawNums(c);
    drawPointer(c);
    drawPrompt(c);
  }
  if (S.scene === 'world') Clouds.draw(c, dt);
  if (Game.state === 'title') drawTitleArt(c, dt, t);
  if (Game.state !== 'title' && Game.state !== 'boot' && G && this.state !== 'story') HUD.draw(c);
};
// ---------- title key art: sunburst, vignette, drifting petals, and the hero striking a pose
const TitleArt = { anim: null, petals: [], breed: null };
function drawTitleArt(c, dt, t) {
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = SW / 2, ly = SH / 2 - Math.min(60, SH * 0.08), R = Math.hypot(SW, SH);
  // warm wash so the logo reads, then the sunburst
  const wash = c.createRadialGradient(cx, ly, 0, cx, ly, R * 0.6);
  wash.addColorStop(0, 'rgba(255,236,170,0.32)'); wash.addColorStop(0.45, 'rgba(255,214,140,0.1)'); wash.addColorStop(1, 'rgba(255,214,140,0)');
  c.fillStyle = wash; c.fillRect(0, 0, SW, SH);
  c.save(); c.translate(cx, ly); c.rotate(t * 0.04);
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, w = (TAU / n) * 0.32;
    const g = c.createLinearGradient(0, 0, Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7);
    g.addColorStop(0, 'rgba(255,250,220,0.3)'); g.addColorStop(0.7, 'rgba(255,250,220,0.06)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a - w, a + w); c.closePath(); c.fill();
  }
  c.restore();
  // plum vignette at the edges
  const vg = c.createRadialGradient(cx, SH * 0.48, Math.min(SW, SH) * 0.35, cx, SH * 0.48, R * 0.62);
  vg.addColorStop(0, 'rgba(59,34,53,0)'); vg.addColorStop(1, 'rgba(59,34,53,0.42)');
  c.fillStyle = vg; c.fillRect(0, 0, SW, SH);
  // petals and leaves on the breeze
  const P2 = TitleArt.petals;
  while (P2.length < 26) P2.push({ x: rand(-SW * 0.2, SW), y: rand(-40, SH), vx: rand(30, 70), vy: rand(14, 40), r: rand(0, TAU), vr: rand(-2, 2), s: rand(3, 6), col: pick(['#ffb3c7', '#ffffff', '#ffd84d', '#9fd66a', '#ff9e7a']), ph: rand(0, 6) });
  for (const q of P2) {
    q.x += (q.vx + Math.sin(t * 1.3 + q.ph) * 20) * dt; q.y += q.vy * dt; q.r += q.vr * dt;
    if (q.x > SW + 20 || q.y > SH + 20) { q.x = rand(-SW * 0.3, SW * 0.6); q.y = -20; }
    c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + q.ph)));
    c.fillStyle = q.col; c.beginPath(); c.ellipse(0, 0, q.s, q.s * 0.55, 0, 0, TAU); c.fill(); c.restore();
  }
  // the hero, big, wagging with a stick, Squeaky glowing alongside
  if (!TitleArt.anim) { TitleArt.anim = newAnim(); const sv = Game.localSave(); TitleArt.breed = (sv && sv.hero && BREEDS[sv.hero.breed]) ? sv.hero.breed : 'corgi'; }
  const wide = SW > SH * 1.1, sc = clamp(Math.min(SH, SW * 1.25) / 260, 1.3, 3.4);
  const hx = wide ? cx - Math.min(SW * 0.34, 470) : cx - SW * 0.2, hy = SH - (wide ? 34 : 40);
  softShadow(c, hx, hy + 2, 30 * sc, 9 * sc, 0.4);
  drawDog(c, hx, hy, BREEDS[TitleArt.breed] || BREEDS.corgi, { face: 1, t, anim: TitleArt.anim, sc, item: 'stick', collar: '#e8475f', hat: 'bandana', happy: Math.sin(t * 0.7) > 0.6, wagFast: 1, look: -0.4 });
  c.save(); c.translate(hx + 34 * sc, hy - 62 * sc); c.scale(sc * 0.75, sc * 0.75); drawSqueaky(c, 0, 0, t, false); c.restore();
}
function drawProp(c, p) {
  if (p.gone) return;
  if (p.kind === 'bld') {
    const s = bldSprite(p), d = BLD[p.bk];
    const hide = P.y < p.y - 8 && P.y > p.y - d.oy * 0.9 && Math.abs(P.x - p.x) < d.w * 0.42 && Game.state !== 'title';
    if (hide) c.globalAlpha = 0.55;
    drawBld(c, p); // ART-TOWN: baked building plus its live touches (smoke, flags, glow)
    c.globalAlpha = 1;
    return;
  }
  if (!p.b) p.b = World.biomeAt(p.x, p.y);
  const s = propSprite(p, p.b);
  const tall = s.oy * p.s;
  const hide = Game.state !== 'title' && tall > 50 && P.y < p.y - 6 && P.y > p.y - tall * 0.95 && Math.abs(P.x - p.x) < s.w * p.s * 0.38;
  if (hide) c.globalAlpha = 0.5;
  drawSprite(c, s, p.x, p.y, p.s);
  c.globalAlpha = 1;
}
function drawDocks(c, v) {
  for (const dk of [World.dock, World.dock2]) {
    if (!dk || dk.x < v.x0 - 300 || dk.x > v.x1 + 300 || dk.y < v.y0 - 100 || dk.y > v.y1 + 100) continue;
    const dir = dk.to === 'isle' ? 1 : -1;
    c.fillStyle = '#b88752'; c.strokeStyle = OUT; c.lineWidth = 2.5;
    c.beginPath(); rrect(c, dir > 0 ? dk.x - 20 : dk.x - 150, dk.y - 18, 170, 36, 6); c.fill(); c.stroke();
    c.strokeStyle = '#94683d'; c.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) { const x = (dir > 0 ? dk.x - 20 : dk.x - 150) + 10 + i * 18; c.beginPath(); c.moveTo(x, dk.y - 16); c.lineTo(x, dk.y + 16); c.stroke(); }
  }
}

// ---------- start up
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  try {
    Input.update();
    Game.update(dt);
    Game.render(dt);
  } catch (e) { console.error(e); if (!Game.errShown) { Game.errShown = 1; UI.toast('Oops, something went wrong: ' + e.message); } }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && G && Game.state !== 'title') Game.save(true); });
window.addEventListener('pagehide', () => { if (G && Game.state !== 'title') Game.save(true); });
function boot() {
  World.init();
  World.placeTreasure();
  Clouds.init();
  Packs.init();
  makeNpcs();
  Cam.x = TOWNS.waggington.x; Cam.y = TOWNS.waggington.y; Cam.z = clamp(Math.min(SW, SH) / 480, 0.6, 2.8);
  UI.applyTouchSetting();
  if (matchMedia('(pointer: coarse)').matches) { document.body.classList.add('touchy'); Input.mode = 'touch'; }
  UI.showTitle();
  Net.init();
  requestAnimationFrame(frame);
}
Object.defineProperty(DQ, 'G', { get() { return G; }, set(v) { G = v; } });
Object.assign(DQ, { P, S, Cam, World, Game, Quests, Dungeon, Bosses, UI, Dialog, Input, Interact, Net, Packs, Fog, TOWNS, MAIN, SIDE, BOUNTIES, NPCS, DUNGEON_SPOTS, makeFoe, addFoe, giveItem, giveXp, heroHurt, useTrick, heroSwing, MapView, Music, maxHp, Nav });
// wait for the font so canvas text looks right, but never longer than a moment
(document.fonts && document.fonts.load ? Promise.race([document.fonts.load('700 20px Fredoka'), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()).then(boot, boot);
