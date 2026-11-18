const fs = require('node:fs');
const path = require('node:path');

// Discord allows max 100 global slash commands. Rarely used commands are FOLDED into one parent command as subcommands
// (for example /love flirt). Their old names keep working with the text prefix ("yuna flirt @user"), see FOLD_MAP.
const FOLDS = [
  { name: 'love', description: 'Love tools: flirt, compliments, poems, quotes, letters, dedications, valentines', children: ['flirt', 'compliment', 'poem', 'lovequote', 'loveletter', 'dedicate', 'valentine', 'fortune'] },
  { name: 'game', description: 'Games: riddles, emoji guess, simon, couples sync quiz, heist, trivia, rps, would you rather', children: ['riddle', 'emojiguess', 'simon', 'sync', 'heist', 'wouldyourather', 'truthordare', 'lovetrivia', 'rps'] },
  { name: 'family', description: 'Your family: tree, adopt, disown, dinner, chores and bond', children: ['family', 'adopt', 'disown', 'dinner', 'chore', 'bond'], rename: { family: 'view' } },
  { name: 'me', description: 'Your profile settings and mail: bio, gender, looking, love notes, inbox', children: ['setbio', 'gender', 'looking', 'lovenote', 'inbox'] },
];
// These gif actions keep working as text commands ("yuna wave @user") and inside /react, but are not registered as slash
// commands of their own. That frees slots for Yuna's signature features.
const PREFIX_ONLY = new Set(['tickle', 'poke', 'highfive', 'wave', 'pout', 'laugh', 'stare', 'sleep', 'wink', 'blush', 'smile', 'cry', 'feed', 'dance']);
// old command name -> [parent, subcommand]; used by the prefix handler
const FOLD_MAP = {};

function fold(def, byName) {
  const kids = def.children.map((n) => byName.get(n)).filter(Boolean);
  const subName = (c) => (def.rename && def.rename[c.data.name]) || c.data.name;
  const map = new Map(kids.map((c) => [subName(c), c]));
  const json = () => ({
    name: def.name,
    description: def.description,
    contexts: [0, 1, 2],
    integration_types: [0, 1],
    options: kids.map((c) => {
      const j = c.data.toJSON();
      return { type: 1, name: subName(c), description: j.description, options: j.options || [] };
    }),
  });
  for (const c of kids) FOLD_MAP[c.data.name] = [def.name, subName(c)];
  return {
    data: { name: def.name, toJSON: json },
    folded: kids.map((c) => c.data.name),
    async execute(interaction) {
      const child = map.get(interaction.options.getSubcommand());
      if (!child) return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
      return child.execute(interaction);
    },
    async autocomplete(interaction) {
      const child = map.get(interaction.options.getSubcommand());
      if (child && child.autocomplete) return child.autocomplete(interaction);
    },
  };
}

// Loads every command file in /commands. A file can export one command
// ({ data, execute }) or many ({ commands: [ ... ] }).
function loadCommands() {
  const dir = path.join(__dirname, 'commands');
  const commands = [];
  const seen = new Set();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = require(path.join(dir, file));
    const list = Array.isArray(mod.commands) ? mod.commands : [mod];
    for (const cmd of list) {
      if (!cmd || !cmd.data || !cmd.execute) continue;
      if (seen.has(cmd.data.name)) throw new Error(`Duplicate command name "${cmd.data.name}" in ${file}`);
      seen.add(cmd.data.name);
      commands.push(cmd);
    }
  }
  // fold groups: replace the children with their parent command
  const byName = new Map(commands.map((c) => [c.data.name, c]));
  const out = [];
  const folded = new Set();
  const parents = FOLDS.map((def) => fold(def, byName));
  for (const p of parents) for (const n of p.folded) folded.add(n);
  for (const c of commands) if (!folded.has(c.data.name)) out.push(c);
  for (const p of parents) {
    const clash = out.find((c) => c.data.name === p.data.name);
    if (clash) throw new Error(`Fold parent "${p.data.name}" clashes with an existing command`);
    out.push(p);
  }
  for (const c of out) if (PREFIX_ONLY.has(c.data.name)) c.prefixOnly = true;
  const slashCount = out.filter((c) => !c.prefixOnly).length;
  if (slashCount > 100) throw new Error(`Discord allows max 100 global commands, found ${slashCount}`);
  return out;
}

module.exports = { loadCommands, FOLD_MAP };
