# What changed in 4.1 (embed rework, help guide, customization)

## Replies are embeds now
- **Root cause of the "raw text" look:** `src/lib/skin.js` had a `RAW` table that converted the embeds of ~25 commands (bank,
  business, give, crime, casino notices, explore...) into plain text. It is gone. Default style is `embed`; plain text is an
  opt-in (`ui.style: 'mixed'`).
- A new automatic layer wraps every leftover one-line message (errors, cooldowns, "you own no business") in a styled embed,
  chooses red/green/orange from the leading emoji, merges text that was sent next to an embed into that embed, and keeps
  @mentions outside so people still get pinged (never yourself).
- Errors of the text-command handler (usage errors, "something went wrong", prefix hint, "switched off in this channel",
  expired buttons) are embeds too.
- Text that would exceed Discord's embed limits is trimmed instead of making the whole command fail.

## New
- `config/yuna.config.js`: brand, colors, UI style, prefix + aliases, global command switches, presence text/type, help, performance.
- `/settings` (Manage Server): per-server accent color and footer.
- `/help` rebuilt: 14 guide pages (getting started, banking, business, text commands, admin, FAQ...), an auto-generated
  **command index** (all commands), and `/help topic:<command>` / `yuna help bank deposit` with usage, options, shortcuts and
  examples. Menu + First/Back/Next/Last/Close buttons, only the person who opened it can use them.
- `src/lib/ui.js`: reusable `notice()` and `paginate()`.
- `tools/smoke.js` + `npm test` / `npm run test:all`.

## Bugs fixed
- `/bank interest` started the 22 h cooldown even when you had less than 50 LP banked (you lost the interest for nothing).
- `/bank deposit all` / `withdraw all` with nothing to move said "give me a number"; it now says the wallet/bank is empty.
- `/emojis` crashed when the `assets/emojis` folder is missing or empty.
- Removed ~110 lines of dead duplicate code (an unused old `casino` in `economy2.js`, unused `work` and `weekly` in `social.js`).
- Lottery DMs are embeds, self-pings in `/give` and `/rob` results are gone.
- Mixed Windows/Unix line endings normalized to LF.

## Delete these old files from your project (not used by anything)
`commands/` and `lib/` in the project root (old copies of `src/commands/economy.js`, `help.js`, `src/lib/prefix.js`),
`balance.patch`, `changes.patch`, `tools/mega/__pycache__/`.

## Security
Your uploaded zip contained a real `.env` with the bot token. Reset the token in the Discord Developer Portal
(Bot > Reset Token) and put the new one only in `.env` / your host's variables.
