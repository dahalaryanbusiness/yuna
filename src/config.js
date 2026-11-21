// Loads config/yuna.config.js on top of safe defaults. Anything missing or invalid falls back to the default, so a
// typo in the config file can never stop the bot from starting (it prints a warning instead).
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  brand: { name: 'Yuna', showTimestamp: false },
  colors: { pink: 0xff5c8a, red: 0xe63946, gold: 0xffc857, purple: 0xb085f5, grey: 0x6c757d, orange: 0xffb347, green: 0x57d68d, success: 0x57d68d, error: 0xe63946, warning: 0xffb347, info: 0x8ab4f8, neutral: 0xff5c8a },
  ui: { style: 'embed', plainCommands: {}, autoEmbed: true, mergeContent: true, statusEmoji: true, safeLimits: true, errorTitle: 'Oops', successTitle: '', warningTitle: 'Heads up', infoTitle: '' },
  prefix: { default: 'yuna', allowMention: true, aliases: {}, hintOnBarePrefix: true },
  commands: { disabled: [], disabledMessage: 'That command is turned off.' },
  presence: { status: 'dnd', type: 'Streaming', text: '{servers} servers', url: 'https://www.twitch.tv/discord', refreshSeconds: 60 },
  help: { timeoutSeconds: 600, inviteUrl: '', supportUrl: '', hidePages: [], showPrefixTips: true },
  performance: { saveDelayMs: 400, autosaveSeconds: 30, backupEverySeconds: 60, maxButtonSessions: 5000 },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function merge(base, extra, trail = '') {
  const out = Array.isArray(base) ? [...base] : { ...base };
  if (!isObj(extra)) return out;
  for (const [k, v] of Object.entries(extra)) {
    const here = trail ? `${trail}.${k}` : k;
    if (!(k in base)) { if (!trail.startsWith('prefix.aliases') && !trail.startsWith('ui.plainCommands')) console.warn(`[config] unknown setting "${here}" ignored`); if (!trail.startsWith('prefix.aliases') && !trail.startsWith('ui.plainCommands')) continue; }
    if (isObj(base[k]) && isObj(v)) out[k] = merge(base[k], v, here);
    else if (k in base && typeof base[k] !== typeof v && !(Array.isArray(base[k]) && Array.isArray(v))) console.warn(`[config] "${here}" should be a ${Array.isArray(base[k]) ? 'list' : typeof base[k]}, using the default`);
    else out[k] = v;
  }
  return out;
}

function load() {
  const file = process.env.YUNA_CONFIG ? path.resolve(process.env.YUNA_CONFIG) : path.join(__dirname, '..', 'config', 'yuna.config.js');
  let user = {};
  if (fs.existsSync(file)) {
    try { delete require.cache[require.resolve(file)]; user = require(file); } catch (err) { console.error(`[config] could not read ${file}: ${err.message}. Using defaults.`); }
  }
  const cfg = merge(DEFAULTS, user);
  // environment overrides
  if (process.env.BOT_STATUS) cfg.presence.status = process.env.BOT_STATUS.toLowerCase();
  if (process.env.STREAM_URL) cfg.presence.url = process.env.STREAM_URL;
  if (process.env.ROTATE_SECONDS) cfg.presence.refreshSeconds = Math.max(30, Number(process.env.ROTATE_SECONDS) || 60);
  if (process.env.DEFAULT_PREFIX) cfg.prefix.default = process.env.DEFAULT_PREFIX;
  if (!['embed', 'mixed'].includes(cfg.ui.style)) { console.warn(`[config] ui.style must be "embed" or "mixed", using "embed"`); cfg.ui.style = 'embed'; }
  cfg.prefix.default = String(cfg.prefix.default || 'yuna').toLowerCase();
  return cfg;
}

const config = load();
module.exports = config;
module.exports.DEFAULTS = DEFAULTS;
module.exports.reload = () => { const fresh = load(); for (const k of Object.keys(fresh)) config[k] = fresh[k]; return config; };
