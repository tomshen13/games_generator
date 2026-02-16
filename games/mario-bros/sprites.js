/**
 * Pixel art sprite data for Super Mario Bros.
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

  // Flip a sprite horizontally (for pre-caching)
  function flipH(sprite) {
    const { w, h, pixels } = sprite;
    const flipped = new Array(pixels.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        flipped[y * w + (w - 1 - x)] = pixels[y * w + x];
      }
    }
    return { w, h, pixels: flipped };
  }

  // ===== PALETTES =====

  const MARIO_PAL = {
    R: '#E52521', // red (hat, shirt)
    B: '#6B3200', // brown (hair, mustache)
    S: '#FFB900', // skin
    O: '#3C5FC4', // blue (overalls)
    K: '#1A1A1A', // dark (outline, eyes)
    W: '#FFFFFF', // white (gloves, eyes)
    Y: '#FFD700', // yellow (buttons)
  };

  const LUIGI_PAL = {
    R: '#3CB043', // green (hat, shirt)
    B: '#6B3200', // brown (hair, mustache)
    S: '#FFB900', // skin
    O: '#3C5FC4', // blue (overalls)
    K: '#1A1A1A', // dark
    W: '#FFFFFF', // white
    Y: '#FFD700', // yellow
  };

  const TOAD_PAL = {
    R: '#FFFFFF', // white cap
    B: '#E52521', // red spots / details
    S: '#FFB900', // skin
    O: '#5050DC', // purple vest
    K: '#1A1A1A', // dark
    W: '#FFFFFF', // white
    Y: '#FFD700', // yellow
  };

  const PEACH_PAL = {
    R: '#FF69B4', // pink dress
    B: '#FFD700', // gold hair
    S: '#FFB900', // skin
    O: '#FF1493', // deep pink details
    K: '#1A1A1A', // dark
    W: '#FFFFFF', // white
    Y: '#FFD700', // yellow
  };

  const GOOMBA_PAL = {
    B: '#8B4513', // brown body
    D: '#5C2E00', // dark brown
    K: '#1A1A1A', // black (eyes)
    W: '#FFFFFF', // white (eyes)
    T: '#D2B48C', // tan (feet)
    F: '#FFB900', // face
  };

  const KOOPA_PAL = {
    G: '#3CB043', // green shell
    D: '#2E7D32', // dark green
    Y: '#FFD700', // yellow belly
    S: '#FFB900', // skin
    W: '#FFFFFF', // white
    K: '#1A1A1A', // black
    R: '#E52521', // red wings
  };

  const TILE_PAL = {
    G: '#C84C09', // ground brown
    D: '#8B3000', // dark brown
    L: '#E8A050', // light brown
    T: '#50A020', // grass green top
    g: '#3C8018', // dark grass
  };

  const BRICK_PAL = {
    B: '#C84C09', // brick
    D: '#8B3000', // mortar dark
    L: '#E8A050', // brick light
  };

  const Q_PAL = {
    Y: '#FFD700', // gold
    D: '#CC8800', // dark gold
    W: '#FFFFFF', // white highlight
    K: '#8B6914', // outline
    Q: '#FFA500', // question mark
  };

  const COIN_PAL = {
    Y: '#FFD700', // gold
    D: '#CC8800', // dark gold
    W: '#FFF8DC', // highlight
  };

  const PIPE_PAL = {
    G: '#3CB043', // green
    D: '#2E7D32', // dark green
    L: '#5DD55D', // light green
  };

  const FLAG_PAL = {
    G: '#808080', // grey pole
    D: '#606060', // dark grey
    W: '#FFFFFF', // white flag
    R: '#E52521', // red triangle
    Y: '#FFD700', // gold ball top
  };

  const ICE_PAL = {
    I: '#B0E0FF', // ice blue
    L: '#D0F0FF', // light ice
    D: '#80C0E0', // dark ice
    W: '#FFFFFF', // white highlight
  };

  const LAVA_PAL = {
    R: '#FF4500', // red
    O: '#FF6B00', // orange
    Y: '#FFD700', // yellow
    D: '#CC2200', // dark red
  };

  const CASTLE_PAL = {
    G: '#505050', // grey stone
    D: '#383838', // dark stone
    L: '#707070', // light stone
  };

  const CLOUD_PAL = {
    W: '#FFFFFF', // white
    L: '#E8F4FF', // light blue
  };

  const POWERUP_PAL = {
    // Ice
    I: '#00BFFF', i: '#0080C0', W: '#FFFFFF', L: '#80E0FF',
    // Fire
    R: '#FF4500', O: '#FF8C00', Y: '#FFD700',
    // Wings
    w: '#FFFFFF', G: '#FFD700', B: '#ADD8E6',
    // Star
    S: '#FFD700', s: '#FFA500', K: '#CC8800',
    // Mushroom
    M: '#E52521', m: '#B01A18', T: '#FFB900', t: '#CC8800',
    // Potion
    P: '#2ECC71', p: '#27AE60', g: '#1ABC9C', D: '#16A085',
  };

  const PROJ_PAL = {
    // Ice projectile
    I: '#00BFFF', W: '#FFFFFF', L: '#80E0FF',
    // Fire projectile
    R: '#FF4500', O: '#FF8C00', Y: '#FFD700',
    // Potion projectile
    P: '#2ECC71', p: '#27AE60', D: '#16A085',
  };

  const PLATFORM_PAL = {
    P: '#FFFFFF',
    D: '#D0D0D0',
    L: '#F0F0F0',
  };

  // ===== MARIO SPRITES (16x16) =====

  const MARIO_IDLE = parse(16, 16,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSS......' +
    '..OOROORO.......' +
    '.OOORROORROOO...' +
    'SSOORRRRRROOS...' +
    'SSRRWRRRRWRRSS..' +
    '..RRRRRRRRRR....' +
    '..RRRR..RRRR....' +
    '..RRR....RRR....' +
    '.BBB......BBB...' +
    'BBBB......BBBB..', MARIO_PAL);

  const MARIO_RUN1 = parse(16, 16,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSS......' +
    '..OOROORO.......' +
    '.OOORROORROOO...' +
    'SSOORRRRRROOS...' +
    '..RRRRRRRRRR....' +
    '..RRRRRRRR......' +
    '...RRR..BBB.....' +
    '..BBB..BBBB.....' +
    '.BBBB...........' +
    '................', MARIO_PAL);

  const MARIO_RUN2 = parse(16, 16,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSS......' +
    '...OOOROO.......' +
    '..OOORROORRO....' +
    '..SORRRRRROOS...' +
    '...RRRRRRRR.....' +
    '...RRRRRRRR.....' +
    '..BBB..RRR......' +
    '.BBBB..BBB......' +
    '........BBBB....' +
    '................', MARIO_PAL);

  const MARIO_JUMP = parse(16, 16,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSS......' +
    '..OORROORR......' +
    '.OOORROORROO....' +
    'SOORRRRRRRROOS..' +
    'SSRRWRRRRWRRSS..' +
    '..RRRRRRRRRR....' +
    '..RRR....RRR....' +
    '.BBB......BBB...' +
    '.BBBB...........' +
    '..........BBBB..', MARIO_PAL);

  const MARIO_SHOOT = parse(16, 16,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSS......' +
    '..OOROORO..SS...' +
    '.OOORROORROOSS..' +
    'SSOORRRRRROOS...' +
    '..RRRRRRRRRR....' +
    '..RRRRRRRR......' +
    '..RRR...RRR.....' +
    '.BBB.....BBB....' +
    'BBBB.....BBBB...' +
    '................', MARIO_PAL);

  // Big Mario (16x32) for mushroom power-up
  const MARIO_BIG_IDLE = parse(16, 32,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSSS.....' +
    '....SSSSSS......' +
    '..RROOROORR.....' +
    '.RRROOROORRRR...' +
    'RRRROOOOOORRR...' +
    'SSOORRRRRROOS...' +
    'SSOORRRRRROOSS..' +
    'SSOORRRRRROOS...' +
    '..OORRRRRROO....' +
    '..OORRRRRROO....' +
    '...RRRRRRRR.....' +
    '...RRRRRRRR.....' +
    '...RRRRRRRR.....' +
    '..RRRRRRRRRR....' +
    '..RRRRRRRRRR....' +
    '..RRRR..RRRR....' +
    '..RRR....RRR....' +
    '..RRR....RRR....' +
    '.BRRR....RRRB...' +
    '.BBB......BBB...' +
    '.BBB......BBB...' +
    'BBBB......BBBB..' +
    'BBBB......BBBB..' +
    '................' +
    '................', MARIO_PAL);

  const MARIO_BIG_JUMP = parse(16, 32,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSSS.....' +
    '....SSSSSS......' +
    '..RROOROORR.....' +
    '.RRROOROORRRR...' +
    'RRRROOOOOORRR...' +
    'SSOORRRRRROOS...' +
    'SSOORRRRRROOSS..' +
    'SSOORRRRRROOS...' +
    '..OORRRRRROO....' +
    '..RRRRRRRRRR....' +
    '...RRRRRRRR.....' +
    '...RRRRRRRR.....' +
    '..RRRR..RRRR....' +
    '..RRR....RRR....' +
    '.BBB......BBB...' +
    '.BBBB...........' +
    '..........BBBB..' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................', MARIO_PAL);

  const MARIO_BIG_RUN1 = parse(16, 32,
    '....RRRRR.......' +
    '...RRRRRRRRR....' +
    '...RRRRRRRRR....' +
    '...BBBSSSBK.....' +
    '..BSBSSSSBK.....' +
    '..BSBBSSSSBB....' +
    '..BBSSSSSBBB....' +
    '....SSSSSSS.....' +
    '....SSSSSS......' +
    '..RROOROORR.....' +
    '.RRROOROORRRR...' +
    'RRRROOOOOORRR...' +
    'SSOORRRRRROOS...' +
    'SSOORRRRRROOSS..' +
    'SSOORRRRRROOS...' +
    '..OORRRRRROO....' +
    '..RRRRRRRRRR....' +
    '...RRRRRRRR.....' +
    '...RRRRRRRR.....' +
    '..RRRRRRRR......' +
    '...RRR..BBB.....' +
    '..BBB..BBBB.....' +
    '.BBBB...........' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................', MARIO_PAL);

  // Generate Luigi sprites by recoloring Mario
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

  const LUIGI_IDLE = recolor(MARIO_IDLE, MARIO_PAL, LUIGI_PAL);
  const LUIGI_RUN1 = recolor(MARIO_RUN1, MARIO_PAL, LUIGI_PAL);
  const LUIGI_RUN2 = recolor(MARIO_RUN2, MARIO_PAL, LUIGI_PAL);
  const LUIGI_JUMP = recolor(MARIO_JUMP, MARIO_PAL, LUIGI_PAL);
  const LUIGI_SHOOT = recolor(MARIO_SHOOT, MARIO_PAL, LUIGI_PAL);
  const LUIGI_BIG_IDLE = recolor(MARIO_BIG_IDLE, MARIO_PAL, LUIGI_PAL);
  const LUIGI_BIG_JUMP = recolor(MARIO_BIG_JUMP, MARIO_PAL, LUIGI_PAL);
  const LUIGI_BIG_RUN1 = recolor(MARIO_BIG_RUN1, MARIO_PAL, LUIGI_PAL);

  // Generate Toad sprites by recoloring Mario
  const TOAD_IDLE = recolor(MARIO_IDLE, MARIO_PAL, TOAD_PAL);
  const TOAD_RUN1 = recolor(MARIO_RUN1, MARIO_PAL, TOAD_PAL);
  const TOAD_RUN2 = recolor(MARIO_RUN2, MARIO_PAL, TOAD_PAL);
  const TOAD_JUMP = recolor(MARIO_JUMP, MARIO_PAL, TOAD_PAL);
  const TOAD_SHOOT = recolor(MARIO_SHOOT, MARIO_PAL, TOAD_PAL);
  const TOAD_BIG_IDLE = recolor(MARIO_BIG_IDLE, MARIO_PAL, TOAD_PAL);
  const TOAD_BIG_JUMP = recolor(MARIO_BIG_JUMP, MARIO_PAL, TOAD_PAL);
  const TOAD_BIG_RUN1 = recolor(MARIO_BIG_RUN1, MARIO_PAL, TOAD_PAL);

  // Generate Peach sprites by recoloring Mario
  const PEACH_IDLE = recolor(MARIO_IDLE, MARIO_PAL, PEACH_PAL);
  const PEACH_RUN1 = recolor(MARIO_RUN1, MARIO_PAL, PEACH_PAL);
  const PEACH_RUN2 = recolor(MARIO_RUN2, MARIO_PAL, PEACH_PAL);
  const PEACH_JUMP = recolor(MARIO_JUMP, MARIO_PAL, PEACH_PAL);
  const PEACH_SHOOT = recolor(MARIO_SHOOT, MARIO_PAL, PEACH_PAL);
  const PEACH_BIG_IDLE = recolor(MARIO_BIG_IDLE, MARIO_PAL, PEACH_PAL);
  const PEACH_BIG_JUMP = recolor(MARIO_BIG_JUMP, MARIO_PAL, PEACH_PAL);
  const PEACH_BIG_RUN1 = recolor(MARIO_BIG_RUN1, MARIO_PAL, PEACH_PAL);

  // ===== ENEMY SPRITES =====

  const GOOMBA_1 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBBBBBBBB...' +
    '..BBBKBBBBKBBB..' +
    '..BBKWBBBBWKBB..' +
    '..BBKWBBBBWKBB..' +
    '.BBBBBDDDDBBBB..' +
    '.BBBBDDDDDDBBBB.' +
    '.BBBFFFFFFFFF BB.' +
    '..BFFFFFFFFFBB..' +
    '..BBFFFFFFFFBB..' +
    '...BDDDDDDDDB...' +
    '....BBDDDDBB....' +
    '..TTTBBBBBBTTTT.' +
    '.TTTTTT..TTTTTT.' +
    'TTTTTT....TTTTT.', GOOMBA_PAL);

  const GOOMBA_2 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBBBBBBBB...' +
    '..BBBKBBBBKBBB..' +
    '..BBKWBBBBWKBB..' +
    '..BBKWBBBBWKBB..' +
    '.BBBBBDDDDBBBB..' +
    '.BBBBDDDDDDBBBB.' +
    '.BBBFFFFFFFFF BB.' +
    '..BFFFFFFFFFBB..' +
    '..BBFFFFFFFFBB..' +
    '...BDDDDDDDDB...' +
    '...TBBDDDDBBTT..' +
    '..TTTTBBBBTTTT..' +
    '.TTTTTT..TTTTT..' +
    '.TTTTT....TTTT..', GOOMBA_PAL);

  const GOOMBA_SQUASH = parse(16, 8,
    '..BBBBBBBBBBBB..' +
    '.BBBBBBBBBBBBBB.' +
    '.BBKWBBBBBBWKBB.' +
    '.BBBBBDDDDDBBB..' +
    '..BFFFFFFFFFBB..' +
    '..TTTBBBBBBTTTT.' +
    '.TTTTTT..TTTTTT.' +
    'TTTTTT....TTTTT.', GOOMBA_PAL);

  const KOOPA_FLY1 = parse(16, 24,
    '....RR....RR....' +
    '...RRRR..RRRR...' +
    '..RRRRRRRRRRRR..' +
    '..RR..RRRR..RR..' +
    '......GGGG......' +
    '....GGGGGGGG....' +
    '...GGGGGGGGGG...' +
    '..GGKGGGGGGKGG..' +
    '..GKWGGGGGGWKG..' +
    '..GGGGDDDDGGGG..' +
    '.GGGGGDDDDGGGGG.' +
    '.GGGGYYYYYYYYGG.' +
    '.GGGYYYYYYYYGGG.' +
    '..GGYYYYYYYGG...' +
    '..GGYYYYYYGG....' +
    '...GGGGGGGG.....' +
    '...GGGGGGGG.....' +
    '....GGGGGG......' +
    '....GG..GG......' +
    '...SS....SS.....' +
    '..SSS....SSS....' +
    '..SSS....SSS....' +
    '................' +
    '................', KOOPA_PAL);

  const KOOPA_FLY2 = parse(16, 24,
    '..RR........RR..' +
    '..RRRR..RRRR....' +
    '...RRRRRRRRRR...' +
    '...RR..RR..RR...' +
    '......GGGG......' +
    '....GGGGGGGG....' +
    '...GGGGGGGGGG...' +
    '..GGKGGGGGGKGG..' +
    '..GKWGGGGGGWKG..' +
    '..GGGGDDDDGGGG..' +
    '.GGGGGDDDDGGGGG.' +
    '.GGGGYYYYYYYYGG.' +
    '.GGGYYYYYYYYGGG.' +
    '..GGYYYYYYYGG...' +
    '..GGYYYYYYGG....' +
    '...GGGGGGGG.....' +
    '...GGGGGGGG.....' +
    '....GGGGGG......' +
    '....GG..GG......' +
    '...SS....SS.....' +
    '..SSS....SSS....' +
    '..SSS....SSS....' +
    '................' +
    '................', KOOPA_PAL);

  // ===== NEW ENEMY PALETTES =====

  const PIRANHA_PAL = {
    G: '#3CB043', // green body
    D: '#2E7D32', // dark green
    R: '#E52521', // red mouth
    W: '#FFFFFF', // white teeth
    K: '#1A1A1A', // outline
    L: '#5DD55D', // light green
  };

  const BOO_PAL = {
    W: '#FFFFFF', // white body
    L: '#E0E0E0', // light grey
    K: '#1A1A1A', // black eyes
    P: '#FF69B4', // pink blush
    M: '#4A0080', // mouth
  };

  const BEETLE_PAL = {
    B: '#1A237E', // dark blue shell
    L: '#3949AB', // lighter blue
    S: '#5C6BC0', // shell highlight
    W: '#FFFFFF', // white eyes
    K: '#1A1A1A', // black
    T: '#795548', // brown feet
  };

  const BOBOMB_PAL = {
    B: '#1A1A1A', // black body
    D: '#333333', // dark grey
    W: '#FFFFFF', // white eyes
    K: '#000000', // outline
    R: '#E52521', // fuse tip
    Y: '#FFD700', // fuse glow
    F: '#FFB900', // feet
  };

  // ===== NEW ENEMY SPRITES =====

  const PIRANHA_1 = parse(16, 16,
    '......RRRR......' +
    '....RRRRRRRR....' +
    '...RRWRRRRWRR...' +
    '..RRRWRRRRWRRR..' +
    '..RRRRRRRRRRRR..' +
    '...RRRKKKRRR....' +
    '....GGGGGGG.....' +
    '....GGGGGGGG....' +
    '...GGGDDDGGGG...' +
    '...GGDDDDDDGG..' +
    '...GGDDDDDDGG..' +
    '...GGGDDDGGGG...' +
    '....GGGGGGGG....' +
    '....GGLLGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......', PIRANHA_PAL);

  const PIRANHA_2 = parse(16, 16,
    '....RRRRRRRR....' +
    '...RRRRRRRRRR...' +
    '..RRRWRRRWRRRR..' +
    '..RRRWRRRWRRRR..' +
    '..RRRRRRRRRRRR..' +
    '...RRRKKKKRRR...' +
    '....GGGGGGG.....' +
    '....GGGGGGGG....' +
    '...GGGDDDGGGG...' +
    '...GGDDDDDDGG..' +
    '...GGDDDDDDGG..' +
    '...GGGDDDGGGG...' +
    '....GGGGGGGG....' +
    '....GGLLGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......', PIRANHA_PAL);

  const BOO_NORMAL = parse(16, 16,
    '......WWWW......' +
    '....WWWWWWWW....' +
    '...WWWWWWWWWW...' +
    '..WWWKWWWWKWWW..' +
    '..WWKKWWWWKKWW..' +
    '..WWWWWWWWWWWW..' +
    '.WWWWWWMMMWWWWW.' +
    '.WWWWWMMMMWWWWW.' +
    '.WWWWWWWWWWWWWW.' +
    '..WWWWWWWWWWWW..' +
    '..LWWWWWWWWWWL..' +
    '...LWWWWWWWWL...' +
    '....LLWWWWLL....' +
    '.....WWLLWW.....' +
    '......WWWW......' +
    '................', BOO_PAL);

  const BOO_SHY = parse(16, 16,
    '......WWWW......' +
    '....WWWWWWWW....' +
    '...WWWWWWWWWW...' +
    '..WWWWWWWWWWWW..' +
    '..WWLLWWWWLLWW..' +
    '..WWLLWWWWLLWW..' +
    '.WWWWWPPPPWWWWW.' +
    '.WWWWWWWWWWWWWW.' +
    '.WWWWWWWWWWWWWW.' +
    '..WWWWWWWWWWWW..' +
    '..LWWWWWWWWWWL..' +
    '...LWWWWWWWWL...' +
    '....LLWWWWLL....' +
    '.....WWLLWW.....' +
    '......WWWW......' +
    '................', BOO_PAL);

  const BEETLE_1 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBSBBSBBB...' +
    '..BBBKBBBBKBBB..' +
    '..BBKWBBBBWKBB..' +
    '..BBLBBBBBBLLBB.' +
    '.BBBLLLLLLLLBBB.' +
    '.BBBBBBBBBBBBB..' +
    '.BBBLLLLLLBBBB..' +
    '..BBBBBBBBBBB...' +
    '..BBBBBBBBBB....' +
    '...BBBBBBBBB....' +
    '....BBBBBBB.....' +
    '..TTTBBBBBTTT...' +
    '.TTTTT..TTTTT...' +
    'TTTTT....TTTTT..', BEETLE_PAL);

  const BEETLE_2 = parse(16, 16,
    '......BBBB......' +
    '....BBBBBBBB....' +
    '...BBBSBBSBBB...' +
    '..BBBKBBBBKBBB..' +
    '..BBKWBBBBWKBB..' +
    '..BBLBBBBBBLLBB.' +
    '.BBBLLLLLLLLBBB.' +
    '.BBBBBBBBBBBBB..' +
    '.BBBLLLLLLBBBB..' +
    '..BBBBBBBBBBB...' +
    '..BBBBBBBBBB....' +
    '...BBBBBBBBB....' +
    '...TBBBBBBBTT...' +
    '..TTTTBBBBTTTT..' +
    '.TTTTT..TTTTT...' +
    '.TTTT....TTTT...', BEETLE_PAL);

  const BEETLE_SHELL = parse(16, 12,
    '....BBBBBBBB....' +
    '..BBBBSSSSBBBB..' +
    '.BBBBSSSSSSBBBB.' +
    'BBBBLLLLLLLLLBBB' +
    'BBBBBBBBBBBBBBB.' +
    'BBBBLLLLLLLBBBB.' +
    '.BBBBBBBBBBBBBB.' +
    '.BBBBLLLLLBBBBB.' +
    '..BBBBBBBBBBBB..' +
    '...BBBBBBBBBB...' +
    '....BBBBBBBB....' +
    '................', BEETLE_PAL);

  const BOBOMB_1 = parse(16, 16,
    '.......YR.......' +
    '......YY........' +
    '.....BBBB.......' +
    '...BBBBBBBB.....' +
    '..BBBBBBBBBB....' +
    '..BBWBBBWBBBB...' +
    '.BBBWBBBWBBBBB..' +
    '.BBBBBBBBBBBBB..' +
    '.BBBBDDDDBBBB...' +
    '.BBBDDDDDDBBBB..' +
    '..BBBBBBBBBBBB..' +
    '..BBBBBBBBBBB...' +
    '...BBBBBBBBB....' +
    '..FFFBBBBFFF....' +
    '.FFFFF..FFFFF...' +
    'FFFFF....FFFFF..', BOBOMB_PAL);

  const BOBOMB_2 = parse(16, 16,
    '......YR........' +
    '.....YY.........' +
    '.....BBBB.......' +
    '...BBBBBBBB.....' +
    '..BBBBBBBBBB....' +
    '..BBWBBBWBBBB...' +
    '.BBBWBBBWBBBBB..' +
    '.BBBBBBBBBBBBB..' +
    '.BBBBDDDDBBBB...' +
    '.BBBDDDDDDBBBB..' +
    '..BBBBBBBBBBBB..' +
    '..BBBBBBBBBBB...' +
    '...BBBBBBBBB....' +
    '..FFFBBBBFFF....' +
    '.FFFFF..FFFFF...' +
    '.FFFF....FFFF...', BOBOMB_PAL);

  // ===== GEM SPRITES =====

  const GEM_PAL = {
    D: '#0000CC', // dark blue
    B: '#4444FF', // blue
    L: '#8888FF', // light blue
    W: '#FFFFFF', // white highlight
  };

  const GEM_1 = parse(16, 16,
    '......DDDD......' +
    '.....DBBBBDD....' +
    '....DBWBBBBDD...' +
    '...DBBWBBBBBD...' +
    '..DBBBWBBBBBBD..' +
    '.DBBBBWBBBBBBBD.' +
    'DBBBBBWBBBBBBBBD' +
    'DBBBBBBBBBBBBBD.' +
    '.DBBBBBBBBBBBBD.' +
    '..DBBBBBBBBBD...' +
    '...DBBBBBBBBD...' +
    '....DBBBBBBD....' +
    '.....DBBBD......' +
    '......DBD.......' +
    '.......D........' +
    '................', GEM_PAL);

  const GEM_2 = parse(16, 16,
    '......DDDD......' +
    '.....DLLLLD.....' +
    '....DLWLLLLD....' +
    '...DLLWLLLLD....' +
    '..DLLLWLLLLLLD..' +
    '.DLLLLWLLLLLLD..' +
    'DLLLLLWLLLLLLLLD' +
    'DLLLLLLLLLLLLLD.' +
    '.DLLLLLLLLLLLLD.' +
    '..DLLLLLLLLLD...' +
    '...DLLLLLLLLD...' +
    '....DLLLLLD.....' +
    '.....DLLLD......' +
    '......DLD.......' +
    '.......D........' +
    '................', GEM_PAL);

  // ===== TILE SPRITES (16x16) =====

  const TILE_GROUND = parse(16, 16,
    'TTTTTTTTTTTTTTTT' +
    'TgTTTTTgTTTTTgTT' +
    'ggTTTTggTTTTggTT' +
    'LLLLLLLLLLLLLLLL' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'DDDDDDDDDDDDDDDD' +
    'GGGGGGDDGGGGGDD' +
    'GGGGGGGDDGGGGGDD' +
    'GGGGGGGDDGGGGGDD' +
    'DDDDDDDDDDDDDDDD' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'DDDDDDDDDDDDDDDD', TILE_PAL);

  const TILE_GROUND_PLAIN = parse(16, 16,
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'DDDDDDDDDDDDDDDD' +
    'GGGGGGDDGGGGGDGG' +
    'GGGGGGDDGGGGGDGG' +
    'GGGGGGDDGGGGGDGG' +
    'DDDDDDDDDDDDDDDD' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'GGGDDGGGGGDDGGGG' +
    'DDDDDDDDDDDDDDDD' +
    'GGGGGGDDGGGGGDGG' +
    'GGGGGGDDGGGGGDGG' +
    'GGGGGGDDGGGGGDGG' +
    'DDDDDDDDDDDDDDDD', TILE_PAL);

  const TILE_BRICK = parse(16, 16,
    'LLBBBBDLLBBBBDLL' +
    'LLBBBBDLLBBBBDLL' +
    'LLBBBBDLLBBBBDLL' +
    'DDDDDDDDDDDDDDDD' +
    'BBDLLBBBBDLLBBBB' +
    'BBDLLBBBBDLLBBBB' +
    'BBDLLBBBBDLLBBBB' +
    'DDDDDDDDDDDDDDDD' +
    'LLBBBBDLLBBBBDLL' +
    'LLBBBBDLLBBBBDLL' +
    'LLBBBBDLLBBBBDLL' +
    'DDDDDDDDDDDDDDDD' +
    'BBDLLBBBBDLLBBBB' +
    'BBDLLBBBBDLLBBBB' +
    'BBDLLBBBBDLLBBBB' +
    'DDDDDDDDDDDDDDDD', BRICK_PAL);

  const TILE_QUESTION = parse(16, 16,
    'KKKKKKKKKKKKKKKK' +
    'KYYYYYYYYYYYYYYY' +
    'KYWWWWWWWWWWWWYD' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDDDQDDDDYD' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDQQDDDDDY D' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDDDDDDDDYD' +
    'KYWDDDDQQDDDDYD' +
    'KYWDDDDDDDDDDYD' +
    'KYYDDDDDDDDDDYYD' +
    'KYYYYYYYYYYYYYYY' +
    'DDDDDDDDDDDDDDDD', Q_PAL);

  const TILE_QUESTION_EMPTY = parse(16, 16,
    'KKKKKKKKKKKKKKKK' +
    'KDDDDDDDDDDDDDD' +
    'KDKKKKKKKKKKKKDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKDDDDDDDDKDDD' +
    'KDKKKKKKKKKKKKDD' +
    'KDDDDDDDDDDDDDD' +
    'DDDDDDDDDDDDDDDD', Q_PAL);

  const TILE_PIPE_TL = parse(16, 16,
    'DDDDDDDDDDDDDDDD' +
    'DLLLLLLLLLLLLLLLD' +
    'DLGGGGGGGGGGGGLD' +
    'DLGGGGGGGGGGGGLD' +
    'DLGGGGGGGGGGGGLD' +
    'DLLLLLLLLLLLLLLLD' +
    'DDDDDDDDDDDDDDDD' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..', PIPE_PAL);

  const TILE_PIPE_BL = parse(16, 16,
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..' +
    '..DLGGGGGGGGLD..', PIPE_PAL);

  const TILE_PLATFORM = parse(16, 8,
    'PPPPPPPPPPPPPPPP' +
    'PDDDDDDDDDDDDDLP' +
    'PLLLLLLLLLLLLLLL' +
    'PDDDDDDDDDDDDDLP' +
    'PPPPPPPPPPPPPPPP' +
    '................' +
    '................' +
    '................', PLATFORM_PAL);

  const TILE_ICE = parse(16, 16,
    'WWLLLLLLLLLLLLWW' +
    'WLIIIIIIIIIIILW' +
    'LIIIIIIIIIIIIIIL' +
    'LIIWIIIIIIIWIIIL' +
    'LIIIIIIIIIIIIIIL' +
    'LIIIIIWIIIIIIIIL' +
    'LIIIIIIIIIIIIIIL' +
    'LIIIIIIIIWIIIIIL' +
    'LIIIWIIIIIIIIIIL' +
    'LIIIIIIIIIIIIIIL' +
    'LIIIIIIIIIWIIIIL' +
    'LIIIIIIIIIIIIIIL' +
    'LIIWIIIIIIIIIIIL' +
    'LIIIIIIIIIIIIIIL' +
    'DLIIIIIIIIIIIIID' +
    'DDDDDDDDDDDDDDDD', ICE_PAL);

  const TILE_LAVA = parse(16, 16,
    'YYYYYOOOOYYYYYY' +
    'OOOYRRRRRROOOOY' +
    'RROORRRRRRRROOR' +
    'RRRRRRRRRRRRRRRR' +
    'RRRRRRRRRRRRRRRR' +
    'DRRRRRRRRRRRRRRD' +
    'DDRRRRRRRRRRRDD' +
    'DDDRRRRRRRRRDDD' +
    'DDDDRRRRRRRDDDD' +
    'DDDDDRRRRRDDDDD' +
    'DDDDDDRRRRDDDDDD' +
    'DDDDDDDRRRDDDDD' +
    'DDDDDDDDDDDDDDDD' +
    'DDDDDDDDDDDDDDDD' +
    'DDDDDDDDDDDDDDDD' +
    'DDDDDDDDDDDDDDDD', LAVA_PAL);

  const TILE_CASTLE = parse(16, 16,
    'LLGGGGDLLGGGGDLL' +
    'LLGGGGDLLGGGGDLL' +
    'LLGGGGDLLGGGGDLL' +
    'DDDDDDDDDDDDDDDD' +
    'GGDLLGGGGDLLGGGG' +
    'GGDLLGGGGDLLGGGG' +
    'GGDLLGGGGDLLGGGG' +
    'DDDDDDDDDDDDDDDD' +
    'LLGGGGDLLGGGGDLL' +
    'LLGGGGDLLGGGGDLL' +
    'LLGGGGDLLGGGGDLL' +
    'DDDDDDDDDDDDDDDD' +
    'GGDLLGGGGDLLGGGG' +
    'GGDLLGGGGDLLGGGG' +
    'GGDLLGGGGDLLGGGG' +
    'DDDDDDDDDDDDDDDD', CASTLE_PAL);

  const TILE_CLOUD = parse(16, 16,
    '................' +
    '................' +
    '.....WWWW.......' +
    '...WWWWWWWW.....' +
    '..WWLWWWWLWW....' +
    '.WWWWWWWWWWWW...' +
    'WWWWWWWWWWWWWW..' +
    'WWWWWWWWWWWWWWW.' +
    'LWWWWWWWWWWWWWWL' +
    'LLWWWWWWWWWWWWLL' +
    '.LLLLLLLLLLLLLL.' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................', CLOUD_PAL);

  // ===== ITEM SPRITES =====

  const COIN_1 = parse(16, 16,
    '......YYYY......' +
    '....YYYYYYYY....' +
    '...YYWYYYYWYY...' +
    '..YYWYYYYYYWYY..' +
    '..YYYDDDDDYYY..' +
    '.YYYYDDDDDDYYYY.' +
    '.YYYYDDDDDDYYYY.' +
    '.YYYYDDDDDDYYYY.' +
    '.YYYYDDDDDDYYYY.' +
    '.YYYYDDDDDDYYYY.' +
    '.YYYYDDDDDDYYYY.' +
    '..YYYDDDDDYYY..' +
    '..YYDYYYYYYDY Y..' +
    '...YYDYYYYDYY...' +
    '....YYYYYYYY....' +
    '......YYYY......', COIN_PAL);

  const COIN_2 = parse(16, 16,
    '.......YY.......' +
    '......YYYY......' +
    '.....YYWWYY.....' +
    '.....YYWWYY.....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '....YYYDDYYY....' +
    '.....YYDYY......' +
    '.....YYDYY......' +
    '......YYYY......' +
    '.......YY.......', COIN_PAL);

  const FLAG_SPRITE = parse(16, 48,
    '.......YY.......' +
    '.......YY.......' +
    '.RRRRRRGD.......' +
    '..RRRRRRGD......' +
    '...RRRRGD.......' +
    '....RRRGD.......' +
    '.....RRGD.......' +
    '......RGD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '.......GD.......' +
    '......GGGG......' +
    '.....GGGGGG.....', FLAG_PAL);

  // ===== POWER-UP SPRITES =====

  const POWERUP_ICE = parse(16, 16,
    '......IIII......' +
    '....IILLLLII....' +
    '...ILLWWWWLLI...' +
    '..ILWWWWWWWLI...' +
    '..ILWWIIWWWLI...' +
    '.IILWWWWWWWLII.' +
    '.IILWWWWWWWLII.' +
    '.IILLWWWWWLLII.' +
    '.IIILLWWWLLLII.' +
    '.IIIILLLLLIIII.' +
    '..IIIIIIIIIIII..' +
    '..IIIIIIIIIIII..' +
    '...IIIIIIIIII...' +
    '...IIIIIIIIII...' +
    '....IIIIIIII....' +
    '......IIII......', POWERUP_PAL);

  const POWERUP_FIRE = parse(16, 16,
    '......YYYY......' +
    '....YYOOOYY.....' +
    '...YOORRROOYY...' +
    '..YOORRRRROOY...' +
    '..YORRRRRRROY...' +
    '.YYORRRRRROYY...' +
    '.YYOORRRRROOYY..' +
    '.YYYOORRROOYYYY.' +
    '.YYYYOOOOOYYYYY.' +
    '.YYYYYYYYYYYYYYY.' +
    '..YYYYYYYYYYYYY..' +
    '..YYYYYYYYYYYYY..' +
    '...YYYYYYYYYYY...' +
    '...YYYYYYYYYYY...' +
    '....YYYYYYYYY....' +
    '......YYYYY.....', POWERUP_PAL);

  const POWERUP_WINGS = parse(16, 16,
    '...ww......ww...' +
    '..wwww..wwww....' +
    '.wwBBwwwwBBww...' +
    '.wBBBBwwBBBBw...' +
    'wwBBBBBBBBBBww..' +
    'wwBBBGGGGBBBww..' +
    '.wwBGGGGGGBww...' +
    '.wwGGGGGGGGww...' +
    '..wGGGGGGGGw....' +
    '..wGGGGGGGGw....' +
    '...wGGGGGGw.....' +
    '...wwGGGGww.....' +
    '....wwGGww......' +
    '.....wwww.......' +
    '......ww........' +
    '................', POWERUP_PAL);

  const POWERUP_STAR = parse(16, 16,
    '.......SS.......' +
    '......SSSS......' +
    '......SSSS......' +
    '.....SSSSSS.....' +
    '.....SSKSSS.....' +
    'SSSSSSSSSSSSSSSS' +
    '.SSSSSSSSSSSSSSS' +
    '..SSSSSSSSSSSS..' +
    '...SSSSSSSSSS...' +
    '...SSSSSSSSSS...' +
    '..SSSSSSSSSSSS..' +
    '..SSSS....SSSS..' +
    '.SSSS......SSSS.' +
    '.SSS........SSS.' +
    '.SS..........SS.' +
    '................', POWERUP_PAL);

  const POWERUP_MUSHROOM = parse(16, 16,
    '....MMMMMMMM....' +
    '..MMMmWWWWmMMM..' +
    '.MMmWWWWWWWWmMM.' +
    '.MmWWWWMMWWWWmM.' +
    'MMWWWWMMMMWWWWMM' +
    'MMWWWMMMMMWWWWMM' +
    'MMMWWMMMMMMWWmMM' +
    'MMmMMMMMMMMMmMMM' +
    '.MMMmmmmmmmMMM..' +
    '..TTTTTTTTTTTT..' +
    '..TTTTTTTTTTTT..' +
    '..TTtTTTTTTtTT..' +
    '..TTtTTTTTTtTT..' +
    '..TTtTTTTTTtTT..' +
    '...TTTTTTTTTT...' +
    '....TTTTTTTT....', POWERUP_PAL);

  const POWERUP_MAGNET = parse(16, 16,
    '..RRRR....RRRR..' +
    '.RRRRRR..RRRRRR.' +
    '.RR..RR..RR..RR.' +
    '.RR..RR..RR..RR.' +
    '.RR..RRRRRR..RR.' +
    '.RR..RRRRRR..RR.' +
    '.RR...RRRR...RR.' +
    '..RR..RRRR..RR..' +
    '..RR..RRRR..RR..' +
    '..LLLLLLLLLLLL..' +
    '...LLLLLLLLLL...' +
    '...LLLLLLLLLL...' +
    '....LLLLLLLL....' +
    '....LLLLLLLL....' +
    '.....LLLLLL.....' +
    '......LLLL......', POWERUP_PAL);

  const POWERUP_SHIELD = parse(16, 16,
    '......IIII......' +
    '....IILLLLII....' +
    '...ILLLLLLLLLI..' +
    '..ILLWWWWWWWLLI.' +
    '..ILWWWWWWWWLI..' +
    '.IILWWWWWWWWLII.' +
    '.IILWWWWWWWWLII.' +
    '.IILLWWWWWWLLII.' +
    '.IIILLWWWWLLLII.' +
    '..IIILLWWLLLII..' +
    '..IIIILLLLLIIII.' +
    '...IIIIIIIIII...' +
    '....IIIIIIII....' +
    '.....IIIIII.....' +
    '......IIII......' +
    '.......II.......', POWERUP_PAL);

  const POWERUP_SPEED = parse(16, 16,
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
    '................', POWERUP_PAL);

  const POWERUP_POTION = parse(16, 16,
    '......gggg......' +
    '.....gggggg.....' +
    '.....gg..gg.....' +
    '.....gggggg.....' +
    '....PPppppPP....' +
    '...PPpppppPPP...' +
    '..PPppppppppPP..' +
    '..PPpppDDpppPP..' +
    '.PPppDDDDDpppPP.' +
    '.PPppDDDDDpppPP.' +
    '.PPpppDDDppppPP.' +
    '..PPppppppppPP..' +
    '..PPPppppppPPP..' +
    '...PPPppppPPP...' +
    '....PPPPPPPP....' +
    '.....PPPPPP.....', POWERUP_PAL);

  // ===== PROJECTILE SPRITES (8x8) =====

  const PROJ_ICE = parse(8, 8,
    '..IIII..' +
    '.IWWWWI.' +
    'IWWLLWWI' +
    'IWLLLWWI' +
    'IWWLLWWI' +
    'IWWWWWWI' +
    '.IWWWWI.' +
    '..IIII..', PROJ_PAL);

  const PROJ_FIRE = parse(8, 8,
    '..YYYY..' +
    '.YOOORY.' +
    'YORRRRRY' +
    'YORRRRRY' +
    'YORRRRRY' +
    'YORRRRRY' +
    '.YOORRY.' +
    '..YYYY..', PROJ_PAL);

  const PROJ_POTION = parse(8, 8,
    '..PPPP..' +
    '.PPppPP.' +
    'PPppppPP' +
    'PpppDpPP' +
    'PppDDppP' +
    'PPppppPP' +
    '.PPppPP.' +
    '..PPPP..', PROJ_PAL);

  // ===== ANIMATION GROUPS =====

  const ANIMS = {
    mario: {
      idle: [MARIO_IDLE],
      run:  [MARIO_RUN1, MARIO_IDLE, MARIO_RUN2, MARIO_IDLE],
      jump: [MARIO_JUMP],
      shoot: [MARIO_SHOOT],
      bigIdle: [MARIO_BIG_IDLE],
      bigRun: [MARIO_BIG_RUN1, MARIO_BIG_IDLE],
      bigJump: [MARIO_BIG_JUMP],
    },
    luigi: {
      idle: [LUIGI_IDLE],
      run:  [LUIGI_RUN1, LUIGI_IDLE, LUIGI_RUN2, LUIGI_IDLE],
      jump: [LUIGI_JUMP],
      shoot: [LUIGI_SHOOT],
      bigIdle: [LUIGI_BIG_IDLE],
      bigRun: [LUIGI_BIG_RUN1, LUIGI_BIG_IDLE],
      bigJump: [LUIGI_BIG_JUMP],
    },
    toad: {
      idle: [TOAD_IDLE],
      run:  [TOAD_RUN1, TOAD_IDLE, TOAD_RUN2, TOAD_IDLE],
      jump: [TOAD_JUMP],
      shoot: [TOAD_SHOOT],
      bigIdle: [TOAD_BIG_IDLE],
      bigRun: [TOAD_BIG_RUN1, TOAD_BIG_IDLE],
      bigJump: [TOAD_BIG_JUMP],
    },
    peach: {
      idle: [PEACH_IDLE],
      run:  [PEACH_RUN1, PEACH_IDLE, PEACH_RUN2, PEACH_IDLE],
      jump: [PEACH_JUMP],
      shoot: [PEACH_SHOOT],
      bigIdle: [PEACH_BIG_IDLE],
      bigRun: [PEACH_BIG_RUN1, PEACH_BIG_IDLE],
      bigJump: [PEACH_BIG_JUMP],
    },
    goomba: {
      walk: [GOOMBA_1, GOOMBA_2],
      squash: [GOOMBA_SQUASH],
    },
    koopa: {
      fly: [KOOPA_FLY1, KOOPA_FLY2],
    },
    piranha: {
      bite: [PIRANHA_1, PIRANHA_2],
    },
    boo: {
      normal: [BOO_NORMAL],
      shy: [BOO_SHY],
    },
    beetle: {
      walk: [BEETLE_1, BEETLE_2],
      shell: [BEETLE_SHELL],
    },
    bobomb: {
      walk: [BOBOMB_1, BOBOMB_2],
    },
    gem: {
      sparkle: [GEM_1, GEM_2, GEM_1, GEM_2],
    },
    coin: {
      spin: [COIN_1, COIN_2, COIN_1, COIN_2],
    },
  };

  // ===== TILE MAP (tileId → sprite) =====
  // Multiple variants per level theme can be added later
  const TILE_MAP = {
    1: TILE_GROUND,
    2: TILE_BRICK,
    3: TILE_QUESTION,
    4: TILE_QUESTION,  // question_power looks same
    5: TILE_PIPE_TL,
    6: TILE_PIPE_TL,   // mirror for right side
    7: TILE_PIPE_BL,
    8: TILE_PIPE_BL,
    9: TILE_PLATFORM,
    10: TILE_ICE,
    11: TILE_LAVA,
    12: TILE_CASTLE,
    13: TILE_CLOUD,
    15: TILE_GROUND_PLAIN, // sub-ground (no grass top)
  };

  return {
    ANIMS,
    TILE_MAP,
    TILE_QUESTION_EMPTY,
    POWERUP_ICE,
    POWERUP_FIRE,
    POWERUP_WINGS,
    POWERUP_STAR,
    POWERUP_MUSHROOM,
    POWERUP_MAGNET,
    POWERUP_SHIELD,
    POWERUP_SPEED,
    POWERUP_POTION,
    PROJ_ICE,
    PROJ_FIRE,
    PROJ_POTION,
    FLAG: FLAG_SPRITE,
    flipH,
  };
})();
