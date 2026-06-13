/**
 * Arena entities for Ninjago Spinjitzu Math.
 * Owns the world state (ninja, enemies, projectiles, tornado, boss, dojo)
 * and all canvas rendering. game.js drives it: spawns enemies, resolves
 * answers, and reacts to callbacks (breach, kill, boss events).
 * All coordinates are world units (320x180, see engine.js).
 */
const Arena = (() => {
  const GROUND_Y = Engine.GROUND_Y;
  const NINJA_X = 66;       // ninja guards in front of the dojo
  const DOJO_LINE = 64;     // enemies breach the dojo when they reach this x
  const SPAWN_X = Engine.W + 12;
  const BOSS_X = 210;

  const NINJA_ELEMENTS = { kai: 'fire', jay: 'lightning', zane: 'ice', cole: 'earth', lloyd: 'energy' };

  let ninja = { charId: 'kai', anim: 'idle', animT: 0 };
  let dojoHp = 3;
  let enemies = [];
  let projectiles = [];
  let tornado = null;
  let smoke = [];
  let boss = null;
  let frozen = false;
  let cbs = {};

  function element() { return NINJA_ELEMENTS[ninja.charId] || 'fire'; }
  function elColors() { return SPRITES.ELEMENTS[element()]; }

  function reset(charId, callbacks) {
    ninja = { charId, anim: 'idle', animT: 0 };
    dojoHp = 3;
    enemies = [];
    projectiles = [];
    tornado = null;
    smoke = [];
    boss = null;
    frozen = false;
    cbs = callbacks || {};
  }

  function setFrozen(f) { frozen = f; }
  function setDojoHp(hp) { dojoHp = hp; }
  function clearEnemies() { enemies = []; }
  function enemyCount() { return enemies.filter(e => e.state !== 'dying').length; }

  function spawnEnemy({ type, key, problem, speed }) {
    enemies.push({
      type, key, problem,
      x: SPAWN_X,
      speed,
      engaged: false,
      slowed: false,
      state: 'walk',     // walk | lunge | dying
      lungeLeft: 0,
      deathT: 0,
      seed: Math.random() * Math.PI * 2,
    });
  }

  /** Engage the frontmost walking enemy; returns it (or null). */
  function engageFront() {
    let front = null;
    for (const e of enemies) {
      if (e.state === 'dying') continue;
      if (!front || e.x < front.x) front = e;
    }
    enemies.forEach(e => { e.engaged = false; e.slowed = false; });
    if (front) front.engaged = true;
    return front;
  }

  function getEngaged() {
    return enemies.find(e => e.engaged && e.state !== 'dying') || null;
  }

  function setEngagedSlowed(slowed) {
    const e = getEngaged();
    if (e) e.slowed = slowed;
  }

  /** Correct answer: ninja throws an element bolt at the engaged enemy. */
  function attackEngaged() {
    const target = getEngaged();
    if (!target) return;
    ninja.anim = 'attack';
    ninja.animT = 18;
    projectiles.push({
      x: NINJA_X + 14, y: GROUND_Y - 8,
      target, t: 0, dur: 12,
      sx: NINJA_X + 14, sy: GROUND_Y - 8,
    });
  }

  /** Wrong answer: engaged enemy lunges forward. */
  function lungeEngaged(px) {
    const e = getEngaged();
    if (e) { e.state = 'lunge'; e.lungeLeft = px; }
  }

  function startTornado() {
    tornado = { x: NINJA_X, t: 0 };
    ninja.anim = 'spin';
    ninja.animT = 50;
  }

  // ===== BOSS =====
  function startBoss(bossDef) {
    boss = {
      def: bossDef,
      sprite: SPRITES.BOSS_SPRITES[bossDef.sprite],
      x: SPAWN_X, hp: bossDef.hp, maxHp: bossDef.hp,
      state: 'enter',   // enter | idle | hit | attack | dying
      t: 0,
    };
  }

  function bossHit() {
    if (!boss) return;
    ninja.anim = 'attack';
    ninja.animT = 18;
    boss.state = 'hit';
    boss.t = 20;
    const p = Engine.worldToScreen(boss.x + 16, GROUND_Y - 20);
    const fx = elColors().particle;
    if (Particles[fx]) Particles[fx](p.x, p.y, 18);
    Engine.shake(5, 250);
  }

  function bossAttack() {
    if (!boss) return;
    boss.state = 'attack';
    boss.t = 30;
    Engine.shake(7, 350);
  }

  function bossDie() {
    if (!boss) return;
    boss.state = 'dying';
    boss.t = 60;
    const p = Engine.worldToScreen(boss.x + 16, GROUND_Y - 20);
    Particles.rainbowExplosion(p.x, p.y);
  }

  function getBoss() { return boss; }

  // ===== UPDATE =====
  function update() {
    if (ninja.animT > 0) {
      ninja.animT--;
      if (ninja.animT === 0) ninja.anim = 'idle';
    }

    // Projectiles fly even while frozen (they resolve a submitted answer)
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.t++;
      if (pr.t >= pr.dur) {
        projectiles.splice(i, 1);
        const e = pr.target;
        if (e && e.state !== 'dying') {
          e.state = 'dying';
          e.deathT = 20;
          const p = Engine.worldToScreen(e.x + 8, GROUND_Y - 8);
          const fx = elColors().particle;
          if (Particles[fx]) Particles[fx](p.x, p.y, 16);
          Engine.shake(3, 150);
          if (cbs.onKill) cbs.onKill(e);
        }
      }
    }

    // Tornado sweeps the arena
    if (tornado) {
      tornado.t++;
      tornado.x += 3.2;
      for (const e of enemies) {
        if (e.state !== 'dying' && e.x < tornado.x + 14) {
          e.state = 'dying';
          e.deathT = 20;
          const p = Engine.worldToScreen(e.x + 8, GROUND_Y - 8);
          Particles.sparkle(p.x, p.y, 10, elColors().mid);
          if (cbs.onKill) cbs.onKill(e, true);
        }
      }
      if (tornado.x > Engine.W + 30) {
        tornado = null;
        if (cbs.onTornadoDone) cbs.onTornadoDone();
      }
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.state === 'dying') {
        e.deathT--;
        if (e.deathT <= 0) enemies.splice(i, 1);
        continue;
      }
      if (frozen) continue;

      if (e.state === 'lunge') {
        const step = Math.min(3, e.lungeLeft);
        e.x -= step;
        e.lungeLeft -= step;
        if (e.lungeLeft <= 0) e.state = 'walk';
      } else {
        // The enemy holding the ACTIVE problem barely creeps — Dan gets
        // (effectively) unlimited time to think; only non-engaged enemies
        // approach at the belt's pace, so there's still gentle motion.
        e.x -= e.speed * (e.engaged ? 0.06 : 1);
      }

      if (e.x <= DOJO_LINE) {
        enemies.splice(i, 1);
        Engine.shake(6, 300);
        const p = Engine.worldToScreen(DOJO_LINE - 10, GROUND_Y - 20);
        Particles.fireBurst(p.x, p.y, 14);
        if (cbs.onBreach) cbs.onBreach(e);
      }
    }

    // Dojo smoke when damaged
    if (dojoHp <= 1 && Math.random() < 0.3) {
      smoke.push({ x: 18 + Math.random() * 24, y: GROUND_Y - 52, vy: -0.25 - Math.random() * 0.2, a: 0.5, r: 1 + Math.random() * 2 });
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.y += s.vy; s.a -= 0.004; s.r += 0.02;
      if (s.a <= 0) smoke.splice(i, 1);
    }

    // Boss
    if (boss) {
      boss.t--;
      if (boss.state === 'enter') {
        boss.x -= 0.8;
        if (boss.x <= BOSS_X) {
          boss.x = BOSS_X;
          boss.state = 'idle';
          if (cbs.onBossReady) cbs.onBossReady();
        }
      } else if (boss.state === 'hit') {
        boss.x += 1.2;
        if (boss.t <= 0) { boss.state = 'idle'; boss.x = BOSS_X; }
      } else if (boss.state === 'attack') {
        // lunge toward the ninja and back
        boss.x = BOSS_X - Math.sin((30 - boss.t) / 30 * Math.PI) * 70;
        if (boss.t <= 0) { boss.state = 'idle'; boss.x = BOSS_X; }
      } else if (boss.state === 'dying') {
        boss.x += 0.5;
        if (boss.t <= 0) {
          boss = null;
          if (cbs.onBossGone) cbs.onBossGone();
        }
      }
    }
  }

  // ===== RENDER =====
  function shadow(ctx, x, w) {
    const v = Engine.getView();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(
      v.offX + (x + w / 2) * v.scale,
      v.offY + (GROUND_Y + 1) * v.scale,
      (w / 2) * v.scale, 2 * v.scale, 0, 0, Math.PI * 2
    );
    ctx.fill();
  }

  function drawDojo(ctx, t) {
    const x = 4, w = 56;
    const baseY = GROUND_Y;
    // stone platform
    Engine.wrect(ctx, '#4A3B5C', x - 2, baseY - 4, w + 8, 4);
    Engine.wrect(ctx, '#3A2D4A', x - 2, baseY - 1, w + 8, 1);
    // walls
    Engine.wrect(ctx, '#EFE5D0', x + 6, baseY - 34, w - 12, 30);
    // columns
    Engine.wrect(ctx, '#B71C1C', x + 4, baseY - 34, 4, 30);
    Engine.wrect(ctx, '#B71C1C', x + w - 8, baseY - 34, 4, 30);
    Engine.wrect(ctx, '#B71C1C', x + w / 2 - 2, baseY - 34, 4, 30);
    // door
    Engine.wrect(ctx, '#3E2723', x + 12, baseY - 22, 10, 18);
    Engine.wrect(ctx, '#FFD54F', x + 19, baseY - 14, 2, 2);
    // roof tier 1
    Engine.wrect(ctx, '#263238', x - 4, baseY - 40, w + 8, 6);
    Engine.wrect(ctx, '#37474F', x - 6, baseY - 36, 6, 3);
    Engine.wrect(ctx, '#37474F', x + w, baseY - 36, 6, 3);
    // upper wall + roof tier 2
    Engine.wrect(ctx, '#EFE5D0', x + 12, baseY - 52, w - 24, 12);
    Engine.wrect(ctx, '#B71C1C', x + 12, baseY - 52, 3, 12);
    Engine.wrect(ctx, '#B71C1C', x + w - 15, baseY - 52, 3, 12);
    Engine.wrect(ctx, '#263238', x + 6, baseY - 58, w - 12, 6);
    Engine.wrect(ctx, '#37474F', x + 3, baseY - 54, 5, 3);
    Engine.wrect(ctx, '#37474F', x + w - 8, baseY - 54, 5, 3);
    // top finial
    Engine.wrect(ctx, '#FFD54F', x + w / 2 - 1, baseY - 62, 2, 4);

    // hanging lantern with pulsing glow
    const v = Engine.getView();
    const lx = v.offX + (x + w - 4) * v.scale;
    const ly = v.offY + (baseY - 30) * v.scale;
    const pulse = 0.5 + 0.25 * Math.sin(t * 0.06);
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 9 * v.scale);
    glow.addColorStop(0, `rgba(255, 152, 0, ${pulse * 0.5})`);
    glow.addColorStop(1, 'rgba(255, 152, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 9 * v.scale, ly - 9 * v.scale, 18 * v.scale, 18 * v.scale);
    Engine.wrect(ctx, '#FF6F00', x + w - 6, baseY - 32, 4, 5);
    Engine.wrect(ctx, '#FFD54F', x + w - 5, baseY - 31, 2, 3);

    // damage states: cracks at 2 hearts, heavy cracks at 1
    if (dojoHp <= 2) {
      Engine.wrect(ctx, '#8D8070', x + 26, baseY - 30, 1, 10);
      Engine.wrect(ctx, '#8D8070', x + 27, baseY - 21, 4, 1);
      Engine.wrect(ctx, '#8D8070', x + 38, baseY - 28, 1, 7);
    }
    if (dojoHp <= 1) {
      Engine.wrect(ctx, '#8D8070', x + 10, baseY - 32, 1, 14);
      Engine.wrect(ctx, '#8D8070', x + 44, baseY - 30, 1, 12);
      Engine.wrect(ctx, '#8D8070', x + 30, baseY - 50, 1, 8);
    }
    for (const s of smoke) {
      ctx.fillStyle = `rgba(120, 110, 130, ${s.a})`;
      ctx.beginPath();
      ctx.arc(v.offX + s.x * v.scale, v.offY + s.y * v.scale, s.r * v.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNinja(ctx, t) {
    const set = SPRITES.NINJAS[ninja.charId] || SPRITES.NINJAS.kai;
    if (ninja.anim === 'spin') {
      drawTornadoShape(ctx, NINJA_X + 8, 1.0, t);
      return;
    }
    const bob = ninja.anim === 'idle' ? Math.round(Math.sin(t * 0.07)) : 0;
    const sprite = ninja.anim === 'attack' ? set.attack : set.idle;
    shadow(ctx, NINJA_X, 16);
    Engine.drawSprite(ctx, sprite, NINJA_X, GROUND_Y - 16 + bob, false);
  }

  function drawTornadoShape(ctx, cx, sizeMul, t) {
    const v = Engine.getView();
    const col = elColors();
    const baseY = GROUND_Y;
    const layers = 7;
    for (let i = 0; i < layers; i++) {
      const frac = i / (layers - 1);                 // 0 bottom → 1 top
      const ry = baseY - 2 - frac * 30 * sizeMul;
      const rw = (4 + frac * 12) * sizeMul;
      const wobble = Math.sin(t * 0.3 + i * 1.2) * 2;
      ctx.fillStyle = i % 2 === 0 ? col.mid : col.edge;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(
        v.offX + (cx + wobble) * v.scale,
        v.offY + ry * v.scale,
        rw * v.scale, 3.2 * v.scale, 0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // sparkling core
    ctx.fillStyle = col.core;
    for (let i = 0; i < 5; i++) {
      const a = t * 0.25 + i * 1.3;
      const fx = cx + Math.cos(a) * 6;
      const fy = baseY - 8 - ((t * 0.8 + i * 7) % 26);
      Engine.wrect(ctx, col.core, fx, fy, 1.4, 1.4);
    }
  }

  function drawEnemy(ctx, e, t) {
    const def = SPRITES.ENEMIES[e.type];
    if (!def) return;
    const frame = def.frames[Math.floor(t / 10 + e.seed * 10) % def.frames.length];
    const dying = e.state === 'dying';
    const y = GROUND_Y - 16 + (dying ? (20 - e.deathT) * 0.4 : 0);

    if (dying) ctx.globalAlpha = e.deathT / 20;
    if (!dying) shadow(ctx, e.x, 16);
    Engine.drawSprite(ctx, frame, e.x, y, false);
    ctx.globalAlpha = 1;

    // engaged marker: pulsing gold ring + problem badge
    if (e.engaged && !dying) {
      const v = Engine.getView();
      const cx = v.offX + (e.x + 8) * v.scale;
      const cy = v.offY + (GROUND_Y + 1) * v.scale;
      ctx.strokeStyle = `rgba(255, 213, 79, ${0.6 + 0.4 * Math.sin(t * 0.15)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 11 * v.scale, 3 * v.scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (e.problem) {
        const fs = 7 * v.scale;
        ctx.font = `bold ${fs}px 'Fredoka One', sans-serif`;
        ctx.textAlign = 'center';
        const label = e.problem.badge;
        const tw = ctx.measureText(label).width;
        const bx = cx, by = v.offY + (GROUND_Y - 24) * v.scale;
        ctx.fillStyle = 'rgba(10, 8, 24, 0.8)';
        const pad = 4 * v.scale * 0.5;
        ctx.beginPath();
        ctx.roundRect(bx - tw / 2 - pad, by - fs, tw + pad * 2, fs + pad, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 213, 79, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#FFE082';
        ctx.fillText(label, bx, by - fs * 0.12);
      }
    }
  }

  function drawProjectile(ctx, pr) {
    const e = pr.target;
    if (!e) return;
    const v = Engine.getView();
    const frac = pr.t / pr.dur;
    const tx = e.x + 8, ty = GROUND_Y - 8;
    const x = pr.sx + (tx - pr.sx) * frac;
    const y = pr.sy + (ty - pr.sy) * frac - Math.sin(frac * Math.PI) * 10;
    const col = elColors();
    const px = v.offX + x * v.scale, py = v.offY + y * v.scale;
    const r = 3 * v.scale;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2);
    g.addColorStop(0, col.core);
    g.addColorStop(0.4, col.mid);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - r * 2, py - r * 2, r * 4, r * 4);
    // trail
    ctx.globalAlpha = 0.5;
    for (let i = 1; i <= 3; i++) {
      const tfrac = Math.max(0, frac - i * 0.08);
      const txx = pr.sx + (tx - pr.sx) * tfrac;
      const tyy = pr.sy + (ty - pr.sy) * tfrac - Math.sin(tfrac * Math.PI) * 10;
      Engine.wrect(ctx, col.mid, txx, tyy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawBoss(ctx, t) {
    if (!boss) return;
    const def = boss.sprite;
    const frame = def.frames[Math.floor(t / 12) % def.frames.length];
    const ds = def.drawScale || 2;
    const h = def.h * ds;
    const bob = boss.state === 'idle' ? Math.round(Math.sin(t * 0.05) * 1.5) : 0;
    shadow(ctx, boss.x, def.w * ds);

    if (boss.state === 'hit' && boss.t % 6 < 3) ctx.globalAlpha = 0.4;
    if (boss.state === 'dying') ctx.globalAlpha = Math.max(0, boss.t / 60);
    Engine.drawSprite(ctx, frame, boss.x, GROUND_Y - h + bob, false, ds);
    ctx.globalAlpha = 1;

    // menacing aura
    const v = Engine.getView();
    const cx = v.offX + (boss.x + def.w * ds / 2) * v.scale;
    const cy = v.offY + (GROUND_Y - h / 2) * v.scale;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * v.scale);
    g.addColorStop(0, 'rgba(229, 57, 53, 0.08)');
    g.addColorStop(0.7, `rgba(229, 57, 53, ${0.05 + 0.04 * Math.sin(t * 0.08)})`);
    g.addColorStop(1, 'rgba(229, 57, 53, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - h * v.scale, cy - h * v.scale, h * 2 * v.scale, h * 2 * v.scale);
  }

  function render(ctx, t) {
    Engine.renderBg(ctx, t);
    drawDojo(ctx, t);
    for (const e of enemies) drawEnemy(ctx, e, t);
    drawNinja(ctx, t);
    for (const pr of projectiles) drawProjectile(ctx, pr);
    if (tornado) drawTornadoShape(ctx, tornado.x, 1.3, t);
    drawBoss(ctx, t);
  }

  return {
    NINJA_ELEMENTS,
    reset, setFrozen, setDojoHp, clearEnemies, enemyCount,
    spawnEnemy, engageFront, getEngaged, setEngagedSlowed,
    attackEngaged, lungeEngaged, startTornado,
    startBoss, bossHit, bossAttack, bossDie, getBoss,
    update, render, element,
  };
})();
