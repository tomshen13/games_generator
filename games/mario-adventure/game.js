/**
 * Mario Adventure — Game Engine
 * Canvas-based platformer with physics, rendering, and game state management.
 */
(function () {
  'use strict';

  // ==================== CONFIGURATION ====================
  const T = 32;             // Tile size in pixels
  const W = 800, H = 480;  // Internal canvas resolution
  const GRAVITY = 0.6;
  const MAX_FALL = 12;
  const PLAYER_SPEED = 2.8;
  const PLAYER_ACCEL = 0.35;
  const PLAYER_FRICTION = 0.82;
  const PLAYER_JUMP = -10.2;
  const LUIGI_JUMP = -11.2;
  const ICE_SPEED = 8;
  const ICE_COOLDOWN = 350;     // ms between ice shots
  const COYOTE_TIME = 6;        // frames of coyote time
  const JUMP_BUFFER = 6;        // frames of jump buffering
  const POWERUP_DURATION = 15000; // ms
  const INVINCIBLE_TIME = 1500;   // ms after taking damage

  // Tile type constants
  const TILES = { AIR: 0, SOLID: 1, BRICK: 2, QCOIN: 3, QPOWER: 4, PLATFORM: 5, HAZARD: 6, COIN: 7 };
  const TILE_CHAR = { ' ': 0, '#': 1, 'B': 2, '?': 3, '!': 4, '-': 5, '^': 6, 'C': 7 };

  // ==================== INPUT ====================
  const keys = {};
  const justDown = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.code]) justDown[e.code] = true;
    keys[e.code] = true;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Touch input state (set by touch controls)
  const touch = { left: false, right: false, jump: false, ice: false, jumpPressed: false, icePressed: false };

  function isDown(...codes) { return codes.some(c => keys[c]) ; }
  function wasPressed(...codes) { return codes.some(c => justDown[c]); }
  function clearPressed() { for (const k in justDown) delete justDown[k]; touch.jumpPressed = false; touch.icePressed = false; }

  // ==================== SOUND HELPERS ====================
  function sfxJump() {
    if (typeof Audio !== 'undefined' && Audio.init) {
      Audio.init();
      // Quick ascending tone
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(300, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.15);
      } catch(e) {}
    }
  }
  function sfxIce() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.water(); } }
  function sfxCoin() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.tap(); } }
  function sfxPowerUp() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.whoosh(); } }
  function sfxStomp() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.correct(); } }
  function sfxHurt() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.wrong(); } }
  function sfxLevelComplete() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.fanfare(); } }
  function sfxGameOver() { if (typeof Audio !== 'undefined') { Audio.init(); Audio.SFX.wrong(); } }
  function sfxBlockHit() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 200;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  }
  function sfxFreeze() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(800, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  // ==================== PARTICLES ====================
  const particles = [];
  function spawnParticles(x, y, count, color, speed, life, grav) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random());
      particles.push({
        x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1,
        life, maxLife: life, color, size: 2 + Math.random() * 3, gravity: grav || 0.1
      });
    }
  }
  function spawnCoinParticles(x, y) { spawnParticles(x, y, 8, '#FFD700', 2.5, 30, 0.12); }
  function spawnIceParticles(x, y) { spawnParticles(x, y, 12, '#80E0FF', 3, 25, 0.05); }
  function spawnStompParticles(x, y) { spawnParticles(x, y, 10, '#FF8844', 3, 20, 0.1); }
  function spawnPowerUpParticles(x, y) { spawnParticles(x, y, 20, '#FF69B4', 4, 40, 0.08); }
  function spawnDeathParticles(x, y) { spawnParticles(x, y, 25, '#FF3333', 4, 50, 0.06); }
  function spawnBrickParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x + Math.random() * T, y: y + Math.random() * T / 2,
        vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 4,
        life: 40, maxLife: 40, color: '#C84C0C', size: 4 + Math.random() * 4, gravity: 0.2
      });
    }
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function renderParticles(ctx, camX, camY) {
    for (const p of particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ==================== SPRITE DRAWING ====================
  function drawPlayer(ctx, x, y, w, h, character, facing, frame, powerUp, invincible) {
    ctx.save();
    // Flash when invincible
    if (invincible && Math.floor(Date.now() / 80) % 2 === 0) { ctx.globalAlpha = 0.4; }

    const cx = x + w / 2;
    const isLuigi = character === 'luigi';
    const mainColor = isLuigi ? '#40B040' : '#E52521';
    const overallColor = '#2058D8';
    const skinColor = '#FDBA67';
    const shoeColor = '#6B3E08';
    const hatBrim = isLuigi ? '#308030' : '#C01010';

    // Giant power-up glow
    if (powerUp === 'giant') {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    }
    // Shield glow
    if (powerUp === 'shield') {
      ctx.shadowColor = '#00D4FF';
      ctx.shadowBlur = 12;
    }

    if (facing === -1) {
      ctx.translate(cx, y);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -y);
    }

    // Hat
    ctx.fillStyle = mainColor;
    roundRect(ctx, x + 2, y, w - 4, 10, 4);
    ctx.fillStyle = hatBrim;
    ctx.fillRect(x + w / 2 - 2, y + 6, w / 2 + 2, 4);

    // Face
    ctx.fillStyle = skinColor;
    roundRect(ctx, x + 3, y + 10, w - 6, 10, 3);

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 6, y + 12, 5, 5);
    ctx.fillRect(x + 15, y + 12, 5, 5);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 8, y + 13, 3, 3);
    ctx.fillRect(x + 17, y + 13, 3, 3);

    // Body / shirt
    ctx.fillStyle = mainColor;
    ctx.fillRect(x + 2, y + 20, w - 4, 6);

    // Overalls
    ctx.fillStyle = overallColor;
    roundRect(ctx, x + 1, y + 24, w - 2, 8, 2);
    // Straps
    ctx.fillRect(x + 5, y + 20, 3, 6);
    ctx.fillRect(x + w - 8, y + 20, 3, 6);
    // Buttons
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 6, y + 25, 2, 2);
    ctx.fillRect(x + w - 8, y + 25, 2, 2);

    // Legs / Shoes
    ctx.fillStyle = shoeColor;
    if (frame === 'jump') {
      // Tucked legs
      ctx.fillRect(x + 2, y + 31, 10, 5);
      ctx.fillRect(x + w - 12, y + 31, 10, 5);
    } else if (frame % 2 === 1) {
      // Running frame
      ctx.fillRect(x, y + 31, 11, 5);
      ctx.fillRect(x + w - 8, y + 29, 10, 5);
    } else {
      // Standing / other run frame
      ctx.fillRect(x + 2, y + 31, 10, 5);
      ctx.fillRect(x + w - 12, y + 31, 10, 5);
    }

    // Letter on hat
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isLuigi ? 'L' : 'M', x + w / 2 - 1, y + 8);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawGoomba(ctx, x, y, frozen) {
    ctx.save();
    if (frozen) { ctx.globalAlpha = 0.8; ctx.shadowColor = '#80E0FF'; ctx.shadowBlur = 10; }
    // Body
    ctx.fillStyle = frozen ? '#80C0E0' : '#A0522D';
    roundRect(ctx, x + 2, y + 4, T - 4, T - 8, 8);
    // Feet
    ctx.fillStyle = frozen ? '#6090B0' : '#5C3317';
    ctx.fillRect(x + 3, y + T - 6, 10, 6);
    ctx.fillRect(x + T - 13, y + T - 6, 10, 6);
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 7, y + 10, 6, 7);
    ctx.fillRect(x + T - 13, y + 10, 6, 7);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 9, y + 12, 3, 4);
    ctx.fillRect(x + T - 12, y + 12, 3, 4);
    // Angry eyebrows
    ctx.fillStyle = frozen ? '#6090B0' : '#5C3317';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 9); ctx.lineTo(x + 14, y + 11); ctx.lineTo(x + 14, y + 9); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + T - 6, y + 9); ctx.lineTo(x + T - 14, y + 11); ctx.lineTo(x + T - 14, y + 9); ctx.fill();
    // Ice crystal effect
    if (frozen) {
      ctx.fillStyle = '#B0E8FF';
      ctx.fillRect(x + 4, y + 2, 3, 3);
      ctx.fillRect(x + T - 7, y + 2, 3, 3);
      ctx.fillRect(x + T / 2 - 1, y, 3, 4);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawKoopa(ctx, x, y, facing, frozen) {
    ctx.save();
    if (frozen) { ctx.globalAlpha = 0.8; ctx.shadowColor = '#80E0FF'; ctx.shadowBlur = 10; }
    if (facing === -1) { ctx.translate(x + T, y); ctx.scale(-1, 1); x = 0; y = 0; }
    // Shell
    ctx.fillStyle = frozen ? '#80C0E0' : '#40A040';
    roundRect(ctx, x + 4, y + 8, T - 8, T - 12, 8);
    ctx.fillStyle = frozen ? '#60A0C0' : '#308030';
    roundRect(ctx, x + 8, y + 10, T - 16, T - 16, 4);
    // Head
    ctx.fillStyle = frozen ? '#A0D0E8' : '#80D080';
    ctx.beginPath();
    ctx.arc(x + T - 6, y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + T - 8, y + 4, 5, 5);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + T - 6, y + 5, 3, 3);
    // Feet
    ctx.fillStyle = frozen ? '#6090B0' : '#D4A030';
    ctx.fillRect(x + 6, y + T - 6, 8, 6);
    ctx.fillRect(x + T - 12, y + T - 6, 8, 6);
    // Ice effect
    if (frozen) {
      ctx.fillStyle = '#B0E8FF';
      ctx.fillRect(x + 6, y + 4, 3, 3);
      ctx.fillRect(x + T / 2, y + 2, 3, 4);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawIceProjectile(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = '#80E0FF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#B0F0FF';
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 5, y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawPowerUpItem(ctx, x, y, type) {
    ctx.save();
    const bob = Math.sin(Date.now() / 300) * 3;
    const dy = y + bob;
    ctx.shadowBlur = 10;
    if (type === 'speed') {
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = '#FF6B35';
      roundRect(ctx, x + 4, dy + 4, T - 8, T - 8, 6);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', x + T / 2, dy + T / 2 + 5);
    } else if (type === 'highjump') {
      ctx.shadowColor = '#4ADE80';
      ctx.fillStyle = '#4ADE80';
      roundRect(ctx, x + 4, dy + 4, T - 8, T - 8, 6);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('^', x + T / 2, dy + T / 2 + 5);
    } else if (type === 'shield') {
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + T / 2, dy + T / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + T / 2, dy + T / 2 + 4);
    } else if (type === 'rapidice') {
      ctx.shadowColor = '#00D4FF';
      ctx.fillStyle = '#00D4FF';
      roundRect(ctx, x + 4, dy + 4, T - 8, T - 8, 6);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❄', x + T / 2, dy + T / 2 + 4);
    } else if (type === 'giant') {
      ctx.shadowColor = '#FF69B4';
      ctx.fillStyle = '#FF69B4';
      roundRect(ctx, x + 2, dy + 2, T - 4, T - 4, 8);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('M', x + T / 2, dy + T / 2 + 5);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawFlag(ctx, x, y, camX, camY) {
    const px = x * T - camX;
    const py = y * T - camY;
    // Pole
    ctx.fillStyle = '#888';
    ctx.fillRect(px + 14, py, 4, (14 - y) * T);
    // Ball on top
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + 16, py, 6, 0, Math.PI * 2);
    ctx.fill();
    // Flag
    const wave = Math.sin(Date.now() / 400) * 2;
    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.moveTo(px + 18, py + 4);
    ctx.lineTo(px + 42 + wave, py + 12);
    ctx.lineTo(px + 18, py + 24);
    ctx.closePath();
    ctx.fill();
    // Star on flag
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', px + 28 + wave / 2, py + 17);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // ==================== TILE RENDERING ====================
  function drawTile(ctx, tileType, x, y, level) {
    const bg = level.bg;
    switch (tileType) {
      case TILES.SOLID:
        ctx.fillStyle = bg.ground;
        ctx.fillRect(x, y, T, T);
        // Top grass/surface
        ctx.fillStyle = bg.groundTop;
        ctx.fillRect(x, y, T, 4);
        // Subtle shading
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + T - 2, T, 2);
        break;
      case TILES.BRICK:
        ctx.fillStyle = '#C06030';
        ctx.fillRect(x, y, T, T);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        // Brick pattern
        ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T / 2 - 0.5);
        ctx.strokeRect(x + 0.5, y + T / 2, T - 1, T / 2 - 0.5);
        ctx.beginPath();
        ctx.moveTo(x + T / 2, y); ctx.lineTo(x + T / 2, y + T / 2);
        ctx.moveTo(x + T / 4, y + T / 2); ctx.lineTo(x + T / 4, y + T);
        ctx.moveTo(x + T * 3 / 4, y + T / 2); ctx.lineTo(x + T * 3 / 4, y + T);
        ctx.stroke();
        break;
      case TILES.QCOIN:
      case TILES.QPOWER:
        ctx.fillStyle = '#FFB020';
        roundRect(ctx, x + 1, y + 1, T - 2, T - 2, 4);
        ctx.fillStyle = '#CC8800';
        ctx.strokeStyle = '#AA6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, T - 6, T - 6);
        // Question mark
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + T / 2, y + T / 2 + 1);
        ctx.textBaseline = 'alphabetic';
        // Glow
        const glow = 0.15 + Math.sin(Date.now() / 500) * 0.1;
        ctx.fillStyle = `rgba(255, 255, 200, ${glow})`;
        ctx.fillRect(x, y, T, T);
        break;
      case TILES.PLATFORM:
        ctx.fillStyle = '#8B6D4A';
        roundRect(ctx, x, y, T, 8, 3);
        ctx.fillStyle = '#A0825A';
        ctx.fillRect(x + 2, y + 1, T - 4, 3);
        break;
      case TILES.HAZARD:
        // Spikes / lava
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x, y + T / 2, T, T / 2);
        ctx.fillStyle = '#FF6B35';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * (T / 4), y + T);
          ctx.lineTo(x + i * (T / 4) + T / 8, y + T / 3);
          ctx.lineTo(x + (i + 1) * (T / 4), y + T);
          ctx.fill();
        }
        // Glow
        const lavaGlow = 0.2 + Math.sin(Date.now() / 300 + x) * 0.15;
        ctx.fillStyle = `rgba(255, 100, 0, ${lavaGlow})`;
        ctx.fillRect(x, y, T, T);
        break;
      case TILES.COIN:
        // Spinning coin
        const coinFrame = Math.sin(Date.now() / 200 + x);
        const coinW = Math.abs(coinFrame) * 10 + 4;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x + T / 2, y + T / 2, coinW / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.ellipse(x + T / 2, y + T / 2, coinW / 2 - 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        if (Math.abs(coinFrame) > 0.3) ctx.fillText('$', x + T / 2, y + T / 2 + 4);
        break;
    }
  }

  // Empty (used) block
  function drawEmptyBlock(ctx, x, y) {
    ctx.fillStyle = '#8B7355';
    roundRect(ctx, x + 1, y + 1, T - 2, T - 2, 4);
    ctx.fillStyle = '#6B5335';
    ctx.strokeStyle = '#5B4325';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, T - 6, T - 6);
  }

  // ==================== BACKGROUND RENDERING ====================
  function drawBackground(ctx, level, camX, camY) {
    const bg = level.bg;
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bg.sky1);
    grad.addColorStop(1, bg.sky2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Clouds (parallax)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const cloudData = [
      [100, 40, 80, 30], [350, 60, 60, 22], [600, 30, 90, 28],
      [900, 55, 70, 25], [1200, 35, 85, 30], [1500, 50, 65, 20],
      [1800, 40, 75, 26], [2200, 60, 80, 28], [2600, 45, 70, 24],
    ];
    for (const [cx, cy, cw, ch] of cloudData) {
      const px = (cx - camX * 0.3) % (W + 200) - 100;
      ctx.beginPath();
      ctx.ellipse(px, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px - cw * 0.25, cy + 5, cw * 0.3, ch * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + cw * 0.25, cy + 5, cw * 0.35, ch * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hills (parallax)
    ctx.fillStyle = bg.hill;
    const hills = [[0, 120], [300, 90], [550, 110], [800, 85], [1100, 100], [1400, 115], [1700, 90], [2000, 105], [2400, 95]];
    for (const [hx, hr] of hills) {
      const px = (hx - camX * 0.5) % (W + 400) - 200;
      ctx.beginPath();
      ctx.arc(px, H - 60, hr, Math.PI, 0);
      ctx.lineTo(px + hr, H);
      ctx.lineTo(px - hr, H);
      ctx.fill();
    }
  }

  // ==================== GAME STATE ====================
  const game = {
    canvas: null,
    ctx: null,
    state: 'title',
    character: 'mario',
    currentLevel: -1,
    unlockedLevels: 1,
    levelStars: [0, 0, 0, 0, 0],

    // Level state
    grid: null,
    gridW: 0,
    gridH: 0,
    levelData: null,
    player: null,
    enemies: [],
    projectiles: [],
    items: [],       // floating power-up items
    usedBlocks: {},  // "x,y" -> true for blocks already hit
    collectedCoins: {}, // "x,y" -> true for coins collected
    totalCoins: 0,
    coinsCollected: 0,
    enemiesDefeated: 0,
    totalEnemies: 0,
    camera: { x: 0, y: 0 },
    shakeTimer: 0,
    shakeIntensity: 0,
    levelStartTime: 0,

    // Animations
    blockAnimations: [], // {x, y, timer, maxTimer}
    coinPopAnimations: [], // {x, y, vy, timer}

    init() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = W;
      this.canvas.height = H;

      // Load saved progress
      this.unlockedLevels = Storage.load('mario-adventure', 'unlocked', 1);
      this.levelStars = Storage.load('mario-adventure', 'stars', [0, 0, 0, 0, 0]);

      this.resize();
      window.addEventListener('resize', () => this.resize());

      this.setupScreens();
      this.setupTouchControls();
      this.showScreen('title');

      this.lastTime = performance.now();
      requestAnimationFrame(t => this.loop(t));
    },

    resize() {
      const container = this.canvas.parentElement;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const ratio = W / H;
      let cw, ch;
      if (w / h > ratio) { ch = h; cw = h * ratio; }
      else { cw = w; ch = w / ratio; }
      this.canvas.style.width = cw + 'px';
      this.canvas.style.height = ch + 'px';
      this.canvasScale = cw / W;
    },

    // ==================== SCREEN MANAGEMENT ====================
    setupScreens() {
      // Title screen
      document.getElementById('btnPlay').addEventListener('click', () => {
        this.showScreen('characterSelect');
      });

      // Character select
      document.getElementById('btnMario').addEventListener('click', () => {
        this.character = 'mario';
        this.showScreen('levelSelect');
        this.populateLevelSelect();
      });
      document.getElementById('btnLuigi').addEventListener('click', () => {
        this.character = 'luigi';
        this.showScreen('levelSelect');
        this.populateLevelSelect();
      });

      // Level select back button
      document.getElementById('btnBackToChars').addEventListener('click', () => {
        this.showScreen('characterSelect');
      });

      // Level complete
      document.getElementById('btnNextLevel').addEventListener('click', () => {
        if (this.currentLevel < LEVELS.length - 1) {
          this.loadLevel(this.currentLevel + 1);
        } else {
          this.showScreen('levelSelect');
          this.populateLevelSelect();
        }
      });
      document.getElementById('btnBackToLevels').addEventListener('click', () => {
        this.showScreen('levelSelect');
        this.populateLevelSelect();
      });

      // Game over
      document.getElementById('btnRetry').addEventListener('click', () => {
        this.loadLevel(this.currentLevel);
      });
      document.getElementById('btnGoToLevels').addEventListener('click', () => {
        this.showScreen('levelSelect');
        this.populateLevelSelect();
      });

      // Pause
      document.getElementById('btnResume').addEventListener('click', () => {
        this.state = 'playing';
        this.showScreen('playing');
      });
      document.getElementById('btnQuitLevel').addEventListener('click', () => {
        this.state = 'levelSelect';
        this.showScreen('levelSelect');
        this.populateLevelSelect();
      });

      // HUD pause button
      document.getElementById('btnPause').addEventListener('click', () => {
        if (this.state === 'playing') {
          this.state = 'paused';
          this.showScreen('paused');
        }
      });
    },

    showScreen(name) {
      document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
      const screen = document.getElementById('screen-' + name);
      if (screen) screen.classList.add('active');

      // Show/hide game elements
      const hud = document.getElementById('hudOverlay');
      const touchCtrl = document.getElementById('touchControls');
      const isGameplay = name === 'playing';
      hud.style.display = isGameplay ? 'flex' : 'none';
      touchCtrl.style.display = isGameplay ? 'flex' : 'none';

      if (name === 'playing') this.state = 'playing';
    },

    populateLevelSelect() {
      const grid = document.getElementById('levelGrid');
      grid.innerHTML = '';
      for (let i = 0; i < LEVELS.length; i++) {
        const lvl = LEVELS[i];
        const locked = i >= this.unlockedLevels;
        const stars = this.levelStars[i] || 0;

        const card = document.createElement('button');
        card.className = 'level-card' + (locked ? ' locked' : '');
        card.innerHTML = `
          <div class="level-num">${locked ? '🔒' : (i + 1)}</div>
          <div class="level-name">${lvl.name}</div>
          <div class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <div class="level-power">${locked ? '' : lvl.powerUpName}</div>
        `;
        if (!locked) {
          card.addEventListener('click', () => this.loadLevel(i));
        }
        grid.appendChild(card);
      }
    },

    // ==================== LEVEL LOADING ====================
    loadLevel(index) {
      this.currentLevel = index;
      this.levelData = LEVELS[index];
      const lvl = this.levelData;

      // Parse tile map
      this.gridH = lvl.tileMap.length;
      this.gridW = 0;
      this.grid = [];
      for (let y = 0; y < this.gridH; y++) {
        const row = lvl.tileMap[y];
        const parsed = [];
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          parsed.push(TILE_CHAR[ch] !== undefined ? TILE_CHAR[ch] : 0);
        }
        if (parsed.length > this.gridW) this.gridW = parsed.length;
        this.grid.push(parsed);
      }
      // Pad rows to gridW
      for (let y = 0; y < this.gridH; y++) {
        while (this.grid[y].length < this.gridW) this.grid[y].push(0);
      }

      // Count coins in the tile map
      this.totalCoins = 0;
      this.collectedCoins = {};
      for (let y = 0; y < this.gridH; y++) {
        for (let x = 0; x < this.gridW; x++) {
          if (this.grid[y][x] === TILES.COIN) this.totalCoins++;
          if (this.grid[y][x] === TILES.QCOIN) this.totalCoins++;
        }
      }
      this.coinsCollected = 0;

      // Create player
      const px = lvl.playerStart.x * T;
      const py = lvl.playerStart.y * T;
      this.player = {
        x: px, y: py, w: 26, h: 34,
        vx: 0, vy: 0,
        facing: 1,
        grounded: false,
        coyoteTimer: 0,
        jumpBuffer: 0,
        lives: 3,
        coins: 0,
        score: 0,
        invincible: 0,
        powerUp: null,
        powerUpTimer: 0,
        iceCooldown: 0,
        dead: false,
        deathTimer: 0,
        frame: 0,
        frameTimer: 0,
        giantScale: 1,
        shieldHits: 0,
      };

      // Create enemies
      this.enemies = [];
      this.totalEnemies = lvl.enemies.length;
      this.enemiesDefeated = 0;
      for (const e of lvl.enemies) {
        this.enemies.push({
          type: e.type,
          x: e.x * T, y: e.y * T,
          w: T - 4, h: T - 4,
          vx: (e.type === 'koopa' ? 1.2 : 0.8) * (Math.random() > 0.5 ? 1 : -1),
          vy: 0,
          facing: 1,
          alive: true,
          frozen: false,
          freezeTimer: 0,
          squished: false,
          squishTimer: 0,
          frame: 0,
          frameTimer: 0,
        });
      }

      // Clear state
      this.projectiles = [];
      this.items = [];
      this.usedBlocks = {};
      this.blockAnimations = [];
      this.coinPopAnimations = [];
      particles.length = 0;
      this.camera = { x: 0, y: 0 };
      this.shakeTimer = 0;
      this.levelStartTime = Date.now();

      // Update HUD
      this.updateHUD();

      this.showScreen('playing');
      this.state = 'playing';
    },

    // ==================== COLLISION HELPERS ====================
    getTile(tx, ty) {
      if (tx < 0 || tx >= this.gridW || ty < 0 || ty >= this.gridH) return TILES.AIR;
      return this.grid[ty][tx];
    },

    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);
      return t === TILES.SOLID || t === TILES.BRICK || t === TILES.QCOIN || t === TILES.QPOWER;
    },

    isPlatform(tx, ty) {
      return this.getTile(tx, ty) === TILES.PLATFORM;
    },

    // Axis-aligned bounding box overlap
    overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },

    // ==================== GAME UPDATE ====================
    update(dt) {
      if (this.state !== 'playing') return;
      const p = this.player;
      if (p.dead) {
        p.deathTimer -= dt * 1000;
        p.vy += GRAVITY * 0.7;
        p.y += p.vy;
        if (p.deathTimer <= 0) {
          p.lives--;
          if (p.lives <= 0) {
            this.state = 'gameover';
            sfxGameOver();
            this.showScreen('gameover');
            document.getElementById('gameOverCoins').textContent = this.coinsCollected;
          } else {
            // Respawn
            p.x = this.levelData.playerStart.x * T;
            p.y = this.levelData.playerStart.y * T;
            p.vx = 0; p.vy = 0;
            p.dead = false;
            p.invincible = INVINCIBLE_TIME;
            p.powerUp = null;
            p.powerUpTimer = 0;
            p.giantScale = 1;
            this.camera.x = 0;
            this.updateHUD();
          }
        }
        updateParticles();
        return;
      }

      // --- INPUT ---
      const leftPressed = isDown('ArrowLeft', 'KeyA') || touch.left;
      const rightPressed = isDown('ArrowRight', 'KeyD') || touch.right;
      const jumpPressed = wasPressed('Space', 'ArrowUp', 'KeyW') || touch.jumpPressed;
      const jumpHeld = isDown('Space', 'ArrowUp', 'KeyW') || touch.jump;
      const icePressed = wasPressed('KeyX', 'KeyZ', 'ShiftLeft', 'ShiftRight') || touch.icePressed;
      const pausePressed = wasPressed('Escape', 'KeyP');

      if (pausePressed) {
        this.state = 'paused';
        this.showScreen('paused');
        return;
      }

      // --- HORIZONTAL MOVEMENT ---
      if (leftPressed) {
        p.vx -= PLAYER_ACCEL;
        p.facing = -1;
      } else if (rightPressed) {
        p.vx += PLAYER_ACCEL;
        p.facing = 1;
      }

      // Speed cap
      let maxSpeed = PLAYER_SPEED;
      if (p.powerUp === 'speed') maxSpeed = PLAYER_SPEED * 1.6;
      if (p.powerUp === 'giant') maxSpeed = PLAYER_SPEED * 1.3;
      p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

      // Friction
      if (!leftPressed && !rightPressed) p.vx *= PLAYER_FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;

      // --- JUMPING ---
      if (p.grounded) p.coyoteTimer = COYOTE_TIME;
      else p.coyoteTimer = Math.max(0, p.coyoteTimer - 1);

      if (jumpPressed) p.jumpBuffer = JUMP_BUFFER;
      else p.jumpBuffer = Math.max(0, p.jumpBuffer - 1);

      if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
        let jumpForce = this.character === 'luigi' ? LUIGI_JUMP : PLAYER_JUMP;
        if (p.powerUp === 'highjump') jumpForce *= 1.35;
        if (p.powerUp === 'giant') jumpForce *= 0.9;
        p.vy = jumpForce;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpBuffer = 0;
        sfxJump();
      }

      // Variable jump height
      if (!jumpHeld && p.vy < -3) {
        p.vy *= 0.75;
      }

      // --- GRAVITY ---
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;

      // --- MOVE AND COLLIDE ---
      this.moveAndCollide(p);

      // --- FALL INTO PIT ---
      if (p.y > this.gridH * T + 100) {
        this.killPlayer();
      }

      // --- ANIMATION ---
      p.frameTimer++;
      if (Math.abs(p.vx) > 0.5 && p.grounded) {
        if (p.frameTimer > 6) { p.frame++; p.frameTimer = 0; }
      } else if (!p.grounded) {
        p.frame = 'jump';
      } else {
        p.frame = 0;
        p.frameTimer = 0;
      }

      // --- ICE PROJECTILE ---
      if (p.iceCooldown > 0) p.iceCooldown -= dt * 1000;
      if (icePressed && p.iceCooldown <= 0) {
        let cooldown = ICE_COOLDOWN;
        if (p.powerUp === 'rapidice') cooldown = ICE_COOLDOWN * 0.4;
        p.iceCooldown = cooldown;

        const bulletX = p.facing === 1 ? p.x + p.w : p.x - 12;
        const bulletY = p.y + p.h / 2 - 6;
        const speed = p.powerUp === 'rapidice' ? ICE_SPEED * 1.5 : ICE_SPEED;
        this.projectiles.push({
          x: bulletX, y: bulletY, w: 12, h: 12,
          vx: p.facing * speed, vy: 0,
          life: p.powerUp === 'rapidice' ? 80 : 50,
          pierce: p.powerUp === 'rapidice',
        });
        sfxIce();
        // Small recoil particles
        spawnIceParticles(bulletX, bulletY);
      }

      // --- INVINCIBILITY TIMER ---
      if (p.invincible > 0) p.invincible -= dt * 1000;

      // --- POWER-UP TIMER ---
      if (p.powerUp && p.powerUp !== 'shield') {
        p.powerUpTimer -= dt * 1000;
        if (p.powerUpTimer <= 0) {
          p.powerUp = null;
          p.giantScale = 1;
        }
      }

      // --- COLLECT COINS (tile-based) ---
      const pTileL = Math.floor(p.x / T);
      const pTileR = Math.floor((p.x + p.w - 1) / T);
      const pTileT = Math.floor(p.y / T);
      const pTileB = Math.floor((p.y + p.h - 1) / T);
      for (let ty = pTileT; ty <= pTileB; ty++) {
        for (let tx = pTileL; tx <= pTileR; tx++) {
          if (this.getTile(tx, ty) === TILES.COIN && !this.collectedCoins[tx + ',' + ty]) {
            this.collectedCoins[tx + ',' + ty] = true;
            this.grid[ty][tx] = TILES.AIR;
            this.coinsCollected++;
            p.coins++;
            p.score += 100;
            sfxCoin();
            spawnCoinParticles(tx * T + T / 2, ty * T + T / 2);
            this.updateHUD();
          }
          // Hazard collision
          if (this.getTile(tx, ty) === TILES.HAZARD) {
            if (p.invincible <= 0) {
              if (p.powerUp === 'shield') {
                p.powerUp = null;
                p.invincible = INVINCIBLE_TIME;
                sfxHurt();
              } else if (p.powerUp === 'giant') {
                // Giant is immune to hazards
              } else {
                this.killPlayer();
              }
            }
          }
        }
      }

      // --- HIT BLOCKS FROM BELOW ---
      if (p.vy < 0) {
        const headTileL = Math.floor((p.x + 2) / T);
        const headTileR = Math.floor((p.x + p.w - 2) / T);
        const headTileY = Math.floor(p.y / T);
        for (let tx = headTileL; tx <= headTileR; tx++) {
          this.hitBlock(tx, headTileY);
        }
      }

      // --- UPDATE ENEMIES ---
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (e.squished) {
          e.squishTimer -= dt * 1000;
          if (e.squishTimer <= 0) e.alive = false;
          continue;
        }
        if (e.frozen) {
          e.freezeTimer -= dt * 1000;
          if (e.freezeTimer <= 0) e.frozen = false;
          continue;
        }

        // Enemy animation
        e.frameTimer++;
        if (e.frameTimer > 12) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }

        // Enemy movement
        e.vy += GRAVITY;
        if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        e.x += e.vx;

        // Tile collision for enemies (horizontal)
        const eTileL = Math.floor(e.x / T);
        const eTileR = Math.floor((e.x + e.w) / T);
        const eTileT = Math.floor(e.y / T);
        const eTileB = Math.floor((e.y + e.h) / T);
        // Wall check
        if (e.vx > 0 && this.isSolid(eTileR, eTileB)) { e.vx = -Math.abs(e.vx); e.facing = -1; }
        if (e.vx < 0 && this.isSolid(eTileL, eTileB)) { e.vx = Math.abs(e.vx); e.facing = 1; }

        // Ledge detection (don't walk off edges)
        const aheadX = e.vx > 0 ? Math.floor((e.x + e.w + 2) / T) : Math.floor((e.x - 2) / T);
        const belowY = Math.floor((e.y + e.h + 4) / T);
        if (!this.isSolid(aheadX, belowY) && !this.isPlatform(aheadX, belowY)) {
          e.vx = -e.vx;
          e.facing = e.vx > 0 ? 1 : -1;
        }

        // Vertical movement
        e.y += e.vy;
        const eTileB2 = Math.floor((e.y + e.h) / T);
        if (this.isSolid(Math.floor((e.x + e.w / 2) / T), eTileB2)) {
          e.y = eTileB2 * T - e.h;
          e.vy = 0;
        }
        // Platform check for enemies
        const platTileY = Math.floor((e.y + e.h) / T);
        if (e.vy >= 0 && this.isPlatform(Math.floor((e.x + e.w / 2) / T), platTileY)) {
          const platTop = platTileY * T;
          if (e.y + e.h >= platTop && e.y + e.h <= platTop + 8) {
            e.y = platTop - e.h;
            e.vy = 0;
          }
        }

        // Player collision with enemy
        if (!p.dead && p.invincible <= 0 && this.overlap(p, e)) {
          // Check if player is stomping (coming from above)
          if (p.vy > 0 && p.y + p.h - 8 < e.y + e.h / 2) {
            // Stomp!
            p.vy = -7;
            if (e.frozen) {
              // Kick frozen enemy away
              e.alive = false;
              this.enemiesDefeated++;
              p.score += 200;
              spawnStompParticles(e.x + e.w / 2, e.y + e.h / 2);
            } else {
              e.squished = true;
              e.squishTimer = 500;
              this.enemiesDefeated++;
              p.score += 100;
              spawnStompParticles(e.x + e.w / 2, e.y + e.h / 2);
            }
            sfxStomp();
            this.shake(3, 100);
          } else if (p.powerUp === 'giant') {
            // Giant mode: kill enemies on contact
            e.alive = false;
            this.enemiesDefeated++;
            p.score += 200;
            spawnStompParticles(e.x + e.w / 2, e.y + e.h / 2);
            sfxStomp();
          } else if (p.powerUp === 'shield' && p.shieldHits < 1) {
            // Shield absorbs one hit
            p.shieldHits++;
            p.powerUp = null;
            p.invincible = INVINCIBLE_TIME;
            sfxHurt();
            p.vx = p.facing * -3;
            p.vy = -5;
          } else {
            // Player takes damage
            this.killPlayer();
          }
        }
      }

      // --- UPDATE PROJECTILES ---
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        proj.x += proj.vx;
        proj.life--;

        // Trail particles
        if (Math.random() > 0.5) {
          particles.push({
            x: proj.x + 6, y: proj.y + 6,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            life: 10, maxLife: 10, color: '#B0E8FF', size: 2 + Math.random() * 2, gravity: 0
          });
        }

        // Hit tile
        const ptx = Math.floor((proj.x + 6) / T);
        const pty = Math.floor((proj.y + 6) / T);
        if (this.isSolid(ptx, pty)) {
          spawnIceParticles(proj.x + 6, proj.y + 6);
          this.projectiles.splice(i, 1);
          continue;
        }

        // Hit enemy
        let hitEnemy = false;
        for (const e of this.enemies) {
          if (!e.alive || e.squished) continue;
          if (this.overlap(proj, e)) {
            if (!e.frozen) {
              e.frozen = true;
              e.freezeTimer = 5000;
              e.vx = 0;
              sfxFreeze();
              spawnIceParticles(e.x + e.w / 2, e.y + e.h / 2);
              this.shake(2, 80);
            }
            if (!proj.pierce) {
              hitEnemy = true;
              break;
            }
          }
        }
        if (hitEnemy) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // Out of bounds or lifetime
        if (proj.life <= 0 || proj.x < this.camera.x - 50 || proj.x > this.camera.x + W + 50) {
          this.projectiles.splice(i, 1);
        }
      }

      // --- UPDATE ITEMS (floating power-ups) ---
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        item.vy += 0.2;
        item.y += item.vy;
        item.x += item.vx;

        // Simple ground collision for items
        const itemTileB = Math.floor((item.y + T) / T);
        const itemTileX = Math.floor((item.x + T / 2) / T);
        if (this.isSolid(itemTileX, itemTileB)) {
          item.y = (itemTileB - 1) * T;
          item.vy = 0;
        }

        // Player pickup
        if (this.overlap({x: item.x, y: item.y, w: T, h: T}, p)) {
          p.powerUp = item.powerUpType;
          p.powerUpTimer = POWERUP_DURATION;
          p.shieldHits = 0;
          if (item.powerUpType === 'giant') {
            p.giantScale = 1.4;
          }
          sfxPowerUp();
          spawnPowerUpParticles(item.x + T / 2, item.y + T / 2);
          this.items.splice(i, 1);
          this.shake(4, 150);
          this.updateHUD();
        }
      }

      // --- UPDATE BLOCK ANIMATIONS ---
      for (let i = this.blockAnimations.length - 1; i >= 0; i--) {
        const ba = this.blockAnimations[i];
        ba.timer--;
        if (ba.timer <= 0) this.blockAnimations.splice(i, 1);
      }

      // --- UPDATE COIN POP ANIMATIONS ---
      for (let i = this.coinPopAnimations.length - 1; i >= 0; i--) {
        const cp = this.coinPopAnimations[i];
        cp.y += cp.vy;
        cp.vy += 0.3;
        cp.timer--;
        if (cp.timer <= 0) this.coinPopAnimations.splice(i, 1);
      }

      // --- CAMERA ---
      const worldW = this.gridW * T;
      const worldH = this.gridH * T;
      const targetX = p.x - W / 2 + p.w / 2;
      const targetY = p.y - H / 2 + p.h / 2;
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.08;
      this.camera.x = Math.max(0, Math.min(this.camera.x, worldW - W));
      this.camera.y = Math.max(0, Math.min(this.camera.y, worldH - H));

      // Screen shake
      if (this.shakeTimer > 0) this.shakeTimer -= dt * 1000;

      // --- FLAG / LEVEL COMPLETE ---
      const flag = this.levelData.flagPos;
      const flagRect = { x: flag.x * T, y: flag.y * T, w: T, h: (14 - flag.y) * T };
      if (this.overlap(p, flagRect)) {
        this.completeLevel();
      }

      // --- UPDATE PARTICLES ---
      updateParticles();
    },

    // ==================== MOVEMENT AND COLLISION ====================
    moveAndCollide(entity) {
      const p = entity;
      const giantW = p.giantScale ? p.w * p.giantScale : p.w;
      const giantH = p.giantScale ? p.h * p.giantScale : p.h;

      // Horizontal
      p.x += p.vx;
      // Left wall
      if (p.vx < 0) {
        const tileL = Math.floor(p.x / T);
        const tileT = Math.floor((p.y + 2) / T);
        const tileB = Math.floor((p.y + p.h - 2) / T);
        for (let ty = tileT; ty <= tileB; ty++) {
          if (this.isSolid(tileL, ty)) {
            p.x = (tileL + 1) * T;
            p.vx = 0;
            break;
          }
        }
      }
      // Right wall
      if (p.vx > 0) {
        const tileR = Math.floor((p.x + p.w) / T);
        const tileT = Math.floor((p.y + 2) / T);
        const tileB = Math.floor((p.y + p.h - 2) / T);
        for (let ty = tileT; ty <= tileB; ty++) {
          if (this.isSolid(tileR, ty)) {
            p.x = tileR * T - p.w;
            p.vx = 0;
            break;
          }
        }
      }

      // Vertical
      p.y += p.vy;
      p.grounded = false;

      // Floor (solid tiles)
      if (p.vy >= 0) {
        const tileB = Math.floor((p.y + p.h) / T);
        const tileL = Math.floor((p.x + 2) / T);
        const tileR = Math.floor((p.x + p.w - 2) / T);
        for (let tx = tileL; tx <= tileR; tx++) {
          if (this.isSolid(tx, tileB)) {
            p.y = tileB * T - p.h;
            p.vy = 0;
            p.grounded = true;
            break;
          }
        }
        // One-way platforms
        if (!p.grounded) {
          for (let tx = tileL; tx <= tileR; tx++) {
            if (this.isPlatform(tx, tileB)) {
              const platTop = tileB * T;
              if (p.y + p.h >= platTop && p.y + p.h <= platTop + 10) {
                p.y = platTop - p.h;
                p.vy = 0;
                p.grounded = true;
                break;
              }
            }
          }
        }
      }

      // Ceiling
      if (p.vy < 0) {
        const tileT = Math.floor(p.y / T);
        const tileL = Math.floor((p.x + 2) / T);
        const tileR = Math.floor((p.x + p.w - 2) / T);
        for (let tx = tileL; tx <= tileR; tx++) {
          if (this.isSolid(tx, tileT)) {
            p.y = (tileT + 1) * T;
            p.vy = 0;
            break;
          }
        }
      }

      // World bounds (left side)
      if (p.x < 0) { p.x = 0; p.vx = 0; }
    },

    // ==================== BLOCK HIT ====================
    hitBlock(tx, ty) {
      const tile = this.getTile(tx, ty);
      const key = tx + ',' + ty;
      if (this.usedBlocks[key]) return;

      if (tile === TILES.QCOIN) {
        this.usedBlocks[key] = true;
        this.grid[ty][tx] = TILES.SOLID; // becomes a used block (we'll draw it differently)
        this.coinsCollected++;
        this.player.coins++;
        this.player.score += 100;
        sfxBlockHit();
        sfxCoin();
        spawnCoinParticles(tx * T + T / 2, ty * T - T / 2);
        this.blockAnimations.push({ x: tx, y: ty, timer: 8, maxTimer: 8 });
        this.coinPopAnimations.push({ x: tx * T + T / 2 - 6, y: ty * T - T / 2, vy: -4, timer: 20 });
        this.updateHUD();
      } else if (tile === TILES.QPOWER) {
        this.usedBlocks[key] = true;
        this.grid[ty][tx] = TILES.SOLID;
        sfxBlockHit();
        // Spawn power-up item
        this.items.push({
          x: tx * T, y: ty * T - T,
          vx: 0.5 * this.player.facing, vy: -3,
          w: T, h: T,
          powerUpType: this.levelData.powerUpType,
        });
        this.blockAnimations.push({ x: tx, y: ty, timer: 8, maxTimer: 8 });
      } else if (tile === TILES.BRICK) {
        if (this.player.powerUp === 'giant') {
          // Giant breaks bricks
          this.grid[ty][tx] = TILES.AIR;
          sfxBlockHit();
          spawnBrickParticles(tx * T, ty * T);
          this.shake(3, 80);
        } else {
          sfxBlockHit();
          this.blockAnimations.push({ x: tx, y: ty, timer: 8, maxTimer: 8 });
        }
      }
    },

    // ==================== KILL PLAYER ====================
    killPlayer() {
      const p = this.player;
      if (p.dead || p.invincible > 0) return;
      p.dead = true;
      p.vy = -8;
      p.vx = 0;
      p.deathTimer = 1500;
      sfxHurt();
      spawnDeathParticles(p.x + p.w / 2, p.y + p.h / 2);
      this.shake(5, 200);
    },

    // ==================== SHAKE ====================
    shake(intensity, duration) {
      this.shakeIntensity = intensity;
      this.shakeTimer = duration;
    },

    // ==================== LEVEL COMPLETE ====================
    completeLevel() {
      this.state = 'complete';
      sfxLevelComplete();

      const timeMs = Date.now() - this.levelStartTime;
      const timeSec = Math.floor(timeMs / 1000);

      // Calculate stars
      let stars = 1; // Always get 1 star for completing
      if (this.coinsCollected >= this.totalCoins) stars = 2;
      if (this.enemiesDefeated >= this.totalEnemies && this.coinsCollected >= this.totalCoins) stars = 3;

      // Save progress
      if (stars > this.levelStars[this.currentLevel]) {
        this.levelStars[this.currentLevel] = stars;
      }
      if (this.currentLevel + 1 >= this.unlockedLevels && this.currentLevel + 1 < LEVELS.length) {
        this.unlockedLevels = this.currentLevel + 2;
      }
      Storage.save('mario-adventure', 'unlocked', this.unlockedLevels);
      Storage.save('mario-adventure', 'stars', this.levelStars);

      // Populate complete screen
      document.getElementById('completeTitle').textContent =
        this.currentLevel === LEVELS.length - 1 ? 'YOU WIN! 🎉' : 'Level Complete!';
      document.getElementById('completeStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      document.getElementById('completeCoins').textContent = `Coins: ${this.coinsCollected} / ${this.totalCoins}`;
      document.getElementById('completeEnemies').textContent = `Enemies: ${this.enemiesDefeated} / ${this.totalEnemies}`;
      document.getElementById('completeTime').textContent = `Time: ${timeSec}s`;
      document.getElementById('completeScore').textContent = `Score: ${this.player.score}`;

      const btnNext = document.getElementById('btnNextLevel');
      btnNext.textContent = this.currentLevel < LEVELS.length - 1 ? 'Next Level ▶' : 'Back to Levels';

      this.showScreen('complete');

      // Celebration particles
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          spawnParticles(W * Math.random(), H * 0.3, 15, ['#FFD700', '#FF69B4', '#4ADE80', '#00D4FF'][i % 4], 5, 60, 0.08);
        }, i * 300);
      }
    },

    // ==================== HUD ====================
    updateHUD() {
      const p = this.player;
      if (!p) return;
      document.getElementById('hudLives').textContent = '❤️'.repeat(Math.max(0, p.lives));
      document.getElementById('hudCoins').textContent = `🪙 ${this.coinsCollected}`;
      document.getElementById('hudScore').textContent = `Score: ${p.score}`;
      const powerText = document.getElementById('hudPower');
      if (p.powerUp) {
        const remaining = Math.ceil(p.powerUpTimer / 1000);
        const name = this.levelData.powerUpName;
        powerText.textContent = p.powerUp === 'shield' ? `🛡️ ${name}` : `⚡ ${name} (${remaining}s)`;
        powerText.style.display = 'block';
      } else {
        powerText.style.display = 'none';
      }
    },

    // ==================== RENDER ====================
    render() {
      const ctx = this.ctx;
      const cam = this.camera;

      // Screen shake offset
      let shakeX = 0, shakeY = 0;
      if (this.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Background
      drawBackground(ctx, this.levelData, cam.x, cam.y);

      // Tiles
      const startCol = Math.max(0, Math.floor(cam.x / T) - 1);
      const endCol = Math.min(this.gridW, Math.ceil((cam.x + W) / T) + 1);
      const startRow = Math.max(0, Math.floor(cam.y / T) - 1);
      const endRow = Math.min(this.gridH, Math.ceil((cam.y + H) / T) + 1);

      for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
          const tile = this.grid[y][x];
          if (tile === TILES.AIR) continue;
          const key = x + ',' + y;
          const drawX = x * T - cam.x;
          let drawY = y * T - cam.y;

          // Block bounce animation
          const ba = this.blockAnimations.find(a => a.x === x && a.y === y);
          if (ba) {
            const progress = ba.timer / ba.maxTimer;
            drawY -= Math.sin(progress * Math.PI) * 6;
          }

          if (this.usedBlocks[key] && (tile === TILES.SOLID)) {
            // Used question block
            drawEmptyBlock(ctx, drawX, drawY);
          } else {
            drawTile(ctx, tile, drawX, drawY, this.levelData);
          }
        }
      }

      // Coin pop animations
      for (const cp of this.coinPopAnimations) {
        const alpha = cp.timer / 20;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cp.x - cam.x + 6, cp.y - cam.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Flag
      if (this.levelData.flagPos) {
        drawFlag(ctx, this.levelData.flagPos.x, this.levelData.flagPos.y, cam.x, cam.y);
      }

      // Items (floating power-ups)
      for (const item of this.items) {
        drawPowerUpItem(ctx, item.x - cam.x, item.y - cam.y, item.powerUpType);
      }

      // Enemies
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const ex = e.x - cam.x;
        const ey = e.y - cam.y;
        if (ex < -T || ex > W + T) continue;

        if (e.squished) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.translate(ex + e.w / 2, ey + e.h);
          ctx.scale(1.3, 0.3);
          ctx.translate(-(ex + e.w / 2), -(ey + e.h));
          if (e.type === 'goomba') drawGoomba(ctx, ex, ey, false);
          else drawKoopa(ctx, ex, ey, e.facing, false);
          ctx.restore();
        } else {
          if (e.type === 'goomba') drawGoomba(ctx, ex, ey, e.frozen);
          else drawKoopa(ctx, ex, ey, e.facing, e.frozen);
        }
      }

      // Projectiles
      for (const proj of this.projectiles) {
        drawIceProjectile(ctx, proj.x - cam.x, proj.y - cam.y);
      }

      // Player
      const p = this.player;
      if (p) {
        const px = p.x - cam.x;
        const py = p.y - cam.y;
        ctx.save();
        if (p.giantScale > 1) {
          const cx = px + p.w / 2;
          const cy = py + p.h;
          ctx.translate(cx, cy);
          ctx.scale(p.giantScale, p.giantScale);
          ctx.translate(-cx, -cy);
        }
        drawPlayer(ctx, px, py, p.w, p.h, this.character, p.facing, p.frame, p.powerUp, p.invincible > 0);
        ctx.restore();

        // Shield visual
        if (p.powerUp === 'shield') {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
          ctx.lineWidth = 2;
          const shimmer = Math.sin(Date.now() / 200) * 3;
          ctx.beginPath();
          ctx.arc(px + p.w / 2, py + p.h / 2, 22 + shimmer, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Particles
      renderParticles(ctx, cam.x, cam.y);

      // Power-up timer bar
      if (p && p.powerUp && p.powerUp !== 'shield') {
        const barW = 100;
        const barH = 6;
        const barX = W / 2 - barW / 2;
        const barY = 50;
        const progress = p.powerUpTimer / POWERUP_DURATION;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fillStyle = progress > 0.3 ? '#4ADE80' : '#FF6B35';
        roundRect(ctx, barX, barY, barW * progress, barH, 3);
      }

      ctx.restore();
    },

    // ==================== GAME LOOP ====================
    loop(time) {
      const dt = Math.min((time - this.lastTime) / 1000, 1 / 30);
      this.lastTime = time;

      if (this.state === 'playing' || (this.state === 'playing' && this.player && this.player.dead)) {
        this.update(dt);
        this.render();
        // Update power-up HUD timer
        if (this.player && this.player.powerUp) this.updateHUD();
      } else if (this.state === 'complete') {
        // Keep rendering the level in background
        this.render();
        updateParticles();
      } else if (this.state === 'paused') {
        this.render();
      }

      clearPressed();
      requestAnimationFrame(t => this.loop(t));
    },

    // ==================== TOUCH CONTROLS ====================
    setupTouchControls() {
      const btnLeft = document.getElementById('touchLeft');
      const btnRight = document.getElementById('touchRight');
      const btnJump = document.getElementById('touchJump');
      const btnIce = document.getElementById('touchIce');

      function addTouch(el, onDown, onUp) {
        el.addEventListener('touchstart', e => { e.preventDefault(); onDown(); }, { passive: false });
        el.addEventListener('touchend', e => { e.preventDefault(); onUp(); }, { passive: false });
        el.addEventListener('touchcancel', e => { onUp(); });
        // Also support mouse for testing
        el.addEventListener('mousedown', e => { e.preventDefault(); onDown(); });
        el.addEventListener('mouseup', e => { e.preventDefault(); onUp(); });
        el.addEventListener('mouseleave', e => { onUp(); });
      }

      addTouch(btnLeft, () => { touch.left = true; }, () => { touch.left = false; });
      addTouch(btnRight, () => { touch.right = true; }, () => { touch.right = false; });
      addTouch(btnJump, () => { touch.jump = true; touch.jumpPressed = true; }, () => { touch.jump = false; });
      addTouch(btnIce, () => { touch.ice = true; touch.icePressed = true; }, () => { touch.ice = false; });

      // Detect touch device
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      document.getElementById('touchControls').style.display = isTouchDevice ? 'flex' : 'none';
      document.getElementById('controlsHintKeyboard').style.display = isTouchDevice ? 'none' : 'block';
      document.getElementById('controlsHintTouch').style.display = isTouchDevice ? 'block' : 'none';
    },
  };

  // ==================== INIT ====================
  document.addEventListener('DOMContentLoaded', () => {
    game.init();
  });

})();
