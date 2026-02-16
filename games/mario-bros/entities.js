/**
 * Game entities — Player, Enemy, Coin, PowerUp, Projectile, Flag.
 */
const Entities = (() => {

  // ===== PLAYER =====

  const CHAR_STATS = {
    mario:  { runSpeed: 2.8, accel: 0.2,  jumpForce: -9.0,  maxSpeed: 2.8 },
    luigi:  { runSpeed: 2.2, accel: 0.15, jumpForce: -10.5, maxSpeed: 2.2 },
    toad:   { runSpeed: 3.5, accel: 0.25, jumpForce: -7.5,  maxSpeed: 3.5 },
    peach:  { runSpeed: 2.5, accel: 0.18, jumpForce: -8.5,  maxSpeed: 2.5 },
  };

  function createPlayer(charType, playerNum, x, y) {
    const stats = CHAR_STATS[charType] || CHAR_STATS.mario;
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

      runSpeed: stats.runSpeed,
      accel: stats.accel,
      jumpForce: stats.jumpForce,
      maxSpeed: stats.maxSpeed,

      powerStack: [],
      isBig: false,
      hasDoubleJump: false,
      usedDoubleJump: false,
      starTimer: 0,
      speedTimer: 0,
      baseRunSpeed: stats.runSpeed,
      baseMaxSpeed: stats.maxSpeed,
      baseJumpForce: stats.jumpForce,
      shootCooldown: 0,

      // Peach float
      canFloat: charType === 'peach',
      floatTimer: 90,

      // Shield
      hasShield: false,

      // Skills
      skill: charType === 'mario' ? 'ground_pound' : charType === 'luigi' ? 'super_jump' : charType === 'toad' ? 'dash' : 'heal',
      skillCooldown: 0,
      skillMaxCooldown: charType === 'peach' ? 600 : charType === 'luigi' ? 240 : 180,
      skillActive: false,
      skillTimer: 0,

      // Gems
      gems: 0,

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

  function hasPower(player, type) {
    return player.powerStack.includes(type);
  }

  function getShootPower(player) {
    for (let i = player.powerStack.length - 1; i >= 0; i--) {
      if (player.powerStack[i] === 'ice' || player.powerStack[i] === 'fire' || player.powerStack[i] === 'potion') return player.powerStack[i];
    }
    return null;
  }

  function removePower(player, type) {
    const idx = player.powerStack.indexOf(type);
    if (idx !== -1) player.powerStack.splice(idx, 1);
    if (type === 'wings') player.hasDoubleJump = false;
    if (type === 'mushroom' && player.isBig) { player.isBig = false; player.h = 16; }
    if (type === 'shield') player.hasShield = false;
    if (type === 'speed') {
      player.speedTimer = 0;
      player.runSpeed = player.baseRunSpeed;
      player.maxSpeed = player.baseMaxSpeed;
      player.jumpForce = player.baseJumpForce;
    }
    if (type === 'star') {
      player.starTimer = 0;
      if (player.invTimer <= 0) player.invincible = false;
    }
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

    if (player.onGround) {
      player.usedDoubleJump = false;
      player.floatTimer = 90;
    }

    // Gravity
    Engine.applyGravity(player);

    // Peach float: hold jump while falling to slow descent
    if (player.canFloat && !player.onGround && player.vy > 0
        && Engine.Input.jumpHeld(pn, coop) && player.floatTimer > 0) {
      player.vy = Math.min(player.vy, 0.5);
      player.floatTimer--;
    }

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
      if (getShootPower(player)) {
        player.wantsShoot = true;
        player.shootCooldown = 15;
        Audio.SFX.shoot();
      }
    }

    // Star timer
    if (hasPower(player, 'star') && player.starTimer > 0) {
      player.starTimer--;
      player.invincible = true;
      if (player.starTimer <= 0) {
        removePower(player, 'star');
      }
    }

    // Speed timer
    if (hasPower(player, 'speed') && player.speedTimer > 0) {
      player.speedTimer--;
      if (player.speedTimer <= 0) {
        removePower(player, 'speed');
      }
    }

    // Skill cooldown
    if (player.skillCooldown > 0) player.skillCooldown--;

    // Damage invincibility
    if (player.invTimer > 0) {
      player.invTimer--;
      if (player.invTimer <= 0 && !hasPower(player, 'star')) {
        player.invincible = false;
      }
    }

    // Skill activation
    if (Engine.Input.skillPressed(pn, coop) && player.skillCooldown <= 0) {
      switch (player.skill) {
        case 'ground_pound':
          if (!player.onGround) {
            player.vy = 12;
            player.skillActive = true;
            player.skillCooldown = player.skillMaxCooldown;
          }
          break;
        case 'super_jump':
          if (player.onGround) {
            player.vy = player.jumpForce * 1.5;
            player.onGround = false;
            player.skillCooldown = player.skillMaxCooldown;
            Audio.SFX.jump();
          }
          break;
        case 'dash':
          player.vx = player.facingRight ? 10 : -10;
          player.skillActive = true;
          player.skillTimer = 15;
          player.invincible = true;
          player.skillCooldown = player.skillMaxCooldown;
          break;
        case 'heal':
          if (!player.hasShield) {
            player.hasShield = true;
          } else {
            player.invTimer = 30;
            player.invincible = true;
          }
          player.skillCooldown = player.skillMaxCooldown;
          Audio.SFX.powerup();
          break;
      }
    }

    // Active skill updates
    if (player.skillActive) {
      if (player.skill === 'ground_pound' && player.onGround) {
        // Ground pound landed — defeat nearby ground enemies (handled in game.js)
        player.skillActive = false;
        player.groundPoundLanded = true;
      }
      if (player.skill === 'dash') {
        player.skillTimer--;
        if (player.skillTimer <= 0) {
          player.skillActive = false;
          player.invincible = player.invTimer > 0 || (hasPower(player, 'star') && player.starTimer > 0);
        }
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
    if (hasPower(player, 'star') && player.alive) {
      ctx.save();
      ctx.filter = `hue-rotate(${(player.starTimer * 12) % 360}deg) saturate(2)`;
      Engine.drawSprite(ctx, frame, sx, sy, !player.facingRight);
      ctx.restore();
    } else if (hasPower(player, 'speed') && player.alive) {
      // Speed boost yellow tint + flashing when ending
      ctx.save();
      if (player.speedTimer < 120 && Math.floor(player.speedTimer / 6) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      ctx.filter = 'saturate(1.5) brightness(1.2)';
      Engine.drawSprite(ctx, frame, sx, sy, !player.facingRight);
      ctx.restore();
    } else {
      Engine.drawSprite(ctx, frame, sx, sy, !player.facingRight);
    }

    // Shield bubble
    if (player.hasShield && player.alive) {
      const sw = (player.isBig ? 32 : 16) * Engine.SCALE;
      const sh = (player.isBig ? 32 : 16) * Engine.SCALE;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 191, 255, ${0.4 + Math.sin(Date.now() / 200) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2 + 4, sh / 2 + 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function hurtPlayer(player) {
    if (player.invincible) return;
    if (player.powerStack.length > 0) {
      // Pop the most recent power off the stack
      const lost = player.powerStack.pop();
      removePower(player, lost);
      player.invTimer = 60;
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
    player.powerStack = [];
    player.isBig = false;
    player.hasDoubleJump = false;
    player.hasShield = false;
    player.invincible = false;
    player.h = 16;
    player.starTimer = 0;
    player.speedTimer = 0;
    player.runSpeed = player.baseRunSpeed;
    player.maxSpeed = player.baseMaxSpeed;
    player.jumpForce = player.baseJumpForce;
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
    player.powerStack = [];
    player.hasDoubleJump = false;
    player.hasShield = false;
    player.starTimer = 0;
    player.speedTimer = 0;
    player.runSpeed = player.baseRunSpeed;
    player.maxSpeed = player.baseMaxSpeed;
    player.jumpForce = player.baseJumpForce;

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
    // Add to stack (no duplicates except refresh timed powers)
    if (!player.powerStack.includes(type)) {
      player.powerStack.push(type);
    }
    Audio.SFX.powerup();
    switch (type) {
      case 'ice':
      case 'fire':
      case 'potion':
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
      case 'magnet':
        break;
      case 'shield':
        player.hasShield = true;
        break;
      case 'speed':
        player.speedTimer = 480;
        player.runSpeed = player.baseRunSpeed * 2;
        player.maxSpeed = player.baseMaxSpeed * 2;
        player.jumpForce = player.baseJumpForce * 1.1;
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

  function createPiranha(x, y) {
    return {
      type: 'piranha',
      x, y: y + 16, w: 16, h: 16,
      vx: 0, vy: 0,
      baseY: y + 16,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      scoreValue: 200,
      phase: 'hidden', // hidden, rising, exposed, sinking
      phaseTimer: 120,
      noStomp: true,
      onGround: false, hitWall: false, hitHazard: false, groundTile: 0, hitCeiling: false,
    };
  }

  function createBoo(x, y) {
    return {
      type: 'boo',
      x, y, w: 16, h: 16,
      vx: 0, vy: 0,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      scoreValue: 300,
      shy: false,
      noStomp: true,
      onGround: false, hitWall: false, hitHazard: false, groundTile: 0, hitCeiling: false,
    };
  }

  function createBeetle(x, y) {
    return {
      type: 'beetle',
      x, y, w: 16, h: 16,
      vx: -0.7, vy: 0,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      scoreValue: 100,
      shellState: 'walking', // walking, shell, sliding
      shellTimer: 0,
      onGround: false, hitWall: false, hitHazard: false, groundTile: 0, hitCeiling: false,
    };
  }

  function createBobomb(x, y) {
    return {
      type: 'bobomb',
      x, y, w: 16, h: 16,
      vx: -0.6, vy: 0,
      alive: true,
      squashTimer: 0,
      animFrame: 0, animTimer: 0,
      scoreValue: 100,
      lit: false,
      fuseTimer: 0,
      onGround: false, hitWall: false, hitHazard: false, groundTile: 0, hitCeiling: false,
    };
  }

  function updateEnemy(enemy, level, players) {
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

    if (enemy.type === 'piranha') {
      enemy.phaseTimer--;
      if (enemy.phaseTimer <= 0) {
        switch (enemy.phase) {
          case 'hidden':
            // Check if player is standing on pipe — stay hidden
            if (players) {
              const onPipe = players.some(p => p.alive &&
                Math.abs((p.x + p.w / 2) - (enemy.x + enemy.w / 2)) < 24 &&
                p.y + p.h <= enemy.baseY && p.y + p.h >= enemy.baseY - 20);
              if (onPipe) { enemy.phaseTimer = 30; break; }
            }
            enemy.phase = 'rising';
            enemy.phaseTimer = 30;
            break;
          case 'rising':
            enemy.phase = 'exposed';
            enemy.phaseTimer = 120;
            break;
          case 'exposed':
            enemy.phase = 'sinking';
            enemy.phaseTimer = 30;
            break;
          case 'sinking':
            enemy.phase = 'hidden';
            enemy.phaseTimer = 120;
            break;
        }
      }
      // Animate position
      if (enemy.phase === 'rising') {
        enemy.y = enemy.baseY - (1 - enemy.phaseTimer / 30) * 16;
      } else if (enemy.phase === 'exposed') {
        enemy.y = enemy.baseY - 16;
      } else if (enemy.phase === 'sinking') {
        enemy.y = enemy.baseY - (enemy.phaseTimer / 30) * 16;
      } else {
        enemy.y = enemy.baseY;
      }
    }

    if (enemy.type === 'boo') {
      enemy.shy = false;
      if (players) {
        for (const p of players) {
          if (!p.alive) continue;
          const booIsRight = enemy.x > p.x;
          if ((p.facingRight && booIsRight) || (!p.facingRight && !booIsRight)) {
            enemy.shy = true;
            break;
          }
        }
      }
      if (!enemy.shy && players) {
        // Move toward nearest alive player
        let nearest = null, minDist = Infinity;
        for (const p of players) {
          if (!p.alive) continue;
          const d = Math.abs(p.x - enemy.x) + Math.abs(p.y - enemy.y);
          if (d < minDist) { minDist = d; nearest = p; }
        }
        if (nearest) {
          const dx = nearest.x - enemy.x;
          const dy = nearest.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy.x += (dx / dist) * 0.8;
          enemy.y += (dy / dist) * 0.8;
          enemy.vx = dx > 0 ? 0.8 : -0.8;
        }
      }
    }

    if (enemy.type === 'beetle') {
      if (enemy.shellState === 'walking') {
        Engine.applyGravity(enemy);
        enemy.hitWall = false;
        Engine.moveAndCollide(enemy, level);
        if (enemy.hitWall) enemy.vx = -enemy.vx;
        if (enemy.onGround) {
          const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / Engine.TILE);
          const belowRow = Math.floor((enemy.y + enemy.h + 2) / Engine.TILE);
          if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
            enemy.vx = -enemy.vx;
          }
        }
      } else if (enemy.shellState === 'shell') {
        Engine.applyGravity(enemy);
        Engine.moveAndCollide(enemy, level);
        enemy.shellTimer--;
        if (enemy.shellTimer <= 0) {
          enemy.shellState = 'walking';
          enemy.vx = -0.7;
          enemy.h = 16;
        }
      } else if (enemy.shellState === 'sliding') {
        Engine.applyGravity(enemy);
        enemy.hitWall = false;
        Engine.moveAndCollide(enemy, level);
        if (enemy.hitWall) enemy.vx = -enemy.vx;
      }
    }

    if (enemy.type === 'bobomb') {
      if (!enemy.lit) {
        Engine.applyGravity(enemy);
        enemy.hitWall = false;
        Engine.moveAndCollide(enemy, level);
        if (enemy.hitWall) enemy.vx = -enemy.vx;
        if (enemy.onGround) {
          const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / Engine.TILE);
          const belowRow = Math.floor((enemy.y + enemy.h + 2) / Engine.TILE);
          if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
            enemy.vx = -enemy.vx;
          }
        }
      } else {
        enemy.vx = 0;
        enemy.fuseTimer--;
        Engine.applyGravity(enemy);
        Engine.moveAndCollide(enemy, level);
        if (enemy.fuseTimer <= 0) {
          enemy.alive = false;
          enemy.squashTimer = 0;
          return false; // Signal explosion in game.js
        }
      }
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

    // Piranha: don't render when fully hidden
    if (enemy.type === 'piranha' && enemy.phase === 'hidden') return;

    let frames, frame;
    if (enemy.type === 'goomba') {
      if (!enemy.alive) {
        frames = SPRITES.ANIMS.goomba.squash;
      } else {
        frames = SPRITES.ANIMS.goomba.walk;
      }
    } else if (enemy.type === 'koopa_fly') {
      frames = SPRITES.ANIMS.koopa.fly;
    } else if (enemy.type === 'piranha') {
      frames = SPRITES.ANIMS.piranha.bite;
    } else if (enemy.type === 'boo') {
      frames = enemy.shy ? SPRITES.ANIMS.boo.shy : SPRITES.ANIMS.boo.normal;
    } else if (enemy.type === 'beetle') {
      if (enemy.shellState === 'shell' || enemy.shellState === 'sliding') {
        frames = SPRITES.ANIMS.beetle.shell;
      } else {
        frames = SPRITES.ANIMS.beetle.walk;
      }
    } else if (enemy.type === 'bobomb') {
      frames = SPRITES.ANIMS.bobomb.walk;
    } else {
      frames = SPRITES.ANIMS.goomba.walk;
    }
    frame = frames[enemy.animFrame % frames.length];

    const [sx, sy] = Engine.Camera.worldToScreen(enemy.x, enemy.y);
    const flip = enemy.vx > 0;

    // Boo: semi-transparent when shy
    if (enemy.type === 'boo' && enemy.shy) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      Engine.drawSprite(ctx, frame, sx, sy, flip);
      ctx.restore();
    } else if (enemy.type === 'bobomb' && enemy.lit) {
      // Flashing red when lit
      ctx.save();
      if (Math.floor(enemy.fuseTimer / 5) % 2 === 0) {
        ctx.filter = 'hue-rotate(0deg) saturate(3) brightness(1.5)';
      }
      Engine.drawSprite(ctx, frame, sx, sy, flip);
      ctx.restore();
    } else {
      Engine.drawSprite(ctx, frame, sx, sy, flip);
    }
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
      magnet: SPRITES.POWERUP_MAGNET,
      shield: SPRITES.POWERUP_SHIELD,
      speed: SPRITES.POWERUP_SPEED,
      potion: SPRITES.POWERUP_POTION,
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
      projType: getShootPower(player),
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

    if (proj.projType === 'fire' || proj.projType === 'potion') {
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
      } else if (proj.projType === 'potion') {
        return false; // potion splashes on contact, no bounce
      } else {
        return false;
      }
    }

    return true;
  }

  function renderProjectile(ctx, proj, cam) {
    if (!proj.alive) return;
    const spriteMap = { fire: SPRITES.PROJ_FIRE, ice: SPRITES.PROJ_ICE, potion: SPRITES.PROJ_POTION };
    const sprite = spriteMap[proj.projType];
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

  // ===== GEMS =====

  function createGem(x, y) {
    return {
      type: 'gem', x: x + 2, y, w: 12, h: 16,
      collected: false,
      animFrame: 0, animTimer: 0,
    };
  }

  function updateGem(gem) {
    if (gem.collected) return false;
    gem.animTimer++;
    if (gem.animTimer > 12) {
      gem.animTimer = 0;
      gem.animFrame = (gem.animFrame + 1) % 4;
    }
    return true;
  }

  function renderGem(ctx, gem, cam) {
    if (gem.collected) return;
    const frames = SPRITES.ANIMS.gem.sparkle;
    const frame = frames[gem.animFrame % frames.length];
    const [sx, sy] = Engine.Camera.worldToScreen(gem.x, gem.y);
    Engine.drawSprite(ctx, frame, sx, sy, false);
  }

  function collectGem(gem, player) {
    gem.collected = true;
    player.gems++;
    player.score += 500;
    Audio.SFX.powerup();
  }

  return {
    createPlayer, updatePlayer, renderPlayer, hurtPlayer, killPlayer, respawnPlayer, applyPowerUp, hasPower, getShootPower,
    createGoomba, createKoopaFly, createPiranha, createBoo, createBeetle, createBobomb,
    updateEnemy, renderEnemy, defeatEnemy,
    createCoin, updateCoin, renderCoin, collectCoin,
    createGem, updateGem, renderGem, collectGem,
    createPowerUp, updatePowerUp, renderPowerUp,
    createProjectile, updateProjectile, renderProjectile,
    createFlag, renderFlag,
  };
})();
