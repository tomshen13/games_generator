/**
 * Supabase sync engine for cross-device game progress.
 * Loads the Supabase SDK dynamically so it never blocks page rendering.
 * Gracefully degrades — if CDN fails, everything works offline.
 */
const SyncEngine = (() => {
  const SUPABASE_URL = 'https://xanesbzvzhjqndkskvnh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmVzYnp2emhqcW5ka3Nrdm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODA5NDcsImV4cCI6MjA4NjU1Njk0N30.uoNz0Wm-832jeIyRYu-NlJUHvgkE89bU_tHtXD4skfs';
  const CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  let client = null;
  let profileCache = {};
  let initPromise = null;

  function loadSDK() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = CDN_URL;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  return {
    init() {
      initPromise = loadSDK().then(ok => {
        try {
          if (ok && typeof supabase !== 'undefined') {
            client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.addEventListener('online', () => Storage.flushSync());
          }
        } catch (e) {
          console.warn('Supabase init failed (offline mode):', e);
        }
      });
    },

    isActive() {
      return client !== null && navigator.onLine;
    },

    /** Wait for SDK to finish loading before making calls */
    async ready() {
      if (initPromise) await initPromise;
    },

    async getProfileId(name) {
      await this.ready();
      if (!client) return null;
      if (profileCache[name]) return profileCache[name];
      try {
        const { data, error } = await client.from('profiles').select('id').eq('name', name).single();
        if (error || !data) return null;
        profileCache[name] = data.id;
        return data.id;
      } catch (e) {
        console.warn('Profile lookup failed:', e);
        return null;
      }
    },

    async pushBatch(profileId, batch) {
      await this.ready();
      if (!client || !batch.length) return;
      const rows = batch.map(item => ({
        profile_id: profileId,
        game_id: item.gameId,
        field: item.field,
        value: item.value,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await client.from('game_data').upsert(rows, {
        onConflict: 'profile_id,game_id,field',
      });
      if (error) throw error;
    },

    async pullAll(profileId) {
      await this.ready();
      if (!client) return [];
      const { data, error } = await client.from('game_data').select('game_id, field, value').eq('profile_id', profileId);
      if (error) throw error;
      return data || [];
    },
  };
})();

// Start loading SDK in background immediately
SyncEngine.init();
