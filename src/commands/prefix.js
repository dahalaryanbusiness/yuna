// /prefix - each server can pick its own text prefix (default: yuna).
const { PermissionFlagsBits } = require('discord.js');
const store = require('../store');
const { COLORS, EPH, command, embed } = require('../lib/util');
const { getPrefix, DEFAULT_PREFIX } = require('../lib/prefix');

const prefix = {
  data: command('prefix', 'See or change the text prefix for this server')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Change the prefix (needs Manage Server)')
        .addStringOption((o) => o.setName('text').setDescription('New prefix, up to 15 characters').setRequired(true).setMaxLength(15))
    )
    .addSubcommand((s) => s.setName('view').setDescription('Show the current prefix'))
    .addSubcommand((s) => s.setName('reset').setDescription('Go back to the default prefix (needs Manage Server)')),
  async execute(interaction) {
    if (!interaction.guildId) return interaction.reply({ content: 'Prefixes are set per server.', flags: EPH });
    const sub = interaction.options.getSubcommand();
    const current = getPrefix(interaction.guildId);
    if (sub === 'view') {
      const e = embed(COLORS.pink)
        .setTitle('Command prefix')
        .setDescription(`Current prefix: \`${current}\`\n\nExample: \`${current} kiss @user\`${/[a-z0-9]$/i.test(current) && current !== DEFAULT_PREFIX ? ` or glued: \`${current}kiss @user\`` : ''}\n\`${DEFAULT_PREFIX}\` and mentioning the bot always work too.\n\nChange it with \`${DEFAULT_PREFIX} prefix <new prefix>\` (needs Manage Server).`);
      return interaction.reply({ embeds: [e] });
    }
    const perms = interaction.memberPermissions;
    if (!perms || !perms.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You need the Manage Server permission to change the prefix.', flags: EPH });
    }
    if (sub === 'reset') {
      delete store.guild(interaction.guildId).prefix;
      store.save();
      return interaction.reply({ content: `Prefix reset to \`${DEFAULT_PREFIX}\`.` });
    }
    const text = interaction.options.getString('text', true).replace(/\s+/g, ' ').trim();
    if (!text || /[@`\n]/.test(text)) {
      return interaction.reply({ content: 'Choose a prefix without @ or backticks.', flags: EPH });
    }
    store.guild(interaction.guildId).prefix = text;
    store.save();
    return interaction.reply({
      embeds: [embed(COLORS.pink).setTitle('Prefix updated').setDescription(`New prefix: \`${text}\`\n\nExample: \`${text} hug @user\`${/[a-z0-9]$/i.test(text) ? ` or glued: \`${text}hug @user\`, \`${text}s 100\`` : ''}\n\`${DEFAULT_PREFIX}\` and mentioning the bot still work.`)],
    });
  },
};

module.exports = { commands: [prefix] };
