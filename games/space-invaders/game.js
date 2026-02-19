/**
 * Space Invaders — Game orchestrator.
 * State machine, screen flow, HUD, shop, collision system, co-op, wave management.
 * Uses SharedCoins (cross-game currency) and Energy (daily time-gating).
 */
const Game = (() => {
  const GAME_ID = 'space-invaders';
  const WORLDS = [
    { name: 'Asteroid Belt', icon: '☄️' },
    { name: 'Nebula Assault', icon: '🌌' },
    { name: 'Dark Frontier', icon: '🔮' },
    { name: 'Crystal Nebula', icon: '💎' },
    { name: 'Mothership', icon: '👾' },
  ];
  const LEVELS_PER_WORLD = 4;

  const LEVEL_ICONS = [
    '☄️', '🌑', '🪨', '💥',
    '🌌', '🌀', '💫', '⚡',
    '🔮', '👁️', '🌑', '💀',
    '💎', '❄️', '🔷', '🏰',
    '👾', '🔥', '⚠️', '👑',
  ];

  let state = {
    screen: 'title',
    mode: '1p',
    shipType: 'falcon',
    shipType2: 'falcon',
    shipSelectPhase: 0, // 0 = P1 picking, 1 = P2 picking
    currentLevel: 0,
    players: [],
    enemies: [],
    minis: [],
    playerBullets: [],
    enemyBullets: [],
    crystals: [],
    explosions: [],
    scorePopups: [],
    boss: null,
    bossActive: false,
    waveIndex: 0,
    waveEnemiesLeft: 0,
    waveDelay: 0,
    allWavesSpawned: false,
    levelTimer: 0,
    paused: false,
    coop: false,
    autoRepairTimer: 0,
  };

  let els = {};

  // Persists between levels (no more crystals — coins are in SharedCoins)
  let persistent = { score: 0, lives: 3, upgrades: [] };

  function resetPersistent() {
    persistent = { score: 0, lives: 3, upgrades: [] };
  }

  // Processed level data (coordinates resolved to actual pixels)
  let currentLevelData = null;

  // ===== AUDIO SFX (own AudioContext to avoid modifying shared audio.js) =====

  let sfxCtx = null;

  function ensureSfxCtx() {
    if (!sfxCtx) {
      try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (sfxCtx && sfxCtx.state === 'suspended') sfxCtx.resume();
    return sfxCtx;
  }

  function playTone(freq, duration, type, volume) {
    const ctx = ensureSfxCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume || 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function sfxShoot() {
    playTone(1200, 0.06, 'square', 0.08);
    playTone(800, 0.04, 'square', 0.06);
  }

  function sfxHit() {
    playTone(200, 0.08, 'triangle', 0.12);
  }

  function sfxExplode() {
    playTone(400, 0.15, 'sawtooth', 0.1);
    playTone(100, 0.2, 'square', 0.06);
  }

  function sfxDamage() {
    playTone(300, 0.08, 'square', 0.1);
    setTimeout(() => playTone(200, 0.12, 'square', 0.08), 80);
  }

  function sfxCrystal() {
    playTone(1047, 0.05, 'sine', 0.08);
    setTimeout(() => playTone(1319, 0.05, 'sine', 0.08), 50);
    setTimeout(() => playTone(1568, 0.1, 'sine', 0.08), 100);
  }

  function sfxBossWarning() {
    playTone(80, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(75, 0.3, 'sawtooth', 0.12), 300);
    setTimeout(() => playTone(70, 0.4, 'sawtooth', 0.1), 600);
  }

  function sfxBomb() {
    playTone(200, 0.4, 'sine', 0.15);
    setTimeout(() => playTone(600, 0.3, 'sine', 0.12), 100);
    setTimeout(() => playTone(1200, 0.2, 'sine', 0.1), 200);
  }

  // ===== INIT =====

  function init() {
    Audio.init();
    cacheDOM();
    Engine.Input.init();
    Engine.initCanvas(els.gameCanvas);
    Particles.init(els.particleCanvas);
    bindEvents();
    renderShipPreviews();

    // Migrate per-game crystals to shared coins (one-time)
    SharedCoins.migrate();

    // Continue button
    const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    if (unlocked > 0) {
      els.continueWrapper.style.display = 'flex';
      els.continueInfo.textContent = `${unlocked + 1} of ${LEVELS.ALL.length} levels unlocked`;
    }

    updateStatusBars();

    // Check energy — show gate if depleted
    if (typeof Energy !== 'undefined' && Energy.getRemaining() <= 0) {
      showScreen('energyGate');
    } else {
      showScreen('title');
    }
  }

  function cacheDOM() {
    els.gameCanvas = document.getElementById('gameCanvas');
    els.particleCanvas = document.querySelector('.particle-canvas');
    els.hud = document.querySelector('.game-hud');
    els.screens = {
      title: document.querySelector('.title-screen'),
      shipSelect: document.querySelector('.ship-select-screen'),
      levelSelect: document.querySelector('.level-select-screen'),
      shop: document.querySelector('.shop-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      gameOver: document.querySelector('.game-over-screen'),
      victory: document.querySelector('.victory-screen'),
      energyGate: document.querySelector('.energy-gate-screen'),
    };
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');
    els.shopCoinCount = document.querySelector('.shop-coin-count');
    els.shopItems = document.querySelector('.shop-items');
    els.shopInvIcons = document.querySelector('.shop-inv-icons');
    els.lsLevels = document.querySelector('.ls-levels');
    els.hudHp = document.querySelector('.hud-hp');
    els.hudLives = document.querySelector('.hud-lives');
    els.hudLevel = document.querySelector('.hud-level');
    els.hudWave = document.querySelector('.hud-wave');
    els.hudScore = document.querySelector('.hud-score');
    els.hudCoins = document.querySelector('.hud-coins');
    els.hudWeapon = document.querySelector('.hud-weapon');
    els.hudBomb = document.querySelector('.hud-bomb');
    els.hudEnergy = document.querySelector('.hud-energy');
    els.hudBossBar = document.querySelector('.hud-boss-bar');
    els.hudBossHp = document.querySelector('.hud-boss-hp');
    els.hudBossName = document.querySelector('.hud-boss-name');
    els.hudP2 = document.querySelector('.hud-p2');
    els.hudP2Hp = document.querySelector('.hud-p2-hp');
    els.hudP2Lives = document.querySelector('.hud-p2-lives');
    els.lcTitle = document.querySelector('.lc-title');
    els.lcStats = document.querySelector('.lc-stats');
    els.goScore = document.querySelector('.go-score');
    els.vicStats = document.querySelector('.victory-stats');
    els.energyOverlay = document.querySelector('.energy-depleted-overlay');
    els.statusTimes = document.querySelectorAll('.energy-status-time');
    els.statusCoins = document.querySelectorAll('.energy-status-coins');
  }

  function bindEvents() {
    document.addEventListener('click', () => Audio.init(), { once: true });
    document.addEventListener('keydown', () => Audio.init(), { once: true });

    // 1P → ship select
    document.querySelector('.btn-1p').addEventListener('click', () => {
      Audio.SFX.tap();
      state.mode = '1p';
      state.coop = false;
      state.shipSelectPhase = 0;
      updateShipSelectTitle();
      showScreen('shipSelect');
    });

    // 2P → ship select for both players
    document.querySelector('.btn-2p').addEventListener('click', () => {
      Audio.SFX.tap();
      state.mode = '2p';
      state.coop = true;
      resetPersistent();
      state.shipSelectPhase = 0;
      updateShipSelectTitle();
      showScreen('shipSelect');
    });

    // Continue → level select
    const contBtn = document.querySelector('.btn-continue');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        state.shipType = Storage.load(GAME_ID, 'shipType', 'falcon');
        persistent = Storage.load(GAME_ID, 'persistent', { score: 0, lives: 3, upgrades: [] });
        state.mode = '1p';
        state.coop = false;
        showLevelSelect();
      });
    }

    // Back buttons → title
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Audio.SFX.tap();
        showScreen('title');
      });
    });

    // Ship selection cards
    document.querySelectorAll('.ship-card').forEach(card => {
      card.addEventListener('click', () => {
        Audio.SFX.tap();
        if (state.coop && state.shipSelectPhase === 0) {
          // P1 picked — now let P2 pick
          state.shipType = card.dataset.ship;
          state.shipSelectPhase = 1;
          updateShipSelectTitle();
        } else if (state.coop && state.shipSelectPhase === 1) {
          // P2 picked — go to level select
          state.shipType2 = card.dataset.ship;
          showLevelSelect();
        } else {
          // 1P mode
          state.shipType = card.dataset.ship;
          resetPersistent();
          showLevelSelect();
        }
      });
    });

    // Shop start level button
    document.querySelector('.btn-start-level').addEventListener('click', () => {
      Audio.SFX.tap();
      startLevel(state.currentLevel);
    });

    // Level complete → shop for next level
    document.querySelector('.btn-next-level').addEventListener('click', () => {
      Audio.SFX.tap();
      showShop(state.currentLevel + 1);
    });

    // Game over → retry
    document.querySelector('.btn-retry').addEventListener('click', () => {
      Audio.SFX.tap();
      persistent.lives = 3;
      showShop(state.currentLevel);
    });

    // Game over → levels
    const goLevelsBtn = document.querySelector('.btn-go-levels');
    if (goLevelsBtn) {
      goLevelsBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        persistent.lives = 3;
        showLevelSelect();
      });
    }

    // Home buttons
    document.querySelectorAll('.btn-home').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.SFX.tap();
        window.location.href = '../../index.html';
      });
    });

    // Victory → play again (clear progress)
    document.querySelector('.btn-play-again').addEventListener('click', () => {
      Audio.SFX.tap();
      Storage.clearGame(GAME_ID);
      els.continueWrapper.style.display = 'none';
      showScreen('title');
    });

    // Energy gate buttons
    const energyEduBtn = document.querySelector('.btn-energy-edu');
    if (energyEduBtn) energyEduBtn.addEventListener('click', () => { window.location.href = '../../index.html'; });
    const energyPinBtn = document.querySelector('.btn-energy-pin');
    if (energyPinBtn) energyPinBtn.addEventListener('click', async () => {
      const ok = await Energy.parentBypass();
      if (ok) {
        updateStatusBars();
        showScreen('title');
      }
    });
    const energyHomeBtn = document.querySelector('.btn-energy-home');
    if (energyHomeBtn) energyHomeBtn.addEventListener('click', () => { window.location.href = '../../index.html'; });

    // Energy depleted overlay buttons
    const depEduBtn = document.querySelector('.btn-depleted-edu');
    if (depEduBtn) depEduBtn.addEventListener('click', () => { window.location.href = '../../index.html'; });
    const depPinBtn = document.querySelector('.btn-depleted-pin');
    if (depPinBtn) depPinBtn.addEventListener('click', async () => {
      const ok = await Energy.parentBypass();
      if (ok) {
        els.energyOverlay.style.display = 'none';
        state.paused = false;
        Engine.startLoop(update, render);
      }
    });
    const depHomeBtn = document.querySelector('.btn-depleted-home');
    if (depHomeBtn) depHomeBtn.addEventListener('click', () => { window.location.href = '../../index.html'; });

    // Pause
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape' && state.screen === 'playing') {
        state.paused = !state.paused;
      }
    });
  }

  function updateShipSelectTitle() {
    const titleEl = document.querySelector('.ship-select-title');
    if (!titleEl) return;
    if (state.coop && state.shipSelectPhase === 1) {
      titleEl.textContent = 'Player 2 — Choose Your Ship!';
    } else if (state.coop) {
      titleEl.textContent = 'Player 1 — Choose Your Ship!';
    } else {
      titleEl.textContent = 'Choose Your Ship!';
    }
  }

  function renderShipPreviews() {
    document.querySelectorAll('.ship-preview').forEach(c => {
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const shipType = c.closest('.ship-card').dataset.ship;
      const shipAnims = SPRITES.ANIMS.ship[shipType];
      if (!shipAnims) return;
      const sprite = shipAnims.idle[0];
      const s = 3;
      const ox = (c.width - sprite.w * s) / 2;
      const oy = (c.height - sprite.h * s) / 2;
      for (let y = 0; y < sprite.h; y++) {
        for (let x = 0; x < sprite.w; x++) {
          const color = sprite.pixels[y * sprite.w + x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(ox + x * s, oy + y * s, s, s);
          }
        }
      }
    });
  }

  // ===== STATUS BARS =====

  /** Update energy + coin status bars on title/level-select screens */
  function updateStatusBars() {
    if (typeof Energy !== 'undefined') {
      const rem = Energy.getRemaining();
      const text = rem === Infinity ? '⚡ Unlimited' : `⚡ ${Math.floor(rem)} min`;
      els.statusTimes.forEach(el => { el.textContent = text; });
    }
    const coins = typeof SharedCoins !== 'undefined' ? SharedCoins.get() : 0;
    els.statusCoins.forEach(el => { el.textContent = `🪙 ${coins}`; });
  }

  // ===== SCREEN MANAGEMENT =====

  function showScreen(name) {
    state.screen = name;
    Object.values(els.screens).forEach(s => s && s.classList.remove('active'));
    if (els.screens[name]) els.screens[name].classList.add('active');

    const isPlaying = name === 'playing';
    els.hud.style.display = isPlaying ? 'flex' : 'none';
    els.gameCanvas.style.opacity = isPlaying ? '1' : '0.15';

    if (!isPlaying) {
      if (typeof Energy !== 'undefined') Energy.stopTimer();
      if (els.hudEnergy) els.hudEnergy.style.display = 'none';
      Engine.stopLoop();
    }
  }

  // ===== LEVEL SELECT =====

  function showLevelSelect() {
    const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    const activeWorld = Math.floor(Math.min(unlocked, LEVELS.ALL.length - 1) / LEVELS_PER_WORLD);

    // Render world tabs
    const tabsEl = document.querySelector('.ls-world-tabs');
    tabsEl.innerHTML = '';
    for (let w = 0; w < WORLDS.length; w++) {
      const firstLevel = w * LEVELS_PER_WORLD;
      const worldLocked = firstLevel > unlocked;
      const tab = document.createElement('button');
      tab.className = 'ls-world-tab' + (w === activeWorld ? ' active' : '') + (worldLocked ? ' ls-world-locked' : '');
      tab.textContent = `${WORLDS[w].icon} ${WORLDS[w].name}`;
      if (!worldLocked) {
        tab.addEventListener('click', () => {
          Audio.SFX.tap();
          renderWorldLevels(w, unlocked);
          tabsEl.querySelectorAll('.ls-world-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      }
      tabsEl.appendChild(tab);
    }

    renderWorldLevels(activeWorld, unlocked);
    updateStatusBars();
    showScreen('levelSelect');
  }

  function renderWorldLevels(worldIndex, unlocked) {
    els.lsLevels.innerHTML = '';
    const start = worldIndex * LEVELS_PER_WORLD;
    const end = Math.min(start + LEVELS_PER_WORLD, LEVELS.ALL.length);

    for (let i = start; i < end; i++) {
      const lvl = LEVELS.ALL[i];
      const locked = i > unlocked;
      const levelInWorld = i - start + 1;
      const btn = document.createElement('button');
      btn.className = 'card ls-card' + (locked ? ' ls-locked' : '');
      btn.innerHTML = `
        <span class="ls-icon">${locked ? '🔒' : (LEVEL_ICONS[i] || '⭐')}</span>
        <span class="ls-num">${worldIndex + 1}-${levelInWorld}</span>
        <span class="ls-name">${lvl.name}</span>
      `;

      if (!locked) {
        btn.addEventListener('click', () => {
          Audio.SFX.tap();
          showShop(i);
        });
      }

      els.lsLevels.appendChild(btn);
    }
  }

  // ===== SHOP =====

  const SHOP_DATA = [
    { type: 'rapidFire',      icon: '⚡', name: 'Rapid Fire',      desc: '+50% fire rate',          price: 15, category: 'weapon' },
    { type: 'dualCannons',    icon: '🔫', name: 'Dual Cannons',    desc: '2 parallel shots',        price: 25, category: 'weapon' },
    { type: 'spreadShot',     icon: '🌟', name: 'Spread Shot',     desc: '3-shot fan pattern',      price: 40, category: 'weapon' },
    { type: 'piercingRounds', icon: '💫', name: 'Piercing Rounds', desc: 'Bullets hit 3 enemies',   price: 50, category: 'weapon' },
    { type: 'shieldBoost',    icon: '🛡️', name: 'Shield Boost',    desc: '+1 max HP',               price: 15, category: 'defense' },
    { type: 'autoRepair',     icon: '💚', name: 'Auto-Repair',     desc: 'Regen 1 HP / 60s',       price: 30, category: 'defense' },
    { type: 'deflector',      icon: '🔰', name: 'Deflector',       desc: '20% deflect chance',      price: 40, category: 'defense' },
    { type: 'magnetField',    icon: '🧲', name: 'Magnet Field',    desc: 'Attract crystals',        price: 20, category: 'utility' },
    { type: 'speedBoost',     icon: '🏎️', name: 'Speed Boost',     desc: '+30% ship speed',         price: 15, category: 'utility' },
    { type: 'extraLife',      icon: '❤️', name: 'Extra Life',      desc: '+1 life',                 price: 30, category: 'utility', repeatable: true },
    { type: 'bomb',           icon: '💣', name: 'Bomb',            desc: 'Screen clear (1/level)',  price: 20, category: 'utility', repeatable: true },
  ];

  function showShop(levelIndex) {
    state.currentLevel = levelIndex;
    updateShopUI();
    showScreen('shop');
  }

  function updateShopUI() {
    const sharedBal = SharedCoins.get();
    els.shopCoinCount.textContent = sharedBal;

    els.shopItems.innerHTML = '';
    for (const item of SHOP_DATA) {
      const owned = !item.repeatable && persistent.upgrades.includes(item.type);
      const tooExpensive = sharedBal < item.price;

      const btn = document.createElement('button');
      btn.className = 'shop-item';
      if (owned) btn.classList.add('shop-item-owned');
      if (tooExpensive && !owned) btn.classList.add('shop-item-expensive');

      btn.innerHTML = `
        <span class="shop-item-icon">${item.icon}</span>
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-desc">${item.desc}</span>
        <span class="shop-item-price">${owned ? '✓ Owned' : '🪙 ' + item.price}</span>
      `;

      if (!owned && !tooExpensive) {
        btn.addEventListener('click', () => {
          if (!SharedCoins.spend(item.price)) return;
          Audio.SFX.correct();
          if (item.type === 'extraLife') {
            persistent.lives++;
          } else if (item.type === 'bomb') {
            if (!persistent.upgrades.includes('bomb')) persistent.upgrades.push('bomb');
          } else if (item.type === 'shieldBoost') {
            persistent.upgrades.push('shieldBoost');
          } else {
            persistent.upgrades.push(item.type);
          }
          updateShopUI();
        });
      }

      els.shopItems.appendChild(btn);
    }

    // Show inventory
    const invNames = persistent.upgrades.filter(u => u !== 'bomb').map(u => {
      const item = SHOP_DATA.find(i => i.type === u);
      return item ? item.icon : '';
    });
    els.shopInvIcons.textContent = invNames.join(' ') || '(none)';
  }

  // ===== LEVEL LIFECYCLE =====

  function startLevel(levelIndex) {
    if (levelIndex >= LEVELS.ALL.length) {
      onVictory();
      return;
    }

    state.currentLevel = levelIndex;
    const { w: cw, h: ch } = Engine.getSize();
    currentLevelData = LEVELS.processLevel(LEVELS.ALL[levelIndex], cw, ch);

    // Reset state
    state.enemies = [];
    state.minis = [];
    state.playerBullets = [];
    state.enemyBullets = [];
    state.crystals = [];
    state.explosions = [];
    state.scorePopups = [];
    state.boss = null;
    state.bossActive = false;
    state.waveIndex = 0;
    state.waveDelay = currentLevelData.waves[0] ? currentLevelData.waves[0].delay : 60;
    state.allWavesSpawned = false;
    state.levelTimer = 0;
    state.autoRepairTimer = 0;
    state.gameOverPending = false;

    // Create players
    if (state.coop) {
      state.players = [
        Entities.createPlayer(1, state.shipType, cw, ch),
        Entities.createPlayer(2, state.shipType2, cw, ch),
      ];
    } else {
      state.players = [
        Entities.createPlayer(1, state.shipType, cw, ch),
      ];
    }

    // Apply persistent state
    for (const p of state.players) {
      p.lives = persistent.lives;
      p.upgrades = [...persistent.upgrades];
      p.hasBomb = persistent.upgrades.includes('bomb');
      p.bombUsed = false;

      // Apply shield boost (stack: each shieldBoost adds +1 max HP)
      const shieldCount = persistent.upgrades.filter(u => u === 'shieldBoost').length;
      p.maxHp += shieldCount;
      p.hp = p.maxHp;

      // Apply rapid fire
      if (persistent.upgrades.includes('rapidFire')) {
        p.fireRate = Math.max(8, Math.floor(p.fireRate * 0.6));
      }
    }

    // Init starfield
    Engine.initStarfield(cw, ch);

    // Save progress
    Storage.save(GAME_ID, 'level', levelIndex);
    Storage.save(GAME_ID, 'shipType', state.shipType);
    Storage.save(GAME_ID, 'persistent', persistent);

    // Show co-op HUD
    els.hudP2.style.display = state.coop ? 'flex' : 'none';
    els.hudBossBar.style.display = 'none';

    if (document.activeElement) document.activeElement.blur();

    showScreen('playing');

    // Start energy timer
    if (typeof Energy !== 'undefined') {
      Energy.startTimer(
        (remaining) => {
          if (els.hudEnergy) {
            const min = Math.floor(remaining);
            const sec = Math.floor((remaining - min) * 60);
            els.hudEnergy.textContent = `⚡ ${min}:${sec.toString().padStart(2, '0')}`;
            els.hudEnergy.style.display = 'inline';
            els.hudEnergy.classList.toggle('energy-low', remaining < 5);
          }
        },
        () => {
          state.paused = true;
          Engine.stopLoop();
          if (els.energyOverlay) els.energyOverlay.style.display = 'flex';
        }
      );
    }

    Engine.startLoop(update, render);
  }

  // ===== WAVE SPAWNING =====

  function spawnWave(waveData) {
    for (const eDef of waveData.enemies) {
      const enemy = Entities.createEnemy(eDef.type, eDef.x, eDef.y, eDef.config);
      state.enemies.push(enemy);
    }
  }

  function checkWaveProgress() {
    if (state.allWavesSpawned) return;

    const waves = currentLevelData.waves;
    if (state.waveIndex >= waves.length) {
      state.allWavesSpawned = true;
      return;
    }

    // Count living enemies (exclude boss-spawned enemies which don't count)
    const livingEnemies = state.enemies.filter(e => e.alive).length + state.minis.filter(m => m.alive).length;

    // Wait for current wave to be cleared (or first wave)
    if (state.waveIndex === 0 || livingEnemies === 0) {
      state.waveDelay--;
      if (state.waveDelay <= 0) {
        const w = waves[state.waveIndex];
        if (w.enemies.length > 0) {
          spawnWave(w);
        } else if (currentLevelData.isBoss) {
          // Empty wave = boss trigger
          spawnBoss();
        }
        state.waveIndex++;
        if (state.waveIndex < waves.length) {
          state.waveDelay = waves[state.waveIndex].delay;
        } else {
          state.allWavesSpawned = true;
        }
      }
    }
  }

  function spawnBoss() {
    const { w: cw } = Engine.getSize();
    state.boss = Entities.createBoss(cw, state.coop);
    state.bossActive = true;
    sfxBossWarning();
    els.hudBossBar.style.display = 'block';
    els.hudBossName.textContent = currentLevelData.name;
  }

  // ===== ENEMY BULLET SPAWNER =====

  function spawnEnemyBullet(x, y, vx, vy, type, target) {
    const b = Entities.createEnemyBullet(x, y, vx, vy, type || 'normal');
    if (type === 'missile' && target) {
      b.type = 'missile';
      b.target = target;
      b.w = 8 * Engine.SCALE;
      b.h = 12 * Engine.SCALE;
    }
    state.enemyBullets.push(b);
  }

  function spawnBossEnemy(type, x, y) {
    const enemy = Entities.createEnemy(type, x, y, { fireRate: 150 });
    state.enemies.push(enemy);
  }

  // ===== UPDATE =====

  function update() {
    if (state.paused) return;
    state.levelTimer++;

    const { w: cw, h: ch } = Engine.getSize();

    // Starfield
    Engine.updateStarfield(ch);

    // Wave management
    checkWaveProgress();

    // Auto-repair
    if (persistent.upgrades.includes('autoRepair')) {
      state.autoRepairTimer++;
      if (state.autoRepairTimer >= 3600) { // 60 seconds
        state.autoRepairTimer = 0;
        for (const p of state.players) {
          if (p.alive && p.hp < p.maxHp) {
            p.hp++;
            Particles.sparkle(p.x + p.w / 2, p.y + p.h / 2, 8, '#39FF14');
          }
        }
      }
    }

    // Update players
    for (const p of state.players) {
      Entities.updatePlayer(p, state.coop, cw, ch);

      if (p.alive) {
        // Shooting (auto-fire while held)
        if (Engine.Input.shootHeld(p.pn, state.coop) && p.fireCooldown <= 0) {
          const bullets = Entities.createPlayerBullet(p);
          state.playerBullets.push(...bullets);
          p.fireCooldown = p.fireRate;
          sfxShoot();
        }

        // Bomb
        if (p.hasBomb && !p.bombUsed && Engine.Input.bombPressed(p.pn, state.coop)) {
          activateBomb(p);
        }

        // Engine trail
        if (Math.abs(p.vx) > 0.5 || p.vy !== 0) {
          Entities.addTrail(
            p.x + p.w / 2 + (Math.random() - 0.5) * 8,
            p.y + p.h + 2
          );
        }
      }
    }

    // Update player bullets
    state.playerBullets = state.playerBullets.filter(b => {
      Entities.updateBullet(b);
      return b.alive;
    });

    // Update enemies
    state.enemies = state.enemies.filter(e => {
      Entities.updateEnemy(e, cw, ch, state.players, spawnEnemyBullet);
      return e.alive;
    });

    // Update minis
    state.minis = state.minis.filter(m => {
      Entities.updateMini(m, ch);
      return m.alive;
    });

    // Update enemy bullets
    state.enemyBullets = state.enemyBullets.filter(b => {
      Entities.updateEnemyBullet(b, state.players);
      return b.alive;
    });

    // Update boss
    if (state.boss && state.boss.alive) {
      Entities.updateBoss(state.boss, cw, ch, state.players, spawnEnemyBullet, spawnBossEnemy);
    }

    // Update crystals
    state.crystals = state.crystals.filter(c => {
      Entities.updateCrystal(c, state.players);
      return c.alive;
    });

    // Update explosions
    state.explosions = state.explosions.filter(e => {
      Entities.updateExplosion(e);
      return e.alive;
    });

    // Update trails
    Entities.updateTrails();

    // Update score popups
    state.scorePopups = state.scorePopups.filter(p => {
      Entities.updateScorePopup(p);
      return p.life > 0;
    });

    // ===== COLLISIONS =====

    // Player bullets vs enemies
    for (const b of state.playerBullets) {
      if (!b.alive) continue;

      // vs normal enemies
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (Engine.overlap(b, e)) {
          e.hp--;
          e.flashTimer = 4;
          sfxHit();

          if (e.hp <= 0) {
            killEnemy(e, b.owner);
          }

          b.pierceLeft--;
          if (b.pierceLeft <= 0) b.alive = false;
          break;
        }
      }

      // vs minis
      for (const m of state.minis) {
        if (!m.alive || !b.alive) continue;
        if (Engine.overlap(b, m)) {
          m.hp--;
          if (m.hp <= 0) {
            killMini(m, b.owner);
          }
          b.pierceLeft--;
          if (b.pierceLeft <= 0) b.alive = false;
          break;
        }
      }

      // vs boss
      if (state.boss && state.boss.alive && !state.boss.entering && b.alive) {
        if (Engine.overlap(b, state.boss)) {
          state.boss.hp--;
          state.boss.flashTimer = 3;
          sfxHit();
          b.pierceLeft--;
          if (b.pierceLeft <= 0) b.alive = false;

          if (state.boss.hp <= 0) {
            killBoss();
          }
        }
      }
    }

    // Enemy bullets vs players
    for (const b of state.enemyBullets) {
      if (!b.alive) continue;
      for (const p of state.players) {
        if (!p.alive || p.invincible > 0) continue;
        if (Engine.overlap(b, p)) {
          const result = Entities.damagePlayer(p, 1);
          if (result === 'hit') {
            sfxDamage();
            Engine.triggerShake(10, 3);
            state.explosions.push(Entities.createExplosion(p.x + p.w / 2, p.y + p.h / 2, '#FF0000', 6));
          } else if (result === 'dead') {
            sfxExplode();
            Engine.triggerShake(15, 5);
            state.explosions.push(Entities.createExplosion(p.x + p.w / 2, p.y + p.h / 2, '#00FFFF', 20));
            Particles.fireBurst(p.x + p.w / 2, p.y + p.h / 2, 25);
          }
          b.alive = false;
          break;
        }
      }
    }

    // Boss laser vs players
    if (state.boss && state.boss.laserActive > 0) {
      const laserRect = { x: 0, y: state.boss.laserY, w: cw, h: 40 };
      for (const p of state.players) {
        if (!p.alive || p.invincible > 0) continue;
        if (Engine.overlap(p, laserRect)) {
          const result = Entities.damagePlayer(p, 2);
          if (result) {
            sfxDamage();
            Engine.triggerShake(12, 4);
          }
        }
      }
    }

    // Enemies ramming players
    const allEnemies = [...state.enemies, ...state.minis];
    for (const e of allEnemies) {
      if (!e.alive) continue;
      for (const p of state.players) {
        if (!p.alive || p.invincible > 0) continue;
        if (Engine.overlap(e, p)) {
          const result = Entities.damagePlayer(p, 1);
          if (result) {
            sfxDamage();
            Engine.triggerShake(8, 3);
          }
        }
      }
    }

    // Crystals vs players (add to SharedCoins)
    for (const c of state.crystals) {
      if (!c.alive) continue;
      for (const p of state.players) {
        if (!p.alive) continue;
        if (Engine.overlap(c, p)) {
          c.alive = false;
          SharedCoins.add(1);
          sfxCrystal();
          Particles.sparkle(c.x + c.w / 2, c.y + c.h / 2, 6, '#FFD700');
        }
      }
    }

    // Check level complete
    if (state.allWavesSpawned && !state.bossActive) {
      const livingEnemies = state.enemies.filter(e => e.alive).length + state.minis.filter(m => m.alive).length;
      if (livingEnemies === 0) {
        onLevelComplete();
        return;
      }
    }

    // Boss defeated = level complete
    if (state.bossActive && state.boss && !state.boss.alive) {
      // Wait a moment for explosion effects
      if (state.boss.deathTimer === undefined) state.boss.deathTimer = 120;
      state.boss.deathTimer--;
      if (state.boss.deathTimer <= 0) {
        onLevelComplete();
        return;
      }
    }

    updateHUD();

    // Check game over
    const allDead = state.players.every(p => !p.alive && p.lives <= 0);
    if (allDead && !state.gameOverPending) {
      state.gameOverPending = true;
      setTimeout(() => onGameOver(), 1500);
      return;
    }
  }

  // ===== KILL HANDLERS =====

  function killEnemy(e, ownerPn) {
    e.alive = false;
    sfxExplode();

    // Score
    persistent.score += e.score;
    const player = state.players.find(p => p.pn === ownerPn) || state.players[0];
    if (player) player.combo++;

    // Combo bonus
    const comboMultiplier = player ? Math.min(player.combo, 10) : 1;
    const totalScore = e.score * (1 + comboMultiplier * 0.1);

    // Explosion
    const glowColors = { drone: '#00FFFF', swooper: '#FF00FF', tank: '#FF8C00', stealth: '#BF40FF', splitter: '#00FF00', bomber: '#FF0000' };
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    state.explosions.push(Entities.createExplosion(cx, cy, glowColors[e.type] || '#FF4500', 15));
    state.scorePopups.push(Entities.createScorePopup(cx, cy, `+${Math.floor(totalScore)}`, '#FFD700'));

    // Crystal drop
    if (Math.random() < e.crystalChance) {
      state.crystals.push(Entities.createCrystal(cx, cy));
    }

    // Splitter spawns minis
    if (e.type === 'splitter') {
      state.minis.push(Entities.createMini(cx - 20, cy, -2));
      state.minis.push(Entities.createMini(cx + 20, cy, 2));
    }
  }

  function killMini(m, ownerPn) {
    m.alive = false;
    persistent.score += m.score;
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;
    state.explosions.push(Entities.createExplosion(cx, cy, '#00FF00', 8));
    state.scorePopups.push(Entities.createScorePopup(cx, cy, `+${m.score}`, '#00FF00'));
    if (Math.random() < m.crystalChance) {
      state.crystals.push(Entities.createCrystal(cx, cy));
    }
  }

  function killBoss() {
    state.boss.alive = false;
    persistent.score += state.boss.score;

    const cx = state.boss.x + state.boss.w / 2;
    const cy = state.boss.y + state.boss.h / 2;

    // Massive explosion sequence
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ox = (Math.random() - 0.5) * state.boss.w;
        const oy = (Math.random() - 0.5) * state.boss.h;
        state.explosions.push(Entities.createExplosion(cx + ox, cy + oy, '#FFD700', 25));
        Particles.fireBurst(cx + ox, cy + oy, 30);
        Engine.triggerShake(8, 4);
        sfxExplode();
      }, i * 300);
    }

    setTimeout(() => {
      Particles.rainbowExplosion(cx, cy);
      Particles.confetti(60);
    }, 1500);

    // Drop lots of crystals
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        state.crystals.push(Entities.createCrystal(
          cx + (Math.random() - 0.5) * 100,
          cy + (Math.random() - 0.5) * 60
        ));
      }, i * 100);
    }

    state.scorePopups.push(Entities.createScorePopup(cx, cy, `+${state.boss.score}`, '#FFD700'));
    els.hudBossBar.style.display = 'none';
  }

  function activateBomb(p) {
    p.bombUsed = true;
    sfxBomb();
    Engine.triggerShake(15, 5);

    // Kill all enemies on screen
    for (const e of state.enemies) {
      if (e.alive) {
        killEnemy(e, p.pn);
      }
    }
    for (const m of state.minis) {
      if (m.alive) {
        killMini(m, p.pn);
      }
    }
    // Clear enemy bullets
    state.enemyBullets = [];

    // Boss takes damage
    if (state.boss && state.boss.alive) {
      state.boss.hp -= 5;
      state.boss.flashTimer = 10;
      if (state.boss.hp <= 0) killBoss();
    }

    // Big visual effect
    const { w: cw, h: ch } = Engine.getSize();
    Particles.fireBurst(cw / 2, ch / 2, 50);

    // White flash overlay (handled in render via state)
    state.bombFlash = 15;
  }

  // ===== RENDER =====

  function render(ctx, cw, ch) {
    // Background
    ctx.fillStyle = currentLevelData.bgColor;
    ctx.fillRect(0, 0, cw, ch);

    // Level-specific background
    renderLevelBg(ctx, cw, ch);

    // Screen shake
    ctx.save();
    Engine.applyShake(ctx);

    // Starfield
    Engine.renderStarfield(ctx, cw, ch);

    // Trails
    Entities.renderTrails(ctx);

    // Crystals
    for (const c of state.crystals) {
      Entities.renderCrystal(ctx, c);
    }

    // Player bullets
    for (const b of state.playerBullets) {
      Entities.renderPlayerBullet(ctx, b);
    }

    // Enemy bullets
    for (const b of state.enemyBullets) {
      Entities.renderEnemyBullet(ctx, b);
    }

    // Enemies
    for (const e of state.enemies) {
      Entities.renderEnemy(ctx, e);
    }

    // Minis
    for (const m of state.minis) {
      Entities.renderMini(ctx, m);
    }

    // Boss
    if (state.boss) {
      Entities.renderBoss(ctx, state.boss, cw);
    }

    // Players
    for (const p of state.players) {
      Entities.renderPlayer(ctx, p);
    }

    // Explosions
    for (const e of state.explosions) {
      Entities.renderExplosion(ctx, e);
    }

    // Score popups
    for (const p of state.scorePopups) {
      Entities.renderScorePopup(ctx, p);
    }

    // Bomb flash
    if (state.bombFlash > 0) {
      ctx.save();
      ctx.globalAlpha = state.bombFlash / 15 * 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
      state.bombFlash--;
    }

    ctx.restore(); // screen shake

    // Pause overlay
    if (state.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 48px "Fredoka One", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00FFFF';
      ctx.fillText('PAUSED', cw / 2, ch / 2);
      ctx.shadowBlur = 0;
      ctx.font = '20px Nunito, sans-serif';
      ctx.fillStyle = '#AAAACC';
      ctx.fillText('Press ESC to resume', cw / 2, ch / 2 + 40);
    }
  }

  function renderLevelBg(ctx, cw, ch) {
    const bgType = currentLevelData.bgType;
    const time = state.levelTimer;

    switch (bgType) {
      case 'asteroids': {
        // Drifting asteroid shapes
        ctx.fillStyle = 'rgba(100, 80, 60, 0.3)';
        for (let i = 0; i < 8; i++) {
          const ax = ((i * 137 + time * 0.1) % (cw + 60)) - 30;
          const ay = ((i * 89 + time * 0.15) % (ch + 60)) - 30;
          const size = 15 + (i % 3) * 10;
          ctx.beginPath();
          ctx.arc(ax, ay, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'nebula': {
        // Purple/blue nebula blobs
        const grd1 = ctx.createRadialGradient(cw * 0.3, ch * 0.4, 20, cw * 0.3, ch * 0.4, 200);
        grd1.addColorStop(0, 'rgba(100, 0, 150, 0.15)');
        grd1.addColorStop(1, 'rgba(100, 0, 150, 0)');
        ctx.fillStyle = grd1;
        ctx.fillRect(0, 0, cw, ch);

        const grd2 = ctx.createRadialGradient(cw * 0.7, ch * 0.6, 20, cw * 0.7, ch * 0.6, 180);
        grd2.addColorStop(0, 'rgba(0, 50, 200, 0.12)');
        grd2.addColorStop(1, 'rgba(0, 50, 200, 0)');
        ctx.fillStyle = grd2;
        ctx.fillRect(0, 0, cw, ch);
        break;
      }
      case 'deepspace': {
        // Subtle red tint for boss level
        const grd = ctx.createRadialGradient(cw / 2, 0, 10, cw / 2, 0, ch);
        grd.addColorStop(0, 'rgba(100, 0, 0, 0.1)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, cw, ch);
        break;
      }
      case 'crystal': {
        // Floating crystal shards with purple/cyan glow
        const grd3 = ctx.createRadialGradient(cw * 0.4, ch * 0.3, 20, cw * 0.4, ch * 0.3, 220);
        grd3.addColorStop(0, 'rgba(100, 0, 200, 0.12)');
        grd3.addColorStop(1, 'rgba(100, 0, 200, 0)');
        ctx.fillStyle = grd3;
        ctx.fillRect(0, 0, cw, ch);

        const grd4 = ctx.createRadialGradient(cw * 0.7, ch * 0.6, 20, cw * 0.7, ch * 0.6, 180);
        grd4.addColorStop(0, 'rgba(0, 200, 255, 0.08)');
        grd4.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = grd4;
        ctx.fillRect(0, 0, cw, ch);

        // Floating crystal shapes
        ctx.fillStyle = 'rgba(150, 100, 255, 0.15)';
        for (let i = 0; i < 6; i++) {
          const cx = ((i * 173 + time * 0.08) % (cw + 40)) - 20;
          const cy = ((i * 113 + time * 0.12) % (ch + 40)) - 20;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(time * 0.01 + i);
          ctx.fillRect(-6, -10, 12, 20);
          ctx.restore();
        }
        break;
      }
      case 'mothership': {
        // Red warning ambiance with pulsing effect
        const pulse = 0.06 + Math.sin(time * 0.03) * 0.03;
        const grd5 = ctx.createRadialGradient(cw / 2, ch / 2, 50, cw / 2, ch / 2, ch * 0.8);
        grd5.addColorStop(0, `rgba(200, 0, 0, ${pulse})`);
        grd5.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grd5;
        ctx.fillRect(0, 0, cw, ch);

        // Warning scan lines
        ctx.fillStyle = `rgba(255, 0, 0, ${0.02 + Math.sin(time * 0.05) * 0.01})`;
        for (let y = 0; y < ch; y += 4) {
          ctx.fillRect(0, y, cw, 1);
        }
        break;
      }
    }
  }

  // ===== HUD =====

  function updateHUD() {
    const p1 = state.players[0];
    if (!p1) return;

    els.hudHp.textContent = '🛡️'.repeat(Math.max(0, p1.hp));
    els.hudLives.textContent = `x${Math.max(0, p1.lives)}`;
    els.hudScore.textContent = `Score: ${persistent.score}`;
    els.hudCoins.textContent = `🪙 ${SharedCoins.get()}`;
    const worldIdx = Math.floor(state.currentLevel / LEVELS_PER_WORLD);
    const lvlInWorld = (state.currentLevel % LEVELS_PER_WORLD) + 1;
    els.hudLevel.textContent = `${worldIdx + 1}-${lvlInWorld}: ${currentLevelData.name}`;

    // Wave indicator
    const totalWaves = currentLevelData.waves.length;
    if (state.bossActive) {
      els.hudWave.textContent = 'BOSS';
      els.hudWave.style.color = '#FF0000';
    } else {
      els.hudWave.textContent = `Wave ${Math.min(state.waveIndex, totalWaves)}/${totalWaves}`;
      els.hudWave.style.color = '#AAAACC';
    }

    // Weapon name
    const weaponNames = [];
    if (p1.upgrades.includes('piercingRounds')) weaponNames.push('Pierce');
    if (p1.upgrades.includes('spreadShot')) weaponNames.push('Spread');
    if (p1.upgrades.includes('dualCannons')) weaponNames.push('Dual');
    if (p1.upgrades.includes('rapidFire')) weaponNames.push('Rapid');
    els.hudWeapon.textContent = weaponNames.length ? `⚡ ${weaponNames.join('+')}` : '⚡ Basic';

    // Bomb
    if (p1.hasBomb && !p1.bombUsed) {
      els.hudBomb.textContent = '💣 [Q]';
      els.hudBomb.style.opacity = '1';
    } else if (p1.hasBomb) {
      els.hudBomb.textContent = '💣 used';
      els.hudBomb.style.opacity = '0.3';
    } else {
      els.hudBomb.textContent = '';
    }

    // Boss HP bar
    if (state.boss && state.boss.alive) {
      const pct = Math.max(0, state.boss.hp / state.boss.maxHp * 100);
      els.hudBossHp.style.width = pct + '%';
      els.hudBossHp.style.backgroundColor = pct > 60 ? '#4682B4' : pct > 30 ? '#FF8C00' : '#FF0000';
    }

    // P2 HUD
    if (state.coop && state.players[1]) {
      const p2 = state.players[1];
      els.hudP2Hp.textContent = '🛡️'.repeat(Math.max(0, p2.hp));
      els.hudP2Lives.textContent = `x${Math.max(0, p2.lives)}`;
    }
  }

  // ===== LEVEL TRANSITIONS =====

  function onLevelComplete() {
    Engine.stopLoop();
    Audio.SFX.fanfare();
    Particles.confetti(60);

    // Update persistent
    persistent.lives = state.players[0].lives;

    // Unlock next level
    const prevUnlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    Storage.save(GAME_ID, 'unlockedLevel', Math.max(prevUnlocked, state.currentLevel + 1));
    Storage.save(GAME_ID, 'level', state.currentLevel + 1);
    Storage.save(GAME_ID, 'persistent', persistent);
    Storage.save(GAME_ID, 'highScore',
      Math.max(Storage.load(GAME_ID, 'highScore', 0), persistent.score));

    // Update continue button info
    const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    if (unlocked > 0) {
      els.continueWrapper.style.display = 'flex';
      els.continueInfo.textContent = `${unlocked + 1} of ${LEVELS.ALL.length} levels unlocked`;
    }

    if (state.currentLevel >= LEVELS.ALL.length - 1) {
      setTimeout(() => onVictory(), 1000);
    } else {
      els.lcTitle.textContent = `${currentLevelData.name} Complete!`;
      els.lcStats.textContent = `Score: ${persistent.score} · 🪙 ${SharedCoins.get()} coins`;
      showScreen('levelComplete');
    }
  }

  function onGameOver() {
    Engine.stopLoop();
    els.goScore.textContent = `Score: ${persistent.score} · 🪙 ${SharedCoins.get()} coins`;
    showScreen('gameOver');
  }

  function onVictory() {
    Engine.stopLoop();
    Audio.SFX.fanfare();
    Particles.confetti(100);
    Particles.rainbowExplosion(
      Engine.getSize().w / 2,
      Engine.getSize().h / 2
    );

    els.vicStats.textContent = `Final Score: ${persistent.score} · 🪙 ${SharedCoins.get()} coins`;
    Storage.clearGame(GAME_ID);
    showScreen('victory');

    setTimeout(() => Particles.confetti(60), 1500);
  }

  // ===== BOOT =====
  document.addEventListener('DOMContentLoaded', init);

  return { state };
})();
