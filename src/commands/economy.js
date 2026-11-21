// Love Points (LP) economy: daily, balance, shop, buy, gift, inventory, give, leaderboard.
const store = require('../store');
const B = require('../data/balance');
const C = require('../data/content');
const {
  COLORS, EPH, command, embed, mention, fmtDur, num, award, addCoupleXp, guardTarget, cooldown, unix,
} = require('../lib/util');

const { e } = require('../lib/emojis');
const emo = e; // daily() has its own local names, so keep a safe alias

// Finds an item from what the person typed: id, full name or the start of either.
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const findItem = (text) => {
  const n = norm(text);
  if (!n) return null;
  return (
    C.shopItems.find((i) => i.id === n || norm(i.name) === n) ||
    C.shopItems.find((i) => i.id.startsWith(n) || norm(i.name).startsWith(n)) ||
    C.shopItems.find((i) => norm(i.name).includes(n))
  );
};
const itemById = findItem;
const tag = (i) => `${i.emoji} **${i.name}**`;

// Autocomplete lists: 'buy' = things for sale, 'own' = things you have in your inventory.
const suggest = (kind) => async (interaction) => {
  const q = norm(interaction.options.getFocused());
  const u = store.user(interaction.user.id);
  const pool = kind === 'own' ? C.shopItems.filter((i) => u.inv[i.id]) : C.shopItems.filter((i) => i.price > 0);
  const hits = pool.filter((i) => !q || norm(i.name).includes(q) || i.id.includes(q)).slice(0, 25);
  return interaction.respond(
    hits.map((i) => ({ name: kind === 'own' ? `${i.name} (x${u.inv[i.id]})`.slice(0, 100) : `${i.name} - ${num(i.price)} LP`.slice(0, 100), value: i.id }))
  );
};
const itemOption = (o, desc) => o.setName('item').setDescription(desc).setRequired(true).setAutocomplete(true);
const DAILY_MS = 22 * 3600000;

const daily = {
  data: command('daily', 'Claim your daily Love Points'),
  async execute(interaction) {
    const actor = interaction.user;
    const u = store.user(actor.id);
    const now = Date.now();
    const wait = u.lastDaily + DAILY_MS - now;
    if (wait > 0) {
      return interaction.reply({ content: `${emo('clock')} **|** **${actor.displayName}**, your next daily is in: **${require('../lib/eco').hms(wait)}**`, flags: EPH });
    }
    u.streak = now - u.lastDaily <= 48 * 3600000 && u.lastDaily ? u.streak + 1 : 1;
    u.lastDaily = now;
    const streakBonus = Math.min(B.daily.streakMax, (u.streak - 1) * B.daily.streakStep);
    let total = B.daily.base + streakBonus;
    const parts = [`Base: **${B.daily.base}**`];
    if (streakBonus) parts.push(`Streak (${u.streak} days): **+${streakBonus}**`);
    if (u.rel) {
      total += B.daily.relBonus;
      parts.push(`Relationship bonus: **+${B.daily.relBonus}**`);
      addCoupleXp(actor.id, u.rel.partner, 10);
    }
    award(actor.id, total);
    const flame = Math.min(7, u.streak % 7 === 0 ? 7 : u.streak % 7);
    // Title and the breakdown are plain text; the total and the streak bar sit in an embed right under it.
    const header = `${emo('letter')} **Daily love letter for ${actor.displayName}**\n${parts.map((x) => `${emo('sparkle')} ${x}`).join('\n')}`;
    const letter = embed(COLORS.pink)
      .setDescription(`${emo('coin')} **+${num(total)} LP** tucked into your wallet`)
      .addFields(
        { name: `${emo('fire')} Streak`, value: `${'▰'.repeat(flame)}${'▱'.repeat(7 - flame)}  day **${u.streak}**${flame === 7 ? ' (full week!)' : ''}`, inline: true },
        { name: `${emo('clock')} Next letter`, value: `<t:${Math.floor((now + DAILY_MS) / 1000)}:R>`, inline: true }
      );
    return interaction.reply({ content: header, embeds: [letter] });
  },
};

const balance = {
  data: command('balance', 'Check Love Points (wallet and bank)').addUserOption((o) =>
    o.setName('user').setDescription('Whose balance? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots are priceless', flags: EPH });
    const u = store.user(who.id);
    const em = embed(COLORS.gold)
      .setTitle(`${e('coin_spin')} ${who.displayName}'s balance`)
      .setDescription(
        `${e('coin')} Wallet: **${num(u.lp)} LP**\n${e('bank')} Bank: **${num(u.bank || 0)} LP**\n${e('gem_pink')} Gems: **${num((u.eco && u.eco.gems) || 0)}**\n${e('moneybag')} Net worth: **${num(u.lp + (u.bank || 0))} LP**`
      );
    return interaction.reply({ embeds: [em] });
  },
};

const cash = {
  data: command('cash', 'Check your carried Love Points'),
  async execute(interaction) {
    const u = store.user(interaction.user.id);
    return interaction.reply({
      content: `🪙 | **${interaction.user.displayName}**, you currently have **${num(u.lp)} LP** in cash!`,
      allowedMentions: { parse: [] },
    });
  },
};

const wallet = {
  data: command('wallet', 'Check your banked Love Points'),
  async execute(interaction) {
    const u = store.user(interaction.user.id);
    return interaction.reply({
      content: `🏦 | **${interaction.user.displayName}**, your wallet (bank) holds **${num(u.bank || 0)} LP**!`,
      allowedMentions: { parse: [] },
    });
  },
};

const shop = {
  data: command('shop', 'Browse the love shop').addStringOption((o) =>
    o.setName('category').setDescription('Which shelf? (default: everything)').addChoices(...C.shopCats.map((c) => ({ name: c.name, value: c.id })))
  ),
  async execute(interaction) {
    const catId = interaction.options.getString('category');
    const e1 = embed(COLORS.pink);
    if (catId) {
      const cat = C.shopCats.find((c) => c.id === catId);
      const items = C.shopItems.filter((i) => i.cat === catId);
      const lines = items.map((i) =>
        i.price ? `${i.emoji} **${i.name}** \`${i.id}\`: ${e('coin')} **${num(i.price)}**\n-# ${i.desc}` : `${i.emoji} **${i.name}** \`${i.id}\`: sells for ${e('coin')} **${num(i.sell)}**\n-# ${i.desc}`
      );
      e1.setTitle(`${e(cat.icon)} Love shop: ${cat.name}`).setDescription(`${lines.join('\n')}\n\n${catId === 'finds' ? 'Sell these with `/explore sell`.' : 'Buy with `/buy`, send with `/gift`.'}`);
    } else {
      e1.setTitle(`${e('gift_bounce')} Love shop`).setDescription(`Your wallet: ${e('coin')} **${num(store.user(interaction.user.id).lp)} LP**\nBuy with \`/buy\`, send with \`/gift\`, open a shelf with \`/shop category\`.`);
      for (const cat of C.shopCats.filter((c) => c.id !== 'finds')) {
        const lines = C.shopItems.filter((i) => i.cat === cat.id).map((i) => `${i.emoji} **${i.name}** · ${e('coin')} ${num(i.price)}`);
        e1.addFields({ name: `${e(cat.icon)} ${cat.name}`, value: lines.join('\n').slice(0, 1024), inline: true });
      }
    }
    return interaction.reply({ embeds: [e1] });
  },
};

const buy = {
  data: command('buy', 'Buy something from the shop')
    .addStringOption((o) => itemOption(o, 'What to buy'))
    .addIntegerOption((o) => o.setName('amount').setDescription('How many? (default 1)').setMinValue(1).setMaxValue(25)),
  autocomplete: suggest('buy'),
  async execute(interaction) {
    const item = findItem(interaction.options.getString('item'));
    if (!item || !item.price) return interaction.reply({ content: `${e('cross')} I could not find that in the shop. Try \`/shop\`.`, flags: EPH });
    const amount = interaction.options.getInteger('amount') || 1;
    const u = store.user(interaction.user.id);
    const cost = item.price * amount;
    if (u.lp < cost) {
      return interaction.reply({ content: `${e('cross')} You need **${num(cost)} LP** but have **${num(u.lp)}**. Try /daily!`, flags: EPH });
    }
    award(interaction.user.id, -cost);
    u.inv[item.id] = (u.inv[item.id] || 0) + amount;
    store.save();
    return interaction.reply({ content: `${e('gift')} **|** **${interaction.user.displayName}**, you bought ${amount > 1 ? `**${amount}×** ` : ''}${tag(item)} for ${e('coin')} **${num(cost)}**!` });
  },
};

const inventory = {
  data: command('inventory', 'See your items').addUserOption((o) =>
    o.setName('user').setDescription('Whose inventory? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots own nothing but code', flags: EPH });
    const u = store.user(who.id);
    const lines = C.shopItems.filter((i) => u.inv[i.id]).map((i) => `${i.emoji} **${i.name}** × ${u.inv[i.id]}`);
    const worth = C.shopItems.reduce((t, i) => t + (u.inv[i.id] || 0) * (i.sell || 0), 0);
    return interaction.reply({
      embeds: [
        embed(COLORS.purple)
          .setTitle(`${e('chest')} ${who.displayName}'s inventory`)
          .setDescription(lines.length ? `${lines.join('\n')}\n\n-# Worth about ${num(worth)} LP if sold` : `Empty. Visit the ${e('gift')} /shop!`),
      ],
    });
  },
};

const gift = {
  data: command('gift', 'Gift an item to someone')
    .addUserOption((o) => o.setName('user').setDescription('Who gets it?').setRequired(true))
    .addStringOption((o) => itemOption(o, 'Which item from your inventory?')),
  autocomplete: suggest('own'),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (!(await guardTarget(interaction, target, { selfMsg: 'Treat yourself in the /shop instead!', botMsg: 'Bots politely decline' }))) return;
    const item = findItem(interaction.options.getString('item'));
    const me = store.user(actor.id);
    if (!item || !me.inv[item.id]) {
      return interaction.reply({ content: `${e('cross')} You don't have that. ${item ? `Get a ${item.emoji} **${item.name}** with \`/buy ${item.id}\`.` : 'Check \`/inventory\`.'}`, flags: EPH });
    }
    me.inv[item.id] -= 1;
    if (me.inv[item.id] <= 0) delete me.inv[item.id];
    const them = store.user(target.id);
    them.inv[item.id] = (them.inv[item.id] || 0) + 1;
    me.stats.gifts_sent += 1;
    them.stats.gifts_received += 1;
    const notes = [];
    if (me.rel && me.rel.partner === target.id) {
      const xp = Math.max(5, Math.round((item.price || item.sell * 2) / 4));
      addCoupleXp(actor.id, target.id, xp);
      notes.push(`+${xp} couple XP`);
    }
    store.save();
    return interaction.reply({ content: `${e('gift_bounce')} **|** **${actor.displayName}** gave ${target} a ${tag(item)}!` });
  },
};

const give = {
  data: command('give', 'Send Love Points to someone')
    .addUserOption((o) => o.setName('user').setDescription('Who gets them?').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('How much to send?').setRequired(true).setMinValue(1).setMaxValue(1000000000)),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (!(await guardTarget(interaction, target, { selfMsg: 'You cannot give yourself money', botMsg: 'Bots do not need money' }))) return;
    const amount = interaction.options.getInteger('amount');
    const me = store.user(actor.id);
    if (me.lp < amount) return interaction.reply({ content: `${e('cross')} **${actor.displayName}**, you don't have enough! You only have ${e('coin')} **${num(me.lp)}**.`, flags: EPH });
    const tax = Math.floor(amount * B.give.tax); // burned, so alts cannot feed a main account for free
    award(actor.id, -amount);
    award(target.id, amount - tax);
    // OwO style one-liner: "<icon> | @sender sent <coin> 200,000 to @receiver!"
    return interaction.reply({ content: `${e('cashbag_hotpink')} **|** ${actor} sent ${e('coin')} **${num(amount - tax)}** to ${target}!${tax ? `\n-# ${num(tax)} LP tax was burned` : ''}` });
  },
};

const Lv = require('../lib/levels');
const boards = {
  level: { title: 'Highest level', value: (u) => u.xp || 0, fmt: (v) => `Level ${Lv.levelOf(v)} (${num(v)} XP)` },
  lp: { title: 'Richest in love', value: (u) => u.lp, fmt: (v) => `${num(v)} LP` },
  kisses: { title: 'Most kisses sent', value: (u) => u.stats.sent.kiss || 0, fmt: (v) => `${num(v)} kisses` },
  hugs: { title: 'Most hugs sent', value: (u) => u.stats.sent.hug || 0, fmt: (v) => `${num(v)} hugs` },
  worth: { title: 'Net worth (wallet + bank)', value: (u) => u.lp + (u.bank || 0), fmt: (v) => `${num(v)} LP` },
  gifts: { title: 'Most generous', value: (u) => u.stats.gifts_sent, fmt: (v) => `${num(v)} gifts` },
};

const leaderboard = {
  data: command('leaderboard', 'Top lovers and couples').addStringOption((o) =>
    o.setName('type').setDescription('Which board?').addChoices(
      { name: 'Love Points', value: 'lp' },
      { name: 'Level', value: 'level' },
      { name: 'Top couples', value: 'couples' },
      { name: 'Kisses', value: 'kisses' },
      { name: 'Hugs', value: 'hugs' },
      { name: 'Gifts', value: 'gifts' },
      { name: 'Net worth', value: 'worth' }
    )
  ),
  async execute(interaction) {
    const type = interaction.options.getString('type') || 'lp';
    const db = store.db();
    let title;
    let lines;
    if (type === 'couples') {
      title = 'Top couples';
      const seen = new Set();
      const couples = [];
      for (const [id, u] of Object.entries(db.users)) {
        if (!u.rel || seen.has(id) || seen.has(u.rel.partner)) continue;
        seen.add(id);
        seen.add(u.rel.partner);
        const c = db.couples[store.pairKey(id, u.rel.partner)];
        couples.push({ a: id, b: u.rel.partner, xp: c ? c.xp : 0, type: u.rel.type });
      }
      couples.sort((x, y) => y.xp - x.xp);
      lines = couples.slice(0, 10).map((c, i) => `**${i + 1}.** ${mention(c.a)} ${mention(c.b)}: ${num(c.xp)} XP`);
    } else {
      const board = boards[type];
      title = board.title;
      const rows = Object.entries(db.users)
        .map(([id, u]) => ({ id, v: board.value(u) }))
        .filter((r) => r.v > 0)
        .sort((x, y) => y.v - x.v)
        .slice(0, 10);
      lines = rows.map((r, i) => `**${i + 1}.** ${mention(r.id)}: ${board.fmt(r.v)}`);
    }
    const e1 = embed(COLORS.gold).setTitle(`${e('trophy_shine')} ${title}`).setDescription(lines.length ? lines.join('\n') : 'Nobody here yet. Be the first!');
    return interaction.reply({ embeds: [e1] });
  },
};

module.exports = { commands: [daily, balance, cash, wallet, shop, buy, inventory, gift, give, leaderboard] };
