// Trusted bots: other bots (like your server's AI companion "Ommne") that may run Yuna's text commands
// ("yuna hug @user", "yuna slap @user"). Every OTHER bot is still ignored, so there are no bot-to-bot loops or spam.
//
// Two ways to trust a bot:
//   1. Per server, by a server manager:   /trustedbots add @Ommne     (or:  yuna trustedbots add <bot id>)
//   2. Everywhere, in .env / Railway Variables:   TRUSTED_BOT_IDS=123456789012345678,987654321098765432
//
// Safety rails for trusted bots (all automatic):
//   - they can only use Yuna inside servers (not DMs) and only through text commands
//   - money, crime, shop, casino, admin and privacy commands are blocked for them (they can't farm Love Points)
//   - rate limit: 1 command / 1.5 s and 8 commands / 20 s per bot, extra messages are silently ignored
//   - a message that replies to one of Yuna's own messages is ignored (stops "bot answers bot" loops)
//   - Yuna never answers a trusted bot with error text, only with real command results
const store = require('../store');

const ENV_IDS = new Set(String(process.env.TRUSTED_BOT_IDS || '').split(/[\s,;]+/).filter((x) => /^\d{15,25}$/.test(x)));

// Commands a bot can NOT run (everything about money, crime, settings and privacy).
const BLOCKED = new Set([
  'rob', 'give', 'crime', 'casino', 'lottery', 'invest', 'business', 'bank', 'buy', 'gift', 'job', 'office', 'rewards', 'daily', 'weekly',
  'monthly', 'work', 'quest', 'pet', 'explore', 'timelock', 'garden', 'cash', 'wallet', 'balance', 'leaderboard', 'inventory', 'shop',
  'prefix', 'disablecommands', 'enablecommands', 'trustedbots', 'privacy', 'admirer', 'whisper', 'duet', 'me', 'us', 'family',
]);

const guildList = (guildId) => {
  const g = guildId ? store.guild(guildId) : null;
  return g && Array.isArray(g.trustedBots) ? g.trustedBots : [];
};

const isTrusted = (botId, guildId) => ENV_IDS.has(String(botId)) || guildList(guildId).includes(String(botId));
const list = (guildId) => [...new Set([...ENV_IDS, ...guildList(guildId)])];
const fromEnv = (botId) => ENV_IDS.has(String(botId));

function add(guildId, botId) {
  const g = store.guild(guildId);
  g.trustedBots = Array.isArray(g.trustedBots) ? g.trustedBots : [];
  if (g.trustedBots.includes(String(botId))) return false;
  if (g.trustedBots.length >= 20) return null; // sane limit
  g.trustedBots.push(String(botId));
  store.save();
  return true;
}
function remove(guildId, botId) {
  const g = store.guild(guildId);
  const before = (g.trustedBots || []).length;
  g.trustedBots = (g.trustedBots || []).filter((x) => x !== String(botId));
  store.save();
  return g.trustedBots.length !== before;
}

// Rate limit (memory only).
const hits = new Map(); // botId -> [timestamps]
function allow(botId) {
  const now = Date.now();
  const arr = (hits.get(botId) || []).filter((t) => now - t < 20000);
  if (arr.length && now - arr[arr.length - 1] < 1500) { hits.set(botId, arr); return false; }
  if (arr.length >= 8) { hits.set(botId, arr); return false; }
  arr.push(now);
  hits.set(botId, arr);
  return true;
}
const canRun = (cmdName) => !BLOCKED.has(cmdName);

module.exports = { isTrusted, list, fromEnv, add, remove, allow, canRun, BLOCKED };
