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
  if (p.k === 'coin') { c.save(); c.translate(p.x, y - 8); c.scale(Math.abs(Math.cos(p.t * 8)) * 0.7 + 0.3, 1); circ(c, 0, 0, 6); fo(c, '#ffd84d', 2); c.restore(); }
  else { c.fillStyle = '#ff6f8f'; c.save(); c.translate(p.x, y - 10); c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, -2, -5, -11, 0, -3); c.bezierCurveTo(5, -11, 12, -2, 0, 8); c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); c.restore(); }
}

// ---------- the camera
function updateCamera(dt) {
  Cam.z = clamp(Math.min(SW, SH) / 560, 0.55, 2.6);
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
    c.fillStyle = 'rgba(40,25,60,0.2)';
    if (P.state !== 'dig') { ell(c, P.x, P.y, 15, 5); c.fill(); }
    for (const f of S.foes) if (!f.gone) { ell(c, f.x, f.y, f.r * 1.05, f.r * 0.38); c.fill(); }
    for (const n of S.npcs) if (S.scene === 'world' && n.x > v.x0 && n.x < v.x1 && n.y > v.y0 && n.y < v.y1 + 40) { ell(c, n.x, n.y, 15 * ((BREEDS[n.def.breed] || {}).size || 1), 5); c.fill(); }
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
  if (Game.state !== 'title' && Game.state !== 'boot' && G && this.state !== 'story') HUD.draw(c);
};
function drawProp(c, p) {
  if (p.gone) return;
  if (p.kind === 'bld') {
    const s = bldSprite(p), d = BLD[p.bk];
    const hide = P.y < p.y - 8 && P.y > p.y - d.oy * 0.9 && Math.abs(P.x - p.x) < d.w * 0.42 && Game.state !== 'title';
    if (hide) c.globalAlpha = 0.55;
    drawSprite(c, s, p.x, p.y, 1);
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
  Cam.x = TOWNS.waggington.x; Cam.y = TOWNS.waggington.y; Cam.z = clamp(Math.min(SW, SH) / 560, 0.55, 2.6);
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
