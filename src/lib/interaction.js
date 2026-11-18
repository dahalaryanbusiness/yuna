// Shared engine for every gif action (/kiss, /hug, /cuddle, /slap, /react baka, ...).
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const store = require('../store');
const B = require('../data/balance');
const { getGif } = require('./gifs');
const { e } = require('./emojis');
const { command, embed, cooldown, award, addCoupleXp, bumpPair, ordinal, guardTarget, genderIcon, isBlocked, EPH } = require('./util');

// Every action config, by name. /react and the short prefix form ("yuna baka @user") look things up here.
const registry = new Map();
const register = (cfg) => registry.set(cfg.name, cfg);
const getCfg = (name) => registry.get(String(name || '').toLowerCase());
const allConfigs = () => [...registry.values()];

// Builds the slash command for one action from a small config object.
function buildAction(cfg) {
  register(cfg);
  const builder = command(cfg.name, cfg.description);
  builder.addUserOption((o) =>
    o.setName('user').setDescription(cfg.optionDesc || 'Who is it for?').setRequired(!cfg.solo)
  );
  return { data: builder, execute: (interaction) => run(interaction, cfg), gifType: cfg.type || cfg.name };
}

// boy+boy = 'mm', girl+girl = 'ff', boy+girl = 'mf'. Unknown / "other" = null (the gif engine then rotates all three equally).
function pairOf(aId, bId) {
  const a = store.user(aId).gender;
  const b = store.user(bId).gender;
  if (!['boy', 'girl'].includes(a) || !['boy', 'girl'].includes(b)) return null;
  if (a === 'boy' && b === 'boy') return 'mm';
  if (a === 'girl' && b === 'girl') return 'ff';
  return 'mf';
}

// Does the action to somebody and returns the message payload (embed + "return" button).
async function apply(actor, target, cfg, { back = true } = {}) {
  const type = cfg.type || cfg.name;
  const gif = await getGif(type, { pair: pairOf(actor.id, target.id) });
  const me = store.user(actor.id);
  const them = store.user(target.id);
  me.stats.sent[type] = (me.stats.sent[type] || 0) + 1;
  them.stats.received[type] = (them.stats.received[type] || 0) + 1;
  const count = bumpPair(actor.id, target.id, type);
  const isPartner = Boolean(me.rel && me.rel.partner === target.id);

  if (cfg.hostile) {
    if (isPartner) addCoupleXp(actor.id, target.id, -5);
  } else {
    // Small love-point reward, rate limited so it cannot be spammed for points.
    if (!cooldown(actor.id, 'actionLp', B.actions.lpCooldownMs)) award(actor.id, B.actions.lp);
    if (isPartner && !cooldown(actor.id, 'actionXp', 20000)) addCoupleXp(actor.id, target.id, 4);
  }
  store.save();

  const after = cfg.after || '';
  const names = isPartner
    ? `${genderIcon(actor.id)} **${actor.displayName}** ${cfg.verb} ${genderIcon(target.id)} **${target.displayName}**${after}!`
    : `**${actor.displayName}** ${cfg.verb} **${target.displayName}**${after}!`;
  const tail = isPartner && !cfg.hostile ? ` ${e('heart_pulse')}` : '';
  const sub = `\n-# ${e('sparkle')} ${ordinal(count)} ${cfg.noun || cfg.name} between you two`;
  const msg = embed(cfg.color).setDescription(`${cfg.emoji} ${names}${tail}${sub}`);
  if (gif) msg.setImage(gif);

  const payload = { content: `${target}`, embeds: [msg] };
  if (back && !cfg.hostile && !target.bot) {
    payload.components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ra:${cfg.name}:${actor.id}:${target.id}`)
          .setLabel(`${cfg.name[0].toUpperCase()}${cfg.name.slice(1)} back`)
          .setEmoji('🔁')
          .setStyle(ButtonStyle.Secondary)
      ),
    ];
  }
  return payload;
}

async function run(interaction, cfg) {
  const actor = interaction.user;
  const target = interaction.options.getUser('user');
  const type = cfg.type || cfg.name;

  // Solo version (e.g. /blush, /cry, /dance with nobody tagged)
  if (!target) {
    await interaction.deferReply();
    const gif = await getGif(type);
    const me = store.user(actor.id);
    me.stats.sent[type] = (me.stats.sent[type] || 0) + 1;
    store.save();
    const e1 = embed(cfg.color).setDescription(
      `${cfg.emoji} **${actor.displayName}** ${cfg.soloText}\n-# ${e('sparkle')} your ${ordinal(me.stats.sent[type])} ${cfg.noun || cfg.name}`
    );
    if (gif) e1.setImage(gif);
    return interaction.editReply({ embeds: [e1] });
  }

  const ok = await guardTarget(interaction, target, { selfMsg: cfg.selfMsg, botMsg: cfg.botMsg });
  if (!ok) return;
  await interaction.deferReply();
  return interaction.editReply(await apply(actor, target, cfg));
}

// "Kiss back" style button under an action message. Only the person who received it can press it.
async function handleBack(interaction) {
  const [, name, actorId, targetId] = interaction.customId.split(':');
  const cfg = getCfg(name);
  if (!cfg) return interaction.reply({ content: 'That action is not available anymore.', flags: EPH });
  if (interaction.user.id !== targetId) {
    return interaction.reply({ content: 'This button is only for the person it was sent to 💕', flags: EPH });
  }
  const target = await interaction.client.users.fetch(actorId).catch(() => null);
  if (!target) return interaction.reply({ content: 'I could not find that user anymore.', flags: EPH });
  if (isBlocked(interaction.user.id, target.id)) {
    return interaction.reply({ content: "💔 You can't do that with this user.", flags: EPH });
  }
  await interaction.update({ components: [] }); // remove the button so it is only used once
  return interaction.followUp(await apply(interaction.user, target, cfg, { back: false }));
}

module.exports = { run, buildAction, getGif, getCfg, allConfigs, handleBack, apply };
