// Private, globally owner-only text-prefix economy administration.
// Deliberately separate from command registration: these are NOT slash commands.
const store = require('../store');

const BOT_OWNER_ID = '1066019005497868420';
const COMMAND_RE = /^yuna\s+(setlp|addlp|takelp)(?:\s+([\s\S]*))?$/i;
const USER_ID_RE = /^(?:<@!?(\d{15,25})>|(\d{15,25}))$/;
const format = (value) => value.toLocaleString('en-US');

async function handleOwnerEconomy(client, message) {
  const match = String(message.content || '').trim().match(COMMAND_RE);
  if (!match) return false;

  // This check intentionally happens before argument parsing, user fetching, or store access.
  if (!message.author || message.author.id !== BOT_OWNER_ID) return true;

  const action = match[1].toLowerCase();
  const args = (match[2] || '').trim().split(/\s+/).filter(Boolean);
  const respond = (content) => message.reply({
    content,
    allowedMentions: { parse: [], repliedUser: false },
  }).catch(() => {});

  if (args.length !== 2) {
    await respond(`Usage: \`yuna ${action} @user <amount>\``);
    return true;
  }

  const userMatch = args[0].match(USER_ID_RE);
  if (!userMatch) {
    await respond('Please provide a valid user mention or Discord user ID.');
    return true;
  }

  const amountText = args[1];
  if (!/^\d+$/.test(amountText)) {
    await respond('Amount must be a positive whole number.');
    return true;
  }
  const amount = Number(amountText);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    await respond('Amount must be a positive safe integer.');
    return true;
  }

  const targetId = userMatch[1] || userMatch[2];
  let target = message.mentions?.users?.get(targetId) || client.users.cache.get(targetId);
  if (!target) target = await client.users.fetch(targetId).catch(() => null);
  if (!target || target.id !== targetId) {
    await respond('I could not find that Discord user. Check the mention or user ID.');
    return true;
  }

  try {
    const account = store.user(targetId);
    const current = account.lp;
    if (!Number.isSafeInteger(current) || current < 0) {
      await respond('That account has an invalid cash balance; no changes were made.');
      return true;
    }

    let next;
    if (action === 'setlp') {
      next = amount;
    } else if (action === 'addlp') {
      next = current + amount;
      if (!Number.isSafeInteger(next)) {
        await respond('That addition would exceed the safe balance limit; no changes were made.');
        return true;
      }
    } else {
      if (amount > current) {
        await respond(`Insufficient cash: **${format(current)} LP** available. No changes were made.`);
        return true;
      }
      next = current - amount;
    }

    account.lp = next;
    store.save();
    const verb = action === 'setlp' ? 'set' : action === 'addlp' ? 'increased' : 'reduced';
    await respond(`Successfully ${verb} **${target.username}**'s cash balance to **${format(next)} LP**.`);
  } catch (error) {
    console.error('[owner-economy]', error);
    await respond('The balance could not be updated. No successful change was confirmed.').catch(() => {});
  }
  return true;
}

module.exports = { handleOwnerEconomy, BOT_OWNER_ID };
