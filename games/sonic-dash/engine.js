/**
 * Game Engine — Sonic-tuned: slope physics, ground-speed, fast camera, sub-step collision.
 */
const Engine = (() => {
  const TILE = 16;
  const SCALE = 3;
  const GRAVITY = 0.21875;
  const MAX_FALL = 16;
  const FRICTION = 0.046875;
  const ICE_FRICTION = 0.01;

  // Sonic physics constants
  const SONIC = {
    ACCEL: 0.046875,
    DECEL: 0.5,
    FRICTION: 0.046875,
    TOP_SPEED: 6.0,
    AIR_ACCEL: 0.09375,
    AIR_DRAG_THRESH: -4.0,
    AIR_DRAG: 0.96875,
    JUMP_FORCE: -6.5,
    JUMP_SHORT: -4.0,
    ROLL_FRICTION: 0.0234375,
    ROLL_DECEL: 0.125,
    ROLL_MIN_SPEED: 1.03125,
    SLOPE_NORMAL: 0.125,
    SLOPE_ROLL_UP: 0.078125,
    SLOPE_ROLL_DOWN: 0.3125,
    SPIN_DASH_BASE: 8.0,
    SPIN_DASH_CHARGE: 2.0,
    SPIN_DASH_MAX: 12.0,
  };

  // ===== INPUT =====
  const _keys = {};
  const _pressed = {};
  const _PREVENT = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','KeyX','KeyE','KeyQ']);

  const _P1 = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', jump2: 'KeyW', shoot: 'KeyE', skill: 'KeyQ' };
  const _P2 = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Enter', jump2: 'ArrowUp', shoot: 'ShiftRight', skill: 'Slash' };
  const _SP = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Space', jump2: 'ArrowUp', shoot: 'KeyX', skill: 'KeyQ' };

  function _isDown(c) { return !!_keys[c]; }
  function _justPressed(c) { return !!_pressed[c]; }
  function _consumePressed() { for (const k in _pressed) delete _pressed[k]; }

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
      return _isDown(pn === 1 ? _P1.left : _P2.left);
    },
    right(pn, coop) {
      if (!coop) return _isDown(_SP.right) || _isDown(_P1.right);
      return _isDown(pn === 1 ? _P1.right : _P2.right);
    },
    up(pn, coop) {
      if (!coop) return _isDown(_SP.up) || _isDown(_P1.up);
      return _isDown(pn === 1 ? _P1.up : _P2.up);
    },
    down(pn, coop) {
      if (!coop) return _isDown(_SP.down) || _isDown(_P1.down);
      return _isDown(pn === 1 ? _P1.down : _P2.down);
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
      return _justPressed(pn === 1 ? _P1.shoot : _P2.shoot);
    },
    skillPressed(pn, coop) {
      if (!coop) return _justPressed(_SP.skill) || _justPressed(_P1.skill);
      return _justPressed(pn === 1 ? _P1.skill : _P2.skill);
    },
    downPressed(pn, coop) {
      if (!coop) return _justPressed(_SP.down) || _justPressed(_P1.down);
      return _justPressed(pn === 1 ? _P1.down : _P2.down);
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
          cx.fillRect(flip ? (w - 1 - x) : x, y, 1, 1);
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

  // ===== CAMERA (Sonic-tuned: faster, speed-proportional look-ahead) =====
  const Camera = {
    x: 0, y: 0,
    vw: 0, vh: 0,
    tx: 0, ty: 0,
    smoothing: 0.12,
    lookX: 0,
    vertDeadZone: 32,

    init(cw, ch) {
      this.vw = cw / SCALE;
      this.vh = ch / SCALE;
    },

    followOne(p) {
      // Horizontal: speed-proportional look-ahead
      const speedFactor = Math.min(Math.abs(p.vx || 0) / 6, 1);
      const lookAhead = 60 + speedFactor * 4 * TILE;
      const targetLook = p.facingRight ? lookAhead : -lookAhead;
      this.lookX += (targetLook - this.lookX) * 0.06;
      this.tx = p.x + p.w / 2 - this.vw / 2 + this.lookX;

      // Vertical: dead zone to avoid jitter on bumps
      const targetY = p.y + p.h / 2 - this.vh / 2;
      if (Math.abs(targetY - this.ty) > this.vertDeadZone) {
        this.ty += (targetY - this.ty) * 0.06;
      }
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
      this.y = Math.max(0, Math.min(this.y, lh * TILE - this.vh));
    },

    worldToScreen(wx, wy) {
      return [(wx - this.x) * SCALE, (wy - this.y) * SCALE];
    },

    snapTo(x, y) {
      this.x = this.tx = x;
      this.y = this.ty = y;
    },
  };

  // ===== TILE TYPES =====
  const SOLID_TILES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15]);
  const ONE_WAY_TILES = new Set([9]);
  const HAZARD_TILES = new Set([11, 14]); // spikes, toxic
  const SLOPE_TILES = new Set([20, 21, 22, 23, 24, 25]);
  const CONVEYOR_R_TILES = new Set([13]);
  const CONVEYOR_L_TILES = new Set([16]);
  const ELECTRIC_TILES = new Set([15]); // timed on/off

  function isSolid(id) { return SOLID_TILES.has(id); }
  function isOneWay(id) { return ONE_WAY_TILES.has(id); }
  function isHazard(id) { return HAZARD_TILES.has(id); }
  function isSlope(id) { return SLOPE_TILES.has(id); }
  function isConveyor(id) { return CONVEYOR_R_TILES.has(id) || CONVEYOR_L_TILES.has(id); }

  function getTile(level, col, row) {
    if (row < 0 || row >= level.height || col < 0 || col >= level.width) return 0;
    return level.tiles[row][col];
  }

  // ===== SLOPE HELPERS =====
  // Returns the ground height (y position of surface) at a given world-x within a slope tile.
  // Tile (col, row) with given slope type. Returns absolute world Y of surface.
  function getSlopeHeight(tileId, col, row, worldX) {
    const tileLeft = col * TILE;
    const tileTop = row * TILE;
    const localX = Math.max(0, Math.min(TILE - 1, worldX - tileLeft));
    const t = localX / (TILE - 1); // 0..1

    switch (tileId) {
      case 20: // 45° up-right: rises from bottom-left to top-right
        return tileTop + TILE - 1 - Math.floor(t * (TILE - 1));
      case 21: // 45° down-right: falls from top-left to bottom-right
        return tileTop + Math.floor(t * (TILE - 1));
      case 22: // 22.5° up-right (left half): gentle rise
        return tileTop + TILE - 1 - Math.floor(t * (TILE / 2 - 1));
      case 23: // 22.5° up-right (right half): steeper part
        return tileTop + TILE / 2 - Math.floor(t * (TILE / 2));
      case 24: // 22.5° down-right (left half)
        return tileTop + Math.floor(t * (TILE / 2 - 1));
      case 25: // 22.5° down-right (right half)
        return tileTop + TILE / 2 + Math.floor(t * (TILE / 2));
      default:
        return tileTop;
    }
  }

  function getSlopeAngle(tileId) {
    switch (tileId) {
      case 20: return Math.PI / 4;      // 45° up
      case 21: return -Math.PI / 4;     // 45° down
      case 22: case 23: return Math.PI / 8;  // 22.5° up
      case 24: case 25: return -Math.PI / 8; // 22.5° down
      default: return 0;
    }
  }

  // ===== PHYSICS =====
  function applyGravity(e) {
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
    // Apply twice per frame for Sonic-accurate gravity
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
  }

  // Sub-step collision for high speeds (prevents tunneling)
  function moveAndCollide(entity, level, opts) {
    opts = opts || {};
    const speed = Math.max(Math.abs(entity.vx), Math.abs(entity.vy));
    const steps = speed > 8 ? Math.ceil(speed / 8) : 1;
    const svx = entity.vx / steps;
    const svy = entity.vy / steps;

    entity.hitWall = false;
    entity.hitCeiling = false;
    entity.hitHazard = false;

    for (let i = 0; i < steps; i++) {
      // Horizontal
      entity.x += svx;
      resolveH(entity, level);

      // Vertical
      entity.y += svy;
      resolveV(entity, level, opts);

      // Slope detection
      resolveSlopes(entity, level);

      // Hazard check
      const cx = Math.floor((entity.x + entity.w / 2) / TILE);
      const cy = Math.floor((entity.y + entity.h - 1) / TILE);
      if (isHazard(getTile(level, cx, cy))) {
        entity.hitHazard = true;
      }
    }

    // Conveyor belt push
    const cx = Math.floor((entity.x + entity.w / 2) / TILE);
    const cy = Math.floor((entity.y + entity.h + 1) / TILE);
    const belowTile = getTile(level, cx, cy);
    if (CONVEYOR_R_TILES.has(belowTile)) entity.x += 1.5;
    if (CONVEYOR_L_TILES.has(belowTile)) entity.x -= 1.5;
  }

  function resolveH(entity, level) {
    const top = Math.floor(entity.y / TILE);
    const bot = Math.floor((entity.y + entity.h - 1) / TILE);

    if (entity.vx > 0) {
      const col = Math.floor((entity.x + entity.w) / TILE);
      for (let r = top; r <= bot; r++) {
        const tid = getTile(level, col, r);
        if (isSolid(tid)) {
          entity.x = col * TILE - entity.w;
          entity.vx = 0;
          entity.hitWall = true;
          return;
        }
      }
    } else if (entity.vx < 0) {
      const col = Math.floor(entity.x / TILE);
      for (let r = top; r <= bot; r++) {
        const tid = getTile(level, col, r);
        if (isSolid(tid)) {
          entity.x = (col + 1) * TILE;
          entity.vx = 0;
          entity.hitWall = true;
          return;
        }
      }
    }
  }

  function resolveV(entity, level, opts) {
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);

    if (entity.vy > 0) {
      const row = Math.floor((entity.y + entity.h) / TILE);
      for (let c = left; c <= right; c++) {
        const tid = getTile(level, c, row);
        if (isSolid(tid)) {
          entity.y = row * TILE - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          entity.groundTile = tid;
          entity.groundAngle = 0;
          return;
        }
        if (isOneWay(tid) && !opts.dropThrough) {
          const platTop = row * TILE;
          if (entity.y + entity.h - entity.vy <= platTop + 2) {
            entity.y = platTop - entity.h;
            entity.vy = 0;
            entity.onGround = true;
            entity.groundTile = tid;
            entity.groundAngle = 0;
            return;
          }
        }
      }
      entity.onGround = false;
    } else if (entity.vy < 0) {
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

  // Slope resolution: align entity to slope surface
  function resolveSlopes(entity, level) {
    const centerX = entity.x + entity.w / 2;
    const feetRow = Math.floor((entity.y + entity.h + 2) / TILE);
    const feetCol = Math.floor(centerX / TILE);
    const tid = getTile(level, feetCol, feetRow);

    if (isSlope(tid)) {
      const surfaceY = getSlopeHeight(tid, feetCol, feetRow, centerX);
      if (entity.y + entity.h >= surfaceY && entity.vy >= 0) {
        entity.y = surfaceY - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        entity.groundAngle = getSlopeAngle(tid);
        entity.groundTile = tid;
      }
    }
    // Also check current row (for when walking along a slope)
    const curRow = Math.floor((entity.y + entity.h) / TILE);
    const curTid = getTile(level, feetCol, curRow);
    if (isSlope(curTid)) {
      const surfaceY = getSlopeHeight(curTid, feetCol, curRow, centerX);
      if (entity.y + entity.h >= surfaceY - 2 && entity.vy >= 0) {
        entity.y = surfaceY - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        entity.groundAngle = getSlopeAngle(curTid);
        entity.groundTile = curTid;
      }
    }
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spinAttackCheck(player, enemy) {
    // Sonic can damage from any direction while spinning (jumping/rolling/spin-dashing)
    return player.spinning && overlap(player, enemy);
  }

  function stompCheck(a, b) {
    return a.vy > 0 &&
           a.y + a.h >= b.y &&
           a.y + a.h <= b.y + 12 &&
           a.x + a.w > b.x + 2 &&
           a.x < b.x + b.w - 2;
  }

  function isOnIce(entity, level) {
    const row = Math.floor((entity.y + entity.h + 1) / TILE);
    const col = Math.floor((entity.x + entity.w / 2) / TILE);
    return getTile(level, col, row) === 2 && level.zone === 'ice_cap';
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
        const sprite = SPRITES.getTileSprite(tid);
        if (!sprite) continue;
        const [sx, sy] = cam.worldToScreen(c * TILE, r * TILE);
        drawSprite(ctx, sprite, sx, sy, false);
      }
    }
  }

  // ===== BACKGROUND RENDERER (Zone-specific) =====
  function renderBg(ctx, level, cam, cw, ch) {
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, cw, ch);

    for (const layer of (level.bgLayers || [])) {
      drawBgLayer(ctx, layer, cam, cw, ch, level);
    }
  }

  function drawBgLayer(ctx, name, cam, cw, ch, level) {
    switch (name) {
      case 'checker_hills': {
        // Sonic signature: rolling hills with checkerboard pattern
        const parallax = 0.15;
        const offset = -cam.x * parallax * SCALE;
        const baseY = ch - 160;
        // Far hills
        ctx.fillStyle = '#2E7D32';
        for (let i = -1; i < cw / 180 + 2; i++) {
          const x = i * 180 + (offset % 180);
          ctx.beginPath();
          ctx.moveTo(x, ch);
          ctx.quadraticCurveTo(x + 45, baseY - 80, x + 90, baseY);
          ctx.quadraticCurveTo(x + 135, baseY - 40, x + 180, ch);
          ctx.fill();
        }
        // Near hills with checker pattern
        const p2 = 0.25;
        const off2 = -cam.x * p2 * SCALE;
        const colors = ['#4CAF50', '#81C784'];
        const checkSize = 8;
        ctx.save();
        // Draw hill shape as clip
        ctx.beginPath();
        for (let i = -1; i < cw / 200 + 2; i++) {
          const x = i * 200 + (off2 % 200);
          const y2 = ch - 100;
          ctx.moveTo(x, ch);
          ctx.quadraticCurveTo(x + 50, y2 - 60, x + 100, y2);
          ctx.quadraticCurveTo(x + 150, y2 - 30, x + 200, ch);
        }
        ctx.clip();
        // Draw checkerboard
        for (let y = 0; y < ch; y += checkSize) {
          for (let x = -checkSize; x < cw + checkSize; x += checkSize) {
            const cx2 = Math.floor((x - off2) / checkSize);
            const cy2 = Math.floor(y / checkSize);
            ctx.fillStyle = (cx2 + cy2) % 2 === 0 ? colors[0] : colors[1];
            ctx.fillRect(x + (off2 % checkSize), y, checkSize, checkSize);
          }
        }
        ctx.restore();
        break;
      }
      case 'palm_trees': {
        const parallax = 0.35;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#5D4037';
        for (let i = -1; i < cw / 250 + 2; i++) {
          const x = i * 250 + 60 + (offset % 250);
          const y = ch - 160;
          // Trunk
          ctx.fillRect(x - 3, y, 6, 80);
          // Leaves
          ctx.fillStyle = '#2E7D32';
          for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
              x + Math.cos(angle) * 30, y + Math.sin(angle) * 20 - 10,
              x + Math.cos(angle) * 50, y + Math.sin(angle) * 30
            );
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#2E7D32';
            ctx.stroke();
          }
          ctx.fillStyle = '#5D4037';
        }
        break;
      }
      case 'clouds_far': {
        const parallax = 0.05;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = -1; i < cw / 300 + 2; i++) {
          const x = i * 300 + (offset % 300);
          ctx.beginPath();
          ctx.arc(x + 40, 50, 22, 0, Math.PI * 2);
          ctx.arc(x + 70, 40, 30, 0, Math.PI * 2);
          ctx.arc(x + 100, 50, 22, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'clouds_near': {
        const parallax = 0.15;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = -1; i < cw / 350 + 2; i++) {
          const x = i * 350 + 150 + (offset % 350);
          ctx.beginPath();
          ctx.arc(x + 20, 90, 16, 0, Math.PI * 2);
          ctx.arc(x + 45, 80, 24, 0, Math.PI * 2);
          ctx.arc(x + 70, 85, 20, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'factory_bg': {
        // Chemical plant: dark factory silhouettes
        const parallax = 0.1;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#2A0040';
        for (let i = -1; i < cw / 200 + 2; i++) {
          const x = i * 200 + (offset % 200);
          const h2 = 60 + (i % 3) * 30;
          ctx.fillRect(x, ch - h2 - 40, 40, h2 + 40);
          ctx.fillRect(x + 60, ch - h2 - 20, 30, h2 + 20);
          ctx.fillRect(x + 110, ch - h2 - 60, 50, h2 + 60);
          // Smoke stacks
          ctx.fillRect(x + 15, ch - h2 - 65, 8, 25);
          ctx.fillRect(x + 125, ch - h2 - 85, 8, 25);
        }
        // Neon pipes
        ctx.strokeStyle = '#E040FB';
        ctx.lineWidth = 2;
        const pOff = -cam.x * 0.2 * SCALE;
        for (let i = 0; i < 5; i++) {
          const x = (i * 160 + (pOff % 160) + cw) % cw;
          ctx.beginPath();
          ctx.moveTo(x, ch);
          ctx.lineTo(x, ch - 100 - i * 20);
          ctx.lineTo(x + 80, ch - 100 - i * 20);
          ctx.stroke();
        }
        break;
      }
      case 'ruins': {
        const parallax = 0.12;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#A1887F';
        for (let i = -1; i < cw / 250 + 2; i++) {
          const x = i * 250 + (offset % 250);
          // Column
          ctx.fillRect(x + 20, ch - 180, 20, 120);
          ctx.fillRect(x + 10, ch - 185, 40, 10);
          ctx.fillRect(x + 10, ch - 60, 40, 10);
          // Broken column
          ctx.fillRect(x + 140, ch - 100, 20, 50);
          ctx.fillRect(x + 130, ch - 105, 40, 10);
        }
        // Vines
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        for (let i = -1; i < cw / 250 + 2; i++) {
          const x = i * 250 + (offset % 250);
          ctx.beginPath();
          ctx.moveTo(x + 30, ch - 185);
          ctx.bezierCurveTo(x + 35, ch - 160, x + 20, ch - 140, x + 40, ch - 120);
          ctx.stroke();
        }
        break;
      }
      case 'snow_peaks': {
        const parallax = 0.08;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = '#B3E5FC';
        for (let i = -1; i < cw / 200 + 2; i++) {
          const x = i * 200 + (offset % 200);
          ctx.beginPath();
          ctx.moveTo(x, ch);
          ctx.lineTo(x + 60, ch - 200);
          ctx.lineTo(x + 80, ch - 180);
          ctx.lineTo(x + 120, ch - 220);
          ctx.lineTo(x + 200, ch);
          ctx.fill();
        }
        // Snow caps
        ctx.fillStyle = '#FFFFFF';
        for (let i = -1; i < cw / 200 + 2; i++) {
          const x = i * 200 + (offset % 200);
          ctx.beginPath();
          ctx.moveTo(x + 50, ch - 185);
          ctx.lineTo(x + 60, ch - 200);
          ctx.lineTo(x + 70, ch - 188);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x + 110, ch - 205);
          ctx.lineTo(x + 120, ch - 220);
          ctx.lineTo(x + 130, ch - 208);
          ctx.fill();
        }
        break;
      }
      case 'aurora': {
        // Northern lights effect
        const time = Date.now() / 3000;
        const grd = ctx.createLinearGradient(0, 0, cw, 0);
        grd.addColorStop(0, `hsla(${(time * 60) % 360}, 80%, 50%, 0.15)`);
        grd.addColorStop(0.3, `hsla(${(time * 60 + 60) % 360}, 80%, 50%, 0.2)`);
        grd.addColorStop(0.6, `hsla(${(time * 60 + 120) % 360}, 80%, 50%, 0.15)`);
        grd.addColorStop(1, `hsla(${(time * 60 + 180) % 360}, 80%, 50%, 0.1)`);
        ctx.fillStyle = grd;
        // Wavy aurora shape
        ctx.beginPath();
        ctx.moveTo(0, 30);
        for (let x = 0; x <= cw; x += 5) {
          ctx.lineTo(x, 30 + Math.sin(x / 80 + time) * 20 + Math.sin(x / 40 + time * 1.5) * 10);
        }
        for (let x = cw; x >= 0; x -= 5) {
          ctx.lineTo(x, 70 + Math.sin(x / 60 + time * 0.8) * 15);
        }
        ctx.fill();
        break;
      }
      case 'snowflakes': {
        const parallax = 0.15;
        const offset = -cam.x * parallax * SCALE;
        ctx.fillStyle = 'rgba(200,220,255,0.4)';
        const time = Date.now() / 1000;
        for (let i = 0; i < 40; i++) {
          const x = ((i * 73 + offset) % cw + cw) % cw;
          const y = ((time * 25 + i * 47) % ch + ch) % ch;
          ctx.beginPath();
          ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'gears': {
        // Scrap Brain rotating gears
        const parallax = 0.2;
        const offset = -cam.x * parallax * SCALE;
        const time = Date.now() / 2000;
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
          const x = (i * 200 + (offset % 200) + cw) % cw;
          const y = ch - 100 - i * 30;
          const r = 30 + i * 10;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(time * (i % 2 === 0 ? 1 : -1));
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          // Teeth
          for (let t = 0; t < 8; t++) {
            const a = (t / 8) * Math.PI * 2;
            ctx.fillStyle = '#424242';
            ctx.fillRect(
              Math.cos(a) * r - 4, Math.sin(a) * r - 4, 8, 8
            );
          }
          ctx.restore();
        }
        break;
      }
      case 'sparks': {
        const time = Date.now() / 100;
        ctx.fillStyle = '#FF6D00';
        for (let i = 0; i < 8; i++) {
          const x = (i * 137 + time * 2) % cw;
          const y = ch - 20 - Math.abs(Math.sin(time / 10 + i * 0.7)) * 60;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'flowers': {
        const parallax = 0.35;
        const offset = -cam.x * parallax * SCALE;
        const colors = ['#FF4081', '#FFD740', '#E040FB', '#FF6D00'];
        for (let i = 0; i < 20; i++) {
          const x = ((i * 67 + offset) % cw + cw) % cw;
          const y = ch - 20 - (i % 5) * 3;
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x - 1, y, 2, 8);
        }
        break;
      }
    }
  }

  // Draw speed lines (overlay when moving fast)
  function renderSpeedLines(ctx, cw, ch, speed) {
    if (speed < 4) return;
    const intensity = Math.min((speed - 4) / 8, 1);
    ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.3})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.floor(intensity * 12); i++) {
      const y = (i * 37 + Date.now() / 10) % ch;
      const len = 20 + intensity * 40;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(len, y);
      ctx.stroke();
    }
  }

  // ===== GAME LOOP =====
  let canvas, ctx2;
  let lastTime = 0;
  const FIXED_DT = 1000 / 60;
  let accum = 0;
  let running = false;

  function initCanvas(el) {
    canvas = el;
    ctx2 = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    const p = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = p.clientWidth * dpr;
    canvas.height = p.clientHeight * dpr;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2.imageSmoothingEnabled = false;
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
      ctx2.clearRect(0, 0, cw, ch);
      renderFn(ctx2, cw, ch);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function stopLoop() { running = false; }
  function getCtx() { return ctx2; }
  function getCanvas() { return canvas; }

  return {
    TILE, SCALE, GRAVITY, MAX_FALL, FRICTION, ICE_FRICTION, SONIC,
    Input, Camera,
    drawSprite, renderSpeedLines,
    renderTiles, renderBg,
    isSolid, isOneWay, isHazard, isSlope, isConveyor, getTile,
    getSlopeHeight, getSlopeAngle,
    applyGravity, moveAndCollide, overlap, spinAttackCheck, stompCheck, isOnIce,
    initCanvas, resize, startLoop, stopLoop,
    getCtx, getCanvas,
  };
})();
