// /quest - three daily quests and two weekly quests that fill up by simply using Yuna.
const Q = require('../lib/quests');
const E = require('../lib/eco');
const { create, button, row, ButtonStyle } = require('../lib/interactive');
const { e } = require('../lib/emojis');
const { COLORS, command, embed, num } = require('../lib/util');

const line = (slot) => {
  const d = Q.defs.get(slot.id);
  const pct = Math.min(100, Math.round((slot.p / d.goal) * 100));
  const mark = slot.claimed ? e('check') : slot.done ? e('gift_bounce') : e(d.icon);
  const reward = `${e('coin')} ${num(d.r.lp)}${d.r.gems ? ` + ${e('gem_pink')} ${d.r.gems}` : ''}`;
  const state = slot.claimed ? '*claimed*' : slot.done ? '**ready to claim!**' : `${Math.min(slot.p, d.goal)}/${d.goal}`;
  return `${mark} ${d.text}\n-# ${E.meter(pct, 8)} ${state} \u2022 ${reward}`;
};

function view(user) {
  const q = Q.state(user.id);
  const ready = Q.unclaimed(user.id);
  const doneToday = q.daily.filter((s) => s.claimed).length;
  const emb = embed(COLORS.gold)
    .setAuthor({ name: `${user.displayName || user.username}'s quests`, iconURL: user.displayAvatarURL({ size: 64 }) })
    .setTitle(`${e('trophy_shine')} Yuna quests`)
    .setDescription(
      `**Daily quests** \u2022 resets <t:${Q.nextDayTs()}:R>\n${q.daily.map(line).join('\n')}\n\n` +
      `**Weekly quests** \u2022 resets <t:${Q.nextWeekTs()}:R>\n${q.weekly.map(line).join('\n')}\n\n` +
      `${e('fire')} Streak: **${q.streak}** day${q.streak === 1 ? '' : 's'} \u2022 Quests done: **${q.total}**\n` +
      `-# Finish and claim all 3 daily quests for a sweep bonus. Every 5th streak day adds a Treasure Chest.`
    )
    .setFooter({ text: doneToday === 3 ? 'All daily quests claimed, see you tomorrow!' : 'Just use Yuna normally and the bars fill up' });
  return { emb, ready };
}

function claimEmbed(user, res) {
  const rows = res.lines.map((l) => `${e('check')} ${l.d.text.replace(/\*\*/g, '')} \u2192 ${e('coin')} **${num(l.lp)}**${l.gems ? ` + ${e('gem_pink')} **${l.gems}**` : ''}`);
  const sweep = res.sweep
    ? `\n\n${e('confetti')} **Daily sweep!** +${num(res.sweep.lp)} LP + ${res.sweep.gems} gem${res.sweep.gems === 1 ? '' : 's'}${res.sweep.chest ? ` + ${e('chest')} Treasure Chest` : ''}\n${e('fire')} Streak: **${res.sweep.streak}** day${res.sweep.streak === 1 ? '' : 's'}`
    : '';
  return embed(COLORS.green)
    .setTitle(`${e('gift_bounce')} Quest rewards`)
    .setDescription(`${rows.join('\n')}${sweep}\n\n${e('coin')} Total: **${num(res.lp)}** LP${res.gems ? ` + ${e('gem_pink')} **${res.gems}** gems` : ''}`);
}

const quest = {
  data: command('quest', 'Daily and weekly quests with Love Points, gems and streak bonuses')
    .addSubcommand((s) => s.setName('view').setDescription('See your quests and progress'))
    .addSubcommand((s) => s.setName('claim').setDescription('Claim the rewards of every finished quest')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.user;
    if (sub === 'claim') {
      const res = Q.claim(user.id);
      if (!res) return interaction.reply({ content: `${e('info')} Nothing to claim yet. \`/quest view\` shows your progress.`, flags: require('../lib/util').EPH });
      return interaction.reply({ embeds: [claimEmbed(user, res)] });
    }
    const { emb, ready } = view(user);
    if (!ready) return interaction.reply({ embeds: [emb] });
    const session = create({
      ttl: 120000,
      handler: async (i) => {
        if (i.user.id !== user.id) return i.reply({ content: "These aren't your quests 💔", flags: require('../lib/util').EPH });
        const res = Q.claim(user.id);
        session.end();
        if (!res) return i.update({ embeds: [view(user).emb], components: [] });
        return i.update({ embeds: [claimEmbed(user, res), view(user).emb], components: [] });
      },
      onExpire: () => interaction.editReply({ components: [] }),
    });
    const components = [row(button(session.cid('claim'), `Claim ${ready} reward${ready === 1 ? '' : 's'}`, ButtonStyle.Success, '🎁'))];
    return interaction.reply({ embeds: [emb], components });
  },
};

module.exports = { commands: [quest] };
