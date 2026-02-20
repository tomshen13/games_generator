/**
 * Space Words — English vocabulary game with progressive hints.
 * See an emoji, pick the correct English word from 4 options.
 * Wrong answers reveal hints: 1st → TTS, 2nd → Hebrew translation, 3rd → auto-reveal.
 */
const SpaceWords = (() => {
  const GAME_ID = 'space-words';
  const ROUNDS_PER_SESSION = 8;
  const TIER_ADVANCE_THRESHOLD = 0.6; // 60% at box >= 2 to unlock next tier
  const PLANET_UNLOCK_THRESHOLD = 0.5; // 50% at box >= 1 to unlock next planet

  // ===== STATE =====
  let state = {
    screen: 'title',
    currentCatId: null,
    currentWord: null,
    options: [],
    round: 0,
    streak: 0,
    sessionCoins: 0,
    sessionNewWords: 0,
    roundsCorrectFirstTry: 0,
    wrongAttemptsThisRound: 0,
    inputLocked: false,
    // Persisted
    categoryTiers: {},
    unlockedCategories: [],
    discovered: {},
  };

  // ===== DOM CACHE =====
  const $ = id => document.getElementById(id);
  let particleCanvas;

  // ===== INIT =====
  function init() {
    Audio.init();
    particleCanvas = document.querySelector('.particle-canvas');
    if (particleCanvas) Particles.init(particleCanvas);

    Adaptive.load(GAME_ID);
    loadProgress();
    bindEvents();
    renderTitleScreen();
  }

  function loadProgress() {
    state.categoryTiers = Storage.load(GAME_ID, 'categoryTiers', {});
    state.unlockedCategories = Storage.load(GAME_ID, 'unlockedCategories', [WORD_CATEGORIES[0].id]);
    state.discovered = Storage.load(GAME_ID, 'discovered', {});
  }

  function saveProgress() {
    Storage.save(GAME_ID, 'categoryTiers', state.categoryTiers);
    Storage.save(GAME_ID, 'unlockedCategories', state.unlockedCategories);
    Storage.save(GAME_ID, 'discovered', state.discovered);
  }

  // ===== SCREEN MANAGEMENT =====
  function showScreen(name) {
    state.screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.querySelector(`.${name}-screen`);
    if (el) el.classList.add('active');
    Particles.clear();
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    $('btnPlay').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('galaxy');
      renderGalaxyMap();
    });

    $('btnDashboard').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('dashboard');
      renderDashboard();
    });

    $('btnGalaxyBack').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('title');
      renderTitleScreen();
    });

    $('btnGameBack').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('galaxy');
      renderGalaxyMap();
    });

    $('btnPlayAgain').addEventListener('click', () => {
      Audio.SFX.tap();
      startSession(state.currentCatId);
    });

    $('btnBackToGalaxy').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('galaxy');
      renderGalaxyMap();
    });

    $('btnDashboardBack').addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('title');
      renderTitleScreen();
    });
  }

  // ===== VOCABULARY COUNTING =====
  function countKnownWords() {
    const records = Adaptive.getRecords();
    let count = 0;
    for (const key in records) {
      if (records[key].box >= 1) count++;
    }
    return count;
  }

  function countCategoryKnown(catId) {
    const cat = getCategoryById(catId);
    if (!cat) return { known: 0, total: 0 };
    const records = Adaptive.getRecords();
    let known = 0;
    const tierCount = state.categoryTiers[catId] || 1;
    const pool = buildCategoryPool(catId, tierCount);
    pool.forEach(wid => {
      const key = adaptiveKey(wid);
      if (records[key] && records[key].box >= 1) known++;
    });
    return { known, total: pool.length };
  }

  // ===== TITLE SCREEN =====
  function renderTitleScreen() {
    $('titleVocabCount').textContent = countKnownWords();
  }

  // ===== GALAXY MAP =====
  function renderGalaxyMap() {
    checkCategoryUnlocks();
    const grid = $('planetGrid');
    grid.innerHTML = '';

    WORD_CATEGORIES.forEach((cat, i) => {
      const unlocked = state.unlockedCategories.includes(cat.id);
      const { known, total } = countCategoryKnown(cat.id);
      const pct = total > 0 ? Math.round((known / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = `card planet-card animate-fade-up${unlocked ? '' : ' locked'}`;
      card.style.animationDelay = `${i * 80}ms`;
      card.style.setProperty('--planet-color', cat.planetColor);

      card.innerHTML = `
        <span class="planet-emoji" style="filter: drop-shadow(0 0 8px ${cat.planetColor})">${cat.emoji}</span>
        <span class="planet-name">${cat.enLabel}</span>
        <span class="planet-progress">${known}/${total}</span>
        <div class="planet-progress-bar">
          <div class="planet-progress-fill" style="width: ${pct}%; background: ${cat.planetColor}"></div>
        </div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          Audio.SFX.tap();
          startSession(cat.id);
        });
      }

      grid.appendChild(card);
    });
  }

  // ===== GAME SESSION =====
  function startSession(catId) {
    state.currentCatId = catId;
    state.round = 0;
    state.streak = 0;
    state.sessionCoins = 0;
    state.sessionNewWords = 0;
    state.roundsCorrectFirstTry = 0;

    showScreen('game');
    $('hudCoins').textContent = `🪙 ${SharedCoins.get()}`;
    nextRound();
  }

  function nextRound() {
    if (state.round >= ROUNDS_PER_SESSION) {
      endSession();
      return;
    }

    state.round++;
    state.wrongAttemptsThisRound = 0;
    state.inputLocked = false;

    const cat = getCategoryById(state.currentCatId);
    const tierCount = state.categoryTiers[state.currentCatId] || 1;
    const pool = buildCategoryPool(state.currentCatId, tierCount).map(adaptiveKey);

    // Filter out mastered words (box 3) so they stop appearing
    const records = Adaptive.getRecords();
    const activePool = pool.filter(key => {
      const rec = records[key];
      return !rec || rec.box < 3;
    });
    // If all words mastered, fall back to full pool (review mode)
    const pickPool = activePool.length > 0 ? activePool : pool;

    // Pick word via adaptive system
    const pickedKey = Adaptive.pickItem(pickPool);
    const wordId = pickedKey.split(':')[1];
    state.currentWord = cat.words.find(w => w.id === wordId);

    // Mark as discovered
    if (!state.discovered[pickedKey]) {
      state.discovered[pickedKey] = true;
      state.sessionNewWords++;
      saveProgress();
    }

    // Pick 3 distractors from same category
    const distractorPool = buildCategoryPool(state.currentCatId, tierCount)
      .filter(wid => wid !== wordId);
    const distractorIds = pickRandom(distractorPool, 3);
    const distractors = distractorIds.map(wid => cat.words.find(w => w.id === wid));

    state.options = shuffleArray([state.currentWord, ...distractors]);

    renderRound();
  }

  function renderRound() {
    $('hudRound').textContent = `${state.round}/${ROUNDS_PER_SESSION}`;
    $('hudStreak').textContent = state.streak > 0 ? `🔥 ${state.streak}` : '';

    // Prompt
    $('promptEmoji').textContent = state.currentWord.emoji;
    $('promptHint').textContent = '';
    $('promptHint').classList.remove('visible');

    // Choices
    const grid = $('choicesGrid');
    grid.innerHTML = '';

    state.options.forEach((word, i) => {
      const btn = document.createElement('button');
      btn.className = 'card choice-btn animate-fade-up';
      btn.style.animationDelay = `${i * 80}ms`;
      btn.textContent = word.en;
      btn.dataset.wordId = word.id;
      btn.addEventListener('click', () => handleChoice(btn, word));
      grid.appendChild(btn);
    });
  }

  function handleChoice(btn, chosenWord) {
    if (state.inputLocked) return;

    const isCorrect = chosenWord.id === state.currentWord.id;

    if (isCorrect) {
      state.inputLocked = true;
      btn.classList.add('correct');

      // Record answer
      const firstTry = state.wrongAttemptsThisRound === 0;
      if (firstTry) {
        Adaptive.recordAnswer(adaptiveKey(state.currentWord.id), true);
        state.roundsCorrectFirstTry++;
        state.streak++;

        // Coins: 1 base + streak bonus
        let earned = 1;
        if (state.streak >= 5) earned = 3;
        else if (state.streak >= 3) earned = 2;
        state.sessionCoins += earned;
        SharedCoins.add(earned);
        $('hudCoins').textContent = `🪙 ${SharedCoins.get()}`;
        Audio.SFX.coin();
      } else {
        // Already recorded wrong on first miss; just mark correct now
        Adaptive.recordAnswer(adaptiveKey(state.currentWord.id), true);
      }

      Audio.SFX.correct();

      // Sparkle at button position
      if (particleCanvas) {
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        Particles.sparkle(x, y, 12, '#4ade80');
      }

      // Speak the word so they learn the pronunciation
      Audio.speak(state.currentWord.en, 0.8, 'en-US');

      setTimeout(() => nextRound(), 1200);
    } else {
      // Wrong answer
      state.wrongAttemptsThisRound++;
      btn.classList.add('wrong');
      Audio.SFX.wrong();

      // Record wrong on first mistake only
      if (state.wrongAttemptsThisRound === 1) {
        Adaptive.recordAnswer(adaptiveKey(state.currentWord.id), false);
        state.streak = 0;
        $('hudStreak').textContent = '';
      }

      // After wobble animation, dim the wrong button
      setTimeout(() => {
        btn.classList.remove('wrong');
        btn.classList.add('dimmed');
      }, 500);

      if (state.wrongAttemptsThisRound === 1) {
        // Hint 1: TTS — speak the correct word
        setTimeout(() => {
          Audio.speak(state.currentWord.en, 0.8, 'en-US');
        }, 600);
      } else if (state.wrongAttemptsThisRound === 2) {
        // Hint 2: Show Hebrew translation
        $('promptHint').textContent = state.currentWord.he;
        $('promptHint').classList.add('visible');
      } else if (state.wrongAttemptsThisRound >= 3) {
        // Hint 3: Auto-reveal correct answer
        state.inputLocked = true;
        const allBtns = $('choicesGrid').querySelectorAll('.choice-btn');
        allBtns.forEach(b => {
          if (b.dataset.wordId === state.currentWord.id) {
            b.classList.add('correct');
          } else {
            b.classList.add('dimmed');
          }
        });
        // Show Hebrew too
        $('promptHint').textContent = state.currentWord.he;
        $('promptHint').classList.add('visible');
        Audio.speak(state.currentWord.en, 0.8, 'en-US');

        setTimeout(() => nextRound(), 2000);
      }
    }
  }

  // ===== SESSION COMPLETE =====
  function endSession() {
    // Check tier advancement
    checkTierAdvancement(state.currentCatId);
    checkCategoryUnlocks();
    saveProgress();

    // Star rating
    const pct = state.roundsCorrectFirstTry / ROUNDS_PER_SESSION;
    let stars = 1;
    if (pct >= 0.8) stars = 3;
    else if (pct >= 0.5) stars = 2;

    // Bonus coins
    const bonusCoins = stars === 3 ? 5 : stars === 2 ? 3 : 1;
    state.sessionCoins += bonusCoins;
    SharedCoins.add(bonusCoins);

    // Energy
    Energy.earnMinutes(2);

    // Show complete screen
    showScreen('session-complete');

    // Title
    const titles = ['Amazing!', 'Great Job!', 'Well Done!', 'Fantastic!', 'Super!'];
    $('completeTitle').textContent = titles[Math.floor(Math.random() * titles.length)];

    // Stars
    const starsEl = $('completeStars');
    starsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.className = 'complete-star';
      if (i < stars) {
        span.textContent = '⭐';
        span.classList.add('earned');
        span.style.animationDelay = `${i * 200}ms`;
      } else {
        span.textContent = '☆';
        span.style.opacity = '0.3';
      }
      starsEl.appendChild(span);
    }

    // Stats
    $('completeNewWords').textContent = state.sessionNewWords > 0
      ? `🆕 ${state.sessionNewWords} new word${state.sessionNewWords > 1 ? 's' : ''} discovered!`
      : '';
    $('completeCoins').textContent = `🪙 +${state.sessionCoins} coins`;
    $('completeEnergy').textContent = '⚡ +2 minutes play time';

    // Celebration effects
    Audio.SFX.fanfare();
    if (particleCanvas) {
      setTimeout(() => Particles.confetti(40), 300);
    }
  }

  // ===== TIER & UNLOCK LOGIC =====
  function checkTierAdvancement(catId) {
    const cat = getCategoryById(catId);
    if (!cat) return;

    const currentTier = state.categoryTiers[catId] || 1;
    const maxTier = getMaxTiers(catId);
    if (currentTier >= maxTier) return;

    // Check if 60% of current tier's words are at box >= 2
    const tierStart = (currentTier - 1) * TIER_SIZE;
    const tierEnd = Math.min(currentTier * TIER_SIZE, cat.words.length);
    const tierWords = cat.words.slice(tierStart, tierEnd);

    let atBox2Plus = 0;
    const records = Adaptive.getRecords();
    for (const w of tierWords) {
      const key = adaptiveKey(w.id);
      if (records[key] && records[key].box >= 2) atBox2Plus++;
    }

    if (tierWords.length > 0 && atBox2Plus / tierWords.length >= TIER_ADVANCE_THRESHOLD) {
      state.categoryTiers[catId] = currentTier + 1;
    }
  }

  function checkCategoryUnlocks() {
    const unlocked = state.unlockedCategories;
    if (!unlocked.includes(WORD_CATEGORIES[0].id)) {
      unlocked.push(WORD_CATEGORIES[0].id);
    }

    for (let i = 1; i < WORD_CATEGORIES.length; i++) {
      const catId = WORD_CATEGORIES[i].id;
      const prevCatId = WORD_CATEGORIES[i - 1].id;

      if (unlocked.includes(catId)) continue;
      if (!unlocked.includes(prevCatId)) continue;

      // Check if previous category has >= 50% at box >= 1
      const prevCat = getCategoryById(prevCatId);
      const prevTier = state.categoryTiers[prevCatId] || 1;
      const prevPool = buildCategoryPool(prevCatId, prevTier);
      const records = Adaptive.getRecords();

      let atBox1Plus = 0;
      for (const wid of prevPool) {
        const key = adaptiveKey(wid);
        if (records[key] && records[key].box >= 1) atBox1Plus++;
      }

      if (prevPool.length > 0 && atBox1Plus / prevPool.length >= PLANET_UNLOCK_THRESHOLD) {
        unlocked.push(catId);
      }
    }

    state.unlockedCategories = unlocked;
    saveProgress();
  }

  // ===== VOCABULARY DASHBOARD =====
  function renderDashboard() {
    $('dashboardVocabCount').textContent = countKnownWords();

    const container = $('dashboardCategories');
    container.innerHTML = '';

    WORD_CATEGORIES.forEach(cat => {
      const { known, total } = countCategoryKnown(cat.id);
      const pct = total > 0 ? Math.round((known / total) * 100) : 0;

      const div = document.createElement('div');
      div.className = 'card dash-category';
      div.innerHTML = `
        <div class="dash-cat-header">
          <span class="dash-cat-emoji">${cat.emoji}</span>
          <span class="dash-cat-name">${cat.enLabel}</span>
          <span class="dash-cat-count">${known}/${total}</span>
        </div>
        <div class="dash-progress-bar">
          <div class="dash-progress-fill" style="width: ${pct}%; background: ${cat.planetColor}"></div>
        </div>
        <div class="dash-words"></div>
      `;

      // Word pills (discovered words only)
      const wordsDiv = div.querySelector('.dash-words');
      const records = Adaptive.getRecords();
      cat.words.forEach(w => {
        const key = adaptiveKey(w.id);
        if (state.discovered[key]) {
          const pill = document.createElement('span');
          pill.className = 'word-pill';
          const isKnown = records[key] && records[key].box >= 1;
          pill.innerHTML = `<span class="word-pill-emoji">${w.emoji}</span> ${w.en}`;
          if (!isKnown) pill.style.opacity = '0.5';
          wordsDiv.appendChild(pill);
        }
      });

      // Toggle expand
      div.addEventListener('click', () => {
        div.classList.toggle('expanded');
      });

      container.appendChild(div);
    });
  }

  // ===== START =====
  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
