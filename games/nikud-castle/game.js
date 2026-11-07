/**
 * Nikud Castle — Core Game Logic
 * Each castle room teaches new nikud. A session is 10 mixed rounds:
 *   hear   — hear a syllable, tap it
 *   read   — see a syllable, listen to the choices, pick how it's read
 *   keyboard — hear a syllable, press its letter on a Hebrew keyboard
 *   name   — hear a nikud's name, tap the mark
 *   picture— see a first syllable, tap the picture that starts with it
 * Plus a memory game matching written words to pictures.
 */
const Game = (() => {
  const GAME_ID = 'nikud-castle';
  const SESSION_ROUNDS = 10;
  const ADVANCE_RATIO = 0.6;
  const TYPE_WEIGHTS = { hear: 4, read: 3, picture: 3, name: 2, keyboard: 2 };

  // Free practice: she picks the nikud and one challenge type (or a mix)
  const PRACTICE_FORMATS = [
    { id: 'mix', icon: '🎲', label: 'הכל ביחד' },
    { id: 'hear', icon: '👂', label: 'שומעים ובוחרים' },
    { id: 'picture', icon: '🖼️', label: 'תמונה מתאימה' },
    { id: 'read', icon: '🔊', label: 'איך קוראים?' },
    { id: 'keyboard', icon: '⌨️', label: 'מקלדת' },
    { id: 'name', icon: '👑', label: 'שם הניקוד' },
  ];

  const state = {
    screen: 'castle',
    room: 0,               // furthest room she's ready for (progress)
    playRoom: 0,           // room she chose to play; all rooms are open
    introSeen: {},         // roomIdx → true
    coins: 0,
    rounds: [],            // planned rounds for this session
    round: 0,
    firstTryCorrect: 0,
    sessionCoins: 0,
    wrongThisRound: 0,
    inputLocked: false,
    selected: null,        // sound option picked in a "read" round, awaiting ✔
    practice: null,        // { nikud, format } while a free-practice session runs
    practiceNikud: [],     // last free-practice choices (saved)
    practiceFormat: 'mix',
    roundStart: 0,
    introRoom: 0,
    roomOverride: false,   // ?room=N steering is never saved
    // memory game
    memory: { cards: [], open: [], matched: 0, pairs: 0, moves: 0, locked: false },
  };

  let els = {};

  // ─── Init ────────────────────────────────────────────────
  function init() {
    Audio.init();
    cacheDOM();
    Adaptive.load(GAME_ID);
    SharedCoins.migrate();
    loadProgress();

    // Parent/test steering: ?room=4 plays room 4 (not saved)
    const urlRoom = parseInt(new URLSearchParams(window.location.search).get('room'), 10);
    if (urlRoom >= 1 && urlRoom <= ROOMS.length) {
      state.playRoom = urlRoom - 1;
      state.roomOverride = true;
    }

    bindEvents();
    showCastle();
  }

  function cacheDOM() {
    const $ = s => document.querySelector(s);
    els.container = $('.game-container');
    els.screens = {
      castle: $('.castle-screen'),
      intro: $('.intro-screen'),
      practice: $('.practice-screen'),
      game: $('.game-screen'),
      memory: $('.memory-screen'),
      end: $('.end-screen'),
    };
    els.roomGrid = $('.room-grid');
    els.coinCount = document.querySelectorAll('.coin-count');
    els.playBtn = $('.btn-play');
    els.memoryBtn = $('.btn-memory');
    els.practiceBtn = $('.btn-practice');
    els.practiceNikud = $('.practice-nikud');
    els.practiceFormats = $('.practice-formats');
    els.practiceGo = $('.btn-practice-go');
    els.introMarks = $('.intro-marks');
    els.introExamples = $('.intro-examples');
    els.introRoom = $('.intro-room');
    els.introGo = $('.btn-intro-go');
    els.roomLabel = $('.room-label');
    els.progressFill = $('.game-screen .progress-fill');
    els.promptText = $('.prompt-text');
    els.replayBtn = $('.btn-replay');
    els.showcase = $('.showcase');
    els.options = $('.options');
    els.confirmBtn = $('.btn-confirm');
    els.princess = $('.game-screen .princess');
    els.memoryGrid = $('.memory-grid');
    els.memoryMoves = $('.memory-moves');
    els.endTitle = $('.end-title');
    els.endStars = $('.end-stars');
    els.endCoins = $('.end-coins');
    els.endUnlock = $('.end-unlock');
    els.endAgain = $('.btn-again');
    Particles.init($('.particle-canvas'));
  }

  function bindEvents() {
    document.addEventListener('click', () => { Audio.init(); unlockClips(); }, { once: true });
    els.playBtn.addEventListener('click', () => { Audio.SFX.tap(); startLessons(); });
    els.memoryBtn.addEventListener('click', () => { Audio.SFX.tap(); startMemory(); });
    els.practiceBtn.addEventListener('click', () => { Audio.SFX.tap(); showPractice(); });
    els.practiceGo.addEventListener('click', () => {
      Audio.SFX.tap();
      startSession({ nikud: [...state.practiceNikud], format: state.practiceFormat });
    });
    els.introGo.addEventListener('click', () => { Audio.SFX.tap(); startSession(); });
    els.replayBtn.addEventListener('click', () => {
      const r = state.rounds[state.round];
      if (r) say(r.speech);
    });
    els.confirmBtn.addEventListener('click', () => {
      if (state.selected) onAnswer(state.selected.btn, state.selected.opt);
    });
    els.showcase.addEventListener('click', () => {
      const r = state.rounds[state.round];
      if (r && r.tapSpeech && state.screen === 'game') {
        say(r.tapSpeech);
        if (els.showcase.classList.contains('tappable')) sparkleAt(els.showcase);
      }
    });
    // A real keyboard set to Hebrew works too
    document.addEventListener('keydown', e => {
      const r = state.rounds[state.round];
      if (state.screen !== 'game' || !r || r.type !== 'keyboard') return;
      const finals = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
      const ch = finals[e.key] || e.key;
      const btn = [...els.options.children].find(b => b.textContent === ch);
      if (btn) btn.click();
    });
    document.querySelectorAll('.btn-castle').forEach(b => b.addEventListener('click', () => {
      Audio.SFX.tap();
      showCastle();
    }));
    els.endAgain.addEventListener('click', () => {
      Audio.SFX.tap();
      const mode = els.endAgain.dataset.mode;
      if (mode === 'memory') startMemory();
      else if (mode === 'practice') startSession(state.practice);
      else startLessons();
    });
  }

  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  }

  // ─── Speech ──────────────────────────────────────────────
  // Pre-recorded ElevenLabs clips first (audio/clips.js), live TTS for anything missing.
  // One reused <audio> element: iOS only lets an element play without a tap
  // once that element has been started by a tap (see unlockClips).
  const clipPlayer = new window.Audio();
  let clipDone = null;

  function unlockClips() {
    if (clipPlayer.src) return; // the tap already started a clip, which unlocks it
    clipPlayer.muted = true;
    clipPlayer.src = `audio/${Object.values(typeof AUDIO_CLIPS !== 'undefined' ? AUDIO_CLIPS : {})[0] || ''}`;
    clipPlayer.play().then(() => clipPlayer.pause()).catch(() => {}).finally(() => { clipPlayer.muted = false; });
  }

  // say() takes one phrase or a list played in sequence (e.g. instruction + syllable);
  // any newer say() call cuts off the rest of a sequence.
  let sayGen = 0;

  async function say(textOrList) {
    const gen = ++sayGen;
    const list = [].concat(textOrList);
    for (let i = 0; i < list.length; i++) {
      if (gen !== sayGen) return;
      if (i > 0) await Utils.wait(150);
      await sayOne(list[i]);
    }
  }

  function sayOne(text) {
    const file = typeof AUDIO_CLIPS !== 'undefined' && AUDIO_CLIPS[text];
    if (clipDone) clipDone();
    clipPlayer.pause();
    if (!file) return Audio.speak(text, 0.8, 'he-IL');
    if (typeof GeminiTTS !== 'undefined') GeminiTTS.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    return new Promise(resolve => {
      const finish = () => {
        if (clipDone !== finish) return;
        clipDone = null;
        clipPlayer.onended = clipPlayer.onerror = null;
        resolve();
      };
      clipDone = finish;
      clipPlayer.onended = finish;
      clipPlayer.onerror = () => { finish(); Audio.speak(text, 0.8, 'he-IL'); };
      clipPlayer.muted = false;
      clipPlayer.src = `audio/${file}`;
      clipPlayer.play().catch(finish);
    });
  }

  function preload(texts) {
    const missing = [];
    texts.forEach(t => {
      const file = typeof AUDIO_CLIPS !== 'undefined' && AUDIO_CLIPS[t];
      if (file) new window.Audio(`audio/${file}`).preload = 'auto';
      else missing.push(t);
    });
    if (missing.length) Audio.preloadTTS(missing, 'he-IL');
  }

  /** Speak, but never block the game for more than maxMs */
  function sayAndWait(text, maxMs = 2500) {
    return Promise.race([say(text), Utils.wait(maxMs)]);
  }

  // ─── Castle (home) ───────────────────────────────────────
  function showCastle() {
    updateCoins();
    els.roomGrid.innerHTML = '';
    ROOMS.forEach((room, i) => {
      const card = document.createElement('button');
      card.className = 'room-card' + (i === state.playRoom ? ' current' : '') + (i === state.room ? ' frontier' : '');
      const marks = room.nikud.map(id => NIKUD[id].display).join(' ');
      const stars = '⭐'.repeat(roomStars(i)) + '☆'.repeat(3 - roomStars(i));
      card.innerHTML = `
        <span class="room-icon">${room.icon}</span>
        <span class="room-marks he">${marks}</span>
        <span class="room-name">${room.name}</span>
        <span class="room-stars">${stars}</span>`;
      card.addEventListener('click', () => {
        Audio.SFX.tap();
        state.playRoom = i;
        saveProgress();
        showIntro(i);
      });
      els.roomGrid.appendChild(card);
    });
    showScreen('castle');
  }

  /** Mastery of a room's syllables and nikud names: 0–3 stars */
  function roomStars(roomIdx) {
    const keys = roomKeys(roomIdx);
    if (!keys.length) return 0;
    const records = Adaptive.getRecords();
    const mastered = keys.filter(k => records[k] && records[k].box >= 3).length / keys.length;
    return mastered >= 0.9 ? 3 : mastered >= 0.6 ? 2 : mastered >= 0.25 ? 1 : 0;
  }

  /** Adaptive keys that count toward finishing a room */
  function roomKeys(roomIdx) {
    const keys = [];
    ROOMS[roomIdx].nikud.forEach(id => {
      NikudData.syllablesFor(id).forEach(s => keys.push(s.key));
      if (NikudData.unlockedNikud(roomIdx).length >= 2) keys.push(`n:${id}`);
    });
    return keys;
  }

  // ─── Intro (learn a room's nikud) ────────────────────────
  function showIntro(roomIdx) {
    state.introRoom = roomIdx;
    const room = ROOMS[roomIdx];
    els.introRoom.textContent = `${room.icon} ${room.name}`;

    els.introMarks.innerHTML = '';
    room.nikud.forEach(id => {
      const nk = NIKUD[id];
      const card = document.createElement('button');
      card.className = 'intro-mark';
      card.innerHTML = `<span class="intro-mark-glyph he">${nk.display}</span><span class="intro-mark-name he">${nk.name}</span>`;
      card.addEventListener('click', () => say(SPEECH.intro(id)));
      els.introMarks.appendChild(card);
    });

    els.introExamples.innerHTML = '';
    room.nikud.forEach(id => {
      Utils.shuffle(NikudData.syllablesFor(id)).slice(0, 4).forEach(s => {
        const b = document.createElement('button');
        b.className = 'intro-example he';
        b.textContent = s.text;
        b.addEventListener('click', () => { say(s.spoken); sparkleAt(b); });
        els.introExamples.appendChild(b);
      });
    });

    showScreen('intro');
    state.introSeen[roomIdx] = true;
    saveProgress();
    (async () => {
      for (const id of room.nikud) {
        if (state.screen !== 'intro') return;
        await say(SPEECH.intro(id));
      }
    })();
  }

  // ─── Free practice setup ─────────────────────────────────
  function showPractice() {
    els.practiceNikud.innerHTML = '';
    Object.entries(NIKUD).forEach(([id, nk]) => {
      const chip = document.createElement('button');
      chip.className = 'nikud-chip';
      chip.dataset.id = id;
      chip.innerHTML = `<span class="nikud-chip-mark he">${nk.display}</span><span class="nikud-chip-name he">${nk.name}</span>`;
      chip.addEventListener('click', () => {
        Audio.SFX.tap();
        const set = new Set(state.practiceNikud);
        if (set.has(id)) set.delete(id); else set.add(id);
        // Keep the data file's order so sessions are stable
        state.practiceNikud = Object.keys(NIKUD).filter(n => set.has(n));
        refreshPractice();
      });
      els.practiceNikud.appendChild(chip);
    });

    els.practiceFormats.innerHTML = '';
    PRACTICE_FORMATS.forEach(f => {
      const chip = document.createElement('button');
      chip.className = 'format-chip';
      chip.dataset.id = f.id;
      chip.innerHTML = `<span class="format-chip-icon">${f.icon}</span><span class="format-chip-label">${f.label}</span>`;
      chip.addEventListener('click', () => {
        if (chip.disabled) return;
        Audio.SFX.tap();
        state.practiceFormat = f.id;
        refreshPractice();
      });
      els.practiceFormats.appendChild(chip);
    });

    refreshPractice();
    showScreen('practice');
  }

  /** Sync chip states; grey out challenge types her nikud choice can't support */
  function refreshPractice() {
    const ctx = buildContext(state.practiceNikud);
    const canMix = Object.keys(TYPE_WEIGHTS).some(t => ctx.available[t]);
    const usable = id => (id === 'mix' ? canMix : ctx.available[id]);
    if (!usable(state.practiceFormat)) state.practiceFormat = 'mix';

    [...els.practiceNikud.children].forEach(chip => {
      chip.classList.toggle('selected', state.practiceNikud.includes(chip.dataset.id));
    });
    [...els.practiceFormats.children].forEach(chip => {
      chip.disabled = !usable(chip.dataset.id);
      chip.classList.toggle('selected', chip.dataset.id === state.practiceFormat);
    });
    els.practiceGo.disabled = !canMix;
    saveProgress();
  }

  // ─── Lessons session ─────────────────────────────────────
  function startLessons() {
    if (!state.introSeen[state.playRoom]) showIntro(state.playRoom);
    else startSession();
  }

  /**
   * Start a 10-round session. Room play uses the room's nikud (and earlier rooms')
   * with every challenge type; free practice uses her chosen nikud and type.
   */
  function startSession(practice = null) {
    state.practice = practice;
    state.round = 0;
    state.firstTryCorrect = 0;
    state.sessionCoins = 0;
    const nikudIds = practice ? practice.nikud : NikudData.unlockedNikud(state.playRoom);
    const types = practice && practice.format !== 'mix' ? [practice.format] : Object.keys(TYPE_WEIGHTS);
    state.rounds = planRounds(buildContext(nikudIds), types);
    preload(state.rounds.flatMap(r => [r.speech, r.reward, r.tapSpeech, ...r.options.map(o => o.speech)]).flat().filter(Boolean));
    const room = ROOMS[state.playRoom];
    els.roomLabel.textContent = practice ? '🎯 תרגול' : `${room.icon} ${room.name}`;
    showScreen('game');
    showRound();
  }

  function planRounds(ctx, allowedTypes) {
    const types = allowedTypes.filter(t => ctx.available[t]);
    const used = new Set();
    const rounds = [];
    let lastType = null;
    while (rounds.length < SESSION_ROUNDS) {
      // Avoid the same challenge type three times in a row
      let pool = types;
      if (rounds.length >= 2 && rounds[rounds.length - 1].type === rounds[rounds.length - 2].type && types.length > 1) {
        pool = types.filter(t => t !== lastType);
      }
      const type = weightedPick(pool, t => TYPE_WEIGHTS[t]);
      const round = BUILDERS[type](ctx, used);
      if (!round) continue;
      used.add(round.key);
      rounds.push(round);
      lastType = type;
    }
    return rounds;
  }

  function buildContext(nikudIds) {
    const chosen = new Set(nikudIds);
    const syllables = nikudIds.flatMap(id => NikudData.syllablesFor(id));
    const starters = WORDS
      .map(w => ({ ...w, first: NikudData.firstSyllable(w.word) }))
      .filter(w => w.first && chosen.has(w.first.nikud) && w.first.nikud !== 'shva');
    return {
      nikudIds, syllables, starters,
      available: {
        hear: new Set(syllables.map(s => s.sound)).size >= 3,
        read: syllables.length >= 1,
        keyboard: syllables.length >= 1,
        name: nikudIds.length >= 2,
        picture: starters.length >= 1,
      },
    };
  }

  /** Adaptive pick that avoids keys already used this session (when possible) */
  function pickFresh(keys, used) {
    const fresh = keys.filter(k => !used.has(k));
    return Adaptive.pickItem(fresh.length ? fresh : keys);
  }

  const BUILDERS = {
    hear(ctx, used) {
      const key = pickFresh(ctx.syllables.map(s => s.key), used);
      const target = ctx.syllables.find(s => s.key === key);
      // One option with the same letter but another sound (the nikud matters),
      // one with the same vowel sound but another letter, then anything else.
      const others = ctx.syllables.filter(s => s.sound !== target.sound);
      const options = [target];
      const addFrom = list => {
        const pick = Utils.shuffle(list).find(s => options.every(o => o.sound !== s.sound));
        if (pick) options.push(pick);
      };
      addFrom(others.filter(s => s.letter === target.letter));
      addFrom(others.filter(s => s.nikud === target.nikud));
      for (let tries = 0; options.length < 3 && tries < 5; tries++) addFrom(others);
      return {
        type: 'hear', key,
        prompt: 'אֵיפֹה כָּתוּב?',
        speech: SPEECH.hear(target),
        showcase: { text: '👂', cls: 'emoji' },
        tapSpeech: SPEECH.hear(target),
        options: Utils.shuffle(options).map(s => ({ label: s.text, cls: 'he', correct: s === target })),
      };
    },

    read(ctx, used) {
      const key = pickFresh(ctx.syllables.map(s => `r:${s.text}`), used);
      const target = ctx.syllables.find(s => `r:${s.text}` === key);
      // Same letter, other vowel sounds — only the nikud tells them apart
      const others = Utils.shuffle(NikudData.soundsOfLetter(target.letter).filter(o => o.sound !== target.sound)).slice(0, 2);
      return {
        type: 'read', key,
        prompt: SPEECH.read,
        speech: SPEECH.read,
        showcase: { text: target.text, cls: 'he' },
        reward: target.spoken,
        options: Utils.shuffle([target, ...others]).map(o => ({ label: '🔊', cls: 'sound', speech: o.spoken, correct: o === target })),
      };
    },

    keyboard(ctx, used) {
      const key = pickFresh(ctx.syllables.map(s => `k:${s.text}`), used);
      const target = ctx.syllables.find(s => `k:${s.text}` === key);
      const speech = [SPEECH.keyboard, target.spoken];
      return {
        type: 'keyboard', key,
        prompt: SPEECH.keyboard,
        speech,
        showcase: { text: '👂', cls: 'emoji' },
        tapSpeech: speech,
        reveal: target.text,
        reward: target.spoken,
        // Any letter that makes the sound counts (ת or ט for "ta")
        options: KEYBOARD_LETTERS.map(ch => ({
          label: ch, cls: 'he key', correct: NikudData.letterSounds(ch).includes(target.consonant),
        })),
      };
    },

    name(ctx, used) {
      const key = pickFresh(ctx.nikudIds.map(id => `n:${id}`), used);
      const id = key.slice(2);
      const distractors = Utils.shuffle(ctx.nikudIds.filter(n => n !== id)).slice(0, 2);
      return {
        type: 'name', key,
        prompt: SPEECH.name(id),
        speech: SPEECH.name(id),
        showcase: { text: '👑', cls: 'emoji' },
        tapSpeech: SPEECH.name(id),
        options: Utils.shuffle([id, ...distractors]).map(n => ({ label: NIKUD[n].display, cls: 'he mark', correct: n === id })),
      };
    },

    picture(ctx, used) {
      const key = pickFresh(ctx.starters.map(w => `p:${w.word}`), used);
      const target = ctx.starters.find(w => `p:${w.word}` === key);
      const pool = WORDS
        .map(w => ({ ...w, first: NikudData.firstSyllable(w.word) }))
        .filter(w => w.first && w.first.sound !== target.first.sound && w.emoji !== target.emoji);
      const distractors = pickDistinct(pool, 2, (a, b) => a.emoji === b.emoji || a.first.sound === b.first.sound);
      return {
        type: 'picture', key,
        prompt: SPEECH.picture,
        speech: SPEECH.picture,
        // A lone syllable: tapping it (or its 🔊 badge) says how it sounds
        showcase: { text: target.first.text, cls: 'he tappable' },
        tapSpeech: target.first.spoken,
        reward: target.word,
        options: Utils.shuffle([target, ...distractors]).map(w => ({ label: w.emoji, cls: 'emoji', correct: w === target })),
      };
    },
  };

  /** Pick n random items where no two clash (and none clash with `taken`) */
  function pickDistinct(list, n, clash, taken = []) {
    const out = [];
    for (const item of Utils.shuffle([...list])) {
      if (out.length >= n) break;
      if ([...taken, ...out].some(o => clash(o, item))) continue;
      out.push(item);
    }
    return out;
  }

  function weightedPick(items, weightOf) {
    const total = items.reduce((s, i) => s + weightOf(i), 0);
    let r = Math.random() * total;
    for (const i of items) { r -= weightOf(i); if (r <= 0) return i; }
    return items[items.length - 1];
  }

  function showRound() {
    const r = state.rounds[state.round];
    state.wrongThisRound = 0;
    state.inputLocked = false;
    els.progressFill.style.width = `${(state.round / SESSION_ROUNDS) * 100}%`;
    els.promptText.textContent = r.prompt;
    els.showcase.textContent = r.showcase.text;
    els.showcase.className = `showcase ${r.showcase.cls}`;
    void els.showcase.offsetWidth;
    els.showcase.classList.add('animate-pop-in');

    els.options.innerHTML = '';
    els.options.classList.toggle('keyboard', r.type === 'keyboard');
    els.confirmBtn.style.display = 'none';
    state.selected = null;
    r.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = `option ${opt.cls}`;
      b.textContent = opt.label;
      // Sound options: tap to listen (and select), then ✔ to answer
      b.addEventListener('click', () => (opt.speech ? selectSound(b, opt) : onAnswer(b, opt)));
      els.options.appendChild(b);
    });
    state.roundStart = Date.now();
    say(r.speech);
  }

  function selectSound(btn, opt) {
    if (state.inputLocked || btn.classList.contains('wrong')) return;
    say(opt.speech);
    [...els.options.children].forEach(b => b.classList.toggle('selected', b === btn));
    state.selected = { btn, opt };
    els.confirmBtn.style.display = '';
  }

  async function onAnswer(btn, opt) {
    if (state.inputLocked || btn.classList.contains('wrong')) return;
    const r = state.rounds[state.round];
    const responseMs = Date.now() - state.roundStart;

    if (!opt.correct) {
      if (state.wrongThisRound === 0) Adaptive.recordAnswer(r.key, false, responseMs);
      state.wrongThisRound++;
      Audio.SFX.wrong();
      btn.classList.add('wrong', 'animate-wobble');
      btn.classList.remove('selected');
      if (state.selected && state.selected.btn === btn) {
        state.selected = null;
        els.confirmBtn.style.display = 'none';
      }
      if (state.wrongThisRound >= 2) {
        // Gentle help: glow the right answer
        [...els.options.children].find((b, i) => r.options[i].correct).classList.add('hint');
      }
      if (r.type === 'hear' || r.type === 'name' || r.type === 'keyboard') say(r.speech);
      return;
    }

    state.inputLocked = true;
    els.confirmBtn.style.display = 'none';
    btn.classList.add('correct');
    if (r.reveal) {
      // Show what she heard: the letter with its nikud
      els.showcase.textContent = r.reveal;
      els.showcase.className = 'showcase he animate-pop-in';
    }
    Audio.SFX.correct();
    sparkleAt(btn);
    if (state.wrongThisRound === 0) {
      Adaptive.recordAnswer(r.key, true, responseMs);
      state.firstTryCorrect++;
      state.coins = SharedCoins.add(1);
      state.sessionCoins++;
      updateCoins();
      els.princess.classList.remove('cheer');
      void els.princess.offsetWidth;
      els.princess.classList.add('cheer');
    }

    // Picture rounds say the word back; others sometimes praise.
    // A revealed syllable stays up long enough to look at.
    const minPause = Utils.wait(r.reveal ? 1400 : 700);
    if (r.reward) await sayAndWait(r.reward);
    else if (Math.random() < 0.35) await sayAndWait(Utils.pickRandom(PRAISE, 1)[0]);
    await minPause;

    state.round++;
    if (state.round >= SESSION_ROUNDS) finishSession();
    else showRound();
  }

  function finishSession() {
    const ratio = state.firstTryCorrect / SESSION_ROUNDS;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    if (stars === 3) {
      state.coins = SharedCoins.add(3);
      state.sessionCoins += 3;
    }
    Energy.earnMinutes(2);
    const unlocked = state.practice ? null : checkAdvance();
    showEnd({ mode: state.practice ? 'practice' : 'lessons', stars, coins: state.sessionCoins, unlocked });
  }

  /**
   * Once most of the played room's items are answered right, move on: the
   * progress marker advances, and if she was on her furthest room she plays
   * the next one from now on. Returns the room she moves to, if any.
   */
  function checkAdvance() {
    const played = state.playRoom;
    if (played >= ROOMS.length - 1) return null;
    const keys = roomKeys(played);
    const records = Adaptive.getRecords();
    const learned = keys.filter(k => records[k] && records[k].box >= 1).length;
    if (!keys.length || learned / keys.length < ADVANCE_RATIO) return null;
    const wasFrontier = played >= state.room;
    state.room = Math.max(state.room, played + 1);
    if (wasFrontier) state.playRoom = played + 1;
    saveProgress();
    return wasFrontier ? ROOMS[state.playRoom] : null;
  }

  // ─── Memory game ─────────────────────────────────────────
  function startMemory() {
    const unlocked = new Set(NikudData.unlockedNikud(state.playRoom));
    const readable = WORDS.filter(w => NikudData.wordNikud(w.word).every(id => unlocked.has(id)));
    const pairs = state.playRoom >= 3 ? 6 : 4;
    const chosen = pickDistinct(readable, pairs, (a, b) => a.emoji === b.emoji);
    const cards = [];
    chosen.forEach((w, i) => {
      cards.push({ pair: i, face: w.word, cls: 'he', word: w.word });
      cards.push({ pair: i, face: w.emoji, cls: 'emoji', word: w.word });
    });
    state.memory = { cards: Utils.shuffle(cards), open: [], matched: 0, pairs: chosen.length, moves: 0, locked: false };

    els.memoryGrid.innerHTML = '';
    els.memoryGrid.dataset.count = cards.length;
    state.memory.cards.forEach(card => {
      const b = document.createElement('button');
      b.className = 'memory-card';
      b.innerHTML = `<span class="memory-back">👑</span><span class="memory-face ${card.cls}">${card.face}</span>`;
      b.addEventListener('click', () => flipCard(b, card));
      card.el = b;
      els.memoryGrid.appendChild(b);
    });
    updateMemoryMoves();
    showScreen('memory');
    say(SPEECH.memory);
  }

  async function flipCard(btn, card) {
    const m = state.memory;
    if (m.locked || btn.classList.contains('flipped')) return;
    Audio.SFX.tap();
    btn.classList.add('flipped');
    m.open.push(card);
    if (m.open.length < 2) return;

    m.moves++;
    updateMemoryMoves();
    const [a, b] = m.open;
    m.open = [];
    if (a.pair === b.pair) {
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      Audio.SFX.correct();
      sparkleAt(b.el);
      m.matched++;
      state.coins = SharedCoins.add(1);
      updateCoins();
      m.locked = true;
      await sayAndWait(a.word, 2000);
      m.locked = false;
      if (m.matched === m.pairs) finishMemory();
    } else {
      m.locked = true;
      await Utils.wait(1100);
      a.el.classList.remove('flipped');
      b.el.classList.remove('flipped');
      m.locked = false;
    }
  }

  function updateMemoryMoves() {
    els.memoryMoves.textContent = `🔄 ${state.memory.moves}`;
  }

  function finishMemory() {
    const { moves, pairs } = state.memory;
    const stars = moves <= pairs + 2 ? 3 : moves <= pairs * 2 ? 2 : 1;
    state.coins = SharedCoins.add(2);
    Energy.earnMinutes(2);
    setTimeout(() => showEnd({ mode: 'memory', stars, coins: pairs + 2, unlocked: null }), 600);
  }

  // ─── End screen ──────────────────────────────────────────
  function showEnd({ mode, stars, coins, unlocked }) {
    els.endTitle.textContent = stars === 3 ? 'מושלם! 👑' : 'כל הכבוד!';
    els.endStars.innerHTML = [1, 2, 3].map(i =>
      `<span class="end-star ${i <= stars ? 'earned' : ''}" style="animation-delay:${i * 200}ms">⭐</span>`).join('');
    els.endCoins.textContent = `🪙 +${coins}`;
    els.endAgain.dataset.mode = mode;
    if (unlocked) {
      els.endUnlock.innerHTML = `עוברים לחדר הבא בארמון!<br><span class="end-unlock-room">${unlocked.icon} ${unlocked.name}</span>`;
      els.endUnlock.style.display = '';
    } else {
      els.endUnlock.style.display = 'none';
    }
    showScreen('end');
    Audio.SFX.fanfare();
    Particles.confetti(unlocked ? 120 : 60);
    say(unlocked ? SPEECH.unlock : Utils.pickRandom(PRAISE, 1)[0]);
  }

  // ─── Helpers ─────────────────────────────────────────────
  function sparkleAt(el) {
    const rect = el.getBoundingClientRect();
    Particles.sparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, 18, '#ffd6f5');
  }

  function updateCoins() {
    state.coins = SharedCoins.get();
    els.coinCount.forEach(el => { el.textContent = state.coins; });
  }

  function saveProgress() {
    if (!state.roomOverride) {
      Storage.save(GAME_ID, 'room', state.room);
      Storage.save(GAME_ID, 'playRoom', state.playRoom);
    }
    Storage.save(GAME_ID, 'introSeen', state.introSeen);
    Storage.save(GAME_ID, 'practiceNikud', state.practiceNikud);
    Storage.save(GAME_ID, 'practiceFormat', state.practiceFormat);
  }

  function loadProgress() {
    state.room = Math.min(Storage.load(GAME_ID, 'room', 0), ROOMS.length - 1);
    state.playRoom = Math.min(Storage.load(GAME_ID, 'playRoom', state.room), ROOMS.length - 1);
    state.introSeen = Storage.load(GAME_ID, 'introSeen', {});
    state.practiceNikud = Storage.load(GAME_ID, 'practiceNikud', NikudData.unlockedNikud(state.room))
      .filter(id => NIKUD[id]);
    state.practiceFormat = Storage.load(GAME_ID, 'practiceFormat', 'mix');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
