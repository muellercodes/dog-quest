// The interface: dialogue, menus, shops, screens and the HUD.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nm = (s) => String(s).replace(/\{name\}/g, G ? G.hero.name : 'pup');
const UI = { area: null, areaT: 0, woofFlash: 0, menu: { tab: 'gear', slot: 'mouth' } };

// ---------- little messages
UI.toast = function (msg, kind) {
  const box = $('#toasts');
  const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.textContent = nm(msg);
  box.appendChild(el);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3000);
};
UI.banner = function (a, b) {
  const el = $('#banner'); el.querySelector('.b1').textContent = a; el.querySelector('.b2').textContent = b || '';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
};
UI.areaName = function (name) { this.area = name; this.areaT = 3; };
UI.flashWoof = function () { this.woofFlash = 0.6; };
UI.controlsHint = function () {
  const m = document.body.classList.contains('touchy') ? 'touch' : Input.mode;
  const t = m === 'touch' ? 'Drag on the left to move. Tap the paw button to swing, and Roll to dodge the red areas!' :
    m === 'pad' ? 'Left stick to move, A to swing, B to roll out of the red areas. X, Y, LB and RB use tricks.' :
      'WASD or arrows to move, J or Space to swing, K or Shift to roll out of red areas. 1 to 4 use tricks. Tab opens the menu.';
  setTimeout(() => UI.toast(t, 'goal'), 400);
};

// ---------- dialogue
const Dialog = { open: false, lines: [], i: 0, shown: 0, done: null, choices: null, speaker: null };
Dialog.play = function (lines, done) { this.ask(lines, null, done); };
Dialog.ask = function (lines, choices, done) {
  if (this.open) { const prev = this.done; this.lines = this.lines.concat(lines); if (choices) this.choices = choices; this.done = () => { prev && prev(); done && done(); }; return; }
  this.open = true; this.lines = lines; this.i = 0; this.choices = choices; this.done = done || null;
  Game.state = 'dialog'; Input.clear();
  $('#dialog').classList.remove('hidden');
  this.show();
};
Dialog.show = function () {
  const [who, text] = this.lines[this.i];
  this.speaker = who; this.full = nm(text); this.shown = 0; this.tBlip = 0;
  const box = $('#dialog .dbox');
  const nameOf = who === 'hero' ? G.hero.name : NPCS[who] ? NPCS[who].name : SPEAKERS[who] != null ? nm(SPEAKERS[who]) : who;
  box.querySelector('.dname').textContent = nameOf || '';
  box.classList.toggle('noport', who === 'narrator' || who === 'sign');
  drawPortrait($('#portrait'), who);
  box.querySelector('.dtext').textContent = '';
  box.querySelector('.dchoices').innerHTML = '';
  box.querySelector('.dnext').style.visibility = 'hidden';
};
Dialog.update = function (dt) {
  if (!this.open) return;
  if (this.shown < this.full.length) {
    this.shown = Math.min(this.full.length, this.shown + dt * 52);
    $('#dialog .dtext').textContent = this.full.slice(0, Math.floor(this.shown));
    this.tBlip -= dt; if (this.tBlip <= 0) { this.tBlip = 0.07; Sfx.play('talk'); }
    if (this.shown >= this.full.length) this.finishLine();
  }
  if (this.choicesShown) { Nav.update(); return; }
  if (Input.hit.atk || Input.hit.act || Input.hit.roll) this.next();
};
Dialog.finishLine = function () {
  this.shown = this.full.length;
  $('#dialog .dtext').textContent = this.full;
  const last = this.i >= this.lines.length - 1;
  if (last && this.choices) {
    const box = $('#dialog .dchoices');
    box.innerHTML = this.choices.map((c, i) => `<button class="btn nav ${i === 0 ? 'gold' : ''}" data-ci="${i}">${esc(c.label)}</button>`).join('');
    this.choicesShown = true;
    Nav.set($('#dialog'), () => this.pick(this.choices.length - 1));
  } else $('#dialog .dnext').style.visibility = 'visible';
};
Dialog.next = function () {
  if (this.shown < this.full.length) { this.finishLine(); return; }
  if (this.choices && this.i >= this.lines.length - 1) return;
  this.i++;
  if (this.i >= this.lines.length) return this.close();
  this.show();
};
Dialog.pick = function (i) { const c = this.choices[i]; this.choices = null; this.close(); c && c.fn && c.fn(); };
Dialog.close = function () {
  this.open = false; this.choicesShown = false; this.speaker = null;
  $('#dialog').classList.add('hidden'); Nav.clear();
  if (Game.state === 'dialog') Game.state = 'play';
  Input.clear();
  const d = this.done; this.done = null; d && d();
};
$('#dialog').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ci]');
  if (b) { Dialog.pick(+b.dataset.ci); return; }
  if (!Dialog.choicesShown) Dialog.next();
});

function drawPortrait(cv2, who) {
  const g = cv2.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv2.width, cv2.height);
  const W = cv2.width;
  g.fillStyle = '#ffe6a8'; g.fillRect(0, 0, W, W);
  g.fillStyle = '#ffd47a'; circ(g, W / 2, W * 0.95, W * 0.55); g.fill();
  g.lineJoin = 'round'; g.lineCap = 'round';
  const t = S.time;
  if (who === 'squeaky') { g.save(); g.translate(W / 2, W / 2); g.scale(5, 5); drawSqueaky(g, 0, 0, t, true); g.restore(); return; }
  let L = null, hat = null, item = null;
  if (who === 'hero') { L = heroLook(); hat = G.eq.head ? ITEMS[G.eq.head].art : null; }
  else if (NPCS[who]) { L = BREEDS[NPCS[who].breed]; hat = NPCS[who].hat; }
  if (L) {
    const k = 3.6, s = L.size || 1, bl = L.bodyLen || 1, ll = L.legLen || 1;
    const hx = (13 * bl + 1) * k * s, hy = (-12 * ll - 20) * k * s;
    g.save(); g.translate(W / 2 - hx, W / 2 - hy + 14);
    drawDog(g, 0, 0, L, { face: 1, t, sc: k, hat, item, talk: true, collar: who === 'hero' ? '#e8475f' : '#4f7fd9' });
    g.restore(); return;
  }
  const cat = { nutsworth: 'nutsworth', whiskers: 'whiskers', snowball: 'snowball', cleocatra: 'cleocatra', mittens: 'mittens' }[who];
  if (cat) {
    const k = 3.4, S2 = CRITTERS[cat], sq = S2.kind === 'squirrel';
    const hx = (sq ? 7 : 14) * k, hy = (sq ? -25 : -31) * k;
    g.save(); g.translate(W / 2 - hx, W / 2 - hy + 14); drawCritter(g, 0, 0, S2, { face: 1, t, sc: k }); g.restore();
  }
}

// ---------- focus for keyboards and controllers in menus
const Nav = { layer: null, el: null, back: null, tabs: null };
Nav.set = function (layer, back, tabs) { this.layer = layer; this.back = back; this.tabs = tabs; this.el = null; this.pickFirst(); };
Nav.clear = function () { if (this.el) this.el.classList.remove('focus'); this.layer = null; this.el = null; this.back = null; this.tabs = null; };
Nav.items = function () { if (!this.layer) return []; return Array.from(this.layer.querySelectorAll('.nav')).filter((e) => !e.disabled && e.offsetParent !== null); };
Nav.pickFirst = function () { const it = this.items(); this.focus(it.find((e) => e.classList.contains('gold')) || it[0]); };
Nav.focus = function (el) {
  if (this.el) this.el.classList.remove('focus');
  this.el = el || null;
  if (el && (Input.mode === 'pad' || Input.mode === 'kb')) { el.classList.add('focus'); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
};
Nav.move = function (dx, dy) {
  const it = this.items(); if (!it.length) return;
  if (!this.el || !it.includes(this.el)) return this.focus(it[0]);
  const a = this.el.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bs = 1e9;
  for (const e of it) {
    if (e === this.el) continue;
    const b = e.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const ddx = bx - ax, ddy = by - ay;
    const along = ddx * dx + ddy * dy; if (along <= 4) continue;
    const across = Math.abs(ddx * dy) + Math.abs(ddy * dx);
    const sc = along + across * 2.2;
    if (sc < bs) { bs = sc; best = e; }
  }
  if (best) { this.focus(best); Sfx.play('ui'); }
};
Nav.update = function () {
  if (!this.layer) return;
  const H = Input.hit;
  if (H.up) this.move(0, -1); if (H.down) this.move(0, 1); if (H.left) this.move(-1, 0); if (H.right) this.move(1, 0);
  if ((H.atk || H.act) && this.el) { if (!this.el.classList.contains('focus')) this.focus(this.el); this.el.click(); }
  if ((H.roll || H.back || H.menu) && this.back) this.back();
  if (this.tabs && (H.lb || H.rb)) this.tabs(H.lb ? -1 : 1);
  if (H.map && this.mapKey) this.mapKey();
};

// ---------- icons
function itemIcon(id, size) {
  const c = mkCanvas(size * 2, size * 2), g = c.getContext('2d'); g.scale(2, 2); g.lineJoin = 'round'; g.lineCap = 'round';
  const it = ITEMS[id] || QITEMS[id];
  g.translate(size / 2, size / 2);
  if (!it) return c;
  if (it.slot === 'mouth') { g.scale(size / 34, size / 34); drawMouthItem(g, it.art, -10, 2); }
  else if (it.slot === 'head') { g.scale(size / 30, size / 30); g.translate(0, 8); drawHat(g, it.art, 0, 0); }
  else if (it.slot === 'body') {
    g.scale(size / 40, size / 40);
    if (it.coat || it.cape) { g.beginPath(); g.moveTo(-14, -6); g.quadraticCurveTo(0, -16, 14, -6); g.lineTo(12, 12); g.quadraticCurveTo(0, 16, -12, 12); g.closePath(); fo(g, it.cape || it.coat, 2.4); if (it.cape && it.coat !== it.cape) { g.fillStyle = it.coat || it.art; } }
    else { g.beginPath(); g.ellipse(0, 0, 14, 10, 0, 0, TAU); g.lineWidth = 10; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 6; g.strokeStyle = it.art; g.stroke(); circ(g, 0, 11, 4); fo(g, '#ffd84d', 2); if (id === 'spiked') { g.fillStyle = '#c9ccd9'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 16, Math.sin(a) * 12); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 17); g.lineTo(Math.cos(a + 0.2) * 16, Math.sin(a + 0.2) * 12); g.fill(); } } }
  } else { g.scale(size / 36, size / 36); drawQItem(g, 0, 16, id, 0); }
  return c;
}
function drawTrickIcon(g, id, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s / 40, s / 40); g.lineJoin = 'round'; g.lineCap = 'round';
  switch (id) {
    case 'bark': for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-12, 0, 8 + i * 8, -0.8, 0.8); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#ffd84d'; g.stroke(); } break;
    case 'fetch': circ(g, 0, 0, 13); fo(g, '#c9e84a', 3); g.beginPath(); g.arc(-6, 0, 13, -0.9, 0.9); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke(); break;
    case 'belly': g.fillStyle = '#ff6f8f'; g.beginPath(); g.moveTo(0, 13); g.bezierCurveTo(-20, -2, -8, -18, 0, -6); g.bezierCurveTo(8, -18, 20, -2, 0, 13); g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); break;
    case 'zoom': g.beginPath(); g.moveTo(4, -16); g.lineTo(-8, 2); g.lineTo(1, 2); g.lineTo(-4, 16); g.lineTo(10, -4); g.lineTo(1, -4); g.closePath(); fo(g, '#7fd0ff', 3); g.strokeStyle = OUT; g.lineWidth = 3; for (const yy of [-8, 0, 8]) { g.beginPath(); g.moveTo(-18, yy); g.lineTo(-12, yy); g.stroke(); } break;
    case 'howl': g.beginPath(); g.arc(0, 0, 14, 0.6, Math.PI * 2 - 0.6); g.arc(7, -3, 10, Math.PI * 2 - 1.0, 1.0, true); g.closePath(); fo(g, '#e8e0ff', 3); break;
    case 'dig': g.beginPath(); g.moveTo(-16, 12); g.quadraticCurveTo(0, -12, 16, 12); g.closePath(); fo(g, '#a87a50', 3); g.beginPath(); g.moveTo(4, -16); g.lineTo(-2, 4); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2.5; g.strokeStyle = '#c9ccd9'; g.stroke(); break;
  }
  g.restore();
}
function trickIconCanvas(id, size) { const c = mkCanvas(size * 2, size * 2), g = c.getContext('2d'); g.scale(2, 2); drawTrickIcon(g, id, size / 2, size / 2, size * 0.9); return c; }
function statLine(id, lv, cmp) {
  const out = [];
  for (const [k, lab] of [['atk', 'ATK'], ['mag', 'MAG'], ['def', 'DEF'], ['hp', 'HP']]) {
    const v = itemStat(id, lv, k); if (!v && !(cmp && itemStat(cmp, G.items[cmp], k))) continue;
    let cls = '';
    if (cmp !== undefined && cmp !== id) { const o = cmp ? itemStat(cmp, G.items[cmp], k) : 0; cls = v > o ? 'up' : v < o ? 'down' : ''; }
    out.push(`<span class="st ${cls}">${lab} ${v}</span>`);
  }
  if (ITEMS[id].spd) out.push('<span class="st">SPEED +10%</span>');
  if (ITEMS[id].regen) out.push('<span class="st">REGEN</span>');
  return out.join('');
}

// ---------- the big menu
UI.openMenu = function (tab) {
  if (Game.state !== 'play' && Game.state !== 'menu') return;
  Game.state = 'menu'; Input.clear();
  this.menu.tab = tab || this.menu.tab || 'gear';
  this.renderMenu();
  Sfx.play('ui');
};
UI.closePanel = function () {
  $('#panel').classList.add('hidden'); $('#panel').innerHTML = ''; Nav.clear();
  if (Game.state === 'menu' || Game.state === 'shop') Game.state = 'play';
  Input.clear(); Game.save();
};
const TABS = [['gear', 'Gear'], ['tricks', 'Tricks'], ['quests', 'Quests'], ['map', 'Map'], ['settings', 'Settings']];
UI.renderMenu = function () {
  const tabs = TABS.concat(Net.enabled ? [['account', 'Account']] : []);
  const m = this.menu;
  const body = { gear: () => this.gearTab(), tricks: () => this.tricksTab(), quests: () => this.questsTab(), map: () => '<div class="mapwrap"><canvas id="mapcv"></canvas></div>', settings: () => this.settingsTab(), account: () => Net.accountTab() }[m.tab]();
  $('#panel').innerHTML = `<div class="menu paper">
    <div class="mhead">${tabs.map(([k, l]) => `<button class="tab nav ${k === m.tab ? 'on' : ''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}
      <div class="gold"><span class="coin"></span>${fmt(G.gold)}</div></div>
    <div class="mbody">${body}</div>
    <div class="mfoot"><span class="hint" style="margin-right:auto;align-self:center">${Quests.chapter()} &middot; ${fmt(G.t / 60)} min played</span>
      <button class="btn small nav" data-act="quit">Save and quit</button><button class="btn small gold nav" data-act="close">Back to game</button></div></div>`;
  $('#panel').classList.remove('hidden');
  this.fillCanvases();
  Nav.set($('#panel'), () => this.closePanel(), (d) => { const i = tabs.findIndex((t) => t[0] === m.tab); m.tab = tabs[(i + d + tabs.length) % tabs.length][0]; this.renderMenu(); });
  Nav.mapKey = () => this.closePanel();
  // keep focus on the active tab after re-render
  const on = $('#panel .tab.on'); if (on && this.focusTab) { Nav.focus(on); this.focusTab = false; }
  if (m.tab === 'map') requestAnimationFrame(() => MapView.draw($('#mapcv')));
};
UI.fillCanvases = function () {
  for (const el of document.querySelectorAll('#panel canvas[data-icon]')) { const src = el.dataset.icon.startsWith('t:') ? trickIconCanvas(el.dataset.icon.slice(2), 56) : itemIcon(el.dataset.icon, 56); el.width = src.width; el.height = src.height; el.getContext('2d').drawImage(src, 0, 0); }
  const hv = $('#herocv'); if (hv) { const g = hv.getContext('2d'); hv.width = 240; hv.height = 200; g.fillStyle = '#ffe6a8'; g.fillRect(0, 0, 240, 200); g.fillStyle = 'rgba(40,25,60,0.2)'; ell(g, 120, 168, 50, 12); g.fill(); g.lineJoin = 'round'; g.lineCap = 'round'; const body = ITEMS[G.eq.body] || {}; const st = { face: 1, t: S.time, sc: 2.6, hat: G.eq.head ? ITEMS[G.eq.head].art : null, item: G.eq.mouth ? ITEMS[G.eq.mouth].art : null, collar: body.art && body.art[0] === '#' ? body.art : '#e8475f', coat: body.coat, cape: body.cape }; st.anim = UI.heroAnim || (UI.heroAnim = newAnim()); st.happy = 1; drawDog(g, 110, 168, heroLook(), st); }
};
UI.gearTab = function () {
  const m = this.menu, slot = m.slot;
  const owned = Object.keys(G.items).filter((id) => ITEMS[id] && ITEMS[id].slot === slot);
  const slotCard = (s) => { const id = G.eq[s]; return `<div class="card nav ${s === slot ? 'on' : ''}" data-act="slot" data-v="${s}"><canvas data-icon="${id || ''}"></canvas><div><div class="t2">${SLOTS[s]}</div><div class="t1">${id ? esc(ITEMS[id].name) + ' <small>Lv' + G.items[id] + '</small>' : 'Nothing'}</div></div></div>`; };
  return `<div class="split"><div class="left">
      <canvas id="herocv" style="width:100%;height:170px;border:3px solid var(--plum);border-radius:16px"></canvas>
      <div class="stats"><span class="st">Lv ${G.lv}</span><span class="st">HP ${maxHp()}</span><span class="st">ATK ${heroAtk()}</span><span class="st">MAG ${heroMag()}</span><span class="st">DEF ${heroDef()}</span></div>
      <div class="hint">XP ${fmt(G.xp)} / ${fmt(xpNeed(G.lv))}</div>
      ${['mouth', 'head', 'body'].map(slotCard).join('')}
    </div><div class="right"><h3>${SLOTS[slot]}</h3><div class="grid">
      ${owned.length ? owned.map((id) => `<div class="card nav ${G.eq[slot] === id ? 'on' : ''}" data-act="equip" data-v="${id}">${G.eq[slot] === id ? '<span class="tag">ON</span>' : ''}<canvas data-icon="${id}"></canvas><div><div class="t1">${esc(ITEMS[id].name)} <small>Lv${G.items[id]}</small></div><div class="stats">${statLine(id, G.items[id], G.eq[slot] || null)}</div><div class="t2">${esc(ITEMS[id].desc || '')}</div></div></div>`).join('') : '<p>Nothing here yet. Find gear in chests, dig spots and shops. Finding the same gear again levels it up!</p>'}
      ${slot === 'head' && G.eq.head ? '<div class="card nav" data-act="unequip" data-v="head"><div><div class="t1">Take off hat</div><div class="t2">Go bare-headed</div></div></div>' : ''}
    </div></div></div>`;
};
UI.tricksTab = function () {
  const keys = Input.mode === 'pad' ? ['X', 'Y', 'LB', 'RB'] : ['1', '2', '3', '4'];
  const where = { bark: 'Waggington', fetch: 'Barkingham', belly: 'Barkingham', zoom: 'Fetchwick', howl: 'Frostpaw', dig: 'Dunehound Oasis' };
  return `<h3>Trick slots</h3><div class="row">${G.slots.map((id, i) => `<div class="card" style="min-width:150px"><canvas data-icon="${id ? 't:' + id : ''}"></canvas><div><div class="t2">Slot ${i + 1} (${keys[i]})</div><div class="t1">${id ? TRICKS[id].name : 'Empty'}</div></div></div>`).join('')}</div>
    <h3>Your tricks</h3><div class="grid">${Object.keys(TRICKS).map((id) => {
      const lv = G.tricks[id], T = TRICKS[id];
      if (!lv) return `<div class="card dim"><canvas data-icon="t:${id}"></canvas><div><div class="t1">${T.name}</div><div class="t2">Learn it in ${where[id]}</div></div></div>`;
      return `<div class="card" style="flex-direction:column;align-items:stretch"><div style="display:flex;gap:10px;align-items:center"><canvas data-icon="t:${id}"></canvas><div><div class="t1">${T.name} <small>Lv${lv}</small></div><div class="t2">${T.desc} Costs ${T.cost} Woof.</div></div></div>
        <div class="row" style="margin:6px 0 0">${[0, 1, 2, 3].map((i) => `<button class="btn small nav ${G.slots[i] === id ? 'gold' : ''}" data-act="slotTrick" data-v="${id}" data-i="${i}">${keys[i]}</button>`).join('')}</div></div>`;
    }).join('')}</div>`;
};
UI.questsTab = function () {
  const tr = G.track || 'main';
  const s = Quests.step();
  let h = `<div class="qrow nav ${tr === 'main' ? 'on' : ''}" data-act="track" data-v="main"><div class="t2">${Quests.chapter()}</div><div class="t1">The Golden Ball</div><div class="t2">${s ? esc(s.text) : 'Barkadia is saved! Keep exploring.'} &middot; Golden Pieces: ${G.pieces}/4</div></div>`;
  const act = Object.keys(G.side).filter((id) => G.side[id].s !== 'done');
  const done = Object.keys(G.side).filter((id) => G.side[id].s === 'done');
  if (act.length) h += '<h3>Side quests</h3>' + act.map((id) => { const d = SIDE[id], q = G.side[id]; const n = d.n || (d.npcs && d.npcs.length); return `<div class="qrow nav ${tr === id ? 'on' : ''}" data-act="track" data-v="${id}"><div class="t1">${esc(d.title)} ${q.s === 'ready' ? '(done!)' : ''}</div><div class="t2">${q.s === 'ready' ? 'Go see ' + NPCS[d.giver].name : esc(d.text) + (n ? ` (${q.n}/${n})` : '')}</div></div>`; }).join('');
  const bs = Object.keys(G.bounty).filter((id) => G.bounty[id] === 'active');
  if (bs.length) h += '<h3>Bounties</h3>' + bs.map((id) => `<div class="qrow nav ${tr === id ? 'on' : ''}" data-act="track" data-v="${id}"><div class="t1">${esc(BOUNTIES[id].title)}</div><div class="t2">${esc(BOUNTIES[id].desc)}</div></div>`).join('');
  h += `<p class="hint">Tap a quest to follow it with the arrow. Look for <b>!</b> over folk who need help. Done: ${done.length} side quests, ${Object.values(G.bounty).filter((v) => v === 'done').length} bounties, ${Object.keys(G.digs).length} treasures dug up.</p>`;
  return h;
};
UI.settingsTab = function () {
  const sl = (k, l) => `<div class="row"><label>${l}</label><input type="range" min="0" max="1" step="0.05" value="${SET[k]}" data-set="${k}"></div>`;
  const tog = (k, l, opts) => `<div class="row"><label>${l}</label>${opts.map(([v, t]) => `<button class="btn small nav ${String(SET[k]) === String(v) ? 'gold' : ''}" data-act="setv" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
  return `<h3>Sound</h3>${sl('music', 'Music')}${sl('sfx', 'Sounds')}
    <h3>Game</h3><div class="row"><label>Difficulty</label>${DIFF.map((d, i) => `<button class="btn small nav ${G.diff === i ? 'gold' : ''}" data-act="diff" data-v="${i}">${d.name}</button>`).join('')}</div>
    ${tog('shake', 'Screen shake', [[1, 'On'], [0, 'Off']])}${tog('nums', 'Damage numbers', [[1, 'On'], [0, 'Off']])}${tog('touch', 'Touch buttons', [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']])}
    <h3>Controls</h3><p><b>Keyboard:</b> WASD or arrows to move. J or Space to swing. K or Shift to roll. 1 to 4 for tricks. E to talk. M for the map. Tab or Esc for this menu.</p>
    <p><b>Controller:</b> left stick to move. A to swing or talk. B to roll. X, Y, LB and RB for tricks. Start for the menu, Back for the map.</p>
    <p><b>Touch:</b> drag on the left side to move. Tap the paw to swing. Roll to dodge.</p>
    <p class="hint">Red areas on the ground show where an attack is about to land. Roll out of them! Swinging at foes fills your Woof for tricks.</p>
    <p class="hint">Dog Quest v${VERSION}. Story and art &copy; 2026 Andrew Mueller.</p>`;
};
UI.equip = function (id) {
  const it = ITEMS[id]; G.eq[it.slot] = id; G.hp = Math.min(G.hp, maxHp()); Sfx.play('ui'); this.renderMenu();
};
// clicks inside panels
$('#panel').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const v = b.dataset.v, m = UI.menu;
  switch (b.dataset.act) {
    case 'tab': m.tab = v; UI.focusTab = true; UI.renderMenu(); break;
    case 'close': UI.closePanel(); break;
    case 'quit': UI.closePanel(); Game.toTitle(); break;
    case 'slot': m.slot = v; UI.renderMenu(); break;
    case 'equip': UI.equip(v); break;
    case 'unequip': G.eq[v] = null; G.hp = Math.min(G.hp, maxHp()); UI.renderMenu(); break;
    case 'slotTrick': { const i = +b.dataset.i; const old = G.slots.indexOf(v); if (old >= 0) G.slots[old] = G.slots[i]; G.slots[i] = v; Sfx.play('ui'); UI.renderMenu(); break; }
    case 'track': G.track = v; Sfx.play('ui'); UI.renderMenu(); break;
    case 'diff': G.diff = +v; UI.renderMenu(); break;
    case 'setv': SET[b.dataset.k] = isNaN(+v) ? v : +v; saveSettings(); UI.applyTouchSetting(); UI.renderMenu(); break;
    case 'buy': UI.buy(v); break;
    case 'learn': UI.learn(v); break;
    case 'bounty': G.bounty[v] = 'active'; G.track = v; UI.toast('Bounty accepted: ' + BOUNTIES[v].name, 'goal'); Sfx.play('quest'); UI.openBoard(UI.boardTown); break;
    default: if (Net.click(b)) return;
  }
});
$('#panel').addEventListener('input', (e) => { const k = e.target.dataset.set; if (k) { SET[k] = +e.target.value; saveSettings(); audioVolumes(); } });
UI.applyTouchSetting = function () { document.body.classList.toggle('touchon', SET.touch === 'on'); document.body.classList.toggle('touchoff', SET.touch === 'off'); };

// ---------- shops, trainers and boards
UI.openShop = function (town) {
  Game.state = 'shop'; Input.clear(); this.shopTown = town;
  const list = SHOPS[town] || [];
  const npc = Object.keys(NPCS).find((k) => NPCS[k].town === town && NPCS[k].role === 'smith');
  $('#panel').innerHTML = `<div class="menu paper"><div class="mhead"><span class="ribbon">Bark Smith</span><span class="hint">${esc(NPCS[npc] ? NPCS[npc].name : '')}, ${esc(TOWNS[town].name)}</span><div class="gold"><span class="coin"></span>${fmt(G.gold)}</div></div>
    <div class="mbody"><p class="hint">Buying gear you already own levels it up.</p><div class="grid">${list.map((id) => { const lv = G.items[id] || 0, price = Math.round(itemPrice(id) * (1 + lv * 0.6)), max = lv >= ITEM_MAX; return `<div class="card nav ${max || G.gold < price ? 'dim' : ''}" data-act="buy" data-v="${id}"><canvas data-icon="${id}"></canvas><div><div class="t1">${esc(ITEMS[id].name)} ${lv ? `<small>Lv${lv} &rarr; ${lv + 1}</small>` : ''}</div><div class="stats">${statLine(id, lv + 1, G.eq[ITEMS[id].slot] || null)}</div><div class="t2">${max ? 'Max level!' : `<span class="coin" style="width:14px;height:14px;vertical-align:-2px"></span> ${fmt(price)}`}</div></div></div>`; }).join('')}</div></div>
    <div class="mfoot"><button class="btn gold nav" data-act="close">Done</button></div></div>`;
  $('#panel').classList.remove('hidden'); this.fillCanvases();
  Nav.set($('#panel'), () => this.closePanel());
};
UI.buy = function (id) {
  const lv = G.items[id] || 0, price = Math.round(itemPrice(id) * (1 + lv * 0.6));
  if (lv >= ITEM_MAX) return;
  if (G.gold < price) { Sfx.play('nope'); UI.toast('Not enough gold. Dig for treasure or help folk out!'); return; }
  G.gold -= price; giveItem(id); Sfx.play('buy');
  if (G.eq[ITEMS[id].slot] !== id) { G.eq[ITEMS[id].slot] = id; G.hp = Math.min(G.hp, maxHp()); }
  const f = Nav.el && Nav.el.dataset.v; this.openShop(this.shopTown);
  if (f) { const el = document.querySelector(`#panel [data-v="${f}"]`); if (el) Nav.focus(el); }
};
UI.openTrainer = function (town) {
  Game.state = 'shop'; Input.clear(); this.trainTown = town;
  const tr = TRAINERS[town] || { name: 'Trainer', tricks: {} };
  const here = Object.keys(tr.tricks);
  const learned = Object.keys(G.tricks);
  const card = (id) => {
    const lv = G.tricks[id] || 0, T = TRICKS[id];
    if (!lv) { const price = tr.tricks[id]; return `<div class="card nav ${G.gold < price ? 'dim' : ''}" data-act="learn" data-v="${id}"><canvas data-icon="t:${id}"></canvas><div><div class="t1">Learn ${T.name}</div><div class="t2">${T.desc}</div><div class="t2">${price ? `<span class="coin" style="width:14px;height:14px;vertical-align:-2px"></span> ${fmt(price)}` : 'Free!'}</div></div></div>`; }
    if (lv >= TRICK_MAX) return `<div class="card dim"><canvas data-icon="t:${id}"></canvas><div><div class="t1">${T.name} <small>Lv${lv}</small></div><div class="t2">Mastered!</div></div></div>`;
    const price = trickUpCost(id, lv);
    return `<div class="card nav ${G.gold < price ? 'dim' : ''}" data-act="learn" data-v="${id}"><canvas data-icon="t:${id}"></canvas><div><div class="t1">${T.name} <small>Lv${lv} &rarr; ${lv + 1}</small></div><div class="t2">${id === 'belly' ? 'Heals more' : 'Hits harder'}</div><div class="t2"><span class="coin" style="width:14px;height:14px;vertical-align:-2px"></span> ${fmt(price)}</div></div></div>`;
  };
  const ids = here.filter((id) => !G.tricks[id]).concat(learned);
  $('#panel').innerHTML = `<div class="menu paper"><div class="mhead"><span class="ribbon">Trick School</span><span class="hint">${esc(tr.name)}, ${esc(TOWNS[town].name)}</span><div class="gold"><span class="coin"></span>${fmt(G.gold)}</div></div>
    <div class="mbody"><div class="grid">${ids.length ? ids.map(card).join('') : '<p>No tricks to learn here yet.</p>'}</div><p class="hint">Any trainer can make the tricks you know stronger.</p></div>
    <div class="mfoot"><button class="btn gold nav" data-act="close">Done</button></div></div>`;
  $('#panel').classList.remove('hidden'); this.fillCanvases();
  Nav.set($('#panel'), () => this.closePanel());
};
UI.learn = function (id) {
  const tr = TRAINERS[this.trainTown], lv = G.tricks[id] || 0;
  const price = lv ? trickUpCost(id, lv) : (tr.tricks[id] || 0);
  if (lv >= TRICK_MAX) return;
  if (G.gold < price) { Sfx.play('nope'); UI.toast('Not enough gold yet!'); return; }
  G.gold -= price;
  if (!lv) Quests.learnTrick(id); else { G.tricks[id] = lv + 1; Sfx.play('level'); UI.toast(`${TRICKS[id].name} is now Lv ${lv + 1}!`, 'item'); }
  const s = Quests.step(); if (s && s.type === 'learn' && s.trick === id) Quests.advance();
  this.openTrainer(this.trainTown);
};
UI.openBoard = function (town) {
  Game.state = 'shop'; Input.clear(); this.boardTown = town;
  const ids = Object.keys(BOUNTIES).filter((k) => BOUNTIES[k].board === town);
  const tips = { waggington: 'Tip: roll through red areas and you will not get hurt.', barkingham: 'Tip: the Queen pays well for Golden Pieces.', fetchwick: 'Tip: dogs can doggy paddle in shallow water. Critters cannot follow!', frostpaw: 'Tip: Granny Mush says wear a sweater.', dunehound: 'Tip: dig up sparkly X spots for treasure.', howlow: 'Tip: ghosts are scared of a good bark.', camp: 'Tip: burrows hide gear and gold.' };
  $('#panel').innerHTML = `<div class="menu paper"><div class="mhead"><span class="ribbon">Quest Board</span><span class="hint">${esc(TOWNS[town].name)}</span></div>
    <div class="mbody">${ids.map((id) => { const b = BOUNTIES[id], st = G.bounty[id]; return `<div class="qrow"><div class="t1">${esc(b.title)} <small>(about Lv ${b.lv})</small></div><div class="t2">${esc(b.desc)}</div><div class="t2">Reward: ${b.gold} gold, ${b.xp} XP</div><div class="row">${st === 'done' ? '<span class="ok">Caught! Thank you!</span>' : st === 'active' ? '<span class="ok">Accepted. Follow the arrow!</span>' : `<button class="btn small gold nav" data-act="bounty" data-v="${id}">Take the bounty</button>`}</div></div>`; }).join('') || ''}
      <p>${esc(tips[town] || '')}</p></div>
    <div class="mfoot"><button class="btn gold nav" data-act="close">Done</button></div></div>`;
  $('#panel').classList.remove('hidden');
  Nav.set($('#panel'), () => this.closePanel());
};

// ---------- the map
const MapView = {};
MapView.base = function () {
  if (this.img) return this.img;
  const s = 16, w = WW / s, h = WH / s, c = mkCanvas(w, h), g = c.getContext('2d'), d = g.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = i * s, y = j * s, f = World.Fat(x, y), k = (j * w + i) * 4;
    let r, gg, b;
    if (f < 0) { const t = clamp(-f / 0.55, 0, 1); r = lerp(150, 70, t); gg = lerp(220, 150, t); b = lerp(240, 220, t); }
    else { const kk = Math.round(y / GS) * GW + Math.round(x / GS); r = World.CR[kk]; gg = World.CG[kk]; b = World.CB[kk]; if (f < 0.05) { const sd = SANDS[World.biomeAt(x, y)]; r = sd[0]; gg = sd[1]; b = sd[2]; } }
    d.data[k] = r; d.data[k + 1] = gg; d.data[k + 2] = b; d.data[k + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  g.strokeStyle = '#d9b77f'; g.lineWidth = 2; g.lineJoin = 'round';
  for (const p of World.roadPolys) { g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q[0] / s, q[1] / s) : g.moveTo(q[0] / s, q[1] / s))); g.stroke(); }
  for (const p of World.props) if (p.kind === 'mountain') { g.fillStyle = '#8c96b5'; g.beginPath(); g.moveTo(p.x / s - 7, p.y / s); g.lineTo(p.x / s, p.y / s - 10); g.lineTo(p.x / s + 7, p.y / s); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(p.x / s - 2.5, p.y / s - 6.5); g.lineTo(p.x / s, p.y / s - 10); g.lineTo(p.x / s + 2.5, p.y / s - 6.5); g.fill(); }
  else if (p.kind === 'tree' || p.kind === 'pine' || p.kind === 'dead' || p.kind === 'palm') { g.fillStyle = 'rgba(40,90,40,0.35)'; g.fillRect(p.x / s - 1, p.y / s - 2, 2.5, 2.5); }
  this.img = c;
  return c;
};
MapView.draw = function (cv2) {
  if (!cv2) return;
  const r = cv2.getBoundingClientRect();
  const W = Math.max(200, r.width), H = Math.max(160, r.height);
  cv2.width = W * DPR; cv2.height = H * DPR;
  const g = cv2.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const k = Math.min(W / WW, H / WH), ox = (W - WW * k) / 2, oy = (H - WH * k) / 2;
  g.fillStyle = '#3b94dd'; g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = true;
  g.drawImage(this.base(), ox, oy, WW * k, WH * k);
  // fog: parchment clouds over places not seen
  g.fillStyle = '#efe0bd';
  const cw = FOGC * k + 1;
  for (let j = 0; j < FOGH; j++) for (let i = 0; i < FOGW; i++) if (!Fog.bits[j * FOGW + i]) g.fillRect(ox + i * FOGC * k - 0.5, oy + j * FOGC * k - 0.5, cw, cw);
  g.font = `700 ${Math.max(11, 13 * k * 9)}px Fredoka, ui-rounded, sans-serif`; g.textAlign = 'center';
  const label = (txt, x, y, col) => { g.lineWidth = 3.5; g.strokeStyle = OUT; g.strokeText(txt, x, y); g.fillStyle = col || '#fff'; g.fillText(txt, x, y); };
  for (const id in TOWNS) { const T = TOWNS[id]; if (!Fog.seen(T.x, T.y)) continue; const x = ox + T.x * k, y = oy + T.y * k; g.fillStyle = '#ffd84d'; g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.stroke(); label(T.name, x, y - 9); }
  for (const id in DUNGEON_SPOTS) { const D = DUNGEON_SPOTS[id]; if (!Fog.seen(D.x, D.y)) continue; const x = ox + D.x * k, y = oy + D.y * k; g.fillStyle = G.cleared[id] ? '#9be07a' : DUNGEONS[id].main ? '#e8475f' : '#a87a50'; g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); rrect(g, x - 5, y - 5, 10, 10, 2); g.fill(); g.stroke(); if (DUNGEONS[id].main) label(DUNGEONS[id].name, x, y + 18, '#ffe0e4'); }
  const t = Quests.target();
  if (t && t.x != null) { const x = ox + t.x * k, y = oy + t.y * k, p = 7 + Math.sin(S.time * 5) * 2; g.strokeStyle = '#ffd84d'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, p + 4, 0, TAU); g.stroke(); g.fillStyle = '#e8475f'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
  const px = ox + (S.scene === 'world' ? P.x : G.x) * k, py = oy + (S.scene === 'world' ? P.y : G.y) * k;
  g.save(); g.translate(px, py); g.fillStyle = '#ffffff'; g.strokeStyle = OUT; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.stroke(); drawPaw(g, 0, 0, 5, '#e8475f'); g.restore();
  g.font = '600 13px Fredoka, ui-rounded, sans-serif'; g.textAlign = 'left'; label('Paw: you   Ring: your goal   Red squares: big dungeons', 12, H - 12);
};

// ---------- full screens: title, new game, story, fainting, ending
UI.screen = function (html, back) {
  $('#screen').innerHTML = html; $('#screen').classList.remove('hidden');
  Nav.set($('#screen'), back || null);
};
UI.hideScreen = function () { $('#screen').classList.add('hidden'); $('#screen').innerHTML = ''; Nav.clear(); };
$('#screen').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { Sfx.play('ui'); UI.go[b.dataset.go](b); } });
UI.go = {};
UI.showTitle = function () {
  Game.state = 'title';
  const has = !!Game.localSave();
  const who = Net.user ? `Signed in as ${esc(Net.user.name)}` : '';
  this.screen(`<div class="title"><div class="logo">DOG QUEST<small>A Tail of the Goodest Pup</small></div>
    <div class="btns">${has ? '<button class="btn gold nav" data-go="cont">Continue</button>' : ''}<button class="btn ${has ? '' : 'gold'} nav" data-go="newg">New journey</button>${Net.enabled ? `<button class="btn blue nav" data-go="acct">${Net.user ? 'Account' : 'Sign in to save online'}</button>` : ''}</div></div>
    <div class="who">${who}</div><div class="foot">v${VERSION} &middot; Story and art &copy; 2026 Andrew Mueller</div>`);
  Music.play('title');
};
UI.go.cont = () => Game.continueGame();
UI.go.newg = () => {
  if (Game.localSave()) return UI.screen(`<div class="story paper"><p>Start a new journey? Your old one will be replaced${Net.user ? ' here and in your account' : ''}.</p><div class="btns"><button class="btn nav" data-go="title">Keep my journey</button><button class="btn red nav" data-go="newg2">Start fresh</button></div></div>`, () => UI.showTitle());
  UI.go.newg2();
};
UI.go.title = () => UI.showTitle();
UI.go.acct = () => Net.showAccountScreen();
UI.newPick = { breed: 'corgi', name: '', diff: 1 };
const DEFAULT_NAMES = { corgi: 'Biscuit', beagle: 'Scout', husky: 'Juniper', golden: 'Sunny', dalmatian: 'Domino', pug: 'Pickles', dachshund: 'Noodle', poodle: 'Bijou' };
UI.go.newg2 = () => {
  const p = UI.newPick;
  if (!p.name) p.name = DEFAULT_NAMES[p.breed];
  UI.screen(`<div class="newgame paper"><div style="text-align:center"><span class="ribbon">Who's a good pup?</span></div>
    <div class="breeds" style="margin-top:14px">${PLAYER_BREEDS.map((b) => `<div class="breed nav ${p.breed === b ? 'on' : ''}" data-go="breed" data-b="${b}"><canvas data-breed="${b}" width="240" height="184"></canvas>${BREEDS[b].name}</div>`).join('')}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><label style="min-width:0">Name</label><input type="text" id="heroName" maxlength="14" value="${esc(p.name)}"></div>
    <div class="row" style="justify-content:center">${DIFF.map((d, i) => `<button class="btn small nav ${p.diff === i ? 'gold' : ''}" data-go="diff" data-d="${i}">${d.name}</button>`).join('')}</div>
    <div class="row" style="justify-content:center"><button class="btn nav" data-go="title">Back</button><button class="btn gold nav" data-go="start">Start the journey!</button></div></div>`, () => UI.showTitle());
  for (const c of document.querySelectorAll('canvas[data-breed]')) { const g = c.getContext('2d'); g.fillStyle = 'rgba(40,25,60,0.18)'; ell(g, 120, 160, 50, 10); g.fill(); g.lineJoin = 'round'; g.lineCap = 'round'; drawDog(g, 110, 162, BREEDS[c.dataset.breed], { face: 1, t: 0.5, sc: 2.4, collar: '#e8475f', pant: 1 }); }
  const inp = $('#heroName'); inp.addEventListener('input', () => { p.name = inp.value; });
  if (Input.mode !== 'touch') setTimeout(() => Nav.focus(document.querySelector('.breed.on')), 30);
};
UI.go.breed = (b) => { const p = UI.newPick; const old = DEFAULT_NAMES[p.breed]; p.breed = b.dataset.b; if (!p.name || p.name === old) p.name = DEFAULT_NAMES[p.breed]; UI.go.newg2(); Nav.focus(document.querySelector(`[data-b="${p.breed}"]`)); };
UI.go.diff = (b) => { UI.newPick.diff = +b.dataset.d; UI.go.newg2(); };
UI.go.start = () => {
  const p = UI.newPick, name = (p.name || DEFAULT_NAMES[p.breed]).replace(/[<>{}]/g, '').trim().slice(0, 14) || DEFAULT_NAMES[p.breed];
  Game.startNew(name, p.breed, p.diff);
};
UI.showPrologue = function (done) {
  let i = 0;
  const show = () => {
    if (i >= PROLOGUE.length) { UI.hideScreen(); done(); return; }
    UI.screen(`<div class="story paper"><p>${esc(PROLOGUE[i])}</p><div class="btns"><button class="btn nav" data-go="skipP">Skip</button><button class="btn gold nav" data-go="nextP">${i < PROLOGUE.length - 1 ? 'Next' : 'Wake up!'}</button></div></div>`);
  };
  UI.go.nextP = () => { i++; show(); };
  UI.go.skipP = () => { i = PROLOGUE.length; show(); };
  Game.state = 'story';
  show();
};
UI.showDeath = function () {
  Game.state = 'dead';
  this.screen(`<div class="story paper"><div class="ribbon" style="margin-bottom:10px">Ruff day!</div><p>${esc(G.hero.name)} needs a nap. Squeaky helps you back to the inn at ${esc(TOWNS[G.respawn].name)}.</p><p class="hint">You keep all your gold, gear and progress.</p><div class="btns"><button class="btn gold nav" data-go="revive">Get back up</button></div></div>`);
};
UI.go.revive = () => { UI.hideScreen(); Game.fade(() => { heroRespawn(); Game.state = 'play'; Music.play(Game.regionMusic()); }); };
UI.showEnding = function () {
  Game.state = 'story'; Music.play('ending');
  const mins = Math.round(G.t / 60);
  this.screen(`<div class="story paper"><div class="logo" style="font-size:52px">THE END</div><p>The Golden Ball glows again, the sun shines warm, and every tail in Barkadia wags. Even a certain grumpy cat was spotted napping in a sunbeam at the Grand Fetch.</p>
    <p class="hint">${esc(G.hero.name)} the ${esc(heroLook().name || 'pup')} &middot; Level ${G.lv} &middot; ${mins} minutes &middot; ${G.kills} critters chased off &middot; ${Object.keys(G.digs).length} treasures dug up</p>
    <p>Thanks for playing Dog Quest! Barkadia is safe, but there are still bounties to catch, burrows to bust and treasure to dig up.</p>
    <div class="btns"><button class="btn gold nav" data-go="keep">Keep exploring</button></div></div>`);
};
UI.go.keep = () => { UI.hideScreen(); Game.state = 'play'; Music.play(Game.regionMusic()); };

// ---------- touch buttons
(function () {
  for (const b of document.querySelectorAll('#touch .tb')) {
    const a = b.dataset.a;
    const on = (e) => { e.preventDefault(); Input.touch[a] = 1; Input.queued[a] = 1; b.classList.add('down'); Input.mode = 'touch'; audioInit(); };
    const off = (e) => { e.preventDefault(); Input.touch[a] = 0; b.classList.remove('down'); };
    b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
    b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', off);
  }
  $('#menuBtn').addEventListener('click', () => { if (Game.state === 'play') UI.openMenu(); else if (Game.state === 'menu') UI.closePanel(); });
  $('#mapBtn').addEventListener('click', () => { if (Game.state === 'play') UI.openMenu('map'); else if (Game.state === 'menu') UI.closePanel(); });
})();
UI.updateTouch = function () {
  const it = Interact.target;
  const lb = $('#tbAtk .lb'), want = it && !nearestFoe(P.x, P.y, 170) ? Interact.label(it) : P.swim ? 'Swim' : 'Swing';
  if (lb.textContent !== want) lb.textContent = want;
  for (let i = 0; i < 4; i++) {
    const b = $('#tbT' + (i + 1)), id = G.slots[i];
    if (b.dataset.id !== (id || '')) {
      b.dataset.id = id || ''; b.innerHTML = id ? '' : '';
      if (id) { b.appendChild(trickIconCanvas(id, 34)); const cd = document.createElement('div'); cd.className = 'cd'; b.appendChild(cd); }
      b.classList.toggle('empty', !id);
    }
    if (id) { b.classList.toggle('poor', G.mp < TRICKS[id].cost); const cd = b.querySelector('.cd'); if (cd) { const k = clamp((P.cds[id] || 0) / TRICKS[id].cd, 0, 1); cd.style.transform = `scaleY(${k})`; } }
  }
};

// ---------- the HUD, drawn on the canvas
const HUD = { portrait: null, pkey: '' };
HUD.draw = function (c) {
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const top = 10 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0);
  // portrait and bars
  const key = G.hero.breed + (G.eq.head || '');
  if (this.pkey !== key) { this.pkey = key; const pc = mkCanvas(120, 120); drawPortrait(pc, 'hero'); this.portrait = pc; }
  const x0 = 12, y0 = top;
  c.save(); circ(c, x0 + 32, y0 + 32, 30); c.fillStyle = '#ffe6a8'; c.fill(); c.clip(); c.drawImage(this.portrait, x0 + 2, y0 + 2, 60, 60); c.restore();
  c.lineWidth = 3.5; c.strokeStyle = OUT; circ(c, x0 + 32, y0 + 32, 30); c.stroke();
  c.fillStyle = '#ffd84d'; c.beginPath(); rrect(c, x0 + 6, y0 + 50, 52, 20, 9); c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = OUT; c.font = '700 14px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.fillText('Lv ' + G.lv, x0 + 32, y0 + 65);
  const bw = Math.min(230, SW * 0.42), bx = x0 + 70;
  const bar = (y, h, k, col, label, flash) => {
    c.fillStyle = OUT; c.beginPath(); rrect(c, bx - 3, y - 3, bw + 6, h + 6, (h + 6) / 2); c.fill();
    c.fillStyle = '#5a3a52'; c.beginPath(); rrect(c, bx, y, bw, h, h / 2); c.fill();
    if (k > 0) { c.fillStyle = flash ? '#ffffff' : col; c.beginPath(); rrect(c, bx, y, Math.max(h, bw * k), h, h / 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); rrect(c, bx + 4, y + 2, Math.max(0, bw * k - 8), h * 0.3, h * 0.15); c.fill(); }
    if (label) { c.font = '700 13px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'left'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(label, bx + 8, y + h - 4); c.fillStyle = '#fff'; c.fillText(label, bx + 8, y + h - 4); }
  };
  const hpK = G.hp / maxHp();
  bar(y0 + 6, 18, hpK, hpK < 0.3 ? '#ff5a6a' : '#7fe07a', `${Math.ceil(G.hp)} / ${maxHp()}`);
  this.woofFlashT = (UI.woofFlash -= 1 / 60);
  bar(y0 + 32, 13, G.mp / maxMp(), '#5fb8ff', '', UI.woofFlash > 0 && Math.floor(UI.woofFlash * 10) % 2 === 0);
  bar(y0 + 52, 6, G.xp / xpNeed(G.lv), '#ffd84d');
  // gold
  c.font = '700 17px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'left';
  c.fillStyle = '#ffd84d'; circ(c, bx + 8, y0 + 78, 8); c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3.5; c.strokeText(fmt(G.gold), bx + 22, y0 + 84); c.fillStyle = '#fff'; c.fillText(fmt(G.gold), bx + 22, y0 + 84);
  if (P.swim) { c.lineWidth = 3.5; c.strokeText('Paddling!', bx + 90, y0 + 84); c.fillStyle = '#bfe8fa'; c.fillText('Paddling!', bx + 90, y0 + 84); }
  // quest tracker
  const q = Quests.trackText();
  if (q && SW > 380) {
    const w = Math.min(320, SW * 0.4), x = SW - w - 12, y = top + 60;
    c.font = '600 13px Fredoka, ui-rounded, sans-serif';
    const lines = wrapText(c, q.text, w - 24, 3);
    const h = 30 + lines.length * 18;
    c.fillStyle = 'rgba(255,244,220,0.94)'; c.beginPath(); rrect(c, x, y, w, h, 14); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = '#e8475f'; c.font = '700 13px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'left'; c.fillText(q.title, x + 12, y + 20);
    c.fillStyle = OUT; c.font = '600 15px Fredoka, ui-rounded, sans-serif'; lines.forEach((l, i) => c.fillText(l, x + 12, y + 40 + i * 18));
  }
  // area name
  if (UI.areaT > 0) {
    UI.areaT -= 1 / 60;
    const a = Math.min(1, UI.areaT, (3 - UI.areaT) * 3);
    c.globalAlpha = clamp(a, 0, 1);
    c.font = '700 34px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = OUT;
    c.strokeText(UI.area, SW / 2, SH * 0.22); c.fillStyle = '#fff'; c.fillText(UI.area, SW / 2, SH * 0.22);
    c.globalAlpha = 1;
  }
  // trick slots for keyboard and controller
  if (!document.body.classList.contains('touchy') && SET.touch !== 'on') {
    const keys = Input.mode === 'pad' ? ['X', 'Y', 'LB', 'RB'] : ['1', '2', '3', '4'];
    const s = 54, gap = 10, tw = 4 * s + 3 * gap, tx = SW / 2 - tw / 2, ty = SH - s - 16;
    for (let i = 0; i < 4; i++) {
      const id = G.slots[i], x = tx + i * (s + gap);
      c.fillStyle = id ? 'rgba(255,250,240,0.95)' : 'rgba(255,250,240,0.4)'; c.beginPath(); rrect(c, x, ty, s, s, 14); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
      if (id) {
        drawTrickIcon(c, id, x + s / 2, ty + s / 2 - 3, 34);
        const k = clamp((P.cds[id] || 0) / TRICKS[id].cd, 0, 1);
        if (G.mp < TRICKS[id].cost) { c.fillStyle = 'rgba(59,34,53,0.45)'; c.beginPath(); rrect(c, x, ty, s, s, 14); c.fill(); }
        if (k > 0) { c.fillStyle = 'rgba(59,34,53,0.5)'; c.fillRect(x + 3, ty + s * (1 - k), s - 6, s * k - 3); }
        c.font = '700 11px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'right'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(TRICKS[id].cost, x + s - 5, ty + s - 5); c.fillStyle = '#7fd0ff'; c.fillText(TRICKS[id].cost, x + s - 5, ty + s - 5);
      }
      c.font = '700 12px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.fillStyle = OUT; c.beginPath(); rrect(c, x + s / 2 - 13, ty - 9, 26, 16, 7); c.fill(); c.fillStyle = '#fff'; c.fillText(keys[i], x + s / 2, ty + 3);
    }
  }
  // boss health
  const B = Bosses.current;
  if (B && B.hp > 0 && S.scene === 'dungeon') {
    const w = Math.min(560, SW - 40), x = SW / 2 - w / 2, y = SH - (document.body.classList.contains('touchy') ? 290 : 104);
    c.font = '700 18px Fredoka, ui-rounded, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = OUT; c.strokeText(B.name, SW / 2, y - 8); c.fillStyle = '#fff'; c.fillText(B.name, SW / 2, y - 8);
    c.fillStyle = OUT; c.beginPath(); rrect(c, x - 3, y - 3, w + 6, 22, 11); c.fill();
    c.fillStyle = '#e8475f'; c.beginPath(); rrect(c, x, y, Math.max(16, w * B.hp / B.maxHp), 16, 8); c.fill();
  }
  // a red edge when hurt badly
  if (G.hp < maxHp() * 0.25 && G.hp > 0) { const a = 0.25 + Math.sin(S.time * 6) * 0.1; const gr = c.createRadialGradient(SW / 2, SH / 2, Math.min(SW, SH) * 0.4, SW / 2, SH / 2, Math.max(SW, SH) * 0.75); gr.addColorStop(0, 'rgba(232,71,95,0)'); gr.addColorStop(1, `rgba(232,71,95,${a})`); c.fillStyle = gr; c.fillRect(0, 0, SW, SH); }
  // the floating stick for touch
  if (Input.stick.on && Touch.id != null) {
    c.globalAlpha = 0.5; c.fillStyle = '#fffaf0'; circ(c, Touch.ox, Touch.oy, 56); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    c.globalAlpha = 0.85; circ(c, Touch.ox + Input.stick.x * 56, Touch.oy + Input.stick.y * 56, 26); c.fill(); c.stroke(); c.globalAlpha = 1;
  }
};
function wrapText(c, text, w, maxLines) {
  const words = String(text).split(' '), out = []; let line = '';
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w && line) { out.push(line); line = wd; } else line = t; }
  if (line) out.push(line);
  return out.slice(0, maxLines || 9);
}
// the arrow that points to your goal, and the button prompt
function drawPointer(c) {
  const t = Quests.target();
  if (!t || t.x == null || S.scene !== 'world' || Game.state !== 'play') return;
  const d = dist(P.x, P.y, t.x, t.y);
  if (d < 120 && !t.area) return;
  const v = viewRect(-30);
  if (t.x > v.x0 && t.x < v.x1 && t.y > v.y0 + 40 && t.y < v.y1) {
    // goal on screen: a bouncing marker over it
    const y = t.y - 92 + Math.sin(S.time * 5) * 5;
    c.fillStyle = '#ffd84d'; c.beginPath(); c.moveTo(t.x - 12, y - 16); c.lineTo(t.x + 12, y - 16); c.lineTo(t.x, y); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    return;
  }
  const a = angTo(P.x, P.y - 20, t.x, t.y), r = 62;
  const x = P.x + Math.cos(a) * r, y = P.y - 20 + Math.sin(a) * r;
  c.save(); c.translate(x, y); c.rotate(a);
  c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, -12); c.lineTo(-3, 0); c.lineTo(-8, 12); c.closePath(); c.fillStyle = '#ffd84d'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.restore();
  // Squeaky floats by the arrow
}
function drawPrompt(c) {
  const it = Interact.target; if (!it || Game.state !== 'play') return;
  if (nearestFoe(P.x, P.y, 170) && it.kind !== 'npc') return;
  const key = Input.mode === 'pad' ? 'A' : Input.mode === 'touch' ? '' : 'E';
  const text = (key ? key + '  ' : '') + Interact.label(it);
  const y = (it.kind === 'npc' ? it.y - 92 : it.y - 70) - (it.b && BLD[it.b.bk] ? Math.min(140, BLD[it.b.bk].oy * 0.6) : 0) + Math.sin(S.time * 4) * 2;
  c.font = '700 15px Fredoka, ui-rounded, sans-serif';
  const w = c.measureText(text).width + 22;
  c.fillStyle = '#fffaf0'; c.beginPath(); rrect(c, it.x - w / 2, y - 20, w, 28, 12); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = OUT; c.textAlign = 'center'; c.fillText(text, it.x, y - 1);
}
