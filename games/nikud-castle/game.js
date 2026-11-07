/**
 * Nikud Castle — Core Game Logic
 * Each castle room teaches new nikud. A session is 10 mixed rounds:
 *   hear   — hear a syllable, tap it
 *   name   — hear a nikud's name, tap the mark
 *   picture— see a first syllable, tap the picture that starts with it
 *   word   — read a word, tap its picture
 * Plus a memory game matching written words to pictures.
 */
const Game = (() => {
  const GAME_ID = 'nikud-castle';
  const SESSION_ROUNDS = 10;
  const ADVANCE_RATIO = 0.6;
  const TYPE_WEIGHTS = { hear: 4, picture: 3, word: 3, name: 2 };

  const state = {
    screen: 'castle',
    room: 0,               // highest unlocked room index
    introSeen: {},         // roomIdx → true
    coins: 0,
    rounds: [],            // planned rounds for this session
    round: 0,
    firstTryCorrect: 0,
    sessionCoins: 0,
    wrongThisRound: 0,
    inputLocked: false,
    roundStart: 0,
    introRoom: 0,
    introThenPlay: false,
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

    // Parent/test steering: ?room=4 plays as if rooms 1–4 are open (not saved)
    const urlRoom = parseInt(new URLSearchParams(window.location.search).get('room'), 10);
    if (urlRoom >= 1 && urlRoom <= ROOMS.length) {
      state.room = urlRoom - 1;
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
      game: $('.game-screen'),
      memory: $('.memory-screen'),
      end: $('.end-screen'),
    };
    els.roomGrid = $('.room-grid');
    els.coinCount = document.querySelectorAll('.coin-count');
    els.playBtn = $('.btn-play');
    els.memoryBtn = $('.btn-memory');
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
    els.introGo.addEventListener('click', () => {
      Audio.SFX.tap();
      if (state.introThenPlay) startSession(); else showCastle();
    });
    els.replayBtn.addEventListener('click', () => {
      const r = state.rounds[state.round];
      if (r) say(r.speech);
    });
    document.querySelectorAll('.btn-castle').forEach(b => b.addEventListener('click', () => {
      Audio.SFX.tap();
      showCastle();
    }));
    els.endAgain.addEventListener('click', () => {
      Audio.SFX.tap();
      if (els.endAgain.dataset.mode === 'memory') startMemory(); else startLessons();
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

  function say(text) {
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
      const unlocked = i <= state.room;
      const card = document.createElement('button');
      card.className = 'room-card' + (unlocked ? '' : ' locked') + (i === state.room ? ' current' : '');
      const marks = room.nikud.map(id => NIKUD[id].display).join(' ');
      const stars = unlocked ? '⭐'.repeat(roomStars(i)) + '☆'.repeat(3 - roomStars(i)) : '🔒';
      card.innerHTML = `
        <span class="room-icon">${room.icon}</span>
        <span class="room-marks he">${unlocked ? marks : ''}</span>
        <span class="room-name">${room.name}</span>
        <span class="room-stars">${stars}</span>`;
      if (unlocked) {
        card.addEventListener('click', () => { Audio.SFX.tap(); showIntro(i, false); });
      }
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
  function showIntro(roomIdx, thenPlay) {
    state.introRoom = roomIdx;
    state.introThenPlay = thenPlay;
    const room = ROOMS[roomIdx];
    els.introRoom.textContent = `${room.icon} ${room.name}`;
    els.introGo.textContent = thenPlay ? '▶ יאללה!' : '🏰 חזרה לארמון';

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

  // ─── Lessons session ─────────────────────────────────────
  function startLessons() {
    if (!state.introSeen[state.room]) showIntro(state.room, true);
    else startSession();
  }

  function startSession() {
    state.round = 0;
    state.firstTryCorrect = 0;
    state.sessionCoins = 0;
    state.rounds = planRounds();
    preload(state.rounds.flatMap(r => r.reward ? [r.speech, r.reward] : [r.speech]));
    const room = ROOMS[state.room];
    els.roomLabel.textContent = `${room.icon} ${room.name}`;
    showScreen('game');
    showRound();
  }

  function planRounds() {
    const ctx = buildContext();
    const types = Object.keys(TYPE_WEIGHTS).filter(t => ctx.available[t]);
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

  function buildContext() {
    const nikudIds = NikudData.unlockedNikud(state.room);
    const unlocked = new Set(nikudIds);
    const syllables = nikudIds.flatMap(id => NikudData.syllablesFor(id));
    const readable = WORDS.filter(w => NikudData.wordNikud(w.word).every(id => unlocked.has(id)));
    const starters = WORDS
      .map(w => ({ ...w, first: NikudData.firstSyllable(w.word) }))
      .filter(w => w.first && unlocked.has(w.first.nikud) && w.first.nikud !== 'shva');
    return {
      nikudIds, syllables, readable, starters,
      available: {
        hear: syllables.length >= 3,
        name: nikudIds.length >= 2,
        picture: starters.length >= 1,
        word: readable.length >= 1,
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
        options: Utils.shuffle(options).map(s => ({ label: s.text, cls: 'he', correct: s === target })),
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
        showcase: { text: target.first.text, cls: 'he' },
        reward: target.word,
        options: Utils.shuffle([target, ...distractors]).map(w => ({ label: w.emoji, cls: 'emoji', correct: w === target })),
      };
    },

    word(ctx, used) {
      const key = pickFresh(ctx.readable.map(w => `w:${w.word}`), used);
      const target = ctx.readable.find(w => `w:${w.word}` === key);
      // Prefer pictures whose words start with the same letter, so the whole word must be read
      const firstLetter = NikudData.clusters(target.word)[0].letter;
      const others = WORDS.filter(w => w.emoji !== target.emoji);
      const sameStart = others.filter(w => NikudData.clusters(w.word)[0].letter === firstLetter);
      const distractors = pickDistinct(Utils.shuffle(sameStart), 1, (a, b) => a.emoji === b.emoji);
      distractors.push(...pickDistinct(others.filter(w => !distractors.includes(w)), 2 - distractors.length,
        (a, b) => a.emoji === b.emoji, distractors));
      return {
        type: 'word', key,
        prompt: SPEECH.word,
        speech: SPEECH.word,
        showcase: { text: target.word, cls: 'he word' },
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
    r.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = `option ${opt.cls}`;
      b.textContent = opt.label;
      b.addEventListener('click', () => onAnswer(b, opt));
      els.options.appendChild(b);
    });
    state.roundStart = Date.now();
    say(r.speech);
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
      if (state.wrongThisRound >= 2) {
        // Gentle help: glow the right answer
        [...els.options.children].find((b, i) => r.options[i].correct).classList.add('hint');
      }
      if (r.type === 'hear' || r.type === 'name') say(r.speech);
      return;
    }

    state.inputLocked = true;
    btn.classList.add('correct');
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

    // Reading rounds say the word back; listening rounds sometimes praise
    if (r.reward) await sayAndWait(r.reward);
    else if (Math.random() < 0.35) await sayAndWait(Utils.pickRandom(PRAISE, 1)[0]);
    else await Utils.wait(700);

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
    const unlocked = checkAdvance();
    showEnd({ mode: 'lessons', stars, coins: state.sessionCoins, unlocked });
  }

  /** Open the next room once most of this room's items have been answered right */
  function checkAdvance() {
    if (state.room >= ROOMS.length - 1) return null;
    const keys = roomKeys(state.room);
    const records = Adaptive.getRecords();
    const learned = keys.filter(k => records[k] && records[k].box >= 1).length;
    if (keys.length && learned / keys.length >= ADVANCE_RATIO) {
      state.room++;
      saveProgress();
      return ROOMS[state.room];
    }
    return null;
  }

  // ─── Memory game ─────────────────────────────────────────
  function startMemory() {
    const unlocked = new Set(NikudData.unlockedNikud(state.room));
    const readable = WORDS.filter(w => NikudData.wordNikud(w.word).every(id => unlocked.has(id)));
    const pairs = state.room >= 3 ? 6 : 4;
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
      els.endUnlock.innerHTML = `נפתח חדר חדש בארמון!<br><span class="end-unlock-room">${unlocked.icon} ${unlocked.name}</span>`;
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
    if (!state.roomOverride) Storage.save(GAME_ID, 'room', state.room);
    Storage.save(GAME_ID, 'introSeen', state.introSeen);
  }

  function loadProgress() {
    state.room = Math.min(Storage.load(GAME_ID, 'room', 0), ROOMS.length - 1);
    state.introSeen = Storage.load(GAME_ID, 'introSeen', {});
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
