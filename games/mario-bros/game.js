/**
 * Super Mario Bros — Game orchestrator.
 * State machine, screen flow, HUD, entity management, co-op logic.
 */
const Game = (() => {
  const GAME_ID = 'mario-bros';

  let state = {
    screen: 'title',
    mode: '1p',
    charType: 'mario',
    currentLevel: 0,
    players: [],
    enemies: [],
    coins: [],
    powerups: [],
    projectiles: [],
    flags: [],
    levelTimer: 0,
    paused: false,
    coop: false,
  };

  let els = {};

  // ===== INIT =====

  function init() {
    Audio.init();
    cacheDOM();
    Engine.Input.init();
    Engine.initCanvas(els.gameCanvas);
    Particles.init(els.particleCanvas);
    bindEvents();
    renderCharPreviews();

    const saved = Storage.load(GAME_ID, 'level', 0);
    if (saved > 0 && saved < LEVELS.length) {
      els.continueWrapper.style.display = 'flex';
      els.continueInfo.textContent = `Level ${saved + 1} of ${LEVELS.length}`;
    }

    showScreen('title');
  }

  function cacheDOM() {
    els.gameCanvas = document.getElementById('gameCanvas');
    els.particleCanvas = document.querySelector('.particle-canvas');
    els.hud = document.querySelector('.game-hud');
    els.screens = {
      title: document.querySelector('.title-screen'),
      charSelect: document.querySelector('.char-select-screen'),
      levelComplete: document.querySelector('.level-complete-screen'),
      gameOver: document.querySelector('.game-over-screen'),
      victory: document.querySelector('.victory-screen'),
    };
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');
    els.hudLives = document.querySelector('.hud-lives');
    els.hudCoins = document.querySelector('.hud-coins');
    els.hudLevel = document.querySelector('.hud-level');
    els.hudScore = document.querySelector('.hud-score');
    els.hudPower = document.querySelector('.hud-powerup');
    els.hudP2 = document.querySelector('.hud-p2');
    els.hudP2Lives = document.querySelector('.hud-p2-lives');
    els.lcTitle = document.querySelector('.lc-title');
    els.lcStats = document.querySelector('.lc-stats');
    els.lcPowerPreview = document.querySelector('.lc-powerup-preview');
    els.goScore = document.querySelector('.go-score');
    els.vicStats = document.querySelector('.victory-stats');
  }

  function bindEvents() {
    document.addEventListener('click', () => Audio.init(), { once: true });
    document.addEventListener('keydown', () => Audio.init(), { once: true });

    document.querySelector('.btn-1p').addEventListener('click', () => {
      Audio.SFX.tap();
      state.mode = '1p';
      state.coop = false;
      showScreen('charSelect');
    });

    document.querySelector('.btn-2p').addEventListener('click', () => {
      Audio.SFX.tap();
      state.mode = '2p';
      state.coop = true;
      startLevel(0);
    });

    const contBtn = document.querySelector('.btn-continue');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        const saved = Storage.load(GAME_ID, 'level', 0);
        state.charType = Storage.load(GAME_ID, 'charType', 'mario');
        state.mode = '1p';
        state.coop = false;
        startLevel(saved);
      });
    }

    // Back button (char select → title)
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Audio.SFX.tap();
        showScreen('title');
      });
    });

    document.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        Audio.SFX.tap();
        state.charType = card.dataset.char;
        startLevel(0);
      });
    });

    document.querySelector('.btn-next-level').addEventListener('click', () => {
      Audio.SFX.tap();
      startLevel(state.currentLevel + 1);
    });

    document.querySelector('.btn-retry').addEventListener('click', () => {
      Audio.SFX.tap();
      startLevel(state.currentLevel);
    });

    document.querySelectorAll('.btn-home').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.SFX.tap();
        window.location.href = '../../index.html';
      });
    });

    document.querySelector('.btn-play-again').addEventListener('click', () => {
      Audio.SFX.tap();
      Storage.clearGame(GAME_ID);
      els.continueWrapper.style.display = 'none';
      showScreen('title');
    });

    // Pause on Escape
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape' && state.screen === 'playing') {
        state.paused = !state.paused;
      }
    });
  }

  function renderCharPreviews() {
    document.querySelectorAll('.char-preview').forEach(c => {
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const charType = c.closest('.char-card').dataset.char;
      const sprite = SPRITES.ANIMS[charType].idle[0];
      // Draw centered at 4x scale
      const s = 4;
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

  // ===== SCREEN MANAGEMENT =====

  function showScreen(name) {
    state.screen = name;
    Object.values(els.screens).forEach(s => s && s.classList.remove('active'));
    if (els.screens[name]) els.screens[name].classList.add('active');

    const isPlaying = name === 'playing';
    els.hud.style.display = isPlaying ? 'flex' : 'none';
    els.gameCanvas.style.opacity = isPlaying ? '1' : '0';

    if (!isPlaying) {
      Engine.stopLoop();
      Particles.clear();
    }
  }

  // ===== LEVEL LIFECYCLE =====

  function startLevel(levelIndex) {
    if (levelIndex >= LEVELS.length) {
      onVictory();
      return;
    }

    state.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];

    state.enemies = [];
    state.coins = [];
    state.powerups = [];
    state.projectiles = [];
    state.flags = [];
    state.levelTimer = 0;

    let spawnX = 3 * Engine.TILE;
    let spawnY = 10 * Engine.TILE;

    for (const e of level.entities) {
      const wx = e.x * Engine.TILE;
      const wy = e.y * Engine.TILE;
      switch (e.type) {
        case 'spawn':
          spawnX = wx;
          spawnY = wy;
          break;
        case 'goomba':
          state.enemies.push(Entities.createGoomba(wx, wy));
          break;
        case 'koopa_fly': {
          const k = Entities.createKoopaFly(wx, wy);
          k.baseX = wx;
          state.enemies.push(k);
          break;
        }
        case 'coin':
          state.coins.push(Entities.createCoin(wx, wy));
          break;
        case 'coin_row':
          for (let i = 0; i < (e.count || 3); i++) {
            state.coins.push(Entities.createCoin(wx + i * Engine.TILE, wy));
          }
          break;
        case 'flag':
          // Find the F tile in the map and place flag there
          break;
      }
    }

    // Find flag tile position from map
    for (let r = 0; r < level.height; r++) {
      for (let c = 0; c < level.width; c++) {
        if (level.tiles[r][c] === 14) {
          // Place flag entity so its bottom aligns with the ground below
          state.flags.push(Entities.createFlag(c * Engine.TILE, (r - 2) * Engine.TILE));
          level.tiles[r][c] = 0;
          // Ensure there's ground under and around the flag
          for (let gc = c - 2; gc <= c + 2; gc++) {
            if (gc >= 0 && gc < level.width && r + 1 < level.height) {
              if (!level.tiles[r + 1][gc]) level.tiles[r + 1][gc] = 1;
            }
          }
        }
      }
    }

    // Create players
    if (state.coop) {
      state.players = [
        Entities.createPlayer('mario', 1, spawnX, spawnY),
        Entities.createPlayer('luigi', 2, spawnX + 24, spawnY),
      ];
    } else {
      state.players = [
        Entities.createPlayer(state.charType, 1, spawnX, spawnY),
      ];
    }

    // Save progress
    Storage.save(GAME_ID, 'level', levelIndex);
    Storage.save(GAME_ID, 'charType', state.charType);

    // Show co-op HUD
    els.hudP2.style.display = state.coop ? 'flex' : 'none';

    // Blur any focused button so Space/Enter go to the game, not the button
    if (document.activeElement) document.activeElement.blur();

    showScreen('playing');
    Engine.startLoop(update, render);
  }

  // ===== UPDATE =====

  function update() {
    if (state.paused) return;
    state.levelTimer++;
    const level = LEVELS[state.currentLevel];

    // Update players
    for (const p of state.players) {
      Entities.updatePlayer(p, level, state.coop);

      // Handle block hits
      if (p.alive && p.hitBlock) {
        handleBlockHit(p, p.hitBlock, level);
      }

      // Handle shooting
      if (p.alive && p.wantsShoot) {
        state.projectiles.push(Entities.createProjectile(p));
      }
    }

    // Update enemies
    state.enemies = state.enemies.filter(e => Entities.updateEnemy(e, level));

    // Update coins
    state.coins = state.coins.filter(c => Entities.updateCoin(c));

    // Update power-ups
    state.powerups = state.powerups.filter(pu => Entities.updatePowerUp(pu, level));

    // Update projectiles
    state.projectiles = state.projectiles.filter(pr => Entities.updateProjectile(pr, level));

    // === COLLISIONS ===

    for (const p of state.players) {
      if (!p.alive) continue;

      // Player vs enemies
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (!Engine.overlap(p, e)) continue;

        if (p.invincible) {
          Entities.defeatEnemy(e, p);
          spawnDefeatEffect(e);
          Audio.SFX.stomp();
        } else if (Engine.stompCheck(p, e)) {
          Entities.defeatEnemy(e, p);
          p.vy = -6;
          spawnDefeatEffect(e);
          Audio.SFX.stomp();
        } else {
          Entities.hurtPlayer(p);
        }
      }

      // Player vs coins
      for (const c of state.coins) {
        if (c.collected) continue;
        if (Engine.overlap(p, c)) {
          Entities.collectCoin(c, p);
          spawnCoinEffect(c);
        }
      }

      // Player vs power-ups
      for (const pu of state.powerups) {
        if (pu.collected || pu.emergeTimer > 0) continue;
        if (Engine.overlap(p, pu)) {
          pu.collected = true;
          Entities.applyPowerUp(p, pu.powerType);
          spawnPowerEffect(pu);
        }
      }

      // Player vs flag
      for (const f of state.flags) {
        if (f.reached) continue;
        if (Engine.overlap(p, f)) {
          f.reached = true;
          onLevelComplete();
          return;
        }
      }
    }

    // Projectile vs enemies
    for (const pr of state.projectiles) {
      if (!pr.alive) continue;
      for (const e of state.enemies) {
        if (!e.alive) continue;
        if (Engine.overlap(pr, e)) {
          Entities.defeatEnemy(e, state.players[0]);
          pr.alive = false;
          spawnDefeatEffect(e);
          Audio.SFX.stomp();
        }
      }
    }

    // Camera
    const alive = state.players.filter(p => p.alive);
    if (alive.length >= 2) {
      Engine.Camera.followTwo(alive[0], alive[1]);
    } else if (alive.length === 1) {
      Engine.Camera.followOne(alive[0]);
    }
    Engine.Camera.update(level.width, level.height);

    // Check game over
    const allDead = state.players.every(p => !p.alive && p.lives <= 0);
    if (allDead) {
      setTimeout(() => onGameOver(), 1500);
      return;
    }

    // Respawn dead players with remaining lives
    for (const p of state.players) {
      if (!p.alive && p.lives > 0) {
        p.respawnTimer++;
        if (p.respawnTimer > 120) {
          const other = state.players.find(o => o !== p && o.alive);
          Entities.respawnPlayer(p, LEVELS[state.currentLevel], other);
        }
      }
    }
  }

  function handleBlockHit(player, block, level) {
    const { col, row, type } = block;

    if (type === 'break') {
      // Break brick
      level.tiles[row][col] = 0;
      Audio.SFX.stomp();
      return;
    }

    if (type === 3) {
      // Regular ? block — spawn coin
      level.tiles[row][col] = 0; // Make empty (ideally would use TILE_QUESTION_EMPTY)
      const cx = col * Engine.TILE + 2;
      const cy = (row - 1) * Engine.TILE;
      const coin = Entities.createCoin(cx, cy);
      Entities.collectCoin(coin, player);
      spawnCoinEffect(coin);
    }

    if (type === 4) {
      // Power-up ? block
      level.tiles[row][col] = 0;
      const px = col * Engine.TILE;
      const py = row * Engine.TILE;
      const levelDef = LEVELS[state.currentLevel];
      state.powerups.push(Entities.createPowerUp(levelDef.powerUp, px, py));
    }
  }

  // ===== PARTICLE EFFECTS =====

  function spawnCoinEffect(coin) {
    const [sx, sy] = Engine.Camera.worldToScreen(coin.x + 6, coin.y + 8);
    Particles.sparkle(sx, sy, 8, '#FFD700');
  }

  function spawnDefeatEffect(enemy) {
    const [sx, sy] = Engine.Camera.worldToScreen(enemy.x + 8, enemy.y + 8);
    Particles.sparkle(sx, sy, 12, '#FF6B00');
  }

  function spawnPowerEffect(pu) {
    const [sx, sy] = Engine.Camera.worldToScreen(pu.x + 8, pu.y + 8);
    Particles.sparkle(sx, sy, 15, '#00FF00');
  }

  // ===== RENDER =====

  function render(ctx, cw, ch) {
    const level = LEVELS[state.currentLevel];
    const cam = Engine.Camera;

    Engine.renderBg(ctx, level, cam, cw, ch);
    Engine.renderTiles(ctx, level, cam);

    // Coins
    for (const c of state.coins) {
      Entities.renderCoin(ctx, c, cam);
    }

    // Power-ups
    for (const pu of state.powerups) {
      Entities.renderPowerUp(ctx, pu, cam);
    }

    // Enemies
    for (const e of state.enemies) {
      Entities.renderEnemy(ctx, e, cam);
    }

    // Players
    for (const p of state.players) {
      Entities.renderPlayer(ctx, p, cam);
    }

    // Projectiles
    for (const pr of state.projectiles) {
      Entities.renderProjectile(ctx, pr, cam);
    }

    // Flags
    for (const f of state.flags) {
      Entities.renderFlag(ctx, f, cam);
    }

    // Pause overlay
    if (state.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Fredoka One, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', cw / 2, ch / 2);
      ctx.font = '20px Nunito, sans-serif';
      ctx.fillText('Press ESC to resume', cw / 2, ch / 2 + 40);
    }

    updateHUD();
  }

  // ===== HUD =====

  function updateHUD() {
    const p1 = state.players[0];
    if (!p1) return;

    els.hudLives.textContent = '❤️'.repeat(Math.max(0, p1.lives));
    els.hudCoins.textContent = `🪙 ${p1.coins}`;
    els.hudScore.textContent = `Score: ${p1.score}`;
    els.hudLevel.textContent = `${LEVELS[state.currentLevel].name}`;

    const powerIcons = { ice: '❄️', fire: '🔥', wings: '🪽', star: '⭐', mushroom: '🍄' };
    els.hudPower.textContent = p1.powerUp ? powerIcons[p1.powerUp] || '' : '';

    if (state.coop && state.players[1]) {
      const p2 = state.players[1];
      els.hudP2Lives.textContent = '💚'.repeat(Math.max(0, p2.lives));
    }
  }

  // ===== LEVEL TRANSITIONS =====

  function onLevelComplete() {
    Engine.stopLoop();
    Audio.SFX.fanfare();
    Particles.confetti(60);

    const p1 = state.players[0];
    Storage.save(GAME_ID, 'level', state.currentLevel + 1);
    Storage.save(GAME_ID, 'highScore',
      Math.max(Storage.load(GAME_ID, 'highScore', 0), p1.score));

    if (state.currentLevel >= LEVELS.length - 1) {
      setTimeout(() => onVictory(), 1000);
    } else {
      els.lcTitle.textContent = `Level ${state.currentLevel + 1} Complete!`;
      els.lcStats.textContent = `🪙 ${p1.coins} coins · Score: ${p1.score}`;

      const nextPower = LEVELS[state.currentLevel + 1].powerUp;
      const powerNames = { ice: '❄️ Ice Power', fire: '🔥 Fire Power', wings: '🪽 Wings', star: '⭐ Star Power', mushroom: '🍄 Super Mushroom' };
      els.lcPowerPreview.textContent = `Next: ${powerNames[nextPower] || nextPower}`;

      showScreen('levelComplete');
    }
  }

  function onGameOver() {
    Engine.stopLoop();
    const p1 = state.players[0];
    els.goScore.textContent = `Score: ${p1.score} · 🪙 ${p1.coins} coins`;
    showScreen('gameOver');
  }

  function onVictory() {
    Engine.stopLoop();
    Audio.SFX.celebration();
    Particles.confetti(100);

    const p1 = state.players[0];
    els.vicStats.textContent = `Final Score: ${p1.score} · 🪙 ${p1.coins} coins`;
    Storage.clearGame(GAME_ID);
    showScreen('victory');

    setTimeout(() => Particles.confetti(60), 1500);
  }

  // ===== BOOT =====
  document.addEventListener('DOMContentLoaded', init);

  return { state };
})();
