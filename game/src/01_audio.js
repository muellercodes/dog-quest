// Sound: every effect and every tune is made on the fly, so there are no audio files.
const Audio_ = { ctx: null, sfx: null, mus: null };
function audioInit() {
  if (Audio_.ctx) { if (Audio_.ctx.state === 'suspended') Audio_.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    Audio_.ctx = C;
    Audio_.sfx = C.createGain(); Audio_.sfx.connect(C.destination);
    Audio_.mus = C.createGain(); Audio_.mus.connect(C.destination);
    const len = C.sampleRate * 1;
    const b = C.createBuffer(1, len, C.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Audio_.noise = b;
    audioVolumes();
  } catch (e) { Audio_.ctx = null; }
}
function audioVolumes() { if (!Audio_.ctx) return; Audio_.sfx.gain.value = SET.sfx * 0.55; Audio_.mus.gain.value = SET.music * 0.32; }
['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, () => { audioInit(); if (Music.want && !Music.cur) Music.play(Music.want); }, { passive: true }));

function tone(type, f0, f1, t0, dur, vol, dest, opts) {
  const C = Audio_.ctx; if (!C) return;
  const o = C.createOscillator(), g = C.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  const a = (opts && opts.attack) || 0.005;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = o;
  if (opts && opts.lp) { const fl = C.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opts.lp; o.connect(fl); node = fl; }
  node.connect(g); g.connect(dest || Audio_.sfx);
  if (opts && opts.detune) o.detune.value = opts.detune;
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(t0, dur, vol, f0, f1, type, dest) {
  const C = Audio_.ctx; if (!C) return;
  const s = C.createBufferSource(); s.buffer = Audio_.noise;
  const fl = C.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(f0, t0); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur); fl.Q.value = 1.2;
  const g = C.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(fl); fl.connect(g); g.connect(dest || Audio_.sfx);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
}
const Sfx = { last: {} };
Sfx.play = function (k) {
  const C = Audio_.ctx; if (!C || SET.sfx <= 0) return;
  const now = C.currentTime;
  if (this.last[k] && now - this.last[k] < 0.03) return;
  this.last[k] = now;
  const t = now + 0.005;
  switch (k) {
    case 'swing': noise(t, 0.09, 0.35, 2400, 700); break;
    case 'hit': tone('square', 190, 70, t, 0.09, 0.25, null, { lp: 900 }); noise(t, 0.05, 0.25, 1500); break;
    case 'crit': tone('square', 220, 80, t, 0.1, 0.28, null, { lp: 1100 }); tone('triangle', 1400, 1900, t, 0.12, 0.15); break;
    case 'hurt': tone('sawtooth', 340, 120, t, 0.18, 0.22, null, { lp: 1200 }); break;
    case 'bark': tone('square', 520, 300, t, 0.07, 0.18, null, { lp: 1400 }); tone('square', 460, 260, t + 0.09, 0.08, 0.16, null, { lp: 1300 }); break;
    case 'coin': tone('sine', 988, 988, t, 0.06, 0.18); tone('sine', 1319, 1319, t + 0.06, 0.12, 0.18); break;
    case 'level': [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, t + i * 0.08, 0.22, 0.2)); break;
    case 'quest': [659, 784, 988].forEach((f, i) => tone('triangle', f, f, t + i * 0.1, 0.25, 0.2)); break;
    case 'chest': [523, 784, 1046, 1568].forEach((f, i) => tone('sine', f, f, t + i * 0.06, 0.3, 0.16)); break;
    case 'roll': noise(t, 0.2, 0.25, 500, 1600, 'lowpass'); break;
    case 'alert': tone('triangle', 880, 1100, t, 0.08, 0.1); break;
    case 'dig': for (let i = 0; i < 3; i++) noise(t + i * 0.18, 0.1, 0.3, 400, 200, 'lowpass'); break;
    case 'boom': tone('sine', 110, 40, t, 0.4, 0.4); noise(t, 0.35, 0.35, 300, 80, 'lowpass'); break;
    case 'beam': tone('sine', 1800, 600, t, 0.25, 0.12); break;
    case 'shoot': tone('triangle', 600, 300, t, 0.08, 0.12); break;
    case 'swipe': noise(t, 0.12, 0.22, 1800, 500); break;
    case 'lock': tone('square', 200, 200, t, 0.06, 0.14, null, { lp: 800 }); tone('square', 150, 150, t + 0.08, 0.1, 0.14, null, { lp: 800 }); break;
    case 'unlock': tone('triangle', 660, 660, t, 0.08, 0.15); tone('triangle', 990, 990, t + 0.08, 0.15, 0.15); break;
    case 'pot': noise(t, 0.15, 0.35, 2500, 900); tone('triangle', 900, 500, t, 0.08, 0.08); break;
    case 'nope': tone('square', 140, 120, t, 0.12, 0.12, null, { lp: 600 }); break;
    case 'vacuum': noise(t, 1.4, 0.18, 300, 1200, 'bandpass'); break;
    case 'bossdown': tone('sine', 90, 30, t, 0.8, 0.5); noise(t, 0.6, 0.4, 400, 60, 'lowpass'); [523, 659, 784, 1046, 1319].forEach((f, i) => tone('triangle', f, f, t + 0.4 + i * 0.1, 0.35, 0.18)); break;
    case 'faint': [523, 466, 392, 330].forEach((f, i) => tone('triangle', f, f, t + i * 0.15, 0.25, 0.18)); break;
    case 'fetch': tone('square', 1200, 1700, t, 0.05, 0.12, null, { lp: 2500 }); tone('square', 1700, 1200, t + 0.06, 0.06, 0.12, null, { lp: 2500 }); break;
    case 'belly': [784, 988, 1175, 1568].forEach((f, i) => tone('sine', f, f, t + i * 0.07, 0.3, 0.12)); break;
    case 'zoom': noise(t, 0.3, 0.3, 800, 3000); tone('sine', 300, 900, t, 0.25, 0.1); break;
    case 'howl': tone('triangle', 300, 620, t, 0.35, 0.18, null, { attack: 0.08 }); tone('triangle', 620, 380, t + 0.35, 0.5, 0.16); break;
    case 'talk': tone('triangle', 500 + Math.random() * 200, 0, t, 0.04, 0.05); break;
    case 'ui': tone('triangle', 700, 900, t, 0.05, 0.1); break;
    case 'buy': tone('sine', 880, 880, t, 0.06, 0.15); tone('sine', 1320, 1320, t + 0.07, 0.15, 0.15); break;
  }
  if (k === 'bark' && false) {}
};
Sfx.trick = function (id) { this.play(id === 'bark' ? 'bark' : id); };

// ---------- music: little looping tunes, one per place
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 1, 4, 5, 7, 8, 10] };
const TRACKS = {
  title: { root: 60, scale: 'major', bpm: 92, prog: [0, 4, 5, 3], lead: 'triangle', seed: 3 },
  field: { root: 67, scale: 'major', bpm: 104, prog: [0, 3, 0, 4, 5, 3, 4, 4], lead: 'triangle', seed: 7 },
  town: { root: 65, scale: 'major', bpm: 96, prog: [0, 5, 3, 4], lead: 'square', seed: 11, walk: 1 },
  forest: { root: 62, scale: 'dorian', bpm: 90, prog: [0, 6, 3, 0], lead: 'triangle', seed: 13 },
  coast: { root: 64, scale: 'major', bpm: 108, prog: [0, 4, 5, 4], lead: 'square', seed: 17 },
  snow: { root: 57, scale: 'minor', bpm: 78, prog: [0, 5, 2, 6], lead: 'sine', seed: 19, bell: 1 },
  desert: { root: 64, scale: 'harm', bpm: 96, prog: [0, 1, 0, 6], lead: 'square', seed: 23 },
  spooky: { root: 62, scale: 'minor', bpm: 74, prog: [0, 5, 3, 4], lead: 'sine', seed: 29, bell: 1 },
  isle: { root: 59, scale: 'minor', bpm: 100, prog: [0, 5, 6, 4], lead: 'square', seed: 31 },
  dungeon: { root: 57, scale: 'minor', bpm: 108, prog: [0, 5, 3, 4], lead: 'square', seed: 37, drums: 1 },
  cave: { root: 64, scale: 'minor', bpm: 92, prog: [0, 3, 0, 4], lead: 'triangle', seed: 41, drums: 1 },
  boss: { root: 62, scale: 'minor', bpm: 144, prog: [0, 5, 6, 4], lead: 'sawtooth', seed: 43, drums: 2 },
  ending: { root: 60, scale: 'major', bpm: 84, prog: [0, 3, 4, 0, 5, 3, 4, 4], lead: 'triangle', seed: 47 },
};
const Music = { cur: null, want: null, timer: null, step: 0, next: 0 };
Music.play = function (name) {
  this.want = name;
  if (!Audio_.ctx) return;
  if (this.cur === name) return;
  this.cur = name;
  const T = TRACKS[name]; if (!T) return;
  // write the tune for this place: 8 bars of eighth notes
  const rng = mulberry32(T.seed), sc = SCALES[T.scale];
  const deg = (d) => T.root + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const bars = 8, mel = [];
  let cur = 7;
  for (let b = 0; b < bars; b++) {
    const ch = T.prog[b % T.prog.length];
    for (let s = 0; s < 8; s++) {
      const r = rng();
      if (s > 0 && r < 0.28) { mel.push(null); continue; }
      const chordTone = [ch, ch + 2, ch + 4][Math.floor(rng() * 3)] + 7;
      cur = s % 2 === 0 ? chordTone : cur + (rng() < 0.5 ? 1 : -1);
      mel.push(deg(cur));
    }
  }
  this.song = { T, mel, deg, bars };
  this.step = 0; this.next = Audio_.ctx.currentTime + 0.1;
  if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
};
Music.stop = function () { this.cur = null; this.song = null; };
Music.tick = function () {
  const C = Audio_.ctx; if (!C || !this.song || SET.music <= 0) return;
  const { T, mel, deg, bars } = this.song, e = 60 / T.bpm / 2;
  while (this.next < C.currentTime + 0.25) {
    const t = this.next, s = this.step % (bars * 8), bar = Math.floor(s / 8), beat = s % 8;
    const ch = T.prog[bar % T.prog.length];
    if (beat === 0) {
      // soft chord pad
      for (const d of [ch, ch + 2, ch + 4]) tone('triangle', NOTE(deg(d)), 0, t, e * 7.5, 0.035, Audio_.mus, { attack: 0.08, lp: 1200 });
    }
    // bass
    if (beat % (T.walk ? 2 : 4) === 0) { const d = T.walk ? ch + [0, 2, 4, 2][beat / 2] : ch; tone('triangle', NOTE(deg(d) - 24), 0, t, e * (T.walk ? 1.8 : 3.6), 0.12, Audio_.mus, { lp: 600 }); }
    // tune
    const n = mel[s];
    if (n) tone(T.lead, NOTE(n), 0, t, e * 0.9, T.lead === 'square' || T.lead === 'sawtooth' ? 0.035 : 0.07, Audio_.mus, { lp: T.lead === 'sawtooth' ? 1600 : 2400 });
    if (T.bell && n && beat % 4 === 2) tone('sine', NOTE(n + 12), 0, t, e * 3, 0.03, Audio_.mus);
    // drums
    if (T.drums) {
      if (beat % 4 === 0) tone('sine', 120, 45, t, 0.18, 0.22, Audio_.mus);
      if (T.drums > 1 && beat % 4 === 2) noise(t, 0.08, 0.12, 1800, 900, 'bandpass', Audio_.mus);
      if (beat % 2 === 1) noise(t, 0.03, 0.05, 7000, 0, 'highpass', Audio_.mus);
    }
    this.next += e; this.step++;
  }
};
