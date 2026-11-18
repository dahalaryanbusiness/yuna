// /react - one command for 60+ gif reactions (every action in /help plus the extras in data/reactions.js).
const { command, embed, EPH, COLORS } = require('../lib/util');
const { buildAction, run, getCfg, allConfigs } = require('../lib/interaction');
const reactions = require('../data/reactions');

// Registers each reaction (no slash command of its own, so the 100 command limit stays safe).
reactions.forEach((r) => buildAction(r));

const cmd = {
  data: command('react', 'Send any reaction gif: baka, smug, clap, love, yay and 60+ more')
    .addStringOption((o) =>
      o.setName('type').setDescription('Pick a reaction (type to search, or "list")').setRequired(true).setAutocomplete(true)
    )
    .addUserOption((o) => o.setName('user').setDescription('Who is it for? (optional)')),

  async autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase().trim();
    const hits = allConfigs()
      .filter((c) => !q || c.name.includes(q))
      .sort((a, b) => Number(b.name.startsWith(q)) - Number(a.name.startsWith(q)) || a.name.localeCompare(b.name))
      .slice(0, 25)
      .map((c) => ({ name: `${c.emoji} ${c.name}`, value: c.name }));
    return interaction.respond(hits);
  },

  async execute(interaction) {
    const raw = String(interaction.options.getString('type') || '').trim().toLowerCase().split(/\s+/)[0];
    if (!raw || raw === 'list') return showList(interaction);
    const cfg = getCfg(raw);
    if (!cfg) {
      return interaction.reply({ content: `I do not know a reaction called \`${raw}\`. Use \`/react list\` to see them all.`, flags: EPH });
    }
    return run(interaction, cfg);
  },
};

function showList(interaction) {
  const all = allConfigs();
  const e = embed(COLORS.pink)
    .setTitle(`✨ ${all.length} reaction gifs`)
    .setDescription('Use `/react type:<name> user:@someone` or just the slash command with the same name, if it has one.\nPrefix works too: `yuna baka @user`.')
    .addFields({ name: 'All reactions', value: all.map((c) => `${c.emoji} \`${c.name}\``).join('  ').slice(0, 1024) });
  return interaction.reply({ embeds: [e] });
}

Object.defineProperty(cmd, 'gifTypes', { get: () => allConfigs().map((c) => c.name) });
module.exports = cmd;
