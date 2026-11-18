// ============================================================================================================
//  YUNA CONFIGURATION  -  every setting in one place. Edit, save, restart the bot. Nothing here is required:
//  delete any line and the built-in default is used. Environment variables (.env) override a few of these
//  (see docs/CUSTOMIZING.md). Numbers for the economy (prices, payouts, cooldowns) live in src/data/balance.js.
// ============================================================================================================
module.exports = {
  // ---------------------------------------------------------------- brand
  brand: {
    name: 'Yuna',
    footer: 'Yuna  \u2022  /help',   // small text under embeds. Use '' to hide it.
    showFooter: true,                // false = never add a footer (commands that set their own footer keep it)
    showTimestamp: false,            // true = every embed shows the time it was sent
  },

  // ---------------------------------------------------------------- colors (hex numbers)
  // Change a color here and every embed that uses it changes. success/error/warning/info are used for the
  // automatic "status" embeds (checkmarks, errors, warnings, notices).
  colors: {
    pink: 0xff5c8a, red: 0xe63946, gold: 0xffc857, purple: 0xb085f5, grey: 0x6c757d, orange: 0xffb347, green: 0x57d68d,
    success: 0x57d68d, error: 0xe63946, warning: 0xffb347, info: 0x8ab4f8, neutral: 0xff5c8a,
  },

  // ---------------------------------------------------------------- how replies look
  ui: {
    // 'embed' = EVERY reply is an embed (recommended). 'mixed' = embeds, except the commands listed in plainCommands.
    style: 'embed',
    // Only used when style is 'mixed'. Same format as before:  command: '*'  |  ['sub', 'sub']  |  { not: ['sub'] }
    plainCommands: {
      // bank: ['deposit', 'withdraw'],
      // give: '*',
    },
    autoEmbed: true,        // wrap any leftover plain-text reply (errors, notices, one-liners) in a styled embed
    mergeContent: true,     // text sent together with an embed is merged INTO the embed (mentions stay outside so they ping)
    statusEmoji: true,      // choose the embed color from the leading emoji (check = green, cross = red, warning = orange...)
    safeLimits: true,       // trim text that would exceed Discord's embed limits instead of failing with an error
    errorTitle: 'Oops',     // titles of automatic status embeds. Set any to '' for no title.
    successTitle: '',
    warningTitle: 'Heads up',
    infoTitle: '',
  },

  // ---------------------------------------------------------------- text commands ("yuna kiss @user")
  prefix: {
    default: 'yuna',        // used everywhere a server has not set its own (/prefix, "yuna prefix y")
    allowMention: true,     // "@Yuna help" works as a prefix
    // Your own command words: { shortcut: 'real command' }. Merged with the built-in aliases (lb, bal, inv, ...).
    aliases: {
      // pay: 'give',
    },
    hintOnBarePrefix: true, // typing only the prefix answers with a hint
  },

  // ---------------------------------------------------------------- command switches
  commands: {
    // Turn commands off for the whole bot. 'casino' = whole command, 'casino:slots' = one subcommand.
    disabled: [],
    disabledMessage: 'That command is turned off.',
  },

  // ---------------------------------------------------------------- bot presence
  presence: {
    status: 'dnd',          // dnd | online | idle | invisible   (BOT_STATUS in .env overrides)
    type: 'Streaming',      // Streaming | Playing | Watching | Listening | Competing
    text: '{servers} servers', // placeholders: {servers} {users} {commands}
    url: 'https://www.twitch.tv/discord', // only used by Streaming
    refreshSeconds: 60,
  },

  // ---------------------------------------------------------------- /help
  help: {
    timeoutSeconds: 600,    // how long the help buttons keep working
    inviteUrl: '',          // shows an "Invite" button when set
    supportUrl: '',         // shows a "Support" button when set
    hidePages: [],          // page keys to hide, e.g. ['crime']
    showPrefixTips: true,
  },

  // ---------------------------------------------------------------- performance / storage
  performance: {
    saveDelayMs: 400,        // wait this long to batch several changes into one disk write
    autosaveSeconds: 30,
    backupEverySeconds: 60,
    maxButtonSessions: 5000, // safety cap for open button menus
  },
};
