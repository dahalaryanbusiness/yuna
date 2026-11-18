// Extra fun: rock-paper-scissors vs Yuna and a daily love fortune (riddles live in gamehub.js).
// These are folded into /game (rps, riddle) and /love (fortune), so they do not use extra slash slots.
const store = require('../store');
const B = require('../data/balance');
const E = require('../lib/eco');
const { create, button, row, ButtonStyle } = require('../lib/interactive');
const { e } = require('../lib/emojis');
const { COLORS, EPH, command, embed, pick, rand, cooldown, fmtDur, hash, num } = require('../lib/util');

// ---------------------------------------------------------------- rock paper scissors
const MOVES = { rock: '✊', paper: '✋', scissors: '✌️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const WIN_LINES = ['Okay, you got me this time!', 'Beginner luck... or skill?', 'Fine, take your points.', 'Nooo! Rematch!'];
const LOSE_LINES = ['Too easy, cutie.', 'I read you like a love letter.', 'Better luck next time!', 'Yuna wins again.'];
const DRAW_LINES = ['Great minds think alike!', 'A tie! Spooky.', 'We are in sync.'];

const rps = {
  data: command('rps', 'Rock paper scissors against Yuna, win Love Points ✂️')
    .addStringOption((o) => o.setName('move').setDescription('Your move').setRequired(true).addChoices(
      { name: 'Rock', value: 'rock' }, { name: 'Paper', value: 'paper' }, { name: 'Scissors', value: 'scissors' })),
  async execute(interaction) {
    const id = interaction.user.id;
    const left = cooldown(id, 'rps', B.rps.cooldownMs);
    if (left) return interaction.reply({ content: `${e('clock')} One round at a time! Try again in ${fmtDur(left)}.`, flags: EPH });
    const mine = interaction.options.getString('move');
    const theirs = pick(Object.keys(MOVES));
    const st = store.user(id).stats;
    st.rps = st.rps || { w: 0, l: 0, d: 0, streak: 0, best: 0 };
    const r = st.rps;
    let title; let color; let text; let line;
    if (mine === theirs) { r.d += 1; title = "It's a draw"; color = COLORS.grey; text = 'No points this round.'; line = pick(DRAW_LINES); }
    else if (BEATS[mine] === theirs) {
      r.w += 1; r.streak += 1; r.best = Math.max(r.best, r.streak);
      const paid = E.underCap(id, 'rps', B.rps.dailyPaidWins);
      const got = paid ? E.earn(id, rand(B.rps.win[0], B.rps.win[1]) + Math.min(r.streak, 10) * B.rps.streakBonus) : 0;
      title = 'You win!'; color = COLORS.green; text = !paid ? `${e('clock')} Daily prize limit reached (${B.rps.dailyPaidWins} paid wins). Wins still count for your streak.` : `${e('coin')} **+${num(got)}** LP${r.streak > 1 ? ` \u2022 ${e('fire')} streak **${r.streak}**` : ''}`; line = pick(WIN_LINES);
    } else { r.l += 1; r.streak = 0; title = 'Yuna wins!'; color = COLORS.red; text = 'Your streak resets.'; line = pick(LOSE_LINES); }
    store.save();
    return interaction.reply({ embeds: [embed(color).setTitle(`${MOVES[mine]} vs ${MOVES[theirs]} \u2022 ${title}`).setDescription(`You: **${mine}**  \u2022  Yuna: **${theirs}**\n${text}\n*${line}*\n-# Record ${r.w}W / ${r.l}L / ${r.d}D \u2022 best streak ${r.best}`)] });
  },
};

// (riddles moved to commands/gamehub.js: 11 categories, 3 levels)

// ---------------------------------------------------------------- daily love fortune
const COLORS_LUCKY = ['rose pink', 'sunset orange', 'midnight blue', 'emerald green', 'lavender', 'golden yellow', 'cherry red', 'sky blue'];
const MOODS = ['romantic', 'playful', 'brave', 'dreamy', 'cozy', 'mysterious', 'sparkly', 'calm'];
const ADVICE = [
  'Send that message you have been holding back.', 'Compliment someone today, it will come back to you.', 'A small gesture beats a big speech.',
  'Someone is thinking about you right now.', 'Try something new with your favorite person.', 'Listen first, flirt second.',
  'Treat yourself with the kindness you give others.', 'A surprise is on its way, stay curious.', 'Say thank you to someone who matters.',
];
const fortune = {
  data: command('fortune', 'Your daily love fortune: lucky number, color and advice 🔮'),
  async execute(interaction) {
    const id = interaction.user.id;
    const day = new Date().toISOString().slice(0, 10);
    const h = hash(`${id}|${day}`);
    const luck = h % 101;
    const u = store.user(id);
    let bonus = '';
    if (u.fortuneDay !== day) { u.fortuneDay = day; const got = E.earn(id, B.fortune.base + (luck % B.fortune.range)); bonus = `\n${e('gift_bounce')} First read today: **+${num(got)}** LP`; store.save(); }
    const emb = embed(COLORS.purple)
      .setAuthor({ name: `${interaction.user.displayName || interaction.user.username}'s fortune`, iconURL: interaction.user.displayAvatarURL({ size: 64 }) })
      .setTitle(`${e('sparkle')} Love fortune for ${day}`)
      .setDescription(
        `${e('heart_pulse')} Love luck: **${luck}%**\n${E.meter(luck, 12)}\n\n` +
        `${e('dice_roll')} Lucky number: **${(h >>> 3) % 99 + 1}**\n${e('flower')} Lucky color: **${COLORS_LUCKY[(h >>> 5) % COLORS_LUCKY.length]}**\n${e('moon')} Mood: **${MOODS[(h >>> 7) % MOODS.length]}**\n\n` +
        `*${ADVICE[(h >>> 9) % ADVICE.length]}*${bonus}\n-# A new fortune appears every day (UTC).`
      );
    return interaction.reply({ embeds: [emb] });
  },
};

module.exports = { commands: [rps, fortune] };
