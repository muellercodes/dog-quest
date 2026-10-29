// Input: keyboard, gamepad and touch all feed the same actions.
const ACTIONS = ['atk', 'roll', 't1', 't2', 't3', 't4', 'act', 'menu', 'map', 'up', 'down', 'left', 'right', 'lb', 'rb', 'back'];
const KEYMAP = {
  KeyJ: 'atk', Space: 'atk', KeyK: 'roll', ShiftLeft: 'roll', ShiftRight: 'roll', KeyL: 'roll',
  Digit1: 't1', Digit2: 't2', Digit3: 't3', Digit4: 't4', KeyU: 't1', KeyI: 't2', KeyO: 't3', KeyP: 't4',
  KeyE: 'act', Enter: 'act', Escape: 'menu', Tab: 'menu', KeyM: 'map',
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyQ: 'lb', KeyR: 'rb', Backspace: 'back',
};
const Input = {
  kb: {}, touch: {}, pad: {}, down: {}, prev: {}, hit: {}, queued: {},
  mx: 0, my: 0, stick: { x: 0, y: 0, on: false }, mode: 'kb', padIndex: -1, navRepeat: 0,
};
window.addEventListener('keydown', (e) => {
  const a = KEYMAP[e.code];
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) { if (e.code === 'Escape' || e.code === 'Enter') { Input.queued[a] = 1; } return; }
  if (a) { if (!Input.kb[a]) Input.queued[a] = 1; Input.kb[a] = 1; e.preventDefault(); }
  Input.mode = 'kb';
});
window.addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) Input.kb[a] = 0; });
window.addEventListener('blur', () => { Input.kb = {}; Input.touch = {}; });

Input.update = function () {
  // gamepad
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = pads && Array.from(pads).find((g) => g && g.connected);
  this.pad = {};
  let px = 0, py = 0;
  if (p) {
    const b = (i) => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
    const map = { 0: 'atk', 1: 'roll', 2: 't1', 3: 't2', 4: 't3', 5: 't4', 9: 'menu', 8: 'map', 12: 'up', 13: 'down', 14: 'left', 15: 'right', 6: 'lb', 7: 'rb' };
    for (const i in map) if (b(+i)) { this.pad[map[i]] = 1; this.mode = 'pad'; }
    px = p.axes[0] || 0; py = p.axes[1] || 0;
    const m = Math.hypot(px, py);
    if (m < 0.22) { px = 0; py = 0; } else { this.mode = 'pad'; const k = Math.min(1, (m - 0.22) / 0.7) / m; px *= k; py *= k; }
    this.padStick = { x: px, y: py };
  } else this.padStick = { x: 0, y: 0 };
  // combine
  this.prev = this.down; this.down = {};
  for (const a of ACTIONS) this.down[a] = !!(this.kb[a] || this.pad[a] || this.touch[a]);
  this.hit = {};
  for (const a of ACTIONS) this.hit[a] = (this.down[a] && !this.prev[a]) || !!this.queued[a];
  this.queued = {};
  // menu navigation: stick flicks repeat like key presses
  const nx = px, ny = py;
  this.navRepeat -= 1 / 60;
  if (Math.hypot(nx, ny) > 0.6) {
    if (this.navRepeat <= 0 || !this.navHeld) {
      if (Math.abs(nx) > Math.abs(ny)) this.hit[nx > 0 ? 'right' : 'left'] = true; else this.hit[ny > 0 ? 'down' : 'up'] = true;
      this.navRepeat = this.navHeld ? 0.12 : 0.35; this.navHeld = true;
    }
  } else this.navHeld = false;
  // movement vector
  let mx = (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0), my = (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0);
  if (mx || my) { const l = Math.hypot(mx, my); mx /= l; my /= l; }
  if (this.stick.on) { mx = this.stick.x; my = this.stick.y; }
  if (px || py) { mx = px; my = py; }
  this.mx = mx; this.my = my;
};
Input.clear = function () { this.kb = {}; this.touch = {}; this.queued = {}; this.down = {}; this.prev = {}; this.hit = {}; this.stick.on = false; };

// ---------- touch: a floating stick on the left, buttons (in the page) on the right
const Touch = { id: null, ox: 0, oy: 0, active: false, used: false };
function touchIsUi(t) { const el = document.elementFromPoint(t.clientX, t.clientY); return el && el !== cv && el.closest && el.closest('.ui-hit'); }
cv.addEventListener('touchstart', (e) => {
  Touch.used = true; Input.mode = 'touch'; document.body.classList.add('touchy');
  for (const t of e.changedTouches) {
    if (Touch.id == null && t.clientX < SW * 0.55) {
      Touch.id = t.identifier; Touch.ox = t.clientX; Touch.oy = t.clientY; Touch.x = t.clientX; Touch.y = t.clientY;
      Input.stick.on = true; Input.stick.x = 0; Input.stick.y = 0;
    } else if (t.clientX >= SW * 0.55 && typeof Game !== 'undefined' && Game.state === 'play') {
      // a tap on the open right side swings
      Input.queued.atk = 1;
    }
  }
  e.preventDefault();
}, { passive: false });
cv.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) if (t.identifier === Touch.id) {
    let dx = t.clientX - Touch.ox, dy = t.clientY - Touch.oy;
    const R = 56, l = Math.hypot(dx, dy);
    if (l > R) { Touch.ox += (dx / l) * (l - R); Touch.oy += (dy / l) * (l - R); dx = t.clientX - Touch.ox; dy = t.clientY - Touch.oy; }
    const m = Math.min(1, Math.hypot(dx, dy) / R);
    const a = Math.atan2(dy, dx);
    Input.stick.x = m < 0.15 ? 0 : Math.cos(a) * m; Input.stick.y = m < 0.15 ? 0 : Math.sin(a) * m;
    Touch.x = t.clientX; Touch.y = t.clientY;
  }
  e.preventDefault();
}, { passive: false });
const touchEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === Touch.id) { Touch.id = null; Input.stick.on = false; Input.stick.x = 0; Input.stick.y = 0; } };
cv.addEventListener('touchend', touchEnd); cv.addEventListener('touchcancel', touchEnd);
// mouse: click to swing toward the pointer
cv.addEventListener('mousedown', (e) => { if (e.button === 0 && typeof Game !== 'undefined' && Game.state === 'play') { Input.queued.atk = 1; Input.aimMouse = { x: e.clientX, y: e.clientY, t: performance.now() }; } });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
