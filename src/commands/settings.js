// /settings: per-server look of Yuna's embeds. Needs Manage Server.
//   color  : accent color for Yuna's standard (pink) embeds. Status colors (green/red/orange) are never changed.
//   footer : text under embeds, or "off"
//   view   : shows what is set
//   reset  : back to the defaults from config/yuna.config.js
const { PermissionFlagsBits } = require('discord.js');
const store = require('../store');
const config = require('../config');
const { command, embed, notice } = require('../lib/util');

const HEX = /^#?([0-9a-f]{6})$/i;

const settings = {
  data: command('settings', "Change how Yuna's messages look in this server (Manage Server)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('view').setDescription('See this server\'s look settings'))
    .addSubcommand((s) => s.setName('color').setDescription('Set the accent color of Yuna\'s embeds').addStringOption((o) => o.setName('hex').setDescription('A hex color like #ff5c8a').setRequired(true)))
    .addSubcommand((s) => s.setName('footer').setDescription('Set the footer text under embeds, or "off" to hide it').addStringOption((o) => o.setName('text').setDescription('Footer text (max 100 characters) or off').setRequired(true)))
    .addSubcommand((s) => s.setName('reset').setDescription('Go back to the default look')),

  async execute(interaction) {
    if (!interaction.guildId) return interaction.reply({ embeds: [notice('warning', 'Server settings only exist inside a server.')], flags: 64 });
    const allowed = interaction.memberPermissions && interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild);
    if (!allowed) return interaction.reply({ embeds: [notice('error', 'You need the **Manage Server** permission to change this.')], flags: 64 });
    const g = store.guild(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    if (sub === 'color') {
      const m = String(interaction.options.getString('hex') || '').trim().match(HEX);
      if (!m) return interaction.reply({ embeds: [notice('error', 'Give me a color like `#ff5c8a` (6 hex digits).')], flags: 64 });
      g.ui = { ...(g.ui || {}), color: parseInt(m[1], 16) };
      store.save();
      return interaction.reply({ embeds: [embed(g.ui.color).setTitle('Accent color saved').setDescription(`Yuna's standard embeds in this server now use **#${m[1].toLowerCase()}**.`)] });
    }
    if (sub === 'footer') {
      const raw = String(interaction.options.getString('text') || '').trim().slice(0, 100);
      g.ui = { ...(g.ui || {}), footer: /^(off|none|hide)$/i.test(raw) ? false : raw };
      store.save();
      return interaction.reply({ embeds: [notice('success', g.ui.footer === false ? 'Footers are now hidden in this server.' : `Footer set to: **${raw}**`)] });
    }
    if (sub === 'reset') {
      delete g.ui;
      store.save();
      return interaction.reply({ embeds: [notice('success', 'The look of this server is back to the default.')] });
    }
    const ui = g.ui || {};
    return interaction.reply({
      embeds: [embed(ui.color ?? config.colors.neutral).setTitle('Server look').addFields(
        { name: 'Accent color', value: ui.color !== undefined ? `#${ui.color.toString(16).padStart(6, '0')}` : 'default', inline: true },
        { name: 'Footer', value: ui.footer === false ? 'hidden' : ui.footer || (config.brand.showFooter ? config.brand.footer : 'hidden'), inline: true }
      )],
    });
  },
};

module.exports = settings;
