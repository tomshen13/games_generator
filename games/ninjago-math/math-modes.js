/**
 * Math mode definitions for Ninjago Spinjitzu Math.
 * Same mode-object pattern as pokemon-multiply/operation-modes.js, minus
 * distractors — answers are typed on the numpad, not chosen.
 *
 * Key formats:
 *   multiply: "3x7"  (smaller factor first — repo-wide convention, shared
 *             with pokemon-multiply so cross-game mirroring works)
 *   powers:   "3^4"  (base^exponent)
 */
const MATH_MODES = {
  multiply: {
    id: 'multiply',
    symbol: '×',

    compute(a, b) { return a * b; },

    buildPool(beltDef) {
      const keys = new Set();
      beltDef.mult.factors.forEach(f => {
        for (let op = 1; op <= beltDef.mult.maxOperand; op++) {
          keys.add(`${Math.min(f, op)}x${Math.max(f, op)}`);
        }
      });
      return [...keys];
    },

    keyToProblem(key) {
      const [a, b] = key.split('x').map(Number);
      return Math.random() > 0.5 ? [a, b] : [b, a];
    },

    /** HTML for the problem bar (exponents need <sup>, so problems render as HTML) */
    displayHTML(a, b) {
      return `${a} <span class="op">×</span> ${b}`;
    },
  },

  powers: {
    id: 'powers',
    symbol: '^',

    compute(base, exp) { return Math.pow(base, exp); },

    buildPool(beltDef) {
      return beltDef.powers.slice();
    },

    keyToProblem(key) {
      return key.split('^').map(Number); // [base, exp] — order is fixed
    },

    displayHTML(base, exp) {
      return `${base}<sup>${exp}</sup>`;
    },

    /** Teaching hint: "3 × 3 × 3 × 3 = 81" */
    expansion(base, exp) {
      return Array(exp).fill(base).join(' × ');
    },
  },
};
