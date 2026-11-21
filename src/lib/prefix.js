// Prefix commands: "yuna kiss @user" works exactly like /kiss @user.
// Messages are turned into a small interaction-like object so every slash command's
// execute() runs unchanged.
const store = require('../store');
const { getCfg } = require('./interaction');
const skin = require('./skin');
const { FOLD_MAP } = require('../loadCommands');
const channels = require('./channels');
const levels = require('./levels');
const trust = require('./trust');
const config = require('../config');
const ui = require('./ui');

const DEFAULT_PREFIX = config.prefix.default;
const ALIASES = {
  lb: 'leaderboard', top: 'leaderboard', bal: 'balance', cash: 'cash', money: 'cash', wander: 'explore', stars: 'sky', weather: 'mood', rituals: 'ritual', whispers: 'whisper', trust: 'trustedbots', inv: 'inventory', gm: 'goodmorning',
  gn: 'goodnight', rel: 'relationship', hold: 'handhold', love: 'lovemeter', bday: 'birthday',
  commands: 'help', h: 'help', cmds: 'help', anniv: 'anniversary', rw: 'rewards', rewardlist: 'rewards', lotto: 'lottery',
  lvl: 'level', rank: 'level', xp: 'level', disable: 'disablecommands', enable: 'enablecommands',
  shops: 'business', biz: 'business', stocks: 'invest', stock: 'invest', market: 'invest', cop: 'crime',
};
Object.assign(ALIASES, config.prefix.aliases); // your own shortcuts from config/yuna.config.js
// Short text commands that jump straight to a subcommand: "yuna cf 100 heads", "yuna bj 500", "yuna quarterly"...
const SUBALIAS = {
  cf: ['casino', 'coinflip'], bet: ['casino', 'coinflip'], s: ['casino', 'slots'], coinflip: ['casino', 'coinflip'], flip: ['casino', 'coinflip'], slots: ['casino', 'slots'], slot: ['casino', 'slots'],
  bj: ['casino', 'blackjack'], blackjack: ['casino', 'blackjack'], roulette: ['casino', 'roulette'], dice: ['casino', 'dice'], wheel: ['casino', 'wheel'],
  highlow: ['casino', 'highlow'], hl: ['casino', 'highlow'], scratch: ['casino', 'scratch'],
  quarterly: ['rewards', 'quarterly'], boost: ['rewards', 'boost'],
  bail: ['crime', 'bail'], patrol: ['crime', 'patrol'], arrest: ['crime', 'arrest'], escape: ['crime', 'escape'], bribe: ['crime', 'bribe'], jail: ['crime', 'status'], wanted: ['crime', 'status'],
  shoplift: ['crime', 'commit'],
  study: ['job', 'study'], promote: ['job', 'promote'], jobs: ['job', 'list'], apply: ['job', 'apply'], quit: ['job', 'quit'],
  coffee: ['office', 'coffee'], overtime: ['office', 'overtime'], meeting: ['office', 'meeting'], networking: ['office', 'networking'], desk: ['office', 'desk'],
  collect: ['business', 'collect'], portfolio: ['invest', 'portfolio'],
  fish: ['explore', 'tidepool'], hunt: ['explore', 'meadow'], dig: ['explore', 'ruins'], wish: ['sky', 'wish'], lock: ['timelock', 'lock'], vault: ['timelock', 'view'], unlock: ['timelock', 'open'], star: ['sky', 'star'], checkin: ['ritual', 'checkin'], aurareading: ['aura', 'read'], water: ['garden', 'water'], plant: ['garden', 'plant'], harvest: ['garden', 'harvest'],
};

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const ID_RE = /^(?:<@!?)?(\d{15,25})>?$/;

// Turns a typed command word ("cf", "casino", "flirt") into { name, sub } of the real command (used by /disablecommands).
function resolveName(client, raw) {
  const word = String(raw).toLowerCase();
  const name = ALIASES[word] || word;
  const cmd = client.commands.get(name);
  const jump = (!cmd || cmd.folded) && (FOLD_MAP[name] || SUBALIAS[name]);
  if (jump && !(cmd && !cmd.folded && !FOLD_MAP[name])) return { name: jump[0], sub: jump[1] };
  if (cmd) return { name: cmd.data.name, sub: null };
  if (getCfg(name)) return { name: 'react', sub: null };
  return null;
}

function getPrefix(guildId) {
  return (guildId && store.guild(guildId).prefix) || DEFAULT_PREFIX;
}

// Which prefix (custom, default, or a bot mention) does this message start with?
function matchPrefix(client, message) {
  const content = message.content;
  const lower = content.toLowerCase();
  const custom = message.guildId ? store.guild(message.guildId).prefix : null;
  const mentions = config.prefix.allowMention ? [`<@${client.user.id}>`, `<@!${client.user.id}>`] : [];
  const candidates = [...new Set([custom, DEFAULT_PREFIX, ...mentions].filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );
  for (const p of candidates) {
    if (!lower.startsWith(p.toLowerCase())) continue;
    const rest = content.slice(p.length);
    // The default word prefix ("yuna") must be followed by a space so "yunas" is ignored.
    // A server's own custom prefix can also be glued to the command: "ys 100" works like "y s 100".
    const glued = custom && p.toLowerCase() === custom.toLowerCase() && p.toLowerCase() !== DEFAULT_PREFIX;
    if (/[a-z0-9]$/i.test(p) && rest.length && !/^\s/.test(rest) && !glued) continue;
    return { prefix: p, rest: rest.trim() };
  }
  return null;
}

// Friendly "how to use it" card shown when a text command is missing something.
function usageEmbed(text, prefix, name) {
  const [first, ...rest] = String(text).split('\n');
  const em = ui.notice('warning', `${first.replace(/^Usage:\s*/, 'Try:  ')}${rest.length ? `\n${rest.join('\n')}` : ''}`, { title: 'Missing something' });
  em.addFields({ name: 'Need more help?', value: `\`${prefix} help ${name}\` shows every option with examples.` });
  return em;
}

function usage(prefix, name, sub, defs) {
  const parts = defs.map((o) => {
    const label = o.type === 6 ? '@user' : o.choices ? o.choices.map((c) => c.value).slice(0, 6).join('|') : o.name;
    return o.required ? (o.type === 6 ? label : `<${label}>`) : `[${label}]`;
  });
  return `Usage: \`${prefix} ${name}${sub ? ' ' + sub : ''}${parts.length ? ' ' + parts.join(' ') : ''}\``;
}

async function resolveUser(client, message, id) {
  return message.mentions.users.get(id) || client.users.cache.get(id) || (await client.users.fetch(id).catch(() => null));
}

// Turns the words after the command name into slash-style option values.
async function parseArgs(client, message, json, tokens, prefix) {
  let defs = json.options || [];
  let sub = null;
  if (defs.length && defs[0].type === 1) {
    const subs = defs;
    let found = subs.find((s) => s.name === (tokens[0] || '').toLowerCase());
    if (found) tokens = tokens.slice(1);
    else found = ['list', 'view', 'status', 'market', 'desk', 'info'].map((n) => subs.find((s) => s.name === n)).find(Boolean);
    if (!found) return { error: `Usage: \`${prefix} ${json.name} <${subs.map((s) => s.name).join('|')}>\``, cmd: json.name };
    sub = found.name;
    defs = found.options || [];
  }

  const values = {};
  let rest = [...tokens];
  const take = (test) => {
    const idx = rest.findIndex(test);
    if (idx === -1) return undefined;
    return rest.splice(idx, 1)[0];
  };

  // 1. users (mention or id), falling back to the author of the message being replied to
  for (const o of defs.filter((d) => d.type === 6)) {
    const tok = take((t) => ID_RE.test(t));
    let user = tok ? await resolveUser(client, message, tok.match(ID_RE)[1]) : null;
    if (!user && message.reference && message.reference.messageId && !Object.values(values).length) {
      const ref = await message.fetchReference().catch(() => null);
      if (ref) user = ref.author;
    }
    if (user) values[o.name] = user;
  }
  // 2. integers
  for (const o of defs.filter((d) => d.type === 4)) {
    const tok = take((t) => /^-?\d{1,9}$/.test(t));
    if (tok !== undefined) values[o.name] = parseInt(tok, 10);
  }
  // 3. booleans: required ones accept yes/no, optional ones match their own name
  for (const o of defs.filter((d) => d.type === 5)) {
    const yes = ['yes', 'true', 'on', 'y'];
    const no = ['no', 'false', 'off', 'n'];
    if (o.required) {
      const tok = take((t) => [...yes, ...no].includes(t.toLowerCase()));
      if (tok !== undefined) values[o.name] = yes.includes(tok.toLowerCase());
    } else {
      const tok = take((t) => t.toLowerCase() === o.name || t.toLowerCase() === o.name.slice(0, 4));
      if (tok !== undefined) values[o.name] = true;
    }
  }
  // 4. choice strings
  for (const o of defs.filter((d) => d.type === 3 && d.choices)) {
    const hit = (t) => {
      const n = norm(t);
      return o.choices.find(
        (c) =>
          norm(c.value) === n ||
          norm(c.name) === n ||
          (n.length >= 3 && norm(c.value).startsWith(n)) ||
          String(c.name).toLowerCase().split(/[^a-z0-9]+/).includes(t.toLowerCase())
      );
    };
    const idx = rest.findIndex((t) => hit(t));
    if (idx !== -1) {
      values[o.name] = hit(rest[idx]).value;
      rest.splice(idx, 1);
    }
  }
  // 5. free text
  const texts = defs.filter((d) => d.type === 3 && !d.choices);
  if (texts.length && rest.length) {
    const required = texts.filter((t) => t.required);
    const joined = rest.join(' ');
    if (joined.includes('|')) {
      joined.split('|').map((x) => x.trim()).filter(Boolean).forEach((part, i) => {
        if (texts[i]) values[texts[i].name] = part;
      });
    } else if (required.length > 1) {
      required.forEach((o, i) => {
        values[o.name] = i === required.length - 1 ? rest.slice(i).join(' ') : rest[i];
      });
    } else {
      values[(required[0] || texts[0]).name] = joined;
    }
  }

  const missing = defs.find((o) => o.required && values[o.name] === undefined);
  if (missing) {
    let msg = usage(prefix, json.name, sub, defs);
    if (missing.choices) msg += `\nChoices: ${missing.choices.map((c) => c.value).join(', ')}`;
    return { error: msg, cmd: json.name };
  }
  return { sub, values };
}

function cleanPayload(payload, ctx, edit = false) {
  const out = skin.payload(payload, ctx, edit);
  delete out.flags;
  delete out.ephemeral;
  delete out.fetchReply;
  out.allowedMentions = { parse: ['users'], repliedUser: false };
  return out;
}

function makeInteraction(client, message, name, parsed) {
  let sent = null;
  const ref = { messageReference: message.id, failIfNotExists: false };
  const post = async (payload) => {
    try {
      const clean = cleanPayload(payload, { name: parsed.cmdName || name, sub: parsed.sub, guildId: message.guildId, userId: message.author.id });
      if (name === 'cash' || name === 'wallet') clean.allowedMentions = { parse: [], repliedUser: false };
      return await message.channel.send({ ...clean, reply: ref });
    } catch (err) {
      console.error(
        `[prefix] Could not send in #${message.channel.name || message.channelId} (${err.code || err.message}). ` +
          'The bot needs View Channel, Send Messages, Embed Links and Read Message History there.'
      );
      throw err;
    }
  };

  const i = {
    client,
    commandName: name,
    user: message.author,
    member: message.member,
    guild: message.guild,
    guildId: message.guildId,
    channelId: message.channelId,
    channel: message.channel,
    memberPermissions: message.member ? message.member.permissions : null,
    deferred: false,
    replied: false,
    inGuild: () => Boolean(message.guildId),
    options: {
      getSubcommand: () => parsed.sub,
      getUser: (n) => parsed.values[n] || null,
      getString: (n) => (parsed.values[n] === undefined ? null : parsed.values[n]),
      getInteger: (n) => (parsed.values[n] === undefined ? null : parsed.values[n]),
      getBoolean: (n) => (parsed.values[n] === undefined ? null : parsed.values[n]),
      getMember: () => null,
    },
    async reply(payload) {
      i.replied = true;
      const p = typeof payload === 'string' ? { content: payload } : payload;
      // "Ephemeral" replies are private in slash mode, so keep embeds out of the channel.
      if (p.flags && (p.embeds || p.components)) {
        try {
          sent = await message.author.send(cleanPayload(p, { name: parsed.cmdName || name, sub: parsed.sub, guildId: message.guildId, userId: message.author.id }));
          return post({ content: 'I sent that to your DMs.' });
        } catch {
          return post({ content: 'That one is private. Please use the slash command for it.' });
        }
      }
      sent = await post(p);
      return sent;
    },
    async editReply(payload) {
      if (sent && sent.edit && sent.channelId === message.channelId) return sent.edit(cleanPayload(payload, { name: parsed.cmdName || name, sub: parsed.sub, guildId: message.guildId, userId: message.author.id }, true));
      sent = await post(payload);
      return sent;
    },
    async deferReply() {
      i.deferred = true;
      message.channel.sendTyping().catch(() => {});
    },
    async followUp(payload) {
      return post(payload);
    },
    async fetchReply() {
      return sent;
    },
    async deleteReply() {
      if (sent && sent.delete) await sent.delete();
    },
  };
  return i;
}

async function handleMessage(client, message) {
  if (message.system) return;
  // Bots are ignored, except bots on the trusted list (see lib/trust.js). Yuna never answers herself or webhooks.
  const fromBot = Boolean(message.author.bot);
  if (fromBot) {
    if (message.author.id === client.user.id || message.webhookId || !message.guildId) return;
    if (!trust.isTrusted(message.author.id, message.guildId)) return;
    if (message.mentions && message.mentions.repliedUser && message.mentions.repliedUser.id === client.user.id) return; // loop guard
  }
  if (process.env.DEBUG_PREFIX) {
    console.log(`[debug] message from ${message.author.tag} in ${message.guildId || 'DM'}: "${message.content}"`);
  }
  if (!message.content) return; // images, polls, voice notes and forwards have no text
  const m = matchPrefix(client, message);
  if (!m) return;

  if (!m.rest) {
    // Bare prefix or bot mention: give a hint.
    if (fromBot || channels.allOff(message.guildId, message.channelId)) return;
    if (m.prefix.toLowerCase() === DEFAULT_PREFIX || m.prefix.startsWith('<@')) {
      const shown = getPrefix(message.guildId);
      if (config.prefix.hintOnBarePrefix) await message.reply({ embeds: [ui.notice('info', `My prefix here is \`${shown}\`.\nTry \`${shown} help\` to see everything I can do.`, { title: `Hi, I'm ${config.brand.name}` })], allowedMentions: { repliedUser: false } }).catch(() => {});
    }
    return;
  }

  let [rawName, ...tokens] = m.rest.split(/\s+/);
  const name = ALIASES[rawName.toLowerCase()] || rawName.toLowerCase();
  let cmd = client.commands.get(name);
  // Folded commands keep their old text names: "yuna flirt @user" -> /love flirt. Economy shortcuts: "yuna cf 100".
  const jump = (!cmd || cmd.folded) && (FOLD_MAP[name] || SUBALIAS[name]);
  if (jump && !(cmd && !cmd.folded && !FOLD_MAP[name])) {
    cmd = client.commands.get(jump[0]);
    tokens = [jump[1], ...tokens];
  }
  // Short form for every reaction gif: "yuna baka @user" works like /react baka @user
  if (!cmd && getCfg(name)) {
    cmd = client.commands.get('react');
    tokens = [name, ...tokens];
  }
  if (!cmd) return;
  if (fromBot && (!trust.canRun(cmd.data.name) || !trust.allow(message.author.id))) return; // trusted bots: no money/admin commands, rate limited
  if (channels.globalOff(cmd.data.name, (tokens[0] || '').toLowerCase())) {
    if (!fromBot) await message.reply({ embeds: [ui.notice('error', config.commands.disabledMessage)], allowedMentions: { repliedUser: false } }).catch(() => {});
    return;
  }
  // "yuna prefix y" sets the prefix (no need to type "set"); "yuna prefix" shows it; "yuna prefix reset" resets it.
  if (cmd.data.name === 'prefix') {
    const first = (tokens[0] || '').toLowerCase();
    if (!tokens.length) tokens = ['view'];
    else if (first === 'default') tokens = ['reset'];
    else if (!['set', 'view', 'reset'].includes(first)) tokens = ['set', ...tokens];
  }
  // OwO style shorthand: "yuna cf 100 h" / "yuna bet 100 t"
  if (cmd.data.name === 'casino' && tokens[0] === 'coinflip') {
    tokens = tokens.map((t, i) => (i > 0 && t.toLowerCase() === 'h' ? 'heads' : i > 0 && t.toLowerCase() === 't' ? 'tails' : t));
  }

  // Channel switch (/disablecommands): a switched-off command does nothing at all here, whatever prefix is used.
  if (channels.isOff(message.guildId, message.channelId, cmd.data.name, (tokens[0] || '').toLowerCase())) return;

  const shown = m.prefix.startsWith('<@') ? getPrefix(message.guildId) : m.prefix;
  try {
    const parsed = await parseArgs(client, message, cmd.data.toJSON(), tokens, shown);
    if (parsed.error) {
      if (fromBot) return;
      return await message.reply({ embeds: [usageEmbed(parsed.error, shown, parsed.cmd || cmd.data.name)], allowedMentions: { repliedUser: false } });
    }
    if (channels.isOff(message.guildId, message.channelId, cmd.data.name, parsed.sub)) return;
    parsed.cmdName = cmd.data.name;
    const ix = makeInteraction(client, message, name, parsed);
    await cmd.execute(ix);
    levels.afterCommand(ix, cmd.data.name).catch((err) => console.error('[levels]', err.message));
  } catch (err) {
    console.error(`[prefix:${name}]`, err.message);
    if (!fromBot) await message.reply({ embeds: [ui.notice('error', 'Something went wrong running that command. Please try again in a moment.')], allowedMentions: { repliedUser: false } }).catch(() => {});
  }
}

module.exports = { handleMessage, getPrefix, resolveName, DEFAULT_PREFIX, ALIASES, SUBALIAS };
