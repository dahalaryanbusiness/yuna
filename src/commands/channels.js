// /disablecommands and /enablecommands - switch Yuna's commands off (or back on) in the channel you run them in.
//   yuna disablecommands                -> every command is off in this channel (slash and prefix)
//   yuna disablecommands casino give cf -> only those are off here
//   yuna disablecommands list           -> see what is off here
//   yuna enablecommands                 -> everything back on (or name the ones to turn on)
const { PermissionFlagsBits } = require('discord.js');
const C = require('../lib/channels');
const { e } = require('../lib/emojis');
const { EPH, command } = require('../lib/util');
const { resolveName } = require('../lib/prefix');

const opt = (o) => o.setName('commands').setDescription('Command names (like casino give cf). Empty = ALL commands. "list" shows what is off.');

function allowed(interaction) {
  const p = interaction.memberPermissions;
  return Boolean(p && (p.has(PermissionFlagsBits.ManageGuild) || p.has(PermissionFlagsBits.ManageChannels)));
}
const chanId = (i) => i.channelId || (i.channel && i.channel.id);

// "casino", "cf", "give" -> ['casino', 'casino:coinflip', 'give'] (unknown words are returned in `bad`)
function parse(interaction, text) {
  const entries = []; const bad = []; const never = [];
  for (const w of String(text || '').toLowerCase().split(/[\s,]+/).filter(Boolean)) {
    if (w === 'all' || w === '*' || w === 'everything') { entries.push('*'); continue; }
    const r = resolveName(interaction.client, w);
    if (!r) { bad.push(w); continue; }
    if (C.NEVER_OFF.has(r.name)) { never.push(w); continue; }
    entries.push(r.sub ? `${r.name}:${r.sub}` : r.name);
  }
  return { entries: [...new Set(entries)], bad, never };
}
const guard = async (interaction) => {
  if (!interaction.guildId) { await interaction.reply({ content: 'Use this inside a server channel.', flags: EPH }); return false; }
  if (!allowed(interaction)) { await interaction.reply({ content: `${e('cross')} You need **Manage Channels** or **Manage Server** to do that.`, flags: EPH }); return false; }
  return true;
};
const notes = (bad, never) => [bad.length ? `I don't know: ${bad.map((b) => `\`${b}\``).join(', ')}.` : '', never.length ? `\`${never.join(', ')}\` can't be switched off.` : ''].filter(Boolean).join(' ');

const disable = {
  data: command('disablecommands', 'Turn off Yuna commands in this channel (all, or only the ones you name)').addStringOption(opt),
  async execute(interaction) {
    if (!(await guard(interaction))) return;
    const gid = interaction.guildId; const ch = chanId(interaction);
    const text = (interaction.options.getString('commands') || '').trim();
    if (text.toLowerCase() === 'list') {
      const l = C.listFor(gid, ch);
      return interaction.reply({ content: l.length ? `${e('info')} Off in <#${ch}>: ${l.map((x) => `\`${C.label(x)}\``).join(', ')}` : `${e('check')} Everything is on in <#${ch}>.` });
    }
    const { entries, bad, never } = text ? parse(interaction, text) : { entries: ['*'], bad: [], never: [] };
    if (!entries.length) return interaction.reply({ content: `${e('cross')} Nothing to switch off. ${notes(bad, never)}`, flags: EPH });
    const list = entries.includes('*') ? ['*'] : [...new Set([...C.listFor(gid, ch), ...entries])];
    if (C.listFor(gid, ch).includes('*')) return interaction.reply({ content: `${e('info')} All commands are already off in <#${ch}>. Use \`yuna enablecommands\` to turn them back on.`, flags: EPH });
    C.setList(gid, ch, list);
    const what = list.includes('*') ? '**all commands** (slash and prefix)' : list.map((x) => `\`${C.label(x)}\``).join(', ');
    return interaction.reply({ content: `${e('check')} Switched off in <#${ch}>: ${what}. Nobody can use ${list.includes('*') ? 'any' : 'those'} here, other channels are not affected.\nTurn back on with \`yuna enablecommands\`. ${notes(bad, never)}`.trim() });
  },
};

const enable = {
  data: command('enablecommands', 'Turn Yuna commands back on in this channel (all, or only the ones you name)').addStringOption(opt),
  async execute(interaction) {
    if (!(await guard(interaction))) return;
    const gid = interaction.guildId; const ch = chanId(interaction);
    const text = (interaction.options.getString('commands') || '').trim();
    const cur = C.listFor(gid, ch);
    if (!cur.length) return interaction.reply({ content: `${e('check')} Everything is already on in <#${ch}>.`, flags: EPH });
    const { entries, bad, never } = text && text.toLowerCase() !== 'all' ? parse(interaction, text) : { entries: ['*'], bad: [], never: [] };
    if (entries.includes('*')) { C.setList(gid, ch, []); return interaction.reply({ content: `${e('check')} All commands are back on in <#${ch}>.` }); }
    if (cur.includes('*')) return interaction.reply({ content: `${e('info')} All commands are off here, so run \`yuna enablecommands\` with nothing after it to turn everything back on.`, flags: EPH });
    // "casino coinflip" can't be switched on while the whole "casino" is off: that needs "casino" itself.
    const covered = entries.filter((x) => x.includes(':') && cur.includes(x.split(':')[0]));
    const todo = entries.filter((x) => !covered.includes(x));
    const left = cur.filter((x) => !todo.includes(x) && !todo.some((en) => x.startsWith(`${en}:`)));
    if (todo.length) C.setList(gid, ch, left);
    const on = todo.length ? `${e('check')} Back on in <#${ch}>: ${todo.map((x) => `\`${C.label(x)}\``).join(', ')}. ` : '';
    const why = covered.length ? `${e('info')} ${covered.map((x) => `\`${C.label(x)}\``).join(', ')} can't be switched on alone because \`${[...new Set(covered.map((x) => x.split(':')[0]))].join(', ')}\` is off as a whole. Enable that instead. ` : '';
    const rest = todo.length ? (left.length ? `Still off: ${left.map((x) => `\`${C.label(x)}\``).join(', ')}. ` : 'Everything is on now. ') : '';
    return interaction.reply({ content: `${on}${why}${rest}${notes(bad, never)}`.trim() });
  },
};

module.exports = { commands: [disable, enable] };
