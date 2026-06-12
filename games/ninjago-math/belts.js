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

const BELTS = [
  {
    id: 0, name: 'White Belt', color: '#F5F5F5',
    mult: { factors: [3, 4], maxOperand: 9 },
    powers: SQUARES_INTRO,
    enemyTypes: ['skulkin'],
    enemySpeed: 0.3, maxConcurrent: 2, spawnGapMs: 5500,
    enemiesPerWave: 6, wavesPerSession: 3,
    coinsPerCorrect: 1, bonusCoins: 4,
    boss: null,
  },
  {
    id: 1, name: 'Yellow Belt', color: '#FDD835',
    mult: { factors: [6, 7], maxOperand: 10 },
    powers: SQUARES_ALL,
    enemyTypes: ['skulkin'],
    enemySpeed: 0.33, maxConcurrent: 2, spawnGapMs: 5200,
    enemiesPerWave: 6, wavesPerSession: 3,
    coinsPerCorrect: 1, bonusCoins: 5,
    boss: 'samukai',
  },
  {
    id: 2, name: 'Orange Belt', color: '#FB8C00',
    mult: { factors: [8, 9], maxOperand: 10 },
    powers: [...SQUARES_ALL, '2^3', '3^3', '4^3'],
    enemyTypes: ['skulkin', 'serpentine'],
    enemySpeed: 0.36, maxConcurrent: 3, spawnGapMs: 4800,
    enemiesPerWave: 7, wavesPerSession: 3,
    coinsPerCorrect: 2, bonusCoins: 6,
    boss: null,
  },
  {
    id: 3, name: 'Green Belt', color: '#43A047',
    mult: { factors: [6, 7, 8, 9], maxOperand: 12 },
    powers: CUBES,
    enemyTypes: ['serpentine'],
    enemySpeed: 0.39, maxConcurrent: 3, spawnGapMs: 4500,
    enemiesPerWave: 7, wavesPerSession: 3,
    coinsPerCorrect: 2, bonusCoins: 8,
    boss: 'pythor',
  },
  {
    id: 4, name: 'Blue Belt', color: '#1E88E5',
    mult: { factors: [11, 12], maxOperand: 12 },
    powers: powerKeys([2], [2, 3, 4, 5, 6]),
    enemyTypes: ['serpentine', 'nindroid'],
    enemySpeed: 0.42, maxConcurrent: 3, spawnGapMs: 4200,
    enemiesPerWave: 8, wavesPerSession: 3,
    coinsPerCorrect: 3, bonusCoins: 10,
    boss: null,
  },
  {
    id: 5, name: 'Brown Belt', color: '#6D4C41',
    mult: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxOperand: 12 },
    powers: POWERS_OF_TWO,
    enemyTypes: ['nindroid'],
    enemySpeed: 0.45, maxConcurrent: 4, spawnGapMs: 3900,
    enemiesPerWave: 8, wavesPerSession: 3,
    coinsPerCorrect: 3, bonusCoins: 12,
    boss: 'cryptor',
  },
  {
    id: 6, name: 'Red Belt', color: '#E53935',
    mult: { factors: [6, 7, 8, 9, 11, 12], maxOperand: 12 },
    powers: MIXED_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.5, maxConcurrent: 4, spawnGapMs: 3500,
    enemiesPerWave: 9, wavesPerSession: 3,
    coinsPerCorrect: 4, bonusCoins: 14,
    boss: null,
  },
  {
    id: 7, name: 'Black Belt', color: '#212121',
    mult: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxOperand: 12 },
    powers: ALL_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.55, maxConcurrent: 5, spawnGapMs: 3200,
    enemiesPerWave: 10, wavesPerSession: 3,
    coinsPerCorrect: 5, bonusCoins: 16,
    boss: 'garmadon',
  },
  {
    id: 8, name: 'Golden Ninja', color: '#FFD600',
    mult: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxOperand: 12 },
    powers: ALL_POWERS,
    enemyTypes: ['skulkin', 'serpentine', 'nindroid'],
    enemySpeed: 0.6, maxConcurrent: 5, spawnGapMs: 2800,
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
