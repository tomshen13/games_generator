/**
 * Level data — 10 levels across 5 zones with tilemaps and entity spawns.
 * Tiles: .=air G=ground g=sub-ground ?=question_block Q=power_block
 *        P=pipe_top p=pipe_body -=platform I=ice S=spikes C=castle
 *        T=toxic_water E=electric_fence F=goal
 *        /=slope_up_45 \=slope_down_45
 *        [=slope_22_up_left ]=slope_22_up_right {=slope_22_down_left }=slope_22_down_right
 *        V=conveyor_right v=conveyor_left
 * Maps are 14 rows tall.
 */
const LEVELS = (() => {

  const CHAR_TO_TILE = {
    '.': 0, 'G': 1, 'g': 2, '?': 3, 'Q': 4,
    'P': 5, 'p': 7, '-': 9, 'I': 10, 'S': 11,
    'C': 12, 'V': 13, 'T': 14, 'E': 15, 'v': 16,
    '/': 20, '\\': 21, '[': 22, ']': 23, '{': 24, '}': 25,
    'F': 99,
  };

  function parseMap(str) {
    const rows = str.trim().split('\n').map(r => r.trimEnd());
    const height = rows.length;
    const width = Math.max(...rows.map(r => r.length));
    const tiles = [];
    for (let r = 0; r < height; r++) {
      const row = [];
      for (let c = 0; c < width; c++) {
        const ch = (rows[r] || '')[c] || '.';
        row.push(CHAR_TO_TILE[ch] !== undefined ? CHAR_TO_TILE[ch] : 0);
      }
      tiles.push(row);
    }
    return { tiles, width, height };
  }

  function buildLevel(parsed, meta) {
    return {
      ...parsed,
      ...meta,
    };
  }

  // =====================================================================
  // LEVEL 1: Green Hill Zone Act 1 — Tutorial, gentle terrain
  // Width: 150 columns, 14 rows
  // =====================================================================
  const L1 = parseMap(
`......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
......................................................................................................................................................
..........................................................---.........................................................................................
...............................[]..............[].......................[]..................................]GG[......................................
.....................[]......GGGG....---.....GGGG..........---.......GGGG...---..........[]...---.........GGGGGG......................................
.................]GGGGGG[.GGGGGGGG.......GGGGGGGG..---..........GGGGGGGG..........]GGGGGGGG[.......]GGGGGGGGGGG.......................................
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 2: Green Hill Zone Act 2 — Multiple paths, half-pipes
  // Width: 180 columns, 14 rows
  // =====================================================================
  const L2 = parseMap(
`......................................................................................................................................................................................................................................................
......................................................................................................................................................................................................................................................
......................................................................................................................................................................................................................................................
......................................................................................................................................................................................................................................................
......................................................................................................................................................................................................................................................
.....................................---...---..............................---.---..---..................................---..---..............................---.---..---................................
..........................[].....................[]..............[]........................[]..............[].....................[]..............[]........................[].............................
..................]GGGGGGGGGG[............]GGGGGGGG[......}GGGGGGGGGGG{............]GGGGGGGG[......}GGGGGGGGGGG[............]GGGGGGGG[......}GGGGGGGGGGG{............]GGGGGGGG[.......................
...............GGGGGGGGGGGGGGGG..........GGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGG..........GGGGGGGGGG..GGGGGGGGGGGGGGGGGG..........GGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGG..........GGGGGGGGGG....................
............GGGGGGGGGGGGGGGGGGGG......GGGGGGGGGGGGGGGG.GGGGGGGGGGGGGGGGGGGGG......GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG......GGGGGGGGGGGGGGGG.GGGGGGGGGGGGGGGGGGGGG......GGGGGGGGGGGGGG...................
.........GGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGG..................
GGGG../GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG\...GGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 3: Chemical Plant Zone Act 1 — Speed-focused, toxic water
  // Width: 160 columns, 14 rows
  // =====================================================================
  const L3 = parseMap(
`................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
............................----.----.....................................----.----.................................................----.....
.....................CCCC...................CCCC........CCCC..........CCCC...................CCCC........CCCC..........CCCC...................CCCC.
................CCCCCCCC...............CCCCCCCC....CCCCCCCC......CCCCCCCC...............CCCCCCCC....CCCCCCCC......CCCCCCCC...............CCCCCCCC.
.............CCCCCCCCCCC............CCCCCCCCCCC.CCCCCCCCCCC...CCCCCCCCCCC............CCCCCCCCCCC.CCCCCCCCCCC...CCCCCCCCCCC............CCCCCCCCCCC.
CCCC......CCCCCCCCCCCCCC.......CCCCCCCCCCCCCCCCCCCCCCCCCCCC.CCCCCCCCCCCCCC.......CCCCCCCCCCCCCCCCCCCCCCCCCC.CCCCCCCCCCCCCC.......CCCCCCCCCCCCCCC.
CCCCCC..CCCCCCCCCCCCCCCCCC..CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC..CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC..CCCCCCCCCCCCCCCCCCC.
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT`);

  // =====================================================================
  // LEVEL 4: Chemical Plant Zone Act 2 — Conveyors, rising toxic water
  // Width: 180 columns, 14 rows
  // =====================================================================
  const L4 = parseMap(
`....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
.............................................----.----..............................................----.----..............................................----.----.................................................
.......................CCCC..........CCCC........................CCCC..........CCCC........................CCCC..........CCCC........................CCCC..........CCCC..................................
..................CCCCCCCC......CCCCCCCC...........CCCC......CCCCCCCC......CCCCCCCC...........CCCC......CCCCCCCC......CCCCCCCC...........CCCC......CCCCCCCC......CCCCCCCC..............................
..............CCCCCCCCCCC...CCCCCCCCCCC........CCCCCCCC...CCCCCCCCCCC...CCCCCCCCCCC........CCCCCCCC...CCCCCCCCCCC...CCCCCCCCCCC........CCCCCCCC...CCCCCCCCCCC...CCCCCCCCCCC...........................
CCCC.......CCCCCCCCCCCCCC.CCCCCCCCCCCCCC...CCCCCCCCCCC.CCCCCCCCCCCCCC.CCCCCCCCCCCCCC...CCCCCCCCCCC.CCCCCCCCCCCCCC.CCCCCCCCCCCCCC...CCCCCCCCCCC.CCCCCCCCCCCCCC.CCCCCCCCCCCCCC.CCCC....................
CCCCCC..VVVVCCCCCCCCCCCCCCCCCCCCCCCCCCCvvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCVVVCCCCCC....................
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT`);

  // =====================================================================
  // LEVEL 5: Marble Garden Zone Act 1 — Exploration, crumbling platforms
  // Width: 170 columns, 14 rows
  // =====================================================================
  const L5 = parseMap(
`..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..................................---..........---..........---....................................---..........---..........---...................................---..........---..........
......................GGGG..........................GGGG..........................GGGG..........................GGGG..........................GGGG..........................GGGG..........
................]GGGGGGGG[..................]GGGGGGGG[..................]GGGGGGGG[..................]GGGGGGGG[..................]GGGGGGGG[..................]GGGGGGGG[.......
.........../GGGGGGGGGGGGG\............/GGGGGGGGGGGGG\............/GGGGGGGGGGGGG\............/GGGGGGGGGGGGG\............/GGGGGGGGGGGGG\............/GGGGGGGGGGGGG\.......
GGGG...GGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGG.......
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG......
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 6: Marble Garden Zone Act 2 — More slopes, hidden paths
  // Width: 180 columns, 14 rows
  // =====================================================================
  const L6 = parseMap(
`....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
..................................................---..---..........................................................................---..---...................................................................
............................---............---......................---............---......................---............---......................---............---.....................................
...................GGGG..........GGGG..............GGGG..........GGGG..............GGGG..........GGGG..............GGGG..........GGGG..............GGGG..........GGGG..................................
................/GGGGGG\....../GGGGGG\........../GGGGGG\....../GGGGGG\........../GGGGGG\....../GGGGGG\........../GGGGGG\....../GGGGGG\........../GGGGGG\....../GGGGGG\...............................
............/GGGGGGGGGGGGG\/GGGGGGGGGGGGG\../GGGGGGGGGGGGG\/GGGGGGGGGGGGG\../GGGGGGGGGGGGG\/GGGGGGGGGGGGG\../GGGGGGGGGGGGG\/GGGGGGGGGGGGG\../GGGGGGGGGGGGG\/GGGGGGGGGGGGG\..........................
GGGG....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.........................
GGGGG/GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG........................
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG\..GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 7: Ice Cap Zone Act 1 — Ice surfaces, slippery slopes
  // Width: 160 columns, 14 rows
  // =====================================================================
  const L7 = parseMap(
`................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
..............................----.----................................................----.----.................................................----.----........
....................IIII..........................IIII...............IIII..........................IIII...............IIII..........................IIII..............
................/IIIIIII\..................../IIIIIII\........../IIIIIII\..................../IIIIIII\........../IIIIIII\..................../IIIIIII\.............
.........../IIIIIIIIIIIII\............../IIIIIIIIIIIII\...../IIIIIIIIIIIII\............../IIIIIIIIIIIII\...../IIIIIIIIIIIII\............../IIIIIIIIIIIII\..........
IIII.../IIIIIIIIIIIIIIIIIII\......./IIIIIIIIIIIIIIIIIII\/IIIIIIIIIIIIIIIIIII\......./IIIIIIIIIIIIIIIIIII\/IIIIIIIIIIIIIIIIIII\......./IIIIIIIIIIIIIIIIIII\.......
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIII..IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII..IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII..IIIIIIIIIIIIIIIIIIIIIIIIIIIII
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 8: Ice Cap Zone Act 2 — Complex ice, spikes, hard terrain
  // Width: 180 columns, 14 rows
  // =====================================================================
  const L8 = parseMap(
`....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
....................................................................................................................................................................................................................................................
.........................................----.----.............................................----.----.............................................----.----..............................................
......................IIII..........IIII.......................IIII..........IIII.......................IIII..........IIII.......................IIII..........IIII.......................................
................./IIIIIIII\..../IIIIIIII\................/IIIIIIII\..../IIIIIIII\................/IIIIIIII\..../IIIIIIII\................/IIIIIIII\..../IIIIIIII\..................................
............/IIIIIIIIIIIIIII\/IIIIIIIIIIIII\........./IIIIIIIIIIIIIII\/IIIIIIIIIIIII\........./IIIIIIIIIIIIIII\/IIIIIIIIIIIII\........./IIIIIIIIIIIIIII\/IIIIIIIIIIIII\..............................
IIII.../IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\../IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\../IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\../IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\...........................
IIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIISSIIIIIIIIIIIIIIIIIIISSIIIIIIII.IIIIIIIIIIIIIIIIIIIIII
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 9: Scrap Brain Zone Act 1 — Conveyors, electric fences
  // Width: 170 columns, 14 rows
  // =====================================================================
  const L9 = parseMap(
`..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..........................................................................................................................................................................
..............................E.......E...............E.......E...............E.......E...............E.......E...............E.......E...............E.......E....................
....................CCCC..............CCCC..........CCCC..............CCCC..........CCCC..............CCCC..........CCCC..............CCCC..........CCCC..............CCCC..........
..............VVVVCCCCCC.........VVVVCCCCCC....VVVVCCCCCC.........VVVVCCCCCC....VVVVCCCCCC.........VVVVCCCCCC....VVVVCCCCCC.........VVVVCCCCCC....VVVVCCCCCC.........VVVVCCCCCC..
..........CCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCC
CCCC..vvvvCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // =====================================================================
  // LEVEL 10: Scrap Brain Zone Act 2 — Final gauntlet + boss arena
  // Width: 200 columns, 14 rows
  // =====================================================================
  const L10 = parseMap(
`........................................................................................................................................................................................................................................................................................................................................
........................................................................................................................................................................................................................................................................................................................................
........................................................................................................................................................................................................................................................................................................................................
........................................................................................................................................................................................................................................................................................................................................
........................................................................................................................................................................................................................................................................................................................................
..............................E.......E...............E.......E...............E.......E...............E.......E...............E.......E.................................................................................
....................CCCC..............CCCC..........CCCC..............CCCC..........CCCC..............CCCC..........CCCC..............CCCC............................CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
..............VVVVCCCCCC.........vvvvCCCCCC....VVVVCCCCCC.........vvvvCCCCCC....VVVVCCCCCC.........vvvvCCCCCC....VVVVCCCCCC.........vvvvCCCCCC...............CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
..........CCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...CCCCCCCCCCCCCCCCCC.......SCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
CCCC..vvvvCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCvvCCCCCCCCCCCCCCCCCCCC..SSCCCCCCCCC..........................CCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSSSCCCCCCCCCC..........................CCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`);

  // ===== BUILD ALL LEVELS WITH ENTITIES =====

  return [
    // ---- LEVEL 1: Green Hill Zone Act 1 ----
    buildLevel(L1, {
      id: 1,
      name: 'Green Hill Zone',
      zone: 'green_hill',
      act: 1,
      bgColor: '#87CEEB',
      bgLayers: ['clouds_far', 'checker_hills', 'palm_trees', 'flowers'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 3, y: 11 },
        // Rings — generous for kids
        { type: 'ring_line', x: 8, y: 10, count: 5, dir: 'h' },
        { type: 'ring_line', x: 22, y: 9, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 38, y: 7, count: 5 },
        { type: 'ring_line', x: 50, y: 7, count: 6, dir: 'h' },
        { type: 'ring_line', x: 62, y: 10, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 78, y: 6, count: 5 },
        { type: 'ring_line', x: 90, y: 9, count: 4, dir: 'h' },
        { type: 'ring_line', x: 105, y: 10, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 120, y: 7, count: 5 },
        { type: 'ring_line', x: 135, y: 8, count: 4, dir: 'h' },
        // Springs
        { type: 'spring_up', x: 20, y: 11, strong: false },
        { type: 'spring_up', x: 60, y: 11, strong: false },
        { type: 'spring_up', x: 100, y: 11, strong: true },
        { type: 'spring_right', x: 45, y: 11 },
        // Enemies — easy motobugs
        { type: 'motobug', x: 30, y: 11 },
        { type: 'motobug', x: 55, y: 11 },
        { type: 'motobug', x: 85, y: 11 },
        { type: 'motobug', x: 115, y: 11 },
        // Monitors
        { type: 'monitor', x: 25, y: 10, item: 'ring10' },
        { type: 'monitor', x: 70, y: 10, item: 'shield' },
        { type: 'monitor', x: 110, y: 9, item: 'ring10' },
        // Checkpoint
        { type: 'checkpoint', x: 75, y: 11 },
        // Dashpad
        { type: 'dashpad', x: 42, y: 11 },
        // Goal
        { type: 'goal', x: 147, y: 11 },
      ],
    }),

    // ---- LEVEL 2: Green Hill Zone Act 2 ----
    buildLevel(L2, {
      id: 2,
      name: 'Green Hill Zone',
      zone: 'green_hill',
      act: 2,
      bgColor: '#87CEEB',
      bgLayers: ['clouds_far', 'checker_hills', 'palm_trees', 'flowers'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 10 },
        // Rings — lots of them, multiple paths
        { type: 'ring_line', x: 10, y: 10, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 25, y: 5, count: 6 },
        { type: 'ring_line', x: 40, y: 4, count: 5, dir: 'h' },
        { type: 'ring_line', x: 55, y: 10, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 70, y: 5, count: 5 },
        { type: 'ring_line', x: 85, y: 4, count: 4, dir: 'h' },
        { type: 'ring_line', x: 100, y: 10, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 115, y: 5, count: 5 },
        { type: 'ring_line', x: 130, y: 4, count: 5, dir: 'h' },
        { type: 'ring_line', x: 145, y: 10, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 160, y: 5, count: 5 },
        // Dashpads in half-pipes
        { type: 'dashpad', x: 28, y: 11 },
        { type: 'dashpad', x: 73, y: 11 },
        { type: 'dashpad', x: 118, y: 11 },
        { type: 'dashpad', x: 155, y: 11 },
        // Springs — launch to upper paths
        { type: 'spring_up', x: 35, y: 11, strong: true },
        { type: 'spring_up', x: 80, y: 11, strong: true },
        { type: 'spring_up', x: 125, y: 11, strong: true },
        { type: 'spring_right', x: 50, y: 11 },
        { type: 'spring_right', x: 140, y: 11 },
        // Enemies
        { type: 'motobug', x: 20, y: 11 },
        { type: 'motobug', x: 60, y: 11 },
        { type: 'buzzbomber', x: 45, y: 4 },
        { type: 'buzzbomber', x: 95, y: 4 },
        { type: 'motobug', x: 110, y: 11 },
        { type: 'buzzbomber', x: 150, y: 4 },
        { type: 'motobug', x: 165, y: 11 },
        // Monitors
        { type: 'monitor', x: 30, y: 10, item: 'ring10' },
        { type: 'monitor', x: 75, y: 10, item: 'shield' },
        { type: 'monitor', x: 120, y: 10, item: 'speed_shoes' },
        { type: 'monitor', x: 155, y: 10, item: 'ring10' },
        // Checkpoints
        { type: 'checkpoint', x: 65, y: 11 },
        { type: 'checkpoint', x: 130, y: 11 },
        // Goal
        { type: 'goal', x: 175, y: 10 },
      ],
    }),

    // ---- LEVEL 3: Chemical Plant Zone Act 1 ----
    buildLevel(L3, {
      id: 3,
      name: 'Chemical Plant Zone',
      zone: 'chemical_plant',
      act: 1,
      bgColor: '#1A0033',
      bgLayers: ['factory_bg', 'clouds_far'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 10 },
        // Rings on platforms
        { type: 'ring_line', x: 8, y: 9, count: 4, dir: 'h' },
        { type: 'ring_line', x: 25, y: 5, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 40, y: 4, count: 5 },
        { type: 'ring_line', x: 55, y: 9, count: 6, dir: 'h' },
        { type: 'ring_line', x: 72, y: 5, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 88, y: 4, count: 5 },
        { type: 'ring_line', x: 100, y: 9, count: 5, dir: 'h' },
        { type: 'ring_line', x: 120, y: 5, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 138, y: 4, count: 5 },
        // Dashpads — speed sections
        { type: 'dashpad', x: 18, y: 11 },
        { type: 'dashpad', x: 50, y: 11 },
        { type: 'dashpad', x: 85, y: 11 },
        { type: 'dashpad', x: 115, y: 11 },
        { type: 'dashpad', x: 140, y: 11 },
        // Springs
        { type: 'spring_up', x: 22, y: 11, strong: true },
        { type: 'spring_up', x: 68, y: 11, strong: true },
        { type: 'spring_up', x: 112, y: 11, strong: true },
        // Enemies — spinys on platforms
        { type: 'spiny', x: 35, y: 8 },
        { type: 'spiny', x: 65, y: 8 },
        { type: 'spiny', x: 95, y: 8 },
        { type: 'spiny', x: 130, y: 8 },
        // Monitors
        { type: 'monitor', x: 30, y: 9, item: 'flame_shield' },
        { type: 'monitor', x: 80, y: 9, item: 'ring10' },
        { type: 'monitor', x: 125, y: 9, item: 'ring10' },
        { type: 'monitor', x: 148, y: 9, item: 'speed_shoes' },
        // Checkpoint
        { type: 'checkpoint', x: 78, y: 11 },
        // Goal
        { type: 'goal', x: 155, y: 9 },
      ],
    }),

    // ---- LEVEL 4: Chemical Plant Zone Act 2 ----
    buildLevel(L4, {
      id: 4,
      name: 'Chemical Plant Zone',
      zone: 'chemical_plant',
      act: 2,
      bgColor: '#1A0033',
      bgLayers: ['factory_bg', 'clouds_far'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 8 },
        // Rings along conveyor sections
        { type: 'ring_line', x: 12, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 30, y: 4, count: 6 },
        { type: 'ring_line', x: 48, y: 8, count: 5, dir: 'h' },
        { type: 'ring_line', x: 65, y: 4, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 82, y: 4, count: 5 },
        { type: 'ring_line', x: 98, y: 8, count: 6, dir: 'h' },
        { type: 'ring_line', x: 115, y: 4, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 132, y: 4, count: 5 },
        { type: 'ring_line', x: 150, y: 8, count: 6, dir: 'h' },
        { type: 'ring_line', x: 165, y: 4, count: 4, dir: 'h' },
        // Dashpads
        { type: 'dashpad', x: 20, y: 9 },
        { type: 'dashpad', x: 60, y: 9 },
        { type: 'dashpad', x: 100, y: 9 },
        { type: 'dashpad', x: 140, y: 9 },
        // Springs
        { type: 'spring_up', x: 25, y: 9, strong: true },
        { type: 'spring_up', x: 75, y: 9, strong: true },
        { type: 'spring_up', x: 120, y: 9, strong: true },
        { type: 'spring_up', x: 160, y: 9, strong: true },
        // Enemies
        { type: 'spiny', x: 35, y: 7 },
        { type: 'grabber', x: 55, y: 3 },
        { type: 'spiny', x: 80, y: 7 },
        { type: 'grabber', x: 105, y: 3 },
        { type: 'spiny', x: 128, y: 7 },
        { type: 'grabber', x: 148, y: 3 },
        // Monitors
        { type: 'monitor', x: 40, y: 7, item: 'water_shield' },
        { type: 'monitor', x: 90, y: 7, item: 'ring10' },
        { type: 'monitor', x: 135, y: 7, item: 'ring10' },
        { type: 'monitor', x: 170, y: 7, item: 'invincible' },
        // Checkpoints
        { type: 'checkpoint', x: 62, y: 9 },
        { type: 'checkpoint', x: 130, y: 9 },
        // Goal
        { type: 'goal', x: 175, y: 7 },
      ],
    }),

    // ---- LEVEL 5: Marble Garden Zone Act 1 ----
    buildLevel(L5, {
      id: 5,
      name: 'Marble Garden Zone',
      zone: 'marble_garden',
      act: 1,
      bgColor: '#C49B6A',
      bgLayers: ['clouds_far', 'ruins', 'flowers'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 8 },
        // Rings on multiple vertical paths
        { type: 'ring_line', x: 10, y: 8, count: 4, dir: 'h' },
        { type: 'ring_line', x: 18, y: 4, count: 3, dir: 'v' },
        { type: 'ring_arc', x: 30, y: 3, count: 5 },
        { type: 'ring_line', x: 42, y: 8, count: 5, dir: 'h' },
        { type: 'ring_line', x: 55, y: 4, count: 3, dir: 'v' },
        { type: 'ring_arc', x: 68, y: 3, count: 5 },
        { type: 'ring_line', x: 80, y: 8, count: 6, dir: 'h' },
        { type: 'ring_line', x: 95, y: 4, count: 3, dir: 'v' },
        { type: 'ring_arc', x: 108, y: 3, count: 5 },
        { type: 'ring_line', x: 120, y: 8, count: 5, dir: 'h' },
        { type: 'ring_line', x: 135, y: 4, count: 3, dir: 'v' },
        { type: 'ring_arc', x: 148, y: 3, count: 5 },
        // Springs — vertical exploration
        { type: 'spring_up', x: 15, y: 9, strong: true },
        { type: 'spring_up', x: 50, y: 9, strong: true },
        { type: 'spring_up', x: 88, y: 9, strong: false },
        { type: 'spring_up', x: 125, y: 9, strong: true },
        { type: 'spring_right', x: 35, y: 9 },
        { type: 'spring_right', x: 105, y: 9 },
        // Enemies
        { type: 'crabmeat', x: 25, y: 9 },
        { type: 'grabber', x: 45, y: 3 },
        { type: 'crabmeat', x: 65, y: 9 },
        { type: 'grabber', x: 90, y: 3 },
        { type: 'crabmeat', x: 115, y: 9 },
        { type: 'grabber', x: 140, y: 3 },
        // Monitors
        { type: 'monitor', x: 28, y: 8, item: 'ring10' },
        { type: 'monitor', x: 72, y: 8, item: 'shield' },
        { type: 'monitor', x: 110, y: 8, item: 'ring10' },
        { type: 'monitor', x: 150, y: 8, item: 'flame_shield' },
        // Checkpoint
        { type: 'checkpoint', x: 85, y: 9 },
        // Goal
        { type: 'goal', x: 165, y: 8 },
      ],
    }),

    // ---- LEVEL 6: Marble Garden Zone Act 2 ----
    buildLevel(L6, {
      id: 6,
      name: 'Marble Garden Zone',
      zone: 'marble_garden',
      act: 2,
      bgColor: '#C49B6A',
      bgLayers: ['clouds_far', 'ruins', 'flowers'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 8 },
        // Rings across the wavy terrain
        { type: 'ring_line', x: 10, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 25, y: 3, count: 6 },
        { type: 'ring_line', x: 38, y: 5, count: 4, dir: 'h' },
        { type: 'ring_line', x: 52, y: 8, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 68, y: 3, count: 5 },
        { type: 'ring_line', x: 82, y: 5, count: 4, dir: 'h' },
        { type: 'ring_line', x: 95, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 110, y: 3, count: 6 },
        { type: 'ring_line', x: 125, y: 5, count: 5, dir: 'h' },
        { type: 'ring_line', x: 140, y: 8, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 155, y: 3, count: 5 },
        // Springs
        { type: 'spring_up', x: 20, y: 9, strong: true },
        { type: 'spring_up', x: 65, y: 9, strong: true },
        { type: 'spring_up', x: 108, y: 9, strong: true },
        { type: 'spring_up', x: 150, y: 9, strong: false },
        { type: 'spring_right', x: 48, y: 9 },
        { type: 'spring_right', x: 130, y: 9 },
        // Dashpads
        { type: 'dashpad', x: 35, y: 11 },
        { type: 'dashpad', x: 78, y: 11 },
        { type: 'dashpad', x: 120, y: 11 },
        // Enemies
        { type: 'crabmeat', x: 30, y: 9 },
        { type: 'caterkiller', x: 50, y: 9 },
        { type: 'crabmeat', x: 75, y: 9 },
        { type: 'caterkiller', x: 100, y: 9 },
        { type: 'crabmeat', x: 135, y: 9 },
        { type: 'caterkiller', x: 158, y: 9 },
        // Monitors
        { type: 'monitor', x: 22, y: 8, item: 'ring10' },
        { type: 'monitor', x: 70, y: 8, item: 'shield' },
        { type: 'monitor', x: 115, y: 8, item: 'lightning_shield' },
        { type: 'monitor', x: 160, y: 8, item: 'ring10' },
        // Checkpoints
        { type: 'checkpoint', x: 60, y: 11 },
        { type: 'checkpoint', x: 128, y: 11 },
        // Goal
        { type: 'goal', x: 175, y: 10 },
      ],
    }),

    // ---- LEVEL 7: Ice Cap Zone Act 1 ----
    buildLevel(L7, {
      id: 7,
      name: 'Ice Cap Zone',
      zone: 'ice_cap',
      act: 1,
      bgColor: '#0D1B2A',
      bgLayers: ['snow_peaks', 'aurora', 'snowflakes'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 10 },
        // Rings along icy slopes
        { type: 'ring_line', x: 10, y: 9, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 25, y: 5, count: 5 },
        { type: 'ring_line', x: 40, y: 9, count: 6, dir: 'h' },
        { type: 'ring_line', x: 55, y: 5, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 70, y: 5, count: 5 },
        { type: 'ring_line', x: 85, y: 9, count: 5, dir: 'h' },
        { type: 'ring_line', x: 100, y: 5, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 115, y: 5, count: 5 },
        { type: 'ring_line', x: 130, y: 9, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 145, y: 5, count: 5 },
        // Springs
        { type: 'spring_up', x: 20, y: 10, strong: false },
        { type: 'spring_up', x: 52, y: 10, strong: true },
        { type: 'spring_up', x: 98, y: 10, strong: true },
        { type: 'spring_up', x: 140, y: 10, strong: false },
        { type: 'spring_right', x: 35, y: 10 },
        { type: 'spring_right', x: 110, y: 10 },
        // Enemies — penguinators sliding on ice
        { type: 'penguinator', x: 30, y: 10 },
        { type: 'penguinator', x: 62, y: 10 },
        { type: 'penguinator', x: 92, y: 10 },
        { type: 'penguinator', x: 125, y: 10 },
        { type: 'penguinator', x: 148, y: 10 },
        // Monitors
        { type: 'monitor', x: 28, y: 9, item: 'ring10' },
        { type: 'monitor', x: 75, y: 9, item: 'shield' },
        { type: 'monitor', x: 120, y: 9, item: 'ring10' },
        { type: 'monitor', x: 150, y: 9, item: 'water_shield' },
        // Checkpoint
        { type: 'checkpoint', x: 80, y: 11 },
        // Goal
        { type: 'goal', x: 157, y: 10 },
      ],
    }),

    // ---- LEVEL 8: Ice Cap Zone Act 2 ----
    buildLevel(L8, {
      id: 8,
      name: 'Ice Cap Zone',
      zone: 'ice_cap',
      act: 2,
      bgColor: '#0D1B2A',
      bgLayers: ['snow_peaks', 'aurora', 'snowflakes'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 9 },
        // Rings — extra generous for tricky ice level
        { type: 'ring_line', x: 10, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 28, y: 4, count: 6 },
        { type: 'ring_line', x: 45, y: 8, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 62, y: 4, count: 5 },
        { type: 'ring_line', x: 80, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 98, y: 4, count: 6 },
        { type: 'ring_line', x: 115, y: 8, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 132, y: 4, count: 5 },
        { type: 'ring_line', x: 148, y: 8, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 162, y: 4, count: 5 },
        // Springs
        { type: 'spring_up', x: 22, y: 9, strong: true },
        { type: 'spring_up', x: 58, y: 9, strong: true },
        { type: 'spring_up', x: 95, y: 9, strong: true },
        { type: 'spring_up', x: 130, y: 9, strong: true },
        { type: 'spring_up', x: 160, y: 9, strong: false },
        // Dashpads
        { type: 'dashpad', x: 35, y: 10 },
        { type: 'dashpad', x: 75, y: 10 },
        { type: 'dashpad', x: 110, y: 10 },
        { type: 'dashpad', x: 145, y: 10 },
        // Enemies — more penguinators plus spikes in map
        { type: 'penguinator', x: 25, y: 9 },
        { type: 'penguinator', x: 50, y: 9 },
        { type: 'penguinator', x: 70, y: 9 },
        { type: 'penguinator', x: 105, y: 9 },
        { type: 'penguinator', x: 138, y: 9 },
        { type: 'penguinator', x: 165, y: 9 },
        // Monitors
        { type: 'monitor', x: 32, y: 8, item: 'ring10' },
        { type: 'monitor', x: 68, y: 8, item: 'shield' },
        { type: 'monitor', x: 108, y: 8, item: 'ring10' },
        { type: 'monitor', x: 150, y: 8, item: 'invincible' },
        { type: 'monitor', x: 170, y: 8, item: 'life' },
        // Checkpoints
        { type: 'checkpoint', x: 60, y: 10 },
        { type: 'checkpoint', x: 128, y: 10 },
        // Goal
        { type: 'goal', x: 175, y: 9 },
      ],
    }),

    // ---- LEVEL 9: Scrap Brain Zone Act 1 ----
    buildLevel(L9, {
      id: 9,
      name: 'Scrap Brain Zone',
      zone: 'scrap_brain',
      act: 1,
      bgColor: '#2D0000',
      bgLayers: ['gears', 'sparks'],
      hasBoss: false,
      entities: [
        { type: 'spawn', x: 2, y: 8 },
        // Rings on conveyor platforms
        { type: 'ring_line', x: 10, y: 5, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 25, y: 3, count: 5 },
        { type: 'ring_line', x: 40, y: 5, count: 5, dir: 'h' },
        { type: 'ring_line', x: 55, y: 3, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 70, y: 3, count: 5 },
        { type: 'ring_line', x: 85, y: 5, count: 6, dir: 'h' },
        { type: 'ring_line', x: 100, y: 3, count: 4, dir: 'h' },
        { type: 'ring_arc', x: 115, y: 3, count: 5 },
        { type: 'ring_line', x: 130, y: 5, count: 5, dir: 'h' },
        { type: 'ring_line', x: 148, y: 3, count: 4, dir: 'h' },
        // Springs
        { type: 'spring_up', x: 18, y: 9, strong: true },
        { type: 'spring_up', x: 52, y: 9, strong: true },
        { type: 'spring_up', x: 88, y: 9, strong: false },
        { type: 'spring_up', x: 122, y: 9, strong: true },
        { type: 'spring_up', x: 155, y: 9, strong: true },
        // Enemies
        { type: 'ballhog', x: 28, y: 8 },
        { type: 'caterkiller', x: 45, y: 8 },
        { type: 'ballhog', x: 65, y: 8 },
        { type: 'caterkiller', x: 78, y: 8 },
        { type: 'ballhog', x: 105, y: 8 },
        { type: 'caterkiller', x: 135, y: 8 },
        { type: 'ballhog', x: 155, y: 8 },
        // Monitors
        { type: 'monitor', x: 22, y: 5, item: 'ring10' },
        { type: 'monitor', x: 60, y: 5, item: 'flame_shield' },
        { type: 'monitor', x: 95, y: 5, item: 'ring10' },
        { type: 'monitor', x: 140, y: 5, item: 'lightning_shield' },
        { type: 'monitor', x: 162, y: 5, item: 'life' },
        // Checkpoints
        { type: 'checkpoint', x: 55, y: 9 },
        { type: 'checkpoint', x: 120, y: 9 },
        // Goal
        { type: 'goal', x: 167, y: 8 },
      ],
    }),

    // ---- LEVEL 10: Scrap Brain Zone Act 2 (Boss) ----
    buildLevel(L10, {
      id: 10,
      name: 'Scrap Brain Zone',
      zone: 'scrap_brain',
      act: 2,
      bgColor: '#2D0000',
      bgLayers: ['gears', 'sparks'],
      hasBoss: true,
      entities: [
        { type: 'spawn', x: 2, y: 8 },
        // Rings — extra generous before boss
        { type: 'ring_line', x: 10, y: 5, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 25, y: 3, count: 6 },
        { type: 'ring_line', x: 40, y: 5, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 55, y: 3, count: 5 },
        { type: 'ring_line', x: 70, y: 5, count: 6, dir: 'h' },
        { type: 'ring_arc', x: 85, y: 3, count: 5 },
        { type: 'ring_line', x: 100, y: 5, count: 5, dir: 'h' },
        { type: 'ring_arc', x: 115, y: 3, count: 6 },
        { type: 'ring_line', x: 130, y: 5, count: 5, dir: 'h' },
        // Boss arena rings
        { type: 'ring_line', x: 168, y: 8, count: 8, dir: 'h' },
        { type: 'ring_line', x: 175, y: 5, count: 5, dir: 'h' },
        // Springs
        { type: 'spring_up', x: 18, y: 9, strong: true },
        { type: 'spring_up', x: 48, y: 9, strong: true },
        { type: 'spring_up', x: 82, y: 9, strong: true },
        { type: 'spring_up', x: 118, y: 9, strong: true },
        // Dashpads through gauntlet
        { type: 'dashpad', x: 15, y: 9 },
        { type: 'dashpad', x: 45, y: 9 },
        { type: 'dashpad', x: 78, y: 9 },
        { type: 'dashpad', x: 110, y: 9 },
        // Enemies — heavy gauntlet section
        { type: 'ballhog', x: 22, y: 8 },
        { type: 'spiny', x: 35, y: 8 },
        { type: 'caterkiller', x: 52, y: 8 },
        { type: 'ballhog', x: 65, y: 8 },
        { type: 'spiny', x: 75, y: 8 },
        { type: 'caterkiller', x: 90, y: 8 },
        { type: 'ballhog', x: 105, y: 8 },
        { type: 'spiny', x: 120, y: 8 },
        { type: 'caterkiller', x: 135, y: 8 },
        // Monitors — power-ups before boss
        { type: 'monitor', x: 28, y: 5, item: 'ring10' },
        { type: 'monitor', x: 60, y: 5, item: 'shield' },
        { type: 'monitor', x: 95, y: 5, item: 'ring10' },
        { type: 'monitor', x: 125, y: 5, item: 'ring10' },
        { type: 'monitor', x: 155, y: 7, item: 'invincible' },
        { type: 'monitor', x: 165, y: 7, item: 'life' },
        // Checkpoints
        { type: 'checkpoint', x: 50, y: 9 },
        { type: 'checkpoint', x: 110, y: 9 },
        // Goal at the end of boss arena
        { type: 'goal', x: 195, y: 8 },
      ],
    }),
  ];
})();
