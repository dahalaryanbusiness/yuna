const { COLORS, command, embed } = require('../lib/util');
const { e: emoji } = require('../lib/emojis');

const help = {
  data: command('help', 'See everything Yuna can do'),
  async execute(interaction) {
    const e = embed(COLORS.pink)
      .setTitle(`${emoji('heart_pulse')} Yuna commands`)
      .setDescription('Build relationships, show affection and collect Love Points (LP).')
      .addFields(
        { name: '💋 Affection', value: '`/kiss` `/hug` `/cuddle` `/pat` `/handhold` `/peck` `/bite` `/wink` `/blush` `/smile` `/dance` `/cry` `/tickle` `/feed` `/poke` `/highfive` `/wave` `/pout` `/laugh` `/stare` `/sleep`' },
        { name: '✨ Reactions', value: '`/react` has **60+ gif reactions** (baka, smug, clap, love, yay, sip, airkiss...). Type `/react` and search, or use `/react list`. Prefix works too: `yuna baka @user`.' },
        { name: '🎞️ Stickers and emojis', value: '`/sticker` sends an animated sticker (love u, hugs, miss u, good night...). `/emojis` shows the custom animated emojis.' },
        { name: '👊 Playful', value: '`/slap` `/punch` `/kick` `/yeet` (cost couple XP if aimed at your partner)' },
        { name: '💞 Relationships', value: '`/date` `/propose` `/marry` `/breakup` `/divorce` `/makeup` `/relationship` `/anniversary` `/exes` `/datenight` `/honeymoon`' },
        { name: '💞 Couple life', value: '`/goodmorning` `/goodnight` `/dateout` `/surprise` `/conversation` `/vow` `/memory` `/bucketlist` `/nickname` `/achievements` `/timeline`' },
        { name: '💔 Conflict and healing', value: '`/argue` `/apologize` `/moveon` `/closure`' },
        { name: '💘 Matchmaking', value: '`/ship` `/lovemeter` `/zodiac` `/crush` `/admirer`' },
        { name: '👤 Your profile', value: '`/profile` `/lovelanguage` `/birthday` `/wishlist` + `/me` (setbio, gender, looking, lovenote, inbox)' },
        { name: '💗 Rewards', value: '`/daily` `/weekly` `/monthly` `/yearly` + `/rewards` (hourly, quarterly, **decade**, boosts). `/rewards list` shows when each is ready. Streaks, jobs and relationships raise them.' },
        { name: '💼 Jobs and office', value: '`/work` (shift) `/job` (list, apply, promote, study, quit) `/office` (task, meeting, overtime, coffee, networking). 36 jobs, 8 ranks, 5 education levels.' },
        { name: '🚨 Crime and police', value: '`/crime commit` (shoplift to art heist) `/crime bail` `/crime escape` `/crime bribe` `/crime status`. Cops: `/crime patrol` and `/crime arrest @user`. `/rob` still steals from wallets.' },
        { name: '🏪 Business and stocks', value: '`/business` (buy, upgrade, collect passive income) `/invest` (market, buy, sell, portfolio, chart).' },
        { name: '🎰 Casino and lottery', value: '`/casino` coinflip, slots, blackjack, roulette, dice, wheel, highlow, scratch. `/lottery enter` for the daily jackpot (10% of casino losses feed it). Max bet 250,000, one gamble every 12s. OwO-style shortcuts: `yuna s 100` (slots), `yuna bet 100` / `yuna cf 100 h` (coinflip), `yuna bj 500`.' },
        { name: '💰 Money basics', value: '`/balance` `/cash` `/wallet` `/bank` `/give` `/leaderboard` `/shop` `/buy` `/inventory` `/gift` `/explore sell`. Gems come from long rewards and promotions.' },
        { name: '🐾 Pets and exploring', value: '`/pet` (adopt, feed, play, info) `/explore` (fish, hunt, dig for treasure and sell it)' },
        { name: '💘 Love tools (grouped)', value: '`/love` (flirt, compliment, poem, lovequote, loveletter, dedicate, valentine) `/game` (wouldyourather, truthordare, lovetrivia) `/me` (setbio, gender, looking, lovenote, inbox). Old text commands like `yuna flirt @user` still work.' },
        { name: '🌳 Family', value: '`/family` (view, adopt, disown)' },
        { name: '⭐ Levels', value: 'Every command earns XP. `/level` shows your level and bar, `/level rewards` the next rewards, `/leaderboard level` the top players. Level ups are announced and pay LP, gems every 5th level and a chest every 10th.' },
        { name: '⚙️ Server settings', value: '`yuna prefix y` sets this server\'s prefix (then `y s 100` and `ys 100` both work, `yuna prefix reset` goes back). `yuna disablecommands` switches ALL commands off in the channel you type it in, `yuna disablecommands casino give` only those. `yuna enablecommands` turns them back on. Needs Manage Channels or Manage Server.' },
        { name: 'Privacy', value: '`/privacy` to block users, switch off admirer DMs, or delete your data.' },
        {
          name: 'How it works',
          value:
            'Date someone, grow your couple level with affection, date outings and shared goals, then `/propose` (needs a ring from `/buy ring`) and `/marry`. Arguments cost couple XP until you `/apologize`. If it ends, use `/breakup` or `/divorce`; you can `/makeup` within 7 days.',
        }
      );
    return interaction.reply({ embeds: [e] });
  },
};

module.exports = help;
