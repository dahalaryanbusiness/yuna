// /game emojiguess: guess the game / movie / anime / place from emojis.
// Row format: [level (1 easy, 2 normal, 3 hard), emojis, answer]. Wrong answers are picked from the same category automatically.
const CATS = {
  games: { name: 'Games', icon: '🎮' },
  movies: { name: 'Movies', icon: '🎬' },
  anime: { name: 'Anime', icon: '🍥' },
  places: { name: 'Countries and cities', icon: '🌍' },
};

const DATA = {
  games: [
    [1, '⛏️🧱🟩', 'Minecraft'], [1, '🔴🧑‍🚀🔪', 'Among Us'], [1, '🪂🚌🏆', 'Fortnite'], [1, '🍄🔧👸', 'Super Mario'], [1, '⚡🐭🔴⚪', 'Pokemon'],
    [2, '🦔💨💍', 'Sonic'], [2, '🚗🔫🌴', 'GTA'], [2, '🗡️🧝🔺', 'Zelda'], [2, '🟡👻🍒', 'Pac-Man'], [2, '🐦😡🐷', 'Angry Birds'],
    [3, '🍬🍭🧩', 'Candy Crush'], [3, '⚽🎮🥅', 'FIFA'], [3, '🏃🚆🛹', 'Subway Surfers'], [3, '🐤🟩🟩', 'Flappy Bird'], [3, '🟦🟥🟨🟪', 'Tetris'],
  ],
  movies: [
    [1, '❄️👸⛄', 'Frozen'], [1, '🦁👑🌅', 'The Lion King'], [1, '🚢🧊💔', 'Titanic'], [1, '⚡👓🧙', 'Harry Potter'], [1, '🕷️🕸️🧑', 'Spider-Man'],
    [2, '🐠🔍🌊', 'Finding Nemo'], [2, '🤠🚀🧸', 'Toy Story'], [2, '🦈🏖️😱', 'Jaws'], [2, '🦖🏝️🧬', 'Jurassic Park'], [2, '🟢👹🏰', 'Shrek'],
    [3, '🎈🏠👴', 'Up'], [3, '🌺🌊🐓', 'Moana'], [3, '🦇🃏🌃', 'Batman'], [3, '⚔️🌌🌑', 'Star Wars'], [3, '🌹🐺👸', 'Beauty and the Beast'],
  ],
  anime: [
    [1, '🍥🦊🥷', 'Naruto'], [1, '🏴‍☠️👒🍖', 'One Piece'], [1, '🐉🔮🟠', 'Dragon Ball'], [1, '📓☠️🍎', 'Death Note'], [1, '🧚🔥🐲', 'Fairy Tail'],
    [2, '🗡️👹🎋', 'Demon Slayer'], [2, '🧱👁️⚔️', 'Attack on Titan'], [2, '🦸🏫💥', 'My Hero Academia'], [2, '🕷️🐺🌸', 'Tokyo Ghoul'], [2, '🏀🔥🏫', 'Kuroko no Basket'],
    [3, '⚗️🤖⭕', 'Fullmetal Alchemist'], [3, '🧿🕶️🤞', 'Jujutsu Kaisen'], [3, '🏐🧡🏫', 'Haikyuu'], [3, '🌙🌸🎀', 'Sailor Moon'], [3, '🥊👊🎯', 'One Punch Man'],
  ],
  places: [
    [1, '🗼🥖🇫🇷', 'France'], [1, '🗽🍎🚕', 'New York'], [1, '🍕🏛️🇮🇹', 'Italy'], [1, '🍣🗻🌸', 'Japan'], [1, '🕰️🇬🇧☂️', 'United Kingdom'],
    [2, '🐨🦘🏄', 'Australia'], [2, '🍁🦫🏒', 'Canada'], [2, '🔺🐫🏜️', 'Egypt'], [2, '🥨🍺🏰', 'Germany'], [2, '🌮🌵🎺', 'Mexico'],
    [3, '🛕🐘🍛', 'India'], [3, '🧀🌷🚲', 'Netherlands'], [3, '🐼🏮🥢', 'China'], [3, '🧊🌋♨️', 'Iceland'], [3, '🎡☕🚌', 'London'],
  ],
};

const ALL = [];
for (const [cat, rows] of Object.entries(DATA)) rows.forEach((r, i) => ALL.push({ id: `${cat}:${i}`, cat, level: r[0], emojis: r[1], a: r[2] }));
const answersOf = (cat) => ALL.filter((x) => x.cat === cat).map((x) => x.a);

module.exports = { CATS, ALL, answersOf };
