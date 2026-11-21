// Help pages for /help. Edit the text here, no other file needs to change.
//   * Every page is one embed (kept far below Discord's 6000 character limit).
//   * `p` is the server's text prefix, `B` is src/data/balance.js, so numbers in the guide never go out of date.
//   * To hide a page without deleting it, add its key to help.hidePages in config/yuna.config.js.
//   * The "Command index" pages and /help topic:<command> are generated automatically from the real commands.
const { COLORS } = require('../lib/util');
const B = require('./balance');

const n = (x) => Number(x).toLocaleString('en-US');
const pct = (x) => `${+(x * 100).toFixed(2)}%`;

const PAGES = [
  {
    key: 'start', label: 'Getting started', emoji: '🚀', color: COLORS.pink,
    title: 'Getting started',
    blurb: 'Your first ten minutes with Yuna. Every command works two ways: as a **slash command** (`/daily`) or as **text** (`{p} daily`).',
    fields: (p) => [
      { name: '1. Collect your daily love', value: `\`/daily\` every 22 hours. Keep a streak for a bigger reward (base **${B.daily.base} LP**, up to **+${B.daily.streakMax}** for streaks, **+${B.daily.relBonus}** if you are in a relationship). \`/weekly\` and \`/monthly\` pay more.` },
      { name: '2. Earn a living', value: '`/job list` shows careers, `/job apply` gets you one, then `/work` pays out every shift. Study with `/job study` to unlock better jobs.' },
      { name: '3. Keep it safe', value: '`/bank deposit all` moves your cash into the bank where `/rob` cannot touch it. Check everything with `/balance`.' },
      { name: '4. Do the quests', value: '`/quest view` lists 3 daily and 2 weekly quests. `/quest claim` pays LP and gems.' },
      { name: '5. Grow and spend', value: '`/shop` and `/buy` for gifts and rings, `/business buy` for passive income, `/invest market` for stocks.' },
      { name: '6. Find love', value: '`/date @user` asks someone out. Hug, kiss and gift each other to raise your **couple level**, then `/propose` and `/marry`.' },
      { name: 'Lost?', value: `\`/help topic:bank\` (or \`${p} help bank\`) explains any command in detail, with every option and an example.` },
    ],
  },
  {
    key: 'love', label: 'Love & relationships', emoji: '💞', color: COLORS.pink,
    title: 'Love and relationships',
    blurb: 'Show affection, date, marry and keep the spark alive.',
    fields: () => [
      { name: '💋 Affection', value: '`/kiss` `/hug` `/cuddle` `/pat` `/handhold` `/peck` `/bite` and playful `/slap` `/punch` `/kick` `/yeet`.\nMild ones are text only: `wink` `blush` `smile` `dance` `cry` `tickle` `feed` `poke` `highfive` `wave` `pout` `laugh` `stare` `sleep`.' },
      { name: '✨ Reactions', value: '`/react` has **60+ gif reactions** (baka, smug, clap, yay...). Type `/react` and search. `/sticker` sends animated stickers, `/emojis` browses Yuna\'s custom emojis.' },
      { name: '💞 Relationship steps', value: '`/date` → `/propose` (needs a 💍 from `/buy ring`) → `/marry`. Ending things: `/breakup`, `/divorce`, then `/makeup` within 7 days, `/moveon` to heal, `/closure` for a private letter.' },
      { name: '🌹 Couple life', value: '`/goodmorning` `/goodnight` `/dateout` `/surprise` `/conversation` `/vow` `/memory` `/bucketlist` `/nickname` `/datenight` `/honeymoon` `/anniversary` `/relationship` `/timeline` `/achievements` `/exes`' },
      { name: '💔 Conflict and healing', value: '`/argue` costs couple XP until you `/apologize` (your partner can forgive you).' },
      { name: '💌 Love tools', value: '`/love` (flirt, compliment, poem, lovequote, loveletter, dedicate, valentine, fortune), `/ship`, `/lovemeter`, `/zodiac`, `/crush`, `/admirer`.' },
    ],
  },
  {
    key: 'couples', label: 'Couples & family', emoji: '👨‍👩‍👧', color: COLORS.purple,
    title: 'Couples and family',
    blurb: 'Things you only unlock together.',
    fields: () => [
      { name: '💞 /us (couples only)', value: '`/us spark` a love streak you BOTH must keep alive. `/us capsule` a message Yuna delivers days later. `/us vault` shared savings: partner approves withdrawals, `/us split` shares it 50/50 after a breakup.' },
      { name: '🌳 /family', value: '`view` your tree, `adopt` and `disown`, `dinner` (everyone earns LP), `chore`, and `bond` (family level and perks). The first adoption gives you both a welcome gift.' },
      { name: '📈 Couple level', value: 'Kisses, hugs, gifts, date outings, daily claims and shared goals raise it. Arguing lowers it. Breakups reset it.' },
    ],
  },
  {
    key: 'special', label: 'Only on Yuna', emoji: '✨', color: COLORS.purple,
    title: 'Only on Yuna',
    blurb: 'Features you will not find on other bots.',
    fields: () => [
      { name: '🌷 /garden', value: 'Plant six flower types, water them every 90 minutes (friends\' gardens too), harvest, sell or craft a bouquet from 3 different blooms. Unwatered plants wilt after 36 hours.' },
      { name: '🌌 /sky', value: 'Your own night sky: place named stars, name your constellation, make a daily `/sky wish` (new and full moon pay double).' },
      { name: '🔮 /aura  ·  🌦️ /mood', value: '`/aura` is your aura of the day with a reading streak and `/aura match @user`. `/mood set` shows your emotional weather, `/mood forecast` the whole server\'s.' },
      { name: '🔁 /ritual  ·  📖 /duet', value: '`/ritual` couple habits whose streak only grows when BOTH check in. `/duet` writes a story together, one line each, and files it on both bookshelves.' },
      { name: '🤫 /whisper  ·  ⏳ /timelock', value: '`/whisper` sends an anonymous kind message (the receiver gets 2 guesses). `/timelock` locks LP for a patience bonus; opening early costs 20%.' },
      { name: '👤 Profile', value: '`/profile` `/lovelanguage` `/birthday` `/wishlist` and `/me` (setbio, gender, looking, lovenote, inbox).' },
    ],
  },
  {
    key: 'money', label: 'Money & rewards', emoji: '🪙', color: COLORS.gold,
    title: 'Money and rewards',
    blurb: 'Love Points (**LP**) are Yuna\'s money. **Gems** are the rare currency from long rewards and promotions.',
    fields: (p) => [
      { name: '🎁 Timed rewards', value: '`/daily` `/weekly` `/monthly` and `/rewards` (quarterly, boosts). `/rewards list` shows when each one is ready. Streaks, jobs and relationships raise them.' },
      { name: '👛 Cash vs bank', value: '`/cash` = LP you carry (can be robbed). `/wallet` = LP in the bank (safe). `/balance` shows both plus your net worth.' },
      { name: '🤝 Sending and spending', value: `\`/give @user 100\` sends LP (**${pct(B.give.tax)}** tax is burned). \`/shop\`, \`/buy\`, \`/inventory\`, \`/gift\`. \`/leaderboard\` shows the top players.` },
      { name: '🎯 Quests', value: '3 daily + 2 weekly quests fill up as you play. Claim all 3 dailies for a sweep bonus and build a streak (a Treasure Chest every 5 days).' },
      { name: '⭐ Levels', value: 'Every command earns XP. `/level` shows your bar, `/level rewards` the next prizes. Level-ups pay LP, gems every 5th level and a chest every 10th.' },
      { name: '⚡ Amount shortcuts', value: `Anywhere an amount is asked you can type \`all\`, \`half\`, \`1.5k\`, \`2m\`. Example: \`${p} bank deposit half\`.` },
    ],
  },
  {
    key: 'bank', label: 'Banking guide', emoji: '🏦', color: COLORS.gold,
    title: 'Banking guide',
    blurb: 'Protect your Love Points and earn a little interest.',
    fields: (p) => [
      { name: 'How it works', value: 'LP in your **wallet** can be stolen with `/rob`. LP in the **bank** is completely safe, but you must withdraw it before betting, buying or investing.' },
      { name: 'Commands', value: `\`/bank balance\` your wallet, bank and net worth.\n\`/bank deposit <amount>\` e.g. \`${p} bank deposit all\`\n\`/bank withdraw <amount>\` e.g. \`${p} bank withdraw 5k\`\n\`/bank interest\` claim interest once every 22 hours.` },
      { name: 'Interest', value: `**${pct(B.bank.interestRate)}** of your bank balance per claim, up to **${n(B.bank.interestCap)} LP**. You need at least **50 LP** in the bank.` },
      { name: 'Good habits', value: '• Deposit after every big win (`all`).\n• Keep only what you need in your wallet.\n• `/timelock` pays a patience bonus if you can leave LP alone for days.' },
    ],
  },
  {
    key: 'jobs', label: 'Jobs & careers', emoji: '💼', color: COLORS.green,
    title: 'Jobs and careers',
    blurb: '36 jobs, 8 ranks and 5 education levels.',
    fields: () => [
      { name: '🧑‍💼 Career', value: '`/job list` `/job apply` `/job info` `/job promote` `/job study` `/job quit`. Education unlocks better jobs, promotions raise your pay.' },
      { name: '⏰ Work', value: '`/work` runs a shift (or a freelance gig without a job). Pay depends on your job and rank.' },
      { name: '🏢 Office', value: '`/office` has `desk`, `task`, `meeting`, `overtime`, `coffee` and `networking`. You need a job first. Tasks pay less than shifts on purpose.' },
    ],
  },
  {
    key: 'business', label: 'Business & stocks', emoji: '🏪', color: COLORS.green,
    title: 'Business and stocks guide',
    blurb: 'Passive income that needs care: a shop only earns while it has **supplies**.',
    fields: (p) => [
      { name: '1️⃣ Buy', value: '`/business list` shows every shop, `/business buy <shop>` opens one. It starts with ' + B.business.startHours + ' hours of supplies.' },
      { name: '2️⃣ Stock', value: `\`/business restock\` buys supplies for every shop (or pick one, or a number of hours). Without supplies a shop earns nothing. A manager makes supplies **${pct(B.business.mgrSupplyDiscount)}** cheaper.` },
      { name: '3️⃣ Collect', value: `\`/business collect\` pays your profit after **${pct(B.business.tax)}** business tax. Random events can add a bonus or cost you (inspection fine, break-in).` },
      { name: '4️⃣ Grow', value: '`/business upgrade` (max level 10) raises income and storage. `/business hire` adds a manager (+20% income, +8h storage). `/business advertise` is a gamble every 6 hours.' },
      { name: 'Good to know', value: 'Storage fills up after a few hours, so check in often. `/business sell` returns 60% of everything you paid. `/business top` ranks owners, `/business info` shows yours.' },
      { name: '📈 /invest', value: `\`market\`, \`buy\`, \`sell\`, \`portfolio\`, \`chart\`. Prices move every 5 minutes. Fees: **${pct(B.invest.buyFee)}** to buy, **${pct(B.invest.sellFee)}** to sell. Crypto swings hard.` },
    ],
  },
  {
    key: 'crime', label: 'Crime & casino', emoji: '🎰', color: COLORS.red,
    title: 'Crime and casino',
    blurb: 'Risky ways to make (or lose) LP. Only bet what you can afford to lose.',
    fields: (p) => [
      { name: '🚨 Crime and police', value: '`/crime commit` (shoplift to art heist) raises your wanted level. `bail`, `escape`, `bribe` and `status` handle jail. Cops use `/crime patrol` and `/crime arrest @user`.' },
      { name: '🥷 /rob', value: `\`/rob @user\` steals part of someone's **wallet** (the bank is safe). It can fail and cost you a fine, and every victim has their own cooldown.` },
      { name: '🎰 /casino', value: `coinflip, slots, blackjack, roulette, dice, wheel, highlow, scratch. Max bet **${n(B.casino.maxBet)} LP**.\nShortcuts: \`${p} s 100\` (slots), \`${p} cf 100 h\` (coinflip), \`${p} bj 500\` (blackjack).` },
      { name: '🎟️ /lottery', value: '`/lottery enter <amount>` joins the daily jackpot (10% of casino losses feed it). `/lottery view` and `/lottery last` show the pot and the last winner.' },
    ],
  },
  {
    key: 'play', label: 'Games, pets & exploring', emoji: '🎲', color: COLORS.orange,
    title: 'Games, pets and exploring',
    blurb: 'Play together, adopt a pet, wander the world.',
    fields: (p) => [
      { name: '🎮 /game', value: `\`riddle\` (11 topics × 3 levels), \`emojiguess\`, \`simon\`, \`sync\` (couples quiz), \`heist\` (crew up and rob the vault), \`rps\`, \`lovetrivia\`, \`wouldyourather\`, \`truthordare\`. Text: \`${p} riddle minecraft hard\`.\nPaid rounds are capped per day, you can still play after that for fun.` },
      { name: '🐾 /pet', value: '`adopt`, `feed`, `play`, `info`, `rename`, `release`. Pets grow and earn LP for you.' },
      { name: '🌊 /explore', value: '`tidepool`, `meadow`, `ruins` find coins and keepsakes. `/explore sell` turns keepsakes into LP. Text-only words `fish`, `hunt`, `dig` still work.' },
    ],
  },
  {
    key: 'text', label: 'Text commands & shortcuts', emoji: '⌨️', color: COLORS.info || 0x8ab4f8,
    title: 'Text commands and shortcuts',
    blurb: 'Everything works without slash commands too.',
    fields: (p) => [
      { name: 'Prefix', value: `Start a message with \`${p}\` (or mention me). Example: \`${p} hug @user\`. Admins can change it with \`${p} prefix <new>\`. A short custom prefix also works glued: \`${p}s 100\`.` },
      { name: 'Targets', value: 'Mention someone, paste their ID, or **reply** to their message and leave the user out.' },
      { name: 'Built-in shortcuts', value: '`lb` leaderboard · `bal` balance · `inv` inventory · `gm` goodmorning · `gn` goodnight · `rel` relationship · `lvl` level · `lotto` lottery · `biz` business · `stocks` invest · `cf` coinflip · `s` slots · `bj` blackjack · `collect` business collect · `water` / `plant` / `harvest` garden · `wish` sky wish' },
      { name: 'Two text values', value: 'Separate them with `|` when both are free text, e.g. `' + p + ' lovemeter Anna | Ben`.' },
      { name: 'Your own shortcuts', value: 'Server owners running the bot can add aliases in `config/yuna.config.js` under `prefix.aliases`.' },
    ],
  },
  {
    key: 'admin', label: 'Server settings', emoji: '⚙️', color: COLORS.grey,
    title: 'Server settings (admins)',
    blurb: 'Need **Manage Server** (or **Manage Channels** for the channel switches).',
    fields: (p) => [
      { name: '🎨 /settings', value: 'Set the server\'s accent color (`/settings color`), see everything with `/settings view` and undo with `/settings reset`.' },
      { name: '🔤 Prefix', value: `\`${p} prefix <new>\` sets it, \`${p} prefix\` shows it, \`${p} prefix reset\` goes back to the default.` },
      { name: '🚫 Channel switches', value: `\`${p} disablecommands\` turns ALL commands off in the current channel, \`${p} disablecommands casino give\` only those. \`${p} enablecommands\` turns them back on.` },
      { name: '🤖 Trusted bots', value: '`/trustedbots add @bot` lets a bot (like Ommne) run text commands such as `yuna hug @user`. Money, shop, crime, casino, admin and privacy commands stay blocked for bots.' },
    ],
  },
  {
    key: 'privacy', label: 'Privacy & safety', emoji: '🛡️', color: COLORS.grey,
    title: 'Privacy and safety',
    blurb: 'You are in control of your data.',
    fields: () => [
      { name: '/privacy', value: '`block` and `unblock` people, `blocked` lists them, `admirers` switches anonymous admirer DMs on or off, `delete` erases all your data and relationships.' },
      { name: 'Good to know', value: 'Blocked people cannot send you interactions. Bots cannot be targeted unless the server trusts them. Data is saved automatically with rolling backups.' },
    ],
  },
  {
    key: 'faq', label: 'FAQ & troubleshooting', emoji: '❓', color: COLORS.info || 0x8ab4f8,
    title: 'FAQ and troubleshooting',
    blurb: 'Quick answers to common problems.',
    fields: (p) => [
      { name: 'I type a text command and nothing happens', value: `Check the prefix (\`@Yuna\` always works), make sure I can **View Channel**, **Send Messages**, **Embed Links** and **Read Message History** there, and that the channel was not switched off with \`disablecommands\`.` },
      { name: 'My buttons stopped working', value: 'Menus and requests expire after a few minutes. Just run the command again.' },
      { name: '"Not enough LP"', value: `Money in the bank is not in your wallet. Use \`${p} bank withdraw <amount>\` first, then try again.` },
      { name: 'My shop earns nothing', value: '`/business info` shows which shops are out of supplies. `/business restock` fixes it.' },
      { name: 'Someone keeps robbing me', value: '`/bank deposit all`. Banked LP cannot be robbed.' },
      { name: 'I found a bug', value: 'Tell the server staff or the bot owner with the exact command you typed.' },
    ],
  },
];

// Short extras for /help topic:<command>. `examples` use {p} for the prefix. Everything else (usage, options,
// subcommands) is generated from the real command definition, so it can never go out of date.
const DETAILS = {
  bank: { examples: ['/bank deposit all', '{p} bank withdraw 5k', '{p} wallet'], notes: 'Banked LP is safe from /rob. Interest is paid once every 22 hours.' },
  business: { examples: ['/business buy', '{p} business restock', '{p} collect'], notes: 'Shops only earn while stocked. Collecting pays business tax and may trigger random events.' },
  invest: { examples: ['/invest market', '{p} stocks buy YUNA 5', '{p} invest portfolio'], notes: 'Prices move every 5 minutes. Buying and selling have small fees.' },
  casino: { examples: ['{p} cf 100 heads', '{p} s 500', '{p} bj 1k'], notes: 'Amounts accept all, half, 1.5k, 2m. There is a maximum bet.' },
  daily: { examples: ['/daily', '{p} daily'], notes: 'Claim again after 22 hours. Waiting more than 48 hours resets your streak.' },
  give: { examples: ['/give @user 100', '{p} give @user half'], notes: 'A small tax is burned on every transfer.' },
  rob: { examples: ['/rob @user', '{p} rob @user'], notes: 'Only wallets can be robbed. Failing costs you a fine.' },
  crime: { examples: ['/crime commit', '{p} bail', '{p} jail'], notes: 'Crime raises your wanted level. Heat cools down over time.' },
  job: { examples: ['/job list', '{p} apply', '{p} study'], notes: 'Better jobs need higher education and rank.' },
  help: { examples: ['/help', '/help topic:bank', '{p} help business'], notes: 'Use the menu or the buttons to move between pages.' },
  prefix: { examples: ['{p} prefix y', '{p} prefix reset'], notes: 'Needs Manage Server to change.' },
  settings: { examples: ['/settings color #ff5c8a', '/settings view', '/settings reset'], notes: 'Needs Manage Server.' },
};

module.exports = { PAGES, DETAILS };
