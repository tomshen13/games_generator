/**
 * Unicorn Numbers — Core Game Logic
 * A state-machine-driven number learning game for ages 4+.
 */
const Game = (() => {
  const GAME_ID = 'unicorn-numbers';

  // State
  let state = {
    screen: 'title',       // title | powerSelect | game | levelComplete | gameComplete
    level: 0,              // current level index
    round: 0,              // current round within level
    target: null,          // number the player needs to find
    options: [],           // numbers displayed as targets
    power: 'fire',         // current power mode
    stars: 0,              // total stars earned
    levelStars: 0,         // stars earned this level
    answered: [],          // numbers already answered correctly in this round
    wrongAttempts: 0,      // wrong attempts this round (for star calculation)
    inputLocked: false,    // prevents rapid tapping
  };

  // DOM references
  let els = {};

  function init() {
    Audio.init();
    cacheDOM();
    loadProgress();
    bindEvents();
    showScreen('title');
  }

  function cacheDOM() {
    els.container = document.querySelector('.game-container');
    els.particleCanvas = document.querySelector('.particle-canvas');
    els.screens = {
      title: document.querySelector('.title-screen'),
      powerSelect: document.querySelector('.power-select-screen'),
      game: document.querySelector('.game-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      gameComplete: document.querySelector('.game-complete-screen'),
    };
    els.playBtn = document.querySelector('.btn-play');
    els.continueBtn = document.querySelector('.btn-continue');
    els.continueWrapper = document.querySelector('.btn-continue-wrapper');
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
    els.gcNumberRainbow = document.querySelector('.number-rainbow');
    els.gcTotalStars = document.querySelector('.total-stars');
    els.langBtns = document.querySelectorAll('.btn-lang');

    Particles.init(els.particleCanvas);
  }

  function bindEvents() {
    // First interaction initializes audio
    document.addEventListener('click', () => Audio.init(), { once: true });

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

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
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
        Storage.clearGame(GAME_ID);
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
    const savedLang = Storage.load(GAME_ID, 'lang', 'en');
    Audio.setLang(savedLang);
    updateLangButtons();

    els.langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.SFX.tap();
        const newLang = Audio.getLang() === 'en' ? 'he' : 'en';
        Audio.setLang(newLang);
        Storage.save(GAME_ID, 'lang', newLang);
        updateLangButtons();
        // Re-render prompt if in game
        if (state.screen === 'game' && state.target != null) {
          renderPrompt(state.target);
          Audio.speakNumber(state.target);
        }
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

  // ===== SCREEN MANAGEMENT =====

  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    Particles.clear();

    if (name === 'title') {
      updateTitleScreen();
    }
  }

  function updateTitleScreen() {
    const savedLevel = Storage.load(GAME_ID, 'level', 0);
    if (savedLevel > 0 && savedLevel < LEVELS.length && els.continueWrapper) {
      els.continueWrapper.style.display = 'flex';
      els.continueWrapper.querySelector('.continue-info').textContent =
        `Level ${savedLevel + 1} of ${LEVELS.length}`;
    } else if (els.continueWrapper) {
      els.continueWrapper.style.display = 'none';
    }
  }

  // ===== GAME FLOW =====

  function startFromBeginning() {
    state.level = 0;
    state.stars = 0;
    showPowerSelectOrStart();
  }

  function continueGame() {
    state.level = Storage.load(GAME_ID, 'level', 0);
    state.stars = Storage.load(GAME_ID, 'stars', 0);
    showPowerSelectOrStart();
  }

  function showPowerSelectOrStart() {
    const levelDef = LEVELS[state.level];
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
    applyPowerTheme();
    showScreen('game');
    updateHUD();

    // Show/hide power toggle (only for 'choice' levels)
    const levelDef = LEVELS[state.level];
    els.powerToggle.style.display = levelDef.power === 'choice' ? 'flex' : 'none';

    startRound();
  }

  async function startRound() {
    const levelDef = LEVELS[state.level];
    state.wrongAttempts = 0;
    state.answered = [];

    // Pick target and distractors
    const target = levelDef.numbers[Utils.randInt(0, levelDef.numbers.length - 1)];
    state.target = target;

    // Build options: target + random distractors
    const distractors = levelDef.numbers.filter(n => n !== target);
    const picked = Utils.pickRandom(distractors, levelDef.targetsPerRound - 1);
    state.options = Utils.shuffle([target, ...picked]);

    renderTargets();
    renderPrompt(target);
    updateHUD();

    // Speak the number
    await Utils.wait(300);
    Audio.speakNumber(target);
  }

  function renderPrompt(number) {
    els.prompt.className = `prompt ${state.power}`;
    if (Audio.getLang() === 'he') {
      els.prompt.innerHTML = `!מצאו את המספר <span class="prompt-number">${number}</span>`;
      els.prompt.dir = 'rtl';
    } else {
      els.prompt.innerHTML = `Find number <span class="prompt-number">${number}</span>!`;
      els.prompt.dir = 'ltr';
    }
  }

  function renderTargets() {
    const levelDef = LEVELS[state.level];
    els.targetGrid.innerHTML = '';

    state.options.forEach((num, i) => {
      const btn = document.createElement('button');
      btn.className = `target-btn ${state.power}`;
      btn.style.animationDelay = `${i * 80}ms`;
      btn.dataset.number = num;

      // Inner content
      let content = `<span class="target-number">${num}</span>`;
      if (levelDef.showDots === true) {
        content += Utils.dotPattern(num);
      } else if (levelDef.showDots === 'hint') {
        content += `<div class="dot-hint">${Utils.dotPattern(num)}</div>`;
      }
      btn.innerHTML = content;

      btn.addEventListener('click', () => handleTargetClick(btn, num));
      els.targetGrid.appendChild(btn);
    });
  }

  async function handleTargetClick(btn, number) {
    if (state.inputLocked) return;
    state.inputLocked = true;

    if (number === state.target) {
      await handleCorrect(btn);
    } else {
      await handleWrong(btn);
    }

    state.inputLocked = false;
  }

  async function handleCorrect(btn) {
    // Visual effect on button
    btn.classList.add('correct');

    // Particle effects based on power
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (state.power === 'fire') {
      Particles.fireBurst(cx, cy, 25);
      Audio.SFX.fire();
    } else if (state.power === 'water') {
      Particles.waterSplash(cx, cy, 25);
      Audio.SFX.water();
    } else {
      Particles.rainbowExplosion(cx, cy);
    }

    Audio.SFX.correct();

    // Star for no mistakes
    if (state.wrongAttempts === 0) {
      state.stars++;
      state.levelStars++;
      Audio.SFX.star();
    }

    updateHUD();

    await Utils.wait(800);
    Particles.sparkle(cx, cy, 15, '#FFD700');
    await Utils.wait(400);

    // Next round or level complete
    state.round++;
    const levelDef = LEVELS[state.level];
    if (state.round >= levelDef.rounds) {
      completedLevel();
    } else {
      startRound();
    }
  }

  async function handleWrong(btn) {
    state.wrongAttempts++;
    btn.classList.add('wrong');
    Audio.SFX.wrong();

    // Gentle wobble
    await Utils.wait(600);
    btn.classList.remove('wrong');

    // Re-speak the number
    Audio.speakNumber(state.target);
  }

  async function completedLevel() {
    saveProgress();

    // Show level complete screen
    const levelDef = LEVELS[state.level];
    els.lcTitle.textContent = levelDef.title;

    // Stars display (up to 3 based on performance)
    const starCount = Math.min(state.levelStars, 3);
    els.lcStars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = i < starCount ? '⭐' : '☆';
      span.style.animationDelay = `${i * 0.3}s`;
      els.lcStars.appendChild(span);
    }

    // Button text
    const isLast = state.level >= LEVELS.length - 1;
    els.lcNextBtn.textContent = isLast ? '🎉 See Results!' : '▶ Next Level!';

    showScreen('levelComplete');
    Audio.SFX.fanfare();
    await Utils.wait(500);
    Particles.confetti(80);

    // Speak congratulations
    await Utils.wait(1000);
    if (Audio.getLang() === 'he') {
      Audio.speak('כל הכבוד!', 0.9, 'he-IL');
    } else {
      Audio.speak('Great job!');
    }
  }

  function advanceLevel() {
    state.level++;
    if (state.level >= LEVELS.length) {
      showGameComplete();
    } else {
      saveProgress();
      showPowerSelectOrStart();
    }
  }

  async function showGameComplete() {
    // Build number rainbow
    els.gcNumberRainbow.innerHTML = '';
    const rainbowColors = [
      '#ff6b6b', '#ff8e53', '#ffd93d', '#6bcf7f', '#4ecdc4',
      '#45b7d1', '#7b68ee', '#c44dff', '#ff6b9d', '#ff9f1c',
      '#ff6b6b', '#ff8e53', '#ffd93d', '#6bcf7f', '#4ecdc4',
      '#45b7d1', '#7b68ee', '#c44dff', '#ff6b9d', '#ff9f1c',
    ];
    for (let i = 1; i <= 20; i++) {
      const item = document.createElement('div');
      item.className = 'number-rainbow-item';
      item.textContent = i;
      item.style.background = rainbowColors[i - 1];
      item.style.animationDelay = `${i * 100}ms`;
      els.gcNumberRainbow.appendChild(item);
    }

    els.gcTotalStars.textContent = `⭐ ${state.stars} Stars Earned!`;

    showScreen('gameComplete');
    Audio.SFX.celebration();
    await Utils.wait(800);
    Particles.confetti(100);
    await Utils.wait(1500);
    Particles.confetti(60);

    if (Audio.getLang() === 'he') {
      Audio.speak('!את קוסמת של מספרים', 0.9, 'he-IL');
    } else {
      Audio.speak('You are a Number Wizard!');
    }

    // Clear saved progress (game is complete)
    Storage.clearGame(GAME_ID);
  }

  // ===== THEME & HUD =====

  function applyPowerTheme() {
    els.container.setAttribute('data-power', state.power);

    // Sparky glow
    els.sparky.className = 'sparky';
    if (state.power === 'fire') els.sparky.classList.add('fire-glow');
    else if (state.power === 'water') els.sparky.classList.add('water-glow');
    else if (state.power === 'rainbow') els.sparky.classList.add('rainbow-glow');

    // Power toggle icon
    if (state.power === 'fire') els.powerToggle.textContent = '🔥';
    else if (state.power === 'water') els.powerToggle.textContent = '💧';
    else els.powerToggle.textContent = '🌈';
  }

  function updateHUD() {
    const levelDef = LEVELS[state.level];
    if (!levelDef) return;
    els.levelLabel.textContent = `Level ${state.level + 1}`;
    els.starCounter.textContent = `⭐ ${state.stars}`;

    // Progress bar
    const progress = state.round / levelDef.rounds;
    els.progressFill.style.width = `${progress * 100}%`;
  }

  // ===== PERSISTENCE =====

  function saveProgress() {
    Storage.save(GAME_ID, 'level', state.level);
    Storage.save(GAME_ID, 'stars', state.stars);
  }

  function loadProgress() {
    // Just check if there's saved progress for the continue button
    const savedLevel = Storage.load(GAME_ID, 'level', 0);
    const savedStars = Storage.load(GAME_ID, 'stars', 0);
    return { level: savedLevel, stars: savedStars };
  }

  return { init };
})();

// Boot the game
document.addEventListener('DOMContentLoaded', Game.init);
