/**
 * GeminiTTS — Shared IIFE module for Gemini-powered text-to-speech.
 * Uses the gemini-2.5-flash-preview-tts REST API to generate natural speech.
 * Returns null on failure so callers can fall back to Web Speech API.
 */
const GeminiTTS = (() => {
  const MODEL = 'gemini-2.5-flash-preview-tts';
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
  const SAMPLE_RATE = 24000;
  const VOICE_NAME = 'Kore';

  // Same Supabase key management as voice-tutor
  const SUPABASE_URL = 'https://xanesbzvzhjqndkskvnh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmVzYnp2emhqcW5ka3Nrdm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODA5NDcsImV4cCI6MjA4NjU1Njk0N30.uoNz0Wm-832jeIyRYu-NlJUHvgkE89bU_tHtXD4skfs';
  const KEY_ENDPOINT = `${SUPABASE_URL}/functions/v1/gemini-key`;
  const FALLBACK_KEY = 'AIzaSyA_lgf76fwtXxm0ubStGk_nb9EEl2leaeA';

  let apiKey = null;
  let audioCtx = null;
  let currentSource = null;
  const cache = new Map();
  const pending = new Map();
  let enabled = true;
  let hardFailures = 0;       // non-429 failures
  const MAX_HARD_FAILURES = 3;

  // --- API Key ---
  async function fetchApiKey() {
    try {
      const res = await fetch(KEY_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return data.key;
    } catch (e) {
      console.warn('[GeminiTTS] Edge function unavailable, using fallback key:', e.message);
      return FALLBACK_KEY;
    }
  }

  async function ensureKey() {
    if (!apiKey) apiKey = await fetchApiKey();
    return apiKey;
  }

  // --- AudioContext ---
  function ensureCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // --- REST TTS call with retry for 429 ---
  const LANG_NAMES = { en: 'English', he: 'Hebrew' };

  async function generateSpeech(text, lang = 'en', retries = 2) {
    const key = await ensureKey();
    const url = `${API_BASE}/${MODEL}:generateContent?key=${key}`;
    const langName = LANG_NAMES[lang] || 'English';
    const prompt = `Read this aloud in ${langName}: "${text}"`;

    // Kore only works for English; omit voice for Hebrew so model auto-selects
    const genConfig = { responseModalities: ['AUDIO'] };
    if (lang === 'en') {
      genConfig.speechConfig = {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } }
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: genConfig
      })
    });

    if (res.status === 429 && retries > 0) {
      // Rate limited — wait and retry
      const waitMs = (3 - retries) * 2000 + 1000; // 1s, 3s
      await new Promise(r => setTimeout(r, waitMs));
      return generateSpeech(text, lang, retries - 1);
    }

    if (!res.ok) throw new Error(`Gemini TTS ${res.status}`);

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !parts[0]?.inlineData?.data) throw new Error('No audio in response');
    return decodeBase64PCM(parts[0].inlineData.data);
  }

  // --- PCM decode ---
  function decodeBase64PCM(base64) {
    const ctx = ensureCtx();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const buffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  // --- Playback ---
  function playBuffer(buffer) {
    return new Promise(resolve => {
      if (currentSource) { try { currentSource.stop(); } catch {} }
      const ctx = ensureCtx();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        if (currentSource === source) currentSource = null;
        resolve();
      };
      currentSource = source;
      source.start();
    });
  }

  function stop() {
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; }
  }

  // --- speak (on-demand, with cache) ---
  async function speak(text, lang = 'en') {
    if (!enabled) return null;
    const cacheKey = `${lang}:${text}`;

    if (cache.has(cacheKey)) {
      await playBuffer(cache.get(cacheKey));
      return true;
    }

    if (pending.has(cacheKey)) {
      const buffer = await pending.get(cacheKey);
      if (buffer) { await playBuffer(buffer); return true; }
      return null;
    }

    const promise = generateSpeech(text, lang)
      .then(buffer => {
        cache.set(cacheKey, buffer);
        hardFailures = 0;
        pending.delete(cacheKey);
        return buffer;
      })
      .catch(err => {
        console.warn('[GeminiTTS] Failed:', err.message);
        hardFailures++;
        if (hardFailures >= MAX_HARD_FAILURES) {
          console.warn('[GeminiTTS] Too many failures, disabling');
          enabled = false;
        }
        pending.delete(cacheKey);
        return null;
      });

    pending.set(cacheKey, promise);
    const buffer = await promise;
    if (buffer) { await playBuffer(buffer); return true; }
    return null;
  }

  // --- preload (sequential, one at a time, with delay) ---
  function preload(phrases, lang = 'en') {
    const queue = phrases.filter(t => {
      const k = `${lang}:${t}`;
      return !cache.has(k) && !pending.has(k);
    });
    if (queue.length === 0) return;

    let i = 0;
    function next() {
      if (i >= queue.length || !enabled) return;
      const text = queue[i++];
      const cacheKey = `${lang}:${text}`;

      const promise = generateSpeech(text, lang)
        .then(buffer => { cache.set(cacheKey, buffer); return buffer; })
        .catch(() => null)
        .finally(() => {
          pending.delete(cacheKey);
          // Wait 500ms between preload requests to avoid rate limits
          setTimeout(next, 500);
        });

      pending.set(cacheKey, promise);
    }
    next();
  }

  function isEnabled() { return enabled; }
  function reset() { enabled = true; hardFailures = 0; }

  return { speak, preload, stop, isEnabled, reset };
})();
