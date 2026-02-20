/**
 * Pixel art sprite data for Sonic Dash.
 * All sprites are defined as compact string templates + color palettes.
 * No external image files needed.
 */
const SPRITES = (() => {

  function parse(w, h, template, palette) {
    const pixels = template.replace(/[|\n]/g, '').split('').map(c =>
      c === '.' ? null : (palette[c] || null)
    );
    return { w, h, pixels };
  }

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

  function recolor(sprite, fromPal, toPal) {
    const colorMap = {};
    for (const key of Object.keys(fromPal)) {
      if (fromPal[key] && toPal[key]) colorMap[fromPal[key]] = toPal[key];
    }
    return {
      w: sprite.w, h: sprite.h,
      pixels: sprite.pixels.map(c => c ? (colorMap[c] || c) : null),
    };
  }

  // ===== CHARACTER PALETTES =====

  const SONIC_PAL = {
    B: '#1565C0', // blue body
    D: '#0D47A1', // dark blue
    S: '#FFB74D', // skin (muzzle, belly, arms)
    W: '#FFFFFF', // white (eyes, gloves)
    K: '#1A1A1A', // black (eyes, outline)
    G: '#4CAF50', // green (eyes)
    R: '#E52521', // red (shoes)
    Y: '#FFD740', // yellow (shoe buckle)
    L: '#C62828', // dark red (shoe shadow)
  };

  const TAILS_PAL = {
    B: '#FF8F00', // orange body
    D: '#E65100', // dark orange
    S: '#FFE0B2', // cream white (belly, muzzle)
    W: '#FFFFFF', // white (eyes, gloves, tail tip)
    K: '#1A1A1A', // black
    G: '#42A5F5', // blue (eyes)
    R: '#E52521', // red (shoes)
    Y: '#FFD740', // yellow
    L: '#C62828', // dark red
  };

  const KNUCKLES_PAL = {
    B: '#E52521', // red body
    D: '#B71C1C', // dark red
    S: '#FFCC80', // peach (muzzle)
    W: '#FFFFFF', // white (eyes, gloves, chest mark)
    K: '#1A1A1A', // black
    G: '#7B1FA2', // purple (eyes)
    R: '#4CAF50', // green (shoes)
    Y: '#FFD740', // yellow (shoe buckle)
    L: '#2E7D32', // dark green
  };

  const SHADOW_PAL = {
    B: '#212121', // black body
    D: '#000000', // pure black
    S: '#FFCC80', // skin (muzzle)
    W: '#FFFFFF', // white (eyes, chest tuft)
    K: '#1A1A1A', // dark
    G: '#E52521', // red (eyes, stripes)
    R: '#E52521', // red (hover shoes)
    Y: '#FFD740', // yellow (rings on shoes)
    L: '#C62828', // dark red
  };

  const AMY_PAL = {
    B: '#FF4081', // pink body
    D: '#C51162', // dark pink
    S: '#FFCC80', // skin
    W: '#FFFFFF', // white
    K: '#1A1A1A', // black
    G: '#4CAF50', // green (eyes)
    R: '#E52521', // red (dress, shoes, headband)
    Y: '#FFD740', // yellow
    L: '#C62828', // dark red
  };

  // ===== SONIC SPRITES (16x16) =====

  const SONIC_IDLE = parse(16, 16,
    '....DBBBD.......' +
    '...DBBBBBD......' +
    '..DBBBBBBBDD....' +
    '..BWKWBBBBBDD...' +
    '..BWGKSSBBBBDD..' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '...BBBBBB.......' +
    '..WWBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...BB..BB.......' +
    '..RR....RR......' +
    '.RRYR..RRYRL....' +
    '.LLL....LLLL....', SONIC_PAL);

  const SONIC_RUN1 = parse(16, 16,
    '...DBBBD........' +
    '..DBBBBBD.......' +
    '.DBBBBBBBDD.....' +
    '.BWKWBBBBBDD....' +
    '.BWGKSSBBBBDD...' +
    '.BKKSSSSBB......' +
    '..BSSSBBB.......' +
    '..BBBBBBB.......' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...RR..BB.......' +
    '..RRYR..RR......' +
    '..LLL..RRYR.....' +
    '........LLL.....', SONIC_PAL);

  const SONIC_RUN2 = parse(16, 16,
    '...DBBBD........' +
    '..DBBBBBD.......' +
    '.DBBBBBBBDD.....' +
    '.BWKWBBBBBDD....' +
    '.BWGKSSBBBBDD...' +
    '.BKKSSSSBB......' +
    '..BSSSBBB.......' +
    '..BBBBBBB.......' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '..BB..RR........' +
    '.RR..RRYR.......' +
    'RRYR..LLL.......' +
    '.LLL...........', SONIC_PAL);

  const SONIC_JUMP = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '...DDDDDDD......' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', SONIC_PAL);

  const SONIC_SPIN1 = parse(16, 16,
    '................' +
    '....BBBBBB......' +
    '...BDDDDDDBB...' +
    '..BDBBBBBBBDB...' +
    '..BDBBBBBBBD....' +
    '.BBBBBBBBBBBBB..' +
    '.BBDBBBBBBDBBB..' +
    '..BDDDDDDDDBB..' +
    '..BBBBBBBBBBB...' +
    '.BDBBBBBBBDBB...' +
    '..BDBBBBBBBD....' +
    '...BDDDDDDBB...' +
    '....BBBBBB......' +
    '................' +
    '................' +
    '................', SONIC_PAL);

  const SONIC_SPIN2 = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBD.....' +
    '..DBBBBBBBD.....' +
    '..DBDDDDDBD....' +
    '.DDBBBBBBBDD....' +
    '.DDBBBBBBDDDD...' +
    '..DDDDDDDDDD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '..DBDDDDDBD....' +
    '...DBBBBBBBD....' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', SONIC_PAL);

  const SONIC_SPINDASH = parse(16, 16,
    '................' +
    '................' +
    '....DBBBD.......' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '...DDDDDDD......' +
    '....DBBBD.......' +
    '...RR..RR.......' +
    '..LLL..LLL......' +
    '................', SONIC_PAL);

  const SONIC_SKID = parse(16, 16,
    '....DBBBD.......' +
    '...DBBBBBD......' +
    '..DBBBBBBBDD....' +
    '..BWKWBBBBBDD...' +
    '..BWGKSSBBBBDD..' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '...BBBBBB.......' +
    '..WWBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '...BBBBB........' +
    '...RRBB.........' +
    '..RRYRRR........' +
    '.LLLRRYR........' +
    '......LLL.......', SONIC_PAL);

  const SONIC_HURT = parse(16, 16,
    '....DBBBD.......' +
    '...DBBBBBD......' +
    '..DBBBBBBBDD....' +
    '..BWKWBBBBBDD...' +
    '..BGKGSSBBBBDD..' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '..WBBBBBBW......' +
    '.WWBBSSBWW......' +
    '..WBBBBBW.......' +
    '...BBBBB........' +
    '..BB...BB.......' +
    '.RR.....RR......' +
    'RRYR...RRYR.....' +
    '.LLL...LLL......' +
    '................', SONIC_PAL);

  const SONIC_CROUCH = parse(16, 16,
    '................' +
    '................' +
    '................' +
    '................' +
    '....DBBBD.......' +
    '...DBBBBBD......' +
    '..DBBBBBBBDD....' +
    '..BWKWBBBBBDD...' +
    '..BWGKSSBBBBDD..' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '...BBBBBB.......' +
    '..BBBBBBB.......' +
    '..RR...RR.......' +
    '.RRYR.RRYR......' +
    '.LLL..LLL.......', SONIC_PAL);

  const SONIC_LOOKUP = parse(16, 16,
    '..DBBBD.........' +
    '.DBBBBBD........' +
    'DBBBBBBBDD......' +
    'BWKWBBBBBDD.....' +
    'BWGKSSBBBBDD....' +
    'BKKSSSSBB.......' +
    '.BSSSBBB........' +
    '.BBBBBB.........' +
    'WWBSSBB.........' +
    'WWBSSBWW........' +
    '.BBBBBWW........' +
    '..BBBB..........' +
    '.BB..BB.........' +
    'RR....RR........' +
    'RRYR..RRYR......' +
    'LLL...LLL.......', SONIC_PAL);

  // ===== TAILS SPRITES (16x16) =====

  const TAILS_IDLE = parse(16, 16,
    '....BBB.........' +
    '...BBBBB........' +
    '..BBBBBBB.......' +
    '..BWKWBBB.......' +
    '..BWGKSSBBD.....' +
    '..BKKSSSBBDW....' +
    '...BSSBBBBDW....' +
    '...BBBBB..WW....' +
    '..WWBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...BB..BB.......' +
    '..RR....RR......' +
    '.RRYR..RRYR.....' +
    '.LLL....LLL.....', TAILS_PAL);

  const TAILS_RUN1 = parse(16, 16,
    '...BBB..........' +
    '..BBBBB.........' +
    '.BBBBBBB........' +
    '.BWKWBBB........' +
    '.BWGKSSBBD......' +
    '.BKKSSSBBDW.....' +
    '..BSSBBBBDW.....' +
    '..BBBBB..WW.....' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...RR..BB.......' +
    '..RRYR..RR......' +
    '..LLL..RRYR.....' +
    '........LLL.....', TAILS_PAL);

  const TAILS_RUN2 = parse(16, 16,
    '...BBB..........' +
    '..BBBBB.........' +
    '.BBBBBBB........' +
    '.BWKWBBB........' +
    '.BWGKSSBBD......' +
    '.BKKSSSBBDW.....' +
    '..BSSBBBBDW.....' +
    '..BBBBB..WW.....' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '..BB..RR........' +
    '.RR..RRYR.......' +
    'RRYR..LLL.......' +
    '.LLL............', TAILS_PAL);

  const TAILS_JUMP = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '...DDDDDDD......' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', TAILS_PAL);

  const TAILS_FLY1 = parse(16, 16,
    '...BBB..........' +
    '..BBBBB.........' +
    '.BBBBBBB........' +
    '.BWKWBBB........' +
    '.BWGKSSBBD......' +
    '.BKKSSSBB.......' +
    '..BSSSBBB.......' +
    '..BBBBBBB.......' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '...BBBBB.DW.....' +
    '..RR..RRDWW.....' +
    '.RRYR.RRYR......' +
    '.LLL..LLL.......' +
    '................', TAILS_PAL);

  const TAILS_FLY2 = parse(16, 16,
    '...BBB..........' +
    '..BBBBB.........' +
    '.BBBBBBB........' +
    '.BWKWBBB........' +
    '.BWGKSSBBD......' +
    '.BKKSSSBB.......' +
    '..BSSSBBB.......' +
    '..BBBBBBB.......' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '...BBB.DW.......' +
    '..RR..DWW.......' +
    '.RRYR.RRYR......' +
    '.LLL..LLL.......' +
    '................', TAILS_PAL);

  // ===== KNUCKLES SPRITES (16x16) =====

  const KNUCKLES_IDLE = parse(16, 16,
    '...DBBBBD.......' +
    '..DBBBBBBDD.....' +
    '..BBBBBBBBD.....' +
    '..BWKWBBBD......' +
    '..BWGKSSBBB.....' +
    '..BKKSSSSBB.....' +
    '...BWSSBBB......' +
    '...BBBBBBB......' +
    '..WWBSSBBWW.....' +
    '..WWBSSBWWW.....' +
    '...BBBBBWWW.....' +
    '....BBBB........' +
    '...BB..BB.......' +
    '..RR....RR......' +
    '.RRYR..RRYR.....' +
    '.LLL....LLL.....', KNUCKLES_PAL);

  const KNUCKLES_RUN1 = parse(16, 16,
    '..DBBBBD........' +
    '.DBBBBBBDD......' +
    '.BBBBBBBBD......' +
    '.BWKWBBBD.......' +
    '.BWGKSSBBB......' +
    '.BKKSSSSBB......' +
    '..BWSSBBB.......' +
    '..BBBBBBB.......' +
    '.WWBBSSBB.......' +
    '..WWBSSBWWW.....' +
    '...BBBBBWWW.....' +
    '....BBBB........' +
    '...RR..BB.......' +
    '..RRYR..RR......' +
    '..LLL..RRYR.....' +
    '........LLL.....', KNUCKLES_PAL);

  const KNUCKLES_JUMP = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '...DDDDDDD......' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', KNUCKLES_PAL);

  const KNUCKLES_GLIDE = parse(16, 16,
    '..DBBBBD........' +
    '.DBBBBBBDD......' +
    '.BBBBBBBBD......' +
    '.BWKWBBBD.......' +
    '.BWGKSSBBB......' +
    '.BKKSSSSBB......' +
    '..BWSSBBB.......' +
    '..BBBBBBB.......' +
    'WWWBBSSBB.......' +
    'WWWWBSSBBB......' +
    'WWWWBBBBBBB.....' +
    '....BBBBB.......' +
    '...RR..RR.......' +
    '..RRYR.RRYR.....' +
    '..LLL..LLL......' +
    '................', KNUCKLES_PAL);

  const KNUCKLES_CLIMB = parse(16, 16,
    '...DBBBBD.......' +
    '..DBBBBBBDD.....' +
    '..BBBBBBBBD.....' +
    '..BWKWBBBD......' +
    '..BWGKSSBBB.....' +
    '..BKKSSSSBB.....' +
    '...BWSSBBB......' +
    '..WWBBBBB.......' +
    '.WWWBSSBB.......' +
    '.WWWBSSBB.......' +
    '...BBBBB........' +
    '...BBBBB........' +
    '..RR..RR........' +
    '.RRYR.RRYR......' +
    '.LLL..LLL.......' +
    '................', KNUCKLES_PAL);

  // ===== SHADOW SPRITES (16x16) =====

  const SHADOW_IDLE = parse(16, 16,
    '....DBBBD.......' +
    '...DBBBBBD......' +
    '..DBGBBBGBDD....' +
    '..BWKWBBBBBDD...' +
    '..BWGKSSBBBBDD..' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '...BWBBBB.......' +
    '..WWBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...BB..BB.......' +
    '..RR....RR......' +
    '.RRYRL.RRYRL....' +
    '.LLL....LLL.....', SHADOW_PAL);

  const SHADOW_RUN1 = parse(16, 16,
    '...DBBBD........' +
    '..DBBBBBD.......' +
    '.DBGBBBGBDD.....' +
    '.BWKWBBBBBDD....' +
    '.BWGKSSBBBBDD...' +
    '.BKKSSSSBB......' +
    '..BSSSBBB.......' +
    '..BWBBBB........' +
    '.WWBBSSBB.......' +
    '..WWBSSBWW......' +
    '...BBBBBWW......' +
    '....BBBB........' +
    '...RR..BB.......' +
    '..RRYRL.RR......' +
    '..LLL..RRYRL....' +
    '........LLL.....', SHADOW_PAL);

  const SHADOW_JUMP = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBDD....' +
    '..DBGBBBBGBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '...DDDDDDD......' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', SHADOW_PAL);

  // ===== AMY SPRITES (16x16) =====

  const AMY_IDLE = parse(16, 16,
    '...RRRR.........' +
    '...DBBBD........' +
    '..DBBBBBD.......' +
    '..BBBBBBB.......' +
    '..BWKWBBB.......' +
    '..BWGKSSBBB.....' +
    '..BKKSSSSBB.....' +
    '...BSSSBBB......' +
    '..RRBBBBRR......' +
    '..RRBSSBRR......' +
    '..RRBSSBRR......' +
    '...RRBBRR.......' +
    '...BB..BB.......' +
    '..RR....RR......' +
    '.RRYR..RRYR.....' +
    '.LLL....LLL.....', AMY_PAL);

  const AMY_RUN1 = parse(16, 16,
    '..RRRR..........' +
    '..DBBBD.........' +
    '.DBBBBBD........' +
    '.BBBBBBB........' +
    '.BWKWBBB........' +
    '.BWGKSSBBB......' +
    '.BKKSSSSBB......' +
    '..BSSSBBB.......' +
    '.RRBBBBRR.......' +
    '.RRBSSBRR.......' +
    '.RRBSSBRR.......' +
    '..RRBBRR........' +
    '...RR..BB.......' +
    '..RRYR..RR......' +
    '..LLL..RRYR.....' +
    '........LLL.....', AMY_PAL);

  const AMY_JUMP = parse(16, 16,
    '................' +
    '....DDDDDD......' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '.DDBBBBBBBDD....' +
    '.DDDBBBBDDDD....' +
    '..DDDDDDDDDD....' +
    '...DBBBBBBDD....' +
    '..DBBBBBBBBD....' +
    '..DBBBBBBBD.....' +
    '...DDDDDDD......' +
    '....DDDDDD......' +
    '................' +
    '................' +
    '................', AMY_PAL);

  const AMY_HAMMER = parse(16, 16,
    '..RRRR..YYYYYY..' +
    '..DBBBD.YRRRRRY.' +
    '.DBBBBBD.YRRRRY.' +
    '.BBBBBBB.YYYYYY.' +
    '.BWKWBBBYYY.....' +
    '.BWGKSSBBB......' +
    '.BKKSSSSBB......' +
    '..BSSSBBB.......' +
    '.RRBBBBRR.......' +
    '.RRBSSBRR.......' +
    '.RRBSSBRR.......' +
    '..RRBBRR........' +
    '..BB..BB........' +
    '.RR....RR.......' +
    'RRYR..RRYR......' +
    'LLL...LLL.......', AMY_PAL);

  // ===== ENEMY PALETTES =====

  const MOTOBUG_PAL = {
    B: '#1565C0', // blue body
    D: '#0D47A1', // dark blue
    R: '#E52521', // red shell
    K: '#1A1A1A', // black
    W: '#FFFFFF', // white
    G: '#757575', // grey (wheel)
    Y: '#FFD740', // yellow (eye)
    L: '#424242', // dark grey
  };

  const BUZZBOMBER_PAL = {
    Y: '#FFD740', // yellow body
    D: '#F9A825', // dark yellow
    K: '#1A1A1A', // black (stripes)
    W: '#FFFFFF', // white (wings)
    R: '#E52521', // red (stinger)
    B: '#42A5F5', // blue (wings tint)
    G: '#E0E0E0', // grey
    L: '#B0BEC5', // light grey wing
  };

  const CRABMEAT_PAL = {
    R: '#E52521', // red body
    D: '#B71C1C', // dark red
    W: '#FFFFFF', // white
    K: '#1A1A1A', // black
    Y: '#FFD740', // yellow (eyes)
    O: '#FF6D00', // orange (claws)
    L: '#FF8A65', // light orange
    S: '#FFCC80', // sand/belly
  };

  const SPINY_PAL = {
    P: '#7B1FA2', // purple body
    D: '#4A148C', // dark purple
    W: '#FFFFFF', // white
    K: '#1A1A1A', // black
    Y: '#FFD740', // yellow (spikes)
    S: '#FFB74D', // spike tips
    R: '#E52521', // red
    G: '#757575', // grey
  };

  const GRABBER_PAL = {
    G: '#757575', // grey body
    D: '#424242', // dark grey
    K: '#1A1A1A', // black
    R: '#E52521', // red (eyes)
    W: '#FFFFFF', // white
    Y: '#FFD740', // yellow
    L: '#9E9E9E', // light grey
    B: '#1565C0', // blue accent
  };

  const PENGUINATOR_PAL = {
    B: '#1565C0', // blue body
    D: '#0D47A1', // dark blue
    W: '#FFFFFF', // white belly
    K: '#1A1A1A', // black
    Y: '#FFD740', // yellow (beak, feet)
    R: '#FF6D00', // orange (beak)
    G: '#E0E0E0', // grey
    S: '#FFE0B2', // cream
  };

  const BALLHOG_PAL = {
    P: '#FF4081', // pink body
    D: '#C51162', // dark pink
    K: '#1A1A1A', // black
    W: '#FFFFFF', // white
    G: '#757575', // grey (armor)
    Y: '#FFD740', // yellow
    R: '#E52521', // red
    S: '#FFCC80', // snout
  };

  const CATERKILLER_PAL = {
    P: '#7B1FA2', // purple body
    D: '#4A148C', // dark purple
    G: '#4CAF50', // green (head)
    L: '#81C784', // light green
    K: '#1A1A1A', // black
    Y: '#FFD740', // yellow (spikes)
    W: '#FFFFFF', // white (eyes)
    R: '#E52521', // red (antenna)
  };

  // ===== ENEMY SPRITES =====

  const MOTOBUG_1 = parse(16, 16,
    '................' +
    '.....RRRRR......' +
    '....RRRRRRR.....' +
    '...RRRRRRRRRR...' +
    '..RRRBBBBRRR....' +
    '..RRBBBBBBRR....' +
    '.RRBBYKBBBBR....' +
    '.RRBBBBBBBBR....' +
    '.RRRBBBBBBRRR...' +
    '..RRRRRRRRRRR...' +
    '..RRRDDDDRRR....' +
    '...RRGGGGRR.....' +
    '...GGLGGLLG.....' +
    '..GGLLLLLGG.....' +
    '..GGGGGGGG......' +
    '................', MOTOBUG_PAL);

  const MOTOBUG_2 = parse(16, 16,
    '................' +
    '.....RRRRR......' +
    '....RRRRRRR.....' +
    '...RRRRRRRRRR...' +
    '..RRRBBBBRRR....' +
    '..RRBBBBBBRR....' +
    '.RRBBYKBBBBR....' +
    '.RRBBBBBBBBR....' +
    '.RRRBBBBBBRRR...' +
    '..RRRRRRRRRRR...' +
    '..RRRDDDDRRR....' +
    '...RRGGGGRR.....' +
    '...GLGGGLGG.....' +
    '..GLLLLLLGG.....' +
    '..GGGGGGGG......' +
    '................', MOTOBUG_PAL);

  const BUZZBOMBER_1 = parse(16, 16,
    '..LLLL..LLLL....' +
    '.LWWWWLLWWWWL...' +
    '.LWWWWLLWWWWL...' +
    '..LLLL..LLLL....' +
    '....YYYYYY......' +
    '...YYKKYYYYY....' +
    '..YYKKYYYYYYYY..' +
    '..YYYYYYYYYYYYY.' +
    '.YYYYDDDDDDYYY.' +
    '.YYDDDDDDDDDY..' +
    '..YYDDDDDDDDY..' +
    '...YYDDDDDY.....' +
    '....YYYYY.......' +
    '.....YRR........' +
    '......RR........' +
    '................', BUZZBOMBER_PAL);

  const BUZZBOMBER_2 = parse(16, 16,
    '...LL....LL.....' +
    '..LWWL..LWWL....' +
    '..LWWL..LWWL....' +
    '...LL....LL.....' +
    '....YYYYYY......' +
    '...YYKKYYYYY....' +
    '..YYKKYYYYYYYY..' +
    '..YYYYYYYYYYYYY.' +
    '.YYYYDDDDDDYYY.' +
    '.YYDDDDDDDDDY..' +
    '..YYDDDDDDDDY..' +
    '...YYDDDDDY.....' +
    '....YYYYY.......' +
    '.....YRR........' +
    '......RR........' +
    '................', BUZZBOMBER_PAL);

  const CRABMEAT_1 = parse(16, 16,
    '..OO........OO..' +
    '.OLLO......OLLO.' +
    '.OLLO......OLLO.' +
    '..OO........OO..' +
    '...OO.RRRR.OO...' +
    '....RRRRRRRR....' +
    '...RRRYRRYRRR...' +
    '..RRRRYYRRRRRR..' +
    '..RRRRRRRRRRRR..' +
    '..RRSSSSSSSRR...' +
    '...RSSSSSSRR....' +
    '...RRRRRRRRRR...' +
    '....RRDDRRRR....' +
    '...RR.RR.RR.....' +
    '..RR..RR..RR....' +
    '................', CRABMEAT_PAL);

  const CRABMEAT_2 = parse(16, 16,
    '.OO..........OO.' +
    'OLLO........OLLO' +
    'OLLO........OLLO' +
    '.OO..........OO.' +
    '..OO..RRRR..OO..' +
    '....RRRRRRRR....' +
    '...RRRYRRYRRR...' +
    '..RRRRYYRRRRRR..' +
    '..RRRRRRRRRRRR..' +
    '..RRSSSSSSSRR...' +
    '...RSSSSSSRR....' +
    '...RRRRRRRRRR...' +
    '....RRDDRRRR....' +
    '...RR.RR.RR.....' +
    '..RR..RR..RR....' +
    '................', CRABMEAT_PAL);

  const SPINY_1 = parse(16, 16,
    '..YY..YY..YY....' +
    '..SY..SY..SY....' +
    '..YY..YY..YY....' +
    '...PPPPPPPP.....' +
    '..PPPPPPPPPP....' +
    '.PPPPPPPPPPPP...' +
    '.PPWKPPPPWKPP...' +
    '.PPWKPPPPWKPP...' +
    '.PPPPPPPPPPPP...' +
    '.PPPPPDDPPPPP...' +
    '..PPPDDDPPPP....' +
    '..PPPPPPPPPP....' +
    '...PPPPPPPP.....' +
    '..GG.PPPP.GG....' +
    '.GGG..PP..GGG...' +
    '.GG........GG...', SPINY_PAL);

  const SPINY_2 = parse(16, 16,
    '..YY..YY..YY....' +
    '..SY..SY..SY....' +
    '..YY..YY..YY....' +
    '...PPPPPPPP.....' +
    '..PPPPPPPPPP....' +
    '.PPPPPPPPPPPP...' +
    '.PPWKPPPPWKPP...' +
    '.PPWKPPPPWKPP...' +
    '.PPPPPPPPPPPP...' +
    '.PPPPPDDPPPPP...' +
    '..PPPDDDPPPP....' +
    '..PPPPPPPPPP....' +
    '...PPPPPPPP.....' +
    '...GG.PP.GG.....' +
    '..GGG..GGGG.....' +
    '..GG....GG......', SPINY_PAL);

  const GRABBER_1 = parse(16, 16,
    '....GGGGGG......' +
    '...GGLLLLGG.....' +
    '..GGLRRLLGG.....' +
    '..GGLLLLGGGG....' +
    '...GGGGGGGG.....' +
    '....GGGG........' +
    '....GGGG........' +
    '...GGGGGG.......' +
    '..GGLGGLGG......' +
    '.GG.GGGG.GG.....' +
    'GG..GGGG..GG....' +
    '....GGGG........' +
    '...GDDDG........' +
    '..GDDDDG.......' +
    '.GG.GG.GG.......' +
    'GG......GG......', GRABBER_PAL);

  const GRABBER_2 = parse(16, 16,
    '....GGGGGG......' +
    '...GGLLLLGG.....' +
    '..GGLRRLLGG.....' +
    '..GGLLLLGGGG....' +
    '...GGGGGGGG.....' +
    '....GGGG........' +
    '....GGGG........' +
    '...GGGGGG.......' +
    '..GGLGGLGG......' +
    '..GGGGGGGG......' +
    '.GG.GGGG.GG.....' +
    '....GGGG........' +
    '...GDDDG........' +
    '..GDDDDG.......' +
    '..GG.GG.GG......' +
    '.GG......GG.....', GRABBER_PAL);

  const PENGUINATOR_1 = parse(16, 16,
    '......BB........' +
    '.....BBBB.......' +
    '....BBBBBB......' +
    '...BBBWWBBB.....' +
    '..BBBWKWWBBB....' +
    '..BBBWKWWBBB....' +
    '.BBBBWWWWBBBB...' +
    '.BBBWWRRWWBBB...' +
    '.BBBWWWWWWBBB...' +
    '..BWWWWWWWWB....' +
    '..BBWWWWWWBB....' +
    '...BBWWWWBB.....' +
    '....BBBBBB......' +
    '...YY.BB.YY.....' +
    '..YYY....YYY....' +
    '..YY......YY....', PENGUINATOR_PAL);

  const PENGUINATOR_2 = parse(16, 16,
    '................' +
    '......BB........' +
    '.....BBBB.......' +
    '....BBBBBB......' +
    '...BBBWWBBB.....' +
    '..BBBWKWWBBB....' +
    '..BBBWKWWBBB....' +
    '.BBBBWWWWBBBB...' +
    '.BBBWWRRWWBBB...' +
    '.BBBWWWWWWBBB...' +
    '..BWWWWWWWWB....' +
    '..BBWWWWWWBB....' +
    '...BBWWWWBB.....' +
    '....BBBBBB......' +
    '.YYY......YYY...' +
    '.YY........YY...', PENGUINATOR_PAL);

  const BALLHOG_1 = parse(16, 16,
    '....GGGGGG......' +
    '...GGGGGGGG.....' +
    '..GGPPPPPPGG....' +
    '..GPPWKPWKPG....' +
    '.GGPPWKPWKPGG...' +
    '.GGPPPSSPPPGG...' +
    '.GGPPSSSSPGG....' +
    '..GGPPPPPPGG....' +
    '..GGGPPPPGG.....' +
    '...GGPPPPGG.....' +
    '..PPPPPPPPPPP...' +
    '.PPPPPPPPPPPP...' +
    '.PPPDDDDDPPPP...' +
    '..PPPPPPPPPP....' +
    '..YY..PP..YY....' +
    '.YYY..PP..YYY...', BALLHOG_PAL);

  const BALLHOG_2 = parse(16, 16,
    '....GGGGGG......' +
    '...GGGGGGGG.....' +
    '..GGPPPPPPGG....' +
    '..GPPWKPWKPG....' +
    '.GGPPWKPWKPGG...' +
    '.GGPPPSSPPPGG...' +
    '.GGPPSSSSPGG....' +
    '..GGPPPPPPGG....' +
    '..GGGPPPPGG.....' +
    '...GGPPPPGG.....' +
    '..PPPPPPPPPPP...' +
    '.PPPPPPPPPPPP...' +
    '.PPPDDDDDPPPP...' +
    '..PPPPPPPPPP....' +
    '..PP.YY.YY......' +
    '..PP.YYY.YYY....', BALLHOG_PAL);

  // Caterkiller head (16x16) + body segment (8x8)
  const CATERKILLER_HEAD = parse(16, 16,
    '....RRRR........' +
    '...RR..RR.......' +
    '....GGGG........' +
    '...GGGGGG.......' +
    '..GGLGGLGG......' +
    '..GGWKGWKGG.....' +
    '.GGGGGGGGGG.....' +
    '.GGGGKKGGGG.....' +
    '.GGGGGGGGG......' +
    '..GGGGGGG.......' +
    '...GGGGG........' +
    '....GGG.........' +
    '................' +
    '................' +
    '................' +
    '................', CATERKILLER_PAL);

  const CATERKILLER_BODY = parse(8, 8,
    '..PPPP..' +
    '.PPPPPP.' +
    'PPYPPYPP' +
    'PPPPPPPP' +
    'PDPPPPPP' +
    '.PPPPPP.' +
    '..PPPP..' +
    '........', CATERKILLER_PAL);

  // ===== RING SPRITES =====

  const RING_PAL = {
    Y: '#FFD740', // gold
    D: '#F9A825', // dark gold
    W: '#FFFFFF', // highlight
    O: '#FF8F00', // orange shadow
  };

  const RING_1 = parse(16, 16,
    '......YYYY......' +
    '....YYDDDDYY....' +
    '...YDDWWWWDDY...' +
    '..YDWWYYYYWWDY..' +
    '..YDWY....YWDY..' +
    '.YDWY......YWDY.' +
    '.YDY........YDY.' +
    '.YDY........YDY.' +
    '.YDY........YDY.' +
    '.YDY........YDY.' +
    '.YDWY......YWDY.' +
    '..YDWY....YWDY..' +
    '..YDWWYYYYWWDY..' +
    '...YDDWWWWDDY...' +
    '....YYDDDDYY....' +
    '......YYYY......', RING_PAL);

  const RING_2 = parse(16, 16,
    '.......YY.......' +
    '......YDDY......' +
    '.....YDWWDY.....' +
    '....YDWWWDY.....' +
    '....YDWWDY......' +
    '...YDWWWDY......' +
    '...YDWDY........' +
    '...YDDY.........' +
    '...YDDY.........' +
    '...YDWDY........' +
    '...YDWWWDY......' +
    '....YDWWDY......' +
    '....YDWWWDY.....' +
    '.....YDWWDY.....' +
    '......YDDY......' +
    '.......YY.......', RING_PAL);

  const RING_3 = parse(16, 16,
    '........Y.......' +
    '.......YDY......' +
    '......YDDY......' +
    '.....YDWDY......' +
    '.....YDDY.......' +
    '....YDWDY.......' +
    '....YDDY........' +
    '....YDY.........' +
    '....YDY.........' +
    '....YDDY........' +
    '....YDWDY.......' +
    '.....YDDY.......' +
    '.....YDWDY......' +
    '......YDDY......' +
    '.......YDY......' +
    '........Y.......', RING_PAL);

  const RING_4 = parse(16, 16,
    '.......YY.......' +
    '......YDDY......' +
    '.....YDWWDY.....' +
    '....YDWWWDY.....' +
    '....YDWWDY......' +
    '...YDWWWDY......' +
    '...YDWDY........' +
    '...YDDY.........' +
    '...YDDY.........' +
    '...YDWDY........' +
    '...YDWWWDY......' +
    '....YDWWDY......' +
    '....YDWWWDY.....' +
    '.....YDWWDY.....' +
    '......YDDY......' +
    '.......YY.......', RING_PAL);

  // ===== MONITOR (Item Box) SPRITE =====

  const MONITOR_PAL = {
    G: '#757575', // grey frame
    D: '#424242', // dark grey
    L: '#9E9E9E', // light grey
    B: '#42A5F5', // blue screen
    K: '#1A1A1A', // black
    W: '#FFFFFF', // white
    Y: '#FFD740', // yellow (stand)
  };

  const MONITOR_BOX = parse(16, 16,
    '..DDDDDDDDDDDD..' +
    '.DLLLLLLLLLLLLLD.' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    'DLBBBBBBBBBBBBLD' +
    '.DLLLLLLLLLLLLLD.' +
    '..DDDDDDDDDDDD..' +
    '.....DGGGGD.....' +
    '....DGGGGGGD....' +
    '....DGGYGGD.....' +
    '.....DDDDDD.....', MONITOR_PAL);

  const MONITOR_BROKEN = parse(16, 16,
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '..DDDDDDDDDDDD..' +
    '.....DGGGGD.....' +
    '....DGGGGGGD....' +
    '....DGGYGGD.....' +
    '.....DDDDDD.....', MONITOR_PAL);

  // Monitor icon overlays (8x8, drawn centered on monitor screen)
  const ICON_PAL = {
    Y: '#FFD740', R: '#E52521', B: '#42A5F5',
    W: '#FFFFFF', O: '#FF8F00', G: '#4CAF50',
    P: '#7B1FA2', K: '#1A1A1A', L: '#FFD740',
  };

  const ICON_RING = parse(8, 8,
    '..YYYY..' +
    '.YY..YY.' +
    'YY....YY' +
    'YY....YY' +
    'YY....YY' +
    'YY....YY' +
    '.YY..YY.' +
    '..YYYY..', ICON_PAL);

  const ICON_SHIELD = parse(8, 8,
    '..BBBB..' +
    '.BBBBBB.' +
    'BBWWBBBB' +
    'BBWBBBBB' +
    'BBBBBBBB' +
    '.BBBBBB.' +
    '..BBBB..' +
    '...BB...', ICON_PAL);

  const ICON_FLAME = parse(8, 8,
    '...RR...' +
    '..ROOR..' +
    '.ROOOYR.' +
    '.ROOYR..' +
    'ROOOYR..' +
    'ROOYYR..' +
    '.RRYYR..' +
    '..RRR...', ICON_PAL);

  const ICON_WATER = parse(8, 8,
    '...BB...' +
    '..BBBB..' +
    '.BWBBBB.' +
    '.BWBBBB.' +
    'BWBBBBBB' +
    'BBBBBBBB' +
    '.BBBBBB.' +
    '..BBBB..', ICON_PAL);

  const ICON_LIGHTNING = parse(8, 8,
    '...YY...' +
    '..YYY...' +
    '.YYYY...' +
    'YYYYYY..' +
    '...YYYY.' +
    '...YYY..' +
    '..YYY...' +
    '..YY....', ICON_PAL);

  const ICON_INVINCIBLE = parse(8, 8,
    '...YY...' +
    '..YYYY..' +
    '..YWWY..' +
    '.YYWWYY.' +
    'YYYYYYYY' +
    '.YYYYYY.' +
    '..YYYY..' +
    '..YY.YY.', ICON_PAL);

  const ICON_SPEED = parse(8, 8,
    '.....YY.' +
    '...YYO..' +
    '.YYOO...' +
    'YYYOOO..' +
    '.YYOO...' +
    '...YYO..' +
    '.....YY.' +
    '........', ICON_PAL);

  const ICON_LIFE = parse(8, 8,
    '..B..B..' +
    '.BBB.BB.' +
    '.BWBBBB.' +
    '.BBBBBB.' +
    '..BBBB..' +
    '..BBBB..' +
    '...BB...' +
    '........', ICON_PAL);

  // ===== SPRING SPRITES =====

  const SPRING_PAL = {
    R: '#E52521', // red (strong spring)
    Y: '#FFD740', // yellow (normal spring)
    D: '#CC8800', // dark gold
    K: '#1A1A1A', // black
    G: '#757575', // grey (base)
    L: '#9E9E9E', // light grey
    W: '#FFFFFF', // white
  };

  const SPRING_UP = parse(16, 16,
    '..YYYYYYYYYYYY..' +
    '.YDDDDDDDDDDDY.' +
    'YDWWWWWWWWWWWDY' +
    '.YDDDDDDDDDDDY.' +
    '..YYYYYYYYYYYY..' +
    '....GGGGGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......' +
    '.....GGGGGG.....' +
    '....GGGGGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......' +
    '.....GGGGGG.....' +
    '....GGGGGGGG....' +
    '...GGGGGGGGGG...' +
    '..GGGGGGGGGGGG..', SPRING_PAL);

  const SPRING_UP_RED = parse(16, 16,
    '..RRRRRRRRRRRR..' +
    '.RKKKKKKKKKKKKR.' +
    'RKWWWWWWWWWWWKR' +
    '.RKKKKKKKKKKKKR.' +
    '..RRRRRRRRRRRR..' +
    '....GGGGGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......' +
    '.....GGGGGG.....' +
    '....GGGGGGGG....' +
    '.....GGGGGG.....' +
    '......GGGG......' +
    '.....GGGGGG.....' +
    '....GGGGGGGG....' +
    '...GGGGGGGGGG...' +
    '..GGGGGGGGGGGG..', SPRING_PAL);

  // ===== CHECKPOINT (Lamp Post) =====

  const CHECKPOINT_PAL = {
    B: '#1565C0', // blue (inactive orb)
    R: '#E52521', // red (active orb)
    G: '#757575', // grey pole
    D: '#424242', // dark grey
    Y: '#FFD740', // yellow
    W: '#FFFFFF', // white highlight
    K: '#1A1A1A', // black
  };

  const CHECKPOINT_OFF = parse(8, 32,
    '..BBBB..' +
    '.BBBBBB.' +
    '.BBWBBB.' +
    '.BBBBBB.' +
    '..BBBB..' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '..DGDG..' +
    '..DGGD..' +
    '.DDGGDD.' +
    '.DDDDD..', CHECKPOINT_PAL);

  const CHECKPOINT_ON = parse(8, 32,
    '..RRRR..' +
    '.RRRRRR.' +
    '.RRWRRR.' +
    '.RRRRRR.' +
    '..RRRR..' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '...GG...' +
    '..DGDG..' +
    '..DGGD..' +
    '.DDGGDD.' +
    '.DDDDD..', CHECKPOINT_PAL);

  // ===== DASH PAD =====

  const DASHPAD_PAL = {
    Y: '#FFD740',
    R: '#FF6D00',
    K: '#1A1A1A',
    G: '#757575',
    D: '#424242',
  };

  const DASH_PAD = parse(16, 8,
    'GGGGGGGGGGGGGDDD' +
    'GYYRYYRYYRGGDDDD' +
    'GYYRYYRYYRGDDDDD' +
    'GYYRYYRYYRGDDDDD' +
    'GYYRYYRYYRGDDDDD' +
    'GYYRYYRYYRGDDDDD' +
    'GYYRYYRYYRGGDDDD' +
    'GGGGGGGGGGGGGDDD', DASHPAD_PAL);

  // ===== FLICKIE (released animal) =====

  const FLICKIE_PAL = {
    B: '#42A5F5', // blue bird
    W: '#FFFFFF',
    K: '#1A1A1A',
    Y: '#FFD740',
    R: '#FF8A65', // beak
  };

  const FLICKIE_1 = parse(8, 8,
    '..BB....' +
    '.BBBB...' +
    '.BKBB.B.' +
    '.BBBBRBB' +
    '..BBBB..' +
    '..BBBB..' +
    '..YY.Y..' +
    '........', FLICKIE_PAL);

  const FLICKIE_2 = parse(8, 8,
    '..BB....' +
    '.BBBB...' +
    '.BKBB...' +
    '.BBBBR..' +
    '..BBBBBB' +
    '..BBBB..' +
    '..YY.Y..' +
    '........', FLICKIE_PAL);

  // ===== EGGMAN BOSS =====

  const EGGMAN_PAL = {
    R: '#E52521', // red (suit)
    D: '#B71C1C', // dark red
    Y: '#FFD740', // yellow (buttons)
    S: '#FFCC80', // skin
    K: '#1A1A1A', // black
    W: '#FFFFFF', // white
    G: '#757575', // grey (machine)
    L: '#9E9E9E', // light grey
    B: '#5C4033', // brown (mustache)
  };

  const EGGMAN_1 = parse(16, 16,
    '....KKKKKK......' +
    '...KSSSSSSSK....' +
    '..KSWKSSKWSK....' +
    '..KSKKSSKKSSK...' +
    '..KSSSSSSSSK....' +
    '..KSBBBBBSBK....' +
    '...KBBBBBBK.....' +
    '...RRRRRRRRR....' +
    '..RRRRYYRRRR....' +
    '..RRRRRRRRRRR...' +
    '.RRDRRRRRRDRR...' +
    '.RRRRRRRRRRRRR..' +
    '..RRRRRRRRRR....' +
    '...RRRRRRRR.....' +
    '..KK......KK....' +
    '.KKK......KKK...', EGGMAN_PAL);

  const EGGMAN_2 = parse(16, 16,
    '....KKKKKK......' +
    '...KSSSSSSSK....' +
    '..KSWKSSKWSK....' +
    '..KSKKSSKKSSK...' +
    '..KSSSSSSSSK....' +
    '..KSBBBBBSBK....' +
    '...KBBBBBBK.....' +
    '...RRRRRRRRR....' +
    '..RRRRYYRRRR....' +
    '..RRRRRRRRRRR...' +
    '.RRDRRRRRRDRR...' +
    '.RRRRRRRRRRRRR..' +
    '..RRRRRRRRRR....' +
    '...RRRRRRRR.....' +
    '..KKK....KKK....' +
    '.KK........KK...', EGGMAN_PAL);

  // Eggman's machine (32x16 — wider)
  const EGGMACHINE_PAL = {
    G: '#757575',
    D: '#424242',
    L: '#9E9E9E',
    R: '#E52521',
    Y: '#FFD740',
    K: '#1A1A1A',
    W: '#FFFFFF',
  };

  // ===== TILE PALETTES =====

  // Green Hill checker grass
  const GH_PAL = {
    G: '#4CAF50', // green
    L: '#81C784', // light green
    D: '#2E7D32', // dark green
    B: '#8D6E63', // brown earth
    T: '#6D4C41', // dark brown
    W: '#A5D6A7', // highlight
  };

  // Chemical Plant
  const CP_PAL = {
    P: '#7B1FA2', // purple
    D: '#4A148C', // dark purple
    L: '#CE93D8', // light purple
    G: '#757575', // grey metal
    K: '#424242', // dark metal
    N: '#E040FB', // neon pink
    C: '#00BCD4', // cyan
  };

  // Marble Garden
  const MG_PAL = {
    S: '#D7CCC8', // sandstone
    D: '#A1887F', // dark sandstone
    L: '#EFEBE9', // light
    G: '#4CAF50', // green vine
    V: '#2E7D32', // dark green
    B: '#8D6E63', // brown
  };

  // Ice Cap
  const IC_PAL = {
    I: '#B3E5FC', // ice blue
    D: '#81D4FA', // darker ice
    W: '#FFFFFF', // white snow
    L: '#E1F5FE', // light
    B: '#0288D1', // deep blue
    G: '#E0F7FA', // glacial
  };

  // Scrap Brain
  const SB_PAL = {
    G: '#757575', // grey metal
    D: '#424242', // dark metal
    L: '#9E9E9E', // light metal
    R: '#E52521', // red (hazard)
    Y: '#FFD740', // yellow (warning)
    O: '#FF6D00', // orange (sparks)
    K: '#1A1A1A', // black
  };

  // ===== TILE SPRITES =====

  // Green Hill ground - checkerboard top
  const TILE_GH_GROUND = parse(16, 16,
    'GLGLGLGLGLGLGLGL' +
    'LGLGLGLGLGLGLGLG' +
    'GLGLGLGLGLGLGLGL' +
    'LGLGLGLGLGLGLGLG' +
    'DDDDDDDDDDDDDDDD' +
    'BBBTBBBBBTBBBBBT' +
    'BBBBBBTBBBBBBTBB' +
    'BTBBBBBBBTBBBBBB' +
    'BBBBTBBBBBBBTBBB' +
    'BBBBBBBTBBBBBBBT' +
    'BTBBBBBBBBTBBBBB' +
    'BBBBTBBBBBBBTBBB' +
    'BBBBBBBTBBBBBBBB' +
    'BTBBBBBBBBBTBBBB' +
    'BBBBTBBBBBBBBTBB' +
    'BBBBBBBBBTBBBBBB', GH_PAL);

  const TILE_GH_GROUND_SUB = parse(16, 16,
    'BBBTBBBBBTBBBBBT' +
    'BBBBBBTBBBBBBTBB' +
    'BTBBBBBBBTBBBBBB' +
    'BBBBTBBBBBBBTBBB' +
    'BBBBBBBTBBBBBBBT' +
    'BTBBBBBBBBTBBBBB' +
    'BBBBTBBBBBBBTBBB' +
    'BBBBBBBTBBBBBBBB' +
    'BTBBBBBBBBBTBBBB' +
    'BBBBTBBBBBBBBTBB' +
    'BBBBBBBBBTBBBBBB' +
    'BTBBBBBTBBBBBTBB' +
    'BBBBTBBBBBTBBBBB' +
    'BBBBBBBTBBBBBBBB' +
    'BTBBBBBBBBBTBBBB' +
    'BBBBBBTBBBBBBTBB', GH_PAL);

  // Chemical Plant metal floor
  const TILE_CP_FLOOR = parse(16, 16,
    'NNCCCCCCCCCCCCNN' +
    'NGGGGGGGGGGGGGGG' +
    'CGKKKKKKKKKKKKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKKKKKKKKKKKKGC' +
    'CGKKKKKKKKKKKKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKGGGGGGGGGGKGC' +
    'CGKKKKKKKKKKKKGC' +
    'NGGGGGGGGGGGGGGG' +
    'NNCCCCCCCCCCCCNN', CP_PAL);

  // Marble Garden sandstone
  const TILE_MG_STONE = parse(16, 16,
    'SSSLSSSSSSLSSSSS' +
    'SSSDSSSSSSDSSSSL' +
    'SLSSSSSLSSSSSSSL' +
    'SSSSSLSSSSSLSSSS' +
    'DDDDDDDDDDDDDDDD' +
    'SSSSSSSLSSSSSLDS' +
    'SLSSSSSSSSSLSSSS' +
    'SSSSLSSSSSSSSSSL' +
    'SSSSSSSSSLSSSSSS' +
    'DDDDDDDDDDDDDDDD' +
    'SLSSSSSSSSSSLSSS' +
    'SSSSSSLSSSSSSSLD' +
    'SSSLSSSSSSLSSSSS' +
    'SSSSSSSLSSSSSSSS' +
    'SLSSSSSSSSSLSSSS' +
    'DDDDDDDDDDDDDDDD', MG_PAL);

  // Ice Cap ice
  const TILE_IC_ICE = parse(16, 16,
    'WWWWWWWWWWWWWWWW' +
    'WLLLLLLLLLLLLLLW' +
    'LIIIIIIIIIIIIIIL' +
    'LIIWIIIIIIIWIIL' +
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
    'DDDDDDDDDDDDDDDD', IC_PAL);

  const TILE_IC_SNOW = parse(16, 16,
    'WWWWWWWWWWWWWWWW' +
    'WLWWWWWLWWWWWLWW' +
    'LLWWWWLLWWWWLLWW' +
    'IIIIIIIIIIIIIIII' +
    'IIIDIIIIIIIDIII' +
    'IIIIIIDIIIIIIIDI' +
    'DIIIIIIIIDIIIII' +
    'IIIIDIIIIIIIIDII' +
    'IIIIIIIIDIIIIIII' +
    'DIIIIIIIIIIDIII' +
    'IIIIDIIIIIIIIDII' +
    'IIIIIIIIDIIIIII' +
    'DIIIIIIIIIIDIII' +
    'IIIDIIIIIIIIIII' +
    'IIIIIIDIIIIIIDI' +
    'IIIIIIIIIIIIIIII', IC_PAL);

  // Scrap Brain metal
  const TILE_SB_METAL = parse(16, 16,
    'KKKKKKKKKKKKKKKK' +
    'KLLLLLLLLLLLLLLK' +
    'KLGGGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGRGGGGGGRGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGRGGGGGGRGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLGGGGGGGGGGGLK' +
    'KLLLLLLLLLLLLLLK' +
    'KKKKKKKKKKKKKKKK', SB_PAL);

  // Slope tiles (45-degree, up-right)
  const TILE_SLOPE_45_UP = parse(16, 16,
    '...............G' +
    '..............GL' +
    '.............GLL' +
    '............GLLL' +
    '...........GLLLL' +
    '..........GLBBBB' +
    '.........GLBBBBB' +
    '........GLBBBBBB' +
    '.......GLBBBBBBB' +
    '......GLBBBBBBBB' +
    '.....GLBBBBBBBBB' +
    '....GLBBBBBBBBBB' +
    '...GLBBBBBBBBBBB' +
    '..GLBBBBBBBBBBBB' +
    '.GLBBBBBBBBBBBBB' +
    'GLBBBBBBBBBBBBBB', GH_PAL);

  const TILE_SLOPE_45_DOWN = parse(16, 16,
    'G...............' +
    'LG..............' +
    'LLG.............' +
    'LLLG............' +
    'LLLLG...........' +
    'BBBBLG..........' +
    'BBBBBLG.........' +
    'BBBBBBLG........' +
    'BBBBBBBLG.......' +
    'BBBBBBBBLG......' +
    'BBBBBBBBBLG.....' +
    'BBBBBBBBBBLG....' +
    'BBBBBBBBBBBLG...' +
    'BBBBBBBBBBBBLG..' +
    'BBBBBBBBBBBBBLG.' +
    'BBBBBBBBBBBBBBLG', GH_PAL);

  // Gentle slope (22.5 degrees) - left half
  const TILE_SLOPE_22_UP_L = parse(16, 16,
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '...............G' +
    '..............GL' +
    '.............GLL' +
    '............GLLL' +
    '...........GBBBB' +
    '..........GBBBBB' +
    '.........GBBBBBB' +
    '........GBBBBBBB' +
    '.......GBBBBBBBB', GH_PAL);

  const TILE_SLOPE_22_UP_R = parse(16, 16,
    '...............G' +
    '..............GL' +
    '.............GLL' +
    '............GLLL' +
    '...........GBBBB' +
    '..........GBBBBB' +
    '.........GBBBBBB' +
    '........GBBBBBBB' +
    '.......GBBBBBBBB' +
    '......GBBBBBBBBB' +
    '.....GBBBBBBBBBB' +
    '....GBBBBBBBBBBB' +
    '...GBBBBBBBBBBBB' +
    '..GBBBBBBBBBBBBB' +
    '.GBBBBBBBBBBBBBB' +
    'GBBBBBBBBBBBBBBB', GH_PAL);

  const TILE_SLOPE_22_DN_L = parse(16, 16,
    'G...............' +
    'LG..............' +
    'LLG.............' +
    'LLLG............' +
    'BBBBG...........' +
    'BBBBBG..........' +
    'BBBBBBG.........' +
    'BBBBBBBG........' +
    'BBBBBBBBG.......' +
    'BBBBBBBBBG......' +
    'BBBBBBBBBBG.....' +
    'BBBBBBBBBBBG....' +
    'BBBBBBBBBBBBG...' +
    'BBBBBBBBBBBBBG..' +
    'BBBBBBBBBBBBBBG.' +
    'BBBBBBBBBBBBBBBG', GH_PAL);

  const TILE_SLOPE_22_DN_R = parse(16, 16,
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    '................' +
    'G...............' +
    'LG..............' +
    'LLG.............' +
    'LLLG............' +
    'BBBBG...........' +
    'BBBBBG..........' +
    'BBBBBBG.........' +
    'BBBBBBBG........' +
    'BBBBBBBBG......', GH_PAL);

  // Platform (one-way)
  const PLATFORM_PAL2 = {
    G: '#4CAF50',
    D: '#2E7D32',
    L: '#81C784',
    W: '#A5D6A7',
  };

  const TILE_PLATFORM = parse(16, 8,
    'GGGGGGGGGGGGGGGG' +
    'GLLLLLLLLLLLLLLD' +
    'GDDDDDDDDDDDDDD' +
    'GLLLLLLLLLLLLLLD' +
    'GGGGGGGGGGGGGGGG' +
    '................' +
    '................' +
    '................', PLATFORM_PAL2);

  // Spikes (hazard)
  const SPIKE_PAL = {
    G: '#757575',
    D: '#424242',
    L: '#9E9E9E',
    W: '#BDBDBD',
  };

  const TILE_SPIKES = parse(16, 16,
    '................' +
    '................' +
    '................' +
    '................' +
    '....G.....G.....' +
    '...GDG...GDG....' +
    '..GDDG..GDDG...' +
    '..GDDG..GDDG...' +
    '.GDDDG.GDDDG...' +
    '.GDDDG.GDDDG...' +
    'GDDDDGGDDDDG...' +
    'GDDDDGGDDDDG...' +
    'GDDDDDGDDDDDG..' +
    'GDDDDDGDDDDDG..' +
    'GDDDDDDDDDDDDG.' +
    'GGGGGGGGGGGGGGGG', SPIKE_PAL);

  // Conveyor belt
  const CONV_PAL = {
    G: '#757575',
    D: '#424242',
    Y: '#FFD740',
    K: '#1A1A1A',
    R: '#FF6D00',
  };

  const TILE_CONVEYOR_R = parse(16, 8,
    'GGGGGGGGGGGGGGGG' +
    'GDDDDDDDDDDDDDD' +
    'GKRYKRYKRYKRYKKK' +
    'GKRYKRYKRYKRYKKK' +
    'GKRYKRYKRYKRYKKK' +
    'GDDDDDDDDDDDDDD' +
    'GGGGGGGGGGGGGGGG' +
    '................', CONV_PAL);

  const TILE_CONVEYOR_L = parse(16, 8,
    'GGGGGGGGGGGGGGGG' +
    'DDDDDDDDDDDDDDD' +
    'KKKYRKYRKYRKYRKK' +
    'KKKYRKYRKYRKYRKK' +
    'KKKYRKYRKYRKYRKK' +
    'DDDDDDDDDDDDDDD' +
    'GGGGGGGGGGGGGGGG' +
    '................', CONV_PAL);

  // Toxic water (Chemical Plant)
  const TOXIC_PAL = {
    P: '#7B1FA2',
    D: '#4A148C',
    L: '#CE93D8',
    N: '#E040FB',
    K: '#311B92',
  };

  const TILE_TOXIC = parse(16, 16,
    'NLNLNLNLNLNLNLNL' +
    'LNLNLNLNLNLNLNL' +
    'PPPPPPPPPPPPPPPP' +
    'PDPPPPPDPPPPPDPP' +
    'PPPDPPPPPDPPPPPP' +
    'PPPPPPPDPPPPPDPP' +
    'PDPPPPPPPPPDPPPP' +
    'PPPPPDPPPPPPPPPP' +
    'PPPDPPPPPDPPPPPD' +
    'PPPPPPPPPPPPPPPP' +
    'KPPPPPKPPPPPKPPP' +
    'KKPPPKKPPPKKPPPP' +
    'KKKPKKKPKKKPKKKP' +
    'KKKKKKKKKKKKKKKK' +
    'KKKKKKKKKKKKKKKK' +
    'KKKKKKKKKKKKKKKK', TOXIC_PAL);

  // Electric fence
  const ELEC_PAL = {
    Y: '#FFD740',
    W: '#FFFFFF',
    B: '#42A5F5',
    G: '#757575',
    D: '#424242',
    K: '#1A1A1A',
  };

  const TILE_ELECTRIC = parse(16, 16,
    '..GG........GG..' +
    '..GG........GG..' +
    '..GG........GG..' +
    '..GYYWWWWYYGG...' +
    '..GYWWWWWWYG....' +
    '..GYWWBBWWYG....' +
    '..GYYWWWWYYG....' +
    '..GYWWWWWWYG....' +
    '..GYWWBBWWYG....' +
    '..GYYWWWWYYG....' +
    '..GYWWWWWWYG....' +
    '..GYWWBBWWYG....' +
    '..GYYWWWWYYG....' +
    '..GG........GG..' +
    '..GG........GG..' +
    '..GG........GG..', ELEC_PAL);

  // Goal sign (Sonic goal post)
  const GOAL_PAL = {
    G: '#757575',
    D: '#424242',
    B: '#1565C0',
    W: '#FFFFFF',
    Y: '#FFD740',
    R: '#E52521',
    K: '#1A1A1A',
  };

  const GOAL_POST = parse(16, 48,
    '.......YY.......' +
    '......YYYY......' +
    '.......YY.......' +
    '..BBBBBBBBBBBB..' +
    '.BBBBBBBBBBBBBB.' +
    '.BBWWWWWWWWWWBB.' +
    '.BBWBBBBBBBBWBB.' +
    '.BBWBWWBWWBBWBB.' +
    '.BBWBBWBBWBBWBB.' +
    '.BBWBBWBBWBBWBB.' +
    '.BBWBWWBWWBBWBB.' +
    '.BBWBBBBBBBBWBB.' +
    '.BBWWWWWWWWWWBB.' +
    '.BBBBBBBBBBBBBB.' +
    '..BBBBBBBBBBBB..' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '.......GG.......' +
    '......GGGG......' +
    '.....GGGGGG.....' +
    '....GGGGGGGG....', GOAL_PAL);

  // ===== SHIELD EFFECT SPRITES =====

  const SHIELD_PAL = {
    B: '#42A5F5', // blue shield
    W: '#FFFFFF',
    C: '#80DEEA', // cyan
  };

  // These are drawn programmatically as circles but we define icons for HUD
  const SHIELD_ICON_BASIC = parse(8, 8,
    '..BBBB..' +
    '.BBBBBB.' +
    'BBBWBBBB' +
    'BBWBBBBB' +
    'BBBBBBBB' +
    '.BBBBBB.' +
    '..BBBB..' +
    '...BB...', SHIELD_PAL);

  // ===== ANIMATION GROUPS =====

  const ANIMS = {
    sonic: {
      idle: [SONIC_IDLE],
      run: [SONIC_RUN1, SONIC_IDLE, SONIC_RUN2, SONIC_IDLE],
      jump: [SONIC_JUMP],
      spin: [SONIC_SPIN1, SONIC_SPIN2, SONIC_JUMP, SONIC_SPIN1],
      spinDash: [SONIC_SPINDASH],
      skid: [SONIC_SKID],
      hurt: [SONIC_HURT],
      crouch: [SONIC_CROUCH],
      lookUp: [SONIC_LOOKUP],
    },
    tails: {
      idle: [TAILS_IDLE],
      run: [TAILS_RUN1, TAILS_IDLE, TAILS_RUN2, TAILS_IDLE],
      jump: [TAILS_JUMP],
      spin: [TAILS_JUMP, TAILS_JUMP, TAILS_JUMP, TAILS_JUMP],
      fly: [TAILS_FLY1, TAILS_FLY2],
      hurt: [SONIC_HURT], // recolored at runtime
    },
    knuckles: {
      idle: [KNUCKLES_IDLE],
      run: [KNUCKLES_RUN1, KNUCKLES_IDLE, KNUCKLES_RUN1, KNUCKLES_IDLE],
      jump: [KNUCKLES_JUMP],
      spin: [KNUCKLES_JUMP, KNUCKLES_JUMP, KNUCKLES_JUMP, KNUCKLES_JUMP],
      glide: [KNUCKLES_GLIDE],
      climb: [KNUCKLES_CLIMB],
      hurt: [SONIC_HURT],
    },
    shadow: {
      idle: [SHADOW_IDLE],
      run: [SHADOW_RUN1, SHADOW_IDLE, SHADOW_RUN1, SHADOW_IDLE],
      jump: [SHADOW_JUMP],
      spin: [SHADOW_JUMP, SHADOW_JUMP, SHADOW_JUMP, SHADOW_JUMP],
      hurt: [SONIC_HURT],
    },
    amy: {
      idle: [AMY_IDLE],
      run: [AMY_RUN1, AMY_IDLE, AMY_RUN1, AMY_IDLE],
      jump: [AMY_JUMP],
      spin: [AMY_JUMP, AMY_JUMP, AMY_JUMP, AMY_JUMP],
      hammer: [AMY_HAMMER],
      hurt: [SONIC_HURT],
    },
    motobug: { walk: [MOTOBUG_1, MOTOBUG_2] },
    buzzbomber: { fly: [BUZZBOMBER_1, BUZZBOMBER_2] },
    crabmeat: { walk: [CRABMEAT_1, CRABMEAT_2] },
    spiny: { walk: [SPINY_1, SPINY_2] },
    grabber: { hang: [GRABBER_1, GRABBER_2] },
    penguinator: { walk: [PENGUINATOR_1, PENGUINATOR_2] },
    ballhog: { walk: [BALLHOG_1, BALLHOG_2] },
    caterkiller: { head: [CATERKILLER_HEAD], body: [CATERKILLER_BODY] },
    ring: { spin: [RING_1, RING_2, RING_3, RING_4] },
    monitor: { box: [MONITOR_BOX], broken: [MONITOR_BROKEN] },
    flickie: { fly: [FLICKIE_1, FLICKIE_2] },
    eggman: { idle: [EGGMAN_1, EGGMAN_2] },
    checkpoint: { off: [CHECKPOINT_OFF], on: [CHECKPOINT_ON] },
  };

  // ===== TILE MAP =====
  // Zone-specific tile maps: call setZone() to change active tileset
  const TILE_MAPS = {
    green_hill: {
      1: TILE_GH_GROUND,
      2: TILE_GH_GROUND_SUB,
      9: TILE_PLATFORM,
      11: TILE_SPIKES,
      20: TILE_SLOPE_45_UP,
      21: TILE_SLOPE_45_DOWN,
      22: TILE_SLOPE_22_UP_L,
      23: TILE_SLOPE_22_UP_R,
      24: TILE_SLOPE_22_DN_L,
      25: TILE_SLOPE_22_DN_R,
    },
    chemical_plant: {
      1: TILE_CP_FLOOR,
      2: TILE_CP_FLOOR,
      9: TILE_PLATFORM,
      11: TILE_SPIKES,
      14: TILE_TOXIC,
      15: TILE_ELECTRIC,
      20: TILE_SLOPE_45_UP,
      21: TILE_SLOPE_45_DOWN,
      22: TILE_SLOPE_22_UP_L,
      23: TILE_SLOPE_22_UP_R,
      24: TILE_SLOPE_22_DN_L,
      25: TILE_SLOPE_22_DN_R,
    },
    marble_garden: {
      1: TILE_MG_STONE,
      2: TILE_MG_STONE,
      9: TILE_PLATFORM,
      11: TILE_SPIKES,
      20: TILE_SLOPE_45_UP,
      21: TILE_SLOPE_45_DOWN,
      22: TILE_SLOPE_22_UP_L,
      23: TILE_SLOPE_22_UP_R,
      24: TILE_SLOPE_22_DN_L,
      25: TILE_SLOPE_22_DN_R,
    },
    ice_cap: {
      1: TILE_IC_SNOW,
      2: TILE_IC_ICE,
      9: TILE_PLATFORM,
      11: TILE_SPIKES,
      20: TILE_SLOPE_45_UP,
      21: TILE_SLOPE_45_DOWN,
      22: TILE_SLOPE_22_UP_L,
      23: TILE_SLOPE_22_UP_R,
      24: TILE_SLOPE_22_DN_L,
      25: TILE_SLOPE_22_DN_R,
    },
    scrap_brain: {
      1: TILE_SB_METAL,
      2: TILE_SB_METAL,
      9: TILE_PLATFORM,
      11: TILE_SPIKES,
      13: TILE_CONVEYOR_R,
      16: TILE_CONVEYOR_L,
      15: TILE_ELECTRIC,
      20: TILE_SLOPE_45_UP,
      21: TILE_SLOPE_45_DOWN,
      22: TILE_SLOPE_22_UP_L,
      23: TILE_SLOPE_22_UP_R,
      24: TILE_SLOPE_22_DN_L,
      25: TILE_SLOPE_22_DN_R,
    },
  };

  let activeTileMap = TILE_MAPS.green_hill;

  function setZone(zoneName) {
    activeTileMap = TILE_MAPS[zoneName] || TILE_MAPS.green_hill;
  }

  function getTileSprite(tileId) {
    return activeTileMap[tileId] || null;
  }

  return {
    ANIMS,
    TILE_MAPS,
    setZone,
    getTileSprite,
    flipH,
    recolor,
    // Monitors
    MONITOR_BOX,
    MONITOR_BROKEN,
    ICON_RING,
    ICON_SHIELD,
    ICON_FLAME,
    ICON_WATER,
    ICON_LIGHTNING,
    ICON_INVINCIBLE,
    ICON_SPEED,
    ICON_LIFE,
    // Springs
    SPRING_UP,
    SPRING_UP_RED,
    // Checkpoint
    CHECKPOINT_OFF,
    CHECKPOINT_ON,
    // Dash pad
    DASH_PAD,
    // Goal
    GOAL_POST,
    // Flickie
    FLICKIE_1,
    FLICKIE_2,
    // Shield icon
    SHIELD_ICON_BASIC,
  };
})();
