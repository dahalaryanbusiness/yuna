// Love games: would-you-rather poll, truth or dare, love trivia.
const store = require('../store');
const B = require('../data/balance');
const E = require('../lib/eco');
const C = require('../data/content');
const { create, button, row, ButtonStyle } = require('../lib/interactive');
const { COLORS, EPH, pick, command, embed, award, cooldown, fmtDur } = require('../lib/util');

const wouldyourather = {
  data: command('wouldyourather', 'Love-themed would you rather poll 🤔'),
  async execute(interaction) {
    const [a, b] = pick(C.wouldYouRather);
    const votes = new Map(); // userId -> 'a' | 'b'
    const tally = () => {
      const va = [...votes.values()].filter((v) => v === 'a').length;
      const vb = votes.size - va;
      return { va, vb };
    };
    const render = (closed) => {
      const { va, vb } = tally();
      const total = va + vb || 1;
      const pa = Math.round((va / total) * 100);
      const pb = 100 - pa;
      return embed(COLORS.purple)
        .setTitle(`🤔 Would you rather...${closed ? ' (closed)' : ''}`)
        .setDescription(`🅰️ **${a}**\n${va} vote${va === 1 ? '' : 's'} (${va + vb ? pa : 0}%)\n\n🅱️ **${b}**\n${vb} vote${vb === 1 ? '' : 's'} (${va + vb ? pb : 0}%)`);
    };
    const buttons = (disabled) => [
      row(
        button(session.cid('a'), 'A', ButtonStyle.Primary, '🅰️').setDisabled(disabled),
        button(session.cid('b'), 'B', ButtonStyle.Secondary, '🅱️').setDisabled(disabled)
      ),
    ];
    const session = create({
      ttl: 10 * 60 * 1000,
      handler: async (i, action) => {
        votes.set(i.user.id, action);
        return i.update({ embeds: [render(false)], components: buttons(false) });
      },
      onExpire: () => interaction.editReply({ embeds: [render(true)], components: buttons(true) }),
    });
    return interaction.reply({ embeds: [render(false)], components: buttons(false) });
  },
};

const truthordare = {
  data: command('truthordare', 'Love-themed truth or dare 🎭').addStringOption((o) =>
    o.setName('choice').setDescription('Truth, dare, or random?').addChoices(
      { name: '🗣️ Truth', value: 'truth' },
      { name: '🔥 Dare', value: 'dare' },
      { name: '🎲 Random', value: 'random' }
    )
  ),
  async execute(interaction) {
    let choice = interaction.options.getString('choice') || 'random';
    if (choice === 'random') choice = Math.random() < 0.5 ? 'truth' : 'dare';
    const isTruth = choice === 'truth';
    const e = embed(isTruth ? COLORS.purple : COLORS.red)
      .setTitle(isTruth ? '🗣️ Truth' : '🔥 Dare')
      .setDescription(`${interaction.user}, ${pick(isTruth ? C.truths : C.dares)}`);
    return interaction.reply({ embeds: [e] });
  },
};

const lovetrivia = {
  data: command('lovetrivia', 'Answer a love trivia question for LP 🧠'),
  async execute(interaction) {
    const actor = interaction.user;
    const wait = cooldown(actor.id, 'trivia', B.trivia.cooldownMs);
    if (wait) return interaction.reply({ content: `Catch your breath! Next question in ${fmtDur(wait)} 🧠`, flags: EPH });
    const q = pick(C.trivia);
    const labels = ['A', 'B', 'C', 'D'];
    const render = (extra) =>
      embed(COLORS.purple)
        .setTitle('🧠 Love trivia')
        .setDescription(`**${q.q}**\n\n${q.o.map((o, i) => `**${labels[i]}.** ${o}`).join('\n')}${extra ? `\n\n${extra}` : ''}`);
    const session = create({
      ttl: 60000,
      handler: async (i, action) => {
        if (i.user.id !== actor.id) return i.reply({ content: 'This question is for someone else! Use /lovetrivia 🧠', flags: EPH });
        session.end();
        const picked = Number(action);
        const me = store.user(actor.id);
        if (picked === q.a) {
          const paid = E.underCap(actor.id, 'trivia', B.trivia.dailyPaidAnswers);
          if (paid) award(actor.id, B.trivia.reward);
          me.stats.trivia += 1;
          store.save();
          return i.update({ embeds: [render(`✅ Correct! The answer is **${q.o[q.a]}**. ${paid ? `**+${B.trivia.reward} LP**` : '(daily LP limit reached)'}`)], components: [] });
        }
        return i.update({ embeds: [render(`❌ Not quite. The answer is **${q.o[q.a]}**.`)], components: [] });
      },
      onExpire: () => interaction.editReply({ embeds: [render("⏳ Time's up!")], components: [] }),
    });
    const components = [
      row(...q.o.map((_, i) => button(session.cid(String(i)), labels[i], ButtonStyle.Secondary))),
    ];
    return interaction.reply({ embeds: [render()], components });
  },
};

module.exports = { commands: [wouldyourather, truthordare, lovetrivia] };
