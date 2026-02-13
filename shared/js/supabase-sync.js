/**
 * Supabase sync engine for cross-device game progress.
 * Gracefully degrades — if Supabase CDN fails, everything works offline.
 */
const SyncEngine = (() => {
  // TODO: Replace with your Supabase project credentials
  const SUPABASE_URL = 'https://xanesbzvzhjqndkskvnh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmVzYnp2emhqcW5ka3Nrdm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODA5NDcsImV4cCI6MjA4NjU1Njk0N30.uoNz0Wm-832jeIyRYu-NlJUHvgkE89bU_tHtXD4skfs';

  let client = null;
  let profileCache = {};

  return {
    init() {
      try {
        if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
          client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          window.addEventListener('online', () => Storage.flushSync());
        }
      } catch (e) {
        console.warn('Supabase init failed (offline mode):', e);
      }
    },

    isActive() {
      return client !== null && navigator.onLine;
    },

    async getProfileId(name) {
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
      if (!client) return [];
      const { data, error } = await client.from('game_data').select('game_id, field, value').eq('profile_id', profileId);
      if (error) throw error;
      return data || [];
    },
  };
})();

// Auto-init when script loads
SyncEngine.init();
