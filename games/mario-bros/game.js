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
    gems: [],
    scorePopups: [],
    levelTimer: 0,
    paused: false,
    coop: false,
  };

  let els = {};

  // Persists between levels (coins, score, lives, powers)
  let persistent = { coins: 0, score: 0, lives: 3, powerStack: [] };

  function resetPersistent() {
    persistent = { coins: 0, score: 0, lives: 3, powerStack: [] };
  }

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
      shop: document.querySelector('.shop-screen'),
    };
    els.shopCoinCount = document.querySelector('.shop-coin-count');
    els.shopItems = document.querySelector('.shop-items');
    els.shopInvIcons = document.querySelector('.shop-inv-icons');
    els.continueWrapper = document.querySelector('.continue-wrapper');
    els.continueInfo = document.querySelector('.continue-info');
    els.hudLives = document.querySelector('.hud-lives');
    els.hudCoins = document.querySelector('.hud-coins');
    els.hudLevel = document.querySelector('.hud-level');
    els.hudScore = document.querySelector('.hud-score');
    els.hudPower = document.querySelector('.hud-powerup');
    els.hudSkill = document.querySelector('.hud-skill');
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
      resetPersistent();
      startLevel(0);
    });

    const contBtn = document.querySelector('.btn-continue');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        Audio.SFX.tap();
        const saved = Storage.load(GAME_ID, 'level', 0);
        state.charType = Storage.load(GAME_ID, 'charType', 'mario');
        persistent = Storage.load(GAME_ID, 'persistent', { coins: 0, score: 0, lives: 3, powerStack: [] });
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
        resetPersistent();
        startLevel(0);
      });
    });

    document.querySelector('.btn-next-level').addEventListener('click', () => {
      Audio.SFX.tap();
      if (!state.coop) {
        showShop();
      } else {
        startLevel(state.currentLevel + 1);
      }
    });

    document.querySelector('.btn-start-level').addEventListener('click', () => {
      Audio.SFX.tap();
      startLevel(state.currentLevel + 1);
    });

    document.querySelector('.btn-retry').addEventListener('click', () => {
      Audio.SFX.tap();
      persistent.lives = 3;
      persistent.coins = 0;
      persistent.powerStack = [];
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

    // Store original tiles on first load, clone from originals on every start
    if (!level._originalTiles) {
      level._originalTiles = level.tiles.map(row => [...row]);
    }
    level.tiles = level._originalTiles.map(row => [...row]);

    state.enemies = [];
    state.coins = [];
    state.powerups = [];
    state.projectiles = [];
    state.flags = [];
    state.gems = [];
    state.scorePopups = [];
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
        case 'piranha':
          state.enemies.push(Entities.createPiranha(wx, wy));
          break;
        case 'boo':
          state.enemies.push(Entities.createBoo(wx, wy));
          break;
        case 'beetle':
          state.enemies.push(Entities.createBeetle(wx, wy));
          break;
        case 'bobomb':
          state.enemies.push(Entities.createBobomb(wx, wy));
          break;
        case 'gem':
          state.gems.push(Entities.createGem(wx, wy));
          break;
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

    // Apply persistent state to player 1 (single player only)
    if (!state.coop) {
      const p1 = state.players[0];
      p1.coins = persistent.coins;
      p1.score = persistent.score;
      p1.lives = persistent.lives;
      for (const power of persistent.powerStack) {
        Entities.applyPowerUp(p1, power);
      }
    }

    // Save progress
    Storage.save(GAME_ID, 'level', levelIndex);
    Storage.save(GAME_ID, 'charType', state.charType);
    Storage.save(GAME_ID, 'persistent', persistent);

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

      // Ground pound landing
      if (p.alive && p.groundPoundLanded) {
        p.groundPoundLanded = false;
        const [gpx, gpy] = Engine.Camera.worldToScreen(p.x + p.w / 2, p.y + p.h);
        Particles.sparkle(gpx, gpy, 20, '#FF6B00');
        Audio.SFX.stomp();
        for (const e of state.enemies) {
          if (!e.alive) continue;
          const dx = Math.abs((e.x + e.w / 2) - (p.x + p.w / 2));
          const dy = Math.abs((e.y + e.h / 2) - (p.y + p.h));
          if (dx < 32 && dy < 16) {
            Entities.defeatEnemy(e, p);
            spawnDefeatEffect(e);
          }
        }
      }

      // Dash skill: defeat enemies on contact
      if (p.alive && p.skillActive && p.skill === 'dash') {
        for (const e of state.enemies) {
          if (!e.alive) continue;
          if (Engine.overlap(p, e)) {
            Entities.defeatEnemy(e, p);
            spawnDefeatEffect(e);
            Audio.SFX.stomp();
          }
        }
      }
    }

    // Update enemies
    state.enemies = state.enemies.filter(e => {
      const wasLit = e.type === 'bobomb' && e.lit;
      const alive = Entities.updateEnemy(e, level, state.players);
      // Bob-omb explosion
      if (!alive && wasLit && e.type === 'bobomb') {
        handleBobombExplosion(e);
      }
      return alive;
    });

    // Magnet pull: attract coins toward players with magnet power
    for (const p of state.players) {
      if (!p.alive || !Entities.hasPower(p, 'magnet')) continue;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      for (const c of state.coins) {
        if (c.collected) continue;
        const dx = px - (c.x + c.w / 2);
        const dy = py - (c.y + c.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 96 && dist > 1) {
          c.x += dx * 0.05;
          c.y += dy * 0.05;
        }
      }
    }

    // Update coins
    state.coins = state.coins.filter(c => Entities.updateCoin(c));

    // Update gems
    state.gems = state.gems.filter(g => Entities.updateGem(g));

    // Update power-ups
    state.powerups = state.powerups.filter(pu => Entities.updatePowerUp(pu, level));

    // Update projectiles
    state.projectiles = state.projectiles.filter(pr => Entities.updateProjectile(pr, level));

    // Update score popups
    state.scorePopups = state.scorePopups.filter(sp => {
      sp.y -= 0.5;
      sp.life--;
      return sp.life > 0;
    });

    // === COLLISIONS ===

    for (const p of state.players) {
      if (!p.alive) continue;

      // Player vs enemies
      for (const e of state.enemies) {
        if (!e.alive) continue;
        // Piranha: only collide when exposed or rising/sinking partially
        if (e.type === 'piranha' && e.phase === 'hidden') continue;
        if (!Engine.overlap(p, e)) continue;

        if (p.invincible) {
          if (e.type === 'bobomb') {
            // Star triggers explosion
            e.lit = true;
            e.fuseTimer = 1;
          } else {
            Entities.defeatEnemy(e, p);
            spawnDefeatEffect(e);
            Audio.SFX.stomp();
          }
        } else if (Engine.stompCheck(p, e)) {
          if (e.noStomp) {
            // Piranha and Boo can't be stomped
            Entities.hurtPlayer(p);
          } else if (e.type === 'beetle') {
            if (e.shellState === 'walking') {
              // Stomp: retract into shell
              e.shellState = 'shell';
              e.shellTimer = 180; // 3 seconds
              e.vx = 0;
              e.h = 12;
              p.vy = -6;
              p.score += e.scoreValue;
              Audio.SFX.stomp();
            } else if (e.shellState === 'sliding') {
              // Stop sliding shell
              e.shellState = 'shell';
              e.shellTimer = 180;
              e.vx = 0;
              p.vy = -6;
              Audio.SFX.stomp();
            } else {
              // Shell: kick it
              e.shellState = 'sliding';
              e.vx = p.x < e.x ? 5 : -5;
              e.shellTimer = 0;
              p.score += 50;
              spawnScorePopup(e.x + 6, e.y - 8, '+50');
              Audio.SFX.stomp();
            }
          } else if (e.type === 'bobomb') {
            if (!e.lit) {
              // Light the fuse
              e.lit = true;
              e.fuseTimer = 180; // 3 seconds
              p.vy = -6;
              p.score += e.scoreValue;
              Audio.SFX.stomp();
            } else {
              p.vy = -6;
            }
          } else {
            Entities.defeatEnemy(e, p);
            p.vy = -6;
            spawnDefeatEffect(e);
            Audio.SFX.stomp();
          }
        } else {
          // Side collision
          if (e.type === 'beetle' && e.shellState === 'shell') {
            // Kick stationary shell
            e.shellState = 'sliding';
            e.vx = p.x < e.x ? 5 : -5;
            e.shellTimer = 0;
            p.score += 50;
            spawnScorePopup(e.x + 6, e.y - 8, '+50');
            Audio.SFX.stomp();
          } else if (e.type === 'beetle' && e.shellState === 'sliding') {
            Entities.hurtPlayer(p);
          } else {
            Entities.hurtPlayer(p);
          }
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

      // Player vs gems
      for (const g of state.gems) {
        if (g.collected) continue;
        if (Engine.overlap(p, g)) {
          Entities.collectGem(g, p);
          const [gsx, gsy] = Engine.Camera.worldToScreen(g.x + 6, g.y + 8);
          Particles.sparkle(gsx, gsy, 15, '#4444FF');
          spawnScorePopup(g.x + 6, g.y, '+500');
          // Collect all 3 gems = extra life
          if (p.gems >= 3) {
            p.lives++;
            spawnScorePopup(p.x, p.y - 16, '+1 UP!');
          }
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
          if (e.type === 'bobomb') {
            // Projectile triggers bob-omb explosion
            e.lit = true;
            e.fuseTimer = 1;
          } else {
            Entities.defeatEnemy(e, state.players[0]);
            spawnDefeatEffect(e);
          }
          pr.alive = false;
          Audio.SFX.stomp();
        }
      }
    }

    // Sliding shell vs enemies
    for (const shell of state.enemies) {
      if (!shell.alive || shell.type !== 'beetle' || shell.shellState !== 'sliding') continue;
      for (const e of state.enemies) {
        if (!e.alive || e === shell) continue;
        if (Engine.overlap(shell, e)) {
          Entities.defeatEnemy(e, state.players[0]);
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

  function handleBobombExplosion(bomb) {
    const bx = bomb.x + bomb.w / 2;
    const by = bomb.y + bomb.h / 2;
    // Explosion particles
    const [sx, sy] = Engine.Camera.worldToScreen(bx, by);
    Particles.sparkle(sx, sy, 25, '#FF6B00');
    Particles.sparkle(sx, sy, 15, '#FFD700');
    Audio.SFX.stomp();
    spawnScorePopup(bx, bomb.y - 8, 'BOOM!');

    // Defeat nearby enemies
    for (const e of state.enemies) {
      if (!e.alive || e === bomb) continue;
      const dx = (e.x + e.w / 2) - bx;
      const dy = (e.y + e.h / 2) - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 48) {
        Entities.defeatEnemy(e, state.players[0]);
        spawnDefeatEffect(e);
      }
    }
  }

  // ===== PARTICLE EFFECTS =====

  function spawnScorePopup(x, y, text) {
    state.scorePopups.push({ x, y, text, life: 60 });
  }

  function spawnCoinEffect(coin) {
    const [sx, sy] = Engine.Camera.worldToScreen(coin.x + 6, coin.y + 8);
    Particles.sparkle(sx, sy, 8, '#FFD700');
    spawnScorePopup(coin.x + 6, coin.y, '+50');
  }

  function spawnDefeatEffect(enemy) {
    const [sx, sy] = Engine.Camera.worldToScreen(enemy.x + 8, enemy.y + 8);
    Particles.sparkle(sx, sy, 12, '#FF6B00');
    spawnScorePopup(enemy.x + 8, enemy.y, `+${enemy.scoreValue}`);
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

    // Gems
    for (const g of state.gems) {
      Entities.renderGem(ctx, g, cam);
    }

    // Score popups
    for (const sp of state.scorePopups) {
      const [sx, sy] = cam.worldToScreen(sp.x, sp.y);
      const alpha = Math.min(1, sp.life / 20);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Fredoka One, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(sp.text, sx, sy);
      ctx.fillText(sp.text, sx, sy);
      ctx.restore();
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

    const powerIcons = { ice: '❄️', fire: '🔥', wings: '🪽', star: '⭐', mushroom: '🍄', magnet: '🧲', shield: '🛡️', speed: '⚡' };
    els.hudPower.textContent = p1.powerStack.map(p => powerIcons[p] || '').join('');

    const skillIcons = { ground_pound: '💥', super_jump: '🦘', dash: '💨', heal: '💖' };
    if (p1.skillCooldown > 0) {
      els.hudSkill.textContent = `${skillIcons[p1.skill] || ''} ${Math.ceil(p1.skillCooldown / 60)}s`;
      els.hudSkill.style.opacity = '0.4';
    } else {
      els.hudSkill.textContent = `${skillIcons[p1.skill] || ''} [Q]`;
      els.hudSkill.style.opacity = '1';
    }

    if (state.coop && state.players[1]) {
      const p2 = state.players[1];
      els.hudP2Lives.textContent = '💚'.repeat(Math.max(0, p2.lives));
    }
  }

  // ===== SHOP =====

  const SHOP_DATA = [
    { type: 'mushroom', icon: '🍄', name: 'Mushroom',   desc: 'Grow big, extra hit',    price: 10 },
    { type: 'fire',     icon: '🔥', name: 'Fire Power',  desc: 'Shoot fireballs',         price: 15 },
    { type: 'ice',      icon: '❄️', name: 'Ice Power',   desc: 'Shoot ice balls',         price: 15 },
    { type: 'wings',    icon: '🪽', name: 'Wings',       desc: 'Double jump',             price: 20 },
    { type: 'shield',   icon: '🛡️', name: 'Shield',      desc: 'Block one hit',           price: 20 },
    { type: 'magnet',   icon: '🧲', name: 'Magnet',      desc: 'Attract coins',           price: 15 },
    { type: 'speed',    icon: '⚡', name: 'Speed',       desc: 'Run & jump faster',       price: 15 },
    { type: 'star',     icon: '⭐', name: 'Star',        desc: 'Brief invincibility',     price: 30 },
    { type: 'life',     icon: '❤️', name: 'Extra Life',  desc: '+1 life',                 price: 25 },
  ];

  function showShop() {
    updateShopUI();
    showScreen('shop');
  }

  function updateShopUI() {
    els.shopCoinCount.textContent = persistent.coins;

    els.shopItems.innerHTML = '';
    for (const item of SHOP_DATA) {
      const owned = item.type !== 'life' && persistent.powerStack.includes(item.type);
      const tooExpensive = persistent.coins < item.price;

      const btn = document.createElement('button');
      btn.className = 'shop-item';
      if (owned) btn.classList.add('shop-item-owned');
      if (tooExpensive && !owned) btn.classList.add('shop-item-expensive');

      btn.innerHTML = `
        <span class="shop-item-icon">${item.icon}</span>
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-desc">${item.desc}</span>
        <span class="shop-item-price">${owned ? 'Owned' : '🪙 ' + item.price}</span>
      `;

      if (!owned && !tooExpensive) {
        btn.addEventListener('click', () => {
          Audio.SFX.powerup();
          persistent.coins -= item.price;
          if (item.type === 'life') {
            persistent.lives++;
          } else {
            persistent.powerStack.push(item.type);
          }
          updateShopUI();
        });
      }

      els.shopItems.appendChild(btn);
    }

    // Show current inventory
    const powerIcons = { ice: '❄️', fire: '🔥', wings: '🪽', star: '⭐', mushroom: '🍄', magnet: '🧲', shield: '🛡️', speed: '⚡' };
    els.shopInvIcons.textContent = persistent.powerStack.map(p => powerIcons[p] || '').join(' ') || '(none)';
  }

  // ===== LEVEL TRANSITIONS =====

  function onLevelComplete() {
    Engine.stopLoop();
    Audio.SFX.fanfare();
    Particles.confetti(60);

    const p1 = state.players[0];

    // Save player state to persistent
    if (!state.coop) {
      persistent.coins = p1.coins;
      persistent.score = p1.score;
      persistent.lives = p1.lives;
      // Keep non-timed powers only (star/speed expire)
      persistent.powerStack = p1.powerStack.filter(p => p !== 'star' && p !== 'speed');
    }

    Storage.save(GAME_ID, 'level', state.currentLevel + 1);
    Storage.save(GAME_ID, 'highScore',
      Math.max(Storage.load(GAME_ID, 'highScore', 0), p1.score));
    Storage.save(GAME_ID, 'persistent', persistent);

    if (state.currentLevel >= LEVELS.length - 1) {
      setTimeout(() => onVictory(), 1000);
    } else {
      els.lcTitle.textContent = `Level ${state.currentLevel + 1} Complete!`;
      els.lcStats.textContent = `🪙 ${p1.coins} coins · 💎 ${p1.gems}/3 gems · Score: ${p1.score}`;

      const nextPower = LEVELS[state.currentLevel + 1].powerUp;
      const powerNames = { ice: '❄️ Ice Power', fire: '🔥 Fire Power', wings: '🪽 Wings', star: '⭐ Star Power', mushroom: '🍄 Super Mushroom', magnet: '🧲 Magnet', shield: '🛡️ Shield', speed: '⚡ Speed Boost' };
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
