/**
 * localStorage wrapper for saving game progress.
 * Supports per-profile namespacing and Supabase cloud sync.
 */
const Storage = (() => {
  const PREFIX = 'kids_games_';
  const PROFILE_KEY = 'kids_games__active_profile';
  let activeProfile = '';
  let syncQueue = [];
  let flushTimer = null;

  function key(gameId, field) {
    if (activeProfile) {
      return `${PREFIX}${activeProfile}_${gameId}_${field}`;
    }
    return `${PREFIX}${gameId}_${field}`;
  }

  function scheduleFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => Storage.flushSync(), 2000);
  }

  return {
    setProfile(name) {
      activeProfile = name;
      localStorage.setItem(PROFILE_KEY, name);
    },

    getProfile() {
      if (!activeProfile) {
        activeProfile = localStorage.getItem(PROFILE_KEY) || '';
      }
      return activeProfile;
    },

    save(gameId, field, value) {
      try {
        localStorage.setItem(key(gameId, field), JSON.stringify(value));
        // Always queue if profile is set — connectivity checked at flush time
        if (activeProfile && typeof SyncEngine !== 'undefined') {
          syncQueue.push({ gameId, field, value });
          scheduleFlush();
        }
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
    },

    load(gameId, field, defaultVal = null) {
      try {
        const raw = localStorage.getItem(key(gameId, field));
        return raw !== null ? JSON.parse(raw) : defaultVal;
      } catch (e) {
        console.warn('Storage load failed:', e);
        return defaultVal;
      }
    },

    remove(gameId, field) {
      try {
        localStorage.removeItem(key(gameId, field));
      } catch (e) {
        console.warn('Storage remove failed:', e);
      }
    },

    clearGame(gameId) {
      try {
        const pfx = activeProfile ? `${PREFIX}${activeProfile}_${gameId}_` : `${PREFIX}${gameId}_`;
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith(pfx)) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Storage clear failed:', e);
      }
    },

    async pullFromCloud() {
      if (!activeProfile || typeof SyncEngine === 'undefined' || !SyncEngine.isActive()) return;
      try {
        const profileId = await SyncEngine.getProfileId(activeProfile);
        if (!profileId) return;
        const rows = await SyncEngine.pullAll(profileId);
        rows.forEach(row => {
          const k = `${PREFIX}${activeProfile}_${row.game_id}_${row.field}`;
          const remote = row.value;
          const localRaw = localStorage.getItem(k);
          // Only overwrite if local is missing (cloud wins for missing data)
          if (localRaw === null) {
            localStorage.setItem(k, JSON.stringify(remote));
          }
        });
      } catch (e) {
        console.warn('Cloud pull failed:', e);
      }
    },

    async flushSync() {
      if (!syncQueue.length || !activeProfile) return;
      if (typeof SyncEngine === 'undefined') return;
      // Wait for SDK to load, then check connectivity
      await SyncEngine.ready();
      if (!SyncEngine.isActive()) return;
      const batch = syncQueue.splice(0);
      try {
        const profileId = await SyncEngine.getProfileId(activeProfile);
        if (!profileId) return;
        await SyncEngine.pushBatch(profileId, batch);
      } catch (e) {
        console.warn('Cloud push failed:', e);
        syncQueue.unshift(...batch);
      }
    },

    migrateUnprefixed(profile) {
      const oldPrefix = PREFIX;
      const newPrefix = `${PREFIX}${profile}_`;
      const toMigrate = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(oldPrefix) && !k.startsWith(`${oldPrefix}${profile}_`) && !k.startsWith('kids_games__')) {
          // Check it's not already a profiled key for another profile
          const afterPrefix = k.slice(oldPrefix.length);
          const isProfiled = afterPrefix.match(/^(Dan|Emma)_/);
          if (!isProfiled) {
            toMigrate.push(k);
          }
        }
      }
      toMigrate.forEach(k => {
        const suffix = k.slice(oldPrefix.length);
        const newKey = `${newPrefix}${suffix}`;
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, localStorage.getItem(k));
        }
      });
    },

    /** Get all game data for a profile (used by dashboard) */
    getAllForProfile(profile) {
      const pfx = `${PREFIX}${profile}_`;
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(pfx)) {
          const rest = k.slice(pfx.length);
          const sepIdx = rest.lastIndexOf('_');
          if (sepIdx > 0) {
            const gameId = rest.slice(0, sepIdx);
            const field = rest.slice(sepIdx + 1);
            if (!data[gameId]) data[gameId] = {};
            try { data[gameId][field] = JSON.parse(localStorage.getItem(k)); } catch (e) { /* skip */ }
          }
        }
      }
      return data;
    },
  };
})();
