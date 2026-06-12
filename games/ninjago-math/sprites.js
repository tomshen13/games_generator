/**
 * Pixel art sprite data for Ninjago Spinjitzu Math.
 * Sprites are compact string templates + palettes (same approach as sonic-dash).
 * Ninjas share ONE template recolored per character; bosses reuse enemy
 * templates at 2x draw scale with their own palettes (Garmadon is custom).
 */
const SPRITES = (() => {

  function parse(w, h, template, palette, name) {
    const flat = template.replace(/[|\n]/g, '');
    if (flat.length !== w * h) {
      console.warn(`[SPRITES] ${name || 'sprite'}: expected ${w * h} chars, got ${flat.length}`);
    }
    const pixels = flat.split('').map(c => (c === '.' ? null : (palette[c] || null)));
    return { w, h, pixels };
  }

  function recolor(sprite, fromPal, toPal) {
    const colorMap = {};
    for (const key of Object.keys(fromPal)) {
      if (fromPal[key] && toPal[key]) colorMap[fromPal[key]] = toPal[key];
    }
    return {
      w: sprite.w, h: sprite.h,
      pixels: sprite.pixels.map(c => (c ? (colorMap[c] || c) : null)),
    };
  }

  // ===== NINJA PALETTES (R suit, D suit shade, G trim/belt, S skin, K outline, E eyes) =====
  const KAI_PAL    = { R: '#D32F2F', D: '#8E1B1B', G: '#FFD54F', S: '#FFCC80', K: '#1A1A1A', E: '#3E2723' };
  const JAY_PAL    = { R: '#1E88E5', D: '#0D47A1', G: '#FFD54F', S: '#FFCC80', K: '#1A1A1A', E: '#3E2723' };
  const ZANE_PAL   = { R: '#ECEFF1', D: '#90A4AE', G: '#4FC3F7', S: '#FFE0B2', K: '#1A1A1A', E: '#37474F' };
  const COLE_PAL   = { R: '#37474F', D: '#212B30', G: '#FF9800', S: '#FFCC80', K: '#101010', E: '#3E2723' };
  const LLOYD_PAL  = { R: '#43A047', D: '#1B5E20', G: '#FFD600', S: '#FFCC80', K: '#1A1A1A', E: '#3E2723' };

  // Ninja idle — 16x16, facing right (toward incoming enemies)
  const NINJA_IDLE_T =
    '................' +
    '.....KKKKKK.....' +
    '....KRRRRRRK....' +
    '...KRRRRRRRRK...' +
    '...KRDDDDDDRK...' +
    '...KRSSESSERK...' +
    '...KRRRRRRRRK...' +
    '....KRRRRRRK....' +
    '....KRGGGGRK....' +
    '..KKRRRRRRRRKK..' +
    '..KRRDRRRRDRRK..' +
    '..KRRKRGGRKRRK..' +
    '....KRRRRRRK....' +
    '....KRRKKRRK....' +
    '....KRK..KRK....' +
    '...KKK....KKK...';

  // Ninja attack — right arm extended (throwing an element bolt)
  const NINJA_ATTACK_T =
    '................' +
    '.....KKKKKK.....' +
    '....KRRRRRRK....' +
    '...KRRRRRRRRK...' +
    '...KRDDDDDDRK...' +
    '...KRSSESSERK...' +
    '...KRRRRRRRRK...' +
    '....KRRRRRRK....' +
    '....KRGGGGRK....' +
    '..KKRRRRRRRRRK..' +
    '..KRRDRRRRRRRKK.' +
    '..KRRKRGGRKK....' +
    '....KRRRRRRK....' +
    '....KRRKKRRK....' +
    '....KRK..KRK....' +
    '...KKK....KKK...';

  // ===== ENEMY PALETTES =====
  // Skulkin: W bone, Y bone shade, E eye glow, K outline
  const SKULKIN_PAL = { W: '#E8E0D0', Y: '#B0A890', E: '#FF3D00', K: '#1A1A1A' };
  // Samukai (boss): gilded bone king
  const SAMUKAI_PAL = { W: '#F5E9C8', Y: '#C9A227', E: '#FF1744', K: '#1A1A1A' };

  const SKULKIN_W1_T =
    '................' +
    '.....KKKKK......' +
    '....KWWWWWK.....' +
    '...KWWWWWWWK....' +
    '...KWEWWEWWK....' +
    '...KWWKKKWWK....' +
    '....KWKWKWK.....' +
    '.....KKKKK......' +
    '....KYWWWYK.....' +
    '...KYWYWYWYK....' +
    '....KWWWWWK.....' +
    '.....KYYYK......' +
    '....KWK.KWK.....' +
    '....KWK.KWK.....' +
    '...KWWK.KWWK....' +
    '................';

  const SKULKIN_W2_T =
    '................' +
    '.....KKKKK......' +
    '....KWWWWWK.....' +
    '...KWWWWWWWK....' +
    '...KWEWWEWWK....' +
    '...KWWKKKWWK....' +
    '....KWKWKWK.....' +
    '.....KKKKK......' +
    '....KYWWWYK.....' +
    '...KYWYWYWYK....' +
    '....KWWWWWK.....' +
    '.....KYYYK......' +
    '.....KWKWK......' +
    '.....KWKWK......' +
    '....KWWKWWK.....' +
    '................';

  // Serpentine: G scales, D scale shade, Y belly, E eye, T tongue, K outline
  const SERPENTINE_PAL = { G: '#43A047', D: '#1B5E20', Y: '#C5E1A5', E: '#FFD600', T: '#FF1744', K: '#1A1A1A' };
  // Pythor (boss): the purple anacondrai
  const PYTHOR_PAL = { G: '#7B1FA2', D: '#4A0072', Y: '#CE93D8', E: '#FF1744', T: '#FF1744', K: '#1A1A1A' };

  const SERPENTINE_S1_T =
    '................' +
    '...KKKKK........' +
    '..KGGGGGK.......' +
    '.KGGEGGGGK......' +
    '.KGGGGYYGGK.....' +
    'TKGGGGGGGGK.....' +
    '..KGYYGGGGGK....' +
    '...KGYYGGGGGK...' +
    '....KGYYGGGGK...' +
    '.....KGYYGGGGK..' +
    '....KGGYYGGGGK..' +
    '...KGGGYYGGGK...' +
    '..KGGGGYYGGK....' +
    '..KGGGGGGGK.....' +
    '...KKKKKKK......' +
    '................';

  const SERPENTINE_S2_T =
    '................' +
    '...KKKKK........' +
    '..KGGGGGK.......' +
    '.KGGEGGGGK......' +
    '.KGGGGYYGGK.....' +
    '.KGGGGGGGGK.....' +
    '..KGYYGGGGGK....' +
    '...KGYYGGGGGK...' +
    '.....KGYYGGGK...' +
    '....KGGYYGGGGK..' +
    '...KGGGYYGGGGK..' +
    '....KGGGYYGGK...' +
    '.....KGGGGYYGK..' +
    '....KGGGGGGGK...' +
    '.....KKKKKKK....' +
    '................';

  // Nindroid: M dark metal, L light metal, E red visor, K outline
  const NINDROID_PAL = { M: '#546E7A', L: '#B0BEC5', E: '#FF1744', K: '#101010' };
  // General Cryptor (boss): blacked-out elite nindroid
  const CRYPTOR_PAL = { M: '#263238', L: '#546E7A', E: '#FF1744', K: '#000000' };

  const NINDROID_W1_T =
    '................' +
    '.....KKKKK......' +
    '....KMMMMMK.....' +
    '...KMMMMMMMK....' +
    '...KEEEEEEMK....' +
    '...KMMMMMMMK....' +
    '....KMMMMMK.....' +
    '...KMLLLLLMK....' +
    '..KMMMLLLMMMK...' +
    '..KMMMLELMMMK...' +
    '..KMMMLLLMMMK...' +
    '...KMMMMMMMK....' +
    '....KMKKKMK.....' +
    '....KMK.KMK.....' +
    '...KMMK.KMMK....' +
    '................';

  const NINDROID_W2_T =
    '................' +
    '.....KKKKK......' +
    '....KMMMMMK.....' +
    '...KMMMMMMMK....' +
    '...KEEEEEEMK....' +
    '...KMMMMMMMK....' +
    '....KMMMMMK.....' +
    '...KMLLLLLMK....' +
    '..KMMMLLLMMMK...' +
    '..KMMMLELMMMK...' +
    '..KMMMLLLMMMK...' +
    '...KMMMMMMMK....' +
    '....KMKKKMK.....' +
    '.....KMKMK......' +
    '....KMMKMMK.....' +
    '................';

  // Lord Garmadon — custom 16x20 (drawn at 2x scale in-game), four arms, bone helmet
  const GARMADON_PAL = { B: '#1C1023', D: '#39204A', W: '#E8E0D0', E: '#FF1744', G: '#FFD54F', K: '#000000' };
  const GARMADON_T =
    '....KKKKKKK.....' +
    '...KWWWWWWWK....' +
    '..KWWKWWWKWWK...' +
    '...KBBBBBBBK....' +
    '...KBEEKEEBK....' +
    '...KBBBBBBBK....' +
    '....KBBBBBK.....' +
    '..KKBBBBBBBKK...' +
    '.KBBKBBBBBKBBK..' +
    '.KBBKBDDDBKBBK..' +
    '.KBBKBDDDBKBBK..' +
    '.KBKKBBBBBKKBK..' +
    '..KKKBGGGBKKK...' +
    '....KBBBBBK.....' +
    '....KBBBBBK.....' +
    '....KBKKKBK.....' +
    '....KBK.KBK.....' +
    '....KBK.KBK.....' +
    '...KBBK.KBBK....' +
    '................';

  // ===== BUILD =====
  const NINJA_PALS = { kai: KAI_PAL, jay: JAY_PAL, zane: ZANE_PAL, cole: COLE_PAL, lloyd: LLOYD_PAL };

  const ninjaIdleBase = parse(16, 16, NINJA_IDLE_T, KAI_PAL, 'ninja-idle');
  const ninjaAttackBase = parse(16, 16, NINJA_ATTACK_T, KAI_PAL, 'ninja-attack');

  const NINJAS = {};
  for (const [id, pal] of Object.entries(NINJA_PALS)) {
    NINJAS[id] = {
      idle: recolor(ninjaIdleBase, KAI_PAL, pal),
      attack: recolor(ninjaAttackBase, KAI_PAL, pal),
    };
  }

  const skulkin1 = parse(16, 16, SKULKIN_W1_T, SKULKIN_PAL, 'skulkin1');
  const skulkin2 = parse(16, 16, SKULKIN_W2_T, SKULKIN_PAL, 'skulkin2');
  const serp1 = parse(16, 16, SERPENTINE_S1_T, SERPENTINE_PAL, 'serp1');
  const serp2 = parse(16, 16, SERPENTINE_S2_T, SERPENTINE_PAL, 'serp2');
  const droid1 = parse(16, 16, NINDROID_W1_T, NINDROID_PAL, 'droid1');
  const droid2 = parse(16, 16, NINDROID_W2_T, NINDROID_PAL, 'droid2');

  const ENEMIES = {
    skulkin:    { frames: [skulkin1, skulkin2], w: 16, h: 16 },
    serpentine: { frames: [serp1, serp2], w: 16, h: 16 },
    nindroid:   { frames: [droid1, droid2], w: 16, h: 16 },
  };

  const BOSS_SPRITES = {
    samukai: { frames: [recolor(skulkin1, SKULKIN_PAL, SAMUKAI_PAL), recolor(skulkin2, SKULKIN_PAL, SAMUKAI_PAL)], w: 16, h: 16, drawScale: 2 },
    pythor:  { frames: [recolor(serp1, SERPENTINE_PAL, PYTHOR_PAL), recolor(serp2, SERPENTINE_PAL, PYTHOR_PAL)], w: 16, h: 16, drawScale: 2 },
    cryptor: { frames: [recolor(droid1, NINDROID_PAL, CRYPTOR_PAL), recolor(droid2, NINDROID_PAL, CRYPTOR_PAL)], w: 16, h: 16, drawScale: 2 },
    garmadon: { frames: [parse(16, 20, GARMADON_T, GARMADON_PAL, 'garmadon')], w: 16, h: 20, drawScale: 2 },
  };

  // Element visual identity (bolts, tornado tint, particles)
  const ELEMENTS = {
    fire:      { core: '#FFEB3B', mid: '#FF9800', edge: '#E64A19', particle: 'fireBurst' },
    lightning: { core: '#FFFFFF', mid: '#81D4FA', edge: '#1E88E5', particle: 'electricBolt' },
    ice:       { core: '#FFFFFF', mid: '#B3E5FC', edge: '#4FC3F7', particle: 'waterSplash' },
    earth:     { core: '#FFE0B2', mid: '#A1887F', edge: '#5D4037', particle: 'leafStorm' },
    energy:    { core: '#FFF59D', mid: '#9CCC65', edge: '#2E7D32', particle: 'rainbowExplosion' },
  };

  return { NINJAS, ENEMIES, BOSS_SPRITES, ELEMENTS, recolor, parse };
})();
