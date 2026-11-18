// /emojis - browse Yuna's custom (animated) emoji pack by category, with pages.
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const { command, embed, COLORS, EPH } = require('../lib/util');
const interactive = require('../lib/interactive');
const { e, categories, isCustom } = require('../lib/emojis');

const PER_PAGE = 36;

function view(cats, catIdx, page) {
  const [name, items] = cats[catIdx];
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const p = Math.min(Math.max(page, 0), pages - 1);
  const slice = items.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
  const lines = [];
  for (let i = 0; i < slice.length; i += 3) lines.push(slice.slice(i, i + 3).map((x) => `${x.text} \`${x.name}\``).join('   '));
  const total = cats.reduce((t, c) => t + c[1].length, 0);
  const live = cats.reduce((t, c) => t + c[1].filter((x) => isCustom(x.name)).length, 0);
  const em = embed(COLORS.pink)
    .setTitle(`${e('sparkle')} Yuna emojis: ${name}`)
    .setDescription(`${lines.join('\n') || '*empty*'}\n\n-# ${items.length} in this category • ${total} total • ${live} live • page ${p + 1}/${pages}${live < total ? ' • the rest are still uploading' : ''}`);
  return { em, p, pages };
}

module.exports = {
  data: command('emojis', "Browse Yuna's custom animated emojis (1,700+)"),
  async execute(interaction) {
    const cats = categories();
    if (!cats.length) return interaction.reply({ content: `${e('info')} The emoji pack is not installed (the \`assets/emojis\` folder is missing or empty), so there is nothing to browse yet.`, flags: EPH });
    let catIdx = Math.max(0, cats.findIndex(([n]) => n === 'Family'));
    let page = 0;
    const owner = interaction.user.id;

    const build = () => {
      const v = view(cats, catIdx, page);
      page = v.p;
      const menu = new StringSelectMenuBuilder().setCustomId(session.cid('cat')).setPlaceholder('Pick a category').addOptions(
        cats.slice(0, 25).map(([name, items], i) => ({ label: `${name} (${items.length})`, value: String(i), default: i === catIdx }))
      );
      const buttons = interactive.row(
        interactive.button(session.cid('prev'), 'Prev', ButtonStyle.Secondary).setDisabled(page <= 0),
        interactive.button(session.cid('next'), 'Next', ButtonStyle.Primary).setDisabled(page >= v.pages - 1)
      );
      return { embeds: [v.em], components: [new ActionRowBuilder().addComponents(menu), buttons] };
    };

    const session = interactive.create({
      ttl: 300000,
      handler: async (i, action) => {
        if (i.user.id !== owner) return i.reply({ content: 'Run `/emojis` yourself to browse 💖', flags: EPH });
        if (action === 'cat') { catIdx = Number(i.values[0]) || 0; page = 0; }
        else if (action === 'next') page++;
        else if (action === 'prev') page--;
        return i.update(build());
      },
      onExpire: () => interaction.editReply({ components: [] }),
    });
    return interaction.reply(build());
  },
};
