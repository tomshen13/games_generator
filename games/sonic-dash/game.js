/**
 * Sonic Dash — Main game state machine, screens, HUD, shop, ring damage, co-op.
 */
(() => {
  const GAME_ID = 'sonic-dash';
  const TILE = Engine.TILE;
  const SCALE = Engine.SCALE;

  // Item name mapping: levels.js names → entities.js names
  const ITEM_MAP = {
    ring10: 'ring_ten',
    shield: 'shield_basic',
    flame_shield: 'shield_flame',
    water_shield: 'shield_water',
    lightning_shield: 'shield_lightning',
    invincible: 'invincibility',
    speed: 'speed',
    life: 'life',
  };

  // ===== STATE =====
  const state = {
    screen: 'title',
    coop: false,
    charType1: 'sonic',
    charType2: 'tails',
    currentLevel: 0,
    players: [],
    rings: [],
    scatteredRings: [],
    enemies: [],
    monitors: [],
    springs: [],
    checkpoints: [],
    dashpads: [],
    goals: [],
    flickies: [],
    projectiles: [],
    boss: null,
    paused: false,
    levelTimer: 0,
    totalScore: 0,
  };

  let energyDepleted = false;

  // Persistent data saved across sessions
  const persistent = {
    lives: 3,
    score: 0,
    inventory: [],  // shop items to use at level start
  };

  const els = {};

  // ===== SHOP DATA =====
  const SHOP_DATA = [
    { id: 'shield_basic',     name: '🛡️ Shield',          price: 30,  desc: 'Absorbs 1 hit' },
    { id: 'shield_flame',     name: '🔥 Flame Shield',    price: 60,  desc: 'Fire dash in air' },
    { id: 'shield_water',     name: '💧 Water Shield',    price: 60,  desc: 'Bounce in air' },
    { id: 'shield_lightning', name: '⚡ Lightning Shield', price: 80,  desc: 'Double jump + attract rings' },
    { id: 'speed',            name: '👟 Speed Shoes',     price: 40,  desc: '20s speed boost' },
    { id: 'ring_ten',         name: '💍 10 Rings',        price: 15,  desc: 'Start with 10 rings' },
    { id: 'life',             name: '❤️ Extra Life',      price: 50,  desc: '+1 life' },
  ];

  // ===== INIT =====
  function init() {
    Audio.init();
    Engine.Input.init();
    cacheDOM();
    bindEvents();
    loadPersistent();
    renderCharPreviews();

    SharedCoins.migrate();

    const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    if (unlocked > 0) {
      els.continueWrapper.style.display = 'flex';
      els.continueInfo.textContent = `${unlocked + 1} of ${LEVELS.length} levels unlocked`;
    }

    // Check energy
    if (typeof Energy !== 'undefined' && !Energy.canPlay()) {
      showScreen('energyGate');
    } else {
      showScreen('title');
    }
  }

  function cacheDOM() {
    els.gameCanvas = document.getElementById('gameCanvas');
    els.screens = {
      title: document.querySelector('.title-screen'),
      charSelect: document.querySelector('.char-select-screen'),
      zoneSelect: document.querySelector('.zone-select-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      shop: document.querySelector('.shop-screen'),
      gameOver: document.querySelector('.game-over-screen'),
      victory: document.querySelector('.victory-screen'),
      energyGate: document.querySelector('.energy-gate-screen'),
    };
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');
    els.hud = document.querySelector('.game-hud');
    els.hudRings = document.querySelector('.hud-rings');
    els.hudScore = document.querySelector('.hud-score');
    els.hudLives = document.querySelector('.hud-lives');
    els.hudZone = document.querySelector('.hud-zone');
    els.hudSpeedBar = document.querySelector('.hud-speed-bar');
    els.hudShield = document.querySelector('.hud-shield');
    els.hudSkill = document.querySelector('.hud-skill');
    els.hudPortrait = document.querySelector('.hud-portrait');
    els.hudEnergy = document.querySelector('.hud-energy');
    els.hudFlyWrap = document.querySelector('.hud-fly');
    els.hudFlyBar = document.querySelector('.hud-fly-bar');
    els.hudP2 = document.querySelector('.hud-p2');
    els.hudP2Lives = document.querySelector('.hud-p2-lives');
    els.hudP2Label = document.querySelector('.hud-p2-label');
    els.energyOverlay = document.querySelector('.energy-depleted-overlay');
    els.statusTimes = document.querySelectorAll('.energy-status-time');
    els.statusCoins = document.querySelectorAll('.energy-status-coins');
    // Level complete
    els.lcTitle = document.querySelector('.lc-title');
    els.lcStats = document.querySelector('.lc-stats');
    // Game over
    els.goScore = document.querySelector('.go-score');
    // Victory
    els.victoryStats = document.querySelector('.victory-stats');
    // Shop
    els.shopCoinCount = document.querySelector('.shop-coin-count');
    els.shopItems = document.querySelector('.shop-items');
    els.shopInvIcons = document.querySelector('.shop-inv-icons');
    // Zone select
    els.zsTabs = document.querySelector('.zs-zone-tabs');
    els.zsLevels = document.querySelector('.zs-levels');
    // Char cards
    els.charCards = document.querySelectorAll('.char-card');
    els.particleCanvas = document.querySelector('.particle-canvas');
  }

  function bindEvents() {
    // Title buttons
    document.querySelector('.btn-1p').addEventListener('click', () => {
      Audio.init();
      state.coop = false;
      showScreen('charSelect');
    });
    document.querySelector('.btn-2p').addEventListener('click', () => {
      Audio.init();
      state.coop = true;
      state._selectingP2 = false;
      showScreen('charSelect');
    });
    document.querySelector('.btn-continue')?.addEventListener('click', () => {
      Audio.init();
      state.coop = false;
      const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
      state.currentLevel = Math.min(unlocked, LEVELS.length - 1);
      showScreen('charSelect');
    });

    // Character select
    els.charCards.forEach(card => {
      card.addEventListener('click', () => {
        const char = card.dataset.char;
        if (state.coop && !state._selectingP2) {
          state.charType1 = char;
          state._selectingP2 = true;
          document.querySelector('.char-select-title').textContent = 'P2: Choose Character!';
          return;
        }
        if (state.coop) {
          state.charType2 = char;
          state._selectingP2 = false;
        } else {
          state.charType1 = char;
        }
        document.querySelector('.char-select-title').textContent = 'Choose Your Character!';
        buildZoneSelect();
        showScreen('zoneSelect');
      });
    });

    // Zone select shop
    document.querySelector('.btn-zs-shop')?.addEventListener('click', () => {
      buildShopUI();
      showScreen('shop');
    });

    // Level complete buttons
    document.querySelector('.btn-next-level')?.addEventListener('click', () => {
      state.currentLevel++;
      if (state.currentLevel >= LEVELS.length) {
        onVictory();
      } else {
        startLevel(state.currentLevel);
      }
    });
    document.querySelector('.btn-switch-char')?.addEventListener('click', () => {
      showScreen('charSelect');
    });

    // Game over buttons
    document.querySelector('.btn-retry')?.addEventListener('click', () => {
      persistent.lives = 3;
      startLevel(state.currentLevel);
    });
    document.querySelector('.btn-go-zones')?.addEventListener('click', () => {
      persistent.lives = 3;
      buildZoneSelect();
      showScreen('zoneSelect');
    });

    // Victory
    document.querySelector('.btn-play-again')?.addEventListener('click', () => {
      persistent.lives = 3;
      persistent.score = 0;
      state.currentLevel = 0;
      buildZoneSelect();
      showScreen('zoneSelect');
    });

    // Home buttons
    document.querySelectorAll('.btn-home').forEach(btn => {
      btn.addEventListener('click', () => {
        Engine.stopLoop();
        if (typeof Energy !== 'undefined') Energy.stopTimer();
        showScreen('title');
      });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.screen === 'charSelect') showScreen('title');
        else if (state.screen === 'zoneSelect') showScreen('charSelect');
        else if (state.screen === 'shop') { buildZoneSelect(); showScreen('zoneSelect'); }
      });
    });

    // Shop → start
    document.querySelector('.btn-start-level')?.addEventListener('click', () => {
      startLevel(state.currentLevel);
    });

    // Energy gate buttons
    document.querySelector('.btn-energy-edu')?.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
    document.querySelector('.btn-energy-pin')?.addEventListener('click', async () => {
      if (typeof Energy !== 'undefined') {
        const ok = await Energy.parentBypass();
        if (ok) { energyDepleted = false; showScreen('title'); }
      }
    });
    document.querySelector('.btn-energy-home')?.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });

    // Energy depleted overlay
    document.querySelector('.btn-depleted-edu')?.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
    document.querySelector('.btn-depleted-pin')?.addEventListener('click', async () => {
      if (typeof Energy !== 'undefined') {
        const ok = await Energy.parentBypass();
        if (ok) {
          energyDepleted = false;
          els.energyOverlay.style.display = 'none';
          state.paused = false;
          Engine.startLoop(update, render);
        }
      }
    });
    document.querySelector('.btn-depleted-home')?.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  // ===== SCREENS =====
  function showScreen(name) {
    state.screen = name;
    for (const [key, el] of Object.entries(els.screens)) {
      if (el) el.classList.toggle('active', key === name);
    }
    const isPlaying = name === 'playing';
    els.hud.style.display = isPlaying ? 'flex' : 'none';
    if (isPlaying) {
      els.gameCanvas.style.opacity = '1';
    } else {
      els.gameCanvas.style.display = 'none';
      els.gameCanvas.style.opacity = '0';
    }
    updateStatusBars();
  }

  function updateStatusBars() {
    if (typeof Energy !== 'undefined') {
      const rem = Energy.getRemaining();
      const min = Math.floor(rem);
      const sec = Math.floor((rem - min) * 60);
      const text = `⚡ ${min}:${sec.toString().padStart(2, '0')}`;
      els.statusTimes.forEach(el => { el.textContent = text; });
    }
    const coins = typeof SharedCoins !== 'undefined' ? SharedCoins.get() : 0;
    els.statusCoins.forEach(el => { el.textContent = `🪙 ${coins}`; });
  }

  // ===== ZONE SELECT =====
  function buildZoneSelect() {
    const unlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    const zones = [...new Set(LEVELS.map(l => l.name))];

    // Zone tabs
    els.zsTabs.innerHTML = '';
    zones.forEach((z, i) => {
      const btn = document.createElement('button');
      btn.className = 'zs-zone-tab';
      btn.textContent = z;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zs-zone-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showZoneLevels(z, unlocked);
      });
      if (i === 0) btn.classList.add('active');
      els.zsTabs.appendChild(btn);
    });

    showZoneLevels(zones[0], unlocked);
  }

  function showZoneLevels(zoneName, unlocked) {
    els.zsLevels.innerHTML = '';
    const zoneLevels = LEVELS.filter(l => l.name === zoneName);

    for (const lv of zoneLevels) {
      const idx = LEVELS.indexOf(lv);
      const locked = idx > unlocked;
      const btn = document.createElement('button');
      btn.className = 'card zs-card' + (locked ? ' zs-locked' : '');
      btn.innerHTML = `
        <span class="zs-icon">${locked ? '🔒' : (lv.hasBoss ? '👑' : '🏃')}</span>
        <span class="zs-num">Act ${lv.act}</span>
      `;
      if (!locked) {
        btn.addEventListener('click', () => {
          state.currentLevel = idx;
          buildShopUI();
          showScreen('shop');
        });
      }
      els.zsLevels.appendChild(btn);
    }
  }

  // ===== SHOP =====
  function buildShopUI() {
    const balance = SharedCoins.get();
    els.shopCoinCount.textContent = balance;
    els.shopItems.innerHTML = '';

    for (const item of SHOP_DATA) {
      const owned = item.id !== 'life' && item.id !== 'ring_ten' && persistent.inventory.includes(item.id);
      const btn = document.createElement('button');
      btn.className = 'shop-item' + (owned ? ' shop-item-owned' : '') + (item.price > balance && !owned ? ' shop-item-expensive' : '');
      btn.innerHTML = `
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-desc">${item.desc}</span>
        <span class="shop-item-price">${owned ? '✓ Owned' : `🪙 ${item.price}`}</span>
      `;
      if (!owned && item.price <= balance) {
        btn.addEventListener('click', () => {
          if (!SharedCoins.spend(item.price)) return;
          Audio.SFX.powerup && Audio.SFX.powerup();
          if (item.id === 'life') {
            persistent.lives++;
          } else if (item.id === 'ring_ten') {
            persistent.inventory.push(item.id);
          } else {
            persistent.inventory.push(item.id);
          }
          savePersistent();
          buildShopUI();
        });
      }
      els.shopItems.appendChild(btn);
    }

    updateShopInventory();
  }

  function updateShopInventory() {
    const icons = {
      shield_basic: '🛡️', shield_flame: '🔥', shield_water: '💧',
      shield_lightning: '⚡', speed: '👟', ring_ten: '💍', life: '❤️',
    };
    els.shopInvIcons.textContent = persistent.inventory.map(id => icons[id] || '?').join(' ');
  }

  // ===== PERSISTENCE =====
  function loadPersistent() {
    const saved = Storage.load(GAME_ID, 'persistent', null);
    if (saved) {
      persistent.lives = saved.lives || 3;
      persistent.score = saved.score || 0;
      persistent.inventory = saved.inventory || [];
    }
  }

  function savePersistent() {
    Storage.save(GAME_ID, 'persistent', persistent);
  }

  // ===== CHARACTER PREVIEWS =====
  function renderCharPreviews() {
    els.charCards.forEach(card => {
      const charId = card.dataset.char;
      const canvas = card.querySelector('.char-preview');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const anims = SPRITES.ANIMS[charId];
      if (!anims || !anims.idle || !anims.idle[0]) return;
      const sprite = anims.idle[0];
      const scale = Math.min(canvas.width / sprite.w, canvas.height / sprite.h);
      const ox = (canvas.width - sprite.w * scale) / 2;
      const oy = (canvas.height - sprite.h * scale) / 2;
      for (let y = 0; y < sprite.h; y++) {
        for (let x = 0; x < sprite.w; x++) {
          const c = sprite.pixels[y * sprite.w + x];
          if (c) {
            ctx.fillStyle = c;
            ctx.fillRect(Math.round(ox + x * scale), Math.round(oy + y * scale),
              Math.ceil(scale), Math.ceil(scale));
          }
        }
      }
    });
  }

  // ===== START LEVEL =====
  function startLevel(idx) {
    if (typeof Energy !== 'undefined' && !Energy.canPlay()) {
      showScreen('energyGate');
      return;
    }
    const level = LEVELS[idx];
    if (!level) return;

    // Set zone tileset
    SPRITES.setZone(level.zone);

    // Clear state
    state.rings = [];
    state.scatteredRings = [];
    state.enemies = [];
    state.monitors = [];
    state.springs = [];
    state.checkpoints = [];
    state.dashpads = [];
    state.goals = [];
    state.flickies = [];
    state.projectiles = [];
    state.boss = null;
    state.paused = false;
    state.levelTimer = 0;

    // Spawn entities from level data
    let spawnX = 2, spawnY = 8;
    for (const ent of (level.entities || [])) {
      const px = ent.x * TILE;
      const py = ent.y * TILE;

      switch (ent.type) {
        case 'spawn':
          spawnX = ent.x;
          spawnY = ent.y;
          break;
        case 'ring':
          state.rings.push(Entities.createRing(px, py));
          break;
        case 'ring_line': {
          const count = ent.count || 5;
          const dir = ent.dir || 'h';
          for (let i = 0; i < count; i++) {
            const rx = dir === 'v' ? px : px + i * TILE;
            const ry = dir === 'v' ? py + i * TILE : py;
            state.rings.push(Entities.createRing(rx, ry));
          }
          break;
        }
        case 'ring_arc': {
          const count = ent.count || 5;
          for (let i = 0; i < count; i++) {
            const angle = (i / (count - 1)) * Math.PI;
            const rx = px + Math.cos(angle) * count * 0.6 * TILE;
            const ry = py - Math.sin(angle) * 2 * TILE;
            state.rings.push(Entities.createRing(rx, ry));
          }
          break;
        }
        case 'motobug':
        case 'buzzbomber':
        case 'crabmeat':
        case 'spiny':
        case 'grabber':
        case 'penguinator':
        case 'ballhog':
        case 'caterkiller':
          state.enemies.push(Entities.createEnemy(ent.type, px, py));
          break;
        case 'spring_up':
          state.springs.push(Entities.createSpring(px, py, 'up', ent.strong));
          break;
        case 'monitor': {
          const mappedItem = ITEM_MAP[ent.item] || ent.item;
          state.monitors.push(Entities.createMonitor(px, py, mappedItem));
          break;
        }
        case 'checkpoint':
          state.checkpoints.push(Entities.createCheckpoint(px, py));
          break;
        case 'dashpad':
          state.dashpads.push(Entities.createDashPad(px, py));
          break;
        case 'goal':
          state.goals.push({ x: px, y: py, w: 16, h: 32, reached: false });
          break;
      }
    }

    // Boss
    if (level.hasBoss) {
      state.boss = Entities.createBoss((level.width - 25) * TILE, 6 * TILE);
    }

    // Create players
    const p1 = Entities.createPlayer(state.charType1, 1, spawnX * TILE, spawnY * TILE);
    p1.lives = persistent.lives;
    p1.score = persistent.score;
    p1.respawnX = spawnX * TILE;
    p1.respawnY = spawnY * TILE;
    p1.respawnRings = 0;
    state.players = [p1];

    if (state.coop) {
      const p2 = Entities.createPlayer(state.charType2, 2, spawnX * TILE, (spawnY - 1) * TILE);
      p2.lives = 3;
      p2.respawnX = spawnX * TILE;
      p2.respawnY = (spawnY - 1) * TILE;
      p2.respawnRings = 0;
      state.players.push(p2);
    }

    // Apply shop inventory
    for (const item of persistent.inventory) {
      if (item === 'ring_ten') {
        p1.rings += 10;
      } else if (item === 'life') {
        p1.lives++;
      } else if (item === 'speed') {
        p1.speedBoost = true;
        p1.speedTimer = 1200;
      } else if (item.startsWith('shield_')) {
        p1.shield = item.replace('shield_', '');
      }
    }
    persistent.inventory = [];
    savePersistent();

    // Init canvas and camera
    Engine.initCanvas(els.gameCanvas);
    els.gameCanvas.style.display = 'block';
    Engine.Camera.snapTo(
      p1.x - Engine.Camera.vw / 2,
      p1.y - Engine.Camera.vh / 2
    );

    // Init particles
    if (els.particleCanvas && typeof Particles !== 'undefined') {
      Particles.init(els.particleCanvas);
    }

    // HUD setup
    els.hud.style.display = 'flex';
    els.hudZone.textContent = `${level.name} Act ${level.act}`;

    if (state.coop) {
      els.hudP2.style.display = 'flex';
      const p2Label = els.hudP2Label;
      if (p2Label) p2Label.textContent = state.charType2.charAt(0).toUpperCase() + state.charType2.slice(1);
    } else {
      els.hudP2.style.display = 'none';
    }

    // Fly meter visibility
    const showFly = state.charType1 === 'tails';
    els.hudFlyWrap.style.display = showFly ? 'flex' : 'none';

    // Draw portrait
    renderPortrait();

    // Blur buttons so space/enter go to game
    if (document.activeElement) document.activeElement.blur();

    showScreen('playing');
    Engine.startLoop(update, render);

    // Energy timer
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
          energyDepleted = true;
          state.paused = true;
          Engine.stopLoop();
          if (els.energyOverlay) els.energyOverlay.style.display = 'flex';
        }
      );
    }
  }

  function renderPortrait() {
    const ctx = els.hudPortrait.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    const anims = SPRITES.ANIMS[state.charType1];
    if (!anims || !anims.idle || !anims.idle[0]) return;
    const sprite = anims.idle[0];
    const s = 2;
    const ox = (32 - sprite.w * s) / 2;
    const oy = (32 - sprite.h * s) / 2;
    for (let py = 0; py < sprite.h; py++) {
      for (let px = 0; px < sprite.w; px++) {
        const c = sprite.pixels[py * sprite.w + px];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(Math.round(ox + px * s), Math.round(oy + py * s), s, s);
        }
      }
    }
  }

  // ===== UPDATE =====
  function update() {
    if (state.paused) return;
    state.levelTimer++;

    const level = LEVELS[state.currentLevel];
    const p1 = state.players[0];
    const p2 = state.players[1];

    // Update players
    for (const p of state.players) {
      Entities.updatePlayer(p, level, state.coop, state.enemies);

      // Handle ring scatter request
      if (p.wantsScatterRings > 0) {
        const count = p.wantsScatterRings;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const speed = 2 + Math.random() * 3;
          state.scatteredRings.push(
            Entities.createScatteredRing(p.x + p.w / 2, p.y, angle, speed)
          );
        }
        p.wantsScatterRings = 0;
      }

      // Handle respawn
      if (p.wantsRespawn) {
        if (p.lives > 0) {
          const other = state.players.find(o => o !== p && o.alive);
          Entities.respawnPlayer(p, level, other || null);
        } else if (!state.coop || state.players.every(pl => pl.lives <= 0 && !pl.alive)) {
          onGameOver();
          return;
        }
      }

      // 100 rings = extra life
      if (p.rings >= 100) {
        p.lives++;
        p.rings -= 100;
        Audio.SFX.fanfare && Audio.SFX.fanfare();
      }
    }

    // Update rings
    for (const r of state.rings) {
      Entities.updateRing(r);
    }

    // Update scattered rings
    state.scatteredRings = state.scatteredRings.filter(r =>
      Entities.updateScatteredRing(r, level)
    );

    // Update enemies
    for (const e of state.enemies) {
      Entities.updateEnemy(e, level, state.players);
    }

    // Update springs
    for (const s of state.springs) {
      Entities.updateSpring(s);
    }

    // Update checkpoints
    for (const cp of state.checkpoints) {
      Entities.updateCheckpoint(cp);
    }

    // Update boss
    if (state.boss) {
      Entities.updateBoss(state.boss, level, state.players);

      // Boss projectile
      if (state.boss.wantsProjectile) {
        state.boss.wantsProjectile = false;
        const target = state.players.find(p => p.alive);
        if (target) {
          const dx = target.x - state.boss.x;
          const dy = target.y - state.boss.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          state.projectiles.push({
            x: state.boss.x + state.boss.w / 2,
            y: state.boss.y + state.boss.h,
            w: 8, h: 8,
            vx: (dx / dist) * 3,
            vy: (dy / dist) * 3,
            life: 180,
            owner: 'boss',
          });
        }
      }
    }

    // Update projectiles
    state.projectiles = state.projectiles.filter(pr => {
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life--;
      return pr.life > 0;
    });

    // Update flickies (from defeated enemies — they store their own)
    // Boss flickies handled by renderBoss

    // ===== COLLISIONS =====
    for (const p of state.players) {
      if (!p.alive || p.invincible) continue;

      // Player vs rings
      for (const r of state.rings) {
        if (r.collected) continue;
        if (Engine.overlap(p, r)) {
          r.collected = true;
          p.rings++;
          p.score += 10;
          Audio.SFX.coin && Audio.SFX.coin();
        }
      }

      // Player vs scattered rings (collectible after delay)
      for (const r of state.scatteredRings) {
        if (r.collected || r.collectTimer > 0) continue;
        if (Engine.overlap(p, r)) {
          r.collected = true;
          p.rings++;
          p.score += 10;
          Audio.SFX.coin && Audio.SFX.coin();
        }
      }

      // Lightning shield ring attraction
      if (p.shield === 'lightning') {
        for (const r of state.rings) {
          if (r.collected) continue;
          const dist = Math.hypot(r.x - p.x, r.y - p.y);
          if (dist < 64) {
            r.x += (p.x - r.x) * 0.15;
            r.y += (p.y - r.y) * 0.15;
          }
        }
        for (const r of state.scatteredRings) {
          if (r.collected || r.collectTimer > 0) continue;
          const dist = Math.hypot(r.x - p.x, r.y - p.y);
          if (dist < 64) {
            r.x += (p.x - r.x) * 0.15;
            r.y += (p.y - r.y) * 0.15;
          }
        }
      }
    }

    // Player vs enemies
    for (const p of state.players) {
      if (!p.alive) continue;

      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (!Engine.overlap(p, e)) continue;

        // Check if player is spinning (attacking)
        if (p.spinning || p.rolling || p.invincibilityPower ||
            (p.skillActive && (p.charType === 'amy' || p.charType === 'knuckles'))) {
          // Spiny: can't stomp (spikes on top), only horizontal spin
          if (e.noStomp && Engine.stompCheck(p, e)) {
            Entities.hurtPlayer(p);
          } else {
            Entities.defeatEnemy(e, p);
            p.vy = -4; // Bounce off enemy
          }
        } else if (Engine.stompCheck(p, e) && !e.noStomp) {
          // Stomp from above
          Entities.defeatEnemy(e, p);
          p.vy = -6;
        } else {
          // Player takes damage
          Entities.hurtPlayer(p);
        }
      }

      // Player vs monitors
      for (const m of state.monitors) {
        if (!m.alive) continue;
        if (!Engine.overlap(p, m)) continue;
        // Must be spinning or stomping to break
        if (p.spinning || p.rolling || Engine.stompCheck(p, m)) {
          Entities.applyMonitorItem(m, p);
          if (p.spinning || p.rolling) {
            // Continue through
          } else {
            p.vy = -4; // Bounce off
          }
        }
      }

      // Player vs springs
      for (const s of state.springs) {
        if (Engine.overlap(p, s)) {
          Entities.applySpring(s, p);
        }
      }

      // Player vs checkpoints
      for (const cp of state.checkpoints) {
        if (!cp.activated && Engine.overlap(p, cp)) {
          Entities.activateCheckpoint(cp, p);
        }
      }

      // Player vs dashpads
      for (const d of state.dashpads) {
        if (Engine.overlap(p, d) && p.onGround) {
          Entities.applyDashPad(d, p);
        }
      }

      // Player vs boss
      if (state.boss && state.boss.alive && Engine.overlap(p, state.boss)) {
        if (p.spinning || p.rolling || p.invincibilityPower) {
          Entities.hitBoss(state.boss, p);
        } else {
          Entities.hurtPlayer(p);
        }
      }

      // Player vs boss projectiles
      for (const pr of state.projectiles) {
        if (pr.owner === 'boss' && Engine.overlap(p, pr)) {
          Entities.hurtPlayer(p);
          pr.life = 0;
        }
      }

      // Player vs goal
      for (const g of state.goals) {
        if (!g.reached && Engine.overlap(p, g)) {
          g.reached = true;
          onLevelComplete();
          return;
        }
      }
    }

    // Boss defeated → goal becomes reachable (it's already there, boss just blocks path)
    if (state.boss && !state.boss.alive && state.boss.defeatedTimer > 90) {
      // Auto-complete if boss is dead and no goal exists
      if (state.goals.length === 0 || state.goals.every(g => !g.reached)) {
        const hasGoal = state.goals.some(g => !g.reached);
        if (!hasGoal) {
          onLevelComplete();
          return;
        }
      }
    }

    // Camera
    if (state.coop && p2 && p2.alive) {
      Engine.Camera.followTwo(p1, p2);
    } else {
      Engine.Camera.followOne(p1);
    }
    Engine.Camera.update(level.width, level.height);
  }

  // ===== RENDER =====
  function render(ctx, cw, ch) {
    const level = LEVELS[state.currentLevel];
    const cam = Engine.Camera;

    // Background
    Engine.renderBg(ctx, level, cam, cw, ch);

    // Tiles
    Engine.renderTiles(ctx, level, cam);

    // Goals
    for (const g of state.goals) {
      const [sx, sy] = cam.worldToScreen(g.x, g.y);
      Engine.drawSprite(ctx, SPRITES.GOAL_POST, sx, sy, false);
    }

    // Dash pads
    for (const d of state.dashpads) {
      Entities.renderDashPad(ctx, d, cam);
    }

    // Springs
    for (const s of state.springs) {
      Entities.renderSpring(ctx, s, cam);
    }

    // Checkpoints
    for (const cp of state.checkpoints) {
      Entities.renderCheckpoint(ctx, cp, cam);
    }

    // Monitors
    for (const m of state.monitors) {
      Entities.renderMonitor(ctx, m, cam);
    }

    // Rings
    for (const r of state.rings) {
      Entities.renderRing(ctx, r, cam);
    }

    // Scattered rings
    for (const r of state.scatteredRings) {
      Entities.renderScatteredRing(ctx, r, cam);
    }

    // Enemies
    for (const e of state.enemies) {
      Entities.renderEnemy(ctx, e, cam);
    }

    // Projectiles
    for (const pr of state.projectiles) {
      const [sx, sy] = cam.worldToScreen(pr.x, pr.y);
      ctx.fillStyle = pr.owner === 'boss' ? '#FF5722' : '#FFD740';
      ctx.beginPath();
      ctx.arc(sx + 4 * SCALE, sy + 4 * SCALE, 4 * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }

    // Boss
    if (state.boss) {
      Entities.renderBoss(ctx, state.boss, cam);
    }

    // Players (render on top)
    for (const p of state.players) {
      Entities.renderPlayer(ctx, p, cam);
    }

    // Speed lines overlay
    const p1 = state.players[0];
    if (p1 && p1.alive) {
      const speed = Math.abs(p1.vx);
      Engine.renderSpeedLines(ctx, cw, ch, speed);
    }

    // Update HUD
    updateHUD();
  }

  // ===== HUD =====
  function updateHUD() {
    const p1 = state.players[0];
    if (!p1) return;

    els.hudRings.textContent = `💍 ${p1.rings}`;
    els.hudRings.classList.toggle('hud-rings-zero', p1.rings === 0);
    els.hudScore.textContent = `Score: ${p1.score}`;
    els.hudLives.textContent = '❤️'.repeat(Math.max(0, Math.min(p1.lives, 9)));

    // Speed meter
    const speed = Math.abs(p1.vx);
    const maxDisplay = 12;
    const pct = Math.min(speed / maxDisplay, 1) * 100;
    els.hudSpeedBar.style.width = pct + '%';

    // Shield indicator
    const shieldIcons = { basic: '🛡️', flame: '🔥', water: '💧', lightning: '⚡' };
    els.hudShield.textContent = p1.shield ? shieldIcons[p1.shield] || '' : '';

    // Skill cooldown
    if (p1.skillCooldown > 0) {
      els.hudSkill.textContent = `🔄 ${Math.ceil(p1.skillCooldown / 60)}s`;
    } else {
      const skillIcons = { sonic: '🎯', tails: '🌪️', knuckles: '👊', shadow: '⚡', amy: '🔨' };
      els.hudSkill.textContent = skillIcons[p1.charType] || 'Q';
    }

    // Fly meter (Tails)
    if (p1.charType === 'tails' && els.hudFlyWrap) {
      els.hudFlyWrap.style.display = 'flex';
      const flyPct = (1 - p1.flyMeter / p1.flyMeterMax) * 100;
      els.hudFlyBar.style.width = (100 - flyPct) + '%';
    }

    // P2 HUD
    if (state.coop && state.players[1]) {
      const p2 = state.players[1];
      els.hudP2Lives.textContent = '💚'.repeat(Math.max(0, Math.min(p2.lives, 9)));
    }
  }

  // ===== LEVEL TRANSITIONS =====
  function onLevelComplete() {
    Engine.stopLoop();
    if (typeof Energy !== 'undefined') Energy.stopTimer();

    const p1 = state.players[0];
    Audio.SFX.fanfare && Audio.SFX.fanfare();
    if (typeof Particles !== 'undefined') Particles.confetti && Particles.confetti(60);

    // Convert remaining rings to SharedCoins
    const ringsEarned = p1.rings;
    if (ringsEarned > 0) {
      SharedCoins.add(ringsEarned);
    }

    // Save progress
    persistent.lives = p1.lives;
    persistent.score = p1.score;
    savePersistent();

    const prevUnlocked = Storage.load(GAME_ID, 'unlockedLevel', 0);
    Storage.save(GAME_ID, 'unlockedLevel', Math.max(prevUnlocked, state.currentLevel + 1));
    Storage.save(GAME_ID, 'highScore',
      Math.max(Storage.load(GAME_ID, 'highScore', 0), p1.score));

    if (state.currentLevel >= LEVELS.length - 1) {
      setTimeout(() => onVictory(), 1000);
    } else {
      const level = LEVELS[state.currentLevel];
      els.lcTitle.textContent = `${level.name} Act ${level.act} Complete!`;
      els.lcStats.textContent = `💍 ${ringsEarned} rings → 🪙 ${ringsEarned} coins · Score: ${p1.score}`;

      els.energyOverlay.style.display = 'none';
      showScreen('levelComplete');
    }
  }

  function onGameOver() {
    Engine.stopLoop();
    if (typeof Energy !== 'undefined') Energy.stopTimer();

    const p1 = state.players[0];
    Audio.SFX.die && Audio.SFX.die();
    els.goScore.textContent = `Score: ${p1.score} · 💍 ${p1.rings} rings`;
    els.energyOverlay.style.display = 'none';
    showScreen('gameOver');
  }

  function onVictory() {
    Engine.stopLoop();
    if (typeof Energy !== 'undefined') Energy.stopTimer();

    const p1 = state.players[0];
    Audio.SFX.fanfare && Audio.SFX.fanfare();
    if (typeof Particles !== 'undefined') {
      Particles.confetti && Particles.confetti(60);
      Particles.rainbowExplosion && Particles.rainbowExplosion();
    }

    els.victoryStats.textContent = `Final Score: ${p1.score} · All ${LEVELS.length} acts cleared!`;
    els.energyOverlay.style.display = 'none';
    showScreen('victory');
  }

  // ===== BOOT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
