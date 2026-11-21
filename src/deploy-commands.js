// Forces a fresh registration of the slash commands (the bot already does this on start when something changed).
//   npm run deploy
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { definitions } = require('./lib/register');

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const body = definitions();
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

console.log(`Registering ${body.length} global command(s)...`);
rest.put(Routes.applicationCommands(CLIENT_ID), { body })
  .then(() => console.log('Done. Global commands can take a few minutes to show up everywhere.'))
  .catch((err) => {
    console.error(err.rawError ? JSON.stringify(err.rawError, null, 2) : err);
    process.exit(1);
  });
