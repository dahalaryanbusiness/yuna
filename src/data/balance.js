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
  // ===== GLOBAL DIFFICULTY KNOB ("hard mode") =====
  // Multiplies EVERYTHING that goes through E.earn(): jobs, office, quests, level-ups, weekly/monthly rewards, crime loot,
  // family, mini-game prizes. 1 = old speed, 0.5 = LP takes twice as long to earn. Casino/lottery payouts, selling stocks or a
  // business and refunds are NOT touched (that would be confiscating your own money). Daily, love rewards, trivia and explore finds
  // do not use E.earn, so their numbers below were already cut by hand.
  hard: { earnMult: 0.5 },

  // /daily  (was 100 + up to +100 streak + 50 relationship)
  daily: { base: 50, streakStep: 3, streakMax: 25, relBonus: 12 }, // hard mode: halved by hand (daily does not use E.earn)

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
  actions: { lp: 1, lpCooldownMs: 3 * MIN, letterLp: 1, letterCooldownMs: 10 * MIN },

  // /explore. Was one 5 minute cooldown, dig was worth ~77 LP per try.
  // Numbers are cumulative chances: r < none -> nothing, r < next -> that find, and so on. The rest is coins.
  explore: {
    cooldownMs: 10 * MIN,
    fish: { none: 0.2, fish: 0.7, pearl: 0.75, chest: 0.765, lp: [3, 12] },
    hunt: { none: 0.2, bone: 0.5, key: 0.54, lp: [8, 22] },
    dig: { none: 0.2, gem: 0.225, diamond: 0.228, chest: 0.258, lp: [5, 18] },
  },

  // Mini-games. dailyPaid* = how many REWARDED rounds per UTC day. You can still play after, just no LP.
  // Before: rps paid 80-200 every 15s (about 15,000 LP/hour with luck), riddle 150-350 every 40s.
  rps: { cooldownMs: 30000, win: [8, 20], streakBonus: 2, dailyPaidWins: 12 },
  // Riddles have 3 levels now (easy / normal / hard) and 10 categories. reward = LP before the hard-mode multiplier.
  // Cooldown is short on purpose (people hated waiting 3 minutes); the DAILY CAP is what stops farming.
  riddle: {
    cooldownMs: 20000,
    levels: {
      easy: { reward: [6, 12], seconds: 30 },
      normal: { reward: [12, 24], seconds: 30 },
      hard: { reward: [24, 48], seconds: 22 },
    },
    streakBonus: 1, // + per answer in a row (max streakMax)
    streakMax: 10,
    hintCut: 0.5, // using the hint button halves the prize
    dailyPaidSolves: 20,
  },
  // New mini-games (prizes also go through the hard-mode multiplier)
  emojiguess: { cooldownMs: 20000, levels: { easy: [5, 10], normal: [10, 20], hard: [20, 40] }, seconds: 25, dailyPaid: 20 },
  simon: { cooldownMs: 45000, perRound: [3, 5], startLen: { easy: 3, normal: 4, hard: 5 }, maxRounds: 6, dailyPaid: 6 },
  sync: { cooldownMs: 30 * MIN, rewardPerMatch: 6, dailyPaid: 3, perfectBonus: 15 }, // couples quiz, LP is per matching answer
  heist: { minCrew: 2, maxCrew: 8, minStake: 50, maxStake: 2000, lobbySeconds: 45, payoutMult: 1.75, baseOdds: 0.3, oddsPerMember: 0.05, maxOdds: 0.55, jailChance: 0.4, jailMinutes: 6, cooldownMs: 20 * MIN },
  trivia: { cooldownMs: 90000, reward: 3, dailyPaidAnswers: 15 },
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
  // Businesses are NOT passive free money any more:
  //  * a shop only earns while it has SUPPLIES (/business restock). Supplies cost supplyRate x its gross income per hour.
  //  * a manager makes supplies mgrSupplyDiscount cheaper.
  //  * collecting pays business tax (tax x gross) and random events can cost you (theft, inspections).
  //  * ad campaigns are a real gamble now (break-even on average, big swings).
  business: { adMults: [0.2, 0.9, 2.5], adOdds: [0.3, 0.5, 0.2], supplyRate: 0.4, mgrSupplyDiscount: 0.25, tax: 0.08, startHours: 6, graceHours: 4, baseStorage: 12 },

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

  // /us (couples only): spark streak, time capsules, shared vault
  us: { sparkGapHours: 20, sparkMilestone: 7, sparkLp: 15, sparkCoupleXp: 5, capsuleCost: 25, capsuleMax: 5, capsuleMaxDays: 365, capsuleMaxChars: 500, vaultMinDeposit: 10 },

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
