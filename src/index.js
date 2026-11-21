require('dotenv').config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  ActivityType,
  PresenceUpdateStatus,
  Events,
} = require('discord.js');
const { loadCommands } = require('./loadCommands');
const interactive = require('./lib/interactive');
const { handleAdmirerButton } = require('./commands/lovetools');
const { handleBack } = require('./lib/interaction');
const emojis = require('./lib/emojis');
const skin = require('./lib/skin');
const prefixCmds = require('./lib/prefix');
const { EPH } = require('./lib/util');
const config = require('./config');
const ui = require('./lib/ui');
const store = require('./store');
const webhook = require('./webhook');
const gifs = require('./lib/gifs');
const lottery = require('./commands/lottery');
const levels = require('./lib/levels');
const channels = require('./lib/channels');
const signature = require('./commands/signature');
const register = require('./lib/register');

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

// Online status. Default is Do Not Disturb (red dot). Change with BOT_STATUS in .env:
// dnd | online | idle | invisible
const STATUS_MAP = {
  dnd: PresenceUpdateStatus.DoNotDisturb,
  online: PresenceUpdateStatus.Online,
  idle: PresenceUpdateStatus.Idle,
  invisible: PresenceUpdateStatus.Invisible,
};
const STATUS = STATUS_MAP[config.presence.status] ?? PresenceUpdateStatus.DoNotDisturb;
const ACTIVITY_TYPES = { streaming: ActivityType.Streaming, playing: ActivityType.Playing, watching: ActivityType.Watching, listening: ActivityType.Listening, competing: ActivityType.Competing };

// Activity shown under the bot's name: "Streaming <N> servers" (N = servers the bot is in).
// "Streaming" needs a Twitch/YouTube link to show properly; change it with STREAM_URL in .env / Railway Variables.
const ROTATE_MS = Math.max(30, config.presence.refreshSeconds) * 1000; // refresh the counts (config/yuna.config.js > presence)
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// Slash commands and buttons only need the Guilds intent. Prefix commands ("yuna kiss @user")
// also need Guild Messages + Message Content. Message Content is a privileged intent: switch it on
// in the Developer Portal (Bot tab > Privileged Gateway Intents). If it is off, the bot still starts
// with slash commands and mention-prefix commands ("@Yuna kiss @user").
function createClient(withMessageContent) {
  const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages];
  if (withMessageContent) intents.push(GatewayIntentBits.MessageContent);
  const client = new Client({
    intents,
    presence: { status: STATUS },
  });

  client.commands = new Collection();
  for (const cmd of loadCommands()) client.commands.set(cmd.data.name, cmd);

  // Only the servers line is shown now: "Streaming <N> servers".
  const applyPresence = () => {
    if (!client.user) return;
    const type = ACTIVITY_TYPES[String(config.presence.type).toLowerCase()] ?? ActivityType.Streaming;
    const name = String(config.presence.text)
      .replace('{servers}', fmt(client.guilds.cache.size))
      .replace('{users}', fmt(store.installCount() || client.users.cache.size))
      .replace('{commands}', fmt(client.commands.size));
    const activity = { name, type };
    if (type === ActivityType.Streaming) activity.url = config.presence.url;
    client.user.setPresence({ status: STATUS, activities: [activity] });
  };

  client.once(Events.ClientReady, (c) => {
    console.log(
      `Logged in as ${c.user.tag} | ${c.guilds.cache.size} server(s) | ${client.commands.size} commands | status: ${config.presence.status} | prefix commands: ${withMessageContent ? 'on' : 'mention only'}`
    );
    const st = store.info();
    console.log(`[store] ${st.users} user(s) loaded from ${st.loadedFrom} | folder ${st.dir} | persistent: ${st.persistent ? 'yes' : 'NO - add a Railway Volume!'}`);
    applyPresence();
    if (process.env.REGISTER_COMMANDS !== 'off') {
      register.sync(client)
        .then((r) => console.log(`[commands] ${r.count} slash commands ${r.changed ? 'registered with Discord' : 'already up to date'}`))
        .catch((err) => console.error('[commands] could not register slash commands:', err.message));
    }
    emojis.sync(client).then((r) => console.log(`[emoji] ${r.have} found, ${r.uploaded} uploaded, ${r.failed} failed`)).catch(() => {});
    const gifTypes = [];
    for (const c of client.commands.values()) {
      if (c.gifType) gifTypes.push(c.gifType);
      if (c.gifTypes) gifTypes.push(...c.gifTypes);
    }
    gifs.warm(gifTypes).catch(() => {});
    lottery.startScheduler(client); // daily /lottery draw + DMs
    require('./commands/us').startCapsuleScheduler(client); // delivers /us capsule messages when they are due
    setInterval(applyPresence, ROTATE_MS).unref();
  });

  // Keep the status and counts fresh.
  client.on(Events.ShardResume, applyPresence);

  // Prefix commands ("yuna kiss @user"), same commands as the slash ones.
  client.on(Events.MessageCreate, (message) => {
    prefixCmds.handleMessage(client, message).catch((err) => console.error('[prefix]', err.message));
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isAutocomplete()) skin.wrap(interaction); // custom Yuna emojis in everything she sends
      if (interaction.isAutocomplete()) {
        const ac = client.commands.get(interaction.commandName);
        if (ac && ac.autocomplete) await ac.autocomplete(interaction);
        return;
      }
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('ra:')) return await handleBack(interaction);
        if (ui.owns(interaction.customId)) return await ui.route(interaction);
        if (interaction.customId.startsWith('x:')) return await interactive.route(interaction);
        if (interaction.customId.startsWith('ab:')) return await handleAdmirerButton(interaction);
        if (interaction.customId.startsWith('yu:')) return await signature.route(interaction);
        return;
      }
      if (interaction.isStringSelectMenu() && ui.owns(interaction.customId)) return await ui.route(interaction);
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('x:')) return await interactive.route(interaction);
      if (interaction.isUserSelectMenu() && interaction.customId.startsWith('yu:')) return await signature.route(interaction);
      if (!interaction.isChatInputCommand()) return;
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      const subName = interaction.options.getSubcommand(false);
      if (channels.globalOff(cmd.data.name, subName)) return await interaction.reply({ embeds: [ui.notice('error', config.commands.disabledMessage)], flags: EPH });
      if (interaction.guildId && channels.isOff(interaction.guildId, interaction.channelId, cmd.data.name, subName)) {
        return await interaction.reply({ embeds: [ui.notice('error', 'That command is switched off in this channel.')], flags: EPH });
      }
      await cmd.execute(interaction);
      levels.afterCommand(interaction, cmd.data.name).catch((err) => console.error('[levels]', err.message));
    } catch (err) {
      console.error(`[${interaction.commandName || interaction.customId}]`, err);
      await replyError(interaction, 'Something went wrong running that command. Please try again in a moment.');
    }
  });

  return client;
}

async function replyError(interaction, content) {
  const msg = { embeds: [ui.notice('error', content)], flags: EPH };
  try {
    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
    else await interaction.reply(msg);
  } catch {}
}

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

async function start() {
  webhook.start();
  // Try with the Message Content intent (needed for "yuna kiss @user"). If it is not switched on in the
  // Developer Portal, fall back to slash commands + mention prefix instead of crashing.
  let withContent = true;
  for (;;) {
    const client = createClient(withContent);
    try {
      await client.login(process.env.DISCORD_TOKEN);
      return;
    } catch (err) {
      if (withContent && /disallowed intents/i.test(err.message)) {
        console.warn('[intents] Message Content intent is OFF in the Developer Portal. Starting without it (slash commands and @mention prefix still work).');
        withContent = false;
        try { client.destroy(); } catch {}
        continue;
      }
      throw err;
    }
  }
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
