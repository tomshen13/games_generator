/**
 * Game entities — Player, Enemies, Rings, Monitors, Springs, Checkpoints, Boss.
 * Sonic-style physics: ground speed, spin attack, ring scatter, character abilities.
 */
const Entities = (() => {

  const { TILE, SCALE, SONIC, Input, Camera } = Engine;

  // ===== CHARACTER STATS =====

  const CHAR_STATS = {
    sonic:    { runSpeed: 6.0, accel: 0.046875, jumpForce: -6.5, topSpeed: 12.0, skill: 'homing_attack', skillCooldown: 120 },
    tails:    { runSpeed: 4.8, accel: 0.04,     jumpForce: -6.0, topSpeed: 9.0,  skill: 'tail_swipe', skillCooldown: 180 },
    knuckles: { runSpeed: 5.0, accel: 0.05,     jumpForce: -5.5, topSpeed: 10.0, skill: 'power_punch', skillCooldown: 180 },
    shadow:   { runSpeed: 6.0, accel: 0.046875, jumpForce: -6.5, topSpeed: 12.0, skill: 'chaos_spear', skillCooldown: 150 },
    amy:      { runSpeed: 4.5, accel: 0.04,     jumpForce: -7.0, topSpeed: 8.0,  skill: 'hammer_spin', skillCooldown: 240 },
  };

  // ===== PLAYER =====

  function createPlayer(charType, playerNum, x, y) {
    const stats = CHAR_STATS[charType] || CHAR_STATS.sonic;
    return {
      type: 'player', charType, playerNum,
      x, y, w: 14, h: 16,
      vx: 0, vy: 0,
      groundSpeed: 0,
      groundAngle: 0,
      facingRight: true,
      onGround: false,
      alive: true,
      invincible: false, invTimer: 0,

      // Movement
      runSpeed: stats.runSpeed,
      accel: stats.accel,
      jumpForce: stats.jumpForce,
      topSpeed: stats.topSpeed,

      // Sonic states
      spinning: false,
      rolling: false,
      crouching: false,
      lookingUp: false,
      spinDashCharge: 0,
      spinDashing: false,

      // Character abilities
      // Tails: fly
      canFly: charType === 'tails',
      isFlying: false,
      flyMeter: 300,
      flyMeterMax: 300,
      // Knuckles: glide + climb
      canGlide: charType === 'knuckles',
      isGliding: false,
      isClimbing: false,
      climbDir: 0,
      // Shadow: chaos warp
      canWarp: charType === 'shadow',
      warpCooldown: 0,
      // Amy: hammer
      canHammer: charType === 'amy',
      hammerActive: false,
      hammerTimer: 0,

      // Skill (Q key)
      skill: stats.skill,
      skillCooldown: 0,
      skillMaxCooldown: stats.skillCooldown,
      skillActive: false,
      skillTimer: 0,

      // Shield
      shield: null,

      // Speed boost
      speedBoost: false,
      speedTimer: 0,
      invincibilityPower: false,
      invincibilityTimer: 0,

      // Collectibles
      rings: 0,
      score: 0,
      lives: 3,

      // Animation
      animFrame: 0, animTimer: 0, animState: 'idle',

      // Collision flags
      hitHazard: false, hitCeiling: false, hitWall: false,
      ceilingTile: 0, ceilingCol: 0, ceilingRow: 0, groundTile: 0,

      // Signals to game.js
      wantsScatterRings: 0,
      wantsRespawn: false,
      deathTimer: 0,
      deathY: 0,

      // Respawn data (from checkpoints)
      respawnX: x,
      respawnY: y,
      respawnRings: 0,

      // Homing attack target
      homingTarget: null,

      // Water bounce state
      waterBouncing: false,
    };
  }

  // ===== PLAYER UPDATE =====

  function updatePlayer(player, level, coop, enemies) {
    if (!player.alive) {
      // Death animation
      player.deathTimer++;
      player.vy += Engine.GRAVITY;
      player.y += player.vy;
      if (player.deathTimer >= 120) {
        player.wantsRespawn = true;
      }
      return;
    }

    const pn = player.playerNum;

    // Invincibility countdown
    if (player.invTimer > 0) {
      player.invTimer--;
      if (player.invTimer <= 0) {
        player.invincible = false;
      }
    }

    // Timed powers
    if (player.speedBoost) {
      player.speedTimer--;
      if (player.speedTimer <= 0) {
        player.speedBoost = false;
      }
    }
    if (player.invincibilityPower) {
      player.invincibilityTimer--;
      if (player.invincibilityTimer <= 0) {
        player.invincibilityPower = false;
      }
    }

    // Skill cooldown
    if (player.skillCooldown > 0) player.skillCooldown--;

    // Hammer timer
    if (player.hammerActive) {
      player.hammerTimer--;
      if (player.hammerTimer <= 0) {
        player.hammerActive = false;
      }
    }

    // Warp cooldown
    if (player.warpCooldown > 0) player.warpCooldown--;

    // Climbing (Knuckles)
    if (player.isClimbing) {
      updateClimbing(player, level, pn, coop);
      updatePlayerAnim(player);
      return;
    }

    const inputLeft = Input.left(pn, coop);
    const inputRight = Input.right(pn, coop);
    const inputDown = Input.down(pn, coop);
    const inputUp = Input.up(pn, coop);
    const jumpPressed = Input.jumpPressed(pn, coop);
    const jumpHeld = Input.jumpHeld(pn, coop);
    const shootPressed = Input.shootPressed(pn, coop);
    const skillPressed = Input.skillPressed(pn, coop);

    // === GROUND MOVEMENT ===
    if (player.onGround) {
      player.spinning = player.rolling;
      player.isFlying = false;
      player.isGliding = false;
      player.waterBouncing = false;

      // Recharge fly meter
      if (player.canFly) {
        player.flyMeter = Math.min(player.flyMeter + 2, player.flyMeterMax);
      }

      // Convert velocity to ground speed on landing
      if (player.groundAngle !== 0) {
        // Slope factor
        const slopeFactor = player.rolling
          ? (Math.sign(player.groundSpeed) === Math.sign(Math.sin(player.groundAngle))
            ? SONIC.SLOPE_ROLL_UP : SONIC.SLOPE_ROLL_DOWN)
          : SONIC.SLOPE_NORMAL;
        player.groundSpeed -= slopeFactor * Math.sin(player.groundAngle);
      }

      // Spin dash
      if (player.spinDashing) {
        if (inputDown) {
          if (jumpPressed) {
            // Add charge
            player.spinDashCharge = Math.min(player.spinDashCharge + SONIC.SPIN_DASH_CHARGE, SONIC.SPIN_DASH_MAX - SONIC.SPIN_DASH_BASE);
            Audio.SFX.tap();
          }
          // Stay in spin dash
          player.groundSpeed = 0;
          player.vx = 0;
        } else {
          // Release spin dash
          player.groundSpeed = (SONIC.SPIN_DASH_BASE + player.spinDashCharge) * (player.facingRight ? 1 : -1);
          player.spinDashing = false;
          player.spinning = true;
          player.rolling = true;
          player.crouching = false;
          player.spinDashCharge = 0;
          Audio.SFX.whoosh();
        }
        player.vx = player.groundSpeed * Math.cos(player.groundAngle);
        player.vy = player.groundSpeed * -Math.sin(player.groundAngle);
        // Still need to collide even while charging
        player.hitHazard = false;
        Engine.moveAndCollide(player, level);
        if (player.hitHazard) {
          hurtPlayer(player);
        }
        updatePlayerAnim(player);
        return;
      }

      // Crouching / roll initiation
      if (inputDown && !player.rolling) {
        if (Math.abs(player.groundSpeed) >= SONIC.ROLL_MIN_SPEED) {
          // Start rolling
          player.rolling = true;
          player.spinning = true;
          Audio.SFX.tap();
        } else {
          // Crouch
          player.crouching = true;
          player.lookingUp = false;
          // Check for spin dash initiation
          if (jumpPressed) {
            player.spinDashing = true;
            player.spinDashCharge = 0;
            Audio.SFX.tap();
          }
        }
      } else if (!inputDown) {
        player.crouching = false;
        player.spinDashing = false;
      }

      // Looking up
      if (inputUp && Math.abs(player.groundSpeed) < 0.5) {
        player.lookingUp = true;
        player.crouching = false;
      } else {
        player.lookingUp = false;
      }

      // Horizontal movement
      if (player.rolling) {
        // Rolling physics: less control
        if (inputLeft && player.groundSpeed > 0) {
          player.groundSpeed -= SONIC.ROLL_DECEL;
        } else if (inputRight && player.groundSpeed < 0) {
          player.groundSpeed += SONIC.ROLL_DECEL;
        }
        // Roll friction
        const fric = Engine.isOnIce(player, level) ? Engine.ICE_FRICTION : SONIC.ROLL_FRICTION;
        player.groundSpeed -= Math.sign(player.groundSpeed) * fric;
        // Stop rolling if too slow
        if (Math.abs(player.groundSpeed) < SONIC.ROLL_MIN_SPEED * 0.5) {
          player.rolling = false;
          player.spinning = false;
          player.groundSpeed = 0;
        }
      } else if (!player.crouching && !player.lookingUp) {
        // Normal ground movement
        if (inputLeft) {
          if (player.groundSpeed > 0) {
            // Skidding
            player.groundSpeed -= SONIC.DECEL;
            if (player.groundSpeed < 0) player.groundSpeed = -0.5;
          } else if (player.groundSpeed > -player.runSpeed) {
            player.groundSpeed -= player.accel;
            if (player.groundSpeed < -player.runSpeed) player.groundSpeed = -player.runSpeed;
          }
          player.facingRight = false;
        } else if (inputRight) {
          if (player.groundSpeed < 0) {
            player.groundSpeed += SONIC.DECEL;
            if (player.groundSpeed > 0) player.groundSpeed = 0.5;
          } else if (player.groundSpeed < player.runSpeed) {
            player.groundSpeed += player.accel;
            if (player.groundSpeed > player.runSpeed) player.groundSpeed = player.runSpeed;
          }
          player.facingRight = true;
        } else {
          // Friction
          const fric = Engine.isOnIce(player, level) ? Engine.ICE_FRICTION : SONIC.FRICTION;
          if (Math.abs(player.groundSpeed) < fric) {
            player.groundSpeed = 0;
          } else {
            player.groundSpeed -= Math.sign(player.groundSpeed) * fric;
          }
        }
      }

      // Speed boost multiplier
      const effectiveTop = player.speedBoost ? player.topSpeed * 1.5 : player.topSpeed;
      player.groundSpeed = Math.max(-effectiveTop, Math.min(player.groundSpeed, effectiveTop));

      // Convert ground speed to velocity
      player.vx = player.groundSpeed * Math.cos(player.groundAngle);
      player.vy = player.groundSpeed * -Math.sin(player.groundAngle);

      // Jump (not if crouching into spindash)
      if (jumpPressed && !player.spinDashing) {
        player.vy = player.jumpForce;
        player.onGround = false;
        player.spinning = true;
        player.rolling = false;
        player.crouching = false;
        player.lookingUp = false;
        Audio.SFX.jump();
      }

    } else {
      // === AIR MOVEMENT ===
      player.crouching = false;
      player.lookingUp = false;

      // Air acceleration
      if (inputLeft) {
        player.vx -= SONIC.AIR_ACCEL;
        player.facingRight = false;
      } else if (inputRight) {
        player.vx += SONIC.AIR_ACCEL;
        player.facingRight = true;
      }

      // Speed cap in air
      const effectiveTop = player.speedBoost ? player.topSpeed * 1.5 : player.topSpeed;
      player.vx = Math.max(-effectiveTop, Math.min(player.vx, effectiveTop));

      // Variable jump height
      if (!jumpHeld && player.vy < SONIC.JUMP_SHORT) {
        player.vy *= 0.5;
      }

      // Air drag
      if (player.vy < 0 && player.vy > SONIC.AIR_DRAG_THRESH && Math.abs(player.vx) >= 0.125) {
        player.vx *= SONIC.AIR_DRAG;
      }

      // --- Character-specific air abilities ---

      // Tails: fly
      if (player.canFly && jumpPressed && !player.isFlying && player.vy > 0) {
        player.isFlying = true;
        player.vy = -1;
      }
      if (player.isFlying) {
        if (jumpHeld && player.flyMeter > 0) {
          player.vy = Math.max(player.vy - 0.6, -2.5);
          player.flyMeter--;
          player.spinning = false;
        } else {
          player.isFlying = false;
        }
        if (player.flyMeter <= 0) {
          player.isFlying = false;
        }
      }

      // Knuckles: glide
      if (player.canGlide && jumpPressed && !player.isGliding && !player.spinning) {
        // Already used first jump, now glide
        player.isGliding = true;
        player.vy = 0;
        player.spinning = false;
      }
      if (player.canGlide && !player.isGliding && player.spinning && jumpPressed) {
        // Transition from spin to glide
        player.isGliding = true;
        player.vy = 0.5;
        player.spinning = false;
      }
      if (player.isGliding) {
        // Float forward, slow descent
        const glideSpeed = 4.0;
        player.vx = player.facingRight ? glideSpeed : -glideSpeed;
        if (player.vy < 0.5) player.vy += 0.125;
        if (player.vy > 0.5) player.vy = 0.5;
        // Hit wall -> start climbing
        if (player.hitWall) {
          player.isGliding = false;
          player.isClimbing = true;
          player.vx = 0;
          player.vy = 0;
          // Snap to wall
          if (player.facingRight) {
            const col = Math.floor((player.x + player.w) / TILE);
            player.x = col * TILE - player.w;
          } else {
            const col = Math.floor(player.x / TILE);
            player.x = (col + 1) * TILE;
          }
          updatePlayerAnim(player);
          return;
        }
      }

      // Shadow: chaos warp (down+jump in air)
      if (player.canWarp && player.warpCooldown <= 0 && inputDown && jumpPressed) {
        const warpDist = 64;
        player.x += player.facingRight ? warpDist : -warpDist;
        player.vy = 0;
        player.warpCooldown = 30;
        player.invincible = true;
        player.invTimer = Math.max(player.invTimer, 15);
        Audio.SFX.whoosh();
      }

      // Amy: hammer swing (shoot key in air)
      if (player.canHammer && shootPressed && !player.hammerActive) {
        player.hammerActive = true;
        player.hammerTimer = 20;
        player.vy = Math.min(player.vy, -2);
        Audio.SFX.tap();
      }

      // Shield special moves (jump in air while having a shield)
      if (jumpPressed && player.shield && !player.isFlying && !player.isGliding) {
        if (player.shield === 'flame') {
          // Flame dash: horizontal burst
          player.vx = player.facingRight ? 8 : -8;
          player.vy = 0;
          player.shield = 'flame'; // keep shield
          Audio.SFX.fire();
        } else if (player.shield === 'water') {
          // Water bounce: slam downward
          player.vx *= 0.5;
          player.vy = 8;
          player.waterBouncing = true;
          Audio.SFX.water();
        } else if (player.shield === 'lightning') {
          // Double jump
          player.vy = player.jumpForce;
          player.shield = 'lightning'; // keep shield
          Audio.SFX.jump();
        }
      }

      // Apply gravity (not if gliding or climbing)
      if (!player.isGliding) {
        Engine.applyGravity(player);
      }
    }

    // Apply gravity if on ground (for slope adherence - vy will be zeroed by collision)
    if (player.onGround && !player.isClimbing) {
      // Only apply if not jumping this frame
      if (player.vy >= 0) {
        Engine.applyGravity(player);
      }
    }

    // Move & collide
    player.hitHazard = false;
    player.hitWall = false;
    Engine.moveAndCollide(player, level);

    // Water bounce on ground hit
    if (player.waterBouncing && player.onGround) {
      player.vy = -7;
      player.onGround = false;
      player.waterBouncing = false;
      Audio.SFX.water();
    }

    // On landing, sync ground speed from velocity
    if (player.onGround && !player.rolling && !player.spinning) {
      player.groundSpeed = player.vx;
    } else if (player.onGround && (player.rolling || player.spinning)) {
      if (player.groundAngle !== 0) {
        player.groundSpeed = player.vx / Math.cos(player.groundAngle);
      } else {
        player.groundSpeed = player.vx;
      }
    }

    // Hazard check
    if (player.hitHazard) {
      hurtPlayer(player);
      updatePlayerAnim(player);
      return;
    }

    // Invincibility power defeats enemies on contact
    if (player.invincibilityPower) {
      player.invincible = true;
    }

    // Skill activation
    if (skillPressed && player.skillCooldown <= 0) {
      activateSkill(player, enemies);
    }

    // Active skill updates
    if (player.skillActive) {
      updateActiveSkill(player);
    }

    // Fall off screen -> death
    if (player.y > level.height * TILE + 64) {
      killPlayer(player);
    }

    // Animation
    updatePlayerAnim(player);
  }

  // ===== CLIMBING (Knuckles) =====

  function updateClimbing(player, level, pn, coop) {
    const inputUp = Input.up(pn, coop);
    const inputDown = Input.down(pn, coop);
    const jumpPressed = Input.jumpPressed(pn, coop);

    // Move up/down on wall
    if (inputUp) {
      player.y -= 1;
      player.climbDir = -1;
    } else if (inputDown) {
      player.y += 1;
      player.climbDir = 1;
    } else {
      player.climbDir = 0;
    }

    // Jump off wall
    if (jumpPressed) {
      player.isClimbing = false;
      player.facingRight = !player.facingRight;
      player.vx = player.facingRight ? 4 : -4;
      player.vy = player.jumpForce * 0.7;
      player.spinning = true;
      Audio.SFX.jump();
      return;
    }

    // Check if we've reached the top of the wall (no tile above)
    const checkCol = player.facingRight
      ? Math.floor((player.x + player.w + 1) / TILE)
      : Math.floor((player.x - 1) / TILE);
    const headRow = Math.floor(player.y / TILE);
    const headTile = Engine.getTile(level, checkCol, headRow);

    if (!Engine.isSolid(headTile)) {
      // Reached top - climb up
      player.isClimbing = false;
      player.y -= TILE;
      player.vy = -2;
      player.onGround = false;
    }

    // Check if wall has disappeared below feet
    const feetRow = Math.floor((player.y + player.h) / TILE);
    const feetTile = Engine.getTile(level, checkCol, feetRow);
    if (!Engine.isSolid(feetTile) && !Engine.isSolid(Engine.getTile(level, checkCol, feetRow - 1))) {
      // Wall gone - fall
      player.isClimbing = false;
      player.onGround = false;
    }

    // Fall off screen check
    if (player.y > level.height * TILE + 64) {
      player.isClimbing = false;
      killPlayer(player);
    }
  }

  // ===== SKILLS =====

  function activateSkill(player, enemies) {
    switch (player.skill) {
      case 'homing_attack':
        // Sonic: lock on to nearest enemy and dash toward it
        if (!player.onGround) {
          let nearest = null;
          let minDist = 150; // max lock-on range
          if (enemies) {
            for (const e of enemies) {
              if (!e.alive) continue;
              const dx = (e.x + e.w / 2) - (player.x + player.w / 2);
              const dy = (e.y + e.h / 2) - (player.y + player.h / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDist) {
                minDist = dist;
                nearest = e;
              }
            }
          }
          if (nearest) {
            const dx = (nearest.x + nearest.w / 2) - (player.x + player.w / 2);
            const dy = (nearest.y + nearest.h / 2) - (player.y + player.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const speed = 8;
            player.vx = (dx / dist) * speed;
            player.vy = (dy / dist) * speed;
            player.spinning = true;
            player.homingTarget = nearest;
          } else {
            // No target: dash forward
            player.vx = player.facingRight ? 8 : -8;
            player.vy = 1;
            player.spinning = true;
          }
          player.skillCooldown = player.skillMaxCooldown;
          player.skillActive = true;
          player.skillTimer = 30;
          Audio.SFX.whoosh();
        }
        break;

      case 'tail_swipe':
        // Tails: area damage around player
        player.skillActive = true;
        player.skillTimer = 15;
        player.skillCooldown = player.skillMaxCooldown;
        player.invincible = true;
        player.invTimer = Math.max(player.invTimer, 15);
        Audio.SFX.whoosh();
        break;

      case 'power_punch':
        // Knuckles: powerful forward punch
        player.skillActive = true;
        player.skillTimer = 20;
        player.skillCooldown = player.skillMaxCooldown;
        player.vx = player.facingRight ? 6 : -6;
        if (player.onGround) player.vy = -2;
        Audio.SFX.tap();
        break;

      case 'chaos_spear':
        // Shadow: ranged energy attack
        player.skillActive = true;
        player.skillTimer = 5;
        player.skillCooldown = player.skillMaxCooldown;
        // Creates a projectile - game.js handles spawning
        player.wantsChaosSpear = true;
        Audio.SFX.fire();
        break;

      case 'hammer_spin':
        // Amy: spinning hammer attack
        player.skillActive = true;
        player.skillTimer = 40;
        player.skillCooldown = player.skillMaxCooldown;
        player.invincible = true;
        player.invTimer = Math.max(player.invTimer, 40);
        player.hammerActive = true;
        player.hammerTimer = 40;
        Audio.SFX.whoosh();
        break;
    }
  }

  function updateActiveSkill(player) {
    player.skillTimer--;
    if (player.skillTimer <= 0) {
      player.skillActive = false;
      player.homingTarget = null;
      if (player.skill === 'tail_swipe' || player.skill === 'hammer_spin') {
        if (player.invTimer <= 0 && !player.invincibilityPower) {
          player.invincible = false;
        }
      }
    }
  }

  // ===== DAMAGE SYSTEM =====

  function hurtPlayer(player) {
    if (player.invincible || player.invincibilityPower) return;

    if (player.shield) {
      player.shield = null;
      player.invincible = true;
      player.invTimer = 60;
      Audio.SFX.wrong();
      return;
    }

    if (player.rings > 0) {
      // Scatter rings
      player.wantsScatterRings = Math.min(player.rings, 32); // cap at 32 scattered
      player.rings = 0;
      player.invincible = true;
      player.invTimer = 120;
      player.spinning = false;
      player.rolling = false;
      player.isGliding = false;
      player.isFlying = false;
      player.isClimbing = false;
      Audio.SFX.wrong();
      return;
    }

    // No rings, no shield -> death
    killPlayer(player);
  }

  function killPlayer(player) {
    if (!player.alive) return;
    player.alive = false;
    player.lives--;
    player.vy = -8;
    player.vx = 0;
    player.groundSpeed = 0;
    player.spinning = false;
    player.rolling = false;
    player.isFlying = false;
    player.isGliding = false;
    player.isClimbing = false;
    player.shield = null;
    player.speedBoost = false;
    player.invincibilityPower = false;
    player.hammerActive = false;
    player.skillActive = false;
    player.deathTimer = 0;
    player.deathY = player.y;
    Audio.SFX.die();
  }

  function respawnPlayer(player, level, otherPlayer) {
    player.alive = true;
    player.wantsRespawn = false;
    player.deathTimer = 0;
    player.invTimer = 120;
    player.invincible = true;
    player.vy = 0;
    player.vx = 0;
    player.groundSpeed = 0;
    player.spinning = false;
    player.rolling = false;
    player.crouching = false;
    player.lookingUp = false;
    player.isFlying = false;
    player.isGliding = false;
    player.isClimbing = false;
    player.spinDashing = false;
    player.shield = null;
    player.speedBoost = false;
    player.invincibilityPower = false;
    player.hammerActive = false;
    player.skillActive = false;
    player.wantsScatterRings = 0;
    player.rings = player.respawnRings;

    if (otherPlayer && otherPlayer.alive) {
      player.x = otherPlayer.x;
      player.y = otherPlayer.y - 24;
    } else {
      player.x = player.respawnX;
      player.y = player.respawnY;
    }
  }

  // ===== PLAYER ANIMATION =====

  function updatePlayerAnim(player) {
    if (!player.alive) {
      player.animState = 'hurt';
      player.animFrame = 0;
      return;
    }

    if (player.hammerActive && player.charType === 'amy') {
      player.animState = 'hammer';
      player.animFrame = 0;
      return;
    }

    if (player.isClimbing) {
      player.animState = 'climb';
      player.animFrame = 0;
      return;
    }

    if (player.isGliding) {
      player.animState = 'glide';
      player.animFrame = 0;
      return;
    }

    if (player.isFlying) {
      player.animState = 'fly';
      player.animTimer++;
      if (player.animTimer > 3) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 2;
      }
      return;
    }

    if (player.spinDashing) {
      player.animState = 'spinDash';
      player.animTimer++;
      if (player.animTimer > 2) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
      }
      return;
    }

    if (player.spinning || player.rolling) {
      player.animState = 'spin';
      // Spin speed scales with movement speed
      const spinDelay = Math.max(1, 4 - Math.floor(Math.abs(player.vx)));
      player.animTimer++;
      if (player.animTimer > spinDelay) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
      }
      return;
    }

    if (player.crouching) {
      player.animState = 'crouch';
      player.animFrame = 0;
      return;
    }

    if (player.lookingUp) {
      player.animState = 'lookUp';
      player.animFrame = 0;
      return;
    }

    if (!player.onGround) {
      player.animState = 'jump';
      player.animFrame = 0;
      return;
    }

    const absSpeed = Math.abs(player.groundSpeed);

    // Skidding: moving in one direction but facing the other
    if (absSpeed > 1 && (
      (player.groundSpeed > 0 && !player.facingRight) ||
      (player.groundSpeed < 0 && player.facingRight)
    )) {
      player.animState = 'skid';
      player.animFrame = 0;
      return;
    }

    if (absSpeed > 0.3) {
      player.animState = 'run';
      // Run animation speed scales with player speed
      const runDelay = Math.max(2, 8 - Math.floor(absSpeed * 1.2));
      player.animTimer++;
      if (player.animTimer > runDelay) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
      }
      return;
    }

    player.animState = 'idle';
    player.animFrame = 0;
    player.animTimer = 0;
  }

  // ===== PLAYER RENDER =====

  function renderPlayer(ctx, player, cam) {
    if (!player.alive && player.y > player.deathY + 300) return;

    // Invincibility flash
    if (player.invTimer > 0 && player.alive && !player.invincibilityPower) {
      if (Math.floor(player.invTimer / 3) % 2 === 0) return;
    }

    const anims = SPRITES.ANIMS[player.charType];
    if (!anims) return;

    const frames = anims[player.animState] || anims.idle;
    const frame = frames[player.animFrame % frames.length];

    const [sx, sy] = Camera.worldToScreen(player.x - 1, player.y);

    // Invincibility power: rainbow tint
    if (player.invincibilityPower && player.alive) {
      ctx.save();
      ctx.filter = `hue-rotate(${(player.invincibilityTimer * 12) % 360}deg) saturate(2)`;
      Engine.drawSprite(ctx, frame, sx, sy, player.facingRight);
      ctx.restore();
    }
    // Speed boost: bright tint + flashing when ending
    else if (player.speedBoost && player.alive) {
      ctx.save();
      if (player.speedTimer < 120 && Math.floor(player.speedTimer / 6) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      ctx.filter = 'saturate(1.5) brightness(1.2)';
      Engine.drawSprite(ctx, frame, sx, sy, player.facingRight);
      ctx.restore();
    } else {
      Engine.drawSprite(ctx, frame, sx, sy, player.facingRight);
    }

    // Shield bubble
    if (player.shield && player.alive) {
      renderShield(ctx, player, sx, sy);
    }

    // Hammer hitbox visual (Amy)
    if (player.hammerActive && player.alive && player.charType === 'amy') {
      // Hammer is drawn as part of the hammer sprite
    }
  }

  function renderShield(ctx, player, sx, sy) {
    const sw = 16 * SCALE;
    const sh = 16 * SCALE;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const r = sw / 2 + 4;
    const pulse = Math.sin(Date.now() / 200) * 0.2;

    ctx.save();
    switch (player.shield) {
      case 'basic':
        ctx.strokeStyle = `rgba(100, 181, 246, ${0.5 + pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'flame':
        ctx.strokeStyle = `rgba(255, 87, 34, ${0.6 + pulse})`;
        ctx.fillStyle = `rgba(255, 152, 0, ${0.15 + pulse * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'water':
        ctx.strokeStyle = `rgba(0, 188, 212, ${0.5 + pulse})`;
        ctx.fillStyle = `rgba(0, 188, 212, ${0.1 + pulse * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'lightning':
        ctx.strokeStyle = `rgba(255, 235, 59, ${0.6 + pulse})`;
        ctx.fillStyle = `rgba(255, 235, 59, ${0.1 + pulse * 0.05})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Small sparks
        for (let i = 0; i < 3; i++) {
          const a = (Date.now() / 100 + i * 2.1) % (Math.PI * 2);
          const sparkX = cx + Math.cos(a) * (r + 3);
          const sparkY = cy + Math.sin(a) * (r + 3);
          ctx.fillStyle = '#FFEB3B';
          ctx.fillRect(sparkX - 1, sparkY - 1, 3, 3);
        }
        break;
    }
    ctx.restore();
  }

  // ===== ENEMIES =====

  function createEnemy(enemyType, x, y) {
    const base = {
      type: enemyType,
      x, y, w: 16, h: 16,
      vx: 0, vy: 0,
      alive: true,
      defeated: false,
      flickie: null,
      animFrame: 0, animTimer: 0,
      scoreValue: 100,
      noStomp: false,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      hitCeiling: false,
      groundTile: 0,
      facingRight: false,
    };

    switch (enemyType) {
      case 'motobug':
        base.vx = -0.5;
        base.scoreValue = 100;
        break;
      case 'buzzbomber':
        base.vx = -0.8;
        base.baseY = y;
        base.flyPhase = Math.random() * Math.PI * 2;
        base.shootTimer = 120 + Math.floor(Math.random() * 60);
        base.scoreValue = 200;
        break;
      case 'crabmeat':
        base.vx = 0;
        base.shootTimer = 60 + Math.floor(Math.random() * 60);
        base.scoreValue = 200;
        base.wantsProjectile = false;
        base.projDir = 0;
        break;
      case 'spiny':
        base.vx = -0.7;
        base.noStomp = true;
        base.scoreValue = 200;
        break;
      case 'grabber':
        base.baseY = y;
        base.vx = 0;
        base.vy = 0;
        base.phase = 'waiting'; // waiting, dropping, grabbing, retracting
        base.grabTimer = 0;
        base.scoreValue = 200;
        break;
      case 'penguinator':
        base.vx = -0.5;
        base.sliding = false;
        base.slideSpeed = 3.0;
        base.scoreValue = 200;
        break;
      case 'ballhog':
        base.vx = 0;
        base.shootTimer = 90;
        base.wantsBomb = false;
        base.scoreValue = 200;
        break;
      case 'caterkiller':
        base.vx = -0.3;
        base.noStomp = false; // head is stompable
        base.scoreValue = 300;
        // Body segments (trail behind the head)
        base.segments = [];
        for (let i = 0; i < 3; i++) {
          base.segments.push({
            x: x + (i + 1) * 10,
            y: y + 4,
            w: 8, h: 8,
          });
        }
        base.historyX = [];
        base.historyY = [];
        for (let i = 0; i < 40; i++) {
          base.historyX.push(x);
          base.historyY.push(y);
        }
        break;
    }

    return base;
  }

  function updateEnemy(enemy, level, players) {
    if (!enemy.alive) {
      // Update flickie if exists
      if (enemy.flickie) {
        updateFlickie(enemy.flickie);
      }
      return false;
    }

    enemy.animTimer++;
    if (enemy.animTimer > 10) {
      enemy.animTimer = 0;
      enemy.animFrame = (enemy.animFrame + 1) % 2;
    }

    switch (enemy.type) {
      case 'motobug':
        updateMotobug(enemy, level);
        break;
      case 'buzzbomber':
        updateBuzzbomber(enemy, level, players);
        break;
      case 'crabmeat':
        updateCrabmeat(enemy, level, players);
        break;
      case 'spiny':
        updateSpiny(enemy, level);
        break;
      case 'grabber':
        updateGrabber(enemy, level, players);
        break;
      case 'penguinator':
        updatePenguinator(enemy, level, players);
        break;
      case 'ballhog':
        updateBallhog(enemy, level, players);
        break;
      case 'caterkiller':
        updateCaterkiller(enemy, level);
        break;
    }

    return true;
  }

  function updateMotobug(enemy, level) {
    Engine.applyGravity(enemy);
    enemy.hitWall = false;
    Engine.moveAndCollide(enemy, level);

    if (enemy.hitWall) {
      enemy.vx = -enemy.vx;
      enemy.facingRight = enemy.vx > 0;
    }

    // Turn at ledges
    if (enemy.onGround) {
      const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
      const belowRow = Math.floor((enemy.y + enemy.h + 2) / TILE);
      if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
        enemy.vx = -enemy.vx;
        enemy.facingRight = enemy.vx > 0;
      }
    }
  }

  function updateBuzzbomber(enemy, level, players) {
    // Fly in sine wave
    enemy.flyPhase += 0.03;
    enemy.y = enemy.baseY + Math.sin(enemy.flyPhase) * 30;
    enemy.x += enemy.vx;

    // Face direction of movement
    enemy.facingRight = enemy.vx > 0;

    // Shoot downward periodically
    enemy.shootTimer--;
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 120 + Math.floor(Math.random() * 60);
      // Signal game.js to create a downward projectile
      enemy.wantsProjectile = true;
      enemy.projX = enemy.x + enemy.w / 2;
      enemy.projY = enemy.y + enemy.h;
    }
  }

  function updateCrabmeat(enemy, level, players) {
    // Stationary, fires projectiles left and right
    enemy.shootTimer--;
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 120;
      enemy.wantsProjectile = true;
      // Fires both directions
      enemy.projDir = 0; // 0 means both
    }
  }

  function updateSpiny(enemy, level) {
    Engine.applyGravity(enemy);
    enemy.hitWall = false;
    Engine.moveAndCollide(enemy, level);

    if (enemy.hitWall) {
      enemy.vx = -enemy.vx;
      enemy.facingRight = enemy.vx > 0;
    }

    // Turn at ledges
    if (enemy.onGround) {
      const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
      const belowRow = Math.floor((enemy.y + enemy.h + 2) / TILE);
      if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
        enemy.vx = -enemy.vx;
        enemy.facingRight = enemy.vx > 0;
      }
    }
  }

  function updateGrabber(enemy, level, players) {
    switch (enemy.phase) {
      case 'waiting':
        // Hang at ceiling, wait for player below
        enemy.y = enemy.baseY;
        if (players) {
          for (const p of players) {
            if (!p.alive) continue;
            const dx = Math.abs((p.x + p.w / 2) - (enemy.x + enemy.w / 2));
            if (dx < 48 && p.y > enemy.y) {
              enemy.phase = 'dropping';
              break;
            }
          }
        }
        break;
      case 'dropping':
        enemy.vy = 2;
        enemy.y += enemy.vy;
        // Drop a certain distance then retract
        if (enemy.y - enemy.baseY > 80) {
          enemy.phase = 'retracting';
        }
        // Check if grabbed player
        if (players) {
          for (const p of players) {
            if (!p.alive) continue;
            if (Engine.overlap(enemy, p)) {
              hurtPlayer(p);
              enemy.phase = 'retracting';
              break;
            }
          }
        }
        break;
      case 'retracting':
        enemy.vy = -1.5;
        enemy.y += enemy.vy;
        if (enemy.y <= enemy.baseY) {
          enemy.y = enemy.baseY;
          enemy.vy = 0;
          enemy.phase = 'waiting';
          enemy.grabTimer = 120;
        }
        break;
    }
  }

  function updatePenguinator(enemy, level, players) {
    Engine.applyGravity(enemy);
    enemy.hitWall = false;

    if (!enemy.sliding) {
      // Patrol
      Engine.moveAndCollide(enemy, level);

      if (enemy.hitWall) {
        enemy.vx = -enemy.vx;
        enemy.facingRight = enemy.vx > 0;
      }

      // Turn at ledges
      if (enemy.onGround) {
        const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
        const belowRow = Math.floor((enemy.y + enemy.h + 2) / TILE);
        if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
          enemy.vx = -enemy.vx;
          enemy.facingRight = enemy.vx > 0;
        }
      }

      // Spot player
      if (players) {
        for (const p of players) {
          if (!p.alive) continue;
          const dx = p.x - enemy.x;
          if (Math.abs(dx) < 100 && Math.abs(p.y - enemy.y) < 32) {
            // Slide toward player
            enemy.sliding = true;
            enemy.vx = dx > 0 ? enemy.slideSpeed : -enemy.slideSpeed;
            enemy.facingRight = enemy.vx > 0;
            break;
          }
        }
      }
    } else {
      // Sliding fast
      Engine.moveAndCollide(enemy, level);

      if (enemy.hitWall) {
        // Bounce off wall
        enemy.vx = -enemy.vx;
        enemy.facingRight = enemy.vx > 0;
        enemy.sliding = false;
      }

      // Turn at ledges when sliding
      if (enemy.onGround) {
        const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
        const belowRow = Math.floor((enemy.y + enemy.h + 2) / TILE);
        if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
          enemy.vx = -enemy.vx;
          enemy.facingRight = enemy.vx > 0;
          enemy.sliding = false;
        }
      }
    }
  }

  function updateBallhog(enemy, level, players) {
    // Stationary, lobs bouncing bombs
    enemy.shootTimer--;
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 90;
      enemy.wantsBomb = true;
    }
  }

  function updateCaterkiller(enemy, level) {
    Engine.applyGravity(enemy);
    enemy.hitWall = false;
    Engine.moveAndCollide(enemy, level);

    if (enemy.hitWall) {
      enemy.vx = -enemy.vx;
      enemy.facingRight = enemy.vx > 0;
    }

    // Turn at ledges
    if (enemy.onGround) {
      const aheadCol = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
      const belowRow = Math.floor((enemy.y + enemy.h + 2) / TILE);
      if (!Engine.isSolid(Engine.getTile(level, aheadCol, belowRow))) {
        enemy.vx = -enemy.vx;
        enemy.facingRight = enemy.vx > 0;
      }
    }

    // Record position history for body segments
    enemy.historyX.unshift(enemy.x);
    enemy.historyY.unshift(enemy.y);
    // Keep only enough history
    if (enemy.historyX.length > 40) {
      enemy.historyX.pop();
      enemy.historyY.pop();
    }

    // Position body segments along history trail
    for (let i = 0; i < enemy.segments.length; i++) {
      const histIdx = (i + 1) * 10;
      if (histIdx < enemy.historyX.length) {
        enemy.segments[i].x = enemy.historyX[histIdx] + 4; // offset to center 8px segment in 16px head trail
        enemy.segments[i].y = enemy.historyY[histIdx] + 4;
      }
    }
  }

  function defeatEnemy(enemy, player) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.defeated = true;
    enemy.flickie = createFlickie(enemy.x + enemy.w / 2 - 4, enemy.y);
    if (player) {
      player.score += enemy.scoreValue;
    }
    Audio.SFX.correct();
  }

  // ===== ENEMY RENDER =====

  function renderEnemy(ctx, enemy, cam) {
    if (!enemy.alive) {
      // Render flickie if exists
      if (enemy.flickie && enemy.flickie.lifetime > 0) {
        renderFlickie(ctx, enemy.flickie, cam);
      }
      return;
    }

    let frames;
    switch (enemy.type) {
      case 'motobug':
        frames = SPRITES.ANIMS.motobug.walk;
        break;
      case 'buzzbomber':
        frames = SPRITES.ANIMS.buzzbomber.fly;
        break;
      case 'crabmeat':
        frames = SPRITES.ANIMS.crabmeat.walk;
        break;
      case 'spiny':
        frames = SPRITES.ANIMS.spiny.walk;
        break;
      case 'grabber':
        frames = SPRITES.ANIMS.grabber.hang;
        break;
      case 'penguinator':
        frames = SPRITES.ANIMS.penguinator.walk;
        break;
      case 'ballhog':
        frames = SPRITES.ANIMS.ballhog.walk;
        break;
      case 'caterkiller':
        // Render body segments first (behind head)
        if (enemy.segments) {
          const bodyFrames = SPRITES.ANIMS.caterkiller.body;
          const bodyFrame = bodyFrames[0];
          for (let i = enemy.segments.length - 1; i >= 0; i--) {
            const seg = enemy.segments[i];
            const [bx, by] = Camera.worldToScreen(seg.x, seg.y);
            Engine.drawSprite(ctx, bodyFrame, bx, by, false);
          }
        }
        frames = SPRITES.ANIMS.caterkiller.head;
        break;
      default:
        frames = SPRITES.ANIMS.motobug.walk;
        break;
    }

    const frame = frames[enemy.animFrame % frames.length];
    const [sx, sy] = Camera.worldToScreen(enemy.x, enemy.y);
    const flip = enemy.facingRight;

    // Grabber: draw tether line from base to current position
    if (enemy.type === 'grabber' && enemy.phase !== 'waiting') {
      const [baseX, baseY] = Camera.worldToScreen(enemy.x + enemy.w / 2, enemy.baseY);
      const [curX, curY] = Camera.worldToScreen(enemy.x + enemy.w / 2, enemy.y);
      ctx.save();
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.restore();
    }

    Engine.drawSprite(ctx, frame, sx, sy, flip);
  }

  // ===== RINGS =====

  function createRing(x, y) {
    return {
      type: 'ring',
      x, y, w: 12, h: 12,
      animFrame: 0, animTimer: 0,
      collected: false,
    };
  }

  function updateRing(ring) {
    if (ring.collected) return false;
    ring.animTimer++;
    if (ring.animTimer > 8) {
      ring.animTimer = 0;
      ring.animFrame = (ring.animFrame + 1) % 4;
    }
    return true;
  }

  function renderRing(ctx, ring, cam) {
    if (ring.collected) return;
    const frames = SPRITES.ANIMS.ring.spin;
    const frame = frames[ring.animFrame % frames.length];
    const [sx, sy] = Camera.worldToScreen(ring.x, ring.y);
    Engine.drawSprite(ctx, frame, sx, sy, false);
  }

  // ===== SCATTERED RINGS =====

  function createScatteredRing(x, y, angle, speed) {
    return {
      type: 'scattered_ring',
      x, y, w: 8, h: 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      lifetime: 240,
      collectTimer: 30,
      bounces: 0,
      collected: false,
      animFrame: 0, animTimer: 0,
      onGround: false,
      hitWall: false,
      hitHazard: false,
      hitCeiling: false,
      groundTile: 0,
    };
  }

  function updateScatteredRing(ring, level) {
    if (ring.collected) return false;

    ring.lifetime--;
    if (ring.lifetime <= 0) return false;

    if (ring.collectTimer > 0) ring.collectTimer--;

    // Gravity
    ring.vy += Engine.GRAVITY * 2;
    if (ring.vy > 8) ring.vy = 8;

    // Move
    ring.x += ring.vx;
    ring.y += ring.vy;

    // Simple ground bounce
    const feetRow = Math.floor((ring.y + ring.h) / TILE);
    const col = Math.floor((ring.x + ring.w / 2) / TILE);
    const belowTile = Engine.getTile(level, col, feetRow);

    if (Engine.isSolid(belowTile) && ring.vy > 0) {
      ring.y = feetRow * TILE - ring.h;
      ring.vy *= -0.75;
      ring.bounces++;
      if (ring.bounces >= 3) {
        ring.vy = 0;
        ring.vx = 0;
      }
    }

    // Wall bounce
    const wallCol = Math.floor((ring.vx > 0 ? ring.x + ring.w : ring.x) / TILE);
    const midRow = Math.floor((ring.y + ring.h / 2) / TILE);
    if (Engine.isSolid(Engine.getTile(level, wallCol, midRow))) {
      ring.vx = -ring.vx * 0.5;
    }

    // Animation
    ring.animTimer++;
    if (ring.animTimer > 6) {
      ring.animTimer = 0;
      ring.animFrame = (ring.animFrame + 1) % 4;
    }

    return true;
  }

  function renderScatteredRing(ctx, ring, cam) {
    if (ring.collected) return;

    // Flash near end of lifetime
    if (ring.lifetime < 60 && Math.floor(ring.lifetime / 4) % 2 === 0) return;

    const frames = SPRITES.ANIMS.ring.spin;
    const frame = frames[ring.animFrame % frames.length];
    const [sx, sy] = Camera.worldToScreen(ring.x, ring.y);
    Engine.drawSprite(ctx, frame, sx, sy, false);
  }

  // ===== MONITORS =====

  function createMonitor(x, y, item) {
    return {
      type: 'monitor',
      x, y, w: 16, h: 16,
      item, // 'ring_ten', 'shield_basic', 'shield_flame', 'shield_water', 'shield_lightning', 'invincibility', 'speed', 'life'
      alive: true,
      animFrame: 0,
    };
  }

  function applyMonitorItem(monitor, player) {
    if (!monitor.alive) return;
    monitor.alive = false;

    switch (monitor.item) {
      case 'ring_ten':
        player.rings += 10;
        player.score += 100;
        Audio.SFX.coin();
        break;
      case 'shield_basic':
        player.shield = 'basic';
        Audio.SFX.powerup();
        break;
      case 'shield_flame':
        player.shield = 'flame';
        Audio.SFX.powerup();
        break;
      case 'shield_water':
        player.shield = 'water';
        Audio.SFX.powerup();
        break;
      case 'shield_lightning':
        player.shield = 'lightning';
        Audio.SFX.powerup();
        break;
      case 'invincibility':
        player.invincibilityPower = true;
        player.invincibilityTimer = 1200;
        player.invincible = true;
        Audio.SFX.powerup();
        break;
      case 'speed':
        player.speedBoost = true;
        player.speedTimer = 1200;
        Audio.SFX.powerup();
        break;
      case 'life':
        player.lives++;
        Audio.SFX.fanfare();
        break;
    }
  }

  function renderMonitor(ctx, monitor, cam) {
    const [sx, sy] = Camera.worldToScreen(monitor.x, monitor.y);

    if (monitor.alive) {
      // Draw the box
      Engine.drawSprite(ctx, SPRITES.MONITOR_BOX, sx, sy, false);
      // Draw the icon overlay centered on the screen area
      const icon = getMonitorIcon(monitor.item);
      if (icon) {
        // Icon is 8x8, monitor screen area starts roughly at (4,2) in 16x16
        const iconX = sx + 4 * SCALE;
        const iconY = sy + 2 * SCALE;
        Engine.drawSprite(ctx, icon, iconX, iconY, false);
      }
    } else {
      // Broken monitor base
      Engine.drawSprite(ctx, SPRITES.MONITOR_BROKEN, sx, sy, false);
    }
  }

  function getMonitorIcon(item) {
    switch (item) {
      case 'ring_ten': return SPRITES.ICON_RING;
      case 'shield_basic': return SPRITES.ICON_SHIELD;
      case 'shield_flame': return SPRITES.ICON_FLAME;
      case 'shield_water': return SPRITES.ICON_WATER;
      case 'shield_lightning': return SPRITES.ICON_LIGHTNING;
      case 'invincibility': return SPRITES.ICON_INVINCIBLE;
      case 'speed': return SPRITES.ICON_SPEED;
      case 'life': return SPRITES.ICON_LIFE;
      default: return null;
    }
  }

  // ===== SPRINGS =====

  function createSpring(x, y, direction, strong) {
    return {
      type: 'spring',
      x, y, w: 16, h: 16,
      direction: direction || 'up', // 'up', 'left', 'right'
      force: strong ? 16 : 10,
      strong: !!strong,
      compressed: false,
      compressTimer: 0,
    };
  }

  function updateSpring(spring) {
    if (spring.compressed) {
      spring.compressTimer--;
      if (spring.compressTimer <= 0) {
        spring.compressed = false;
      }
    }
  }

  function applySpring(spring, player) {
    switch (spring.direction) {
      case 'up':
        player.vy = -spring.force;
        player.onGround = false;
        player.rolling = false;
        player.spinning = false;
        player.crouching = false;
        break;
      case 'left':
        player.vx = -spring.force;
        player.groundSpeed = -spring.force;
        break;
      case 'right':
        player.vx = spring.force;
        player.groundSpeed = spring.force;
        break;
    }
    spring.compressed = true;
    spring.compressTimer = 12;
    Audio.SFX.jump();
  }

  function renderSpring(ctx, spring, cam) {
    const [sx, sy] = Camera.worldToScreen(spring.x, spring.y);
    const sprite = spring.strong ? SPRITES.SPRING_UP_RED : SPRITES.SPRING_UP;

    if (spring.direction === 'up') {
      // Draw compressed (shorter) or normal
      if (spring.compressed) {
        // Draw at bottom of tile only (compressed look)
        Engine.drawSprite(ctx, sprite, sx, sy + 4 * SCALE, false);
      } else {
        Engine.drawSprite(ctx, sprite, sx, sy, false);
      }
    } else {
      // Horizontal springs: draw rotated (approximate by just flipping)
      const flip = spring.direction === 'left';
      Engine.drawSprite(ctx, sprite, sx, sy, flip);
    }
  }

  // ===== CHECKPOINTS =====

  function createCheckpoint(x, y) {
    return {
      type: 'checkpoint',
      x, y, w: 8, h: 32,
      activated: false,
      spinTimer: 0,
    };
  }

  function activateCheckpoint(cp, player) {
    if (cp.activated) return;
    cp.activated = true;
    cp.spinTimer = 60;
    // Store respawn position
    player.respawnX = cp.x;
    player.respawnY = cp.y;
    player.respawnRings = player.rings;
    Audio.SFX.correct();
  }

  function updateCheckpoint(cp) {
    if (cp.spinTimer > 0) cp.spinTimer--;
  }

  function renderCheckpoint(ctx, cp, cam) {
    const [sx, sy] = Camera.worldToScreen(cp.x, cp.y);
    const sprite = cp.activated ? SPRITES.CHECKPOINT_ON : SPRITES.CHECKPOINT_OFF;
    Engine.drawSprite(ctx, sprite, sx, sy, false);
  }

  // ===== DASH PADS =====

  function createDashPad(x, y) {
    return {
      type: 'dashpad',
      x, y, w: 16, h: 8,
    };
  }

  function applyDashPad(pad, player) {
    player.groundSpeed = player.facingRight ? 10 : -10;
    player.vx = player.groundSpeed;
    player.rolling = true;
    player.spinning = true;
    Audio.SFX.whoosh();
  }

  function renderDashPad(ctx, pad, cam) {
    const [sx, sy] = Camera.worldToScreen(pad.x, pad.y);
    const flip = false; // could flip based on direction
    Engine.drawSprite(ctx, SPRITES.DASH_PAD, sx, sy, flip);
  }

  // ===== FLICKIES =====

  function createFlickie(x, y) {
    return {
      type: 'flickie',
      x, y, w: 8, h: 8,
      vx: (Math.random() - 0.5) * 4,
      vy: -3,
      lifetime: 120,
      animFrame: 0, animTimer: 0,
    };
  }

  function updateFlickie(flickie) {
    if (flickie.lifetime <= 0) return false;
    flickie.lifetime--;
    flickie.x += flickie.vx;
    flickie.y += flickie.vy;
    flickie.vy += 0.05; // gentle gravity
    // Flap upward occasionally
    if (flickie.lifetime % 20 === 0) {
      flickie.vy = -2;
    }
    // Animation
    flickie.animTimer++;
    if (flickie.animTimer > 6) {
      flickie.animTimer = 0;
      flickie.animFrame = (flickie.animFrame + 1) % 2;
    }
    return flickie.lifetime > 0;
  }

  function renderFlickie(ctx, flickie, cam) {
    if (flickie.lifetime <= 0) return;
    // Fade out near end
    if (flickie.lifetime < 30) {
      if (Math.floor(flickie.lifetime / 3) % 2 === 0) return;
    }
    const frames = SPRITES.ANIMS.flickie.fly;
    const frame = frames[flickie.animFrame % frames.length];
    const [sx, sy] = Camera.worldToScreen(flickie.x, flickie.y);
    const flip = flickie.vx < 0;
    Engine.drawSprite(ctx, frame, sx, sy, flip);
  }

  // ===== BOSS (Eggman) =====

  function createBoss(x, y) {
    return {
      type: 'boss',
      x, y, w: 32, h: 32,
      hp: 8, maxHp: 8,
      alive: true,
      phase: 0,
      timer: 0,
      vx: 1.5, vy: 0,
      invincible: false, invTimer: 0,
      pattern: 'hover', // 'hover', 'attack', 'retreat', 'defeated'
      patternTimer: 180,
      baseY: y,
      hoverPhase: 0,
      swoopTarget: null,
      wantsProjectile: false,
      animFrame: 0, animTimer: 0,
      flashTimer: 0,
      defeatedTimer: 0,
      flickies: [],
      facingRight: false,
    };
  }

  function updateBoss(boss, level, players) {
    if (!boss.alive) {
      boss.defeatedTimer++;
      // Update flickies
      for (const f of boss.flickies) {
        updateFlickie(f);
      }
      return;
    }

    // Animation
    boss.animTimer++;
    if (boss.animTimer > 12) {
      boss.animTimer = 0;
      boss.animFrame = (boss.animFrame + 1) % 2;
    }

    // Invincibility after hit
    if (boss.invTimer > 0) {
      boss.invTimer--;
      if (boss.invTimer <= 0) {
        boss.invincible = false;
      }
    }

    boss.flashTimer = boss.invTimer;

    // Face nearest player
    if (players) {
      let nearest = null;
      let minDist = Infinity;
      for (const p of players) {
        if (!p.alive) continue;
        const d = Math.abs(p.x - boss.x);
        if (d < minDist) { minDist = d; nearest = p; }
      }
      if (nearest) {
        boss.facingRight = nearest.x > boss.x;
        boss.swoopTarget = nearest;
      }
    }

    boss.patternTimer--;

    switch (boss.pattern) {
      case 'hover':
        updateBossHover(boss);
        if (boss.patternTimer <= 0) {
          // Choose attack
          if (boss.hp <= 4) {
            // More aggressive in second half
            boss.pattern = Math.random() < 0.6 ? 'attack' : 'shoot';
          } else {
            boss.pattern = Math.random() < 0.5 ? 'attack' : 'shoot';
          }
          boss.patternTimer = 120;
        }
        break;

      case 'attack':
        updateBossAttack(boss);
        if (boss.patternTimer <= 0) {
          boss.pattern = 'retreat';
          boss.patternTimer = 90;
        }
        break;

      case 'shoot':
        updateBossShoot(boss);
        if (boss.patternTimer <= 0) {
          boss.pattern = 'retreat';
          boss.patternTimer = 90;
        }
        break;

      case 'retreat':
        updateBossRetreat(boss);
        if (boss.patternTimer <= 0) {
          boss.pattern = 'hover';
          boss.patternTimer = 120 + Math.floor(Math.random() * 60);
        }
        break;
    }

    // Keep boss within level bounds
    boss.x = Math.max(0, Math.min(boss.x, level.width * TILE - boss.w));
  }

  function updateBossHover(boss) {
    // Hover above the player area
    boss.hoverPhase += 0.03;
    boss.vy = Math.sin(boss.hoverPhase) * 0.5;
    boss.y += boss.vy;

    // Drift toward player
    if (boss.swoopTarget) {
      const targetX = boss.swoopTarget.x;
      if (Math.abs(boss.x - targetX) > 20) {
        boss.vx = boss.x < targetX ? 1.5 : -1.5;
      } else {
        boss.vx *= 0.9;
      }
    }
    boss.x += boss.vx;

    // Stay elevated
    const desiredY = boss.baseY - 48;
    boss.y += (desiredY - boss.y) * 0.05;
  }

  function updateBossAttack(boss) {
    // Swoop down toward player
    if (boss.patternTimer > 80) {
      // Rising before swoop
      boss.y -= 1;
    } else if (boss.patternTimer > 40) {
      // Swooping down
      if (boss.swoopTarget) {
        const dx = boss.swoopTarget.x - boss.x;
        const dy = boss.swoopTarget.y - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        boss.vx = (dx / dist) * 3;
        boss.vy = (dy / dist) * 3;
      } else {
        boss.vy = 3;
      }
      boss.x += boss.vx;
      boss.y += boss.vy;
    } else {
      // Pulling back up
      boss.vy = -2;
      boss.y += boss.vy;
      boss.vx *= 0.95;
      boss.x += boss.vx;
    }
  }

  function updateBossShoot(boss) {
    // Hover and fire projectile
    boss.hoverPhase += 0.02;
    boss.y = boss.baseY - 48 + Math.sin(boss.hoverPhase) * 10;

    // Fire at midpoint of pattern
    if (boss.patternTimer === 60) {
      boss.wantsProjectile = true;
    }

    // Slight drift
    if (boss.swoopTarget) {
      const dx = boss.swoopTarget.x - boss.x;
      boss.vx = Math.sign(dx) * 0.5;
      boss.x += boss.vx;
    }
  }

  function updateBossRetreat(boss) {
    // Rise back to hover position
    const desiredY = boss.baseY - 48;
    boss.y += (desiredY - boss.y) * 0.08;
    boss.vx *= 0.95;
    boss.x += boss.vx;
  }

  function hitBoss(boss, player) {
    if (boss.invincible || !boss.alive) return false;

    boss.hp--;
    boss.invincible = true;
    boss.invTimer = 60;
    boss.flashTimer = 60;

    // Knockback boss
    boss.vy = -3;
    boss.vx = player.x < boss.x ? 2 : -2;

    // Bounce player
    player.vy = player.jumpForce * 0.6;
    player.spinning = true;

    if (boss.hp <= 0) {
      // Defeated
      boss.alive = false;
      boss.pattern = 'defeated';
      boss.defeatedTimer = 0;
      // Spawn flickies
      for (let i = 0; i < 8; i++) {
        boss.flickies.push(createFlickie(
          boss.x + boss.w / 2 + (Math.random() - 0.5) * 20,
          boss.y + (Math.random() - 0.5) * 10
        ));
      }
      player.score += 1000;
      Audio.SFX.fanfare();
    } else {
      Audio.SFX.stomp();
    }

    return true;
  }

  function renderBoss(ctx, boss, cam) {
    // Render flickies (from defeat)
    for (const f of boss.flickies) {
      renderFlickie(ctx, f, cam);
    }

    if (!boss.alive && boss.defeatedTimer > 30) return;

    // Flash when hit
    if (boss.flashTimer > 0 && Math.floor(boss.flashTimer / 3) % 2 === 0) return;

    const frames = SPRITES.ANIMS.eggman.idle;
    const frame = frames[boss.animFrame % frames.length];
    const [sx, sy] = Camera.worldToScreen(boss.x, boss.y);

    // Draw Eggman (he's 16x16 sprite but boss hitbox is 32x32, draw centered)
    const drawX = sx + 8 * SCALE;
    const drawY = sy + 8 * SCALE;
    const flip = !boss.facingRight;

    // Draw machine body (grey box around Eggman)
    ctx.save();
    ctx.fillStyle = '#757575';
    ctx.fillRect(sx, sy + 12 * SCALE, 32 * SCALE, 20 * SCALE);
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(sx + 2 * SCALE, sy + 14 * SCALE, 28 * SCALE, 16 * SCALE);
    // Dome on top
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.arc(sx + 16 * SCALE, sy + 12 * SCALE, 14 * SCALE, Math.PI, 0);
    ctx.fill();
    // Glass dome
    ctx.fillStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.beginPath();
    ctx.arc(sx + 16 * SCALE, sy + 12 * SCALE, 12 * SCALE, Math.PI, 0);
    ctx.fill();
    ctx.restore();

    // Draw Eggman inside dome
    Engine.drawSprite(ctx, frame, drawX, drawY - 4 * SCALE, flip);

    // HP bar
    if (boss.alive) {
      const barW = 32 * SCALE;
      const barH = 4;
      const barX = sx;
      const barY = sy - 8;
      ctx.fillStyle = '#424242';
      ctx.fillRect(barX, barY, barW, barH);
      const hpRatio = boss.hp / boss.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FFD740' : '#E52521';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }

    // Defeat explosion effect
    if (!boss.alive && boss.defeatedTimer <= 30) {
      ctx.save();
      const t = boss.defeatedTimer / 30;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#FF6D00';
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + boss.defeatedTimer * 0.2;
        const dist = t * 40;
        const ex = sx + 16 * SCALE + Math.cos(angle) * dist;
        const ey = sy + 16 * SCALE + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(ex, ey, 4 + (1 - t) * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ===== EXPORT =====

  return {
    CHAR_STATS,
    createPlayer, updatePlayer, renderPlayer, hurtPlayer, killPlayer, respawnPlayer,
    createEnemy, updateEnemy, renderEnemy, defeatEnemy,
    createRing, updateRing, createScatteredRing, updateScatteredRing, renderRing, renderScatteredRing,
    createMonitor, renderMonitor, applyMonitorItem,
    createSpring, updateSpring, applySpring, renderSpring,
    createCheckpoint, activateCheckpoint, updateCheckpoint, renderCheckpoint,
    createDashPad, applyDashPad, renderDashPad,
    createFlickie, updateFlickie, renderFlickie,
    createBoss, updateBoss, hitBoss, renderBoss,
  };
})();
