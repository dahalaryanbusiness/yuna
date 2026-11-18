// Levels: every command you use earns XP (one XP gain per 15 seconds). Level ups are announced in chat and pay rewards.
//   total XP needed to REACH level L = 50 * (L-1) * L   (L2 = 100, L3 = 300, L5 = 1,000, L10 = 4,500, L20 = 19,000)
const store = require('../store');
const B = require('../data/balance');
const E = require('./eco');
const U = require('./util');
const { e } = require('./emojis');
const quests = require('./quests');

const XP_COOLDOWN = B.levels.xpCooldownMs;
const SKIP = new Set(['help', 'level', 'prefix', 'disablecommands', 'enablecommands']);

const xpFor = (L) => 50 * (L - 1) * L;
const levelOf = (xp) => 1 + Math.floor((-1 + Math.sqrt(1 + Math.max(0, xp) / 12.5)) / 2);

// Reward for reaching level L: LP every level, gems every 5th level, a Treasure Chest every 10th.
function rewardFor(L) {
  return { lp: B.levels.lpPerLevel * L, gems: L % 5 === 0 ? L : 0, chest: L % 10 === 0 ? L / 10 : 0 };
}
const nextMilestone = (L) => (Math.floor(L / 5) + 1) * 5;

function progress(xp) {
  const L = levelOf(xp);
  const floor = xpFor(L);
  const next = xpFor(L + 1);
  return { level: L, floor, next, have: xp - floor, need: next - floor, pct: Math.round(((xp - floor) / (next - floor)) * 100) };
}

function payRewards(id, from, to) {
  const total = { lp: 0, gems: 0, chest: 0 };
  for (let L = from + 1; L <= to; L++) {
    const r = rewardFor(L);
    total.lp += r.lp; total.gems += r.gems; total.chest += r.chest;
  }
  if (total.lp) E.earn(id, total.lp, { boost: false });
  if (total.gems) E.addGems(id, total.gems);
  if (total.chest) { const u = store.user(id); u.inv.chest = (u.inv.chest || 0) + total.chest; }
  store.save();
  return total;
}

function levelUpText(name, level, r, milestone) {
  const parts = [`${e('coin')} **+${U.num(r.lp)}**`];
  if (r.gems) parts.push(`${e('gem_pink')} **+${U.num(r.gems)}** gems`);
  if (r.chest) parts.push(`${e('chest')} **+${r.chest}** Treasure Chest`);
  return `${e('confetti')} **${name}** leveled up to **Level ${level}**! ${e('a_twinkle_gold')}\n${parts.join('  \u2022  ')}${milestone ? `\n-# ${e('crown')} Milestone reached!` : ''}`;
}

// Called after every successful command (slash or prefix).
async function afterCommand(interaction, cmdName) {
  if (SKIP.has(cmdName) || !interaction.user || interaction.user.bot) return;
  const id = interaction.user.id;
  const u = store.user(id);
  const canSay = Boolean(interaction.replied || interaction.deferred);

  // Quest progress: every command counts. Announce finished quests.
  try {
    let sub = null;
    try { sub = interaction.options.getSubcommand(false); } catch { sub = null; }
    const done = quests.track(id, cmdName, sub);
    if (done.length && canSay) {
      const names = done.map((d) => d.text.replace(/\*\*/g, '')).join(', ');
      await interaction.followUp({ content: `${e('gift_bounce')} **Quest complete:** ${names}\n-# Claim it with /quest claim` }).catch(() => {});
    }
  } catch (err) { console.error('[quests]', err.message); }

  // A level-up that could not be announced earlier (command had no reply) goes out now.
  if (u.lvlMsg && canSay) {
    const msg = u.lvlMsg; delete u.lvlMsg; store.save();
    await interaction.followUp({ content: msg }).catch(() => {});
  }
  if (U.cooldown(id, 'xp', XP_COOLDOWN)) return;
  const before = levelOf(u.xp || 0);
  u.xp = (u.xp || 0) + U.rand(8, 16);
  const after = levelOf(u.xp);
  store.save();
  if (after <= before) return;
  const r = payRewards(id, before, after);
  const text = levelUpText(interaction.user.displayName || interaction.user.username, after, r, r.gems > 0);
  if (!canSay) { u.lvlMsg = text; store.save(); return; }
  await interaction.followUp({ content: text }).catch(() => {});
}

module.exports = { xpFor, levelOf, rewardFor, nextMilestone, progress, afterCommand, levelUpText };
