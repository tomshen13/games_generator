/**
 * SharedCoins — Cross-game unified coin system.
 * All games read/write from one shared balance.
 * Educational games earn coins; all game shops spend them.
 */
const SharedCoins = (() => {
  const GAME_ID = '_shared';
  const FIELD = 'coins';

  function get() {
    return Storage.load(GAME_ID, FIELD, 0);
  }

  function add(n) {
    const total = get() + n;
    Storage.save(GAME_ID, FIELD, total);
    return total;
  }

  function spend(n) {
    const current = get();
    if (current < n) return false;
    Storage.save(GAME_ID, FIELD, current - n);
    return true;
  }

  function set(n) {
    Storage.save(GAME_ID, FIELD, n);
  }

  /**
   * One-time migration: sum existing per-game coins into shared pool.
   * Safe to call multiple times — only runs once per profile.
   */
  function migrate() {
    if (Storage.load(GAME_ID, 'coinsMigrated', false)) return;

    let total = 0;

    // Unicorn Numbers coins
    total += Storage.load('unicorn-numbers', 'coins', 0);

    // Pokemon Math coins
    total += Storage.load('pokemon-multiply', 'coins', 0);

    // Mario Bros coins (stored inside persistent object)
    const marioPersist = Storage.load('mario-bros', 'persistent', null);
    if (marioPersist && typeof marioPersist.coins === 'number') {
      total += marioPersist.coins;
    }

    // Space Invaders crystals (stored inside persistent object)
    const spacePersist = Storage.load('space-invaders', 'persistent', null);
    if (spacePersist && typeof spacePersist.crystals === 'number') {
      total += spacePersist.crystals;
    }

    if (total > 0) {
      const existing = get();
      set(existing + total);
    }

    Storage.save(GAME_ID, 'coinsMigrated', true);
    console.log('[SharedCoins] Migrated', total, 'coins from per-game storage');
  }

  return { get, add, spend, set, migrate };
})();
