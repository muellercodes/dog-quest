-- Dog Quest accounts and saves (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  paused_at INTEGER               -- set when an admin pauses the account (it can't sign in or save)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_exp ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  play INTEGER NOT NULL DEFAULT 0,  -- seconds played, so an older device never overwrites newer progress
  level INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
-- saves that were replaced by a forced write or an admin restore, so nothing is lost for good
CREATE TABLE IF NOT EXISTS save_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  save_at INTEGER,
  made_at INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS save_backups_user ON save_backups(user_id, id);
CREATE TABLE IF NOT EXISTS limits (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
