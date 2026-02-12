/**
 * Game Engine — game loop, input, physics, collision, camera, rendering.
 */
const Engine = (() => {
  const TILE = 16;
  const SCALE = 3;
  const GRAVITY = 0.55;
  const MAX_FALL = 10;
  const FRICTION = 0.85;
  const ICE_FRICTION = 0.98;

  // ===== INPUT =====
  // All state as closure variables — no `this` binding issues
  const _keys = {};
  const _pressed = {};
  const _PREVENT = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','KeyX','KeyE']);

  const _P1 = { left: 'KeyA', right: 'KeyD', jump: 'Space', jump2: 'KeyW', shoot: 'KeyE' };
  const _P2 = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Enter', jump2: 'ArrowUp', shoot: 'ShiftRight' };
  const _SP = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space', jump2: 'ArrowUp', shoot: 'KeyX' };

  function _isDown(c) { return !!_keys[c]; }
  function _justPressed(c) { return !!_pressed[c]; }
  function _consumePressed() {
    for (const k in _pressed) delete _pressed[k];
  }

  const Input = {
    P1: _P1, P2: _P2, SP: _SP,

    init() {
      window.addEventListener('keydown', e => {
        if (!_keys[e.code]) _pressed[e.code] = true;
        _keys[e.code] = true;
        if (_PREVENT.has(e.code)) e.preventDefault();
      });
      window.addEventListener('keyup', e => { _keys[e.code] = false; });
    },

    consumePressed: _consumePressed,
    isDown: _isDown,
    justPressed: _justPressed,

    left(pn, coop) {
      if (!coop) return _isDown(_SP.left) || _isDown(_P1.left);
      const c = pn === 1 ? _P1 : _P2;
      return _isDown(c.left);
    },
    right(pn, coop) {
      if (!coop) return _isDown(_SP.right) || _isDown(_P1.right);
      const c = pn === 1 ? _P1 : _P2;
      return _isDown(c.right);
    },
    jumpPressed(pn, coop) {
      if (!coop) return _justPressed(_SP.jump) || _justPressed(_SP.jump2) || _justPressed(_P1.jump2);
      const c = pn === 1 ? _P1 : _P2;
      return _justPressed(c.jump) || _justPressed(c.jump2);
    },
    jumpHeld(pn, coop) {
      if (!coop) return _isDown(_SP.jump) || _isDown(_SP.jump2) || _isDown(_P1.jump2);
      const c = pn === 1 ? _P1 : _P2;
      return _isDown(c.jump) || _isDown(c.jump2);
    },
    shootPressed(pn, coop) {
      if (!coop) return _justPressed(_SP.shoot) || _justPressed(_P1.shoot);
      const c = pn === 1 ? _P1 : _P2;
      return _justPressed(c.shoot);
    },
  };

  // ===== SPRITE CACHE & RENDERER =====
  const spriteCache = new Map();

  function getSpriteKey(sprite, flip) {
    // Use pixel array reference as identity
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

  function drawSprite(ctx, sprite, x, y, flip) {
    if (!sprite) return;
    const cached = cacheSpriteCanvas(sprite, flip);
    ctx.drawImage(cached, 0, 0, sprite.w, sprite.h,
      Math.round(x), Math.round(y), sprite.w * SCALE, sprite.h * SCALE);
  }

  // ===== CAMERA =====
  const Camera = {
    x: 0, y: 0,
    vw: 0, vh: 0,
    smoothing: 0.08,
    lookX: 0,  // smoothed look-ahead offset

    init(cw, ch) {
      this.vw = cw / SCALE;
      this.vh = ch / SCALE;
    },

    followOne(p) {
      const targetLook = p.facingRight ? 30 : -30;
      this.lookX += (targetLook - this.lookX) * 0.04;
      this.tx = p.x + p.w / 2 - this.vw / 2 + this.lookX;
      this.ty = p.y + p.h / 2 - this.vh / 2 + 10;
    },

    followTwo(p1, p2) {
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      this.tx = mx - this.vw / 2;
      this.ty = my - this.vh / 2;
    },

    update(lw, lh) {
      if (this.tx == null) return;
      this.x += (this.tx - this.x) * this.smoothing;
      this.y += (this.ty - this.y) * this.smoothing;
      this.x = Math.max(0, Math.min(this.x, lw * TILE - this.vw));
      // Lock camera to bottom of level (typical platformer)
      const maxY = lh * TILE - this.vh;
      this.y = Math.max(0, Math.min(this.y, maxY));
    },

    worldToScreen(wx, wy) {
      return [(wx - this.x) * SCALE, (wy - this.y) * SCALE];
    },
  };

  // ===== PHYSICS =====
  const SOLID_TILES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15]);
  const ONE_WAY_TILES = new Set([9]);
  const HAZARD_TILES = new Set([11]);

  function isSolid(id) { return SOLID_TILES.has(id); }
  function isOneWay(id) { return ONE_WAY_TILES.has(id); }
  function isHazard(id) { return HAZARD_TILES.has(id); }

  function getTile(level, col, row) {
    if (row < 0 || row >= level.height || col < 0 || col >= level.width) return 0;
    return level.tiles[row][col];
  }

  function applyGravity(e) {
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
  }

  function moveAndCollide(entity, level, opts) {
    opts = opts || {};
    // Horizontal
    entity.x += entity.vx;
    resolveH(entity, level);

    // Vertical
    entity.y += entity.vy;
    resolveV(entity, level, opts);

    // Hazard check
    const cx = Math.floor((entity.x + entity.w / 2) / TILE);
    const cy = Math.floor((entity.y + entity.h - 1) / TILE);
    if (isHazard(getTile(level, cx, cy))) {
      entity.hitHazard = true;
    }
  }

  function resolveH(entity, level) {
    const top = Math.floor(entity.y / TILE);
    const bot = Math.floor((entity.y + entity.h - 1) / TILE);

    if (entity.vx > 0) {
      const col = Math.floor((entity.x + entity.w) / TILE);
      for (let r = top; r <= bot; r++) {
        if (isSolid(getTile(level, col, r))) {
          entity.x = col * TILE - entity.w;
          entity.vx = 0;
          entity.hitWall = true;
          return;
        }
      }
    } else if (entity.vx < 0) {
      const col = Math.floor(entity.x / TILE);
      for (let r = top; r <= bot; r++) {
        if (isSolid(getTile(level, col, r))) {
          entity.x = (col + 1) * TILE;
          entity.vx = 0;
          entity.hitWall = true;
          return;
        }
      }
    }
    entity.hitWall = false;
  }

  function resolveV(entity, level, opts) {
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);
    entity.hitCeiling = false;

    if (entity.vy > 0) {
      // Falling — check ground and one-way platforms
      const row = Math.floor((entity.y + entity.h) / TILE);
      for (let c = left; c <= right; c++) {
        const tid = getTile(level, c, row);
        if (isSolid(tid)) {
          entity.y = row * TILE - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          entity.groundTile = tid;
          return;
        }
        if (isOneWay(tid) && !opts.dropThrough) {
          // Only land if feet were above platform top last frame
          const platTop = row * TILE;
          if (entity.y + entity.h - entity.vy <= platTop + 2) {
            entity.y = platTop - entity.h;
            entity.vy = 0;
            entity.onGround = true;
            entity.groundTile = tid;
            return;
          }
        }
      }
      entity.onGround = false;
    } else if (entity.vy < 0) {
      // Rising — check ceiling
      const row = Math.floor(entity.y / TILE);
      for (let c = left; c <= right; c++) {
        const tid = getTile(level, c, row);
        if (isSolid(tid)) {
          entity.y = (row + 1) * TILE;
          entity.vy = 0;
          entity.hitCeiling = true;
          entity.ceilingTile = tid;
          entity.ceilingCol = c;
          entity.ceilingRow = row;
          return;
        }
      }
    }
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function stompCheck(a, b) {
    return a.vy > 0 &&
           a.y + a.h >= b.y &&
           a.y + a.h <= b.y + 10 &&
           a.x + a.w > b.x + 2 &&
           a.x < b.x + b.w - 2;
  }

  function isOnIce(entity, level) {
    const row = Math.floor((entity.y + entity.h + 1) / TILE);
    const col = Math.floor((entity.x + entity.w / 2) / TILE);
    return getTile(level, col, row) === 10;
  }

  // ===== TILE RENDERER =====
  function renderTiles(ctx, level, cam) {
    const sc = Math.floor(cam.x / TILE);
    const ec = Math.ceil((cam.x + cam.vw) / TILE) + 1;
    const sr = Math.max(0, Math.floor(cam.y / TILE));
    const er = Math.min(level.height, Math.ceil((cam.y + cam.vh) / TILE) + 1);

    for (let r = sr; r < er; r++) {
      for (let c = Math.max(0, sc); c < Math.min(level.width, ec); c++) {
        const tid = level.tiles[r][c];
        if (tid === 0) continue;
        const sprite = SPRITES.TILE_MAP[tid];
        if (!sprite) continue;
        const [sx, sy] = cam.worldToScreen(c * TILE, r * TILE);
        drawSprite(ctx, sprite, sx, sy, false);
      }
    }
  }

  // ===== BACKGROUND RENDERER =====
  function renderBg(ctx, level, cam, cw, ch) {
    // Sky color
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, cw, ch);

    // Parallax layers
    for (const layer of (level.bgLayers || [])) {
      drawBgLayer(ctx, layer, cam, cw, ch, level);
    }
  }

  function drawBgLayer(ctx, name, cam, cw, ch, level) {
    switch (name) {
      case 'hills': {
        const parallax = 0.2;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#4A8C3F';
        // Draw repeating hills
        for (let i = -1; i < cw / 200 + 2; i++) {
          const x = i * 200 + (offset % 200);
          const y = ch - 120;
          ctx.beginPath();
          ctx.moveTo(x, ch);
          ctx.quadraticCurveTo(x + 50, y - 60, x + 100, y);
          ctx.quadraticCurveTo(x + 150, y - 30, x + 200, ch);
          ctx.fill();
        }
        // Smaller hills
        ctx.fillStyle = '#5CA050';
        for (let i = -1; i < cw / 150 + 2; i++) {
          const x = i * 150 + 75 + (offset % 150);
          const y = ch - 90;
          ctx.beginPath();
          ctx.moveTo(x, ch);
          ctx.quadraticCurveTo(x + 30, y - 30, x + 75, y);
          ctx.quadraticCurveTo(x + 110, y - 15, x + 150, ch);
          ctx.fill();
        }
        break;
      }
      case 'bushes': {
        const parallax = 0.3;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#3C8018';
        for (let i = -1; i < cw / 120 + 2; i++) {
          const x = i * 120 + (offset % 120);
          const y = ch - 85;
          ctx.beginPath();
          ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
          ctx.arc(x + 50, y - 5, 18, 0, Math.PI * 2);
          ctx.arc(x + 70, y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'cave_ceiling': {
        ctx.fillStyle = '#2A1800';
        ctx.fillRect(0, 0, cw, 60);
        const parallax = 0.15;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#3D2200';
        for (let i = 0; i < cw / 40 + 2; i++) {
          const x = i * 40 + (offset % 40);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 20, 40 + Math.sin(i * 1.5) * 15);
          ctx.lineTo(x + 40, 0);
          ctx.fill();
        }
        break;
      }
      case 'stalactites': {
        const parallax = 0.25;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#4A3000';
        for (let i = 0; i < cw / 80 + 2; i++) {
          const x = i * 80 + 30 + (offset % 80);
          const len = 20 + Math.sin(i * 2.3) * 10;
          ctx.beginPath();
          ctx.moveTo(x - 8, 0);
          ctx.lineTo(x, len);
          ctx.lineTo(x + 8, 0);
          ctx.fill();
        }
        break;
      }
      case 'clouds_far': {
        const parallax = 0.1;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = -1; i < cw / 250 + 2; i++) {
          const x = i * 250 + (offset % 250);
          ctx.beginPath();
          ctx.arc(x + 30, 60, 20, 0, Math.PI * 2);
          ctx.arc(x + 55, 50, 28, 0, Math.PI * 2);
          ctx.arc(x + 80, 60, 20, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'clouds_near': {
        const parallax = 0.2;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = -1; i < cw / 300 + 2; i++) {
          const x = i * 300 + 100 + (offset % 300);
          ctx.beginPath();
          ctx.arc(x + 20, 100, 15, 0, Math.PI * 2);
          ctx.arc(x + 40, 90, 22, 0, Math.PI * 2);
          ctx.arc(x + 65, 95, 18, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'snowflakes': {
        const parallax = 0.15;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(200,220,255,0.3)';
        const time = Date.now() / 1000;
        for (let i = 0; i < 30; i++) {
          const x = ((i * 73 + offset) % cw + cw) % cw;
          const y = ((time * 20 + i * 47) % ch + ch) % ch;
          ctx.beginPath();
          ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'lava_glow': {
        // Lava glow at bottom
        const grd = ctx.createLinearGradient(0, ch - 80, 0, ch);
        grd.addColorStop(0, 'rgba(255,69,0,0)');
        grd.addColorStop(1, 'rgba(255,69,0,0.3)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, ch - 80, cw, 80);
        break;
      }
    }
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
    Camera.init(p.clientWidth, p.clientHeight);
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

  return {
    TILE, SCALE, GRAVITY, MAX_FALL, FRICTION, ICE_FRICTION,
    Input, Camera,
    drawSprite,
    renderTiles, renderBg,
    isSolid, isOneWay, isHazard, getTile,
    applyGravity, moveAndCollide, overlap, stompCheck, isOnIce,
    initCanvas, resize, startLoop, stopLoop,
    getCtx, getCanvas,
  };
})();
