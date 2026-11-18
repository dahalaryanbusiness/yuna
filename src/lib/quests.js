// Daily and weekly quests. Every command a person uses is counted (see levels.afterCommand), so quests fill up on their own.
// State lives in the user record: u.quests = { day, daily: [...], week, weekly: [...], streak, sweepDay, total }
const store = require('../store');
const B = require('../data/balance');
const E = require('./eco');
const U = require('./util');

const AFFECTION = new Set(['kiss', 'hug', 'cuddle', 'pat', 'handhold', 'peck', 'bite', 'wink', 'blush', 'smile', 'dance', 'cry', 'tickle', 'feed', 'poke', 'highfive', 'wave', 'pout', 'laugh', 'stare', 'sleep', 'react', 'sticker']);
const IGNORE = new Set(['help', 'level', 'prefix', 'disablecommands', 'enablecommands', 'quest']);
const is = (c, s, name, sub) => c === name && (sub === undefined || s === sub);

// r.lp is the base reward (scaled up a little by your level), r.gems are bonus gems.
const DAILY = [
  { id: 'any10', icon: 'star_gold', text: 'Use **20** commands', goal: 20, match: () => true, r: { lp: 350 } },
  { id: 'love5', icon: 'heart_pulse', text: 'Send **8** affection actions (kiss, hug, pat...)', goal: 8, match: (c) => AFFECTION.has(c), r: { lp: 450 } },
  { id: 'work3', icon: 'briefcase_gold', text: 'Work **3** shifts or office tasks', goal: 3, match: (c) => c === 'work' || c === 'office', r: { lp: 500 } },
  { id: 'casino4', icon: 'slot_spin', text: 'Play **6** casino games', goal: 6, match: (c) => c === 'casino', r: { lp: 400 } },
  { id: 'collect', icon: 'a_cashbag_green', text: 'Collect your **business** income', goal: 1, match: (c, s) => is(c, s, 'business', 'collect'), r: { lp: 450 } },
  { id: 'daily', icon: 'gift_bounce', text: 'Claim your **/daily** reward', goal: 1, match: (c) => c === 'daily', r: { lp: 250 } },
  { id: 'dinner', icon: 'fam_home', text: 'Host a **family dinner**', goal: 1, match: (c, s) => is(c, s, 'family', 'dinner'), r: { lp: 500 } },
  { id: 'chore', icon: 'check', text: 'Do **2** family chores', goal: 2, match: (c, s) => is(c, s, 'family', 'chore'), r: { lp: 400 } },
  { id: 'explore', icon: 'fish', text: 'Wander **3** times (tide pools, meadow, ruins)', goal: 3, match: (c) => c === 'explore', r: { lp: 450 } },
  { id: 'ship', icon: 'bubble_hearts', text: 'Check **2** love matches (ship, lovemeter, zodiac)', goal: 2, match: (c) => ['ship', 'lovemeter', 'zodiac'].includes(c), r: { lp: 300 } },
  { id: 'invest', icon: 'bank', text: 'Trade on the market **2** times', goal: 2, match: (c, s) => c === 'invest' && ['buy', 'sell'].includes(s), r: { lp: 450 } },
  { id: 'fun', icon: 'dice_roll', text: 'Play **3** mini-games (rps, riddle, trivia...)', goal: 3, match: (c, s) => c === 'game', r: { lp: 400 } },
  { id: 'fortune', icon: 'sparkle', text: 'Read your **love fortune**', goal: 1, match: (c, s) => is(c, s, 'love', 'fortune'), r: { lp: 250 } },
  { id: 'pet', icon: 'paw', text: 'Care for your pet **2** times', goal: 2, match: (c) => c === 'pet', r: { lp: 350 } },
];
const WEEKLY = [
  { id: 'w_any80', icon: 'star_gold', text: 'Use **150** commands', goal: 150, match: () => true, r: { lp: 4000, gems: 3 } },
  { id: 'w_love30', icon: 'heart_pulse', text: 'Send **45** affection actions', goal: 45, match: (c) => AFFECTION.has(c), r: { lp: 4500, gems: 3 } },
  { id: 'w_work20', icon: 'briefcase_gold', text: 'Work **20** shifts or office tasks', goal: 20, match: (c) => c === 'work' || c === 'office', r: { lp: 5000, gems: 4 } },
  { id: 'w_casino25', icon: 'slot_spin', text: 'Play **35** casino games', goal: 35, match: (c) => c === 'casino', r: { lp: 4000, gems: 3 } },
  { id: 'w_dinner4', icon: 'fam_home', text: 'Host **4** family dinners', goal: 4, match: (c, s) => is(c, s, 'family', 'dinner'), r: { lp: 5000, gems: 4 } },
  { id: 'w_collect6', icon: 'a_cashbag_green', text: 'Collect business income **6** times', goal: 6, match: (c, s) => is(c, s, 'business', 'collect'), r: { lp: 4500, gems: 3 } },
  { id: 'w_fun10', icon: 'dice_roll', text: 'Play **10** mini-games', goal: 10, match: (c) => c === 'game', r: { lp: 4000, gems: 3 } },
];

const defs = new Map([...DAILY, ...WEEKLY].map((d) => [d.id, d]));
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
function weekKey() { // ISO-ish week: year + week number (weeks start Monday, UTC)
  const d = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const wk = 1 + Math.round(((d - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${wk}`;
}
const nextDayTs = () => { const d = new Date(); d.setUTCHours(24, 0, 0, 0); return Math.floor(d.getTime() / 1000); };
const nextWeekTs = () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + (8 - (d.getUTCDay() || 7))); return Math.floor(d.getTime() / 1000); };

function sample(list, n) {
  const pool = [...list]; const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
const fresh = (d) => ({ id: d.id, p: 0, done: false, claimed: false });

function state(id) {
  const u = store.user(id);
  if (!u.quests) u.quests = { day: '', daily: [], week: '', weekly: [], streak: 0, sweepDay: '', total: 0 };
  const q = u.quests;
  if (q.day !== today()) {
    // the streak only survives if yesterday's sweep happened
    if (q.sweepDay !== yesterday() && q.sweepDay !== today()) q.streak = 0;
    q.day = today(); q.daily = sample(DAILY, 3).map(fresh);
  }
  if (q.week !== weekKey()) { q.week = weekKey(); q.weekly = sample(WEEKLY, 2).map(fresh); }
  return q;
}

const level = (id) => require('./levels').levelOf(store.user(id).xp || 0);
const scaled = (id, lp) => Math.floor(lp * B.quests.lpMult * (1 + Math.min(level(id), B.quests.levelCap) * B.quests.levelScale));

// Counts one used command. Returns the quests that were just completed.
function track(id, cmd, sub) {
  if (IGNORE.has(cmd)) return [];
  const q = state(id);
  const finished = [];
  for (const slot of [...q.daily, ...q.weekly]) {
    const d = defs.get(slot.id);
    if (!d || slot.done) continue;
    let hit = false;
    try { hit = d.match(cmd, sub); } catch { hit = false; }
    if (!hit) continue;
    slot.p += 1;
    if (slot.p >= d.goal) { slot.done = true; finished.push(d); }
  }
  store.save();
  return finished;
}

// Pays every finished, unclaimed quest. Returns a summary (or null if nothing is ready).
function claim(id) {
  const q = state(id);
  const ready = [...q.daily, ...q.weekly].filter((s) => s.done && !s.claimed);
  if (!ready.length) return null;
  let lp = 0; let gems = 0; const lines = [];
  for (const s of ready) {
    const d = defs.get(s.id);
    const l = scaled(id, d.r.lp);
    lp += l; gems += d.r.gems || 0; s.claimed = true; q.total += 1;
    lines.push({ d, lp: l, gems: d.r.gems || 0 });
  }
  let sweep = null;
  if (q.sweepDay !== today() && q.daily.length && q.daily.every((s) => s.claimed)) {
    q.sweepDay = today();
    q.streak += 1;
    const bonusLp = scaled(id, 500) + B.quests.sweepStreak * Math.min(q.streak, 10);
    const bonusGems = 1 + (q.streak % 7 === 0 ? 3 : 0);
    const chest = q.streak % 5 === 0 ? 1 : 0;
    lp += bonusLp; gems += bonusGems;
    if (chest) { const u = store.user(id); u.inv.chest = (u.inv.chest || 0) + 1; }
    sweep = { lp: bonusLp, gems: bonusGems, streak: q.streak, chest };
  }
  E.earn(id, lp, { boost: false });
  if (gems) E.addGems(id, gems);
  store.save();
  return { lp, gems, lines, sweep };
}

const unclaimed = (id) => { const q = state(id); return [...q.daily, ...q.weekly].filter((s) => s.done && !s.claimed).length; };

module.exports = { state, track, claim, unclaimed, defs, nextDayTs, nextWeekTs, scaled, today };
