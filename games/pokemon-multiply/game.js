/**
 * Pokemon Math — Core Game Logic
 * Auto-tier progression: levels from levels.js become internal tiers.
 * Pool = all items from tier 0..currentTier. Adaptive picks what to drill.
 */
const Game = (() => {
  const GAME_ID = 'pokemon-multiply';
  const SESSION_ROUNDS = 7;

  let state = {
    screen: 'title',
    currentTier: 0,
    round: 0,
    num1: 0,
    num2: 0,
    correctAnswer: 0,
    options: [],
    coins: 0,
    streak: 0,
    sessionCoins: 0,
    sessionStars: 0,
    wrongAttempts: 0,
    roundsCorrectFirstTry: 0,
    inBattle: false,
    manualBattle: false,
    battleOpponent: null,
    battlePlayerHP: 100,
    battleOpponentHP: 100,
    battleMaxOpponentHP: 100,
    ownedPokemon: [],
    starterPokemon: null,
    inputLocked: false,
    previousScreen: 'title',
  };

  let els = {};

  // Active levels (set by operation mode) — used as tier definitions
  let activeLevels = LEVELS;

  // ─── Init ───────────────────────────────────────────────
  function init() {
    Audio.init();
    cacheDOM();

    // Read operation mode from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');

    if (modeParam && OPERATION_MODES[modeParam]) {
      // Curriculum/direct launch — set mode, skip mode select
      state.operationMode = OPERATION_MODES[modeParam];
    } else {
      // Hub launch — default to multiply, will show mode select
      state.operationMode = OPERATION_MODES.multiply;
    }

    activeLevels = LEVELS_BY_MODE[state.operationMode.id] || LEVELS;

    // Update title/subtitle to match mode
    document.querySelector('.title-text').innerHTML = state.operationMode.title;
    document.querySelector('.title-subtitle').textContent = state.operationMode.subtitle;

    // Update operator symbols
    document.querySelector('.problem-op').textContent = state.operationMode.symbol;
    document.querySelector('.battle-op').textContent = state.operationMode.symbol;

    bindEvents();
    loadProgress();
    Adaptive.load('pokemon-multiply');

    if (modeParam && OPERATION_MODES[modeParam]) {
      // Direct launch with mode — go straight to title
      if (state.starterPokemon) updateContinueInfo();
      showScreen('title');
    } else {
      // Hub launch — show mode select (or title if returning player)
      if (state.starterPokemon) {
        updateContinueInfo();
        showScreen('title');
      } else {
        showScreen('modeSelect');
      }
    }
  }

  // ─── DOM Cache ──────────────────────────────────────────
  function cacheDOM() {
    els.container = document.querySelector('.game-container');
    els.particleCanvas = document.querySelector('.particle-canvas');

    els.screens = {
      title: document.querySelector('.title-screen'),
      starter: document.querySelector('.starter-screen'),
      modeSelect: document.querySelector('.mode-select-screen'),
      game: document.querySelector('.game-screen'),
      battle: document.querySelector('.battle-screen'),
      shop: document.querySelector('.shop-screen'),
      collection: document.querySelector('.collection-screen'),
      sessionComplete: document.querySelector('.session-complete-screen'),
      gameComplete: document.querySelector('.game-complete-screen'),
    };

    // Title
    els.btnPlay = document.querySelector('.btn-play');
    els.btnContinue = document.querySelector('.btn-continue');
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');
    els.titleNav = document.querySelector('.title-nav');
    els.btnBattleNav = document.querySelector('.btn-battle-nav');
    els.btnShopNav = document.querySelector('.btn-shop-nav');
    els.btnCollectionNav = document.querySelector('.btn-collection-nav');

    // Game
    els.levelLabel = document.querySelector('.level-label');
    els.progressFill = document.querySelector('.progress-fill');
    els.hudCoinCount = document.querySelector('.hud-coin-count');
    els.hudStreakCount = document.querySelector('.hud-streak-count');
    els.partnerSprite = document.querySelector('.partner-sprite');
    els.partnerBubble = document.querySelector('.partner-bubble');
    els.problemNum1 = document.querySelector('.problem-num1');
    els.problemNum2 = document.querySelector('.problem-num2');
    els.problemAnswer = document.querySelector('.problem-answer');
    els.answerGrid = document.querySelector('.answer-grid');
    els.gameBack = document.querySelector('.game-back');

    // Battle
    els.opponentName = document.querySelector('.opponent-name');
    els.opponentSprite = document.querySelector('.opponent-sprite');
    els.playerBattleSprite = document.querySelector('.player-battle-sprite');
    els.playerPokemonName = document.querySelector('.player-pokemon-name');
    els.opponentHPFill = document.querySelector('.opponent-hp .hp-fill');
    els.playerHPFill = document.querySelector('.player-hp .hp-fill');
    els.opponentHPText = document.querySelector('.opponent-hp-text');
    els.playerHPText = document.querySelector('.player-hp-text');
    els.battleNum1 = document.querySelector('.battle-num1');
    els.battleNum2 = document.querySelector('.battle-num2');
    els.battleAnswers = document.querySelector('.battle-answers');
    els.battleMessage = document.querySelector('.battle-message');
    els.battleMessageText = document.querySelector('.battle-message-text');

    // Shop
    els.shopGrid = document.querySelector('.shop-grid');
    els.shopCoinCount = document.querySelector('.shop-coin-count');
    els.shopBack = document.querySelector('.shop-back');

    // Collection
    els.collectionGrid = document.querySelector('.collection-grid');
    els.collectionCount = document.querySelector('.collection-count');
    els.collectionBack = document.querySelector('.collection-back');

    // Session Complete
    els.lcSprite = document.querySelector('.lc-pokemon-sprite');
    els.lcTitle = document.querySelector('.lc-title');
    els.lcStars = document.querySelectorAll('.lc-star');
    els.lcCoinsEarned = document.querySelector('.lc-coins-earned');
    els.btnPlayAgainSession = document.querySelector('.btn-play-again-session');
    els.btnSessionShop = document.querySelector('.btn-session-shop');
    els.btnSessionCollection = document.querySelector('.btn-session-collection');
    els.btnSessionHome = document.querySelector('.btn-session-home');

    // Game Complete
    els.gcParade = document.querySelector('.gc-pokemon-parade');
    els.gcStats = document.querySelector('.gc-stats');
    els.btnPlayAgain = document.querySelector('.btn-play-again');
    els.btnHome = document.querySelector('.btn-home');

    Particles.init(els.particleCanvas);
  }

  // ─── Events ─────────────────────────────────────────────
  function bindEvents() {
    // Title — Start (new game)
    els.btnPlay.addEventListener('click', () => {
      Audio.SFX.tap();
      if (state.starterPokemon) {
        // Reset for new game but keep starter (shared coins are NOT reset)
        state.currentTier = 0;
        state.ownedPokemon = [state.starterPokemon];
        saveProgress();
        startSession();
      } else {
        showScreen('starter');
      }
    });

    // Title — Continue
    els.btnContinue.addEventListener('click', () => {
      Audio.SFX.tap();
      startSession();
    });

    // Mode select cards
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        Audio.SFX.tap();
        const modeId = card.dataset.mode;
        if (OPERATION_MODES[modeId]) {
          state.operationMode = OPERATION_MODES[modeId];
          activeLevels = LEVELS_BY_MODE[modeId] || LEVELS;
          // Update title/subtitle
          document.querySelector('.title-text').innerHTML = state.operationMode.title;
          document.querySelector('.title-subtitle').textContent = state.operationMode.subtitle;
          document.querySelector('.problem-op').textContent = state.operationMode.symbol;
          document.querySelector('.battle-op').textContent = state.operationMode.symbol;
          // Reload mode-specific progress
          loadProgress();
          if (state.starterPokemon) {
            updateContinueInfo();
          }
          showScreen('title');
        }
      });
    });

    // Starter selection
    document.querySelectorAll('.starter-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.starter);
        selectStarter(id);
      });
    });

    // Title nav buttons (battle, shop, collection)
    els.btnBattleNav.addEventListener('click', () => {
      Audio.SFX.tap();
      startManualBattle();
    });
    els.btnShopNav.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'title';
      showScreen('shop');
    });
    els.btnCollectionNav.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'title';
      showScreen('collection');
    });

    // Game back
    els.gameBack.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('title');
    });

    // Shop/Collection back
    els.shopBack.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen(state.previousScreen);
    });
    els.collectionBack.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen(state.previousScreen);
    });

    // Session complete actions
    els.btnPlayAgainSession.addEventListener('click', () => {
      Audio.SFX.tap();
      startSession();
    });
    els.btnSessionShop.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'sessionComplete';
      showScreen('shop');
    });
    els.btnSessionCollection.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'sessionComplete';
      showScreen('collection');
    });
    els.btnSessionHome.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });

    // Game complete
    els.btnPlayAgain.addEventListener('click', () => {
      Audio.SFX.tap();
      state.currentTier = 0;
      saveProgress();
      startSession();
    });
    els.btnHome.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  // ─── Screen Management ─────────────────────────────────
  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([key, el]) => {
      if (el) el.classList.toggle('active', key === name);
    });
    Particles.clear();

    if (name === 'shop') renderShop();
    if (name === 'collection') renderCollection();
  }

  // ─── Starter Selection ─────────────────────────────────
  function selectStarter(id) {
    const pokemon = POKEMON.starters.find(p => p.id === id);
    if (!pokemon) return;

    state.starterPokemon = id;
    state.ownedPokemon = [id];
    state.currentTier = 0;
    // Shared coins are NOT reset when choosing a new starter

    Audio.SFX.fanfare();
    Audio.speak(`You chose ${pokemon.name}!`);

    // Apply type theme
    els.container.dataset.type = pokemon.type;

    Particles.confetti(60);
    saveProgress();

    setTimeout(() => startSession(), 1200);
  }

  // ─── Build combined pool from tiers 0..currentTier ─────
  function buildCombinedPool() {
    const op = state.operationMode;
    const allKeys = new Set();
    const maxTier = Math.min(state.currentTier, activeLevels.length - 1);
    for (let t = 0; t <= maxTier; t++) {
      const pool = op.buildPool(activeLevels[t]);
      pool.forEach(k => allKeys.add(k));
    }
    return [...allKeys];
  }

  // ─── Start Session ──────────────────────────────────────
  function startSession() {
    state.round = 0;
    state.sessionCoins = 0;
    state.sessionStars = 0;
    state.streak = 0;
    state.roundsCorrectFirstTry = 0;

    // Apply theme from current tier
    const tierDef = activeLevels[Math.min(state.currentTier, activeLevels.length - 1)];
    els.container.dataset.type = tierDef.theme;

    // Set partner sprite
    const partner = getPokemonById(state.starterPokemon);
    els.partnerSprite.src = getPokemonSprite(state.starterPokemon);
    els.partnerSprite.alt = partner ? partner.name : 'Partner';

    // Update HUD
    els.levelLabel.textContent = `${state.operationMode.symbol} Tier ${state.currentTier + 1}`;
    els.hudCoinCount.textContent = state.coins;
    els.hudStreakCount.textContent = '0';
    els.progressFill.style.width = '0%';

    showScreen('game');
    startRound();
  }

  // ─── Round Logic ───────────────────────────────────────
  function startRound() {
    state.wrongAttempts = 0;
    state.inputLocked = false;
    generateProblem();
    renderProblem();
    renderAnswers();
    updateHUD();
  }

  function generateProblem() {
    const op = state.operationMode;
    const pool = buildCombinedPool();
    const key = Adaptive.pickItem(pool);
    const [n1, n2] = op.keyToProblem(key);

    state.num1 = n1;
    state.num2 = n2;
    state.currentKey = key;
    state.correctAnswer = op.compute(n1, n2);
    const distractors = op.generateDistractors(state.correctAnswer, n1, n2);
    state.options = Utils.shuffle([state.correctAnswer, ...distractors]);
  }

  function renderProblem() {
    els.problemNum1.textContent = state.num1;
    els.problemNum2.textContent = state.num2;
    els.problemAnswer.textContent = '?';

    const display = document.querySelector('.problem-display');
    display.style.animation = 'none';
    display.offsetHeight;
    display.style.animation = '';
  }

  function renderAnswers() {
    els.answerGrid.innerHTML = '';
    state.options.forEach((value, i) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = value;
      btn.style.animationDelay = `${i * 80}ms`;
      btn.addEventListener('click', () => handleAnswer(btn, value));
      els.answerGrid.appendChild(btn);
    });
  }

  // ─── Answer Handling ───────────────────────────────────
  async function handleAnswer(btn, value) {
    if (state.inputLocked) return;
    state.inputLocked = true;

    if (value === state.correctAnswer) {
      await handleCorrect(btn);
    } else {
      await handleWrong(btn);
    }
  }

  async function handleCorrect(btn) {
    btn.classList.add('correct');
    els.problemAnswer.textContent = state.correctAnswer;
    Adaptive.recordAnswer(state.currentKey, true);
    Audio.SFX.correct();

    // Coins — use current tier's rate
    const tierDef = activeLevels[Math.min(state.currentTier, activeLevels.length - 1)];
    let earned = tierDef.coinsPerCorrect;
    state.streak++;
    if (state.streak >= 5) earned += 2;
    else if (state.streak >= 3) earned += 1;
    state.coins = SharedCoins.add(earned);
    state.sessionCoins += earned;

    // Stars tracking
    if (state.wrongAttempts === 0) {
      state.roundsCorrectFirstTry++;
      Audio.SFX.star();
    }

    // Particle effects
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    triggerTypeParticles(tierDef.theme, cx, cy);

    // Screen shake
    els.container.classList.add('animate-screen-shake');
    setTimeout(() => els.container.classList.remove('animate-screen-shake'), 400);

    // Partner bounce
    els.partnerSprite.classList.add('animate-bounce');
    setTimeout(() => els.partnerSprite.classList.remove('animate-bounce'), 600);

    // Streak bubble
    if (state.streak >= 3) {
      showPartnerBubble(state.streak >= 5 ? 'AMAZING!' : 'Great!');
    }

    updateHUD();
    await Utils.wait(900);

    state.round++;
    if (state.round >= SESSION_ROUNDS) {
      completeSession();
    } else {
      startRound();
    }
  }

  async function handleWrong(btn) {
    state.wrongAttempts++;
    state.streak = 0;
    Adaptive.recordAnswer(state.currentKey, false);
    btn.classList.add('wrong');
    Audio.SFX.wrong();

    updateHUD();

    setTimeout(() => {
      Audio.speak(`${state.num1} ${state.operationMode.verb} ${state.num2} equals ${state.correctAnswer}`);
    }, 400);

    await Utils.wait(700);
    btn.classList.remove('wrong');
    state.inputLocked = false;
  }

  function showPartnerBubble(text) {
    els.partnerBubble.textContent = text;
    els.partnerBubble.style.display = 'block';
    setTimeout(() => { els.partnerBubble.style.display = 'none'; }, 1200);
  }

  function updateHUD() {
    state.coins = SharedCoins.get();
    els.hudCoinCount.textContent = state.coins;
    els.hudStreakCount.textContent = state.streak;
    const pct = Math.round((state.round / SESSION_ROUNDS) * 100);
    els.progressFill.style.width = pct + '%';
  }

  // ─── Session Complete ───────────────────────────────────
  function completeSession() {
    // Calculate stars
    const ratio = state.roundsCorrectFirstTry / SESSION_ROUNDS;
    const starCount = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;

    // Bonus coins for 3 stars
    const tierDef = activeLevels[Math.min(state.currentTier, activeLevels.length - 1)];
    if (starCount === 3) {
      state.coins = SharedCoins.add(tierDef.bonusCoins);
      state.sessionCoins += tierDef.bonusCoins;
    }

    state.sessionStars = starCount;

    // Check tier advancement
    checkTierAdvancement();
    saveProgress();

    // Earn energy for Mario
    Energy.earnMinutes(5);

    // Find battle encounter for current tier
    const encounterKey = findEncounterTier(state.currentTier);
    if (encounterKey !== null && WILD_ENCOUNTERS[encounterKey]) {
      state.manualBattle = false;
      setTimeout(() => startBattle(encounterKey), 600);
      return;
    }

    showSessionComplete();
  }

  function checkTierAdvancement() {
    if (state.currentTier >= activeLevels.length - 1) return;

    // Check if ≥60% of current tier items are at box ≥ 2
    const op = state.operationMode;
    const tierDef = activeLevels[state.currentTier];
    const tierPool = op.buildPool(tierDef);
    const records = Adaptive.getRecords();

    let atBox2Plus = 0;
    for (const key of tierPool) {
      const rec = records[key];
      if (rec && rec.box >= 2) atBox2Plus++;
    }

    const ratio = tierPool.length > 0 ? atBox2Plus / tierPool.length : 0;
    if (ratio >= 0.6) {
      state.currentTier++;
    }
  }

  function findEncounterTier(currentTier) {
    // Find the highest WILD_ENCOUNTERS key that's ≤ currentTier
    const keys = Object.keys(WILD_ENCOUNTERS).map(Number).sort((a, b) => a - b);
    let best = null;
    for (const k of keys) {
      if (k <= currentTier) best = k;
    }
    return best;
  }

  function showSessionComplete() {
    const partner = getPokemonById(state.starterPokemon);
    els.lcSprite.src = getPokemonSprite(state.starterPokemon);

    els.lcTitle.textContent = 'Session Complete!';

    // Stars
    els.lcStars.forEach((star, i) => {
      star.textContent = i < state.sessionStars ? '★' : '☆';
      star.classList.toggle('earned', i < state.sessionStars);
    });

    els.lcCoinsEarned.textContent = `🪙 +${state.sessionCoins}`;

    showScreen('sessionComplete');

    Audio.SFX.fanfare();
    Particles.confetti(80);
    Audio.speak('Great job!');
  }

  // ─── Game Complete ─────────────────────────────────────
  function showGameComplete() {
    document.querySelector('.gc-subtitle').textContent = state.operationMode.conqueredText;
    showScreen('gameComplete');

    els.gcParade.innerHTML = '';
    state.ownedPokemon.forEach((id, i) => {
      const img = document.createElement('img');
      img.src = getPokemonSprite(id);
      img.className = 'gc-parade-pokemon';
      img.style.animationDelay = `${i * 100}ms`;
      img.alt = '';
      els.gcParade.appendChild(img);
    });

    els.gcStats.textContent = `🪙 ${SharedCoins.get()} Coins  |  ${state.ownedPokemon.length} Pokemon collected`;

    Audio.SFX.celebration();
    setTimeout(() => Particles.confetti(100), 300);
    setTimeout(() => Particles.confetti(60), 1500);
    Audio.speak(state.operationMode.masterSpeech);
  }

  // ─── Battle System ─────────────────────────────────────
  function startManualBattle() {
    const encounterKey = findEncounterTier(state.currentTier);
    if (encounterKey === null) return;
    state.manualBattle = true;
    startBattle(encounterKey);
  }

  function startBattle(encounterKey) {
    const encounters = WILD_ENCOUNTERS[encounterKey];
    const opponent = { ...encounters[Utils.randInt(0, encounters.length - 1)] };

    state.inputLocked = false;
    state.inBattle = true;
    state.battleOpponent = opponent;
    state.battleOpponentHP = opponent.hp;
    state.battleMaxOpponentHP = opponent.hp;
    state.battlePlayerHP = 100;

    els.container.dataset.type = opponent.type;

    els.opponentSprite.src = getPokemonSprite(opponent.id);
    els.opponentName.textContent = `Wild ${opponent.name}`;
    els.playerBattleSprite.src = getPokemonSprite(state.starterPokemon);
    const partner = getPokemonById(state.starterPokemon);
    els.playerPokemonName.textContent = partner ? partner.name : 'Partner';

    updateHPBars();
    els.battleMessage.style.display = 'none';

    showScreen('battle');

    Audio.SFX.whoosh();
    Audio.speak(`A wild ${opponent.name} appeared!`);

    setTimeout(() => generateBattleProblem(), 1500);
  }

  function generateBattleProblem() {
    const op = state.operationMode;
    const pool = buildCombinedPool();
    const key = Adaptive.pickItem(pool);
    const [n1, n2] = op.keyToProblem(key);

    state.num1 = n1;
    state.num2 = n2;
    state.currentKey = key;
    state.correctAnswer = op.compute(n1, n2);
    const distractors = op.generateDistractors(state.correctAnswer, n1, n2);
    state.options = Utils.shuffle([state.correctAnswer, ...distractors]);

    renderBattleProblem();
  }

  function renderBattleProblem() {
    els.battleNum1.textContent = state.num1;
    els.battleNum2.textContent = state.num2;
    els.battleAnswers.innerHTML = '';

    state.options.forEach(value => {
      const btn = document.createElement('button');
      btn.className = 'battle-answer-btn';
      btn.textContent = value;
      btn.addEventListener('click', () => handleBattleAnswer(btn, value));
      els.battleAnswers.appendChild(btn);
    });
  }

  async function handleBattleAnswer(btn, value) {
    if (state.inputLocked) return;
    state.inputLocked = true;

    if (value === state.correctAnswer) {
      btn.classList.add('correct');
      Adaptive.recordAnswer(state.currentKey, true);
      const damage = 20 + Utils.randInt(0, 10);
      state.battleOpponentHP = Math.max(0, state.battleOpponentHP - damage);

      els.playerBattleSprite.classList.add('animate-attack-forward');
      Audio.SFX.correct();

      await Utils.wait(300);

      els.opponentSprite.classList.add('animate-damage');
      const rect = els.opponentSprite.getBoundingClientRect();
      triggerTypeParticles(
        getPokemonById(state.starterPokemon)?.type || 'normal',
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );

      await Utils.wait(400);
      els.playerBattleSprite.classList.remove('animate-attack-forward');
      els.opponentSprite.classList.remove('animate-damage');

      updateHPBars();

      if (state.battleOpponentHP <= 0) {
        await Utils.wait(400);
        await battleWon();
        state.inputLocked = false;
        return;
      }
    } else {
      btn.classList.add('wrong');
      Adaptive.recordAnswer(state.currentKey, false);
      const damage = 10 + Utils.randInt(0, 5);
      state.battlePlayerHP = Math.max(0, state.battlePlayerHP - damage);

      Audio.SFX.wrong();
      els.opponentSprite.classList.add('animate-attack-backward');

      await Utils.wait(300);

      els.playerBattleSprite.classList.add('animate-damage');

      await Utils.wait(400);
      els.opponentSprite.classList.remove('animate-attack-backward');
      els.playerBattleSprite.classList.remove('animate-damage');

      updateHPBars();

      Audio.speak(`${state.num1} ${state.operationMode.verb} ${state.num2} is ${state.correctAnswer}`);

      if (state.battlePlayerHP <= 0) {
        await Utils.wait(400);
        await battleLost();
        state.inputLocked = false;
        return;
      }
    }

    await Utils.wait(600);
    generateBattleProblem();
    state.inputLocked = false;
  }

  function updateHPBars() {
    const oppPct = Math.max(0, (state.battleOpponentHP / state.battleMaxOpponentHP) * 100);
    const playerPct = Math.max(0, state.battlePlayerHP);

    els.opponentHPFill.style.width = oppPct + '%';
    els.playerHPFill.style.width = playerPct + '%';

    els.opponentHPFill.className = 'hp-fill' + (oppPct <= 20 ? ' danger' : oppPct <= 50 ? ' warning' : '');
    els.playerHPFill.className = 'hp-fill' + (playerPct <= 20 ? ' danger' : playerPct <= 50 ? ' warning' : '');

    els.opponentHPText.textContent = `${Math.round(oppPct)}%`;
    els.playerHPText.textContent = `${Math.round(playerPct)}%`;
  }

  async function battleWon() {
    state.inBattle = false;
    const bonusCoins = 10 + (state.currentTier) * 2;
    state.coins = SharedCoins.add(bonusCoins);

    Audio.SFX.fanfare();
    Particles.confetti(60);

    const caught = Math.random() > 0.5;
    if (caught && !state.ownedPokemon.includes(state.battleOpponent.id)) {
      state.ownedPokemon.push(state.battleOpponent.id);
      showBattleMessage(`Gotcha! ${state.battleOpponent.name} was caught!\n🪙 +${bonusCoins} coins!`);
      Audio.speak(`You caught ${state.battleOpponent.name}!`);
    } else {
      showBattleMessage(`You won the battle!\n🪙 +${bonusCoins} coins!`);
      Audio.speak('You won!');
    }

    saveProgress();
    await Utils.wait(3000);
    els.battleMessage.style.display = 'none';
    if (state.manualBattle) {
      state.manualBattle = false;
      showScreen('title');
    } else {
      showSessionComplete();
    }
  }

  async function battleLost() {
    state.inBattle = false;
    showBattleMessage(`${state.battleOpponent.name} got away...\nBut you did great!`);
    Audio.speak('Nice try! Let\'s keep going!');

    await Utils.wait(2500);
    els.battleMessage.style.display = 'none';
    if (state.manualBattle) {
      state.manualBattle = false;
      showScreen('title');
    } else {
      showSessionComplete();
    }
  }

  function showBattleMessage(text) {
    els.battleMessageText.textContent = text;
    els.battleMessage.style.display = 'flex';
  }

  // ─── Shop ──────────────────────────────────────────────
  function renderShop() {
    state.coins = SharedCoins.get();
    els.shopCoinCount.textContent = state.coins;
    els.shopGrid.innerHTML = '';

    const tiers = [
      { label: 'Common Pokemon', items: POKEMON.tier1, unlockTier: 0 },
      { label: 'Uncommon Pokemon', items: POKEMON.tier2, unlockTier: 3 },
      { label: 'Rare Pokemon', items: POKEMON.tier3, unlockTier: 6 },
      { label: 'Legendary Pokemon', items: POKEMON.legendary, unlockTier: 9 },
    ];

    tiers.forEach(tier => {
      if (state.currentTier < tier.unlockTier) return;

      const label = document.createElement('div');
      label.className = 'shop-tier-label';
      label.textContent = tier.label;
      els.shopGrid.appendChild(label);

      tier.items.forEach(pokemon => {
        const owned = state.ownedPokemon.includes(pokemon.id);
        const canAfford = state.coins >= pokemon.price;

        const card = document.createElement('div');
        card.className = 'card shop-card' +
          (owned ? ' owned' : '') +
          (!canAfford && !owned ? ' too-expensive' : '');

        card.innerHTML = `
          <img class="shop-sprite" src="${getPokemonSprite(pokemon.id)}" alt="${pokemon.name}">
          <div class="shop-name">${pokemon.name}</div>
          <span class="shop-type type-${pokemon.type}">${pokemon.type}</span>
          ${owned
            ? '<div class="shop-owned-badge">Owned ✓</div>'
            : `<button class="btn-shop-buy" ${!canAfford ? 'disabled' : ''}>🪙 ${pokemon.price}</button>`
          }
        `;

        if (!owned) {
          const buyBtn = card.querySelector('.btn-shop-buy');
          if (buyBtn && canAfford) {
            buyBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              buyPokemon(pokemon);
            });
          }
        }

        els.shopGrid.appendChild(card);
      });
    });
  }

  function buyPokemon(pokemon) {
    if (state.ownedPokemon.includes(pokemon.id)) return;
    if (!SharedCoins.spend(pokemon.price)) return;

    state.coins = SharedCoins.get();
    state.ownedPokemon.push(pokemon.id);

    Audio.SFX.fanfare();
    const tc = TYPE_COLORS[pokemon.type] || TYPE_COLORS.normal;
    Particles.sparkle(window.innerWidth / 2, window.innerHeight / 2, 25, tc.primary);

    Audio.speak(`You got ${pokemon.name}!`);

    saveProgress();
    renderShop();
  }

  // ─── Collection ────────────────────────────────────────
  function renderCollection() {
    const allPokemon = [...POKEMON.starters, ...ALL_SHOP_POKEMON];
    els.collectionCount.textContent = `${state.ownedPokemon.length} / ${allPokemon.length}`;
    els.collectionGrid.innerHTML = '';

    allPokemon.forEach(pokemon => {
      const owned = state.ownedPokemon.includes(pokemon.id);
      const isPartner = pokemon.id === state.starterPokemon;
      const item = document.createElement('div');
      item.className = 'collection-item' +
        (owned ? ' owned' : ' unowned') +
        (isPartner ? ' partner' : '');

      item.innerHTML = `
        <img class="collection-sprite" src="${getPokemonSprite(pokemon.id)}" alt="${owned ? pokemon.name : '???'}">
        <span class="collection-item-name">${owned ? pokemon.name : '???'}</span>
        ${isPartner ? '<span class="collection-partner-badge">Partner</span>' : ''}
      `;

      if (owned && !isPartner) {
        item.addEventListener('click', () => selectPartner(pokemon));
      }

      els.collectionGrid.appendChild(item);
    });
  }

  function selectPartner(pokemon) {
    state.starterPokemon = pokemon.id;
    saveProgress();

    Audio.SFX.tap();
    Audio.speak(`${pokemon.name}, I choose you!`);

    const tc = TYPE_COLORS[pokemon.type] || TYPE_COLORS.normal;
    Particles.sparkle(window.innerWidth / 2, window.innerHeight / 2, 20, tc.primary);

    renderCollection();
  }

  // ─── Particle Helper ───────────────────────────────────
  function triggerTypeParticles(type, x, y) {
    switch (type) {
      case 'fire':     Particles.fireBurst(x, y, 25); break;
      case 'water':    Particles.waterSplash(x, y, 25); break;
      case 'grass':
        if (Particles.leafStorm) Particles.leafStorm(x, y, 25);
        else Particles.sparkle(x, y, 20, '#78C850');
        break;
      case 'electric':
        if (Particles.electricBolt) Particles.electricBolt(x, y, 25);
        else Particles.sparkle(x, y, 20, '#FFD700');
        break;
      case 'psychic':  Particles.sparkle(x, y, 20, '#FF69B4'); break;
      case 'ghost':    Particles.sparkle(x, y, 20, '#8B5CF6'); break;
      case 'dragon':   Particles.rainbowExplosion(x, y); break;
      default:         Particles.sparkle(x, y, 20, '#FFD700'); break;
    }
  }

  // ─── Persistence ───────────────────────────────────────
  /** Storage key suffix for mode-specific progress (shared coins/pokemon, separate tiers) */
  function modeKey(field) {
    const modeId = state.operationMode ? state.operationMode.id : 'multiply';
    if (modeId === 'multiply') return field; // backward compat: no suffix for multiply
    return `${field}_${modeId}`;
  }

  function saveProgress() {
    // Mode-specific: tier progression
    Storage.save(GAME_ID, modeKey('currentTier'), state.currentTier);
    // Coins managed by SharedCoins — only save pokemon-specific data
    Storage.save(GAME_ID, 'ownedPokemon', state.ownedPokemon);
    Storage.save(GAME_ID, 'starterPokemon', state.starterPokemon);
  }

  function loadProgress() {
    SharedCoins.migrate();
    // Mode-specific — try currentTier first, fall back to old highestLevel for backward compat
    let tier = Storage.load(GAME_ID, modeKey('currentTier'), null);
    if (tier === null) {
      // Backward compat: migrate from old highestLevel
      const oldLevel = Storage.load(GAME_ID, modeKey('highestLevel'), 0);
      tier = oldLevel;
    }
    state.currentTier = tier;
    // Shared coins from unified pool
    state.coins = SharedCoins.get();
    state.ownedPokemon = Storage.load(GAME_ID, 'ownedPokemon', []);
    state.starterPokemon = Storage.load(GAME_ID, 'starterPokemon', null);
  }

  function updateContinueInfo() {
    if (state.starterPokemon) {
      els.btnPlay.textContent = '🔄 NEW GAME';
      els.continueWrapper.style.display = 'flex';
      els.titleNav.style.display = 'flex';
      els.continueInfo.textContent = `Tier ${state.currentTier + 1} • 🪙 ${SharedCoins.get()} coins • ${state.ownedPokemon.length} Pokemon`;
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
