// UI toolkit: one place that decides how Yuna's replies look. Everything reads config/yuna.config.js.
//   ui.notice('success'|'error'|'warning'|'info', text, { title })  -> EmbedBuilder
//   ui.fromPlain(text)                                               -> EmbedBuilder (used by the automatic embed layer)
//   ui.paginate(interaction, pages, opts)                            -> reusable page-by-page viewer with buttons + menu
const { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config');
const store = require('../store');

const C = config.colors;
const KINDS = {
  success: { color: () => C.success, titleKey: 'successTitle' },
  error: { color: () => C.error, titleKey: 'errorTitle' },
  warning: { color: () => C.warning, titleKey: 'warningTitle' },
  info: { color: () => C.info, titleKey: 'infoTitle' },
  neutral: { color: () => C.neutral, titleKey: null },
};

// Which kind of notice does a plain sentence look like? (decided by its leading emoji)
const LEAD = [
  [/^(\u2705|\u2714|\uD83C\uDF89|<a?:yuna_(?:a_)?(?:check|confetti)\w*:\d+>)/u, 'success'],
  [/^(\u274C|\u26D4|\uD83D\uDEAB|\uD83D\uDEA8|\uD83D\uDC94|<a?:yuna_(?:a_)?(?:cross|siren)\w*:\d+>)/u, 'error'],
  [/^(\u26A0|<a?:yuna_(?:a_)?warn\w*:\d+>)/u, 'warning'],
  [/^(\u2139|<a?:yuna_(?:a_)?info\w*:\d+>)/u, 'info'],
  [/^(\u23F3|\u23F0|\uD83D\uDD50|\uD83D\uDD52|\uD83D\uDD53|\u231B|<a?:yuna_(?:a_)?clock\w*:\d+>)/u, 'warning'],
];
const kindOf = (text) => { for (const [re, k] of LEAD) if (re.test(text.trim())) return k; return 'neutral'; };

function applyBrand(em) {
  const d = em.data || em;
  if (config.brand.showTimestamp && !d.timestamp) em.setTimestamp();
  return em;
}

function notice(kind, text, { title } = {}) {
  const k = KINDS[kind] || KINDS.neutral;
  const em = new EmbedBuilder().setColor(k.color()).setDescription(String(text).slice(0, 4000));
  const t = title !== undefined ? title : k.titleKey ? config.ui[k.titleKey] : '';
  if (t) em.setTitle(t);
  return em;
}

function fromPlain(text) {
  const kind = config.ui.statusEmoji ? kindOf(text) : 'neutral';
  return notice(kind, text);
}

// Discord limits: description 4096, field value 1024, whole embed 6000. Trim instead of failing the whole reply.
function clamp(em) {
  if (!config.ui.safeLimits) return em;
  const d = em && em.data ? em.data : em;
  if (!d || typeof d !== 'object') return em;
  const cut = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}\u2026` : s);
  d.title = cut(d.title, 256);
  d.description = cut(d.description, 4000);
  if (Array.isArray(d.fields)) {
    d.fields = d.fields.slice(0, 25);
    for (const f of d.fields) { f.name = cut(String(f.name || '\u200b'), 256); f.value = cut(String(f.value || '\u200b'), 1024); }
  }
  const size = () => (d.title || '').length + (d.description || '').length + (d.fields || []).reduce((n, f) => n + f.name.length + f.value.length, 0) + (d.author ? (d.author.name || '').length : 0);
  let over = size() - 5900;
  if (over > 0 && d.description) { d.description = cut(d.description, Math.max(200, d.description.length - over)); over = size() - 5900; }
  while (over > 0 && d.fields && d.fields.length) { d.fields.pop(); over = size() - 5900; }
  return em;
}

// ------------------------------------------------------------------------------------------ paginator
// pages: array of EmbedBuilder, or { count, render(index) } for lazy pages.  opts: { user, ttl, menu: [{label, value, emoji, description}], startAt }
const sessions = new Map();
let seq = 0;
async function paginate(interaction, pages, opts = {}) {
  const lazy = !Array.isArray(pages);
  const total = lazy ? pages.count : pages.length;
  const get = (i) => (lazy ? pages.render(i) : pages[i]);
  const ttl = (opts.ttl || config.help.timeoutSeconds * 1000);
  const owner = opts.user || interaction.user.id;
  const id = `pg${(seq++).toString(36)}${Date.now().toString(36)}`;
  let idx = Math.min(Math.max(opts.startAt || 0, 0), total - 1);

  const render = () => {
    const rows = [];
    if (opts.menu && opts.menu.length) {
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`x:${id}:go`).setPlaceholder(opts.placeholder || 'Jump to a page').addOptions(opts.menu.slice(0, 25).map((m) => ({ ...m, default: Number(m.value) === idx })))
      ));
    }
    if (total > 1 || opts.close !== false) {
      const b = (act, label, emoji, style = ButtonStyle.Secondary, off = false) => new ButtonBuilder().setCustomId(`x:${id}:${act}`).setLabel(label).setEmoji(emoji).setStyle(style).setDisabled(off);
      const nav = [];
      if (total > 1) {
        const counter = new ButtonBuilder().setCustomId(`x:${id}:count`).setLabel(`${idx + 1}/${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true);
        nav.push(b('prev', 'Back', '\u25C0\uFE0F', ButtonStyle.Primary, idx === 0), counter, b('next', 'Next', '\u25B6\uFE0F', ButtonStyle.Primary, idx === total - 1));
      }
      if (opts.close !== false) nav.push(b('close', 'Close', '\u2716\uFE0F', ButtonStyle.Danger));
      rows.push(new ActionRowBuilder().addComponents(nav));
    }
    for (const extra of opts.links || []) { // link buttons (invite / support)
      const last = rows[rows.length - 1];
      if (last && last.components.length < 5 && last.components.every((c) => c.data.style === ButtonStyle.Link)) last.addComponents(extra);
      else rows.push(new ActionRowBuilder().addComponents(extra));
    }
    return rows.slice(0, 5);
  };
  const frame = () => {
    return { embeds: [clamp(get(idx))], components: render() };
  };

  if (sessions.size >= config.performance.maxButtonSessions) sessions.delete(sessions.keys().next().value);
  const end = () => { clearTimeout(s.timer); sessions.delete(id); };
  const s = {
    handler: async (i, action) => {
      if (i.user.id !== owner) return i.reply({ embeds: [notice('warning', 'This menu belongs to someone else. Open your own with the same command.')], flags: 64 });
      if (action === 'close') { end(); return i.update({ components: [] }); }
      if (action === 'go') idx = Number(i.values && i.values[0]) || 0;
      else if (action === 'prev') idx = Math.max(0, idx - 1);
      else if (action === 'next') idx = Math.min(total - 1, idx + 1);
      s.timer.refresh();
      return i.update(frame());
    },
  };
  s.timer = setTimeout(() => { sessions.delete(id); Promise.resolve(interaction.editReply({ components: [] })).catch(() => {}); }, ttl);
  if (s.timer.unref) s.timer.unref();
  sessions.set(id, s);
  return interaction.reply(frame());
}

// Called from the main button router for ids "x:pg...:action"
async function route(interaction) {
  const [, id, action] = interaction.customId.split(':');
  const s = sessions.get(id);
  if (!s) return interaction.reply({ embeds: [notice('info', 'This menu expired. Run the command again.')], flags: 64 });
  return s.handler(interaction, action);
}
const owns = (customId) => /^x:pg/.test(customId);

module.exports = { notice, fromPlain, kindOf, clamp, applyBrand, paginate, route, owns, KINDS };
