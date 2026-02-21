/**
 * Adaptive difficulty using a Leitner-box model.
 * Items start in box 0 (struggling) and move up on correct answers.
 * Lower boxes have higher selection weight for spaced repetition.
 * Response time is factored in: correct but slow (>=5s) doesn't advance the box.
 */
const Adaptive = (() => {
  const BOX_WEIGHTS = [8, 4, 2, 1];
  const MAX_BOX = 3;
  const SLOW_THRESHOLD_MS = 5000;
  let records = {};
  let gameId = '';

  return {
    load(id) {
      gameId = id;
      records = Storage.load(gameId, 'adaptive', {});
    },

    save() {
      Storage.save(gameId, 'adaptive', records);
    },

    getRecord(key) {
      if (!records[key]) records[key] = { box: 0, correct: 0, wrong: 0 };
      return records[key];
    },

    /** Read-only access to all records (no side effects) */
    getRecords() {
      return records;
    },

    recordAnswer(key, correct, responseMs) {
      const r = this.getRecord(key);
      if (correct) {
        r.correct++;
        // Only advance box if answered quickly (fluency signal)
        if (responseMs == null || responseMs < SLOW_THRESHOLD_MS) {
          r.box = Math.min(r.box + 1, MAX_BOX);
        }
      } else {
        r.box = Math.max(r.box - 1, 0);
        r.wrong++;
      }
      this.save();
    },

    pickItem(pool) {
      if (!pool.length) return null;
      const weights = pool.map(key => BOX_WEIGHTS[this.getRecord(key).box]);
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) return pool[i];
      }
      return pool[pool.length - 1];
    },

    getPoolStats(pool) {
      const stats = { mastered: 0, learning: 0, struggling: 0 };
      pool.forEach(key => {
        const box = this.getRecord(key).box;
        if (box >= 3) stats.mastered++;
        else if (box >= 1) stats.learning++;
        else stats.struggling++;
      });
      return stats;
    },

    clear() {
      records = {};
      this.save();
    },
  };
})();
