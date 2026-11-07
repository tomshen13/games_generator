/**
 * Nikud Castle — nikud, letters, castle rooms (levels) and picture words.
 *
 * Unicode points used below:
 *   shva 05B0, hataf segol 05B1, hataf patach 05B2, hataf kamatz 05B3,
 *   hiriq 05B4, tzere 05B5, segol 05B6, patach 05B7, kamatz 05B8,
 *   holam 05B9, kubutz 05BB, dagesh 05BC, shin dot 05C1, sin dot 05C2
 */

// Spoken stand-ins for each vowel sound. TTS misreads a bare syllable like "בָּ",
// so speech uses an open-syllable spelling: "בָּה", "בִּי", "בּוֹ", "בּוּ", "בֶּה".
const VOWEL_SOUNDS = {
  a: { suffix: 'ָה', alone: 'אָה' },
  e: { suffix: 'ֶה', alone: 'אֶה' },
  i: { suffix: 'ִי', alone: 'אִי' },
  o: { suffix: 'וֹ', alone: 'אוֹ' },
  u: { suffix: 'וּ', alone: 'אוּ' },
};

// Letters used to build practice syllables. Each has one unambiguous sound
// (dagesh on בּ כּ פּ, shin dot on שׁ); א/ע, ח/כ, ט/ת, ק/כּ duplicates are left out.
const SYLLABLE_LETTERS = [
  { ch: 'בּ', sound: 'b' }, { ch: 'מ', sound: 'm' }, { ch: 'ל', sound: 'l' },
  { ch: 'שׁ', sound: 'sh' }, { ch: 'ר', sound: 'r' }, { ch: 'נ', sound: 'n' },
  { ch: 'ד', sound: 'd' }, { ch: 'ת', sound: 't' }, { ch: 'ג', sound: 'g' },
  { ch: 'ס', sound: 's' }, { ch: 'פּ', sound: 'p' }, { ch: 'כּ', sound: 'k' },
  { ch: 'ה', sound: 'h' }, { ch: 'י', sound: 'y' }, { ch: 'ז', sound: 'z' },
  { ch: 'צ', sound: 'ts' },
];

// Hataf vowels sit on guttural letters
const GUTTURAL_LETTERS = [
  { ch: 'א', sound: '' }, { ch: 'ה', sound: 'h' }, { ch: 'ח', sound: 'ch' }, { ch: 'ע', sound: '' },
];

/**
 * Each nikud: name (vowelized, for display + speech), withHa (with the article,
 * for "where is the …?"), sound, display (the mark on a dotted circle) and
 * forms (what follows the letter in a syllable; holam/hiriq/tzere also have
 * their full spelling with ו/י).
 */
const NIKUD = {
  kamatz:      { name: 'קָמָץ', withHa: 'הַקָּמָץ', sound: 'a', display: '◌ָ', forms: ['ָ'] },
  patach:      { name: 'פַּתָּח', withHa: 'הַפַּתָּח', sound: 'a', display: '◌ַ', forms: ['ַ'], sameAs: 'קָמָץ' },
  hiriq:       { name: 'חִירִיק', withHa: 'הַחִירִיק', sound: 'i', display: '◌ִ', forms: ['ִ', 'ִי'] },
  holam:       { name: 'חוֹלָם', withHa: 'הַחוֹלָם', sound: 'o', display: '◌ֹ', forms: ['ֹ', 'וֹ'] },
  shuruk:      { name: 'שׁוּרוּק', withHa: 'הַשּׁוּרוּק', sound: 'u', display: 'וּ', forms: ['וּ'] },
  tzere:       { name: 'צֵירֵי', withHa: 'הַצֵּירֵי', sound: 'e', display: '◌ֵ', forms: ['ֵ', 'ֵי'] },
  segol:       { name: 'סֶגּוֹל', withHa: 'הַסֶּגּוֹל', sound: 'e', display: '◌ֶ', forms: ['ֶ'], sameAs: 'צֵירֵי' },
  kubutz:      { name: 'קֻבּוּץ', withHa: 'הַקֻּבּוּץ', sound: 'u', display: '◌ֻ', forms: ['ֻ'], sameAs: 'שׁוּרוּק' },
  shva:        { name: 'שְׁוָא', withHa: 'הַשְּׁוָא', sound: 'e', display: '◌ְ', forms: ['ְ'] },
  hatafPatach: { name: 'חֲטַף פַּתָּח', withHa: 'הַחֲטַף פַּתָּח', sound: 'a', display: '◌ֲ', forms: ['ֲ'], letters: GUTTURAL_LETTERS },
  hatafSegol:  { name: 'חֲטַף סֶגּוֹל', withHa: 'הַחֲטַף סֶגּוֹל', sound: 'e', display: '◌ֱ', forms: ['ֱ'], letters: GUTTURAL_LETTERS },
  hatafKamatz: { name: 'חֲטַף קָמָץ', withHa: 'הַחֲטַף קָמָץ', sound: 'o', display: '◌ֳ', forms: ['ֳ'], letters: GUTTURAL_LETTERS },
};

// Combining mark → nikud id (holam male / shuruk are resolved from ו in the parser)
const MARK_TO_NIKUD = {
  'ְ': 'shva', 'ֱ': 'hatafSegol', 'ֲ': 'hatafPatach', 'ֳ': 'hatafKamatz',
  'ִ': 'hiriq', 'ֵ': 'tzere', 'ֶ': 'segol', 'ַ': 'patach',
  'ָ': 'kamatz', 'ֹ': 'holam', 'ֻ': 'kubutz',
};

/** Castle rooms = levels. Each unlocks new nikud. */
const ROOMS = [
  { id: 1,  name: 'שער הארמון',   icon: '🚪', nikud: ['kamatz'] },
  { id: 2,  name: 'גן הוורדים',    icon: '🌷', nikud: ['patach'] },
  { id: 3,  name: 'אורוות החד-קרן', icon: '🦄', nikud: ['hiriq'] },
  { id: 4,  name: 'הספרייה',       icon: '📚', nikud: ['holam'] },
  { id: 5,  name: 'המטבח המתוק',   icon: '🧁', nikud: ['shuruk'] },
  { id: 6,  name: 'חדר המוזיקה',   icon: '🎵', nikud: ['tzere'] },
  { id: 7,  name: 'אולם הנשפים',   icon: '💃', nikud: ['segol'] },
  { id: 8,  name: 'חדר השמלות',    icon: '👗', nikud: ['kubutz'] },
  { id: 9,  name: 'המגדל הגבוה',   icon: '🗼', nikud: ['shva'] },
  { id: 10, name: 'חדר הכתר',      icon: '👑', nikud: ['hatafPatach', 'hatafSegol', 'hatafKamatz'] },
];

/** Picture words for "read the word" and "which picture starts like this". */
const WORDS = [
  // kamatz / patach
  { word: 'דָּג', emoji: '🐟' }, { word: 'יָד', emoji: '✋' }, { word: 'צָב', emoji: '🐢' },
  { word: 'פָּרָה', emoji: '🐄' }, { word: 'סָבָא', emoji: '👴' }, { word: 'חָלָב', emoji: '🥛' },
  { word: 'גָּמָל', emoji: '🐫' }, { word: 'נָחָשׁ', emoji: '🐍' }, { word: 'יָם', emoji: '🏖️' },
  { word: 'בָּנָנָה', emoji: '🍌' }, { word: 'סַל', emoji: '🧺' }, { word: 'אַבָּא', emoji: '👨' },
  { word: 'כַּף', emoji: '🥄' }, { word: 'נַעַל', emoji: '👟' }, { word: 'טַבַּעַת', emoji: '💍' },
  { word: 'אַגָּס', emoji: '🍐' },
  // hiriq
  { word: 'אִמָּא', emoji: '👩' }, { word: 'פִּיל', emoji: '🐘' }, { word: 'תִּיק', emoji: '🎒' },
  { word: 'שִׁיר', emoji: '🎵' }, { word: 'פִּיצָה', emoji: '🍕' }, { word: 'מִטָּה', emoji: '🛏️' },
  { word: 'סִירָה', emoji: '⛵' }, { word: 'בַּיִת', emoji: '🏠' }, { word: 'מַיִם', emoji: '💧' },
  { word: 'גִּיטָרָה', emoji: '🎸' },
  // holam
  { word: 'דֹּב', emoji: '🐻' }, { word: 'תֹּף', emoji: '🥁' }, { word: 'כּוֹבַע', emoji: '🎩' },
  { word: 'יוֹנָה', emoji: '🕊️' }, { word: 'בַּלּוֹן', emoji: '🎈' }, { word: 'מָטוֹס', emoji: '✈️' },
  { word: 'כּוֹכָב', emoji: '⭐' }, { word: 'שָׁעוֹן', emoji: '⌚' }, { word: 'שׁוֹקוֹלָד', emoji: '🍫' },
  { word: 'אוֹפַנַּיִם', emoji: '🚲' }, { word: 'צִפּוֹר', emoji: '🐦' },
  // shuruk
  { word: 'סוּס', emoji: '🐴' }, { word: 'תּוּת', emoji: '🍓' }, { word: 'כַּדּוּר', emoji: '⚽' },
  { word: 'תַּפּוּחַ', emoji: '🍎' }, { word: 'חָתוּל', emoji: '🐱' }, { word: 'דּוּבִּי', emoji: '🧸' },
  // tzere
  { word: 'עֵץ', emoji: '🌳' }, { word: 'לֵב', emoji: '❤️' }, { word: 'בֵּיצָה', emoji: '🥚' },
  { word: 'כִּסֵּא', emoji: '🪑' }, { word: 'שֵׁן', emoji: '🦷' },
  // segol
  { word: 'כֶּלֶב', emoji: '🐕' }, { word: 'שֶׁמֶשׁ', emoji: '☀️' }, { word: 'דֶּלֶת', emoji: '🚪' },
  { word: 'כֶּתֶר', emoji: '👑' }, { word: 'גֶּשֶׁם', emoji: '🌧️' }, { word: 'לֶחֶם', emoji: '🍞' },
  { word: 'יֶלֶד', emoji: '👦' }, { word: 'מֶלֶךְ', emoji: '🤴' }, { word: 'סֵפֶר', emoji: '📖' },
  { word: 'פֶּרַח', emoji: '🌸' }, { word: 'רַכֶּבֶת', emoji: '🚂' },
  // kubutz
  { word: 'בֻּבָּה', emoji: '🪆' }, { word: 'סֻכָּרִיָּה', emoji: '🍬' }, { word: 'דֻּבְדְּבָן', emoji: '🍒' },
  // shva
  { word: 'נְסִיכָה', emoji: '👸' }, { word: 'שִׂמְלָה', emoji: '👗' }, { word: 'אַרְנָב', emoji: '🐰' },
  { word: 'עַכְבָּר', emoji: '🐭' }, { word: 'פַּרְפַּר', emoji: '🦋' }, { word: 'דְּבוֹרָה', emoji: '🐝' },
  { word: 'נְמָלָה', emoji: '🐜' }, { word: 'סַבְתָּא', emoji: '👵' }, { word: 'מְכוֹנִית', emoji: '🚗' },
  { word: 'צְפַרְדֵּעַ', emoji: '🐸' }, { word: 'כִּבְשָׂה', emoji: '🐑' }, { word: 'דְּבַשׁ', emoji: '🍯' },
  { word: 'אַרְמוֹן', emoji: '🏰' }, { word: 'שַׁבְּלוּל', emoji: '🐌' }, { word: 'אַרְיֵה', emoji: '🦁' },
  // hataf
  { word: 'אֲבַטִּיחַ', emoji: '🍉' }, { word: 'עֲנָבִים', emoji: '🍇' }, { word: 'יַהֲלוֹם', emoji: '💎' },
  { word: 'אֳנִיָּה', emoji: '🚢' }, { word: 'אֱגוֹז', emoji: '🌰' },
];

const PRAISE = ['כָּל הַכָּבוֹד!', 'מְצֻיָּן!', 'יָפֶה מְאוֹד!', 'אֵיזוֹ נְסִיכָה חֲכָמָה!', 'וָואו!'];

// ── Helpers derived from the data ──

const NikudData = (() => {
  const isLetter = ch => ch >= 'א' && ch <= 'ת';
  const isMark = ch => ch >= '֑' && ch <= 'ׇ';

  /** Split a vowelized word into letter clusters: [{ letter, marks }] */
  function clusters(word) {
    const out = [];
    for (const ch of word) {
      if (isLetter(ch)) out.push({ letter: ch, marks: '' });
      else if (isMark(ch) && out.length) out[out.length - 1].marks += ch;
    }
    return out;
  }

  /** Nikud id carried by a ו cluster acting as a vowel letter, if any */
  function vavVowel(c) {
    if (c.letter !== 'ו') return null;
    if (c.marks === 'ֹ') return 'holam';
    if (c.marks === 'ּ') return 'shuruk';
    return null;
  }

  /** All nikud ids a word uses. A final silent shva (מֶלֶךְ) doesn't count. */
  function wordNikud(word) {
    const cs = clusters(word);
    const ids = new Set();
    cs.forEach((c, i) => {
      const vav = vavVowel(c);
      if (vav && i > 0 && !hasVowel(cs[i - 1])) { ids.add(vav); return; }
      for (const m of c.marks) {
        const id = MARK_TO_NIKUD[m];
        if (!id) continue;
        if (id === 'shva' && i === cs.length - 1) continue;
        ids.add(id);
      }
    });
    return [...ids];
  }

  function hasVowel(c) {
    return [...c.marks].some(m => MARK_TO_NIKUD[m]);
  }

  /** Consonant sound of a cluster (dagesh / shin-sin dots matter) */
  function consonantSound(c) {
    const dagesh = c.marks.includes('ּ');
    switch (c.letter) {
      case 'א': case 'ע': return '';
      case 'ב': return dagesh ? 'b' : 'v';
      case 'כ': case 'ך': return dagesh ? 'k' : 'ch';
      case 'פ': case 'ף': return dagesh ? 'p' : 'f';
      case 'ש': return c.marks.includes('ׂ') ? 's' : 'sh';
      case 'ח': return 'ch';
      case 'ט': case 'ת': return 't';
      case 'ק': return 'k';
      case 'ו': return 'v';
      case 'ג': return 'g'; case 'ד': return 'd'; case 'ה': return 'h';
      case 'ז': return 'z'; case 'י': return 'y'; case 'ל': return 'l';
      case 'מ': case 'ם': return 'm'; case 'נ': case 'ן': return 'n';
      case 'ס': return 's'; case 'צ': case 'ץ': return 'ts'; case 'ר': return 'r';
      default: return c.letter;
    }
  }

  /**
   * First syllable of a word: { text, nikud, sound } — e.g. "כּוֹ" / holam / "ko".
   * Includes a following וֹ / וּ / mater י so the display matches what's read.
   */
  function firstSyllable(word) {
    const cs = clusters(word);
    if (!cs.length) return null;
    const first = cs[0];
    let text = first.letter + first.marks;
    let nikud = null;
    for (const m of first.marks) if (MARK_TO_NIKUD[m]) nikud = MARK_TO_NIKUD[m];
    const next = cs[1];
    if (!nikud && next && vavVowel(next)) {
      nikud = vavVowel(next);
      text += next.letter + next.marks;
    } else if ((nikud === 'hiriq' || nikud === 'tzere') && next && next.letter === 'י' && !next.marks && cs.length > 2) {
      text += 'י';
    }
    if (!nikud) return null;
    return { text, nikud, sound: consonantSound(first) + NIKUD[nikud].sound };
  }

  /** All practice syllables for one nikud: { key, text, spoken, sound, nikud } */
  function syllablesFor(nikudId) {
    const nk = NIKUD[nikudId];
    const letters = nk.letters || SYLLABLE_LETTERS;
    const out = [];
    letters.forEach(l => {
      nk.forms.forEach((form, fi) => {
        // Holam dot collides with the shin dot; skip that one combination
        if (nikudId === 'holam' && fi === 0 && l.ch === 'שׁ') return;
        // Hiriq/tzere on י with a mater י reads as a doubled letter; keep the short form
        if (l.ch === 'י' && form.length > 1 && form.endsWith('י')) return;
        out.push({
          key: `s:${l.ch}${form}`,
          text: l.ch + form,
          spoken: l.ch + VOWEL_SOUNDS[nk.sound].suffix,
          sound: l.sound + nk.sound,
          letter: l.ch,
          nikud: nikudId,
        });
      });
    });
    return out;
  }

  /** Nikud ids unlocked up to and including room index */
  function unlockedNikud(roomIdx) {
    const ids = [];
    for (let i = 0; i <= roomIdx && i < ROOMS.length; i++) ids.push(...ROOMS[i].nikud);
    return ids;
  }

  return { clusters, wordNikud, firstSyllable, syllablesFor, unlockedNikud, consonantSound };
})();
