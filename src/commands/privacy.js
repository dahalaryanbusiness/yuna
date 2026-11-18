// Privacy and safety: block users, opt out of anonymous admirer DMs, delete all your data.
const store = require('../store');
const { ask } = require('../lib/interactive');
const { COLORS, EPH, command, embed, mention } = require('../lib/util');

const privacy = {
  data: command('privacy', 'Block people, control admirer DMs, delete your data')
    .addSubcommand((s) =>
      s.setName('block').setDescription('Block a user from interacting with you')
        .addUserOption((o) => o.setName('user').setDescription('Who to block').setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName('unblock').setDescription('Unblock a user')
        .addUserOption((o) => o.setName('user').setDescription('Who to unblock').setRequired(true))
    )
    .addSubcommand((s) => s.setName('blocked').setDescription('See who you blocked'))
    .addSubcommand((s) =>
      s.setName('admirers').setDescription('Turn anonymous admirer DMs on or off')
        .addBooleanOption((o) => o.setName('enabled').setDescription('Receive admirer messages?').setRequired(true))
    )
    .addSubcommand((s) => s.setName('delete').setDescription('Permanently delete all your data from this bot')),
  async execute(interaction) {
    const actor = interaction.user;
    const me = store.user(actor.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'block') {
      const target = interaction.options.getUser('user');
      if (target.id === actor.id || target.bot) return interaction.reply({ content: "You can't block that one.", flags: EPH });
      if (!me.blocked.includes(target.id)) me.blocked.push(target.id);
      // Blocking someone you are with ends it, quietly.
      if (me.rel && me.rel.partner === target.id) {
        const t = store.user(target.id);
        me.rel = null;
        t.rel = null;
        delete store.db().couples[store.pairKey(actor.id, target.id)];
      }
      store.save();
      return interaction.reply({ content: `Blocked ${mention(target.id)}. They can no longer target you with any command.`, flags: EPH });
    }
    if (sub === 'unblock') {
      const target = interaction.options.getUser('user');
      me.blocked = me.blocked.filter((x) => x !== target.id);
      store.save();
      return interaction.reply({ content: `Unblocked ${mention(target.id)}.`, flags: EPH });
    }
    if (sub === 'blocked') {
      const list = me.blocked.length ? me.blocked.map((id) => `• ${mention(id)}`).join('\n') : 'Nobody blocked.';
      return interaction.reply({ embeds: [embed(COLORS.grey).setTitle('Blocked users').setDescription(list)], flags: EPH });
    }
    if (sub === 'admirers') {
      me.admirers = interaction.options.getBoolean('enabled');
      store.save();
      return interaction.reply({ content: me.admirers ? 'Anonymous admirer DMs are **on**.' : 'Anonymous admirer DMs are **off**.', flags: EPH });
    }

    // delete
    return ask(interaction, {
      to: actor.id,
      content: 'This permanently deletes your love points, items, profile, relationship, notes and crushes. It cannot be undone. Continue?',
      yes: 'Delete everything',
      no: 'Cancel',
      yesEmoji: '',
      noEmoji: '',
      yesStyle: 4,
      onYes: (i) => {
        store.deleteUser(actor.id);
        return i.update({ content: 'All your data was deleted.', components: [] });
      },
      onNo: (i) => i.update({ content: 'Cancelled. Nothing was deleted.', components: [] }),
    });
  },
};

module.exports = privacy;
