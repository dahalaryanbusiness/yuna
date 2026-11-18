// Dating, engagement, marriage, breakup, divorce, make-up and couple activities.
const store = require('../store');
const B = require('../data/balance');
const C = require('../data/content');
const { ask } = require('../lib/interactive');
const {
  COLORS, EPH, pick, rand, mention, command, embed, bar, fmtDur, daysSince, unix, num,
  cooldown, award, coupleKey, getCouple, addCoupleXp, levelInfo, guardTarget, logEvent,
} = require('../lib/util');

const HEAL_MS = 30 * 60 * 1000; // cooldown after a breakup before dating again
const RING_ID = 'ring';
const WEDDING_COST = B.love.weddingCost;
const DIVORCE_FEE = 100;
const MAKEUP_WINDOW_MS = 7 * 86400000;
const ICON = { dating: '💞', engaged: '💍', married: '💒' };
const LABEL = { dating: 'Dating', engaged: 'Engaged', married: 'Married' };

const relOf = (id) => store.user(id).rel;

function setRel(a, b, type) {
  const now = Date.now();
  const ua = store.user(a);
  const ub = store.user(b);
  const startedAt = ua.rel && ua.rel.partner === b ? ua.rel.startedAt : now;
  if (!ua.rel || ua.rel.partner !== b || ua.rel.type !== type) {
    logEvent(a, type, b);
    logEvent(b, type, a);
  }
  ua.rel = { type, partner: b, since: now, startedAt };
  ub.rel = { type, partner: a, since: now, startedAt };
  getCouple(a, b);
  store.save();
}

function endRel(a, b, by) {
  const now = Date.now();
  const ua = store.user(a);
  const ub = store.user(b);
  const type = ua.rel ? ua.rel.type : 'dating';
  logEvent(a, 'ended', b);
  logEvent(b, 'ended', a);
  ua.exes.unshift({ id: b, at: now, type, by });
  ub.exes.unshift({ id: a, at: now, type, by });
  ua.exes = ua.exes.slice(0, 20);
  ub.exes = ub.exes.slice(0, 20);
  ua.rel = null;
  ub.rel = null;
  ua.healUntil = ub.healUntil = now + HEAL_MS;
  delete store.db().couples[coupleKey(a, b)];
  store.save();
}

// Returns an error string if these two cannot start a new relationship, otherwise null.
function whyNotSingle(actorId, targetId, { ignoreHeal = false } = {}) {
  const a = store.user(actorId);
  const t = store.user(targetId);
  if (a.rel) return `You are already ${LABEL[a.rel.type].toLowerCase()} with ${mention(a.rel.partner)}! Use /breakup first.`;
  if (t.rel) return `${mention(targetId)} is already taken`;
  if (!ignoreHeal) {
    if (a.healUntil > Date.now()) return `You are still healing from your last breakup (${fmtDur(a.healUntil - Date.now())} left).`;
    if (t.healUntil > Date.now()) return `${mention(targetId)} is still healing from a breakup (${fmtDur(t.healUntil - Date.now())} left).`;
  }
  return null;
}

function partnerCheck(interaction, target, wanted) {
  const r = relOf(interaction.user.id);
  if (!r || r.partner !== target.id) return `${mention(target.id)} is not your partner.`;
  if (r.type !== wanted) return `You need to be **${wanted}** with ${mention(target.id)} for that (you are ${r.type}).`;
  return null;
}

const date = {
  data: command('date', 'Ask someone to be your partner').addUserOption((o) =>
    o.setName('user').setDescription('Who do you want to date?').setRequired(true)
  ),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const actor = interaction.user;
    if (!(await guardTarget(interaction, target, { selfMsg: 'Self-love is great, but pick someone else to date!', botMsg: 'Bots are married to the code' }))) return;
    const err = whyNotSingle(actor.id, target.id);
    if (err) return interaction.reply({ content: err, flags: EPH });

    const e = embed(COLORS.pink)
      .setTitle('💞 Will you go out with me?')
      .setDescription(`${actor} is asking ${target} to be their partner!\n\n${target}, do you accept?`);
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'Yes, I do!',
      no: 'No thanks',
      expiredText: `${actor.displayName}'s question expired with no answer...`,
      onYes: async (i) => {
        const again = whyNotSingle(actor.id, target.id);
        if (again) return i.update({ content: again, embeds: [], components: [] });
        setRel(actor.id, target.id, 'dating');
        award(actor.id, B.love.dateReward);
        award(target.id, B.love.dateReward);
        const done = embed(COLORS.pink)
          .setTitle('💞 New couple')
          .setDescription(`${actor} and ${target} are now **dating**!\n\nEach of you received **+${B.love.dateReward} LP**. Try /datenight, /cuddle and /kiss to grow your couple level!`);
        return i.update({ content: `${actor} ${target}`, embeds: [done], components: [] });
      },
      onNo: (i) =>
        i.update({
          content: '',
          embeds: [embed(COLORS.grey).setDescription(`${target} politely said no to ${actor}. Chin up!`)],
          components: [],
        }),
    });
  },
};

const propose = {
  data: command('propose', 'Propose to your partner with a ring').addUserOption((o) =>
    o.setName('user').setDescription('Your partner').setRequired(true)
  ),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const actor = interaction.user;
    if (target.bot) return interaction.reply({ content: 'Bots are not the marrying type', flags: EPH });
    const err = partnerCheck(interaction, target, 'dating');
    if (err) return interaction.reply({ content: err, flags: EPH });
    if (!store.user(actor.id).inv[RING_ID]) {
      return interaction.reply({ content: 'You need a **Ring** first! Buy one with `/buy ring`.', flags: EPH });
    }

    const e = embed(COLORS.gold)
      .setTitle('💍 A proposal')
      .setDescription(`${actor} ${pick(C.proposalLines)} ${target}:\n\n**"Will you marry me?"**`);
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'Yes!',
      no: 'Not yet',
      yesEmoji: '',
      onYes: async (i) => {
        const a = store.user(actor.id);
        const r = a.rel;
        if (!r || r.partner !== target.id || r.type !== 'dating' || !a.inv[RING_ID]) {
          return i.update({ content: 'Something changed, the proposal is no longer valid.', embeds: [], components: [] });
        }
        a.inv[RING_ID] -= 1;
        if (a.inv[RING_ID] <= 0) delete a.inv[RING_ID];
        setRel(actor.id, target.id, 'engaged');
        award(actor.id, B.love.engagedReward);
        award(target.id, B.love.engagedReward);
        addCoupleXp(actor.id, target.id, 50);
        const done = embed(COLORS.gold)
          .setTitle('💍 They said yes')
          .setDescription(`${actor} and ${target} are now **engaged**!\n\nEach received **+${B.love.engagedReward} LP**. When you are ready, use \`/marry\` (costs ${WEDDING_COST} LP).`);
        return i.update({ content: `${actor} ${target}`, embeds: [done], components: [] });
      },
      onNo: (i) =>
        i.update({
          content: '',
          embeds: [embed(COLORS.grey).setDescription(`${target} is not ready yet. Your ring is safe with you, ${actor}.`)],
          components: [],
        }),
    });
  },
};

const marry = {
  data: command('marry', 'Marry your fiancé(e)').addUserOption((o) =>
    o.setName('user').setDescription('Your fiancé(e)').setRequired(true)
  ),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const actor = interaction.user;
    if (target.bot) return interaction.reply({ content: 'Bots are not the marrying type', flags: EPH });
    const err = partnerCheck(interaction, target, 'engaged');
    if (err) return interaction.reply({ content: err, flags: EPH });
    if (store.user(actor.id).lp < WEDDING_COST) {
      return interaction.reply({ content: `A wedding costs **${WEDDING_COST} LP** and you have ${num(store.user(actor.id).lp)}. Try /daily!`, flags: EPH });
    }

    const e = embed(COLORS.gold)
      .setTitle('💒 Wedding ceremony')
      .setDescription(`${actor} wants to marry ${target}!\n\n${target}, do you take ${actor} to be your partner for life?`);
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'I do!',
      no: 'I don\'t',
      yesEmoji: '',
      onYes: async (i) => {
        const a = store.user(actor.id);
        const r = a.rel;
        if (!r || r.partner !== target.id || r.type !== 'engaged') {
          return i.update({ content: 'Something changed, the ceremony was cancelled.', embeds: [], components: [] });
        }
        if (a.lp < WEDDING_COST) {
          return i.update({ content: `The wedding budget fell through (${WEDDING_COST} LP needed).`, embeds: [], components: [] });
        }
        award(actor.id, -WEDDING_COST);
        setRel(actor.id, target.id, 'married');
        award(actor.id, B.love.marriedReward);
        award(target.id, B.love.marriedReward);
        addCoupleXp(actor.id, target.id, 150);
        const done = embed(COLORS.gold)
          .setTitle('💒 Just married')
          .setDescription(
            `${pick(C.weddingLines)}\n\n${actor} ${target}\n\nMarriage certificate issued <t:${unix(Date.now())}:D>.\nEach of you received **+${B.love.marriedReward} LP**. Use \`/honeymoon\` to celebrate!`
          );
        return i.update({ content: `${actor} ${target}`, embeds: [done], components: [] });
      },
      onNo: (i) =>
        i.update({
          content: '',
          embeds: [embed(COLORS.grey).setDescription(`${target} left ${actor} at the altar. Ouch.`)],
          components: [],
        }),
    });
  },
};

const breakup = {
  data: command('breakup', 'End your relationship').addStringOption((o) =>
    o.setName('reason').setDescription('Why? (optional)').setMaxLength(200)
  ),
  async execute(interaction) {
    const actor = interaction.user;
    const r = relOf(actor.id);
    if (!r) return interaction.reply({ content: "You're single, nothing to break up with!", flags: EPH });
    if (r.type === 'married') return interaction.reply({ content: 'You are married. Use `/divorce` instead.', flags: EPH });
    const partner = r.partner;
    const reason = interaction.options.getString('reason');

    return ask(interaction, {
      to: actor.id,
      content: `${actor}, are you sure you want to break up with ${mention(partner)}? This will erase your couple level.`,
      yes: 'Yes, end it',
      no: 'Cancel',
      yesEmoji: '',
      yesStyle: 4, // Danger
      expiredText: 'Breakup cancelled (no answer).',
      onYes: async (i) => {
        const cur = relOf(actor.id);
        if (!cur || cur.partner !== partner || cur.type === 'married') {
          return i.update({ content: 'Things changed, nothing to break up anymore.', components: [] });
        }
        const days = daysSince(cur.startedAt);
        endRel(actor.id, partner, actor.id);
        const e = embed(COLORS.red)
          .setTitle('💔 A breakup')
          .setDescription(
            `${actor} broke up with ${mention(partner)} after **${days}** day${days === 1 ? '' : 's'} together.\n${reason ? `\n> ${reason}\n` : ''}\n${pick(C.breakupLines)}`
          )
          .addFields({ name: 'Healing time', value: `Both of you are healing for ${fmtDur(HEAL_MS)}`, inline: true });
        return i.update({ content: `${mention(partner)}`, embeds: [e], components: [] });
      },
      onNo: (i) => i.update({ content: 'Breakup cancelled. Love wins!', components: [] }),
    });
  },
};

const divorce = {
  data: command('divorce', 'End your marriage'),
  async execute(interaction) {
    const actor = interaction.user;
    const r = relOf(actor.id);
    if (!r || r.type !== 'married') return interaction.reply({ content: "You're not married.", flags: EPH });
    const partner = r.partner;
    const fee = Math.min(store.user(actor.id).lp, DIVORCE_FEE);

    return ask(interaction, {
      to: actor.id,
      content: `${actor}, divorce ${mention(partner)}? The lawyers charge **${fee} LP** and your couple level will be erased.`,
      yes: 'Sign the papers',
      no: 'Cancel',
      yesEmoji: '',
      yesStyle: 4,
      onYes: async (i) => {
        const cur = relOf(actor.id);
        if (!cur || cur.partner !== partner || cur.type !== 'married') {
          return i.update({ content: 'Things changed, nothing to divorce.', components: [] });
        }
        const days = daysSince(cur.startedAt);
        const paid = Math.min(store.user(actor.id).lp, DIVORCE_FEE);
        award(actor.id, -paid);
        endRel(actor.id, partner, actor.id);
        const e = embed(COLORS.red)
          .setTitle('💔 Divorced')
          .setDescription(`${actor} and ${mention(partner)} are no longer married after **${days}** days.\n\n${pick(C.divorceLines)}`)
          .addFields({ name: 'Legal fees', value: `${paid} LP`, inline: true });
        return i.update({ content: `${mention(partner)}`, embeds: [e], components: [] });
      },
      onNo: (i) => i.update({ content: 'Divorce cancelled.', components: [] }),
    });
  },
};

const makeup = {
  data: command('makeup', 'Get back together with an ex (within 7 days)').addUserOption((o) =>
    o.setName('user').setDescription('Your ex').setRequired(true)
  ),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const actor = interaction.user;
    if (!(await guardTarget(interaction, target, { selfMsg: 'Make up with yourself? Love yourself first!' }))) return;
    const me = store.user(actor.id);
    const ex = me.exes.find((x) => x.id === target.id && Date.now() - x.at <= MAKEUP_WINDOW_MS);
    if (!ex) {
      return interaction.reply({ content: `${mention(target.id)} is not an ex from the last 7 days. Try /date instead.`, flags: EPH });
    }
    const err = whyNotSingle(actor.id, target.id, { ignoreHeal: true });
    if (err) return interaction.reply({ content: err, flags: EPH });

    const e = embed(COLORS.purple)
      .setTitle('💞 A second chance?')
      .setDescription(`${actor} wants to get back together with ${target}.\n\n${target}, will you give them another chance?`);
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'Give another chance',
      no: 'Stay apart',
      yesEmoji: '',
      onYes: async (i) => {
        const again = whyNotSingle(actor.id, target.id, { ignoreHeal: true });
        if (again) return i.update({ content: again, embeds: [], components: [] });
        const ua = store.user(actor.id);
        const ub = store.user(target.id);
        ua.healUntil = ub.healUntil = 0;
        setRel(actor.id, target.id, 'dating');
        award(actor.id, B.love.makeupReward);
        award(target.id, B.love.makeupReward);
        const done = embed(COLORS.purple)
          .setTitle('💞 Back together')
          .setDescription(`${actor} and ${target} are **dating** again! Second chances are beautiful.\n\nEach received **+${B.love.makeupReward} LP**.`);
        return i.update({ content: `${actor} ${target}`, embeds: [done], components: [] });
      },
      onNo: (i) =>
        i.update({
          content: '',
          embeds: [embed(COLORS.grey).setDescription(`${target} decided to move on.`)],
          components: [],
        }),
    });
  },
};

const MILESTONES = [7, 30, 50, 100, 200, 365, 500, 730, 1000];

const relationship = {
  data: command('relationship', 'See relationship status and couple level').addUserOption((o) =>
    o.setName('user').setDescription('Whose status? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots are single and ready to mingle', flags: EPH });
    const u = store.user(who.id);
    if (!u.rel) {
      const heal = u.healUntil > Date.now() ? `\nHealing for another ${fmtDur(u.healUntil - Date.now())}.` : '';
      const e = embed(COLORS.grey)
        .setTitle('Single')
        .setDescription(`${who} is not in a relationship.${heal}\n\nStart one with \`/date\`!`);
      return interaction.reply({ embeds: [e] });
    }
    const c = getCouple(who.id, u.rel.partner);
    const lv = levelInfo(c.xp || 0);
    const pair = store.db().pairs[coupleKey(who.id, u.rel.partner)] || {};
    const e = embed(COLORS.pink)
      .setTitle(`${ICON[u.rel.type]} ${LABEL[u.rel.type]}`)
      .setDescription(`${who} ${mention(u.rel.partner)}`)
      .addFields(
        { name: 'Together since', value: `<t:${unix(u.rel.startedAt)}:D> (${daysSince(u.rel.startedAt)} days)`, inline: true },
        { name: 'Couple level', value: `**${lv.level}**`, inline: true },
        { name: 'Progress', value: `${bar(lv.pct)} ${lv.pct}%\n${num(c.xp || 0)} / ${num(lv.next)} XP` },
        ...(store.user(who.id).petName || store.user(u.rel.partner).petName
          ? [{ name: 'Pet names', value: `${mention(who.id)} calls them **${store.user(who.id).petName || 'partner'}**\n${mention(u.rel.partner)} calls them **${store.user(u.rel.partner).petName || 'partner'}**` }]
          : []),
        { name: 'Together stats', value: `💋 ${pair.kiss || 0} kisses  •  🤗 ${pair.hug || 0} hugs  •  🥰 ${pair.cuddle || 0} cuddles` }
      );
    return interaction.reply({ embeds: [e] });
  },
};

const anniversary = {
  data: command('anniversary', 'Check your anniversary and claim milestone rewards'),
  async execute(interaction) {
    const actor = interaction.user;
    const u = store.user(actor.id);
    if (!u.rel) return interaction.reply({ content: "You're single, no anniversary yet. Use `/date`!", flags: EPH });
    const partner = u.rel.partner;
    const c = getCouple(actor.id, partner);
    const start = new Date(u.rel.startedAt);
    const now = new Date();
    const days = daysSince(u.rel.startedAt);
    const lines = [`Together for **${days}** day${days === 1 ? '' : 's'} (since <t:${unix(u.rel.startedAt)}:D>).`];

    // milestone rewards
    c.milestones ||= [];
    let reward = 0;
    for (const m of MILESTONES) {
      if (days >= m && !c.milestones.includes(m)) {
        c.milestones.push(m);
        reward += 100;
        lines.push(`**${m}-day milestone** reached! +100 LP each`);
      }
    }
    // yearly anniversary
    const years = now.getUTCFullYear() - start.getUTCFullYear();
    const isAnniv = start.getUTCMonth() === now.getUTCMonth() && start.getUTCDate() === now.getUTCDate();
    if (isAnniv && years >= 1 && c.annivYear !== now.getUTCFullYear()) {
      c.annivYear = now.getUTCFullYear();
      const bonus = Math.min(B.love.anniversaryMax, B.love.anniversaryPerYear * years);
      reward += bonus;
      lines.push(`Happy **${years}-year** anniversary! +${num(bonus)} LP each`);
    }
    if (reward > 0) {
      award(actor.id, reward);
      award(partner, reward);
      addCoupleXp(actor.id, partner, 100);
    }
    const nextMs = MILESTONES.find((m) => m > days);
    if (nextMs) lines.push(`Next milestone: **${nextMs} days** (in ${nextMs - days} days).`);
    store.save();

    const e = embed(COLORS.gold)
      .setTitle('💞 Anniversary')
      .setDescription(`${actor} ${mention(partner)}\n\n${lines.join('\n')}`);
    return interaction.reply({ embeds: [e] });
  },
};

const exes = {
  data: command('exes', 'See your exes'),
  async execute(interaction) {
    const u = store.user(interaction.user.id);
    if (!u.exes.length) {
      return interaction.reply({ content: 'No exes. A clean record!', flags: EPH });
    }
    const list = u.exes
      .slice(0, 10)
      .map((x) => `• ${mention(x.id)}: ${LABEL[x.type] || 'Dating'}, ended <t:${unix(x.at)}:R>${x.by === interaction.user.id ? ' (you ended it)' : ''}`)
      .join('\n');
    return interaction.reply({ embeds: [embed(COLORS.grey).setTitle('Your exes').setDescription(list)], flags: EPH });
  },
};

const datenight = {
  data: command('datenight', 'Get a date idea (couples earn LP + XP)'),
  async execute(interaction) {
    const actor = interaction.user;
    const u = store.user(actor.id);
    const idea = pick(C.dateIdeas);
    if (!u.rel) {
      return interaction.reply({ embeds: [embed(COLORS.purple).setTitle('💞 Date idea').setDescription(`${idea}\n\n*Get a partner with /date to earn rewards for date nights!*`)] });
    }
    const partner = u.rel.partner;
    const c = getCouple(actor.id, partner);
    const wait = (c.lastDate || 0) + B.love.dateNightCdMs - Date.now();
    if (wait > 0) {
      return interaction.reply({ content: `You two already had a date night! Come back in ${fmtDur(wait)}`, flags: EPH });
    }
    c.lastDate = Date.now();
    award(actor.id, B.love.dateNight);
    award(partner, B.love.dateNight);
    addCoupleXp(actor.id, partner, 25);
    u.stats.dates += 1;
    store.user(partner).stats.dates += 1;
    store.save();
    const e = embed(COLORS.purple)
      .setTitle('💞 Date night')
      .setDescription(`${actor} ${mention(partner)}\n\n${idea}\n\n**+${B.love.dateNight} LP** each • **+25 couple XP**`);
    return interaction.reply({ content: mention(partner), embeds: [e] });
  },
};

const honeymoon = {
  data: command('honeymoon', 'Take your spouse on a honeymoon'),
  async execute(interaction) {
    const actor = interaction.user;
    const u = store.user(actor.id);
    if (!u.rel || u.rel.type !== 'married') {
      return interaction.reply({ content: 'Honeymoons are for married couples!', flags: EPH });
    }
    const partner = u.rel.partner;
    const c = getCouple(actor.id, partner);
    const wait = (c.lastHoneymoon || 0) + B.love.honeymoonCdMs - Date.now();
    if (wait > 0) {
      return interaction.reply({ content: `Pack lighter! Next honeymoon in ${fmtDur(wait)}`, flags: EPH });
    }
    c.lastHoneymoon = Date.now();
    const lp = rand(B.love.honeymoon[0], B.love.honeymoon[1]);
    award(actor.id, lp);
    award(partner, lp);
    addCoupleXp(actor.id, partner, 60);
    store.save();
    const e = embed(COLORS.gold)
      .setTitle('💖 Honeymoon')
      .setDescription(`${actor} ${mention(partner)} are escaping to ${pick(C.honeymoonSpots)}.\n\n**+${lp} LP** each • **+60 couple XP**`);
    return interaction.reply({ content: mention(partner), embeds: [e] });
  },
};

module.exports = {
  commands: [date, propose, marry, breakup, divorce, makeup, relationship, anniversary, exes, datenight, honeymoon],
};
