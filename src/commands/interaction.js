// Shared logic for /kiss and /hug
const { EmbedBuilder } = require('discord.js');

async function getGif(type) {
  try {
    const res = await fetch(`https://nekos.best/api/v2/${type}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results?.[0]?.url ?? null;
  } catch (err) {
    console.error(`[gif:${type}]`, err.message);
    return null;
  }
}

async function run(interaction, { type, verb, emoji, color, selfMsg, botMsg }) {
  const target = interaction.options.getUser('user');

  if (target.id === interaction.user.id) {
    return interaction.reply({ content: selfMsg, ephemeral: true });
  }
  if (target.bot) {
    return interaction.reply({ content: botMsg, ephemeral: true });
  }

  await interaction.deferReply();
  const gif = await getGif(type);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(`${emoji} **${interaction.user.displayName}** ${verb} **${target.displayName}**!`);
  if (gif) embed.setImage(gif);

  return interaction.editReply({ content: `${target}`, embeds: [embed] });
}

module.exports = { run };
