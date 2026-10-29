// Gear, tricks, critters, bosses, folk, dungeons and treasure.
const ITEMS = {
  // in the mouth (weapons)
  stick: { slot: 'mouth', name: 'Trusty Stick', atk: 3, art: 'stick', desc: 'Every great quest starts with a good stick.' },
  bone: { slot: 'mouth', name: 'Chew Bone', atk: 6, art: 'bone', desc: 'Gnawed to a fine edge.' },
  squeaky: { slot: 'mouth', name: 'Squeaky Hammer', atk: 8, mag: 2, art: 'squeaky', desc: 'BONK. Squeak. BONK.' },
  chicken: { slot: 'mouth', name: 'Rubber Chicken', atk: 5, mag: 8, art: 'chicken', desc: 'Its squawk is pure magic.' },
  frisbee: { slot: 'mouth', name: 'Frisbee Edge', atk: 11, mag: 1, art: 'frisbee', desc: 'Catch! No, wait. Slash!' },
  scepter: { slot: 'mouth', name: 'Royal Bone Scepter', atk: 13, mag: 6, art: 'scepter', desc: 'A gift fit for a royal pup.' },
  icicle: { slot: 'mouth', name: 'Icicle Fang', atk: 16, mag: 4, art: 'icicle', desc: 'Brain freeze for baddies.' },
  rib: { slot: 'mouth', name: "Pharaoh's Rib", atk: 18, mag: 9, art: 'rib', desc: 'Ancient. Crunchy. Mighty.' },
  golden: { slot: 'mouth', name: 'Golden Fetch Stick', atk: 25, mag: 12, art: 'golden', desc: 'The goodest stick there ever was.' },
  // on the head
  party: { slot: 'head', name: 'Party Hat', hp: 6, mag: 3, art: 'party', desc: 'Every day is a party.' },
  bandana: { slot: 'head', name: 'Bandana', hp: 12, def: 2, art: 'bandana', desc: 'Very cool. Very brave.' },
  flower: { slot: 'head', name: 'Daisy Crown', hp: 10, mag: 5, art: 'flower', desc: 'Picked fresh from the meadow.' },
  pirate: { slot: 'head', name: 'Pirate Hat', atk: 3, def: 4, hp: 12, art: 'pirate', desc: 'Arrr-f!' },
  wizard: { slot: 'head', name: 'Wizard Hat', mag: 10, art: 'wizard', desc: 'Pointy hat, pointy magic.' },
  beanie: { slot: 'head', name: 'Knit Beanie', hp: 30, def: 6, art: 'beanie', desc: 'Granny Mush knitted it.' },
  viking: { slot: 'head', name: 'Viking Helmet', atk: 6, def: 8, hp: 15, art: 'viking', desc: 'For bold explorers.' },
  sombrero: { slot: 'head', name: 'Sombrero', def: 6, mag: 7, hp: 16, art: 'sombrero', desc: 'Shade for the hottest dunes.' },
  cone: { slot: 'head', name: 'Cone of Shame', def: 17, hp: 45, art: 'cone', desc: 'Embarrassing. Also very sturdy.' },
  chef: { slot: 'head', name: "Chef's Hat", hp: 22, mag: 5, regen: 1, art: 'chef', desc: 'Slowly heals you. Smells like gravy.' },
  tophat: { slot: 'head', name: 'Top Hat', mag: 13, def: 3, art: 'tophat', desc: 'Very fancy. Very magical.' },
  crown: { slot: 'head', name: 'Crown of Treats', atk: 7, mag: 11, def: 9, hp: 35, art: 'crown', desc: 'For the Goodest Pup in all the land.' },
  // around the neck and on the back
  collar: { slot: 'body', name: 'Red Collar', hp: 10, art: '#e8475f', desc: 'Your very own collar.' },
  spiked: { slot: 'body', name: 'Spiked Collar', atk: 3, def: 4, art: '#3a3440', desc: 'Tough look, soft heart.' },
  raincoat: { slot: 'body', name: 'Raincoat', def: 7, hp: 22, art: '#ffd23f', coat: '#ffd23f', desc: 'Puddles fear you.' },
  sweater: { slot: 'body', name: 'Cozy Sweater', def: 10, hp: 40, art: '#4fa8a0', coat: '#4fa8a0', desc: 'Warm as a hug.' },
  cape: { slot: 'body', name: 'Cape of Zoom', mag: 7, spd: 0.1, art: '#8a5fc9', cape: '#8a5fc9', desc: 'You run a little faster.' },
  plate: { slot: 'body', name: 'Knightly Plate', def: 18, hp: 50, art: '#c9ccd9', coat: '#c9ccd9', desc: 'Clank clank clank.' },
  pharaoh: { slot: 'body', name: 'Pharaoh Collar', mag: 12, def: 9, art: '#ffd84d', desc: 'Gold and glittering.' },
  royal: { slot: 'body', name: 'Royal Robe', atk: 5, mag: 9, def: 12, hp: 40, art: '#6a3fa8', cape: '#c93a4a', desc: 'Worn by heroes of old.' },
};
const SLOTS = { mouth: 'Mouth', head: 'Head', body: 'Neck & Back' };
const ITEM_MAX = 10;
function itemStat(id, lv, k) { const it = ITEMS[id]; return it && it[k] ? Math.round(it[k] * (1 + 0.22 * ((lv || 1) - 1))) : 0; }

const TRICKS = {
  bark: { name: 'Bark Blast', cost: 12, cd: 0.5, dmg: 1.5, desc: 'A mighty WOOF that knocks foes back.', color: '#ffd84d' },
  fetch: { name: 'Fetch!', cost: 10, cd: 0.35, dmg: 1.05, desc: 'Throw a magic ball. It comes back, of course.', color: '#c9e84a' },
  belly: { name: 'Belly Rub', cost: 24, cd: 2.5, heal: 0.3, desc: 'Roll over for a healing belly rub.', color: '#ff8fb4' },
  zoom: { name: 'Zoomies', cost: 14, cd: 0.7, dmg: 1.3, desc: 'Dash like the wind and bowl over anything in the way.', color: '#7fd0ff' },
  howl: { name: 'Howl', cost: 26, cd: 1.1, dmg: 1.9, desc: 'Howl at the moon and call moonbeams down on nearby foes.', color: '#b9a8ff' },
  dig: { name: 'Dig', cost: 22, cd: 1.4, dmg: 2.3, desc: 'Tunnel under the ground and burst out with a BOOM.', color: '#d9a46a' },
};
const TRICK_MAX = 5;
const TRAINERS = {
  waggington: { name: 'Coach Pepper', tricks: { bark: 0 } },
  barkingham: { name: 'Madame Poodlini', tricks: { fetch: 150, belly: 260 } },
  fetchwick: { name: 'Zippy', tricks: { zoom: 450 } },
  frostpaw: { name: 'Old Howler', tricks: { howl: 800 } },
  dunehound: { name: 'Sandy', tricks: { dig: 1100 } },
};
function trickUpCost(id, lv) { const base = { bark: 60, fetch: 80, belly: 90, zoom: 140, howl: 220, dig: 300 }[id] || 100; return Math.round(base * lv * (1 + lv * 0.4)); }

const SHOPS = {
  barkingham: ['bone', 'bandana', 'collar', 'party', 'spiked', 'raincoat'],
  fetchwick: ['frisbee', 'pirate', 'raincoat', 'chicken', 'sweater'],
  frostpaw: ['icicle', 'beanie', 'sweater', 'viking', 'plate'],
  dunehound: ['rib', 'sombrero', 'pharaoh', 'tophat', 'cape'],
};
function itemPrice(id) { const it = ITEMS[id]; return Math.round(((it.atk || 0) * 9 + (it.mag || 0) * 9 + (it.def || 0) * 10 + (it.hp || 0) * 2.2 + (it.spd ? 120 : 0) + 20) * 3.2); }

// ---------- attacks: every one is shown as a red area first
// k: shape kind; wind: warning time; r/len/w: size; dash: the foe moves along it; shot: a projectile flies
const ATKS = {
  bite: { shape: 'circle', at: 'front', off: 26, r: 34, wind: 0.6, rng: 62, dmg: 1 },
  swipe: { shape: 'cone', r: 74, half: 0.95, wind: 0.6, rng: 70, dmg: 1 },
  pinch: { shape: 'cone', r: 64, half: 0.6, wind: 0.6, rng: 60, dmg: 1.1 },
  hiss: { shape: 'cone', r: 120, half: 0.5, wind: 0.75, rng: 110, dmg: 1.1 },
  spin: { shape: 'circle', at: 'self', r: 72, wind: 0.85, rng: 70, dmg: 1.2 },
  slam: { shape: 'circle', at: 'self', r: 88, wind: 0.95, rng: 85, dmg: 1.4 },
  stink: { shape: 'circle', at: 'self', r: 95, wind: 1.0, rng: 90, dmg: 0.7, cloud: 1 },
  sting: { shape: 'rect', len: 210, w: 30, wind: 0.75, rng: 200, dmg: 1, dash: 620 },
  lunge: { shape: 'rect', len: 190, w: 36, wind: 0.65, rng: 180, dmg: 1.2, dash: 640 },
  stab: { shape: 'rect', len: 112, w: 28, wind: 0.6, rng: 100, dmg: 1.2 },
  acorn: { shape: 'rect', len: 380, w: 20, wind: 0.65, rng: 330, dmg: 0.8, shot: { spd: 460, r: 7, art: 'acorn' } },
  iceshot: { shape: 'rect', len: 400, w: 20, wind: 0.7, rng: 340, dmg: 0.8, shot: { spd: 430, r: 8, art: 'ice' }, spread: 3 },
  wrap: { shape: 'rect', len: 300, w: 28, wind: 0.75, rng: 260, dmg: 0.7, shot: { spd: 420, r: 9, art: 'wrap', slow: 1.2 } },
  trash: { shape: 'circle', at: 'target', r: 52, wind: 0.95, rng: 360, dmg: 1, lob: 'trash' },
  dive: { shape: 'circle', at: 'target', r: 48, wind: 0.85, rng: 300, dmg: 1, jump: 1 },
  pounce: { shape: 'circle', at: 'target', r: 46, wind: 0.7, rng: 250, dmg: 1.1, jump: 1 },
  blink: { shape: 'circle', at: 'blink', r: 44, wind: 0.5, rng: 360, dmg: 1.1 },
  suck: { shape: 'cone', r: 210, half: 0.42, wind: 1.1, rng: 200, dmg: 1.2, pull: 1 },
};

// ---------- critters
const FOES = {
  squirrel: { name: 'Squirrel', art: 'squirrel', hp: 22, atk: 6, spd: 125, r: 13, xp: 6, gold: 3, atks: ['bite', 'bite', 'acorn'] },
  bruiser: { name: 'Acorn Bruiser', art: 'graysquirrel', hp: 40, atk: 8, spd: 110, r: 15, xp: 10, gold: 5, atks: ['bite', 'spin', 'acorn'], sc: 1.25 },
  bee: { name: 'Buzzy Bee', art: 'bee', hp: 15, atk: 5, spd: 150, r: 12, xp: 5, gold: 2, fly: 1, atks: ['sting'] },
  raccoon: { name: 'Raccoon Bandit', art: 'raccoon', hp: 36, atk: 8, spd: 118, r: 15, xp: 9, gold: 6, atks: ['swipe', 'trash'] },
  cat: { name: 'Alley Cat', art: 'cat', hp: 32, atk: 9, spd: 138, r: 14, xp: 9, gold: 5, atks: ['swipe', 'pounce'] },
  crab: { name: 'Crab', art: 'crab', hp: 40, atk: 9, spd: 85, r: 16, xp: 10, gold: 6, atks: ['pinch', 'spin'] },
  gull: { name: 'Seagull', art: 'gull', hp: 24, atk: 8, spd: 160, r: 13, xp: 8, gold: 4, fly: 1, atks: ['dive'] },
  skunk: { name: 'Skunk', art: 'skunk', hp: 42, atk: 8, spd: 95, r: 15, xp: 11, gold: 6, atks: ['stink', 'swipe'] },
  fox: { name: 'Snow Fox', art: 'snowfox', hp: 40, atk: 11, spd: 155, r: 14, xp: 12, gold: 7, atks: ['pounce', 'bite'] },
  snowcat: { name: 'Snow Cat', art: 'snowcat', hp: 46, atk: 12, spd: 125, r: 15, xp: 13, gold: 8, atks: ['swipe', 'iceshot'] },
  ghost: { name: 'Ghost Cat', art: 'ghost', hp: 38, atk: 12, spd: 115, r: 15, xp: 13, gold: 8, fly: 1, atks: ['hiss', 'blink'] },
  bat: { name: 'Bat', art: 'bat', hp: 24, atk: 10, spd: 165, r: 12, xp: 10, gold: 5, fly: 1, atks: ['sting'] },
  scorpion: { name: 'Scorpion', art: 'scorpion', hp: 50, atk: 14, spd: 105, r: 16, xp: 15, gold: 9, atks: ['stab', 'pinch'] },
  mummy: { name: 'Mummy Cat', art: 'mummy', hp: 60, atk: 14, spd: 92, r: 15, xp: 16, gold: 10, atks: ['swipe', 'wrap'] },
  vacbot: { name: 'Vacuum Bot', art: 'vacbot', hp: 58, atk: 13, spd: 100, r: 17, xp: 16, gold: 10, atks: ['suck', 'slam'] },
  knight: { name: 'Cat Knight', art: 'knight', hp: 72, atk: 16, spd: 118, r: 16, xp: 18, gold: 12, atks: ['swipe', 'lunge'] },
  fox_red: { name: 'Sly Fox', art: 'fox', hp: 36, atk: 10, spd: 150, r: 14, xp: 11, gold: 7, atks: ['pounce', 'bite'] },
};
const REGION_FOES = {
  meadow: [['squirrel', 6], ['bee', 3]],
  forest: [['squirrel', 5], ['bruiser', 2], ['bee', 2], ['skunk', 1], ['fox_red', 1]],
  plains: [['raccoon', 4], ['squirrel', 2], ['cat', 2], ['bee', 1], ['fox_red', 1]],
  coast: [['crab', 4], ['gull', 3], ['cat', 2]],
  snow: [['fox', 4], ['snowcat', 3], ['vacbot', 1]],
  spooky: [['ghost', 4], ['bat', 3], ['skunk', 2]],
  desert: [['scorpion', 4], ['mummy', 2], ['vacbot', 1], ['skunk', 1]],
  isle: [['knight', 3], ['vacbot', 2], ['cat', 2], ['ghost', 1]],
};

// ---------- bosses: each move is a little script of red warnings
const BOSSES = {
  nutsworth: { name: 'Nutsworth, the Squirrel King', art: 'nutsworth', hp: 1500, atk: 11, spd: 150, r: 34, sc: 2.3, lv: 6,
    moves: ['acornRain', 'tailSpin', 'charge', 'summon'], summon: 'squirrel' },
  whiskers: { name: 'Captain Whiskers', art: 'whiskers', hp: 2800, atk: 15, spd: 140, r: 34, sc: 2.2, lv: 10,
    moves: ['cannons', 'sweep', 'charge', 'summon', 'anchor'], summon: 'crab' },
  snowball: { name: 'Snowball the Snow Leopard', art: 'snowball', hp: 4200, atk: 19, spd: 175, r: 34, sc: 2.3, lv: 14,
    moves: ['icicles', 'pounces', 'blizzard', 'snowballs'], summon: 'fox' },
  cleocatra: { name: 'Cleocatra', art: 'cleocatra', hp: 5600, atk: 22, spd: 130, r: 34, sc: 2.3, lv: 18,
    moves: ['eyebeam', 'sandring', 'summon', 'curse'], summon: 'mummy' },
  mittens: { name: 'Lord Mittens', art: 'mittens', hp: 6000, atk: 25, spd: 175, r: 32, sc: 2.2, lv: 22,
    moves: ['yarn', 'swipes', 'pounces', 'summon'], summon: 'knight', phase2: 'vacuum' },
  vacuum: { name: 'Lord Mittens and the Dread Vacuum', art: 'vacuum', hp: 7000, atk: 27, spd: 120, r: 52, sc: 1.6, lv: 22,
    moves: ['suckup', 'dustbunnies', 'bigslam', 'charge'], summon: 'vacbot' },
};

// ---------- dungeons. Rooms are fought in order; the last of a big one holds its boss.
const DUNGEONS = {
  oak: { name: 'The Great Oak', theme: 'oak', lv: 5, boss: 'nutsworth', main: 'oak',
    rooms: [{ w: [['squirrel', 4]] }, { w: [['squirrel', 3], ['bee', 2]], w2: [['bruiser', 2]] }, { chest: 'squeaky', w: [['bruiser', 2], ['squirrel', 2]] }, { w: [['squirrel', 4], ['bee', 3]] }, { boss: 1 }] },
  grotto: { name: 'Soggy Grotto', theme: 'grotto', lv: 9, boss: 'whiskers', main: 'grotto',
    rooms: [{ w: [['crab', 3]] }, { w: [['crab', 2], ['gull', 2]], w2: [['cat', 3]] }, { chest: 'pirate', w: [['cat', 3], ['crab', 1]] }, { w: [['crab', 3], ['gull', 3]] }, { boss: 1 }] },
  den: { name: 'Frostbite Den', theme: 'ice', lv: 13, boss: 'snowball', main: 'den',
    rooms: [{ w: [['fox', 3]] }, { w: [['snowcat', 3]], w2: [['fox', 3]] }, { chest: 'viking', w: [['snowcat', 2], ['vacbot', 1]] }, { w: [['fox', 3], ['snowcat', 2]] }, { boss: 1 }] },
  purramid: { name: 'The Great Purramid', theme: 'sand', lv: 17, boss: 'cleocatra', main: 'purramid',
    rooms: [{ w: [['mummy', 3]] }, { w: [['scorpion', 3]], w2: [['mummy', 2], ['scorpion', 1]] }, { chest: 'rib', w: [['mummy', 3], ['vacbot', 1]] }, { w: [['scorpion', 3], ['mummy', 3]] }, { boss: 1 }] },
  keep: { name: 'Clawhold Keep', theme: 'keep', lv: 21, boss: 'mittens', main: 'keep',
    rooms: [{ w: [['knight', 3]] }, { w: [['vacbot', 3]], w2: [['knight', 2], ['ghost', 2]] }, { chest: 'royal', w: [['knight', 3], ['vacbot', 2]] }, { w: [['knight', 4]], w2: [['vacbot', 3], ['cat', 3]] }, { boss: 1 }] },
  b_bunny: { name: 'Bunny Burrow', theme: 'dirt', lv: 2, rooms: [{ w: [['squirrel', 3]] }, { chest: 'flower', w: [['squirrel', 3], ['bee', 2]] }] },
  b_mole: { name: 'Mole Hole', theme: 'dirt', lv: 5, rooms: [{ w: [['squirrel', 3], ['bruiser', 1]] }, { chest: 'chicken', w: [['bruiser', 2], ['skunk', 1]] }] },
  b_kennel: { name: 'Old Kennel', theme: 'wood', lv: 7, rooms: [{ w: [['raccoon', 3]] }, { chest: 'spiked', w: [['raccoon', 2], ['cat', 2]] }] },
  b_crab: { name: 'Crab Cave', theme: 'grotto', lv: 9, rooms: [{ w: [['crab', 4]] }, { chest: 'frisbee', w: [['crab', 3], ['gull', 2]] }] },
  b_ice: { name: 'Ice Hollow', theme: 'ice', lv: 12, rooms: [{ w: [['fox', 3]] }, { chest: 'sweater', w: [['snowcat', 3]] }] },
  b_haunt: { name: 'Haunted Doghouse', theme: 'haunt', lv: 15, rooms: [{ w: [['ghost', 3], ['bat', 2]] }, { chest: 'tophat', w: [['ghost', 3], ['skunk', 1]] }] },
  b_sand: { name: 'Sand Pit', theme: 'sand', lv: 17, rooms: [{ w: [['scorpion', 3]] }, { chest: 'cape', w: [['scorpion', 2], ['mummy', 2]] }] },
};
const THEMES = {
  oak: { floor: '#b88a5a', floor2: '#a97c4e', wall: '#6d4a33', top: '#4c9a43', name: 'wood' },
  grotto: { floor: '#7f9ab5', floor2: '#7290ad', wall: '#4a5a78', top: '#5fa6c9', name: 'stone' },
  ice: { floor: '#cfe6f5', floor2: '#bfdcef', wall: '#7fa8cf', top: '#ffffff', name: 'ice' },
  sand: { floor: '#ebc47e', floor2: '#ddb46c', wall: '#b58a4a', top: '#f3d083', name: 'sand' },
  keep: { floor: '#8a7aa0', floor2: '#7d6d94', wall: '#4a3a6a', top: '#c94a7a', name: 'stone' },
  dirt: { floor: '#b8905e', floor2: '#ab8352', wall: '#7a5838', top: '#6cc24a', name: 'dirt' },
  wood: { floor: '#c79a66', floor2: '#b98c58', wall: '#7a5a4a', top: '#a8693f', name: 'wood' },
  haunt: { floor: '#8a7f9f', floor2: '#7d7292', wall: '#4a3a6a', top: '#6f5f8f', name: 'wood' },
};

// ---------- treasure in the open world: chests (some on islets you must swim to) and dig spots
const CHESTS = [
  { id: 'c_turtle', x: 260, y: 2290, item: 'cone' },
  { id: 'c_sandbar', x: 3000, y: 6550, item: 'viking' },
  { id: 'c_bonekey', x: 6520, y: 6550, item: 'chef' },
  { id: 'c_floe', x: 2250, y: 630, item: 'sweater' },
  { id: 'c_meadow', x: 900, y: 4700, item: 'bandana' },
  { id: 'c_forest', x: 700, y: 2050, item: 'chicken' },
  { id: 'c_plains', x: 5600, y: 2650, gold: 160 },
  { id: 'c_coast', x: 7850, y: 2800, item: 'raincoat' },
  { id: 'c_snow', x: 3200, y: 1500, gold: 420 },
  { id: 'c_spooky', x: 8100, y: 1500, item: 'wizard' },
  { id: 'c_desert', x: 3300, y: 5700, gold: 600 },
  { id: 'c_isle', x: 9000, y: 6250, item: 'crown' },
];
const DIGS = [
  [1300, 4700], [2500, 3900], [1000, 3500], [2200, 1700], [3100, 3000], [5200, 3000], [5900, 4100], [6500, 2900],
  [7900, 4100], [3900, 1200], [5750, 1750], [6600, 1900], [8000, 2300], [3600, 5900], [5600, 5200], [6300, 6000], [8800, 6400],
];
