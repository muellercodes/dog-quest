// Quests, talking, treasure, and the fog on the map.
const Quests = {};
Quests.step = function () { return MAIN[G.main]; };
Quests.done = function (stepId) { return G.main > MAIN_INDEX[stepId]; };
Quests.begin = function () {
  const s = this.step(); if (!s) return;
  G.mainN = 0;
  const after = () => {
    UI.toast('New goal: ' + s.text, 'goal');
    if (s.hint === 'move') UI.controlsHint();
  };
  if (s.start) Dialog.play(s.start, after); else after();
};
Quests.advance = function (silent) {
  const s = this.step(); if (!s) return;
  if (s.flag) G.flags[s.flag] = 1;
  if (s.flag2) G.flags[s.flag2] = 1;
  if (s.learnSwim) { UI.banner('DOGGY PADDLE!', 'You can swim in shallow water'); }
  if (s.reward) this.reward(s.reward);
  G.main++;
  G.ch = this.chapter();
  if (s.ending) { G.won = 1; Game.save(); UI.showEnding(); return; }
  Game.save();
  if (!silent) setTimeout(() => this.begin(), 250);
};
Quests.chapter = function () {
  const i = G.main;
  if (i <= MAIN_INDEX.queen) return 'Chapter 1: Bonk!';
  if (i <= MAIN_INDEX.piece1) return 'Chapter 2: Gone Nuts';
  if (i <= MAIN_INDEX.piece2) return 'Chapter 3: Sea Dogs';
  if (i <= MAIN_INDEX.piece3) return 'Chapter 4: Cold Paws';
  if (i <= MAIN_INDEX.piece4) return 'Chapter 5: It\'s a Wrap';
  if (i < MAIN.length) return 'Chapter 6: Bad Kitty';
  return 'The End (but keep exploring!)';
};
Quests.reward = function (r) {
  const bits = [];
  if (r.gold) { giveGold(r.gold); bits.push(r.gold + ' gold'); Sfx.play('coin'); }
  if (r.xp) { giveXp(r.xp); bits.push(r.xp + ' XP'); }
  if (r.item) giveItem(r.item);
  if (bits.length) UI.toast('Reward: ' + bits.join(', '), 'reward');
};

// ---------- counting things
function inRegion(f, reg) { return !reg || World.biomeAt(f.x, f.y) === reg; }
Quests.onKill = function (f) {
  const s = this.step();
  if (s && s.type === 'kill' && s.foes.includes(f.key) && inRegion(f, s.region)) {
    G.mainN++;
    if (G.mainN >= s.n) { this.advance(); } else UI.toast(`${s.text}: ${G.mainN}/${s.n}`, 'count');
  }
  for (const id in G.side) {
    const q = G.side[id], d = SIDE[id];
    if (q.s !== 'active' || d.type !== 'kill' || !d.foes.includes(f.key) || !inRegion(f, d.region)) continue;
    q.n++;
    if (q.n >= d.n) { q.s = 'ready'; UI.toast(`${d.title}: done! Go see ${NPCS[d.giver].name}.`, 'goal'); Sfx.play('quest'); }
    else UI.toast(`${d.title}: ${q.n}/${d.n}`, 'count');
  }
};
Quests.onDungeon = function (id) {
  const s = this.step();
  if (s && s.type === 'dungeon' && s.dungeon === id) this.advance();
  const q = G.side.burrows;
  if (q && q.s === 'active' && id.startsWith('b_')) { q.n++; if (q.n >= SIDE.burrows.n) { q.s = 'ready'; UI.toast('Burrow Busters: done! Go see Ranger Rosie.', 'goal'); } else UI.toast(`Burrow Busters: ${q.n}/${SIDE.burrows.n}`, 'count'); }
};
Quests.onBounty = function (f) {
  const b = BOUNTIES[f.bounty]; if (!b || G.bounty[f.bounty] !== 'active') return;
  G.bounty[f.bounty] = 'done';
  UI.banner('BOUNTY COMPLETE!', b.name);
  this.reward({ gold: b.gold, xp: b.xp });
  Sfx.play('quest');
  if (G.track === f.bounty) G.track = 'main';
};
Quests.onPickup = function (qid, item) {
  if (qid === 'main') {
    const s = this.step();
    if (s && s.type === 'collect') { G.mainN++; UI.toast(`${QITEMS[item].name}: ${G.mainN}/${s.n}`, 'count'); if (G.mainN >= s.n) this.advance(); }
    return;
  }
  const q = G.side[qid], d = SIDE[qid];
  if (!q || q.s !== 'active') return;
  q.n++;
  if (q.n >= d.n) { q.s = 'ready'; UI.toast(`${d.title}: done! Go see ${NPCS[d.giver].name}.`, 'goal'); Sfx.play('quest'); } else UI.toast(`${QITEMS[item].name}: ${q.n}/${d.n}`, 'count');
};
Quests.onDig = function () {
  const q = G.side.dig;
  if (q && q.s === 'active') { q.n++; if (q.n >= SIDE.dig.n) { q.s = 'ready'; UI.toast('Dig It: done! Go see Grandpa Gravy.', 'goal'); } else UI.toast(`Dig It: ${q.n}/${SIDE.dig.n}`, 'count'); }
};
Quests.checkGoto = function () {
  const s = this.step();
  if (s && s.type === 'goto' && S.scene === 'world' && World.townAt(P.x, P.y) === s.town) this.advance();
};

// ---------- talking to folk
Quests.sideAvailable = function (id) {
  const d = SIDE[id];
  if (G.side[id]) return false;
  if (d.needStep && !this.done(d.needStep)) return false;
  return true;
};
Quests.npcMark = function (npc) {
  const s = this.step();
  if (s && (s.type === 'talk' || s.type === 'learn') && s.npc === npc && !(s.type === 'learn' && G.tricks[s.trick])) return '!';
  for (const id in SIDE) {
    const d = SIDE[id], q = G.side[id];
    if (d.giver === npc && q && q.s === 'ready') return '?';
    if (d.giver === npc && this.sideAvailable(id)) return '!';
    if (q && q.s === 'active' && d.type === 'deliver' && d.npcs.includes(npc) && !q.got[npc]) return '?';
  }
  return null;
};
Quests.talk = function (npc) {
  const n = NPCS[npc], s = this.step();
  G.met[npc] = 1;
  Sfx.play('bark');
  // the main story first
  if (s && s.type === 'talk' && s.npc === npc) return Dialog.play(s.talk, () => this.advance());
  if (s && s.type === 'learn' && s.npc === npc) return Dialog.play(s.talk, () => { this.learnTrick(s.trick, true); this.advance(); });
  // deliveries
  for (const id in G.side) {
    const q = G.side[id], d = SIDE[id];
    if (q.s === 'active' && d.type === 'deliver' && d.npcs.includes(npc) && !q.got[npc]) {
      return Dialog.play(d.lines[npc], () => {
        q.got[npc] = 1; q.n = Object.keys(q.got).length;
        if (q.n >= d.npcs.length) { q.s = 'ready'; UI.toast(`${d.title}: done! Go see ${NPCS[d.giver].name}.`, 'goal'); } else UI.toast(`${d.title}: ${q.n}/${d.npcs.length} letters`, 'count');
      });
    }
  }
  // side quests this one gives
  for (const id in SIDE) {
    const d = SIDE[id], q = G.side[id];
    if (d.giver !== npc) continue;
    if (q && q.s === 'ready') return Dialog.play(d.turnin, () => { q.s = 'done'; this.reward(d.reward); Sfx.play('quest'); if (G.track === id) G.track = 'main'; Game.save(); });
    if (this.sideAvailable(id)) {
      return Dialog.ask(d.offer, [
        { label: 'Sure, I\'ll help!', fn: () => { G.side[id] = { s: 'active', n: 0, got: {} }; G.track = id; UI.toast('New side quest: ' + d.title, 'goal'); Sfx.play('quest'); } },
        { label: 'Maybe later', fn: () => {} },
      ]);
    }
    if (q && q.s === 'active') return Dialog.play([[npc, 'How\'s it going? ' + d.text + '.']]);
  }
  // shops and services
  if (n.role === 'trainer') return Dialog.play([[npc, pick(n.talk).replace('{name}', G.hero.name)]], () => UI.openTrainer(n.town));
  if (n.role === 'smith') return Dialog.play([[npc, pick(n.talk)]], () => UI.openShop(n.town));
  if (n.role === 'inn') return Interact.inn(n.town, npc);
  if (npc === 'paddle' || npc === 'ferry2') return Interact.ferry(npc === 'paddle' ? World.dock : World.dock2);
  // just chatting
  const lines = n.talk || ['Woof!'];
  n.ti = ((n.ti || 0) + 1) % lines.length;
  Dialog.play([[npc, lines[n.ti]]]);
};
Quests.learnTrick = function (id, free) {
  if (!G.tricks[id]) {
    G.tricks[id] = 1;
    const empty = G.slots.indexOf(null);
    if (empty >= 0) G.slots[empty] = id;
    UI.banner('NEW TRICK!', TRICKS[id].name);
    Sfx.play('level');
  }
};

// ---------- where is the goal? (for the pointer and the map)
Quests.npcPos = function (id) { const n = S.npcs.find((q) => q.id === id); return n ? { x: n.x, y: n.y } : null; };
Quests.target = function () {
  const tr = G.track || 'main';
  if (tr === 'main') {
    const s = this.step(); if (!s) return null;
    switch (s.type) {
      case 'talk': case 'learn': return Object.assign({ label: NPCS[s.npc].name }, this.npcPos(s.npc));
      case 'kill': if (s.spawn) { const t = TOWNS[s.spawn.town]; return { x: t.x + s.spawn.dx, y: t.y + s.spawn.dy, label: s.text }; } return null;
      case 'dungeon': return S.scene === 'dungeon' ? null : Object.assign({ label: DUNGEONS[s.dungeon].name }, DUNGEON_SPOTS[s.dungeon]);
      case 'goto': if (G.flags.ferry && World.townAt(P.x, P.y) !== 'fetchwick' && World.biomeAt(P.x, P.y) !== 'isle') return { x: World.dock.x, y: World.dock.y, label: 'Fetchwick docks' }; return { x: TOWNS[s.town].x, y: TOWNS[s.town].y, label: TOWNS[s.town].name };
      case 'collect': { const sp = this.spots('main').filter((q) => !q.got); if (!sp.length) return null; sp.sort((a, b) => dist2(P.x, P.y, a.x, a.y) - dist2(P.x, P.y, b.x, b.y)); return { x: sp[0].x, y: sp[0].y, label: s.text }; }
    }
    return null;
  }
  if (BOUNTIES[tr]) { const b = BOUNTIES[tr]; return G.bounty[tr] === 'active' ? { x: b.at[0], y: b.at[1], label: b.name } : null; }
  const q = G.side[tr], d = SIDE[tr];
  if (!q || !d) return null;
  if (q.s === 'ready') return Object.assign({ label: NPCS[d.giver].name }, this.npcPos(d.giver));
  if (d.type === 'deliver') { const left = d.npcs.filter((n) => !q.got[n]).map((n) => Object.assign({ label: NPCS[n].name }, this.npcPos(n))); left.sort((a, b) => dist2(P.x, P.y, a.x, a.y) - dist2(P.x, P.y, b.x, b.y)); return left[0] || null; }
  if (d.type === 'collect') { const sp = this.spots(tr).filter((s) => !s.got); sp.sort((a, b) => dist2(P.x, P.y, a.x, a.y) - dist2(P.x, P.y, b.x, b.y)); return sp[0] ? { x: sp[0].x, y: sp[0].y, label: d.text } : null; }
  if (d.region) { const r = REGIONS.find((x) => x.id === d.region); return r ? { x: r.x, y: r.y, label: BIOMES[d.region].name, area: 1 } : null; }
  return null;
};
Quests.trackText = function () {
  const tr = G.track || 'main';
  if (tr === 'main') { const s = this.step(); if (!s) return G.won ? { title: 'Barkadia is saved!', text: 'Dig, explore and catch bounties' } : null; let t = s.text; if (s.n) t += ` (${G.mainN}/${s.n})`; return { title: this.chapter(), text: t }; }
  if (BOUNTIES[tr]) return { title: BOUNTIES[tr].title, text: 'Find and beat ' + BOUNTIES[tr].name };
  const q = G.side[tr], d = SIDE[tr];
  if (!q) return null;
  if (q.s === 'ready') return { title: d.title, text: 'Go see ' + NPCS[d.giver].name };
  const n = d.n || (d.npcs && d.npcs.length);
  return { title: d.title, text: d.text + (n ? ` (${q.n}/${n})` : '') };
};
// quest things lying on the ground
Quests.spots = function (qid) {
  const d = qid === 'main' ? this.step() : SIDE[qid];
  if (!d || !d.spots) return [];
  return d.spots.map((p, i) => { const key = (qid === 'main' ? d.id : qid) + ':' + i; return { x: p[0], y: p[1], key, got: !!G.picked[key], item: d.item, how: d.how, qid }; });
};
Quests.activeSpots = function () {
  const out = [];
  const s = this.step();
  if (s && s.type === 'collect') out.push(...this.spots('main'));
  for (const id in G.side) if (G.side[id].s === 'active' && SIDE[id].type === 'collect') out.push(...this.spots(id));
  return out.filter((p) => !p.got);
};
Quests.spawnsWanted = function () {
  const out = [];
  const s = this.step();
  if (s && s.type === 'kill' && s.spawn) { const t = TOWNS[s.spawn.town]; out.push({ tag: 'main:' + s.id, x: t.x + s.spawn.dx, y: t.y + s.spawn.dy, foe: s.spawn.foe, n: s.spawn.n, lv: s.spawn.lv }); }
  for (const id in G.bounty) if (G.bounty[id] === 'active') { const b = BOUNTIES[id]; out.push({ tag: 'bounty:' + id, x: b.at[0], y: b.at[1], foe: b.foe, n: 1, lv: b.lv, elite: b.name, bounty: id }); }
  return out;
};

// ---------- interacting with the world
const Interact = { target: null };
Interact.find = function () {
  if (Game.state !== 'play' || P.state === 'dead') { this.target = null; return; }
  const cands = [];
  if (S.scene === 'world') {
    for (const n of S.npcs) cands.push({ kind: 'npc', id: n.id, x: n.x, y: n.y, r: 62, label: 'Talk' });
    for (const it of World.inters) if (it.kind !== 'townname') cands.push(it);
    for (const ch of World.chests) if (!G.chests[ch.id]) cands.push({ kind: 'chest', ch, x: ch.x, y: ch.y + 10, r: 58, label: 'Open' });
    for (const d of World.digs) if (!G.digs[d.id]) cands.push({ kind: 'dig', d, x: d.x, y: d.y, r: 46, label: 'Dig' });
    for (const p of Quests.activeSpots()) if (p.how === 'dig') cands.push({ kind: 'qdig', p, x: p.x, y: p.y, r: 46, label: 'Dig' });
  } else Dungeon.inters(cands);
  let best = null, bd = 1e9;
  for (const c of cands) { const d = dist(P.x, P.y, c.x, c.y); if (d < c.r && d < bd) { bd = d; best = c; } }
  this.target = best;
};
Interact.label = function (it) {
  return it.label || { inn: 'Rest', smith: 'Shop', trainer: 'Tricks', board: 'Read', dock: 'Ferry', dungeon: 'Enter', sign: 'Look', dchest: 'Open', castle: 'Look' }[it.kind] || 'Look';
};
Interact.use = function (it) {
  Input.hit.atk = false;
  switch (it.kind) {
    case 'npc': return Quests.talk(it.id);
    case 'inn': return this.inn(it.town);
    case 'smith': return UI.openShop(it.town);
    case 'trainer': return UI.openTrainer(it.town);
    case 'board': return UI.openBoard(it.town);
    case 'dock': return this.ferry(it.dock);
    case 'castle': return Dialog.play([['sign', 'The royal palace of Barkadia. Queen Corgina holds court right outside, because the inside smells like old carpet.']]);
    case 'sign': {
      const t = { well: 'You peek into the well. A frog peeks back.', fountain: 'A fountain shaped like a very proud dog. You make a wish. It is probably about snacks.', campfire: 'The campfire crackles. Someone roasted a sausage here.' }[it.sub] || SIGNS[it.town] || '...';
      return Dialog.play([['sign', t]]);
    }
    case 'dungeon': return this.door(it.id);
    case 'chest': return this.openChest(it.ch.id, it.ch, it.ch.x, it.ch.y);
    case 'dchest': { const ch = it.chest; ch.open = true; G.chests[ch.id] = 1; Sfx.play('chest'); fxBurst(ch.x, ch.y - 30, '#ffd84d', 18, 220); giveItem(ch.item); Game.save(); const D = Dungeon.D; if (D && !D.def.boss && Dungeon.room().i === D.rooms.length - 1) Dungeon.finish(); return; }
    case 'dig': case 'qdig': P.state = 'digspot'; P.st = 0; this.digging = it; Sfx.play('dig'); return;
  }
};
Interact.finishDig = function () {
  const it = this.digging; this.digging = null; if (!it) return;
  fxBurst(it.x, it.y - 6, '#a87a50', 16, 220);
  if (it.kind === 'qdig') { const p = it.p; G.picked[p.key] = 1; UI.toast('You dug up a ' + QITEMS[p.item].name + '!', 'item'); Sfx.play('chest'); Quests.onPickup(p.qid, p.item); return; }
  const d = it.d; G.digs[d.id] = 1;
  const reg = World.regionAt(d.x, d.y) || REGIONS[0];
  const roll = hash2(d.id, 7, 3);
  if (roll < 0.22) { const pool = ['bone', 'bandana', 'party', 'chicken', 'flower', 'squeaky', 'raincoat', 'sweater', 'wizard', 'sombrero']; giveItem(pool[Math.floor(hash2(d.id, 9, 1) * pool.length)]); }
  else { const g = Math.round((25 + reg.lv[1] * 18) * (0.8 + roll)); giveGold(g); UI.toast(`You dug up ${g} gold!`, 'coin'); Sfx.play('coin'); }
  Quests.onDig();
};
Interact.openChest = function (id, ch, x, y) {
  G.chests[id] = 1; Sfx.play('chest');
  fxBurst(x, y - 30, '#ffd84d', 18, 220);
  if (ch.item) giveItem(ch.item);
  if (ch.gold) { giveGold(ch.gold); UI.toast(`Found ${ch.gold} gold!`, 'coin'); }
  Game.save();
};
Interact.door = function (id) {
  const open = id.startsWith('b_') || (id === 'oak' && G.flags.oak_open) || (id === 'grotto' && G.flags.grotto_open) || (id === 'den' && G.flags.den_open) || (id === 'purramid' && G.flags.purr_open) || (id === 'keep' && G.flags.ferry);
  if (!open) return Dialog.play(LOCKED[id] || [['squeaky', 'It\'s locked.']]);
  const def = DUNGEONS[id];
  const warnLv = def.lv - G.lv >= 3 ? ` The critters in there are around level ${def.lv}. Be careful!` : '';
  Dialog.ask([['narrator', `${def.name}. ${G.cleared[id] ? 'You have cleared it already.' : 'Go inside?'}${warnLv}`]], [
    { label: 'Go in', fn: () => Game.fade(() => Dungeon.enter(id)) },
    { label: 'Not yet', fn: () => {} },
  ]);
};
Interact.inn = function (town, npc) {
  const who = npc || Object.keys(NPCS).find((k) => NPCS[k].town === town && NPCS[k].role === 'inn');
  Dialog.ask([[who || 'narrator', 'Welcome! A nap here fills your health and Woof, and saves your journey. Free for heroes!']], [
    { label: 'Take a nap', fn: () => Game.fade(() => { G.hp = maxHp(); G.mp = maxMp(); G.respawn = town; Game.save(true); UI.toast('You feel well rested. Journey saved!', 'save'); Sfx.play('level'); }) },
    { label: 'No thanks', fn: () => {} },
  ]);
};
Interact.ferry = function (dock) {
  if (!G.flags.ferry) return Dialog.play([['paddle', 'Ahoy! The Royal Ferry only sails with the Queen\'s pass, pup. Rules is rules.']]);
  const toIsle = dock.to === 'isle';
  Dialog.ask([[toIsle ? 'paddle' : 'ferry2', toIsle ? 'All aboard for Scratchpost Isle! It\'s a bit... catty over there.' : 'Ready to head back to Fetchwick?']], [
    { label: 'Set sail!', fn: () => Game.fade(() => { const to = toIsle ? World.dock2 : World.dock; P.x = to.x + (toIsle ? 60 : -60); P.y = to.y + 10; Cam.x = P.x; Cam.y = P.y; Quests.checkGoto(); Music.play(Game.regionMusic()); }, 'Sailing...') },
    { label: 'Stay here', fn: () => {} },
  ]);
};

// treasure placed in the world at the start
World.placeTreasure = function () {
  this.chests = CHESTS.map((c) => { const p = this.toLand(c.x, c.y, 0.08); const q = this.blocked(p.x, p.y, 20, false) ? this.toLand(p.x + 40, p.y + 40, 0.08) : p; return Object.assign({}, c, { x: q.x, y: q.y }); });
  this.digs = DIGS.map(([x, y], i) => { const p = this.toLand(x, y, 0.1); return { id: i + 1, x: p.x, y: p.y }; });
  for (const id in SIDE) if (SIDE[id].spots) SIDE[id].spots = SIDE[id].spots.map(([x, y]) => { const p = this.toLand(x, y, 0.1); return [p.x, p.y]; });
  for (const s of MAIN) if (s.spots) s.spots = s.spots.map(([x, y]) => { const p = this.toLand(x, y, 0.1); return [p.x, p.y]; });
  for (const id in BOUNTIES) { const b = BOUNTIES[id]; const p = this.toLand(b.at[0], b.at[1], 0.15); b.at = [p.x, p.y]; }
};
function drawTreasure(c, v, t, out) {
  for (const ch of World.chests) if (ch.x > v.x0 && ch.x < v.x1 && ch.y > v.y0 && ch.y < v.y1 + 40) out.push({ y: ch.y, draw: (g) => drawChest(g, ch.x, ch.y, !!G.chests[ch.id], 1) });
  for (const d of World.digs) if (!G.digs[d.id] && d.x > v.x0 && d.x < v.x1 && d.y > v.y0 && d.y < v.y1) drawDigSpot(c, d.x, d.y, t, d.id);
  for (const p of Quests.activeSpots()) if (p.x > v.x0 - 40 && p.x < v.x1 + 40 && p.y > v.y0 - 40 && p.y < v.y1 + 40) {
    if (p.how === 'dig') drawDigSpot(c, p.x, p.y, t, 0, true);
    else out.push({ y: p.y, draw: (g) => drawQItem(g, p.x, p.y, p.item, t) });
  }
}
function drawDigSpot(c, x, y, t, k, gold) {
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(120,80,40,0.28)'; ell(c, 0, 0, 18, 7); c.fill();
  c.strokeStyle = gold ? '#ffd84d' : 'rgba(255,255,255,0.85)'; c.lineWidth = 3.2;
  c.beginPath(); c.moveTo(-8, -4); c.lineTo(8, 4); c.moveTo(8, -4); c.lineTo(-8, 4); c.stroke();
  for (let i = 0; i < 2; i++) { const a = t * 2 + k + i * 3; const s = (Math.sin(a) + 1) / 2; c.fillStyle = `rgba(255,246,168,${s})`; c.save(); c.translate(Math.cos(a * 0.7) * 14, -10 - s * 10); c.beginPath(); for (let j = 0; j < 8; j++) { const r = j % 2 ? 1.5 : 5; c.lineTo(Math.cos((j / 8) * TAU) * r, Math.sin((j / 8) * TAU) * r); } c.fill(); c.restore(); }
  c.restore();
}
function drawQItem(c, x, y, item, t) {
  const b = Math.sin(t * 3) * 3;
  c.fillStyle = 'rgba(40,25,60,0.2)'; ell(c, x, y, 12, 4); c.fill();
  c.fillStyle = 'rgba(255,240,140,0.35)'; circ(c, x, y - 16 + b, 18); c.fill();
  c.save(); c.translate(x, y - 16 + b);
  switch (QITEMS[item].art) {
    case 'ball': circ(c, 0, 0, 9); fo(c, '#e8475f'); c.fillStyle = '#fff'; circ(c, -3, -3, 2.5); c.fill(); break;
    case 'bootie': c.beginPath(); c.moveTo(-6, -10); c.lineTo(4, -10); c.lineTo(4, 2); c.quadraticCurveTo(12, 2, 12, 8); c.lineTo(-6, 8); c.closePath(); fo(c, '#4fb8e8'); break;
    case 'jug': c.beginPath(); c.moveTo(-8, 10); c.lineTo(-9, -2); c.quadraticCurveTo(-8, -8, -3, -9); c.lineTo(-3, -13); c.lineTo(3, -13); c.lineTo(3, -9); c.quadraticCurveTo(8, -8, 9, -2); c.lineTo(8, 10); c.closePath(); fo(c, '#d9a46a'); c.fillStyle = '#6fd0f0'; c.fillRect(-6, 0, 12, 6); break;
    case 'key': circ(c, -5, 0, 6); fo(c, '#ffd84d'); c.beginPath(); c.rect(0, -2, 12, 4); fo(c, '#ffd84d', 2); break;
  }
  c.restore();
}

// ---------- the fog over the map, cleared as you explore
const FOGC = 96, FOGW = Math.ceil(WW / FOGC), FOGH = Math.ceil(WH / FOGC);
const Fog = { bits: new Uint8Array(FOGW * FOGH), dirty: true };
Fog.reveal = function (x, y) {
  const R = 7, cx = Math.floor(x / FOGC), cy = Math.floor(y / FOGC);
  if (cx === this.lx && cy === this.ly) return;
  this.lx = cx; this.ly = cy;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    if (i * i + j * j > R * R) continue;
    const X = cx + i, Y = cy + j;
    if (X < 0 || Y < 0 || X >= FOGW || Y >= FOGH) continue;
    const k = Y * FOGW + X;
    if (!this.bits[k]) { this.bits[k] = 1; this.dirty = true; }
  }
};
Fog.save = function () { let s = ''; for (let i = 0; i < this.bits.length; i += 8) { let b = 0; for (let k = 0; k < 8; k++) if (this.bits[i + k]) b |= 1 << k; s += String.fromCharCode(b); } return btoa(s); };
Fog.load = function (str) {
  this.bits = new Uint8Array(FOGW * FOGH); this.dirty = true;
  if (!str) return;
  try { const s = atob(str); for (let i = 0; i < s.length; i++) { const b = s.charCodeAt(i); for (let k = 0; k < 8; k++) if (b & (1 << k) && i * 8 + k < this.bits.length) this.bits[i * 8 + k] = 1; } } catch (e) {}
};
Fog.seen = function (x, y) { const X = Math.floor(x / FOGC), Y = Math.floor(y / FOGC); return X >= 0 && Y >= 0 && X < FOGW && Y < FOGH && this.bits[Y * FOGW + X]; };
