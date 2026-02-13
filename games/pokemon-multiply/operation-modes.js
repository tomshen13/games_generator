/**
 * Pokemon Multiply — Operation Mode Definitions
 * Each mode defines how problems are generated, displayed, and checked.
 */
const OPERATION_MODES = {
  multiply: {
    id: 'multiply',
    symbol: '\u00d7',
    verb: 'times',
    title: 'Pokemon<br>Math',
    subtitle: "Catch 'em all with multiplication!",
    masterSpeech: 'You are a Pokemon Multiplication Master!',
    conqueredText: 'You conquered all multiplication routes!',

    compute(a, b) { return a * b; },

    buildPool(levelDef) {
      const keys = new Set();
      levelDef.factors.forEach(f => {
        for (let op = 1; op <= levelDef.maxOperand; op++) {
          keys.add(`${Math.min(f, op)}x${Math.max(f, op)}`);
        }
      });
      return [...keys];
    },

    keyToProblem(key) {
      const [a, b] = key.split('x').map(Number);
      return Math.random() > 0.5 ? [a, b] : [b, a];
    },

    generateDistractors(correct, n1, n2) {
      const set = new Set();
      set.add(n1 * (n2 + 1));
      set.add(n1 * (n2 - 1));
      set.add((n1 + 1) * n2);
      set.add((n1 - 1) * n2);
      set.add(n1 + n2);
      set.add(correct + Utils.randInt(1, 5));
      set.add(correct - Utils.randInt(1, 5));
      set.add(correct + 10);
      set.add(correct - 10);
      return _finalize(set, correct);
    },
  },

  divide: {
    id: 'divide',
    symbol: '\u00f7',
    verb: 'divided by',
    title: 'Pokemon<br>Math',
    subtitle: "Catch 'em all with division!",
    masterSpeech: 'You are a Pokemon Division Master!',
    conqueredText: 'You conquered all division routes!',

    compute(a, b) { return a / b; },

    // Reuse multiplication factor-based pools — same AxB keys
    buildPool(levelDef) {
      return OPERATION_MODES.multiply.buildPool(levelDef);
    },

    keyToProblem(key) {
      // "3x7" → present as "21 ÷ 7 = ?" or "21 ÷ 3 = ?"
      const [a, b] = key.split('x').map(Number);
      const product = a * b;
      const divisor = Math.random() > 0.5 ? a : b;
      return [product, divisor]; // [dividend, divisor]
    },

    generateDistractors(correct, dividend, divisor) {
      const set = new Set();
      set.add(correct + 1);
      set.add(correct - 1);
      set.add(correct + 2);
      set.add(correct - 2);
      set.add(divisor); // common mistake: picking divisor
      set.add(dividend - divisor); // subtraction mistake
      set.add(Math.round(dividend / (divisor + 1)));
      set.add(Math.round(dividend / (divisor - 1)));
      return _finalize(set, correct);
    },
  },

  add: {
    id: 'add',
    symbol: '+',
    verb: 'plus',
    title: 'Pokemon<br>Math',
    subtitle: "Catch 'em all with addition!",
    masterSpeech: 'You are a Pokemon Addition Master!',
    conqueredText: 'You conquered all addition routes!',

    compute(a, b) { return a + b; },

    buildPool(levelDef) {
      const keys = [];
      const min = levelDef.minOperand || 1;
      const max = levelDef.maxOperand || 10;
      const maxSum = levelDef.maxSum || 20;
      for (let a = min; a <= max; a++) {
        for (let b = a; b <= max; b++) {
          if (a + b <= maxSum) keys.push(`${a}+${b}`);
        }
      }
      return keys;
    },

    keyToProblem(key) {
      const [a, b] = key.split('+').map(Number);
      return Math.random() > 0.5 ? [a, b] : [b, a];
    },

    generateDistractors(correct, n1, n2) {
      const set = new Set();
      set.add(correct + 1);
      set.add(correct - 1);
      set.add(correct + 2);
      set.add(correct - 2);
      set.add(correct + 10);
      set.add(correct - 10);
      set.add(n1 * n2); // multiplication mistake
      set.add(Math.abs(n1 - n2)); // subtraction mistake
      return _finalize(set, correct);
    },
  },

  subtract: {
    id: 'subtract',
    symbol: '\u2212',
    verb: 'minus',
    title: 'Pokemon<br>Math',
    subtitle: "Catch 'em all with subtraction!",
    masterSpeech: 'You are a Pokemon Subtraction Master!',
    conqueredText: 'You conquered all subtraction routes!',

    compute(a, b) { return a - b; },

    buildPool(levelDef) {
      const keys = [];
      const min = levelDef.minOperand || 1;
      const max = levelDef.maxOperand || 10;
      const maxMinuend = levelDef.maxMinuend || 20;
      for (let minuend = min + 1; minuend <= maxMinuend; minuend++) {
        for (let sub = min; sub < minuend && sub <= max; sub++) {
          if (minuend - sub >= 0) keys.push(`${minuend}-${sub}`);
        }
      }
      return keys;
    },

    keyToProblem(key) {
      const [a, b] = key.split('-').map(Number);
      return [a, b]; // always minuend first
    },

    generateDistractors(correct, n1, n2) {
      const set = new Set();
      set.add(correct + 1);
      set.add(correct - 1);
      set.add(correct + 2);
      set.add(correct - 2);
      set.add(n1 + n2); // addition mistake
      set.add(n2 - n1 < 0 ? n1 - n2 + 10 : n2); // reversal
      set.add(correct + 10);
      set.add(correct - 10);
      return _finalize(set, correct);
    },
  },
};

/** Shared helper: filter distractors and return exactly 3 */
function _finalize(set, correct) {
  set.delete(correct);
  set.delete(0);
  const filtered = [...set].filter(n => n > 0 && n !== correct);
  Utils.shuffle(filtered);
  let safety = 0;
  while (filtered.length < 3 && safety < 30) {
    safety++;
    let val = correct + Utils.randInt(2, 15) * (Math.random() > 0.5 ? 1 : -1);
    if (val > 0 && val !== correct && !filtered.includes(val)) {
      filtered.push(val);
    }
  }
  return filtered.slice(0, 3);
}
