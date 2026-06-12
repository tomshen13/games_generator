/**
 * Slim canvas engine for the Ninjago arena.
 * Fixed 320x180 world, integer pixel scale, letterboxed and centered.
 * Adapted from sonic-dash/engine.js (loop + sprite cache); the camera,
 * tile physics, and input layers are dropped — the arena is static and
 * input comes from the numpad.
 */
const Engine = (() => {
  const W = 320;
  const H = 180;

  let canvas = null;
  let ctx = null;
  let scale = 2;
  let offX = 0;
  let offY = 0;

  let running = false;
  let lastTime = 0;
  let accum = 0;
  const FIXED_DT = 1000 / 60;
  let frame = 0; // fixed-step frame counter for animations

  // Screen shake (render-space offset)
  let shakeMag = 0;
  let shakeUntil = 0;

  function initCanvas(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    const p = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = p.clientWidth * dpr;
    canvas.height = p.clientHeight * dpr;
    canvas.style.width = p.clientWidth + 'px';
    canvas.style.height = p.clientHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    // Fractional scale fills the wrap; slight pixel unevenness beats letterboxing
    scale = Math.max(1, Math.min(p.clientWidth / W, p.clientHeight / H));
    offX = Math.floor((p.clientWidth - W * scale) / 2);
    offY = Math.floor((p.clientHeight - H * scale) / 2);
  }

  function getView() {
    return { W, H, scale, offX, offY };
  }

  /** World coords → page coords (for Particles, which draws on its own full-screen canvas) */
  function worldToScreen(wx, wy) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + offX + wx * scale,
      y: rect.top + offY + wy * scale,
    };
  }

  // ===== SPRITE CACHE (same approach as sonic-dash) =====
  const spriteCache = new Map();

  function getSpriteKey(sprite, flip) {
    if (!sprite._id) sprite._id = Math.random().toString(36).slice(2);
    return sprite._id + (flip ? '_f' : '');
  }

  function cacheSpriteCanvas(sprite, flip) {
    const key = getSpriteKey(sprite, flip);
    if (spriteCache.has(key)) return spriteCache.get(key);
    const c = document.createElement('canvas');
    c.width = sprite.w;
    c.height = sprite.h;
    const cx = c.getContext('2d');
    const { w, h, pixels } = sprite;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = pixels[y * w + x];
        if (color) {
          cx.fillStyle = color;
          cx.fillRect(flip ? (w - 1 - x) : x, y, 1, 1);
        }
      }
    }
    spriteCache.set(key, c);
    return c;
  }

  /** Draw a sprite at world coords. drawScale multiplies sprite size (bosses use 2). */
  function drawSprite(targetCtx, sprite, wx, wy, flip = false, drawScale = 1) {
    if (!sprite) return;
    const cached = cacheSpriteCanvas(sprite, flip);
    targetCtx.drawImage(
      cached, 0, 0, sprite.w, sprite.h,
      Math.round(offX + wx * scale),
      Math.round(offY + wy * scale),
      sprite.w * scale * drawScale,
      sprite.h * scale * drawScale
    );
  }

  /** Fill a rect given in world coords (used by procedural background/dojo). */
  function wrect(targetCtx, color, wx, wy, ww, wh) {
    targetCtx.fillStyle = color;
    targetCtx.fillRect(
      Math.round(offX + wx * scale),
      Math.round(offY + wy * scale),
      Math.round(ww * scale),
      Math.round(wh * scale)
    );
  }

  function shake(mag, ms) {
    shakeMag = mag;
    shakeUntil = performance.now() + ms;
  }

  // ===== PARALLAX NIGHT BACKGROUND =====
  const GROUND_Y = 150; // world y of the dojo yard floor

  // Static scenery generated once (positions only; rendering is per-frame)
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * 90, tw: Math.random() * Math.PI * 2, size: Math.random() < 0.2 ? 2 : 1 });
  }
  const buildings = [];
  let bx = -10;
  while (bx < W + 20) {
    const bw = 18 + Math.random() * 26;
    const bh = 24 + Math.random() * 40;
    const windows = [];
    for (let wy = 0; wy < bh - 8; wy += 7) {
      for (let wxx = 3; wxx < bw - 4; wxx += 6) {
        if (Math.random() < 0.35) windows.push({ x: wxx, y: wy + 4 });
      }
    }
    buildings.push({ x: bx, w: bw, h: bh, windows, pagoda: Math.random() < 0.25 });
    bx += bw + 2 + Math.random() * 8;
  }
  const petals = [];
  for (let i = 0; i < 14; i++) {
    petals.push({ x: Math.random() * W, y: Math.random() * H, vx: -0.12 - Math.random() * 0.15, vy: 0.1 + Math.random() * 0.12, ph: Math.random() * Math.PI * 2 });
  }
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({ x: Math.random() * W, y: 12 + Math.random() * 40, w: 30 + Math.random() * 40, sp: 0.02 + Math.random() * 0.04 });
  }

  function renderBg(targetCtx, t) {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    // Layer 1: night sky gradient — fills the ENTIRE canvas (no letterbox bars)
    const g = targetCtx.createLinearGradient(0, 0, 0, offY + GROUND_Y * scale);
    g.addColorStop(0, '#0B0B2A');
    g.addColorStop(0.55, '#1A1040');
    g.addColorStop(1, '#3A1C4A');
    targetCtx.fillStyle = g;
    targetCtx.fillRect(0, 0, cw, ch);

    // Ground band extends across the full canvas width and down to the bottom
    const groundTop = offY + GROUND_Y * scale;
    targetCtx.fillStyle = '#2B2138';
    targetCtx.fillRect(0, groundTop, cw, ch - groundTop);
    targetCtx.fillStyle = '#3A2D4A';
    targetCtx.fillRect(0, groundTop, cw, 2 * scale);

    // Stars (twinkle)
    for (const s of stars) {
      targetCtx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.015 + s.tw));
      wrect(targetCtx, '#FFF8E1', s.x, s.y, s.size, s.size);
    }
    targetCtx.globalAlpha = 1;

    // Moon with glow
    const mx = offX + 262 * scale, my = offY + 30 * scale, mr = 13 * scale;
    const glow = targetCtx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
    glow.addColorStop(0, 'rgba(255, 244, 200, 0.35)');
    glow.addColorStop(1, 'rgba(255, 244, 200, 0)');
    targetCtx.fillStyle = glow;
    targetCtx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
    targetCtx.fillStyle = '#FFF4C8';
    targetCtx.beginPath();
    targetCtx.arc(mx, my, mr, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.fillStyle = 'rgba(190, 170, 120, 0.5)';
    targetCtx.beginPath();
    targetCtx.arc(mx - mr * 0.3, my + mr * 0.2, mr * 0.22, 0, Math.PI * 2);
    targetCtx.arc(mx + mr * 0.35, my - mr * 0.3, mr * 0.16, 0, Math.PI * 2);
    targetCtx.fill();

    // Drifting clouds
    for (const c of clouds) {
      c.x -= c.sp;
      if (c.x + c.w < -10) c.x = W + 10;
      targetCtx.globalAlpha = 0.18;
      wrect(targetCtx, '#B39DDB', c.x, c.y, c.w, 5);
      wrect(targetCtx, '#B39DDB', c.x + 6, c.y - 3, c.w * 0.6, 3);
      targetCtx.globalAlpha = 1;
    }

    // Layer 2: city skyline silhouette
    for (const b of buildings) {
      const top = GROUND_Y - 26 - b.h;
      wrect(targetCtx, '#14102E', b.x, top, b.w, b.h + 26);
      if (b.pagoda) {
        wrect(targetCtx, '#14102E', b.x - 3, top + 2, b.w + 6, 3);
        wrect(targetCtx, '#14102E', b.x + b.w / 2 - 2, top - 5, 4, 5);
      }
      targetCtx.globalAlpha = 0.5 + 0.3 * Math.abs(Math.sin(t * 0.005 + b.x));
      for (const wd of b.windows) {
        wrect(targetCtx, '#FFB300', b.x + wd.x, top + wd.y, 2, 2);
      }
      targetCtx.globalAlpha = 1;
    }

    // Layer 3: temple hills silhouette (closer, darker)
    targetCtx.fillStyle = '#0E0A20';
    targetCtx.beginPath();
    targetCtx.moveTo(offX, offY + (GROUND_Y - 10) * scale);
    for (let x = 0; x <= W; x += 16) {
      const hy = GROUND_Y - 14 - 8 * Math.sin(x * 0.05) - 4 * Math.sin(x * 0.13 + 2);
      targetCtx.lineTo(offX + x * scale, offY + hy * scale);
    }
    targetCtx.lineTo(offX + W * scale, offY + (GROUND_Y + 4) * scale);
    targetCtx.lineTo(offX, offY + (GROUND_Y + 4) * scale);
    targetCtx.fill();

    // Layer 4: stone tile seams on the ground band (band itself drawn above)
    for (let x = 0; x < W; x += 24) {
      const shift = (Math.floor((GROUND_Y / 8)) % 2) * 12;
      wrect(targetCtx, '#241B30', x + shift, GROUND_Y + 8, 22, 1);
      wrect(targetCtx, '#241B30', x, GROUND_Y + 18, 22, 1);
      wrect(targetCtx, '#241B30', x + 12, GROUND_Y + 27, 22, 1);
    }

    // Falling cherry-blossom petals (foreground life)
    for (const p of petals) {
      p.x += p.vx; p.y += p.vy;
      p.ph += 0.03;
      if (p.y > H || p.x < -4) { p.x = W + Math.random() * 20; p.y = Math.random() * H * 0.5; }
      targetCtx.globalAlpha = 0.7;
      wrect(targetCtx, '#F8BBD0', p.x + Math.sin(p.ph) * 3, p.y, 2, 1);
      targetCtx.globalAlpha = 1;
    }
  }

  // ===== GAME LOOP (fixed timestep, same as sonic-dash) =====
  function startLoop(updateFn, renderFn) {
    if (running) return;
    running = true;
    lastTime = performance.now();
    accum = 0;

    function loop(now) {
      if (!running) return;
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      accum += dt;

      while (accum >= FIXED_DT) {
        updateFn();
        frame++;
        accum -= FIXED_DT;
      }

      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      ctx.clearRect(0, 0, cw, ch);

      ctx.save();
      if (performance.now() < shakeUntil) {
        ctx.translate(
          (Math.random() - 0.5) * 2 * shakeMag,
          (Math.random() - 0.5) * 2 * shakeMag
        );
      }
      renderFn(ctx, frame);
      ctx.restore();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function stopLoop() { running = false; }
  function isRunning() { return running; }

  return {
    W, H, GROUND_Y,
    initCanvas, resize, getView, worldToScreen,
    drawSprite, wrect, renderBg,
    startLoop, stopLoop, isRunning, shake,
  };
})();
