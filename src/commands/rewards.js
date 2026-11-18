// Timed rewards: daily (in economy.js), weekly, monthly, quarterly + boosts, shown OwO-style as short plain-text lines.
// Every reward keeps a streak: claim again within 2x the interval and the bonus grows.
const store = require('../store');
const B = require('../data/balance');
const { RANKS } = require('../data/careers');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const { COLORS, EPH, command, embed, num, rand, fmtDur } = require('../lib/util');

const MIN = 60000; const HOUR = 3600000; const DAY = 86400000;
// base LP, gems, optional item. Weekly is small, quarterly is big.
const TABLE = {
  weekly:    { name: 'Weekly',    every: 7 * DAY,     lp: B.rewards.weekly,         gems: 0,    icon: 'cashstack_pink',      color: COLORS.pink },
  monthly:   { name: 'Monthly',   every: 30 * DAY,    lp: B.rewards.monthly,        gems: 2,    icon: 'a_cashbag_green',  color: COLORS.purple, item: ['chest', 1] },
  quarterly: { name: 'Quarterly', every: 90 * DAY,    lp: B.rewards.quarterly,      gems: 6,    icon: 'a_gem_cyan',       color: COLORS.orange, item: ['chest', 2] },
};
const ORDER = ['daily', 'weekly', 'monthly', 'quarterly'];

function claimInfo(id, key) {
  const x = E.eco(id);
  return x.rw[key] || { last: 0, streak: 0, total: 0 };
}

async function claim(interaction, key) {
  const id = interaction.user.id;
  const def = TABLE[key];
  const x = E.eco(id);
  const rec = claimInfo(id, key);
  const now = Date.now();
  const me = `**${interaction.user.displayName}**`;
  const wait = rec.last ? rec.last + def.every - now : 0; // first claim is always ready
  if (wait > 0) {
    return interaction.reply({ content: `${e('clock')} **|** ${me}, your next ${def.name.toLowerCase()} is in: **${E.hms(wait)}**`, flags: EPH });
  }
  const streak = rec.last && now - rec.last <= def.every * 2 ? rec.streak + 1 : 1;
  const base = rand(def.lp[0], def.lp[1]);
  const u = store.user(id);
  const bonus = [];
  let mult = 1;
  const streakBonus = Math.min(B.rewards.streakMax, (streak - 1) * B.rewards.streakStep);
  if (streakBonus) { mult += streakBonus; bonus.push(`streak +${Math.round(streakBonus * 100)}%`); }
  if (x.job) { const jb = (x.job.rank + 1) * B.rewards.jobStep; mult += jb; bonus.push(`${RANKS[x.job.rank].n} +${Math.round(jb * 100)}%`); }
  if (u.rel) { mult += B.rewards.relBonus; bonus.push(`relationship +${Math.round(B.rewards.relBonus * 100)}%`); }
  const total = Math.floor(base * mult);
  const got = E.earn(id, total, { boost: false });
  const g = def.gems ? def.gems + Math.floor(streak / 2) : 0;
  if (g) E.addGems(id, g);
  const lines = [
    `${e(def.icon)} **|** ${me}, here is your ${def.name.toLowerCase()} ${e('coin')} **${num(got)}** LP!`,
    `${e('heart_pulse')} **|** You're on a **${streak} ${def.name.toLowerCase()} streak**!`,
  ];
  if (bonus.length) lines.push(`${e('sparkle')} **|** Bonus: ${bonus.join(', ')}`);
  if (g) lines.push(`${e('gem_pink')} **|** You received **${num(g)} gems**!`);
  if (def.item) {
    const [it, n] = def.item;
    u.inv[it] = (u.inv[it] || 0) + n;
    const C = require('../data/content');
    const shown = C.shopItems.find((s) => s.id === it);
    lines.push(`${shown ? shown.emoji : e('gift')} **|** You received ${n > 1 ? `**${n}x**` : 'a'} **${shown ? shown.name : it}**!`);
  }
  rec.last = now; rec.streak = streak; rec.total = (rec.total || 0) + 1;
  x.rw[key] = rec;
  store.save();
  lines.push(`${e('clock')} **|** Your next ${def.name.toLowerCase()} is in: **${E.hms(def.every)}**`);
  return interaction.reply({ content: lines.join('\n') });
}

const mk = (key, desc) => ({ data: command(key, desc), execute: (i) => claim(i, key) });
const weekly = mk('weekly', `Claim your weekly reward (${B.rewards.weekly[0]}+ LP)`);
const monthly = mk('monthly', `Claim your monthly reward (${B.rewards.monthly[0].toLocaleString('en-US')}+ LP, gems and a chest)`);

const BOOSTS = {
  b2_1: { name: '2x LP for 1 hour', gems: 5, mult: 2, ms: HOUR },
  b2_6: { name: '2x LP for 6 hours', gems: 20, mult: 2, ms: 6 * HOUR },
  b3_1: { name: '3x LP for 1 hour', gems: 15, mult: 3, ms: HOUR },
  b3_6: { name: '3x LP for 6 hours', gems: 55, mult: 3, ms: 6 * HOUR },
};

const rewards = {
  data: command('rewards', 'Your timed rewards: quarterly, boosts and a list of everything')
    .addSubcommand((s) => s.setName('list').setDescription('See every reward and when it is ready'))
    .addSubcommand((s) => s.setName('quarterly').setDescription('Claim your quarterly reward (every 90 days)'))
    .addSubcommand((s) => s.setName('boost').setDescription('Spend gems on an LP boost').addStringOption((o) => o.setName('type').setDescription('Which boost?').setRequired(true).addChoices(...Object.entries(BOOSTS).map(([k, v]) => ({ name: `${v.name} (${v.gems} gems)`, value: k }))))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    if (sub === 'quarterly') return claim(interaction, sub);
    const x = E.eco(id);
    if (sub === 'boost') {
      const b = BOOSTS[interaction.options.getString('type', true)];
      if (E.boostLeft(id)) return interaction.reply({ content: `${e('a_fire_orange')} You already have a boost running ${E.rel(x.boost.until)}.`, flags: EPH });
      if (x.gems < b.gems) return interaction.reply({ content: `${e('cross')} That costs **${b.gems} gems**. You have **${x.gems}**. Gems come from monthly and quarterly rewards and promotions.`, flags: EPH });
      x.gems -= b.gems; x.boost = { mult: b.mult, until: Date.now() + b.ms }; store.save();
      return interaction.reply({ embeds: [E.card(COLORS.orange, `${e('a_fire_orange')} Boost active`, `**${b.name}** on work, crime, business and more. Ends ${E.rel(x.boost.until)}.`)] });
    }
    // list
    const now = Date.now();
    const u = store.user(id);
    const rows = ORDER.map((key) => {
      const every = key === 'daily' ? 22 * HOUR : TABLE[key].every;
      const icon = key === 'daily' ? 'a_heart_pink' : TABLE[key].icon;
      const last = key === 'daily' ? u.lastDaily : claimInfo(id, key).last;
      const streak = key === 'daily' ? u.streak : claimInfo(id, key).streak;
      const ready = !last || last + every <= now;
      return `${e(icon)} **|** **${key[0].toUpperCase()}${key.slice(1)}**: ${ready ? `${e('check')} ready!` : `${e('clock')} ${E.hms(last + every - now)}`}${streak > 1 ? ` (streak ${streak})` : ''}`;
    });
    const b = E.boostLeft(id);
    return interaction.reply({ content: `${e('gift_bounce')} **|** **${interaction.user.displayName}**'s rewards\n${rows.join('\n')}\n${e('gem_pink')} **|** Gems: **${num(x.gems)}**${b ? `\n${e('a_fire_orange')} **|** Boost **${b.mult}x** ends in **${E.hms(b.until - now)}**` : ''}` });
  },
};

module.exports = { commands: [weekly, monthly, rewards], TABLE, claim };
