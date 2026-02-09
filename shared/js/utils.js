/**
 * Shared utility functions for all games.
 */
const Utils = {
  /**
   * Fisher-Yates shuffle (returns new array).
   */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /**
   * Random integer between min and max (inclusive).
   */
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Pick n unique random items from array.
   */
  pickRandom(arr, n) {
    return Utils.shuffle(arr).slice(0, n);
  },

  /**
   * Create a range of numbers [start..end].
   */
  range(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  },

  /**
   * Delay as a promise.
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create a DOM element with attributes and children.
   */
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') el.className = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else el.setAttribute(key, val);
    }
    for (const child of children) {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    }
    return el;
  },

  /**
   * Generate dot pattern HTML for a number (like dice dots).
   */
  dotPattern(n) {
    let dots = '';
    for (let i = 0; i < n; i++) {
      dots += '<span class="dot"></span>';
    }
    return `<div class="dot-pattern dots-${Math.min(n, 20)}">${dots}</div>`;
  },
};
