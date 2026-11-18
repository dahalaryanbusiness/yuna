// /casino - slots, coinflip, dice, wheel, blackjack, roulette, highlow, scratch.
// Clean OwO-style text results with a short spin animation. 10% of all lost bets feed the /lottery jackpot.
const store = require('../store');
const B = require('../data/balance');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const lottery = require('./lottery');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EPH, pick, rand, command, embed, num, fmtDur, cooldown } = require('../lib/util');

const MAX_BET = B.casino.maxBet;
const COOLDOWN_MS = 12000; // OwO style: one gamble every 12 seconds
const COOLDOWN_CLEANUP_MS = 2500; // the "slow down" message deletes itself this long after the cooldown ends
const ERROR_CLEANUP_MS = 5000; // "you don't have enough" / bad bet messages delete themselves after this long
// Sends a short notice and removes it again by itself (works for slash and prefix commands).
async function notice(interaction, content, removeAfter) {
  await interaction.reply({ content, flags: EPH });
  const t = setTimeout(() => { Promise.resolve(interaction.deleteReply && interaction.deleteReply()).catch(() => {}); }, removeAfter);
  if (t.unref) t.unref();
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const bet = (o) => o.setName('bet').setDescription(`How much to bet? (1 - ${num(MAX_BET)}, or "all" / "half")`).setRequired(true);
const name = (i) => `**${i.user.displayName}**`;

// Pays out `win` (total returned, 0 = lost). Bets are taken up-front, so this only adds the winnings.
function settle(id, amount, win) {
  if (win > 0) E.earn(id, win, { boost: false, hard: false });
  if (win < amount) lottery.feed(amount - win);
  const x = E.eco(id);
  if (win > amount) x.st.won += win - amount; else if (win < amount) x.st.lost += amount - win;
  store.save();
  return win - amount;
}
// Yuna feature: people in a relationship get +5% extra on the profit of a win (coinflip and slots).
const loveBonus = (id, win, amount) => (win > amount && store.user(id).rel ? Math.floor((win - amount) * 0.05) : 0);
const resultLine = (net, amount) => (net > 0 ? `and won ${e('coin')} **${num(net + amount)}**!` : net === 0 ? 'and got the bet back.' : 'and lost it all... :c');

const SLOT_SYMBOLS = [
  { icon: 'slot_cherry', pay: 4 }, { icon: 'slot_lemon', pay: 4 }, { icon: 'slot_bell', pay: 4 }, { icon: 'slot_clover', pay: 5 },
  { icon: 'slot_grape', pay: 5 }, { icon: 'slot_melon', pay: 5 }, { icon: 'heart_red', pay: 6 }, { icon: 'slot_horseshoe', pay: 6 },
  { icon: 'gem_cyan', pay: 8 }, { icon: 'slot_seven_red', pay: 10 }, { icon: 'slot_wild', pay: 12 },
];
const WHEEL = [
  { m: 0, w: 40, t: 'Bust' }, { m: 0.5, w: 20, t: 'Half back' }, { m: 1, w: 15, t: 'Money back' },
  { m: 2, w: 17, t: 'Double!' }, { m: 3, w: 6, t: 'Triple!' }, { m: 10, w: 2, t: 'JACKPOT' },
];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const color = (n) => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');
const dot = { red: '🔴', black: '⚫', green: '🟢' };

// ---- blackjack helpers ----
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const newDeck = () => { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s }); return d.sort(() => Math.random() - 0.5); };
function handValue(h) {
  let t = 0; let aces = 0;
  for (const c of h) { if (c.r === 'A') { aces++; t += 11; } else if ('JQK'.includes(c.r)) t += 10; else t += Number(c.r); }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
}
const showHand = (h, hide = false) => h.map((c, i) => (hide && i === 1 ? '`?`' : `\`${c.r}${c.s}\``)).join(' ');

const casino = {
  data: command('casino', 'Gamble your Love Points (slots, coinflip, dice, wheel, blackjack, roulette, highlow, scratch)')
    .addSubcommand((s) => s.setName('coinflip').setDescription('Heads or tails (2x)').addStringOption(bet).addStringOption((o) => o.setName('side').setDescription('Your call').addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })))
    .addSubcommand((s) => s.setName('slots').setDescription('Spin the slot machine (up to 12x)').addStringOption(bet))
    .addSubcommand((s) => s.setName('blackjack').setDescription('Beat the dealer to 21 (blackjack pays 2.5x)').addStringOption(bet))
    .addSubcommand((s) => s.setName('roulette').setDescription('Bet on red, black, odd, even, low, high, green or a number 0-36').addStringOption(bet).addStringOption((o) => o.setName('on').setDescription('red, black, odd, even, low, high, green or a number 0-36').setRequired(true).setAutocomplete(true)))
    .addSubcommand((s) => s.setName('dice').setDescription('Roll two dice against Yuna (2x)').addStringOption(bet))
    .addSubcommand((s) => s.setName('wheel').setDescription('Spin the wheel of love (up to 10x)').addStringOption(bet))
    .addSubcommand((s) => s.setName('highlow').setDescription('Guess if the next number (1-100) is higher or lower (odds-based payout)').addStringOption(bet))
    .addSubcommand((s) => s.setName('scratch').setDescription('Scratch a ticket: match 3 symbols for up to 25x').addStringOption(bet)),
  async autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase();
    const opts = ['red', 'black', 'odd', 'even', 'low', 'high', 'green'];
    const hits = opts.filter((o) => o.startsWith(q)).map((o) => ({ name: { red: 'Red (2x)', black: 'Black (2x)', odd: 'Odd (2x)', even: 'Even (2x)', low: 'Low 1-18 (2x)', high: 'High 19-36 (2x)', green: 'Green 0 (35x)' }[o], value: o }));
    if (/^\d{1,2}$/.test(q) && Number(q) <= 36) hits.unshift({ name: `Number ${Number(q)} (35x)`, value: String(Number(q)) });
    return interaction.respond(hits.slice(0, 25));
  },
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const u = store.user(id);
    if (await E.jailed(interaction)) return;
    const amount = E.parseAmount(interaction.options.getString('bet', true), Math.min(u.lp, MAX_BET));
    if (!Number.isFinite(amount) || amount < 1) return notice(interaction, `${e('cross')} **${interaction.user.displayName}**, give me a bet like \`100\`, \`1k\`, \`half\` or \`all\`.`, ERROR_CLEANUP_MS);
    if (amount > MAX_BET) return notice(interaction, `${e('cross')} **${interaction.user.displayName}**, the max bet is **${num(MAX_BET)}**.`, ERROR_CLEANUP_MS);
    if (u.lp < amount) return notice(interaction, `${e('cross')} **${interaction.user.displayName}**, you don't have enough! You only have **${num(u.lp)}**. Bet less or \`/bank withdraw\`.`, ERROR_CLEANUP_MS);
    const left = cooldown(id, `casino:${sub}`, COOLDOWN_MS); // each game has its own 12s cooldown
    if (left) {
      // Live Discord timestamp: counts down "in 2 seconds", then "now", "1 second ago", "2 seconds ago", then the message removes itself.
      const at = Math.ceil((Date.now() + left) / 1000);
      return notice(interaction, `\u23F1\uFE0F **${interaction.user.displayName}**, slow down and try the command again **<t:${at}:R>**.`, left + COOLDOWN_CLEANUP_MS);
    }
    E.pay(id, amount); // take the bet up-front

    const head = `${name(interaction)} spent ${e('coin')} **${num(amount)}**`;

    if (sub === 'coinflip') {
      const side = interaction.options.getString('side') || 'heads'; // OwO style: heads unless you say tails
      const result = pick(['heads', 'tails']);
      const spin = e('a_coin_gold');
      const top = `${head} and chose **${side}**`;
      await interaction.reply({ content: `${top}\nThe coin spins... ${spin}` });
      await wait(1100);
      await interaction.editReply({ content: `${top}\nThe coin spins... ${spin} ${e('a_twinkle_gold')}` }).catch(() => {});
      await wait(900);
      const won = side === result;
      let payout = won ? Math.floor(amount * B.casino.flipMult) : 0;
      const bonus = loveBonus(id, payout, amount);
      payout += bonus;
      settle(id, amount, payout);
      const x = E.eco(id);
      x.st.cfStreak = won ? (x.st.cfStreak || 0) + 1 : 0;
      x.st.cfBest = Math.max(x.st.cfBest || 0, x.st.cfStreak);
      store.save();
      const extras = [];
      if (bonus) extras.push(`${e('heart_pulse')} love bonus **+${num(bonus)}**`);
      if (won && x.st.cfStreak >= 2) extras.push(`${e('a_fire_orange')} win streak **${x.st.cfStreak}**`);
      const end = won ? `and won ${e('coin')} **${num(payout)}**!! ${e('confetti')}` : `and lost it all... :c ${e('heartbreak')}`;
      return interaction.editReply({ content: `${top}\nThe coin spins... ${e(result === 'heads' ? 'coin_heads' : 'coin_tails')} ${end}${extras.length ? `\n${extras.join('  \u2022  ')}` : ''}` });
    }

    if (sub === 'slots') {
      // OwO-style slot machine: reels on the first row (bet on the right), then two empty rows, result beside the second row.
      const reels = [pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS)];
      const counts = {};
      for (const r of reels) counts[r.icon] = (counts[r.icon] || 0) + 1;
      const best = Math.max(...Object.values(counts));
      let win = 0;
      if (best === 3) win = amount * reels[0].pay; else if (best === 2) win = Math.floor(amount * 1.5);
      const bonus = loveBonus(id, win, amount);
      win += bonus;
      const spin = e('a_loading');
      const gap = ' '.repeat(10);
      const box = (cells, tail = '', glow = false) => {
        const star = glow ? e('a_twinkle_gold') : '';
        return `${star} **\`___YUNA SLOTS___\`** ${star}\n\`|\` ${cells.join(' ')} \`|\`  ${name(interaction)} bet ${e('coin')} **${num(amount)}**\n\`|${gap}|\`  ${tail}\n\`|${gap}|\``.trim();
      };
      await interaction.reply({ content: box([spin, spin, spin]) });
      await wait(700);
      await interaction.editReply({ content: box([e(reels[0].icon), spin, spin]) }).catch(() => {});
      await wait(700);
      await interaction.editReply({ content: box([e(reels[0].icon), e(reels[1].icon), spin]) }).catch(() => {});
      await wait(700);
      const net = settle(id, amount, win);
      const love = bonus ? ` ${e('heart_pulse')} love bonus **+${num(bonus)}**` : '';
      const tail = best === 3
        ? `${e('tag_jackpot')} **THREE OF A KIND!** and won ${e('coin')} **${num(win)}**!! ${reels[0].pay >= 10 ? e('confetti') : ''}${love}`
        : net > 0 ? `and won ${e('coin')} **${num(win)}**! ${e('a_heart_hotpink')}${love}`
        : net === 0 ? 'and got the bet back.'
        : `and lost it all... :c ${e('heartbreak')}`;
      return interaction.editReply({ content: box(reels.map((r) => e(r.icon)), tail, win > amount) }).catch(() => {});
    }

    if (sub === 'dice') {
      const mine = [rand(1, 6), rand(1, 6)]; const theirs = [rand(1, 6), rand(1, 6)];
      const a = mine[0] + mine[1]; const b = theirs[0] + theirs[1];
      await interaction.reply({ content: `${head} and rolled the dice\n${e('dice_roll')} ${e('a_loading')} ${e('a_loading')}` });
      await wait(1300);
      const net = settle(id, amount, a > b ? Math.floor(amount * B.casino.diceMult) : a === b ? amount : 0);
      return interaction.editReply({ content: `${head} and rolled the dice\n${e(`dice_${mine[0]}_red`)}${e(`dice_${mine[1]}_red`)} You: **${a}**   ${e(`dice_${theirs[0]}_pink`)}${e(`dice_${theirs[1]}_pink`)} Yuna: **${b}**\n${a > b ? `You win ${e('coin')} **${num(amount * 2)}**!` : a === b ? 'A tie, bet returned.' : 'Yuna wins this round... :c'}` });
    }

    if (sub === 'wheel') {
      const sum = WHEEL.reduce((t, x) => t + x.w, 0);
      let roll = Math.random() * sum; let hit = WHEEL[0];
      for (const x of WHEEL) { if ((roll -= x.w) < 0) { hit = x; break; } }
      await interaction.reply({ content: `${head} and spun the wheel\n${e('a_roulette')} ...` });
      await wait(1500);
      const net = settle(id, amount, Math.floor(amount * hit.m));
      return interaction.editReply({ content: `${head} and spun the wheel\n${e('a_roulette')} It stops on **${hit.t}** (x${hit.m}) ${resultLine(net, amount)}` });
    }

    if (sub === 'roulette') {
      let on = String(interaction.options.getString('on', true)).toLowerCase().trim();
      let chosen = null;
      if (/^\d{1,2}$/.test(on) && Number(on) >= 0 && Number(on) <= 36) { chosen = Number(on); on = 'number'; }
      else if (!['red', 'black', 'odd', 'even', 'low', 'high', 'green'].includes(on)) {
        E.earn(id, amount, { boost: false, hard: false });
        return interaction.reply({ content: `${e('cross')} Bet on \`red\`, \`black\`, \`odd\`, \`even\`, \`low\`, \`high\`, \`green\` or a number from 0 to 36.`, flags: EPH });
      }
      const n = rand(0, 36); const c = color(n);
      const label = on === 'number' ? `number ${chosen}` : on;
      await interaction.reply({ content: `${head} on **${label}**\n${e('a_roulette')} The ball is rolling...` });
      await wait(1700);
      const win = ({ red: c === 'red', black: c === 'black', odd: n > 0 && n % 2 === 1, even: n > 0 && n % 2 === 0, low: n >= 1 && n <= 18, high: n >= 19 }[on]);
      let payout = 0;
      if (on === 'green') payout = n === 0 ? amount * 35 : 0;
      else if (on === 'number') payout = n === chosen ? amount * 35 : 0;
      else payout = win ? amount * 2 : 0;
      const net = settle(id, amount, payout);
      return interaction.editReply({ content: `${head} on **${label}**\n${e('a_roulette')} The ball lands on ${dot[c]} **${n}** ${resultLine(net, amount)}` });
    }

    if (sub === 'highlow') {
      const base = rand(10, 90);
      const pHi = (100 - base) / 99; const pLo = (base - 1) / 99;
      const mHi = Math.min(10, Math.round((0.95 / pHi) * 100) / 100); const mLo = Math.min(10, Math.round((0.95 / pLo) * 100) / 100);
      const mk = (dis) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hl:${id}:hi`).setLabel(`Higher (x${mHi})`).setStyle(ButtonStyle.Success).setDisabled(dis),
        new ButtonBuilder().setCustomId(`hl:${id}:lo`).setLabel(`Lower (x${mLo})`).setStyle(ButtonStyle.Danger).setDisabled(dis)
      );
      await interaction.reply({ content: `${head} on **high or low**\nThe number is **${base}**. Will the next one (1-100) be higher or lower? Rarer guesses pay more.`, components: [mk(false)] });
      const msg = await interaction.fetchReply();
      let pickSide = null;
      try {
        const click = await msg.awaitMessageComponent({ filter: (c) => c.user.id === id && c.customId.startsWith('hl:'), time: 25000 });
        await click.deferUpdate().catch(() => {});
        pickSide = click.customId.split(':')[2];
      } catch { /* timeout */ }
      if (!pickSide) { settle(id, amount, 0); return interaction.editReply({ content: `${head} on **high or low**\n${e('clock')} You took too long and the dealer kept your bet. :c`, components: [mk(true)] }).catch(() => {}); }
      let next = rand(1, 100);
      while (next === base) next = rand(1, 100);
      const ok = pickSide === 'hi' ? next > base : next < base;
      const mult = pickSide === 'hi' ? mHi : mLo;
      const net = settle(id, amount, ok ? Math.floor(amount * mult) : 0);
      return interaction.editReply({ content: `${head} on **high or low**\n**${base}** -> **${next}** (you said ${pickSide === 'hi' ? 'higher' : 'lower'}) ${resultLine(net, amount)}`, components: [mk(true)] }).catch(() => {});
    }

    if (sub === 'scratch') {
      const TICKET = [{ i: 'gem_cyan', m: 25, w: 2 }, { i: 'heart_red', m: 10, w: 6 }, { i: 'star_gold', m: 8, w: 8 }, { i: 'slot_clover', m: 6, w: 12 }, { i: 'slot_cherry', m: 4, w: 20 }, { i: 'cross', m: 0, w: 40 }];
      const sum = TICKET.reduce((t, x) => t + x.w, 0);
      const draw = () => { let r = Math.random() * sum; for (const x of TICKET) { if ((r -= x.w) < 0) return x; } return TICKET[5]; };
      await interaction.reply({ content: `${head} on a scratch ticket\n${e('ticket_gold')} ${e('a_loading')} ${e('a_loading')} ${e('a_loading')}` });
      await wait(1400);
      const prizes = TICKET.filter((t) => t.m > 0);
      const psum = prizes.reduce((t, x) => t + x.w, 0);
      const drawPrize = () => { let r = Math.random() * psum; for (const x of prizes) { if ((r -= x.w) < 0) return x; } return prizes[0]; };
      let cells;
      let win = 0;
      if (Math.random() < 0.135) { const w = drawPrize(); cells = [w, w, w]; win = amount * w.m; }
      else { do { cells = [draw(), draw(), draw()]; } while (cells[0] === cells[1] && cells[1] === cells[2]); }
      const net = settle(id, amount, win);
      return interaction.editReply({ content: `${head} on a scratch ticket\n${e('ticket_gold')} ${cells.map((c) => e(c.i)).join(' ')} ${net > 0 ? `**MATCH!** You won ${e('coin')} **${num(win)}**!` : net === 0 ? 'A small refund.' : 'No match... :c'}` });
    }

    // ---------------- blackjack ----------------
    const deck = newDeck();
    const player = [deck.pop(), deck.pop()];
    const dealer = [deck.pop(), deck.pop()];
    let stake = amount;
    let doubled = false;
    const view = (state, extra = '') => {
      const hideDealer = state === 'play';
      const pv = handValue(player);
      const col = state === 'win' ? COLORS.green : state === 'lose' ? COLORS.red : state === 'push' ? COLORS.gold : COLORS.purple;
      return embed(col).setTitle(`${e('tag_blackjack')} Blackjack`).setDescription(`${name(interaction)} bet ${e('coin')} **${num(stake)}**${extra ? `\n\n${extra}` : ''}`).addFields(
        { name: `You (${pv})`, value: showHand(player), inline: true },
        { name: `Dealer (${hideDealer ? '?' : handValue(dealer)})`, value: showHand(dealer, hideDealer), inline: true }
      );
    };
    const btns = (canDouble, dis = false) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj:${id}:hit`).setLabel('Hit').setStyle(ButtonStyle.Success).setDisabled(dis),
      new ButtonBuilder().setCustomId(`bj:${id}:stand`).setLabel('Stand').setStyle(ButtonStyle.Danger).setDisabled(dis),
      new ButtonBuilder().setCustomId(`bj:${id}:double`).setLabel('Double').setStyle(ButtonStyle.Primary).setDisabled(dis || !canDouble)
    );
    const finish = async (msg, state, win, note) => {
      const net = settle(id, stake, win);
      const out = net > 0 ? `${e('check')} You won ${e('coin')} **${num(net)}**! ${note}` : net === 0 ? `${e('info')} Push, bet returned. ${note}` : `${e('cross')} You lost ${e('coin')} **${num(-net)}**. ${note}`;
      return interaction.editReply({ embeds: [view(state, `${out}`)], components: [btns(false, true)] }).catch(() => {});
    };
    const pv0 = handValue(player);
    if (pv0 === 21) {
      const dv = handValue(dealer);
      await interaction.reply({ embeds: [view('play', 'Natural blackjack!')], components: [btns(false, true)] });
      const msg = await interaction.fetchReply();
      return finish(msg, dv === 21 ? 'push' : 'win', dv === 21 ? amount : Math.floor(amount * 2.5), dv === 21 ? 'Dealer has 21 too.' : 'Blackjack pays 2.5x!');
    }
    await interaction.reply({ embeds: [view('play')], components: [btns(u.lp >= amount)] });
    const msg = await interaction.fetchReply();
    const dealerPlay = async () => { while (handValue(dealer) < 17) dealer.push(deck.pop()); };
    for (;;) {
      let click;
      try {
        click = await msg.awaitMessageComponent({ filter: (c) => c.user.id === id && c.customId.startsWith('bj:'), time: 60000 });
      } catch { await dealerPlay(); return finish(msg, 'lose', 0, 'You left the table, so the dealer kept your bet.'); }
      await click.deferUpdate().catch(() => {});
      const act = click.customId.split(':')[2];
      if (act === 'hit' || act === 'double') {
        if (act === 'double') { if (!E.pay(id, amount)) continue; stake += amount; doubled = true; }
        player.push(deck.pop());
        const pv = handValue(player);
        if (pv > 21) return finish(msg, 'lose', 0, 'Bust!');
        if (act === 'hit' && pv < 21) { await interaction.editReply({ embeds: [view('play')], components: [btns(false)] }).catch(() => {}); continue; }
      }
      await dealerPlay();
      const pv = handValue(player); const dv = handValue(dealer);
      if (dv > 21) return finish(msg, 'win', stake * 2, `Dealer busts with ${dv}.`);
      if (pv > dv) return finish(msg, 'win', stake * 2, `${pv} beats ${dv}.`);
      if (pv === dv) return finish(msg, 'push', stake, `Both have ${pv}.`);
      return finish(msg, 'lose', 0, `Dealer wins ${dv} to ${pv}.`);
    }
  },
};

module.exports = { commands: [casino] };
