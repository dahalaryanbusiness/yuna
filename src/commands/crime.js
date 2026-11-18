// Crime and police. Crimes raise your wanted stars (they fade 1 star / 20 min). Cops (Police Officer / Detective) can
// patrol for pay and arrest wanted players. Jail blocks work, crime, rob and the casino.
const store = require('../store');
const B = require('../data/balance');
const { JOBS } = require('../data/careers');
const { e } = require('../lib/emojis');
const E = require('../lib/eco');
const { COLORS, EPH, pick, rand, chance, command, embed, num, fmtDur, guardTarget } = require('../lib/util');

const isCop = (x) => x.job && JOBS.find((j) => j.id === x.job.id)?.police;
const isLawyer = (x) => x.job && x.job.id === 'lawyer';
const mins = (n) => n * 60000;

// Jail time in minutes, halved for lawyers.
function sendToJail(id, minutes) {
  const x = E.eco(id);
  const m = isLawyer(x) ? Math.ceil(minutes / 2) : minutes;
  x.jail = Math.max(x.jail, Date.now()) + mins(m);
  x.st.jailed += 1;
  store.save();
  return m;
}

// success chance, loot range, fine range, jail minutes, cooldown minutes, heat gained
const CRIMES = {
  shoplift:   { name: 'Shoplift',   icon: 'mask_ski_black',   ok: 0.62, loot: [30, 120],     fine: [30, 90],      jail: [3, 6],   cd: 8,  heat: 1, win: 'You slipped a few things in your hoodie and sold them.', lose: 'The store detective grabbed your sleeve.' },
  pickpocket: { name: 'Pickpocket', icon: 'hood_black',       ok: 0.55, loot: [60, 220],     fine: [50, 150],     jail: [4, 8],   cd: 10, heat: 1, win: 'A tourist never felt a thing.', lose: 'The tourist was an undercover cop.' },
  scam:       { name: 'Online scam', icon: 'bm_burner_phone', ok: 0.5,  loot: [150, 500],    fine: [100, 300],    jail: [6, 12],  cd: 15, heat: 2, win: 'Your fake "prince" email actually worked.', lose: 'Your victim called the cyber unit.' },
  smuggle:    { name: 'Smuggle',    icon: 'bm_contraband',    ok: 0.45, loot: [400, 1100],   fine: [250, 700],    jail: [10, 20], cd: 25, heat: 2, win: 'The crates crossed the border untouched.', lose: 'A sniffer dog found the stash.' },
  hack:       { name: 'Hack a bank', icon: 'bm_spy_eye',      ok: 0.38, loot: [1200, 3500],  fine: [800, 2000],   jail: [20, 40], cd: 45, heat: 3, win: 'You drained a dormant account in 40 seconds.', lose: 'The firewall traced you in seconds.' },
  heist:      { name: 'Art heist',  icon: 'bm_vault',         ok: 0.3,  loot: [4000, 12000], fine: [2500, 6000],  jail: [30, 60], cd: 90, heat: 4, win: 'You swapped the painting for a perfect fake.', lose: 'The laser grid caught you mid-air.' },
};

const crimeChoices = Object.entries(CRIMES).map(([k, v]) => ({ name: v.name, value: k }));

const crime = {
  data: command('crime', 'Crime and police: commit crimes, bail out, patrol and arrest')
    .addSubcommand((s) => s.setName('commit').setDescription('Commit a crime for quick LP (risky!)').addStringOption((o) => o.setName('type').setDescription('Which crime?').setRequired(true).addChoices(...crimeChoices)))
    .addSubcommand((s) => s.setName('status').setDescription('Your wanted level and jail time').addUserOption((o) => o.setName('user').setDescription('Check someone else')))
    .addSubcommand((s) => s.setName('bail').setDescription('Pay bail for yourself or someone else (50 LP per minute left)').addUserOption((o) => o.setName('user').setDescription('Who to bail out (default: you)')))
    .addSubcommand((s) => s.setName('escape').setDescription('Try to break out of jail (35% chance, failure adds time)'))
    .addSubcommand((s) => s.setName('bribe').setDescription('Bribe a cop to clear your wanted stars (300 LP per star)'))
    .addSubcommand((s) => s.setName('patrol').setDescription('Cops only: patrol the streets for pay and busts (every 30 minutes)'))
    .addSubcommand((s) => s.setName('arrest').setDescription('Cops only: arrest a wanted player (every 15 minutes)').addUserOption((o) => o.setName('user').setDescription('Who do you arrest?').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const x = E.eco(id);
    const u = store.user(id);

    if (sub === 'status') {
      const who = interaction.options.getUser('user') || interaction.user;
      if (who.bot) return interaction.reply({ content: 'Bots have a clean record.', flags: EPH });
      const wx = E.eco(who.id);
      const h = E.heat(who.id);
      const jl = E.jailLeft(who.id);
      const cop = isCop(wx);
      return interaction.reply({ embeds: [embed(jl ? COLORS.red : COLORS.grey).setTitle(`${e('bm_wanted')} ${who.displayName}'s record`).setDescription(
        `Wanted: ${E.stars(h)}\nStatus: ${jl ? `${e('bm_siren')} **In jail** ${E.rel(Date.now() + jl)}` : `${e('check')} Free`}\nCrimes: **${num(wx.st.crimes)}** · Times jailed: **${num(wx.st.jailed)}**${cop ? `\n${e('bm_siren_blue')} **Police** · Arrests: **${num(wx.st.arrests)}**` : ''}`)] });
    }

    if (sub === 'bail') {
      const who = interaction.options.getUser('user') || interaction.user;
      if (who.bot) return interaction.reply({ content: 'Bots never get arrested.', flags: EPH });
      const left = E.jailLeft(who.id);
      if (!left) return interaction.reply({ content: `${e('info')} ${who.id === id ? 'You are' : `${who.displayName} is`} not in jail.`, flags: EPH });
      const cost = Math.ceil(left / 60000) * 50;
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} Bail is **${num(cost)} LP** (50 per minute left). You have **${num(u.lp)}**.`, flags: EPH });
      E.eco(who.id).jail = 0; store.save();
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e('bm_handshake_deal')} Bail paid`, `${interaction.user} paid ${E.lp(cost)} and ${who.id === id ? 'walked out' : `${who} walked out`} of jail.`)] });
    }

    if (sub === 'escape') {
      const left = E.jailLeft(id);
      if (!left) return interaction.reply({ content: `${e('info')} You are not in jail.`, flags: EPH });
      const cd = E.cdLeft(id, 'escape', mins(10));
      if (cd) return interaction.reply({ content: `${e('clock')} The guards are watching you. Try again ${E.rel(Date.now() + cd)}.`, flags: EPH });
      E.cdStart(id, 'escape');
      if (chance(0.35)) { x.jail = 0; E.addHeat(id, 1); return interaction.reply({ embeds: [E.card(COLORS.green, `${e('bm_night_owl')} Great escape`, 'You slipped through a vent and vanished into the night. (+1 wanted star)')] }); }
      x.jail += mins(5); store.save();
      return interaction.reply({ embeds: [E.card(COLORS.red, `${e('a_siren')} Caught!`, 'The guards dragged you back. **+5 minutes** added.')] });
    }

    if (sub === 'bribe') {
      if (await E.jailed(interaction)) return;
      const h = E.heat(id);
      if (!h) return interaction.reply({ content: `${e('check')} You are not wanted.`, flags: EPH });
      const cost = h * 300;
      if (!E.pay(id, cost)) return interaction.reply({ content: `${e('cross')} Clearing ${h} star(s) costs **${num(cost)} LP**.`, flags: EPH });
      if (chance(0.7)) { x.heat = 0; store.save(); return interaction.reply({ embeds: [E.card(COLORS.green, `${e('bm_bribe')} Deal done`, `A ${e('bm_forged_id')} crooked cop wiped your record for ${E.lp(cost)}.`)] }); }
      return interaction.reply({ embeds: [E.card(COLORS.red, `${e('bm_bribe')} Bribe refused`, `The cop kept ${E.lp(cost)} and still remembers your face.`)] });
    }

    if (sub === 'patrol') {
      if (await E.jailed(interaction)) return;
      if (!isCop(x)) return interaction.reply({ content: `${e('bm_siren_blue')} Only **Police Officers** and **Detectives** can patrol. \`/job apply\``, flags: EPH });
      const left = E.cdLeft(id, 'patrol', B.crime.patrolCdMs);
      if (left) return interaction.reply({ content: `${e('clock')} Your next patrol ${E.rel(Date.now() + left)}.`, flags: EPH });
      E.cdStart(id, 'patrol');
      const rankMult = 1 + x.job.rank * 0.25;
      const basePay = Math.floor(rand(B.crime.patrolPay[0], B.crime.patrolPay[1]) * rankMult);
      const got = E.earn(id, basePay);
      let extra = '';
      if (chance(B.crime.patrolBonusChance)) { const b = E.earn(id, Math.floor(rand(B.crime.patrolBonus[0], B.crime.patrolBonus[1]) * rankMult)); x.st.busts += 1; extra = `\n${e('bm_siren_blue')} You caught a street thief and got a **${num(b)} LP** bonus.`; x.job.xp += 12; }
      x.job.xp += 6; store.save();
      return interaction.reply({ embeds: [E.card(COLORS.purple, `${e('bm_siren_blue')} Patrol`, `${interaction.user} walked the beat and earned ${E.lp(got)}.${extra}`)] });
    }

    if (sub === 'arrest') {
      if (await E.jailed(interaction)) return;
      if (!isCop(x)) return interaction.reply({ content: `${e('bm_siren_blue')} Only **Police Officers** and **Detectives** can arrest. \`/job apply\``, flags: EPH });
      const target = interaction.options.getUser('user', true);
      if (!(await guardTarget(interaction, target, { selfMsg: 'You cannot arrest yourself.', botMsg: 'Bots are above the law.' }))) return;
      const tx = E.eco(target.id);
      const th = E.heat(target.id);
      if (E.jailLeft(target.id)) return interaction.reply({ content: `${e('info')} ${target.displayName} is already behind bars.`, flags: EPH });
      if (!th) return interaction.reply({ content: `${e('check')} ${target.displayName} has a clean record. No wanted stars, no arrest.`, flags: EPH });
      if (target.id === id) return;
      const left = E.cdLeft(id, 'arrest', mins(15));
      if (left) return interaction.reply({ content: `${e('clock')} Paperwork first. Next arrest ${E.rel(Date.now() + left)}.`, flags: EPH });
      E.cdStart(id, 'arrest');
      const det = x.job.id === 'detective' ? 0.1 : 0;
      const chanceHit = Math.min(0.85, 0.25 + th * 0.12 + x.job.rank * 0.03 + det);
      if (!chance(chanceHit)) return interaction.reply({ content: `${target}`, embeds: [E.card(COLORS.orange, `${e('bm_night_alley')} They got away`, `${interaction.user} chased ${target} through the alleys but lost them.`)] });
      const fine = Math.min(store.user(target.id).lp, Math.min(3000, Math.floor(store.user(target.id).lp * 0.1)));
      if (fine) E.pay(target.id, fine);
      const minutes = sendToJail(target.id, 6 * th);
      tx.heat = 0; x.st.arrests += 1; x.job.xp += 20;
      const bounty = E.earn(id, B.crime.arrestBounty * th + Math.floor(fine / 2));
      store.save();
      return interaction.reply({ content: `${target}`, embeds: [E.card(COLORS.blue || 0x3b82f6, `${e('bm_siren_blue')} Arrested!`, `${interaction.user} arrested ${target}.\n${e('bm_siren')} Jail time: **${minutes} min**${fine ? ` · Fine: ${E.lp(fine)}` : ''}\nBounty for the officer: ${E.lp(bounty)}`)] });
    }

    // commit
    if (await E.jailed(interaction)) return;
    if (isCop(x)) return interaction.reply({ content: `${e('bm_siren_blue')} Officers do not commit crimes. Quit the force first (\`/job quit\`).`, flags: EPH });
    const c = CRIMES[interaction.options.getString('type', true)];
    const left = E.cdLeft(id, `crime_${c.name}`, mins(c.cd));
    if (left) return interaction.reply({ content: `${e('clock')} Lay low. You can try **${c.name.toLowerCase()}** again ${E.rel(Date.now() + left)}.`, flags: EPH });
    if (u.lp < c.fine[1] / 2) return interaction.reply({ content: `${e('cross')} Keep at least **${num(Math.floor(c.fine[1] / 2))} LP** in your wallet to cover a fine.`, flags: EPH });
    E.cdStart(id, `crime_${c.name}`);
    x.st.crimes += 1;
    const h = E.heat(id);
    // the more wanted you are, the harder it gets
    if (chance(Math.max(0.12, c.ok - h * 0.05))) {
      const loot = E.earn(id, Math.floor(rand(c.loot[0], c.loot[1]) * B.crime.lootMult));
      const stars = E.addHeat(id, c.heat);
      return interaction.reply({ embeds: [E.card(COLORS.green, `${e(c.icon)} ${c.name}: success`, `${c.win}\n${e('check')} You got away with ${E.lp(loot)}.\n${e('bm_wanted')} Wanted: ${E.stars(stars)}`)] });
    }
    const fine = Math.min(u.lp, rand(c.fine[0], c.fine[1]));
    E.pay(id, fine);
    E.addHeat(id, 1);
    let jail = '';
    if (chance(0.55 + h * 0.08)) jail = `\n${e('bm_siren')} You were locked up for **${sendToJail(id, rand(c.jail[0], c.jail[1]))} min**.`;
    return interaction.reply({ embeds: [E.card(COLORS.red, `${e('a_siren')} ${c.name}: busted`, `${c.lose}\n${e('cross')} Fine: ${E.lp(fine)}${jail}`)] });
  },
};

module.exports = { commands: [crime], CRIMES };
