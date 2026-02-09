/**
 * localStorage wrapper for saving game progress.
 * All data is namespaced per game to avoid collisions.
 */
const Storage = (() => {
  const PREFIX = 'kids_games_';

  function key(gameId, field) {
    return `${PREFIX}${gameId}_${field}`;
  }

  return {
    /**
     * Save a value for a game.
     */
    save(gameId, field, value) {
      try {
        localStorage.setItem(key(gameId, field), JSON.stringify(value));
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
    },

    /**
     * Load a value for a game, returning defaultVal if not found.
     */
    load(gameId, field, defaultVal = null) {
      try {
        const raw = localStorage.getItem(key(gameId, field));
        return raw !== null ? JSON.parse(raw) : defaultVal;
      } catch (e) {
        console.warn('Storage load failed:', e);
        return defaultVal;
      }
    },

    /**
     * Remove a value for a game.
     */
    remove(gameId, field) {
      try {
        localStorage.removeItem(key(gameId, field));
      } catch (e) {
        console.warn('Storage remove failed:', e);
      }
    },

    /**
     * Clear all data for a game.
     */
    clearGame(gameId) {
      try {
        const prefix = `${PREFIX}${gameId}_`;
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith(prefix)) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Storage clear failed:', e);
      }
    },
  };
})();
