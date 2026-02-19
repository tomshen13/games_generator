/**
 * Pixel art sprite data for Space Invaders.
 * All sprites are defined as compact string templates + color palettes.
 * No external image files needed.
 */
const SPRITES = (() => {

  // Parse a compact string template into a pixel array
  // Each char maps to a color via palette. '.' = transparent.
  function parse(w, h, template, palette) {
    const pixels = template.replace(/[|\n]/g, '').split('').map(c =>
      c === '.' ? null : (palette[c] || null)
    );
    return { w, h, pixels };
  }

  // Recolor a sprite with a new palette
  function recolor(sprite, fromPal, toPal) {
    const colorMap = {};
    for (const key of Object.keys(fromPal)) {
      colorMap[fromPal[key]] = toPal[key];
    }
    return {
      w: sprite.w,
      h: sprite.h,
      pixels: sprite.pixels.map(c => c ? (colorMap[c] || c) : null),
    };
  }

  // ===== PLAYER SHIP PALETTES =====

  const SHIP_P1 = {
    H: '#00FFFF', // hull cyan
    D: '#008B8B', // dark cyan outline
    E: '#00CED1', // engine area
    W: '#FFFFFF', // white highlights
    C: '#FFD700', // cockpit gold
    F: '#FF6B35', // flame/thrust
    G: '#00FFFF', // glow
  };

  const SHIP_P2 = {
    H: '#39FF14', // hull neon green
    D: '#228B22', // dark green outline
    E: '#32CD32', // engine area
    W: '#FFFFFF', // white highlights
    C: '#FFD700', // cockpit gold
    F: '#FF6B35', // flame/thrust
    G: '#39FF14', // glow
  };

  // Ship variants (recolor bases)
  const SHIP_PHANTOM = {
    H: '#BF40FF', // purple hull
    D: '#6A0DAD', // dark purple
    E: '#9B30FF', // engine
    W: '#FFFFFF',
    C: '#FFD700',
    F: '#FF6B35',
    G: '#BF40FF',
  };

  const SHIP_TITAN = {
    H: '#FF6B35', // orange hull
    D: '#CC4400', // dark orange
    E: '#FF8C00', // engine
    W: '#FFFFFF',
    C: '#FFD700',
    F: '#FF4500',
    G: '#FF6B35',
  };

  // ===== PLAYER SHIP (16x16) =====

  const SHIP_IDLE = parse(16, 16,
    '......HHHH......' +
    '.....HHWWHH.....' +
    '....HHWWWWHH....' +
    '....HHCCCCDD....' +
    '...HHCCCCCCDD...' +
    '..HHHHHHHHHHDD..' +
    '.DHHHHHHHHHHHHD.' +
    'DDHHHHHHHHHHHHHD' +
    'DHHHHHHHHHHHHHDD' +
    '.DHHHHHHHHHHDD..' +
    '..DDHHHHHHDDD...' +
    '...DDHHHHDDD....' +
    '....DDHHDDD.....' +
    '....EEFFEED.....' +
    '.....EFFFED.....' +
    '......EFFD......', SHIP_P1);

  const SHIP_THRUST = parse(16, 16,
    '......HHHH......' +
    '.....HHWWHH.....' +
    '....HHWWWWHH....' +
    '....HHCCCCDD....' +
    '...HHCCCCCCDD...' +
    '..HHHHHHHHHHDD..' +
    '.DHHHHHHHHHHHHD.' +
    'DDHHHHHHHHHHHHHD' +
    'DHHHHHHHHHHHHHDD' +
    '.DHHHHHHHHHHDD..' +
    '..DDHHHHHHDDD...' +
    '...DDHHHHDDD....' +
    '...EEFFFFEED....' +
    '..EEFFFFFFEED...' +
    '...EFFFFFFED....' +
    '....EFFFFED.....', SHIP_P1);

  // P2 ships (green variants)
  const SHIP_P2_IDLE = recolor(SHIP_IDLE, SHIP_P1, SHIP_P2);
  const SHIP_P2_THRUST = recolor(SHIP_THRUST, SHIP_P1, SHIP_P2);

  // Ship type variants for selection (1P)
  // Falcon = default cyan, Phantom = purple, Titan = orange
  const SHIP_PHANTOM_IDLE = recolor(SHIP_IDLE, SHIP_P1, SHIP_PHANTOM);
  const SHIP_PHANTOM_THRUST = recolor(SHIP_THRUST, SHIP_P1, SHIP_PHANTOM);
  const SHIP_TITAN_IDLE = recolor(SHIP_IDLE, SHIP_P1, SHIP_TITAN);
  const SHIP_TITAN_THRUST = recolor(SHIP_THRUST, SHIP_P1, SHIP_TITAN);

  // ===== ENEMY PALETTES =====

  const DRONE_PAL = {
    B: '#00FFFF', // cyan body
    D: '#006B6B', // dark outline
    W: '#FFFFFF', // white eyes
    K: '#1A1A1A', // pupils
    G: '#00CED1', // glow accent
    L: '#80FFFF', // light highlight
  };

  const SWOOPER_PAL = {
    B: '#FF00FF', // magenta body
    D: '#8B008B', // dark outline
    W: '#FFFFFF', // white
    K: '#1A1A1A', // pupils
    P: '#FF69B4', // pink highlights
    L: '#FF80FF', // light
  };

  const TANK_PAL = {
    B: '#FF8C00', // orange body
    D: '#CC5500', // dark outline
    W: '#FFFFFF', // white
    Y: '#FFD700', // yellow core
    R: '#FF4500', // red cannon
    K: '#1A1A1A', // dark
  };

  const STEALTH_PAL = {
    B: '#4B0082', // indigo body
    D: '#2D004F', // dark outline
    L: '#8A2BE2', // light purple
    W: '#FFFFFF', // white
    K: '#1A1A1A', // dark
    G: '#BF40FF', // glow
  };

  const SPLITTER_PAL = {
    B: '#00FF00', // green body
    D: '#006400', // dark outline
    W: '#FFFFFF', // white
    Y: '#FFD700', // yellow eyes
    K: '#1A1A1A', // dark
    L: '#80FF80', // light green
  };

  const BOMBER_PAL = {
    B: '#FF0000', // red body
    D: '#8B0000', // dark outline
    O: '#FF6B35', // orange underside
    Y: '#FFD700', // yellow lights
    W: '#FFFFFF', // white
    K: '#1A1A1A', // dark
  };

  // ===== ENEMY SPRITES (16x16) =====

  // Drone — angular alien with antennae
  const DRONE_1 = parse(16, 16,
    '..B..........B..' +
    '..BB........BB..' +
    '...BB......BB...' +
    '...DBBBBBBBD....' +
    '..DBBBBBBBBBD...' +
    '.DBBBWBBWBBBBD..' +
    '.DBBWKBBKWBBBD..' +
    'DBBBBBBBBBBBBBD.' +
    'DBBLBBBBBBBLBBD.' +
    'DBBBBBBBBBBBBD..' +
    '.DBBBBBBBBBBBD..' +
    '.DBBBDDDDBBBD...' +
    '..DDBBBBBBBDD...' +
    '...DDB..BDDD....' +
    '..DD......DD....' +
    '................', DRONE_PAL);

  const DRONE_2 = parse(16, 16,
    '.B............B.' +
    '..B..........B..' +
    '..BB........BB..' +
    '...DBBBBBBBD....' +
    '..DBBBBBBBBBD...' +
    '.DBBBWBBWBBBBD..' +
    '.DBBWKBBKWBBBD..' +
    'DBBBBBBBBBBBBBD.' +
    'DBBLBBBBBBBLBBD.' +
    'DBBBBBBBBBBBBD..' +
    '.DBBBBBBBBBBBD..' +
    '.DBBBDDDDBBBD...' +
    '..DDBBBBBBBDD...' +
    '...DDB..BDDD....' +
    '....DD..DD......' +
    '................', DRONE_PAL);

  // Swooper — sleek bird shape with swept wings
  const SWOOPER_1 = parse(16, 16,
    '......BBBB......' +
    '.....BBBPBB.....' +
    '....BBWBBWBB....' +
    '....BBKBBKBB....' +
    '...BBBBBBBBBB...' +
    '..BBBBBBBBBBB...' +
    'PBBBBBBBBBBBBBP.' +
    'BBBBBBBBBBBBBBB.' +
    'PPBBBBBBBBBBBBPP' +
    '..DBBBBBBBBBD...' +
    '...DBBBBBBD.....' +
    '....DBBBBDD.....' +
    '.....DDBDD......' +
    '......DDD.......' +
    '................' +
    '................', SWOOPER_PAL);

  const SWOOPER_2 = parse(16, 16,
    '......BBBB......' +
    '.....BBBPBB.....' +
    '....BBWBBWBB....' +
    '....BBKBBKBB....' +
    '...BBBBBBBBBB...' +
    '.BBBBBBBBBBBBBB.' +
    'BBBBBBBBBBBBBBBB' +
    'PBBBBBBBBBBBBBBP' +
    '.PBBBBBBBBBBBBP.' +
    '..DBBBBBBBBBD...' +
    '...DBBBBBBD.....' +
    '....DBBBBDD.....' +
    '.....DDBDD......' +
    '......DDD.......' +
    '................' +
    '................', SWOOPER_PAL);

  // Tank — bulky hexagonal with cannon
  const TANK_1 = parse(16, 16,
    '......RRRR......' +
    '.....RRRRRR.....' +
    '....DBBBBBBBD...' +
    '...DBBBBBBBBBD..' +
    '..DBBBYYBBBBBBD.' +
    '.DBBBBYYYBBBBBD.' +
    '.DBBBBYYBBBBBD..' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBD.' +
    '.DBBBBBBBBBBBD..' +
    '.DBBBBBBBBBBD...' +
    '..DDDBBBBDDD....' +
    '..DB..DD..BD....' +
    '.DDB......BDD...' +
    '................', TANK_PAL);

  const TANK_2 = parse(16, 16,
    '.....RRRRRR.....' +
    '....RRRRRRRR....' +
    '....DBBBBBBBD...' +
    '...DBBBBBBBBBD..' +
    '..DBBBYYBBBBBBD.' +
    '.DBBBBYYYBBBBBD.' +
    '.DBBBBYYBBBBBD..' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBD.' +
    '.DBBBBBBBBBBBD..' +
    '.DBBBBBBBBBBD...' +
    '..DDDBBBBDDD....' +
    '..DB..DD..BD....' +
    '.DDB......BDD...' +
    '................', TANK_PAL);

  // Stealth — angular stealth-fighter
  const STEALTH_1 = parse(16, 16,
    '.......BB.......' +
    '......BBBB......' +
    '.....BLWLBB.....' +
    '....BBLWLBBB....' +
    '...BBBBBBBBB....' +
    '..BBBBBBBBBBB...' +
    '.BBBBBBBBBBBBB..' +
    'GBBBBBBBBBBBBGG.' +
    '.DBBBBBBBBBBBD..' +
    '..DBBBBBBBBD....' +
    '...DBBBBBBBD....' +
    '....DBBBBD......' +
    '.....DBBD.......' +
    '......DD........' +
    '................' +
    '................', STEALTH_PAL);

  const STEALTH_2 = parse(16, 16,
    '.......BB.......' +
    '......BBBB......' +
    '.....BGWGBB.....' +
    '....BBGWGBBB....' +
    '...BBBBBBBBB....' +
    '..BBBBBBBBBBB...' +
    '.BBBBBBBBBBBBB..' +
    'LBBBBBBBBBBBBLL.' +
    '.DBBBBBBBBBBBD..' +
    '..DBBBBBBBBD....' +
    '...DBBBBBBBD....' +
    '....DBBBBD......' +
    '.....DBBD.......' +
    '......DD........' +
    '................' +
    '................', STEALTH_PAL);

  // Splitter — round blob
  const SPLITTER_1 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBB.....' +
    '...BBLBBBLBB....' +
    '..BBBYBBBYBBB...' +
    '..BBBBBBBBBBBB..' +
    '.BBBBBBBBBBBBBB.' +
    '.BBBBBBBBBBBBBB.' +
    '.BLBBBBBBBBBBBL.' +
    '.BBBBBBBBBBBBBB.' +
    '.BBBBBBBBBBBBBB.' +
    '..BBBBBBBBBBBB..' +
    '..DBBBBBBBBBD...' +
    '...DDBBBBBDD....' +
    '....DDDDDDD.....' +
    '................' +
    '................', SPLITTER_PAL);

  const SPLITTER_2 = parse(16, 16,
    '......BBBB......' +
    '....BBLBBLBB....' +
    '...BBLBBBLBB....' +
    '..BBBYBBBYBBB...' +
    '..BBBBBBBBBBBB..' +
    '.BBBBBBBBBBBBBB.' +
    '.BBLBBBBBBBBLBB.' +
    '.BBBBBBBBBBBBBB.' +
    '.BBBBBBBBBBBBBB.' +
    '.BBBBBBBBBBBBBB.' +
    '..BBBBBBBBBBBB..' +
    '..DBBBBBBBBBD...' +
    '...DDBBBBBDD....' +
    '....DDDDDDD.....' +
    '................' +
    '................', SPLITTER_PAL);

  // Splitter mini (8x8)
  const SPLITTER_MINI = parse(8, 8,
    '..BBBB..' +
    '.BBYBB..' +
    'BBBBBBBB' +
    'BLBBBBBL' +
    'BBBBBBBB' +
    '.BBBBBB.' +
    '..DDDD..' +
    '........', SPLITTER_PAL);

  // Bomber — flat saucer shape
  const BOMBER_1 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBBOBBBB....' +
    '..BBBBOOOBBBB...' +
    '.DBBBBBBBBBBBD..' +
    'DDBBYBBYBBYBBD..' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBBD' +
    'DBBBBBBBBBBBBBD.' +
    'DDBBBBBBBBBBDD..' +
    '.DDDOOOOODDDD...' +
    '..DDDDDDDDDD....' +
    '................' +
    '................' +
    '................' +
    '................', BOMBER_PAL);

  const BOMBER_2 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBBOBBBB....' +
    '..BBBBOOOBBBB...' +
    '.DBBBBBBBBBBBD..' +
    'DDBBYBBYBBYBBBD.' +
    'DBBBBBBBBBBBBBD.' +
    'DBBBBBBBBBBBBBBD' +
    'DBBBBBBBBBBBBBD.' +
    'DDBBBBBBBBBBDD..' +
    '.DDDOOOOODDDD...' +
    '..DDDDDDDDDD....' +
    '................' +
    '................' +
    '................' +
    '................', BOMBER_PAL);

  // ===== BOSS: MOTHERSHIP (48x32) =====

  const BOSS_PAL = {
    S: '#4682B4', // steel blue hull
    D: '#1A237E', // dark blue
    C: '#00FFFF', // cyan highlights
    R: '#FF0000', // red core
    W: '#FFFFFF', // white energy
    K: '#0A0A0A', // black
    Y: '#FFD700', // gold accents
    G: '#00CED1', // glow
  };

  const MOTHERSHIP = parse(48, 32,
    '......................SSSSSS..........................' +
    '....................SSSSSSSSSS........................' +
    '..................SSSSDDDDSSSSSS......................' +
    '................SSSSDDDDDDDDSSSSS....................' +
    '..............SSSSDDDDDDDDDDDSSSS....................' +
    '............SSSSDDDDDDDDDDDDDDSSSS..................' +
    '..........SSSSDDDDDDDDDDDDDDDDDSSSS................' +
    '........SSSSDDDDDDDDDRRDDDDDDDDDDSSSS..............' +
    '......SSSSDDDDDDDDDRRRRRDDDDDDDDDDSSSS.............' +
    '....SSSSDDDDDDDDDDRRRRRRRDDDDDDDDDDDSSS............' +
    '..SSSSDDDDDDDDDDDDRRRWRRRDDDDDDDDDDDDSSS...........' +
    'SSSSDDDDDDDDDDDDDDRRRRRRRDDDDDDDDDDDDDSSSS.........' +
    'SDDDDDDDDDDDDDDDDDDRRRRRDDDDDDDDDDDDDDDDDS.........' +
    'SDDDDDDDDDDCDDDDDDDDRRRDDDDDDDCDDDDDDDDDS..........' +
    'SDDDDDDDDCCCDDDDDDDDDDDDDDDDDDCCCDDDDDDDS..........' +
    'SDDDDDDDCCCCCDDDDDDDDDDDDDDDDDCCCCCDDDDDDS.........' +
    'SDDDDDDDDCCCDDDDDDDDDDDDDDDDDDCCCDDDDDDDS..........' +
    'SDDDDDDDDDDCDDDDDDDDDDDDDDDDDDCDDDDDDDDDS..........' +
    'SDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDS..........' +
    'SDDDGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGDDDS..........' +
    '.SDDGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGDDS...........' +
    '..SDGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGDS...........' +
    '...SDGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGDS............' +
    '....SDGDDDDDDDDDDDDDDDDDDDDDDDDDDDGDS..............' +
    '.....SDDDDDDDDDDDDDDDDDDDDDDDDDDDDDS...............' +
    '......SDDDDDDDDDDDDDDDDDDDDDDDDDDS..................' +
    '.......SSDDDDDDDDDDDDDDDDDDDDDSSS...................' +
    '........SSSDDDDDDDDDDDDDDDDSSS......................' +
    '..........SSSSDDDDDDDDDSSSSS.........................' +
    '............SSSSSSSSSSSSS............................' +
    '..............SSSSSSSSS..............................' +
    '................SSSSS................................', BOSS_PAL);

  // ===== PROJECTILE SPRITES =====

  const BULLET_PAL = {
    C: '#00FFFF', // cyan
    W: '#FFFFFF', // white center
    L: '#80FFFF', // light cyan
  };

  const ENEMY_BULLET_PAL = {
    R: '#FF4500', // red-orange
    O: '#FF8C00', // orange
    Y: '#FFD700', // yellow center
  };

  const BOSS_BULLET_PAL = {
    P: '#BF40FF', // purple
    L: '#D980FF', // light purple
    W: '#FFFFFF', // white center
  };

  // Player bullet (6x10 — tall thin bolt)
  const PLAYER_BULLET = parse(6, 10,
    '..WW..' +
    '.WCCW.' +
    '.CCCC.' +
    'CCCCCC' +
    'CCCCCC' +
    'CCCCCC' +
    '.CCCC.' +
    '.LCLL.' +
    '..LL..' +
    '..LL..', BULLET_PAL);

  // Enemy bullet (6x6 — small orb)
  const ENEMY_BULLET = parse(6, 6,
    '..RR..' +
    '.ROOR.' +
    'ROOYYR' +
    'ROOYYR' +
    '.ROOR.' +
    '..RR..', ENEMY_BULLET_PAL);

  // Boss bullet (8x8 — larger purple orb)
  const BOSS_BULLET = parse(8, 8,
    '..PPPP..' +
    '.PLLLLP.' +
    'PLLWWLLP' +
    'PLWWWWLP' +
    'PLWWWWLP' +
    'PLLWWLLP' +
    '.PLLLLP.' +
    '..PPPP..', BOSS_BULLET_PAL);

  // Boss tracking missile (8x12)
  const BOSS_MISSILE = parse(8, 12,
    '...RR...' +
    '..RRRR..' +
    '.RROPRR.' +
    '.RRRRRR.' +
    'RRRRRRRR' +
    'RRRRRRRR' +
    'RRRRRRRR' +
    '.RRRRRR.' +
    '.RRRRRR.' +
    '..YYYY..' +
    '..OYYY..' +
    '...YY...', { R: '#FF0000', O: '#FF6B35', Y: '#FFD700', P: '#FF4500' });

  // Bomb projectile (enemy bomber drops)
  const BOMB_SPRITE = parse(8, 8,
    '...KK...' +
    '..KRRK..' +
    '.KRRRRK.' +
    'KRRRRRRK' +
    'KRRRRRRK' +
    '.KRRRRK.' +
    '..KRRK..' +
    '...KK...', { K: '#1A1A1A', R: '#FF4500' });

  // ===== CRYSTAL PICKUP (8x8) =====

  const CRYSTAL_PAL = {
    C: '#00FFFF', // cyan
    L: '#80FFFF', // light
    W: '#FFFFFF', // white highlight
    D: '#006B6B', // dark
  };

  const CRYSTAL_1 = parse(8, 8,
    '...CC...' +
    '..CWLC..' +
    '.CWWLLC.' +
    'CWWWLLLC' +
    'CLLLLLLD' +
    '.CLLLLD.' +
    '..CLLD..' +
    '...DD...', CRYSTAL_PAL);

  const CRYSTAL_2 = parse(8, 8,
    '...CC...' +
    '..CLWC..' +
    '.CLLWWC.' +
    'CLLLWWWC' +
    'CDLLLLLC' +
    '.CDLLC..' +
    '..CDLC..' +
    '...DD...', CRYSTAL_PAL);

  // ===== SHOP UPGRADE ICONS (16x16) =====

  const ICON_PAL = {
    C: '#00FFFF', W: '#FFFFFF', Y: '#FFD700',
    R: '#FF4500', G: '#39FF14', B: '#4488FF',
    P: '#BF40FF', D: '#006B6B', K: '#1A1A1A',
    O: '#FF8C00',
  };

  const ICON_RAPID = parse(16, 16,
    '......CC........' +
    '.....CCCC.......' +
    '.....CCCC.......' +
    '......CC........' +
    '......CC........' +
    '....CCCCCC......' +
    '...CCCCCCCC.....' +
    '..CCCCCCCCCC....' +
    '......CC........' +
    '......CC........' +
    '......CC........' +
    '......CC........' +
    '.....YYYY.......' +
    '....YYYYYY......' +
    '.....YYYY.......' +
    '......YY........', ICON_PAL);

  const ICON_DUAL = parse(16, 16,
    '..CC......CC....' +
    '..CCCC..CCCC....' +
    '..CCCC..CCCC....' +
    '...CC....CC.....' +
    '...CC....CC.....' +
    '..CCCC..CCCC....' +
    '.CCCCCCCCCCCC...' +
    '..CCCCCCCCCC....' +
    '...CC....CC.....' +
    '...CC....CC.....' +
    '...CC....CC.....' +
    '...CC....CC.....' +
    '..YYYY..YYYY....' +
    '.YYYYYY.YYYYY...' +
    '..YYYY..YYYY....' +
    '...YY....YY.....', ICON_PAL);

  const ICON_SPREAD = parse(16, 16,
    '.CC....CC....CC.' +
    '..CC..CCCC..CC..' +
    '..CCCCCCCCCCCC..' +
    '...CCCCCCCCCC...' +
    '....CCCCCCCC....' +
    '...CCCCCCCCCC...' +
    '..CCCCCCCCCCCC..' +
    '..CC.CCCCCC.CC..' +
    '.....CCCCCC.....' +
    '......CCCC......' +
    '......CCCC......' +
    '......CCCC......' +
    '.....YYYYYY.....' +
    '....YYYYYYYY....' +
    '.....YYYYYY.....' +
    '......YYYY......', ICON_PAL);

  const ICON_PIERCE = parse(16, 16,
    '......WW........' +
    '.....WWWW.......' +
    '.....CCCC.......' +
    '....CCCCCC......' +
    '....CCCCCC......' +
    '...CCCCCCCC.....' +
    '...CCCCCCCC.....' +
    '..CCCCCCCCCC....' +
    '...CCCCCCCC.....' +
    '...CCCCCCCC.....' +
    '....CCCCCC......' +
    '....CCCCCC......' +
    '.....CCCC.......' +
    '.....RRRR.......' +
    '......RR........' +
    '................', ICON_PAL);

  const ICON_SHIELD = parse(16, 16,
    '....BBBBBBBB....' +
    '..BBBBBBBBBBB...' +
    '.BBBWWWWWWBBBB..' +
    '.BBBWWWWWWBBBB..' +
    'BBBWWWWWWWWBBBB.' +
    'BBBWWWWWWWWBBBB.' +
    'BBBWWWWWWWWBBBB.' +
    'BBBWWWWWWWWBBBB.' +
    '.BBBWWWWWWBBBB..' +
    '.BBBWWWWWWBBBB..' +
    '..BBBWWWWBBBB...' +
    '...BBBWWBBBB....' +
    '....BBBBBB......' +
    '.....BBBB.......' +
    '......BB........' +
    '................', ICON_PAL);

  const ICON_REPAIR = parse(16, 16,
    '................' +
    '......GG........' +
    '.....GGGG.......' +
    '....GGGGGG......' +
    '...GGWWWWGG.....' +
    '..GGGWWWWGGG....' +
    '.GGGGWWWWGGGG...' +
    '.GWWWWWWWWWWG...' +
    '.GWWWWWWWWWWG...' +
    '.GGGGWWWWGGGG...' +
    '..GGGWWWWGGG....' +
    '...GGWWWWGG.....' +
    '....GGGGGG......' +
    '.....GGGG.......' +
    '......GG........' +
    '................', ICON_PAL);

  const ICON_DEFLECT = parse(16, 16,
    '..BBBBBBBBBB....' +
    '.BBBBBBBBBBB....' +
    'BBBWWWWWWBBB....' +
    'BBWWWWWWWWBB....' +
    'BBWWWWWWWWBB....' +
    '.BBWWWWWWBB.....' +
    '..BBWWWWBB..RR..' +
    '...BBBBBB..RRRR.' +
    '...........RRRR.' +
    '............RR..' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................', ICON_PAL);

  const ICON_MAGNET = parse(16, 16,
    '..PPPP..PPPP....' +
    '.PPPPPP.PPPPPP..' +
    '.PP..PP..PP..PP.' +
    '.PP..PPPPPP..PP.' +
    '.PP...PPPP...PP.' +
    '..PP..PPPP..PP..' +
    '..PP..PPPP..PP..' +
    '...PP.PPPP.PP...' +
    '...PPPPPPPPPP...' +
    '....PPPPPPPP....' +
    '.....PPPPPP.....' +
    '......PPPP......' +
    '................' +
    '................' +
    '................' +
    '................', ICON_PAL);

  const ICON_SPEED = parse(16, 16,
    '........YY......' +
    '.......YYO......' +
    '......YYOO......' +
    '.....YYOO.......' +
    '....YYOO........' +
    '...YYYOOO.......' +
    '..YYYYOOOO......' +
    '.YYYYYOOOOO.....' +
    '..YYYYOOOO......' +
    '...YYYOOO.......' +
    '....YYOO........' +
    '.....YYOO.......' +
    '......YYOO......' +
    '.......YYO......' +
    '........YY......' +
    '................', ICON_PAL);

  const ICON_LIFE = parse(16, 16,
    '................' +
    '..RRR....RRR....' +
    '.RRRRR..RRRRR...' +
    'RRRRRRRRRRRRRRR.' +
    'RRRRRRRRRRRRRRR.' +
    'RRRRRRRRRRRRRRR.' +
    '.RRRRRRRRRRRRR..' +
    '..RRRRRRRRRRR...' +
    '...RRRRRRRRR....' +
    '....RRRRRRR.....' +
    '.....RRRRR......' +
    '......RRR.......' +
    '.......R........' +
    '................' +
    '................' +
    '................', ICON_PAL);

  const ICON_BOMB = parse(16, 16,
    '.......YY.......' +
    '......YYYY......' +
    '.....OOKK.......' +
    '....KKKKKK......' +
    '...KKKKKKKK.....' +
    '..KKKKKKKKKK....' +
    '.KKKKRRRRKKKKK..' +
    '.KKKRRRRRRKKK...' +
    '.KKKRRRRRRKKK...' +
    '.KKKKRRRRKKKKK..' +
    '..KKKKKKKKKK....' +
    '...KKKKKKKK.....' +
    '....KKKKKK......' +
    '.....KKKK.......' +
    '................' +
    '................', ICON_PAL);

  // ===== ANIMATION GROUPS =====

  const ANIMS = {
    ship: {
      falcon: { idle: [SHIP_IDLE], thrust: [SHIP_THRUST] },
      phantom: { idle: [SHIP_PHANTOM_IDLE], thrust: [SHIP_PHANTOM_THRUST] },
      titan: { idle: [SHIP_TITAN_IDLE], thrust: [SHIP_TITAN_THRUST] },
      p2: { idle: [SHIP_P2_IDLE], thrust: [SHIP_P2_THRUST] },
    },
    drone: { idle: [DRONE_1, DRONE_2] },
    swooper: { idle: [SWOOPER_1, SWOOPER_2] },
    tank: { idle: [TANK_1, TANK_2] },
    stealth: { idle: [STEALTH_1, STEALTH_2] },
    splitter: { idle: [SPLITTER_1, SPLITTER_2] },
    bomber: { idle: [BOMBER_1, BOMBER_2] },
    crystal: { sparkle: [CRYSTAL_1, CRYSTAL_2] },
  };

  // ===== SHOP ICON MAP =====
  const SHOP_ICONS = {
    rapidFire: ICON_RAPID,
    dualCannons: ICON_DUAL,
    spreadShot: ICON_SPREAD,
    piercingRounds: ICON_PIERCE,
    shieldBoost: ICON_SHIELD,
    autoRepair: ICON_REPAIR,
    deflector: ICON_DEFLECT,
    magnetField: ICON_MAGNET,
    speedBoost: ICON_SPEED,
    extraLife: ICON_LIFE,
    bomb: ICON_BOMB,
  };

  return {
    ANIMS,
    MOTHERSHIP,
    PLAYER_BULLET,
    ENEMY_BULLET,
    BOSS_BULLET,
    BOSS_MISSILE,
    BOMB_SPRITE,
    CRYSTAL_1,
    CRYSTAL_2,
    SPLITTER_MINI,
    SHOP_ICONS,
    recolor,
  };
})();
