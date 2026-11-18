// Per-channel command switch. A server admin can turn Yuna's commands off in one channel (all of them, or only some).
// Stored in the server settings: guild.off = { <channelId>: ['*'] | ['casino', 'casino:coinflip', 'give'] }
const store = require('../store');
const config = require('../config');

const NEVER_OFF = new Set(['disablecommands', 'enablecommands']); // so admins can always switch things back on

// Bot-wide switch from config/yuna.config.js > commands.disabled ('casino' or 'casino:slots').
function globalOff(name, sub) {
  const l = config.commands.disabled;
  return Boolean(l.length && !NEVER_OFF.has(name) && (l.includes(name) || (sub && l.includes(`${name}:${sub}`))));
}

function listFor(guildId, channelId) {
  const g = guildId && store.db().guilds[guildId];
  return (g && g.off && g.off[channelId]) || [];
}
function allOff(guildId, channelId) {
  return listFor(guildId, channelId).includes('*');
}
// name = command name ("casino"), sub = subcommand ("coinflip") or null.
function isOff(guildId, channelId, name, sub) {
  if (!guildId || !channelId || NEVER_OFF.has(name)) return false;
  const l = listFor(guildId, channelId);
  if (!l.length) return false;
  return l.includes('*') || l.includes(name) || Boolean(sub && l.includes(`${name}:${sub}`));
}
function setList(guildId, channelId, list) {
  const g = store.guild(guildId);
  if (!g.off) g.off = {};
  if (list.length) g.off[channelId] = list; else delete g.off[channelId];
  if (!Object.keys(g.off).length) delete g.off;
  store.save();
}
const label = (entry) => (entry === '*' ? 'all commands' : entry.includes(':') ? entry.replace(':', ' ') : entry);

module.exports = { globalOff, isOff, allOff, listFor, setList, label, NEVER_OFF };
