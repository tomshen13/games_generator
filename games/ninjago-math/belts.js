/**
 * Belt rank progression for Ninjago Spinjitzu Math.
 * mult: factor rules for wave problems (drilling fluency — Dan knows his tables).
 * powers: explicit adaptive keys "base^exp" for Spinjitzu/boss questions —
 *   these lists MUST stay aligned with the g4-math-powers curriculum levels
 *   in shared/data/grade4_data.js so dashboard stats line up.
 * Pacing knobs: enemySpeed (world px/frame), maxConcurrent, spawnGapMs.
 */

function powerKeys(bases, exps) {
  const keys = [];
  for (const b of bases) for (const e of exps) keys.push(`${b}^${e}`);
  return keys;
}

const SQUARES_INTRO = powerKeys([2, 3, 4, 5], [2]);                    // curriculum L1
const SQUARES_ALL = powerKeys([2, 3, 4, 5, 6, 7, 8, 9], [2]);          // curriculum L2
const CUBES = powerKeys([2, 3, 4, 5, 6], [3]);                          // curriculum L3
const POWERS_OF_TWO = powerKeys([2], [2, 3, 4, 5, 6, 7, 8, 9, 10]);     // curriculum L4
const MIXED_POWERS = [                                                   // curriculum L5
  ...powerKeys([3, 4, 5], [3, 4]),
  ...powerKeys([6], [2, 3]),
  '10^2', '10^3',
];
const ALL_POWERS = [...new Set([...SQUARES_ALL, ...CUBES, ...POWERS_OF_TWO, ...MIXED_POWERS])];

// Multiplication ramps from the easiest facts up: each belt gates promotion
// on its OWN new tables (game.js promotionEligible), while the session pool is
// cumulative (game.js buildPools) so earlier tables stay in adaptive rotation.
const BELTS = [
  {
    id: 0, name: 'White Belt', color: '#F5F5F5',
    mult: { factors: [1, 2], maxOperand: 10 },   // easiest start
    powers: SQUARES_INTRO,
    enemyTypes: ['skulkin'],
    enemySpeed: 0.22, maxConcurrent: 2, spawnGapMs: 6000,
    enemiesPerWave: 5, wavesPerSession: 3,
    coinsPerCorrect: 1, bonusCoins: 4,
    boss: null,
  },
  {
    id: 1, name: 'Yellow Belt', color: '#FDD835',
    mult: { factors: [5, 10], maxOperand: 10 },   // skip-counting tables
    powers: SQUARES_ALL,
    enemyTypes: ['skulkin'],
    enemySpeed: 0.25, maxConcurrent: 2, spawnGapMs: 5700,
    enemiesPerWave: 5, wavesPerSession: 3,
    coinsPerCorrect: 1, bonusCoins: 5,
    boss: 'samukai',
  },
  {
    id: 2, name: 'Orange Belt', color: '#FB8C00',
    mult: { factors: [3, 4], maxOperand: 10 },
    powers: [...SQUARES_ALL, '2^3', '3^3', '4^3'],
    enemyTypes: ['skulkin', 'serpentine'],
    enemySpeed: 0.28, maxConcurrent: 2, spawnGapMs: 5400,
    enemiesPerWave: 6, wavesPerSession: 3,
    coinsPerCorrect: 2, bonusCoins: 6,
    boss: null,
  },
  {
    id: 3, name: 'Green Belt', color: '#43A047',
    mult: { factors: [6, 7], maxOperand: 10 },
    powers: CUBES,
    enemyTypes: ['serpentine'],
    enemySpeed: 0.32, maxConcurrent: 3, spawnGapMs: 5000,
    enemiesPerWave: 6, wavesPerSession: 3,
    coinsPerCorrect: 2, bonusCoins: 8,
    boss: 'pythor',
  },
  {
    id: 4, name: 'Blue Belt', color: '#1E88E5',
    mult: { factors: [8, 9], maxOperand: 10 },
    powers: powerKeys([2], [2, 3, 4, 5, 6]),
    enemyTypes: ['serpentine', 'nindroid'],
    enemySpeed: 0.36, maxConcurrent: 3, spawnGapMs: 4600,
    enemiesPerWave: 7, wavesPerSession: 3,
    coinsPerCorrect: 3, bonusCoins: 10,
    boss: null,
  },
  {
    id: 5, name: 'Brown Belt', color: '#6D4C41',
    mult: { factors: [2, 3, 4, 5, 10], maxOperand: 12 },   // mixed easy review to 12
    powers: POWERS_OF_TWO,
    enemyTypes: ['nindroid'],
    enemySpeed: 0.4, maxConcurrent: 4, spawnGapMs: 4200,
    enemiesPerWave: 7, wavesPerSession: 3,
    coinsPerCorrect: 3, bonusCoins: 12,
    boss: 'cryptor',
  },
  {
    id: 6, name: 'Red Belt', color: '#E53935',
    mult: { factors: [11, 12], maxOperand: 12 },   // the tough high tables
    powers: MIXED_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.44, maxConcurrent: 4, spawnGapMs: 3800,
    enemiesPerWave: 8, wavesPerSession: 3,
    coinsPerCorrect: 4, bonusCoins: 14,
    boss: null,
  },
  {
    id: 7, name: 'Black Belt', color: '#212121',
    mult: { factors: [6, 7, 8, 9, 11, 12], maxOperand: 12 },   // hardest mixed
    powers: ALL_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.49, maxConcurrent: 5, spawnGapMs: 3400,
    enemiesPerWave: 9, wavesPerSession: 3,
    coinsPerCorrect: 5, bonusCoins: 16,
    boss: 'garmadon',
  },
  {
    id: 8, name: 'Golden Ninja', color: '#FFD600',
    mult: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxOperand: 12 },
    powers: ALL_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.55, maxConcurrent: 5, spawnGapMs: 3000,
    enemiesPerWave: 10, wavesPerSession: 3,
    coinsPerCorrect: 6, bonusCoins: 20,
    boss: 'garmadon', // rotating rematch in endless mastery mode
  },
];

const BOSSES = {
  samukai: {
    id: 'samukai', name: 'Samukai', sprite: 'samukai',
    hp: 3, timerMs: 20000,
    intro: 'King of the Skulkin army blocks your path!',
    taunts: ['Bones beat brains!', 'My four arms never miss!'],
  },
  pythor: {
    id: 'pythor', name: 'Pythor', sprite: 'pythor',
    hp: 4, timerMs: 19000,
    intro: 'The last Anacondrai slithers from the shadows!',
    taunts: ['Ssssurely you can do better!', 'The Great Devourer awaits!'],
  },
  cryptor: {
    id: 'cryptor', name: 'General Cryptor', sprite: 'cryptor',
    hp: 4, timerMs: 18000,
    intro: 'The nindroid general computes your defeat!',
    taunts: ['Calculating... you lose.', 'My circuits are faster!'],
  },
  garmadon: {
    id: 'garmadon', name: 'Lord Garmadon', sprite: 'garmadon',
    hp: 5, timerMs: 18000,
    intro: 'The Dark Lord himself attacks the dojo!',
    taunts: ['I will turn Ninjago to darkness!', 'Four arms, zero mercy!'],
  },
};
