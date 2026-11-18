// /lottery - a daily jackpot draw in the style of OwO's lottery. 10% of everything lost in the casino feeds the jackpot.
// When the timer ends one entry wins the whole pot (weighted by how much each person put in) and everybody who joined gets a DM.
const store = require('../store');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const { COLORS, EPH, command, embed, num } = require('../lib/util');

const ROUND_MS = 24 * 3600000;
const MAX_ENTRY = 25000;
const SEED = 1000;

function state() {
  const db = store.db();
  if (!db.lottery) db.lottery = { endsAt: Date.now() + ROUND_MS, entries: {}, bonus: 0, seed: SEED, round: 1, last: null };
  return db.lottery;
}
const total = (l) => Object.values(l.entries).reduce((t, v) => t + v, 0);
const jackpot = (l) => l.seed + l.bonus + total(l);
const chanceOf = (l, id) => { const t = total(l); return t ? ((l.entries[id] || 0) / t) * 100 : 0; };
const pct = (v) => (v === 0 ? '0%' : v < 0.001 ? `${v.toFixed(6)}%` : v < 1 ? `${v.toFixed(4)}%` : `${v.toFixed(2)}%`);
const code = (s) => `\`${s}\``;
const ago = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`; };

// Called by the casino when someone loses a bet.
function feed(amount) {
  const l = state();
  l.bonus += Math.floor(amount * 0.1);
  store.save();
}

function panel(user, l, added) {
  return embed(COLORS.pink)
    .setTitle(`${e('a_tag_jackpot')} ${user.displayName}'s Lottery Submission`)
    .setDescription(`Lottery ends once a day! The maximum lottery submission is **${num(MAX_ENTRY)} LP**!`)
    .addFields(
      { name: 'You added', value: code(`${num(added)} LP`), inline: true },
      { name: 'Your Total Submission', value: code(`${num(l.entries[user.id] || 0)} LP`), inline: true },
      { name: 'Winning Chance', value: code(pct(chanceOf(l, user.id))), inline: true },
      { name: 'Current Jackpot', value: code(`${num(jackpot(l))} LP`), inline: true },
      { name: 'Ends in', value: code(ago(l.endsAt - Date.now())), inline: true }
    )
    .setFooter({ text: 'Percentage and jackpot may change over time' })
    .setTimestamp();
}

const lottery = {
  data: command('lottery', 'Join the daily jackpot lottery')
    .addSubcommand((s) => s.setName('enter').setDescription('Put Love Points into the lottery').addStringOption((o) => o.setName('amount').setDescription('How much? (a number, "half" or "all")').setRequired(true)))
    .addSubcommand((s) => s.setName('view').setDescription('See the jackpot, your chance and the timer'))
    .addSubcommand((s) => s.setName('last').setDescription('See who won the last lottery')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const l = state();
    const u = store.user(id);

    if (sub === 'view') return interaction.reply({ embeds: [panel(interaction.user, l, 0)] });
    if (sub === 'last') {
      if (!l.last) return interaction.reply({ content: `${e('info')} No lottery has finished yet.`, flags: EPH });
      const w = l.last;
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('trophy_shine')} Last lottery (#${w.round})`).setDescription(`Winner: <@${w.winner}> with a **${pct(w.chance)}** chance\nJackpot: ${E.lp(w.pot)}\nEntries: **${num(w.players)}**\nEnded ${E.rel(w.at)}`)] });
    }
    const have = l.entries[id] || 0;
    const room = MAX_ENTRY - have;
    if (room <= 0) return interaction.reply({ content: `${e('cross')} You already put in the maximum of **${num(MAX_ENTRY)} LP**.`, flags: EPH });
    const amt = E.parseAmount(interaction.options.getString('amount', true), Math.min(u.lp, room));
    if (!Number.isFinite(amt) || amt < 1) return interaction.reply({ content: `${e('cross')} Give me a number, "half" or "all".`, flags: EPH });
    if (amt > room) return interaction.reply({ content: `${e('cross')} You can add at most **${num(room)} LP** more (max ${num(MAX_ENTRY)} per lottery).`, flags: EPH });
    if (!E.pay(id, amt)) return interaction.reply({ content: `${e('cross')} You only have **${num(u.lp)} LP**.`, flags: EPH });
    l.entries[id] = have + amt;
    store.save();
    return interaction.reply({ embeds: [panel(interaction.user, l, amt)] });
  },
};

// ---- the draw ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function draw(client) {
  const l = state();
  const ids = Object.keys(l.entries).filter((k) => l.entries[k] > 0);
  const pot = jackpot(l);
  if (!ids.length) { l.endsAt = Date.now() + ROUND_MS; store.save(); return; } // nobody joined, the jackpot keeps growing
  const sum = total(l);
  let roll = Math.random() * sum;
  let winner = ids[0];
  for (const k of ids) { roll -= l.entries[k]; if (roll < 0) { winner = k; break; } }
  const snapshot = { ...l.entries };
  const winChance = (snapshot[winner] / sum) * 100;
  E.earn(winner, pot, { boost: false, hard: false });
  l.last = { round: l.round, winner, chance: winChance, pot, players: ids.length, at: Date.now() };
  const wUser = await client.users.fetch(winner).catch(() => null);
  const wName = wUser ? wUser.username : winner;
  l.entries = {}; l.bonus = 0; l.seed = SEED; l.round += 1; l.endsAt = Date.now() + ROUND_MS;
  store.save();
  console.log(`[lottery] round ${l.last.round}: ${wName} won ${pot} LP (${ids.length} players)`);
  for (const k of ids) {
    const mine = (snapshot[k] / sum) * 100;
    const msg = k === winner
      ? `${e('a_tag_jackpot')} **You won the lottery!!**\nYou had a **${pct(mine)}** chance to win **${num(pot)} LP** and it is now in your wallet! ${e('confetti')}`
      : `${e('tag_lose')} You lost the lottery...\nYou had a **${pct(mine)}** chance to win **${num(pot)} LP**...\nThe winner was **${wName}** with a **${pct(winChance)}** chance to win!`;
    try { const user = await client.users.fetch(k); await user.send(require('../lib/skin').payload({ content: msg })); } catch { /* DMs closed */ }
    await wait(600);
  }
}

function startScheduler(client) {
  const tick = () => { if (state().endsAt <= Date.now()) draw(client).catch((err) => console.error('[lottery]', err.message)); };
  tick();
  setInterval(tick, 30000).unref();
}

module.exports = { commands: [lottery], feed, startScheduler, state, jackpot };
