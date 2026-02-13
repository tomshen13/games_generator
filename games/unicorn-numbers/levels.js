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

// ===== COUNTING LEVELS =====
// Kid sees dots, picks the number. K Math L3 (Correspondence)
const COUNTING_LEVELS = [
  {
    id: 1,
    items: [1, 2, 3],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: 'Count 1–3!',
  },
  {
    id: 2,
    items: [1, 2, 3, 4, 5],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: 'Count 1–5!',
  },
  {
    id: 3,
    items: [1, 2, 3, 4, 5],
    targetsPerRound: 5,
    rounds: 5,
    power: 'fire',
    title: 'Count to 5!',
  },
  {
    id: 4,
    items: [3, 4, 5, 6, 7],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: 'Count 3–7!',
  },
  {
    id: 5,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    targetsPerRound: 5,
    rounds: 5,
    power: 'rainbow',
    title: 'Count 1–10!',
  },
  {
    id: 6,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    targetsPerRound: 6,
    rounds: 7,
    power: 'choice',
    title: 'Counting Master!',
  },
];
MODES.counting.levels = COUNTING_LEVELS;

// ===== COMPARISON LEVELS =====
// Kid sees 2 numbers, picks the bigger. K Math L4 (Relationships)
const COMPARISON_LEVELS = [
  {
    id: 1,
    items: [1, 2, 3, 4, 5],
    rounds: 5,
    power: 'fire',
    title: 'Big or Small?',
  },
  {
    id: 2,
    items: [1, 2, 3, 4, 5],
    rounds: 5,
    power: 'water',
    title: 'Compare 1–5!',
  },
  {
    id: 3,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    rounds: 5,
    power: 'fire',
    title: 'Up to 10!',
  },
  {
    id: 4,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    rounds: 5,
    power: 'water',
    title: 'Compare All!',
  },
  {
    id: 5,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    rounds: 7,
    power: 'rainbow',
    title: 'Comparison Star!',
  },
  {
    id: 6,
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    rounds: 7,
    power: 'choice',
    title: 'Comparison Master!',
  },
];
MODES.comparison.levels = COMPARISON_LEVELS;

// ===== ADDITION LEVELS =====
// Kid sees "A + B = ?", picks the sum. K Math L5 (Decomposition), G1 Math L2 (Addition to 10)
const ADDITION_LEVELS = [
  {
    id: 1,
    maxOperand: 2,
    maxSum: 3,
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '1 + 1!',
  },
  {
    id: 2,
    maxOperand: 3,
    maxSum: 5,
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: 'Sums to 5!',
  },
  {
    id: 3,
    maxOperand: 5,
    maxSum: 5,
    targetsPerRound: 4,
    rounds: 5,
    power: 'fire',
    title: 'Add to 5!',
  },
  {
    id: 4,
    maxOperand: 5,
    maxSum: 7,
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: 'Getting Bigger!',
  },
  {
    id: 5,
    maxOperand: 5,
    maxSum: 10,
    targetsPerRound: 5,
    rounds: 5,
    power: 'rainbow',
    title: 'Sums to 10!',
  },
  {
    id: 6,
    maxOperand: 9,
    maxSum: 10,
    targetsPerRound: 5,
    rounds: 7,
    power: 'choice',
    title: 'Addition Master!',
  },
];

// Build items (possible answers) and problems pool for each addition level
ADDITION_LEVELS.forEach(l => {
  // Generate all valid a+b pairs for this level
  l.problems = [];
  for (let a = 1; a <= l.maxOperand; a++) {
    for (let b = 1; b <= l.maxOperand; b++) {
      if (a + b <= l.maxSum) {
        l.problems.push({ a, b, sum: a + b });
      }
    }
  }
  // Items are the possible answer values (unique sums)
  l.items = [...new Set(l.problems.map(p => p.sum))].sort((a, b) => a - b);
  // Adaptive keys are "a+b" strings
  l.adaptiveKeys = l.problems.map(p => `${p.a}+${p.b}`);
});
MODES.addition.levels = ADDITION_LEVELS;
