/**
 * Audio system using Web Audio API for sound effects
 * and Web Speech API for spoken numbers.
 * No audio files needed — everything is generated programmatically.
 */
const Audio = (() => {
  let ctx = null;
  let initialized = false;
  let lang = 'en'; // 'en' or 'he'

  const HEBREW_NUMBERS = {
    1: 'אחת', 2: 'שתיים', 3: 'שלוש', 4: 'ארבע', 5: 'חמש',
    6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר',
    11: 'אחת עשרה', 12: 'שתים עשרה', 13: 'שלוש עשרה',
    14: 'ארבע עשרה', 15: 'חמש עשרה', 16: 'שש עשרה',
    17: 'שבע עשרה', 18: 'שמונה עשרה', 19: 'תשע עשרה', 20: 'עשרים',
  };

  function setLang(newLang) { lang = newLang; }
  function getLang() { return lang; }

  function init() {
    if (!initialized) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        initialized = true;
      } catch (e) {
        console.warn('Web Audio API not available:', e);
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * Play a tone with given frequency, duration, and type.
   */
  function playTone(freq, duration = 0.2, type = 'sine', volume = 0.3) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Play a sequence of tones (melody).
   */
  function playMelody(notes) {
    if (!ctx) return;
    let time = ctx.currentTime;
    for (const [freq, duration, type = 'sine'] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
      time += duration * 0.8;
    }
  }

  const SFX = {
    /** Happy chime for correct answer */
    correct() {
      playMelody([
        [523, 0.12],  // C5
        [659, 0.12],  // E5
        [784, 0.2],   // G5
      ]);
    },

    /** Gentle boop for wrong answer */
    wrong() {
      playTone(200, 0.25, 'triangle', 0.2);
    },

    /** Click / tap sound */
    tap() {
      playTone(800, 0.05, 'sine', 0.15);
    },

    /** Power select whoosh */
    whoosh() {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    },

    /** Level complete fanfare */
    fanfare() {
      playMelody([
        [523, 0.15],  // C5
        [587, 0.15],  // D5
        [659, 0.15],  // E5
        [784, 0.15],  // G5
        [1047, 0.35], // C6
      ]);
    },

    /** Game complete celebration */
    celebration() {
      playMelody([
        [523, 0.1],
        [587, 0.1],
        [659, 0.1],
        [784, 0.1],
        [880, 0.1],
        [1047, 0.15],
        [1175, 0.15],
        [1319, 0.3],
      ]);
    },

    /** Star earned */
    star() {
      playMelody([
        [880, 0.1],
        [1109, 0.15],
        [1319, 0.25],
      ]);
    },

    /** Fire power activation */
    fire() {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    },

    /** Water power activation */
    water() {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    },
  };

  /**
   * Speak text aloud using Web Speech API.
   * @param {string} text
   * @param {number} rate
   * @param {string} [langOverride] - BCP 47 language tag, e.g. 'en' or 'he-IL'
   */
  function speak(text, rate = 0.9, langOverride) {
    return new Promise(resolve => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = 1.2; // Slightly higher pitch — friendlier for kids
      utter.volume = 1;
      if (langOverride) utter.lang = langOverride;
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });
  }

  /**
   * Speak a number with emphasis, in the current language.
   */
  function speakNumber(n) {
    if (lang === 'he') {
      const word = HEBREW_NUMBERS[n] || String(n);
      return speak(word, 0.8, 'he-IL');
    }
    return speak(String(n), 0.8, 'en-US');
  }

  return { init, SFX, speak, speakNumber, setLang, getLang, HEBREW_NUMBERS };
})();
