const { buildAction } = require('../lib/interaction');

module.exports = buildAction({
  name: 'kiss',
  description: 'Give someone a kiss',
  optionDesc: 'Who do you want to kiss?',
  verb: 'kissed',
  emoji: '💋',
  color: 0xff5c8a,
  selfMsg: "You can't kiss yourself... go find someone!",
  botMsg: "Bots don't have lips!",
});
