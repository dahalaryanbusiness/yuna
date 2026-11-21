// Roleplay family: adopt, disown, family tree.
const store = require('../store');
const B = require('../data/balance');
const { ask } = require('../lib/interactive');
const E = require('../lib/eco');
const { COLORS, EPH, command, embed, mention, guardTarget, genderIcon, cooldown, fmtDur, num, pick, rand, chance } = require('../lib/util');
const { e: emo } = require('../lib/emojis'); // Yuna's custom emojis (falls back to unicode until uploaded)

const MAX_CHILDREN = 5;
const MAX_PARENTS = 2;

function link(parent, child) {
  const p = store.user(parent);
  const c = store.user(child);
  if (!p.children.includes(child)) p.children.push(child);
  if (!c.parents.includes(parent)) c.parents.push(parent);
  store.save();
}

function unlink(parent, child) {
  const p = store.user(parent);
  const c = store.user(child);
  p.children = p.children.filter((x) => x !== child);
  c.parents = c.parents.filter((x) => x !== parent);
  store.save();
}


// ---- family bond (shared fun: dinners, chores, welcome gifts) -------------------------------------------
const HOUR = 3600000;
const famStats = (id) => { const u = store.user(id); if (!u.fam) u.fam = { xp: 0, dinners: 0, chores: 0 }; return u.fam; };
const bondLevel = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1;
const bondFloor = (lvl) => 40 * (lvl - 1) ** 2;
const addFamXp = (id, n) => { famStats(id).xp += n; store.save(); };

// Everyone close to you: parents, children, siblings (shared parent) and your partner.
function immediate(id) {
  const u = store.user(id);
  const set = new Set([...u.parents, ...u.children]);
  for (const p of u.parents) for (const c of store.user(p).children) set.add(c);
  if (u.rel && u.rel.partner) set.add(u.rel.partner);
  set.delete(id);
  return [...set].filter((x) => store.hasUser(x));
}

const WELCOME_GIFT = B.family.welcomeGift;
const firstAdoption = (a, b) => !(store.db().pairs[store.pairKey(a, b)] || {}).adopted;

// Returns { id -> generation } going up (parents = 1, grandparents = 2, ...) or down (children = 1, ...).
// Uses a visited set so a bad/looping tree can never hang the bot.
function walk(id, key, maxDepth = 8) {
  const found = new Map();
  let level = [id];
  for (let depth = 1; depth <= maxDepth && level.length; depth++) {
    const next = [];
    for (const cur of level) {
      for (const rel of store.user(cur)[key] || []) {
        if (rel === id || found.has(rel)) continue;
        found.set(rel, depth);
        next.push(rel);
      }
    }
    level = next;
  }
  return found;
}
const ancestors = (id) => walk(id, 'parents');
const descendants = (id) => walk(id, 'children');

const greats = (n) => 'Great-'.repeat(Math.max(0, n));
const upLabel = (g) => (g === 1 ? 'Parents' : g === 2 ? 'Grandparents' : `${greats(g - 2)}grandparents`);
const downLabel = (g) => (g === 1 ? 'Children' : g === 2 ? 'Grandchildren' : `${greats(g - 2)}grandchildren`);

// Two people are "related" for adoption purposes if one is an ancestor of the other or they share a parent.
function areSiblings(a, b) {
  const pa = store.user(a).parents;
  return store.user(b).parents.some((p) => pa.includes(p));
}

// Returns a message if `parent` adopting `child` would break the family tree, otherwise null.
function relationBlock(parent, child) {
  if (ancestors(parent).has(child)) return "Family tree error: that's your ancestor! 🌳";
  if (descendants(parent).has(child)) return "Family tree error: that's already your descendant! 🌳";
  if (areSiblings(parent, child)) return "That's your sibling, you can't adopt them! 🌳";
  return null;
}

const adopt = {
  data: command('adopt', 'Adopt someone into your (roleplay) family 👨‍👧').addUserOption((o) =>
    o.setName('user').setDescription('Who do you want to adopt?').setRequired(true)
  ),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    if (!(await guardTarget(interaction, target, { selfMsg: "You can't adopt yourself! 😅", botMsg: 'Bots are self-sufficient 🤖' }))) return;
    const me = store.user(actor.id);
    const them = store.user(target.id);
    if (me.rel && me.rel.partner === target.id) return interaction.reply({ content: "That's your partner, not your kid! 😳", flags: EPH });
    if (me.children.includes(target.id)) return interaction.reply({ content: 'They are already your child 💕', flags: EPH });
    if (me.children.length >= MAX_CHILDREN) return interaction.reply({ content: `You can have at most **${MAX_CHILDREN}** children.`, flags: EPH });
    if (them.parents.length >= MAX_PARENTS) return interaction.reply({ content: `${mention(target.id)} already has ${MAX_PARENTS} parents.`, flags: EPH });
    const blocked = relationBlock(actor.id, target.id);
    if (blocked) return interaction.reply({ content: blocked, flags: EPH });

    const ttl = 180000;
    const expires = Math.floor((Date.now() + ttl) / 1000);
    const gift = firstAdoption(actor.id, target.id);
    const name = (u) => u.displayName || u.username;
    const parentNow = them.parents.length ? them.parents.map(mention).join(' ') : '*no parents yet*';
    const e = embed(COLORS.orange)
      .setAuthor({ name: `${name(actor)} sent an adoption request`, iconURL: actor.displayAvatarURL({ size: 64 }) })
      .setTitle(`${emo('fam_dad_kid')} Do you want to join ${name(actor)}'s family?`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setDescription(
        `${emo('fam_home')} ${actor} would love to adopt ${target} and give them a home!\n` +
        `${gift ? `${emo('gift_bounce')} **Welcome gift:** you both get ${E.lp(WELCOME_GIFT)} when you accept.\n` : ''}` +
        `\n-# ${target}, press a button below. You can always leave later with /family disown.`
      )
      .addFields(
        { name: `${emo('famtree_pink')} ${name(actor)}'s family`, value: `**${me.children.length}**/${MAX_CHILDREN} children\nBond level **${bondLevel(famStats(actor.id).xp)}**`, inline: true },
        { name: `${emo('fam_home')} ${name(target)}'s parents`, value: `**${them.parents.length}**/${MAX_PARENTS}\n${parentNow}`, inline: true },
        { name: '⏳ Expires', value: `<t:${expires}:R>`, inline: true }
      );
    return ask(interaction, {
      to: target.id,
      content: `${target}`,
      embeds: [e],
      yes: 'Join the family',
      no: 'No thanks',
      yesEmoji: '🏡',
      ttl,
      expiredText: `⏳ The adoption request for ${target} expired.`,
      onYes: async (i) => {
        const a = store.user(actor.id);
        const t = store.user(target.id);
        if (a.children.length >= MAX_CHILDREN || t.parents.length >= MAX_PARENTS || a.children.includes(target.id) || relationBlock(actor.id, target.id)) {
          return i.update({ content: 'The family changed while you waited, so this adoption is no longer possible. 🏡', embeds: [], components: [] });
        }
        link(actor.id, target.id);
        let giftLine = '';
        if (firstAdoption(actor.id, target.id)) {
          store.db().pairs[store.pairKey(actor.id, target.id)] = Object.assign(store.db().pairs[store.pairKey(actor.id, target.id)] || {}, { adopted: Date.now() });
          E.earn(actor.id, WELCOME_GIFT, { boost: false });
          E.earn(target.id, WELCOME_GIFT, { boost: false });
          addFamXp(actor.id, 25); addFamXp(target.id, 25);
          giftLine = `\n${emo('gift_bounce')} Welcome gift: **+${num(WELCOME_GIFT)}** LP each and **+25** bond XP!`;
        }
        const kids = store.user(actor.id).children.length;
        return i.update({
          content: `${actor} ${target}`,
          embeds: [embed(COLORS.green)
            .setAuthor({ name: 'Adoption complete', iconURL: target.displayAvatarURL({ size: 64 }) })
            .setTitle(`${emo('fam_home')} Welcome home, ${name(target)}!`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .setDescription(`${target} is now part of ${actor}'s family! ${emo('a_heart_hotpink')}${emo('fam_heart_hands')}${emo('a_twinkle_gold')}${giftLine}\n\n-# Try \`/family dinner\`, \`/family chore\` and \`/family bond\` to grow your family together.`)
            .addFields(
              { name: `${emo('famtree_pink')} Children`, value: `**${kids}**/${MAX_CHILDREN}`, inline: true },
              { name: `${emo('fam_home')} Parents`, value: `**${store.user(target.id).parents.length}**/${MAX_PARENTS}`, inline: true }
            )],
          components: [],
        });
      },
      onNo: (i) =>
        i.update({ content: '', embeds: [embed(COLORS.grey).setTitle('💔 Adoption declined').setDescription(`${target} politely said no thanks to ${actor}'s family.\n-# Maybe next time!`)], components: [] }),
    });
  },
};

const disown = {
  data: command('disown', 'Remove someone from your family tree 💔').addUserOption((o) =>
    o.setName('user').setDescription('Your child or parent').setRequired(true)
  ),
  async execute(interaction) {
    const actor = interaction.user;
    const target = interaction.options.getUser('user');
    const me = store.user(actor.id);
    if (me.children.includes(target.id)) {
      unlink(actor.id, target.id);
      return interaction.reply({ embeds: [embed(COLORS.grey).setDescription(`💔 ${actor} disowned their child ${target}.`)] });
    }
    if (me.parents.includes(target.id)) {
      unlink(target.id, actor.id);
      return interaction.reply({ embeds: [embed(COLORS.grey).setDescription(`💔 ${actor} left the family of ${target}.`)] });
    }
    return interaction.reply({ content: 'That person is not your parent or child.', flags: EPH });
  },
};

function fit(text, max = 1000) {
  return text.length <= max ? text : `${text.slice(0, max - 20).replace(/<@\d*$/, '')}… and more`;
}

// Draws all descendants as a tree: child > grandchild > great-grandchild ...
function drawTree(rootId, maxLines = 40) {
  const lines = [];
  const seen = new Set([rootId]);
  const rec = (id, prefix, depth) => {
    const kids = store.user(id).children.filter((c) => !seen.has(c));
    kids.forEach((kid, idx) => {
      if (lines.length >= maxLines) return;
      seen.add(kid);
      const last = idx === kids.length - 1;
      const kp = store.user(kid).rel;
      lines.push(`${prefix}${last ? '└─' : '├─'} ${genderIcon(kid)} ${mention(kid)}${kp ? ` ${emo('ring_pink')} ${mention(kp.partner)}` : ''}`);
      if (depth < 8) rec(kid, prefix + (last ? '\u2003\u2003' : '│\u2003'), depth + 1);
    });
  };
  rec(rootId, '', 1);
  if (lines.length >= maxLines) lines.push('… and more');
  return lines;
}

const family = {
  data: command('family', 'See a family tree 🌳').addUserOption((o) =>
    o.setName('user').setDescription('Whose family? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots were built, not born 🤖', flags: EPH });
    const u = store.user(who.id);
    const shown = new Set([who.id]);
    const show = (ids) => ids.filter((x) => !shown.has(x) && shown.add(x));
    const list = (ids) => (ids.length ? fit(ids.map(mention).join(', ')) : '*none*');

    // Ancestors by generation
    const up = ancestors(who.id);
    const upGroups = {};
    for (const [id, g] of up) (upGroups[g] ||= []).push(id);
    // Descendants by generation
    const down = descendants(who.id);
    const downGroups = {};
    for (const [id, g] of down) (downGroups[g] ||= []).push(id);

    // Siblings, aunts/uncles, nieces/nephews, cousins
    const parents = u.parents;
    const siblings = new Set();
    for (const p of parents) for (const c of store.user(p).children) if (c !== who.id) siblings.add(c);
    const auntsUncles = new Set();
    for (const p of parents) for (const gp of store.user(p).parents) for (const c of store.user(gp).children) if (!parents.includes(c) && c !== who.id) auntsUncles.add(c);
    const nieces = new Set();
    for (const s of siblings) for (const c of store.user(s).children) nieces.add(c);
    const cousins = new Set();
    for (const a of auntsUncles) for (const c of store.user(a).children) cousins.add(c);

    const fields = [];
    if (siblings.size) fields.push({ name: `${emo('fam_siblings')} Siblings`, value: list(show([...siblings])), inline: true });
    if (auntsUncles.size) fields.push({ name: `${emo('fam_aunt_uncle')} Aunts & uncles`, value: list(show([...auntsUncles])), inline: true });
    if (cousins.size) fields.push({ name: `${emo('fam_cousins')} Cousins`, value: list(show([...cousins])), inline: true });
    if (nieces.size) fields.push({ name: `${emo('fam_baby_bottle')} Nieces & nephews`, value: list(show([...nieces])), inline: true });

    const gensUp = up.size ? Math.max(...up.values()) : 0;
    const gensDown = down.size ? Math.max(...down.values()) : 0;
    const total = up.size + down.size + siblings.size + auntsUncles.size + nieces.size + cousins.size + (u.rel ? 1 : 0);
    const summary = `Bond lvl ${bondLevel(famStats(who.id).xp)} \u2022 ${total} member${total === 1 ? '' : 's'} \u2022 ${gensUp + gensDown + 1} generation${gensUp + gensDown ? 's' : ''} \u2022 ${down.size} descendant${down.size === 1 ? '' : 's'}`;

    // Ancestors, one line per generation (closest first)
    const ancLines = Object.keys(upGroups).map(Number).sort((a, b) => a - b)
      .map((g) => `${emo('arrow_up_hotpink')} **${upLabel(g)}:** ${list(upGroups[g])}`);

    // The tree itself: you + partner on top, every descendant below (with their partners)
    const tree = drawTree(who.id);
    const rootLine = `${genderIcon(who.id)} ${mention(who.id)}${u.rel ? ` ${emo('ring_pink')} ${mention(u.rel.partner)}` : ''}`;
    const treeBlock = `**${emo('famtree_pink')} Family tree**\n${rootLine}${tree.length ? `\n${tree.join('\n')}` : `\n${emo('arrow_down_hotpink')} *no children yet, try \`/family adopt\`*`}`;

    const e = embed(COLORS.orange)
      .setTitle(`${emo('famtree_green')} ${who.displayName}'s family`)
      .setThumbnail(who.displayAvatarURL({ size: 128 }))
      .setDescription(`${emo('a_heart_hotpink')} ${summary} ${emo('a_twinkle_gold')}\n\n${ancLines.length ? `${ancLines.join('\n')}\n\n` : `${emo('arrow_up_hotpink')} **Parents:** *none*\n\n`}${treeBlock}`.slice(0, 4000));
    if (fields.length) e.addFields(fields.slice(0, 24));
    return interaction.reply({ embeds: [e], allowedMentions: { parse: [] } });
  },
};


// ======================================================================= family dinner / chore / bond
const DISHES = ['ramen with extra naruto', 'a giant heart-shaped pizza', "grandma's secret curry", 'strawberry pancakes', 'a mountain of dumplings', 'cheesy tacos', 'sushi night', 'a fancy roast with candles', 'hot pot for everyone', 'homemade cake with sprinkles'];
const dinner = {
  data: command('dinner', 'Host a family dinner: everyone in your family earns Love Points 🍲'),
  async execute(interaction) {
    const id = interaction.user.id;
    const members = immediate(id);
    if (!members.length) return interaction.reply({ content: `${emo('info')} You need a family first: \`/family adopt\`, \`/date\` someone or get adopted.`, flags: EPH });
    const left = cooldown(id, 'famdinner', 6 * HOUR);
    if (left) return interaction.reply({ content: `${emo('clock')} The kitchen is cleaning up. Next family dinner <t:${Math.floor((Date.now() + left) / 1000)}:R> (${fmtDur(left)}).`, flags: EPH });
    const fs = famStats(id);
    const lvl = bondLevel(fs.xp);
    const base = B.family.dinnerBase + lvl * B.family.dinnerPerLevel + Math.min(members.length, 8) * B.family.dinnerPerMember;
    const hostGot = E.earn(id, Math.floor(base * B.family.dinnerHostMult));
    for (const m of members) E.earn(m, base, { boost: false });
    for (const m of [id, ...members]) addFamXp(m, 12);
    fs.dinners += 1;
    const full = members.length >= 4;
    if (full) { E.earn(id, B.family.fullHouse, { boost: false }); }
    store.save();
    const e = embed(COLORS.orange)
      .setAuthor({ name: `${interaction.user.displayName || interaction.user.username} is hosting dinner`, iconURL: interaction.user.displayAvatarURL({ size: 64 }) })
      .setTitle(`${emo('fam_home')} Family dinner: ${pick(DISHES)}`)
      .setDescription(
        `${emo('fam_heart_hands')} **${members.length + 1}** family members sat at the table.\n` +
        `${members.slice(0, 12).map(mention).join(' ')}${members.length > 12 ? ' and more' : ''}\n\n` +
        `${emo('coin')} Host: **+${num(hostGot)}** LP${full ? ` (+${B.family.fullHouse} full-house bonus)` : ''}\n` +
        `${emo('gift_bounce')} Every guest: **+${num(base)}** LP\n` +
        `${emo('a_twinkle_gold')} Bond XP **+12** for everyone (bond level **${lvl}**)\n` +
        `Dinners hosted: **${fs.dinners}**, the next one is possible in 6 hours`
      );
    return interaction.reply({ embeds: [e], allowedMentions: { parse: [] } });
  },
};

const CHORES = [
  ['washed the dishes', 'every plate sparkles'], ['walked the family dog', 'the dog is exhausted and happy'], ['took out the trash', 'bins are empty'],
  ['cooked breakfast', 'the pancakes were perfect'], ['cleaned your room', 'a floor was discovered'], ['watered the plants', 'the garden says thanks'],
  ['did the laundry', 'no socks were lost (almost)'], ['helped with homework', 'big brain energy'], ['washed the car', 'it shines like new'],
];
const chore = {
  data: command('chore', 'Do a chore for your family and earn Love Points 🧹'),
  async execute(interaction) {
    const id = interaction.user.id;
    const members = immediate(id);
    if (!members.length) return interaction.reply({ content: `${emo('info')} You need a family first: \`/family adopt\`.`, flags: EPH });
    const left = cooldown(id, 'famchore', B.family.choreCdMs);
    if (left) return interaction.reply({ content: `${emo('clock')} You are tired from the last chore. Try again <t:${Math.floor((Date.now() + left) / 1000)}:R>.`, flags: EPH });
    const [what, extra] = pick(CHORES);
    const fs = famStats(id);
    fs.chores += 1;
    if (chance(0.08)) {
      store.save();
      return interaction.reply({ embeds: [embed(COLORS.grey).setTitle(`${emo('warn')} Oops!`).setDescription(`You tried to help and broke a vase instead. Nobody was mad, but no reward this time.`)] });
    }
    const got = E.earn(id, rand(B.family.choreLp[0], B.family.choreLp[1]) + bondLevel(fs.xp) * B.family.choreBondBonus);
    const parents = store.user(id).parents;
    for (const p of parents) E.earn(p, B.family.parentShare, { boost: false });
    addFamXp(id, 4);
    return interaction.reply({ embeds: [embed(COLORS.green).setTitle(`${emo('check')} Chore done!`).setDescription(`You ${what}, ${extra}.\n${emo('coin')} **+${num(got)}** LP${parents.length ? `\n${emo('fam_heart_hands')} Your parent${parents.length > 1 ? 's' : ''} proudly got **+${B.family.parentShare}** LP` : ''}\n-# Bond XP +4  \u2022  chores done: ${fs.chores}`)], allowedMentions: { parse: [] } });
  },
};

const bond = {
  data: command('bond', 'See your family bond level and perks 💞').addUserOption((o) => o.setName('user').setDescription('Whose bond? (default: you)')),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots were built, not born 🤖', flags: EPH });
    const fs = famStats(who.id);
    const lvl = bondLevel(fs.xp);
    const lo = bondFloor(lvl); const hi = bondFloor(lvl + 1);
    const pct = Math.round(((fs.xp - lo) / (hi - lo)) * 100);
    const members = immediate(who.id);
    const e = embed(COLORS.purple)
      .setTitle(`${emo('famtree_pink')} ${who.displayName}'s family bond`)
      .setThumbnail(who.displayAvatarURL({ size: 128 }))
      .setDescription(
        `**Bond level ${lvl}**\n${E.meter(pct, 12)} **${num(fs.xp - lo)}** / ${num(hi - lo)} XP\n\n` +
        `${emo('fam_home')} Close family: **${members.length}**\n${emo('gift_bounce')} Dinners hosted: **${fs.dinners}**  \u2022  chores done: **${fs.chores}**\n\n` +
        `**Perks**\n\u2022 Dinner pays ${num(120 + lvl * 40)}+ LP per guest (grows every level)\n\u2022 Chores pay +${lvl * 10} LP extra\n\u2022 Earn bond XP with \`/family dinner\`, \`/family chore\` and new adoptions`
      );
    return interaction.reply({ embeds: [e], allowedMentions: { parse: [] } });
  },
};

module.exports = { commands: [adopt, disown, family, dinner, chore, bond] };
