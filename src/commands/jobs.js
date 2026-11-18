// Careers: /work (shift), /job (list, apply, info, promote, study, quit), /office (desk tasks, meetings, overtime...).
const store = require('../store');
const B = require('../data/balance');
const X = require('../data/extra');
const { RANKS, EDU, JOBS, LINES } = require('../data/careers');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EPH, pick, rand, chance, command, embed, num, fmtDur, daysSince } = require('../lib/util');

const jobOf = (id) => JOBS.find((j) => j.id === id);
const nextRank = (x) => RANKS[x.job.rank + 1] || null;
const rankInfo = (x) => RANKS[x.job.rank];
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const findJob = (t) => { const n = norm(t); return JOBS.find((j) => j.id === n || norm(j.name) === n) || JOBS.find((j) => norm(j.name).startsWith(n)); };
const tag = (j) => `${e(j.icon)} **${j.name}**`;
const eduName = (x) => EDU[x.edu].n;

// Pay for one shift of the person's job, with rank, perks and buffs.
function shiftPay(x, job) {
  const base = rand(job.pay[0], job.pay[1]);
  let m = RANKS[x.job.rank].m;
  if (job.id === 'ceo') m *= 1 + 0.05 * x.job.rank;
  if (x.buffUntil && x.buffUntil > Date.now()) m *= 1.2;
  return Math.max(1, Math.floor(base * m * B.jobs.payMult));
}

function progress(x) {
  const nx = nextRank(x);
  if (!nx) return `${E.meter(100)} **MAX RANK**`;
  const cur = rankInfo(x);
  const pct = ((x.job.xp - cur.xp) / (nx.xp - cur.xp)) * 100;
  return `${E.meter(pct)} ${num(x.job.xp)} / ${num(nx.xp)} XP to **${nx.n}**`;
}

// ======================================================================= /work
const work = {
  data: command('work', 'Work a shift at your job (or a freelance gig) to earn Love Points'),
  async execute(interaction) {
    const id = interaction.user.id;
    if (await E.jailed(interaction)) return;
    const x = E.eco(id);
    if (!x.job) {
      const left = E.cdLeft(id, 'work', 3600000);
      if (left) return interaction.reply({ content: `${e('clock')} Your freelance gig is done. More work ${E.rel(Date.now() + left)}. Get a real job with \`/job list\`!`, flags: EPH });
      E.cdStart(id, 'work');
      const got = E.earn(id, rand(15, 45));
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('briefcase_gold')} Freelance gig`, `${interaction.user} ${pick(X.workLines)} and earned ${E.lp(got)}.\n\n-# No job yet. \`/job list\` shows careers with way better pay.`)] });
    }
    const job = jobOf(x.job.id);
    const cd = job.cd * 60000;
    const left = E.cdLeft(id, 'jobwork', cd);
    if (left) return interaction.reply({ content: `${e('clock')} Your next **${job.name}** shift starts ${E.rel(Date.now() + left)}.`, flags: EPH });
    E.cdStart(id, 'jobwork');

    let pay = shiftPay(x, job);
    let event = '';
    const r = Math.random();
    if (r < 0.08) { pay = Math.floor(pay * 1.5); event = `\n${e('a_twinkle_gold')} A customer left a huge tip! **+50%**`; }
    else if (r < 0.14) { pay = Math.floor(pay * 0.75); event = `\n${e('face_nervous')} You made a small mistake and got docked. **-25%**`; }
    else if (r < 0.17) { pay = pay * 3; event = `\n${e('a_crown_gold')} **Employee of the month!** Triple pay.`; }
    if (job.id === 'busker' || job.id === 'streamer') { pay = Math.max(3, Math.floor(pay * (0.2 + Math.random() * 2.2))); }
    const got = E.earn(id, pay);
    const xpGain = rand(8, 16);
    x.job.xp += xpGain; x.job.shifts += 1; x.st.shifts += 1;
    store.save();
    const nx = nextRank(x);
    const ready = nx && x.job.xp >= nx.xp;
    const line = pick(LINES[job.field] || X.workLines);
    return interaction.reply({
      embeds: [E.card(COLORS.green, `${e(job.icon)} Shift complete: ${job.name}`,
        `${interaction.user} ${line} and earned ${E.lp(got)}.${event}\n\n${e('star_gold')} **${rankInfo(x).n}** · +${xpGain} XP\n${progress(x)}${ready ? `\n${e('a_tag_win')} **You can be promoted!** Use \`/job promote\`.` : ''}`)],
    });
  },
};

// ======================================================================= /job
const jobOpt = (o) => o.setName('job').setDescription('Which job?').setRequired(true).setAutocomplete(true);
const job = {
  data: command('job', 'Careers: find a job, get promoted, study, quit')
    .addSubcommand((s) => s.setName('list').setDescription('Browse all jobs').addIntegerOption((o) => o.setName('education').setDescription('Only jobs for this education level (0-4)').setMinValue(0).setMaxValue(4)))
    .addSubcommand((s) => s.setName('apply').setDescription('Apply for a job').addStringOption(jobOpt))
    .addSubcommand((s) => s.setName('info').setDescription('See a career card').addUserOption((o) => o.setName('user').setDescription('Whose career? (default: you)')))
    .addSubcommand((s) => s.setName('promote').setDescription('Ask for a promotion when you have enough XP'))
    .addSubcommand((s) => s.setName('study').setDescription('Study for the next education level (every 20 minutes)'))
    .addSubcommand((s) => s.setName('quit').setDescription('Leave your job')),
  async autocomplete(interaction) {
    const q = norm(interaction.options.getFocused());
    const x = E.eco(interaction.user.id);
    const hits = JOBS.filter((j) => j.edu <= x.edu && (!q || norm(j.name).includes(q))).slice(0, 25);
    return interaction.respond(hits.map((j) => ({ name: `${j.name} (${j.pay[0]}-${j.pay[1]} LP/shift)`.slice(0, 100), value: j.id })));
  },
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const x = E.eco(id);

    if (sub === 'list') {
      const lvl = interaction.options.getInteger('education');
      const out = [];
      for (let k = 0; k < EDU.length; k++) {
        if (lvl !== null && lvl !== k) continue;
        const lines = JOBS.filter((j) => j.edu === k).map((j) => `${e(j.icon)} **${j.name}** · ${j.pay[0]}-${j.pay[1]} LP · every ${j.cd}m${j.note ? `\n-# ${j.note}` : ''}`);
        if (lines.length) out.push({ name: `${k === x.edu ? e('check') : k < x.edu ? e('check') : e('lock')} ${EDU[k].n}`, value: lines.join('\n').slice(0, 1024) });
      }
      return interaction.reply({ embeds: [embed(COLORS.gold).setTitle(`${e('briefcase_gold')} Yuna job center`).setDescription(`You have: **${eduName(x)}**.\nApply with \`/job apply\`, work with \`/work\`, level up with \`/job study\`.\nPay is per shift at Junior rank, and grows with each promotion up to **6.5x**.`).addFields(out)] });
    }

    if (sub === 'info') {
      const who = interaction.options.getUser('user') || interaction.user;
      if (who.bot) return interaction.reply({ content: 'Bots work for free.', flags: EPH });
      const wx = E.eco(who.id);
      if (!wx.job) return interaction.reply({ content: `${e('briefcase_gold')} ${who.id === id ? 'You are' : `${who.displayName} is`} unemployed. \`/job list\``, flags: EPH });
      const j = jobOf(wx.job.id);
      return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e(j.icon)} ${who.displayName}'s career`).setDescription(
        `Job: ${tag(j)}\nRank: **${RANKS[wx.job.rank].n}** (${RANKS[wx.job.rank].m}x pay)\n${progress(wx)}\n\nShifts worked: **${num(wx.job.shifts)}**\nEducation: **${eduName(wx)}**\nEmployed for: **${daysSince(wx.job.since)}** day(s)\nLifetime earnings: ${E.lp(wx.earned)}`)] });
    }

    if (sub === 'apply') {
      const j = findJob(interaction.options.getString('job', true));
      if (!j) return interaction.reply({ content: `${e('cross')} I could not find that job. Try \`/job list\`.`, flags: EPH });
      if (j.edu > x.edu) return interaction.reply({ content: `${e('lock')} **${j.name}** needs a **${EDU[j.edu].n}**. You have **${eduName(x)}**. Use \`/job study\`.`, flags: EPH });
      if (x.job && x.job.id === j.id) return interaction.reply({ content: `You already work as a ${j.name}.`, flags: EPH });
      const left = E.cdLeft(id, 'jobswitch', 3600000);
      if (x.job && left) return interaction.reply({ content: `${e('clock')} You can switch jobs again ${E.rel(Date.now() + left)}.`, flags: EPH });
      let rank = 0;
      if (x.job && jobOf(x.job.id).field === j.field) rank = Math.max(0, x.job.rank - 1);
      x.job = { id: j.id, rank, xp: RANKS[rank].xp, shifts: 0, since: Date.now() };
      E.cdStart(id, 'jobswitch');
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('confetti')} You're hired!`, `${interaction.user} is now a **${RANKS[rank].n}** ${tag(j)}.\nPay: **${j.pay[0]}-${j.pay[1]} LP** per shift (x${RANKS[rank].m}). Start with \`/work\`.${rank ? '\n-# Your experience in this field carried over.' : ''}`)] });
    }

    if (sub === 'promote') {
      if (!x.job) return interaction.reply({ content: `${e('cross')} You need a job first. \`/job list\``, flags: EPH });
      const nx = nextRank(x);
      if (!nx) return interaction.reply({ content: `${e('crown_gold')} You are already at the top rank.`, flags: EPH });
      if (x.job.xp < nx.xp) return interaction.reply({ content: `${e('cross')} You need **${num(nx.xp - x.job.xp)}** more XP for **${nx.n}**. Keep working!`, flags: EPH });
      x.job.rank += 1;
      const bonus = B.jobs.promoBase * x.job.rank * x.job.rank;
      const got = E.earn(id, bonus, { boost: false });
      let gem = 0;
      if (x.job.rank >= 4) { gem = x.job.rank - 2; E.addGems(id, gem); }
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.gold, `${e('a_tag_win')} Promotion!`, `${interaction.user} is now a **${RANKS[x.job.rank].n}** ${tag(jobOf(x.job.id))}!\nNew pay multiplier: **${RANKS[x.job.rank].m}x**\nPromotion bonus: ${E.lp(got)}${gem ? `\nGems: ${E.gems(gem)}` : ''}`)] });
    }

    if (sub === 'study') {
      if (x.edu >= EDU.length - 1) return interaction.reply({ content: `${e('trophy_gold')} You already hold a **${eduName(x)}**. Nothing left to study!`, flags: EPH });
      const nxt = EDU[x.edu + 1];
      const left = E.cdLeft(id, 'study', 20 * 60000);
      if (left) return interaction.reply({ content: `${e('clock')} Your brain needs a break. Study again ${E.rel(Date.now() + left)}.`, flags: EPH });
      if (!E.pay(id, nxt.cost)) return interaction.reply({ content: `${e('cross')} A study session toward the **${nxt.n}** costs **${num(nxt.cost)} LP**.`, flags: EPH });
      E.cdStart(id, 'study');
      x.study += 1;
      let msg = `${e('letter')} You studied hard for the **${nxt.n}**.\n${E.meter((x.study / nxt.sessions) * 100)} ${x.study}/${nxt.sessions} sessions`;
      if (x.study >= nxt.sessions) { x.edu += 1; x.study = 0; msg = `${e('confetti')} **You graduated!** You now hold a **${nxt.n}**.\nNew jobs are open to you: \`/job list education:${x.edu}\``; }
      store.save();
      return interaction.reply({ embeds: [E.card(COLORS.purple, `${e('misc_brain')} Study session`, `${msg}\n-# Cost: ${num(nxt.cost)} LP`)] });
    }

    // quit
    if (!x.job) return interaction.reply({ content: 'You do not have a job.', flags: EPH });
    const old = jobOf(x.job.id);
    x.job = null;
    store.save();
    return interaction.reply({ content: `${e('briefcase_gold')} You quit your job as a **${old.name}**. Good luck out there!` });
  },
};

// ======================================================================= /office
// Buttons helper: shows a prompt with answers, resolves with the clicked index (or -1 after the timeout).
async function ask(interaction, embedObj, labels, ms = 25000) {
  const row = new ActionRowBuilder().addComponents(labels.map((l, i) => new ButtonBuilder().setCustomId(`of:${interaction.user.id}:${Date.now()}:${i}`).setLabel(String(l).slice(0, 80)).setStyle(ButtonStyle.Secondary)));
  await interaction.reply({ embeds: [embedObj], components: [row] });
  const msg = await interaction.fetchReply();
  try {
    const click = await msg.awaitMessageComponent({ filter: (c) => c.user.id === interaction.user.id && c.customId.startsWith('of:'), time: ms });
    await click.deferUpdate().catch(() => {});
    const idx = Number(click.customId.split(':')[3]);
    row.components.forEach((b, i) => b.setDisabled(true).setStyle(i === idx ? ButtonStyle.Primary : ButtonStyle.Secondary));
    await interaction.editReply({ components: [row] }).catch(() => {});
    return { idx, msg };
  } catch {
    row.components.forEach((b) => b.setDisabled(true));
    await interaction.editReply({ components: [row] }).catch(() => {});
    return { idx: -1, msg };
  }
}

const needJob = (i, x) => {
  if (x.job) return false;
  i.reply({ content: `${e('briefcase_gold')} The office is for employees. Get a job with \`/job list\` first.`, flags: EPH });
  return true;
};
const gainXp = (x, n) => { x.job.xp += n; store.save(); };

const office = {
  data: command('office', 'Office life: tasks, meetings, overtime, coffee and networking')
    .addSubcommand((s) => s.setName('desk').setDescription('See your desk, rank and buffs'))
    .addSubcommand((s) => s.setName('task').setDescription('Finish a desk task for pay and XP (every 15 minutes)'))
    .addSubcommand((s) => s.setName('meeting').setDescription('Survive a meeting (every 45 minutes)'))
    .addSubcommand((s) => s.setName('overtime').setDescription('Work late for double pay, but you might burn out (every 2 hours)'))
    .addSubcommand((s) => s.setName('coffee').setDescription('Buy a coffee for a +20% pay buff for 1 hour (25 LP)'))
    .addSubcommand((s) => s.setName('networking').setDescription('Schmooze for XP and a chance at a raise (every 3 hours)')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const x = E.eco(id);
    if (await E.jailed(interaction)) return;
    if (needJob(interaction, x)) return;
    const j = jobOf(x.job.id);
    const r = RANKS[x.job.rank];
    const avg = ((j.pay[0] + j.pay[1]) / 2) * r.m * B.jobs.payMult;

    if (sub === 'desk') {
      const buff = x.buffUntil && x.buffUntil > Date.now();
      return interaction.reply({ embeds: [embed(COLORS.purple).setTitle(`${e('briefcase_gold')} ${interaction.user.displayName}'s desk`).setDescription(
        `${tag(j)} · **${r.n}**\n${progress(x)}\n\nShifts: **${num(x.job.shifts)}** · Education: **${eduName(x)}**\n${buff ? `${e('a_potion_pink')} Coffee buff active ${E.rel(x.buffUntil)}` : `${e('cocktail_orange_pink')} No coffee buff. \`/office coffee\``}\n\n\`/work\` shift · \`/office task\` · \`/office meeting\` · \`/office overtime\` · \`/office networking\``)] });
    }
    if (sub === 'coffee') {
      if (x.buffUntil && x.buffUntil > Date.now()) return interaction.reply({ content: `${e('cocktail_orange_pink')} You are already caffeinated ${E.rel(x.buffUntil)}.`, flags: EPH });
      if (!E.pay(id, 25)) return interaction.reply({ content: `${e('cross')} Coffee costs **25 LP**.`, flags: EPH });
      x.buffUntil = Date.now() + 3600000; store.save();
      return interaction.reply({ embeds: [E.card(COLORS.orange, `${e('cocktail_orange_pink')} Coffee break`, `You bought a strong coffee. **+20% shift pay** for 1 hour.`)] });
    }
    if (sub === 'task') {
      const left = E.cdLeft(id, 'oftask', B.office.taskCdMs);
      if (left) return interaction.reply({ content: `${e('clock')} Your inbox is empty. New tasks ${E.rel(Date.now() + left)}.`, flags: EPH });
      E.cdStart(id, 'oftask');
      const a = rand(12, 99); const b = rand(3, 40);
      const op = pick(['+', '-', 'x']);
      const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
      const opts = new Set([ans]);
      while (opts.size < 3) opts.add(ans + pick([-10, -3, -2, -1, 1, 2, 3, 10, 11]));
      const list = [...opts].sort(() => Math.random() - 0.5);
      const { idx } = await ask(interaction, embed(COLORS.purple).setTitle(`${e('misc_brain')} Desk task`).setDescription(`Your boss wants the numbers fixed. What is **${a} ${op} ${b}**?`), list, 20000);
      if (idx === -1) return interaction.followUp({ content: `${e('clock')} Too slow. The task was handed to someone else.` });
      if (list[idx] !== ans) return interaction.followUp({ content: `${e('cross')} Wrong! It was **${ans}**. No pay for sloppy work.` });
      const got = E.earn(id, avg * B.office.taskMult * (0.8 + Math.random() * 0.5));
      const xp = rand(10, 18); gainXp(x, xp);
      return interaction.followUp({ embeds: [E.card(COLORS.green, `${e('check')} Task done`, `Correct! You earned ${E.lp(got)} and **+${xp} XP**.\n${progress(x)}`)] });
    }
    if (sub === 'meeting') {
      const left = E.cdLeft(id, 'ofmeet', 45 * 60000);
      if (left) return interaction.reply({ content: `${e('clock')} No meetings on the calendar. Next one ${E.rel(Date.now() + left)}.`, flags: EPH });
      E.cdStart(id, 'ofmeet');
      const { idx } = await ask(interaction, embed(COLORS.purple).setTitle(`${e('misc_masks')} The big meeting`).setDescription('Your manager asks who wants to lead the new project. Everyone stares at you.'), ['Volunteer boldly', 'Stay quiet', 'Take credit for a coworker\'s idea'], 20000);
      if (idx === -1) return interaction.followUp({ content: 'You froze and missed the meeting entirely.' });
      if (idx === 0) {
        if (chance(0.65)) { const g = E.earn(id, avg * B.office.meetingWin); gainXp(x, 28); return interaction.followUp({ embeds: [E.card(COLORS.green, `${e('a_tag_win')} You nailed it`, `The project is yours. Bonus ${E.lp(g)} and **+28 XP**.`)] }); }
        const f = Math.min(store.user(id).lp, Math.floor(avg * 0.4)); E.pay(id, f);
        return interaction.followUp({ embeds: [E.card(COLORS.red, `${e('face_shocked')} Over-promised`, `You could not deliver and lost ${E.lp(f)}.`)] });
      }
      if (idx === 1) { gainXp(x, 6); return interaction.followUp({ content: `${e('face_relieved')} You stayed safe. **+6 XP**.` }); }
      if (chance(0.3)) { const g = E.earn(id, avg * B.office.meetingSneak); gainXp(x, 40); return interaction.followUp({ embeds: [E.card(COLORS.gold, `${e('face_smirk')} Nobody noticed`, `The boss loved it. Huge bonus ${E.lp(g)} and **+40 XP**.`)] }); }
      x.job.xp = Math.max(RANKS[x.job.rank].xp, x.job.xp - 60); store.save();
      return interaction.followUp({ embeds: [E.card(COLORS.red, `${e('face_angry')} Busted`, 'Your coworker spoke up. HR got involved. **-60 XP**.')] });
    }
    if (sub === 'overtime') {
      const left = E.cdLeft(id, 'ofot', 2 * 3600000);
      if (left) return interaction.reply({ content: `${e('clock')} You need to rest. Overtime again ${E.rel(Date.now() + left)}.`, flags: EPH });
      E.cdStart(id, 'ofot');
      if (chance(0.25)) { const f = Math.min(store.user(id).lp, Math.floor(avg * 0.5)); E.pay(id, f); return interaction.reply({ embeds: [E.card(COLORS.red, `${e('face_tired')} Burnout`, `You worked until 3am, fell asleep on your keyboard and paid ${E.lp(f)} in medical bills.`)] }); }
      const g = E.earn(id, avg * B.office.overtime); const xp = rand(18, 30); gainXp(x, xp);
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('misc_bolt')} Overtime`, `Late night at the office paid off: ${E.lp(g)} and **+${xp} XP**.`)] });
    }
    // networking
    const left = E.cdLeft(id, 'ofnet', 3 * 3600000);
    if (left) return interaction.reply({ content: `${e('clock')} You already shook enough hands. Try again ${E.rel(Date.now() + left)}.`, flags: EPH });
    E.cdStart(id, 'ofnet');
    const xp = rand(30, 70); gainXp(x, xp);
    if (chance(0.2)) { const g = E.earn(id, avg * B.office.netRaise, { boost: false }); return interaction.reply({ embeds: [E.card(COLORS.gold, `${e('a_crown_gold')} A raise!`, `Someone important liked you. **+${xp} XP** and a ${E.lp(g)} signing bonus.`)] }); }
    return interaction.reply({ embeds: [E.card(COLORS.purple, `${e('misc_wave')} Networking`, `You met a lot of useful people. **+${xp} XP**.\n${progress(x)}`)] });
  },
};

module.exports = { commands: [work, job, office], jobOf, JOBS };
