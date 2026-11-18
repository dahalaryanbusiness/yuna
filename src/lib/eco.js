// Shared economy helpers for Yuna's money systems (jobs, rewards, crime, business, stocks, lottery, casino).
// LP (Love Points) is the money. Gems are the rare currency from long rewards and promotions.
const store = require('../store');
const B = require('../data/balance');
const { e } = require('./emojis');
const U = require('./util');

const unix = (ms) => Math.floor(ms / 1000);
const rel = (ms) => `<t:${unix(ms)}:R>`;
const lp = (n) => `${e('coin')} **${U.num(Math.floor(n))}**`;
const gems = (n) => `${e('gem_pink')} **${U.num(Math.floor(n))}**`;

// Per-user economy block. Lives in the user record so it is saved with everything else.
function eco(id) {
  const u = store.user(id);
  if (!u.eco) u.eco = {};
  const x = u.eco;
  if (x.gems === undefined) x.gems = 0;
  if (x.job === undefined) x.job = null;
  if (!x.rw) x.rw = {}; // reward claims: { monthly: { last, streak, total } }
  if (x.jail === undefined) x.jail = 0;
  if (x.heat === undefined) { x.heat = 0; x.heatAt = 0; }
  if (!x.biz) x.biz = {}; // { cafe: { lvl, last } }
  if (!x.stocks) x.stocks = {}; // { SYM: { qty, cost } }
  if (!x.boost) x.boost = null; // { mult, until }
  if (x.earned === undefined) x.earned = 0;
  if (x.edu === undefined) { x.edu = 0; x.study = 0; }
  if (!x.st) x.st = { shifts: 0, crimes: 0, busts: 0, arrests: 0, jailed: 0, won: 0, lost: 0 };
  return x;
}

// Money in with the active boost applied. Use this for anything you EARN (not for refunds or bets).
// hard: apply the global difficulty multiplier (data/balance.js > hard.earnMult). Pass { hard: false } for money that is
// NOT income (casino payouts, lottery, selling shares or a business, refunds), so you never get your own money cut.
function earn(id, amount, { boost = true, hard = true } = {}) {
  const x = eco(id);
  let amt = Math.max(0, Math.floor(amount));
  if (hard && amt > 0) amt = Math.max(1, Math.round(amt * B.hard.earnMult));
  if (boost && x.boost && x.boost.until > Date.now()) amt = Math.floor(amt * x.boost.mult);
  U.award(id, amt);
  x.earned += amt;
  store.save();
  return amt;
}
function pay(id, amount) { // take money (returns false if the wallet is short)
  const u = store.user(id);
  if (u.lp < amount) return false;
  U.award(id, -amount);
  return true;
}
const addGems = (id, n) => { eco(id).gems += Math.floor(n); store.save(); };
const boostLeft = (id) => { const b = eco(id).boost; return b && b.until > Date.now() ? b : null; };

// Cooldown helpers that do not start the cooldown (peek) or that start it (U.cooldown).
const cdLeft = (id, key, ms) => Math.max(0, (store.user(id).cd[key] || 0) + ms - Date.now());
const cdStart = (id, key) => { store.user(id).cd[key] = Date.now(); store.save(); };

// Jail + wanted level (heat decays 1 star every 20 minutes).
const jailLeft = (id) => Math.max(0, eco(id).jail - Date.now());
function heat(id) {
  const x = eco(id);
  if (x.heat > 0) {
    const drop = Math.floor((Date.now() - x.heatAt) / (20 * 60000));
    if (drop > 0) { x.heat = Math.max(0, x.heat - drop); x.heatAt = x.heat ? x.heatAt + drop * 20 * 60000 : Date.now(); }
  }
  return x.heat;
}
function addHeat(id, n = 1) { const x = eco(id); heat(id); if (!x.heat) x.heatAt = Date.now(); x.heat = Math.min(5, x.heat + n); store.save(); return x.heat; }
const stars = (n) => (n ? e('star_gold').repeat(n) : 'none');

// Replies. `reply` works for slash and prefix interactions.
const say = (i, content) => i.reply({ content });
const hush = (i, content) => i.reply({ content, flags: U.EPH });
const card = (color, title, desc) => U.embed(color).setTitle(title).setDescription(desc);

// Blocks a command while the person is in jail. Returns true when it replied.
async function jailed(i) {
  const left = jailLeft(i.user.id);
  if (!left) return false;
  await i.reply({ content: `${e('bm_siren')} You are **in jail** for another ${U.fmtDur(left)} (${rel(Date.now() + left)}). Use \`/crime bail\`, \`/crime escape\` or wait it out.`, flags: U.EPH });
  return true;
}

// Reads "all", "half", "1.5k", "2m" or a plain number.
function parseAmount(text, max) {
  const t = String(text ?? '').toLowerCase().replace(/[, _]/g, '');
  if (t === 'all' || t === 'max') return max;
  if (t === 'half') return Math.floor(max / 2);
  const m = t.match(/^(\d+(?:\.\d+)?)(k|m|b)?$/);
  if (!m) return NaN;
  return Math.floor(parseFloat(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1));
}

// OwO style countdown: "4H 39M 33S" / "6D 4H 2M"
function hms(ms) {
  const t = Math.max(1, Math.ceil(ms / 1000));
  const d = Math.floor(t / 86400); const h = Math.floor((t % 86400) / 3600); const m = Math.floor((t % 3600) / 60); const sec = t % 60;
  if (d) return `${d}D ${h}H ${m}M`;
  if (h) return `${h}H ${m}M ${sec}S`;
  return `${m}M ${sec}S`;
}

// Daily cap for rewarded mini-games. Returns true (and counts it) while the person is still under `limit`
// paid rewards today (UTC). After that the game still works, it just stops paying.
function underCap(id, key, limit) {
  const x = eco(id);
  if (!x.cap) x.cap = {};
  const day = new Date().toISOString().slice(0, 10);
  const c = x.cap[key] && x.cap[key].d === day ? x.cap[key] : (x.cap[key] = { d: day, n: 0 });
  if (c.n >= limit) return false;
  c.n += 1;
  store.save();
  return true;
}

// Small bar like [▰▰▰▱▱]
const meter = (pct, n = 10) => { const f = Math.round(Math.max(0, Math.min(100, pct)) / 100 * n); return '▰'.repeat(f) + '▱'.repeat(n - f); };
const spark = (arr) => { const bars = '▁▂▃▄▅▆▇█'; const lo = Math.min(...arr); const hi = Math.max(...arr); return arr.map((v) => bars[hi === lo ? 3 : Math.round(((v - lo) / (hi - lo)) * 7)]).join(''); };

module.exports = { eco, earn, pay, underCap, addGems, boostLeft, cdLeft, cdStart, jailLeft, heat, addHeat, stars, say, hush, card, jailed, parseAmount, meter, spark, hms, rel, unix, lp, gems };
