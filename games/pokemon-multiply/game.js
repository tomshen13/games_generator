/**
 * Pokemon Multiply — Core Game Logic
 */
const Game = (() => {
  const GAME_ID = 'pokemon-multiply';

  let state = {
    screen: 'title',
    level: 0,
    highestLevel: 0,
    round: 0,
    num1: 0,
    num2: 0,
    correctAnswer: 0,
    options: [],
    coins: 0,
    streak: 0,
    levelCoins: 0,
    levelStars: 0,
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
    completedLevels: {},
    inputLocked: false,
    previousScreen: 'levelSelect',
  };

  let els = {};

  // ─── Active levels (set by operation mode) ─────────────
  let activeLevels = LEVELS;

  // ─── Init ───────────────────────────────────────────────
  function init() {
    Audio.init();
    cacheDOM();

    // Read operation mode from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    state.operationMode = (modeParam && OPERATION_MODES[modeParam]) || OPERATION_MODES.multiply;
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

    if (state.starterPokemon) {
      updateContinueInfo();
      showScreen('title');
    } else {
      showScreen('title');
    }
  }

  // ─── DOM Cache ──────────────────────────────────────────
  function cacheDOM() {
    els.container = document.querySelector('.game-container');
    els.particleCanvas = document.querySelector('.particle-canvas');

    els.screens = {
      title: document.querySelector('.title-screen'),
      starter: document.querySelector('.starter-screen'),
      levelSelect: document.querySelector('.level-select-screen'),
      game: document.querySelector('.game-screen'),
      battle: document.querySelector('.battle-screen'),
      shop: document.querySelector('.shop-screen'),
      collection: document.querySelector('.collection-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      gameComplete: document.querySelector('.game-complete-screen'),
    };

    // Title
    els.btnPlay = document.querySelector('.btn-play');
    els.btnContinue = document.querySelector('.btn-continue');
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');

    // Level Select
    els.levelMap = document.querySelector('.level-map');
    els.coinCount = document.querySelector('.coin-count');
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

    // Level Complete
    els.lcSprite = document.querySelector('.lc-pokemon-sprite');
    els.lcTitle = document.querySelector('.lc-title');
    els.lcStars = document.querySelectorAll('.lc-star');
    els.lcCoinsEarned = document.querySelector('.lc-coins-earned');
    els.btnNextLevel = document.querySelector('.btn-next-level');

    // Game Complete
    els.gcParade = document.querySelector('.gc-pokemon-parade');
    els.gcStats = document.querySelector('.gc-stats');
    els.btnPlayAgain = document.querySelector('.btn-play-again');
    els.btnHome = document.querySelector('.btn-home');

    Particles.init(els.particleCanvas);
  }

  // ─── Events ─────────────────────────────────────────────
  function bindEvents() {
    // Title
    els.btnPlay.addEventListener('click', () => {
      Audio.SFX.tap();
      if (state.starterPokemon) {
        state.level = 0;
        state.coins = 0;
        state.ownedPokemon = [state.starterPokemon];
        state.completedLevels = {};
        state.highestLevel = 0;
        saveProgress();
        showScreen('levelSelect');
      } else {
        showScreen('starter');
      }
    });

    els.btnContinue.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('levelSelect');
    });

    // Starter selection
    document.querySelectorAll('.starter-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.starter);
        selectStarter(id);
      });
    });

    // Level select
    els.btnBattleNav.addEventListener('click', () => {
      Audio.SFX.tap();
      startManualBattle();
    });
    els.btnShopNav.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'levelSelect';
      showScreen('shop');
    });
    els.btnCollectionNav.addEventListener('click', () => {
      Audio.SFX.tap();
      state.previousScreen = 'levelSelect';
      showScreen('collection');
    });

    // Game back
    els.gameBack.addEventListener('click', () => {
      Audio.SFX.tap();
      showScreen('levelSelect');
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

    // Level complete
    els.btnNextLevel.addEventListener('click', () => {
      Audio.SFX.tap();
      if (state.level >= activeLevels.length) {
        showGameComplete();
      } else {
        showScreen('levelSelect');
      }
    });

    // Game complete
    els.btnPlayAgain.addEventListener('click', () => {
      Audio.SFX.tap();
      state.level = 0;
      state.highestLevel = 0;
      state.completedLevels = {};
      saveProgress();
      showScreen('levelSelect');
    });
    els.btnHome.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  // ─── Screen Management ─────────────────────────────────
  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    Particles.clear();

    if (name === 'levelSelect') renderLevelMap();
    if (name === 'shop') renderShop();
    if (name === 'collection') renderCollection();
  }

  // ─── Starter Selection ─────────────────────────────────
  function selectStarter(id) {
    const pokemon = POKEMON.starters.find(p => p.id === id);
    if (!pokemon) return;

    state.starterPokemon = id;
    state.ownedPokemon = [id];
    state.coins = 0;
    state.level = 0;
    state.highestLevel = 0;
    state.completedLevels = {};

    Audio.SFX.fanfare();
    Audio.speak(`You chose ${pokemon.name}!`);

    // Apply type theme
    els.container.dataset.type = pokemon.type;

    Particles.confetti(60);
    saveProgress();

    setTimeout(() => showScreen('levelSelect'), 1200);
  }

  // ─── Level Map ─────────────────────────────────────────
  function renderLevelMap() {
    els.coinCount.textContent = state.coins;
    els.levelMap.innerHTML = '';

    activeLevels.forEach((level, i) => {
      // Path connector (except first)
      if (i > 0) {
        const path = document.createElement('div');
        path.className = 'level-path' + (i <= state.highestLevel ? ' completed' : '');
        els.levelMap.appendChild(path);
      }

      const node = document.createElement('div');
      const isCompleted = state.completedLevels[i] !== undefined;
      const isCurrent = i === state.highestLevel;
      const isLocked = i > state.highestLevel;

      node.className = 'level-node' +
        (isCompleted && !isCurrent ? ' completed' : '') +
        (isCurrent ? ' current' : '') +
        (isLocked ? ' locked' : '');

      node.innerHTML = `
        <span>${level.id}</span>
        <span class="level-node-label">${level.subtitle}</span>
        ${isCompleted && state.completedLevels[i] ? `<span class="level-node-stars">${'⭐'.repeat(state.completedLevels[i])}</span>` : ''}
      `;

      if (!isLocked) {
        node.addEventListener('click', () => {
          Audio.SFX.tap();
          state.level = i;
          startLevel();
        });
      }

      els.levelMap.appendChild(node);
    });
  }

  // ─── Start Level ───────────────────────────────────────
  function startLevel() {
    const levelDef = activeLevels[state.level];

    state.round = 0;
    state.levelCoins = 0;
    state.levelStars = 0;
    state.streak = 0;
    state.roundsCorrectFirstTry = 0;

    // Apply theme
    els.container.dataset.type = levelDef.theme;

    // Set partner sprite
    const partner = getPokemonById(state.starterPokemon);
    els.partnerSprite.src = getPokemonSprite(state.starterPokemon);
    els.partnerSprite.alt = partner ? partner.name : 'Partner';

    // Update HUD
    els.levelLabel.textContent = levelDef.title;
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
    const levelDef = activeLevels[state.level];
    const pool = op.buildPool(levelDef);
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

    // Bounce-in animation
    const display = document.querySelector('.problem-display');
    display.style.animation = 'none';
    display.offsetHeight; // trigger reflow
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

    // Coins
    const levelDef = activeLevels[state.level];
    let earned = levelDef.coinsPerCorrect;
    state.streak++;
    if (state.streak >= 5) earned += 2;
    else if (state.streak >= 3) earned += 1;
    state.coins += earned;
    state.levelCoins += earned;

    // Stars tracking
    if (state.wrongAttempts === 0) {
      state.roundsCorrectFirstTry++;
      Audio.SFX.star();
    }

    // Particle effects
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    triggerTypeParticles(levelDef.theme, cx, cy);

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
    if (state.round >= levelDef.rounds) {
      completeLevel();
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

    // Show the correct answer briefly in the speech
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
    const levelDef = activeLevels[state.level];
    els.hudCoinCount.textContent = state.coins;
    els.hudStreakCount.textContent = state.streak;
    const pct = Math.round((state.round / levelDef.rounds) * 100);
    els.progressFill.style.width = pct + '%';
  }

  // ─── Level Complete ────────────────────────────────────
  function completeLevel() {
    const levelDef = activeLevels[state.level];

    // Calculate stars
    const ratio = state.roundsCorrectFirstTry / levelDef.rounds;
    const starCount = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;

    // Bonus coins for 3 stars
    if (starCount === 3) {
      state.coins += levelDef.bonusCoins;
      state.levelCoins += levelDef.bonusCoins;
    }

    state.levelStars = starCount;

    // Track completion
    const prev = state.completedLevels[state.level] || 0;
    state.completedLevels[state.level] = Math.max(prev, starCount);

    // Unlock next level
    if (state.level + 1 > state.highestLevel) {
      state.highestLevel = Math.min(state.level + 1, activeLevels.length - 1);
    }

    state.level++;
    saveProgress();

    // Check for battle
    const battleLevel = state.level - 1;
    if (levelDef.battleAfter && WILD_ENCOUNTERS[battleLevel]) {
      state.manualBattle = false;
      setTimeout(() => startBattle(battleLevel), 600);
      return;
    }

    showLevelComplete();
  }

  function showLevelComplete() {
    const partner = getPokemonById(state.starterPokemon);
    els.lcSprite.src = getPokemonSprite(state.starterPokemon);

    els.lcTitle.textContent = state.level >= activeLevels.length ? 'All Routes Complete!' : 'Level Complete!';

    // Stars
    els.lcStars.forEach((star, i) => {
      star.textContent = i < state.levelStars ? '★' : '☆';
      star.classList.toggle('earned', i < state.levelStars);
    });

    els.lcCoinsEarned.textContent = `🪙 +${state.levelCoins}`;

    // Button text
    els.btnNextLevel.textContent = state.level >= activeLevels.length ? '🏆 See Results!' : 'Next Level ⚡';

    showScreen('levelComplete');

    Audio.SFX.fanfare();
    Particles.confetti(80);
    Audio.speak('Great job!');
  }

  // ─── Game Complete ─────────────────────────────────────
  function showGameComplete() {
    document.querySelector('.gc-subtitle').textContent = state.operationMode.conqueredText;
    showScreen('gameComplete');

    // Pokemon parade
    els.gcParade.innerHTML = '';
    state.ownedPokemon.forEach((id, i) => {
      const img = document.createElement('img');
      img.src = getPokemonSprite(id);
      img.className = 'gc-parade-pokemon';
      img.style.animationDelay = `${i * 100}ms`;
      img.alt = '';
      els.gcParade.appendChild(img);
    });

    els.gcStats.textContent = `🪙 ${state.coins} Coins  |  ${state.ownedPokemon.length} Pokemon collected`;

    Audio.SFX.celebration();
    setTimeout(() => Particles.confetti(100), 300);
    setTimeout(() => Particles.confetti(60), 1500);
    Audio.speak(state.operationMode.masterSpeech);
  }

  // ─── Battle System ─────────────────────────────────────
  function startManualBattle() {
    // Pick encounters based on highest completed level
    const encounterKeys = Object.keys(WILD_ENCOUNTERS).map(Number).filter(k => k <= state.highestLevel);
    if (encounterKeys.length === 0) {
      // Fallback to easiest encounters
      encounterKeys.push(0);
    }
    const key = encounterKeys[Utils.randInt(0, encounterKeys.length - 1)];
    state.manualBattle = true;
    startBattle(key);
  }

  function startBattle(levelIndex) {
    const encounters = WILD_ENCOUNTERS[levelIndex];
    const opponent = { ...encounters[Utils.randInt(0, encounters.length - 1)] };

    state.inBattle = true;
    state.battleOpponent = opponent;
    state.battleOpponentHP = opponent.hp;
    state.battleMaxOpponentHP = opponent.hp;
    state.battlePlayerHP = 100;

    // Set theme to opponent type
    els.container.dataset.type = opponent.type;

    // Set sprites
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
    const levelIndex = Math.max(0, state.level - 1);
    const levelDef = activeLevels[Math.min(levelIndex, activeLevels.length - 1)];
    const pool = op.buildPool(levelDef);
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
      // Player attacks!
      btn.classList.add('correct');
      Adaptive.recordAnswer(state.currentKey, true);
      const damage = 20 + Utils.randInt(0, 10);
      state.battleOpponentHP = Math.max(0, state.battleOpponentHP - damage);

      // Attack animation
      els.playerBattleSprite.classList.add('animate-attack-forward');
      Audio.SFX.correct();

      await Utils.wait(300);

      // Hit effect on opponent
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
      // Opponent attacks!
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

      // Speak the correct answer
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

    // Color coding
    els.opponentHPFill.className = 'hp-fill' + (oppPct <= 20 ? ' danger' : oppPct <= 50 ? ' warning' : '');
    els.playerHPFill.className = 'hp-fill' + (playerPct <= 20 ? ' danger' : playerPct <= 50 ? ' warning' : '');

    els.opponentHPText.textContent = `${Math.round(oppPct)}%`;
    els.playerHPText.textContent = `${Math.round(playerPct)}%`;
  }

  async function battleWon() {
    state.inBattle = false;
    const bonusCoins = 10 + (state.level) * 2;
    state.coins += bonusCoins;

    Audio.SFX.fanfare();
    Particles.confetti(60);

    // 50% chance to catch
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
      showScreen('levelSelect');
    } else {
      showLevelComplete();
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
      showScreen('levelSelect');
    } else {
      showLevelComplete();
    }
  }

  function showBattleMessage(text) {
    els.battleMessageText.textContent = text;
    els.battleMessage.style.display = 'flex';
  }

  // ─── Shop ──────────────────────────────────────────────
  function renderShop() {
    els.shopCoinCount.textContent = state.coins;
    els.shopGrid.innerHTML = '';

    const tiers = [
      { label: 'Common Pokemon', items: POKEMON.tier1, unlockLevel: 0 },
      { label: 'Uncommon Pokemon', items: POKEMON.tier2, unlockLevel: 3 },
      { label: 'Rare Pokemon', items: POKEMON.tier3, unlockLevel: 6 },
      { label: 'Legendary Pokemon', items: POKEMON.legendary, unlockLevel: 10 },
    ];

    tiers.forEach(tier => {
      if (state.highestLevel < tier.unlockLevel) return;

      const label = document.createElement('div');
      label.className = 'shop-tier-label';
      label.textContent = tier.label + (tier.unlockLevel > state.highestLevel ? ' 🔒' : '');
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
    if (state.coins < pokemon.price) return;
    if (state.ownedPokemon.includes(pokemon.id)) return;

    state.coins -= pokemon.price;
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
  /** Storage key suffix for mode-specific progress (shared coins/pokemon, separate levels) */
  function modeKey(field) {
    const modeId = state.operationMode ? state.operationMode.id : 'multiply';
    if (modeId === 'multiply') return field; // backward compat: no suffix for multiply
    return `${field}_${modeId}`;
  }

  function saveProgress() {
    // Mode-specific: level progression
    Storage.save(GAME_ID, modeKey('level'), state.level);
    Storage.save(GAME_ID, modeKey('highestLevel'), state.highestLevel);
    Storage.save(GAME_ID, modeKey('completedLevels'), state.completedLevels);
    // Shared across all modes: coins, pokemon
    Storage.save(GAME_ID, 'coins', state.coins);
    Storage.save(GAME_ID, 'ownedPokemon', state.ownedPokemon);
    Storage.save(GAME_ID, 'starterPokemon', state.starterPokemon);
  }

  function loadProgress() {
    // Mode-specific
    state.level = Storage.load(GAME_ID, modeKey('level'), 0);
    state.highestLevel = Storage.load(GAME_ID, modeKey('highestLevel'), 0);
    state.completedLevels = Storage.load(GAME_ID, modeKey('completedLevels'), {});
    // Shared
    state.coins = Storage.load(GAME_ID, 'coins', 0);
    state.ownedPokemon = Storage.load(GAME_ID, 'ownedPokemon', []);
    state.starterPokemon = Storage.load(GAME_ID, 'starterPokemon', null);
  }

  function updateContinueInfo() {
    if (state.starterPokemon) {
      els.btnPlay.textContent = '🔄 NEW GAME';
      els.continueWrapper.style.display = 'flex';
      if (state.highestLevel > 0) {
        els.continueInfo.textContent = `Route ${Math.min(state.highestLevel + 1, activeLevels.length)} • 🪙 ${state.coins} coins • ${state.ownedPokemon.length} Pokemon`;
      } else {
        els.continueInfo.textContent = `🪙 ${state.coins} coins • ${state.ownedPokemon.length} Pokemon`;
      }
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Game.init);
