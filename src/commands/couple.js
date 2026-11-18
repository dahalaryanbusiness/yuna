// Commands for people in a relationship: daily affection, vows, memories, bucket list,
// date outings, arguments and apologies, pet names, timeline and achievements.
const store = require('../store');
const B = require('../data/balance');
const X = require('../data/extra');
const { ask } = require('../lib/interactive');
const { partnerId, needPartner, waiting, spend } = require('../lib/couple');
const {
  COLORS, EPH, command, embed, pick, rand, mention, award, addCoupleXp, getCouple,
  coupleKey, levelInfo, daysSince, unix, fmtDur, num,
} = require('../lib/util');

const REL = { dating: 'Dating', engaged: 'Engaged', married: 'Married' };

// ---- goodmorning / goodnight -------------------------------------------
function greeting(name, title, lines, key) {
  return {
    data: command(name, `Send your partner a ${title.toLowerCase()} message`).addStringOption((o) =>
      o.setName('message').setDescription('Add your own words (optional)').setMaxLength(150)
    ),
    async execute(interaction) {
      const p = await needPartner(interaction);
      if (!p) return;
      if (await waiting(interaction, key, 12 * 3600 * 1000)) return;
      const actor = interaction.user;
      const custom = interaction.options.getString('message');
      const pet = store.user(actor.id).petName;
      addCoupleXp(actor.id, p, 3);
      award(actor.id, 1); // hard mode: was 3
      const e = embed(COLORS.pink)
        .setTitle(title)
        .setDescription(`${actor} to ${pet ? `**${pet}**` : mention(p)}:\n\n*${custom || pick(lines)}*`);
      return interaction.reply({ content: `${mention(p)}`, embeds: [e] });
    },
  };
}
const goodmorning = greeting('goodmorning', 'Good morning', X.morningLines, 'gm');
const goodnight = greeting('goodnight', 'Good night', X.nightLines, 'gn');

// ---- vows ----------------------------------------------------------------
const vow = {
  data: command('vow', 'Write or read your wedding vows')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Write your vow to your fiance(e) or spouse')
        .addStringOption((o) => o.setName('text').setDescription('Your vow').setRequired(true).setMaxLength(300))
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('Read the vows of a couple')
        .addUserOption((o) => o.setName('user').setDescription('Whose vows? (default: you)'))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const me = store.user(interaction.user.id);
    if (sub === 'set') {
      if (!me.rel || me.rel.type === 'dating') {
        return interaction.reply({ content: 'Vows are for engaged or married couples. Use `/propose` first.', flags: EPH });
      }
      const c = getCouple(interaction.user.id, me.rel.partner);
      c.vows ||= {};
      c.vows[interaction.user.id] = interaction.options.getString('text', true);
      store.save();
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle('Vow saved').setDescription('Your partner can read it with `/vow view`.')], flags: EPH });
    }
    const who = interaction.options.getUser('user') || interaction.user;
    const u = store.user(who.id);
    if (!u.rel) return interaction.reply({ content: `${mention(who.id)} is not in a relationship.`, flags: EPH });
    const c = getCouple(who.id, u.rel.partner);
    const ids = [who.id, u.rel.partner];
    const fields = ids.map((id) => ({
      name: `Vow from ${mention(id)}`,
      value: c.vows && c.vows[id] ? `*${c.vows[id]}*` : 'Not written yet',
    }));
    return interaction.reply({ embeds: [embed(COLORS.gold).setTitle('Wedding vows').addFields(fields)] });
  },
};

// ---- shared memories -----------------------------------------------------
const memory = {
  data: command('memory', 'Keep a shared scrapbook of your favorite moments')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Save a memory')
        .addStringOption((o) => o.setName('text').setDescription('What happened?').setRequired(true).setMaxLength(200))
    )
    .addSubcommand((s) => s.setName('list').setDescription('See your memories'))
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a memory by number')
        .addIntegerOption((o) => o.setName('number').setDescription('Memory number').setRequired(true).setMinValue(1))
    ),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const actor = interaction.user;
    const c = getCouple(actor.id, p);
    c.memories ||= [];
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      if (c.memories.length >= 25) return interaction.reply({ content: 'Your scrapbook is full (25). Remove one first.', flags: EPH });
      c.memories.push({ text: interaction.options.getString('text', true), by: actor.id, at: Date.now() });
      let note = '';
      if (!(require('../lib/util').cooldown(actor.id, 'memoryXp', 10 * 60 * 1000))) {
        addCoupleXp(actor.id, p, 5);
        note = '\n\nCouple XP +5';
      }
      store.save();
      return interaction.reply({ embeds: [embed(COLORS.pink).setTitle('Memory saved').setDescription(`Added as memory **#${c.memories.length}**.${note}`)] });
    }
    if (sub === 'remove') {
      const n = interaction.options.getInteger('number', true);
      if (n > c.memories.length) return interaction.reply({ content: 'No memory with that number.', flags: EPH });
      c.memories.splice(n - 1, 1);
      store.save();
      return interaction.reply({ content: 'Memory removed.', flags: EPH });
    }
    const lines = c.memories.map((m, i) => `**${i + 1}.** ${m.text}\n<t:${unix(m.at)}:D> by ${mention(m.by)}`);
    return interaction.reply({
      embeds: [embed(COLORS.pink).setTitle('Our memories').setDescription(lines.length ? lines.join('\n\n') : 'Nothing saved yet. Use `/memory add`.')],
    });
  },
};

// ---- bucket list ---------------------------------------------------------
const bucketlist = {
  data: command('bucketlist', 'Plan goals to achieve together')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a goal')
        .addStringOption((o) => o.setName('goal').setDescription('Something to do together').setRequired(true).setMaxLength(120))
    )
    .addSubcommand((s) =>
      s
        .setName('done')
        .setDescription('Mark a goal as completed')
        .addIntegerOption((o) => o.setName('number').setDescription('Goal number').setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a goal')
        .addIntegerOption((o) => o.setName('number').setDescription('Goal number').setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) => s.setName('list').setDescription('See your bucket list')),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const actor = interaction.user;
    const c = getCouple(actor.id, p);
    c.bucket ||= [];
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      if (c.bucket.length >= 20) return interaction.reply({ content: 'Your bucket list is full (20).', flags: EPH });
      c.bucket.push({ text: interaction.options.getString('goal', true), done: false, by: actor.id });
      store.save();
      return interaction.reply({ embeds: [embed(COLORS.pink).setTitle('Goal added').setDescription(`Goal **#${c.bucket.length}** is on your list.`)] });
    }
    if (sub === 'done' || sub === 'remove') {
      const n = interaction.options.getInteger('number', true);
      const g = c.bucket[n - 1];
      if (!g) return interaction.reply({ content: 'No goal with that number.', flags: EPH });
      if (sub === 'remove') {
        c.bucket.splice(n - 1, 1);
        store.save();
        return interaction.reply({ content: 'Goal removed.', flags: EPH });
      }
      if (g.done) return interaction.reply({ content: 'That goal is already completed.', flags: EPH });
      g.done = true;
      award(actor.id, B.love.bucketGoalLp);
      award(p, B.love.bucketGoalLp);
      addCoupleXp(actor.id, p, 20);
      store.save();
      return interaction.reply({
        content: `${mention(p)}`,
        embeds: [embed(COLORS.gold).setTitle('Goal completed').setDescription(`**${g.text}**\n\nEach of you earned ${B.love.bucketGoalLp} LP, and your couple earned 20 XP.`)],
      });
    }
    const lines = c.bucket.map((g, i) => `**${i + 1}.** ${g.done ? '~~' + g.text + '~~ (completed)' : g.text}`);
    const done = c.bucket.filter((g) => g.done).length;
    return interaction.reply({
      embeds: [embed(COLORS.pink).setTitle('Our bucket list').setDescription(lines.length ? lines.join('\n') : 'Empty. Add a goal with `/bucketlist add`.').addFields({ name: 'Progress', value: `${done} of ${c.bucket.length} completed` })],
    });
  },
};

// ---- conversation starter ------------------------------------------------
const conversation = {
  data: command('conversation', 'Get a meaningful question to ask your partner'),
  async execute(interaction) {
    const p = partnerId(interaction.user.id);
    let note = '';
    if (p && !(require('../lib/util').cooldown(interaction.user.id, 'convoXp', 10 * 60 * 1000))) {
      addCoupleXp(interaction.user.id, p, 3);
      note = '\n\nCouple XP +3';
    }
    const e = embed(COLORS.purple).setTitle('Conversation starter').setDescription(`**${pick(X.conversationStarters)}**${note}`);
    return interaction.reply({ content: p ? `${mention(p)}` : undefined, embeds: [e] });
  },
};

// ---- date outings --------------------------------------------------------
const dateout = {
  data: command('dateout', 'Take your partner out (costs Love Points)').addStringOption((o) =>
    o
      .setName('plan')
      .setDescription('Where are you going?')
      .setRequired(true)
      .addChoices(...X.dateOuts.map((d) => ({ name: `${d.name} (${d.cost} LP)`, value: d.id })))
  ),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const actor = interaction.user;
    const plan = X.dateOuts.find((d) => d.id === interaction.options.getString('plan', true));
    if (store.user(actor.id).lp < plan.cost) {
      return interaction.reply({ content: `You need ${plan.cost} LP for ${plan.name.toLowerCase()}.`, flags: EPH });
    }
    if (await waiting(interaction, 'dateout', 60 * 60 * 1000)) return;
    spend(actor.id, plan.cost);
    const xp = Math.round(plan.cost / 2) + 10;
    const back = Math.round(plan.cost / 3);
    addCoupleXp(actor.id, p, xp);
    award(actor.id, back);
    award(p, back);
    store.db().users[actor.id].stats.dates += 1;
    store.save();
    const e = embed(COLORS.pink)
      .setTitle(plan.name)
      .setDescription(`${actor} and ${mention(p)} ${plan.line}.`)
      .addFields(
        { name: 'Cost', value: `${plan.cost} LP`, inline: true },
        { name: 'Couple XP', value: `+${xp}`, inline: true },
        { name: 'Each earned', value: `+${back} LP`, inline: true }
      );
    return interaction.reply({ content: `${mention(p)}`, embeds: [e] });
  },
};

// ---- surprise ------------------------------------------------------------
const surprise = {
  data: command('surprise', 'Surprise your partner (costs 20 LP)'),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const actor = interaction.user;
    if (store.user(actor.id).lp < 20) return interaction.reply({ content: 'A surprise costs 20 LP.', flags: EPH });
    if (await waiting(interaction, 'surprise', 60 * 60 * 1000)) return;
    spend(actor.id, 20);
    addCoupleXp(actor.id, p, 10);
    const e = embed(COLORS.gold).setTitle('A surprise').setDescription(`${actor} ${pick(X.surprises)} for ${mention(p)}.\n\nCouple XP +10`);
    return interaction.reply({ content: `${mention(p)}`, embeds: [e] });
  },
};

// ---- arguments and apologies --------------------------------------------
const argue = {
  data: command('argue', 'Have an argument with your partner (costs couple XP)'),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    if (await waiting(interaction, 'argue', 30 * 60 * 1000)) return;
    const c = getCouple(interaction.user.id, p);
    c.tension = true;
    addCoupleXp(interaction.user.id, p, -8);
    const e = embed(COLORS.red)
      .setTitle('An argument')
      .setDescription(`${interaction.user} and ${mention(p)} ${pick(X.argueTopics)}.\n\nCouple XP -8. Use \`/apologize\` to make peace.`);
    return interaction.reply({ content: `${mention(p)}`, embeds: [e] });
  },
};

const apologize = {
  data: command('apologize', 'Apologize to your partner').addStringOption((o) =>
    o.setName('message').setDescription('Say it in your own words (optional)').setMaxLength(200)
  ),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const actor = interaction.user;
    if (await waiting(interaction, 'apologize', 10 * 60 * 1000)) return;
    const text = interaction.options.getString('message') || pick(X.apologyLines);
    const e = embed(COLORS.purple).setTitle('An apology').setDescription(`${actor} to ${mention(p)}:\n\n*${text}*`);
    return ask(interaction, {
      to: p,
      content: `${mention(p)}`,
      embeds: [e],
      yes: 'Forgive',
      no: 'Not yet',
      expiredText: 'The apology went unanswered.',
      onYes: async (i) => {
        const c = getCouple(actor.id, p);
        const wasTense = Boolean(c.tension);
        c.tension = false;
        addCoupleXp(actor.id, p, wasTense ? 12 : 3);
        award(actor.id, 2);
        award(p, 2);
        return i.update({
          content: `${actor} ${mention(p)}`,
          embeds: [embed(COLORS.pink).setTitle('Forgiven').setDescription(`${mention(p)} accepted the apology. You are closer than before.\n\nCouple XP +${wasTense ? 12 : 3}, each of you earned 5 LP.`)],
          components: [],
        });
      },
      onNo: (i) =>
        i.update({
          content: '',
          embeds: [embed(COLORS.grey).setTitle('Needs more time').setDescription(`${mention(p)} is not ready yet. Give them space, then try again.`)],
          components: [],
        }),
    });
  },
};

// ---- pet names -----------------------------------------------------------
const nickname = {
  data: command('nickname', 'Set a pet name for your partner').addStringOption((o) =>
    o.setName('name').setDescription('What do you call them? Leave empty to clear').setMaxLength(24)
  ),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const name = interaction.options.getString('name');
    const me = store.user(interaction.user.id);
    me.petName = name ? name.trim() : '';
    store.save();
    return interaction.reply({
      content: name ? `You now call ${mention(p)} **${name.trim()}**.` : 'Pet name cleared.',
      flags: EPH,
    });
  },
};

// ---- timeline ------------------------------------------------------------
const timeline = {
  data: command('timeline', 'See the story of your relationships').addUserOption((o) =>
    o.setName('user').setDescription('Whose timeline? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots have no love story yet.', flags: EPH });
    const h = store.user(who.id).history || [];
    const text = {
      dating: (e) => `Started dating ${mention(e.partner)}`,
      engaged: (e) => `Got engaged to ${mention(e.partner)}`,
      married: (e) => `Married ${mention(e.partner)}`,
      ended: (e) => `Relationship with ${mention(e.partner)} ended`,
    };
    const lines = h.slice(0, 12).map((e) => `<t:${unix(e.at)}:D>  ${(text[e.type] || (() => 'Event'))(e)}`);
    return interaction.reply({
      embeds: [embed(COLORS.pink).setTitle(`${who.displayName}'s love story`).setDescription(lines.length ? lines.join('\n') : 'No story yet. It starts with `/date`.')],
    });
  },
};

// ---- achievements --------------------------------------------------------
const achievements = {
  data: command('achievements', 'See the milestones your relationship has reached'),
  async execute(interaction) {
    const p = await needPartner(interaction);
    if (!p) return;
    const me = store.user(interaction.user.id);
    const c = getCouple(interaction.user.id, p);
    const pair = store.db().pairs[coupleKey(interaction.user.id, p)] || {};
    const days = daysSince(me.rel.startedAt);
    const lv = levelInfo(c.xp || 0).level;
    const done = (c.bucket || []).filter((g) => g.done).length;
    const list = [
      ['First kiss', (pair.kiss || 0) >= 1],
      ['Fifty kisses', (pair.kiss || 0) >= 50],
      ['One hundred hugs', (pair.hug || 0) >= 100],
      ['One week together', days >= 7],
      ['One month together', days >= 30],
      ['One hundred days together', days >= 100],
      ['One year together', days >= 365],
      ['Couple level 5', lv >= 5],
      ['Couple level 10', lv >= 10],
      ['Engaged', me.rel.type === 'engaged' || me.rel.type === 'married'],
      ['Married', me.rel.type === 'married'],
      ['Five shared memories', (c.memories || []).length >= 5],
      ['Three bucket list goals completed', done >= 3],
      ['Ten date nights', me.stats.dates >= 10],
    ];
    const total = list.filter((x) => x[1]).length;
    const lines = list.map(([name, ok]) => (ok ? `**Completed**  ${name}` : `Locked  ${name}`));
    return interaction.reply({
      embeds: [embed(COLORS.gold).setTitle('Relationship achievements').setDescription(`${mention(interaction.user.id)} and ${mention(p)}\n\n${lines.join('\n')}`).addFields({ name: 'Progress', value: `${total} of ${list.length} completed` })],
    });
  },
};

// ---- healing -------------------------------------------------------------
const moveon = {
  data: command('moveon', 'Heal faster after a breakup (costs 50 LP)'),
  async execute(interaction) {
    const me = store.user(interaction.user.id);
    if (me.healUntil <= Date.now()) return interaction.reply({ content: 'You are not healing from anything right now.', flags: EPH });
    if (me.lp < 50) return interaction.reply({ content: 'Moving on costs 50 LP.', flags: EPH });
    spend(interaction.user.id, 50);
    me.healUntil = 0;
    store.save();
    return interaction.reply({ embeds: [embed(COLORS.green).setTitle('A fresh start').setDescription('You have healed and are ready to date again.')] });
  },
};

const closure = {
  data: command('closure', 'Write a private closure letter to someone from your past')
    .addStringOption((o) => o.setName('letter').setDescription('What do you need to say?').setRequired(true).setMaxLength(500))
    .addUserOption((o) => o.setName('user').setDescription('Who is it for? (only shown to you)')),
  async execute(interaction) {
    const me = store.user(interaction.user.id);
    const user = interaction.options.getUser('user');
    let note = 'Writing it down is a healthy first step.';
    if (me.healUntil > Date.now() && !(require('../lib/util').cooldown(interaction.user.id, 'closure', 60 * 60 * 1000))) {
      me.healUntil = Math.max(Date.now(), me.healUntil - 10 * 60 * 1000);
      store.save();
      note = 'Your healing time was reduced by 10 minutes.';
    }
    const e = embed(COLORS.grey)
      .setTitle('Closure letter')
      .setDescription(`${user ? `To ${mention(user.id)}:\n\n` : ''}*${interaction.options.getString('letter', true)}*\n\n${note}`);
    return interaction.reply({ embeds: [e], flags: EPH });
  },
};

module.exports = {
  commands: [goodmorning, goodnight, vow, memory, bucketlist, conversation, dateout, surprise, argue, apologize, nickname, timeline, achievements, moveon, closure],
};
