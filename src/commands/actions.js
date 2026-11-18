// More gif actions on top of /kiss and /hug. Add a line here to add another one.
// `type` must be a valid nekos.best endpoint (defaults to the command name).
const { buildAction } = require('../lib/interaction');

const actions = [
  { name: 'cuddle', description: 'Cuddle up with someone 🥰', verb: 'cuddled', emoji: '🥰', color: 0xff8fab, selfMsg: 'Cuddle a pillow instead 🛏️', botMsg: 'Bots are cold and metal 🤖' },
  { name: 'pat', description: 'Give someone head pats 💕', verb: 'patted', emoji: '💕', color: 0xffc8dd, selfMsg: 'Self-pat accepted. Good job! 👏', botMsg: 'Beep boop, thank you. 🤖' },
  { name: 'handhold', description: 'Hold someone\'s hand 🤝', verb: 'is holding hands with', emoji: '🤝', color: 0xffafcc, selfMsg: 'Holding your own hand? Aww. 💔', botMsg: 'Bots have no hands to hold 🤖' },
  { name: 'peck', description: 'Give someone a quick peck 😘', verb: 'gave a quick peck to', emoji: '😘', color: 0xff6b9d, selfMsg: "Can't peck yourself! 💔", botMsg: "Bots don't have lips! 🤖" },
  { name: 'bite', description: 'Playfully bite someone 😬', verb: 'bit', emoji: '😬', color: 0xff6b6b, selfMsg: 'Ouch! Do not bite yourself 😵', botMsg: 'Bots taste like metal 🤖' },
  { name: 'wink', description: 'Wink at someone 😉', verb: 'winked at', emoji: '😉', color: 0xffadad, selfMsg: 'Winking at the mirror 😉', botMsg: 'Bots can not wink back 🤖', solo: true, soloText: 'winked 😉' },
  { name: 'blush', description: 'Blush (optionally because of someone) 😳', verb: 'is blushing because of', emoji: '😳', color: 0xffb3c6, selfMsg: 'You are blushing at yourself? 😳', botMsg: 'Bots make you blush? 🤖', solo: true, soloText: 'is blushing 😳' },
  { name: 'smile', description: 'Smile (optionally at someone) 😊', verb: 'is smiling at', emoji: '😊', color: 0xffe066, selfMsg: 'Smile in the mirror! 😊', botMsg: 'The bot smiles back 🤖', solo: true, soloText: 'is smiling 😊' },
  { name: 'dance', description: 'Dance (optionally with someone) 💃', verb: 'is dancing with', emoji: '💃', color: 0xd0a3ff, selfMsg: 'Dance alone? We love that. 💃', botMsg: 'Bots have two left feet 🤖', solo: true, soloText: 'is dancing 💃' },
  { name: 'cry', description: 'Cry (optionally because of someone) 😭', verb: 'is crying because of', emoji: '😭', color: 0x8ecae6, selfMsg: 'It is okay to cry. 🫂', botMsg: 'Bots can not comfort you 🤖', solo: true, soloText: 'is crying 😭' },
  { name: 'tickle', description: 'Tickle someone 🤭', verb: 'tickled', emoji: '🤭', color: 0xffd6a5, selfMsg: 'You cannot tickle yourself 🤭', botMsg: 'Bots are not ticklish 🤖' },
  { name: 'feed', description: 'Feed someone something yummy 🍰', verb: 'fed', emoji: '🍰', color: 0xfdcb6e, selfMsg: 'Feeding yourself is just eating 🍽️', botMsg: 'Bots run on electricity ⚡' },
  { name: 'poke', description: 'Poke someone 👉', verb: 'poked', emoji: '👉', color: 0xa0c4ff, selfMsg: 'Poking yourself? Okay... 👉', botMsg: 'The bot ignores your poke 🤖' },
  { name: 'highfive', description: 'Give someone a high five ✋', verb: 'high-fived', emoji: '✋', color: 0x9bf6ff, selfMsg: 'Find a friend for that one ✋', botMsg: 'Bots leave you hanging 🤖' },
  { name: 'wave', description: 'Wave at someone (or everyone) 👋', verb: 'waved at', emoji: '👋', color: 0xbdb2ff, selfMsg: 'Waving at yourself 👋', botMsg: 'The bot waves back 🤖', solo: true, soloText: 'is waving 👋' },
  { name: 'pout', description: 'Pout (optionally at someone) 😤', verb: 'is pouting at', emoji: '😤', color: 0xffc6ff, selfMsg: 'Pouting at the mirror 😤', botMsg: 'Bots are immune to pouting 🤖', solo: true, soloText: 'is pouting 😤' },
  { name: 'laugh', description: 'Laugh (optionally with someone) 😂', verb: 'is laughing with', emoji: '😂', color: 0xfdffb6, selfMsg: 'Laughing alone is fine 😂', botMsg: 'Bots do not get jokes 🤖', solo: true, soloText: 'is laughing 😂' },
  { name: 'stare', description: 'Stare at someone 👀', verb: 'is staring at', emoji: '👀', color: 0xcaffbf, selfMsg: 'Staring at yourself 👀', botMsg: 'The bot stares back 🤖', solo: true, soloText: 'is staring 👀' },
  { name: 'sleep', description: 'Fall asleep (optionally next to someone) 😴', verb: 'is sleeping next to', emoji: '😴', color: 0xa9def9, selfMsg: 'Sleep tight 😴', botMsg: 'Bots never sleep 🤖', solo: true, soloText: 'is sleeping 😴' },
  { name: 'slap', description: 'Slap someone (playfully!) 🖐️', verb: 'slapped', emoji: '🖐️', color: 0xff6b6b, hostile: true, selfMsg: 'Do not slap yourself 😵', botMsg: 'Bots slap back 🤖' },
  { name: 'punch', description: 'Punch someone (playfully!) 👊', verb: 'punched', emoji: '👊', color: 0xe63946, hostile: true, selfMsg: 'Do not punch yourself 😵', botMsg: 'Bots hit harder 🤖' },
  { name: 'kick', description: 'Kick someone (playfully!) 🦵', verb: 'kicked', emoji: '🦵', color: 0xd62828, hostile: true, selfMsg: 'Do not kick yourself 😵', botMsg: 'Bots have steel boots 🤖' },
  { name: 'yeet', description: 'Yeet someone into orbit 🚀', verb: 'yeeted', emoji: '🚀', color: 0xf77f00, hostile: true, selfMsg: 'Yeeting yourself? Bold. 🚀', botMsg: 'The bot yeets you back 🤖' },
];

module.exports = { commands: actions.map(buildAction) };
