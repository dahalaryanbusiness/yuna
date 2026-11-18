// Yuna game hub. All of these are folded into /game (see loadCommands.js), so they cost no extra slash slots.
//   riddle     - 11 categories x 3 levels (easy / normal / hard), streaks, hint button
//   emojiguess - guess the game / movie / anime / place from emojis
//   simon      - memory game: repeat the emoji sequence
//   sync       - couples quiz: both answer the same questions in secret, then Yuna reveals how in sync you are
//   heist      - group crime: crew up, put in a stake, and try to crack the vault together (a real risk, it is a money SINK on average)
const store = require('../store');
const B = require('../data/balance');
const E = require('../lib/eco');
const R = require('../data/riddles');
const EG = require('../data/emojiguess');
const { create, button, row, ButtonStyle } = require('../lib/interactive');
const { e } = require('../lib/emojis');
const { COLORS, EPH, command, embed, pick, rand, cooldown, fmtDur, num, addCoupleXp, getCouple, guardTarget } = require('../lib/util');

const shuffle = (a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const LEVEL_CHOICES = [{ name: 'Easy', value: 'easy' }, { name: 'Normal', value: 'normal' }, { name: 'Hard', value: 'hard' }, { name: 'Random', value: 'random' }];
const LEVEL_STYLE = { easy: '🟢 Easy', normal: '🟡 Normal', hard: '🔴 Hard' };
const levelOf = (name) => (name && name !== 'random' ? R.LEVEL_NUM[name] : null);
const randomLevel = () => pick([1, 2, 3]);

// Per-user game stats live in store.user(id).stats.games (created on demand).
function gstats(id) {
  const st = store.user(id).stats;
  if (!st.games) st.games = {};
  return st.games;
}

// Remembers the last riddles a person saw so they do not repeat right away.
const recent = new Map(); // userId -> [ids]
function nextFrom(pool, userId) {
  const seen = recent.get(userId) || [];
  const fresh = pool.filter((x) => !seen.includes(x.id));
  const item = pick(fresh.length ? fresh : pool);
  recent.set(userId, [...seen, item.id].slice(-Math.min(40, Math.floor(pool.length / 2))));
  return item;
}

// ======================================================================== /game riddle
const catChoices = [{ name: '🎲 Any category', value: 'any' }, ...Object.entries(R.CATS).map(([k, v]) => ({ name: `${v.icon} ${v.name}`, value: k }))];

const riddle = {
  data: command('riddle', 'Solve a riddle for Love Points: Minecraft, Roblox, Fortnite, GTA, anime and more 🧩')
    .addStringOption((o) => o.setName('category').setDescription('Pick a topic (default: any)').addChoices(...catChoices))
    .addStringOption((o) => o.setName('level').setDescription('How hard? Harder pays more (default: random)').addChoices(...LEVEL_CHOICES)),
  async execute(interaction) {
    const id = interaction.user.id;
    const left = cooldown(id, 'riddle', B.riddle.cooldownMs);
    if (left) return interaction.reply({ content: `${e('clock')} Give your brain a break. Next riddle in ${fmtDur(left)}.`, flags: EPH });

    const catKey = interaction.options.getString('category');
    const lvlWanted = levelOf(interaction.options.getString('level'));
    let pool = R.ALL.filter((r) => (!catKey || catKey === 'any' || r.cat === catKey) && (!lvlWanted || r.level === lvlWanted));
    if (!pool.length) pool = R.ALL; // should not happen, but never leave the player without a riddle
    const item = lvlWanted ? nextFrom(pool, id) : (() => {
      const l = randomLevel();
      const sub = pool.filter((r) => r.level === l);
      return nextFrom(sub.length ? sub : pool, id);
    })();
    const lvlName = R.LEVELS[item.level];
    const cfg = B.riddle.levels[lvlName];
    const cat = R.CATS[item.cat];
    const opts = shuffle([item.a, ...item.w]);
    let hinted = false;
    let hidden = -1; // option removed by the hint
    const gs = gstats(id);
    gs.riddle = gs.riddle || { solved: 0, tried: 0, streak: 0, best: 0 };
    const rs = gs.riddle;

    const build = (disabled, pickedIdx) => {
      const buttons = opts.map((o, i) => {
        let style = ButtonStyle.Primary;
        if (pickedIdx !== undefined) style = o === item.a ? ButtonStyle.Success : i === pickedIdx ? ButtonStyle.Danger : ButtonStyle.Secondary;
        return button(session.cid(`a${i}`), o.slice(0, 80), style).setDisabled(disabled || i === hidden);
      });
      const rows = [row(...buttons.slice(0, 4))];
      if (!disabled && pickedIdx === undefined) rows.push(row(button(session.cid('hint'), hinted ? 'Hint used' : 'Hint (-50% prize)', ButtonStyle.Secondary, '💡').setDisabled(hinted)));
      return rows;
    };
    const head = (extra) => embed(COLORS.purple)
      .setTitle(`${cat.icon} ${cat.name} riddle · ${LEVEL_STYLE[lvlName]}`)
      .setDescription(`${item.q}${extra ? `\n\n${extra}` : ''}`);

    const session = create({
      ttl: cfg.seconds * 1000,
      handler: async (i, action) => {
        if (i.user.id !== id) return i.reply({ content: 'This riddle is not for you 💔 Use `/game riddle` for your own.', flags: EPH });
        if (action === 'hint') {
          if (hinted) return i.deferUpdate();
          hinted = true;
          const wrongIdx = opts.map((o, k) => (o !== item.a ? k : -1)).filter((k) => k >= 0);
          hidden = pick(wrongIdx);
          return i.update({ embeds: [head(`-# Hint used: one wrong answer was removed. The prize is cut by ${Math.round(B.riddle.hintCut * 100)}%.`)], components: build(false) });
        }
        session.end();
        const idx = Number(action.slice(1));
        const ok = opts[idx] === item.a;
        rs.tried += 1;
        let text;
        if (ok) {
          rs.solved += 1; rs.streak += 1; rs.best = Math.max(rs.best, rs.streak);
          const paid = E.underCap(id, 'riddle', B.riddle.dailyPaidSolves);
          let prize = rand(cfg.reward[0], cfg.reward[1]) + Math.min(rs.streak - 1, B.riddle.streakMax) * B.riddle.streakBonus;
          if (hinted) prize = Math.floor(prize * (1 - B.riddle.hintCut));
          const got = paid ? E.earn(id, prize) : 0;
          text = `${e('check')} **Correct!** The answer is **${item.a}**.\n${paid ? `${e('coin')} **+${num(got)}** LP${rs.streak > 1 ? ` · ${e('fire')} streak **${rs.streak}**` : ''}` : `${e('clock')} Daily prize limit reached (${B.riddle.dailyPaidSolves} paid riddles). Your streak still counts!`}`;
        } else {
          rs.streak = 0;
          text = `${e('cross')} Not quite. The answer was **${item.a}**. Streak reset.`;
        }
        store.save();
        return i.update({ embeds: [head(`${text}\n-# Solved ${rs.solved}/${rs.tried} · best streak ${rs.best}`).setColor(ok ? COLORS.green : COLORS.red)], components: build(true, idx) });
      },
      onExpire: () => {
        rs.tried += 1; rs.streak = 0; store.save();
        return interaction.editReply({ embeds: [head(`⏳ Time is up! The answer was **${item.a}**.`).setColor(COLORS.grey)], components: build(true) });
      },
    });
    const prizeTxt = `${num(cfg.reward[0])}-${num(cfg.reward[1])}`;
    return interaction.reply({ embeds: [head(`-# ${cfg.seconds} seconds · prize ${prizeTxt} LP${rs.streak ? ` · ${e('fire')} streak ${rs.streak}` : ''}`)], components: build(false) });
  },
};

// ======================================================================== /game emojiguess
const egChoices = [{ name: '🎲 Any category', value: 'any' }, ...Object.entries(EG.CATS).map(([k, v]) => ({ name: `${v.icon} ${v.name}`, value: k }))];
const emojiguess = {
  data: command('emojiguess', 'Guess the game, movie, anime or place from emojis 🔤')
    .addStringOption((o) => o.setName('category').setDescription('Pick a topic (default: any)').addChoices(...egChoices))
    .addStringOption((o) => o.setName('level').setDescription('How hard? (default: random)').addChoices(...LEVEL_CHOICES)),
  async execute(interaction) {
    const id = interaction.user.id;
    const left = cooldown(id, 'emojiguess', B.emojiguess.cooldownMs);
    if (left) return interaction.reply({ content: `${e('clock')} Next emoji puzzle in ${fmtDur(left)}.`, flags: EPH });
    const catKey = interaction.options.getString('category');
    const lvlWanted = levelOf(interaction.options.getString('level')) || randomLevel();
    let pool = EG.ALL.filter((x) => (!catKey || catKey === 'any' || x.cat === catKey) && x.level === lvlWanted);
    if (!pool.length) pool = EG.ALL.filter((x) => !catKey || catKey === 'any' || x.cat === catKey);
    const item = nextFrom(pool, id);
    const lvlName = R.LEVELS[item.level];
    const wrong = shuffle(EG.answersOf(item.cat).filter((a) => a !== item.a)).slice(0, 3);
    const opts = shuffle([item.a, ...wrong]);
    const cat = EG.CATS[item.cat];
    const build = (disabled, pickedIdx) => [row(...opts.map((o, i) => button(session.cid(`a${i}`), o.slice(0, 80),
      pickedIdx === undefined ? ButtonStyle.Primary : o === item.a ? ButtonStyle.Success : i === pickedIdx ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(disabled)))];
    const view = (extra, color = COLORS.purple) => embed(color).setTitle(`${cat.icon} Emoji guess · ${LEVEL_STYLE[lvlName]}`).setDescription(`# ${item.emojis}\nWhat is it?${extra ? `\n\n${extra}` : ''}`);
    const range = B.emojiguess.levels[lvlName];
    const session = create({
      ttl: B.emojiguess.seconds * 1000,
      handler: async (i, action) => {
        if (i.user.id !== id) return i.reply({ content: 'This puzzle is not for you 💔', flags: EPH });
        session.end();
        const idx = Number(action.slice(1));
        const ok = opts[idx] === item.a;
        let text;
        if (ok) {
          const paid = E.underCap(id, 'emojiguess', B.emojiguess.dailyPaid);
          const got = paid ? E.earn(id, rand(range[0], range[1])) : 0;
          text = `${e('check')} **Correct!** It is **${item.a}**.\n${paid ? `${e('coin')} **+${num(got)}** LP` : `${e('clock')} Daily prize limit reached.`}`;
        } else text = `${e('cross')} Not quite. It was **${item.a}**.`;
        return i.update({ embeds: [view(text, ok ? COLORS.green : COLORS.red)], components: build(true, idx) });
      },
      onExpire: () => interaction.editReply({ embeds: [view(`⏳ Time is up! It was **${item.a}**.`, COLORS.grey)], components: build(true) }),
    });
    return interaction.reply({ embeds: [view(`-# ${B.emojiguess.seconds} seconds · prize ${num(range[0])}-${num(range[1])} LP`)], components: build(false) });
  },
};

// ======================================================================== /game simon
const SIMON = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟧'];
const simon = {
  data: command('simon', 'Memory game: watch the colors, then repeat them in order 🧠')
    .addStringOption((o) => o.setName('level').setDescription('Starting length: easy 3, normal 4, hard 5').addChoices(...LEVEL_CHOICES.slice(0, 3))),
  async execute(interaction) {
    const id = interaction.user.id;
    const left = cooldown(id, 'simon', B.simon.cooldownMs);
    if (left) return interaction.reply({ content: `${e('clock')} Rest your memory for ${fmtDur(left)}.`, flags: EPH });
    const lvlName = interaction.options.getString('level') || 'normal';
    let len = B.simon.startLen[lvlName] || 4;
    let round = 1;
    let seq = [];
    let step = 0;
    let earned = 0;
    let showing = true;
    const newSeq = () => { seq = Array.from({ length: len }, () => rand(0, SIMON.length - 1)); step = 0; };
    const pad = (disabled) => [row(...SIMON.slice(0, 3).map((c, k) => button(session.cid(`c${k}`), '\u200b', ButtonStyle.Secondary, c).setDisabled(disabled))),
      row(...SIMON.slice(3, 6).map((c, k) => button(session.cid(`c${k + 3}`), '\u200b', ButtonStyle.Secondary, c).setDisabled(disabled)))];
    const view = (txt, color = COLORS.purple) => embed(color).setTitle(`🧠 Simon · round ${round}/${B.simon.maxRounds} · ${LEVEL_STYLE[lvlName]}`).setDescription(txt);
    const finish = async (i, won) => {
      session.end();
      let got = 0;
      const rounds = won ? B.simon.maxRounds : round - 1;
      if (rounds > 0 && E.underCap(id, 'simon', B.simon.dailyPaid)) got = E.earn(id, earned);
      const txt = `${won ? `${e('trophy_shine')} **Perfect memory!** You cleared all ${B.simon.maxRounds} rounds.` : `${e('cross')} Wrong color! The sequence was ${seq.map((k) => SIMON[k]).join(' ')}`}\nRounds cleared: **${rounds}**${got ? `\n${e('coin')} **+${num(got)}** LP` : rounds ? `\n${e('clock')} Daily prize limit reached.` : ''}`;
      const payload = { embeds: [view(txt, won ? COLORS.green : COLORS.red)], components: pad(true) };
      return i ? i.update(payload) : interaction.editReply(payload);
    };
    const startRound = async (i) => {
      newSeq(); showing = true;
      const watch = view(`**Memorize this:**\n# ${seq.map((k) => SIMON[k]).join(' ')}\n-# It hides in ${Math.ceil(len * 0.9 + 2)} seconds...`);
      const payload = { embeds: [watch], components: pad(true) };
      if (i) await i.update(payload); else await interaction.reply(payload);
      setTimeout(() => {
        showing = false;
        interaction.editReply({ embeds: [view(`Repeat the sequence! (${len} colors)\n-# Progress: 0/${len}`)], components: pad(false) }).catch(() => {});
      }, Math.ceil(len * 0.9 + 2) * 1000);
    };
    const session = create({
      ttl: 4 * 60 * 1000,
      handler: async (i, action) => {
        if (i.user.id !== id) return i.reply({ content: 'This is not your game 💔', flags: EPH });
        if (showing) return i.deferUpdate();
        const k = Number(action.slice(1));
        if (k !== seq[step]) return finish(i, false);
        step += 1;
        if (step < len) return i.update({ embeds: [view(`Repeat the sequence! (${len} colors)\n-# Progress: ${step}/${len}`)], components: pad(false) });
        earned += rand(B.simon.perRound[0], B.simon.perRound[1]) + len;
        if (round >= B.simon.maxRounds) return finish(i, true);
        round += 1; len += 1;
        return startRound(i);
      },
      onExpire: () => interaction.editReply({ embeds: [view('⏳ You took too long. Game over.', COLORS.grey)], components: pad(true) }),
    });
    return startRound(null);
  },
};

// ======================================================================== /game sync (couples quiz)
const SYNC_Q = [
  ['Perfect date night?', ['🎬 Movie night', '🍽️ Fancy dinner', '🏖️ Beach walk', '🎮 Game night']],
  ['How do you say sorry?', ['💐 Gift', '🗣️ Words', '🤗 Hug', '🍫 Treat']],
  ['Pick a pet for the two of you', ['🐶 Dog', '🐱 Cat', '🐰 Bunny', '🐠 Fish']],
  ['Dream trip together?', ['🗼 Paris', '🗻 Japan', '🏝️ Tropical island', '🏔️ Mountain cabin']],
  ['Lazy Sunday plan?', ['😴 Sleep in', '🍳 Cook together', '📺 Binge a show', '🚶 Go outside']],
  ['Which text is the best?', ['💌 Good morning', '🌙 Good night', '📸 A random photo', '😂 A meme']],
  ['Favorite way to be close?', ['🤝 Hold hands', '🫂 Cuddle', '💋 Kiss', '🎧 Share headphones']],
  ['Pick a movie genre', ['😂 Comedy', '😱 Horror', '💘 Romance', '💥 Action']],
  ['Pick a snack', ['🍿 Popcorn', '🍫 Chocolate', '🍕 Pizza', '🍦 Ice cream']],
  ['Who is the planner?', ['🙋 Me', '🧑‍🤝‍🧑 My partner', '🤝 Both', '🎲 Nobody, chaos']],
];
const sync = {
  data: command('sync', 'Couples quiz: answer in secret, then see how in sync you are 💞')
    .addUserOption((o) => o.setName('with').setDescription('Who to play with (default: your partner)')),
  async execute(interaction) {
    const actor = interaction.user;
    const given = interaction.options.getUser('with');
    const partnerId = store.user(actor.id).rel ? store.user(actor.id).rel.partner : null;
    const other = given || (partnerId ? await interaction.client.users.fetch(partnerId).catch(() => null) : null);
    if (!other) return interaction.reply({ content: 'Pick someone to play with: `/game sync with:@user` (or get a partner with `/date`).', flags: EPH });
    if (!(await guardTarget(interaction, other, { selfMsg: 'You need a second person for this 💞' }))) return;
    const wait = cooldown(actor.id, 'sync', B.sync.cooldownMs);
    if (wait) return interaction.reply({ content: `${e('clock')} You can start another sync quiz in ${fmtDur(wait)}.`, flags: EPH });

    const players = [actor.id, other.id];
    const picked = { [actor.id]: [], [other.id]: [] }; // answers per player
    const questions = shuffle(SYNC_Q).slice(0, 6);
    const done = () => players.every((p) => picked[p].length >= questions.length);
    const lobby = (extra) => embed(COLORS.pink).setTitle(`${e('heart_pulse')} Sync quiz`)
      .setDescription(`${actor} and ${other}, press **Answer** and pick your own answers in secret (only you can see them).\nWhen you both finish, Yuna reveals how in sync you are!\n\n${players.map((p) => `${picked[p].length >= questions.length ? e('check') : '⏳'} <@${p}> ${picked[p].length}/${questions.length}`).join('\n')}${extra ? `\n\n${extra}` : ''}`);
    const qView = (n) => ({ content: `**Question ${n + 1}/${questions.length}**\n${questions[n][0]}`, components: [row(...questions[n][1].map((o, k) => button(session.cid(`q${n}${k}`), o.slice(0, 80), ButtonStyle.Secondary)))] });

    const reveal = async () => {
      session.end();
      let match = 0;
      const lines = questions.map((q, n) => {
        const a = picked[players[0]][n]; const b = picked[players[1]][n];
        if (a === b) match += 1;
        return `${a === b ? e('check') : e('cross')} ${q[0]}\n-# ${actor.displayName}: ${q[1][a]} · ${other.displayName}: ${q[1][b]}`;
      });
      const pct = Math.round((match / questions.length) * 100);
      const verdict = pct === 100 ? 'Soulmates! You think exactly alike.' : pct >= 67 ? 'Very in sync. Cute!' : pct >= 34 ? 'Opposites attract, right?' : 'Total chaos. Talk more!';
      let note = '';
      const lucky = players.filter((p) => E.underCap(p, 'sync', B.sync.dailyPaid));
      for (const p of lucky) E.earn(p, match * B.sync.rewardPerMatch + (match === questions.length ? B.sync.perfectBonus : 0));
      if (lucky.length) note = `\n${e('coin')} Both get LP for matches (${lucky.length === 2 ? 'both' : 'one'} under the daily limit).`;
      const rel = store.user(actor.id).rel;
      if (rel && rel.partner === other.id) {
        addCoupleXp(actor.id, other.id, match * 4);
        const c = getCouple(actor.id, other.id);
        c.sync = { best: Math.max((c.sync && c.sync.best) || 0, pct), last: pct, plays: ((c.sync && c.sync.plays) || 0) + 1 };
        note += `\n${e('heart_pulse')} Couple XP **+${match * 4}** · best sync **${c.sync.best}%**`;
      }
      store.save();
      return interaction.editReply({ embeds: [embed(pct >= 67 ? COLORS.pink : COLORS.purple).setTitle(`${e('heart_pulse')} Sync result: ${pct}%`)
        .setDescription(`${E.meter(pct, 12)} **${match}/${questions.length}** answers match\n*${verdict}*\n\n${lines.join('\n')}${note}`)], components: [] });
    };

    const session = create({
      ttl: 6 * 60 * 1000,
      handler: async (i, action) => {
        if (!players.includes(i.user.id)) return i.reply({ content: 'This quiz is for someone else 💔', flags: EPH });
        const mine = picked[i.user.id];
        if (action === 'go') {
          if (mine.length >= questions.length) return i.reply({ content: 'You already answered everything. Waiting for your partner! 💞', flags: EPH });
          return i.reply({ ...qView(mine.length), flags: EPH });
        }
        const n = Number(action[1]); const k = Number(action[2]);
        if (n !== mine.length) return i.deferUpdate(); // double click or old button
        mine.push(k);
        const next = mine.length < questions.length ? qView(mine.length) : { content: `${e('check')} All done! Waiting for ${i.user.id === actor.id ? other.displayName : actor.displayName}...`, components: [] };
        await i.update(next);
        if (done()) return reveal();
        return interaction.editReply({ embeds: [lobby()] }).catch(() => {});
      },
      onExpire: () => interaction.editReply({ embeds: [lobby('⏳ The quiz expired.')], components: [] }),
    });
    return interaction.reply({ content: `${other}`, embeds: [lobby()], components: [row(button(session.cid('go'), 'Answer', ButtonStyle.Success, '💞'))], allowedMentions: { users: [other.id] } });
  },
};

// ======================================================================== /game heist
const HEIST_ROLES = ['the mastermind', 'the hacker', 'the driver', 'the lockpick', 'the lookout', 'the muscle', 'the inside man', 'the distraction'];
const HEIST_WIN = ['{n} cracked the vault while the lights were out.', '{n} hacked the cameras at the perfect time.', '{n} drove the getaway like a pro.', '{n} slipped past the guards without a sound.'];
const HEIST_FAIL = ['{n} tripped the alarm.', '{n} dropped the drill on the guard\'s foot.', '{n} forgot the code. Again.', '{n} sneezed at the worst moment.'];
const heist = {
  data: command('heist', 'Crew up and rob the Yuna vault together. Bigger crew, better odds, real risk 🕶️')
    .addIntegerOption((o) => o.setName('stake').setDescription(`LP each crew member puts in (${B.heist.minStake}-${num(B.heist.maxStake)}, default ${B.heist.minStake})`).setMinValue(B.heist.minStake).setMaxValue(B.heist.maxStake)),
  async execute(interaction) {
    const H = B.heist;
    const boss = interaction.user;
    if (await E.jailed(interaction)) return;
    const stake = interaction.options.getInteger('stake') || H.minStake;
    if (!interaction.guildId) return interaction.reply({ content: 'Heists need a crew, so use this in a server channel 🕶️', flags: EPH });
    const wait = cooldown(boss.id, 'heist', H.cooldownMs);
    if (wait) return interaction.reply({ content: `${e('clock')} The cops are watching you. Next heist in ${fmtDur(wait)}.`, flags: EPH });
    if (!E.pay(boss.id, stake)) return interaction.reply({ content: `${e('cross')} You need **${num(stake)} LP** to plan a heist. You have **${num(store.user(boss.id).lp)}**.`, flags: EPH });

    const crew = [boss.id];
    let closed = false;
    const odds = () => Math.min(H.maxOdds, H.baseOdds + H.oddsPerMember * (crew.length - 2));
    const lobby = () => embed(COLORS.red).setTitle(`${e('bm_siren')} Heist: Yuna vault`)
      .setDescription(`${boss} is planning a heist! Stake: ${E.lp(stake)} each.\nCrew (${crew.length}/${H.maxCrew}): ${crew.map((c) => `<@${c}>`).join(', ')}\nSuccess chance: **${Math.round(odds() * 100)}%** (${crew.length < H.minCrew ? `need ${H.minCrew - crew.length} more` : 'ready'}) · win pays **${H.payoutMult}x**\n-# Starts in ${H.lobbySeconds} seconds. Join with the button. Failing costs your stake and might land you in jail!`);
    const buttons = (off) => [row(button(session.cid('join'), `Join (${num(stake)} LP)`, ButtonStyle.Danger, '🕶️').setDisabled(off), button(session.cid('go'), 'Start now', ButtonStyle.Secondary).setDisabled(off))];

    const run = async () => {
      if (closed) return; closed = true; session.end();
      if (crew.length < H.minCrew) {
        for (const c of crew) E.earn(c, stake, { boost: false, hard: false });
        return interaction.editReply({ embeds: [lobby().setColor(COLORS.grey).setTitle('Heist cancelled').setDescription(`Nobody joined the crew, so everyone got their ${num(stake)} LP back.`)], components: [] });
      }
      const ok = Math.random() < odds();
      const pot = stake * crew.length;
      const roles = shuffle(HEIST_ROLES);
      const events = crew.map((c, k) => `${pick(ok ? HEIST_WIN : HEIST_FAIL).replace('{n}', `<@${c}> (${roles[k % roles.length]})`)}`);
      let result;
      if (ok) {
        const share = Math.floor((pot * H.payoutMult) / crew.length);
        for (const c of crew) E.earn(c, share, { boost: false, hard: false });
        result = `${e('trophy_shine')} **SUCCESS!** The vault is empty. Everyone walks away with ${E.lp(share)} (stake ${num(stake)}).`;
      } else {
        const caught = [];
        for (const c of crew) {
          E.addHeat(c, 1);
          if (Math.random() < H.jailChance) { E.eco(c).jail = Date.now() + H.jailMinutes * 60000; caught.push(c); }
        }
        store.save();
        result = `${e('bm_siren')} **BUSTED!** The alarm went off and everyone lost their ${E.lp(stake)} stake.${caught.length ? `\n${e('cross')} Arrested for ${H.jailMinutes} minutes: ${caught.map((c) => `<@${c}>`).join(', ')}` : '\nEverybody escaped, this time.'}`;
      }
      return interaction.editReply({ embeds: [embed(ok ? COLORS.green : COLORS.red).setTitle(`${e('bm_siren')} Heist: ${ok ? 'success' : 'failed'}`).setDescription(`${events.join('\n')}\n\n${result}\n-# Crew of ${crew.length} · ${Math.round(odds() * 100)}% chance`)], components: [] });
    };

    const session = create({
      ttl: H.lobbySeconds * 1000 + 5000,
      handler: async (i, action) => {
        if (closed) return i.reply({ content: 'This heist already started.', flags: EPH });
        if (action === 'go') {
          if (i.user.id !== boss.id) return i.reply({ content: 'Only the heist leader can start early.', flags: EPH });
          await i.deferUpdate();
          return run();
        }
        if (crew.includes(i.user.id)) return i.reply({ content: 'You are already in the crew 🕶️', flags: EPH });
        if (crew.length >= H.maxCrew) return i.reply({ content: 'The crew is full.', flags: EPH });
        if (E.jailLeft(i.user.id)) return i.reply({ content: 'You are in jail, you cannot join a heist.', flags: EPH });
        if (!E.pay(i.user.id, stake)) return i.reply({ content: `You need ${num(stake)} LP to join.`, flags: EPH });
        crew.push(i.user.id);
        return i.update({ embeds: [lobby()], components: buttons(false) });
      },
      onExpire: () => run(),
    });
    // Start automatically when the lobby time is up (the session expires slightly later as a safety net).
    setTimeout(() => { if (!closed) run().catch(() => {}); }, H.lobbySeconds * 1000).unref();
    return interaction.reply({ embeds: [lobby()], components: buttons(false) });
  },
};

module.exports = { commands: [riddle, emojiguess, simon, sync, heist] };
