// /business (shops you own, keep stocked with supplies, collect profit, upgrade) and /invest (a live-ish stock + crypto market).
//
// Businesses are NOT free money any more:
//   * A shop only earns while it has SUPPLIES. /business restock buys them (cost = supplyRate x its gross income for that many hours).
//   * Collecting pays business tax, and random events can cost you (theft, health inspection).
//   * Income piles up in storage only up to a few hours' worth, so you have to come back to restock.
// Every number is in data/balance.js > business.
const store = require('../store');
const B = require('../data/balance');
const { BUSINESSES, STOCKS } = require('../data/careers');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const { COLORS, EPH, command, embed, num, fmtDur, pick, rand } = require('../lib/util');

const HOUR = 3600000;
const BZ = B.business;
const biz = (id) => BUSINESSES.find((b) => b.id === id);
const hourly = (b, rec, x) => Math.floor(b.hourly * (1 + 0.4 * (rec.lvl - 1)) * (x.job && x.job.id === 'manager' ? 1.1 : 1) * (rec.mgr ? 1.2 : 1));
const capHours = (rec) => BZ.baseStorage + rec.lvl * 2 + (rec.mgr ? 8 : 0);
const mgrCost = (b) => Math.floor(b.price * 0.25);
const upCost = (b, lvl) => Math.floor(b.price * 0.5 * Math.pow(lvl, 1.5));
const supLeft = (rec) => Math.max(0, ((rec.sup || 0) - Date.now()) / HOUR); // hours of supplies left
const supCost = (b, rec, x, hours) => Math.ceil(hourly(b, rec, x) * hours * BZ.supplyRate * (rec.mgr ? 1 - BZ.mgrSupplyDiscount : 1));
const fmtH = (h) => { const m = Math.max(0, Math.round(h * 60)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

// Brings a shop up to date: adds what it earned while it had supplies. Old saves (which only had `last`) are converted here.
function settle(b, rec, x) {
  const now = Date.now();
  if (rec.acc === undefined) {
    const h = Math.min(capHours(rec), (now - (rec.last || now)) / HOUR);
    rec.acc = h * hourly(b, rec, x);
    rec.sup = now + BZ.graceHours * HOUR; // old shops get a few hours of free supplies once
    rec.t = now;
    delete rec.last;
  }
  const end = Math.min(now, rec.sup || 0);
  if (end > rec.t) rec.acc += ((end - rec.t) / HOUR) * hourly(b, rec, x);
  rec.t = now;
  rec.acc = Math.min(rec.acc, capHours(rec) * hourly(b, rec, x));
  return rec;
}
const stored = (b, rec, x) => Math.floor(settle(b, rec, x).acc);
const totalHourly = (x) => Object.entries(x.biz || {}).reduce((sum, [bid, rec]) => (biz(bid) ? sum + hourly(biz(bid), rec, x) : sum), 0);

const bizChoice = (o, req = true) => o.setName('shop').setDescription(req ? 'Which business?' : 'Which business? (leave empty for all)').setRequired(req).addChoices(...BUSINESSES.map((b) => ({ name: `${b.name} (${num(b.price)} LP)`, value: b.id })));

const business = {
  data: command('business', 'Own businesses: stock them with supplies, collect profit, upgrade')
    .addSubcommand((s) => s.setName('list').setDescription('See every business you can buy'))
    .addSubcommand((s) => s.setName('buy').setDescription('Buy a business').addStringOption(bizChoice))
    .addSubcommand((s) => s.setName('restock').setDescription('Buy supplies. A shop without supplies earns nothing').addStringOption((o) => bizChoice(o, false)).addIntegerOption((o) => o.setName('hours').setDescription('Hours of supplies to buy (default: fill up)').setMinValue(1).setMaxValue(60)))
    .addSubcommand((s) => s.setName('collect').setDescription('Collect the profit your businesses made (business tax applies)'))
    .addSubcommand((s) => s.setName('upgrade').setDescription('Upgrade a business (more income, bigger storage)').addStringOption(bizChoice))
    .addSubcommand((s) => s.setName('info').setDescription('See your businesses').addUserOption((o) => o.setName('user').setDescription('Whose businesses? (default: you)')))
    .addSubcommand((s) => s.setName('sell').setDescription('Sell a business for 60% of what you paid in total').addStringOption(bizChoice))
    .addSubcommand((s) => s.setName('hire').setDescription(`Hire a manager: +20% income, +8h storage, supplies ${Math.round(BZ.mgrSupplyDiscount * 100)}% cheaper`).addStringOption(bizChoice))
    .addSubcommand((s) => s.setName('advertise').setDescription('Run an ad campaign: a gamble that can flop or go viral (every 6 hours)'))
    .addSubcommand((s) => s.setName('top').setDescription('The richest business owners')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const x = E.eco(id);
    const u = store.user(id);

    if (sub === 'list') {
      const lines = BUSINESSES.map((b) => `${e(b.icon)} **${b.name}** · ${e('coin')} ${num(b.price)}\n-# ${num(b.hourly)} LP/hour at level 1 · supplies ~${num(Math.ceil(b.hourly * BZ.supplyRate))} LP/hour · max level 10${x.biz[b.id] ? ` · you own it (lvl ${x.biz[b.id].lvl})` : ''}`);
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('a_cashbag_green')} Yuna business center`).setDescription(`${lines.join('\n')}\n\nA shop only earns while it has **supplies** (\`/business restock\`). Profit = income - supplies - **${Math.round(BZ.tax * 100)}% business tax**. Storage holds ${BZ.baseStorage + 2}-${BZ.baseStorage + 28} hours, so check in often. Buy with \`/business buy\`, collect with \`/business collect\`.`)] });
    }
    if (sub === 'info') {
      const who = interaction.options.getUser('user') || interaction.user;
      if (who.bot) return interaction.reply({ content: 'Bots own nothing.', flags: EPH });
      const wx = E.eco(who.id);
      const owned = Object.entries(wx.biz);
      if (!owned.length) return interaction.reply({ content: `${e('info')} ${who.id === id ? 'You have' : `${who.displayName} has`} no businesses. \`/business list\``, flags: EPH });
      let perHour = 0;
      const lines = owned.map(([bid, rec]) => {
        const b = biz(bid); perHour += hourly(b, rec, wx); stored(b, rec, wx);
        const left = supLeft(rec);
        return `${e(b.icon)} **${b.name}** · level **${rec.lvl}**/10${rec.mgr ? ` · ${e('briefcase_gold')} manager` : ''}\n-# ${num(hourly(b, rec, wx))} LP/hour · ${num(Math.floor(rec.acc))} LP waiting · ${left > 0 ? `supplies ${fmtH(left)}` : `${e('warn')} OUT OF SUPPLIES`}`;
      });
      return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e('briefcase_gold')} ${who.displayName}'s businesses`).setDescription(`${lines.join('\n\n')}\n\n${e('coin')} Gross: **${num(perHour)} LP/hour** (before supplies and tax)${who.id === id ? '\n-# `/business restock` buys supplies, `/business collect` pays you.' : ''}`)] });
    }
    if (sub === 'top') {
      const rows = Object.entries(store.db().users)
        .map(([uid, uu]) => { const ux = uu.eco; return ux && ux.biz && Object.keys(ux.biz).length ? { uid, n: Object.keys(ux.biz).length, h: totalHourly(ux) } : null; })
        .filter(Boolean).sort((a, c) => c.h - a.h).slice(0, 10);
      if (!rows.length) return interaction.reply({ content: `${e('info')} Nobody owns a business yet. Be the first: \`/business buy\``, flags: EPH });
      const medal = ['🥇', '🥈', '🥉'];
      const lines = rows.map((r, i) => `${medal[i] || `**${i + 1}.**`} <@${r.uid}> · ${e('coin')} **${num(r.h)}** LP/hour · ${r.n} shop${r.n === 1 ? '' : 's'}`);
      const mine = totalHourly(x);
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('trophy_shine')} Top business owners`).setDescription(`${lines.join('\n')}${mine ? `\n\n-# You earn ${num(mine)} LP/hour (gross)` : ''}`)], allowedMentions: { parse: [] } });
    }
    if (sub === 'advertise') {
      const perHour = totalHourly(x);
      if (!perHour) return interaction.reply({ content: `${e('info')} You own no business yet. \`/business list\``, flags: EPH });
      const left = E.cdLeft(id, 'bizad', 6 * HOUR);
      if (left) return interaction.reply({ content: `${e('clock')} Your ad agency needs a break. Next campaign in **${fmtDur(left)}**.`, flags: EPH });
      const cost = Math.max(100, perHour);
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} The campaign costs **${num(cost)} LP** (1 hour of gross income). You have **${num(u.lp)}**.`, flags: EPH });
      E.cdStart(id, 'bizad');
      const roll = Math.random();
      const [pF, pS] = BZ.adOdds;
      const [label, hours] = roll < pF ? ['The ad flopped. Almost nobody came.', BZ.adMults[0]] : roll < pF + pS ? ['Steady crowds came by.', BZ.adMults[1]] : ['The ad went **viral**! Queues around the block!', BZ.adMults[2]];
      const gain = Math.floor(perHour * hours);
      E.earn(id, gain, { hard: false });
      const net = gain - cost;
      return interaction.reply({ embeds: [E.card(net >= 0 ? COLORS.green : COLORS.orange, `${e('a_tag_win')} Ad campaign`, `${label}\nSpent ${E.lp(cost)}, customers brought in ${E.lp(gain)}.\n${net >= 0 ? `Profit **+${num(net)}**` : `Loss **${num(net)}**`} LP\n-# It is a gamble: it breaks even on average. Next campaign in 6 hours.`)] });
    }
    if (sub === 'restock') {
      const pickId = interaction.options.getString('shop');
      const targets = Object.entries(x.biz).filter(([bid]) => biz(bid) && (!pickId || bid === pickId));
      if (!targets.length) return interaction.reply({ content: pickId ? `${e('cross')} You do not own the ${biz(pickId).name}.` : `${e('info')} You own no business yet. \`/business list\``, flags: EPH });
      const wantH = interaction.options.getInteger('hours');
      const lines = []; let spent = 0; let broke = false;
      for (const [bid, rec] of targets) {
        const b = biz(bid);
        settle(b, rec, x);
        const room = Math.floor(capHours(rec) - supLeft(rec));
        const h = Math.min(wantH || room, room);
        if (h < 1) { lines.push(`${e(b.icon)} ${b.name}: already full (${fmtH(supLeft(rec))})`); continue; }
        const cost = supCost(b, rec, x, h);
        if (!E.pay(id, cost)) { lines.push(`${e('cross')} ${b.name}: needs **${num(cost)}** LP for ${h}h of supplies`); broke = true; continue; }
        rec.sup = Math.max(Date.now(), rec.sup || 0) + h * HOUR;
        spent += cost;
        lines.push(`${e(b.icon)} ${b.name}: **+${h}h** of supplies for ${num(cost)} LP (now ${fmtH(supLeft(rec))})`);
      }
      store.save();
      return interaction.reply({ embeds: [E.card(broke && !spent ? COLORS.red : COLORS.green, `${e('parcel_brown')} Supplies`, `${lines.join('\n')}${spent ? `\n\nSpent ${E.lp(spent)}` : ''}\n-# A manager makes supplies ${Math.round(BZ.mgrSupplyDiscount * 100)}% cheaper.`)] });
    }
    const b = interaction.options.getString('shop') ? biz(interaction.options.getString('shop')) : null;

    if (sub === 'buy') {
      if (x.biz[b.id]) return interaction.reply({ content: `${e('cross')} You already own the ${b.name}. \`/business upgrade\``, flags: EPH });
      if (!E.pay(id, b.price)) return interaction.reply({ content: `${e('cross')} The **${b.name}** costs **${num(b.price)} LP**. You have **${num(u.lp)}**.`, flags: EPH });
      const now = Date.now();
      x.biz[b.id] = { lvl: 1, spent: b.price, acc: 0, t: now, sup: now + BZ.startHours * HOUR };
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('confetti')} Grand opening!`, `You bought the ${e(b.icon)} **${b.name}** for ${E.lp(b.price)}.\nIt earns **${num(b.hourly)} LP/hour** and starts with **${BZ.startHours}h** of supplies.\nKeep it stocked with \`/business restock\`, then \`/business collect\`.`)] });
    }
    if (sub === 'hire') {
      const rec = x.biz[b.id];
      if (!rec) return interaction.reply({ content: `${e('cross')} You do not own the ${b.name}.`, flags: EPH });
      if (rec.mgr) return interaction.reply({ content: `${e('briefcase_gold')} The ${b.name} already has a manager.`, flags: EPH });
      const cost = mgrCost(b);
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} A manager for the ${b.name} costs **${num(cost)} LP**. You have **${num(u.lp)}**.`, flags: EPH });
      settle(b, rec, x); // bank what it earned before the new rate
      rec.mgr = true; rec.spent = (rec.spent || b.price) + cost;
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.purple, `${e('briefcase_gold')} Manager hired`, `${e(b.icon)} **${b.name}** now has a manager for ${E.lp(cost)}.\nIncome: **${num(hourly(b, rec, x))} LP/hour** · storage **${capHours(rec)}h** · supplies ${Math.round(BZ.mgrSupplyDiscount * 100)}% cheaper`)] });
    }
    if (sub === 'collect') {
      const owned = Object.entries(x.biz).filter(([bid]) => biz(bid));
      if (!owned.length) return interaction.reply({ content: `${e('info')} You own no business yet. \`/business list\``, flags: EPH });
      let gross = 0; const lines = []; const dry = [];
      for (const [bid, rec] of owned) {
        const bb = biz(bid); const amt = stored(bb, rec, x);
        if (amt > 0) { gross += amt; rec.acc -= amt; lines.push(`${e(bb.icon)} ${bb.name}: **${num(amt)}**`); }
        if (supLeft(rec) <= 0) dry.push(bb.name);
      }
      const dryLine = dry.length ? `\n${e('warn')} **Out of supplies:** ${dry.join(', ')}. They earn nothing until you \`/business restock\`.` : '';
      if (!gross) return interaction.reply({ content: `${e('clock')} Nothing to collect yet.${dryLine || ' Come back later.'}`, flags: EPH });
      const tax = Math.floor(gross * BZ.tax);
      let delta = 0; let eventLine = '';
      const roll = Math.random();
      if (roll < 0.08) { delta = Math.floor(gross * 0.1); eventLine = `\n${e('a_twinkle_gold')} **Viral review!** A food blogger loved your shops: +${num(delta)}`; }
      else if (roll < 0.11) { delta = Math.floor(gross * 0.2); eventLine = `\n${e('crown')} **Celebrity visit!** A famous guest shopped at your place: +${num(delta)}`; }
      else if (roll < 0.19) { delta = -Math.floor(gross * 0.15); eventLine = `\n${e('warn')} **Health inspection.** A fine of ${num(-delta)} was paid.`; }
      else if (roll < 0.25) { delta = -Math.floor(gross * 0.1); eventLine = `\n${e('bm_siren')} **Break-in!** Thieves took ${num(-delta)} from the till.`; }
      const net = Math.max(0, gross - tax + delta);
      const got = E.earn(id, net, { hard: false });
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('a_cashstack_green')} Business income`, `${lines.join('\n')}\n\nGross: **${num(gross)}** · business tax **-${num(tax)}**${eventLine}\nYou keep: ${E.lp(got)}\nWallet: ${E.lp(u.lp)}${dryLine}\n-# Supplies were bought up front, so this is your profit. \`/business restock\` keeps the shops running.`)] });
    }
    if (sub === 'upgrade') {
      const rec = x.biz[b.id];
      if (!rec) return interaction.reply({ content: `${e('cross')} You do not own the ${b.name}.`, flags: EPH });
      if (rec.lvl >= 10) return interaction.reply({ content: `${e('crown_gold')} The ${b.name} is already **max level**.`, flags: EPH });
      const cost = upCost(b, rec.lvl);
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} Upgrading to level ${rec.lvl + 1} costs **${num(cost)} LP**.`, flags: EPH });
      settle(b, rec, x); // bank what it earned before the new rate
      rec.lvl += 1; rec.spent = (rec.spent || b.price) + cost;
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.gold, `${e('a_tag_win')} Upgraded`, `${e(b.icon)} **${b.name}** is now level **${rec.lvl}**.\nIncome: **${num(hourly(b, rec, x))} LP/hour** · storage ${capHours(rec)}h`)] });
    }
    // sell
    const rec = x.biz[b.id];
    if (!rec) return interaction.reply({ content: `${e('cross')} You do not own the ${b.name}.`, flags: EPH });
    const val = Math.floor((rec.spent || b.price) * 0.6) + stored(b, rec, x);
    delete x.biz[b.id];
    E.earn(id, val, { boost: false, hard: false });
    return interaction.reply({ embeds: [E.card(COLORS.orange, `${e('bill_green')} Business sold`, `You sold the ${e(b.icon)} **${b.name}** for ${E.lp(val)}.`)] });
  },
};

// ======================================================================= /invest
// One price step every 5 minutes. Prices only move when somebody looks (we catch up in one go), up to 24h of history.
const STEP = 5 * 60000;
function market() {
  const db = store.db();
  if (!db.market) {
    db.market = { t: Date.now(), p: {}, hist: {} };
    for (const s of STOCKS) { db.market.p[s.s] = s.p; db.market.hist[s.s] = [s.p]; }
  }
  const m = db.market;
  let steps = Math.floor((Date.now() - m.t) / STEP);
  if (steps > 0) {
    steps = Math.min(steps, 288);
    for (const s of STOCKS) {
      let p = m.p[s.s];
      for (let i = 0; i < steps; i++) {
        const drift = (s.p - p) / s.p * 0.02; // slowly pulled back toward the base price
        p = Math.max(1, p * (1 + drift + (Math.random() * 2 - 1) * s.v));
        if (i % 6 === 0 || i === steps - 1) { m.hist[s.s].push(p); }
      }
      m.p[s.s] = p;
      m.hist[s.s] = m.hist[s.s].slice(-24);
    }
    m.t = Date.now();
    store.save();
  }
  return m;
}
const price = (m, sym) => Math.round(m.p[sym] * 100) / 100;
const change = (m, sym) => { const h = m.hist[sym]; const first = h[0]; return ((m.p[sym] - first) / first) * 100; };
const stockChoice = (o) => o.setName('symbol').setDescription('Which asset?').setRequired(true).addChoices(...STOCKS.map((s) => ({ name: `${s.s} - ${s.n}`, value: s.s })));
const qtyOpt = (o) => o.setName('amount').setDescription('How many shares? (a number, "half" or "all")').setRequired(true);

const invest = {
  data: command('invest', 'Trade stocks and crypto with Love Points')
    .addSubcommand((s) => s.setName('market').setDescription('See every price right now'))
    .addSubcommand((s) => s.setName('buy').setDescription('Buy shares').addStringOption(stockChoice).addStringOption(qtyOpt))
    .addSubcommand((s) => s.setName('sell').setDescription(`Sell shares (${B.invest.sellFee * 100}% fee)`).addStringOption(stockChoice).addStringOption(qtyOpt))
    .addSubcommand((s) => s.setName('portfolio').setDescription('Your shares and profit').addUserOption((o) => o.setName('user').setDescription('Whose portfolio? (default: you)')))
    .addSubcommand((s) => s.setName('chart').setDescription('Price history of one asset').addStringOption(stockChoice)),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const x = E.eco(id);
    const u = store.user(id);
    const m = market();
    const arrow = (c) => (c >= 0 ? `${e('a_tag_win')} +${c.toFixed(1)}%` : `${e('tag_lose')} ${c.toFixed(1)}%`);

    if (sub === 'market') {
      const lines = STOCKS.map((s) => `${e(s.icon)} \`${s.s}\` **${num(price(m, s.s))}** LP · ${arrow(change(m, s.s))}\n-# ${s.n}`);
      return interaction.reply({ embeds: [embed(COLORS.green).setTitle(`${e('crypto_gold')} Yuna stock market`).setDescription(`${lines.join('\n')}\n\nBuy with \`/invest buy\`, sell with \`/invest sell\`. Prices move every 5 minutes. Stay careful: crypto swings hard.`)] });
    }
    if (sub === 'chart') {
      const sym = interaction.options.getString('symbol', true);
      const s = STOCKS.find((q) => q.s === sym);
      const h = m.hist[sym];
      return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e(s.icon)} ${s.s} · ${s.n}`).setDescription(`\`${E.spark(h)}\`\nNow **${num(price(m, sym))} LP** · ${arrow(change(m, sym))}\nLow **${num(Math.round(Math.min(...h)))}** · High **${num(Math.round(Math.max(...h)))}**`)] });
    }
    if (sub === 'portfolio') {
      const who = interaction.options.getUser('user') || interaction.user;
      if (who.bot) return interaction.reply({ content: 'Bots trade in bits.', flags: EPH });
      const wx = E.eco(who.id);
      const rows = Object.entries(wx.stocks).filter(([, p]) => p.qty > 0);
      if (!rows.length) return interaction.reply({ content: `${e('info')} ${who.id === id ? 'You own' : `${who.displayName} owns`} no shares. \`/invest market\``, flags: EPH });
      let worth = 0; let cost = 0;
      const lines = rows.map(([sym, p]) => { const s = STOCKS.find((q) => q.s === sym); const v = Math.floor(price(m, sym) * p.qty); worth += v; cost += p.cost; const pl = v - p.cost; return `${e(s.icon)} \`${sym}\` x**${num(p.qty)}** · worth ${e('coin')} **${num(v)}** · ${pl >= 0 ? '+' : ''}${num(pl)}`; });
      const pl = worth - cost;
      return interaction.reply({ embeds: [embed(pl >= 0 ? COLORS.green : COLORS.red).setTitle(`${e('a_cashstack_green')} ${who.displayName}'s portfolio`).setDescription(`${lines.join('\n')}\n\nValue: ${E.lp(worth)}\nProfit/loss: **${pl >= 0 ? '+' : ''}${num(pl)} LP**`)] });
    }
    const sym = interaction.options.getString('symbol', true);
    const s = STOCKS.find((q) => q.s === sym);
    const px = price(m, sym);
    const held = x.stocks[sym] ? x.stocks[sym].qty : 0;
    if (sub === 'buy') {
      const maxQty = Math.floor(u.lp / (px * (1 + B.invest.buyFee)));
      const qty = E.parseAmount(interaction.options.getString('amount', true), maxQty);
      if (!Number.isFinite(qty) || qty < 1) return interaction.reply({ content: `${e('cross')} Give me a number, "half" or "all". You can afford **${num(maxQty)}** share(s).`, flags: EPH });
      const cost = Math.ceil(px * qty * (1 + B.invest.buyFee));
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} ${num(qty)} x ${sym} costs **${num(cost)} LP**. You have **${num(u.lp)}**.`, flags: EPH });
      const p = x.stocks[sym] || { qty: 0, cost: 0 };
      p.qty += qty; p.cost += cost; x.stocks[sym] = p; store.save();
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e(s.icon)} Bought ${sym}`, `${num(qty)} share(s) at **${num(px)} LP** for ${E.lp(cost)}.\nYou hold **${num(p.qty)}**.`)] });
    }
    const qty = E.parseAmount(interaction.options.getString('amount', true), held);
    if (!Number.isFinite(qty) || qty < 1) return interaction.reply({ content: `${e('cross')} Give me a number, "half" or "all".`, flags: EPH });
    if (qty > held) return interaction.reply({ content: `${e('cross')} You only hold **${num(held)}** ${sym}.`, flags: EPH });
    const p = x.stocks[sym];
    const gross = Math.floor(px * qty);
    const fee = Math.ceil(gross * B.invest.sellFee);
    const net = gross - fee;
    const basis = Math.floor(p.cost * (qty / p.qty));
    p.qty -= qty; p.cost -= basis; if (p.qty <= 0) delete x.stocks[sym];
    E.earn(id, net, { boost: false, hard: false });
    const pl = net - basis;
    return interaction.reply({ embeds: [E.card(pl >= 0 ? COLORS.green : COLORS.red, `${e(s.icon)} Sold ${sym}`, `${num(qty)} share(s) at **${num(px)} LP**.\nReceived ${E.lp(net)} (fee ${num(fee)}).\n${pl >= 0 ? `${e('a_tag_win')} Profit` : `${e('tag_lose')} Loss`}: **${pl >= 0 ? '+' : ''}${num(pl)} LP**`)] });
  },
};

module.exports = { commands: [business, invest] };
