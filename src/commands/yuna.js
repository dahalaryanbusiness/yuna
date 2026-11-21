// /yuna: a short hello with the prefix and the first commands to try.
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { command, embed } = require('../lib/util');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');

const isUrl = (s) => /^https?:\/\//i.test(s || '');

module.exports = {
  data: command('yuna', 'Meet Yuna and see where to start'),

  async execute(interaction) {
    const { client } = interaction;
    const prefix = getPrefix(interaction.guildId);
    const slashCount = [...client.commands.values()].filter((c) => !c.prefixOnly).length;

    const em = embed()
      .setTitle(`Hi, I'm ${config.brand.name}`)
      .setDescription(
        'Relationships, a full economy, businesses, games, pets and a lot more, all in one bot.\n\n' +
        '**Start here**\n' +
        '`/help` shows everything I can do\n' +
        '`/daily` collects your first reward\n' +
        '`/profile` shows your card\n\n' +
        `You can also talk to me with text: \`${prefix} help\`\n` +
        `**${slashCount}** slash commands · **${client.guilds.cache.size.toLocaleString('en-US')}** servers`
      );
    if (client.user && client.user.displayAvatarURL) em.setThumbnail(client.user.displayAvatarURL({ size: 256 }));

    const links = [['Invite me', config.help.inviteUrl], ['Support server', config.help.supportUrl]]
      .filter(([, url]) => isUrl(url))
      .map(([label, url]) => new ButtonBuilder().setLabel(label).setURL(url).setStyle(ButtonStyle.Link));
    const payload = { embeds: [em] };
    if (links.length) payload.components = [new ActionRowBuilder().addComponents(links)];
    return interaction.reply(payload);
  },
};
