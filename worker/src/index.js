// Dog Quest API: accounts (name + password, no email) and cloud saves.
// Runs on Cloudflare Workers with a D1 (SQLite) database.
const ENC = new TextEncoder();
const NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const DAY = 86400000;
const SESSION_MS = 365 * DAY;      // sessions last a year and renew while you keep playing
const RENEW_BELOW = 330 * DAY;
const MAX_SAVE = 256 * 1024;
const ITER = 100000;               // PBKDF2 iterations (the Workers runtime caps this at 100k)
const KEEP_BACKUPS = 20;           // per account

const b64u = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const sha256 = async (s) => b64u(await crypto.subtle.digest('SHA-256', ENC.encode(s)));
const randToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0; }
async function pbkdf2(pass, salt, iter) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(pass), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPassword(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64u(salt)}$${b64u(await pbkdf2(pass, salt, ITER))}`;
}
async function checkPassword(pass, stored) {
  const [kind, iter, salt, hash] = String(stored).split('$');
  if (kind !== 'pbkdf2') return false;
  return safeEq(await pbkdf2(pass, unb64u(salt), +iter), unb64u(hash));
}

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// ---------- the name filter (from Emberblood): runs when an account is made, never on sign-in, so no old name is ever renamed.
// It refuses swear words, slurs, sexual words, spam words and names that pretend to be staff. Silly kid names
// ("Is_a_fart") stay allowed, and ordinary words that hide a bad word inside ("Scunthorpe", "Classic", "Therapist",
// "Badminton") pass: short words only count as a whole word, and the longer ones carry their own exceptions.
// Names are not shown to other players yet, so this is a first fence only.
const NAME_NO = "Pick another name. That one isn't allowed here.";
const LEET = { 0: 'o', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'l', '+': 't' };
// matched anywhere in the name, after joining its parts (so "f_u_c_k" and "FuCk" are caught)
const NAME_ROOTS = {
  rude: [
    // swear words
    /fuck/, /fuk(?!uo|ush|uy|ien)/, /fuq/, /fvck/, /phuc?k(?!et)/, /(?<!yama|cu)shit(?!ta)/, /bitch/, /biatch/, /bastard/, /cunt(?!horpe)/, /twat(?!ch|er|t)/,
    /(?<!s)wank(?!el)/, /bollock/, /bolock/, /arsehole/, /asshole/, /dumbass/, /jackass/, /smartass/, /fatass/, /asswipe/, /asshat/, /assclown/,
    /(?<!ni|ns)piss(?!ar)/, /dickhead/, /cocksuck/,
    // slurs
    /(?<!s)nigg(?!l)/, /nigga/, /fagg?ot/, /retard(?!ant)/, /trann(y|ie)/, /wetback/, /beaner(?!y)/, /towelhead/, /raghead/, /chingchong/,
    /(?<!ke|mo)nazi(?!r)/, /hitler/, /kkk/, /siegheil/, /whitepower/, /(?<!b)lesbo/, /shemale/,
    // sexual words
    /porn/, /sexy/, /sexting/, /penis(?!ton)/, /vagina/, /vulva/, /pussy(?!cat|willow|foot)/, /dildo/, /orgasm/, /cumshot/, /jizz?/, /blowjob/,
    /handjob/, /rimjob/, /boobie/, /titt(y|ie)/, /milf(?!ord)/, /hentai/, /onlyfans/, /nsfw/, /slut/, /whore/, /(?<!the)rapist/, /molest/,
    /pa?edophil/, /paedo/, /(?<!pr)incest/, /bdsm/, /(?<!scl)erotic/, /bukkake/, /ballsack/, /nutsack/, /scrotum/, /testicle/, /clit(?![heiut])/, /condom(?!in)/, /viagra/,
  ],
  spam: [/spam/, /http/, /www/, /dotcom/, /freerobux/, /freevbucks/, /freecoins/, /freegems/, /freemoney/, /freestuff/, /freegift/, /giveaway/, /casino/, /bitcoin/],
  staff: [/(?<!b)admin(?!d)/, /moderator/, /official/, /(?<![drl])owner/, /developer/, /devteam/, /^(the|real)?dogquest(team|staff|dev|devs|help|support|game|hq)?$/],
};
// matched only as a whole word (a part of the name split at spaces, _, -, dots and capitals), plural or not
const NAME_WORDS = {
  rude: new Set(('ass arse tit tits titty cum cock dick prick fag hoe sex sexx rape raped raping pedo anal anus horny nude naked boob boner thot ' +
    'spic chink kike gook coon negro paki jap dyke homo wtf stfu gtfo mofo').split(' ')),
  spam: new Set(['bot', 'free']),
  staff: new Set(['mod', 'staff']),
};
const lev = (a, b) => {
  const n = b.length, d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= n; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[n];
};
// "close to" a staff name: the whole name within a few edits, or a stretch of it within fewer (MuellerCodez, The_Mueller_Codes)
function nearName(s, staff) {
  const whole = Math.min(3, Math.floor(staff.length / 4)), part = Math.min(2, Math.floor(staff.length / 5));
  if (s.length < 4 || staff.length < 4) return s === staff;
  if (lev(s, staff) <= whole) return true;
  for (let w = staff.length - 1; w <= staff.length + 1; w++) for (let i = 0; i + w <= s.length; i++) if (lev(s.slice(i, i + w), staff) <= part) return true;
  return false;
}
// the spellings a name is checked in: look-alikes read as letters (1 as i and as l), and long runs of a letter squeezed
// to one and to two. Each keeps where its parts start and end (cuts).
function nameForms(parts) {
  const out = [];
  for (const one of ['i', 'l']) for (const sq of [0, 1, 2]) {
    let s = ''; const cuts = [0];
    for (const p of parts) {
      let t = p.replace(/[0-9@$!|+]/g, (c) => (c === '1' ? one : LEET[c] || c)).replace(/[^a-z]/g, '');
      if (sq) t = t.replace(/(.)\1{2,}/g, sq === 1 ? '$1' : '$1$1');
      if (t) { s += t; cuts.push(s.length); }
    }
    if (s && !out.some((f) => f.s === s && f.cuts.join() === cuts.join())) out.push({ s, cuts });
  }
  return out;
}
// a bad word counts when it sits inside one part ("BigShitHead"), or when it is made of whole parts ("Sh_it", "f_u_c_k"),
// but not when it only borrows the end of one real word and the start of the next ("GusHitter", "PrinceStar", "GrassHole")
function rootIn(re, f) {
  const g = new RegExp(re.source, 'g'); let m;
  while ((m = g.exec(f.s))) {
    const a = m.index, b = a + m[0].length;
    for (let i = 0; i + 1 < f.cuts.length; i++) if (a >= f.cuts[i] && b <= f.cuts[i + 1]) return true;
    if (f.cuts.includes(a) && f.cuts.includes(b)) return true;
    if (b === a) g.lastIndex++;
  }
  return false;
}
const wordIn = (set, f) => set.has(f) || (f.length > 3 && /[sz]$/.test(f) && set.has(f.slice(0, -1))) || (f.length > 4 && /es$/.test(f) && set.has(f.slice(0, -2)));
// null for a fine name, or why it was refused ('rude', 'spam' or 'staff', for the admin page; the player only sees NAME_NO)
function nameProblem(raw, env) {
  raw = String(raw || '');
  if (/\.com|1488/i.test(raw)) return 'spam';
  // the parts: split at separators and at a capital after a small letter; a part that is only digits stays a number
  const parts = raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_.\-]+/).filter((p) => p && !/^\d+$/.test(p));
  const staff = ['muellercodes', ...String((env && env.ADMIN_USERS) || '').split(',').map((s) => s.trim().toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean)];
  for (const f of nameForms(parts)) {
    for (const why in NAME_ROOTS) if (NAME_ROOTS[why].some((re) => rootIn(re, f))) return why;
    if (staff.some((st) => nearName(f.s, st))) return 'staff';
  }
  // a short word counts as a whole part, or as the whole name ("A_S_S", "MoFo")
  for (const p of [...parts, parts.join('')]) for (const f of nameForms([p])) for (const why in NAME_WORDS) if (wordIn(NAME_WORDS[why], f.s)) return why;
  return null;
}

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin');
  if (!origin) return {};
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!ok) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
const json = (data, status, cors) => new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } });

async function body(req) {
  const len = +(req.headers.get('Content-Length') || 0);
  if (len > MAX_SAVE + 4096) throw new HttpError(413, 'That is too big.');
  const text = await req.text();
  if (text.length > MAX_SAVE + 4096) throw new HttpError(413, 'That is too big.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Bad request.'); }
}

// simple fixed-window rate limit stored in D1
async function limit(env, key, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT n, reset_at FROM limits WHERE k = ?').bind(key).first();
  if (!row || row.reset_at < now) { await env.DB.prepare('INSERT INTO limits (k, n, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, reset_at = excluded.reset_at').bind(key, now + windowMs).run(); return; }
  if (row.n >= max) throw new HttpError(429, 'Too many tries. Take a breather and try again in a few minutes.');
  await env.DB.prepare('UPDATE limits SET n = n + 1 WHERE k = ?').bind(key).run();
}

const PAUSED_MSG = 'This account is paused. Ask a grown-up to turn it back on.';
const isAdminName = (env, name) => String(env.ADMIN_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(String(name).toLowerCase());

async function newSession(env, userId) {
  const token = randToken(), now = Date.now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now, now + SESSION_MS).run();
  return token;
}
async function authUser(req, env) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer ([A-Za-z0-9_-]{20,100})$/);
  if (!m) throw new HttpError(401, 'Please sign in.');
  const th = await sha256(m[1]), now = Date.now();
  const row = await env.DB.prepare('SELECT s.user_id AS id, s.expires_at AS exp, u.name AS name, u.paused_at AS paused FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').bind(th).first();
  if (!row) throw new HttpError(401, 'Please sign in again.');
  if (row.exp < now) { await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(th).run(); throw new HttpError(401, 'Your session expired. Please sign in again.'); }
  if (row.paused) throw new HttpError(403, PAUSED_MSG);
  if (row.exp - now < RENEW_BELOW) {
    await env.DB.batch([
      env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').bind(now + SESSION_MS, th),
      env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(now, row.id),
    ]);
  }
  return { id: row.id, name: row.name, th, admin: isAdminName(env, row.name) };
}
async function authAdmin(req, env) {
  const u = await authUser(req, env);
  if (!u.admin) throw new HttpError(403, 'That account is not an admin.');
  return u;
}
const qid = (req) => { const n = +new URL(req.url).searchParams.get('id'); if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Which account?'); return n; };
async function userById(env, id) {
  const u = await env.DB.prepare('SELECT id, name, created_at, last_seen, paused_at FROM users WHERE id = ?').bind(id).first();
  if (!u) throw new HttpError(404, 'No account with that id.');
  return u;
}

// ---------- saves. A save is the game's own JSON: { game: 'dogquest', v, t (seconds played), lv (level), ... }
function checkSave(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s) || s.game !== 'dogquest') throw new HttpError(400, 'That does not look like a Dog Quest save.');
  const data = JSON.stringify(s);
  if (data.length > MAX_SAVE) throw new HttpError(413, 'That save is too big.');
  return { data, play: Math.max(0, Math.floor(+s.t || 0)), level: Math.max(1, Math.floor(+s.lv || 1)) };
}
function summary(row) {
  if (!row || !row.data) return null;
  let s = null; try { s = JSON.parse(row.data); } catch { return null; }
  return { level: s.lv | 0, play: Math.round(+s.t || 0), hero: s.hero && s.hero.name ? String(s.hero.name).slice(0, 20) : null, chapter: s.ch || null, gold: s.gold | 0, done: !!s.won };
}
// keep the save that is about to be replaced, so nothing is ever lost for good
async function backupSave(env, userId, note) {
  const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(userId).first();
  if (!row) return null;
  const res = await env.DB.prepare('INSERT INTO save_backups (user_id, data, save_at, made_at, note) VALUES (?, ?, ?, ?, ?)').bind(userId, row.data, row.updated_at, Date.now(), String(note || '').slice(0, 120)).run();
  await env.DB.prepare('DELETE FROM save_backups WHERE user_id = ? AND id NOT IN (SELECT id FROM save_backups WHERE user_id = ? ORDER BY id DESC LIMIT ?)').bind(userId, userId, KEEP_BACKUPS).run();
  return res.meta.last_row_id;
}
async function writeSave(env, userId, s) {
  const now = Date.now();
  await env.DB.prepare('INSERT INTO saves (user_id, data, play, level, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, play = excluded.play, level = excluded.level, updated_at = excluded.updated_at')
    .bind(userId, s.data, s.play, s.level, now).run();
  return now;
}

function creds(b) {
  const username = String(b.username || '').trim(), password = String(b.password || '');
  if (!NAME_RE.test(username)) throw new HttpError(400, 'Names are 3 to 20 letters, numbers, - or _.');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
  return { username, password };
}
const ip = (req) => req.headers.get('CF-Connecting-IP') || 'local';

const routes = {
  'GET /api/health': async () => ({ ok: true, service: 'dog-quest', time: Date.now() }),

  'POST /api/register': async (req, env) => {
    const b = await body(req);
    const { username, password } = creds(b);
    const admin = isAdminName(env, username);
    if (!admin && nameProblem(username, env)) throw new HttpError(400, NAME_NO);
    await limit(env, 'reg:' + ip(req), 6, 3600000);
    const exists = await env.DB.prepare('SELECT id FROM users WHERE name = ?').bind(username).first();
    if (exists) throw new HttpError(409, 'That name is taken. Try another one.');
    const now = Date.now();
    const res = await env.DB.prepare('INSERT INTO users (name, pass, created_at, last_seen) VALUES (?, ?, ?, ?)').bind(username, await hashPassword(password), now, now).run();
    const id = res.meta.last_row_id;
    return { token: await newSession(env, id), user: { id, name: username, admin } };
  },

  'POST /api/login': async (req, env) => {
    const { username, password } = creds(await body(req));
    const key = 'login:' + ip(req);
    const lim = await env.DB.prepare('SELECT n, reset_at FROM limits WHERE k = ?').bind(key).first();
    if (lim && lim.reset_at > Date.now() && lim.n >= 12) throw new HttpError(429, 'Too many tries. Take a breather and try again in a few minutes.');
    const u = await env.DB.prepare('SELECT id, name, pass, paused_at FROM users WHERE name = ?').bind(username).first();
    if (!u || !(await checkPassword(password, u.pass))) { await limit(env, key, 1000, 600000); throw new HttpError(401, 'That name and password do not match.'); }
    if (u.paused_at) throw new HttpError(403, PAUSED_MSG);
    await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(Date.now(), u.id).run();
    return { token: await newSession(env, u.id), user: { id: u.id, name: u.name, admin: isAdminName(env, u.name) } };
  },

  'POST /api/logout': async (req, env) => {
    const u = await authUser(req, env);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(u.th).run();
    return { ok: true };
  },

  'GET /api/me': async (req, env) => { const u = await authUser(req, env); return { user: { id: u.id, name: u.name, admin: u.admin } }; },

  // change your own password (needs the old one); every other device is signed out
  'POST /api/password': async (req, env) => {
    const u = await authUser(req, env);
    const b = await body(req);
    const row = await env.DB.prepare('SELECT pass FROM users WHERE id = ?').bind(u.id).first();
    await limit(env, 'pw:' + u.id, 10, 3600000);
    if (!row || !(await checkPassword(String(b.old || ''), row.pass))) throw new HttpError(401, 'The old password is not right.');
    const pw = String(b.password || '');
    if (pw.length < 8 || pw.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(pw), u.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(u.id, u.th),
    ]);
    return { ok: true };
  },

  'GET /api/save': async (req, env) => {
    const u = await authUser(req, env);
    const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(u.id).first();
    return { save: row ? JSON.parse(row.data) : null, updated: row ? row.updated_at : null };
  },

  // A save with less play time than the one already here is refused (409, with the stored save) unless force is
  // set, so a stale device never quietly wipes newer progress. A forced overwrite keeps a backup first.
  'PUT /api/save': async (req, env) => {
    const u = await authUser(req, env);
    const b = await body(req);
    const s = checkSave(b.save);
    await limit(env, 'save:' + u.id, 240, 3600000);
    const row = await env.DB.prepare('SELECT data, play, updated_at FROM saves WHERE user_id = ?').bind(u.id).first();
    if (row && row.play > s.play + 15) {
      if (!b.force) return json({ error: 'Another device is further along.', conflict: true, save: JSON.parse(row.data), updated: row.updated_at }, 409);
      await backupSave(env, u.id, 'replaced by a save with less play time');
    }
    return { ok: true, updated: await writeSave(env, u.id, s) };
  },
};

const adminRoutes = {
  'GET /api/admin/me': async (req, env) => { const u = await authAdmin(req, env); return { user: { id: u.id, name: u.name }, admin: true }; },

  'GET /api/admin/users': async (req, env) => {
    await authAdmin(req, env);
    const now = Date.now();
    const { results } = await env.DB.prepare(`SELECT u.id, u.name, u.created_at, u.last_seen, u.paused_at, s.updated_at AS save_at, length(s.data) AS save_bytes, s.data AS data,
      (SELECT count(*) FROM sessions x WHERE x.user_id = u.id AND x.expires_at > ?) AS sessions,
      (SELECT count(*) FROM save_backups b WHERE b.user_id = u.id) AS backups
      FROM users u LEFT JOIN saves s ON s.user_id = u.id ORDER BY u.id`).bind(now).all();
    return { now, users: (results || []).map((r) => ({ id: r.id, name: r.name, created: r.created_at, last_seen: r.last_seen, paused: r.paused_at || null,
      save_at: r.save_at || null, save_bytes: r.save_bytes || 0, sessions: r.sessions, backups: r.backups, admin: isAdminName(env, r.name),
      name_check: isAdminName(env, r.name) ? null : nameProblem(r.name, env), game: summary(r) })) };
  },

  'GET /api/admin/save': async (req, env) => {
    await authAdmin(req, env);
    const u = await userById(env, qid(req));
    const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(u.id).first();
    return { user: u, save: row ? JSON.parse(row.data) : null, updated: row ? row.updated_at : null };
  },

  'GET /api/admin/backups': async (req, env) => {
    await authAdmin(req, env);
    const u = await userById(env, qid(req));
    const { results } = await env.DB.prepare('SELECT id, save_at, made_at, note, length(data) AS bytes, data FROM save_backups WHERE user_id = ? ORDER BY id DESC LIMIT 50').bind(u.id).all();
    return { user: u, backups: (results || []).map((r) => ({ id: r.id, save_at: r.save_at, made_at: r.made_at, note: r.note, bytes: r.bytes, game: summary(r) })) };
  },

  'POST /api/admin/restore': async (req, env) => {
    const a = await authAdmin(req, env);
    const bid = +(await body(req)).backup;
    const row = await env.DB.prepare('SELECT user_id, data FROM save_backups WHERE id = ?').bind(bid | 0).first();
    if (!row) throw new HttpError(404, 'No backup with that id.');
    const s = checkSave(JSON.parse(row.data));
    const backup = await backupSave(env, row.user_id, 'before ' + a.name + ' restored backup ' + bid);
    return { ok: true, updated: await writeSave(env, row.user_id, s), backup };
  },

  // set a new password for an account (kids forget theirs, and there is no email); signs that account out everywhere
  'POST /api/admin/password': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    const password = String(b.password || '');
    if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(password), u.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
    ]);
    return { ok: true };
  },

  // pause: the account can't sign in, load or save until it is turned back on. Nothing is lost.
  'POST /api/admin/pause': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    if (isAdminName(env, u.name)) throw new HttpError(400, 'An admin account cannot be paused.');
    const at = b.paused ? Date.now() : null;
    await env.DB.prepare('UPDATE users SET paused_at = ? WHERE id = ?').bind(at, u.id).run();
    return { ok: true, paused: at };
  },

  // delete: the account, its save, its backups and its sign-ins are gone for good. The page must send the exact name.
  'POST /api/admin/delete': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    if (isAdminName(env, u.name)) throw new HttpError(400, 'An admin account cannot be deleted.');
    if (String(b.confirm || '') !== u.name) throw new HttpError(400, 'Type the account name exactly to delete it.');
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM saves WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM save_backups WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id),
    ]);
    return { ok: true, deleted: u.name };
  },
};

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const route = routes[`${req.method} ${url.pathname}`] || adminRoutes[`${req.method} ${url.pathname}`];
    if (!route) return json({ error: 'Not found.' }, 404, cors);
    try {
      const out = await route(req, env);
      if (out instanceof Response) { for (const k in cors) out.headers.set(k, cors[k]); return out; }
      return json(out, 200, cors);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
      console.error(e);
      return json({ error: 'The server tripped over its tail. Try again.' }, 500, cors);
    }
  },
  // daily tidy-up: expired sessions and old rate-limit rows
  async scheduled(event, env) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM limits WHERE reset_at < ?').bind(now),
    ]);
  },
};
