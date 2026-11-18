const { buildAction } = require('../lib/interaction');

module.exports = buildAction({
  name: 'hug',
  description: 'Give someone a warm hug',
  optionDesc: 'Who do you want to hug?',
  verb: 'hugged',
  emoji: '🤗',
  color: 0xffb347,
  selfMsg: "You can't hug yourself... but here's a virtual one",
  botMsg: "Bots can't hug back!",
});
