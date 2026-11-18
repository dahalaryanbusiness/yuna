// Button sessions. State lives in memory and is routed from index.js by customId
// ("x:<sessionId>:<action>"), so it works in servers, DMs and user-installed contexts
// without needing channel access or any privileged intent.
const crypto = require('node:crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EPH } = require('./util');

const sessions = new Map();

function create({ ttl = 120000, handler, onExpire }) {
  const id = crypto.randomBytes(5).toString('hex');
  const session = {
    id,
    cid: (action) => `x:${id}:${action}`,
    handler,
    end() {
      clearTimeout(session.timer);
      sessions.delete(id);
    },
  };
  session.timer = setTimeout(() => {
    sessions.delete(id);
    if (onExpire) Promise.resolve(onExpire()).catch(() => {});
  }, ttl);
  if (session.timer.unref) session.timer.unref();
  sessions.set(id, session);
  return session;
}

async function route(interaction) {
  const [, id, action] = interaction.customId.split(':');
  const session = sessions.get(id);
  if (!session) {
    return interaction.reply({ embeds: [require('./ui').notice('info', 'This button has expired. Run the command again.')], flags: EPH });
  }
  return session.handler(interaction, action, session);
}

const button = (customId, label, style = ButtonStyle.Primary, emoji) => {
  const b = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
};

const row = (...buttons) => new ActionRowBuilder().addComponents(...buttons);

// Asks one or more users to accept/decline. onYes / onNo receive the button interaction
// and should answer it with i.update({ ... }).
async function ask(interaction, opts) {
  const {
    to,
    content,
    embeds,
    yes = 'Accept',
    no = 'Decline',
    yesEmoji = '💖',
    noEmoji = '💔',
    yesStyle = ButtonStyle.Success,
    onYes,
    onNo,
    ttl = 180000,
    expiredText = '⏳ This request expired.',
  } = opts;
  const allowed = [].concat(to);

  const session = create({
    ttl,
    handler: async (i, action) => {
      if (!allowed.includes(i.user.id)) {
        return i.reply({ content: "This isn't for you 💔", flags: EPH });
      }
      session.end();
      if (action === 'y') return onYes(i);
      if (onNo) return onNo(i);
      return i.update({ content: '💔 Declined.', embeds: [], components: [] });
    },
    onExpire: () =>
      interaction.editReply({ content: expiredText, embeds: [], components: [] }),
  });

  const components = [
    row(
      button(session.cid('y'), yes, yesStyle, yesEmoji),
      button(session.cid('n'), no, ButtonStyle.Danger, noEmoji)
    ),
  ];
  const payload = { content, embeds, components };
  return interaction.deferred || interaction.replied
    ? interaction.editReply(payload)
    : interaction.reply(payload);
}

module.exports = { create, route, ask, button, row, ButtonStyle };
