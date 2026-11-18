// Fun love tools: ship, lovemeter, zodiac, crush, admirer, letters, poems, flirting...
const crypto = require('node:crypto');
const store = require('../store');
const B = require('../data/balance');
const C = require('../data/content');
const { ask, button, row, ButtonStyle } = require('../lib/interactive');
const {
  COLORS, EPH, pick, rand, chance, mention, command, embed, bar, pairScore, fmtDur,
  cooldown, award, addCoupleXp, isBlocked, guardTarget,
} = require('../lib/util');

const tier = (list, pct) => list.find((t) => pct <= t.max) || list[list.length - 1];

function shipName(a, b) {
  const x = String(a);
  const y = String(b);
  return x.slice(0, Math.ceil(x.length / 2)) + y.slice(Math.floor(y.length / 2));
}

const ship = {
  data: command('ship', 'Check the love compatibility of two people')
    .addUserOption((o) => o.setName('user1').setDescription('First person').setRequired(true))
    .addUserOption((o) => o.setName('user2').setDescription('Second person (default: you)')),
  async execute(interaction) {
    const u1 = interaction.options.getUser('user1');
    const u2 = interaction.options.getUser('user2') || interaction.user;
    if (u1.id === u2.id) return interaction.reply({ content: 'Pick two different people to ship!', flags: EPH });
    const pct = pairScore(u1.id, u2.id);
    const t = tier(C.shipTiers, pct);
    const e = embed(COLORS.pink)
      .setTitle(`💘 ${shipName(u1.displayName, u2.displayName)}`)
      .setDescription(`${u1} ${u2}\n\n${bar(pct)}\n**${pct}%** - ${t.title}\n${t.text}`);
    return interaction.reply({ embeds: [e] });
  },
};

const lovemeter = {
  data: command('lovemeter', 'Love calculator for any two names')
    .addStringOption((o) => o.setName('name1').setDescription('First name').setRequired(true).setMaxLength(40))
    .addStringOption((o) => o.setName('name2').setDescription('Second name').setRequired(true).setMaxLength(40)),
  async execute(interaction) {
    const n1 = interaction.options.getString('name1');
    const n2 = interaction.options.getString('name2');
    const pct = pairScore(n1, n2);
    const t = tier(C.shipTiers, pct);
    const e = embed(COLORS.purple)
      .setTitle('💖 Love meter')
      .setDescription(`**${n1}** **${n2}**\n\n${bar(pct)}\n**${pct}%** - ${t.title}\n${t.text}`);
    return interaction.reply({ embeds: [e], allowedMentions: { parse: [] } });
  },
};

const signChoices = C.zodiac.map((z) => ({ name: `${z.emoji} ${z.name}`, value: z.id }));
const zodiac = {
  data: command('zodiac', 'Zodiac love compatibility')
    .addStringOption((o) => o.setName('sign1').setDescription('Your sign').setRequired(true).addChoices(...signChoices))
    .addStringOption((o) => o.setName('sign2').setDescription('Their sign').setRequired(true).addChoices(...signChoices)),
  async execute(interaction) {
    const a = C.zodiac.find((z) => z.id === interaction.options.getString('sign1'));
    const b = C.zodiac.find((z) => z.id === interaction.options.getString('sign2'));
    const ia = C.zodiac.indexOf(a);
    const ib = C.zodiac.indexOf(b);
    let base = 55;
    if (a.element === b.element) base = 85;
    else if (
      (a.element === 'fire' && b.element === 'air') || (a.element === 'air' && b.element === 'fire') ||
      (a.element === 'earth' && b.element === 'water') || (a.element === 'water' && b.element === 'earth')
    ) base = 80;
    if (Math.abs(ia - ib) === 6) base = Math.max(base, 70); // opposites attract
    const pct = Math.min(100, base + (ia * 3 + ib * 5) % 11);
    const t = tier(C.shipTiers, pct);
    const e = embed(COLORS.purple)
      .setTitle(`${a.emoji} ${a.name} + ${b.name} ${b.emoji}`)
      .setDescription(`${bar(pct)}\n**${pct}%** - ${t.title}\n${t.text}`);
    return interaction.reply({ embeds: [e] });
  },
};

const crush = {
  data: command('crush', 'Secret crush list (revealed only if it is mutual)')
    .addSubcommand((s) =>
      s.setName('add').setDescription('Add a secret crush')
        .addUserOption((o) => o.setName('user').setDescription('Your crush').setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName('remove').setDescription('Remove a crush')
        .addUserOption((o) => o.setName('user').setDescription('Who?').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('See your crush list (only you)')),
  async execute(interaction) {
    const actor = interaction.user;
    const me = store.user(actor.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const list = me.crushes.length ? me.crushes.map((id) => `• ${mention(id)}`).join('\n') : 'Nobody yet. Use `/crush add`!';
      return interaction.reply({ embeds: [embed(COLORS.pink).setTitle('💘 Your secret crushes').setDescription(list)], flags: EPH });
    }

    const target = interaction.options.getUser('user');
    if (sub === 'remove') {
      me.crushes = me.crushes.filter((x) => x !== target.id);
      store.save();
      return interaction.reply({ content: `Removed ${mention(target.id)} from your crushes.`, flags: EPH });
    }

    if (!(await guardTarget(interaction, target, { selfMsg: 'Self-love is great, but pick someone else!', botMsg: 'Bots are unavailable' }))) return;
    if (me.crushes.includes(target.id)) return interaction.reply({ content: 'They are already on your list', flags: EPH });
    if (me.crushes.length >= 3) return interaction.reply({ content: 'You can only have **3** secret crushes. Remove one first.', flags: EPH });

    me.crushes.push(target.id);
    store.save();

    if (store.user(target.id).crushes.includes(actor.id)) {
      award(actor.id, B.love.crushMatch);
      award(target.id, B.love.crushMatch);
      const e = embed(COLORS.pink)
        .setTitle('💘 It is mutual')
        .setDescription(`${actor} and ${target} both have a crush on each other!\n\nEach received **+${B.love.crushMatch} LP**. Maybe use \`/date\`?`);
      return interaction.reply({ content: `${actor} ${target}`, embeds: [e] });
    }
    return interaction.reply({ content: `Added ${mention(target.id)} to your secret crushes. They will only find out if they crush on you too!`, flags: EPH });
  },
};

// Anonymous admirer: preset style + short optional note, delivered by DM, with a one-click block.
const styleChoices = Object.keys(C.admirerStyles).map((k) => ({ name: `${C.admirerStyles[k].emoji} ${k}`, value: k }));
const admirer = {
  data: command('admirer', 'Send an anonymous admirer message by DM')
    .addUserOption((o) => o.setName('user').setDescription('Who gets it?').setRequired(true))
    .addStringOption((o) => o.setName('style').setDescription('What to send').setRequired(true).addChoices(...styleChoices))
    .addStringOption((o) => o.setName('note').setDescription('A short sweet note (optional)').setMaxLength(100)),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (target.bot || target.id === actor.id) {
      return interaction.reply({ content: 'Pick a real person other than yourself', flags: EPH });
    }
    const wait = cooldown(actor.id, 'admirer', 10 * 60 * 1000);
    if (wait) return interaction.reply({ content: `Slow down, cupid! Try again in ${fmtDur(wait)}`, flags: EPH });

    const t = store.user(target.id);
    // Never reveal blocks / opt-outs: the sender just sees a generic delivery failure.
    const fail = { content: "Couldn't deliver that. They may have DMs closed or admirer messages off.", flags: EPH };
    if (isBlocked(actor.id, target.id) || !t.admirers) return interaction.reply(fail);

    const style = C.admirerStyles[interaction.options.getString('style')];
    const note = interaction.options.getString('note');
    const token = crypto.randomBytes(8).toString('hex');
    const db = store.db();
    db.admirers[token] = { from: actor.id, to: target.id, at: Date.now() };
    const keys = Object.keys(db.admirers);
    if (keys.length > 1000) for (const k of keys.slice(0, keys.length - 1000)) delete db.admirers[k];
    store.save();

    const e = embed(COLORS.pink)
      .setTitle(`${style.emoji} Secret admirer`)
      .setDescription(`${style.line}${note ? `\n\n> ${note}` : ''}\n\nNot into it? Use the button below to block this sender.`);
    try {
      await target.send({
        embeds: [e],
        components: [row(button(`ab:${token}`, 'Block this sender', ButtonStyle.Danger, ''))],
      });
    } catch {
      delete db.admirers[token];
      return interaction.reply(fail);
    }
    return interaction.reply({ content: `${style.emoji} Delivered anonymously!`, flags: EPH });
  },
};

// Handles the "Block this sender" button inside the admirer DM (called from index.js).
async function handleAdmirerButton(i) {
  const token = i.customId.split(':')[1];
  const db = store.db();
  const rec = db.admirers[token];
  if (!rec || rec.to !== i.user.id) {
    return i.reply({ content: 'This option has expired.', flags: EPH });
  }
  const me = store.user(i.user.id);
  if (!me.blocked.includes(rec.from)) me.blocked.push(rec.from);
  store.save();
  return i.update({ components: [], embeds: i.message.embeds, content: 'Sender blocked. They cannot send you anything through this bot anymore.' });
}

const loveletter = {
  data: command('loveletter', 'Write someone a love letter')
    .addUserOption((o) => o.setName('user').setDescription('Who is it for?').setRequired(true))
    .addStringOption((o) => o.setName('message').setDescription('Your message').setRequired(true).setMaxLength(500)),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (!(await guardTarget(interaction, target, { selfMsg: 'A letter to yourself? Aww, ok... but not here' }))) return;
    const msg = interaction.options.getString('message');
    const e = embed(COLORS.pink)
      .setTitle('💌 A love letter')
      .setDescription(`Dear ${target},\n\n${msg}\n\nWith love,\n**${actor.displayName}**`);
    const me = store.user(actor.id);
    me.stats.letters += 1;
    const notes = [];
    if (!cooldown(actor.id, 'letterLp', B.actions.letterCooldownMs)) {
      award(actor.id, B.actions.letterLp);
      notes.push(`+${B.actions.letterLp} LP`);
    }
    if (me.rel && me.rel.partner === target.id) addCoupleXp(actor.id, target.id, 6);
    store.save();
    return interaction.reply({ content: `${target}`, embeds: [e] });
  },
};

const poem = {
  data: command('poem', 'Get a love poem (for someone, or yourself)')
    .addUserOption((o) => o.setName('user').setDescription('Who is it for?')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const text = pick(C.poems)
      .replaceAll('{n}', target.displayName)
      .replaceAll('{a}', pick(C.poemAdjectives));
    return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`A poem for ${target.displayName}`).setDescription(text)], content: target.id === interaction.user.id ? undefined : `${target}` });
  },
};

const compliment = {
  data: command('compliment', 'Give someone a compliment')
    .addUserOption((o) => o.setName('user').setDescription('Who deserves it?')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    if (target.id !== interaction.user.id && !(await guardTarget(interaction, target))) return;
    const e = embed(COLORS.gold).setTitle('Compliment').setDescription(`${target}, ${pick(C.compliments)}`);
    return interaction.reply({ embeds: [e] });
  },
};

const lovequote = {
  data: command('lovequote', 'Get a random love quote'),
  async execute(interaction) {
    return interaction.reply({ embeds: [embed(COLORS.purple).setTitle('Love quote').setDescription(`*${pick(C.quotes)}*`)] });
  },
};

const flirt = {
  data: command('flirt', 'Try flirting with someone').addUserOption((o) =>
    o.setName('user').setDescription('Who are you flirting with?').setRequired(true)
  ),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (!(await guardTarget(interaction, target, { selfMsg: 'Flirting with the mirror again?', botMsg: 'The bot is flattered but unavailable' }))) return;
    const wait = cooldown(actor.id, 'flirt', 5 * 60 * 1000);
    if (wait) return interaction.reply({ content: `Give them a break! Try again in ${fmtDur(wait)}`, flags: EPH });

    const me = store.user(actor.id);
    me.stats.flirts += 1;
    const isPartner = me.rel && me.rel.partner === target.id;
    let usedArrow = false;
    let success = isPartner || chance(0.5);
    if (!success && me.inv.cupid) {
      me.inv.cupid -= 1;
      if (me.inv.cupid <= 0) delete me.inv.cupid;
      usedArrow = true;
      success = true;
    }

    if (success) {
      award(actor.id, B.love.flirt[0]);
      award(target.id, B.love.flirt[1]);
      if (isPartner) addCoupleXp(actor.id, target.id, 8);
      const e = embed(COLORS.pink)
        .setTitle('💘 Flirt success')
        .setDescription(`${actor} to ${target}:\n\n*${pick(C.pickupLines)}*${usedArrow ? '\n\nCupid\'s Arrow was used!' : ''}`);
      let content = `${target}`;
      if (me.rel && me.rel.partner !== target.id) content += ` ${mention(me.rel.partner)} (heads up, ${actor.displayName} is flirting with someone else!)`;
      return interaction.reply({ content, embeds: [e] });
    }
    const e = embed(COLORS.grey)
      .setTitle('💔 Flirt failed')
      .setDescription(`${actor} ${pick(C.flirtFails)}\n\n*Buy a Cupid's Arrow in the /shop for guaranteed success.*`);
    return interaction.reply({ embeds: [e] });
  },
};

module.exports = {
  commands: [ship, lovemeter, zodiac, crush, admirer, loveletter, poem, compliment, lovequote, flirt],
  handleAdmirerButton,
};
