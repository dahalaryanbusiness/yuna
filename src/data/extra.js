// Content for the couple and social commands. Edit freely.

const conversationStarters = [
  'What is a small moment from this week that made you feel close to me?',
  'What is one thing I do that makes you feel truly cared for?',
  'Where do you see us in five years?',
  'What is your favorite memory of us so far?',
  'What does a perfect lazy Sunday together look like for you?',
  'What is something you have always wanted to try together?',
  'When did you first realize you had feelings for me?',
  'What is one way I could support you better right now?',
  'What is a fear you rarely talk about?',
  'What is the best piece of relationship advice you have ever received?',
  'Which of our traditions do you want to keep forever?',
  'What does feeling loved look like for you on a hard day?',
  'What is one dream you have not told me about yet?',
  'What is something I did early on that you still think about?',
  'If we could live anywhere for a year, where would it be?',
  'What is one thing you are proud of us for?',
  'How do you like to be comforted when you are upset?',
  'What is a quality of mine you admire the most?',
  'What is one habit of ours you would like to build?',
  'What song reminds you of us, and why?',
  'What is something you would like us to talk about more often?',
  'What is the kindest thing someone has ever done for you?',
  'How do you want us to handle disagreements?',
  'What is your idea of a perfect anniversary?',
  'What made you feel safe with me?',
];

const dateOuts = [
  { id: 'movie', name: 'Movie night', cost: 30, line: 'settled in for a movie night together' },
  { id: 'dinner', name: 'Candlelit dinner', cost: 60, line: 'shared a candlelit dinner' },
  { id: 'picnic', name: 'Picnic in the park', cost: 25, line: 'spread out a blanket for a picnic' },
  { id: 'beach', name: 'Beach walk at sunset', cost: 20, line: 'walked along the beach at sunset' },
  { id: 'stargazing', name: 'Stargazing', cost: 15, line: 'laid back and watched the stars' },
  { id: 'getaway', name: 'Weekend getaway', cost: 120, line: 'escaped for a weekend getaway' },
];

const surprises = [
  'left a handwritten note',
  'planned a small surprise',
  'cooked a favorite meal',
  'arranged a surprise visit',
  'put together a playlist of meaningful songs',
  'brought home a favorite treat',
  'wrote a few heartfelt lines',
  'set up a quiet evening',
];

const argueTopics = [
  'forgot an important plan',
  'did not reply for hours',
  'disagreed about how to spend the weekend',
  'felt unheard during a conversation',
  'argued about whose turn it was to decide',
  'got into a tense misunderstanding',
  'let a small thing grow bigger than it needed to be',
];

const apologyLines = [
  'I am sorry. I should have listened better.',
  'I was wrong, and I want to make it right.',
  'You matter more to me than being right.',
  'I am sorry for hurting you. I will do better.',
];

const morningLines = [
  'Good morning. I hope today is gentle with you.',
  'Waking up knowing you exist makes mornings better.',
  'Good morning. Thinking of you before anything else.',
  'Rise and shine. I am proud of you already.',
  'A new day, and I am still choosing you.',
];

const nightLines = [
  'Good night. Sleep well, I will see you in my dreams.',
  'Rest easy. You did well today.',
  'Good night. Thank you for being my safe place.',
  'Sweet dreams. Tomorrow I will be here again.',
  'Close your eyes, you are loved.',
];

const workLines = [
  'worked a shift at the flower shop',
  'helped plan a wedding',
  'served tables at a romantic restaurant',
  'delivered love letters around town',
  'played violin at a candlelit dinner',
  'photographed an engagement session',
  'baked wedding cakes all afternoon',
  'managed a jewelry counter',
];

const loveLanguages = {
  words: {
    name: 'Words of Affirmation',
    tip: 'Say it out loud. Compliments, thank-yous and sincere messages mean the most.',
  },
  time: {
    name: 'Quality Time',
    tip: 'Give undivided attention. Phones away, plans made, presence over presents.',
  },
  gifts: {
    name: 'Receiving Gifts',
    tip: 'Thoughtful tokens show you were thinking of them. It is the care, not the cost.',
  },
  service: {
    name: 'Acts of Service',
    tip: 'Lighten their load. Doing something helpful speaks louder than words.',
  },
  touch: {
    name: 'Physical Touch',
    tip: 'Hugs, hand-holding and closeness help them feel secure and connected.',
  },
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

module.exports = {
  conversationStarters,
  dateOuts,
  surprises,
  argueTopics,
  apologyLines,
  morningLines,
  nightLines,
  workLines,
  loveLanguages,
  months,
};
