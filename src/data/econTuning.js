// ============================================================================
//  YUNA ECONOMY BALANCE SHEET
//  Every number that controls how fast people earn (or lose) Love Points lives here.
//  Want it harder? Lower the rewards or raise the cooldowns. Want it easier? Do the opposite.
//  After editing, just restart the bot. Descriptions that show numbers update by themselves;
//  run `npm run deploy` once if a slash-command description text changed.
//
//  Design goals of this pass ("balance v1"):
//   * Nothing you can spam should out-earn simply showing up every day.
//   * Time-gated sources (daily, quests, jobs) are the backbone. Mini-games are a small bonus.
//   * Everything with no real risk got a daily cap, a cooldown or a lower payout.
//   * Money sinks (taxes, fees, wedding, upkeep) were added so LP keeps its value.
// ============================================================================
const MIN = 60000;
const HOUR = 3600000;

module.exports = {
  // /daily  (was 100 + up to +100 streak + 50 relationship)
  daily: { base: 100, streakStep: 5, streakMax: 50, relBonus: 25 },

  // /weekly /monthly /rewards quarterly  (were 700-1100 / 4000-6000 / 14000-20000)
  rewards: {
    weekly: [500, 800],
    monthly: [2500, 3500],
    quarterly: [8000, 11000],
    streakStep: 0.03, // +3% per streak, was +5%
    streakMax: 0.3, // max +30%, was +100%
    jobStep: 0.02, // per job rank, was 0.03
    relBonus: 0.05, // was 0.10
  },

  // Quests. lpMult scales EVERY quest payout. levelScale was 0.04 per level (up to level 50).
  quests: { lpMult: 0.5, levelScale: 0.015, levelCap: 30, sweepStreak: 50 },

  // Level ups: were 250 x level LP, and one XP tick every 15 seconds.
  levels: { lpPerLevel: 100, xpCooldownMs: 30000 },

  // Tiny LP drip from affection commands (/hug, /kiss...). Was 3 LP every 30 seconds = 360 LP/hour.
  actions: { lp: 2, lpCooldownMs: 3 * MIN, letterLp: 2, letterCooldownMs: 10 * MIN },

  // /explore. Was one 5 minute cooldown, dig was worth ~77 LP per try.
  // Numbers are cumulative chances: r < none -> nothing, r < next -> that find, and so on. The rest is coins.
  explore: {
    cooldownMs: 10 * MIN,
    fish: { none: 0.2, fish: 0.7, pearl: 0.75, chest: 0.765, lp: [5, 25] },
    hunt: { none: 0.2, bone: 0.5, key: 0.54, lp: [15, 45] },
    dig: { none: 0.2, gem: 0.225, diamond: 0.228, chest: 0.258, lp: [10, 35] },
  },

  // Mini-games. dailyPaid* = how many REWARDED rounds per UTC day. You can still play after, just no LP.
  // Before: rps paid 80-200 every 15s (about 15,000 LP/hour with luck), riddle 150-350 every 40s.
  rps: { cooldownMs: 30000, win: [8, 20], streakBonus: 2, dailyPaidWins: 12 },
  riddle: { cooldownMs: 3 * MIN, reward: [25, 60], dailyPaidSolves: 8 },
  trivia: { cooldownMs: 90000, reward: 6, dailyPaidAnswers: 15 },
  fortune: { base: 20, range: 40 }, // was 60 + (0-89)

  // Careers. payMult scales shift pay AND office pay. promoBase was 300 x rank^2.
  jobs: { payMult: 0.75, promoBase: 150 },
  // /office. Multipliers of your average shift pay. A task used to pay more per hour than a real shift.
  office: { taskMult: 0.5, taskCdMs: 30 * MIN, overtime: 1.6, meetingWin: 1.2, meetingSneak: 2.2, netRaise: 3 },

  // /crime. lootMult cuts the success payouts. Patrol and arrest bounties were stacking on top of shift pay.
  crime: {
    lootMult: 0.7,
    patrolCdMs: 30 * MIN,
    patrolPay: [25, 70],
    patrolBonus: [40, 120],
    patrolBonusChance: 0.3,
    arrestBounty: 60, // per wanted star, was 150
  },

  // /business ad campaign multipliers (flop, steady, viral) in hours of income. Was 0.4 / 1.6 / 4.
  // (shop prices and hourly income live in data/careers.js)
  business: { adMults: [0.4, 1.0, 3] },

  // /bank interest per 22h. Was 2% up to 1,000 LP, completely risk free.
  bank: { interestRate: 0.005, interestCap: 400 },

  // /casino. maxBet was 250,000. Coinflip and dice paid exactly 2.0x, and couples got +5% on top of coinflip wins,
  // which made coinflip a guaranteed money printer for anyone in a relationship (RTP 102.5%).
  casino: { maxBet: 100000, flipMult: 1.9, diceMult: 1.9 },

  // /rob. Used to be +EV for the robber (50% win, small fine). Now it is a gamble, not a salary.
  rob: { spamMs: 2 * MIN, baseOdds: 0.4, failFine: [70, 110] }, // failFine = % of the stake

  // /give. A tax is burned. Stops alt accounts from feeding one main account for free.
  give: { tax: 0.05 },

  // /invest fees
  invest: { buyFee: 0.02, sellFee: 0.03 },

  // Family. Dinner scaled with family size, so a family of alt accounts printed money.
  family: {
    welcomeGift: 100, // was 300 each
    dinnerBase: 40, // was 120
    dinnerPerLevel: 15, // was 40
    dinnerPerMember: 10, // was 25
    dinnerHostMult: 1.25, // was 1.5
    fullHouse: 60, // was 200
    choreLp: [20, 50], // was 60-160
    choreBondBonus: 4, // per bond level, was 10
    choreCdMs: 90 * MIN, // was 45
    parentShare: 10, // was 25
  },

  // Love life. Marrying used to PAY the couple +200 LP net. Now it is a real expense.
  love: {
    dateReward: 10, // was 25 each
    engagedReward: 40, // was 100 each
    marriedReward: 100, // was 250 each
    weddingCost: 600, // was 150
    makeupReward: 10, // was 30 each
    anniversaryPerYear: 250, // was 500 (max 5000)
    anniversaryMax: 2500,
    dateNight: 15, // was 40 each, hourly
    dateNightCdMs: 3 * HOUR,
    honeymoon: [50, 90], // was 120-220 each, every 12h
    honeymoonCdMs: 24 * HOUR,
    bucketGoalLp: 2, // was 10 each, unlimited
    crushMatch: 25, // was 100 each
    flirt: [4, 2], // you, them. was 10 / 5
    valentine: 5, // was 15 each
  },
};
