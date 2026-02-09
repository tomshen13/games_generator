# Adding a New Game

This guide explains how to add a new game to the Kids Games collection.

## 1. Create the game folder

```
games/
└── your-game-name/
    ├── index.html    # Game page
    ├── style.css     # Game-specific styles
    ├── game.js       # Core game logic
    └── ...           # Any additional JS files
```

## 2. Set up the game HTML

Your `index.html` should include the shared CSS and JS:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Your Game Title</title>

  <!-- Shared CSS -->
  <link rel="stylesheet" href="../../shared/css/reset.css">
  <link rel="stylesheet" href="../../shared/css/base.css">
  <link rel="stylesheet" href="../../shared/css/animations.css">
  <link rel="stylesheet" href="../../shared/css/components.css">

  <!-- Game CSS -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Game content -->

  <!-- Shared JS -->
  <script src="../../shared/js/utils.js"></script>
  <script src="../../shared/js/audio.js"></script>
  <script src="../../shared/js/particles.js"></script>
  <script src="../../shared/js/storage.js"></script>

  <!-- Game JS -->
  <script src="game.js"></script>
</body>
</html>
```

## 3. Use shared utilities

### Audio

```js
Audio.init();                    // Call once on first user interaction
Audio.SFX.correct();             // Play correct answer chime
Audio.SFX.wrong();               // Play wrong answer sound
Audio.SFX.tap();                 // Click/tap feedback
Audio.SFX.fanfare();             // Level complete
Audio.speak("Hello!");           // Text-to-speech
Audio.speakNumber(7);            // Speak a number
```

### Particles

```js
Particles.init(canvasElement);          // Initialize with a canvas
Particles.sparkle(x, y, 12, '#FFD700');  // Sparkle burst
Particles.confetti(60);                 // Confetti rain
Particles.fireBurst(x, y, 20);         // Fire particles
Particles.waterSplash(x, y, 20);       // Water particles
Particles.rainbowExplosion(x, y);      // Combined effect
Particles.clear();                     // Clear all particles
```

### Storage

```js
Storage.save('my-game', 'level', 3);          // Save progress
Storage.load('my-game', 'level', 0);          // Load (with default)
Storage.remove('my-game', 'level');            // Remove a key
Storage.clearGame('my-game');                  // Clear all game data
```

### Utils

```js
Utils.shuffle([1, 2, 3]);           // Shuffled copy
Utils.randInt(1, 10);               // Random integer
Utils.pickRandom([1,2,3,4,5], 3);   // Pick 3 random items
Utils.range(1, 20);                 // [1, 2, ..., 20]
Utils.wait(500);                    // Promise-based delay
Utils.createElement('div', { className: 'foo' }, ['text']);
```

## 4. Register in the launcher

Open the root `index.html` and add your game to the `GAMES` array:

```js
{
  id: 'your-game-name',
  title: 'Your Game Title',
  icon: '🎯',
  ages: 'Ages 4-6',
  description: 'Short description of the game.',
  path: 'games/your-game-name/index.html',
  available: true,
},
```

## 5. Design guidelines

- **Big touch targets**: Minimum 100x100px for interactive elements
- **No fail states**: Wrong answers get gentle feedback, never punishment
- **Audio cues**: Use speech synthesis for instructions since young kids can't read
- **Constant rewards**: Sparkles, stars, and celebrations for every correct answer
- **Short sessions**: 2-3 minutes per level matches young attention spans
- **Save progress**: Use `Storage` so kids can resume later

## 6. CSS design tokens

Use the CSS custom properties from `shared/css/base.css`:

- Fonts: `var(--font-display)`, `var(--font-body)`
- Sizes: `var(--text-sm)` through `var(--text-3xl)`
- Spacing: `var(--space-xs)` through `var(--space-2xl)`
- Radii: `var(--radius-sm)` through `var(--radius-round)`
- Colors: `var(--fire-*)`, `var(--water-*)`, etc.
- Easing: `var(--ease-bounce)`, `var(--ease-smooth)`

## 7. Animation classes

Apply these classes from `shared/css/animations.css`:

- `.animate-bounce-in` — Scale from 0 with bounce
- `.animate-float` — Gentle floating
- `.animate-wobble` — Wrong answer shake
- `.animate-pop-in` — Quick pop appearance
- `.animate-confetti-fall` — Falling confetti piece
- `.animate-victory` — Victory dance
- See `animations.css` for the full list
