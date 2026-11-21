// Yuna's SIGNATURE features: things no other bot has. Each one has its own custom emojis (Garden, Sky, Vault, Whisper,
// Aura, Mood, Ritual, Duet, Trust packs in assets/emojis, made by tools/make_unique_emojis.py).
//
//   /garden      grow flowers in your own plots, water other people's gardens, craft bouquets
//   /sky         your own night sky: place named stars, wish once a day (moon phase matters), couple constellations
//   /timelock    lock Love Points away until a date and earn a patience bonus (can be shared with your partner)
//   /whisper     anonymous kind messages in the channel; the receiver gets 2 guesses to find out who sent it
//   /duet        write a story together, one line each; finished stories go on both bookshelves
//   /aura        your aura of the day, a streak, and an aura match with anyone
//   /mood        set your weather; /mood forecast shows the emotional weather of the whole server
//   /ritual      couple habits (call every Sunday, goodnight text...) with streaks you BOTH have to keep
//   /trustedbots let a bot like Ommne run Yuna's text commands (allowlist, everyone else stays ignored)
const crypto = require('node:crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../store');
const U = require('../lib/util');
const E = require('../lib/eco');
const { e } = require('../lib/emojis');
const skin = require('../lib/skin');
const trust = require('../lib/trust');
const interactive = require('../lib/interactive');

const { command, embed, EPH, rand, pick, num, fmtDur, hash, guardTarget, isBlocked } = U;
const HOUR = 3600000;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------- helpers
const sig = (id) => { const u = store.user(id); if (!u.sig) u.sig = {}; return u.sig; };
const partnerOf = (id) => (store.user(id).rel && store.user(id).rel.partner) || null;
const clean = (t, max = 200) => String(t || '').replace(/https?:\/\/\S+|discord\.gg\/\S+/gi, '').replace(/<@[!&]?\d+>|@everyone|@here/g, '').replace(/[`*_~|>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const uid = () => crypto.randomBytes(4).toString('hex');
const rel = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
const isSlash = (i) => typeof i.isChatInputCommand === 'function';
const bar = (n, total, size = 10) => { const f = total ? Math.round((n / total) * size) : 0; return '▰'.repeat(f) + '▱'.repeat(size - f); };
const needGuild = async (i) => { if (i.guildId) return true; await i.reply({ content: `${e('cross')} Use this inside a server.`, flags: EPH }); return false; };

// ======================================================================== GARDEN
const FLOWERS = {
  tulip: { name: 'Tulip', cost: 20, sell: 32 },
  daisy: { name: 'Daisy', cost: 25, sell: 40 },
  lily: { name: 'Lily', cost: 40, sell: 64 },
  sunflower: { name: 'Sunflower', cost: 60, sell: 96 },
  orchid: { name: 'Orchid', cost: 90, sell: 144 },
  rose: { name: 'Rose', cost: 120, sell: 192 },
};
const FLOWER_CHOICES = Object.entries(FLOWERS).map(([value, f]) => ({ name: `${f.name} (${f.cost} LP)`, value }));
const WATER_CD = 90 * 60000; // each plant can be watered every 90 minutes
const WILT_MS = 36 * HOUR; // a plant nobody waters for 36 hours wilts
const EXPAND = { 4: 600, 5: 1800, 6: 5000 };

function garden(id) {
  const s = sig(id);
  if (!s.garden) s.garden = { slots: 3, plots: [null, null, null], stash: {} };
  const g = s.garden;
  while (g.plots.length < g.slots) g.plots.push(null);
  return g;
}
const plotState = (p) => (!p ? 'empty' : p.w >= 3 ? 'bloom' : Date.now() - p.last > WILT_MS ? 'wilted' : 'grow');
function plotEmoji(p) {
  const st = plotState(p);
  if (st === 'empty') return e('gd_pot');
  if (st === 'wilted') return e('gd_wilted');
  if (p.w >= 3) return e(`gd_bloom_${p.f}`);
  if (p.w === 2) return e(`gd_bud_${p.f}`);
  return p.w === 1 ? e('gd_sprout') : e('gd_seed');
}
function gardenCard(user) {
  const g = garden(user.id);
  const now = Date.now();
  const lines = g.plots.map((p, i) => {
    const st = plotState(p);
    if (st === 'empty') return `${plotEmoji(p)} **Plot ${i + 1}** · empty`;
    const F = FLOWERS[p.f];
    if (st === 'wilted') return `${plotEmoji(p)} **Plot ${i + 1}** · wilted ${F.name} (use \`/garden harvest\` to clear it)`;
    if (p.w >= 3) return `${plotEmoji(p)} **Plot ${i + 1}** · **${F.name}** in full bloom! Ready to harvest`;
    const stage = ['Seed', 'Sprout', 'Budding'][p.w];
    const ready = now - p.lw >= WATER_CD;
    return `${plotEmoji(p)} **Plot ${i + 1}** · ${F.name} ${stage} (${p.w}/3 waterings) · ${ready ? `${e('gd_drop')} thirsty!` : `water ${rel(p.lw + WATER_CD)}`}`;
  });
  const stash = Object.entries(g.stash).filter(([, n]) => n > 0).map(([f, n]) => `${e(`gd_bloom_${f}`)} ${FLOWERS[f].name} ×${n}`).join('  ') || '*nothing yet*';
  return embed(0x8bd88b)
    .setTitle(`${e('gd_pot')} ${user.displayName || user.username}'s garden`)
    .setDescription(`${lines.join('\n')}\n\n${e('gd_bouquet')} **Harvested blooms:** ${stash}`);
}

const garden_cmd = {
  data: command('garden', 'Grow flowers, water friends\' gardens and craft bouquets')
    .addSubcommand((s) => s.setName('view').setDescription('Look at a garden').addUserOption((o) => o.setName('user').setDescription('Whose garden? (default: yours)')))
    .addSubcommand((s) => s.setName('plant').setDescription('Plant a flower in a free plot')
      .addStringOption((o) => o.setName('flower').setDescription('Which flower?').setRequired(true).addChoices(...FLOWER_CHOICES))
      .addIntegerOption((o) => o.setName('plot').setDescription('Which plot? (default: first free one)').setMinValue(1).setMaxValue(6)))
    .addSubcommand((s) => s.setName('water').setDescription('Water a garden (every plant every 90 minutes)').addUserOption((o) => o.setName('user').setDescription('Water someone else\'s garden to help them')))
    .addSubcommand((s) => s.setName('harvest').setDescription('Pick every flower in bloom (and clear wilted ones)'))
    .addSubcommand((s) => s.setName('sell').setDescription('Sell harvested blooms for Love Points')
      .addStringOption((o) => o.setName('flower').setDescription('Only this flower (default: all)').addChoices(...FLOWER_CHOICES)))
    .addSubcommand((s) => s.setName('bouquet').setDescription('Craft a bouquet from 3 different blooms and give it to someone')
      .addUserOption((o) => o.setName('user').setDescription('Who gets it?').setRequired(true)))
    .addSubcommand((s) => s.setName('expand').setDescription('Buy another plot (up to 6)')),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;
    const g = garden(id);
    const now = Date.now();

    if (sub === 'view') {
      const t = i.options.getUser('user') || i.user;
      if (t.id !== id && !(await guardTarget(i, t, { allowSelf: true }))) return;
      return i.reply({ embeds: [gardenCard(t)] });
    }

    if (sub === 'plant') {
      const f = i.options.getString('flower', true);
      const F = FLOWERS[f];
      if (!F) return i.reply({ content: `${e('cross')} Unknown flower. Choose: ${Object.keys(FLOWERS).join(', ')}.`, flags: EPH });
      const want = i.options.getInteger('plot');
      let idx = want ? want - 1 : g.plots.findIndex((p) => !p);
      if (idx < 0 || idx >= g.plots.length) return i.reply({ content: `${e('cross')} All your plots are busy. Harvest, or \`/garden expand\`.`, flags: EPH });
      if (g.plots[idx]) return i.reply({ content: `${e('cross')} Plot ${idx + 1} already has a plant.`, flags: EPH });
      if (!E.pay(id, F.cost)) return i.reply({ content: `${e('cross')} A ${F.name} seed costs ${e('coin')} **${F.cost}**, you don't have enough.`, flags: EPH });
      g.plots[idx] = { f, w: 0, at: now, last: now, lw: 0 };
      store.save();
      return i.reply({ content: `${e('gd_seed')} **${i.user.displayName}** planted a **${F.name}** in plot ${idx + 1} for ${e('coin')} ${F.cost}. Water it 3 times to see it bloom! ${e('gd_watercan')}` });
    }

    if (sub === 'water') {
      const t = i.options.getUser('user') || i.user;
      const own = t.id === id;
      if (!own && !(await guardTarget(i, t))) return;
      const tg = garden(t.id);
      let n = 0; let bloomed = 0; let next = Infinity;
      for (const p of tg.plots) {
        if (!p || plotState(p) !== 'grow') continue;
        if (now - p.lw >= WATER_CD) { p.w += 1; p.lw = now; p.last = now; n += 1; if (p.w >= 3) bloomed += 1; } else next = Math.min(next, p.lw + WATER_CD);
      }
      store.save();
      if (!n) {
        const wait = Number.isFinite(next) ? `The next plant is thirsty ${rel(next)}.` : 'Nothing needs water right now (plant something with `/garden plant`).';
        return i.reply({ content: `${e('gd_drop')} ${own ? 'Your' : `${t.displayName || t.username}'s`} plants are all fine. ${wait}`, flags: EPH });
      }
      let extra = '';
      if (!own) {
        if (E.underCap(id, 'gwater', 8)) { const got = E.earn(id, 4); extra += ` You earned ${e('coin')} **${got}** for helping.`; }
        const p = partnerOf(id);
        if (p === t.id) { U.addCoupleXp(id, t.id, 3); extra += ' Your couple XP grew too.'; }
      }
      return i.reply({ content: `${e('gd_watercan')} **${i.user.displayName}** watered **${n}** plant${n > 1 ? 's' : ''} in ${own ? 'their own' : `${t}'s`} garden${bloomed ? ` and **${bloomed}** just bloomed! ${e('gd_bouquet')}` : '.'}${extra}`, allowedMentions: { parse: [] } });
    }

    if (sub === 'harvest') {
      let got = 0; let cleared = 0;
      g.plots = g.plots.map((p) => {
        const st = plotState(p);
        if (st === 'bloom') { g.stash[p.f] = (g.stash[p.f] || 0) + 1; got += 1; return null; }
        if (st === 'wilted') { cleared += 1; return null; }
        return p;
      });
      store.save();
      if (!got && !cleared) return i.reply({ content: `${e('gd_shears')} Nothing is ready yet. Keep watering!`, flags: EPH });
      return i.reply({ content: `${e('gd_shears')} **${i.user.displayName}** harvested **${got}** bloom${got === 1 ? '' : 's'}${cleared ? ` and cleared ${cleared} wilted plant${cleared > 1 ? 's' : ''}` : ''}. Sell them with \`/garden sell\` or craft a \`/garden bouquet\`.` });
    }

    if (sub === 'sell') {
      const only = i.options.getString('flower');
      let total = 0; let count = 0;
      for (const [f, n] of Object.entries(g.stash)) {
        if (!n || (only && only !== f)) continue;
        total += n * FLOWERS[f].sell; count += n; g.stash[f] = 0;
      }
      if (!count) return i.reply({ content: `${e('cross')} You have no harvested blooms${only ? ` of that kind` : ''}.`, flags: EPH });
      const got = E.earn(id, total, { hard: false, boost: false });
      return i.reply({ content: `${e('moneybag')} **${i.user.displayName}** sold **${count}** bloom${count > 1 ? 's' : ''} at the flower market for ${e('coin')} **${num(got)}**!` });
    }

    if (sub === 'bouquet') {
      const t = i.options.getUser('user', true);
      if (!(await guardTarget(i, t))) return;
      const kinds = Object.keys(g.stash).filter((f) => g.stash[f] > 0);
      if (kinds.length < 3) return i.reply({ content: `${e('cross')} A bouquet needs **3 different** harvested blooms. You have ${kinds.length} kind${kinds.length === 1 ? '' : 's'}.`, flags: EPH });
      const used = kinds.slice(0, 3);
      used.forEach((f) => { g.stash[f] -= 1; });
      const tu = store.user(t.id);
      tu.inv.bouquet = (tu.inv.bouquet || 0) + 1;
      store.save();
      let extra = '';
      if (partnerOf(id) === t.id) { U.addCoupleXp(id, t.id, 15); extra = '\n-# Your couple XP grew by 15.'; }
      return i.reply({ content: `${e('gd_bouquet')} **${i.user.displayName}** hand-picked a bouquet (${used.map((f) => e(`gd_bloom_${f}`)).join(' ')}) from their own garden and gave it to ${t}!${extra}`, allowedMentions: { users: [t.id] } });
    }

    if (sub === 'expand') {
      const next = g.slots + 1;
      if (next > 6) return i.reply({ content: `${e('check')} Your garden already has the maximum of 6 plots.`, flags: EPH });
      if (!E.pay(id, EXPAND[next])) return i.reply({ content: `${e('cross')} Plot ${next} costs ${e('coin')} **${num(EXPAND[next])}**.`, flags: EPH });
      g.slots = next; garden(id); store.save();
      return i.reply({ content: `${e('gd_pot')} Your garden grew to **${next} plots**!` });
    }
  },
};

// ======================================================================== SKY
const STAR_COLORS = { pink: 'sk_star_pink', blue: 'sk_star_blue', gold: 'sk_star_gold', violet: 'sk_star_violet', mint: 'sk_star_mint' };
const MOON = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
function moonPhase(d = new Date()) {
  const syn = 29.530588853;
  const days = (d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / DAY;
  const age = ((days % syn) + syn) % syn;
  return Math.floor((age / syn) * 8 + 0.5) % 8;
}
function skyOf(id, shared) {
  if (shared) {
    const p = partnerOf(id);
    if (!p) return null;
    const c = U.getCouple(id, p);
    if (!c.sky) c.sky = { stars: [], name: '' };
    return c.sky;
  }
  const s = sig(id);
  if (!s.sky) s.sky = { stars: [], name: '', wishAt: 0, wishes: [] };
  return s.sky;
}
function renderSky(sky, seed) {
  const R = 5; const C = 11; const cells = Array(R * C).fill(null); const used = new Set();
  (sky.stars || []).forEach((st, k) => {
    let pos = hash(`${seed}:${k}`) % (R * C); let tries = 0;
    while (used.has(pos) && tries++ < R * C) pos = (pos + 7) % (R * C);
    used.add(pos); cells[pos] = e(STAR_COLORS[st.c] || 'sk_star_gold');
  });
  const rows = [];
  for (let r = 0; r < R; r++) rows.push(cells.slice(r * C, r * C + C).map((c, k) => c || (hash(`${seed}d${r * C + k}`) % 11 === 0 ? '✦' : '⬛')).join(''));
  return rows.join('\n');
}
function skyCard(user, sky, shared, partnerUser) {
  const phase = moonPhase();
  const title = sky.name || (shared ? 'Our unnamed constellation' : 'Unnamed constellation');
  const names = (sky.stars || []).slice(-12).map((s) => `${e(STAR_COLORS[s.c] || 'sk_star_gold')} ${s.n}`).join('  ·  ') || '*no stars yet, place one with `/sky star`*';
  const em = embed(0x2b2d6e)
    .setTitle(`${e('sk_constellation')} ${title}`)
    .setDescription(`${renderSky(sky, shared ? `c${[user.id, partnerUser && partnerUser.id].sort().join('')}` : user.id)}\n\n${names}\n\n${(sky.stars || []).length} star${(sky.stars || []).length === 1 ? '' : 's'} · tonight: ${MOON[phase]}${shared ? ' · shared by two' : ''}`);
  if (!shared && sky.wishes && sky.wishes.length) em.addFields({ name: `${e('a_sk_wish')} Last wish`, value: `*${sky.wishes[sky.wishes.length - 1].t}*` });
  return em;
}

const sky_cmd = {
  data: command('sky', 'Your own night sky: named stars, daily wishes and couple constellations')
    .addSubcommand((s) => s.setName('view').setDescription('Look at a night sky')
      .addUserOption((o) => o.setName('user').setDescription('Whose sky? (default: yours)'))
      .addBooleanOption((o) => o.setName('shared').setDescription('Show the sky you share with your partner')))
    .addSubcommand((s) => s.setName('star').setDescription('Place a named star in your sky (costs Love Points)')
      .addStringOption((o) => o.setName('name').setDescription('Name of the star').setRequired(true).setMaxLength(24))
      .addStringOption((o) => o.setName('color').setDescription('Star colour').addChoices(...Object.keys(STAR_COLORS).map((c) => ({ name: c, value: c }))))
      .addBooleanOption((o) => o.setName('shared').setDescription('Place it in the sky you share with your partner')))
    .addSubcommand((s) => s.setName('name').setDescription('Name your constellation')
      .addStringOption((o) => o.setName('title').setDescription('The name').setRequired(true).setMaxLength(40))
      .addBooleanOption((o) => o.setName('shared').setDescription('Name the shared constellation')))
    .addSubcommand((s) => s.setName('wish').setDescription('Make a wish on a shooting star (once every 20 hours, new and full moon pay double)')
      .addStringOption((o) => o.setName('text').setDescription('Your wish (optional)').setMaxLength(100))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;

    if (sub === 'view') {
      const t = i.options.getUser('user') || i.user;
      const shared = Boolean(i.options.getBoolean('shared'));
      if (shared) {
        const p = partnerOf(t.id);
        if (!p) return i.reply({ content: `${e('cross')} A shared sky needs a relationship. Start one with \`/date\`.`, flags: EPH });
        const pu = await i.client.users.fetch(p).catch(() => ({ id: p, username: 'partner' }));
        return i.reply({ embeds: [skyCard(t, skyOf(t.id, true), true, pu)] });
      }
      if (t.id !== id && !(await guardTarget(i, t, { allowSelf: true }))) return;
      return i.reply({ embeds: [skyCard(t, skyOf(t.id, false), false)] });
    }

    if (sub === 'star') {
      const shared = Boolean(i.options.getBoolean('shared'));
      const sky = skyOf(id, shared);
      if (!sky) return i.reply({ content: `${e('cross')} You need a partner for a shared sky.`, flags: EPH });
      const name = clean(i.options.getString('name', true), 24);
      if (!name) return i.reply({ content: `${e('cross')} Give your star a name.`, flags: EPH });
      if (sky.stars.length >= 40) return i.reply({ content: `${e('sk_galaxy')} This sky is full (40 stars). Beautiful!`, flags: EPH });
      const cost = shared ? 60 + 15 * sky.stars.length : 30 + 8 * sky.stars.length;
      if (!E.pay(id, cost)) return i.reply({ content: `${e('cross')} This star costs ${e('coin')} **${num(cost)}**.`, flags: EPH });
      const c = STAR_COLORS[i.options.getString('color')] ? i.options.getString('color') : pick(Object.keys(STAR_COLORS));
      sky.stars.push({ n: name, c, at: Date.now(), by: id });
      store.save();
      let extra = '';
      if (shared) { U.addCoupleXp(id, partnerOf(id), 8); extra = ' Your couple XP grew.'; }
      return i.reply({ content: `${e(STAR_COLORS[c])} **${i.user.displayName}** placed a new star named **${name}** in ${shared ? 'the sky they share' : 'their sky'}.${extra}` });
    }

    if (sub === 'name') {
      const shared = Boolean(i.options.getBoolean('shared'));
      const sky = skyOf(id, shared);
      if (!sky) return i.reply({ content: `${e('cross')} You need a partner for a shared sky.`, flags: EPH });
      if (sky.stars.length < 3) return i.reply({ content: `${e('cross')} A constellation needs at least **3 stars** before it can be named.`, flags: EPH });
      sky.name = clean(i.options.getString('title', true), 40);
      store.save();
      return i.reply({ content: `${e('sk_constellation')} The constellation is now called **${sky.name}**.` });
    }

    if (sub === 'wish') {
      const left = E.cdLeft(id, 'skywish', 20 * HOUR);
      if (left) return i.reply({ content: `${e('sk_telescope')} The next shooting star passes in **${fmtDur(left)}**.`, flags: EPH });
      E.cdStart(id, 'skywish');
      const sky = skyOf(id, false);
      const text = clean(i.options.getString('text'), 100);
      if (text) { sky.wishes.push({ t: text, at: Date.now() }); sky.wishes = sky.wishes.slice(-5); }
      const phase = moonPhase();
      const mult = phase === 0 || phase === 4 ? 2 : 1;
      let lines = []; const r = Math.random();
      const lp = E.earn(id, rand(12, 35) * mult);
      lines.push(`${e('coin')} **+${num(lp)}** Love Points`);
      if (r < 0.2 && sky.stars.length < 40) { sky.stars.push({ n: 'Wish Star', c: 'gold', at: Date.now(), by: id }); lines.push(`${e('sk_star_gold')} a free **Wish Star** landed in your sky`); }
      else if (r > 0.95) { E.addGems(id, 1); lines.push(`${e('gem_pink')} **+1** gem fell from the tail`); }
      store.save();
      return i.reply({ embeds: [embed(0x2b2d6e).setTitle(`${e('a_sk_wish')} A shooting star!`).setDescription(`${text ? `*"${text}"*\n\n` : ''}${lines.join('\n')}\n\n-# ${e(`sk_moon_${phase}`)} ${MOON[phase]}${mult > 1 ? ' · double luck tonight!' : ''}`)] });
    }
  },
};

// ======================================================================== TIMELOCK
const VAULT_CAP = 250000;
const bonusFor = (amount, days) => Math.floor(amount * Math.min(0.3, 0.005 * (days / 7)));
const vaultsOf = (id) => { const s = sig(id); if (!s.vaults) s.vaults = []; return s.vaults; };

function vaultLine(v, k) {
  const done = Date.now() >= v.until;
  return `${done ? e('vt_unlock') : e('vt_lock')} **#${k + 1}** ${v.label ? `*${v.label}* · ` : ''}${e('coin')} **${num(v.amount)}**${v.joint ? ` ${e('heart_pink')} joint` : ''} · ${done ? `**ready!** (+${num(bonusFor(v.amount, v.days))} bonus)` : `opens ${rel(v.until)}`}`;
}
async function releaseVault(i, user, v, early) {
  const payout = early ? Math.floor(v.amount * 0.8) : v.amount + bonusFor(v.amount, v.days);
  const holders = v.joint ? [user.id, v.joint] : [user.id];
  const each = Math.floor(payout / holders.length);
  for (const h of holders) {
    const arr = vaultsOf(h); const k = arr.findIndex((x) => x.id === v.id);
    if (k >= 0) arr.splice(k, 1);
    U.award(h, each);
  }
  store.save();
  return { each, holders, payout };
}

const timelock_cmd = {
  data: command('timelock', 'Lock Love Points away until a date and earn a patience bonus')
    .addSubcommand((s) => s.setName('lock').setDescription('Lock Love Points (about +0.5% bonus per week locked, max +30%)')
      .addIntegerOption((o) => o.setName('amount').setDescription('How many LP? (min 100)').setRequired(true).setMinValue(100))
      .addIntegerOption((o) => o.setName('days').setDescription('For how many days? (1-365)').setRequired(true).setMinValue(1).setMaxValue(365))
      .addStringOption((o) => o.setName('label').setDescription('What are you saving for?').setMaxLength(30))
      .addBooleanOption((o) => o.setName('joint').setDescription('Share it with your partner (either of you can open it, the payout is split)')))
    .addSubcommand((s) => s.setName('view').setDescription('See your locked vaults'))
    .addSubcommand((s) => s.setName('open').setDescription('Open a vault (opening early costs 20% and no bonus)')
      .addIntegerOption((o) => o.setName('number').setDescription('Which vault? (see /timelock view)').setMinValue(1).setMaxValue(5))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;
    const vs = vaultsOf(id);

    if (sub === 'view') {
      if (!vs.length) return i.reply({ content: `${e('vt_vault')} You have no locked vaults. Start one with \`/timelock lock\`.`, flags: EPH });
      return i.reply({ embeds: [embed(0xb8c0d8).setTitle(`${e('vt_vault')} ${i.user.displayName}'s time vaults`).setDescription(`${vs.map(vaultLine).join('\n')}\n\n**${num(vs.reduce((a, v) => a + v.amount, 0))} LP** locked in total`)] });
    }

    if (sub === 'lock') {
      const amount = i.options.getInteger('amount', true);
      const days = i.options.getInteger('days', true);
      const joint = Boolean(i.options.getBoolean('joint'));
      const label = clean(i.options.getString('label'), 30);
      if (vs.length >= 5) return i.reply({ content: `${e('cross')} You can have 5 vaults at a time.`, flags: EPH });
      if (vs.reduce((a, v) => a + v.amount, 0) + amount > VAULT_CAP) return i.reply({ content: `${e('cross')} Vaults can hold ${num(VAULT_CAP)} LP in total.`, flags: EPH });
      const partner = partnerOf(id);
      if (joint && !partner) return i.reply({ content: `${e('cross')} A joint vault needs a partner.`, flags: EPH });
      if (joint && vaultsOf(partner).length >= 5) return i.reply({ content: `${e('cross')} Your partner's vault slots are full.`, flags: EPH });
      if (!E.pay(id, amount)) return i.reply({ content: `${e('cross')} You only have ${e('coin')} **${num(store.user(id).lp)}** in your wallet.`, flags: EPH });
      const v = { id: uid(), amount, days, until: Date.now() + days * DAY, label, joint: joint ? partner : null, at: Date.now() };
      vs.push(v);
      if (joint) vaultsOf(partner).push({ ...v, joint: id });
      store.save();
      return i.reply({ content: `${e('vt_lock')} **${i.user.displayName}** locked ${e('coin')} **${num(amount)}**${label ? ` for *${label}*` : ''}${joint ? ` together with <@${partner}>` : ''}. It opens ${rel(v.until)} with a **+${num(bonusFor(amount, days))}** patience bonus. ${e('vt_key')}`, allowedMentions: { parse: [] } });
    }

    if (sub === 'open') {
      if (!vs.length) return i.reply({ content: `${e('vt_vault')} You have no vaults.`, flags: EPH });
      let n = i.options.getInteger('number');
      let k = n ? n - 1 : vs.findIndex((v) => Date.now() >= v.until);
      if (k < 0) k = 0;
      const v = vs[k];
      if (!v) return i.reply({ content: `${e('cross')} No vault with that number. See \`/timelock view\`.`, flags: EPH });
      if (Date.now() >= v.until) {
        const r = await releaseVault(i, i.user, v, false);
        return i.reply({ content: `${e('vt_unlock')} **${i.user.displayName}** opened a vault: ${e('coin')} **${num(r.payout)}** total${r.holders.length > 1 ? `, ${num(r.each)} each for you and <@${v.joint}>` : ''}. Patience pays! ${e('sparkle')}`, allowedMentions: { parse: [] } });
      }
      return interactive.ask(i, {
        to: id, yes: 'Break it open', no: 'Keep it locked', yesEmoji: '🔓', noEmoji: '🔒',
        content: `${e('warn')} This vault isn't ready (${rel(v.until)}). Opening now returns only **80%** (${e('coin')} ${num(Math.floor(v.amount * 0.8))}) and no bonus. Break it?`,
        onYes: async (b) => {
          if (!vaultsOf(id).some((x) => x.id === v.id)) return b.update({ content: `${e('cross')} That vault is already gone.`, components: [] });
          const r = await releaseVault(i, i.user, v, true);
          return b.update({ content: `${e('vt_unlock')} Vault broken open early: ${e('coin')} **${num(r.payout)}** paid out${r.holders.length > 1 ? ` (split with <@${v.joint}>)` : ''}.`, components: [], allowedMentions: { parse: [] } });
        },
        onNo: (b) => b.update({ content: `${e('vt_lock')} Good choice, the vault stays locked.`, components: [] }),
      });
    }
  },
};

// ======================================================================== WHISPER
const WHISPER_COST = 15;
function pruneWhispers() {
  const db = store.db(); db.whispers ||= {};
  for (const [k, w] of Object.entries(db.whispers)) if (Date.now() - w.at > 7 * DAY) delete db.whispers[k];
  return db.whispers;
}
const whisperButtons = (id) => [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`yu:ws:${id}:g`).setLabel('Guess who sent it').setStyle(ButtonStyle.Primary).setEmoji('🎭'),
  new ButtonBuilder().setCustomId(`yu:ws:${id}:b`).setLabel('Block sender').setStyle(ButtonStyle.Secondary).setEmoji('🛡️')
)];

const whisper_cmd = {
  data: command('whisper', 'Anonymous kind messages. The receiver gets 2 guesses to find out who sent it')
    .addSubcommand((s) => s.setName('send').setDescription(`Whisper something kind to someone (${WHISPER_COST} LP)`)
      .addUserOption((o) => o.setName('user').setDescription('Who is it for?').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Your kind message (max 160 characters)').setRequired(true).setMaxLength(160)))
    .addSubcommand((s) => s.setName('stats').setDescription('Your whisper record')),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;
    const s = sig(id);
    s.ws = s.ws || { sent: 0, got: 0, right: 0, wrong: 0, caught: 0 };

    if (sub === 'stats') {
      const w = s.ws;
      return i.reply({ embeds: [embed(0x9370db).setTitle(`${e('ws_mask')} Whisper record`).setDescription(`${e('ws_envelope')} Sent: **${w.sent}**\n${e('ws_feather')} Received: **${w.got}**\n${e('ws_eye')} Guessed right: **${w.right}** · wrong: **${w.wrong}**\n${e('ws_question')} Times you were guessed: **${w.caught}**`)], flags: EPH });
    }

    if (!isSlash(i)) return i.reply({ content: `${e('ws_mask')} Whispers are anonymous, so please use the **/whisper** slash command (a typed message shows who you are).` });
    const t = i.options.getUser('user', true);
    if (!(await guardTarget(i, t))) return;
    if (store.user(t.id).admirers === false) return i.reply({ content: `${e('cross')} That person turned anonymous messages off.`, flags: EPH });
    const msg = clean(i.options.getString('message', true), 160);
    if (msg.length < 3) return i.reply({ content: `${e('cross')} Write a real message (at least 3 characters, no links or mentions).`, flags: EPH });
    const left = U.cooldown(id, 'whisper', 120000);
    if (left) return i.reply({ content: `${e('clock')} Wait **${fmtDur(left)}** before the next whisper.`, flags: EPH });
    if (!E.pay(id, WHISPER_COST)) return i.reply({ content: `${e('cross')} A whisper costs ${e('coin')} **${WHISPER_COST}**.`, flags: EPH });

    const wid = uid();
    const ws = pruneWhispers();
    ws[wid] = { from: id, to: t.id, text: msg, tries: 0, done: false, at: Date.now(), channelId: i.channelId };
    const payload = skin.payload({
      content: `<@${t.id}>`,
      embeds: [embed(0x9370db).setTitle(`${e('ws_mask')} A whisper for ${t.displayName || t.username}`).setDescription(`*"${msg}"*\n\n${e('ws_question')} Someone in this server sent this. You have **2 guesses**!`)],
      components: whisperButtons(wid),
      allowedMentions: { users: [t.id] },
    });
    let sent = null;
    try { sent = await i.channel.send(payload); } catch { /* maybe no channel access */ }
    if (!sent) { try { sent = await t.send(payload); } catch { /* DMs closed */ } }
    if (!sent) { delete ws[wid]; U.award(id, WHISPER_COST); return i.reply({ content: `${e('cross')} I couldn't deliver it (no permission to post here and their DMs are closed). You got your ${WHISPER_COST} LP back.`, flags: EPH }); }
    ws[wid].messageId = sent.id; ws[wid].channelId = sent.channelId;
    s.ws.sent += 1; sig(t.id).ws = sig(t.id).ws || { sent: 0, got: 0, right: 0, wrong: 0, caught: 0 }; sig(t.id).ws.got += 1;
    store.save();
    return i.reply({ content: `${e('ws_envelope')} Your whisper is out there. Nobody knows it was you ${e('ws_mask')}`, flags: EPH });
  },
};

async function whisperRoute(i, wid, action) {
  const ws = store.db().whispers || {};
  const w = ws[wid];
  if (!w) return i.reply({ content: `${e('clock')} This whisper has expired.`, flags: EPH });
  if (i.user.id !== w.to) return i.reply({ content: `${e('ws_mask')} Only the person it was whispered to can use these buttons.`, flags: EPH });
  const editOriginal = async (payload) => {
    try { const ch = await i.client.channels.fetch(w.channelId); const m = await ch.messages.fetch(w.messageId); await m.edit(skin.payload(payload)); } catch { /* ignore */ }
  };
  if (action === 'b') {
    const me = store.user(w.to);
    if (!me.blocked.includes(w.from)) me.blocked.push(w.from);
    w.done = true; store.save();
    await editOriginal({ content: `<@${w.to}>`, embeds: [embed(0x6c757d).setTitle(`${e('ws_mask')} Whisper removed`).setDescription('The receiver blocked the sender.')], components: [] });
    return i.reply({ content: `${e('shield')} Done. That sender can no longer interact with you.`, flags: EPH });
  }
  if (w.done) return i.reply({ content: `${e('check')} This whisper is already finished.`, flags: EPH });
  if (action === 'g') {
    const menu = new UserSelectMenuBuilder().setCustomId(`yu:ws:${wid}:p`).setPlaceholder('Who do you think sent it?').setMinValues(1).setMaxValues(1);
    return i.reply({ content: `${e('ws_eye')} Pick your suspect (${2 - w.tries} guess${2 - w.tries === 1 ? '' : 'es'} left):`, components: [new ActionRowBuilder().addComponents(menu)], flags: EPH });
  }
  if (action === 'p') {
    const picked = i.values[0];
    w.tries += 1;
    const mine = sig(w.to); mine.ws = mine.ws || { sent: 0, got: 0, right: 0, wrong: 0, caught: 0 };
    if (picked === w.from) {
      w.done = true; mine.ws.right += 1;
      const them = sig(w.from); them.ws = them.ws || { sent: 0, got: 0, right: 0, wrong: 0, caught: 0 }; them.ws.caught += 1;
      U.award(w.to, 25); U.award(w.from, 25); store.save();
      await editOriginal({ content: `<@${w.to}>`, embeds: [embed(0x57d68d).setTitle(`${e('ws_eye')} Whisper revealed!`).setDescription(`*"${w.text}"*\n\n${e('check')} <@${w.to}> guessed right: it was **<@${w.from}>**! You both got ${e('coin')} **25**.`)], components: [], allowedMentions: { parse: [] } });
      return i.update({ content: `${e('check')} Correct! It was <@${w.from}>. You both earned ${e('coin')} 25.`, components: [], allowedMentions: { parse: [] } });
    }
    mine.ws.wrong += 1;
    if (w.tries >= 2) {
      w.done = true; store.save();
      await editOriginal({ content: `<@${w.to}>`, embeds: [embed(0x9370db).setTitle(`${e('ws_mask')} A secret whisper`).setDescription(`*"${w.text}"*\n\n${e('ws_question')} <@${w.to}> used both guesses. The sender stays a mystery forever.`)], components: [], allowedMentions: { parse: [] } });
      return i.update({ content: `${e('cross')} Not them, and you're out of guesses. The sender stays secret ${e('ws_mask')}`, components: [] });
    }
    store.save();
    return i.update({ content: `${e('cross')} Not <@${picked}>. **1 guess left**, press the button again.`, components: [], allowedMentions: { parse: [] } });
  }
}

// ======================================================================== DUET
const PROMPTS = [
  'The lighthouse keeper opened the door and found',
  'On the last train of the night, two strangers noticed',
  'Nobody in the little town believed in magic until',
  'The map said "dig here", so we',
  'It was raining stars the evening we',
  'Inside the old music box, there was',
  'The café only appeared when two people were really in love, and today',
  'Our spaceship had one rule: never open the pink door, but',
  'The letter had no stamp, no address, just',
  'When the moon fell into the lake,',
  'The cat looked at us and said',
  'At the end of the rainbow, there was a tiny shop that sold',
];
const duetDb = () => { const db = store.db(); db.duets ||= {}; return db.duets; };
const duetOf = (id) => { const key = sig(id).duet; const d = key && duetDb()[key]; return d && Date.now() - d.last < 48 * HOUR ? { key, d } : null; };

function storyText(d) { return `**${d.prompt}**\n${d.lines.map((l) => `${l.text}`).join(' ')}`; }
async function finishDuet(i, key, d) {
  const shelfItem = { t: d.prompt, lines: d.lines, at: Date.now(), a: d.a, b: d.b };
  for (const p of [d.a, d.b]) {
    const s = sig(p); s.duets = s.duets || []; s.duets.unshift(shelfItem); s.duets = s.duets.slice(0, 8); delete s.duet;
    if (E.underCap(p, 'duet', 3)) E.earn(p, 20, { boost: false });
  }
  if (partnerOf(d.a) === d.b) U.addCoupleXp(d.a, d.b, 10);
  delete duetDb()[key];
  store.save();
}

const duet_cmd = {
  data: command('duet', 'Write a story together, one line each')
    .addSubcommand((s) => s.setName('start').setDescription('Start a story with someone')
      .addUserOption((o) => o.setName('user').setDescription('Who writes with you?').setRequired(true))
      .addStringOption((o) => o.setName('opening').setDescription('Your own opening line (default: a random one)').setMaxLength(120)))
    .addSubcommand((s) => s.setName('add').setDescription('Add your line when it is your turn')
      .addStringOption((o) => o.setName('line').setDescription('One or two sentences').setRequired(true).setMaxLength(220)))
    .addSubcommand((s) => s.setName('finish').setDescription('End the story (needs at least 4 lines) and put it on your shelves'))
    .addSubcommand((s) => s.setName('shelf').setDescription('Your finished stories'))
    .addSubcommand((s) => s.setName('read').setDescription('Read one of your stories')
      .addIntegerOption((o) => o.setName('number').setDescription('Number from /duet shelf').setRequired(true).setMinValue(1).setMaxValue(8))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;

    if (sub === 'start') {
      const t = i.options.getUser('user', true);
      if (!(await guardTarget(i, t))) return;
      if (duetOf(id) || duetOf(t.id)) return i.reply({ content: `${e('cross')} One of you is already in an unfinished story (\`/duet finish\`, or wait 48h of silence).`, flags: EPH });
      const prompt = clean(i.options.getString('opening'), 120) || pick(PROMPTS);
      return interactive.ask(i, {
        to: t.id, yes: 'Write together', no: 'Not now', yesEmoji: '📖', noEmoji: '💤',
        content: `${e('du_book')} ${t}, **${i.user.displayName}** wants to write a story with you!\n> *${prompt}...*`,
        onYes: async (b) => {
          if (duetOf(id) || duetOf(t.id)) return b.update({ content: `${e('cross')} Too late, one of you started another story.`, components: [] });
          const key = store.pairKey(id, t.id);
          duetDb()[key] = { a: id, b: t.id, prompt, lines: [], turn: id, last: Date.now() };
          sig(id).duet = key; sig(t.id).duet = key; store.save();
          return b.update({ content: `${e('du_pen')} The story begins!\n> *${prompt}...*\n<@${id}>, you write first: \`/duet add\``, components: [], allowedMentions: { users: [id] } });
        },
        onNo: (b) => b.update({ content: `${e('cross')} ${t.displayName || t.username} isn't up for a story right now.`, components: [] }),
      });
    }

    if (sub === 'add') {
      const cur = duetOf(id);
      if (!cur) return i.reply({ content: `${e('cross')} You have no story going. Start one with \`/duet start\`.`, flags: EPH });
      const { key, d } = cur;
      if (d.turn !== id) return i.reply({ content: `${e('clock')} It's <@${d.turn}>'s turn to write.`, flags: EPH, allowedMentions: { parse: [] } });
      const text = clean(i.options.getString('line', true), 220);
      if (text.length < 3) return i.reply({ content: `${e('cross')} Write a bit more.`, flags: EPH });
      d.lines.push({ by: id, text }); d.turn = id === d.a ? d.b : d.a; d.last = Date.now(); store.save();
      if (d.lines.length >= 12) {
        const text2 = storyText(d); await finishDuet(i, key, d);
        return i.reply({ embeds: [embed(0xff8fab).setTitle(`${e('du_pages')} A finished story by two`).setDescription(text2)] });
      }
      const tail = d.lines.slice(-3).map((l) => `<@${l.by}>: ${l.text}`).join('\n');
      return i.reply({ content: `${e('du_pen')} **Line ${d.lines.length}** added. <@${d.turn}>, your turn!\n${tail}\n-# ${d.lines.length >= 4 ? 'Either of you can end it with /duet finish. ' : ''}Max 12 lines.`, allowedMentions: { users: [d.turn] } });
    }

    if (sub === 'finish') {
      const cur = duetOf(id);
      if (!cur) return i.reply({ content: `${e('cross')} You have no story going.`, flags: EPH });
      const { key, d } = cur;
      if (d.lines.length < 4) return i.reply({ content: `${e('cross')} A story needs at least **4 lines** (you have ${d.lines.length}).`, flags: EPH });
      const text = storyText(d); await finishDuet(i, key, d);
      return i.reply({ embeds: [embed(0xff8fab).setTitle(`${e('du_pages')} A finished story by two`).setDescription(`${text}\n\n-# <@${d.a}> & <@${d.b}>`)], allowedMentions: { parse: [] } });
    }

    const shelf = sig(id).duets || [];
    if (sub === 'shelf') {
      if (!shelf.length) return i.reply({ content: `${e('du_book')} Your shelf is empty. Write something with \`/duet start\`.`, flags: EPH });
      return i.reply({ embeds: [embed(0xff8fab).setTitle(`${e('du_book')} Your bookshelf`).setDescription(shelf.map((b, k) => `${e('du_bookmark')} **${k + 1}.** ${b.t}... *(${b.lines.length} lines, with <@${b.a === id ? b.b : b.a}>)*`).join('\n'))], flags: EPH, allowedMentions: { parse: [] } });
    }
    if (sub === 'read') {
      const b = shelf[i.options.getInteger('number', true) - 1];
      if (!b) return i.reply({ content: `${e('cross')} No story with that number.`, flags: EPH });
      return i.reply({ embeds: [embed(0xff8fab).setTitle(`${e('du_pages')} Story`).setDescription(`**${b.t}**\n${b.lines.map((l) => l.text).join(' ')}`.slice(0, 4000))], flags: EPH });
    }
  },
};

// ======================================================================== AURA
const AURAS = {
  ember: { name: 'Ember', emoji: 'a_au_ember', color: 0xff6e3c, vibe: ['bold and warm', 'ready to start something', 'glowing with confidence'], love: ['Say the brave thing out loud today.', 'A spontaneous plan will land well.', 'Warmth wins, don\'t hold it back.'] },
  tide: { name: 'Tide', emoji: 'a_au_tide', color: 0x3caaf0, vibe: ['calm and deep', 'flowing with the day', 'quietly intuitive'], love: ['Listen more than you speak today.', 'A slow walk together beats any big plan.', 'Feelings come in waves, let them.'] },
  bloom: { name: 'Bloom', emoji: 'a_au_bloom', color: 0xff82be, vibe: ['soft and generous', 'growing something new', 'sweet and open'], love: ['A small gift will mean a lot.', 'Compliment someone just because.', 'Plant a seed of kindness.'] },
  gale: { name: 'Gale', emoji: 'a_au_gale', color: 0x78d7be, vibe: ['restless and curious', 'quick and playful', 'ready to wander'], love: ['Try something you have never done together.', 'Send a silly message, it will be loved.', 'Fresh air fixes more than you think.'] },
  dusk: { name: 'Dusk', emoji: 'a_au_dusk', color: 0x9664e6, vibe: ['dreamy and thoughtful', 'a little mysterious', 'reflective'], love: ['Open up about something small.', 'Late-night talks are your superpower today.', 'Someone is thinking about you.'] },
  dawn: { name: 'Dawn', emoji: 'a_au_dawn', color: 0xffb95a, vibe: ['hopeful and fresh', 'full of second chances', 'bright-eyed'], love: ['Forgive the small stuff.', 'Start the day with a kind word.', 'A new beginning is closer than it looks.'] },
  frost: { name: 'Frost', emoji: 'a_au_frost', color: 0x82d2fa, vibe: ['cool and focused', 'steady and clear', 'sharp but gentle'], love: ['Show it with actions, not speeches.', 'Give yourself some quiet time first.', 'Clear is kind: say what you need.'] },
  star: { name: 'Star', emoji: 'a_au_star', color: 0xffcd50, vibe: ['magnetic and lucky', 'the main character today', 'sparkling'], love: ['People are drawn to you, be kind with it.', 'Make a wish, today it counts.', 'Share your spotlight.'] },
};
const AURA_KEYS = Object.keys(AURAS);
const HARMONY = [['ember', 'bloom'], ['tide', 'frost'], ['gale', 'dawn'], ['dusk', 'star'], ['bloom', 'dawn'], ['tide', 'gale'], ['ember', 'dawn'], ['frost', 'star']];
const CLASH = [['ember', 'frost'], ['ember', 'tide'], ['dusk', 'dawn'], ['gale', 'frost']];
const hasPair = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const auraOf = (id, day = dayKey()) => AURA_KEYS[hash(`${id}:${day}`) % AURA_KEYS.length];

const aura_cmd = {
  data: command('aura', 'Your aura of the day, a reading streak and aura matches')
    .addSubcommand((s) => s.setName('read').setDescription('Read an aura (yours by default)').addUserOption((o) => o.setName('user').setDescription('Whose aura?')))
    .addSubcommand((s) => s.setName('match').setDescription('How well do your auras match today?').addUserOption((o) => o.setName('user').setDescription('With whom?').setRequired(true))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;
    const today = dayKey();

    if (sub === 'read') {
      const t = i.options.getUser('user') || i.user;
      const own = t.id === id;
      if (!own && !(await guardTarget(i, t))) return;
      const k = auraOf(t.id, today); const A = AURAS[k];
      const h = hash(`${t.id}:${today}:x`);
      const em = embed(A.color)
        .setTitle(`${e(A.emoji)} ${t.displayName || t.username}'s aura today: ${A.name}`)
        .setDescription(`Feeling **${A.vibe[h % 3]}**.\n${e('heart_pink')} ${A.love[(h >>> 3) % 3]}`)
        .addFields(
          { name: 'Energy', value: `${bar(h % 101, 100)} **${h % 101}%**`, inline: true },
          { name: 'Lucky number', value: `**${(h >>> 5) % 99 + 1}**`, inline: true },
          { name: 'Pairs well with', value: AURA_KEYS.filter((x) => hasPair(HARMONY, k, x)).map((x) => `${e(AURAS[x].emoji)} ${AURAS[x].name}`).join(', ') || '*everyone*', inline: true }
        );
      if (own) {
        const s = sig(id); s.aura = s.aura || { last: '', streak: 0, best: 0 };
        if (s.aura.last !== today) {
          const yest = dayKey(new Date(Date.now() - DAY));
          s.aura.streak = s.aura.last === yest ? s.aura.streak + 1 : 1;
          s.aura.best = Math.max(s.aura.best, s.aura.streak); s.aura.last = today;
          if (s.aura.streak % 7 === 0) { E.addGems(id, 1); em.addFields({ name: `${e('gem_pink')} Aura streak reward`, value: `**${s.aura.streak} days** in a row! +1 gem` }); }
          store.save();
        }
        em.addFields({ name: `${e('fire')} Aura streak`, value: `**${s.aura.streak}** day${s.aura.streak === 1 ? '' : 's'} (best ${s.aura.best})`, inline: true });
      }
      return i.reply({ embeds: [em] });
    }

    if (sub === 'match') {
      const t = i.options.getUser('user', true);
      if (!(await guardTarget(i, t))) return;
      const a = auraOf(id, today); const b = auraOf(t.id, today);
      let score = 45 + (hash(`${[id, t.id].sort().join('')}${today}`) % 41);
      let note = 'A pleasant, easy mix.';
      if (a === b) { score += 10; note = 'Mirror auras: you feel what the other feels.'; }
      if (hasPair(HARMONY, a, b)) { score += 15; note = 'A natural harmony. Sparks, in the best way.'; }
      if (hasPair(CLASH, a, b)) { score -= 15; note = 'Opposite energies, which can be exciting or exhausting. Be patient.'; }
      score = Math.max(5, Math.min(100, score));
      return i.reply({ embeds: [embed(0xff82be).setTitle(`${e(AURAS[a].emoji)} ${AURAS[a].name}  ×  ${AURAS[b].name} ${e(AURAS[b].emoji)}`)
        .setDescription(`**${i.user.displayName}** and **${t.displayName || t.username}**\n${bar(score, 100)} **${score}%**\n${note}`)] });
    }
  },
};

// ======================================================================== MOOD
const WEATHER = {
  sunny: { label: 'Sunny', text: 'bright and happy' }, cloudy: { label: 'Cloudy', text: 'a bit meh' }, stormy: { label: 'Stormy', text: 'stressed or upset' },
  rainbow: { label: 'Rainbow', text: 'relieved and hopeful' }, foggy: { label: 'Foggy', text: 'unsure or tired' }, snowy: { label: 'Snowy', text: 'quiet and cozy' },
};
const moodFresh = (m) => m && Date.now() - m.at < DAY;

const mood_cmd = {
  data: command('mood', 'Set your emotional weather and see the forecast of the whole server')
    .addSubcommand((s) => s.setName('set').setDescription('Set your weather for today')
      .addStringOption((o) => o.setName('weather').setDescription('How is it inside?').setRequired(true).addChoices(...Object.entries(WEATHER).map(([v, w]) => ({ name: `${w.label} (${w.text})`, value: v }))))
      .addStringOption((o) => o.setName('note').setDescription('A few words (optional)').setMaxLength(80)))
    .addSubcommand((s) => s.setName('check').setDescription('Check someone\'s weather').addUserOption((o) => o.setName('user').setDescription('Whose weather? (default: yours)')))
    .addSubcommand((s) => s.setName('forecast').setDescription('The emotional weather of this server today')),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;

    if (sub === 'set') {
      const w = i.options.getString('weather', true);
      if (!WEATHER[w]) return i.reply({ content: `${e('cross')} Choose: ${Object.keys(WEATHER).join(', ')}.`, flags: EPH });
      const left = U.cooldown(id, 'mood', 5 * 60000);
      if (left) return i.reply({ content: `${e('clock')} You can change your weather again in **${fmtDur(left)}**.`, flags: EPH });
      const note = clean(i.options.getString('note'), 80);
      sig(id).mood = { w, note, at: Date.now() };
      if (i.guildId) { const g = store.guild(i.guildId); g.moods = g.moods || {}; g.moods[id] = { w, at: Date.now() }; }
      store.save();
      const msg = w === 'stormy' ? 'Be gentle with yourself today.' : w === 'sunny' ? 'Love that for you!' : w === 'rainbow' ? 'After the storm. Proud of you.' : 'Thanks for sharing.';
      return i.reply({ content: `${e(`mo_${w}`)} **${i.user.displayName}**'s weather: **${WEATHER[w].label}**${note ? ` · *${note}*` : ''}\n-# ${msg}` });
    }

    if (sub === 'check') {
      const t = i.options.getUser('user') || i.user;
      if (t.id !== id && !(await guardTarget(i, t, { allowSelf: true }))) return;
      const m = sig(t.id).mood;
      if (!moodFresh(m)) return i.reply({ content: `${e('mo_foggy')} ${t.id === id ? 'You haven\'t' : `${t.displayName || t.username} hasn't`} set a weather in the last 24 hours.`, flags: EPH });
      return i.reply({ content: `${e(`mo_${m.w}`)} **${t.displayName || t.username}** is feeling **${WEATHER[m.w].label}** (${WEATHER[m.w].text}) ${rel(m.at)}${m.note ? `\n> ${m.note}` : ''}` });
    }

    if (sub === 'forecast') {
      if (!(await needGuild(i))) return;
      const g = store.guild(i.guildId); g.moods = g.moods || {};
      const live = Object.entries(g.moods).filter(([, m]) => moodFresh(m));
      if (live.length < 2) return i.reply({ content: `${e('mo_foggy')} Not enough weather reports yet (need 2+ from the last 24h). Use \`/mood set\`!` });
      const count = {}; live.forEach(([, m]) => { count[m.w] = (count[m.w] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
      const headline = { sunny: 'Clear skies and good vibes over the server.', cloudy: 'A grey-ish day, be extra kind to each other.', stormy: 'Storm warning! Check on your friends today.', rainbow: 'Rainbows everywhere, people are bouncing back.', foggy: 'Low visibility, many people feel unsure. Slow down.', snowy: 'A cozy, quiet day across the server.' }[top];
      const rows = Object.keys(WEATHER).filter((k) => count[k]).map((k) => `${e(`mo_${k}`)} **${WEATHER[k].label}** ${bar(count[k], live.length)} ${count[k]}`).join('\n');
      return i.reply({ embeds: [embed(0x7fb5ff).setTitle(`${e(`mo_${top}`)} ${i.guild ? i.guild.name : 'Server'} forecast`).setDescription(`**${headline}**\n\n${rows}\n\n${live.length} reports in the last 24 hours`)] });
    }
  },
};

// ======================================================================== RITUAL
const periodNow = (r) => (r.cad === 'weekly' ? Math.floor((Math.floor(Date.now() / DAY) + 3) / 7) : Math.floor(Date.now() / DAY));
const liveStreak = (r) => { const cur = periodNow(r); return r.last === cur || r.last === cur - 1 ? r.streak : 0; };
const MILESTONES = { 7: 1, 30: 3, 100: 10 };

function ritualCtx(i) {
  const p = partnerOf(i.user.id);
  if (!p) return null;
  const c = U.getCouple(i.user.id, p); c.rituals = c.rituals || [];
  return { p, c };
}

const ritual_cmd = {
  data: command('ritual', 'Couple habits with streaks you BOTH have to keep (call every Sunday, a goodnight text...)')
    .addSubcommand((s) => s.setName('add').setDescription('Create a ritual with your partner (max 3)')
      .addStringOption((o) => o.setName('name').setDescription('What is the ritual?').setRequired(true).setMaxLength(40))
      .addStringOption((o) => o.setName('cadence').setDescription('How often?').addChoices({ name: 'Every day', value: 'daily' }, { name: 'Every week', value: 'weekly' })))
    .addSubcommand((s) => s.setName('checkin').setDescription('Check in. The streak grows when BOTH of you did it this period')
      .addIntegerOption((o) => o.setName('number').setDescription('Which ritual? (default: 1)').setMinValue(1).setMaxValue(3)))
    .addSubcommand((s) => s.setName('list').setDescription('Your rituals and streaks'))
    .addSubcommand((s) => s.setName('remove').setDescription('Delete a ritual').addIntegerOption((o) => o.setName('number').setDescription('Which ritual?').setRequired(true).setMinValue(1).setMaxValue(3))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const id = i.user.id;
    const ctx = ritualCtx(i);
    if (!ctx) return i.reply({ content: `${e('rt_loop')} Rituals are for couples. Start a relationship with \`/date\` first.`, flags: EPH });
    const { p, c } = ctx;
    const rs = c.rituals;

    if (sub === 'add') {
      if (rs.length >= 3) return i.reply({ content: `${e('cross')} You can keep 3 rituals at a time.`, flags: EPH });
      const name = clean(i.options.getString('name', true), 40);
      if (name.length < 3) return i.reply({ content: `${e('cross')} Give the ritual a name.`, flags: EPH });
      const cad = i.options.getString('cadence') === 'weekly' ? 'weekly' : 'daily';
      rs.push({ name, cad, checks: {}, streak: 0, best: 0, last: -1, done: 0, at: Date.now() }); store.save();
      return i.reply({ content: `${e('rt_calendar')} New **${cad}** ritual: **${name}**. You and <@${p}> both check in with \`/ritual checkin ${rs.length}\` to grow the streak.`, allowedMentions: { users: [p] } });
    }

    if (sub === 'list') {
      if (!rs.length) return i.reply({ content: `${e('rt_calendar')} No rituals yet. \`/ritual add\` your first one!`, flags: EPH });
      const lines = rs.map((r, k) => {
        const cur = periodNow(r); const me = r.checks[id] === cur; const her = r.checks[p] === cur;
        return `${e('rt_loop')} **${k + 1}. ${r.name}** (${r.cad})\n${e('fire')} streak **${liveStreak(r)}** · best ${r.best} · done ${r.done}×\nYou ${me ? e('rt_check') : '⏳'}  Partner ${her ? e('rt_check') : '⏳'}`;
      });
      return i.reply({ embeds: [embed(0x7a5ae0).setTitle(`${e('rt_calendar')} Your rituals`).setDescription(lines.join('\n\n'))] });
    }

    const n = (i.options.getInteger('number') || 1) - 1;
    const r = rs[n];
    if (!r) return i.reply({ content: `${e('cross')} No ritual with that number. See \`/ritual list\`.`, flags: EPH });

    if (sub === 'remove') {
      rs.splice(n, 1); store.save();
      return i.reply({ content: `${e('rt_loop')} Ritual **${r.name}** removed.` });
    }

    if (sub === 'checkin') {
      const cur = periodNow(r);
      if (r.checks[id] === cur) return i.reply({ content: `${e('rt_check')} You already checked in for **${r.name}** this ${r.cad === 'weekly' ? 'week' : 'day'}. Waiting for <@${p}>.`, flags: EPH, allowedMentions: { parse: [] } });
      r.checks[id] = cur;
      if (r.checks[p] !== cur) { store.save(); return i.reply({ content: `${e('rt_check')} **${i.user.displayName}** did **${r.name}**! Now <@${p}> needs to check in for the streak.`, allowedMentions: { users: [p] } }); }
      r.streak = r.last === cur - 1 ? r.streak + 1 : 1; r.last = cur; r.best = Math.max(r.best, r.streak); r.done += 1;
      U.addCoupleXp(id, p, 6);
      let extra = '';
      for (const who of [id, p]) if (E.underCap(who, 'ritual', 3)) E.earn(who, 10, { boost: false });
      if (MILESTONES[r.streak]) { E.addGems(id, MILESTONES[r.streak]); E.addGems(p, MILESTONES[r.streak]); extra = `\n${e('trophy_shine')} **Milestone!** ${r.streak} in a row: ${e('gem_pink')} **+${MILESTONES[r.streak]}** gems each!`; }
      store.save();
      return i.reply({ content: `${e('rt_loop')} **${r.name}** done by both of you! ${e('fire')} Streak: **${r.streak}** ${r.cad === 'weekly' ? 'weeks' : 'days'}. (+6 couple XP, +10 LP each)${extra}` });
    }
  },
};

// ======================================================================== TRUSTED BOTS
const canManage = (i) => Boolean(i.memberPermissions && (i.memberPermissions.has(PermissionFlagsBits.ManageGuild) || i.memberPermissions.has(PermissionFlagsBits.Administrator)));

const trusted_cmd = {
  data: command('trustedbots', 'Let a trusted bot (like Ommne) run Yuna commands. Every other bot stays ignored')
    .addSubcommand((s) => s.setName('add').setDescription('Trust a bot in this server').addUserOption((o) => o.setName('bot').setDescription('The bot (mention or ID)').setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Stop trusting a bot').addUserOption((o) => o.setName('bot').setDescription('The bot').setRequired(true)))
    .addSubcommand((s) => s.setName('list').setDescription('Which bots are trusted here, and what they can do')),

  async execute(i) {
    if (!(await needGuild(i))) return;
    const sub = i.options.getSubcommand();
    if (sub !== 'list' && !canManage(i)) return i.reply({ content: `${e('cross')} You need the **Manage Server** permission to do that.`, flags: EPH });

    if (sub === 'add') {
      const b = i.options.getUser('bot', true);
      if (!b.bot) return i.reply({ content: `${e('cross')} <@${b.id}> is not a bot. This list is only for bots.`, flags: EPH, allowedMentions: { parse: [] } });
      if (b.id === i.client.user.id) return i.reply({ content: `${e('cross')} That's me!`, flags: EPH });
      const r = trust.add(i.guildId, b.id);
      if (r === null) return i.reply({ content: `${e('cross')} You can trust up to 20 bots per server.`, flags: EPH });
      return i.reply({ content: `${e('tr_bot_ok')} **${b.username}** is now a trusted bot here. It can run Yuna's text commands like \`yuna hug @user\`.${r ? '' : ' (It already was.)'}\n-# Money, crime, admin and privacy commands stay blocked for bots, and they are rate limited.` });
    }
    if (sub === 'remove') {
      const b = i.options.getUser('bot', true);
      if (trust.fromEnv(b.id)) return i.reply({ content: `${e('cross')} That bot is trusted globally through \`TRUSTED_BOT_IDS\`. Remove it from the bot's variables instead.`, flags: EPH });
      return i.reply({ content: trust.remove(i.guildId, b.id) ? `${e('tr_shield_bot')} **${b.username}** is no longer trusted here.` : `${e('cross')} That bot wasn't on the list.` });
    }
    const ids = trust.list(i.guildId);
    const lines = ids.map((id) => `${e('tr_bot_ok')} <@${id}> \`${id}\`${trust.fromEnv(id) ? ' *(global)*' : ''}`).join('\n') || '*No trusted bots yet. Add one with `/trustedbots add`.*';
    return i.reply({ embeds: [embed(0x7a5ae0).setTitle(`${e('tr_shield_bot')} Trusted bots`).setDescription(`${lines}\n\n**What they can do:** text commands such as \`yuna hug @user\`, \`yuna slap @user\`, reactions and relationship fun.\n**What they can't:** money, shop, crime, casino, admin and privacy commands. They are rate limited (1 command per 1.5s) and every other bot is ignored.`)], allowedMentions: { parse: [] } });
  },
};

async function route(i) {
  const [, kind, id, action] = i.customId.split(':');
  if (kind === 'ws') return whisperRoute(i, id, action);
  return i.reply({ content: 'This button has expired ⏳', flags: EPH });
}

module.exports = { commands: [garden_cmd, sky_cmd, timelock_cmd, whisper_cmd, duet_cmd, aura_cmd, mood_cmd, ritual_cmd, trusted_cmd], route };
