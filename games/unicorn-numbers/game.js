/**
 * Unicorn Numbers / Letters — Core Game Logic
 * A state-machine-driven learning game for ages 4+.
 * Supports multiple modes (numbers, Hebrew letters, etc.)
 */
const Game = (() => {

  // State
  let state = {
    mode: null,            // current MODES entry
    screen: 'modeSelect',  // modeSelect | title | powerSelect | shop | game | levelComplete | gameComplete
    level: 0,              // current level index
    round: 0,              // current round within level
    target: null,          // item the player needs to find (number for recognition/counting, bigger number for comparison, sum for addition)
    options: [],           // items displayed as targets
    power: 'fire',         // current power mode
    stars: 0,              // total stars earned
    levelStars: 0,         // stars earned this level
    levelCoins: 0,         // coins earned this level
    answered: [],          // items already answered correctly in this round
    wrongAttempts: 0,      // wrong attempts this round (for star calculation)
    inputLocked: false,    // prevents rapid tapping
    problem: null,         // current problem for comparison/addition {a, b, answer} or {bigger, smaller}
    // Shop state (shared across modes)
    coins: 0,
    owned: ['sparky', 'default'],  // default items are owned
    equipped: { character: 'sparky', accessory: null, trail: 'default', theme: 'default' },
    shopTab: 'characters',
    shopFrom: 'modeSelect',       // where to go back to from shop
  };

  function gameId() { return state.mode.storageKey; }

  // DOM references
  let els = {};

  function init() {
    Audio.init();
    cacheDOM();
    loadShopState();
    bindEvents();

    // URL steering: ?mode=counting skips mode select and goes straight to that mode
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (urlMode && MODES[urlMode]) {
      state.mode = MODES[urlMode];
      Adaptive.load(state.mode.storageKey);
      loadProgress();
      showScreen('title');
      return;
    }

    // Load saved mode
    const savedModeId = Storage.load('unicorn-numbers', 'selectedMode', null);
    if (savedModeId && MODES[savedModeId]) {
      state.mode = MODES[savedModeId];
      Adaptive.load(state.mode.storageKey);
      loadProgress();
      showScreen('title');
    } else {
      showScreen('modeSelect');
    }
  }

  function cacheDOM() {
    els.container = document.querySelector('.game-container');
    els.particleCanvas = document.querySelector('.particle-canvas');
    els.screens = {
      modeSelect: document.querySelector('.mode-select-screen'),
      title: document.querySelector('.title-screen'),
      powerSelect: document.querySelector('.power-select-screen'),
      shop: document.querySelector('.shop-screen'),
      game: document.querySelector('.game-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      gameComplete: document.querySelector('.game-complete-screen'),
    };
    els.modeCards = document.querySelectorAll('.mode-card');
    els.modeSelectTitle = document.querySelector('.mode-select-title');
    els.modeSwitchBtn = document.querySelector('.btn-mode-switch');
    els.playBtn = document.querySelector('.btn-play');
    els.continueBtn = document.querySelector('.btn-continue');
    els.continueWrapper = document.querySelector('.btn-continue-wrapper');
    els.titleText = document.querySelector('.title-text');
    els.titleSubtitle = document.querySelector('.title-subtitle');
    els.sparky = document.querySelector('.sparky');
    els.prompt = document.querySelector('.prompt');
    els.targetGrid = document.querySelector('.target-grid');
    els.levelLabel = document.querySelector('.level-label');
    els.starCounter = document.querySelector('.star-counter');
    els.progressFill = document.querySelector('.progress-fill');
    els.powerToggle = document.querySelector('.power-toggle');
    els.lcTitle = document.querySelector('.level-complete-title');
    els.lcStars = document.querySelector('.level-stars');
    els.lcNextBtn = document.querySelector('.btn-next-level');
    els.gcTitle = document.querySelector('.game-complete-title');
    els.gcSubtitle = document.querySelector('.game-complete-subtitle');
    els.gcNumberRainbow = document.querySelector('.number-rainbow');
    els.gcTotalStars = document.querySelector('.total-stars');
    els.langBtns = document.querySelectorAll('.btn-lang');
    els.shopGrid = document.querySelector('.shop-grid');
    els.shopTabs = document.querySelectorAll('.shop-tab');
    els.coinCountMode = document.querySelector('.coin-count-mode');
    els.coinCountHud = document.querySelector('.coin-count-hud');
    els.coinCountShop = document.querySelector('.coin-count-shop');
    els.lcCoinsEarned = document.querySelector('.lc-coins-earned');

    Particles.init(els.particleCanvas);
  }

  function bindEvents() {
    // First interaction initializes audio
    document.addEventListener('click', () => Audio.init(), { once: true });

    // Mode select cards
    els.modeCards.forEach(card => {
      card.addEventListener('click', () => {
        Audio.SFX.tap();
        const modeId = card.dataset.mode;
        state.mode = MODES[modeId];
        Adaptive.load(state.mode.storageKey);
        Storage.save('unicorn-numbers', 'selectedMode', modeId);
        loadProgress();
        showScreen('title');
      });
    });

    // Mode switch button on title screen
    els.modeSwitchBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('modeSelect');
    });

    els.playBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      startFromBeginning();
    });

    if (els.continueBtn) {
      els.continueBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        continueGame();
      });
    }

    // Power select cards
    document.querySelectorAll('.power-card').forEach(card => {
      card.addEventListener('click', () => {
        const power = card.dataset.power;
        Audio.SFX[power]();
        state.power = power;
        startLevel();
      });
    });

    // Power toggle in game HUD
    els.powerToggle.addEventListener('click', () => {
      if (state.power === 'fire') {
        state.power = 'water';
        Audio.SFX.water();
      } else {
        state.power = 'fire';
        Audio.SFX.fire();
      }
      applyPowerTheme();
    });

    // Next level button
    els.lcNextBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      advanceLevel();
    });

    // Back buttons (exclude shop-back which has its own handler)
    document.querySelectorAll('.btn-back:not(.shop-back)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Audio.SFX.tap();
        showScreen('title');
      });
    });

    // Play again from game complete
    const playAgainBtn = document.querySelector('.btn-play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        Storage.clearGame(gameId());
        state.stars = 0;
        state.level = 0;
        startFromBeginning();
      });
    }

    // Home button from game complete
    const homeBtn = document.querySelector('.btn-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        window.location.href = '../../index.html';
      });
    }

    // Language toggle buttons
    const savedLang = Storage.load('unicorn-numbers', 'lang', 'en');
    Audio.setLang(savedLang);
    updateLangButtons();
    updateModeSelectLang();

    els.langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.SFX.tap();
        const newLang = Audio.getLang() === 'en' ? 'he' : 'en';
        Audio.setLang(newLang);
        Storage.save('unicorn-numbers', 'lang', newLang);
        updateLangButtons();
        updateModeSelectLang();
        // Update title screen text if mode is set
        if (state.mode) updateTitleScreen();
        // Re-render prompt if in game
        if (state.screen === 'game' && state.target != null) {
          renderPrompt();
          speakPrompt();
        }
      });
    });

    // Shop buttons
    document.querySelector('.btn-shop-mode').addEventListener('click', () => {
      Audio.SFX.tap();
      state.shopFrom = 'modeSelect';
      showScreen('shop');
    });

    document.querySelector('.btn-shop-lc').addEventListener('click', () => {
      Audio.SFX.tap();
      state.shopFrom = 'levelComplete';
      showScreen('shop');
    });

    // Shop back button
    document.querySelector('.shop-back').addEventListener('click', (e) => {
      e.preventDefault();
      Audio.SFX.tap();
      showScreen(state.shopFrom);
    });

    // Shop tabs
    els.shopTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        Audio.SFX.tap();
        state.shopTab = tab.dataset.tab;
        els.shopTabs.forEach(t => t.classList.toggle('active', t === tab));
        renderShop();
      });
    });
  }

  // ===== LANGUAGE =====

  function updateLangButtons() {
    const isHe = Audio.getLang() === 'he';
    els.langBtns.forEach(btn => {
      btn.textContent = isHe ? 'עב 🇮🇱' : 'EN 🇬🇧';
    });
    // Update the small HUD button to be shorter
    const hudBtn = document.querySelector('.btn-lang-hud');
    if (hudBtn) hudBtn.textContent = isHe ? 'עב' : 'EN';
  }

  function updateModeSelectLang() {
    const lang = Audio.getLang();
    if (els.modeSelectTitle) {
      els.modeSelectTitle.textContent = lang === 'he' ? '?מה רוצים ללמוד' : 'What do you want to learn?';
    }
    els.modeCards.forEach(card => {
      const modeId = card.dataset.mode;
      const mode = MODES[modeId];
      if (mode) {
        card.querySelector('.mode-card-label').textContent = mode.label[lang];
      }
    });
  }

  // ===== SCREEN MANAGEMENT =====

  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    Particles.clear();
    applyCosmetics();
    updateCoinDisplays();

    if (name === 'title') {
      updateTitleScreen();
    }
    if (name === 'modeSelect') {
      updateModeSelectLang();
    }
    if (name === 'shop') {
      renderShop();
    }
  }

  function updateTitleScreen() {
    if (!state.mode) return;
    const lang = Audio.getLang();
    const mode = state.mode;
    const levels = mode.levels;

    // Update title and subtitle
    els.titleText.textContent = mode.titleText[lang];
    els.titleSubtitle.textContent = mode.subtitle[lang];

    // Update mode switch button
    els.modeSwitchBtn.textContent = `${mode.icon} ${mode.label[lang]}`;

    // Continue button
    const savedLevel = Storage.load(gameId(), 'level', 0);
    if (savedLevel > 0 && savedLevel < levels.length && els.continueWrapper) {
      els.continueWrapper.style.display = 'flex';
      els.continueWrapper.querySelector('.continue-info').textContent =
        `Level ${savedLevel + 1} of ${levels.length}`;
    } else if (els.continueWrapper) {
      els.continueWrapper.style.display = 'none';
    }
  }

  // ===== SPEECH =====

  function speakItem(item) {
    if (state.mode.id === 'hebrew-letters') {
      const names = HEBREW_LETTER_NAMES[item];
      if (!names) return Audio.speak(String(item), 0.8);
      // Always speak Hebrew letters in Hebrew — they sound wrong in English TTS
      return Audio.speak(names.he, 0.8, 'he-IL');
    }
    // Default: numbers
    return Audio.speakNumber(item);
  }

  function speakPrompt() {
    const questionType = state.mode.questionType;
    const lang = Audio.getLang();

    if (questionType === 'counting') {
      // "How many dots?"
      if (lang === 'he') {
        Audio.speak('כמה נקודות?', 0.8, 'he-IL');
      } else {
        Audio.speak('How many dots?', 0.8, 'en-US');
      }
    } else if (questionType === 'comparison') {
      // Speak both numbers: "3 or 7, which is bigger?"
      const { bigger, smaller } = state.problem;
      if (lang === 'he') {
        const heNums = Audio.HEBREW_NUMBERS;
        Audio.speak(`${heNums[smaller] || smaller} או ${heNums[bigger] || bigger}, מי גדול יותר?`, 0.8, 'he-IL');
      } else {
        Audio.speak(`${smaller} or ${bigger}, which is bigger?`, 0.8, 'en-US');
      }
    } else if (questionType === 'addition') {
      const { a, b } = state.problem;
      if (lang === 'he') {
        const heNums = Audio.HEBREW_NUMBERS;
        Audio.speak(`כמה זה ${heNums[a] || a} ועוד ${heNums[b] || b}?`, 0.8, 'he-IL');
      } else {
        Audio.speak(`What is ${a} plus ${b}?`, 0.8, 'en-US');
      }
    } else {
      // recognition
      speakItem(state.target);
    }
  }

  // ===== GAME FLOW =====

  function startFromBeginning() {
    state.level = 0;
    state.stars = 0;
    showPowerSelectOrStart();
  }

  function continueGame() {
    state.level = Storage.load(gameId(), 'level', 0);
    state.stars = Storage.load(gameId(), 'stars', 0);
    showPowerSelectOrStart();
  }

  function showPowerSelectOrStart() {
    const levelDef = state.mode.levels[state.level];
    if (levelDef.power === 'choice') {
      showScreen('powerSelect');
    } else {
      state.power = levelDef.power;
      startLevel();
    }
  }

  function startLevel() {
    state.round = 0;
    state.levelStars = 0;
    state.levelCoins = 0;
    applyPowerTheme();
    showScreen('game');
    updateHUD();

    // Show/hide power toggle (only for 'choice' levels)
    const levelDef = state.mode.levels[state.level];
    els.powerToggle.style.display = levelDef.power === 'choice' ? 'flex' : 'none';

    startRound();
  }

  async function startRound() {
    const levelDef = state.mode.levels[state.level];
    const questionType = state.mode.questionType;
    state.wrongAttempts = 0;
    state.answered = [];
    state.problem = null;

    if (questionType === 'comparison') {
      startComparisonRound(levelDef);
    } else if (questionType === 'addition') {
      startAdditionRound(levelDef);
    } else if (questionType === 'counting') {
      startCountingRound(levelDef);
    } else {
      // recognition (numbers, hebrew-letters)
      startRecognitionRound(levelDef);
    }

    renderTargets();
    renderPrompt();
    updateHUD();

    await Utils.wait(300);
    speakPrompt();
  }

  function startRecognitionRound(levelDef) {
    const pool = levelDef.items.map(String);
    const pickedKey = Adaptive.pickItem(pool);
    const target = state.mode.id === 'numbers' ? Number(pickedKey) : pickedKey;
    state.target = target;

    const distractors = levelDef.items.filter(n => n !== target);
    const picked = Utils.pickRandom(distractors, levelDef.targetsPerRound - 1);
    state.options = Utils.shuffle([target, ...picked]);
  }

  function startCountingRound(levelDef) {
    // Pick a number to show as dots, kid taps the number
    const pool = levelDef.items.map(String);
    const pickedKey = Adaptive.pickItem(pool);
    const target = Number(pickedKey);
    state.target = target;
    state.problem = { dotCount: target };

    const distractors = levelDef.items.filter(n => n !== target);
    const picked = Utils.pickRandom(distractors, levelDef.targetsPerRound - 1);
    state.options = Utils.shuffle([target, ...picked]);
  }

  function startComparisonRound(levelDef) {
    // Pick 2 different numbers, kid taps the bigger one
    const pool = levelDef.items;
    const pair = Utils.pickRandom(pool, 2);
    const bigger = Math.max(pair[0], pair[1]);
    const smaller = Math.min(pair[0], pair[1]);
    state.target = bigger;
    state.problem = { bigger, smaller };
    state.options = Utils.shuffle([bigger, smaller]);

    // Adaptive key: "smaller<bigger" (e.g. "3<7")
    Adaptive.getRecord(`${smaller}<${bigger}`);
  }

  function startAdditionRound(levelDef) {
    // Pick an a+b problem, kid taps the sum
    const pool = levelDef.adaptiveKeys; // ["1+1", "1+2", ...]
    const pickedKey = Adaptive.pickItem(pool);
    const [a, b] = pickedKey.split('+').map(Number);
    const sum = a + b;
    state.target = sum;
    state.problem = { a, b, sum, key: pickedKey };

    // Build answer options: correct sum + distractors (nearby numbers)
    const possibleAnswers = levelDef.items.filter(n => n !== sum);
    const distractorCount = (levelDef.targetsPerRound || 4) - 1;
    const picked = Utils.pickRandom(possibleAnswers, distractorCount);
    state.options = Utils.shuffle([sum, ...picked]);
  }

  function renderPrompt() {
    const lang = Audio.getLang();
    const questionType = state.mode.questionType;
    els.prompt.className = `prompt ${state.power}`;

    if (questionType === 'counting') {
      // Show dots + "How many dots?"
      const dotHtml = Utils.dotPattern(state.problem.dotCount);
      const promptText = state.mode.promptText[lang];
      els.prompt.innerHTML = `<div class="counting-dots">${dotHtml}</div><div>${promptText}</div>`;
      els.prompt.dir = lang === 'he' ? 'rtl' : 'ltr';
    } else if (questionType === 'comparison') {
      const promptText = state.mode.promptText[lang];
      els.prompt.innerHTML = `<div>${promptText}</div>`;
      els.prompt.dir = lang === 'he' ? 'rtl' : 'ltr';
    } else if (questionType === 'addition') {
      const { a, b } = state.problem;
      const promptText = state.mode.promptText[lang];
      if (lang === 'he') {
        els.prompt.innerHTML = `?${a} + ${b} = <span class="prompt-number prompt-speaker">🔊</span>`;
        els.prompt.dir = 'rtl';
      } else {
        els.prompt.innerHTML = `<span class="prompt-number prompt-speaker">🔊</span> ${a} + ${b} = ?`;
        els.prompt.dir = 'ltr';
      }
    } else {
      // recognition (numbers, hebrew-letters)
      const promptText = state.mode.promptText[lang];
      if (lang === 'he') {
        els.prompt.innerHTML = `<span class="prompt-number prompt-speaker">🔊</span> ${promptText}`;
        els.prompt.dir = 'rtl';
      } else {
        els.prompt.innerHTML = `${promptText} <span class="prompt-number prompt-speaker">🔊</span>`;
        els.prompt.dir = 'ltr';
      }
    }

    // Tap speaker to hear prompt again
    const speaker = els.prompt.querySelector('.prompt-speaker');
    if (speaker) {
      speaker.addEventListener('click', () => speakPrompt());
    }
  }

  function renderTargets() {
    const levelDef = state.mode.levels[state.level];
    const questionType = state.mode.questionType;
    els.targetGrid.innerHTML = '';

    // Comparison mode: show 2 large buttons
    if (questionType === 'comparison') {
      els.targetGrid.classList.add('comparison-layout');
    } else {
      els.targetGrid.classList.remove('comparison-layout');
    }

    state.options.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.className = `target-btn ${state.power}`;
      if (questionType === 'comparison') btn.classList.add('comparison-btn');
      btn.style.animationDelay = `${i * 80}ms`;
      btn.dataset.item = item;

      // Inner content
      const displayText = state.mode.displayItem(item);
      const isLetter = state.mode.id === 'hebrew-letters';
      const spanClass = isLetter ? 'target-number target-letter' : 'target-number';
      let content = `<span class="${spanClass}">${displayText}</span>`;

      // Show dots on number buttons only in numbers mode
      if (state.mode.supportsDots) {
        if (levelDef.showDots === true) {
          content += Utils.dotPattern(item);
        } else if (levelDef.showDots === 'hint') {
          content += `<div class="dot-hint">${Utils.dotPattern(item)}</div>`;
        }
      }

      // Comparison: show dot patterns under each number for visual help
      if (questionType === 'comparison') {
        content += Utils.dotPattern(item);
      }

      btn.innerHTML = content;
      btn.addEventListener('click', () => handleTargetClick(btn, item));
      els.targetGrid.appendChild(btn);
    });
  }

  async function handleTargetClick(btn, item) {
    if (state.inputLocked) return;
    state.inputLocked = true;

    if (item === state.target) {
      await handleCorrect(btn);
    } else {
      await handleWrong(btn);
    }

    state.inputLocked = false;
  }

  function getAdaptiveKey() {
    const questionType = state.mode.questionType;
    if (questionType === 'comparison') {
      return `${state.problem.smaller}<${state.problem.bigger}`;
    }
    if (questionType === 'addition') {
      return state.problem.key;
    }
    // recognition, counting
    return String(state.target);
  }

  async function handleCorrect(btn) {
    Adaptive.recordAnswer(getAdaptiveKey(), true);
    // Visual effect on button
    btn.classList.add('correct');

    // Earn coin
    state.coins++;
    state.levelCoins++;
    saveShopState();
    updateCoinDisplays();

    // Particle effects based on power + trail
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    playTrailEffect(cx, cy);

    // Screen shake on correct answer
    els.container.classList.add('animate-screen-shake');
    setTimeout(() => els.container.classList.remove('animate-screen-shake'), 400);

    Audio.SFX.correct();

    // Star for no mistakes
    if (state.wrongAttempts === 0) {
      state.stars++;
      state.levelStars++;
      Audio.SFX.star();
    }

    updateHUD();

    await Utils.wait(800);
    Particles.sparkle(cx, cy, 25, '#FFD700');
    await Utils.wait(400);

    // Next round or level complete
    state.round++;
    const levelDef = state.mode.levels[state.level];
    if (state.round >= levelDef.rounds) {
      completedLevel();
    } else {
      startRound();
    }
  }

  async function handleWrong(btn) {
    state.wrongAttempts++;
    Adaptive.recordAnswer(getAdaptiveKey(), false);
    btn.classList.add('wrong');
    Audio.SFX.wrong();

    // Gentle wobble
    await Utils.wait(600);
    btn.classList.remove('wrong');

    // Re-speak the prompt
    speakPrompt();
  }

  async function completedLevel() {
    // Bonus coins for perfect level
    const starCount = Math.min(state.levelStars, 3);
    if (starCount >= 3) {
      state.coins += 3;
      state.levelCoins += 3;
    }
    saveShopState();
    saveProgress();

    // Show level complete screen
    const levelDef = state.mode.levels[state.level];
    els.lcTitle.textContent = levelDef.title;

    // Stars display (up to 3 based on performance)
    els.lcStars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = i < starCount ? '⭐' : '☆';
      span.style.animationDelay = `${i * 0.3}s`;
      els.lcStars.appendChild(span);
    }

    // Show coins earned
    els.lcCoinsEarned.textContent = `🪙 +${state.levelCoins}`;

    // Button text
    const levels = state.mode.levels;
    const isLast = state.level >= levels.length - 1;
    els.lcNextBtn.textContent = isLast ? '🎉 See Results!' : '▶ Next Level!';

    showScreen('levelComplete');
    Audio.SFX.fanfare();
    await Utils.wait(500);
    Particles.confetti(80);

    // Speak congratulations
    const lang = Audio.getLang();
    const congratsText = state.mode.congratsSpeech[lang];
    await Utils.wait(1000);
    if (lang === 'he') {
      Audio.speak(congratsText, 0.9, 'he-IL');
    } else {
      Audio.speak(congratsText);
    }
  }

  function advanceLevel() {
    state.level++;
    const levels = state.mode.levels;
    if (state.level >= levels.length) {
      showGameComplete();
    } else {
      saveProgress();
      showPowerSelectOrStart();
    }
  }

  async function showGameComplete() {
    const lang = Audio.getLang();
    const mode = state.mode;

    // Set localized text
    els.gcTitle.textContent = mode.completeTitle[lang];
    els.gcSubtitle.textContent = mode.completeSubtitle[lang];

    // Build item rainbow
    els.gcNumberRainbow.innerHTML = '';
    const rainbowColors = [
      '#ff6b6b', '#ff8e53', '#ffd93d', '#6bcf7f', '#4ecdc4',
      '#45b7d1', '#7b68ee', '#c44dff', '#ff6b9d', '#ff9f1c',
    ];
    const allItems = mode.allItems;
    allItems.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'number-rainbow-item';
      el.textContent = mode.displayItem(item);
      el.style.background = rainbowColors[idx % rainbowColors.length];
      el.style.animationDelay = `${(idx + 1) * 100}ms`;
      els.gcNumberRainbow.appendChild(el);
    });

    els.gcTotalStars.textContent = `⭐ ${state.stars} Stars Earned!`;

    showScreen('gameComplete');
    Audio.SFX.celebration();
    await Utils.wait(800);
    Particles.confetti(100);
    await Utils.wait(1500);
    Particles.confetti(60);

    if (lang === 'he') {
      Audio.speak(mode.completeSpeech.he, 0.9, 'he-IL');
    } else {
      Audio.speak(mode.completeSpeech.en);
    }

    // Clear saved progress (game is complete)
    Storage.clearGame(gameId());
  }

  // ===== THEME & HUD =====

  function applyPowerTheme() {
    els.container.setAttribute('data-power', state.power);

    // Sparky glow — preserve unicorn-wrap class
    const hadWrap = els.sparky.classList.contains('unicorn-wrap');
    els.sparky.className = 'sparky';
    if (hadWrap) els.sparky.classList.add('unicorn-wrap');
    if (state.power === 'fire') els.sparky.classList.add('fire-glow');
    else if (state.power === 'water') els.sparky.classList.add('water-glow');
    else if (state.power === 'rainbow') els.sparky.classList.add('rainbow-glow');

    // Power toggle icon
    if (state.power === 'fire') els.powerToggle.textContent = '🔥';
    else if (state.power === 'water') els.powerToggle.textContent = '💧';
    else els.powerToggle.textContent = '🌈';
  }

  function updateHUD() {
    const levelDef = state.mode.levels[state.level];
    if (!levelDef) return;
    els.levelLabel.textContent = `Level ${state.level + 1}`;
    els.starCounter.textContent = `⭐ ${state.stars}`;

    // Progress bar
    const progress = state.round / levelDef.rounds;
    els.progressFill.style.width = `${progress * 100}%`;
  }

  // ===== PERSISTENCE =====

  function saveProgress() {
    Storage.save(gameId(), 'level', state.level);
    Storage.save(gameId(), 'stars', state.stars);
  }

  function loadProgress() {
    // Just check if there's saved progress for the continue button
    const savedLevel = Storage.load(gameId(), 'level', 0);
    const savedStars = Storage.load(gameId(), 'stars', 0);
    return { level: savedLevel, stars: savedStars };
  }

  // ===== SHOP STATE =====

  function loadShopState() {
    state.coins = Storage.load('unicorn-numbers', 'coins', 0);
    state.owned = Storage.load('unicorn-numbers', 'shopOwned', ['sparky', 'default']);
    state.equipped = Storage.load('unicorn-numbers', 'shopEquipped', {
      character: 'sparky', accessory: null, trail: 'default', theme: 'default',
    });
    // Ensure defaults are always owned
    if (!state.owned.includes('sparky')) state.owned.push('sparky');
    if (!state.owned.includes('default')) state.owned.push('default');
  }

  function saveShopState() {
    Storage.save('unicorn-numbers', 'coins', state.coins);
    Storage.save('unicorn-numbers', 'shopOwned', state.owned);
    Storage.save('unicorn-numbers', 'shopEquipped', state.equipped);
  }

  function updateCoinDisplays() {
    const txt = String(state.coins);
    if (els.coinCountMode) els.coinCountMode.textContent = txt;
    if (els.coinCountHud) els.coinCountHud.textContent = txt;
    if (els.coinCountShop) els.coinCountShop.textContent = txt;
  }

  // ===== SHOP =====

  function renderShop() {
    const cat = state.shopTab;
    const items = SHOP_ITEMS[cat];
    if (!items || !els.shopGrid) return;

    updateCoinDisplays();
    els.shopGrid.innerHTML = '';

    items.forEach(item => {
      const isOwned = state.owned.includes(item.id);
      const isEquipped = getEquippedId(cat) === item.id;
      const canAfford = state.coins >= item.price;

      const card = document.createElement('div');
      card.className = 'shop-card';
      if (isEquipped) card.classList.add('equipped');
      else if (isOwned) card.classList.add('owned');
      else if (!canAfford) card.classList.add('locked');

      let statusText;
      if (isEquipped) statusText = '✓ Equipped';
      else if (isOwned) statusText = 'Tap to equip';
      else if (item.price === 0) statusText = 'Free';
      else statusText = `🪙 ${item.price}`;

      card.innerHTML = `
        <span class="shop-card-emoji">${item.emoji}</span>
        <span class="shop-card-name">${item.name}</span>
        <span class="shop-card-status">${statusText}</span>
      `;

      card.addEventListener('click', () => handleShopCardClick(item, cat));
      els.shopGrid.appendChild(card);
    });
  }

  function getEquippedId(category) {
    if (category === 'characters') return state.equipped.character;
    if (category === 'accessories') return state.equipped.accessory;
    if (category === 'trails') return state.equipped.trail;
    if (category === 'themes') return state.equipped.theme;
    return null;
  }

  function handleShopCardClick(item, category) {
    const isOwned = state.owned.includes(item.id);
    const isEquipped = getEquippedId(category) === item.id;

    if (isEquipped) {
      // Already equipped — for accessories, unequip
      if (category === 'accessories') {
        Audio.SFX.tap();
        state.equipped.accessory = null;
        saveShopState();
        applyCosmetics();
        renderShop();
      }
      return;
    }

    if (isOwned || item.price === 0) {
      // Equip it
      Audio.SFX.tap();
      equipItem(item, category);
      return;
    }

    // Try to buy
    if (state.coins >= item.price) {
      Audio.SFX.correct();
      state.coins -= item.price;
      state.owned.push(item.id);
      equipItem(item, category);
    } else {
      Audio.SFX.wrong();
    }
  }

  function equipItem(item, category) {
    if (category === 'characters') state.equipped.character = item.id;
    else if (category === 'accessories') state.equipped.accessory = item.id;
    else if (category === 'trails') state.equipped.trail = item.id;
    else if (category === 'themes') state.equipped.theme = item.id;
    saveShopState();
    applyCosmetics();
    renderShop();
  }

  // ===== COSMETICS =====

  function applyCosmetics() {
    // Character emoji
    const charItem = SHOP_LOOKUP[state.equipped.character];
    const charEmoji = charItem ? charItem.emoji : '🦄';
    document.querySelectorAll('.title-unicorn, .sparky, .level-complete-unicorn').forEach(el => {
      // Wrap in unicorn-wrap for accessory positioning
      if (!el.querySelector('.unicorn-char')) {
        el.textContent = '';
        const span = document.createElement('span');
        span.className = 'unicorn-char';
        el.appendChild(span);
      }
      const charSpan = el.querySelector('.unicorn-char');
      charSpan.textContent = charEmoji;

      // Accessory overlay
      let accSpan = el.querySelector('.accessory-overlay');
      if (state.equipped.accessory) {
        const accItem = SHOP_LOOKUP[state.equipped.accessory];
        if (accItem) {
          if (!accSpan) {
            accSpan = document.createElement('span');
            accSpan.className = 'accessory-overlay';
            el.appendChild(accSpan);
          }
          accSpan.textContent = accItem.emoji;
          el.classList.add('unicorn-wrap');
        }
      } else if (accSpan) {
        accSpan.remove();
        el.classList.remove('unicorn-wrap');
      }
    });

    // Theme
    const themeId = state.equipped.theme || 'default';
    if (themeId === 'default') {
      els.container.removeAttribute('data-theme');
    } else {
      els.container.setAttribute('data-theme', themeId);
    }
  }

  function playTrailEffect(cx, cy) {
    const trail = state.equipped.trail || 'default';

    if (trail === 'hearts') {
      Particles.confetti(25);
      Audio.SFX.correct();
    } else if (trail === 'stars') {
      Particles.sparkle(cx, cy, 40, '#FFD700');
      Audio.SFX.star();
    } else if (trail === 'bolt') {
      Particles.electricBolt(cx, cy);
      Audio.SFX.fire();
    } else if (trail === 'leaves') {
      Particles.leafStorm(cx, cy);
      Audio.SFX.water();
    } else {
      // Default: power-based
      if (state.power === 'fire') {
        Particles.fireBurst(cx, cy, 35);
        Audio.SFX.fire();
      } else if (state.power === 'water') {
        Particles.waterSplash(cx, cy, 35);
        Audio.SFX.water();
      } else {
        Particles.rainbowExplosion(cx, cy);
      }
    }
  }

  return { init };
})();

// Boot the game
document.addEventListener('DOMContentLoaded', Game.init);
