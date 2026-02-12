/**
 * Game entities — Player, Enemy, Coin, PowerUp, Projectile, Flag.
 */
const Entities = (() => {

  // ===== PLAYER =====

  function createPlayer(charType, playerNum, x, y) {
    const isLuigi = charType === 'luigi';
    return {
      type: 'player', charType, playerNum,
      x, y,
      w: 14, h: 16,
      vx: 0, vy: 0,
      facingRight: true,
      onGround: false,
      alive: true,
      invincible: false,
      invTimer: 0,

      runSpeed: isLuigi ? 2.2 : 2.8,
      accel: isLuigi ? 0.15 : 0.2,
      jumpForce: isLuigi ? -10.5 : -9.0,
      maxSpeed: isLuigi ? 2.2 : 2.8,

      powerUp: null,
      isBig: false,
      hasDoubleJump: false,
      usedDoubleJump: false,
      starTimer: 0,
      shootCooldown: 0,

      animFrame: 0,
      animTimer: 0,
      animState: 'idle',

      lives: 3,
      coins: 0,
      score: 0,
      respawnTimer: 0,
      deathY: 0,

      hitHazard: false,
      hitCeiling: false,
      ceilingTile: 0,
      ceilingCol: 0,
      ceilingRow: 0,
      groundTile: 0,
      hitWall: false,
    };
  }

  function updatePlayer(player, level, coop) {
    if (!player.alive) {
      // Death animation: float up then fall
      player.vy += 0.3;
      player.y += player.vy;
      return;
    }

    const pn = player.playerNum;

    // Horizontal movement
    if (Engine.Input.left(pn, coop)) {
      player.vx -= player.accel;
      player.facingRight = false;
    } else if (Engine.Input.right(pn, coop)) {
      player.vx += player.accel;
      player.facingRight = true;
    } else {
      // Much less friction in the air so jumps feel floaty and controllable
      const groundFric = Engine.isOnIce(player, level) ? Engine.ICE_FRICTION : Engine.FRICTION;
      const fric = player.onGround ? groundFric : 0.99;
      player.vx *= fric;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }
    player.vx = Math.max(-player.maxSpeed, Math.min(player.vx, player.maxSpeed));

    // Jump
    if (Engine.Input.jumpPressed(pn, coop)) {
      if (player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
        Audio.SFX.jump();
      } else if (player.hasDoubleJump && !player.usedDoubleJump) {
        player.vy = player.jumpForce * 0.85;
        player.usedDoubleJump = true;
        Audio.SFX.jump();
      }
    }

    // Variable jump height
    if (!Engine.Input.jumpHeld(pn, coop) && player.vy < -3) {
      player.vy *= 0.6;
    }

    if (player.onGround) player.usedDoubleJump = false;

    // Gravity
    Engine.applyGravity(player);

    // Move + collide
    player.hitHazard = false;
    Engine.moveAndCollide(player, level);

    // Hazard
    if (player.hitHazard) {
      killPlayer(player);
      return;
    }

    // Ceiling hit — check for ?-block
    if (player.hitCeiling) {
      const tid = player.ceilingTile;
      if (tid === 3 || tid === 4) {
        // Mark block as hit — return info for game.js to handle
        player.hitBlock = { col: player.ceilingCol, row: player.ceilingRow, type: tid };
      }
      if (tid === 2 && player.isBig) {
        // Break brick
        player.hitBlock = { col: player.ceilingCol, row: player.ceilingRow, type: 'break' };
      }
    } else {
      player.hitBlock = null;
    }

    // Shooting
    if (player.shootCooldown > 0) player.shootCooldown--;
    player.wantsShoot = false;
    if (Engine.Input.shootPressed(pn, coop) && player.shootCooldown <= 0) {
      if (player.powerUp === 'ice' || player.powerUp === 'fire') {
        player.wantsShoot = true;
        player.shootCooldown = 15;
        Audio.SFX.shoot();
      }
    }

    // Star timer
    if (player.powerUp === 'star' && player.starTimer > 0) {
      player.starTimer--;
      player.invincible = true;
      if (player.starTimer <= 0) {
        player.powerUp = null;
        player.invincible = false;
      }
    }

    // Damage invincibility
    if (player.invTimer > 0) {
      player.invTimer--;
      if (player.invTimer <= 0 && player.powerUp !== 'star') {
        player.invincible = false;
      }
    }

    // Fall off screen
    if (player.y > level.height * Engine.TILE + 32) {
      killPlayer(player);
    }

    // Animation
    updatePlayerAnim(player);
  }

  function updatePlayerAnim(p) {
    if (p.wantsShoot) {
      p.animState = 'shoot';
      p.animFrame = 0;
    } else if (!p.onGround) {
      p.animState = 'jump';
      p.animFrame = 0;
    } else if (Math.abs(p.vx) > 0.3) {
      p.animState = 'run';
      p.animTimer++;
      if (p.animTimer > 6) {
        p.animTimer = 0;
        p.animFrame = (p.animFrame + 1) % 4;
      }
    } else {
      p.animState = 'idle';
      p.animFrame = 0;
    }
  }

  function renderPlayer(ctx, player, cam) {
    if (!player.alive && player.y > player.deathY + 200) return;

    // Blink during invincibility
    if (player.invTimer > 0 && player.alive) {
      if (Math.floor(player.invTimer / 3) % 2 === 0) return;
    }

    const prefix = player.isBig ? 'big' : '';
    const stateKey = prefix ? prefix + player.animState.charAt(0).toUpperCase() + player.animState.slice(1) : player.animState;
    const anims = SPRITES.ANIMS[player.charType];
    const frames = anims[stateKey] || anims[player.animState] || anims.idle;
    const frame = frames[player.animFrame % frames.length];

    const [sx, sy] = Engine.Camera.worldToScreen(player.x - 1, player.y);

    // Star power rainbow tint
    if (player.powerUp === 'star' && player.alive) {
      ctx.save();
      ctx.filter = `hue-rotate(${(player.starTimer * 12) % 360}deg) saturate(2)`;
      Engine.drawSprite(ctx, frame, sx, sy, !player.facingRight);
      ctx.restore();
    } else {
      Engine.drawSprite(ctx, frame, sx, sy, !player.facingRight);
    }
  }

  function hurtPlayer(player) {
    if (player.invincible) return;
    if (player.isBig) {
      player.isBig = false;
      player.h = 16;
      player.powerUp = null;
      player.hasDoubleJump = false;
      player.invTimer = 90;
      player.invincible = true;
      Audio.SFX.hurt();
    } else {
      killPlayer(player);
    }
  }

  function killPlayer(player) {
    if (!player.alive) return;
    player.alive = false;
    player.lives--;
    player.vy = -8;
    player.vx = 0;
    player.deathY = player.y;
    player.powerUp = null;
    player.isBig = false;
    player.hasDoubleJump = false;
    player.invincible = false;
    player.h = 16;
    Audio.SFX.die();
  }

  function respawnPlayer(player, level, otherPlayer) {
    player.alive = true;
    player.respawnTimer = 0;
    player.invTimer = 120;
    player.invincible = true;
    player.vy = 0;
    player.vx = 0;
    player.h = 16;
    player.isBig = false;
    player.powerUp = null;
    player.hasDoubleJump = false;

    if (otherPlayer && otherPlayer.alive) {
      player.x = otherPlayer.x;
      player.y = otherPlayer.y - 20;
    } else {
      // Respawn at level start
      for (const e of level.entities) {
        if (e.type === 'spawn') {
          player.x = e.x * Engine.TILE;
          player.y = e.y * Engine.TILE;
          break;
        }
      }
    }
  }

  function applyPowerUp(player, type) {
    player.powerUp = type;
    Audio.SFX.powerup();
    switch (type) {
      case 'ice':
      case 'fire':
        break;
      case 'wings':
        player.hasDoubleJump = true;
        break;
      case 'star':
        player.starTimer = 600;
        player.invincible = true;
        break;
      case 'mushroom':
        if (!player.isBig) {
          player.isBig = true;
          player.h = 32;
          player.y -= 16;
        }
        break;
    }
  }

  // ===== ENEMIES =====

  function createGoomba(x, y) {
    return {
      type: 'goomba',
      x, y, w: 16, h: 16,
      vx: -0.5, vy: 0,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      scoreValue: 100,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      groundTile: 0,
      hitCeiling: false,
    };
  }

  function createKoopaFly(x, y) {
    return {
      type: 'koopa_fly',
      x, y, w: 16, h: 20,
      vx: -0.8, vy: 0,
      baseX: x, baseY: y,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      flyPhase: Math.random() * Math.PI * 2,
      scoreValue: 200,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      groundTile: 0,
      hitCeiling: false,
    };
  }

  function updateEnemy(enemy, level) {
    if (!enemy.alive) {
      if (enemy.squashTimer > 0) enemy.squashTimer--;
      return enemy.squashTimer > 0;
    }

    if (enemy.type === 'goomba') {
      Engine.applyGravity(enemy);
      enemy.hitWall = false;
      Engine.moveAndCollide(enemy, level);
      if (enemy.hitWall) enemy.vx = -enemy.vx;

      // Check for ledge ahead
      if (enemy.onGround) {
        const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / Engine.TILE);
        const belowRow = Math.floor((enemy.y + enemy.h + 2) / Engine.TILE);
        if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
          enemy.vx = -enemy.vx;
        }
      }
    }

    if (enemy.type === 'koopa_fly') {
      enemy.flyPhase += 0.03;
      enemy.y = enemy.baseY + Math.sin(enemy.flyPhase) * 30;
      enemy.x += enemy.vx;
      // Patrol range
      if (enemy.x < enemy.baseX - 50) enemy.vx = Math.abs(enemy.vx);
      if (enemy.x > enemy.baseX + 50) enemy.vx = -Math.abs(enemy.vx);
    }

    enemy.animTimer++;
    if (enemy.animTimer > 10) {
      enemy.animTimer = 0;
      enemy.animFrame = (enemy.animFrame + 1) % 2;
    }

    return true;
  }

  function renderEnemy(ctx, enemy, cam) {
    if (!enemy.alive && enemy.squashTimer <= 0) return;

    let frames, frame;
    if (enemy.type === 'goomba') {
      if (!enemy.alive) {
        frames = SPRITES.ANIMS.goomba.squash;
      } else {
        frames = SPRITES.ANIMS.goomba.walk;
      }
    } else {
      frames = SPRITES.ANIMS.koopa.fly;
    }
    frame = frames[enemy.animFrame % frames.length];

    const [sx, sy] = Engine.Camera.worldToScreen(enemy.x, enemy.y);
    const flip = enemy.vx > 0;
    Engine.drawSprite(ctx, frame, sx, sy, flip);
  }

  function defeatEnemy(enemy, player) {
    enemy.alive = false;
    enemy.squashTimer = 20;
    if (player) player.score += enemy.scoreValue;
  }

  // ===== COINS =====

  function createCoin(x, y) {
    return {
      type: 'coin', x: x + 2, y, w: 12, h: 16,
      collected: false,
      animFrame: 0, animTimer: 0,
    };
  }

  function updateCoin(coin) {
    if (coin.collected) return false;
    coin.animTimer++;
    if (coin.animTimer > 8) {
      coin.animTimer = 0;
      coin.animFrame = (coin.animFrame + 1) % 4;
    }
    return true;
  }

  function renderCoin(ctx, coin, cam) {
    if (coin.collected) return;
    const frames = SPRITES.ANIMS.coin.spin;
    const frame = frames[coin.animFrame % frames.length];
    const [sx, sy] = Engine.Camera.worldToScreen(coin.x, coin.y);
    Engine.drawSprite(ctx, frame, sx, sy, false);
  }

  function collectCoin(coin, player) {
    coin.collected = true;
    player.coins++;
    player.score += 50;
    Audio.SFX.coin();
  }

  // ===== POWER-UPS =====

  function createPowerUp(powerType, x, y) {
    return {
      type: 'powerup',
      powerType,
      x, y, w: 16, h: 16,
      vx: 1, vy: 0,
      collected: false,
      emergeTimer: 16,
      targetY: y - Engine.TILE,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      groundTile: 0,
      hitCeiling: false,
    };
  }

  function updatePowerUp(pu, level) {
    if (pu.collected) return false;

    if (pu.emergeTimer > 0) {
      pu.y -= 1;
      pu.emergeTimer--;
      return true;
    }

    Engine.applyGravity(pu);
    Engine.moveAndCollide(pu, level);
    if (pu.hitWall) pu.vx = -pu.vx;

    return true;
  }

  function renderPowerUp(ctx, pu, cam) {
    if (pu.collected) return;
    const spriteMap = {
      ice: SPRITES.POWERUP_ICE,
      fire: SPRITES.POWERUP_FIRE,
      wings: SPRITES.POWERUP_WINGS,
      star: SPRITES.POWERUP_STAR,
      mushroom: SPRITES.POWERUP_MUSHROOM,
    };
    const sprite = spriteMap[pu.powerType];
    if (!sprite) return;
    const [sx, sy] = Engine.Camera.worldToScreen(pu.x, pu.y);
    Engine.drawSprite(ctx, sprite, sx, sy, false);
  }

  // ===== PROJECTILES =====

  function createProjectile(player) {
    const speed = 5;
    return {
      type: 'projectile',
      projType: player.powerUp,
      x: player.facingRight ? player.x + player.w : player.x - 8,
      y: player.y + (player.isBig ? 10 : 4),
      w: 8, h: 8,
      vx: player.facingRight ? speed : -speed,
      vy: 0,
      alive: true,
      bounces: 0,
      life: 120,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      groundTile: 0,
      hitCeiling: false,
    };
  }

  function updateProjectile(proj, level) {
    if (!proj.alive) return false;
    proj.life--;
    if (proj.life <= 0) return false;

    if (proj.projType === 'fire') {
      proj.vy += 0.3;
    }

    proj.x += proj.vx;
    proj.y += proj.vy;

    // Tile collision
    const col = Math.floor((proj.x + proj.w / 2) / Engine.TILE);
    const row = Math.floor((proj.y + proj.h / 2) / Engine.TILE);
    if (col < 0 || col >= level.width || row < 0 || row >= level.height) return false;

    // Check horizontal collision
    const hCol = Math.floor((proj.vx > 0 ? proj.x + proj.w : proj.x) / Engine.TILE);
    if (Engine.isSolid(Engine.getTile(level, hCol, row))) {
      return false;
    }

    // Check vertical collision (fire bounces)
    const vRow = Math.floor((proj.vy > 0 ? proj.y + proj.h : proj.y) / Engine.TILE);
    if (Engine.isSolid(Engine.getTile(level, col, vRow))) {
      if (proj.projType === 'fire' && proj.vy > 0 && proj.bounces < 3) {
        proj.vy = -4;
        proj.bounces++;
        proj.y = vRow * Engine.TILE - proj.h;
      } else {
        return false;
      }
    }

    return true;
  }

  function renderProjectile(ctx, proj, cam) {
    if (!proj.alive) return;
    const sprite = proj.projType === 'fire' ? SPRITES.PROJ_FIRE : SPRITES.PROJ_ICE;
    const [sx, sy] = Engine.Camera.worldToScreen(proj.x, proj.y);
    Engine.drawSprite(ctx, sprite, sx, sy, false);
  }

  // ===== FLAG =====

  function createFlag(x, y) {
    return {
      type: 'flag',
      x, y, w: 16, h: 48,
      reached: false,
    };
  }

  function renderFlag(ctx, flag, cam) {
    const [sx, sy] = Engine.Camera.worldToScreen(flag.x, flag.y);
    Engine.drawSprite(ctx, SPRITES.FLAG, sx, sy, false);
  }

  return {
    createPlayer, updatePlayer, renderPlayer, hurtPlayer, killPlayer, respawnPlayer, applyPowerUp,
    createGoomba, createKoopaFly, updateEnemy, renderEnemy, defeatEnemy,
    createCoin, updateCoin, renderCoin, collectCoin,
    createPowerUp, updatePowerUp, renderPowerUp,
    createProjectile, updateProjectile, renderProjectile,
    createFlag, renderFlag,
  };
})();
