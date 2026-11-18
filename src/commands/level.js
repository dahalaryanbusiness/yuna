// /level - your level, XP bar and the rewards you earn for levelling up.
const store = require('../store');
const L = require('../lib/levels');
const E = require('../lib/eco');
const { e } = require('../lib/emojis');
const { COLORS, command, embed, num } = require('../lib/util');

const rewardText = (r) => [`${e('coin')} ${num(r.lp)}`, r.gems ? `${e('gem_pink')} ${r.gems} gems` : '', r.chest ? `${e('chest')} ${r.chest} chest` : ''].filter(Boolean).join(' + ');

const level = {
  data: command('level', 'See your level, XP and level-up rewards')
    .addSubcommand((s) => s.setName('view').setDescription('Your level and XP (or someone else\'s)').addUserOption((o) => o.setName('user').setDescription('Whose level? (default: you)')))
    .addSubcommand((s) => s.setName('rewards').setDescription('See the rewards for the next levels')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'rewards') {
      const cur = L.levelOf(store.user(interaction.user.id).xp || 0);
      const rows = [];
      for (let lv = cur + 1; lv <= cur + 10; lv++) rows.push(`${lv % 5 === 0 ? e('crown') : e('a_twinkle_gold')} **Level ${lv}:** ${rewardText(L.rewardFor(lv))}`);
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('trophy_shine')} Level rewards`).setDescription(`${rows.join('\n')}\n\n-# Every level pays LP. Every 5th level adds gems, every 10th adds a Treasure Chest. Use any command to earn XP (one gain every 15 seconds).`)] });
    }
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots do not level up.', flags: require('../lib/util').EPH });
    const u = store.user(who.id);
    const p = L.progress(u.xp || 0);
    const nextM = L.nextMilestone(p.level);
    const e1 = embed(COLORS.purple)
      .setTitle(`${e('star_gold')} ${who.displayName}'s level`)
      .setThumbnail(who.displayAvatarURL({ size: 128 }))
      .setDescription(
        `**Level ${p.level}**\n${E.meter(p.pct, 12)} **${num(p.have)}** / ${num(p.need)} XP (${p.pct}%)\n-# Total XP: ${num(u.xp || 0)}\n\n` +
        `${e('gift_bounce')} **Next level (${p.level + 1}):** ${rewardText(L.rewardFor(p.level + 1))}\n` +
        `${e('crown')} **Next milestone (Level ${nextM}):** ${rewardText(L.rewardFor(nextM))}`
      );
    return interaction.reply({ embeds: [e1] });
  },
};

module.exports = { commands: [level] };
