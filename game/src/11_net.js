// Accounts and cloud saves (a name and a password, no email). Only on the real site, where the API answers.
const API = 'https://dog-quest-api.muellercodes.workers.dev';
const Net = {
  enabled: /(^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) || /[?&]net\b/.test(location.search),
  user: null, token: LS.get('dq_token', null), lastPush: 0, blocked: false, busy: false, msg: '', msgOk: false,
};
Net.call = async function (method, path, body) {
  const r = await fetch(API + path, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, this.token ? { Authorization: 'Bearer ' + this.token } : {}), body: body ? JSON.stringify(body) : undefined });
  let j = {};
  try { j = await r.json(); } catch (e) {}
  if (!r.ok) { const err = new Error(j.error || 'Something went wrong. Try again.'); err.status = r.status; err.data = j; throw err; }
  return j;
};
Net.init = async function () {
  if (!this.enabled || !this.token) return;
  try { const j = await this.call('GET', '/api/me'); this.user = j.user; }
  catch (e) { if (e.status === 401 || e.status === 403) { this.token = null; LS.del('dq_token'); } }
  if (Game.state === 'title') UI.showTitle();
};
Net.signIn = async function (kind, name, pw) {
  this.busy = true; this.msg = '';
  try {
    const j = await this.call('POST', kind === 'new' ? '/api/register' : '/api/login', { username: name, password: pw });
    this.token = j.token; this.user = j.user; LS.set('dq_token', j.token);
    await this.mergeOnSignIn();
    this.msg = kind === 'new' ? 'Account made! Your journey now saves online.' : 'Welcome back, ' + j.user.name + '!'; this.msgOk = true;
  } catch (e) { this.msg = e.message; this.msgOk = false; }
  this.busy = false;
};
// after signing in, keep whichever journey has more play time
Net.mergeOnSignIn = async function () {
  let cloud = null;
  try { cloud = (await this.call('GET', '/api/save')).save; } catch (e) {}
  const local = Game.localSave();
  if (cloud && (!local || (cloud.t || 0) >= (local.t || 0))) { LS.set('dq_save', cloud); if (G && Game.state !== 'title') { Game.load(cloud); } }
  else if (local) { await this.push(true, local); }
  this.blocked = false;
};
Net.signOut = async function () {
  try { await this.call('POST', '/api/logout'); } catch (e) {}
  this.user = null; this.token = null; LS.del('dq_token');
  this.msg = 'Signed out. Your journey still saves on this device.'; this.msgOk = true;
};
Net.push = async function (force, data) {
  if (!this.user || this.blocked) return;
  const save = data || (G && G);
  if (!save) return;
  this.lastPush = Date.now();
  try {
    await this.call('PUT', '/api/save', { save, force: !!force });
    this.status = 'Saved online ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    if (e.status === 409) {
      this.blocked = true;
      UI.toast('Your account has a journey with more play time from another device. Open Account in the menu to choose.', 'goal');
    } else if (e.status === 401) { this.user = null; this.token = null; LS.del('dq_token'); UI.toast('Signed out of your account. Your journey still saves here.'); }
    else this.status = 'Could not reach the server. Saved on this device.';
  }
};
Net.maybePush = function (force) {
  if (!this.user || this.blocked) return;
  if (force || Date.now() - this.lastPush > 25000) this.push(false);
};
Net.pullNewer = async function () {
  if (!this.user) return null;
  try { const j = await this.call('GET', '/api/save'); return j.save; } catch (e) { return null; }
};

// the account page inside the menu
Net.accountTab = function () {
  if (!this.user) return this.formHtml(false);
  return `<h3>Signed in as ${esc(this.user.name)}</h3>
    <p>Your journey saves to your account, so you can keep playing on another computer, tablet or phone.</p>
    <p class="hint">${esc(this.status || '')}</p>
    ${this.blocked ? '<p class="err">Another device has a journey with more play time. Which one do you want to keep?</p><div class="row"><button class="btn nav" data-act="useCloud">Load the other device\'s journey</button><button class="btn red nav" data-act="useLocal">Keep this one (the other gets backed up)</button></div>' : '<div class="row"><button class="btn gold nav" data-act="syncNow">Save online now</button></div>'}
    <h3>Change password</h3>
    <div class="row"><input type="password" id="pwOld" placeholder="Old password" autocomplete="current-password"><input type="password" id="pwNew" placeholder="New password (8 or more)" autocomplete="new-password"><button class="btn small nav" data-act="pwChange">Change</button></div>
    <div class="row"><button class="btn small nav" data-act="signOut">Sign out</button>${this.user.admin ? '<a class="btn small blue" href="admin.html" target="_blank" rel="noopener">Admin page</a>' : ''}</div>
    <p class="${this.msgOk ? 'ok' : 'err'}">${esc(this.msg || '')}</p>`;
};
Net.formHtml = function (screen) {
  return `${screen ? '<div style="text-align:center"><span class="ribbon">Your account</span></div>' : '<h3>Save your journey online</h3>'}
    <p>Make an account with just a name and a password (no email needed) to keep playing on any device.</p>
    <div class="row"><input type="text" id="acName" placeholder="Name" maxlength="20" autocomplete="username"></div>
    <div class="row"><input type="password" id="acPw" placeholder="Password (8 or more letters)" maxlength="128" autocomplete="current-password"></div>
    <div class="row"><button class="btn gold nav" data-act="signIn">Sign in</button><button class="btn nav" data-act="signUp">Make a new account</button>${screen ? '<button class="btn nav" data-go="title">Back</button>' : ''}</div>
    <p class="hint">Names can use letters, numbers, - and _. Forgot your password? Ask a grown-up to reset it.</p>
    <p class="${this.msgOk ? 'ok' : 'err'}">${esc(this.msg || '')}</p>`;
};
Net.showAccountScreen = function () {
  this.screenMode = true;
  if (this.user) UI.screen(`<div class="newgame paper"><div style="text-align:center"><span class="ribbon">Your account</span></div>${this.accountTab()}<div class="row"><button class="btn gold nav" data-go="title">Back</button></div></div>`, () => UI.showTitle());
  else UI.screen(`<div class="newgame paper">${this.formHtml(true)}</div>`, () => UI.showTitle());
};
Net.refresh = function () { if (Game.state === 'title' || (this.screenMode && !$('#screen').classList.contains('hidden'))) this.showAccountScreen(); else if (Game.state === 'menu') UI.renderMenu(); };
Net.click = function (b) {
  const act = b.dataset.act, val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  switch (act) {
    case 'signIn': case 'signUp': { const n = val('acName').trim(), p = val('acPw'); this.signIn(act === 'signUp' ? 'new' : 'old', n, p).then(() => this.refresh()); this.msg = 'One moment...'; this.msgOk = true; this.refresh(); return true; }
    case 'signOut': this.signOut().then(() => this.refresh()); return true;
    case 'syncNow': this.push(false).then(() => this.refresh()); return true;
    case 'pwChange': { const o = val('pwOld'), n = val('pwNew'); this.call('POST', '/api/password', { old: o, password: n }).then(() => { this.msg = 'Password changed. Other devices were signed out.'; this.msgOk = true; }).catch((e) => { this.msg = e.message; this.msgOk = false; }).then(() => this.refresh()); return true; }
    case 'useLocal': this.blocked = false; this.push(true).then(() => { this.msg = 'Kept this journey. The other one was backed up.'; this.msgOk = true; this.refresh(); }); return true;
    case 'useCloud': this.pullNewer().then((s) => { if (s) { LS.set('dq_save', s); this.blocked = false; UI.closePanel(); Game.load(s); UI.toast('Loaded your other journey!', 'save'); } }); return true;
  }
  return false;
};
$('#screen').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) Net.click(b); });
