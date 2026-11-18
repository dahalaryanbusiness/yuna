// "Skin": swaps plain unicode emojis in everything Yuna sends for her own custom (animated) emojis,
// so every command, embed and message looks like Yuna, without hand-editing every string.
// Only emojis that are really uploaded get swapped; anything else stays as normal unicode.
const { e, isCustom, manifest } = require('./emojis');

const MAP = {
  '💖': 'heart_pulse', '💗': 'heart_float', '💞': 'heart_spin', '💕': 'bubble_hearts', '❤️': 'heart_red', '❤': 'heart_red', '🩷': 'heart_pink',
  '💜': 'heart_purple', '💙': 'heart_blue', '💛': 'heart_gold', '🖤': 'heart_black', '🤍': 'heart_white', '💚': 'heart_green',
  '💍': 'ring', '🌸': 'flower', '👑': 'crown', '🦋': 'butterfly', '🌙': 'moon', '🎉': 'confetti', '🥳': 'confetti', '💔': 'heartbreak',
  '✨': 'sparkle', '🌟': 'stars', '⭐': 'star_gold', '🌹': 'rose', '💐': 'bouquet', '🍫': 'chocolate', '🍰': 'cake', '🧸': 'teddy',
  '🎈': 'balloon', '💌': 'letter', '🕯️': 'candle', '🏹': 'arrow', '📿': 'necklace', '🔒': 'lock', '🎁': 'gift_bounce', '💋': 'kissmark',
  '🏆': 'trophy_shine', '🐟': 'fish', '🗝️': 'key', '💎': 'diamond_shine', '🪙': 'coin_spin', '💰': 'moneybag', '🏦': 'bank', '🎲': 'dice_roll',
  '🎰': 'slot_spin', '🐾': 'paw', '🔥': 'fire', '✅': 'check', '❌': 'cross', '⚠️': 'warn', 'ℹ️': 'info', '🛡️': 'shield', '🎟️': 'ticket',
  '🍷': 'wine', '💄': 'lipstick', '🐱': 'pet_cat', '🐶': 'pet_dog', '🐰': 'pet_bunny', '🦊': 'pet_fox', '🐼': 'pet_panda', '🐲': 'pet_dragon',
  '🃏': 'cards',
};
// Mega pack: every generated emoji can claim unicode emojis to replace (see tools/mega/*.py). First claim wins and
// the classic mappings above are never overridden.
for (const [name, m] of Object.entries(manifest())) for (const u of m.r || []) if (!(u in MAP)) MAP[u] = name;
const RE = new RegExp(
  Object.keys(MAP).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gu'
);
// ":casino_chip:" style tokens: ":chip_red:" -> custom emoji (only when that emoji exists, so ":12:30:" is safe).
const TOKEN = /:(a_)?([a-z][a-z0-9_]{1,26}):/g;
const token = (m, a, n) => { const name = (a || '') + n; return isCustom(name) ? e(name) : m; };

// Skips text that is already a custom emoji tag like <a:yuna_x:123>.
function text(str) {
  if (typeof str !== 'string' || !str) return str;
  return str.replace(/<a?:\w+:\d+>|[^<]+|</g, (chunk) => {
    if (chunk.startsWith('<') && chunk.length > 1) return chunk;
    return chunk.replace(TOKEN, token).replace(RE, (m) => (isCustom(MAP[m]) ? e(MAP[m]) : m));
  });
}

function embed(em) {
  const data = em && em.data ? em.data : em;
  if (!data || typeof data !== 'object') return em;
  if (data.title) data.title = text(data.title);
  if (data.description) data.description = text(data.description);
  if (Array.isArray(data.fields)) for (const f of data.fields) { f.name = text(f.name); f.value = text(f.value); }
  return em;
}


// ---------------------------------------------------------------------------------------------------------------
// STYLE POLICY (configurable in config/yuna.config.js > ui)
//   style 'embed' (default): every reply is an embed. Plain one-liners (errors, notices, confirmations) are wrapped
//                            in a styled embed automatically, text sent next to an embed is merged into it.
//   style 'mixed'          : same, except the commands listed in ui.plainCommands are sent as clean raw text.
// Raw text is only kept where Discord needs it: messages with attachments/stickers/polls, and @mentions (they stay in
// `content` so the person is still pinged while the text itself is shown in the embed).
// ---------------------------------------------------------------------------------------------------------------
const config = require('../config');
const ui = require('./ui');

const rawFor = (name, sub) => {
  if (config.ui.style !== 'mixed') return false;
  const v = config.ui.plainCommands[name];
  if (!v) return false;
  if (v === '*') return true;
  if (Array.isArray(v)) return v.includes(sub);
  return !(v.not || []).includes(sub);
};

function embedToText(em) {
  const d = em && em.data ? em.data : em;
  if (!d || d.image || d.thumbnail || d.author) return null;
  const out = [];
  if (d.title) out.push(`**${d.title}**`);
  if (d.description) out.push(d.description);
  if (Array.isArray(d.fields) && d.fields.length) {
    const parts = d.fields.map((f) => `**${String(f.name).replace(/\*\*/g, '')}** ${f.value}`);
    out.push(parts.join('').length < 140 && !parts.some((x) => x.includes('\n')) ? parts.join('  \u2022  ') : parts.join('\n'));
  }
  if (d.footer && d.footer.text) out.push(`-# ${d.footer.text}`);
  return out.join('\n');
}

// Only used in 'mixed' style: short results of the listed commands become plain text.
function rawify(p, ctx) {
  if (!ctx || !p || !Array.isArray(p.embeds) || !p.embeds.length || !rawFor(ctx.name, ctx.sub)) return p;
  const texts = p.embeds.map(embedToText);
  if (texts.some((t) => t === null)) return p;
  const content = [p.content, ...texts].filter(Boolean).join('\n');
  if (content.length > 1900 || content.split('\n').filter((l) => l.trim()).length > 3 || /[\u25B0\u25B1]/.test(content)) return p;
  return { ...p, content, embeds: [] };
}

const MENTION = /<@[!&]?\d+>/g;
const keepRaw = (p) => Boolean((p.files && p.files.length) || (p.stickers && p.stickers.length) || p.poll || (p.attachments && p.attachments.length));

// Content-only replies become embeds; content next to an embed is merged into it.
function autoEmbed(p, ctx) {
  const self = ctx && ctx.userId ? `<@${ctx.userId}>` : null;
  if (!config.ui.autoEmbed || keepRaw(p)) return p;
  const rawStyle = rawFor(ctx && ctx.name, ctx && ctx.sub);
  if (rawStyle) return p;
  const content = typeof p.content === 'string' ? p.content.trim() : '';
  const hasEmbeds = Array.isArray(p.embeds) && p.embeds.length > 0;
  if (!content) return p;
  const pings = (content.match(MENTION) || []).filter((m) => m !== self && m !== self?.replace('<@', '<@!')); // never ping yourself
  const text = content;
  if (!hasEmbeds) {
    const em = ui.fromPlain(text.length > 3900 ? `${text.slice(0, 3899)}\u2026` : text);
    ui.applyBrand(em);
    const out = { ...p, embeds: [em] };
    out.content = pings.length ? [...new Set(pings)].join(' ') : undefined; // pings stay outside the embed so they still notify
    if (!out.content) delete out.content;
    return out;
  }
  if (!config.ui.mergeContent || pings.length || text.length > 1500) return p; // keep as it was: it carries a ping or is long
  const first = p.embeds[0];
  const d = first && first.data ? first.data : first;
  if (!d || typeof d !== 'object') return p;
  d.description = d.description ? `${text}\n\n${d.description}` : text;
  const out = { ...p, embeds: p.embeds };
  delete out.content;
  return out;
}

function payload(p, ctx, edit = false) {
  const look = ctx && ctx.guildId ? (require('../store').db().guilds[ctx.guildId] || {}).ui : null;
  if (typeof p === 'string') p = { content: p };
  const hadContent = Boolean(p && typeof p === 'object' && typeof p.content === 'string' && p.content);
  if (!p || typeof p !== 'object') return p;
  let out = { ...rawify(p, ctx) };
  if (out.content) out.content = text(out.content);
  if (Array.isArray(out.embeds)) out.embeds = out.embeds.map(embed);
  out = autoEmbed(out, ctx);
  if (Array.isArray(out.embeds)) {
    out.embeds = out.embeds.map((em) => {
      const d = em && em.data ? em.data : em;
      if (em && em.setFooter && d && !d.color && d.color !== 0) em.setColor(config.colors.neutral);
      if (look && look.color !== undefined && d && (d.color === config.colors.pink || d.color === config.colors.neutral)) em.setColor(look.color); // server accent, status colors untouched
      if (em && em.setFooter) {
        if (look && look.footer === false) { /* footer hidden by this server */ } else if (look && typeof look.footer === 'string' && look.footer && !d.footer) em.setFooter({ text: look.footer });
        else ui.applyBrand(em);
      }
      return ui.clamp(em);
    }).slice(0, 10);
  }
  if (edit && hadContent && !out.content) out.content = null; // an edit must clear text that moved into the embed
  return out;
}

// Patches an interaction so everything it sends goes through the skin.
function wrap(interaction) {
  const ctx = () => {
    let sub = null;
    try { sub = interaction.options && interaction.options.getSubcommand ? interaction.options.getSubcommand(false) : null; } catch { sub = null; }
    return { name: interaction.commandName, sub, guildId: interaction.guildId, userId: interaction.user && interaction.user.id };
  };
  const live = typeof interaction.isChatInputCommand === 'function' && interaction.isChatInputCommand();
  for (const m of ['reply', 'editReply', 'followUp', 'update']) {
    if (typeof interaction[m] !== 'function') continue;
    const orig = interaction[m].bind(interaction);
    const isEdit = m === 'editReply' || m === 'update';
    interaction[m] = (p, ...rest) => orig(payload(p, live || interaction.commandName ? ctx() : null, isEdit), ...rest);
  }
  return interaction;
}

module.exports = { text, payload, wrap, MAP, rawFor };
