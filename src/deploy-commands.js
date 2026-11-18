// Registers the slash commands GLOBALLY (works in every server the bot is in).
// Run once, and again whenever you add/change commands:  npm run deploy
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { loadCommands } = require('./loadCommands');

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const body = loadCommands().filter((c) => !c.prefixOnly).map((c) => c.data.toJSON());
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${body.length} global command(s)...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    console.log('Done! Global commands can take a few minutes to appear everywhere.');
  } catch (err) {
    console.error(err);
  }
})();
