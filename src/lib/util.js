const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const store = require('../store');
const trust = require('./trust');

const config = require('../config');
// Colors come from config/yuna.config.js, so changing them there recolors every embed.
const COLORS = config.colors;
const EPH = MessageFlags.Ephemeral;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;
const mention = (id) => `<@${id}>`;
const GENDER_ICON = { girl: '👧', boy: '👦', other: '🧑' };
const genderIcon = (id) => GENDER_ICON[store.user(id).gender] || '🧑';

// Every command works in servers, bot DMs and private channels, and can be user-installed.
function command(name, description) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1);
}

function embed(color = COLORS.pink) {
  return new EmbedBuilder().setColor(color);
}

// Ready-made status embeds: notice('error', 'Not enough LP') -> red embed. Same look everywhere.
const notice = (kind, text, opts) => require('./ui').notice(kind, text, opts);

function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Same two inputs always give the same 0-100 score (order does not matter).
function pairScore(a, b) {
  const [x, y] = [String(a).toLowerCase().trim(), String(b).toLowerCase().trim()].sort();
  return hash(`${x}|${y}`) % 101;
}

function bar(pct, size = 10) {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * size);
  return '💗'.repeat(filled) + '🤍'.repeat(size - filled);
}

function fmtDur(ms) {
  const s = Math.max(1, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const daysSince = (ts) => Math.floor((Date.now() - ts) / 86400000);
const unix = (ts) => Math.floor(ts / 1000);
const num = (n) => Number(n).toLocaleString('en-US');

// Returns remaining ms if still cooling down, otherwise starts the cooldown and returns 0.
function cooldown(id, key, ms) {
  const u = store.user(id);
  const now = Date.now();
  const last = u.cd[key] || 0;
  if (now - last < ms) return last + ms - now;
  u.cd[key] = now;
  store.save();
  return 0;
}

function award(id, amount) {
  const u = store.user(id);
  u.lp = Math.max(0, u.lp + amount);
  store.save();
  return u.lp;
}

// ---- couples -----------------------------------------------------------
const coupleKey = (a, b) => store.pairKey(a, b);

function getCouple(a, b) {
  const db = store.db();
  const key = coupleKey(a, b);
  if (!db.couples[key]) db.couples[key] = { xp: 0, created: Date.now() };
  return db.couples[key];
}

function addCoupleXp(a, b, amount) {
  const ua = store.user(a);
  if (!ua.rel || ua.rel.partner !== b) return null;
  const c = getCouple(a, b);
  c.xp = Math.max(0, (c.xp || 0) + amount);
  store.save();
  return c;
}

function levelInfo(xp) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const floor = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, floor, next, pct: Math.round(((xp - floor) / (next - floor)) * 100) };
}

function bumpPair(a, b, type) {
  const db = store.db();
  const key = coupleKey(a, b);
  db.pairs[key] ||= {};
  db.pairs[key][type] = (db.pairs[key][type] || 0) + 1;
  store.save();
  return db.pairs[key][type];
}

function logEvent(id, type, partner) {
  const u = store.user(id);
  u.history.unshift({ at: Date.now(), type, partner });
  u.history = u.history.slice(0, 30);
  store.save();
}

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// ---- privacy / blocking --------------------------------------------------
function isBlocked(actorId, targetId) {
  return (
    store.user(targetId).blocked.includes(actorId) || store.user(actorId).blocked.includes(targetId)
  );
}

// Standard checks for anything aimed at another user. Replies and returns false if not allowed.
async function guardTarget(interaction, target, { selfMsg, botMsg, allowSelf = false, allowBot = false } = {}) {
  if (!allowSelf && target.id === interaction.user.id) {
    await interaction.reply({ content: selfMsg || "You can't do that to yourself 💔", flags: EPH });
    return false;
  }
  if (!allowBot && target.bot && !trust.isTrusted(target.id, interaction.guildId)) {
    await interaction.reply({ content: botMsg || "Bots can't do that 🤖", flags: EPH });
    return false;
  }
  if (!target.bot && isBlocked(interaction.user.id, target.id)) {
    await interaction.reply({ content: "💔 You can't do that with this user.", flags: EPH });
    return false;
  }
  return true;
}

module.exports = {
  genderIcon,
  GENDER_ICON,
  COLORS,
  EPH,
  pick,
  rand,
  chance,
  mention,
  command,
  embed,
  notice,
  hash,
  pairScore,
  bar,
  fmtDur,
  daysSince,
  unix,
  num,
  ordinal,
  cooldown,
  award,
  coupleKey,
  getCouple,
  addCoupleXp,
  levelInfo,
  bumpPair,
  logEvent,
  isBlocked,
  guardTarget,
};
