# Yuna 💖

A public Discord **love + economy bot**: affection gifs, dating, marriage, an economy (Love Points), businesses, stocks, casino,
pets, games, family trees and more. Every reply is a clean embed, every command works as a slash command **and** as text
(`yuna daily`), and the look, prefix, colors, help and numbers are all configurable.

**Quick links:** [Customizing](docs/CUSTOMIZING.md) · [What changed in 4.1](CHANGES.md) · [Economy balance](BALANCE.md) · in Discord: `/help`

## Quick start
1. Node.js 18+, then `npm install`
2. Copy `.env.example` to `.env` and fill `DISCORD_TOKEN` and `CLIENT_ID`
3. `npm run deploy` (registers slash commands, run again after updates), then `npm start`
4. Tweak `config/yuna.config.js` (look, prefix, switches) and `src/data/balance.js` (economy numbers), restart
5. `npm test` checks everything without a token

---

## v4: Yuna's own features, trusted bots, 75 new emojis

### Trusted bots (Ommne and friends)
By default Yuna ignores every bot. To let a bot such as **Ommne** run text commands (`yuna hug @user`, `yuna slap @user`...):
- In a server: `/trustedbots add @Ommne` (needs **Manage Server**). `/trustedbots list` and `/trustedbots remove` manage the list. Typed version: `yuna trustedbots add <bot id>`.
- Everywhere at once: set `TRUSTED_BOT_IDS=123456789012345678,987654321098765432` in `.env` / Railway Variables.
- Safety built in: trusted bots work only in servers, only through text commands, can NOT use money / shop / crime / casino / admin / privacy commands
  (`BLOCKED` in `src/lib/trust.js`), are rate limited (1 command per 1.5 s, 8 per 20 s), are ignored when they reply to one of Yuna's own messages
  (no bot-to-bot loops), and never get error text back. Humans can hug/slap a trusted bot too.
- Needs the **Message Content** intent (already required for `yuna ...` commands).

### Only on Yuna (`src/commands/signature.js`)
| Command | What it does |
|---|---|
| `/garden` | Plant 6 flower types in your plots, water them (every 90 min), harvest, sell or craft a bouquet from 3 different blooms. You can water **other people's** gardens (you earn a little, couples earn XP). Unwatered plants wilt after 36 h. |
| `/sky` | Your own night sky: place named stars, name your constellation, couples share a second sky. `/sky wish` once every 20 h, new and full moon pay double (real moon phase). |
| `/aura` | Your aura of the day (8 elements), a reading streak (a gem every 7 days) and `/aura match @user`. |
| `/mood` | Set your emotional weather. `/mood forecast` shows the weather of the whole server (storm warnings included). |
| `/ritual` | Couple habits (daily or weekly) with a streak that only grows when BOTH of you check in. Milestones pay gems. |
| `/duet` | Write a story together, one line each (12 lines max). Finished stories go on both bookshelves (`/duet shelf`, `/duet read`). |
| `/whisper` | Anonymous kind messages posted in the channel. The receiver gets 2 guesses to find the sender (right guess pays both). Sender can be blocked with one button. Costs 15 LP. |
| `/timelock` | Lock LP for 1-365 days for a patience bonus (about +0.5% per week, max +30%), solo or joint with your partner. Opening early costs 20%. |

Prefix shortcuts: `yuna plant rose`, `yuna water`, `yuna harvest`, `yuna wish`, `yuna lock 500 14 joint`, `yuna checkin`.
Other changes: `/explore` is now tide pools / moonlit meadow / forgotten ruins (old `fish`, `hunt`, `dig` words still work as text), `/daily` is now a "love letter" card, and mild gif actions (`wave`, `poke`, `tickle`...) are text/`/react` only so slash slots are free for new features.

### New emojis
`python3 tools/make_unique_emojis.py` draws the 75 signature emojis (Garden, Sky incl. 8 moon phases, Vault, Whisper, Aura, Mood, Ritual, Duet, Trust) into `assets/emojis`.
They upload automatically at startup like the others (1,875 of the 2,000 application-emoji slots are used). **Run `npm run deploy` again** after updating.

## Setup
1. Install Node.js 18+.
2. `npm install`
3. Create a `.env` file in this folder with `DISCORD_TOKEN=...` and `CLIENT_ID=...`.
4. `npm run deploy`  (registers slash commands globally - run again after every update)
5. `npm start`

Optional `.env` values: `BOT_STATUS` (`dnd` default, `online`, `idle`, `invisible`) and `DATA_DIR`
(where `love.json` is saved, default `./data`). **Back up the data folder** - it holds everyone's relationships.

## Data and restarts (IMPORTANT for Railway)
Everything is saved to `love.json`: Love Points, relationships, couple levels, memories, notes, cooldowns.
Saves are atomic, happen within a fraction of a second, plus a safety save every 30 seconds. Backups are kept
next to it (`love.json.bak` every minute, `love.json.daily.bak` once a day) and the bot auto-restores from them.

**Railway wipes the container disk on every deploy/restart. To keep data you MUST attach a Volume:**
1. Railway > your project > your bot service > **Volumes** (or press `Ctrl+K` and type "volume") > **New Volume**.
2. Mount path: `/data`. Save.
3. Redeploy. Railway sets `RAILWAY_VOLUME_MOUNT_PATH` automatically and the bot uses it (or set `DATA_DIR=/data`
   under Variables if you prefer to be explicit).
4. Check the deploy logs. You should see `persistent: yes`. If you see the `WARNING ... WITHOUT a Volume`
   message, the volume is not attached and data will be lost.

Other hosts / your own PC: data goes to `./data` - keep that folder when updating (the zip never contains one).
Variables on Railway: `DISCORD_TOKEN`, `CLIENT_ID` (do not upload your `.env`), optional `BOT_STATUS`.
The only thing not kept across restarts is a button still waiting for an answer (an open date or proposal request).

## Live "users" counter (real installs)
Discord's own install number is only approximate and lags. To make it exact and instant:
1. Railway > your service > Variables: add `DISCORD_PUBLIC_KEY` (Developer Portal > General Information > Public Key).
2. Railway > Settings > Networking > **Generate Domain**. Redeploy and wait until it is running.
3. Developer Portal > **Webhooks**: Endpoint URL = `https://YOUR-DOMAIN.up.railway.app/webhook`, turn **Events** on and
   tick **Application Authorized** + **Application Deauthorized**. Save.
Installing counts +1 and removing the bot counts -1 within seconds. People who installed *before* this was set up
are not known to the bot: put that number in the `INSTALL_BASELINE` variable (or have them re-authorize).
Without `DISCORD_PUBLIC_KEY` the bot just shows Discord's approximate number.

## Custom emojis (76 of them)
Yuna has her own emoji pack (hearts, flowers, rings, shop items, pets, coins, icons, 20+ animated). Every file in
`assets/emojis` is uploaded **automatically at startup** as an *application emoji* (works in every server and DM, no
permissions needed). The first start takes about 1.5 minutes to upload them all, watch the log for `[emoji] ... uploaded`.
Until an emoji is uploaded the bot shows a normal unicode emoji instead. On top of that, `src/lib/skin.js` swaps plain
unicode emojis in *everything* Yuna sends (slash, prefix, buttons' messages) for the custom ones automatically.
Add your own: drop a `.png`/`.gif` named `yuna_<name>.png` into `assets/emojis`, or edit `tools/make_more_emojis.py` and run it.
`/emojis` lists them all.

## New: economy, shop, casino, pets
- `/shop` (gifts / romance / luxury shelves, every item has its own emoji) `/buy` `/gift` `/inventory` (item names autocomplete)
- `/bank` deposit / withdraw / balance / interest (bank savings are safe from `/rob`), `/balance` shows wallet + bank
- `/rob @user` steals from a wallet (45% chance, a Love Lock blocks it, getting caught costs a fine)
- `/casino` slots / coinflip / dice / wheel
- `/pet` adopt (cat, dog, bunny, fox, panda, baby dragon), feed, play, info, rename, release
- `/explore` fish / hunt / dig for LP and treasure, then `/explore sell`
Discord allows 100 global commands per bot; Yuna uses 96 of the 100 slots, so new features should go in as subcommands.

## Commands (about 100)
**Affection:** `/kiss` `/hug` `/cuddle` `/pat` `/handhold` `/peck` `/bite` `/wink` `/blush` `/smile` `/dance` `/cry`
`/tickle` `/feed` `/poke` `/highfive` `/wave` `/pout` `/laugh` `/stare` `/sleep` | playful: `/slap` `/punch` `/kick` `/yeet`
**Relationships:** `/date` `/propose` (needs a ring) `/marry` `/breakup` `/divorce` `/makeup` `/relationship`
`/anniversary` `/exes` `/datenight` `/honeymoon`
**Couple life:** `/goodmorning` `/goodnight` `/dateout` `/surprise` `/conversation` `/vow` `/memory` `/bucketlist`
`/nickname` `/achievements` `/timeline`
**Conflict and healing:** `/argue` (costs couple XP) `/apologize` (partner can forgive) `/moveon` `/closure`
**Love tools:** `/ship` `/lovemeter` `/zodiac` `/crush` `/admirer` `/loveletter` `/poem` `/compliment`
`/lovequote` `/flirt` `/valentine` `/dedicate`
**Your profile:** `/profile` `/setbio` `/lovelanguage` `/birthday` `/looking` `/wishlist` `/lovenote` `/inbox` `/gender`
**Love Points:** `/daily` `/weekly` `/work` `/balance` `/give` `/leaderboard` `/shop` `/buy` `/inventory` `/gift`
**Economy fun:** `/bank` `/rob` `/casino` `/pet` `/explore`
**Family:** `/adopt` `/disown` `/family`
**Privacy:** `/privacy` (block, unblock, admirer DMs on/off, delete all my data) and `/help`

### How the relationship system works
- `/date` -> the other person accepts with a button. One relationship at a time.
- Kisses, hugs, cuddles, gifts, date nights and daily claims raise your **couple level**.
- `/propose` needs a 💍 (`/buy ring`, 400 LP). `/marry` costs 150 LP and gives rewards + a certificate.
- `/breakup` (dating/engaged) and `/divorce` (married, 100 LP fee) both ask for confirmation, erase the
  couple level and start a 30 minute healing cooldown. `/makeup` brings an ex back within 7 days.
- `/goodmorning`, `/dateout`, `/surprise`, `/memory` and `/bucketlist` give couple XP too. `/argue` takes XP away until you `/apologize`.
- `/timeline` shows each person's relationship history; `/achievements` shows couple milestones.
- `/anniversary` pays out milestone rewards (7, 30, 100, 365... days) and yearly anniversary bonuses.

### Safety built in (important for a public bot)
- Every command aimed at someone respects `/privacy block`.
- `/admirer` is anonymous but uses preset styles + a short note, and the DM has a **Block this sender** button.
- No privileged intents are needed. Data is stored in a local JSON file; `/privacy delete` wipes a user.

## Customising
- Add/edit text (poems, shop items, date ideas) in `src/data/content.js`, and couple/social text (conversation starters, date outings, apologies) in `src/data/extra.js`.
- Add another gif action with one line in `src/commands/actions.js`, or (no command slot needed) one row in `src/data/reactions.js` - it shows up in `/react` and as `yuna <name> @user` automatically.
- Discord allows at most 100 global commands; the bot uses 94.

## Gifs
Every action keeps a pool of 40+ gifs (up to 250) filled from nekos.best, waifu.pics, purrbot and otakugifs at the same time,
cached in `gifcache.json` inside the data folder, and topped up in the background. If an action is still small, gifs from
related actions are mixed in, so replies never fall back to plain text. 60+ reactions are available through `/react`.
Each gif message has a **"<action> back"** button for the person who received it.

## Custom emojis and stickers
- `assets/emojis` (14 animated + 8 hearts) are uploaded automatically at startup as **application emojis**: they belong to the
  bot and work in every server and DM, animated included. Check the logs for `[emoji] ... uploaded`. If an upload fails the bot
  falls back to normal emojis. Use them in code with `const { e } = require('./lib/emojis'); e('sparkle')`.
- `assets/stickers` (14 animated stickers) are sent by `/sticker` as attachments, so they work everywhere with no permissions.
- Want different art? Edit `tools/make_assets.py` (needs Pillow) and run `python3 tools/make_assets.py`, or just drop your own
  `yuna_<name>.gif/png` (<=256 KB, 128x128) in `assets/emojis` and your own `.gif` in `assets/stickers`.

## Making it public
Discord Developer Portal -> your app:
- **Bot** tab: turn **Public Bot** ON.
- **Installation** tab: set Install Link to Discord-provided link, with scopes `applications.commands` + `bot`
  (user install is enabled too, so people can use it in DMs/any server).
- Share the invite link. For 100+ servers Discord requires bot verification.

## Mega emoji pack (1,700+)

`python3 tools/make_mega_emojis.py` (needs `pip install pillow`) draws ~1,700 extra emojis into `assets/emojis` and writes
`src/lib/emoji_manifest.json`. Categories: Family (members in 6 skin tones, couples, siblings, family trees), Hearts, Casino
(chips, dice, 52 cards, roulette 0-36, slot symbols), Wine & Drinks, Black Market, Flirty (playful, nothing explicit), Money,
Ranks, Faces, Pets, Food, Nature, Zodiac, Letters, UI and 124 animated ones.

- They upload as application emojis **in the background** after startup (most useful first, ~35 min for everything).
  The bot works the whole time; anything not uploaded yet shows a normal unicode emoji.
- The skin swaps unicode emojis in everything Yuna sends; you can also write `:emoji_name:` in any message text, or use `e('name')` in code.
- `/emojis` browses everything by category. `.env`: `EMOJI_SYNC=off` stops uploads, `EMOJI_UPLOAD_DELAY_MS=1100` sets the pause between uploads.
- Application emojis max out at 2,000 per bot; the pack uses ~1,800 including the classic ones.


## v3: careers, rewards, crime, business, stocks, lottery, casino
All money is Love Points (LP). **Gems** are the rare currency (monthly/quarterly/yearly/decade/century rewards, promotions); spend them on `/rewards boost`.

| Area | Commands |
|---|---|
| Timed rewards | `/daily` `/weekly` `/monthly` `/yearly` and `/rewards` (`list` `hourly` `quarterly` `decade` `century` `boost`). Streaks (+5% each, up to +100%), job rank (+3%/rank) and relationships add bonuses. Each shows a live `<t:R>` timer. |
| Careers | `/work` shift, `/job` (`list` `apply` `info` `promote` `study` `quit`): 36 jobs, 8 ranks (Intern to Executive, up to 6.5x pay), 5 education levels. |
| Office | `/office` `desk` `task` `meeting` `overtime` `coffee` `networking` (buttons, risk and reward, XP toward promotions). |
| Crime and police | `/crime commit` (shoplift, pickpocket, scam, smuggle, hack, art heist), `status` `bail` `escape` `bribe`. Police Officers/Detectives: `patrol` and `arrest @user`. Wanted stars fade 1 per 20 min. Jail blocks work, crime, rob and the casino. Lawyers halve jail time. |
| Business | `/business` `list` `buy` `collect` `upgrade` `info` `sell`: 8 businesses, 10 levels, passive income stored up to 14-32h. |
| Stocks | `/invest` `market` `buy` `sell` `portfolio` `chart`: 8 stocks/crypto, price step every 5 min, 1% sell fee. |
| Lottery | `/lottery enter` / `view` / `last`: daily draw, max 25,000 LP each, 10% of casino losses feed the jackpot, everybody gets a DM with the result (OwO style). |
| Casino | `/casino` `coinflip` `slots` `blackjack` `roulette` `dice` `wheel` `highlow` `scratch` (bet `100`, `1k`, `half`, `all`; max 50,000). |

Text shortcuts (prefix `yuna`): `cf 100 heads`, `slots 50`, `bj 500`, `roulette 100 red`, `hourly`, `lotto enter 100`, `jail`, `patrol`, `arrest @user`, `stocks`, `bal`...

### Why some commands moved
Discord allows **100** global slash commands and Yuna was at 99. To make room, rarely used ones are now subcommands of a group
(`src/loadCommands.js`, `FOLDS`): `/love` (flirt, compliment, poem, lovequote, loveletter, dedicate, valentine), `/game` (wouldyourather,
truthordare, lovetrivia), `/family` (view, adopt, disown), `/me` (setbio, gender, looking, lovenote, inbox).
Their old text commands still work (`yuna flirt @user`). The bot now registers **94** commands, so 6 slots are free.
Run `npm run deploy` again after updating so Discord removes the old commands.

### Tuning
Pay, cooldowns, prices and odds are plain numbers at the top of `src/data/careers.js` (jobs, ranks, education, businesses, stocks),
`src/commands/rewards.js` (`TABLE`), `src/commands/crime.js` (`CRIMES`) and `src/commands/casino.js` (`MAX_BET`, `WHEEL`).

## What's new (v2.1)
- **Adoption** request redesigned (avatars, family stats, expiry timer, welcome gift for both) + `/family dinner`, `/family chore`, `/family bond`.
- **/quest** (view, claim): 3 daily + 2 weekly quests that fill up automatically, daily sweep bonus and streaks.
- **/business** now has `hire` (managers), `advertise`, `top`, and random events when you collect.
- **/game rps**, **/game riddle**, **/love fortune** (also `yuna rps rock`, `yuna riddle`, `yuna fortune`).
- Run `npm run deploy` once after updating so Discord learns the new commands (exactly 100 of 100 global slots are used now; new features go into existing groups).
