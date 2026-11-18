// /profile and /setbio
const store = require('../store');
const X = require('../data/extra');
const { GENDER_ICON, COLORS, EPH, command, embed, mention, num, daysSince, unix, levelInfo, getCouple } = require('../lib/util');

const ICON = { dating: '💞 Dating', engaged: '💍 Engaged', married: '💒 Married' };

function badges(u) {
  const out = [];
  const kisses = u.stats.sent.kiss || 0;
  const hugs = u.stats.sent.hug || 0;
  if (u.rel && u.rel.type === 'married') out.push('💒 Married');
  if (u.streak >= 7) out.push(`${u.streak}-day streak`);
  if (kisses >= 100) out.push('💋 Kiss Master');
  if (hugs >= 100) out.push('🤗 Hug Hero');
  if (u.stats.gifts_sent >= 25) out.push('🎁 Generous');
  if (u.stats.letters >= 10) out.push('💌 Romantic');
  if (u.stats.dates >= 20) out.push('Date Night Pro');
  if (u.lp >= 5000) out.push('👑 Love Royalty');
  if (u.inv.crown) out.push('👑 Crown Owner');
  if (u.healUntil > Date.now()) out.push('💔 Healing');
  return out;
}

const profile = {
  data: command('profile', 'See a love profile').addUserOption((o) =>
    o.setName('user').setDescription('Whose profile? (default: you)')
  ),
  async execute(interaction) {
    const who = interaction.options.getUser('user') || interaction.user;
    if (who.bot) return interaction.reply({ content: 'Bots keep their profiles private', flags: EPH });
    const u = store.user(who.id);
    const sent = Object.values(u.stats.sent).reduce((a, b) => a + b, 0);
    const received = Object.values(u.stats.received).reduce((a, b) => a + b, 0);

    let relText = 'Single';
    if (u.rel) {
      const lv = levelInfo(getCouple(who.id, u.rel.partner).xp || 0);
      relText = `${ICON[u.rel.type]} with ${mention(u.rel.partner)}\nTogether for ${daysSince(u.rel.startedAt)} days  •  Couple level ${lv.level}`;
    }
    const b = badges(u);
    const about = [];
    if (u.loveLanguage && X.loveLanguages[u.loveLanguage]) about.push(`Love language: ${X.loveLanguages[u.loveLanguage].name}`);
    if (u.birthday) {
      const [m, d] = u.birthday.split('-').map(Number);
      about.push(`Birthday: ${X.months[m - 1]} ${d}`);
    }
    if (u.gender) about.push(`Gender: ${GENDER_ICON[u.gender]} ${u.gender === 'other' ? 'Other' : u.gender === 'girl' ? 'Girl' : 'Boy'}`);
    if (u.looking && !u.rel) about.push('Open to dating');
    const pair = (sentN, gotN) => `Sent  **${num(sentN || 0)}**\nReceived  **${num(gotN || 0)}**`;
    const e = embed(COLORS.pink)
      .setAuthor({ name: `${who.displayName}'s love profile`, iconURL: who.displayAvatarURL() })
      .setThumbnail(who.displayAvatarURL({ size: 256 }))
      .setDescription(u.bio ? `*${u.bio}*` : '*No bio set. Use /setbio to add one.*')
      .addFields(
        { name: 'Relationship', value: relText },
        ...(about.length ? [{ name: 'About', value: about.join('\n') }] : []),
        { name: '💗 Love Points', value: `**${num(u.lp)}**`, inline: true },
        { name: 'Daily Streak', value: `**${u.streak}** day${u.streak === 1 ? '' : 's'}`, inline: true },
        { name: 'Interactions', value: `**${num(sent)}** sent  •  **${num(received)}** received`, inline: true },
        { name: '💋 Kisses', value: pair(u.stats.sent.kiss, u.stats.received.kiss), inline: true },
        { name: '🤗 Hugs', value: pair(u.stats.sent.hug, u.stats.received.hug), inline: true },
        { name: '🎁 Gifts', value: pair(u.stats.gifts_sent, u.stats.gifts_received), inline: true },
        { name: 'Badges', value: b.length ? b.join('  •  ') : 'No badges yet' }
      );
    return interaction.reply({ embeds: [e] });
  },
};

const setbio = {
  data: command('setbio', 'Set the bio on your love profile').addStringOption((o) =>
    o.setName('text').setDescription('Your bio (leave empty to clear)').setMaxLength(150)
  ),
  async execute(interaction) {
    const text = (interaction.options.getString('text') || '').trim();
    store.user(interaction.user.id).bio = text;
    store.save();
    return interaction.reply({ content: text ? `Bio updated: *${text}*` : 'Bio cleared.', flags: EPH, allowedMentions: { parse: [] } });
  },
};

const gender = {
  data: command('gender', 'Set the icon shown next to your name when you interact with your partner')
    .addStringOption((o) =>
      o.setName('icon').setDescription('Pick one').setRequired(true).addChoices(
        { name: '👧 Girl', value: 'girl' },
        { name: '👦 Boy', value: 'boy' },
        { name: '🧑 Other / prefer not to say', value: 'other' }
      )
    ),
  async execute(interaction) {
    const v = interaction.options.getString('icon');
    store.user(interaction.user.id).gender = v;
    store.save();
    return interaction.reply({
      content: `Saved ${GENDER_ICON[v]}. Your partner interactions (like /kiss and /hug) will show it next to your name, and hugs, kicks and other gifs will match who is in them (boy+boy, girl+girl, boy+girl).`,
      flags: EPH,
    });
  },
};

module.exports = { commands: [profile, setbio, gender] };
