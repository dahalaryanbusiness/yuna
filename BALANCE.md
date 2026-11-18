# Yuna economy balance v1

Install: unzip this over your project folder (it only contains changed files under `src/`), restart the bot, then run `npm run deploy` once so slash-command descriptions that show numbers refresh.
Existing balances are untouched. Prices in the shop are unchanged, so everything is effectively 2-5x more expensive in play time.

**All numbers now live in `src/data/balance.js`.** Want it harder or easier later? Edit that one file.

## What was making it too easy (measured by running the real code)

| Source | Before | After |
|---|---|---|
| `/game rps` | ~63 LP per play, every 15s (~15,000 LP/hour) | 8-20 LP per win, 30s cooldown, **max 12 paid wins/day (~220 LP)** |
| `/game riddle` | 150-350 LP, every 40s, only 20 riddles exist | 25-60 LP, 3 min cooldown, **max 8 paid/day** |
| `/game trivia` | 15 LP every 30s | 6 LP, 90s cooldown, **max 15 paid/day** |
| `/explore dig` (best) | ~77 LP per try, 5 min (~924 LP/hour) | ~36 per try, 10 min (~216 LP/hour); rare finds 2-3x rarer |
| `/office task` | paid more per hour than a real shift | 0.5x pay, 30 min cooldown; shifts and office pay x0.75 |
| Daily quests (level 10) | ~3,400 LP/day with sweep | ~1,500 LP/day; payouts x0.5, level scaling 4% -> 1.5%, easier ones got bigger goals |
| Level ups | 250 x level LP (52,250 up to L20), XP tick every 15s | 100 x level (20,900 up to L20), XP tick every 30s |
| Affection spam (`/hug` etc.) | 3 LP / 30s (360 LP/hour) | 2 LP / 3 min |
| Businesses | paid back in 25-53 hours | pay back in 125-270 hours (prices unchanged) |
| Bank interest | 2%/day up to 1,000, risk free | 0.5%/day up to 400 |
| Weekly / monthly / quarterly | 700-1,100 / 4-6k / 14-20k | 500-800 / 2.5-3.5k / 8-11k, smaller streak bonus |
| Police patrol / arrest | 40-110 + bonus every 20 min; 150 per star bounty | 25-70 + smaller bonus every 30 min; 60 per star |

## Exploits closed

- **Couples' coinflip was +EV** (50% x 2.0 plus a 5% win bonus = 102.5% return, 250k max bet). Now 1.9x: 95% single, 97.25% couple. Dice duel also 1.9x (was exactly 100%). Max bet 250k -> 100k.
- **`/rob` was +EV** (50% win, small fine). Now 40% base odds, fine 70-110% of the stake, 2 min global cooldown (was 4s).
- **Marriage paid you** (+200 LP net for the pair). Wedding now costs 600 (was 150), rewards are smaller; the whole date/engage/marry path is a net cost.
- **Alt-account farming:** `/give` now burns 5% tax; family dinner and chores no longer scale hard with family size and pay much less; adoption gift 300 -> 100; mutual crush 100 -> 25; valentine 15 -> 5; makeup 30 -> 10; bucket list goal 10 -> 2 (was unlimited); honeymoon and date night paid less and are slower.
- **Stocks:** 2% buy fee, 3% sell fee (was 1% sell only).

## Left alone on purpose

- Slots (about 42% return) and the casino house edges are already a healthy money sink.
- The stock market still mean-reverts, so patient dip buying is possible. With the new fees that is skill, not a printer. Say the word if you want volatility or reversion reduced.
- Shop prices. If it now feels too grindy, lower rewards less, do not touch prices first.
- `/work` freelance and base job pay tiers (only the x0.75 multiplier).
- Old copies in the project root `commands/` and `lib/` are not used by `src/index.js`; I did not edit them.

## Tuning tips
- Overall too slow? Raise `quests.lpMult` and `jobs.payMult` first, they are the backbone.
- Mini-game daily caps are `dailyPaid*` in `rps`, `riddle`, `trivia`.
- Changed numbers inside a slash-command description need `npm run deploy` to show up in Discord.

`balance.patch` is the full readable diff against your original `src/`.

---

# Message format update (v1.1): plain text vs embed

Simple action results are now a normal chat message (title line in bold, then the text) instead of an embed. Rich displays stay embeds.

**Plain text now:** `/job study`, `/work`, freelance, coffee break, every `/office` result, `/crime` outcomes (success, busted, escape, bribe, bail, patrol), `/business` buy / hire / upgrade / sell / ad campaign, `/invest` buy and sell, `/explore` fish, hunt, dig, pet feed and play.

**Still embeds (on purpose):** business income breakdown, hired and promotion, boost active, arrests and "they got away" (they ping the target), profile, shop, inventory, leaderboards, help, quests, family, couples, casino, mini-games, daily / weekly / monthly claims.

Plain-text replies do not ping anyone (`allowedMentions` is empty). To flip any reply back to an embed, change `content: E.line(...)` to `embeds: [E.card(COLORS.x, title, body)]`.
