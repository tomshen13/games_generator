/**
 * Game Engine — game loop, input, starfield, screen shake, sprite rendering.
 * Adapted for a fixed-screen vertical shooter (no tile physics / gravity).
 */
const Engine = (() => {
  const SCALE = 3;

  // ===== INPUT =====
  const _keys = {};
  const _pressed = {};
  const _PREVENT = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','KeyX','KeyE','KeyQ','ShiftRight','Slash']);

  // P1 (co-op): WASD + E (shoot) + Q (bomb)
  const _P1 = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', shoot: 'KeyE', bomb: 'KeyQ' };
  // P2 (co-op): Arrows + Shift (shoot) + / (bomb)
  const _P2 = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', shoot: 'ShiftRight', bomb: 'Slash' };
  // Single-player: both WASD and Arrows work, Space/E to shoot, Q for bomb
  const _SP = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
                left2: 'KeyA', right2: 'KeyD', up2: 'KeyW', down2: 'KeyS',
                shoot: 'Space', shoot2: 'KeyE', bomb: 'KeyQ' };

  function _isDown(c) { return !!_keys[c]; }
  function _justPressed(c) { return !!_pressed[c]; }
  function _consumePressed() { for (const k in _pressed) delete _pressed[k]; }

  const Input = {
    init() {
      window.addEventListener('keydown', e => {
        if (!_keys[e.code]) _pressed[e.code] = true;
        _keys[e.code] = true;
        if (_PREVENT.has(e.code)) e.preventDefault();
      });
      window.addEventListener('keyup', e => { _keys[e.code] = false; });
      window.addEventListener('blur', () => {
        for (const k in _keys) _keys[k] = false;
      });
    },

    consumePressed: _consumePressed,
    isDown: _isDown,
    justPressed: _justPressed,

    left(pn, coop) {
      if (!coop) return _isDown(_SP.left) || _isDown(_SP.left2);
      return _isDown(pn === 1 ? _P1.left : _P2.left);
    },
    right(pn, coop) {
      if (!coop) return _isDown(_SP.right) || _isDown(_SP.right2);
      return _isDown(pn === 1 ? _P1.right : _P2.right);
    },
    up(pn, coop) {
      if (!coop) return _isDown(_SP.up) || _isDown(_SP.up2);
      return _isDown(pn === 1 ? _P1.up : _P2.up);
    },
    down(pn, coop) {
      if (!coop) return _isDown(_SP.down) || _isDown(_SP.down2);
      return _isDown(pn === 1 ? _P1.down : _P2.down);
    },
    shootHeld(pn, coop) {
      if (!coop) return _isDown(_SP.shoot) || _isDown(_SP.shoot2);
      return _isDown(pn === 1 ? _P1.shoot : _P2.shoot);
    },
    bombPressed(pn, coop) {
      if (!coop) return _justPressed(_SP.bomb);
      return _justPressed(pn === 1 ? _P1.bomb : _P2.bomb);
    },
  };

  // ===== SPRITE CACHE & RENDERER =====
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
          const dx = flip ? (w - 1 - x) : x;
          cx.fillRect(dx, y, 1, 1);
        }
      }
    }
    spriteCache.set(key, c);
    return c;
  }

  function drawSprite(ctx, sprite, x, y, flip, scale) {
    if (!sprite) return;
    const s = scale || SCALE;
    const cached = cacheSpriteCanvas(sprite, flip);
    ctx.drawImage(cached, 0, 0, sprite.w, sprite.h,
      Math.round(x), Math.round(y), sprite.w * s, sprite.h * s);
  }

  function drawSpriteGlow(ctx, sprite, x, y, glowColor, glowSize, flip, scale) {
    if (!sprite) return;
    ctx.save();
    ctx.shadowBlur = glowSize || 12;
    ctx.shadowColor = glowColor || '#00FFFF';
    drawSprite(ctx, sprite, x, y, flip, scale);
    ctx.restore();
  }

  // ===== STARFIELD =====
  let stars = [];

  function initStarfield(cw, ch) {
    stars = [];
    // Layer 1: far, small, slow
    for (let i = 0; i < 80; i++) {
      stars.push({ x: Math.random() * cw, y: Math.random() * ch, speed: 0.2, size: 1, alpha: 0.4 + Math.random() * 0.3, layer: 0 });
    }
    // Layer 2: mid
    for (let i = 0; i < 40; i++) {
      stars.push({ x: Math.random() * cw, y: Math.random() * ch, speed: 0.5, size: 1.5, alpha: 0.5 + Math.random() * 0.3, layer: 1 });
    }
    // Layer 3: near, bright
    for (let i = 0; i < 20; i++) {
      stars.push({ x: Math.random() * cw, y: Math.random() * ch, speed: 1.0, size: 2, alpha: 0.7 + Math.random() * 0.3, layer: 2 });
    }
  }

  function updateStarfield(ch) {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > ch) {
        s.y = -2;
        s.x = Math.random() * (canvas ? canvas.width / (window.devicePixelRatio || 1) : 800);
      }
    }
  }

  function renderStarfield(ctx, cw, ch) {
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      const colors = ['#8888AA', '#AAAACC', '#FFFFFF'];
      ctx.fillStyle = colors[s.layer];
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  // ===== SCREEN SHAKE =====
  let shakeFrames = 0;
  let shakeIntensity = 3;

  function triggerShake(frames, intensity) {
    shakeFrames = frames || 10;
    shakeIntensity = intensity || 3;
  }

  function applyShake(ctx) {
    if (shakeFrames > 0) {
      const dx = (Math.random() - 0.5) * 2 * shakeIntensity;
      const dy = (Math.random() - 0.5) * 2 * shakeIntensity;
      ctx.translate(dx, dy);
      shakeFrames--;
      return true;
    }
    return false;
  }

  // ===== AABB OVERLAP =====
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ===== GAME LOOP =====
  let canvas, ctx;
  let lastTime = 0;
  const FIXED_DT = 1000 / 60;
  let accum = 0;
  let running = false;

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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const cw = p.clientWidth;
    const ch = p.clientHeight;
    if (stars.length === 0 || Math.abs(stars[0].x) > cw * 2) {
      initStarfield(cw, ch);
    }
  }

  function startLoop(updateFn, renderFn) {
    running = true;
    lastTime = performance.now();
    accum = 0;

    function frame(now) {
      if (!running) return;
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      accum += dt;

      while (accum >= FIXED_DT) {
        updateFn();
        Input.consumePressed();
        accum -= FIXED_DT;
      }

      const cw = canvas.width / (window.devicePixelRatio || 1);
      const ch = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, cw, ch);
      renderFn(ctx, cw, ch);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function stopLoop() { running = false; }

  function getCtx() { return ctx; }
  function getCanvas() { return canvas; }
  function getSize() {
    if (!canvas) return { w: 800, h: 600 };
    const dpr = window.devicePixelRatio || 1;
    return { w: canvas.width / dpr, h: canvas.height / dpr };
  }

  return {
    SCALE,
    Input,
    drawSprite,
    drawSpriteGlow,
    initStarfield, updateStarfield, renderStarfield,
    triggerShake, applyShake,
    overlap,
    initCanvas, resize, startLoop, stopLoop,
    getCtx, getCanvas, getSize,
  };
})();
