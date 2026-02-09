# Mario Adventure - Ice Platform Game

A side-scrolling platform game built with HTML5 Canvas for kids ages 5+. Play as Mario or Luigi, shoot ice to freeze enemies, collect coins, and conquer 5 themed worlds!

## How to Run

Open the game in any modern browser:

```bash
# From the project root, open the launcher:
open index.html
# Then click "Mario Adventure"

# Or open the game directly:
open games/mario-adventure/index.html
```

To serve locally (recommended to avoid CORS issues with some browsers):

```bash
# Python 3
python3 -m http.server 8000
# Then visit http://localhost:8000/games/mario-adventure/

# Node.js (npx)
npx serve .
```

No build step, no dependencies — just static HTML/CSS/JS.

## Controls

### Keyboard
| Action       | Keys                          |
|-------------|-------------------------------|
| Move left   | `←` Arrow or `A`              |
| Move right  | `→` Arrow or `D`              |
| Jump        | `Space`, `↑` Arrow, or `W`   |
| Shoot ice   | `X`, `Z`, or `Shift`         |
| Pause       | `Escape` or `P`              |

### Touch (Mobile)
On-screen buttons appear automatically on touch devices:
- **Left / Right** arrows for movement
- **▲ button** (red) for jump
- **❄ button** (blue) for ice

## Game Flow

```
Title Screen → Character Select → Level Select → Gameplay → Level Complete
                                       ↑                         ↓
                                       └─────────────────────────┘
```

1. **Title Screen** — Press PLAY to start
2. **Character Select** — Choose Mario (balanced) or Luigi (higher jump)
3. **Level Select** — Pick any unlocked level. Stars show your best rating
4. **Gameplay** — Run, jump, freeze enemies, collect coins, reach the flag
5. **Level Complete** — See your star rating, coins, and score. Advance to next level

## Levels

| # | Name              | Theme             | Power-Up         | Description                      |
|---|-------------------|-------------------|------------------|----------------------------------|
| 1 | Green Hills       | Grassland         | Speed Mushroom   | Learn the basics — run and jump! |
| 2 | Underground Cave  | Dark cave         | Spring Boots     | Tricky vertical platforming      |
| 3 | Cloud Kingdom     | Sky / clouds      | Star Shield      | Don't fall — platforms only!     |
| 4 | Frozen Peaks      | Ice / snow        | Ice Storm        | Rapid-fire piercing ice shots    |
| 5 | Bowser's Castle   | Lava fortress     | Mega Mushroom    | The final challenge!             |

## Power-Ups

Each level contains a `!` question block that releases a unique power-up. Power-ups last **15 seconds** (except Shield which lasts until hit).

| Power-Up        | Effect                                                  |
|-----------------|---------------------------------------------------------|
| Speed Mushroom  | Run 60% faster                                          |
| Spring Boots    | Jump 35% higher                                         |
| Star Shield     | Absorbs one enemy hit, then disappears                  |
| Ice Storm       | Ice shoots faster, travels further, pierces through enemies |
| Mega Mushroom   | Become giant — destroy bricks and enemies on contact    |

## Star Rating

Each level awards up to 3 stars:

| Stars | Requirement                                   |
|-------|-----------------------------------------------|
| ★☆☆   | Complete the level (reach the flag)            |
| ★★☆   | Complete + collect all coins                   |
| ★★★   | Complete + collect all coins + defeat all enemies |

Progress is saved automatically to `localStorage`.

## Enemies

| Enemy  | Behavior                                                |
|--------|---------------------------------------------------------|
| Goomba | Walks back and forth. Jump on to squish, or freeze with ice. |
| Koopa  | Faster walker. Same defeat methods.                     |

- **Stomping** (jumping on top): Defeats the enemy instantly
- **Ice projectile**: Freezes the enemy for 5 seconds. Frozen enemies can be stomped for bonus points
- **Giant mode**: Walking into enemies defeats them on contact

## Architecture

```
games/mario-adventure/
├── index.html   — HTML shell: canvas, screen overlays, touch controls
├── style.css    — All UI styling: menus, HUD, touch buttons, responsive
├── levels.js    — 5 level definitions: tile maps, enemies, power-ups
└── game.js      — Complete game engine (~1670 lines)
```

### game.js Structure

The engine is a single IIFE containing:

| Section              | Description                                          |
|----------------------|------------------------------------------------------|
| Configuration        | Constants: tile size, gravity, speeds, timers         |
| Input                | Keyboard state tracking + touch state                 |
| Sound Helpers        | Wrappers around the shared `Audio` system             |
| Particles            | In-canvas particle system (coins, ice, stomps, death) |
| Sprite Drawing       | Canvas-drawn characters: Mario, Luigi, Goomba, Koopa  |
| Tile Rendering       | Draws each tile type with theme-appropriate colors    |
| Background           | Parallax sky, clouds, and hills                       |
| Game State Object    | Central `game` object managing all state              |
| Screen Management    | DOM overlay toggling for menus/HUD                    |
| Level Loading        | Parses tile maps, spawns entities                     |
| Physics & Collision  | AABB tile collision, horizontal-then-vertical resolve |
| Player Update        | Movement, jumping (coyote time + buffering), ice shot |
| Enemy Update         | Patrol AI, freeze/squish states, ledge detection      |
| Projectile Update    | Movement, tile/enemy collision, pierce mode            |
| Rendering            | Camera follow, tile culling, entity/particle drawing  |
| Game Loop            | `requestAnimationFrame` with delta-time capping       |

### levels.js Structure

Each level is an object with:

```javascript
{
  name: 'Level Name',
  subtitle: 'Flavor text',
  powerUpType: 'speed',        // speed | highjump | shield | rapidice | giant
  powerUpName: 'Speed Mushroom',
  bg: { sky1, sky2, hill, ground, groundTop },  // theme colors
  playerStart: { x, y },       // tile coordinates
  flagPos: { x, y },           // tile coordinates
  enemies: [{ type, x, y }],   // type: 'goomba' | 'koopa'
  tileMap: [ ... ],             // array of 15 strings
}
```

### Tile Legend

| Char | Tile Type       | Behavior                                  |
|------|-----------------|-------------------------------------------|
| ` `  | Air             | Empty space                               |
| `#`  | Solid           | Ground/wall — fully solid                 |
| `B`  | Brick           | Solid; breakable with Giant power-up      |
| `?`  | Coin Block      | Hit from below to release a coin          |
| `!`  | Power-Up Block  | Hit from below to release level's power-up |
| `-`  | Platform        | One-way — jump through from below, land on top |
| `^`  | Hazard          | Instant death (lava/spikes), Giant immune |
| `C`  | Coin            | Collectible floating coin                 |

### Shared Libraries Used

- **`Storage`** — Saves unlocked levels and star ratings to `localStorage`
- **`Audio`** — Web Audio API sound effects (jump, coin, stomp, freeze, etc.)
- **Shared CSS** — `reset.css`, `base.css` (design tokens), `animations.css`, `components.css`

## Game Feel Techniques

The engine includes several techniques that make the platforming feel responsive:

- **Coyote Time** (6 frames) — Player can still jump briefly after walking off a ledge
- **Jump Buffering** (6 frames) — Jump input is registered slightly before landing
- **Variable Jump Height** — Tap for short hop, hold for full jump
- **Acceleration + Friction** — Smooth ramp-up/slow-down instead of instant movement
- **Screen Shake** — Camera shake on stomps, power-ups, and death
- **Invincibility Frames** — Player flashes and is immune for 1.5s after taking damage
- **Particle Effects** — Visual feedback for every action (coins, ice, stomps, bricks)

## Responsive Design

- Canvas uses a fixed internal resolution of **800x480** pixels
- Scales to fit any screen while maintaining 5:3 aspect ratio
- Touch controls auto-detect and only appear on touch-capable devices
- CSS uses `clamp()` for font sizes and responsive grid for level select

## Customization

### Adding a New Level

Add an object to the `LEVELS` array in `levels.js` following the structure above. The tile map must be exactly **15 rows** tall. The flag position defines where the player must reach to complete the level.

### Adjusting Difficulty

Key constants at the top of `game.js`:

```javascript
const GRAVITY = 0.6;           // Higher = heavier
const PLAYER_SPEED = 2.8;      // Max horizontal speed
const PLAYER_JUMP = -10.2;     // Jump force (negative = up)
const ICE_COOLDOWN = 350;      // ms between ice shots
const POWERUP_DURATION = 15000; // ms power-ups last
const INVINCIBLE_TIME = 1500;   // ms of invincibility after hit
```

### Changing Player Lives

In `loadLevel()`, change `lives: 3` to any number. For a more forgiving experience for younger kids, set it to `5` or higher.
