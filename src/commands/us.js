// /us: things only couples can do.
//   spark   - a love streak. You BOTH have to press it, or the flame dies (48h window). Milestones every 7 rounds.
//   capsule - write a message that Yuna DMs to you or your partner many days later (1-365).
//   vault   - a shared savings box. Safe from /rob. Taking money out needs your partner to click Approve.
//             If you break up, either of you can /us split to share what is left 50/50 (a "prenup").
const store = require('../store');
const B = require('../data/balance');
const E = require('../lib/eco');
const { ask } = require('../lib/interactive');
const { partnerId } = require('../lib/couple');
const { e } = require('../lib/emojis');
const { COLORS, EPH, command, embed, num, fmtDur, getCouple, addCoupleXp, coupleKey } = require('../lib/util');

const U = B.us;
const HOUR = 3600000;
const DAY = 24 * HOUR;

async function needPartner(interaction) {
  const p = partnerId(interaction.user.id);
  if (!p) { await interaction.reply({ content: 'This one is just for couples. Start a relationship with `/date` first 💞', flags: EPH }); return null; }
  return p;
}

// ---------------------------------------------------------------- spark
function sparkState(c) {
  if (!c.spark) c.spark = { n: 0, best: 0, done: 0, p: {} };
  return c.spark;
}
async function doSpark(interaction) {
  const actor = interaction.user.id;
  const p = await needPartner(interaction);
  if (!p) return;
  const c = getCouple(actor, p);
  const s = sparkState(c);
  const now = Date.now();
  let lost = 0;
  if (s.done && now - s.done > 2 * DAY && s.n > 0) { lost = s.n; s.n = 0; } // the flame died
  s.p[actor] = now;
  const partnerPressed = (s.p[p] || 0) > s.done;
  const ready = now - s.done >= U.sparkGapHours * HOUR;
  const lines = [];
  if (lost) lines.push(`${e('heartbreak')} Your **${lost}-day spark** went out because nobody lit it in time. A new one starts now.`);
  if (partnerPressed && ready) {
    s.n += 1; s.best = Math.max(s.best, s.n); s.done = now;
    addCoupleXp(actor, p, U.sparkCoupleXp);
    lines.push(`${e('fire')} **Spark lit!** <@${actor}> and <@${p}> kept it alive together.`);
    if (s.n % U.sparkMilestone === 0) {
      const lp = U.sparkLp + s.n;
      E.earn(actor, lp); E.earn(p, lp);
      lines.push(`${e('trophy_shine')} **${s.n}-round milestone!** Both of you get a bonus.`);
    }
    store.save();
    return interaction.reply({ content: `<@${p}>`, embeds: [embed(COLORS.orange).setTitle(`${e('fire')} Love spark: ${s.n}`).setDescription(`${lines.join('\n')}\n\nBest ever: **${s.best}**\n-# Press it again in ${U.sparkGapHours}+ hours. If one of you forgets for 48 hours, it goes out.`)], allowedMentions: { users: [p] } });
  }
  store.save();
  if (partnerPressed && !ready) lines.push(`${e('clock')} You already lit it together recently. Come back in **${fmtDur(s.done + U.sparkGapHours * HOUR - now)}**.`);
  else lines.push(`${e('heart_pulse')} You pressed the spark. Now <@${p}> needs to press it too!`);
  return interaction.reply({ content: `<@${p}>`, embeds: [embed(COLORS.pink).setTitle(`${e('fire')} Love spark: ${s.n}`).setDescription(`${lines.join('\n')}\n\nBest ever: **${s.best}** · last lit ${s.done ? `<t:${Math.floor(s.done / 1000)}:R>` : 'never'}`)], allowedMentions: { users: [p] } });
}

// ---------------------------------------------------------------- capsule
function capsules() {
  const db = store.db();
  if (!db.capsules) db.capsules = [];
  return db.capsules;
}
async function doCapsule(interaction) {
  const id = interaction.user.id;
  const days = interaction.options.getInteger('days', true);
  const text = String(interaction.options.getString('message', true)).trim().slice(0, U.capsuleMaxChars);
  const to = interaction.options.getString('to') || (partnerId(id) ? 'partner' : 'me');
  let target = id;
  if (to === 'partner') {
    const p = partnerId(id);
    if (!p) return interaction.reply({ content: 'You have no partner to send it to. Use `to: me` to write to your future self.', flags: EPH });
    target = p;
  }
  if (!text) return interaction.reply({ content: 'Write something first 💌', flags: EPH });
  if (days < 1 || days > U.capsuleMaxDays) return interaction.reply({ content: `Pick between 1 and ${U.capsuleMaxDays} days.`, flags: EPH });
  const mine = capsules().filter((c) => c.from === id);
  if (mine.length >= U.capsuleMax) return interaction.reply({ content: `You already have **${U.capsuleMax}** capsules waiting. Wait for one to arrive (\`/us capsules\`).`, flags: EPH });
  if (!E.pay(id, U.capsuleCost)) return interaction.reply({ content: `Sealing a time capsule costs **${U.capsuleCost} LP**. You have **${num(store.user(id).lp)}**.`, flags: EPH });
  const due = Date.now() + days * DAY;
  capsules().push({ id: `${id}-${Date.now()}`, from: id, to: target, text, made: Date.now(), due, tries: 0 });
  store.save();
  return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e('letter')} Time capsule sealed`).setDescription(`Yuna will DM your message to ${target === id ? 'you' : `<@${target}>`} <t:${Math.floor(due / 1000)}:R> (<t:${Math.floor(due / 1000)}:D>).\nIt cost ${E.lp(U.capsuleCost)}. Nobody can read it until then, not even you.\n-# Make sure the receiver allows DMs from server members.`)], flags: EPH });
}
async function listCapsules(interaction) {
  const id = interaction.user.id;
  const mine = capsules().filter((c) => c.from === id);
  const forMe = capsules().filter((c) => c.to === id && c.from !== id);
  const lines = [
    ...mine.map((c) => `${e('letter')} To ${c.to === id ? '**you**' : `<@${c.to}>`} · arrives <t:${Math.floor(c.due / 1000)}:R>`),
    ...(forMe.length ? [`\n${e('gift')} **${forMe.length}** capsule(s) from your partner are on the way (you cannot read them yet).`] : []),
  ];
  return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e('letter')} Your time capsules`).setDescription(lines.length ? lines.join('\n') : 'None yet. `/us capsule` seals one.')], flags: EPH });
}
// Called every few minutes from index.js. Sends capsules that are due.
async function deliverCapsules(client) {
  const now = Date.now();
  const list = capsules();
  for (const c of [...list]) {
    if (c.due > now) continue;
    const user = await client.users.fetch(c.to).catch(() => null);
    let ok = false;
    if (user) {
      try {
        await user.send({ embeds: [embed(COLORS.pink).setTitle(`${e('letter')} A time capsule has arrived!`)
          .setDescription(`${c.from === c.to ? 'You wrote this to your future self' : `<@${c.from}> sealed this for you`} <t:${Math.floor(c.made / 1000)}:R>:\n\n> ${c.text.replace(/\n/g, '\n> ')}`)] });
        ok = true;
      } catch { ok = false; }
    }
    if (ok) list.splice(list.indexOf(c), 1);
    else if ((c.tries += 1) >= 8) { list.splice(list.indexOf(c), 1); E.earn(c.from, U.capsuleCost, { boost: false, hard: false }); } // could not deliver: refund
    else c.due = now + 6 * HOUR;
  }
  store.save();
}
function startCapsuleScheduler(client) {
  const tick = () => deliverCapsules(client).catch((err) => console.error('[capsule]', err.message));
  setTimeout(tick, 20000).unref();
  setInterval(tick, 5 * 60000).unref();
}

// ---------------------------------------------------------------- vault
const vaultOf = (a, b) => { const c = getCouple(a, b); if (!c.vault) c.vault = { lp: 0, in: {} }; return c.vault; };
// Vaults of couples that are no longer together (for /us split)
function exVaults(id) {
  const db = store.db();
  const out = [];
  const myPartner = partnerId(id);
  for (const [key, c] of Object.entries(db.couples)) {
    const [x, y] = key.split(':');
    if (x !== id && y !== id) continue;
    const other = x === id ? y : x;
    if (c.vault && c.vault.lp > 0 && other !== myPartner) out.push({ key, other, c });
  }
  return out;
}
async function vaultView(interaction) {
  const id = interaction.user.id;
  const p = partnerId(id);
  const exes = exVaults(id);
  if (!p && !exes.length) return needPartner(interaction);
  let desc = '';
  if (p) {
    const v = vaultOf(id, p);
    const mine = v.in[id] || 0; const theirs = v.in[p] || 0;
    desc += `${e('lock')} **${interaction.user.displayName} & <@${p}>'s vault**\n${E.lp(v.lp)} saved\nYou put in **${num(mine)}** · they put in **${num(theirs)}**\n-# Safe from /rob. \`/us deposit\` adds, \`/us withdraw\` needs your partner to approve.`;
  }
  if (exes.length) desc += `${desc ? '\n\n' : ''}${e('heartbreak')} Old shared vault(s) from a past relationship: ${exes.map((x) => `<@${x.other}> (${E.lp(x.c.vault.lp)})`).join(', ')}.\nUse \`/us split\` to share it 50/50.`;
  return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('bank')} Couple vault`).setDescription(desc)], allowedMentions: { parse: [] } });
}
async function vaultDeposit(interaction) {
  const id = interaction.user.id;
  const p = await needPartner(interaction);
  if (!p) return;
  const u = store.user(id);
  const amount = E.parseAmount(interaction.options.getString('amount', true), u.lp);
  if (!Number.isFinite(amount) || amount < U.vaultMinDeposit) return interaction.reply({ content: `Deposit at least **${U.vaultMinDeposit} LP** (a number, \`half\` or \`all\`).`, flags: EPH });
  if (!E.pay(id, amount)) return interaction.reply({ content: `You only have **${num(u.lp)} LP**.`, flags: EPH });
  const v = vaultOf(id, p);
  v.lp += amount; v.in[id] = (v.in[id] || 0) + amount;
  addCoupleXp(id, p, Math.min(20, Math.floor(amount / 50)));
  store.save();
  return interaction.reply({ embeds: [embed(COLORS.green).setTitle(`${e('bank')} Deposited`).setDescription(`You put ${E.lp(amount)} into your shared vault.\nVault total: ${E.lp(v.lp)}`)] });
}
async function vaultWithdraw(interaction) {
  const id = interaction.user.id;
  const p = await needPartner(interaction);
  if (!p) return;
  const v = vaultOf(id, p);
  const amount = E.parseAmount(interaction.options.getString('amount', true), v.lp);
  if (!Number.isFinite(amount) || amount < 1) return interaction.reply({ content: 'Say how much: a number, `half` or `all`.', flags: EPH });
  if (amount > v.lp) return interaction.reply({ content: `The vault only has **${num(v.lp)} LP**.`, flags: EPH });
  return ask(interaction, {
    to: p,
    content: `<@${p}>, ${interaction.user} wants to take ${E.lp(amount)} out of your shared vault. Do you approve?`,
    yes: 'Approve', no: 'Decline', yesEmoji: '✅', noEmoji: '✖️',
    onYes: async (i) => {
      const vv = vaultOf(id, p);
      if (partnerId(id) !== p) return i.update({ content: 'You are not together anymore. Use `/us split`.', components: [] });
      if (amount > vv.lp) return i.update({ content: 'The vault does not have that much anymore.', components: [] });
      vv.lp -= amount;
      E.earn(id, amount, { boost: false, hard: false });
      return i.update({ content: `${e('check')} Approved! <@${id}> took ${E.lp(amount)}. Vault left: ${E.lp(vv.lp)}`, components: [] });
    },
    onNo: (i) => i.update({ content: `${e('cross')} <@${p}> declined the withdrawal.`, components: [] }),
    expiredText: '⏳ Your partner did not answer, so nothing was taken.',
  });
}
async function vaultSplit(interaction) {
  const id = interaction.user.id;
  const list = exVaults(id);
  if (!list.length) return interaction.reply({ content: 'You have no old shared vault to split. (A vault of a current partner cannot be split, use `/us withdraw`.)', flags: EPH });
  const lines = [];
  for (const x of list) {
    const total = x.c.vault.lp;
    const half = Math.floor(total / 2);
    x.c.vault.lp = 0; x.c.vault.in = {};
    E.earn(id, total - half, { boost: false, hard: false }); // the one who runs it gets the odd coin
    E.earn(x.other, half, { boost: false, hard: false });
    lines.push(`${e('coin')} <@${x.other}> and you: **${num(total - half)}** / **${num(half)}** LP`);
  }
  store.save();
  return interaction.reply({ embeds: [embed(COLORS.orange).setTitle(`${e('bank')} Vault split`).setDescription(`The shared vault was shared fairly:\n${lines.join('\n')}`)], allowedMentions: { parse: [] } });
}

const us = {
  data: command('us', 'Just for couples: love spark streak, time capsules and a shared vault 💞')
    .addSubcommand((s) => s.setName('spark').setDescription('Keep your love spark alive: you both have to press it'))
    .addSubcommand((s) => s.setName('capsule').setDescription(`Seal a message that Yuna DMs later (${U.capsuleCost} LP)`)
      .addIntegerOption((o) => o.setName('days').setDescription('Arrives in how many days? (1-365)').setRequired(true).setMinValue(1).setMaxValue(U.capsuleMaxDays))
      .addStringOption((o) => o.setName('message').setDescription('What should it say?').setRequired(true).setMaxLength(U.capsuleMaxChars))
      .addStringOption((o) => o.setName('to').setDescription('Who gets it? (default: your partner)').addChoices({ name: 'My partner', value: 'partner' }, { name: 'Me, in the future', value: 'me' })))
    .addSubcommand((s) => s.setName('capsules').setDescription('See your sealed time capsules'))
    .addSubcommand((s) => s.setName('vault').setDescription('See your shared couple vault'))
    .addSubcommand((s) => s.setName('deposit').setDescription('Put LP into the shared vault').addStringOption((o) => o.setName('amount').setDescription('A number, half or all').setRequired(true)))
    .addSubcommand((s) => s.setName('withdraw').setDescription('Take LP out (your partner must approve)').addStringOption((o) => o.setName('amount').setDescription('A number, half or all').setRequired(true)))
    .addSubcommand((s) => s.setName('split').setDescription('After a breakup: share the old vault 50/50')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'spark') return doSpark(interaction);
    if (sub === 'capsule') return doCapsule(interaction);
    if (sub === 'capsules') return listCapsules(interaction);
    if (sub === 'vault') return vaultView(interaction);
    if (sub === 'deposit') return vaultDeposit(interaction);
    if (sub === 'withdraw') return vaultWithdraw(interaction);
    return vaultSplit(interaction);
  },
};

module.exports = { commands: [us], startCapsuleScheduler, deliverCapsules };
