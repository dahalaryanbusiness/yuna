// Small helpers shared by the couple and social commands.
const store = require('../store');
const { EPH, cooldown, fmtDur } = require('./util');

const partnerId = (id) => (store.user(id).rel ? store.user(id).rel.partner : null);

// Replies and returns null when the user has no partner.
async function needPartner(interaction) {
  const p = partnerId(interaction.user.id);
  if (!p) {
    await interaction.reply({ content: 'You need a partner for this. Start a relationship with `/date`.', flags: EPH });
    return null;
  }
  return p;
}

// Starts the cooldown. Replies and returns true when the user is still waiting.
async function waiting(interaction, key, ms) {
  const left = cooldown(interaction.user.id, key, ms);
  if (!left) return false;
  await interaction.reply({ content: `Please wait ${fmtDur(left)} before using this again.`, flags: EPH });
  return true;
}

function spend(id, amount) {
  const u = store.user(id);
  if (u.lp < amount) return false;
  u.lp -= amount;
  store.save();
  return true;
}

module.exports = { partnerId, needPartner, waiting, spend };
