/**
 * Level definitions for Unicorn Numbers.
 * Each level specifies the number range, targets per round, rounds, and power mode.
 */
const LEVELS = [
  {
    id: 1,
    numbers: [1, 2, 3, 4, 5],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    showDots: true,
    title: 'Fire Starter!',
    description: 'Melt the ice to find numbers 1–5!',
  },
  {
    id: 2,
    numbers: [1, 2, 3, 4, 5],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    showDots: 'hint',
    title: 'Water Garden!',
    description: 'Grow flowers with numbers 1–5!',
  },
  {
    id: 3,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    targetsPerRound: 4,
    rounds: 5,
    power: 'fire',
    showDots: false,
    title: 'Bigger Numbers!',
    description: 'Melt ice blocks with numbers up to 10!',
  },
  {
    id: 4,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    targetsPerRound: 5,
    rounds: 5,
    power: 'water',
    showDots: false,
    title: 'Number Garden!',
    description: 'Grow a garden of numbers 1–10!',
  },
  {
    id: 5,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    targetsPerRound: 4,
    rounds: 5,
    power: 'rainbow',
    showDots: false,
    title: 'Rainbow Power!',
    description: 'Use ALL powers for 1–10!',
  },
  {
    id: 6,
    numbers: [11, 12, 13, 14, 15],
    targetsPerRound: 4,
    rounds: 5,
    power: 'fire',
    showDots: false,
    title: 'Teen Numbers!',
    description: 'Discover numbers 11–15!',
  },
  {
    id: 7,
    numbers: [16, 17, 18, 19, 20],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    showDots: false,
    title: 'Almost There!',
    description: 'Learn numbers 16–20!',
  },
  {
    id: 8,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    targetsPerRound: 6,
    rounds: 7,
    power: 'choice',
    showDots: false,
    title: 'Grand Finale!',
    description: 'ALL numbers 1–20!',
  },
];

LEVELS.forEach(l => { if (!l.items) l.items = l.numbers; });
MODES.numbers.levels = LEVELS;
