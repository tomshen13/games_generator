/**
 * Level definitions — 5 worlds x 4 levels = 20 levels.
 * Each X-4 level is a boss encounter.
 *
 * Coordinate convention:
 *   x: values in (-2, 2) are fractions of canvas width (e.g. 0.15 = 15% from left)
 *   y: values in (-2, 2) are fractions of canvas height; all others are absolute px
 *      (negative absolute like -80 = 80px above screen top)
 *   Formation spacings are always in pixels and added AFTER fraction→pixel conversion.
 */
const LEVELS = (() => {

  // Wave helper
  function wave(items, delay) {
    return { items, delay: delay || 120 };
  }

  // Single enemy descriptor
  function enemy(type, x, y, config) {
    return { type, x, y, config: config || {} };
  }

  // Formation descriptors — resolved at spawn time by processLevel
  function grid(type, startX, startY, cols, rows, spacingX, spacingY, config) {
    return {
      _f: 'grid', type, startX, startY,
      cols: cols || 1, rows: rows || 1,
      sx: spacingX || 60, sy: spacingY || 50,
      config: config || {},
    };
  }

  function line(type, startX, y, count, spacing, config) {
    return {
      _f: 'line', type, startX, y,
      count: count || 1, spacing: spacing || 60,
      config: config || {},
    };
  }

  function vShape(type, cx, startY, count, spacing, config) {
    return {
      _f: 'vShape', type, cx, startY,
      count: count || 3, spacing: spacing || 40,
      config: config || {},
    };
  }

  // =============================================
  // WORLD 1: ASTEROID BELT
  // Tutorial world. Drones + Swoopers only.
  // =============================================

  // 1-1: First Contact
  const level1_1 = {
    id: 1, name: 'First Contact',
    bgColor: '#050510', bgType: 'asteroids',
    waves: [
      // Wave 1: Simple drone grid (3x2)
      wave([
        grid('drone', 0.15, -20, 3, 2, 70, 50, {
          gridVx: 0.5, fireRate: 250, crystalChance: 0.5,
        }),
      ], 60),

      // Wave 2: Slightly bigger grid (4x2)
      wave([
        grid('drone', 0.1, -20, 4, 2, 60, 50, {
          gridVx: 0.6, fireRate: 220, crystalChance: 0.45,
        }),
      ], 180),

      // Wave 3: Introduce swoopers (3 from top)
      wave([
        line('swooper', 0.2, -30, 3, 80, { swoopDelay: 120, swoopSpeed: 2, crystalChance: 0.5 }),
      ], 180),

      // Wave 4: Mixed — drones + swoopers
      wave([
        grid('drone', 0.15, -20, 3, 2, 70, 50, { gridVx: 0.6, fireRate: 200, crystalChance: 0.4 }),
        line('swooper', 0.3, -50, 2, 100, { swoopDelay: 150, swoopSpeed: 2.2, crystalChance: 0.45 }),
      ], 180),
    ],
  };

  // 1-2: Asteroid Drift
  const level1_2 = {
    id: 2, name: 'Asteroid Drift',
    bgColor: '#050510', bgType: 'asteroids',
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 65, 50, {
          gridVx: 0.55, fireRate: 230, crystalChance: 0.45,
        }),
      ], 60),

      wave([
        line('swooper', 0.15, -30, 3, 80, { swoopDelay: 110, swoopSpeed: 2.2, crystalChance: 0.45 }),
      ], 180),

      wave([
        grid('drone', 0.2, -20, 3, 2, 70, 50, { gridVx: 0.6, fireRate: 210, crystalChance: 0.4 }),
        line('swooper', 0.1, -50, 2, 90, { swoopDelay: 130, swoopSpeed: 2.3 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 4, 2, 60, 50, { gridVx: 0.65, fireRate: 200, crystalChance: 0.4 }),
        line('swooper', 0.2, -40, 3, 70, { swoopDelay: 100, swoopSpeed: 2.5, crystalChance: 0.4 }),
      ], 180),
    ],
  };

  // 1-3: Rock Storm
  const level1_3 = {
    id: 3, name: 'Rock Storm',
    bgColor: '#050510', bgType: 'asteroids',
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 60, 50, { gridVx: 0.6, fireRate: 210 }),
        line('swooper', 0.25, -40, 2, 90, { swoopDelay: 110, swoopSpeed: 2.3 }),
      ], 60),

      wave([
        line('swooper', 0.1, -30, 4, 70, { swoopDelay: 100, swoopSpeed: 2.5, crystalChance: 0.45 }),
      ], 180),

      wave([
        grid('drone', 0.15, -20, 4, 3, 55, 45, { gridVx: 0.65, fireRate: 190, crystalChance: 0.4 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 3, 2, 65, 50, { gridVx: 0.7, fireRate: 180 }),
        line('swooper', 0.15, -40, 4, 70, { swoopDelay: 90, swoopSpeed: 2.6 }),
      ], 180),

      wave([
        vShape('swooper', 0.5, -30, 4, 50, { swoopDelay: 80, swoopSpeed: 2.8, crystalChance: 0.5 }),
        grid('drone', 0.1, -60, 4, 2, 60, 45, { gridVx: 0.7, fireRate: 170 }),
      ], 180),
    ],
  };

  // 1-4: Asteroid King (BOSS)
  const level1_4 = {
    id: 4, name: 'Asteroid King',
    bgColor: '#050510', bgType: 'asteroids',
    isBoss: true,
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 60, 50, { gridVx: 0.6, fireRate: 200 }),
        line('swooper', 0.2, -50, 3, 80, { swoopDelay: 100, swoopSpeed: 2.5 }),
      ], 60),

      wave([
        grid('drone', 0.15, -20, 3, 3, 55, 45, { gridVx: 0.7, fireRate: 180 }),
        line('swooper', 0.1, -40, 3, 70, { swoopDelay: 80, swoopSpeed: 2.8 }),
      ], 180),

      // Boss trigger
      wave([], 120),
    ],
  };

  // =============================================
  // WORLD 2: NEBULA ASSAULT
  // Introduces Tanks + Bombers.
  // =============================================

  // 2-1: Nebula Entry
  const level2_1 = {
    id: 5, name: 'Nebula Entry',
    bgColor: '#0A0520', bgType: 'nebula',
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 55, 45, { gridVx: 0.7, fireRate: 180 }),
        line('swooper', 0.25, -40, 2, 100, { swoopDelay: 100, swoopSpeed: 2.5 }),
      ], 60),

      // Introduce tanks
      wave([
        enemy('tank', 0.25, -40),
        enemy('tank', 0.65, -40, { fireRate: 200 }),
      ], 180),

      wave([
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 80 }),
        enemy('bomber', 1.05, 0.25, { flyDir: -1, fireRate: 90 }),
        grid('drone', 0.2, -20, 3, 2, 60, 45, { gridVx: 0.8, fireRate: 160 }),
      ], 180),

      wave([
        line('swooper', 0.1, -30, 4, 70, { swoopDelay: 80, swoopSpeed: 2.8 }),
        line('swooper', 0.15, -50, 3, 80, { swoopDelay: 120, swoopSpeed: 2.5 }),
      ], 150),
    ],
  };

  // 2-2: Ion Storm
  const level2_2 = {
    id: 6, name: 'Ion Storm',
    bgColor: '#0A0520', bgType: 'nebula',
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 55, 45, { gridVx: 0.75, fireRate: 170 }),
        enemy('tank', 0.5, -40),
      ], 60),

      wave([
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 75 }),
        line('swooper', 0.15, -30, 3, 80, { swoopDelay: 90, swoopSpeed: 2.6 }),
      ], 180),

      wave([
        enemy('tank', 0.2, -30),
        enemy('tank', 0.7, -40, { fireRate: 180 }),
        grid('drone', 0.35, -20, 3, 2, 60, 45, { gridVx: 0.8, fireRate: 160 }),
      ], 180),

      wave([
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 70 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 80 }),
        line('swooper', 0.1, -40, 4, 65, { swoopDelay: 80, swoopSpeed: 2.8 }),
      ], 180),

      wave([
        grid('drone', 0.1, -20, 4, 3, 55, 45, { gridVx: 0.85, fireRate: 150 }),
        enemy('tank', 0.5, -50, { fireRate: 160 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 65 }),
      ], 180),
    ],
  };

  // 2-3: Purple Vortex
  const level2_3 = {
    id: 7, name: 'Purple Vortex',
    bgColor: '#0A0520', bgType: 'nebula',
    waves: [
      wave([
        grid('drone', 0.05, -20, 4, 3, 55, 45, { gridVx: 0.8, fireRate: 160 }),
      ], 60),

      wave([
        enemy('tank', 0.3, -30),
        enemy('tank', 0.6, -40, { fireRate: 170 }),
        line('swooper', 0.1, -50, 3, 80, { swoopDelay: 80, swoopSpeed: 2.8 }),
      ], 180),

      wave([
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 65 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 70 }),
        enemy('bomber', -0.05, 0.3, { flyDir: 1, fireRate: 75 }),
      ], 180),

      wave([
        vShape('swooper', 0.5, -30, 4, 50, { swoopDelay: 70, swoopSpeed: 3, crystalChance: 0.45 }),
        enemy('tank', 0.15, -50, { fireRate: 150 }),
        enemy('tank', 0.75, -50, { fireRate: 160 }),
      ], 180),

      wave([
        grid('drone', 0.1, -20, 5, 2, 50, 45, { gridVx: 0.9, fireRate: 140 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 60 }),
        enemy('tank', 0.5, -50, { fireRate: 140 }),
      ], 180),
    ],
  };

  // 2-4: Nebula Overlord (BOSS)
  const level2_4 = {
    id: 8, name: 'Nebula Overlord',
    bgColor: '#0A0520', bgType: 'nebula',
    isBoss: true,
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 55, 45, { gridVx: 0.8, fireRate: 160 }),
        enemy('tank', 0.5, -50),
      ], 60),

      wave([
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 70 }),
        enemy('bomber', 1.05, 0.22, { flyDir: -1, fireRate: 75 }),
        line('swooper', 0.1, -30, 4, 70, { swoopDelay: 70, swoopSpeed: 3 }),
      ], 180),

      wave([
        enemy('tank', 0.25, -30, { fireRate: 150 }),
        enemy('tank', 0.65, -40, { fireRate: 150 }),
        grid('drone', 0.3, -20, 3, 2, 60, 45, { gridVx: 0.9, fireRate: 140 }),
      ], 180),

      // Boss trigger
      wave([], 120),
    ],
  };

  // =============================================
  // WORLD 3: DARK FRONTIER
  // Introduces Stealth + Splitters.
  // =============================================

  // 3-1: Shadow Zone
  const level3_1 = {
    id: 9, name: 'Shadow Zone',
    bgColor: '#08081A', bgType: 'deepspace',
    waves: [
      wave([
        grid('drone', 0.1, -20, 4, 2, 55, 45, { gridVx: 0.75, fireRate: 170 }),
        line('swooper', 0.2, -40, 3, 80, { swoopDelay: 90, swoopSpeed: 2.6 }),
      ], 60),

      // Introduce stealth
      wave([
        enemy('stealth', 0.2, -30, { zigDir: 1 }),
        enemy('stealth', 0.6, -40, { zigDir: -1 }),
        enemy('stealth', 0.4, -50, { zigDir: 1 }),
      ], 180),

      // Introduce splitters
      wave([
        enemy('splitter', 0.3, -30),
        enemy('splitter', 0.6, -40),
        enemy('tank', 0.45, -50, { fireRate: 170 }),
      ], 180),

      wave([
        grid('drone', 0.1, -20, 4, 2, 55, 45, { gridVx: 0.8, fireRate: 160 }),
        enemy('stealth', 0.3, -50, { zigDir: -1 }),
        enemy('splitter', 0.7, -40),
      ], 180),
    ],
  };

  // 3-2: Phantom Nebula
  const level3_2 = {
    id: 10, name: 'Phantom Nebula',
    bgColor: '#08081A', bgType: 'deepspace',
    waves: [
      wave([
        enemy('stealth', 0.15, -30, { zigDir: 1 }),
        enemy('stealth', 0.45, -40, { zigDir: -1 }),
        enemy('stealth', 0.75, -30, { zigDir: 1 }),
        grid('drone', 0.25, -60, 3, 2, 60, 45, { gridVx: 0.8, fireRate: 160 }),
      ], 60),

      wave([
        enemy('splitter', 0.2, -30),
        enemy('splitter', 0.5, -40),
        enemy('splitter', 0.8, -30),
        line('swooper', 0.1, -60, 3, 80, { swoopDelay: 80, swoopSpeed: 2.8 }),
      ], 180),

      wave([
        enemy('tank', 0.3, -30, { fireRate: 160 }),
        enemy('tank', 0.6, -40, { fireRate: 160 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 65 }),
        enemy('stealth', 0.45, -50, { zigDir: -1 }),
      ], 180),

      wave([
        grid('drone', 0.1, -20, 4, 3, 50, 40, { gridVx: 0.85, fireRate: 150 }),
        enemy('splitter', 0.3, -60),
        enemy('splitter', 0.7, -60),
        enemy('stealth', 0.5, -70, { zigDir: 1 }),
      ], 180),

      wave([
        vShape('swooper', 0.5, -30, 4, 45, { swoopDelay: 70, swoopSpeed: 3 }),
        enemy('tank', 0.2, -50, { fireRate: 150 }),
        enemy('bomber', 1.05, 0.15, { flyDir: -1, fireRate: 60 }),
        enemy('stealth', 0.8, -50, { zigDir: -1 }),
      ], 180),
    ],
  };

  // 3-3: Void Assault
  const level3_3 = {
    id: 11, name: 'Void Assault',
    bgColor: '#08081A', bgType: 'deepspace',
    waves: [
      wave([
        grid('drone', 0.05, -20, 5, 2, 50, 45, { gridVx: 0.85, fireRate: 150 }),
        enemy('stealth', 0.3, -50, { zigDir: 1 }),
        enemy('stealth', 0.7, -50, { zigDir: -1 }),
      ], 60),

      wave([
        enemy('tank', 0.2, -30, { fireRate: 150 }),
        enemy('tank', 0.5, -40, { fireRate: 150 }),
        enemy('tank', 0.8, -30, { fireRate: 160 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 60 }),
      ], 180),

      wave([
        enemy('splitter', 0.15, -30),
        enemy('splitter', 0.4, -40),
        enemy('splitter', 0.65, -30),
        enemy('splitter', 0.85, -40),
        line('swooper', 0.1, -60, 4, 65, { swoopDelay: 70, swoopSpeed: 3 }),
      ], 180),

      wave([
        enemy('stealth', 0.1, -30, { zigDir: 1 }),
        enemy('stealth', 0.3, -40, { zigDir: -1 }),
        enemy('stealth', 0.5, -30, { zigDir: 1 }),
        enemy('stealth', 0.7, -40, { zigDir: -1 }),
        enemy('stealth', 0.9, -30, { zigDir: 1 }),
        enemy('bomber', -0.05, 0.2, { flyDir: 1, fireRate: 55 }),
        enemy('bomber', 1.05, 0.3, { flyDir: -1, fireRate: 55 }),
      ], 180),

      wave([
        grid('drone', 0.1, -20, 5, 3, 48, 42, { gridVx: 0.9, fireRate: 140 }),
        enemy('tank', 0.5, -60, { fireRate: 140 }),
        enemy('splitter', 0.3, -70),
        enemy('splitter', 0.7, -70),
      ], 180),
    ],
  };

  // 3-4: Shadow Lord (BOSS)
  const level3_4 = {
    id: 12, name: 'Shadow Lord',
    bgColor: '#08081A', bgType: 'deepspace',
    isBoss: true,
    waves: [
      wave([
        grid('drone', 0.1, -20, 5, 2, 50, 45, { gridVx: 0.9, fireRate: 140 }),
        line('swooper', 0.15, -50, 3, 80, { swoopDelay: 80, swoopSpeed: 3 }),
      ], 60),

      wave([
        enemy('stealth', 0.2, -30, { zigDir: 1 }),
        enemy('stealth', 0.6, -40, { zigDir: -1 }),
        enemy('stealth', 0.4, -50, { zigDir: 1 }),
        enemy('splitter', 0.3, -30),
        enemy('splitter', 0.7, -40),
      ], 180),

      wave([
        enemy('tank', 0.3, -30, { fireRate: 130 }),
        enemy('tank', 0.7, -40, { fireRate: 140 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 60 }),
        line('swooper', 0.1, -50, 4, 65, { swoopDelay: 60, swoopSpeed: 3 }),
      ], 180),

      // Boss trigger
      wave([], 120),
    ],
  };

  // =============================================
  // WORLD 4: CRYSTAL NEBULA
  // All enemy types, higher density and fire rates.
  // =============================================

  // 4-1: Crystal Fields
  const level4_1 = {
    id: 13, name: 'Crystal Fields',
    bgColor: '#0A0A20', bgType: 'crystal',
    waves: [
      wave([
        grid('drone', 0.05, -20, 5, 2, 50, 45, { gridVx: 0.8, fireRate: 150 }),
        enemy('stealth', 0.4, -50, { zigDir: 1 }),
      ], 60),

      wave([
        enemy('tank', 0.2, -30, { fireRate: 150 }),
        enemy('tank', 0.7, -40, { fireRate: 150 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 60 }),
        enemy('splitter', 0.45, -50),
      ], 180),

      wave([
        line('swooper', 0.05, -30, 5, 60, { swoopDelay: 70, swoopSpeed: 3 }),
        enemy('stealth', 0.2, -60, { zigDir: -1 }),
        enemy('stealth', 0.8, -60, { zigDir: 1 }),
      ], 180),

      wave([
        grid('drone', 0.15, -20, 4, 3, 50, 42, { gridVx: 0.85, fireRate: 140 }),
        enemy('tank', 0.5, -60, { fireRate: 140 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 55 }),
        enemy('splitter', 0.35, -70),
        enemy('splitter', 0.65, -70),
      ], 180),
    ],
  };

  // 4-2: Shard Storm
  const level4_2 = {
    id: 14, name: 'Shard Storm',
    bgColor: '#0A0A20', bgType: 'crystal',
    waves: [
      wave([
        enemy('stealth', 0.15, -30, { zigDir: 1 }),
        enemy('stealth', 0.5, -40, { zigDir: -1 }),
        enemy('stealth', 0.85, -30, { zigDir: 1 }),
        enemy('tank', 0.35, -50, { fireRate: 140 }),
        enemy('tank', 0.65, -50, { fireRate: 140 }),
      ], 60),

      wave([
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 55 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 55 }),
        enemy('bomber', -0.05, 0.3, { flyDir: 1, fireRate: 60 }),
        grid('drone', 0.2, -20, 4, 2, 55, 45, { gridVx: 0.85, fireRate: 140 }),
      ], 180),

      wave([
        enemy('splitter', 0.1, -30),
        enemy('splitter', 0.35, -40),
        enemy('splitter', 0.6, -30),
        enemy('splitter', 0.85, -40),
        line('swooper', 0.15, -60, 4, 60, { swoopDelay: 60, swoopSpeed: 3.2 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.9, fireRate: 130 }),
        enemy('stealth', 0.3, -70, { zigDir: -1 }),
        enemy('stealth', 0.7, -70, { zigDir: 1 }),
        enemy('tank', 0.5, -80, { fireRate: 130 }),
      ], 180),

      wave([
        vShape('swooper', 0.5, -30, 5, 45, { swoopDelay: 60, swoopSpeed: 3.2 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 50 }),
        enemy('bomber', 1.05, 0.22, { flyDir: -1, fireRate: 50 }),
        enemy('splitter', 0.3, -60),
        enemy('splitter', 0.7, -60),
      ], 180),
    ],
  };

  // 4-3: Prism Gauntlet
  const level4_3 = {
    id: 15, name: 'Prism Gauntlet',
    bgColor: '#0A0A20', bgType: 'crystal',
    waves: [
      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.9, fireRate: 130 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 55 }),
      ], 60),

      wave([
        enemy('tank', 0.15, -30, { fireRate: 130 }),
        enemy('tank', 0.45, -40, { fireRate: 130 }),
        enemy('tank', 0.75, -30, { fireRate: 130 }),
        enemy('stealth', 0.3, -50, { zigDir: 1 }),
        enemy('stealth', 0.6, -50, { zigDir: -1 }),
      ], 180),

      wave([
        enemy('splitter', 0.1, -30),
        enemy('splitter', 0.3, -40),
        enemy('splitter', 0.5, -30),
        enemy('splitter', 0.7, -40),
        enemy('splitter', 0.9, -30),
        enemy('bomber', 1.05, 0.12, { flyDir: -1, fireRate: 50 }),
      ], 180),

      wave([
        line('swooper', 0.05, -30, 6, 55, { swoopDelay: 50, swoopSpeed: 3.3 }),
        enemy('tank', 0.3, -60, { fireRate: 120 }),
        enemy('tank', 0.7, -60, { fireRate: 120 }),
        enemy('stealth', 0.5, -70, { zigDir: 1 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.95, fireRate: 120 }),
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 50 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 50 }),
        enemy('splitter', 0.35, -70),
        enemy('splitter', 0.65, -70),
        enemy('stealth', 0.5, -80, { zigDir: -1 }),
      ], 180),

      wave([
        enemy('tank', 0.2, -30, { fireRate: 120 }),
        enemy('tank', 0.5, -40, { fireRate: 120 }),
        enemy('tank', 0.8, -30, { fireRate: 120 }),
        vShape('swooper', 0.5, -60, 4, 45, { swoopDelay: 50, swoopSpeed: 3.5 }),
        enemy('stealth', 0.15, -70, { zigDir: 1 }),
        enemy('stealth', 0.85, -70, { zigDir: -1 }),
      ], 180),
    ],
  };

  // 4-4: Crystal Titan (BOSS)
  const level4_4 = {
    id: 16, name: 'Crystal Titan',
    bgColor: '#0A0A20', bgType: 'crystal',
    isBoss: true,
    waves: [
      wave([
        grid('drone', 0.1, -20, 5, 2, 50, 45, { gridVx: 0.9, fireRate: 130 }),
        enemy('stealth', 0.3, -50, { zigDir: 1 }),
        enemy('stealth', 0.7, -50, { zigDir: -1 }),
      ], 60),

      wave([
        enemy('tank', 0.2, -30, { fireRate: 130 }),
        enemy('tank', 0.5, -40, { fireRate: 130 }),
        enemy('tank', 0.8, -30, { fireRate: 130 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 55 }),
        enemy('splitter', 0.4, -50),
        enemy('splitter', 0.6, -50),
      ], 180),

      wave([
        line('swooper', 0.05, -30, 5, 60, { swoopDelay: 50, swoopSpeed: 3.3 }),
        enemy('stealth', 0.3, -60, { zigDir: -1 }),
        enemy('stealth', 0.7, -60, { zigDir: 1 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 50 }),
      ], 180),

      // Boss trigger
      wave([], 120),
    ],
  };

  // =============================================
  // WORLD 5: MOTHERSHIP
  // Maximum intensity. All types. Fastest rates.
  // =============================================

  // 5-1: Breach Point
  const level5_1 = {
    id: 17, name: 'Breach Point',
    bgColor: '#100008', bgType: 'mothership',
    waves: [
      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.9, fireRate: 120 }),
        enemy('stealth', 0.3, -60, { zigDir: 1 }),
        enemy('stealth', 0.7, -60, { zigDir: -1 }),
      ], 60),

      wave([
        enemy('tank', 0.15, -30, { fireRate: 120 }),
        enemy('tank', 0.5, -40, { fireRate: 120 }),
        enemy('tank', 0.85, -30, { fireRate: 120 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 50 }),
        enemy('bomber', 1.05, 0.25, { flyDir: -1, fireRate: 50 }),
      ], 180),

      wave([
        enemy('splitter', 0.1, -30),
        enemy('splitter', 0.3, -40),
        enemy('splitter', 0.5, -30),
        enemy('splitter', 0.7, -40),
        enemy('splitter', 0.9, -30),
        line('swooper', 0.1, -60, 5, 55, { swoopDelay: 50, swoopSpeed: 3.5 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.95, fireRate: 110 }),
        enemy('stealth', 0.2, -70, { zigDir: -1 }),
        enemy('stealth', 0.5, -70, { zigDir: 1 }),
        enemy('stealth', 0.8, -70, { zigDir: -1 }),
        enemy('tank', 0.35, -80, { fireRate: 110 }),
        enemy('tank', 0.65, -80, { fireRate: 110 }),
      ], 180),

      wave([
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 45 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 45 }),
        enemy('bomber', -0.05, 0.3, { flyDir: 1, fireRate: 50 }),
        vShape('swooper', 0.5, -30, 5, 45, { swoopDelay: 40, swoopSpeed: 3.5 }),
        enemy('splitter', 0.3, -60),
        enemy('splitter', 0.7, -60),
      ], 180),
    ],
  };

  // 5-2: Core Defenses
  const level5_2 = {
    id: 18, name: 'Core Defenses',
    bgColor: '#100008', bgType: 'mothership',
    waves: [
      wave([
        enemy('tank', 0.1, -30, { fireRate: 110 }),
        enemy('tank', 0.35, -40, { fireRate: 110 }),
        enemy('tank', 0.6, -30, { fireRate: 110 }),
        enemy('tank', 0.85, -40, { fireRate: 110 }),
        enemy('stealth', 0.2, -50, { zigDir: 1 }),
        enemy('stealth', 0.7, -50, { zigDir: -1 }),
      ], 60),

      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 0.95, fireRate: 110 }),
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 45 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 45 }),
        enemy('splitter', 0.5, -70),
      ], 180),

      wave([
        enemy('stealth', 0.1, -30, { zigDir: 1 }),
        enemy('stealth', 0.3, -35, { zigDir: -1 }),
        enemy('stealth', 0.5, -30, { zigDir: 1 }),
        enemy('stealth', 0.7, -35, { zigDir: -1 }),
        enemy('stealth', 0.9, -30, { zigDir: 1 }),
        enemy('tank', 0.45, -60, { fireRate: 110 }),
        enemy('bomber', -0.05, 0.25, { flyDir: 1, fireRate: 45 }),
      ], 180),

      wave([
        line('swooper', 0.05, -30, 6, 55, { swoopDelay: 40, swoopSpeed: 3.5 }),
        enemy('splitter', 0.15, -60),
        enemy('splitter', 0.4, -70),
        enemy('splitter', 0.65, -60),
        enemy('splitter', 0.9, -70),
        enemy('tank', 0.5, -80, { fireRate: 100 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 5, 4, 48, 40, { gridVx: 1.0, fireRate: 100 }),
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 40 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 40 }),
        enemy('stealth', 0.3, -80, { zigDir: -1 }),
        enemy('stealth', 0.7, -80, { zigDir: 1 }),
      ], 180),
    ],
  };

  // 5-3: Final Approach
  const level5_3 = {
    id: 19, name: 'Final Approach',
    bgColor: '#100008', bgType: 'mothership',
    waves: [
      wave([
        grid('drone', 0.05, -20, 5, 3, 48, 42, { gridVx: 1.0, fireRate: 100 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 45 }),
        enemy('stealth', 0.3, -60, { zigDir: 1 }),
        enemy('stealth', 0.7, -60, { zigDir: -1 }),
      ], 60),

      wave([
        enemy('tank', 0.1, -30, { fireRate: 100 }),
        enemy('tank', 0.3, -40, { fireRate: 100 }),
        enemy('tank', 0.5, -30, { fireRate: 100 }),
        enemy('tank', 0.7, -40, { fireRate: 100 }),
        enemy('tank', 0.9, -30, { fireRate: 100 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 40 }),
      ], 180),

      wave([
        enemy('splitter', 0.1, -30),
        enemy('splitter', 0.25, -40),
        enemy('splitter', 0.4, -30),
        enemy('splitter', 0.55, -40),
        enemy('splitter', 0.7, -30),
        enemy('splitter', 0.85, -40),
        line('swooper', 0.05, -60, 6, 55, { swoopDelay: 40, swoopSpeed: 3.5 }),
      ], 180),

      wave([
        enemy('stealth', 0.1, -30, { zigDir: 1 }),
        enemy('stealth', 0.25, -35, { zigDir: -1 }),
        enemy('stealth', 0.4, -30, { zigDir: 1 }),
        enemy('stealth', 0.55, -35, { zigDir: -1 }),
        enemy('stealth', 0.7, -30, { zigDir: 1 }),
        enemy('stealth', 0.85, -35, { zigDir: -1 }),
        enemy('bomber', -0.05, 0.1, { flyDir: 1, fireRate: 40 }),
        enemy('bomber', 1.05, 0.2, { flyDir: -1, fireRate: 40 }),
        enemy('bomber', -0.05, 0.3, { flyDir: 1, fireRate: 45 }),
      ], 180),

      wave([
        grid('drone', 0.05, -20, 5, 4, 48, 40, { gridVx: 1.0, fireRate: 100 }),
        enemy('tank', 0.25, -80, { fireRate: 100 }),
        enemy('tank', 0.5, -80, { fireRate: 100 }),
        enemy('tank', 0.75, -80, { fireRate: 100 }),
        enemy('stealth', 0.4, -90, { zigDir: 1 }),
        enemy('stealth', 0.6, -90, { zigDir: -1 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 40 }),
        enemy('bomber', 1.05, 0.25, { flyDir: -1, fireRate: 40 }),
      ], 180),

      wave([
        vShape('swooper', 0.5, -30, 5, 45, { swoopDelay: 35, swoopSpeed: 3.8 }),
        enemy('splitter', 0.15, -60),
        enemy('splitter', 0.4, -70),
        enemy('splitter', 0.6, -60),
        enemy('splitter', 0.85, -70),
        enemy('tank', 0.3, -80, { fireRate: 100 }),
        enemy('tank', 0.7, -80, { fireRate: 100 }),
        enemy('bomber', -0.05, 0.15, { flyDir: 1, fireRate: 40 }),
      ], 180),
    ],
  };

  // 5-4: Mothership Core (FINAL BOSS)
  const level5_4 = {
    id: 20, name: 'Mothership Core',
    bgColor: '#100008', bgType: 'mothership',
    isBoss: true,
    waves: [
      wave([
        grid('drone', 0.1, -20, 5, 2, 50, 45, { gridVx: 0.9, fireRate: 140 }),
        line('swooper', 0.15, -50, 3, 80, { swoopDelay: 80, swoopSpeed: 3 }),
      ], 60),

      wave([
        enemy('stealth', 0.2, -30, { zigDir: 1 }),
        enemy('stealth', 0.6, -40, { zigDir: -1 }),
        enemy('stealth', 0.4, -50, { zigDir: 1 }),
        enemy('splitter', 0.3, -30),
        enemy('splitter', 0.7, -40),
      ], 180),

      wave([
        enemy('tank', 0.3, -30, { fireRate: 130 }),
        enemy('tank', 0.7, -40, { fireRate: 140 }),
        enemy('bomber', -0.05, 0.12, { flyDir: 1, fireRate: 60 }),
        line('swooper', 0.1, -50, 4, 65, { swoopDelay: 60, swoopSpeed: 3 }),
      ], 180),

      // Boss trigger
      wave([], 120),
    ],
  };

  // ===== COORDINATE RESOLUTION =====

  const ALL_LEVELS = [
    // World 1: Asteroid Belt
    level1_1, level1_2, level1_3, level1_4,
    // World 2: Nebula Assault
    level2_1, level2_2, level2_3, level2_4,
    // World 3: Dark Frontier
    level3_1, level3_2, level3_3, level3_4,
    // World 4: Crystal Nebula
    level4_1, level4_2, level4_3, level4_4,
    // World 5: Mothership
    level5_1, level5_2, level5_3, level5_4,
  ];

  // Resolve a value: if in (-2, 2) treat as fraction, otherwise absolute pixels
  function resolveCoord(val, size) {
    return (val > -2 && val < 2) ? val * size : val;
  }

  // Expand formation descriptors and single enemies into resolved enemy arrays
  function resolveItems(items, cw, ch) {
    const enemies = [];
    for (const item of items) {
      if (item._f === 'grid') {
        const baseX = resolveCoord(item.startX, cw);
        const baseY = resolveCoord(item.startY, ch);
        for (let r = 0; r < item.rows; r++) {
          for (let c = 0; c < item.cols; c++) {
            enemies.push({
              type: item.type,
              x: baseX + c * item.sx,
              y: baseY + r * item.sy,
              config: {
                ...item.config,
                fireRate: (item.config && item.config.fireRate) || (180 + Math.random() * 120),
              },
            });
          }
        }
      } else if (item._f === 'line') {
        const baseX = resolveCoord(item.startX, cw);
        const baseY = resolveCoord(item.y, ch);
        for (let i = 0; i < item.count; i++) {
          enemies.push({
            type: item.type,
            x: baseX + i * item.spacing,
            y: baseY,
            config: item.config || {},
          });
        }
      } else if (item._f === 'vShape') {
        const baseX = resolveCoord(item.cx, cw);
        const baseY = resolveCoord(item.startY, ch);
        for (let i = 0; i < item.count; i++) {
          enemies.push({
            type: item.type,
            x: baseX - i * item.spacing,
            y: baseY + i * 30,
            config: item.config || {},
          });
          if (i > 0) {
            enemies.push({
              type: item.type,
              x: baseX + i * item.spacing,
              y: baseY + i * 30,
              config: item.config || {},
            });
          }
        }
      } else {
        // Single enemy
        enemies.push({
          ...item,
          x: resolveCoord(item.x, cw),
          y: resolveCoord(item.y, ch),
        });
      }
    }
    return enemies;
  }

  function processLevel(level, cw, ch) {
    const processed = { ...level };
    processed.waves = level.waves.map(w => ({
      delay: w.delay,
      enemies: resolveItems(w.items || [], cw, ch),
    }));
    return processed;
  }

  return {
    ALL: ALL_LEVELS,
    processLevel,
  };
})();
