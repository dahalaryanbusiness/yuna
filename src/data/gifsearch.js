// Gif SEARCH settings: lets the bot ask for the right pairing (boy+boy, girl+girl, boy+girl) AND the right action.
// Needs a free key in .env: TENOR_API_KEY (Google Cloud > enable "Tenor API") and/or GIPHY_API_KEY (developers.giphy.com).
// Without a key the bot keeps using the old random providers (nekos.best etc.), which cannot filter by gender.
//
// pairs: mm = boy+boy, ff = girl+girl, mf = boy+girl
// Each action: `phrases` are search words for the ACTION (more phrases = more variety),
//              `must` = the gif's title/tags must match this (keeps a kick a real kick, feeding real food),
//              `ban`  = skip gifs whose title/tags match this.

const PAIRS = ['mm', 'ff', 'mf'];

const PAIR_WORDS = {
  mm: ['two anime boys', 'anime boy and boy', 'anime guys', 'anime bros', 'anime boy and his friend boy'],
  ff: ['two anime girls', 'anime girl and girl', 'anime girls', 'anime girl and her friend girl'],
  mf: ['anime boy and girl', 'anime girl and boy', 'anime boy girl friends', 'anime couple boy girl'],
};

const ACTIONS = {
  hug: { phrases: ['hug', 'hugging tight', 'warm hug', 'friends hug', 'big hug', 'hugs him', 'hugs her', 'comforting hug'], must: /hug|embrac/i, ban: /kiss|punch|slap|kick/i },
  cuddle: { phrases: ['cuddle', 'cuddling', 'snuggle', 'snuggling together', 'cuddles up'], must: /cuddl|snuggl|hug/i, ban: /kiss|punch|slap/i },
  kiss: { phrases: ['kiss on cheek', 'kiss', 'kisses', 'sweet kiss', 'forehead kiss'], must: /kiss/i, ban: /punch|slap/i },
  peck: { phrases: ['kiss on cheek', 'cheek kiss', 'quick kiss', 'peck on cheek'], must: /kiss|peck/i, ban: /punch|slap/i },
  pat: { phrases: ['head pat', 'headpat', 'pats head', 'patting head', 'pat on the head'], must: /\bpat(s|ting|ted)?\b|head ?pat/i, ban: /kiss|slap|punch/i },
  handhold: { phrases: ['holding hands', 'hand holding', 'holds hand', 'walking holding hands'], must: /hand/i, ban: /punch|slap|kiss/i },
  bite: { phrases: ['bite arm', 'playful bite', 'bites', 'biting'], must: /\bbit(e|es|ing)\b/i },
  tickle: { phrases: ['tickle', 'tickling', 'tickle fight', 'tickles'], must: /tickl/i },
  poke: { phrases: ['poke cheek', 'poking', 'pokes', 'poke face'], must: /\bpok(e|es|ing|ed)\b/i },
  highfive: { phrases: ['high five', 'high-five', 'high fives'], must: /high[ -]?five/i },
  handshake: { phrases: ['handshake', 'shake hands', 'shaking hands'], must: /handshake|shak(e|ing|es) hands?/i },
  glomp: { phrases: ['glomp hug', 'jumps on and hugs', 'tackle hug', 'glomps'], must: /glomp|tackle|hug/i, ban: /kiss|punch/i },
  // Food is shown in the gif: spoon, cake, snack... (not just "nom").
  feed: {
    phrases: ['feeding food', 'feeds cake with spoon', 'feeding each other', 'feeding snack', 'feeds him food', 'feeds her food', 'feeding ice cream', 'feeding with chopsticks'],
    must: /\bfeeds?\b|feeding|\bfed\b|spoon|chopstick|food|eat|cake|snack|ice ?cream|sweet|candy|cookie|strawberr/i,
    ban: /punch|kick|slap|hug|kiss/i,
  },
  // Leg kicks only: no punches, slaps or throws.
  kick: {
    phrases: ['kick', 'kicks him', 'kicks her', 'flying kick', 'roundhouse kick', 'kick in the face', 'kicks with leg', 'drop kick', 'kicks away', 'leg kick'],
    must: /kick/i,
    ban: /punch|slap|yeet|throw|hug|kiss|soccer|football|ball|taekwondo tutorial/i,
  },
  punch: { phrases: ['punch', 'punches him', 'punch in the face', 'punches her', 'fist punch', 'one punch'], must: /punch/i, ban: /kick|slap|hug|kiss/i },
  slap: { phrases: ['slap', 'slaps him', 'slaps her', 'slap in the face', 'face slap'], must: /slap/i, ban: /kick|punch|hug|kiss|high ?five/i },
  yeet: { phrases: ['yeet', 'throws away', 'launches into the sky', 'throws him', 'flings away', 'tosses'], must: /yeet|throw|toss|launch|fling|send(s)? flying/i, ban: /kiss|hug/i },
  bonk: { phrases: ['bonk', 'bonks', 'hits head with hammer', 'bonk on the head'], must: /bonk|hammer|hit/i, ban: /kiss|hug/i },
};

// Actions that involve two people and therefore get a pairing.
const PAIRABLE = new Set(Object.keys(ACTIONS));

// Hand-picked direct gif links go here (they are always used first-class). Optional.
// CURATED = { kick: { mm: ['https://.../kick.gif'], ff: [], mf: [], any: [] }, ... }
const CURATED = {};

// Gif links that must never be shown (paste a bad one here and restart).
const BLOCKED = new Set([]);

module.exports = { PAIRS, PAIR_WORDS, ACTIONS, PAIRABLE, CURATED, BLOCKED };
