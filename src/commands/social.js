// Social and personal commands: love notes, inbox, love language, wishlist, birthdays,
// dating status, valentine requests, song dedications and ways to earn Love Points.
const store = require('../store');
const B = require('../data/balance');
const C = require('../data/content');
const X = require('../data/extra');
const { ask } = require('../lib/interactive');
const { waiting } = require('../lib/couple');
const {
  COLORS, EPH, command, embed, pick, rand, mention, award, guardTarget, hash, unix, num, fmtDur,
  cooldown, bar,
} = require('../lib/util');

// ---- love notes ----------------------------------------------------------
const lovenote = {
  data: command('lovenote', 'Leave a short note in someone\'s inbox')
    .addUserOption((o) => o.setName('user').setDescription('Who is it for?').setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Your note').setRequired(true).setMaxLength(200))
    .addBooleanOption((o) => o.setName('anonymous').setDescription('Hide your name?')),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    if (!(await guardTarget(interaction, target, { selfMsg: 'Write a note to someone else.', botMsg: 'Bots cannot read notes.' }))) return;
    if (await waiting(interaction, 'lovenote', 5 * 60 * 1000)) return;
    const anon = interaction.options.getBoolean('anonymous') || false;
    const them = store.user(target.id);
    them.notes.unshift({ from: anon ? null : interaction.user.id, text: interaction.options.getString('note', true), at: Date.now() });
    them.notes = them.notes.slice(0, 20);
    store.save();
    const e = embed(COLORS.pink)
      .setTitle('A love note')
      .setDescription(`${anon ? 'Someone' : interaction.user} left a note for ${target}.\n\n${target}, read it privately with \`/inbox\`.`);
    return interaction.reply({ content: `${target}`, embeds: [e] });
  },
};

const inbox = {
  data: command('inbox', 'Read the love notes sent to you (only you can see it)').addBooleanOption((o) =>
    o.setName('clear').setDescription('Delete all notes after reading?')
  ),
  async execute(interaction) {
    const me = store.user(interaction.user.id);
    const lines = me.notes.map((n, i) => `**${i + 1}.** ${n.text}\nFrom ${n.from ? mention(n.from) : 'someone anonymous'} on <t:${unix(n.at)}:D>`);
    const e = embed(COLORS.pink).setTitle('Your inbox').setDescription(lines.length ? lines.join('\n\n') : 'No notes yet.');
    if (interaction.options.getBoolean('clear')) {
      me.notes = [];
      store.save();
    }
    return interaction.reply({ embeds: [e], flags: EPH });
  },
};

// ---- love language -------------------------------------------------------
const langChoices = Object.entries(X.loveLanguages).map(([value, l]) => ({ name: l.name, value }));
const lovelanguage = {
  data: command('lovelanguage', 'Share how you like to give and receive love')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Choose your love language')
        .addStringOption((o) => o.setName('language').setDescription('Your love language').setRequired(true).addChoices(...langChoices))
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('See someone\'s love language')
        .addUserOption((o) => o.setName('user').setDescription('Whose? (default: you)'))
    )
    .addSubcommand((s) =>
      s
        .setName('match')
        .setDescription('Compare your love language with someone')
        .addUserOption((o) => o.setName('user').setDescription('Who?').setRequired(true))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const me = store.user(interaction.user.id);
    if (sub === 'set') {
      me.loveLanguage = interaction.options.getString('language', true);
      store.save();
      const l = X.loveLanguages[me.loveLanguage];
      return interaction.reply({ embeds: [embed(COLORS.pink).setTitle(l.name).setDescription(`Saved. ${l.tip}`)], flags: EPH });
    }
    if (sub === 'view') {
      const who = interaction.options.getUser('user') || interaction.user;
      const l = X.loveLanguages[store.user(who.id).loveLanguage];
      if (!l) return interaction.reply({ content: `${mention(who.id)} has not chosen a love language yet.`, flags: EPH });
      return interaction.reply({ embeds: [embed(COLORS.pink).setTitle(`${who.displayName}'s love language`).setDescription(`**${l.name}**\n\n${l.tip}`)] });
    }
    const other = interaction.options.getUser('user', true);
    if (other.bot) return interaction.reply({ content: 'Bots speak in code.', flags: EPH });
    const a = X.loveLanguages[me.loveLanguage];
    const b = X.loveLanguages[store.user(other.id).loveLanguage];
    if (!a || !b) return interaction.reply({ content: 'You both need to choose a love language with `/lovelanguage set` first.', flags: EPH });
    const same = me.loveLanguage === store.user(other.id).loveLanguage;
    const pct = same ? 100 : 55 + (hash([me.loveLanguage, store.user(other.id).loveLanguage].sort().join('|')) % 36);
    const e = embed(COLORS.purple)
      .setTitle('Love language match')
      .setDescription(`${interaction.user}: **${a.name}**\n${other}: **${b.name}**\n\n${bar(pct)} **${pct}%**\n\n${same ? 'You speak the same language. Keep it up.' : `Different languages are fine. Learn each other's: ${b.tip}`}`);
    return interaction.reply({ embeds: [e] });
  },
};

// ---- wishlist ------------------------------------------------------------
const itemChoices = C.shopItems.filter((i) => i.price > 0).slice(0, 25).map((i) => ({ name: i.name, value: i.id }));
const wishlist = {
  data: command('wishlist', 'Tell people which gifts you would love')
    .addSubcommand((s) =>
      s.setName('add').setDescription('Add a gift to your wishlist').addStringOption((o) => o.setName('item').setDescription('Which gift?').setRequired(true).addChoices(...itemChoices))
    )
    .addSubcommand((s) =>
      s.setName('remove').setDescription('Remove a gift').addStringOption((o) => o.setName('item').setDescription('Which gift?').setRequired(true).addChoices(...itemChoices))
    )
    .addSubcommand((s) =>
      s.setName('view').setDescription('See a wishlist').addUserOption((o) => o.setName('user').setDescription('Whose? (default: you)'))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const me = store.user(interaction.user.id);
    if (sub === 'add' || sub === 'remove') {
      const id = interaction.options.getString('item', true);
      if (sub === 'add') {
        if (!me.wishlist.includes(id)) me.wishlist.push(id);
      } else {
        me.wishlist = me.wishlist.filter((x) => x !== id);
      }
      store.save();
      return interaction.reply({ content: sub === 'add' ? 'Added to your wishlist.' : 'Removed from your wishlist.', flags: EPH });
    }
    const who = interaction.options.getUser('user') || interaction.user;
    const items = store.user(who.id).wishlist.map((id) => C.shopItems.find((i) => i.id === id)).filter(Boolean);
    const lines = items.map((i) => `${i.emoji} **${i.name}** (${num(i.price)} LP)`);
    return interaction.reply({
      embeds: [embed(COLORS.gold).setTitle(`${who.displayName}'s wishlist`).setDescription(lines.length ? `${lines.join('\n')}\n\nSend one with \`/gift\`.` : 'Nothing on the list yet.')],
    });
  },
};

// ---- dating status -------------------------------------------------------
const looking = {
  data: command('looking', 'Show on your profile whether you are open to dating').addBooleanOption((o) =>
    o.setName('open').setDescription('Are you open to dating?').setRequired(true)
  ),
  async execute(interaction) {
    const open = interaction.options.getBoolean('open', true);
    store.user(interaction.user.id).looking = open;
    store.save();
    return interaction.reply({ content: open ? 'Your profile now says you are open to dating.' : 'Your profile no longer shows that.', flags: EPH });
  },
};

// ---- birthdays -----------------------------------------------------------
function nextBirthday(mmdd) {
  const [m, d] = mmdd.split('-').map(Number);
  const now = new Date();
  let t = Date.UTC(now.getUTCFullYear(), m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (t < today) t = Date.UTC(now.getUTCFullYear() + 1, m - 1, d);
  return Math.round((t - today) / 86400000);
}
const fmtBirthday = (mmdd) => {
  const [m, d] = mmdd.split('-').map(Number);
  return `${X.months[m - 1]} ${d}`;
};

const birthday = {
  data: command('birthday', 'Set or see a birthday')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set your birthday')
        .addIntegerOption((o) => o.setName('month').setDescription('Month (1-12)').setRequired(true).setMinValue(1).setMaxValue(12))
        .addIntegerOption((o) => o.setName('day').setDescription('Day (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
    )
    .addSubcommand((s) =>
      s.setName('view').setDescription('See a birthday').addUserOption((o) => o.setName('user').setDescription('Whose? (default: you)'))
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'set') {
      const m = interaction.options.getInteger('month', true);
      const d = interaction.options.getInteger('day', true);
      const check = new Date(Date.UTC(2000, m - 1, d));
      if (check.getUTCMonth() !== m - 1) return interaction.reply({ content: 'That date does not exist.', flags: EPH });
      store.user(interaction.user.id).birthday = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      store.save();
      return interaction.reply({ content: `Birthday saved as ${fmtBirthday(store.user(interaction.user.id).birthday)}.`, flags: EPH });
    }
    const who = interaction.options.getUser('user') || interaction.user;
    const b = store.user(who.id).birthday;
    if (!b) return interaction.reply({ content: `${mention(who.id)} has not set a birthday.`, flags: EPH });
    const days = nextBirthday(b);
    const when = days === 0 ? 'It is today. Wish them well.' : `In ${days} day${days === 1 ? '' : 's'}.`;
    return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${who.displayName}'s birthday`).setDescription(`**${fmtBirthday(b)}**\n${when}`)] });
  },
};

// ---- valentine / dedication ---------------------------------------------
const valentine = {
  data: command('valentine', 'Ask someone to be your valentine').addUserOption((o) =>
    o.setName('user').setDescription('Who?').setRequired(true)
  ),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const actor = interaction.user;
    if (!(await guardTarget(interaction, target, { selfMsg: 'Ask someone else.', botMsg: 'Bots are taken.' }))) return;
    if (await waiting(interaction, 'valentine', 60 * 60 * 1000)) return;
    const e = embed(COLORS.pink).setTitle('Will you be my valentine?').setDescription(`${actor} is asking ${target} to be their valentine.`);
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'Yes',
      no: 'Maybe next time',
      expiredText: 'The valentine request expired.',
      onYes: (i) => {
        award(actor.id, B.love.valentine);
        award(target.id, B.love.valentine);
        return i.update({
          content: `${actor} ${target}`,
          embeds: [embed(COLORS.pink).setTitle('A valentine').setDescription(`${target} said yes to ${actor}. Each of you earned **${B.love.valentine} LP**.`)],
          components: [],
        });
      },
      onNo: (i) =>
        i.update({ content: '', embeds: [embed(COLORS.grey).setDescription(`${target} politely passed this time.`)], components: [] }),
    });
  },
};

const dedicate = {
  data: command('dedicate', 'Dedicate a song to someone')
    .addUserOption((o) => o.setName('user').setDescription('Who is it for?').setRequired(true))
    .addStringOption((o) => o.setName('song').setDescription('Song and artist').setRequired(true).setMaxLength(100))
    .addStringOption((o) => o.setName('message').setDescription('Say why (optional)').setMaxLength(200)),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    if (!(await guardTarget(interaction, target, { selfMsg: 'Dedicate it to someone else.', botMsg: 'Bots only hear bits.' }))) return;
    if (await waiting(interaction, 'dedicate', 2 * 60 * 1000)) return;
    const msg = interaction.options.getString('message');
    const e = embed(COLORS.purple)
      .setTitle('A song dedication')
      .setDescription(`${interaction.user} dedicated **${interaction.options.getString('song', true)}** to ${target}.${msg ? `\n\n*${msg}*` : ''}`);
    return interaction.reply({ content: `${target}`, embeds: [e] });
  },
};

// ---- earning Love Points -------------------------------------------------
module.exports = {
  commands: [lovenote, inbox, lovelanguage, wishlist, looking, birthday, valentine, dedicate],
};
