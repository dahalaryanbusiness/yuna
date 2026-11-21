// Keeps Discord's slash command list in step with the code.
// It runs on every start, but only calls Discord's write endpoint when something changed (or when Discord is
// missing commands), so restarts on Railway stay cheap. Set REGISTER_COMMANDS=off to skip it.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadCommands } = require('../loadCommands');
const store = require('../store');

const definitions = () => loadCommands().filter((c) => !c.prefixOnly).map((c) => c.data.toJSON());

async function sync(client, { force = false } = {}) {
  const body = definitions();
  const hash = crypto.createHash('sha1').update(client.application.id + JSON.stringify(body)).digest('hex');
  const file = path.join(store.info().dir, 'commands.hash');
  let saved = '';
  try { saved = fs.readFileSync(file, 'utf8').trim(); } catch {}

  const live = await client.application.commands.fetch();
  if (!force && saved === hash && live.size === body.length) return { changed: false, count: body.length };

  await client.application.commands.set(body);
  try { fs.writeFileSync(file, hash); } catch {}
  return { changed: true, count: body.length };
}

module.exports = { definitions, sync };
