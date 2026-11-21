// Focused integration tests for private owner-only prefix economy commands.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yuna-owner-economy-'));
process.env.DATA_DIR = tempDir;
const storePath = path.join(tempDir, 'love.json');
const store = require('../src/store');
const { BOT_OWNER_ID } = require('../src/commands/ownerEconomy');
const prefix = require('../src/lib/prefix');

const owner = { id: BOT_OWNER_ID, username: 'owner' };
const other = { id: '222222222222222222', username: 'other' };
const target = { id: '333333333333333333', username: 'target' };
const serverOwner = { id: '444444444444444444', username: 'server-owner' };
const admin = { id: '555555555555555555', username: 'admin' };
const replies = [];
const client = {
  users: {
    cache: new Map([[target.id, target]]),
    fetch: async (id) => id === target.id ? target : null,
  },
};
function message(author, content, guildId = 'guild-A') {
  return {
    author,
    content,
    system: false,
    webhookId: null,
    guildId,
    member: { permissions: ['Administrator'] },
    mentions: { users: new Map(content.includes(`<@${target.id}>`) ? [[target.id, target]] : []) },
    reply: async (payload) => { replies.push({ author: author.id, guildId, payload }); },
  };
}
async function run(author, content, guildId) {
  await prefix.handleMessage(client, message(author, content, guildId));
  return true;
}

(async () => {
  assert.equal(BOT_OWNER_ID, '1066019005497868420');
  store.user(target.id).lp = 5000;
  store.user(target.id).bank = 900;
  store.save();

  // All three commands work for the one owner, in different guilds.
  assert.equal(await run(owner, `yuna setlp <@${target.id}> 1000000`, 'guild-A'), true);
  assert.equal(store.user(target.id).lp, 1000000);
  assert.equal(store.user(target.id).bank, 900);
  assert.equal(await run(owner, `yuna addlp ${target.id} 500000`, 'guild-B'), true);
  assert.equal(store.user(target.id).lp, 1500000);
  assert.equal(await run(owner, `yuna takelp <@${target.id}> 200000`, 'guild-C'), true);
  assert.equal(store.user(target.id).lp, 1300000);
  assert.equal(store.user(target.id).bank, 900);

  // Unauthorized users, including simulated server owner/admin, are silent and cause no DB changes.
  const before = JSON.stringify(store.db());
  const replyCount = replies.length;
  for (const user of [other, serverOwner, admin]) {
    for (const command of ['setlp', 'addlp', 'takelp']) {
      assert.equal(await run(user, `yuna ${command} <@${target.id}> 10`, 'guild-admin-test'), true);
    }
  }
  assert.equal(replies.length, replyCount);
  assert.equal(JSON.stringify(store.db()), before);

  // Invalid amounts, missing arguments, bad targets, and insufficient cash do not mutate balances.
  for (const amount of ['0', '-1', 'NaN', 'Infinity', '1.5', '9007199254740992']) {
    await run(owner, `yuna addlp ${target.id} ${amount}`);
    assert.equal(store.user(target.id).lp, 1300000);
  }
  await run(owner, `yuna takelp ${target.id} 1300001`);
  assert.equal(store.user(target.id).lp, 1300000);
  await run(owner, 'yuna setlp not-a-user 100');
  await run(owner, 'yuna addlp');
  assert.equal(store.user(target.id).lp, 1300000);

  // Overflow is rejected without changing cash.
  store.user(target.id).lp = Number.MAX_SAFE_INTEGER - 1;
  store.save();
  await run(owner, `yuna addlp ${target.id} 2`);
  assert.equal(store.user(target.id).lp, Number.MAX_SAFE_INTEGER - 1);

  // Force the existing persistence layer to disk and reload it as a restart check.
  store.flush();
  assert.equal(fs.existsSync(storePath), true);
  delete require.cache[require.resolve('../src/store')];
  const restartedStore = require('../src/store');
  assert.equal(restartedStore.user(target.id).lp, Number.MAX_SAFE_INTEGER - 1);
  assert.equal(restartedStore.user(target.id).bank, 900);

  console.log('Owner economy tests passed: authorization, silence, all commands, validation, overflow, bank isolation, cross-guild use, persistence.');
  restartedStore.flush();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
