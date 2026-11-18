// Tiny persistent JSON store (no native modules, works on any Node 18+ host).
//
// WHERE THE DATA LIVES (first match wins):
//   1. DATA_DIR                      - you set it yourself (e.g. /data)
//   2. RAILWAY_VOLUME_MOUNT_PATH     - Railway sets this automatically when a Volume is attached
//   3. ./data                        - local folder (fine on your PC / a VPS, but WIPED on every
//                                      Railway deploy unless a Volume is attached!)
//
// Everything (users, couples, cooldowns) survives restarts: saves are atomic,
// happen within a fraction of a second, and rolling backups are kept next to love.json.
const fs = require('node:fs');
const path = require('node:path');

const ON_RAILWAY = Boolean(
  process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID
);
const VOLUME_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || '';
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : VOLUME_DIR
    ? path.resolve(VOLUME_DIR)
    : path.join(__dirname, '..', 'data');
// Is the chosen folder somewhere that survives a redeploy?
const PERSISTENT = !ON_RAILWAY || Boolean(process.env.DATA_DIR || VOLUME_DIR);
const FILE = path.join(DATA_DIR, 'love.json');
const BACKUP = `${FILE}.bak`;
const DAILY_BACKUP = `${FILE}.daily.bak`;
const PERF = require('./config').performance;
const SAVE_DELAY_MS = Math.max(50, PERF.saveDelayMs);
const BACKUP_EVERY_MS = Math.max(10, PERF.backupEverySeconds) * 1000;
const DAILY_EVERY_MS = 24 * 60 * 60 * 1000;
let dirty = false;
let lastBackup = 0;
let loadedFrom = 'nothing (fresh start)';

let db = { users: {}, pairs: {}, couples: {}, admirers: {}, guilds: {}, installs: {} };
let timer = null;

function newUser() {
  return {
    lp: 0, // love points (wallet)
    xp: 0, // level xp (earned by using commands, see lib/levels.js)
    bank: 0, // love points saved in the bank (safe from /rob)
    pet: null, // { type, name, xp, born }
    lastDaily: 0,
    streak: 0,
    bio: '',
    inv: {},
    stats: {
      sent: {},
      received: {},
      gifts_sent: 0,
      gifts_received: 0,
      letters: 0,
      flirts: 0,
      dates: 0,
      trivia: 0,
    },
    rel: null, // { type: 'dating'|'engaged'|'married', partner, since, startedAt }
    exes: [], // { id, at, type, by }
    healUntil: 0,
    crushes: [],
    blocked: [],
    parents: [],
    children: [],
    admirers: true,
    notes: [], // love notes inbox
    wishlist: [],
    history: [], // relationship timeline
    loveLanguage: '',
    gender: '', // 'girl' | 'boy' | 'other' | ''
    birthday: '', // MM-DD
    looking: false,
    petName: '',
    cd: {},
  };
}

function normalize(u) {
  const base = newUser();
  const out = Object.assign(base, u);
  out.stats = Object.assign(base.stats, u.stats || {});
  return out;
}

function readFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  let raw = null;
  for (const file of [FILE, BACKUP, DAILY_BACKUP]) {
    if (!fs.existsSync(file)) continue;
    try {
      raw = readFile(file);
      loadedFrom = path.basename(file);
      if (file !== FILE) console.warn(`[store] love.json was unreadable, restored from ${path.basename(file)}`);
      break;
    } catch (err) {
      console.error(`[store] could not read ${path.basename(file)}:`, err.message);
      try {
        fs.copyFileSync(file, `${file}.corrupt-${Date.now()}`);
      } catch {}
    }
  }
  if (!raw) {
    if (fs.existsSync(FILE)) console.error('[store] starting fresh; the unreadable file was kept as *.corrupt-*');
    else console.warn(`[store] no save file found in ${DATA_DIR} - starting with an empty database`);
    return;
  }
  db = Object.assign({ users: {}, pairs: {}, couples: {}, admirers: {}, guilds: {}, installs: {} }, raw);
  for (const id of Object.keys(db.users)) db.users[id] = normalize(db.users[id]);
  console.log(`[store] loaded ${Object.keys(db.users).length} user(s) from ${FILE}`);
}

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!dirty) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const now = Date.now();
    // Rolling backup of the last good file (at most once a minute).
    if (fs.existsSync(FILE) && now - lastBackup > BACKUP_EVERY_MS) {
      fs.copyFileSync(FILE, BACKUP);
      lastBackup = now;
      // One more backup that only rotates once a day, so a bad write can't wipe every copy.
      try {
        const old = fs.existsSync(DAILY_BACKUP) ? fs.statSync(DAILY_BACKUP).mtimeMs : 0;
        if (now - old > DAILY_EVERY_MS) fs.copyFileSync(FILE, DAILY_BACKUP);
      } catch {}
    }
    const tmp = `${FILE}.tmp`;
    const fd = fs.openSync(tmp, 'w');
    try {
      fs.writeFileSync(fd, JSON.stringify(db));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, FILE); // atomic swap so a crash never leaves a half-written file
    dirty = false;
  } catch (err) {
    console.error('[store] failed to save:', err.message);
  }
}

// Debounced save - call after any change.
function save() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(flush, SAVE_DELAY_MS);
  if (timer.unref) timer.unref();
}

function user(id) {
  if (!db.users[id]) db.users[id] = newUser();
  return db.users[id];
}

// Per-server settings (reserved).
function guild(id) {
  if (!db.guilds[id]) db.guilds[id] = {};
  return db.guilds[id];
}

// People who installed the bot to their own account (tracked from Discord webhook events).
function addInstall(id) {
  db.installs[id] = Date.now();
  save();
}
function removeInstall(id) {
  if (!db.installs[id]) return false;
  delete db.installs[id];
  save();
  return true;
}
const installCount = () => Object.keys(db.installs).length;

function hasUser(id) {
  return Boolean(db.users[id]);
}

function pairKey(a, b) {
  return [String(a), String(b)].sort().join(':');
}

// Removes every trace of a user (used by /privacy delete).
function deleteUser(id) {
  const me = db.users[id];
  if (me && me.rel) {
    const partner = db.users[me.rel.partner];
    if (partner) partner.rel = null;
  }
  for (const u of Object.values(db.users)) {
    u.crushes = u.crushes.filter((x) => x !== id);
    u.blocked = u.blocked.filter((x) => x !== id);
    u.exes = u.exes.filter((x) => x.id !== id);
    u.parents = u.parents.filter((x) => x !== id);
    u.children = u.children.filter((x) => x !== id);
    u.notes = (u.notes || []).filter((n) => n.from !== id);
    u.history = (u.history || []).filter((h) => h.partner !== id);
  }
  for (const key of Object.keys(db.couples)) if (key.split(':').includes(id)) delete db.couples[key];
  for (const key of Object.keys(db.pairs)) if (key.split(':').includes(id)) delete db.pairs[key];
  for (const [token, a] of Object.entries(db.admirers)) {
    if (a.from === id || a.to === id) delete db.admirers[token];
  }
  delete db.users[id];
  save();
}

load();
console.log(`[store] data folder: ${DATA_DIR} | persistent: ${PERSISTENT ? 'yes' : 'NO'}`);
if (!PERSISTENT) {
  console.error(
    '\n[store] !!! WARNING: running on Railway WITHOUT a Volume. Everything is erased on every deploy/restart. !!!\n' +
      '[store] Fix: Railway > your service > Volumes (or Ctrl+K > "Volume") > mount path /data. Then redeploy.\n'
  );
}
// Safety net: also flush every 30s, and on every way the process can end.
setInterval(flush, Math.max(5, PERF.autosaveSeconds) * 1000).unref();
process.on('exit', flush);
process.on('beforeExit', flush);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    flush();
    process.exit(0);
  });
}
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  flush();
  process.exit(1);
});

const info = () => ({ dir: DATA_DIR, persistent: PERSISTENT, loadedFrom, users: Object.keys(db.users).length });

module.exports = { user, guild, hasUser, addInstall, removeInstall, installCount, pairKey, deleteUser, save, flush, info, db: () => db };
