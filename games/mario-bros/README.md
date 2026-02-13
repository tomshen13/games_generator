# Super Mario Bros - Developer Guide

A vanilla JavaScript platformer with procedural pixel art, 4 characters, 6 enemy types, 8 power-ups, a shop system, and 5 themed levels. No external dependencies or bundler required.

## Architecture

```
index.html                  Entry point, all screen markup
style.css                   Game UI styling
sprites.js    (1,333 lines) Procedural pixel art generation
levels.js       (290 lines) Tilemap definitions & entity spawns
engine.js       (513 lines) Game loop, input, physics, camera
entities.js   (1,015 lines) Player, enemies, items, power-ups
game.js         (938 lines) State machine, HUD, shop, collisions
```

Shared utilities (loaded from `../../shared/js/`):
- **audio.js** - Procedural sound effects via Web Audio API (no audio files)
- **particles.js** - Canvas-based particle effects (sparkle, confetti)
- **storage.js** - localStorage wrapper with Supabase cloud sync
- **utils.js** - General helpers (shuffle, randInt, DOM builder)
- **profile.js** - Multi-user profile management

### Design Patterns

- **IIFE modules** - Each system (`Engine`, `Entities`, `SPRITES`, `Game`, `LEVELS`) is a self-contained closure
- **Plain objects, not classes** - Entities are data objects; behavior lives in update/render functions
- **Factory functions** - `createGoomba(x, y)`, `createPlayer(charType, num, x, y)`, etc.
- **Fixed 60 FPS timestep** - Accumulator-based loop for deterministic physics
- **Sprite caching** - Procedural sprites rendered to off-screen canvases and reused

---

## Sprites (sprites.js)

All graphics are procedural pixel art. No image files exist.

### Core Functions

| Function | Purpose |
|----------|---------|
| `parse(w, h, template, palette)` | Convert ASCII art + color palette into pixel data |
| `flipH(sprite)` | Create horizontally flipped copy |
| `recolor(sprite, fromPal, toPal)` | Generate character/enemy color variants |

### Character Generation

All 4 characters share the same base sprites (Mario), recolored per-character:

```
Mario  → MARIO_PAL (red hat, blue overalls)
Luigi  → LUIGI_PAL (green hat) via recolor()
Toad   → TOAD_PAL (white cap, purple vest) via recolor()
Peach  → PEACH_PAL (pink dress, gold hair) via recolor()
```

### Animation Structure (ANIMS)

```js
ANIMS.mario = {
  idle: [frame],  run: [f1, f2, f3, f4],  jump: [frame],  shoot: [frame],
  bigIdle: [...], bigRun: [...], bigJump: [...]   // mushroom-sized variants
}
// Same structure for luigi, toad, peach, plus enemy anims
```

### Tile Map

`TILE_MAP` maps tile IDs to sprites for level rendering:

| ID | Char | Tile | Solid? |
|----|------|------|--------|
| 0 | `.` | Air | No |
| 1 | `G` | Ground (grass top) | Yes |
| 2 | `B` | Brick (breakable) | Yes |
| 3 | `?` | Question block (coin) | Yes |
| 4 | `Q` | Question block (power-up) | Yes |
| 5 | `P` | Pipe top | Yes |
| 7 | `p` | Pipe body | Yes |
| 9 | `-` | Platform | One-way |
| 10 | `I` | Ice (low friction) | Yes |
| 11 | `L` | Lava | Hazard |
| 12 | `C` | Castle stone | Yes |
| 14 | `F` | Flag (level end) | No |
| 15 | `g` | Sub-ground (no grass) | Yes |

---

## Engine (engine.js)

### Game Loop

Fixed timestep accumulator at 60 FPS:

```js
while (accum >= FIXED_DT) {
  updateFn();
  Input.consumePressed();
  accum -= FIXED_DT;
}
renderFn(ctx, cw, ch);
```

### Physics Constants

```js
TILE   = 16      // Pixels per tile
SCALE  = 3       // Render scale (world pixels × 3)
GRAVITY = 0.55   // Per-frame downward acceleration
MAX_FALL = 10    // Terminal velocity
FRICTION = 0.85  // Ground deceleration
ICE_FRICTION = 0.98
```

### Input Bindings

| Action | Single Player | Co-op P1 | Co-op P2 |
|--------|--------------|----------|----------|
| Move | Arrows / WASD | WASD | Arrows |
| Jump | Space | Space / W | Enter / Up |
| Shoot | X | E | RightShift |
| Skill | Q | Q | / |

Key methods: `Input.left(pn, coop)`, `Input.jumpPressed(pn, coop)`, `Input.shootPressed(pn, coop)`, `Input.skillPressed(pn, coop)`

### Collision

- **AABB overlap**: `overlap(a, b)` - standard bounding box intersection
- **Stomp check**: `stompCheck(a, b)` - player falling onto enemy top within 10px
- **Tile collision**: `moveAndCollide(entity, level)` - separate horizontal/vertical resolution
- **Tile queries**: `isSolid(id)`, `isOneWay(id)`, `isHazard(id)`

### Camera

Smooth follow with look-ahead. `followOne(player)` centers on player with 30px look-ahead in facing direction. `followTwo(p1, p2)` centers on midpoint (co-op). Applies 8% smoothing interpolation per frame and clamps to level bounds.

---

## Entities (entities.js)

### Characters

| Character | Speed | Jump | Special | Skill (Q key) |
|-----------|-------|------|---------|----------------|
| Mario | 2.8 | -9.0 | Balanced | Ground Pound (slam down, 3s CD) |
| Luigi | 2.2 | -10.5 | Highest jump | Super Jump (1.5x force, 4s CD) |
| Toad | 3.5 | -7.5 | Fastest runner | Dash (invincible burst, 3s CD) |
| Peach | 2.5 | -8.5 | Float while falling | Heal (shield or invincibility, 10s CD) |

Peach's float: hold jump while falling to cap `vy` at 0.5 for up to 90 frames. Resets on ground.

### Power Stack System

Powers are stored as an array (`player.powerStack`). When hit, the most recently acquired power is popped.

```js
hasPower(player, type)     // Check if power is in stack
getShootPower(player)      // Get topmost ice/fire for projectile type
applyPowerUp(player, type) // Push to stack, apply effect
removePower(player, type)  // Splice from stack, deactivate effect
```

| Power | Effect | Duration |
|-------|--------|----------|
| mushroom | Grow big (32px tall, extra hit buffer) | Until lost |
| fire | Shoot fire projectiles (bounce on ground) | Until lost |
| ice | Shoot ice projectiles (travel straight) | Until lost |
| wings | Double jump in mid-air | Until lost |
| shield | Blue bubble, absorbs one hit | Until lost |
| magnet | Pull coins within 96px toward player | Until lost |
| star | Invincibility + rainbow tint | 600 frames (~10s) |
| speed | 2x movement speed + yellow tint | 480 frames (~8s) |

### Enemies

| Type | Behavior | Stompable | Score |
|------|----------|-----------|-------|
| **Goomba** | Walk, bounce off walls, turn at ledges | Yes - dies | 100 |
| **Koopa Fly** | Sine-wave flight patrol | Yes - dies | 200 |
| **Piranha** | Pipe cycle: hidden→rising→exposed→sinking (120/30/120/30 frames) | No | 200 |
| **Boo** | Chases when player looks away, freezes when watched | No | 300 |
| **Beetle** | Walk → stomp to shell → kick to slide (defeats other enemies) | Yes - shell | 100 |
| **Bob-omb** | Walk → stomp lights fuse (180f) → explodes (48px radius) | Yes - fuse | 100 |

### Other Entities

- **Coins**: +50 score, +1 coin counter. Spawn from `?` blocks or placed in levels.
- **Gems**: +500 score. 3 per level; collecting all 3 = extra life.
- **Power-ups**: Emerge from `Q` blocks. Move with gravity.
- **Projectiles**: Fire bounces 3 times; ice travels straight. 120 frame lifetime.
- **Flag**: 16x48 sprite at level end. Triggers level complete on overlap.

---

## Game (game.js)

### Screen Flow

```
Title → Character Select → Playing → Level Complete → Shop → Playing → ... → Victory
                                   → Game Over → Retry (same level)
```

### Persistent State

Between levels, coins/score/lives carry over. Purchased powers are **permanent unlocks** - they re-apply every level start even if lost to damage during gameplay.

```js
persistent = { coins, score, lives, powerStack }
```

- **New game**: Reset all to defaults
- **Level complete**: Save coins/score/lives (powerStack unchanged - only shop modifies it)
- **Retry**: Reset lives to 3, clear coins, keep purchased powers
- **Continue**: Load from localStorage

### Shop (Between Levels)

Appears after level complete (single player only). Powers are one-time purchases:

| Item | Price | Effect |
|------|-------|--------|
| Mushroom | 10 | Start big every level |
| Fire Power | 15 | Shoot fireballs |
| Ice Power | 15 | Shoot ice balls |
| Wings | 20 | Double jump always |
| Shield | 20 | Extra hit protection |
| Magnet | 15 | Attract nearby coins |
| Extra Life | 25 | +1 life (repeatable) |

### Tile Mutation Safety

`startLevel()` deep-clones the tile array from stored originals so that `?` block hits, brick breaks, and flag markers reset properly on retry:

```js
if (!level._originalTiles) level._originalTiles = level.tiles.map(row => [...row]);
level.tiles = level._originalTiles.map(row => [...row]);
```

---

## Levels (levels.js)

5 levels defined as ASCII tilemaps (14 rows tall, variable width). Parsed once by `parseMap()` into `{ tiles: number[][], width, height }`.

| # | Name | Theme | BG | Power | Key Enemies |
|---|------|-------|-----|-------|-------------|
| 1 | Green Hills | Grassy plains | Hills + bushes | Ice | Goomba, Piranha, Bob-omb |
| 2 | Underground Cave | Dark cave, ceiling | Cave ceiling | Fire | Goomba, Beetle, Boo, Piranha |
| 3 | Sky World | Floating platforms | Clouds | Magnet | Koopa Fly, Bob-omb, Boo |
| 4 | Ice Castle | Slippery ice floors | Snowflakes | Star | All types |
| 5 | Bowser's Fortress | Lava pits, castle | Lava glow | Shield | All types |

Entity spawns are defined per-level as `{ type, x, y }` in tile coordinates.

---

## Audio (shared/js/audio.js)

All sounds are procedurally generated via Web Audio API oscillators. No audio files.

| SFX | Description |
|-----|-------------|
| `jump()` | Square wave sweep 250-600Hz |
| `coin()` | Melodic chime B5-E6 |
| `stomp()` | Low square 150Hz |
| `powerup()` | Ascending 5-note arpeggio |
| `hurt()` | Descending 400-100Hz |
| `die()` | 4-note descending melody |
| `shoot()` | Triangle sweep 800-200Hz |
| `fanfare()` | 5-note celebration |

---

## How to Extend

### Add a New Enemy

1. **sprites.js**: Define palette + sprite frames, add to `ANIMS.newtype`
2. **entities.js**: Add `createNewEnemy(x, y)` factory, add update/render branches for the type
3. **game.js**: Add spawn case in `startLevel()`, add collision handling if special behavior needed
4. **levels.js**: Place in level entity lists: `{ type: 'newenemy', x: 50, y: 11 }`

### Add a New Power-Up

1. **sprites.js**: Define `POWERUP_NEW = parse(...)`, export it
2. **entities.js**: Add case in `applyPowerUp()` and `removePower()`, add sprite to `renderPowerUp`
3. **game.js**: Add icon to `powerIcons`, optionally add to `SHOP_DATA`

### Add a New Level

1. **levels.js**: Create ASCII tilemap with `parseMap()`, define entity spawns
2. Add to `LEVELS` array via `buildLevel(map, { id, name, powerUp, bgColor, bgLayers, entities })`

### Modify Physics

Edit constants in engine.js: `GRAVITY`, `FRICTION`, `ICE_FRICTION`, `MAX_FALL`. Character-specific tweaks go in `CHAR_STATS` in entities.js.

---

## Running Locally

Serve the project root with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000/games/mario-bros/` (port may vary).
