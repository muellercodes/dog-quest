// Towns: buildings, their art, and where everything stands.
const WALLS = ['#f6e7c8', '#cfe6f2', '#f6d2d8', '#d8efcf', '#efe0f7'];
const ROOFS = ['#d9534f', '#4f7fd9', '#a8693f', '#4fa86a', '#8a5fc9'];
const BLD = {
  house: { w: 140, h: 140, ox: 70, oy: 130, foot: [108, 52] },
  inn: { w: 190, h: 160, ox: 95, oy: 150, foot: [160, 60] },
  smith: { w: 160, h: 150, ox: 80, oy: 140, foot: [126, 54] },
  trainer: { w: 160, h: 160, ox: 80, oy: 150, foot: [126, 54] },
  castle: { w: 460, h: 360, ox: 230, oy: 345, foot: [420, 150] },
  board: { w: 80, h: 80, ox: 40, oy: 74, foot: [56, 12] },
  well: { w: 60, h: 66, ox: 30, oy: 58, foot: [40, 18] },
  stall: { w: 110, h: 96, ox: 55, oy: 88, foot: [86, 26] },
  tent: { w: 110, h: 90, ox: 55, oy: 82, foot: [84, 30] },
  hut: { w: 140, h: 140, ox: 70, oy: 130, foot: [100, 50] },
  fountain: { w: 130, h: 110, ox: 65, oy: 80, foot: [100, 34] },
  sign: { w: 60, h: 64, ox: 30, oy: 58, foot: [10, 8] },
  campfire: { w: 60, h: 50, ox: 30, oy: 36, foot: [30, 14] },
  boat: { w: 170, h: 150, ox: 85, oy: 115, foot: [0, 0] },
  oak: { w: 300, h: 300, ox: 150, oy: 280, foot: [120, 60] },
  grotto: { w: 200, h: 190, ox: 100, oy: 175, foot: [150, 50] },
  icecave: { w: 200, h: 160, ox: 100, oy: 145, foot: [150, 50] },
  purramid: { w: 300, h: 250, ox: 150, oy: 235, foot: [250, 90] },
  keep: { w: 360, h: 330, ox: 180, oy: 315, foot: [300, 120] },
  burrow: { w: 130, h: 90, ox: 65, oy: 76, foot: [90, 26] },
  kennel: { w: 170, h: 160, ox: 85, oy: 150, foot: [130, 54] },
};

const BldArt = {
  house(g, v, opt) {
    const wall = WALLS[v % 5], roof = opt.roof || ROOFS[(v + 2) % 5], snow = opt.snow;
    shadowEl(g, 66, 12);
    g.beginPath(); g.rect(-52, -64, 104, 64); fo(g, wall);
    g.beginPath(); g.rect(-52, -10, 104, 10); fo(g, '#c9b6a0');
    // arched doghouse doorway
    g.beginPath(); g.moveTo(-15, 0); g.lineTo(-15, -26); g.arc(0, -26, 15, Math.PI, 0); g.lineTo(15, 0); g.closePath(); fo(g, '#5a3550');
    // round windows
    for (const x of [-34, 34]) { circ(g, x, -38, 10); fo(g, '#ffe7a3'); g.strokeStyle = OUT; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - 10, -38); g.lineTo(x + 10, -38); g.moveTo(x, -48); g.lineTo(x, -28); g.stroke(); }
    // roof
    g.beginPath(); g.moveTo(-66, -56); g.lineTo(0, -122); g.lineTo(66, -56); g.quadraticCurveTo(0, -48, -66, -56); fo(g, roof);
    g.strokeStyle = shade(roof, -0.2); g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const y = -56 - i * 15, w = 66 - i * 15; g.beginPath(); g.moveTo(-w, y + 2); g.quadraticCurveTo(0, y + 7, w, y + 2); g.stroke(); }
    if (snow) { g.beginPath(); g.moveTo(-40, -82); g.lineTo(0, -122); g.lineTo(40, -82); g.quadraticCurveTo(20, -76, 8, -84); g.quadraticCurveTo(-6, -74, -18, -84); g.quadraticCurveTo(-30, -76, -40, -82); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    // little bone above the door
    drawBone(g, 0, -50, 20, 0, '#fff6e0', 1.6);
    g.beginPath(); g.rect(30, -112, 14, 30); fo(g, '#b56a4a');
  },
  inn(g, v, opt) {
    shadowEl(g, 90, 14);
    const wall = '#f3dcb8', roof = opt.snow ? '#7f8fb8' : '#4f6fc9';
    g.beginPath(); g.rect(-75, -78, 150, 78); fo(g, wall);
    g.beginPath(); g.rect(-75, -12, 150, 12); fo(g, '#c9b6a0');
    for (let x = -60; x <= 60; x += 30) { g.beginPath(); g.rect(x - 2, -78, 4, 66); g.fillStyle = '#d9bf98'; g.fill(); }
    g.beginPath(); g.moveTo(-18, 0); g.lineTo(-18, -32); g.arc(0, -32, 18, Math.PI, 0); g.lineTo(18, 0); g.closePath(); fo(g, '#5a3550');
    for (const x of [-48, 48]) { g.beginPath(); rrect(g, x - 13, -58, 26, 24, 5); fo(g, '#ffe7a3'); g.strokeStyle = OUT; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, -58); g.lineTo(x, -34); g.stroke(); }
    g.beginPath(); g.moveTo(-90, -70); g.lineTo(-56, -140); g.lineTo(56, -140); g.lineTo(90, -70); g.quadraticCurveTo(0, -60, -90, -70); fo(g, roof);
    if (opt.snow) { g.beginPath(); g.moveTo(-70, -112); g.lineTo(-56, -140); g.lineTo(56, -140); g.lineTo(70, -112); g.quadraticCurveTo(30, -104, 10, -114); g.quadraticCurveTo(-20, -102, -70, -112); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    // sign: moon and Zzz
    g.beginPath(); rrect(g, -30, -100, 60, 24, 6); fo(g, '#fff3d6', 2);
    g.beginPath(); g.arc(-15, -88, 7, 0.4, Math.PI * 1.6 + 0.4); g.arc(-12, -90, 5.5, Math.PI * 1.55 + 0.4, 0.45, true); g.closePath(); g.fillStyle = '#f2c14a'; g.fill();
    g.fillStyle = '#4f6fc9'; g.font = 'bold 13px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('INN', 8, -83);
  },
  smith(g, v, opt) {
    shadowEl(g, 76, 13);
    g.beginPath(); g.rect(-58, -70, 116, 70); fo(g, '#d6c7b4');
    g.fillStyle = '#c4b39e'; for (let y = -62; y < -10; y += 12) for (let x = -54 + ((y / 12) & 1) * 10; x < 50; x += 22) { g.beginPath(); rrect(g, x, y, 18, 9, 3); g.fill(); }
    g.beginPath(); g.rect(-58, -10, 116, 10); fo(g, '#a89580');
    g.beginPath(); g.moveTo(-16, 0); g.lineTo(-16, -30); g.arc(0, -30, 16, Math.PI, 0); g.lineTo(16, 0); g.closePath(); fo(g, '#5a3550');
    g.fillStyle = 'rgba(255,140,60,0.55)'; circ(g, 0, -12, 9); g.fill();
    g.beginPath(); g.moveTo(-72, -62); g.lineTo(-40, -126); g.lineTo(40, -126); g.lineTo(72, -62); g.quadraticCurveTo(0, -54, -72, -62); fo(g, opt.snow ? '#8a8fa8' : '#6b5a7a');
    if (opt.snow) { g.beginPath(); g.moveTo(-56, -96); g.lineTo(-40, -126); g.lineTo(40, -126); g.lineTo(56, -96); g.quadraticCurveTo(0, -88, -56, -96); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    g.beginPath(); g.rect(28, -138, 16, 34); fo(g, '#8a7a8a');
    // sign: anvil
    g.beginPath(); rrect(g, -26, -98, 52, 24, 6); fo(g, '#fff3d6', 2);
    g.beginPath(); g.moveTo(-14, -90); g.lineTo(12, -90); g.lineTo(16, -86); g.lineTo(6, -86); g.lineTo(6, -82); g.lineTo(10, -79); g.lineTo(-8, -79); g.lineTo(-4, -82); g.lineTo(-4, -86); g.lineTo(-12, -86); g.closePath(); g.fillStyle = '#5a5a6e'; g.fill();
    // anvil outside
    g.beginPath(); g.moveTo(34, -2); g.lineTo(52, -2); g.lineTo(48, -10); g.lineTo(56, -14); g.lineTo(56, -19); g.lineTo(30, -19); g.lineTo(30, -14); g.lineTo(38, -10); g.closePath(); fo(g, '#6a6a80', 2);
  },
  trainer(g, v, opt) {
    shadowEl(g, 76, 13);
    g.beginPath(); g.rect(-58, -72, 116, 72); fo(g, '#e8dcf7');
    g.beginPath(); g.rect(-58, -10, 116, 10); fo(g, '#c4b3d8');
    g.beginPath(); g.moveTo(-16, 0); g.lineTo(-16, -30); g.arc(0, -30, 16, Math.PI, 0); g.lineTo(16, 0); g.closePath(); fo(g, '#5a3550');
    for (const x of [-38, 38]) { circ(g, x, -42, 10); fo(g, '#ffe7a3'); }
    // wizard-hat roof with stars
    g.beginPath(); g.moveTo(-74, -64); g.quadraticCurveTo(-20, -82, -6, -150); g.quadraticCurveTo(10, -158, 22, -146); g.quadraticCurveTo(14, -140, 12, -132); g.quadraticCurveTo(30, -90, 74, -64); g.quadraticCurveTo(0, -54, -74, -64); fo(g, opt.snow ? '#6f7fc9' : '#7b55c9');
    if (opt.snow) { g.beginPath(); g.moveTo(-74, -64); g.quadraticCurveTo(0, -54, 74, -64); g.quadraticCurveTo(40, -72, 20, -66); g.quadraticCurveTo(-10, -76, -40, -68); g.quadraticCurveTo(-60, -72, -74, -64); g.fillStyle = '#fff'; g.fill(); }
    g.fillStyle = '#ffd84d';
    const star = (x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    star(-24, -88, 7); star(18, -100, 6); star(-4, -118, 5); star(36, -76, 5);
    // hoop
    g.beginPath(); g.ellipse(60, -24, 10, 14, 0, 0, TAU); g.lineWidth = 3; g.strokeStyle = '#e8475f'; g.stroke();
    g.beginPath(); g.moveTo(60, -10); g.lineTo(60, 0); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke();
  },
  castle(g, v, opt) {
    shadowEl(g, 220, 30);
    const st = '#ece2cb', st2 = '#d8cbb0', rf = '#d9534f';
    const tower = (x, w, h) => {
      g.beginPath(); g.rect(x - w / 2, -h, w, h); fo(g, st);
      g.fillStyle = st2; for (let y = -h + 14; y < -8; y += 18) { g.beginPath(); rrect(g, x - w / 2 + 6, y, w - 12, 7, 3); g.fill(); }
      g.beginPath(); g.moveTo(x - w / 2 - 8, -h + 2); g.lineTo(x, -h - w * 1.05); g.lineTo(x + w / 2 + 8, -h + 2); g.closePath(); fo(g, rf);
      g.beginPath(); g.moveTo(x, -h - w * 1.05); g.lineTo(x, -h - w * 1.05 - 22); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.moveTo(x, -h - w * 1.05 - 22); g.lineTo(x + 18, -h - w * 1.05 - 16); g.lineTo(x, -h - w * 1.05 - 10); g.closePath(); fo(g, '#ffd84d', 1.6);
      g.beginPath(); rrect(g, x - 7, -h + 22, 14, 20, 7); fo(g, '#ffe7a3', 2);
    };
    // back keep
    g.beginPath(); g.rect(-120, -230, 240, 150); fo(g, st);
    for (let x = -120; x < 120; x += 24) { g.beginPath(); g.rect(x, -246, 14, 18); fo(g, st, 2); }
    tower(-70, 54, 270); tower(70, 54, 270);
    tower(-190, 66, 190); tower(190, 66, 190);
    // front wall
    g.beginPath(); g.rect(-160, -120, 320, 120); fo(g, st);
    g.fillStyle = st2; for (let y = -110; y < -10; y += 20) for (let x = -150 + ((y / 20) & 1) * 14; x < 145; x += 30) { g.beginPath(); rrect(g, x, y, 24, 9, 3); g.fill(); }
    for (let x = -160; x < 160; x += 26) { g.beginPath(); g.rect(x, -134, 15, 16); fo(g, st, 2); }
    // gate
    g.beginPath(); g.moveTo(-34, 0); g.lineTo(-34, -60); g.arc(0, -60, 34, Math.PI, 0); g.lineTo(34, 0); g.closePath(); fo(g, '#5a3550');
    g.strokeStyle = '#8a6a50'; g.lineWidth = 3; for (let x = -26; x <= 26; x += 13) { g.beginPath(); g.moveTo(x, -2); g.lineTo(x, -80 + Math.abs(x) * 0.5); g.stroke(); }
    // banners with paw prints
    for (const x of [-100, 100]) {
      g.beginPath(); g.moveTo(x - 16, -112); g.lineTo(x + 16, -112); g.lineTo(x + 16, -50); g.lineTo(x, -60); g.lineTo(x - 16, -50); g.closePath(); fo(g, '#4f6fc9');
      drawPaw(g, x, -84, 9, '#ffd84d');
    }
  },
  board(g) {
    shadowEl(g, 30, 6);
    for (const x of [-22, 22]) { g.beginPath(); g.rect(x - 3, -40, 6, 40); fo(g, '#9a6a45', 2); }
    g.beginPath(); rrect(g, -32, -70, 64, 38, 4); fo(g, '#c08a58');
    g.fillStyle = '#fff6e0'; for (const [x, y, a] of [[-18, -60, -0.1], [2, -62, 0.08], [18, -52, -0.05], [-6, -46, 0.1]]) { g.save(); g.translate(x, y); g.rotate(a); g.fillRect(-8, -7, 16, 14); g.strokeStyle = '#c9b089'; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, -3); g.lineTo(5, -3); g.moveTo(-5, 1); g.lineTo(4, 1); g.stroke(); g.restore(); }
    g.fillStyle = '#e8475f'; circ(g, -18, -66, 2); g.fill(); circ(g, 2, -68, 2); g.fill();
    g.fillStyle = '#ffd84d'; g.font = 'bold 16px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.strokeStyle = OUT; g.lineWidth = 3; g.strokeText('!', 26, -66); g.fillText('!', 26, -66);
  },
  well(g) {
    shadowEl(g, 26, 7);
    g.beginPath(); g.ellipse(0, -14, 22, 9, 0, 0, TAU); g.rect(-22, -14, 44, 14); fo(g, '#b9b4c8');
    g.beginPath(); g.ellipse(0, -14, 16, 6, 0, 0, TAU); g.fillStyle = '#3b6fb0'; g.fill();
    for (const x of [-18, 18]) { g.beginPath(); g.rect(x - 2.5, -48, 5, 34); fo(g, '#9a6a45', 2); }
    g.beginPath(); g.moveTo(-26, -44); g.lineTo(0, -60); g.lineTo(26, -44); g.closePath(); fo(g, '#d9534f', 2);
  },
  stall(g, v) {
    shadowEl(g, 50, 9);
    g.beginPath(); g.rect(-42, -34, 84, 34); fo(g, '#c08a58');
    g.fillStyle = ['#ff8f5a', '#7fd36a', '#ffd84d'][v % 3]; for (let x = -34; x < 34; x += 14) { circ(g, x + 6, -38, 6); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke(); }
    for (const x of [-40, 40]) { g.beginPath(); g.rect(x - 2, -80, 4, 46); fo(g, '#9a6a45', 2); }
    g.beginPath(); g.moveTo(-50, -66); g.lineTo(-44, -84); g.lineTo(44, -84); g.lineTo(50, -66); g.closePath(); fo(g, '#fff');
    g.fillStyle = ['#e8475f', '#4f7fd9', '#4fa86a'][v % 3]; for (let x = -44; x < 44; x += 22) { g.beginPath(); g.moveTo(x, -84); g.lineTo(x + 11, -84); g.lineTo(x + 13, -66); g.lineTo(x - 1, -66); g.fill(); }
  },
  tent(g, v) {
    shadowEl(g, 50, 9);
    g.beginPath(); g.moveTo(-46, 0); g.lineTo(0, -70); g.lineTo(46, 0); g.closePath(); fo(g, v % 2 ? '#e8a04f' : '#5fa24c');
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(0, -40); g.lineTo(12, 0); g.closePath(); fo(g, '#5a3550', 2);
  },
  hut(g, v, opt) {
    shadowEl(g, 60, 11);
    g.beginPath(); g.moveTo(-48, 0); g.lineTo(-44, -62); g.lineTo(46, -58); g.lineTo(48, 0); g.closePath(); fo(g, '#8f8aa5');
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(-14, -26); g.arc(0, -26, 14, Math.PI, 0); g.lineTo(14, 0); g.closePath(); fo(g, '#3a2a48');
    circ(g, -28, -38, 8); fo(g, '#b6e46a'); circ(g, 28, -38, 8); fo(g, '#b6e46a');
    g.beginPath(); g.moveTo(-62, -52); g.lineTo(-4, -124); g.lineTo(8, -112); g.lineTo(62, -54); g.quadraticCurveTo(0, -46, -62, -52); fo(g, '#5a4a78');
    if (opt.label) { g.beginPath(); rrect(g, -26, -92, 52, 20, 5); fo(g, '#e8dcf7', 2); g.fillStyle = '#5a4a78'; g.font = 'bold 11px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(opt.label, 0, -78); }
  },
  fountain(g) {
    shadowEl(g, 60, 12);
    g.beginPath(); g.ellipse(0, -14, 56, 20, 0, 0, TAU); g.rect(-56, -14, 112, 14); fo(g, '#cfc6dc');
    g.beginPath(); g.ellipse(0, -16, 46, 14, 0, 0, TAU); g.fillStyle = '#6fd0f0'; g.fill();
    g.beginPath(); g.rect(-8, -50, 16, 36); fo(g, '#cfc6dc', 2);
    // a stone dog on top, nose up
    g.beginPath(); g.ellipse(0, -58, 14, 9, 0, 0, TAU); fo(g, '#d8d0e6', 2); circ(g, 10, -70, 8); fo(g, '#d8d0e6', 2);
    g.beginPath(); g.ellipse(16, -74, 6, 4, -0.5, 0, TAU); fo(g, '#d8d0e6', 2); g.beginPath(); g.ellipse(4, -76, 3, 7, 0.4, 0, TAU); fo(g, '#c4bcd6', 2);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(20, -78); g.quadraticCurveTo(34, -96, 40, -30); g.stroke();
  },
  sign(g, v, opt) {
    shadowEl(g, 12, 4);
    g.beginPath(); g.rect(-3, -36, 6, 36); fo(g, '#9a6a45', 2);
    g.beginPath(); g.moveTo(-26, -54); g.lineTo(20, -54); g.lineTo(28, -45); g.lineTo(20, -36); g.lineTo(-26, -36); g.closePath(); fo(g, '#d9a46a', 2);
    g.strokeStyle = '#a8763f'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-18, -48); g.lineTo(14, -48); g.moveTo(-18, -42); g.lineTo(8, -42); g.stroke();
  },
  campfire(g) {
    g.fillStyle = 'rgba(40,25,60,0.2)'; ell(g, 0, 0, 22, 6); g.fill();
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; circ(g, Math.cos(a) * 18, Math.sin(a) * 6 - 2, 5); fo(g, '#a7a8b8', 1.8); }
    g.beginPath(); g.rect(-14, -8, 28, 5); fo(g, '#9a6a45', 1.8);
  },
  boat(g) {
    g.beginPath(); g.moveTo(-74, -30); g.lineTo(74, -30); g.quadraticCurveTo(66, 4, 40, 6); g.lineTo(-44, 6); g.quadraticCurveTo(-70, 2, -74, -30); fo(g, '#b06a45');
    g.beginPath(); g.rect(-74, -36, 148, 8); fo(g, '#ffffff', 2);
    g.beginPath(); g.rect(-4, -110, 6, 80); fo(g, '#8a5a34', 2);
    g.beginPath(); g.moveTo(4, -106); g.quadraticCurveTo(50, -80, 4, -42); g.closePath(); fo(g, '#fff6e0', 2);
    drawPaw(g, 18, -74, 8, '#4f6fc9');
  },
  oak(g, v, opt) {
    shadowEl(g, 130, 22);
    g.beginPath(); g.moveTo(-60, 0); g.quadraticCurveTo(-40, -40, -44, -120); g.lineTo(44, -120); g.quadraticCurveTo(40, -40, 60, 0); g.closePath(); fo(g, '#8a5a3c');
    g.strokeStyle = '#6d4530'; g.lineWidth = 2; for (const x of [-30, -12, 14, 30]) { g.beginPath(); g.moveTo(x, -6); g.quadraticCurveTo(x + 4, -60, x - 2, -116); g.stroke(); }
    g.beginPath(); g.moveTo(-24, 0); g.lineTo(-24, -40); g.arc(0, -40, 24, Math.PI, 0); g.lineTo(24, 0); g.closePath(); fo(g, '#3a2236');
    blobShape(g, [[-80, -150, 60], [80, -150, 60], [0, -200, 75], [-40, -120, 45], [45, -120, 45], [0, -150, 70]], '#4c9a43', '#66b553');
    g.fillStyle = '#b5773e'; for (const [x, y] of [[-60, -150], [50, -170], [10, -215], [70, -130], [-20, -180]]) { g.beginPath(); g.ellipse(x, y, 6, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#7a4f2a'; g.beginPath(); g.ellipse(x, y - 6, 7, 3.5, 0, 0, TAU); g.fill(); g.fillStyle = '#b5773e'; }
  },
  grotto(g) {
    shadowEl(g, 90, 16);
    g.beginPath(); g.moveTo(-90, 0); g.quadraticCurveTo(-100, -90, -40, -118); g.quadraticCurveTo(10, -138, 60, -110); g.quadraticCurveTo(104, -80, 92, 0); g.closePath(); fo(g, '#8f97ad');
    g.beginPath(); g.moveTo(-36, 0); g.quadraticCurveTo(-40, -70, 0, -74); g.quadraticCurveTo(40, -70, 36, 0); g.closePath(); fo(g, '#24324a');
    g.fillStyle = '#a7b0c8'; for (const [x, y, r] of [[-60, -80, 14], [50, -90, 12], [-20, -110, 10], [70, -40, 10]]) { circ(g, x, y, r); g.fill(); }
    g.fillStyle = '#5fb848'; for (const [x, y] of [[-70, -30], [-60, -18], [76, -20]]) { ell(g, x, y, 8, 4); g.fill(); }
    // pirate flag
    g.beginPath(); g.moveTo(40, -118); g.lineTo(40, -160); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.moveTo(40, -160); g.lineTo(72, -152); g.lineTo(40, -138); g.closePath(); fo(g, '#2b2b3a', 2);
    g.fillStyle = '#fff'; circ(g, 52, -150, 4); g.fill(); g.beginPath(); g.moveTo(48, -153); g.lineTo(49, -158); g.lineTo(51, -154); g.moveTo(53, -154); g.lineTo(55, -158); g.lineTo(56, -153); g.fill();
  },
  icecave(g) {
    shadowEl(g, 90, 16);
    g.beginPath(); g.moveTo(-92, 0); g.quadraticCurveTo(-96, -100, -30, -120); g.quadraticCurveTo(30, -134, 78, -100); g.quadraticCurveTo(100, -60, 92, 0); g.closePath(); fo(g, '#c6e6f7');
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-80, -70); g.quadraticCurveTo(-60, -120, 0, -124); g.quadraticCurveTo(60, -120, 80, -80); g.quadraticCurveTo(0, -100, -80, -70); g.fill();
    g.beginPath(); g.moveTo(-38, 0); g.quadraticCurveTo(-42, -72, 0, -76); g.quadraticCurveTo(42, -72, 38, 0); g.closePath(); fo(g, '#2d4a6e');
    g.fillStyle = '#e8f6ff'; for (let x = -30; x <= 30; x += 12) { g.beginPath(); g.moveTo(x - 5, -70 + Math.abs(x) * 0.6); g.lineTo(x, -52 + Math.abs(x) * 0.6); g.lineTo(x + 5, -70 + Math.abs(x) * 0.6); g.fill(); }
  },
  purramid(g) {
    shadowEl(g, 150, 22);
    g.beginPath(); g.moveTo(-145, 0); g.lineTo(0, -190); g.lineTo(145, 0); g.closePath(); fo(g, '#f0c878', 3);
    g.beginPath(); g.moveTo(0, -190); g.lineTo(145, 0); g.lineTo(30, 0); g.closePath(); g.fillStyle = '#ddb064'; g.fill();
    g.strokeStyle = '#c99a50'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { const y = -i * 30, w = 145 - i * 23; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); }
    // cat ears and face
    g.beginPath(); g.moveTo(-36, -150); g.lineTo(-26, -210); g.lineTo(-6, -170); g.closePath(); fo(g, '#f0c878');
    g.beginPath(); g.moveTo(36, -150); g.lineTo(26, -210); g.lineTo(6, -170); g.closePath(); fo(g, '#ddb064');
    g.fillStyle = '#3a8fd9'; for (const x of [-18, 18]) { g.beginPath(); g.ellipse(x, -130, 9, 6, 0, 0, TAU); g.fill(); g.fillStyle = OUT; g.beginPath(); g.ellipse(x, -130, 2.5, 5.5, 0, 0, TAU); g.fill(); g.fillStyle = '#3a8fd9'; }
    g.beginPath(); g.moveTo(-26, 0); g.lineTo(-26, -40); g.arc(0, -40, 26, Math.PI, 0); g.lineTo(26, 0); g.closePath(); fo(g, '#3a2236');
  },
  keep(g) {
    shadowEl(g, 170, 26);
    const st = '#7a5f8f', st2 = '#6a4f7f';
    const tower = (x, w, h) => {
      g.beginPath(); g.rect(x - w / 2, -h, w, h); fo(g, st);
      g.beginPath(); g.moveTo(x - w / 2 - 6, -h); g.lineTo(x - w / 2 + 4, -h - 46); g.lineTo(x, -h - 14); g.lineTo(x + w / 2 - 4, -h - 46); g.lineTo(x + w / 2 + 6, -h); g.closePath(); fo(g, '#4a3a6a');
      g.fillStyle = '#ffd84d'; for (const dx of [-8, 8]) { g.beginPath(); g.ellipse(x + dx, -h + 30, 5, 4, 0, 0, TAU); g.fill(); }
      g.fillStyle = OUT; for (const dx of [-8, 8]) { g.beginPath(); g.ellipse(x + dx, -h + 30, 1.5, 3.5, 0, 0, TAU); g.fill(); }
    };
    g.beginPath(); g.rect(-110, -220, 220, 150); fo(g, st);
    tower(-60, 60, 280); tower(60, 60, 280); tower(-150, 60, 180); tower(150, 60, 180);
    g.beginPath(); g.rect(-130, -110, 260, 110); fo(g, st);
    g.fillStyle = st2; for (let y = -100; y < -10; y += 20) for (let x = -122 + ((y / 20) & 1) * 14; x < 115; x += 30) { g.beginPath(); rrect(g, x, y, 24, 9, 3); g.fill(); }
    g.beginPath(); g.moveTo(-34, 0); g.lineTo(-34, -56); g.arc(0, -56, 34, Math.PI, 0); g.lineTo(34, 0); g.closePath(); fo(g, '#2a1a36');
    for (const x of [-86, 86]) { g.beginPath(); g.moveTo(x - 14, -100); g.lineTo(x + 14, -100); g.lineTo(x + 14, -44); g.lineTo(x, -54); g.lineTo(x - 14, -44); g.closePath(); fo(g, '#c94a7a'); drawFishBone(g, x, -76, 9); }
  },
  burrow(g) {
    shadowEl(g, 60, 10);
    g.beginPath(); g.moveTo(-58, 0); g.quadraticCurveTo(-50, -54, 0, -58); g.quadraticCurveTo(50, -54, 58, 0); g.closePath(); fo(g, '#a87a50');
    g.fillStyle = '#c4935f'; g.beginPath(); g.ellipse(-14, -38, 24, 10, -0.2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, -8, 24, 18, 0, Math.PI, 0); g.lineTo(24, 0); g.lineTo(-24, 0); g.closePath(); fo(g, '#2a1a26', 2.4);
    g.fillStyle = '#5fa24c'; for (const [x, y] of [[-40, -14], [44, -20], [30, -44]]) { ell(g, x, y, 7, 3.5); g.fill(); }
  },
  kennel(g, v, opt) {
    shadowEl(g, 80, 13);
    const wall = opt.spooky ? '#8a7f9f' : '#b99a74';
    g.beginPath(); g.rect(-62, -76, 124, 76); fo(g, wall);
    g.strokeStyle = shade(wall, -0.2); g.lineWidth = 2; for (let y = -64; y < 0; y += 12) { g.beginPath(); g.moveTo(-62, y); g.lineTo(62, y); g.stroke(); }
    g.beginPath(); g.moveTo(-26, 0); g.lineTo(-26, -36); g.arc(0, -36, 26, Math.PI, 0); g.lineTo(26, 0); g.closePath(); fo(g, '#2a1a26');
    g.beginPath(); g.moveTo(-78, -68); g.lineTo(0, -146); g.lineTo(78, -68); g.quadraticCurveTo(0, -60, -78, -68); fo(g, opt.spooky ? '#4a3a6a' : '#7a5a4a');
    g.beginPath(); rrect(g, -30, -100, 60, 18, 4); fo(g, '#e8d8c0', 2);
    g.fillStyle = '#a8463a'; g.font = 'bold 10px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(opt.spooky ? 'BOO!' : 'KEEP OUT', 0, -87);
    if (opt.spooky) { g.fillStyle = 'rgba(200,255,150,0.8)'; for (const x of [-8, 8]) { g.beginPath(); g.ellipse(x, -18, 3.5, 2.5, 0, 0, TAU); g.fill(); } }
  },
};

function drawPaw(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.62, r * 0.5, 0, 0, TAU); g.fill();
  for (const [dx, dy] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) { circ(g, x + dx * r, y + dy * r, r * 0.24); g.fill(); }
}
function drawFishBone(g, x, y, r) {
  g.strokeStyle = '#fff6e0'; g.lineWidth = r * 0.22;
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r * 0.7, y); g.stroke();
  for (let i = -2; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * r * 0.35, y - r * 0.45); g.lineTo(x + i * r * 0.35, y + r * 0.45); g.stroke(); }
  g.fillStyle = '#fff6e0'; g.beginPath(); g.moveTo(x + r * 0.6, y); g.lineTo(x + r * 1.15, y - r * 0.4); g.lineTo(x + r * 1.15, y + r * 0.4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r * 1.4, y - r * 0.4); g.lineTo(x - r * 1.4, y + r * 0.4); g.closePath(); g.fill();
}

function bldSprite(b) {
  const d = BLD[b.bk];
  return sprite('b:' + b.bk + ':' + b.v + ':' + (b.opt.snow ? 1 : 0) + (b.opt.spooky ? 1 : 0) + (b.opt.label || ''), d.w, d.h, d.ox, d.oy, (g) => BldArt[b.bk](g, b.v, b.opt));
}

// town layouts: [kind, dx, dy, variant, extra]
const TOWN_LAYOUT = {
  waggington: [['inn', -175, -95], ['trainer', 175, -105, 0, { svc: 'trainer' }], ['house', -30, -205, 1, { home: 'barkley' }], ['house', 95, 135, 2], ['house', -205, 110, 3], ['house', 215, 95, 4],
    ['board', 50, -20], ['well', -55, 45], ['lamp', -95, -10], ['lamp', 120, 20], ['stall', 0, 210, 1]],
  barkingham: [['castle', 0, -215, 0, { svc: 'castle' }], ['fountain', 0, 70], ['inn', -275, -40], ['smith', 275, -40, 0, { svc: 'smith' }], ['trainer', -250, 205, 0, { svc: 'trainer' }],
    ['board', 105, 150], ['house', 245, 215, 1], ['house', -40, 300, 2], ['house', 150, 320, 3], ['stall', -120, 150, 0], ['stall', 190, 80, 2], ['lamp', -80, 50], ['lamp', 80, 30], ['lamp', -170, 260]],
  fetchwick: [['inn', -170, -120], ['smith', 140, -150, 0, { svc: 'smith' }], ['trainer', -215, 115, 0, { svc: 'trainer' }], ['board', 30, 30], ['house', 190, 110, 1], ['house', -10, -230, 3], ['house', 40, 210, 4],
    ['stall', -60, 130, 0], ['lamp', -60, -40], ['lamp', 100, -20]],
  frostpaw: [['inn', -140, -70, 0, { snow: 1 }], ['trainer', 140, -90, 0, { svc: 'trainer', snow: 1 }], ['smith', 10, -190, 0, { svc: 'smith', snow: 1 }], ['board', 0, 50], ['house', -160, 130, 1, { snow: 1 }], ['house', 165, 120, 2, { snow: 1 }], ['lamp', -40, -20], ['lamp', 60, 100]],
  dunehound: [['inn', -150, -90], ['smith', 150, -90, 0, { svc: 'smith' }], ['trainer', -135, 130, 0, { svc: 'trainer' }], ['board', 60, 40], ['house', 165, 130, 3], ['stall', 0, -150, 2], ['well', -20, 70]],
  howlow: [['hut', -120, -50, 0, { label: 'INN', inn: 1 }], ['hut', 125, -70, 1], ['board', 0, 60], ['hut', 105, 120, 2], ['lamp', -40, 10]],
  camp: [['tent', -70, -50, 0], ['tent', 75, -30, 1], ['campfire', 0, 30], ['board', -40, 90]],
  landing: [['sign', 40, -60]],
};
const INN_KINDS = { inn: 1 };

// where the roads leave each town, so no house sits on one
function roadExits(T) {
  const out = [];
  for (const poly of World.roadPolys) for (const end of [0, 1]) {
    const pts = end ? poly.slice().reverse() : poly;
    if (dist(pts[0][0], pts[0][1], T.x, T.y) > 30) continue;
    const q = pts.find((p) => dist(p[0], p[1], T.x, T.y) > T.r * 0.55) || pts[pts.length - 1];
    out.push(angTo(T.x, T.y, q[0], q[1]));
  }
  // roads that pass through a town on their way somewhere
  for (const poly of World.roadPolys) for (let i = 1; i < poly.length - 1; i++) {
    const p = poly[i];
    if (dist(p[0], p[1], T.x, T.y) < T.r * 0.3) { const a = poly[Math.max(0, i - 3)], b = poly[Math.min(poly.length - 1, i + 3)]; out.push(angTo(T.x, T.y, a[0], a[1]), angTo(T.x, T.y, b[0], b[1])); }
  }
  return out;
}
World.buildTowns = function () {
  this.blds = [];
  this.inters = [];
  for (const id in TOWN_LAYOUT) {
    const T = TOWNS[id], exits = roadExits(T);
    for (const [kind, dx0, dy0, v, extra] of TOWN_LAYOUT[id]) {
      let dx = dx0, dy = dy0;
      // swing a building around the town centre until it is off the road
      const big = kind !== 'lamp' && kind !== 'sign' && BLD[kind] ? BLD[kind].foot[0] : 0;
      if (big && kind !== 'castle') {
        const d = Math.hypot(dx, dy);
        for (let k = 0; k < 3; k++) {
          const a = Math.atan2(dy, dx), need = Math.atan((big / 2 + 36) / Math.max(60, d));
          const e = exits.find((ex) => Math.abs(angDiff(ex, a)) < need);
          if (e == null) break;
          const na = e + (angDiff(e, a) >= 0 ? need + 0.05 : -need - 0.05);
          dx = Math.cos(na) * d; dy = Math.sin(na) * d;
        }
      }
      const x = T.x + dx, y = T.y + dy, opt = Object.assign({}, extra || {});
      if (T.biome === 'snow') opt.snow = 1;
      if (kind === 'lamp') { this.addProp(propAt('lamp', x, y)); continue; }
      const d = BLD[kind];
      const b = { kind: 'bld', bk: kind, x, y, v: v || 0, opt, town: id, r: 0 };
      if (d.foot[0]) b.box = [x - d.foot[0] / 2, y - d.foot[1], d.foot[0], d.foot[1]];
      this.addProp(b); this.blds.push(b);
      let svc = opt.svc || (kind === 'inn' || opt.inn ? 'inn' : kind === 'board' ? 'board' : kind === 'tent' && v === 0 ? 'inn' : null);
      if (svc) this.inters.push({ kind: svc, x, y: y + 14, r: kind === 'castle' ? 70 : 54, town: id, b });
      if (kind === 'sign' || kind === 'well' || kind === 'fountain' || kind === 'campfire') this.inters.push({ kind: 'sign', x, y: y + 10, r: 46, town: id, b, sub: kind });
    }
    // a welcome sign on the road into town
    this.inters.push({ kind: 'townname', x: T.x, y: T.y, r: T.r * 0.7, town: id });
  }
  // the docks at Fetchwick and Mittens Landing: find the shore nearest the right direction
  const shore = (x, y, dx, dy) => { let px = x, py = y; for (let i = 0; i < 120 && this.Fat(px, py) > 0.02; i++) { px += dx * 12; py += dy * 12; } return { x: px, y: py }; };
  const fw = shore(TOWNS.fetchwick.x, TOWNS.fetchwick.y + 40, 1, 0.08);
  this.dock = { x: fw.x - 30, y: fw.y, to: 'isle' };
  const ld = shore(TOWNS.landing.x + 40, TOWNS.landing.y, -1, 0);
  this.dock2 = { x: ld.x + 30, y: ld.y, to: 'main' };
  for (const dk of [this.dock, this.dock2]) {
    for (const g of this.grid) for (let i = g.length - 1; i >= 0; i--) { const q = g[i]; if (q.kind !== 'bld' && dist(q.x, q.y, dk.x, dk.y) < 170) { g.splice(i, 1); q.gone = true; } }
    const b = { kind: 'bld', bk: 'boat', x: dk.x + (dk.to === 'isle' ? 120 : -120), y: dk.y + 40, v: 0, opt: {}, r: 0, dockOf: dk };
    this.addProp(b); this.blds.push(b);
    this.inters.push({ kind: 'dock', x: dk.x + (dk.to === 'isle' ? -50 : 50), y: dk.y + 20, r: 80, dock: dk });
  }
  // dungeon entrances
  for (const id in DUNGEON_SPOTS) {
    const s = DUNGEON_SPOTS[id], d = BLD[s.art];
    const b = { kind: 'bld', bk: s.art, x: s.x, y: s.y, v: 0, opt: { spooky: id === 'b_haunt' }, r: 0, dungeon: id };
    b.box = [s.x - d.foot[0] / 2, s.y - d.foot[1], d.foot[0], d.foot[1]];
    this.addProp(b); this.blds.push(b);
    this.inters.push({ kind: 'dungeon', id, x: s.x, y: s.y + 16, r: 64, b });
  }
};
