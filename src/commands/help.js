// /help: a page-by-page guide.
//   /help                  -> home page + menu/buttons (pages come from src/data/helpPages.js)
//   /help topic:<name>     -> detailed card for ANY command (usage, options, subcommands, examples) or a page name
// Command lists and usage lines are generated from the real command definitions, so they are always correct.
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, command, embed, notice } = require('../lib/util');
const { e, isCustom } = require('../lib/emojis');
const ui = require('../lib/ui');
const config = require('../config');
const { PAGES, DETAILS } = require('../data/helpPages');

const ico = (name, fallback) => (isCustom(name) ? e(name) : fallback);
const INDEX_PER_PAGE = 12;
const TYPE = { 3: 'text', 4: 'number', 5: 'yes/no', 6: '@user', 7: '#channel', 8: '@role', 10: 'number', 11: 'file' };

const slashJson = (c) => (c.data.toJSON ? c.data.toJSON() : c.data);
const allCommands = (client) => [...client.commands.values()].map((c) => ({ c, j: slashJson(c) })).sort((a, b) => a.j.name.localeCompare(b.j.name));
const subsOf = (j) => (j.options || []).filter((o) => o.type === 1);

function optLabel(o) {
  const t = o.choices ? o.choices.map((x) => x.value).slice(0, 5).join('|') + (o.choices.length > 5 ? '|…' : '') : TYPE[o.type] || 'value';
  return o.required ? `<${o.name}: ${t}>` : `[${o.name}: ${t}]`;
}
const usageLine = (name, sub, opts) => `/${name}${sub ? ` ${sub}` : ''}${opts.length ? ` ${opts.map(optLabel).join(' ')}` : ''}`;
const trim = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// ------------------------------------------------------------------------------------------------ pages
function visiblePages() {
  const hide = new Set(config.help.hidePages);
  return PAGES.filter((p) => !hide.has(p.key));
}

function buildPageList(client, p) {
  const pages = visiblePages();
  const cmds = allCommands(client);
  const indexCount = Math.max(1, Math.ceil(cmds.length / INDEX_PER_PAGE));
  const list = [];

  list.push({
    key: 'home', label: 'Home', emoji: '🏠',
    render: () => embed(COLORS.pink)
      .setTitle(`${ico('heart_pulse', '💖')} ${config.brand.name} help center`)
      .setDescription(`Build relationships, show affection, run businesses and collect **Love Points (LP)**.\nEvery command works as a slash command (\`/daily\`) and as text (\`${p} daily\`).`)
      .addFields(
        { name: '✨ Quick start', value: `New here? Open **Getting started** in the menu below.\nNeed one command explained? \`/help topic:bank\` or \`${p} help bank\`.` },
        { name: '📖 Guide pages', value: pages.map((pg) => `${pg.emoji} ${pg.label}`).join('\n').slice(0, 1000) },
        { name: '🗂️ Everything else', value: `**Command index** lists all **${cmds.length}** commands with a short description (${indexCount} pages).` }
      ),
  });
  for (const pg of pages) {
    list.push({
      key: pg.key, label: pg.label, emoji: pg.emoji,
      render: () => embed(pg.color).setTitle(`${ico(pg.icon || '', pg.emoji)} ${pg.title}`).setDescription(pg.blurb.replace(/\{p\}/g, p)).addFields(pg.fields(p).map((f) => ({ ...f, value: f.value.replace(/\{p\}/g, p) }))),
    });
  }
  for (let i = 0; i < indexCount; i++) {
    const slice = cmds.slice(i * INDEX_PER_PAGE, (i + 1) * INDEX_PER_PAGE);
    list.push({
      key: i === 0 ? 'index' : `index${i}`, label: i === 0 ? 'Command index' : null, emoji: '🗂️',
      render: () => embed(COLORS.grey).setTitle(`🗂️ Command index (${i + 1}/${indexCount})`)
        .setDescription(slice.map(({ c, j }) => {
          const subs = subsOf(j);
          return `**/${j.name}**${c.prefixOnly ? ' *(text only)*' : ''} · ${trim(j.description.replace(/\s+/g, ' '), 90)}${subs.length ? `\n-# ${trim(subs.map((s) => s.name).join(' · '), 110)}` : ''}`;
        }).join('\n'))
        .addFields({ name: 'Want details?', value: `\`/help topic:<command>\` shows usage, options and examples.` }),
    });
  }
  return list;
}

// ------------------------------------------------------------------------------------------------ command detail
function topicEmbed(client, rawTopic, p) {
  const words = String(rawTopic).trim().replace(/^[/]/, '').toLowerCase().split(/\s+/);
  const prefixMod = require('../lib/prefix');
  const real = client.commands.get(words[0]) && !client.commands.get(words[0]).folded; // a real command name beats an alias
  const aliasTarget = real ? null : prefixMod.ALIASES[words[0]];
  const sub = real ? null : prefixMod.SUBALIAS[words[0]];
  let name = aliasTarget || words[0];
  let wantSub = words[1] || null;
  if (!client.commands.get(name) && sub) { name = sub[0]; wantSub = wantSub || sub[1]; }
  const fold = require('../loadCommands').FOLD_MAP[name];
  if (!client.commands.get(name) && fold) { name = fold[0]; wantSub = wantSub || fold[1]; }
  const cmd = client.commands.get(name);

  if (!cmd) {
    const pg = visiblePages().find((x) => x.key === words[0] || x.label.toLowerCase().startsWith(words.join(' ')));
    if (pg) return embed(pg.color).setTitle(`${pg.emoji} ${pg.title}`).setDescription(pg.blurb.replace(/\{p\}/g, p)).addFields(pg.fields(p).map((f) => ({ ...f, value: f.value.replace(/\{p\}/g, p) })));
    const names = [...client.commands.keys()];
    const near = names.filter((n) => n.startsWith(words[0].slice(0, 2)) || n.includes(words[0])).slice(0, 6);
    return notice('warning', `I do not know **${trim(words[0], 40)}**.${near.length ? `\nDid you mean ${near.map((n) => `\`${n}\``).join(', ')}?` : ''}\nOpen \`/help\` and check the **Command index**.`, { title: 'Unknown command' });
  }

  const j = slashJson(cmd);
  const subs = subsOf(j);
  const em = embed(COLORS.pink).setTitle(`${ico('heart_pulse', '💖')} /${j.name}`).setDescription(j.description);
  const focus = wantSub ? subs.find((s) => s.name === wantSub) : null;

  if (focus) {
    em.setTitle(`/${j.name} ${focus.name}`).setDescription(focus.description);
    em.addFields({ name: 'Usage', value: `\`${usageLine(j.name, focus.name, focus.options || [])}\`\nText: \`${p} ${j.name} ${focus.name}${(focus.options || []).length ? ' ' + (focus.options || []).map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ') : ''}\`` });
  } else if (subs.length) {
    em.addFields({ name: 'Subcommands', value: trim(subs.map((s) => `\`${usageLine(j.name, s.name, s.options || [])}\`\n-# ${trim(s.description, 110)}`).join('\n'), 1020) });
    em.addFields({ name: 'Text', value: `\`${p} ${j.name} <${subs.map((s) => s.name).slice(0, 6).join('|')}${subs.length > 6 ? '|…' : ''}>\`` });
  } else {
    em.addFields({ name: 'Usage', value: `\`${usageLine(j.name, null, j.options || [])}\`\nText: \`${p} ${j.name}${(j.options || []).length ? ' ' + j.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ') : ''}\`` });
  }
  const opts = focus ? focus.options || [] : subs.length ? [] : j.options || [];
  const optLines = opts.map((o) => `\`${o.name}\` ${o.required ? '(required)' : '(optional)'} · ${trim(o.description, 100)}${o.choices ? `\n-# choices: ${trim(o.choices.map((c) => c.value).join(', '), 140)}` : ''}`);
  if (optLines.length) em.addFields({ name: 'Options', value: trim(optLines.join('\n'), 1020) });

  const aliases = [...Object.entries(prefixMod.ALIASES).filter(([, v]) => v === j.name).map(([k]) => k), ...Object.entries(prefixMod.SUBALIAS).filter(([, v]) => v[0] === j.name && (!focus || v[1] === focus.name)).map(([k]) => k)];
  if (aliases.length) em.addFields({ name: 'Text shortcuts', value: aliases.slice(0, 14).map((a) => `\`${p} ${a}\``).join(' · '), inline: false });

  const extra = DETAILS[j.name];
  if (extra) {
    em.addFields({ name: 'Examples', value: extra.examples.map((x) => `\`${x.replace(/\{p\}/g, p)}\``).join('\n') });
    if (extra.notes) em.addFields({ name: 'Good to know', value: extra.notes });
  }
  if (cmd.prefixOnly) em.setFooter({ text: 'This one is a text command only (no slash version).' });
  return em;
}

// ------------------------------------------------------------------------------------------------ command
const help = {
  data: command('help', 'See everything Yuna can do, page by page')
    .addStringOption((o) => o.setName('topic').setDescription('A command or guide page, e.g. bank, business, casino').setAutocomplete(true)),

  async autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase().replace(/^\//, '');
    const names = [...interaction.client.commands.keys()].map((n) => ({ name: `/${n}`, value: n }));
    const pages = visiblePages().map((pg) => ({ name: `${pg.emoji} ${pg.label} (guide)`, value: pg.key }));
    const hits = [...names, ...pages].filter((x) => !q || x.value.includes(q) || x.name.toLowerCase().includes(q)).slice(0, 25);
    return interaction.respond(hits);
  },

  async execute(interaction) {
    const p = require('../lib/prefix').getPrefix(interaction.guildId);
    const topic = interaction.options.getString('topic');
    const links = [];
    if (config.help.inviteUrl) links.push(new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(config.help.inviteUrl));
    if (config.help.supportUrl) links.push(new ButtonBuilder().setLabel('Support').setStyle(ButtonStyle.Link).setURL(config.help.supportUrl));

    if (topic) return interaction.reply({ embeds: [topicEmbed(interaction.client, topic, p)] });

    const list = buildPageList(interaction.client, p);
    const menuPages = list.filter((x) => x.label);
    const indexAt = list.findIndex((x) => x.key === 'index');
    // menu values are page numbers; the command index entry opens its first page
    const menu = menuPages.map((x) => ({ label: x.label, value: String(list.indexOf(x)), emoji: { name: x.emoji } }));
    void indexAt;
    return ui.paginate(interaction, { count: list.length, render: (i) => list[i].render() }, { menu, links, placeholder: 'Jump to a page' });
  },
};

module.exports = help;
