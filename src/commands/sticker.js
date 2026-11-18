// /sticker - animated custom Yuna stickers (assets/stickers). They work everywhere because the bot
// attaches the file itself, so no server permission or Nitro is needed.
const fs = require('node:fs');
const path = require('node:path');
const { AttachmentBuilder } = require('discord.js');
const { command, embed, pick, guardTarget, COLORS, EPH } = require('../lib/util');
const { e } = require('../lib/emojis');

const DIR = path.join(__dirname, '..', '..', 'assets', 'stickers');
const LABELS = {
  love_you: '💖 Love U', hug: '🤗 Hugs', kiss: '💋 Mwah', miss_you: '🥺 Miss U', be_mine: '💘 Be Mine', good_morning: '🌞 Morning',
  good_night: '🌙 Nighty', cutie: '🌸 Cutie', mine: '😈 Mine', blush: '😳 Blush', yay: '🎉 Yay', sorry: '🙏 Sorry',
  besties: '👯 Besties', thank_you: '💐 Thanks',
};
const files = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.gif')).map((f) => f.replace(/\.gif$/, '')) : []);
const names = files();

const builder = command('sticker', 'Send an animated Yuna sticker to someone (or to the chat)')
  .addStringOption((o) => {
    o.setName('sticker').setDescription('Which sticker?').setRequired(true);
    o.addChoices({ name: '🎲 Random', value: 'random' }, ...names.slice(0, 24).map((n) => ({ name: LABELS[n] || n, value: n })));
    return o;
  })
  .addUserOption((o) => o.setName('user').setDescription('Who is it for? (optional)'));

module.exports = {
  data: builder,
  async execute(interaction) {
    let key = interaction.options.getString('sticker') || 'random';
    if (key === 'random' || !names.includes(key)) key = pick(names);
    if (!key) return interaction.reply({ content: 'No stickers installed yet.', flags: EPH });
    const target = interaction.options.getUser('user');
    if (target) {
      const ok = await guardTarget(interaction, target, { selfMsg: 'Send it to someone else 💞', botMsg: 'Bots love stickers too 🤖', allowBot: true });
      if (!ok) return;
    }
    await interaction.deferReply();
    const file = new AttachmentBuilder(path.join(DIR, `${key}.gif`), { name: `${key}.gif` });
    const label = LABELS[key] || key;
    const who = target ? `**${interaction.user.displayName}** sent **${target.displayName}** a sticker` : `**${interaction.user.displayName}** posted a sticker`;
    const em = embed(COLORS.pink).setDescription(`${e('sparkle')} ${who} ${e('heart_pulse')}\n-# ${label}`).setImage(`attachment://${key}.gif`);
    return interaction.editReply({ content: target ? `${target}` : undefined, embeds: [em], files: [file] });
  },
};
