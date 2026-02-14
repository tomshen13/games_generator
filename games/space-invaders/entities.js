/**
 * Entities — player ship, enemies, boss, bullets, pickups, explosions.
 * create/update/render pattern for each entity type.
 */
const Entities = (() => {
  const S = Engine.SCALE;

  // ===== PLAYER SHIP =====

  function createPlayer(pn, shipType, cw, ch) {
    const w = 16 * S;
    const h = 16 * S;
    return {
      pn,                         // player number (1 or 2)
      shipType: shipType || 'falcon',
      x: cw / 2 - w / 2 + (pn === 2 ? 60 : pn === 1 ? -60 : 0),
      y: ch - h - 30,
      w, h,
      vx: 0, vy: 0,
      speed: shipType === 'falcon' ? 4.5 : shipType === 'titan' ? 2.8 : 3.5,
      fireRate: shipType === 'phantom' ? 15 : shipType === 'titan' ? 25 : 20, // frames between shots
      fireCooldown: 0,
      hp: shipType === 'titan' ? 4 : 3,
      maxHp: shipType === 'titan' ? 4 : 3,
      lives: 3,
      alive: true,
      respawnTimer: 0,
      invincible: 0,              // frames of invincibility remaining
      animFrame: 0,
      animTimer: 0,
      combo: 0,                   // consecutive kills without damage
      // Upgrade state
      upgrades: [],               // list of upgrade type strings
      hasBomb: false,
      bombUsed: false,
    };
  }

  function updatePlayer(p, coop, cw, ch) {
    if (!p.alive) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0 && p.lives > 0) {
        p.alive = true;
        p.hp = p.maxHp;
        p.invincible = 120; // 2 seconds
        p.x = cw / 2 - p.w / 2;
        p.y = ch - p.h - 30;
      }
      return;
    }

    // Movement
    const spd = p.speed * (p.upgrades.includes('speedBoost') ? 1.3 : 1);
    p.vx = 0;
    p.vy = 0;
    if (Engine.Input.left(p.pn, coop)) p.vx = -spd;
    if (Engine.Input.right(p.pn, coop)) p.vx = spd;
    if (Engine.Input.up(p.pn, coop)) p.vy = -spd;
    if (Engine.Input.down(p.pn, coop)) p.vy = spd;

    p.x += p.vx;
    p.y += p.vy;

    // Constrain to play area (bottom 35% for vertical, full width)
    const minY = ch * 0.55;
    p.x = Math.max(0, Math.min(p.x, cw - p.w));
    p.y = Math.max(minY, Math.min(p.y, ch - p.h - 5));

    // Invincibility countdown
    if (p.invincible > 0) p.invincible--;

    // Fire cooldown
    if (p.fireCooldown > 0) p.fireCooldown--;

    // Animation
    p.animTimer++;
    if (p.animTimer >= 10) {
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % 2;
    }
  }

  function renderPlayer(ctx, p) {
    if (!p.alive) return;
    // Blinking during invincibility
    if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return;

    const shipAnims = SPRITES.ANIMS.ship;
    const shipSet = p.pn === 2 ? shipAnims.p2 : shipAnims[p.shipType] || shipAnims.falcon;
    const isThrust = p.vy < 0 || p.vx !== 0;
    const frames = isThrust ? shipSet.thrust : shipSet.idle;
    const sprite = frames[0];

    // Neon glow
    const glowColor = p.pn === 2 ? '#39FF14' : '#00FFFF';
    Engine.drawSpriteGlow(ctx, sprite, p.x, p.y, glowColor, 10);

    // Shield bubble
    if (p.upgrades.includes('deflector')) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(Date.now() / 300) * 0.15})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, p.w / 2 + 6, p.h / 2 + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function damagePlayer(p, amount) {
    if (p.invincible > 0 || !p.alive) return false;

    // Deflector check
    if (p.upgrades.includes('deflector') && Math.random() < 0.2) {
      return false; // deflected
    }

    p.hp -= (amount || 1);
    p.combo = 0;
    p.invincible = 90; // 1.5 seconds

    if (p.hp <= 0) {
      p.alive = false;
      p.lives--;
      p.respawnTimer = 180; // 3 seconds
      return 'dead';
    }
    return 'hit';
  }

  // ===== PLAYER BULLETS =====

  function createPlayerBullet(p) {
    const bullets = [];
    const bw = 6 * S;
    const bh = 10 * S;
    const cx = p.x + p.w / 2;

    const hasDual = p.upgrades.includes('dualCannons');
    const hasSpread = p.upgrades.includes('spreadShot');
    const pierce = p.upgrades.includes('piercingRounds') ? 3 : 1;

    if (hasSpread) {
      // 3-shot fan: -15°, 0°, +15°
      const angles = [-0.26, 0, 0.26]; // ~15 degrees in radians
      for (const a of angles) {
        bullets.push({
          x: cx - bw / 2, y: p.y - bh,
          w: bw, h: bh,
          vx: Math.sin(a) * 8, vy: -8 * Math.cos(a),
          alive: true, pierceLeft: pierce, owner: p.pn,
        });
      }
    } else if (hasDual) {
      // 2 parallel shots
      bullets.push(
        { x: p.x + 4, y: p.y - bh, w: bw, h: bh, vx: 0, vy: -8, alive: true, pierceLeft: pierce, owner: p.pn },
        { x: p.x + p.w - bw - 4, y: p.y - bh, w: bw, h: bh, vx: 0, vy: -8, alive: true, pierceLeft: pierce, owner: p.pn },
      );
    } else {
      // Single shot
      bullets.push({
        x: cx - bw / 2, y: p.y - bh,
        w: bw, h: bh,
        vx: 0, vy: -8,
        alive: true, pierceLeft: pierce, owner: p.pn,
      });
    }
    return bullets;
  }

  function updateBullet(b) {
    b.x += b.vx;
    b.y += b.vy;
    if (b.y < -40 || b.y > 2000 || b.x < -40 || b.x > 2000) b.alive = false;
  }

  function renderPlayerBullet(ctx, b) {
    if (!b.alive) return;
    Engine.drawSpriteGlow(ctx, SPRITES.PLAYER_BULLET, b.x, b.y, '#00FFFF', 8);
  }

  // ===== ENEMY BULLETS =====

  function createEnemyBullet(x, y, vx, vy, type) {
    const bw = 6 * S;
    const bh = 6 * S;
    return {
      x: x - bw / 2, y,
      w: bw, h: bh,
      vx: vx || 0, vy: vy || 3,
      alive: true,
      type: type || 'normal', // normal, boss, missile
      target: null, // for homing missiles
      lifetime: 600,
    };
  }

  function updateEnemyBullet(b, players) {
    if (b.type === 'missile' && b.target && b.target.alive) {
      // Slow homing toward target
      const dx = (b.target.x + b.target.w / 2) - (b.x + b.w / 2);
      const dy = (b.target.y + b.target.h / 2) - (b.y + b.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        b.vx += (dx / dist) * 0.15;
        b.vy += (dy / dist) * 0.15;
        // Cap speed
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > 4) {
          b.vx = (b.vx / spd) * 4;
          b.vy = (b.vy / spd) * 4;
        }
      }
    }
    b.x += b.vx;
    b.y += b.vy;
    b.lifetime--;
    if (b.y > 2000 || b.y < -100 || b.x < -100 || b.x > 2000 || b.lifetime <= 0) b.alive = false;
  }

  function renderEnemyBullet(ctx, b) {
    if (!b.alive) return;
    if (b.type === 'boss') {
      Engine.drawSpriteGlow(ctx, SPRITES.BOSS_BULLET, b.x, b.y, '#BF40FF', 10);
    } else if (b.type === 'missile') {
      Engine.drawSpriteGlow(ctx, SPRITES.BOSS_MISSILE, b.x, b.y, '#FF4500', 8);
    } else if (b.type === 'bomb') {
      Engine.drawSpriteGlow(ctx, SPRITES.BOMB_SPRITE, b.x, b.y, '#FF4500', 6);
    } else {
      Engine.drawSpriteGlow(ctx, SPRITES.ENEMY_BULLET, b.x, b.y, '#FF4500', 6);
    }
  }

  // ===== CRYSTAL PICKUP =====

  function createCrystal(x, y) {
    return {
      x, y,
      w: 8 * S, h: 8 * S,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 + Math.random() * -1,
      alive: true,
      lifetime: 600, // 10 seconds at 60fps
      animFrame: 0,
      animTimer: 0,
    };
  }

  function updateCrystal(c, players) {
    c.vy += 0.04; // slight gravity
    c.vy = Math.min(c.vy, 1.5);
    c.x += c.vx;
    c.y += c.vy;
    c.vx *= 0.98;
    c.lifetime--;
    if (c.lifetime <= 0) c.alive = false;

    // Magnet attraction
    for (const p of players) {
      if (!p.alive) continue;
      const hasMagnet = p.upgrades.includes('magnetField');
      const range = hasMagnet ? 150 : 30;
      const dx = (p.x + p.w / 2) - (c.x + c.w / 2);
      const dy = (p.y + p.h / 2) - (c.y + c.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range && dist > 0) {
        const force = hasMagnet ? 3 : 1.5;
        c.vx += (dx / dist) * force;
        c.vy += (dy / dist) * force;
      }
    }

    c.animTimer++;
    if (c.animTimer >= 15) {
      c.animTimer = 0;
      c.animFrame = (c.animFrame + 1) % 2;
    }
  }

  function renderCrystal(ctx, c) {
    if (!c.alive) return;
    // Blink when about to expire
    if (c.lifetime < 120 && Math.floor(c.lifetime / 8) % 2 === 0) return;
    const sprite = c.animFrame === 0 ? SPRITES.CRYSTAL_1 : SPRITES.CRYSTAL_2;
    Engine.drawSpriteGlow(ctx, sprite, c.x, c.y, '#00FFFF', 6);
  }

  // ===== EXPLOSIONS =====

  function createExplosion(x, y, color, size) {
    const particles = [];
    const count = size || 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color: color || '#FF4500',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
    return { particles, alive: true };
  }

  function updateExplosion(e) {
    let anyAlive = false;
    for (const p of e.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;
      p.rotation += p.rotSpeed;
      if (p.life > 0) anyAlive = true;
    }
    e.alive = anyAlive;
  }

  function renderExplosion(ctx, e) {
    for (const p of e.particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  // ===== ENGINE TRAIL =====

  const trails = [];

  function addTrail(x, y) {
    trails.push({
      x, y,
      life: 12 + Math.random() * 8,
      maxLife: 20,
      size: 2 + Math.random() * 2,
    });
  }

  function updateTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].life--;
      if (trails[i].life <= 0) trails.splice(i, 1);
    }
  }

  function renderTrails(ctx) {
    for (const t of trails) {
      ctx.globalAlpha = (t.life / t.maxLife) * 0.6;
      ctx.fillStyle = '#FF6B35';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#FF6B35';
      ctx.fillRect(t.x, t.y, t.size, t.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ===== ENEMIES =====

  function createEnemy(type, x, y, config) {
    const w = 16 * S;
    const h = 16 * S;
    const base = {
      type, x, y, w, h,
      vx: 0, vy: 0,
      alive: true,
      animFrame: 0,
      animTimer: 0,
      fireCooldown: 0,
      stateTimer: 0,
      // Common config with defaults
      hp: 1,
      score: 100,
      crystalChance: 0.3,
      fireRate: 120, // frames between shots
    };

    switch (type) {
      case 'drone':
        return { ...base, hp: 1, score: 100, crystalChance: 0.3, fireRate: 150 + Math.random() * 100,
          gridVx: 0.5, dropAmount: 16, state: 'grid', ...config };
      case 'swooper':
        return { ...base, hp: 1, score: 150, crystalChance: 0.35, fireRate: 200,
          state: 'formation', swoopAngle: 0, swoopSpeed: 2.5, originalY: y, ...config };
      case 'tank':
        return { ...base, hp: 3, score: 300, crystalChance: 0.5, fireRate: 180,
          state: 'descend', ...config };
      case 'stealth':
        return { ...base, hp: 1, score: 250, crystalChance: 0.4, fireRate: 120,
          state: 'zigzag', alpha: 0.15, zigDir: 1, ...config };
      case 'splitter':
        return { ...base, hp: 2, score: 200, crystalChance: 0.4, fireRate: 999,
          state: 'descend', ...config };
      case 'bomber':
        return { ...base, hp: 2, score: 200, crystalChance: 0.35, fireRate: 90,
          state: 'fly', flyDir: config && config.flyDir || 1, ...config };
      default:
        return base;
    }
  }

  function updateEnemy(e, cw, ch, players, spawnBulletFn) {
    if (!e.alive) return;

    e.animTimer++;
    if (e.animTimer >= 20) {
      e.animTimer = 0;
      e.animFrame = (e.animFrame + 1) % 2;
    }

    e.fireCooldown--;
    e.stateTimer++;

    switch (e.type) {
      case 'drone':
        updateDrone(e, cw, ch, spawnBulletFn);
        break;
      case 'swooper':
        updateSwooper(e, cw, ch, players, spawnBulletFn);
        break;
      case 'tank':
        updateTank(e, cw, ch, players, spawnBulletFn);
        break;
      case 'stealth':
        updateStealth(e, cw, ch, players, spawnBulletFn);
        break;
      case 'splitter':
        updateSplitter(e, cw, ch);
        break;
      case 'bomber':
        updateBomber(e, cw, ch, spawnBulletFn);
        break;
    }

    // Off-screen kill (bottom only — enemies can be above screen during entry)
    if (e.y > ch + 100) e.alive = false;
  }

  function updateDrone(e, cw, ch, spawnBulletFn) {
    // Grid movement: move sideways, steady descent + extra drop at edges
    e.x += e.gridVx;
    e.y += 0.6; // steady descent toward player
    if (e.x <= 10 || e.x + e.w >= cw - 10) {
      e.gridVx = -e.gridVx;
      e.y += e.dropAmount;
    }
    // Fire
    if (e.fireCooldown <= 0) {
      spawnBulletFn(e.x + e.w / 2, e.y + e.h, 0, 3);
      e.fireCooldown = e.fireRate;
    }
  }

  function updateSwooper(e, cw, ch, players, spawnBulletFn) {
    if (e.state === 'formation') {
      // Drift into view, then swoop
      e.x += Math.sin(e.stateTimer * 0.03) * 0.5;
      e.y += 0.6; // drift down so off-screen spawns enter view
      if (e.stateTimer > (e.swoopDelay || 120)) {
        e.state = 'swoop';
        e.swoopAngle = 0;
        // Target closest player
        let target = players.find(p => p.alive) || players[0];
        e.targetX = target ? target.x + target.w / 2 : cw / 2;
      }
    } else if (e.state === 'swoop') {
      e.swoopAngle += 0.04;
      e.x += Math.sin(e.swoopAngle * 3) * 3;
      e.y += e.swoopSpeed;
      // Fire during swoop
      if (e.fireCooldown <= 0) {
        spawnBulletFn(e.x + e.w / 2, e.y + e.h, 0, 4);
        e.fireCooldown = e.fireRate;
      }
    }
  }

  function updateTank(e, cw, ch, players, spawnBulletFn) {
    // Steady descent
    e.y += 0.5;
    e.x += Math.sin(e.stateTimer * 0.01) * 0.5;
    // Fire spread of 3
    if (e.fireCooldown <= 0) {
      const cx = e.x + e.w / 2;
      const by = e.y + e.h;
      spawnBulletFn(cx, by, -1.5, 3);
      spawnBulletFn(cx, by, 0, 3.5);
      spawnBulletFn(cx, by, 1.5, 3);
      e.fireCooldown = e.fireRate;
    }
  }

  function updateStealth(e, cw, ch, players, spawnBulletFn) {
    // Diagonal zigzag
    e.x += e.zigDir * 1.5;
    e.y += 0.8;
    if (e.x <= 10 || e.x + e.w >= cw - 10) {
      e.zigDir = -e.zigDir;
    }
    // Become visible when firing
    if (e.fireCooldown <= 0) {
      e.alpha = 1;
      const cx = e.x + e.w / 2;
      // Aimed shot at closest player
      let target = players.find(p => p.alive);
      if (target) {
        const dx = (target.x + target.w / 2) - cx;
        const dy = (target.y + target.h / 2) - (e.y + e.h);
        const dist = Math.sqrt(dx * dx + dy * dy);
        spawnBulletFn(cx, e.y + e.h, (dx / dist) * 3, (dy / dist) * 3);
      } else {
        spawnBulletFn(cx, e.y + e.h, 0, 3);
      }
      e.fireCooldown = e.fireRate;
      e.stateTimer = 0;
    }
    // Fade back
    if (e.stateTimer > 20) {
      e.alpha = Math.max(0.15, e.alpha - 0.03);
    }
  }

  function updateSplitter(e, cw, ch) {
    // Descent with wobble
    e.y += 0.8;
    e.x += Math.sin(e.stateTimer * 0.05) * 1;
  }

  function updateBomber(e, cw, ch, spawnBulletFn) {
    // Fly across screen dropping bombs, then exit (no infinite wrapping)
    e.x += e.flyDir * 2;
    e.y += 0.4;
    // Kill when off-screen after crossing
    if (e.x < -e.w * 2 || e.x > cw + e.w * 2) e.alive = false;
    // Drop bombs
    if (e.fireCooldown <= 0) {
      spawnBulletFn(e.x + e.w / 2, e.y + e.h, 0, 2.5, 'bomb');
      e.fireCooldown = e.fireRate;
    }
  }

  function renderEnemy(ctx, e) {
    if (!e.alive) return;

    const anims = SPRITES.ANIMS[e.type];
    if (!anims) return;
    const frames = anims.idle;
    const sprite = frames[e.animFrame % frames.length];

    ctx.save();
    // Stealth alpha
    if (e.type === 'stealth') {
      ctx.globalAlpha = e.alpha;
    }

    // Damage flash
    if (e.flashTimer > 0) {
      ctx.filter = 'brightness(3)';
      e.flashTimer--;
    }

    const glowColors = {
      drone: '#00FFFF',
      swooper: '#FF00FF',
      tank: '#FF8C00',
      stealth: '#BF40FF',
      splitter: '#00FF00',
      bomber: '#FF0000',
    };

    Engine.drawSpriteGlow(ctx, sprite, e.x, e.y, glowColors[e.type] || '#FFFFFF', 8);
    ctx.restore();
  }

  // ===== SPLITTER MINI =====

  function createMini(x, y, vx) {
    return {
      type: 'mini',
      x, y,
      w: 8 * S, h: 8 * S,
      vx, vy: 1.5,
      alive: true,
      hp: 1,
      score: 50,
      crystalChance: 0.2,
      animFrame: 0, animTimer: 0,
    };
  }

  function updateMini(m, ch) {
    m.x += m.vx;
    m.y += m.vy;
    m.vx *= 0.99;
    if (m.y > ch + 50) m.alive = false;
  }

  function renderMini(ctx, m) {
    if (!m.alive) return;
    Engine.drawSpriteGlow(ctx, SPRITES.SPLITTER_MINI, m.x, m.y, '#00FF00', 6);
  }

  // ===== BOSS: MOTHERSHIP =====

  function createBoss(cw, isCoop) {
    const w = 48 * S;
    const h = 32 * S;
    return {
      type: 'boss',
      x: cw / 2 - w / 2,
      y: -h - 20, // start off-screen
      targetY: 30,
      w, h,
      vx: 1,
      alive: true,
      hp: isCoop ? 45 : 30,
      maxHp: isCoop ? 45 : 30,
      score: 5000,
      phase: 1,
      phaseTimer: 0,
      fireCooldown: 0,
      spawnCooldown: 0,
      laserWarning: 0,
      laserActive: 0,
      laserY: 0,
      flashTimer: 0,
      entering: true,
    };
  }

  function updateBoss(boss, cw, ch, players, spawnBulletFn, spawnEnemyFn) {
    if (!boss.alive) return;

    // Entry animation
    if (boss.entering) {
      boss.y += 1.5;
      if (boss.y >= boss.targetY) {
        boss.y = boss.targetY;
        boss.entering = false;
      }
      return;
    }

    boss.phaseTimer++;
    boss.fireCooldown--;
    boss.spawnCooldown--;

    // Determine phase
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent <= 0.3) boss.phase = 3;
    else if (hpPercent <= 0.6) boss.phase = 2;

    // Movement
    const speed = boss.phase === 3 ? 2.5 : boss.phase === 2 ? 1.8 : 1;
    if (boss.phase === 3) {
      // Erratic movement
      boss.x += Math.sin(boss.phaseTimer * 0.08) * speed * 2;
      boss.y = boss.targetY + Math.sin(boss.phaseTimer * 0.05) * 15;
    } else {
      boss.x += boss.vx * speed;
    }

    // Bounce off walls
    if (boss.x <= 10 || boss.x + boss.w >= cw - 10) {
      boss.vx = -boss.vx;
    }
    boss.x = Math.max(10, Math.min(boss.x, cw - boss.w - 10));

    // Attacks based on phase
    const cx = boss.x + boss.w / 2;
    const by = boss.y + boss.h;

    if (boss.phase === 1) {
      // Single energy orbs
      if (boss.fireCooldown <= 0) {
        spawnBulletFn(cx, by, 0, 2.5, 'boss');
        boss.fireCooldown = 90;
      }
      // Spawn drones every 10 seconds
      if (boss.spawnCooldown <= 0) {
        spawnEnemyFn('drone', cx - 80, boss.y + boss.h + 10);
        spawnEnemyFn('drone', cx + 80, boss.y + boss.h + 10);
        boss.spawnCooldown = 600;
      }
    } else if (boss.phase === 2) {
      // Fan spread of 5
      if (boss.fireCooldown <= 0) {
        for (let i = -2; i <= 2; i++) {
          spawnBulletFn(cx, by, i * 1.2, 3, 'boss');
        }
        boss.fireCooldown = 70;
      }
      // Spawn swoopers
      if (boss.spawnCooldown <= 0) {
        spawnEnemyFn('swooper', cx, boss.y + boss.h + 10);
        boss.spawnCooldown = 480;
      }
    } else if (boss.phase === 3) {
      // Tracking missiles
      if (boss.fireCooldown <= 0) {
        const target = players.find(p => p.alive);
        if (target) {
          spawnBulletFn(cx, by, 0, 2, 'missile', target);
        }
        boss.fireCooldown = 80;
      }
      // Laser beam attack every 8 seconds
      if (boss.laserWarning === 0 && boss.laserActive === 0 && boss.phaseTimer % 480 > 400) {
        boss.laserWarning = 90; // 1.5s warning
        boss.laserY = boss.y + boss.h;
      }
    }

    // Laser warning countdown
    if (boss.laserWarning > 0) {
      boss.laserWarning--;
      if (boss.laserWarning === 0) {
        boss.laserActive = 30; // 0.5s active
      }
    }
    // Laser active
    if (boss.laserActive > 0) {
      boss.laserActive--;
    }

    if (boss.flashTimer > 0) boss.flashTimer--;
  }

  function renderBoss(ctx, boss, cw) {
    if (!boss.alive) return;

    ctx.save();
    if (boss.flashTimer > 0) {
      ctx.filter = 'brightness(3)';
    }
    Engine.drawSpriteGlow(ctx, SPRITES.MOTHERSHIP, boss.x, boss.y, '#4682B4', 15);
    ctx.restore();

    // Core glow (pulsing red center)
    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h * 0.35;
    const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FF0000';
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + boss.phase * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Laser warning
    if (boss.laserWarning > 0) {
      ctx.save();
      const blink = Math.floor(boss.laserWarning / 4) % 2;
      ctx.globalAlpha = blink ? 0.3 : 0.1;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, boss.laserY, cw, 40);
      ctx.restore();
    }

    // Laser active
    if (boss.laserActive > 0) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#FF0000';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#FF0000';
      ctx.fillRect(0, boss.laserY, cw, 40);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, boss.laserY + 15, cw, 10);
      ctx.restore();
    }
  }

  // ===== SCORE POPUPS =====

  function createScorePopup(x, y, text, color) {
    return {
      x, y, text,
      color: color || '#FFFFFF',
      life: 60,
      maxLife: 60,
    };
  }

  function updateScorePopup(p) {
    p.y -= 0.8;
    p.life--;
  }

  function renderScorePopup(ctx, p) {
    if (p.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.font = 'bold 16px "Fredoka One", sans-serif';
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }

  return {
    createPlayer, updatePlayer, renderPlayer, damagePlayer,
    createPlayerBullet, updateBullet, renderPlayerBullet,
    createEnemyBullet, updateEnemyBullet, renderEnemyBullet,
    createCrystal, updateCrystal, renderCrystal,
    createExplosion, updateExplosion, renderExplosion,
    addTrail, updateTrails, renderTrails,
    createEnemy, updateEnemy, renderEnemy,
    createMini, updateMini, renderMini,
    createBoss, updateBoss, renderBoss,
    createScorePopup, updateScorePopup, renderScorePopup,
  };
})();
