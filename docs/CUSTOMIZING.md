# Customizing Yuna

Everything you can change without touching the code. After any change: **restart the bot**. Run `npm run deploy` only if you
added/removed commands or changed a slash-command description.

## 1. `config/yuna.config.js` (look, prefix, switches, performance)

| Section | What it controls |
|---|---|
| `brand` | Bot name and timestamps on embeds |
| `colors` | Every embed color (pink, gold, green...) plus `success` / `error` / `warning` / `info` |
| `ui.style` | `'embed'` (default, **every** reply is an embed) or `'mixed'` (a few commands as plain text, see `ui.plainCommands`) |
| `ui.autoEmbed` | Wraps leftover plain text (errors, one-liners) in a styled embed |
| `ui.mergeContent` | Text sent together with an embed becomes part of the embed (pings stay outside so they still notify) |
| `ui.safeLimits` | Trims text that would break Discord's embed limits instead of failing |
| `prefix` | Default prefix, `@Yuna` as prefix on/off, **your own command aliases** |
| `commands.disabled` | Switch commands off for the whole bot: `'casino'`, or one subcommand `'casino:slots'` |
| `presence` | Status (dnd/online/idle), activity type (Streaming/Playing/Watching...), text with `{servers}` `{users}` `{commands}` |
| `help` | Timeout, hide pages, Invite and Support buttons |
| `performance` | Save delay, autosave and backup intervals |

A wrong value never stops the bot: it prints a `[config]` warning and uses the default.

### Plain text only where you really want it
```js
ui: { style: 'mixed', plainCommands: { give: '*', bank: ['deposit', 'withdraw'] } }
```
`'*'` = every subcommand, a list = only those, `{ not: ['view'] }` = all except those. Replies longer than 3 lines or with
progress bars stay embeds anyway.

### Your own shortcuts
```js
prefix: { aliases: { pay: 'give', b: 'balance' } }   // "yuna pay @user 50"
```

## 2. `/settings` (per server, needs Manage Server)
`/settings color #ff5c8a` accent color of Yuna's standard embeds, `/settings view`, `/settings reset`.
Status colors (green = success, red = error) are never changed.

## 3. Economy numbers: `src/data/balance.js`
Daily/weekly rewards, cooldowns, taxes, fees, casino limits, business tax and supply cost, bank interest. The help guide reads
these numbers, so it updates by itself. Shop items and shops live in `src/data/content.js` and `src/data/careers.js`.

## 4. Help text: `src/data/helpPages.js`
Every guide page is an entry with a title and fields; add, remove or reword pages there. The **command index** and
`/help topic:<command>` are generated from the real commands.

## 5. Environment variables (`.env`)
See `.env.example`. `DISCORD_TOKEN` and `CLIENT_ID` are required, everything else is optional.

## 6. Developing
- `npm test` runs ~70 commands through the real text-command pipeline with a fake Discord message (no token, no network) and
  reports crashes, silent commands, over-long embeds and any reply that is still plain text.
- `npm run test:all` tries **every subcommand** of every command once (230+ cases).
- Add your own lines to `tools/smoke-commands.txt`.
- Use `require('../lib/ui')`: `ui.notice('error', 'text')` for status embeds, `ui.paginate(interaction, pages)` for any
  multi-page viewer (buttons, menu, owner-only, auto-expire).
