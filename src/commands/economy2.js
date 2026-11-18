// More Love Points fun: /bank, /pet, /rob, /explore (all with Yuna's custom emojis).
const store = require('../store');
const B = require('../data/balance');
const C = require('../data/content');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const {
  COLORS, EPH, pick, rand, chance, command, embed, num, award, cooldown, fmtDur, guardTarget, daysSince,
} = require('../lib/util');

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
const item = (id) => C.shopItems.find((i) => i.id === id);
const give = (u, id, n = 1) => { u.inv[id] = (u.inv[id] || 0) + n; };
const take = (u, id, n = 1) => { u.inv[id] = (u.inv[id] || 0) - n; if (u.inv[id] <= 0) delete u.inv[id]; };

// "all", "half", "1.5k" or a plain number
function parseAmount(text, max) {
  const t = String(text || '').toLowerCase().replace(/[, ]/g, '');
  if (t === 'all' || t === 'max') return max;
  if (t === 'half') return Math.floor(max / 2);
  const m = t.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return NaN;
  return Math.floor(parseFloat(m[1]) * (m[2] === 'k' ? 1000 : m[2] === 'm' ? 1000000 : 1));
}

// ===========================================================================  /bank
const amountOpt = (o) => o.setName('amount').setDescription('How much? (a number, "half" or "all")').setRequired(true);
const bank = {
  data: command('bank', 'Keep Love Points safe from robbers')
    .addSubcommand((s) => s.setName('balance').setDescription('See your wallet and bank'))
    .addSubcommand((s) => s.setName('deposit').setDescription('Move Love Points into the bank').addStringOption(amountOpt))
    .addSubcommand((s) => s.setName('withdraw').setDescription('Take Love Points out of the bank').addStringOption(amountOpt))
    .addSubcommand((s) => s.setName('interest').setDescription(`Collect your daily bank interest (${+(B.bank.interestRate * 100).toFixed(2)}%, up to ${B.bank.interestCap.toLocaleString('en-US')} LP)`)),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const u = store.user(id);
    u.bank = u.bank || 0;
    const panel = (title, line) =>
      embed(COLORS.gold)
        .setTitle(`${e('bank')} ${title}`)
        .setDescription(`${line ? `${line}\n\n` : ''}${e('coin')} Wallet: **${num(u.lp)} LP**\n${e('bank')} Bank: **${num(u.bank)} LP**\n${e('moneybag')} Net worth: **${num(u.lp + u.bank)} LP**`);

    if (sub === 'balance') return interaction.reply({ embeds: [panel('Yuna Bank')] });

    if (sub === 'interest') {
      // Check the balance BEFORE starting the cooldown, so a too-small bank never burns your 22 hours.
      const wait = E.cdLeft(id, 'interest', 22 * 3600000);
      if (wait) return interaction.reply({ content: `${e('clock')} Interest is ready again <t:${Math.ceil((Date.now() + wait) / 1000)}:R> (in **${fmtDur(wait)}**).`, flags: EPH });
      if (u.bank < 50) return interaction.reply({ content: `${e('info')} Keep at least **50 LP** in the bank to earn interest.`, flags: EPH });
      E.cdStart(id, 'interest');
      const gain = Math.min(B.bank.interestCap, Math.floor(u.bank * B.bank.interestRate));
      u.bank += gain;
      store.save();
      return interaction.reply({ embeds: [panel('Interest collected', `${e('sparkle')} Your savings earned **+${num(gain)} LP**.`)] });
    }

    const from = sub === 'deposit' ? u.lp : u.bank;
    const amount = parseAmount(interaction.options.getString('amount', true), from);
    if (Number.isFinite(amount) && amount < 1 && from < 1) return interaction.reply({ content: `${e('info')} ${sub === 'deposit' ? 'Your wallet is empty, there is nothing to deposit.' : 'Your bank is empty, there is nothing to withdraw.'}`, flags: EPH });
    if (!Number.isFinite(amount) || amount < 1) return interaction.reply({ content: `${e('cross')} Give me a number like \`500\`, \`1.5k\`, "half" or "all".`, flags: EPH });
    if (amount > from) return interaction.reply({ content: `${e('cross')} You only have **${num(from)} LP** there.`, flags: EPH });
    if (sub === 'deposit') { u.lp -= amount; u.bank += amount; } else { u.bank -= amount; u.lp += amount; }
    store.save();
    return interaction.reply({ embeds: [panel(sub === 'deposit' ? 'Deposited' : 'Withdrawn', `${e('check')} **${num(amount)} LP** ${sub === 'deposit' ? 'is now safe in the bank' : 'is back in your wallet'}.`)] });
  },
};

// ===========================================================================  /pet
const PETS = {
  cat: { name: 'Cat', price: 200 }, dog: { name: 'Dog', price: 200 }, bunny: { name: 'Bunny', price: 250 },
  fox: { name: 'Fox', price: 400 }, panda: { name: 'Panda', price: 600 }, dragon: { name: 'Baby Dragon', price: 1500 },
};
const petLevel = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
const petBar = (xp) => {
  const lvl = petLevel(xp);
  const floor = 40 * (lvl - 1) ** 2;
  const next = 40 * lvl ** 2;
  const pct = Math.round(((xp - floor) / (next - floor)) * 10);
  return `${e('heart_pink').repeat(pct)}${e('heart_white').repeat(10 - pct)}`;
};
const petCard = (who, p) => {
  const lvl = petLevel(p.xp);
  return embed(COLORS.pink)
    .setTitle(`${e(`pet_${p.type}`)} ${p.name}`)
    .setDescription(
      `Owner: ${who}\nSpecies: **${PETS[p.type].name}**\nLevel: **${lvl}** (${num(p.xp)} XP)\n${petBar(p.xp)}\nAge: **${daysSince(p.born)}** day(s)\n\n-# ${e('paw')} /pet play earns LP, /pet feed keeps it happy and levels it up`
    );
};

const pet = {
  data: command('pet', 'Adopt a pet that grows and earns Love Points for you')
    .addSubcommand((s) =>
      s.setName('adopt').setDescription('Adopt a pet').addStringOption((o) =>
        o.setName('type').setDescription('Which pet?').setRequired(true).addChoices(...Object.entries(PETS).map(([k, v]) => ({ name: `${v.name} (${num(v.price)} LP)`, value: k })))
      ).addStringOption((o) => o.setName('name').setDescription('Name your pet').setMaxLength(20))
    )
    .addSubcommand((s) => s.setName('info').setDescription('See a pet').addUserOption((o) => o.setName('user').setDescription('Whose pet? (default: you)')))
    .addSubcommand((s) => s.setName('feed').setDescription('Feed your pet (15 LP, every 2 hours)'))
    .addSubcommand((s) => s.setName('play').setDescription('Play with your pet and earn LP (every hour)'))
    .addSubcommand((s) => s.setName('rename').setDescription('Give your pet a new name').addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true).setMaxLength(20)))
    .addSubcommand((s) => s.setName('release').setDescription('Say goodbye to your pet')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const u = store.user(id);

    if (sub === 'info') {
      const who = interaction.options.getUser('user') || interaction.user;
      const p = store.user(who.id).pet;
      if (!p) return interaction.reply({ content: `${e('paw')} ${who.id === id ? 'You have no pet yet. Adopt one with `/pet adopt`.' : `${who.displayName} has no pet.`}`, flags: EPH });
      return interaction.reply({ embeds: [petCard(who, p)] });
    }

    if (sub === 'adopt') {
      if (u.pet) return interaction.reply({ content: `${e('cross')} You already have **${u.pet.name}**. \`/pet release\` first.`, flags: EPH });
      const type = interaction.options.getString('type', true);
      const def = PETS[type];
      if (!def) return interaction.reply({ content: `${e('cross')} Pick one of: ${Object.keys(PETS).join(', ')}.`, flags: EPH });
      if (u.lp < def.price) return interaction.reply({ content: `${e('cross')} A ${def.name} costs **${num(def.price)} LP**, you have **${num(u.lp)}**.`, flags: EPH });
      award(id, -def.price);
      u.pet = { type, name: interaction.options.getString('name') || def.name, xp: 0, born: Date.now() };
      store.save();
      return interaction.reply({ embeds: [petCard(interaction.user, u.pet).setTitle(`${e('confetti')} Welcome home, ${u.pet.name}!`)] });
    }

    if (!u.pet) return interaction.reply({ content: `${e('paw')} You have no pet yet. Adopt one with \`/pet adopt\`.`, flags: EPH });

    if (sub === 'rename') {
      u.pet.name = interaction.options.getString('name', true);
      store.save();
      return interaction.reply({ content: `${e('check')} Your pet is now called **${u.pet.name}**.` });
    }
    if (sub === 'release') {
      const name = u.pet.name;
      u.pet = null;
      store.save();
      return interaction.reply({ content: `${e('heartbreak')} You said goodbye to **${name}**.` });
    }
    if (sub === 'feed') {
      if (u.lp < 15) return interaction.reply({ content: `${e('cross')} Food costs **15 LP**.`, flags: EPH });
      const left = cooldown(id, 'petfeed', 2 * 3600000);
      if (left) return interaction.reply({ content: `${e('clock')} ${u.pet.name} is full. Hungry again in **${fmtDur(left)}**.`, flags: EPH });
      award(id, -15);
      u.pet.xp += 25;
      store.save();
      return interaction.reply({ embeds: [embed(COLORS.green).setDescription(`${e('bone')} You fed **${u.pet.name}** and they loved it! **+25 XP**\n${petBar(u.pet.xp)}`)] });
    }
    // play
    const left = cooldown(id, 'petplay', 3600000);
    if (left) return interaction.reply({ content: `${e('clock')} ${u.pet.name} is tired. Play again in **${fmtDur(left)}**.`, flags: EPH });
    const lvl = petLevel(u.pet.xp);
    const pay = Math.max(1, Math.round((rand(10, 30) + lvl * 5) * B.hard.earnMult));
    u.pet.xp += 15;
    award(id, pay);
    return interaction.reply({ embeds: [embed(COLORS.pink).setDescription(`${e('paw')} You played with **${u.pet.name}** and found **${num(pay)} LP**! **+15 XP**\n${petBar(u.pet.xp)}`)] });
  },
};

// ===========================================================================  /rob
// Rules: loot is a PERCENTAGE of the victim's wallet (so big wallets are juicy, and the bank is the only safe place).
// Each victim has their own cooldown for you, so you can rob different people back to back (short global cooldown only
// stops spam). A robbed player is protected for a while, so nobody gets farmed. Dogs/dragons guard their owner.
const ROB = { spam: B.rob.spamMs, perTarget: 30 * 60000, shield: 30 * 60000, min: 100 };
const rob = {
  data: command('rob', "Steal Love Points from someone's wallet (the bank is safe)").addUserOption((o) =>
    o.setName('user').setDescription('Who do you rob?').setRequired(true)
  ),
  async execute(interaction) {
    const actor = interaction.user;
    if (await E.jailed(interaction)) return;
    const target = interaction.options.getUser('user', true);
    if (!(await guardTarget(interaction, target, { selfMsg: 'You cannot rob yourself', botMsg: 'Bots have no wallet' }))) return;
    const me = store.user(actor.id);
    const them = store.user(target.id);
    const x = E.eco(actor.id);
    const who = `**${actor.displayName}**`;
    const hush = (msg) => interaction.reply({ content: msg, flags: EPH });
    const say = (msg) => interaction.reply({ content: msg });

    if (me.rel && me.rel.partner === target.id) return hush(`${e('heartbreak')} **|** ${who}, you can't rob your own partner!`);
    if (me.lp < ROB.min) return hush(`${e('cross')} **|** ${who}, you need at least ${e('coin')} **${ROB.min}** in your wallet to cover the fine if you get caught.`);
    if (them.lp < ROB.min) return hush(`${e('info')} **|** ${who}, **${target.displayName}** has less than ${e('coin')} **${ROB.min}** in their wallet. Not worth it.`);

    // cooldowns: short global one, one per victim, and a shield on a freshly robbed victim
    if (!x.robs) x.robs = {};
    const spam = E.cdLeft(actor.id, 'rob', ROB.spam);
    if (spam) return hush(`${e('clock')} **|** ${who}, slow down! Next rob in **${fmtDur(spam)}**.`);
    const again = Math.max(0, (x.robs[target.id] || 0) + ROB.perTarget - Date.now());
    if (again) return hush(`${e('clock')} **|** ${who}, the cops are watching **${target.displayName}** because of you. Try them again in **${fmtDur(again)}**, or rob someone else!`);
    const shield = E.cdLeft(target.id, 'robbed', ROB.shield);
    if (shield) return hush(`${e('shield')} **|** ${who}, **${target.displayName}** was just robbed and is protected for **${fmtDur(shield)}**.`);

    E.cdStart(actor.id, 'rob');
    x.robs[target.id] = Date.now();
    for (const [k, t] of Object.entries(x.robs)) if (Date.now() - t > ROB.perTarget) delete x.robs[k]; // keep the list small
    store.save();

    // what is at stake: 8-25% of their wallet, capped by how rich YOU are (a broke robber can't empty a whale)
    const pct = rand(8, 25) / 100;
    const stake = Math.max(1, Math.min(Math.floor(them.lp * pct), Math.max(5000, me.lp * 3)));

    // Love Lock: breaks, you get caught
    if (them.inv.lock) {
      take(them, 'lock');
      const fine = Math.min(me.lp, Math.max(60, Math.floor(stake * 0.5)));
      award(actor.id, -fine);
      return say(`${target} ${e('lock')} **|** ${who} tried to rob you but your ${item('lock').emoji} **Love Lock** broke and they paid a ${e('coin')} **${num(fine)}** fine!`);
    }

    // success chance: 50%, guard pets help the victim, being wanted hurts you
    let odds = B.rob.baseOdds - E.heat(actor.id) * 0.03;
    const guard = them.pet && ['dog', 'dragon'].includes(them.pet.type);
    if (guard) odds -= 0.07;
    odds = Math.max(0.15, odds);

    if (chance(odds)) {
      award(target.id, -stake);
      award(actor.id, stake);
      E.cdStart(target.id, 'robbed');
      E.addHeat(actor.id, 1);
      return say(`${target} ${e('mask_bandit_black')} **|** ${who} robbed ${e('coin')} **${num(stake)}** from you!`);
    }

    const fine = Math.min(me.lp, Math.max(60, Math.min(Math.floor(stake * (rand(B.rob.failFine[0], B.rob.failFine[1]) / 100)), Math.floor(me.lp * 0.6)))); // never more than 60% of your wallet
    award(actor.id, -fine);
    const comp = Math.floor(fine / 2); // half of the fine goes to the victim
    if (comp) award(target.id, comp);
    E.addHeat(actor.id, 1);
    let jail = '';
    if (chance(0.25)) {
      const m = rand(3, 6);
      x.jail = Math.max(x.jail, Date.now()) + (x.job && x.job.id === 'lawyer' ? Math.ceil(m / 2) : m) * 60000;
      x.st.jailed += 1;
      store.save();
      jail = ` ${e('bm_siren')} Locked up for **${m} min**!`;
    }
    return say(`${target} ${e('a_siren')} **|** ${who} got caught trying to rob you and paid a ${e('coin')} **${num(fine)}** fine! You got ${e('coin')} **${num(comp)}** for the trouble.${jail}`);
  },
};

// ===========================================================================  /explore
const explore = {
  data: command('explore', 'Wander Yuna\'s world: tide pools, moonlit meadows and forgotten ruins')
    .addSubcommand((s) => s.setName('tidepool').setDescription(`Search the glowing tide pools for pearls (every ${B.explore.cooldownMs / 60000} minutes)`))
    .addSubcommand((s) => s.setName('meadow').setDescription(`Wander the moonlit meadow for lost keepsakes (every ${B.explore.cooldownMs / 60000} minutes)`))
    .addSubcommand((s) => s.setName('ruins').setDescription(`Brush the dust off forgotten ruins (every ${B.explore.cooldownMs / 60000} minutes)`))
    .addSubcommand((s) =>
      s.setName('sell').setDescription('Sell items from your inventory')
        .addStringOption((o) => o.setName('item').setDescription('What to sell?').setRequired(true).setAutocomplete(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('How many? (default: all of them)').setMinValue(1))
    ),
  async autocomplete(interaction) {
    const q = norm(interaction.options.getFocused());
    const u = store.user(interaction.user.id);
    const hits = C.shopItems.filter((i) => u.inv[i.id] && i.sell && (!q || norm(i.name).includes(q) || i.id.includes(q))).slice(0, 25);
    return interaction.respond(hits.map((i) => ({ name: `${i.name} (x${u.inv[i.id]}) - ${num(i.sell)} LP each`.slice(0, 100), value: i.id })));
  },
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const u = store.user(id);

    if (sub === 'sell') {
      const it = findItem(interaction.options.getString('item', true));
      if (!it || !u.inv[it.id]) return interaction.reply({ content: `${e('cross')} You don't have that. Check \`/inventory\`.`, flags: EPH });
      if (!it.sell) return interaction.reply({ content: `${e('cross')} That can't be sold.`, flags: EPH });
      const n = Math.min(interaction.options.getInteger('amount') || u.inv[it.id], u.inv[it.id]);
      take(u, it.id, n);
      award(id, it.sell * n);
      return interaction.reply({ content: `${e('moneybag')} **|** **${interaction.user.displayName}**, you sold **${n}×** ${it.emoji} **${it.name}** for ${e('coin')} **${num(it.sell * n)}**!` });
    }

    const left = cooldown(id, 'explore', B.explore.cooldownMs);
    if (left) return interaction.reply({ content: `${e('clock')} Your lantern is recharging. Wander again in **${fmtDur(left)}**.`, flags: EPH });

    const r = Math.random();
    let line; let lp = 0; let found = null;
    if (sub === 'tidepool') {
      if (r < B.explore.fish.none) line = 'The pools were calm and the tide took everything back.';
      else if (r < B.explore.fish.fish) { found = 'fish'; line = 'A glimmerfish darted into your hands!'; }
      else if (r < B.explore.fish.pearl) { found = 'pearl'; line = 'A shell opened and a pearl was glowing inside!'; }
      else if (r < B.explore.fish.chest) { found = 'chest'; line = 'The tide rolled a sunken keepsake chest onto the sand!'; }
      else { lp = rand(B.explore.fish.lp[0], B.explore.fish.lp[1]); line = 'Wishing coins sparkled at the bottom of the pool.'; }
    } else if (sub === 'meadow') {
      if (r < B.explore.hunt.none) line = 'The meadow was quiet tonight, only fireflies.';
      else if (r < B.explore.hunt.bone) { found = 'bone'; line = 'You found a dusty old bone half-hidden in the moss.'; }
      else if (r < B.explore.hunt.key) { found = 'key'; line = 'Something golden glints in the flowers, a little key!'; }
      else { lp = rand(B.explore.hunt.lp[0], B.explore.hunt.lp[1]); line = 'A moon-fox let you sketch it, and the sketch sold well.'; }
    } else {
      if (r < B.explore.dig.none) line = 'Only dust and echoes in these ruins today.';
      else if (r < B.explore.dig.gem) { found = 'gem'; line = 'A ruby gleamed from behind a cracked stone!'; }
      else if (r < B.explore.dig.diamond) { found = 'diamond'; line = 'A DIAMOND in the old fountain! Lucky day!'; }
      else if (r < B.explore.dig.chest) { found = 'chest'; line = 'A hidden hatch swung open on a relic chest!'; }
      else { lp = rand(B.explore.dig.lp[0], B.explore.dig.lp[1]); line = 'An ancient coin purse was tucked inside a wall.'; }
    }
    if (found) give(u, found);
    if (lp) award(id, lp);
    store.save();
    const it = found ? item(found) : null;
    const icon = { tidepool: 'pearl', meadow: 'flower', ruins: 'chest' }[sub];
    const reward = it ? `\n${e('check')} Found ${it.emoji} **${it.name}**` : lp ? `\n${e('check')} Earned ${e('coin')} **${lp} LP**` : '';
    return interaction.reply({ embeds: [embed(found || lp ? COLORS.green : COLORS.grey).setTitle(`${e(icon)} ${sub[0].toUpperCase()}${sub.slice(1)}`).setDescription(`${line}${reward}`)] });
  },
};

module.exports = { commands: [bank, pet, rob, explore] };
