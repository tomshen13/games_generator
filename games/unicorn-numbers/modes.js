/**
 * Mode definitions for Unicorn Numbers / Letters.
 * Each mode provides level data, display logic, speech, and localized strings.
 */

// `he` is the fully-vowelized letter name as it should be SPOKEN by TTS.
// Bare letters (e.g. 'ב') or unvowelized names (e.g. 'אלף' = "elef") get
// misread — spellings below are chosen for unambiguous pronunciation.
const HEBREW_LETTER_NAMES = {
  'א': { he: 'אָלֶף', en: 'Alef' },
  'ב': { he: 'בֵּית', en: 'Bet' },
  'ג': { he: 'גִּימֶל', en: 'Gimel' },
  'ד': { he: 'דָּלֶת', en: 'Dalet' },
  'ה': { he: 'הֵי', en: 'Hey' },
  'ו': { he: 'וָו', en: 'Vav' },
  'ז': { he: 'זַיִן', en: 'Zayin' },
  'ח': { he: 'חֵית', en: 'Chet' },
  'ט': { he: 'טֵית', en: 'Tet' },
  'י': { he: 'יוּד', en: 'Yud' },
  'כ': { he: 'כָּף', en: 'Kaf' },
  'ל': { he: 'לָמֶד', en: 'Lamed' },
  'מ': { he: 'מֵם', en: 'Mem' },
  'נ': { he: 'נוּן', en: 'Nun' },
  'ס': { he: 'סָמֶךְ', en: 'Samech' },
  'ע': { he: 'עַיִן', en: 'Ayin' },
  'פ': { he: 'פֵּה', en: 'Pey' },
  'צ': { he: 'צָדִי', en: 'Tsadi' },
  'ק': { he: 'קוּף', en: 'Kuf' },
  'ר': { he: 'רֵישׁ', en: 'Resh' },
  'ש': { he: 'שִׁין', en: 'Shin' },
  'ת': { he: 'תָּו', en: 'Tav' },
};

const ALL_HEBREW_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];

const HEBREW_LETTER_LEVELS = [
  {
    id: 1,
    items: ['א','ב','ג','ד','ה'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Alef to He!',
  },
  {
    id: 2,
    items: ['א','ב','ג','ד','ה'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Alef to He!',
  },
  {
    id: 3,
    items: ['ו','ז','ח','ט','י'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Vav to Yod!',
  },
  {
    id: 4,
    items: ['א','ב','ג','ד','ה','ו','ז','ח','ט','י'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Alef to Yod!',
  },
  {
    id: 5,
    items: ['כ','ל','מ','נ','ס'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Kaf to Samekh!',
  },
  {
    id: 6,
    items: ['ע','פ','צ','ק','ר','ש','ת'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Ayin to Tav!',
  },
  {
    id: 7,
    items: ['כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'],
    targetsPerRound: 5,
    rounds: 5,
    power: 'rainbow',
    title: '🌈 Kaf to Tav!',
  },
  {
    id: 8,
    items: ALL_HEBREW_LETTERS.slice(),
    targetsPerRound: 6,
    rounds: 7,
    power: 'choice',
    title: '🎉 Full Alef-Bet!',
  },
];

const MODES = {
  numbers: {
    id: 'numbers',
    questionType: 'recognition',
    storageKey: 'unicorn-numbers',
    icon: '🔢',
    label: { en: 'Numbers', he: 'מספרים' },
    titleText: { en: 'Unicorn Numbers', he: 'מספרי חד-קרן' },
    subtitle: { en: 'Learn numbers 1–20 with Sparky!', he: '!למדו מספרים 1–20 עם ספארקי' },
    promptText: { en: 'Which number do you hear?', he: '?איזה מספר אני אומר' },
    completeTitle: { en: "You're a Number Wizard!", he: '!את קוסמת של מספרים' },
    completeSpeech: { en: 'You are a Number Wizard!', he: '!את קוסמת של מספרים' },
    completeSubtitle: { en: 'You learned all numbers 1–20!', he: '!למדת את כל המספרים 1–20' },
    congratsSpeech: { en: 'Great job!', he: '!כל הכבוד' },
    displayItem(item) { return String(item); },
    supportsDots: true,
    allItems: Array.from({ length: 20 }, (_, i) => i + 1),
    levels: [], // filled by levels.js
  },

  'hebrew-letters': {
    id: 'hebrew-letters',
    questionType: 'recognition',
    storageKey: 'unicorn-hebrew',
    icon: 'אב',
    label: { en: 'Letters', he: 'אותיות' },
    titleText: { en: 'Unicorn Letters', he: 'אותיות חד-קרן' },
    subtitle: { en: 'Learn the Alef-Bet with Sparky!', he: '!למדו את האלף-בית עם ספארקי' },
    promptText: { en: 'Which letter do you hear?', he: '?איזה אות אני אומר' },
    completeTitle: { en: "You're an Alef-Bet Star!", he: '!את כוכבת האלף-בית' },
    completeSpeech: { en: 'You know the whole Alef Bet!', he: '!את יודעת את כל האלף בית' },
    completeSubtitle: { en: 'You learned the whole Alef-Bet!', he: '!למדת את כל האלף-בית' },
    congratsSpeech: { en: 'Great job!', he: '!כל הכבוד' },
    displayItem(item) { return item; },
    supportsDots: false,
    allItems: ALL_HEBREW_LETTERS,
    levels: HEBREW_LETTER_LEVELS,
  },

  counting: {
    id: 'counting',
    questionType: 'counting',
    storageKey: 'unicorn-counting',
    icon: '🔵',
    label: { en: 'Counting', he: 'ספירה' },
    titleText: { en: 'Unicorn Counting', he: 'ספירת חד-קרן' },
    subtitle: { en: 'Count the dots with Sparky!', he: '!ספרו את הנקודות עם ספארקי' },
    promptText: { en: 'How many dots?', he: '?כמה נקודות' },
    completeTitle: { en: "You're a Counting Star!", he: '!את כוכבת הספירה' },
    completeSpeech: { en: 'You can count everything!', he: '!את יודעת לספור הכל' },
    completeSubtitle: { en: 'You can count up to 10!', he: '!את יודעת לספור עד 10' },
    congratsSpeech: { en: 'Great counting!', he: '!ספירה מצוינת' },
    displayItem(item) { return String(item); },
    supportsDots: false,
    allItems: Array.from({ length: 10 }, (_, i) => i + 1),
    levels: [], // filled by levels.js
  },

  comparison: {
    id: 'comparison',
    questionType: 'comparison',
    storageKey: 'unicorn-comparison',
    icon: '⚖️',
    label: { en: 'Bigger/Smaller', he: 'גדול/קטן' },
    titleText: { en: 'Unicorn Compare', he: 'השוואת חד-קרן' },
    subtitle: { en: 'Which number is bigger?', he: '?איזה מספר גדול יותר' },
    promptText: { en: 'Which is bigger?', he: '?מי גדול יותר' },
    completeTitle: { en: "You're a Comparison Champion!", he: '!את אלופת ההשוואה' },
    completeSpeech: { en: 'You know which number is bigger!', he: '!את יודעת מי גדול יותר' },
    completeSubtitle: { en: 'You can compare all the numbers!', he: '!את יודעת להשוות מספרים' },
    congratsSpeech: { en: 'Awesome!', he: '!מדהים' },
    displayItem(item) { return String(item); },
    supportsDots: false,
    allItems: Array.from({ length: 10 }, (_, i) => i + 1),
    levels: [], // filled by levels.js
  },

  addition: {
    id: 'addition',
    questionType: 'addition',
    storageKey: 'unicorn-addition',
    icon: '➕',
    label: { en: 'Addition', he: 'חיבור' },
    titleText: { en: 'Unicorn Addition', he: 'חיבור חד-קרן' },
    subtitle: { en: 'Add numbers with Sparky!', he: '!חברו מספרים עם ספארקי' },
    promptText: { en: 'What is', he: 'כמה זה' },
    completeTitle: { en: "You're an Addition Master!", he: '!את אלופת החיבור' },
    completeSpeech: { en: 'You can add numbers!', he: '!את יודעת לחבר מספרים' },
    completeSubtitle: { en: 'You learned to add!', he: '!למדת לחבר' },
    congratsSpeech: { en: 'Great adding!', he: '!חיבור מצוין' },
    displayItem(item) { return String(item); },
    supportsDots: false,
    allItems: Array.from({ length: 10 }, (_, i) => i + 1),
    levels: [], // filled by levels.js
  },
};
